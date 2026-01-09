const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateCards = async (req, res) => {
  try {
    const { topic, amount = 5, difficulty = 'Intermediate' } = req.body;

    if (!topic) return res.status(400).json({ error: "Topic is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert teacher creating flashcards for a student.
      
      User Input/Prompt: "${topic}"
      Task: Create ${amount} flashcards.
      Difficulty Level: ${difficulty}
      
      Requirements:
      1. Analyze the User Input and extract a clean, concise "Subject Topic" (max 3-5 words).
         - Example: If input is "how do react hooks work", Topic should be "React Hooks".
      2. "front" should be a clear, concise question.
      3. "back" should be the direct answer (max 2 sentences).
      4. OUTPUT MUST BE A SINGLE VALID JSON OBJECT. 
      5. Do not include markdown formatting like \`\`\`json.

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

    // Cleanup: Remove markdown if Gemini adds it
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Parse JSON
    const parsedData = JSON.parse(cleanedText);

    // 👇 Return both the Cards and the AI-generated Topic Name
    // Handle cases where Gemini might return just the array (fallback)
    const finalCards = Array.isArray(parsedData) ? parsedData : parsedData.cards;
    const finalTopic = parsedData.topic || topic; // Fallback to user input if no topic returned

    res.json({ 
        cards: finalCards, 
        topic: finalTopic 
    });

  } catch (error) {
    console.error("AI Gen Error:", error);
    res.status(500).json({ error: "Failed to generate cards. Try a different topic." });
  }
};