const { promisePool } = require("../config/db");

// =======================
// TOGGLE FOLLOW (follow / unfollow)
// =======================
exports.toggleFollow = async (req, res) => {
  const { following_id } = req.body;

  try {
    if (!following_id) {
      return res.status(400).json({
        message: "following_id is required"
      });
    }

    // منع متابعة نفسك
    if (req.user.id === following_id) {
      return res.status(400).json({
        message: "You cannot follow yourself"
      });
    }

    // check if follow exists
    const [existing] = await promisePool.query(
      "SELECT * FROM Followers WHERE follower_id = ? AND following_id = ?",
      [req.user.id, following_id]
    );

    if (existing.length > 0) {
      // unfollow
      await promisePool.query(
        "DELETE FROM Followers WHERE follower_id = ? AND following_id = ?",
        [req.user.id, following_id]
      );

      return res.json({
        message: "Unfollowed"
      });
    }

    // follow
    await promisePool.query(
      "INSERT INTO Followers (follower_id, following_id) VALUES (?, ?)",
      [req.user.id, following_id]
    );

    // إشعار للشخص المتابَع
    await promisePool.query(
      "INSERT INTO Notifications (user_id, sender_id, type, message) VALUES (?, ?, 'follow', 'started following you')",
      [following_id, req.user.id]
    );

    res.json({
      message: "Followed"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET FOLLOWERS COUNT
// =======================
exports.getFollowersCount = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      "SELECT COUNT(*) AS count FROM Followers WHERE following_id = ?",
      [req.params.userId]
    );

    res.json({
      user_id: req.params.userId,
      followers: result[0].count
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// IS FOLLOWING CHECK
// =======================
exports.isFollowing = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      "SELECT id FROM Followers WHERE follower_id = ? AND following_id = ?",
      [req.user.id, req.params.userId]
    );
    res.json({ isFollowing: result.length > 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET FOLLOWING COUNT
// =======================
exports.getFollowingCount = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      "SELECT COUNT(*) AS count FROM Followers WHERE follower_id = ?",
      [req.params.userId]
    );

    res.json({
      user_id: req.params.userId,
      following: result[0].count
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};