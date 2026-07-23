import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wand2,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  X,
  Rocket,
  Copy,
  FileCode2,
  Github,
  Plus,
  Lightbulb,
  ChevronRight,
} from "lucide-react";

// ---------------- API helper ----------------
async function generate(body) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// ---------------- Rewrite Button + Modal ----------------
const DEFAULT_MODES = [
  "ATS-Optimized",
  "Professional",
  "Concise",
  "FAANG",
  "Startup",
  "Impact-Focused",
];

export function RewriteButton({
  text,
  section,
  modes = DEFAULT_MODES,
  onAccept,
  label = "AI Rewrite",
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const canRun = !!text?.trim();
  return (
    <>
      <button
        type="button"
        disabled={disabled || !canRun}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-white px-2 py-0.5 text-[10px] font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
        title={canRun ? "Rewrite with AI" : "Nothing to rewrite yet"}
      >
        <Wand2 className="h-3 w-3" />
        {label}
      </button>
      {open && (
        <RewriteModal
          text={text}
          section={section}
          modes={modes}
          onAccept={(t) => {
            onAccept(t);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function RewriteModal({
  text,
  section,
  modes,
  onAccept,
  onClose,
}) {
  const [variants, setVariants] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generate({
        action: "rewrite",
        section,
        text,
        modes,
      });
      setVariants(data.variants ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [text, section, modes]);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <Modal onClose={onClose} title="AI Rewrite" subtitle={`Pick a rewrite style for your ${section}.`}>
      <div className="mb-3 rounded-xl bg-surface p-3 text-xs text-foreground/80">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Original
        </div>
        {text}
      </div>

      {loading && <SkeletonList count={modes.length} />}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {!loading && variants && (
        <div className="scrollbar-thin max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {variants.map((v, i) => (
            <VariantCard key={`${v.label}-${i}`} variant={v} onAccept={() => onAccept(v.text)} />
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Regenerate
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

function VariantCard({ variant, onAccept }) {
  return (
    <div className="group rounded-xl border border-border bg-white p-3 transition hover:border-primary/40 hover:shadow-elegant">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          <Sparkles className="h-2.5 w-2.5" />
          {variant.label}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(variant.text)}
            className="grid h-6 w-6 place-items-center rounded-md border border-border bg-white text-muted-foreground hover:text-foreground"
            title="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="inline-flex items-center gap-1 rounded-md gradient-primary px-2 py-1 text-[11px] font-semibold text-white shadow-elegant hover:opacity-95"
          >
            <Check className="h-3 w-3" /> Use this
          </button>
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{variant.text}</p>
    </div>
  );
}

// ---------------- Achievement Generator ----------------
export function AchievementGenerator({
  onAdd,
}) {
  const [raw, setRaw] = useState("");
  const [variants, setVariants] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run() {
    if (!raw.trim()) return;
    setLoading(true);
    setError(null);
    setVariants(null);
    try {
      const data = await generate({
        action: "achievement",
        raw,
      });
      setVariants(data.variants ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <Wand2 className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">Achievement Generator</div>
          <div className="text-[11px] text-muted-foreground">
            Turn vague wins into three tone-tuned resume bullets.
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-end gap-2 rounded-xl border border-border bg-white p-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void run();
            }
          }}
          rows={2}
          placeholder="e.g. built an ecommerce site with cart and payments"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={run}
          disabled={loading || !raw.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow-elegant transition hover:opacity-95 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Generate 3 tones
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading && <SkeletonList count={3} />}

      {variants && !loading && (
        <div className="mt-3 space-y-2">
          {variants.map((v, i) => (
            <div
              key={`${v.label}-${i}`}
              className="animate-slide-up rounded-xl border border-border bg-white p-3 transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                  <Sparkles className="h-2.5 w-2.5" /> {v.label}
                </span>
                <button
                  onClick={() => {
                    onAdd(v.text);
                    setRaw("");
                    setVariants(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-md gradient-primary px-2 py-1 text-[11px] font-semibold text-white hover:opacity-95"
                >
                  <Plus className="h-3 w-3" /> Add to resume
                </button>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{v.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Project Generator ----------------
export function ProjectGeneratorCard({
  skills,
  role,
  existingProjects,
  onAddProject,
}) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buildingIdx, setBuildingIdx] = useState(null);
  const [built, setBuilt] = useState(null);

  const canSuggest = skills.length > 0;

  async function suggest() {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const data = await generate({
        action: "project-suggest",
        skills,
        role,
        existingProjects,
      });
      setSuggestions(data.suggestions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function buildFull(s, i) {
    setBuildingIdx(i);
    setError(null);
    try {
      const data = await generate({
        action: "project-full",
        name: s.name,
        tech: s.tech,
        idea: s.tagline,
      });
      setBuilt(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBuildingIdx(null);
    }
  }

  const gapHint = useMemo(() => {
    const s = new Set(skills.map((x) => x.toLowerCase()));
    const backend = ["node", "express", "django", "flask", "fastapi", "spring"].some((k) => s.has(k));
    const db = ["mongodb", "postgres", "postgresql", "mysql", "sqlite", "redis"].some((k) => s.has(k));
    if (!backend) return "Consider one more backend-heavy project.";
    if (!db) return "A data-heavy project would round out the resume.";
    return "One more polished, deployed project would round this out.";
  }, [skills]);

  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
            <Rocket className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">AI Project Generator</div>
            <div className="text-[11px] text-muted-foreground">
              {canSuggest ? gapHint : "Chat with Aria to add skills first — then I can suggest projects."}
            </div>
          </div>
        </div>
        <button
          onClick={suggest}
          disabled={loading || !canSuggest}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow-elegant transition hover:opacity-95 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
          Suggest projects
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading && <SkeletonList count={4} />}

      {suggestions && !loading && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {suggestions.map((s, i) => (
            <div
              key={`${s.name}-${i}`}
              className="animate-slide-up rounded-xl border border-border bg-white p-3 transition hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{s.name}</div>
                {s.difficulty && (
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {s.difficulty}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[12px] leading-snug text-foreground/85">{s.tagline}</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {s.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-surface p-1.5 text-[11px] text-muted-foreground">
                <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
                <span>{s.why}</span>
              </div>
              <button
                onClick={() => void buildFull(s, i)}
                disabled={buildingIdx !== null}
                className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-primary/25 bg-white py-1 text-[11px] font-semibold text-primary hover:bg-primary/5 disabled:opacity-40"
              >
                {buildingIdx === i ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3" /> Generate full project
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {built && (
        <FullProjectModal
          data={built}
          onClose={() => setBuilt(null)}
          onAdd={() => {
            onAddProject({
              name: built.project.name,
              description: built.project.description,
              tech: built.project.tech,
              resume_bullets: built.resume_bullets,
              github_description: built.github_description,
              readme: built.readme,
            });
            setBuilt(null);
          }}
        />
      )}
    </div>
  );
}

function FullProjectModal({
  data,
  onAdd,
  onClose,
}) {
  const [tab, setTab] = useState("resume");
  return (
    <Modal
      title={data.project.name}
      subtitle="Full project package — pick any part and add to your resume."
      onClose={onClose}
      wide
    >
      <div className="flex flex-wrap gap-1 rounded-xl bg-surface p-1">
        {[
          { id: "resume", label: "Resume Bullets", icon: Sparkles },
          { id: "readme", label: "README.md", icon: FileCode2 },
          { id: "github", label: "GitHub Description", icon: Github },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === t.id
                  ? "bg-white text-foreground shadow-elegant"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 scrollbar-thin max-h-[46vh] overflow-y-auto rounded-xl border border-border bg-white p-4">
        {tab === "resume" && (
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Description
            </div>
            <p className="text-sm leading-relaxed">{data.project.description}</p>
            <div className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Bullets
            </div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              {data.resume_bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-1">
              {data.project.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {tab === "readme" && (
          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-foreground/90">
            {data.readme}
          </pre>
        )}
        {tab === "github" && (
          <div>
            <div className="text-sm">{data.github_description}</div>
            <button
              onClick={() => void navigator.clipboard?.writeText(data.github_description)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          onClick={() =>
            void navigator.clipboard?.writeText(
              tab === "readme" ? data.readme : tab === "github" ? data.github_description : data.resume_bullets.join("\n"),
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
        >
          <Copy className="h-3.5 w-3.5" /> Copy current tab
        </button>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-elegant hover:opacity-95"
        >
          <Plus className="h-3.5 w-3.5" /> Add to resume
        </button>
      </div>
    </Modal>
  );
}

// ---------------- Primitives ----------------
function Modal({
  children,
  title,
  subtitle,
  onClose,
  wide,
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-xl"} overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-glow animate-slide-up`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-3 pr-8">
          <div className="text-base font-bold tracking-tight">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

function SkeletonList({ count }) {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border bg-white p-3"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-3 w-24 rounded bg-surface-2" />
          <div className="mt-2 h-2.5 w-full rounded bg-surface" />
          <div className="mt-1.5 h-2.5 w-5/6 rounded bg-surface" />
        </div>
      ))}
    </div>
  );
}
