// ── Low-level API Wrapper ──────────────────
async function callGemini(userMessage, systemInstruction) {
  // Using the stable gemini-1.5-flash model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    })
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'API error');
  
  return data.candidates[0].content.parts[0].text;
}

// ── Build the System Prompt ────────────────
function buildSystemPrompt(hint, autoNote) {
  return `You are a technical interviewer generating multiple-choice quiz questions for a student who just submitted code. 

Generate exactly ${TOTAL_QUESTIONS} questions in strict JSON format:
{
  "detectedLanguage": "language name",
  "questions": ["..."],
  "snippets": ["..."],
  "choices": [["A: ...", "B: ...", "C: ..."], ...],
  "correctIndices": [0, 1, 2, ...]
}
Focus on: ${hint}${autoNote}`;
}

// ── Validate Parsed API Response ──────────
function validateParsed(parsed) {
  if (!parsed.questions || !parsed.choices || !parsed.correctIndices)
    throw new Error('Invalid JSON structure returned from API.');
}

// ── Main: Generate Questions from Code ────
async function generateQuestions() {
  const hint     = LANG_HINTS[selectedLang] || LANG_HINTS.other;
  const autoNote = selectedLang === 'auto' ? "\nFirst detect the language." : '';
  const langLabel = selectedLang === 'auto' ? 'the code' : LANGS.find(l => l.id === selectedLang).label;

  const system  = buildSystemPrompt(hint, autoNote);
  const userMsg = `Task: ${taskVal || 'code review'}\n\nCode:\n${codeVal}`;

  const text   = await callGemini(userMsg, system);
  // Gemini might return markdown-wrapped JSON, remove it
  const clean  = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  validateParsed(parsed);
  return parsed;
}
