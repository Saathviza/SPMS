const pool = require('./src/config/db.config');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "scout-pms-secret";

async function test() {
    try {
        // 1. Find an examiner
        const [users] = await pool.query(
            "SELECT u.id, u.email, r.role_name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'EXAMINER' LIMIT 1"
        );
        
        if (users.length === 0) {
            console.log("No examiner found in database.");
            process.exit(0);
        }

        const user = users[0];
        console.log(`Testing with user: ${user.email} (ID: ${user.id}, Role: ${user.role})`);

        // 2. Generate token
        const token = jwt.sign(
            { id: user.id, user_id: user.id, email: user.email, role: user.role.toLowerCase() },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        const axios = require('axios');
        const api = axios.create({
            baseURL: 'http://localhost:4000/api',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("--- Testing /examiner/dashboard-stats ---");
        try {
            const stats = await api.get('/examiner/dashboard-stats');
            console.log("Stats Success:", stats.data);
        } catch (e) {
            console.error("Stats Failed:", e.response ? e.response.data : e.message);
        }

        console.log("--- Testing /examiner/pending-badges ---");
        try {
            const pending = await api.get('/examiner/pending-badges');
            console.log("Pending Success (Count):", pending.data.length);
        } catch (e) {
            console.error("Pending Failed:", e.response ? e.response.data : e.message);
        }

        console.log("--- Testing /examiner/eligible-awards ---");
        try {
            const eligible = await api.get('/examiner/eligible-awards');
            console.log("Eligible Success (Count):", eligible.data.length);
        } catch (e) {
            console.error("Eligible Failed:", e.response ? e.response.data : e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error("TEST SCRIPT ERROR:", err);
        process.exit(1);
    }
}

test();
