
// ================= drawing: characters (shaded, light from the upper left of the world)
function lightLocal(f){ const a=-f, x=-0.6, y=-0.7; return {x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)}; }
function rg(cx,cy,r,L,c0,c1,c2){ const g=ctx.createRadialGradient(cx+L.x*r*0.5,cy+L.y*r*0.5,r*0.08,cx,cy,r*1.08); g.addColorStop(0,c0); g.addColorStop(0.55,c1); g.addColorStop(1,c2); return g; }
function ell(x,y,rx,ry,fill){ ctx.fillStyle=fill; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); }
function drawSteel(len,w,fin,tier){
  const g=ctx.createLinearGradient(0,-w,0,w);
  if(tier>0){ g.addColorStop(0,'#f2fbff'); g.addColorStop(0.45,tier>=3?'#7ac8ff':tier===2?'#9ccfee':'#b4cfe2'); g.addColorStop(1,tier>=3?'#2a5a9a':'#4a6070'); }
  else{ g.addColorStop(0,fin?'#fff2d8':'#f4f7fa'); g.addColorStop(0.45,fin?'#e8c8a0':'#aeb6c0'); g.addColorStop(1,'#5a626c'); }
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(2,-w); ctx.lineTo(len-6,-w); ctx.lineTo(len,0); ctx.lineTo(len-6,w); ctx.lineTo(2,w); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(60,66,74,.6)'; ctx.lineWidth=0.6; ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(len-8,0); ctx.stroke();
}
function drawHeroBlade(a,len,fin,idle){
  ctx.save();
  if(idle){ ctx.translate(2,13); ctx.rotate(-0.2); } else { ctx.rotate(a); ctx.translate(8,0); }
  const L=idle?30:len-8;
  ctx.fillStyle='#3a2414'; ctx.fillRect(-6,-1.5,6,3);
  ctx.fillStyle='#c9963a'; ctx.fillRect(-1,-5,2.6,10); ctx.beginPath(); ctx.arc(-6.5,0,1.8,0,TAU); ctx.fill();
  const tier=G&&G.tier||0; drawSteel(L,2.2,fin,tier);
  if(tier>=2&&!idle){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(120,190,255,${0.25+0.1*tier})`; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(L,0); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
function drawHero(x,y,f,p,ghost){
  ctx.save(); ctx.translate(x,y); ctx.rotate(f);
  const L=lightLocal(f), fl=!ghost&&p.hurtFlash>0, mv=p.moving?1:0, sw=Math.sin(p.walkT*10)*mv;
  if(ghost){ ctx.globalAlpha*=0.5; ell(0,0,12,13,'rgba(255,150,90,.5)'); ctx.restore(); return; }
  if(p.dashT>0){ const k=Math.sin((1-p.dashT/0.3)*Math.PI); ctx.scale(1-0.2*k,1+0.06*k); }
  ctx.lineCap='round'; ctx.lineJoin='round';
  // tail
  const ts=Math.sin(p.t*2.2+p.walkT*6)*0.5;
  ctx.strokeStyle='#5e1a10'; ctx.lineWidth=7.5; ctx.beginPath(); ctx.moveTo(-8,0); ctx.quadraticCurveTo(-22,-ts*10,-34,ts*14); ctx.stroke();
  ctx.strokeStyle=fl?'#fff':'#9a3420'; ctx.lineWidth=4.5; ctx.stroke();
  // boots
  ell(3+sw*4,-6,4.6,3,'#2a1c12'); ell(3-sw*4,6,4.6,3,'#2a1c12');
  // cloak
  const cs=Math.sin(p.t*3+p.walkT*8)*(1+mv*2);
  ctx.fillStyle=rg(-8,0,16,L,'#7a2a20','#4a1410','#200606');
  ctx.beginPath(); ctx.moveTo(3,-12); ctx.quadraticCurveTo(-16,-15+cs,-23,-6+cs*0.6); ctx.quadraticCurveTo(-26,0,-23,6-cs*0.6); ctx.quadraticCurveTo(-16,15-cs,3,12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=0.8; for(const k of [-6,0,6]){ ctx.beginPath(); ctx.moveTo(-4,k*1.2); ctx.lineTo(-21,k*1.5+cs*0.3); ctx.stroke(); }
  // torso (leather armor)
  ctx.fillStyle=fl?'#fff':rg(0,0,12,L,'#9a7048','#6a4a2c','#3a2616'); ctx.beginPath(); ctx.ellipse(0,0,10,12.5,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(30,18,8,.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-2,-11); ctx.lineTo(-2,11); ctx.stroke();
  // arms
  const armA=p.swingT>0?0:0.4;
  ell(6,-11,4,3.2,fl?'#fff':'#a8402a'); ell(6+Math.cos(armA)*3,12,4,3.2,fl?'#fff':'#a8402a');
  // pauldrons
  for(const s of [-1,1]){ ctx.fillStyle=rg(1,s*10.5,5.5,L,'#d8dde3','#8a929c','#3a3e44'); ctx.beginPath(); ctx.ellipse(1,s*10.5,5.5,4.4,0,0,TAU); ctx.fill(); }
  // head
  ctx.fillStyle=fl?'#fff':rg(9,0,8,L,'#e2694a','#b0402a','#5e1a10'); ctx.beginPath(); ctx.ellipse(9,0,7.4,6.6,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12,-4.2); ctx.quadraticCurveTo(22.5,-1.5,22,0); ctx.quadraticCurveTo(22.5,1.5,12,4.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(40,8,4,.6)'; ctx.beginPath(); ctx.arc(20,-1.2,0.7,0,TAU); ctx.arc(20,1.2,0.7,0,TAU); ctx.fill();
  ctx.fillStyle='#5e1a10'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(6-i*2.8,-1.2); ctx.lineTo(3-i*2.8,0); ctx.lineTo(6-i*2.8,1.2); ctx.closePath(); ctx.fill(); }
  for(const s of [-1,1]){ const g=ctx.createLinearGradient(8,s*4,-7,s*11); g.addColorStop(0,'#f6ecd0'); g.addColorStop(1,'#9a8a6a'); ctx.strokeStyle=g; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(8,s*4); ctx.quadraticCurveTo(2,s*9.5,-7,s*10.5); ctx.stroke(); }
  ctx.fillStyle='#ffd34d'; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(13,s*3.1,1.5,0.9,0,0,TAU); ctx.fill(); }
  // weapon
  const st=p.stats;
  const armed=!(G&&G.mode==='story'&&!G.flags.forge);
  if(!armed){ if(p.drinkT>0){ ctx.fillStyle='rgba(120,255,160,.85)'; ctx.beginPath(); ctx.arc(15,7,3,0,TAU); ctx.fill(); } }
  else if(p.drinkT>0){ ctx.fillStyle='rgba(120,255,160,.85)'; ctx.beginPath(); ctx.arc(15,7,3,0,TAU); ctx.fill(); ctx.strokeStyle='#d8e8e0'; ctx.lineWidth=1; ctx.stroke(); drawHeroBlade(0,30,false,true); }
  else if(p.swingT>0){
    const pr=1-p.swingT/p.swingDur, ez=1-Math.pow(1-pr,2.2), span=p.swingFin?1.4:1.15, a0=-p.swingSide*span, a1=p.swingSide*span, a=lerp(a0,a1,ez);
    const R=st.range*(p.swingFin?1.25:1), lo=Math.min(a0,a), hi=Math.max(a0,a);
    const g=ctx.createRadialGradient(0,0,R*0.3,0,0,R); g.addColorStop(0,'rgba(255,240,220,0)'); g.addColorStop(0.8,p.swingFin?'rgba(255,190,110,.42)':'rgba(240,244,250,.3)'); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,R,lo,hi); ctx.arc(0,0,R*0.3,hi,lo,true); ctx.closePath(); ctx.fill();
    drawHeroBlade(a,R*0.92,p.swingFin,false);
  }else drawHeroBlade(0,30,false,true);
  if(p.breathing){ const g=ctx.createRadialGradient(22,0,0,22,0,16); g.addColorStop(0,'rgba(255,240,180,.95)'); g.addColorStop(1,'rgba(255,120,40,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(22,0,16,0,TAU); ctx.fill(); }
  ctx.restore();
}
function drawPlayer(){
  const p=player; if(p.dead) return;
  for(const g of p.ghosts){ ctx.globalAlpha=g.a*0.5; drawHero(g.x,g.y,g.f,p,true); }
  ctx.globalAlpha=(p.iframes>0&&p.iframes<5&&p.dashT<=0&&Math.floor(p.t*18)%2===0)?0.55:1;
  drawHero(p.x,p.y,p.facing,p,false);
  ctx.globalAlpha=1;
}
// ---------- foes
function drawKobold(e,k,fl,chief){
  ctx.save(); ctx.translate(e.x,e.y);
  if(chief&&e.state==='spin'){ ctx.fillStyle='rgba(255,230,180,.16)'; ctx.beginPath(); ctx.arc(0,0,e.r+30,0,TAU); ctx.fill(); }
  ctx.rotate(e.face); ctx.scale(k,k);
  const L=lightLocal(e.face), step=Math.sin(e.t*10)*2*(Math.hypot(e.dx,e.dy)>5?1:0);
  const sk=fl?['#fff','#eee','#ccc']:chief?['#c2a862','#8a7438','#4a3c18']:['#a89458','#7a6834','#3e3418'];
  ctx.lineCap='round';
  ctx.strokeStyle=sk[2]; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-6,0); ctx.quadraticCurveTo(-14,Math.sin(e.t*4)*5,-19,Math.sin(e.t*4+1)*7); ctx.stroke();
  ell(2+step,-6,3.5,2.4,'#2a2212'); ell(2-step,6,3.5,2.4,'#2a2212');
  if(chief){ ctx.fillStyle=rg(-2,0,13,L,'#8a7a6a','#5a4a3a','#2a2016'); ctx.beginPath(); ctx.ellipse(-2,0,10,12,0,0,TAU); ctx.fill(); }
  ctx.fillStyle=rg(0,0,9,L,sk[0],sk[1],sk[2]); ctx.beginPath(); ctx.ellipse(0,0,8,9,0,0,TAU); ctx.fill();
  ctx.fillStyle=fl?'#ddd':'#5a3a20'; ctx.beginPath(); ctx.ellipse(-1,0,5,7,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=0.8; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(-5,i*3); ctx.lineTo(3,i*3); ctx.stroke(); }
  ctx.fillStyle=rg(8,0,6,L,sk[0],sk[1],sk[2]); ctx.beginPath(); ctx.ellipse(8,0,5.5,5,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10,-3); ctx.quadraticCurveTo(17,0,10,3); ctx.closePath(); ctx.fill();
  ctx.fillStyle=sk[2]; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(6,s*3); ctx.lineTo(1,s*8.5); ctx.lineTo(4,s*3); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle='#ffd84a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(11,s*2.1,0.9,0,TAU); ctx.fill(); }
  if(!chief){
    const pull=e.state==='windup'?-5:e.state==='strike'?6:0;
    const wg=ctx.createLinearGradient(0,6,0,8); wg.addColorStop(0,'#8a6a42'); wg.addColorStop(1,'#4a3420');
    ctx.strokeStyle=wg; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-7+pull,7); ctx.lineTo(16+pull,7); ctx.stroke();
    ctx.save(); ctx.translate(16+pull,7); drawSteel(7,1.8,false); ctx.restore();
  }else{
    ctx.fillStyle='#e8dfcc'; for(let i=-2;i<=2;i++){ const a=Math.PI+i*0.5, cx=8+Math.cos(a)*4, cy=Math.sin(a)*5; ctx.beginPath(); ctx.moveTo(cx-1.5,cy-1.5); ctx.lineTo(cx-6,cy+Math.sin(a)*3); ctx.lineTo(cx+1.5,cy+1.5); ctx.closePath(); ctx.fill(); }
    for(const s of [-1,1]){ ctx.save(); ctx.translate(4,s*9); ctx.rotate(s*(e.state==='cleave'?-0.8:0.4)); ctx.fillStyle='#4a3420'; ctx.fillRect(0,-1,10,2); ctx.translate(8,0); ctx.fillStyle='#9aa2ac'; ctx.beginPath(); ctx.moveTo(0,-1); ctx.lineTo(6,-5); ctx.lineTo(7.5,2); ctx.lineTo(0,2); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  ctx.restore();
}
function drawCultist(e,k,fl,priest){
  ctx.save(); ctx.translate(e.x,e.y);
  if(priest&&e.alpha>0.5){ ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=0;i<3;i++){ const a=e.t*2+i*TAU/3, x=Math.cos(a)*30, y=Math.sin(a)*30; const g=ctx.createRadialGradient(x,y,0,x,y,6); g.addColorStop(0,'rgba(255,200,255,.9)'); g.addColorStop(1,'rgba(180,90,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,6,0,TAU); ctx.fill(); } ctx.restore(); }
  ctx.rotate(e.face); ctx.scale(k,k);
  const L=lightLocal(e.face);
  const rb=fl?['#fff','#eee','#ccc']:priest?['#7a3a8e','#4e1e60','#1e0a28']:['#5e3a6e','#3a2048','#160a1e'];
  ctx.fillStyle=rg(-1,0,12,L,rb[0],rb[1],rb[2]); ctx.beginPath(); ctx.ellipse(-1,0,11,12,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=0.8; for(const s of [-7,-2,3]){ ctx.beginPath(); ctx.moveTo(-9,s); ctx.quadraticCurveTo(-3,s+1.5,5,s); ctx.stroke(); }
  ctx.strokeStyle=priest?'#d8a840':'#8a4a2a'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(-1,0,11,12,0,-1.2,1.2); ctx.stroke();
  ctx.fillStyle=rg(3,0,7,L,rb[0],rb[1],'#0a0410'); ctx.beginPath(); ctx.ellipse(3,0,7,7,0,0,TAU); ctx.fill();
  ctx.fillStyle='#0a0408'; ctx.beginPath(); ctx.ellipse(6.2,0,3.4,4.4,0,0,TAU); ctx.fill();
  ctx.fillStyle='#ff9a3a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(7.6,s*1.5,0.8,0,TAU); ctx.fill(); }
  const casting=['cast','volley','ring','orbs','summon'].includes(e.state), cg=casting?clamp(1-e.st/0.6,0,1):0;
  for(const s of [-1,1]){
    ell(8,s*8,2.6,2.3,casting?`rgb(255,${150+cg*80|0},70)`:'#c8a888');
    if(casting){ ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(8,s*8,0,8,s*8,10+cg*4); g.addColorStop(0,'rgba(255,200,90,.85)'); g.addColorStop(1,'rgba(255,120,40,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(8,s*8,10+cg*4,0,TAU); ctx.fill(); ctx.restore(); }
  }
  ctx.restore();
}
function drawDrake(e,k,fl,brood){
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.face); ctx.scale(k,k);
  const L=lightLocal(e.face);
  const bc=fl?['#fff','#eee','#ccc']:brood?['#b44a70','#7a2446','#3a0a1e']:['#e8844a','#b4542a','#5a2410'];
  const fr=e.state==='charge'?28:16, flap=Math.sin(e.t*fr)*0.5+0.5;
  ctx.lineCap='round';
  ctx.strokeStyle=bc[2]; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(-8,0); ctx.quadraticCurveTo(-16,Math.sin(e.t*6)*4,-24,Math.sin(e.t*6+1)*6); ctx.stroke();
  for(const s of [-1,1]){
    const sp=9+flap*10;
    const wg=ctx.createLinearGradient(0,0,0,s*(5+sp)); wg.addColorStop(0,brood?'rgba(90,20,50,.95)':'rgba(130,50,24,.95)'); wg.addColorStop(1,brood?'rgba(170,70,110,.55)':'rgba(220,120,70,.5)');
    ctx.fillStyle=wg; ctx.beginPath(); ctx.moveTo(4,s*3); ctx.lineTo(-2,s*(5+sp)); ctx.lineTo(-10,s*(3+sp*0.7)); ctx.lineTo(-8,s*3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=bc[2]; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(4,s*3); ctx.lineTo(-2,s*(5+sp)); ctx.moveTo(1,s*4); ctx.lineTo(-8,s*(3+sp*0.7)); ctx.stroke();
  }
  ctx.fillStyle=rg(0,0,11,L,bc[0],bc[1],bc[2]); ctx.beginPath(); ctx.ellipse(0,0,11,6.5,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(11,0,5,4,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(13,-2.5); ctx.lineTo(19,0); ctx.lineTo(13,2.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle=bc[2]; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(-6+i*3.6,0,1,0,TAU); ctx.fill(); }
  ctx.strokeStyle='#efe0c0'; ctx.lineWidth=1.2; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(10,s*2.5); ctx.lineTo(6,s*6); ctx.stroke(); }
  ctx.fillStyle='#ffe066'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(13,s*1.8,0.8,0,TAU); ctx.fill(); }
  if(e.state==='breath'||e.state==='breathW'){ ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(19,0,0,19,0,8); g.addColorStop(0,'rgba(255,230,160,.9)'); g.addColorStop(1,'rgba(255,120,40,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(19,0,8,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function drawKnight(e,k,fl,champ){
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.face); ctx.scale(k,k);
  const L=lightLocal(e.face), st=fl?['#fff','#eee','#ccc']:['#7a808c','#3a3e48','#121418'];
  if(champ){ const cg=ctx.createLinearGradient(-4,0,-32,0); cg.addColorStop(0,'#7a1a14'); cg.addColorStop(1,'#3a0806'); ctx.fillStyle=cg; ctx.beginPath(); ctx.moveTo(-3,-15); ctx.quadraticCurveTo(-34,Math.sin(e.t*3)*6,-3,15); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=rg(0,0,17,L,st[0],st[1],st[2]); ctx.beginPath(); ctx.ellipse(0,0,15,18,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(0,0,11,14,0,-2.4,-1.2); ctx.stroke();
  if(champ){ ctx.strokeStyle='rgba(255,130,40,.8)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-8,-8); ctx.lineTo(-3,-2); ctx.lineTo(-7,5); ctx.moveTo(-10,6); ctx.lineTo(-5,11); ctx.stroke(); }
  for(const s of [-1,1]){ ctx.fillStyle=rg(-1,s*14,7,L,st[0],st[1],st[2]); ctx.beginPath(); ctx.ellipse(-1,s*14,7,6,0,0,TAU); ctx.fill(); }
  ctx.fillStyle=rg(3,0,8,L,st[0],st[1],st[2]); ctx.beginPath(); ctx.arc(3,0,8,0,TAU); ctx.fill();
  ctx.strokeStyle='#ff8a2a'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(9,-3.5); ctx.lineTo(9,3.5); ctx.stroke();
  const raise=e.state==='windup'||e.state==='slashW'||e.state==='quakeW', target=raise?-2.2:(e.swung>0?0.25:0.9);
  e.swordA=lerp(e.swordA==null?0.9:e.swordA,target,0.3);
  ctx.save(); ctx.translate(4,14); ctx.rotate(e.swordA); ctx.fillStyle='#3a2a1a'; ctx.fillRect(-6,-2,6,4); ctx.fillStyle='#b8943a'; ctx.fillRect(-1,-5,2.5,10); drawSteel(30,2.2,false); ctx.restore();
  if(e.blocking){
    ctx.lineWidth=7; ctx.strokeStyle=fl?'#fff':'#1a1a20'; ctx.beginPath(); ctx.arc(0,0,21,-1.0,1.0); ctx.stroke();
    ctx.lineWidth=1.6; ctx.strokeStyle='rgba(200,170,110,.75)'; ctx.beginPath(); ctx.arc(0,0,24.4,-1.0,1.0); ctx.stroke();
  }else{ ctx.lineWidth=6; ctx.strokeStyle='#1a1a20'; ctx.beginPath(); ctx.arc(0,0,20,-2.5,-1.4); ctx.stroke(); }
  ctx.restore();
}
function drawWolf(e,fl,k,alpha){
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.face); if(k) ctx.scale(k,k);
  const L=lightLocal(e.face), run=Math.hypot(e.dx,e.dy)>20, g=e.t*(run?16:6), fur=fl?['#fff','#eee','#ccc']:alpha?['#f4f6f8','#bcc6d0','#6a7480']:e.snowy?['#d8dde2','#9aa2aa','#4a5058']:['#9a9a96','#5e5e5a','#2a2a28'];
  if(alpha){ ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(2,0,15,8.5,0,0,TAU); ctx.fill(); }
  for(const [lx,ly,ph] of [[8,-5,0],[8,5,Math.PI],[-7,-5,Math.PI],[-7,5,0]]){ const o=run?Math.sin(g+ph)*4:0; ell(lx+o,ly,3,1.8,'#2a2622'); }
  ctx.fillStyle=rg(-12,0,7,L,fur[1],fur[2],'#1a1a18'); ctx.beginPath(); ctx.ellipse(-14,Math.sin(e.t*5)*1.5,7,3.5,0,0,TAU); ctx.fill();
  ctx.fillStyle=rg(0,0,13,L,fur[0],fur[1],fur[2]); ctx.beginPath(); ctx.ellipse(0,0,13,6.5,0,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(-2,0,9,2,0,0,TAU); ctx.fill();
  ctx.fillStyle=rg(12,0,6,L,fur[0],fur[1],fur[2]); ctx.beginPath(); ctx.ellipse(12,0,5.5,4.5,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(15,-2.2); ctx.lineTo(21,0); ctx.lineTo(15,2.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#1a1a18'; ctx.beginPath(); ctx.arc(21,0,1,0,TAU); ctx.fill();
  for(const s of [-1,1]){ ctx.fillStyle=fur[2]; ctx.beginPath(); ctx.moveTo(10,s*2.5); ctx.lineTo(8,s*6); ctx.lineTo(12,s*4); ctx.closePath(); ctx.fill(); }
  if(alpha){ ctx.save(); ctx.shadowColor='#ff8a1a'; ctx.shadowBlur=6; ctx.fillStyle='#ff9a2a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(15,s*1.7,1.1,0,TAU); ctx.fill(); } ctx.restore();
    if(e.state==='frost'||e.state==='frostW'){ ctx.save(); ctx.globalCompositeOperation='lighter'; const g2=ctx.createRadialGradient(21,0,0,21,0,8); g2.addColorStop(0,'rgba(220,240,255,.9)'); g2.addColorStop(1,'rgba(140,200,255,0)'); ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(21,0,8,0,TAU); ctx.fill(); ctx.restore(); } }
  else { ctx.fillStyle=isNight()?'#ffe066':'#c8a040'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(15,s*1.7,0.8,0,TAU); ctx.fill(); } }
  ctx.restore();
}
function drawGloam(e,fl){
  ctx.save(); ctx.translate(e.x,e.y);
  if(e.sub){ ctx.globalAlpha=1; ctx.strokeStyle='rgba(200,230,180,.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,e.r*1.1,e.r*0.8,0,0,TAU); ctx.stroke();
    ctx.rotate(e.face); ctx.fillStyle='#e8d84a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(18,s*10,4,0,TAU); ctx.fill(); } ctx.fillStyle='#1a1a08'; for(const s of [-1,1]){ ctx.fillRect(17.4,s*10-3,1.4,6); } ctx.restore(); return; }
  ctx.rotate(e.face);
  const L=lightLocal(e.face), sk=fl?['#fff','#eee','#ccc']:['#86a456','#4e6e2e','#1e2e12'], mv=Math.hypot(e.dx,e.dy)>5, st=Math.sin(e.t*7)*(mv?3:0);
  for(const [lx,ly,s] of [[14,-24,1],[14,24,-1],[-18,-26,1],[-18,26,-1]]){ ctx.fillStyle=sk[2]; ctx.beginPath(); ctx.ellipse(lx+st*s,ly,9,6,0,0,TAU); ctx.fill(); ctx.fillStyle=sk[1]; for(let t2=-1;t2<=1;t2++){ ctx.beginPath(); ctx.arc(lx+st*s+6,ly+t2*4,2.2,0,TAU); ctx.fill(); } }
  ctx.fillStyle=rg(-2,0,32,L,sk[0],sk[1],sk[2]); ctx.beginPath(); ctx.ellipse(-2,0,32,27,0,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(20,34,10,.45)'; for(const [x,y,r] of [[-12,-10,5],[-4,8,6],[-20,6,4],[6,-14,4],[-14,16,3.5],[2,0,3]]){ ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
  ctx.fillStyle='rgba(200,230,140,.25)'; ctx.beginPath(); ctx.ellipse(-8,-8,14,8,-0.5,0,TAU); ctx.fill();
  const open=e.state==='chompW'||(e.mouth>0)||e.state==='tongue'||e.state==='spitW';
  ctx.fillStyle=sk[1]; ctx.beginPath(); ctx.ellipse(20,0,16,24,0,-Math.PI/2,Math.PI/2); ctx.fill();
  if(open){ ctx.fillStyle='#3a0e14'; ctx.beginPath(); ctx.ellipse(26,0,8,17,0,-Math.PI/2,Math.PI/2); ctx.fill(); ctx.fillStyle='#e8e0c8'; for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(26,i*5-2); ctx.lineTo(31,i*5); ctx.lineTo(26,i*5+2); ctx.closePath(); ctx.fill(); } }
  else { ctx.strokeStyle=sk[2]; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(22,0,12,20,0,-Math.PI/2.4,Math.PI/2.4); ctx.stroke(); }
  if(e.tongue>0){ ctx.strokeStyle='#d8607e'; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(28,0); ctx.lineTo(e.r+e.tongue,0); ctx.stroke(); ctx.fillStyle='#f08aa4'; ctx.beginPath(); ctx.arc(e.r+e.tongue,0,8,0,TAU); ctx.fill(); }
  for(const s of [-1,1]){ ctx.fillStyle=sk[1]; ctx.beginPath(); ctx.arc(14,s*14,8,0,TAU); ctx.fill(); ctx.fillStyle='#e8d84a'; ctx.beginPath(); ctx.arc(15,s*14,5.5,0,TAU); ctx.fill(); ctx.fillStyle='#1a1a08'; ctx.fillRect(14.3,s*14-4,1.6,8); }
  ctx.restore();
}
function drawEgg(e,fl){
  const wob=Math.sin(e.t*(20-e.hatch*3))*(e.hatch<1.5?0.25:0.08);
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(wob);
  ctx.fillStyle=fl?'#fff':rg(0,0,12,{x:-0.6,y:-0.7},'#fbf2dc','#d8caa8','#8a7a5a'); ctx.beginPath(); ctx.ellipse(0,0,10,13,0,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(120,60,30,.7)'; for(const [x,y,r] of [[-4,-4,2.2],[3,2,2.6],[-2,6,1.8],[4,-7,1.5]]){ ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
  if(e.hatch<2){ ctx.strokeStyle='#3a2010'; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(-6,-2); ctx.lineTo(-2,1); ctx.lineTo(1,-3); ctx.lineTo(5,0); ctx.stroke(); }
  ctx.restore();
}
function drawEnemy(e){
  const fl=e.flash>0;
  ctx.save();
  ctx.globalAlpha=(e.spawnIn>0?1-e.spawnIn/0.2:1)*e.alpha;
  if(e.elite){ ctx.strokeStyle='rgba(255,200,80,.45)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(e.x,e.y,e.r+5,0,TAU); ctx.stroke(); }
  switch(e.type){
    case 'kobold': drawKobold(e,1,fl,false); break; case 'grizzlefang': drawKobold(e,2.2,fl,true); break;
    case 'cultist': drawCultist(e,1,fl,false); break; case 'morrow': drawCultist(e,1.45,fl,true); break;
    case 'drakeling': drawDrake(e,1,fl,false); break; case 'broodmother': drawDrake(e,2.45,fl,true); break;
    case 'knight': drawKnight(e,1,fl,false); break; case 'cindervane': drawKnight(e,1.42,fl,true); break;
    case 'wolf': drawWolf(e,fl); break; case 'egg': drawEgg(e,fl); break;
    case 'greymane': drawWolf(e,fl,2.05,true); break; case 'gloamjaw': drawGloam(e,fl); break;
  }
  ctx.restore();
  if(!e.boss&&e.hp<e.maxHp&&e.type!=='egg'&&e.aggro){
    const w=e.r*2+6, x=e.x-w/2, y=e.y-e.r-9;
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(x,y,w,3); ctx.fillStyle=e.elite?'#e8b84a':'#c8402e'; ctx.fillRect(x,y,w*clamp(e.hp/e.maxHp,0,1),3);
  }
  if(e.stun>0||(e.type==='grizzlefang'&&e.state==='dizzy')){ for(let i=0;i<3;i++){ const a=G.time*5+i*TAU/3; ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.arc(e.x+Math.cos(a)*e.r*0.8,e.y-e.r-4+Math.sin(a)*3,2,0,TAU); ctx.fill(); } }
}
// ---------- wildlife and people
function drawCritter(c){
  ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.face);
  const L=lightLocal(c.face), g=c.t*(c.flee>0?18:6), mv=c.moving||c.flee>0;
  if(c.type==='deer'){
    for(const [lx,ly,ph] of [[9,-4,0],[9,4,Math.PI],[-8,-4,Math.PI],[-8,4,0]]){ const o=mv?Math.sin(g+ph)*4:0; ell(lx+o,ly,2.6,1.6,'#3a2414'); }
    ctx.fillStyle=rg(0,0,13,L,'#b8845a','#8a5a34','#4a2c14'); ctx.beginPath(); ctx.ellipse(0,0,13,6.5,0,0,TAU); ctx.fill();
    ell(-12,0,2.5,2.5,'#f2ece0');
    ctx.fillStyle='rgba(255,240,220,.35)'; for(const [x,y] of [[-4,-2],[0,1.5],[4,-1.5],[-7,1]]){ ctx.beginPath(); ctx.arc(x,y,0.9,0,TAU); ctx.fill(); }
    const hx=c.moving||c.flee>0?16:14+Math.sin(c.t*2)*1.5;
    ctx.fillStyle=rg(hx-3,0,5,L,'#c08c62','#8a5a34','#4a2c14'); ctx.beginPath(); ctx.ellipse(hx-4,0,4,3,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx,0,4,2.6,0,0,TAU); ctx.fill();
    ctx.fillStyle='#2a1a0e'; ctx.beginPath(); ctx.arc(hx+3.5,0,0.9,0,TAU); ctx.fill();
    for(const s of [-1,1]) ell(hx-3,s*3.4,2,1.1,'#6a4428');
    if(c.antlers){ ctx.strokeStyle='#d8c8a8'; ctx.lineWidth=1.2; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(hx-3,s*1.5); ctx.lineTo(hx-7,s*7); ctx.lineTo(hx-11,s*8); ctx.moveTo(hx-6,s*5.5); ctx.lineTo(hx-4,s*9); ctx.stroke(); } }
  }else{
    const hop=mv?Math.abs(Math.sin(g))*2:0;
    ctx.fillStyle=rg(0,0,5,L,'#a8988a','#7a6a5a','#3a3028'); ctx.beginPath(); ctx.ellipse(-hop*0.5,0,5,3.6,0,0,TAU); ctx.fill();
    ell(-5,0,1.6,1.6,'#f0ece4'); ell(4,0,2.6,2.2,'#8a7a6a');
    for(const s of [-1,1]) ell(1,s*1.4,3.2,0.9,'#6a5a4a');
  }
  ctx.restore();
}
function drawPerson(n,L,o){
  const c=hexRGB(o.col), c0=`rgb(${mixRGB(c,[255,255,255],0.3).map(Math.round)})`, c2=`rgb(${mixRGB(c,[0,0,0],0.55).map(Math.round)})`;
  if(o.cape){ ctx.fillStyle=o.cape; ctx.beginPath(); ctx.moveTo(2,-11); ctx.quadraticCurveTo(-18,-12,-16,0); ctx.quadraticCurveTo(-18,12,2,11); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=rg(-1,0,11,L,c0,o.col,c2); ctx.beginPath(); ctx.ellipse(-1,0,8.5*(o.wide||1),10.5*(o.wide||1),0,0,TAU); ctx.fill();
  if(o.apron){ ctx.fillStyle='#5a3a22'; ctx.beginPath(); ctx.ellipse(2,0,5,8,0,-Math.PI/2,Math.PI/2); ctx.fill(); }
  ell(4,-8.5,3,2.4,o.skin||'#d8a888'); ell(4,8.5,3,2.4,o.skin||'#d8a888');
  if(o.hammer){ ctx.fillStyle='#4a3420'; ctx.fillRect(4,8,14,2.2); ctx.fillStyle='#5a5a62'; ctx.fillRect(16,5,6,8); }
  if(o.book){ ctx.fillStyle='#6a2a22'; ctx.fillRect(7,-4,7,9); ctx.fillStyle='#efe2c4'; ctx.fillRect(8,-3,5,7); }
  if(o.cane){ ctx.strokeStyle='#5a4428'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4,10); ctx.lineTo(20,12); ctx.stroke(); }
  ctx.fillStyle=rg(2,0,5.5,L,'#e2b898','#c08a6a','#7a5040'); ctx.beginPath(); ctx.arc(2,0,5.5,0,TAU); ctx.fill();
  if(o.hood){ ctx.fillStyle=o.hood; ctx.beginPath(); ctx.arc(0.5,0,6.6,Math.PI*0.35,Math.PI*1.65); ctx.fill(); }
  else { ctx.fillStyle=o.hair||n.hair||'#2a1a10'; ctx.beginPath(); ctx.arc(0.5,0,5.3,Math.PI*0.45,Math.PI*1.55); ctx.fill(); }
  if(o.bun){ ctx.fillStyle=o.hair; ctx.beginPath(); ctx.arc(-4.5,0,3,0,TAU); ctx.fill(); }
  if(o.hat){ ctx.fillStyle='#c8a85a'; ctx.beginPath(); ctx.arc(1,0,9,0,TAU); ctx.fill(); ctx.fillStyle='#a8883a'; ctx.beginPath(); ctx.arc(1,0,5,0,TAU); ctx.fill(); ctx.strokeStyle='#6a4a20'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(1,0,5.5,0,TAU); ctx.stroke(); }
}
function drawGoat(n){
  ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(n.face);
  const L=lightLocal(n.face), g=n.t*12, mv=n.moving;
  for(const [lx,ly,ph] of [[7,-4,0],[7,4,Math.PI],[-6,-4,Math.PI],[-6,4,0]]){ const o=mv?Math.sin(g+ph)*3:0; ell(lx+o,ly,2.2,1.4,'#3a3430'); }
  ctx.fillStyle=rg(0,0,11,L,'#fbf8f0','#ddd6c6','#9a9282'); ctx.beginPath(); ctx.ellipse(0,0,11,6.5,0,0,TAU); ctx.fill();
  ell(-11,0,2.2,1.6,'#efe8da');
  ctx.fillStyle=rg(12,0,5,L,'#fbf8f0','#ddd6c6','#9a9282'); ctx.beginPath(); ctx.ellipse(12,0,5,3.6,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#8a7a5a'; ctx.lineWidth=1.6; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(11,s*1.5); ctx.quadraticCurveTo(7,s*5,4,s*3); ctx.stroke(); }
  ell(16,0,1.6,2.4,'#c8bca8'); ctx.fillStyle='#2a2018'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(13.5,s*2.2,0.8,0,TAU); ctx.fill(); }
  ctx.restore();
}
function drawPip(q){
  const alt=8+Math.sin(q.t*5)*3;
  ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(q.x+4,q.y+alt,7,4,0,0,TAU); ctx.fill();
  ctx.save(); ctx.translate(q.x,q.y-alt*0.4); ctx.rotate(q.face); ctx.scale(0.62,0.62);
  const fl=Math.sin(q.t*22)*0.5+0.5;
  for(const s of [-1,1]){ ctx.fillStyle='rgba(200,100,50,.85)'; ctx.beginPath(); ctx.moveTo(3,s*3); ctx.lineTo(-3,s*(8+fl*10)); ctx.lineTo(-9,s*(4+fl*6)); ctx.lineTo(-7,s*3); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle='#8a3a18'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-7,0); ctx.quadraticCurveTo(-14,Math.sin(q.t*6)*4,-20,Math.sin(q.t*6+1)*5); ctx.stroke();
  ctx.fillStyle=rg(0,0,9,{x:-0.6,y:-0.7},'#ffc080','#f0884a','#9a4018'); ctx.beginPath(); ctx.ellipse(0,0,9,6.5,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9,0,6,5,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fff'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(11,s*2.4,1.8,0,TAU); ctx.fill(); } ctx.fillStyle='#1a0a04'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(11.6,s*2.4,0.9,0,TAU); ctx.fill(); }
  ctx.restore();
}
function drawSpirit(sp){
  const k=sp.on?clamp(sp.t/0.8,0,1):clamp(1-(sp.fade||0)/1.5,0,1); if(k<=0) return;
  ctx.save(); ctx.translate(sp.x,sp.y+Math.sin(G.time*2)*3); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=k*0.85;
  const g=ctx.createRadialGradient(0,0,0,0,0,44); g.addColorStop(0,'rgba(255,220,150,.55)'); g.addColorStop(1,'rgba(255,170,80,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,44,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,226,170,.75)'; ctx.beginPath(); ctx.moveTo(0,-16); ctx.quadraticCurveTo(14,-4,12,18); ctx.quadraticCurveTo(0,24,-12,18); ctx.quadraticCurveTo(-14,-4,0,-16); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-18,7,0,TAU); ctx.fill();
  ctx.restore();
}
function drawNPC(n){
  if(n.kind==='goat') return drawGoat(n);
  ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(n.face);
  const L=lightLocal(n.face), sw=n.moving?Math.sin(n.t*9)*3:0;
  ell(2+sw,-5,3.6,2.4,'#2a2018'); ell(2-sw,5,3.6,2.4,'#2a2018');
  if(n.kind==='yara'){
    ctx.fillStyle=rg(-2,0,12,L,'#7a8a52','#4e5e32','#24301a'); ctx.beginPath(); ctx.ellipse(-2,0,10,12,0,0,TAU); ctx.fill();
    ctx.fillStyle=rg(3,0,6,L,'#f2eee4','#c8c2b4','#7a7468'); ctx.beginPath(); ctx.arc(3,0,6,0,TAU); ctx.fill();
    ctx.strokeStyle='#5a3a20'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4,11); ctx.lineTo(22,11); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(23,11,0,23,11,8); g.addColorStop(0,'rgba(255,220,140,.95)'); g.addColorStop(1,'rgba(255,120,40,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(23,11,8,0,TAU); ctx.fill(); ctx.restore();
  }
  else if(n.kind==='maren') drawPerson(n,L,{col:'#8a4a2a',apron:true,hammer:true,hair:'#b8401a',bun:true,wide:1.08});
  else if(n.kind==='wren') drawPerson(n,L,{col:'#3a5a9a',hood:'#2a4278',book:true,cape:'#22345e'});
  else if(n.kind==='moss') drawPerson(n,L,{col:'#5a7a3a',hood:'#6a8a4a',cane:true,cape:'#3e5a2a'});
  else if(n.kind==='hollis') drawPerson(n,L,{col:'#8a6a3a',hat:true,hair:'#6a4a2a',wide:1.1});
  else drawPerson(n,L,{col:n.col,hair:n.hair});
  ctx.restore();
}
function drawBirds(){
  for(const f of G.birds){
    for(const b of f.birds){
      const x=f.x+b.ox, y=f.y+b.oy, fl=Math.sin(f.t*12+b.ph);
      ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x+f.alt*0.4,y+f.alt*0.6,4,2,f.a,0,TAU); ctx.fill();
      ctx.save(); ctx.translate(x,y); ctx.rotate(f.a); ctx.strokeStyle='#2a2420'; ctx.lineWidth=1.6; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-2,-6*(0.4+0.6*Math.abs(fl))); ctx.lineTo(2,0); ctx.lineTo(-2,6*(0.4+0.6*Math.abs(fl))); ctx.stroke(); ctx.restore();
    }
  }
}
