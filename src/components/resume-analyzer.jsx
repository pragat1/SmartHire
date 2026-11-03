import { useRef, useState } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
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
import { analyzeResumeText, matchJobDescription } from "@/lib/resume-analysis";

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

const SECTION_LABELS = { summary: "Summary", experience: "Experience", education: "Education", skills: "Skills", projects: "Projects", certifications: "Certifications", achievements: "Achievements", languages: "Languages" };

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

async function extractResume(file, onProgress = () => {}) {
  if (typeof Map.prototype.getOrInsertComputed !== "function") {
    Object.defineProperty(Map.prototype, "getOrInsertComputed", {
      configurable: true,
      value(key, callback) {
        if (this.has(key)) return this.get(key);
        const value = callback(key, this);
        this.set(key, value);
        return value;
      },
      writable: true,
    });
  }
  const buffer = await file.arrayBuffer();
  const extension = getExtension(file.name);
  if (extension === ".txt") return { text: new TextDecoder().decode(buffer), pageCount: null };
  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return { text: result.value, pageCount: null };
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const document = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  if (document.numPages > 100) throw new Error("This PDF has more than 100 pages. Please choose a shorter resume document.");
  const pages = [];
  let ocrWorker = null;
  let usedOcr = false;
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = content.items.map((item) => "str" in item ? item.str : "").join(" ").trim();
      const wordCount = pageText.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
      if (pageText.length < 60 || wordCount < 10) {
        usedOcr = true;
        if (!ocrWorker) {
          const { createWorker } = await import("tesseract.js");
          ocrWorker = await createWorker("eng", 1, {
            workerPath: "/vendor/tesseract/worker.min.js",
            corePath: "/vendor/tesseract/core",
            langPath: "/vendor/tesseract/lang",
            gzip: true,
            logger: (message) => {
              if (message.status) onProgress(`${message.status}${typeof message.progress === "number" ? ` · ${Math.round(message.progress * 100)}%` : ""}`);
            },
          });
        }
        onProgress(`Recognizing scanned page ${pageNumber} of ${document.numPages}.`);
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = globalThis.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("This browser couldn't prepare a PDF page for text recognition.");
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const recognized = await ocrWorker.recognize(canvas);
        pageText = recognized.data.text.trim() || pageText;
        canvas.width = 0;
        canvas.height = 0;
      }
      pages.push(pageText);
    }
  } finally {
    if (ocrWorker) await ocrWorker.terminate();
  }
  return { text: pages.join("\n"), pageCount: document.numPages, usedOcr };
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
  return <section className={`rounded-xl border border-border bg-card p-3.5 shadow-elegant sm:p-4 ${className}`}>{children}</section>;
}

function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>}
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function ScoreRing({ score, size = 96, label = "/ 100" }) {
  const stroke = 9;
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
        <div><div className="text-[26px] font-bold leading-none tracking-tight">{typeof score === "number" ? score : "—"}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{label}</div></div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, metric, icon: Icon }) {
  const status = band(score);
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold"><Icon className="h-3.5 w-3.5 text-primary" />{label}</div>
      <div className="mt-2.5 flex items-end justify-between gap-2"><span className="text-[24px] font-bold leading-none">{typeof score === "number" ? score : "—"}</span><span className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${toneClasses(status.tone)}`}>{status.label}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${typeof score === "number" ? score : 0}%` }} /></div>
      <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground">{metric}</p>
    </div>
  );
}

function HowItWorks({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-foreground/20 p-4" role="dialog" aria-modal="true" aria-labelledby="how-it-works-title">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-glow">
        <div className="flex items-start justify-between gap-4"><div><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><CircleHelp className="h-5 w-5" /></div><h2 id="how-it-works-title" className="mt-4 text-lg font-bold">How it works</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button></div>
        <ol className="mt-5 space-y-4">{["Upload a PDF, DOCX, or TXT resume.", "Review and correct the extracted text, then get an instant score with matched keywords, gaps, and prioritized improvements.", "All scores are calculated directly from your resume text; an optional AI narrative can add extra suggestions when available."].map((item, index) => <li key={item} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span><span className="leading-relaxed text-muted-foreground">{item}</span></li>)}</ol>
        <Button className="mt-6 w-full" onClick={onClose}>Got it</Button>
      </div>
    </div>
  );
}

function LoadingState({ phase, progressText }) {
  return <Panel className="mx-auto w-full max-w-2xl"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Loader2 className="h-5 w-5 animate-spin" /></div><div><h2 className="font-bold">Preparing your editable text preview</h2><p className="text-[12px] text-muted-foreground">{progressText || "Reading your document and recognizing scanned pages when needed."}</p></div></div></Panel>;
}

function RadarChart({ dimensions }) {
  if (!dimensions?.length) return <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-center"><Radar className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-[12px] font-semibold">Not available</p></div>;
  const size = 230; const center = size / 2; const radius = 74; const count = dimensions.length;
  const point = (index, ratio) => { const angle = (index * Math.PI * 2) / count - Math.PI / 2; return [center + Math.cos(angle) * radius * ratio, center + Math.sin(angle) * radius * ratio]; };
  const polygon = (ratio) => dimensions.map((_, index) => point(index, ratio).join(",")).join(" ");
  const dataPoints = dimensions.map((item, index) => point(index, Math.max(0, Math.min(100, item.value)) / 100).join(",")).join(" ");
  return <div className="mx-auto w-full max-w-[280px]"><svg viewBox={`0 0 ${size} ${size}`} className="w-full" role="img" aria-label="Resume strength radar chart">{[0.25, 0.5, 0.75, 1].map((ratio) => <polygon key={ratio} points={polygon(ratio)} fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />)}{dimensions.map((item, index) => { const [x, y] = point(index, 1); return <line key={item.label} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeWidth="1" className="text-border" />; })}<polygon points={dataPoints} fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="2" className="text-primary" />{dimensions.map((item, index) => { const [x, y] = point(index, 1.22); return <text key={item.label} x={x} y={y} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9.5, fontWeight: 600 }}>{item.label} {Math.round(item.value)}</text>; })}</svg></div>;
}

function KeywordGroups({ keywords, onAddJobDescription, skills, jobMatch, onReanalyzeWithJob }) {
  const groups = [["Matched", keywords?.matched, "bg-success/10 text-success border-success/20", Check], ["Partial", keywords?.partial, "bg-warning/15 text-warning-foreground border-warning/20", Info], ["Missing", keywords?.missing, "bg-destructive/10 text-destructive border-destructive/20", X]];
  return (
    <div className="space-y-3">
      {jobMatch?.available && <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5"><ScoreRing score={jobMatch.score} size={64} label="match" /><div className="min-w-0"><div className="text-[13px] font-bold">Job match: {jobMatch.label}</div><p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{jobMatch.explanation}</p></div></div>}
      {!keywords?.hasJobDescription ? (
        <div>
          {skills?.length > 0 && <div><div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Skills detected ({skills.length})</div><div className="mt-2 flex flex-wrap gap-1.5">{skills.slice(0, 24).map((item) => <span key={item} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium">{item}</span>)}{skills.length > 24 && <span className="text-[11px] text-muted-foreground">+{skills.length - 24} more</span>}</div></div>}
          <div className="mt-3 rounded-lg border border-dashed border-border bg-surface p-3 text-center"><Target className="mx-auto h-4 w-4 text-muted-foreground" /><p className="mt-1.5 text-[12px] font-semibold">Add a job description for keyword matching</p><Button variant="outline" size="sm" className="mt-2" onClick={onAddJobDescription}>Add Job Description</Button></div>
        </div>
      ) : (
        <div className="space-y-3">{groups.map(([label, items, classes, Icon]) => <div key={label}><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label} <span className="normal-case tracking-normal">({items?.length ?? 0})</span></div><div className="mt-1.5 flex flex-wrap gap-1.5">{items?.length ? items.map((item) => <span key={item} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${classes}`}>{item}</span>) : <span className="text-[12px] text-muted-foreground">None returned</span>}</div></div>)}</div>
      )}
    </div>
  );
}

function ResultList({ items, kind = "issue", onImprove }) {
  if (!items?.length) return <div className="rounded-lg border border-dashed border-border bg-surface p-3 text-center text-[12px] text-muted-foreground">No {kind === "issue" ? "issues" : "recommendations"} were found for this resume.</div>;
  return <div className="space-y-1.5">{items.map((item, index) => <div key={item.id || `${item.title}-${index}`} className="rounded-lg border border-border bg-surface p-2.5"><div className="flex items-start gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><h3 className="text-[12.5px] font-semibold">{item.title}</h3>{item.priority && <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${item.priority === "High" ? "bg-destructive/10 text-destructive" : item.priority === "Medium" ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{item.priority}</span>}{item.source === "ai" && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9.5px] font-semibold text-primary">AI insight</span>}</div><p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{item.explanation || item.description}</p>{item.suggestedImprovement && <p className="mt-1 text-[11.5px] font-medium leading-snug text-foreground">Suggested improvement: {item.suggestedImprovement}</p>}{onImprove && <Button variant="link" size="sm" className="mt-0.5 h-auto px-0" onClick={onImprove}>{kind === "issue" ? "Improve in Resume Builder" : "Improve resume"}<ArrowRight className="h-3 w-3" /></Button>}</div></div></div>)}</div>;
}

function AnalyticsGrid({ analytics }) {
  const entries = [["Word count", analytics?.wordCount], ["Page count", analytics?.pageCount], ["Reading time", analytics?.readingTime], ["Action verbs", analytics?.actionVerbs], ["Keywords", analytics?.keywordCount], ["Buzzwords", analytics?.buzzwords], ["Sentences", analytics?.sentences], ["Passive voice", analytics?.passiveVoice]];
  const available = entries.filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (!available.length) return <div className="rounded-lg border border-dashed border-border bg-surface p-3 text-center text-[12px] text-muted-foreground">Resume analytics are not available for this document yet.</div>;
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">{available.map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-surface px-2.5 py-2"><div className="text-[10.5px] text-muted-foreground">{label}</div><div className="mt-0.5 truncate text-[15px] font-bold">{value}</div></div>)}</div>;
}

function AiStatusNote({ aiStatus }) {
  if (aiStatus === "enhanced") return <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><Sparkles className="h-3 w-3 text-primary" /> Optional AI narrative included — scores remain calculated from your resume text.</div>;
  if (aiStatus === "checking") return <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Checking for an optional AI narrative…</div>;
  if (aiStatus === "unavailable") return <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><Info className="h-3 w-3" /> AI narrative unavailable — showing the complete analysis calculated from your resume text.</div>;
  return null;
}

export function ResumeAnalyzer({ onImprove }) {
  const inputRef = useRef(null);
  const analyzedSignatureRef = useRef("");
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [addingJobDescription, setAddingJobDescription] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [howItWorks, setHowItWorks] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [reviewText, setReviewText] = useState(null);
  const [extractedPageCount, setExtractedPageCount] = useState(null);
  const [usedOcr, setUsedOcr] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [failureStage, setFailureStage] = useState("");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzedSignature, setAnalyzedSignature] = useState("");
  const [aiStatus, setAiStatus] = useState("");

  const fileSignature = file ? `${file.name}:${file.size}:${file.lastModified}` : "";
  const contentSignature = JSON.stringify([fileSignature, reviewText ?? "", jobDescription]);
  const isStale = Boolean(analysis && contentSignature !== analyzedSignature);
  const canAnalyze = Boolean(file && reviewText?.trim().length >= 80) && phase !== "reading";

  function validateFile(nextFile) {
    if (!nextFile || !fileType(nextFile)) return "Unsupported file type. Please upload a PDF, DOCX, or TXT resume.";
    if (nextFile.size > MAX_FILE_SIZE) return "This file exceeds the maximum allowed size of 5 MB.";
    if (nextFile.size === 0) return "This file is empty. Please choose a resume with content.";
    return "";
  }

  function chooseFile(nextFile) {
    const validation = validateFile(nextFile);
    setError(validation);
    if (validation) return;
    setFile(nextFile);
    setAnalysis(null);
    setAnalyzedSignature("");
    analyzedSignatureRef.current = "";
    setAiStatus("");
    setReviewText(null);
    setExtractedPageCount(null);
    setUsedOcr(false);
    setPhase("idle");
    setFailureStage("");
  }

  function onFileInput(event) {
    chooseFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  async function reviewExtractedText() {
    if (!file) { setError("Choose a resume file before reviewing its text."); return; }
    setError(""); setFailureStage(""); setAnalysis(null); setProgressText("Reading selectable text from your document."); setPhase("reading");
    try {
      const result = await extractResume(file, setProgressText);
      if (!result.text || result.text.trim().length < 20) throw new Error("Almost no readable text was found in this document. It may be empty or corrupted — try exporting it again or use a different file.");
      setReviewText(result.text);
      setExtractedPageCount(result.pageCount);
      setUsedOcr(Boolean(result.usedOcr));
      setProgressText("");
      setPhase("review");
    } catch (caught) {
      setPhase("error"); setFailureStage("reading"); setError(caught instanceof Error ? caught.message : "Something went wrong while extracting resume text.");
    }
  }

  function runAnalysis() {
    if (!file || reviewText === null) { setError("Review the extracted resume text before analyzing."); return; }
    const textForAnalysis = reviewText.trim();
    if (textForAnalysis.length < 80) { setError("Add or correct the resume text above until it contains at least 80 characters."); return; }
    const signature = contentSignature;
    setError(""); setFailureStage(""); setAiStatus("");
    const base = analyzeResumeText({ fileName: file.name, text: textForAnalysis, pageCount: extractedPageCount });
    const jdMatch = matchJobDescription(textForAnalysis, jobDescription.trim());
    const withMatch = jdMatch
      ? { ...base, keywords: { hasJobDescription: true, matched: jdMatch.matched, partial: jdMatch.partial, missing: jdMatch.missing }, jobMatch: { available: jdMatch.available, score: jdMatch.score, label: jdMatch.label, explanation: jdMatch.explanation } }
      : base;
    setAnalysis(withMatch);
    setAnalyzedSignature(signature);
    analyzedSignatureRef.current = signature;
    setPhase("done");
    void enhanceWithAi(signature, textForAnalysis, extractedPageCount, jobDescription.trim() || null);
  }

  async function enhanceWithAi(signature, resumeText, pageCount, jobDescriptionValue) {
    setAiStatus("checking");
    try {
      const response = await fetch("/api/analyze-resume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileName: file?.name ?? "Resume", resumeText: resumeText.slice(0, 45000), pageCount, jobDescription: jobDescriptionValue }) });
      if (!response.ok) { if (signature === analyzedSignatureRef.current) setAiStatus("unavailable"); return; }
      const payload = await response.json().catch(() => ({}));
      if (signature !== analyzedSignatureRef.current || !payload?.analysis) { if (signature === analyzedSignatureRef.current) setAiStatus("unavailable"); return; }
      const ai = payload.analysis;
      const explanation = typeof ai.explanation === "string" && ai.explanation.trim().length > 40 ? ai.explanation.trim() : null;
      const normalizeTitle = (title) => String(title ?? "").toLowerCase().replace(/[^a-z]/g, "");
      setAnalysis((current) => {
        if (!current) return current;
        const existing = new Set((current.recommendations ?? []).map((item) => normalizeTitle(item.title)));
        const extra = (ai.recommendations ?? []).filter((item) => item?.title && !existing.has(normalizeTitle(item.title)) && ![...existing].some((title) => title.includes(normalizeTitle(item.title)) || normalizeTitle(item.title).includes(title))).slice(0, 3).map((item) => ({ ...item, id: `ai-${item.id ?? item.title}`, source: "ai" }));
        const narrative = explanation ?? current.explanation;
        return { ...current, explanation: narrative, recommendations: [...(current.recommendations ?? []), ...extra] };
      });
      if (signature === analyzedSignatureRef.current) setAiStatus(explanation || true ? "enhanced" : "unavailable");
    } catch {
      if (signature === analyzedSignatureRef.current) setAiStatus("unavailable");
    }
  }

  function retryFailedAction() {
    setError("");
    if (failureStage === "reading") void reviewExtractedText();
  }

  function downloadReport() {
    if (!analysis) return;
    const lines = ["Resume Analyzer report", `File: ${analysis.fileName || file?.name || "Resume"}`, `Generated: ${new Date().toLocaleString()}`, "Scores calculated from the resume text itself (deterministic engine); AI narrative is optional.", "", `Overall score: ${analysis.overallScore}/100 — ${band(analysis.overallScore).label}`, analysis.explanation || "", "", "Score breakdown", ...[["ATS compatibility", analysis.scores?.ats, analysis.scores?.atsMetric], ["Writing quality", analysis.scores?.grammar, analysis.scores?.grammarMetric], ["Impact", analysis.scores?.impact, analysis.scores?.impactMetric], ["Readability", analysis.scores?.readability, analysis.scores?.readabilityMetric]].map(([label, score, metric]) => `${label}: ${score}/100 — ${metric ?? ""}`), "", `Sections detected: ${(analysis.sections?.present ?? []).map((key) => SECTION_LABELS[key] ?? key).join(", ") || "none"}`, `Sections missing: ${(analysis.sections?.missing ?? []).map((key) => SECTION_LABELS[key] ?? key).join(", ") || "none"}`, "", "Strengths", ...(analysis.strengths?.length ? analysis.strengths.map((item) => `- ${item}`) : ["- (none detected)"]), "", "Resume analytics", ...Object.entries(analysis.analytics || {}).map(([key, value]) => `${key}: ${value ?? "Not available"}`), "", "Keywords", ...(analysis.keywords?.hasJobDescription ? [`Matched: ${(analysis.keywords.matched || []).join(", ") || "None"}`, `Partial: ${(analysis.keywords.partial || []).join(", ") || "None"}`, `Missing: ${(analysis.keywords.missing || []).join(", ") || "None"}`, `Job match: ${analysis.jobMatch?.score ?? "Not available"}/100 — ${analysis.jobMatch?.explanation ?? ""}`] : ["No job description was analyzed. Add one and re-analyze for keyword matching."]), "", "Issues", ...(analysis.issues || []).map((item, index) => `${index + 1}. [${item.priority}] ${item.title}: ${item.description}`), "", "Recommendations", ...(analysis.recommendations || []).map((item, index) => `${index + 1}. ${item.title}${item.source === "ai" ? " (AI insight)" : ""}: ${item.suggestedImprovement || item.explanation}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${(file?.name || "resume").replace(/\.[^.]+$/, "")}-analysis.txt`; anchor.click(); URL.revokeObjectURL(url);
  }

  const headerAction = analysis ? <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={downloadReport}><Download /> Download Report</Button><Button size="sm" onClick={runAnalysis} disabled={!canAnalyze}><RefreshCw /> {isStale ? "Re-analyze" : "Refresh analysis"}</Button></div> : <Button variant="outline" size="sm" onClick={() => setHowItWorks(true)}><CircleHelp /> How it works?</Button>;
  const clearResume = () => { setFile(null); setAnalysis(null); setAnalyzedSignature(""); analyzedSignatureRef.current = ""; setReviewText(null); setExtractedPageCount(null); setUsedOcr(false); setError(""); setFailureStage(""); setPhase("idle"); setAiStatus(""); setJobDescription(""); setAddingJobDescription(false); };
  const resumePicker = <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={onFileInput} className="sr-only" />;
  const resumeWordCount = reviewText?.match(/[\p{L}\p{N}][\p{L}\p{N}+#.\-/]*/gu)?.length ?? 0;
  return <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-5 lg:p-6"><HowItWorks open={howItWorks} onClose={() => setHowItWorks(false)} /><div className="space-y-3">
    <header className="flex min-w-0 flex-wrap items-center justify-end gap-2">{headerAction}</header>
    {analysis && phase === "done" ? <>
      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center gap-3"><ScoreRing score={analysis.overallScore} size={88} /><div className="min-w-0"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${toneClasses(band(analysis.overallScore).tone)}`}>{band(analysis.overallScore).label}</span><p className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground">{analysis.explanation}</p></div></div>
          {analysis.strengths?.length > 0 && <div className="mt-3 border-t border-border pt-3"><div className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">Top strengths</div><ul className="mt-1.5 space-y-1">{analysis.strengths.slice(0, 4).map((item) => <li key={item} className="flex items-start gap-1.5 text-[11.5px] leading-snug"><Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />{item}</li>)}</ul></div>}
          <AiStatusNote aiStatus={aiStatus} />
        </Panel>
        <div className="grid grid-cols-2 content-start gap-2 sm:grid-cols-4"><ScoreCard icon={Target} label="ATS Score" score={analysis.scores?.ats} metric={analysis.scores?.atsMetric} /><ScoreCard icon={MessageSquareText} label="Writing" score={analysis.scores?.grammar} metric={analysis.scores?.grammarMetric} /><ScoreCard icon={Zap} label="Impact" score={analysis.scores?.impact} metric={analysis.scores?.impactMetric} /><ScoreCard icon={FileText} label="Readability" score={analysis.scores?.readability} metric={analysis.scores?.readabilityMetric} /></div>
      </div>
      <div className="grid gap-2.5 xl:grid-cols-2">
        <Panel>
          <SectionTitle icon={Target} title="ATS Keyword Analysis" subtitle="Keyword comparison against your job description." />
          <div className="mt-3"><KeywordGroups keywords={analysis.keywords} skills={analysis.skills} jobMatch={analysis.jobMatch} onAddJobDescription={() => setAddingJobDescription(true)} /></div>
          {addingJobDescription && <div className="mt-3 space-y-2"><label htmlFor="results-job-description" className="text-[11px] font-semibold">Job description</label><textarea id="results-job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value.slice(0, 3000))} rows={3} placeholder="Paste the job description here…" className="w-full resize-y rounded-lg border border-input bg-background p-2.5 text-[12px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /><Button size="sm" onClick={runAnalysis} disabled={!jobDescription.trim() || !canAnalyze}>Match against job description</Button></div>}
        </Panel>
        <Panel>
          <SectionTitle icon={Radar} title="Resume Strengths" subtitle="Six dimensions scored from this resume." />
          <div className="mt-2"><RadarChart dimensions={analysis.radar} /></div>
        </Panel>
      </div>
      <div className="grid gap-2.5 xl:grid-cols-2">
        <Panel>
          <SectionTitle icon={AlertCircle} title="Missing Sections & Signals" subtitle="Issues detected in this analysis." />
          {(analysis.sections?.missing ?? []).length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{analysis.sections.missing.map((key) => <span key={key} className="rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-0.5 text-[10.5px] font-medium text-destructive">{SECTION_LABELS[key] ?? key} missing</span>)}</div>}
          <div className="mt-3"><ResultList items={analysis.issues} onImprove={onImprove} /></div>
        </Panel>
        <Panel>
          <SectionTitle icon={Sparkles} title="Top Improvement Recommendations" subtitle="Prioritized next actions from your analysis." />
          <div className="mt-3"><ResultList items={analysis.recommendations} kind="recommendation" onImprove={onImprove} /></div>
        </Panel>
      </div>
      <Panel>
        <SectionTitle icon={FileArchive} title="Resume Analytics" subtitle="Calculated from the extracted resume text." />
        <div className="mt-3"><AnalyticsGrid analytics={analysis.analytics} /></div>
      </Panel>
      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div><div className="min-w-0"><div className="truncate text-[12.5px] font-bold">{analysis.fileName || file?.name}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{file ? `${formatBytes(file.size)} · ` : ""}Analyzed just now{analysis.analyzedAt ? ` · ${new Date(analysis.analyzedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}{usedOcr ? " · Scanned text recognized" : ""}</div></div></div>
        <div className="flex shrink-0 items-center gap-1">{resumePicker}<Button variant="ghost" size="icon" aria-label="Choose another resume" onClick={() => inputRef.current?.click()}><RefreshCw /></Button><Button variant="ghost" size="icon" aria-label="Remove analyzed resume" onClick={clearResume}><Trash2 /></Button></div>
        {isStale && <div className="flex w-full items-center gap-2 rounded-lg bg-warning/15 px-3 py-2 text-[11.5px] font-medium text-warning-foreground"><Info className="h-4 w-4 shrink-0" /> Your resume or job description changed since this analysis. Re-analyze for updated results.</div>}
      </Panel>
    </> : <>
      {phase === "reading" ? <LoadingState phase={phase} progressText={progressText} /> : <div className="grid gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.8fr)]"><div className="space-y-2.5">
        {phase !== "review" && reviewText === null && <>
          <Panel className={`border-dashed ${dragging ? "border-primary bg-primary/5" : ""}`}><div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0] ?? null); }} className={`grid place-items-center rounded-lg border border-dashed border-border bg-surface/60 p-5 text-center transition-[min-height] sm:p-6 ${file ? "min-h-24" : "min-h-52"}`}><div className="max-w-md"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><UploadCloud className="h-6 w-6" /></div><h2 className="mt-3 text-[16px] font-bold">{file ? "Replace your resume" : "Upload your resume to get started"}</h2><p className="mt-1 text-[12px] text-muted-foreground">PDF, DOCX or TXT · Maximum 5 MB</p>{resumePicker}<Button className="mt-3" onClick={() => inputRef.current?.click()}><UploadCloud /> {file ? "Choose another file" : "Upload Resume"}</Button>{!file && <p className="mt-2 text-[11px] text-muted-foreground">or drag and drop here</p>}</div></div></Panel>
          {file && <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-elegant"><div className="flex min-w-0 items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div><div className="min-w-0"><div className="truncate text-[12px] font-bold">{file.name}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{formatBytes(file.size)} · Ready for text review</div></div></div><div className="flex shrink-0 items-center gap-1.5"><Button variant="ghost" size="icon" onClick={clearResume} aria-label="Remove selected resume"><Trash2 /></Button><Button onClick={reviewExtractedText}>Review Extracted Text <ArrowRight /></Button></div></div>}
        </>}
        {reviewText !== null && failureStage !== "reading" && <>
          <Panel className="space-y-2.5"><div className="flex flex-wrap items-start justify-between gap-2.5"><div className="flex min-w-0 items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div><div className="min-w-0"><h2 className="truncate text-[13.5px] font-bold">Review extracted resume text</h2><p className="text-[11px] text-muted-foreground">{file?.name} · {resumeWordCount.toLocaleString()} words{extractedPageCount ? ` · ${extractedPageCount} pages` : ""}</p></div></div><div className="flex items-center gap-1">{resumePicker}<Button variant="ghost" size="icon" onClick={() => inputRef.current?.click()} aria-label="Choose another resume"><RefreshCw /></Button><Button variant="ghost" size="icon" onClick={clearResume} aria-label="Remove selected resume"><Trash2 /></Button></div></div>
            {usedOcr && <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-[11.5px] text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Scanned PDF pages were recognized with OCR. Review the text below and correct any recognition errors before analysis.</span></div>}
            <div><label htmlFor="resume-text-review" className="text-[12px] font-semibold">Extracted text <span className="font-normal text-muted-foreground">— edits are included in analysis and document metrics</span></label><textarea id="resume-text-review" value={reviewText} onChange={(event) => { setReviewText(event.target.value.slice(0, 45000)); setAnalysis(null); setError(""); }} rows={12} maxLength={45000} spellCheck className="mt-1.5 w-full resize-y rounded-lg border border-input bg-background p-3 font-mono text-[12px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-describedby="resume-text-review-count" />
              <div id="resume-text-review-count" className="mt-1 flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground"><span>{reviewText.length < 80 ? "At least 80 characters are needed to analyze." : "Text preview ready to analyze."}</span><span>{reviewText.length.toLocaleString()} / 45,000 characters · {resumeWordCount.toLocaleString()} words</span></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2.5"><Button variant="outline" size="sm" onClick={reviewExtractedText}>Extract again</Button><Button size="sm" onClick={runAnalysis} disabled={!canAnalyze}>Analyze Resume <ArrowRight /></Button></div>
          </Panel>
        </>}
        {(phase === "error" || error) && <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0"><div className="font-semibold">Couldn't {failureStage === "reading" ? "read" : "analyze"} this resume</div><p className="mt-1 leading-relaxed">{error}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1"><Button variant="link" size="sm" className="h-auto px-0 text-destructive" onClick={retryFailedAction}>Try again <ChevronRight /></Button><Button variant="link" size="sm" className="h-auto px-0 text-destructive" onClick={() => inputRef.current?.click()}>Choose another resume <ArrowRight /></Button></div></div></div>}
      </div>{reviewText === null && <Panel className="h-fit bg-primary/[0.03]"><SectionTitle icon={CircleHelp} title="How it works" subtitle="A clear path from document to next steps." /><ol className="mt-3 space-y-2.5">{["Upload your latest resume", "Review and correct extracted text", "Get an instant score and specific improvements"].map((item, index) => <li key={item} className="flex gap-2.5 text-[12px]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{String(index + 1).padStart(2, "0")}</span><span className="pt-1 leading-relaxed text-muted-foreground">{item}</span></li>)}</ol><Button variant="link" className="mt-2 h-auto px-0" onClick={() => setHowItWorks(true)}>Learn more <ArrowRight /></Button></Panel>}</div>}
      {reviewText === null && <Panel><SectionTitle title="What we analyze" subtitle="These capabilities describe the checks available, not your results." /><div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{CAPABILITIES.map(([Icon, title, description]) => <div key={title} className="rounded-xl border border-border bg-surface p-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><div className="mt-2 text-[13px] font-semibold">{title}</div><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p></div>)}</div></Panel>}
      {reviewText === null && <Panel><SectionTitle icon={MessageSquareText} title="Get more personalized results" subtitle="Add a job description to compare your resume against a specific role." /><div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]"><div><label htmlFor="job-description" className="text-[12px] font-semibold">Paste Job Description <span className="font-normal text-muted-foreground">(Optional)</span></label><textarea id="job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value.slice(0, 3000))} rows={5} placeholder="Paste the job description here…" className="mt-1.5 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /><div className="mt-1 text-[11px] text-muted-foreground">{jobDescription.length} / 3000 characters</div></div><div><div className="text-[12px] font-semibold">Target-role helpers</div><div className="mt-2.5 flex flex-wrap gap-2">{["Frontend Developer", "Backend Engineer", "Full Stack Developer", "Data Analyst", "UI/UX Designer"].map((role) => <button type="button" key={role} onClick={() => setJobDescription((current) => current ? `${current}\n\nTarget role: ${role}`.slice(0, 3000) : `Target role: ${role}`)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-medium transition hover:border-primary/40 hover:text-primary">{role}</button>)}</div><div className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Role chips only help start your input; they are not analysis results.</div></div></div></Panel>}
    </>}
  </div></main>;
}
