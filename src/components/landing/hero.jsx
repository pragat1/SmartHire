import { Sparkles, ArrowRight, Play, Bot, ShieldCheck, LayoutTemplate } from "lucide-react";
import { HeroPreview } from "./hero-preview";

const HIGHLIGHTS = [
  { icon: Bot, title: "AI Coach", description: "Guides you step by step" },
  { icon: ShieldCheck, title: "ATS Optimized", description: "Higher shortlist chances" },
  { icon: LayoutTemplate, title: "Pro Templates", description: "Stand out instantly" },
];

export function FeatureHighlights() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
      {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold">{title}</div>
            <div className="text-[12.5px] leading-snug text-muted-foreground">{description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CTAButtons({ onPrimary, onSecondary }) {
  return (
    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
      <button
        onClick={onPrimary}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-[15.5px] font-semibold text-primary-foreground shadow-elegant transition hover:-translate-y-0.5 hover:opacity-95 sm:w-auto"
      >
        Build My Resume Free <ArrowRight className="h-4.5 w-4.5" />
      </button>
      <button
        onClick={onSecondary}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-7 py-4 text-[15.5px] font-semibold transition hover:-translate-y-0.5 hover:shadow-elegant sm:w-auto"
      >
        See How It Works <Play className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

export function Hero({ resume, progress, score, onPrimary, onSecondary }) {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-[380px] w-[380px] rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute left-[15%] top-[55%] h-64 w-64 rounded-full border border-primary/10" />
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-28">
        <div className="min-w-0 animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Resume Builder
          </span>

          <h1 className="mt-6 text-[42px] font-bold leading-[1.06] tracking-tight sm:text-[56px] lg:text-[64px]">
            Build an ATS-Friendly
            <br className="hidden sm:block" /> Resume with the Power
            <br className="hidden sm:block" /> of <span className="text-primary">AI</span>
          </h1>

          <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-muted-foreground">
            Answer a few smart questions. Our AI coach builds a professional resume that gets you
            more interviews.
          </p>

          <CTAButtons onPrimary={onPrimary} onSecondary={onSecondary} />
          <FeatureHighlights />
        </div>

        <div className="min-w-0 animate-fade-in">
          <HeroPreview resume={resume} progress={progress} score={score} />
        </div>
      </div>
    </section>
  );
}
