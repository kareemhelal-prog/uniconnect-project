/**
 * UniConnect — Database Seed Script
 * Wipes all users + related data, then creates fresh accounts.
 * Run from server/: node seed.js
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const mysql  = require("mysql2/promise");

const SALT_ROUNDS = 10;

// ── Avatar generator ─────────────────────────────────────────────
// Produces a base64 SVG data-URL so every user has a profile picture
// stored in the DB from day one — no upload required.
const AVATAR_COLORS = [
  "#6c47ff", "#00b4d8", "#0077b6", "#e63946",
  "#2a9d8f", "#e76f51", "#457b9d", "#a855f7",
  "#22c55e", "#f59e0b", "#ec4899", "#14b8a6",
];

let _colorIdx = 0;
function nextColor() {
  return AVATAR_COLORS[_colorIdx++ % AVATAR_COLORS.length];
}

function makeAvatar(name, color) {
  const parts    = name.trim().split(/\s+/);
  const initials = (
    parts.length >= 2
      ? parts[0][0] + parts[1][0]
      : parts[0].slice(0, 2)
  ).toUpperCase();

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">`,
    `<circle cx="60" cy="60" r="60" fill="${color}"/>`,
    `<text x="60" y="60" dy=".36em" text-anchor="middle" `,
    `font-family="Arial,sans-serif" font-size="44" font-weight="700" fill="#ffffff">`,
    initials,
    `</text></svg>`,
  ].join("");

  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

const DB_CONFIG = {
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "uniconnect",
  port:     Number(process.env.DB_PORT) || 3306,
  charset:  "utf8mb4",
};

// ── Data ────────────────────────────────────────────────────────

const ADMIN = {
  name:     "Admin UniConnect",
  username: "admin",
  email:    "admin@uniconnect.edu",
  password: "admin123",
  role:     "admin",
};

const DOCTORS = [
  { name: "Dr. Osama Al-Nahhas",    username: "dr_osama",        email: "dr.osama@uniconnect.edu"        },
  { name: "Dr. Ashraf Abd El-Aziz", username: "dr_ashraf",       email: "dr.ashraf@uniconnect.edu"       },
  { name: "Eng. Ahmed Sultan",      username: "eng_ahmed_sultan", email: "eng.ahmed.sultan@uniconnect.edu" },
  { name: "Eng. Mariam Hossam",     username: "eng_mariam",      email: "eng.mariam@uniconnect.edu"      },
];

const DOCTOR_PASSWORD = "doctor123";

const WELCOME_POST =
  "Welcome to the new academic year! Congratulations on your success and achievements last year. Wishing you all the best in your studies this year 🎓✨";

const STUDENTS = [
  { name: "Kareem Mosaad Farag",    id: "2420928" },
  { name: "Kareem Mohamed Abdo",    id: "2420924" },
  { name: "Mohamed Gaber Mohamed",  id: "2420994" },
  { name: "Mohamed Ahmed Saeed",    id: "2420963" },
  { name: "Mohamed Ragab Helal",    id: "2421022" },
  { name: "Kyrillos Ishaq Ibrahim", id: "2420934" },
  { name: "Ahmed Ayman Omar",       id: "2420020" },
  { name: "Salem Mohamed Saleh",    id: "2420529" },
  { name: "Alaa Samir Mutawea",     id: "2420263" },
  { name: "Alaa Mohamed Fawzy",     id: "2420139" },
  { name: "Nour Mohamed Hassan",    id: "2421348" },
];

const STUDENT_FACULTY = "Industrial Engineering & Energy";

// ── Helpers ──────────────────────────────────────────────────────

async function hash(pw) {
  return bcrypt.hash(pw, SALT_ROUNDS);
}

async function insertUser(conn, { name, username, email, password, role }) {
  const hashed = await hash(password);
  const avatar = makeAvatar(name, nextColor());
  const [result] = await conn.query(
    "INSERT INTO Users (name, username, email, password, role, profile_picture) VALUES (?, ?, ?, ?, ?, ?)",
    [name, username, email, hashed, role, avatar]
  );
  return result.insertId;
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log("✅ Connected to MySQL\n");

  try {
    // ── Step 1: Wipe all users (cascades to posts, comments, likes, etc.) ──
    console.log("🗑  Wiping all existing data...");
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    await conn.query("DELETE FROM Notifications");
    await conn.query("DELETE FROM Likes");
    await conn.query("DELETE FROM Comments");
    await conn.query("DELETE FROM Posts");
    await conn.query("DELETE FROM Followers");
    await conn.query("DELETE FROM Profile_Studies");
    await conn.query("DELETE FROM Doctor_Profiles");
    await conn.query("DELETE FROM Investor_Profiles");
    await conn.query("DELETE FROM Users");
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("   Done.\n");

    // ── Step 2: Admin ──────────────────────────────────────────────────────
    console.log("👤 Creating admin account...");
    await insertUser(conn, { ...ADMIN });
    console.log(`   ✅ ${ADMIN.name} (admin@uniconnect.edu / admin123)\n`);

    // ── Step 3: Doctors ────────────────────────────────────────────────────
    console.log("🩺 Creating doctor/engineer accounts...");
    for (const doc of DOCTORS) {
      const userId = await insertUser(conn, { ...doc, password: DOCTOR_PASSWORD, role: "doctor" });
      await conn.query(
        "INSERT INTO Doctor_Profiles (user_id, faculty, specialization) VALUES (?, ?, ?)",
        [userId, STUDENT_FACULTY, "Lecturer"]
      );
      await conn.query(
        "INSERT INTO Posts (user_id, title, content) VALUES (?, ?, ?)",
        [userId, "Welcome Message", WELCOME_POST]
      );
      console.log(`   ✅ ${doc.name} (${doc.email} / ${DOCTOR_PASSWORD})`);
    }
    console.log();

    // ── Step 4: Students ───────────────────────────────────────────────────
    console.log("🎓 Creating student accounts...");
    for (const s of STUDENTS) {
      const email    = `${s.id}@uniconnect.edu`;
      const username = s.id;
      const userId   = await insertUser(conn, {
        name: s.name, username, email, password: s.id, role: "student",
      });
      await conn.query(
        "INSERT INTO Profile_Studies (user_id, faculty, major, academic_year) VALUES (?, ?, ?, ?)",
        [userId, STUDENT_FACULTY, STUDENT_FACULTY, "1"]
      );
      console.log(`   ✅ ${s.name.padEnd(26)} username: ${username}  password: ${s.id}`);
    }

    console.log("\n🎉 Seed complete!\n");

    // ── Summary ────────────────────────────────────────────────────────────
    const [[{ total }]] = await conn.query("SELECT COUNT(*) AS total FROM Users");
    const [[{ posts  }]] = await conn.query("SELECT COUNT(*) AS posts  FROM Posts");
    console.log(`   Total users : ${total}`);
    console.log(`   Total posts : ${posts}`);

  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
