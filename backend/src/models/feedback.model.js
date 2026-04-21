const pool = require('../config/db.config');

const Feedback = {
    create: async ({ author_id, target_type, target_id, message }) => {
        try {
            const [result] = await pool.query(
                "INSERT INTO feedback (author_id, target_type, target_id, message) VALUES (?, ?, ?, ?)",
                [author_id, target_type, target_id, message]
            );
            return result.insertId;
        } catch (err) {
            console.error("Model: Feedback.create failed:", err.message);
            throw err;
        }
    },

    getByTarget: async (targetType, targetId) => {
        // Fix: Use u.role directly from users table (ENUM) instead of joining with non-existent roles table
        const query = `
            SELECT f.*, u.full_name as author_name, u.role as author_role 
            FROM feedback f 
            LEFT JOIN users u ON f.author_id = u.id 
            WHERE f.target_type = ? AND f.target_id = ? 
            ORDER BY f.created_at ASC
        `;
        const [rows] = await pool.query(query, [targetType, targetId]);
        return rows;
    }
};

module.exports = Feedback;
