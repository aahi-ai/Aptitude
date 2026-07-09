document.addEventListener("DOMContentLoaded", () => {
  const session = loadSession();

  if (!session || !session.questions || session.questions.length === 0) {
    document.getElementById("empty-state").hidden = false;
    return;
  }

  document.getElementById("report-content").hidden = false;
  document.getElementById("report-eyebrow").textContent =
    `SESSION REPORT — ${session.questions.length} QUESTIONS`;

  renderScoreBand(session.aggregates);
  renderBreakdown(session.questions);
  renderTips(session.aggregates, session.questions);
});

function renderScoreBand(aggregates) {
  const band = document.getElementById("score-band");
  band.innerHTML = "";

  band.appendChild(
    buildStatCard(
      "POSTURE",
      aggregates.avgPosture !== null ? formatAngle(aggregates.avgPosture) : "—",
      aggregates.avgPosture !== null
        ? postureNote(aggregates.avgPosture)
        : "No posture data recorded",
      "mark"
    )
  );

  band.appendChild(
    buildStatCard(
      "PACE",
      aggregates.avgWpm !== null ? `${aggregates.avgWpm} wpm` : "—",
      aggregates.avgWpm !== null ? paceNote(aggregates.avgWpm) : "Not enough speech detected",
      null
    )
  );

  band.appendChild(
    buildStatCard(
      "FILLER WORDS",
      aggregates.totalFillers,
      aggregates.totalFillers === 0
        ? `None detected — ${aggregates.totalPauses} hesitation pause(s) picked up from audio though`
        : `Plus ${aggregates.totalPauses} hesitation pause(s) detected from audio`,
      "pen"
    )
  );

  band.appendChild(
    buildStatCard(
      "CONTENT",
      aggregates.avgContentScore !== null ? `${aggregates.avgContentScore}/10` : "—",
      aggregates.avgContentScore !== null
        ? "Average AI score across all answers"
        : "Scoring unavailable this session",
      "mark"
    )
  );
}

function buildStatCard(label, value, note, colorVariant) {
  const card = document.createElement("div");
  card.className = "score-stat";

  const labelEl = document.createElement("p");
  labelEl.className = "score-stat__label";
  labelEl.textContent = label;

  const valueEl = document.createElement("p");
  valueEl.className = "score-stat__value" + (colorVariant ? ` score-stat__value--${colorVariant}` : "");
  valueEl.textContent = value;

  const noteEl = document.createElement("p");
  noteEl.className = "score-stat__note";
  noteEl.textContent = note;

  card.append(labelEl, valueEl, noteEl);
  return card;
}

function renderBreakdown(questions) {
  const list = document.getElementById("breakdown-list");
  list.innerHTML = "";

  questions.forEach((q) => {
    const card = document.createElement("div");
    card.className = "question-report";

    const meta = document.createElement("div");
    meta.className = "question-report__meta";
    meta.innerHTML = `<span>Q${q.questionIndex + 1} · ${q.type}</span>`;

    const prompt = document.createElement("p");
    prompt.className = "question-report__prompt";
    prompt.textContent = q.prompt;

    const transcript = document.createElement("p");
    transcript.className = "question-report__transcript";
    transcript.textContent = q.transcript
      ? `"${q.transcript}"`
      : "(No speech detected for this question.)";

    const stats = document.createElement("div");
    stats.className = "question-report__stats";
    stats.innerHTML = `
      <span>Posture: <strong>${q.avgPosture !== null ? formatAngle(q.avgPosture) : "—"}</strong></span>
      <span>Pace: <strong>${q.wpm !== null ? q.wpm + " wpm" : "—"}</strong></span>
      <span>Fillers: <strong>${q.fillerCount}</strong></span>
      <span>Pauses: <strong>${q.pauseCount}</strong></span>
      <span>Content: <strong>${q.contentScore !== null ? q.contentScore + "/10" : "—"}</strong></span>
    `;

    card.append(meta, prompt, transcript, stats);

    if (q.contentFeedback) {
      const feedback = document.createElement("p");
      feedback.className = "question-report__feedback";
      feedback.textContent = q.contentFeedback;
      card.appendChild(feedback);
    }

    list.appendChild(card);
  });
}

function renderTips(aggregates, questions) {
  const list = document.getElementById("tips-list");
  list.innerHTML = "";

  const tips = [];

  if (aggregates.totalFillers > questions.length * 3) {
    const worst = [...questions].sort((a, b) => b.fillerCount - a.fillerCount)[0];
    tips.push(
      `Filler words were heaviest on Q${worst.questionIndex + 1} (${worst.fillerCount}). Try pausing silently instead of saying "um" or "like" while you think.`
    );
  } else if (aggregates.totalFillers > 0) {
    tips.push("Filler words were minimal overall — good control.");
  }

  if (aggregates.avgWpm !== null) {
    if (aggregates.avgWpm > 160) {
      tips.push(`Your average pace was ${aggregates.avgWpm} wpm — a bit fast. Aim for 120–150 wpm for clearer delivery.`);
    } else if (aggregates.avgWpm < 100) {
      tips.push(`Your average pace was ${aggregates.avgWpm} wpm — quite slow. Aim for 120–150 wpm to keep answers engaging.`);
    } else {
      tips.push(`Your average pace (${aggregates.avgWpm} wpm) was right in the ideal 120–150 wpm range.`);
    }
  }

  if (aggregates.avgPosture !== null) {
    if (Math.abs(aggregates.avgPosture) > 8) {
      tips.push(`Your shoulders were tilted by about ${Math.abs(aggregates.avgPosture)}° on average — worth checking your camera height or seating position.`);
    } else {
      tips.push("Posture stayed level across most of the session — keep that up.");
    }
  }

  if (tips.length === 0) {
    tips.push("Not enough data was captured this session to generate specific tips — try speaking a bit more on each answer next time.");
  }

  tips.forEach((tipText) => {
    const item = document.createElement("div");
    item.className = "tips__item";
    item.innerHTML = `<span class="tips__marker">→</span><p class="tips__text">${tipText}</p>`;
    list.appendChild(item);
  });
}

function formatAngle(angle) {
  return angle === 0 ? "0° (level)" : `${angle > 0 ? "+" : ""}${angle}°`;
}

function postureNote(angle) {
  return Math.abs(angle) <= 5 ? "Consistently level" : "Some tilt detected on average";
}

function paceNote(wpm) {
  if (wpm > 160) return "A little fast overall";
  if (wpm < 100) return "A little slow overall";
  return "Right in the ideal range";
}