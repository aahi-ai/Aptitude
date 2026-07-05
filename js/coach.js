  // coach.js — main session controller
  // Wires the Start/Stop button and Next Question button to the camera,
  // speech recognition, and question flow. Scoring/report generation come later.

  let sessionActive = false;

  const startStopBtn = document.getElementById("start-stop-btn");
  const nextQuestionBtn = document.getElementById("next-question-btn");
  const statusText = document.getElementById("status-text");

  startStopBtn.addEventListener("click", async () => {
    if (!sessionActive) {
      statusText.textContent = "Requesting camera access...";
      const cameraOk = await startCamera();
  
      if (cameraOk) {
        const micOk = startListening();
        if (!micOk) {
          statusText.textContent = "Speech recognition isn't supported in this browser.";
        }

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
    const hasMoreQuestions = goToNextQuestion();

    if (!hasMoreQuestions) {
      nextQuestionBtn.hidden = true;
      statusText.textContent = "All questions answered. Stop the interview to finish.";
    }
  });