import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar, TopBar } from "@/components/dashboard-shell";
import { ResumeAnalyzer } from "@/components/resume-analyzer";

export const Route = createFileRoute("/resume-analyzer")({
  head: () => ({
    meta: [
      { title: "Resume Analyzer — SmartHire AI" },
      { name: "description", content: "Upload your resume for AI-powered ATS feedback, resume insights, and actionable recommendations." },
      { property: "og:title", content: "Resume Analyzer — SmartHire AI" },
      { property: "og:description", content: "Analyze your resume and get clear, actionable improvements for your next application." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumeAnalyzerRoute,
});

function ResumeAnalyzerRoute() {
  const navigate = useNavigate();

  function handleNavigate(key) {
    if (key === "analyzer") return;
    if (key === "dashboard") {
      void navigate({ to: "/", search: { view: "dashboard" } });
      return;
    }
    void navigate({ to: "/", search: { view: ["builder", "analysis", "workspace"].includes(key) ? key : "dashboard" } });
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1700px]">
        <AppSidebar active="analyzer" onNavigate={handleNavigate} journey={null} completed={[]} progress={0} onJump={() => {}} name="" />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title="Resume Analyzer" subtitle="Upload, understand, and improve your resume" notifications={0} name="" />
          <ResumeAnalyzer onImprove={() => void navigate({ to: "/", search: { view: "builder" } })} />
        </div>
      </div>
    </div>
  );
}