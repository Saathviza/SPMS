const pool = require('../config/db.config');

const LeadController = {
    // 📊 Get National Top 10 Scouts
    getNationalLeaderboard: async (req, res) => {
        try {
            const [topScouts] = await pool.query(
                `SELECT u.full_name, sg.group_name, s.district,
                        (SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = s.id AND progress_type = 'COMPLETED') as badges_count,
                        (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = s.id AND activity_status = 'COMPLETED') as activity_count,
                        ((SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = s.id AND progress_type = 'COMPLETED') * 10 + 
                         (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = s.id AND activity_status = 'COMPLETED') * 2) as total_points
                 FROM scouts s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN scout_groups sg ON s.scout_group_id = sg.id
                 WHERE u.status = 'ACTIVE'
                 ORDER BY total_points DESC
                 LIMIT 10`
            );

            res.status(200).json(topScouts);
        } catch (err) {
            console.error("❌ LEADERBOARD ERROR:", err.message);
            res.status(500).json({ message: "Error calculating leadership rankings" });
        }
    },

    // 🏘️ Get District Performance Ranking
    getDistrictRankings: async (req, res) => {
        try {
            const [districts] = await pool.query(
                `SELECT s.district, 
                        COUNT(DISTINCT s.id) as scout_count,
                        (SELECT COUNT(*) FROM scout_badge_progress sbp 
                         JOIN scouts s2 ON sbp.scout_id = s2.id 
                         WHERE s2.district = s.district AND sbp.progress_type = 'COMPLETED') as total_badges
                 FROM scouts s
                 GROUP BY s.district
                 ORDER BY total_badges DESC`
            );

            res.status(200).json(districts);
        } catch (err) {
            console.error("❌ DISTRICT RANKING ERROR:", err.message);
            res.status(500).json({ message: "Error loading regional stats" });
        }
    }
};

module.exports = LeadController;
