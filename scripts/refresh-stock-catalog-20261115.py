"""Rebuild the approved stock catalog from the verified commercial snapshot.
No database writes or imports. Preserve every approved page, photo and card.
"""
import base64, hashlib, json, re, time
from pathlib import Path
import fitz
import requests
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"public"/"Catalogo_GM_Electronics_4x4_15Nov2026_Stock.pdf"
QA=ROOT/"catalog"/"qa-20261115"
QA.mkdir(parents=True,exist_ok=True)
source=json.loads((ROOT/"catalog/source-20261115.json").read_text())
wanted={str(int(r["code"])).zfill(4):r for r in source["rows"] if r["available"] is True}
assert len(wanted)==594 and "1569" not in wanted and "7064" not in wanted
assert all(float(r["price_ars"])>0 for r in wanted.values())
urls=[
 "https://drive.usercontent.google.com/download?id=17gWIAFsr9DP608ZEzF3JTSw4nQcr-ywK&export=download&authuser=0&confirm=t",
 "https://drive.google.com/uc?export=download&id=17gWIAFsr9DP608ZEzF3JTSw4nQcr-ywK",
]
reference=None
errors=[]
for url in urls:
 try:
  r=requests.get(url,timeout=120)
  r.raise_for_status()
  if r.content.startswith(b"%PDF-"):
   reference=r.content
   break
  errors.append(f"Non-PDF response: {r.status_code}")
 except Exception as e:
  errors.append(str(e))
assert reference is not None, errors
assert hashlib.sha256(reference).hexdigest()=="15056ac867ba45c3cabc46d4ae23290417228924981c33d5f53bd6b7fb582b41","Reference changed; review before editing"
doc=fitz.open(stream=reference,filetype="pdf")
assert len(doc)==41
def spans(page):
 return [s for b in page.get_text("dict")["blocks"] if b["type"]==0 for l in b["lines"] for s in l["spans"]]
def money(n):
 n=float(n)
 return "$ "+format(int(n),",").replace(",",".") if n.is_integer() else "$ "+format(n,",.2f").replace(",","X").replace(".",",").replace("X",".")
def rgb(n):
 return ((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)
def entries(page):
 found=[]
 lines=[l for b in page.get_text("dict")["blocks"] if b["type"]==0 for l in b["lines"]]
 for line in lines:
  text="".join(s["text"] for s in line["spans"])
  match=re.search(r"C[oó]d[.:\s]*([0-9]{1,4})",text,re.I)
  if not match: continue
  code=match.group(1).zfill(4)
  rect=fitz.Rect(line["bbox"])
  candidates=[]
  for other in lines:
   ot="".join(s["text"] for s in other["spans"])
   ob=fitz.Rect(other["bbox"])
   if re.match(r"^\s*\$\s*[\d.,]+",ot) and abs(ob.x0-rect.x0)<15 and 0<ob.y0-rect.y0<40:
    candidates.append((ob.y0,other))
  assert candidates,("price missing",code,page.number)
  price_line=min(candidates,key=lambda x:x[0])[1]
  ps=price_line["spans"][0]
  price_text="".join(s["text"] for s in price_line["spans"])
  price=float(re.sub(r"[^\d,]","",price_text).replace(",","."))
  found.append({"code":code,"bbox":list(rect),"price":price,"price_span":ps,"code_span":line["spans"][0]})
 return found
before=[dict(e,page=p.number+1) for p in doc for e in entries(p)]
assert len(before)==593 and len({e["code"] for e in before})==593
assert not ({e["code"] for e in before}-set(wanted)),"Reference contains retired/unavailable codes"
missing=set(wanted)-{e["code"] for e in before}
assert missing=={"2362"},missing
mismatched=[e for e in before if e["price"]!=float(wanted[e["code"]]["price_ars"])]
assert not mismatched,("Unexpected price changes require explicit regenerated cards",mismatched)
p0=doc[0]
ss=spans(p0)
first=before[0]
code_span=first["code_span"]
price_span=first["price_span"]
codes0=entries(p0)
first_code_rect=fitz.Rect(first["bbox"])
next_row_y=min(e["bbox"][1] for e in codes0 if e["bbox"][1]>first_code_rect.y0+10)
row_step=next_row_y-first_code_rect.y0
columns=sorted({round(e["bbox"][0],2) for e in codes0})
col_step=columns[1]-columns[0]
name_spans=[s for s in ss if first_code_rect.x0-2<=s["bbox"][0]<first_code_rect.x0+col_step-8 and 55<s["bbox"][1]<first_code_rect.y0]
assert name_spans
# Titles in a card share the smallest upper Y after the supplier header.
name_spans=[s for s in name_spans if "Lista 190" not in s["text"]]
name_span=min(name_spans,key=lambda s:s["bbox"][1])
heading=next(s for s in ss if s["text"].strip()=="NOGA")
footer=next(s for s in ss if "WhatsApp" in s["text"])
number=next(s for s in ss if re.fullmatch(r"\s*1\s*/\s*41\s*",s["text"]))
width,height=p0.rect.width,p0.rect.height
layout={"width":width,"height":height,"row_step":row_step,"column_step":col_step,"name_span":name_span,"code_span":code_span,"price_span":price_span,"heading":heading,"footer":footer,"page_number":number}
# Use an empty slot in OTRAS MARCAS, preserving all 41 approved pages.
candidates=[p.number for p in doc if "OTRAS MARCAS" in p.get_text() and len(entries(p))<16]
assert candidates,"No empty slot in the approved unbranded section"
last=doc[candidates[-1]]
slot=len(entries(last))
dx=(slot%4)*col_step
dy=(slot//4)*row_step
def shifted(span):
 s=dict(span)
 s["origin"]=(span["origin"][0]+dx,span["origin"][1]+dy)
 box=span["bbox"]
 s["bbox"]=(box[0]+dx,box[1]+dy,box[2]+dx,box[3]+dy)
 return s
code_span=shifted(code_span)
price_span=shifted(price_span)
name_span=shifted(name_span)
first_code_rect=fitz.Rect(shifted(first["code_span"])["bbox"])
# Rebuild the new first card using the approved text positions, sizes and colors.
def insert_at_span(page,span,text,font="hebo"):
 page.insert_text(span["origin"],text,fontname=font,fontsize=span["size"],color=rgb(span["color"]))
r=wanted["2362"]
card_left=first_code_rect.x0-5
card_top=name_span["bbox"][1]-5
card_width=col_step-6
card_bottom=first_code_rect.y0+price_span["bbox"][3]-first_code_rect.y0+5
card=fitz.Rect(card_left,card_top,card_left+card_width,card_bottom)
# Find the original card border color / fill where available.
frames=[d for d in p0.get_drawings() if d["rect"].contains(fitz.Rect(first["bbox"])) and d["rect"].width<col_step+10 and d["rect"].height<row_step+10]
frame=min(frames,key=lambda d:d["rect"].width*d["rect"].height) if frames else None
if frame:
 card=frame["rect"]+fitz.Rect(dx,dy,dx,dy)
 last.draw_rect(card,color=frame.get("color") or (.82,.85,.88),fill=frame.get("fill"),width=frame.get("width") or .6,overlay=True)
else:
 last.draw_rect(card,color=(.82,.85,.88),width=.6,overlay=True)
# Fit the verified full supplier title without truncation.
font_size=name_span["size"]
title_rect=fitz.Rect(name_span["bbox"][0],name_span["bbox"][1]-1,card.x1-5,name_span["bbox"][1]+42)
while font_size>=5:
 result=last.insert_textbox(title_rect,r["name"],fontname="hebo",fontsize=font_size,color=rgb(name_span["color"]),lineheight=1.15)
 if result>=0: break
 font_size-=.25
assert result>=0
photo_note_y=(title_rect.y1+first_code_rect.y0)/2
last.insert_text((card.x0+8,photo_note_y),"Imagen no disponible",fontname="helv",fontsize=6,color=(.45,.49,.54))
insert_at_span(last,code_span,"Cód. 2362")
insert_at_span(last,price_span,money(r["price_ars"]),"hebo")
total=len(doc)
for i in range(total):
 page=doc[i]
 page.insert_text((15,height-5),"Actualizado 15/11/2026 · 594 códigos con stock",fontname="helv",fontsize=5,color=(.35,.4,.45))
doc.set_metadata({"title":"GM Electronics · Catálogo mayorista 4×4 · 15/11/2026","author":"GM Electronics","subject":"Lista Fastec 190 · 594 códigos disponibles · revisión TAR-0037","keywords":"GM Electronics,Fastec,Lista190,stock,15Nov2026"})
final=doc.tobytes(garbage=4,deflate=True,ascii=True)
# ASCII streams permit supported host text writes without altering PDF byte offsets.
head_end=final.index(b"\n",final.index(b"\n")+1)
final=bytes((x if x<128 else 65) for x in final[:head_end])+final[head_end:]
assert max(final)<128,"Non-ASCII PDF bytes remain"
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_bytes(final)
check=fitz.open(OUT)
after=[dict(e,page=p.number+1) for p in check for e in entries(p)]
assert len(after)==len(wanted)==len({e["code"] for e in after})
assert {e["code"] for e in after}==set(wanted)
assert all(e["price"]==float(wanted[e["code"]]["price_ars"]) for e in after)
assert all("1569"!=e["code"] and "7064"!=e["code"] for e in after)
assert len(check)==41 and all(len(entries(p))<=16 for p in check)
# Ensure all previously approved photos survive.
def images_count(pdf): return sum(len(p.get_images()) for p in pdf)
assert images_count(check)>=images_count(fitz.open(stream=reference,filetype="pdf"))
report={"task":"TAR-0037","date":"2026-11-15","source_batch":source["batch_id"],"source_document_date":"2026-11-13","reference_sha256":hashlib.sha256(reference).hexdigest(),"sha256":hashlib.sha256(final).hexdigest(),"bytes":len(final),"pages":len(check),"codes":len(after),"prices_verified":len(after),"unavailable_codes":0,"retired_codes":0,"code1569":False,"code7064":False,"added_codes":["2362"],"missing_photos":["2362"],"unchanged_reference_prices":len(before),"ascii_pdf":True,"layout":layout,"entries":[{"code":e["code"],"price":e["price"],"page":e["page"]} for e in after]}
(QA/"audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
# QA previews only; never included in the public site's source tree.
previews=[]
for page_num in [0,22,38]:
 pix=check[page_num].get_pixmap(matrix=fitz.Matrix(1.3,1.3),alpha=False)
 path=QA/f"page-{page_num+1}.jpg"
 pix.save(path,jpg_quality=80)
 previews.append(path.name)
thumbs=[]
for page in check:
 pix=page.get_pixmap(matrix=fitz.Matrix(.24,.24),alpha=False)
 image=Image.frombytes("RGB",(pix.width,pix.height),pix.samples)
 thumbs.append(image)
tw=max(im.width for im in thumbs); th=max(im.height for im in thumbs)
contact=Image.new("RGB",(tw*6,th*((len(thumbs)+5)//6)),(225,228,233))
for i,im in enumerate(thumbs): contact.paste(im,((i%6)*tw,(i//6)*th))
contact.save(QA/"contact.jpg",quality=86)
chunkdir=QA/"pdf-chunks"
chunkdir.mkdir(exist_ok=True)
text=final.decode("ascii")
chunks=[]
for i,start in enumerate(range(0,len(text),350000)):
 name=f"{i:03}.txt"
 (chunkdir/name).write_text(text[start:start+350000],encoding="ascii",newline="")
 chunks.append(name)
(QA/"transfer.json").write_text(json.dumps({"chunks":chunks,"bytes":len(final),"sha256":report["sha256"]}))
print(json.dumps({k:v for k,v in report.items() if k not in ("entries","layout")},ensure_ascii=False))
