const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Subject, Topic, Card, sequelize } = require('../models');
require('dotenv').config();

// --- CONFIGURATION ---
const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 1. THE QUEUE (Exported for Controller) ---
const aiQueue = new Queue('ai-deck-generation', { connection: redisConnection });

// --- 2. HELPER: GEMINI API CALL (Private) ---
// We keep this here so logic isn't split across files
async function callGemini(topicName, subjectName, amount, difficulty) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
    Create ${amount} flashcards for the topic "${topicName}" within the subject "${subjectName}".
    Difficulty: ${difficulty}.
    Return ONLY valid JSON:
    {
      "topic": "Refined Topic Title",
      "cards": [ { "front": "Question?", "back": "Answer" } ]
    }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonStr = text.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr);
}

// --- 3. THE WORKER (Background Processor) ---
const worker = new Worker('ai-deck-generation', async (job) => {
  console.log(`[Worker] Processing Job ${job.id}`);
  const { subjectId, topicName, difficulty, amount } = job.data;

  // 1. Context Check (Still good to verify subject exists)
  const subject = await Subject.findByPk(subjectId);
  if (!subject) throw new Error("Subject not found");

  // 2. Call AI (The slow part)
  const aiData = await callGemini(topicName, subject.title, amount, difficulty);

  // 3. DO NOT SAVE TO DB. Just return the data.
  // BullMQ stores this return value in Redis for the frontend to fetch.
  console.log(`[Worker] Job ${job.id} Generated ${aiData.cards.length} cards (Pending Review).`);
  
  return { 
    success: true, 
    topic: aiData.topic || topicName, 
    cards: aiData.cards 
  };

}, { connection: redisConnection });

module.exports = { aiQueue };