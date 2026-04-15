const pool = require('./src/config/db.config');
const fs = require('fs');

async function check() {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) as total FROM scout_badge_progress WHERE achieved_date = '2025-09-15'");
        const [all] = await pool.query("SELECT sbp.id, u.email, b.badge_name, sbp.achieved_date FROM scout_badge_progress sbp JOIN scouts s ON sbp.scout_id = s.id JOIN users u ON s.user_id = u.id JOIN badges b ON sbp.badge_id = b.id WHERE sbp.progress_type = 'COMPLETED' LIMIT 20");
        fs.writeFileSync('db_check.json', JSON.stringify({count915: rows[0].total, samples: all}, null, 2));
    } catch(e) {
        fs.writeFileSync('db_check_error.txt', e.stack);
    }
    process.exit();
}
check();
