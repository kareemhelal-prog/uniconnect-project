const { getAllGroups, getGroupById, createGroup, joinGroup, leaveGroup, deleteGroup } = require("../controllers/groupController");

const express = require("express");

const router = express.Router();

const groupController = require("../controllers/groupController");

const { authenticateToken } = require("../middleware/authMiddleware");

// protect routes
router.use(authenticateToken);

// =======================
// GET ALL GROUPS
// =======================
router.get("/", groupController.getAllGroups);

// =======================
// JOIN GROUP
// =======================
router.post("/join", groupController.joinGroup);

// =======================
// GET MY GROUPS
// =======================
router.get("/my-groups", groupController.getMyGroups);

// =======================
// LEAVE GROUP
// =======================
router.delete("/leave", groupController.leaveGroup);

router.get("/:id/members", groupController.getGroupMembers);
router.get("/:id", getGroupById);
router.post("/", createGroup);
router.post("/:id/join", joinGroup);
router.delete("/:id/leave", leaveGroup);
router.delete("/:id", deleteGroup);
module.exports = router;
