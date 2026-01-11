const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Protect these routes
router.post('/generate',  aiController.generateCards);
router.get('/status/:jobId', aiController.getJobStatus);

module.exports = router;