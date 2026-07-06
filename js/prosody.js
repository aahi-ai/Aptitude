// prosody.js — turns raw transcript entries into real pace (WPM) and
// filler word metrics. Reads from transcriptLog and currentQuestionIndex,
// both declared globally in voice.js / interview.js.

// Common filler words/phrases. Matched as whole words (case-insensitive) so
// "like" only counts on its own, not inside "likely" or "liked".
const FILLER_PATTERNS = [
  /\bum+\b/gi,
  /\buh+\b/gi,
  /\ber+\b/gi,
  /\blike\b/gi,
  /\byou know\b/gi,
  /\bi mean\b/gi,
  /\bsort of\b/gi,
  /\bkind of\b/gi,
  /\bbasically\b/gi
];

// Tracks when speech first started for each question, so WPM can be computed
// continuously (using interim + final text) instead of waiting for two
// separate finalized chunks, which may never happen if someone talks without
// pausing.
let questionStartTimestamps = {};

/**
 * Counts filler word occurrences in a block of text.
 * Note: "like" is a genuinely common word too, so this is an approximation,
 * not a perfect filler detector — good enough to flag patterns, not a legal
 * transcript audit.
 */
function countFillers(text) {
  if (!text) return 0;

  let count = 0;
  FILLER_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });

  return count;
}

/**
 * Clears all recorded question start times. Call this whenever a session
 * starts or restarts, so old timing data doesn't leak into a new attempt.
 */
function resetProsodyTimers() {
  questionStartTimestamps = {};
}

/**
 * Recomputes and displays PACE and FILLERS for the currently active question.
 * Uses both finalized transcript text and whatever's currently being spoken
 * (interimText), so the pace reading updates continuously rather than only
 * after a pause triggers a finalized chunk.
 */
function updateLiveMetrics(interimText) {
  const paceValueEl = document.getElementById("pace-value");
  const fillerValueEl = document.getElementById("filler-value");

  const now = Date.now();
  if (questionStartTimestamps[currentQuestionIndex] === undefined) {
    questionStartTimestamps[currentQuestionIndex] = now;
  }

  const currentEntries = transcriptLog.filter(
    (entry) => entry.questionIndex === currentQuestionIndex
  );
  const finalText = currentEntries.map((e) => e.text).join(" ");
  const combinedText = `${finalText} ${interimText || ""}`.trim();

  const elapsedMinutes = (now - questionStartTimestamps[currentQuestionIndex]) / 1000 / 60;

  let wpm = null;
  if (combinedText && elapsedMinutes >= 0.05) {
    // at least ~3 seconds of data
    const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
    wpm = Math.round(wordCount / elapsedMinutes);
  }
  paceValueEl.textContent = wpm !== null ? `${wpm} wpm` : "—";

  const fillerCount = countFillers(finalText);
  fillerValueEl.textContent = currentEntries.length > 0 || interimText ? fillerCount : "—";
}