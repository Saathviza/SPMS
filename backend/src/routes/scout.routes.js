const express = require("express");
const ScoutController = require("../controllers/scout.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.get(
  "/dashboard",
  auth,
  role(["scout"]),
  ScoutController.getDashboardConfig
);

router.get(
  "/profile/:scout_id",
  auth,
  role(["scout", "leader", "admin"]),
  ScoutController.getProfile
);

router.put(
  "/profile/:scout_id",
  auth,
  role(["scout", "admin"]),
  ScoutController.updateProfile
);

router.get(
  "/badges/:scout_id",
  auth,
  role(["scout", "leader"]),
  ScoutController.getBadges
);

router.get(
  "/activities/:scout_id",
  auth,
  role(["scout", "leader"]),
  ScoutController.getActivities
);

router.get(
  "/badges/:badge_id/syllabus",
  auth,
  role(["scout"]),
  ScoutController.getBadgeSyllabus
);

module.exports = router;

