import {
  TrendingUp,
  ScanSearch,
  FileText,
  Gauge,
  MessagesSquare,
  Briefcase,
  Download,
  ArrowRight,
  Sparkles,
  Clock,
  Lightbulb,
  Rocket,
  CircleDashed,
} from "lucide-react";

function Card({ className = "", children }) {
  return (
    <div className={`rounded-[20px] border border-border bg-card p-5 shadow-elegant ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, hint, tone }) {
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-[28px] font-bold leading-none tracking-tight">{value}</span>
            {suffix && <span className="text-sm font-semibold text-muted-foreground">{suffix}</span>}
          </div>
          <div className="mt-1.5 truncate text-[11px] text-muted-foreground">{hint}</div>
        </div>
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            tone === "primary"
              ? "gradient-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      {typeof value === "number" && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full gradient-primary transition-[width] duration-700"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        </div>
      )}
    </Card>
  );
}

function QuickAction({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex min-w-0 flex-col items-start gap-2 rounded-[20px] border border-border bg-card p-4 text-left shadow-elegant transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground transition group-hover:gradient-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold">{title}</div>
        <div className="text-[11px] leading-snug text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

function relTime(at) {
  const diff = Math.max(0, Date.now() - at);
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function DashboardHome({
  resume,
  score,
  progress,
  confidence,
  versions,
  history,
  missing,
  nextSection,
  onNavigate,
  onRestoreVersion,
  onDownload,
}) {
  const firstName = resume.name?.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5 p-4 sm:p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Gauge}
          label="Completion"
          value={progress}
          suffix="%"
          hint={`${nextSection ? `Next: ${nextSection.label}` : "All sections captured"}`}
          tone="primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Resume Score"
          value={score.overall}
          suffix="/100"
          hint={`Impact ${score.impact} · Grammar ${score.grammar}`}
        />
        <StatCard
          icon={ScanSearch}
          label="ATS Readiness"
          value={score.ats}
          suffix="%"
          hint={`Confidence ${confidence}%`}
        />
        <StatCard
          icon={FileText}
          label="Saved Versions"
          value={versions.length}
          hint={versions.length ? "Tailored resume snapshots" : "No versions saved yet"}
        />
      </div>

      {/* Continue */}
      <div className="overflow-hidden rounded-[20px] border border-border gradient-primary p-[1px] shadow-glow">
        <div className="grid grid-cols-1 items-center gap-4 rounded-[19px] bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Continue where you left off
            </div>
            <h2 className="mt-1.5 truncate text-lg font-bold tracking-tight">
              {firstName ? `Welcome back, ${firstName}` : "Let's build your resume"}
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {nextSection
                ? `Aria is ready to help with your ${nextSection.label.toLowerCase()}.`
                : "Your resume is complete — polish it or tailor it for a role."}
            </p>
            <div className="mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full gradient-primary transition-[width] duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => onNavigate("builder")}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95"
          >
            Resume chat <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <SectionTitle title="Quick actions" />
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            icon={MessagesSquare}
            title="Chat with Aria"
            description="Talk naturally, build live"
            onClick={() => onNavigate("builder")}
          />
          <QuickAction
            icon={ScanSearch}
            title="ATS analysis"
            description="Keyword heatmap & match"
            onClick={() => onNavigate("analysis")}
          />
          <QuickAction
            icon={Briefcase}
            title="Career workspace"
            description="Gaps, roadmap, interviews"
            onClick={() => onNavigate("workspace")}
          />
          <QuickAction
            icon={Download}
            title="Download resume"
            description="Export your latest draft"
            onClick={onDownload}
          />
        </div>
      </section>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <SectionTitle title="Recent resumes" action="Manage" onAction={() => onNavigate("workspace")} />
          <div className="mt-3 space-y-2">
            {versions.length === 0 ? (
              <EmptyState
                icon={FileText}
                text="No saved versions yet. Save a snapshot from the Career Workspace to tailor resumes per role."
              />
            ) : (
              versions.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">
                      {v.label || "Untitled version"}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {v.snapshot?.role || "No target role"} · {relTime(v.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => onRestoreVersion(v.snapshot)}
                    className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold transition hover:bg-surface-2"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="min-w-0">
          <SectionTitle title="AI recommendations" />
          <div className="mt-3 space-y-2">
            {missing.length === 0 ? (
              <EmptyState icon={Sparkles} text="Nothing critical missing — nice work." />
            ) : (
              missing.slice(0, 5).map((m) => (
                <button
                  key={m}
                  onClick={() => onNavigate("builder")}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5 text-left transition hover:bg-surface-2"
                >
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Lightbulb className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold">Add {m}</span>
                    <span className="block text-[11px] leading-snug text-muted-foreground">
                      Improves ATS parsing and recruiter scan time.
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Activity + upgrade */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <SectionTitle title="Recent activity" />
          <div className="mt-3 space-y-3">
            {history.length === 0 ? (
              <EmptyState icon={Clock} text="No edits yet this session." />
            ) : (
              history
                .slice()
                .reverse()
                .slice(0, 6)
                .map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1 border-b border-border pb-2.5">
                      <div className="truncate text-[12.5px] font-medium">{h.text}</div>
                      <div className="text-[11px] text-muted-foreground">{relTime(h.at)}</div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>

        <div className="overflow-hidden rounded-[20px] gradient-primary p-5 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest opacity-90">
            <Rocket className="h-3.5 w-3.5" /> SmartHire Pro
          </div>
          <h3 className="mt-2 text-lg font-bold leading-tight">
            Unlimited tailored resumes & AI cover letters
          </h3>
          <p className="mt-1.5 text-[12px] opacity-90">
            Priority job tailoring, deeper ATS scans, and unlimited version history.
          </p>
          <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-[12.5px] font-semibold text-primary shadow-elegant transition hover:opacity-95">
            Upgrade — ₹399/mo <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="truncate text-[14px] font-bold tracking-tight">{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="shrink-0 text-[11.5px] font-semibold text-primary transition hover:opacity-80"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon = CircleDashed, text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-surface px-3 py-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-[12px] leading-snug text-muted-foreground">{text}</p>
    </div>
  );
}
