const pool = require("./src/config/db.config");
pool.query("SHOW TABLES").then(r => {
    console.log(r[0]);
}).catch(console.error).finally(()=>process.exit());
