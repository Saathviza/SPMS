const express = require("express");
const LeaderController = require("../controllers/leader.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.use(auth, role(["leader"]));

router.get("/scouts", LeaderController.getScouts);
router.get("/pending-activities", LeaderController.getPendingActivities);
router.post("/approve-activity", LeaderController.approveActivity);
router.post("/reject-activity", LeaderController.rejectActivity);
router.get("/reports", LeaderController.getReports);
router.get("/reports/file/:type", LeaderController.getReportFile);
router.get("/leaderboard", LeaderController.getGroupLeaderboard);

module.exports = router;
