const mysql = require('mysql2/promise');
const fs = require('fs');
async function x() {
    let output = '';
    try {
        const c = await mysql.createConnection({host:'127.0.0.1', port:3307, user:'root', password:'viza2003', database:'scout_system'});
        const [r] = await c.query('SHOW TABLES');
        output = JSON.stringify(r);
        await c.end();
    } catch(e) {
        output = 'ERROR: ' + e.message;
    }
    fs.writeFileSync('db_check.txt', output);
}
x();
