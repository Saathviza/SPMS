const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    try {
        const c = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        const [users] = await c.query("SELECT id, email, role, full_name, is_active FROM users ORDER BY created_at DESC LIMIT 5");
        console.log("USERS:", JSON.stringify(users, null, 2));

        const [scouts] = await c.query("SELECT * FROM scouts ORDER BY created_at DESC LIMIT 5");
        console.log("SCOUTS:", JSON.stringify(scouts, null, 2));

        await c.end();
    } catch (err) {
        console.error("ERROR:", err.message);
    }
}

check();
