import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {formatARS,WHATSAPP} from './catalog.mjs';
import {comboComposition,compositionSummary} from './combo-composition.mjs';

export function ComboDetail({combo,live,onClose,onAdd}){
 const dialog=useRef(null);
 useEffect(()=>{
  const element=dialog.current;
  const previousOverflow=document.body.style.overflow;
  element.showModal();
  document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=previousOverflow};
 },[]);
 const canAdd=Boolean(live?.stock_disponible&&Number(live.precio_pesos)>0);
 const contents=live?.productos?.length?live.productos:comboComposition[combo.code];
 const summary=compositionSummary(contents);
 function backdropClick(event){
  if(event.target!==dialog.current)return;
  const rect=dialog.current.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();
 }
 return createPortal(<dialog ref={dialog} className={'combo-dialog start-combo-'+combo.id} aria-labelledby="combo-detail-title" onCancel={onClose} onClick={backdropClick}>
  <div className="combo-dialog-header"><div><span className="eyebrow">COMBO GM START · {combo.label}</span><h2 id="combo-detail-title">{combo.name}</h2><p>Código: <strong>{combo.code}</strong></p></div><button type="button" className="combo-dialog-close" aria-label="Cerrar detalle del combo" onClick={onClose}>×</button></div>
  <div className="combo-dialog-layout">
   <div className="combo-dialog-photo"><img src={combo.image} alt={'Imagen del combo '+combo.name+' '+combo.label} width="1122" height="1402"/></div>
   <div className="combo-dialog-copy"><h3>{combo.headline}</h3><p>{combo.description}</p>
    <h3>¿Qué incluye?</h3><table className="combo-detail-table"><caption>{summary.units} unidades en cada combo</caption><thead><tr><th scope="col">Producto / código</th><th scope="col">Cantidad</th></tr></thead><tbody>{contents.map(item=><tr key={item.codigo}><th scope="row">{item.nombre}<small>Código: {item.codigo}</small></th><td>{item.cantidad}</td></tr>)}</tbody><tfoot><tr><th scope="row">Total de unidades</th><td>{summary.units}</td></tr></tfoot></table>
    <p className="combo-detail-note">Incluye {summary.cables} cables, {summary.chargers} cargadores y {summary.audio} auriculares. Disponibilidad y entrega a confirmar con Gonzalo.</p>
    <div className="combo-dialog-price"><small>Precio del combo · IVA no incluido</small><strong>{live?.precio_pesos?formatARS(live.precio_pesos):'Consultar precio'}</strong></div>
    <button type="button" className="combo-cta" disabled={!canAdd} onClick={onAdd}>Agregar combo al pedido <span aria-hidden="true">+</span></button>
    <p className="combo-detail-note">1 en el carrito = 1 combo completo de {live?.units??combo.units} unidades.</p>
    <a className="combo-consult" href={'https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent('Hola Gonzalo, quiero conocer los productos y cantidades del combo '+combo.code+' · '+combo.name+'.')} target="_blank" rel="noreferrer">Consultar este combo por WhatsApp ↗</a>
   </div>
  </div>
 </dialog>,document.body);
}

