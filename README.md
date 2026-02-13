# Global Health Funding Matcher (MVP)

This is a lightweight web app that matches global health researchers to funding opportunities using profile information plus optional CV/resume text.

## What it does
- Collects profile details (career stage, institution type, region, focus areas, methods, populations, budget, sponsor preferences).
- Supports CV/resume upload (`.txt`, `.md`, `.docx`, `.pdf`) and text extraction in-browser when available.
- Requires CV text input before scoring to improve match quality.
- Auto-populates intake fields from uploaded CV text when high-confidence signals are detected (including suggested focus areas).
- Includes an `Apply CV Suggestions` toggle and manual apply button so users can choose auto-fill behavior.
- Computes a match score per opportunity with brief rationale.
- Provides post-match filtering and sorting within the first result set.
- Adds a due-date display option so users can quickly show/hide submission deadlines in matched results.
- Uses progressive (doom-scroll style) result loading in batches of 20 so larger result sets remain browsable.
- Includes score-pill hover/click context to explain how each score is computed and which gaps remain to reach 100/100.
- Adds a concise 1-2 sentence match explanation on every opportunity card.
- Adds UCSF collaborator matching for a selected opportunity using the UCSF Profiles API (`api.profiles.ucsf.edu`), scored by expertise overlap.
- Uses a UCSF-aligned visual palette with A1 UCSF Navy as the dominant brand color.
- Highlights intake labels in red when completing those fields would improve scoring signal.

## Run locally
Any static server works.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes
- Opportunity data is seeded for demonstration, not a live grant feed.
- The current seeded dataset includes more than 20 opportunities and supports progressive loading of all matches.
- UCSF collaborator lookup uses profile URL names (for example `kirsten.bibbins-domingo`) because the v2 API is primarily identifier-based.
- For production use, connect to live funding APIs and add authentication, saved searches, and reviewer workflows.
