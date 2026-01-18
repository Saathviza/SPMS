const pool = require("./db");

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ DATABASE CONNECTED (MariaDB)");
    connection.release();
  } catch (err) {
    console.error("❌ DATABASE CONNECTION FAILED");
    console.error(err.message);
  }
})();
