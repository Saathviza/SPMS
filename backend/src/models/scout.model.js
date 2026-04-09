const pool = require('../config/db.config');

const Scout = {
    // Create scout profile
    createProfile: async (scoutData) => {
        const { id, name, age, group_id } = scoutData;
        const [result] = await pool.query(
            "INSERT INTO scouts (id, name, age, group_id) VALUES (?, ?, ?, ?)",
            [id, name, age, group_id]
        );
        return result;
    },

    // Get full scout details including user info
    getDetails: async (scoutId) => {
        const query = `
      SELECT u.id, s.name, u.email, s.age, sg.name as group_name
      FROM users u
      JOIN scouts s ON u.id = s.id
      LEFT JOIN scout_groups sg ON s.group_id = sg.id
      WHERE u.id = ?
    `;
        const [rows] = await pool.query(query, [scoutId]);
        return rows[0];
    },

    // Get all scouts (for leaders/admin)
    getAll: async () => {
        const query = `
      SELECT u.id, s.name, u.email, s.age, sg.name as group_name
      FROM users u
      JOIN scouts s ON u.id = s.id
      LEFT JOIN scout_groups sg ON s.group_id = sg.id
    `;
        const [rows] = await pool.query(query);
        return rows;
    }
};

module.exports = Scout;

