const pool = require('./src/config/db.config');
const fs = require('fs');

async function checkSchema() {
    try {
        const [badge_prog] = await pool.query("DESCRIBE scout_badge_progress");
        const [act_track] = await pool.query("DESCRIBE activity_tracking");
        const [serv_logs] = await pool.query("DESCRIBE service_logs");
        
        const result = {
            scout_badge_progress: badge_prog,
            activity_tracking: act_track,
            service_logs: serv_logs
        };
        fs.writeFileSync('schema_check.json', JSON.stringify(result, null, 2));
    } catch (e) {
        fs.writeFileSync('schema_check_err.txt', e.stack);
    }
    process.exit();
}
checkSchema();
