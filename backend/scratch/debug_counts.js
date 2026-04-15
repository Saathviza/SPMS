const pool = require('./src/config/db.config');
const fs = require('fs');

async function debug() {
    try {
        const [scouts] = await pool.query("SELECT id, scout_code FROM scouts");
        const [tracking] = await pool.query("SELECT scout_id, COUNT(*) as cnt FROM activity_tracking WHERE activity_status = 'COMPLETED' GROUP BY scout_id");
        const [service] = await pool.query("SELECT scout_id, SUM(hours) as total FROM service_logs WHERE status = 'APPROVED' GROUP BY scout_id");
        
        const result = {
            scouts,
            tracking,
            service
        };
        fs.writeFileSync('debug_counts.json', JSON.stringify(result, null, 2));
    } catch (e) {
        fs.writeFileSync('debug_err.txt', e.stack);
    }
    process.exit();
}
debug();
