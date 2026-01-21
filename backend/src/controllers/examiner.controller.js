const pool = require('../config/db.config');

const ExaminerController = {
    // Get pending badges for evaluation
    getPendingBadges: async (req, res) => {
        try {
            const [badges] = await pool.query(
                `SELECT sb.*, b.name, b.badge_level, b.description,
                u.name as scout_name, u.email as scout_email,
                s.rank_level
         FROM scout_badges sb
         JOIN badges b ON sb.badge_id = b.badge_id
         JOIN users u ON sb.scout_id = u.user_id
         JOIN scouts s ON u.user_id = s.scout_id
         WHERE sb.status = 'Submitted'
         ORDER BY sb.applied_date ASC`
            );

            // Get completion percentage for each
            const badgesWithProgress = await Promise.all(badges.map(async (badge) => {
                const [requirements] = await pool.query(
                    `SELECT COUNT(*) as total FROM badge_requirements WHERE badge_id = ?`,
                    [badge.badge_id]
                );

                const [completed] = await pool.query(
                    `SELECT COUNT(*) as completed 
           FROM scout_badge_requirements sbr
           JOIN badge_requirements br ON sbr.req_id = br.req_id
           WHERE sbr.scout_id = ? AND br.badge_id = ? AND sbr.is_completed = 1`,
                    [badge.scout_id, badge.badge_id]
                );

                const total = requirements[0].total;
                const completedCount = completed[0].completed;
                const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

                return {
                    ...badge,
                    completion_percentage: progress
                };
            }));

            res.status(200).json(badgesWithProgress);
        } catch (err) {
            console.error("❌ GET PENDING BADGES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Approve badge
    approveBadge: async (req, res) => {
        try {
            const { application_id, examiner_id, feedback } = req.body;

            await pool.query(
                `UPDATE scout_badges 
         SET status = 'Awarded', examiner_id = ?, approved_date = NOW(), feedback = ?
         WHERE application_id = ?`,
                [examiner_id, feedback || 'Badge awarded', application_id]
            );

            res.status(200).json({ message: "Badge approved successfully" });
        } catch (err) {
            console.error("❌ APPROVE BADGE ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Reject badge
    rejectBadge: async (req, res) => {
        try {
            const { application_id, examiner_id, feedback } = req.body;

            if (!feedback) {
                return res.status(400).json({ message: "Feedback is required when rejecting" });
            }

            await pool.query(
                `UPDATE scout_badges 
         SET status = 'Rejected', examiner_id = ?, feedback = ?
         WHERE application_id = ?`,
                [examiner_id, feedback, application_id]
            );

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
                `SELECT u.*, s.date_of_birth, s.rank_level, s.joined_date, sg.name as group_name
         FROM users u
         JOIN scouts s ON u.user_id = s.scout_id
         LEFT JOIN scout_groups sg ON s.group_id = sg.group_id
         WHERE u.user_id = ?`,
                [scout_id]
            );

            if (scout.length === 0) {
                return res.status(404).json({ message: "Scout not found" });
            }

            // Get badges
            const [badges] = await pool.query(
                `SELECT sb.*, b.name, b.badge_level
         FROM scout_badges sb
         JOIN badges b ON sb.badge_id = b.badge_id
         WHERE sb.scout_id = ?
         ORDER BY sb.applied_date DESC`,
                [scout_id]
            );

            // Get activities
            const [activities] = await pool.query(
                `SELECT ar.*, a.title, a.type
         FROM activity_records ar
         JOIN activities a ON ar.activity_id = a.activity_id
         WHERE ar.scout_id = ? AND ar.status = 'Approved'
         ORDER BY ar.verified_at DESC
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
