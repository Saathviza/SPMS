const mysql = require("mysql2/promise");

async function seedAll() {
    console.log("Starting bulk seed...");
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });
        
        const [scouts] = await connection.query("SELECT id FROM scouts");
        console.log("Scout IDs found:", scouts.length);
        
        const [acts] = await connection.query("SELECT id FROM activities LIMIT 20");
        
        for (const scout of scouts) {
            console.log("Seeding Scout ID:", scout.id);
            // Activities
            for (const act of acts) {
                await connection.query(`
                    INSERT INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes)
                    VALUES (?, ?, 'Bulk Seed', 3, 'COMPLETED', 'VERIFIED', 'Seeded')
                    ON DUPLICATE KEY UPDATE activity_status = 'COMPLETED', action_status = 'VERIFIED'
                `, [scout.id, act.id]);
            }
            
            // Service Hours (10 entries for ~100 hours)
            await connection.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);
            for (let i = 1; i <= 10; i++) {
                await connection.query(`
                    INSERT INTO service_logs (scout_id, service_date, hours, description, status, approved_at)
                    VALUES (?, '2025-01-01', 10, 'Seeded service entry', 'APPROVED', NOW())
                `, [scout.id]);
            }
        }
        console.log("✅ Bulk seed complete!");
    } catch (e) {
        console.error("Bulk seed failed:", e.message);
    }
    process.exit();
}
seedAll();
