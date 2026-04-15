const jwt = require("jsonwebtoken");
const pool = require("../config/db.config");
const bcrypt = require("bcrypt");
const notificationEmitter = require("../events/notification.events");

const JWT_SECRET = process.env.JWT_SECRET || "scout-pms-secret";

const AuthController = {

  // ======================
  // PUBLIC GROUPS FETCH
  // ======================
  getPublicGroups: async (req, res) => {
    try {
        const [groups] = await pool.query(
            `SELECT id, group_name, district FROM scout_groups ORDER BY group_name`
        );
        res.status(200).json(groups);
    } catch (err) {
        console.error("❌ GET PUBLIC GROUPS ERROR:", err.message);
        res.status(500).json({ message: "Server error" });
    }
  },

  // ======================
  // LOGIN
  // ======================
  login: async (req, res) => {
    try {
      const { email, password, role } = req.body;
      console.log(`[AUTH] Login attempt: ${email} (Role: ${role || 'Not provided'})`);

      const [rows] = await pool.query(
        `SELECT u.id, u.email, u.password_hash as password, r.role_name as role, u.status, u.full_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = ?`,
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = rows[0];

      if (user.status !== "ACTIVE") {
        return res.status(401).json({
          message: "Account is not active. Please contact administrator."
        });
      }

      let isMatch = false;
      if (user.password === password) {
        isMatch = true;
      } else if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
        isMatch = await bcrypt.compare(password, user.password);
      }

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (role && role.toLowerCase() !== user.role.toLowerCase()) {
        return res.status(403).json({
          message: `Access denied. Your account role is '${user.role.toLowerCase()}'.`
        });
      }

      const token = jwt.sign(
        { id: user.id, user_id: user.id, email: user.email, role: user.role.toLowerCase() },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Trigger Login Status email real-time
      notificationEmitter.emit('login_alert', {
        userEmail: user.email,
        userName: user.full_name
      });

      return res.status(200).json({
        success: true,
        token,
        role: user.role.toLowerCase(),
        user_id: user.id,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.toLowerCase(),
          name: user.full_name
        }
      });

    } catch (err) {
      console.error("❌ LOGIN ERROR:", err);
      return res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // ======================
  // REGISTER SCOUT
  // ======================
  register: async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        date_of_birth,
        group_id,
        contact_number,
        nic,
        district,
        province,
        gender
      } = req.body;

      // 1. Check existing
      const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // 2. Hash Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Check/Add profile_photo_url column in users table safely
      try {
          await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(255) NULL");
      } catch (e) {
          // Ignore error if already exists or other dialect constraints
      }

      // Check if profile photo was uploaded
      let profilePhotoUrl = null;
      if (req.files && req.files.profile_photo && req.files.profile_photo.length > 0) {
          profilePhotoUrl = req.files.profile_photo[0].filename;
      }

      // 3. Insert into users
      const username = email.split('@')[0];
      const [userResult] = await pool.query(
        `INSERT INTO users (full_name, email, username, password_hash, role_id, status, profile_photo_url) VALUES (?, ?, ?, ?, 1, 'ACTIVE', ?)`,
        [name, email, username, hashedPassword, profilePhotoUrl]
      );

      const userId = userResult.insertId;

      // 4. Insert into scouts
      const safeGender = gender ? gender.toUpperCase() : 'OTHER';
      await pool.query(
        "INSERT INTO scouts (user_id, scout_group_id, dob, gender, contact_number, nic_or_school_id, verified_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [userId, group_id || 1, date_of_birth, safeGender, contact_number, nic || 'N/A']
      );

      // 5. Fire notification background job non-blockingly
      notificationEmitter.emit('user_registered', {
        userEmail: email,
        fullName: name,
        roleName: 'Scout'
      });

      // 🔔 Real-time socket emit to admin dashboard to trigger auto-refresh
      if (req.app.io) {
         req.app.io.emit('user:registered', {
            username: name,
            role: 'Scout'
         });
      }

      return res.status(201).json({
        success: true,
        message: "Scout registered successfully",
        user_id: userId
      });

    } catch (err) {
      console.error("❌ REGISTRATION ERROR:", err);
      return res.status(500).json({
        message: "Server error during registration",
        error: err.message,
        code: err.code
      });
    }
  },

  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;
      
      // 1. Find user
      const [rows] = await pool.query("SELECT id, full_name, email FROM users WHERE email = ?", [email]);
      
      if (rows.length === 0) {
        // Security best practice: don't reveal if email is valid or not
        return res.status(200).json({ message: "If that email is in our system, you will receive reset instructions shortly." });
      }

      const user = rows[0];

      // 2. Generate short-lived reset token
      const resetToken = jwt.sign(
         { id: user.id, email: user.email, type: "password_reset" },
         JWT_SECRET,
         { expiresIn: "1h" }
      );

      // 3. Emit event to send email in background
      notificationEmitter.emit('password_reset', {
         email: user.email,
         name: user.full_name,
         token: resetToken
      });

      console.log(`[AUTH] Password reset requested for: ${email}`);

      return res.status(200).json({ 
        success: true,
        message: "Instructions sent if email exists." 
      });
    } catch (err) {
      console.error("❌ PASS RESET REQUEST ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
};

module.exports = AuthController;
