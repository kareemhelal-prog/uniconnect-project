const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const auth    = require("../middleware/authMiddleware");

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
// MULTER CONFIG (رفع الملفات)
// ==============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/files/"); // الفولدر اللي هيتحفظ فيه
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

// كل الـ routes محتاجة login
router.use(auth);

// POST /api/files/upload      — ارفع ملف جديد
router.post("/upload", upload.single("file"), uploadFile);

// GET  /api/files             — جيب كل الملفات مع فلاتر
router.get("/", getFiles);

// GET  /api/files/:id         — جيب تفاصيل ملف
router.get("/:id", getFileById);

// DELETE /api/files/:id       — احذف ملف (صاحبه بس)
router.delete("/:id", deleteFile);

// GET  /api/files/:id/download — تحميل الملف
router.get("/:id/download", downloadFile);

// POST   /api/files/:id/like  — like
router.post("/:id/like", likeFile);

// DELETE /api/files/:id/like  — شيل الـ like
router.delete("/:id/like", unlikeFile);

// POST /api/files/:id/comments — اضف كومنت
router.post("/:id/comments", addComment);

// GET  /api/files/:id/comments — جيب الكومنتات
router.get("/:id/comments", getComments);

// POST /api/files/:id/rate    — قيّم الملف
router.post("/:id/rate", rateFile);

// GET  /api/files/:id/rate    — جيب متوسط التقييم
router.get("/:id/rate", getAverageRating);

module.exports = router;
