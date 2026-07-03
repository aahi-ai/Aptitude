// voice.js — live speech-to-text using the Web Speech API
// Pace/pause/filler-word math (prosody) gets built on top of transcriptLog later.

let recognizer = null;
let listening = false;

// Every finalized chunk of speech gets logged here with a timestamp,
// so later modules (pace, filler detection, scoring) can work off real data.
let transcriptLog = [];

/**
 * Starts live speech recognition and streams recognized text into the transcript panel.
 * Returns true if the browser supports it, false otherwise.
 */
function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Web Speech API not supported in this browser.");
    return false;
  }

  transcriptLog = [];
  clearTranscriptDisplay();

  recognizer = new SpeechRecognition();
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = "en-US";

  recognizer.onresult = handleRecognitionResult;

  recognizer.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  // Chrome's recognizer sometimes stops on its own after silence.
  // If we're still supposed to be listening, just restart it.
  recognizer.onend = () => {
    if (listening) {
      recognizer.start();
    }
  };

  recognizer.start();
  listening = true;
  return true;
}

/**
 * Stops speech recognition.
 */
function stopListening() {
  listening = false;
  if (recognizer) {
    recognizer.stop();
    recognizer = null;
  }
}

/**
 * Handles both interim (still-being-spoken) and final (confirmed) results.
 * Final chunks get logged with a timestamp; interim text is shown but not saved.
 */
function handleRecognitionResult(event) {
  let interimText = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const text = result[0].transcript;

    if (result.isFinal) {
      transcriptLog.push({
        text: text.trim(),
        timestamp: Date.now()
      });
    } else {
      interimText += text;
    }
  }

  renderTranscript(interimText);
}

/**
 * Renders the full finalized transcript plus whatever's currently being spoken
 * (shown lighter/greyed until it's finalized).
 */
function renderTranscript(interimText) {
  const body = document.getElementById("transcript-body");

  const finalText = transcriptLog.map((entry) => entry.text).join(" ");

  body.innerHTML = "";

  const finalSpan = document.createElement("span");
  finalSpan.textContent = finalText;
  body.appendChild(finalSpan);

  if (interimText) {
    const interimSpan = document.createElement("span");
    interimSpan.style.opacity = "0.5";
    interimSpan.textContent = " " + interimText;
    body.appendChild(interimSpan);
  }

  body.scrollTop = body.scrollHeight;
}

/**
 * Resets the transcript panel back to its placeholder state.
 */
function clearTranscriptDisplay() {
  const body = document.getElementById("transcript-body");
  body.innerHTML =
    '<span class="live-transcript__placeholder">Your words will appear here as you speak.</span>';
}