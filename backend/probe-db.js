const mysql = require('mysql2/promise');

const candidates = [
    { host: 'localhost', port: 3307, user: 'root', password: 'viza2003' },
    { host: '127.0.0.1', port: 3307, user: 'root', password: 'viza2003' },
    { host: 'localhost', port: 3306, user: 'root', password: 'viza2003' }, // Standard port
    { host: 'localhost', port: 3307, user: 'root', password: '' },         // Empty pass
    { host: 'localhost', port: 3306, user: 'root', password: '' },         // Standard port empty pass
];

async function probe() {
    console.log("🔍 Probing Database Connections...");

    for (const c of candidates) {
        try {
            process.stdout.write(`Trying ${c.host}:${c.port} user=${c.user} pass=${c.password ? '****' : '(empty)'} ... `);
            const conn = await mysql.createConnection(c);
            console.log("✅ SUCCESS!");
            await conn.end();
            console.log(`\n🎉 FULL SUCCESS with: Port=${c.port}, Password=${c.password ? '(provided)' : '(empty)'}`);
            process.exit(0);
        } catch (err) {
            console.log(`❌ Failed: ${err.code}`);
        }
    }

    console.log("\n💥 All combinations failed.");
    process.exit(1);
}

probe();
