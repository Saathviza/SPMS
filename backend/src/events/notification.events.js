const EventEmitter = require('events');
const emailService = require('../services/email.service');

class NotificationEmitter extends EventEmitter {}

// Create a single global instance of the emitter that all controllers will share
const notificationEmitter = new NotificationEmitter();

/**
 * 📢 ==========================================
 * EVENT LISTENERS (BACKGROUND WORKERS)
 * ============================================
 * 
 * These execute asynchronously to separate the slow "sending email" 
 * process from the fast "user clicked button" HTTP response.
 * Try/catch blocks ensure the backend never crashes if an email fails.
 */

// 1. Welcome Registration Event
notificationEmitter.on('user_registered', async (data) => {
    try {
        const { userEmail, fullName, roleName } = data;
        await emailService.sendWelcomeEmail(userEmail, fullName, roleName);
    } catch (error) {
        console.error('❌ Notification Event Error (user_registered): ', error.message);
    }
});

// 2. Activity Approval Event
notificationEmitter.on('activity_updated', async (data) => {
    try {
        const { userEmail, scoutName, activityName, status } = data;
        await emailService.sendActivityUpdateEmail(userEmail, scoutName, activityName, status);
    } catch (error) {
        console.error('❌ Notification Event Error (activity_updated): ', error.message);
    }
});

// 3. Badge Submission Event
notificationEmitter.on('badge_submitted', async (data) => {
    try {
        const { userEmail, scoutName, badgeName } = data;
        await emailService.sendBadgeSubmissionEmail(userEmail, scoutName, badgeName);
    } catch (error) {
        console.error('❌ Notification Event Error (badge_submitted): ', error.message);
    }
});

// 4. Badge Awarded & Community Broadcast Event
notificationEmitter.on('badge_awarded', async (data) => {
    try {
        const { userEmail, scoutName, badgeName, groupEmails } = data;
        
        // 1. Send private congrats
        await emailService.sendBadgeAwardedEmail(userEmail, scoutName, badgeName);
        
        // 2. Send public broadcast to common members
        if (groupEmails && groupEmails.length > 0) {
            await emailService.sendCommunityBroadcastEmail(groupEmails, scoutName, badgeName);
        }
    } catch (error) {
        console.error('❌ Notification Event Error (badge_awarded): ', error.message);
    }
});

// 5. Scheduled Nudge (Cron Job Trigger)
notificationEmitter.on('cron_reminder', async (data) => {
    try {
        const { userEmail, userName, messageHeader, messageBody } = data;
        await emailService.sendCronReminderEmail(userEmail, userName, messageHeader, messageBody);
    } catch (error) {
        console.error('❌ Notification Event Error (cron_reminder): ', error.message);
    }
});

// 6. Login Security Alert
notificationEmitter.on('login_alert', async (data) => {
    try {
        const { userEmail, userName } = data;
        await emailService.sendLoginNotificationEmail(userEmail, userName);
    } catch (error) {
        console.error('❌ Notification Event Error (login_alert): ', error.message);
    }
});

// 7. Password Reset Request Event
notificationEmitter.on('password_reset', async (data) => {
    try {
        const { email, name, token } = data;
        await emailService.sendPasswordResetEmail(email, name, token);
    } catch (error) {
        console.error('❌ Notification Event Error (password_reset): ', error.message);
    }
});

module.exports = notificationEmitter;
