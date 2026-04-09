const mysql = require('mysql2/promise');
const fs = require('fs');
async function x() {
    try {
        const c = await mysql.createConnection({host:'127.0.0.1', port:3306, user:'root', password:'2003'});
        const [r] = await c.query('SHOW DATABASES');
        fs.writeFileSync('db_list.json', JSON.stringify(r));
        await c.end();
    } catch(e) {
        fs.writeFileSync('db_error.txt', e.message);
    }
}
x();
