import { useState } from "react";
import { Sparkles, ChevronDown, Menu, X } from "lucide-react";

const LINKS = [
  { label: "Features", dropdown: true },
  { label: "Templates" },
  { label: "AI Tools" },
  { label: "Pricing" },
  { label: "Resources", dropdown: true },
  { label: "About" },
];

export function Navbar({ onGetStarted, onLogin }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid h-20 max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:px-8">
        <a href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[17px] font-bold tracking-tight">
              SmartHire <span className="text-primary">AI</span>
            </span>
            <span className="truncate text-[11px] text-muted-foreground">Resume Builder</span>
          </span>
        </a>

        <nav className="hidden items-center justify-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <button
              key={l.label}
              type="button"
              className="inline-flex items-center gap-1 text-[14.5px] font-medium text-foreground/80 transition hover:text-primary"
            >
              {l.label}
              {l.dropdown && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={onLogin}
            className="hidden rounded-xl border border-border bg-card px-5 py-2.5 text-[14px] font-semibold transition hover:-translate-y-0.5 hover:shadow-elegant sm:block"
          >
            Log in
          </button>
          <button
            onClick={onGetStarted}
            className="hidden rounded-xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-elegant transition hover:-translate-y-0.5 hover:opacity-95 sm:block"
          >
            Get Started Free
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card lg:hidden"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-5 py-4 lg:hidden animate-fade-in">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <button
                key={l.label}
                type="button"
                className="rounded-xl px-3 py-2.5 text-left text-[14.5px] font-medium text-foreground/80 transition hover:bg-surface-2"
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:hidden">
            <button
              onClick={onLogin}
              className="w-full rounded-xl border border-border bg-card px-5 py-2.5 text-[14px] font-semibold"
            >
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="w-full rounded-xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-elegant"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
