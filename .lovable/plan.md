# Resume Analyzer implementation plan

## Product outcome
Add a new, separate Resume Analyzer experience at `/resume-analyzer` with empty, selected-file, loading, error, and analyzed states. Keep the existing ATS Analysis page and all current builder/workspace behavior intact.

## User flow
- Add “Resume Analyzer” to the shared sidebar near Resume Builder / ATS Analysis.
- Let users choose or drag PDF, DOCX, or TXT files up to 5 MB; validate type and size, show the selected file, and allow replace/remove.
- Extract text in the browser for TXT; send PDF/DOCX as base64 to a server endpoint for safe text extraction using the existing application runtime; validate and optionally include a job description.
- Run a real Lovable AI analysis request on the server using the project’s existing gateway pattern, then render only returned/derived metrics and honest empty states.
- Provide re-analysis using the latest selected file and job description, a real report download from the current analysis object, and an “Improve in Resume Builder” action that returns to the existing builder view.

## UI structure
- Reusable `ResumeAnalyzer` page component with header, how-it-works dialog, upload card, loading checklist, capability cards, job-description input, and results dashboard.
- Results dashboard: resume metadata, overall score, four score breakdowns, keyword groups, strength radar, missing sections/signals, job match, analytics, and prioritized recommendations.
- Use current semantic tokens, sidebar/top-bar shell, Lucide icons, responsive grids, and accessible labels/status messaging.

## Technical changes
- Create `src/routes/resume-analyzer.jsx` with route-specific metadata.
- Create `src/components/resume-analyzer.jsx` for the feature UI and client-side file handling.
- Create `src/routes/api/analyze-resume.js` with Zod validation, bounded input handling, format extraction, and the configured Lovable AI model (`openai/gpt-5.6-sol`) through the Responses API; surface terminal/retryable errors without fabricating results.
- Add a small browser-safe handoff in `src/routes/index.jsx` so the existing shell can navigate to the route without replacing current views; preserve existing state and use the current draft as a separate “Improve” destination.
- Add the sidebar item and route link/navigation behavior without changing existing route labels or analysis logic.

## Verification
- Build diagnostics, route smoke check, empty state, validation/error states, TXT analysis request, results rendering, report download, and navigation back to the builder.
- Check desktop and narrow viewports for overflow and console errors.
