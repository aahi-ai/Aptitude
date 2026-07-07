// interview.js — question banks and question flow
// Multiple categories now exist; the person picks one before starting.
// Adaptive follow-ups (via the AI API) get added later, replacing this
// static "next question" logic with a real generated one.

const questionBanks = {
  behavioral: [
    { type: "Behavioral", text: "Tell me about a time you led a team through a setback." },
    { type: "Behavioral", text: "Describe a situation where you disagreed with a decision at work. What did you do?" },
    { type: "Behavioral", text: "Tell me about a time you failed at something. What did you learn?" },
    { type: "Behavioral", text: "Describe a time you had to work with someone difficult." },
    { type: "Behavioral", text: "Tell me about a time you went above and beyond what was expected." }
  ],

  technical: [
    { type: "Technical", text: "Walk me through how you'd approach debugging a system you've never seen before." },
    { type: "Technical", text: "Explain a technical concept you know well to someone with no background in it." },
    { type: "Technical", text: "Describe a project where you had to make a tradeoff between speed and quality." },
    { type: "Technical", text: "How would you design a system that needs to handle a sudden spike in traffic?" },
    { type: "Technical", text: "Tell me about a time you had to learn a new tool or technology quickly." }
  ],

  problemSolving: [
    { type: "Problem Solving", text: "If two teammates gave you conflicting priorities, how would you handle it?" },
    { type: "Problem Solving", text: "You have three tasks due today and only time for two. How do you decide?" },
    { type: "Problem Solving", text: "Describe a time you had incomplete information but still had to make a decision." },
    { type: "Problem Solving", text: "How would you approach a problem you've never encountered before?" },
    { type: "Problem Solving", text: "Tell me about a time you had to solve a problem with limited resources." }
  ],

  traits: [
    { type: "Trait", text: "What's a strength that people don't notice about you right away?" },
    { type: "Trait", text: "Describe a time your work ethic was tested." },
    { type: "Trait", text: "How do you handle receiving critical feedback?" },
    { type: "Trait", text: "What motivates you to do your best work?" },
    { type: "Trait", text: "Describe a situation where you had to adapt quickly to change." }
  ]
};

// "Mixed" pulls one question from each category, in a fixed order.
questionBanks.mixed = [
  questionBanks.behavioral[0],
  questionBanks.technical[0],
  questionBanks.problemSolving[0],
  questionBanks.traits[0],
  questionBanks.behavioral[1]
];

let activeQuestions = [];
let currentQuestionIndex = -1;

/**
 * Starts the question flow using the chosen category's question bank.
 * Falls back to "mixed" if an invalid category is passed in.
 */
function startInterviewQuestions(category) {
  activeQuestions = questionBanks[category] || questionBanks.mixed;
  currentQuestionIndex = 0;
  renderCurrentQuestion();
}

/**
 * Advances to the next question, or shows a completion message if the bank is exhausted.
 * Returns false once there are no more questions, so coach.js knows to wrap up the session.
 */
function goToNextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex >= activeQuestions.length) {
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
  const question = activeQuestions[currentQuestionIndex];

  document.getElementById("question-text").textContent = question.text;
  document.getElementById("question-type").textContent = question.type;
  document.getElementById("question-counter").textContent =
    `Question ${currentQuestionIndex + 1} of ${activeQuestions.length}`;
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
    "Choose a question type, then press start when you're ready.";
  document.getElementById("question-type").textContent = "—";
  document.getElementById("question-counter").textContent = "Question 1";
}