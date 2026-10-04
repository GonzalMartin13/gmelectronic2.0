import React,{useEffect,useMemo,useState} from 'react';
import {apiGet} from './catalog.mjs';
import './styles.css';
import './product-layout.css';

function ReviewImage({src,alt}) {
  const [failed,setFailed]=useState(false);
  if(failed) return <div className="review-image-fallback">Imagen no disponible</div>;
  return <img src={src} alt={alt} onError={()=>setFailed(true)}/>;
}

function PhotoReview() {
  const [assets,setAssets]=useState([]);
  const [decisions,setDecisions]=useState(()=>{try{return JSON.parse(localStorage.getItem('gm-photo-review-v1')||'{}')}catch{return {}}});
  const [index,setIndex]=useState(0);
  const [status,setStatus]=useState('Cargando imágenes…');
  const [dragStart,setDragStart]=useState(null);
  const current=assets[index];
  const counts=useMemo(()=>Object.values(decisions).reduce((a,v)=>({...a,[v]:(a[v]||0)+1}),{}),[decisions]);

  useEffect(()=>{
    let active=true;
    (async()=>{
      try {
        const first=await apiGet('/api/v1/products?limit=100&page=1');
        const pages=Array.from({length:first.pagination.pages-1},(_,i)=>i+2);
        const rest=await Promise.all(pages.map(page=>apiGet('/api/v1/products?limit=100&page='+page)));
        const products=[...first.data,...rest.flatMap(result=>result.data)];
        const seen=new Set();
        const rows=[];
        for(const product of products) {
          const variants=product.variantes||[];
          const sources=[{path:product.imagen,code:variants[0]?.codigo||product.id,color:null}];
          for(const variant of variants) for(const path of variant.imagenes||[]) sources.push({path,code:variant.codigo,color:variant.color});
          for(const item of sources) if(item.path&&!seen.has(item.path)) {
            seen.add(item.path);
            rows.push({id:item.path,path:item.path,url:item.path,name:product.nombre,category:product.categoria,codes:[...new Set(sources.filter(x=>x.path===item.path).map(x=>x.code).filter(Boolean))],colors:[...new Set(sources.filter(x=>x.path===item.path).map(x=>x.color).filter(Boolean))]});
          }
        }
        if(active){setAssets(rows);setStatus(rows.length+' fotos listas para revisar');}
      } catch { if(active)setStatus('No pudimos cargar las imágenes. Recargá la página para reintentar.'); }
    })();
    return()=>{active=false};
  },[]);

  useEffect(()=>localStorage.setItem('gm-photo-review-v1',JSON.stringify(decisions)),[decisions]);
  const decide=(value)=>{
    if(!current)return;
    setDecisions(previous=>({...previous,[current.id]:value}));
    setIndex(value==='skip'?Math.min(index+1,assets.length):Math.min(index+1,assets.length));
  };
  const exportList=()=>{
    const marked=assets.filter(item=>decisions[item.id]==='delete').map(item=>({...item,action:'delete'}));
    const blob=new Blob([JSON.stringify({created_at:new Date().toISOString(),total_marked:marked.length,items:marked},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='gm-fotos-para-eliminar.json';a.click();URL.revokeObjectURL(url);
  };
  const reset=()=>{setDecisions({});setIndex(0);localStorage.removeItem('gm-photo-review-v1')};
  const onPointerDown=e=>setDragStart(e.clientX);
  const onPointerUp=e=>{if(dragStart===null)return;const delta=e.clientX-dragStart;setDragStart(null);if(Math.abs(delta)>70)decide(delta>0?'keep':'delete')};
  return <div className="photo-review-page">
    <header className="review-header"><div><span className="eyebrow">GM ELECTRONICS · HERRAMIENTA INTERNA</span><h1>Revisar fotos del catálogo</h1><p>Deslizá a la derecha para conservar una foto y a la izquierda para marcarla para eliminar.</p></div><a className="secondary" href="/">Volver al catálogo</a></header>
    <div className="review-stats"><span>{status}</span><b>Conservar: {counts.keep||0}</b><b>Eliminar: {counts.delete||0}</b><b>Sin decidir: {Math.max(assets.length-(counts.keep||0)-(counts.delete||0),0)}</b></div>
    {current?<main className="review-workspace">
      <section className="review-card-wrap"><article className="review-card" onPointerDown={onPointerDown} onPointerUp={onPointerUp}><ReviewImage src={current.url} alt={current.name}/><div className="review-badge review-badge-delete">ELIMINAR</div><div className="review-badge review-badge-keep">CONSERVAR</div><div className="review-card-info"><h2>{current.name}</h2><span>{current.category}</span><small>Código{current.codes.length>1?'s':''}: {current.codes.join(' · ')}</small>{current.colors.length>0&&<small>Color: {current.colors.join(' · ')}</small>}<em>{index+1} de {assets.length}</em></div></article>
      <div className="review-actions"><button className="review-action delete" onClick={()=>decide('delete')} aria-label="Marcar para eliminar">✕</button><button className="review-action skip" onClick={()=>decide('skip')} aria-label="Saltar foto">↺</button><button className="review-action keep" onClick={()=>decide('keep')} aria-label="Conservar foto">✓</button></div>
    </section>
    <aside className="review-panel"><h2>Decisiones</h2><p>Las marcas se guardan en este navegador. Todavía no se elimina nada de la API.</p><button className="primary full" onClick={exportList} disabled={!counts.delete}>Descargar lista de eliminación ({counts.delete||0})</button><button className="secondary full" onClick={reset}>Reiniciar revisión</button><div className="review-help"><b>Cómo usarla</b><span>← Eliminar</span><span>→ Conservar</span><span>↺ Saltar y revisar después</span></div></aside>
    </main>:<section className="review-finished"><h2>Revisión terminada</h2><p>Ya no quedan fotos pendientes en esta sesión.</p></section>}
  </div>;
}

export {PhotoReview};

