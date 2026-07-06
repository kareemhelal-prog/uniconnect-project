/**
 * UniConnect — LIVELY DEMO DATA seeder
 * ---------------------------------------------------------------------------
 * Creates a small cast of realistic named accounts and ALL the content they
 * produce (posts, reactions, comments, follows, a study group with activity,
 * projects with a supervisor + investor interest, files, reviews, notifications)
 * so the site feels alive & interactive for a live demo.
 *
 *   Run (MySQL must be up):   cd server && node database/seedDemoData.js
 *
 * SAFE & ADDITIVE: it never truncates. It only manages its own demo cast
 * (emails @campus.demo) — on re-run it removes just those accounts (cascading
 * their content) and rebuilds, so your real data is never touched.
 * Every account's password:  Demo@2026
 * ---------------------------------------------------------------------------
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost", user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", database: process.env.DB_NAME || "uniconnect",
  port: process.env.DB_PORT || 3306, waitForConnections: true, connectionLimit: 5,
});

const PASS = "Demo@2026";
const DOMAIN = "@campus.demo";

// ── The cast ────────────────────────────────────────────────────────────────
const STUDENTS = [
  { key: "ahmed",   name: "Ahmed Hassan",    username: "ahmed_hassan", academic_id: "2200101", year: "3", track: "software" },
  { key: "sara",    name: "Sara Mahmoud",    username: "sara_mahmoud", academic_id: "2200102", year: "3", track: "software" },
  { key: "omar",    name: "Omar Khaled",     username: "omar_khaled",  academic_id: "2200103", year: "3", track: "networks" },
  { key: "nour",    name: "Nour Ali",        username: "nour_ali",     academic_id: "2100101", year: "4", track: "software" },
  { key: "youssef", name: "Youssef Ibrahim", username: "youssef_ib",   academic_id: "2100102", year: "4", track: "networks" },
  { key: "mariam",  name: "Mariam Adel",     username: "mariam_adel",  academic_id: "2300101", year: "2", track: null },
];
const DOCTORS = [
  { key: "kareem", name: "Dr. Kareem Fouad", username: "dr_kareem", specialization: "Software Engineering" },
  { key: "hala",   name: "Dr. Hala Mostafa", username: "dr_hala",   specialization: "Computer Networks" },
];
const INVESTORS = [
  { key: "tarek", name: "Tarek Nabil", username: "tarek_nabil", company: "Nile Ventures", field: "EdTech & AI" },
];

// ── Content (attributed to the cast by key) ─────────────────────────────────
// h = hours ago (spreads created_at so the feed looks organic & recent).
const POSTS = [
  { key: "kareem", h: 120, global: true, title: "Welcome!", content: "Welcome everyone to the new semester 🎓 My office hours are Sunday & Tuesday. Don't hesitate to ask about your graduation projects — I'm happy to supervise strong ideas." },
  { key: "ahmed",  h: 96,  title: "Data Structures resources", content: "جمّعت ملخّص كامل لمادة Data Structures فيه كل الـ topics بالأمثلة — رفعته في مكتبة الملفات. بالتوفيق للكل في الميدترم 💪" },
  { key: "sara",   h: 90,  content: "أي حد جرّب الـ Dijkstra visualization tools؟ محتاجة أفهم الـ shortest path أحسن قبل الامتحان." },
  { key: "omar",   h: 80,  content: "Just finished setting up a small home lab with 3 routers for the CCNA labs. Networking hits different when you actually cable it yourself 🔌" },
  { key: "nour",   h: 60,  title: "Graduation project", content: "بدأنا فعليًا في مشروع التخرّج بتاعنا — Smart Campus Navigator. لو حد مهتم يشارك أو عنده خبرة في الـ IoT يكلّمني!" },
  { key: "mariam", h: 48,  content: "First year is intense but I'm loving the programming course so far. Any tips for staying consistent with practice? 🙌" },
  { key: "ahmed",  h: 36,  content: "Reminder: our study group session for Algorithms is tomorrow 7 PM. We'll cover Dynamic Programming — bring your questions!" },
  { key: "hala",   h: 30,  global: true, content: "For my Networks students: the lab report deadline is extended by 3 days. Quality over rushing 👍" },
  { key: "youssef",h: 24,  content: "شغّال على تطبيق بيراقب استهلاك الشبكة real-time. الـ Socket.io بيخلّي الموضوع سلس جدًا. حد عمل حاجة شبه كده قبل كده؟" },
  { key: "sara",   h: 18,  content: "That moment when your code finally compiles after 2 hours of debugging 😅 worth it every time." },
  { key: "nour",   h: 10,  title: "Looking for investors", content: "مشروعنا اتعمله مراجعة واعتمده الدكتور، ودلوقتي متاح للمستثمرين على المنصّة. متحمّسين جدًا للخطوة دي 🚀" },
  { key: "omar",   h: 6,   content: "Anyone else think the campus wifi deserves its own subnet just for the complaints? 😂 #NetworksHumor" },
  { key: "ahmed",  h: 3,   content: "Small win: refactored our project's backend and cut the main query time in half by adding the right indexes. Details matter." },
  { key: "mariam", h: 1,   content: "Joined my first study group today and honestly the flashcards feature is a game changer for revision 📚" },
];

// reactions: [postIndex, reactorKey, reaction]
const REACTIONS = [
  [0,"ahmed","like"],[0,"sara","love"],[0,"nour","like"],[0,"mariam","love"],[0,"omar","like"],
  [1,"sara","love"],[1,"omar","like"],[1,"nour","like"],[1,"mariam","wow"],
  [2,"ahmed","like"],[2,"nour","like"],
  [3,"youssef","love"],[3,"ahmed","wow"],[3,"nour","like"],
  [4,"ahmed","love"],[4,"sara","like"],[4,"kareem","like"],[4,"tarek","wow"],
  [5,"sara","love"],[5,"nour","like"],
  [6,"sara","like"],[6,"omar","like"],[6,"mariam","love"],
  [8,"omar","wow"],[8,"ahmed","like"],
  [9,"ahmed","haha"],[9,"nour","haha"],[9,"mariam","love"],
  [10,"kareem","love"],[10,"tarek","love"],[10,"ahmed","like"],[10,"sara","like"],
  [11,"youssef","haha"],[11,"ahmed","haha"],
  [12,"kareem","like"],[12,"nour","love"],
  [13,"sara","love"],[13,"ahmed","like"],
];

// comments: [postIndex, authorKey, text, replyToAuthorKey?]  (reply threads under same post)
const COMMENTS = [
  [1,"sara","جزاك الله خير يا أحمد، الملخّص فعلًا منظّم جدًا 🙏"],
  [1,"nour","بوكمارك عليه على طول!"],
  [1,"ahmed","العفو يا شباب، أي feedback ابعتوهولي 👌","sara"],
  [4,"ahmed","فكرة جامدة! أنا شغّال على حاجة قريبة، تعالى نتكلم."],
  [4,"tarek","Impressive direction — feel free to reach out once it's on the marketplace."],
  [2,"omar","جرّبي VisuAlgo، شرحها ممتاز للـ graphs."],
  [2,"sara","تمام هجرّبها، شكرًا يا عمر!","omar"],
  [6,"mariam","هكون موجودة! 🙋"],
  [8,"omar","الـ real-time monitoring ده بالظبط اللي محتاجينه في الـ labs."],
  [10,"kareem","مبروك يا نور، مشروع قوي فعلًا ويستاهل."],
  [12,"nour","Clean work 👏 الـ indexes بتفرق جدًا في الأداء."],
];

// follows: [followerKey, followingKey]
const FOLLOWS = [
  ["ahmed","kareem"],["sara","kareem"],["nour","kareem"],["omar","hala"],["youssef","hala"],
  ["sara","ahmed"],["nour","ahmed"],["mariam","ahmed"],["omar","ahmed"],
  ["ahmed","sara"],["ahmed","nour"],["sara","nour"],["mariam","sara"],
  ["nour","tarek"],["ahmed","omar"],["kareem","ahmed"],["kareem","nour"],["hala","omar"],
];

async function main() {
  const conn = await pool.getConnection();
  try {
    console.log("\n🌱 Seeding lively demo data (additive, safe)...\n");
    await conn.beginTransaction();
    const hash = await bcrypt.hash(PASS, 10);

    // ── Idempotency: remove ONLY our own demo cast (cascades their content) ──
    await conn.query(`DELETE FROM Users WHERE email LIKE '%${DOMAIN}'`);

    const id = {}; // key → user id

    async function makeUser(c, role) {
      const [r] = await conn.query(
        `INSERT INTO Users (name, email, password, username, role, account_status, is_onboarded)
         VALUES (?, ?, ?, ?, ?, 'approved', 1)`,
        [c.name, `${c.key}${DOMAIN}`, hash, c.username, role]);
      id[c.key] = r.insertId;
      return r.insertId;
    }

    for (const s of STUDENTS) {
      await makeUser(s, "student");
      await conn.query(
        `INSERT INTO Profile_Studies (user_id, faculty, major, academic_year, track, academic_id)
         VALUES (?, 'Faculty of Engineering', ?, ?, ?, ?)`,
        [id[s.key], s.track || "General", s.year, s.track, s.academic_id]);
    }
    for (const d of DOCTORS) {
      await makeUser(d, "doctor");
      await conn.query(`INSERT INTO Doctor_Profiles (user_id, faculty, specialization) VALUES (?, 'Faculty of Engineering', ?)`,
        [id[d.key], d.specialization]);
    }
    for (const iv of INVESTORS) {
      await makeUser(iv, "investor");
      await conn.query(`INSERT INTO Investor_Profiles (user_id, company_name, investment_field, verified) VALUES (?, ?, ?, 1)`,
        [id[iv.key], iv.company, iv.field]);
    }
    console.log(`  ✓ ${Object.keys(id).length} cast accounts`);

    // cohort lookup for post tagging
    const cohortOf = {};
    for (const s of STUDENTS) cohortOf[s.key] = { year: s.year, track: s.track };

    // ── Posts ──
    const postIds = [];
    for (const p of POSTS) {
      const c = p.global ? { year: null, track: null } : (cohortOf[p.key] || { year: null, track: null });
      const [r] = await conn.query(
        `INSERT INTO Posts (user_id, title, content, post_type, academic_year, track, created_at)
         VALUES (?, ?, ?, 'general', ?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
        [id[p.key], p.title || null, p.content, c.year, c.track, p.h]);
      postIds.push(r.insertId);
    }
    console.log(`  ✓ ${postIds.length} posts`);

    // ── Reactions ──
    let rc = 0;
    for (const [pi, key, reaction] of REACTIONS) {
      await conn.query(`INSERT IGNORE INTO Likes (user_id, post_id, reaction) VALUES (?, ?, ?)`,
        [id[key], postIds[pi], reaction]); rc++;
    }
    console.log(`  ✓ ${rc} reactions`);

    // ── Comments (+ replies) ──
    let cc = 0;
    const lastCommentByPostAuthor = {}; // `${pi}:${authorKey}` → comment id (for replies)
    for (const [pi, key, text, replyTo] of COMMENTS) {
      let parent = null;
      if (replyTo) parent = lastCommentByPostAuthor[`${pi}:${replyTo}`] || null;
      const [r] = await conn.query(
        `INSERT INTO Comments (user_id, post_id, content, parent_id) VALUES (?, ?, ?, ?)`,
        [id[key], postIds[pi], text, parent]);
      lastCommentByPostAuthor[`${pi}:${key}`] = r.insertId; cc++;
    }
    console.log(`  ✓ ${cc} comments`);

    // ── Follows ──
    let fc = 0;
    for (const [a, b] of FOLLOWS) {
      await conn.query(`INSERT IGNORE INTO Followers (follower_id, following_id) VALUES (?, ?)`, [id[a], id[b]]); fc++;
    }
    console.log(`  ✓ ${fc} follows`);

    // ── Study group with activity ──
    const [g] = await conn.query(
      `INSERT INTO \`Groups\` (creator_id, name, description, is_private, status, academic_year, track)
       VALUES (?, ?, ?, 0, 'approved', '3', 'software')`,
      [id.ahmed, "DS & Algorithms — Study Squad", "فريق مذاكرة Data Structures و Algorithms لطلبة تالتة Software. ملخّصات، أسئلة، وجلسات مذاكرة أسبوعية."]);
    const gid = g.insertId;
    await conn.query(`INSERT INTO group_audience (group_id, academic_year, track) VALUES (?, '3', 'software')`, [gid]);
    const groupMembers = [["ahmed","admin"],["sara","member"],["nour","member"],["mariam","member"],["omar","member"]];
    for (const [k, role] of groupMembers)
      await conn.query(`INSERT INTO Group_Members (group_id, user_id, role) VALUES (?, ?, ?)`, [gid, id[k], role]);
    await conn.query(`INSERT INTO Group_Posts (group_id, user_id, content, post_type, is_pinned) VALUES (?, ?, ?, 'announcement', 1)`,
      [gid, id.ahmed, "📌 جلسة المذاكرة الأسبوعية كل يوم أربع 7 مساءً. الأسبوع ده Dynamic Programming."]);
    await conn.query(`INSERT INTO Group_Posts (group_id, user_id, content, post_type) VALUES (?, ?, ?, 'post')`,
      [gid, id.sara, "رفعت مسائل تدريب على الـ recursion في قسم الملفات 👇"]);
    // Q&A
    const [q] = await conn.query(`INSERT INTO group_questions (group_id, asker_id, title, body) VALUES (?, ?, ?, ?)`,
      [gid, id.mariam, "الفرق بين الـ Stack والـ Queue في الاستخدام؟", "فاهمة التعريف بس مش عارفة كل واحدة بتُستخدم إمتى عمليًا."]);
    const [a1] = await conn.query(`INSERT INTO group_answers (question_id, user_id, content, is_best) VALUES (?, ?, ?, 1)`,
      [q.insertId, id.ahmed, "الـ Stack (LIFO) للـ undo/back و function calls؛ الـ Queue (FIFO) للـ scheduling والطوابير. جرّبي تتخيلي طابور مخبز 🥖"]);
    await conn.query(`INSERT INTO group_answers (question_id, user_id, content) VALUES (?, ?, ?)`,
      [q.insertId, id.nour, "وكمان الـ Queue أساسي في الـ BFS على الـ graphs 👌"]);
    // Poll
    const [poll] = await conn.query(`INSERT INTO group_polls (group_id, question, created_by) VALUES (?, ?, ?)`,
      [gid, "أنسب ميعاد لجلسة المراجعة قبل الامتحان؟", id.ahmed]);
    const [o1] = await conn.query(`INSERT INTO group_poll_options (poll_id, text) VALUES (?, 'الجمعة صباحًا')`, [poll.insertId]);
    const [o2] = await conn.query(`INSERT INTO group_poll_options (poll_id, text) VALUES (?, 'السبت مساءً')`, [poll.insertId]);
    const votes = [["sara",o2.insertId],["nour",o2.insertId],["mariam",o1.insertId],["omar",o2.insertId]];
    for (const [k, opt] of votes)
      await conn.query(`INSERT INTO group_poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)`, [poll.insertId, opt, id[k]]);
    // leaderboard points
    for (const [k, pts] of [["ahmed",12],["sara",8],["nour",6],["mariam",3],["omar",2]])
      await conn.query(`INSERT INTO group_points (group_id, user_id, points) VALUES (?, ?, ?)`, [gid, id[k], pts]);
    console.log("  ✓ 1 study group (members, posts, Q&A, poll, leaderboard)");

    // ── Files (library + group + project) ──
    async function file(uploaderKey, name, type, size, subject, desc, extra = {}) {
      const [r] = await conn.query(
        `INSERT INTO Files (uploader_id, file_name, file_url, file_type, file_size, subject, description, academic_year, track, group_id, project_id, download_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id[uploaderKey], name, "/uploads/files/demo-" + name.replace(/\W+/g, "_") + ".pdf", type, size,
         subject, desc, extra.year || null, extra.track || null, extra.group || null, extra.project || null, extra.dl || 0]);
      return r.insertId;
    }
    const f1 = await file("ahmed", "Data Structures — Full Summary.pdf", "pdf", 1840000, "Data Structures", "ملخّص شامل لكل الـ topics بالأمثلة والرسوم.", { year: "3", track: "software", dl: 42 });
    const f2 = await file("sara", "Recursion Practice Set.pdf", "pdf", 620000, "Algorithms", "مسائل تدريب على الـ recursion مع الحلول.", { group: gid, dl: 15 });
    await file("omar", "CCNA Lab Notes.pdf", "pdf", 2200000, "Computer Networks", "ملاحظات معملية لإعداد الراوترات.", { year: "3", track: "networks", dl: 28 });
    await file("nour", "IoT Sensors Cheat Sheet.pdf", "pdf", 480000, "IoT", "مرجع سريع لأشهر الـ sensors.", { year: "4", track: "software", dl: 9 });
    // ratings / likes / comments on the popular file
    for (const [k, rt] of [["sara",5],["nour",5],["omar",4],["mariam",5]])
      await conn.query(`INSERT IGNORE INTO File_Ratings (file_id, user_id, rating) VALUES (?, ?, ?)`, [f1, id[k], rt]);
    for (const k of ["sara","nour","omar","mariam","youssef"])
      await conn.query(`INSERT IGNORE INTO File_Likes (file_id, user_id) VALUES (?, ?)`, [f1, id[k]]);
    await conn.query(`INSERT INTO File_Comments (file_id, user_id, content) VALUES (?, ?, ?)`, [f1, id.nour, "أنقذني قبل الميدترم 🙏"]);
    console.log("  ✓ 4 files (+ ratings, likes, comments)");

    // ── Projects (student → supervisor → investor) ──
    const [proj] = await conn.query(
      `INSERT INTO Projects (creator_id, title, description, category, status, required_funding,
        github_link, project_type, supervisor_id, approval_status, open_to_investors, academic_year, track, looking_for)
       VALUES (?, ?, ?, 'IT', 'mvp', 8000, ?, 'IoT', ?, 'approved', 1, '4', 'software', ?)`,
      [id.nour, "Smart Campus Navigator",
       "نظام إرشاد داخلي للحرم الجامعي باستخدام BLE beacons وتطبيق موبايل — بيساعد الطلبة يوصلوا للقاعات والمعامل بسهولة. مبني بـ React Native و Node.js.",
       "https://github.com/demo/smart-campus", id.kareem, "Seeking a hardware partner + seed funding"]);
    const pid = proj.insertId;
    await conn.query(`INSERT INTO Project_Members (project_id, user_id) VALUES (?, ?), (?, ?)`, [pid, id.nour, pid, id.youssef]);
    await conn.query(`INSERT INTO project_endorsements (project_id, doctor_id, note, rating) VALUES (?, ?, ?, 5)`,
      [pid, id.kareem, "فريق منظّم وفكرة قابلة للتطبيق فعليًا داخل الجامعة. أرشّحه بقوة."]);
    await conn.query(`INSERT INTO Project_Interests (project_id, investor_id, note) VALUES (?, ?, ?)`,
      [pid, id.tarek, "Strong team and a real problem. Keen to discuss a seed round."]);
    await conn.query(`INSERT INTO project_offers (project_id, investor_id, amount, message, status) VALUES (?, ?, 6000, ?, 'pending')`,
      [pid, id.tarek, "Initial offer to get the pilot running across two buildings."]);
    await conn.query(`INSERT INTO project_questions (project_id, asker_id, question, answer, answered_at) VALUES (?, ?, ?, ?, NOW())`,
      [pid, id.tarek, "What's your accuracy on indoor positioning so far?", "Around 2–3 meters with BLE trilateration; improving with more beacons."]);
    await conn.query(`INSERT INTO project_updates (project_id, content) VALUES (?, ?)`,
      [pid, "Milestone: pilot deployed in the Engineering building 🎉 positioning accuracy improved to ~2m."]);
    // a second, earlier-stage project
    await conn.query(
      `INSERT INTO Projects (creator_id, title, description, category, status, required_funding, project_type,
        supervisor_id, approval_status, open_to_investors, academic_year, track)
       VALUES (?, ?, ?, 'IT', 'prototype', 5000, 'AI', ?, 'pending', 0, '3', 'software')`,
      [id.ahmed, "StudyPlan AI", "مخطّط مذاكرة ذكي بيرتّب جدولك حسب الامتحانات وصعوبة المواد. قيد مراجعة الدكتور.", id.kareem]);
    console.log("  ✓ 2 projects (supervision, endorsement, investor interest + offer)");

    // ── Academic reviews (students rate doctors) ──
    const reviews = [
      ["ahmed","kareem",5,"أفضل دكتور تعاملت معاه — شرحه واضح ومتعاون جدًا مع المشاريع.",0],
      ["nour","kareem",5,"دعمه لمشروعنا كان فارق حقيقي. متاح دايمًا للأسئلة.",0],
      ["sara","kareem",4,"محاضرات منظّمة، بس المستوى عالي ومحتاج مذاكرة مستمرة.",1],
      ["omar","hala",5,"معامل الشبكات معاها ممتعة وعملية جدًا.",0],
    ];
    for (const [sk, dk, rt, cm, anon] of reviews)
      await conn.query(`INSERT IGNORE INTO academic_reviews (doctor_id, student_id, rating, comment, is_anonymous) VALUES (?, ?, ?, ?, ?)`,
        [id[dk], id[sk], rt, cm, anon]);
    console.log("  ✓ 4 academic reviews");

    // ── A few notifications so bells show activity ──
    const notifs = [
      ["kareem","nour","project", pid, "asked you to supervise their project \"Smart Campus Navigator\"", 0, 70],
      ["nour","kareem","project", pid, "approved your project and published it to investors", 0, 12],
      ["nour","tarek","project", pid, "is interested in your project \"Smart Campus Navigator\"", 0, 8],
      ["ahmed","sara","like", null, "reacted to your post", 1, 40],
      ["ahmed","nour","follow", null, "started following you", 0, 30],
      ["sara","ahmed","comment", null, "replied to your comment", 0, 20],
      ["kareem","ahmed","review", null, "left you a new review", 0, 5],
    ];
    for (const [uk, sk, type, ref, msg, read, h] of notifs)
      await conn.query(
        `INSERT INTO Notifications (user_id, sender_id, type, reference_id, message, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
        [id[uk], id[sk], type, ref, msg, read, h]);
    console.log("  ✓ 7 notifications");

    await conn.commit();
    console.log("\n✅ Done! The site now has a lively, interactive demo dataset.");
    console.log(`   Cast login — password for all:  ${PASS}`);
    console.log("   ahmed@campus.demo · sara@campus.demo · omar@campus.demo · nour@campus.demo");
    console.log("   youssef@campus.demo · mariam@campus.demo · kareem@campus.demo (doctor)");
    console.log("   hala@campus.demo (doctor) · tarek@campus.demo (investor)\n");
    process.exit(0);
  } catch (e) {
    console.error("\n❌ Seed failed:", e.code || "", e.sqlMessage || e.message);
    if (e.sql) console.error("   SQL:", e.sql.slice(0, 200));
    try { await conn.rollback(); console.error("   (rolled back — nothing changed)"); } catch { /* conn gone */ }
    process.exit(1);
  } finally {
    conn.release();
  }
}
main();
