const mysql = require("mysql2/promise");

async function simpleTest() {
    console.log("STARTING SIMPLE TEST");
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });
        console.log("CONNECTED");
        const [rows] = await connection.query("SHOW TABLES LIKE 'service_logs'");
        console.log("Service logs exists:", rows.length > 0);
    } catch (e) {
        console.error("SIMPLE TEST ERROR:", e.message);
    }
    process.exit();
}
simpleTest();
