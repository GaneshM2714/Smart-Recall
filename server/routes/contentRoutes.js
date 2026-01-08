const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");
const authMiddleware = require("../middleware/authMiddleware");

// Protect all these routes (This applies to everything below automatically)
router.use(authMiddleware);

router.post("/subjects", contentController.createSubject);
router.get("/subjects", contentController.getSubjects);

// FIX: Removed 'authenticateToken' argument because it's already handled above
router.put('/subjects/:id', contentController.updateSubject);
router.delete('/subjects/:id', contentController.deleteSubject);
router.put('/cards/:id', contentController.updateCard);

router.post("/topics/:subjectId", contentController.createTopic);
router.post("/cards", contentController.createCard);
router.get('/subjects/:id/cards', contentController.getSubjectCards);

router.delete('/topics/:id',  contentController.deleteTopic);
router.delete('/cards/:id',  contentController.deleteCard);

module.exports = router;