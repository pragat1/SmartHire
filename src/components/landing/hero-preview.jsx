import { Sparkles, Send, User } from "lucide-react";
import { NAV_ITEMS } from "@/components/dashboard-shell";

function Placeholder({ className = "" }) {
  return <div className={`rounded-full bg-surface-2 ${className}`} />;
}

/**
 * Purely visual structural preview of the product shell.
 * Renders real state when provided, empty placeholders otherwise — never fake data.
 */
export function HeroPreview({ resume, progress = 0, score = null }) {
  const hasResume = Boolean(resume?.name);

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-elegant">
      <div className="grid grid-cols-1 sm:grid-cols-[170px_minmax(0,1fr)]">
        {/* Mini sidebar */}
        <div className="hidden flex-col gap-1 border-r border-border p-4 sm:flex">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="truncate text-[12.5px] font-bold tracking-tight">
              SmartHire <span className="text-primary">AI</span>
            </span>
          </div>
          {NAV_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11.5px] font-medium ${
                  i === 1 ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="min-w-0 bg-surface p-3 sm:p-4">
          {/* Progress + score */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
            <div className="rounded-2xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Resume Progress
                </span>
                <span className="text-[11px] font-semibold">{progress}% Complete</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3.5">
              <div className="text-[11px] font-semibold text-muted-foreground">Resume Score</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[22px] font-bold leading-none">
                  {score ? score.overall : "—"}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">/100</span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Chat panel */}
            <div className="flex min-h-[240px] flex-col rounded-2xl border border-border bg-card p-3.5">
              <div className="flex items-center gap-2 border-b border-border pb-2.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3" />
                </span>
                <span className="text-[12px] font-semibold">Aria</span>
                <span className="rounded-md bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground">
                  AI Coach
                </span>
              </div>
              <div className="flex-1 space-y-2.5 py-3">
                <div className="w-4/5 space-y-1.5 rounded-2xl rounded-tl-sm bg-surface-2 p-2.5">
                  <Placeholder className="h-2 w-full" />
                  <Placeholder className="h-2 w-5/6" />
                  <Placeholder className="h-2 w-2/3" />
                </div>
                <div className="ml-auto w-2/3 space-y-1.5 rounded-2xl rounded-tr-sm bg-accent p-2.5">
                  <Placeholder className="h-2 w-full bg-primary/15" />
                  <Placeholder className="h-2 w-1/2 bg-primary/15" />
                </div>
                <div className="w-3/5 space-y-1.5 rounded-2xl rounded-tl-sm bg-surface-2 p-2.5">
                  <Placeholder className="h-2 w-full" />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                <span className="flex-1 text-[11px] text-muted-foreground">Type your answer…</span>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Send className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* Resume preview */}
            <div className="min-h-[240px] rounded-2xl border border-border bg-card p-3.5">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  {hasResume ? (
                    <>
                      <div className="truncate text-[13px] font-bold">{resume.name}</div>
                      <div className="truncate text-[11px] text-primary">{resume.role}</div>
                    </>
                  ) : (
                    <>
                      <Placeholder className="h-2.5 w-2/3" />
                      <Placeholder className="mt-1.5 h-2 w-1/2" />
                    </>
                  )}
                </div>
              </div>

              {["Summary", "Skills", "Education"].map((label) => (
                <div key={label} className="mt-4">
                  <div className="text-[9.5px] font-bold uppercase tracking-widest text-primary">
                    {label}
                  </div>
                  <div className="mt-1.5 space-y-1.5">
                    <Placeholder className="h-2 w-full" />
                    <Placeholder className="h-2 w-11/12" />
                    <Placeholder className="h-2 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
