const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

// Actual file sizes from disk
const UPLOADS_DIR = path.resolve(__dirname, '../backend/uploads/activity-proofs');

function getFileSizeBytes(activityName) {
    const fname = activityName.replace(/ /g, '_') + '_proof.jpg';
    const fpath = path.join(UPLOADS_DIR, fname);
    try {
        return fs.statSync(fpath).size;
    } catch {
        return 102400; // fallback 100KB
    }
}

const ACTIVITIES = [
    { name: 'Navigation Skills Camp',         comment: 'I learned how to use directional signs, compass guidance, and teamwork during route-based outdoor tasks. Evidence includes participation photos and checkpoint notes.' },
    { name: 'Environmental Awareness Program', comment: 'I learned about environmental conservation, wildlife protection, and proper waste management. Evidence includes activity photos and participation records.' },
    { name: 'Mountain Hiking Expedition',      comment: 'I learned endurance, teamwork, and hiking discipline during the expedition. Evidence includes hiking photos and route notes.' },
    { name: 'Badge Preparation Class',        comment: 'I learned how to organize badge requirements and prepare proper evidence for evaluation. Evidence includes notes and training participation.' },
    { name: 'Community Clean-Up Drive',       comment: 'I learned teamwork and environmental responsibility through public cleanup work. Evidence includes before and after photos of the cleanup.' },
    { name: 'First Aid Workshop',             comment: 'I learned the basics of first aid, including wound care, bandaging, and emergency response procedures. Evidence includes workshop photos and practice notes.' },
    { name: 'Wilderness Survival Camp',       comment: 'I learned camping discipline, shelter preparation, teamwork, and basic survival awareness in outdoor conditions. Evidence includes camp activity photos and participation notes.' },
    { name: 'Navigation Training',            comment: 'I practiced map reading and compass navigation skills during the training. Evidence includes worksheets and field training photos.' },
    { name: 'Community Service',              comment: 'I participated in community support activities and learned the value of teamwork and helping others. Evidence includes service activity photos.' },
];

async function seed() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            multipleStatements: false
        });

        console.log('✅ Connected to DB:', process.env.DB_NAME);

        // --- Step 0: Resolve Scout's user_id and scout_id ---
        const [[userRow]] = await conn.query(
            "SELECT id FROM users WHERE email = 'sherasaathvizarajkumar@gmail.com'"
        );
        if (!userRow) throw new Error('Scout user not found!');
        const shera_user_id = userRow.id;

        const [[scoutRow]] = await conn.query(
            "SELECT id FROM scouts WHERE user_id = ?", [shera_user_id]
        );
        if (!scoutRow) throw new Error('Scout profile not found!');
        const shera_scout_id = scoutRow.id;

        console.log(`👤 Scout user_id=${shera_user_id}, scout_id=${shera_scout_id}`);

        for (const act of ACTIVITIES) {
            console.log(`\n🎯 Processing: ${act.name}`);

            // --- Step 1: Get the activity id ---
            const [[actRow]] = await conn.query(
                "SELECT id FROM activities WHERE activity_name = ?", [act.name]
            );
            if (!actRow) {
                console.warn(`  ⚠️  Activity not found in DB, skipping: ${act.name}`);
                continue;
            }
            const activity_id = actRow.id;

            // --- Step 2: Ensure Scout is registered ---
            const [[regRow]] = await conn.query(
                "SELECT id FROM activity_registrations WHERE scout_id = ? AND activity_id = ?",
                [shera_scout_id, activity_id]
            );

            let registration_id;
            if (regRow) {
                registration_id = regRow.id;
                console.log(`  ✅ Already registered (reg_id=${registration_id})`);
            } else {
                const [ins] = await conn.query(
                    "INSERT INTO activity_registrations (scout_id, activity_id) VALUES (?, ?)",
                    [shera_scout_id, activity_id]
                );
                registration_id = ins.insertId;
                console.log(`  🆕 Registered (reg_id=${registration_id})`);
            }

            // --- Step 3: Upsert activity_submission ---
            const [[existingSubmission]] = await conn.query(
                "SELECT id FROM activity_submissions WHERE registration_id = ?", [registration_id]
            );

            let submission_id;
            if (existingSubmission) {
                submission_id = existingSubmission.id;
                await conn.query(
                    "UPDATE activity_submissions SET comment = ?, status = 'SUBMITTED' WHERE id = ?",
                    [act.comment, submission_id]
                );
                console.log(`  ✅ Updated submission (sub_id=${submission_id})`);
            } else {
                const [ins] = await conn.query(
                    "INSERT INTO activity_submissions (registration_id, comment, status) VALUES (?, ?, 'SUBMITTED')",
                    [registration_id, act.comment]
                );
                submission_id = ins.insertId;
                console.log(`  🆕 Created submission (sub_id=${submission_id})`);
            }

            // --- Step 4: Insert file record ---
            const fileName = `${act.name.replace(/ /g, '_')}_proof.jpg`;
            const storagePath = `uploads/activity-proofs/${fileName}`;
            const sizeBytes = getFileSizeBytes(act.name);

            const [fileIns] = await conn.query(
                `INSERT INTO files (owner_user_id, file_type, original_name, storage_key, mime_type, size_bytes)
                 VALUES (?, 'ACTIVITY_PROOF', ?, ?, 'image/jpeg', ?)`,
                [shera_user_id, `${act.name}_proof.jpg`, storagePath, sizeBytes]
            );
            const file_id = fileIns.insertId;
            console.log(`  📁 Inserted file record (file_id=${file_id}, size=${sizeBytes} bytes)`);

            // --- Step 5: Link file to submission ---
            await conn.query(
                "INSERT IGNORE INTO activity_submission_files (submission_id, file_id) VALUES (?, ?)",
                [submission_id, file_id]
            );
            console.log(`  🔗 Linked file → submission`);
        }

        console.log('\n\n🎉 All proof submissions seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seed();
