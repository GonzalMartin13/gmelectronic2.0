import {apiGet,hasPrice} from './catalog.mjs';

export const FEATURED_REVISION='2026-11-18-static';
export const FEATURED_LIST_DATE='2026-11-13';
export const FEATURED_BOARDS=[
 {id:'carga',brand:'KOSMO · SOUL · NOGA',title:'Cargá a tu manera',description:'USB, carga rápida e inalámbrica Qi.',poster:'/promos/carga-20261118.webp',items:[
  {code:'2218',label:'Kosmo 2A · USB',note:'Económico · sin cable',posterPrice:2967},
  {code:'4507',label:'Soul PD 20 W · USB-C',note:'Carga rápida · sin cable',posterPrice:5954},
  {code:'1986',label:'Noga NG-Q05 · Qi',note:'Inalámbrico · para equipos Qi',posterPrice:8255}
 ]},
 {id:'netmak-bluetooth',brand:'NETMAK',title:'Netmak, sin cables',description:'Tres opciones de auriculares Bluetooth.',poster:'/promos/netmak-bluetooth-20261118.webp',items:[
  {code:'7014',label:'Netmak NM-MELOW',note:'Azul · Bluetooth 5.3',posterPrice:13010},
  {code:'7019',label:'Netmak NM-BIZA',note:'Azul · display de batería',posterPrice:15902},
  {code:'7022',label:'Netmak NM-SMART',note:'Pantalla táctil · ANC',posterPrice:21684}
 ]},
 {id:'parlantes',brand:'NOGA · NETMAK · JBL',title:'Parlantes para llevar',description:'Tres parlantes portátiles para elegir.',poster:'/promos/parlantes-20261118.webp',items:[
  {code:'1138',label:'Noga Pocket NG-PK08',note:'Azul · Bluetooth',posterPrice:10098},
  {code:'7053',label:'Netmak NM-MUV',note:'Gris · Bluetooth · RGB',posterPrice:14456},
  {code:'3031',label:'JBL GO Essential 2',note:'Rojo · Bluetooth',posterPrice:60987}
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
