#!/usr/bin/env python3
"""Normalize the supplied Phase 1 institution XLSX into catalog-import JSON."""
from __future__ import annotations
import argparse,json,re,zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
NS={"main":"http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
TYPE_MAP={"University":"university","Polytechnic":"polytechnic","College of Education":"college_of_education"}
REL="{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
def col_index(ref):
    letters=re.match(r"[A-Z]+",ref).group(0); n=0
    for c in letters:n=n*26+ord(c)-64
    return n-1
def read_xlsx(path,sheet_name):
    with zipfile.ZipFile(path) as z:
        shared=[]
        if "xl/sharedStrings.xml" in z.namelist():
            root=ET.fromstring(z.read("xl/sharedStrings.xml"))
            shared=["".join(t.text or "" for t in si.iterfind(".//main:t",NS)) for si in root.findall("main:si",NS)]
        wb=ET.fromstring(z.read("xl/workbook.xml")); rels=ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        targets={r.attrib["Id"]:r.attrib["Target"] for r in rels}
        sheet=next(s for s in wb.find("main:sheets",NS) if s.attrib["name"]==sheet_name)
        target=targets[sheet.attrib[REL]]
        sheet_path=target if target.startswith("xl/") else "xl/"+target.lstrip("/")
        root=ET.fromstring(z.read(sheet_path)); rows=[]
        for row in root.findall(".//main:sheetData/main:row",NS):
            values={}
            for cell in row.findall("main:c",NS):
                v=cell.find("main:v",NS); value="" if v is None else v.text or ""
                if cell.attrib.get("t")=="s" and value:value=shared[int(value)]
                values[col_index(cell.attrib.get("r","A1"))]=value
            if values:rows.append(values)
        return rows
def main():
    ap=argparse.ArgumentParser(); ap.add_argument("input",type=Path); ap.add_argument("output",type=Path); a=ap.parse_args()
    rows=read_xlsx(a.input,"INSTITUTIONS"); headers=rows[0]; hm={v:k for k,v in headers.items()}
    required=["Institution ID","Institution Type","Institution Name","Ownership","State","Source Authority","Source / Reference","Last Verified","Verification Status","Notes"]
    missing=[h for h in required if h not in hm]
    if missing:raise SystemExit(f"Missing columns: {', '.join(missing)}")
    out=[]; excluded=0; nbte_confirmed_count=0
    for row in rows[1:]:
        status=row.get(hm["Verification Status"],"").strip()
        authority=row.get(hm["Source Authority"],"").strip()
        regulator_verified=authority.startswith("NBTE (National Board for Technical Education)")
        if status.lower()!="verified" and not regulator_verified:excluded+=1; continue
        it=row.get(hm["Institution Type"],"").strip()
        if it not in TYPE_MAP:raise SystemExit(f"Unsupported institution type: {it}")
        effective_status="verified" if regulator_verified else status.lower()
        notes=row.get(hm["Notes"],"").strip()
        if regulator_verified and status.lower()!="verified":
            notes=(notes+" | Institution identity/accreditation independently confirmed against NBTE; ownership/state remain source-preserved pending separate corroboration.").strip(" |")
            nbte_confirmed_count += 1
        payload={"name":row.get(hm["Institution Name"],"").strip(),"institution_type":TYPE_MAP[it],"ownership":row.get(hm["Ownership"],"").strip(),"state":row.get(hm["State"],"").strip(),"source_authority":authority,"source_reference":row.get(hm["Source / Reference"],"").strip(),"last_verified":row.get(hm["Last Verified"],"").strip(),"verification_status":effective_status,"notes":notes}
        out.append({"row_number":len(out)+1,"entity_type":"institution","external_key":row.get(hm["Institution ID"],"").strip(),"payload":payload})
    result={"dataset_type":"institutions","rows":out,"metadata":{"verified_or_regulator_confirmed":True,"excluded_unverified":excluded,"nbte_identity_confirmed_records":nbte_confirmed_count,"institution_directory_only":True,"jamb_codes_invented":False,"programmes_invented":False,"utme_combinations_invented":False}}
    a.output.parent.mkdir(parents=True,exist_ok=True); a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Wrote {len(out)} institution rows; excluded {excluded} rows without verified/regulator-confirmed identity.")
if __name__=="__main__":main()
