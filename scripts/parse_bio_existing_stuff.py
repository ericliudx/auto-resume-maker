#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

from pypdf import PdfReader


REDACTIONS = [
    # Emails
    (re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I), "[REDACTED_EMAIL]"),
    # US phone numbers (very permissive)
    (
        re.compile(
            r"\b(?:\+?1[\s.-]?)?(?:\(\s*\d{3}\s*\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b"
        ),
        "[REDACTED_PHONE]",
    ),
    # Address-ish (weak heuristic; avoids committing full street addresses)
    (re.compile(r"\b\d{1,6}\s+[A-Za-z0-9.\- ]+\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane)\b", re.I), "[REDACTED_ADDRESS]"),
]


def stable_id(prefix: str, source: str) -> str:
    h = hashlib.sha256(source.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}_{h}"


def redact(text: str) -> str:
    out = text
    for pattern, repl in REDACTIONS:
        out = pattern.sub(repl, out)
    return out


def normalize_whitespace(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_dates_range(dates_raw: str | None) -> dict[str, str] | None:
    """
    Map a single resume date line to {start_date, end_date?}.
    end_date is omitted for ongoing roles (e.g. 'Present') or when only one segment exists.
    """
    if not dates_raw:
        return None
    s = normalize_whitespace(str(dates_raw))
    if not s:
        return None
    ongoing = frozenset({"present", "current", "now", "today"})
    for sep in (" – ", " — ", " - ", "\u2013", "\u2014"):
        if sep in s:
            a, b = [p.strip() for p in s.split(sep, 1)]
            if not a:
                return None
            out: dict[str, str] = {"start_date": a}
            if b and b.lower() not in ongoing:
                out["end_date"] = b
            return out
    return {"start_date": s}


def read_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    parts: list[str] = []
    for p in reader.pages:
        parts.append(p.extract_text() or "")
    return normalize_whitespace("\n".join(parts))


def newest_pdf(existing_stuff: Path) -> Path | None:
    pdfs = sorted(existing_stuff.glob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)
    return pdfs[0] if pdfs else None


def find_section_blocks(text: str) -> dict[str, str]:
    """
    Best-effort section splitting:
    - PDFs often extract as one long line; headings can appear inline.
    - Find heading occurrences by word-boundary match and slice the original text.
    """
    headings = {
        "summary": ["SUMMARY", "PROFESSIONAL SUMMARY", "PROFILE"],
        "experience": ["EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE"],
        "projects": ["PROJECTS", "SELECTED PROJECTS"],
        "education": ["EDUCATION"],
        "skills": ["SKILLS", "TECHNICAL SKILLS", "TECHNOLOGIES"],
        "certifications": ["CERTIFICATIONS", "CERTIFICATES"],
    }

    # Build regexes for all heading variants; prefer longer ones (e.g. WORK EXPERIENCE) first
    variant_to_label: list[tuple[str, str]] = []
    for label, variants in headings.items():
        for v in variants:
            variant_to_label.append((v, label))
    variant_to_label.sort(key=lambda x: len(x[0]), reverse=True)

    upper = text.upper()
    occurrences: list[tuple[int, int, str]] = []
    for variant, label in variant_to_label:
        # Word-boundary match so we don't match e.g. "SKILLSHARE"
        for m in re.finditer(rf"\b{re.escape(variant)}\b", upper):
            occurrences.append((m.start(), m.end(), label))

    # If nothing matched, fall back to line-based (some PDFs do preserve headings as separate lines)
    if not occurrences:
        lines = [ln.rstrip() for ln in text.splitlines()]
        label_for_heading: dict[str, str] = {}
        for label, hs in headings.items():
            for h in hs:
                label_for_heading[h] = label

        def canon_heading(s: str) -> str | None:
            s_clean = re.sub(r"[:\\-–—]+$", "", s.strip()).upper()
            return label_for_heading.get(s_clean)

        blocks: dict[str, list[str]] = {}
        current: str | None = None
        for ln in lines:
            if not ln.strip():
                if current:
                    blocks.setdefault(current, []).append("")
                continue
            maybe = canon_heading(ln)
            if maybe:
                current = maybe
                blocks.setdefault(current, [])
                continue
            if current:
                blocks.setdefault(current, []).append(ln)

        return {
            k: normalize_whitespace("\\n".join(v))
            for k, v in blocks.items()
            if normalize_whitespace("\\n".join(v))
        }

    # Deduplicate overlapping occurrences:
    # keep earliest occurrence per label; also avoid duplicates from multiple variants at same position
    occurrences.sort(key=lambda t: (t[0], -(t[1] - t[0])))
    first_for_label: dict[str, tuple[int, int]] = {}
    for start, end, label in occurrences:
        if label not in first_for_label:
            first_for_label[label] = (start, end)

    starts: list[tuple[int, str, int]] = [(s, lbl, e) for lbl, (s, e) in first_for_label.items()]
    starts.sort(key=lambda t: t[0])

    blocks_out: dict[str, str] = {}
    for i, (start, label, end) in enumerate(starts):
        next_start = starts[i + 1][0] if i + 1 < len(starts) else len(text)
        # content after heading token, up to next heading
        chunk = text[end:next_start]
        chunk = normalize_whitespace(chunk)
        if chunk:
            blocks_out[label] = chunk

    return blocks_out


def parse_bullets(block: str) -> list[str]:
    """
    Accept '-', '•', '●', or plain sentence lines.
    PDFs often extract multiple bullets on one line; split those too.
    """
    out: list[str] = []
    for raw in block.splitlines():
        line = raw.strip()
        if not line:
            continue
        # If the line contains inline bullet markers, split and keep order.
        if "●" in line or "•" in line:
            parts = re.split(r"\s*[●•]\s*", line)
            parts = [p.strip() for p in parts if p.strip()]
            out.extend(parts)
            continue
        line = re.sub(r"^[•\-\u2022]\s*", "", line)
        if line:
            out.append(line)
    return out


def is_dateish(line: str) -> bool:
    # e.g. "Jun 2024 – Present" or "Jan 2023 – May 2023"
    return bool(re.search(r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b.*[–-].*\b", line))


def parse_experiences(block: str, source_pdf_relpath: str, overwrite: bool, out: OutputPaths) -> list[Path]:
    """
    Convert an EXPERIENCE block into one JSON per role when possible.
    Heuristic:
    - Many resumes have a date range per role; PDFs often extract as one line.
    - Use date-range occurrences as anchors: header is the text right before a date range,
      bullets are the text after that date range up to the next one.
    """
    block = normalize_whitespace(block)
    # Preserve bullet boundaries better
    block = block.replace(" ● ", " ● ")

    date_re = re.compile(
        r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b\s+\d{4}\s*[–-]\s*(?:Present|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b\s+\d{4})",
        re.I,
    )
    # Prefer headers that look like "Org | Context Role | Tech" (at least 2 pipes).
    # Do NOT require an anchor; PDF text often loses clean delimiters.
    header_marker_re = re.compile(r"[A-Z][^●\n]{0,80}?\|[^●\n]{0,260}?\|[^●\n]{0,260}?")

    matches = list(date_re.finditer(block))
    if not matches:
        # fallback: one collection file (better than nonsense splits)
        exp_lines = parse_bullets(block)
        item = {
            "id": stable_id("experience", "\n".join(exp_lines)[:2000]),
            "type": "experience_collection",
            "items": exp_lines,
            "source": {"path": source_pdf_relpath, "kind": "pdf"},
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        return [safe_write_item(out.experiences, item["id"], item, overwrite=overwrite)]

    header_occurrences: list[tuple[int, int, str]] = []
    for hm in header_marker_re.finditer(block):
        header_text = normalize_whitespace(hm.group(0))
        if not header_text:
            continue
        # Filter obvious non-headers (bullets that happen to include a later header)
        first_token = header_text.split(" ", 1)[0].lower()
        if first_token in {"led", "launched", "developed", "leveraged", "conducted", "collaborated"}:
            continue
        header_occurrences.append((hm.start(), hm.end(), header_text))

    entries: list[dict[str, Any]] = []
    for i, m in enumerate(matches):
        prev_end = matches[i - 1].end() if i > 0 else 0
        next_date_start = matches[i + 1].start() if i + 1 < len(matches) else len(block)

        # Choose last header occurrence that ends before this date
        header = ""
        for hs, he, ht in header_occurrences:
            if he <= m.start():
                header = ht
            else:
                break
        if not header:
            header = normalize_whitespace(block[prev_end : m.start()]).strip()

        dates = normalize_whitespace(block[m.start() : m.end()])

        body_raw = block[m.end() : next_date_start]
        # If a header for the next role appears inside this body chunk, truncate before it
        for hs, he, ht in header_occurrences:
            if m.end() <= hs < next_date_start:
                body_raw = block[m.end() : hs]
                break
        body_chunk = normalize_whitespace(body_raw)

        header = re.sub(r"^[●•\-\s]+", "", header).strip().strip(" |•-–—")

        bullets = parse_bullets(body_chunk)
        entries.append({"header": header, "dates": dates, "bullets": bullets})

    written: list[Path] = []
    for e in entries:
        header = normalize_whitespace(e["header"])
        if not header:
            # avoid empty-header junk; fall back to a short derived header
            header = f"Experience {e.get('dates') or ''}".strip()
        item_id = stable_id("experience", header)
        dates_obj = parse_dates_range(e.get("dates"))
        item = {
            "id": item_id,
            "type": "experience",
            "header": header,
            "bullets": [b for b in e.get("bullets", []) if b],
            "source": {"path": source_pdf_relpath, "kind": "pdf"},
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        if dates_obj:
            item["dates"] = dates_obj
        written.append(safe_write_item(out.experiences, item_id, item, overwrite=overwrite))
    return written


def parse_projects(block: str, source_pdf_relpath: str, overwrite: bool, out: OutputPaths) -> list[Path]:
    """
    Convert a PROJECTS block into one JSON per project when possible.
    Heuristic: entries separated by a pattern like ' | ' (name | context ...)
    """
    block = block.replace(" ● ", "\n● ")
    # Insert newlines before "Something | Something" occurrences
    block = re.sub(r"\s([A-Z][A-Za-z0-9&'./ ]{2,80}\s\|\s)", r"\n\1", block)
    lines = [ln.strip() for ln in block.splitlines() if ln.strip()]

    entries: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for ln in lines:
        if "|" in ln and not ln.startswith(("●", "-", "•")):
            if current:
                entries.append(current)
            current = {"header": ln, "bullets": []}
            continue
        if not current:
            continue
        if ln.startswith("●"):
            current["bullets"].append(ln.lstrip("●").strip())
        else:
            current["bullets"].append(ln)
    if current:
        entries.append(current)

    written: list[Path] = []
    if not entries:
        # fallback: keep as collection
        proj_lines = parse_bullets(block)
        item = {
            "id": stable_id("projects", "\n".join(proj_lines)[:2000]),
            "type": "project_collection",
            "items": proj_lines,
            "source": {"path": source_pdf_relpath, "kind": "pdf"},
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        return [safe_write_item(out.projects, item["id"], item, overwrite=overwrite)]

    for e in entries:
        header = normalize_whitespace(e["header"])
        item_id = stable_id("project", header)
        item = {
            "id": item_id,
            "type": "project",
            "header": header,
            "bullets": [b for b in e.get("bullets", []) if b],
            "source": {"path": source_pdf_relpath, "kind": "pdf"},
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        written.append(safe_write_item(out.projects, item_id, item, overwrite=overwrite))
    return written


@dataclass
class OutputPaths:
    bio_root: Path

    @property
    def experiences(self) -> Path:
        return self.bio_root / "experiences"

    @property
    def projects(self) -> Path:
        return self.bio_root / "projects"

    @property
    def education(self) -> Path:
        return self.bio_root / "education"

    @property
    def skills(self) -> Path:
        return self.bio_root / "skills"

    @property
    def summaries(self) -> Path:
        return self.bio_root / "summaries"

    @property
    def certifications(self) -> Path:
        return self.bio_root / "certifications"


def ensure_dirs(paths: OutputPaths) -> None:
    for p in [
        paths.experiences,
        paths.projects,
        paths.education,
        paths.skills,
        paths.summaries,
        paths.certifications,
    ]:
        p.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def safe_write_item(folder: Path, item_id: str, data: Any, overwrite: bool) -> Path:
    out_path = folder / f"{item_id}.json"
    if out_path.exists() and not overwrite:
        return out_path
    write_json(out_path, data)
    return out_path


def load_txt(path: Path) -> str:
    return normalize_whitespace(path.read_text(encoding="utf-8"))


def parse_real_torch_qctool(existing_stuff: Path, overwrite: bool, out: OutputPaths) -> list[Path]:
    txt_path = existing_stuff / "Real-Torch-QCTool.txt"
    if not txt_path.exists():
        return []
    content = redact(load_txt(txt_path))
    bullets = [b for b in parse_bullets(content) if b != "What you did (high-signal bullets)"]
    item = {
        "id": stable_id("project", "real-torch-qc-tool"),
        "type": "project",
        "name": "RealTorch Cluster QC Tool",
        "source": {"path": str(txt_path.relative_to(out.bio_root.parent)), "kind": "txt"},
        "bullets": bullets,
        "tags": ["react", "flask", "workflow", "quality-control"],
        "updated_at": datetime.now().isoformat(timespec="seconds"),
    }
    written = safe_write_item(out.projects, item["id"], item, overwrite=overwrite)
    return [written]


def parse_resume_pdf(pdf_path: Path, overwrite: bool, out: OutputPaths) -> list[Path]:
    text = redact(read_pdf_text(pdf_path))
    blocks = find_section_blocks(text)
    source_pdf_relpath = str(pdf_path.relative_to(out.bio_root.parent))

    written: list[Path] = []

    # Summary variants
    if "summary" in blocks:
        summary_text = normalize_whitespace(blocks["summary"])
        item = {
            "id": stable_id("summary", summary_text[:2000]),
            "type": "summary",
            "text": summary_text,
            "source": {"path": source_pdf_relpath, "kind": "pdf"},
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        written.append(safe_write_item(out.summaries, item["id"], item, overwrite=overwrite))

    # Skills (store as one grouped file; can be split later)
    if "skills" in blocks:
        skill_lines = parse_bullets(blocks["skills"])
        item = {
            "id": stable_id("skills", "\n".join(skill_lines)[:2000]),
            "type": "skills",
            "groups": [{"name": "skills", "items": skill_lines}],
            "source": {"path": source_pdf_relpath, "kind": "pdf"},
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        written.append(safe_write_item(out.skills, item["id"], item, overwrite=overwrite))

    # Education: store raw lines (resume formats vary a lot)
    if "education" in blocks:
        edu_lines = parse_bullets(blocks["education"])
        item = {
            "id": stable_id("education", "\n".join(edu_lines)[:2000]),
            "type": "education",
            "entries": [{"raw": ln} for ln in edu_lines],
            "source": {"path": source_pdf_relpath, "kind": "pdf"},
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        written.append(safe_write_item(out.education, item["id"], item, overwrite=overwrite))

    if "projects" in blocks:
        written += parse_projects(blocks["projects"], source_pdf_relpath, overwrite=overwrite, out=out)

    if "experience" in blocks:
        written += parse_experiences(blocks["experience"], source_pdf_relpath, overwrite=overwrite, out=out)

    # Certifications
    if "certifications" in blocks:
        cert_lines = parse_bullets(blocks["certifications"])
        item = {
            "id": stable_id("certs", "\n".join(cert_lines)[:2000]),
            "type": "certifications",
            "items": cert_lines,
            "source": {"path": source_pdf_relpath, "kind": "pdf"},
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        written.append(safe_write_item(out.certifications, item["id"], item, overwrite=overwrite))

    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="Populate bio/ by parsing bio/existing-stuff/")
    parser.add_argument("--repo-root", default=".", help="Repo root (default: .)")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing generated JSON files")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    bio_root = repo_root / "bio"
    existing_stuff = bio_root / "existing-stuff"
    out = OutputPaths(bio_root=bio_root)

    if not existing_stuff.exists():
        raise SystemExit(f"Missing folder: {existing_stuff}")

    ensure_dirs(out)

    written: list[Path] = []

    written += parse_real_torch_qctool(existing_stuff, overwrite=args.overwrite, out=out)

    pdf_path = newest_pdf(existing_stuff)
    if pdf_path:
        written += parse_resume_pdf(pdf_path, overwrite=args.overwrite, out=out)

    # Print written paths relative to repo root
    for p in written:
        print(p.relative_to(repo_root))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
