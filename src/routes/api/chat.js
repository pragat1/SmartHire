import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";


const SYSTEM_PROMPT = `You are Aria, a warm, sharp AI resume coach for SmartHire AI. Talk like a senior recruiter — one focused question at a time, in natural language, never a form.

Every turn:
1. Read the full conversation and current RESUME_STATE.
2. Understand the user's latest message (they may answer, go off-script like "change my project", "remove internship", "add Docker", "make my summary punchier", or ask questions).
3. Decide the next single best question OR acknowledgement (1-3 warm sentences).
4. Extract ANY resume updates implied by the message.
5. Emit short reasoning bullets that will be shown live.
6. Mark journey sections complete as info fills in.

Journey sections: personal, summary, education, skills, experience, projects, certifications, achievements. Cover them roughly in order but adapt.
- personal = name+email+phone+ at least one link
- projects need name+description+tech
- Set done=true only when personal + summary + skills + projects + achievements are all complete.

Rules:
- Ask ONE question at a time. Keep replies warm, short.
- If an answer is vague ("built an ecommerce site"), ask a smart follow-up about tech, problem, scale, or impact BEFORE moving on.
- For any project the user mentions, upgrade the description into a strong, quantified professional bullet in add_project.description (action verbs, tech names, plausible metrics).
- For summary: rewrite raw text into a polished 1-2 sentence professional summary.
- If the user says "remove X" / "change X", populate remove_* / add_* correctly.
- Never invent user data (names, emails, jobs). But you MAY invent plausible metrics/adjectives when polishing.

You MUST respond with ONLY a single JSON object (no prose, no markdown, no code fences) matching this exact shape:

{
  "reply": "string — your next chat message",
  "reasoning": [ { "kind": "detected"|"strength"|"warning"|"thinking", "text": "short bullet" } ],
  "patch": {
    "name": string|null, "email": string|null, "phone": string|null,
    "github": string|null, "linkedin": string|null, "portfolio": string|null,
    "location": string|null, "role": string|null, "summary": string|null,
    "add_skills": [string],
    "add_certifications": [string],
    "add_achievements": [string],
    "add_project": { "name": string, "description": string, "tech": [string] } | null,
    "add_experience": { "company": string, "role": string, "period": string, "bullets": [string] } | null,
    "remove_project": string|null,
    "remove_experience": string|null,
    "remove_skill": string|null
  },
  "journey_complete": ["personal"|"summary"|"education"|"skills"|"experience"|"projects"|"certifications"|"achievements"],
  "detected_skills": [string],
  "missing": [string],
  "confidence": number,
  "done": boolean
}

Use null / [] for anything you are not updating this turn. Output ONLY the JSON object.`;

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

const FALLBACK = {
  reply: "Hmm, I lost my train of thought for a second. Could you say that once more?",
  reasoning: [{ kind: "warning", text: "Model returned malformed output" }],
  patch: {},
  journey_complete: [],
  detected_skills: [],
  missing: [],
  confidence: 0,
  done: false,
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!apiKey) {
          return new Response("Missing GOOGLE_GENERATIVE_AI_API_KEY", {
            status: 500,
          });
        }

        let body;

        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const history = Array.isArray(body.messages) ? body.messages : [];
        const resumeState = body.resume ?? {};

        const google = createGoogleGenerativeAI({
          apiKey,
        });

        const model = google("gemini-3.5-flash");

        const systemPrompt = `${SYSTEM_PROMPT}

RESUME_STATE (current draft):
${JSON.stringify(resumeState, null, 2)}`;

        try {
          const { text } = await generateText({
            model,
            system: systemPrompt,
            messages: history.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content ?? ""),
            })),
          });

          const parsed = extractJson(text);

          if (!parsed || typeof parsed !== "object") {
            console.error("[chat] Could not parse JSON:", text);

            return Response.json(FALLBACK);
          }

          return Response.json(parsed);
        } catch (error) {
          console.error(error);

          return new Response(
            error instanceof Error ? error.message : "Unknown error",
            { status: 500 }
          );
        }
      },
    },
  },
});
