/**
 * UniConnect — FULL-SITE ACTIVITY seeder
 * ---------------------------------------------------------------------------
 * Makes every corner of the live demo feel alive, for EVERY account currently
 * in the database (real accounts + previously-seeded demo accounts alike):
 *
 *   - Any account with zero posts gets exactly one (role/cohort-appropriate).
 *   - Every post gets cross-reactions from every other account, and at least
 *     2 comments.
 *   - Every student follows every doctor (and gets notified).
 *   - More course materials across different cohorts, cross-rated/liked.
 *   - Two new projects (real student accounts) with real-doctor supervision
 *     and real-investor interest/offers.
 *   - Every doctor ends up with at least one academic review.
 *   - A second study group covering years 1 & 2 (the first only covered
 *     3rd-year software) with its own posts/Q&A/file.
 *
 *   Run (MySQL must be up):   cd server && node database/seedFullActivity.js
 *
 * 100% ADDITIVE AND SAFE TO RE-RUN — it never truncates or deletes anything,
 * including real accounts. Every step checks what already exists first, so
 * running it twice does not create duplicates (reactions/follows/reviews use
 * the table's own UNIQUE constraints + INSERT IGNORE; posts/files/projects/
 * groups are skipped if a matching one already exists).
 * ---------------------------------------------------------------------------
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost", user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", database: process.env.DB_NAME || "uniconnect",
  port: process.env.DB_PORT || 3306, waitForConnections: true, connectionLimit: 5,
});

const REACTIONS = ["like", "love", "haha", "wow"];
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

const COMMENT_TEMPLATES = [
  "Totally agree with this!",
  "كلام في الصميم 👌",
  "Thanks for sharing this.",
  "دي فعلا نقطة مهمة.",
  "Great point, learned something new.",
  "حلو أوي، تسلم.",
  "This is really helpful, thank you!",
  "متابع باهتمام، كمّل كده.",
];

function postContentFor(u) {
  if (u.role === "admin") {
    return "Welcome to everyone using UniConnect this semester! We're always working on improving the platform based on your feedback — feel free to reach out through Settings if you run into anything.";
  }
  if (u.role === "investor") {
    return "Excited to be part of the UniConnect investor community. Always on the lookout for strong student-led projects — especially in software and applied engineering. Feel free to publish and I'll take a look!";
  }
  // student, cohort-flavoured
  const y = u.academic_year, t = u.track;
  if (y === "1") return "أول ترم في الجامعة وحاسس إن كل حاجة جديدة ومختلفة! متحمس أتعرف على زمايلي وأبدأ أذاكر صح من الأول.";
  if (y === "2") return "بدأت أستقر أكتر في الكلية دلوقتي. مذاكرة المواد دي محتاجة تنظيم جدول صح — أي حد عنده نصيحة يا ريت يشاركها.";
  if (y === "3" && t === "software") return "Deep in the Software track now — data structures and OOP are finally starting to click. Working on a few side projects to put the theory into practice.";
  if (y === "3" && t === "networks") return "Networking track is intense but really satisfying once the labs start working end-to-end. Building a small home lab to practice routing and subnetting.";
  if (y === "4" && t === "software") return "Final year, software track — juggling the graduation project with job applications. It's a lot, but seeing everything come together is worth it.";
  if (y === "4" && t === "networks") return "Last year in the Networks track. Spending most of my time on my graduation project and prepping for certifications on the side.";
  return "Glad to be part of the UniConnect community — looking forward to a great semester!";
}

async function ensurePostForEveryone(conn, users) {
  const [counts] = await conn.query("SELECT user_id, COUNT(*) c FROM Posts GROUP BY user_id");
  const hasPost = new Set(counts.map((r) => r.user_id));
  const newPosts = []; // { id, user_id }
  for (const u of users) {
    if (hasPost.has(u.id)) continue;
    const year = u.role === "student" ? u.academic_year : null;
    const track = u.role === "student" ? u.track : null;
    const [r] = await conn.query(
      "INSERT INTO Posts (user_id, content, post_type, academic_year, track) VALUES (?, ?, 'general', ?, ?)",
      [u.id, postContentFor(u), year, track]
    );
    newPosts.push({ id: r.insertId, user_id: u.id });
  }
  console.log(`  + ${newPosts.length} new post(s) for previously-silent accounts`);
  return newPosts;
}

async function crossReactAndComment(conn, users, newPostIds) {
  const [allPosts] = await conn.query("SELECT id, user_id FROM Posts");
  const newSet = new Set(newPostIds);

  // Every account reacts to every post that isn't theirs.
  let reactionRows = [];
  for (const p of allPosts) {
    for (const u of users) {
      if (u.id === p.user_id) continue;
      reactionRows.push([u.id, p.id, REACTIONS[(p.id + u.id) % REACTIONS.length]]);
    }
  }
  let inserted = 0;
  for (const part of chunk(reactionRows, 400)) {
    const [r] = await conn.query("INSERT IGNORE INTO Likes (user_id, post_id, reaction) VALUES ?", [part]);
    inserted += r.affectedRows;
  }
  console.log(`  + ${inserted} new reaction(s) across ${allPosts.length} post(s)`);

  // One "someone reacted" notification per brand-new post only (fresh + safe to re-run).
  const notifRows = [];
  for (const p of allPosts) {
    if (!newSet.has(p.id)) continue;
    const reactor = users.find((u) => u.id !== p.user_id);
    if (reactor) notifRows.push([p.user_id, reactor.id, "like", p.id, "reacted to your post"]);
  }
  if (notifRows.length) await conn.query("INSERT INTO Notifications (user_id, sender_id, type, reference_id, message) VALUES ?", [notifRows]);

  // Ensure every post has at least 2 comments.
  const [ccRows] = await conn.query("SELECT post_id, COUNT(*) c FROM Comments GROUP BY post_id");
  const ccMap = Object.fromEntries(ccRows.map((r) => [r.post_id, r.c]));
  let addedComments = 0;
  for (const p of allPosts) {
    const have = ccMap[p.id] || 0;
    for (let i = have; i < 2; i++) {
      const commenter = users[(p.id + i * 7) % users.length].id === p.user_id
        ? users[(p.id + i * 7 + 1) % users.length] : users[(p.id + i * 7) % users.length];
      const text = COMMENT_TEMPLATES[(p.id + i) % COMMENT_TEMPLATES.length];
      const [r] = await conn.query("INSERT INTO Comments (user_id, post_id, content) VALUES (?, ?, ?)", [commenter.id, p.id, text]);
      addedComments++;
      if (newSet.has(p.id)) {
        await conn.query(
          "INSERT INTO Notifications (user_id, sender_id, type, reference_id, message, reference_comment_id) VALUES (?, ?, 'comment', ?, ?, ?)",
          [p.user_id, commenter.id, p.id, "commented on your post", r.insertId]
        );
      }
    }
  }
  console.log(`  + ${addedComments} new comment(s) (topping every post up to 2)`);
}

async function everyoneFollowsDoctors(conn, students, doctors) {
  const [existing] = await conn.query("SELECT follower_id, following_id FROM Followers");
  const have = new Set(existing.map((r) => `${r.follower_id}:${r.following_id}`));
  const rows = [], notifRows = [];
  for (const s of students) {
    for (const d of doctors) {
      const key = `${s.id}:${d.id}`;
      if (have.has(key)) continue;
      rows.push([s.id, d.id]);
      notifRows.push([d.id, s.id, "follow", "started following you"]);
    }
  }
  if (rows.length) await conn.query("INSERT INTO Followers (follower_id, following_id) VALUES ?", [rows]);
  if (notifRows.length) await conn.query("INSERT INTO Notifications (user_id, sender_id, type, message) VALUES ?", [notifRows]);
  console.log(`  + ${rows.length} new follow(s) — every student now follows every doctor`);
}

async function courseFor(conn, year, track) {
  const [[row]] = await conn.query(
    "SELECT id FROM Courses WHERE academic_year = ? AND (track = ? OR (? IS NULL AND track IS NULL)) LIMIT 1",
    [year, track, track]
  );
  return row ? row.id : null;
}

async function fileExists(conn, uploaderId, name) {
  const [[row]] = await conn.query("SELECT id FROM Files WHERE uploader_id = ? AND file_name = ? LIMIT 1", [uploaderId, name]);
  return row ? row.id : null;
}

async function addMaterials(conn, byUsername) {
  const specs = [
    { u: "year1_demo", name: "Intro to Programming — Study Notes.pdf", subject: "Programming Basics", year: "1", track: null },
    { u: "2420555", name: "Database Fundamentals Summary.pdf", subject: "DBMS", year: "2", track: null },
    { u: "year3sw_demo", name: "OOP Design Patterns Cheatsheet.pdf", subject: "Software Engineering", year: "3", track: "software" },
    { u: "year3net_demo", name: "Subnetting Practice Problems.pdf", subject: "Computer Networks", year: "3", track: "networks" },
    { u: "year4sw_demo", name: "Cloud Deployment Guide.pdf", subject: "Cloud Computing", year: "4", track: "software" },
    { u: "year4net_demo", name: "Network Security Audit Checklist.pdf", subject: "Cybersecurity", year: "4", track: "networks" },
    { u: "2420529", name: "Exam Revision Summary.pdf", subject: "General", year: null, track: null },
  ];
  const newFileIds = [];
  for (const s of specs) {
    const uploaderId = byUsername[s.u]?.id; if (!uploaderId) continue;
    if (await fileExists(conn, uploaderId, s.name)) continue;
    const courseId = s.year ? await courseFor(conn, s.year, s.track) : null;
    const [r] = await conn.query(
      `INSERT INTO Files (uploader_id, file_name, file_url, file_type, file_size, subject, description, academic_year, track, course_id)
       VALUES (?, ?, ?, 'pdf', 900000, ?, ?, ?, ?, ?)`,
      [uploaderId, s.name, "/uploads/files/demo-" + s.name.replace(/\W+/g, "_"), s.subject,
       `Shared study material for ${s.subject}.`, s.year, s.track, courseId]
    );
    newFileIds.push(r.insertId);
  }
  console.log(`  + ${newFileIds.length} new material(s) uploaded across cohorts`);

  // Cross-rate/like every file (existing + new) from every student, skipping the uploader.
  const [allFiles] = await conn.query("SELECT id, uploader_id FROM Files");
  const students = Object.values(byUsername).filter((u) => u.role === "student");
  let likeRows = [], rateRows = [];
  for (const f of allFiles) {
    for (const s of students) {
      if (s.id === f.uploader_id) continue;
      likeRows.push([f.id, s.id]);
      rateRows.push([f.id, s.id, 3 + ((f.id + s.id) % 3)]); // rating 3..5
    }
  }
  let likeCount = 0, rateCount = 0;
  for (const part of chunk(likeRows, 400)) { const [r] = await conn.query("INSERT IGNORE INTO File_Likes (file_id, user_id) VALUES ?", [part]); likeCount += r.affectedRows; }
  for (const part of chunk(rateRows, 400)) { const [r] = await conn.query("INSERT IGNORE INTO File_Ratings (file_id, user_id, rating) VALUES ?", [part]); rateCount += r.affectedRows; }
  console.log(`  + ${likeCount} file like(s), ${rateCount} file rating(s) across ${allFiles.length} file(s)`);
}

async function projectExists(conn, creatorId, title) {
  const [[row]] = await conn.query("SELECT id FROM Projects WHERE creator_id = ? AND title = ? LIMIT 1", [creatorId, title]);
  return row ? row.id : null;
}

async function addRealAccountProjects(conn, byUsername) {
  const salem = byUsername["2420529"], ahmedKam = byUsername["2420555"];
  const drOsama = byUsername["dr_osama"], drAshraf = byUsername["dr_ashraf"];
  const hassan = byUsername["hassan"], salemInvestor = byUsername["salem.salem.tech"];
  if (!salem || !drOsama) { console.log("  ! skipping real-account projects (accounts not found)"); return; }

  let pid1 = await projectExists(conn, salem.id, "Campus Lost & Found Tracker");
  if (!pid1) {
    const [r] = await conn.query(
      `INSERT INTO Projects (creator_id, title, description, category, status, required_funding, project_type,
        supervisor_id, approval_status, open_to_investors, academic_year, track, looking_for)
       VALUES (?, 'Campus Lost & Found Tracker', ?, 'IT', 'mvp', 3000, 'Web/Mobile App', ?, 'approved', 1, ?, ?, 'funding')`,
      [salem.id, "A simple web app where students can report and search for lost items on campus, with photo uploads and category filters.", drOsama.id, salem.academic_year || null, salem.track || null]
    );
    pid1 = r.insertId;
    await conn.query(`INSERT INTO project_endorsements (project_id, doctor_id, note, rating) VALUES (?, ?, 'Simple, well-scoped, and genuinely useful for the campus.', 4) ON DUPLICATE KEY UPDATE note=VALUES(note)`, [pid1, drOsama.id]);
    console.log(`  + project "Campus Lost & Found Tracker" (published, supervised by ${drOsama.username})`);
  }
  if (hassan) await conn.query("INSERT IGNORE INTO Project_Interests (project_id, investor_id, note) VALUES (?, ?, ?)", [pid1, hassan.id, "Nice small utility — could see this scaling to other campuses."]);
  if (salemInvestor) await conn.query(
    `INSERT INTO project_offers (project_id, investor_id, amount, message, status) VALUES (?, ?, 1500, ?, 'pending')
     ON DUPLICATE KEY UPDATE amount=VALUES(amount)`,
    [pid1, salemInvestor.id, "Happy to help fund the first pilot semester."]
  );

  if (ahmedKam && drAshraf) {
    let pid2 = await projectExists(conn, ahmedKam.id, "Study Group Finder");
    if (!pid2) {
      const [r] = await conn.query(
        `INSERT INTO Projects (creator_id, title, description, category, status, required_funding, project_type,
          supervisor_id, approval_status, open_to_investors, academic_year, track)
         VALUES (?, 'Study Group Finder', ?, 'IT', 'idea', 0, 'Web/Mobile App', ?, 'pending', 0, ?, ?)`,
        [ahmedKam.id, "A matching tool that connects students in the same course into small study groups automatically based on schedule and topic gaps.", drAshraf.id, ahmedKam.academic_year || null, ahmedKam.track || null]
      );
      pid2 = r.insertId;
      console.log(`  + project "Study Group Finder" (pending review by ${drAshraf.username} — good live-demo moment)`);
    }
  }
}

async function addAcademicReviews(conn, byUsername) {
  const pairs = [
    ["year1_demo", "dr_osama", 5, "Very approachable and explains things clearly, even for a first-year student."],
    ["year2_demo", "dr_ashraf", 4, "Solid course structure, workload is fair."],
    ["year3sw_demo", "eng_ahmed_sultan", 5, "Practical examples made a real difference in understanding the material."],
    ["year4sw_demo", "eng_mariam", 4, "Clear grading criteria and helpful office hours."],
  ];
  let added = 0;
  for (const [studentKey, doctorKey, rating, comment] of pairs) {
    const s = byUsername[studentKey], d = byUsername[doctorKey];
    if (!s || !d) continue;
    const [r] = await conn.query(
      "INSERT IGNORE INTO academic_reviews (doctor_id, student_id, rating, comment, is_anonymous) VALUES (?, ?, ?, ?, 0)",
      [d.id, s.id, rating, comment]
    );
    added += r.affectedRows;
  }
  console.log(`  + ${added} new academic review(s) — every doctor now has at least one`);
}

async function addSecondGroup(conn, byUsername) {
  const drOsama = byUsername["dr_osama"];
  if (!drOsama) return;
  const [[existing]] = await conn.query("SELECT id FROM `Groups` WHERE creator_id = ? AND name = ?", [drOsama.id, "First & Second Year Foundations"]);
  let gid = existing?.id;
  if (!gid) {
    const [g] = await conn.query(
      `INSERT INTO \`Groups\` (creator_id, name, description, is_private, status)
       VALUES (?, 'First & Second Year Foundations', ?, 0, 'approved')`,
      [drOsama.id, "A support space for 1st and 2nd year students — foundational course help, study tips, and Q&A with a supervising doctor."]
    );
    gid = g.insertId;
    await conn.query("INSERT INTO group_audience (group_id, academic_year, track) VALUES (?, '1', NULL), (?, '2', NULL)", [gid, gid]);
    await conn.query("INSERT INTO Group_Members (group_id, user_id, role) VALUES (?, ?, 'admin')", [gid, drOsama.id]);
    const members = ["year1_demo", "year2_demo", "2420555"];
    for (const key of members) {
      const u = byUsername[key]; if (!u) continue;
      await conn.query("INSERT IGNORE INTO Group_Members (group_id, user_id, role) VALUES (?, ?, 'member')", [gid, u.id]);
    }
    await conn.query("INSERT INTO Group_Posts (group_id, user_id, content, post_type, is_pinned) VALUES (?, ?, ?, 'announcement', 1)",
      [gid, drOsama.id, "Welcome! Ask any foundational-course question here — I check in a few times a week."]);
    const y1 = byUsername["year1_demo"], y2 = byUsername["year2_demo"];
    if (y1) await conn.query("INSERT INTO Group_Posts (group_id, user_id, content) VALUES (?, ?, ?)", [gid, y1.id, "أنهي أفضل طريقة أذاكر بيها المواد الأساسية دي؟"]);
    if (y2) {
      const [q] = await conn.query("INSERT INTO group_questions (group_id, asker_id, title, body) VALUES (?, ?, ?, ?)",
        [gid, y2.id, "Best way to prepare for the DBMS midterm?", "Feeling behind on normalization — any tips?"]);
      await conn.query("INSERT INTO group_answers (question_id, user_id, content, is_best) VALUES (?, ?, ?, 1)",
        [q.insertId, drOsama.id, "Start with 1NF→3NF on paper examples before the practice exam — it clicks faster that way."]);
    }
    console.log(`  + new group "First & Second Year Foundations" (years 1 & 2, with posts + Q&A)`);
  } else {
    console.log("  = second group already exists, skipped");
  }
}

(async () => {
  const conn = await pool.getConnection();
  try {
    console.log("\n🌱 Seeding full-site activity for every account...\n");
    await conn.beginTransaction();

    const [users] = await conn.query(
      `SELECT u.id, u.username, u.role, ps.academic_year, ps.track
       FROM Users u LEFT JOIN Profile_Studies ps ON ps.user_id = u.id`
    );
    const byUsername = Object.fromEntries(users.map((u) => [u.username, u]));
    const students = users.filter((u) => u.role === "student");
    const doctors = users.filter((u) => u.role === "doctor");

    const newPosts = await ensurePostForEveryone(conn, users);
    await crossReactAndComment(conn, users, newPosts.map((p) => p.id));
    await everyoneFollowsDoctors(conn, students, doctors);
    await addMaterials(conn, byUsername);
    await addRealAccountProjects(conn, byUsername);
    await addAcademicReviews(conn, byUsername);
    await addSecondGroup(conn, byUsername);

    await conn.commit();
    console.log("\n✅ Done — every account now has posts, reactions, comments, follows,");
    console.log("   materials, and (where relevant) projects and reviews.\n");
    process.exit(0);
  } catch (e) {
    console.error("\n❌ Seed failed:", e.code || "", e.sqlMessage || e.message);
    try { await conn.rollback(); console.error("   (rolled back — nothing changed)"); } catch { /* conn gone */ }
    process.exit(1);
  } finally {
    conn.release();
  }
})();
