const { promisePool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==========================================
// 1. REGISTER
// ==========================================
exports.register = async (req, res) => {
  const { email, password, username, role, academicYear, specialization, phone_number } = req.body;
  const name = req.body.name || username;

  if (!email || !password || !username || !role) {
    return res.status(400).json({ message: "Please fill all required fields" });
  }

  if (password.length < 7) {
    return res.status(400).json({ message: "Password must be at least 7 characters" });
  }

  if (role === "student" && (!academicYear || !specialization)) {
    return res.status(400).json({ message: "Academic year and Specialization are required for students" });
  }

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const [users] = await connection.query(
      "SELECT id FROM Users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (users.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Email or Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO Users (name, email, password, username, role, phone_number) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, username, role, phone_number || null]
    );

    const userId = userResult.insertId;

    if (role === "student") {
      await connection.query(
        `INSERT INTO Profile_Studies (user_id, faculty, major, academic_year) VALUES (?, ?, ?, ?)`,
        [userId, "General Faculty", specialization, academicYear]
      );
    } else if (role === "doctor") {
      await connection.query(
        `INSERT INTO Doctor_Profiles (user_id, faculty, specialization) VALUES (?, ?, ?)`,
        [userId, "General Faculty", specialization || "General"]
      );
    } else if (role === "investor") {
      await connection.query(
        `INSERT INTO Investor_Profiles (user_id, company_name) VALUES (?, ?)`,
        [userId, "Independent Investor"]
      );
    }

    await connection.commit();
    return res.status(201).json({ message: "User registered successfully", userId });

  } catch (error) {
    await connection.rollback();
    console.error("❌ REGISTER ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};

// ==========================================
// 2. LOGIN
// ==========================================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const [users] = await promisePool.query(
      "SELECT id, name, email, username, password, role FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role }
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

    try {
        const [users] = await promisePool.execute(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'البريد الإلكتروني غير موجود' });
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

        res.json({ success: true, message: 'تم إرسال رمز التحقق' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
    }
};

// ==========================================
// 4. VERIFY OTP
// ==========================================
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const [records] = await promisePool.execute(
            `SELECT * FROM password_resets
             WHERE email = ? AND otp = ? AND is_used = FALSE AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [email, otp]
        );

        if (records.length === 0) {
            return res.status(400).json({ success: false, message: 'OTP غير صحيح أو منتهي' });
        }

        await promisePool.execute(
            'UPDATE password_resets SET is_used = TRUE WHERE id = ?',
            [records[0].id]
        );

        res.json({ success: true, message: 'تم التحقق بنجاح' });

    } catch (error) {
        console.error(error);
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

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        }

        const [verified] = await promisePool.execute(
            'SELECT * FROM password_resets WHERE email = ? AND is_used = TRUE ORDER BY created_at DESC LIMIT 1',
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