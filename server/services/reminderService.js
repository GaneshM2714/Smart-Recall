const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { sequelize } = require('../models');

// Configure Email (Same as Auth)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendReminders = async () => {
  console.log('⏰ Running Daily Reminder Job...');
  
  try {
    // 1. COMPLEX QUERY: Find Users who have cards due (next_review < NOW)
    // We join User -> Subject -> Topic -> Card to count due cards per user.
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
      console.log('✅ No users have due cards today.');
      return;
    }

    console.log(`📧 Sending reminders to ${results.length} users.`);

    // 2. Loop through users and send emails
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
            <a href="http://localhost:5173/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Review Session</a>
            <br><br>
            <p style="color: #666; font-size: 12px;">Keep learning,<br>The Smart Recall Team</p>
          </div>
        `
      };

      // Send (Don't await loop to prevent blocking, but catch errors)
      transporter.sendMail(mailOptions).catch(err => 
        console.error(`❌ Failed to email ${email}:`, err.message)
      );
    }

  } catch (error) {
    console.error('❌ Reminder Job Failed:', error);
  }
};

// Start the Cron Job
const initScheduler = () => {
  // Cron Syntax: "Minute Hour * * *"
  // "0 9 * * *" means "Run at 9:00 AM every day"
  // For testing right now, use "* * * * *" (Every minute)
  
  cron.schedule('0 9 * * *', () => {
    sendReminders();
  });
  
  console.log('📅 Reminder Scheduler Initialized (Runs daily at 9:00 AM)');
};

module.exports = { initScheduler, sendReminders };