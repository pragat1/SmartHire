import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ScanSearch,
  Sparkles,
  Target,
  Mic,
  Map,
  Settings,
  Send,
  Check,
  RefreshCw,
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
  ChevronRight,
  CircleCheck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: SmartHireApp,
});

// ---------- Types ----------
type Msg = { id: string; role: "ai" | "user"; text: string; typing?: boolean; suggestion?: string };
type Project = {
  name: string;
  problem?: string;
  tech?: string[];
  auth?: string;
  db?: string;
  deploy?: string;
  challenge?: string;
  description?: string;
  quality: number;
  missing: string[];
};
type Resume = {
  name: string;
  role: string;
  email: string;
  phone: string;
  github: string;
  portfolio: string;
  linkedin: string;
  location: string;
  summary: string;
  education: { school: string; degree: string; period: string; grade: string }[];
  projects: Project[];
  skills: Record<string, string[]>;
  experience: { company: string; role: string; period: string; bullets: string[] }[];
  certifications: string[];
  achievements: string[];
};

// ---------- Initial data ----------
const initialResume: Resume = {
  name: "",
  role: "Aspiring Software Engineer",
  email: "",
  phone: "",
  github: "",
  portfolio: "",
  linkedin: "",
  location: "Bengaluru, India",
  summary:
    "Passionate developer focused on building intuitive, performant web products. Loves clean UI, thoughtful UX, and shipping ideas fast.",
  education: [
    { school: "Indian Institute of Technology", degree: "B.Tech, Computer Science", period: "2022 — 2026", grade: "CGPA 8.9 / 10" },
  ],
  projects: [],
  skills: {
    Frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    Backend: ["Node.js", "Express", "REST APIs"],
    Database: ["MongoDB", "PostgreSQL"],
    Languages: ["JavaScript", "Python", "SQL"],
    Tools: ["Git", "Figma", "Postman"],
    Cloud: ["Vercel", "AWS"],
  },
  experience: [
    {
      company: "Nova Labs",
      role: "Frontend Engineering Intern",
      period: "Jun 2025 — Aug 2025",
      bullets: [
        "Shipped a redesigned onboarding flow that lifted activation by 24%.",
        "Built a reusable component library used across 6 internal products.",
      ],
    },
  ],
  certifications: ["Meta Front-End Developer", "Google UX Design"],
  achievements: [
    "Winner — Smart India Hackathon 2024 (Web track)",
    "Top 1% — GeeksforGeeks Coding Contest",
  ],
};

// ---------- Question script ----------
type Step =
  | { key: "name"; q: string }
  | { key: "email"; q: string }
  | { key: "phone"; q: string }
  | { key: "github"; q: string }
  | { key: "portfolio"; q: string }
  | { key: "linkedin"; q: string }
  | { key: "summary"; q: string }
  | { key: "project_name"; q: string }
  | { key: "project_problem"; q: string }
  | { key: "project_tech"; q: string }
  | { key: "project_auth"; q: string }
  | { key: "project_challenge"; q: string }
  | { key: "skill_extra"; q: string }
  | { key: "certification"; q: string }
  | { key: "achievement"; q: string };

const script: Step[] = [
  { key: "name", q: "Hi there 👋 Let's build a professional, ATS-ready resume together. I'll ask one question at a time.\n\n**Question 1 of 15** — What's your full name?" },
  { key: "email", q: "Lovely to meet you! What's the best email to reach you at?" },
  { key: "phone", q: "Great. What's your phone number? (with country code)" },
  { key: "github", q: "Do you have a GitHub profile? Paste the link (or type 'skip')." },
  { key: "portfolio", q: "Portfolio or personal website?" },
  { key: "linkedin", q: "LinkedIn URL?" },
  { key: "summary", q: "In one sentence, how would you describe yourself as a professional? I'll polish it for you." },
  { key: "project_name", q: "Let's talk projects — these matter a lot to recruiters. What's the **name** of a project you're proud of?" },
  { key: "project_problem", q: "Interesting! Let's improve this project. **What problem does it solve?**" },
  { key: "project_tech", q: "Nice. Which **technologies** did you use? (comma-separated)" },
  { key: "project_auth", q: "Did you add **authentication**, a database, or any APIs? Tell me briefly." },
  { key: "project_challenge", q: "What was the **biggest challenge**, and how did you solve it?" },
  { key: "skill_extra", q: "Any extra **skills** you'd like to highlight? (comma-separated, or 'skip')" },
  { key: "certification", q: "Any **certifications** to add? (comma-separated, or 'skip')" },
  { key: "achievement", q: "Finally — one **achievement** you're most proud of?" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- Main app ----------
function SmartHireApp() {
  const [resume, setResume] = useState<Resume>(initialResume);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [input, setInput] = useState("");
  const [pendingProject, setPendingProject] = useState<Partial<Project> | null>(null);
  const [showProjectPreview, setShowProjectPreview] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [template, setTemplate] = useState("Minimal");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // seed first message
  useEffect(() => {
    pushAI(script[0].q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const progress = Math.min(100, Math.round((stepIdx / script.length) * 100));
  const minutesLeft = Math.max(1, Math.ceil((script.length - stepIdx) * 0.6));

  function pushAI(text: string, extra?: Partial<Msg>) {
    const id = uid();
    setMessages((m) => [...m, { id, role: "ai", text: "", typing: true, ...extra }]);
    // simulate typing
    setTimeout(() => {
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text, typing: false } : msg)));
    }, 550);
  }

  function pushUser(text: string) {
    setMessages((m) => [...m, { id: uid(), role: "user", text }]);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const val = input.trim();
    if (!val) return;
    setInput("");
    pushUser(val);
    processAnswer(val);
  }

  function processAnswer(val: string) {
    const step = script[stepIdx];
    if (!step) return;
    const lower = val.toLowerCase();
    const skip = lower === "skip" || lower === "no" || lower === "none";

    setResume((r) => {
      const next = { ...r };
      switch (step.key) {
        case "name":
          next.name = val;
          break;
        case "email":
          next.email = val;
          break;
        case "phone":
          next.phone = val;
          break;
        case "github":
          next.github = skip ? "" : val;
          break;
        case "portfolio":
          next.portfolio = skip ? "" : val;
          break;
        case "linkedin":
          next.linkedin = skip ? "" : val;
          break;
        case "summary":
          next.summary = polishSummary(val, next.name);
          break;
        case "project_name":
          setPendingProject({ name: val, quality: 45, missing: ["Deployment", "Metrics", "Testing"] });
          break;
        case "project_problem":
          setPendingProject((p) => ({ ...(p ?? {}), problem: val }));
          break;
        case "project_tech":
          setPendingProject((p) => ({ ...(p ?? {}), tech: val.split(",").map((s) => s.trim()).filter(Boolean) }));
          break;
        case "project_auth":
          setPendingProject((p) => ({ ...(p ?? {}), auth: val }));
          break;
        case "project_challenge":
          setPendingProject((p) => {
            const merged: Project = {
              name: p?.name ?? "Untitled Project",
              problem: p?.problem,
              tech: p?.tech ?? [],
              auth: p?.auth,
              challenge: val,
              quality: 92,
              missing: ["Deployment link", "Impact metrics"],
              description: composeProjectDescription({
                name: p?.name ?? "Untitled",
                problem: p?.problem ?? "",
                tech: p?.tech ?? [],
                auth: p?.auth ?? "",
                challenge: val,
              }),
            };
            next.projects = [...next.projects, merged];
            setShowProjectPreview(merged.name);
            return null;
          });
          break;
        case "skill_extra":
          if (!skip) {
            const extras = val.split(",").map((s) => s.trim()).filter(Boolean);
            next.skills = { ...next.skills, Frontend: Array.from(new Set([...(next.skills.Frontend ?? []), ...extras])) };
          }
          break;
        case "certification":
          if (!skip) next.certifications = [...next.certifications, ...val.split(",").map((s) => s.trim()).filter(Boolean)];
          break;
        case "achievement":
          if (!skip) next.achievements = [val, ...next.achievements];
          break;
      }
      return next;
    });

    // advance
    const nextIdx = stepIdx + 1;
    setStepIdx(nextIdx);
    if (nextIdx < script.length) {
      setTimeout(() => pushAI(script[nextIdx].q), 750);
    } else {
      setTimeout(() => {
        pushAI("Amazing — your resume is looking sharp! 🎉 I've compiled everything into a polished, ATS-friendly draft on the right.");
        setTimeout(() => setCompleted(true), 1200);
      }, 750);
    }
  }

  function polishSummary(raw: string, name: string) {
    const first = name?.split(" ")[0] ?? "";
    return `${first ? first + " is a " : ""}${raw.replace(/^i(?:'m| am)?\s*/i, "").replace(/\.$/, "")}, with a strong bias for shipping, an eye for design detail, and a track record of turning ideas into delightful products.`;
  }

  function composeProjectDescription(p: { name: string; problem: string; tech: string[]; auth: string; challenge: string }) {
    const tech = p.tech.length ? p.tech.join(", ") : "modern web technologies";
    return `Developed **${p.name}**, a full-stack solution built with ${tech} that ${p.problem?.toLowerCase().replace(/\.$/, "") || "solves a real user problem"}. Implemented ${p.auth?.toLowerCase() || "core features"}, a responsive dashboard, and secure workflows. Overcame ${p.challenge?.toLowerCase().replace(/\.$/, "") || "key technical challenges"} to deliver a polished product.`;
  }

  function acceptProject() {
    setShowProjectPreview(null);
    pushAI("Locked in ✅ Added to your resume. Let's keep going!");
  }

  function rewriteProject(name: string) {
    setResume((r) => ({
      ...r,
      projects: r.projects.map((p) =>
        p.name === name
          ? {
              ...p,
              description: `Engineered **${p.name}** end-to-end using ${(p.tech ?? []).join(", ") || "a modern stack"} — architected the data model, implemented REST APIs, integrated auth, and deployed to production. Delivered measurable impact by ${p.problem?.toLowerCase() || "solving real user problems"}.`,
            }
          : p,
      ),
    }));
  }

  const score = useMemo(() => computeScore(resume), [resume]);

  return (
    <div className="min-h-screen w-full text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:flex-row lg:gap-5 lg:p-6">
          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            progress={progress}
            stepIdx={stepIdx}
            total={script.length}
            minutesLeft={minutesLeft}
            userName={resume.name}
            projectPreview={
              showProjectPreview
                ? resume.projects.find((p) => p.name === showProjectPreview) ?? null
                : null
            }
            onAccept={acceptProject}
            onRewrite={(n) => rewriteProject(n)}
            chatEndRef={chatEndRef}
          />
          <RightPanel resume={resume} score={score} template={template} setTemplate={setTemplate} />
        </main>
      </div>
      {completed && (
        <CelebrationModal
          score={score}
          onClose={() => setCompleted(false)}
        />
      )}
    </div>
  );
}

// ---------- Sidebar ----------
function Sidebar() {
  const items = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: FileText, label: "Resume Builder", active: true },
    { icon: ScanSearch, label: "Resume Analyzer" },
    { icon: Sparkles, label: "Resume Improver" },
    { icon: Target, label: "Job Tailoring" },
    { icon: Mic, label: "Interview Coach" },
    { icon: Map, label: "Career Roadmap" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-white/60 p-5 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-glow">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight">SmartHire<span className="gradient-text"> AI</span></span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Resume OS</span>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {items.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? "gradient-primary text-white shadow-elegant"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            <Icon className={`h-[18px] w-[18px] ${active ? "" : "opacity-80 group-hover:opacity-100"}`} />
            <span>{label}</span>
            {active && <ChevronRight className="ml-auto h-4 w-4" />}
          </button>
        ))}
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
function ChatPanel(props: {
  messages: Msg[];
  input: string;
  setInput: (s: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  progress: number;
  stepIdx: number;
  total: number;
  minutesLeft: number;
  userName: string;
  projectPreview: Project | null;
  onAccept: () => void;
  onRewrite: (name: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const {
    messages, input, setInput, onSubmit, progress, stepIdx, total, minutesLeft,
    projectPreview, onAccept, onRewrite, chatEndRef,
  } = props;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-[520px] xl:max-w-[600px]">
      {/* Progress card */}
      <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Resume Completion</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{progress}%</span>
              <span className="text-xs text-muted-foreground">Step {Math.min(stepIdx + 1, total)} of {total}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Est. time</div>
            <div className="mt-1 text-lg font-semibold">{minutesLeft} min</div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full gradient-primary transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Chat */}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/60 bg-white/80 shadow-elegant backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">Aria — Resume Coach</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
              Online · GPT-powered
            </div>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-5 py-5" style={{ maxHeight: "56vh" }}>
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}

          {projectPreview && projectPreview.description && (
            <div className="animate-slide-up rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/50 to-white p-4 shadow-elegant">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-accent-foreground">
                <Sparkles className="h-3.5 w-3.5" /> AI-generated project description
              </div>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: projectPreview.description.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onAccept}
                  className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow-elegant transition hover:opacity-95"
                >
                  <Check className="h-3.5 w-3.5" /> Accept
                </button>
                <button
                  onClick={() => onRewrite(projectPreview.name)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Rewrite
                </button>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <form onSubmit={onSubmit} className="border-t border-border/60 p-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-white p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              rows={1}
              placeholder="Type your answer…"
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-white shadow-elegant transition hover:opacity-95 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1.5 px-1 text-[11px] text-muted-foreground">
            Press <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 text-[10px]">Enter</kbd> to send · <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 text-[10px]">Shift</kbd>+<kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 text-[10px]">Enter</kbd> for newline
          </div>
        </form>
      </div>
    </section>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isAI = msg.role === "ai";
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
          isAI
            ? "bg-surface text-foreground"
            : "gradient-primary text-white shadow-elegant"
        }`}
      >
        {msg.typing ? (
          <span className="inline-flex items-center gap-1">
            <Dot delay={0} /> <Dot delay={150} /> <Dot delay={300} />
          </span>
        ) : (
          <span
            dangerouslySetInnerHTML={{
              __html: msg.text
                .replace(/\n/g, "<br/>")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
            }}
          />
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
      style={{ animation: `pulse-glow 1.2s ${delay}ms infinite ease-in-out` }}
    />
  );
}

// ---------- Right Panel ----------
function RightPanel({
  resume,
  score,
  template,
  setTemplate,
}: {
  resume: Resume;
  score: ReturnType<typeof computeScore>;
  template: string;
  setTemplate: (t: string) => void;
}) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <ScoreCard score={score} />
        <SuggestionsCard />
      </div>
      <ResumePreview resume={resume} template={template} />
      <TemplateGallery template={template} setTemplate={setTemplate} />
    </section>
  );
}

// ---------- Score card ----------
function ScoreCard({ score }: { score: ReturnType<typeof computeScore> }) {
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
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Resume Score</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight gradient-text">{score.overall}</span>
            <span className="text-sm font-medium text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
            <BarChart3 className="h-3 w-3" /> Above average
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

function RingScore({ value }: { value: number }) {
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
        cx="36" cy="36" r={r}
        stroke="url(#ringg)" strokeWidth="8" fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
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
function ResumePreview({ resume, template }: { resume: Resume; template: string }) {
  const displayName = resume.name || "Your Name";
  return (
    <div className="rounded-2xl border border-border/60 bg-white shadow-elegant">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Live Preview</span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{template}</span>
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
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            <div className="text-sm font-medium text-primary">{resume.role}</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              {resume.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{resume.email}</span>}
              {resume.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{resume.phone}</span>}
              {resume.github && <span className="inline-flex items-center gap-1"><Github className="h-3 w-3" />{shortUrl(resume.github)}</span>}
              {resume.linkedin && <span className="inline-flex items-center gap-1"><Linkedin className="h-3 w-3" />{shortUrl(resume.linkedin)}</span>}
              {resume.portfolio && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{shortUrl(resume.portfolio)}</span>}
            </div>
          </div>

          <Section title="Summary">
            <p className="text-[13px] leading-relaxed text-foreground/85">{resume.summary}</p>
          </Section>

          <Section title="Education" icon={GraduationCap}>
            {resume.education.map((e) => (
              <div key={e.school} className="mb-2">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[13px] font-semibold">{e.school}</div>
                  <div className="text-[11px] text-muted-foreground">{e.period}</div>
                </div>
                <div className="text-[12px] text-foreground/80">{e.degree} · {e.grade}</div>
              </div>
            ))}
          </Section>

          <Section title="Projects" icon={Rocket}>
            {resume.projects.length === 0 ? (
              <EmptyLine text="Your projects will appear here as you chat with Aria." />
            ) : (
              resume.projects.map((p) => (
                <div key={p.name} className="mb-3 animate-fade-in">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[13px] font-semibold">{p.name}</div>
                    <div className="text-[11px] font-semibold text-success">Quality {p.quality}%</div>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full gradient-primary" style={{ width: `${p.quality}%` }} />
                  </div>
                  {p.description && (
                    <p className="mt-1.5 text-[12px] leading-relaxed text-foreground/80"
                       dangerouslySetInnerHTML={{ __html: p.description.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                  )}
                  {p.tech && p.tech.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.tech.map((t) => (
                        <span key={t} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                  {p.missing.length > 0 && (
                    <div className="mt-1 text-[10px] text-muted-foreground">Missing: {p.missing.join(" · ")}</div>
                  )}
                </div>
              ))
            )}
          </Section>

          <Section title="Skills">
            <div className="space-y-2">
              {Object.entries(resume.skills).map(([group, list]) => (
                <div key={group} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</span>
                  {list.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-gradient-to-br from-white to-surface-2 px-2.5 py-0.5 text-[11px] font-medium transition hover:border-primary/40 hover:text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Experience" icon={Briefcase}>
            {resume.experience.map((x) => (
              <div key={x.company} className="mb-2">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[13px] font-semibold">{x.role} · <span className="font-normal">{x.company}</span></div>
                  <div className="text-[11px] text-muted-foreground">{x.period}</div>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] leading-relaxed text-foreground/85">
                  {x.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            ))}
          </Section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Section title="Certifications" icon={Award}>
              <ul className="space-y-1 text-[12px]">
                {resume.certifications.map((c) => (
                  <li key={c} className="flex items-center gap-1.5"><CircleCheck className="h-3 w-3 text-success" /> {c}</li>
                ))}
              </ul>
            </Section>
            <Section title="Achievements">
              <ul className="space-y-1 text-[12px]">
                {resume.achievements.map((a) => (
                  <li key={a} className="flex items-start gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {a}</li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary">{title}</h3>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-surface px-3 py-4 text-center text-[11px] text-muted-foreground">{text}</div>;
}

function shortUrl(u: string) {
  return u.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// ---------- Templates ----------
function TemplateGallery({ template, setTemplate }: { template: string; setTemplate: (t: string) => void }) {
  const templates = ["Minimal", "Professional", "Google", "Microsoft", "Apple", "Startup", "Creative", "Developer"];
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-elegant backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Template Gallery</div>
          <div className="text-[11px] text-muted-foreground">Switch styles — your data stays in sync</div>
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
function CelebrationModal({ score, onClose }: { score: ReturnType<typeof computeScore>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-white p-8 text-center shadow-glow animate-slide-up">
        <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2">
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-white shadow-glow">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">Resume Completed 🎉</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your ATS-ready resume is polished and ready to ship.</p>

        <div className="mt-6 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "Overall", v: score.overall, suffix: "/100" },
            { l: "ATS", v: score.ats, suffix: "%" },
            { l: "Grammar", v: score.grammar, suffix: "%" },
            { l: "Impact", v: score.impact, suffix: "%" },
          ].map((m) => (
            <div key={m.l} className="rounded-xl border border-border bg-surface p-3">
              <div className="text-lg font-bold gradient-text">{m.v}{m.suffix}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{m.l}</div>
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
function computeScore(r: Resume) {
  const filled =
    (r.name ? 1 : 0) + (r.email ? 1 : 0) + (r.phone ? 1 : 0) +
    (r.github ? 1 : 0) + (r.linkedin ? 1 : 0) + (r.portfolio ? 1 : 0);
  const contactPct = Math.round((filled / 6) * 100);
  const projectBonus = Math.min(20, r.projects.length * 8);
  const overall = Math.min(98, 62 + Math.round(contactPct * 0.2) + projectBonus);
  return {
    overall,
    ats: Math.min(96, 70 + Math.round(contactPct * 0.15) + projectBonus / 2),
    grammar: 95,
    impact: Math.min(94, 74 + projectBonus),
    readability: 93,
  };
}
