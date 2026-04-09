const pool = require('./src/config/db.config');
const fs = require('fs');

async function desc() {
    try {
        const [scouts] = await pool.query("DESCRIBE scouts");
        const [leaders] = await pool.query("DESCRIBE scout_leaders");
        fs.writeFileSync('table_desc.txt', JSON.stringify({ scouts, leaders }, null, 2));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('table_error.txt', e.message);
        process.exit(1);
    }
}
desc();
