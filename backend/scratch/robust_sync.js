const mysql = require('mysql2/promise');

async function robustSync() {
    console.log("RE-SYNCHRONIZING SYSTEM...");
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });
        
        const [scouts] = await connection.query("SELECT id FROM scouts");
        const [acts] = await connection.query("SELECT id FROM activities");
        const [badges] = await connection.query("SELECT id FROM badges");
        
        console.log(`Scouts: ${scouts.length}, Activities: ${acts.length}, Badges: ${badges.length}`);

        for (const scout of scouts) {
            // Activities - take up to 18
            await connection.query("DELETE FROM activity_tracking WHERE scout_id = ?", [scout.id]);
            for (let i = 0; i < Math.min(18, acts.length); i++) {
                await connection.query(`
                    INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status, observed_by_name)
                    VALUES (?, ?, 'COMPLETED', 'VERIFIED', 'Migration Sync')
                `, [scout.id, acts[i].id]);
            }
            
            // Badges - take up to 14
            await connection.query("DELETE FROM scout_badge_progress WHERE scout_id = ?", [scout.id]);
            for (let i = 0; i < Math.min(14, badges.length); i++) {
                await connection.query(`
                    INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, achieved_date)
                    VALUES (?, ?, 'COMPLETED', 100.00, NOW())
                `, [scout.id, badges[i].id]);
            }
            
            // Service Hours
            await connection.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);
            await connection.query("INSERT INTO service_logs (scout_id, service_date, hours, description, status) VALUES (?, NOW(), 95, 'Sync', 'APPROVED')", [scout.id]);
        }
        
        console.log("SYNC FINISHED SUCCESSFULLY");
        await connection.end();
    } catch (e) {
        console.error("CRITICAL ERROR:", e.message);
    }
}

robustSync().then(() => {
    console.log("Process complete.");
    process.exit(0);
});
