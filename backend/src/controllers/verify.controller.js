const pool = require('../config/db.config');

const VerifyController = {
    // 🛡️ Verify a Merit Badge Certificate
    verifyBadge: async (req, res) => {
        try {
            const { uuid } = req.params;

            const [rows] = await pool.query(
                `SELECT b.badge_name, b.level_name, sbp.achieved_date, u.full_name as scout_name, sg.group_name
                 FROM scout_badge_progress sbp
                 JOIN badges b ON sbp.badge_id = b.id
                 JOIN scouts s ON sbp.scout_id = s.id
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN scout_groups sg ON s.scout_group_id = sg.id
                 WHERE sbp.certificate_uuid = ? AND sbp.progress_type = 'COMPLETED'`,
                [uuid]
            );

            if (rows.length === 0) {
                return res.status(404).json({ 
                    verified: false, 
                    message: "Invalid or expired certificate. This achievement is not registered in the SLSA database." 
                });
            }

            res.status(200).json({
                verified: true,
                type: "MERIT_BADGE",
                data: rows[0],
                message: "OFFICIAL RECORD: This Merit Badge is authentic and was conferred by the Sri Lanka Scout Association."
            });
        } catch (err) {
            console.error("❌ VERIFY BADGE ERROR:", err.message);
            res.status(500).json({ message: "Verification server error" });
        }
    },

    // 🏆 Verify a Milestone Award (Chief Commissioner's, President's Scout)
    verifyMilestone: async (req, res) => {
        try {
            const { uuid } = req.params;

            const [rows] = await pool.query(
                `SELECT a.award_name, sap.updated_at as achieved_date, u.full_name as scout_name, sg.group_name
                 FROM scout_award_progress sap
                 JOIN awards a ON sap.award_id = a.id
                 JOIN scouts s ON sap.scout_id = s.id
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN scout_groups sg ON s.scout_group_id = sg.id
                 WHERE sap.certificate_uuid = ?`,
                [uuid]
            );

            if (rows.length === 0) {
                return res.status(404).json({ 
                    verified: false, 
                    message: "Unauthorized document. This milestone award cannot be verified." 
                });
            }

            res.status(200).json({
                verified: true,
                type: "MILESTONE_AWARD",
                data: rows[0],
                message: "OFFICIAL RECORD: This National Scout Award is authentic and officially recognized."
            });
        } catch (err) {
            console.error("❌ VERIFY MILESTONE ERROR:", err.message);
            res.status(500).json({ message: "Verification server error" });
        }
    }
};

module.exports = VerifyController;
