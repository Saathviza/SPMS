const mysql = require('mysql2/promise');
const fs = require('fs');

const candidates = [
    { host: '127.0.0.1', port: 3307, user: 'root', password: 'viza2003' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: 'viza2003' },
    { host: '127.0.0.1', port: 3307, user: 'root', password: '' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: '' },
];

async function probe() {
    let finalLog = '';
    for (const c of candidates) {
        try {
            const conn = await mysql.createConnection(c);
            finalLog += `SUCCESS: ${c.host}:${c.port} user=${c.user} pass=${c.password ? 'YES' : 'NO'}\n`;
            await conn.end();
        } catch (err) {
            finalLog += `FAILED: ${c.host}:${c.port} user=${c.user} pass=${c.password ? 'YES' : 'NO'} - ${err.message}\n`;
        }
    }
    fs.writeFileSync('probe_results.txt', finalLog);
}

probe();
