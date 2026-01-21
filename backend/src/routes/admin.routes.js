const express = require("express");
const AdminController = require("../controllers/admin.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

// Get system stats
router.get("/stats", auth, role(['Admin']), AdminController.getStats);

// Get all scouts
router.get("/scouts", auth, role(['Admin']), AdminController.getAllScouts);

// Add scout leader
router.post("/add-leader", auth, role(['Admin']), AdminController.addLeader);

// Check eligibility
router.get("/eligibility/:scout_id", auth, role(['Admin']), AdminController.checkEligibility);

// Manage activities
router.post("/manage-activities", auth, role(['Admin']), AdminController.manageActivity);

// Manage badges
router.post("/manage-badges", auth, role(['Admin']), AdminController.manageBadge);

// Approve scout registration
router.post("/approve-scout", auth, role(['Admin']), AdminController.approveScout);

module.exports = router;
