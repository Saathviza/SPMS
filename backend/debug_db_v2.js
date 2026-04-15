const pool = require('./src/config/db.config');
const fs = require('fs');

async function debug() {
    let output = "";
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email LIKE '%examiner%'");
        output += "Examiner Users: " + JSON.stringify(users) + "\n";
        
        if (users.length > 0) {
            const [profiles] = await pool.query("SELECT * FROM badge_examiners WHERE user_id = ?", [users[0].id]);
            output += "Examiner Profiles: " + JSON.stringify(profiles) + "\n";
        }

        const [submissions] = await pool.query("SELECT COUNT(*) as count FROM badge_submissions");
        output += "Submissions Count: " + submissions[0].count + "\n";

        fs.writeFileSync('debug_db_v2.txt', output);
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('debug_db_v2.txt', "ERROR: " + err.message + "\n" + err.stack);
        process.exit(1);
    }
}

debug();
