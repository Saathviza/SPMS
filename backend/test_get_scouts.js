const pool = require('./src/config/db.config');

async function test() {
    try {
        const user_id = 2; // Kavindu
        const [leaderProfiles] = await pool.query(
            "SELECT scout_group_id FROM scout_leaders WHERE user_id = ?",
            [user_id]
        );
        console.log('Leader Profiles:', leaderProfiles);
        const groupIds = leaderProfiles.map(p => p.scout_group_id);

        const [scouts] = await pool.query(
            `SELECT DISTINCT s.id, u.full_name as name, u.email, TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) as age, sg.group_name,
            (SELECT COUNT(*) FROM scout_badge_progress WHERE scout_id = s.id AND progress_type = 'COMPLETED') as badges_earned,
            (SELECT COUNT(*) FROM activity_tracking WHERE scout_id = s.id AND activity_status = 'COMPLETED') as activities_completed
             FROM scouts s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN scout_groups sg ON s.scout_group_id = sg.id
             WHERE s.scout_group_id IN (?)
             ORDER BY sg.group_name, u.full_name`,
            [groupIds]
        );
        console.log('Scouts count:', scouts.length);
        console.log('Scouts:', scouts);

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

test();
