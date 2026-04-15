const pool = require('./src/config/db.config');

async function test() {
    try {
        const [rows] = await pool.query("SELECT DATABASE() as db");
        console.log("ACTUAL_DATABASE_IN_USE:", rows[0].db);
        
        const [users] = await pool.query("SELECT COUNT(*) as count FROM users");
        console.log("USER_COUNT:", users[0].count);
        
        const [shera] = await pool.query("SELECT id FROM users WHERE email='sherasaathvizarajkumar@gmail.com'");
        console.log("SHERA_USER_FOUND:", shera.length > 0);
        
    } catch(e) {
        console.error(e.message);
    }
    process.exit();
}
test();
