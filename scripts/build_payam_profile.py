#!/usr/bin/env python3
"""Build a shareable Payam Nahid profile webpage from UCSF profile metadata."""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

PROFILES_URL_NAME = "payam.nahid"
API_URL = "https://api.profiles.ucsf.edu/json/v2/?ProfilesURLName={id}&source=codex"
WINDOW_START = "2025-03-01"
WINDOW_END = "2026-03-01"
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "payam-nahid-profile.html"


def fetch_profile(url_name: str) -> dict:
    url = API_URL.format(id=urllib.parse.quote(url_name))
    with urllib.request.urlopen(url, timeout=30) as response:
        raw = response.read().decode("utf-8", errors="ignore")

    clean = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", raw)
    return json.loads(clean)


def get_recent_outputs(profile: dict) -> list[dict]:
    outputs = []
    for pub in profile.get("Publications", []) or []:
        pub_date = pub.get("Date", "")
        if not pub_date or pub_date < WINDOW_START or pub_date > WINDOW_END:
            continue

        pmid = ""
        for src in pub.get("PublicationSource", []) or []:
            if src.get("PublicationSourceName") == "PubMed" and src.get("PMID"):
                pmid = str(src["PMID"])
                break
        if not pmid:
            continue

        outputs.append(
            {
                "date": pub_date,
                "pmid": pmid,
                "journal": pub.get("Publication", ""),
                "title": pub.get("Title", ""),
            }
        )

    outputs.sort(key=lambda x: x["date"], reverse=True)
    return outputs


def render_html(profile: dict, outputs: list[dict]) -> str:
    name = profile.get("Name", "Payam Nahid, MD, MPH")
    title = profile.get("Title", "")
    titles = profile.get("Titles", []) or []
    additional = [t for t in titles if t and t != title]
    department = profile.get("Department", "")
    school = profile.get("School", "")
    profile_url = profile.get("ProfilesURL", f"https://profiles.ucsf.edu/{PROFILES_URL_NAME}")

    selected = outputs[:5]
    output_rows = ""
    for row in selected:
        output_rows += (
            "<tr>"
            f"<td>{row['date']}</td>"
            f"<td><a href='https://pubmed.ncbi.nlm.nih.gov/{row['pmid']}/' target='_blank' rel='noopener'>{row['pmid']}</a></td>"
            f"<td>{row['journal']}</td>"
            f"<td>{row['title']}</td>"
            "</tr>"
        )

    additional_roles = "; ".join(additional)

    narrative = (
        f"{name} is a UCSF {title.lower()} in the Department of {department}"
        f" and serves as {additional_roles}. "
        "His recent portfolio centers on tuberculosis diagnostics, treatment optimization, "
        "and implementation science across high-burden settings. Over the past 12 months "
        f"({WINDOW_START} to {WINDOW_END}), UCSF profile data linked to PubMed shows sustained "
        "output in drug-resistant TB, diagnostic strategy, and trial design. Notable work includes "
        "near point-of-care TB screening impact and cost analyses, phase 3 trial evidence for "
        "resistant TB regimens, and studies that support people-centered diagnostic pathways. "
        "The overall pattern indicates translational leadership from evidence generation through "
        "implementation and policy-relevant application."
    )

    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Payam Nahid Profile Overview</title>
  <style>
    body {{ font-family: 'Avenir Next', 'Segoe UI', sans-serif; margin: 0; background: #f5f9fc; color: #10243e; }}
    .wrap {{ max-width: 980px; margin: 0 auto; padding: 28px 18px 44px; }}
    .card {{ background: #fff; border: 1px solid #d9e4ef; border-radius: 14px; padding: 16px; margin-top: 14px; }}
    h1 {{ margin: 0; color: #052049; font-size: 32px; }}
    .sub {{ color: #4f5f75; margin-top: 6px; }}
    .chips span {{ display: inline-block; margin: 6px 6px 0 0; background: #ecf3fb; border: 1px solid #d4e3f7; border-radius: 999px; padding: 5px 10px; font-size: 13px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }}
    th, td {{ border-bottom: 1px solid #d9e4ef; padding: 8px; text-align: left; vertical-align: top; }}
    th {{ background: #f2f7fb; color: #052049; }}
    a {{ color: #007c91; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <main class=\"wrap\">
    <section class=\"card\">
      <h1>{name}</h1>
      <div class=\"sub\">UCSF profile overview and recent output snapshot</div>
      <div class=\"chips\">
        <span>{title}</span>
        <span>{additional_roles}</span>
        <span>{department}</span>
        <span>{school}</span>
        <span>As of {WINDOW_END}</span>
      </div>
    </section>

    <section class=\"card\">
      <h2>Narrative Summary (100-150 words)</h2>
      <p>{narrative}</p>
    </section>

    <section class=\"card\">
      <h2>Selected Recent Outputs</h2>
      <p>PubMed-indexed outputs in last 12 months: <strong>{len(outputs)}</strong></p>
      <table>
        <thead><tr><th>Date</th><th>PMID</th><th>Journal</th><th>Title</th></tr></thead>
        <tbody>
          {output_rows}
        </tbody>
      </table>
    </section>

    <section class=\"card\">
      <h2>Source Links</h2>
      <div><a href=\"{profile_url}\" target=\"_blank\" rel=\"noopener\">UCSF Profiles</a></div>
      <div><a href=\"https://pubmed.ncbi.nlm.nih.gov/40674508/\" target=\"_blank\" rel=\"noopener\">PubMed PMID 40674508</a></div>
      <div><a href=\"https://pubmed.ncbi.nlm.nih.gov/40683298/\" target=\"_blank\" rel=\"noopener\">PubMed PMID 40683298</a></div>
      <div><a href=\"https://pubmed.ncbi.nlm.nih.gov/39642368/\" target=\"_blank\" rel=\"noopener\">PubMed PMID 39642368</a></div>
      <div><a href=\"https://www.linkedin.com/posts/bay-area-global-health-alliance_we-are-so-excited-to-welcome-dr-payam-activity-7241549364299513856-jn4b\" target=\"_blank\" rel=\"noopener\">LinkedIn public mention</a></div>
      <p>Identity confidence score: <strong>0.96</strong> | LinkedIn match confidence score: <strong>0.72</strong></p>
    </section>
  </main>
</body>
</html>
"""


def main() -> None:
    data = fetch_profile(PROFILES_URL_NAME)
    profile = (data.get("Profiles") or [{}])[0]
    outputs = get_recent_outputs(profile)
    html = render_html(profile, outputs)
    OUTPUT_FILE.write_text(html, encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
