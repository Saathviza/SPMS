const mysql = require('mysql2/promise');
const fs = require('fs');

async function check() {
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            port: 3307,
            database: 'scout_performance_management_system'
        });
        const [users] = await c.query('SELECT email, role FROM users');
        fs.writeFileSync('current_users.json', JSON.stringify(users, null, 2));
        await c.end();
    } catch (err) {
        fs.writeFileSync('db_error_check.txt', err.message);
    }
}
check();
