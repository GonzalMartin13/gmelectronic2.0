import React,{useEffect,useState} from 'react';
import {createAuthClient} from '@neondatabase/auth';
import {BetterAuthReactAdapter} from '@neondatabase/auth/react/adapters';
import {API_BASE,formatARS} from './catalog.mjs';
import {createOrderPdf} from '../lib/order-document.js';
import './customer-account.css';

export const accountsEnabled=Boolean(import.meta.env.VITE_NEON_AUTH_URL);
const auth=accountsEnabled?createAuthClient(import.meta.env.VITE_NEON_AUTH_URL,{adapter:BetterAuthReactAdapter({fetchOptions:{credentials:'include'}})}):null;
function checked(result){if(result?.error)throw new Error(result.error.message||'No pudimos acceder a tu cuenta.');return result?.data}
async function accountRequest(path,{method='GET',body,signal}={}){
 const token=checked(await auth.token())?.token;
 if(!token)throw new Error('Ingresá nuevamente a tu cuenta.');
 const response=await fetch(API_BASE+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:signal||AbortSignal.timeout(30000),cache:'no-store'});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error?.message||'No pudimos consultar tu cuenta.');
 return result;
}

export function useCustomerAccount(){
 const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(accountsEnabled),[error,setError]=useState('');
 async function restore(){
  setLoading(true);setError('');
  try{
   const data=checked(await auth.getSession());
   const current=data?.user||null;setUser(current);
   if(current?.emailVerified)setProfile((await accountRequest('/api/v1/me')).data);else setProfile(null);
   return current;
  }catch(e){setError(e.message);throw e}finally{setLoading(false)}
 }
 useEffect(()=>{if(accountsEnabled)restore().catch(()=>{});},[]);
 async function orderHeaders(){
  if(!accountsEnabled)return {};
  const session=checked(await auth.getSession());
  if(!session?.user){if(user)throw new Error('Tu sesión venció. Ingresá nuevamente antes de preparar el pedido.');return {}}
  if(!session.user.emailVerified)throw new Error('Verificá tu email desde Mi cuenta para guardar el pedido.');
  const token=checked(await auth.token())?.token;
  if(!token)throw new Error('No pudimos verificar tu sesión. Reintentá desde Mi cuenta.');
  return {Authorization:'Bearer '+token};
 }
 async function signOut(){checked(await auth.signOut());setUser(null);setProfile(null);setError('')}
 return {user,profile,loading,error,restore,orderHeaders,signOut,setProfile};
}

export function CustomerAccount({account,onClose,onProfile}){
 const [mode,setMode]=useState('login'),[tab,setTab]=useState('profile'),[email,setEmail]=useState(account.user?.email||''),[password,setPassword]=useState(''),[name,setName]=useState(''),[otp,setOtp]=useState(''),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 const [fields,setFields]=useState(account.profile||{name:'',phone:'',business:'',address:''}),[history,setHistory]=useState([]),[page,setPage]=useState(1),[hasMore,setHasMore]=useState(false),[historyLoading,setHistoryLoading]=useState(false),[historyError,setHistoryError]=useState(''),[selected,setSelected]=useState(null);
 useEffect(()=>{if(account.profile)setFields(account.profile)},[account.profile]);
 useEffect(()=>{if(account.user&&!account.user.emailVerified){setEmail(account.user.email);setMode('verify')}},[account.user?.id]);
 useEffect(()=>{
  if(tab!=='orders'||!account.user?.emailVerified)return;
  const controller=new AbortController();setHistoryLoading(true);setHistoryError('');
  accountRequest('/api/v1/me/orders?page='+page,{signal:controller.signal}).then(result=>{if(!controller.signal.aborted){setHistory(result.data);setHasMore(result.pagination.has_more)}}).catch(e=>{if(!controller.signal.aborted)setHistoryError(e.message)}).finally(()=>{if(!controller.signal.aborted)setHistoryLoading(false)});
  return()=>controller.abort();
 },[tab,page,account.user?.id]);
 async function run(action){setPending(true);setMessage('');try{await action()}catch(e){setMessage(e.message||'No pudimos completar la operación.')}finally{setPending(false)}}
 async function submit(e){e.preventDefault();await run(async()=>{
  if(mode==='forgot'){
   checked(await auth.forgetPassword.emailOtp({email:email.trim()}));setMode('reset');setMessage('Si el email tiene una cuenta, recibirás un código para cambiar la contraseña.');return;
  }else if(mode==='reset'){
   checked(await auth.emailOtp.resetPassword({email:email.trim(),otp,password}));setPassword('');setOtp('');setMode('login');setMessage('Contraseña actualizada. Ingresá con tu nueva contraseña.');return;
  }else if(mode==='register'){
   const data=checked(await auth.signUp.email({name:name.trim(),email:email.trim(),password}));setPassword('');
   if(data?.user&&!data.user.emailVerified){setMode('verify');setMessage('Ingresá el código de verificación recibido por email.');return}
  }else if(mode==='verify'){
   checked(await auth.emailOtp.verifyEmail({email:email.trim(),otp}));setOtp('');setMode('login');
  }else checked(await auth.signIn.email({email:email.trim(),password}));
  setPassword('');await account.restore();
 })}
 async function saveProfile(e){e.preventDefault();await run(async()=>{
  const body=Object.fromEntries(['name','phone','business','address'].map(key=>[key,fields[key]||'']));
  const profile=(await accountRequest('/api/v1/me',{method:'POST',body})).data;
  account.setProfile(profile);onProfile(profile);setMessage('Datos guardados en tu cuenta.');
 })}
 return <div className="overlay customer-account-overlay"><div className="customer-account modal-wide" role="dialog" aria-modal="true" aria-label="Mi cuenta"><div className="cart-head"><div><span className="eyebrow">GM ELECTRONICS</span><h2>Mi cuenta</h2></div><button aria-label="Cerrar mi cuenta" disabled={pending} onClick={onClose}>×</button></div>
  {account.loading?<p role="status">Consultando tu cuenta…</p>:account.user?.emailVerified?<>
   <div className="account-session"><span>{account.user.email}</span><button className="secondary" disabled={pending} onClick={()=>run(async()=>{await account.signOut();setHistory([]);setSelected(null);setPassword('');setTab('profile')})}>Cerrar sesión</button></div>
   <nav className="account-tabs" aria-label="Opciones de mi cuenta"><button aria-pressed={tab==='profile'} onClick={()=>setTab('profile')}>Mis datos</button><button aria-pressed={tab==='orders'} onClick={()=>{setSelected(null);setTab('orders')}}>Mis pedidos</button></nav>
   {tab==='profile'?<form onSubmit={saveProfile}><p>Tus datos quedan guardados para tus próximos pedidos, también desde otros dispositivos.</p><div className="form-grid">{[['name','Nombre y apellido',200],['phone','Teléfono / WhatsApp',13],['business','Comercio / empresa',200],['address','Dirección / localidad',500]].map(([key,label,max])=><label key={key}>{label}<input required={key==='name'} maxLength={max} inputMode={key==='phone'?'tel':'text'} value={fields[key]||''} disabled={pending} onChange={e=>setFields(f=>({...f,[key]:key==='phone'?e.target.value.replace(/\D/g,''):e.target.value}))}/></label>)}<label>Email verificado<input value={account.user.email} readOnly/></label></div><button className="primary" disabled={pending}>Guardar datos</button></form>:<>
    <p>Solicitudes realizadas desde esta cuenta. Gonzalo confirma disponibilidad, pago y entrega.</p>
    {historyLoading?<p role="status">Consultando pedidos…</p>:historyError?<p role="alert">{historyError}</p>:selected?<div className="account-order-detail"><button className="secondary" onClick={()=>setSelected(null)}>← Volver a mis pedidos</button><h3>{selected.numero}</h3><p>{new Date(selected.created_at).toLocaleDateString('es-AR')} · Solicitud recibida</p><ul>{selected.items.map(item=><li key={item.variant_id}><span>{item.qty} × {item.nombre} <small>Código {item.codigo}{item.color?' · '+item.color:''}</small></span><strong>{formatARS(item.importe)}</strong></li>)}</ul><p>Total del pedido: <strong>{formatARS(selected.total)}</strong></p><button className="primary" onClick={()=>run(async()=>{(await createOrderPdf(selected)).save('pedido-'+selected.numero+'.pdf')})}>Descargar pedido en PDF</button></div>:<>
     {!history.length?<p>Todavía no hiciste pedidos desde esta cuenta. Podés empezar en el catálogo.</p>:<div className="account-orders">{history.map(order=><button key={order.id} onClick={()=>run(async()=>{setSelected((await accountRequest('/api/v1/me/orders/'+order.id)).data)})} disabled={pending}><span><b>{order.numero}</b><small>{new Date(order.created_at).toLocaleDateString('es-AR')} · Solicitud recibida</small></span><strong>{formatARS(order.total)}</strong><span>Ver pedido →</span></button>)}</div>}
     <div className="account-pages"><button className="secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page}</span><button className="secondary" disabled={!hasMore} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div>
    </>}
   </>}
  </>:<>
   <p>{mode==='register'?'Creá tu cuenta para guardar tus datos y consultar tus pedidos.':mode==='verify'?'Verificá que el email te pertenece para acceder a tu historial.':mode==='forgot'?'Te enviaremos un código para recuperar tu cuenta.':mode==='reset'?'Ingresá el código recibido y elegí una nueva contraseña.':'Ingresá con tu email y contraseña.'}</p>
   <form onSubmit={submit}><div className="form-grid">{mode==='register'&&<label>Nombre y apellido<input required autoComplete="name" maxLength={200} value={name} onChange={e=>setName(e.target.value)} disabled={pending}/></label>}<label>Email<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} disabled={pending||mode==='verify'||mode==='reset'}/></label>{['verify','reset'].includes(mode)&&<label>Código de verificación<input required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} disabled={pending}/></label>}{!['verify','forgot'].includes(mode)&&<label>{mode==='reset'?'Nueva contraseña':'Contraseña'}<input required type="password" minLength={8} maxLength={128} autoComplete={['register','reset'].includes(mode)?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} disabled={pending}/></label>}</div><button className="primary" disabled={pending}>{pending?'Un momento…':mode==='register'?'Crear cuenta':mode==='verify'?'Verificar email':mode==='forgot'?'Enviar código':mode==='reset'?'Cambiar contraseña':'Ingresar'}</button></form>
   {mode==='verify'?<><button className="secondary" disabled={pending} onClick={()=>run(async()=>{checked(await auth.emailOtp.sendVerificationOtp({email,type:'email-verification'}));setMessage('Si corresponde, recibirás un nuevo código por email.')})}>Reenviar código</button><button className="secondary" disabled={pending} onClick={()=>setMode('login')}>Volver a ingresar</button></>:<button className="secondary" disabled={pending} onClick={()=>{setMode(mode==='register'?'login':'register');setMessage('');setPassword('')}}>{mode==='register'?'Ya tengo cuenta':'Crear mi cuenta'}</button>}
   {mode==='login'&&<><button className="secondary" disabled={pending} onClick={()=>{setMode('forgot');setPassword('');setMessage('')}}>Olvidé mi contraseña</button><button className="secondary" disabled={pending||!email} onClick={()=>run(async()=>{checked(await auth.emailOtp.sendVerificationOtp({email,type:'email-verification'}));setMode('verify');setMessage('Ingresá el código recibido por email.')})}>Verificar mi email</button></>}
   {['forgot','reset'].includes(mode)&&<button className="secondary" disabled={pending} onClick={()=>{setMode('login');setPassword('');setOtp('')}}>Volver a ingresar</button>}
  </>}
  {(message||account.error)&&<p className="form-note" role="status">{message||account.error}</p>}
 </div></div>;
}
