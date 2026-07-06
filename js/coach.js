// coach.js — main session controller
// Wires the Start/Stop button and Next Question button to the camera,
// speech recognition, and question flow. Also records real per-question
// results (session.js) and saves the finished session (store.js) so
// report.html can show actual data instead of placeholders.

let sessionActive = false;

const startStopBtn = document.getElementById("start-stop-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const statusText = document.getElementById("status-text");
const restartBtn = document.getElementById("restart-btn");

startStopBtn.addEventListener("click", async () => {
  if (!sessionActive) {
    statusText.textContent = "Requesting camera access...";
    const cameraOk = await startCamera();

    if (cameraOk) {
      const micOk = startListening();
      if (!micOk) {
        statusText.textContent = "Speech recognition isn't supported in this browser.";
      }

      resetSessionLog();
      startInterviewQuestions();

      sessionActive = true;
      startStopBtn.textContent = "Stop interview";
      nextQuestionBtn.hidden = false;
      statusText.textContent = "Session in progress.";
    } else {
      statusText.textContent = "Camera access denied or unavailable.";
    }
  } else {
    stopCamera();
    stopListening();
    resetInterviewQuestions();

    sessionActive = false;
    startStopBtn.textContent = "Start interview";
    nextQuestionBtn.hidden = true;
    statusText.textContent = "Session ended.";
  }
});

nextQuestionBtn.addEventListener("click", () => {
  // Capture the question that's ending BEFORE advancing the index.
  const finishedIndex = currentQuestionIndex;
  recordQuestionResult(finishedIndex);

  const hasMoreQuestions = goToNextQuestion();

  if (!hasMoreQuestions) {
    stopCamera();
    stopListening();
    sessionActive = false;

    const aggregates = computeSessionAggregates();
    saveSession(sessionLog, aggregates);

    showCompletionScreen();
  }
});

/**
 * Hides the active session UI and shows the "session complete" screen.
 * Uses the .force-hidden class (not the hidden attribute) because
 * .session__grid/.session__meta/.controls all set an explicit display
 * property, which overrides the browser's default [hidden] styling.
 */
function showCompletionScreen() {
  document.querySelector(".session__meta").classList.add("force-hidden");
  document.getElementById("question-text").classList.add("force-hidden");
  document.querySelector(".session__grid").classList.add("force-hidden");
  document.querySelector(".controls").classList.add("force-hidden");
  document.getElementById("completion-screen").hidden = false;
}

/**
 * Reverses showCompletionScreen() and resets the question flow and transcript.
 */
function hideCompletionScreen() {
  document.querySelector(".session__meta").classList.remove("force-hidden");
  document.getElementById("question-text").classList.remove("force-hidden");
  document.querySelector(".session__grid").classList.remove("force-hidden");
  document.querySelector(".controls").classList.remove("force-hidden");
  document.getElementById("completion-screen").hidden = true;
}

restartBtn.addEventListener("click", () => {
  resetInterviewQuestions();
  clearTranscriptDisplay();
  resetProsodyTimers();
  resetSessionLog();
  hideCompletionScreen();

  startStopBtn.textContent = "Start interview";
  nextQuestionBtn.hidden = true;
  statusText.textContent = "Ready when you are.";
});