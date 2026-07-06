const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require("../middleware/authMiddleware");
const c = require('../controllers/projectController');

// ── Multer for project uploads (cover images, pitch decks, attachments) ──
const DIR = 'uploads/projects/';
fs.mkdirSync(DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.use(authenticateToken);

// Static-ish lists (before "/:id")
router.get('/leaderboard',       c.getLeaderboard);
router.get('/marketplace',       c.getMarketplace);
router.get('/bookmarks',         c.getMyBookmarks);
router.get('/doctors',           c.getDoctors);
router.get('/supervised',        c.getSupervisedProjects);
router.get('/investor-profile',  c.getInvestorProfile);
router.put('/investor-profile',  c.updateInvestorProfile);
router.post('/upload',           upload.single('file'), c.uploadProjectImage);

router.get('/',                  c.getAllProjects);
router.post('/',                 c.createProject);
router.get('/:id',               c.getProjectById);
router.put('/:id',               c.updateProject);
router.delete('/:id',            c.deleteProject);

// Supervisor / admin
router.post('/:id/review',       c.reviewProject);
router.post('/:id/publish',      c.togglePublish);
router.post('/:id/feature',      c.setFeatured);

// Student (owner)
router.post('/:id/updates',      c.postUpdate);
router.delete('/files/:fileId',  c.deleteProjectFile);

// Investor actions
router.post('/:id/interest',     c.expressInterest);
router.delete('/:id/interest',   c.removeInterest);
router.post('/:id/bookmark',     c.addBookmark);
router.delete('/:id/bookmark',   c.removeBookmark);
router.post('/:id/offer',        c.makeOffer);
router.post('/:id/meeting',      c.requestMeeting);
router.post('/:id/questions',    c.askQuestion);

// Owner responses to offers / meetings / questions
router.post('/offers/:offerId/respond',     c.respondOffer);
router.post('/meetings/:meetingId/respond', c.respondMeeting);
router.post('/questions/:questionId/answer', c.answerQuestion);

// Admin verify investor
router.post('/investors/:userId/verify', c.verifyInvestor);

module.exports = router;
