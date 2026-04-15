const pool = require('./src/config/db.config');

const sql = `
CREATE TABLE IF NOT EXISTS service_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_id INT UNSIGNED NOT NULL,
    service_date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status ENUM('SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    approved_by_leader_user_id INT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_log_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_service_log_leader FOREIGN KEY (approved_by_leader_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
`;

async function run() {
    try {
        await pool.query(sql);
        console.log("✅ service_logs table ensured.");
    } catch (e) {
        console.error("❌ Error creating table:", e.message);
    }
    process.exit();
}
run();
