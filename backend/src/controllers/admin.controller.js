const pool = require('../config/db.config');

const AdminController = {
    // Get system statistics
    getStats: async (req, res) => {
        try {
            const [scoutCount] = await pool.query(
                "SELECT COUNT(*) as total FROM users WHERE role = 'Scout' AND is_active = 1"
            );

            const [leaderCount] = await pool.query(
                "SELECT COUNT(*) as total FROM users WHERE role = 'Scout Leader' AND is_active = 1"
            );

            const [activityCount] = await pool.query(
                "SELECT COUNT(*) as total FROM activities"
            );

            const [badgeCount] = await pool.query(
                "SELECT COUNT(*) as total FROM badges"
            );

            const [pendingApprovals] = await pool.query(
                "SELECT COUNT(*) as total FROM users WHERE is_active = 0"
            );

            res.status(200).json({
                total_scouts: scoutCount[0].total,
                total_leaders: leaderCount[0].total,
                total_activities: activityCount[0].total,
                total_badges: badgeCount[0].total,
                pending_approvals: pendingApprovals[0].total
            });
        } catch (err) {
            console.error("❌ GET STATS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get all scouts
    getAllScouts: async (req, res) => {
        try {
            const [scouts] = await pool.query(
                `SELECT u.user_id, u.name, u.email, u.is_active, s.rank_level, 
                sg.name as group_name,
                (SELECT COUNT(*) FROM scout_badges WHERE scout_id = u.user_id AND status = 'Awarded') as badges_earned
         FROM users u
         LEFT JOIN scouts s ON u.user_id = s.scout_id
         LEFT JOIN scout_groups sg ON s.group_id = sg.group_id
         WHERE u.role = 'Scout'
         ORDER BY u.name`
            );

            res.status(200).json(scouts);
        } catch (err) {
            console.error("❌ GET ALL SCOUTS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Add scout leader
    addLeader: async (req, res) => {
        try {
            const { name, email, password, group_id } = req.body;

            // Check if email exists
            const [existing] = await pool.query(
                "SELECT user_id FROM users WHERE email = ?",
                [email]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: "Email already exists" });
            }

            const bcrypt = require('bcrypt');
            const password_hash = await bcrypt.hash(password, 10);

            const [result] = await pool.query(
                `INSERT INTO users (name, email, password_hash, role, is_active) 
         VALUES (?, ?, ?, 'Scout Leader', 1)`,
                [name, email, password_hash]
            );

            // Update scout group if provided
            if (group_id) {
                await pool.query(
                    "UPDATE scout_groups SET leader_id = ? WHERE group_id = ?",
                    [result.insertId, group_id]
                );
            }

            res.status(201).json({ message: "Scout Leader added successfully", user_id: result.insertId });
        } catch (err) {
            console.error("❌ ADD LEADER ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Check eligibility (admin version - can check any scout)
    checkEligibility: async (req, res) => {
        try {
            const { scout_id } = req.params;

            const [badges] = await pool.query(
                `SELECT COUNT(*) as completed_badges 
         FROM scout_badges 
         WHERE scout_id = ? AND status = 'Awarded'`,
                [scout_id]
            );

            const [activities] = await pool.query(
                `SELECT COUNT(*) as completed_activities 
         FROM activity_records 
         WHERE scout_id = ? AND status = 'Approved'`,
                [scout_id]
            );

            const requiredBadges = 10;
            const requiredActivities = 20;

            const isEligible = badges[0].completed_badges >= requiredBadges &&
                activities[0].completed_activities >= requiredActivities;

            res.status(200).json({
                eligible: isEligible,
                badges_completed: badges[0].completed_badges,
                badges_required: requiredBadges,
                activities_completed: activities[0].completed_activities,
                activities_required: requiredActivities
            });
        } catch (err) {
            console.error("❌ CHECK ELIGIBILITY ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Manage activities (create/update)
    manageActivity: async (req, res) => {
        try {
            const { activity_id, title, description, date, location, type, created_by, group_id } = req.body;

            if (activity_id) {
                // Update existing
                await pool.query(
                    `UPDATE activities 
           SET title = ?, description = ?, date = ?, location = ?, type = ?, group_id = ?
           WHERE activity_id = ?`,
                    [title, description, date, location, type, group_id, activity_id]
                );
                res.status(200).json({ message: "Activity updated successfully" });
            } else {
                // Create new
                const [result] = await pool.query(
                    `INSERT INTO activities (title, description, date, location, type, created_by, group_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [title, description, date, location, type, created_by, group_id]
                );
                res.status(201).json({ message: "Activity created successfully", activity_id: result.insertId });
            }
        } catch (err) {
            console.error("❌ MANAGE ACTIVITY ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Manage badges (create/update)
    manageBadge: async (req, res) => {
        try {
            const { badge_id, name, badge_level, description, image_url } = req.body;

            if (badge_id) {
                // Update existing
                await pool.query(
                    `UPDATE badges 
           SET name = ?, badge_level = ?, description = ?, image_url = ?
           WHERE badge_id = ?`,
                    [name, badge_level, description, image_url, badge_id]
                );
                res.status(200).json({ message: "Badge updated successfully" });
            } else {
                // Create new
                const [result] = await pool.query(
                    `INSERT INTO badges (name, badge_level, description, image_url) 
           VALUES (?, ?, ?, ?)`,
                    [name, badge_level, description, image_url]
                );
                res.status(201).json({ message: "Badge created successfully", badge_id: result.insertId });
            }
        } catch (err) {
            console.error("❌ MANAGE BADGE ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Approve scout registration
    approveScout: async (req, res) => {
        try {
            const { user_id } = req.body;

            await pool.query(
                "UPDATE users SET is_active = 1 WHERE user_id = ?",
                [user_id]
            );

            res.status(200).json({ message: "Scout approved successfully" });
        } catch (err) {
            console.error("❌ APPROVE SCOUT ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = AdminController;
