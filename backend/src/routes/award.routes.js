const express = require("express");
const AwardController = require("../controllers/award.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.get(
  "/eligibility/:scout_id",
  auth,
  role(["scout", "leader"]),
  AwardController.checkEligibility
);

router.get(
  "/progress/:scout_id",
  auth,
  role(["scout", "leader"]),
  AwardController.getAwardProgress
);

module.exports = router;

