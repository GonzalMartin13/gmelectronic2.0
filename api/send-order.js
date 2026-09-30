export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Método no permitido'});
 try{
  const {customer,items,invoice,subtotal,iva,total,pdf}=req.body||{};
  if(!customer?.name||!/^[0-9]{8,13}$/.test(customer.phone)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return res.status(400).json({error:'Datos de contacto inválidos'});
  if(!Array.isArray(items)||!items.length) return res.status(400).json({error:'El pedido está vacío'});
  const key=process.env.RESEND_API_KEY;
  if(!key) return res.status(500).json({error:'Falta configurar RESEND_API_KEY en Vercel'});
  const rows=items.map(x=>'<tr><td>'+escapeHtml(x.nombre)+'</td><td>'+x.qty+'</td><td>'+money(x.precio_pesos*x.qty)+'</td></tr>').join('');
  const html='<h2>Nuevo pedido — GM Electronics</h2><p><b>Cliente:</b> '+escapeHtml(customer.name)+'</p><p><b>Comercio:</b> '+escapeHtml(customer.business||'-')+'</p><p><b>WhatsApp:</b> '+customer.phone+'</p><p><b>Email:</b> '+escapeHtml(customer.email)+'</p><p><b>Dirección:</b> '+escapeHtml(customer.address||'-')+'</p><p><b>Pago:</b> '+escapeHtml(customer.payment)+'</p><table border="1" cellpadding="8" cellspacing="0"><thead><tr><th>Producto</th><th>Cantidad</th><th>Importe</th></tr></thead><tbody>'+rows+'</tbody></table><p>Subtotal: '+money(subtotal)+'</p>'+(invoice?'<p>IVA: '+money(iva)+'</p>':'')+'<h3>Total: '+money(total)+'</h3>';
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM||'GM Electronics <onboarding@resend.dev>',to:['gonzalo.m.martin@gmail.com'],reply_to:customer.email,subject:'Nuevo pedido GM Electronics — '+customer.name,html,attachments:pdf?.base64?[{filename:pdf.filename||'pedido-GM-Electronics.pdf',content:pdf.base64}]:[]})});
 const data=await response.json();
 if(!response.ok) return res.status(response.status).json({error:data?.message||'Error del proveedor de email'});
 return res.status(200).json({ok:true,id:data.id});
 }catch(e){return res.status(500).json({error:e.message||'Error interno'});}
}
function money(n){return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n)||0)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}