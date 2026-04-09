const axios = require('axios');
async function test() {
    try {
        console.log('Testing Scout Login...');
        const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'sherasaathvizarajkumar@gmail.com',
            password: 'Scout@123',
            role: 'scout'
        });
        console.log('Login successful');
        const token = loginRes.data.token;

        try {
            console.log('Checking Dashboard...');
            const res1 = await axios.get('http://localhost:4000/api/scout/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Dashboard Data:', JSON.stringify(res1.data, null, 2));
        } catch (err) {
            console.error('ERROR Dashboard:', err.response?.data || err.message);
        }

        try {
            console.log('Checking My Activities...');
            const res2 = await axios.get('http://localhost:4000/api/activities/my-activities', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('My Activities count:', res2.data.length);
            // console.log('My Activities:', JSON.stringify(res2.data, null, 2));
        } catch (err) {
            console.error('ERROR MyActivities:', err.response?.data || err.message);
        }
    } catch (e) {
        console.error('Login failed:', e.response?.data || e.message);
    }
}
test();
