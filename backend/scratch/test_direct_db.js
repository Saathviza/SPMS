const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function testDirect() {
    let conn;
    try {
        console.log("Connecting directly...");
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT) || 3306
        });
        console.log("Connected.");
        const [res] = await conn.query(
            "INSERT INTO feedback (author_id, target_type, target_id, message) VALUES (?, ?, ?, ?)",
            [1, 'badge_submission', 1, 'Direct Test message']
        );
        fs.writeFileSync('c:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\direct_success.txt', JSON.stringify(res, null, 2));
    } catch (err) {
        fs.writeFileSync('c:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\direct_error.txt', err.stack);
        console.error("Direct Error:", err.message);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

testDirect();
