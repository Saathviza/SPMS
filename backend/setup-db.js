const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : "viza2003",
    port: process.env.DB_PORT || 3307,
    multipleStatements: true
};

async function setupDatabase() {
    let connection;
    try {
        console.log(`🔌 Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}...`);

        connection = await mysql.createConnection(dbConfig);

        console.log("✨ Resetting database 'scout_system'...");
        await connection.query("DROP DATABASE IF EXISTS scout_system");
        await connection.query("CREATE DATABASE IF NOT EXISTS scout_system");
        await connection.query("USE scout_system");

        console.log("📚 Reading schema.sql...");
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        const queries = schemaSql
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`🚀 Executing ${queries.length} queries...`);

        for (const query of queries) {
            if (query) {
                try {
                    await connection.query(query);
                    console.log("✅ Executed query (snippet): " + query.substring(0, 30));
                } catch (err) {
                    console.error("❌ Error executing query:", query.substring(0, 50) + "...", err.message);
                    process.exit(1); // Fail fast
                }
            }
        }

        console.log("🎉 Database setup completed successfully!");

    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.error("❌ Connection refused! Please make sure MySQL is running on port " + dbConfig.port);
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("❌ Access Denied! Checked credentials:", {
                user: dbConfig.user,
                host: dbConfig.host,
                port: dbConfig.port,
                passLength: dbConfig.password.length
            });
        } else {
            console.error("💥 Fatal error during DB setup:", err);
        }
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
