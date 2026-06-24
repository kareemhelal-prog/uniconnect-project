const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const { authenticateToken } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Protect all routes
router.use(authenticateToken);

// Get All Reviews (Admin only)
router.get(
  "/admin/all",
  adminMiddleware,
  reviewController.getAllReviewsAdmin
);

// Create Review
router.post("/", reviewController.createReview);

// Get Reviews By Doctor
router.get(
  "/doctor/:doctorId",
  reviewController.getReviewsByDoctor
);

// Delete Review
router.delete(
  "/:id",
  reviewController.deleteReview
);

module.exports = router;
