async function testKey() {
  const key = "AIzaSyDCNCTEg7jx3YsaawzsKuDVzUZKQjB8FgE";
  const models = ["gemini-1.5-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"];
  for (const m of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello! Say hi." }] }],
        }),
      }
    );
    const data = await response.json();
    console.log(`Model ${m} status:`, response.status);
    if (response.ok) {
      console.log(`Model ${m} WORKS! Answer:`, data.candidates?.[0]?.content?.parts?.[0]?.text);
      break;
    }
  }
}

testKey().catch(console.error);
