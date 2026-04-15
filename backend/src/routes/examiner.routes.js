const express = require("express");
const ExaminerController = require("../controllers/examiner.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

// Get dashboard stats (Counters) 
router.get("/dashboard-stats", auth, role(['examiner']), ExaminerController.getDashboardStats);

// 🚨 EMERGENCY DIAGNOSTIC ROUTE
router.get("/public-stats-check", (req, res) => {
    const pool = require("../config/db.config");
    pool.query("SELECT status, COUNT(*) as count FROM badge_submissions GROUP BY status")
        .then(([rows]) => res.json({ 
            timestamp: new Date().toISOString(),
            data: rows,
            instruction: "If you see 148 here, the DB is actually messy. If you see ~20, the frontend is caching."
        }))
        .catch(err => res.status(500).json(err));
});

// Get pending badges for evaluation
router.get("/pending-badges", auth, role(['examiner']), ExaminerController.getPendingBadges);

// Approve/Reject badge
router.post("/approve-badge", auth, role(['examiner']), ExaminerController.approveBadge);
router.post("/reject-badge", auth, role(['examiner']), ExaminerController.rejectBadge);

// Scout details for evaluation
router.get("/scout/:scout_id", auth, role(['examiner']), ExaminerController.getScoutDetails);

// Award eligibility (US 18)
router.get("/eligible-awards", auth, role(['examiner']), ExaminerController.getEligibleAwards);

module.exports = router;

