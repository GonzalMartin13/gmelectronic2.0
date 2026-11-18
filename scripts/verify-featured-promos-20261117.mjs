import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {FEATURED_BOARDS,loadFeaturedRows} from '../src/featured-promos.mjs';
import {API_BASE,formatARS} from '../src/catalog.mjs';
const site=process.env.FEATURED_SITE||'http://127.0.0.1:4173',mode=process.env.FEATURED_SITE?'public':'preview',folder='qa/featured-promos-20261117';
fs.mkdirSync(folder,{recursive:true});assert.equal(FEATURED_BOARDS.length,3);
const items=FEATURED_BOARDS.flatMap(b=>b.items),fixtures=new Map();
await Promise.all(items.map(async item=>{
 const response=await fetch(API_BASE+'/api/v1/products?'+new URLSearchParams({q:item.code,limit:'1',page:'1',availability:'available'}),{signal:AbortSignal.timeout(90000)});
 assert(response.ok);const data=await response.json();fixtures.set(item.code,data);
 const p=data.data.find(p=>p.variantes.some(v=>v.codigo===item.code)),v=p?.variantes.find(v=>v.codigo===item.code);
 assert(v?.stock_disponible===true&&v.precio_pesos>0,item.code);assert(v.imagenes?.[0]||p.imagen,'Missing photo '+item.code);
}));
const request=async path=>structuredClone(fixtures.get(new URL(path,API_BASE).searchParams.get('q')));
for(const board of FEATURED_BOARDS)assert.equal((await loadFeaturedRows(board,{request})).length,3);
const omit=new Set(['2218','7014','4500']);
const withdrawn=async path=>{
 const code=new URL(path,API_BASE).searchParams.get('q'),data=await request(path);
 if(code==='4500')data.data=[];
 for(const p of data.data)for(const v of p.variantes){if(v.codigo==='2218')v.stock_disponible=false;if(v.codigo==='7014')v.precio_pesos=null;}
 return data;
};
for(const board of FEATURED_BOARDS)assert.deepEqual((await loadFeaturedRows(board,{request:withdrawn})).map(x=>x.code),board.items.filter(x=>!omit.has(x.code)).map(x=>x.code));
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];let mutations=0,simulate=false;
page.on('pageerror',e=>errors.push(e.message));
await page.route(API_BASE+'/**',async route=>{
 if(route.request().method()!=='GET'){mutations++;return route.abort();}
 if(mode==='public')return route.continue();
 const url=new URL(route.request().url()),code=url.searchParams.get('q');
 if(url.pathname==='/api/v1/products'&&fixtures.has(code))return route.fulfill({json:simulate?await withdrawn(url.pathname+url.search):fixtures.get(code),headers:{'access-control-allow-origin':'*'}});
 const response=await fetch(url,{signal:AbortSignal.timeout(90000)});
 return route.fulfill({status:response.status,body:await response.text(),contentType:'application/json',headers:{'access-control-allow-origin':'*'}});
});
try{
 for(let attempt=0;attempt<18;attempt++){
  await page.goto(site+'/#destacados',{waitUntil:'domcontentloaded'});
  try{await page.locator('[data-featured-revision="2026-11-17"]').waitFor({timeout:10000});break;}catch(e){if(mode==='preview'||attempt===17)throw e;}
 }
 const tiles=page.locator('[data-featured-code]');
 await page.waitForFunction(()=>document.querySelectorAll('[data-featured-code]').length===9,null,{timeout:120000});
 assert.equal(await page.locator('[data-featured-board]').count(),3);
 const prices=[];
 for(const item of items){
  const tile=page.locator('[data-featured-code="'+item.code+'"]'),variant=fixtures.get(item.code).data.flatMap(p=>p.variantes).find(v=>v.codigo===item.code);
  const price=await tile.locator('.live-promo-price').innerText();assert.equal(price,formatARS(variant.precio_pesos));
  await tile.scrollIntoViewIfNeeded();await tile.locator('img').evaluate(async img=>{await img.decode();if(!img.naturalWidth)throw Error('Broken photo');});
  prices.push({code:item.code,price,date:variant.fecha_lista});
 }
 async function layout(label){
  await page.locator('#destacados').scrollIntoViewIfNeeded();
  const geometry=await tiles.evaluateAll(nodes=>nodes.map(n=>{const row=n.getBoundingClientRect(),price=n.querySelector('.live-promo-price').getBoundingClientRect();return {code:n.dataset.featuredCode,rowRight:row.right,priceRight:price.right};}));
  for(const g of geometry)assert(g.priceRight<=g.rowRight+1,label+' clipped '+g.code);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),label+' horizontal overflow');
  await page.locator('#destacados').screenshot({path:folder+'/'+mode+'-'+label+'.png'});return geometry;
 }
 const desktop=await layout('desktop');await page.setViewportSize({width:390,height:844});const mobile=await layout('mobile');
 await page.locator('[data-featured-code="7019"]').click();await page.getByRole('dialog').waitFor();assert((await page.getByRole('dialog').innerText()).includes('Código: 7019'));await page.getByRole('button',{name:'Cerrar',exact:true}).click();
 if(mode==='preview'){simulate=true;await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('[data-featured-code]').length===6,null,{timeout:120000});for(const code of omit)assert.equal(await page.locator('[data-featured-code="'+code+'"]').count(),0);}
 assert.equal(mutations,0);assert.deepEqual(errors,[]);
 const report={status:'passed',site,boards:3,products:prices,desktop,mobile,withdrawal:mode==='preview'?'verified: no stock, missing price, removed SKU':'verified in preview',mutations,errors};
 fs.writeFileSync(folder+'/'+mode+'-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
