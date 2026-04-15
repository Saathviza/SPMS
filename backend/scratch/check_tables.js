async function check() {
    try {
        const pool = require('./src/config/db.config');
        // Wait for connection
        await new Promise(r => setTimeout(r, 2000));
        const [rows] = await pool.query('SHOW TABLES');
        console.log(JSON.stringify(rows.map(r => Object.values(r)[0]), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
