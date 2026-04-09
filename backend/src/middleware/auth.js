const jwt = require("jsonwebtoken");

// MUST MATCH auth.controller.js
const JWT_SECRET = process.env.JWT_SECRET || "scout-pms-secret";

module.exports = function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    // attach user info
    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

