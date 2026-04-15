const pool = require('./src/config/db.config');
const fs = require('fs');

async function seed() {
    try {
        const scout_id = 1;

        // 1. Seed Activity Tracking (Realistic count: 18)
        const [activities] = await pool.query("SELECT id FROM activities LIMIT 18");
        for (const act of activities) {
            await pool.query(`
                INSERT INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes)
                VALUES (?, ?, 'Leader Kavindu Perera', 3, 'COMPLETED', 'VERIFIED', 'Active participation and successful completion.')
                ON DUPLICATE KEY UPDATE activity_status = 'COMPLETED', action_status = 'VERIFIED'
            `, [scout_id, act.id]);
        }

        // 2. Seed Service Logs (Realistic count: ~95 hours)
        const serviceEntries = [
            ['2025-10-05', 10, 'Beach Cleanup Drive at Galle'],
            ['2025-10-15', 12, 'Participated in Temple Restoration'],
            ['2025-11-02', 8, 'Community Kitchen Volunteer'],
            ['2025-11-20', 15, 'Tree Planting Campaign'],
            ['2025-12-05', 9, 'Elderly Care Visit'],
            ['2025-12-25', 11, 'Road Safety Awareness Program'],
            ['2026-01-10', 7, 'Digital Literacy Workshop for Kids'],
            ['2026-01-30', 13, 'Public Library Organizing'],
            ['2026-02-15', 10, 'Waste Management System Setup']
        ];

        // Clear existing to avoid doubling if someone runs it twice
        await pool.query("DELETE FROM service_logs WHERE scout_id = ?", [scout_id]);

        for (const [date, hrs, desc] of serviceEntries) {
            await pool.query(`
                INSERT INTO service_logs (scout_id, service_date, hours, description, status, approved_at)
                VALUES (?, ?, ?, ?, 'APPROVED', NOW())
            `, [scout_id, date, hrs, desc]);
        }

        console.log("✅ Realistic progress data seeded successfully for Scout 1");
    } catch (e) {
        console.error("❌ Seeding failed:", e.message);
    }
    process.exit();
}
seed();
