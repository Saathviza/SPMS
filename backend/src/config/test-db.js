const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function testConnection() {
    console.log("🔍 Starting Database Diagnostic...");

    const configs = [
        {
            name: "Current .env Config",
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            port: parseInt(process.env.DB_PORT)
        },
        {
            name: "Standard Root (No Pass)",
            host: '127.0.0.1',
            user: 'root',
            password: '',
            port: 3307
        },
        {
            name: "Localhost instead of 127.0.0.1",
            host: 'localhost',
            user: 'root',
            password: process.env.DB_PASS,
            port: 3307
        }
    ];

    for (const config of configs) {
        console.log(`\nTesting: ${config.name}`);
        console.log(`Config: ${config.user}@${config.host}:${config.port}`);
        try {
            const connection = await mysql.createConnection(config);
            console.log("✅ SUCCESS!");
            await connection.end();
            process.exit(0);
        } catch (err) {
            console.log(`❌ FAILED: ${err.message}`);
        }
    }

    console.log("\n⚠️ All attempts failed. Please verify your MySQL server is running and your password is correct.");
}

testConnection();
