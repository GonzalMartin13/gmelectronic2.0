import {apiGet,hasPrice} from './catalog.mjs';

export const FEATURED_REVISION='2026-11-17';
export const FEATURED_BOARDS=[
 {id:'carga',brand:'KOSMO · SOUL · NOGA',title:'Cargá a tu manera',description:'USB, carga rápida e inalámbrica Qi.',items:[
  {code:'2218',label:'Kosmo 2A · USB',note:'Económico · sin cable'},
  {code:'4507',label:'Soul PD 20 W · USB-C',note:'Carga rápida · sin cable'},
  {code:'1986',label:'Noga NG-Q05 · Qi',note:'Inalámbrico · para equipos Qi'}
 ]},
 {id:'netmak-bluetooth',brand:'NETMAK',title:'Netmak, sin cables',description:'Tres opciones de auriculares Bluetooth.',items:[
  {code:'7014',label:'Netmak NM-MELOW',note:'Azul · Bluetooth 5.3'},
  {code:'7019',label:'Netmak NM-BIZA',note:'Azul · display de batería'},
  {code:'7022',label:'Netmak NM-SMART',note:'Pantalla táctil · ANC'}
 ]},
 {id:'audio-diario',brand:'NOGA · SOUL',title:'Audio para llevar',description:'Parlante portátil y auriculares con cable.',items:[
  {code:'1138',label:'Parlante Noga Pocket',note:'Azul · Bluetooth · NG-PK08'},
  {code:'1702',label:'Noga NG-1650 · 3,5 mm',note:'Blanco · con micrófono'},
  {code:'4500',label:'Soul MLS-S389 · USB-C',note:'Negro · con micrófono'}
 ]}
];

// Fetch exact supplier codes. Never infer stock from another color/variant.
export async function loadFeaturedRows(board,{signal,request=apiGet}={}){
 const matches=await Promise.all(board.items.map(async item=>{
  const params=new URLSearchParams({q:item.code,limit:'1',page:'1',availability:'available'});
  const response=await request('/api/v1/products?'+params,{signal});
  const product=response.data?.find(p=>p.variantes?.some(v=>v.codigo===item.code));
  const variant=product?.variantes.find(v=>v.codigo===item.code);
  if(!product||variant?.stock_disponible!==true||!hasPrice(variant.precio_pesos))return null;
  return {...item,product,variant};
 }));
 return matches.filter(Boolean);
}
