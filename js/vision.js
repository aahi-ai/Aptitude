// vision.js — camera access, pose detection, and posture scoring

let cameraStream = null;
let poseDetector = null;
let poseLoopRunning = false;
let postureSamples = []; // { questionIndex, angle } — used later for per-question averages

// Set to true if you want the red/green skeleton lines visible again.
// Posture math keeps running either way — this only controls the drawing.
const SHOW_POSE_OVERLAY = false;

const videoEl = () => document.getElementById("camera-feed");
const canvasEl = () => document.getElementById("pose-canvas");

async function startCamera() {
  const video = videoEl();
  const placeholderEl = document.getElementById("video-placeholder");
  const dotEl = document.getElementById("live-dot");
  const labelEl = document.getElementById("live-label");

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true // used only for pause/hesitation detection in audio.js —
                  // speech-to-text (voice.js) uses the browser's own mic access separately
    });

    postureSamples = [];
    startAudioAnalysis(cameraStream);

    video.srcObject = cameraStream;
    video.hidden = false;
    placeholderEl.hidden = true;

    dotEl.classList.add("video-panel__badge-dot--live");
    labelEl.textContent = "camera on";

    await new Promise((resolve) => {
      video.onloadeddata = resolve;
    });

    setupPoseDetector();
    startPoseLoop();

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
  const video = videoEl();
  const canvas = canvasEl();
  const placeholderEl = document.getElementById("video-placeholder");
  const dotEl = document.getElementById("live-dot");
  const labelEl = document.getElementById("live-label");
  const postureValueEl = document.getElementById("posture-value");

  poseLoopRunning = false;
  stopAudioAnalysis();

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  video.hidden = true;
  video.srcObject = null;
  canvas.hidden = true;

  placeholderEl.hidden = false;
  placeholderEl.textContent = "Camera preview will appear here once you start.";

  dotEl.classList.remove("video-panel__badge-dot--live");
  labelEl.textContent = "not started";
  postureValueEl.textContent = "—";
}

function setupPoseDetector() {
  if (poseDetector) return;

  poseDetector = new Pose({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  poseDetector.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  poseDetector.onResults(onPoseResults);
}

function startPoseLoop() {
  const video = videoEl();
  const canvas = canvasEl();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.hidden = false;

  poseLoopRunning = true;

  async function loop() {
    if (!poseLoopRunning) return;
    await poseDetector.send({ image: video });
    requestAnimationFrame(loop);
  }

  loop();
}

function onPoseResults(results) {
  const canvas = canvasEl();
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    if (SHOW_POSE_OVERLAY) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#B23B2E",
        lineWidth: 2
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: "#2F6F4E",
        radius: 2
      });
    }

    updatePostureReading(results.poseLandmarks);
  }

  ctx.restore();
}

function updatePostureReading(landmarks) {
  const postureValueEl = document.getElementById("posture-value");

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftShoulder || !rightShoulder) {
    postureValueEl.textContent = "—";
    return;
  }

  const dx = rightShoulder.x - leftShoulder.x;
  const dy = rightShoulder.y - leftShoulder.y;
  const angleRadians = Math.atan2(dy, dx);
  let angleDegrees = angleRadians * (180 / Math.PI);

  if (angleDegrees > 90) {
    angleDegrees -= 180;
  } else if (angleDegrees < -90) {
    angleDegrees += 180;
  }

  const rounded = Math.round(angleDegrees);
  const label = rounded === 0 ? "0° (level)" : `${rounded > 0 ? "+" : ""}${rounded}°`;
  postureValueEl.textContent = label;

  postureSamples.push({ questionIndex: currentQuestionIndex, angle: angleDegrees });
}