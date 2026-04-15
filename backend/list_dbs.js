const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        });
        const [rows] = await connection.query('SHOW DATABASES');
        fs.writeFileSync('dbs.json', JSON.stringify(rows, null, 2));
        await connection.end();
    } catch(e) {
        fs.writeFileSync('dbs_error.txt', e.stack);
    }
    process.exit();
}
test();
