const { promisePool } = require('../config/db');

// ==============================
// Create Project
// ==============================
const createProject = async (req, res) => {
  const creator_id = req.user.id;
  const { title, description, category, status, required_funding, github_link, demo_url } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const [result] = await promisePool.query(
      `INSERT INTO Projects (creator_id, title, description, category, status, required_funding, github_link, demo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [creator_id, title, description, category || 'IT', status || 'idea', required_funding || 0, github_link || null, demo_url || null]
    );

    res.status(201).json({ message: 'Project created successfully', project_id: result.insertId });
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// Get All Projects
// ==============================
const getAllProjects = async (req, res) => {
  const { category, status } = req.query;

  let query = `
    SELECT p.*, u.name AS creator_name, u.profile_picture,
      (SELECT COUNT(*) FROM Project_Interests pi WHERE pi.project_id = p.id) AS interest_count,
      (SELECT COUNT(*) FROM Project_Members pm WHERE pm.project_id = p.id) AS members_count
    FROM Projects p
    JOIN Users u ON p.creator_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (category) { query += ' AND p.category = ?'; params.push(category); }
  if (status)   { query += ' AND p.status = ?';   params.push(status); }

  query += ' ORDER BY p.created_at DESC';

  try {
    const [rows] = await promisePool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('getAllProjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// Get Project By ID
// ==============================
const getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const [[project]] = await promisePool.query(
      `SELECT p.*, u.name AS creator_name, u.profile_picture,
        (SELECT COUNT(*) FROM Project_Interests pi WHERE pi.project_id = p.id) AS interest_count
       FROM Projects p
       JOIN Users u ON p.creator_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const [members] = await promisePool.query(
      `SELECT u.id, u.name, u.profile_picture
       FROM Project_Members pm
       JOIN Users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [id]
    );

    res.json({ ...project, members });
  } catch (err) {
    console.error('getProjectById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// Delete Project
// ==============================
const deleteProject = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const user_role = req.user.role;

  try {
    const [[project]] = await promisePool.query('SELECT * FROM Projects WHERE id = ?', [id]);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.creator_id !== user_id && user_role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await promisePool.query('DELETE FROM Projects WHERE id = ?', [id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// Express Interest (Investor)
// ==============================
const expressInterest = async (req, res) => {
  const investor_id = req.user.id;
  const { id: project_id } = req.params;
  const { note } = req.body;

  if (req.user.role !== 'investor') {
    return res.status(403).json({ message: 'Only investors can express interest' });
  }

  try {
    await promisePool.query(
      `INSERT INTO Project_Interests (project_id, investor_id, note)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE note = VALUES(note)`,
      [project_id, investor_id, note || null]
    );

    res.json({ message: 'Interest expressed successfully' });
  } catch (err) {
    console.error('expressInterest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// Get Leaderboard
// ==============================
const getLeaderboard = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT p.id, p.title, p.category, p.status, p.required_funding,
        u.name AS creator_name, u.profile_picture,
        COUNT(pi.investor_id) AS interest_count
       FROM Projects p
       JOIN Users u ON p.creator_id = u.id
       LEFT JOIN Project_Interests pi ON pi.project_id = p.id
       GROUP BY p.id
       ORDER BY interest_count DESC
       LIMIT 20`
    );

    res.json(rows);
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject,
  expressInterest,
  getLeaderboard,
};