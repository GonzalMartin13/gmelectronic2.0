import React from 'react';
import {WHATSAPP} from './catalog.mjs';
import './start-combos.css';

const combos=[
 {id:'esencial',name:'GM Start 100K',label:'Esencial',price:102454,units:37,cables:19,chargers:8,audio:10,tag:'Tu primer paso',headline:'Arrancá con lo esencial.',description:'Una selección inicial de cables, cargadores y audio para kioscos, regalerías y comercios pequeños.',cta:'Quiero empezar con el Esencial',image:'/combos/gm-start-100k.webp'},
 {id:'comercial',name:'GM Start 200K',label:'Comercial',price:205187,units:50,cables:23,chargers:12,audio:15,tag:'Mix equilibrado',headline:'Sumá tecnología a tu comercio.',description:'Más unidades y un mix de accesorios y audio para ampliar lo que ofrecés en tu local.',cta:'Quiero el combo Comercial',image:'/combos/gm-start-200k.webp'},
 {id:'full',name:'GM Start 350K',label:'Full',price:370724,units:89,cables:42,chargers:19,audio:28,tag:'Más stock y variedad',headline:'Dale más lugar a la tecnología.',description:'El pack con más unidades de las tres opciones, para armar una propuesta más amplia desde el comienzo.',cta:'Quiero el combo Full',image:'/combos/gm-start-350k.webp'},
];
const money=value=>'$'+value.toLocaleString('es-AR');
const whatsapp=text=>'https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(text);

export function StartCombos(){return <section id="combos" className="start-combos" aria-labelledby="start-combos-title">
 <div className="combos-heading"><div><span className="eyebrow">NUEVOS COMBOS · GM START</span><h2 id="start-combos-title">IDEAL PARA ARRANCAR A TRABAJAR CON NOSOTROS</h2><p>No hace falta arrancar con todo. Elegí el combo que se adapta a tu comercio y sumá cables, cargadores y audio a tu mostrador.</p></div><span className="combos-heading-stamp">3 opciones.<br/><strong>Un nuevo comienzo.</strong></span></div>
 <div className="combos-grid">{combos.map(combo=><article className={'start-combo start-combo-'+combo.id} key={combo.id} aria-labelledby={'combo-'+combo.id}>
  <div className="combo-label"><span>{combo.label}</span><b>{combo.tag}</b></div>
  <a className="combo-poster" href={combo.image} target="_blank" rel="noreferrer" aria-label={'Ver placa completa de '+combo.name}><img src={combo.image} alt={'Placa '+combo.name+' '+combo.label+' · '+money(combo.price)+' de referencia · '+combo.units+' unidades'} width="1122" height="1402" loading="lazy" decoding="async"/><span>Ver placa completa ↗</span></a>
  <div className="combo-copy"><h3 id={'combo-'+combo.id}>{combo.name} <span>{combo.label}</span></h3><p className="combo-headline">{combo.headline}</p><p className="combo-description">{combo.description}</p>
   <div className="combo-price"><small>Valor de referencia del pack</small><strong>{money(combo.price)}</strong><span>{combo.units} unidades en total</span></div>
   <ul className="combo-contents" aria-label={'Contenido de '+combo.name}><li><strong>{combo.cables}</strong> cables</li><li><strong>{combo.chargers}</strong> cargadores</li><li><strong>{combo.audio}</strong> auriculares</li></ul>
   <a className="combo-cta" href={whatsapp('Hola Gonzalo, quiero conocer el combo '+combo.name+' '+combo.label+' de '+combo.units+' unidades. Vi el valor de referencia de '+money(combo.price)+'. ¿Me pasás el detalle de productos y me confirmás precio final y disponibilidad?')} target="_blank" rel="noreferrer">{combo.cta}<span aria-hidden="true">→</span></a>
   <small className="combo-cta-note">Pedí el detalle y coordiná con Gonzalo por WhatsApp.</small>
  </div>
 </article>)}</div>
 <div className="combos-help"><div><strong>¿Cuál conviene para tu comercio?</strong><p>Contanos qué vendés y cuánto querés invertir. Te ayudamos a elegir por dónde empezar.</p></div><a href={whatsapp('Hola Gonzalo, quiero empezar a vender tecnología en mi comercio. ¿Me ayudás a elegir entre los combos GM Start Esencial, Comercial y Full?')} target="_blank" rel="noreferrer">Ayudame a elegir mi combo ↗</a></div>
 <p className="combos-reference">Precios y composición de referencia según las placas. Consultá el detalle de modelos, precio final y disponibilidad antes de confirmar. Las imágenes ilustran la propuesta de cada pack.</p>
 </section>}
