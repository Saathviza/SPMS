const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT) || 3306
        });
        console.log('✅ Connected to database!');
        const [rows] = await connection.execute('SELECT full_name, email, password_hash, role_id FROM users');
        console.table(rows);
        await connection.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkUsers();
