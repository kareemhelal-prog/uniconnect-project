const { promisePool } = require("../config/db");
const { notify } = require("../utils/notify");
const { emitToPost } = require("../config/socket");

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

    const isLiked = existing.length > 0;

    if (isLiked) {
      await promisePool.query(
        "DELETE FROM Likes WHERE user_id = ? AND post_id = ?",
        [req.user.id, post_id]
      );
    } else {
      await promisePool.query(
        "INSERT INTO Likes (user_id, post_id) VALUES (?, ?)",
        [req.user.id, post_id]
      );

      // Notify post owner (not self-like) — persists + emits new_notification
      const [[likedPost]] = await promisePool.query(
        "SELECT user_id FROM Posts WHERE id = ?", [post_id]
      );
      if (likedPost) {
        await notify({
          userId: likedPost.user_id,
          senderId: req.user.id,
          type: "like",
          message: "liked your post",
          referenceId: post_id,
        });
      }
    }

    // Return real count from DB so frontend stays in sync
    const [[countRow]] = await promisePool.query(
      "SELECT COUNT(*) AS likes FROM Likes WHERE post_id = ?", [post_id]
    );

    // Real-time: broadcast the authoritative like count to everyone on this post
    emitToPost(post_id, "post_reaction", {
      post_id: Number(post_id),
      likes: countRow.likes,
      actor_id: req.user.id,
      liked: !isLiked,
    });

    res.json({
      message: isLiked ? "Unliked" : "Liked",
      liked:  !isLiked,
      likes:  countRow.likes,
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