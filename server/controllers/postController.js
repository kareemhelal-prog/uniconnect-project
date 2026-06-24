const { promisePool } = require("../config/db");

// =======================
// CREATE POST
// =======================
exports.createPost = async (req, res) => {
  const { title, content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const [result] = await promisePool.query(
      "INSERT INTO Posts (user_id, title, content) VALUES (?, ?, ?)",
      [req.user.id, title, content]
    );

    const [rows] = await promisePool.query(
      `SELECT Posts.*, Users.name, Users.username, Users.role,
              COALESCE(Users.profile_picture,'') AS profile_picture,
              0 AS likes, 0 AS comments_count, FALSE AS liked
       FROM Posts JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.id = ?`,
      [result.insertId]
    );

    // Notify all followers that the author published a new post
    const [followers] = await promisePool.query(
      "SELECT follower_id FROM Followers WHERE following_id = ?", [req.user.id]
    );
    if (followers.length > 0) {
      const values = followers.map(f => [f.follower_id, req.user.id, 'post', 'added a new post']);
      await promisePool.query(
        "INSERT INTO Notifications (user_id, sender_id, type, message) VALUES ?", [values]
      );
    }

    res.status(201).json({
      message: "Post created successfully",
      data: { ...rows[0], liked: false, comments: [] },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET ALL POSTS
// =======================
exports.getAllPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [posts] = await promisePool.query(
      `SELECT Posts.*, Users.username, Users.name, Users.role,
              COALESCE(Users.profile_picture,'') AS profile_picture,
              (SELECT COUNT(*) FROM Likes    WHERE Likes.post_id    = Posts.id) AS likes,
              (SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id) AS comments_count,
              EXISTS(SELECT 1 FROM Likes WHERE Likes.post_id = Posts.id AND Likes.user_id = ?) AS liked
       FROM Posts JOIN Users ON Posts.user_id = Users.id
       ORDER BY Posts.created_at DESC`,
      [userId]
    );

    const formatted = posts.map(p => ({ ...p, liked: !!p.liked }));

    if (formatted.length > 0) {
      const postIdList = formatted.map(p => p.id);
      const [comments] = await promisePool.query(
        `SELECT c.id, c.post_id, c.content, c.created_at, c.parent_id,
                u.id AS user_id, u.name AS user_name, u.role AS user_role,
                COALESCE(u.profile_picture,'') AS user_profile_picture
         FROM Comments c JOIN Users u ON c.user_id = u.id
         WHERE c.post_id IN (?) ORDER BY c.created_at ASC`,
        [postIdList]
      );

      const byPost = {};
      for (const c of comments) {
        if (!byPost[c.post_id]) byPost[c.post_id] = [];
        byPost[c.post_id].push({
          id: c.id, content: c.content, created_at: c.created_at, parent_id: c.parent_id,
          user: { id: c.user_id, name: c.user_name, role: c.user_role, profile_picture: c.user_profile_picture },
          replies: [],
        });
      }
      for (const p of formatted) {
        const all = byPost[p.id] || [];
        const byId = {}, top = [];
        for (const c of all) byId[c.id] = c;
        for (const c of all) {
          if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].replies.push(c);
          else if (!c.parent_id) top.push(c);
        }
        p.comments = top;
      }
    }

    res.json({ message: "Posts fetched successfully", data: formatted });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET POST BY ID
// =======================
exports.getPostById = async (req, res) => {
  try {
    const [post] = await promisePool.query(
      `SELECT Posts.*, Users.name, Users.role
       FROM Posts
       JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.id = ?`,
      [req.params.id]
    );

    if (post.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ data: post[0] });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// UPDATE POST
// =======================
exports.updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const [posts] = await promisePool.query(
      "SELECT * FROM Posts WHERE id = ?",
      [req.params.id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (posts[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await promisePool.query(
      "UPDATE Posts SET title = ?, content = ? WHERE id = ?",
      [title, content, req.params.id]
    );

    res.json({ message: "Post updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// DELETE POST
// =======================
exports.deletePost = async (req, res) => {
  try {
    const [posts] = await promisePool.query(
      "SELECT * FROM Posts WHERE id = ?",
      [req.params.id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (posts[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await promisePool.query("DELETE FROM Posts WHERE id = ?", [req.params.id]);

    res.json({ message: "Post deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET POSTS BY USER ID
// =======================
exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const [posts] = await promisePool.query(
      `SELECT Posts.*, Users.username, Users.name, Users.role,
              COALESCE(Users.profile_picture,'') AS profile_picture,
              (SELECT COUNT(*) FROM Likes    WHERE Likes.post_id    = Posts.id) AS likes,
              (SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id) AS comments_count,
              EXISTS(SELECT 1 FROM Likes WHERE Likes.post_id = Posts.id AND Likes.user_id = ?) AS liked
       FROM Posts JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.user_id = ? ORDER BY Posts.created_at DESC`,
      [currentUserId, userId]
    );

    const formatted = posts.map(p => ({ ...p, liked: !!p.liked }));

    if (formatted.length > 0) {
      const postIdList = formatted.map(p => p.id);
      const [comments] = await promisePool.query(
        `SELECT c.id, c.post_id, c.content, c.created_at, c.parent_id,
                u.id AS user_id, u.name AS user_name, u.role AS user_role,
                COALESCE(u.profile_picture,'') AS user_profile_picture
         FROM Comments c JOIN Users u ON c.user_id = u.id
         WHERE c.post_id IN (?) ORDER BY c.created_at ASC`,
        [postIdList]
      );

      const byPost = {};
      for (const c of comments) {
        if (!byPost[c.post_id]) byPost[c.post_id] = [];
        byPost[c.post_id].push({
          id: c.id, content: c.content, created_at: c.created_at, parent_id: c.parent_id,
          user: { id: c.user_id, name: c.user_name, role: c.user_role, profile_picture: c.user_profile_picture },
          replies: [],
        });
      }
      for (const p of formatted) {
        const all = byPost[p.id] || [];
        const byId = {}, top = [];
        for (const c of all) byId[c.id] = c;
        for (const c of all) {
          if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].replies.push(c);
          else if (!c.parent_id) top.push(c);
        }
        p.comments = top;
      }
    }

    res.json({ message: "Posts fetched", data: formatted });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};