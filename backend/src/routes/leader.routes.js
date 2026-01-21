const express = require("express");
const LeaderController = require("../controllers/leader.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

// Get scouts in leader's group
router.get("/scouts/:leader_id", auth, role(['Scout Leader']), LeaderController.getScouts);

// Get pending activities
router.get("/pending-activities/:leader_id", auth, role(['Scout Leader']), LeaderController.getPendingActivities);

// Approve activity
router.post("/approve-activity", auth, role(['Scout Leader']), LeaderController.approveActivity);

// Reject activity
router.post("/reject-activity", auth, role(['Scout Leader']), LeaderController.rejectActivity);

// Get reports
router.get("/reports/:leader_id", auth, role(['Scout Leader']), LeaderController.getReports);

module.exports = router;
