const pool = require('../src/config/db.config');
const fs = require('fs');

async function testQuery() {
    let output = "";
    try {
        const scout_id = 1;
        const [scouts] = await pool.query(
            `SELECT s.*, u.email, u.full_name, sg.group_name,
                (SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = s.id AND progress_type = 'COMPLETED') as badges_earned,
                (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = s.id AND activity_status = 'COMPLETED') as activities_completed,
                (SELECT COALESCE(SUM(hours), 0) FROM service_logs WHERE scout_id = s.id AND status = 'APPROVED') as service_hours
             FROM scouts s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN scout_groups sg ON s.scout_group_id = sg.id
             WHERE s.id = ?`,
            [scout_id]
        );
        output = "Success: " + JSON.stringify(scouts[0], null, 2);
    } catch (err) {
        output = "Error details: " + err.message + "\n" + err.stack;
    }
    fs.writeFileSync('query_result.txt', output);
    process.exit();
}

testQuery();
