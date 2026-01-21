const express = require('express');
const router = express.Router();
const Scout = require('../models/scout.model');
const Activity = require('../models/activity.model');
const Badge = require('../models/badge.model');

// Middleware to check if user is scout (to be implemented: middleware/auth.js)
// For now assuming req.user is set by auth middleware

// Get generic scout dashboard data
router.get('/dashboard/:id', async (req, res) => {
    try {
        const scoutId = req.params.id; // In real app, get from req.user.user_id
        const details = await Scout.getDetails(scoutId);
        const badges = await Badge.getScoutProgress(scoutId);
        const activities = await Activity.getScoutActivities(scoutId);

        res.json({
            profile: details,
            badgesSummary: {
                total: badges.length,
                completed: badges.filter(b => b.status === 'Awarded').length,
                pending: badges.filter(b => b.status === 'In Progress').length
            },
            recentActivities: activities.slice(0, 5)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Profile
router.get('/profile/:id', async (req, res) => {
    try {
        const details = await Scout.getDetails(req.params.id);
        if (!details) return res.status(404).json({ message: "Scout not found" });
        res.json(details);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Activities
router.get('/activities/:id', async (req, res) => {
    try {
        const activities = await Activity.getScoutActivities(req.params.id);
        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Badges
router.get('/badges/:id', async (req, res) => {
    try {
        const badges = await Badge.getScoutProgress(req.params.id);
        res.json(badges);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
