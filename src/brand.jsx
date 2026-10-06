import React from 'react';

export const BRAND_MARK='/brand/gm-mark-v1.png';
export function BrandMark({className='',decorative=false}){
 return <img className={'brand-mark '+className} src={BRAND_MARK} alt={decorative?'':'GM Electronics'} width="1280" height="1280" decoding="async"/>;
}
export function BrandLogo(){return <div className="logo"><BrandMark/><span className="electronics">ELECTRONICS</span></div>}
