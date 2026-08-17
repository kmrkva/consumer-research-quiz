/* ==========================================================================
   Consumer Behavior — Causal Inference & Research Methods Quiz
   questions.js
   ---------------------------------------------------------------------
   Question bank v2 — rebuilt from the instructor's lecture deck, existing
   exam questions, and in-class scenario handouts. Real company names /
   cases (marked below) are adapted closely from those materials; fully
   randomized templated questions use invented placeholder companies.

   Two question shapes are supported:
     - "single"  : classic multiple choice, exactly one correct option.
     - "multi"   : "select all that apply" — one or more correct options,
                   graded all-or-nothing (must select every correct
                   option and no incorrect ones).
   Either shape may optionally carry a `visual` field (inline SVG markup)
   rendered above the answer options.
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
  function article(word) {
    return /^[aeiouAEIOU]/.test(word) ? "an" : "a";
  }
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function asCampaign(channel) {
    return /campaign/i.test(channel) ? channel : `${channel} campaign`;
  }

  function mkQuestion(concept, stem, options, correctIdx, explanation, visual) {
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
      visual: visual || null,
    };
  }

  function mkMultiQuestion(concept, stem, options, correctIndices, explanation, visual) {
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
      visual: visual || null,
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
  const FITNESS_APPS = ["FitPulse", "IronLoop", "PeakForm", "TrailFit", "CoreWorks", "Momentum Fitness"];
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
  const REGIONS = [
    ["zip codes", "zip code"],
    ["states", "state"],
    ["metro areas", "metro area"],
    ["store locations", "store"],
  ];

  /* ============================================================
     (a) Correlation, Causation, Confounds & Selection Effects
     ============================================================ */

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  /* Simple inline-SVG scatterplot with a positive, negative, or zero trend. */
  function scatterSVG(direction) {
    const W = 320,
      H = 190,
      pad = 28;
    const n = 16;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const x = Math.random();
      let y;
      if (direction === "positive") y = clamp01(x + randFloat(-0.24, 0.24, 3));
      else if (direction === "negative") y = clamp01(1 - x + randFloat(-0.24, 0.24, 3));
      else y = Math.random();
      pts.push([x, y]);
    }
    const toX = (v) => (pad + v * (W - 2 * pad)).toFixed(1);
    const toY = (v) => (H - pad - v * (H - 2 * pad)).toFixed(1);
    const dots = pts.map(([x, y]) => `<circle cx="${toX(x)}" cy="${toY(y)}" r="4.5" fill="#3454d1" fill-opacity="0.72"/>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="180" role="img" aria-label="scatterplot of the two variables">
      <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#c7cdda" stroke-width="1.5"/>
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="#c7cdda" stroke-width="1.5"/>
      ${dots}
    </svg>`;
  }

  const AXIS_LABEL_PAIRS = [
    ["Advertising spend", "Sales"],
    ["Price discount %", "Units sold"],
    ["Email frequency", "Unsubscribe rate"],
    ["Ad impressions", "Website visits"],
    ["Loyalty-app usage", "Repeat purchases"],
  ];

  function q_a1_correlation_type() {
    const direction = pick(["positive", "negative", "zero"]);
    const [xl, yl] = pick(AXIS_LABEL_PAIRS);
    const svg = scatterSVG(direction);
    const stem = `The chart below plots ${xl} (x-axis) against ${yl} (y-axis) across many stores. What type of correlation is shown?`;
    const options = ["A positive correlation", "A negative correlation", "No consistent relationship (a zero correlation)", "An illusory correlation"];
    const correctIdx = direction === "positive" ? 0 : direction === "negative" ? 1 : 2;
    return mkQuestion(
      "causation",
      stem,
      options,
      correctIdx,
      direction === "positive"
        ? "As one variable goes up, the other tends to go up too — that's a positive correlation. (Note: this describes the pattern only — it says nothing about whether one variable causes the other.)"
        : direction === "negative"
        ? "As one variable goes up, the other tends to go down — that's a negative correlation. (This describes the pattern only, not causation.)"
        : "The points are scattered with no consistent up-or-down pattern — that's a zero (or near-zero) correlation. Knowing one variable's value tells you basically nothing about the other.",
      svg
    );
  }

  function q_a2_confound() {
    const company = pick(COMPANIES);
    const x = pick(["ad spending", "promotional email volume", "influencer partnerships"]);
    const y = pick(["sales", "revenue", "sign-ups"]);
    const stem = `${company} finds that ${x} and ${y} are both noticeably higher in December than in other months. A team member says: "This proves ${x} causes higher ${y}." Is that a safe conclusion?`;
    const options = [
      "Yes — since both go up together, that's essentially proof of a causal link.",
      `Not necessarily — the holiday season itself could be driving both ${x} and ${y} at the same time, so we can't be confident the ${x} is what's causing the higher ${y}. (Maybe it does, maybe it doesn't — we'd need a real test to know.)`,
      "No — ad spending and sales can never be causally related.",
      "It depends only on whether the correlation is positive or negative.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      1,
      `Two things happening together doesn't tell us which (if either) caused the other. Here, the holiday season is a third variable — a plausible reason both ${x} and ${y} would rise at the same time, with no test yet ruling that out. This doesn't mean ${x} definitely has no effect — it just means we can't confidently conclude it does from this alone.`
    );
  }

  function q_a3_selfselection() {
    const n = randInt(150, 300);
    const p = pick(["p < .05", "p < .01", "p = .02"]);
    const stem = `Researchers want to study whether drinking coffee improves short-term mood. There are ${n} participants, and each one chooses for themselves whether they want to drink coffee before the study. Afterward, researchers measure everyone's mood and find that those who drank coffee had significantly more positive mood (${p}). Is this a causal study or a correlational study?`;
    const options = [
      `This is a causal study — since the difference was statistically significant (${p}), we know coffee caused the better mood.`,
      "This is a correlational study — participants chose their own group instead of being randomly assigned, so we can't be confident coffee itself caused the mood difference (people who choose to drink coffee might already differ from those who don't).",
      "This is a causal study, but only because the sample size is large enough.",
      "Neither — mood can't be measured scientifically.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      1,
      `Statistical significance tells you the difference probably isn't just random noise — but it says nothing about *why* the groups differ. Because participants picked their own group rather than being randomly assigned, coffee-drinkers might differ from non-drinkers in other ways (energy levels, morning routines, etc.) regardless of the coffee itself. Significance can't fix a non-random design.`
    );
  }

  function q_a4_dogownership_multi() {
    const stem = `A news article claims that owning a dog causes people to live longer, based on a study finding that dog owners live longer, on average, than non-owners. Before accepting that causal claim, which of the following are plausible alternative explanations? (Select all that apply.)`;
    const options = [
      "Healthier or wealthier people might be more likely to get a dog in the first place (a selection effect) — dog owners could have simply started out healthier.",
      "People who already walk or exercise more might be more likely to get a dog in the first place, and it's that pre-existing activity level (a third variable) — not the dog itself — that's driving the health benefit.",
      "The study measured a very large number of people.",
      "The difference between dog owners and non-owners was statistically significant.",
    ];
    return mkMultiQuestion(
      "causation",
      stem,
      options,
      [0, 1],
      "Both options 1 and 2 describe people self-selecting into dog ownership based on traits (health, wealth, existing activity level) they already had beforehand — both are genuine alternative explanations for this correlation that don't require the dog itself to be the cause. (Compare that to a different story — 'owning a dog gets people to walk more, and that's what improves their health' — which would actually still be the dog causing the outcome, just indirectly through exercise, rather than an alternative explanation.) A large sample size and statistical significance both just mean the pattern is probably real and not due to noise — neither one tells you *why* the pattern exists, so neither rules out these alternative explanations."
    );
  }

  function q_a5_headstart_multi() {
    const stem = `Kids who attended Head Start (an early-childhood education program) have higher elementary school grades, on average, than kids who didn't attend. A newspaper claims Head Start causes better grades. Before accepting that, which of the following are plausible alternative explanations? (Select all that apply.)`;
    const options = [
      "Parents who go through the effort of enrolling their kids in Head Start might already be more involved in their kids' education, regardless of the program itself.",
      "Families who enroll in Head Start might have other advantages (e.g., living somewhere with stronger elementary schools afterward) that also explain better grades.",
      "The comparison included both kids who attended and kids who didn't.",
      "Grades were measured years after the program ended.",
    ];
    return mkMultiQuestion(
      "causation",
      stem,
      options,
      [0, 1],
      "Both of these are selection-style concerns: families who choose (and manage) to enroll their kids in Head Start may differ from other families in ways connected to school success, apart from anything the program itself does. Simply comparing attendees to non-attendees (option 3) is just describing the study design, not a flaw by itself, and measuring grades later (option 4) is necessary for the question to make sense — neither one is an alternative explanation."
    );
  }

  function q_a6_anyofabove() {
    const confound = pick(["it's close to the holidays", "they just launched a new product", "it's their busiest season"]);
    const stem = `A marketing analyst finds a positive correlation between advertising and sales at their company: monthly sales tend to be higher in months when the company spends more on advertising, and lower in months when they spend less. Which of the following might be true?`;
    const options = [
      "Advertising might cause an increase in sales at this company.",
      "When the company has higher sales, this might lead them to have more money available for advertising, which could lead them to invest more in it (reverse causality).",
      `A third variable might explain both — for example, the company might spend more on ads AND have higher sales around the same time simply because ${confound}.`,
      "Any of the above might be true.",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      3,
      "This is the core lesson of correlational data: a positive correlation is equally consistent with forward causation, reverse causation, and a third-variable explanation (or some mix of all three). Without a real test, the correlation alone can't tell us which explanation (or combination) is correct — so all of them remain live possibilities."
    );
  }

  function q_a7_confound_multi() {
    const stem = `A firm observes a strong positive correlation between two variables and wants to know whether it can trust a causal story. Which of the following are legitimate reasons to be cautious about concluding causation from this correlation alone? (Select all that apply.)`;
    const options = [
      "A third, unmeasured variable could be driving both variables at once (a confound).",
      "The direction of causality could run the opposite way from what's assumed (reverse causality).",
      "The units that ended up 'high' on one variable may have self-selected into it in a way that's related to the outcome (a selection effect).",
      "The correlation coefficient was positive rather than negative.",
      "The sample size was larger than 100.",
    ];
    return mkMultiQuestion(
      "causation",
      stem,
      options,
      [0, 1, 2],
      "Confounding, reverse causality, and selection effects are all genuine reasons a correlation might not reflect the assumed causal story. The sign of the correlation (positive vs. negative) and having a reasonably large sample size don't, by themselves, address any of these problems — confounds and selection effects can happen in large samples just as easily as small ones."
    );
  }

  function q_a8_whatmatters() {
    const stem = `When consumer researchers conduct an experiment, which of the following is most important for them to be able to make a cause-and-effect claim?`;
    const options = [
      "A diverse, representative sample of participants",
      "Statistical controls (covariates)",
      "Random assignment to the groups (e.g., seeing the A version vs. the B version)",
      "A physical laboratory setting",
    ];
    return mkQuestion(
      "causation",
      stem,
      options,
      2,
      "Random assignment is what makes the groups comparable on everything else, on average, so any later difference can be attributed to the treatment. A representative sample helps you generalize results, and statistical controls can help with some observational analyses — but neither one, on its own, licenses a causal claim the way random assignment does. Experiments don't need to happen in a physical lab, either — most real A/B tests run entirely online."
    );
  }

  /* ============================================================
     (b) Incrementality
     ============================================================ */

  function q_b1_sponsored_search_trap() {
    const spend = randInt(5, 20) * 1000;
    const roas = randFloat(2.2, 4, 1);
    const revenue = Math.round((spend * roas) / 100) * 100;
    const clicks = randInt(Math.round(spend / 1.2), Math.round(spend * 1.4));
    const stem = `A company spends $${spend.toLocaleString()} on Google search ads. ${clicks.toLocaleString()} users click the ad and end up spending a total of $${revenue.toLocaleString()} on the website — a ${roas}x ROAS (return on ad spend). The marketing team celebrates a huge success. Here's the catch: when someone searches for this company's own brand name, the sponsored ad AND an organic (non-paid) listing for the very same product often both show up. If the company hadn't paid for the sponsored ad, what would most of those customers likely have done instead?`;
    const options = [
      "Left without buying anything, since they specifically wanted to click the sponsored ad.",
      "Clicked the organic (non-paid) listing for the same product and bought it anyway.",
      "Searched for a completely different, unrelated product.",
      "There's no way to guess, so the 3x+ ROAS figure should be trusted at face value.",
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      1,
      `A high ROAS doesn't mean the ad was incremental. When someone is already searching for your exact brand name, they usually intend to buy from you regardless — many would have simply clicked the free organic listing for the same product and purchased anyway. That means a big chunk of the "$${revenue.toLocaleString()} in ad-driven sales" would likely have happened with $0 spent on that ad.`
    );
  }

  function q_b2_newtonbaby() {
    const stem = `A mattress company spent heavily on "branded search" ads — whenever someone searched "[Company] mattress," a sponsored ad for their product appeared first. Results looked great: lots of clicks and purchases, and revenue was higher than the ad spend. Remember: incremental sales = sales that wouldn't have happened without the ad. Did the ads cause an increase in INCREMENTAL sales?`;
    const options = [
      "Yes — since revenue was higher than ad spend, the ads clearly paid for themselves.",
      "We can't be confident they did — most people who clicked the ad were already specifically searching for this brand, so a good chance those clicks (and purchases) weren't incremental; they might have bought the same product anyway, e.g., by clicking the free organic listing instead.",
      "Yes, branded search ads always drive fully incremental sales since the customer already knows the brand.",
      "There's no way to test whether ad spending like this is incremental.",
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      1,
      `This mirrors a real branded-search case: revenue exceeding ad spend doesn't tell you the ads caused that revenue, since most of those customers were already searching for the brand by name and likely would have found (and clicked) the free organic listing anyway. That doesn't prove the ads added zero sales — but it means the "success" story can't be trusted at face value. To actually find out, the company would need a real incrementality test (e.g., turning the ads off for some searches/regions and comparing) — which is exactly what a similar real company did, and found that only a small share of those sales were truly incremental.`
    );
  }

  function q_b3_freetrial() {
    const company = pick(FITNESS_APPS);
    const pct = randInt(8, 20);
    const stem = `${company}, a subscription-based fitness app, adds a free-trial option in October. From November through January, the company's revenue increases ${pct}%. The marketing team concludes the free trial caused the revenue boost. Can they conclude that with confidence?`;
    const options = [
      `Yes — the revenue increase right after launching the free trial is clear evidence it worked.`,
      `Not with full confidence — it's possible the free trial helped, but November–January also overlaps with the holiday season and New Year's resolutions (common times for fitness spending), so other explanations are just as plausible.`,
      `No — free trials never increase long-term revenue.`,
      `The comparison is meaningless because revenue can't be measured monthly.`,
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      1,
      "A simple before/after comparison is confounded with everything else that changed over that same window — here, a season when fitness spending tends to rise anyway (holidays, New Year's resolutions). That means the free trial's effect is plausible but not confidently established either way from this comparison alone."
    );
  }

  function q_b4_packers_email() {
    const stem = `The marketing director for a sports team's pro shop analyzes customer data and finds that people who click on more of the team's promotional emails tend to make more purchases than people who click on fewer emails. Based on this, he concludes email campaigns are highly effective and decides to increase email frequency and budget. What's the flaw in that reasoning?`;
    const options = [
      "There's no flaw — this is solid evidence that emails drive purchases.",
      "The customers who click on the most emails are probably the team's most engaged, loyal fans already — they may have made those purchases anyway, regardless of how many emails they got.",
      "The flaw is that email marketing is cheaper than other channels, so the comparison isn't fair.",
      "The flaw is that click rates can't be measured accurately.",
    ]
    return mkQuestion(
      "incrementality",
      stem,
      options,
      1,
      "This is a self-selection trap: the customers most likely to click promotional emails are probably already the most engaged fans, who were likely to buy from the pro shop regardless of email volume. Sending more emails to already-loyal fans may not create much (or any) incremental purchasing — to know for sure, he'd want to test it (e.g., randomly increase email frequency for some fans and compare to a group whose frequency stays the same)."
    );
  }

  function q_b5_comparisongroup() {
    const company = pick(COMPANIES);
    const channel = pick(CHANNELS);
    const treated = randFloat(6, 14, 1);
    const control = randFloat(4, treated - 0.5, 1);
    const stem = `${company} randomly splits customers into two groups: one receives ${article(channel)} ${channel}, the other (a comparison group that doesn't receive it) gets nothing. Purchase rate is ${treated}% in the group that got the campaign vs. ${control}% in the comparison group, and the difference is statistically significant. What can the team conclude?`;
    const options = [
      `This is good evidence that the ${channel} caused an incremental lift of about ${(treated - control).toFixed(1)} percentage points in purchase rate, since random assignment rules out the usual confounds.`,
      "Nothing — a single test like this is never sufficient to measure incrementality.",
      "The campaign caused a lift, but the exact size can't be estimated from this kind of test.",
      "The result only shows correlation, not incrementality, because it wasn't a lab experiment.",
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      0,
      `This is exactly the design that identifies incrementality: randomly assigning customers to "gets the campaign" vs. "doesn't" means the two groups are comparable on everything except the campaign, so the ${(treated - control).toFixed(1)}-point gap can be attributed to the campaign itself. (It doesn't need to be a lab experiment — this kind of randomized test runs entirely in the real world.)`
    );
  }

  function q_b6_doublecounting() {
    const company = pick(COMPANIES);
    const stem = `${company}'s marketing dashboard shows that email, retargeting ads, and search ads are each given credit for the same customer purchase — the same sale shows up as "caused by" all three channels at once. The team adds up the credited sales across all channels to estimate total impact. Why is this a problem?`;
    const options = [
      "It isn't a problem — if a channel gets credit for a sale, that sale really was caused by that channel.",
      "Crediting the same sale to multiple channels at once means you're counting it more than once, which overstates how much each channel is really contributing — and it still doesn't tell you what would've happened without that channel.",
      "It's a problem only because email marketing is the cheapest channel.",
      "It's a problem because email opens can't be tracked.",
    ];
    return mkQuestion(
      "incrementality",
      stem,
      options,
      1,
      "Giving \"credit\" to every channel a customer happened to encounter isn't the same as knowing which channel actually caused the sale. Adding up credited sales across channels routinely double- (or triple-) counts the same purchase and overstates total impact — and even for one channel alone, credit isn't the same as incrementality: that still requires comparing to what would've happened without it."
    );
  }

  /* ============================================================
     (c) P-values & Research Basics
     ============================================================ */

  function q_c1_coinflip() {
    const tiers = [
      { h: 48, t: 52, verdict: 0 },
      { h: 52, t: 48, verdict: 0 },
      { h: 41, t: 59, verdict: 1, p: 0.07 },
      { h: 59, t: 41, verdict: 1, p: 0.07 },
      { h: 25, t: 75, verdict: 2 },
      { h: 75, t: 25, verdict: 2 },
    ];
    const tier = pick(tiers);
    const pClause = tier.p !== undefined ? ` (this works out to p = ${tier.p})` : "";
    const stem = `You flip a coin 100 times and get ${tier.h} heads and ${tier.t} tails${pClause}. What should you conclude?`;
    const options = [
      "This is close enough to a 50/50 split that it's easily explained by random chance alone — no real reason to suspect the coin is unfair.",
      "This is somewhat unusual, but still not quite strong enough evidence to confidently say the coin is unfair.",
      "This result would be extremely unlikely to happen by chance with a fair coin — strong evidence the coin isn't fair.",
      "There's no way to draw any conclusion without flipping it many more times first.",
    ];
    const explanations = [
      "A split this close to 50/50 happens all the time with a perfectly fair coin — nothing suspicious here.",
      'A split this far from 50/50 is unusual — about like the lecture\'s example where a 59/41 split only happens by chance around 7% of the time — but that\'s still not rare enough to be confident the coin is rigged.',
      "A split this extreme (about like 75/25) would almost never happen with a fair coin — under a 1-in-10,000 chance — so you can be very confident something's off.",
    ];
    return mkQuestion("stats", stem, options, tier.verdict, explanations[tier.verdict]);
  }

  function q_c2_samplesize() {
    const branch = pick(["samplesize", "effectsize"]);
    if (branch === "samplesize") {
      const stem = `A randomized trial compares a new medication to a placebo. In one version of the study, 50% of the treatment group and 40% of the placebo group are healed (the same 10-percentage-point gap) — but the study only has 20 people. In another version, the same 10-point gap (50% vs. 40%) shows up with 2,000 people. Which version gives you more confidence the treatment actually works, and why?`;
      const options = [
        "The 20-person version — smaller studies are always more trustworthy.",
        "The 2,000-person version — with more people, the same 10-point gap is far less likely to just be random variation.",
        "Both equally — sample size doesn't matter if the percentage difference is the same either way.",
        "Neither — you can never trust a placebo-controlled study.",
      ];
      return mkQuestion(
        "stats",
        stem,
        options,
        1,
        "The same-sized gap (10 points) is much more convincing with more people. With only 20 participants, a 10-point gap could easily happen just from random luck in who got assigned to which group. With 2,000 people, that same gap is very unlikely to be random chance — this is exactly your class's example (20 people: p = .47, inconclusive; 2,000 people: p < .001, confident it's real)."
      );
    } else {
      const stem = `A randomized trial with 2,000 people compares a new medication to a placebo. In one version, 50% of the treatment group is healed vs. 40% of the placebo group (a 10-point gap). In another version with the same 2,000 people, it's 42% vs. 40% (only a 2-point gap). Which version lets you confidently say the treatment works?`;
      const options = [
        "Only the 10-point-gap version — even with a big sample, a very small effect can still be hard to distinguish from random noise.",
        "Only the 2-point-gap version — smaller effects are always easier to detect.",
        "Both equally — sample size is all that matters, not the size of the effect.",
        "Neither — 2,000 people is never enough for a medical study.",
      ];
      return mkQuestion(
        "stats",
        stem,
        options,
        0,
        "Sample size isn't the only thing that matters — the size of the effect matters too. With 2,000 people, a 10-point gap is easy to distinguish from random noise (p < .001), but a tiny 2-point gap can still be inconclusive (about p = .19 in your class's example) even with a large sample, because small effects are harder to tell apart from chance."
      );
    }
  }

  function q_c3_pvalue_meaning() {
    const p = pick([0.01, 0.02, 0.03, 0.04]);
    const stem = `A study finds p = ${p} for whether a new ad increases clicks. What does this p-value mean?`;
    const options = [
      `An estimate of the probability that a result this extreme (or more extreme) would happen just by random chance alone, if the ad actually had no real effect.`,
      `There's a ${(p * 100).toFixed(0)}% chance the ad has no effect.`,
      `The ad increases clicks by ${(p * 100).toFixed(0)}%.`,
      `The result isn't important, since ${p} is a small number.`,
    ];
    return mkQuestion(
      "stats",
      stem,
      options,
      0,
      `A p-value estimates how likely a result like this would be from random chance alone, if the change you made didn't really do anything. It is not the probability that the ad "has no effect," and it doesn't tell you the size of the effect — small p-values usually mean you can be confident something real is going on, not that the effect itself is large or small.`
    );
  }

  function q_c4_basicvsapplied() {
    const scenarios = [
      { text: "Researchers examine whether ads and products featuring celebrity endorsements generally attract more attention and purchases, across many unrelated brands and product categories.", answer: "basic" },
      { text: 'Diet Coke\'s marketing team tests whether their ads featuring Taylor Swift attract more attention and purchases than their other ads.', answer: "applied" },
      { text: "A researcher uses eye-tracking glasses to study which steps people generally go through when making a purchase decision — do people usually look at price first, or brand name first?", answer: "basic" },
      { text: "A marketing director at Kellogg's wants to know which cereal box design causes people to be more likely to notice the non-GMO label.", answer: "applied" },
    ];
    const s = pick(scenarios);
    const stem = `Is the following best described as basic (fundamental) research or applied research? "${s.text}"`;
    const options = [
      "Basic research — it's aimed at understanding a general relationship, not one company's specific decision.",
      "Applied research — it's aimed at answering a specific, practical question for a particular company or context.",
    ];
    const correctIdx = s.answer === "basic" ? 0 : 1;
    return mkQuestion(
      "stats",
      stem,
      options,
      correctIdx,
      s.answer === "basic"
        ? "Basic research aims to understand a general relationship or mechanism, without targeting one specific company's decision — even if the topic (like celebrity endorsements) is obviously relevant to marketing."
        : "Applied research is aimed at a specific, practical decision for a particular company or context, rather than building a general theory."
    );
  }

  function q_c5_nonsignificant() {
    const p = randFloat(0.11, 0.68, 2);
    const company = pick(COMPANIES);
    const stem = `${company} tests a new email subject line against the old one and finds a small difference in open rates, but p = ${p} (not statistically significant). Which is the most appropriate interpretation?`;
    const options = [
      "This proves the new subject line has zero effect on open rates.",
      "This means the test should be thrown out entirely — a non-significant result is never informative.",
      "The evidence isn't strong enough to conclude there's a real difference — it could be that there's no real effect, a small effect, or that they simply need more data/a bigger sample to tell for sure.",
      "It means the effect is definitely real but just too small to matter practically.",
    ];
    return mkQuestion(
      "stats",
      stem,
      options,
      2,
      `A non-significant result (p = ${p}) means we can't confidently rule out "no real difference" — it is NOT proof that there is no effect. The honest conclusion is "inconclusive, possibly needs more data," not "no effect" or "definitely a real but small effect."`
    );
  }

  /* ============================================================
     (d) Random Assignment, A/B Tests & Cluster Randomization
     ============================================================ */

  function q_d1_why_random() {
    const stem = `Why is random assignment considered the "gold standard" for showing cause and effect?`;
    const options = [
      "It makes the two groups as similar as possible before the study starts, so any difference that shows up afterward can be attributed to whatever you changed between the groups.",
      "It's the cheapest and fastest type of study to run.",
      "It always produces a statistically significant result.",
      "It means you don't need a control/comparison group at all.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "Random assignment means the groups start out equal (on average) on everything else — age, habits, preferences, all of it — known or unknown. That's what lets you attribute any later difference to the one thing you changed. It has nothing to do with cost, speed, or guaranteeing a significant result."
    );
  }

  function q_d2_representative_sample_trap() {
    const stem = `Research is conducted on a very large, diverse, and nationally representative group of participants. Researchers randomly assign each participant to either a treatment group (drink caffeinated coffee) or a control group (drink a decaf placebo that tastes the same). People in the caffeine group complete an exam significantly faster than people in the control group. What can the researchers conclude?`;
    const options = [
      "They can claim the caffeine caused people to complete the exam faster.",
      "They cannot claim causation, because a study like this is always correlational.",
      "They can only claim causation because the sample was so large and representative.",
      "They cannot claim causation unless the sample includes at least 100,000 people.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "The random assignment is what licenses the causal claim here — not the sample being large, diverse, or nationally representative. A representative sample is valuable for a different reason (it helps the results generalize to more people), but it's not what makes a study causal. Even a small, non-representative study can support a causal claim if it uses random assignment."
    );
  }

  function q_d3_identify_abtest() {
    const stem = `Which of the following is an example of a true A/B test?`;
    const options = [
      "A social media platform notices users retweet articles without reading them. They add a pop-up asking users if they want to read the article first, then compare click and retweet rates from before vs. after adding the pop-up.",
      "A retailer measures the correlation between how much time users spend on the website and how much they spend.",
      "A travel site designs a blue vs. a black \"add to cart\" button; for one week, visitors are randomly assigned to see one version or the other.",
      "A travel site shows both an \"add to cart\" button and a \"buy now\" button to every single visitor at the same time.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      2,
      'Only the third option involves random assignment to two different versions at the same time — that\'s what makes it a true A/B test. The first is a before/after comparison (no random assignment, no comparison group at the same time). The second is just a correlation, not a test of anything. The fourth shows everyone the same page (both buttons) rather than randomly splitting visitors between two different versions.'
    );
  }

  function q_d4_how_abtests_work() {
    const badgeA = pick(["Best Value", "Top Rated", "Editor's Pick"]);
    const badgeB = pick(["Popular Pick", "Best Seller", "Trending Now"]);
    const stem = `On a retailer's website, two versions of a product page are tested — one badge says "${badgeA}" and the other says "${badgeB}," with everything else identical. How do large-scale online A/B tests like this typically work?`;
    const options = [
      "Each visitor is randomly assigned a number when they arrive, which determines which version they see (often reflected in a part of the page's URL) — and usually just one thing differs between the versions.",
      "Visitors are shown a menu and get to pick which version of the page they'd like to see.",
      "The company shows the new version to everyone at once, then compares this month's numbers to last month's.",
      "An employee manually decides, one visitor at a time, which version each person should see.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "Real digital A/B tests assign each visitor to a version automatically and randomly (often via a random number tied to that visit, sometimes visible in the URL), and usually change only one thing at a time so any difference in outcomes can be traced to that one change."
    );
  }

  function q_d5_cluster_rationale() {
    const scenario = pick(["tv", "store"]);
    const [plural, singular] = pick(REGIONS);
    const company = pick(COMPANIES);
    if (scenario === "tv") {
      const stem = `${company} wants to test whether a new TV ad increases sales. The problem: neighbors who live near each other and watch the same local channels would likely see the same version of the ad no matter what, so you can't randomly assign individual people to see different TV ads. What's the solution?`;
      const options = [
        `Randomly assign entire ${plural} to either "gets the new TV ad" or "gets the old ad," then compare sales across ${plural} instead of individuals.`,
        "Give up on testing the TV ad's effect entirely.",
        `Let each ${singular} choose for itself which ad to air.`,
        "Only test the new ad in the single best-performing region.",
      ];
      return mkQuestion(
        "goldstandard",
        stem,
        options,
        0,
        `When you can't randomize individuals, cluster (or "geo") randomization — randomly assigning groups like ${plural} to different versions — is the standard workaround. It preserves random assignment at the cluster level while respecting the reality that everyone in a media market sees the same TV ad.`
      );
    } else {
      const stem = `${company} wants to test a new store layout. You can randomly assign which stores get the new layout — but you obviously can't show two different layouts to two different customers shopping in the same store at the same time. What's the solution?`;
      const options = [
        "Randomly assign entire stores to either the new layout or the old layout, then compare sales across stores.",
        "Randomly assign individual customers within the same store to see different layouts simultaneously.",
        "Give up on testing the layout change.",
        "Only roll out the new layout in the single highest-traffic store.",
      ];
      return mkQuestion(
        "goldstandard",
        stem,
        options,
        0,
        "This is cluster randomization at the store level: since you can't split customers within one physical store into different layout conditions at the same time, you randomly assign whole stores instead, and compare outcomes across stores."
      );
    }
  }

  function q_d6_enough_clusters() {
    const stem = `A company's customers are all in Texas and Oklahoma. Someone suggests: randomly assign Texas to see a new TV ad and Oklahoma to keep the old one, then compare sales. Is this a good test?`;
    const options = [
      "Yes — since each state was randomly assigned to a version, this is a valid cluster-randomized experiment.",
      "No — with only 2 clusters (1 state each), the states can already differ from each other in important ways (for example, a very different % of people living in big cities), so any sales difference might just reflect those pre-existing differences rather than the ad. You'd want many smaller clusters (like zip codes) instead.",
      "No — geographic regions should never be used as clusters in an experiment.",
      "No — TV ads can never be tested with an experiment.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      1,
      "Random assignment only balances the groups on average when there are enough units being assigned. With just 2 clusters, there's no averaging out — whichever pre-existing differences Texas and Oklahoma happen to have (like urban vs. rural mix) stay entirely confounded with the ad version. Cluster randomization needs many clusters (e.g., hundreds of zip codes) to actually deliver on the promise of random assignment."
    );
  }

  function q_d7_headstart_lottery() {
    const stem = `If you wanted to know whether Head Start (an early-childhood program) CAUSES improved elementary school grades, what could you do to test this?`;
    const options = [
      "Find a group of parents who want their kids to enroll in Head Start, but only randomly select half of them (through a lottery) to actually get in. Years later, compare the grades of the randomly-selected group to the grades of the not-selected group.",
      "Analyze the correlation between Head Start enrollment and elementary school grades.",
      "Find a large group of kids whose parents enrolled them in Head Start and a large group whose parents never enrolled them, then compare grades years later.",
      "All of the above would work equally well for testing whether Head Start causes higher grades.",
    ];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "A random lottery among interested families is a natural experiment: it creates a truly random split between kids who get into the program and kids who don't, among families who were equally interested in enrolling. That removes the selection bias that would otherwise confound a simple correlation or an enrolled-vs.-not-enrolled comparison, where the families who choose (and manage) to enroll likely differ from those who don't."
    );
  }

  function q_d8_google_flights() {
    const stem = `A researcher at a flight-search website studies whether changing how flights are sorted (Design A: cheapest first; Design B: popularity/direct-flights first) changes which flights people book. Study 1: they compare bookings from before vs. after switching every user over to Design B, and find people book pricier flights after the switch. Study 2: they randomly assign users to see Design A or Design B at the same time (a true A/B test), and find people book pricier flights under Design B. Which study (or studies) support a causal conclusion?`;
    const options = ["Study 1 only", "Study 2 only", "Both studies equally", "Neither study"];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      1,
      "Study 2 is a true randomized A/B test — users are randomly split between designs at the same time, so any booking difference can be attributed to the design change. Study 1 is a before/after comparison with no random assignment and no group seeing Design A at the same time as Design B, so it's confounded with anything else that changed over that period (trends, seasonality, who happened to be searching that week)."
    );
  }

  function q_d9_airbnb() {
    const stem = `Airbnb ran an experiment: users were randomly assigned to see either a homepage with more expensive options (Group A) or a homepage with cheaper, more affordable options (Group B). Everything else on the page was identical across groups. Airbnb found that people in Group A (expensive options) were much more likely to leave the website without clicking on anything. What should they conclude?`;
    const options = ["Displaying the more expensive options caused more people to leave without clicking on anything.", "Displaying the expensive options was correlated with leaving without clicking, but likely didn't cause it.", "None of the above."];
    return mkQuestion(
      "goldstandard",
      stem,
      options,
      0,
      "Because users were randomly assigned to Group A or Group B, the two groups should have started out equivalent on average — so the difference in exit rates can be attributed to the one thing that differed: which set of options they saw. This licenses a causal claim."
    );
  }

  function q_d10_which_designs_multi() {
    const stem = `Which of the following research designs usually let you make a confident cause-and-effect claim? (Select all that apply.)`;
    const options = ["A randomized controlled experiment (RCT)", "A true A/B test", "A cluster-randomized experiment", "An observational or correlational study", "A focus group", "A case study"];
    return mkMultiQuestion(
      "goldstandard",
      stem,
      options,
      [0, 1, 2],
      "RCTs, A/B tests, and cluster-randomized experiments all rely on random assignment, which is what supports a confident causal claim. Observational/correlational studies, focus groups, and case studies can all be genuinely useful for other purposes — generating ideas, describing a sample, exploring a single case in depth — but none of them use random assignment, so none of them can rule out confounds, selection effects, or reverse causality the way an experiment can."
    );
  }

  /* ============================================================
     (e) Applied Business Scenarios
     ============================================================ */

  function q_e1_cmo_multi() {
    const stem = `You're hired as a marketing director at a company that previously only looked at ad effectiveness by correlating monthly ad spending with monthly sales. Now they want to know whether a new digital ad is more effective at increasing clicks/sales than an old one. The company advertises across many states and has many different products. Which of the following would give real causal evidence about whether the new ad works better? (Select all that apply.)`;
    const options = [
      "Randomly assign website visitors to see the new ad or the old ad (a true A/B test) and compare clicks/sales between the two groups.",
      "Randomly assign which states get the new ad vs. the old ad (cluster randomization) and compare sales across states.",
      "Randomly assign which products get promoted with the new ad vs. the old ad and compare sales of those products.",
      "Keep computing the correlation between monthly ad spending and monthly sales, just with more months of data.",
      "Ask a focus group which ad they personally find more appealing.",
    ];
    return mkMultiQuestion(
      "applied",
      stem,
      options,
      [0, 1, 2],
      "All three randomization approaches — by visitor, by state, or by product — create a real comparison group and isolate the ad's effect from everything else going on. Simply gathering more months of correlational data doesn't fix the underlying confounding problem, no matter how much data you add, and a focus group tells you what people say they prefer, not what actually changes their behavior."
    );
  }

  function q_e2_webpage() {
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

  function q_e3_after_the_fact() {
    const company = pick(COMPANIES);
    const stem = `${company} already ran a marketing campaign to all of its customers at once, with no comparison group. Now leadership wants to know its true incremental impact on sales — similar to a real branded-search case where a company only found out afterward that its "successful" campaign wasn't actually incremental. Can they cleanly figure out the true incremental impact after the fact?`;
    const options = [
      "Yes — just compare sales during the campaign to sales the month before.",
      "Not cleanly — since everyone received the campaign at the same time, there's no comparison group showing what would have happened without it. Going forward, they should build in a comparison group (or randomly hold out some customers/regions) to measure incremental impact properly.",
      "Yes — as long as revenue was higher than the campaign's cost, it was incremental.",
      "There's no way to ever measure incremental impact for any campaign.",
    ];
    return mkQuestion(
      "applied",
      stem,
      options,
      1,
      "Once a campaign has already run for everyone with no comparison group, there's no clean way to retroactively separate its effect from everything else happening at the same time. The fix is forward-looking: build a randomized comparison group (or a cluster-randomized holdout by region) into the next campaign from the start."
    );
  }

  function q_e4_pick_method() {
    const company = pick(COMPANIES);
    const stem = `${company}'s marketing director asks: "Did our new customer-service chatbot actually improve satisfaction, or would satisfaction have improved anyway?" The company can randomly route some incoming chats to the old human-only flow and some to the new chatbot flow. What should the analytics team recommend?`;
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

  /* ============================================================
     (f) Alternative Methods & When Experiments Aren't Feasible
     ============================================================ */

  function q_f1_focusgroups() {
    const stem = `A firm relies on focus groups to decide whether a new product concept will succeed. Which statement best summarizes a real limitation of focus groups?`;
    const options = [
      "Focus groups are great for generating ideas and hearing how people talk about a product, but with only a handful of participants and no random assignment, they can't tell you whether something actually caused a change in behavior.",
      "Focus groups are just as reliable as a large randomized experiment.",
      "Focus groups have no value at all and should never be used.",
      "Focus groups are ideal for precisely measuring incremental sales lift.",
    ];
    return mkQuestion(
      "altmethods",
      stem,
      options,
      0,
      "Focus groups (like observation and interviews) are useful for generating ideas and understanding how people think and talk about a product — but they aren't experiments. With a handful of participants and no random assignment, they can tell you what people say, not what actually caused a change in behavior."
    );
  }

  function q_f2_observational() {
    const stem = `Compared to a randomized experiment, what is a genuine advantage — not just a drawback — of using large-scale observational (naturally occurring) data?`;
    const options = [
      "It can offer much larger sample sizes and reflect how people actually behave in the real world, even though it's harder to draw a clean causal conclusion from it.",
      "It automatically solves the problem of confounding variables.",
      "It always produces more statistically significant results than experiments.",
      "It removes the need for any data analysis.",
    ];
    return mkQuestion(
      "altmethods",
      stem,
      options,
      0,
      "Observational data's real strength is scale and realism — it reflects how people actually behave, often at large scale and low cost. The tradeoff is the flip side of that same coin: without random assignment, confounds make a causal claim much harder to trust."
    );
  }

  function q_f3_ethics() {
    const stem = `A company wants to know whether charging very different prices to different customers (based on what each person seems willing to pay) changes their loyalty. But randomly assigning customers to unfair prices raises real ethical and legal concerns, so a true experiment isn't an option here. What's the most reasonable path forward?`;
    const options = [
      "Run the experiment anyway, since the business insight is valuable enough to justify it.",
      "Rely on careful observational/correlational evidence instead, while staying appropriately cautious about how confident the causal conclusion can be, since it isn't backed by a true experiment.",
      "There's no way to learn anything useful without running a true experiment.",
      "Assume any correlation found this way is definitely causal, since collecting new data would be too difficult.",
    ];
    return mkQuestion(
      "altmethods",
      stem,
      options,
      1,
      "When a true experiment isn't ethical or practical, researchers still gather the best evidence they can — usually observational or correlational — but stay appropriately humble about how strong a causal claim it supports, rather than either giving up entirely or overstating their confidence."
    );
  }

  function q_f4_sparsedata() {
    const company = pick(["Maple & Co (a tiny online candle shop)", "The Corner Bookshop (a small independent online bookstore)", "Hearth Goods (a boutique home-decor store)", "Little Loom (a small online yarn/craft store)"]);
    const orders = randInt(2, 6);
    const stem = `${company} gets only about ${orders} orders per week. The owner wants to A/B test a new homepage design. Why is a traditional A/B test poorly suited here, and what's a more sensible alternative?`;
    const options = [
      `With so few orders, it would take an extremely long time to collect enough data to tell a real difference from random noise — better alternatives include qualitative usability testing, expert/heuristic review, making bigger and more obviously impactful changes, or watching a much longer time window.`,
      "It's not actually a problem — a test works exactly the same regardless of how much traffic a site gets.",
      "The owner should still run a formal A/B test but only look at the results after a single day.",
      "The only fix is to randomly assign individual customers to conditions with a coin flip performed by the owner personally.",
    ];
    return mkQuestion(
      "altmethods",
      stem,
      options,
      0,
      `With only ${orders} orders/week, it could take months or years to collect enough data to tell a real effect apart from ordinary week-to-week noise. For very low-traffic situations, better options include qualitative/usability testing, expert heuristic evaluation, making bigger and more obviously impactful changes, or accepting a much longer observation window — rather than relying on a formal test that doesn't have enough data to work.`
    );
  }

  /* ============================================================
     registry
     ============================================================ */

  const CONCEPTS = [
    {
      id: "causation",
      label: "Correlation, Causation, Confounds & Selection Effects",
      letter: "a",
      generators: [q_a1_correlation_type, q_a2_confound, q_a3_selfselection, q_a4_dogownership_multi, q_a5_headstart_multi, q_a6_anyofabove, q_a7_confound_multi, q_a8_whatmatters],
    },
    {
      id: "incrementality",
      label: "Incrementality",
      letter: "b",
      generators: [q_b1_sponsored_search_trap, q_b2_newtonbaby, q_b3_freetrial, q_b4_packers_email, q_b5_comparisongroup, q_b6_doublecounting],
    },
    {
      id: "stats",
      label: "P-values & Research Basics",
      letter: "c",
      generators: [q_c1_coinflip, q_c2_samplesize, q_c3_pvalue_meaning, q_c4_basicvsapplied, q_c5_nonsignificant],
    },
    {
      id: "goldstandard",
      label: "Random Assignment, A/B Tests & Cluster Randomization",
      letter: "d",
      generators: [q_d1_why_random, q_d2_representative_sample_trap, q_d3_identify_abtest, q_d4_how_abtests_work, q_d5_cluster_rationale, q_d6_enough_clusters, q_d7_headstart_lottery, q_d8_google_flights, q_d9_airbnb, q_d10_which_designs_multi],
    },
    {
      id: "applied",
      label: "Applied Business Scenarios",
      letter: "e",
      generators: [q_e1_cmo_multi, q_e2_webpage, q_e3_after_the_fact, q_e4_pick_method],
    },
    {
      id: "altmethods",
      label: "Alternative Methods & When Experiments Aren't Feasible",
      letter: "f",
      generators: [q_f1_focusgroups, q_f2_observational, q_f3_ethics, q_f4_sparsedata],
    },
  ];

  /* 16-question blueprint, weighted by how much lecture time each area
     actually gets: (d) random assignment/A-B tests/cluster randomization
     is the single biggest topic in the deck, followed closely by (a) and
     (b); (c), (e), (f) get lighter, focused coverage. */
  const BLUEPRINT = [
    { concept: "causation", count: 3 },
    { concept: "incrementality", count: 3 },
    { concept: "stats", count: 2 },
    { concept: "goldstandard", count: 4 },
    { concept: "applied", count: 2 },
    { concept: "altmethods", count: 2 },
  ];

  function conceptById(id) {
    return CONCEPTS.find((c) => c.id === id);
  }

  function generate(conceptId, avoidGenIndex, excludeIndices) {
    const c = conceptById(conceptId);
    if (!c) throw new Error("Unknown concept: " + conceptId);
    const totalIdx = c.generators.map((_, i) => i);
    let pool = excludeIndices && excludeIndices.length ? totalIdx.filter((i) => !excludeIndices.includes(i)) : totalIdx.slice();
    if (!pool.length) pool = totalIdx.slice(); // everything already answered correctly -> allow repeats again
    if (pool.length > 1 && avoidGenIndex !== undefined) {
      const filtered = pool.filter((i) => i !== avoidGenIndex);
      if (filtered.length) pool = filtered;
    }
    const idx = pool[Math.floor(Math.random() * pool.length)];
    const q = c.generators[idx]();
    q._genIndex = idx;
    return q;
  }

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
