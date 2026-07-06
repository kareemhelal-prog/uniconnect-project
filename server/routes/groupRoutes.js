const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const groupController = require("../controllers/groupController");
const hub = require("../controllers/groupHubController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Materials are stored alongside the normal file library so the existing
// authenticated download endpoint (/api/files/:id/download) serves them.
const FILE_DIR = "uploads/files/";
fs.mkdirSync(FILE_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FILE_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticateToken);

// ── Admin: group approval (literal "admin" prefix → before "/:id") ──
router.get("/admin/pending",     groupController.getPendingGroups);
router.post("/admin/:id/approve", groupController.approveGroup);
router.post("/admin/:id/reject",  groupController.rejectGroup);

// ── Core group ──
router.get("/",             groupController.getAllGroups);
router.get("/my-groups",    groupController.getMyGroups);
router.post("/join",        groupController.joinGroup);
router.delete("/leave",     groupController.leaveGroup);
router.post("/",            groupController.createGroup);

// ── Child-id actions (literal prefixes → declared before "/:id") ──
router.post("/posts/:postId/pin",     hub.togglePin);
router.post("/posts/:postId/like",    hub.likePost);
router.delete("/posts/:postId/like",  hub.unlikePost);
router.put("/posts/:postId",          hub.editPost);
router.delete("/posts/:postId",       hub.deletePost);

router.get("/questions/:qid/answers", hub.getAnswers);
router.post("/questions/:qid/answers", hub.answerQuestion);
router.put("/questions/:qid",         hub.editQuestion);
router.delete("/questions/:qid",      hub.deleteQuestion);
router.post("/answers/:aid/best",     hub.markBest);
router.put("/answers/:aid",           hub.editAnswer);
router.delete("/answers/:aid",        hub.deleteAnswer);

router.put("/flashcards/:fid",        hub.editFlashcard);
router.delete("/flashcards/:fid",     hub.deleteFlashcard);
router.put("/wiki/:wid",              hub.updateWiki);
router.delete("/wiki/:wid",           hub.deleteWiki);

router.post("/sessions/:sid/rsvp",    hub.rsvpSession);
router.put("/sessions/:sid",          hub.editSession);
router.delete("/sessions/:sid",       hub.deleteSession);

router.put("/tasks/:tid",             hub.updateTask);
router.delete("/tasks/:tid",          hub.deleteTask);

router.post("/polls/:pid/vote",       hub.votePoll);
router.put("/polls/:pid",             hub.editPoll);
router.delete("/polls/:pid",          hub.deletePoll);
router.put("/files/:fileId",          hub.editFile);
router.delete("/files/:fileId",       hub.deleteFile);

// ── Group-scoped feature lists/creates ──
router.get("/:id/posts",       hub.getPosts);
router.post("/:id/posts",      hub.createPost);
router.get("/:id/files",       hub.getFiles);
router.post("/:id/files",      upload.single("file"), hub.uploadFile);
router.get("/:id/questions",   hub.getQuestions);
router.post("/:id/questions",  hub.createQuestion);
router.get("/:id/flashcards",  hub.getFlashcards);
router.post("/:id/flashcards", hub.createFlashcard);
router.get("/:id/wiki",        hub.getWiki);
router.post("/:id/wiki",       hub.createWiki);
router.get("/:id/sessions",    hub.getSessions);
router.post("/:id/sessions",   hub.createSession);
router.get("/:id/tasks",       hub.getTasks);
router.post("/:id/tasks",      hub.createTask);
router.get("/:id/polls",       hub.getPolls);
router.post("/:id/polls",      hub.createPoll);
router.get("/:id/leaderboard", hub.getLeaderboard);

// ── Core group by id (declared last) ──
router.get("/:id/members",     groupController.getGroupMembers);
router.get("/:id",             groupController.getGroupById);
router.put("/:id",             hub.updateGroup);
router.post("/:id/join",       groupController.joinGroup);
router.delete("/:id/leave",    groupController.leaveGroup);
router.delete("/:id",          groupController.deleteGroup);

module.exports = router;
