const express = require("express");

const router = express.Router();

const groupPostController = require("../controllers/groupPostController");

const authMiddleware = require("../middleware/authMiddleware");

// protect routes
router.use(authMiddleware);

// CREATE POST
router.post("/", groupPostController.createGroupPost);

// GET POSTS
router.get("/:groupId", groupPostController.getGroupPosts);

module.exports = router;
