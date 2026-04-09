const mysql = require('mysql2/promise');
const fs = require('fs');

const candidates = [
    { port: 3306, password: 'root' },
    { port: 3307, password: 'root' },
    { port: 3306, password: 'admin' },
    { port: 3307, password: 'admin' },
    { port: 3306, password: 'password' },
    { port: 3307, password: 'password' },
    { port: 3306, password: 'rootroot' },
    { port: 3307, password: 'rootroot' },
    { port: 3308, password: '' },
    { port: 3308, password: 'root' },
];

async function probe() {
    let finalLog = '';
    for (const c of candidates) {
        try {
            const conn = await mysql.createConnection({ host: '127.0.0.1', port: c.port, user: 'root', password: c.password });
            finalLog += `WINNER: Port=${c.port} Pass=${c.password}\n`;
            await conn.end();
        } catch (err) {
            // ignore
        }
    }
    fs.writeFileSync('brute_force_results.txt', finalLog);
}

probe();
