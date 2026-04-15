const fs = require('fs');
fs.writeFileSync('DUMP_STARTED.txt', 'STARTED');
const pool = require('./src/config/db.config');

async function test() {
    try {
        const [users] = await pool.query("SELECT id, email FROM users");
        fs.writeFileSync('DUMP_SUCCESS.json', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('DUMP_FAIL.txt', e.message);
        process.exit(1);
    }
}
test();
