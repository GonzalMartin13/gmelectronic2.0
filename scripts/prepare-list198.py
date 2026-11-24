"""Retrieve and check the authorized commercial PDF and the public API snapshot."""
import hashlib,json,re,sys,time,urllib.request
from pathlib import Path
import fitz
import requests
ROOT=Path(__file__).resolve().parents[1]
source=json.loads((ROOT/'catalog/source-20261124.json').read_text())
expected={r['code'].zfill(4):r for r in source['rows']}
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'GM-Catalog-QA/198','Cache-Control':'no-cache'})
 with urllib.request.urlopen(req,timeout=65) as r:return r.read(),dict(r.headers)
def api():
 url='https://gm-electronics-api.onrender.com/api/v1/products?limit=100&page='
 first=json.loads(get(url+'1')[0]);products=list(first['data'])
 for page in range(2,first['pagination']['pages']+1):products.extend(json.loads(get(url+str(page))[0])['data'])
 assert len(products)==source['products']==first['pagination']['total']
 variants={v['codigo']:v for p in products for v in p['variantes']}
 assert len(variants)==len(expected)==701 and set(variants)==set(expected)
 for c,v in variants.items():
  e=expected[c];assert float(v['precio_pesos'])==float(e['price_ars']),(c,'ARS');assert float(v['precio_usd'])==float(e['price_usd']),(c,'USD');assert v['stock_disponible'] is e['available'],(c,'stock');assert v['fecha_lista']=='2026-11-23'
 assert sum(v['stock_disponible'] is True for v in variants.values())==584
 for code in ['7064','7065','4525','4526','4527','2362']:
  assert variants[code]['imagenes'],('missing photo',code)
  data,headers=get(variants[code]['imagenes'][0]);assert data and headers.get('Content-Type','').startswith('image/')
 return products
def pdf_check(data):
 assert data.startswith(b'%PDF-') and len(data)==source['pdf_bytes']
 assert hashlib.sha256(data).hexdigest()==source['pdf_sha256']
 doc=fitz.open(stream=data,filetype='pdf');codes=[];prices=[]
 for p in doc:
  text=p.get_text();found=re.findall(r'C[oó]d[.:\s]*([0-9]{1,4})',text,re.I);assert len(found)<=16
  codes.extend(c.zfill(4) for c in found);prices.extend(int(x.replace('.','')) for x in re.findall(r'\$\s*([\d.]+)',text))
 assert len(doc)==42 and len(codes)==len(set(codes))==584
 assert set(codes)=={c for c,r in expected.items() if r['available']}
 assert len(prices)==len(codes) and all(p==float(expected[c]['price_ars']) for c,p in zip(codes,prices))
 return {'pdf_pages':42,'pdf_codes':584,'sha256':source['pdf_sha256'],'bytes':len(data)}
def prepare():
 session=requests.Session()
 urls=['https://drive.usercontent.google.com/download?id=17gWIAFsr9DP608ZEzF3JTSw4nQcr-ywK&export=download&confirm=t','https://drive.google.com/uc?export=download&id=17gWIAFsr9DP608ZEzF3JTSw4nQcr-ywK&confirm=t']
 errors=[]
 for url in urls:
  try:
   response=session.get(url,timeout=100);response.raise_for_status();data=response.content;report=pdf_check(data);break
  except Exception as e:errors.append(str(e))
 else:raise RuntimeError('Commercial PDF download failed: '+repr(errors))
 products=api();(ROOT/'public'/source['pdf_filename']).write_bytes(data)
 # Exact public API export; this snapshot does not replace the live database.
 for path in ['public/productos.json','src/data/productos.json']:
  dest=ROOT/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(products,ensure_ascii=False,separators=(',',':')))
 report.update(task='TAR-0044',api_products=len(products),api_codes=701,price_stock_mismatches=0,list_date='2026-11-23',new_images_http=6)
 target=ROOT/'catalog/qa-20261124';target.mkdir(exist_ok=True);(target/'audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
def public():
 origin='https://gmelectronic2-0.vercel.app'
 for attempt in range(24):
  try:
   data,headers=get(origin+'/'+source['pdf_filename']);report=pdf_check(data);assert 'application/pdf' in headers.get('Content-Type','')
   html=get(origin+'/?list=198')[0].decode();scripts=re.findall(r'<script[^>]+src="([^"]+)"',html);bundles=[get(origin+x if x.startswith('/') else x)[0].decode() for x in scripts]
   assert any(source['pdf_filename'] in x and '2026-11-24-list198' in x for x in bundles),'Website update not live yet'
   export=json.loads(get(origin+'/productos.json')[0]);assert len(export)==602
   report.update(api_products=len(api()),api_codes=701,price_stock_mismatches=0,public_pdf_http=200,public_site=origin,verified=True)
   print(json.dumps(report),flush=True);return
  except Exception as e:
   print(json.dumps({'attempt':attempt+1,'pending':str(e)}),flush=True)
   if attempt==23:raise
   time.sleep(15)
if __name__=='__main__':public() if '--public' in sys.argv else prepare()
