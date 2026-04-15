const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        console.log("Triggering POST /api/feedback test...");
        
        // Generate a test token
        const token = jwt.sign({ id: 1, role: 'examiner' }, 'scout_secret_key'); // Check secret from .env

        const res = await axios.post('http://localhost:4000/api/feedback', {
            target_type: 'badge_submission',
            target_id: 1,
            message: 'Tester message',
            scout_id: 1
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Status:", res.status);
        console.log("Body:", JSON.stringify(res.data));
    } catch (err) {
        if (err.response) {
            console.error("500 Error Body:", JSON.stringify(err.response.data));
        } else {
            console.error("Request Error:", err.message);
        }
    }
})();
