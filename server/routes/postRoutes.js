const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");
const { authenticateToken } = require("../middleware/authMiddleware");

// protect all routes
router.use(authenticateToken);

router.post("/", postController.createPost);
router.get("/", postController.getAllPosts);
router.get("/user/:userId", postController.getPostsByUser);
router.get("/:id", postController.getPostById);
router.put("/:id", postController.updatePost);
router.delete("/:id", postController.deletePost);

module.exports = router;