import React,{useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import products from './data/productos.json';
import './styles.css';

const WHATSAPP='5491178234289';
const EMAIL='gonzalo.m.martin@gmail.com';
const IVA_RATE=0.21; // Configurable: confirmar tasa exacta antes de uso comercial.
const categories=[...new Set(products.map(p=>p.categoria).filter(Boolean))];
const formatARS=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n)||0);
const cleanName=n=>String(n||'').replace(/\s+/g,' ').trim();

function Logo(){return <div className="logo"><span className="gm">GM</span><span className="electronics">ELECTRONICS</span></div>}

function App(){
 const [query,setQuery]=useState(''); const [cat,setCat]=useState('Todas'); const [sort,setSort]=useState('relevance');
 const [cart,setCart]=useState([]); const [invoice,setInvoice]=useState(false); const [menu,setMenu]=useState(false); const [detail,setDetail]=useState(null);
 const filtered=useMemo(()=>{let a=products.filter(p=>{const q=query.toLowerCase(); return (cat==='Todas'||p.categoria===cat)&&(!q||[p.nombre,p.descripcion,p.categoria,p.id,...(p.variantes||[]).map(v=>v.codigo)].join(' ').toLowerCase().includes(q))}); if(sort==='priceAsc')a.sort((x,y)=>x.precio_pesos-y.precio_pesos); if(sort==='priceDesc')a.sort((x,y)=>y.precio_pesos-x.precio_pesos); return a},[query,cat,sort]);
 const featured=products.slice(0,8);
 const add=(p)=>setCart(c=>{const found=c.find(x=>x.id===p.id); return found?c.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...c,{...p,qty:1}]});
 const remove=(id)=>setCart(c=>c.flatMap(x=>x.id===id?(x.qty>1?[{...x,qty:x.qty-1}]:[]):[x]));
 const subtotal=cart.reduce((s,x)=>s+x.precio_pesos*x.qty,0); const iva=invoice?subtotal*IVA_RATE:0; const total=subtotal+iva;
 const orderText=()=>`Hola Gonzalo, quiero hacer un pedido a GM Electronics.

${cart.map(x=>`• ${cleanName(x.nombre)} x${x.qty} — ${formatARS(x.precio_pesos*x.qty)}`).join('\n')}

Subtotal: ${formatARS(subtotal)}
${invoice?`IVA 21%: ${formatARS(iva)}\nTotal: ${formatARS(total)}`:`Total: ${formatARS(total)} (sin IVA)`}`;
 const sendWA=()=>window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(orderText())}`,'_blank');
 return <div className="app">
  <header className="topbar"><Logo/><div className="search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar productos, códigos o marcas..."/><span>⌕</span></div><div className="head-actions"><a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">WhatsApp<br/><b>11 7823-4289</b></a><button aria-label="Cuenta">♙<small> Mi cuenta</small></button><button onClick={()=>setMenu(true)} aria-label="Pedido">🛒 <span>{cart.reduce((s,x)=>s+x.qty,0)}</span></button></div></header>
  <div className="layout"><aside className="sidebar"><div className="side-title">☷ &nbsp; Categorías</div>{categories.map(c=><button key={c} onClick={()=>{setCat(c);setMenu(false)}} className={cat===c?'active':''}>{c}<span>›</span></button>)}</aside>
  <main>
   <section className="hero"><div className="hero-copy"><span className="pill">DISTRIBUCIÓN MAYORISTA</span><h1>Tecnología importada,<br/><em>directo a tu negocio.</em></h1><p>Electrónica y accesorios a precios mayoristas, atención directa y una forma simple de armar tus pedidos.</p><div className="benefits"><b>⚡ Precios mayoristas</b><b>◇ Sin mínimo de compra</b><b>▣ Envíos a todo el mundo</b></div><button className="primary" onClick={()=>document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>Ver catálogo →</button></div><div className="hero-art"><div className="glow"></div><div className="device">GM</div><div className="floating">ELECTRONICS</div></div></section>
   <section className="cat-strip">{categories.slice(0,8).map(c=><button key={c} onClick={()=>{setCat(c);document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}}><div className="cat-icon">{c[0]}</div><span>{c}</span></button>)}<button onClick={()=>setCat('Todas')}><div className="cat-icon">→</div><span>Ver todas</span></button></section>
   <section className="featured"><div className="section-head"><div><span className="eyebrow">CATÁLOGO GM</span><h2>Productos del catálogo</h2></div><button onClick={()=>document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>Ver todos →</button></div><div className="cards">{featured.map(p=><ProductCard key={p.id} p={p} add={add} detail={setDetail}/>)}</div></section>
   <section id="catalogo" className="catalog"><div className="section-head"><div><span className="eyebrow">CATÁLOGO COMPLETO</span><h2>Encontrá lo que necesitás</h2></div><div className="filters"><select value={cat} onChange={e=>setCat(e.target.value)}><option>Todas</option>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="relevance">Ordenar</option><option value="priceAsc">Precio menor</option><option value="priceDesc">Precio mayor</option></select></div></div><p className="result-count">{filtered.length} productos encontrados</p><div className="grid">{filtered.map(p=><ProductCard key={p.id} p={p} add={add} detail={setDetail}/>)}</div></section>
   <section className="trust"><div><b>✓</b><span><strong>Sin mínimo de compra</strong>Comprá lo que necesitás.</span></div><div><b>₿</b><span><strong>Medios de pago</strong>Efectivo o transferencia.</span></div><div><b>▤</b><span><strong>Facturación</strong>IVA según modalidad.</span></div><div><b>▱</b><span><strong>Envíos</strong>Desde Zona Oeste.</span></div><div><b>◉</b><span><strong>Atención directa</strong>Gonzalo · 11 7823-4289</span></div></section>
  </main></div>
  <footer><Logo/><div>GM Electronics · Distribución mayorista<br/><a href={`mailto:${EMAIL}`}>{EMAIL}</a></div><div>Zona Oeste · Argentina<br/>Envíos a todo el mundo</div></footer>
  {menu&&<div className="overlay" onClick={()=>setMenu(false)}><div className="cart" onClick={e=>e.stopPropagation()}><div className="cart-head"><h2>Tu pedido</h2><button onClick={()=>setMenu(false)}>×</button></div>{cart.length===0?<p className="empty">Todavía no agregaste productos.</p>:<>{cart.map(x=><div className="cart-row" key={x.id}><div><b>{cleanName(x.nombre)}</b><small>{formatARS(x.precio_pesos)} c/u</small></div><div className="qty"><button onClick={()=>remove(x.id)}>−</button>{x.qty}<button onClick={()=>add(x)}>+</button></div></div>)}<div className="invoice"><label><input type="checkbox" checked={invoice} onChange={e=>setInvoice(e.target.checked)}/> Solicito factura (IVA 21%)*</label><small>*Tasa configurable para la próxima iteración.</small></div><div className="totals"><span>Subtotal <b>{formatARS(subtotal)}</b></span>{invoice&&<span>IVA <b>{formatARS(iva)}</b></span>}<strong>Total <b>{formatARS(total)}</b></strong></div><button className="primary full" onClick={sendWA}>Enviar pedido por WhatsApp</button><a className="mail" href={`mailto:${EMAIL}?subject=Pedido GM Electronics&body=${encodeURIComponent(orderText())}`}>Preparar pedido por email</a></>}</div></div>}
  {detail&&<div className="overlay" onClick={()=>setDetail(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setDetail(null)}>×</button><span className="pill">{detail.categoria}</span><h2>{cleanName(detail.nombre)}</h2><p>{detail.descripcion}</p><div className="detail-bottom"><strong>{formatARS(detail.precio_pesos)}</strong><span>Precio mayorista · IVA no incluido</span><button className="primary" onClick={()=>{add(detail);setDetail(null);setMenu(true)}}>Agregar al pedido</button></div></div></div>}
 </div>
}
function ProductCard({p,add,detail}){return <article className="card"><button className="photo" onClick={()=>detail(p)}><div className="placeholder">{(p.nombre||'GM').slice(0,2).toUpperCase()}</div></button><span className="tag">{p.categoria}</span><h3>{cleanName(p.nombre)}</h3><small>Código: {(p.variantes?.[0]?.codigo)??'—'}</small><div className="price">{formatARS(p.precio_pesos)}</div><div className="sub">Precio mayorista · IVA no incluido</div><button className="add" onClick={()=>add(p)}>Agregar al pedido</button></article>}

createRoot(document.getElementById('root')).render(<App/>);