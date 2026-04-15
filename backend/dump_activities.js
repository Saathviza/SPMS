const pool = require('./src/config/db.config');

async function test() {
    try {
        const [rows] = await pool.query('SELECT * FROM activity_registrations ORDER BY id DESC LIMIT 5;');
        console.table(rows);
        const [rows2] = await pool.query('SELECT * FROM activities ORDER BY id DESC LIMIT 5;');
        console.table(rows2);
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
test();
