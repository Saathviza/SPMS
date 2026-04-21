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

    // Get pending badges (submitted but not yet reviewed by leader)
    getPendingBadges: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [badges] = await pool.query(
                `SELECT bs.*, b.badge_name as name, b.description, b.badge_level
                 FROM badge_submissions bs
                 JOIN badges b ON bs.badge_id = b.id
                 WHERE bs.scout_id = ? AND bs.status IN ('LEADER_PENDING', 'PENDING')
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
    // FIX: Sets status to LEADER_PENDING so it routes to the leader FIRST,
    // not directly to the examiner.
    submitBadge: async (req, res) => {
        try {
            let { scout_id, badge_id, notes } = req.body;

            // Resolve scout_id if not provided
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
                return res.status(400).json({
                    message: "Identity verification failed or Badge ID is missing",
                    missing: { scout_id: !scout_id, badge_id: !badge_id }
                });
            }

            // Check if a submission already exists
            const [existing] = await pool.query(
                "SELECT id FROM badge_submissions WHERE scout_id = ? AND badge_id = ?",
                [scout_id, badge_id]
            );

            if (existing.length === 0) {
                // NEW: status is LEADER_PENDING — goes to leader first
                await pool.query(
                    `INSERT INTO badge_submissions (scout_id, badge_id, evidence_summary, status, submitted_at)
                     VALUES (?, ?, ?, 'LEADER_PENDING', NOW())`,
                    [scout_id, badge_id, notes || '']
                );
            } else {
                // Re-submission after a rejection also starts at LEADER_PENDING
                await pool.query(
                    "UPDATE badge_submissions SET status = 'LEADER_PENDING', evidence_summary = ?, submitted_at = NOW() WHERE id = ?",
                    [notes || '', existing[0].id]
                );
            }

            // Sync scout_badge_progress so the frontend shows 'PENDING' stage
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

            // Fetch scout and badge info for notifications
            const [details] = await pool.query(
                `SELECT u.email, u.full_name as scout_name, b.badge_name,
                        sl.user_id as leader_user_id,
                        lu.email as leader_email, lu.full_name as leader_name
                 FROM scouts s
                 JOIN users u ON s.user_id = u.id
                 JOIN badges b ON b.id = ?
                 LEFT JOIN scout_leaders sl ON sl.scout_group_id = s.scout_group_id
                 LEFT JOIN users lu ON lu.id = sl.user_id
                 WHERE s.id = ?
                 LIMIT 1`,
                [badge_id, scout_id]
            );

            if (details.length > 0) {
                const notificationEmitter = require('../events/notification.events');

                // Notify the LEADER (not the examiner) that a submission is waiting
                notificationEmitter.emit('badge_submitted', {
                    userEmail: details[0].leader_email || details[0].email,
                    scoutName: details[0].scout_name,
                    badgeName: details[0].badge_name,
                    recipientName: details[0].leader_name || 'Leader'
                });

                // Real-time: emit to leader's room only
                const io = req.app.io;
                if (io) {
                    io.to('leader').emit('badge:leader_review_needed', {
                        scout_id,
                        badgeName: details[0].badge_name,
                        scoutName: details[0].scout_name,
                        message: 'A scout has submitted badge evidence for your review'
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: "Badge application submitted! Your leader will review it first before it reaches the examiner."
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
                name: b.badge_name
            })));
        } catch (err) {
            console.error("❌ GET ALL BADGES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = BadgeController;
