const nodemailer = require('nodemailer');

// Initialize the Nodemailer transporter using environment variables.
// This is structured modularly. If you ever switch to Resend, SendGrid, etc.,
// you only need to change this transporter setup and the base `sendEmail` implementation.
let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: true, // true for 465, false for other ports like 587
    auth: {
      user: process.env.SMTP_USER, // Your email address
      pass: process.env.SMTP_PASS, // Your App Password
    },
  });
} catch (error) {
  console.error('❌ CRITICAL ERROR INITIALIZING EMAIL SERVICE:', error.message);
}

/**
 * Base email sending function. 
 * Every other email function in the app relies on this safely.
 */
const sendEmail = async ({ to, bcc, subject, htmlBody }) => {
  // If no SMTP_USER or PASS is provided in .env, just log it instead of crashing.
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`⚠️ EMAIL SERVICE BYPASS: Cannot send to ${to} (Missing SMTP Credentials in .env)`);
    console.log(`[Email Preview] Subject: ${subject}`);
    return false;
  }

  try {
    const mailOptions = {
      from: `"Scout PMS Notification" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlBody,
    };
    if (bcc) mailOptions.bcc = bcc;

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`📧 SUCCESS: Email sent to ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    // Robust error handling to prevent the main thread from crashing
    console.error(`❌ FAILED: Could not send email to ${to}`);
    console.error(`Reason: ${error.message}`);
    return false;
  }
};

/**
 * Pre-configured template for User Registrations
 */
const sendWelcomeEmail = async (userEmail, fullName, roleName) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: auto; border-top: 5px solid #0B5D1E;">
        <h2 style="color: #0B5D1E;">Welcome to Scout PMS!</h2>
        <p>Hello <b>${fullName}</b>,</p>
        <p>Your account has been successfully registered to the Scout Performance Management System as a <b>${roleName}</b>.</p>
        <p>You can now log in and access your dashboard to begin your journey.</p>
        <br/>
        <p style="color: #666; font-size: 12px;">This is an automated real-time notification from your system.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: userEmail, subject: "Welcome to Scout PMS", htmlBody });
};

/**
 * Pre-configured template for Activity Submission Updates
 */
const sendActivityUpdateEmail = async (userEmail, scoutName, activityName, status) => {
  let headerColor = '#64748b'; // default slate
  let message = `Your activity for <b>${activityName}</b> has been updated!`;
  
  if (status === 'APPROVED') {
    headerColor = '#22c55e'; // green
    message = `Your activity proof submission for <b>${activityName}</b> has been approved by your leader!`;
  } else if (status === 'REJECTED') {
    headerColor = '#ef4444'; // red
    message = `Your activity proof submission for <b>${activityName}</b> was rejected. Please review and resubmit.`;
  } else if (status === 'REGISTERED') {
    headerColor = '#3b82f6'; // blue
    message = `You have successfully registered for the activity: <b>${activityName}</b>.`;
  } else if (status === 'SUBMITTED FOR REVIEW') {
    headerColor = '#8b5cf6'; // purple
    message = `Your proof and evidence for <b>${activityName}</b> have been submitted and are pending leader review.`;
  } else {
    headerColor = '#eab308'; // yellow
  }
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: auto; border-top: 5px solid ${headerColor};">
        <h2 style="color: ${headerColor};">Activity Progress Update</h2>
        <p>Hello <b>${scoutName}</b>,</p>
        <p>${message}</p>
        <p>Current Status: <b>${status}</b></p>
        <br/>
        <p>Log into your Scout Dashboard to view more details.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: userEmail, subject: `Activity Update: ${activityName} - ${status}`, htmlBody });
};

/**
 * Pre-configured template for Badge Submissions
 */
const sendBadgeSubmissionEmail = async (userEmail, scoutName, badgeName) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: auto; border-top: 5px solid #3b82f6;">
        <h2 style="color: #3b82f6;">Badge Application Received</h2>
        <p>Hello <b>${scoutName}</b>,</p>
        <p>Your application for the <b>${badgeName}</b> badge has been successfully submitted and is now pending review by an Examiner.</p>
        <br/>
        <p>You can track the status of your badge in the Scout Dashboard.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: userEmail, subject: `Badge Submission Received: ${badgeName}`, htmlBody });
};

/**
 * Private Scout Congratulation Email (When Badge Achieved)
 */
const sendBadgeAwardedEmail = async (userEmail, scoutName, badgeName) => {
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; padding: 40px 20px;">
      <div style="background-color: white; border-radius: 16px; overflow: hidden; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
        <!-- Flyer Header / Hero Section -->
        <div style="background: linear-gradient(135deg, #0B5D1E 0%, #16a34a 100%); padding: 40px 20px; text-align: center; color: white;">
          <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; line-height:80px;">
            🏆
          </div>
          <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Congratulations!</h1>
          <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Sri Lanka Scout Performance Management System</p>
        </div>

        <!-- Flyer Body -->
        <div style="padding: 40px; text-align: center;">
          <p style="color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold; margin-bottom: 10px;">This serves to certify that</p>
          <h2 style="color: #0f172a; font-size: 32px; margin: 0 0 20px;">${scoutName}</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Has demonstrated exceptional skill, dedication, and character to officially achieve the prestige of the
          </p>
          
          <!-- Visual Badge "Flyer" Element -->
          <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 30px;">
             <div style="font-size: 48px; margin-bottom: 10px;">🎖️</div>
             <h3 style="color: #92400e; margin: 0; font-size: 20px;">${badgeName}</h3>
             <p style="color: #b45309; margin: 5px 0 0; font-size: 12px; font-weight: bold;">OFFICIAL MERIT BADGE</p>
          </div>

          <p style="color: #0f172a; font-size: 16px; font-weight: 500;">Congratulations on your outstanding success!</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">- Issued by the District Examination Board -</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail({ to: userEmail, subject: `🏆 Congratulations! You earned the ${badgeName} Badge!`, htmlBody });
};

/**
 * Community Broadcast Email (When someone achieves something)
 */
const sendCommunityBroadcastEmail = async (bccList, scoutName, badgeName) => {
  // If no one to send to, just return
  if (!bccList || bccList.length === 0) return true;
  
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
      <div style="background-color: white; border-radius: 12px; overflow: hidden; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #1e293b; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 18px; letter-spacing: 1px;">📢 Congratulations!</h2>
        </div>
        <div style="padding: 30px; text-align: center;">
          <h3 style="color: #0f172a; font-size: 22px; margin-bottom: 15px;">Achievement Celebration!</h3>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            We are proud to announce that <b>${scoutName}</b> has just achieved the <b>${badgeName} Badge</b>!
          </p>
          <div style="font-size: 40px; margin: 20px 0;">🎉 ✨ 👏</div>
          <p style="color: #0B5D1E; font-weight: bold;">Congratulations to ${scoutName}! All of us in the group are proud of your success!</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 14px;">Log in to your dashboard to see your own progress. Consistency is key!</p>
        </div>
      </div>
    </div>
  `;
  // Using BCC to protect privacy
  return sendEmail({ to: process.env.SMTP_USER || 'system@scoutpms.com', bcc: bccList, subject: `📣 Congratulations! ${scoutName} achieved a New Badge!`, htmlBody });
};

/**
 * Scheduled Cron Reminders (Generic Template)
 */
const sendCronReminderEmail = async (userEmail, userName, messageHeader, messageBody) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: auto; border-top: 5px solid #ef4444;">
        <h2 style="color: #ef4444;">⏰ Action Required: ${messageHeader}</h2>
        <p>Hello <b>${userName}</b>,</p>
        <p>${messageBody}</p>
        <br/>
        <p>Please log in to your Scout PMS Dashboard to handle this task.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: userEmail, subject: `Reminder: ${messageHeader}`, htmlBody });
};

/**
 * Security Login Alert
 */
const sendLoginNotificationEmail = async (userEmail, userName) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: auto; border-top: 5px solid #64748b;">
        <h2 style="color: #64748b;">Security Alert: New Sign-in</h2>
        <p>Hello <b>${userName}</b>,</p>
        <p>We detected a new sign-in to your Scout PMS account.</p>
        <p>If this was you, you can safely ignore this email.</p>
        <br/>
        <p style="color: #94a3b8; font-size: 12px;">This is an automated real-time notification from your system.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: userEmail, subject: `Security Alert: New sign-in to Scout PMS`, htmlBody });
};

/**
 * Password Reset Email
 */
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: auto; border-top: 5px solid #E6B800;">
        <h2 style="color: #E6B800;">Password Reset Request</h2>
        <p>Hello <b>${userName}</b>,</p>
        <p>We received a request to reset your password for your Scout PMS account.</p>
        <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0B5D1E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">If the button doesn't work, copy and paste this link: <br/> ${resetLink}</p>
      </div>
    </div>
  `;
  return sendEmail({ to: userEmail, subject: "Scout PMS: Password Reset Request", htmlBody });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendActivityUpdateEmail,
  sendBadgeSubmissionEmail,
  sendBadgeAwardedEmail,
  sendCommunityBroadcastEmail,
  sendCronReminderEmail,
  sendLoginNotificationEmail,
  sendPasswordResetEmail
};
