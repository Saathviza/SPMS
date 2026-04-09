const pool = require('../config/db.config');

const Badge = {
    // Get all available badges
    getAll: async () => {
        const [rows] = await pool.query("SELECT * FROM badges ORDER BY name");
        return rows;
    },

    // Apply for a badge
    apply: async (scoutId, badgeId) => {
        // Check if already applied
        const [existing] = await pool.query(
            "SELECT * FROM scout_badges WHERE scout_id = ? AND badge_id = ?",
            [scoutId, badgeId]
        );
        if (existing.length > 0) return { error: "Already applied or earned" };

        const [result] = await pool.query(
            "INSERT INTO scout_badges (scout_id, badge_id, awarded_at) VALUES (?, ?, NULL)",
            [scoutId, badgeId]
        );
        return { id: result.insertId };
    },

    // Get scout's badge progress
    getScoutProgress: async (scoutId) => {
        const query = `
      SELECT sb.*, b.name, b.description
      FROM scout_badges sb
      JOIN badges b ON sb.badge_id = b.id
      WHERE sb.scout_id = ?
    `;
        const [rows] = await pool.query(query, [scoutId]);
        return rows;
    }
};

module.exports = Badge;

