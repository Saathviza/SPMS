const mysql = require('mysql2/promise');
async function run() {
    const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'2003',database:'spms_db'});
    const [r] = await c.query("SHOW TABLES");
    console.log("ALL TABLES:", JSON.stringify(r));
    process.exit();
}
run();
