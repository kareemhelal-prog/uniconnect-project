// server/controllers/googleAuthController.js
//
// Google OAuth using the @react-oauth/google "implicit" flow.
// The frontend obtains a short-lived Google access_token from the Google
// popup and sends it here. We verify it against Google, then find-or-create
// / link the matching UniConnect account and return our normal JWT.

const { promisePool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// ── Verify a Google access_token and return the user's profile ──────────
// Throws if the token is invalid / expired / minted for another app.
async function fetchGoogleProfile(accessToken) {
  // 1) tokeninfo → validates the token and lets us check the audience (aud)
  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!tokenInfoRes.ok) {
    throw new Error("INVALID_TOKEN");
  }
  const tokenInfo = await tokenInfoRes.json();

  // Guard against token-substitution: the token must belong to OUR client id.
  if (GOOGLE_CLIENT_ID && tokenInfo.aud && tokenInfo.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("AUDIENCE_MISMATCH");
  }

  // 2) userinfo → name / email / picture / sub (stable Google user id)
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    throw new Error("INVALID_TOKEN");
  }
  const profile = await userRes.json();

  if (!profile.email || !profile.sub) {
    throw new Error("INCOMPLETE_PROFILE");
  }

  return {
    googleId: profile.sub,
    email: (profile.email || "").toLowerCase(),
    emailVerified: profile.email_verified === true || profile.email_verified === "true",
    name: profile.name || profile.email.split("@")[0],
    picture: profile.picture || null,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// Generate a unique username from an email prefix
async function generateUniqueUsername(email) {
  const base = (email.split("@")[0] || "user").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 20) || "user";
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const [rows] = await promisePool.query("SELECT id FROM Users WHERE username = ?", [candidate]);
    if (rows.length === 0) return candidate;
    candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${base}${Date.now()}`;
}

// ==========================================
// 1. GOOGLE LOGIN / REGISTER
//    POST /api/auth/google   body: { access_token }
// ==========================================
exports.googleLogin = async (req, res) => {
  const accessToken = req.body.access_token || req.body.token;
  if (!accessToken) {
    return res.status(400).json({ message: "Missing Google access token" });
  }

  let g;
  try {
    g = await fetchGoogleProfile(accessToken);
  } catch (err) {
    return res.status(401).json({ message: "Google authentication failed" });
  }

  try {
    // a) Already linked by google_id?
    let [rows] = await promisePool.query(
      "SELECT id, name, email, username, role FROM Users WHERE google_id = ? LIMIT 1",
      [g.googleId]
    );

    // b) Otherwise match an existing account by email → auto-link it
    if (rows.length === 0) {
      [rows] = await promisePool.query(
        "SELECT id, name, email, username, role FROM Users WHERE email = ? LIMIT 1",
        [g.email]
      );
      if (rows.length > 0) {
        await promisePool.query(
          "UPDATE Users SET google_id = ?, google_email = ? WHERE id = ?",
          [g.googleId, g.email, rows[0].id]
        );
      }
    }

    // c) No account anywhere → create a new student account
    if (rows.length === 0) {
      const connection = await promisePool.getConnection();
      try {
        await connection.beginTransaction();
        const username = await generateUniqueUsername(g.email);

        const [insert] = await connection.query(
          `INSERT INTO Users (name, email, username, role, google_id, google_email, profile_picture)
           VALUES (?, ?, ?, 'student', ?, ?, ?)`,
          [g.name, g.email, username, g.googleId, g.email, g.picture]
        );
        const userId = insert.insertId;

        // Default student profile so profile pages work out of the box
        await connection.query(
          `INSERT INTO Profile_Studies (user_id, faculty, major, academic_year)
           VALUES (?, 'General Faculty', 'Not specified', 1)`,
          [userId]
        );

        await connection.commit();
        rows = [{ id: userId, name: g.name, email: g.email, username, role: "student" }];
      } catch (e) {
        await connection.rollback();
        throw e;
      } finally {
        connection.release();
      }
    }

    const user = rows[0];
    const token = signToken(user);
    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("❌ GOOGLE LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// 2. LINK GOOGLE TO EXISTING (logged-in) ACCOUNT
//    POST /api/auth/google/link   body: { access_token }   (auth required)
// ==========================================
exports.googleLink = async (req, res) => {
  const accessToken = req.body.access_token || req.body.token;
  if (!accessToken) {
    return res.status(400).json({ message: "Missing Google access token" });
  }

  let g;
  try {
    g = await fetchGoogleProfile(accessToken);
  } catch (err) {
    return res.status(401).json({ message: "Google authentication failed" });
  }

  try {
    // Make sure this Google account isn't already linked to someone else
    const [taken] = await promisePool.query(
      "SELECT id FROM Users WHERE google_id = ? AND id != ? LIMIT 1",
      [g.googleId, req.user.id]
    );
    if (taken.length > 0) {
      return res.status(409).json({ message: "This Google account is already linked to another user" });
    }

    await promisePool.query(
      "UPDATE Users SET google_id = ?, google_email = ? WHERE id = ?",
      [g.googleId, g.email, req.user.id]
    );

    return res.json({ message: "Google account linked", google_email: g.email });
  } catch (error) {
    console.error("❌ GOOGLE LINK ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// 3. UNLINK GOOGLE
//    POST /api/auth/google/unlink   (auth required)
// ==========================================
exports.googleUnlink = async (req, res) => {
  try {
    const [[user]] = await promisePool.query(
      "SELECT password FROM Users WHERE id = ?",
      [req.user.id]
    );
    // Don't let a Google-only user remove their only way to sign in
    if (!user || !user.password) {
      return res.status(400).json({
        message: "Set a password first before unlinking Google, otherwise you'll be locked out.",
      });
    }

    await promisePool.query(
      "UPDATE Users SET google_id = NULL, google_email = NULL WHERE id = ?",
      [req.user.id]
    );
    return res.json({ message: "Google account unlinked" });
  } catch (error) {
    console.error("❌ GOOGLE UNLINK ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// 4. GOOGLE LINK STATUS
//    GET /api/auth/google/status   (auth required)
// ==========================================
exports.googleStatus = async (req, res) => {
  try {
    const [[user]] = await promisePool.query(
      "SELECT google_id, google_email, (password IS NOT NULL) AS has_password FROM Users WHERE id = ?",
      [req.user.id]
    );
    return res.json({
      linked: !!(user && user.google_id),
      google_email: user ? user.google_email : null,
      has_password: !!(user && user.has_password),
    });
  } catch (error) {
    console.error("❌ GOOGLE STATUS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// 5. RESET PASSWORD VIA GOOGLE
//    POST /api/auth/google/reset   body: { access_token, newPassword }
//    (no auth — this is the forgot-password path)
// ==========================================
exports.googleResetPassword = async (req, res) => {
  const accessToken = req.body.access_token || req.body.token;
  const { newPassword } = req.body;

  if (!accessToken) {
    return res.status(400).json({ message: "Missing Google access token" });
  }
  if (!newPassword || newPassword.length < 7) {
    return res.status(400).json({ message: "Password must be at least 7 characters" });
  }

  let g;
  try {
    g = await fetchGoogleProfile(accessToken);
  } catch (err) {
    return res.status(401).json({ message: "Google authentication failed" });
  }

  try {
    // Find the account by linked google_id, falling back to email
    let [[user]] = await promisePool.query(
      "SELECT id, google_id FROM Users WHERE google_id = ? LIMIT 1",
      [g.googleId]
    );
    if (!user) {
      [[user]] = await promisePool.query(
        "SELECT id, google_id FROM Users WHERE email = ? LIMIT 1",
        [g.email]
      );
    }

    if (!user) {
      return res.status(404).json({ message: "No UniConnect account is linked to this Google account" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    // Set the new password and (auto-)link the Google account if it wasn't
    await promisePool.query(
      "UPDATE Users SET password = ?, google_id = COALESCE(google_id, ?), google_email = COALESCE(google_email, ?) WHERE id = ?",
      [hashed, g.googleId, g.email, user.id]
    );

    return res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("❌ GOOGLE RESET ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
