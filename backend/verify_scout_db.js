const mysql = require('mysql2/promise');
const fs = require('fs');
async function run() {
    let result = '';
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1', 
            port: 3307, 
            user: 'root', 
            password: 'viza2003', 
            database: 'scout_system'
        });
        const [users] = await c.query('SELECT email, role, password FROM users WHERE email="kavindu.scout@example.com"');
        result = JSON.stringify({ success: true, count: users.length, user: users[0] });
        await c.end();
    } catch (e) {
        result = JSON.stringify({ success: false, error: e.message });
    }
    fs.writeFileSync('scout_verify.txt', result);
}
run();
