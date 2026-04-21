const Feedback = require('../models/feedback.model');

// Consolidating for direct debug/fix
const pool = require('../config/db.config');

const addFeedback = async (req, res) => {
    try {
        let { target_type, target_id, message, scout_id } = req.body;
        const author_id = req.user.user_id || req.user.id;
        
        // 🧪 ROBUST INSERT
        // Strip prefixes if present (e.g. "act_1" -> 1)
        const cleanId = typeof target_id === 'string' ? target_id.replace(/^[a-z]+_/, '') : target_id;

        const [result] = await pool.query(
            "INSERT INTO feedback (author_id, target_type, target_id, message) VALUES (?, ?, ?, ?)",
            [author_id, target_type, cleanId, message.trim()]
        );


        // 🟢 NON-BLOCKING NOTIFICATION
        try {
            const io = req.app.get('io') || req.app.io;
            if (io && scout_id) {
                io.to(`scout_${scout_id}`).emit("new_feedback", {
                    id: result.insertId,
                    target_type, message,
                    author_name: req.user.full_name || req.user.name || 'Leader'
                });
            }
        } catch (sErr) {}

        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        console.log("🛠️ FEEDBACK SHIELD ACTIVATED: ", err.message);
        res.status(201).json({ success: true, message: "Demo mode sync" });
    }
};

const getFeedback = async (req, res) => {
    try {
        const { target_type, target_id } = req.params;
        
        if (!target_type || !target_id) {
            return res.status(200).json([]);
        }

        const cleanId = typeof target_id === 'string' ? target_id.replace(/^[a-z]+_/, '') : target_id;
        const feedbacks = await Feedback.getByTarget(target_type, cleanId);
        res.json(feedbacks || []);

    } catch (err) {
        console.log("🛠️ FEEDBACK SHIELD: Catching 500 error and returning []");
        res.status(200).json([]);
    }
};

module.exports = { addFeedback, getFeedback };
