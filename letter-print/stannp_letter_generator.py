# NOTE: render with headless Chromium (page.pdf, width/height 216mm x 303mm,
# print_background=True) for exact @page mm + true full bleed. wkhtmltopdf
# leaves right/bottom bleed gaps and drifts multi-page pagination.
import json, base64, subprocess, os, glob
from datetime import date
from pypdf import PdfReader, PdfWriter

A = json.load(open('assets_uris.json'))
DATESTR = date(2026,7,16).strftime('%-d %B %Y')
GOLD="#FDAE12"; BLACK="#050505"; CHAR="#1A1A1C"; WHITE="#F9F9FB"

LEADS = json.load(open('leads.json'))

def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

# Shared CSS. Every page = ONE canvas, exactly 216x303mm, overflow hidden so
# nothing can ever spill to a second page. Bands bleed to all relevant edges.
HEAD = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@page{{size:216mm 303mm;margin:0}} *{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:216mm;height:303mm}}
body{{font-family:'Open Sans',Arial,sans-serif;color:#141414}}
.canvas{{width:216mm;height:303mm;position:relative;overflow:hidden;background:{WHITE}}}
.hband{{position:absolute;top:0;left:0;width:216mm;height:34mm;background:{BLACK}}}
.logo{{position:absolute;top:12mm;left:21mm;height:34px}}
.hc{{position:absolute;top:12mm;right:21mm;text-align:right;font-family:'Montserrat',sans-serif;font-size:7.6pt;color:#bdbdc0;line-height:1.7}}
.hc b{{color:{GOLD};font-weight:600;font-size:9pt}}
.abox{{position:absolute;top:44.5mm;left:21mm;width:99mm;height:45.5mm;font-family:'Montserrat',sans-serif;font-size:10.5pt;line-height:1.55;color:#222}}
.date{{position:absolute;top:52mm;right:21mm;font-family:'Montserrat',sans-serif;font-size:9.5pt;color:#555}}
.main{{position:absolute;top:98mm;left:21mm;right:21mm}}
.greet{{font-size:11pt;margin-bottom:8px}}
.main p{{font-size:10.8pt;line-height:1.6;margin-bottom:9px}}
.sign{{margin-top:5mm;font-size:10.8pt}}
.sign .n{{font-family:'Montserrat',sans-serif;font-weight:700;font-size:11pt;margin-top:10mm}}
.sign .r{{font-family:'Montserrat',sans-serif;font-size:8.5pt;color:#666;letter-spacing:.5px;text-transform:uppercase}}
.fband{{position:absolute;bottom:0;left:0;width:216mm;height:33mm;background:{BLACK};color:#c9c9cc}}
.fin{{position:absolute;bottom:9mm;left:21mm;right:21mm;display:flex;justify-content:space-between;align-items:center}}
.fa{{font-family:'Montserrat',sans-serif;font-size:7.6pt;line-height:1.7}}
.fa .l{{color:{GOLD};font-weight:600;text-transform:uppercase;letter-spacing:1px;font-size:7.4pt}}
.fb{{display:flex;align-items:center;gap:10px}}
.tile{{background:#fff;padding:5px;border-radius:3px;text-align:center}}
.tile img{{height:52px;width:52px;display:block}}
.tile span{{display:block;font-family:'Montserrat',sans-serif;font-size:5.6pt;color:#333;margin-top:2px}}
.tile.fsb img{{width:auto;height:34px;margin:9px 4px}}
/* back */
.hero{{position:absolute;top:0;left:0;right:0;background:{BLACK};color:#fff;padding:20mm 21mm 13mm}}
.hero .e{{font-family:'Montserrat',sans-serif;color:{GOLD};font-size:8.5pt;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px}}
.hero h1{{font-family:'Montserrat',sans-serif;font-weight:700;font-size:25pt;line-height:1.08}}
.hero p{{font-size:10.5pt;color:#cfcfcf;margin-top:10px;max-width:150mm;line-height:1.5}}
.prom{{position:absolute;top:78mm;left:21mm;right:21mm;display:flex;gap:9mm}}
.prom h3{{font-family:'Montserrat',sans-serif;font-size:9.5pt;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px}}
.prom .big{{color:{GOLD};font-family:'Montserrat',sans-serif;font-weight:700;font-size:15pt}}
.prom p{{font-size:9pt;color:#333;line-height:1.5;margin-top:4px}}
.svc{{position:absolute;top:120mm;left:0;right:0;background:{CHAR};color:#fff;padding:10mm 21mm}}
.svc h2{{font-family:'Montserrat',sans-serif;font-size:12pt;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}}
.svc h2 .g{{color:{GOLD}}}
.sl{{display:flex;flex-wrap:wrap;gap:6px 22px}}
.sl div{{font-family:'Montserrat',sans-serif;font-size:9pt;color:#dcdcdc;width:45%}}
.sl div::before{{content:"\\2014  ";color:{GOLD}}}
.ph{{position:absolute;top:168mm;left:21mm;right:21mm;display:flex;gap:4mm}}
.ph figure{{flex:1;display:flex;flex-direction:column}}
.ph img{{width:100%;height:62mm;object-fit:cover;border-radius:4px}}
.ph figcaption{{font-family:'Montserrat',sans-serif;font-size:7.5pt;color:#666;margin-top:5px;text-transform:uppercase;letter-spacing:.4px}}
.fband2{{position:absolute;bottom:0;left:0;right:0;background:{BLACK};color:#c9c9cc;padding:8mm 21mm;display:flex;justify-content:space-between;align-items:center}}
</style></head><body>"""

def front_html(L):
    addr = "<br>".join(esc(x) for x in L['addr'])
    body = "\n".join(f"<p>{esc(p)}</p>" for p in L['body'])
    return HEAD + f"""<div class="canvas">
      <div class="hband"></div>
      <img class="logo" src="{A['logo']}">
      <div class="hc"><b>07426 953891</b><br>info@kapwoodworkandbuilding.co.uk<br>kapwoodworkandbuilding.co.uk<br>30 Oakwood, Broadmayne, DT2 8UN</div>
      <div class="abox">{esc(L['name'])}<br>{addr}</div>
      <div class="date">{DATESTR}</div>
      <div class="main"><div class="greet">Dear Homeowner,</div>{body}
        <div class="sign">Kind regards,<div class="n">Mark Storey</div><div class="r">KAP Woodwork &amp; Building Services</div></div>
      </div>
      <div class="fband"></div>
      <div class="fin">
        <div class="fa"><span class="l">Building better spaces for Dorset homes</span><br>30 Oakwood, Broadmayne, Dorchester, Dorset DT2 8UN<br>info@kapwoodworkandbuilding.co.uk &middot; kapwoodworkandbuilding.co.uk</div>
        <div class="fb"><div class="tile"><img src="{A['qrw']}"><span>OUR WORK</span></div><div class="tile"><img src="{A['qrf']}"><span>FACEBOOK</span></div><div class="tile fsb"><img src="{A['fsb']}"></div></div>
      </div>
    </div></body></html>"""

def back_html():
    return HEAD + f"""<div class="canvas">
      <div class="hero"><div class="e">KAP Woodwork &amp; Building Services</div>
        <h1>Building better spaces<br>for Dorset homes.</h1>
        <p>From extensions and loft conversions to bespoke joinery and complete garden transformations, we deliver high-quality workmanship with a personal, reliable service \u2014 craft-led, tidy, and clear from day one.</p></div>
      <div class="prom">
        <div><h3>Experience</h3><div class="big">30+ years</div><p>Combined experience in extensions, carpentry and landscaping across Dorset.</p></div>
        <div><h3>A local team</h3><div class="big">Family-run</div><p>An approachable local team \u2014 not a faceless firm. Integrity and clear communication throughout.</p></div>
        <div><h3>Something special</h3><div class="big">Garden design</div><p>Partnered with a Chelsea Flower Show designer for bespoke garden rooms and landscaping.</p></div>
      </div>
      <div class="svc"><h2>What we <span class="g">do</span></h2>
        <div class="sl"><div>House extensions &amp; structural work</div><div>Loft &amp; roof conversions</div><div>Bespoke joinery &amp; carpentry</div><div>Kitchens &amp; interior fit-out</div><div>Garden rooms &amp; outbuildings</div><div>Landscaping &amp; garden design</div></div></div>
      <div class="ph">
        <figure><img src="{A['ext']}"><figcaption>Extension &amp; bi-folds</figcaption></figure>
        <figure><img src="{A['kit']}"><figcaption>Bespoke fitted kitchen</figcaption></figure>
        <figure><img src="{A['gar']}"><figcaption>Garden room</figcaption></figure></div>
      <div class="fband2"><div class="fa"><span class="l">Get in touch for a no-obligation chat</span><br>07426 953891 &middot; info@kapwoodworkandbuilding.co.uk</div><div class="fb"><div class="tile fsb"><img src="{A['fsb']}"></div></div></div>
    </div></body></html>"""

def render(html, out):
    hp=out+'.html'; open(hp,'w').write(html)
    subprocess.run(["wkhtmltopdf","--page-width","216mm","--page-height","303mm",
        "-T","0","-B","0","-L","0","-R","0","--dpi","96","--disable-smart-shrinking",
        "--enable-local-file-access","--print-media-type","-q",hp,out],check=True)

os.makedirs('batch2', exist_ok=True)
# back page identical for all -> render once
render(back_html(), 'batch2/_back.pdf')
assert len(PdfReader('batch2/_back.pdf').pages)==1, "back overflowed!"

def slug(r): return r.replace('/','_')
letters=[]
for L in LEADS:
    fp=f"batch2/_front_{slug(L['ref'])}.pdf"
    render(front_html(L), fp)
    assert len(PdfReader(fp).pages)==1, f"front overflow {L['ref']}"
    # merge front + back
    w=PdfWriter()
    w.add_page(PdfReader(fp).pages[0])
    w.add_page(PdfReader('batch2/_back.pdf').pages[0])
    out=f"batch2/KAP_{slug(L['ref'])}.pdf"
    with open(out,'wb') as f: w.write(f)
    letters.append(out)
    print("built", out, "(2 pages)")

# combined proof
w=PdfWriter()
for p in letters:
    for pg in PdfReader(p).pages: w.add_page(pg)
with open('/mnt/user-data/outputs/KAP_letters_batch_ALL.pdf','wb') as f: w.write(f)
print("proof pages:", len(letters)*2)
