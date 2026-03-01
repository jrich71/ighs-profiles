# Payam Nahid Profile Page (POC)

This repository contains a shareable proof-of-concept webpage summarizing Dr. Payam Nahid's current role and recent professional outputs.

## Contents

- `payam-nahid-profile.html`: static webpage to share directly.
- `scripts/build_payam_profile.py`: supporting script that can regenerate the page from UCSF profile data.
- `README.md`: this documentation.

## Page Fields

The page includes these fields:

- `researcher_name`: full name and credentials.
- `institution`: UCSF.
- `current_role`: primary role from UCSF profile.
- `additional_roles`: additional listed roles.
- `department`: UCSF department.
- `school`: UCSF school.
- `outputs_past_12m_count`: count of PubMed-indexed outputs in the last 12 months.
- `recent_outputs`: selected outputs with `date`, `pmid`, `journal`, `title`.
- `source_links`: links to UCSF profile, PubMed entries, and any included public LinkedIn mention.
- `identity_confidence_score`: confidence that role/publication data is correctly matched.
- `linkedin_match_confidence_score`: separate confidence for LinkedIn-related matching.

## Build / Refresh

Run from repo root:

```bash
python3 scripts/build_payam_profile.py
```

This will regenerate `payam-nahid-profile.html` using current UCSF profile API data.

## Future Work

1. Add LinkedIn OAuth-based enrichment via a LinkedIn Developer App rather than scraping.
2. Expand to multi-researcher pages and index/search views.
3. Add structured evidence cards per claim (with timestamped provenance).
4. Add periodic refresh automation and change-tracking diffs.
5. Add reviewer workflow for confidence overrides and publication curation.
6. Add deployment pipeline (GitHub Pages or internal UCSF-hosted static site).

## Notes

- This POC uses publicly accessible metadata and is intended for demonstration/report-back.
- Avoid scraping LinkedIn profiles directly; use approved API access and consent-based flows.
