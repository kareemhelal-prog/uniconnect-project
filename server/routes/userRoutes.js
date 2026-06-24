const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

// =======================
// APPLY AUTH MIDDLEWARE
// =======================
router.use(authenticateToken);

// =======================
// GET CURRENT USER
// =======================
router.get("/me", async (req, res) => {
  try {
    const { promisePool } = require("../config/db");
    const [[user]] = await promisePool.query(
      `SELECT u.id, u.name, u.username, u.email, u.role,
              u.profile_picture, u.bio,
              ps.faculty, ps.major, ps.academic_year,
              dp.specialization AS doctor_specialization,
              dp.faculty AS doctor_faculty
       FROM Users u
       LEFT JOIN Profile_Studies ps ON ps.user_id = u.id
       LEFT JOIN Doctor_Profiles dp ON dp.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// GET ALL USERS
// =======================
router.get("/", userController.getAllUsers);

// =======================
// GET USER BY ID
// =======================
router.get("/:id", userController.getUserById);

// =======================
// UPDATE USER
// =======================
router.put("/:id", userController.updateUser);

// =======================
// DELETE USER
// =======================
router.delete("/:id", userController.deleteUser);

router.put("/:id/profile", authenticateToken, userController.updateProfile);

module.exports = router;