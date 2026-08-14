/* ==========================================================================
   Consumer Behavior Quiz — app.js
   Vanilla-JS single-page app: renders screens into #screen-root.
   No framework, no build step — works as a static site on Netlify / GitHub
   Pages. Uses localStorage only to remember progress on THIS browser/device
   (there's no server, so it can't sync across devices — see README).
   ========================================================================== */

(function () {
  "use strict";

  const QB = window.QuestionBank;
  const root = document.getElementById("screen-root");
  const STORAGE_KEY = "cbquiz_state_v1";

  /* ------------------------------ persisted state ------------------------ */

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore corrupted storage */
    }
    return {};
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch (e) {
      /* storage may be unavailable (private browsing, quota) — fail silently */
    }
  }

  const persisted = Object.assign(
    {
      studentName: "",
      mastery: {}, // conceptId -> {level, seen, correct}
      history16: [], // [{date, score, total}]
      bestScore16: null,
      lastCategorySelection: null, // array of concept ids, or null = "all / mixed"
    },
    loadState()
  );

  QB.CONCEPTS.forEach((c) => {
    if (!persisted.mastery[c.id]) persisted.mastery[c.id] = { level: 0, seen: 0, correct: 0 };
  });

  const MASTERY_TARGET = 3; // consecutive-ish net-correct level needed to call a concept "mastered"

  /* ------------------------------ small utilities ------------------------ */

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function fmtDate(d) {
    const dt = d ? new Date(d) : new Date();
    return dt.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* Lightweight, non-cryptographic checksum — purely to make casually-edited
     result codes look "off"; it is NOT tamper-proof since all logic runs
     client-side and is fully visible to students. See README. */
  function checksum(str) {
    let h1 = 0xdeadbeef ^ str.length,
      h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
    return combined.toString(36).toUpperCase();
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function copyText(text, btn) {
    const done = () => {
      const orig = btn.textContent;
      btn.textContent = "Copied!";
      btn.classList.add("btn-success-flash");
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove("btn-success-flash");
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {
      alert("Copy failed — please select and copy the code manually.");
    }
    document.body.removeChild(ta);
  }

  /* ------------------------------ router ---------------------------------- */

  let view = { screen: "start" };

  function go(next) {
    view = next;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    root.innerHTML = "";
    const renderers = {
      start: renderStart,
      "quizme-setup": renderQuizMeSetup,
      quizme: renderQuizMe,
      name16: renderName16,
      blueprint: renderBlueprint,
      results16: renderResults16,
    };
    (renderers[view.screen] || renderStart)();
  }

  /* ------------------------------ START SCREEN ---------------------------- */

  function renderStart() {
    const node = el(`
      <section class="screen start-screen">
        <h1>Consumer Behavior: Causal Inference &amp; Research Methods</h1>
        <p class="lede">Practice thinking like a researcher: correlation vs. causation (confounds, selection effects, reverse causality), incrementality, p-values &amp; basic stats, why random assignment and A/B tests work, applied business scenarios, and the pros/cons of alternative methods.</p>
        <div class="mode-cards">
          <article class="mode-card">
            <h2>Quiz Me</h2>
            <p>To help me learn, apply the concepts, and develop mastery.</p>
            <ul class="mode-points">
              <li>Unlimited, ever-changing scenarios</li>
              <li>Instant feedback with explanations after every question</li>
              <li>Adapts to focus on concepts you haven't mastered yet</li>
              <li>No score, no pressure — just practice until it clicks</li>
            </ul>
            <button class="btn btn-primary" id="btn-quizme">Quiz Me</button>
          </article>
          <article class="mode-card">
            <h2>Take the 16-Question Quiz</h2>
            <p>A graded set covering all six concept areas — retake it as many times as you like for a better score.</p>
            <ul class="mode-points">
              <li>16 questions across all six concept areas (some multi-select)</li>
              <li>Fresh scenarios and numbers every attempt</li>
              <li>Copy or download a results code to submit on Canvas</li>
              <li>Retake anytime to improve your score</li>
            </ul>
            <button class="btn btn-primary" id="btn-16">Take the 16-Question Quiz</button>
          </article>
        </div>
        ${persisted.bestScore16 ? `<p class="best-score-note">Your best score on this device: <strong>${persisted.bestScore16.score}/${persisted.bestScore16.total}</strong> (${fmtDate(persisted.bestScore16.date)})</p>` : ""}
        <p class="fineprint">Progress on this page is saved only in this browser, on this device — it isn't shared automatically with your instructor. Use the results code after the 16-question quiz to submit your score.</p>
      </section>
    `);
    root.appendChild(node);
    node.querySelector("#btn-quizme").addEventListener("click", () => go({ screen: "quizme-setup" }));
    node.querySelector("#btn-16").addEventListener("click", () => go({ screen: "name16" }));
  }

  /* ------------------------------ QUIZ ME MODE ----------------------------- */

  function conceptWeight(id) {
    const m = persisted.mastery[id];
    const remaining = Math.max(0, MASTERY_TARGET - m.level);
    return remaining + 0.35; // mastered concepts still show up occasionally for spaced review
  }

  function pickWeightedConcept(avoidId, allowedIds) {
    let ids = allowedIds && allowedIds.length ? allowedIds.slice() : QB.CONCEPTS.map((c) => c.id);
    if (avoidId && ids.length > 1) {
      // soft preference: don't repeat the same concept twice in a row unless weights force it
      const filtered = ids.filter((id) => id !== avoidId);
      if (filtered.length) ids = filtered;
    }
    const weights = ids.map(conceptWeight);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < ids.length; i++) {
      r -= weights[i];
      if (r <= 0) return ids[i];
    }
    return ids[ids.length - 1];
  }

  function allMastered() {
    return QB.CONCEPTS.every((c) => persisted.mastery[c.id].level >= MASTERY_TARGET);
  }

  function renderMasteryDashboard(highlightId, allowedIds) {
    const items = QB.CONCEPTS.map((c) => {
      const m = persisted.mastery[c.id];
      const pct = Math.round((m.level / MASTERY_TARGET) * 100);
      const mastered = m.level >= MASTERY_TARGET;
      const inScope = !allowedIds || allowedIds.includes(c.id);
      return `
        <div class="mastery-item ${mastered ? "mastered" : ""} ${highlightId === c.id ? "active" : ""} ${inScope ? "" : "out-of-scope"}">
          <div class="mastery-label"><span class="letter">(${c.letter})</span> ${c.label} ${mastered ? "✓" : ""}</div>
          <div class="mastery-bar"><div class="mastery-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join("");
    return `<div class="mastery-dashboard">${items}</div>`;
  }

  /* Setup screen: choose which categories to practice before entering Quiz Me. */
  function renderQuizMeSetup() {
    const preselected = persisted.lastCategorySelection && persisted.lastCategorySelection.length ? persisted.lastCategorySelection : QB.CONCEPTS.map((c) => c.id);

    const node = el(`
      <section class="screen setup-screen">
        <h1>Quiz Me</h1>
        <p class="lede">Practice all six concept areas mixed together, or focus on just a few. You can change this anytime.</p>
        <div class="category-picker" id="category-picker">
          ${QB.CONCEPTS.map(
            (c) => `
            <label class="category-option">
              <input type="checkbox" value="${c.id}" ${preselected.includes(c.id) ? "checked" : ""} />
              <span><span class="letter">(${c.letter})</span> ${c.label}</span>
            </label>`
          ).join("")}
        </div>
        <div class="quiz-actions">
          <button class="btn btn-secondary" id="btn-select-all">Select all</button>
          <button class="btn btn-secondary" id="btn-select-none">Clear</button>
        </div>
        <div class="quiz-actions" style="margin-top:20px;">
          <button class="btn btn-link" id="btn-back-start">&larr; Back to start</button>
          <button class="btn btn-primary" id="btn-start-practice">Start practicing</button>
        </div>
      </section>
    `);
    root.appendChild(node);

    const checkboxes = () => Array.from(node.querySelectorAll('#category-picker input[type="checkbox"]'));
    node.querySelector("#btn-select-all").addEventListener("click", () => checkboxes().forEach((cb) => (cb.checked = true)));
    node.querySelector("#btn-select-none").addEventListener("click", () => checkboxes().forEach((cb) => (cb.checked = false)));
    node.querySelector("#btn-back-start").addEventListener("click", () => go({ screen: "start" }));
    node.querySelector("#btn-start-practice").addEventListener("click", () => {
      const selected = checkboxes()
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
      if (!selected.length) {
        alert("Select at least one category to practice.");
        return;
      }
      persisted.lastCategorySelection = selected.length === QB.CONCEPTS.length ? null : selected;
      saveState();
      go({ screen: "quizme", state: { current: null, avoidId: null, answered: false, selected: null, sessionCorrect: 0, sessionTotal: 0, categories: selected } });
    });
  }

  /* Renders either single-choice (buttons) or multi-select ("select all
     that apply" — checkboxes + a Submit button) interaction into a
     question-card node that already contains #options / #feedback /
     #btn-next. Calls onAnswered(correct) exactly once, when the student
     locks in their answer. */
  function wireQuestionInteraction(node, q, onAnswered) {
    const optionsEl = node.querySelector("#options");
    const fb = node.querySelector("#feedback");
    const nextBtn = node.querySelector("#btn-next");

    function showFeedback(correct) {
      fb.style.display = "block";
      fb.className = "feedback " + (correct ? "feedback-correct" : "feedback-incorrect");
      fb.innerHTML = `<strong>${correct ? "Correct!" : "Not quite."}</strong> ${escapeHtml(q.explanation)}`;
      nextBtn.style.display = "inline-block";
    }

    if (q.type === "multi") {
      const selected = new Set();
      q.options.forEach((optText, i) => {
        const row = el(`
          <label class="option-btn option-checkbox" data-idx="${i}">
            <input type="checkbox" />
            <span>${escapeHtml(optText)}</span>
          </label>
        `);
        row.querySelector("input").addEventListener("change", (e) => {
          if (e.target.checked) selected.add(i);
          else selected.delete(i);
        });
        optionsEl.appendChild(row);
      });
      const hint = el(`<p class="multi-hint">Select every option you think is correct, then submit.</p>`);
      optionsEl.appendChild(hint);
      const submitBtn = el(`<button class="btn btn-secondary" id="btn-submit-multi">Submit answer</button>`);
      optionsEl.appendChild(submitBtn);

      submitBtn.addEventListener("click", () => {
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        const correctSet = new Set(q.correctIndices);
        const selArr = Array.from(selected).sort();
        const correctArr = Array.from(correctSet).sort();
        const isCorrect = selArr.length === correctArr.length && selArr.every((v, i) => v === correctArr[i]);

        Array.from(optionsEl.querySelectorAll(".option-checkbox")).forEach((row, idx) => {
          const input = row.querySelector("input");
          input.disabled = true;
          const wasSelected = selected.has(idx);
          const isCorrectOpt = correctSet.has(idx);
          if (isCorrectOpt && wasSelected) row.classList.add("correct");
          else if (isCorrectOpt && !wasSelected) row.classList.add("missed");
          else if (!isCorrectOpt && wasSelected) row.classList.add("incorrect");
        });

        showFeedback(isCorrect);
        onAnswered(isCorrect);
      });
    } else {
      q.options.forEach((optText, i) => {
        const btn = el(`<button class="option-btn" data-idx="${i}">${escapeHtml(optText)}</button>`);
        btn.addEventListener("click", () => {
          const correct = i === q.correctIndex;
          Array.from(optionsEl.children).forEach((b, idx) => {
            b.disabled = true;
            if (idx === q.correctIndex) b.classList.add("correct");
            else if (idx === i) b.classList.add("incorrect");
          });
          showFeedback(correct);
          onAnswered(correct);
        });
        optionsEl.appendChild(btn);
      });
    }
  }

  function renderQuizMe() {
    if (!view.state) {
      view.state = { current: null, avoidId: null, answered: false, selected: null, sessionCorrect: 0, sessionTotal: 0, categories: null };
    }
    const state = view.state;
    const categories = state.categories && state.categories.length ? state.categories : null;

    if (!state.current) {
      const conceptId = pickWeightedConcept(state.avoidId, categories);
      state.current = QB.generate(conceptId);
      state.answered = false;
      state.selected = null;
    }

    const q = state.current;
    const concept = QB.conceptById(q.concept);
    const mastered = allMastered();
    const scopeLabel = categories ? categories.map((id) => "(" + QB.conceptById(id).letter + ")").join(" ") : "All categories (mixed)";

    const node = el(`
      <section class="screen quiz-screen">
        <div class="quiz-header">
          <button class="btn btn-link" id="btn-back-start">&larr; Back to start</button>
          <div class="quiz-session-stats">Session: ${state.sessionCorrect}/${state.sessionTotal} correct</div>
        </div>
        <div class="category-scope-bar">Practicing: <strong>${scopeLabel}</strong> · <button class="btn-link btn-tiny" id="btn-change-categories">change</button></div>
        ${mastered ? `<div class="mastery-banner">🎉 You've reached mastery on all six concepts! Keep practicing below anytime, or head back to try the 16-question quiz.</div>` : ""}
        ${renderMasteryDashboard(q.concept, categories)}
        <div class="question-card">
          <div class="concept-tag">(${concept.letter}) ${concept.label}</div>
          <p class="question-stem">${escapeHtml(q.stem)}</p>
          ${q.visual ? `<div class="question-visual">${q.visual}</div>` : ""}
          <div class="options" id="options"></div>
          <div class="feedback" id="feedback" style="display:none;"></div>
          <div class="quiz-actions">
            <button class="btn btn-primary" id="btn-next" style="display:none;">Next question</button>
          </div>
        </div>
      </section>
    `);

    wireQuestionInteraction(node, q, (correct) => {
      state.answered = true;
      state.sessionTotal++;
      if (correct) state.sessionCorrect++;

      const m = persisted.mastery[q.concept];
      m.seen++;
      if (correct) {
        m.correct++;
        m.level = Math.min(MASTERY_TARGET, m.level + 1);
      } else {
        m.level = Math.max(0, m.level - 1);
      }
      saveState();
    });

    node.querySelector("#btn-next").addEventListener("click", () => {
      const nextState = {
        current: null,
        avoidId: q.concept,
        answered: false,
        selected: null,
        sessionCorrect: state.sessionCorrect,
        sessionTotal: state.sessionTotal,
        categories: state.categories,
      };
      go({ screen: "quizme", state: nextState });
    });
    node.querySelector("#btn-back-start").addEventListener("click", () => go({ screen: "start" }));
    node.querySelector("#btn-change-categories").addEventListener("click", () => go({ screen: "quizme-setup" }));

    root.appendChild(node);
  }

  /* ------------------------------ 16-QUESTION QUIZ ------------------------- */

  function renderName16() {
    const node = el(`
      <section class="screen name-screen">
        <h1>Take the 16-Question Quiz</h1>
        <p class="lede">Enter your name the way you'd like it to appear on your results code (e.g., first name + last initial, like "Jane D.").</p>
        <form id="name-form" class="name-form">
          <label for="name-input">Name</label>
          <input type="text" id="name-input" placeholder="e.g., Jane D." value="${escapeHtml(persisted.studentName)}" required maxlength="60" />
          <div class="quiz-actions">
            <button type="button" class="btn btn-link" id="btn-back-start">&larr; Back to start</button>
            <button type="submit" class="btn btn-primary">Start Quiz</button>
          </div>
        </form>
      </section>
    `);
    root.appendChild(node);
    node.querySelector("#btn-back-start").addEventListener("click", () => go({ screen: "start" }));
    node.querySelector("#name-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = node.querySelector("#name-input").value.trim();
      if (!name) return;
      persisted.studentName = name;
      saveState();
      startBlueprintQuiz();
    });
  }

  function startBlueprintQuiz() {
    const questions = QB.buildBlueprintQuiz();
    go({
      screen: "blueprint",
      state: {
        questions,
        idx: 0,
        answered: false,
        selected: null,
        answers: [], // {conceptId, correct}
      },
    });
  }

  function renderBlueprint() {
    const state = view.state;
    const total = state.questions.length;
    const q = state.questions[state.idx];
    const concept = QB.conceptById(q.concept);
    const pct = Math.round((state.idx / total) * 100);

    const node = el(`
      <section class="screen quiz-screen">
        <div class="quiz-header">
          <button class="btn btn-link" id="btn-abandon">&larr; Exit quiz</button>
          <div class="quiz-session-stats">Question ${state.idx + 1} of ${total}</div>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="question-card">
          <div class="concept-tag">(${concept.letter}) ${concept.label}</div>
          <p class="question-stem">${escapeHtml(q.stem)}</p>
          ${q.visual ? `<div class="question-visual">${q.visual}</div>` : ""}
          <div class="options" id="options"></div>
          <div class="feedback" id="feedback" style="display:none;"></div>
          <div class="quiz-actions">
            <button class="btn btn-primary" id="btn-next" style="display:none;">${state.idx + 1 === total ? "See my results" : "Next question"}</button>
          </div>
        </div>
      </section>
    `);

    wireQuestionInteraction(node, q, (correct) => {
      state.answered = true;
      state.answers.push({ conceptId: q.concept, correct });
    });

    node.querySelector("#btn-next").addEventListener("click", () => {
      if (state.idx + 1 < total) {
        go({ screen: "blueprint", state: Object.assign({}, state, { idx: state.idx + 1, answered: false, selected: null }) });
      } else {
        finishBlueprintQuiz(state);
      }
    });
    node.querySelector("#btn-abandon").addEventListener("click", () => {
      if (confirm("Exit the quiz? Your progress on this attempt will be lost.")) go({ screen: "start" });
    });

    root.appendChild(node);
  }

  function finishBlueprintQuiz(state) {
    const total = state.answers.length;
    const correct = state.answers.filter((a) => a.correct).length;

    const byConcept = {};
    QB.CONCEPTS.forEach((c) => (byConcept[c.id] = { correct: 0, total: 0 }));
    state.answers.forEach((a) => {
      byConcept[a.conceptId].total++;
      if (a.correct) byConcept[a.conceptId].correct++;
    });

    const attempt = { date: new Date().toISOString(), score: correct, total, byConcept };
    persisted.history16.unshift(attempt);
    persisted.history16 = persisted.history16.slice(0, 20);
    if (!persisted.bestScore16 || correct / total > persisted.bestScore16.score / persisted.bestScore16.total) {
      persisted.bestScore16 = { score: correct, total, date: attempt.date };
    }
    saveState();

    go({ screen: "results16", state: { attempt } });
  }

  function buildResultsCode(attempt) {
    const name = persisted.studentName || "(no name entered)";
    const dateStr = fmtDate(attempt.date);
    const pct = ((attempt.score / attempt.total) * 100).toFixed(1);
    const lines = [];
    lines.push("Consumer Behavior — Causal Inference & Research Methods Quiz");
    lines.push(`Name: ${name}`);
    lines.push(`Date: ${dateStr}`);
    lines.push(`Score: ${attempt.score}/${attempt.total} (${pct}%)`);
    lines.push("Breakdown by concept:");
    QB.CONCEPTS.forEach((c) => {
      const b = attempt.byConcept[c.id];
      lines.push(`  (${c.letter}) ${c.label}: ${b.correct}/${b.total}`);
    });
    const base = `${name}|${attempt.date}|${attempt.score}/${attempt.total}`;
    const code = checksum(base);
    lines.push(`Verification code: ${code}`);
    lines.push("(This code is a lightweight integrity check generated in your browser — it is not a secure/tamper-proof credential.)");
    return lines.join("\n");
  }

  function renderResults16() {
    const attempt = view.state.attempt;
    const pct = ((attempt.score / attempt.total) * 100).toFixed(1);
    const codeText = buildResultsCode(attempt);
    const isBest = persisted.bestScore16 && persisted.bestScore16.score === attempt.score && persisted.bestScore16.total === attempt.total && persisted.bestScore16.date === attempt.date;

    const rows = QB.CONCEPTS.map((c) => {
      const b = attempt.byConcept[c.id];
      const pctC = b.total ? Math.round((b.correct / b.total) * 100) : 0;
      return `<tr><td>(${c.letter}) ${c.label}</td><td>${b.correct}/${b.total}</td><td><div class="mini-bar"><div class="mini-bar-fill" style="width:${pctC}%"></div></div></td></tr>`;
    }).join("");

    const node = el(`
      <section class="screen results-screen">
        <h1>Your Results</h1>
        <div class="score-hero">
          <div class="score-big">${attempt.score}/${attempt.total}</div>
          <div class="score-pct">${pct}%</div>
          ${isBest ? '<div class="best-badge">New best on this device 🎉</div>' : ""}
        </div>
        <table class="breakdown-table">
          <thead><tr><th>Concept</th><th>Score</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>

        <h2>Submit to Canvas</h2>
        <p class="lede">Copy or download this results code and paste/attach it to the Canvas assignment your instructor set up.</p>
        <pre class="results-code" id="results-code">${escapeHtml(codeText)}</pre>
        <div class="quiz-actions">
          <button class="btn btn-secondary" id="btn-copy">Copy code</button>
          <button class="btn btn-secondary" id="btn-download">Download .txt</button>
        </div>

        <h2>Keep going</h2>
        <div class="quiz-actions results-actions">
          <button class="btn btn-primary" id="btn-retake">Retake the quiz for a better score</button>
          <button class="btn btn-secondary" id="btn-practice">Practice weak concepts (Quiz Me)</button>
          <button class="btn btn-link" id="btn-home">Back to start</button>
        </div>
      </section>
    `);
    root.appendChild(node);

    node.querySelector("#btn-copy").addEventListener("click", (e) => copyText(codeText, e.currentTarget));
    node.querySelector("#btn-download").addEventListener("click", () => {
      const safeName = (persisted.studentName || "student").replace(/[^a-z0-9]+/gi, "_");
      const stamp = new Date(attempt.date).toISOString().slice(0, 16).replace(/[:T]/g, "");
      downloadText(`CB_Quiz_Results_${safeName}_${stamp}.txt`, codeText);
    });
    node.querySelector("#btn-retake").addEventListener("click", () => startBlueprintQuiz());
    node.querySelector("#btn-practice").addEventListener("click", () => go({ screen: "quizme" }));
    node.querySelector("#btn-home").addEventListener("click", () => go({ screen: "start" }));
  }

  /* ------------------------------ boot -------------------------------------- */

  render();
})();
