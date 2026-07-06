const express = require("express");
const router = express.Router();

const commentController = require("../controllers/commentController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.post("/",         commentController.addComment);
router.get("/:postId",   commentController.getCommentsByPost);
router.put("/:id",       commentController.editComment);
router.delete("/:id",    commentController.deleteComment);

module.exports = router;
