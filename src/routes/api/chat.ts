import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

// Journey section keys the AI can mark complete.
const SECTION_KEYS = [
  "personal",
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "certifications",
  "achievements",
] as const;

// Kept flat, no bounds — required by Gemini structured output.
const ResponseSchema = z.object({
  reply: z.string(),
  reasoning: z.array(
    z.object({
      kind: z.enum(["detected", "strength", "warning", "thinking"]),
      text: z.string(),
    }),
  ),
  patch: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    github: z.string().nullable(),
    linkedin: z.string().nullable(),
    portfolio: z.string().nullable(),
    location: z.string().nullable(),
    role: z.string().nullable(),
    summary: z.string().nullable(),
    add_skills: z.array(z.string()),
    add_certifications: z.array(z.string()),
    add_achievements: z.array(z.string()),
    add_project: z
      .object({
        name: z.string(),
        description: z.string(),
        tech: z.array(z.string()),
      })
      .nullable(),
    add_experience: z
      .object({
        company: z.string(),
        role: z.string(),
        period: z.string(),
        bullets: z.array(z.string()),
      })
      .nullable(),
    remove_project: z.string().nullable(),
    remove_experience: z.string().nullable(),
    remove_skill: z.string().nullable(),
  }),
  journey_complete: z.array(z.enum(SECTION_KEYS)),
  detected_skills: z.array(z.string()),
  missing: z.array(z.string()),
  confidence: z.number(),
  done: z.boolean(),
});

const SYSTEM_PROMPT = `You are Aria, a warm, sharp AI resume coach for SmartHire AI. You talk to a candidate the way a senior recruiter would — one focused question at a time, in natural language, never a form.

Your job every turn:
1. Read the FULL conversation so far and the current RESUME_STATE JSON.
2. Understand the user's latest message in natural language. They may:
   - answer your last question
   - give vague info you must ask a smart follow-up about
   - go off-script ("change my project", "remove internship", "add another skill", "make my summary punchier")
   - ask questions
3. Decide the next single best question OR acknowledgement.
4. Extract ANY resume updates implied by the message into "patch".
5. Emit reasoning bullets ("thinking out loud") that will be shown live to the user.
6. Mark journey sections complete as info fills in.

Journey sections: personal, summary, education, skills, experience, projects, certifications, achievements.
Cover them roughly in that order but adapt. Personal = name+email+phone+at least one link. Projects need name+description+tech. Set done=true only when at least personal + summary + skills + projects + achievements are complete.

Rules:
- Ask ONE question at a time. Keep replies to 1-3 short sentences. Warm, not corporate.
- If an answer is vague ("built an ecommerce site"), ask a smart follow-up about tech, problem solved, scale, or impact BEFORE moving on.
- When the user gives a project description, always upgrade it into a strong, quantified, professional bullet in add_project.description (use metrics when plausible, action verbs, tech names).
- For summary: rewrite the user's raw text into a polished 1-2 sentence professional summary.
- If the user says "remove X" or "change X", populate the correct remove_* / add_* field and confirm briefly.
- reasoning: 2-4 short bullets like "Detected React + Node stack", "Strong frontend signal", "Missing measurable impact metrics".
- detected_skills: any skills you inferred this turn (short tokens like "React", "Postgres").
- missing: short list of resume sections/details still weak or empty.
- confidence: 0-100 estimate of how complete the resume feels.
- Use null / [] for anything you are not updating this turn. Never invent user data.
- Do NOT restate the whole resume back. Just move the conversation forward.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: { messages?: Array<{ role: string; content: string }>; resume?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const history = Array.isArray(body.messages) ? body.messages : [];
        const resumeState = body.resume ?? {};

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const contextMsg = {
          role: "system" as const,
          content: `RESUME_STATE (current draft):\n${JSON.stringify(resumeState, null, 2)}`,
        };

        try {
          const { output } = await generateText({
            model,
            output: Output.object({ schema: ResponseSchema }),
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              contextMsg,
              ...history.map((m) => ({
                role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
                content: String(m.content ?? ""),
              })),
            ],
          });

          return Response.json(output);
        } catch (error) {
          if (NoObjectGeneratedError.isInstance(error)) {
            return Response.json(
              {
                reply:
                  "Hmm, I lost my train of thought for a second. Could you say that once more?",
                reasoning: [{ kind: "warning", text: "Model returned malformed structure" }],
                patch: {},
                journey_complete: [],
                detected_skills: [],
                missing: [],
                confidence: 0,
                done: false,
              },
              { status: 200 },
            );
          }
          const message = error instanceof Error ? error.message : "Unknown error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
