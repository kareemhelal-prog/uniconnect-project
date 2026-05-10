const { promisePool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password, username, role } = req.body;
  if (!name || !email || !password || !username)
    return res.status(400).json({ message: "Please fill all required fields" });
  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  try {
    const [users] = await promisePool.query(
      "SELECT id FROM Users WHERE email = ? OR username = ?", [email, username]);
    if (users.length > 0)
      return res.status(409).json({ message: "Email or Username already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await promisePool.query(
      "INSERT INTO Users (name, email, password, username, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, username, role || "student"]);
    return res.status(201).json({ message: "User registered successfully", userId: result.insertId });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });
  try {
    const [users] = await promisePool.query(
      "SELECT id, name, email, username, password, role FROM Users WHERE email = ?", [email]);
    if (users.length === 0)
      return res.status(404).json({ message: "User not found" });
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Wrong password" });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    return res.json({ message: "Login successful", token,
      user: { id: user.id, name: user.name, email: user.email, username: user.username } });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};