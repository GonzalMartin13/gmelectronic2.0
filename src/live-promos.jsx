import React,{useEffect,useState} from 'react';
import {apiGet,formatARS,stockLabel,WHATSAPP} from './catalog.mjs';
import {BrandMark} from './brand.jsx';

const BOARDS=[
 {id:'philips',brand:'PHILIPS',title:'Philips Up Beat TAUE100',query:'TAUE100',items:[['1404','Philips Up Beat TAUE100']]},
 {id:'jbl',brand:'JBL',title:'JBL C50HI · Pure Bass',query:'C50HI',items:[['2231','JBL C50HI']]},
 {id:'noga',brand:'NOGA',title:'Parlantes Noga portátiles',query:'NG-BT',items:[['0745','Noga NG-BT530'],['0744','Noga NG-BT535'],['0746','Noga NG-BT540'],['0726','Noga NG-BT670']]},
 {id:'motorola',brand:'MOTOROLA',title:'Motorola Earbuds',query:'Earbuds',items:[['2334','Earbuds 2-S'],['2221','Earbuds 105'],['2321','Earbuds 3-S'],['3020','Earbuds 3C-S · USB C']]}
];
function PromoPhoto({src,name}){const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[src]);return src&&!failed?<img src={src} alt={name} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<span className="promo-photo-placeholder"><BrandMark decorative/></span>}
function LiveBoard({board,detail}){
 const [rows,setRows]=useState(null),[error,setError]=useState(false),[reload,setReload]=useState(0);
 useEffect(()=>{const controller=new AbortController();setError(false);setRows(null);(async()=>{try{
  const path='/api/v1/products?limit=100&q='+encodeURIComponent(board.query);
  const first=await apiGet(path,{signal:controller.signal});const products=[...first.data];
  for(let page=2;page<=first.pagination.pages;page++){const next=await apiGet(path+'&page='+page,{signal:controller.signal});products.push(...next.data)}
  const matched=board.items.map(([code,label])=>{const product=products.find(p=>p.variantes.some(v=>v.codigo===code));const variant=product?.variantes.find(v=>v.codigo===code);return{code,label,product,variant}});
  if(!controller.signal.aborted)setRows(matched);
 }catch{if(!controller.signal.aborted)setError(true)}})();return()=>controller.abort()},[board,reload]);
 const consult='https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent('Hola Gonzalo, me interesa '+board.brand+' '+board.title+'. ¿Me confirmás precio y disponibilidad?');
 return <article className={'live-promo '+(board.items.length===1?'live-promo-single':'live-promo-multi')} aria-label={'Promo '+board.brand}>
  <header><span className="promo-gm"><BrandMark/><b>ELECTRONICS</b></span><span className="promo-current">PRECIOS ACTUALIZADOS</span></header>
  <div className="live-promo-title"><span>{board.brand}</span><h3>{board.title}</h3></div>
  {!rows?<div className="promo-loading" role="status">{error?<><span>Consultá los precios actuales.</span><button onClick={()=>setReload(v=>v+1)}>Reintentar</button></>:<span>Actualizando precios…</span>}</div>:<div className="live-promo-items">{rows.map(row=><button className="live-promo-item" key={row.code} disabled={!row.product} onClick={()=>detail({...row.product,selectedVariantId:row.variant.api_id})} aria-label={'Ver '+row.label+' · Código '+row.code}>
   <div className="live-promo-photo"><PromoPhoto src={row.variant?.imagenes?.[0]||row.product?.imagen} name={row.label}/></div><div className="live-promo-info"><strong>{row.label}</strong><small>Código {row.code}</small><b className="live-promo-price">{formatARS(row.variant?.precio_pesos)}</b><span>{stockLabel(row.variant?.stock_disponible)}</span></div>
  </button>)}</div>}
  <footer><span>Precio mayorista · IVA no incluido</span><a href={consult} target="_blank" rel="noreferrer">Consultar promo →</a></footer>
 </article>
}
export function LivePromos({detail}){return <div className="promo-grid">{BOARDS.map(board=><LiveBoard key={board.id} board={board} detail={detail}/>)}</div>}
