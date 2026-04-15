const pool = require('./src/config/db.config');

async function fixDates() {
    try {
        // Find Shera's scout ID
        const [scoutRows] = await pool.query(
            "SELECT id FROM scouts WHERE user_id = (SELECT id FROM users WHERE email='sherasaathvizarajkumar@gmail.com')"
        );
        
        if (scoutRows.length === 0) {
            console.log("Shera not found.");
            process.exit();
        }
        
        const scoutId = scoutRows[0].id;
        
        // Get all completed badges for Shera
        const [badges] = await pool.query(
            "SELECT id FROM scout_badge_progress WHERE scout_id = ? AND progress_type = 'COMPLETED' ORDER BY id ASC",
            [scoutId]
        );
        
        console.log(`Found ${badges.length} completed badges for Shera.`);
        
        // Realistic dates between 2025-09-15 and 2026-03-31
        const generateDates = (count) => {
            const start = new Date('2025-09-15');
            const end = new Date('2026-03-31');
            const diff = end.getTime() - start.getTime();
            const dates = [];
            for (let i = 0; i < count; i++) {
                // Spacing them out somewhat evenly but with slight randomness
                const offset = (diff / count) * i + (Math.random() * (diff / count) * 0.5);
                const d = new Date(start.getTime() + offset);
                dates.push(d.toISOString().split('T')[0]);
            }
            return dates.sort(); // Chronological order
        };
        
        const historicalDates = generateDates(badges.length);
        
        for (let i = 0; i < badges.length; i++) {
            const date = historicalDates[i];
            await pool.query(
                "UPDATE scout_badge_progress SET achieved_date = ? WHERE id = ?",
                [date, badges[i].id]
            );
            console.log(`Updated badge ${badges[i].id} to ${date}`);
        }
        
        console.log("Successfully randomized achievement dates!");
        
    } catch (e) {
        console.error(e);
    }
    process.exit();
}

fixDates();
