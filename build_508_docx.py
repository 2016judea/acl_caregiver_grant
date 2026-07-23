#!/usr/bin/env python3
"""
Build Section 508-compliant .docx submissions for the ACL Caregiver AI Challenge
from the markdown source, with a reconciled cover page.

508 features applied:
  - Real Heading styles (Title / Heading 1 / Heading 2 / Heading 3) — not bold text
  - Tables with a designated, repeating header row (w:tblHeader) + bold header cells
  - Document title set in core properties
  - Document default language set to en-US
  - Bullet/number lists use real list styles; hyperlinks are real links

Run with the python-docx venv:  /tmp/docxenv/bin/python build_508_docx.py
"""
import re
import sys
from pathlib import Path

from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ROOT = Path(__file__).resolve().parent / "applications"

# ---------- low-level 508 helpers ----------

def set_default_language(doc, lang="en-US"):
    # canonical place: styles.xml docDefaults/rPrDefault/rPr/lang
    styles_el = doc.styles.element
    docDefaults = styles_el.find(qn("w:docDefaults"))
    if docDefaults is None:
        docDefaults = OxmlElement("w:docDefaults"); styles_el.insert(0, docDefaults)
    rPrDefault = docDefaults.find(qn("w:rPrDefault"))
    if rPrDefault is None:
        rPrDefault = OxmlElement("w:rPrDefault"); docDefaults.append(rPrDefault)
    rPr = rPrDefault.find(qn("w:rPr"))
    if rPr is None:
        rPr = OxmlElement("w:rPr"); rPrDefault.append(rPr)
    for parent in (rPr, doc.styles["Normal"].element.get_or_add_rPr()):
        el = parent.find(qn("w:lang"))
        if el is None:
            el = OxmlElement("w:lang"); parent.append(el)
        el.set(qn("w:val"), lang)

def add_page_number_footer(doc):
    """ACL Phase 1 outline: 'Please include page numbers.' Centered PAGE field in the footer."""
    section = doc.sections[0]
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    fld_begin = OxmlElement("w:fldChar"); fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText"); instr.set(qn("xml:space"), "preserve"); instr.text = "PAGE"
    fld_end = OxmlElement("w:fldChar"); fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_end)

def mark_header_row(row):
    """Flag a table row as a repeating header row (508 + repeats across pages)."""
    trPr = row._tr.get_or_add_trPr()
    th = OxmlElement("w:tblHeader")
    th.set(qn("w:val"), "true")
    trPr.append(th)

def add_hyperlink(paragraph, url, text):
    part = paragraph.part
    r_id = part.relate_to(url, RT.HYPERLINK, is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)
    run = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")
    style = OxmlElement("w:rStyle")
    style.set(qn("w:val"), "Hyperlink")
    rPr.append(style)
    run.append(rPr)
    t = OxmlElement("w:t")
    t.text = text
    run.append(t)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)

INLINE = re.compile(
    r"\*\*(.+?)\*\*"          # 1 bold
    r"|\*(.+?)\*"             # 2 italic
    r"|`(.+?)`"               # 3 code
    r"|\[(.+?)\]\((.+?)\)"    # 4 text / 5 url
    r"|(https?://[^\s)]+)"    # 6 bare url
)

def add_runs(p, text):
    pos = 0
    for m in INLINE.finditer(text):
        if m.start() > pos:
            p.add_run(text[pos:m.start()])
        if m.group(1) is not None:
            p.add_run(m.group(1)).bold = True
        elif m.group(2) is not None:
            p.add_run(m.group(2)).italic = True
        elif m.group(3) is not None:
            r = p.add_run(m.group(3)); r.font.name = "Consolas"
        elif m.group(4) is not None:
            add_hyperlink(p, m.group(5), m.group(4))
        else:
            add_hyperlink(p, m.group(6), m.group(6))
        pos = m.end()
    if pos < len(text):
        p.add_run(text[pos:])

def add_table(doc, rows):
    cols = max(len(r) for r in rows)
    t = doc.add_table(rows=0, cols=cols)
    t.style = "Table Grid"
    for i, cells in enumerate(rows):
        row = t.add_row()
        for j in range(cols):
            cell = row.cells[j]
            cell.text = ""
            para = cell.paragraphs[0]
            add_runs(para, cells[j] if j < len(cells) else "")
            if i == 0:
                for run in para.runs:
                    run.bold = True
        if i == 0:
            mark_header_row(row)
    return t

# ---------- markdown block renderer ----------

def split_table_row(line):
    line = line.strip().strip("|")
    return [c.strip() for c in line.split("|")]

def render_markdown(doc, md, drop_section=None):
    """Render markdown body into doc. Optionally skip a '## <name>' section."""
    lines = md.splitlines()
    i, n = 0, len(lines)
    skipping = False
    while i < n:
        line = lines[i].rstrip()
        stripped = line.strip()

        if stripped.startswith("## "):
            name = stripped[3:].strip()
            if drop_section and name == drop_section:
                skipping = True
                i += 1
                continue
            skipping = False

        if skipping:
            i += 1
            continue

        if not stripped or stripped == "---":
            i += 1
            continue

        # tables: a line with '|' followed by a separator row
        if stripped.startswith("|") and i + 1 < n and re.match(r"^\|[\s:|-]+\|?\s*$", lines[i + 1].strip()):
            block = []
            while i < n and lines[i].strip().startswith("|"):
                if not re.match(r"^\|[\s:|-]+\|?\s*$", lines[i].strip()):
                    block.append(split_table_row(lines[i]))
                i += 1
            add_table(doc, block)
            continue

        if stripped.startswith("# "):
            doc.add_heading(stripped[2:].strip(), level=0)
        elif stripped.startswith("### "):
            doc.add_heading(stripped[4:].strip(), level=2)
        elif stripped.startswith("#### "):
            doc.add_heading(stripped[5:].strip(), level=3)
        elif stripped.startswith("## "):
            txt = stripped[3:].strip()
            # tagline like "## *....*" -> subtitle, not a heading
            if txt.startswith("*") and txt.endswith("*"):
                p = doc.add_paragraph(style="Subtitle")
                add_runs(p, txt)
            else:
                doc.add_heading(txt, level=1)
        elif stripped.startswith("> "):
            p = doc.add_paragraph(style="Quote")
            add_runs(p, stripped[2:].strip())
        elif re.match(r"^[-*] ", stripped):
            p = doc.add_paragraph(style="List Bullet")
            add_runs(p, stripped[2:].strip())
        elif re.match(r"^\d+\. ", stripped):
            p = doc.add_paragraph(style="List Number")
            add_runs(p, re.sub(r"^\d+\.\s*", "", stripped))
        else:
            p = doc.add_paragraph()
            add_runs(p, stripped)
        i += 1

# ---------- cover page ----------

def get_abstract(md):
    lines = md.splitlines()
    for i, ln in enumerate(lines):
        if ln.strip() == "## Abstract":
            for j in range(i + 1, len(lines)):
                s = lines[j].strip()
                if not s or s == "---":
                    continue
                if s.startswith("*(") or s.startswith("## "):
                    break
                return s
    return ""

def wc(text):
    return len(re.sub(r"[*`]", "", text).split())

CERTS = [
    "Applicant is a U.S.-incorporated entity or U.S. citizen/permanent resident",
    "Applicant is not a federal employee",
    "Applicant is 18 years of age or older",
    "Solution does not use conflicting federal funds",
    "Applicant holds or will obtain required liability insurance",
    "Applicant has read and agrees to all challenge rules",
]

def field(doc, label, value):
    p = doc.add_paragraph()
    p.add_run(label + ": ").bold = True
    add_runs(p, value)

def build_cover(doc, c, abstract):
    doc.add_heading("ACL Caregiver AI Challenge — Phase 1 Cover Page", level=0)
    field(doc, "AI Solution Name", c["solution"])
    field(doc, "Track", c["track"])
    field(doc, "Meritorious Focus Area", c["meritorious"])
    doc.add_paragraph()
    field(doc, "Applicant Organization", c["org"])
    field(doc, "Organization Type", "Individual / Sole Proprietor")
    doc.add_paragraph()
    field(doc, "Primary Contact / Team Leader", c["pc_name"] + ", " + c["pc_title"])
    field(doc, "Email", c["pc_email"])
    field(doc, "Phone", c["pc_phone"])
    field(doc, "Mailing Address", c["pc_addr"])
    field(doc, "Primary Contact Status", "U.S. Citizen")
    field(doc, "Alternate Contact", "None")
    doc.add_paragraph()
    p = doc.add_paragraph(); p.add_run("Team Members").bold = True
    add_table(doc, [["Full Name", "Title / Role", "Organization Affiliation"]] + c["team"])
    doc.add_paragraph()
    field(doc, "Current TRL", c["trl"])
    field(doc, "Prototype URL", c["prototype"])
    doc.add_paragraph()
    doc.add_heading("Abstract (%d words)" % wc(abstract), level=1)
    p = doc.add_paragraph(); add_runs(p, abstract)

def build_certifications(doc):
    doc.add_page_break()
    doc.add_heading("Applicant Certifications", level=1)
    for cert in CERTS:
        p = doc.add_paragraph(style="List Bullet")
        p.add_run("☒ ").bold = True   # checked box
        add_runs(p, cert)
    doc.add_paragraph("Authorized Signature: __________________________    Date: ____________")

# ---------- diagnostics ----------

def diagnose(path):
    import zipfile
    z = zipfile.ZipFile(path)
    doc = z.read("word/document.xml").decode("utf-8", "ignore")
    styles = sorted(set(re.findall(r'w:pStyle w:val="([^"]+)"', doc)))
    n_tbl = doc.count("<w:tbl>")
    n_hdr = doc.count("<w:tblHeader")
    has_core = "docProps/core.xml" in z.namelist()
    title = ""
    if has_core:
        core = z.read("docProps/core.xml").decode("utf-8", "ignore")
        m = re.search(r"<dc:title>([^<]*)</dc:title>", core)
        title = m.group(1) if m else "(empty)"
    styles_xml = z.read("word/styles.xml").decode("utf-8", "ignore")
    langs = sorted(set(re.findall(r'w:lang w:val="([^"]+)"', doc + styles_xml)))
    words = len(re.findall(r"[A-Za-z]+", re.sub(r"<[^>]+>", " ", doc)))
    return dict(styles=styles, tables=n_tbl, header_rows=n_hdr, title=title,
                langs=langs, words=words, est_pages=round(words / 500, 1))

# ---------- track config ----------

TRACKS = {
    "dementia": dict(
        dir="track1_dementia_coach", stem="Dementia_Coach",
        title="Dementia Coach — ACL Caregiver AI Challenge, Track 1, Phase 1",
        cover=dict(
            solution="Dementia Coach",
            track="Track 1 — AI Tools to Support Caregivers",
            meritorious="Dementia Caregiving",
            org="Aidan Jude (Sole Proprietor)",
            pc_name="Aidan Jude", pc_title="Principal Investigator",
            pc_email="[email]", pc_phone="[phone]",
            pc_addr="[address]",
            team=[["Aidan Jude", "Principal Investigator", "Independent"]],
            trl="3–4", prototype="https://dementia-coach.vercel.app",
        ),
    ),
    "cna": dict(
        dir="track2_cna_shield", stem="CNA_Shield",
        title="CNA Shield — ACL Caregiver AI Challenge, Track 2, Phase 1",
        cover=dict(
            solution="CNA Shield",
            track="Track 2 — AI Tools for Extending the Caregiver Workforce",
            meritorious="EMR Interoperability",
            org="Aidan Jude (Sole Proprietor)",
            pc_name="Aidan Jude", pc_title="Principal Investigator",
            pc_email="[email]", pc_phone="[phone]",
            pc_addr="[address]",
            team=[["Aidan Jude", "Principal Investigator", "Independent"]],
            trl="3–4", prototype="https://cna-shield.vercel.app",
        ),
    ),
}

def build_track(key):
    cfg = TRACKS[key]
    d = ROOT / cfg["dir"]
    app_md = (d / f"{cfg['stem'].lower()}_application.md").read_text()
    appx_md = (d / f"{cfg['stem'].lower()}_evidence_appendix.md").read_text()
    abstract = get_abstract(app_md)

    # ---- Submission (cover page + narrative) ----
    doc = Document()
    set_default_language(doc)
    doc.core_properties.title = cfg["title"]
    build_cover(doc, cfg["cover"], abstract)
    doc.add_page_break()
    render_markdown(doc, app_md, drop_section="Abstract")  # abstract lives on the cover page
    build_certifications(doc)
    add_page_number_footer(doc)
    sub_path = d / f"{cfg['stem']}_ACL_Submission.docx"
    doc.save(sub_path)

    # ---- Evidence Appendix ----
    ap = Document()
    set_default_language(ap)
    ap.core_properties.title = cfg["title"] + " — Evidence Appendix"
    render_markdown(ap, appx_md)
    add_page_number_footer(ap)
    appx_path = d / f"{cfg['stem']}_Evidence_Appendix.docx"
    ap.save(appx_path)

    # ---- Data Output Logs (supplemental; does not count toward page limit) ----
    logs_path = None
    logs_md_file = d / f"{cfg['stem'].lower()}_data_output_logs.md"
    if logs_md_file.exists():
        lg = Document()
        set_default_language(lg)
        lg.core_properties.title = cfg["title"] + " — Data Output Logs"
        render_markdown(lg, logs_md_file.read_text())
        logs_path = d / f"{cfg['stem']}_Data_Output_Logs.docx"
        lg.save(logs_path)

    # ---- TRL Validation Log (supplemental; does not count toward the page limit) ----
    trl_path = None
    trl_md_file = d / f"{cfg['stem'].lower()}_trl_validation.md"
    if trl_md_file.exists():
        tv = Document()
        set_default_language(tv)
        tv.core_properties.title = cfg["title"] + " — TRL Validation Log"
        render_markdown(tv, trl_md_file.read_text())
        trl_path = d / f"{cfg['stem']}_TRL_Validation.docx"
        tv.save(trl_path)

    return sub_path, appx_path, logs_path, trl_path, abstract

if __name__ == "__main__":
    for key in ("dementia", "cna"):
        sub, appx, logs, trl, abstract = build_track(key)
        print(f"\n=== {key.upper()} ===  abstract words: {wc(abstract)}")
        outputs = [("Submission (narrative ≤15pp)", sub, 15),
                   ("Evidence Appendix", appx, None)]
        if logs is not None:
            outputs.append(("Data Output Logs (supplemental)", logs, None))
        if trl is not None:
            outputs.append(("TRL Validation Log (supplemental)", trl, None))
        for label, path, limit in outputs:
            dg = diagnose(path)
            flag = ""
            if limit and dg["est_pages"] > limit:
                flag = f"  <-- OVER ~{limit}pp, TRIM"
            print(f"\n  {label}: {path.name}")
            print(f"    styles: {dg['styles']}")
            print(f"    tables: {dg['tables']} | header rows flagged: {dg['header_rows']}")
            print(f"    core title: {dg['title'][:60]!r} | lang: {dg['langs']}")
            print(f"    words: {dg['words']} | est pages (incl. cover): ~{dg['est_pages']}{flag}")
