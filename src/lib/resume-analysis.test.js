import { describe, expect, it } from "bun:test";
import { analyzeResumeText, matchJobDescription } from "./resume-analysis.js";

describe("deterministic resume analysis reliability", () => {
  it("caps category and overall scores when a resume contains fewer than 100 words", () => {
    const analysis = analyzeResumeText({
      text: "Jane Doe jane@example.com 415-555-1234 SUMMARY Experienced engineer. EXPERIENCE Built React products for 20,000 users. EDUCATION BS Computer Science. SKILLS React TypeScript SQL AWS Git. PROJECTS Created a dashboard for 12 teams.",
    });

    expect(analysis.analytics.wordCount).toBeLessThan(100);
    expect(analysis.overallScore).toBeLessThanOrEqual(40);
    expect(analysis.scores.ats).toBeLessThanOrEqual(40);
    expect(analysis.scores.grammar).toBeLessThanOrEqual(40);
    expect(analysis.scores.impact).toBeLessThanOrEqual(40);
    expect(analysis.scores.readability).toBeLessThanOrEqual(40);
    expect(analysis.explanation).toContain("capped at 40/100");
  });

  it("counts repeated job-description keywords once in a match score", () => {
    const result = matchJobDescription(
      "React and TypeScript engineer",
      "React React TypeScript TypeScript Kubernetes Kubernetes",
    );

    expect(result.available).toBe(true);
    expect(result.matched).toEqual(["react", "typescript"]);
    expect(result.missing).toEqual(["kubernetes"]);
    expect(result.score).toBe(67);
  });
});