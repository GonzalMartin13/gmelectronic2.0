import {apiGet,hasPrice} from './catalog.mjs';

export const FEATURED_REVISION='2026-11-24-list198';
export const FEATURED_LIST_DATE='2026-11-23';
export const FEATURED_BOARDS=[
 {id:'carga',brand:'KOSMO · SOUL · NOGA',title:'Cargá a tu manera',description:'USB, carga rápida e inalámbrica Qi.',poster:'/promos/carga-20261118.webp',items:[
  {code:'2218',label:'Kosmo 2A · USB',note:'Económico · sin cable',available:true,posterPrice:3099},
  {code:'4507',label:'Soul PD 20 W · USB-C',note:'Carga rápida · sin cable',available:true,posterPrice:6068},
  {code:'1986',label:'Noga NG-Q05 · Qi',note:'Inalámbrico · para equipos Qi',available:true,posterPrice:8420}
 ]},
 {id:'netmak-bluetooth',brand:'NETMAK',title:'Netmak, sin cables',description:'Tres opciones de auriculares Bluetooth.',poster:'/promos/netmak-bluetooth-20261118.webp',items:[
  {code:'7014',label:'Netmak NM-MELOW',note:'Azul · Bluetooth 5.3',available:false,posterPrice:13254},
  {code:'7019',label:'Netmak NM-BIZA',note:'Azul · display de batería',available:true,posterPrice:16200},
  {code:'7022',label:'Netmak NM-SMART',note:'Pantalla táctil · ANC',available:true,posterPrice:22091}
 ]},
 {id:'parlantes',brand:'NOGA · NETMAK · JBL',title:'Parlantes para llevar',description:'Tres parlantes portátiles para elegir.',poster:'/promos/parlantes-20261118.webp',items:[
  {code:'1138',label:'Noga Pocket NG-PK08',note:'Azul · Bluetooth',available:true,posterPrice:10771},
  {code:'7053',label:'Netmak NM-MUV',note:'Gris · Bluetooth · RGB',available:true,posterPrice:14727},
  {code:'3031',label:'JBL GO Essential 2',note:'Rojo · Bluetooth',available:true,posterPrice:62152}
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
