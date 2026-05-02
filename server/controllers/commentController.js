const { promisePool } = require("../config/db");

// =======================
// ADD COMMENT
// =======================
exports.addComment = async (req, res) => {
  const { post_id, content } = req.body;

  try {
    if (!post_id || !content) {
      return res.status(400).json({
        message: "post_id and content are required"
      });
    }

    const [result] = await promisePool.query(
      "INSERT INTO Comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [post_id, req.user.id, content]
    );

    res.status(201).json({
      message: "Comment added successfully",
      commentId: result.insertId
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET COMMENTS FOR POST
// =======================
exports.getCommentsByPost = async (req, res) => {
  try {
    const [comments] = await promisePool.query(
      `SELECT Comments.*, Users.username, Users.name
       FROM Comments
       JOIN Users ON Comments.user_id = Users.id
       WHERE post_id = ?
       ORDER BY Comments.created_at DESC`,
      [req.params.postId]
    );

    res.json({
      message: "Comments fetched",
      data: comments
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// DELETE COMMENT
// =======================
exports.deleteComment = async (req, res) => {
  try {
    const [comments] = await promisePool.query(
      "SELECT * FROM Comments WHERE id = ?",
      [req.params.id]
    );

    if (comments.length === 0) {
      return res.status(404).json({
        message: "Comment not found"
      });
    }

    const comment = comments[0];

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    await promisePool.query(
      "DELETE FROM Comments WHERE id = ?",
      [req.params.id]
    );

    res.json({
      message: "Comment deleted"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};