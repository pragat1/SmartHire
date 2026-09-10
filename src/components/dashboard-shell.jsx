import {
  Sparkles,
  LayoutDashboard,
  MessagesSquare,
  ScanSearch,
  FileSearch,
  Briefcase,
  Settings,
  Search,
  Bell,
  Check,
  CircleDashed,
  Loader2,
  Rocket,
} from "lucide-react";

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "builder", label: "Resume Builder", icon: MessagesSquare },
  { key: "analyzer", label: "Resume Analyzer", icon: FileSearch },
  { key: "analysis", label: "ATS Analysis", icon: ScanSearch },
  { key: "workspace", label: "Career Workspace", icon: Briefcase },
];

export function AppSidebar({ active, onNavigate, journey, completed, progress, onJump, name }) {
  const initials =
    (name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "SH";

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
      <div className="flex items-center gap-2.5 px-1">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[15px] font-bold tracking-tight">
            SmartHire<span className="gradient-text"> AI</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Resume Coach
          </span>
        </div>
      </div>

      <nav className="mt-7 flex flex-col gap-1">
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                isActive
                  ? "gradient-primary text-primary-foreground shadow-elegant"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {journey?.length ? (
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span>Resume Journey</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="mx-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full gradient-primary transition-[width] duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex flex-col gap-0.5">
            {journey.map((s, i) => {
              const done = completed.includes(s.key);
              const isCurrent = !done && i === completed.length;
              return (
                <button
                  key={s.key}
                  onClick={() => onJump(s.key)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition ${
                    done
                      ? "text-foreground hover:bg-surface-2"
                      : isCurrent
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground/70 hover:bg-surface-2"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      done
                        ? "gradient-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary/10 text-primary ring-2 ring-primary/25"
                          : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {done ? (
                      <Check className="h-3 w-3" />
                    ) : isCurrent ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <CircleDashed className="h-3 w-3" />
                    )}
                  </span>
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-accent/60 to-card p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-accent-foreground">
          <Rocket className="h-3.5 w-3.5" /> Upgrade to Pro
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          Unlimited resumes, AI cover letters, and priority job tailoring.
        </p>
        <button className="mt-3 w-full rounded-lg gradient-primary py-2 text-[11px] font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95">
          Get Pro — ₹399/mo
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-bold text-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[12px] font-semibold">{name || "Your profile"}</div>
          <div className="truncate text-[10px] text-muted-foreground">Free plan</div>
        </div>
        <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </aside>
  );
}

export function TopBar({ title, subtitle, query, onQueryChange, notifications = 0, name }) {
  const initials =
    (name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "SH";

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-card/85 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 md:flex">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search sections, skills, versions…"
            className="w-52 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground">
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {notifications}
            </span>
          )}
        </button>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-primary text-[11px] font-bold text-primary-foreground">
          {initials}
        </div>
      </div>
    </header>
  );
}
