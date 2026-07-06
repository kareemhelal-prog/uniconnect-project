const { promisePool } = require("../config/db");
const { getUserCohort, normalizeCohortInput } = require("../utils/cohort");
const { logEvent } = require("../utils/logEvent");

// =====================================================================
// COURSES
// =====================================================================
// A course belongs to a cohort (academic_year + track + semester) and has
// at most ONE assigned doctor. The ADMIN owns all CRUD and doctor
// assignment. Students see the courses of their own cohort automatically
// (no enrollment); a doctor sees only the courses assigned to them.
// A course's materials are Files tagged with `course_id`.
// =====================================================================

// Shared SELECT for a course card, including doctor + materials count.
const COURSE_SELECT = `
  SELECT c.id, c.course_code, c.title, c.description,
         c.academic_year, c.track, c.semester, c.doctor_id, c.created_at,
         u.name AS doctor_name, u.username AS doctor_username,
         COALESCE(u.profile_picture,'') AS doctor_picture,
         (SELECT COUNT(*) FROM Files f WHERE f.course_id = c.id) AS materials_count
  FROM Courses c
  LEFT JOIN Users u ON c.doctor_id = u.id
`;

// =======================
// GET MY COURSES
//   doctor  → courses assigned to them
//   student → every course in their cohort (auto, no enrollment)
//   admin   → all courses (use the admin endpoint for management)
// =======================
exports.getMyCourses = async (req, res) => {
  try {
    if (req.user.role === "doctor") {
      const [rows] = await promisePool.query(
        `${COURSE_SELECT} WHERE c.doctor_id = ?
         ORDER BY c.academic_year, c.semester, c.course_code`,
        [req.user.id]
      );
      return res.json({ data: rows });
    }

    if (req.user.role === "student") {
      const cohort = await getUserCohort(req.user);
      if (!cohort) return res.json({ data: [] }); // profile not set yet

      // Own year; track filter only bites for years 3 & 4 (track may be NULL
      // on shared courses, which every student of the year should still see).
      const params = [cohort.year];
      let trackSql = "";
      if (cohort.track) {
        trackSql = " AND (c.track IS NULL OR c.track = ?)";
        params.push(cohort.track);
      }

      const [rows] = await promisePool.query(
        `${COURSE_SELECT} WHERE c.academic_year = ?${trackSql}
         ORDER BY c.semester, c.course_code`,
        params
      );
      return res.json({ data: rows });
    }

    // admin / investor → nothing personal here
    return res.json({ data: [] });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET COURSE BY ID (+ materials)
// Guards: a student may only open a course in their cohort; a doctor may
// only open a course assigned to them; the admin may open any.
// =======================
exports.getCourseById = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `${COURSE_SELECT} WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Course not found" });

    const course = rows[0];

    // Access control
    if (req.user.role === "student") {
      const cohort = await getUserCohort(req.user);
      const okYear = cohort && String(course.academic_year) === cohort.year;
      const okTrack = !course.track || !cohort?.track || course.track === cohort.track;
      if (!okYear || !okTrack) {
        return res.status(403).json({ message: "This course belongs to a different cohort" });
      }
    } else if (req.user.role === "doctor") {
      if (course.doctor_id !== req.user.id) {
        return res.status(403).json({ message: "This course is not assigned to you" });
      }
    }
    // admin → full access

    // Materials = Files tagged with this course, newest first.
    const [materials] = await promisePool.query(
      `SELECT f.id, f.file_name, f.file_url, f.file_type, f.file_size,
              f.subject, f.description, f.download_count, f.created_at,
              f.uploader_id, u.name AS uploader_name
       FROM Files f LEFT JOIN Users u ON f.uploader_id = u.id
       WHERE f.course_id = ?
       ORDER BY f.created_at DESC`,
      [req.params.id]
    );

    res.json({ data: { ...course, materials } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =====================================================================
// ADMIN — full course management
// =====================================================================

// GET /api/courses/admin  (optional filters: ?year=&track=&semester=&q=)
exports.adminListCourses = async (req, res) => {
  try {
    const { year, track, semester, q } = req.query;
    const where = [];
    const params = [];
    if (year)     { where.push("c.academic_year = ?"); params.push(year); }
    if (track)    { where.push("c.track = ?");         params.push(track); }
    if (semester) { where.push("c.semester = ?");      params.push(semester); }
    if (q)        { where.push("(c.title LIKE ? OR c.course_code LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await promisePool.query(
      `${COURSE_SELECT} ${whereSql}
       ORDER BY c.academic_year, c.semester, c.track, c.course_code`,
      params
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/courses/admin/doctors — list assignable doctors for the dropdown
exports.adminListDoctors = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT id, name, username, COALESCE(profile_picture,'') AS profile_picture
       FROM Users WHERE role = 'doctor' AND account_status = 'approved'
       ORDER BY name`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/courses/admin
exports.adminCreateCourse = async (req, res) => {
  try {
    const { course_code, title, description = null, academic_year, semester } = req.body;
    if (!title || !academic_year) {
      return res.status(400).json({ message: "Title and academic year are required" });
    }
    const norm = normalizeCohortInput(academic_year, req.body.track);
    const doctor_id = req.body.doctor_id ? Number(req.body.doctor_id) : null;
    const sem = semester != null && semester !== "" ? Number(semester) : null;

    const [result] = await promisePool.query(
      `INSERT INTO Courses (course_code, title, description, academic_year, track, semester, doctor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course_code || null, title, description, norm.year, norm.track, sem, doctor_id]
    );

    logEvent({ actorId: req.user.id, type: "course_create", targetType: "course", targetId: result.insertId, summary: title });
    res.status(201).json({ message: "Course created", courseId: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "A course with this code already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/courses/admin/:id  (edit fields and/or assign a doctor)
exports.adminUpdateCourse = async (req, res) => {
  try {
    const [existing] = await promisePool.query("SELECT * FROM Courses WHERE id = ?", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "Course not found" });
    const cur = existing[0];

    // Merge: only overwrite fields the request actually sent.
    const title       = req.body.title       ?? cur.title;
    const description  = req.body.description  ?? cur.description;
    const course_code  = req.body.course_code  ?? cur.course_code;
    const year         = req.body.academic_year ?? cur.academic_year;
    const rawTrack     = req.body.track !== undefined ? req.body.track : cur.track;
    const norm         = normalizeCohortInput(year, rawTrack);
    const semester     = req.body.semester !== undefined && req.body.semester !== ""
      ? Number(req.body.semester) : cur.semester;
    const doctor_id    = req.body.doctor_id !== undefined
      ? (req.body.doctor_id ? Number(req.body.doctor_id) : null)
      : cur.doctor_id;

    await promisePool.query(
      `UPDATE Courses SET course_code = ?, title = ?, description = ?,
              academic_year = ?, track = ?, semester = ?, doctor_id = ?
       WHERE id = ?`,
      [course_code, title, description, norm.year, norm.track, semester, doctor_id, req.params.id]
    );

    logEvent({ actorId: req.user.id, type: "course_update", targetType: "course", targetId: Number(req.params.id), summary: title });
    res.json({ message: "Course updated" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "A course with this code already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/courses/admin/:id
exports.adminDeleteCourse = async (req, res) => {
  try {
    const [existing] = await promisePool.query("SELECT id, title FROM Courses WHERE id = ?", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "Course not found" });

    // Detach materials (keep the files in the library) then remove the course.
    await promisePool.query("UPDATE Files SET course_id = NULL WHERE course_id = ?", [req.params.id]);
    await promisePool.query("DELETE FROM Courses WHERE id = ?", [req.params.id]);

    logEvent({ actorId: req.user.id, type: "course_delete", targetType: "course", targetId: Number(req.params.id), summary: existing[0].title });
    res.json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
