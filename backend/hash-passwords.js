const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/config/db.config');
const bcrypt = require('bcrypt');

async function hashExistingPasswords() {
    try {
        console.log("🔐 Hashing existing passwords...");

        // First, let's see what columns actually exist
        const [columns] = await pool.query("DESCRIBE users");
        console.log("\n📋 Users table structure:");
        console.table(columns);

        // Get all users
        const [users] = await pool.query("SELECT * FROM users LIMIT 5");
        console.log("\n📋 Current Users (first 5):");
        console.table(users);

        // Define the correct passwords for each user based on your screenshot
        const userPasswords = {
            'admin1@example.com': 'adminpass1',
            'ravi.leader@example.com': 'leaderpass1',
            'kavindu.leader@example.com': 'leaderpass2',
            'nimal.examiner@example.com': 'examinerpass1'
        };

        // Get the actual password column name from the table structure
        const passwordColumn = columns.find(col =>
            col.Field === 'password' || col.Field === 'password_hash'
        );

        if (!passwordColumn) {
            console.error("❌ No password column found!");
            process.exit(1);
        }

        console.log(`\n✅ Using column: ${passwordColumn.Field}`);

        for (const user of users) {
            const plainPassword = userPasswords[user.email];

            if (plainPassword) {
                console.log(`\nHashing password for: ${user.email} (${user.role})`);
                const hashedPassword = await bcrypt.hash(plainPassword, 10);

                // Use the correct column name
                const query = `UPDATE users SET ${passwordColumn.Field} = ? WHERE email = ?`;
                await pool.query(query, [hashedPassword, user.email]);
                console.log(`✅ Updated: ${user.email}`);
            }
        }

        console.log("\n🎉 All passwords hashed successfully!");
        console.log("\n📝 You can now login with:");
        console.log("Leader: ravi.leader@example.com / leaderpass1");

        process.exit(0);
    } catch (err) {
        console.error("💥 Error:", err.message);
        console.error(err);
        process.exit(1);
    }
}

hashExistingPasswords();
