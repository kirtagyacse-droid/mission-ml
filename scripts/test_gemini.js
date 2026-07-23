require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY || process.env.YOUTUBE_API_KEY;

async function testGemini() {
  console.log("Testing Gemini API key ending in:", apiKey ? apiKey.slice(-5) : "none");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello! Say hi and give a short 5 word ML tip." }] }],
      }),
    }
  );
  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

testGemini().catch(console.error);
