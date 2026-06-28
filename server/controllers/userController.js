const { promisePool } = require("../config/db");

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await promisePool.query(
      "SELECT id, username, name, email, role FROM Users"
    );
    res.json({ message: "Users fetched successfully", data: users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const [user] = await promisePool.query(
      "SELECT id, username, name, email, role FROM Users WHERE id = ?",
      [req.params.id]
    );
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User found", data: user[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, username } = req.body;

    if (!name || !username) {
      return res.status(400).json({ message: "Name and username required" });
    }

    if (req.user.id != req.params.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const [result] = await promisePool.query(
      "UPDATE Users SET name = ?, username = ? WHERE id = ?",
      [name, username, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.id != req.params.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const [result] = await promisePool.query(
      "DELETE FROM Users WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await promisePool.query(`
      SELECT
        u.id, u.name, u.username, u.email,
        u.profile_picture, u.bio, u.phone_number,
        ps.faculty, ps.major, ps.academic_year, ps.graduation_year,
        s.name AS skill_name
      FROM Users u
      LEFT JOIN Profile_Studies ps ON u.id = ps.user_id
      LEFT JOIN User_Skills us ON u.id = us.user_id
      LEFT JOIN Skills s ON us.skill_id = s.id
      WHERE u.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = {
      id:              rows[0].id,
      name:            rows[0].name,
      username:        rows[0].username,
      email:           rows[0].email,
      profile_picture: rows[0].profile_picture,
      bio:             rows[0].bio,
      phone_number:    rows[0].phone_number,
      faculty:         rows[0].faculty,
      major:           rows[0].major,
      academic_year:   rows[0].academic_year,
      graduation_year: rows[0].graduation_year,
      skills: rows.filter(r => r.skill_name).map(r => r.skill_name)
    };

    res.json({ message: "Profile fetched successfully", data: profile });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      name, bio, phone_number, profile_picture,
      faculty, major, academic_year
    } = req.body;

    if (req.user.id != req.params.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await promisePool.query(
      "UPDATE Users SET name = COALESCE(?, name), bio = ?, phone_number = ?, profile_picture = COALESCE(NULLIF(?, ''), profile_picture) WHERE id = ?",
      [name || null, bio || null, phone_number || null, profile_picture || null, req.params.id]
    );

    // academic_year and faculty are intentionally NOT updatable here — the year
    // defines the student's cohort (what content they see) and is controlled
    // only by the admin / year-promotion flow; faculty is fixed to the
    // department. Only `major` (free-text) stays editable.
    await promisePool.query(
      "UPDATE Profile_Studies SET major = COALESCE(?, major) WHERE user_id = ?",
      [major || null, req.params.id]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};