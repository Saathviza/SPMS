const pool = require('./src/config/db.config');

async function fixExaminers() {
    try {
        console.log("Checking badge_examiners table...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS badge_examiners (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                district VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("badge_examiners table verified/created.");

        // Also check for feedback table ENUM update again just to be super sure
         await pool.query(`
            ALTER TABLE feedback 
            MODIFY COLUMN target_type ENUM('activity', 'badge_submission', 'scout_profile', 'badge') NOT NULL
        `).catch(() => {});

        process.exit(0);
    } catch (err) {
        console.error("DEBUG_FIX_ERROR:", err.message);
        process.exit(1);
    }
}

fixExaminers();
