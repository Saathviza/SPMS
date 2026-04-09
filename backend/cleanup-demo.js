const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function cleanup() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database for cleanup...");

        // 1. Delete proof submissions joined to future activities
        const [delProofs] = await connection.execute(`
            DELETE ps FROM activity_proof_submissions ps 
            JOIN activity_tracking t ON ps.tracking_id = t.id 
            JOIN activities a ON t.activity_id = a.id 
            WHERE a.activity_date > '2026-03-31'
        `);
        console.log(`- Deleted ${delProofs.affectedRows} future proof submissions.`);

        // 2. Delete activity tracking for future activities
        const [delTracking] = await connection.execute(`
            DELETE t FROM activity_tracking t 
            JOIN activities a ON t.activity_id = a.id 
            WHERE a.activity_date > '2026-03-31'
        `);
        console.log(`- Deleted ${delTracking.affectedRows} future activity tracking records.`);

        // 3. Delete activity registrations for future activities
        const [delRegs] = await connection.execute(`
            DELETE ar FROM activity_registrations ar 
            JOIN activities a ON ar.activity_id = a.id 
            WHERE a.activity_date > '2026-03-31'
        `);
        console.log(`- Deleted ${delRegs.affectedRows} future registrations.`);

        // 4. Verify count of any remaining future registrations
        const [verify] = await connection.execute(`
            SELECT COUNT(*) AS count FROM activity_registrations ar 
            JOIN activities a ON ar.activity_id = a.id 
            WHERE a.activity_date > '2026-03-31'
        `);
        console.log(`- Final Count of future activities: ${verify[0].count}`);

        console.log("✅ CLEANUP COMPLETE: No future activities remain.");
        await connection.end();
        process.exit(0);
    } catch (e) {
        console.error("❌ CLEANUP FAILED.");
        console.error(e);
        process.exit(1);
    }
}
cleanup();
