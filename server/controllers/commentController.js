const { promisePool } = require("../config/db");

// =======================
// ADD COMMENT (or REPLY)
// =======================
exports.addComment = async (req, res) => {
  const { post_id, content, parent_id } = req.body;

  try {
    if (!post_id || !content) {
      return res.status(400).json({ message: "post_id and content are required" });
    }

    const [result] = await promisePool.query(
      "INSERT INTO Comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)",
      [post_id, req.user.id, content, parent_id || null]
    );

    const [[newComment]] = await promisePool.query(
      `SELECT c.id, c.post_id, c.content, c.created_at, c.parent_id,
              u.id AS user_id, u.name AS user_name, u.username, u.role AS user_role,
              COALESCE(u.profile_picture,'') AS user_profile_picture
       FROM Comments c JOIN Users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    // Only notify post owner for top-level comments (not replies)
    if (!parent_id) {
      const [[commentedPost]] = await promisePool.query(
        "SELECT user_id FROM Posts WHERE id = ?", [post_id]
      );
      if (commentedPost && commentedPost.user_id !== req.user.id) {
        await promisePool.query(
          "INSERT INTO Notifications (user_id, sender_id, type, message, reference_id) VALUES (?, ?, 'comment', 'commented on your post', ?)",
          [commentedPost.user_id, req.user.id, post_id]
        );
      }
    }

    res.status(201).json({
      id:         newComment.id,
      content:    newComment.content,
      created_at: newComment.created_at,
      parent_id:  newComment.parent_id,
      replies:    [],
      user: {
        id:              newComment.user_id,
        name:            newComment.user_name,
        username:        newComment.username,
        role:            newComment.user_role,
        profile_picture: newComment.user_profile_picture,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET COMMENTS FOR POST (nested)
// =======================
exports.getCommentsByPost = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT c.id, c.post_id, c.content, c.created_at, c.parent_id,
              u.id AS user_id, u.name AS user_name, u.username, u.role AS user_role,
              COALESCE(u.profile_picture,'') AS user_profile_picture
       FROM Comments c
       JOIN Users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.postId]
    );

    const byId = {};
    const top  = [];
    for (const r of rows) {
      byId[r.id] = {
        id: r.id, content: r.content, created_at: r.created_at, parent_id: r.parent_id,
        user: {
          id:              r.user_id,
          name:            r.user_name,
          username:        r.username,
          role:            r.user_role,
          profile_picture: r.user_profile_picture,
        },
        replies: [],
      };
    }
    for (const id in byId) {
      const c = byId[id];
      if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].replies.push(c);
      else if (!c.parent_id) top.push(c);
    }

    res.json({ message: "Comments fetched", data: top });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// EDIT COMMENT (owner only)
// =======================
exports.editComment = async (req, res) => {
  const { content } = req.body;
  try {
    if (!content || !content.trim()) return res.status(400).json({ message: "content is required" });
    const [[comment]] = await promisePool.query("SELECT * FROM Comments WHERE id = ?", [req.params.id]);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user_id !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("UPDATE Comments SET content = ? WHERE id = ?", [content.trim(), req.params.id]);
    res.json({ message: "Comment updated", content: content.trim() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// DELETE COMMENT (owner, doctor, or admin)
// =======================
exports.deleteComment = async (req, res) => {
  try {
    const [[comment]] = await promisePool.query("SELECT * FROM Comments WHERE id = ?", [req.params.id]);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const canDelete = comment.user_id === req.user.id ||
                      req.user.role === "doctor" ||
                      req.user.role === "admin";
    if (!canDelete) return res.status(403).json({ message: "Not authorized" });

    await promisePool.query("DELETE FROM Comments WHERE id = ?", [req.params.id]);
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
