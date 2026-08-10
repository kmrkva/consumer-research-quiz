# Consumer Behavior Quiz — Causal Inference & Research Methods

A no-backend, static web app with two modes:

- **Quiz Me** — unlimited, randomly-generated practice questions across six concept areas, with instant feedback and an adaptive mastery tracker that focuses more on the concepts a student hasn't mastered yet.
- **Take the 16-Question Quiz** — a fixed-length (16-question) quiz built from a blueprint. It can be retaken as many times as a student likes — each attempt regenerates fresh scenario details (and sometimes different underlying answers, and even different question wording/format), so it isn't just re-shuffled cosmetics. At the end, students get a results code they can copy or download and submit to Canvas.

### The six concept areas & 16-question blueprint

| # | Concept | Questions in the 16-Q quiz |
|---|---|---|
| a | Correlation, Causation & Confounds — third-variable confounds, selection effects, and reverse causality treated as one unified topic, emphasizing the *logic* of the problem (not memorizing labels) | 4 |
| b | Incrementality — holdouts, high-intent-targeting bias, double-counted attribution | 2 |
| c | P-values, correlation coefficients, basic vs. applied research, interpreting non-significant results | 2 |
| d | Random Assignment, Gold-Standard Experiments & A/B Tests — *why* randomization (not pre/post) supports causal claims, recognizing that a true A/B test is a randomized experiment, and getting closer to the gold standard without individual-level randomization (cluster/geo randomization, difference-in-differences, matching) | 4 |
| e | Applied Business Scenarios — picking the best method to answer a firm's causal question (webpage changes, campaign ROI, price framing, chatbot rollouts) | 2 |
| f | Alternative Methods & Their Limits — focus groups, observational data, ethical/practical constraints, and why formal A/B tests fail in very low-traffic stores | 2 |

(a) and (d) get the heaviest weight since they cover the broadest ground — (a) folds together confounds, selection effects, and reverse causality as one topic per your preference, and (d) folds together the logic of random assignment, gold-standard experiments, A/B test recognition, and quasi-experimental workarounds.

A few questions in (a), (d), and (e) are **multi-select ("select all that apply")** questions, graded all-or-nothing (every correct option must be selected and no incorrect ones), mirroring that format from your source material.

It's plain HTML/CSS/JS — no build step, no server, no dependencies. That makes it a good fit for a free static host like Netlify or GitHub Pages.

## Files

```
index.html    – page shell
style.css     – styling
questions.js  – the question bank (randomized generators for all 6 concepts)
app.js        – app logic / screens (start, quiz me, 16-question quiz, results)
```

## Deploying

### GitHub Pages
1. Create a new GitHub repo and push these four files (and this README) to it.
2. In the repo, go to **Settings → Pages**, set the source to your default branch (e.g. `main`) and root folder.
3. GitHub will give you a URL like `https://yourusername.github.io/repo-name/`.

### Netlify
1. Drag-and-drop this folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the GitHub repo and deploy with no build command (it's a static site — leave "build command" blank and "publish directory" as `/`).
2. Netlify gives you a free `*.netlify.app` URL; you can rename the site or add a custom domain.

Either way, just share the resulting URL with students (e.g., link it from your Canvas module).

## How scoring / submission works (important — please read)

This is a **fully static, client-side app** — there is no database and no server, which is exactly what a free Netlify/GitHub Pages plan gives you. That has two consequences worth knowing about:

1. **No automatic, cross-device gradebook.** The app can't silently send scores to you. What it *does* do: after the 16-question quiz, students get a results block (name, date, score, per-concept breakdown, and a short "verification code") that they can **copy or download as a .txt file** and submit through a Canvas assignment (e.g., a text-entry or file-upload assignment you create for this purpose).
2. **The verification code is a lightweight integrity check, not a secure credential.** It's generated with a simple checksum over the name/score/timestamp, purely so an obviously hand-edited submission looks "off" (the code won't match). Because all the logic runs in the student's browser and is visible in the page source, a sufficiently motivated student could still fake it. Treat this quiz as a **low-stakes / formative / completion-based** assessment (e.g., "submit proof you scored 80%+, retakes allowed") rather than a high-stakes locked-book exam. If you need tamper-proof grading, you'd want a real backend (e.g., a Google Form + Apps Script, or an LMS-native quiz) — happy to help build that if you ever want it, but it was intentionally left out here per your preference for the simplest static-hosting setup.

Separately, the app uses the browser's `localStorage` to remember a student's mastery progress and best score **on that one device/browser only** — this is just a convenience (so refreshing the page doesn't wipe progress) and is *not* shared with you automatically. There's a small "Reset my saved progress on this device" link in the footer if a student wants to start fresh.

## Customizing the question bank

All question content lives in `questions.js`. Each concept (`causation`, `incrementality`, `stats`, `goldstandard`, `applied`, `altmethods`) has a list of generator functions; each generator builds one randomized question object (`{stem, options, correctIndex, explanation}`). To add a new question type, write a new generator function following the existing pattern and add it to that concept's `generators` array in the `CONCEPTS` list near the bottom of the file. The 16-question blueprint (how many questions per concept) is the `BLUEPRINT` array right below `CONCEPTS`.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses `navigator.clipboard` for the "Copy code" button with a manual-selection fallback for older/insecure contexts.
