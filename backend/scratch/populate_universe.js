require('dotenv').config({ path: '../.env' });
const pool = require('../src/config/db.config');

async function populateUniverse() {
    console.log("🌌 POPULATING SYSTEM WITH REALISTIC DATA...");
    try {
        const [scouts] = await pool.query("SELECT id FROM scouts");
        const [acts] = await pool.query("SELECT id FROM activities LIMIT 18");
        const [badges] = await pool.query("SELECT id FROM badges LIMIT 14");
        
        console.log(`Scouts: ${scouts.length}, Activities: ${acts.length}, Badges: ${badges.length}`);

        for (const scout of scouts) {
            console.log(`⭐ Syncing Scout ${scout.id}...`);

            // 1. Give 18 Completed Activities
            for (const act of acts) {
                await pool.query(`
                    INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status, observed_by_name, hours_spent)
                    VALUES (?, ?, 'COMPLETED', 'VERIFIED', 'Leader Manual Sync', 3)
                    ON DUPLICATE KEY UPDATE activity_status = 'COMPLETED', action_status = 'VERIFIED'
                `, [scout.id, act.id]);
            }

            // 2. Give 14 Completed Badges
            for (const badge of badges) {
                await pool.query(`
                    INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, achieved_date)
                    VALUES (?, ?, 'COMPLETED', 100.00, 5, 5, NOW())
                    ON DUPLICATE KEY UPDATE progress_type = 'COMPLETED', completion_percentage = 100.00
                `, [scout.id, badge.id]);
            }

            // 3. Give 95 Service Hours
            await pool.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);
            await pool.query(`
                INSERT INTO service_logs (scout_id, service_date, hours, description, status) 
                VALUES (?, NOW(), 95, 'Legacy Scout Achievement Sync', 'APPROVED')
            `, [scout.id]);
        }

        console.log("✅ SYSTEM POPULATED SUCCESSFULLY!");
    } catch (e) {
        console.error("❌ POPULATION FAILED:", e.message);
    }
    process.exit();
}

populateUniverse();
