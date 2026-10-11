import {test} from 'node:test';
import assert from 'node:assert/strict';
import {customerIssues,sessionHeaders} from '../src/order-checks.mjs';
test('complete saved customer proceeds without requiring optional fields',()=>{
 assert.deepEqual(customerIssues({name:'Gonzalo',phone:'1178234289',email:'cliente@example.com'}),[]);
 assert.deepEqual(customerIssues({name:' ',phone:'123',email:'incorrecto'}),['Nombre y apellido','Teléfono / WhatsApp válido','Email válido']);
});
test('protected orders use the managed SDK JWT accessor and never send missing or opaque tokens',async()=>{
 const sdk={getJWTToken:async()=>'header.payload.signature',token:()=>{throw Error('Wrong endpoint')}};
 assert.deepEqual(await sessionHeaders(sdk),{Authorization:'Bearer header.payload.signature'});
 for(const token of [null,undefined,'opaque-session'])await assert.rejects(()=>sessionHeaders({getJWTToken:async()=>token}));
 await assert.rejects(()=>sessionHeaders({getJWTToken:async()=>{throw Error('Connection failed')}}));
});
