const express = require("express");
const router = express.Router();

const likeController = require("../controllers/likeController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

// like / unlike
router.post("/", likeController.toggleLike);

// get likes count
router.get("/:postId", likeController.getLikesCount);

module.exports = router;
