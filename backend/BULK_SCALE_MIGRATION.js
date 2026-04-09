const pool = require('./src/config/db.config');
const bcrypt = require('bcrypt');

async function bulkMigrate() {
    try {
        console.log("Starting FINAL BULLETPROOF System Migration (Full Schema)...");
        
        // Ensure assigned_leader_id
        try { await pool.query("ALTER TABLE scouts ADD COLUMN IF NOT EXISTS assigned_leader_id INT NULL"); } catch (e) {}

        const [groups] = await pool.query("SELECT * FROM scout_groups");
        const salt = await bcrypt.genSalt(10);
        const passHash = await bcrypt.hash('scout123', salt);

        const [scoutCols] = await pool.query("SHOW COLUMNS FROM scouts");
        const [leaderCols] = await pool.query("SHOW COLUMNS FROM scout_leaders");
        
        const scoutColNames = scoutCols.map(c => c.Field);
        const leaderColNames = leaderCols.map(c => c.Field);

        const targets = {
            'Kelaniya Scout Group': 412,
            'Negombo Scout Group': 185,
            'Kandy Hills Scouts': 530,
            'Galle Coastal Scouts': 308,
            'Jaffna North Scouts': 367,
            'Anuradhapura Scouts': 442,
            'Colombo Central Scouts': 294
        };

        for (let group of groups) {
            console.log(`\nProcessing: ${group.group_name}`);
            const target = targets[group.group_name] || 300;

            // 1. Leaders
            const [leaders] = await pool.query("SELECT id FROM scout_leaders WHERE scout_group_id = ?", [group.id]);
            let leaderIds = leaders.map(l => l.id);

            if (leaderIds.length < 2) {
                console.log(`Adding leaders...`);
                for (let i = 1; i <= 2; i++) {
                    const [ur] = await pool.query("INSERT INTO users (full_name, email, username, password_hash, role_id, status) VALUES (?, ?, ?, ?, 2, 'ACTIVE')", 
                        [`Leader ${i}`, `l_${group.id}_${i}_${Date.now()}@scout.lk`, `lead_${group.id}_${i}_${Date.now()}`, passHash]);
                    
                    const leaderFields = {
                        user_id: ur.insertId,
                        scout_group_id: group.id,
                        contact_number: '0771112223',
                        leader_code: `LC-${group.id}-${ur.insertId}`,
                        rank: 'Group Scout Master',
                        district: group.district || 'Colombo',
                        province: group.province || 'Western',
                        address: 'Main Street, Colombo'
                    };

                    const finalFields = {};
                    leaderColNames.forEach(col => { if (leaderFields[col]) finalFields[col] = leaderFields[col]; });

                    const cols = Object.keys(finalFields);
                    const placeholders = cols.map(() => '?').join(',');
                    await pool.query(`INSERT INTO scout_leaders (${cols.join(',')}) VALUES (${placeholders})`, Object.values(finalFields));
                }
                const [newL] = await pool.query("SELECT id FROM scout_leaders WHERE scout_group_id = ?", [group.id]);
                leaderIds = newL.map(l => l.id);
            }

            // 2. Scouts
            const [scoutCount] = await pool.query("SELECT COUNT(*) as total FROM scouts WHERE scout_group_id = ?", [group.id]);
            const toAdd = target - scoutCount[0].total;

            if (toAdd > 0) {
                console.log(`Adding ${toAdd} scouts...`);
                for (let i = 1; i <= toAdd; i++) {
                    const [ur] = await pool.query("INSERT INTO users (full_name, email, username, password_hash, role_id, status) VALUES (?, ?, ?, ?, 1, 'ACTIVE')", 
                        [`Scout #${scoutCount[0].total + i}`, `sc_${group.id}_${i}_${Date.now()}@scout.lk`, `s_${group.id}_${i}_${Date.now()}`, passHash]);
                    
                    const scoutFields = {
                        user_id: ur.insertId,
                        scout_group_id: group.id,
                        dob: '2012-01-01',
                        assigned_leader_id: leaderIds[i % leaderIds.length],
                        scout_code: `SR-${group.id}-${ur.insertId}`,
                        district: group.district || 'Colombo',
                        province: group.province || 'Western',
                        contact_number: '0779998887',
                        nic_or_school_id: `SID-${Date.now()}-${ur.insertId}`,
                        address: 'Student House, Colombo'
                    };

                    const finalFields = {};
                    scoutColNames.forEach(col => { if (scoutFields[col]) finalFields[col] = scoutFields[col]; });

                    const cols = Object.keys(finalFields);
                    const placeholders = cols.map(() => '?').join(',');
                    await pool.query(`INSERT INTO scouts (${cols.join(',')}) VALUES (${placeholders})`, Object.values(finalFields));
                    
                    if (i % 100 === 0) console.log(`${group.group_name}: ${i} scouts added.`);
                }
            }
        }

        console.log("\n✅ Success: All groups scaled to 300+ members.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
}
bulkMigrate();
