const mysql = require('mysql2/promise');
const fs = require('fs');

async function finalRealisticSync() {
    const reportPath = 'sync_report.json';
    const report = { timestamp: new Date().toISOString(), scouts_updated: [] };
    
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });

        const [scouts] = await c.query("SELECT id FROM scouts LIMIT 60");
        const [acts] = await c.query("SELECT id FROM activities");
        const [badges] = await c.query("SELECT id FROM badges");

        for (const scout of scouts) {
            // Randomly pick a tier for this scout
            const rand = Math.random();
            let bTarget, aTarget, hTarget;

            if (rand < 0.3) { // Beginner (Tier 1)
                bTarget = Math.floor(Math.random() * 4) + 1; // 1-4
                aTarget = Math.floor(Math.random() * 5) + 2; // 2-6
                hTarget = Math.floor(Math.random() * 15) + 5; // 5-20
            } else if (rand < 0.7) { // Intermediate (Tier 2)
                bTarget = Math.floor(Math.random() * 7) + 5; // 5-11
                aTarget = Math.floor(Math.random() * 8) + 8; // 8-15
                hTarget = Math.floor(Math.random() * 40) + 25; // 25-65
            } else { // Advanced (Tier 3)
                bTarget = Math.floor(Math.random() * 9) + 13; // 13-21
                aTarget = Math.floor(Math.random() * 7) + 18; // 18-24
                hTarget = Math.floor(Math.random() * 70) + 80; // 80-150
            }

            // Clean existing data for this scout
            await c.query("DELETE FROM activity_tracking WHERE scout_id = ?", [scout.id]);
            await c.query("DELETE FROM scout_badge_progress WHERE scout_id = ?", [scout.id]);
            await c.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);

            // Sync Activities
            for (let i = 0; i < Math.min(aTarget, acts.length); i++) {
                await c.query("INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status) VALUES (?, ?, 'COMPLETED', 'VERIFIED')", [scout.id, acts[i].id]);
            }

            // Sync Badges
            for (let i = 0; i < Math.min(bTarget, badges.length); i++) {
                await c.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, achieved_date) VALUES (?, ?, 'COMPLETED', 100, DATE_SUB(NOW(), INTERVAL ? DAY))", [scout.id, badges[i].id, Math.floor(Math.random() * 300)]);
            }

            // Sync Service Hours
            await c.query("INSERT INTO service_logs (scout_id, service_date, hours, status) VALUES (?, NOW(), ?, 'APPROVED')", [scout.id, hTarget]);

            report.scouts_updated.push({ id: scout.id, badges: bTarget, activities: aTarget, hours: hTarget });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        await c.end();
        console.log("Sync process complete.");
    } catch (err) {
        fs.writeFileSync('sync_error.txt', err.stack);
        process.exit(1);
    }
    process.exit(0);
}

finalRealisticSync();
