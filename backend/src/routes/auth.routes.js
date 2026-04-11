const express = require("express");
const AuthController = require("../controllers/auth.controller");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Multer Config for Profile Photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/profile-photos";
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

/**
 * TEST ROUTE
 */
router.get("/test", (req, res) => {
  res.send("AUTH ROUTE WORKS");
});

/**
 * PUBLIC GROUPS ROUTE
 */
router.get("/groups", AuthController.getPublicGroups);

/**
 * LOGIN ROUTE
 */
router.post("/login", AuthController.login);

/**
 * REGISTRATION ROUTE
 */
router.post("/register", upload.fields([{ name: 'profile_photo', maxCount: 1 }]), AuthController.register);

/**
 * PASSWORD RECOVERY ROUTE
 */
router.post("/password-recovery", AuthController.requestPasswordReset);

module.exports = router;





