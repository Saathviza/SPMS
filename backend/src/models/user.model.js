const pool = require('../config/db');

const User = {
    // Find user by email
    findByEmail: async (email) => {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ? AND is_active = 1", [email]);
        return rows[0];
    },

    // Create new user
    create: async (userData) => {
        const { name, email, password_hash, role } = userData;
        const [result] = await pool.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [name, email, password_hash, role]
        );
        return result.insertId;
    },

    // Find user by ID
    findById: async (id) => {
        const [rows] = await pool.query("SELECT user_id, name, email, role FROM users WHERE user_id = ?", [id]);
        return rows[0];
    }
};

module.exports = User;
