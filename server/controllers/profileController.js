const { promisePool } = require("../config/db");

// Returns 0 on any DB error — never throws
async function safeCount(query, params) {
  try {
    const [[row]] = await promisePool.query(query, params);
    const val = row?.count ?? row?.followers ?? row?.groups ?? row?.uploadedFiles ?? 0;
    return typeof val === "number" ? val : Number(val) || 0;
  } catch { return 0; }
}

// Fetch user with a minimal safe query (no optional columns)
async function fetchUserSafe(userId) {
  try {
    // Try full query first
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
    return user || null;
  } catch (fullErr) {
    console.warn("⚠ Full profile query failed, trying minimal:", fullErr.message);
    // Fallback: minimal query without optional columns
    try {
      const [[user]] = await promisePool.query(
        `SELECT id, name, role FROM Users WHERE id = ?`,
        [userId]
      );
      if (user) {
        return { ...user, bio: "", profile_picture: "", faculty: null, major: null, academic_year: null };
      }
    } catch (minErr) {
      console.error("❌ Minimal query also failed:", minErr.message);
    }
    return null;
  }
}

// =======================
// GET MY PROFILE
// =======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await fetchUserSafe(userId);

    if (!user) {
      console.error(`❌ User ${userId} not found in DB (token may be stale)`);
      return res.status(404).json({ message: "User not found" });
    }

    const [posts] = await promisePool.query(
      `SELECT id, content AS text, created_at AS date
       FROM Posts WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    ).catch(() => [[]]);

    const [followers, groups, uploadedFiles] = await Promise.all([
      safeCount("SELECT COUNT(*) AS count FROM Followers WHERE following_id = ?", [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Group_Members WHERE user_id = ?", [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Files WHERE uploader_id = ?", [userId]),
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

    if (!user) {
      console.error(`❌ User ${userId} not found in DB`);
      return res.status(404).json({ message: "User not found" });
    }

    const [posts] = await promisePool.query(
      `SELECT id, content AS text, created_at AS date
       FROM Posts WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    ).catch(() => [[]]);

    const [followers, groups, uploadedFiles] = await Promise.all([
      safeCount("SELECT COUNT(*) AS count FROM Followers WHERE following_id = ?", [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Group_Members WHERE user_id = ?", [userId]),
      safeCount("SELECT COUNT(*) AS count FROM Files WHERE uploader_id = ?", [userId]),
    ]);

    res.json({ ...user, followers, groups, uploadedFiles, posts });

  } catch (err) {
    console.error("❌ getUserById error:", err.message);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};
