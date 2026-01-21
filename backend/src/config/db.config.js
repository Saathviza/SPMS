console.log("🔥 DB.CONFIG.JS FILE LOADED");

const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("DB HOST:", process.env.DB_HOST);
console.log("DB PORT:", process.env.DB_PORT);
console.log("DB USER:", process.env.DB_USER);
console.log("DB NAME:", process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DATABASE CONNECTED");
    conn.release();
  } catch (err) {
    console.error("❌ DATABASE CONNECTION FAILED");
    console.error(err.message);
  }
})();

module.exports = pool;



