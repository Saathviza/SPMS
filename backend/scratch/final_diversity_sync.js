const mysql = require('mysql2/promise');
const fs = require('fs');

const LOG_FILE = 'diversity_log.txt';
function log(msg) { 
    console.log(msg);
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`); 
}

async function run() {
    fs.writeFileSync(LOG_FILE, '--- DIVERSITY LOG START ---\n');
    log("Starting Diversity Sync...");
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });
        log("DB Connected.");
        
        const [scouts] = await connection.query("SELECT id FROM scouts LIMIT 50");
        const [acts] = await connection.query("SELECT id FROM activities");
        const [badges] = await connection.query("SELECT id FROM badges");
        
        log(`Scouts found: ${scouts.length}`);

        for (const scout of scouts) {
            log(`Syncing Scout ${scout.id}...`);
            const tier = Math.random();
            let bCount, aCount, sHours;
            
            if (tier < 0.3) { // Beginner 1-6
                bCount = Math.floor(Math.random() * 5) + 2;
                aCount = Math.floor(Math.random() * 5) + 3;
                sHours = Math.floor(Math.random() * 20) + 10;
            } else if (tier < 0.7) { // Active 7-14
                bCount = Math.floor(Math.random() * 8) + 7;
                aCount = Math.floor(Math.random() * 8) + 8;
                sHours = Math.floor(Math.random() * 50) + 30;
            } else { // Advanced 15-22
                bCount = Math.floor(Math.random() * 8) + 15;
                aCount = Math.floor(Math.random() * 8) + 16;
                sHours = Math.floor(Math.random() * 80) + 80;
            }

            // Wipe
            await connection.query("DELETE FROM activity_tracking WHERE scout_id = ?", [scout.id]);
            await connection.query("DELETE FROM scout_badge_progress WHERE scout_id = ?", [scout.id]);
            await connection.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);

            // Activities
            for (let i = 0; i < Math.min(aCount, acts.length); i++) {
                await connection.query("INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status) VALUES (?, ?, 'COMPLETED', 'VERIFIED')", [scout.id, acts[i].id]);
            }

            // Badges
            for (let i = 0; i < Math.min(bCount, badges.length); i++) {
                await connection.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage) VALUES (?, ?, 'COMPLETED', 100)", [scout.id, badges[i].id]);
            }

            // Service
            await connection.query("INSERT INTO service_logs (scout_id, service_date, hours, status) VALUES (?, NOW(), ?, 'APPROVED')", [scout.id, sHours]);
            
            log(`Scout ${scout.id}: B=${bCount}, A=${aCount}, H=${sHours}`);
        }
        
        log("✅ SUCCESSFUL COMPLETION");
    } catch (e) {
        log(`❌ CRITICAL FAILURE: ${e.message}`);
    }
    process.exit(0);
}
run();
