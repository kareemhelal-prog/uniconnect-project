const express = require("express");
const router = express.Router();

const followController = require("../controllers/followController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

// follow / unfollow
router.post("/", followController.toggleFollow);

// is following check
router.get("/is-following/:userId", followController.isFollowing);

// followers count
router.get("/followers/:userId", followController.getFollowersCount);

// following count
router.get("/following/:userId", followController.getFollowingCount);

module.exports = router;
