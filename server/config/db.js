require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "uniconnect",
  port:     process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:  "utf8mb4",
  timezone: "Z"
});

const promisePool = pool.promise();

// Safely add a column if it doesn't already exist
async function ensureColumn(table, column, definition) {
  try {
    await promisePool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  ✅ Added column ${table}.${column}`);
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      // Column already exists — try to modify it (e.g. VARCHAR→MEDIUMTEXT)
      try {
        await promisePool.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${definition}`);
      } catch (_) { /* already correct type, ignore */ }
    }
    // Any other error: ignore silently (table might not exist yet)
  }
}

const testConnection = async () => {
  try {
    console.log("📡 Connecting to MySQL...");
    const connection = await promisePool.getConnection();
    console.log("✅ MySQL Connected Successfully");
    connection.release();

    console.log("🔧 Checking schema...");
    await Promise.all([
      ensureColumn("Users", "profile_picture", "MEDIUMTEXT"),
      ensureColumn("Users", "bio",             "TEXT"),
      ensureColumn("Users", "phone_number",    "VARCHAR(20)"),
      // Google OAuth support
      ensureColumn("Users", "google_id",       "VARCHAR(255) NULL"),
      ensureColumn("Users", "google_email",    "VARCHAR(255) NULL"),
      // Allow Google-only accounts to have no local password
      ensureColumn("Users", "password",        "VARCHAR(255) NULL"),
      // Deep-link comment notifications to the exact comment
      ensureColumn("Notifications", "reference_comment_id", "INT NULL"),
    ]);
    console.log("✅ Schema check complete");

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

module.exports = { pool, promisePool, testConnection };
