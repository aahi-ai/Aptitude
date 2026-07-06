// voice.js — live speech-to-text using the Web Speech API
// Pace/pause/filler-word math (prosody) lives in prosody.js, built on top
// of transcriptLog.

let recognizer = null;
let listening = false;

// Every finalized chunk of speech gets logged here with a timestamp and the
// question it was said during, so later modules (pace, filler detection,
// scoring) can work off real, per-question data.
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
  resetProsodyTimers();

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
 * Final chunks get logged with a timestamp and the current question index;
 * interim text is shown but not saved.
 */
function handleRecognitionResult(event) {
  let interimText = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const text = result[0].transcript;

    if (result.isFinal) {
      transcriptLog.push({
        text: text.trim(),
        timestamp: Date.now(),
        questionIndex: currentQuestionIndex
      });
    } else {
      interimText += text;
    }
  }

  renderTranscript(interimText);
  updateLiveMetrics(interimText);
}

/**
 * Renders one transcript box per question, grouping finalized entries by
 * questionIndex. Whatever's currently being spoken (not yet finalized) is
 * appended, faded, to the box for the active question.
 */
function renderTranscript(interimText) {
  const container = document.getElementById("transcript-body");
  container.innerHTML = "";

  const groups = {};
  transcriptLog.forEach((entry) => {
    if (!groups[entry.questionIndex]) groups[entry.questionIndex] = [];
    groups[entry.questionIndex].push(entry.text);
  });

  const questionIndices = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  const hasCurrentGroup = questionIndices.includes(currentQuestionIndex);

  if (questionIndices.length === 0 && !interimText) {
    clearTranscriptDisplay();
    return;
  }

  questionIndices.forEach((qIndex) => {
    container.appendChild(
      buildTranscriptGroup(qIndex, groups[qIndex].join(" "), qIndex === currentQuestionIndex ? interimText : "")
    );
  });

  // If the current question has no finalized text yet, but there's interim
  // text being spoken, still show a box for it.
  if (!hasCurrentGroup && interimText) {
    container.appendChild(buildTranscriptGroup(currentQuestionIndex, "", interimText));
  }

  container.scrollTop = container.scrollHeight;
}

/**
 * Builds one labeled transcript box for a single question.
 */
function buildTranscriptGroup(questionIndex, finalText, interimText) {
  const group = document.createElement("div");
  group.className = "transcript-group";

  const label = document.createElement("p");
  label.className = "transcript-group__label";
  label.textContent = `Q${questionIndex + 1}`;
  group.appendChild(label);

  const textEl = document.createElement("p");
  textEl.className = "transcript-group__text";
  textEl.textContent = finalText;

  if (interimText) {
    const interimSpan = document.createElement("span");
    interimSpan.clascsName = "transcript-group__interim";
    interimSpan.textContent = (finalText ? " " : "") + interimText;
    textEl.appendChild(interimSpan);
  }

  group.appendChild(textEl);
  return group;
}

/**
 * Resets the transcript panel back to its placeholder state.
 */
function clearTranscriptDisplay() {
  const body = document.getElementById("transcript-body");
  body.innerHTML =
    '<span class="live-transcript__placeholder">Your words will appear here as you speak.</span>';
}