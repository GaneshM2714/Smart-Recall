const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// --- SUBJECTS ---
router.post("/subjects", contentController.createSubject);
router.get("/subjects", contentController.getSubjects);
router.put('/subjects/:id', contentController.updateSubject);
router.delete('/subjects/:id', contentController.deleteSubject);

// --- TOPICS ---
// 1. Manual Mode (URL contains ID): POST /api/content/topics/123
router.post("/topics/:subjectId", contentController.createTopic);

// 2. 👇 AI Mode (Body contains ID): POST /api/content/topics
router.post("/topics", contentController.createTopic);

router.delete('/topics/:id',  contentController.deleteTopic);

// --- CARDS ---
router.post("/cards", contentController.createCard);
router.put('/cards/:id', contentController.updateCard);
router.delete('/cards/:id',  contentController.deleteCard);
router.get('/subjects/:id/cards', contentController.getSubjectCards);

module.exports = router;