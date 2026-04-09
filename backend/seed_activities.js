/**
 * seed_activities.js
 * Seeds activities, activity_registrations, and activity_tracking for spms_db.
 * Run: node seed_activities.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '2003',
        database: process.env.DB_NAME || 'spms_db',
    });

    console.log('✅ Connected to spms_db\n');

    // ── 1. Fix activities table: add missing columns ──────────────────────────
    console.log('Checking activities table columns...');
    const [actCols] = await conn.query('DESCRIBE activities');
    const actColNames = actCols.map(c => c.Field);
    
    const missingActCols = [];
    if (!actColNames.includes('activity_code'))
        missingActCols.push("ADD COLUMN activity_code VARCHAR(30) NULL");
    if (!actColNames.includes('start_time'))
        missingActCols.push("ADD COLUMN start_time TIME NOT NULL DEFAULT '08:00:00'");
    if (!actColNames.includes('end_time'))
        missingActCols.push("ADD COLUMN end_time TIME NULL");
    if (!actColNames.includes('image_path'))
        missingActCols.push("ADD COLUMN image_path VARCHAR(255) NULL");
    if (!actColNames.includes('created_by_admin_user_id'))
        missingActCols.push("ADD COLUMN created_by_admin_user_id INT UNSIGNED NULL");
    // Fix status enum to match expected values
    if (actColNames.includes('status')) {
        try {
            await conn.query(`ALTER TABLE activities MODIFY COLUMN status ENUM('UPCOMING','IN_PROGRESS','COMPLETED','CANCELLED','ACTIVE') NOT NULL DEFAULT 'UPCOMING'`);
            console.log('✅ Fixed activities.status enum');
        } catch(e) { console.log('Status enum already correct or skipped:', e.message.substring(0,60)); }
    }
    
    if (missingActCols.length > 0) {
        await conn.query(`ALTER TABLE activities ${missingActCols.join(', ')}`);
        console.log(`✅ Added missing columns to activities: ${missingActCols.map(c => c.split(' ')[2]).join(', ')}`);
    } else {
        console.log('⏭️  activities columns OK');
    }

    // ── 2. Get admin user id ──────────────────────────────────────────────────
    const [adminRows] = await conn.query("SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE role_name = 'ADMIN') LIMIT 1");
    const adminId = adminRows[0]?.id || 1;

    // ── 3. Seed Activities ────────────────────────────────────────────────────
    const [existingActs] = await conn.query('SELECT COUNT(*) as cnt FROM activities');
    if (existingActs[0].cnt === 0) {
        const activities = [
            ['Wilderness Survival Camp', '2026-04-16', '08:00:00', '17:00:00', 'Sinharaja Forest Reserve', 'CAMPING', '/images/activities/camping.png', 'UPCOMING'],
            ['First Aid Workshop', '2026-04-20', '14:00:00', '16:00:00', 'Colombo Scout Hall', 'TRAINING', '/images/activities/training.png', 'UPCOMING'],
            ['Community Clean-Up Drive', '2026-04-25', '07:00:00', '10:00:00', 'Galle Beach', 'SERVICE', '/images/activities/service.png', 'UPCOMING'],
            ['Badge Preparation Class', '2026-05-02', '16:00:00', '18:00:00', 'Kandy Regional Office', 'TRAINING', '/images/activities/training.png', 'UPCOMING'],
            ['Mountain Hiking Expedition', '2026-05-07', '05:00:00', '13:00:00', 'Adams Peak', 'HIKING', '/images/activities/adventure.png', 'UPCOMING'],
            ['Environmental Awareness Program', '2026-05-11', '10:00:00', '12:00:00', 'Yala National Park', 'SERVICE', '/images/activities/environment.png', 'UPCOMING'],
            ['Navigation Skills Camp', '2026-05-14', '09:00:00', '13:00:00', 'Minneriya Grounds', 'CAMPING', '/images/activities/hiking.png', 'UPCOMING'],
            ['Tree Planting Campaign', '2026-01-14', '08:00:00', '11:00:00', 'Kelaniya Grounds', 'SERVICE', '/images/activities/environment.png', 'COMPLETED'],
            ['First Aid Training', '2026-02-12', '09:00:00', '12:00:00', 'Scout Medical Hall', 'TRAINING', '/images/activities/training.png', 'COMPLETED'],
            ['Community Service Day', '2026-03-07', '08:30:00', '11:30:00', 'Community Center', 'SERVICE', '/images/activities/service.png', 'IN_PROGRESS'],
            ['Camping Workshop', '2026-02-05', '10:00:00', '13:00:00', 'Camp Site A', 'CAMPING', '/images/activities/camping.png', 'COMPLETED'],
            ['Navigation Training', '2026-03-08', '07:30:00', '10:30:00', 'Scout Field Area', 'TRAINING', '/images/activities/hiking.png', 'IN_PROGRESS'],
        ];

        for (let i = 0; i < activities.length; i++) {
            const [name, date, start, end, loc, cat, img, status] = activities[i];
            const code = `ACT${String(i + 1).padStart(3, '0')}`;
            await conn.query(
                `INSERT INTO activities (activity_name, activity_date, start_time, end_time, location, category, image_path, created_by_admin_user_id, status, activity_code)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, date, start, end, loc, cat, img, adminId, status, code]
            );
        }
        console.log(`✅ Seeded ${activities.length} activities`);
    } else {
        console.log(`⏭️  Activities already seeded (${existingActs[0].cnt} rows)`);
    }

    // ── 4. Get scout_id=1 and activity IDs ───────────────────────────────────
    const [scoutRow] = await conn.query('SELECT id FROM scouts WHERE user_id = 1');
    const scout_id = scoutRow[0]?.id;
    if (!scout_id) { console.error('❌ No scout found for user_id=1'); await conn.end(); process.exit(1); }

    const [allActs] = await conn.query('SELECT id, activity_name, status FROM activities');
    const upcomingActs = allActs.filter(a => ['UPCOMING','IN_PROGRESS'].includes(a.status));
    const completedActs = allActs.filter(a => a.status === 'COMPLETED');
    
    console.log(`Found ${upcomingActs.length} upcoming, ${completedActs.length} completed activities`);

    // ── 5. Seed activity_registrations ───────────────────────────────────────
    const [existingRegs] = await conn.query('SELECT COUNT(*) as cnt FROM activity_registrations WHERE scout_id = ?', [scout_id]);
    if (existingRegs[0].cnt === 0) {
        // Register for all upcoming activities
        for (const act of upcomingActs) {
            await conn.query(
                `INSERT IGNORE INTO activity_registrations (scout_id, activity_id, registration_status, registered_at)
                 VALUES (?, ?, 'REGISTERED', NOW())`,
                [scout_id, act.id]
            ).catch(e => console.log(`Reg skip for activity ${act.id}: ${e.message.substring(0,50)}`));
        }
        // Mark completed ones as attended
        for (const act of completedActs) {
            await conn.query(
                `INSERT IGNORE INTO activity_registrations (scout_id, activity_id, registration_status, registered_at)
                 VALUES (?, ?, 'ATTENDED', NOW())`,
                [scout_id, act.id]
            ).catch(e => console.log(`Reg skip for activity ${act.id}: ${e.message.substring(0,50)}`));
        }
        console.log(`✅ Seeded registrations for scout_id=${scout_id}`);
    } else {
        console.log(`⏭️  Registrations already exist (${existingRegs[0].cnt} rows)`);
    }

    // ── 6. Sync activity_tracking with registrations ─────────────────────────
    const [existingTrack] = await conn.query('SELECT COUNT(*) as cnt FROM activity_tracking WHERE scout_id = ?', [scout_id]);
    if (existingTrack[0].cnt === 0) {
        for (const act of completedActs) {
            await conn.query(
                `INSERT IGNORE INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes)
                 VALUES (?, ?, 'Leader Kavindu Perera', 3, 'COMPLETED', 'VERIFIED', 'Completed successfully')`,
                [scout_id, act.id]
            ).catch(() => {});
        }
        for (const act of upcomingActs) {
            await conn.query(
                `INSERT IGNORE INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes)
                 VALUES (?, ?, 'Self', 0, 'PENDING', 'SUBMIT_PROOF', NULL)`,
                [scout_id, act.id]
            ).catch(() => {});
        }
        console.log(`✅ Seeded activity_tracking for scout_id=${scout_id}`);
    } else {
        console.log(`⏭️  activity_tracking already has ${existingTrack[0].cnt} rows`);
        // Update any rows that were seeded before activities existed (they'll have wrong activity_ids)
        // Re-sync it properly
        await conn.query('DELETE FROM activity_tracking WHERE scout_id = ?', [scout_id]);
        for (const act of completedActs) {
            await conn.query(
                `INSERT IGNORE INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes)
                 VALUES (?, ?, 'Leader Kavindu Perera', 3, 'COMPLETED', 'VERIFIED', 'Completed successfully')`,
                [scout_id, act.id]
            ).catch(() => {});
        }
        for (const act of upcomingActs) {
            await conn.query(
                `INSERT IGNORE INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes)
                 VALUES (?, ?, 'Self', 0, 'PENDING', 'SUBMIT_PROOF', NULL)`,
                [scout_id, act.id]
            ).catch(() => {});
        }
        console.log(`✅ Re-synced activity_tracking`);
    }

    // ── 7. Verify ─────────────────────────────────────────────────────────────
    const [verifyRegs] = await conn.query('SELECT COUNT(*) as cnt FROM activity_registrations WHERE scout_id = ?', [scout_id]);
    const [verifyTrack] = await conn.query('SELECT COUNT(*) as cnt FROM activity_tracking WHERE scout_id = ?', [scout_id]);
    const [verifyBadge] = await conn.query("SELECT COUNT(*) as cnt FROM scout_badge_progress WHERE scout_id = ? AND progress_type = 'COMPLETED'", [scout_id]);
    
    console.log(`\n📊 Final counts for scout_id=${scout_id}:`);
    console.log(`   Registrations: ${verifyRegs[0].cnt}`);
    console.log(`   Activity Tracking rows: ${verifyTrack[0].cnt}`);
    console.log(`   Completed Badges: ${verifyBadge[0].cnt}`);
    console.log('\n🎉 Done!');

    await conn.end();
    process.exit(0);
}

run().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
