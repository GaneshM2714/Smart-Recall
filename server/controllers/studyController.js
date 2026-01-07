const { Card, ReviewLog, Topic, Subject, sequelize } = require("../models");
const { calculateFSRS } = require("../utils/algorithm");
const { Op } = require("sequelize");

// 1. GET QUEUE (Cards Due)
exports.getStudyQueue = async (req, res) => {
  try {
    const cards = await Card.findAll({
      where: {
        [Op.or]: [
            { state: 'NEW' },
            { next_review: { [Op.lte]: new Date() } }
        ]
      },
      limit: 50,
      order: [['next_review', 'ASC']],
      // SECURITY FIX: Filter by User via Topic -> Subject
      include: [{
        model: Topic,
        required: true,
        include: [{
          model: Subject,
          required: true,
          where: { user_id: req.user.id }
        }]
      }]
    });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. SUBMIT REVIEW (The Smart Part)
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
        { stability: 0.05 }, // Add 5% (Simple boost) or multiply logic
        { 
          where: {
            topic_id: card.topic_id,   // Same Topic
            id: { [Op.ne]: card.id },  // Not the current card
          },
          transaction: t 
        }
      );
      // Note: In production, you might want to recalculate 'next_review' for siblings too,
      // but strictly adjusting stability is safer for now.
    }

    await t.commit();
    res.json({ message: "Review Saved", updates });

  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};

// 3. GET ANALYTICS (Reviews per Day)
exports.getAnalytics = async (req, res) => {
  try {
    // Raw SQL is often easier for date grouping
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

// NEW: Cram Session (Review All Cards in a Subject)
// Cram a specific Subject
exports.getCramQueue = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const cards = await Card.findAll({
      // Sequelize Random Sort (Works on Postgres/MySQL/SQLite)
      order: sequelize.random(),
      include: [{
        model: Topic,
        required: true,
        where: { subject_id: subjectId }, // Filter by Subject
        include: [{
            model: Subject,
            required: true,
            where: { user_id: req.user.id } // Security check
        }]
      }]
    });

    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Random Mix (20 Cards from ANY of your subjects)
exports.getGlobalCramQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🔍 DEBUG: Requesting Cram for User ID: ${userId}`);

    // 1. Get Subject IDs
    const subjects = await Subject.findAll({ 
      where: { user_id: userId },
      attributes: ['id'] 
    });
    const subjectIds = subjects.map(s => s.id);
    
    if (subjectIds.length === 0) {
      console.log("❌ DEBUG: No Subjects found for this user.");
      return res.json([]); 
    }

    // 2. Get Topic IDs
    const topics = await Topic.findAll({
      where: { subject_id: { [Op.in]: subjectIds } },
      attributes: ['id']
    });
    const topicIds = topics.map(t => t.id);

    if (topicIds.length === 0) {
      console.log("❌ DEBUG: No Topics found.");
      return res.json([]);
    }

    // 3. Get Cards
    const cards = await Card.findAll({
      where: { topic_id: { [Op.in]: topicIds } },
      order: sequelize.random(),
      limit: 20
    });

    console.log(`✅ DEBUG: Found ${cards.length} cards.`);
    res.json(cards);

  } catch (error) {
    console.error("Cram Error:", error);
    res.status(500).json({ error: error.message });
  }
};