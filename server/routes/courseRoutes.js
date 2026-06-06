const express = require("express");
const router = express.Router();

const {
  createCourse,
  getMyCourses,
  joinCourse
} = require("../controllers/courseController");

const authMiddleware = require("../middleware/authMiddleware");

// =======================
// COURSES ROUTES
// =======================

// Create Course (Doctor only)
router.post("/", authMiddleware, createCourse);

// Get My Courses
router.get("/my", authMiddleware, getMyCourses);

// Join Course (Student only)
router.post("/:id/join", authMiddleware, joinCourse);

module.exports = router;