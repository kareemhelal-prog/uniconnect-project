const { promisePool } = require("../config/db");

// =======================
// TOGGLE LIKE (like / unlike)
// =======================
exports.toggleLike = async (req, res) => {
  const { post_id } = req.body;

  try {
    if (!post_id) {
      return res.status(400).json({
        message: "post_id is required"
      });
    }

    // check if like exists
    const [existing] = await promisePool.query(
      "SELECT * FROM Likes WHERE user_id = ? AND post_id = ?",
      [req.user.id, post_id]
    );

    if (existing.length > 0) {
      // remove like
      await promisePool.query(
        "DELETE FROM Likes WHERE user_id = ? AND post_id = ?",
        [req.user.id, post_id]
      );

      return res.json({
        message: "Unliked"
      });
    }

    // add like
    await promisePool.query(
      "INSERT INTO Likes (user_id, post_id) VALUES (?, ?)",
      [req.user.id, post_id]
    );

    res.json({
      message: "Liked"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET LIKES COUNT FOR POST
// =======================
exports.getLikesCount = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      "SELECT COUNT(*) AS likesCount FROM Likes WHERE post_id = ?",
      [req.params.postId]
    );

    res.json({
      post_id: req.params.postId,
      likes: result[0].likesCount
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};