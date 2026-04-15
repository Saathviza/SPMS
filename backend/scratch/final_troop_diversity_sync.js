const mysql = require('mysql2/promise');

async function finalTroopDiversitySync() {
    console.log("⚡ STARTING FINAL TROOP DIVERSITY SYNC...");
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });

        // 1. Get Resources
        const [scouts] = await c.query("SELECT id FROM scouts");
        const [acts] = await c.query("SELECT id FROM activities");
        const [badges] = await c.query("SELECT id FROM badges");
        
        console.log(`Synchronizing ${scouts.length} scouts...`);

        for (const scout of scouts) {
            let bTarget, aTarget, hTarget;

            if (scout.id === 1) { // 🌟 SHERA (Protected)
                bTarget = 14; aTarget = 18; hTarget = 95;
            } else { // 🎭 Troop Diversity (Tiered by ID parity)
                const tier = scout.id % 3;
                if (tier === 0) { // Tier: Junior
                    bTarget = 3; aTarget = 5; hTarget = 12;
                } else if (tier === 1) { // Tier: Active
                    bTarget = 8; aTarget = 11; hTarget = 42;
                } else { // Tier: Senior 
                    bTarget = 16; aTarget = 21; hTarget = 115;
                }
            }

            // Wipe and Atomic Insert
            await c.query("DELETE FROM activity_tracking WHERE scout_id = ?", [scout.id]);
            await c.query("DELETE FROM scout_badge_progress WHERE scout_id = ?", [scout.id]);
            await c.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);

            // Activities
            for (let i = 0; i < Math.min(aTarget, acts.length); i++) {
                await c.query("INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status) VALUES (?, ?, 'COMPLETED', 'VERIFIED')", [scout.id, acts[i].id]);
            }

            // Badges
            for (let i = 0; i < Math.min(bTarget, badges.length); i++) {
                await c.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage) VALUES (?, ?, 'COMPLETED', 100)", [scout.id, badges[i].id]);
            }

            // Service Hours (Simplified entry for performance)
            await c.query("INSERT INTO service_logs (scout_id, service_date, hours, status) VALUES (?, NOW(), ?, 'APPROVED')", [scout.id, hTarget]);
            
            if(scout.id % 50 === 0) console.log(`Checkpoint: ${scout.id} scouts processed.`);
        }

        console.log("✅ TROOP DIVERSITY SUCCESSFUL!");
        await c.end();
    } catch (e) {
        console.error("CRITICAL SYNC FAILURE:", e.message);
    }
    process.exit(0);
}

finalTroopDiversitySync();
