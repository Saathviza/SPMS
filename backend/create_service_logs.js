const mysql = require('mysql2/promise');

async function createServiceLogs() {
    console.log("🛠️ CREATING SERVICE_LOGS TABLE...");
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });

        await c.query(`
            CREATE TABLE IF NOT EXISTS service_logs (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                scout_id INT UNSIGNED NOT NULL,
                service_date DATE NOT NULL,
                hours DECIMAL(5,2) NOT NULL DEFAULT 0,
                description TEXT NULL,
                status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_service_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON UPDATE CASCADE ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        console.log("✅ TABLE CREATED.");
        await c.end();
    } catch (e) {
        console.error("❌ FAILED:", e.message);
    }
    process.exit(0);
}

createServiceLogs();
