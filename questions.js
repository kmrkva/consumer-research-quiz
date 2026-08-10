/* ==========================================================================
   Consumer Behavior — Causal Inference & Research Methods Quiz
   questions.js
   ---------------------------------------------------------------------
   Generates randomized, template-based questions across six concept
   areas. Each generator builds a fresh question every call: numbers,
   company/product names, and — importantly — often the underlying
   scenario branch (confounded vs. clean, significant vs. not, etc.) are
   chosen at random, so the correct answer isn't always in the same
   "slot" and students can't memorize a pattern.

   Two question shapes are supported:
     - "single"  : classic multiple choice, exactly one correct option.
     - "multi"   : "select all that apply" — one or more correct options,
                   graded all-or-nothing (must select every correct
                   option and no incorrect ones).
   ========================================================================== */

(function (global) {
  "use strict";

  /* ---------------------------- utilities ------------------------------ */

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function pickN(arr, n) {
    const copy = arr.slice();
    const out = [];
    while (out.length < n && copy.length) {
      out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    }
    return out;
  }
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randFloat(min, max, decimals) {
    const v = Math.random() * (max - min) + min;
    return Number(v.toFixed(decimals === undefined ? 2 : decimals));
  }
  function coin(p) {
    return Math.random() < (p === undefined ? 0.5 : p);
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  /* Naive but sufficient indefinite article for our fixed vocab lists. */
  function article(word) {
    return /^[aeiouAEIOU]/.test(word) ? "an" : "a";
  }
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* Build a single-answer question from a stem, an array of option strings,
     the index of the correct option (before shuffling), and an explanation.
     Options are shuffled so the correct answer's position changes every time. */
  function mkQuestion(concept, stem, options, correctIdx, explanation) {
    const tagged = options.map((text, i) => ({ text, correct: i === correctIdx }));
    const shuffled = shuffle(tagged);
    return {
      id: uid(),
      concept,
      type: "single",
      stem,
      options: shuffled.map((o) => o.text),
      correctIndex: shuffled.findIndex((o) => o.correct),
      explanation,
    };
  }

  /* Build a "select all that apply" question. correctIndices refers to
     indices in `options` BEFORE shuffling. Graded all-or-nothing. */
  function mkMultiQuestion(concept, stem, options, correctIndices, explanation) {
    const tagged = options.map((text, i) => ({ text, correct: correctIndices.includes(i) }));
    const shuffled = shuffle(tagged);
    return {
      id: uid(),
      concept,
      type: "multi",
      stem,
      options: shuffled.map((o) => o.text),
      correctIndices: shuffled.reduce((acc, o, i) => (o.correct ? acc.concat(i) : acc), []),
      explanation,
    };
  }

  /* ------------------------------ shared data ---------------------------- */

  const COMPANIES = [
    "Bright Cart (online apparel)",
    "Peak Roast (coffee subscription)",
    "Nimbus Fitness (gym chain)",
    "Loop Grocery (grocery delivery)",
    "Solstice Skincare (D2C beauty)",
    "TrailMix Outdoor (outdoor gear)",
    "PixelDesk (project-management SaaS)",
    "Bloom & Co (flower delivery)",
    "Craft Brew Supply (home-brewing kits)",
    "Verve Insurance (auto insurance)",
    "Cedar Bank (regional bank)",
    "Snap Meals (meal kits)",
    "Harbor Books (online bookstore)",
    "Fleetwood Tires (auto parts retailer)",
  ];
  const CHANNELS = [
    "email newsletter",
    "Instagram ad campaign",
    "in-store display",
    "search (Google) ad campaign",
    "direct-mail postcard",
    "push notification",
    "influencer partnership",
    "loyalty-app banner",
    "retargeting ad",
    "podcast ad read",
  ];
  const METRICS = [
    "purchase rate",
    "average order value",
    "click-through rate",
    "app downloads",
    "repeat-purchase rate",
    "cart size",
    "renewal rate",
    "sign-up rate",
  ];
  const REGIONS = [
    ["zip codes", "zip code"],
    ["states", "state"],
    ["metro areas", "metro area"],
    ["store locations", "store"],
  ];
  const RESEARCHERS = ["a research team", "an analyst", "a marketing science team", "a grad student researcher"];

  /* Two harmless trends that rise together over time with no plausible causal
     link, for spurious-correlation questions (in the spirit of the classic
     "Spurious Correlations" internet graphs — genericized here). */
  const SPURIOUS_PAIRS = [
    { x: "per-capita organic food spending", y: "the number of new meditation apps launched that year" },
    { x: "national cheese consumption", y: "the number of new craft breweries opened that year" },
    { x: "sales of reusable water bottles", y: "the number of new coding bootcamps founded" },
    { x: "average smartphone screen size", y: "the number of new podcast shows launched" },
    { x: "sales of standing desks", y: "the number of new plant-based restaurants opened" },
  ];

  /* ============================ (a) Correlation, Causation & Confounds ===== */
  /* Selection effects, third-variable confounds, and reverse causality are
     treated as one unified topic here — the emphasis is on recognizing the
     LOGIC of the problem in a scenario, not on labeling which named bias it
     is. Many questions use a three-way "yes / no-but-possible / no-way"
     answer pattern that mirrors how these judgment calls actually work:
     a plausible alternative explanation means you can't confidently claim
     causation, but it doesn't mean causation is impossible either. */

  function q_causation_confound() {
    const company = pick(COMPANIES);
    const confounds = [
      { driver: "the holiday shopping season", x: "hours of paid social ads shown", y: "weekly sales" },
      { driver: "overall market demand that week", x: "number of promotional emails sent", y: "revenue" },
      { driver: "which customers already loved the brand", x: "customer engagement with the loyalty app", y: "total spending" },
      { driver: "local weather", x: "foot traffic near the store", y: "seasonal product sales" },
      { driver: "which regions have higher income", x: "premium subscription ad exposure", y: "premium plan sign-ups" },
    ];
    const c = pick(confounds);
    const r = randFloat(0.35, 0.78, 2);
    const stem = `At ${company}, ${pick(RESEARCHERS)} finds that ${c.x} is positively correlated with ${c.y} (r = ${r}). Someone on the team concludes: "This proves that increasing ${c.x} causes higher ${c.y}." What's the best evaluation of that claim?`;
    const options = [
      "The claim is well-supported — a correlation this strong is essentially proof of causation.",
      `The claim is premature: ${c.driver} could plausibly be driving both variables at once, so a confident causal conclusion isn't warranted from this correlation alone — though a causal effect is still possible.`,
      "The claim is wrong in the opposite direction — correlation coefficients can never be positive for real business metrics.",
      "The claim would only be wrong if the correlation were negative instead of positive.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      1,
      `A correlation, even a fairly strong one, doesn't tell us the direction of causality or rule out a third variable. Here, ${c.driver} plausibly affects both ${c.x} and ${c.y}. That doesn't prove there's no causal effect — it just means we can't confidently conclude one from this evidence. To make a causal claim we'd want an experiment (or a strong quasi-experimental design) that isolates ${c.x} from confounds like this.`
    );
  }

  function q_causation_selfselection() {
    const setups = [
      { pool: "1,000 employees", choiceDesc: "choose whether to join a voluntary mentorship program or remain in a no-program group", outcome: "career satisfaction scores" },
      { pool: "1,000 customers", choiceDesc: "choose whether to opt into a paid loyalty tier or stay on the free tier", outcome: "annual spending" },
      { pool: "1,000 students", choiceDesc: "choose whether to be in a group that spends $5 on a gift for someone else, or a control group that doesn't spend the money", outcome: "self-reported mood afterward" },
      { pool: "1,000 gym members", choiceDesc: "choose whether to sign up for a free nutrition-coaching add-on or not", outcome: "months of continued membership" },
    ];
    const s = pick(setups);
    const stem = `Researchers study a group of ${s.pool}. Each person is allowed to ${s.choiceDesc}, and the researchers later measure ${s.outcome}. They find the group that opted in scored noticeably better on ${s.outcome} than the group that didn't. What can the researchers conclude?`;
    const options = [
      `They can claim that the program/choice caused the improvement in ${s.outcome}.`,
      `They can only make a correlational claim — because people chose their own group, the two groups may have differed in other ways to begin with (self-selection), so the program's causal effect can't be confidently isolated.`,
      "They can conclude the program had absolutely no effect on anyone.",
      "Neither claim is possible because self-reported outcomes are never usable as data.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      1,
      `Because participants chose their own group, people who opted in may have already been more motivated, engaged, or otherwise different from those who opted out — a classic self-selection confound. That means the comparison is correlational, not causal: the true effect of the program itself is mixed up with pre-existing differences between the kinds of people who choose each option. A randomized experiment (assigning people to groups regardless of their preference) would be needed to isolate the causal effect.`
    );
  }

  function q_causation_randomizedvalid() {
    const setups = [
      { pool: "1,000 students", treat: "drink caffeinated coffee", control: "drink a placebo drink that tastes the same but is decaffeinated", outcome: "complete an exam faster" },
      { pool: "800 shoppers", treat: "see a webpage with a money-back-guarantee badge", control: "see an identical webpage without the badge", outcome: "are more likely to complete checkout" },
      { pool: "600 employees", treat: "receive a short mindfulness training", control: "receive a placebo training of equal length on an unrelated topic", outcome: "report lower self-rated stress" },
    ];
    const s = pick(setups);
    const stem = `Research is conducted on a group of ${s.pool}. The researchers randomly assign participants to either a treatment group (who ${s.treat}) or a control group (who ${s.control}). They find that people in the treatment group ${s.outcome} compared to the control group. What can the researchers conclude?`;
    const options = [
      "They can claim that the treatment caused this difference between the treatment and control groups.",
      "They cannot claim causation because the study only measured one outcome.",
      "They can only make a correlational claim, because any study involving human choice is correlational.",
      "They cannot claim causation unless the sample included at least 10,000 people.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      0,
      "Because participants were randomly assigned to conditions, the treatment and control groups should be equivalent, on average, on every other factor (motivation, prior habits, demographics, etc.) — known and unknown. That's exactly what licenses a causal claim: with random assignment, the treatment is the one systematic difference between groups, so it's reasonable to attribute the outcome difference to it."
    );
  }

  function q_causation_spurious_graph() {
    const p = pick(SPURIOUS_PAIRS);
    const r = randFloat(0.95, 0.99, 3);
    const stem = `A chart plots two time series from the same 15-year period: ${p.x} and ${p.y}. Both have risen steadily, and the two lines track each other closely (r = ${r}). What should we conclude?`;
    const options = [
      `${p.x[0].toUpperCase() + p.x.slice(1)} likely causes ${p.y}.`,
      `${p.y[0].toUpperCase() + p.y.slice(1)} likely causes ${p.x}.`,
      `${p.x[0].toUpperCase() + p.x.slice(1)} and ${p.y} have a strong positive correlation over this period, but a shared trend over time (e.g., both rising as the economy/culture changed generally) is a far more plausible explanation than either one causing the other.`,
      `${p.x[0].toUpperCase() + p.x.slice(1)} and ${p.y} have only a weak correlation, so nothing meaningful can be said.`,
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      2,
      `r = ${r} is a very strong correlation — so "weak correlation" is factually wrong. But two unrelated trends that both happen to rise steadily over the same years will often be strongly correlated purely because of shared time trends, not because either causes the other. This is a classic spurious correlation: strong r, no plausible causal mechanism, and an obvious shared confound (time / broader societal trends).`
    );
  }

  function q_causation_beforeafter_nuanced() {
    const scenarios = [
      { co: "a grocery chain", action: "re-organized an aisle so competing products were placed farther apart", metric: "average spending per customer", window: "the following month" },
      { co: "a retailer", action: "moved an in-store promotional sign to a more visible spot", metric: "hourly sales of the promoted item", window: "later that same day" },
      { co: "an online store", action: "redesigned its checkout flow", metric: "conversion rate", window: "the following month" },
    ];
    const s = pick(scenarios);
    const pct = randInt(4, 15);
    const stem = `${s.co[0].toUpperCase() + s.co.slice(1)} ${s.action}. They found that ${s.metric} was ${pct}% higher in ${s.window} than it was before the change. What should they conclude?`;
    const options = [
      `The change definitely caused the increase in ${s.metric}.`,
      `It's possible the change caused the increase, but there are other reasonable explanations (seasonality, other simultaneous changes, general trends), so they shouldn't make a confident causal claim from this comparison alone.`,
      `The change definitely did NOT cause any change in ${s.metric}.`,
      "The comparison is meaningless because percentages can't be used to describe business metrics.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      1,
      `A simple before/after comparison is confounded with everything else that changed over that same window — seasonality, other initiatives, broader trends. That means a causal effect is plausible but not confidently established either way. Note the careful wording: the right answer isn't "no effect," it's "can't be confident," because the design doesn't rule the effect in OR out.`
    );
  }

  function q_causation_anyofabove() {
    const stem = `A marketing analyst finds a positive correlation between advertising spend and sales at their company: monthly sales tend to be higher in months when the company spends more on advertising. Which of the following might be true?`;
    const options = [
      "Advertising causes an increase in sales at this company.",
      "Higher sales give the company more money available for advertising, which leads them to invest more in it (reverse causality).",
      "A third variable might explain both — for example, the company may have launched a great new product, which explains both the sales increase and the increased advertising around it.",
      "Any of the above might be true — the correlation alone can't tell us which explanation (or combination) is correct.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      3,
      "This is the core lesson of correlational data: a positive correlation is equally consistent with forward causation, reverse causation, and a third-variable confound (or some mix of all three). Without an experiment or a strong quasi-experimental design, the correlation alone can't distinguish between these explanations — so all of them remain live possibilities."
    );
  }

  function q_causation_differinggroups() {
    const pairs = [
      { g1: "Mac users", g2: "PC users", singularA: "a Mac user", singularB: "a PC user", co: "an online retailer", metric1: "less likely to make a purchase", metric2: "spent more money per purchase when they did buy" },
      { g1: "customers who read online reviews before buying", g2: "customers who don't", singularA: "someone who reads online reviews before buying", singularB: "someone who doesn't", co: "an electronics retailer", metric1: "took longer to complete checkout", metric2: "had a higher average order value" },
    ];
    const s = pick(pairs);
    const stem = `${cap(s.co)} compares the behavior of ${s.g1} to ${s.g2} (a naturally occurring, non-randomized split — customers weren't assigned to be one or the other). They find that ${s.g1} were ${s.metric1}, but ${s.metric2}. What should they conclude?`;
    const options = [
      `Being ${s.singularA} (rather than ${s.singularB}) causes people to spend more per purchase.`,
      `Being ${s.singularA} is associated with spending more per purchase, but this comparison can't establish that it causes the difference — the two groups likely differ in other ways too (e.g., income, habits).`,
      "The comparison proves that the same individuals would spend differently if you switched their group membership.",
      "Nothing can be concluded because the two groups are different sizes.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      1,
      "Because group membership here isn't randomly assigned — people naturally sort themselves into these groups — any pre-existing differences between the groups (income, shopping habits, demographics) are confounded with the grouping variable itself. The data show a real association, but not a causal one."
    );
  }

  function q_causation_whatmatters() {
    const stem = `A colleague asks: "What is the single most important design feature for being able to draw a causal conclusion from a study?" Which answer is best?`;
    const options = [
      "Random assignment of units (customers, stores, etc.) to treatment and control conditions, so the groups are equivalent on average except for the treatment.",
      "Collecting as large a sample as possible, regardless of how people ended up in each group.",
      "Making sure the correlation coefficient between treatment and outcome is above 0.5.",
      "Running the study for as long as possible before analyzing the data.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      0,
      "Random assignment is what makes the treatment and control groups comparable on both observed and unobserved factors, on average. Without it, any difference in outcomes could be explained by pre-existing differences between the groups rather than the treatment itself — no amount of sample size, a large correlation, or study duration substitutes for that."
    );
  }

  function q_causation_coefficient() {
    const r = randFloat(-0.85, 0.85, 2);
    const strength = Math.abs(r) < 0.2 ? "very weak" : Math.abs(r) < 0.4 ? "weak" : Math.abs(r) < 0.6 ? "moderate" : Math.abs(r) < 0.8 ? "strong" : "very strong";
    const direction = r > 0 ? "positive" : "negative";
    const stem = `A dataset shows a correlation coefficient of r = ${r} between ad spend and weekly sales across stores. Which statement correctly interprets this number?`;
    const options = [
      `It indicates a ${strength} ${direction} linear association between the two variables — nothing more, and by itself it says nothing about whether one causes the other.`,
      `It means ad spend explains ${Math.round(Math.abs(r) * 100)}% of the variation in sales.`,
      "It proves that increasing ad spend will increase sales by that same proportion.",
      "Correlation coefficients only have meaning if they come from a randomized experiment.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      0,
      `r = ${r} describes the strength (${strength}) and direction (${direction}) of a linear association. It's r² (${(r * r).toFixed(2)}), not r, that relates to "variance explained" in a simple regression sense — and even that is a descriptive, not causal, statement. Correlation coefficients can be computed from observational OR experimental data; what matters for causal claims is the design, not the statistic itself.`
    );
  }

  function q_causation_confound_multi() {
    const stem = `A firm observes a strong positive correlation between two variables and wants to know whether it can trust a causal story. Which of the following are legitimate reasons to be cautious about concluding causation from this correlation alone? (Select all that apply.)`;
    const options = [
      "A third, unmeasured variable could be driving both variables at once (a confound).",
      "The direction of causality could run the opposite way from what's assumed (reverse causality).",
      "The units that ended up 'high' on one variable may have self-selected into it in a way that's related to the outcome (selection effect).",
      "The correlation coefficient was positive rather than negative.",
      "The sample size was larger than 100.",
    ];
    return mkMultiQuestion(
      "causation",
      stem,
      options,
      [0, 1, 2],
      "Confounding, reverse causality, and self-selection are all genuine reasons a correlation might not reflect the assumed causal story. The sign of the correlation (positive vs. negative) and having a reasonably large sample size don't, by themselves, address any of these problems — confounds and selection effects can happen in large samples just as easily as small ones."
    );
  }

  /* ============================ (b) Incrementality ======================== */

  function q_incr_noholdout_confound() {
    const company = pick(COMPANIES);
    const channel = pick(CHANNELS);
    const pct = randInt(10, 35);
    const season = pick(["the holiday season", "back-to-school season", "a competitor's outage", "a broader market upswing"]);
    const stem = `${company} ran ${article(channel)} ${channel} campaign all last month. Sales rose ${pct}% compared to the month before, which overlapped with ${season}. The team wants to claim the campaign caused an incremental ${pct}% increase in purchases. Can they conclude that?`;
    const options = [
      `Yes — a ${pct}% increase after the campaign launched is clear evidence of incremental lift.`,
      `No — without a comparison group that didn't see the campaign (a holdout), it's impossible to separate the campaign's effect from ${season} or other trends happening at the same time.`,
      "Yes, but only if the campaign cost less than the extra revenue generated.",
      "No, because sales figures can never be used to measure incrementality.",
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      1,
      `A before/after comparison confounds the campaign with everything else that changed at the same time (here, ${season}). To measure true incrementality — the extra purchases caused by the campaign, above and beyond what would have happened anyway — you need a randomized holdout group that didn't receive the campaign, so you can compare "with" vs. "without" while everything else stays the same.`
    );
  }

  function q_incr_highintent() {
    const company = pick(COMPANIES);
    const channel = pick(CHANNELS);
    const stem = `${company} targets its ${channel} at customers who had already added items to their cart in the last hour. 40% of them purchase within a day. The team claims the campaign drove a 40-percentage-point incremental lift in purchases. What's the flaw in that reasoning?`;
    const options = [
      "There's no flaw — any purchase after seeing an ad counts as incremental by definition.",
      "Many of these high-intent customers would likely have purchased anyway even without the message, so the raw purchase rate overstates the campaign's incremental effect.",
      "The flaw is that 40% is too low a number to be meaningful.",
      "The flaw is that cart additions can't be tracked accurately.",
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      1,
      "This is a classic incrementality trap: targeting people who are already very likely to convert makes the campaign look highly effective, but much of that 40% would have purchased with no message at all. The only way to know the true incremental effect is to compare this treated group's purchase rate to a similar, randomly-held-out group that didn't receive the message."
    );
  }

  function q_incr_properholdout() {
    const company = pick(COMPANIES);
    const channel = pick(CHANNELS);
    const treated = randFloat(6, 14, 1);
    const control = randFloat(4, treated - 0.5, 1);
    const stem = `${company} randomly splits customers into two groups: one receives ${article(channel)} ${channel}, the other (a holdout) receives nothing. Purchase rate is ${treated}% in the treated group vs. ${control}% in the holdout, and the difference is statistically significant. What can the team conclude?`;
    const options = [
      `This is good evidence that the ${channel} caused an incremental lift of about ${(treated - control).toFixed(1)} percentage points in purchase rate, since random assignment rules out the usual confounds.`,
      "Nothing — a single holdout test is never sufficient to measure incrementality.",
      "The campaign caused a lift, but the exact size can't be estimated from this kind of test.",
      "The result only shows correlation, not incrementality, because it wasn't a lab experiment.",
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      0,
      `This is exactly the design that identifies incrementality: random assignment to "message" vs. "no message" (holdout) means the two groups are comparable on everything except the campaign, so the ${(treated - control).toFixed(1)}-point gap can be attributed to the campaign itself.`
    );
  }

  function q_incr_doublecounting() {
    const company = pick(COMPANIES);
    const stem = `${company}'s marketing dashboard shows that email, retargeting ads, and search ads together are each "credited" with driving a customer's purchase — the same purchase shows up as attributed to all three channels. The team sums the attributed sales across channels to estimate total incremental impact. Why is this problematic?`;
    const options = [
      "It isn't problematic — attribution systems always give an unbiased estimate of incrementality.",
      "Multi-touch attribution credits every channel a customer touched, which can double- (or triple-) count the same sale and overstate each channel's true incremental contribution.",
      "It's problematic only because email marketing is cheaper than the other channels.",
      "It's problematic because attribution software can't track email opens.",
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      1,
      "Standard attribution (credit given to every touchpoint a converter encountered) is not the same as incrementality (the causal lift from a channel). Summing attributed sales across channels routinely overstates total impact because the same sale gets counted multiple times, and it still doesn't tell you what would have happened without each channel — that requires holdouts or experiments."
    );
  }

  /* ============================ (c) Stats basics =========================== */

  function q_stats_pvalue_meaning() {
    const p = randFloat(0.01, 0.049, 3);
    const stem = `A study finds p = ${p} for the effect of a new checkout design on conversion. Which is the correct interpretation of this p-value?`;
    const options = [
      `Assuming there truly is no effect (the null hypothesis), the probability of observing a result at least this extreme is ${p}.`,
      `There is a ${(1 - p).toFixed(2) * 100}% probability that the new checkout design actually works.`,
      `There is only a ${(p * 100).toFixed(1)}% probability that the null hypothesis is true.`,
      "It means the effect size is small and probably not worth caring about.",
    ];
    return mkQuestion(
      "stats",
      stem,
      options,
      0,
      "A p-value is the probability of seeing data this extreme (or more) if the null hypothesis were true — it is not the probability that the null (or the alternative) hypothesis is true, and it says nothing directly about effect size or practical importance."
    );
  }

  function q_stats_correlation_strength() {
    const rs = shuffle([randFloat(0.02, 0.15, 2), randFloat(0.4, 0.55, 2), randFloat(0.75, 0.95, 2)]);
    const stem = `Which of these correlation coefficients reflects the strongest linear relationship between two variables?`;
    const options = rs.map((r) => `r = ${r}`);
    const correctIdx = rs.indexOf(Math.max(...rs.map((r) => Math.abs(r))));
    return mkQuestion(
      "stats",
      stem,
      options,
      correctIdx,
      "Strength of a linear relationship is judged by the absolute value of r (how far from 0, toward ±1), not by its sign. The value closest to ±1 here reflects the strongest association."
    );
  }

  function q_stats_basic_vs_applied() {
    const scenarios = [
      { text: "A university lab studies whether scarcity cues generally increase perceived product value, across many unrelated product categories, to build a general theory of consumer psychology.", answer: "basic" },
      { text: "A consulting team tests whether adding a 'only 3 left in stock' label increases conversion on one specific retailer's product pages this quarter.", answer: "applied" },
      { text: "Researchers investigate the general cognitive mechanism behind why people anchor on the first price they see, without reference to any specific company.", answer: "basic" },
      { text: "A brand's internal analytics team evaluates whether their new loyalty tier increased that brand's customer retention.", answer: "applied" },
    ];
    const s = pick(scenarios);
    const stem = `Is the following best described as basic (fundamental) research or applied research in consumer behavior/marketing? "${s.text}"`;
    const options = [
      "Basic research — it's aimed at building general, theory-level knowledge rather than solving one company's specific decision.",
      "Applied research — it's aimed at answering a specific, practical business question for a particular firm or context.",
    ];
    const correctIdx = s.answer === "basic" ? 0 : 1;
    return mkQuestion(
      "stats",
      stem,
      options,
      correctIdx,
      s.answer === "basic"
        ? "Basic research aims to build generalizable theory or understanding (e.g., how a psychological mechanism works broadly), without necessarily targeting a specific firm's decision."
        : "Applied research is designed to answer a specific, practical decision for a particular organization or context, using research methods to guide action rather than build general theory."
    );
  }

  function q_stats_nonsignificant() {
    const p = randFloat(0.11, 0.68, 2);
    const company = pick(COMPANIES);
    const stem = `${company} tests a new email subject line against the old one and finds a small difference in open rates, but p = ${p} (not statistically significant). Which is the most appropriate interpretation?`;
    const options = [
      "This proves the new subject line has zero effect on open rates.",
      "This means the study should be thrown out entirely — non-significant results are never informative.",
      "The evidence isn't strong enough to conclude there's a real difference; the true effect could be zero, small, or the study may simply lack the power (e.g., sample size) to detect it.",
      "It means the effect is definitely real but just too small to matter practically.",
    ];
    return mkQuestion(
      "stats",
      stem,
      options,
      2,
      `A non-significant result (p = ${p}) means we can't confidently rule out "no effect" — it is NOT proof that there is no effect. Absence of evidence isn't evidence of absence, especially with limited sample sizes; the honest conclusion is "inconclusive," not "no effect" or "definitely a real but small effect."`
    );
  }

  function q_stats_ci_or_significance() {
    const company = pick(COMPANIES);
    const lift = randFloat(1.5, 6, 1);
    const stem = `${company} reports that a redesign increased conversion by ${lift} percentage points, with a 95% confidence interval of [-0.8, ${(lift * 2 + 0.8).toFixed(1)}]. What should the team conclude?`;
    const options = [
      `Because the interval includes 0, the estimate is quite uncertain — the data are consistent with anywhere from a small negative effect to a fairly large positive one, so treat the ${lift}-point estimate cautiously.`,
      `The team should confidently report a guaranteed ${lift}-point lift going forward.`,
      "A confidence interval that includes negative numbers means the test was run incorrectly.",
      "Confidence intervals are irrelevant if you already have a point estimate.",
    ];
    return mkQuestion(
      "stats",
      stem,
      options,
      0,
      "A wide confidence interval that straddles zero signals a lot of uncertainty in the estimate — the true effect could plausibly be slightly negative or considerably positive. The point estimate alone (without considering the interval) overstates how precisely we know the effect."
    );
  }

  /* ============ (d) Random Assignment Logic, Gold-Standard Experiments & A/B Tests === */

  function q_gold_why_rct() {
    const stem = `Why are randomized controlled experiments considered the "gold standard" for establishing causality in consumer behavior and marketing research?`;
    const options = [
      "Random assignment makes treatment and control groups statistically equivalent, on average, on both observed and unobserved factors — so any outcome difference can be attributed to the treatment.",
      "They are the cheapest and fastest type of study to run.",
      "They always produce statistically significant results.",
      "They eliminate the need for a control group entirely.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "The power of random assignment is that it balances *all* other factors (known and unknown) between groups on average — that's what lets us attribute outcome differences to the treatment rather than pre-existing differences. It has nothing to do with cost, speed, or guaranteeing significance."
    );
  }

  function q_gold_why_prepost_fails() {
    const stem = `A researcher wants to explain, in general terms, why a simple "before vs. after" (pre/post) comparison is weaker evidence of causation than a randomized experiment. What's the core reason?`;
    const options = [
      "Pre/post designs compare the same group to itself at two different times, so anything else that changed over that same period (trends, seasonality, other initiatives) is confounded with the treatment — there's no comparison group that shows what would have happened without the treatment.",
      "Pre/post designs always use smaller sample sizes than experiments.",
      "Pre/post designs are weaker only because they don't use p-values.",
      "There's no real difference in strength between pre/post designs and randomized experiments — both allow the same causal confidence.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "Randomized experiments work by comparing two groups that are, on average, identical except for the treatment — so the control group tells you what would have happened without it (the 'counterfactual'). A pre/post design has no such comparison group: it can't distinguish the treatment's effect from anything else that changed over time, like seasonality or a broader trend."
    );
  }

  function q_gold_abtest_recognize() {
    const setups = [
      { co: "an e-commerce site", change: `a "12 people have this in their cart" message added to product pages`, metric: "purchase rate" },
      { co: "a subscription company", change: 'the annual plan\'s price displayed as "$10/month" instead of "$120/year"', metric: "sign-up rate" },
      { co: "an online retailer", change: 'a second "Buy Now" button added alongside the existing "Add to Cart" button', metric: "purchase rate" },
      { co: "a food-delivery app", change: "the estimated delivery time shown before checkout instead of after", metric: "order completion rate" },
    ];
    const s = pick(setups);
    const lift = randInt(4, 18);
    const stem = `${cap(s.co)} runs a true A/B test: incoming visitors are randomly assigned to see the current version of the page or a new version featuring ${s.change}. The group that saw the new version had a ${lift}% higher ${s.metric}, and the difference was statistically significant. What should they conclude?`;
    const options = [
      `The change caused the increase in ${s.metric} — random assignment to the two versions makes this a valid causal comparison, just like a lab experiment.`,
      "The change is only correlated with the increase, because A/B tests run on a website can never support causal claims the way a 'real' experiment can.",
      "Nothing can be concluded without also running a focus group to confirm the result.",
      `The ${lift}% figure can't be trusted unless the test ran for at least a full calendar year.`,
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "A well-run A/B test IS a randomized controlled experiment — visitors are randomly assigned to versions, which balances the groups on everything except the change being tested. There's nothing inherently 'less valid' about causal claims from a properly randomized online test compared to an offline lab experiment; what matters is the random assignment, not the setting."
    );
  }

  function q_gold_pricing_framing() {
    const stem = `A subscription company wants to know whether displaying its annual plan as "$10/month" (billed annually) instead of "$120/year" changes sign-up rates — a form of price framing. What is the best way to test this causally?`;
    const options = [
      "Randomly assign visitors to see one framing or the other (an A/B test) and compare sign-up rates between the two groups.",
      "Show the new framing to everyone for a month, then compare that month's sign-up rate to the previous month's.",
      "Ask a focus group which framing they personally prefer.",
      "Look at whether sign-up rate is correlated with how long each visitor spent on the pricing page.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "Whenever it's operationally possible to randomly assign who sees which version, an A/B test is the strongest way to isolate the causal effect of a specific design choice like price framing — it avoids the seasonality/trend confounds of a before/after rollout and the stated-vs-actual-behavior gap of a focus group."
    );
  }

  function q_gold_cluster_randomization() {
    const [plural, singular] = pick(REGIONS);
    const company = pick(COMPANIES);
    const stem = `${company} wants to test a new ad campaign but can't show different ads to individual people who live in the same media market (they'd see each other's ads / it's logistically impossible to target that granularly). What's the best way to get closer to a true experiment?`;
    const options = [
      `Randomly assign entire ${plural} to either "gets the new campaign" or "gets the old/no campaign," then compare outcomes across ${plural} rather than individuals.`,
      "Give up on experimentation and just use whichever result the team already expected.",
      "Let each individual self-select into seeing the new campaign or not, based on their preference.",
      `Show the new campaign only in the single ${singular} with the highest existing sales.`,
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      `When you can't randomize individuals, cluster (or "geo") randomization — randomly assigning groups such as ${plural} to treatment vs. control — is the standard way to get much closer to the gold standard. It preserves random assignment (at the cluster level) while respecting practical constraints on targeting.`
    );
  }

  function q_gold_seasonality() {
    const company = pick(COMPANIES);
    const stem = `${company} can't randomly assign customers to a new pricing strategy, so they compare sales in the month after the change to the month before. A savvy analyst warns this comparison could be misleading. What should they do to strengthen the design, short of a true randomized experiment?`;
    const options = [
      "Nothing further is needed — before/after comparisons are just as strong as randomized experiments.",
      "Compare the treated group's change over time to a similar, untreated comparison group's change over the same period (a difference-in-differences approach), to net out seasonality and general time trends.",
      "Only compare sales from the exact same single day in each month, since that's sufficient to remove any trend.",
      "Switch to reporting correlation coefficients instead of comparing means.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      1,
      "When true randomization isn't possible, a common way to get closer to a causal estimate is a difference-in-differences design: track a comparable untreated group over the same period and subtract out its change (which captures seasonality/trends) from the treated group's change. This helps isolate the effect of the treatment itself from broader time trends."
    );
  }

  function q_gold_matching() {
    const [plural, singular] = pick(REGIONS);
    const company = pick(COMPANIES);
    const stem = `${company} rolls out a promotion in a handful of ${plural} chosen by the sales team (not randomly) because of budget constraints. To estimate the promotion's causal effect more credibly than a simple before/after look, what's a reasonable next-best approach?`;
    const options = [
      "Compare the treated " + singular.replace(/^\w/, (c) => c.toUpperCase()) + "s only to national averages from a completely different time period with no other adjustment.",
      `Find a matched comparison group of similar, untreated ${plural} (similar size, demographics, and pre-trend sales) to serve as a synthetic control, and compare how outcomes diverge after the promotion starts.`,
      "Assume the promotion had no effect since it wasn't randomly assigned.",
      "Only look at the single best-performing " + singular + " and generalize from it.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      1,
      `Matching or "synthetic control" methods try to construct a credible comparison group out of untreated ${plural} that looked similar to the treated ones beforehand. It's not as strong as true random assignment, but it's a well-established way to get closer to a causal estimate when randomization isn't feasible.`
    );
  }

  function q_gold_which_designs_multi() {
    const stem = `Which of the following research designs usually allow researchers to make confident cause-and-effect claims? (Select all that apply.)`;
    const options = ["Observational (naturally occurring) data with no manipulation", "A randomized controlled experiment", "A true A/B test with random assignment", "A focus group", "A correlational study with a few statistical controls added"];
    return mkMultiQuestion(
      "goldstandard",
      stem,
      options,
      [1, 2],
      "Randomized controlled experiments and true A/B tests both rely on random assignment, which is what supports a confident causal claim. Observational data, focus groups, and correlational studies with 'a few controls' can all be genuinely useful — but none of them can rule out confounding, selection, or reverse causality the way random assignment does."
    );
  }

  /* ============================ (e) Applied scenarios ======================= */

  function q_applied_webpage() {
    const company = pick(COMPANIES);
    const change = pick(["a new checkout button color", "a redesigned product page layout", "a shorter sign-up form", "a new homepage hero image"]);
    const stem = `${company}'s product team wants to know whether ${change} actually increases conversion, and they can implement it however they like. What is the best way to answer this causally?`;
    const options = [
      `Run a randomized A/B test: randomly show some visitors the new version and some the old version at the same time, then compare conversion rates.`,
      "Launch the change for everyone and compare this month's conversion rate to last month's.",
      "Ask a focus group whether they like the new version better.",
      "Look at whether conversion is correlated with how long each visitor has been a customer.",
    ];
    return mkQuestion(
      "applied",
      stem,
      options,
      0,
      "Whenever a firm can control who sees which version and it's practical to do so, a randomized A/B test is the strongest, most direct way to establish a causal effect — it isolates the change itself from time trends, seasonality, and customer differences."
    );
  }

  function q_applied_national_campaign() {
    const company = pick(COMPANIES);
    const stem = `${company} already ran a national ad campaign everywhere at once with no holdout group, and now leadership wants to know its true incremental ROI. What's the best recommendation going forward?`;
    const options = [
      `Accept that the incremental ROI of the past campaign can't be cleanly estimated, and design the next campaign with a randomized (or geo-based cluster-randomized) holdout group from the start.`,
      "Estimate ROI by comparing sales during the campaign to sales in the same country the previous year, treating any difference as the campaign's effect.",
      "Survey customers and ask them whether the ads influenced their purchase.",
      "There's no way to ever measure incremental ROI for ad campaigns, so stop trying.",
    ];
    return mkQuestion(
      "applied",
      stem,
      options,
      0,
      "Once a campaign has already run everywhere with no comparison group, there's no clean way to retroactively isolate its incremental effect from everything else going on at the same time. The right fix is forward-looking: build a holdout (ideally randomized, or geo/cluster-randomized if individual-level isn't feasible) into the next campaign."
    );
  }

  function q_applied_observational_bias() {
    const company = pick(COMPANIES);
    const stem = `${company} notices that customers who organically saw a competitor-comparison page before buying spent 25% more than those who didn't. Leadership wants to feature that page more prominently to "cause" higher spending. What should a careful analyst point out first?`;
    const options = [
      "Nothing — a 25% gap is decisive evidence to act on immediately.",
      "Customers who sought out a comparison page on their own may already be more deliberate, higher-intent shoppers, so the comparison confounds page-viewing with customer type; a randomized test of showing/hiding the page would give a cleaner answer.",
      "The number is meaningless unless it's converted into a p-value first.",
      "The finding should be ignored entirely because observational data is always useless.",
    ];
    return mkQuestion(
      "applied",
      stem,
      options,
      1,
      "This is a self-selection story: the type of customer who seeks out a comparison page likely differs from those who don't, independent of the page's causal effect. The fix isn't to ignore the data, but to test it properly — e.g., randomly showing or hiding the page (or its prominence) and comparing outcomes."
    );
  }

  function q_applied_pick_method() {
    const company = pick(COMPANIES);
    const stem = `${company}'s CMO asks: "Did our new customer-service chatbot actually improve satisfaction, or would satisfaction have improved anyway?" The company can randomly route some incoming chats to the old human-only flow and some to the new chatbot flow. What should the analytics team recommend?`;
    const options = [
      "Randomly assign incoming chats to chatbot vs. human-only, and compare satisfaction outcomes between the two — the ability to randomize here makes this the strongest option available.",
      "Just compare satisfaction scores from before the chatbot launched to scores after, since that's simpler to compute.",
      "Ask managers for their gut impression of whether the chatbot helped.",
      "Only look at chatbot users' satisfaction scores on their own, without any comparison group.",
    ];
    return mkQuestion(
      "applied",
      stem,
      options,
      0,
      "Whenever random assignment is operationally possible — as it is here, since incoming chats can be routed either way — it's the best available option because it directly addresses causality rather than relying on comparisons confounded by time trends or lacking any comparison group at all."
    );
  }

  function q_applied_two_ways_better() {
    const company = pick(COMPANIES);
    const stem = `${company}'s marketing director measures monthly sales and monthly advertising spend for one product and finds a positive correlation. Which of the following would give a MORE informative (more causally convincing) answer about whether the ad campaign increases sales than that simple correlation? (Select all that apply.)`;
    const options = [
      "Run a randomized geo experiment: randomly assign some regions to receive the campaign and others to serve as a holdout, then compare sales between the two.",
      "Use a difference-in-differences approach: compare the sales trend in advertised regions to the trend in similar, non-advertised regions over the same period, to net out seasonality and broader trends.",
      "Just compute the same correlation coefficient again on a second month of data.",
      "Round the sales and advertising numbers to fewer decimal places before comparing them.",
    ];
    return mkMultiQuestion(
      "applied",
      stem,
      options,
      [0, 1],
      "A randomized (or cluster-randomized) holdout test and a difference-in-differences comparison against a similar untreated group both move beyond a simple correlation toward isolating the campaign's causal effect. Recomputing the same correlation on more data, or changing numeric precision, doesn't address confounding or reverse causality at all."
    );
  }

  /* ============================ (f) Alternative methods ===================== */

  function q_alt_focus_groups() {
    const stem = `A firm relies on focus groups to decide whether a new product concept will succeed. Which statement best summarizes a real limitation of focus groups (relative to their strengths)?`;
    const options = [
      "Focus groups are excellent for generating rich, qualitative hypotheses about consumer reactions, but their small, often non-representative samples and social dynamics (e.g., groupthink, social desirability) make them a poor basis for causal or precise quantitative claims.",
      "Focus groups are just as statistically reliable as a large randomized experiment, since 'qualitative' data is inherently more trustworthy.",
      "Focus groups have no value at all and should never be used in consumer research.",
      "Focus groups are ideal for measuring incremental ad lift because participants can self-report exact purchase intent percentages.",
    ];
    return mkQuestion(
      "altmethods",
      stem,
      options,
      0,
      "Focus groups are a valuable tool for generating ideas, uncovering language customers use, and surfacing reactions researchers hadn't considered — but small sample sizes, self-selection into the group, social pressure, and reliance on stated (not actual) behavior make them unsuited for precise or causal conclusions."
    );
  }

  function q_alt_observational_pros_cons() {
    const stem = `Compared to a randomized experiment, what is a genuine advantage — not just a drawback — of using large-scale observational (naturally occurring) data?`;
    const options = [
      "It can offer much larger sample sizes and reflect real-world behavior 'in the wild' (high external validity), even though it's harder to draw clean causal conclusions from it.",
      "It automatically solves the problem of confounding variables.",
      "It always produces more statistically significant results than experiments.",
      "It removes the need for any statistical analysis.",
    ];
    return mkQuestion(
      "altmethods",
      stem,
      options,
      0,
      "Observational data's real strength is scale and realism — it captures how people actually behave, often at large scale and low cost, which experiments (especially lab experiments) can lack. Its weakness is the flip side: without random assignment, confounds make causal claims much harder to trust."
    );
  }

  function q_alt_ethics_practicality() {
    const scenarios = [
      "A bank wants to know whether denying loans to certain applicants causes worse financial outcomes for them",
      "A company wants to know whether charging different customers very different prices for an identical product (based only on their willingness to pay) causes changes in loyalty",
      "A health-adjacent brand wants to know whether withholding a safety warning from some customers changes their purchase behavior",
    ];
    const s = pick(scenarios);
    const stem = `${s}, but a true randomized experiment would be unethical or would violate fairness/legal norms. What's the most reasonable path forward?`;
    const options = [
      "Run the randomized experiment anyway, since business insight justifies the ethical cost.",
      "Give up on ever answering the question.",
      "Use quasi-experimental approaches (e.g., natural experiments, matching on observables, instrumental variables, or policy discontinuities) that approximate random assignment without directly manipulating people in harmful ways.",
      "Just trust whichever conclusion leadership already prefers.",
    ];
    return mkQuestion(
      "altmethods",
      stem,
      options,
      2,
      "When true experiments are off the table for ethical, legal, or practical reasons, researchers turn to quasi-experimental designs — natural experiments, matching, regression discontinuity, instrumental variables — that try to approximate the logic of random assignment using naturally occurring variation, without directly and deliberately harming participants."
    );
  }

  function q_alt_sparse_data() {
    const company = pick(["Maple & Co (a tiny online candle shop)", "The Corner Bookshop (a small independent online bookstore)", "Hearth Goods (a boutique home-decor store)", "Little Loom (a small online yarn/craft store)"]);
    const orders = randInt(2, 6);
    const stem = `${company} gets only about ${orders} orders per week. The owner wants to A/B test a new homepage design. Why is a traditional statistical A/B test poorly suited here, and what's a more sensible alternative?`;
    const options = [
      `With so few orders, it would take an extremely long time to accumulate enough data for statistical power to detect all but a huge effect — better alternatives include qualitative usability testing, heuristic/expert review, larger and more obvious design changes, or pooling data over a much longer window while controlling for trends.`,
      "It's not actually a problem — statistical tests work identically regardless of sample size.",
      "The owner should still run a formal A/B test but only look at the results after a single day.",
      "The only fix is to randomly assign individual customers to conditions using a coin flip performed by the owner personally.",
    ];
    return mkQuestion(
      "altmethods",
      stem,
      options,
      0,
      `Statistical power depends heavily on sample size; at ${orders} orders/week, a formal A/B test could take months or years to detect all but very large effects, and even then noise dominates. For very low-traffic settings, better options include qualitative/usability testing, expert heuristic evaluation, making bigger and more obviously impactful changes, or accepting a longer observation window with careful controls for seasonality — rather than relying on underpowered statistical significance testing.`
    );
  }

  /* ============================ registry ==================================== */

  const CONCEPTS = [
    {
      id: "causation",
      label: "Correlation, Causation & Confounds",
      letter: "a",
      generators: [
        q_causation_confound,
        q_causation_selfselection,
        q_causation_randomizedvalid,
        q_causation_spurious_graph,
        q_causation_beforeafter_nuanced,
        q_causation_anyofabove,
        q_causation_differinggroups,
        q_causation_whatmatters,
        q_causation_coefficient,
        q_causation_confound_multi,
      ],
    },
    { id: "incrementality", label: "Incrementality", letter: "b", generators: [q_incr_noholdout_confound, q_incr_highintent, q_incr_properholdout, q_incr_doublecounting] },
    { id: "stats", label: "P-values, Correlation & Research Basics", letter: "c", generators: [q_stats_pvalue_meaning, q_stats_correlation_strength, q_stats_basic_vs_applied, q_stats_nonsignificant, q_stats_ci_or_significance] },
    {
      id: "goldstandard",
      label: "Random Assignment, Gold-Standard Experiments & A/B Tests",
      letter: "d",
      generators: [q_gold_why_rct, q_gold_why_prepost_fails, q_gold_abtest_recognize, q_gold_pricing_framing, q_gold_cluster_randomization, q_gold_seasonality, q_gold_matching, q_gold_which_designs_multi],
    },
    { id: "applied", label: "Applied Business Scenarios", letter: "e", generators: [q_applied_webpage, q_applied_national_campaign, q_applied_observational_bias, q_applied_pick_method, q_applied_two_ways_better] },
    { id: "altmethods", label: "Alternative Methods & Their Limits", letter: "f", generators: [q_alt_focus_groups, q_alt_observational_pros_cons, q_alt_ethics_practicality, q_alt_sparse_data] },
  ];

  /* 16-question blueprint. Weighted toward (a) Correlation/Causation/Confounds
     and (d) Random Assignment/Gold-Standard/A-B Tests, since those cover the
     broadest ground (confounds + selection + reverse causality in one, and
     experimental logic + A/B tests + getting-closer-to-gold-standard in the
     other). b/c/e/f get lighter, focused coverage. */
  const BLUEPRINT = [
    { concept: "causation", count: 4 },
    { concept: "incrementality", count: 2 },
    { concept: "stats", count: 2 },
    { concept: "goldstandard", count: 4 },
    { concept: "applied", count: 2 },
    { concept: "altmethods", count: 2 },
  ];

  function conceptById(id) {
    return CONCEPTS.find((c) => c.id === id);
  }

  /* Generate one fresh random question for a given concept id.
     Avoids immediately repeating the same generator as `avoidGenIndex` when possible. */
  function generate(conceptId, avoidGenIndex) {
    const c = conceptById(conceptId);
    if (!c) throw new Error("Unknown concept: " + conceptId);
    let idx = Math.floor(Math.random() * c.generators.length);
    if (c.generators.length > 1 && avoidGenIndex !== undefined) {
      let tries = 0;
      while (idx === avoidGenIndex && tries < 8) {
        idx = Math.floor(Math.random() * c.generators.length);
        tries++;
      }
    }
    const q = c.generators[idx]();
    q._genIndex = idx;
    return q;
  }

  /* Build the fixed-length (16-question) quiz using the blueprint, with
     randomized content & randomized concept ordering within slots so the
     quiz feels different each retake while covering the same ground. */
  function buildBlueprintQuiz() {
    const pool = [];
    BLUEPRINT.forEach((slot) => {
      const usedGenIndices = [];
      for (let i = 0; i < slot.count; i++) {
        const avoid = usedGenIndices.length ? usedGenIndices[usedGenIndices.length - 1] : undefined;
        const q = generate(slot.concept, avoid);
        usedGenIndices.push(q._genIndex);
        pool.push(q);
      }
    });
    return shuffle(pool);
  }

  global.QuestionBank = {
    CONCEPTS,
    BLUEPRINT,
    conceptById,
    generate,
    buildBlueprintQuiz,
    _util: { pick, pickN, randInt, randFloat, coin, shuffle, uid },
  };
})(window);
