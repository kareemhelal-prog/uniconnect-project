const { promisePool } = require("../config/db");

// =======================
// GET MY PROFILE
// =======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[user]] = await promisePool.query(
      `SELECT u.id, u.name, u.role, u.bio, u.profile_picture,
        ps.faculty, ps.major, ps.academic_year
       FROM Users u
       LEFT JOIN Profile_Studies ps ON ps.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    const [posts] = await promisePool.query(
      `SELECT id, content AS text, created_at AS date
       FROM Posts WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const [[{ followers }]] = await promisePool.query(
      `SELECT COUNT(*) AS followers FROM Followers WHERE following_id = ?`,
      [userId]
    );

    const [[{ groups }]] = await promisePool.query(
      `SELECT COUNT(*) AS groups FROM Group_Members WHERE user_id = ?`,
      [userId]
    );

    const [[{ uploadedFiles }]] = await promisePool.query(
      `SELECT COUNT(*) AS uploadedFiles FROM Files WHERE uploader_id = ?`,
      [userId]
    );

    res.json({ ...user, followers, groups, uploadedFiles, posts });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET USER BY ID
// =======================
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const [[user]] = await promisePool.query(
      `SELECT u.id, u.name, u.role, u.bio, u.profile_picture,
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

    const [[{ followers }]] = await promisePool.query(
      `SELECT COUNT(*) AS followers FROM Followers WHERE following_id = ?`,
      [userId]
    );

    const [[{ groups }]] = await promisePool.query(
      `SELECT COUNT(*) AS groups FROM Group_Members WHERE user_id = ?`,
      [userId]
    );

    const [[{ uploadedFiles }]] = await promisePool.query(
      `SELECT COUNT(*) AS uploadedFiles FROM Files WHERE uploader_id = ?`,
      [userId]
    );

    res.json({ ...user, followers, groups, uploadedFiles, posts });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};