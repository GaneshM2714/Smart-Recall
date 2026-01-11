const { aiQueue } = require('../services/aiQueue');

// POST /api/ai/generate
exports.generateCards = async (req, res) => {
  try {
    const { topic, subjectId, amount = 5, difficulty = 'Intermediate' } = req.body;

    if (!topic || !subjectId) {
      return res.status(400).json({ error: "Topic and Subject ID required" });
    }

    // Add to Queue (Instant response)
    const job = await aiQueue.add('generate-deck', {
      topicName: topic,
      subjectId,
      amount,
      difficulty,
      userId: req.user.id
    });

    res.json({
      message: "Generation started",
      jobId: job.id,
      status: 'queued'
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to queue job" });
  }
};

// GET /api/ai/status/:jobId
exports.getJobStatus = async (req, res) => {
  try {
    const job = await aiQueue.getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ state: 'unknown' });
    }

    const state = await job.getState(); 
    const result = job.returnvalue;

    res.json({ id: job.id, state, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};