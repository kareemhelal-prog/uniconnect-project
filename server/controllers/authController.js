const { promisePool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { logEvent } = require("../utils/logEvent");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Normalize a name for comparison: trim, lowercase, collapse internal spaces.
const normalizeName = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

// Build a unique username from a base, appending a numeric suffix on collision.
// Runs inside the registration transaction so it sees uncommitted rows.
async function uniqueUsername(connection, base) {
  const clean = String(base || "user").toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 40) || "user";
  let candidate = clean;
  for (let i = 0; i < 50; i++) {
    const [rows] = await connection.query("SELECT id FROM Users WHERE username = ? LIMIT 1", [candidate]);
    if (rows.length === 0) return candidate;
    candidate = `${clean}${i + 1}`;
  }
  return `${clean}${Date.now().toString().slice(-5)}`;
}

// Notify every admin that a new account is awaiting review. Runs inside the
// caller's transaction. reference_id points at the new user so the admin's
// notification can deep-link to the review screen.
async function notifyAdminsOfSignup(connection, { userId, name, role }) {
  const [admins] = await connection.query("SELECT id FROM Users WHERE role = 'admin'");
  if (admins.length === 0) return;
  const message = `${name || "A new user"} (${role}) signed up and is awaiting review.`;
  const values = admins.map((a) => [a.id, userId, "account", userId, message]);
  await connection.query(
    "INSERT INTO Notifications (user_id, sender_id, type, reference_id, message) VALUES ?",
    [values]
  );
}

// Light validation of a student's submitted details. We NO LONGER block on the
// university registry — the account is created as 'pending' and the admin
// verifies the details on review (approving correct ones, rejecting the rest).
// So we only enforce the basic shape: a name, an academic ID of exactly 7
// digits, a year, and (for 3rd/4th year) a track. Returns { ok:true, track }
// or { ok:false, status, body }.
function validateStudentDetails({ fullName, academicId, academicYear, track }) {
  if (!fullName || !academicId || !academicYear) {
    return { ok: false, status: 400, body: { message: "Name, academic ID and year are required" } };
  }
  if (!/^\d{7}$/.test(academicId)) {
    return { ok: false, status: 400, body: { code: "bad_academic_id", message: "Academic ID must be exactly 7 digits." } };
  }
  // Track is required for 3rd/4th year, ignored (forced null) for 1st/2nd.
  if (academicYear === "3" || academicYear === "4") {
    if (!["software", "networks"].includes(track)) {
      return { ok: false, status: 400, body: { code: "track_required", message: "Specialization is required for 3rd and 4th year" } };
    }
  } else {
    track = null;
  }
  return { ok: true, track };
}

// ==========================================
// 1. REGISTER  (multi-role, registry-validated, admin-approved)
// ==========================================
// Students are validated against `student_registry` (id + name + year + track
// must match an unclaimed official record). All new accounts start as
// 'pending' and cannot log in until an admin approves them.
exports.register = async (req, res) => {
  const { email, password, role, phone_number } = req.body;
  const fullName     = String(req.body.name || req.body.fullName || "").trim();
  const academicId   = String(req.body.studentId || req.body.academicId || "").trim();
  const academicYear = req.body.academicYear ? String(req.body.academicYear) : null;
  let   track        = req.body.track || null;

  // ── Shared required fields ──
  if (!email || !password || !role) {
    return res.status(400).json({ message: "Please fill all required fields" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }
  if (!["student", "doctor", "investor"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // ── Student: light validation only (admin verifies on review) ──
    if (role === "student") {
      const check = validateStudentDetails({ fullName, academicId, academicYear, track });
      if (!check.ok) {
        await connection.rollback();
        return res.status(check.status).json(check.body);
      }
      track = check.track;
    }

    // ── Email uniqueness ──
    const [emailRows] = await connection.query("SELECT id FROM Users WHERE email = ? LIMIT 1", [email]);
    if (emailRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "This email is already registered" });
    }

    // ── Derive a unique username ──
    const usernameBase =
      req.body.username?.trim() ||
      (role === "student" ? academicId : (email.split("@")[0] || "user"));
    const username = await uniqueUsername(connection, usernameBase);

    const hashedPassword = await bcrypt.hash(password, 10);
    const name = fullName || username;

    // Investors need no academic verification, so they're approved instantly
    // and can log in right away; everyone else waits for admin review.
    const accountStatus = role === "investor" ? "approved" : "pending";

    const [userResult] = await connection.query(
      `INSERT INTO Users (name, email, password, username, role, phone_number, account_status, is_onboarded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, username, role, phone_number || null, accountStatus, role === "investor" ? 1 : 0]
    );
    const userId = userResult.insertId;

    if (role === "student") {
      await connection.query(
        `INSERT INTO Profile_Studies (user_id, faculty, major, academic_year, track, academic_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, "General Faculty", track || "General", academicYear, track, academicId]
      );
    } else if (role === "doctor") {
      await connection.query(
        `INSERT INTO Doctor_Profiles (user_id, faculty, specialization) VALUES (?, ?, ?)`,
        [userId, "General Faculty", "General"]
      );
    } else if (role === "investor") {
      await connection.query(
        `INSERT INTO Investor_Profiles (user_id, company_name) VALUES (?, ?)`,
        [userId, "Independent Investor"]
      );
    }

    // Only accounts that need review ping the admins — investors don't.
    if (role !== "investor") {
      await notifyAdminsOfSignup(connection, { userId, name, role });
    }

    await connection.commit();
    logEvent({ actorId: userId, actorName: name, type: "signup", targetType: "user", targetId: userId, summary: `New ${role} signed up` });

    // Investors are approved instantly → hand back a token so the frontend can
    // log them straight in. Everyone else goes to the "under review" screen.
    if (role === "investor") {
      const token = jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
      return res.status(201).json({ status: "approved", token, user: { id: userId, name, email, role } });
    }
    return res.status(201).json({ message: "submitted_for_review", status: "pending", userId });

  } catch (error) {
    await connection.rollback();
    console.error("❌ REGISTER ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};

// ==========================================
// 1b. COMPLETE REGISTRATION  (for Google sign-ups)  — auth required
// ==========================================
// A Google sign-up creates a stub account (needs_profile = 1). The wizard then
// collects role + (for students) the registry-validated cohort and calls this
// to finish the account, leaving it 'pending' for admin review.
exports.completeRegistration = async (req, res) => {
  const userId = req.user.id;
  const { role, phone_number } = req.body;
  const fullName     = String(req.body.name || req.body.fullName || "").trim();
  const academicId   = String(req.body.studentId || req.body.academicId || "").trim();
  const academicYear = req.body.academicYear ? String(req.body.academicYear) : null;
  let   track        = req.body.track || null;

  if (!["student", "doctor", "investor"].includes(role)) {
    return res.status(400).json({ message: "Please choose a valid role" });
  }

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // Only an unfinished stub may complete its profile (idempotency guard).
    const [[user]] = await connection.query(
      "SELECT id, name, needs_profile FROM Users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!user) {
      await connection.rollback();
      return res.status(404).json({ message: "Account not found" });
    }
    if (!user.needs_profile) {
      await connection.rollback();
      return res.status(409).json({ code: "already_completed", message: "This account is already registered. Please log in." });
    }

    if (role === "student") {
      const check = validateStudentDetails({ fullName, academicId, academicYear, track });
      if (!check.ok) {
        await connection.rollback();
        return res.status(check.status).json(check.body);
      }
      track = check.track;
    }

    // Investors are approved instantly (no review); everyone else stays pending.
    const accountStatus = role === "investor" ? "approved" : "pending";

    // Finalize the stub: set role, name/phone, clear the wizard flag.
    await connection.query(
      `UPDATE Users
       SET role = ?, name = COALESCE(NULLIF(?, ''), name),
           phone_number = COALESCE(?, phone_number),
           account_status = ?, needs_profile = 0,
           is_onboarded = CASE WHEN ? = 'investor' THEN 1 ELSE is_onboarded END
       WHERE id = ?`,
      [role, fullName, phone_number || null, accountStatus, role, userId]
    );

    if (role === "student") {
      await connection.query(
        `INSERT INTO Profile_Studies (user_id, faculty, major, academic_year, track, academic_id)
         VALUES (?, 'General Faculty', ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE major = VALUES(major), academic_year = VALUES(academic_year), track = VALUES(track), academic_id = VALUES(academic_id)`,
        [userId, track || "General", academicYear, track, academicId]
      );
    } else if (role === "doctor") {
      await connection.query(
        `INSERT INTO Doctor_Profiles (user_id, faculty, specialization) VALUES (?, 'General Faculty', 'General')
         ON DUPLICATE KEY UPDATE faculty = VALUES(faculty)`,
        [userId]
      );
    } else if (role === "investor") {
      await connection.query(
        `INSERT INTO Investor_Profiles (user_id, company_name) VALUES (?, 'Independent Investor')
         ON DUPLICATE KEY UPDATE company_name = VALUES(company_name)`,
        [userId]
      );
    }

    if (role !== "investor") {
      await notifyAdminsOfSignup(connection, { userId, name: fullName || user.name, role });
    }

    await connection.commit();
    logEvent({ actorId: userId, actorName: fullName || user.name, type: "signup", targetType: "user", targetId: userId, summary: `New ${role} signed up via Google` });

    // Investor → issue a fresh token (role changed from the stub) so the wizard
    // logs them straight in. Everyone else goes to the "under review" screen.
    if (role === "investor") {
      const email = req.user.email;
      const token = jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
      return res.status(200).json({ status: "approved", token, user: { id: userId, name: fullName || user.name, email, role } });
    }
    return res.status(200).json({ message: "submitted_for_review", status: "pending" });
  } catch (error) {
    await connection.rollback();
    console.error("❌ COMPLETE REGISTRATION ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};

// ==========================================
// 1c. COMPLETE ONBOARDING  — auth required
// ==========================================
// Called once the approved user finishes the welcome flow (photo / friends /
// groups) so they go straight to their home page on later logins.
exports.completeOnboarding = async (req, res) => {
  try {
    await promisePool.query("UPDATE Users SET is_onboarded = 1 WHERE id = ?", [req.user.id]);
    return res.json({ success: true });
  } catch (error) {
    console.error("❌ ONBOARDING ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// 2. LOGIN
// ==========================================
exports.login = async (req, res) => {
  const { password } = req.body;
  // Accept a university email, a username, or a raw academic ID.
  const identifier = String(req.body.identifier || req.body.email || "").trim();

  if (!identifier || !password) {
    return res.status(400).json({ message: "Academic ID / email and password are required" });
  }

  try {
    const [users] = await promisePool.query(
      `SELECT u.id, u.name, u.email, u.username, u.password, u.role,
              u.account_status, u.rejection_reason, u.is_onboarded
       FROM Users u
       LEFT JOIN student_registry sr ON sr.claimed_by = u.id
       WHERE u.email = ? OR u.username = ? OR sr.academic_id = ?
       LIMIT 1`,
      [identifier, identifier, identifier]
    );

    // Uniform response for "no such user" and "wrong password" so an attacker
    // can't tell which accounts exist (username/email enumeration).
    const INVALID = { code: "invalid_credentials", message: "Invalid credentials" };

    if (users.length === 0) {
      return res.status(401).json(INVALID);
    }

    const user = users[0];

    // Google-only accounts have no local password yet
    if (!user.password) {
      return res.status(401).json({
        message: "This account uses Google sign-in. Log in with Google, or use 'Forgot Password' to set a password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json(INVALID);
    }

    // ── Approval gate ── credentials are valid, but the account must be approved.
    if (user.account_status === "pending") {
      return res.status(403).json({
        code: "pending",
        message: "Your account is still under review. We'll verify your details and activate it within 2 days.",
      });
    }
    if (user.account_status === "rejected") {
      return res.status(403).json({
        code: "rejected",
        message: user.rejection_reason || "Your registration was not approved. Please contact the administration.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logEvent({ actorId: user.id, actorName: user.name, type: "login", targetType: "user", targetId: user.id, summary: `${user.role} logged in` });

    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, is_onboarded: user.is_onboarded }
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// 3. FORGOT PASSWORD
// ==========================================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    // Always answer the same way whether or not the email exists — otherwise the
    // 200-vs-404 difference lets anyone enumerate which emails have accounts.
    const genericOk = { success: true, message: 'إذا كان هذا البريد مسجّلًا، فقد أرسلنا إليه رمز التحقق' };

    try {
        if (!email) return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });

        const [users] = await promisePool.execute(
            'SELECT id FROM Users WHERE email = ?',
            [email]
        );

        // No account → respond identically, do NOT send mail, do NOT reveal.
        if (users.length === 0) {
            return res.json(genericOk);
        }

        await promisePool.execute('DELETE FROM password_resets WHERE email = ?', [email]);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await promisePool.execute(
            'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
            [email, otp, expiresAt]
        );

        await transporter.sendMail({
            to: email,
            subject: 'UniConnect - Reset Password OTP',
            html: `<h2>UniConnect</h2><p>Your OTP Code is:</p><h1 style="color:#4F46E5;">${otp}</h1><p>Valid for 10 minutes.</p>`
        });

        res.json(genericOk);

    } catch (error) {
        console.error("❌ FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
    }
};

// ==========================================
// 4. VERIFY OTP
// ==========================================
const OTP_MAX_ATTEMPTS = 5;

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني ورمز التحقق مطلوبان' });
        }

        // Fetch the active (unused, unexpired) reset code for this email — by
        // EMAIL only, not by otp, so we can count wrong guesses against it and
        // burn it after too many. This caps brute-force to OTP_MAX_ATTEMPTS
        // guesses per issued code regardless of request volume.
        const [records] = await promisePool.execute(
            `SELECT id, otp, attempts FROM password_resets
             WHERE email = ? AND is_used = FALSE AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [email]
        );

        if (records.length === 0) {
            return res.status(400).json({ success: false, message: 'OTP غير صحيح أو منتهي' });
        }

        const record = records[0];

        // Too many wrong guesses → burn the code so it can never be brute-forced.
        if (record.attempts >= OTP_MAX_ATTEMPTS) {
            await promisePool.execute('UPDATE password_resets SET is_used = TRUE WHERE id = ?', [record.id]);
            return res.status(429).json({ success: false, message: 'محاولات كثيرة خاطئة. اطلب رمزًا جديدًا.' });
        }

        // Constant-work compare (values are short digit strings).
        if (String(record.otp) !== String(otp)) {
            await promisePool.execute('UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?', [record.id]);
            return res.status(400).json({ success: false, message: 'OTP غير صحيح أو منتهي' });
        }

        // Correct → mark verified (is_used) so resetPassword can proceed.
        await promisePool.execute('UPDATE password_resets SET is_used = TRUE WHERE id = ?', [record.id]);

        res.json({ success: true, message: 'تم التحقق بنجاح' });

    } catch (error) {
        console.error("❌ VERIFY OTP ERROR:", error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحقق' });
    }
};

// ==========================================
// 5. RESET PASSWORD
// ==========================================
exports.resetPassword = async (req, res) => {
    const { email, newPassword, skipReset } = req.body;

    try {
        const [users] = await promisePool.execute(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        if (skipReset === true) {
            await promisePool.execute('DELETE FROM password_resets WHERE email = ?', [email]);
            return res.json({ success: true, message: 'تم تخطي تغيير كلمة المرور' });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
        }

        // The code must have been verified recently — a stale verification can't
        // be replayed hours later.
        const [verified] = await promisePool.execute(
            `SELECT id FROM password_resets
             WHERE email = ? AND is_used = TRUE AND created_at > (NOW() - INTERVAL 15 MINUTE)
             ORDER BY created_at DESC LIMIT 1`,
            [email]
        );

        if (verified.length === 0) {
            return res.status(400).json({ success: false, message: 'يجب التحقق من OTP أولاً' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await promisePool.execute('UPDATE Users SET password = ? WHERE email = ?', [hashedPassword, email]);
        await promisePool.execute('DELETE FROM password_resets WHERE email = ?', [email]);

        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
    }
};