const pool = require('./src/config/db.config');
const bcrypt = require('bcrypt');

async function updateSystem() {
    try {
        console.log("System update starting...");
        
        // 1. Column for assigned leader
        const [cols] = await pool.query("SHOW COLUMNS FROM scouts LIKE 'assigned_leader_id'");
        if (cols.length === 0) {
            await pool.query("ALTER TABLE scouts ADD COLUMN assigned_leader_id INT NULL");
            console.log("Added assigned_leader_id to scouts.");
        }

        // 2. Ensure role IDs (Assume 1=Scout, 2=Leader, 3=Examiner, 4=Admin)
        // Let's create some real scale data for Anuradhapura Scouts
        const [groups] = await pool.query("SELECT id FROM scout_groups WHERE group_name LIKE '%Anuradhapura%'");
        if (groups.length > 0) {
            const groupId = groups[0].id;
            const salt = await bcrypt.genSalt(10);
            const passHash = await bcrypt.hash('scout123', salt);

            // Add 5 Leaders
            console.log("Adding Leaders...");
            const leaders = [];
            for (let i = 1; i <= 5; i++) {
                const email = `an_leader${i}@scout.lk`;
                const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
                let userId;
                if (existing.length === 0) {
                    const [ur] = await pool.query("INSERT INTO users (full_name, email, username, password_hash, role_id, status) VALUES (?, ?, ?, ?, 2, 'ACTIVE')",
                        [`SL. K. Perera (${i})`, email, `an_leader${i}`, passHash]);
                    userId = ur.insertId;
                    const [lr] = await pool.query("INSERT INTO scout_leaders (user_id, scout_group_id, contact_number) VALUES (?, ?, ?)",
                        [userId, groupId, `071123456${i}`]);
                    leaders.push(lr.insertId);
                } else {
                    const [lr] = await pool.query("SELECT id FROM scout_leaders WHERE user_id = ?", [existing[0].id]);
                    if (lr.length > 0) leaders.push(lr[0].id);
                }
            }

            // Add 100 Scouts (Simulation for 'Real System' feeling)
            console.log("Adding Scouts...");
            const [currentScoutCount] = await pool.query("SELECT COUNT(*) as count FROM scouts WHERE scout_group_id = ?", [groupId]);
            if (currentScoutCount[0].count < 50) {
                for (let i = 1; i <= 50; i++) {
                    const email = `an_scout${i}@scout.lk`;
                    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
                    if (existing.length === 0) {
                        const leaderId = leaders[i % leaders.length];
                        const [ur] = await pool.query("INSERT INTO users (full_name, email, username, password_hash, role_id, status) VALUES (?, ?, ?, ?, 1, 'ACTIVE')",
                            [`Scout ${i} - Anuradhapura`, email, `an_scout${i}`, passHash]);
                        await pool.query("INSERT INTO scouts (user_id, scout_group_id, dob, assigned_leader_id) VALUES (?, ?, ?, ?)",
                            [ur.insertId, groupId, '2012-05-10', leaderId]);
                    }
                }
            }
        }

        console.log("System update complete.");
        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR:", err);
        process.exit(1);
    }
}

updateSystem();
