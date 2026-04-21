const express = require("express");
const LeaderController = require("../controllers/leader.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
 
const router = express.Router();
 
router.use(auth, role(["leader"]));
 
// Scout roster
router.get("/scouts", LeaderController.getScouts);
 
// Activity approvals
router.get("/pending-activities", LeaderController.getPendingActivities);
router.post("/approve-activity", LeaderController.approveActivity);
router.post("/reject-activity", LeaderController.rejectActivity);
 
// NEW: Badge evidence review — Stage 1 of the two-stage approval flow
// Leader sees LEADER_PENDING submissions here, approves → they become PENDING for the examiner
router.get("/pending-badge-evidence", LeaderController.getPendingBadgeEvidence);
router.post("/approve-badge-evidence", LeaderController.approveBadgeEvidence);
router.post("/reject-badge-evidence", LeaderController.rejectBadgeEvidence);
 
// Reports
router.get("/reports", LeaderController.getReports);
router.get("/reports/file/:type", LeaderController.getReportFile);
 
// Leaderboard
router.get("/leaderboard", LeaderController.getGroupLeaderboard);
 
module.exports = router;
