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

// Safely create a table if it doesn't already exist
async function ensureTable(name, definition) {
  try {
    await promisePool.query(`CREATE TABLE IF NOT EXISTS ${name} (${definition})`);
  } catch (err) {
    console.error(`⚠️  ensureTable(${name}) failed:`, err.message);
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

// Safely add a UNIQUE index if it doesn't already exist. Needed so idempotent
// `INSERT ... ON DUPLICATE KEY UPDATE` seeds have a key to conflict on.
async function ensureUniqueIndex(table, indexName, columns) {
  try {
    await promisePool.query(`CREATE UNIQUE INDEX ${indexName} ON ${table} (${columns})`);
    console.log(`  ✅ Added unique index ${table}.${indexName}`);
  } catch (err) {
    // ER_DUP_KEYNAME = already exists; anything else (missing table) ignored
  }
}

// Flip the courses.doctor_id foreign key from ON DELETE CASCADE to SET NULL, so
// removing a doctor unassigns them from curriculum courses instead of deleting
// those courses. Idempotent — does nothing once the rule is already SET NULL.
async function ensureCourseDoctorFkSetNull() {
  try {
    const [[{ db }]] = await promisePool.query("SELECT DATABASE() AS db");

    // Detach any course pointing at a doctor that no longer exists — otherwise
    // (re)creating the FK fails on the orphan rows.
    await promisePool.query(
      "UPDATE Courses SET doctor_id = NULL WHERE doctor_id IS NOT NULL AND doctor_id NOT IN (SELECT id FROM Users)"
    );

    const [rows] = await promisePool.query(
      `SELECT k.constraint_name AS fk_name, r.delete_rule AS del_rule
       FROM information_schema.key_column_usage k
       JOIN information_schema.referential_constraints r
         ON r.constraint_name = k.constraint_name AND r.constraint_schema = k.table_schema
       WHERE k.table_schema = ? AND k.table_name = 'courses'
         AND k.column_name = 'doctor_id' AND k.referenced_table_name = 'users'
       LIMIT 1`,
      [db]
    );

    if (rows.length > 0) {
      const fkName  = rows[0].fk_name || rows[0].FK_NAME;
      const delRule = String(rows[0].del_rule || rows[0].DEL_RULE || "").toUpperCase();
      if (delRule === "SET NULL") return;          // already correct
      await promisePool.query(`ALTER TABLE Courses DROP FOREIGN KEY \`${fkName}\``);
    }

    // (Re)create the FK with SET NULL under a stable name.
    try {
      await promisePool.query(
        "ALTER TABLE Courses ADD CONSTRAINT courses_doctor_fk FOREIGN KEY (doctor_id) REFERENCES Users(id) ON DELETE SET NULL"
      );
      console.log("  ✅ Courses.doctor_id FK set to ON DELETE SET NULL");
    } catch (e) {
      if (e.code !== "ER_FK_DUP_NAME" && e.code !== "ER_DUP_KEYNAME") throw e;
    }
  } catch (err) {
    // Non-fatal: the admin controllers already unassign courses before delete.
    console.error("⚠️  Course FK migration skipped:", err.message);
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
      // Real download counter for files
      ensureColumn("Files", "download_count", "INT NOT NULL DEFAULT 0"),
      // ── Account approval workflow ──
      // Separate "approval" (admin review) from "is_active" (ban). New signups
      // start as 'pending' and cannot log in until an admin approves them.
      ensureColumn("Users", "account_status",  "ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'"),
      ensureColumn("Users", "rejection_reason","VARCHAR(255) NULL"),
      ensureColumn("Users", "reviewed_by",     "INT NULL"),
      ensureColumn("Users", "reviewed_at",     "DATETIME NULL"),
      // ── Student cohort: track only applies to years 3 & 4 ──
      ensureColumn("Profile_Studies", "track", "ENUM('software','networks') NULL"),
      // The academic ID the student typed at signup (admin verifies it on
      // review). Stored on the profile so it survives without a registry claim.
      ensureColumn("Profile_Studies", "academic_id", "VARCHAR(20) NULL"),
      // Google sign-ups that haven't finished the registration wizard yet.
      ensureColumn("Users", "needs_profile", "TINYINT(1) NOT NULL DEFAULT 0"),
      // First-login onboarding (welcome → photo → friends → groups) after approval.
      ensureColumn("Users", "is_onboarded", "TINYINT(1) NOT NULL DEFAULT 0"),
      // Admins get a notification when a new account needs review.
      ensureColumn("Notifications", "type", "ENUM('like','comment','follow','post','review','mention','account','project','group') DEFAULT NULL"),
      // ── Real-time admin monitoring ──
      // Heartbeat: refreshed (throttled) on every authenticated request so the
      // admin can see who is currently online.
      ensureColumn("Users", "last_seen", "DATETIME NULL"),
      // ── Cohort segregation of content (year + track) ──
      // Content is tagged with the cohort it belongs to; students only see their
      // own cohort (+ untagged/global rows). NULL = global (visible to everyone).
      // Track only applies to years 3 & 4.
      ensureColumn("Posts",    "academic_year", "ENUM('1','2','3','4') NULL"),
      ensureColumn("Posts",    "track",         "ENUM('software','networks') NULL"),
      ensureColumn("`Groups`", "academic_year", "ENUM('1','2','3','4') NULL"),
      ensureColumn("`Groups`", "track",         "ENUM('software','networks') NULL"),
      ensureColumn("Projects", "academic_year", "ENUM('1','2','3','4') NULL"),
      ensureColumn("Projects", "track",         "ENUM('software','networks') NULL"),
      ensureColumn("Files",    "track",         "ENUM('software','networks') NULL"),
      // ── Courses / Materials (admin-managed curriculum) ──
      // A course belongs to a cohort (year + track + semester). The admin owns
      // CRUD and assigns exactly ONE doctor per course; doctor_id is nullable
      // (an unassigned course exists but has no owner yet). course_code is the
      // official curriculum code and the seed's idempotency key.
      ensureColumn("Courses", "course_code",   "VARCHAR(20) NULL"),
      ensureColumn("Courses", "academic_year", "ENUM('1','2','3','4') NULL"),
      ensureColumn("Courses", "track",         "ENUM('software','networks') NULL"),
      ensureColumn("Courses", "semester",      "TINYINT NULL"),
      ensureColumn("Courses", "doctor_id",     "INT NULL"),
      // A course's materials are ordinary Files tagged with the course they
      // belong to (NULL = a normal library file, not tied to any course).
      ensureColumn("Files",   "course_id",     "INT NULL"),
      // ── Investor marketplace ──
      // open_to_investors is now controlled ONLY by the supervising doctor
      // (the student can't publish their own project). A project also needs
      // approval_status='approved' by its supervisor to reach investors.
      ensureColumn("Projects", "open_to_investors", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("Projects", "image_url",   "VARCHAR(255) NULL"),
      ensureColumn("Projects", "looking_for", "VARCHAR(120) NULL"),
      // ── Supervision & richer project model ──
      ensureColumn("Projects", "project_type",        "VARCHAR(60) NULL"),   // IoT, Robotics, ...
      ensureColumn("Projects", "supervisor_id",       "INT NULL"),           // the chosen doctor
      ensureColumn("Projects", "approval_status",     "ENUM('pending','approved','rejected','revision') NOT NULL DEFAULT 'pending'"),
      ensureColumn("Projects", "supervisor_feedback", "TEXT NULL"),
      ensureColumn("Projects", "video_url",           "VARCHAR(255) NULL"),  // demo video link
      ensureColumn("Projects", "pitch_deck_url",      "VARCHAR(255) NULL"),  // uploaded PDF
      ensureColumn("Projects", "featured",            "TINYINT(1) NOT NULL DEFAULT 0"), // project of the week
      // Project attachments/deliverables are Files tagged with the project.
      ensureColumn("Files",    "project_id",          "INT NULL"),
      // A verified investor badge (admin-set).
      ensureColumn("Investor_Profiles", "verified",   "TINYINT(1) NOT NULL DEFAULT 0"),
      // ── Study groups ──
      // Group materials are Files tagged with the group; group posts can be
      // pinned and flagged as announcements.
      ensureColumn("Files",       "group_id",  "INT NULL"),
      ensureColumn("Group_Posts", "is_pinned", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("Group_Posts", "post_type", "ENUM('post','announcement') NOT NULL DEFAULT 'post'"),
      // "edited" flag across every group entity (set true when edited).
      ensureColumn("Group_Posts",      "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("group_questions",  "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("group_answers",    "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("Files",            "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("group_sessions",   "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("group_tasks",      "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("group_flashcards", "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("group_wiki",       "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      ensureColumn("group_polls",      "is_edited", "TINYINT(1) NOT NULL DEFAULT 0"),
      // Wiki docs are PRIVATE per user (each member has their own notes).
      ensureColumn("group_wiki",  "owner_id",  "INT NULL"),
      // Group approval workflow (student-created groups need admin approval).
      // Existing groups default to 'approved' so they stay visible.
      ensureColumn("`Groups`", "status", "ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved'"),
      // Per-OTP guess counter — caps brute-force of a password-reset code to a
      // handful of attempts before the code is burned (see verifyOtp).
      ensureColumn("password_resets", "attempts", "INT NOT NULL DEFAULT 0"),
      // Post reactions: a Like now carries a reaction TYPE (Facebook-style).
      // Existing likes default to 'like' so nothing changes for old data.
      ensureColumn("Likes", "reaction", "VARCHAR(20) NOT NULL DEFAULT 'like'"),
    ]);

    // Site-wide activity stream — every notable user action is appended here so
    // the admin Live Feed can replay "what's happening right now". Distinct from
    // Activity_Logs (which is the admin's own audit trail). event_type is a free
    // VARCHAR (not an ENUM) so new event kinds can be added without a migration.
    await ensureTable("site_events", `
      id          INT AUTO_INCREMENT PRIMARY KEY,
      actor_id    INT NULL,
      actor_name  VARCHAR(150) NULL,
      event_type  VARCHAR(40)  NOT NULL,
      target_type VARCHAR(40)  NULL,
      target_id   INT NULL,
      summary     VARCHAR(255) NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_events_created (created_at),
      KEY idx_events_type (event_type),
      KEY idx_events_actor (actor_id)
    `);

    // Investor bookmarks — a private "saved for later" list of projects.
    await ensureTable("project_bookmarks", `
      id          INT AUTO_INCREMENT PRIMARY KEY,
      project_id  INT NOT NULL,
      investor_id INT NOT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      UNIQUE KEY uq_bookmark (project_id, investor_id),
      KEY idx_bookmark_investor (investor_id),
      CONSTRAINT fk_bookmark_project  FOREIGN KEY (project_id)  REFERENCES Projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_bookmark_investor FOREIGN KEY (investor_id) REFERENCES Users(id)    ON DELETE CASCADE
    `);

    // Doctor endorsements — a doctor vouches for a student project (a trust
    // badge investors see) with an optional feedback note + star rating.
    await ensureTable("project_endorsements", `
      id         INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      doctor_id  INT NOT NULL,
      note       TEXT NULL,
      rating     TINYINT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      UNIQUE KEY uq_endorse (project_id, doctor_id),
      KEY idx_endorse_project (project_id),
      CONSTRAINT fk_endorse_project FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_endorse_doctor  FOREIGN KEY (doctor_id)  REFERENCES Users(id)    ON DELETE CASCADE
    `);
    await ensureColumn("project_endorsements", "rating", "TINYINT NULL"); // for pre-existing tables

    // Investor funding offers (amount + message). One live offer per investor
    // per project (upserted). Sum of amounts drives the funding progress bar.
    await ensureTable("project_offers", `
      id          INT AUTO_INCREMENT PRIMARY KEY,
      project_id  INT NOT NULL,
      investor_id INT NOT NULL,
      amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
      message     TEXT NULL,
      status      ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      UNIQUE KEY uq_offer (project_id, investor_id),
      KEY idx_offer_project (project_id),
      CONSTRAINT fk_offer_project  FOREIGN KEY (project_id)  REFERENCES Projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_offer_investor FOREIGN KEY (investor_id) REFERENCES Users(id)    ON DELETE CASCADE
    `);

    // Meeting requests from an investor to a project's student.
    await ensureTable("project_meetings", `
      id            INT AUTO_INCREMENT PRIMARY KEY,
      project_id    INT NOT NULL,
      investor_id   INT NOT NULL,
      proposed_time DATETIME NULL,
      message       TEXT NULL,
      status        ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
      created_at    TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_meeting_project (project_id),
      CONSTRAINT fk_meeting_project  FOREIGN KEY (project_id)  REFERENCES Projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_meeting_investor FOREIGN KEY (investor_id) REFERENCES Users(id)    ON DELETE CASCADE
    `);

    // Public Q&A on a project — anyone (investor) asks, the student answers.
    await ensureTable("project_questions", `
      id          INT AUTO_INCREMENT PRIMARY KEY,
      project_id  INT NOT NULL,
      asker_id    INT NOT NULL,
      question    TEXT NOT NULL,
      answer      TEXT NULL,
      answered_at DATETIME NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_q_project (project_id),
      CONSTRAINT fk_q_project FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_q_asker   FOREIGN KEY (asker_id)   REFERENCES Users(id)    ON DELETE CASCADE
    `);

    // Milestone / progress updates posted by the student; interested investors
    // get notified.
    await ensureTable("project_updates", `
      id         INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      content    TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_update_project (project_id),
      CONSTRAINT fk_update_project FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
    `);

    // ===================== STUDY GROUPS =====================
    const gFk = (col) => `CONSTRAINT fk_${col}_group FOREIGN KEY (group_id) REFERENCES \`Groups\`(id) ON DELETE CASCADE`;

    // Which cohorts a group is visible to. NO rows for a group = visible to
    // everyone. track NULL = the whole year (both tracks).
    await ensureTable("group_audience", `
      id            INT AUTO_INCREMENT PRIMARY KEY,
      group_id      INT NOT NULL,
      academic_year ENUM('1','2','3','4') NOT NULL,
      track         ENUM('software','networks') NULL,
      KEY idx_gaud_group (group_id),
      ${gFk('gaud')}
    `);

    // Q&A: a member asks, others answer, one answer can be marked "best".
    await ensureTable("group_questions", `
      id         INT AUTO_INCREMENT PRIMARY KEY,
      group_id   INT NOT NULL,
      asker_id   INT NOT NULL,
      title      VARCHAR(255) NOT NULL,
      body       TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_gq_group (group_id),
      ${gFk('gq')},
      CONSTRAINT fk_gq_asker FOREIGN KEY (asker_id) REFERENCES Users(id) ON DELETE CASCADE
    `);
    await ensureTable("group_answers", `
      id          INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      user_id     INT NOT NULL,
      content     TEXT NOT NULL,
      is_best     TINYINT(1) NOT NULL DEFAULT 0,
      created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_ga_question (question_id),
      CONSTRAINT fk_ga_question FOREIGN KEY (question_id) REFERENCES group_questions(id) ON DELETE CASCADE,
      CONSTRAINT fk_ga_user     FOREIGN KEY (user_id)     REFERENCES Users(id)          ON DELETE CASCADE
    `);

    // Flashcards / question bank for group revision.
    await ensureTable("group_flashcards", `
      id         INT AUTO_INCREMENT PRIMARY KEY,
      group_id   INT NOT NULL,
      creator_id INT NOT NULL,
      front      TEXT NOT NULL,
      back       TEXT NOT NULL,
      topic      VARCHAR(120) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_gf_group (group_id),
      ${gFk('gf')},
      CONSTRAINT fk_gf_creator FOREIGN KEY (creator_id) REFERENCES Users(id) ON DELETE CASCADE
    `);

    // Collaborative summaries (wiki docs) — anyone edits; last editor tracked.
    await ensureTable("group_wiki", `
      id          INT AUTO_INCREMENT PRIMARY KEY,
      group_id    INT NOT NULL,
      title       VARCHAR(200) NOT NULL,
      content     MEDIUMTEXT NULL,
      updated_by  INT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      KEY idx_gw_group (group_id),
      ${gFk('gw')}
    `);

    // Study sessions + exam countdowns; members RSVP.
    await ensureTable("group_sessions", `
      id           INT AUTO_INCREMENT PRIMARY KEY,
      group_id     INT NOT NULL,
      title        VARCHAR(200) NOT NULL,
      type         ENUM('session','exam') NOT NULL DEFAULT 'session',
      scheduled_at DATETIME NOT NULL,
      location     VARCHAR(255) NULL,
      created_by   INT NULL,
      created_at   TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_gs_group (group_id),
      ${gFk('gs')}
    `);
    await ensureTable("group_session_rsvp", `
      id         INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      user_id    INT NOT NULL,
      status     ENUM('going','maybe','no') NOT NULL DEFAULT 'going',
      UNIQUE KEY uq_rsvp (session_id, user_id),
      CONSTRAINT fk_rsvp_session FOREIGN KEY (session_id) REFERENCES group_sessions(id) ON DELETE CASCADE,
      CONSTRAINT fk_rsvp_user    FOREIGN KEY (user_id)    REFERENCES Users(id)          ON DELETE CASCADE
    `);

    // Task board: who summarizes which chapter, etc.
    await ensureTable("group_tasks", `
      id          INT AUTO_INCREMENT PRIMARY KEY,
      group_id    INT NOT NULL,
      title       VARCHAR(255) NOT NULL,
      assignee_id INT NULL,
      status      ENUM('todo','doing','done') NOT NULL DEFAULT 'todo',
      due_date    DATE NULL,
      created_by  INT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_gt_group (group_id),
      ${gFk('gt')}
    `);

    // Contribution points (leaderboard). Upserted as members contribute.
    await ensureTable("group_points", `
      id       INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      user_id  INT NOT NULL,
      points   INT NOT NULL DEFAULT 0,
      UNIQUE KEY uq_points (group_id, user_id),
      ${gFk('gp')},
      CONSTRAINT fk_gp_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    `);

    // Polls.
    await ensureTable("group_polls", `
      id         INT AUTO_INCREMENT PRIMARY KEY,
      group_id   INT NOT NULL,
      question   VARCHAR(255) NOT NULL,
      created_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      KEY idx_gpoll_group (group_id),
      ${gFk('gpoll')}
    `);
    await ensureTable("group_poll_options", `
      id      INT AUTO_INCREMENT PRIMARY KEY,
      poll_id INT NOT NULL,
      text    VARCHAR(200) NOT NULL,
      CONSTRAINT fk_gpo_poll FOREIGN KEY (poll_id) REFERENCES group_polls(id) ON DELETE CASCADE
    `);
    await ensureTable("group_poll_votes", `
      id        INT AUTO_INCREMENT PRIMARY KEY,
      poll_id   INT NOT NULL,
      option_id INT NOT NULL,
      user_id   INT NOT NULL,
      UNIQUE KEY uq_vote (poll_id, user_id),
      CONSTRAINT fk_gpv_poll   FOREIGN KEY (poll_id)   REFERENCES group_polls(id)        ON DELETE CASCADE,
      CONSTRAINT fk_gpv_option FOREIGN KEY (option_id) REFERENCES group_poll_options(id) ON DELETE CASCADE,
      CONSTRAINT fk_gpv_user   FOREIGN KEY (user_id)   REFERENCES Users(id)              ON DELETE CASCADE
    `);

    // Platform settings — single-row key/value store the admin can toggle
    // (registration open, maintenance mode, banned words, etc.).
    await ensureTable("platform_settings", `
      setting_key   VARCHAR(50) PRIMARY KEY,
      setting_value TEXT NULL,
      updated_at    TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
    `);

    // University student registry — official records uploaded by the admin.
    // Registration is validated against this list (id + name must match), and a
    // record can only be claimed once.
    await ensureTable("student_registry", `
      id            INT AUTO_INCREMENT PRIMARY KEY,
      academic_id   VARCHAR(20)  NOT NULL,
      full_name     VARCHAR(150) NOT NULL,
      academic_year ENUM('1','2','3','4') NOT NULL,
      track         ENUM('software','networks') NULL,
      claimed_by    INT NULL,
      created_at    TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      UNIQUE KEY uq_registry_academic_id (academic_id),
      KEY idx_registry_claimed (claimed_by)
    `);

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
      // Admin pending-review queue: `WHERE account_status='pending'`
      ensureIndex("Users",           "idx_users_status",        "account_status"),
      // Cohort segregation lookups by (year, track)
      ensureIndex("Profile_Studies", "idx_studies_cohort",      "academic_year, track"),
      // Online-users lookup: `WHERE last_seen > NOW() - INTERVAL n MINUTE`
      ensureIndex("Users",           "idx_users_last_seen",     "last_seen"),
      // Course materials lookup: `WHERE course_id = ?`
      ensureIndex("Files",           "idx_files_course",        "course_id"),
      // Student "my courses" lookup by cohort
      ensureIndex("Courses",         "idx_courses_cohort",      "academic_year, track, semester"),
    ]);

    // course_code is the curriculum key the seed conflicts on (idempotency).
    await ensureUniqueIndex("Courses", "uq_courses_code", "course_code");

    // Deleting a doctor must NOT delete the curriculum courses assigned to
    // them — the course should just become unassigned. The original schema had
    // courses.doctor_id ON DELETE CASCADE; flip it to SET NULL.
    await ensureCourseDoctorFkSetNull();

    // Seed the official curriculum (idempotent — safe to run every boot).
    try {
      await require("./seedCourses")(promisePool);
    } catch (err) {
      console.error("⚠️  Course seed failed:", err.message);
    }

    // Existing accounts (created before this workflow) must stay usable — flip
    // any NULL/legacy rows to 'approved' so the gate only affects new signups.
    try {
      await promisePool.query(
        "UPDATE Users SET account_status = 'approved' WHERE account_status IS NULL OR (created_at < '2026-06-28' AND account_status = 'pending')"
      );
      // Pre-existing accounts shouldn't be forced through the new onboarding.
      await promisePool.query(
        "UPDATE Users SET is_onboarded = 1 WHERE created_at < '2026-06-28' OR role = 'admin'"
      );
    } catch (_) { /* column may not exist on first boot ordering — ignored */ }

    // Backfill: tag pre-existing content with its author's cohort so the
    // year/track segregation also applies to content created before this
    // feature. Only fills rows still untagged (academic_year IS NULL), and the
    // JOIN to Profile_Studies naturally limits it to student authors — content
    // by doctors/admins/investors (no Profile_Studies) stays global.
    try {
      await promisePool.query(
        "UPDATE Posts p JOIN Profile_Studies ps ON ps.user_id = p.user_id SET p.academic_year = ps.academic_year, p.track = ps.track WHERE p.academic_year IS NULL AND ps.academic_year IS NOT NULL"
      );
      await promisePool.query(
        "UPDATE `Groups` g JOIN Profile_Studies ps ON ps.user_id = g.creator_id SET g.academic_year = ps.academic_year, g.track = ps.track WHERE g.academic_year IS NULL AND ps.academic_year IS NOT NULL"
      );
      await promisePool.query(
        "UPDATE Projects pr JOIN Profile_Studies ps ON ps.user_id = pr.creator_id SET pr.academic_year = ps.academic_year, pr.track = ps.track WHERE pr.academic_year IS NULL AND ps.academic_year IS NOT NULL"
      );
      await promisePool.query(
        "UPDATE Files f JOIN Profile_Studies ps ON ps.user_id = f.uploader_id SET f.academic_year = ps.academic_year, f.track = ps.track WHERE f.academic_year IS NULL AND ps.academic_year IS NOT NULL"
      );
    } catch (_) { /* cohort columns may not exist yet on first boot — ignored */ }

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

    // Remove abandoned Google stubs: accounts that started the sign-up wizard
    // (needs_profile = 1) but were never completed, older than a day. They'd
    // otherwise linger as junk (hidden from admin review, but still rows).
    try {
      const [r] = await promisePool.query(
        "DELETE FROM Users WHERE needs_profile = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)"
      );
      if (r.affectedRows) console.log(`  🧹 Removed ${r.affectedRows} abandoned sign-up stub(s)`);
    } catch (_) { /* column may not exist on first boot — ignored */ }

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
