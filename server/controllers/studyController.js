const { Card, ReviewLog, sequelize } = require("../models");
const { calculateFSRS } = require("../utils/algorithm");
const { Op } = require("sequelize");

// 1. GET QUEUE (Cards Due)
exports.getStudyQueue = async (req, res) => {
  try {
    const cards = await Card.findAll({
      where: {
        [Op.or]: [
            { state: 'NEW' },
            { next_review: { [Op.lte]: new Date() } } // Due Now or in Past
        ]
      },
      limit: 50, // Session Cap
      order: [['next_review', 'ASC']] // Show oldest due first
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
exports.getCramQueue = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // SQL: Get ALL cards for this subject, shuffled
    const query = `
      SELECT c.* FROM Cards c
      JOIN Topics t ON c.topic_id = t.id
      WHERE t.subject_id = :subjectId
      ORDER BY RAND()
    `;

    const cards = await sequelize.query(query, {
      replacements: { subjectId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGlobalCramQueue = async (req, res) => {
  try {
    // SQL: Get 20 random cards from anywhere
    const query = `
      SELECT c.* FROM Cards c
      ORDER BY RAND()
      LIMIT 20
    `;

    const cards = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};