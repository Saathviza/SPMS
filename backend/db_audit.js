const pool = require('./src/config/db.config');
const fs = require('fs');

async function test() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const results = { tables: tables.map(r => Object.values(r)[0]) };
        
        for (const table of results.tables) {
            const [count] = await pool.query(`SELECT COUNT(*) as c FROM \`${table}\``);
            results[table] = count[0].c;
        }
        
        fs.writeFileSync('db_audit.json', JSON.stringify(results, null, 2));
        console.log("Audit complete");
    } catch(e) {
        fs.writeFileSync('db_error.txt', e.stack);
        console.error(e);
    }
    process.exit();
}
test();
