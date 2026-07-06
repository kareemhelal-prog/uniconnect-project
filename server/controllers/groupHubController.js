const { promisePool } = require("../config/db");
const { notify } = require("../utils/notify");

// =====================================================================
// STUDY-GROUP HUB — materials, Q&A, sessions, tasks, flashcards, wiki,
// polls, leaderboard. Every feature is gated to group members (admins
// bypass), and useful contributions award points for the leaderboard.
// =====================================================================

async function memberRole(groupId, userId) {
  const [[m]] = await promisePool.query(
    "SELECT role FROM Group_Members WHERE group_id = ? AND user_id = ? LIMIT 1", [groupId, userId]);
  return m ? m.role : null;
}
// Ensures the requester is a member (or a platform admin). Sends 403 and
// returns null when not; otherwise returns the member role ('admin'/'member').
async function requireMember(req, res) {
  const gid = req.params.id || req.params.groupId;
  if (req.user.role === "admin") return "admin";
  const role = await memberRole(gid, req.user.id);
  if (!role) { res.status(403).json({ message: "Join the group to do this" }); return null; }
  return role;
}
async function award(groupId, userId, pts) {
  try {
    await promisePool.query(
      `INSERT INTO group_points (group_id, user_id, points) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE points = points + VALUES(points)`, [groupId, userId, pts]);
  } catch { /* non-critical */ }
}
// Resolve the group id of a child row (for routes keyed by the child id).
async function groupOf(table, col, id) {
  const [[r]] = await promisePool.query(`SELECT group_id FROM ${table} WHERE ${col} = ?`, [id]);
  return r ? r.group_id : null;
}

/* ═══════════════ FEED (posts, pins, announcements) ═══════════════ */
exports.getPosts = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT gp.id, gp.content, gp.post_type, gp.is_pinned, gp.is_edited, gp.created_at, gp.user_id,
              u.name, u.username, COALESCE(u.profile_picture,'') AS profile_picture, u.role,
              (SELECT COUNT(*) FROM Group_Post_Likes l WHERE l.post_id = gp.id) AS likes,
              EXISTS(SELECT 1 FROM Group_Post_Likes l WHERE l.post_id = gp.id AND l.user_id = ?) AS liked
       FROM Group_Posts gp JOIN Users u ON gp.user_id = u.id
       WHERE gp.group_id = ?
       ORDER BY gp.is_pinned DESC, gp.created_at DESC`,
      [req.user.id, req.params.id]);
    res.json({ data: rows.map(r => ({ ...r, liked: !!r.liked })) });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.createPost = async (req, res) => {
  const role = await requireMember(req, res); if (!role) return;
  const content = (req.body.content || "").trim();
  if (!content) return res.status(400).json({ message: "Content is required" });
  const type = req.body.post_type === "announcement" && role === "admin" ? "announcement" : "post";
  try {
    const [r] = await promisePool.query(
      "INSERT INTO Group_Posts (group_id, user_id, content, post_type) VALUES (?, ?, ?, ?)",
      [req.params.id, req.user.id, content, type]);
    award(req.params.id, req.user.id, 2);
    res.status(201).json({ message: "Posted", id: r.insertId });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.togglePin = async (req, res) => {
  try {
    const gid = await groupOf("Group_Posts", "id", req.params.postId);
    if (!gid) return res.status(404).json({ message: "Post not found" });
    const role = req.user.role === "admin" ? "admin" : await memberRole(gid, req.user.id);
    if (role !== "admin") return res.status(403).json({ message: "Only group admins can pin" });
    const [[p]] = await promisePool.query("SELECT is_pinned FROM Group_Posts WHERE id = ?", [req.params.postId]);
    await promisePool.query("UPDATE Group_Posts SET is_pinned = ? WHERE id = ?", [p.is_pinned ? 0 : 1, req.params.postId]);
    res.json({ pinned: !p.is_pinned });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.likePost = async (req, res) => {
  try { await promisePool.query("INSERT IGNORE INTO Group_Post_Likes (post_id, user_id) VALUES (?, ?)", [req.params.postId, req.user.id]); res.json({ message: "Liked" }); }
  catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.unlikePost = async (req, res) => {
  try { await promisePool.query("DELETE FROM Group_Post_Likes WHERE post_id = ? AND user_id = ?", [req.params.postId, req.user.id]); res.json({ message: "Unliked" }); }
  catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
// Only the post's author may edit it.
exports.editPost = async (req, res) => {
  const content = (req.body.content || "").trim();
  if (!content) return res.status(400).json({ message: "Content is required" });
  try {
    const [[p]] = await promisePool.query("SELECT user_id FROM Group_Posts WHERE id = ?", [req.params.postId]);
    if (!p) return res.status(404).json({ message: "Not found" });
    if (p.user_id !== req.user.id) return res.status(403).json({ message: "Only the author can edit this post" });
    await promisePool.query("UPDATE Group_Posts SET content = ?, is_edited = 1 WHERE id = ?", [content, req.params.postId]);
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
// Only the post's author may delete it.
exports.deletePost = async (req, res) => {
  try {
    const [[p]] = await promisePool.query("SELECT user_id FROM Group_Posts WHERE id = ?", [req.params.postId]);
    if (!p) return res.status(404).json({ message: "Not found" });
    if (p.user_id !== req.user.id) return res.status(403).json({ message: "Only the author can delete this post" });
    await promisePool.query("DELETE FROM Group_Posts WHERE id = ?", [req.params.postId]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ MATERIALS (files) ═══════════════ */
exports.getFiles = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT f.id, f.file_name, f.file_url, f.file_type, f.file_size, f.subject, f.description,
              f.download_count, f.is_edited, f.created_at, f.uploader_id, u.name AS uploader_name,
              (SELECT COUNT(*) FROM File_Likes fl WHERE fl.file_id = f.id) AS likes,
              ROUND(AVG(fr.rating),1) AS avg_rating
       FROM Files f LEFT JOIN Users u ON f.uploader_id = u.id
       LEFT JOIN File_Ratings fr ON fr.file_id = f.id
       WHERE f.group_id = ? GROUP BY f.id ORDER BY f.created_at DESC`, [req.params.id]);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.uploadFile = async (req, res) => {
  const role = await requireMember(req, res); if (!role) return;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const file_url = `/uploads/files/${req.file.filename}`;
    const [r] = await promisePool.query(
      `INSERT INTO Files (uploader_id, file_name, file_url, file_type, file_size, subject, description, group_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.body.title || req.file.originalname, file_url, req.file.mimetype, req.file.size,
       req.body.subject || null, req.body.description || null, req.params.id]);
    award(req.params.id, req.user.id, 5);
    res.status(201).json({ message: "Uploaded", fileId: r.insertId });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.deleteFile = async (req, res) => {
  try {
    const [[f]] = await promisePool.query("SELECT uploader_id, group_id FROM Files WHERE id = ?", [req.params.fileId]);
    if (!f || !f.group_id) return res.status(404).json({ message: "File not found" });
    const isAdmin = req.user.role === "admin" || (await memberRole(f.group_id, req.user.id)) === "admin";
    if (f.uploader_id !== req.user.id && !isAdmin) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("DELETE FROM Files WHERE id = ?", [req.params.fileId]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
// Edit a material's title/description (uploader only).
exports.editFile = async (req, res) => {
  try {
    const [[f]] = await promisePool.query("SELECT uploader_id, group_id, file_name FROM Files WHERE id = ?", [req.params.fileId]);
    if (!f || !f.group_id) return res.status(404).json({ message: "File not found" });
    if (f.uploader_id !== req.user.id) return res.status(403).json({ message: "Only the uploader can edit this" });
    const title = (req.body.title && String(req.body.title).trim()) || f.file_name;
    await promisePool.query("UPDATE Files SET file_name = ?, description = ?, is_edited = 1 WHERE id = ?",
      [title, req.body.description || null, req.params.fileId]);
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ Q&A ═══════════════ */
exports.getQuestions = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT q.id, q.title, q.body, q.is_edited, q.created_at, q.asker_id, u.name AS asker_name,
              (SELECT COUNT(*) FROM group_answers a WHERE a.question_id = q.id) AS answer_count,
              EXISTS(SELECT 1 FROM group_answers a WHERE a.question_id = q.id AND a.is_best = 1) AS solved
       FROM group_questions q JOIN Users u ON q.asker_id = u.id
       WHERE q.group_id = ? ORDER BY q.created_at DESC`, [req.params.id]);
    res.json({ data: rows.map(r => ({ ...r, solved: !!r.solved })) });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.createQuestion = async (req, res) => {
  const role = await requireMember(req, res); if (!role) return;
  const title = (req.body.title || "").trim();
  if (!title) return res.status(400).json({ message: "Question is required" });
  try {
    const [r] = await promisePool.query(
      "INSERT INTO group_questions (group_id, asker_id, title, body) VALUES (?, ?, ?, ?)",
      [req.params.id, req.user.id, title, req.body.body || null]);
    award(req.params.id, req.user.id, 1);
    res.status(201).json({ message: "Question posted", id: r.insertId });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.getAnswers = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT a.id, a.content, a.is_best, a.is_edited, a.created_at, a.user_id, u.name, COALESCE(u.profile_picture,'') AS profile_picture
       FROM group_answers a JOIN Users u ON a.user_id = u.id
       WHERE a.question_id = ? ORDER BY a.is_best DESC, a.created_at ASC`, [req.params.qid]);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
// Question owner: edit / delete.
exports.editQuestion = async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.status(400).json({ message: "Question is required" });
  try {
    const [[q]] = await promisePool.query("SELECT asker_id FROM group_questions WHERE id = ?", [req.params.qid]);
    if (!q) return res.status(404).json({ message: "Not found" });
    if (q.asker_id !== req.user.id) return res.status(403).json({ message: "Only the author can edit this question" });
    await promisePool.query("UPDATE group_questions SET title = ?, body = ?, is_edited = 1 WHERE id = ?", [title, req.body.body || null, req.params.qid]);
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.deleteQuestion = async (req, res) => {
  try {
    const [[q]] = await promisePool.query("SELECT asker_id FROM group_questions WHERE id = ?", [req.params.qid]);
    if (!q) return res.status(404).json({ message: "Not found" });
    if (q.asker_id !== req.user.id) return res.status(403).json({ message: "Only the author can delete this question" });
    await promisePool.query("DELETE FROM group_questions WHERE id = ?", [req.params.qid]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
// Answer owner: edit / delete.
exports.editAnswer = async (req, res) => {
  const content = (req.body.content || "").trim();
  if (!content) return res.status(400).json({ message: "Answer is required" });
  try {
    const [[a]] = await promisePool.query("SELECT user_id FROM group_answers WHERE id = ?", [req.params.aid]);
    if (!a) return res.status(404).json({ message: "Not found" });
    if (a.user_id !== req.user.id) return res.status(403).json({ message: "Only the author can edit this answer" });
    await promisePool.query("UPDATE group_answers SET content = ?, is_edited = 1 WHERE id = ?", [content, req.params.aid]);
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.deleteAnswer = async (req, res) => {
  try {
    const [[a]] = await promisePool.query("SELECT user_id FROM group_answers WHERE id = ?", [req.params.aid]);
    if (!a) return res.status(404).json({ message: "Not found" });
    if (a.user_id !== req.user.id) return res.status(403).json({ message: "Only the author can delete this answer" });
    await promisePool.query("DELETE FROM group_answers WHERE id = ?", [req.params.aid]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.answerQuestion = async (req, res) => {
  const content = (req.body.content || "").trim();
  if (!content) return res.status(400).json({ message: "Answer is required" });
  try {
    const [[q]] = await promisePool.query("SELECT group_id, asker_id, title FROM group_questions WHERE id = ?", [req.params.qid]);
    if (!q) return res.status(404).json({ message: "Question not found" });
    const role = req.user.role === "admin" ? "admin" : await memberRole(q.group_id, req.user.id);
    if (!role) return res.status(403).json({ message: "Join the group to answer" });
    await promisePool.query("INSERT INTO group_answers (question_id, user_id, content) VALUES (?, ?, ?)", [req.params.qid, req.user.id, content]);
    award(q.group_id, req.user.id, 3);
    notify({ userId: q.asker_id, senderId: req.user.id, type: "comment", message: `answered your question "${q.title}"`, referenceId: null }).catch(() => {});
    res.status(201).json({ message: "Answer posted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.markBest = async (req, res) => {
  try {
    const [[a]] = await promisePool.query(
      `SELECT a.user_id, a.question_id, q.asker_id, q.group_id FROM group_answers a JOIN group_questions q ON a.question_id = q.id WHERE a.id = ?`, [req.params.aid]);
    if (!a) return res.status(404).json({ message: "Answer not found" });
    if (a.asker_id !== req.user.id && req.user.role !== "admin") return res.status(403).json({ message: "Only the asker can mark the best answer" });
    await promisePool.query("UPDATE group_answers SET is_best = 0 WHERE question_id = ?", [a.question_id]);
    await promisePool.query("UPDATE group_answers SET is_best = 1 WHERE id = ?", [req.params.aid]);
    award(a.group_id, a.user_id, 5);
    res.json({ message: "Marked as best answer" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ FLASHCARDS ═══════════════ */
// PRIVATE: each user only sees their own flashcards in the group.
exports.getFlashcards = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT fc.id, fc.front, fc.back, fc.topic, fc.is_edited, fc.created_at, fc.creator_id
       FROM group_flashcards fc
       WHERE fc.group_id = ? AND fc.creator_id = ? ORDER BY fc.created_at DESC`,
      [req.params.id, req.user.id]);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.editFlashcard = async (req, res) => {
  const { front, back, topic } = req.body;
  if (!front || !back) return res.status(400).json({ message: "Front and back are required" });
  try {
    const [[fc]] = await promisePool.query("SELECT creator_id FROM group_flashcards WHERE id = ?", [req.params.fid]);
    if (!fc) return res.status(404).json({ message: "Not found" });
    if (fc.creator_id !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("UPDATE group_flashcards SET front = ?, back = ?, topic = ?, is_edited = 1 WHERE id = ?",
      [front, back, topic || null, req.params.fid]);
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.createFlashcard = async (req, res) => {
  const { front, back, topic } = req.body;
  if (!front || !back) return res.status(400).json({ message: "Front and back are required" });
  try {
    await promisePool.query("INSERT INTO group_flashcards (group_id, creator_id, front, back, topic) VALUES (?, ?, ?, ?, ?)",
      [req.params.id, req.user.id, front, back, topic || null]);
    res.status(201).json({ message: "Flashcard added" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.deleteFlashcard = async (req, res) => {
  try {
    const [[fc]] = await promisePool.query("SELECT creator_id FROM group_flashcards WHERE id = ?", [req.params.fid]);
    if (!fc) return res.status(404).json({ message: "Not found" });
    if (fc.creator_id !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("DELETE FROM group_flashcards WHERE id = ?", [req.params.fid]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ WIKI (collaborative summaries) ═══════════════ */
// PRIVATE: each user only sees / edits their own notes in the group.
exports.getWiki = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT id, title, content, is_edited, updated_at FROM group_wiki
       WHERE group_id = ? AND owner_id = ? ORDER BY updated_at DESC`, [req.params.id, req.user.id]);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.createWiki = async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.status(400).json({ message: "Title is required" });
  try {
    const [r] = await promisePool.query("INSERT INTO group_wiki (group_id, title, content, owner_id, updated_by) VALUES (?, ?, ?, ?, ?)",
      [req.params.id, title, req.body.content || null, req.user.id, req.user.id]);
    res.status(201).json({ message: "Note created", id: r.insertId });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.updateWiki = async (req, res) => {
  try {
    const [[w]] = await promisePool.query("SELECT owner_id FROM group_wiki WHERE id = ?", [req.params.wid]);
    if (!w) return res.status(404).json({ message: "Not found" });
    if (w.owner_id !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("UPDATE group_wiki SET title = COALESCE(?, title), content = ?, is_edited = 1 WHERE id = ?",
      [req.body.title || null, req.body.content || null, req.params.wid]);
    res.json({ message: "Saved" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.deleteWiki = async (req, res) => {
  try {
    const [[w]] = await promisePool.query("SELECT owner_id FROM group_wiki WHERE id = ?", [req.params.wid]);
    if (!w) return res.status(404).json({ message: "Not found" });
    if (w.owner_id !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("DELETE FROM group_wiki WHERE id = ?", [req.params.wid]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ SESSIONS + exam countdown ═══════════════ */
exports.getSessions = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT s.id, s.title, s.type, s.scheduled_at, s.location, s.is_edited, s.created_by, u.name AS creator_name,
              (SELECT COUNT(*) FROM group_session_rsvp r WHERE r.session_id = s.id AND r.status = 'going') AS going_count,
              (SELECT status FROM group_session_rsvp r WHERE r.session_id = s.id AND r.user_id = ?) AS my_rsvp
       FROM group_sessions s LEFT JOIN Users u ON s.created_by = u.id
       WHERE s.group_id = ? ORDER BY s.scheduled_at ASC`, [req.user.id, req.params.id]);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.createSession = async (req, res) => {
  const role = await requireMember(req, res); if (!role) return;
  const { title, type, scheduled_at, location } = req.body;
  if (!title || !scheduled_at) return res.status(400).json({ message: "Title and date are required" });
  try {
    await promisePool.query("INSERT INTO group_sessions (group_id, title, type, scheduled_at, location, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [req.params.id, title, type === "exam" ? "exam" : "session", scheduled_at, location || null, req.user.id]);
    res.status(201).json({ message: "Added" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.rsvpSession = async (req, res) => {
  const status = ["going", "maybe", "no"].includes(req.body.status) ? req.body.status : "going";
  try {
    await promisePool.query(
      `INSERT INTO group_session_rsvp (session_id, user_id, status) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`, [req.params.sid, req.user.id, status]);
    res.json({ message: "RSVP saved" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.deleteSession = async (req, res) => {
  try {
    const [[s]] = await promisePool.query("SELECT group_id, created_by FROM group_sessions WHERE id = ?", [req.params.sid]);
    if (!s) return res.status(404).json({ message: "Not found" });
    const isAdmin = req.user.role === "admin" || (await memberRole(s.group_id, req.user.id)) === "admin";
    if (s.created_by !== req.user.id && !isAdmin) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("DELETE FROM group_sessions WHERE id = ?", [req.params.sid]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ TASKS ═══════════════ */
// PRIVATE: a personal to-do list per user inside the group.
exports.getTasks = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT id, title, status, due_date, is_edited, created_at FROM group_tasks
       WHERE group_id = ? AND created_by = ? ORDER BY status, due_date IS NULL, due_date`,
      [req.params.id, req.user.id]);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.createTask = async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.status(400).json({ message: "Title is required" });
  try {
    await promisePool.query("INSERT INTO group_tasks (group_id, title, due_date, created_by) VALUES (?, ?, ?, ?)",
      [req.params.id, title, req.body.due_date || null, req.user.id]);
    res.status(201).json({ message: "Task added" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.updateTask = async (req, res) => {
  try {
    const [[t]] = await promisePool.query("SELECT created_by, status FROM group_tasks WHERE id = ?", [req.params.tid]);
    if (!t) return res.status(404).json({ message: "Not found" });
    if (t.created_by !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    const status = ["todo", "doing", "done"].includes(req.body.status) ? req.body.status : t.status;
    const editedTitle = req.body.title !== undefined && String(req.body.title).trim() ? String(req.body.title).trim() : null;
    await promisePool.query(
      `UPDATE group_tasks SET status = ?, due_date = COALESCE(?, due_date),
              title = COALESCE(?, title), is_edited = IF(? IS NULL, is_edited, 1) WHERE id = ?`,
      [status, req.body.due_date || null, editedTitle, editedTitle, req.params.tid]);
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.deleteTask = async (req, res) => {
  try {
    const [[t]] = await promisePool.query("SELECT created_by FROM group_tasks WHERE id = ?", [req.params.tid]);
    if (!t) return res.status(404).json({ message: "Not found" });
    if (t.created_by !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("DELETE FROM group_tasks WHERE id = ?", [req.params.tid]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ POLLS ═══════════════ */
exports.getPolls = async (req, res) => {
  try {
    const [polls] = await promisePool.query(
      "SELECT p.id, p.question, p.is_edited, p.created_by, p.created_at, u.name AS creator_name FROM group_polls p LEFT JOIN Users u ON p.created_by = u.id WHERE p.group_id = ? ORDER BY p.created_at DESC", [req.params.id]);
    for (const poll of polls) {
      const [opts] = await promisePool.query(
        `SELECT o.id, o.text, (SELECT COUNT(*) FROM group_poll_votes v WHERE v.option_id = o.id) AS votes
         FROM group_poll_options o WHERE o.poll_id = ?`, [poll.id]);
      const [[mine]] = await promisePool.query("SELECT option_id FROM group_poll_votes WHERE poll_id = ? AND user_id = ?", [poll.id, req.user.id]);
      poll.options = opts; poll.my_vote = mine ? mine.option_id : null;
      poll.total = opts.reduce((s, o) => s + Number(o.votes), 0);
    }
    res.json({ data: polls });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.createPoll = async (req, res) => {
  const role = await requireMember(req, res); if (!role) return;
  const question = (req.body.question || "").trim();
  const options = (req.body.options || []).map(o => String(o).trim()).filter(Boolean);
  if (!question || options.length < 2) return res.status(400).json({ message: "A question and at least 2 options are required" });
  try {
    const [r] = await promisePool.query("INSERT INTO group_polls (group_id, question, created_by) VALUES (?, ?, ?)", [req.params.id, question, req.user.id]);
    await promisePool.query("INSERT INTO group_poll_options (poll_id, text) VALUES ?", [options.map(t => [r.insertId, t])]);
    res.status(201).json({ message: "Poll created" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.votePoll = async (req, res) => {
  try {
    const [[opt]] = await promisePool.query("SELECT poll_id FROM group_poll_options WHERE id = ?", [req.body.option_id]);
    if (!opt || opt.poll_id !== Number(req.params.pid)) return res.status(400).json({ message: "Invalid option" });
    await promisePool.query(
      `INSERT INTO group_poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE option_id = VALUES(option_id)`, [req.params.pid, req.body.option_id, req.user.id]);
    res.json({ message: "Voted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

exports.editPoll = async (req, res) => {
  const question = (req.body.question || "").trim();
  if (!question) return res.status(400).json({ message: "Question is required" });
  try {
    const [[p]] = await promisePool.query("SELECT group_id, created_by FROM group_polls WHERE id = ?", [req.params.pid]);
    if (!p) return res.status(404).json({ message: "Not found" });
    const isAdmin = req.user.role === "admin" || (await memberRole(p.group_id, req.user.id)) === "admin";
    if (p.created_by !== req.user.id && !isAdmin) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("UPDATE group_polls SET question = ?, is_edited = 1 WHERE id = ?", [question, req.params.pid]);
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
exports.deletePoll = async (req, res) => {
  try {
    const [[p]] = await promisePool.query("SELECT group_id, created_by FROM group_polls WHERE id = ?", [req.params.pid]);
    if (!p) return res.status(404).json({ message: "Not found" });
    const isAdmin = req.user.role === "admin" || (await memberRole(p.group_id, req.user.id)) === "admin";
    if (p.created_by !== req.user.id && !isAdmin) return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("DELETE FROM group_polls WHERE id = ?", [req.params.pid]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ SESSION EDIT ═══════════════ */
exports.editSession = async (req, res) => {
  try {
    const [[s]] = await promisePool.query("SELECT group_id, created_by FROM group_sessions WHERE id = ?", [req.params.sid]);
    if (!s) return res.status(404).json({ message: "Not found" });
    const isAdmin = req.user.role === "admin" || (await memberRole(s.group_id, req.user.id)) === "admin";
    if (s.created_by !== req.user.id && !isAdmin) return res.status(403).json({ message: "Not authorized" });
    const { title, type, scheduled_at, location } = req.body;
    if (!title || !scheduled_at) return res.status(400).json({ message: "Title and date are required" });
    await promisePool.query(
      "UPDATE group_sessions SET title = ?, type = ?, scheduled_at = ?, location = ?, is_edited = 1 WHERE id = ?",
      [title, type === "exam" ? "exam" : "session", scheduled_at, location || null, req.params.sid]);
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ GROUP INFO (creator/admin edits) ═══════════════ */
exports.updateGroup = async (req, res) => {
  try {
    const [[g]] = await promisePool.query("SELECT creator_id FROM `Groups` WHERE id = ?", [req.params.id]);
    if (!g) return res.status(404).json({ message: "Group not found" });
    const isAdmin = req.user.role === "admin" || (await memberRole(req.params.id, req.user.id)) === "admin";
    if (g.creator_id !== req.user.id && !isAdmin) return res.status(403).json({ message: "Only the group owner can edit this" });
    const name = (req.body.name && String(req.body.name).trim());
    if (!name) return res.status(400).json({ message: "Name is required" });
    await promisePool.query(
      "UPDATE `Groups` SET name = ?, description = COALESCE(?, description), group_image = ? WHERE id = ?",
      [name, req.body.description != null ? String(req.body.description).trim() : null, req.body.group_image || null, req.params.id]);
    res.json({ message: "Group updated" });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};

/* ═══════════════ LEADERBOARD ═══════════════ */
exports.getLeaderboard = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT gp.user_id, gp.points, u.name, u.username, COALESCE(u.profile_picture,'') AS profile_picture
       FROM group_points gp JOIN Users u ON gp.user_id = u.id
       WHERE gp.group_id = ? AND gp.points > 0 ORDER BY gp.points DESC LIMIT 50`, [req.params.id]);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: "Server error", error: e.message }); }
};
