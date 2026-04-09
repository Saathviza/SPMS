const pool = require('../config/db.config');

const User = {
    // Find user by email
    findByEmail: async (email) => {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ? AND is_active = 1", [email]);
        return rows[0];
    },

    // Create new user
    create: async (userData) => {
        const { email, password, role } = userData;
        const [result] = await pool.query(
            "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
            [email, password, role]
        );
        return result.insertId;
    },

    // Find user by ID
    findById: async (id) => {
        const [rows] = await pool.query("SELECT id, email, role FROM users WHERE id = ?", [id]);
        return rows[0];
    }
};

module.exports = User;

