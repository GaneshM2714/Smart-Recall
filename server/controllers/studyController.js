// server/controllers/studyController.js
const { Card, ReviewLog, Topic, Subject, sequelize } = require("../models");
const { calculateFSRS } = require("../utils/algorithm");
const { Op } = require("sequelize");

// 1. GET QUEUE (Cards Due) - Now Supports Filtering by Subject!
exports.getStudyQueue = async (req, res) => {
  try {
    // Check if frontend sent a specific subject ID (e.g., ?subjectId=...)
    const subjectId = req.query.subjectId || req.params.subjectId; 

    // Build the "Where" clause for the Subject
    const subjectFilter = { user_id: req.user.id };
    
    // If a subjectId exists, restrict the query to that subject
    if (subjectId) {
      subjectFilter.id = subjectId; 
    }

    const cards = await Card.findAll({
      where: {
        [Op.or]: [
            { state: 'NEW' },
            { next_review: { [Op.lte]: new Date() } }
        ]
      },
      limit: 50,
      order: [['next_review', 'ASC']],
      // SECURITY & FILTERING: Link Card -> Topic -> Subject
      include: [{
        model: Topic,
        required: true,
        include: [{
          model: Subject,
          required: true,
          where: subjectFilter // <--- DYNAMIC FILTER APPLIED HERE
        }]
      }]
    });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. SUBMIT REVIEW (The Smart Part - Preserved)
exports.submitReview = async (req, res) => {
  const { cardId, rating, durationMs } = req.body;
  
  // Start a Transaction (All or Nothing)
  const t = await sequelize.transaction();

  try {
    // A. Fetch the Card
    const card = await Card.findByPk(cardId, { transaction: t });
    if (!card) throw new Error("Card not found");

    // B. Run FSRS Algorithm
    const updates = calculateFSRS(card.toJSON(), rating);
    
    // C. Update the Main Card
    await card.update(updates, { transaction: t });

    // D. Log the Review
    await ReviewLog.create({
      card_id: cardId,
      rating,
      duration_ms: durationMs || 0
    }, { transaction: t });

    // --- E. THE GRAPH LINKING (Your Custom Logic) ---
    // If user found it 'EASY', boost siblings
    if (rating === 'EASY') {
      await Card.increment(
        { stability: 0.05 }, // Add 5% (Simple boost)
        { 
          where: {
            topic_id: card.topic_id,   // Same Topic
            id: { [Op.ne]: card.id },  // Not the current card
          },
          transaction: t 
        }
      );
    }

    await t.commit();
    res.json({ message: "Review Saved", updates });

  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};

// 3. GET ANALYTICS (Reviews per Day - Preserved)
exports.getAnalytics = async (req, res) => {
  try {
    // Raw SQL is easiest for date grouping across tables
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
    
    // Format for Frontend
    const chartData = results.map(row => ({
      date: new Date(row.date).toLocaleDateString(undefined, { weekday: 'short' }),
      reviews: row.count
    }));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. RANDOM MIX (Global Cram - Revised to match Working Subject Cram)
exports.getGlobalCramQueue = async (req, res) => {
  try {
    console.log(`🔍 Global Cram: Fetching for User ${req.user.id}`);

    const cards = await Card.findAll({
      // Fetch cards linked to the user
      include: [{
        model: Topic,
        required: true, // Inner Join (Must have a topic)
        include: [{
          model: Subject,
          required: true, // Inner Join (Must have a subject)
          where: { user_id: req.user.id } // <--- Filter by User Here
        }]
      }],
      limit: 100 // Fetch a pool of 100 cards
    });

    console.log(`✅ Global Cram: Found ${cards.length} cards via Associations`);

    // Shuffle in JavaScript (Fisher-Yates)
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    // Return top 20
    res.json(cards.slice(0, 20));

  } catch (error) {
    console.error("Global Cram Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 5. SUBJECT CRAM (Specific Subject - Fixed with JS Shuffle)
exports.getCramQueue = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const cards = await Card.findAll({
      include: [{
        model: Topic,
        required: true,
        where: { subject_id: subjectId }, // Filter by Subject
        include: [{
            model: Subject,
            required: true,
            where: { user_id: req.user.id } // Security check
        }]
      }],
      limit: 100 // Fetch a good pool to shuffle from
    });

    // Shuffle in JavaScript for consistency
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};