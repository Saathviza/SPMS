const pool = require('../config/db.config');

const LeaderController = {
    // Get all scouts in leader's group
    getScouts: async (req, res) => {
        try {
            const user_id = req.user.user_id || req.user.id;

            // Get leader's group association
            const [leaderProfiles] = await pool.query(
                "SELECT scout_group_id FROM scout_leaders WHERE user_id = ?",
                [user_id]
            );

            if (leaderProfiles.length === 0) {
                return res.status(200).json([]);
            }

            const groupIds = leaderProfiles.map(p => p.scout_group_id);

            // Get all scouts in these groups
            const [scouts] = await pool.query(
                `SELECT DISTINCT s.id, u.full_name as name, u.email, TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) as age, sg.group_name,
                (SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = s.id AND progress_type = 'COMPLETED') as badges_earned,
                (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = s.id AND activity_status = 'COMPLETED') as activities_completed
                 FROM scouts s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN scout_groups sg ON s.scout_group_id = sg.id
                 WHERE s.scout_group_id IN (?)
                 ORDER BY sg.group_name, u.full_name`,
                [groupIds]
            );

            res.status(200).json(scouts);
        } catch (err) {
            console.error("❌ GET SCOUTS ERROR:", err);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get pending activities for approval
    getPendingActivities: async (req, res) => {
        try {
            const user_id = req.user.user_id || req.user.id;

            const [leaderProfiles] = await pool.query(
                "SELECT scout_group_id FROM scout_leaders WHERE user_id = ?",
                [user_id]
            );

            if (leaderProfiles.length === 0) {
                return res.status(200).json([]);
            }

            const groupIds = leaderProfiles.map(p => p.scout_group_id);

            // Get pending activities for all scouts in these groups
            const [activities] = await pool.query(
                `SELECT laa.*, a.activity_name as activity_name, a.activity_date as date, a.location,
                        u.full_name as scout_name, u.email as scout_email, laa.id as approval_id,
                        COALESCE(
                            (SELECT NULLIF(TRIM(comment), '') FROM activity_submissions WHERE id = laa.proof_submission_id),
                            (SELECT NULLIF(TRIM(comment), '') FROM activity_submissions WHERE registration_id IN (SELECT id FROM activity_registrations WHERE scout_id = laa.scout_id AND activity_id = laa.activity_id) ORDER BY id DESC LIMIT 1),
                            (SELECT NULLIF(TRIM(aps.additional_comments), '') FROM activity_proof_submissions aps JOIN activity_tracking t ON aps.tracking_id = t.id WHERE t.scout_id = laa.scout_id AND t.activity_id = laa.activity_id ORDER BY aps.id DESC LIMIT 1),
                            (SELECT NULLIF(TRIM(notes), '') FROM activity_tracking WHERE scout_id = laa.scout_id AND activity_id = laa.activity_id ORDER BY id DESC LIMIT 1)
                        ) as scout_submission_notes,
                        (SELECT GROUP_CONCAT(f.storage_key) 
                         FROM activity_submission_files asf 
                         JOIN files f ON asf.file_id = f.id 
                         WHERE asf.submission_id = laa.proof_submission_id
                            OR asf.submission_id IN (SELECT id FROM activity_submissions WHERE registration_id IN (SELECT id FROM activity_registrations WHERE scout_id = laa.scout_id AND activity_id = laa.activity_id))
                        ) as scout_evidence_files
                 FROM leader_activity_approvals laa
                 JOIN activities a ON laa.activity_id = a.id
                 JOIN scouts s ON laa.scout_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE s.scout_group_id IN (?) AND laa.approval_status = 'PENDING'
                 GROUP BY laa.id
                 ORDER BY a.activity_date DESC`,
                [groupIds]
            );

            res.status(200).json(activities);
        } catch (err) {
            console.error("❌ GET PENDING ACTIVITIES ERROR:", err);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Approve activity
    approveActivity: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { approval_id, review_note } = req.body;
            const reviewer_id = req.user.user_id || req.user.id;

            await connection.beginTransaction();

            // 1. Get info
            const [info] = await connection.query(
                "SELECT scout_id, activity_id FROM leader_activity_approvals WHERE id = ?",
                [approval_id]
            );

            if (info.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: "Approval record not found" });
            }

            const { scout_id, activity_id } = info[0];

            // 1.5 Fetch scout info and activity for email
            const [scoutDetails] = await connection.query(
                `SELECT u.email, u.full_name, a.activity_name 
                 FROM scouts s 
                 JOIN users u ON s.user_id = u.id 
                 JOIN activities a ON a.id = ? 
                 WHERE s.id = ?`,
                [activity_id, scout_id]
            );

            // 2. Update status in approval record
            await connection.query(
                `UPDATE leader_activity_approvals 
                 SET approval_status = 'APPROVED', leader_user_id = ?, decided_at = NOW(), 
                     leader_comment = ?
                 WHERE id = ?`,
                [reviewer_id, review_note || 'Approved by leader', approval_id]
            );

            // 3. Update main tracking record to 'COMPLETED' (This reflects on dashboard counts)
            await connection.query(
                `UPDATE activity_tracking 
                 SET activity_status = 'COMPLETED', action_status = 'VERIFIED'
                 WHERE scout_id = ? AND activity_id = ?`,
                [scout_id, activity_id]
            );

            // 4. INTELLIGENT AUTO-PROGRESS FOR DEMO:
            // Link activity categories to badge progress automatically
            const [actDetails] = await connection.query("SELECT category FROM activities WHERE id = ?", [activity_id]);
            if (actDetails.length > 0) {
                const cat = actDetails[0].category;
                let badgeId = null;
                if (cat === 'CAMPING') badgeId = 2; // Camping
                if (cat === 'TRAINING') badgeId = 5; // Leadership
                if (cat === 'SERVICE') badgeId = 6;  // Community Service
                if (cat === 'FIRST_AID') badgeId = 1; // First Aid

                if (badgeId) {
                    // Increment requirements_met and calculate %
                    await connection.query(
                        `INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements)
                         VALUES (?, ?, 'PENDING', 20.00, 1, 5)
                         ON DUPLICATE KEY UPDATE 
                            requirements_met = LEAST(requirements_met + 1, total_requirements),
                            completion_percentage = (requirements_met / total_requirements) * 100,
                            progress_type = CASE WHEN requirements_met >= total_requirements THEN 'ELIGIBLE' ELSE 'PENDING' END`,
                        [scout_id, badgeId]
                    );
                }
            }

            // 🏆 AUTOMATED GRADUATION CHECK: President's Award
            const [stats] = await connection.query(
                `SELECT 
                    (SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = ? AND progress_type = 'COMPLETED') as badges,
                    (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = ? AND activity_status = 'COMPLETED') as activities`,
                [scout_id, scout_id]
            );
            
            if (stats.length > 0 && stats[0].badges >= 21 && stats[0].activities >= 24) {
                 // Trigger President's Award notification
                 const io = req.app.io;
                 if (io) {
                     io.to('scout').emit('scout:graduated', { 
                        scout_id, 
                        message: "🎖️ UNBELIEVABLE! You have reached the President's Award Milestone!" 
                     });
                 }
            }

            await connection.commit();

            // 🔔 Real-time: notify scout their proof was approved
            const io = req.app.io;
            if (io) {
                io.to('scout').emit('proof:approved', {
                    scout_id,
                    activity_id,
                    message: 'Your activity proof has been approved by the leader!'
                });
                io.to('leader').emit('approval:done', { approval_id });
            }

            // 📧 Send Background Email Verification
            if (scoutDetails.length > 0) {
                const notificationEmitter = require('../events/notification.events');
                notificationEmitter.emit('activity_updated', {
                    userEmail: scoutDetails[0].email,
                    scoutName: scoutDetails[0].full_name,
                    activityName: scoutDetails[0].activity_name,
                    status: 'APPROVED'
                });
            }

            res.status(200).json({ message: "Activity approved and scout's badge progress updated automatically!" });
        } catch (err) {
            if (connection) await connection.rollback();
            console.error("❌ APPROVE ACTIVITY ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        } finally {
            if (connection) connection.release();
        }
    },

    // Reject activity
    rejectActivity: async (req, res) => {
        try {
            const { approval_id, review_note } = req.body;
            const reviewer_id = req.user.user_id || req.user.id;

            if (!review_note) {
                return res.status(400).json({ message: "Review note is required for rejection." });
            }

            // 1. Update approval record
            const [result] = await pool.query(
                `UPDATE leader_activity_approvals 
                 SET approval_status = 'REJECTED', leader_user_id = ?, decided_at = NOW(), 
                     leader_comment = ?
                 WHERE id = ?`,
                [reviewer_id, review_note, approval_id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Approval record not found" });
            }

            // 2. We can also reset the tracking record to 'PENDING' so the scout can resubmit proof
            const [info] = await pool.query(
                "SELECT scout_id, activity_id FROM leader_activity_approvals WHERE id = ?",
                [approval_id]
            );

            if (info.length > 0) {
                await pool.query(
                    "UPDATE activity_tracking SET activity_status = 'PENDING' WHERE scout_id = ? AND activity_id = ?",
                    [info[0].scout_id, info[0].activity_id]
                );

                // Fetch details for email
                const [scoutDetails] = await pool.query(
                    `SELECT u.email, u.full_name, a.activity_name 
                     FROM scouts s 
                     JOIN users u ON s.user_id = u.id 
                     JOIN activities a ON a.id = ? 
                     WHERE s.id = ?`,
                    [info[0].activity_id, info[0].scout_id]
                );

                if (scoutDetails.length > 0) {
                    const notificationEmitter = require('../events/notification.events');
                    notificationEmitter.emit('activity_updated', {
                        userEmail: scoutDetails[0].email,
                        scoutName: scoutDetails[0].full_name,
                        activityName: scoutDetails[0].activity_name,
                        status: 'REJECTED'
                    });
                }
            }

            res.status(200).json({ message: "Activity submission rejected." });

            // 🔔 Real-time: notify scout their proof was rejected
            const io = req.app.io;
            if (io && info.length > 0) {
                io.to('scout').emit('proof:rejected', {
                    scout_id: info[0].scout_id,
                    activity_id: info[0].activity_id,
                    message: 'Your activity proof was rejected. Please resubmit.'
                });
                io.to('leader').emit('approval:done', { approval_id });
            }
        } catch (err) {
            console.error("❌ REJECT ACTIVITY ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get real-time report statistics and detailed data
    getReports: async (req, res) => {
        try {
            const user_id = req.user.user_id || req.user.id;

            // 1. Get leader's group
            const [leaderProfiles] = await pool.query(
                "SELECT sl.scout_group_id, sg.group_name FROM scout_leaders sl JOIN scout_groups sg ON sl.scout_group_id = sg.id WHERE sl.user_id = ?",
                [user_id]
            );

            if (leaderProfiles.length === 0) {
                return res.status(404).json({ message: "No group found for this leader" });
            }

            const groupId = leaderProfiles[0].scout_group_id;
            const groupName = leaderProfiles[0].group_name;

            // 2. Fetch Scouts in Group
            const [scouts] = await pool.query(
                "SELECT id, user_id FROM scouts WHERE scout_group_id = ?",
                [groupId]
            );
            const scoutIds = scouts.map(s => s.id);

            if (scoutIds.length === 0) {
                return res.status(200).json({
                    groupName,
                    scoutCount: 0,
                    monthlyReport: { activities: [], newBadges: [] },
                    badgeReport: { list: [] },
                    attendanceReport: { activities: [] }
                });
            }

            // 3. MONTHLY PROGRESS - Fetch activities and badges for the LAST 30 DAYS
            const [monthlyActivities] = await pool.query(
                `SELECT a.activity_name, a.activity_date, u.full_name as scout_name, t.activity_status
                 FROM activity_tracking t
                 JOIN activities a ON t.activity_id = a.id
                 JOIN scouts s ON t.scout_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE t.scout_id IN (?) AND (a.activity_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) OR t.activity_status = 'COMPLETED')
                 ORDER BY a.activity_date DESC LIMIT 20`,
                [scoutIds]
            );

            const [monthlyBadges] = await pool.query(
                `SELECT b.badge_name, u.full_name as scout_name, sbp.achieved_date
                 FROM scout_badge_progress sbp
                 JOIN badges b ON sbp.badge_id = b.id
                 JOIN scouts s ON sbp.scout_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE sbp.scout_id IN (?) AND sbp.progress_type = 'COMPLETED'
                 ORDER BY sbp.achieved_date DESC LIMIT 10`,
                [scoutIds]
            );

            // 4. BADGE ACHIEVEMENT - Fetch badge counts for all scouts in group
            const [badgeCounts] = await pool.query(
                `SELECT u.full_name as scout_name, 
                        COUNT(CASE WHEN sbp.progress_type = 'COMPLETED' THEN 1 END) as completed,
                        COUNT(CASE WHEN sbp.progress_type = 'ELIGIBLE' THEN 1 END) as eligible,
                        COUNT(CASE WHEN sbp.progress_type = 'PENDING' THEN 1 END) as in_progress
                 FROM scouts s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN scout_badge_progress sbp ON s.id = sbp.scout_id
                 WHERE s.scout_group_id = ?
                 GROUP BY s.id, u.full_name
                 ORDER BY u.full_name`,
                [groupId]
            );

            // 5. ATTENDANCE REPORT - Fetch activity attendance for the group
            const [attendanceData] = await pool.query(
                `SELECT a.activity_name, a.activity_date, 
                        COUNT(DISTINCT ar.scout_id) as registered,
                        COUNT(DISTINCT CASE WHEN t.activity_status = 'COMPLETED' THEN t.scout_id END) as attended
                 FROM activities a
                 JOIN activity_registrations ar ON a.id = ar.activity_id
                 LEFT JOIN activity_tracking t ON (ar.scout_id = t.scout_id AND ar.activity_id = t.activity_id)
                 WHERE ar.scout_id IN (?)
                 GROUP BY a.id, a.activity_name, a.activity_date
                 ORDER BY a.activity_date DESC LIMIT 15`,
                [scoutIds]
            );

            res.status(200).json({
                groupName,
                scoutCount: scouts.length,
                monthlyReport: {
                    activities: monthlyActivities,
                    newBadges: monthlyBadges
                },
                badgeReport: {
                    list: badgeCounts
                },
                attendanceReport: {
                    activities: attendanceData
                }
            });

        } catch (err) {
            console.error("❌ GET REAL-TIME REPORTS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get real-time report file data for specific type
    getReportFile: async (req, res) => {
        try {
            const { type } = req.params;
            const user_id = req.user.user_id || req.user.id;

            // Fetch group info
            const [groupRows] = await pool.query(
                "SELECT sg.group_name, sl.scout_group_id FROM scout_leaders sl JOIN scout_groups sg ON sl.scout_group_id = sg.id WHERE sl.user_id = ?",
                [user_id]
            );
            
            if (groupRows.length === 0) return res.status(404).json({ message: "No group found" });
            const groupId = groupRows[0].scout_group_id;
            const groupName = groupRows[0].group_name;

            const [scoutRows] = await pool.query("SELECT id FROM scouts WHERE scout_group_id = ?", [groupId]);
            const scoutIds = scoutRows.map(s => s.id);

            let data = {};
            const reportType = type.toLowerCase();

            if (reportType.includes('monthly')) {
                const [activities] = await pool.query(
                    `SELECT u.full_name as scout, a.activity_name as activity, t.activity_status as status, a.activity_date as date
                     FROM activity_tracking t 
                     JOIN activities a ON t.activity_id = a.id
                     JOIN scouts s ON t.scout_id = s.id
                     JOIN users u ON s.user_id = u.id
                     WHERE t.scout_id IN (?) ORDER BY a.activity_date DESC LIMIT 50`, [scoutIds]
                );
                data = { title: "Monthly Progress Report", activities, generated_at: new Date() };
            } else if (reportType.includes('badge')) {
                const [badges] = await pool.query(
                    `SELECT u.full_name as scout, b.badge_name as badge, sbp.progress_type as status, sbp.achieved_date as date
                     FROM scout_badge_progress sbp
                     JOIN badges b ON sbp.badge_id = b.id
                     JOIN scouts s ON sbp.scout_id = s.id
                     JOIN users u ON s.user_id = u.id
                     WHERE sbp.scout_id IN (?) ORDER BY u.full_name`, [scoutIds]
                );
                data = { title: "Badge Achievement Report", badges, generated_at: new Date() };
            } else if (reportType.includes('attendance')) {
                const [attendance] = await pool.query(
                    `SELECT a.activity_name as activity, a.activity_date as date, 
                            COUNT(ar.scout_id) as total_scouts,
                            COUNT(CASE WHEN t.activity_status = 'COMPLETED' THEN 1 END) as attended
                     FROM activities a
                     LEFT JOIN activity_registrations ar ON a.id = ar.activity_id
                     LEFT JOIN activity_tracking t ON (ar.scout_id = t.scout_id AND ar.activity_id = t.activity_id)
                     WHERE ar.scout_id IN (?) GROUP BY a.id ORDER BY a.activity_date DESC`, [scoutIds]
                );
                data = { title: "Attendance Report", attendance, generated_at: new Date() };
            } else if (reportType.includes('roster')) {
                const [roster] = await pool.query(
                    `SELECT u.full_name as scout, u.email, s.id as scout_id, 
                            (SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = s.id AND progress_type = 'COMPLETED') as badges,
                            (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = s.id AND activity_status = 'COMPLETED') as activities,
                            (SELECT CASE WHEN COUNT(*) >= 21 AND (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = s.id AND activity_status = 'COMPLETED') >= 24 THEN 'GRADUATED' ELSE 'ACTIVE' END FROM scout_badge_progress WHERE scout_id = s.id AND progress_type = 'COMPLETED') as award_status
                     FROM scouts s
                     JOIN users u ON s.user_id = u.id
                     WHERE s.scout_group_id = ? ORDER BY u.full_name`, [groupId]
                );
                data = { title: "Full Troop Roster Progress Book", roster, generated_at: new Date() };
            } else {
                return res.status(404).json({ message: "Report type not found" });
            }

            res.status(200).json({
                success: true,
                title: data.title,
                groupName,
                data: data,
                generated_at: new Date()
            });
        } catch (err) {
            console.error("❌ GET REPORT FILE DATA ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = LeaderController;

