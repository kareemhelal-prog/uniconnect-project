const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", reviewController.createReview);
router.get("/doctor/:doctorId", reviewController.getReviewsByDoctor);
router.put("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

module.exports = router;