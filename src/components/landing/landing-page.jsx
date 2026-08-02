import { Navbar } from "./navbar";
import { Hero } from "./hero";
import { TrustedCompanies, FeatureGrid, Footer } from "./sections";

export function LandingPage({ resume, progress, score, onStart, onLogin }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onGetStarted={onStart} onLogin={onLogin} />
      <main>
        <Hero
          resume={resume}
          progress={progress}
          score={score}
          onPrimary={onStart}
          onSecondary={onStart}
        />
        <TrustedCompanies />
        <FeatureGrid />
      </main>
      <Footer />
    </div>
  );
}
