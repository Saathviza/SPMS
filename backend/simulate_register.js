const axios = require('axios');

async function testRegister() {
    try {
        const response = await axios.post('http://localhost:4000/api/auth/register', {
            name: "Test Scout",
            email: "test_new@example.com",
            password: "password123",
            date_of_birth: "2010-01-01",
            group_id: 1,
            district: "Colombo",
            province: "Western",
            gender: "Male"
        });
        console.log('✅ Success:', response.data);
    } catch (err) {
        console.log('❌ Error:', err.response ? JSON.stringify(err.response.data) : err.message);
    }
}

testRegister();
