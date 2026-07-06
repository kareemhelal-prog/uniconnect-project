// server/database/seedDemoAccounts.js
// ---------------------------------------------------------------------------
// Creates 6 ready-to-use DEMO student accounts — one per academic cohort —
// already 'approved' and onboarded, so you can log in immediately. Perfect for
// a live defense demo of the year/track content segregation: log in as each
// cohort and show that every cohort only sees its own content.
//
//   How to run (server must have booted at least once so the schema exists):
//     cd server
//     node database/seedDemoAccounts.js
//
// Idempotent: safe to run as many times as you like (updates instead of dupes).
// Log in with the EMAIL (shown below) + the shared demo password.
// ---------------------------------------------------------------------------
const bcrypt = require("bcrypt");
const { promisePool } = require("../config/db");

const PASSWORD = "Demo@2026"; // shared demo password (>= 8 chars, meets the policy)

// One account per cohort. Years 1 & 2 have no track; years 3 & 4 split into
// software / networks — that's exactly 6 cohorts.
const ACCOUNTS = [
  { cohort: "الفرقة الأولى",           name: "Student — Year 1",            email: "year1@uniconnect.test",    username: "year1_demo",    academic_id: "2400001", year: "1", track: null      },
  { cohort: "الفرقة الثانية",          name: "Student — Year 2",            email: "year2@uniconnect.test",    username: "year2_demo",    academic_id: "2300001", year: "2", track: null      },
  { cohort: "الفرقة الثالثة · Software", name: "Student — Year 3 (Software)", email: "year3sw@uniconnect.test",  username: "year3sw_demo",  academic_id: "2200001", year: "3", track: "software" },
  { cohort: "الفرقة الثالثة · Networks", name: "Student — Year 3 (Networks)", email: "year3net@uniconnect.test", username: "year3net_demo", academic_id: "2200002", year: "3", track: "networks" },
  { cohort: "الفرقة الرابعة · Software", name: "Student — Year 4 (Software)", email: "year4sw@uniconnect.test",  username: "year4sw_demo",  academic_id: "2100001", year: "4", track: "software" },
  { cohort: "الفرقة الرابعة · Networks", name: "Student — Year 4 (Networks)", email: "year4net@uniconnect.test", username: "year4net_demo", academic_id: "2100002", year: "4", track: "networks" },
];

async function upsertAccount(a, passwordHash) {
  // Users — idempotent on the UNIQUE email. Created straight as an approved,
  // onboarded student so the login approval-gate lets it straight in.
  await promisePool.query(
    `INSERT INTO Users (name, email, password, username, role, account_status, is_onboarded)
     VALUES (?, ?, ?, ?, 'student', 'approved', 1)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), password = VALUES(password), username = VALUES(username),
       role = 'student', account_status = 'approved', is_onboarded = 1`,
    [a.name, a.email, passwordHash, a.username]
  );

  const [[user]] = await promisePool.query("SELECT id FROM Users WHERE email = ?", [a.email]);

  // Profile_Studies — carries the cohort (year + track) that drives what the
  // student can see. Idempotent on the UNIQUE user_id.
  await promisePool.query(
    `INSERT INTO Profile_Studies (user_id, faculty, major, academic_year, track, academic_id)
     VALUES (?, 'General Faculty', ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       major = VALUES(major), academic_year = VALUES(academic_year),
       track = VALUES(track), academic_id = VALUES(academic_id)`,
    [user.id, a.track || "General", a.year, a.track, a.academic_id]
  );

  return user.id;
}

(async () => {
  try {
    const hash = await bcrypt.hash(PASSWORD, 10);
    console.log("\n🌱 Seeding 6 demo cohort accounts...\n");
    for (const a of ACCOUNTS) {
      const id = await upsertAccount(a, hash);
      const trackTxt = a.track ? `/${a.track}` : "";
      console.log(`  ✓ [year ${a.year}${trackTxt}]  ${a.email}  →  user #${id}`);
    }
    console.log(`\n✅ All 6 ready. Password for every account:  ${PASSWORD}`);
    console.log("   Log in with the email (above) + that password.\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message);
    console.error("   (Make sure MySQL is running and the server has booted once so the schema exists.)\n");
    process.exit(1);
  }
})();
