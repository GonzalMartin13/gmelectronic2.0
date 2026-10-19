import assert from 'node:assert/strict';
const site='https://gmelectronic2-0.vercel.app',api='https://gm-electronics-api.onrender.com';
async function get(base,path){const response=await fetch(base+path,{signal:AbortSignal.timeout(25000)});assert.equal(response.status,200,path);return response.json()}
const ready=await get(api,'/ready');assert.equal(ready.productos,717);assert.equal(ready.variantes,861);
const result=await get(api,'/api/v1/products?q=0223');assert.equal(result.pagination.total,1);const variant=result.data[0].variantes.find(v=>v.codigo==='0223');assert.ok(variant);
const response=await fetch(api+'/api/v1/orders/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variant_id:variant.api_id,quantity:3}],invoice:true}),signal:AbortSignal.timeout(25000)});assert.equal(response.status,200);const {data:quote}=await response.json();assert.equal(Number(quote.subtotal),47433);assert.equal(Number(quote.iva),9960.93);assert.equal(Number(quote.total),57393.93);
const email=await get(site,'/api/email-status');assert.equal(email.available,true);
for(const path of ['/favicon.svg','/robots.txt','/sitemap.xml','/hero-tech.jpg','/Catalogo_GM_Electronics_4x4.pdf']){const r=await fetch(site+path,{method:'HEAD',signal:AbortSignal.timeout(25000)});assert.equal(r.status,200,path)}
const indexResponse=await fetch(site,{signal:AbortSignal.timeout(25000)});assert.equal(indexResponse.status,200);const html=await indexResponse.text();assert.match(html,/rel="canonical"/);assert.match(html,/hero-tech[.]jpg/);assert.match(html,/og:title/);
console.log(JSON.stringify({status:'PASS',products:ready.productos,variants:ready.variantes,exact_code:'0223',quote:{subtotal:quote.subtotal,iva:quote.iva,total:quote.total},email_configured:email.available,public_assets:'OK',sharing_metadata:'OK',orders_created:0}));

