const express = require("express");
const router = express.Router();

const {
  getMyCourses,
  getCourseById,
  adminListCourses,
  adminListDoctors,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
} = require("../controllers/courseController");

const { authenticateToken } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/rolemiddleware");

// All course routes require a logged-in user.
router.use(authenticateToken);

// =======================
// ADMIN — course management (declared BEFORE "/:id" so "admin" isn't
// swallowed as an :id param)
// =======================
router.get("/admin",          roleMiddleware(["admin"]), adminListCourses);
router.get("/admin/doctors",  roleMiddleware(["admin"]), adminListDoctors);
router.post("/admin",         roleMiddleware(["admin"]), adminCreateCourse);
router.put("/admin/:id",      roleMiddleware(["admin"]), adminUpdateCourse);
router.delete("/admin/:id",   roleMiddleware(["admin"]), adminDeleteCourse);

// =======================
// STUDENT / DOCTOR — cohort-scoped access
// =======================
// My courses (doctor: assigned · student: own cohort)
router.get("/my", getMyCourses);

// Course detail + materials (guarded per role inside the controller)
router.get("/:id", getCourseById);

module.exports = router;
