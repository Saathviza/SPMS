const pool = require('../config/db.config');

const LeaderController = {
    // Get all scouts in leader's group
    getScouts: async (req, res) => {
        try {
            const { leader_id } = req.params;

            // Get leader's group
            const [groups] = await pool.query(
                "SELECT group_id FROM scout_groups WHERE leader_id = ?",
                [leader_id]
            );

            if (groups.length === 0) {
                return res.status(404).json({ message: "No group found for this leader" });
            }

            const group_id = groups[0].group_id;

            // Get scouts in the group
            const [scouts] = await pool.query(
                `SELECT u.user_id, u.name, u.email, s.rank_level, s.joined_date,
                (SELECT COUNT(*) FROM scout_badges WHERE scout_id = u.user_id AND status = 'Awarded') as badges_earned,
                (SELECT COUNT(*) FROM activity_records WHERE scout_id = u.user_id AND status = 'Approved') as activities_completed
         FROM users u
         JOIN scouts s ON u.user_id = s.scout_id
         WHERE s.group_id = ? AND u.is_active = 1
         ORDER BY u.name`,
                [group_id]
            );

            res.status(200).json(scouts);
        } catch (err) {
            console.error("❌ GET SCOUTS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get pending activities for approval
    getPendingActivities: async (req, res) => {
        try {
            const { leader_id } = req.params;

            // Get leader's group
            const [groups] = await pool.query(
                "SELECT group_id FROM scout_groups WHERE leader_id = ?",
                [leader_id]
            );

            if (groups.length === 0) {
                return res.status(200).json([]);
            }

            const group_id = groups[0].group_id;

            // Get pending activities
            const [activities] = await pool.query(
                `SELECT ar.*, a.title, a.description, a.date, a.location,
                u.name as scout_name, u.email as scout_email
         FROM activity_records ar
         JOIN activities a ON ar.activity_id = a.activity_id
         JOIN users u ON ar.scout_id = u.user_id
         JOIN scouts s ON u.user_id = s.scout_id
         WHERE s.group_id = ? AND ar.status = 'Pending' AND ar.evidence_url IS NOT NULL
         ORDER BY a.date DESC`,
                [group_id]
            );

            res.status(200).json(activities);
        } catch (err) {
            console.error("❌ GET PENDING ACTIVITIES ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Approve activity
    approveActivity: async (req, res) => {
        try {
            const { record_id, leader_id, observation_notes } = req.body;

            await pool.query(
                `UPDATE activity_records 
         SET status = 'Approved', verified_by = ?, verified_at = NOW(), 
             observation_notes = CONCAT(COALESCE(observation_notes, ''), '\n', ?)
         WHERE record_id = ?`,
                [leader_id, observation_notes || 'Approved by leader', record_id]
            );

            res.status(200).json({ message: "Activity approved successfully" });
        } catch (err) {
            console.error("❌ APPROVE ACTIVITY ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Reject activity
    rejectActivity: async (req, res) => {
        try {
            const { record_id, leader_id, observation_notes } = req.body;

            await pool.query(
                `UPDATE activity_records 
         SET status = 'Rejected', verified_by = ?, verified_at = NOW(), 
             observation_notes = CONCAT(COALESCE(observation_notes, ''), '\n', ?)
         WHERE record_id = ?`,
                [leader_id, observation_notes || 'Rejected by leader', record_id]
            );

            res.status(200).json({ message: "Activity rejected" });
        } catch (err) {
            console.error("❌ REJECT ACTIVITY ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get reports
    getReports: async (req, res) => {
        try {
            const { leader_id } = req.params;

            // Get leader's group
            const [groups] = await pool.query(
                "SELECT group_id, name FROM scout_groups WHERE leader_id = ?",
                [leader_id]
            );

            if (groups.length === 0) {
                return res.status(404).json({ message: "No group found" });
            }

            const group = groups[0];

            // Get statistics
            const [scoutCount] = await pool.query(
                "SELECT COUNT(*) as total FROM scouts WHERE group_id = ?",
                [group.group_id]
            );

            const [activityStats] = await pool.query(
                `SELECT 
          COUNT(*) as total_activities,
          SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
         FROM activity_records ar
         JOIN scouts s ON ar.scout_id = s.scout_id
         WHERE s.group_id = ?`,
                [group.group_id]
            );

            res.status(200).json({
                group_name: group.name,
                total_scouts: scoutCount[0].total,
                activity_stats: activityStats[0]
            });
        } catch (err) {
            console.error("❌ GET REPORTS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = LeaderController;
