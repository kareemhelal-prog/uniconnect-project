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

router.get('/users',                        adminController.getAllUsers);
router.put('/users/:id/deactivate',         adminController.deactivateUser);
router.put('/users/:id/activate',           adminController.activateUser);
router.delete('/users/:id',                 adminController.deleteUser);
router.put('/users/:id/role',               adminController.changeUserRole);
router.post('/users/:id/reset-password',    adminController.resetUserPassword);

router.get('/reports',                      adminController.getAllReports);
router.put('/reports/:id/resolve',          adminController.resolveReport);
router.put('/reports/:id/dismiss',          adminController.dismissReport);
router.delete('/reports/:id/content',       adminController.deleteReportedContent);

module.exports = router;

