const mysql = require('mysql2/promise');
const fs = require('fs');

async function check() {
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: '2003',
            database: 'scout_performance_management_system'
        });

        const [users] = await c.query("SELECT id, email, role, full_name, is_active FROM users ORDER BY created_at DESC LIMIT 5");
        const [scouts] = await c.query("SELECT * FROM scouts ORDER BY id DESC LIMIT 5");

        fs.writeFileSync('db_results.json', JSON.stringify({ users, scouts }, null, 2));

        await c.end();
    } catch (err) {
        fs.writeFileSync('db_results.json', 'ERROR: ' + err.message);
    }
}

check();
