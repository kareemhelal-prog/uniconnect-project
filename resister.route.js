const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db'); // mysql2/promise pool

// POST /auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, username, role } = req.body;

  // ── 1. Validation ──────────────────────────────────────────────
  const errors = {};
  if (!name?.trim())                       errors.fullName    = 'Full name is required.';
  if (!username?.trim())                   errors.username    = 'Username is required.';
  if (!email?.includes('@'))               errors.email       = 'Enter a valid email.';
  if (!password || password.length < 6)   errors.password    = 'Min 6 characters.';

  const allowedRoles = ['student', 'instructor', 'admin'];
  if (role && !allowedRoles.includes(role)) errors.role = 'Invalid role.';

  if (Object.keys(errors).length) {
    return res.status(400).json({ errors });
  }

  try {
    // ── 2. Check duplicates ────────────────────────────────────────
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email or username already in use.' });
    }

    // ── 3. Hash password ───────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── 4. Insert user ─────────────────────────────────────────────
    const [result] = await db.query(
      `INSERT INTO users (name, email, password, username, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name.trim(), email.toLowerCase(), hashedPassword, username.trim(), role || 'student']
    );

    return res.status(201).json({
      message: 'Account created successfully.',
      userId: result.insertId,
    });

  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ message: 'Server error, please try again.' });
  }
});

module.exports = router;
