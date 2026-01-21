require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Import routes
const authRoutes = require("./src/routes/auth.routes");
const scoutRoutes = require("./src/routes/scout.routes");
const activityRoutes = require("./src/routes/activity.routes");
const badgeRoutes = require("./src/routes/badge.routes");
const awardRoutes = require("./src/routes/award.routes");
const leaderRoutes = require("./src/routes/leader.routes");
const examinerRoutes = require("./src/routes/examiner.routes");
const adminRoutes = require("./src/routes/admin.routes");

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/scout", scoutRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/awards", awardRoutes);
app.use("/api/leader", leaderRoutes);
app.use("/api/examiner", examinerRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.send("Test route works!");
});

// Health check route
app.get("/", (req, res) => {
  res.send("Sri Lanka Scout PMS Backend Running");
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
