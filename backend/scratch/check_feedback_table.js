const pool = require('./src/config/db.config');

async function check() {
    try {
        const [rows] = await pool.query("DESCRIBE feedback");
        console.log("FEEDBACK_TABLE_STRUCTURE:");
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error("ERROR_CHECKING_FEEDBACK_TABLE:", err.message);
    }
    process.exit();
}
check();
