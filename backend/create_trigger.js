require('dotenv').config();
const mysql = require('mysql2/promise');

async function runTrigger() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '2003',
            database: process.env.DB_NAME || 'scout_performance_management_system'
        });

        console.log("Connected to MySQL for trigger.");

        await connection.query("DROP TRIGGER IF EXISTS trg_badge_award_on_approval;");

        const sql = `
CREATE TRIGGER trg_badge_award_on_approval
AFTER UPDATE ON badge_submissions
FOR EACH ROW
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status <> 'APPROVED' THEN
    INSERT INTO scout_badges_awarded (scout_id, badge_id, awarded_by_user_id)
    VALUES (NEW.scout_id, NEW.badge_id, NEW.reviewed_by_examiner_user_id)
    ON DUPLICATE KEY UPDATE
      awarded_at = NOW(),
      awarded_by_user_id = NEW.reviewed_by_examiner_user_id;
  END IF;
END
        `;

        console.log("Executing trigger creation...");
        await connection.query(sql);
        console.log("Trigger created successfully!");

        await connection.end();
    } catch (err) {
        console.error("Error creating trigger:", err);
    }
}

runTrigger();
