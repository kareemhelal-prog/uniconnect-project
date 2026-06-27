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
      ensureIndex("Notifications",   "idx_notif_user_read",     "user_id, is_read"),
      ensureIndex("Notifications",   "idx_notif_user_created",  "user_id, created_at"),
      ensureIndex("password_resets", "idx_pwreset_email",       "email, is_used"),
      // Feed ordering: `SELECT ... FROM Posts ORDER BY created_at DESC`
      ensureIndex("Posts",           "idx_posts_created",       "created_at"),
      // Loading a post's comments oldest-first / paginated
      ensureIndex("Comments",        "idx_comments_post_created", "post_id, created_at"),
      // Files library browsing ordered by newest
      ensureIndex("Files",           "idx_files_created",       "created_at"),
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

    // Run cleanup on startup, then check once a day and actually clean every
    // 45 days. NOTE: setInterval/setTimeout delays are capped at a 32-bit int
    // (~24.8 days); passing 45 days directly overflows and silently fires every
    // 1ms. So we tick daily (86.4M ms, safely under the cap) and gate the real
    // work behind a 45-day elapsed check.
    maybeRunCleanup();
    setInterval(maybeRunCleanup, 24 * 60 * 60 * 1000);

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

// Gate the heavy cleanup behind a 45-day window. Called daily; runs the actual
// delete only when at least 45 days have passed since the last run (and always
// once per process start, since lastCleanup resets to 0 on boot).
const CLEANUP_INTERVAL_MS = 45 * 24 * 60 * 60 * 1000;
let lastCleanup = 0;

async function maybeRunCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  await runPeriodicCleanup();
}

// Removes stale rows that accumulate over time and serve no purpose after expiry.
async function runPeriodicCleanup() {
  try {
    console.log("🧹 Running periodic DB cleanup...");

    // 1. Read notifications older than 90 days that the user already saw
    const [n] = await promisePool.query(`
      DELETE FROM Notifications
      WHERE is_read = 1
        AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
    `);

    // 2. OTP rows that are either used or expired (no longer needed)
    const [p] = await promisePool.query(`
      DELETE FROM password_resets
      WHERE is_used = 1
         OR expires_at < NOW()
    `);

    // 3. Email log entries older than 6 months (kept for auditing, but not forever)
    const [e] = await promisePool.query(`
      DELETE FROM Email_Logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)
    `);

    console.log(
      `🧹 Cleanup done — notifications: ${n.affectedRows} deleted, ` +
      `OTP rows: ${p.affectedRows} deleted, ` +
      `email logs: ${e.affectedRows} deleted`
    );
  } catch (err) {
    console.error("⚠️ Periodic cleanup error:", err.message);
  }
}

module.exports = { pool, promisePool, testConnection };
