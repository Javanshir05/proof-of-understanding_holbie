// ── Low-level API Wrapper ──────────────────
async function callGrok(userMessage, systemInstruction) {
  const url = 'https://api.xai.com/v1/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'grok-beta', 
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'API error');
  
  return data.choices[0].message.content;
}

// ── Build the System Prompt ────────────────
function buildSystemPrompt(hint, autoNote) {
  return `You are a technical interviewer generating multiple-choice quiz questions for a student who just submitted code. Your goal is to verify they actually wrote and understand it — not just copied it.

Generate exactly ${TOTAL_QUESTIONS} questions. Each question:
- Targets a SPECIFIC implementation detail in the student's code (reference actual variable names, function names, or patterns)
- Has exactly 3 answer choices (A, B, C)
- Has EXACTLY ONE correct answer — the other two must be plausible-sounding but wrong (common misconceptions, close-but-wrong alternatives, or things that look right but don't match their code)
- Is impossible to answer without having written or carefully read that exact code

Focus on: ${hint}${autoNote}

Also extract the most relevant 4–6 lines of the student's code as a snippet for each question.

Respond ONLY with a valid JSON object. Do not use markdown formatting. Use this schema exactly:
{
  "detectedLanguage": "language name or empty if specified",
  "questions": ["question text 1", ...repeat for all ${TOTAL_QUESTIONS}],
  "snippets": ["4-6 line code snippet 1", ...repeat for all ${TOTAL_QUESTIONS}],
  "choices": [["A: option","B: option","C: option"], ...repeat for all ${TOTAL_QUESTIONS}],
  "correctIndices": [0, 1, 2, 0, 1, 2, 0, 1, 2, 0]
}
correctIndices are 0-based (0=A, 1=B, 2=C). Vary the correct index position across all ${TOTAL_QUESTIONS} questions to avoid predictable patterns.`;
}

// ── Validate Parsed API Response ──────────
function validateParsed(parsed) {
  const { questions, choices, correctIndices } = parsed;
  if (!questions || questions.length < 1)
    throw new Error('No questions returned. Please try again.');
  questions.forEach((_, i) => {
    if (!choices[i] || choices[i].length < 3)
      throw new Error(`Question ${i + 1} is missing answer choices. Please try again.`);
    if (correctIndices[i] === undefined || correctIndices[i] < 0 || correctIndices[i] > 2)
      throw new Error(`Question ${i + 1} has an invalid correct answer index.`);
  });
}

// ── Main: Generate Questions from Code ────
async function generateQuestions() {
  const hint     = LANG_HINTS[selectedLang] || LANG_HINTS.other;
  const autoNote = selectedLang === 'auto'
    ? "\nFirst detect the language, then tailor your questions to that language's idioms."
    : '';
  const langLabel = selectedLang === 'auto'
    ? 'the programming language used in the code'
    : LANGS.find(l => l.id === selectedLang).label;

  const system  = buildSystemPrompt(hint, autoNote);
  const userMsg = `Task: ${taskVal || 'programming task'}\n\nStudent ${langLabel} code:\n${codeVal}`;

  const text   = await callGrok(userMsg, system);
  const clean  = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  validateParsed(parsed);
  return parsed;
}