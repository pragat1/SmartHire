import { auth, defineMcp } from "@lovable.dev/mcp-js";
import scoreResumeTool from "./tools/score-resume";
import rewriteBulletTool from "./tools/rewrite-bullet";
import suggestProjectsTool from "./tools/suggest-projects";

// OAuth issuer MUST be the direct Supabase host — VITE_SUPABASE_PROJECT_ID is inlined
// as a literal at build time and survives publish. Fallback keeps the URL well-formed
// during the throwaway manifest-extract eval; real builds inline the real ref.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "smarthire-ai-mcp",
  title: "SmartHire AI MCP",
  version: "0.1.0",
  instructions:
    "Tools for SmartHire AI: score a resume against ATS heuristics, rewrite vague bullets into quantified achievements, and suggest resume-strengthening portfolio projects for a target role.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [scoreResumeTool, rewriteBulletTool, suggestProjectsTool],
});
