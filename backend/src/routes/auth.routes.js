const express = require("express");
const AuthController = require("../controllers/auth.controller");

const router = express.Router();

/**
 * TEST ROUTE
 */
router.get("/test", (req, res) => {
  res.send("AUTH ROUTE WORKS");
});

/**
 * LOGIN ROUTE
 */
router.post("/login", AuthController.login);

/**
 * REGISTRATION ROUTE
 */
router.post("/register", AuthController.register);

/**
 * PASSWORD RECOVERY ROUTE
 */
router.post("/password-recovery", AuthController.requestPasswordReset);

module.exports = router;





