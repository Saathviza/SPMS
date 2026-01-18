console.log("AUTH FILE PATH:", __filename);
console.log("🔥 AUTH ROUTES LOADED");

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();


router.get("/test", (req, res) => {
  res.send("AUTH ROUTE WORKS");
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debugging logs
    console.log("LOGIN REQUEST RECEIVED: ", email);

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
      [email]
    );

    if (rows.length === 0) {
      console.log("User not found or inactive");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      console.log("Password mismatch");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    console.log("Login successful: ", user.email);

    res.json({ token, role: user.role });
  } catch (err) {
    console.error("Server error:", err);  // Log the error
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;

