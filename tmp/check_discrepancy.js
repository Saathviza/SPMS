const mysql = require('mysql2/promise');

async function check() {
    process.stdout.write("Probing for discrepancies...\n");
    const config = {
        host: '127.0.0.1',
        user: 'root',
        password: '2003',
        database: 'spms_db',
        port: 3306
    };

    try {
        const conn = await mysql.createConnection(config);
        
        // Use user_id 1 like in previous attempts
        const [scouts] = await conn.query("SELECT id FROM scouts WHERE user_id = 1");
        if (scouts.length === 0) {
            process.stdout.write("Scout not found.\n");
            return;
        }
        const scoutId = scouts[0].id;
        
        process.stdout.write(`\n--- SCOUT ID: ${scoutId} ---\n`);

        // 1. Check activity_tracking (what dashboard uses)
        const [tracking] = await conn.query(
            "SELECT COUNT(*) as count FROM activity_tracking WHERE scout_id = ? AND activity_status = 'COMPLETED'",
            [scoutId]
        );
        process.stdout.write(`Dashboard Count (activity_tracking COMPLETED): ${tracking[0].count}\n`);

        // 2. Check activity_submissions (new table)
        const [submissions] = await conn.query(
            "SELECT ar.activity_id, s.status FROM activity_submissions s JOIN activity_registrations ar ON s.registration_id = ar.id WHERE ar.scout_id = ?",
            [scoutId]
        );
        process.stdout.write(`Submissions statuses: ${JSON.stringify(submissions)}\n`);

        // 3. Overall Activity Counts by status
        const [allTracking] = await conn.query(
            "SELECT activity_status, COUNT(*) as count FROM activity_tracking WHERE scout_id = ? GROUP BY activity_status",
            [scoutId]
        );
        process.stdout.write(`All Tracking Statuses: ${JSON.stringify(allTracking)}\n`);

        await conn.end();
    } catch (e) {
        process.stdout.write("ERROR: " + e.message + "\n");
    }
}

check();
