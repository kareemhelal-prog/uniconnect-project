const { promisePool } = require("../config/db");

// =======================
// CREATE POST
// =======================
exports.createPost = async (req, res) => {
  const { title, content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({
        message: "Content is required"
      });
    }

    const [result] = await promisePool.query(
      "INSERT INTO Posts (user_id, title, content) VALUES (?, ?, ?)",
      [req.user.id, title, content]
    );

    const [[newPost]] = await promisePool.query(
      `SELECT Posts.*, Users.name, Users.username,
        0 AS likes, 0 AS comments_count, FALSE AS liked
       FROM Posts JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newPost);

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET ALL POSTS
// =======================
exports.getAllPosts = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ عشان نعرف اليوزر ده عمل like ولا لأ

    const [posts] = await promisePool.query(
      `SELECT 
        Posts.*,
        Users.username,
        Users.name,

        -- ✅ عدد الـ likes
        (SELECT COUNT(*) FROM Likes WHERE Likes.post_id = Posts.id) AS likes,

        -- ✅ عدد الـ comments
        (SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id) AS comments_count,

        -- ✅ هل اليوزر ده عمل like ولا لأ
        EXISTS(
          SELECT 1 FROM Likes
          WHERE Likes.post_id = Posts.id AND Likes.user_id = ?
        ) AS liked

       FROM Posts
       JOIN Users ON Posts.user_id = Users.id
       ORDER BY Posts.created_at DESC`,
      [userId]
    );

    const formatted = posts.map(p => ({ ...p, liked: !!p.liked }));

    // جيب الكومنتات لكل الـ posts دفعة واحدة
    if (formatted.length > 0) {
      const postIdList = formatted.map(p => p.id);
      const [comments] = await promisePool.query(
        `SELECT c.id, c.post_id, c.content, c.created_at,
                u.id AS user_id, u.name AS user_name
         FROM Comments c
         JOIN Users u ON c.user_id = u.id
         WHERE c.post_id IN (?)
         ORDER BY c.created_at ASC`,
        [postIdList]
      );

      const byPost = {};
      for (const c of comments) {
        if (!byPost[c.post_id]) byPost[c.post_id] = [];
        byPost[c.post_id].push({
          id:         c.id,
          content:    c.content,
          created_at: c.created_at,
          user: { id: c.user_id, name: c.user_name },
        });
      }

      for (const p of formatted) {
        p.comments = byPost[p.id] || [];
      }
    }

    res.json({
      message: "Posts fetched successfully",
      data: formatted
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET POST BY ID
// =======================
exports.getPostById = async (req, res) => {
  try {
    const [post] = await promisePool.query(
      `SELECT Posts.*, Users.username
       FROM Posts
       JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.id = ?`,
      [req.params.id]
    );

    if (post.length === 0) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    res.json(post[0]);

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// UPDATE POST
// =======================
exports.updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({
        message: "Content is required"
      });
    }

    const [posts] = await promisePool.query(
      "SELECT * FROM Posts WHERE id = ?",
      [req.params.id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    const post = posts[0];

    if (post.user_id !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    await promisePool.query(
      `UPDATE Posts
       SET title = ?, content = ?
       WHERE id = ?`,
      [title, content, req.params.id]
    );

    res.json({
      message: "Post updated successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
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
      return res.status(404).json({
        message: "Post not found"
      });
    }

    const post = posts[0];

    if (post.user_id !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    await promisePool.query(
      "DELETE FROM Posts WHERE id = ?",
      [req.params.id]
    );

    res.json({
      message: "Post deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET POSTS BY USER ID (with likes + comments)
// =======================
exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const [posts] = await promisePool.query(
      `SELECT
        Posts.*,
        Users.username,
        Users.name,
        Users.profile_picture,
        (SELECT COUNT(*) FROM Likes WHERE Likes.post_id = Posts.id) AS likes,
        (SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id) AS comments_count,
        EXISTS(
          SELECT 1 FROM Likes
          WHERE Likes.post_id = Posts.id AND Likes.user_id = ?
        ) AS liked
       FROM Posts
       JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.user_id = ?
       ORDER BY Posts.created_at DESC`,
      [currentUserId, userId]
    );

    const formatted = posts.map(p => ({ ...p, liked: !!p.liked }));

    if (formatted.length > 0) {
      const postIdList = formatted.map(p => p.id);
      const [comments] = await promisePool.query(
        `SELECT c.id, c.post_id, c.content, c.created_at,
                u.id AS user_id, u.name AS user_name
         FROM Comments c
         JOIN Users u ON c.user_id = u.id
         WHERE c.post_id IN (?)
         ORDER BY c.created_at ASC`,
        [postIdList]
      );

      const byPost = {};
      for (const c of comments) {
        if (!byPost[c.post_id]) byPost[c.post_id] = [];
        byPost[c.post_id].push({
          id: c.id, content: c.content, created_at: c.created_at,
          user: { id: c.user_id, name: c.user_name },
        });
      }
      for (const p of formatted) p.comments = byPost[p.id] || [];
    }

    res.json({ message: "Posts fetched", data: formatted });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
