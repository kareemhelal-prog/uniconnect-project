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
      `SELECT u.id, u.name, u.username, u.email, u.role, u.phone_number,
              u.profile_picture, u.bio,
              ps.faculty, ps.major, ps.academic_year, ps.track,
              sr.academic_id,
              dp.specialization AS doctor_specialization,
              dp.faculty AS doctor_faculty
       FROM Users u
       LEFT JOIN Profile_Studies ps ON ps.user_id = u.id
       LEFT JOIN student_registry sr ON sr.claimed_by = u.id
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
// SEARCH USERS — must be before /:id
// Searches: name, username (university ID), partial match, min 1 char
// =======================
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ data: [] });
  try {
    const { promisePool } = require("../config/db");
    const term = `%${q.trim()}%`;
    const [users] = await promisePool.query(
      `SELECT u.id, u.name, u.username, u.role,
              COALESCE(u.profile_picture,'') AS profile_picture,
              MAX(CASE WHEN f.follower_id = ? THEN 1 ELSE 0 END) AS is_following
       FROM Users u
       LEFT JOIN Followers f ON f.following_id = u.id AND f.follower_id = ?
       WHERE (u.name LIKE ? OR u.username LIKE ?)
         AND u.id != ?
       GROUP BY u.id
       ORDER BY
         CASE WHEN u.username LIKE ? THEN 0 ELSE 1 END,
         CASE WHEN u.name    LIKE ? THEN 0 ELSE 1 END,
         u.name ASC
       LIMIT 10`,
      [req.user.id, req.user.id, term, term, req.user.id, term, term]
    );
    res.json({ data: users.map(u => ({ ...u, is_following: !!u.is_following })) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =======================
// GET FOLLOWERS LIST — must be before /:id
// =======================
router.get("/:id/followers", async (req, res) => {
  try {
    const { promisePool } = require("../config/db");
    const viewerId = req.user.id;
    const [users] = await promisePool.query(
      `SELECT u.id, u.name, u.username, u.role,
              COALESCE(u.profile_picture,'') AS profile_picture,
              MAX(CASE WHEN f2.follower_id = ? THEN 1 ELSE 0 END) AS is_following
       FROM Followers fol
       JOIN Users u ON u.id = fol.follower_id
       LEFT JOIN Followers f2 ON f2.following_id = u.id AND f2.follower_id = ?
       WHERE fol.following_id = ?
       GROUP BY u.id
       ORDER BY u.name ASC`,
      [viewerId, viewerId, req.params.id]
    );
    res.json({ data: users.map(u => ({ ...u, is_following: !!u.is_following })) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =======================
// GET FOLLOWING LIST — must be before /:id
// =======================
router.get("/:id/following", async (req, res) => {
  try {
    const { promisePool } = require("../config/db");
    const viewerId = req.user.id;
    const [users] = await promisePool.query(
      `SELECT u.id, u.name, u.username, u.role,
              COALESCE(u.profile_picture,'') AS profile_picture,
              MAX(CASE WHEN f2.follower_id = ? THEN 1 ELSE 0 END) AS is_following
       FROM Followers fol
       JOIN Users u ON u.id = fol.following_id
       LEFT JOIN Followers f2 ON f2.following_id = u.id AND f2.follower_id = ?
       WHERE fol.follower_id = ?
       GROUP BY u.id
       ORDER BY u.name ASC`,
      [viewerId, viewerId, req.params.id]
    );
    res.json({ data: users.map(u => ({ ...u, is_following: !!u.is_following })) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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