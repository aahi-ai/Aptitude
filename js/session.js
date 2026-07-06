// session.js — records what actually happened on each question (posture,
// pace, fillers, transcript) so the report page can show real data instead
// of placeholders.

let sessionLog = [];

/**
 * Resets the session log. Call this whenever a new interview starts.
 */
function resetSessionLog() {
  sessionLog = [];
}

/**
 * Captures the final result for one question — pulling real posture samples
 * from vision.js and real pace/filler numbers from prosody.js — and appends
 * it to sessionLog. Called right before advancing to the next question.
 */
function recordQuestionResult(questionIndex) {
  const question = questionBank[questionIndex];
  const metrics = getFinalMetricsForQuestion(questionIndex);

  const samples = postureSamples
    .filter((s) => s.questionIndex === questionIndex)
    .map((s) => s.angle);

  const avgPosture =
    samples.length > 0
      ? Math.round(samples.reduce((sum, a) => sum + a, 0) / samples.length)
      : null;

  sessionLog.push({
    questionIndex,
    type: question.type,
    prompt: question.text,
    transcript: metrics.transcript,
    wpm: metrics.wpm,
    fillerCount: metrics.fillerCount,
    avgPosture
  });
}

/**
 * Computes session-wide averages across every recorded question, skipping
 * any question that didn't produce a usable number (e.g. no speech detected).
 */
function computeSessionAggregates() {
  const wpmValues = sessionLog.map((q) => q.wpm).filter((v) => v !== null);
  const postureValues = sessionLog.map((q) => q.avgPosture).filter((v) => v !== null);
  const totalFillers = sessionLog.reduce((sum, q) => sum + q.fillerCount, 0);

  const avg = (arr) =>
    arr.length > 0 ? Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length) : null;

  return {
    avgWpm: avg(wpmValues),
    avgPosture: avg(postureValues),
    totalFillers
  };
}