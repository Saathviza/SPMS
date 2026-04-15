const pool = require('./src/config/db.config');

async function populateData() {
    try {
        console.log("Fixing dummy data...");
        // 1. Ensure all scouts are in Colombo to match the Examiner
        await pool.query("UPDATE scouts SET district = 'Colombo'");
        console.log("Updated scouts to Colombo");
        
        // 2. Add some dummy pending badges if none exist to make it realistic
        const [scouts] = await pool.query("SELECT id FROM scouts LIMIT 1");
        const [badges] = await pool.query("SELECT id FROM badges LIMIT 1");
        
        if (scouts.length > 0 && badges.length > 0) {
            const scoutId = scouts[0].id;
            const badgeId = badges[0].id;
            
            // Check if there are any pending badges
            const [pending] = await pool.query("SELECT id FROM badge_submissions WHERE status = 'PENDING'");
            if (pending.length === 0) {
                await pool.query(\`
                    INSERT INTO badge_submissions (scout_id, badge_id, status, evidence_summary, submitted_at)
                    VALUES (?, ?, 'PENDING', 'I completed all the requirements for this badge during the weekend camp.', NOW())
                \`, [scoutId, badgeId]);
                console.log("Inserted realistic dummy badge submission");
            }
        }
    } catch(err) {
        console.error("Error:", err);
    }
    process.exit();
}
populateData();
