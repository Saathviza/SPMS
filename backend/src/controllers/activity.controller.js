const pool = require('../config/db.config');

const ActivityController = {
    // Get all available activities
    getAllActivities: async (req, res) => {
        try {
            const [activities] = await pool.query(
                `SELECT a.*, u.name as created_by_name, sg.name as group_name
         FROM activities a
         LEFT JOIN users u ON a.created_by = u.user_id
         LEFT JOIN scout_groups sg ON a.group_id = sg.group_id
         ORDER BY a.date DESC`
            );

            res.status(200).json(activities);
        } catch (err) {
            console.error("❌ GET ACTIVITIES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Register for an activity
    registerForActivity: async (req, res) => {
        try {
            const { scout_id, activity_id } = req.body;

            // Check if already registered
            const [existing] = await pool.query(
                "SELECT record_id FROM activity_records WHERE scout_id = ? AND activity_id = ?",
                [scout_id, activity_id]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: "Already registered for this activity" });
            }

            // Register
            await pool.query(
                "INSERT INTO activity_records (scout_id, activity_id, status) VALUES (?, ?, 'Pending')",
                [scout_id, activity_id]
            );

            res.status(201).json({ message: "Successfully registered for activity" });
        } catch (err) {
            console.error("❌ REGISTER ACTIVITY ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get scout's registered activities
    getMyActivities: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [activities] = await pool.query(
                `SELECT ar.*, a.title, a.description, a.date, a.location, a.type,
                u.name as verified_by_name
         FROM activity_records ar
         JOIN activities a ON ar.activity_id = a.activity_id
         LEFT JOIN users u ON ar.verified_by = u.user_id
         WHERE ar.scout_id = ?
         ORDER BY a.date DESC`,
                [scout_id]
            );

            res.status(200).json(activities);
        } catch (err) {
            console.error("❌ GET MY ACTIVITIES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Submit activity proof
    submitProof: async (req, res) => {
        try {
            const { record_id, evidence_url, observation_notes } = req.body;

            await pool.query(
                `UPDATE activity_records 
         SET evidence_url = ?, observation_notes = ?, status = 'Pending'
         WHERE record_id = ?`,
                [evidence_url, observation_notes, record_id]
            );

            res.status(200).json({ message: "Proof submitted successfully" });
        } catch (err) {
            console.error("❌ SUBMIT PROOF ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get activity details
    getActivityDetails: async (req, res) => {
        try {
            const { id } = req.params;

            const [activities] = await pool.query(
                `SELECT a.*, u.name as created_by_name, sg.name as group_name
         FROM activities a
         LEFT JOIN users u ON a.created_by = u.user_id
         LEFT JOIN scout_groups sg ON a.group_id = sg.group_id
         WHERE a.activity_id = ?`,
                [id]
            );

            if (activities.length === 0) {
                return res.status(404).json({ message: "Activity not found" });
            }

            res.status(200).json(activities[0]);
        } catch (err) {
            console.error("❌ GET ACTIVITY DETAILS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = ActivityController;
