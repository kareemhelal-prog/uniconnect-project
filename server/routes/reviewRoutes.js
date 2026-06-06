const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

// Protect all routes
router.use(authMiddleware);

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