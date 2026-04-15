const pool = require('../src/config/db.config');
async function run() {
    try {
        const [rows] = await pool.query('SELECT id, activity_name, activity_date FROM activities');
        require('fs').writeFileSync('c:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\scratch\\acts_check.json', JSON.stringify(rows, null, 2));
    } catch (e) { require('fs').writeFileSync('c:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\scratch\\acts_err.txt', e.stack); }
    process.exit();
}
run();
