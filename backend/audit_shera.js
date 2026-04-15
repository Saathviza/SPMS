const pool = require('./src/config/db.config');

async function check() {
    try {
        const [users] = await pool.query("SELECT id, email, full_name FROM users WHERE email LIKE '%shera%' OR full_name LIKE '%Shera%'");
        console.log("USERS_FOUND:", JSON.stringify(users));
        
        if (users.length > 0) {
            const [scouts] = await pool.query("SELECT id, user_id FROM scouts WHERE user_id IN (?)", [users.map(u => u.id)]);
            console.log("SCOUTS_FOUND:", JSON.stringify(scouts));
            
            if (scouts.length > 0) {
                 const [badges] = await pool.query("SELECT sbp.id, b.badge_name, sbp.achieved_date FROM scout_badge_progress sbp JOIN badges b ON sbp.badge_id = b.id WHERE sbp.scout_id IN (?) AND sbp.progress_type = 'COMPLETED'", [scouts.map(s => s.id)]);
                 console.log("BADGES_FOUND_COUNT:", badges.length);
                 console.log("BADGE_SAMPLE:", JSON.stringify(badges.slice(0, 3)));
            }
        }
    } catch(e) {
        console.error("AUDIT_ERROR:", e.message);
    }
    process.exit();
}
check();
