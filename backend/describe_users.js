const mysql = require('mysql2/promise');
const fs = require('fs');
async function x() {
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: '2003',
            database: 'scout_performance_management_system'
        });
        const [r] = await c.query('DESCRIBE users');
        fs.writeFileSync('users_structure.json', JSON.stringify(r));
        await c.end();
    } catch(e) {
        fs.writeFileSync('users_structure_error.txt', e.message);
    }
}
x();
