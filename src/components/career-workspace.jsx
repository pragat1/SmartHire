import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Edit3,
  FileText,
  GraduationCap,
  Layers3,
  Lightbulb,
  ListChecks,
  MessageSquareQuote,
  Pencil,
  Plus,
  Rocket,
  Search,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { analyzeCareerGap, InterviewCoach } from "@/components/workspace-tools";

const STORAGE_KEY = "smarthire.career-workspace.v1";
const ROLE_SUGGESTIONS = [
  "Frontend Developer",
  "Full Stack Developer",
  "Backend Developer",
  "Software Engineer",
  "Data Analyst",
  "UI/UX Designer",
];
const EXPERIENCE_LEVELS = [
  "Student",
  "Fresher",
  "Internship",
  "0–1 Years",
  "1–2 Years",
  "2–4 Years",
  "4+ Years",
];

function readWorkspace() {
  if (typeof window === "undefined") return { roles: [], completedMilestones: [], activity: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return {
      roles: Array.isArray(parsed?.roles) ? parsed.roles : [],
      completedMilestones: Array.isArray(parsed?.completedMilestones) ? parsed.completedMilestones : [],
      activity: Array.isArray(parsed?.activity) ? parsed.activity : [],
    };
  } catch {
    return { roles: [], completedMilestones: [], activity: [] };
  }
}

function saveWorkspace(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* Local persistence is best effort. */
  }
}

function WorkspaceCard({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 shadow-elegant ${className}`}>
      {children}
    </section>
  );
}

function CardHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Button({ children, variant = "secondary", className = "", ...props }) {
  const styles = {
    primary: "gradient-primary text-primary-foreground shadow-elegant hover:opacity-95",
    secondary: "border border-border bg-card text-foreground hover:bg-surface-2",
    ghost: "border border-transparent text-primary hover:bg-primary/5",
    danger: "border border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10",
  };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon = CircleHelp, title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/60 px-4 py-6 text-center">
      <Icon className="mx-auto h-5 w-5 text-muted-foreground" />
      <div className="mt-2 text-[13px] font-semibold">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-muted-foreground">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ProgressBar({ value, tone = "primary" }) {
  const toneClass = {
    primary: "gradient-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
  }[tone];
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full rounded-full transition-[width] duration-700 ${toneClass}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function ScoreRing({ value, size = 116 }) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const available = typeof value === "number";
  const safeValue = available ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke} />
        {available && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * safeValue) / 100}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-2xl font-bold tracking-tight">{available ? `${safeValue}%` : "—"}</div>
          <div className="text-[10px] font-medium text-muted-foreground">{available ? "Match score" : "Not assessed"}</div>
        </div>
      </div>
    </div>
  );
}

function formatRelative(timestamp) {
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/35 p-4 backdrop-blur-sm" role="presentation">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-glow ${wide ? "max-w-3xl" : "max-w-lg"}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-[12px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function TargetRoleModal({ initialRole, onClose, onSave }) {
  const [role, setRole] = useState(initialRole?.role || "");
  const [experience, setExperience] = useState(initialRole?.experience || "");
  const [priority, setPriority] = useState(initialRole?.priority || "Primary Goal");
  const [goalDate, setGoalDate] = useState(initialRole?.goalDate || "");
  const canSave = role.trim().length > 1;

  function submit(e) {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      id: initialRole?.id,
      role: role.trim(),
      experience,
      priority,
      goalDate,
      createdAt: initialRole?.createdAt || Date.now(),
      match: initialRole?.match ?? null,
    });
  }

  return (
    <Modal title={initialRole ? "Edit target role" : "Add a target role"} subtitle="Your primary role drives gap analysis and the career roadmap." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-[12px] font-semibold">
          Target role
          <input autoFocus value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Product Designer" className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </label>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Suggestions</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ROLE_SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setRole(suggestion)} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/35 hover:text-primary">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[12px] font-semibold">
            Experience level
            <select value={experience} onChange={(e) => setExperience(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">Not specified</option>
              {EXPERIENCE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>
          <label className="block text-[12px] font-semibold">
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option>Primary Goal</option>
              <option>Secondary Goal</option>
            </select>
          </label>
        </div>
        <label className="block text-[12px] font-semibold">
          Goal date <span className="font-normal text-muted-foreground">(optional)</span>
          <input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </label>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!canSave}><Check className="h-3.5 w-3.5" /> {initialRole ? "Save changes" : "Add role"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function SetupStep({ number, icon: Icon, title, text, action }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-elegant">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <div className="text-[13px] font-bold"><span className="mr-1 text-muted-foreground">{number}.</span>{title}</div>
      </div>
      <p className="mt-3 min-h-10 text-[12px] leading-relaxed text-muted-foreground">{text}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}

function Onboarding({ resume, onNewRole, onNavigate }) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-soft p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"><Compass className="h-3 w-3" /> Career setup</div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Let&apos;s build your career roadmap</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Tell us about your goals and current skills to unlock personalized insights, skill-gap analysis, and a step-by-step roadmap.</p>
        </div>
      </div>
      <div>
        <h2 className="text-base font-bold tracking-tight">Complete these steps to get started</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SetupStep number="1" icon={Target} title="Choose target role" text="Tell us which role you are working toward." action={<Button variant="primary" className="w-full" onClick={onNewRole}>Choose role <ArrowRight className="h-3.5 w-3.5" /></Button>} />
          <SetupStep number="2" icon={BriefcaseBusiness} title="Add current status" text="Share your experience level with Aria." action={<Button className="w-full" onClick={() => onNavigate("builder")}>Open resume builder <ArrowRight className="h-3.5 w-3.5" /></Button>} />
          <SetupStep number="3" icon={Layers3} title="Add your skills" text={resume.skills.length ? `${resume.skills.length} skill${resume.skills.length === 1 ? "" : "s"} detected in your resume.` : "Add the tools and skills you currently know."} action={<Button className="w-full" onClick={() => onNavigate("builder")}>{resume.skills.length ? "Review skills" : "Add skills"} <ArrowRight className="h-3.5 w-3.5" /></Button>} />
          <SetupStep number="4" icon={FileText} title="Upload your resume" text="Your existing resume data will power workspace insights." action={<Button className="w-full" onClick={() => onNavigate("builder")}>{resume.name ? "Review resume" : "Open resume builder"} <ArrowRight className="h-3.5 w-3.5" /></Button>} />
        </div>
      </div>
      <WorkspaceCard className="bg-surface/55">
        <div className="flex items-start gap-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" /><div><div className="text-[13px] font-bold">Your data stays honest</div><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Insights and progress appear only when SmartHire has enough information from your resume, target roles, and actions.</p></div></div>
      </WorkspaceCard>
    </div>
  );
}

function CareerOverview({ resume, score, roles, primaryRole, gap, onNewRole }) {
  const daysToGoal = primaryRole?.goalDate ? Math.max(0, Math.ceil((new Date(primaryRole.goalDate).getTime() - Date.now()) / 86400000)) : null;
  const profileStatus = resume.name || resume.role || resume.skills.length ? "In progress" : "Not started";
  const stats = [
    { icon: Target, value: roles.length || "—", label: "Target roles", sub: roles.length ? "Active" : "Add a target role", tone: "bg-primary/10 text-primary" },
    { icon: Compass, value: typeof gap?.readiness === "number" ? `${gap.readiness}%` : "—", label: "Overall match", sub: gap ? "Based on your profile" : "Not assessed", tone: "bg-success/10 text-success" },
    { icon: Layers3, value: gap?.missing_skills?.length ?? "—", label: "Skills to improve", sub: gap ? "From gap analysis" : "Run a gap analysis", tone: "bg-warning/10 text-warning-foreground" },
    { icon: Clock3, value: daysToGoal === null ? "—" : daysToGoal, label: "Days to goal", sub: daysToGoal === null ? "Set a career goal" : "Until target date", tone: "bg-sky-500/10 text-sky-600" },
  ];
  return (
    <WorkspaceCard>
      <CardHeading icon={BriefcaseBusiness} title="Career Overview" subtitle="A live snapshot of your current career state." action={<Button variant="ghost" onClick={onNewRole}><Plus className="h-3.5 w-3.5" /> New target role</Button>} />
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="rounded-xl border border-border bg-surface/60 p-3"><div className={`grid h-8 w-8 place-items-center rounded-lg ${stat.tone}`}><stat.icon className="h-4 w-4" /></div><div className="mt-3 text-xl font-bold tracking-tight">{stat.value}</div><div className="mt-0.5 text-[11px] font-semibold">{stat.label}</div><div className="mt-1 text-[10px] text-muted-foreground">{stat.sub}</div></div>)}
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Current focus</div>
        <div className="mt-1.5 text-sm font-semibold">{primaryRole ? `Preparing for ${primaryRole.role} roles` : "Choose a target role to set your focus"}</div>
        <div className="mt-1 text-[12px] text-muted-foreground">{primaryRole?.goalDate ? `Goal date: ${new Date(`${primaryRole.goalDate}T00:00:00`).toLocaleDateString()}` : `Resume status: ${profileStatus}`}</div>
        {primaryRole && <div className="mt-3"><div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground"><span>Profile readiness</span><span>{typeof gap?.readiness === "number" ? `${gap.readiness}%` : "Not assessed"}</span></div>{typeof gap?.readiness === "number" ? <ProgressBar value={gap.readiness} tone="success" /> : <div className="h-2 rounded-full bg-surface-2" />}</div>}
      </div>
    </WorkspaceCard>
  );
}

function TargetRoleProgress({ roles, primaryId, onSelect, onEdit, onDelete, onNewRole }) {
  return (
    <WorkspaceCard>
      <CardHeading icon={Target} title="Target Role Progress" subtitle="Keep multiple career directions organized." action={<Button variant="ghost" onClick={onNewRole}><Plus className="h-3.5 w-3.5" /> Add role</Button>} />
      <div className="mt-4 space-y-2">
        {roles.length === 0 ? <EmptyState icon={Target} title="No target roles yet" text="Add a target role to start building your personalized roadmap." action={<Button variant="primary" onClick={onNewRole}><Plus className="h-3.5 w-3.5" /> Add target role</Button>} /> : roles.map((role) => {
          const selected = role.id === primaryId;
          return <div key={role.id} className={`rounded-xl border p-3 transition ${selected ? "border-primary/30 bg-primary/5" : "border-border bg-surface/45"}`}>
            <div className="flex items-start gap-3"><button type="button" onClick={() => onSelect(role.id)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-[13px] font-bold">{role.role}</span>{selected && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">Primary</span>}</div><div className="mt-1 text-[11px] text-muted-foreground">{role.priority}{role.experience ? ` · ${role.experience}` : ""}</div></button><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => onEdit(role)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground" aria-label={`Edit ${role.role}`}><Edit3 className="h-3.5 w-3.5" /></button><button type="button" onClick={() => onDelete(role.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${role.role}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>
            <div className="mt-3 flex items-center gap-3"><div className="min-w-0 flex-1"><ProgressBar value={typeof role.match === "number" ? role.match : 0} tone={typeof role.match === "number" ? "success" : "primary"} /></div><span className="w-20 text-right text-[11px] font-semibold">{typeof role.match === "number" ? `${role.match}% match` : "Not assessed"}</span></div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${typeof role.match === "number" ? "bg-success" : "bg-muted-foreground/50"}`} />{typeof role.match === "number" ? "Profile assessed" : "Run gap analysis to assess"}</div>
          </div>;
        })}
      </div>
    </WorkspaceCard>
  );
}

function GapSummaryCard({ resume, primaryRole, gap, loading, error, onRun, onViewDetails, onAddSkill }) {
  return <WorkspaceCard>
    <CardHeading icon={Compass} title="Career Gap Detector" subtitle="Identify gaps between your current profile and your target role." action={<span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-primary">AI-assisted</span>} />
    {!primaryRole ? <div className="mt-4"><EmptyState icon={Target} title="No target role selected" text="Add a target role before running a career gap analysis." /></div> : <>
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row"><ScoreRing value={gap?.readiness} /><div className="min-w-0 flex-1"><div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Comparing against</div><div className="mt-1 text-base font-bold">{primaryRole.role}</div><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{gap?.verdict || "Run an analysis to compare the role against skills, projects, and resume evidence you have provided."}</p>{gap && <div className="mt-3 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-success/10 px-2 py-1 font-semibold text-success">Matched {gap.matched_skills?.length ?? 0}</span><span className="rounded-full bg-warning/10 px-2 py-1 font-semibold text-warning-foreground">Partial unavailable</span><span className="rounded-full bg-destructive/10 px-2 py-1 font-semibold text-destructive">Missing {gap.missing_skills?.length ?? 0}</span></div>}</div></div>
      {error && <div role="alert" className="mt-3 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-[12px] text-destructive">{error}</div>}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4"><Button variant="primary" onClick={onRun} disabled={loading}><Sparkles className="h-3.5 w-3.5" /> {loading ? "Analyzing…" : gap ? "Refresh analysis" : "Run gap analysis"}</Button>{gap && <Button onClick={onViewDetails}>View gap analysis <ArrowRight className="h-3.5 w-3.5" /></Button>}</div>
      {gap?.missing_skills?.length > 0 && <div className="mt-4 rounded-xl bg-surface/70 p-3"><div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Next skills to consider</div><div className="mt-2 flex flex-wrap gap-1.5">{gap.missing_skills.slice(0, 5).map((item) => <button key={item.skill} type="button" onClick={() => onAddSkill(item.skill)} className="rounded-full border border-primary/25 bg-card px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/5">+ {item.skill}</button>)}</div></div>}
    </>}
  </WorkspaceCard>;
}

function GapDetails({ gap, role, onAddSkill }) {
  const sections = [
    { title: "Strong matches", icon: Check, tone: "text-success", items: gap?.matched_skills || [], empty: "No strong matches identified yet." },
    { title: "Missing skills", icon: TriangleAlert, tone: "text-destructive", items: gap?.missing_skills?.map((item) => `${item.skill} — ${item.why}`) || [], empty: "No missing skills were returned." },
    { title: "Resume evidence gaps", icon: FileText, tone: "text-warning-foreground", items: gap?.hidden_gaps || [], empty: "No additional evidence gaps were returned." },
  ];
  return <Modal title={`Gap analysis · ${role}`} subtitle="Known profile signals are separated from recommended next steps." onClose={onAddSkill ? undefined : undefined} wide>
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4"><div className="flex items-center gap-3"><ScoreRing size={78} value={gap?.readiness} /><p className="text-[13px] leading-relaxed text-muted-foreground">{gap?.verdict || "No analysis available yet."}</p></div></div>
    <div className="mt-4 grid gap-3 md:grid-cols-3">{sections.map((section) => <div key={section.title} className="rounded-xl border border-border bg-surface/45 p-3"><div className={`flex items-center gap-2 text-[12px] font-bold ${section.tone}`}><section.icon className="h-3.5 w-3.5" />{section.title}</div>{section.items.length ? <ul className="mt-3 space-y-2">{section.items.map((item) => <li key={item} className="text-[11px] leading-relaxed text-foreground/80">{item}</li>)}</ul> : <p className="mt-3 text-[11px] text-muted-foreground">{section.empty}</p>}</div>)}</div>
    {gap?.missing_skills?.length > 0 && <div className="mt-4 rounded-xl border border-border p-3"><div className="text-[11px] font-semibold">Add a known skill to your profile</div><div className="mt-2 flex flex-wrap gap-1.5">{gap.missing_skills.map((item) => <Button key={item.skill} onClick={() => onAddSkill(item.skill)}><Plus className="h-3 w-3" /> {item.skill}</Button>)}</div><p className="mt-2 text-[10px] text-muted-foreground">Only add skills you actually have or plan to learn; recommendations are not treated as experience.</p></div>}
  </Modal>;
}

function buildMilestones(primaryRole, resume, gap, completed) {
  if (!primaryRole) return [];
  const hasFoundation = Boolean(resume.name && (resume.summary || resume.education.length || resume.experience.length));
  const hasSkills = resume.skills.length > 0;
  const hasEvidence = resume.projects.length > 0 || resume.experience.length > 0;
  const missing = gap?.missing_skills?.slice(0, 4).map((item) => item.skill) || [];
  const source = [
    { id: "foundation", title: "Profile foundation", description: "Complete the profile signals needed for a reliable career comparison.", skills: [], done: hasFoundation },
    { id: "skills", title: `Role skills for ${primaryRole.role}`, description: missing.length ? `Prioritize the skills your gap analysis marked as missing: ${missing.join(", ")}.` : "Review your current skills against the requirements of your target role.", skills: missing, done: hasSkills && missing.length === 0 },
    { id: "evidence", title: "Build credible evidence", description: "Add a project or experience entry that demonstrates your target-role skills.", skills: resume.skills.slice(0, 4), done: hasEvidence },
    { id: "interview", title: "Prepare for interviews", description: "Practice role-specific questions using your actual resume and projects.", skills: [], done: false },
  ];
  return source.map((item, index) => ({ ...item, status: completed.includes(item.id) || item.done ? "Completed" : index === 0 || completed.includes(source[index - 1]?.id) || source[index - 1]?.done ? "In progress" : "Upcoming" }));
}

function RoadmapCard({ milestones, completedMilestones, onToggle, onOpenInterview }) {
  return <WorkspaceCard>
    <CardHeading icon={ListChecks} title="Career Roadmap" subtitle="A practical next-step sequence based on your target role and current profile." action={<Button variant="ghost" onClick={onOpenInterview}><MessageSquareQuote className="h-3.5 w-3.5" /> Practice</Button>} />
    <div className="mt-5 space-y-0">{milestones.map((milestone, index) => { const done = milestone.status === "Completed"; return <div key={milestone.id} className="relative flex gap-3 pb-5 last:pb-0"><div className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card text-[11px] font-bold text-muted-foreground">{done ? <Check className="h-4 w-4 text-success" /> : index + 1}</div>{index < milestones.length - 1 && <div className="absolute left-4 top-8 h-[calc(100%-24px)] w-px bg-border" />}<div className="min-w-0 flex-1 rounded-xl border border-border bg-surface/45 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-[13px] font-bold">{milestone.title}</div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{milestone.description}</p></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${done ? "bg-success/10 text-success" : milestone.status === "In progress" ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground"}`}>{milestone.status}</span></div>{milestone.skills.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{milestone.skills.map((skill) => <span key={skill} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{skill}</span>)}</div>}<button type="button" onClick={() => onToggle(milestone.id)} className="mt-3 text-[11px] font-semibold text-primary hover:underline">{done || completedMilestones.includes(milestone.id) ? "Mark as upcoming" : "Mark complete"}</button></div></div>; })}</div>
  </WorkspaceCard>;
}

function ResourcesCard() {
  return <WorkspaceCard><CardHeading icon={BookOpen} title="Resources for You" subtitle="Curated learning resources will appear when a resource connection is available." action={<span className="text-[11px] font-medium text-muted-foreground">No external links</span>} /><div className="mt-4"><EmptyState icon={BookOpen} title="No resources connected yet" text="SmartHire does not currently have a resource library, so it will not invent guides or links here." /></div></WorkspaceCard>;
}

function SkillsCard({ resume, onNavigate }) {
  return <WorkspaceCard><CardHeading icon={Layers3} title="Skills Progress" subtitle="Skills from your resume, without invented proficiency scores." action={<Button variant="ghost" onClick={() => onNavigate("builder")}><Pencil className="h-3.5 w-3.5" /> Update skills</Button>} />{resume.skills.length === 0 ? <div className="mt-4"><EmptyState icon={Layers3} title="No skills added yet" text="Add your current skills in Resume Builder to use them in career insights." action={<Button onClick={() => onNavigate("builder")}>Add skills <ArrowRight className="h-3.5 w-3.5" /></Button>} /></div> : <div className="mt-4 space-y-3">{resume.skills.map((skill) => <div key={skill} className="flex items-center gap-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Settings2 className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><div className="text-[12px] font-semibold">{skill}</div><div className="mt-1 h-1.5 rounded-full bg-surface-2" /></div><span className="shrink-0 text-[10px] font-medium text-muted-foreground">Not assessed</span></div>)}</div>}</WorkspaceCard>;
}

function JobMatchCard({ resume }) {
  const [jobText, setJobText] = useState("");
  const [result, setResult] = useState(null);
  function analyze() {
    const words = jobText.toLowerCase().match(/[a-z][a-z0-9+#./-]{2,}/g) || [];
    const skillNames = resume.skills.map((skill) => skill.toLowerCase());
    const unique = Array.from(new Set(words.filter((word) => skillNames.includes(word) || /[+#./-]/.test(word)))).slice(0, 24);
    const resumeText = [resume.role, resume.summary, ...resume.skills, ...resume.projects.flatMap((project) => [project.name, project.description, ...project.tech]), ...resume.experience.flatMap((experience) => [experience.role, ...experience.bullets])].join(" ").toLowerCase();
    const matched = unique.filter((word) => resumeText.includes(word));
    const missing = unique.filter((word) => !resumeText.includes(word));
    setResult({ total: unique.length, matched, missing });
  }
  return <WorkspaceCard><CardHeading icon={Search} title="Job Match Simulator" subtitle="Paste a real job description to compare it with your resume." />{!result ? <><textarea value={jobText} onChange={(e) => setJobText(e.target.value)} rows={5} placeholder="Paste the job description here…" className="mt-4 w-full resize-y rounded-xl border border-input bg-background p-3 text-[12px] leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /><div className="mt-3 flex justify-end"><Button variant="primary" onClick={analyze} disabled={!jobText.trim()}><Search className="h-3.5 w-3.5" /> Analyze job</Button></div></> : <div className="mt-4"><div className="rounded-xl bg-surface/65 p-4"><div className="flex items-end justify-between gap-3"><div><div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Skill coverage</div><div className="mt-1 text-3xl font-bold">{result.total ? `${Math.round((result.matched.length / result.total) * 100)}%` : "—"}</div></div><div className="w-1/2 max-w-[220px]"><ProgressBar value={result.total ? (result.matched.length / result.total) * 100 : 0} tone="success" /></div></div><p className="mt-3 text-[11px] text-muted-foreground">This comparison uses only terms detected in the job description and evidence currently present in your resume.</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><div className="text-[10px] font-bold uppercase tracking-widest text-success">Matched · {result.matched.length}</div><div className="mt-2 flex flex-wrap gap-1.5">{result.matched.length ? result.matched.map((item) => <span key={item} className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">{item}</span>) : <span className="text-[11px] text-muted-foreground">No matching terms yet.</span>}</div></div><div><div className="text-[10px] font-bold uppercase tracking-widest text-destructive">Missing · {result.missing.length}</div><div className="mt-2 flex flex-wrap gap-1.5">{result.missing.length ? result.missing.map((item) => <span key={item} className="rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive">{item}</span>) : <span className="text-[11px] text-muted-foreground">No missing terms detected.</span>}</div></div></div><Button className="mt-4" onClick={() => { setResult(null); setJobText(""); }}>Analyze another job</Button></div>}</WorkspaceCard>;
}

function SavedRolesCard({ roles, primaryId, onSelect, onEdit, onDelete, onNewRole }) {
  return <WorkspaceCard><CardHeading icon={Target} title="Saved Target Roles" subtitle="Your goals, priorities, and assessment status." action={<Button variant="ghost" onClick={onNewRole}><Plus className="h-3.5 w-3.5" /> Add role</Button>} />{roles.length === 0 ? <div className="mt-4"><EmptyState icon={Target} title="No saved roles" text="Add a target role to personalize your roadmap." action={<Button onClick={onNewRole}>Add target role</Button>} /></div> : <div className="mt-4 space-y-2">{roles.map((role) => <div key={role.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/45 p-3"><button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(role.id)}><div className="truncate text-[12px] font-bold">{role.role}</div><div className="mt-1 text-[10px] text-muted-foreground">{role.priority}{role.experience ? ` · ${role.experience}` : ""}</div></button><span className="shrink-0 text-[10px] font-semibold text-muted-foreground">{role.id === primaryId ? "Primary" : typeof role.match === "number" ? `${role.match}%` : "Not assessed"}</span><button type="button" onClick={() => onEdit(role)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2" aria-label={`Edit ${role.role}`}><Edit3 className="h-3.5 w-3.5" /></button><button type="button" onClick={() => onDelete(role.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${role.role}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}</WorkspaceCard>;
}

function ActivityCard({ history, activity }) {
  const events = [...activity, ...history.map((event) => ({ id: `history-${event.id}`, text: event.text, at: event.at }))].sort((a, b) => b.at - a.at).slice(0, 6);
  return <WorkspaceCard><CardHeading icon={Activity} title="Recent Activity" subtitle="Actions recorded from your workspace and resume session." action={events.length ? <span className="text-[10px] font-medium text-muted-foreground">{events.length} recent</span> : null} />{events.length === 0 ? <div className="mt-4"><EmptyState icon={Activity} title="No activity yet" text="Your career activities will appear here as you use SmartHire AI." /></div> : <ol className="mt-4 space-y-2">{events.map((event) => <li key={event.id} className="flex items-start gap-2.5 rounded-xl bg-surface/45 p-3"><div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Check className="h-3.5 w-3.5" /></div><div className="min-w-0"><div className="text-[11px] font-medium leading-relaxed">{event.text}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{formatRelative(event.at)}</div></div></li>)}</ol>}</WorkspaceCard>;
}

function InterviewCard({ resume, open, onToggle }) {
  return <WorkspaceCard><CardHeading icon={MessageSquareQuote} title="Interview Coach" subtitle="Practice against the role and projects you actually have." action={<Button variant="ghost" onClick={onToggle}>{open ? "Hide coach" : "Start practice"} <ArrowRight className="h-3.5 w-3.5" /></Button>} />{open ? <div className="mt-4"><InterviewCoach resume={{ name: resume.name, role: resume.role, summary: resume.summary, skills: resume.skills, projects: resume.projects.map((project) => ({ name: project.name })) }} /></div> : <div className="mt-4 grid gap-2 sm:grid-cols-2">{[{ icon: Users, title: "Behavioral questions", text: "Practice stories from your actual experience." }, { icon: Rocket, title: "Technical questions", text: "Generate role-specific prompts from your skills." }, { icon: FileText, title: "Resume review", text: "Use your current resume as the source of truth." }, { icon: MessageSquareQuote, title: "Mock interview", text: "Open a guided question set when ready." }].map((item) => <div key={item.title} className="flex items-center gap-3 rounded-xl border border-border bg-surface/45 p-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><item.icon className="h-3.5 w-3.5" /></div><div><div className="text-[11px] font-bold">{item.title}</div><div className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{item.text}</div></div></div>)}</div>}</WorkspaceCard>;
}

export function CareerWorkspace({ resume, score, history, onNavigate, onAddSkill, onPushHistory }) {
  const [workspace, setWorkspace] = useState({ roles: [], completedMilestones: [], activity: [] });
  const [roleModal, setRoleModal] = useState(null);
  const [gap, setGap] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState("");
  const [gapDetailsOpen, setGapDetailsOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);

  useEffect(() => setWorkspace(readWorkspace()), []);
  useEffect(() => { if (workspace.roles.length || workspace.activity.length || workspace.completedMilestones.length) saveWorkspace(workspace); }, [workspace]);

  const primaryRole = useMemo(() => workspace.roles.find((role) => role.id === workspace.roles.find((item) => item.priority === "Primary Goal")?.id) || workspace.roles[0] || null, [workspace.roles]);
  const milestones = useMemo(() => buildMilestones(primaryRole, resume, gap, workspace.completedMilestones), [primaryRole, resume, gap, workspace.completedMilestones]);

  function record(text) {
    const event = { id: `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, at: Date.now() };
    setWorkspace((current) => ({ ...current, activity: [event, ...current.activity].slice(0, 20) }));
    onPushHistory?.(text);
  }

  function saveRole(nextRole) {
    const id = nextRole.id || `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setWorkspace((current) => {
      const exists = current.roles.some((role) => role.id === id);
      const nextRoles = exists ? current.roles.map((role) => role.id === id ? { ...role, ...nextRole, id } : role) : [...current.roles, { ...nextRole, id }];
      if (!nextRoles.some((role) => role.priority === "Primary Goal")) nextRoles[0].priority = "Primary Goal";
      return { ...current, roles: nextRoles };
    });
    record(nextRole.id ? `Updated target role: ${nextRole.role}` : `Added target role: ${nextRole.role}`);
    setRoleModal(null);
  }

  function deleteRole(id) {
    const role = workspace.roles.find((item) => item.id === id);
    setWorkspace((current) => ({ ...current, roles: current.roles.filter((item) => item.id !== id) }));
    if (role) record(`Removed target role: ${role.role}`);
  }

  function selectRole(id) {
    const selected = workspace.roles.find((role) => role.id === id);
    if (!selected) return;
    setWorkspace((current) => ({ ...current, roles: current.roles.map((role) => ({ ...role, priority: role.id === id ? "Primary Goal" : role.priority === "Primary Goal" ? "Secondary Goal" : role.priority })) }));
    setGap(null);
  }

  async function runGap() {
    if (!primaryRole) return;
    setGapLoading(true);
    setGapError("");
    try {
      const result = await analyzeCareerGap({ skills: resume.skills, existingProjects: resume.projects.map((project) => project.name), targetRole: primaryRole.role, resumeSummary: resume.summary });
      setGap(result);
      setWorkspace((current) => ({ ...current, roles: current.roles.map((role) => role.id === primaryRole.id ? { ...role, match: typeof result.readiness === "number" ? result.readiness : null } : role) }));
      record(`Ran career gap analysis for ${primaryRole.role}`);
    } catch (error) {
      setGapError(error instanceof Error ? error.message : "Unable to load career insights. Please try again.");
    } finally {
      setGapLoading(false);
    }
  }

  function toggleMilestone(id) {
    const isComplete = workspace.completedMilestones.includes(id);
    setWorkspace((current) => ({ ...current, completedMilestones: isComplete ? current.completedMilestones.filter((item) => item !== id) : [...current.completedMilestones, id] }));
    const milestone = milestones.find((item) => item.id === id);
    if (milestone) record(`${isComplete ? "Reopened" : "Completed"} milestone: ${milestone.title}`);
  }

  const hasSetup = workspace.roles.length > 0;
  return <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8"><div className="mx-auto max-w-[1480px] space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Career Workspace</h1><span className="hidden rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-primary sm:inline-flex">Career command center</span></div><p className="mt-1.5 text-sm text-muted-foreground">Plan your career, track progress, and achieve your professional goals.</p></div><div className="flex items-center gap-2"><Button onClick={() => setRoleModal({})}><Plus className="h-3.5 w-3.5" /> New target role</Button><button type="button" className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground" aria-label="How Career Workspace works" title="How it works"><CircleHelp className="h-4 w-4" /></button></div></header>
    {!hasSetup ? <Onboarding resume={resume} onNewRole={() => setRoleModal({})} onNavigate={onNavigate} /> : <>
      <CareerOverview resume={resume} score={score} roles={workspace.roles} primaryRole={primaryRole} gap={gap} onNewRole={() => setRoleModal({})} />
      <div className="grid items-start gap-5 xl:grid-cols-2"><GapSummaryCard resume={resume} primaryRole={primaryRole} gap={gap} loading={gapLoading} error={gapError} onRun={runGap} onViewDetails={() => setGapDetailsOpen(true)} onAddSkill={onAddSkill} /><TargetRoleProgress roles={workspace.roles} primaryId={primaryRole?.id} onSelect={selectRole} onEdit={(role) => setRoleModal(role)} onDelete={deleteRole} onNewRole={() => setRoleModal({})} /></div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"><RoadmapCard milestones={milestones} completedMilestones={workspace.completedMilestones} onToggle={toggleMilestone} onOpenInterview={() => setInterviewOpen(true)} /><ResourcesCard /></div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]"><JobMatchCard resume={resume} /><ActivityCard history={history} activity={workspace.activity} /></div>
      <div className="grid items-start gap-5 xl:grid-cols-3"><SkillsCard resume={resume} onNavigate={onNavigate} /><SavedRolesCard roles={workspace.roles} primaryId={primaryRole?.id} onSelect={selectRole} onEdit={(role) => setRoleModal(role)} onDelete={deleteRole} onNewRole={() => setRoleModal({})} /><InterviewCard resume={resume} open={interviewOpen} onToggle={() => setInterviewOpen((value) => !value)} /></div>
      <WorkspaceCard className="bg-gradient-soft"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-start gap-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" /><div><div className="text-[13px] font-bold">Pro tip</div><p className="mt-1 text-[12px] text-muted-foreground">{!resume.name ? "Add your name and resume details to unlock more personalized insights." : !resume.skills.length ? "Add your current skills to improve your gap analysis." : !gap ? "Run a gap analysis to make your next career action specific." : "Use the next roadmap milestone to turn your profile gaps into evidence."}</p></div></div><Button variant="ghost" onClick={() => !resume.name || !resume.skills.length ? onNavigate("builder") : runGap()}>{!gap ? "Take next step" : "Refresh insights"} <ArrowRight className="h-3.5 w-3.5" /></Button></div></WorkspaceCard>
    </>}
    {roleModal && <TargetRoleModal initialRole={roleModal.id ? roleModal : null} onClose={() => setRoleModal(null)} onSave={saveRole} />}
    {gapDetailsOpen && gap && <GapDetails gap={gap} role={primaryRole?.role || "target role"} onAddSkill={onAddSkill} />}
  </div></main>;
}