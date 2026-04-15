const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    try {
        const c = await mysql.createConnection({
            host: process.env.DB_HOST, user: process.env.DB_USER,
            password: process.env.DB_PASS, database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT) || 3306
        });
        
        console.log("Connected!");
        
        const [q1] = await c.query("SELECT COUNT(*) as total FROM users WHERE role_id = 4 AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)");
        console.log("Q1 newScouts: ", q1);
        
        const [q2] = await c.query("SELECT COUNT(DISTINCT scout_id) as total FROM scout_badge_progress p JOIN badges b ON p.badge_id = b.id WHERE b.badge_level = 'AWARDS' AND p.progress_type = 'COMPLETED'");
        console.log("Q2 pres: ", q2);
        
        try {
            const [q3] = await c.query("SELECT COUNT(DISTINCT scout_id) as total FROM scout_badge_progress p JOIN badges b ON p.badge_id = b.id WHERE b.badge_level = 'PROFICIENCY' AND p.progress_type = 'COMPLETED' HAVING COUNT(p.badge_id) > 5");
            console.log("Q3 chief: ", q3);
        } catch(e) {
            console.error("Q3 ERROR: ", e.message);
        }
        
        try {
            const [q4] = await c.query("SELECT scout_id FROM scout_badge_progress WHERE progress_type = 'COMPLETED' GROUP BY scout_id HAVING COUNT(*) >= 15");
            console.log("Q4 eligible: ", q4.length);
        } catch(e) {
            console.error("Q4 ERROR: ", e.message);
        }

        // Just what is the total scout_badge_progress count?
        const [totalP] = await c.query("SELECT COUNT(*) as c FROM scout_badge_progress");
        console.log("Total scout_badge_progress records: ", totalP);

        // What badges are in the system?
        const [badges] = await c.query("SELECT badge_level, count(*) as c FROM badges GROUP BY badge_level");
        console.log("Badges grouped: ", badges);
        
        await c.end();
    } catch(e) {
        console.error("OVERALL ERR:", e);
    }
}
run();
