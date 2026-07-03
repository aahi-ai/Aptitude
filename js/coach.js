    let sessionActive = false;

const startStopBtn = document.getElementById("start-stop-btn");
const statusText = document.getElementById("status-text");

startStopBtn.addEventListener("click", async () => {
  if (!sessionActive) {
    statusText.textContent = "Requesting camera access...";
    const ok = await startCamera();

    if (ok) {
      sessionActive = true;
      startStopBtn.textContent = "Stop interview";
      statusText.textContent = "Session in progress.";
    } else {
      statusText.textContent = "Camera access denied or unavailable.";
    }
  } else {
    stopCamera();
    sessionActive = false;
    startStopBtn.textContent = "Start interview";
    statusText.textContent = "Session ended.";
  }
});