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
  ChevronDown,
  ArrowRight,
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
    <div className="flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-tight">{title}</div>
          {subtitle && <div className="text-[12px] text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
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
  const [editing, setEditing] = useState(false);
  const analysis = useMemo(() => {
    const rTokens = new Set(words(resume).map(normalize));
    const skills = new Set(resume.skills.map((s) => normalize(s)));
    const full = resumeText(resume).toLowerCase();
    const kws = extractJdKeywords(jd);
    const rows = kws.map((k) => {
      const key = normalize(k);
      if (skills.has(key)) return { keyword: k, state: "matched" };
      if (rTokens.has(key) || full.includes(k)) return { keyword: k, state: "partial" };
      return { keyword: k, state: "missing" };
    });
    const matched = rows.filter((r) => r.state === "matched").length;
    const partial = rows.filter((r) => r.state === "partial").length;
    const missing = rows.filter((r) => r.state === "missing").length;
    const coverage =
      rows.length === 0 ? 0 : Math.round(((matched + partial * 0.5) / rows.length) * 100);
    return { rows, matched, partial, missing, coverage };
  }, [jd, resume]);

  const missingRows = analysis.rows.filter((r) => r.state === "missing");

  const CHIP = {
    matched: "border-emerald-200 bg-emerald-50 text-emerald-700",
    partial: "border-amber-200 bg-amber-50 text-amber-700",
    missing: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <Card
      icon={<Target className="h-4 w-4" />}
      title="ATS Keyword Coverage"
      subtitle="How well your resume mirrors the language of the role"
    >
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Overall coverage
          </div>
          <div className="text-[34px] font-bold leading-none tracking-tight">{analysis.coverage}%</div>
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full gradient-primary transition-[width] duration-700 ease-out"
              style={{ width: `${analysis.coverage}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-3 text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-emerald-500" /> Matched {analysis.matched}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-amber-500" /> Partial {analysis.partial}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-rose-500" /> Missing {analysis.missing}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {analysis.rows.map((r) => (
          <span
            key={r.keyword}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${CHIP[r.state]}`}
          >
            {r.state === "missing" ? <XIcon className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            {r.keyword}
          </span>
        ))}
      </div>

      {missingRows.length > 0 && onAddSkill && (
        <div className="mt-4 rounded-xl border border-border/60 bg-surface/60 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Top missing skills — one click to add
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missingRows.slice(0, 6).map((m) => (
              <button
                key={m.keyword}
                onClick={() => onAddSkill(m.keyword)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-card px-2 py-0.5 text-[11px] font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                <Plus className="h-3 w-3" />
                {m.keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => setEditing((e) => !e)}
          className="text-[12px] font-semibold text-primary transition hover:opacity-80"
        >
          {editing ? "Hide job description" : "Compare against a job description"}
        </button>
        {editing && (
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={4}
            className="mt-2 max-h-[150px] w-full resize-none rounded-xl border border-border/60 bg-surface p-3 text-xs leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        )}
      </div>
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

export { scoreCategories };

export function ResumeRadar({ resume }) {
  const s = useMemo(() => scoreCategories(resume), [resume]);
  const cats = [
    { key: "technical", label: "Technical", value: s.technical },
    { key: "leadership", label: "Leadership", value: s.leadership },
    { key: "projects", label: "Projects", value: s.projects },
    { key: "communication", label: "Communication", value: s.communication },
    { key: "impact", label: "Impact", value: s.impact },
    { key: "consistency", label: "Profile", value: s.consistency },
  ];
  const total = cats.reduce((n, c) => n + c.value, 0);
  const avg = Math.round(total / cats.length);

  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const R = 104;
  const pt = (i, ratio) => {
    const angle = (Math.PI * 2 * i) / cats.length - Math.PI / 2;
    return [cx + Math.cos(angle) * R * ratio, cy + Math.sin(angle) * R * ratio];
  };
  const poly = (ratios) => ratios.map((r, i) => pt(i, r).join(",")).join(" ");
  const points = poly(cats.map((c) => Math.max(c.value, 2) / 100));

  const weakest = [...cats].sort((a, b) => a.value - b.value)[0];

  return (
    <Card
      icon={<Radar className="h-4 w-4" />}
      title="Resume Strength Radar"
      subtitle="Balance across the six dimensions recruiters scan"
    >
      {total === 0 ? (
        <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-border bg-surface/60 p-8 text-center">
          <div className="max-w-[260px]">
            <Radar className="mx-auto h-6 w-6 text-muted-foreground" />
            <div className="mt-3 text-sm font-semibold">Not enough resume data yet</div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Add skills, experience or a project and your strength profile will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="relative mx-auto w-full max-w-[340px]">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
              <defs>
                <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0.18" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75, 1].map((g) => (
                <polygon
                  key={g}
                  points={poly(cats.map(() => g))}
                  fill={g === 1 ? "rgba(99,102,241,0.03)" : "none"}
                  stroke="hsl(220 20% 89%)"
                  strokeWidth={1}
                />
              ))}
              {cats.map((c, i) => {
                const [x, y] = pt(i, 1);
                const [lx, ly] = pt(i, 1.22);
                return (
                  <g key={c.key}>
                    <line x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(220 20% 92%)" strokeWidth={1} />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-muted-foreground"
                      style={{ fontSize: 11, fontWeight: 600 }}
                    >
                      {c.label}
                    </text>
                    <text
                      x={lx}
                      y={ly + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground"
                      style={{ fontSize: 11, fontWeight: 700 }}
                    >
                      {c.value}
                    </text>
                  </g>
                );
              })}
              <polygon
                points={points}
                fill="url(#radarFill)"
                stroke="rgb(79,70,229)"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {cats.map((c, i) => {
                const [x, y] = pt(i, Math.max(c.value, 2) / 100);
                return <circle key={c.key} cx={x} cy={y} r={3.5} fill="rgb(79,70,229)" />;
              })}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-surface/60 px-3 py-2">
            <span className="text-[12px] text-muted-foreground">
              Balance score <span className="font-bold text-foreground">{avg}/100</span>
            </span>
            <span className="text-[12px] text-muted-foreground">
              Weakest area:{" "}
              <span className="font-semibold text-rose-600">
                {weakest.label} ({weakest.value})
              </span>
            </span>
          </div>
        </div>
      )}
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

function toneFor(score) {
  if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700" };
  if (score >= 65) return { bar: "bg-sky-500", text: "text-sky-600", chip: "bg-sky-50 text-sky-700" };
  if (score >= 50) return { bar: "bg-orange-500", text: "text-orange-600", chip: "bg-orange-50 text-orange-700" };
  return { bar: "bg-rose-500", text: "text-rose-600", chip: "bg-rose-50 text-rose-700" };
}

const CAT_LABEL = {
  technical: "Technical depth",
  leadership: "Leadership signal",
  projects: "Project portfolio",
  communication: "Communication & profile",
  impact: "Quantified impact",
};

export function JobMatchSimulator({ resume }) {
  const cats = useMemo(() => scoreCategories(resume), [resume]);
  const [open, setOpen] = useState(null);
  const rows = useMemo(
    () =>
      COMPANIES.map((c) => {
        const score = companyScore(cats, c, resume);
        const ranked = Object.keys(c.weights)
          .map((k) => ({ key: k, value: cats[k] ?? 0, weight: c.weights[k] }))
          .sort((a, b) => b.value * b.weight - a.value * a.weight);
        const strength = ranked[0];
        const weakness = ranked[ranked.length - 1];
        const missingKw = c.keywords.filter((k) => !resumeText(resume).toLowerCase().includes(k)).slice(0, 3);
        return {
          company: c,
          score,
          strength,
          weakness,
          missingKw,
          interview: Math.max(5, Math.min(85, Math.round((score - 40) * 1.35))),
        };
      }).sort((a, b) => b.score - a.score),
    [cats, resume],
  );

  return (
    <Card
      icon={<Building2 className="h-4 w-4" />}
      title="Job Match Simulator"
      subtitle="Match strength and estimated interview probability by company type"
    >
      <div className="grid flex-1 content-start gap-2">
        {rows.map(({ company, score, interview, strength, weakness, missingKw }) => {
          const t = toneFor(score);
          const expanded = open === company.key;
          return (
            <div
              key={company.key}
              className="rounded-xl border border-border/60 bg-surface/50 transition hover:border-primary/40 hover:bg-card"
            >
              <button
                onClick={() => setOpen(expanded ? null : company.key)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  {company.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{company.label}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold tabular-nums ${t.text}`}>{score}%</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/60">
                    <div
                      className={`h-full rounded-full ${t.bar} transition-[width] duration-700`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{company.note}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.chip}`}>
                      ~{interview}% interview odds
                    </span>
                  </div>
                </div>
              </button>
              {expanded && (
                <div className="grid gap-1.5 border-t border-border/60 px-3 py-2.5 text-[11.5px] leading-relaxed">
                  <div>
                    <span className="font-semibold text-emerald-700">Strength: </span>
                    <span className="text-muted-foreground">
                      {CAT_LABEL[strength.key]} ({strength.value}/100)
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-rose-700">Weakness: </span>
                    <span className="text-muted-foreground">
                      {CAT_LABEL[weakness.key]} ({weakness.value}/100)
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Improve: </span>
                    <span className="text-muted-foreground">
                      {missingKw.length
                        ? `Work ${missingKw.join(", ")} into your bullets and skills.`
                        : `Deepen ${CAT_LABEL[weakness.key].toLowerCase()} with one more quantified example.`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
    const readingSec = Math.max(10, Math.round((wordCount / 220) * 60));
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
    const sectionsTotal = 8;
    const sectionsDone = [
      !!resume.summary?.trim(),
      resume.skills.length > 0,
      resume.experience.length > 0,
      resume.projects.length > 0,
      resume.education.length > 0,
      resume.certifications.length > 0,
      resume.achievements.length > 0,
      !!(resume.linkedin || resume.github || resume.portfolio),
    ].filter(Boolean).length;
    const uniqueTech = new Set(
      ws.filter((w) => TECH_HINTS.includes(w)),
    ).size;
    const keywordDensity = wordCount === 0 ? 0 : Math.round((uniqueTech / TECH_HINTS.length) * 100);
    const pages = Math.max(0.5, Math.round((wordCount / 500) * 10) / 10);
    return { wordCount, readingSec, actionVerbPct, buzzCount, sectionsDone, sectionsTotal, keywordDensity, pages };
  }, [resume]);

  const fmtTime = (s) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`);
  const rows = [
    { label: "Word count", value: `${stats.wordCount}`, hint: "Ideal 400–650", ok: stats.wordCount >= 400 && stats.wordCount <= 650, icon: <TypeIcon className="h-3.5 w-3.5" /> },
    { label: "Reading time", value: fmtTime(stats.readingSec), hint: "Recruiters skim in ~30s", ok: stats.readingSec <= 180, icon: <Timer className="h-3.5 w-3.5" /> },
    { label: "Sections completed", value: `${stats.sectionsDone}/${stats.sectionsTotal}`, hint: "Fill every core section", ok: stats.sectionsDone >= 6, icon: <Check className="h-3.5 w-3.5" /> },
    { label: "Action verbs", value: `${stats.actionVerbPct}%`, hint: "Bullets starting strong", ok: stats.actionVerbPct >= 70, icon: <Rocket className="h-3.5 w-3.5" /> },
    { label: "Buzzwords", value: `${stats.buzzCount}`, hint: "Keep under 3", ok: stats.buzzCount < 3, icon: <Flame className="h-3.5 w-3.5" /> },
    { label: "Keyword density", value: `${stats.keywordDensity}%`, hint: "Tech coverage vs market", ok: stats.keywordDensity >= 20, icon: <Target className="h-3.5 w-3.5" /> },
    { label: "Resume length", value: `${stats.pages} page${stats.pages === 1 ? "" : "s"}`, hint: "1 page under 8 yrs exp", ok: stats.pages <= 2, icon: <BarChart3 className="h-3.5 w-3.5" /> },
  ];

  return (
    <Card
      icon={<BarChart3 className="h-4 w-4" />}
      title="Resume Analytics"
      subtitle="Structural signals recalculated on every edit"
    >
      <ul className="flex flex-1 flex-col divide-y divide-border/60">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                r.ok ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
              }`}
            >
              {r.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold">{r.label}</div>
              <div className="truncate text-[11px] text-muted-foreground">{r.hint}</div>
            </div>
            <div
              className={`shrink-0 text-[15px] font-bold tabular-nums ${
                r.ok ? "text-foreground" : "text-orange-600"
              }`}
            >
              {r.value}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}


/* ------------------------------------------------------------------ */
/*  5. Missing Sections                                                */
/* ------------------------------------------------------------------ */
export function MissingSectionsCard({ resume, onFix }) {
  const items = useMemo(() => {
    const list = [
      {
        label: "Professional Summary",
        target: "summary",
        ok: resume.summary.trim().length > 40,
        impact: 6,
        note: "A 1–2 sentence pitch tuned to your target role — the first thing parsers read.",
      },
      {
        label: "LinkedIn URL",
        target: "personal",
        ok: !!resume.linkedin,
        impact: 3,
        note: "Recruiters look for this every time before replying.",
      },
      {
        label: "GitHub / Portfolio",
        target: "personal",
        ok: !!resume.github || !!resume.portfolio,
        impact: 5,
        note: "Proof of work matters more than adjectives.",
      },
      {
        label: "Projects (2+)",
        target: "projects",
        ok: resume.projects.length >= 2,
        impact: 8,
        note: "Two projects with tech stack + outcome unlock stronger matches.",
      },
      {
        label: "Quantified Achievements",
        target: "experience",
        ok: /\d+%|\d+x|\d{2,}\+|\$\d+/.test(resumeText(resume)),
        impact: 7,
        note: "Numbers signal impact. Add %, users, latency or revenue.",
      },
      {
        label: "Certifications",
        target: "certifications",
        ok: resume.certifications.length > 0,
        impact: 3,
        note: "Cloud / framework certs boost keyword density.",
      },
      {
        label: "Internships / Experience",
        target: "experience",
        ok: resume.experience.length > 0,
        impact: 6,
        note: "Even short roles show real-world context.",
      },
    ];
    return list;
  }, [resume]);

  const missing = items.filter((i) => !i.ok).sort((a, b) => b.impact - a.impact);
  const done = items.filter((i) => i.ok);
  const potential = missing.reduce((n, m) => n + m.impact, 0);

  return (
    <Card
      icon={<AlertTriangle className="h-4 w-4" />}
      title="What to fix first"
      subtitle={
        missing.length === 0
          ? "Every core section is complete"
          : `${missing.length} gaps worth up to +${potential} ATS points`
      }
    >
      {missing.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-border bg-surface/60 p-8 text-center">
          <div className="max-w-[260px]">
            <Check className="mx-auto h-6 w-6 text-emerald-600" />
            <div className="mt-3 text-sm font-semibold">All core sections complete</div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Keep refining wording and metrics to push your score higher.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {missing.map((m) => (
            <li
              key={m.label}
              className="group flex flex-col gap-2 rounded-xl border border-border/70 bg-surface/50 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13.5px] font-semibold leading-snug">{m.label}</span>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  +{m.impact} ATS
                </span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">{m.note}</p>
              <button
                onClick={() => onFix?.(m)}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-primary/30 bg-card px-2.5 py-1 text-[12px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Fix <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {done.map((d) => (
            <span
              key={d.label}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
            >
              <Check className="h-3 w-3" /> {d.label}
            </span>
          ))}
        </div>
      )}
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

/* ------------------------------------------------------------------ */
/*  Actionable AI recommendations                                      */
/* ------------------------------------------------------------------ */
export function buildRecommendations(resume) {
  const text = resumeText(resume).toLowerCase();
  const quantified = (resumeText(resume).match(/\d+%|\d+x|\d{2,}\+|\$\d+/gi) ?? []).length;
  const ws = words(resume);
  const missingTech = TECH_HINTS.filter((t) => !text.includes(t)).slice(0, 4);
  const bullets = [
    ...resume.projects.map((p) => p.description),
    ...resume.experience.flatMap((e) => e.bullets),
  ].filter(Boolean);
  const buzz = ws.filter((w) => BUZZWORDS.has(w));

  const list = [
    {
      id: "summary",
      title: "Write a targeted professional summary",
      priority: "Critical",
      ats: 6,
      why: "Your resume has no 2–3 line summary, so ATS parsers and recruiters miss your positioning in the first scan.",
      target: "summary",
      show: (resume.summary ?? "").trim().length < 40,
    },
    {
      id: "quantify",
      title: "Quantify your achievements",
      priority: "Critical",
      ats: 8,
      why: `Only ${quantified} measurable result${quantified === 1 ? "" : "s"} detected. Add numbers — %, users, latency, revenue — so impact is provable.`,
      target: "experience",
      show: quantified < 3,
    },
    {
      id: "skills",
      title: "Add in-demand skills to your Skills section",
      priority: "High",
      ats: 5,
      why: missingTech.length
        ? `Your resume is missing common keywords such as ${missingTech.join(", ")}, which ATS filters screen for.`
        : "Broaden your skills coverage for the roles you target.",
      target: "skills",
      show: resume.skills.length < 8,
    },
    {
      id: "projects",
      title: "Add at least two strong projects",
      priority: "High",
      ats: 7,
      why: "Projects with a tech stack and outcome are the fastest way to prove hands-on ability when experience is thin.",
      target: "projects",
      show: resume.projects.length < 2,
    },
    {
      id: "verbs",
      title: "Start bullets with strong action verbs",
      priority: "Medium",
      ats: 4,
      why: "Several bullets begin with passive phrasing. Lead with verbs like Built, Reduced, Led to signal ownership.",
      target: "experience",
      show:
        bullets.length > 0 &&
        bullets.filter((b) =>
          b.split(/\s+/).slice(0, 2).some((w) => ACTION_VERBS.has(w.toLowerCase().replace(/[^a-z]/g, ""))),
        ).length /
          bullets.length <
          0.7,
    },
    {
      id: "links",
      title: "Add LinkedIn and GitHub links",
      priority: "Medium",
      ats: 3,
      why: "Recruiters check profiles before replying. Missing links reduce credibility and callback rate.",
      target: "personal",
      show: !resume.linkedin || !(resume.github || resume.portfolio),
    },
    {
      id: "buzz",
      title: "Remove filler buzzwords",
      priority: "Low",
      ats: 2,
      why: `Detected ${buzz.length} generic phrase${buzz.length === 1 ? "" : "s"} (e.g. ${buzz.slice(0, 2).join(", ") || "team player"}) that add no ATS value.`,
      target: "summary",
      show: buzz.length > 0,
    },
    {
      id: "certs",
      title: "Add a relevant certification",
      priority: "Low",
      ats: 3,
      why: "Cloud or framework certifications raise keyword density and pass more automated filters.",
      target: "certifications",
      show: resume.certifications.length === 0,
    },
  ];

  const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return list.filter((r) => r.show).sort((a, b) => order[a.priority] - order[b.priority]);
}

export function scoreExplanations(resume, score) {
  const text = resumeText(resume).toLowerCase();
  const missingTech = TECH_HINTS.filter((t) => !text.includes(t)).slice(0, 3);
  const quantified = (resumeText(resume).match(/\d+%|\d+x|\d{2,}\+|\$\d+/gi) ?? []).length;
  const ws = words(resume);
  const buzz = ws.filter((w) => BUZZWORDS.has(w)).length;
  return {
    ats:
      missingTech.length > 0
        ? `Held back by missing keywords like ${missingTech.join(", ")} and ${quantified < 3 ? "few measurable achievements" : "thin section coverage"}.`
        : "Strong keyword coverage across your target role.",
    grammar:
      buzz > 0
        ? `${buzz} filler phrase${buzz === 1 ? "" : "s"} detected — tighten wording for a cleaner read.`
        : "Clean, consistent phrasing with no filler detected.",
    impact:
      quantified < 3
        ? `Only ${quantified} quantified result${quantified === 1 ? "" : "s"}. Add numbers to your top bullets.`
        : "Good use of metrics to prove outcomes.",
    readability:
      ws.length > 700
        ? "Resume runs long — trim to keep recruiters skimming to the end."
        : ws.length < 250
          ? "Too sparse — add detail to experience and projects."
          : "Length and structure are easy to skim.",
    overall:
      typeof score?.overall === "number"
        ? `Overall score reflects ATS ${score.ats}, grammar ${score.grammar} and impact ${score.impact}.`
        : "Run an analysis to generate your score.",
  };
}

/* ------------------------------------------------------------------ */
/*  Your resume at a glance                                            */
/* ------------------------------------------------------------------ */
export function buildGlanceSummary(resume, score) {
  const recs = buildRecommendations(resume);
  const ats = typeof score?.ats === "number" ? score.ats : null;
  const strengths = [];
  if ((score?.grammar ?? 0) >= 70) strengths.push("clean grammar");
  if (resume.skills.length >= 8) strengths.push("solid skills coverage");
  if (resume.experience.length > 0) strengths.push("real work experience");
  if (resume.projects.length >= 2) strengths.push("a strong project section");

  const topFixes = recs.slice(0, 3).map((r) => r.title.toLowerCase());
  const gain = recs.slice(0, 3).reduce((n, r) => n + r.ats, 0);
  const projected = ats === null ? null : Math.min(96, ats + gain + 8);

  const parts = [];
  parts.push(
    strengths.length
      ? `Your resume has ${strengths.slice(0, 2).join(" and ")}`
      : "Your resume is still early",
  );
  parts.push(
    topFixes.length
      ? `but is missing several ATS-critical signals. The biggest opportunities are ${topFixes.join(", ")}.`
      : "and already clears every automated check we run.",
  );
  if (projected !== null && topFixes.length) {
    parts.push(`Completing these could lift your ATS score from ${ats} to roughly ${projected - 4}–${projected}.`);
  }
  return { text: parts.join(" "), gain, projected, count: recs.length };
}
