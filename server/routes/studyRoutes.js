const express = require("express");
const router = express.Router();
const studyController = require("../controllers/studyController");
const authMiddleware = require("../middleware/authMiddleware");

// Protect these routes so only logged-in users can use them
router.use(authMiddleware);

// GET /api/study/queue -> Get today's cards
router.get("/queue", studyController.getStudyQueue);

// POST /api/study/review -> Submit a rating (Easy/Hard/etc)
router.post("/review", studyController.submitReview);

router.get("/analytics", studyController.getAnalytics);

// FIX: Removed 'authenticateToken' here
router.get('/cram/:subjectId', studyController.getCramQueue);

router.get('/cram/global', studyController.getGlobalCramQueue);

module.exports = router;    