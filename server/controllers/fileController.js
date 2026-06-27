const { promisePool } = require("../config/db");
const path = require("path");
const fs   = require("fs");

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

    query += " GROUP BY f.id ORDER BY f.created_at DESC";

    const [files] = await promisePool.query(query, params);

    res.json({
      message: "Files fetched",
      data: files
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
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

    res.json({
      message: "File fetched",
      data: files[0]
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
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

    const [result] = await promisePool.query(
      `INSERT INTO Files 
         (uploader_id, file_name, file_url, file_type, file_size, subject, academic_year, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        originalname,
        file_url,
        mimetype,
        size,
        subject   || null,
        academic_year || null,
        description   || null
      ]
    );

    res.status(201).json({
      message: "File uploaded successfully",
      fileId: result.insertId,
      file_url
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
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
      message: "Server error",
      error: error.message
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
    const filePath = path.join(__dirname, "..", file.file_url);

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
      message: "Server error",
      error: error.message
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
    res.status(500).json({ message: "Server error", error: error.message });
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
    res.status(500).json({ message: "Server error", error: error.message });
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
    res.status(500).json({ message: "Server error", error: error.message });
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
    res.status(500).json({ message: "Server error", error: error.message });
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
    res.status(500).json({ message: "Server error", error: error.message });
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
