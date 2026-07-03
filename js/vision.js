// vision.js — camera access, pose detection, and posture scoring

let cameraStream = null;
let poseDetector = null;
let poseLoopRunning = false;

const videoEl = () => document.getElementById("camera-feed");
const canvasEl = () => document.getElementById("pose-canvas");

/**
 * Requests camera access and starts streaming into the <video> element.
 * Returns true if it succeeded, false if it failed (permission denied, no camera, etc).
 */
async function startCamera() {
  const video = videoEl();
  const placeholderEl = document.getElementById("video-placeholder");
  const dotEl = document.getElementById("live-dot");
  const labelEl = document.getElementById("live-label");

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false // audio is handled separately in voice.js
    });

    video.srcObject = cameraStream;
    video.hidden = false;
    placeholderEl.hidden = true;

    dotEl.classList.add("video-panel__badge-dot--live");
    labelEl.textContent = "camera on";

    // Wait until the video actually has dimensions before starting pose detection
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

/**
 * Stops the camera stream, the pose loop, and resets the video panel.
 */
function stopCamera() {
  const video = videoEl();
  const canvas = canvasEl();
  const placeholderEl = document.getElementById("video-placeholder");
  const dotEl = document.getElementById("live-dot");
  const labelEl = document.getElementById("live-label");
  const postureValueEl = document.getElementById("posture-value");

  poseLoopRunning = false;

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

/**
 * Creates the MediaPipe Pose instance (only once) and configures its accuracy/speed tradeoff.
 */
function setupPoseDetector() {
  if (poseDetector) return; // already set up, reuse it

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

/**
 * Feeds video frames to the pose detector in a loop, roughly matching the browser's
 * repaint rate. Runs until poseLoopRunning is set to false (on stop).
 */
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

/**
 * Called every time MediaPipe finishes analyzing a frame.
 * Draws the skeleton overlay and computes a basic posture reading.
 */
function onPoseResults(results) {
  const canvas = canvasEl();
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#B23B2E",
      lineWidth: 2
    });
    drawLandmarks(ctx, results.poseLandmarks, {
      color: "#2F6F4E",
      radius: 2
    });

    updatePostureReading(results.poseLandmarks);
  }

  ctx.restore();
}

/**
 * Turns raw landmark coordinates into a simple, readable posture metric:
 * the tilt angle of the shoulder line. A level line (~0°) means good alignment;
 * a larger angle means the shoulders are tilted.
 */
function updatePostureReading(landmarks) {
  const postureValueEl = document.getElementById("posture-value");

  // MediaPipe Pose landmark indices: 11 = left shoulder, 12 = right shoulder
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

  // The raw angle can land near ±180° even when shoulders are level, depending on
  // which direction the left->right vector points. Fold it into a -90°..90° range
  // so "level" always reads close to 0°, and the sign tells you which way it's tilted.
  if (angleDegrees > 90) {
    angleDegrees -= 180;
  } else if (angleDegrees < -90) {
    angleDegrees += 180;
  }

  const rounded = Math.round(angleDegrees);
  const label = rounded === 0 ? "0° (level)" : `${rounded > 0 ? "+" : ""}${rounded}°`;
  postureValueEl.textContent = label;
}