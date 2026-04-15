const pool = require('./src/config/db.config');
const fs = require('fs');

async function verify() {
    try {
        const [rows] = await pool.query(
            "SELECT b.badge_name, sbp.achieved_date FROM scout_badge_progress sbp JOIN badges b ON sbp.badge_id = b.id WHERE sbp.scout_id = (SELECT id FROM scouts WHERE user_id = (SELECT id FROM users WHERE email='sherasaathvizarajkumar@gmail.com')) AND sbp.progress_type = 'COMPLETED'"
        );
        fs.writeFileSync('badge_verify.json', JSON.stringify(rows, null, 2));
    } catch(e) {
        fs.writeFileSync('badge_verify_error.txt', e.stack);
    }
    process.exit();
}
verify();
