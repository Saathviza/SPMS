const pool = require('../config/db.config');
const emailService = require('../services/emailService');

const ExaminerController = {
    // Get pending badges for evaluation
    getPendingBadges: async (req, res) => {
        try {
            const userId = req.user.user_id || req.user.id;
            
            // 1. Identify Examiner's District
            const [examinerRows] = await pool.query("SELECT district FROM badge_examiners WHERE user_id = ?", [userId]);
            const examinerDistrict = examinerRows.length > 0 ? examinerRows[0].district : null;

            // 2. Fetch pending badges filtered by District (Hierarchy Enforcement)
            let query = `
                SELECT bs.*, b.badge_name as name, b.description, b.level_name as badge_level,
                        u.full_name as scout_name, u.email as scout_email, TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) as age,
                        s.district as scout_district
                 FROM badge_submissions bs
                 JOIN badges b ON bs.badge_id = b.id
                 JOIN scouts s ON bs.scout_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE bs.status = 'PENDING'
            `;
            let params = [];

            // Only filter if they are an examiner (Admins see all for national oversight)
            if (examinerDistrict && req.user.role === 'EXAMINER') {
                query += " AND s.district = ?";
                params.push(examinerDistrict);
            }

            query += " ORDER BY bs.submitted_at ASC";

            const [badges] = await pool.query(query, params);
            res.status(200).json(badges);
        } catch (err) {
            console.error("❌ GET PENDING BADGES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },
    // Approve badge
    approveBadge: async (req, res) => {
        try {
            const { id, feedback } = req.body; // 'id' here is bs.id
            const examiner_user_id = req.user.user_id || req.user.id;

            // 1. Get scout and badge info first
            const [info] = await pool.query(
                `SELECT bs.scout_id, b.badge_name as badge_name, b.id as badge_id, u.email as scout_email, u.full_name as scout_name
                 FROM badge_submissions bs
                 JOIN badges b ON bs.badge_id = b.id
                 JOIN scouts s ON bs.scout_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE bs.id = ?`,
                [id]
            );

            if (info.length === 0) {
                return res.status(404).json({ message: "Badge application not found" });
            }

            const { scout_email, scout_name, badge_name } = info[0];

            // 2. Update status (Triggers award insertion automatically)
            await pool.query(
                `UPDATE badge_submissions 
                 SET status = 'APPROVED', reviewed_at = NOW(), reviewed_by_examiner_user_id = ?, examiner_comment = ?
                 WHERE id = ?`,
                [examiner_user_id, feedback || 'Badge approved', id]
            );

            // Sync with scout_badge_progress securely
            const [progExist] = await pool.query(
                "SELECT id FROM scout_badge_progress WHERE scout_id = ? AND badge_id = ?",
                [info[0].scout_id, info[0].badge_id]
            );

            if (progExist.length > 0) {
                await pool.query(
                    "UPDATE scout_badge_progress SET progress_type = 'COMPLETED', achieved_date = NOW(), completion_percentage = 100 WHERE id = ?",
                    [progExist[0].id]
                );
            } else {
                await pool.query(
                    "INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, achieved_date) VALUES (?, ?, 'COMPLETED', 100, NOW())",
                    [info[0].scout_id, info[0].badge_id]
                );
            }

            // 3. Send congratulatory email & Community Broadcast via Queue
            const notificationEmitter = require('../events/notification.events');
            
            // Query common members in scout's group
            const [groupScouts] = await pool.query(
                `SELECT u.email FROM scouts s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.scout_group_id = (SELECT scout_group_id FROM scouts WHERE id = ?)
                 AND s.id != ? AND u.status = 'ACTIVE'`,
                [info[0].scout_id, info[0].scout_id]
            );
            const groupEmails = groupScouts.map(s => s.email);

            notificationEmitter.emit('badge_awarded', {
                userEmail: scout_email,
                scoutName: scout_name,
                badgeName: badge_name,
                groupEmails: groupEmails
            });

            const io = req.app.io;
            if (io) {
                io.to('scout').emit('badge:status:changed', {
                    scout_id: info[0].scout_id,
                    badge_name: badge_name,
                    status: 'APPROVED'
                });

                // Notify leaders so they see the scout's badge count update in their roster
                io.to('leader').emit('roster:updated', { 
                    scout_id: info[0].scout_id, 
                    scout_name: badge_name, // Reusing field for context if needed
                    action: 'APPROVED'
                });

                // 🏆 AUTOMATED GRADUATION CHECK
                const [stats] = await pool.query(
                    `SELECT 
                        (SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = ? AND progress_type = 'COMPLETED') as badges,
                        (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = ? AND activity_status = 'COMPLETED') as activities`,
                    [info[0].scout_id, info[0].scout_id]
                );
                
                if (stats.length > 0 && stats[0].badges >= 21 && stats[0].activities >= 24) {
                    io.to('scout').emit('scout:graduated', { 
                        scout_id: info[0].scout_id, 
                        message: "🎖️ MISSION ACCOMPLISHED! You have achieved the President's Scout Award!" 
                    });
                    
                    // Also notify leader of graduation
                    io.to('leader').emit('scout:graduated', { scout_id: info[0].scout_id });
                }
            }

            res.status(200).json({ message: "Badge approved, congratulations sent, and community notified!" });
        } catch (err) {
            console.error("❌ APPROVE BADGE ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Reject badge
    rejectBadge: async (req, res) => {
        try {
            const { id, feedback } = req.body;
            const examiner_user_id = req.user.user_id || req.user.id;

            if (!feedback) {
                return res.status(400).json({ message: "Feedback is required when rejecting" });
            }

            await pool.query(
                `UPDATE badge_submissions 
                 SET status = 'REJECTED', reviewed_at = NOW(), reviewed_by_examiner_user_id = ?, examiner_comment = ?
                 WHERE id = ?`,
                [examiner_user_id, feedback, id]
            );

            // Fetch scout ID and badge info to target the socket directly
            const [info] = await pool.query(
                "SELECT bs.scout_id, b.badge_name, b.id as badge_id FROM badge_submissions bs JOIN badges b ON bs.badge_id = b.id WHERE bs.id = ?",
                [id]
            );

            if (info.length > 0) {
                // Bounce back the scout_badge_progress to PENDING so they can edit it in the 'In Progress' tab
                await pool.query(
                    "UPDATE scout_badge_progress SET progress_type = 'PENDING', remarks = 'REJECTED' WHERE scout_id = ? AND badge_id = ?",
                    [info[0].scout_id, info[0].badge_id]
                );
            }

            const io = req.app.io;
            if (io && info.length > 0) {
                io.to('scout').emit('badge:status:changed', {
                    scout_id: info[0].scout_id,
                    badge_name: info[0].badge_name,
                    status: 'REJECTED'
                });
                
                // Notify leaders so they see the badge application bounce back
                io.to('leader').emit('roster:updated', { scout_id: info[0].scout_id, action: 'REJECTED' });
            }

            res.status(200).json({ message: "Badge rejected with feedback" });
        } catch (err) {
            console.error("❌ REJECT BADGE ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get scout details for evaluation
    getScoutDetails: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [scout] = await pool.query(
                `SELECT s.*, u.email, u.full_name, sg.group_name
                 FROM scouts s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN scout_groups sg ON s.scout_group_id = sg.id
                 WHERE s.id = ?`,
                [scout_id]
            );

            if (scout.length === 0) {
                return res.status(404).json({ message: "Scout not found" });
            }

            // Get badges
            const [badges] = await pool.query(
                `SELECT bs.*, b.badge_name as name
                 FROM badge_submissions bs
                 JOIN badges b ON bs.badge_id = b.id
                 WHERE bs.scout_id = ?
                 ORDER BY bs.submitted_at DESC`,
                [scout_id]
            );

            // Get activities
            const [activities] = await pool.query(
                `SELECT sub.*, a.activity_name as name, a.category as activity_type, a.activity_date as session_date
                 FROM activity_submissions sub
                 JOIN activity_registrations ar ON sub.registration_id = ar.id
                 JOIN activities a ON ar.activity_id = a.id
                 WHERE ar.scout_id = ? AND sub.status = 'APPROVED'
                 ORDER BY sub.reviewed_at DESC
                 LIMIT 10`,
                [scout_id]
            );

            res.status(200).json({
                scout: scout[0],
                badges,
                recent_activities: activities
            });
        } catch (err) {
            console.error("❌ GET SCOUT DETAILS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = ExaminerController;

