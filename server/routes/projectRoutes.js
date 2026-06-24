const express = require('express');
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject,
  expressInterest,
  getLeaderboard,
} = require('../controllers/projectController');

router.use(authenticateToken);

router.get('/leaderboard',   getLeaderboard);
router.get('/',              getAllProjects);
router.get('/:id',           getProjectById);
router.post('/',             createProject);
router.delete('/:id',        deleteProject);
router.post('/:id/interest', expressInterest);

module.exports = router;
