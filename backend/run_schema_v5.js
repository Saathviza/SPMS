const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function cleanAndMigrate() {
    let connection;
    try {
        const dbName = 'spms_db'; // USE A SHORT DIFFERENT NAME

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '2003'
        });

        console.log("✅ Connection established.");

        console.log(`🧹 Creating database: ${dbName}`);
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
        await connection.query(`CREATE DATABASE \`${dbName}\`;`);
        await connection.query(`USE \`${dbName}\`;`);

        const [dbResult] = await connection.query("SELECT DATABASE();");
        console.log("Current Database:", dbResult[0]['DATABASE()']);

        const sqlFilePath = path.join(__dirname, 'schema.sql');
        const fullSql = fs.readFileSync(sqlFilePath, 'utf8');

        const rawStatements = fullSql.split(';');
        const statements = [];

        for (let s of rawStatements) {
            s = s.trim();
            if (s.length === 0) continue;

            const upper = s.toUpperCase();
            if (upper.startsWith('DROP DATABASE ')) continue;
            if (upper.startsWith('CREATE DATABASE ')) continue;
            if (upper.startsWith('USE ')) continue;

            // Basic comment stripping
            const lines = s.split('\n');
            let cleanedS = "";
            for (let line of lines) {
                if (!line.trim().startsWith('--')) {
                    cleanedS += line + '\n';
                }
            }
            if (cleanedS.trim().length > 0) {
                statements.push(cleanedS.trim());
            }
        }

        console.log(`🚀 Executing ${statements.length} SQL statements...`);

        for (let i = 0; i < statements.length; i++) {
            try {
                await connection.query(statements[i]);
            } catch (err) {
                console.error(`❌ Statement ${i + 1} Error:`, err.message);
            }
        }

        console.log("✅ Done.");
        await connection.end();

        // UPDATE .env TO USE NEW DB NAME
        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/DB_NAME=.*/, `DB_NAME=${dbName}`);
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Updated .env with DB_NAME=${dbName}`);

    } catch (err) {
        console.error("❌ Fatal error:", err);
        if (connection) await connection.end();
    }
}

cleanAndMigrate();
