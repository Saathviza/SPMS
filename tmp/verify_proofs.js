const path = require('path');
const fs = require('fs');

// Absolute paths — never wrong regardless of cwd
const ROOT = 'C:\\Users\\Home\\OneDrive\\Desktop\\scout-pms';
const LOG  = path.join(ROOT, 'tmp', 'verify_result.log');

require('dotenv').config({ path: path.join(ROOT, 'backend', '.env') });
const mysql = require(path.join(ROOT, 'backend', 'node_modules', 'mysql2', 'promise'));

async function verify() {
    const lines = [];
    const log = (s) => { lines.push(s); };

    try {
        log('DB_NAME: ' + process.env.DB_NAME);
        log('DB_HOST: ' + process.env.DB_HOST);

        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT) || 3306
        });

        log('Connected OK');

        const [rows] = await conn.query(`
            SELECT 
                a.activity_name,
                sub.status,
                f.original_name AS file_name,
                ROUND(f.size_bytes / 1024, 0) AS size_kb
            FROM activity_submissions sub
            JOIN activity_registrations ar ON sub.registration_id = ar.id
            JOIN activities a ON ar.activity_id = a.id
            JOIN scouts s ON ar.scout_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN activity_submission_files asf ON asf.submission_id = sub.id
            LEFT JOIN files f ON f.id = asf.file_id
            WHERE u.email = 'sherasaathvizarajkumar@gmail.com'
            ORDER BY a.activity_name
        `);

        log('Rows found: ' + rows.length);

        for (const r of rows) {
            log([r.activity_name, r.status, r.file_name || 'NO-FILE', (r.size_kb || 0) + 'KB'].join(' | '));
        }

        await conn.end();
    } catch (err) {
        log('ERROR: ' + err.message);
    }

    fs.writeFileSync(LOG, lines.join('\n'), 'utf8');
}

verify().then(() => process.exit(0));
