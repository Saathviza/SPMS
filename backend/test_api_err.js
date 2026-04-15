const axios = require('axios');

async function testApi() {
    try {
        // 1. login as examiner (use dummy auth or whatever usually works). Let's just create a token mimicking it.
        const jwt = require("jsonwebtoken");
        const token = jwt.sign({ id: 2, role: "EXAMINER" }, "scout-pms-secret");
        
        console.log("Token: ", token);
        const res = await axios.get('http://localhost:4000/api/examiner/pending-badges', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Success:", res.data);
    } catch(err) {
        if(err.response) {
            console.error("HTTP ERROR:", err.response.status, err.response.data);
        } else {
            console.error("OTHER ENDPOINT ERROR:", err);
        }
    }
}
testApi();
