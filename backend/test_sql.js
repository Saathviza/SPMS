const pool = require('./src/config/db.config');

async function test() {
    try {
        const [rows] = await pool.query('DESCRIBE activities;');
        console.table(rows);
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
test();
