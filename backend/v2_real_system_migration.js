const pool = require('./src/config/db.config');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'migration_v2.log');
const log = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    console.log(msg);
};

async function migrate() {
    try {
        log("🚀 Starting V2 Real-Scale System Migration...");
        
        // 1. Column for assigned leader
        const [cols] = await pool.query("SHOW COLUMNS FROM scouts LIKE 'assigned_leader_id'");
        if (cols.length === 0) {
            await pool.query("ALTER TABLE scouts ADD COLUMN assigned_leader_id INT NULL");
            log("Added assigned_leader_id to scouts.");
        }

        const salt = await bcrypt.genSalt(10);
        const passHash = await bcrypt.hash('scout123', salt);

        // 2. Get all groups
        const [groups] = await pool.query("SELECT id, group_name FROM scout_groups");
        log(`Found ${groups.length} groups to populate.`);

        for (let group of groups) {
            log(`--- Processing: ${group.group_name} ---`);
            
            // a. Ensure at least 3 unique Scout Leaders per group
            const [currentLeaders] = await pool.query("SELECT sl.id, sl.user_id FROM scout_leaders sl WHERE sl.scout_group_id = ?", [group.id]);
            const leadersNeeded = 3 - currentLeaders.length;
            const leaderIds = currentLeaders.map(l => l.id);

            if (leadersNeeded > 0) {
                log(`Adding ${leadersNeeded} new leaders to ${group.group_name}...`);
                for (let i = 1; i <= leadersNeeded; i++) {
                    const u_email = `leader_${group.id}_${Date.now()}_${i}@scout.lk`;
                    const u_name = `Master Leader ${i} - ${group.group_name}`;
                    const [ur] = await pool.query("INSERT INTO users (full_name, email, username, password_hash, role_id, status) VALUES (?, ?, ?, ?, 2, 'ACTIVE')", 
                        [u_name, u_email, `leader_${group.id}_${Date.now()}_${i}`, passHash]);
                    const [lr] = await pool.query("INSERT INTO scout_leaders (user_id, scout_group_id, contact_number) VALUES (?, ?, ?)", 
                        [ur.insertId, group.id, `077${Math.floor(Math.random() * 9000000) + 1000000}`]);
                    leaderIds.push(lr.insertId);
                }
            }

            // b. Scale to 300+ unique Scouts
            const [scoutCount] = await pool.query("SELECT COUNT(*) as total FROM scouts WHERE scout_group_id = ?", [group.id]);
            const scoutsToAdd = 300 - scoutCount[0].total;

            if (scoutsToAdd > 0) {
                log(`Scaling ${group.group_name} with ${scoutsToAdd} additional scouts (Total target: 300)...`);
                // Batch insert users first? No, simple loop for safety in this environment
                for (let i = 1; i <= scoutsToAdd; i++) {
                    if (i % 50 === 0) log(`Progress: ${i}/${scoutsToAdd} scouts added...`);
                    const s_email = `scout_${group.id}_${i}_${Date.now()}@scout.lk`;
                    const s_name = `Scout #${scoutCount[0].total + i} - ${group.group_name}`;
                    const assignedLeader = leaderIds[i % leaderIds.length];
                    
                    const [ur] = await pool.query("INSERT INTO users (full_name, email, username, password_hash, role_id, status) VALUES (?, ?, ?, ?, 1, 'ACTIVE')", 
                        [s_name, s_email, `scout_${group.id}_${i}_${Date.now()}`, passHash]);
                    
                    await pool.query("INSERT INTO scouts (user_id, scout_group_id, dob, assigned_leader_id) VALUES (?, ?, ?, ?)", 
                        [ur.insertId, group.id, '2012-01-01', assignedLeader]);
                    
                    // Minor performance optimization: stop at 100 per loop to avoid script timeout in some environments? 
                    // No, let's try to reach 300.
                }
            } else {
                log(`${group.group_name} already has ${scoutCount[0].total} scouts. Skipping scale.`);
            }
        }

        log("✅ Scale Migration Complete. System is now realistically populated.");
        process.exit(0);
    } catch (err) {
        log(`❌ FATAL ERROR DURING MIGRATION: ${err.message}`);
        log(err.stack);
        process.exit(1);
    }
}

migrate();
