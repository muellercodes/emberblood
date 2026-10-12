
// ================= drawing: effects
function rr(x,y,w,h,r){ r=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function drawTele(e){
  const T=e.tele; if(!T) return;
  const k=clamp(T.t/T.dur,0,1), col=T.col||'255,70,40';
  ctx.save();
  if(T.shape==='arc'||T.shape==='cone'){
    let ox=e.x, oy=e.y, ang=e.face;
    if(T.mouth){ ox=e.mouthX; oy=e.mouthY; ang=e.face+e.headRel; }
    else if(T.shape==='cone'){ ox=e.x+Math.cos(ang)*e.r; oy=e.y+Math.sin(ang)*e.r; }
    ctx.translate(ox,oy); ctx.rotate(ang);
    const R=T.r||T.len, h=T.half;
    ctx.fillStyle=`rgba(${col},${0.1+0.1*k})`; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R,-h,h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=`rgba(${col},${0.45+0.4*k})`; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=`rgba(${col},0.22)`; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,Math.max(1,R*k),-h,h); ctx.closePath(); ctx.fill();
  }else if(T.shape==='line'){
    ctx.translate(e.x,e.y); ctx.rotate(e.face);
    const L=T.len, w=T.w;
    ctx.fillStyle=`rgba(${col},${0.1+0.1*k})`; ctx.fillRect(0,-w/2,L,w);
    ctx.strokeStyle=`rgba(${col},${0.45+0.4*k})`; ctx.lineWidth=2; ctx.strokeRect(0,-w/2,L,w);
    ctx.fillStyle=`rgba(${col},0.25)`; ctx.fillRect(0,-w/2,L*k,w);
    ctx.fillStyle=`rgba(${col},${0.5+0.4*k})`; ctx.beginPath(); ctx.moveTo(L+14,0); ctx.lineTo(L,-w/2-4); ctx.lineTo(L,w/2+4); ctx.closePath(); ctx.fill();
  }else if(T.shape==='circle'){
    ctx.fillStyle=`rgba(${col},${0.1+0.1*k})`; ctx.beginPath(); ctx.arc(e.x,e.y,T.r,0,TAU); ctx.fill();
    ctx.strokeStyle=`rgba(${col},${0.45+0.4*k})`; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=`rgba(${col},0.2)`; ctx.beginPath(); ctx.arc(e.x,e.y,Math.max(1,T.r*k),0,TAU); ctx.fill();
  }else if(T.shape==='donut'){
    ctx.fillStyle=`rgba(${col},${0.1+0.1*k})`; ctx.beginPath(); ctx.arc(e.x,e.y,T.r2,0,TAU); ctx.arc(e.x,e.y,T.r1,0,TAU,true); ctx.fill();
    ctx.strokeStyle=`rgba(${col},${0.45+0.4*k})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y,T.r2,0,TAU); ctx.stroke();
    ctx.strokeStyle=`rgba(${col},0.35)`; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(e.x,e.y,lerp(T.r1,T.r2,k),0,TAU); ctx.stroke();
  }
  ctx.restore();
}
function drawHazards(){
  for(const h of G.hazards){
    const k=clamp(h.t/h.delay,0,1);
    if(h.kind==='spawn'){
      const R=h.big?62:22;
      ctx.save(); ctx.translate(h.x,h.y); ctx.rotate(G.time*2);
      const gr=ctx.createRadialGradient(0,0,0,0,0,R); gr.addColorStop(0,`rgba(190,110,255,${0.3*k})`); gr.addColorStop(1,'rgba(190,110,255,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.fill();
      ctx.strokeStyle=`rgba(200,130,255,${0.4+0.5*k})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,R*(0.6+0.4*k),0,TAU); ctx.stroke();
      ctx.fillStyle=`rgba(220,170,255,${0.5+0.5*k})`; for(let i=0;i<6;i++){ const a=i/6*TAU; ctx.fillRect(Math.cos(a)*R*0.8-2,Math.sin(a)*R*0.8-2,4,4); }
      ctx.restore();
    }else if(h.kind==='blast'){
      const hc=h.toxic?'120,200,60':'255,60,30';
      ctx.fillStyle=`rgba(${hc},${0.1+0.12*k})`; ctx.beginPath(); ctx.arc(h.x,h.y,h.r,0,TAU); ctx.fill();
      ctx.strokeStyle=h.toxic?`rgba(150,220,90,${0.5+0.4*k})`:`rgba(255,90,50,${0.5+0.4*k})`; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle=h.toxic?'rgba(150,220,90,.25)':'rgba(255,120,60,.25)'; ctx.beginPath(); ctx.arc(h.x,h.y,Math.max(1,h.r*k),0,TAU); ctx.fill();
      if(h.lob&&h.toxic){ const x=lerp(h.fx,h.x,k), y=lerp(h.fy,h.y,k)-Math.sin(Math.PI*k)*110; ctx.fillStyle='#6aa83a'; ctx.beginPath(); ctx.arc(x,y,7,0,TAU); ctx.fill(); ctx.fillStyle='#c8f090'; ctx.beginPath(); ctx.arc(x-2,y-2,2.5,0,TAU); ctx.fill(); }
      else if(h.lob){ const x=lerp(h.fx,h.x,k), y=lerp(h.fy,h.y,k)-Math.sin(Math.PI*k)*90; ctx.fillStyle='#5a3a20'; ctx.beginPath(); ctx.arc(x,y,6,0,TAU); ctx.fill(); ctx.fillStyle='#ffcf6a'; ctx.beginPath(); ctx.arc(x+3,y-5,2,0,TAU); ctx.fill(); }
      if(h.meteor){ const mx=h.x+(1-k)*160, my=h.y-(1-k)*520; ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(mx,my,0,mx,my,22); g.addColorStop(0,'rgba(255,240,190,1)'); g.addColorStop(0.4,'rgba(255,130,40,.9)'); g.addColorStop(1,'rgba(255,80,20,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(mx,my,22,0,TAU); ctx.fill(); ctx.restore(); }
    }
  }
}
function drawPools(){
  for(const pl of G.pools){
    const a=clamp(pl.life/pl.max,0,1)*Math.min(1,(pl.max-pl.life)*6+0.3);
    const c=pl.kind==='toxic'?'110,180,60':pl.owner==='player'?'255,170,60':'255,80,30';
    const g=ctx.createRadialGradient(pl.x,pl.y,0,pl.x,pl.y,pl.r);
    g.addColorStop(0,`rgba(${c},${0.5*a})`); g.addColorStop(0.7,`rgba(${c},${0.25*a})`); g.addColorStop(1,`rgba(${c},0)`);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(pl.x,pl.y,pl.r,0,TAU); ctx.fill();
  }
}
function heartPath(x,y,s){ ctx.beginPath(); ctx.moveTo(x,y+s*0.9); ctx.bezierCurveTo(x-s*1.2,y+s*0.1,x-s*0.6,y-s*0.9,x,y-s*0.3); ctx.bezierCurveTo(x+s*0.6,y-s*0.9,x+s*1.2,y+s*0.1,x,y+s*0.9); ctx.closePath(); }
function drawPickups(){
  for(const k of G.pickups){
    if(k.life<3&&Math.floor(k.life*8)%2===0) continue;
    const s=(k.big?10:7)*(1+0.12*Math.sin(k.t*6)), y=k.y-4+Math.sin(k.t*4)*2;
    ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(k.x,y,0,k.x,y,s*2.6); g.addColorStop(0,'rgba(255,110,120,.55)'); g.addColorStop(1,'rgba(255,60,80,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(k.x,y,s*2.6,0,TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle='#ff4d63'; heartPath(k.x,y,s); ctx.fill(); ctx.strokeStyle='#7a0f1e'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(k.x-s*0.35,y-s*0.2,s*0.18,0,TAU); ctx.fill();
  }
}
function drawProjectiles(){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const pr of G.projectiles){
    if(pr.kind==='wave'&&!pr.reflected){
      ctx.save(); ctx.translate(pr.x,pr.y); ctx.rotate(Math.atan2(pr.vy,pr.vx));
      ctx.strokeStyle=`rgba(255,170,70,${clamp(pr.life*2,0,1)})`; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(-10,0,26,-1.1,1.1); ctx.stroke();
      ctx.strokeStyle='rgba(255,240,200,.9)'; ctx.lineWidth=2.5; ctx.stroke(); ctx.restore(); continue;
    }
    let c1='255,120,40', c2='255,240,190';
    if(pr.kind==='pip'){ c1='255,150,60'; c2='255,240,200'; } else if(pr.owner==='player'){ c1='120,220,255'; c2='255,255,255'; } else if(pr.kind==='orb'){ c1='190,100,255'; c2='255,220,255'; } else if(pr.kind==='ice'){ c1='160,210,255'; c2='240,250,255'; }
    const r=pr.r*(pr.kind==='orb'?1+0.15*Math.sin(pr.t*12):1)*2.4;
    const g=ctx.createRadialGradient(pr.x,pr.y,0,pr.x,pr.y,r); g.addColorStop(0,`rgba(${c2},1)`); g.addColorStop(0.35,`rgba(${c1},.9)`); g.addColorStop(1,`rgba(${c1},0)`);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(pr.x,pr.y,r,0,TAU); ctx.fill();
  }
  ctx.restore();
}
function drawParticles(){
  const P=G.particles;
  for(const q of P){ if(q.glow) continue; ctx.fillStyle=`rgba(${q.col},${(q.life/q.max)*0.6*q.al})`; ctx.beginPath(); ctx.arc(q.x,q.y,q.size,0,TAU); ctx.fill(); }
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const q of P){
    if(!q.glow) continue;
    const f=q.life/q.max; let col=q.col, a=f;
    if(q.kind==='fire'){ col=f>0.7?'255,236,170':f>0.45?'255,150,50':f>0.2?'220,70,25':'90,30,20'; a=Math.min(1,f*1.6)*0.85; }
    ctx.fillStyle=`rgba(${col},${a})`; ctx.beginPath(); ctx.arc(q.x,q.y,q.size,0,TAU); ctx.fill();
  }
  ctx.restore();
}
function drawRings(){
  for(const R of G.rings){
    if(R.delay>0) continue;
    const a=clamp(1-R.rad/R.max,0,1);
    if(R.owner==='player'){ ctx.strokeStyle=`rgba(255,200,110,${a*0.9})`; ctx.lineWidth=Math.max(1,R.thick*a); }
    else if(R.dmg>0){ ctx.strokeStyle=`rgba(255,80,40,${0.35+a*0.6})`; ctx.lineWidth=R.thick; }
    else { ctx.strokeStyle=`rgba(255,170,80,${a*0.6})`; ctx.lineWidth=R.thick*a+2; }
    ctx.beginPath(); ctx.arc(R.x,R.y,R.rad,0,TAU); ctx.stroke();
    if(R.owner!=='player'&&R.dmg>0){ ctx.strokeStyle=`rgba(255,220,150,${0.5*a+0.2})`; ctx.lineWidth=3; ctx.stroke(); }
  }
}
function drawTexts(){
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
  for(const t of G.texts){
    ctx.globalAlpha=clamp(t.life/t.max*1.6,0,1);
    ctx.font=`800 ${t.size}px Rubik,system-ui,sans-serif`;
    ctx.lineWidth=3.5; ctx.strokeStyle='rgba(0,0,0,.75)'; ctx.strokeText(t.txt,t.x,t.y); ctx.fillStyle=t.col; ctx.fillText(t.txt,t.x,t.y);
  }
  ctx.globalAlpha=1;
}


function drawVorlaxis(e){
  const fl=e.flash>0, alt=e.alt||0, sc=e.scale||1, dying=e.dead&&e.deathT!=null;
  const sh=1-alt/500;
  ctx.fillStyle=`rgba(0,0,0,${0.35*sh})`; ctx.beginPath(); ctx.ellipse(e.x,e.y+10,130*sh,90*sh,e.face,0,TAU); ctx.fill();
  let alpha=e.alpha; if(dying) alpha=clamp(1-e.deathT/2.6,0,1);
  if(alpha<=0.01) return;
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(e.x,e.y-alt); ctx.rotate(e.face); ctx.scale(sc,sc);
  const white=fl||(dying&&Math.floor(e.deathT*10)%2===0);
  const body=white?'#ffffff':'#4a1114', dark=white?'#eeeeee':'#260809', mem=white?'rgba(255,255,255,.8)':'rgba(70,14,16,0.92)', bone=white?'#fff':'#1a0506';
  const t=e.t, fast=e.state==='takeoff'||e.state==='flying'||e.state==='landW', flap=Math.sin(t*(fast?9:1.6));
  const spread=e.state==='roarShift'?1.25:1;
  ctx.lineCap='round'; ctx.lineJoin='round';
  // tail
  let px=-48, py=0, ang=Math.PI; const segs=[];
  for(let i=0;i<10;i++){ ang+=Math.sin(t*1.8-i*0.55)*0.09+(e.tailFx||0)*0.32; px+=Math.cos(ang)*17; py+=Math.sin(ang)*17; segs.push([px,py,20-i*1.7]); }
  ctx.fillStyle=dark; for(const [x,y,r] of segs){ ctx.beginPath(); ctx.arc(x,y,r+2,0,TAU); ctx.fill(); }
  ctx.fillStyle=body; for(const [x,y,r] of segs){ ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
  ctx.fillStyle=white?'#fff':'#c9b48c'; for(let i=0;i<segs.length;i+=2){ const [x,y,r]=segs[i]; ctx.beginPath(); ctx.moveTo(x-r*0.3,y); ctx.lineTo(x,y-r*0.5); ctx.lineTo(x+r*0.3,y); ctx.lineTo(x,y+r*0.5); ctx.closePath(); ctx.fill(); }
  { const [x,y]=segs[segs.length-1], [x2,y2]=segs[segs.length-2], ta=Math.atan2(y-y2,x-x2); ctx.save(); ctx.translate(x,y); ctx.rotate(ta); ctx.fillStyle=dark; ctx.beginPath(); ctx.moveTo(22,0); ctx.lineTo(0,-12); ctx.lineTo(4,0); ctx.lineTo(0,12); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // wings
  for(const s of [-1,1]){
    const w=(0.85+flap*0.15)*spread;
    ctx.save(); ctx.scale(1,s*w);
    ctx.fillStyle=mem; ctx.beginPath(); ctx.moveTo(20,20); ctx.lineTo(-10,120); ctx.lineTo(-60,150); ctx.quadraticCurveTo(-70,110,-95,105); ctx.quadraticCurveTo(-90,75,-115,60); ctx.quadraticCurveTo(-90,40,-45,28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=bone; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(20,20); ctx.lineTo(-10,120); ctx.lineTo(-60,150); ctx.moveTo(-10,120); ctx.lineTo(-95,105); ctx.moveTo(-10,120); ctx.lineTo(-115,60); ctx.stroke();
    ctx.fillStyle=white?'#fff':'#c9b48c'; ctx.beginPath(); ctx.moveTo(-10,116); ctx.lineTo(-4,130); ctx.lineTo(-16,124); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // legs
  ctx.fillStyle=dark;
  for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(28,s*40,12,9,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-26,s*42,13,10,0,0,TAU); ctx.fill(); }
  ctx.fillStyle=white?'#fff':'#d8c7a0'; for(const s of [-1,1]) for(const lx of [36,-16]){ for(let c=-1;c<=1;c++){ ctx.beginPath(); ctx.arc(lx+4,s*(41+c*5),2,0,TAU); ctx.fill(); } }
  // body
  const g=ctx.createRadialGradient(-5,-10,10,0,0,70); g.addColorStop(0,white?'#fff':'#6e1d1c'); g.addColorStop(1,body);
  ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,0,62,44,0,0,TAU); ctx.fill();
  ctx.fillStyle=white?'#fff':'#c9b48c'; for(let x=-50;x<=40;x+=13){ ctx.beginPath(); ctx.moveTo(x-5,0); ctx.lineTo(x,-6); ctx.lineTo(x+5,0); ctx.lineTo(x,6); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle=`rgba(255,120,40,${0.5+0.3*Math.sin(t*3)})`; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(-30,-26); ctx.lineTo(-18,-16); ctx.lineTo(-24,-6); ctx.moveTo(14,22); ctx.lineTo(24,14); ctx.lineTo(34,20); ctx.moveTo(-6,30); ctx.lineTo(4,24); ctx.moveTo(18,-30); ctx.lineTo(10,-20); ctx.stroke();
  // neck + head
  const hr=e.headRel, hx=48+Math.cos(hr)*58, hy=Math.sin(hr)*58;
  ctx.strokeStyle=dark; ctx.lineWidth=36; ctx.beginPath(); ctx.moveTo(20,0); ctx.quadraticCurveTo(58,0,hx,hy); ctx.stroke();
  ctx.strokeStyle=body; ctx.lineWidth=30; ctx.stroke();
  ctx.save(); ctx.translate(hx,hy); ctx.rotate(hr);
  if(e.staggered) ctx.scale(0.95,0.95);
  ctx.strokeStyle=white?'#fff':'#d9c7a0'; ctx.lineWidth=8;
  for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(-4,s*14); ctx.quadraticCurveTo(-20,s*34,-46,s*40); ctx.stroke(); }
  ctx.lineWidth=5; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(4,s*16); ctx.quadraticCurveTo(-4,s*28,-18,s*30); ctx.stroke(); }
  ctx.fillStyle=body; ctx.beginPath(); ctx.ellipse(0,0,26,20,0,0,TAU); ctx.fill();
  const open=e.state==='breath'||e.state==='breathW'||e.state==='fbW'||e.state==='roarShift'||e.state==='summonW';
  if(open){
    ctx.fillStyle=body; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(8,s*4); ctx.quadraticCurveTo(40,s*16,50,s*9); ctx.lineTo(16,s*14); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle='#1a0303'; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(50,-8); ctx.lineTo(50,8); ctx.closePath(); ctx.fill();
  }else{ ctx.beginPath(); ctx.moveTo(10,-14); ctx.quadraticCurveTo(44,-10,48,0); ctx.quadraticCurveTo(44,10,10,14); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=dark; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(42,s*5,2.2,0,TAU); ctx.fill(); }
  ctx.save(); ctx.shadowColor='#ff9a1a'; ctx.shadowBlur=10; ctx.fillStyle='#ffb020'; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(8,s*11,5,2.6,s*0.3,0,TAU); ctx.fill(); } ctx.restore();
  if(e.mouthGlow>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; const mg=ctx.createRadialGradient(48,0,0,48,0,34*e.mouthGlow+4); mg.addColorStop(0,'rgba(255,230,150,.95)'); mg.addColorStop(1,'rgba(255,110,30,0)'); ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(48,0,34*e.mouthGlow+4,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}
