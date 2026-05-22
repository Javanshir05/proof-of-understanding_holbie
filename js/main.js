// ── App-level State ────────────────────────
let apiKey      = '';
let codeVal     = '';
let taskVal     = '';
let selectedLang = 'auto';

// ── API Key Input ──────────────────────────
document.getElementById('apikey').addEventListener('input', function () {
  apiKey = this.value.trim();
  document.getElementById('key-status').style.display = apiKey.startsWith('AIza') ? 'inline' : 'none';
  updateStartBtn();
});

// ── Code Input ────────────────────────────
const codeInput = document.getElementById('code-input');

codeInput.addEventListener('input', updateStartBtn);

// Allow Tab key for indentation inside the code textarea
codeInput.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const s = codeInput.selectionStart;
  codeInput.value = codeInput.value.substring(0, s) + '    ' + codeInput.value.substring(codeInput.selectionEnd);
  codeInput.selectionStart = codeInput.selectionEnd = s + 4;
});

function updateStartBtn() {
  document.getElementById('btn-start').disabled = !codeInput.value.trim() || !apiKey;
}

// ── Language Selector ─────────────────────
const langRow = document.getElementById('lang-row');

LANGS.forEach((l, i) => {
  // Insert a visual divider after "Auto-detect"
  if (i === 1) {
    const d = document.createElement('div');
    d.className = 'lang-divider';
    langRow.appendChild(d);
  }
  const b = document.createElement('button');
  b.className  = 'lang-btn' + (l.id === 'auto' ? ' selected' : '');
  b.textContent = l.label;
  b.dataset.id  = l.id;
  b.addEventListener('click', () => selectLang(l.id));
  langRow.appendChild(b);
});

function selectLang(id) {
  selectedLang = id;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('selected', b.dataset.id === id));
  codeInput.placeholder = LANGS.find(l => l.id === id).placeholder;
  document.getElementById('topbar-lang').textContent = 'LANG: ' + (id === 'auto' ? 'AUTO' : LANGS.find(l => l.id === id).label.toUpperCase());
}

// ── Start Button — Generate & Begin Quiz ──
document.getElementById('btn-start').addEventListener('click', async () => {
  codeVal = codeInput.value.trim();
  taskVal = document.getElementById('task-desc').value.trim();
  show('loading');

  // Cycle loading messages while waiting for the API
  const msgs = ['Parsing your code', 'Analysing implementation decisions', 'Building multiple-choice questions'];
  let mi = 0;
  document.getElementById('loading-msg').textContent = msgs[0];
  const mInt = setInterval(() => {
    mi = (mi + 1) % msgs.length;
    document.getElementById('loading-msg').textContent = msgs[mi];
  }, 1800);

  try {
    const parsed = await generateQuestions();
    clearInterval(mInt);

    // Update topbar language badge when auto-detected
    if (selectedLang === 'auto' && parsed.detectedLanguage)
      document.getElementById('topbar-lang').textContent = 'LANG: ' + parsed.detectedLanguage.toUpperCase();

    // Load quiz state
    questions      = parsed.questions      || [];
    snippets       = parsed.snippets       || [];
    allChoices     = parsed.choices        || [];
    correctIndices = parsed.correctIndices || [];
    answers = []; currentQ = 0; runningScore = 0; locked = false;

    startQScreen();
  } catch (e) {
    clearInterval(mInt);
    alert('Failed to generate questions: ' + e.message);
    show('submit');
  }
});

// ── Result Action Buttons ──────────────────
document.getElementById('btn-new').addEventListener('click', () => {
  codeInput.value = '';
  document.getElementById('task-desc').value = '';
  selectLang('auto');
  updateStartBtn();
  show('submit');
});

document.getElementById('btn-retry').addEventListener('click', () => {
  currentQ = 0; answers = []; runningScore = 0; locked = false;
  startQScreen();
});
