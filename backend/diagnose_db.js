const pool = require('./src/config/db.config');

async function debug() {
    try {
        const [tables] = await pool.query("SHOW TABLES");
        console.log("Tables:", tables);

        const [submissionsCols] = await pool.query("DESCRIBE badge_submissions");
        console.log("badge_submissions columns:", submissionsCols);
        
        const [scoutsCols] = await pool.query("DESCRIBE scouts");
        console.log("scouts columns:", scoutsCols);

        const [badges] = await pool.query("SELECT COUNT(*) as count FROM badges");
        console.log("Badges count:", badges[0].count);

        const [scouts] = await pool.query("SELECT COUNT(*) as count FROM scouts");
        console.log("Scouts count:", scouts[0].count);

        process.exit(0);
    } catch (err) {
        console.error("DIAGNOSE ERROR:", err);
        process.exit(1);
    }
}

debug();
