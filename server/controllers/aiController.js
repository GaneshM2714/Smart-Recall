const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateCards = async (req, res) => {
  try {
    // 👇 Accept 'subject' from the frontend
    const { topic, subject, amount = 5, difficulty = 'Intermediate' } = req.body;

    if (!topic) return res.status(400).json({ error: "Topic is required" });

    // Use gemini-1.5-flash (Standard model for speed)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert teacher creating flashcards for a student.
      
      Main Subject: "${subject || 'General Knowledge'}"
      Specific Topic/Focus: "${topic}"
      Task: Create ${amount} flashcards.
      Difficulty Level: ${difficulty}
      
      Requirements:
      1. **Context is Key**: All questions MUST relate strictly to "${subject}". 
         - Example: If Subject is "Quantum Physics" and Topic is "Definition", generate cards defining Quantum Physics terms (e.g. "What is superposition?"), NOT generic dictionary definitions.
      2. Analyze the input and extract a clean "Subject Topic" (max 3-5 words).
         - If the Topic is generic (e.g. "Basics", "Definition"), combine it with the Subject (e.g. "Quantum Physics Basics").
      3. "front" should be a clear, concise question.
      4. "back" should be the direct answer (max 2 sentences).
      5. OUTPUT MUST BE A SINGLE VALID JSON OBJECT. 
      6. Do not include markdown formatting like \`\`\`json.

      Expected JSON Structure:
      {
        "topic": "Clean Topic Title Here",
        "cards": [
          { "front": "Question 1?", "back": "Answer 1" },
          { "front": "Question 2?", "back": "Answer 2" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    const finalCards = Array.isArray(parsedData) ? parsedData : parsedData.cards;
    const finalTopic = parsedData.topic || topic; 

    res.json({ 
        cards: finalCards, 
        topic: finalTopic 
    });

  } catch (error) {
    console.error("AI Gen Error:", error);
    res.status(500).json({ error: "Failed to generate cards. Try a different topic." });
  }
};