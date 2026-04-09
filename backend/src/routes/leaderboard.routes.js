const express = require("express");
const router = express.Router();
const LeadController = require("../controllers/lead.controller");

// 🏆 Leaderboard Endpoints (Public Access for National Transparency)
router.get("/national", LeadController.getNationalLeaderboard);
router.get("/districts", LeadController.getDistrictRankings);

module.exports = router;
