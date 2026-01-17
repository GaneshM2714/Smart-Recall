const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { sequelize } = require('../models');
require('dotenv').config(); // Ensure env vars are loaded

const transporter = nodemailer.createTransport({
  service: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000
});

const sendReminders = async () => {
  console.log('⏰ Running Daily Reminder Job...');
  
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const query = `
      SELECT u.email, COUNT(c.id) as due_count
      FROM Users u
      JOIN Subjects s ON s.user_id = u.id
      JOIN Topics t ON t.subject_id = s.id
      JOIN Cards c ON c.topic_id = t.id
      WHERE c.next_review <= NOW()
      GROUP BY u.email
    `;

    const results = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    if (results.length === 0) {
      console.log('No users have due cards today.');
      return;
    }

    console.log(`Sending reminders to ${results.length} users.`);

    for (const user of results) {
      const { email, due_count } = user;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `🎯 You have ${due_count} cards to review!`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4f46e5;">Time to Strengthen Your Memory! 🧠</h2>
            <p>Hi there,</p>
            <p>You have <strong>${due_count} flashcards</strong> waiting for review right now.</p>
            <p>Remember, the key to long-term memory is consistency. A quick 5-minute session is all it takes.</p>
            <br>
            
            <a href="${CLIENT_URL}/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Start Review Session
            </a>
            
            <br><br>
            <p style="color: #666; font-size: 12px;">Keep learning,<br>The Smart Recall Team</p>
          </div>
        `
      };

      transporter.sendMail(mailOptions).catch(err => 
        console.error(`❌ Failed to email ${email}:`, err.message)
      );
    }

  } catch (error) {
    console.error('❌ Reminder Job Failed:', error);
  }
};

const initScheduler = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    sendReminders();
  });
  
  console.log('📅 Reminder Scheduler Initialized (Runs daily at 9:00 AM)');
};

module.exports = { initScheduler, sendReminders };
