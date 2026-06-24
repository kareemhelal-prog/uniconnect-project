const express = require("express");
const router = express.Router();

const {
  createCourse,
  getMyCourses,
  joinCourse
} = require("../controllers/courseController");

const { authenticateToken } = require("../middleware/authMiddleware");

// =======================
// COURSES ROUTES
// =======================

// Create Course (Doctor only)
router.post("/", authenticateToken, createCourse);

// Get My Courses
router.get("/my", authenticateToken, getMyCourses);

// Join Course (Student only)
router.post("/:id/join", authenticateToken, joinCourse);

module.exports = router;
