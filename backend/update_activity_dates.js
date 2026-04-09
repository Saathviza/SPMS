const pool = require('./src/config/db.config');

async function updateDates() {
    try {
        console.log("Updating live database activity dates...");
        
        await pool.query("UPDATE activities SET activity_date = '2026-04-18' WHERE activity_code = 'ACT003'");
        await pool.query("UPDATE activities SET activity_date = '2026-04-20' WHERE activity_code = 'ACT004'");
        await pool.query("UPDATE activities SET activity_date = '2026-04-11' WHERE activity_code = 'ACT006'");
        await pool.query("UPDATE activities SET activity_date = '2026-05-02' WHERE activity_code = 'ACT007'");
        
        console.log("✅ Successfully hot-patched the live database dates for ACT003, ACT004, ACT006, and ACT007!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to update dates:", err.message);
        process.exit(1);
    }
}

updateDates();
