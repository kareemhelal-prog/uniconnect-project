const { promisePool } = require("../config/db");
const { getUserCohort, buildCohortFilter } = require("../utils/cohort");

async function safeCount(query, params) {
  try {
    const [[row]] = await promisePool.query(query, params);
    const val = row?.count ?? row?.followers ?? row?.groups ?? row?.uploadedFiles ?? 0;
    return typeof val === "number" ? val : Number(val) || 0;
  } catch { return 0; }
}

// Accepts either a numeric id or a username. We match on username OR id and
// prefer the username hit — this is important because a student's username IS
// their all-digits academic ID (e.g. "2420529"), which would otherwise be
// mistaken for a row id and never resolve. The id comparison uses a sentinel
// (-1) for non-numeric keys so we never coerce a text handle to a number.
async function fetchUserSafe(key) {
  const k = String(key).trim();
  const numericId = /^\d+$/.test(k) ? Number(k) : -1;
  try {
    const [[user]] = await promisePool.query(
      `SELECT u.id, u.name, u.username, u.role,
              COALESCE(u.bio, '') AS bio,
              COALESCE(u.profile_picture, '') AS profile_picture,
              ps.faculty, ps.major, ps.academic_year
       FROM Users u
       LEFT JOIN Profile_Studies ps ON ps.user_id = u.id
       WHERE u.username = ? OR u.id = ?
       ORDER BY (u.username = ?) DESC
       LIMIT 1`,
      [k, numericId, k]
    );
    if (user) return user;
  } catch (e1) {
    console.warn("⚠ Full profile query failed:", e1.message);
  }
  try {
    const [[user]] = await promisePool.query(
      `SELECT id, name, username, role FROM Users
       WHERE username = ? OR id = ?
       ORDER BY (username = ?) DESC
       LIMIT 1`, [k, numericId, k]);
    if (user) return { ...user, bio: "", profile_picture: "", faculty: null, major: null, academic_year: null };
  } catch (e2) {
    console.error("❌ Minimal query failed:", e2.message);
  }
  return null;
}

// `viewer` is req.user ({ id, role }). Cohort segregation: when a student
// views a profile, only that profile's posts within the student's cohort (or
// global) are returned. Doctors/admins/investors see everything.
async function fetchPosts(userId, viewer) {
  const cohort = await getUserCohort(viewer);
  const filter = buildCohortFilter("p", cohort);
  const cohortSql    = filter ? ` AND ${filter.clause}` : "";
  const cohortParams = filter ? filter.params : [];

  const [rows] = await promisePool.query(
    `SELECT p.id, p.user_id, p.title, p.content, p.created_at,
            u.name, u.username, u.role, COALESCE(u.profile_picture,'') AS profile_picture,
            COUNT(DISTINCT l.id) AS likes,
            COUNT(DISTINCT c.id) AS comments_count,
            MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked
     FROM Posts p JOIN Users u ON p.user_id = u.id
     LEFT JOIN Likes    l ON l.post_id = p.id
     LEFT JOIN Comments c ON c.post_id = p.id
     WHERE p.user_id = ?${cohortSql} GROUP BY p.id ORDER BY p.created_at DESC`,
    [viewer.id, userId, ...cohortParams]
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

    const [posts, followers, following, groups, uploadedFiles] = await Promise.all([
      fetchPosts(userId, req.user),
      safeCount("SELECT COUNT(*) AS count FROM Followers    WHERE following_id = ?", [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Followers    WHERE follower_id = ?",  [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Group_Members WHERE user_id = ?",     [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Files         WHERE uploader_id = ?", [userId]),
    ]);

    res.json({ ...user, followers, following, groups, uploadedFiles, posts });
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
    const key = req.params.id; // numeric id OR username
    if (!key) return res.status(400).json({ message: "Invalid user" });

    // Resolve the account first so username lookups work and every follow-up
    // query uses the real numeric id.
    const user = await fetchUserSafe(key);
    if (!user) return res.status(404).json({ message: "User not found" });
    const uid = user.id;

    const [posts, followers, following, groups, uploadedFiles] = await Promise.all([
      fetchPosts(uid, req.user),
      safeCount("SELECT COUNT(*) AS count FROM Followers    WHERE following_id = ?", [uid]),
      safeCount("SELECT COUNT(*) AS count FROM Followers    WHERE follower_id = ?",  [uid]),
      safeCount("SELECT COUNT(*) AS count FROM Group_Members WHERE user_id = ?",     [uid]),
      safeCount("SELECT COUNT(*) AS count FROM Files         WHERE uploader_id = ?", [uid]),
    ]);

    res.json({ ...user, followers, following, groups, uploadedFiles, posts });
  } catch (err) {
    console.error("❌ getUserById error:", err.message);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};
