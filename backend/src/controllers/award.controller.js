const pool = require('../config/db.config');

const AwardController = {
    // Check award eligibility
    checkEligibility: async (req, res) => {
        try {
            const { scout_id } = req.params;

            // Get completed (awarded) badges
            const [badges] = await pool.query(
                `SELECT COUNT(*) as completed_badges 
                 FROM scout_badge_progress 
                 WHERE scout_id = ? AND progress_type = 'COMPLETED'`,
                [scout_id]
            );

            // Get completed (approved) activities
            const [activities] = await pool.query(
                `SELECT COUNT(*) as completed_activities 
                 FROM activity_tracking 
                 WHERE scout_id = ? AND activity_status = 'COMPLETED'`,
                [scout_id]
            );

            // Calculate eligibility (simplified logic)
            const requiredBadges = 3; // Adjusted for the seed data which has ~4 badges
            const requiredActivities = 5; // Adjusted for seed data which has 7 total

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
                activities_required: requiredActivities
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

            const [badges] = await pool.query(
                `SELECT b.badge_name as name, sba.awarded_at as approved_date
                 FROM scout_badges_awarded sba
                 JOIN badges b ON sba.badge_id = b.id
                 WHERE sba.scout_id = ?
                 ORDER BY sba.awarded_at DESC`,
                [scout_id]
            );

            const [activities] = await pool.query(
                `SELECT a.activity_name as name, a.category as type, sub.reviewed_at as verified_at
                 FROM activity_submissions sub
                 JOIN activity_registrations ar ON sub.registration_id = ar.id
                 JOIN activities a ON ar.activity_id = a.id
                 WHERE ar.scout_id = ? AND sub.status = 'APPROVED'
                 ORDER BY sub.reviewed_at DESC`,
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
    }
};

module.exports = AwardController;
