const mysql = require('mysql2/promise');

async function testTwo() {
    console.log("Testing sync for scouts 1 and 2...");
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });
        
        const ids = [1, 2];
        for (const id of ids) {
            console.log("Syncing ID:", id);
            await connection.query("DELETE FROM activity_tracking WHERE scout_id = ?", [id]);
            await connection.query("INSERT INTO activity_tracking (scout_id, activity_id, activity_status) VALUES (?, 1, 'COMPLETED')", [id]);
            await connection.query("INSERT INTO activity_tracking (scout_id, activity_id, activity_status) VALUES (?, 2, 'COMPLETED')", [id]);
        }
        console.log("Done test.");
        await connection.end();
    } catch (e) {
        console.error("TEST FAILED:", e.message);
    }
}
testTwo().then(() => process.exit());
