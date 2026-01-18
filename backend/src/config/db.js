const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "127.0.0.1",   // IMPORTANT
  user: "root",
  password: "viza2003",
  database: "scout_system",
  port: 3307,          // 🔥 REQUIRED
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
