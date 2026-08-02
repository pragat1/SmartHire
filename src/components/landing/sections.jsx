import {
  MessagesSquare,
  ShieldCheck,
  Eye,
  FileText,
  BarChart3,
  Target,
  Sparkles,
} from "lucide-react";

export function TrustedCompanies() {
  return (
    <section className="border-y border-border bg-card/60">
      <div className="mx-auto max-w-[1400px] px-5 py-14 text-center sm:px-8">
        <p className="text-[15px] font-medium text-muted-foreground">
          Trusted by students and professionals
        </p>
        <div className="mt-8 grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="mx-auto h-9 w-full max-w-[130px] rounded-xl border border-dashed border-border bg-surface"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "AI Resume Coach",
    description: "Answer natural questions and get smart follow-ups from Aria.",
  },
  {
    icon: ShieldCheck,
    title: "ATS Optimization",
    description: "Built-in suggestions to pass ATS scanners and get shortlisted.",
  },
  {
    icon: Eye,
    title: "Live Resume Preview",
    description: "See your resume update in real-time as you answer.",
  },
  {
    icon: FileText,
    title: "Professional Templates",
    description: "Choose from recruiter-approved templates.",
  },
  {
    icon: BarChart3,
    title: "Resume Analysis",
    description: "Get detailed score, feedback, keywords and improvement tips.",
  },
  {
    icon: Target,
    title: "Job Tailoring",
    description: "Tailor your resume for any job description in one click.",
  },
];

export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group min-w-0 rounded-[20px] border border-border bg-card p-7 shadow-elegant transition duration-300 hover:-translate-y-1 hover:border-primary/30">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-[17px] font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[32px] font-bold tracking-tight sm:text-[40px]">
          Everything you need to build a winning resume
        </h2>
        <p className="mt-4 text-[18px] text-muted-foreground">
          From AI coaching to ATS analysis — we&apos;ve got you covered.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-4 px-5 py-10 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-bold tracking-tight">
              SmartHire <span className="text-primary">AI</span>
            </div>
            <div className="truncate text-[12px] text-muted-foreground">
              ATS-friendly resumes, built with AI.
            </div>
          </div>
        </div>
        <p className="text-[12.5px] text-muted-foreground md:text-right">
          © {new Date().getFullYear()} SmartHire AI
        </p>
      </div>
    </footer>
  );
}
