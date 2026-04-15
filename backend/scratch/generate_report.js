const pool = require('../src/config/db.config'); // Fix path
const fs = require('fs');
const path = require('path');

async function report() {
    const reportFile = path.resolve(__dirname, 'scout_stats_report.txt');
    try {
        const [scouts] = await pool.query(`
            SELECT s.id, s.user_id, u.full_name, u.email 
            FROM scouts s 
            JOIN users u ON s.user_id = u.id
        `);
        
        let reportText = "=== SCOUT STATS REPORT ===\n\n";
        
        for (const scout of scouts) {
            const [badges] = await pool.query("SELECT COUNT(*) as cnt FROM scout_badge_progress WHERE scout_id = ? AND progress_type = 'COMPLETED'", [scout.id]);
            const [activities] = await pool.query("SELECT COUNT(*) as cnt FROM activity_tracking WHERE scout_id = ? AND activity_status = 'COMPLETED'", [scout.id]);
            const [hours] = await pool.query("SELECT SUM(hours) as total FROM service_logs WHERE scout_id = ? AND status = 'APPROVED'", [scout.id]);
            
            reportText += `Scout ID: ${scout.id} (User ID: ${scout.user_id})\n`;
            reportText += `Name: ${scout.full_name} (${scout.email})\n`;
            reportText += `Badges: ${badges[0].cnt}\n`;
            reportText += `Activities: ${activities[0].cnt}\n`;
            reportText += `Service Hours: ${hours[0].total || 0}\n`;
            reportText += "---------------------------\n";
        }
        
        fs.writeFileSync(reportFile, reportText);
        console.log("Report written to:", reportFile);
    } catch (e) {
        fs.writeFileSync(path.resolve(__dirname, 'report_err.txt'), e.stack);
    }
    process.exit();
}
report();
