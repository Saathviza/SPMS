const pool = require('./src/config/db.config');

async function checkServiceLogs() {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) as total FROM service_logs");
        console.log("Service logs count:", rows[0].total);
    } catch (e) {
        console.error("SERVICE LOGS ERROR:", e.message);
    }
    process.exit();
}
checkServiceLogs();
