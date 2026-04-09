const mysql = require('mysql2/promise');

async function check() {
    process.stdout.write("Probing...\n");
    const config = {
        host: '127.0.0.1',
        user: 'root',
        password: '2003',
        database: 'spms_db',
        port: 3306
    };

    try {
        const conn = await mysql.createConnection(config);
        process.stdout.write("Connected to DB.\n");

        // Find scout id for user 1
        const [scouts] = await conn.query("SELECT id FROM scouts WHERE user_id = 1");
        if (scouts.length === 0) {
            process.stdout.write("No scout found for user_id=1\n");
            await conn.end();
            return;
        }
        const scoutId = scouts[0].id;
        process.stdout.write(`Scout ID for User 1 is: ${scoutId}\n`);

        // Check activity_tracking
        const [tracking] = await conn.query("SELECT * FROM activity_tracking WHERE scout_id = ?", [scoutId]);
        process.stdout.write(`\nActivity Tracking for Scout ${scoutId}:\n`);
        process.stdout.write(JSON.stringify(tracking, null, 2) + "\n");

        // Check registration status
        const [regs] = await conn.query("SELECT * FROM activity_registrations WHERE scout_id = ?", [scoutId]);
        process.stdout.write(`\nActivity Registrations for Scout ${scoutId}:\n`);
        process.stdout.write(JSON.stringify(regs, null, 2) + "\n");

        await conn.end();
    } catch (e) {
        process.stdout.write("ERROR: " + e.message + "\n");
    }
}

check().catch(e => process.stdout.write("FATAL: " + e.message + "\n"));
