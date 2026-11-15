"""Read-only public download and catalog verification after deployment."""
import hashlib,json,re,time,urllib.request
from pathlib import Path
import fitz

root=Path(__file__).resolve().parents[1]
audit=json.loads((root/"catalog/qa-20261115/audit.json").read_text())
source=json.loads((root/"catalog/source-20261115.json").read_text())
origin="https://gmelectronic2-0.vercel.app"
filename="Catalogo_GM_Electronics_4x4_15Nov2026_Stock.pdf"
def get(url):
 req=urllib.request.Request(url,headers={"User-Agent":"GM-Catalog-Verification/1.0","Cache-Control":"no-cache"})
 with urllib.request.urlopen(req,timeout=65) as r: return r.read(),dict(r.headers),r.status
errors=[]
for attempt in range(18):
 try:
  html,_,status=get(origin+"/?catalog_revision=20261115")
  assert status==200
  script_urls=re.findall(r'<script[^>]+src="([^"]+)"',html.decode())
  assert script_urls
  scripts=[get(origin+url if url.startswith("/") else url)[0].decode() for url in script_urls]
  assert any(filename in js and "15/11/2026" in js for js in scripts),"New download link not deployed yet"
  pdf,headers,status=get(origin+"/"+filename)
  assert status==200 and pdf.startswith(b"%PDF-")
  assert "application/pdf" in (headers.get("Content-Type") or headers.get("content-type") or "")
  assert len(pdf)==audit["bytes"]
  assert hashlib.sha256(pdf).hexdigest()==audit["sha256"]
  checked=fitz.open(stream=pdf,filetype="pdf")
  codes=[c.zfill(4) for p in checked for c in re.findall(r"C[oó]d[.:\s]*([0-9]{1,4})",p.get_text(),re.I)]
  expected={str(int(r["code"])).zfill(4) for r in source["rows"] if r["available"] is True}
  assert len(codes)==len(set(codes))==594 and set(codes)==expected
  break
 except Exception as e:
  errors.append(str(e))
  print(json.dumps({"attempt":attempt+1,"pending":str(e)}),flush=True)
  if attempt==17: raise
  time.sleep(15)
api="https://gm-electronics-api.onrender.com/api/v1/products"
def api_json(query): return json.loads(get(api+query)[0])
first=api_json("?limit=100&page=1")
all_products=list(first["data"])
for page in range(2,first["pagination"]["pages"]+1): all_products.extend(api_json(f"?limit=100&page={page}")["data"])
variants={str(int(v["codigo"])).zfill(4):v for p in all_products for v in p["variantes"]}
assert len(all_products)==first["pagination"]["total"]==586
expected_all={str(int(r["code"])).zfill(4):r for r in source["rows"]}
assert len(variants)==685 and set(variants)==set(expected_all)
assert all(v["stock_disponible"] is expected_all[c]["available"] for c,v in variants.items())
assert all(float(v["precio_pesos"])==float(expected_all[c]["price_ars"]) for c,v in variants.items())
absent=api_json("?limit=16&page=1&q=1569")
assert absent["pagination"]["total"]==0 and absent["data"]==[]
present=api_json("?limit=16&page=1&q=2362")
assert any("ADAPTADOR" in p["nombre"].upper() for p in present["data"])
print(json.dumps({"task":"TAR-0037","public_site":origin,"download":origin+"/"+filename,"download_status":200,"download_bytes":len(pdf),"download_sha256":audit["sha256"],"pdf_pages":len(checked),"pdf_codes":len(codes),"api_products":len(all_products),"api_codes":len(variants),"price_and_stock_mismatches":0,"retired_1569_results":0,"corrected_2362":True,"verification":"passed","visual_browser_verification":False}),flush=True)
