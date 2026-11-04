<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep resume OCR assets locally served and load the OCR engine only from browser interactions so resume page images and text are not sent to third-party OCR hosts.
- The Resume Analyzer's scores, keyword matching, and document metrics come only from the deterministic engine in src/lib/resume-analysis.js; the AI gateway may add an optional narrative/recommendations on top but must never be required for scores or be presented as the score source.
