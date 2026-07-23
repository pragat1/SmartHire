import { useMemo, useState } from "react";
import {
  Radar,
  Target,
  Building2,
  Rocket,
  Landmark,
  Cpu,
  Wrench,
  Flame,
  Check,
  X as XIcon,
  AlertTriangle,
  BarChart3,
  Timer,
  Type as TypeIcon,
  Sparkles,
  Search,
  Plus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Text helpers                                                       */
/* ------------------------------------------------------------------ */
const ACTION_VERBS = new Set([
  "built","designed","developed","engineered","led","launched","shipped","optimized","reduced",
  "increased","architected","implemented","migrated","scaled","automated","deployed","refactored",
  "spearheaded","delivered","created","orchestrated","integrated","improved","streamlined","owned",
  "drove","accelerated","mentored","authored","analyzed","modeled","prototyped","released",
]);
const BUZZWORDS = new Set([
  "synergy","rockstar","ninja","guru","proactive","team player","hard worker","results-driven",
  "detail-oriented","go-getter","self-starter","think outside the box","hit the ground running",
  "value-add","best of breed","leverage","utilize","stakeholder","dynamic",
]);
const STOP = new Set([
  "the","and","for","with","that","this","from","have","will","your","you","are","was","were","been","being",
  "our","their","them","they","its","it's","into","onto","over","under","using","use","used","across","per",
  "of","in","on","at","to","by","as","is","be","or","an","a","we","us","if","then","than","so","not","no","yes",
  "job","role","team","work","experience","required","preferred","must","should","ability","strong","excellent","good",
  "candidate","looking","seeking","include","including","etc","plus","new","other","one","two","three",
]);

function tokens(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\- ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
function normalize(t) {
  return t.toLowerCase().replace(/[^a-z0-9+#.]/g, "");
}
function resumeText(r) {
  return [
    r.name, r.role, r.summary, r.location,
    ...r.skills,
    ...r.projects.flatMap((p) => [p.name, p.description, ...p.tech]),
    ...r.experience.flatMap((e) => [e.company, e.role, e.period, ...e.bullets]),
    ...r.certifications,
    ...r.achievements,
    ...r.education.flatMap((e) => [e.school, e.degree]),
  ].join(" ");
}
function words(r) {
  return tokens(resumeText(r));
}

/* ------------------------------------------------------------------ */
/*  Section shell                                                      */
/* ------------------------------------------------------------------ */
function Card({
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  1. ATS Keyword Heatmap                                             */
/* ------------------------------------------------------------------ */
const DEFAULT_JD = `We're hiring a Frontend Engineer with strong React and TypeScript skills.
You will build accessible UIs with Next.js, Tailwind, and integrate REST/GraphQL APIs.
Bonus: Node.js, Docker, CI/CD, testing (Jest / Playwright), AWS deployment, performance optimization.`;

const TECH_HINTS = [
  "react","typescript","javascript","node","node.js","next.js","nextjs","tailwind","redux","graphql",
  "rest","api","docker","kubernetes","aws","gcp","azure","ci/cd","jest","playwright","cypress","vitest",
  "python","java","go","rust","sql","postgres","mysql","mongodb","redis","kafka","rabbitmq",
  "git","github","gitlab","figma","html","css","sass","webpack","vite","express","fastapi","django",
  "flask","spring","microservices","testing","accessibility","performance","seo","ssr","ssg",
  "vercel","netlify","linux","bash","agile","scrum",
];

function extractJdKeywords(jd) {
  const toks = tokens(jd);
  const seen = new Set();
  const out = [];
  // multi-word tech first
  const lower = jd.toLowerCase();
  for (const t of TECH_HINTS) {
    if (lower.includes(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  // fallback: capitalized/tech-shaped single tokens frequency
  const freq = new Map();
  for (const t of toks) {
    if (t.length < 3 || STOP.has(t)) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  for (const [t] of ranked) {
    if (seen.has(t)) continue;
    if (out.length >= 18) break;
    if (/^[a-z0-9+#.]+$/.test(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out.slice(0, 18);
}

export function AtsHeatmap({
  resume,
  onAddSkill,
}) {
  const [jd, setJd] = useState(DEFAULT_JD);
  const analysis = useMemo(() => {
    const rTokens = new Set(words(resume).map(normalize));
    const skills = new Set(resume.skills.map((s) => normalize(s)));
    const kws = extractJdKeywords(jd);
    const rows = kws.map((k) => {
      const key = normalize(k);
      const inSkills = skills.has(key);
      const inText = rTokens.has(key) || resumeText(resume).toLowerCase().includes(k);
      return { keyword: k, found: inSkills || inText, strong: inSkills };
    });
    const overused = (() => {
      const counts = new Map();
      for (const w of words(resume)) {
        if (w.length < 4 || STOP.has(w)) continue;
        counts.set(w, (counts.get(w) ?? 0) + 1);
      }
      return [...counts.entries()]
        .filter(([, c]) => c >= 4)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([w, c]) => ({ word: w, count: c }));
    })();
    const found = rows.filter((r) => r.found).length;
    return {
      rows,
      overused,
      match: rows.length === 0 ? 0 : Math.round((found / rows.length) * 100),
    };
  }, [jd, resume]);

  const missing = analysis.rows.filter((r) => !r.found);

  return (
    <Card
      icon={<Target className="h-4 w-4" />}
      title="ATS Keyword Heatmap"
      subtitle="Paste a job description — see which keywords your resume actually hits"
    >
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-xl border border-border/60 bg-surface p-3 text-xs leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Keyword Match
        </div>
        <div className="text-lg font-bold gradient-text">{analysis.match}%</div>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full gradient-primary transition-[width] duration-700"
          style={{ width: `${analysis.match}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {analysis.rows.map((r) => (
          <span
            key={r.keyword}
            className={
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition " +
              (r.found
                ? r.strong
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-emerald-100 bg-emerald-50/60 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700")
            }
          >
            {r.found ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
            {r.keyword}
          </span>
        ))}
      </div>

      {missing.length > 0 && onAddSkill && (
        <div className="mt-4 rounded-xl border border-border/60 bg-surface/60 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Suggested skills to add
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missing.slice(0, 6).map((m) => (
              <button
                key={m.keyword}
                onClick={() => onAddSkill(m.keyword)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-white px-2 py-0.5 text-[11px] font-medium text-primary transition hover:bg-primary hover:text-white"
              >
                <Plus className="h-3 w-3" />
                {m.keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {analysis.overused.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Overused
          </span>
          {analysis.overused.map((o) => (
            <span
              key={o.word}
              className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700"
            >
              <Flame className="h-3 w-3" />
              {o.word} · {o.count}×
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Resume Strength Radar                                           */
/* ------------------------------------------------------------------ */
function scoreCategories(r) {
  const text = resumeText(r).toLowerCase();
  const has = (arr) => arr.some((k) => text.includes(k));
  const countAny = (arr) => arr.reduce((n, k) => n + (text.includes(k) ? 1 : 0), 0);

  const technical = Math.min(
    100,
    r.skills.length * 8 +
      r.projects.reduce((n, p) => n + p.tech.length, 0) * 3 +
      countAny(["react","node","typescript","python","docker","aws","sql","kubernetes"]) * 4,
  );
  const leadership = Math.min(
    100,
    (has(["led","mentored","managed","owned","spearheaded"]) ? 40 : 0) +
      r.experience.length * 15 +
      (r.role.toLowerCase().includes("lead") || r.role.toLowerCase().includes("senior") ? 25 : 0),
  );
  const projects = Math.min(100, r.projects.length * 22 + (r.projects.some((p) => p.description.length > 80) ? 20 : 0));
  const communication = Math.min(
    100,
    (r.summary.length > 60 ? 45 : r.summary.length > 20 ? 20 : 0) +
      (r.linkedin ? 15 : 0) +
      (r.portfolio ? 15 : 0) +
      (r.achievements.length > 0 ? 20 : 0),
  );
  const impact = (() => {
    const bullets = [
      r.summary,
      ...r.projects.map((p) => p.description),
      ...r.experience.flatMap((e) => e.bullets),
    ].join(" ");
    const quantified = (bullets.match(/\d+%|\d+x|\d{2,}\+|\$\d+|\d+ users|\d+ ms/gi) ?? []).length;
    return Math.min(100, quantified * 20 + (r.achievements.length * 15));
  })();
  const consistency = Math.min(
    100,
    (r.name ? 15 : 0) +
      (r.email ? 15 : 0) +
      (r.phone ? 10 : 0) +
      (r.github ? 15 : 0) +
      (r.linkedin ? 15 : 0) +
      (r.education.length ? 15 : 0) +
      (r.projects.length ? 15 : 0),
  );

  return { technical, leadership, projects, communication, impact, consistency };
}

export function ResumeRadar({ resume }) {
  const s = useMemo(() => scoreCategories(resume), [resume]);
  const cats = [
    { key: "technical", label: "Technical Skills", value: s.technical },
    { key: "leadership", label: "Leadership", value: s.leadership },
    { key: "projects", label: "Projects", value: s.projects },
    { key: "communication", label: "Communication", value: s.communication },
    { key: "impact", label: "Impact & Metrics", value: s.impact },
    { key: "consistency", label: "Profile Complete", value: s.consistency },
  ];

  // Simple radar polygon coords
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const R = 80;
  const points = cats
    .map((c, i) => {
      const angle = (Math.PI * 2 * i) / cats.length - Math.PI / 2;
      const r = (c.value / 100) * R;
      return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
    })
    .join(" ");
  const gridLevels = [0.33, 0.66, 1];

  return (
    <Card
      icon={<Radar className="h-4 w-4" />}
      title="Resume Strength Radar"
      subtitle="How balanced your resume is across the dimensions recruiters scan for"
    >
      <div className="grid gap-4 md:grid-cols-[200px_1fr] md:items-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-52 w-52">
          {gridLevels.map((g, gi) => (
            <polygon
              key={gi}
              points={cats
                .map((_, i) => {
                  const angle = (Math.PI * 2 * i) / cats.length - Math.PI / 2;
                  return `${cx + Math.cos(angle) * R * g},${cy + Math.sin(angle) * R * g}`;
                })
                .join(" ")}
              fill="none"
              stroke="hsl(220 20% 88%)"
              strokeWidth={1}
            />
          ))}
          {cats.map((_, i) => {
            const angle = (Math.PI * 2 * i) / cats.length - Math.PI / 2;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + Math.cos(angle) * R}
                y2={cy + Math.sin(angle) * R}
                stroke="hsl(220 20% 90%)"
                strokeWidth={1}
              />
            );
          })}
          <polygon
            points={points}
            fill="rgba(99,102,241,0.25)"
            stroke="rgb(99,102,241)"
            strokeWidth={2}
          />
          {cats.map((c, i) => {
            const angle = (Math.PI * 2 * i) / cats.length - Math.PI / 2;
            const r = (c.value / 100) * R;
            return (
              <circle
                key={c.key}
                cx={cx + Math.cos(angle) * r}
                cy={cy + Math.sin(angle) * r}
                r={3}
                fill="rgb(79,70,229)"
              />
            );
          })}
        </svg>
        <div className="grid grid-cols-1 gap-2">
          {cats.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-xs font-medium text-foreground/90">{c.label}</div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full gradient-primary transition-[width] duration-700"
                  style={{ width: `${c.value}%` }}
                />
              </div>
              <div className="w-8 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">
                {c.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Job Match Simulator                                             */
/* ------------------------------------------------------------------ */
const COMPANIES = [
  {
    key: "faang",
    label: "FAANG",
    icon: <Building2 className="h-4 w-4" />,
    weights: { technical: 0.35, leadership: 0.15, projects: 0.2, communication: 0.1, impact: 0.2 },
    keywords: ["system design","scale","distributed","algorithms","c++","java","python","aws","kubernetes"],
    note: "Rewards deep systems + scale signal.",
  },
  {
    key: "product",
    label: "Product Company",
    icon: <Cpu className="h-4 w-4" />,
    weights: { technical: 0.3, leadership: 0.15, projects: 0.25, communication: 0.15, impact: 0.15 },
    keywords: ["react","typescript","node","product","ownership","testing"],
    note: "Balanced full-stack + product sense.",
  },
  {
    key: "startup",
    label: "Startup",
    icon: <Rocket className="h-4 w-4" />,
    weights: { technical: 0.25, leadership: 0.15, projects: 0.3, communication: 0.15, impact: 0.15 },
    keywords: ["shipped","launched","end-to-end","full-stack","0-to-1","mvp"],
    note: "Wants shipping speed and range.",
  },
  {
    key: "mnc",
    label: "MNC",
    icon: <Landmark className="h-4 w-4" />,
    weights: { technical: 0.25, leadership: 0.2, projects: 0.15, communication: 0.2, impact: 0.2 },
    keywords: ["java","spring","sql","agile","enterprise","scrum"],
    note: "Values process + stakeholder scope.",
  },
  {
    key: "service",
    label: "Service-based",
    icon: <Wrench className="h-4 w-4" />,
    weights: { technical: 0.35, leadership: 0.1, projects: 0.2, communication: 0.2, impact: 0.15 },
    keywords: ["client","delivery","tickets","support","agile","documentation"],
    note: "Broad tech + client communication.",
  },
];

function companyScore(cats, c, r) {
  const base =
    cats.technical * c.weights.technical +
    cats.leadership * c.weights.leadership +
    cats.projects * c.weights.projects +
    cats.communication * c.weights.communication +
    cats.impact * c.weights.impact;
  const text = resumeText(r).toLowerCase();
  const hits = c.keywords.reduce((n, k) => n + (text.includes(k) ? 1 : 0), 0);
  const bonus = (hits / c.keywords.length) * 15;
  return Math.max(30, Math.min(97, Math.round(base + bonus)));
}

export function JobMatchSimulator({ resume }) {
  const cats = useMemo(() => scoreCategories(resume), [resume]);
  const rows = useMemo(
    () =>
      COMPANIES.map((c) => ({
        company: c,
        score: companyScore(cats, c, resume),
      })).sort((a, b) => b.score - a.score),
    [cats, resume],
  );

  return (
    <Card
      icon={<Building2 className="h-4 w-4" />}
      title="Job Match Simulator"
      subtitle="How your resume performs across five company archetypes"
    >
      <div className="grid gap-2">
        {rows.map(({ company, score }) => (
          <div
            key={company.key}
            className="rounded-xl border border-border/60 bg-surface/50 p-3 transition hover:border-primary/40 hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                {company.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{company.label}</div>
                  <div className="text-sm font-bold tabular-nums gradient-text">{score}%</div>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full gradient-primary transition-[width] duration-700"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground">{company.note}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Resume Analytics                                                */
/* ------------------------------------------------------------------ */
export function ResumeAnalytics({ resume }) {
  const stats = useMemo(() => {
    const ws = words(resume);
    const wordCount = ws.length;
    const readingTime = Math.max(1, Math.round(wordCount / 220));
    const actionVerbCount = ws.filter((w) => ACTION_VERBS.has(w)).length;
    const bullets = [
      ...resume.projects.map((p) => p.description),
      ...resume.experience.flatMap((e) => e.bullets),
      ...resume.achievements,
    ].filter(Boolean);
    const bulletsWithVerb = bullets.filter((b) =>
      b
        .split(/\s+/)
        .slice(0, 3)
        .some((w) => ACTION_VERBS.has(w.toLowerCase().replace(/[^a-z]/g, ""))),
    ).length;
    const actionVerbPct = bullets.length === 0 ? 0 : Math.round((bulletsWithVerb / bullets.length) * 100);
    const buzzCount = ws.filter((w) => BUZZWORDS.has(w)).length;
    const quantified = (resumeText(resume).match(/\d+%|\d+x|\d{2,}\+|\$\d+|\d+ users|\d+ ms/gi) ?? []).length;
    const grammar = Math.max(60, Math.min(99, 92 - buzzCount * 3 + Math.min(5, quantified)));
    const ats = Math.max(40, Math.min(97, 55 + Math.min(20, resume.skills.length) + Math.min(10, quantified * 2)));
    return { wordCount, readingTime, actionVerbCount, actionVerbPct, buzzCount, grammar, ats, quantified };
  }, [resume]);

  const cells = [
    { label: "Words", value: `${stats.wordCount}`, icon: <TypeIcon className="h-3.5 w-3.5" />, tone: "text-indigo-600", hint: "Aim: 400-650" },
    { label: "Reading time", value: `${stats.readingTime} min`, icon: <Timer className="h-3.5 w-3.5" />, tone: "text-sky-600" },
    { label: "ATS", value: `${stats.ats}`, icon: <BarChart3 className="h-3.5 w-3.5" />, tone: "text-emerald-600" },
    { label: "Grammar", value: `${stats.grammar}%`, icon: <Sparkles className="h-3.5 w-3.5" />, tone: "text-emerald-600" },
    { label: "Action verbs", value: `${stats.actionVerbPct}%`, icon: <Rocket className="h-3.5 w-3.5" />, tone: "text-orange-600" },
    { label: "Buzzwords", value: `${stats.buzzCount}`, icon: <Flame className="h-3.5 w-3.5" />, tone: stats.buzzCount > 2 ? "text-rose-600" : "text-emerald-600" },
  ];

  return (
    <Card
      icon={<BarChart3 className="h-4 w-4" />}
      title="Resume Analytics"
      subtitle="Live counts and quality signals recalculated on every edit"
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl border border-border/60 bg-surface/60 p-3">
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest ${c.tone}`}>
              {c.icon}
              {c.label}
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight text-foreground">{c.value}</div>
            {c.hint && <div className="text-[10px] text-muted-foreground">{c.hint}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Missing Sections                                                */
/* ------------------------------------------------------------------ */
export function MissingSectionsCard({ resume }) {
  const items = useMemo(() => {
    const list = [
      {
        label: "Professional Summary",
        ok: resume.summary.trim().length > 40,
        impact: "+6 ATS",
        note: "A 1-2 sentence pitch tuned to your target role.",
      },
      {
        label: "LinkedIn URL",
        ok: !!resume.linkedin,
        impact: "+3 ATS",
        note: "Recruiters look for this every time.",
      },
      {
        label: "GitHub / Portfolio",
        ok: !!resume.github || !!resume.portfolio,
        impact: "+5 ATS",
        note: "Proof of work matters more than words.",
      },
      {
        label: "Projects (2+)",
        ok: resume.projects.length >= 2,
        impact: "+8 ATS",
        note: "Two projects with tech + metrics unlocks stronger matches.",
      },
      {
        label: "Quantified Achievements",
        ok: /\d+%|\d+x|\d{2,}\+|\$\d+/.test(resumeText(resume)),
        impact: "+7 ATS",
        note: "Numbers signal impact. Add %, users, latency, revenue.",
      },
      {
        label: "Certifications",
        ok: resume.certifications.length > 0,
        impact: "+3 ATS",
        note: "Cloud / framework certs boost keyword density.",
      },
      {
        label: "Internships / Experience",
        ok: resume.experience.length > 0,
        impact: "+6 ATS",
        note: "Even short roles show real-world context.",
      },
    ];
    return list;
  }, [resume]);

  const missing = items.filter((i) => !i.ok);
  const done = items.filter((i) => i.ok);

  return (
    <Card
      icon={<AlertTriangle className="h-4 w-4" />}
      title="Missing Sections & Signals"
      subtitle={`${missing.length} gaps · ${done.length} looking good`}
    >
      <ul className="space-y-2">
        {missing.map((m) => (
          <li
            key={m.label}
            className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2"
          >
            <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
              <XIcon className="h-3 w-3" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{m.label}</span>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                  {m.impact}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">{m.note}</div>
            </div>
          </li>
        ))}
        {done.slice(0, 3).map((d) => (
          <li
            key={d.label}
            className="flex items-start gap-2.5 rounded-xl border border-transparent px-3 py-1.5 text-sm text-muted-foreground"
          >
            <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3 w-3" />
            </div>
            <span className="line-through">{d.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header (Phase 3 wrapper)                                   */
/* ------------------------------------------------------------------ */
export function AnalysisSectionHeader() {
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-white shadow-glow">
        <Search className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight">Analysis</div>
        <div className="text-[11px] text-muted-foreground">
          Deep-dive diagnostics on your resume — updated every edit
        </div>
      </div>
    </div>
  );
}
