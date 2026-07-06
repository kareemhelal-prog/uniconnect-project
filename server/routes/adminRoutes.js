const express = require('express');
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');
const { getActivityLogs } = require('../controllers/activityLogController');

router.use(authenticateToken);
router.use(roleMiddleware('admin'));

router.get('/stats',                        adminController.getStats);
router.get('/search',                       adminController.search);
router.get('/activity-logs',                getActivityLogs);

// Real-time monitoring
router.get('/overview',                     adminController.getOverview);
router.get('/live',                         adminController.getLiveFeed);
router.get('/online',                       adminController.getOnlineUsers);
router.get('/analytics',                    adminController.getAnalytics);

router.get('/users',                        adminController.getAllUsers);
router.put('/users/:id/deactivate',         adminController.deactivateUser);
router.put('/users/:id/activate',           adminController.activateUser);
router.delete('/users/:id',                 adminController.deleteUser);
router.put('/users/:id/role',               adminController.changeUserRole);
router.post('/users/:id/reset-password',    adminController.resetUserPassword);

// Account approval workflow
router.get('/pending',                      adminController.getPendingUsers);
router.put('/users/:id/approve',            adminController.approveUser);
router.put('/users/:id/reject',             adminController.rejectUser);

// Student registry
router.get('/registry',                     adminController.getRegistry);
router.post('/registry/import',             adminController.importRegistry);
router.delete('/registry/:id',              adminController.deleteRegistryEntry);

router.get('/reports',                      adminController.getAllReports);
router.put('/reports/:id/resolve',          adminController.resolveReport);
router.put('/reports/:id/dismiss',          adminController.dismissReport);
router.delete('/reports/:id/content',       adminController.deleteReportedContent);

// Content management
router.get('/posts',                        adminController.getAdminPosts);
router.delete('/posts/:id',                 adminController.deleteAdminPost);
router.delete('/posts/:id/comments',        adminController.deletePostComments);

router.get('/projects',                     adminController.getAdminProjects);
router.delete('/projects/:id',              adminController.deleteAdminProject);

router.get('/groups',                       adminController.getAdminGroups);
router.delete('/groups/:id',                adminController.deleteAdminGroup);

// Announcements
router.get('/announcements',                adminController.getAllAnnouncements);
router.post('/announcements',               adminController.createAnnouncement);
router.delete('/announcements/:id',         adminController.deleteAnnouncement);

module.exports = router;

