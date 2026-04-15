const pool = require('../src/config/db.config');
async function test() {
    console.log("Testing pool connection...");
    try {
        const [rows] = await pool.query("SELECT s.id, u.full_name FROM scouts s JOIN users u ON s.user_id = u.id");
        console.log("Scouts found:", rows.length);
        console.log("Samples:", JSON.stringify(rows.slice(0, 5)));
    } catch (e) { console.error("Pool Error:", e.message); }
    process.exit();
}
test();
