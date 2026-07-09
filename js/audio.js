    // audio.js — detects real hesitation pauses from the raw microphone signal,
    // independent of what the speech recognizer transcribes. This exists because
    // Chrome's Web Speech API often strips "um"/"uh" out of the transcript
    // entirely (treating them as disfluencies, not words), so text-based filler
    // detection alone misses them. A pause in the actual audio is a pause
    // regardless of what gets transcribed.

    let audioContext = null;
    let analyserNode = null;
    let audioSource = null;
    let audioAnalysisRunning = false;

    let pauseSamples = []; // { questionIndex, timestamp }

    // State machine for detecting one pause per silence gap
    let isSpeaking = false;
    let silenceStartTime = null;
    let pauseCountedForCurrentGap = false;
    let hasSpokenThisQuestion = false;

    const SILENCE_RMS_THRESHOLD = 0.02; // below this = "quiet enough to be silence"
    const PAUSE_DURATION_MS = 500; // how long silence has to last to count as a hesitation pause

    /**
     * Starts analyzing the raw audio signal from the given stream.
     * Call this once the camera/mic stream is available.
     */
    function startAudioAnalysis(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioSource = audioContext.createMediaStreamSource(stream);
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    audioSource.connect(analyserNode);

    pauseSamples = [];
    resetPauseStateForNewQuestion();

    audioAnalysisRunning = true;
    monitorAudioLevel();
    }

    /**
     * Stops analysis and tears down the audio graph.
     */
    function stopAudioAnalysis() {
    audioAnalysisRunning = false;

    if (audioContext) {
        audioContext.close();
        audioContext = null;
        analyserNode = null;
        audioSource = null;
    }

    const pauseValueEl = document.getElementById("pause-value");
    if (pauseValueEl) pauseValueEl.textContent = "—";
    }

    /**
     * Resets the pause-detection state machine. Call this whenever a new
     * question starts, so pauses from the previous answer don't bleed over.
     */
    function resetPauseStateForNewQuestion() {
    isSpeaking = false;
    silenceStartTime = null;
    pauseCountedForCurrentGap = false;
    hasSpokenThisQuestion = false;

    const pauseValueEl = document.getElementById("pause-value");
    if (pauseValueEl) pauseValueEl.textContent = "0";
    }

    /**
     * Runs continuously while audioAnalysisRunning is true. Reads the current
     * volume level, and counts a "hesitation pause" whenever speech is followed
     * by a silence gap of at least PAUSE_DURATION_MS.
     */
    function monitorAudioLevel() {
    if (!audioAnalysisRunning) return;

    const dataArray = new Uint8Array(analyserNode.fftSize);
    analyserNode.getByteTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);

    const now = Date.now();

    if (rms > SILENCE_RMS_THRESHOLD) {
        isSpeaking = true;
        hasSpokenThisQuestion = true;
        silenceStartTime = null;
        pauseCountedForCurrentGap = false;
    } else {
        if (isSpeaking) {
        isSpeaking = false;
        silenceStartTime = now;
        } else if (hasSpokenThisQuestion && silenceStartTime !== null && !pauseCountedForCurrentGap) {
        const silenceDuration = now - silenceStartTime;
        if (silenceDuration >= PAUSE_DURATION_MS) {
            pauseSamples.push({ questionIndex: currentQuestionIndex, timestamp: now });
            pauseCountedForCurrentGap = true;
            updatePauseReadout();
        }
        }
    }

    requestAnimationFrame(monitorAudioLevel);
    }

    /**
     * Updates the live PAUSES readout with the count for the current question.
     */
    function updatePauseReadout() {
    const pauseValueEl = document.getElementById("pause-value");
    if (!pauseValueEl) return;

    const count = pauseSamples.filter((p) => p.questionIndex === currentQuestionIndex).length;
    pauseValueEl.textContent = count;
    }