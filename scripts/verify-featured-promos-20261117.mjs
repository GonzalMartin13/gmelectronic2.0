import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {FEATURED_BOARDS,FEATURED_REVISION,FEATURED_LIST_DATE,loadFeaturedRows} from '../src/featured-promos.mjs';
import {API_BASE,formatARS} from '../src/catalog.mjs';
const site=process.env.FEATURED_SITE||'http://127.0.0.1:4173',mode=process.env.FEATURED_SITE?'public':'preview',folder='qa/featured-promos-20261118';
fs.mkdirSync(folder,{recursive:true});
assert.equal(FEATURED_BOARDS.length,3);
assert.deepEqual(FEATURED_BOARDS.map(b=>b.id),['carga','netmak-bluetooth','parlantes']);
assert.deepEqual(FEATURED_BOARDS[2].items.map(i=>i.code),['1138','7053','3031']);
const items=FEATURED_BOARDS.flatMap(b=>b.items),fixtures=new Map(),prices=[];
await Promise.all(items.map(async item=>{
 const response=await fetch(API_BASE+'/api/v1/products?'+new URLSearchParams({q:item.code,limit:'1',page:'1'}),{signal:AbortSignal.timeout(90000)});
 assert(response.ok);const data=await response.json();fixtures.set(item.code,data);
 const p=data.data.find(p=>p.variantes.some(v=>v.codigo===item.code)),v=p?.variantes.find(v=>v.codigo===item.code);
 assert(v?.precio_pesos>0,item.code); assert.equal(v.stock_disponible,item.available,'Stock differs '+item.code);
 assert.equal(Number(v.precio_pesos),item.posterPrice,'Poster price differs from source '+item.code);
 assert.equal(v.fecha_lista,FEATURED_LIST_DATE);
 prices.push({code:item.code,price:Number(v.precio_pesos),date:v.fecha_lista});
}));
const request=async path=>structuredClone(fixtures.get(new URL(path,API_BASE).searchParams.get('q')));
for(const board of FEATURED_BOARDS)assert.equal((await loadFeaturedRows(board,{request})).length,board.items.filter(i=>i.available).length);
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
let featuredQueries=0,mutations=0,blocked=true,scenario='normal';
page.on('pageerror',e=>errors.push(e.message));
await page.route(API_BASE+'/**',async route=>{
 if(route.request().method()!=='GET'){mutations++;return route.abort();}
 const url=new URL(route.request().url()),code=url.searchParams.get('q');
 if(fixtures.has(code)){
  featuredQueries++;
  if(blocked)return route.abort();
  const data=await request(url.pathname+url.search);
  const v=data.data.flatMap(p=>p.variantes).find(v=>v.codigo===code);
  if(scenario==='changed-price')v.precio_pesos=String(Number(v.precio_pesos)+100);
  if(scenario==='no-stock')v.stock_disponible=false;
  if(scenario==='missing-price')v.precio_pesos=null;
  return route.fulfill({json:data,headers:{'access-control-allow-origin':'*'}});
 }
 return route.abort();
});
try{
 for(let attempt=0;attempt<24;attempt++){
  await page.goto(site+'/#destacados',{waitUntil:'domcontentloaded'});
  try{await page.locator('[data-featured-revision="'+FEATURED_REVISION+'"]').waitFor({timeout:10000});break;}catch(e){if(mode==='preview'||attempt===23)throw e;}
 }
 const posters=page.locator('img.featured-poster'),buttons=page.locator('[data-featured-code]');
 assert.equal(await page.locator('[data-featured-board]').count(),3);
 assert.equal(await posters.count(),3);assert.equal(await buttons.count(),9);
 await posters.evaluateAll(async images=>{await Promise.all(images.map(async img=>{await img.decode();if(img.naturalWidth!==720||img.naturalHeight!==960)throw Error('Poster invalid');}));});
 assert.equal(featuredQueries,0,'Promos must render without API queries');
 for(const item of items){const tag=page.locator('[data-current-price="'+item.code+'"]');assert.equal(await tag.locator('strong').innerText(),formatARS(item.posterPrice).replace(/,00$/,''));if(!item.available)assert.equal(await tag.locator('small').innerText(),'Sin stock');assert(await tag.locator('strong').evaluate(el=>el.getBoundingClientRect().right<=el.parentElement.getBoundingClientRect().right+2),'Price overflow '+item.code);}
 const assets=[];
 for(const board of FEATURED_BOARDS){const res=await page.request.get(site+board.poster);assert(res.ok());const bytes=(await res.body()).length;assert(bytes<140000,'Poster too large');assets.push({path:board.poster,bytes});}
 async function layout(label){
  await page.locator('#destacados').scrollIntoViewIfNeeded();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' overflow');
  await page.locator('#destacados').screenshot({path:folder+'/'+mode+'-'+label+'.png'});
 }
 await layout('desktop');await page.setViewportSize({width:390,height:844});await layout('mobile');
 blocked=false;
 await page.locator('[data-featured-code="7019"]').click();
 await page.getByRole('dialog').waitFor();
 assert((await page.getByRole('dialog').innerText()).includes('Código: 7019'));
 await page.getByRole('button',{name:'Cerrar',exact:true}).click();
 scenario='changed-price';
 await page.locator('[data-featured-code="7019"]').click();
 await page.getByRole('dialog').waitFor();
 assert((await page.getByRole('dialog').innerText()).includes(formatARS(FEATURED_BOARDS[1].items.find(i=>i.code==='7019').posterPrice+100)),'Detail must use refreshed price');
 await page.getByRole('button',{name:'Cerrar',exact:true}).click();
 for(const variant of ['no-stock','missing-price']){
  scenario=variant;
  await page.locator('[data-featured-code="3031"]').click();
  await page.locator('[data-featured-board="parlantes"] .featured-poster-status').filter({hasText:'Consultanos por el código 3031'}).waitFor();
  assert.equal(await page.getByRole('dialog').count(),0,'Unorderable variant must not open');
 }
 assert.equal(mutations,0);assert.deepEqual(errors,[]);
 const report={status:'passed',site,revision:FEATURED_REVISION,boards:3,prices,assets,totalPosterBytes:assets.reduce((s,a)=>s+a.bytes,0),offlineBoot:'3 decoded images, zero featured API queries',freshVariant:'7019 exact color; refreshed price checked',availabilityGuards:['no stock','missing price'],mutations,errors};
 fs.writeFileSync(folder+'/'+mode+'-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
