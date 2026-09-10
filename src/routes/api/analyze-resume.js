import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const fileSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]),
  size: z.number().int().positive().max(5 * 1024 * 1024),
  base64: z.string().min(1).max(7_000_000),
});

const inputSchema = z.object({
  file: fileSchema,
  jobDescription: z.string().trim().max(3000).nullable(),
});

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fileName", "analyzedAt", "overallScore", "explanation", "scores", "keywords", "radar", "issues", "recommendations", "jobMatch", "analytics"],
  properties: {
    fileName: { type: "string" },
    analyzedAt: { type: "string" },
    overallScore: { type: ["number", "null"] },
    explanation: { type: "string" },
    scores: { type: "object", additionalProperties: false, required: ["ats", "grammar", "impact", "readability", "atsMetric", "grammarMetric", "impactMetric", "readabilityMetric"], properties: { ats: { type: ["number", "null"] }, grammar: { type: ["number", "null"] }, impact: { type: ["number", "null"] }, readability: { type: ["number", "null"] }, atsMetric: { type: ["string", "null"] }, grammarMetric: { type: ["string", "null"] }, impactMetric: { type: ["string", "null"] }, readabilityMetric: { type: ["string", "null"] } } },
    keywords: { type: "object", additionalProperties: false, required: ["hasJobDescription", "matched", "partial", "missing"], properties: { hasJobDescription: { type: "boolean" }, matched: { type: "array", items: { type: "string" } }, partial: { type: "array", items: { type: "string" } }, missing: { type: "array", items: { type: "string" } } } },
    radar: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "value"], properties: { label: { type: "string" }, value: { type: "number" } } } },
    issues: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "title", "description", "priority"], properties: { id: { type: "string" }, title: { type: "string" }, description: { type: "string" }, priority: { type: "string" } } } },
    recommendations: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "title", "explanation", "suggestedImprovement", "priority"], properties: { id: { type: "string" }, title: { type: "string" }, explanation: { type: "string" }, suggestedImprovement: { type: "string" }, priority: { type: "string" } } } },
    jobMatch: { type: "object", additionalProperties: false, required: ["available", "score", "label", "explanation"], properties: { available: { type: "boolean" }, score: { type: ["number", "null"] }, label: { type: ["string", "null"] }, explanation: { type: ["string", "null"] } } },
    analytics: { type: "object", additionalProperties: false, required: ["wordCount", "pageCount", "readingTime", "actionVerbs", "keywordCount", "buzzwords", "sentences", "passiveVoice"], properties: { wordCount: { type: ["number", "null"] }, pageCount: { type: ["number", "null"] }, readingTime: { type: ["string", "null"] }, actionVerbs: { type: ["number", "null"] }, keywordCount: { type: ["number", "null"] }, buzzwords: { type: ["number", "null"] }, sentences: { type: ["number", "null"] }, passiveVoice: { type: ["string", "null"] } } },
  },
};

function extractResponseText(body) {
  let text = "";
  for (const line of body.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const raw = line.slice(5).trim();
    if (!raw || raw === "[DONE]") continue;
    try {
      const event = JSON.parse(raw);
      if (event.type === "response.output_text.delta") text += event.delta ?? "";
      if (event.type === "response.completed" && !text && event.response?.output_text) text = event.response.output_text;
      if (event.type === "response.failed") throw new Error(event.response?.error?.message || "The analysis service failed.");
    } catch (error) {
      if (error instanceof Error && error.message !== "Unexpected end of JSON input") throw error;
    }
  }
  return text;
}

function parseJson(text) {
  const candidate = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = candidate.indexOf("{"); const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try { return JSON.parse(candidate.slice(start, end + 1)); } catch { return null; }
}

export const Route = createFileRoute("/api/analyze-resume")({
  server: { handlers: { POST: async ({ request }) => {
    let input;
    try { input = inputSchema.parse(await request.json()); } catch { return Response.json({ message: "Invalid resume upload. Please choose a supported file under 5 MB." }, { status: 400 }); }
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return Response.json({ message: "Resume analysis is not configured yet." }, { status: 500 });
    const hasJobDescription = Boolean(input.jobDescription);
    const prompt = `Analyze the attached resume for a real user. Return ONLY JSON matching the supplied schema. Never invent facts, keywords, metrics, issues, or scores. Scores must be null when the document does not provide enough evidence. Derive analytics from the document when possible. Return only radar dimensions supported by evidence. If there is no job description, keywords.hasJobDescription must be false with empty keyword arrays and jobMatch.available must be false with null score, label, and explanation. If there is a job description, compare only terms actually present in the resume and job description. Keep issues and recommendations specific to the attached resume, ordered by priority, and return at most 8 of each. Job description: ${input.jobDescription || "(none supplied)"}`;
    const content = [{ type: "input_text", text: prompt }, { type: "input_file", filename: input.file.name, file_data: `data:${input.file.type};base64,${input.file.base64}` }];
    try {
      const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", { method: "POST", headers: { "content-type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" }, body: JSON.stringify({ model: "openai/gpt-6-astra", stream: true, reasoning: { effort: "medium", summary: "auto" }, input: [{ role: "user", content }], text: { format: { type: "json_schema", name: "resume_analysis", strict: true, schema: analysisSchema } } }) });
      if (!upstream.ok) { const message = await upstream.text(); return Response.json({ message: message || "Resume analysis couldn't be completed. Please try again." }, { status: upstream.status }); }
      const text = await extractResponseText(await upstream.text());
      const parsed = parseJson(text);
      if (!parsed) return Response.json({ message: "The analysis service returned an unreadable result. Please try again." }, { status: 502 });
      return Response.json({ analysis: { ...parsed, fileName: input.file.name, analyzedAt: new Date().toISOString(), keywords: { ...parsed.keywords, hasJobDescription } } });
    } catch (error) { return Response.json({ message: error instanceof Error ? error.message : "Something went wrong while connecting to the analysis service." }, { status: 500 }); }
  } } },
});