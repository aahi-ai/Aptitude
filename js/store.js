// store.js — saves the finished session to localStorage so report.html
// (a completely separate page load) can read it back.

const SESSION_STORAGE_KEY = "aptitude_last_session";

/**
 * Saves the finished session's per-question log and aggregate stats.
 */
function saveSession(questions, aggregates) {
  const payload = {
    questions,
    aggregates,
    completedAt: Date.now()
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

/**
 * Loads the most recently saved session, or null if there isn't one
 * (e.g. first visit, or localStorage was cleared).
 */
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to load session:", err);
    return null;
  }
}