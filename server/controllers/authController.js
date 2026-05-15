const { promisePool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==========================================
// 1. REGISTER (التسجيل والحفظ في الجداول الفرعية)
// ==========================================
exports.register = async (req, res) => {
  const { name, email, password, username, role, academicYear, specialization, phone_number } = req.body;

  // التحقق من الحقول الأساسية
  if (!name || !email || !password || !username || !role) {
    return res.status(400).json({
      message: "Please fill all required fields"
    });
  }

  // التحقق من طول كلمة المرور ليتوافق مع الفرونت اند (7 أحرف)
  if (password.length < 7) {
    return res.status(400).json({
      message: "Password must be at least 7 characters"
    });
  }

  // التحقق من حقول الطالب الإضافية إذا كان الدور student
  if (role === "student" && (!academicYear || !specialization)) {
    return res.status(400).json({
      message: "Academic year and Specialization are required for students"
    });
  }

  // فتح اتصال مخصص للـ Transaction لحماية الداتا من الفساد
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // فحص التكرار للإيميل أو اليوزر نيم
    const [users] = await connection.query(
      "SELECT id FROM Users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (users.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Email or Username already exists"
      });
    }

    // تشفير الباسورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // إدخال البيانات في جدول Users الأساسي
    const [userResult] = await connection.query(
    `INSERT INTO Users (name, email, password, username, role, phone_number) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, hashedPassword, username, role, phone_number || null]
    );

    const userId = userResult.insertId;

    // إدخال البيانات في الجداول الفرعية بناءً على الـ role المختار
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

    // تأكيد حفظ كافة البيانات بنجاح
    await connection.commit();

    return res.status(201).json({
      message: "User registered successfully",
      userId: userId
    });

  } catch (error) {
    // التراجع في حالة حدوث أي مشكلة طارئة
    await connection.rollback();
    console.error("❌ REGISTER ERROR:", error);
    return res.status(500).json({
      message: "Server error"
    });
  } finally {
    // قفل الاتصال ورجعه للـ Pool
    connection.release();
  }
};

// ==========================================
// 2. LOGIN (تسجيل الدخول وإصدار التوكن)
// ==========================================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password required"
    });
  }

  try {
    // جلب بيانات المستخدم بناءً على الإيميل
    const [users] = await promisePool.query(
      "SELECT id, name, email, username, password, role FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = users[0];

    // مقارنة الباسورد المشفر
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Wrong password"
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    // إنشاء الـ Token للمستخدم
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
      }
    );

    // إرسال البيانات والتوكن للفرونت اند
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      }
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};