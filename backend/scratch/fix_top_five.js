const mysql = require('mysql2/promise');

async function fixTopFive() {
    console.log("Fixing Top 5 Scouts...");
    try {
        const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'2003',database:'spms_db'});
        const ids = [1, 2, 3, 4, 5];
        for (const id of ids) {
            console.log("Updating ID:", id);
            await c.query("DELETE FROM scout_badge_progress WHERE scout_id = ?", [id]);
            await c.query("DELETE FROM activity_tracking WHERE scout_id = ?", [id]);
            await c.query("DELETE FROM service_logs WHERE scout_id = ?", [id]);

            const b = id === 1 ? 14 : (id * 3 % 10) + 5;
            const a = id === 1 ? 18 : (id * 5 % 12) + 6;
            const h = id === 1 ? 95 : (id * 15 % 50) + 20;

            for (let i = 1; i <= b; i++) await c.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type) VALUES (?, ?, 'COMPLETED')", [id, i]);
            for (let i = 1; i <= a; i++) await c.query("INSERT INTO activity_tracking (scout_id, activity_id, activity_status) VALUES (?, ?, 'COMPLETED')", [id, i]);
            await c.query("INSERT INTO service_logs (scout_id, hours, status, service_date) VALUES (?, ?, 'APPROVED', NOW())", [id, h]);
        }
        console.log("SUCCESS.");
        await c.end();
    } catch (e) { console.error("ERR:", e.message); }
    process.exit(0);
}
fixTopFive();
