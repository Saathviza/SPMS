const pool = require('./src/config/db.config');
const fs = require('fs');

async function check() {
    try {
        const [rows] = await pool.query("SELECT scouts.id, users.full_name FROM scouts JOIN users ON scouts.user_id = users.id");
        fs.writeFileSync('ids_check.txt', JSON.stringify(rows, null, 2));
    } catch (e) {
        fs.writeFileSync('ids_check_err.txt', e.stack);
    }
    process.exit();
}
check();
