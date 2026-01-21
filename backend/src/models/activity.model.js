const pool = require('../config/db');

const Activity = {
    // Create new activity
    create: async (data) => {
        const { title, description, date, location, type, created_by, group_id } = data;
        const [result] = await pool.query(
            "INSERT INTO activities (title, description, date, location, type, created_by, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [title, description, date, location, type, created_by, group_id]
        );
        return result.insertId;
    },

    // Get all activities
    getAll: async () => {
        const [rows] = await pool.query("SELECT * FROM activities ORDER BY date DESC");
        return rows;
    },

    // Get activities for a specific scout group (or district wide)
    getForGroup: async (groupId) => {
        const [rows] = await pool.query(
            "SELECT * FROM activities WHERE group_id = ? OR group_id IS NULL ORDER BY date DESC",
            [groupId]
        );
        return rows;
    },

    // Register scout for activity (create record)
    registerScout: async (scoutId, activityId) => {
        // Check if already registered
        const [existing] = await pool.query(
            "SELECT * FROM activity_records WHERE scout_id = ? AND activity_id = ?",
            [scoutId, activityId]
        );
        if (existing.length > 0) return null; // Already registered

        const [result] = await pool.query(
            "INSERT INTO activity_records (scout_id, activity_id, status) VALUES (?, ?, 'Pending')",
            [scoutId, activityId]
        );
        return result.insertId;
    },

    // Get scout's activities
    getScoutActivities: async (scoutId) => {
        const query = `
      SELECT ar.*, a.title, a.date, a.type, a.location
      FROM activity_records ar
      JOIN activities a ON ar.activity_id = a.activity_id
      WHERE ar.scout_id = ?
      ORDER BY a.date DESC
    `;
        const [rows] = await pool.query(query, [scoutId]);
        return rows;
    }
};

module.exports = Activity;
