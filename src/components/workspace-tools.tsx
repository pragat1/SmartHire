import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Compass,
  Target,
  Loader2,
  MessageSquareQuote,
  History,
  Save,
  RotateCcw,
  Trash2,
  Sparkles,
  Check,
  TriangleAlert,
  ChevronDown,
  ChevronRight,
  Play,
  Layers,
} from "lucide-react";

/* ---------- Shared minimal resume shape ---------- */

export type WorkspaceResume = {
  name: string;
  role: string;
  summary: string;
  skills: string[];
  projects: { name: string; description: string; tech: string[] }[];
};

/* ============================================================
 *  Resume Versions — localStorage-backed multi-version workspace
 *  ============================================================ */

type ResumeVersion<T> = {
  id: string;
  label: string;
  createdAt: number;
  snapshot: T;
};

const VERSIONS_KEY = "smarthire.versions.v1";

export function useResumeVersions<T>() {
  const [versions, setVersions] = useState<ResumeVersion<T>[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(VERSIONS_KEY) : null;
      if (raw) setVersions(JSON.parse(raw) as ResumeVersion<T>[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: ResumeVersion<T>[]) => {
    setVersions(next);
    try {
      window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const save = useCallback(
    (label: string, snapshot: T) => {
      const v: ResumeVersion<T> = {
        id: Math.random().toString(36).slice(2, 10),
        label: label.trim() || `Version ${versions.length + 1}`,
        createdAt: Date.now(),
        snapshot,
      };
      persist([v, ...versions].slice(0, 12));
      return v;
    },
    [versions, persist],
  );

  const remove = useCallback(
    (id: string) => persist(versions.filter((v) => v.id !== id)),
    [versions, persist],
  );

  return { versions, save, remove };
}

export function ResumeVersionsCard<T>({
  current,
  versions,
  onSave,
  onRestore,
  onDelete,
  describe,
}: {
  current: T;
  versions: ResumeVersion<T>[];
  onSave: (label: string) => void;
  onRestore: (snapshot: T) => void;
  onDelete: (id: string) => void;
  describe: (snapshot: T) => string;
}) {
  const [label, setLabel] = useState("");

  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
          <Layers className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold leading-none">Resume Versions</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Snapshot different variants — FAANG, Startup, Data, etc.
          </div>
        </div>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
          {versions.length}/12
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Name this snapshot (e.g. FAANG version)"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="button"
          onClick={() => {
            onSave(label);
            setLabel("");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-white shadow-elegant hover:opacity-95"
        >
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-surface/40 p-4 text-center text-[12px] text-muted-foreground">
          No saved versions yet. Save one before tailoring your resume for a new role.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="group rounded-xl border border-border/60 bg-surface/40 p-3 transition hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{v.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {describe(v.snapshot)} · {new Date(v.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onRestore(v.snapshot)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-semibold hover:bg-surface-2"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(v.id)}
                    className="inline-flex items-center rounded-md border border-border bg-white p-1 text-muted-foreground hover:bg-surface-2 hover:text-destructive"
                    aria-label="Delete version"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 text-[11px] text-muted-foreground">
        Snapshots live in your browser — no account needed.
      </div>
      <button
        type="button"
        onClick={() => onSave(`Current draft`)}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
      >
        <Sparkles className="h-3 w-3" /> Quick-save current draft
      </button>

      <div className="pointer-events-none opacity-0" aria-hidden>
        {JSON.stringify(current).slice(0, 0)}
      </div>
    </div>
  );
}

/* ============================================================
 *  Career Gap Detector  (Signature AI feature)
 *  ============================================================ */

type Roadmap = {
  readiness: number;
  verdict: string;
  matched_skills: string[];
  missing_skills: { skill: string; priority: "critical" | "important" | "nice-to-have"; why: string }[];
  hidden_gaps: string[];
  roadmap: { week: string; focus: string; actions: string[]; deliverable: string }[];
  resume_moves: string[];
};

export function CareerGapDetector({
  resume,
  onAddSkill,
}: {
  resume: WorkspaceResume;
  onAddSkill: (skill: string) => void;
}) {
  const [target, setTarget] = useState(resume.role || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Roadmap | null>(null);

  const run = async () => {
    if (!target.trim()) {
      setError("Enter a target role first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "career-gap",
          skills: resume.skills,
          existingProjects: resume.projects.map((p) => p.name),
          targetRole: target,
          resumeSummary: resume.summary,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as Roadmap;
      if (!json?.roadmap) throw new Error("Malformed response");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white">
          <Compass className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold leading-none">
            AI Career Gap Detector <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">Signature</span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Compare your resume to any target role — get a 90-day roadmap.
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="e.g. Senior Backend Engineer at Stripe"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-white shadow-elegant hover:opacity-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
          Analyze
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          <TriangleAlert className="h-3.5 w-3.5" /> {error}
        </div>
      )}

      {data && (
        <div className="mt-5 space-y-5 animate-fade-in">
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-accent/50 to-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Readiness for {target}
                </div>
                <div className="mt-0.5 text-3xl font-bold gradient-text">{data.readiness}%</div>
              </div>
              <ReadinessRing value={data.readiness} />
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-foreground/85">{data.verdict}</p>
          </div>

          {data.matched_skills.length > 0 && (
            <div>
              <SectionLabel>What already matches</SectionLabel>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {data.matched_skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success"
                  >
                    <Check className="mr-1 inline h-3 w-3" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.missing_skills.length > 0 && (
            <div>
              <SectionLabel>Gaps to close</SectionLabel>
              <ul className="mt-1.5 space-y-1.5">
                {data.missing_skills.map((m) => (
                  <li
                    key={m.skill}
                    className="flex items-start gap-2 rounded-lg border border-border/60 bg-surface/40 px-3 py-2"
                  >
                    <PriorityDot priority={m.priority} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold">{m.skill}</span>
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {m.priority}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{m.why}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddSkill(m.skill)}
                      className="rounded-md border border-border bg-white px-2 py-1 text-[10px] font-semibold hover:bg-surface-2"
                    >
                      + Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.hidden_gaps?.length > 0 && (
            <div>
              <SectionLabel>Hidden gaps a recruiter will spot</SectionLabel>
              <ul className="mt-1.5 space-y-1">
                {data.hidden_gaps.map((g, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12px] text-foreground/85"
                  >
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" /> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <SectionLabel>90-day roadmap</SectionLabel>
            <ol className="mt-2 space-y-3 border-l border-border/60 pl-4">
              {data.roadmap.map((step, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 grid h-4 w-4 place-items-center rounded-full gradient-primary text-[9px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    {step.week}
                  </div>
                  <div className="text-[13px] font-semibold">{step.focus}</div>
                  <ul className="mt-1 space-y-0.5">
                    {step.actions.map((a, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-[12px] text-foreground/85">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-1 rounded-md bg-accent/40 px-2 py-1 text-[11px]">
                    <span className="font-semibold text-accent-foreground">Deliverable:</span>{" "}
                    {step.deliverable}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {data.resume_moves?.length > 0 && (
            <div>
              <SectionLabel>Immediate resume moves</SectionLabel>
              <ul className="mt-1.5 space-y-1">
                {data.resume_moves.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-surface/40 px-3 py-1.5 text-[12px]"
                  >
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReadinessRing({ value }: { value: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} stroke="oklch(0.94 0.01 260)" strokeWidth="6" fill="none" />
      <defs>
        <linearGradient id="readyg" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.58 0.22 310)" />
          <stop offset="100%" stopColor="oklch(0.6 0.22 265)" />
        </linearGradient>
      </defs>
      <circle
        cx="32"
        cy="32"
        r={r}
        stroke="url(#readyg)"
        strokeWidth="6"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 700ms" }}
      />
    </svg>
  );
}

function PriorityDot({ priority }: { priority: "critical" | "important" | "nice-to-have" }) {
  const color =
    priority === "critical" ? "bg-destructive" : priority === "important" ? "bg-orange-500" : "bg-muted-foreground/60";
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

/* ============================================================
 *  Interview Coach — predicted questions for the target role
 *  ============================================================ */

type InterviewQuestion = {
  category: "Behavioral" | "Technical" | "System Design" | "Project Deep-Dive";
  question: string;
  why_asked: string;
  star_hint: string;
};

export function InterviewCoach({ resume }: { resume: WorkspaceResume }) {
  const [target, setTarget] = useState(resume.role || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [open, setOpen] = useState<number | null>(0);

  const run = async () => {
    if (!target.trim()) {
      setError("Enter a target role first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "interview-prep",
          skills: resume.skills,
          existingProjects: resume.projects.map((p) => p.name),
          targetRole: target,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { questions?: InterviewQuestion[] };
      if (!json?.questions?.length) throw new Error("Malformed response");
      setQuestions(json.questions);
      setOpen(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questions) map.set(q.category, (map.get(q.category) ?? 0) + 1);
    return Array.from(map.entries());
  }, [questions]);

  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <MessageSquareQuote className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold leading-none">Interview Coach</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Predicted questions tailored to your resume + target role.
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target role — e.g. Full-Stack Engineer"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-white shadow-elegant hover:opacity-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Generate
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          <TriangleAlert className="h-3.5 w-3.5" /> {error}
        </div>
      )}

      {questions.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {grouped.map(([cat, n]) => (
              <span
                key={cat}
                className="rounded-full border border-border/60 bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
              >
                {cat} · {n}
              </span>
            ))}
          </div>

          <ul className="mt-3 space-y-2">
            {questions.map((q, i) => {
              const isOpen = open === i;
              return (
                <li
                  key={i}
                  className="rounded-xl border border-border/60 bg-surface/40 transition hover:border-primary/30"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                        {q.category}
                      </div>
                      <div className="mt-0.5 text-[13px] font-medium leading-snug">
                        {q.question}
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/60 px-3 py-2 animate-fade-in">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Why they ask
                      </div>
                      <p className="mt-0.5 text-[12px] text-foreground/85">{q.why_asked}</p>
                      <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        STAR hint
                      </div>
                      <p className="mt-0.5 rounded-md bg-accent/40 px-2 py-1 text-[12px]">
                        {q.star_hint}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/* ============================================================
 *  History Timeline — activity log of resume updates
 *  ============================================================ */

export type HistoryEvent = { id: string; at: number; text: string };

export function HistoryTimeline({ events, onClear }: { events: HistoryEvent[]; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-white">
          <History className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold leading-none">Edit History</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Everything Aria has updated in this session.
          </div>
        </div>
        {events.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-border bg-white px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-surface-2"
          >
            Clear
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-surface/40 p-4 text-center text-[12px] text-muted-foreground">
          No edits yet — start chatting and updates will land here.
        </div>
      ) : (
        <ol className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
          {events
            .slice()
            .reverse()
            .map((e) => (
              <li key={e.id} className="flex items-start gap-2 rounded-lg bg-surface/40 px-3 py-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full gradient-primary" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] leading-snug">{e.text}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(e.at).toLocaleTimeString()}
                  </div>
                </div>
              </li>
            ))}
        </ol>
      )}
    </div>
  );
}
