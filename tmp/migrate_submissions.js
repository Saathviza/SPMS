const pool = require('./backend/src/config/db.config');

async function migrate() {
    try {
        console.log("🚀 Starting Migration...");
        
        // 1. Create activity_submissions if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_submissions (
                id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                registration_id INT UNSIGNED NOT NULL UNIQUE,
                comment TEXT NULL,
                submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status ENUM('SUBMITTED','APPROVED','REJECTED','NEEDS_CHANGES') NOT NULL DEFAULT 'SUBMITTED',
                reviewed_by_leader_user_id INT UNSIGNED NULL,
                reviewed_at TIMESTAMP NULL,
                review_note TEXT NULL,
                CONSTRAINT fk_as_reg FOREIGN KEY (registration_id) 
                    REFERENCES activity_registrations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log("✅ activity_submissions table ready.");

        // 2. Create activity_submission_files if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_submission_files (
                id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                submission_id INT UNSIGNED NOT NULL,
                file_id INT UNSIGNED NOT NULL,
                CONSTRAINT fk_asf_sub FOREIGN KEY (submission_id) REFERENCES activity_submissions(id) ON DELETE CASCADE,
                CONSTRAINT fk_asf_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log("✅ activity_submission_files table ready.");

        console.log("🎉 Migration Completed Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration Failed:", err.message);
        process.exit(1);
    }
}

migrate();
