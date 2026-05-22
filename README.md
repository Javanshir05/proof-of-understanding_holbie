# 🧠 Proof of Understanding – AI Code Interrogation System

An AI-powered web application that analyzes a student's submitted code and generates a personalized multiple-choice quiz to verify real understanding of their implementation.

Instead of just checking whether code runs, this system checks whether the student actually understands what they wrote.

---

## 🚀 Live Demo
https://proof-of-understanding-validator.netlify.app/

---

## 📌 Features

- 🧾 Paste any programming code
- 🌐 Auto language detection (or manual selection)
- 🤖 AI-generated MCQ questions based on real code logic
- 🧠 Questions target actual variables, functions, and implementation details
- ⏱ Timed quiz system
- 📊 Instant evaluation and scoring
- 🔍 Shows correct answers + feedback per question
- 📈 Understanding level assessment (Verified / Partial / Not Yet)

---

## 🧠 How It Works

1. User submits code
2. Code is sent to **Google Gemini API**
3. AI analyzes:
   - variables
   - functions
   - logic flow
4. System generates:
   - multiple-choice questions
   - 3 options each
   - correct answers
   - code snippets per question
5. User completes quiz
6. System evaluates understanding level

---

## ⚙️ Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Gemini API
- Netlify (deployment)

---
