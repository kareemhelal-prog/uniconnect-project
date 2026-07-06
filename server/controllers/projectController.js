const { promisePool } = require('../config/db');
const { logEvent } = require('../utils/logEvent');
const { notify } = require('../utils/notify');
const { getUserCohort, buildCohortFilter, canViewCohort } = require('../utils/cohort');

// =====================================================================
// PROJECTS — student creates & picks a supervising doctor; the supervisor
// reviews, approves/rates, and is the ONLY one who publishes it to the
// investor marketplace. Investors then discover, make offers, request
// meetings, ask questions, and follow milestone updates.
// =====================================================================

const fundingExpr = `(SELECT COALESCE(SUM(o.amount),0) FROM project_offers o WHERE o.project_id = p.id AND o.status <> 'declined')`;

// ── Create (student) ──
const createProject = async (req, res) => {
  const creator_id = req.user.id;
  const {
    title, description, project_type, status, required_funding,
    github_link, demo_url, video_url, image_url, pitch_deck_url,
    looking_for, supervisor_id, attachments,
  } = req.body;

  if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });

  try {
    let pYear = null, pTrack = null;
    if (req.user.role === 'student') {
      const cohort = await getUserCohort(req.user);
      if (cohort) { pYear = cohort.year; pTrack = cohort.track; }
    }

    // Validate the chosen supervisor is actually a doctor.
    let supId = supervisor_id ? Number(supervisor_id) : null;
    if (supId) {
      const [[doc]] = await promisePool.query("SELECT id, name FROM Users WHERE id = ? AND role = 'doctor'", [supId]);
      if (!doc) return res.status(400).json({ message: 'Please choose a valid supervising doctor' });
    }

    const [result] = await promisePool.query(
      `INSERT INTO Projects
         (creator_id, title, description, project_type, status, required_funding,
          github_link, demo_url, video_url, image_url, pitch_deck_url, looking_for,
          supervisor_id, approval_status, open_to_investors, academic_year, track)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
      [creator_id, title, description, project_type || 'Other', status || 'idea', required_funding || 0,
       github_link || null, demo_url || null, video_url || null, image_url || null, pitch_deck_url || null,
       looking_for || null, supId, pYear, pTrack]
    );
    const projectId = result.insertId;

    // Link uploaded attachments (already uploaded → { url, name, size, type }).
    if (Array.isArray(attachments) && attachments.length) {
      const rows = attachments.filter(a => a && a.url).map(a => [creator_id, a.name || 'file', a.url, a.type || null, a.size || null, projectId]);
      if (rows.length) {
        await promisePool.query(
          "INSERT INTO Files (uploader_id, file_name, file_url, file_type, file_size, project_id) VALUES ?",
          [rows]
        );
      }
    }

    // Notify the supervisor there's a project awaiting review.
    if (supId) {
      notify({ userId: supId, senderId: creator_id, type: 'project',
        message: `${req.user.name || 'A student'} asked you to supervise their project "${title}"`,
        referenceId: projectId }).catch(() => {});
    }
    logEvent({ actorId: creator_id, type: 'project_create', targetType: 'project', targetId: projectId, summary: title });

    res.status(201).json({ message: 'Project created', project_id: projectId });
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Update (creator edits content only; not approval/publish) ──
const updateProject = async (req, res) => {
  const { id } = req.params;
  try {
    const [[project]] = await promisePool.query('SELECT * FROM Projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const b = req.body;
    const fields = {
      title: b.title ?? project.title,
      description: b.description ?? project.description,
      project_type: b.project_type ?? project.project_type,
      status: b.status ?? project.status,
      required_funding: b.required_funding ?? project.required_funding,
      github_link: b.github_link ?? project.github_link,
      demo_url: b.demo_url ?? project.demo_url,
      video_url: b.video_url ?? project.video_url,
      image_url: b.image_url ?? project.image_url,
      pitch_deck_url: b.pitch_deck_url ?? project.pitch_deck_url,
      looking_for: b.looking_for ?? project.looking_for,
    };
    // Changing the supervisor resets the review.
    let supId = project.supervisor_id, resetReview = false;
    if (b.supervisor_id !== undefined && Number(b.supervisor_id) !== project.supervisor_id) {
      supId = b.supervisor_id ? Number(b.supervisor_id) : null;
      resetReview = true;
    }

    await promisePool.query(
      `UPDATE Projects SET title=?, description=?, project_type=?, status=?, required_funding=?,
              github_link=?, demo_url=?, video_url=?, image_url=?, pitch_deck_url=?, looking_for=?,
              supervisor_id=?${resetReview ? ", approval_status='pending', open_to_investors=0" : ''}
       WHERE id=?`,
      [fields.title, fields.description, fields.project_type, fields.status, fields.required_funding,
       fields.github_link, fields.demo_url, fields.video_url, fields.image_url, fields.pitch_deck_url,
       fields.looking_for, supId, id]
    );

    if (Array.isArray(b.attachments) && b.attachments.length) {
      const rows = b.attachments.filter(a => a && a.url).map(a => [req.user.id, a.name || 'file', a.url, a.type || null, a.size || null, id]);
      if (rows.length) await promisePool.query("INSERT INTO Files (uploader_id, file_name, file_url, file_type, file_size, project_id) VALUES ?", [rows]);
    }
    if (resetReview && supId) {
      notify({ userId: supId, senderId: req.user.id, type: 'project',
        message: `${req.user.name || 'A student'} asked you to supervise their project "${fields.title}"`, referenceId: Number(id) }).catch(() => {});
    }
    res.json({ message: 'Project updated' });
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── List doctors (supervisor picker) ──
const getDoctors = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT u.id, u.name, u.username, COALESCE(u.profile_picture,'') AS profile_picture,
              dp.specialization, dp.faculty
       FROM Users u LEFT JOIN Doctor_Profiles dp ON dp.user_id = u.id
       WHERE u.role = 'doctor' AND u.account_status = 'approved'
       ORDER BY u.name`
    );
    res.json(rows);
  } catch (err) {
    console.error('getDoctors error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Project list — STRICTLY scoped: a student sees only their own projects,
// a doctor only the ones they supervise, an admin sees everything. No student
// can see another student's project. (Investors use /marketplace.)
const getAllProjects = async (req, res) => {
  const { project_type, status } = req.query;
  const where = []; const params = [];
  if (req.user.role === 'student')      { where.push('p.creator_id = ?');    params.push(req.user.id); }
  else if (req.user.role === 'doctor')  { where.push('p.supervisor_id = ?'); params.push(req.user.id); }
  else if (req.user.role !== 'admin')   { return res.json([]); } // investors etc. → nothing here
  if (project_type) { where.push('p.project_type = ?'); params.push(project_type); }
  if (status)       { where.push('p.status = ?'); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const [rows] = await promisePool.query(
      `SELECT p.*, u.name AS creator_name, COALESCE(u.profile_picture,'') AS profile_picture,
              d.name AS supervisor_name,
              (SELECT COUNT(*) FROM Project_Members pm WHERE pm.project_id = p.id) AS members_count,
              (SELECT COUNT(*) FROM Project_Interests pi WHERE pi.project_id = p.id) AS interest_count
       FROM Projects p JOIN Users u ON p.creator_id = u.id
       LEFT JOIN Users d ON p.supervisor_id = d.id
       ${whereSql} ORDER BY p.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllProjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Doctor: projects I supervise ──
const getSupervisedProjects = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT p.*, u.name AS creator_name, COALESCE(u.profile_picture,'') AS profile_picture,
              (SELECT COUNT(*) FROM Files f WHERE f.project_id = p.id) AS files_count,
              (SELECT COUNT(*) FROM Project_Interests pi WHERE pi.project_id = p.id) AS interest_count
       FROM Projects p JOIN Users u ON p.creator_id = u.id
       WHERE p.supervisor_id = ?
       ORDER BY (p.approval_status = 'pending') DESC, p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getSupervisedProjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Supervisor: review (approve / reject / request revision) + rate + publish ──
const reviewProject = async (req, res) => {
  const { id } = req.params;
  const { decision, feedback, rating, publish } = req.body; // decision: approved|rejected|revision
  if (!['approved', 'rejected', 'revision'].includes(decision)) {
    return res.status(400).json({ message: 'Invalid decision' });
  }
  try {
    const [[project]] = await promisePool.query('SELECT * FROM Projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isSupervisor = project.supervisor_id === req.user.id;
    if (!isSupervisor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the supervising doctor can review this project' });
    }

    // Publishing to investors requires approval.
    const openToInvestors = decision === 'approved' && publish ? 1 : 0;
    await promisePool.query(
      "UPDATE Projects SET approval_status = ?, supervisor_feedback = ?, open_to_investors = ? WHERE id = ?",
      [decision, feedback || null, openToInvestors, id]
    );

    // Store the supervisor's rating + note as the endorsement (trust signal).
    if (decision === 'approved') {
      await promisePool.query(
        `INSERT INTO project_endorsements (project_id, doctor_id, note, rating)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE note = VALUES(note), rating = VALUES(rating)`,
        [id, req.user.id, feedback || null, rating ? Number(rating) : null]
      );
    }

    const msg = decision === 'approved'
      ? `Dr. ${req.user.name} approved your project "${project.title}"${openToInvestors ? ' and published it to investors' : ''}`
      : decision === 'revision'
      ? `Dr. ${req.user.name} requested changes on your project "${project.title}"`
      : `Dr. ${req.user.name} did not approve your project "${project.title}"`;
    notify({ userId: project.creator_id, senderId: req.user.id, type: 'project', message: msg, referenceId: Number(id) }).catch(() => {});

    res.json({ message: 'Review saved' });
  } catch (err) {
    console.error('reviewProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Supervisor/admin: toggle investor visibility (must be approved) ──
const togglePublish = async (req, res) => {
  const { id } = req.params;
  try {
    const [[project]] = await promisePool.query('SELECT * FROM Projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.supervisor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the supervising doctor can publish this project' });
    }
    if (project.approval_status !== 'approved') {
      return res.status(400).json({ message: 'Approve the project before publishing it to investors' });
    }
    const next = project.open_to_investors ? 0 : 1;
    await promisePool.query('UPDATE Projects SET open_to_investors = ? WHERE id = ?', [next, id]);
    if (next) notify({ userId: project.creator_id, senderId: req.user.id, type: 'project', message: `Your project "${project.title}" is now live for investors`, referenceId: Number(id) }).catch(() => {});
    res.json({ message: next ? 'Published to investors' : 'Unpublished', open_to_investors: next });
  } catch (err) {
    console.error('togglePublish error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Admin: feature "project of the week" ──
const setFeatured = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  try {
    await promisePool.query('UPDATE Projects SET featured = ? WHERE id = ?', [req.body.featured ? 1 : 0, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Investor marketplace (approved + published) ──
const getMarketplace = async (req, res) => {
  const { project_type, status, q, sort } = req.query;
  const viewerId = req.user.id;
  const where = ["p.open_to_investors = 1", "p.approval_status = 'approved'"];
  // 5 viewer-scoped subqueries in the SELECT (interested, bookmarked, offer
  // exists, offer amount, offer status) → 5 leading viewerId params.
  const params = [viewerId, viewerId, viewerId, viewerId, viewerId];
  if (project_type) { where.push('p.project_type = ?'); params.push(project_type); }
  if (status)       { where.push('p.status = ?'); params.push(status); }
  if (q)            { where.push('(p.title LIKE ? OR p.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const order = sort === 'funding' ? `${fundingExpr} DESC` : sort === 'new' ? 'p.created_at DESC' : 'interest_count DESC';

  try {
    const [rows] = await promisePool.query(
      `SELECT p.id, p.title, p.description, p.project_type, p.status, p.required_funding,
              p.image_url, p.looking_for, p.featured, p.created_at,
              u.name AS creator_name, COALESCE(u.profile_picture,'') AS profile_picture,
              d.name AS supervisor_name,
              (SELECT ROUND(AVG(rating),1) FROM project_endorsements pe WHERE pe.project_id = p.id) AS rating,
              (SELECT COUNT(*) FROM Project_Interests pi WHERE pi.project_id = p.id) AS interest_count,
              (SELECT COUNT(*) FROM Project_Members pm WHERE pm.project_id = p.id) AS members_count,
              ${fundingExpr} AS funding_raised,
              EXISTS(SELECT 1 FROM Project_Interests pi WHERE pi.project_id = p.id AND pi.investor_id = ?) AS my_interested,
              EXISTS(SELECT 1 FROM project_bookmarks pb WHERE pb.project_id = p.id AND pb.investor_id = ?) AS my_bookmarked,
              EXISTS(SELECT 1 FROM project_offers po WHERE po.project_id = p.id AND po.investor_id = ?) AS my_offer,
              (SELECT po2.amount FROM project_offers po2 WHERE po2.project_id = p.id AND po2.investor_id = ?) AS my_offer_amount,
              (SELECT po3.status  FROM project_offers po3 WHERE po3.project_id = p.id AND po3.investor_id = ?) AS my_offer_status
       FROM Projects p JOIN Users u ON p.creator_id = u.id
       LEFT JOIN Users d ON p.supervisor_id = d.id
       WHERE ${where.join(' AND ')}
       ORDER BY p.featured DESC, ${order}`,
      params
    );
    res.json(rows.map(r => ({ ...r, my_interested: !!r.my_interested, my_bookmarked: !!r.my_bookmarked, my_offer: !!r.my_offer })));
  } catch (err) {
    console.error('getMarketplace error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Project detail (role-aware) ──
const getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const [[project]] = await promisePool.query(
      `SELECT p.*, u.name AS creator_name, COALESCE(u.profile_picture,'') AS profile_picture,
              d.name AS supervisor_name, COALESCE(d.profile_picture,'') AS supervisor_picture,
              (SELECT COUNT(*) FROM Project_Interests pi WHERE pi.project_id = p.id) AS interest_count,
              (SELECT ROUND(AVG(rating),1) FROM project_endorsements pe WHERE pe.project_id = p.id) AS rating,
              ${fundingExpr} AS funding_raised
       FROM Projects p JOIN Users u ON p.creator_id = u.id
       LEFT JOIN Users d ON p.supervisor_id = d.id
       WHERE p.id = ?`, [id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = Number(project.creator_id) === Number(req.user.id);
    const isSupervisor = Number(project.supervisor_id) === Number(req.user.id);
    const isAdmin = req.user.role === 'admin';
    const isInvestor = req.user.role === 'investor';
    const isPublished = project.open_to_investors && project.approval_status === 'approved';

    // Strict visibility: only the creator, the supervising doctor, the admin,
    // or an investor (for a published project) may open it. No other student.
    if (!(isOwner || isSupervisor || isAdmin || (isInvestor && isPublished))) {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }

    const [members] = await promisePool.query(
      `SELECT u.id, u.name, COALESCE(u.profile_picture,'') AS profile_picture
       FROM Project_Members pm JOIN Users u ON pm.user_id = u.id WHERE pm.project_id = ?`, [id]);
    const [files] = await promisePool.query(
      `SELECT id, file_name, file_url, file_type, file_size, created_at FROM Files WHERE project_id = ? ORDER BY created_at`, [id]);
    const [endorsements] = await promisePool.query(
      `SELECT pe.doctor_id, pe.note, pe.rating, u.name AS doctor_name FROM project_endorsements pe
       JOIN Users u ON pe.doctor_id = u.id WHERE pe.project_id = ? ORDER BY pe.created_at DESC`, [id]);
    const [updates] = await promisePool.query(
      `SELECT id, content, created_at FROM project_updates WHERE project_id = ? ORDER BY created_at DESC`, [id]);
    const [questions] = await promisePool.query(
      `SELECT q.id, q.question, q.answer, q.answered_at, q.created_at, q.asker_id,
              u.name AS asker_name, ip.verified AS asker_verified
       FROM project_questions q JOIN Users u ON q.asker_id = u.id
       LEFT JOIN Investor_Profiles ip ON ip.user_id = u.id
       WHERE q.project_id = ? ORDER BY q.created_at DESC`, [id]);

    const extra = { members, files, endorsements, updates, questions };

    if (isOwner || isAdmin) {
      const [interested] = await promisePool.query(
        `SELECT pi.investor_id, pi.note, pi.created_at, u.name AS investor_name, u.email, u.phone_number,
                ip.company_name, ip.investment_field, ip.verified
         FROM Project_Interests pi JOIN Users u ON pi.investor_id = u.id
         LEFT JOIN Investor_Profiles ip ON ip.user_id = u.id
         WHERE pi.project_id = ? ORDER BY pi.created_at DESC`, [id]);
      const [offers] = await promisePool.query(
        `SELECT o.id, o.investor_id, o.amount, o.message, o.status, o.created_at,
                u.name AS investor_name, ip.company_name, ip.verified
         FROM project_offers o JOIN Users u ON o.investor_id = u.id
         LEFT JOIN Investor_Profiles ip ON ip.user_id = u.id
         WHERE o.project_id = ? ORDER BY o.created_at DESC`, [id]);
      const [meetings] = await promisePool.query(
        `SELECT m.id, m.investor_id, m.proposed_time, m.message, m.status, m.created_at, u.name AS investor_name
         FROM project_meetings m JOIN Users u ON m.investor_id = u.id
         WHERE m.project_id = ? ORDER BY m.created_at DESC`, [id]);
      extra.interested_investors = interested;
      extra.offers = offers;
      extra.meetings = meetings;
    }

    if (isInvestor) {
      const [[mine]] = await promisePool.query('SELECT 1 y FROM Project_Interests WHERE project_id=? AND investor_id=?', [id, req.user.id]);
      const [[bm]] = await promisePool.query('SELECT 1 y FROM project_bookmarks WHERE project_id=? AND investor_id=?', [id, req.user.id]);
      const [[myOffer]] = await promisePool.query('SELECT amount, message, status FROM project_offers WHERE project_id=? AND investor_id=?', [id, req.user.id]);
      extra.my_interested = !!mine; extra.my_bookmarked = !!bm; extra.my_offer = myOffer || null;
      if (mine) {
        const [[c]] = await promisePool.query('SELECT email, phone_number FROM Users WHERE id = ?', [project.creator_id]);
        extra.creator_contact = c || null;
      }
    }

    // Hide sensitive fields from investors when a project isn't published.
    res.json({ ...project, ...extra, can_review: isSupervisor || isAdmin });
  } catch (err) {
    console.error('getProjectById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Delete ──
const deleteProject = async (req, res) => {
  try {
    const [[project]] = await promisePool.query('SELECT creator_id FROM Projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    await promisePool.query('DELETE FROM Projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Upload helpers (images / pitch deck / attachments) → uploads/projects ──
const uploadProjectImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ url: `/uploads/projects/${req.file.filename}`, name: req.file.originalname, size: req.file.size, type: req.file.mimetype });
};
const deleteProjectFile = async (req, res) => {
  try {
    const [[f]] = await promisePool.query(
      `SELECT f.id, f.uploader_id, p.creator_id FROM Files f JOIN Projects p ON f.project_id = p.id WHERE f.id = ?`,
      [req.params.fileId]);
    if (!f) return res.status(404).json({ message: 'File not found' });
    if (f.creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    await promisePool.query('DELETE FROM Files WHERE id = ?', [req.params.fileId]);
    res.json({ message: 'Removed' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Interest (investor) ──
const expressInterest = async (req, res) => {
  if (req.user.role !== 'investor') return res.status(403).json({ message: 'Only investors can express interest' });
  const { id: project_id } = req.params;
  try {
    const [[project]] = await promisePool.query('SELECT creator_id, title FROM Projects WHERE id = ?', [project_id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await promisePool.query(
      `INSERT INTO Project_Interests (project_id, investor_id, note) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE note = VALUES(note)`, [project_id, req.user.id, req.body.note || null]);
    notify({ userId: project.creator_id, senderId: req.user.id, type: 'project',
      message: `${req.user.name || 'An investor'} is interested in your project "${project.title}"`, referenceId: Number(project_id) }).catch(() => {});
    const [[contact]] = await promisePool.query('SELECT email, phone_number FROM Users WHERE id = ?', [project.creator_id]);
    res.json({ message: 'Interest expressed', creator_contact: contact || null });
  } catch (err) { console.error('expressInterest error:', err); res.status(500).json({ message: 'Server error' }); }
};
const removeInterest = async (req, res) => {
  try { await promisePool.query('DELETE FROM Project_Interests WHERE project_id=? AND investor_id=?', [req.params.id, req.user.id]); res.json({ message: 'Withdrawn' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Bookmarks (investor) ──
const addBookmark = async (req, res) => {
  if (req.user.role !== 'investor') return res.status(403).json({ message: 'Investors only' });
  try { await promisePool.query('INSERT IGNORE INTO project_bookmarks (project_id, investor_id) VALUES (?, ?)', [req.params.id, req.user.id]); res.json({ message: 'Bookmarked' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
};
const removeBookmark = async (req, res) => {
  try { await promisePool.query('DELETE FROM project_bookmarks WHERE project_id=? AND investor_id=?', [req.params.id, req.user.id]); res.json({ message: 'Removed' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
};
const getMyBookmarks = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT p.id, p.title, p.description, p.project_type, p.status, p.required_funding, p.image_url, p.looking_for, p.created_at,
              u.name AS creator_name, d.name AS supervisor_name,
              (SELECT ROUND(AVG(rating),1) FROM project_endorsements pe WHERE pe.project_id = p.id) AS rating,
              ${fundingExpr} AS funding_raised,
              EXISTS(SELECT 1 FROM Project_Interests pi WHERE pi.project_id=p.id AND pi.investor_id=?) AS my_interested,
              1 AS my_bookmarked
       FROM project_bookmarks pb JOIN Projects p ON pb.project_id = p.id
       JOIN Users u ON p.creator_id = u.id LEFT JOIN Users d ON p.supervisor_id = d.id
       WHERE pb.investor_id = ? ORDER BY pb.created_at DESC`, [req.user.id, req.user.id]);
    res.json(rows.map(r => ({ ...r, my_interested: !!r.my_interested, my_bookmarked: true })));
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Offers (investor) ──
const makeOffer = async (req, res) => {
  if (req.user.role !== 'investor') return res.status(403).json({ message: 'Investors only' });
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Enter a valid amount' });
  try {
    const [[project]] = await promisePool.query('SELECT creator_id, title FROM Projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await promisePool.query(
      `INSERT INTO project_offers (project_id, investor_id, amount, message) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), message = VALUES(message), status = 'pending'`,
      [req.params.id, req.user.id, amount, req.body.message || null]);
    notify({ userId: project.creator_id, senderId: req.user.id, type: 'project',
      message: `${req.user.name || 'An investor'} offered $${amount.toLocaleString()} for "${project.title}"`, referenceId: Number(req.params.id) }).catch(() => {});
    res.json({ message: 'Offer sent' });
  } catch (err) { console.error('makeOffer error:', err); res.status(500).json({ message: 'Server error' }); }
};
const respondOffer = async (req, res) => {
  const { status } = req.body; // accepted | declined
  if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    const [[offer]] = await promisePool.query(
      `SELECT o.*, p.creator_id, p.title FROM project_offers o JOIN Projects p ON o.project_id = p.id WHERE o.id = ?`, [req.params.offerId]);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    await promisePool.query('UPDATE project_offers SET status = ? WHERE id = ?', [status, req.params.offerId]);
    notify({ userId: offer.investor_id, senderId: req.user.id, type: 'project',
      message: `Your offer on "${offer.title}" was ${status}`, referenceId: offer.project_id }).catch(() => {});
    res.json({ message: 'Done' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Meeting requests (investor → student) ──
const requestMeeting = async (req, res) => {
  if (req.user.role !== 'investor') return res.status(403).json({ message: 'Investors only' });
  try {
    const [[project]] = await promisePool.query('SELECT creator_id, title FROM Projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await promisePool.query(
      'INSERT INTO project_meetings (project_id, investor_id, proposed_time, message) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, req.body.proposed_time || null, req.body.message || null]);
    notify({ userId: project.creator_id, senderId: req.user.id, type: 'project',
      message: `${req.user.name || 'An investor'} requested a meeting about "${project.title}"`, referenceId: Number(req.params.id) }).catch(() => {});
    res.json({ message: 'Meeting requested' });
  } catch (err) { console.error('requestMeeting error:', err); res.status(500).json({ message: 'Server error' }); }
};
const respondMeeting = async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    const [[m]] = await promisePool.query(
      `SELECT mt.*, p.creator_id, p.title FROM project_meetings mt JOIN Projects p ON mt.project_id = p.id WHERE mt.id = ?`, [req.params.meetingId]);
    if (!m) return res.status(404).json({ message: 'Not found' });
    if (m.creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    await promisePool.query('UPDATE project_meetings SET status = ? WHERE id = ?', [status, req.params.meetingId]);
    notify({ userId: m.investor_id, senderId: req.user.id, type: 'project', message: `Your meeting request for "${m.title}" was ${status}`, referenceId: m.project_id }).catch(() => {});
    res.json({ message: 'Done' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Q&A ──
const askQuestion = async (req, res) => {
  const question = (req.body.question || '').trim();
  if (!question) return res.status(400).json({ message: 'Question is required' });
  try {
    const [[project]] = await promisePool.query('SELECT creator_id, title FROM Projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await promisePool.query('INSERT INTO project_questions (project_id, asker_id, question) VALUES (?, ?, ?)', [req.params.id, req.user.id, question]);
    notify({ userId: project.creator_id, senderId: req.user.id, type: 'project',
      message: `${req.user.name || 'Someone'} asked a question on your project "${project.title}"`, referenceId: Number(req.params.id) }).catch(() => {});
    res.json({ message: 'Question posted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
const answerQuestion = async (req, res) => {
  const answer = (req.body.answer || '').trim();
  if (!answer) return res.status(400).json({ message: 'Answer is required' });
  try {
    const [[q]] = await promisePool.query(
      `SELECT q.*, p.creator_id FROM project_questions q JOIN Projects p ON q.project_id = p.id WHERE q.id = ?`, [req.params.questionId]);
    if (!q) return res.status(404).json({ message: 'Not found' });
    if (q.creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    await promisePool.query('UPDATE project_questions SET answer = ?, answered_at = NOW() WHERE id = ?', [answer, req.params.questionId]);
    notify({ userId: q.asker_id, senderId: req.user.id, type: 'project', message: `Your question was answered`, referenceId: q.project_id }).catch(() => {});
    res.json({ message: 'Answered' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Milestone updates (student) → notify interested investors ──
const postUpdate = async (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Update content is required' });
  try {
    const [[project]] = await promisePool.query('SELECT creator_id, title FROM Projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    await promisePool.query('INSERT INTO project_updates (project_id, content) VALUES (?, ?)', [req.params.id, content]);
    const [investors] = await promisePool.query('SELECT investor_id FROM Project_Interests WHERE project_id = ?', [req.params.id]);
    investors.forEach(iv => notify({ userId: iv.investor_id, senderId: req.user.id, type: 'project',
      message: `New update on "${project.title}"`, referenceId: Number(req.params.id) }).catch(() => {}));
    res.json({ message: 'Update posted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Investor profile (+ admin verify) ──
const getInvestorProfile = async (req, res) => {
  try {
    const [[row]] = await promisePool.query(
      `SELECT u.name, u.email, u.phone_number, COALESCE(u.profile_picture,'') AS profile_picture,
              COALESCE(ip.company_name,'') AS company_name,
              COALESCE(ip.investment_field,'') AS investment_field, COALESCE(ip.verified,0) AS verified
       FROM Users u LEFT JOIN Investor_Profiles ip ON ip.user_id = u.id WHERE u.id = ?`, [req.user.id]);
    res.json(row || {});
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
const updateInvestorProfile = async (req, res) => {
  const { name, phone_number, company_name, investment_field, profile_picture } = req.body;
  try {
    if (name !== undefined || phone_number !== undefined) {
      await promisePool.query('UPDATE Users SET name = COALESCE(NULLIF(?, \'\'), name), phone_number = COALESCE(?, phone_number) WHERE id = ?', [name || '', phone_number ?? null, req.user.id]);
    }
    // Avatar (base64 or path). Only overwrite when a value is actually sent.
    if (profile_picture !== undefined && profile_picture !== null) {
      await promisePool.query('UPDATE Users SET profile_picture = ? WHERE id = ?', [profile_picture || null, req.user.id]);
    }
    await promisePool.query(
      `INSERT INTO Investor_Profiles (user_id, company_name, investment_field) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), investment_field = VALUES(investment_field)`,
      [req.user.id, company_name || null, investment_field || null]);
    res.json({ message: 'Profile updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
const verifyInvestor = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  try {
    await promisePool.query(
      `INSERT INTO Investor_Profiles (user_id, verified) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE verified = VALUES(verified)`, [req.params.userId, req.body.verified ? 1 : 0]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

const getLeaderboard = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT p.id, p.title, p.project_type, u.name AS creator_name, COUNT(pi.investor_id) AS interest_count
       FROM Projects p JOIN Users u ON p.creator_id = u.id
       LEFT JOIN Project_Interests pi ON pi.project_id = p.id
       WHERE p.open_to_investors = 1 AND p.approval_status = 'approved'
       GROUP BY p.id ORDER BY interest_count DESC LIMIT 20`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

module.exports = {
  createProject, updateProject, getAllProjects, getProjectById, deleteProject,
  getDoctors, getSupervisedProjects, reviewProject, togglePublish, setFeatured,
  getMarketplace, getLeaderboard,
  expressInterest, removeInterest, addBookmark, removeBookmark, getMyBookmarks,
  makeOffer, respondOffer, requestMeeting, respondMeeting,
  askQuestion, answerQuestion, postUpdate,
  uploadProjectImage, deleteProjectFile,
  getInvestorProfile, updateInvestorProfile, verifyInvestor,
};
