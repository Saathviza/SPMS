const mysql = require('mysql2/promise');
async function run() {
    console.log("Searching for Shera...");
    try {
        const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'2003',database:'spms_db'});
        const [r] = await c.query("SELECT s.id, u.full_name FROM scouts s JOIN users u ON s.user_id = u.id WHERE u.full_name LIKE '%Shera%'");
        console.log("Result:", JSON.stringify(r));
    } catch (e) { console.error("Error:", e.message); }
    process.exit();
}
run();
