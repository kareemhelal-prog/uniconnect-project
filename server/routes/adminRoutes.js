const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/stats',                        adminController.getStats);
router.get('/search',                       adminController.search);

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

router.get('/announcements',                adminController.getAllAnnouncements);
router.post('/announcements',               adminController.createAnnouncement);
router.delete('/announcements/:id',         adminController.deleteAnnouncement);

module.exports = router;