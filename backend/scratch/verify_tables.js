const mysql = require("mysql2/promise");
require("dotenv").config();
const fs = require('fs');

async function run() {
    try {
        console.log("DB_NAME:", process.env.DB_NAME);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        const [rows] = await connection.query("SHOW TABLES");
        const tableNames = rows.map(r => Object.values(r)[0]);
        fs.writeFileSync('tables_verified.txt', tableNames.join('\n'));
        console.log("Tables verified and written to tables_verified.txt");
    } catch (e) {
        fs.writeFileSync('tables_verified_err.txt', e.stack);
        console.error(e);
    }
    process.exit();
}
run();
