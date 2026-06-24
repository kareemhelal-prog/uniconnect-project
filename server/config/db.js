require("dotenv").config();
const mysql = require("mysql2");

// =======================
// CREATE CONNECTION POOL
// =======================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "uniconnect",
  port: process.env.DB_PORT || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  charset: "utf8mb4",
  timezone: "Z"
});

// =======================
// PROMISE VERSION
// =======================
const promisePool = pool.promise();

// =======================
// TEST CONNECTION + AUTO-FIX PROFILE COLUMNS
// =======================
const testConnection = async () => {
  try {
    console.log("📡 Connecting to MySQL...");
    const connection = await promisePool.getConnection();
    console.log("✅ MySQL Connected Successfully");
    connection.release();

    // Auto-fix: ensure profile_picture can store base64 images
    try {
      await promisePool.query(`
        ALTER TABLE Users
          MODIFY COLUMN profile_picture MEDIUMTEXT,
          MODIFY COLUMN bio TEXT
      `);
      console.log("✅ Users table columns verified/fixed");
    } catch (alterErr) {
      // Ignore if already correct type
      if (!alterErr.message.includes("doesn't exist")) {
        console.warn("⚠ Column alter skipped:", alterErr.message);
      }
    }

  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
  }
};

// =======================
// EXPORT
// =======================
module.exports = {
  pool,
  promisePool,
  testConnection
};