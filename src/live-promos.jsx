import React,{useEffect,useState} from 'react';
import {formatARS,WHATSAPP} from './catalog.mjs';
import {BrandMark} from './brand.jsx';
import {FEATURED_BOARDS,FEATURED_REVISION,loadFeaturedRows} from './featured-promos.mjs';

function PromoPhoto({src,name}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return src&&!failed
  ?<img src={src} alt={name} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>
  :<span className="promo-photo-placeholder"><BrandMark decorative/></span>;
}
function LiveBoard({board,detail}){
 const [rows,setRows]=useState(null),[error,setError]=useState(false),[reload,setReload]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setError(false);setRows(null);
  loadFeaturedRows(board,{signal:controller.signal})
   .then(result=>{if(!controller.signal.aborted)setRows(result)})
   .catch(()=>{if(!controller.signal.aborted)setError(true)});
  return()=>controller.abort();
 },[board,reload]);
 const consult='https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent('Hola Gonzalo, me interesan los destacados de '+board.title+'. ¿Me confirmás las opciones disponibles?');
 const dates=[...new Set((rows||[]).map(row=>row.variant.fecha_lista).filter(Boolean))].sort();
 const date=dates.length===1?dates[0].split('-').reverse().join('/'):'';
 return <article className={'live-promo live-promo-'+board.id} aria-label={board.title} data-featured-board={board.id}>
  <header><span className="promo-gm"><BrandMark decorative/><b>ELECTRONICS</b></span><span className="promo-current">PRECIO DE LISTA</span></header>
  <div className="live-promo-title"><span>{board.brand}</span><h3>{board.title}</h3><p>{board.description}</p></div>
  {error?<div className="promo-loading" role="status"><span>Consultá las opciones disponibles.</span><button type="button" onClick={()=>setReload(v=>v+1)}>Volver a intentar</button></div>
   :rows===null?<div className="promo-loading" role="status">Cargando productos destacados…</div>
   :rows.length===0?<div className="promo-loading" role="status">Por el momento no hay productos disponibles en esta selección.</div>
   :<div className="live-promo-items">{rows.map(row=><button type="button" className="live-promo-item" key={row.code} data-featured-code={row.code} onClick={()=>detail({...row.product,selectedVariantId:row.variant.api_id})} aria-label={'Ver '+row.label+' · Código '+row.code}>
    <div className="live-promo-photo"><PromoPhoto src={row.variant.imagenes?.[0]||row.product.imagen} name={row.label}/></div>
    <div className="live-promo-info"><strong>{row.label}</strong><span className="live-promo-note">{row.note}</span><small>Código {row.code}</small><b className="live-promo-price">{formatARS(row.variant.precio_pesos)}</b><span className="live-promo-stock">Disponible</span></div>
   </button>)}</div>}
  <footer><span>Precio por unidad{date?' · Lista '+date:''}</span><a href={consult} target="_blank" rel="noreferrer">Consultar productos →</a></footer>
 </article>;
}
export function LivePromos({detail}){
 return <div className="promo-grid" data-featured-revision={FEATURED_REVISION}>{FEATURED_BOARDS.map(board=><LiveBoard key={board.id} board={board} detail={detail}/>)}</div>;
}
