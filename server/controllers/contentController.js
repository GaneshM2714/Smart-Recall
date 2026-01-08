const { Subject, Topic, Card } = require("../models");
const { sequelize } = require("../models");
const { Op } = require("sequelize");

/* =========================================
   1. SUBJECTS (Scope: Unique per User)
   ========================================= */

exports.createSubject = async (req, res) => {
  try {
    const { title } = req.body;
    
    // Check for existing (Case Insensitive)
    const existingSubject = await Subject.findOne({
      where: {
        user_id: req.user.id,
        [Op.and]: [ sequelize.where(sequelize.fn('LOWER', sequelize.col('title')), title.toLowerCase()) ]
      }
    });

    if (existingSubject) {
      return res.json({ ...existingSubject.toJSON(), created: false });
    }

    const newSubject = await Subject.create({ title, user_id: req.user.id });
    res.json({ ...newSubject.toJSON(), created: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // DUPLICATE CHECK: Does another subject with this name exist?
    const duplicate = await Subject.findOne({
      where: {
        user_id: req.user.id,
        id: { [Op.ne]: id }, // Not this subject
        [Op.and]: [ sequelize.where(sequelize.fn('LOWER', sequelize.col('title')), title.toLowerCase()) ]
      }
    });

    if (duplicate) {
      return res.json({ error: "Subject name already exists" , created : false });
    }

    await Subject.update({ title }, { where: { id, user_id: req.user.id } });
    res.json({ message: "Updated", success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================================
   2. TOPICS (Scope: Unique per Subject)
   ========================================= */

exports.createTopic = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { title } = req.body;

    const existingTopic = await Topic.findOne({
      where: {
        subject_id: subjectId,
        [Op.and]: [ sequelize.where(sequelize.fn('LOWER', sequelize.col('title')), title.toLowerCase()) ]
      }
    });

    if (existingTopic) {
       return res.json({ ...existingTopic.toJSON(), created: false });
    }

    const newTopic = await Topic.create({ title, subject_id: subjectId });
    res.json({ ...newTopic.toJSON(), created: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params; // Topic ID
    const { title, subjectId } = req.body; // Need subjectId to check scope

    // DUPLICATE CHECK: Does another topic in this subject have this name?
    // Note: We need the subject_id. If frontend doesn't send it, we fetch the topic first.
    let targetSubjectId = subjectId;
    
    if (!targetSubjectId) {
        const currentTopic = await Topic.findByPk(id);
        if (!currentTopic) return res.status(404).json({ error: "Topic not found" });
        targetSubjectId = currentTopic.subject_id;
    }

    const duplicate = await Topic.findOne({
      where: {
        subject_id: targetSubjectId,
        id: { [Op.ne]: id }, // Not this topic
        [Op.and]: [ sequelize.where(sequelize.fn('LOWER', sequelize.col('title')), title.toLowerCase()) ]
      }
    });

    if (duplicate) {
      return res.status(409).json({ error: "Topic name already exists in this subject" });
    }

    await Topic.update({ title }, { where: { id } });
    res.json({ message: "Topic Updated", success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================================
   3. CARDS (Scope: Unique Front per Topic)
   ========================================= */

exports.createCard = async (req, res) => {
  try {
    const { topicId, front, back, cardType } = req.body;
    
    // Optional: Check if exact card already exists to prevent double-clicks
    const existingCard = await Card.findOne({
        where: { topic_id: topicId, front: front }
    });

    if (existingCard) {
        // We can silently return the existing one to be safe
        return res.json(existingCard); 
    }

    const newCard = await Card.create({
      topic_id: topicId,
      front,
      back,
      card_type: cardType || 'BASIC'
    });
    
    res.json(newCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { front, back } = req.body;
    
    // 1. Get current card to know its Topic
    const currentCard = await Card.findByPk(id);
    if (!currentCard) return res.status(404).json({ error: "Card not found" });

    // 2. DUPLICATE CHECK: Is there another card in this topic with the same Question (Front)?
    // Only check if 'front' is actually changing
    if (front && front !== currentCard.front) {
        const duplicate = await Card.findOne({
            where: {
                topic_id: currentCard.topic_id,
                front: front, // Exact match on question
                id: { [Op.ne]: id } // Not this card
            }
        });

        if (duplicate) {
            return res.status(409).json({ error: "A card with this question already exists in this topic" });
        }
    }

    await Card.update({ front, back }, { where: { id } });
    res.json({ message: "Card updated", success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================================
   4. GETTERS & DELETES (Standard)
   ========================================= */

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      where: { user_id: req.user.id },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Cards AS c
              INNER JOIN Topics AS t ON c.topic_id = t.id
              WHERE t.subject_id = Subject.id
              AND (c.state = 'NEW' OR c.next_review <= NOW())
            )`),
            'dueCount'
          ]
        ]
      },
      include: [{ model: Topic, attributes: ['id', 'title'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubjectCards = async (req, res) => {
  try {
    const { id } = req.params;
    const topics = await Topic.findAll({
      where: { subject_id: id },
      include: [{ model: Card }]
    });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    await Subject.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================================
   5. MISSING DELETE OPERATIONS
   ========================================= */

// DELETE TOPIC
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Security Check: Ensure the topic belongs to a subject owned by the user
    // This requires a Join with Subject
    const topic = await Topic.findOne({
      where: { id },
      include: [{ 
        model: Subject, 
        where: { user_id: req.user.id } // Only find if Subject belongs to User
      }]
    });

    if (!topic) {
        return res.status(404).json({ error: "Topic not found or unauthorized" });
    }

    await topic.destroy();
    res.json({ message: "Topic deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE CARD
exports.deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    // Security Check: Ensure card -> topic -> subject -> user
    const card = await Card.findOne({
      where: { id },
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

    if (!card) {
        return res.status(404).json({ error: "Card not found or unauthorized" });
    }

    await card.destroy();
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};