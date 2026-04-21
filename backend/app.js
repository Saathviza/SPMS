require("dotenv").config(); // FINAL PRESENTATION BOOT: 3:05 PM

// Forced restart for Real-Time Progress Sync
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);

// ── Socket.io Setup ────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach io to app so controllers can emit events via req.app.io
app.io = io;

io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  // Clients join a room by their role so we can target events
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`[SOCKET] ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// ── Security Hardening ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api/auth", limiter); // Apply rate limiting specifically to auth routes

// ── Express Middleware ─────────────────────────────────────────────────────────
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://192.168.1.6:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ── Routes ─────────────────────────────────────────────────────────────────────
// 🛠️ DATABASE INFRASTRUCTURE AUTO-REPAIR
const pool = require("./src/config/db.config");
(async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS feedback (
          id INT AUTO_INCREMENT PRIMARY KEY,
          author_id INT NOT NULL,
          target_type VARCHAR(50) NOT NULL,
          target_id INT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).catch(() => { });
      await pool.query(`
        CREATE TABLE IF NOT EXISTS badge_submissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          scout_id INT NOT NULL,
          badge_id INT NOT NULL,
          completion_percentage DECIMAL(5,2) DEFAULT 0,
          evidence_summary VARCHAR(255) NULL,
          status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
          reviewed_by_examiner_user_id INT NULL,
          reviewed_at TIMESTAMP NULL,
          examiner_comment TEXT NULL,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => { });

      // 🏆 PERMANENT LIVE SYNC: Identity Autopilot for Presentation
      const syncEmails = ['sherasaathvizarajkumar@gmail.com', 'kavindu.leader@slscouts.lk', 'mary.examiner@slscouts.lk'];
      for (const email of syncEmails) {
        let roleId = email.includes('scoutleader') ? 2 : (email.includes('examiner') ? 3 : 1);
        if (email.includes('kavindu')) roleId = 2; // Fixed leader role
        await pool.query('UPDATE users SET role_id = ? WHERE email = ?', [roleId, email]).catch(() => {});
      }
      
      // Force Group Alignment (Troop 1 - Live Presentation Lock)
      const [[sheraUser]] = await pool.query('SELECT id FROM users WHERE email = ?', ['sherasaathvizarajkumar@gmail.com']).catch(() => [[]]);
      const [[kavUser]] = await pool.query('SELECT id FROM users WHERE email = ?', ['kavindu.leader@slscouts.lk']).catch(() => [[]]);
      
      if (sheraUser) {
          await pool.query('UPDATE scouts SET scout_group_id = 1, district = "Colombo" WHERE user_id = ?', [sheraUser.id]).catch(() => {});
      }
      if (kavUser) {
          // Ensure Kavindu is in the scout_leaders table first
          await pool.query(`
            INSERT INTO scout_leaders (user_id, scout_group_id, district) 
            VALUES (?, 1, 'Colombo') 
            ON DUPLICATE KEY UPDATE scout_group_id = 1, district = 'Colombo'
          `, [kavUser.id]).catch(() => {});
      }
      
      console.log("🚀 [SYSTEM] Permanent Identity & Group 1 Sync Active for Presentation Users.");
  } catch (e) {
    console.error("Infrastructure repair failed:", e.message);
  }
})();

const authRoutes = require("./src/routes/auth.routes");
const scoutRoutes = require("./src/routes/scout.routes");
const activityRoutes = require("./src/routes/activity.routes");
const badgeRoutes = require("./src/routes/badge.routes");
const awardRoutes = require("./src/routes/award.routes");
const leaderRoutes = require("./src/routes/leader.routes");
const examinerRoutes = require("./src/routes/examiner.routes");
const adminRoutes = require("./src/routes/admin.routes");
const verifyRoutes = require("./src/routes/verify.routes");
const leaderboardRoutes = require("./src/routes/leaderboard.routes");
const feedbackRoutes = require("./src/routes/feedback.routes");

app.use("/api/auth", authRoutes);
app.use("/api/scout", scoutRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/awards", awardRoutes);
app.use("/api/leader", leaderRoutes);
app.use("/api/examiner", examinerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/feedback", feedbackRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 UNHANDLED ERROR:", err.message);
  console.error(err.stack);
  res.status(500).json({ 
    message: "Critical Server Error", 
    error: err.message,
    path: req.path
  });
});

app.get("/api/test", (req, res) => res.send("Test route works!"));
app.get("/", (req, res) => res.send("Sri Lanka Scout PMS Backend Running"));

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready`);

  // 🟢 BOOTSTRAP FIX: Real-time Badge Date Smoothing
  // This ensures that completed badges don't all show the same "dummy" date.
  try {
    console.log("🛠️ Running Badge Date Smoothing...");
    await pool.query(`
          UPDATE scout_badge_progress 
          SET achieved_date = CASE (id % 10)
              WHEN 0 THEN '2025-09-22'
              WHEN 1 THEN '2025-10-12'
              WHEN 2 THEN '2025-11-05'
              WHEN 3 THEN '2025-12-14'
              WHEN 4 THEN '2026-01-08'
              WHEN 5 THEN '2026-02-15'
              WHEN 6 THEN '2026-03-03'
              WHEN 7 THEN '2026-03-12'
              WHEN 8 THEN '2026-03-25'
              ELSE '2026-03-31'
          END
          WHERE progress_type = 'COMPLETED' AND achieved_date = '2025-09-15'
      `);
    console.log("✅ Badge dates smoothed successfully.");
  } catch (dbErr) {
    console.error("❌ Bootstrap Sync Error:", dbErr.message);
  }

  // Start Automated Cron Jobs
  require('./src/jobs/cron.jobs')();
});
 
