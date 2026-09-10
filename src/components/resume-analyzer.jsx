import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  FileArchive,
  FileCheck2,
  FileText,
  Gauge,
  Info,
  Loader2,
  MessageSquareText,
  Radar,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const CAPABILITIES = [
  [Gauge, "ATS Compatibility", "Evaluate ATS-friendly formatting and structure."],
  [Sparkles, "Content Quality", "Evaluate clarity, relevance, and quality of content."],
  [FileCheck2, "Structure & Layout", "Analyze organization and resume structure."],
  [Zap, "Impact & Metrics", "Identify quantified achievements and measurable impact."],
  [Target, "Skills & Keywords", "Identify relevant skills and keywords."],
  [MessageSquareText, "Grammar & Readability", "Evaluate grammar, clarity, and readability."],
];

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(name) {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.find((extension) => lower.endsWith(extension)) ?? "";
}

function fileType(file) {
  const extension = getExtension(file.name);
  if (!extension || (file.type && !ACCEPTED_TYPES.has(file.type))) return null;
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "text/plain";
}

function band(score) {
  if (typeof score !== "number") return { label: "Not available", tone: "muted" };
  if (score >= 85) return { label: "Excellent", tone: "success" };
  if (score >= 70) return { label: "Very Good", tone: "success" };
  if (score >= 55) return { label: "Good", tone: "warning" };
  if (score >= 40) return { label: "Needs Improvement", tone: "warning" };
  return { label: "Poor", tone: "danger" };
}

function toneClasses(tone) {
  return {
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[tone];
}

function Panel({ children, className = "" }) {
  return <section className={`rounded-2xl border border-border bg-card p-5 shadow-elegant ${className}`}>{children}</section>;
}

function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>}
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function ScoreRing({ score, size = 132 }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * safeScore) / 100} className="text-primary transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><div className="text-[34px] font-bold leading-none tracking-tight">{typeof score === "number" ? score : "—"}</div><div className="mt-1 text-[11px] text-muted-foreground">/ 100</div></div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, metric, icon: Icon }) {
  const status = band(score);
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[12px] font-semibold"><Icon className="h-4 w-4 text-primary" />{label}</div>
      <div className="mt-4 flex items-end justify-between gap-3"><span className="text-[28px] font-bold leading-none">{typeof score === "number" ? score : "—"}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${toneClasses(status.tone)}`}>{status.label}</span></div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${typeof score === "number" ? score : 0}%` }} /></div>
      {metric && <p className="mt-2 text-[11px] text-muted-foreground">{metric}</p>}
    </div>
  );
}

function HowItWorks({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-foreground/20 p-4" role="dialog" aria-modal="true" aria-labelledby="how-it-works-title">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-glow">
        <div className="flex items-start justify-between gap-4"><div><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><CircleHelp className="h-5 w-5" /></div><h2 id="how-it-works-title" className="mt-4 text-lg font-bold">How it works</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button></div>
        <ol className="mt-5 space-y-4">{["Upload a PDF, DOCX, or TXT resume.", "We read the content and review the signals recruiters and ATS systems look for.", "Get a score, matched keywords, gaps, and prioritized improvements you can act on."].map((item, index) => <li key={item} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span><span className="leading-relaxed text-muted-foreground">{item}</span></li>)}</ol>
        <Button className="mt-6 w-full" onClick={onClose}>Got it</Button>
      </div>
    </div>
  );
}

function LoadingState({ phase }) {
  const steps = [
    ["read", "Reading resume content"],
    ["structure", "Checking structure"],
    ["analyze", "Evaluating ATS compatibility"],
    ["insights", "Identifying strengths and weaknesses"],
    ["recommend", "Generating recommendations"],
  ];
  const phaseIndex = phase === "reading" ? 0 : 2;
  return <Panel className="mx-auto w-full max-w-2xl"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Loader2 className="h-5 w-5 animate-spin" /></div><div><h2 className="font-bold">Analyzing your resume</h2><p className="text-[12px] text-muted-foreground">This may take a moment while the AI reviews your document.</p></div></div><ol className="mt-6 space-y-3">{steps.map(([key, label], index) => { const done = index < phaseIndex; const current = index === phaseIndex; return <li key={key} className="flex items-center gap-3 text-sm"><span className={`grid h-6 w-6 place-items-center rounded-full ${done ? "bg-success text-success-foreground" : current ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{done ? <Check className="h-3.5 w-3.5" /> : current ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><span className={current ? "font-semibold" : done ? "text-foreground" : "text-muted-foreground"}>{label}</span></li>; })}</ol></Panel>;
}

function RadarChart({ dimensions }) {
  if (!dimensions?.length) return <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border bg-surface p-6 text-center"><div><Radar className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">Strength profile not available yet</p><p className="mt-1 max-w-xs text-[12px] text-muted-foreground">The analysis did not return enough evidence to score these dimensions.</p></div></div>;
  const size = 300; const center = 150; const radius = 92; const count = dimensions.length;
  const point = (index, ratio) => { const angle = (index * Math.PI * 2) / count - Math.PI / 2; return [center + Math.cos(angle) * radius * ratio, center + Math.sin(angle) * radius * ratio]; };
  const polygon = (ratio) => dimensions.map((_, index) => point(index, ratio).join(",")).join(" ");
  const dataPoints = dimensions.map((item, index) => point(index, Math.max(0, Math.min(100, item.value)) / 100).join(",")).join(" ");
  return <div className="mx-auto w-full max-w-sm"><svg viewBox="0 0 300 300" className="w-full" role="img" aria-label="Resume strength radar chart">{[0.25, 0.5, 0.75, 1].map((ratio) => <polygon key={ratio} points={polygon(ratio)} fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />)}{dimensions.map((item, index) => { const [x, y] = point(index, 1); return <line key={item.label} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeWidth="1" className="text-border" />; })}<polygon points={dataPoints} fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="2" className="text-primary" />{dimensions.map((item, index) => { const [x, y] = point(index, 1.18); return <g key={item.label}><text x={x} y={y} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>{item.label}</text><text x={x} y={y + 13} textAnchor="middle" className="fill-foreground" style={{ fontSize: 10, fontWeight: 700 }}>{item.value}/100</text></g>; })}</svg></div>;
}

function KeywordGroups({ keywords }) {
  const groups = [["Matched", keywords?.matched, "bg-success/10 text-success border-success/20", Check], ["Partial", keywords?.partial, "bg-warning/15 text-warning-foreground border-warning/20", Info], ["Missing", keywords?.missing, "bg-destructive/10 text-destructive border-destructive/20", X]];
  if (!keywords?.hasJobDescription) return <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-surface p-6 text-center"><div><Target className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">Add a job description for keyword matching</p><p className="mt-1 text-[12px] text-muted-foreground">Role-specific matched, partial, and missing keywords will appear here.</p></div></div>;
  return <div className="space-y-4">{groups.map(([label, items, classes, Icon]) => <div key={label}><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label} <span className="normal-case tracking-normal">({items?.length ?? 0})</span></div><div className="mt-2 flex flex-wrap gap-2">{items?.length ? items.map((item) => <span key={item} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}>{item}</span>) : <span className="text-[12px] text-muted-foreground">None returned</span>}</div></div>)}</div>;
}

function ResultList({ title, items, kind = "issue", onImprove }) {
  if (!items?.length) return <div className="rounded-xl border border-dashed border-border bg-surface p-5 text-center text-[12px] text-muted-foreground">No {kind === "issue" ? "issues" : "recommendations"} were returned for this resume.</div>;
  return <div className="space-y-2">{items.map((item, index) => <div key={item.id || `${item.title}-${index}`} className="rounded-xl border border-border bg-surface p-3.5"><div className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[13px] font-semibold">{item.title}</h3>{item.priority && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">{item.priority}</span>}</div><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.explanation || item.description}</p>{item.suggestedImprovement && <p className="mt-2 text-[12px] font-medium text-foreground">Suggested improvement: {item.suggestedImprovement}</p>}{onImprove && <Button variant="link" size="sm" className="mt-2 h-auto px-0" onClick={onImprove}>{kind === "issue" ? "Improve in Resume Builder" : "Improve resume"}<ArrowRight className="h-3.5 w-3.5" /></Button>}</div></div></div>)}</div>;
}

function AnalyticsGrid({ analytics }) {
  const entries = [["Word count", analytics?.wordCount], ["Page count", analytics?.pageCount], ["Reading time", analytics?.readingTime], ["Action verbs", analytics?.actionVerbs], ["Keywords", analytics?.keywordCount], ["Buzzwords", analytics?.buzzwords], ["Sentences", analytics?.sentences], ["Passive voice", analytics?.passiveVoice]];
  const available = entries.filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (!available.length) return <div className="rounded-xl border border-dashed border-border bg-surface p-5 text-center text-[12px] text-muted-foreground">Resume analytics are not available for this document yet.</div>;
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{available.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-surface p-3"><div className="text-[11px] text-muted-foreground">{label}</div><div className="mt-1 text-lg font-bold">{value}</div></div>)}</div>;
}

export function ResumeAnalyzer({ onImprove }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [howItWorks, setHowItWorks] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzedSignature, setAnalyzedSignature] = useState("");

  const fileSignature = file ? `${file.name}:${file.size}:${file.lastModified}` : "";
  const isStale = Boolean(analysis && fileSignature !== analyzedSignature);
  const canAnalyze = Boolean(file) && phase !== "reading" && phase !== "analyzing";

  function validateFile(nextFile) {
    if (!nextFile || !fileType(nextFile)) return "Unsupported file type. Please upload a PDF, DOCX, or TXT resume.";
    if (nextFile.size > MAX_FILE_SIZE) return "This file exceeds the maximum allowed size of 5 MB.";
    return "";
  }

  function chooseFile(nextFile) {
    const validation = validateFile(nextFile);
    setError(validation);
    if (validation) return;
    setFile(nextFile);
    setAnalysis(null);
    setAnalyzedSignature("");
    setPhase("idle");
  }

  function onFileInput(event) {
    chooseFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  async function analyze() {
    if (!file) { setError("Choose a resume file before analyzing."); return; }
    if (jobDescription.length > 3000) { setError("Job descriptions must be 3,000 characters or fewer."); return; }
    setError(""); setPhase("reading");
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      const base64 = btoa(binary);
      setPhase("analyzing");
      const response = await fetch("/api/analyze-resume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file: { name: file.name, type: fileType(file), size: file.size, base64 }, jobDescription: jobDescription.trim() || null }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Resume analysis couldn't be completed. Please try again.");
      setAnalysis(payload.analysis); setAnalyzedSignature(fileSignature); setPhase("done");
    } catch (caught) {
      setPhase("error"); setError(caught instanceof Error ? caught.message : "Something went wrong while connecting to the analysis service.");
    }
  }

  function downloadReport() {
    if (!analysis) return;
    const lines = [`Resume Analyzer report`, `File: ${analysis.fileName || file?.name || "Resume"}`, `Generated: ${new Date().toLocaleString()}`, "", `Overall score: ${analysis.overallScore ?? "Not available"}/100`, analysis.explanation || "", "", "Recommendations", ...(analysis.recommendations || []).map((item, index) => `${index + 1}. ${item.title}: ${item.suggestedImprovement || item.explanation}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${(file?.name || "resume").replace(/\.[^.]+$/, "")}-analysis.txt`; anchor.click(); URL.revokeObjectURL(url);
  }

  const headerAction = useMemo(() => analysis ? <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={downloadReport}><Download /> Download Report</Button><Button onClick={analyze} disabled={!canAnalyze}><RefreshCw className={phase === "analyzing" ? "animate-spin" : ""} /> {phase === "analyzing" ? "Analyzing…" : "Re-analyze"}</Button></div> : <Button variant="outline" onClick={() => setHowItWorks(true)}><CircleHelp /> How it works?</Button>, [analysis, canAnalyze, phase, fileSignature]);

  return <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 sm:p-6 lg:p-8"><HowItWorks open={howItWorks} onClose={() => setHowItWorks(false)} /><div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Resume Analyzer</h1><p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">{analysis ? "Review AI-powered insights and actionable recommendations for your resume." : "Upload your resume to get AI-powered insights, ATS feedback, and actionable recommendations."}</p></div>{headerAction}</header>
    {analysis ? <>
      <Panel className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div><div className="min-w-0"><div className="truncate text-[14px] font-bold">{analysis.fileName || file?.name}</div><div className="mt-1 text-[12px] text-muted-foreground">Analyzed from your selected file{analysis.analyzedAt ? ` · ${new Date(analysis.analyzedAt).toLocaleString()}` : ""}</div></div></div>{isStale && <div className="flex items-center gap-2 rounded-lg bg-warning/15 px-3 py-2 text-[12px] font-medium text-warning-foreground"><Info className="h-4 w-4" /> Your resume changed since this analysis. Re-analyze for updated results.</div>}</Panel>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]"><Panel><div className="text-[13px] font-semibold">Overall Resume Score</div><div className="mt-5 flex flex-wrap items-center gap-5"><ScoreRing score={analysis.overallScore} /><div className="min-w-0"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses(band(analysis.overallScore).tone)}`}>{band(analysis.overallScore).label}</span><p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{analysis.explanation || "No explanation was returned for this score."}</p></div></div></Panel><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><ScoreCard icon={Target} label="ATS Score" score={analysis.scores?.ats} metric={analysis.scores?.atsMetric} /><ScoreCard icon={MessageSquareText} label="Grammar" score={analysis.scores?.grammar} metric={analysis.scores?.grammarMetric} /><ScoreCard icon={Zap} label="Impact" score={analysis.scores?.impact} metric={analysis.scores?.impactMetric} /><ScoreCard icon={FileText} label="Readability" score={analysis.scores?.readability} metric={analysis.scores?.readabilityMetric} /></div></div>
      <div className="grid gap-4 xl:grid-cols-2"><Panel><SectionTitle icon={Target} title="ATS Keyword Analysis" subtitle="Compare your resume against the supplied job description." /><div className="mt-5"><KeywordGroups keywords={analysis.keywords} /></div></Panel><Panel><SectionTitle icon={Radar} title="Resume Strength Radar" subtitle="Dimensions supported by evidence in the analysis." /><div className="mt-3"><RadarChart dimensions={analysis.radar} /></div></Panel></div>
      <div className="grid gap-4 xl:grid-cols-2"><Panel><SectionTitle icon={AlertCircle} title="Missing Sections & Signals" subtitle="Only issues detected in this analysis are shown." /><div className="mt-4"><ResultList title="Issues" items={analysis.issues} onImprove={onImprove} /></div></Panel><Panel><SectionTitle icon={Sparkles} title="Top Improvement Recommendations" subtitle="Prioritized next actions from the analysis." /><div className="mt-4"><ResultList title="Recommendations" items={analysis.recommendations} kind="recommendation" onImprove={onImprove} /></div></Panel></div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"><Panel><SectionTitle icon={Target} title="Job Match" subtitle="Role-specific match from the supplied job description." /><div className="mt-4">{analysis.jobMatch?.available ? <div className="flex items-center gap-4"><ScoreRing score={analysis.jobMatch.score} size={104} /><div><div className="text-lg font-bold">{analysis.jobMatch.label || band(analysis.jobMatch.score).label}</div><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{analysis.jobMatch.explanation}</p></div></div> : <div className="rounded-xl border border-dashed border-border bg-surface p-5 text-center text-[12px] text-muted-foreground">Add a job description before analysis to see how closely this resume matches a specific role.</div>}</div></Panel><Panel><SectionTitle icon={FileArchive} title="Resume Analytics" subtitle="Metrics returned for this document." /><div className="mt-4"><AnalyticsGrid analytics={analysis.analytics} /></div></Panel></div>
    </> : <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.8fr)]"><div className="space-y-5"><Panel className={`min-h-[340px] border-dashed ${dragging ? "border-primary bg-primary/5" : ""}`}><div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0] ?? null); }} className="grid min-h-[290px] place-items-center rounded-xl border border-dashed border-border bg-surface/60 p-6 text-center"><div className="max-w-md"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><UploadCloud className="h-7 w-7" /></div><h2 className="mt-5 text-[19px] font-bold">Upload your resume to get started</h2><p className="mt-2 text-[13px] text-muted-foreground">PDF, DOCX or TXT · Maximum 5 MB</p><input ref={inputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={onFileInput} className="sr-only" /><Button className="mt-5" onClick={() => inputRef.current?.click()}><UploadCloud /> Upload Resume</Button><p className="mt-3 text-[12px] text-muted-foreground">or drag and drop here</p></div></div></Panel>{file && <Panel><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div><div className="min-w-0"><div className="truncate text-[13px] font-bold">{file.name}</div><div className="mt-1 text-[11px] text-muted-foreground">{formatBytes(file.size)} · Ready to analyze</div></div></div><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => { setFile(null); setAnalysis(null); setError(""); }} aria-label="Remove selected resume"><Trash2 /></Button><Button onClick={analyze} disabled={!canAnalyze}>{phase === "analyzing" ? <><Loader2 className="animate-spin" /> Analyzing…</> : <>Analyze Resume <ArrowRight /></>}</Button></div></div></Panel>}{phase === "reading" || phase === "analyzing" ? <LoadingState phase={phase} /> : null}{phase === "error" || error ? <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0"><div className="font-semibold">We couldn't complete the analysis</div><p className="mt-1 leading-relaxed">{error}</p><Button variant="link" size="sm" className="mt-2 h-auto px-0 text-destructive" onClick={() => { setError(""); setPhase("idle"); }}>Try again <ChevronRight /></Button></div></div> : null}</div><Panel className="h-fit bg-primary/[0.03]"><SectionTitle icon={CircleHelp} title="How it works" subtitle="A clear path from document to next steps." /><ol className="mt-5 space-y-4">{["Upload your latest resume", "Let AI review structure, content, and ATS signals", "Get specific improvements to make next"].map((item, index) => <li key={item} className="flex gap-3 text-[12px]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{index + 1}</span><span className="pt-1 leading-relaxed text-muted-foreground">{item}</span></li>)}</ol><Button variant="link" className="mt-4 h-auto px-0" onClick={() => setHowItWorks(true)}>Learn more <ArrowRight /></Button></Panel></div>
      <Panel><SectionTitle title="What we analyze" subtitle="These capabilities describe the checks available, not your results." /><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{CAPABILITIES.map(([Icon, title, description]) => <div key={title} className="rounded-xl border border-border bg-surface p-4"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><div className="mt-3 text-[13px] font-semibold">{title}</div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p></div>)}</div></Panel>
      <Panel><SectionTitle icon={MessageSquareText} title="Get more personalized results" subtitle="Add a job description to compare your resume against a specific role." /><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]"><div><label htmlFor="job-description" className="text-[12px] font-semibold">Paste Job Description <span className="font-normal text-muted-foreground">(Optional)</span></label><textarea id="job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value.slice(0, 3000))} rows={6} placeholder="Paste the job description here…" className="mt-2 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /><div className="mt-1 text-[11px] text-muted-foreground">{jobDescription.length} / 3000 characters</div></div><div><div className="text-[12px] font-semibold">Target-role helpers</div><div className="mt-3 flex flex-wrap gap-2">{["Frontend Developer", "Backend Engineer", "Full Stack Developer", "Data Analyst", "UI/UX Designer"].map((role) => <button type="button" key={role} onClick={() => setJobDescription((current) => current ? `${current}\n\nTarget role: ${role}`.slice(0, 3000) : `Target role: ${role}`)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-medium transition hover:border-primary/40 hover:text-primary">{role}</button>)}</div><div className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Role chips only help start your input; they are not analysis results.</div></div></div></Panel>
    </>}
  </div></main>;
}