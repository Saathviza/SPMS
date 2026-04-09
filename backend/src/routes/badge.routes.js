const express = require("express");
const BadgeController = require("../controllers/badge.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

// Get all badges
router.get("/all", auth, BadgeController.getAllBadges);

// Scout operations
router.get("/progress/:scout_id", auth, role(['scout']), BadgeController.getBadgeProgress);
router.get("/completed/:scout_id", auth, role(['scout']), BadgeController.getCompletedBadges);
router.post("/submit", auth, role(['scout']), BadgeController.submitBadge);

module.exports = router;
