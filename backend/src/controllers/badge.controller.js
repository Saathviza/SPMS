const pool = require('../config/db.config');

const BadgeController = {
    // Get badge progress (all submissions) for a scout
    getBadgeProgress: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [badges] = await pool.query(
                `SELECT bs.*, b.badge_name as name, b.description, b.badge_level,
                        u.full_name as examiner_name
                 FROM badge_submissions bs
                 JOIN badges b ON bs.badge_id = b.id
                 LEFT JOIN users u ON bs.reviewed_by_examiner_user_id = u.id
                 WHERE bs.scout_id = ?
                 ORDER BY bs.submitted_at DESC`,
                [scout_id]
            );

            res.status(200).json(badges);
        } catch (err) {
            console.error("❌ GET BADGE PROGRESS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get completed (awarded) badges
    getCompletedBadges: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [badges] = await pool.query(
                `SELECT sba.*, b.badge_name as name, b.description, b.badge_level
                 FROM scout_badges_awarded sba
                 JOIN badges b ON sba.badge_id = b.id
                 WHERE sba.scout_id = ?
                 ORDER BY sba.awarded_at DESC`,
                [scout_id]
            );

            res.status(200).json(badges);
        } catch (err) {
            console.error("❌ GET COMPLETED BADGES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get pending badges (Submitted but not reviewed)
    getPendingBadges: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [badges] = await pool.query(
                `SELECT bs.*, b.badge_name as name, b.description, b.badge_level
                 FROM badge_submissions bs
                 JOIN badges b ON bs.badge_id = b.id
                 WHERE bs.scout_id = ? AND bs.status = 'PENDING'
                 ORDER BY bs.submitted_at DESC`,
                [scout_id]
            );

            res.status(200).json(badges);
        } catch (err) {
            console.error("❌ GET PENDING BADGES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Submit badge for review
    submitBadge: async (req, res) => {
        try {
            let { scout_id, badge_id, notes } = req.body;

            // Resolve scout_id if not provided (safe approach)
            if (!scout_id && req.user) {
                const [scoutRows] = await pool.query(
                    "SELECT id FROM scouts WHERE user_id = ?",
                    [req.user.user_id || req.user.id]
                );
                if (scoutRows.length > 0) {
                    scout_id = scoutRows[0].id;
                }
            }

            if (!scout_id || !badge_id) {
                console.warn(`[BADGE SUBMIT] Missing data: scout_id=${scout_id}, badge_id=${badge_id}`);
                return res.status(400).json({ 
                    message: "Identity verification failed or Badge ID is missing",
                    missing: { scout_id: !scout_id, badge_id: !badge_id }
                });
            }

            // Check if application exists
            const [existing] = await pool.query(
                "SELECT id FROM badge_submissions WHERE scout_id = ? AND badge_id = ?",
                [scout_id, badge_id]
            );

            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO badge_submissions (scout_id, badge_id, evidence_summary, status, submitted_at) 
                     VALUES (?, ?, ?, 'PENDING', NOW())`,
                    [scout_id, badge_id, notes || '']
                );
            } else {
                await pool.query(
                    "UPDATE badge_submissions SET status = 'PENDING', evidence_summary = ?, submitted_at = NOW() WHERE id = ?",
                    [notes || '', existing[0].id]
                );
            }

            // Sync with scout_badge_progress so frontend shows 'PENDING' status
            const [progExist] = await pool.query(
                "SELECT id FROM scout_badge_progress WHERE scout_id = ? AND badge_id = ?",
                [scout_id, badge_id]
            );

            if (progExist.length === 0) {
                await pool.query(
                    "INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage) VALUES (?, ?, 'PENDING', 0)",
                    [scout_id, badge_id]
                );
            } else {
                await pool.query(
                    "UPDATE scout_badge_progress SET progress_type = 'PENDING' WHERE id = ?",
                    [progExist[0].id]
                );
            }

            // Fetch scout and badge info for email
            const [details] = await pool.query(
                `SELECT u.email, u.full_name as scout_name, b.badge_name 
                 FROM scouts s 
                 JOIN users u ON s.user_id = u.id 
                 JOIN badges b ON b.id = ? 
                 WHERE s.id = ?`,
                [badge_id, scout_id]
            );

            if (details.length > 0) {
                const notificationEmitter = require('../events/notification.events');
                notificationEmitter.emit('badge_submitted', {
                    userEmail: details[0].email,
                    scoutName: details[0].scout_name,
                    badgeName: details[0].badge_name
                });
                
                // 🔔 Real-time emit to globally trigger dashboard fetches
                const io = req.app.io;
                if (io) {
                    io.emit('badge:submission:new', {
                        scout_id,
                        badgeName: details[0].badge_name,
                        message: 'A scout applied for a badge review'
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: "Badge application submitted successfully! An examiner will review it soon."
            });
        } catch (err) {
            console.error("❌ SUBMIT BADGE ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get all badges (for selection)
    getAllBadges: async (req, res) => {
        try {
            const [badges] = await pool.query(
                "SELECT * FROM badges WHERE is_active = 1 ORDER BY badge_name"
            );

            res.status(200).json(badges.map(b => ({
                ...b,
                name: b.badge_name // compatibility
            })));
        } catch (err) {
            console.error("❌ GET ALL BADGES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = BadgeController;
