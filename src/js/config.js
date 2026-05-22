// ── Quiz Settings ──────────────────────────
const TIMER_SECS = 20;   // seconds per question
const TOTAL_QUESTIONS = 10;
const PASS_THRESHOLD = 7;   // score needed to pass
const PARTIAL_THRESHOLD = 5; // score for partial credit
const KEYS = ['A', 'B', 'C'];
const CIRC = 2 * Math.PI * 23; // SVG timer arc circumference

// ── Supported Languages ────────────────────
const LANGS = [
  { id:'auto',   label:'Auto-detect', placeholder:'# Paste your code — language detected automatically\n\ndef solution():\n    pass' },
  { id:'c',      label:'C',           placeholder:'#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // Paste your C code here\n    return 0;\n}' },
  { id:'cpp',    label:'C++',         placeholder:'#include <iostream>\nusing namespace std;\n\nint main() {\n    // Paste your C++ code here\n    return 0;\n}' },
  { id:'python', label:'Python',      placeholder:'# Paste your Python code here\n\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    solution()' },
  { id:'java',   label:'Java',        placeholder:'public class Solution {\n    // Paste your Java code here\n    public static void main(String[] args) {}\n}' },
  { id:'js',     label:'JavaScript',  placeholder:'// Paste your JavaScript code here\n\nfunction solution() {\n    // ...\n}' },
  { id:'ts',     label:'TypeScript',  placeholder:'// Paste your TypeScript code here\n\nfunction solution(): void {\n    // ...\n}' },
  { id:'go',     label:'Go',          placeholder:'package main\n\nimport "fmt"\n\nfunc main() {\n    // Paste your Go code here\n}' },
  { id:'rust',   label:'Rust',        placeholder:'// Paste your Rust code here\n\nfn main() {\n    // ...\n}' },
  { id:'cs',     label:'C#',          placeholder:'using System;\n\nclass Solution {\n    static void Main() {\n        // Paste your C# code here\n    }\n}' },
  { id:'swift',  label:'Swift',       placeholder:'// Paste your Swift code here\n\nfunc solution() {\n    // ...\n}' },
  { id:'kotlin', label:'Kotlin',      placeholder:'// Paste your Kotlin code here\n\nfun main() {\n    // ...\n}' },
  { id:'ruby',   label:'Ruby',        placeholder:'# Paste your Ruby code here\n\ndef solution\n  # ...\nend' },
  { id:'php',    label:'PHP',         placeholder:'<?php\n// Paste your PHP code here\n\nfunction solution() {\n    // ...\n}\n?>' },
  { id:'sql',    label:'SQL',         placeholder:'-- Paste your SQL query here\n\nSELECT *\nFROM your_table\nWHERE condition = true;' },
  { id:'bash',   label:'Bash',        placeholder:'#!/bin/bash\n# Paste your Bash script here\n\nmain() {\n    echo "hello"\n}\nmain' },
  { id:'other',  label:'Other',       placeholder:'// Paste the code you submitted here...' },
];

// ── Per-Language Question Focus Hints ─────
const LANG_HINTS = {
  auto:   'the programming language and focus on specific logic, variable choices, algorithm design, and language-specific idioms',
  c:      'C — focus on pointer usage, memory management, struct design, buffer safety, and why specific C idioms were chosen',
  cpp:    'C++ — focus on object design, RAII, smart pointers, STL container choices, and memory management',
  python: 'Python — focus on data structures, comprehensions vs loops, built-in choices, mutability, and Pythonic idioms',
  java:   'Java — focus on class design, interface choices, generics, collections, and OOP decisions',
  js:     'JavaScript — focus on scope/closure, async patterns, prototype chain, and ES6+ feature choices',
  ts:     'TypeScript — focus on type annotations, interface vs type alias, generics, and type guards',
  go:     'Go — focus on goroutine/channel usage, error handling patterns, interface design, and slice choices',
  rust:   'Rust — focus on ownership, borrowing, lifetimes, match patterns, and Result/Option usage',
  cs:     'C# — focus on LINQ, async/await, interface design, generics, and nullable types',
  swift:  'Swift — focus on optionals, protocol conformance, value vs reference types, and closures',
  kotlin: 'Kotlin — focus on null safety, coroutines, data classes, extension functions',
  ruby:   'Ruby — focus on blocks/procs/lambdas, duck typing, enumerable methods, and module mixins',
  php:    'PHP — focus on type hints, array manipulation, OOP design, and error handling',
  sql:    'SQL — focus on join types, index awareness, subquery vs CTE, and aggregation logic',
  bash:   'Bash — focus on variable quoting, piping logic, error handling (set -e), and subshell usage',
  other:  'the language used — focus on specific logic, algorithm design, and data structure choices',
};