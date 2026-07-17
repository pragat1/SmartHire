import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export default defineTool({
  name: "rewrite_bullet",
  title: "Rewrite resume bullet",
  description:
    "Rewrite a vague resume bullet point into a quantified, ATS-friendly line in the requested tone.",
  inputSchema: {
    text: z.string().min(3).describe("The original bullet or description to rewrite."),
    tone: z
      .enum(["professional", "technical", "impact"])
      .default("professional")
      .describe("Rewrite style."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ text, tone }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        content: [{ type: "text", text: "AI gateway not configured on this server." }],
        isError: true,
      };
    }
    const gateway = createLovableAiGatewayProvider(key);
    const { text: out } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt: `Rewrite the following resume bullet in a ${tone} tone. Return ONE line, quantified where possible, action-verb-led, under 30 words. No quotes, no preamble.\n\nOriginal: ${text}`,
    });
    const line = out.trim().replace(/^["']|["']$/g, "");
    return {
      content: [{ type: "text", text: line }],
      structuredContent: { rewritten: line, tone },
    };
  },
});
