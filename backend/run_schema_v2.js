require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '2003',
            multipleStatements: true
        });

        console.log("✅ Connected to MySQL.");

        const sqlFilePath = path.join(__dirname, 'schema.sql');
        const fullSql = fs.readFileSync(sqlFilePath, 'utf8');

        // Split by semicolon, but be careful with DELIMITER (which we removed)
        // Since we removed DELIMITER, a simple split should mostly work for schema.sql
        const statements = fullSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`🚀 Executing ${statements.length} SQL statements...`);

        for (let i = 0; i < statements.length; i++) {
            try {
                // console.log(`Executing statement ${i + 1}/${statements.length}...`);
                await connection.query(statements[i]);
            } catch (err) {
                console.error(`❌ Error in statement ${i + 1}:`, err.message);
                console.error(`Statement: ${statements[i].substring(0, 100)}...`);
                // Continue or abort? Usually better to continue if it's just a seed error, 
                // but let's see.
            }
        }

        console.log("✅ Schema migration/seed completed.");
        await connection.end();
    } catch (err) {
        console.error("❌ Fatal Error:", err);
        if (connection) await connection.end();
    }
}

runSchema();
