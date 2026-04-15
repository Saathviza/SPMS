const pool = require('./src/config/db.config');
const fs = require('fs');

async function debug() {
    try {
        const [groups] = await pool.query("SELECT * FROM scout_groups");
        const [scouts] = await pool.query("SELECT s.id, s.district, u.full_name FROM scouts s JOIN users u ON s.user_id = u.id");
        const [stats] = await pool.query(`
            SELECT s.id, u.full_name,
                   (SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = s.id AND progress_type = 'COMPLETED') as badges,
                   (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = s.id AND activity_status = 'COMPLETED') as acts
            FROM scouts s
            JOIN users u ON s.user_id = u.id
            LIMIT 10
        `);
        
        const data = { groups, scouts, stats };
        fs.writeFileSync('DEBUG_AWARDS.json', JSON.stringify(data, null, 2));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('DEBUG_AWARDS_ERR.txt', e.message);
        process.exit(1);
    }
}
debug();
