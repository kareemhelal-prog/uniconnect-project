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

// Safely add an index if it doesn't already exist
async function ensureIndex(table, indexName, columns) {
  try {
    await promisePool.query(`CREATE INDEX ${indexName} ON ${table} (${columns})`);
    console.log(`  ✅ Added index ${table}.${indexName}`);
  } catch (err) {
    // ER_DUP_KEYNAME = already exists; anything else (missing table) ignored
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

    // Composite indexes for the hottest query patterns (no-op if present)
    await Promise.all([
      ensureIndex("Notifications",   "idx_notif_user_read",    "user_id, is_read"),
      ensureIndex("Notifications",   "idx_notif_user_created", "user_id, created_at"),
      ensureIndex("password_resets", "idx_pwreset_email",      "email, is_used"),
    ]);

    // One-time cleanup: remove historical duplicate like/follow notifications,
    // keeping only the oldest per (sender_id, user_id, type, reference_id) group.
    try {
      await promisePool.query(`
        DELETE FROM Notifications
        WHERE type IN ('like', 'follow')
          AND id NOT IN (
            SELECT min_id FROM (
              SELECT MIN(id) AS min_id
              FROM Notifications
              WHERE type IN ('like', 'follow')
              GROUP BY sender_id, user_id, type, COALESCE(reference_id, 0)
            ) AS t
          )
      `);
    } catch (_) { /* non-critical — ignore if table structure differs */ }

    console.log("✅ Schema check complete");

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

module.exports = { pool, promisePool, testConnection };
