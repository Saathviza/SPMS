const pool = require('../config/db.config');

const Activity = {
    // Create new activity session
    create: async (data) => {
        const { name, description, activity_type, session_date, session_time, location, group_id } = data;
        const [result] = await pool.query(
            "INSERT INTO activity_sessions (name, description, activity_type, session_date, session_time, location, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, description, activity_type, session_date, session_time, location, group_id]
        );
        return result.insertId;
    },

    // Get all activity sessions
    getAll: async () => {
        const [rows] = await pool.query("SELECT * FROM activity_sessions ORDER BY session_date DESC");
        return rows;
    },

    // Get activity sessions for a specific scout group (or district wide)
    getForGroup: async (groupId) => {
        const [rows] = await pool.query(
            "SELECT * FROM activity_sessions WHERE group_id = ? OR group_id IS NULL ORDER BY session_date DESC",
            [groupId]
        );
        return rows;
    },

    // Register scout for activity (create outcome record)
    registerScout: async (scoutId, sessionId) => {
        // Check if already registered
        const [existing] = await pool.query(
            "SELECT * FROM activity_outcomes WHERE scout_id = ? AND session_id = ?",
            [scoutId, sessionId]
        );
        if (existing.length > 0) return null; // Already registered

        const [result] = await pool.query(
            "INSERT INTO activity_outcomes (scout_id, session_id, status) VALUES (?, ?, 'Pending')",
            [scoutId, sessionId]
        );
        return result.insertId;
    },

    // Get scout's activities
    getScoutActivities: async (scoutId) => {
        const query = `
      SELECT ao.*, asess.name, asess.session_date, asess.activity_type, asess.location
      FROM activity_outcomes ao
      JOIN activity_sessions asess ON ao.session_id = asess.id
      WHERE ao.scout_id = ?
      ORDER BY asess.session_date DESC
    `;
        const [rows] = await pool.query(query, [scoutId]);
        return rows;
    }
};

module.exports = Activity;

