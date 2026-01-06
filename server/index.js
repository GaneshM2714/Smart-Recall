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

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
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