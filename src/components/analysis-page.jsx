import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScanSearch,
  SpellCheck,
  Zap,
  BookOpen,
  Download,
  Sparkles,
  ChevronDown,
  FileText,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import {
  AtsHeatmap,
  ResumeRadar,
  JobMatchSimulator,
  ResumeAnalytics,
  MissingSectionsCard,
  buildRecommendations,
  scoreExplanations,
} from "@/components/analysis-tools";

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
export function SectionCard({ children, className = "" }) {
  return (
    <div
      className={
        "flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-elegant " +
        className
      }
    >
      {children}
    </div>
  );
}

function SectionHeading({ title, hint, action }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
        {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function CircularProgress({ value, size = 96, stroke = 9, tone = "primary", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;
  const tones = {
    primary: "stroke-primary",
    green: "stroke-emerald-500",
    orange: "stroke-orange-500",
    violet: "stroke-violet-500",
    sky: "stroke-sky-500",
  };
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className={`${tones[tone] ?? tones.primary} transition-[stroke-dashoffset] duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function band(value) {
  if (typeof value !== "number") return { label: "—", cls: "bg-surface-2 text-muted-foreground" };
  if (value >= 85) return { label: "Very Good", cls: "bg-emerald-50 text-emerald-700" };
  if (value >= 70) return { label: "Good", cls: "bg-emerald-50 text-emerald-700" };
  if (value >= 55) return { label: "Average", cls: "bg-orange-50 text-orange-700" };
  return { label: "Needs work", cls: "bg-rose-50 text-rose-700" };
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />;
}

function Trend({ delta }) {
  if (!delta) return null;
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <TrendingUp className={`h-3 w-3 ${up ? "" : "rotate-180"}`} />
      {up ? "+" : ""}
      {delta}
    </span>
  );
}

export function MetricCard({ icon: Icon, label, value, tone, delta, explanation, loading, className = "" }) {
  const b = band(value);
  return (
    <SectionCard className={className}>
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate text-[13px] font-medium text-muted-foreground">{label}</span>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-8 w-16" />
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <CircularProgress value={value} size={60} stroke={7} tone={tone} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[30px] font-bold leading-none tracking-tight">{value}</span>
              <span className="text-[12px] text-muted-foreground">/100</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.cls}`}>{b.label}</span>
              <Trend delta={delta} />
            </div>
          </div>
        </div>
      )}

      {explanation && (
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">{explanation}</p>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */
export function ResumeAnalysisHeader({
  versions = [],
  selected,
  onSelect,
  onDownload,
  onReanalyze,
  analyzing,
  previewOpen,
  onTogglePreview,
}) {
  const [open, setOpen] = useState(false);
  const current = versions.find((v) => v.id === selected) ?? null;

  return (
    <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Resume Analysis</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Detailed AI insights to improve your resume and boost your chances.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex min-w-[230px] items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-left transition hover:border-primary/40"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-semibold">
                {current?.label ?? "Current draft"}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {current?.createdAt ? new Date(current.createdAt).toLocaleString() : "Live, unsaved changes"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          {open && (
            <div className="absolute right-0 z-30 mt-2 w-full min-w-[230px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-elegant">
              <button
                onClick={() => {
                  onSelect?.(null);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-[13px] hover:bg-surface-2"
              >
                Current draft
              </button>
              {versions.length === 0 ? (
                <div className="px-4 py-2 text-[12px] text-muted-foreground">No saved versions yet</div>
              ) : (
                versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSelect?.(v.id);
                      setOpen(false);
                    }}
                    className="block w-full truncate px-4 py-2 text-left text-[13px] hover:bg-surface-2"
                  >
                    {v.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={onDownload}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-semibold transition hover:bg-surface-2"
        >
          <Download className="h-4 w-4" /> Download Report
        </button>
        <button
          onClick={onReanalyze}
          className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95 disabled:opacity-60"
          disabled={analyzing}
        >
          <Sparkles className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
          {analyzing ? "Analyzing…" : "Re-analyze"}
        </button>
        <button
          onClick={onTogglePreview}
          className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-semibold transition hover:bg-surface-2 xl:flex"
          title={previewOpen ? "Hide resume preview" : "Show resume preview"}
        >
          {previewOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Score overview                                                     */
/* ------------------------------------------------------------------ */
export function ScoreOverview({ score, loading, deltas = {}, explain = {} }) {
  const overall = score?.overall;
  const b = band(overall);
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-12">
      <SectionCard className="sm:col-span-2 xl:col-span-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-muted-foreground">Overall Resume Score</span>
          <Trend delta={deltas.overall} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          {loading ? (
            <Skeleton className="h-[120px] w-[120px] rounded-full" />
          ) : (
            <CircularProgress value={overall} size={120} stroke={11}>
              <div className="text-center">
                <div className="text-[36px] font-bold leading-none tracking-tight">{overall}</div>
                <div className="text-[11px] text-muted-foreground">/100</div>
              </div>
            </CircularProgress>
          )}
          <div className="min-w-[170px] flex-1">
            <dl className="space-y-2 text-[13px]">
              <Row label="ATS readiness" value={loading ? "—" : `${score?.ats}/100`} />
              <Row label="Grammar" value={loading ? "—" : `${score?.grammar}/100`} />
              <Row label="Impact & relevance" value={loading ? "—" : `${score?.impact}/100`} />
              <Row
                label="Improvement potential"
                value={loading ? "—" : `+${Math.max(0, 100 - (overall ?? 0))}%`}
                accent
              />
            </dl>
            {!loading && (
              <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${b.cls}`}>
                {b.label}
              </span>
            )}
          </div>
        </div>
        {!loading && explain.overall && (
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">{explain.overall}</p>
        )}
      </SectionCard>

      <MetricCard
        className="xl:col-span-2"
        icon={ScanSearch}
        label="ATS Score"
        value={score?.ats}
        tone="green"
        delta={deltas.ats}
        explanation={explain.ats}
        loading={loading}
      />
      <MetricCard
        className="xl:col-span-2"
        icon={SpellCheck}
        label="Grammar"
        value={score?.grammar}
        tone="violet"
        delta={deltas.grammar}
        explanation={explain.grammar}
        loading={loading}
      />
      <MetricCard
        className="xl:col-span-2"
        icon={Zap}
        label="Impact Score"
        value={score?.impact}
        tone="orange"
        delta={deltas.impact}
        explanation={explain.impact}
        loading={loading}
      />
      <MetricCard
        className="xl:col-span-2"
        icon={BookOpen}
        label="Readability"
        value={score?.readability}
        tone="sky"
        delta={deltas.readability}
        explanation={explain.readability}
        loading={loading}
      />
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-semibold ${accent ? "text-primary" : ""}`}>{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recommendations                                                    */
/* ------------------------------------------------------------------ */
const PRIORITY = {
  Critical: "bg-rose-50 text-rose-700 border-rose-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-sky-50 text-sky-700 border-sky-200",
  Low: "bg-surface-2 text-muted-foreground border-border",
};

export function RecommendationsCard({ items = [], onFix, className = "" }) {
  return (
    <SectionCard className={className}>
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-tight">Top Recommendations</div>
          <div className="text-[12px] text-muted-foreground">
            {items.length === 0
              ? "Nothing critical left — nice work"
              : `${items.length} actions ranked by ATS impact`}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 grid flex-1 place-items-center rounded-xl border border-dashed border-border bg-surface/60 p-6 text-center">
          <div>
            <Sparkles className="mx-auto h-5 w-5 text-emerald-600" />
            <p className="mt-2 text-[13px] text-muted-foreground">
              Your resume passes every automated check we run. Re-analyze after your next edit.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 flex flex-1 flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-surface/50 p-3 transition hover:border-primary/40 hover:bg-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PRIORITY[item.priority]}`}
                >
                  {item.priority}
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  +{item.ats} ATS
                </span>
              </div>
              <div className="mt-1.5 text-[13.5px] font-semibold leading-snug">{item.title}</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{item.why}</p>
              <button
                onClick={() => onFix?.(item)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-card px-2.5 py-1 text-[12px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Fix Now <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Sticky live resume preview                                         */
/* ------------------------------------------------------------------ */
const PREVIEW_SECTIONS = ["personal", "summary", "skills", "experience", "projects", "education", "certifications"];

function PreviewBlock({ id, title, children, empty }) {
  return (
    <section id={`preview-${id}`} className="scroll-mt-4 border-t border-border/60 pt-3 first:border-0 first:pt-0">
      {title && (
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">{title}</h4>
      )}
      <div className="mt-1.5 text-[11.5px] leading-relaxed text-foreground/85">
        {empty ? <span className="italic text-muted-foreground">Not added yet</span> : children}
      </div>
    </section>
  );
}

export function AnalysisResumePreview({ resume, previewRef }) {
  return (
    <div className="flex max-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="text-[13px] font-semibold">Resume Preview</span>
        <span className="text-[11px] text-muted-foreground">Live</span>
      </div>
      <div ref={previewRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        <PreviewBlock id="personal">
          <div className="text-[16px] font-bold text-foreground">{resume.name || "Your Name"}</div>
          <div className="text-[12px] font-medium text-primary">{resume.role || "Target role"}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {[resume.email, resume.phone, resume.location, resume.linkedin, resume.github]
              .filter(Boolean)
              .join(" · ") || "Add contact details"}
          </div>
        </PreviewBlock>

        <PreviewBlock id="summary" title="Professional Summary" empty={!resume.summary?.trim()}>
          {resume.summary}
        </PreviewBlock>

        <PreviewBlock id="skills" title="Skills" empty={resume.skills.length === 0}>
          <div className="flex flex-wrap gap-1">
            {resume.skills.map((s) => (
              <span key={s} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium">
                {s}
              </span>
            ))}
          </div>
        </PreviewBlock>

        <PreviewBlock id="experience" title="Experience" empty={resume.experience.length === 0}>
          <div className="space-y-2">
            {resume.experience.map((e, i) => (
              <div key={`${e.company}-${i}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-foreground">{e.role}</span>
                  <span className="text-[10.5px] text-muted-foreground">{e.period}</span>
                </div>
                <div className="text-[11px] text-primary">{e.company}</div>
                <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
                  {e.bullets.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </PreviewBlock>

        <PreviewBlock id="projects" title="Projects" empty={resume.projects.length === 0}>
          <div className="space-y-2">
            {resume.projects.map((p, i) => (
              <div key={`${p.name}-${i}`}>
                <div className="font-semibold text-foreground">{p.name}</div>
                <div className="text-[10.5px] text-muted-foreground">{p.tech.join(", ")}</div>
                <div>{p.description}</div>
              </div>
            ))}
          </div>
        </PreviewBlock>

        <PreviewBlock id="education" title="Education" empty={resume.education.length === 0}>
          {resume.education.map((e, i) => (
            <div key={i}>
              <span className="font-semibold text-foreground">{e.degree}</span> — {e.school}
            </div>
          ))}
        </PreviewBlock>

        <PreviewBlock id="certifications" title="Certifications" empty={resume.certifications.length === 0}>
          <ul className="list-disc pl-4">
            {resume.certifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </PreviewBlock>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export function ResumeAnalysisPage({
  resume,
  score,
  versions = [],
  analyzing = false,
  onAddSkill,
  onDownload,
  onReanalyze,
  onRestoreVersion,
}) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const previewRef = useRef(null);
  const prevScore = useRef(null);
  const [deltas, setDeltas] = useState({});

  const viewResume = useMemo(() => {
    const v = versions.find((x) => x.id === selectedVersion);
    return v?.snapshot ?? resume;
  }, [versions, selectedVersion, resume]);

  useEffect(() => {
    if (!score || analyzing) return;
    const prev = prevScore.current;
    if (prev) {
      const d = {};
      for (const k of ["overall", "ats", "grammar", "impact", "readability"]) {
        const diff = (score[k] ?? 0) - (prev[k] ?? 0);
        if (diff) d[k] = diff;
      }
      if (Object.keys(d).length) setDeltas(d);
    }
    prevScore.current = score;
  }, [score, analyzing]);

  const recommendations = useMemo(() => buildRecommendations(viewResume), [viewResume]);
  const explain = useMemo(() => scoreExplanations(viewResume, score), [viewResume, score]);

  const handleFix = (item) => {
    const target = PREVIEW_SECTIONS.includes(item.target) ? item.target : "summary";
    setPreviewOpen(true);
    window.setTimeout(() => {
      document
        .getElementById(`preview-${target}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <main className="mx-auto w-full max-w-[1720px] flex-1 p-4 sm:p-6">
      <div
        className={
          previewOpen
            ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
            : "grid gap-6"
        }
      >
        <div className="min-w-0 space-y-7">
          <ResumeAnalysisHeader
            versions={versions}
            selected={selectedVersion}
            onSelect={(id) => {
              setSelectedVersion(id);
              const v = versions.find((x) => x.id === id);
              if (v && onRestoreVersion) onRestoreVersion(v.snapshot);
            }}
            onDownload={onDownload}
            onReanalyze={onReanalyze}
            analyzing={analyzing}
            previewOpen={previewOpen}
            onTogglePreview={() => setPreviewOpen((o) => !o)}
          />

          <section className="space-y-3">
            <SectionHeading title="Overview" hint="Scores with AI explanations and change since your last analysis" />
            <ScoreOverview score={score} loading={analyzing || !score} deltas={deltas} explain={explain} />
          </section>

          <section className="space-y-3">
            <SectionHeading title="Resume Insights" hint="Where your resume is strong and where it leaks points" />
            <div className="grid auto-rows-auto gap-6 md:grid-cols-2 xl:grid-cols-12">
              <div className="xl:col-span-5">
                <AtsHeatmap resume={viewResume} onAddSkill={onAddSkill} />
              </div>
              <div className="xl:col-span-4">
                <ResumeRadar resume={viewResume} />
              </div>
              <div className="md:col-span-2 xl:col-span-3">
                <ResumeAnalytics resume={viewResume} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading title="Job Matching" hint="How different hiring pipelines would read this resume" />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
              <div className="md:col-span-1 xl:col-span-7">
                <JobMatchSimulator resume={viewResume} />
              </div>
              <div className="md:col-span-1 xl:col-span-5">
                <MissingSectionsCard resume={viewResume} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading title="AI Recommendations" hint="Ranked by expected ATS gain — fix from highest impact down" />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
              <RecommendationsCard
                items={recommendations.slice(0, Math.ceil(recommendations.length / 2))}
                onFix={handleFix}
                className="xl:col-span-6"
              />
              {recommendations.length > 1 && (
                <RecommendationsCard
                  items={recommendations.slice(Math.ceil(recommendations.length / 2))}
                  onFix={handleFix}
                  className="xl:col-span-6"
                />
              )}
            </div>
          </section>
        </div>

        {previewOpen && (
          <aside className="hidden xl:sticky xl:top-6 xl:block">
            <AnalysisResumePreview resume={viewResume} previewRef={previewRef} />
          </aside>
        )}
      </div>
    </main>
  );
}
