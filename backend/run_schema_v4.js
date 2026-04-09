const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function cleanAndMigrate() {
    let connection;
    try {
        const dbName = process.env.DB_NAME || 'scout_performance_management_system';

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '2003'
        });

        console.log("✅ Initial connection established.");

        console.log(`🧹 Dropping and recreating database: ${dbName}`);
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
        await connection.query(`CREATE DATABASE \`${dbName}\`;`);
        await connection.query(`USE \`${dbName}\`;`);

        const [dbResult] = await connection.query("SELECT DATABASE();");
        console.log("Current Database:", dbResult[0]['DATABASE()']);

        const sqlFilePath = path.join(__dirname, 'schema.sql');
        const fullSql = fs.readFileSync(sqlFilePath, 'utf8');

        // Statements to run
        const rawStatements = fullSql.split(';');
        const statements = [];

        for (let s of rawStatements) {
            s = s.trim();
            if (s.length === 0) continue;

            const upper = s.toUpperCase();
            if (upper.startsWith('DROP DATABASE ')) continue;
            if (upper.startsWith('CREATE DATABASE ')) continue;
            if (upper.startsWith('USE ')) continue;

            // IGNORE COMMENTS AT START
            const lines = s.split('\n');
            let cleanedS = "";
            for (let line of lines) {
                if (!line.trim().startsWith('--')) {
                    cleanedS += line + '\n';
                }
            }
            if (cleanedS.trim().length > 0) {
                statements.push(cleanedS.trim());
            }
        }

        console.log(`🚀 Executing ${statements.length} SQL statements...`);

        for (let i = 0; i < statements.length; i++) {
            try {
                // EXPLICITLY RE-SELECT DB BEFORE EVERY STATEMENT TO BE PARANOID
                await connection.query(`USE \`${dbName}\`;`);
                await connection.query(statements[i]);
            } catch (err) {
                console.error(`❌ Statement ${i + 1} Error:`, err.message);
                console.error(`SQL Snippet: ${statements[i].substring(0, 100)}...`);
            }
        }

        console.log("✅ Database migration and seeding finished.");

        // Create trigger separately
        console.log("🚀 Creating trigger...");
        await connection.query(`USE \`${dbName}\`;`);
        await connection.query("DROP TRIGGER IF EXISTS trg_badge_award_on_approval;");
        const triggerSql = `
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
        await connection.query(triggerSql);
        console.log("✅ Trigger created.");

        await connection.end();
    } catch (err) {
        console.error("❌ Fatal clean/migrate error:", err);
        if (connection) {
            try { await connection.end(); } catch (ignore) { }
        }
    }
}

cleanAndMigrate();
