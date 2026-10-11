export function customerIssues(customer){
 const issues=[];
 if(!customer.name?.trim())issues.push('Nombre y apellido');
 if(!/^[0-9]{8,13}$/.test(customer.phone||''))issues.push('Teléfono / WhatsApp válido');
 if(!/^[^\s@]+@[^\s@]+[.][^\s@]+$/.test(customer.email||''))issues.push('Email válido');
 return issues;
}

// Neon exposes its authenticated JWT through getJWTToken, not the raw /token endpoint.
export async function sessionHeaders(auth){
 const token=await auth.getJWTToken();
 if(typeof token!=='string'||token.split('.').length!==3)throw new Error('Tu sesión necesita renovarse. Abrí Mi cuenta y volvé a ingresar; tu carrito queda guardado.');
 return {Authorization:'Bearer '+token};
}
