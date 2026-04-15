const Feedback = require('../models/feedback.model');

// Consolidating for direct debug/fix
const pool = require('../config/db.config');

const addFeedback = async (req, res) => {
    try {
        let { target_type, target_id, message, scout_id } = req.body;
        const author_id = req.user.id || req.user.user_id; 
        
        if (!target_type || !target_id || !message) {
            return res.status(400).json({ 
                error: "Missing required fields", 
                received: { target_type, target_id, message } 
            });
        }

        // 🟢 Robust ID conversion
        const parsedTargetId = parseInt(target_id);
        const parsedAuthorId = parseInt(author_id);
        const parsedScoutId = scout_id ? parseInt(scout_id) : null;

        if (isNaN(parsedTargetId) || isNaN(parsedAuthorId)) {
            return res.status(400).json({ error: "Invalid ID format: target_id or author_id is NaN" });
        }

        let insertId;
        try {
            console.log(`[FEEDBACK] Submission attempt: author=${parsedAuthorId}, target=${target_type}:${parsedTargetId}`);
            
            // Explicitly handle empty message or other edge cases
            const safeMessage = message ? message.trim() : "No message provided";
            
            const [result] = await pool.query(
                "INSERT INTO feedback (author_id, target_type, target_id, message) VALUES (?, ?, ?, ?)",
                [parsedAuthorId, target_type, parsedTargetId, safeMessage]
            );
            insertId = result.insertId;
            console.log(`[FEEDBACK] Saved successfully. ID: ${insertId}`);
        } catch (dbErr) {
            console.error("CRITICAL DATABASE FEEDBACK FAIL:", dbErr.message);
            // Fallback: Check if table actually exists or if it's a constraint issue
            return res.status(500).json({ 
                error: "Database failure", 
                message: dbErr.message,
                hint: "Check if feedback table has columns: author_id, target_type, target_id, message"
            });
        }
        
        // 🟢 Fail-safe Socket emission
        try {
            const io = req.app.io;
            if (io && parsedScoutId) {
                io.to(`scout_${parsedScoutId}`).emit("new_feedback", {
                    id: insertId,
                    target_type,
                    target_id: parsedTargetId,
                    message,
                    author_name: req.user.full_name || req.user.name || 'Team Leader/Examiner',
                    author_role: req.user.role 
                });
            }
        } catch (socketErr) {
            console.error("Non-fatal socket error in feedback:", socketErr.message);
        }

        res.status(201).json({ message: "Feedback added successfully", id: insertId });
    } catch (err) {
        console.error("General Failure in Feedback Controller:", err.message);
        res.status(500).json({ 
            error: "Internal server error", 
            message: err.message,
            stack: err.stack
        });
    }
};

const getFeedback = async (req, res) => {
    try {
        const { target_type, target_id } = req.params;
        
        if (!target_type || !target_id) {
            return res.status(400).json({ error: "Missing parameters" });
        }

        console.log(`[FEEDBACK] Fetching: type=${target_type}, id=${target_id}`);
        
        const feedbacks = await Feedback.getByTarget(target_type, target_id);
        
        // Return empty array instead of 404 or error if none found
        res.json(feedbacks || []);
    } catch (err) {
        console.error("❌ GET FEEDBACK CONTROLLER FAIL:", err.message, err.stack);
        res.status(500).json({ 
            error: "Internal server error during feedback retrieval",
            details: err.message,
            code: err.code
        });
    }
};

module.exports = { addFeedback, getFeedback };
