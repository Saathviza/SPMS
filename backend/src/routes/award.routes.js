const express = require("express");
const AwardController = require("../controllers/award.controller");
const auth = require("../middleware/auth");

const router = express.Router();

// Check eligibility
router.get("/eligibility/:scout_id", auth, AwardController.checkEligibility);

// Get award progress
router.get("/progress/:scout_id", auth, AwardController.getAwardProgress);

// Nominate for award
router.post("/nominate", auth, AwardController.nominateForAward);

module.exports = router;
