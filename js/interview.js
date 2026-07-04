// interview.js — question bank and question flow
// Static list for now. Adaptive follow-ups (via the AI API) get added later,
// replacing the static "next question" logic with a real generated one.

const questionBank = [
  {
    type: "Behavioral",
    text: "Tell me about a time you led a team through a setback."
  },
  {
    type: "Behavioral",
    text: "Describe a situation where you disagreed with a decision at work. What did you do?"
  },
  {
    type: "Technical",
    text: "Walk me through how you'd approach debugging a system you've never seen before."
  },
  {
    type: "Situational",
    text: "If two teammates gave you conflicting priorities, how would you handle it?"
  },
  {
    type: "Closing",
    text: "Why are you interested in this role specifically?"
  }
];

let currentQuestionIndex = -1;

/**
 * Starts the question flow from the beginning. Called when the interview session starts.
 */
function startInterviewQuestions() {
  currentQuestionIndex = 0;
  renderCurrentQuestion();
}

/**
 * Advances to the next question, or shows a completion message if the bank is exhausted.
 * Returns false once there are no more questions, so coach.js knows to wrap up the session.
 */
function goToNextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex >= questionBank.length) {
    renderInterviewComplete();
    return false;
  }

  renderCurrentQuestion();
  return true;
}

/**
 * Updates the question header and counter with the current question.
 */
function renderCurrentQuestion() {
  const question = questionBank[currentQuestionIndex];

  document.getElementById("question-text").textContent = question.text;
  document.getElementById("question-type").textContent = question.type;
  document.getElementById("question-counter").textContent =
    `Question ${currentQuestionIndex + 1} of ${questionBank.length}`;
}

/**
 * Shown once all questions have been asked.
 */
function renderInterviewComplete() {
  document.getElementById("question-text").textContent =
    "That's the last question. Nice work — stop the interview to see your report.";
  document.getElementById("question-type").textContent = "Done";
}

/**
 * Resets the question flow back to its initial, pre-session state.
 */
function resetInterviewQuestions() {
  currentQuestionIndex = -1;
  document.getElementById("question-text").textContent =
    "Press start when you're ready. Your first question will appear here.";
  document.getElementById("question-type").textContent = "Behavioral";
  document.getElementById("question-counter").textContent =
    `Question 1 of ${questionBank.length}`;
}