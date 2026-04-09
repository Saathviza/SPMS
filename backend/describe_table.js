const pool = require('./src/config/db.config');
async function run() {
    try {
        const [rows] = await pool.query('DESCRIBE scout_badges');
        console.log(JSON.stringify(rows, null, 2));
    } catch(err) {
        console.error(err);
    }
    process.exit();
}
run();
