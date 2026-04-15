const mysql = require('mysql2/promise');

async function directFix() {
    console.log("Direct DB sync starting...");
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });
        console.log("Connected directly!");
        
        const [scouts] = await connection.query("SELECT id FROM scouts");
        console.log(`Found ${scouts.length} scouts.`);
        
        for (const scout of scouts) {
            // Badges (14)
            await connection.query("DELETE FROM scout_badge_progress WHERE scout_id = ?", [scout.id]);
            for (let i = 1; i <= 14; i++) {
                await connection.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, achieved_date) VALUES (?, ?, 'COMPLETED', 100.00, NOW())", [scout.id, i]);
            }
            
            // Activities (18)
            await connection.query("DELETE FROM activity_tracking WHERE scout_id = ?", [scout.id]);
            for (let i = 1; i <= 18; i++) {
                await connection.query("INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status, observed_by_name) VALUES (?, ?, 'COMPLETED', 'VERIFIED', 'Manual Fix')", [scout.id, i]);
            }
            
            console.log(`Scout ${scout.id} updated.`);
        }
        
        console.log("DONE");
    } catch (e) {
        console.error("FAIL:", e.message);
    }
    process.exit();
}
directFix();
