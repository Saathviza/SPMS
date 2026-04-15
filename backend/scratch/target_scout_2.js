const mysql = require('mysql2/promise');

async function targetScoutTwo() {
    console.log("Hyper-targeting Scout 2...");
    try {
        const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'2003',database:'spms_db'});
        
        await c.query("DELETE FROM scout_badge_progress WHERE scout_id = 2");
        await c.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage) VALUES (2, 1, 'COMPLETED', 100)");
        await c.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage) VALUES (2, 2, 'COMPLETED', 100)");
        
        console.log("Scout 2 updated.");
        await c.end();
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}
targetScoutTwo().then(() => process.exit(0));
