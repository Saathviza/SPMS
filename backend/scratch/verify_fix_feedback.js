const pool = require('./src/config/db.config');

async function fix() {
    try {
        console.log("Checking and fixing feedback table...");
        
        // 1. Ensure table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                author_id INT NOT NULL,
                target_type ENUM('activity', 'badge_submission', 'scout_profile', 'badge') NOT NULL,
                target_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Table existence verified/created.");

        // 2. Ensure columns are correct (especially ENUM)
        await pool.query(`
            ALTER TABLE feedback 
            MODIFY COLUMN target_type ENUM('activity', 'badge_submission', 'scout_profile', 'badge') NOT NULL
        `);
        console.log("Table ENUM structure updated successfully.");

        // 3. Verify it worked by describing
        const [rows] = await pool.query("DESCRIBE feedback");
        console.log("Current Table Structure:");
        console.table(rows);

        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR DURING REPAIR:", err);
        process.exit(1);
    }
}

fix();
