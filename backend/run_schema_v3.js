const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function cleanAndMigrate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '2003',
            multipleStatements: true
        });

        console.log("✅ Connected to MySQL.");

        // Wipe and recreate DB
        const dbName = process.env.DB_NAME || 'scout_performance_management_system';
        console.log(`🧹 Dropping and recreating database: ${dbName}`);
        await connection.query(`DROP DATABASE IF EXISTS ${dbName};`);
        await connection.query(`CREATE DATABASE ${dbName};`);
        await connection.query(`USE ${dbName};`);

        const sqlFilePath = path.join(__dirname, 'schema.sql');
        const fullSql = fs.readFileSync(sqlFilePath, 'utf8');

        // Statements to run
        const rawStatements = fullSql.split(';');
        const statements = [];

        for (let s of rawStatements) {
            s = s.trim();
            if (s.length === 0) continue;
            // Ignore the USE and CREATE DATABASE at top of file since we did it manually
            if (s.startsWith('USE ') || s.startsWith('CREATE DATABASE ') || s.startsWith('DROP DATABASE ')) continue;
            statements.push(s);
        }

        console.log(`🚀 Executing ${statements.length} SQL statements...`);

        for (let i = 0; i < statements.length; i++) {
            try {
                await connection.query(statements[i]);
            } catch (err) {
                console.error(`❌ Statement ${i + 1} Error:`, err.message);
                console.error(`SQL snippet: ${statements[i].substring(0, 100)}...`);
            }
        }

        console.log("✅ Database migration and seeding finished.");
        await connection.end();
    } catch (err) {
        console.error("❌ Fatal clean/migrate error:", err);
        if (connection) await connection.end();
    }
}

cleanAndMigrate();
