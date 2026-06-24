// server/controllers/authProfileController.js

const { promisePool } = require('../config/db');
const bcrypt = require('bcrypt');

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await promisePool.query(`
      SELECT
        u.id, u.name, u.username, u.email,
        u.profile_picture, u.bio, u.phone_number,
        u.role, u.is_active, u.created_at,
        ps.faculty, ps.major, ps.academic_year
      FROM Users u
      LEFT JOIN Profile_Studies ps ON u.id = ps.user_id
      WHERE u.id = ?
    `, [userId]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'User not found' });

    const [skillRows] = await promisePool.query(`
      SELECT s.name
      FROM User_Skills us
      JOIN Skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `, [userId]);

    const user = {
      ...rows[0],
      phone: rows[0].phone_number,
      year: rows[0].academic_year,
      skills: skillRows.map(r => r.name)
    };

    res.json({ success: true, user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, username, email, bio, phone, profile_picture, faculty, year, skills } = req.body;

  try {
    if (username) {
      const [existing] = await promisePool.query(
        'SELECT id FROM Users WHERE username = ? AND id != ?',
        [username, userId]
      );
      if (existing.length > 0)
        return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    await promisePool.query(`
      UPDATE Users
      SET name            = COALESCE(?, name),
          username        = COALESCE(?, username),
          email           = COALESCE(?, email),
          bio             = COALESCE(?, bio),
          phone_number    = COALESCE(?, phone_number),
          profile_picture = COALESCE(?, profile_picture)
      WHERE id = ?
    `, [
      name || null,
      username || null,
      email || null,
      bio ?? null,
      phone || null,
      profile_picture || null,
      userId
    ]);

    await promisePool.query(`
      INSERT INTO Profile_Studies (user_id, faculty, academic_year)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        faculty       = COALESCE(VALUES(faculty), faculty),
        academic_year = COALESCE(VALUES(academic_year), academic_year)
    `, [userId, faculty || null, year || null]);

    if (Array.isArray(skills)) {
      await promisePool.query('DELETE FROM User_Skills WHERE user_id = ?', [userId]);

      for (const skillName of skills) {
        if (!skillName.trim()) continue;

        await promisePool.query(
          'INSERT IGNORE INTO Skills (name) VALUES (?)',
          [skillName.trim()]
        );

        const [skillRow] = await promisePool.query(
          'SELECT id FROM Skills WHERE name = ?',
          [skillName.trim()]
        );

        if (skillRow.length > 0) {
          await promisePool.query(
            'INSERT IGNORE INTO User_Skills (user_id, skill_id) VALUES (?, ?)',
            [userId, skillRow[0].id]
          );
        }
      }
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/auth/profile/change-password
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const [users] = await promisePool.query(
      'SELECT password FROM Users WHERE id = ?', [userId]
    );

    if (users.length === 0)
      return res.status(404).json({ success: false, message: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await promisePool.query('UPDATE Users SET password = ? WHERE id = ?', [hashed, userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};