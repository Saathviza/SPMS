const pool = require('./src/config/db.config');

async function test() {
    try {
        const [rows] = await pool.query('SELECT id, full_name, created_at FROM users ORDER BY id DESC LIMIT 5;');
        console.log("Recent by ID:");
        console.table(rows);
        
        const [rows2] = await pool.query('SELECT id, full_name, created_at FROM users ORDER BY created_at DESC LIMIT 5;');
        console.log("Recent by created_at:");
        console.table(rows2);
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
test();
