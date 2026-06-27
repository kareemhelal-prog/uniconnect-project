const { promisePool } = require("../config/db");

// =======================
// CREATE COURSE
// =======================
exports.createCourse = async (req, res) => {
  try {

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can create courses"
      });
    }

    const { title, description = null } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Course title is required"
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO Courses (doctor_id, title, description) VALUES (?, ?, ?)`,
      [req.user.id, title, description]
    );

    res.status(201).json({
      message: "Course created successfully",
      courseId: result.insertId
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET MY COURSES
// =======================
exports.getMyCourses = async (req, res) => {
  try {

    let courses = [];

    if (req.user.role === "doctor") {

      const [rows] = await promisePool.query(
        `SELECT * FROM Courses
         WHERE doctor_id = ?
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      courses = rows;

    } else {

      const [rows] = await promisePool.query(
        `SELECT Courses.*, Users.name AS doctor_name
         FROM Course_Enrollments
         JOIN Courses ON Course_Enrollments.course_id = Courses.id
         JOIN Users ON Courses.doctor_id = Users.id
         WHERE Course_Enrollments.student_id = ?
         ORDER BY Courses.created_at DESC`,
        [req.user.id]
      );

      courses = rows;
    }

    res.json({ data: courses });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET ALL COURSES (browse + enroll)
// =======================
exports.getAllCourses = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT
         c.*,
         u.name AS doctor_name,
         u.username AS doctor_username,
         (SELECT COUNT(*) FROM Course_Enrollments ce WHERE ce.course_id = c.id) AS students_count,
         EXISTS(
           SELECT 1 FROM Course_Enrollments ce
           WHERE ce.course_id = c.id AND ce.student_id = ?
         ) AS is_enrolled
       FROM Courses c
       JOIN Users u ON c.doctor_id = u.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// JOIN COURSE
// =======================
exports.joinCourse = async (req, res) => {
  try {

    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can join courses"
      });
    }

    const courseId = req.params.id;

    const [course] = await promisePool.query(
      `SELECT * FROM Courses WHERE id = ?`,
      [courseId]
    );

    if (course.length === 0) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    const [existing] = await promisePool.query(
      `SELECT * FROM Course_Enrollments
       WHERE course_id = ? AND student_id = ?`,
      [courseId, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Already joined this course"
      });
    }

    await promisePool.query(
      `INSERT INTO Course_Enrollments (course_id, student_id) VALUES (?, ?)`,
      [courseId, req.user.id]
    );

    res.json({ message: "Joined course successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};