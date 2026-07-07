let sessionLog = [];

function resetSessionLog() {
  sessionLog = [];
}

function recordQuestionResult(questionIndex) {
  const question = activeQuestions[questionIndex];
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