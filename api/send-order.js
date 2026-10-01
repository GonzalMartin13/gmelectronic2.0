import {createOrderPdf,money} from '../lib/order-document.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const API='https://gm-electronics-api.onrender.com';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Método no permitido'})}
 try{const {order_id,access_token}=req.body||{};if(!UUID.test(order_id)||!UUID.test(access_token))return res.status(400).json({error:'Prepará el pedido antes de enviarlo.'});
 const response=await fetch(API+'/api/v1/orders/'+order_id,{headers:{Authorization:'Bearer '+access_token},signal:AbortSignal.timeout(20000)});if(!response.ok)return res.status(response.status===404?404:503).json({error:'No pudimos recuperar el pedido. Reintentá.'});
 const {data:order}=await response.json();if(Date.now()-Date.parse(order.created_at)>23*60*60*1000)return res.status(409).json({error:'Consultanos por WhatsApp para reenviar este pedido.'});
 const key=process.env.RESEND_API_KEY;if(!key)return res.status(503).json({error:'El pedido quedó guardado. Por ahora podés enviarlo por WhatsApp o descargar su PDF.'});
 const c=order.customer;const rows=order.items.map(row=>'<tr><td>'+escapeHtml(row.nombre)+'<br/>Código: '+escapeHtml(row.codigo)+(row.color?' · '+escapeHtml(row.color):'')+'</td><td>'+row.qty+'</td><td>'+money(row.precio_pesos)+'</td><td>'+money(row.importe)+'</td></tr>').join('');
 const html='<h2>Solicitud '+escapeHtml(order.numero)+' — GM Electronics</h2>'+Object.entries({Cliente:c.name,Comercio:c.business,WhatsApp:c.phone,Email:c.email,Dirección:c.address,Pago:c.payment}).map(([label,value])=>'<p><b>'+label+':</b> '+escapeHtml(value||'-')+'</p>').join('')+'<table border="1" cellpadding="8"><thead><tr><th>Producto / opción</th><th>Cantidad</th><th>Precio unitario</th><th>Importe</th></tr></thead><tbody>'+rows+'</tbody></table><p>Subtotal: '+money(order.subtotal)+'</p>'+(order.invoice?'<p>IVA 21%: '+money(order.iva)+'</p>':'')+'<h3>Total: '+money(order.total)+'</h3><p>Solicitud sujeta a confirmación.</p>';
 const pdf=Buffer.from(createOrderPdf(order).output('arraybuffer')).toString('base64');
 const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'gm-order/'+order.id},body:JSON.stringify({from:process.env.EMAIL_FROM||'GM Electronics <onboarding@resend.dev>',to:['gonzalo.m.martin@gmail.com'],reply_to:c.email,subject:'Solicitud '+order.numero+' — GM Electronics',html,attachments:[{filename:'pedido-'+order.numero+'.pdf',content:pdf}]}),signal:AbortSignal.timeout(15000)});
 const data=await sent.json();if(!sent.ok)return res.status(503).json({error:'El pedido quedó guardado, pero el correo no pudo enviarse. Usá WhatsApp o reintentá.'});return res.status(200).json({ok:true,id:data.id,numero:order.numero});
 }catch{return res.status(503).json({error:'No pudimos enviar el correo. El pedido sigue guardado.'})}
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
