const pool = require('../src/config/db.config');
const fs = require('fs');

async function poolInsert() {
    try {
        console.log("Checking pool...");
        const [res] = await pool.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage) VALUES (2, 1, 'COMPLETED', 100)");
        fs.writeFileSync('pool_success.txt', `Inserted: ${res.affectedRows}`);
    } catch (err) {
        fs.writeFileSync('pool_fail.txt', err.message);
    }
    process.exit(0);
}
poolInsert();
