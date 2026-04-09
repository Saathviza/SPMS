const nodemailer = require('nodemailer');

/**
 * SIMULATED EMAIL SERVICE
 * In a real production environment, we would use a real SMTP transporter.
 * For this proof of concept, we log the "sent" email to the console.
 */

const transporter = {
    sendMail: async (mailOptions) => {
        console.log("-----------------------------------------");
        console.log("📧 [SIMULATED EMAIL SENT]");
        console.log(`TO: ${mailOptions.to}`);
        console.log(`SUBJECT: ${mailOptions.subject}`);
        console.log("CONTENT:");
        console.log(mailOptions.html);
        console.log("-----------------------------------------");
        return { messageId: 'simulated-' + Date.now() };
    }
};

const emailService = {
    sendBadgeCompletionEmail: async (scoutEmail, scoutName, badgeName) => {
        const mailOptions = {
            from: '"Sri Lanka Scout Association" <no-reply@scout.lk>',
            to: scoutEmail,
            subject: `Congratulations! You've earned the ${badgeName} Badge!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; background-color: #0B5D1E; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #fff; margin: 0;">Achievement Unlocked!</h1>
                    </div>
                    <div style="padding: 20px; text-align: center;">
                        <h2 style="color: #333;">Bravo, ${scoutName}!</h2>
                        <p style="font-size: 18px; color: #555;">We are thrilled to inform you that you have successfully completed all requirements for the</p>
                        <div style="margin: 30px 0; background-color: #f9f9f9; padding: 20px; border-radius: 10px; border: 2px dashed #0B5D1E;">
                            <h3 style="color: #0B5D1E; font-size: 24px; margin: 0;">${badgeName} Badge</h3>
                        </div>
                        <p style="color: #777; line-height: 1.6;">
                            Your hard work, skill acquisition, and dedication to the Scout Promise have been recognized. 
                            This achievement brings you one step closer to the President's Scout Award.
                        </p>
                        <a href="http://localhost:3000/scout/dashboard" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background-color: #0B5D1E; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Awards</a>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #aaa; margin-top: 20px;">
                        © ${new Date().getFullYear()} Sri Lanka Scout Association. All rights reserved.
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error("❌ EMAIL SERVICE ERROR:", error);
            return false;
        }
    }
};

module.exports = emailService;
