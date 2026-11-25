import React,{useEffect,useRef,useState} from 'react';
import {formatARS,WHATSAPP} from './catalog.mjs';
import {FEATURED_BOARDS,FEATURED_REVISION,loadFeaturedRows} from './featured-promos.mjs';

function PosterBoard({board,detail,index}){
 const [pending,setPending]=useState(null),[notice,setNotice]=useState('');
 const active=useRef(null);
 useEffect(()=>()=>active.current?.abort(),[]);
 async function open(item){
  active.current?.abort();
  const controller=new AbortController();active.current=controller;
  setPending(item.code);setNotice('Confirmando precio y disponibilidad…');
  try{
   const [row]=await loadFeaturedRows({items:[item]},{signal:controller.signal});
   if(controller.signal.aborted)return;
   if(!row){setNotice('Consultanos por el código '+item.code+' para confirmar las opciones disponibles.');return;}
   setNotice('');
   detail({...row.product,selectedVariantId:row.variant.api_id});
  }catch{
   if(!controller.signal.aborted)setNotice('No pudimos confirmar el código '+item.code+'. Reintentá o consultanos por WhatsApp.');
  }finally{
   if(!controller.signal.aborted)setPending(null);
  }
 }
 const consult='https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent('Hola Gonzalo, me interesan los productos de '+board.title+' (códigos '+board.items.map(item=>item.code).join(', ')+'). ¿Me confirmás precio y disponibilidad?');
 const alt=board.title+'. '+board.items.map(item=>item.label+', código '+item.code+', '+formatARS(item.posterPrice)+(item.available?' · Disponible':' · Sin stock')).join('; ')+'. Precios por unidad de la lista del 25/11/2026; consultar disponibilidad.';
 return <article className="featured-poster-card" data-featured-board={board.id} aria-labelledby={'featured-title-'+board.id}>
  <h3 id={'featured-title-'+board.id} className="featured-sr-only">{board.title}</h3>
  <div className={"featured-art featured-art-"+board.id}><img className="featured-poster" src={board.poster} alt={alt} width="720" height="960" loading="eager" decoding="async" fetchPriority={index===0?'high':'auto'}/>{board.items.map((item,i)=><div className={"featured-current-price price-position-"+i} key={item.code} data-current-price={item.code}><strong>{formatARS(item.posterPrice).replace(/,00$/,'')}</strong>{item.available===false&&<small>Sin stock</small>}</div>)}<div className="featured-current-date">Precios por unidad · Lista 25/11/2026<br/>Consultar disponibilidad</div></div>
  <div className="featured-poster-actions">
   <span className="featured-action-label">Ver producto y precio vigente</span>
   <div className="featured-product-links">{board.items.map(item=><button key={item.code} type="button" data-featured-code={item.code} disabled={pending!==null} onClick={()=>open(item)} aria-label={'Ver '+item.label+' · Código '+item.code}>
    <span>{item.label}<small>Cód. {item.code}</small></span><span aria-hidden="true">{pending===item.code?'…':'↗'}</span>
   </button>)}</div>
   <p className="featured-poster-status" role="status" aria-live="polite">{notice}</p>
   <a className="featured-consult" href={consult} target="_blank" rel="noreferrer">Consultar con Gonzalo →</a>
  </div>
 </article>;
}
export function LivePromos({detail}){
 return <><div className="promo-grid" data-featured-revision={FEATURED_REVISION}>{FEATURED_BOARDS.map((board,index)=><PosterBoard key={board.id} board={board} detail={detail} index={index}/>)}</div><p className="featured-price-note">Precios de referencia de la lista del 25/11/2026. Al abrir un producto confirmamos su precio vigente y disponibilidad.</p></>;
}
