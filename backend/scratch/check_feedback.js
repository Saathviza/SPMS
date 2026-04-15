const pool = require('./src/config/db.config');
async function check() {
    try {
        const [rows] = await pool.query('DESCRIBE feedback');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
