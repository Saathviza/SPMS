const pool = require('../config/db.config');

const AwardController = {
    // Check award eligibility
    checkEligibility: async (req, res) => {
        try {
            const { scout_id } = req.params;

            // Get completed badges
            const [badges] = await pool.query(
                `SELECT COUNT(*) as completed_badges 
         FROM scout_badges 
         WHERE scout_id = ? AND status = 'Awarded'`,
                [scout_id]
            );

            // Get service hours (from activities)
            const [activities] = await pool.query(
                `SELECT COUNT(*) as completed_activities 
         FROM activity_records 
         WHERE scout_id = ? AND status = 'Approved'`,
                [scout_id]
            );

            // Check if nomination exists
            const [nomination] = await pool.query(
                `SELECT * FROM award_nominations 
         WHERE scout_id = ? 
         ORDER BY nomination_date DESC 
         LIMIT 1`,
                [scout_id]
            );

            // Calculate eligibility (simplified logic)
            const requiredBadges = 10; // Example requirement
            const requiredActivities = 20; // Example requirement

            const badgeProgress = Math.min(100, (badges[0].completed_badges / requiredBadges) * 100);
            const activityProgress = Math.min(100, (activities[0].completed_activities / requiredActivities) * 100);
            const overallProgress = Math.round((badgeProgress + activityProgress) / 2);

            const isEligible = overallProgress >= 100;

            res.status(200).json({
                eligible: isEligible,
                progress: overallProgress,
                badges_completed: badges[0].completed_badges,
                badges_required: requiredBadges,
                activities_completed: activities[0].completed_activities,
                activities_required: requiredActivities,
                nomination_status: nomination.length > 0 ? nomination[0].status : null
            });
        } catch (err) {
            console.error("❌ CHECK ELIGIBILITY ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Get award progress
    getAwardProgress: async (req, res) => {
        try {
            const { scout_id } = req.params;

            // Similar to checkEligibility but returns detailed progress
            const [badges] = await pool.query(
                `SELECT b.name, b.badge_level, sb.approved_date
         FROM scout_badges sb
         JOIN badges b ON sb.badge_id = b.badge_id
         WHERE sb.scout_id = ? AND sb.status = 'Awarded'
         ORDER BY sb.approved_date DESC`,
                [scout_id]
            );

            const [activities] = await pool.query(
                `SELECT a.title, a.type, ar.verified_at
         FROM activity_records ar
         JOIN activities a ON ar.activity_id = a.activity_id
         WHERE ar.scout_id = ? AND ar.status = 'Approved'
         ORDER BY ar.verified_at DESC`,
                [scout_id]
            );

            res.status(200).json({
                badges,
                activities,
                total_badges: badges.length,
                total_activities: activities.length
            });
        } catch (err) {
            console.error("❌ GET AWARD PROGRESS ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Nominate for award
    nominateForAward: async (req, res) => {
        try {
            const { scout_id, award_name, nominated_by, comments } = req.body;

            await pool.query(
                `INSERT INTO award_nominations (scout_id, award_name, status, nominated_by, comments) 
         VALUES (?, ?, 'Nominated', ?, ?)`,
                [scout_id, award_name, nominated_by, comments]
            );

            res.status(201).json({ message: "Nomination submitted successfully" });
        } catch (err) {
            console.error("❌ NOMINATE ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = AwardController;
