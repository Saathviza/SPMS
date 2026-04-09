require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '2003',
            multipleStatements: true
        });

        console.log("Connected to MySQL.");

        const sqlFilePath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log("Executing schema.sql...");
        await connection.query(sql);

        console.log("Schema executed successfully!");
        await connection.end();
    } catch (err) {
        console.error("Error executing schema:", err);
    }
}

runSchema();
