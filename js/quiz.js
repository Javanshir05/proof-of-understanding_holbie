// ── Quiz State ─────────────────────────────
let questions      = [];
let snippets       = [];
let allChoices     = [];
let correctIndices = [];
let answers        = [];   // chosen index per question (-1 = timed out)
let currentQ       = 0;
let runningScore   = 0;
let locked         = false;
let timerInterval  = null;
let timeLeft       = TIMER_SECS;
let resultData     = null;

// Cached DOM references for the timer
const arc   = document.getElementById('timer-arc');
const numEl = document.getElementById('timer-num');
const lblEl = document.getElementById('timer-label');

// ── Screen Navigation ──────────────────────
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

// ── Progress Pips ─────────────────────────
function renderPips() {
  const bar = document.getElementById('progress-bar');
  bar.innerHTML = '';
  questions.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'pip';
    d.id = 'pip-' + i;
    bar.appendChild(d);
  });
}

function updatePips() {
  questions.forEach((_, i) => {
    const p = document.getElementById('pip-' + i);
    if (i < currentQ) {
      const wasCorrect = answers[i] === correctIndices[i];
      const wasTimeout = answers[i] === -1;
      p.className = 'pip ' + (wasCorrect ? 'done-correct' : wasTimeout ? 'active' : 'done-wrong');
    } else if (i === currentQ) {
      p.className = 'pip active';
    } else {
      p.className = 'pip';
    }
  });
}

// ── Question Rendering ─────────────────────
function startQScreen() {
  renderPips();
  loadQuestion(0);
  show('questions');
}

function loadQuestion(idx) {
  locked = false;
  document.getElementById('q-meta-left').textContent  = `Question ${idx + 1} of ${questions.length}`;
  document.getElementById('q-meta-score').textContent = `${runningScore} / ${idx}`;
  document.getElementById('q-text').textContent       = questions[idx];
  document.getElementById('feedback-bar').className   = 'feedback-bar';

  const ref = document.getElementById('code-ref');
  if (snippets[idx]) { ref.textContent = snippets[idx]; ref.style.display = 'block'; }
  else ref.style.display = 'none';

  renderOptions(idx);
  updatePips();
  startTimer();
}

function renderOptions(idx) {
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  (allChoices[idx] || []).forEach((choice, ci) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.innerHTML = `<span class="opt-key">${KEYS[ci]}</span><span class="opt-text">${esc(choice.replace(/^[ABC]:\s*/, ''))}</span>`;
    btn.addEventListener('click', () => selectOption(idx, ci));
    grid.appendChild(btn);
  });
}

// ── Answer Selection ───────────────────────
function selectOption(qIdx, chosenIdx) {
  if (locked) return;
  locked = true;
  stopTimer();

  const correct = correctIndices[qIdx];
  const isRight = chosenIdx === correct;
  if (isRight) runningScore++;
  answers.push(chosenIdx);

  document.getElementById('feedback-bar').className = 'feedback-bar ' + (isRight ? 'correct' : 'wrong');

  const btns = document.querySelectorAll('.opt-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === chosenIdx && isRight)        btn.className = 'opt-btn selected-correct';
    else if (i === chosenIdx && !isRight)  btn.className = 'opt-btn selected-wrong';
    else if (i === correct)                btn.className = 'opt-btn reveal-correct';
    else                                   btn.className = 'opt-btn dimmed';
  });

  numEl.style.color           = isRight ? 'var(--green)' : 'var(--red)';
  arc.style.stroke            = isRight ? 'var(--green)' : 'var(--red)';
  lblEl.textContent           = isRight ? '✓ Correct!' : '✗ Wrong';

  updatePips();

  setTimeout(() => {
    if (currentQ + 1 < questions.length) { currentQ++; loadQuestion(currentQ); }
    else showEvaluating();
  }, 1400);
}

// ── Timer ──────────────────────────────────
function startTimer() {
  stopTimer();
  timeLeft = TIMER_SECS;
  numEl.style.color   = 'var(--amber)';
  arc.style.stroke    = 'var(--amber)';
  lblEl.textContent   = 'seconds to choose';
  renderTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) { stopTimer(); onTimeout(); }
  }, 1000);
}

function stopTimer() { clearInterval(timerInterval); }

function renderTimer() {
  const frac  = timeLeft / TIMER_SECS;
  const color = frac > .5 ? '#d4a017' : frac > .25 ? '#e8812a' : '#f05050';
  arc.style.strokeDashoffset = CIRC * (1 - frac);
  arc.style.stroke           = color;
  numEl.textContent          = timeLeft;
  numEl.style.color          = color;
}

function onTimeout() {
  if (locked) return;
  locked = true;
  answers.push(-1);

  const correct = correctIndices[currentQ];
  document.getElementById('feedback-bar').className = 'feedback-bar wrong';
  lblEl.textContent = '⏱ Time expired';

  const btns = document.querySelectorAll('.opt-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    btn.className = i === correct ? 'opt-btn reveal-correct' : 'opt-btn dimmed';
  });

  updatePips();

  setTimeout(() => {
    if (currentQ + 1 < questions.length) { currentQ++; loadQuestion(currentQ); }
    else showEvaluating();
  }, 1800);
}

// ── Evaluating Transition ──────────────────
function showEvaluating() {
  show('evaluating');
  setTimeout(buildResult, 500);
}

// ── Result Building ────────────────────────
function buildResult() {
  const score   = runningScore;
  const total   = questions.length;
  const passed  = score >= PASS_THRESHOLD;
  const partial = score >= PARTIAL_THRESHOLD && score < PASS_THRESHOLD;

  let summary = '';
  if (passed)       summary = `You answered ${score} of ${total} questions correctly, demonstrating genuine understanding of your code.`;
  else if (partial) summary = `You got ${score} of ${total} correct. Some understanding is present, but there are gaps in your knowledge of your own implementation.`;
  else              summary = `You answered ${score} of ${total} correctly. It appears you may not fully understand how your code works — review it thoroughly before peer review.`;

  let nextSteps = '';
  if (!passed) {
    const wrongQs = questions.filter((_, i) => answers[i] !== correctIndices[i]);
    nextSteps = `Re-read your code carefully, focusing on: ${wrongQs.map(q => `"${q.substring(0, 40)}..."`).join('; ')}`;
  }

  const langLabel = document.getElementById('topbar-lang').textContent.replace('LANG: ', '');
  resultData = { score, passed, partial, summary, nextSteps, questions, answers, allChoices, correctIndices, langLabel };
  renderResult();
}

// ── Result Rendering ───────────────────────
function renderResult() {
  const r = resultData;

  document.getElementById('badge-ring').className = 'badge-ring ' + (r.passed ? 'badge-pass' : r.partial ? 'badge-partial' : 'badge-fail');
  document.getElementById('badge-icon').textContent = r.passed ? '✓' : r.partial ? '~' : '✗';
  document.getElementById('badge-word').textContent = r.passed ? 'Verified' : r.partial ? 'Partial' : 'Not Yet';

  const sn = document.getElementById('score-num');
  sn.textContent = `${r.score}/10`;
  sn.className   = 'score-num ' + (r.passed ? 'score-pass' : r.partial ? 'score-partial' : 'score-fail');

  const title = document.getElementById('result-title');
  title.textContent  = r.passed ? 'Ready for Peer Review' : r.partial ? 'Partial Understanding' : 'Understanding Not Verified';
  title.style.color  = r.passed ? 'var(--green)' : r.partial ? 'var(--yellow)' : 'var(--red)';
  document.getElementById('result-sub').textContent = r.summary;

  const nsb = document.getElementById('next-step-box');
  if (!r.passed && r.nextSteps) {
    document.getElementById('next-step-text').textContent = r.nextSteps;
    nsb.style.display = 'block';
  } else {
    nsb.style.display = 'none';
  }

  const cards = document.getElementById('eval-cards');
  cards.innerHTML = '';
  r.questions.forEach((q, i) => {
    const chosen    = r.answers[i];
    const correct   = r.correctIndices[i];
    const isTimeout = chosen === -1;
    const isCorrect = chosen === correct;
    const cardClass = isCorrect ? 'card-correct' : isTimeout ? 'card-timeout' : 'card-wrong';

    let choicesHtml = '';
    (r.allChoices[i] || []).forEach((ch, ci) => {
      let cls = 'eval-opt opt-neutral';
      if (ci === correct)              cls = 'eval-opt opt-correct-answer';
      else if (ci === chosen && !isCorrect) cls = 'eval-opt opt-wrong-pick';
      const label  = ch.replace(/^[ABC]:\s*/, '');
      const suffix = ci === correct ? ' ← correct' : ci === chosen ? ' ← your answer' : '';
      choicesHtml += `<div class="${cls}"><span class="ek">${KEYS[ci]}</span>${esc(label)}${suffix ? `<span style="opacity:.7;font-size:11px;margin-left:6px">${suffix}</span>` : ''}</div>`;
    });

    const verdictHtml = isCorrect
      ? `<div class="eval-verdict v-pass">✓ Correct</div>`
      : isTimeout
        ? `<div class="eval-verdict v-timeout">⏱ Timed out — correct answer was ${KEYS[correct]}</div>`
        : `<div class="eval-verdict v-fail">✗ Incorrect — correct answer was ${KEYS[correct]}</div>`;

    cards.innerHTML += `<div class="eval-card ${cardClass}"><div class="eval-q">${esc(q)}</div><div class="eval-choices">${choicesHtml}</div>${verdictHtml}</div>`;
  });

  document.getElementById('btn-retry').style.display = !r.passed ? 'inline-block' : 'none';
  show('result');
}

// ── Utility ────────────────────────────────
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
