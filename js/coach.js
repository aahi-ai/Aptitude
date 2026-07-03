// coach.js — main session controller
// For now: wires the Start/Stop button to the camera and speech recognition.
// Question flow, scoring, and report generation get plugged in here as they're built.

let sessionActive = false;

const startStopBtn = document.getElementById("start-stop-btn");
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

      sessionActive = true;
      startStopBtn.textContent = "Stop interview";
      statusText.textContent = "Session in progress.";
    } else {
      statusText.textContent = "Camera access denied or unavailable.";
    }
  } else {
    stopCamera();
    stopListening();
    sessionActive = false;
    startStopBtn.textContent = "Start interview";
    statusText.textContent = "Session ended.";
  }
});