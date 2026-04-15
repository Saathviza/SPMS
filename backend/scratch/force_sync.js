const mysql = require('mysql2/promise');
async function forceSync() {
    console.log("Force Synchronizing Progress...");
    try {
        const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'2003',database:'spms_db'});
        
        // 1. Force complete ALL tracking records for Shera (ID 1)
        console.log("Completing all activities for Scout ID 1...");
        await c.query("UPDATE activity_tracking SET activity_status = 'COMPLETED', action_status = 'VERIFIED' WHERE scout_id = 1");
        
        // 2. Ensure ALL scouts have at least 15 completed activities
        const [scouts] = await c.query("SELECT id FROM scouts");
        const [acts] = await c.query("SELECT id FROM activities");
        
        for (const scout of scouts) {
            console.log(`Setting up Scout ID ${scout.id}...`);
            // Complete existing ones
            await c.query("UPDATE activity_tracking SET activity_status = 'COMPLETED', action_status = 'VERIFIED' WHERE scout_id = ?", [scout.id]);
            
            // Add new ones to reach 15 if needed
            for (let i = 0; i < 15; i++) {
                if (acts[i]) {
                    await c.query(`
                        INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status, observed_by_name)
                        VALUES (?, ?, 'COMPLETED', 'VERIFIED', 'Force Sync')
                        ON DUPLICATE KEY UPDATE activity_status = 'COMPLETED', action_status = 'VERIFIED'
                    `, [scout.id, acts[i].id]);
                }
            }
            
            // 3. Force complete 14 badges for everyone for demo
            const [badges] = await c.query("SELECT id FROM badges LIMIT 14");
            for (const badge of badges) {
                await c.query(`
                    INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, achieved_date)
                    VALUES (?, ?, 'COMPLETED', 100.00, 5, 5, NOW())
                    ON DUPLICATE KEY UPDATE progress_type = 'COMPLETED', completion_percentage = 100.00
                `, [scout.id, badge.id]);
            }
            
            // 4. Force add service hours
            await c.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);
            await c.query("INSERT INTO service_logs (scout_id, service_date, hours, description, status) VALUES (?, NOW(), 95, 'Legacy service hours sync', 'APPROVED')", [scout.id]);
        }
        
        console.log("✅ FORCE SYNC COMPLETE!");
    } catch (e) {
        console.error("Force Sync FAILED:", e.message);
    }
    process.exit();
}
forceSync().then(() => process.exit()).catch(e => { console.error("FATAL ERROR:", e); process.exit(1); });
