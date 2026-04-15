const pool = require('./src/config/db.config');
const fs = require('fs');

async function list() {
    try {
        const [rows] = await pool.query("SHOW TABLES");
        fs.writeFileSync('c:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\tables_verified.json', JSON.stringify(rows, null, 2));
    } catch(e) {
        fs.writeFileSync('c:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\tables_verified_err.txt', e.stack);
    }
    process.exit();
}
list();
