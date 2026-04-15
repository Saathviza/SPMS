const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 2, user_id: 2, role: 'EXAMINER' }, process.env.JWT_SECRET || "scout-pms-secret");

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/examiner/pending-badges',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        require('fs').writeFileSync('http_result.txt', res.statusCode + " " + data);
        process.exit(0);
    });
});

req.on('error', (e) => {
    require('fs').writeFileSync('http_result.txt', "ERR: " + e.message);
    process.exit(1);
});
req.end();
