const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT) || 3306
        });
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS badge_examiners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                district VARCHAR(255) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        await connection.query(`
            INSERT IGNORE INTO badge_examiners (user_id, district) 
            SELECT id, 'Colombo' FROM users WHERE role = 'EXAMINER'
        `);
        require('fs').writeFileSync('SUCCESS.txt', 'Done creating table! Rows affected attached.');
        await connection.end();
    } catch (e) {
        require('fs').writeFileSync('FAIL.txt', e.message);
    }
}
run();
