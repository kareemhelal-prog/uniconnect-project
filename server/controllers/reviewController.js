const { promisePool } = require("../config/db");

// =======================
// CREATE REVIEW
// =======================
exports.createReview = async (req, res) => {
  try {
    const { doctor_id, rating, comment, is_anonymous = false } = req.body;

    if (!doctor_id || !rating) {
      return res.status(400).json({ message: "doctor_id and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const [existing] = await promisePool.query(
      `SELECT * FROM Academic_Reviews WHERE doctor_id = ? AND student_id = ?`,
      [doctor_id, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "You already reviewed this doctor" });
    }

    const [result] = await promisePool.query(
      `INSERT INTO Academic_Reviews (doctor_id, student_id, rating, comment, is_anonymous)
       VALUES (?, ?, ?, ?, ?)`,
      [doctor_id, req.user.id, rating, comment, is_anonymous]
    );

    res.status(201).json({ message: "Review created successfully", reviewId: result.insertId });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET REVIEWS BY DOCTOR
// =======================
exports.getReviewsByDoctor = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [reviews] = await promisePool.query(
      `SELECT
        Academic_Reviews.id,
        Academic_Reviews.rating,
        Academic_Reviews.comment,
        Academic_Reviews.is_anonymous,
        Academic_Reviews.created_at,
        Academic_Reviews.student_id,
        CASE
          WHEN Academic_Reviews.is_anonymous = TRUE
          THEN 'Anonymous'
          ELSE Users.name
        END AS student_name,
        (Academic_Reviews.student_id = ?) AS is_mine
       FROM Academic_Reviews
       JOIN Users ON Academic_Reviews.student_id = Users.id
       WHERE Academic_Reviews.doctor_id = ?
       ORDER BY Academic_Reviews.created_at DESC`,
      [currentUserId, req.params.doctorId]
    );

    res.json({ message: "Reviews fetched successfully", data: reviews });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// UPDATE REVIEW
// =======================
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const [reviews] = await promisePool.query(
      `SELECT * FROM Academic_Reviews WHERE id = ?`,
      [req.params.id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (reviews[0].student_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await promisePool.query(
      `UPDATE Academic_Reviews SET rating = ?, comment = ? WHERE id = ?`,
      [rating, comment, req.params.id]
    );

    res.json({ message: "Review updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// DELETE REVIEW
// =======================
exports.deleteReview = async (req, res) => {
  try {
    const [reviews] = await promisePool.query(
      `SELECT * FROM Academic_Reviews WHERE id = ?`,
      [req.params.id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (reviews[0].student_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await promisePool.query(
      `DELETE FROM Academic_Reviews WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: "Review deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};