// server/controllers/studyController.js
const { Card, ReviewLog, Topic, Subject, User, sequelize } = require("../models"); // 👈 Added User import
const { calculateFSRS, applyRippleBoost } = require("../utils/algorithm");
const { Op } = require("sequelize");

// 1. GET QUEUE (No changes needed)
exports.getStudyQueue = async (req, res) => {
  try {
    const subjectId = req.query.subjectId || req.params.subjectId; 
    const subjectFilter = { user_id: req.user.id };
    if (subjectId) subjectFilter.id = subjectId; 

    const cards = await Card.findAll({
      where: {
        [Op.or]: [
            { state: 'NEW' },
            { next_review: { [Op.lte]: new Date() } }
        ]
      },
      limit: 50,
      order: [['next_review', 'ASC']],
      include: [{
        model: Topic,
        required: true,
        include: [{
          model: Subject,
          required: true,
          where: subjectFilter 
        }]
      }]
    });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. SUBMIT REVIEW (Updated for Gamification 🔥)
exports.submitReview = async (req, res) => {
  const { cardId, rating, durationMs } = req.body;
  const userId = req.user.id; // From Auth Middleware
  
  const t = await sequelize.transaction();

  try {
    // A. Fetch Card
    const card = await Card.findByPk(cardId, { transaction: t });
    if (!card) throw new Error("Card not found");

    // B. FSRS Algorithm
    const updates = calculateFSRS(card.toJSON(), rating);
    await card.update(updates, { transaction: t });

    // C. Log Review
    await ReviewLog.create({
      card_id: cardId,
      rating,
      duration_ms: durationMs || 0
    }, { transaction: t });

    // --- D. UPDATE USER STREAK & HEATMAP (New Logic) ---
    const user = await User.findByPk(userId, { transaction: t });
    const today = new Date().toISOString().split('T')[0]; // "2025-01-09"
    const lastActive = user.last_active_date; // "2025-01-08"

    let newStreak = user.streak;
    const newActivityLog = { ...user.activity_log }; // Clone existing JSON

    // 1. Update Heatmap Count
    if (newActivityLog[today]) {
        newActivityLog[today] += 1;
    } else {
        newActivityLog[today] = 1;
    }

    // 2. Calculate Streak
    if (lastActive !== today) {
        if (lastActive) {
            // Calculate difference in days
            const diffTime = new Date(today) - new Date(lastActive);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) {
                // Studied yesterday? Increment!
                newStreak += 1;
            } else {
                // Missed a day? Reset to 1 (Today is day 1)
                newStreak = 1;
            }
        } else {
            // First time ever
            newStreak = 1;
        }
    }
    // If lastActive === today, do nothing to streak (already counted for today)

    await user.update({
        streak: newStreak,
        last_active_date: today,
        activity_log: newActivityLog
    }, { transaction: t });

    // --- E. RIPPLE BOOST (Existing Logic) ---
    if (rating === 'EASY') {
       const siblings = await Card.findAll({
           where: {
               topic_id: card.topic_id,
               id: { [Op.ne]: card.id },
               state: { [Op.ne]: 'NEW' },
               next_review: { [Op.gt]: new Date() }
           },
           limit: 5,
           order: sequelize.random(),
           transaction: t
       });

       const siblingUpdates = siblings.map(async (sibling) => {
           const boostData = applyRippleBoost(sibling.toJSON());
           return sibling.update(boostData, { transaction: t });
       });

       await Promise.all(siblingUpdates);
    }

    await t.commit();
    
    // Return streak info so frontend can animate it!
    res.json({ 
        message: "Review Saved", 
        updates, 
        streak: newStreak, 
        reviewsToday: newActivityLog[today] 
    });

  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};

// 3. GET ANALYTICS (Updated to return Heatmap Data)
exports.getAnalytics = async (req, res) => {
  try {
    // 1. Fetch standard chart data (Last 7 days)
    const [results] = await sequelize.query(`
      SELECT 
        DATE(reviewed_at) as date, 
        COUNT(*) as count 
      FROM ReviewLogs 
      WHERE card_id IN (
        SELECT id FROM Cards WHERE topic_id IN (
          SELECT id FROM Topics WHERE subject_id IN (
             SELECT id FROM Subjects WHERE user_id = '${req.user.id}'
          )
        )
      )
      GROUP BY DATE(reviewed_at)
      ORDER BY date ASC
      LIMIT 7
    `);
    
    const chartData = results.map(row => ({
      date: new Date(row.date).toLocaleDateString(undefined, { weekday: 'short' }),
      reviews: row.count
    }));

    // 2. Fetch User Gamification Data
    const user = await User.findByPk(req.user.id, {
        attributes: ['streak', 'activity_log']
    });

    res.json({
        chartData, // Existing Bar Chart
        streak: user.streak || 0,
        heatmap: user.activity_log || {} // Full JSON history for Calendar Heatmap
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ... (Keep existing getGlobalCramQueue, getCramQueue, getKnowledgeGraph, getSubjectGraph exactly as they are)
// 4. RANDOM MIX
exports.getGlobalCramQueue = async (req, res) => {
    // ... paste existing code
    try {
        const cards = await Card.findAll({
          include: [{
            model: Topic,
            required: true,
            include: [{
              model: Subject,
              required: true,
              where: { user_id: req.user.id }
            }]
          }],
          limit: 100
        });
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        res.json(cards.slice(0, 20));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

// 5. SUBJECT CRAM
exports.getCramQueue = async (req, res) => {
    // ... paste existing code
    try {
        const { subjectId } = req.params;
        const cards = await Card.findAll({
          include: [{
            model: Topic,
            required: true,
            where: { subject_id: subjectId },
            include: [{
                model: Subject,
                required: true,
                where: { user_id: req.user.id }
            }]
          }],
          limit: 100
        });
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        res.json(cards);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

// 6. GRAPH
exports.getKnowledgeGraph = async (req, res) => {
    // ... paste existing code
    try {
        const userId = req.user.id;
        const subjects = await Subject.findAll({
          where: { user_id: userId },
          attributes: ['id', 'title'],
          include: [{
            model: Topic,
            attributes: ['id', 'title'],
            include: [{ 
                model: Card,
                attributes: ['id', 'front', 'state', 'stability'] 
            }]
          }]
        });
    
        const nodes = [];
        const links = [];
    
        subjects.forEach(subject => {
          nodes.push({ id: `sub-${subject.id}`, name: subject.title, type: 'SUBJECT', val: 30, color: '#f59e0b' });
          subject.Topics.forEach(topic => {
            const topicNodeId = `topic-${topic.id}`;
            nodes.push({
              id: topicNodeId,
              name: topic.title,
              type: 'TOPIC',
              val: 20, 
              color: '#6366f1' 
            });
            topic.Cards.forEach(card => {
              const cardNodeId = `card-${card.id}`;
              let cardColor = '#9ca3af'; 
              if (card.state === 'REVIEW') {
                  cardColor = card.stability > 20 ? '#10b981' : '#3b82f6'; 
              }
              nodes.push({
                id: cardNodeId,
                name: card.front, 
                type: 'CARD',
                val: 5 + (card.stability || 0), 
                color: cardColor,
                stability: card.stability
              });
              links.push({
                source: topicNodeId,
                target: cardNodeId
              });
            });
          });
        });
        res.json({ nodes, links });
      } catch (error) {
        console.error("Graph Error:", error);
        res.status(500).json({ error: error.message });
      }
};

// 7. SUBJECT GRAPH
exports.getSubjectGraph = async (req, res) => {
    // ... paste existing code
    try {
        const { subjectId } = req.params;
        const subject = await Subject.findOne({
          where: { id: subjectId, user_id: req.user.id },
          include: [{
            model: Topic,
            include: [{ 
                model: Card,
                attributes: ['id', 'front', 'back', 'state', 'stability', 'difficulty']
            }]
          }]
        });
        if (!subject) return res.status(404).json({ error: "Subject not found" });
        const nodes = [];
        const links = [];
        nodes.push({ id: 'HUB', name: subject.title, type: 'HUB', val: 50 });
    
        subject.Topics.forEach(topic => {
          const topicId = `topic-${topic.id}`;
          nodes.push({ id: topicId, name: topic.title, type: 'TOPIC', val: 20 });
          links.push({ source: 'HUB', target: topicId, value: 5 }); 
          topic.Cards.forEach(card => {
            nodes.push({
              id: `card-${card.id}`,
              name: card.front,
              back: card.back,
              type: 'CARD',
              stability: Math.round(card.stability), 
              difficulty: Math.round(card.difficulty), 
              state: card.state,
              color: card.stability > 20 ? '#10b981' : (card.state === 'NEW' ? '#9ca3af' : '#3b82f6')
            });
            links.push({ 
                source: topicId, 
                target: `card-${card.id}`, 
                value: Math.max(1, card.stability / 5) 
            });
          });
        });
        res.json({ nodes, links });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};