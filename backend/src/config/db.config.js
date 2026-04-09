const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const logFilePath = path.join(__dirname, "../../logs/db_errors.log");

const logError = (error) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] DATABASE CONNECTION FAILED: ${error}\n`;
  if (!fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  }
  fs.appendFileSync(logFilePath, logMessage);
};

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

const pool = mysql.createPool(dbConfig);

const connectWithRetry = async (retries = 5, delay = 5000) => {
  try {
    const conn = await pool.getConnection();
    console.log("DATABASE CONNECTED");
    conn.release();
  } catch (err) {
    logError(err.message);
    console.error(`DATABASE CONNECTION FAILED: ${err.message}`);

    if (retries > 0) {
      console.log(`Retrying in ${delay / 1000}s... (${retries} retries left)`);
      setTimeout(() => connectWithRetry(retries - 1, delay), delay);
    } else {
      console.error("Max retries reached. Database connection could not be established.");
    }
  }
};

console.log("DB.CONFIG.JS FILE LOADED");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

connectWithRetry();

module.exports = pool;
