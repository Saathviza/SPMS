const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    console.log('Testing connection with:');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        console.log('✅ Connection Successful!');
        await conn.end();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
}

test();
