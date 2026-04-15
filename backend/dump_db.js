const pool = require('./src/config/db.config');
const fs = require('fs');

async function test() {
    try {
        const [users] = await pool.query("SELECT id, email FROM users");
        const [examiners] = await pool.query("SELECT * FROM badge_examiners");
        const [scouts] = await pool.query("SELECT id, district FROM scouts");
        const [submissions] = await pool.query("SELECT * FROM badge_submissions");
        
        const data = {
            users,
            examiners,
            scouts,
            submissions_count: submissions.length
        };
        
        fs.writeFileSync('C:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\DB_DUMP.json', JSON.stringify(data, null, 2));
        console.log("DUMP COMPLETE");
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('C:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\DB_DUMP_ERR.txt', e.message + "\n" + e.stack);
        process.exit(1);
    }
}
test();
