const pool = require('../config/db');

const Scout = {
    // Create scout profile (linked to user)
    createProfile: async (scoutData) => {
        const { scout_id, date_of_birth, group_id, rank_level, profile_image_url, joined_date } = scoutData;
        const [result] = await pool.query(
            "INSERT INTO scouts (scout_id, date_of_birth, group_id, rank_level, profile_image_url, joined_date) VALUES (?, ?, ?, ?, ?, ?)",
            [scout_id, date_of_birth, group_id, rank_level, profile_image_url, joined_date]
        );
        return result;
    },

    // Get full scout details including user info
    getDetails: async (scoutId) => {
        const query = `
      SELECT u.user_id, u.name, u.email, s.date_of_birth, s.rank_level, s.joined_date, sg.name as group_name
      FROM users u
      JOIN scouts s ON u.user_id = s.scout_id
      LEFT JOIN scout_groups sg ON s.group_id = sg.group_id
      WHERE u.user_id = ?
    `;
        const [rows] = await pool.query(query, [scoutId]);
        return rows[0];
    },

    // Get all scouts (for leaders/admin)
    getAll: async () => {
        const query = `
      SELECT u.user_id, u.name, u.email, s.rank_level, sg.name as group_name
      FROM users u
      JOIN scouts s ON u.user_id = s.scout_id
      LEFT JOIN scout_groups sg ON s.group_id = sg.group_id
    `;
        const [rows] = await pool.query(query);
        return rows;
    }
};

module.exports = Scout;
