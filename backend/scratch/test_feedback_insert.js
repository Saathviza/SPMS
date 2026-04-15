const pool = require('./src/config/db.config');
const fs = require('fs');

async function testInsert() {
    try {
        console.log("Starting test insert...");
        const [res] = await pool.query(
            "INSERT INTO feedback (author_id, target_type, target_id, message) VALUES (?, ?, ?, ?)",
            [1, 'badge_submission', 1, 'Test message']
        );
        fs.writeFileSync('c:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\test_insert_success.txt', JSON.stringify(res, null, 2));
        console.log("Success!");
    } catch (err) {
        fs.writeFileSync('c:\\Users\\Home\\OneDrive\\Desktop\\scout-pms\\backend\\test_insert_error.txt', err.stack);
        console.error("Error:", err.message);
    }
    process.exit();
}

testInsert();
