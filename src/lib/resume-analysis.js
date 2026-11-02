// Deterministic resume analysis engine.
// Single source of truth for Resume Analyzer scores, keyword matching, and
// document metrics. Browser-safe: no DOM, no fetch, no external calls.
// The AI gateway is an optional narrative layer on top of these results —
// never a requirement for scores.

const ACTION_VERBS = new Set(
  "achieved accelerated acquired adapted addressed administered advocated analyzed assembled audited authored balanced boosted budgeted built calculated cataloged chaired championed clarified coached collaborated compiled completed composed conducted conserved consolidated constructed converted coordinated created cut debugged decreased defined delivered demonstrated designed developed devised diagnosed directed doubled drafted earned edited educated eliminated enabled engineered enhanced enlarged established evaluated exceeded executed expanded expedited facilitated generated grew guided handled halved headed identified implemented improved increased influenced initiated inspected installed instituted instructed integrated interpreted introduced invented investigated launched led leveraged maintained managed marketed mediated mentored minimized modeled modernized monitored motivated negotiated operated optimized organized overhauled oversaw partnered performed pioneered planned prepared presented prioritized produced programmed promoted proposed proved provided published raised recruited redesigned reduced reengineered refined reorganized researched resolved restructured revamped reviewed revised saved scaled scheduled secured selected shaped shipped simplified sold solved spearheaded standardized steered streamlined strengthened supervised supported surpassed surveyed sustained targeted taught tested tracked trained transformed tripled troubleshot unified upgraded validated verified won wrote".split(
    " ",
  ),
);

const SKILL_TERMS = [
  "javascript", "typescript", "react", "angular", "vue", "svelte", "node.js", "python", "java", "c#", "c++", "go", "rust", "kotlin", "swift", "php", "ruby", "scala", "sql", "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "git", "github", "gitlab", "html", "css", "sass", "tailwind", "bootstrap", "accessibility", "figma", "sketch", "tableau", "power bi", "looker", "excel", "machine learning", "deep learning", "nlp", "data analysis", "data visualization", "statistics", "rest api", "graphql", "grpc", "next.js", "redux", "jest", "playwright", "cypress", "selenium", "linux", "bash", "agile", "scrum", "kanban", "jira", "ci/cd", "devops", "microservices", "kafka", "rabbitmq", "spark", "hadoop", "airflow", "dbt", "salesforce", "sap", "hubspot",
  "communication", "leadership", "project management", "product management", "stakeholder management", "time management", "problem solving", "critical thinking", "teamwork", "mentoring", "coaching", "presentation", "public speaking", "negotiation", "customer service", "customer success", "sales", "marketing", "seo", "sem", "copywriting", "content strategy", "data-driven", "cross-functional", "recruitment", "onboarding", "compliance", "risk management", "budgeting", "forecasting", "financial reporting", "supply chain", "quality assurance", "documentation", "process improvement", "change management", "research",
];

const BUZZWORDS = new Set(
  "innovative strategic dynamic passionate synergy results-driven go-getter thought-leader team-player self-starter detail-oriented hard-working thinking-outside-the-box guru ninja wizard rockstar".split(
    " ",
  ),
);

const WEAK_OPENERS = [
  "responsible for", "worked on", "helped with", "assisted with", "duties included", "was involved in", "tasked with", "in charge of", "participated in", "involved in", "handled", "did work", "made sure", "tried to",
];

const SECTION_DEFS = [
  ["summary", /^(professional\s+)?(summary|profile|objective|about\s*me|career\s+summary)\b/i],
  ["experience", /^(work\s+|professional\s+|employment\s+|career\s+|relevant\s+|industry\s+)?(experience|employment|work\s+history)\b/i],
  ["education", /^(education|academic\s+(background|history|qualifications)|qualifications)\b/i],
  ["skills", /^(technical\s+|core\s+|key\s+|professional\s+)?(skills|competencies|technologies|tech\s+stack|areas\s+of\s+expertise)\b/i],
  ["projects", /^(selected\s+|personal\s+|key\s+|notable\s+)?(projects?|portfolio|side\s+projects)\b/i],
  ["certifications", /^(certifications?|licenses?|courses?|training|professional\s+development)\b/i],
  ["achievements", /^(achievements?|awards?|honors?|accomplishments|recognition)\b/i],
  ["languages", /^(languages|language\s+proficiency)\b/i],
];

const CORE_SECTIONS = ["summary", "experience", "education", "skills"];
const EXTRA_SECTIONS = ["projects", "certifications", "achievements", "languages"];

const STOPWORDS = new Set(
  "the and for with you your our are will have this that from they their about into work working role team teams job use using can must able across within also more most other others such well only every each any all new like just make made want need help helps including include includes experience experienced years year strong excellent great good ability candidate ideal plus etc who what when where why how not has had was were been being its it's don't didn't we us i'm".split(
    " ",
  ),
);

export function normalizeText(text) {
  return ` ${String(text ?? "").toLowerCase().replace(/[^a-z0-9+#]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

function normalizeTerm(term) {
  return term.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}

function hasTerm(normalized, term) {
  return normalized.includes(` ${term} `);
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function splitSentences(text) {
  return String(text ?? "")
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function isBulletLine(line) {
  return /^(?:[•\-\*▪·–—]|\d+[.)])\s+\S/.test(line);
}

function isHeadingLine(line) {
  if (line.length > 60) return false;
  if (/[.!?]$/.test(line)) return false;
  return SECTION_DEFS.some(([, pattern]) => pattern.test(line));
}

function wordTokens(text) {
  return String(text ?? "").match(/[\p{L}\p{N}][\p{L}\p{N}'+#.\-/]*/gu) ?? [];
}

export function deriveAnalytics(text, pageCount) {
  const words = wordTokens(text);
  const normalizedWords = words.map((word) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""));
  const sentences = splitSentences(text).length;
  const normalized = normalizeText(text);
  const foundSkills = SKILL_TERMS.filter((term) => hasTerm(normalized, normalizeTerm(term)));
  const actionVerbCount = normalizedWords.filter((word) => ACTION_VERBS.has(word)).length;
  const buzzwordCount = [...BUZZWORDS].filter((word) => text.toLowerCase().includes(word)).length;
  const passiveSignals = (text.match(/\b(?:was|were|is|are|been|being)\s+(?:\w+ed|\w+en)\b/gi) ?? []).length;
  const minutes = Math.max(1, Math.ceil(words.length / 200));
  return {
    wordCount: words.length,
    pageCount,
    readingTime: `${minutes} min${minutes === 1 ? "" : "s"}`,
    actionVerbs: actionVerbCount,
    keywordCount: foundSkills.length,
    buzzwords: buzzwordCount,
    sentences,
    passiveVoice: passiveSignals === 0 ? "No clear passive signals" : `${passiveSignals} possible passive phrases`,
  };
}

export function matchJobDescription(resumeText, jobDescription) {
  const jd = String(jobDescription ?? "").trim();
  if (!jd) return null;
  const resumeNorm = normalizeText(resumeText);
  const jdNorm = normalizeText(jd);

  const keywords = [];
  const seen = new Set();
  const pushKeyword = (term) => {
    const key = normalizeTerm(term);
    if (!key || key.length < 2 || seen.has(key) || STOPWORDS.has(key)) return;
    seen.add(key);
    keywords.push(term);
  };
  SKILL_TERMS.filter((term) => hasTerm(jdNorm, normalizeTerm(term))).forEach(pushKeyword);
  // Additional repeated significant words from the job description itself.
  const jdWords = wordTokens(jd).map((word) => word.toLowerCase().replace(/[^\p{L}\p{N}+#]/gu, "")).filter(Boolean);
  const counts = new Map();
  for (const word of jdWords) {
    if (word.length < 4 || STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  [...counts.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([word]) => pushKeyword(word));

  const matched = [];
  const partial = [];
  const missing = [];
  for (const keyword of keywords) {
    const norm = normalizeTerm(keyword);
    if (hasTerm(resumeNorm, norm)) {
      matched.push(keyword);
      continue;
    }
    const tokens = norm.split(" ").filter((token) => token.length >= 3 && !STOPWORDS.has(token));
    if (tokens.length > 1 && tokens.every((token) => hasTerm(resumeNorm, token))) partial.push(keyword);
    else missing.push(keyword);
  }
  const total = matched.length + partial.length + missing.length;
  const score = total === 0 ? null : Math.round(((matched.length + 0.5 * partial.length) / total) * 100);
  return {
    available: total > 0,
    score,
    label: score === null ? null : bandLabel(score),
    explanation:
      total === 0
        ? "No recognizable role keywords were found in this job description."
        : `${matched.length} of ${total} job keywords appear in your resume, ${partial.length} appear in a related form, and ${missing.length} are missing. Score = (matched + half of partial matches) ÷ total keywords.`,
    matched,
    partial,
    missing,
  };
}

function bandLabel(score) {
  if (typeof score !== "number") return "Not available";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 55) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Poor";
}

export function analyzeResumeText({ fileName, text, pageCount = null }) {
  const raw = String(text ?? "");
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const words = wordTokens(raw);
  const wordCount = words.length;
  const sentences = splitSentences(raw);
  const sentenceCount = Math.max(1, sentences.length);
  const normalized = normalizeText(raw);

  const presentSections = [];
  const missingSections = [];
  for (const [key, pattern] of SECTION_DEFS) {
    const found = lines.some((line) => isHeadingLine(line) && pattern.test(line));
    (found ? presentSections : missingSections).push(key);
  }

  const bullets = lines.filter(isBulletLine);
  const bulletBodies = bullets.map((line) => line.replace(/^(?:[•\-\*▪·–—]|\d+[.)])\s+/, ""));
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/.test(raw);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(raw);
  const hasLinks = /linkedin\.com|github\.com|gitlab\.com|portfolio/i.test(raw);
  const yearStripped = (line) => line.replace(/\b(?:19|20)\d{2}\b/g, "");
  const quantifiedBullets = bulletBodies.filter((line) => /\d/.test(yearStripped(line))).length;
  const bulletOrSentenceUnits = bulletBodies.length >= 3 ? bulletBodies : sentences.map((sentence) => sentence.replace(/^(?:[•\-\*▪·–—]|\d+[.)])\s+/, ""));
  const actionVerbStarts = bulletOrSentenceUnits.filter((line) => {
    const firstWord = (line.match(/[\p{L}]+/u) ?? [""])[0].toLowerCase();
    return ACTION_VERBS.has(firstWord);
  }).length;
  const weakOpenerLines = bulletOrSentenceUnits.filter((line) => WEAK_OPENERS.some((opener) => line.toLowerCase().startsWith(opener))).length;
  const passiveCount = (raw.match(/\b(?:was|were|is|are|been|being)\s+(?:\w+ed|\w+en)\b/gi) ?? []).length;
  const buzzwordHits = [...BUZZWORDS].filter((word) => normalized.includes(` ${normalizeTerm(word)} `)).length;
  const longSentences = sentences.filter((sentence) => (wordTokens(sentence).length ?? 0) > 25).length;
  const avgSentenceWords = wordCount / sentenceCount;
  const longWordRatio = words.filter((word) => word.length > 12).length / Math.max(1, wordCount);
  const skillsFound = SKILL_TERMS.filter((term) => hasTerm(normalized, normalizeTerm(term)));

  // --- ATS compatibility (out of 100, each check explicit) ---
  const atsChecks = [
    ["Email address", hasEmail, 20],
    ["Phone number", hasPhone, 10],
    ["Experience section", presentSections.includes("experience"), 15],
    ["Education section", presentSections.includes("education"), 10],
    ["Skills section", presentSections.includes("skills"), 15],
    ["Summary section", presentSections.includes("summary"), 10],
    ["Bullet formatting", bullets.length >= 8 ? true : bullets.length >= 3 ? "partial" : false, 20],
  ];
  const ats = clamp(atsChecks.reduce((total, [, value, points]) => total + (value === true ? points : value === "partial" ? points / 2 : 0), 0));
  const atsMetric = `${hasEmail ? "Email found" : "No email"} · ${hasPhone ? "phone found" : "no phone"} · ${presentSections.length}/${SECTION_DEFS.length} standard sections · ${bullets.length} bullet points`;

  // --- Writing quality (grammar proxies from the text itself) ---
  const passiveRatio = passiveCount / sentenceCount;
  const longSentenceRatio = longSentences / sentenceCount;
  const grammar = clamp(100 - clamp(passiveRatio * 250, 0, 30) - Math.min(45, buzzwordHits * 15) - clamp(longSentenceRatio * 200, 0, 25));
  const grammarMetric = `${passiveCount} passive phrases · ${buzzwordHits} buzzwords · ${Math.round(longSentenceRatio * 100)}% long sentences`;

  // --- Impact (quantified achievements + strong verb openings) ---
  const quantifiedRatio = quantifiedBullets / Math.max(1, bulletOrSentenceUnits.length);
  const verbShare = actionVerbStarts / Math.max(1, bulletOrSentenceUnits.length);
  const impact = clamp(0.6 * clamp(quantifiedRatio / 0.5) + 0.4 * verbShare * 100 - Math.min(24, weakOpenerLines * 8));
  const impactMetric = `${quantifiedBullets} quantified bullets (${Math.round(quantifiedRatio * 100)}%) · ${Math.round(verbShare * 100)}% start with action verbs`;

  // --- Readability (sentence length + word complexity) ---
  const sentenceLengthDeviation = avgSentenceWords < 11 ? (11 - avgSentenceWords) / 11 : avgSentenceWords > 22 ? (avgSentenceWords - 22) / 22 : 0;
  const readability = clamp(100 - clamp(sentenceLengthDeviation, 0, 1) * 70 - clamp(longWordRatio * 600, 0, 40));
  const readabilityMetric = `${Math.round(avgSentenceWords)} words/sentence · ${Math.round(longWordRatio * 100)}% long words · ${words.length ? "" : ""}readable length`;

  // --- Structure completeness ---
  const corePoints = CORE_SECTIONS.filter((key) => presentSections.includes(key)).length * 15;
  const extraPoints = EXTRA_SECTIONS.filter((key) => presentSections.includes(key)).length * 7;
  const lengthPoints = wordCount >= 300 && wordCount <= 1500 ? 19 : (wordCount >= 150 && wordCount < 300) || (wordCount > 1500 && wordCount <= 2000) ? 10 : 0;
  const structure = clamp(corePoints + extraPoints + lengthPoints);
  const structureMetric = `${presentSections.length} sections detected · ${wordCount.toLocaleString()} words`;

  const overallScore = Math.round(0.3 * ats + 0.2 * grammar + 0.25 * impact + 0.15 * readability + 0.1 * structure);

  const scored = [
    ["ATS compatibility", ats, atsMetric],
    ["Writing quality", grammar, grammarMetric],
    ["Impact", impact, impactMetric],
    ["Readability", readability, readabilityMetric],
  ].sort((a, b) => b[1] - a[1]);
  const strengthsText = scored.filter(([, value]) => value >= 60).slice(0, 2).map(([label]) => label.toLowerCase());
  const weakest = [...scored].sort((a, b) => a[1] - b[1])[0];
  const gaps = [];
  if (weakOpenerLines > 0) gaps.push(`${weakOpenerLines} bullet${weakOpenerLines === 1 ? "" : "s"} open with weak phrasing`);
  if (quantifiedRatio < 0.3 && bulletOrSentenceUnits.length >= 3) gaps.push(`${bulletOrSentenceUnits.length - quantifiedBullets} bullet${bulletOrSentenceUnits.length - quantifiedBullets === 1 ? "" : "s"} lack measurable results`);
  const missingCore = CORE_SECTIONS.filter((key) => missingSections.includes(key));
  if (missingCore.length) gaps.push(`no ${missingCore.join(", ")} section${missingCore.length === 1 ? "" : "s"} found`);
  const explanation = `${overallScore >= 55 ? "Solid" : "Foundational"} resume: strongest areas are ${strengthsText.join(" and ") || "limited"}. Weakest area is ${weakest[0].toLowerCase()} (${Math.round(weakest[1])}/100)${gaps.length ? ` — ${gaps.slice(0, 2).join("; ")}` : ""}. All scores are calculated from the actual text of this resume.`;

  const strengths = [];
  if (hasEmail) strengths.push("Contact email included");
  if (hasPhone) strengths.push("Phone number included");
  if (hasLinks) strengths.push("Professional link (LinkedIn/GitHub/portfolio) included");
  if (quantifiedBullets >= 5) strengths.push(`${quantifiedBullets} bullets contain measurable results`);
  if (verbShare >= 0.5) strengths.push(`${Math.round(verbShare * 100)}% of bullets start with action verbs`);
  if (presentSections.length >= 5) strengths.push(`${presentSections.length} standard resume sections detected`);
  if (skillsFound.length >= 10) strengths.push(`${skillsFound.length} recognized skills identified`);
  if (buzzwordHits === 0) strengths.push("No filler buzzwords detected");
  if (avgSentenceWords >= 11 && avgSentenceWords <= 22) strengths.push("Comfortable sentence length for recruiters");
  if (passiveCount === 0) strengths.push("No passive-voice signals detected");
  if (wordCount >= 300 && wordCount <= 1500) strengths.push("Length suits a 1–2 page resume");

  const issues = [];
  const addIssue = (id, title, description, priority) => issues.push({ id, title, description, priority });
  if (!hasEmail) addIssue("contact-email", "No email address detected", "Recruiters and ATS parsers expect a clearly visible email address near the top of the resume.", "High");
  if (!hasPhone) addIssue("contact-phone", "No phone number detected", "Add a phone number so recruiters can reach you without leaving the application.", "Medium");
  for (const key of missingSections) {
    if (CORE_SECTIONS.includes(key)) addIssue(`missing-${key}`, `No ${key} section found`, `A standard "${key.charAt(0).toUpperCase() + key.slice(1)}" heading was not detected; ATS systems look for these conventional section titles.`, key === "summary" ? "Medium" : "High");
    else addIssue(`missing-${key}`, `No ${key} section found`, `An optional "${key}" heading was not detected. Adding it can strengthen the resume for relevant roles.`, "Low");
  }
  if (weakOpenerLines > 0) addIssue("weak-openers", `${weakOpenerLines} bullet${weakOpenerLines === 1 ? "" : "s"} start with weak phrasing`, "Openers like \"Responsible for\" or \"Worked on\" bury the achievement. Lead with a strong action verb instead.", "High");
  if (quantifiedRatio < 0.3 && bulletOrSentenceUnits.length >= 3) addIssue("low-quantified", "Few quantified achievements", `Only ${quantifiedBullets} of ${bulletOrSentenceUnits.length} bullets contain a measurable result. Numbers (%, $, counts, timeframes) make impact concrete.`, "High");
  if (buzzwordHits > 0) addIssue("buzzwords", `${buzzwordHits} filler buzzword${buzzwordHits === 1 ? "" : "s"} detected`, "Terms like \"results-driven\" or \"team-player\" say little on their own; replace them with evidence.", "Low");
  if (passiveRatio > 0.1) addIssue("passive-voice", `${passiveCount} possible passive phrases`, "Passive constructions hide who did the work. Prefer active sentences starting with a verb.", "Medium");
  if (avgSentenceWords > 25) addIssue("long-sentences", "Long sentences", `Sentences average ${Math.round(avgSentenceWords)} words. Aim for 11–22 words so content scans quickly.`, "Medium");
  if (wordCount < 250) addIssue("too-short", "Resume is very short", `Only ${wordCount} words were detected. A one-page resume typically has 350–700 words of content.`, "High");
  if (wordCount > 1800) addIssue("too-long", "Resume is very long", `${wordCount.toLocaleString()} words were detected — likely more than 2 pages. Trim older or less relevant content.`, "Medium");
  if (!hasLinks) addIssue("no-links", "No professional links detected", "A LinkedIn, GitHub, or portfolio URL gives recruiters a fast way to verify your work.", "Low");
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  issues.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const recommendationTemplates = {
    "weak-openers": { title: "Rewrite weak bullet openers with action verbs", explanation: "Every bullet should start with a verb like Led, Built, Automated, or Reduced so achievements surface immediately.", suggestedImprovement: "Replace phrases like \"Responsible for\" or \"Worked on\" with a strong verb plus the result you delivered." },
    "low-quantified": { title: "Add measurable results to your bullets", explanation: "Quantified outcomes are the strongest proof of impact and help both ATS ranking and recruiter trust.", suggestedImprovement: "Use the pattern: action verb + what you did + measurable result (for example: reduced load time 40%, supported 30 clients, cut costs $12K)." },
    "contact-email": { title: "Add a professional email address", explanation: "ATS parsers and recruiters look for a contact email in the header area of the resume.", suggestedImprovement: "Place your name, email, and phone on the first lines of the document." },
    "missing-experience": { title: "Add a clearly labeled Experience section", explanation: "The word \"Experience\" (or \"Work History\") helps ATS systems map your roles correctly.", suggestedImprovement: "Group roles under a heading that starts with \"Experience\" and include company, title, and dates for each." },
    "missing-education": { title: "Add an Education section", explanation: "Many ATS filters require a conventional Education heading to record your credentials.", suggestedImprovement: "Add a heading starting with \"Education\" and list your degree, institution, and year." },
    "missing-skills": { title: "Add a Skills section with a clear heading", explanation: "A dedicated skills list improves keyword matching for automated screens.", suggestedImprovement: "Add a heading starting with \"Skills\" and group 8–15 relevant skills, mixing tools and soft skills." },
    "missing-summary": { title: "Add a short professional summary", explanation: "A 2–3 line summary at the top tells recruiters your target role and strongest proof points.", suggestedImprovement: "Open with your title, years of experience, and one headline achievement." },
    "buzzwords": { title: "Replace filler buzzwords with evidence", explanation: "Buzzwords take space without adding information recruiters can verify.", suggestedImprovement: "Swap phrases like \"results-driven\" for a concrete achievement that demonstrates the trait." },
    "passive-voice": { title: "Convert passive phrases to active voice", explanation: "Active sentences make ownership of results clear and read faster.", suggestedImprovement: "Rewrite \"was responsible for managing\" as \"Managed\"." },
    "long-sentences": { title: "Shorten long sentences", explanation: "Recruiters scan resumes in seconds; short sentences keep key facts visible.", suggestedImprovement: "Split any sentence over 25 words into two, and lead each with its main point." },
    "too-short": { title: "Expand your resume content", explanation: "Thin resumes give ATS and recruiters too little evidence to evaluate you.", suggestedImprovement: "Add recent roles, projects, and skills with quantified outcomes until you reach 350–700 words." },
    "too-long": { title: "Trim less relevant content", explanation: "Long resumes dilute your strongest, most recent achievements.", suggestedImprovement: "Cut roles older than 10–15 years and merge duplicated bullets." },
    "no-links": { title: "Add a professional link", explanation: "A LinkedIn, GitHub, or portfolio link adds credibility at zero cost.", suggestedImprovement: "Place the URL on the same line as your contact details." },
    "missing-projects": { title: "Add a Projects section", explanation: "Projects demonstrate applied skills, especially when work experience is limited.", suggestedImprovement: "List 2–4 projects with the problem, your role, stack, and an outcome." },
    "missing-certifications": { title: "Add a Certifications section", explanation: "Certifications are easy keyword wins and signal current learning.", suggestedImprovement: "Add a heading starting with \"Certifications\" and list title, issuer, and year." },
  };
  const recommendations = issues
    .map((issue) => {
      const template = recommendationTemplates[issue.id];
      if (!template) return null;
      return { id: `rec-${issue.id}`, title: template.title, explanation: template.explanation, suggestedImprovement: template.suggestedImprovement, priority: issue.priority };
    })
    .filter(Boolean)
    .slice(0, 5);

  return {
    fileName: fileName ?? "",
    analyzedAt: new Date().toISOString(),
    overallScore,
    explanation,
    scores: { ats, grammar, impact, readability, atsMetric, grammarMetric, impactMetric, readabilityMetric },
    keywords: { hasJobDescription: false, matched: [], partial: [], missing: [] },
    radar: [
      { label: "ATS", value: Math.round(ats) },
      { label: "Writing", value: Math.round(grammar) },
      { label: "Impact", value: Math.round(impact) },
      { label: "Readability", value: Math.round(readability) },
      { label: "Skills", value: Math.round(clamp(skillsFound.length * 8)) },
      { label: "Structure", value: Math.round(structure) },
    ],
    issues,
    recommendations,
    jobMatch: { available: false, score: null, label: null, explanation: null },
    analytics: deriveAnalytics(raw, pageCount),
    sections: { present: presentSections, missing: missingSections },
    skills: skillsFound,
    strengths: strengths.slice(0, 6),
  };
}
