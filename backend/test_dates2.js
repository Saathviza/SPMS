const pool = require('./src/config/db.config');

async function doIt() {
    try {
        console.log("WAITING TO CONNECT");
        await pool.query("UPDATE activities SET activity_date = '2026-04-18' WHERE activity_code = 'ACT003'");
        await pool.query("UPDATE activities SET activity_date = '2026-04-20' WHERE activity_code = 'ACT004'");
        await pool.query("UPDATE activities SET activity_date = '2026-04-11' WHERE activity_code = 'ACT006'");
        await pool.query("UPDATE activities SET activity_date = '2026-05-02' WHERE activity_code = 'ACT007'");
        
        const [rows] = await pool.query("SELECT activity_code, activity_date FROM activities WHERE activity_code IN ('ACT003','ACT004','ACT006','ACT007')");
        console.log("DATES UPDATED TO:", rows);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
doIt();
