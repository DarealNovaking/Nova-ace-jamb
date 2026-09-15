#!/usr/bin/env python3
"""Normalize the supplied Phase 1 institution XLSX into catalog-import JSON.

Stdlib-only: reads the XLSX worksheet XML directly, keeps only rows marked
Verified, and preserves source/provenance fields. It intentionally does not
invent JAMB codes, programmes, or UTME combinations.
"""
from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkg": "http://schemas.openxmlformats.org/package/2006/relationships",
}
TYPE_MAP = {"University": "university", "Polytechnic": "polytechnic", "College of Education": "college_of_education"}


def col_index(ref: str) -> int:
    letters = re.match(r"[A-Z]+", ref).group(0)
    n = 0
    for c in letters:
        n = n * 26 + ord(c) - 64
    return n - 1


def read_xlsx(path: Path, sheet_name: str):
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("main:si", NS):
                shared.append("".join(t.text or "" for t in si.iterfind(".//main:t", NS)))
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        targets = {r.attrib["Id"]: r.attrib["Target"] for r in rels}
        sheet = next(s for s in wb.find("main:sheets", NS) if s.attrib["name"] == sheet_name)
        target = targets[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
        sheet_path = target if target.startswith("xl/") else "xl/" + target.lstrip("/")
        root = ET.fromstring(z.read(sheet_path))
        rows = []
        for row in root.findall(".//main:sheetData/main:row", NS):
            values = {}
            for cell in row.findall("main:c", NS):
                ref = cell.attrib.get("r", "A1")
                idx = col_index(ref)
                v = cell.find("main:v", NS)
                value = "" if v is None else v.text or ""
                if cell.attrib.get("t") == "s" and value:
                    value = shared[int(value)]
                values[idx] = value
            if values:
                rows.append(values)
        return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("output", type=Path)
    args = ap.parse_args()
    rows = read_xlsx(args.input, "INSTITUTIONS")
    headers = rows[0]
    header_map = {v: k for k, v in headers.items()}
    required = ["Institution ID", "Institution Type", "Institution Name", "Ownership", "State", "Source Authority", "Source / Reference", "Last Verified", "Verification Status", "Notes"]
    missing = [h for h in required if h not in header_map]
    if missing:
        raise SystemExit(f"Missing columns: {', '.join(missing)}")

    output_rows = []
    excluded = 0
    for row in rows[1:]:
        status = row.get(header_map["Verification Status"], "").strip()
        if status.lower() != "verified":
            excluded += 1
            continue
        institution_type = row.get(header_map["Institution Type"], "").strip()
        if institution_type not in TYPE_MAP:
            raise SystemExit(f"Unsupported institution type: {institution_type}")
        payload = {
            "name": row.get(header_map["Institution Name"], "").strip(),
            "institution_type": TYPE_MAP[institution_type],
            "ownership": row.get(header_map["Ownership"], "").strip(),
            "state": row.get(header_map["State"], "").strip(),
            "source_authority": row.get(header_map["Source Authority"], "").strip(),
            "source_reference": row.get(header_map["Source / Reference"], "").strip(),
            "last_verified": row.get(header_map["Last Verified"], "").strip(),
            "verification_status": status,
            "notes": row.get(header_map["Notes"], "").strip(),
        }
        output_rows.append({
            "row_number": len(output_rows) + 1,
            "entity_type": "institution",
            "external_key": row.get(header_map["Institution ID"], "").strip(),
            "payload": payload,
        })

    result = {
        "dataset_type": "institutions",
        "rows": output_rows,
        "metadata": {
            "verified_only": True,
            "excluded_unverified": excluded,
            "institution_directory_only": True,
            "jamb_codes_invented": False,
            "programmes_invented": False,
            "utme_combinations_invented": False,
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(output_rows)} verified institution rows; excluded {excluded} unverified rows.")


if __name__ == "__main__":
    main()
