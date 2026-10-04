import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const inputSchema = z.object({
  fileName: z.string().trim().min(1).max(160),
  resumeText: z.string().trim().min(80).max(45000),
  pageCount: z.number().int().positive().max(100).nullable(),
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

const actionVerbs = new Set("achieved accelerated automated built collaborated created delivered designed developed directed enhanced established implemented improved increased launched led managed optimized organized reduced resolved scaled streamlined transformed upgraded".split(" "));
const skillTerms = new Set("javascript typescript react angular vue node.js python java c# c++ go rust sql postgresql mongodb aws azure gcp docker kubernetes terraform git html css accessibility figma tableau power bi excel machine learning data analysis rest api graphql next.js redux jest playwright linux agile scrum leadership communication project management".split(" "));
const buzzwords = new Set("innovative strategic dynamic passionate synergy results-driven go-getter thought-leader team-player".split(" "));

function deriveAnalytics(text, pageCount) {
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}+#.\-/]*/gu) ?? [];
  const normalizedWords = words.map((word) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""));
  const sentences = text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length;
  const normalizedText = ` ${text.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim()} `;
  const foundSkills = [...skillTerms].filter((term) => normalizedText.includes(` ${term.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim()} `));
  const actionVerbCount = normalizedWords.filter((word) => actionVerbs.has(word)).length;
  const buzzwordCount = [...buzzwords].filter((word) => text.toLowerCase().includes(word)).length;
  const passiveSignals = (text.match(/\b(?:was|were|is|are|been|being)\s+(?:\w+ed|\w+en)\b/gi) ?? []).length;
  const minutes = Math.max(1, Math.ceil(words.length / 200));
  return {
    wordCount: words.length,
    pageCount,
    readingTime: `${minutes} min${minutes === 1 ? "" : "s"}`,
    actionVerbs: actionVerbCount,
    keywordCount: foundSkills.length,
    buzzwords: buzzwordCount,
    sentences,
    passiveVoice: passiveSignals === 0 ? "No clear passive signals" : `${passiveSignals} possible passive phrases`,
  };
}

export const Route = createFileRoute("/api/analyze-resume")({
  server: { handlers: { POST: async ({ request }) => {
    let input;
    try { input = inputSchema.parse(await request.json()); } catch { return Response.json({ message: "We couldn't read enough text from this resume. Try another PDF, DOCX, or TXT file." }, { status: 400 }); }
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return Response.json({ message: "Resume analysis is not configured yet." }, { status: 500 });
    const hasJobDescription = Boolean(input.jobDescription);
    const prompt = `Analyze the resume text below. Return ONLY JSON matching the supplied schema. Never invent facts, keywords, metrics, issues, scores, or recommendations. Scores may be numeric only when supported by concrete evidence in the resume; otherwise use null. Give concise, resume-specific evidence for every score. Derive only supported radar dimensions. If there is no job description, keywords.hasJobDescription must be false with empty keyword arrays and jobMatch.available false with null values. If a job description is supplied, compare only terms actually present in both inputs. Keep issues and recommendations specific, non-duplicative, ordered by priority, and return at most 5 recommendations and 8 issues. The app calculates document counts deterministically; focus on qualitative content review. File: ${input.fileName}. Pages: ${input.pageCount ?? "unknown"}. Job description: ${input.jobDescription || "(none supplied)"}\n\nRESUME TEXT:\n${input.resumeText}`;
    const content = [{ type: "input_text", text: prompt }];
    try {
      const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", { method: "POST", signal: request.signal, headers: { "content-type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" }, body: JSON.stringify({ model: "openai/gpt-6-astra", stream: true, store: false, reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"], input: [{ role: "user", content }], text: { format: { type: "json_schema", name: "resume_analysis", strict: true, schema: analysisSchema } } }) });
      if (!upstream.ok) { const raw = await upstream.text(); let message = raw; try { const parsedError = JSON.parse(raw); message = parsedError.message || parsedError.error?.message || raw; } catch {} return Response.json({ message: message || "Resume analysis couldn't be completed. Please try again." }, { status: upstream.status }); }
      const text = await extractResponseText(await upstream.text());
      const parsed = parseJson(text);
      if (!parsed) return Response.json({ message: "The analysis service returned an unreadable result. Please try again." }, { status: 502 });
      return Response.json({ analysis: { ...parsed, fileName: input.fileName, analyzedAt: new Date().toISOString(), keywords: { ...parsed.keywords, hasJobDescription }, analytics: deriveAnalytics(input.resumeText, input.pageCount) } });
    } catch (error) { if (request.signal.aborted && error instanceof Error && error.name === "AbortError") return new Response(null, { status: 499 }); return Response.json({ message: error instanceof Error ? error.message : "Something went wrong while connecting to the analysis service." }, { status: 500 }); }
  } } },
});