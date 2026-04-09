const express = require("express");
const AdminController = require("../controllers/admin.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.use(auth, role(["admin"]));

router.get("/stats", AdminController.getStats);
router.get("/scouts", AdminController.getAllScouts);
router.post("/add-leader", AdminController.addLeader);
router.get("/check-eligibility/:scout_id", AdminController.checkEligibility);
router.post("/manage-activity", AdminController.manageActivity);
router.post("/manage-badge", AdminController.manageBadge);
router.post("/approve-user", AdminController.approveUser);
router.get("/users", AdminController.getUsers);
router.get("/groups", AdminController.getGroups);
router.get("/groups/:groupId/roster", AdminController.getGroupRoster);
router.get("/logs", AdminController.getLogs);

module.exports = router;

