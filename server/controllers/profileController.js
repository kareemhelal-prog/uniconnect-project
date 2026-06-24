const { promisePool } = require("../config/db");

async function safeCount(query, params) {
  try {
    const [[row]] = await promisePool.query(query, params);
    const val = row?.count ?? row?.followers ?? row?.groups ?? row?.uploadedFiles ?? 0;
    return typeof val === "number" ? val : Number(val) || 0;
  } catch { return 0; }
}

async function fetchUserSafe(userId) {
  try {
    const [[user]] = await promisePool.query(
      `SELECT u.id, u.name, u.role,
              COALESCE(u.bio, '') AS bio,
              COALESCE(u.profile_picture, '') AS profile_picture,
              ps.faculty, ps.major, ps.academic_year
       FROM Users u
       LEFT JOIN Profile_Studies ps ON ps.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (user) return user;
  } catch (e1) {
    console.warn("⚠ Full profile query failed:", e1.message);
  }
  try {
    const [[user]] = await promisePool.query(`SELECT id, name, role FROM Users WHERE id = ?`, [userId]);
    if (user) return { ...user, bio: "", profile_picture: "", faculty: null, major: null, academic_year: null };
  } catch (e2) {
    console.error("❌ Minimal query failed:", e2.message);
  }
  return null;
}

async function fetchPosts(userId, viewerId) {
  const [rows] = await promisePool.query(
    `SELECT p.id, p.user_id, p.title, p.content, p.created_at,
            u.name, u.username, u.role, COALESCE(u.profile_picture,'') AS profile_picture,
            COUNT(DISTINCT l.id) AS likes,
            COUNT(DISTINCT c.id) AS comments_count,
            MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked
     FROM Posts p JOIN Users u ON p.user_id = u.id
     LEFT JOIN Likes    l ON l.post_id = p.id
     LEFT JOIN Comments c ON c.post_id = p.id
     WHERE p.user_id = ? GROUP BY p.id ORDER BY p.created_at DESC`,
    [viewerId, userId]
  ).catch(() => [[]]);
  return rows.map(p => ({ ...p, liked: !!p.liked, comments: [] }));
}

// =======================
// GET MY PROFILE
// =======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await fetchUserSafe(userId);

    if (!user) {
      return res.json({
        id: userId, name: req.user.email?.split("@")[0] || "User",
        role: req.user.role || "student", bio: "", profile_picture: "",
        faculty: null, major: null, academic_year: null,
        followers: 0, groups: 0, uploadedFiles: 0, posts: [],
      });
    }

    const [posts, followers, groups, uploadedFiles] = await Promise.all([
      fetchPosts(userId, userId),
      safeCount("SELECT COUNT(*) AS count FROM Followers    WHERE following_id = ?", [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Group_Members WHERE user_id = ?",    [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Files         WHERE uploader_id = ?", [userId]),
    ]);

    res.json({ ...user, followers, groups, uploadedFiles, posts });
  } catch (err) {
    console.error("❌ getProfile error:", err.message);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};

// =======================
// GET USER BY ID
// =======================
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await fetchUserSafe(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const viewerId = req.user.id;
    const [posts, followers, groups, uploadedFiles] = await Promise.all([
      fetchPosts(userId, viewerId),
      safeCount("SELECT COUNT(*) AS count FROM Followers    WHERE following_id = ?", [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Group_Members WHERE user_id = ?",    [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Files         WHERE uploader_id = ?", [userId]),
    ]);

    res.json({ ...user, followers, groups, uploadedFiles, posts });
  } catch (err) {
    console.error("❌ getUserById error:", err.message);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};
