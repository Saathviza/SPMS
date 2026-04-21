const pool = require('../config/db.config');
const path = require('path');
const fs = require('fs');

const ActivityController = {
    // Get all available activities
    getAllActivities: async (req, res) => {
        try {
            const [activities] = await pool.query(
                `SELECT a.*, 
                        CASE 
                            WHEN a.activity_date > CURRENT_DATE THEN 'UPCOMING'
                            WHEN a.activity_date = CURRENT_DATE THEN 'IN_PROGRESS'
                            ELSE 'COMPLETED'
                        END as dynamic_status
                 FROM activities a
                 WHERE a.activity_date >= CURRENT_DATE
                 ORDER BY a.activity_date ASC`
            );

            res.status(200).json(activities.map(act => ({
                ...act,
                name: act.activity_name, // Mapping for frontend compatibility
                session_date: act.activity_date,
                activity_type: act.category,
                image_url: act.image_path, // Map image_path to image_url
                status: act.dynamic_status // Force frontend to use real-time time-calculated status
            })));
        } catch (err) {
            console.error("❌ GET ACTIVITIES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Register for an activity
    registerForActivity: async (req, res) => {
        try {
            const userId = req.user ? (req.user.id || req.user.user_id) : req.body.scout_id;
            const activity_id = req.body.activity_id || req.body.session_id;

            console.log(`[ACTIVITY] Registration starting: UserID=${userId}, ActivityID=${activity_id}`);

            if (!userId) {
                return res.status(400).json({ message: "Verification failed: User ID missing." });
            }
            if (!activity_id) {
                return res.status(400).json({ message: "Registration failed: No activity selected." });
            }

            const [scoutRows] = await pool.query("SELECT id FROM scouts WHERE user_id = ?", [userId]);
            if (scoutRows.length === 0) {
                return res.status(404).json({ message: "Scout profile not found." });
            }
            const scout_id = scoutRows[0].id;

            const [existing] = await pool.query(
                "SELECT id FROM activity_registrations WHERE scout_id = ? AND activity_id = ?",
                [scout_id, activity_id]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: "You are already registered for this adventure!" });
            }

            // --- USE TRANSACTION FOR CONSISTENCY ---
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // 1. Mark Registration
                await connection.query(
                    "INSERT INTO activity_registrations (scout_id, activity_id, registration_status, registered_at) VALUES (?, ?, 'REGISTERED', NOW())",
                    [scout_id, activity_id]
                );

                // 2. Clear Path for Tracking
                await connection.query(
                    `INSERT INTO activity_tracking (scout_id, activity_id, observed_by_name, activity_status, action_status) 
                     VALUES (?, ?, 'Reg. Account', 'PENDING', 'SUBMIT_PROOF')
                     ON DUPLICATE KEY UPDATE activity_status = 'PENDING'`,
                    [scout_id, activity_id]
                );

                await connection.commit();

                // 🔔 Real-time: notify all rooms that a new registration happened
                const io = req.app.io;
                if (io) {
                    io.emit('activity:enrollment', {
                        scout_id,
                        activity_id,
                        message: 'A scout just registered for an activity'
                    });
                    // Also push back to the scout themselves
                    io.to('scout').emit('my:activities:changed', { scout_id });
                }

                // 📧 Send Background Email Verification
                console.log(`📧 [DEBUG] Attempting to send registration email. Activity ID: ${activity_id}, Scout ID: ${scout_id}`);
                const [info] = await connection.query(
                    `SELECT u.email, u.full_name, a.activity_name 
                     FROM scouts s 
                     JOIN users u ON s.user_id = u.id 
                     JOIN activities a ON a.id = ? 
                     WHERE s.id = ?`,
                    [activity_id, scout_id]
                );

                if (info.length > 0) {
                    console.log(`📧 [DEBUG] Found user for email! Email: ${info[0].email}, Name: ${info[0].full_name}`);
                    const notificationEmitter = require('../events/notification.events');
                    notificationEmitter.emit('activity_updated', {
                        userEmail: info[0].email,
                        scoutName: info[0].full_name,
                        activityName: info[0].activity_name,
                        status: 'REGISTERED'
                    });
                    console.log(`📧 [DEBUG] Emitted activity_updated event for REGISTERED.`);
                } else {
                    console.warn(`⚠️ [DEBUG] No email sent. Could not find match for Scout ID ${scout_id} and Activity ID ${activity_id}`);
                }

                res.status(201).json({
                    success: true,
                    message: "Successfully registered! Check your activities to submit proof later."
                });
            } catch (txErr) {
                await connection.rollback();
                throw txErr;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error("❌ REGISTER ACTIVITY ERROR:", err);
            res.status(500).json({ message: "Server error during registration", error: err.message });
        }
    },

    // Get scout's registered activities
    getMyActivities: async (req, res) => {
        try {
            const userId = req.user.id || req.user.user_id;

            const [scoutRows] = await pool.query("SELECT id FROM scouts WHERE user_id = ?", [userId]);
            if (scoutRows.length === 0) {
                return res.status(200).json([]);
            }
            const scout_id = scoutRows[0].id;

            const [activities] = await pool.query(
                `SELECT a.id as id, ar.id as registration_id, a.activity_name as activity_name, a.activity_name as name, 
                        a.activity_date as session_date, a.location, a.category as activity_type, 
                        ar.registration_status as status, t.notes as comment, t.activity_status as tracking_status,
                        s.status as submission_status
                 FROM activity_registrations ar
                 JOIN activities a ON ar.activity_id = a.id
                 LEFT JOIN activity_tracking t ON (ar.scout_id = t.scout_id AND ar.activity_id = t.activity_id)
                 LEFT JOIN activity_submissions s ON ar.id = s.registration_id
                 WHERE ar.scout_id = ?
                 ORDER BY a.activity_date DESC`,
                [scout_id]
            );

            res.status(200).json(activities);
        } catch (err) {
            console.error("❌ GET MY ACTIVITIES ERROR:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    },

    submitNotes: async (req, res) => {
        try {
            const userId = req.user.id || req.user.user_id;
            const { outcome_id, registration_id, observation_notes, comment } = req.body;

            // Map legacy fields
            const activity_id = outcome_id;
            const proof_notes = observation_notes || comment;

            if (!activity_id) {
                return res.status(400).json({ message: "No activity ID provided." });
            }

            // 1. Get Scout ID
            const [scoutRows] = await pool.query("SELECT id FROM scouts WHERE user_id = ?", [userId]);
            const scout_id = scoutRows[0]?.id;

            if (!scout_id) {
                return res.status(404).json({ message: "Scout profile not found." });
            }

            // --- INTEGRATE WITH NEW activity_submissions TABLE ---
            const [regRows] = await pool.query(
                "SELECT id FROM activity_registrations WHERE scout_id = ? AND activity_id = ?",
                [scout_id, activity_id]
            );

            let submission_id = null;
            if (regRows.length > 0) {
                const reg_id = regRows[0].id;
                await pool.query(
                    `INSERT INTO activity_submissions (registration_id, comment, status) 
                     VALUES (?, ?, 'SUBMITTED') 
                     ON DUPLICATE KEY UPDATE comment = ?, status = 'SUBMITTED'`,
                    [reg_id, proof_notes, proof_notes]
                );
                
                // Retrieve the submission ID to link with leader approval
                const [subRows] = await pool.query("SELECT id FROM activity_submissions WHERE registration_id = ?", [reg_id]);
                submission_id = subRows[0]?.id;
            }

            // 2. Find or Create Tracking Entry
            const [trackRows] = await pool.query(
                "SELECT id FROM activity_tracking WHERE scout_id = ? AND activity_id = ?",
                [scout_id, activity_id]
            );

            let tracking_id;
            if (trackRows.length === 0) {
                const [result] = await pool.query(
                    `INSERT INTO activity_tracking (scout_id, activity_id, observed_by_name, activity_status, action_status, notes) 
                     VALUES (?, ?, 'Scout Submission', 'PENDING', 'SUBMIT_PROOF', ?)`,
                    [scout_id, activity_id, proof_notes]
                );
                tracking_id = result.insertId;
            } else {
                tracking_id = trackRows[0].id;
                await pool.query(
                    "UPDATE activity_tracking SET notes = ? WHERE id = ?",
                    [proof_notes, tracking_id]
                );
            }

            // 3. Create Proof Submission
            await pool.query(
                `INSERT INTO activity_proof_submissions (tracking_id, additional_comments, submission_status) 
                 VALUES (?, ?, 'PENDING_REVIEW')
                 ON DUPLICATE KEY UPDATE additional_comments = ?, submission_status = 'PENDING_REVIEW'`,
                [tracking_id, proof_notes, proof_notes]
            );

            // 4. Create Leader Approval Entry
            const [leaderRows] = await pool.query("SELECT verified_by_leader_user_id FROM scouts WHERE id = ?", [scout_id]);
            const leader_user_id = leaderRows[0]?.verified_by_leader_user_id;

            if (leader_user_id) {
                await pool.query(
                    `INSERT INTO leader_activity_approvals (leader_user_id, scout_id, activity_id, proof_submission_id, approval_status)
                     VALUES (?, ?, ?, ?, 'PENDING')
                     ON DUPLICATE KEY UPDATE approval_status = 'PENDING', proof_submission_id = ?`,
                    [leader_user_id, scout_id, activity_id, submission_id, submission_id]
                );
            }

            // 📧 Send Background Email Verification
            console.log(`📧 [DEBUG] Attempting to send submit notes email. Activity ID: ${activity_id}, Scout ID: ${scout_id}`);
            const [info] = await pool.query(
                `SELECT u.email, u.full_name, a.activity_name 
                 FROM scouts s 
                 JOIN users u ON s.user_id = u.id 
                 JOIN activities a ON a.id = ? 
                 WHERE s.id = ?`,
                [activity_id, scout_id]
            );

            if (info.length > 0) {
                console.log(`📧 [DEBUG] Found user for email! Email: ${info[0].email}, Name: ${info[0].full_name}`);
                const notificationEmitter = require('../events/notification.events');
                notificationEmitter.emit('activity_updated', {
                    userEmail: info[0].email,
                    scoutName: info[0].full_name,
                    activityName: info[0].activity_name,
                    status: 'SUBMITTED FOR REVIEW'
                });
                console.log(`📧 [DEBUG] Emitted activity_updated event for SUBMITTED FOR REVIEW.`);
            } else {
                console.warn(`⚠️ [DEBUG] No email sent. Could not find match for Scout ID ${scout_id} and Activity ID ${activity_id}`);
            }

            // ⚡ REAL-TIME: Notify frontend to refresh dashboard stats
            if (req.app.io) {
                req.app.io.to('scout').emit('my:activities:changed', { scout_id });
            }

            res.status(200).json({
                success: true,
                message: "Evidence submitted successfully for review!"
            });
        } catch (err) {
            console.error("❌ SUBMIT NOTES ERROR:", err);
            res.status(500).json({ message: "Server error during proof submission", error: err.message });
        }
    },

    // NEW: Submit proof with files
    submitProof: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const userId = req.user.id || req.user.user_id;
            const activityId = req.body.activity_id;
            const comment = req.body.comment;
            const files = req.files;

            if (!activityId) {
                return res.status(400).json({ message: "Activity ID is required." });
            }

            // 1. Get Scout and Registration IDs
            const [scoutRows] = await connection.query("SELECT id FROM scouts WHERE user_id = ?", [userId]);
            if (scoutRows.length === 0) return res.status(404).json({ message: "Scout not found." });
            const scout_id = scoutRows[0].id;

            const [regRows] = await connection.query(
                "SELECT id FROM activity_registrations WHERE scout_id = ? AND activity_id = ?",
                [scout_id, activityId]
            );
            if (regRows.length === 0) return res.status(404).json({ message: "You are not registered for this activity." });
            const registration_id = regRows[0].id;

            await connection.beginTransaction();

            // 2. Create/Update Activity Submission
            const [subResult] = await connection.query(
                `INSERT INTO activity_submissions (registration_id, comment, status) 
                 VALUES (?, ?, 'SUBMITTED') 
                 ON DUPLICATE KEY UPDATE comment = ?, status = 'SUBMITTED', submitted_at = NOW()`,
                [registration_id, comment, comment]
            );

            // Get submission ID
            const [currentSub] = await connection.query("SELECT id FROM activity_submissions WHERE registration_id = ?", [registration_id]);
            const submission_id = currentSub[0].id;

            // 3. Process Files
            if (files && files.length > 0) {
                for (const file of files) {
                    // a. Insert into files table
                    const [fileResult] = await connection.query(
                        `INSERT INTO files (owner_user_id, file_type, original_name, storage_key, mime_type, size_bytes) 
                         VALUES (?, 'ACTIVITY_PROOF', ?, ?, ?, ?)`,
                        [userId, file.originalname, file.path.replace(/\\/g, '/'), file.mimetype, file.size]
                    );
                    const file_id = fileResult.insertId;

                    // b. Link to submission
                    await connection.query(
                        `INSERT INTO activity_submission_files (submission_id, file_id) VALUES (?, ?)`,
                        [submission_id, file_id]
                    );
                }
            }

            // 4. Logic sync with Tracking tables (Backward compatibility)
            let leader_user_id = null;
            try {
                const [leaderRows] = await connection.query("SELECT assigned_leader_id FROM scouts WHERE id = ?", [scout_id]);
                leader_user_id = leaderRows[0]?.assigned_leader_id;
            } catch(colErr) {
                console.log("⚠️ assigned_leader_id missing or error, ignoring legacy leader link: ", colErr.message);
            }

            await connection.query(
                `INSERT INTO activity_tracking (scout_id, activity_id, observed_by_name, activity_status, action_status, notes) 
                 VALUES (?, ?, 'Self Submission', 'PENDING', 'SUBMIT_PROOF', ?) 
                 ON DUPLICATE KEY UPDATE notes = ?, activity_status = 'PENDING'`,
                [scout_id, activityId, comment, comment]
            );

            // Fetch the tracking ID we just created/updated
            const [trackingRows] = await connection.query("SELECT id FROM activity_tracking WHERE scout_id = ? AND activity_id = ?", [scout_id, activityId]);
            const trk_id = trackingRows.length > 0 ? trackingRows[0].id : null;

            // Extract first file_id for the legacy table if files were uploaded
            let proof_file_id = null;
            const [fileRows] = await connection.query("SELECT file_id FROM activity_submission_files WHERE submission_id = ? LIMIT 1", [submission_id]);
            if (fileRows.length > 0) proof_file_id = fileRows[0].file_id;

            if (trk_id) {
                // 5. 🎯 VITAL LINK: Push to the table the Leader Dashboard actually reads
                await connection.query(
                    `INSERT INTO activity_proof_submissions (tracking_id, file_id, additional_comments, submission_status) 
                     VALUES (?, ?, ?, 'PENDING_REVIEW')
                     ON DUPLICATE KEY UPDATE file_id = VALUES(file_id), additional_comments = VALUES(additional_comments), submission_status = 'PENDING_REVIEW'`,
                    [trk_id, proof_file_id, comment]
                );
            }

            if (leader_user_id && trk_id) {
                // Get the proof_submission_id for leader approvals
                const [proofSubRows] = await connection.query("SELECT id FROM activity_proof_submissions WHERE tracking_id = ?", [trk_id]);
                const proof_sub_id = proofSubRows.length > 0 ? proofSubRows[0].id : null;

                await connection.query(
                    `INSERT INTO leader_activity_approvals (leader_user_id, scout_id, activity_id, proof_submission_id, approval_status) 
                     VALUES (?, ?, ?, ?, 'PENDING') 
                     ON DUPLICATE KEY UPDATE approval_status = 'PENDING', proof_submission_id = ?`,
                    [leader_user_id, scout_id, activityId, proof_sub_id, proof_sub_id]
                );
            }

            await connection.commit();

            // 🔔 Real-time: notify globally that proof was submitted
            const io = req.app.io;
            if (io) {
                io.emit('proof:submitted', {
                    scout_id,
                    activityId,
                    message: 'A scout has submitted proof for review'
                });
                io.to('scout').emit('my:activities:changed', { scout_id });
            }

            // 📧 Send Background Email Verification
            console.log(`📧 [DEBUG] Attempting to send submit proof email. Activity ID: ${activityId}, Scout ID: ${scout_id}`);
            const [info] = await connection.query(
                `SELECT u.email, u.full_name, a.activity_name 
                 FROM scouts s 
                 JOIN users u ON s.user_id = u.id 
                 JOIN activities a ON a.id = ? 
                 WHERE s.id = ?`,
                [activityId, scout_id]
            );

            if (info.length > 0) {
                console.log(`📧 [DEBUG] Found user for email! Email: ${info[0].email}, Name: ${info[0].full_name}`);
                const notificationEmitter = require('../events/notification.events');
                notificationEmitter.emit('activity_updated', {
                    userEmail: info[0].email,
                    scoutName: info[0].full_name,
                    activityName: info[0].activity_name,
                    status: 'SUBMITTED FOR REVIEW'
                });
                console.log(`📧 [DEBUG] Emitted activity_updated event for SUBMITTED FOR REVIEW.`);
            } else {
                console.warn(`⚠️ [DEBUG] No email sent. Could not find match for Scout ID ${scout_id} and Activity ID ${activityId}`);
            }

            // ⚡ REAL-TIME: Notify frontend to refresh dashboard stats
            if (req.app.io) {
                req.app.io.to('scout').emit('my:activities:changed', { scout_id });
            }

            res.status(200).json({ success: true, message: "Proof submitted successfully with files!" });

        } catch (err) {
            if (connection) await connection.rollback();
            console.error("❌ SUBMIT PROOF ERROR:", err);
            require('fs').writeFileSync('SUBMIT_ERR.txt', "Error: " + err.message + "\nStack: " + err.stack);
            res.status(500).json({ message: "Server error during submission", error: err.message });
        } finally {
            if (connection) connection.release();
        }
    },

    // Get activity details
    getActivityDetails: async (req, res) => {
        try {
            const { id } = req.params;

            const [activities] = await pool.query(
                `SELECT a.* FROM activities a WHERE a.id = ?`,
                [id]
            );

            if (activities.length === 0) {
                return res.status(404).json({ message: "Activity not found" });
            }

            const act = activities[0];
            res.status(200).json({
                ...act,
                name: act.activity_name,
                session_date: act.activity_date,
                activity_type: act.category,
                image_url: act.image_path
            });
        } catch (err) {
            console.error("❌ GET ACTIVITY DETAILS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = ActivityController;
