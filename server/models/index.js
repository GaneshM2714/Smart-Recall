const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// 1. Setup Connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, // Ensure port is read
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      // THIS IS THE CRITICAL FIX FOR AIVEN / CLOUD DBs
      ssl: process.env.DB_HOST === 'localhost' ? false : {
        require: true,
        rejectUnauthorized: false // Required for many free-tier cloud databases
      }
    }
  }
);
// 2. Define Models

// --- USER ---
const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: true },
  avatar: { type: DataTypes.STRING, allowNull: true, defaultValue: null },

  // Auth Fields
  reset_password_token: { type: DataTypes.STRING, allowNull: true },
  reset_password_expires: { type: DataTypes.DATE, allowNull: true },
  auth_provider: { type: DataTypes.STRING, defaultValue: 'email' },
  google_id: { type: DataTypes.STRING, allowNull: true },

  // 🔥 GAMIFICATION FIELDS (Confirmed Present)
  streak: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  last_active_date: { 
    type: DataTypes.DATEONLY, // Stores YYYY-MM-DD
    allowNull: true 
  },
  // Stores daily counts: { "2025-01-01": 5, "2025-01-02": 12 }
  activity_log: { 
    type: DataTypes.JSON, 
    defaultValue: {} 
  }
});

// --- SUBJECT ---
const Subject = sequelize.define("Subject", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
});

// --- TOPIC ---
const Topic = sequelize.define("Topic", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
}, {
  indexes: [
    {
      unique: true,
      fields: ['subject_id', 'title']
    }
  ]
});

// --- CARD (The Core) ---
const Card = sequelize.define("Card", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  front: { type: DataTypes.TEXT, allowNull: false },
  back: { type: DataTypes.TEXT, allowNull: false },
  card_type: { type: DataTypes.ENUM('BASIC', 'IMAGE', 'CODE'), defaultValue: 'BASIC' },

  // FSRS Algorithm Fields
  next_review: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  stability: { type: DataTypes.FLOAT, defaultValue: 0 },
  difficulty: { type: DataTypes.FLOAT, defaultValue: 0 },
  reps: { type: DataTypes.INTEGER, defaultValue: 0 },
  state: { type: DataTypes.ENUM('NEW', 'LEARNING', 'REVIEW'), defaultValue: 'NEW' },
}, {
  // --- ADDED PERFORMANCE INDEXES HERE ---
  indexes: [
    // 1. Speeds up finding cards due for review (The most critical query)
    {
      name: 'cards_next_review_idx',
      fields: ['next_review']
    },
    // 2. Speeds up filtering cards by Topic (The Subject/Browser View)
    {
      name: 'cards_topic_id_idx',
      fields: ['topic_id']
    }
  ]
});


// --- REVIEW LOG ---
const ReviewLog = sequelize.define("ReviewLog", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  rating: { type: DataTypes.ENUM('AGAIN', 'HARD', 'GOOD', 'EASY'), allowNull: false },
  duration_ms: { type: DataTypes.INTEGER, defaultValue: 0 },
  reviewed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// 3. Define Relationships (Associations)

User.hasMany(Subject, { foreignKey: "user_id", onDelete: "CASCADE" });
Subject.belongsTo(User, { foreignKey: "user_id" });

Subject.hasMany(Topic, { foreignKey: "subject_id", onDelete: "CASCADE" });
Topic.belongsTo(Subject, { foreignKey: "subject_id" });

Topic.hasMany(Card, { foreignKey: "topic_id", onDelete: "CASCADE" });
Card.belongsTo(Topic, { foreignKey: "topic_id" });

Card.hasMany(ReviewLog, { foreignKey: "card_id" });
ReviewLog.belongsTo(Card, { foreignKey: "card_id" });

// 4. Export
module.exports = { sequelize, User, Subject, Topic, Card, ReviewLog };