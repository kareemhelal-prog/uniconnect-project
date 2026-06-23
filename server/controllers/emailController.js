const { promisePool } = require("../config/db");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BATCH_SIZE = 90; // حد Gmail BCC تقريبي — تقسيم الإرسال لباتشات

const sendBatched = async (recipients, subject, html) => {
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await transporter.sendMail({
      to: process.env.EMAIL_USER,
      bcc: batch.map((u) => u.email),
      subject,
      html,
    });
  }
};

// =======================
// SEARCH USERS
// =======================
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ data: [] });
    }
    const term = `%${q.trim()}%`;
    const [users] = await promisePool.query(
      `SELECT id, name, email, role
       FROM Users
       WHERE (name LIKE ? OR email LIKE ?) AND is_active = 1
       LIMIT 10`,
      [term, term]
    );
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// RECIPIENTS COUNT
// =======================
exports.getRecipientsCount = async (req, res) => {
  try {
    const [[{ students }]] = await promisePool.query(
      `SELECT COUNT(*) AS students FROM Users WHERE role = 'student' AND is_active = 1`
    );
    const [[{ doctors }]] = await promisePool.query(
      `SELECT COUNT(*) AS doctors FROM Users WHERE role = 'doctor' AND is_active = 1`
    );
    const [[{ everyone }]] = await promisePool.query(
      `SELECT COUNT(*) AS everyone FROM Users WHERE is_active = 1`
    );
    res.json({ data: { students, doctors, everyone } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// SEND EMAIL
// =======================
exports.sendEmail = async (req, res) => {
  const { recipient_type, recipient_id, subject, message, message_type } = req.body;

  if (!recipient_type || !subject || !message) {
    return res.status(400).json({ message: "recipient_type, subject and message are required" });
  }

  const validTypes = ["Good News", "Neutral", "Warning"];
  const msgType = validTypes.includes(message_type) ? message_type : "Neutral";

  try {
    let recipients = [];
    let recipientCountSnapshot = null;

    if (recipient_type === "user") {
      if (!recipient_id) {
        return res.status(400).json({ message: "recipient_id is required" });
      }
      const [users] = await promisePool.query(
        "SELECT id, name, email FROM Users WHERE id = ?",
        [recipient_id]
      );
      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      recipients = users;
    } else if (recipient_type === "all_students") {
      [recipients] = await promisePool.query(
        "SELECT id, name, email FROM Users WHERE role = 'student' AND is_active = 1"
      );
      recipientCountSnapshot = recipients.length;
    } else if (recipient_type === "all_doctors") {
      [recipients] = await promisePool.query(
        "SELECT id, name, email FROM Users WHERE role = 'doctor' AND is_active = 1"
      );
      recipientCountSnapshot = recipients.length;
    } else if (recipient_type === "everyone") {
      [recipients] = await promisePool.query(
        "SELECT id, name, email FROM Users WHERE is_active = 1"
      );
      recipientCountSnapshot = recipients.length;
    } else {
      return res.status(400).json({ message: "Invalid recipient_type" });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ message: "No recipients found" });
    }

    const html = `
      <div style="font-family:Segoe UI, sans-serif;">
        <h2>UniConnect</h2>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      </div>
    `;

    if (recipient_type === "user") {
      await transporter.sendMail({ to: recipients[0].email, subject, html });
    } else {
      await sendBatched(recipients, subject, html);
    }

    const [result] = await promisePool.query(
      `INSERT INTO Email_Logs
        (sender_id, recipient_type, recipient_id, recipient_count, subject, message, message_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        recipient_type,
        recipient_type === "user" ? recipient_id : null,
        recipientCountSnapshot,
        subject,
        message,
        msgType,
      ]
    );

    res.status(201).json({ message: "Email sent successfully", logId: result.insertId });
  } catch (error) {
    console.error("sendEmail error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// EMAIL HISTORY
// =======================
exports.getEmailHistory = async (req, res) => {
  try {
    const [logs] = await promisePool.query(`
      SELECT
        el.id, el.recipient_type, el.recipient_count,
        el.subject, el.message, el.message_type, el.created_at,
        sender.name AS sender_name,
        ru.id    AS recipient_user_id,
        ru.name  AS recipient_user_name,
        ru.email AS recipient_user_email
      FROM Email_Logs el
      JOIN Users sender ON el.sender_id = sender.id
      LEFT JOIN Users ru ON el.recipient_id = ru.id
      ORDER BY el.created_at DESC
    `);

    res.json({ data: logs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};