const { promisePool } = require("../config/db");
const path = require("path");
const fs   = require("fs");
const { getUserCohort, buildCohortFilter, canViewCohort, normalizeCohortInput } = require("../utils/cohort");

// =====================================================================
// FILE ACCESS GUARD
// =====================================================================
// The list endpoint (getFiles) already filters by cohort, but fetching or
// downloading a file directly by its numeric id must enforce the SAME
// boundaries — otherwise any authenticated user can pull ANY file (other
// cohorts' materials, other groups' uploads, private project deliverables)
// just by iterating the id. A file may be tagged to a course, a group, or a
// project; each has its own visibility rule. Returns true if `user` may
// access `file` (a full Files row).
async function canAccessFile(user, file) {
  if (user.role === "admin") return true;
  if (file.uploader_id === user.id) return true;

  // ── Project deliverable → mirror the project's own visibility rules ──
  if (file.project_id) {
    const [[p]] = await promisePool.query(
      "SELECT creator_id, supervisor_id, open_to_investors, approval_status FROM Projects WHERE id = ?",
      [file.project_id]
    );
    if (!p) return false;
    if (p.creator_id === user.id || p.supervisor_id === user.id) return true;
    const [[member]] = await promisePool.query(
      "SELECT 1 FROM Project_Members WHERE project_id = ? AND user_id = ? LIMIT 1",
      [file.project_id, user.id]
    );
    if (member) return true;
    if (user.role === "investor" && p.open_to_investors && p.approval_status === "approved") return true;
    return false;
  }

  // ── Group upload → members of that group only ──
  if (file.group_id) {
    const [[gm]] = await promisePool.query(
      "SELECT 1 FROM Group_Members WHERE group_id = ? AND user_id = ? LIMIT 1",
      [file.group_id, user.id]
    );
    return !!gm;
  }

  // ── Course material or general library file → cohort visibility ──
  const cohort = await getUserCohort(user);
  return canViewCohort(cohort, file);
}

// =======================
// GET ALL FILES (with filters)
// =======================
exports.getFiles = async (req, res) => {
  try {
    const { subject, year, file_type } = req.query;

    let query = `
      SELECT
        f.*,
        u.username AS uploader_username,
        u.name     AS uploader_name,
        COUNT(DISTINCT fl.id)  AS likes_count,
        COUNT(DISTINCT fc.id)  AS comments_count,
        ROUND(AVG(fr.rating), 1) AS avg_rating,
        EXISTS(SELECT 1 FROM File_Likes WHERE file_id = f.id AND user_id = ?) AS liked_by_me
      FROM Files f
      JOIN Users u ON f.uploader_id = u.id
      LEFT JOIN File_Likes    fl ON fl.file_id = f.id
      LEFT JOIN File_Comments fc ON fc.file_id = f.id
      LEFT JOIN File_Ratings  fr ON fr.file_id = f.id
      WHERE 1=1
    `;

    const params = [req.user.id];

    if (subject) {
      query += " AND f.subject = ?";
      params.push(subject);
    }
    if (year) {
      query += " AND f.academic_year = ?";
      params.push(year);
    }
    if (file_type) {
      query += " AND f.file_type = ?";
      params.push(file_type);
    }

    // Cohort segregation: students only see their own cohort's files (+ global).
    const cohort = await getUserCohort(req.user);
    const cf = buildCohortFilter("f", cohort);
    if (cf) { query += ` AND ${cf.clause}`; params.push(...cf.params); }

    query += " GROUP BY f.id ORDER BY f.created_at DESC";

    const [files] = await promisePool.query(query, params);

    res.json({
      message: "Files fetched",
      data: files
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// =======================
// GET FILE BY ID
// =======================
exports.getFileById = async (req, res) => {
  try {
    const [files] = await promisePool.query(
      `SELECT
         f.*,
         u.username AS uploader_username,
         u.name     AS uploader_name,
         COUNT(DISTINCT fl.id)    AS likes_count,
         COUNT(DISTINCT fc.id)    AS comments_count,
         ROUND(AVG(fr.rating), 1) AS avg_rating,
         EXISTS(SELECT 1 FROM File_Likes WHERE file_id = f.id AND user_id = ?) AS liked_by_me
       FROM Files f
       JOIN Users u ON f.uploader_id = u.id
       LEFT JOIN File_Likes    fl ON fl.file_id = f.id
       LEFT JOIN File_Comments fc ON fc.file_id = f.id
       LEFT JOIN File_Ratings  fr ON fr.file_id = f.id
       WHERE f.id = ?
       GROUP BY f.id`,
      [req.user.id, req.params.id]
    );

    if (files.length === 0) {
      return res.status(404).json({
        message: "File not found"
      });
    }

    if (!(await canAccessFile(req.user, files[0]))) {
      return res.status(403).json({ message: "You do not have access to this file" });
    }

    res.json({
      message: "File fetched",
      data: files[0]
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// =======================
// UPLOAD FILE
// =======================
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const { subject, academic_year, description } = req.body;
    const { originalname, mimetype, size, filename } = req.file;

    const file_url = `/uploads/files/${filename}`;

    // Tag the file with its cohort: a student's upload is forced to their own
    // cohort; a doctor/admin picks the target year/track (else global).
    let fYear = null, fTrack = null;
    if (req.user.role === "student") {
      const cohort = await getUserCohort(req.user);
      if (cohort) { fYear = cohort.year; fTrack = cohort.track; }
    } else {
      const norm = normalizeCohortInput(academic_year, req.body.track);
      fYear = norm.year; fTrack = norm.track;
    }

    // Course material? A file may be attached to a curriculum course. Only the
    // course's assigned doctor (or an admin) may do so, and the material always
    // inherits the course's own cohort — so it lands in the right batch and
    // can't be mis-tagged.
    let courseId = null;
    let courseSubject = null;
    if (req.body.course_id) {
      const [[course]] = await promisePool.query(
        "SELECT id, doctor_id, academic_year, track, title FROM Courses WHERE id = ?",
        [req.body.course_id]
      );
      if (!course) return res.status(404).json({ message: "Course not found" });
      const isAdmin = req.user.role === "admin";
      const isOwnerDoctor = req.user.role === "doctor" && course.doctor_id === req.user.id;
      if (!isAdmin && !isOwnerDoctor) {
        return res.status(403).json({ message: "You can only add materials to a course assigned to you" });
      }
      courseId = course.id;
      fYear = course.academic_year;
      fTrack = course.track;
      courseSubject = course.title;
    }

    // A doctor may give a material a friendly display name; otherwise fall back
    // to the uploaded file's original name.
    const displayName = (req.body.title && String(req.body.title).trim()) || originalname;

    const [result] = await promisePool.query(
      `INSERT INTO Files
         (uploader_id, file_name, file_url, file_type, file_size, subject, academic_year, track, description, course_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        displayName,
        file_url,
        mimetype,
        size,
        subject   || courseSubject || null,
        fYear,
        fTrack,
        description   || null,
        courseId
      ]
    );

    res.status(201).json({
      message: "File uploaded successfully",
      fileId: result.insertId,
      file_url
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// =======================
// DELETE FILE (owner only)
// =======================
exports.deleteFile = async (req, res) => {
  try {
    const [files] = await promisePool.query(
      "SELECT * FROM Files WHERE id = ?",
      [req.params.id]
    );

    if (files.length === 0) {
      return res.status(404).json({
        message: "File not found"
      });
    }

    const file = files[0];

    // المالك يحذف ملفه، والأدمن يحذف أي ملف (للإشراف)
    const isOwner = file.uploader_id === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized — you can only delete your own files"
      });
    }

    // احذف الملف من الـ disk لو موجود
    if (file.file_url) {
      const filePath = path.join(__dirname, "..", file.file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await promisePool.query("DELETE FROM Files WHERE id = ?", [req.params.id]);

    res.json({
      message: "File deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// =======================
// DOWNLOAD FILE
// =======================
exports.downloadFile = async (req, res) => {
  try {
    const [files] = await promisePool.query(
      "SELECT * FROM Files WHERE id = ?",
      [req.params.id]
    );

    if (files.length === 0) {
      return res.status(404).json({
        message: "File not found"
      });
    }

    const file = files[0];

    if (!(await canAccessFile(req.user, file))) {
      return res.status(403).json({ message: "You do not have access to this file" });
    }

    // Resolve the path and confirm it stays inside uploads/ — defence-in-depth
    // against a malformed/legacy file_url escaping the uploads directory.
    const uploadsRoot = path.resolve(__dirname, "..", "uploads");
    const filePath = path.resolve(__dirname, "..", "." + (file.file_url.startsWith("/") ? file.file_url : "/" + file.file_url));
    if (!filePath.startsWith(uploadsRoot + path.sep)) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found on server"
      });
    }

    // Count the download (best-effort — don't block the response if it fails)
    promisePool
      .query("UPDATE Files SET download_count = download_count + 1 WHERE id = ?", [file.id])
      .catch(() => {});

    res.download(filePath, file.file_name);

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// =======================
// LIKE FILE
// =======================
exports.likeFile = async (req, res) => {
  try {
    // تأكد إن الملف موجود
    const [files] = await promisePool.query(
      "SELECT id FROM Files WHERE id = ?",
      [req.params.id]
    );
    if (files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    await promisePool.query(
      "INSERT INTO File_Likes (file_id, user_id) VALUES (?, ?)",
      [req.params.id, req.user.id]
    );

    res.status(201).json({ message: "File liked" });

  } catch (error) {
    // Duplicate entry = already liked
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Already liked" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// UNLIKE FILE
// =======================
exports.unlikeFile = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      "DELETE FROM File_Likes WHERE file_id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Like not found" });
    }

    res.json({ message: "File unliked" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// ADD COMMENT ON FILE
// =======================
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    // تأكد إن الملف موجود
    const [files] = await promisePool.query(
      "SELECT id FROM Files WHERE id = ?",
      [req.params.id]
    );
    if (files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const [result] = await promisePool.query(
      "INSERT INTO File_Comments (file_id, user_id, content) VALUES (?, ?, ?)",
      [req.params.id, req.user.id, content]
    );

    res.status(201).json({
      message: "Comment added",
      commentId: result.insertId
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET COMMENTS FOR FILE
// =======================
exports.getComments = async (req, res) => {
  try {
    const [comments] = await promisePool.query(
      `SELECT 
         fc.*,
         u.username,
         u.name,
         u.profile_picture
       FROM File_Comments fc
       JOIN Users u ON fc.user_id = u.id
       WHERE fc.file_id = ?
       ORDER BY fc.created_at DESC`,
      [req.params.id]
    );

    res.json({
      message: "Comments fetched",
      data: comments
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// RATE FILE
// =======================
exports.rateFile = async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    // تأكد إن الملف موجود
    const [files] = await promisePool.query(
      "SELECT id FROM Files WHERE id = ?",
      [req.params.id]
    );
    if (files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    // INSERT أو UPDATE لو عنده تقييم قبل كده
    await promisePool.query(
      `INSERT INTO File_Ratings (file_id, user_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [req.params.id, req.user.id, rating]
    );

    res.json({ message: "File rated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET AVERAGE RATING
// =======================
exports.getAverageRating = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      `SELECT 
         COUNT(*)              AS total_ratings,
         ROUND(AVG(rating), 1) AS avg_rating
       FROM File_Ratings
       WHERE file_id = ?`,
      [req.params.id]
    );

    res.json({
      message: "Rating fetched",
      data: {
        avg_rating:    result[0].avg_rating || 0,
        total_ratings: result[0].total_ratings
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
