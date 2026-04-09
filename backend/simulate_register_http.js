const http = require('http');

const email = `scout_${Date.now()}@example.com`;
const data = JSON.stringify({
    name: "New Scout",
    email: email,
    password: "password123",
    date_of_birth: "2010-01-01",
    group_id: 1,
    district: "Colombo",
    province: "Western",
    gender: "Male"
});

const options = {
    hostname: '127.0.0.1',
    port: 4000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log(`--- Registering Scout: ${email} ---`);
const req = http.request(options, (res) => {
    let body = '';
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
});

req.write(data);
req.end();
