const HEX={NEGRO:'#17212b',BLANCO:'#ffffff',ROSA:'#f293bd',AZUL:'#2563eb',ROJO:'#dc2626',GRIS:'#9ca3af',CELESTE:'#69c9ee',VIOLETA:'#7c3aed',NARANJA:'#f97316',BEIGE:'#dfc8a5',VERDE:'#22a657',MARRON:'#805333',AMARILLO:'#facc15',TURQUESA:'#20b8b4',DORADO:'#cba343',PLATA:'#bfc7d0',LILA:'#c2a2e8'};
const ALIASES={NEGRA:'NEGRO',BLANCA:'BLANCO',ROJA:'ROJO',ROSADO:'ROSA',PLATEADO:'PLATA'};
export function colorSwatch(label){
 const text=String(label||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
 if(!text)return null;
 if(text==='MULTICOLOR')return {key:text,label:'Multicolor',background:'conic-gradient(#dc2626,#facc15,#22a657,#2563eb,#7c3aed,#dc2626)'};
 const parts=text.split(/\s*(?:\/|-|\bY\b)\s*/).map(p=>ALIASES[p]||p).filter(Boolean);
 if(!parts.length||parts.some(p=>!HEX[p]))return {key:text,label:String(label).trim(),background:'#edf1f5',unknown:true};
 const key=parts.join('/');
 const background=parts.length===1?HEX[parts[0]]:'linear-gradient(135deg,'+parts.flatMap((p,i)=>[HEX[p]+' '+(i*100/parts.length)+'%',HEX[p]+' '+((i+1)*100/parts.length)+'%']).join(',')+')';
 return {key,label:parts.map(p=>p.charAt(0)+p.slice(1).toLowerCase()).join(' / '),background};
}
export function availableColors(product){
 const variants=product.variantes||[];
 const known=new Set(variants.map(v=>colorSwatch(v.color)?.key).filter(Boolean));
 if(known.size<2)return [];
 const colors=new Map();
 for(const v of variants){if(v.stock_disponible!==true)continue;const swatch=colorSwatch(v.color);if(swatch&&!colors.has(swatch.key))colors.set(swatch.key,{...swatch,variant:v});}
 return [...colors.values()];
}
