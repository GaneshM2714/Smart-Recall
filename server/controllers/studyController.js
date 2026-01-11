const { Card, ReviewLog, Topic, Subject, User, sequelize } = require("../models");
const { calculateFSRS, applyRippleBoost } = require("../utils/algorithm");
const { Op } = require("sequelize");
const redis = require('../config/redis');

exports.getStudyQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.query.subjectId || req.params.subjectId;
    
    const cacheKey = subjectId 
      ? `queue:${userId}:${subjectId}` 
      : `queue:${userId}:global`;

    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("serving from redis")
      return res.json(JSON.parse(cachedData));
    }
    else console.log("Miss");

    const subjectFilter = { user_id: userId };
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

    if (cards.length > 0) {
      await redis.set(cacheKey, JSON.stringify(cards), 'EX', 300);
    }

    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitReview = async (req, res) => {
  const { cardId, rating, durationMs } = req.body;
  const userId = req.user.id;
  
  const t = await sequelize.transaction();

  try {
    const card = await Card.findByPk(cardId, { transaction: t });
    if (!card) throw new Error("Card not found");

    const updates = calculateFSRS(card.toJSON(), rating);
    await card.update(updates, { transaction: t });

    await ReviewLog.create({
      card_id: cardId,
      rating,
      duration_ms: durationMs || 0
    }, { transaction: t });

    const user = await User.findByPk(userId, { transaction: t });
    const today = new Date().toISOString().split('T')[0];
    const lastActive = user.last_active_date;

    let newStreak = user.streak;
    const newActivityLog = { ...user.activity_log };

    if (newActivityLog[today]) {
        newActivityLog[today] += 1;
    } else {
        newActivityLog[today] = 1;
    }

    if (lastActive !== today) {
        if (lastActive) {
            const diffTime = new Date(today) - new Date(lastActive);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays === 1) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }
        } else {
            newStreak = 1;
        }
    }

    await user.update({
        streak: newStreak,
        last_active_date: today,
        activity_log: newActivityLog
    }, { transaction: t });

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
    
    await redis.del(`queue:${userId}:global`);
    if (card.Topic && card.Topic.subject_id) {
        await redis.del(`queue:${userId}:${card.Topic.subject_id}`);
    }

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

exports.getAnalytics = async (req, res) => {
    try {
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
    
        const user = await User.findByPk(req.user.id, {
            attributes: ['streak', 'activity_log']
        });
    
        res.json({
            chartData, 
            streak: user.streak || 0,
            heatmap: user.activity_log || {} 
        });
    
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

exports.getGlobalCramQueue = async (req, res) => {
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

exports.getCramQueue = async (req, res) => {
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

exports.getKnowledgeGraph = async (req, res) => {
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
        res.status(500).json({ error: error.message });
      }
};

exports.getSubjectGraph = async (req, res) => {
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