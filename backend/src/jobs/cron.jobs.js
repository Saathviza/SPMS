const cron = require('node-cron');
const pool = require('../config/db.config');
const notificationEmitter = require('../events/notification.events');

/**
 * 🕒 CRON JOB ENGINE (Automated Reminder System)
 * Runs autonomously in the background to automatically "Nudge" students 
 * and professors just like a University E-Learning Platform.
 */

// Function to start all cron jobs
const startCronJobs = () => {
    
    // =========================================================
    // JOB 1: THE NUDGE (PENDING SCOUT SUBMISSIONS)
    // Runs every day at 8:00 AM ('0 8 * * *'). 
    // =========================================================
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ [CRON] Running daily check for pending Scout submissions...');
        try {
            // Find scouts who registered for an activity, have no proof submitted, and the activity date has passed or was tracking as PENDING.
            const [pendingScouts] = await pool.query(`
                SELECT u.email, u.full_name as scout_name, a.activity_name
                FROM activity_tracking t
                JOIN activities a ON t.activity_id = a.id
                JOIN scouts s ON t.scout_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE t.activity_status = 'PENDING'
            `);

            if (pendingScouts.length > 0) {
                console.log(`⏰ [CRON] Found ${pendingScouts.length} pending scout submissions.`);
                pendingScouts.forEach(record => {
                    notificationEmitter.emit('cron_reminder', {
                        userEmail: record.email,
                        userName: record.scout_name,
                        messageHeader: 'Pending Activity Submission',
                        messageBody: `You have an uncompleted submission for <b>${record.activity_name}</b>. Please upload your evidence to progress.`
                    });
                });
            }
        } catch (error) {
            console.error('❌ [CRON ERROR] Missing submissions check failed:', error.message);
        }
    });

    // =========================================================
    // JOB 2: LEADER APPROVAL BACKLOG (Staff Reminder)
    // Runs every day at 8:15 AM ('15 8 * * *')
    // =========================================================
    cron.schedule('15 8 * * *', async () => {
        console.log('⏰ [CRON] Running daily check for Scout Leader backlogs...');
        try {
            // This query finds leader users who have pending approvals stacking up
            const [pendingLeaders] = await pool.query(`
                SELECT u.email, u.full_name as leader_name, sg.group_name, COUNT(laa.id) as pending_count
                FROM leader_activity_approvals laa
                JOIN scouts s ON laa.scout_id = s.id
                JOIN scout_leaders sl ON s.scout_group_id = sl.scout_group_id
                JOIN scout_groups sg ON sl.scout_group_id = sg.id
                JOIN users u ON sl.user_id = u.id
                WHERE laa.approval_status = 'PENDING'
                GROUP BY u.email, u.full_name, sg.group_name
                HAVING pending_count > 0
            `);

            if (pendingLeaders.length > 0) {
                console.log(`⏰ [CRON] Found ${pendingLeaders.length} leaders with active backlogs.`);
                pendingLeaders.forEach(leader => {
                    notificationEmitter.emit('cron_reminder', {
                        userEmail: leader.email,
                        userName: leader.leader_name,
                        messageHeader: 'Pending Scout Submissions to Grade',
                        messageBody: `You have <b>${leader.pending_count}</b> scout activity submission(s) waiting for your grading and approval in your Leader Dashboard for group: ${leader.group_name}.`
                    });
                });
            }
        } catch (error) {
            console.error('❌ [CRON ERROR] Leader backlog check failed:', error.message);
        }
    });

    // =========================================================
    // JOB 3: EXAMINER BADGE BACKLOG
    // Runs every day at 8:30 AM ('30 8 * * *')
    // =========================================================
    cron.schedule('30 8 * * *', async () => {
        console.log('⏰ [CRON] Running daily check for Examiner Badge backlogs...');
        try {
            // Find examiners (role_id = 3) who have pending badges.
            // Simplified: Email ALL active examiners if there are ANY pending badges in the system to ensure prompt evaluation.
            const [pendingBadges] = await pool.query("SELECT COUNT(id) as total_pending FROM badge_submissions WHERE status = 'PENDING'");
            if (pendingBadges[0].total_pending > 0) {
                const total = pendingBadges[0].total_pending;
                const [examiners] = await pool.query("SELECT email, full_name FROM users WHERE role_id = 3 AND status = 'ACTIVE'");
                
                examiners.forEach(examiner => {
                    notificationEmitter.emit('cron_reminder', {
                        userEmail: examiner.email,
                        userName: examiner.full_name,
                        messageHeader: 'Pending Badge Applications',
                        messageBody: `There are currently <b>${total}</b> pending Badge Applications waiting for Examiner evaluation in the portal. Please log in to review them.`
                    });
                });
            }
        } catch (error) {
            console.error('❌ [CRON ERROR] Examiner backlog check failed:', error.message);
        }
    });

    console.log('⏰ [CRON] Automated E-Learning Nudge Engine Started Successfully.');
};

module.exports = startCronJobs;
