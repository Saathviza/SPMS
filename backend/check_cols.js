const pool = require('./src/config/db.config');
const fs = require('fs');
async function run() {
    try {
        const [rows] = await pool.query('DESCRIBE scout_badge_progress');
        fs.writeFileSync('debug_cols.txt', JSON.stringify(rows, null, 2));
    } catch(err) {
        fs.writeFileSync('debug_cols.txt', err.message);
    }
    process.exit();
}
run();
