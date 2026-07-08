// api.js — frontend wrapper for calling the backend AI scoring endpoint.
// The actual OpenRouter API key lives server-side in api/score.js, never here.

async function scoreAnswer(question, transcript) {
  try {
    const response = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, transcript })
    });

    if (!response.ok) {
      throw new Error(`Scoring request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      score: typeof data.score === "number" ? data.score : null,
      feedback: data.feedback || "No feedback available."
    };
  } catch (err) {
    console.error("scoreAnswer failed:", err);
    return {
      score: null,
      feedback: "Couldn't score this answer right now."
    };
  }
}