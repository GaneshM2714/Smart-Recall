const { Subject, Topic, Card } = require("../models");
const { sequelize } = require("../models");

// 1. Create a Subject
exports.createSubject = async (req, res) => {
  try {
    const { title } = req.body;
    const newSubject = await Subject.create({
      title,
      user_id: req.user.id // Taken from the middleware
    });
    res.json(newSubject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    await Subject.update({ title }, { where: { id, user_id: req.user.id } });
    res.json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE SUBJECT
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await Subject.destroy({ where: { id, user_id: req.user.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE CARD (Fix typos instantly)
exports.updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { front, back } = req.body;
    
    // Check ownership via a join or simple look up (simplified here)
    // In production, ensure the card belongs to a topic owned by the user
    await Card.update({ front, back }, { where: { id } });
    
    res.json({ message: "Card updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get All My Subjects (with their Topics)
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      where: { user_id: req.user.id },
      attributes: {
        include: [
          // Subquery to count Due Cards
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
      // Crucial: This brings back the Topics list for your dropdown
      include: [{
        model: Topic,
        attributes: ['id', 'title'] 
      }] 
    });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 3. Create a Topic inside a Subject
exports.createTopic = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { title } = req.body;

    // CHECK: Does this topic already exist in this subject?
    const existingTopic = await Topic.findOne({
      where: {
        subject_id: subjectId,
        title: title
      }
    });

    if (existingTopic) {
      return res.status(400).json({ error: "Topic already exists in this subject" });
    }

    // If not, create it
    const newTopic = await Topic.create({
      title,
      subject_id: subjectId
    });
    
    res.json(newTopic);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 3. Create a Card (ADD THIS FUNCTION)
exports.createCard = async (req, res) => {
  try {
    const { topicId, front, back, cardType } = req.body;
    
    // Default FSRS values are handled by the Model/Database defaults
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

exports.getSubjectCards = async (req, res) => {
  try {
    const { id } = req.params; // Subject ID
    const topics = await Topic.findAll({
      where: { subject_id: id },
      include: [{ model: Card }] // Fetch cards nested in topics
    });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};