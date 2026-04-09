const express = require("express");
const router = express.Router();
const VerifyController = require("../controllers/verify.controller");

// 🌐 Public Verification Endpoints (No JWT required)
router.get("/badge/:uuid", VerifyController.verifyBadge);
router.get("/milestone/:uuid", VerifyController.verifyMilestone);

module.exports = router;
