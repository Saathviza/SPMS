const mysql = require('mysql2/promise');

async function realisticVarianceSync() {
    console.log("🎲 GENERATING REALISTIC DIVERSITY FOR ALL SCOUTS...");
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
        
        console.log(`Processing diversity for ${scouts.length} scouts...`);

        for (const scout of scouts) {
            // Determine a "Level" for this scout to keep data consistent
            // 0: Beginner, 1: Active, 2: Senior
            const level = Math.floor(Math.random() * 3);
            
            let badgeCount, activityCount, serviceHours;
            
            if (level === 0) { // Beginner
                badgeCount = Math.floor(Math.random() * 5) + 1; // 1-5
                activityCount = Math.floor(Math.random() * 6) + 2; // 2-7
                serviceHours = Math.floor(Math.random() * 15) + 2; // 2-17
            } else if (level === 1) { // Active
                badgeCount = Math.floor(Math.random() * 7) + 6; // 6-12
                activityCount = Math.floor(Math.random() * 8) + 8; // 8-15
                serviceHours = Math.floor(Math.random() * 40) + 20; // 20-60
            } else { // Senior
                badgeCount = Math.floor(Math.random() * 10) + 13; // 13-22
                activityCount = Math.floor(Math.random() * 10) + 16; // 16-25
                serviceHours = Math.floor(Math.random() * 70) + 70; // 70-140
            }

            // --- Apply to Database ---
            
            // 1. Wipe old records for this scout
            await connection.query("DELETE FROM activity_tracking WHERE scout_id = ?", [scout.id]);
            await connection.query("DELETE FROM scout_badge_progress WHERE scout_id = ?", [scout.id]);
            await connection.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);

            // 2. Insert Activities
            for (let i = 0; i < Math.min(activityCount, acts.length); i++) {
                await connection.query(`
                    INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status, observed_by_name)
                    VALUES (?, ?, 'COMPLETED', 'VERIFIED', 'System Import')
                `, [scout.id, acts[i].id]);
            }

            // 3. Insert Badges
            for (let i = 0; i < Math.min(badgeCount, badges.length); i++) {
                await connection.query(`
                    INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, achieved_date)
                    VALUES (?, ?, 'COMPLETED', 100.00, DATE_SUB(NOW(), INTERVAL ? DAY))
                `, [scout.id, badges[i].id, Math.floor(Math.random() * 365)]);
            }

            // 4. Insert Service Logs
            // We split hours into 3-5 different log entries for realism
            const logEntries = Math.floor(Math.random() * 3) + 2;
            const hoursPerEntry = Math.floor(serviceHours / logEntries);
            for (let i = 0; i < logEntries; i++) {
                await connection.query(`
                    INSERT INTO service_logs (scout_id, service_date, hours, description, status)
                    VALUES (?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, 'Community service project', 'APPROVED')
                `, [scout.id, Math.floor(Math.random() * 180), hoursPerEntry]);
            }
        }
        
        console.log("✅ DIVERSITY SYNC COMPLETE!");
        await connection.end();
    } catch (e) {
        console.error("❌ DIVERSITY SYNC FAILED:", e.message);
    }
}

realisticVarianceSync().then(() => process.exit(0));
