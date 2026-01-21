const express = require("express");
const ExaminerController = require("../controllers/examiner.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

// Get pending badges
router.get("/pending-badges", auth, role(['Badge Examiner']), ExaminerController.getPendingBadges);

// Approve badge
router.post("/approve-badge", auth, role(['Badge Examiner']), ExaminerController.approveBadge);

// Reject badge
router.post("/reject-badge", auth, role(['Badge Examiner']), ExaminerController.rejectBadge);

// Get scout details
router.get("/scout/:scout_id", auth, role(['Badge Examiner']), ExaminerController.getScoutDetails);

module.exports = router;
