const pool = require('./src/config/db.config');

async function upgradeDatabase() {
    try {
        console.log("STARTING DATABASE SECURITY UPGRADE...");

        // 1. Add certificate_uuid to scout_badge_progress
        const [badgeCols] = await pool.query("SHOW COLUMNS FROM scout_badge_progress LIKE 'certificate_uuid'");
        if (badgeCols.length === 0) {
            await pool.query("ALTER TABLE scout_badge_progress ADD COLUMN certificate_uuid VARCHAR(100) UNIQUE NULL");
            console.log("Added certificate_uuid to scout_badge_progress");
        }

        // 2. Add certificate_uuid to scout_award_progress
        const [awardCols] = await pool.query("SHOW COLUMNS FROM scout_award_progress LIKE 'certificate_uuid'");
        if (awardCols.length === 0) {
            await pool.query("ALTER TABLE scout_award_progress ADD COLUMN certificate_uuid VARCHAR(100) UNIQUE NULL");
            console.log("Added certificate_uuid to scout_award_progress");
        }

        // 3. Seed existing COMPLETED badges with UUIDs (Fix legacy data)
        const { v4: uuidv4 } = require('uuid');
        
        const [completedBadges] = await pool.query("SELECT id FROM scout_badge_progress WHERE progress_type = 'COMPLETED' AND certificate_uuid IS NULL");
        for (const badge of completedBadges) {
            await pool.query("UPDATE scout_badge_progress SET certificate_uuid = ? WHERE id = ?", [uuidv4(), badge.id]);
        }
        console.log(`Seeded ${completedBadges.length} existing badge certificates with security IDs.`);

        const [achievedAwards] = await pool.query("SELECT id FROM scout_award_progress WHERE status = 'ACHIEVED' AND certificate_uuid IS NULL");
        for (const award of achievedAwards) {
            await pool.query("UPDATE scout_award_progress SET certificate_uuid = ? WHERE id = ?", [uuidv4(), award.id]);
        }
        console.log(`Seeded ${achievedAwards.length} legacy awards with security IDs.`);

        console.log("DATABASE UPGRADE COMPLETED SUCCESSFULLY.");
    } catch (err) {
        console.error("DATABASE UPGRADE FAILED:", err);
    } finally {
        process.exit();
    }
}

upgradeDatabase();
