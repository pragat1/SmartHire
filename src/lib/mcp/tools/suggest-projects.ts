import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const Schema = z.object({
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      stack: z.array(z.string()),
    }),
  ),
});

export default defineTool({
  name: "suggest_projects",
  title: "Suggest resume projects",
  description:
    "Suggest 3–5 buildable portfolio projects that strengthen a resume for a target role, based on the user's current skills.",
  inputSchema: {
    skills: z.array(z.string()).describe("Skills already on the resume."),
    targetRole: z.string().describe("Target job role, e.g. 'Frontend Developer'."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ skills, targetRole }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        content: [{ type: "text", text: "AI gateway not configured on this server." }],
        isError: true,
      };
    }
    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({ schema: Schema }),
        prompt: `Suggest 4 buildable portfolio projects that would strengthen a resume for a "${targetRole}" role. The user's current skills: ${skills.join(", ") || "(none listed)"}. Include realistic stacks that build on those skills.`,
      });
      return {
        content: [
          {
            type: "text",
            text: output.projects
              .map((p, i) => `${i + 1}. ${p.title} — ${p.description} [${p.stack.join(", ")}]`)
              .join("\n"),
          },
        ],
        structuredContent: output,
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return {
          content: [{ type: "text", text: error.text ?? "No suggestions generated." }],
          isError: true,
        };
      }
      throw error;
    }
  },
});
