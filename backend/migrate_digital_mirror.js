const pool = require('./src/config/db.config');

async function updateSchema() {
    try {
        console.log("Adding Digital Mirror tables...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scout_badge_requirement_progress (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                scout_id INT UNSIGNED NOT NULL,
                requirement_id INT UNSIGNED NOT NULL,
                status ENUM('COMPLETED', 'PENDING', 'IN_PROGRESS') NOT NULL DEFAULT 'PENDING',
                passed_at DATETIME NULL,
                remarks TEXT NULL,
                UNIQUE KEY uq_scout_req (scout_id, requirement_id),
                CONSTRAINT fk_sbrp_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
                CONSTRAINT fk_sbrp_req FOREIGN KEY (requirement_id) REFERENCES badge_requirements(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        console.log("Seeding Badge Syllabus for First Aid and Leadership...");
        
        // Clear old requirements for these 2 badges to prevent duplicates in seed
        await pool.query(`DELETE FROM badge_requirements WHERE badge_id IN (SELECT id FROM badges WHERE badge_code IN ('FIRST_AID', 'LEADERSHIP'))`);

        // First Aid Requirements
        const [faBadge] = await pool.query("SELECT id FROM badges WHERE badge_code = 'FIRST_AID'");
        if (faBadge.length > 0) {
            const bId = faBadge[0].id;
            const faReqs = [
                ['Basic Theory', 'Demonstrate knowledge of the principles of First Aid.'],
                ['Knot Tying for Bandages', 'Skillfully tie Reef and Clove Hitch for first aid use.'],
                ['Wound Dressing', 'Properly clean and dress a simple wound.'],
                ['CPR Technique', 'Demonstrate CPR on a mannequin correctly.'],
                ['Emergency Contacts', 'List all local emergency numbers and procedures.']
            ];
            for (const [title, desc] of faReqs) {
                await pool.query("INSERT INTO badge_requirements (badge_id, requirement_title, requirement_description) VALUES (?, ?, ?)", [bId, title, desc]);
            }
        }

        // Leadership Requirements
        const [leadBadge] = await pool.query("SELECT id FROM badges WHERE badge_code = 'LEADERSHIP'");
        if (leadBadge.length > 0) {
            const bId = leadBadge[0].id;
            const leadReqs = [
                ['Patrol Leadership', 'Lead a patrol of 6 scouts for at least 3 months.'],
                ['Meeting Planning', 'Plan and execute a weekly scout meeting agenda.'],
                ['Conflict Resolution', 'Demonstrate a calm approach to solving a dispute between peers.'],
                ['History of Scouting', 'Explain the significance of Lord Baden Powell to the troop.']
            ];
            for (const [title, desc] of leadReqs) {
                await pool.query("INSERT INTO badge_requirements (badge_id, requirement_title, requirement_description) VALUES (?, ?, ?)", [bId, title, desc]);
            }
        }

        // Auto-complete some for Shera (SL2024001) to show "In Progress"
        const [scout] = await pool.query("SELECT id FROM scouts WHERE scout_code = 'SL2024001'");
        if (scout.length > 0) {
            const sId = scout[0].id;
            const [allReqs] = await pool.query("SELECT id FROM badge_requirements");
            // Pass first 2 for each
            for (let i = 0; i < allReqs.length; i += 5) {
               if (allReqs[i]) await pool.query("INSERT IGNORE INTO scout_badge_requirement_progress (scout_id, requirement_id, status, passed_at) VALUES (?, ?, 'COMPLETED', NOW())", [sId, allReqs[i].id]);
               if (allReqs[i+1]) await pool.query("INSERT IGNORE INTO scout_badge_requirement_progress (scout_id, requirement_id, status, passed_at) VALUES (?, ?, 'COMPLETED', NOW())", [sId, allReqs[i+1].id]);
               if (allReqs[i+2]) await pool.query("INSERT IGNORE INTO scout_badge_requirement_progress (scout_id, requirement_id, status, passed_at) VALUES (?, ?, 'IN_PROGRESS', NULL)", [sId, allReqs[i+2].id]);
            }
        }

        console.log("Database successfully Mirror-Synchronized!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

updateSchema();
