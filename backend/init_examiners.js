const pool = require('./src/config/db.config');

async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS badge_examiners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                district VARCHAR(255) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        await pool.query(`
            INSERT IGNORE INTO badge_examiners (user_id, district) 
            SELECT id, 'Colombo' FROM users WHERE role = 'EXAMINER'
        `);
        
        process.exit(0);
    } catch (err) {
        require('fs').writeFileSync('db_fix_err.txt', err.message);
        process.exit(1);
    }
}
createTable();
