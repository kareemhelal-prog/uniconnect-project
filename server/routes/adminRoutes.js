const express = require("express");
const router  = express.Router();

const adminController = require("../controllers/adminController");
const authMiddleware  = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(authMiddleware);
router.use(adminMiddleware);

// DASHBOARD
router.get("/stats",  adminController.getStats);
router.get("/search", adminController.search);

// USERS MANAGEMENT
router.get("/users",                      adminController.getAllUsers);
router.put("/users/:id/deactivate",       adminController.deactivateUser);
router.put("/users/:id/activate",         adminController.activateUser);
router.delete("/users/:id",               adminController.deleteUser);
router.put("/users/:id/role",             adminController.changeUserRole);
router.put("/users/:id/reset-password",   adminController.resetUserPassword);

// REPORTS MANAGEMENT
router.get("/reports",                adminController.getAllReports);
router.put("/reports/:id/resolve",    adminController.resolveReport);
router.put("/reports/:id/dismiss",    adminController.dismissReport);
router.delete("/reports/:id/content", adminController.deleteReportedContent);

module.exports = router;