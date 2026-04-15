const mysql = require('mysql2/promise');

async function sync() {
    console.log("🚀 STARTING GLOBAL PROGRESS SYNC");
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '2003',
        database: 'spms_db'
    });

    // 1. Get all scouts
    const [scouts] = await connection.query("SELECT id FROM scouts");
    const [acts] = await connection.query("SELECT id FROM activities LIMIT 20");
    const [badges] = await connection.query("SELECT id FROM badges LIMIT 14");

    for (const scout of scouts) {
        console.log(`Processing Scout ${scout.id}...`);

        // Force complete ALL activities
        for (const act of acts) {
            await connection.query(`
                INSERT INTO activity_tracking (scout_id, activity_id, activity_status, action_status, observed_by_name)
                VALUES (?, ?, 'COMPLETED', 'VERIFIED', 'Automation')
                ON DUPLICATE KEY UPDATE activity_status = 'COMPLETED', action_status = 'VERIFIED'
            `, [scout.id, act.id]);
        }

        // Force complete 14 badges
        for (const badge of badges) {
            await connection.query(`
                INSERT INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, achieved_date)
                VALUES (?, ?, 'COMPLETED', 100.00, 5, 5, NOW())
                ON DUPLICATE KEY UPDATE progress_type = 'COMPLETED', completion_percentage = 100.00
            `, [scout.id, badge.id]);
        }

        // Force service hours (95)
        await connection.query("DELETE FROM service_logs WHERE scout_id = ?", [scout.id]);
        await connection.query("INSERT INTO service_logs (scout_id, service_date, hours, description, status) VALUES (?, NOW(), 95, 'Global sync', 'APPROVED')", [scout.id]);
    }

    console.log("✅ SYNC SUCCESSFUL");
    await connection.end();
}

sync().catch(err => {
    console.error("❌ SYNC FAILED:", err);
});
