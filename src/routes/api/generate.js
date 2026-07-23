import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

const DEFAULT_REWRITE_MODES = [
  "ATS-Optimized",
  "Professional",
  "Concise",
  "FAANG",
  "Startup",
  "Impact-Focused",
];

function promptFor(body) {
  if (body.action === "rewrite") {
    const modes = body.modes && body.modes.length ? body.modes : DEFAULT_REWRITE_MODES;
    return `You are an elite resume editor. Rewrite the ${body.section ?? "text"} below in each of these styles. Every rewrite must be a self-contained, ATS-safe, first-person-free, action-verb-led piece of resume copy. Add plausible metrics/scale/tech names where natural — do not invent employers or titles.

STYLES: ${modes.join(" | ")}

ORIGINAL:
"""${body.text ?? ""}"""

Return ONLY JSON of the exact shape:
{ "variants": [ { "label": "<style>", "text": "<rewrite, 1-3 sentences>" } ] }
One entry per style, in the same order. No markdown fences.`;
  }
  if (body.action === "achievement") {
    return `You are a resume achievement writer. Convert the vague description below into three polished resume bullet points, one per tone. Use strong action verbs, quantify wherever plausible, and mention tech if inferable.

TONES:
- Professional (clear, recruiter-friendly, 1 sentence)
- Technical (deep tech detail, stack + architecture, 1 sentence)
- Impact-Focused (metric-heavy, scale + business outcome, 1 sentence)

RAW:
"""${body.raw ?? ""}"""

Return ONLY JSON:
{ "variants": [ { "label": "Professional", "text": "..." }, { "label": "Technical", "text": "..." }, { "label": "Impact-Focused", "text": "..." } ] }
No markdown fences.`;
  }
  if (body.action === "project-suggest") {
    return `You are a career coach helping a candidate strengthen a resume. Given their skills and target role, suggest 4 realistic, buildable portfolio projects that would meaningfully upgrade the resume. Prefer projects that fill obvious gaps (e.g. if they only have frontend work, lean backend; if no auth, suggest one; if no data, suggest analytics). Reuse their existing tech and add at most 1-2 new tools per suggestion.

SKILLS: ${(body.skills ?? []).join(", ") || "(none)"}
TARGET ROLE: ${body.role || "(not specified)"}
EXISTING PROJECTS: ${(body.existingProjects ?? []).join(" | ") || "(none)"}

Return ONLY JSON:
{ "suggestions": [ { "name": "...", "tagline": "one crisp sentence, <120 chars", "tech": ["..."], "why": "why this closes a resume gap, <140 chars", "difficulty": "Beginner"|"Intermediate"|"Advanced" } ] }
4 suggestions. No markdown fences.`;
  }
  if (body.action === "career-gap") {
    return `You are a senior career strategist. Given the candidate's current skills, experience summary, and target role, produce an in-depth Career Gap analysis and a 90-day roadmap. Be brutally specific — no vague "learn more".

CURRENT SKILLS: ${(body.skills ?? []).join(", ") || "(none)"}
EXISTING PROJECTS: ${(body.existingProjects ?? []).join(" | ") || "(none)"}
TARGET ROLE: ${body.targetRole || body.role || "(not specified)"}
RESUME SUMMARY: ${body.resumeSummary || "(none)"}

Return ONLY JSON:
{
  "readiness": number (0-100, how ready the candidate is for the target role),
  "verdict": "one-sentence honest assessment",
  "matched_skills": ["skills they already have that fit the role"],
  "missing_skills": [ { "skill": "...", "priority": "critical"|"important"|"nice-to-have", "why": "one sentence" } ],
  "hidden_gaps": [ "non-obvious gaps a recruiter would notice, 1 sentence each, 2-3 items" ],
  "roadmap": [
    { "week": "Week 1-2", "focus": "...", "actions": ["...","..."], "deliverable": "concrete artifact to add to resume" },
    { "week": "Week 3-6", "focus": "...", "actions": ["...","..."], "deliverable": "..." },
    { "week": "Week 7-12", "focus": "...", "actions": ["...","..."], "deliverable": "..." }
  ],
  "resume_moves": [ "3-5 immediate edits to the resume that instantly close the gap" ]
}
No markdown fences.`;
  }
  if (body.action === "interview-prep") {
    return `You are a technical interview coach. Given the candidate's resume signals, generate a realistic mock-interview pack for the target role. Questions must feel like ones a real interviewer would ask about THIS candidate — reference their projects and skills, don't be generic.

SKILLS: ${(body.skills ?? []).join(", ") || "(none)"}
PROJECTS: ${(body.existingProjects ?? []).join(" | ") || "(none)"}
TARGET ROLE: ${body.targetRole || body.role || "(not specified)"}

Return ONLY JSON:
{
  "questions": [
    { "category": "Behavioral"|"Technical"|"System Design"|"Project Deep-Dive", "question": "...", "why_asked": "why an interviewer for this role asks this, 1 sentence", "star_hint": "one-line hint on how to structure a strong answer" }
  ]
}
Return 8 questions, mixed categories, with at least 2 Project Deep-Dive that reference their actual projects by name. No markdown fences.`;
  }
  // project-full
  return `You are a senior engineer writing a portfolio project package. Produce a strong, believable project the candidate could plausibly ship in 1-3 weekends. Do not invent company names or private metrics — use plausible ranges.

PROJECT NAME: ${body.name ?? ""}
TECH: ${(body.tech ?? []).join(", ")}
IDEA CONTEXT: ${body.idea ?? ""}

Return ONLY JSON:
{
  "project": {
    "name": "...",
    "description": "polished 2-sentence resume-ready description, action-verb-led, quantified, tech-mentioning",
    "tech": ["..."]
  },
  "resume_bullets": ["3 bullets, each 1 line, quantified, action-verb-led"],
  "github_description": "single line under 140 chars",
  "readme": "GitHub README in markdown with sections: Title, Overview, Features, Tech Stack, Architecture, Getting Started, Roadmap"
}
No markdown fences around the outer JSON. The 'readme' value itself is a markdown string.`;
}

const FALLBACK = { error: "Model returned malformed output" };

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!body?.action) return new Response("Missing action", { status: 400 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        try {
          const { text } = await generateText({
            model,
            system:
              "You are a senior resume editor and technical mentor. Always respond with the exact JSON shape requested — no prose, no markdown fences.",
            prompt: promptFor(body),
          });
          const parsed = extractJson(text);
          if (!parsed || typeof parsed !== "object") {
            console.error("[generate] parse failed. raw:", text.slice(0, 400));
            return Response.json(FALLBACK, { status: 502 });
          }
          return Response.json(parsed);
        } catch (error) {
          console.error("[generate] error:", error);
          const message = error instanceof Error ? error.message : "Unknown error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
