const express = require("express");
const ExaminerController = require("../controllers/examiner.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

// Get pending badges for evaluation
router.get("/pending-badges", auth, role(['examiner']), ExaminerController.getPendingBadges);

// Approve/Reject badge
router.post("/approve-badge", auth, role(['examiner']), ExaminerController.approveBadge);
router.post("/reject-badge", auth, role(['examiner']), ExaminerController.rejectBadge);

// Scout details for evaluation
router.get("/scout/:scout_id", auth, role(['examiner']), ExaminerController.getScoutDetails);

module.exports = router;

