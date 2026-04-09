const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function cleanAndMigrate() {
    let connection;
    try {
        const dbName = 'scout_pms_test'; // USE A DIFFERENT NAME TO TEST

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

        await connection.query("CREATE TABLE test_table (id INT);");
        console.log("✅ test_table created.");

        await connection.query("INSERT INTO test_table VALUES (1);");
        console.log("✅ data inserted.");

        const [rows] = await connection.query("SELECT * FROM test_table;");
        console.log("Rows:", rows);

        await connection.end();
    } catch (err) {
        console.error("❌ Fatal error:", err);
        if (connection) await connection.end();
    }
}

cleanAndMigrate();
