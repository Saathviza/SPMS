const pool = require('../src/config/db.config');
async function run() {
    console.log("STARTING GLOBAL FIX...");
    try {
        const [scouts] = await pool.query("SELECT s.id, u.full_name FROM scouts s JOIN users u ON s.user_id = u.id");
        console.log(`Found ${scouts.length} scouts.`);
        
        for (const scout of scouts) {
            console.log(`Fixing Scout ${scout.id} (${scout.full_name})...`);
            
            // 1. Force Activities
            await pool.query("UPDATE activity_tracking SET activity_status = 'COMPLETED', action_status = 'VERIFIED' WHERE scout_id = ?", [scout.id]);
            
            // 2. Force Badges
            await pool.query("UPDATE scout_badge_progress SET progress_type = 'COMPLETED', completion_percentage = 100.00 WHERE scout_id = ?", [scout.id]);
            
            // 3. Force Service
            await pool.query("UPDATE service_logs SET status = 'APPROVED' WHERE scout_id = ?", [scout.id]);
        }
        console.log("✅ ALL SCOUTS SYNCHRONIZED.");
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }
    process.exit();
}
run();
