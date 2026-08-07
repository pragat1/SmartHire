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
  Eye,
  X,
  Minus,
  Plus,
  Pencil,
  FolderOpen,
} from "lucide-react";
import {
  AtsHeatmap,
  ResumeRadar,
  JobMatchSimulator,
  ResumeAnalytics,
  MissingSectionsCard,
  buildRecommendations,
  scoreExplanations,
  buildGlanceSummary,
  scoreCategories,
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

/* Standardized buttons */
const BTN = {
  primary:
    "gradient-primary text-primary-foreground shadow-elegant hover:opacity-95 border border-transparent",
  secondary: "border border-border bg-card hover:bg-surface-2",
  ghost: "border border-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground",
};

export function Btn({ variant = "secondary", className = "", children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition duration-200 active:scale-[0.98] disabled:opacity-60 ${BTN[variant]} ${className}`}
    >
      {children}
    </button>
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

/* Collapsible group ------------------------------------------------- */
function Group({ title, hint, defaultOpen = false, emphasis = "secondary", children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[22px] border border-border bg-card/60 backdrop-blur-[2px]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <h2
            className={
              emphasis === "primary"
                ? "text-[18px] font-bold tracking-tight"
                : "text-[15px] font-semibold tracking-tight"
            }
          >
            {title}
          </h2>
          {hint && <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{hint}</p>}
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-card">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open && (
        <div className="animate-in fade-in slide-in-from-top-1 px-5 pb-5 duration-300">{children}</div>
      )}
    </section>
  );
}

export function MetricCard({ icon: Icon, label, value, tone, delta, explanation, tip, loading }) {
  const b = band(value);
  return (
    <SectionCard>
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
          <CircularProgress value={value} size={56} stroke={6} tone={tone} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] font-bold leading-none tracking-tight">{value}</span>
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
      {tip && (
        <p className="mt-2 text-[11.5px] font-medium text-primary">Tip: {tip}</p>
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
  onViewResume,
}) {
  const [open, setOpen] = useState(false);
  const current = versions.find((v) => v.id === selected) ?? null;

  return (
    <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Resume Analysis</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Everything the AI found, ordered by what to fix first.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex min-w-[210px] items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2 text-left transition hover:border-primary/40"
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
            <div className="absolute right-0 z-30 mt-2 w-full min-w-[210px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-elegant">
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

        <Btn variant="secondary" onClick={onViewResume}>
          <Eye className="h-4 w-4" /> View Resume
        </Btn>
        <Btn variant="ghost" onClick={onDownload}>
          <Download className="h-4 w-4" /> Report
        </Btn>
        <Btn variant="primary" onClick={onReanalyze} disabled={analyzing}>
          <Sparkles className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
          {analyzing ? "Analyzing…" : "Re-analyze"}
        </Btn>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview                                                           */
/* ------------------------------------------------------------------ */
const TIPS = {
  ats: "Mirror the exact keywords from the job post.",
  grammar: "Cut filler phrases and keep tense consistent.",
  impact: "Add a number to your top three bullets.",
  readability: "Keep bullets under two lines each.",
};

export function ScoreOverview({ score, loading, deltas = {}, explain = {}, glance }) {
  const overall = score?.overall;
  const b = band(overall);
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch">
        <SectionCard>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted-foreground">Overall Score</span>
            <Trend delta={deltas.overall} />
          </div>
          <div className="mt-4 flex items-center gap-5">
            {loading ? (
              <Skeleton className="h-[112px] w-[112px] rounded-full" />
            ) : (
              <CircularProgress value={overall} size={112} stroke={10}>
                <div className="text-center">
                  <div className="text-[34px] font-bold leading-none tracking-tight">{overall}</div>
                  <div className="text-[11px] text-muted-foreground">/100</div>
                </div>
              </CircularProgress>
            )}
            <div className="min-w-0">
              {!loading && (
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${b.cls}`}>
                  {b.label}
                </span>
              )}
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                {loading ? "Analyzing your resume…" : explain.overall}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* AI summary */}
        <SectionCard className="bg-primary/[0.03]">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-tight">Your Resume at a Glance</div>
              <div className="text-[11.5px] text-muted-foreground">AI summary · 10-second read</div>
            </div>
          </div>
          {loading || !glance ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-8/12" />
            </div>
          ) : (
            <>
              <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/90">{glance.text}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  +{glance.gain} ATS from top 3 fixes
                </span>
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {glance.count} recommendations
                </span>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ScanSearch}
          label="ATS Score"
          value={score?.ats}
          tone="green"
          delta={deltas.ats}
          explanation={explain.ats}
          tip={TIPS.ats}
          loading={loading}
        />
        <MetricCard
          icon={SpellCheck}
          label="Grammar"
          value={score?.grammar}
          tone="violet"
          delta={deltas.grammar}
          explanation={explain.grammar}
          tip={TIPS.grammar}
          loading={loading}
        />
        <MetricCard
          icon={Zap}
          label="Impact"
          value={score?.impact}
          tone="orange"
          delta={deltas.impact}
          explanation={explain.impact}
          tip={TIPS.impact}
          loading={loading}
        />
        <MetricCard
          icon={BookOpen}
          label="Readability"
          value={score?.readability}
          tone="sky"
          delta={deltas.readability}
          explanation={explain.readability}
          tip={TIPS.readability}
          loading={loading}
        />
      </div>
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

const RECRUITER_IMPACT = {
  Critical: "Most recruiters drop resumes missing this in the first screen.",
  High: "Strong lift in shortlist rate for mid-level roles.",
  Medium: "Improves readability and perceived ownership.",
  Low: "Small polish gain — do it last.",
};

export function RecommendationsCard({ items = [], onGenerate, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 3);

  if (items.length === 0) {
    return (
      <SectionCard>
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
          <div>
            <Sparkles className="mx-auto h-5 w-5 text-emerald-600" />
            <p className="mt-2 text-[13px] text-muted-foreground">
              Your resume passes every automated check we run. Re-analyze after your next edit.
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-3">
      {visible.map((item, i) => (
        <div
          key={item.id}
          className="grid gap-3 rounded-[18px] border border-border bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-elegant md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-surface-2 text-[11px] font-bold text-muted-foreground">
                {i + 1}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PRIORITY[item.priority]}`}
              >
                {item.priority}
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                +{item.ats} ATS
              </span>
            </div>
            <div className="mt-2 text-[14.5px] font-semibold leading-snug">{item.title}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.why}</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground/80">
              Recruiter impact: {RECRUITER_IMPACT[item.priority]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Btn variant="primary" onClick={() => onGenerate?.(item)}>
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Btn>
            <Btn variant="secondary" onClick={() => onEdit?.(item)}>
              <Pencil className="h-4 w-4" /> Edit Manually
            </Btn>
          </div>
        </div>
      ))}

      {items.length > 3 && (
        <Btn variant="ghost" className="w-fit" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show top 3 only" : `View all recommendations (${items.length})`}
          <ArrowRight className="h-4 w-4" />
        </Btn>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Resume preview drawer                                              */
/* ------------------------------------------------------------------ */
const PREVIEW_SECTIONS = ["personal", "summary", "skills", "experience", "projects", "education", "certifications"];

function EmptyBlock({ icon: Icon, title, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/60 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <div className="mt-1 text-[12px] font-semibold">{title}</div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function PreviewBlock({ id, title, children, empty }) {
  return (
    <section id={`preview-${id}`} className="scroll-mt-4 border-t border-border/60 pt-3 first:border-0 first:pt-0">
      {title && <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">{title}</h4>}
      <div className="mt-1.5 text-[11.5px] leading-relaxed text-foreground/85">
        {empty ?? children}
      </div>
    </section>
  );
}

export function ResumePreviewDrawer({ open, resume, onClose, onDownload }) {
  const [zoom, setZoom] = useState(100);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-in fade-in absolute inset-0 bg-foreground/20 backdrop-blur-[2px] duration-200"
        onClick={onClose}
      />
      <aside className="animate-in slide-in-from-right relative flex h-full w-full flex-col border-l border-border bg-card shadow-elegant duration-300 sm:max-w-[440px]">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="text-[14px] font-semibold">Resume Preview</span>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-surface-2"
            aria-label="Close resume preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(70, z - 10))}
              className="grid h-7 w-7 place-items-center rounded-md transition hover:bg-surface-2"
              aria-label="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-12 text-center text-[12px] font-semibold tabular-nums">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(140, z + 10))}
              className="grid h-7 w-7 place-items-center rounded-md transition hover:bg-surface-2"
              aria-label="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <Btn variant="secondary" onClick={onDownload}>
            <Download className="h-4 w-4" /> Download
          </Btn>
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto p-4">
          <div
            className="space-y-3 origin-top transition-transform duration-200"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <PreviewBlock id="personal">
              <div className="text-[16px] font-bold text-foreground">{resume.name || "Your Name"}</div>
              <div className="text-[12px] font-medium text-primary">{resume.role || "Target role"}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {[resume.email, resume.phone, resume.location, resume.linkedin, resume.github]
                  .filter(Boolean)
                  .join(" · ") || "Add contact details"}
              </div>
            </PreviewBlock>

            <PreviewBlock
              id="summary"
              title="Professional Summary"
              empty={
                !resume.summary?.trim() && (
                  <EmptyBlock
                    icon={FileText}
                    title="No summary yet"
                    hint="Add a 2-line pitch to unlock +6 ATS points."
                  />
                )
              }
            >
              {resume.summary}
            </PreviewBlock>

            <PreviewBlock
              id="skills"
              title="Skills"
              empty={
                resume.skills.length === 0 && (
                  <EmptyBlock icon={Zap} title="No skills added yet" hint="Add skills to start matching job keywords." />
                )
              }
            >
              <div className="flex flex-wrap gap-1">
                {resume.skills.map((s) => (
                  <span key={s} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </PreviewBlock>

            <PreviewBlock
              id="experience"
              title="Experience"
              empty={
                resume.experience.length === 0 && (
                  <EmptyBlock
                    icon={FolderOpen}
                    title="No experience added yet"
                    hint="Even an internship adds real-world context."
                  />
                )
              }
            >
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

            <PreviewBlock
              id="projects"
              title="Projects"
              empty={
                resume.projects.length === 0 && (
                  <EmptyBlock
                    icon={FolderOpen}
                    title="No projects added yet"
                    hint="Add your first project to unlock project-based ATS scoring."
                  />
                )
              }
            >
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

            <PreviewBlock
              id="education"
              title="Education"
              empty={
                resume.education.length === 0 && (
                  <EmptyBlock icon={BookOpen} title="No education added yet" hint="Add your degree and institution." />
                )
              }
            >
              {resume.education.map((e, i) => (
                <div key={i}>
                  <span className="font-semibold text-foreground">{e.degree}</span> — {e.school}
                </div>
              ))}
            </PreviewBlock>

            <PreviewBlock
              id="certifications"
              title="Certifications"
              empty={
                resume.certifications.length === 0 && (
                  <EmptyBlock
                    icon={Lightbulb}
                    title="No certifications yet"
                    hint="Cloud or framework certs raise keyword density."
                  />
                )
              }
            >
              <ul className="list-disc pl-4">
                {resume.certifications.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </PreviewBlock>
          </div>
        </div>
      </aside>
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
  onAskAi,
}) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
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
  const glance = useMemo(() => buildGlanceSummary(viewResume, score), [viewResume, score]);
  const radarReady = useMemo(() => {
    const c = scoreCategories(viewResume);
    return Object.values(c).reduce((n, v) => n + v, 0) > 60;
  }, [viewResume]);

  const openAt = (target) => {
    const section = PREVIEW_SECTIONS.includes(target) ? target : "summary";
    setPreviewOpen(true);
    window.setTimeout(() => {
      document.getElementById(`preview-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
  };

  const handleGenerate = (item) => {
    if (onAskAi) onAskAi(`Help me improve my resume: ${item.title}. ${item.why}`);
    else openAt(item.target);
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
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
          onViewResume={() => setPreviewOpen(true)}
        />

        {/* Overview — primary */}
        <section className="space-y-4">
          <ScoreOverview
            score={score}
            loading={analyzing || !score}
            deltas={deltas}
            explain={explain}
            glance={glance}
          />
        </section>

        {/* Missing sections — primary */}
        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-tight">What to fix first</h2>
            <p className="text-[12px] text-muted-foreground">
              Complete these sections to unlock the biggest ATS gains.
            </p>
          </div>
          <MissingSectionsCard resume={viewResume} onFix={(m) => openAt(m.target)} />
        </section>

        {/* Recommendations — primary */}
        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-bold tracking-tight">AI Recommendations</h2>
            <p className="text-[12px] text-muted-foreground">
              Ranked by expected impact — critical items first.
            </p>
          </div>
          <RecommendationsCard
            items={recommendations}
            onGenerate={handleGenerate}
            onEdit={(item) => openAt(item.target)}
          />
        </section>

        {/* Insights — secondary, collapsible */}
        <Group
          title="Insights"
          hint="Keyword coverage and your strength profile"
          defaultOpen
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <AtsHeatmap resume={viewResume} onAddSkill={onAddSkill} />
            {radarReady ? (
              <ResumeRadar resume={viewResume} />
            ) : (
              <SectionCard>
                <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-border bg-surface/60 p-8 text-center">
                  <div className="max-w-[280px]">
                    <Lightbulb className="mx-auto h-6 w-6 text-muted-foreground" />
                    <div className="mt-3 text-sm font-semibold">Strength radar locked</div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Complete more resume sections to unlock your strength profile.
                    </p>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        </Group>

        {/* Job matching — secondary, collapsible */}
        <Group title="Job Matching" hint="How different hiring pipelines would read this resume">
          <JobMatchSimulator resume={viewResume} />
        </Group>

        {/* Advanced analytics — tertiary, collapsed */}
        <Group title="Advanced Analytics" hint="Word count, reading time, buzzwords, keyword density and more">
          <ResumeAnalytics resume={viewResume} />
        </Group>
      </div>

      <ResumePreviewDrawer
        open={previewOpen}
        resume={viewResume}
        onClose={() => setPreviewOpen(false)}
        onDownload={onDownload}
      />
    </main>
  );
}
