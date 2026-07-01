// =====================================================================
// OFFICIAL CURRICULUM SEED
// =====================================================================
// Seeds every course of the IT program into the `Courses` table, tagged
// with its cohort (academic_year + track + semester). Runs on every boot
// and is fully idempotent: it conflicts on the UNIQUE `course_code` key,
// so re-running only refreshes the title/cohort and NEVER touches an
// already-assigned `doctor_id` (admin assignments are preserved).
//
// Cohort rules:
//   • Years 1 & 2 are shared — track = null.
//   • Years 3 & 4 split into two tracks: 'software' and 'networks'.
//   • Semester → Year:  Y1=1,2  Y2=3,4  Y3=5,6  Y4=7,8
//
// NOTE: the Network year-3 (semester 5) codes are printed ITN701–706 in
// the official sheet, which collide with the Network year-4 (semester 7)
// codes. They are normalized here to ITN501–506 so every code is unique.
// =====================================================================

// [ code, title, year, track, semester ]
const CURRICULUM = [
  // ── Year 1 · Semester 1 (shared) ──
  ["IT101", "Introduction to Cyber Security",   "1", null, 1],
  ["IT102", "IT Essentials",                    "1", null, 1],
  ["UNV101", "Technical English I",             "1", null, 1],
  ["FAC101", "Mathematics I",                   "1", null, 1],
  ["FAC102", "Physics",                         "1", null, 1],
  ["IT103", "Programming Essentials in Python", "1", null, 1],

  // ── Year 1 · Semester 2 (shared) ──
  ["IT201", "Programming Essentials in C",      "1", null, 2],
  ["IT202", "Cyber Security Essentials",        "1", null, 2],
  ["IT203", "Introduction to IoT (Connecting Things)", "1", null, 2],
  ["IT204", "Microsoft Office",                 "1", null, 2],
  ["UNV201", "Technical English II",            "1", null, 2],
  ["FAC201", "Mathematics II",                  "1", null, 2],

  // ── Year 2 · Semester 3 (shared) ──
  ["IT301", "Linux Essentials",                 "2", null, 3],
  ["IT302", "Programming Essentials in C++",    "2", null, 3],
  ["IT303", "Web Programming I",                "2", null, 3],
  ["IT304", "Introduction to Databases",        "2", null, 3],
  ["IT305", "Digital Engineering",              "2", null, 3],
  ["IT306", "Operating Systems",                "2", null, 3],

  // ── Year 2 · Semester 4 (shared) ──
  ["IT401", "Java Programming I",               "2", null, 4],
  ["IT402", "Web Programming II",               "2", null, 4],
  ["IT403", "CCNA Routing & Switching I",       "2", null, 4],
  ["IT404", "Data Structures",                  "2", null, 4],
  ["IT405", "Database Programming",             "2", null, 4],
  ["IT406", "Capstone Design",                  "2", null, 4],

  // ── Year 3 · Software · Semester 5 ──
  ["ITS501", "Advanced Programming in C",       "3", "software", 5],
  ["ITS502", "Data Communication",             "3", "software", 5],
  ["ITS503", "Java Programming II",            "3", "software", 5],
  ["ITS504", "Computer Architecture",         "3", "software", 5],
  ["ITS505", "Microprocessor",                "3", "software", 5],
  ["ITS506", "Computer Graphics",             "3", "software", 5],

  // ── Year 3 · Software · Semester 6 ──
  ["ITS601", "Advanced Programming in C++",   "3", "software", 6],
  ["ITS602", "Mobile Programming I",          "3", "software", 6],
  ["ITS603", "Embedded Systems",              "3", "software", 6],
  ["ITS604", "Network Programming",           "3", "software", 6],
  ["ITS605", "Algorithms",                    "3", "software", 6],
  ["ITS606", "Software Engineering",          "3", "software", 6],

  // ── Year 3 · Networks · Semester 5 (codes normalized to ITN5xx) ──
  ["ITN501", "CCNA Routing & Switching II",   "3", "networks", 5],
  ["ITN502", "Java Programming II",           "3", "networks", 5],
  ["ITN503", "Data Communication",           "3", "networks", 5],
  ["ITN504", "Network Administration",       "3", "networks", 5],
  ["ITN505", "Microprocessor",               "3", "networks", 5],
  ["ITN506", "Computer Architecture",        "3", "networks", 5],

  // ── Year 3 · Networks · Semester 6 ──
  ["ITN601", "CCNA Routing & Switching III", "3", "networks", 6],
  ["ITN602", "Network Programming",          "3", "networks", 6],
  ["ITN603", "CCNA Security",                "3", "networks", 6],
  ["ITN604", "Embedded Systems",             "3", "networks", 6],
  ["ITN605", "Distributed Systems",          "3", "networks", 6],
  ["ITN606", "Software Engineering",         "3", "networks", 6],

  // ── Year 4 · Software · Semester 7 ──
  ["ITS701", "CCNA Routing & Switching II",  "4", "software", 7],
  ["ITS702", "Mobile Programming II",        "4", "software", 7],
  ["ITS703", "IoT Architecture & Protocols", "4", "software", 7],
  ["ITS704", "Artificial Intelligence",      "4", "software", 7],
  ["ITS705", "Windows Programming I",        "4", "software", 7],
  ["ITS706", "Signal Processing",            "4", "software", 7],

  // ── Year 4 · Software · Semester 8 ──
  ["ITS801", "Robotics",                     "4", "software", 8],
  ["ITS802", "Windows Programming II",       "4", "software", 8],
  ["ITS803", "Big Data & Analytics",         "4", "software", 8],
  ["ITS804", "IoT Security",                 "4", "software", 8],
  ["ITS805", "Machine Learning",             "4", "software", 8],
  ["ITS806", "Entrepreneurship",             "4", "software", 8],
  ["ITS807", "Graduation Project",           "4", "software", 8],

  // ── Year 4 · Networks · Semester 7 ──
  ["ITN701", "CCNA Routing & Switching IV",  "4", "networks", 7],
  ["ITN702", "IoT Architecture & Protocols", "4", "networks", 7],
  ["ITN703", "Artificial Intelligence",      "4", "networks", 7],
  ["ITN704", "CCNA Cyber Security Operations", "4", "networks", 7],
  ["ITN705", "Server Administration",        "4", "networks", 7],
  ["ITN706", "Encryption Algorithms",        "4", "networks", 7],

  // ── Year 4 · Networks · Semester 8 ──
  ["ITN801", "CCNP Route",                   "4", "networks", 8],
  ["ITN802", "CCNP Switch",                  "4", "networks", 8],
  ["ITN803", "Big Data & Analytics",         "4", "networks", 8],
  ["ITN804", "IoT Security",                 "4", "networks", 8],
  ["ITN805", "Machine Learning",             "4", "networks", 8],
  ["ITN806", "Entrepreneurship",             "4", "networks", 8],
  ["ITN807", "Graduation Project",           "4", "networks", 8],
];

module.exports = async function seedCourses(promisePool) {
  // Bulk upsert. On conflict we refresh the descriptive/cohort columns but
  // deliberately leave doctor_id untouched so admin assignments survive a
  // re-seed. New rows are inserted with doctor_id = NULL (unassigned).
  const values = CURRICULUM.map(([code, title, year, track, semester]) => [
    code, title, year, track, semester,
  ]);

  const [res] = await promisePool.query(
    `INSERT INTO Courses (course_code, title, academic_year, track, semester)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       title         = VALUES(title),
       academic_year = VALUES(academic_year),
       track         = VALUES(track),
       semester      = VALUES(semester)`,
    [values]
  );

  console.log(`  ✅ Curriculum seeded (${CURRICULUM.length} courses, ${res.affectedRows} rows touched)`);
};

module.exports.CURRICULUM = CURRICULUM;
