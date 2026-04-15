const mysql = require('mysql2/promise');

async function debugSync() {
    console.log("Starting Debug Sync...");
    try {
        const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'2003',database:'spms_db'});
        console.log("DB Connected.");
        
        const scouts = [1, 2, 3, 4, 5];
        for (const id of scouts) {
            console.log("Processing ID:", id);
            await c.query("DELETE FROM activity_tracking WHERE scout_id = ?", [id]);
            const [res] = await c.query("INSERT INTO activity_tracking (scout_id, activity_id, activity_status) VALUES (?, 1, 'COMPLETED')", [id]);
            console.log(`Inserted ${res.affectedRows} row for ${id}`);
        }
        console.log("Final check...");
        const [counts] = await c.query("SELECT scout_id, COUNT(*) as cnt FROM activity_tracking GROUP BY scout_id");
        console.log("Counts:", JSON.stringify(counts));
        await c.end();
    } catch (e) { console.error("FATAL ERROR:", e.message); }
}
debugSync().then(() => { console.log("Script Finished."); process.exit(0); });
