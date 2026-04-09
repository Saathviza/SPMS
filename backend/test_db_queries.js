const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/config/db.config');

async function testQueries() {
    console.log("Starting test script...");
    try {
        console.log("Checking pool connection...");
        const conn = await pool.getConnection();
        console.log("Got connection successfully!");
        conn.release();

        console.log("Testing dashboard queries...");
        const userId = 1;

        const [scoutRows] = await pool.query(
            "SELECT id FROM scouts WHERE user_id = ?",
            [userId]
        );
        console.log("ScoutRows count:", scoutRows.length);

        if (scoutRows.length > 0) {
            const scout_id = scoutRows[0].id;
            console.log("Found Scout ID:", scout_id);
            
            const queries = [
                { name: "badgeCount", sql: "SELECT COUNT(*) as total FROM scout_badge_progress WHERE scout_id = ? AND progress_type = 'COMPLETED'" },
                { name: "todayCount", sql: `SELECT COUNT(*) as total FROM activity_registrations ar JOIN activities a ON ar.activity_id = a.id WHERE ar.scout_id = ? AND a.activity_date = CURRENT_DATE AND ar.registration_status = 'REGISTERED'` },
                { name: "pendingCount", sql: `SELECT COUNT(*) as total FROM activity_proof_submissions ps JOIN activity_tracking t ON ps.tracking_id = t.id WHERE t.scout_id = ? AND ps.submission_status = 'PENDING_REVIEW'` },
                { name: "upcomingCount", sql: `SELECT COUNT(*) as total FROM activity_registrations ar JOIN activities a ON ar.activity_id = a.id WHERE ar.scout_id = ? AND a.activity_date > CURRENT_DATE AND ar.registration_status = 'REGISTERED'` },
                { name: "eligibleAwards", sql: "SELECT COUNT(*) as total FROM scout_badge_progress WHERE scout_id = ? AND progress_type = 'ELIGIBLE'" }
            ];

            for (const q of queries) {
                try {
                    console.log(`Running query: ${q.name}`);
                    const [res] = await pool.query(q.sql, [scout_id]);
                    console.log(`✅ ${q.name}:`, res[0].total);
                } catch (e) {
                    console.error(`❌ ${q.name} FAILED:`, e.message);
                }
            }
        } else {
            console.log("No scout found for userId 1");
        }

        console.log("\nTesting my-activities query...");
        if (scoutRows.length > 0) {
            const scout_id = scoutRows[0].id;
            const myActivitiesSql = `
                SELECT a.id as id, ar.id as registration_id, a.activity_name as activity_name, a.activity_name as name, 
                        a.activity_date as session_date, a.location, a.category as activity_type, 
                        ar.registration_status as status, t.notes as comment, t.activity_status as tracking_status,
                        s.status as submission_status
                 FROM activity_registrations ar
                 JOIN activities a ON ar.activity_id = a.id
                 LEFT JOIN activity_tracking t ON (ar.scout_id = t.scout_id AND ar.activity_id = t.activity_id)
                 LEFT JOIN activity_submissions s ON ar.id = s.registration_id
                 WHERE ar.scout_id = ?
                 ORDER BY a.activity_date DESC
            `;
            try {
                console.log("Running myActivities query...");
                const [activities] = await pool.query(myActivitiesSql, [scout_id]);
                console.log(`✅ myActivities: found ${activities.length} rows`);
            } catch (e) {
                console.error(`❌ myActivities FAILED:`, e.message);
            }
        }
    } catch (err) {
        console.error("❌ OVERALL TEST FAILED:", err);
    } finally {
        console.log("Test finished.");
        process.exit(0);
    }
}

testQueries();
