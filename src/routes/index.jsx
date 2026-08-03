import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Sparkles,
  Send,
  Check,
  Download,
  FileDown,
  Pencil,
  BarChart3,
  Github,
  Linkedin,
  Globe,
  Mail,
  Phone,
  Award,
  GraduationCap,
  Briefcase,
  Rocket,
  Lightbulb,
  X,
  CircleCheck,
  Brain,
  Zap,
  TriangleAlert,
  ScanSearch,
  CircleDashed,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { RewriteButton, AchievementGenerator, ProjectGeneratorCard } from "@/components/ai-tools";
import {
  AnalysisSectionHeader,
  AtsHeatmap,
  ResumeRadar,
  JobMatchSimulator,
  ResumeAnalytics,
  MissingSectionsCard,
} from "@/components/analysis-tools";
import { ResumeAnalysisPage } from "@/components/analysis-page";
import {
  ResumeVersionsCard,
  useResumeVersions,
  CareerGapDetector,
  InterviewCoach,
  HistoryTimeline,
} from "@/components/workspace-tools";
import { AppSidebar, TopBar } from "@/components/dashboard-shell";
import { DashboardHome } from "@/components/dashboard-home";
import { LandingPage } from "@/components/landing/landing-page";

export const Route = createFileRoute("/")({
  component: SmartHireApp,
});

// ---------- Initial data ----------
const initialResume = {
  name: "",
  role: "",
  email: "",
  phone: "",
  github: "",
  portfolio: "",
  linkedin: "",
  location: "",
  summary: "",
  education: [],
  projects: [],
  skills: [],
  experience: [],
  certifications: [],
  achievements: [],
};

const JOURNEY = [
  { key: "personal", label: "Personal Details" },
  { key: "summary", label: "Summary" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "achievements", label: "Achievements" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

const OPENER = {
  id: "opener",
  role: "assistant",
  text: "Hi 👋 I'm Aria, your AI resume coach. Instead of a form, let's just talk — I'll build a polished, ATS-ready resume on the right as we chat. To kick us off, what's your **full name** and the role you're aiming for?",
};

// ---------- Main app ----------
function SmartHireApp() {
  const [resume, setResume] = useState(initialResume);
  const [messages, setMessages] = useState([OPENER]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [reasoning, setReasoning] = useState([
    { kind: "thinking", text: "Waiting for your first message…" },
  ]);
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [missing, setMissing] = useState(["Personal details", "Summary", "Projects", "Skills"]);
  const [confidence, setConfidence] = useState(10);
  const [completedSections, setCompletedSections] = useState([]);
  const [recentlyChanged, setRecentlyChanged] = useState(new Set());
  const [completed, setCompleted] = useState(false);
  const [template, setTemplate] = useState("Minimal");
  const [history, setHistory] = useState([]);
  const versions = useResumeVersions();
  const [view, setView] = useState("landing");
  const [search, setSearch] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const pushHistory = useCallback((text) => {
    setHistory((h) => [...h, { id: uid(), at: Date.now(), text }].slice(-80));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [thinking]);

  const flashChange = useCallback((keys) => {
    if (keys.length === 0) return;
    setRecentlyChanged((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });
    window.setTimeout(() => {
      setRecentlyChanged((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });
    }, 3500);
  }, []);

  const applyPatch = useCallback(
    (patch) => {
      const changed = [];
      setResume((r) => {
        const next = { ...r };
        const setField = (k, v) => {
          if (v == null || v === "") return;
          if (next[k] !== v) {
            next[k] = v;
            changed.push(String(k));
          }
        };
        setField("name", patch.name);
        setField("email", patch.email);
        setField("phone", patch.phone);
        setField("github", patch.github);
        setField("linkedin", patch.linkedin);
        setField("portfolio", patch.portfolio);
        setField("location", patch.location);
        setField("role", patch.role);
        setField("summary", patch.summary);

        if (patch.add_skills?.length) {
          const merged = Array.from(new Set([...next.skills, ...patch.add_skills]));
          if (merged.length !== next.skills.length) {
            next.skills = merged;
            changed.push("skills");
          }
        }
        if (patch.add_certifications?.length) {
          next.certifications = Array.from(
            new Set([...next.certifications, ...patch.add_certifications]),
          );
          changed.push("certifications");
        }
        if (patch.add_achievements?.length) {
          next.achievements = Array.from(
            new Set([...next.achievements, ...patch.add_achievements]),
          );
          changed.push("achievements");
        }
        if (patch.add_project) {
          const p = patch.add_project;
          const existingIdx = next.projects.findIndex(
            (x) => x.name.toLowerCase() === p.name.toLowerCase(),
          );
          const proj = {
            name: p.name,
            description: p.description,
            tech: p.tech ?? [],
            quality: Math.min(96, 70 + (p.description?.length ?? 0) / 8),
          };
          if (existingIdx >= 0) {
            next.projects = next.projects.map((x, i) => (i === existingIdx ? proj : x));
          } else {
            next.projects = [...next.projects, proj];
          }
          changed.push("projects");
        }
        if (patch.add_experience) {
          const e = patch.add_experience;
          next.experience = [
            ...next.experience.filter((x) => x.company.toLowerCase() !== e.company.toLowerCase()),
            e,
          ];
          changed.push("experience");
        }
        if (patch.remove_project) {
          const key = patch.remove_project.toLowerCase();
          next.projects = next.projects.filter((p) => !p.name.toLowerCase().includes(key));
          changed.push("projects");
        }
        if (patch.remove_experience) {
          const key = patch.remove_experience.toLowerCase();
          next.experience = next.experience.filter(
            (p) => !p.company.toLowerCase().includes(key) && !p.role.toLowerCase().includes(key),
          );
          changed.push("experience");
        }
        if (patch.remove_skill) {
          const key = patch.remove_skill.toLowerCase();
          const before = next.skills.length;
          next.skills = next.skills.filter((s) => s.toLowerCase() !== key);
          if (next.skills.length !== before) changed.push("skills");
        }
        return next;
      });
      const uniq = Array.from(new Set(changed));
      flashChange(uniq);
      if (uniq.length) pushHistory(`Updated: ${uniq.join(", ")}`);
    },
    [flashChange, pushHistory],
  );

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const userMsg = { id: uid(), role: "user", text: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setThinking(true);
    setReasoning([{ kind: "thinking", text: "Reading your answer…" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.text,
          })),
          resume,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      applyPatch(data.patch ?? {});
      setReasoning(
        data.reasoning?.length
          ? data.reasoning
          : [{ kind: "thinking", text: "Processed your answer." }],
      );
      if (data.detected_skills?.length) {
        setDetectedSkills((prev) =>
          Array.from(new Set([...prev, ...data.detected_skills])).slice(-12),
        );
      }
      if (data.missing) setMissing(data.missing.slice(0, 8));
      if (typeof data.confidence === "number")
        setConfidence(Math.max(0, Math.min(100, data.confidence)));
      if (data.journey_complete?.length) {
        setCompletedSections((prev) => Array.from(new Set([...prev, ...data.journey_complete])));
      }
      setMessages((m) => [...m, { id: uid(), role: "assistant", text: data.reply }]);
      if (data.done) setTimeout(() => setCompleted(true), 700);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          text: "I ran into a hiccup reaching my brain. Mind trying that once more?",
        },
      ]);
      setReasoning([
        { kind: "warning", text: err instanceof Error ? err.message : "Network error" },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function handleSubmit(e) {
    e?.preventDefault();
    void sendMessage(input);
  }

  const progress = Math.round((completedSections.length / JOURNEY.length) * 100);
  const score = useMemo(() => computeScore(resume, confidence), [resume, confidence]);

  const jumpToSection = (key) => {
    const el = document.getElementById(`section-${key}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateSummary = useCallback(
    (text) => {
      setResume((r) => ({ ...r, summary: text }));
      flashChange(["summary"]);
    },
    [flashChange],
  );

  const updateProjectDescription = useCallback(
    (name, text) => {
      setResume((r) => ({
        ...r,
        projects: r.projects.map((p) => (p.name === name ? { ...p, description: text } : p)),
      }));
      flashChange(["projects"]);
    },
    [flashChange],
  );

  const addAchievement = useCallback(
    (text) => {
      setResume((r) => ({ ...r, achievements: Array.from(new Set([...r.achievements, text])) }));
      flashChange(["achievements"]);
      setCompletedSections((prev) => Array.from(new Set([...prev, "achievements"])));
    },
    [flashChange],
  );

  const addGeneratedProject = useCallback(
    (p) => {
      applyPatch({ add_project: p });
      setCompletedSections((prev) => Array.from(new Set([...prev, "projects"])));
    },
    [applyPatch],
  );

  const addSkill = useCallback(
    (skill) => {
      const clean = skill.trim();
      if (!clean) return;
      setResume((r) =>
        r.skills.some((s) => s.toLowerCase() === clean.toLowerCase())
          ? r
          : { ...r, skills: [...r.skills, clean] },
      );
      flashChange(["skills"]);
    },
    [flashChange],
  );

  const restoreVersion = useCallback(
    (snap) => {
      setResume(snap);
      flashChange([
        "name",
        "email",
        "phone",
        "github",
        "linkedin",
        "portfolio",
        "location",
        "role",
        "summary",
        "skills",
        "projects",
        "experience",
        "certifications",
        "achievements",
      ]);
      pushHistory("Restored a saved version");
    },
    [flashChange, pushHistory],
  );

  const saveVersion = useCallback(
    (label) => {
      versions.save(label, resume);
      pushHistory(`Saved version "${label || "Current draft"}"`);
    },
    [resume, versions, pushHistory],
  );

  const nextSection = JOURNEY.find((s) => !completedSections.includes(s.key)) ?? null;
  const isDashboard = view === "dashboard";
  const isAnalysis = view === "analysis";

  const handleNavigate = (key) => {
    setView(key);
    if (key !== "dashboard") {
      window.setTimeout(() => {
        const el = document.getElementById(key === "builder" ? "chat-panel" : `panel-${key}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  };

  if (view === "landing") {
    return (
      <LandingPage
        resume={resume}
        progress={progress}
        score={score}
        onStart={() => setView("dashboard")}
        onLogin={() => {
          window.location.href = "/auth";
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1700px]">

        <AppSidebar
          active={view}
          onNavigate={handleNavigate}
          journey={isDashboard || isAnalysis ? null : JOURNEY}
          completed={completedSections}
          progress={progress}
          onJump={jumpToSection}
          name={resume.name}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            title={isDashboard ? "Dashboard" : isAnalysis ? "Resume Analysis" : "Resume Builder"}
            subtitle={
              isDashboard
                ? "Your resume health at a glance"
                : isAnalysis
                  ? "Detailed insights and AI-powered feedback"
                  : "Chat with Aria — your resume updates live"
            }
            query={search}
            onQueryChange={setSearch}
            notifications={missing.length}
            name={resume.name}
          />

          {isDashboard ? (
            <DashboardHome
              resume={resume}
              score={score}
              progress={progress}
              confidence={confidence}
              versions={versions.versions}
              history={history}
              missing={missing}
              nextSection={nextSection}
              onNavigate={handleNavigate}
              onRestoreVersion={restoreVersion}
              onDownload={() => window.print()}
            />
          ) : isAnalysis ? (
            <ResumeAnalysisPage
              resume={resume}
              score={score}
              missing={missing}
              versions={versions.versions}
              analyzing={thinking}
              onAddSkill={addSkill}
              onDownload={() => window.print()}
              onReanalyze={() => void sendMessage("Re-analyze my resume and tell me what to improve.")}
              onRestoreVersion={restoreVersion}
            />
          ) : (
            <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:flex-row lg:gap-5 lg:p-6">
              <div id="chat-panel" className="flex min-w-0 flex-1 lg:max-w-[540px] xl:max-w-[620px]">
                <ChatPanel
                  messages={messages}
                  input={input}
                  setInput={setInput}
                  onSubmit={handleSubmit}
                  thinking={thinking}
                  inputRef={inputRef}
                  chatEndRef={chatEndRef}
                  reasoning={reasoning}
                  detectedSkills={detectedSkills}
                  missing={missing}
                  confidence={confidence}
                />
              </div>

              <RightPanel
                resume={resume}
                score={score}
                template={template}
                setTemplate={setTemplate}
                recentlyChanged={recentlyChanged}
                onUpdateSummary={updateSummary}
                onUpdateProjectDescription={updateProjectDescription}
                onAddAchievement={addAchievement}
                onAddGeneratedProject={addGeneratedProject}
                onAddSkill={addSkill}
                versions={versions.versions}
                onSaveVersion={saveVersion}
                onRestoreVersion={restoreVersion}
                onDeleteVersion={versions.remove}
                history={history}
                onClearHistory={() => setHistory([])}
              />
            </main>
          )}
        </div>
      </div>
      {completed && <CelebrationModal score={score} onClose={() => setCompleted(false)} />}
    </div>
  );
}


// ---------- Journey sidebar ----------
function JourneySidebar({ completed, progress, onJump, confidence }) {
  const activeIdx = completed.length;
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border/60 bg-white/60 p-5 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-glow">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight">
            SmartHire<span className="gradient-text"> AI</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Resume Coach
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-gradient-to-br from-accent/50 to-white p-4">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Resume Journey</span>
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full gradient-primary transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          Confidence <span className="font-semibold text-foreground">{confidence}%</span>
        </div>
      </div>

      <nav className="mt-5 flex flex-col gap-1">
        {JOURNEY.map((s, i) => {
          const done = completed.includes(s.key);
          const isCurrent = !done && i === activeIdx;
          return (
            <button
              key={s.key}
              onClick={() => onJump(s.key)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                done
                  ? "text-foreground hover:bg-surface-2"
                  : isCurrent
                    ? "bg-white text-foreground shadow-elegant"
                    : "text-muted-foreground/70 hover:bg-surface-2"
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition ${
                  done
                    ? "gradient-primary text-white shadow-elegant animate-scale-in"
                    : isCurrent
                      ? "bg-primary/10 text-primary ring-2 ring-primary/25"
                      : "bg-surface-2 text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isCurrent ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CircleDashed className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="flex-1">{s.label}</span>
              {done && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-success">
                  Done
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border/60 bg-gradient-to-br from-accent/60 to-white p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-accent-foreground">
          <Rocket className="h-3.5 w-3.5" /> Upgrade to Pro
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Unlimited resumes, AI cover letters, and priority job tailoring.
        </p>
        <button className="mt-3 w-full rounded-lg gradient-primary py-2 text-xs font-semibold text-white shadow-elegant transition hover:opacity-95">
          Get Pro — ₹399/mo
        </button>
      </div>
    </aside>
  );
}

// ---------- Chat Panel ----------
function ChatPanel(props) {
  const {
    messages,
    input,
    setInput,
    onSubmit,
    thinking,
    inputRef,
    chatEndRef,
    reasoning,
    detectedSkills,
    missing,
    confidence,
  } = props;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-[540px] xl:max-w-[620px]">
      <ThinkingPanel
        reasoning={reasoning}
        detectedSkills={detectedSkills}
        missing={missing}
        confidence={confidence}
        thinking={thinking}
      />

      {/* Chat */}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/60 bg-white/80 shadow-elegant backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-tight">Aria — Resume Coach</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
              Online · Gemini-powered · Understands natural language
            </div>
          </div>
          <span className="hidden rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground sm:inline">
            Conversational AI
          </span>
        </div>

        <div
          className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-5 py-5"
          style={{ maxHeight: "58vh", minHeight: "40vh" }}
        >
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {thinking && (
            <div className="flex animate-fade-in items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-surface px-4 py-2.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    <Dot delay={0} />
                    <Dot delay={150} />
                    <Dot delay={300} />
                  </span>
                  Aria is thinking…
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={onSubmit} className="border-t border-border/60 p-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-white p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              rows={1}
              disabled={thinking}
              placeholder={
                thinking
                  ? "Aria is thinking…"
                  : "Say anything — 'change my project', 'add Docker', 'make my summary punchier'…"
              }
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-white shadow-elegant transition hover:opacity-95 disabled:opacity-40"
            >
              {thinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-1.5 px-1 text-[11px] text-muted-foreground">
            Talk naturally — Aria remembers everything you've said and updates the resume live.
          </div>
        </form>
      </div>
    </section>
  );
}

function Bubble({ msg }) {
  const isAI = msg.role === "assistant";
  return (
    <div className={`flex animate-fade-in gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
          isAI ? "gradient-primary text-white" : "bg-surface-2 text-foreground"
        }`}
      >
        {isAI ? <Sparkles className="h-4 w-4" /> : "You"}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAI ? "bg-surface text-foreground" : "gradient-primary text-white shadow-elegant"
        }`}
      >
        <span
          dangerouslySetInnerHTML={{
            __html: msg.text
              .replace(/\n/g, "<br/>")
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
          }}
        />
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
      style={{ animation: `pulse-glow 1.2s ${delay}ms infinite ease-in-out` }}
    />
  );
}

// ---------- Thinking Panel ----------
function ThinkingPanel({ reasoning, detectedSkills, missing, confidence, thinking }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-elegant backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
            <Brain className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-none">AI Reasoning</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              Live thoughts from Aria as you chat
            </div>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            thinking ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
          }`}
        >
          {thinking ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <Zap className="h-3 w-3" /> Ready · {confidence}%
            </>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {reasoning.slice(0, 5).map((r, i) => (
          <li
            key={`${r.text}-${i}`}
            className="flex items-start gap-2 rounded-lg bg-surface/60 px-2.5 py-1.5 text-[12px] leading-snug animate-fade-in"
          >
            <ReasoningIcon kind={r.kind} />
            <span className="min-w-0 text-foreground/85">{r.text}</span>
          </li>
        ))}
      </ul>

      {(detectedSkills.length > 0 || missing.length > 0) && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Detected
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {detectedSkills.length === 0 ? (
                <span className="text-[11px] text-muted-foreground">—</span>
              ) : (
                detectedSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"
                  >
                    {s}
                  </span>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Missing
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {missing.length === 0 ? (
                <span className="text-[11px] text-muted-foreground">Nothing critical</span>
              ) : (
                missing.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-orange-300/60 bg-orange-100/50 px-2 py-0.5 text-[10px] font-semibold text-orange-700"
                  >
                    {s}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReasoningIcon({ kind }) {
  if (kind === "warning")
    return <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />;
  if (kind === "strength") return <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />;
  if (kind === "detected") return <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />;
  return <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

// ---------- Right Panel ----------
function RightPanel({
  resume,
  score,
  template,
  setTemplate,
  recentlyChanged,
  onUpdateSummary,
  onUpdateProjectDescription,
  onAddAchievement,
  onAddGeneratedProject,
  onAddSkill,
  versions,
  onSaveVersion,
  onRestoreVersion,
  onDeleteVersion,
  history,
  onClearHistory,
}) {
  const workspaceResume = {
    name: resume.name,
    role: resume.role,
    summary: resume.summary,
    skills: resume.skills,
    projects: resume.projects.map((p) => ({
      name: p.name,
      description: p.description,
      tech: p.tech,
    })),
  };
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <ScoreCard score={score} />
        <SuggestionsCard />
      </div>
      <ResumePreview
        resume={resume}
        template={template}
        recentlyChanged={recentlyChanged}
        onUpdateSummary={onUpdateSummary}
        onUpdateProjectDescription={onUpdateProjectDescription}
      />

      <ProjectGeneratorCard
        skills={resume.skills}
        role={resume.role}
        existingProjects={resume.projects.map((p) => p.name)}
        onAddProject={(p) =>
          onAddGeneratedProject({ name: p.name, description: p.description, tech: p.tech })
        }
      />

      <AchievementGenerator onAdd={onAddAchievement} />

      <AnalysisSectionHeader />
      <div className="grid gap-5 xl:grid-cols-2">
        <AtsHeatmap resume={resume} onAddSkill={onAddSkill} />
        <ResumeRadar resume={resume} />
        <JobMatchSimulator resume={resume} />
        <ResumeAnalytics resume={resume} />
      </div>
      <MissingSectionsCard resume={resume} />

      <div className="mt-2 flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-elegant">
          Career Workspace
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
      <CareerGapDetector resume={workspaceResume} onAddSkill={onAddSkill} />
      <div className="grid gap-5 xl:grid-cols-2">
        <InterviewCoach resume={workspaceResume} />
        <ResumeVersionsCard
          current={resume}
          versions={versions}
          onSave={onSaveVersion}
          onRestore={onRestoreVersion}
          onDelete={onDeleteVersion}
          describe={(s) =>
            `${s.projects.length} projects · ${s.skills.length} skills${s.role ? ` · ${s.role}` : ""}`
          }
        />
      </div>
      <HistoryTimeline events={history} onClear={onClearHistory} />

      <TemplateGallery template={template} setTemplate={setTemplate} />
    </section>
  );
}

// ---------- Score card ----------
function ScoreCard({ score }) {
  const metrics = [
    { label: "ATS", value: score.ats, color: "from-indigo-500 to-blue-500" },
    { label: "Grammar", value: score.grammar, color: "from-emerald-500 to-teal-500" },
    { label: "Impact", value: score.impact, color: "from-orange-400 to-rose-500" },
    { label: "Readability", value: score.readability, color: "from-sky-400 to-indigo-500" },
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resume Score
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight gradient-text">{score.overall}</span>
            <span className="text-sm font-medium text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
            <BarChart3 className="h-3 w-3" /> Live tracked
          </div>
        </div>
        <RingScore value={score.overall} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border/60 bg-surface p-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>{m.label}</span>
              <span className="text-foreground">{m.value}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-500`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RingScore({ value }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} stroke="oklch(0.94 0.01 260)" strokeWidth="8" fill="none" />
      <defs>
        <linearGradient id="ringg" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.58 0.22 265)" />
          <stop offset="100%" stopColor="oklch(0.6 0.2 245)" />
        </linearGradient>
      </defs>
      <circle
        cx="36"
        cy="36"
        r={r}
        stroke="url(#ringg)"
        strokeWidth="8"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 700ms" }}
      />
    </svg>
  );
}

// ---------- Suggestions ----------
function SuggestionsCard() {
  const items = [
    "Add quantified achievements to top project",
    "Mention deployment (Vercel / AWS)",
    "Highlight REST API design experience",
    "Show Git workflow & branching strategy",
    "Add metrics (users, %, latency)",
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-warning/15 text-warning-foreground">
          <Lightbulb className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <div className="text-sm font-semibold">AI Suggestions</div>
          <div className="text-[11px] text-muted-foreground">5 quick wins to boost your score</div>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((t, i) => (
          <li
            key={t}
            className="flex items-start gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-sm transition hover:border-border/60 hover:bg-surface"
            style={{ animation: `slide-up 0.4s ${i * 60}ms both` }}
          >
            <div className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success/15 text-success">
              <Check className="h-3 w-3" />
            </div>
            <span className="min-w-0 text-foreground/90">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Resume Preview ----------
function ResumePreview({
  resume,
  template,
  recentlyChanged,
  onUpdateSummary,
  onUpdateProjectDescription,
}) {
  const displayName = resume.name || "Your Name";
  const changed = (keys) => keys.some((k) => recentlyChanged.has(k));

  return (
    <div className="rounded-2xl border border-border/60 bg-white shadow-elegant">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Live Preview</span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
            {template}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2">
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2">
            <FileDown className="h-3.5 w-3.5" /> DOCX
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-[720px] rounded-xl border border-border/60 bg-white p-8 shadow-sm">
          {/* Header */}
          <ChangeWrap
            id="section-personal"
            active={changed([
              "name",
              "email",
              "phone",
              "github",
              "linkedin",
              "portfolio",
              "location",
              "role",
            ])}
            label="Updated"
          >
            <div className="border-b border-border pb-4">
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              <div className="text-sm font-medium text-primary">
                {resume.role || "Add your target role"}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                {resume.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {resume.email}
                  </span>
                )}
                {resume.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {resume.phone}
                  </span>
                )}
                {resume.github && (
                  <span className="inline-flex items-center gap-1">
                    <Github className="h-3 w-3" />
                    {shortUrl(resume.github)}
                  </span>
                )}
                {resume.linkedin && (
                  <span className="inline-flex items-center gap-1">
                    <Linkedin className="h-3 w-3" />
                    {shortUrl(resume.linkedin)}
                  </span>
                )}
                {resume.portfolio && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {shortUrl(resume.portfolio)}
                  </span>
                )}
                {!resume.email && !resume.phone && (
                  <span className="italic">Contact details will appear here.</span>
                )}
              </div>
            </div>
          </ChangeWrap>

          <ChangeWrap id="section-summary" active={changed(["summary"])} label="Updated">
            <Section
              title="Summary"
              action={
                resume.summary ? (
                  <RewriteButton
                    text={resume.summary}
                    section="summary"
                    onAccept={onUpdateSummary}
                  />
                ) : null
              }
            >
              <p className="text-[13px] leading-relaxed text-foreground/85">
                {resume.summary || (
                  <span className="italic text-muted-foreground">
                    Aria will polish your professional summary here.
                  </span>
                )}
              </p>
            </Section>
          </ChangeWrap>

          <ChangeWrap id="section-education" active={changed(["education"])} label="Updated">
            <Section title="Education" icon={GraduationCap}>
              {resume.education.length === 0 ? (
                <EmptyLine text="Share your college and degree in the chat." />
              ) : (
                resume.education.map((e) => (
                  <div key={e.school} className="mb-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[13px] font-semibold">{e.school}</div>
                      <div className="text-[11px] text-muted-foreground">{e.period}</div>
                    </div>
                    <div className="text-[12px] text-foreground/80">
                      {e.degree} · {e.grade}
                    </div>
                  </div>
                ))
              )}
            </Section>
          </ChangeWrap>

          <ChangeWrap id="section-projects" active={changed(["projects"])} label="Added">
            <Section title="Projects" icon={Rocket}>
              {resume.projects.length === 0 ? (
                <EmptyLine text="Your projects will appear here as you chat with Aria." />
              ) : (
                resume.projects.map((p) => (
                  <div key={p.name} className="mb-3 animate-fade-in">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[13px] font-semibold">{p.name}</div>
                      <div className="flex items-center gap-1.5">
                        {p.description && (
                          <RewriteButton
                            text={p.description}
                            section="project"
                            onAccept={(t) => onUpdateProjectDescription(p.name, t)}
                          />
                        )}
                        <div className="text-[11px] font-semibold text-success">
                          Quality {Math.round(p.quality)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full gradient-primary"
                        style={{ width: `${p.quality}%` }}
                      />
                    </div>
                    {p.description && (
                      <p
                        className="mt-1.5 text-[12px] leading-relaxed text-foreground/80"
                        dangerouslySetInnerHTML={{
                          __html: p.description.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                        }}
                      />
                    )}
                    {p.tech.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.tech.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </Section>
          </ChangeWrap>

          <ChangeWrap id="section-skills" active={changed(["skills"])} label="Improved">
            <Section title="Skills">
              {resume.skills.length === 0 ? (
                <EmptyLine text="Mention the tools and languages you use — Aria will group them." />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-gradient-to-br from-white to-surface-2 px-2.5 py-0.5 text-[11px] font-medium transition hover:border-primary/40 hover:text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          </ChangeWrap>

          <ChangeWrap id="section-experience" active={changed(["experience"])} label="Added">
            <Section title="Experience" icon={Briefcase}>
              {resume.experience.length === 0 ? (
                <EmptyLine text="Tell Aria about any internships, jobs, or freelance work." />
              ) : (
                resume.experience.map((x) => (
                  <div key={x.company} className="mb-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[13px] font-semibold">
                        {x.role} · <span className="font-normal">{x.company}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{x.period}</div>
                    </div>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] leading-relaxed text-foreground/85">
                      {x.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </Section>
          </ChangeWrap>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ChangeWrap
              id="section-certifications"
              active={changed(["certifications"])}
              label="Added"
            >
              <Section title="Certifications" icon={Award}>
                {resume.certifications.length === 0 ? (
                  <EmptyLine text="Certifications go here." />
                ) : (
                  <ul className="space-y-1 text-[12px]">
                    {resume.certifications.map((c) => (
                      <li key={c} className="flex items-center gap-1.5">
                        <CircleCheck className="h-3 w-3 text-success" /> {c}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </ChangeWrap>
            <ChangeWrap id="section-achievements" active={changed(["achievements"])} label="Added">
              <Section title="Achievements">
                {resume.achievements.length === 0 ? (
                  <EmptyLine text="Wins, awards, hackathons — Aria will list them here." />
                ) : (
                  <ul className="space-y-1 text-[12px]">
                    {resume.achievements.map((a) => (
                      <li key={a} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {a}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </ChangeWrap>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeWrap({ id, active, label, children }) {
  return (
    <div
      id={id}
      className={`relative scroll-mt-4 rounded-xl transition-all duration-500 ${
        active
          ? "-mx-2 my-1 bg-gradient-to-r from-primary/5 via-primary/[0.03] to-transparent px-2 ring-1 ring-primary/25"
          : ""
      }`}
    >
      {active && (
        <span className="absolute -top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full gradient-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-elegant animate-scale-in">
          <ArrowUpRight className="h-2.5 w-2.5" />
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

function Section({ title, icon: Icon, action, children }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary">{title}</h3>
        <div className="h-px flex-1 bg-border" />
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyLine({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-3 py-4 text-center text-[11px] text-muted-foreground">
      {text}
    </div>
  );
}

function shortUrl(u) {
  return u.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// ---------- Templates ----------
function TemplateGallery({ template, setTemplate }) {
  const templates = [
    "Minimal",
    "Professional",
    "Google",
    "Microsoft",
    "Apple",
    "Startup",
    "Creative",
    "Developer",
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Template Gallery</div>
          <div className="text-[11px] text-muted-foreground">
            Switch styles — your data stays in sync
          </div>
        </div>
        <button className="text-xs font-semibold text-primary hover:underline">Browse all →</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {templates.map((t) => (
          <button
            key={t}
            onClick={() => setTemplate(t)}
            className={`group relative overflow-hidden rounded-xl border p-2.5 text-left transition ${
              template === t
                ? "border-primary/50 bg-accent/50 shadow-elegant"
                : "border-border bg-white hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
            }`}
          >
            <div className="aspect-[3/4] overflow-hidden rounded-md border border-border/60 bg-gradient-to-br from-surface to-white p-2">
              <div className="h-1.5 w-2/3 rounded gradient-primary" />
              <div className="mt-1 h-1 w-1/2 rounded bg-border" />
              <div className="mt-2.5 space-y-1">
                <div className="h-0.5 w-full rounded bg-border" />
                <div className="h-0.5 w-5/6 rounded bg-border" />
                <div className="h-0.5 w-3/4 rounded bg-border" />
              </div>
              <div className="mt-2 flex gap-0.5">
                <div className="h-1 w-3 rounded bg-primary/30" />
                <div className="h-1 w-4 rounded bg-primary/30" />
                <div className="h-1 w-2 rounded bg-primary/30" />
              </div>
              <div className="mt-2 space-y-1">
                <div className="h-0.5 w-full rounded bg-border" />
                <div className="h-0.5 w-4/5 rounded bg-border" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold">{t}</span>
              {template === t && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Celebration ----------
function CelebrationModal({ score, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-white p-8 text-center shadow-glow animate-slide-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-white shadow-glow">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">Resume Completed 🎉</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your ATS-ready resume is polished and ready to ship.
        </p>

        <div className="mt-6 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "Overall", v: score.overall, suffix: "/100" },
            { l: "ATS", v: score.ats, suffix: "%" },
            { l: "Grammar", v: score.grammar, suffix: "%" },
            { l: "Impact", v: score.impact, suffix: "%" },
          ].map((m) => (
            <div key={m.l} className="rounded-xl border border-border bg-surface p-3">
              <div className="text-lg font-bold gradient-text">
                {m.v}
                {m.suffix}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {m.l}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button className="inline-flex items-center justify-center gap-1.5 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-white shadow-elegant hover:opacity-95">
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold hover:bg-surface-2">
            <FileDown className="h-4 w-4" /> Download DOCX
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold hover:bg-surface-2">
            <Pencil className="h-4 w-4" /> Edit Resume
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold hover:bg-surface-2">
            <ScanSearch className="h-4 w-4" /> Analyze Resume
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Scoring ----------
function computeScore(r, confidence) {
  const filled =
    (r.name ? 1 : 0) +
    (r.email ? 1 : 0) +
    (r.phone ? 1 : 0) +
    (r.github ? 1 : 0) +
    (r.linkedin ? 1 : 0) +
    (r.portfolio ? 1 : 0);
  const contactPct = Math.round((filled / 6) * 100);
  const projectBonus = Math.min(20, r.projects.length * 8);
  const skillsBonus = Math.min(10, r.skills.length);
  const overall = Math.min(
    98,
    45 + Math.round(contactPct * 0.2) + projectBonus + skillsBonus + Math.round(confidence * 0.15),
  );
  return {
    overall,
    ats: Math.min(96, 55 + Math.round(contactPct * 0.15) + projectBonus / 2 + skillsBonus),
    grammar: Math.min(98, 80 + Math.round(confidence * 0.15)),
    impact: Math.min(96, 60 + projectBonus + Math.round(confidence * 0.2)),
    readability: Math.min(97, 82 + Math.round(confidence * 0.1)),
  };
}
