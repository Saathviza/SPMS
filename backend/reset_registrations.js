/**
 * reset_registrations.js
 * Clears all pre-seeded registrations and tracking for scout_id=1
 * so the scout can register themselves via the UI (real-time flow).
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '2003',
        database: process.env.DB_NAME || 'spms_db',
    });

    console.log('Connected to spms_db\n');

    // 1. Remove proof submissions first (FK dependency)
    const [r0] = await conn.query('DELETE FROM activity_proof_submissions WHERE 1=1');
    console.log('Cleared proof submissions:', r0.affectedRows);

    // 2. Remove tracking
    const [r2] = await conn.query('DELETE FROM activity_tracking WHERE scout_id = 1');
    console.log('Cleared activity_tracking for scout 1:', r2.affectedRows);

    // 3. Remove registrations
    const [r1] = await conn.query('DELETE FROM activity_registrations WHERE scout_id = 1');
    console.log('Cleared activity_registrations for scout 1:', r1.affectedRows);

    // 4. Show current activities
    const [acts] = await conn.query(
        "SELECT id, activity_name, status FROM activities ORDER BY id"
    );
    console.log('\nActivities in DB (' + acts.length + ' total):');
    acts.forEach(a => console.log('  -', '[' + a.status + ']', a.activity_name));

    // 5. Confirm 0 registrations
    const [regs] = await conn.query('SELECT COUNT(*) as cnt FROM activity_registrations WHERE scout_id = 1');
    console.log('\nRegistrations for scout 1:', regs[0].cnt, '(should be 0 -- scout must register via UI)');

    console.log('\nDone! The scout can now register via the Activity Registration portal.');
    await conn.end();
    process.exit(0);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
