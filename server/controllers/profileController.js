const { promisePool } = require("../config/db");

// Safe count helper — returns 0 if table/column issue
async function safeCount(query, params) {
  try {
    const [[row]] = await promisePool.query(query, params);
    return typeof row?.count === "number" ? row.count :
           typeof row?.followers === "number" ? row.followers :
           typeof row?.groups === "number" ? row.groups :
           typeof row?.uploadedFiles === "number" ? row.uploadedFiles : 0;
  } catch { return 0; }
}

// =======================
// GET MY PROFILE
// =======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

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

    if (!user) return res.status(404).json({ message: "User not found" });

    const [posts] = await promisePool.query(
      `SELECT id, content AS text, created_at AS date
       FROM Posts WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const followers    = await safeCount("SELECT COUNT(*) AS count FROM Followers WHERE following_id = ?", [userId]);
    const groups       = await safeCount("SELECT COUNT(*) AS count FROM Group_Members WHERE user_id = ?", [userId]);
    const uploadedFiles= await safeCount("SELECT COUNT(*) AS count FROM Files WHERE uploader_id = ?", [userId]);

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

    if (!user) return res.status(404).json({ message: "User not found" });

    const [posts] = await promisePool.query(
      `SELECT id, content AS text, created_at AS date
       FROM Posts WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const followers    = await safeCount("SELECT COUNT(*) AS count FROM Followers WHERE following_id = ?", [userId]);
    const groups       = await safeCount("SELECT COUNT(*) AS count FROM Group_Members WHERE user_id = ?", [userId]);
    const uploadedFiles= await safeCount("SELECT COUNT(*) AS count FROM Files WHERE uploader_id = ?", [userId]);

    res.json({ ...user, followers, groups, uploadedFiles, posts });

  } catch (err) {
    console.error("❌ getUserById error:", err.message);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};
