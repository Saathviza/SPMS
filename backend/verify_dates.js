const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function checkDates() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        
        // Update them directly to be absolutely strictly sure
        await connection.query("UPDATE activities SET activity_date = '2026-04-18' WHERE activity_code = 'ACT003'");
        await connection.query("UPDATE activities SET activity_date = '2026-04-20' WHERE activity_code = 'ACT004'");
        await connection.query("UPDATE activities SET activity_date = '2026-04-11' WHERE activity_code = 'ACT006'");
        await connection.query("UPDATE activities SET activity_date = '2026-05-02' WHERE activity_code = 'ACT007'");

        const [rows] = await connection.query("SELECT activity_code, activity_date FROM activities WHERE activity_code IN ('ACT003', 'ACT004', 'ACT006', 'ACT007')");
        fs.writeFileSync('date_results.json', JSON.stringify(rows, null, 2));
        
        await connection.end();
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('date_results.json', JSON.stringify({ error: err.message }));
        process.exit(1);
    }
}
checkDates();
