const { promisePool } = require("../config/db");
const { notify } = require("../utils/notify");
const { logEvent } = require("../utils/logEvent");
const { getUserCohort, buildCohortFilter, canViewCohort, normalizeCohortInput } = require("../utils/cohort");

// =======================
// CREATE POST
// =======================
exports.createPost = async (req, res) => {
  const { title, content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Tag the post with its target cohort:
    //  - student → their own cohort (auto).
    //  - doctor/admin → the cohort they chose (target_year/target_track); if
    //    none chosen the post stays global (NULL) and reaches every year.
    let pYear = null, pTrack = null;
    if (req.user.role === "student") {
      const cohort = await getUserCohort(req.user);
      if (cohort) { pYear = cohort.year; pTrack = cohort.track; }
    } else if (req.user.role === "doctor" || req.user.role === "admin") {
      const norm = normalizeCohortInput(req.body.target_year, req.body.target_track);
      pYear = norm.year; pTrack = norm.track;
    }

    const [result] = await promisePool.query(
      "INSERT INTO Posts (user_id, title, content, academic_year, track) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, title, content, pYear, pTrack]
    );
    const postId = result.insertId;

    const [rows] = await promisePool.query(
      `SELECT Posts.*, Users.name, Users.username, Users.role,
              COALESCE(Users.profile_picture,'') AS profile_picture,
              0 AS likes, 0 AS comments_count, FALSE AS liked
       FROM Posts JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.id = ?`,
      [postId]
    );

    // Notify followers AFTER the post row exists — store the post id so the
    // notification can deep-link to it, and emit each in real-time.
    const [followers] = await promisePool.query(
      "SELECT follower_id FROM Followers WHERE following_id = ?", [req.user.id]
    );
    await Promise.all(
      followers.map(f =>
        notify({
          userId: f.follower_id,
          senderId: req.user.id,
          type: "post",
          message: "added a new post",
          referenceId: postId,
        })
      )
    );

    logEvent({ actorId: req.user.id, type: "post_create", targetType: "post", targetId: postId, summary: (title || content || "").slice(0, 120) });

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

    // Cohort segregation: a student only sees posts tagged with their cohort
    // (or global/untagged posts). Doctors/admins/investors see everything.
    const cohort = await getUserCohort(req.user);
    const filter = buildCohortFilter("Posts", cohort);
    const whereSql = filter ? `WHERE ${filter.clause}` : "";
    const filterParams = filter ? filter.params : [];

    const [posts] = await promisePool.query(
      `SELECT Posts.*, Users.username, Users.name, Users.role,
              COALESCE(Users.profile_picture,'') AS profile_picture,
              ps.academic_year AS author_year, ps.track AS author_track,
              (SELECT COUNT(*) FROM Likes    WHERE Likes.post_id    = Posts.id) AS likes,
              (SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id) AS comments_count,
              EXISTS(SELECT 1 FROM Likes WHERE Likes.post_id = Posts.id AND Likes.user_id = ?) AS liked
       FROM Posts
       JOIN Users ON Posts.user_id = Users.id
       LEFT JOIN Profile_Studies ps ON ps.user_id = Users.id
       ${whereSql}
       ORDER BY Posts.created_at DESC`,
      [userId, ...filterParams]
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
// GET POST BY ID  (full shape — same as feed, with nested comments)
// =======================
exports.getPostById = async (req, res) => {
  try {
    const userId = req.user.id;

    const [posts] = await promisePool.query(
      `SELECT Posts.*, Users.username, Users.name, Users.role,
              COALESCE(Users.profile_picture,'') AS profile_picture,
              (SELECT COUNT(*) FROM Likes    WHERE Likes.post_id    = Posts.id) AS likes,
              (SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id) AS comments_count,
              EXISTS(SELECT 1 FROM Likes WHERE Likes.post_id = Posts.id AND Likes.user_id = ?) AS liked
       FROM Posts JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.id = ?`,
      [userId, req.params.id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Cohort guard: a student can't open a post outside their cohort by id.
    const cohort = await getUserCohort(req.user);
    if (!canViewCohort(cohort, posts[0])) {
      return res.status(403).json({ message: "This post belongs to a different cohort" });
    }

    const post = { ...posts[0], liked: !!posts[0].liked };

    // Nested comments (same structure as the feed)
    const [comments] = await promisePool.query(
      `SELECT c.id, c.post_id, c.content, c.created_at, c.parent_id,
              u.id AS user_id, u.name AS user_name, u.username, u.role AS user_role,
              COALESCE(u.profile_picture,'') AS user_profile_picture
       FROM Comments c JOIN Users u ON c.user_id = u.id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    const byId = {}, top = [];
    for (const c of comments) {
      byId[c.id] = {
        id: c.id, content: c.content, created_at: c.created_at, parent_id: c.parent_id,
        user: {
          id: c.user_id, name: c.user_name, username: c.username,
          role: c.user_role, profile_picture: c.user_profile_picture,
        },
        replies: [],
      };
    }
    for (const id in byId) {
      const c = byId[id];
      if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].replies.push(c);
      else if (!c.parent_id) top.push(c);
    }
    post.comments = top;

    res.json({ data: post });

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

    // Cohort segregation: when a student opens another user's profile (e.g. a
    // doctor's), they only see that user's posts within their own cohort (or
    // global). Doctors/admins/investors see everything.
    const cohort = await getUserCohort(req.user);
    const filter = buildCohortFilter("Posts", cohort);
    const cohortSql = filter ? ` AND ${filter.clause}` : "";
    const cohortParams = filter ? filter.params : [];

    const [posts] = await promisePool.query(
      `SELECT Posts.*, Users.username, Users.name, Users.role,
              COALESCE(Users.profile_picture,'') AS profile_picture,
              (SELECT COUNT(*) FROM Likes    WHERE Likes.post_id    = Posts.id) AS likes,
              (SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id) AS comments_count,
              EXISTS(SELECT 1 FROM Likes WHERE Likes.post_id = Posts.id AND Likes.user_id = ?) AS liked
       FROM Posts JOIN Users ON Posts.user_id = Users.id
       WHERE Posts.user_id = ?${cohortSql} ORDER BY Posts.created_at DESC`,
      [currentUserId, userId, ...cohortParams]
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