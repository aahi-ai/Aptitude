let sessionActive = false;
let selectedCategory = "mixed";

const startStopBtn = document.getElementById("start-stop-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const statusText = document.getElementById("status-text");
const restartBtn = document.getElementById("restart-btn");
const categoryPicker = document.getElementById("category-picker");
const categoryButtons = document.querySelectorAll(".category-btn");

categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (sessionActive) return;
    selectedCategory = btn.dataset.category;
    categoryButtons.forEach((b) => b.classList.remove("category-btn--active"));
    btn.classList.add("category-btn--active");
  });
});

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
      startInterviewQuestions(selectedCategory);

      sessionActive = true;
      categoryPicker.classList.add("force-hidden");
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
    categoryPicker.classList.remove("force-hidden");
    startStopBtn.textContent = "Start interview";
    nextQuestionBtn.hidden = true;
    statusText.textContent = "Session ended.";
  }
});

nextQuestionBtn.addEventListener("click", async () => {
  const finishedIndex = currentQuestionIndex;
  recordQuestionResult(finishedIndex);

  nextQuestionBtn.disabled = true;
  statusText.textContent = "Scoring your answer...";

  const finishedEntry = sessionLog.find((q) => q.questionIndex === finishedIndex);
  const result = await scoreAnswer(finishedEntry.prompt, finishedEntry.transcript);
  attachContentScore(finishedIndex, result.score, result.feedback);

  nextQuestionBtn.disabled = false;

  const hasMoreQuestions = goToNextQuestion();

  if (!hasMoreQuestions) {
    stopCamera();
    stopListening();
    sessionActive = false;

    const aggregates = computeSessionAggregates();
    saveSession(sessionLog, aggregates);

    showCompletionScreen();
  } else {
    statusText.textContent = "Session in progress.";
  }
});

function showCompletionScreen() {
  document.querySelector(".session__meta").classList.add("force-hidden");
  document.getElementById("question-text").classList.add("force-hidden");
  document.querySelector(".session__grid").classList.add("force-hidden");
  document.querySelector(".controls").classList.add("force-hidden");
  document.getElementById("completion-screen").hidden = false;
}

function hideCompletionScreen() {
  document.querySelector(".session__meta").classList.remove("force-hidden");
  document.getElementById("question-text").classList.remove("force-hidden");
  document.querySelector(".session__grid").classList.remove("force-hidden");
  document.querySelector(".controls").classList.remove("force-hidden");
  document.getElementById("completion-screen").hidden = true;
  categoryPicker.classList.remove("force-hidden");
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