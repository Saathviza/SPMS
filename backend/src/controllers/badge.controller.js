const pool = require('../config/db.config');

const BadgeController = {
    // Get badge progress for a scout
    getBadgeProgress: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [badges] = await pool.query(
                `SELECT sb.*, b.name, b.badge_level, b.description, b.image_url,
                u.name as examiner_name
         FROM scout_badges sb
         JOIN badges b ON sb.badge_id = b.badge_id
         LEFT JOIN users u ON sb.examiner_id = u.user_id
         WHERE sb.scout_id = ?
         ORDER BY b.badge_level, sb.applied_date DESC`,
                [scout_id]
            );

            // Calculate progress percentage for each badge
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
                    [scout_id, badge.badge_id]
                );

                const total = requirements[0].total;
                const completedCount = completed[0].completed;
                const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

                return {
                    ...badge,
                    progress,
                    total_requirements: total,
                    completed_requirements: completedCount
                };
            }));

            res.status(200).json(badgesWithProgress);
        } catch (err) {
            console.error("❌ GET BADGE PROGRESS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get completed badges
    getCompletedBadges: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [badges] = await pool.query(
                `SELECT sb.*, b.name, b.badge_level, b.description, b.image_url
         FROM scout_badges sb
         JOIN badges b ON sb.badge_id = b.badge_id
         WHERE sb.scout_id = ? AND sb.status = 'Awarded'
         ORDER BY sb.approved_date DESC`,
                [scout_id]
            );

            res.status(200).json(badges);
        } catch (err) {
            console.error("❌ GET COMPLETED BADGES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get pending badges
    getPendingBadges: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [badges] = await pool.query(
                `SELECT sb.*, b.name, b.badge_level, b.description, b.image_url
         FROM scout_badges sb
         JOIN badges b ON sb.badge_id = b.badge_id
         WHERE sb.scout_id = ? AND sb.status IN ('In Progress', 'Submitted')
         ORDER BY sb.applied_date DESC`,
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
            const { scout_id, badge_id } = req.body;

            // Check if badge application exists
            const [existing] = await pool.query(
                "SELECT application_id FROM scout_badges WHERE scout_id = ? AND badge_id = ?",
                [scout_id, badge_id]
            );

            if (existing.length === 0) {
                // Create new application
                await pool.query(
                    `INSERT INTO scout_badges (scout_id, badge_id, status, applied_date) 
           VALUES (?, ?, 'Submitted', NOW())`,
                    [scout_id, badge_id]
                );
            } else {
                // Update existing
                await pool.query(
                    "UPDATE scout_badges SET status = 'Submitted', applied_date = NOW() WHERE application_id = ?",
                    [existing[0].application_id]
                );
            }

            res.status(200).json({ message: "Badge submitted for review" });
        } catch (err) {
            console.error("❌ SUBMIT BADGE ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get all badges (for selection)
    getAllBadges: async (req, res) => {
        try {
            const [badges] = await pool.query(
                "SELECT * FROM badges ORDER BY badge_level, name"
            );

            res.status(200).json(badges);
        } catch (err) {
            console.error("❌ GET ALL BADGES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = BadgeController;
