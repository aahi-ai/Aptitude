// api/score.js — Vercel serverless function.
// Runs on Vercel's servers, not the browser, so the Hack Club AI API key stays
// hidden here instead of being exposed in frontend JS.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, transcript } = req.body || {};

  // No point calling the AI if there's nothing to score.
  if (!transcript || transcript.trim().length === 0) {
    return res.status(200).json({
      score: null,
      feedback: "No speech was detected for this answer."
    });
  }

  const prompt = `You are an interview coach reviewing one answer from a mock interview.

Question: "${question}"
Candidate's answer: "${transcript}"

Rate the answer from 1-10 on clarity, structure, and relevance to the question.
Respond with ONLY valid JSON, no other text, no markdown formatting, in exactly this shape:
{"score": <number 1-10>, "feedback": "<one specific, actionable sentence of feedback>"}`;

  try {
    const response = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.HACKCLUB_API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Hack Club AI error:", response.status, errText);
      return res.status(200).json({
        score: null,
        feedback: "Scoring is temporarily unavailable (the AI service returned an error)."
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON:", raw);
      return res.status(200).json({
        score: null,
        feedback: "Couldn't parse feedback for this answer."
      });
    }

    return res.status(200).json({
      score: typeof parsed.score === "number" ? parsed.score : null,
      feedback: parsed.feedback || "No feedback returned."
    });
  } catch (err) {
    console.error("Scoring request failed:", err);
    return res.status(200).json({
      score: null,
      feedback: "Couldn't reach the scoring service."
    });
  }
}