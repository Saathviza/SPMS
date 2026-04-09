const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');

async function check() {
    try {
        console.log("DB_NAME:", process.env.DB_NAME);
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        const [rows] = await pool.query("SHOW TABLES LIKE 'activity_submissions'");
        console.log("Tables found:", rows);
        process.exit(0);
    } catch (err) {
        console.error("Check failed:", err.message);
        process.exit(1);
    }
}
check();
