/**
 * fix_missing_tables.js
 * Adds missing tables + columns to spms_db so the backend APIs work correctly.
 * Run once: node fix_missing_tables.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '2003',
    database: process.env.DB_NAME || 'spms_db',
    multipleStatements: true
};

const migrations = [
    // ── activity_registrations: add missing registration_status column
    {
        name: "Add registration_status to activity_registrations",
        check: "SHOW COLUMNS FROM activity_registrations LIKE 'registration_status'",
        sql: `ALTER TABLE activity_registrations
              ADD COLUMN registration_status ENUM('REGISTERED','CANCELLED','ATTENDED') NOT NULL DEFAULT 'REGISTERED',
              ADD COLUMN registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`
    },

    // ── activity_submissions: add missing comment column
    {
        name: "Add comment + submitted_at to activity_submissions",
        check: "SHOW COLUMNS FROM activity_submissions LIKE 'comment'",
        sql: `ALTER TABLE activity_submissions
              ADD COLUMN comment TEXT NULL,
              ADD COLUMN submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`
    },

    // ── files table
    {
        name: "Create files table",
        check: "SHOW TABLES LIKE 'files'",
        sql: `CREATE TABLE IF NOT EXISTS files (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            owner_user_id INT UNSIGNED NOT NULL,
            file_type ENUM('PROFILE_PHOTO','ID_PROOF','ACTIVITY_PROOF','BADGE_EVIDENCE','REPORT','CERTIFICATE') NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            storage_key VARCHAR(500) NOT NULL,
            mime_type VARCHAR(120) NOT NULL,
            size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_files_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB`
    },

    // ── activity_tracking table
    {
        name: "Create activity_tracking table",
        check: "SHOW TABLES LIKE 'activity_tracking'",
        sql: `CREATE TABLE IF NOT EXISTS activity_tracking (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            scout_id INT UNSIGNED NOT NULL,
            activity_id INT UNSIGNED NOT NULL,
            observed_by_name VARCHAR(120) NOT NULL DEFAULT '',
            hours_spent DECIMAL(5,2) NOT NULL DEFAULT 0,
            activity_status ENUM('COMPLETED','PENDING') NOT NULL DEFAULT 'PENDING',
            action_status ENUM('VERIFIED','SUBMIT_PROOF') NOT NULL DEFAULT 'SUBMIT_PROOF',
            notes TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_tracking (scout_id, activity_id),
            CONSTRAINT fk_tracking_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_tracking_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB`
    },

    // ── activity_proof_submissions table
    {
        name: "Create activity_proof_submissions table",
        check: "SHOW TABLES LIKE 'activity_proof_submissions'",
        sql: `CREATE TABLE IF NOT EXISTS activity_proof_submissions (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            tracking_id INT UNSIGNED NOT NULL,
            file_id INT UNSIGNED NULL,
            additional_comments TEXT NULL,
            submission_status ENUM('SUBMITTED','APPROVED','REJECTED','PENDING_REVIEW') NOT NULL DEFAULT 'PENDING_REVIEW',
            reviewed_by_leader_user_id INT UNSIGNED NULL,
            reviewed_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_proof (tracking_id),
            CONSTRAINT fk_proof_tracking FOREIGN KEY (tracking_id) REFERENCES activity_tracking(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB`
    },

    // ── activity_submission_files table
    {
        name: "Create activity_submission_files table",
        check: "SHOW TABLES LIKE 'activity_submission_files'",
        sql: `CREATE TABLE IF NOT EXISTS activity_submission_files (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            submission_id INT UNSIGNED NOT NULL,
            file_id INT UNSIGNED NOT NULL,
            CONSTRAINT fk_asf_submission FOREIGN KEY (submission_id) REFERENCES activity_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB`
    },

    // ── leader_activity_approvals table
    {
        name: "Create leader_activity_approvals table",
        check: "SHOW TABLES LIKE 'leader_activity_approvals'",
        sql: `CREATE TABLE IF NOT EXISTS leader_activity_approvals (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            leader_user_id INT UNSIGNED NOT NULL,
            scout_id INT UNSIGNED NOT NULL,
            activity_id INT UNSIGNED NOT NULL,
            proof_submission_id INT UNSIGNED NULL,
            approval_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
            leader_comment TEXT NULL,
            decided_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_leader_approval (leader_user_id, scout_id, activity_id),
            CONSTRAINT fk_la_leader FOREIGN KEY (leader_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_la_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_la_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB`
    },

    // ── badges table
    {
        name: "Create badges table",
        check: "SHOW TABLES LIKE 'badges'",
        sql: `CREATE TABLE IF NOT EXISTS badges (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            badge_code VARCHAR(40) NOT NULL UNIQUE,
            badge_name VARCHAR(150) NOT NULL,
            level_name VARCHAR(100) NOT NULL,
            description TEXT NULL,
            icon_name VARCHAR(100) NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`
    },

    // ── scout_badge_progress table
    {
        name: "Create scout_badge_progress table",
        check: "SHOW TABLES LIKE 'scout_badge_progress'",
        sql: `CREATE TABLE IF NOT EXISTS scout_badge_progress (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            scout_id INT UNSIGNED NOT NULL,
            badge_id INT UNSIGNED NOT NULL,
            progress_type ENUM('COMPLETED','PENDING','ELIGIBLE') NOT NULL,
            completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
            requirements_met INT NOT NULL DEFAULT 0,
            total_requirements INT NOT NULL DEFAULT 0,
            achieved_date DATE NULL,
            remarks VARCHAR(255) NULL,
            UNIQUE KEY uq_scout_badge (scout_id, badge_id, progress_type),
            CONSTRAINT fk_sbp_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_sbp_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB`
    },

    // ── badge_submissions table
    {
        name: "Create badge_submissions table",
        check: "SHOW TABLES LIKE 'badge_submissions'",
        sql: `CREATE TABLE IF NOT EXISTS badge_submissions (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            scout_id INT UNSIGNED NOT NULL,
            badge_id INT UNSIGNED NOT NULL,
            completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
            evidence_summary VARCHAR(255) NULL,
            status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
            reviewed_by_examiner_user_id INT UNSIGNED NULL,
            reviewed_at TIMESTAMP NULL,
            examiner_comment TEXT NULL,
            submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_bs_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_bs_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB`
    },

    // ── awards table
    {
        name: "Create awards table",
        check: "SHOW TABLES LIKE 'awards'",
        sql: `CREATE TABLE IF NOT EXISTS awards (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            award_code VARCHAR(50) NOT NULL UNIQUE,
            award_name VARCHAR(150) NOT NULL,
            description TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`
    },

    // ── scout_award_progress table
    {
        name: "Create scout_award_progress table",
        check: "SHOW TABLES LIKE 'scout_award_progress'",
        sql: `CREATE TABLE IF NOT EXISTS scout_award_progress (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            scout_id INT UNSIGNED NOT NULL,
            award_id INT UNSIGNED NOT NULL,
            overall_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
            status ENUM('IN_PROGRESS','UNDER_REVIEW','ELIGIBLE','ACHIEVED') NOT NULL DEFAULT 'IN_PROGRESS',
            quote_text VARCHAR(255) NULL,
            final_review_status ENUM('PENDING','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'PENDING',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_sap_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_sap_award FOREIGN KEY (award_id) REFERENCES awards(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB`
    },
    
    // ── service_logs table
    {
        name: "Create service_logs table",
        check: "SHOW TABLES LIKE 'service_logs'",
        sql: `CREATE TABLE IF NOT EXISTS service_logs (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            scout_id INT UNSIGNED NOT NULL,
            service_date DATE NOT NULL,
            hours DECIMAL(5,2) NOT NULL,
            description VARCHAR(255) NOT NULL,
            status ENUM('SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
            approved_by_leader_user_id INT UNSIGNED NULL,
            approved_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_service_log_scout FOREIGN KEY (scout_id) REFERENCES scouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_service_log_leader FOREIGN KEY (approved_by_leader_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
        ) ENGINE=InnoDB`
    }
];

async function runMigrations() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to spms_db\n');

        for (const migration of migrations) {
            try {
                const [rows] = await conn.query(migration.check);
                if (rows.length > 0) {
                    console.log(`⏭️  SKIP: ${migration.name} (already exists)`);
                    continue;
                }
                await conn.query(migration.sql);
                console.log(`✅ DONE: ${migration.name}`);
            } catch (err) {
                console.error(`❌ FAILED: ${migration.name}\n   ${err.message}`);
            }
        }

        // ── Seed data ──────────────────────────────────────────────────────────
        console.log('\n--- Seeding data ---');

        // Fix registration_status for existing rows if the column was just added
        await conn.query(`
            UPDATE activity_registrations SET registration_status = 'REGISTERED'
            WHERE registration_status IS NULL OR registration_status = ''
        `).catch(() => {});

        // Seed badges
        const badgeSeeds = [
            ['FIRST_AID','First Aid','Advanced','First aid competency badge','first-aid'],
            ['CAMPING','Camping','Expert','Camping expert badge','camping'],
            ['NAVIGATION','Navigation','Intermediate','Navigation skills badge','navigation'],
            ['ENV_CONSERVATION','Environmental Conservation','Advanced','Environmental conservation badge','environment'],
            ['LEADERSHIP','Leadership','Advanced','Leadership development badge','leadership'],
            ['COMMUNITY_SERVICE','Community Service','Intermediate','Service participation badge','service'],
            ['HIKING','Hiking','Intermediate','Hiking participation badge','hiking'],
            ['CITIZENSHIP','Citizenship','Intermediate','Citizenship awareness badge','citizenship'],
            ['CAMP_CRAFT','Camp Craft','Advanced','Camp craft badge','camp-craft'],
            ['PIONEERING','Pioneering','Intermediate','Pioneering skills badge','pioneering'],
            ['COMMUNICATION','Communication','Intermediate','Communication badge','communication'],
            ['TEAMWORK','Teamwork','Intermediate','Teamwork badge','teamwork'],
            ['SCOUT_SPIRIT','Scout Spirit','Advanced','Scout spirit badge','spirit'],
            ['SERVICE_EXCELLENCE','Service Excellence','Advanced','Service excellence badge','service-excellence'],
            ['CHIEF_CC',"Chief Commissioner's Award",'Award','Chief Commissioner award track','chief-commissioner'],
            ['PRESIDENT_SCOUT',"President's Scout Award",'Award','President award track','president']
        ];
        for (const b of badgeSeeds) {
            await conn.query(
                `INSERT IGNORE INTO badges (badge_code, badge_name, level_name, description, icon_name) VALUES (?,?,?,?,?)`, b
            );
        }
        console.log('✅ Badges seeded');

        // Seed awards
        await conn.query(`INSERT IGNORE INTO awards (award_code, award_name, description) VALUES ('PRESIDENT_AWARD', "President's Scout Award", 'Highest national scout award')`);
        console.log('✅ Awards seeded');

        // Seed registration_status for scout_id=1 (Shera)
        await conn.query(`
            UPDATE activity_registrations SET registration_status = 'REGISTERED'
            WHERE scout_id = 1
        `).catch(() => {});

        // Seed scout_badge_progress for scout_id=1
        const [existingBadgeProgress] = await conn.query('SELECT COUNT(*) as cnt FROM scout_badge_progress WHERE scout_id = 1');
        if (existingBadgeProgress[0].cnt === 0) {
            const completedCodes = ['FIRST_AID','CAMPING','NAVIGATION','ENV_CONSERVATION','LEADERSHIP','COMMUNITY_SERVICE','HIKING','CITIZENSHIP','CAMP_CRAFT','PIONEERING','COMMUNICATION','TEAMWORK','SCOUT_SPIRIT','SERVICE_EXCELLENCE'];
            for (const code of completedCodes) {
                await conn.query(`
                    INSERT IGNORE INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, achieved_date, remarks)
                    SELECT 1, id, 'COMPLETED', 100, 7, 7, '2025-09-15', 'Completed successfully'
                    FROM badges WHERE badge_code = ?
                `, [code]);
            }
            await conn.query(`
                INSERT IGNORE INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, remarks)
                SELECT 1, id, 'ELIGIBLE', 90, 9, 10, 'Almost there!'
                FROM badges WHERE badge_code = 'CHIEF_CC'
            `);
            await conn.query(`
                INSERT IGNORE INTO scout_badge_progress (scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, remarks)
                SELECT 1, id, 'ELIGIBLE', 85, 17, 20, 'Almost there!'
                FROM badges WHERE badge_code = 'PRESIDENT_SCOUT'
            `);
            console.log('✅ Scout badge progress seeded for scout_id=1');
        } else {
            console.log('⏭️  Scout badge progress already exists');
        }

        // Seed activity_tracking for scout_id=1
        const [existingTracking] = await conn.query('SELECT COUNT(*) as cnt FROM activity_tracking WHERE scout_id = 1');
        if (existingTracking[0].cnt === 0) {
            const [actRows] = await conn.query('SELECT id FROM activities LIMIT 12');
            for (const act of actRows) {
                await conn.query(`
                    INSERT IGNORE INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes)
                    VALUES (1, ?, 'Leader Kavindu Perera', 3, 'COMPLETED', 'VERIFIED', 'Completed successfully')
                `, [act.id]);
            }
            console.log('✅ Activity tracking seeded for scout_id=1');
        } else {
            console.log('⏭️  Activity tracking already exists');
        }

        console.log('\n🎉 Migration complete!');
    } catch (err) {
        console.error('❌ Fatal error:', err.message);
    } finally {
        if (conn) await conn.end();
        process.exit(0);
    }
}

runMigrations();
