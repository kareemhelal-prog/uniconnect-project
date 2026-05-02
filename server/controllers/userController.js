const db = require("../config/db").promisePool;

// =======================
// GET ALL USERS
// =======================
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, name, email, role FROM Users"
    );

    res.json({
      message: "Users fetched successfully",
      data: users
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// =======================
// GET USER BY ID
// =======================
exports.getUserById = async (req, res) => {
  try {
    const [user] = await db.query(
      "SELECT id, username, name, email, role FROM Users WHERE id = ?",
      [req.params.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      message: "User found",
      data: user[0]
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// =======================
// UPDATE USER
// =======================
exports.updateUser = async (req, res) => {
  try {
    const { name, username } = req.body;

    if (!name || !username) {
      return res.status(400).json({
        message: "Name and username required"
      });
    }

    // 🔐 authorization
    if (req.user.id != req.params.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    const [result] = await db.query(
      "UPDATE Users SET name = ?, username = ? WHERE id = ?",
      [name, username, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      message: "User updated successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// =======================
// DELETE USER
// =======================
exports.deleteUser = async (req, res) => {
  try {
    // 🔐 authorization
    if (req.user.id != req.params.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    const [result] = await db.query(
      "DELETE FROM Users WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      message: "User deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};