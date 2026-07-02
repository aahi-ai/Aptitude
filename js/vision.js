let cameraStream = null;

async function startCamera() {
  const videoEl = document.getElementById("camera-feed");
  const placeholderEl = document.getElementById("video-placeholder");
  const dotEl = document.getElementById("live-dot");
  const labelEl = document.getElementById("live-label");

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false // audio is handled separately in voice.js
    });

    videoEl.srcObject = cameraStream;
    videoEl.hidden = false;
    placeholderEl.hidden = true;

    dotEl.classList.add("video-panel__badge-dot--live");
    labelEl.textContent = "camera on";

    return true;
  } catch (err) {
    console.error("Camera access failed:", err);
    placeholderEl.textContent =
      "Couldn't access your camera. Check permissions and try again.";
    labelEl.textContent = "camera blocked";
    return false;
  }
}


function stopCamera() {
  const videoEl = document.getElementById("camera-feed");
  const placeholderEl = document.getElementById("video-placeholder");
  const dotEl = document.getElementById("live-dot");
  const labelEl = document.getElementById("live-label");

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  videoEl.hidden = true;
  videoEl.srcObject = null;
  placeholderEl.hidden = false;
  placeholderEl.textContent = "Camera preview will appear here once you start.";

  dotEl.classList.remove("video-panel__badge-dot--live");
  labelEl.textContent = "not started";
}
