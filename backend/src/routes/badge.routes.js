const express = require("express");
const BadgeController = require("../controllers/badge.controller");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all badges
router.get("/", BadgeController.getAllBadges);

// Get badge progress
router.get("/progress/:scout_id", auth, BadgeController.getBadgeProgress);

// Get completed badges
router.get("/completed/:scout_id", auth, BadgeController.getCompletedBadges);

// Get pending badges
router.get("/pending/:scout_id", auth, BadgeController.getPendingBadges);

// Submit badge
router.post("/submit", auth, BadgeController.submitBadge);

module.exports = router;
