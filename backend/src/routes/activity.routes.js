const express = require("express");
const ActivityController = require("../controllers/activity.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/activity-proofs";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Scout-only actions
router.get(
  "/my-activities",
  auth,
  role(["scout"]),
  ActivityController.getMyActivities
);

router.post(
  "/register",
  auth,
  role(["scout"]),
  ActivityController.registerForActivity
);

router.post(
  "/submit-notes",
  auth,
  role(["scout"]),
  ActivityController.submitNotes
);

// NEW: Enhanced submit proof with files
router.post(
  "/submit-proof",
  auth,
  role(["scout"]),
  upload.array("files", 5),
  ActivityController.submitProof
);

// Public: view activities
router.get("/", ActivityController.getAllActivities);
router.get("/:id", ActivityController.getActivityDetails);

module.exports = router;

