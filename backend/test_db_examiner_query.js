const pool = require('./src/config/db.config');

async function test() {
    try {
        console.log("Testing examiner query...");
        
        // 1. Check badge_examiners
        try {
            await pool.query("SELECT district FROM badge_examiners LIMIT 1");
            console.log("badge_examiners OK");
        } catch(err) {
            console.error("badge_examiners Error:", err.message);
        }

        // 2. Check main query
        let query = `
                SELECT bs.*, b.badge_name as name, b.description, b.level_name as badge_level,
                        u.full_name as scout_name, u.email as scout_email, TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) as age,
                        s.district as scout_district
                 FROM badge_submissions bs
                 JOIN badges b ON bs.badge_id = b.id
                 JOIN scouts s ON bs.scout_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE bs.status = 'PENDING'
            `;
        try {
            await pool.query(query);
            console.log("Main query OK");
        } catch(err) {
            console.error("Main query Error:", err.message);
        }
    } catch(err) {
        console.error(err);
    }
    process.exit();
}
test();
