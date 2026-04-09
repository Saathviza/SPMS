require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

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

app.get("/api/test", (req, res) => res.send("Test route works!"));
app.get("/", (req, res) => res.send("Sri Lanka Scout PMS Backend Running"));

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready`);
  
  // Start Automated Cron Jobs
  require('./src/jobs/cron.jobs')();
});
