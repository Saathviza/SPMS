const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db.config');

const AuthController = {
    // Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Fetch the user based on the provided email
            const [rows] = await pool.query(
                "SELECT user_id, name, email, password_hash, role FROM users WHERE email = ? AND is_active = 1",
                [email]
            );

            // Check if user exists
            if (rows.length === 0) {
                console.log("User not found or inactive");
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const user = rows[0];

            // Compare the password
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                console.log("Password mismatch");
                return res.status(401).json({ message: "Invalid email or password" });
            }

            // Generate JWT token
            const token = jwt.sign(
                { user_id: user.user_id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "2h" }
            );

            console.log("Login successful:", user.email);

            // Send response with the JWT token, user role, and user details
            res.status(200).json({
                token,
                role: user.role,
                user: {
                    id: user.user_id,
                    name: user.name,
                    email: user.email
                }
            });
        } catch (err) {
            console.error("❌ LOGIN ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    },

    // Register new scout
    register: async (req, res) => {
        try {
            const {
                name,
                email,
                password,
                scout_group,
                district,
                province,
                date_of_birth,
                gender,
                contact_number,
                nic,
                profile_image_url,
                id_proof_url
            } = req.body;

            // Check if user already exists
            const [existing] = await pool.query(
                "SELECT user_id FROM users WHERE email = ?",
                [email]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: "Email already registered" });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, 10);

            // Insert into users table
            const [userResult] = await pool.query(
                `INSERT INTO users (name, email, password_hash, role, contact_number, nic, district, province, gender, profile_image_url, id_proof_url, is_active) 
         VALUES (?, ?, ?, 'Scout', ?, ?, ?, ?, ?, ?, ?, 0)`,
                [name, email, password_hash, contact_number, nic, district, province, gender, profile_image_url, id_proof_url]
            );

            const scout_id = userResult.insertId;

            // Insert into scouts table
            await pool.query(
                `INSERT INTO scouts (scout_id, date_of_birth, group_id, joined_date) 
         VALUES (?, ?, ?, CURDATE())`,
                [scout_id, date_of_birth, scout_group]
            );

            console.log("Scout registered successfully:", email);

            res.status(201).json({
                message: "Registration successful. Awaiting Scout Leader approval.",
                scout_id
            });
        } catch (err) {
            console.error("❌ REGISTRATION ERROR:", err.message);
            res.status(500).json({ message: "Server error during registration" });
        }
    },

    // Password recovery - generate reset token
    requestPasswordReset: async (req, res) => {
        try {
            const { email } = req.body;

            const [rows] = await pool.query(
                "SELECT user_id FROM users WHERE email = ?",
                [email]
            );

            if (rows.length === 0) {
                // Don't reveal if email exists or not for security
                return res.status(200).json({ message: "If the email exists, a reset link will be sent." });
            }

            // In a real application, you would:
            // 1. Generate a reset token
            // 2. Store it in database with expiration
            // 3. Send email with reset link

            // For now, just return success
            res.status(200).json({ message: "Password reset instructions sent to email." });
        } catch (err) {
            console.error("❌ PASSWORD RESET ERROR:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
};

module.exports = AuthController;
