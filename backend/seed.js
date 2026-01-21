const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/config/db');
const bcrypt = require('bcrypt');
const User = require('./src/models/user.model');
const Scout = require('./src/models/scout.model');
const Activity = require('./src/models/activity.model');

async function seed() {
    try {
        console.log("🌱 Seeding database...");

        // 1. Create Admin
        const adminHash = await bcrypt.hash('admin123', 10);

        // Disable foreign key checks to allow clearing
        await pool.query("SET FOREIGN_KEY_CHECKS = 0");
        await pool.query("DELETE FROM users");
        await pool.query("DELETE FROM badge_requirements");
        await pool.query("DELETE FROM badges");
        await pool.query("DELETE FROM activities");
        await pool.query("DELETE FROM scout_groups");
        await pool.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("🧹 Cleared existing data.");

        const adminId = await User.create({
            name: "District Commissioner",
            email: "admin@scout.lk",
            password_hash: adminHash,
            role: "Admin"
        });
        console.log(`✅ Admin created: ${adminId}`);

        // 2. Create Leader
        const leaderHash = await bcrypt.hash('leader123', 10);
        const leaderId = await User.create({
            name: "Samantha Perera",
            email: "leader@scout.lk",
            password_hash: leaderHash,
            role: "Scout Leader"
        });
        console.log(`✅ Leader created: ${leaderId}`);

        // 3. Create Group
        const [groupRes] = await pool.query(
            "INSERT INTO scout_groups (name, district, leader_id) VALUES (?, ?, ?)",
            ["Colombo 1st Gold Troop", "Colombo", leaderId]
        );
        const groupId = groupRes.insertId;
        console.log(`✅ Group created: ${groupId}`);

        // 4. Create Scout
        const scoutHash = await bcrypt.hash('scout123', 10);
        const scoutUserId = await User.create({
            name: "Nimal Silva",
            email: "scout@scout.lk",
            password_hash: scoutHash,
            role: "Scout"
        });

        await Scout.createProfile({
            scout_id: scoutUserId,
            date_of_birth: '2010-05-15',
            group_id: groupId,
            rank_level: 'Member',
            profile_image_url: 'https://i.pravatar.cc/150?u=scout',
            joined_date: '2023-01-10'
        });
        console.log(`✅ Scout created: ${scoutUserId}`);

        // 5. Create Activities
        await Activity.create({
            title: "District Camporee 2025",
            description: "Annual district camp for all scouts.",
            date: "2025-08-20 08:00:00",
            location: "Viharamahadevi Park",
            type: "Camp",
            created_by: adminId,
            group_id: null // District level
        });

        const activityId = await Activity.create({
            title: "Saturday Hike",
            description: "Weekly hike to Hanthana.",
            date: "2025-02-10 07:00:00",
            location: "Hanthana Range",
            type: "Hike",
            created_by: leaderId,
            group_id: groupId
        });
        console.log("✅ Activities created");

        // 6. Badges
        const badges = [
            { name: "Membership Badge", level: "Junior" },
            { name: "Scout Award", level: "Junior" },
            { name: "District Commissioner's Cord", level: "Senior" },
            { name: "President's Scout Award", level: "President" }
        ];

        for (const b of badges) {
            await pool.query("INSERT INTO badges (name, badge_level) VALUES (?, ?)", [b.name, b.level]);
        }
        console.log("✅ Badges created");

        console.log("🎉 Seeding complete!");
        process.exit(0);

    } catch (err) {
        console.error("💥 Seed failed:", err);
        process.exit(1);
    }
}

seed();
