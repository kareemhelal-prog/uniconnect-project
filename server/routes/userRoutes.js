const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// =======================
// APPLY AUTH MIDDLEWARE
// =======================
router.use(authMiddleware);

// =======================
// GET CURRENT USER
// =======================
router.get("/me", (req, res) => {
  res.json({
    user: req.user
  });
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

router.put("/:id/profile", authMiddleware, userController.updateProfile);

module.exports = router;