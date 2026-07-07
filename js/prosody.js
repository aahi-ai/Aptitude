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

let questionStartTimestamps = {};

function countFillers(text) {
  if (!text) return 0;

  let count = 0;
  FILLER_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });

  return count;
}

function resetProsodyTimers() {
  questionStartTimestamps = {};
}

function getFinalMetricsForQuestion(questionIndex) {
  const entries = transcriptLog.filter((entry) => entry.questionIndex === questionIndex);
  const text = entries.map((e) => e.text).join(" ");

  const startTime = questionStartTimestamps[questionIndex];
  const endTime = entries.length > 0 ? entries[entries.length - 1].timestamp : null;

  let wpm = null;
  if (startTime && endTime && entries.length > 0) {
    const elapsedMinutes = (endTime - startTime) / 1000 / 60;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (elapsedMinutes >= 0.05) {
      wpm = Math.round(wordCount / elapsedMinutes);
    }
  }

  return {
    transcript: text,
    wpm,
    fillerCount: countFillers(text)
  };
}

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
    const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
    wpm = Math.round(wordCount / elapsedMinutes);
  }
  paceValueEl.textContent = wpm !== null ? `${wpm} wpm` : "—";

  const fillerCount = countFillers(finalText);
  fillerValueEl.textContent = currentEntries.length > 0 || interimText ? fillerCount : "—";
}