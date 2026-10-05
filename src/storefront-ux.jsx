import React,{useEffect,useRef} from 'react';
import {WHATSAPP} from './catalog.mjs';

// Keep keyboard navigation inside the visible dialog and restore its trigger.
export function useDialog(open,onClose){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const panel=document.querySelector('[role="dialog"]');
  const focusable=()=>Array.from(panel?.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')||[]).filter(el=>el.getClientRects().length);
  focusable()[0]?.focus();
  const key=e=>{if(e.key==='Escape'){e.preventDefault();close.current();return}if(e.key!=='Tab')return;const rows=focusable();if(!rows.length)return;const first=rows[0],last=rows[rows.length-1];if(e.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){e.preventDefault();first.focus()}};
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus()};
 },[open]);
}

const QUESTIONS=[
 ['¿Hay un mínimo de compra?','No hay un mínimo general. Podés combinar productos y cantidades para armar tu pedido.'],
 ['¿Los precios incluyen IVA?','Los precios del catálogo se muestran en pesos argentinos, sin IVA. En el carrito podés activar “Precios con IVA” para sumar el 21% al total.'],
 ['¿Tengo que comprar un bulto completo?','El embalaje indica la presentación del proveedor. Es informativo y no impone un mínimo por producto.'],
 ['¿Qué significa “Consultar disponibilidad”?','Contactanos para confirmar ese producto o su variante antes de sumarlo al pedido. Si falta el precio, también podés pedirnos el valor actualizado.'],
 ['¿Cómo confirmo mi pedido y el envío?','Elegí productos, completá tus datos y prepará la solicitud por WhatsApp, email o PDF. Gonzalo confirma disponibilidad, pago y entrega. Los costos de envío se coordinan aparte.'],
 ['¿Cómo puedo pagar?','Podés elegir efectivo o transferencia al preparar tu pedido. Coordinamos los detalles al confirmarlo.'],
 ['¿El PDF tiene los mismos precios que la web?','El PDF es un muestrario descargable. Para consultar precios y disponibilidad actuales, usá el catálogo de esta página.']
];
export function BuyingQuestions(){return <section id="preguntas" className="buying-questions"><span className="eyebrow">ANTES DE PEDIR</span><h2>Preguntas frecuentes</h2><div className="questions-grid">{QUESTIONS.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div><p>¿Necesitás ayuda para elegir? <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">Hablá con Gonzalo por WhatsApp →</a></p></section>}
