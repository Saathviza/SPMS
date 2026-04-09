const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function test() {
    try {
        console.log("Attempting to connect with:", { ...dbConfig, password: "****" });
        const connection = await mysql.createConnection(dbConfig);
        console.log("✅ SUCCESS: Connected to database.");
        await connection.end();
        process.exit(0);
    } catch (e) {
        console.error("❌ FAILURE: Could not connect to database.");
        console.error(e);
        process.exit(1);
    }
}
test();
