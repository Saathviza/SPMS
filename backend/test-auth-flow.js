const fetch = require('node-fetch'); // If node-fetch is needed, otherwise global fetch
// We will check if global fetch exists, if not we might need to fallback or use http. 
// But since I verified 'function', I'll use global fetch.

const BASE_URL = 'http://localhost:4000/api';

async function testAuth() {
    console.log("🚀 Starting Auth Verification...");

    // 1. Legacy Login (Leader)
    console.log("\n1️⃣ Testing Legacy Login (Leader)...");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'ravi.leader@example.com',
                password: 'leaderpass1',
                role: 'leader'
            })
        });
        const data = await res.json();
        if (res.status === 200 && data.token) {
            console.log("✅ Legacy Login Success:", data.message);
            console.log("   Token received.");
        } else {
            console.error("❌ Legacy Login Failed:", data);
        }
    } catch (e) { console.error("❌ Request Error:", e.message); }

    // 2. Register New Scout
    console.log("\n2️⃣ Testing New Scout Registration...");
    const newScout = {
        name: "Test Scout",
        email: `testscout_${Date.now()}@example.com`,
        password: "securepassword123",
        date_of_birth: "2010-01-01",
        group_id: 1,
        contact_number: "0771234567",
        nic: "991234567V",
        district: "Colombo",
        province: "Western",
        gender: "Male",
        profile_image_url: "http://example.com/img.jpg",
        id_proof_url: "http://example.com/id.jpg"
    };
    let scoutToken = "";

    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newScout)
        });
        const data = await res.json();
        if (res.status === 201) {
            console.log("✅ Registration Success:", data.message);
        } else {
            console.error("❌ Registration Failed:", data);
        }
    } catch (e) { console.error("❌ Request Error:", e.message); }

    // 3. Login with New Scout (Check Hash)
    console.log("\n3️⃣ Testing Login with New Scout...");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: newScout.email,
                password: newScout.password,
                role: 'scout'
            })
        });
        const data = await res.json();
        if (res.status === 200 && data.token) {
            console.log("✅ New Scout Login Success:", data.message);
            scoutToken = data.token;
        } else {
            console.error("❌ New Scout Login Failed:", data);
        }
    } catch (e) { console.error("❌ Request Error:", e.message); }

    // 4. Role Mismatch Test
    console.log("\n4️⃣ Testing Role Mismatch (Scout trying to login as Leader)...");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: newScout.email,
                password: newScout.password, // Correct password
                role: 'leader' // WRONG ROLE
            })
        });
        const data = await res.json();
        if (res.status === 403) {
            console.log("✅ Role Mismatch Correctly Denied:", data.message);
        } else {
            console.error("❌ Role Mismatch Test Failed (Expected 403):", res.status, data);
        }
    } catch (e) { console.error("❌ Request Error:", e.message); }

    // 5. Wrong Password Test
    console.log("\n5️⃣ Testing Wrong Password...");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'ravi.leader@example.com',
                password: 'WRONGPASSWORD',
                role: 'leader'
            })
        });
        const data = await res.json();
        if (res.status === 401) {
            console.log("✅ Wrong Password Correctly Denied:", data.message);
        } else {
            console.error("❌ Wrong Password Test Failed (Expected 401):", res.status, data);
        }
    } catch (e) { console.error("❌ Request Error:", e.message); }

}

testAuth();
