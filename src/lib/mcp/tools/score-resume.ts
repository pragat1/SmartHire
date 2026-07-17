import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const ResumeSchema = z.object({
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
});

export default defineTool({
  name: "score_resume",
  title: "Score resume",
  description:
    "Compute a lightweight ATS-style score (0–100) for a resume, plus a breakdown across skills, experience, projects, and summary depth.",
  inputSchema: {
    resume: ResumeSchema.describe("Structured resume data to evaluate."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ resume }) => {
    const skills = resume.skills?.length ?? 0;
    const experience = resume.experience?.length ?? 0;
    const projects = resume.projects?.length ?? 0;
    const summaryLen = resume.summary?.trim().length ?? 0;

    const skillsScore = Math.min(25, skills * 3);
    const experienceScore = Math.min(30, experience * 10);
    const projectsScore = Math.min(25, projects * 8);
    const summaryScore = summaryLen > 400 ? 20 : summaryLen > 150 ? 15 : summaryLen > 50 ? 8 : 0;
    const total = skillsScore + experienceScore + projectsScore + summaryScore;

    return {
      content: [
        {
          type: "text",
          text: `ATS score: ${total}/100 — skills ${skillsScore}/25, experience ${experienceScore}/30, projects ${projectsScore}/25, summary ${summaryScore}/20.`,
        },
      ],
      structuredContent: {
        score: total,
        breakdown: { skillsScore, experienceScore, projectsScore, summaryScore },
      },
    };
  },
});
