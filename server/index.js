const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models"); 
require("dotenv").config();
const compression = require('compression'); 
const { initScheduler } = require('./services/reminderService');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. MIDDLEWARE
app.use(express.json());
app.use(cors());
app.use(compression());

// 2. LATENCY DEBUGGER (Add this to see where the 500ms is coming from)
// This prints: "⏱️ GET /api/me [Backend Processing]: 23ms"
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
        console.log(`⏱️ ${req.method} ${req.originalUrl} [Backend]: ${duration}ms`);
    }
  });
  next();
});

// --- ROUTES ---
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const contentRoutes = require("./routes/contentRoutes");
app.use("/api/content", contentRoutes);

const studyRoutes = require("./routes/studyRoutes");
app.use("/api/study", studyRoutes);

// --- SYSTEM & DEBUG ROUTES ---
app.get("/api/status", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "UP", database: "Connected", message: "Hello from Backend!" });
  } catch (error) {
    res.status(500).json({ status: "DOWN", error: error.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    // Keep health checks quiet in logs unless error
    res.status(200).send('OK - DB Active');
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    res.status(500).send('Database Error');
  }
});

app.get('/api/debug-public', async (req, res) => {
  try {
    const { User, Subject, Topic, Card } = require('./models');
    const users = await User.findAll({ attributes: ['id', 'email'] });
    const totalCards = await Card.count();
    
    // Simple breakdown
    const breakdown = [];
    for (const u of users) {
       const cCount = await Card.count({ 
         include: [{ 
           model: Topic, required: true, 
           include: [{ model: Subject, required: true, where: { user_id: u.id } }] 
         }]
       });
       breakdown.push({ email: u.email, cards: cCount });
    }

    res.json({ total_users: users.length, total_cards: totalCards, users: breakdown });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TEMPORARY FIX ROUTE (Delete this after running once) ---
app.get('/api/fix-db-avatar', async (req, res) => {
  try {
    await sequelize.query("ALTER TABLE Users ADD COLUMN avatar VARCHAR(255) NULL;");
    res.send("✅ Success! The 'avatar' column was added.");
  } catch (error) {
    res.send("❌ Error (or column already exists): " + error.message);
  }
});

// --- STARTUP ---
// REMOVED { alter: true } to stop duplicate index errors
sequelize.sync().then(() => {
  console.log("✅ Database Synced");
  
  // Start Server
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  
  // Start Scheduler
  initScheduler(); 
  
}).catch(err => console.log("❌ DB Error:", err));