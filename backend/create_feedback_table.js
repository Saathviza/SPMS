const pool = require('./src/config/db.config');

async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                author_id INT NOT NULL,
                target_type ENUM('activity', 'badge_submission', 'scout_profile') NOT NULL,
                target_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Feedback table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
createTable();
