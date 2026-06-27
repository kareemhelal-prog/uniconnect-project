const { promisePool } = require("../config/db");

// =======================
// CREATE REVIEW
// =======================
exports.createReview = async (req, res) => {
  try {

    const {
      doctor_id,
      rating,
      comment,
      is_anonymous = false
    } = req.body;

    if (!doctor_id || !rating) {
      return res.status(400).json({
        message: "doctor_id and rating are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    const [existing] = await promisePool.query(
      `SELECT * FROM Academic_Reviews
       WHERE doctor_id = ? AND student_id = ?`,
      [doctor_id, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "You already reviewed this doctor"
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO Academic_Reviews
       (doctor_id, student_id, rating, comment, is_anonymous)
       VALUES (?, ?, ?, ?, ?)`,
      [doctor_id, req.user.id, rating, comment, is_anonymous]
    );

    res.status(201).json({
      message: "Review created successfully",
      reviewId: result.insertId
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET REVIEWS BY DOCTOR  (role-based visibility)
// -----------------------------------------------
// Privacy rules (enforced here, server-side):
//   • student → sees ONLY their own review for the doctor
//   • doctor  → sees ALL reviews written about THEMSELVES, and may not view
//               another doctor's reviews at all
//   • admin   → sees everything (moderation)
// =======================
exports.getReviewsByDoctor = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const { id: userId, role } = req.user;

    // A doctor can only ever look at their own reviews
    if (role === "doctor" && doctorId !== Number(userId)) {
      return res.status(403).json({
        message: "Doctors can only view reviews written about themselves"
      });
    }

    // Visibility filter: students are restricted to their own review
    let visibility = "";
    const params = [userId, doctorId]; // userId → is_mine, doctorId → WHERE
    if (role === "student") {
      visibility = "AND ar.student_id = ?";
      params.push(userId);
    }

    const [reviews] = await promisePool.query(
      `SELECT
        ar.id,
        ar.rating,
        ar.comment,
        ar.is_anonymous,
        ar.created_at,
        ar.student_id,
        (ar.student_id = ?) AS is_mine,
        CASE
          WHEN ar.is_anonymous = TRUE THEN 'Anonymous'
          ELSE u.name
        END AS student_name
       FROM Academic_Reviews ar
       JOIN Users u ON ar.student_id = u.id
       WHERE ar.doctor_id = ? ${visibility}
       ORDER BY ar.created_at DESC`,
      params
    );

    res.json({
      message: "Reviews fetched successfully",
      data: reviews
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET ALL REVIEWS (ADMIN)
// =======================
exports.getAllReviewsAdmin = async (req, res) => {
  try {

    const [reviews] = await promisePool.query(
      `SELECT
        ar.id,
        ar.rating,
        ar.comment,
        ar.is_anonymous,
        ar.created_at,

        d.id AS doctor_id,
        d.name AS doctor_name,
        d.profile_picture AS doctor_avatar,
        dp.specialization AS doctor_specialty,

        s.id AS student_id,
        s.name AS student_name,
        s.profile_picture AS student_avatar,
        ps.academic_year AS student_year,

        (SELECT ROUND(AVG(rating), 1) FROM Academic_Reviews WHERE doctor_id = ar.doctor_id) AS doctor_avg_rating,
        (SELECT COUNT(*) FROM Academic_Reviews WHERE doctor_id = ar.doctor_id) AS doctor_review_count

       FROM Academic_Reviews ar
       JOIN Users d ON ar.doctor_id = d.id
       LEFT JOIN Doctor_Profiles dp ON dp.user_id = d.id
       JOIN Users s ON ar.student_id = s.id
       LEFT JOIN Profile_Studies ps ON ps.user_id = s.id
       ORDER BY ar.created_at DESC`
    );

    res.json({
      message: "Reviews fetched successfully",
      data: reviews
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
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
      return res.status(404).json({
        message: "Review not found"
      });
    }

    const review = reviews[0];

    const isOwner = review.student_id === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    await promisePool.query(
      `DELETE FROM Academic_Reviews WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      message: "Review deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
