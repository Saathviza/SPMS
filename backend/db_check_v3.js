const mysql = require('mysql2/promise');
const fs = require('fs');
const path = 'brute_force_log.txt';

async function log(msg) {
    fs.appendFileSync(path, msg + '\n');
}

const candidates = [
    { port: 3307, password: '2003' },
    { port: 3307, password: 'viza2003' },
    { port: 3307, password: '' },
    { port: 3306, password: '2003' },
    { port: 3306, password: 'viza2003' },
    { port: 3306, password: '' },
];

async function probe() {
    await log('--- PROBE START ---');
    for (const c of candidates) {
        try {
            await log(`Trying ${c.port} with pass ${c.password}...`);
            const conn = await mysql.createConnection({ host: '127.0.0.1', port: c.port, user: 'root', password: c.password });
            await log(`✅ SUCCESS: Port=${c.port} Password=${c.password}`);
            await conn.end();
            process.exit(0);
        } catch (err) {
            await log(`❌ FAILED: ${err.message}`);
        }
    }
    await log('--- PROBE END (FAILED) ---');
}

probe();
