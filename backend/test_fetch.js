const jwt = require("jsonwebtoken");
const token = jwt.sign({ id: 2, role: "EXAMINER", user_id: 2 }, process.env.JWT_SECRET || "scout-pms-secret");

fetch("http://localhost:4000/api/examiner/pending-badges", {
    headers: { "Authorization": "Bearer " + token }
}).then(async r => {
    console.log("Status:", r.status);
    console.log("Body:", await r.text());
}).catch(console.error);
