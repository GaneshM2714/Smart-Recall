const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models"); // Import our DB connection
require("dotenv").config();
const compression = require('compression'); 
const { initScheduler } = require('./services/reminderService');

const app = express();
app.use(express.json());
app.use(cors());
app.use(compression());

sequelize.sync({ alter: true }).then(() => {
  console.log("✅ Database Synced");
  
  // 2. Start Server
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  
  // 3. Start Scheduler
  initScheduler(); 
  
}).catch(err => console.log("❌ DB Error:", err));

// The "Handshake" Endpoint
app.get("/api/status", async (req, res) => {
  try {
    // Test the connection
    await sequelize.authenticate();
    res.json({ 
        status: "UP", 
        database: "Connected (Sequelize)", 
        message: "Hello from the Backend!" 
    });
  } catch (error) {
    res.status(500).json({ status: "DOWN", error: error.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    // This command forces a 'SELECT 1+1' query to the database.
    // It verifies the connection AND counts as "activity" to Aiven.
    await sequelize.authenticate();
    
    // Optional: Log it so you can see it working in Render logs
    console.log('💓 Health Check: Database is active');
    
    res.status(200).send('OK - DB Active');
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    // Return 500 so UptimeRobot knows something is wrong
    res.status(500).send('Database Error');
  }
});

app.get('/api/setup-indexes', async (req, res) => {
  try {
    const { sequelize } = require('./models');

    // 1. Optimize Dashboard & Study: Composite index for Topic + Due Date
    // Note: Using "Cards" (Capitalized)
    await sequelize.query(`
      CREATE INDEX idx_cards_topic_review 
      ON Cards(topic_id, next_review);
    `);

    // 2. Optimize Analytics: Index for the Chart Date
    // Note: Using "ReviewLogs" (Capitalized R and L)
    await sequelize.query(`
      CREATE INDEX idx_reviewlogs_reviewed_at 
      ON ReviewLogs(reviewed_at);
    `);

    // 3. Optimize Global Cram: Index for finding cards due globally
    // Note: Using "Cards" (Capitalized)
    await sequelize.query(`
      CREATE INDEX idx_cards_next_review_sort 
      ON Cards(next_review);
    `);

    res.send('✅ Indexes created successfully on Aiven!');
  } catch (error) {
    // If you run this twice, it will error saying "Index already exists". That is fine.
    res.status(500).send('Error: ' + error.message);
  }
});

app.get('/api/check-schema', async (req, res) => {
  try {
    const { sequelize } = require('./models');
    
    // 1. Get List of Tables
    // This returns something like [ { Tables_in_defaultdb: 'Cards' }, ... ]
    const [tables] = await sequelize.query('SHOW TABLES');
    
    // 2. Get Schema for each table
    const fullSchema = {};
    
    for (const tableObj of tables) {
      // Extract table name (key name varies depending on DB name, so we grab the first value)
      const tableName = Object.values(tableObj)[0];
      
      // Get columns for this table
      const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
      fullSchema[tableName] = columns;
    }

    // 3. Send back pretty JSON
    res.json(fullSchema);
    
  } catch (error) {
    res.status(500).send('Error inspecting DB: ' + error.message);
  }
});

// A "Public" Debug Route - No Login Required
app.get('/api/debug-public', async (req, res) => {
  try {
    const { User, Subject, Topic, Card, sequelize } = require('./models');

    // 1. List ALL Users
    const users = await User.findAll({
      attributes: ['id', 'email', 'createdAt']
    });

    // 2. Count "Orphaned" Cards (Cards with no valid topic)
    const totalCards = await Card.count();
    const orphanedCards = await Card.count({ where: { topic_id: null } });

    // 3. Get Breakdown per User
    const breakdown = [];
    
    for (const u of users) {
      // Count Subjects for this user
      const subjectCount = await Subject.count({ where: { user_id: u.id } });
      
      // Get Subject IDs to find Topics
      const subjects = await Subject.findAll({ where: { user_id: u.id }, attributes: ['id'] });
      const subjectIds = subjects.map(s => s.id);
      
      // Count Topics
      const topicCount = await Topic.count({ where: { subject_id: subjectIds } });
      
      // Get Topic IDs to find Cards
      const topics = await Topic.findAll({ where: { subject_id: subjectIds }, attributes: ['id'] });
      const topicIds = topics.map(t => t.id);
      
      // Count Cards
      const cardCount = await Card.count({ where: { topic_id: topicIds } });

      breakdown.push({
        email: u.email,
        id: u.id,
        subjects: subjectCount,
        topics: topicCount,
        cards: cardCount
      });
    }

    res.json({
      total_users: users.length,
      total_cards_in_db: totalCards,
      orphaned_cards_count: orphanedCards,
      user_breakdown: breakdown
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const authRoutes = require("./routes/authRoutes"); // <--- Import
app.use("/api/auth", authRoutes);                  // <--- Use
const contentRoutes = require("./routes/contentRoutes"); // <--- Import
app.use("/api/content", contentRoutes);                  // <--- Use
// const studyRoutes = require("./routes/studyRoutes");
const studyRoutes = require("./routes/studyRoutes");
app.use("/api/study", studyRoutes);

const PORT = process.env.PORT || 5000;

// Sync Database (Create tables if they don't exist) then start server
// { alter: true } updates tables if you change the model later
sequelize.sync({ alter: true }).then(() => {
  console.log("✅ Database & Tables synced!");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("❌ Database sync failed:", err);
});