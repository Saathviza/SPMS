const mysql = require('mysql2/promise');
const fs = require('fs');

async function debugInsert() {
    try {
        const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'2003',database:'spms_db'});
        console.log("Connected.");
        
        try {
            const [res] = await c.query("INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage) VALUES (2, 1, 'COMPLETED', 100)");
            fs.writeFileSync('insert_success.txt', `Inserted ID: ${res.insertId}`);
        } catch (inner) {
            fs.writeFileSync('insert_fail.txt', inner.message);
        }
        await c.end();
    } catch (outer) {
        fs.writeFileSync('connect_fail.txt', outer.message);
    }
}
debugInsert().then(() => process.exit(0));
