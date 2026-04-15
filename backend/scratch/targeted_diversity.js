const mysql = require('mysql2/promise');

async function diversifiedSeed() {
    console.log("🎲 STARTING TARGETED DIVERSITY SEED (First 50 Scouts)...");
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });
        
        const [scouts] = await connection.query("SELECT id, scout_group_id FROM scouts LIMIT 50");
        const [acts] = await connection.query("SELECT id FROM activities");
        const [badges] = await connection.query("SELECT id FROM badges");
        
        console.log(`Processing ${scouts.length} scouts...`);

        for (const scout of scouts) {
            // Assign a progress tier
            const tier = Math.random();
            let bCount, aCount, sHours;
            
            if (tier < 0.4) { // Beginner (40%)
                bCount = Math.floor(Math.random() * 4) + 1;
                aCount = Math.floor(Math.random() * 5) + 2;
                sHours = Math.floor(Math.random() * 12) + 5;
            } else if (tier < 0.8) { // Intermediate (40%)
                bCount = Math.floor(Math.random() * 6) + 6;
                aCount = Math.floor(Math.random() * 7) + 8;
                sHours = Math.floor(Math.random() * 30) + 25;
            } else { // Advanced (20%)
                bCount = Math.floor(Math.random() * 10) + 13;
                aCount = Math.floor(Math.random() * 10) + 16;
                sHours = Math.floor(Math.random() * 60) + 70;
            }

            // Wipe and insert
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

            // Service Hours (split into 3 logs)
            for (let i = 0; i < 3; i++) {
                await connection.query("INSERT INTO service_logs (scout_id, service_date, hours, status) VALUES (?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, 'APPROVED')", [scout.id, i * 30, Math.floor(sHours/3)]);
            }
        }
        
        console.log("✅ TARGETED DIVERSITY COMPLETE!");
        await connection.end();
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}

diversifiedSeed().then(() => process.exit(0));
