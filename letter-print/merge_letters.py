#!/usr/bin/env python3
"""
KAP letter merge tool.
Usage:  python3 merge_letters.py recipients.csv

Reads a CSV (one row per letter) and produces one print-ready PDF per row
(216x303mm, A4 + 3mm bleed, per Stannp's A4 letter guide), plus a combined
proof PDF. The back (credentials) page is identical for every letter.

CSV columns (header row required):
  date        e.g. 16 July 2026        -> printed top-right
  name        e.g. The Homeowner       -> first line of the address block
  address1    e.g. 18 Kingsbere Crescent
  address2    (optional)               e.g. Broadstone
  city        e.g. Dorchester
  postcode    e.g. DT1 2DY
  body1       first letter paragraph
  body2       second paragraph
  body3       third paragraph
"""
import sys, csv, os, html
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

HERE = os.path.dirname(os.path.abspath(__file__))
FRONT_TPL = open(os.path.join(HERE,'template_front.html')).read()
BACK_TPL   = os.path.join(HERE,'template_back.html')

def esc(s): return html.escape(s or '')

def build_front(row):
    addr_lines = [row.get('name','The Homeowner'), row['address1']]
    if row.get('address2'): addr_lines.append(row['address2'])
    addr_lines += [row.get('city',''), row.get('postcode','')]
    address = "<br>".join(esc(x) for x in addr_lines if x)
    body = "".join(f"<p>{esc(row.get(b,''))}</p>" for b in ('body1','body2','body3') if row.get(b))
    out = FRONT_TPL.replace('{{ADDRESS}}', address).replace('{{DATE}}', esc(row.get('date',''))).replace('{{BODY}}', body)
    return out

def main(csv_path):
    rows = list(csv.DictReader(open(csv_path)))
    if not rows: sys.exit("No rows in CSV.")
    outdir = os.path.join(HERE,'output'); os.makedirs(outdir, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page()
        # shared back page
        pg.goto('file://'+BACK_TPL)
        back_pdf = os.path.join(outdir,'_back.pdf')
        pg.pdf(path=back_pdf, width='216mm', height='303mm', print_background=True,
               margin={'top':'0','bottom':'0','left':'0','right':'0'})
        letters=[]
        for i,row in enumerate(rows,1):
            fh = os.path.join(outdir, f'_front_{i}.html'); open(fh,'w').write(build_front(row))
            fp = os.path.join(outdir, f'_front_{i}.pdf')
            pg.goto('file://'+fh)
            pg.pdf(path=fp, width='216mm', height='303mm', print_background=True,
                   margin={'top':'0','bottom':'0','left':'0','right':'0'})
            assert len(PdfReader(fp).pages)==1, f"row {i}: front overflowed one page"
            w=PdfWriter(); w.add_page(PdfReader(fp).pages[0]); w.add_page(PdfReader(back_pdf).pages[0])
            ref = (row.get('postcode') or f'letter{i}').replace(' ','_')
            out = os.path.join(outdir, f'KAP_{i:02d}_{ref}.pdf')
            with open(out,'wb') as f: w.write(f)
            letters.append(out); print("built", os.path.basename(out))
        b.close()
    # combined proof
    w=PdfWriter()
    for p in letters:
        for pg2 in PdfReader(p).pages: w.add_page(pg2)
    proof=os.path.join(outdir,'ALL_letters_proof.pdf')
    with open(proof,'wb') as f: w.write(f)
    # tidy temp files
    for t in os.listdir(outdir):
        if t.startswith('_front_') or t=='_back.pdf': os.remove(os.path.join(outdir,t))
    print(f"\nDone. {len(letters)} letters + proof in: {outdir}")

if __name__=='__main__':
    if len(sys.argv)<2: sys.exit("Usage: python3 merge_letters.py recipients.csv")
    main(sys.argv[1])
