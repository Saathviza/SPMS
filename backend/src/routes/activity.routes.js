const express = require("express");
const ActivityController = require("../controllers/activity.controller");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all activities
router.get("/", ActivityController.getAllActivities);

// Register for activity
router.post("/register", auth, ActivityController.registerForActivity);

// Get my activities
router.get("/my-activities/:scout_id", auth, ActivityController.getMyActivities);

// Submit proof
router.post("/submit-proof", auth, ActivityController.submitProof);

// Get activity details
router.get("/:id", ActivityController.getActivityDetails);

module.exports = router;
