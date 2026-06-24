const express = require("express");
const router = express.Router();

const commentController = require("../controllers/commentController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

// add comment
router.post("/", commentController.addComment);

// get comments for post
router.get("/:postId", commentController.getCommentsByPost);

// delete comment
router.delete("/:id", commentController.deleteComment);

module.exports = router;
