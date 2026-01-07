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

// Add this temporarily to server/index.js
app.get('/api/setup-indexes', async (req, res) => {
  try {
    const { sequelize } = require('./models'); // Ensure sequelize is imported
    
    // 1. Optimize Dashboard & Study: Composite index for Topic + Due Date
    // This dramatically speeds up "Get due cards for this subject"
    await sequelize.query(`
      CREATE INDEX idx_cards_topic_review 
      ON cards(topic_id, next_review);
    `);

    // 2. Optimize Analytics: Index for the Chart Date
    // This makes the "Weekly Activity" chart load instant
    await sequelize.query(`
      CREATE INDEX idx_reviewlogs_reviewed_at 
      ON reviewlogs(reviewed_at);
    `);

    // 3. Optimize Global Cram: Index for finding cards due globally
    // (Your schema shows 'next_review' is MUL, but let's ensure it's optimized for sorting)
    await sequelize.query(`
      CREATE INDEX idx_cards_next_review_sort 
      ON cards(next_review);
    `);

    res.send('✅ Indexes created successfully on Aiven!');
  } catch (error) {
    // If index already exists, it might throw an error, which is fine.
    res.status(500).send('Error (Indexes might already exist): ' + error.message);
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