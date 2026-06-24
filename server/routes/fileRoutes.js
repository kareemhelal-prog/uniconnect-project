const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  getFiles,
  getFileById,
  uploadFile,
  deleteFile,
  downloadFile,
  likeFile,
  unlikeFile,
  addComment,
  getComments,
  rateFile,
  getAverageRating
} = require("../controllers/fileController");

// ==============================
// MULTER CONFIG (Ø±ÙØ¹ Ø§Ù„Ù…Ù„ÙØ§Øª)
// ==============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/files/"); // Ø§Ù„ÙÙˆÙ„Ø¯Ø± Ø§Ù„Ù„ÙŠ Ù‡ÙŠØªØ­ÙØ¸ ÙÙŠÙ‡
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// ÙƒÙ„ Ø§Ù„Ù€ routes Ù…Ø­ØªØ§Ø¬Ø© login
router.use(authenticateToken);

// POST /api/files/upload      â€” Ø§Ø±ÙØ¹ Ù…Ù„Ù Ø¬Ø¯ÙŠØ¯
router.post("/upload", upload.single("file"), uploadFile);

// GET  /api/files             â€” Ø¬ÙŠØ¨ ÙƒÙ„ Ø§Ù„Ù…Ù„ÙØ§Øª Ù…Ø¹ ÙÙ„Ø§ØªØ±
router.get("/", getFiles);

// GET  /api/files/:id         â€” Ø¬ÙŠØ¨ ØªÙØ§ØµÙŠÙ„ Ù…Ù„Ù
router.get("/:id", getFileById);

// DELETE /api/files/:id       â€” Ø§Ø­Ø°Ù Ù…Ù„Ù (ØµØ§Ø­Ø¨Ù‡ Ø¨Ø³)
router.delete("/:id", deleteFile);

// GET  /api/files/:id/download â€” ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù„Ù
router.get("/:id/download", downloadFile);

// POST   /api/files/:id/like  â€” like
router.post("/:id/like", likeFile);

// DELETE /api/files/:id/like  â€” Ø´ÙŠÙ„ Ø§Ù„Ù€ like
router.delete("/:id/like", unlikeFile);

// POST /api/files/:id/comments â€” Ø§Ø¶Ù ÙƒÙˆÙ…Ù†Øª
router.post("/:id/comments", addComment);

// GET  /api/files/:id/comments â€” Ø¬ÙŠØ¨ Ø§Ù„ÙƒÙˆÙ…Ù†ØªØ§Øª
router.get("/:id/comments", getComments);

// POST /api/files/:id/rate    â€” Ù‚ÙŠÙ‘Ù… Ø§Ù„Ù…Ù„Ù
router.post("/:id/rate", rateFile);

// GET  /api/files/:id/rate    â€” Ø¬ÙŠØ¨ Ù…ØªÙˆØ³Ø· Ø§Ù„ØªÙ‚ÙŠÙŠÙ…
router.get("/:id/rate", getAverageRating);

module.exports = router;

