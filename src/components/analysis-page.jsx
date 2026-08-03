import { useMemo, useState } from "react";
import {
  Gauge,
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
} from "lucide-react";
import {
  AtsHeatmap,
  ResumeRadar,
  JobMatchSimulator,
  ResumeAnalytics,
  MissingSectionsCard,
} from "@/components/analysis-tools";

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
export function SectionCard({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-[20px] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-elegant " +
        className
      }
    >
      {children}
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-2"
        />
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

export function MetricCard({ icon: Icon, label, value, tone, footLabel, footValue, loading }) {
  const b = band(value);
  return (
    <SectionCard className="flex flex-col">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate text-[13px] font-medium text-muted-foreground">{label}</span>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-16" />
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-4">
          <CircularProgress value={value} size={64} stroke={7} tone={tone} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[34px] font-bold leading-none tracking-tight">{value}</span>
              <span className="text-[12px] text-muted-foreground">/100</span>
            </div>
            <span
              className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.cls}`}
            >
              {b.label}
            </span>
          </div>
        </div>
      )}

      {footLabel && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{footLabel}</span>
            <span className="font-semibold">{loading ? "—" : footValue}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full gradient-primary transition-[width] duration-1000"
              style={{ width: `${loading ? 0 : (value ?? 0)}%` }}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */
export function ResumeAnalysisHeader({ versions = [], selected, onSelect, onDownload, onReanalyze, analyzing }) {
  const [open, setOpen] = useState(false);
  const current = versions.find((v) => v.id === selected) ?? null;

  return (
    <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="min-w-0">
        <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">Resume Analysis</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Detailed insights and AI-powered feedback to improve your resume.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex min-w-[240px] items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-left transition hover:border-primary/40"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-semibold">
                {current?.label ?? "Current draft"}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {current?.createdAt
                  ? new Date(current.createdAt).toLocaleString()
                  : "Live, unsaved changes"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          {open && (
            <div className="absolute right-0 z-30 mt-2 w-full min-w-[240px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-elegant">
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
                <div className="px-4 py-2 text-[12px] text-muted-foreground">
                  No saved versions yet
                </div>
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
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Score overview                                                     */
/* ------------------------------------------------------------------ */
export function ScoreOverview({ score, loading }) {
  const overall = score?.overall;
  const b = band(overall);
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
      <SectionCard>
        <div className="text-[13px] font-medium text-muted-foreground">Overall Resume Score</div>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          {loading ? (
            <Skeleton className="h-[130px] w-[130px] rounded-full" />
          ) : (
            <CircularProgress value={overall} size={130} stroke={11}>
              <div className="text-center">
                <div className="text-[40px] font-bold leading-none tracking-tight">{overall}</div>
                <div className="text-[11px] text-muted-foreground">/100</div>
              </div>
            </CircularProgress>
          )}
          <div className="min-w-[180px] flex-1">
            <div className="text-[13px] leading-snug text-foreground/80">
              {loading
                ? "Analyzing your resume…"
                : "Live score, recalculated on every edit you make."}
            </div>
            <dl className="mt-4 space-y-2.5 text-[13px]">
              <Row label="ATS readiness" value={loading ? "—" : `${score?.ats}/100`} />
              <Row label="Grammar" value={loading ? "—" : `${score?.grammar}/100`} />
              <Row
                label="Improvement potential"
                value={loading ? "—" : `+${Math.max(0, 100 - (overall ?? 0))}%`}
                accent
              />
            </dl>
          </div>
        </div>
        {!loading && (
          <span
            className={`mt-5 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${b.cls}`}
          >
            {b.label}
          </span>
        )}
      </SectionCard>

      <MetricCard
        icon={ScanSearch}
        label="ATS Score"
        value={score?.ats}
        tone="green"
        loading={loading}
      />
      <MetricCard
        icon={SpellCheck}
        label="Grammar"
        value={score?.grammar}
        tone="violet"
        loading={loading}
      />
      <MetricCard
        icon={Zap}
        label="Impact Score"
        value={score?.impact}
        tone="orange"
        loading={loading}
      />
      <MetricCard
        icon={BookOpen}
        label="Readability"
        value={score?.readability}
        tone="sky"
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
export function RecommendationsCard({ items = [], onAction }) {
  return (
    <SectionCard>
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-tight">Top Recommendations</div>
          <div className="text-[12px] text-muted-foreground">
            Generated from your latest analysis
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface/60 p-6 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-[13px] text-muted-foreground">
            No recommendations yet — chat with your coach or re-analyze to generate them.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item}>
              <button
                onClick={() => onAction?.(item)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-card"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export function ResumeAnalysisPage({
  resume,
  score,
  missing = [],
  versions = [],
  analyzing = false,
  onAddSkill,
  onDownload,
  onReanalyze,
  onRestoreVersion,
}) {
  const [selectedVersion, setSelectedVersion] = useState(null);

  const viewResume = useMemo(() => {
    const v = versions.find((x) => x.id === selectedVersion);
    return v?.snapshot ?? resume;
  }, [versions, selectedVersion, resume]);

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6">
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
      />

      <ScoreOverview score={score} loading={analyzing || !score} />

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <AtsHeatmap resume={viewResume} onAddSkill={onAddSkill} />
        </div>
        <div className="xl:col-span-1">
          <ResumeRadar resume={viewResume} />
        </div>
        <div className="flex flex-col gap-6 xl:col-span-1">
          <MissingSectionsCard resume={viewResume} />
          <RecommendationsCard items={missing} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <JobMatchSimulator resume={viewResume} />
        <ResumeAnalytics resume={viewResume} />
      </div>
    </main>
  );
}
