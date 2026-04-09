const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applySql() {
    fs.writeFileSync('migration_progress.log', 'Started at ' + new Date().toISOString() + '\n');
    console.log('Applying SQL from ../localSPMS.session.sql...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        multipleStatements: true
    });

    try {
        fs.appendFileSync('migration_progress.log', 'Connected to DB. Reading SQL...\n');
        const sqlPath = path.join(__dirname, '..', 'localSPMS.session.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        fs.appendFileSync('migration_progress.log', 'Applying SQL (Size: ' + sql.length + ' bytes)...\n');
        await connection.query(sql);
        
        fs.appendFileSync('migration_progress.log', '✅ SUCCESS: SQL Applied!\n');
        console.log('✅ SQL Applied successfully! Your staggered counts are now active.');
        process.exit(0);
    } catch (err) {
        fs.appendFileSync('migration_progress.log', '❌ ERROR: ' + err.message + '\n');
        console.error('❌ Failed to apply SQL:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

applySql();
