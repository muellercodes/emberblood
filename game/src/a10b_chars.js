
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
  drawWingsHook(p,L,fl);
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
  if(!ghost) drawAshHat();
  // weapon (drawn by the weapons module)
  drawHeroWeapon(p);
  if(p.breathing){ const g=ctx.createRadialGradient(22,0,0,22,0,16); g.addColorStop(0,'rgba(255,240,180,.95)'); g.addColorStop(1,'rgba(255,120,40,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(22,0,16,0,TAU); ctx.fill(); }
  ctx.restore();
}
function drawPlayer(){
  const p=player; if(p.dead) return;
  // jumping or flying: a shadow that shrinks with height, then Ash lifted by z (a touch bigger, closer to the camera)
  const z=(p.z||0)+(p.flying?Math.sin(p.t*2.6)*2.2:0);
  if(z>0.5||p.flying) drawMoveShadow(p);
  for(const g of p.ghosts){ ctx.globalAlpha=g.a*0.5; drawHero(g.x,g.y,g.f,p,true); }
  ctx.globalAlpha=(p.iframes>0&&p.iframes<5&&p.dashT<=0&&Math.floor(p.t*18)%2===0)?0.55:1;
  const sq=p.sqT>0&&p.sqD?p.sqA*Math.sin(p.sqT/p.sqD*Math.PI):0;   // + squashes (landing), - stretches (take-off)
  if(z>0.3||sq){ const s=1+Math.max(0,z)/240; ctx.save(); ctx.translate(p.x,p.y-Math.max(0,z)); ctx.scale(s*(1+sq),s*(1-sq)); drawHero(0,0,p.facing,p,false); ctx.restore(); }
  else drawHero(p.x,p.y,p.facing,p,false);
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
function drawWolf(e,fl,k,alpha,friendly){
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
  if(alpha){ ctx.save(); ctx.shadowColor=friendly?'#7ac8ff':'#ff8a1a'; ctx.shadowBlur=6; ctx.fillStyle=friendly?'#9fd8ff':'#ff9a2a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(15,s*1.7,1.1,0,TAU); ctx.fill(); } ctx.restore();
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
    case 'bat': drawBat(e,fl); break; case 'slime': drawSlime(e,fl); break;
    case 'gnarl': drawGnarl(e,fl); break; case 'serpent': drawSerpent(e,fl); break; case 'skrae': drawSkrae(e,fl); break; case 'knot': break;
    case 'bramble': drawBramble(e,fl); break; case 'crab': drawCrab(e,fl); break; case 'eel': drawEel(e,fl); break; case 'gust': drawGust(e,fl); break;
    case 'sneak': drawKobold(e,0.92,fl,false); ctx.fillStyle='#c8a050'; ctx.beginPath(); ctx.arc(e.x-Math.cos(e.face)*9,e.y-Math.sin(e.face)*9,6,0,TAU); ctx.fill(); ctx.fillStyle='#8a6a2a'; ctx.fillRect(e.x-Math.cos(e.face)*9-1,e.y-Math.sin(e.face)*9-7,2,4); break;
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
  const L=lightLocal(c.face), mv=c.moving||c.flee>0, g=c.t*(c.flee>0?17:7);
  ctx.lineCap='round'; ctx.lineJoin='round';
  if(c.type==='deer'){
    const graze=!mv&&c.graze, nib=graze?Math.max(0,Math.sin(c.t*3.1))*1.1:0;
    for(const [lx,ly,ph] of [[8,-3.7,0],[8,3.7,Math.PI],[-7.5,-3.9,Math.PI],[-7.5,3.9,0]]){ const o=mv?Math.sin(g+ph)*4.4:0; ell(lx+o,ly,2.5,1.6,'#24160c'); ell(lx+o+0.3,ly,1.6,1.0,'#3e2a18'); }
    const tf=Math.sin(c.t*(c.flee>0?16:2.6))*0.5;
    ell(-12.2,0,3.2,3.6,'rgba(30,18,8,.6)'); ell(-12,0,2.8,3.2,c.flee>0?'#fffaf0':'#efe4d0');
    ctx.fillStyle='#4a2c14'; ctx.beginPath(); ctx.ellipse(-14,tf,2.2,1.1,tf*0.5,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(30,18,8,.55)'; ctx.beginPath(); ctx.ellipse(0,0,13.8,7.3,0,0,TAU); ctx.fill();
    ctx.fillStyle=rg(0,0,13,L,'#d09a6c','#9a6438','#4a2a12'); ctx.beginPath(); ctx.ellipse(0,0,13,6.6,0,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(70,38,16,.35)'; ctx.beginPath(); ctx.ellipse(-1.5,0,9.5,1.5,0,0,TAU); ctx.fill();
    if(!c.antlers){ ctx.fillStyle='rgba(255,244,226,.6)'; for(const [x,y] of [[-6,-2.6],[-3,2.5],[0,-3],[3.4,2.2],[-8.6,1.2],[5.6,-1.9],[-1.2,0.8],[-4.6,-0.6]]){ ctx.beginPath(); ctx.arc(x,y,0.75,0,TAU); ctx.fill(); } }
    const hx=(mv?16.4:14.8)+nib+(graze?2.4:Math.sin(c.t*1.7)*0.7), hy=graze?Math.sin(c.t*1.3)*0.4:Math.sin(c.t*0.9)*1.3;
    ctx.fillStyle=rg(10,0,6,L,'#d09a6c','#9a6438','#4a2a12'); ctx.beginPath(); ctx.moveTo(8,-3.8); ctx.quadraticCurveTo(hx-4,hy-2.8,hx-1.6,hy-2.1); ctx.lineTo(hx-1.6,hy+2.1); ctx.quadraticCurveTo(hx-4,hy+2.8,8,3.8); ctx.closePath(); ctx.fill();
    for(const s of [-1,1]){ ctx.save(); ctx.translate(hx-3.3,hy+s*2.7); ctx.rotate(s*(0.95+(graze?0.25:Math.sin(c.t*2+s)*0.12))); ell(0,0,1.5,3.0,'#7a4a28'); ell(0,0.2,0.75,1.9,'#e8b8a0'); ctx.restore(); }
    ctx.fillStyle=rg(hx,hy,4,L,'#d8a678','#9a6438','#4a2a12'); ctx.beginPath(); ctx.ellipse(hx-0.8,hy,3.9,3.0,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx+2.2,hy,2.7,2.0,0,0,TAU); ctx.fill();
    ell(hx+4.5,hy,1.0,1.15,'#1a100a');
    ctx.fillStyle='#1a100a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(hx+0.5,hy+s*2.35,0.62,0,TAU); ctx.fill(); }
    if(c.antlers){
      ctx.beginPath(); for(const s of [-1,1]){ ctx.moveTo(hx-1.8,hy+s*1.3); ctx.quadraticCurveTo(hx-5,hy+s*5,hx-9.4,hy+s*7.6); ctx.moveTo(hx-4.4,hy+s*4); ctx.lineTo(hx-2.8,hy+s*7.8); ctx.moveTo(hx-7,hy+s*6.4); ctx.lineTo(hx-6.4,hy+s*9.8); ctx.moveTo(hx-8.4,hy+s*7.2); ctx.lineTo(hx-11.4,hy+s*6.6); }
      ctx.strokeStyle='rgba(40,26,12,.8)'; ctx.lineWidth=2.2; ctx.stroke(); ctx.strokeStyle='#e4d4b4'; ctx.lineWidth=1.2; ctx.stroke();
    }
  }else{
    const hop=mv?Math.abs(Math.sin(g*1.15)):0, st=hop*2.6, alert=!mv&&player&&dist(c.x,c.y,player.x,player.y)<330;
    for(const s of [-1,1]){ ell(-3-st*0.5,s*3.1,2.7+st*0.6,1.3,'rgba(30,22,16,.7)'); ell(-3-st*0.5,s*3.1,2.2+st*0.5,0.9,'#7a6a58'); }
    ell(-6-st*0.3,0,2.1,2.1,'rgba(30,22,16,.5)'); ell(-5.9-st*0.3,0,1.8,1.8,'#f8f4ec');
    ctx.fillStyle='rgba(30,22,16,.6)'; ctx.beginPath(); ctx.ellipse(-0.6+st*0.2,0,6.1+st*0.4,4.8-st*0.2,0,0,TAU); ctx.fill();
    ctx.fillStyle=rg(-0.5,0,5.6,L,'#c4b4a0','#8a7862','#3e3428'); ctx.beginPath(); ctx.ellipse(-0.6+st*0.2,0,5.5+st*0.4,4.2-st*0.2,0,0,TAU); ctx.fill();
    const hx=4.1+st*0.7;
    ctx.fillStyle=rg(hx,0,3,L,'#ccbca6','#8e7c66','#3e3428'); ctx.beginPath(); ctx.ellipse(hx,0,3.0,2.6,0,0,TAU); ctx.fill();
    const el=alert?1.9:4.4;
    for(const s of [-1,1]){ ctx.save(); ctx.translate(hx-0.6,s*1.2); ctx.rotate(Math.PI+s*(alert?0.5:0.22)+(mv?Math.sin(g*1.15)*0.15*s:0)); ell(el*0.5,0,el*0.62,1.1,'#7e6c56'); ell(el*0.5,0,el*0.44,0.5,'#e8b4ac'); ctx.restore(); }
    ctx.fillStyle='#1a120c'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(hx+0.7,s*1.9,0.55,0,TAU); ctx.fill(); }
    ell(hx+2.8,0,0.6+Math.max(0,Math.sin(c.t*14))*0.2,0.55,'#d88a8a');
  }
  ctx.restore();
}

// ================= people
// Each person is a cached, lit, outlined body sprite plus a head sprite, baked per facing bucket (16 of them, so the
// world's upper left light stays right as they turn). Feet, free arms, scarf ends, glows and smoke are drawn live.
const PDIR=24, PSCALE=1.1, PSPR=new Map(), POUT='rgba(28,17,12,.8)';
let PBT=0, PBAKES=0, PBUD_T=0, PCS_FORCE=0, PLINE=false, PREC=false, PSHADOW=null, PGLOW=null;
const PSCR=document.createElement('canvas'), PSG=PSCR.getContext('2d');
function pCS(){ return PCS_FORCE||(DPR*zoom>2.1?3:2); }
function phash(s){ s=String(s); let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const SHC=new Map();
function shd(hex,k){ const key=hex+k; let v=SHC.get(key); if(v) return v; const c=hexRGB(hex), m=k>=0?mixRGB(c,[255,248,236],k):mixRGB(c,[18,9,6],-k); v='#'+m.map(q=>Math.max(0,Math.min(255,Math.round(q))).toString(16).padStart(2,'0')).join(''); SHC.set(key,v); return v; }
function hx6(c,fb){ return typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c)?c:fb; }
function lgr(g,x,y,r,L,hex,hi,lo){ const k=g.createRadialGradient(x+L.x*r*0.5,y+L.y*r*0.5,r*0.06,x,y,r*1.08); k.addColorStop(0,shd(hex,hi==null?0.3:hi)); k.addColorStop(0.5,hex); k.addColorStop(1,shd(hex,-(lo==null?0.42:lo))); return k; }
function pE(g,x,y,rx,ry,f,rot){ g.fillStyle=f; g.beginPath(); g.ellipse(x,y,rx,ry,rot||0,0,TAU); g.fill(); }
function pC(g,x,y,r,f){ g.fillStyle=f; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
function pLn(g,w,col,pts){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); g.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) g.lineTo(pts[i],pts[i+1]); g.stroke(); }
function pRR(g,x,y,w,h,r,f){ g.fillStyle=f; g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); g.fill(); }
function pStar(g,x,y,r,f){ g.fillStyle=f; g.beginPath(); for(let i=0;i<8;i++){ const a=i/8*TAU, q=i%2?r*0.38:r; g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q); } g.closePath(); g.fill(); }
// bake: draw(g) in local units, then a dark outline is grown around the silhouette; post(g) is drawn on top
function pBake(hu,res,draw,post,bare){
  const S=Math.ceil(hu*2*res)+2, m=S/2;
  if(PSCR.width<S||PSCR.height<S){ PSCR.width=PSCR.height=S+16; }
  const g=PSG; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,S+2,S+2);
  g.setTransform(res,0,0,res,m,m); g.lineCap='round'; g.lineJoin='round'; draw(g);
  const o=document.createElement('canvas'); o.width=S; o.height=S; const h=o.getContext('2d'), d=0.8*pCS();
  if(!bare){ for(let i=0;i<8;i++){ const a=i/8*TAU; h.drawImage(PSCR,0,0,S,S,Math.cos(a)*d,Math.sin(a)*d,S,S); }
    h.globalCompositeOperation='source-in'; h.fillStyle=POUT; h.fillRect(0,0,S,S); h.globalCompositeOperation='source-over'; }
  h.drawImage(PSCR,0,0,S,S,0,0,S,S);
  if(post){ h.setTransform(res,0,0,res,m,m); h.lineCap='round'; h.lineJoin='round'; post(h); }
  o.ox=o.oy=-m/res; o.w=o.h=S/res; return o;
}
function pShadow(){ if(PSHADOW) return PSHADOW; const c=document.createElement('canvas'); c.width=c.height=48; const g=c.getContext('2d'), k=g.createRadialGradient(24,24,1,24,24,24); k.addColorStop(0,'rgba(0,0,0,.5)'); k.addColorStop(0.5,'rgba(0,0,0,.3)'); k.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=k; g.fillRect(0,0,48,48); return PSHADOW=c; }
function pGlow(){ if(PGLOW) return PGLOW; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'), k=g.createRadialGradient(32,32,0,32,32,32); k.addColorStop(0,'rgba(255,236,170,1)'); k.addColorStop(0.25,'rgba(255,196,100,.6)'); k.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle=k; g.fillRect(0,0,64,64); return PGLOW=c; }
function pGlowAt(x,y,r,a){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha*=a; ctx.drawImage(pGlow(),x-r,y-r,r*2,r*2); ctx.restore(); }

// ---------- who looks like what
const SKINS=['#f6dbc6','#eec6a6','#e0ae88','#cf9a72','#b98058','#9c6644','#7c4c30','#5c3622'];
const PLOWS=['#5a4a3a','#3a4a6a','#6a3a3a','#4a5a3a','#7a6a4a','#5a3a5a','#2e3a4a','#8a5a3a','#3a5a5a','#6a5a7a'];
// people whose data lives in another module (SPECIAL), merged over their look
const PEXTRA={
  juniper:{hairdo:'pony',skin:'#7c4c30',outfit:'vest',low:'#6a5232',trim:'#a0e0b0',back:'mapcase',hold2:'lantern',bag:'#7a5a32',build:'teen',hatc:'#3a6a4a',freckles:true},
  morrow:{outfit:'robe',low:'#3a1648',skin:'#e4cec4',hold:'clasp',trim:'#c792ea',hair:'#2a1a2a'},
  sal:{outfit:'overalls',low:'#4a5a7a',skin:'#7a4a2e',hairdo:'bun',build:'old',pipe:true,hold:'mallet',neck:'#d8c8b0',hat:'kerchief',hatc:'#8a9aaa'}
};
const PRHAND={hammer:1,ladle:1,staff:1,rod:1,pick:1,shovel:1,spear:1,pitchfork:1,telescope:1,lamp:1,mallet:1,sword:1,scrolls:1,cane:1};
const PBOTH={book:1,yarn:1,mug:1,clasp:1,behind:1};
function pDerive(id,c,o,look){
  const r=mulberry32(phash(id+'|folk')), R=()=>r(), pk=a=>a[Math.floor(R()*a.length)%a.length];
  const town=c.town, north=town==='lodge', mine=town==='copper';
  const old=look.hair==='#e8e4dc', masc=!!look.beard||R()<0.45;
  o.skin=look.skin||SKINS[Math.floor(R()*SKINS.length)];
  o.hairdo=masc?(old?pk(['bald','bald','short','crop']):pk(['short','short','crop','curly','spiky','bald','pony'])):(old?pk(['bun','bun','curly','short']):pk(['long','pony','braids','bun','curly','pigtails','short','long']));
  o.outfit=north?(R()<0.7?'fur':'coat'):mine?pk(['overalls','overalls','vest','tunic']):masc?pk(['tunic','vest','coat','overalls','tunic','robe']):pk(['dress','dress','dress','vest','tunic','coat']);
  o.low=o.outfit==='vest'?pk(['#4a3a2a','#2e3a4a','#5a2a2a','#3a4a2a','#6a5a3a']):pk(north?['#8a6a4a','#6a5040','#a08060','#5a4a3a','#c8b8a0']:PLOWS);
  const u=R(); if(u<0.16) o.pattern='stripes'; else if(u<0.28) o.pattern='plaid'; else if(u<0.4) o.pattern='dots';
  o.patc=pk(['#efe6d6','#2a2018',hx6(c.col,'#d8c3a0'),'#e8c060']);
  o.trim=c.col;
  if(R()<0.2) o.scarf=pk([hx6(c.col,'#c84a3a'),'#c84a3a','#3a6a9a','#e8c060','#5a8a4a']); else if(R()<0.16) o.neck=pk([hx6(c.col,'#c84a3a'),'#c84a3a','#efe6d6']);
  if(R()<0.4) o.belt=pk(['#3a2414','#5a3a1e','#2a2226']);
  if(R()<0.22) o.bag=pk(['#7a5a32','#5a4028','#8a6a3a']);
  if(!masc&&R()<0.32) o.flower=pk(['#ff8ab0','#ffd84a','#c890e0','#ffffff','#ff7a5a']);
  if(R()<0.16) o.necklace=pk(['#e8c060','#c84a6a','#7ac8e8']);
  if(R()<0.22) o.earrings=true;
  if(masc&&(old?R()<0.45:R()<0.06)) o.pipe=true;
  if(north&&R()<0.7) o.mittens=pk(['#c84a3a','#3a6a9a','#e8c060','#efe6d6',hx6(c.col,'#c84a3a')]);
  if(!look.hat){
    if(north&&R()<0.65){ o.hat=pk(['beanie','fur','beanie']); o.hatc=pk(['#c84a3a','#3a6a9a','#5a8a4a','#e0c080','#8a6a4a']); }
    else if(mine&&R()<0.45){ o.helm=true; o.lamp=R()<0.6; }
    else if(!masc&&R()<0.12){ o.hat='kerchief'; o.hatc=pk(['#c84a3a','#3a6a9a','#e8c060','#7a5a8a']); }
    else if(R()<0.06){ o.hat='beanie'; o.hatc=pk(['#c84a3a','#3a6a9a']); }
  }else{ o.hatc=pk(['#4a6a3a','#6a4a2a','#3a4a6a','#7a3a3a']); o.hatband=pk(['#8a3a2a','#3a5a8a','#5a7a3a','#e8c060','#2a2a2a','#c84a6a']); if(!masc&&R()<0.5) o.flower=pk(['#ff8ab0','#ffd84a','#ffffff']); }
  if(old){ o.build=R()<0.65?'old':''; if(o.build==='old'&&R()<0.6) o.hold='cane'; }
  else { const b=R(); o.build=b<0.18?'wide':b<0.34?'slim':b<0.46?'tall':b<0.56?'short':''; }
  if(R()<0.13){ o.hold2='basket'; o.basketc=pk(['herbs','bread','eggs','apples']); }
  if(R()<0.08) o.apron=pk([true,'#c8b8a0','#8a7a6a']);
  if(R()<0.18&&!o.pipe) o.blush=true; if(R()<0.15) o.freckles=true;
  if(masc&&!look.beard&&R()<0.22) o.stache=true;
}
function pResolve(id,o,kid,c){
  const r=mulberry32(phash(id+'#')), pk=a=>a[Math.floor(r()*a.length)%a.length];
  const P={id,o}, b=o.build||'';
  P.k=PSCALE*(kid?0.74:b==='teen'?0.87:b==='short'?0.92:b==='tall'?1.07:b==='big'?1.08:1);
  P.hk=kid?1.25:b==='teen'?1.1:1;
  const big=b==='wide'||b==='big', wid=(o.wide||1)*(big?1.13:b==='strong'?1.12:b==='slim'?0.9:b==='old'?0.95:1);
  P.old=b==='old'; P.kid=kid;
  P.ry=9.2*wid; P.rx=6.3*(big?1.1:b==='strong'?1.05:1); P.tx=P.old?-0.9:-0.3; P.hx=P.old?2.6:kid?0.4:0.9; P.hr=5.3;
  P.belly=big&&!o.noBelly;
  P.skin=hx6(o.skin,'#e0ae88'); P.hair=hx6(o.hair,'#3a2a1a'); P.shirt=hx6(o.shirt||o.col,'#6a5a4a');
  P.outfit=o.outfit||(o.hood?'robe':'tunic');
  P.trim=hx6(o.trim,null)||hx6(c&&c.col,'#d8c3a0');
  const O=P.outfit, low=hx6(o.low,null);
  P.low=low||(O==='fur'?'#8a6a4a':O==='overalls'?'#3e5a7a':O==='vest'?shd(P.shirt,-0.35):shd(P.shirt,-0.18));
  P.top=O==='armor'?'#9aa2ae':O==='fur'?P.low:O==='coat'?P.low:P.shirt;
  const sl=O==='armor'?'#7c828c':(O==='fur'||O==='coat')?P.low:P.shirt;
  P.sleeveL=shd(sl,0.16); P.sleeveD=shd(sl,-0.18);
  P.hand=hx6(o.mittens,P.skin); P.handL=shd(P.hand,0.25);
  P.aw=(O==='robe'||O==='coat'||O==='fur')?3.9:3.3;
  P.shoe=hx6(o.shoe,null)||(o.frost?'#5a6a7a':pk(['#3a2a1e','#2a2226','#4a3424','#5a3a2a','#2e2a26']));
  P.legs=hx6(o.legs,null)||(O==='overalls'?P.low:pk(['#4a3e32','#3a3a44','#5a4a36','#34404a','#4a4038']));
  P.dress=O==='dress'||O==='robe'||O==='fur';
  P.hairdo=o.hairdo||(o.bun?'bun':'short');
  P.hat=o.helm?(o.lamp?'miner':'helm'):(o.hat||null); P.hatc=hx6(o.hatc,null);
  P.hood=hx6(o.hood,null);
  P.beard=o.beard||false; P.stache=o.stache||false;
  P.hold=o.hold||(o.cane?'cane':o.hammer?'hammer':o.book?'book':null); P.hold2=o.hold2||(o.basket?'basket':null);
  P.armR=P.hold?(PBOTH[P.hold]||PRHAND[P.hold]?'held':'free'):'free'; P.armL=P.hold&&PBOTH[P.hold]?'held':'free';
  if(P.hold2) P.armL='held'; if(P.hold2==='fiddle') P.armR='bow';
  P.scarf=hx6(o.scarf,null); if(P.scarf) P.scarfL=shd(P.scarf,0.3); P.cape=hx6(o.cape,null); P.shawl=hx6(o.shawl||o.blanket,null);
  // how far each sprite reaches from the centre (local units, outline included), so bakes stay small
  const RI={hammer:20,ladle:16.5,staff:20.5,cane:13.5,rod:25,pick:16,shovel:16.5,spear:24,pitchfork:22.5,telescope:15,lamp:13,mallet:15,sword:19,scrolls:14.5,book:14,yarn:14,mug:12.5,clasp:12,behind:12};
  const R2={basket:17,cheese:16.5,loaf:16,kettle:17,tray:17,hatbox:17,lantern:15.5,fish:17,fiddle:15};
  let bh=Math.max(P.ry,P.rx+3.6)+3.4; if(P.hold) bh=Math.max(bh,(RI[P.hold]||14)+Math.max(0,P.ry-9.2)); if(P.hold2) bh=Math.max(bh,(R2[P.hold2]||15)+(P.ry-9.2));
  if(P.cape) bh=Math.max(bh,17.5); if(o.back==='pack') bh=Math.max(bh,17); if(o.back) bh=Math.max(bh,14.5); if(o.bag) bh=Math.max(bh,P.ry+4.6); if(o.sled) bh=Math.max(bh,29);
  P.bh=bh;
  const hat=P.hat; let hh=7.4;
  if(P.hairdo==='long'||P.hairdo==='braids') hh=14; else if(P.hairdo==='pony') hh=13.6; else if(P.hairdo==='pigtails') hh=10.4; else if(P.hairdo==='bun'||P.hairdo==='wild') hh=8.8;
  hh=Math.max(hh,{straw:8.8,rain:11.3,fancy:16,feather:15.6,helm:8,miner:9.4,wizard:8.4,top:8.4,chef:7.4,cap:9.4,beanie:7.6,fur:8.4,kerchief:10.2,party:6.6,crown:7}[hat]||0);
  if(P.beard) hh=Math.max(hh,P.beard==='big'?11.8:8.4); if(P.stache==='big') hh=Math.max(hh,9.4); if(o.pipe) hh=Math.max(hh,10.4); if(o.goggles) hh=Math.max(hh,8.4); if(P.hood) hh=Math.max(hh,10.8);
  P.hh=hh;
  if(P.plume=hx6(o.plume,null)) P.hh=Math.max(P.hh,12.4);
  P.seed=r(); P.fidget=o.fidget||1;
  P.fx=[]; if(P.hold==='staff') P.fx.push('lantern'); if(P.hold==='lamp') P.fx.push('lamp'); if(P.hold2==='lantern') P.fx.push('lantern2'); if(P.hat==='miner'&&o.lamp) P.fx.push('miner');
  if(o.pipe) P.fx.push('pipe'); if(P.hold2==='kettle') P.fx.push('kettle'); if(P.hold==='mug') P.fx.push('mug'); if(o.frost) P.fx.push('frost');
  P.sig=phash(id+JSON.stringify(o)+(kid?'k':'')).toString(36);
  if(o.twin){ P.twin=true; P.ta=pResolve(id+'#a',Object.assign({},o,{twin:false,hold:'pick'}),kid,c); P.tb=pResolve(id+'#b',Object.assign({},o,{twin:false,hold:'shovel'}),kid,c); P.ta.k=P.tb.k=0.93*PSCALE; }
  return P;
}
function pProfile(n){
  const id=String(n.id||n.kind||'x'), c=CASTBY[id]||SPECIAL[id]||null, look=n.look||(c&&c.look)||{};
  if(n._pp&&n._pp.src===look) return n._pp;
  const o=Object.assign({},look,PEXTRA[id]||null);
  if(c&&c.generic){ pDerive(id,c,o,look); if(!look.skin) look.skin=o.skin; }
  const P=pResolve(id,o,!!(c&&c.kid),c); P.src=look; n._pp=P; return P;
}

// ---------- body parts (bake)
function pArmB(g,P,L,s,hx,hy){
  const sx=P.tx+0.3, sy=s*(P.ry-1.7);
  g.strokeStyle=POUT; g.lineWidth=P.aw+1.3; g.beginPath(); g.moveTo(sx,sy); g.lineTo(hx,hy); g.stroke();
  g.strokeStyle=L.y*s>0?P.sleeveL:P.sleeveD; g.lineWidth=P.aw; g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+(hx-sx)*0.78,sy+(hy-sy)*0.78); g.stroke();
  pC(g,hx,hy,2.0,POUT); pC(g,hx,hy,1.5,P.hand); pC(g,hx+L.x*0.5,hy+L.y*0.5,0.6,P.handL);
}
function pBasket(g,L,x,y,r,what){
  pC(g,x,y,r,lgr(g,x,y,r,L,'#b8884a',0.25,0.5)); g.strokeStyle='rgba(80,50,20,.45)'; g.lineWidth=0.4; g.beginPath(); g.arc(x,y,r*0.66,0,TAU); g.stroke();
  for(let i=0;i<8;i++){ const a=i/8*TAU; pLn(g,0.35,'rgba(80,50,20,.35)',[x+Math.cos(a)*r*0.66,y+Math.sin(a)*r*0.66,x+Math.cos(a)*r,y+Math.sin(a)*r]); }
  const cols=what==='bread'?['#d89848','#c07830']:what==='eggs'?['#f6efe0','#e8dcc4']:what==='apples'?['#d8402a','#e8a030']:['#5a9a3a','#8ac85a','#c890e0'];
  for(let i=0;i<5;i++){ const a=i*1.3+0.4, d=i?r*0.42:0; pC(g,x+Math.cos(a)*d,y+Math.sin(a)*d,r*0.34,cols[i%cols.length]); }
  g.strokeStyle='#6a4420'; g.lineWidth=0.7; g.beginPath(); g.moveTo(x-r*0.9,y); g.quadraticCurveTo(x,y-r*0.2,x+r*0.9,y); g.stroke();
}
function pItem(g,P,L,it,o){
  const R=P.ry;
  switch(it){
    case 'hammer': { pLn(g,1.6,'#5a3a1e',[3.2,R-0.8,12.4,R+0.8]); g.save(); g.translate(13.2,R+0.9); g.rotate(0.17); pRR(g,-1.7,-3,3.4,6,0.6,lgr(g,0,0,3,L,'#8a929c',0.4,0.5)); g.restore(); pArmB(g,P,L,1,4.8,R-0.4); break; }
    case 'ladle': { pLn(g,1.0,'#8a8c90',[3.6,R-0.4,11.6,R+1.4]); pC(g,12.8,R+1.8,2.3,lgr(g,12.8,R+1.8,2.3,L,'#a8acb2',0.4,0.5)); pC(g,12.8,R+1.8,1.5,'#b8742e'); pArmB(g,P,L,1,4.6,R); break; }
    case 'staff': { pLn(g,1.5,'#4a2e16',[1.8,R,11.4,R+2.0]); g.strokeStyle='#4a2e16'; g.lineWidth=1.1; g.beginPath(); g.arc(11.6,R+3.3,1.3,-1.6,1.6); g.stroke(); pRR(g,10.4,R+3.2,3.0,3.0,0.7,'#3a2a1a'); pRR(g,10.9,R+3.7,2.0,2.0,0.4,'#ffe6a0'); pArmB(g,P,L,1,4.2,R+0.5); break; }
    case 'cane': { pLn(g,1.4,'#5a3e22',[3.2,R+0.3,8.8,R+2.2]); g.strokeStyle='#5a3e22'; g.lineWidth=1.3; g.beginPath(); g.arc(3.8,R-0.6,1.1,1.2,4.4); g.stroke(); pArmB(g,P,L,1,4.0,R+0.2); break; }
    case 'rod': { pLn(g,1.4,'#6a4a2a',[5.0,R-0.6,-4,R-3.6]); pLn(g,0.8,'#8a6a42',[-4,R-3.6,-21.5,R-6.6]); pLn(g,0.3,'rgba(240,240,240,.8)',[-21.5,R-6.6,-22.8,R-1.6]); pC(g,-22.8,R-1.2,1.0,'#e8402a'); pC(g,-22.8,R-1.5,0.5,'#fff'); pC(g,3.4,R-0.2,1.3,'#5a5e66'); pArmB(g,P,L,1,4.6,R-0.4); break; }
    case 'pick': { pLn(g,1.7,'#6a4626',[5.0,R-0.6,-9.4,R-5.4]); g.save(); g.translate(-9.6,R-5.5); g.rotate(-0.33); g.fillStyle=lgr(g,0,0,4,L,'#8a929c',0.4,0.5); g.beginPath(); g.moveTo(-0.6,-5.6); g.quadraticCurveTo(1.6,0,-0.6,5.6); g.lineTo(-1.6,5.2); g.quadraticCurveTo(0,0,-1.6,-5.2); g.closePath(); g.fill(); g.restore(); pArmB(g,P,L,1,4.4,R-0.4); break; }
    case 'shovel': { pLn(g,1.6,'#7a5430',[5.4,R-0.4,-8.2,R-5.0]); pLn(g,1.0,'#5a3a1e',[5.2,R-1.6,5.6,R+0.8]); g.save(); g.translate(-10.4,R-5.8); g.rotate(-0.36); pRR(g,-2.6,-2.3,4.6,4.6,1.4,lgr(g,0,0,3,L,'#8e969e',0.4,0.5)); g.restore(); pArmB(g,P,L,1,4.4,R-0.4); break; }
    case 'spear': { pLn(g,1.3,'#6a4a2a',[-7,R+0.9,15.6,R+2.3]); g.fillStyle=lgr(g,17,R+2.4,3,L,'#c8d0da',0.4,0.5); g.beginPath(); g.moveTo(15.2,R+1.3); g.quadraticCurveTo(18,R+1.2,20.4,R+2.5); g.quadraticCurveTo(18,R+3.6,15.2,R+3.3); g.closePath(); g.fill(); g.fillStyle=P.trim; g.beginPath(); g.moveTo(13.6,R+2.2); g.lineTo(10.6,R+5.2); g.lineTo(12.6,R+2.0); g.closePath(); g.fill(); pArmB(g,P,L,1,4.4,R+0.6); break; }
    case 'pitchfork': { pLn(g,1.3,'#7a5430',[-6,R+0.8,12.6,R+1.8]); pLn(g,1.0,'#7a8088',[12.4,R-0.6,12.8,R+4.2]); for(const d of [-0.4,1.8,4.0]) pLn(g,0.8,'#8a929c',[12.6,R+d,17.4,R+d+0.3]); pArmB(g,P,L,1,4.4,R+0.6); break; }
    case 'telescope': { pLn(g,2.9,'#6a4a1a',[-4.6,R-2.4,4,R-1.6]); pLn(g,2.6,'#c8a04a',[-4.6,R-2.4,4,R-1.6]); pLn(g,2.2,'#d8b45a',[4,R-1.6,8.6,R-1.2]); pLn(g,1.8,'#e8c86a',[8.6,R-1.2,11.6,R-1.0]); pC(g,11.8,R-1.0,0.8,'#cfe8ff'); for(const x of [0,4,8.6]) pLn(g,0.5,'#5a3a10',[x,R-3.2+x*0.08,x,R-0.3+x*0.08]); pArmB(g,P,L,1,3.8,R-0.6); break; }
    case 'lamp': { pC(g,7.6,R+0.6,2.1,lgr(g,7.6,R+0.6,2.1,L,'#b8943a',0.4,0.5)); pC(g,7.6,R+0.6,1.3,'#fff2b0'); g.strokeStyle='#6a5020'; g.lineWidth=0.5; g.beginPath(); g.arc(7.6,R+0.6,1.3,0,TAU); g.stroke(); pArmB(g,P,L,1,5.0,R+0.2); break; }
    case 'mallet': { pLn(g,1.3,'#7a5430',[3.6,R-0.4,10.4,R+1.0]); g.save(); g.translate(11.2,R+1.2); g.rotate(0.2); pRR(g,-1.6,-3,3.2,6,1.2,lgr(g,0,0,3,L,'#9a6a3a',0.35,0.5)); g.restore(); pArmB(g,P,L,1,4.6,R); break; }
    case 'sword': { pLn(g,2.0,'#c8a070',[6.4,R+0.1,15.6,R+1.5]); pLn(g,0.5,'#e8cca0',[6.6,R-0.2,15.2,R+1.0]); pLn(g,1.4,'#7a4a2a',[5.9,R-2.2,5.4,R+2.4]); pC(g,3.2,R-0.3,0.9,'#7a4a2a'); pArmB(g,P,L,1,4.6,R); break; }
    case 'scrolls': { for(const [x,y,a] of [[7.4,R-0.8,0.3],[8.0,R+1.4,-0.2],[6.2,R+2.4,0.5]]){ g.save(); g.translate(x,y); g.rotate(a); pRR(g,-3.2,-0.9,6.4,1.8,0.9,'#efe2c0'); pLn(g,0.4,'#c84a3a',[0,-0.9,0,0.9]); g.restore(); } pArmB(g,P,L,1,5.0,R); break; }
    case 'book': { const F=P.hx-0.9; pRR(g,5.9+F,-4.9,5.8,9.8,0.8,o.bookc||'#5a2a22'); pRR(g,6.3+F,-4.4,5.0,4.1,0.4,'#f2e6c8'); pRR(g,6.3+F,0.3,5.0,4.1,0.4,'#ece0c0'); for(let i=0;i<3;i++){ const x=7+F+i*1.4; pLn(g,0.3,'rgba(90,60,30,.45)',[x,-3.8,x,-0.9]); pLn(g,0.3,'rgba(90,60,30,.45)',[x,0.9,x,3.8]); } pLn(g,0.6,'#c84a3a',[11+F,1.2,12.6+F,2.0]); pArmB(g,P,L,-1,7.2+F,-4.8); pArmB(g,P,L,1,7.2+F,4.8); break; }
    case 'yarn': { const F=P.hx-0.9, Y=hx6(o.yarnc,'#e0a0b8'); pRR(g,6.4+F,0.8,3.8,3.2,0.5,Y); g.strokeStyle=shd(Y,-0.3); g.lineWidth=0.3; for(let k=0;k<3;k++) pLn(g,0.3,shd(Y,-0.3),[6.6+F+k*1.2,1.0,6.6+F+k*1.2,3.8]); pLn(g,0.55,'#e8e0d0',[5.6+F,0.4,11.4+F,4.6]); pLn(g,0.55,'#e8e0d0',[5.6+F,4.8,11.2+F,0.2]); pC(g,8.6+F,-3.4,2.4,lgr(g,8.6+F,-3.4,2.4,L,Y,0.35,0.45)); for(const a of [0.3,1.2,2.1]){ g.beginPath(); g.ellipse(8.6+F,-3.4,2.2,0.9,a,0,TAU); g.stroke(); } pLn(g,0.3,Y,[8.0+F,-1.2,7.6+F,1.0]); pArmB(g,P,L,-1,7.0+F,-0.6); pArmB(g,P,L,1,7.4+F,3.6); break; }
    case 'mug': { const F=P.hx-0.9; pC(g,8.6+F,0,2.4,lgr(g,8.6+F,0,2.4,L,'#8a5a3a',0.3,0.5)); pC(g,8.6+F,0,1.7,'#5a3018'); pC(g,8.3+F,-0.3,0.7,'#f6e8d8'); pArmB(g,P,L,-1,7.6+F,-2.7); pArmB(g,P,L,1,7.6+F,2.7); break; }
    case 'clasp': { const F=P.hx-0.9; pArmB(g,P,L,-1,6.6+F,-1.0); pArmB(g,P,L,1,6.6+F,1.0); break; }
    case 'behind': { pArmB(g,P,L,-1,-6.8,-3.0); pArmB(g,P,L,1,-6.8,3.0); break; }
  }
}
function pItem2(g,P,L,it,o){
  const R=P.ry;
  switch(it){
    case 'basket': pBasket(g,L,5.0,-R-1.4,3.4,o.basketc); pArmB(g,P,L,-1,4.4,-R-1.4); break;
    case 'cheese': { pC(g,5.6,-R-0.6,3.7,'#d8a030'); pC(g,5.6,-R-0.6,3.0,lgr(g,5.6,-R-0.6,3,L,'#f2cc58',0.3,0.3)); g.fillStyle='#f8e090'; g.beginPath(); g.moveTo(5.6,-R-0.6); g.arc(5.6,-R-0.6,3.0,-0.5,0.3); g.closePath(); g.fill(); for(const [x,y] of [[4.6,-R-1.6],[6.6,-R+0.4],[4.4,-R+0.2]]) pC(g,x,y,0.45,'#d8a838'); pArmB(g,P,L,-1,3.6,-R-0.9); break; }
    case 'loaf': { g.save(); g.translate(5.6,-R-0.8); g.rotate(0.35); pE(g,0,0,4.8,2.1,lgr(g,0,0,4.8,L,'#d8984a',0.3,0.45)); for(const x of [-2.4,0,2.4]) pLn(g,0.5,'#f2d8a0',[x-0.6,-1.0,x+0.6,1.0]); g.restore(); pArmB(g,P,L,-1,3.8,-R-0.4); break; }
    case 'kettle': { pC(g,6.8,-R-1.0,3.0,lgr(g,6.8,-R-1.0,3,L,'#4a4a50',0.35,0.5)); pC(g,6.8,-R-1.0,0.9,'#2a2a2e'); pLn(g,1.2,'#3a3a40',[9.4,-R-1.4,11.2,-R-2.2]); g.strokeStyle='#2a2a2e'; g.lineWidth=0.7; g.beginPath(); g.arc(6.8,-R-1.0,2.2,2.2,4.1); g.stroke(); pArmB(g,P,L,-1,4.6,-R-0.6); break; }
    case 'tray': { pC(g,6.8,-R+0.6,4.4,lgr(g,6.8,-R+0.6,4.4,L,'#9aa0a6',0.35,0.45)); g.strokeStyle='rgba(60,60,66,.5)'; g.lineWidth=0.4; g.beginPath(); g.arc(6.8,-R+0.6,3.8,0,TAU); g.stroke(); for(const [x,y] of [[5.6,-R-0.8],[8.2,-R+1.6]]){ pC(g,x,y,1.45,'#8a5a32'); pC(g,x,y,1.0,'#f6eedc'); } pC(g,8.2,-R-1.0,1.1,'#d89848'); pArmB(g,P,L,-1,5.4,-R+1.2); break; }
    case 'hatbox': { pC(g,5.6,-R-1.2,3.6,lgr(g,5.6,-R-1.2,3.6,L,'#f8e8ee',0.2,0.3)); g.save(); g.beginPath(); g.arc(5.6,-R-1.2,3.6,0,TAU); g.clip(); for(let i=-4;i<=4;i+=2) pLn(g,0.8,'#ff8ab0',[5.6+i-3,-R-5,5.6+i+3,-R+3]); g.restore(); g.strokeStyle='#c84a6a'; g.lineWidth=0.6; g.beginPath(); g.arc(5.6,-R-1.2,3.6,0,TAU); g.stroke(); pC(g,5.6,-R-1.2,0.9,'#c84a6a'); pArmB(g,P,L,-1,3.8,-R-0.2); break; }
    case 'lantern': { pRR(g,5.4,-R-2.8,2.6,2.6,0.6,'#3a2a1a'); pRR(g,5.8,-R-2.4,1.8,1.8,0.4,'#ffe6a0'); pArmB(g,P,L,-1,4.4,-R-0.6); break; }
    case 'fish': { g.save(); g.translate(6.2,-R-2.4); g.rotate(0.5); pE(g,0,0,3.8,1.4,lgr(g,0,0,3.8,L,'#a8c8d0',0.4,0.45)); g.fillStyle='#7a9aa8'; g.beginPath(); g.moveTo(-3.4,0); g.lineTo(-5.4,-1.6); g.lineTo(-5.4,1.6); g.closePath(); g.fill(); pC(g,2.6,-0.3,0.35,'#1a1a1a'); g.restore(); pArmB(g,P,L,-1,4.4,-R-0.8); break; }
    case 'fiddle': { pArmB(g,P,L,-1,9.4,-R-0.6); g.save(); g.translate(1.2,-R+0.6); g.rotate(-0.12); pE(g,-1.6,0,2.2,2.6,lgr(g,-1.6,0,2.6,L,'#b8642a',0.35,0.5)); pE(g,1.6,0,1.8,2.1,lgr(g,1.6,0,2.2,L,'#b8642a',0.35,0.5)); pLn(g,0.9,'#1e1410',[-1.6,0,8.4,0]); pC(g,8.8,0,0.8,'#5a3010'); pE(g,-3.5,0,0.8,1.2,'#1e1410'); g.restore(); pC(g,9.4,-R-0.6,2.0,POUT); pC(g,9.4,-R-0.6,1.5,P.hand); break; }
  }
}
function pPattern(g,P,kind,col,x0,y0,rx,ry){
  g.save(); g.beginPath(); g.ellipse(x0,y0,rx,ry,0,0,TAU); g.clip(); g.globalAlpha=0.5;
  if(kind==='stripes'){ g.fillStyle=col; for(let x=x0-rx;x<x0+rx;x+=2.6) g.fillRect(x,y0-ry,1.15,ry*2); }
  else if(kind==='plaid'){ g.fillStyle=col; g.globalAlpha=0.3; for(let x=x0-rx;x<x0+rx;x+=3.2) g.fillRect(x,y0-ry,1.4,ry*2); for(let y=y0-ry;y<y0+ry;y+=3.2) g.fillRect(x0-rx,y,rx*2,1.4); g.globalAlpha=0.35; g.fillStyle='rgba(20,10,6,1)'; for(let x=x0-rx+2.2;x<x0+rx;x+=3.2) g.fillRect(x,y0-ry,0.35,ry*2); }
  else if(kind==='dots'){ g.fillStyle=col; g.globalAlpha=0.7; let j=0; for(let x=x0-rx;x<x0+rx;x+=2.6,j++) for(let y=y0-ry+(j%2)*1.3;y<y0+ry;y+=2.6){ g.beginPath(); g.arc(x,y,0.55,0,TAU); g.fill(); } }
  else if(kind==='stars'){ g.globalAlpha=0.85; const r=mulberry32(phash(P.id+'st')); for(let i=0;i<9;i++) pStar(g,x0-rx+r()*rx*2,y0-ry+r()*ry*2,0.9,col); }
  g.restore();
}
function pBody(g,P,L){
  const o=P.o, O=P.outfit, tx=P.tx, rx=P.rx, ry=P.ry, hx=P.hx, hr=P.hr;
  // things trailing behind
  if(o.sled){ pLn(g,0.55,'#d8c8a0',[4.4,ry-0.2,-6,ry+1.6,-15.6,3.2]); pRR(g,-27,-4.2,11,8.4,1.6,lgr(g,-21,0,6,L,'#b07a40',0.3,0.5)); for(const x of [-25,-22.4,-19.8]) pLn(g,0.5,'rgba(70,40,15,.55)',[x,-3.6,x,3.6]); for(const s of [-1,1]){ g.strokeStyle='#5a5e66'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-27.6,s*4.5); g.lineTo(-15.8,s*4.5); g.quadraticCurveTo(-14,s*4.5,-14.4,s*2.8); g.stroke(); } }
  if(P.cape){ const cp=P.cape; g.fillStyle=lgr(g,tx-7,0,12,L,cp,0.25,0.5); g.beginPath(); g.moveTo(tx+2.4,-ry+0.8); g.quadraticCurveTo(tx-rx-3,-ry-1.2,tx-rx-7,-ry*0.55); g.quadraticCurveTo(tx-rx-9.2,0,tx-rx-7,ry*0.55); g.quadraticCurveTo(tx-rx-3,ry+1.2,tx+2.4,ry-0.8); g.closePath(); g.fill(); for(const k of [-0.5,0,0.5]) pLn(g,0.5,'rgba(0,0,0,.2)',[tx-rx+0.5,k*ry*0.8,tx-rx-7.8,k*ry*1.1]); }
  if(P.belly){ pE(g,tx+3.0,0,rx*0.82,ry*0.7,lgr(g,tx+3,0,ry*0.7,L,P.top,0.3,0.4)); }
  // the lower garment, seen as a ring around the body
  if(O==='dress'||O==='robe'){
    const cx=tx-(O==='robe'?1.2:0.6), sx=rx+(O==='robe'?3.6:3.0), sy=ry+(O==='robe'?1.0:1.5), sk=P.low;
    g.fillStyle=lgr(g,cx,0,sy,L,sk,0.25,0.45); g.beginPath();
    for(let i=0;i<=28;i++){ const a=i/28*TAU, w=1+0.035*Math.sin(i*TAU/4); g.lineTo(cx+Math.cos(a)*sx*w,Math.sin(a)*sy*w); } g.closePath(); g.fill();
    if(o.pattern&&(O==='dress'||o.pattern==='stars')) pPattern(g,P,o.pattern,hx6(o.patc,'#efe6d6'),cx,0,sx,sy);
    g.strokeStyle='rgba(0,0,0,.2)'; g.lineWidth=0.5; for(let i=0;i<9;i++){ const a=i/9*TAU+0.3; g.beginPath(); g.moveTo(cx+Math.cos(a)*sx*0.55,Math.sin(a)*sy*0.55); g.lineTo(cx+Math.cos(a)*sx*0.98,Math.sin(a)*sy*0.98); g.stroke(); }
    g.strokeStyle=O==='robe'?shd(P.trim,-0.1):'rgba(255,255,255,.22)'; g.lineWidth=O==='robe'?0.9:0.6; g.beginPath(); g.ellipse(cx,0,sx-0.7,sy-0.7,0,0,TAU); g.stroke();
  }else if(O==='coat'){
    g.fillStyle=lgr(g,tx-6,0,11,L,P.low,0.25,0.5); g.beginPath(); g.moveTo(tx+2.2,-ry+0.8); g.quadraticCurveTo(tx-rx,-ry-0.8,tx-rx-3.6,-ry+1.6); g.lineTo(tx-rx-5.4,-1.2); g.lineTo(tx-rx-4.4,0); g.lineTo(tx-rx-5.4,1.2); g.lineTo(tx-rx-3.6,ry-1.6); g.quadraticCurveTo(tx-rx,ry+0.8,tx+2.2,ry-0.8); g.closePath(); g.fill();
    pLn(g,0.5,'rgba(0,0,0,.3)',[tx-rx+0.4,0,tx-rx-4.4,0]);
    g.fillStyle=shd(P.low,-0.12); g.beginPath(); g.ellipse(tx+rx-0.6,0,3.2,ry*0.62,0,-1.3,1.3); g.closePath(); g.fill();
  }else if(O==='tunic'){ pE(g,tx-0.4,0,rx+1.1,ry+0.5,shd(P.top,-0.2)); }
  else if(O==='armor'){ pE(g,tx-0.4,0,rx+1.3,ry+0.7,'#6a707a'); g.fillStyle='rgba(30,34,40,.45)'; for(let a=0;a<TAU;a+=0.3){ g.beginPath(); g.arc(tx-0.4+Math.cos(a)*(rx+0.6),Math.sin(a)*(ry+0.1),0.4,0,TAU); g.fill(); } }
  if(o.belt&&O!=='dress'&&O!=='robe'&&O!=='fur'){ const bc=hx6(o.belt,'#3a2414'); g.strokeStyle=bc; g.lineWidth=1.2; g.beginPath(); g.ellipse(tx-0.3,0,rx+0.55,ry+0.2,0,0,TAU); g.stroke(); pRR(g,tx+rx-0.6,ry*0.55-1.1,2.0,2.2,0.4,'#d8b04a'); pRR(g,tx+rx-0.2,ry*0.55-0.6,1.2,1.2,0.2,bc); }
  if(o.bag){ g.save(); g.translate(tx-2.4,ry+1.2); pRR(g,-3.2,-1.9,6.4,3.8,1.0,lgr(g,0,0,3.2,L,o.bag,0.3,0.5)); pRR(g,-3.2,-1.9,6.4,1.9,0.8,shd(o.bag,-0.15)); pC(g,0,0,0.5,'#d8b04a'); g.restore(); }
  if(o.apron){ const ac=o.apron===true?'#ece4d4':hx6(o.apron,'#ece4d4'); g.fillStyle=lgr(g,tx+rx,0,5,L,ac,0.2,0.35); g.beginPath(); g.ellipse(tx+rx-0.4+(P.belly?1.6:0),0,3.2,ry*0.56,0,-1.45,1.45); g.closePath(); g.fill(); }
  // torso
  const T=P.top;
  if(O==='fur'){
    const fc=P.low; g.fillStyle=lgr(g,tx-0.5,0,ry+1.6,L,fc,0.25,0.45); g.beginPath(); g.ellipse(tx-0.5,0,rx+1.5,ry+1.1,0,0,TAU); for(let i=0;i<22;i++){ const a=i/22*TAU, x=tx-0.5+Math.cos(a)*(rx+1.5), y=Math.sin(a)*(ry+1.1); g.moveTo(x+1.4,y); g.arc(x,y,1.4,0,TAU); } g.fill();
    g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=0.4; for(let i=0;i<14;i++){ const a=i/14*TAU+0.2; g.beginPath(); g.moveTo(tx-0.5+Math.cos(a)*(rx-1),Math.sin(a)*(ry-1.6)); g.lineTo(tx-0.5+Math.cos(a)*(rx+1.3),Math.sin(a)*(ry+0.9)); g.stroke(); }
  }else{
    pE(g,tx,0,rx,ry,lgr(g,tx,0,ry,L,T,0.3,0.45));
    if(o.pattern&&O!=='armor'&&O!=='coat') pPattern(g,P,o.pattern,hx6(o.patc,'#efe6d6'),tx,0,rx,ry);
  }
  if(O==='vest'){ const V=P.low; pE(g,tx-0.6,0,rx-0.4,ry-2.7,lgr(g,tx-0.6,0,ry-2.7,L,V,0.25,0.45)); pLn(g,0.45,'rgba(0,0,0,.3)',[tx-rx+0.6,0,tx-1,0]); if(o.fleece){ g.fillStyle='#efe6d2'; for(let i=0;i<16;i++){ const a=i/16*TAU; pC(g,tx-0.6+Math.cos(a)*(rx-0.4),Math.sin(a)*(ry-2.7),0.9,'#efe6d2'); } } }
  else if(O==='overalls'){ const D=P.low; for(const s of [-1,1]) pLn(g,1.9,D,[tx+rx-0.6,s*3.4,tx,s*3.9,tx-rx+1.6,s*2.6]); pE(g,tx-rx+2.2,0,2.4,4.0,lgr(g,tx-rx+2.2,0,4,L,D,0.25,0.4)); pRR(g,tx+rx-1.8,-3.7,3.0,7.4,1.0,lgr(g,tx+rx,0,4,L,D,0.25,0.4)); for(const s of [-1,1]) pC(g,tx+rx-0.9,s*2.9,0.6,'#d8b04a'); }
  else if(O==='armor'){
    g.save(); g.beginPath(); g.ellipse(tx,0,rx,ry,0,0,TAU); g.clip(); g.fillStyle=lgr(g,tx,0,6,L,P.shirt,0.25,0.45); g.fillRect(tx-rx-1,-3.6,rx*2+2,7.2); pLn(g,0.6,shd(P.trim,0.1),[tx-rx,-3.6,tx+rx,-3.6]); pLn(g,0.6,shd(P.trim,0.1),[tx-rx,3.6,tx+rx,3.6]); g.restore();
    pC(g,tx-rx+2.2,0,1.3,P.trim);
    for(const s of [-1,1]){ pE(g,tx-0.2,s*(ry-1.4),3.7,3.1,lgr(g,tx-0.2,s*(ry-1.4),3.7,L,'#b4bcc8',0.4,0.5)); g.strokeStyle='rgba(30,34,40,.5)'; g.lineWidth=0.4; g.beginPath(); g.ellipse(tx-0.2,s*(ry-1.4),2.7,2.2,0,0,TAU); g.stroke(); }
  }else if(O==='coat'){ g.strokeStyle=shd(P.low,-0.25); g.lineWidth=0.5; g.beginPath(); g.moveTo(tx-rx+0.4,0); g.lineTo(tx-rx+3.2,0); g.stroke(); }
  if(o.sash){ g.save(); g.beginPath(); g.ellipse(tx,0,rx,ry,0,0,TAU); g.clip(); pLn(g,2.6,shd(o.sash,-0.3),[tx+rx*0.7,-ry,tx-rx*0.7,ry]); pLn(g,2.0,o.sash,[tx+rx*0.7,-ry,tx-rx*0.7,ry]); g.restore(); pC(g,tx-rx*0.38,ry*0.56,1.2,'#f6d860'); pC(g,tx-rx*0.38,ry*0.56,0.6,'#c84a3a'); }
  if(P.shawl){ const sw=P.shawl; g.fillStyle=lgr(g,tx-1,0,ry+1,L,sw,0.25,0.45); g.beginPath(); g.ellipse(tx-0.6,0,rx+0.8,ry+0.6,0,0.42*Math.PI,1.58*Math.PI); g.quadraticCurveTo(hx-0.6,0,tx-0.6+Math.cos(0.42*Math.PI)*(rx+0.8),Math.sin(0.42*Math.PI)*(ry+0.6)); g.closePath(); g.fill(); if(o.blanket) pPattern(g,P,'plaid','#efe6d6',tx-0.6,0,rx+0.8,ry+0.6); g.strokeStyle=shd(sw,0.2); g.lineWidth=0.5; for(let a=0.5*Math.PI;a<1.5*Math.PI;a+=0.16){ g.beginPath(); g.moveTo(tx-0.6+Math.cos(a)*(rx+0.6),Math.sin(a)*(ry+0.4)); g.lineTo(tx-0.6+Math.cos(a)*(rx+1.5),Math.sin(a)*(ry+1.3)); g.stroke(); } }
  if(P.hood){ pE(g,tx-rx+1.4,0,3.4,4.8,lgr(g,tx-rx+1.4,0,4.8,L,P.hood,0.25,0.45)); }
  // round the neck
  const nk=P.scarf||hx6(o.neck,null);
  if(nk){ pC(g,hx-0.3,0,hr+1.5,lgr(g,hx-0.3,0,hr+1.5,L,nk,0.3,0.45)); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=0.4; for(let a=0;a<TAU;a+=0.35){ g.beginPath(); g.moveTo(hx-0.3+Math.cos(a)*(hr+0.3),Math.sin(a)*(hr+0.3)); g.lineTo(hx-0.3+Math.cos(a)*(hr+1.4),Math.sin(a)*(hr+1.4)); g.stroke(); } pC(g,hx+hr*0.5,hr*0.95,1.5,shd(nk,-0.1)); }
  if(o.tape){ g.strokeStyle='#f2d860'; g.lineWidth=1.2; g.beginPath(); g.arc(hx-0.3,0,hr+0.7,0,TAU); g.stroke(); for(const s of [-1,1]){ pLn(g,1.2,'#f2d860',[hx+hr*0.4,s*(hr+0.4),hx+hr+2.4,s*2.6]); for(let k=0;k<3;k++) pLn(g,0.25,'#5a4a20',[hx+hr*0.5+k*0.9,s*(hr-0.2-k*0.55)-0.5,hx+hr*0.5+k*0.9,s*(hr-0.2-k*0.55)+0.5]); } }
  if(o.necklace){ const nc=o.necklace; for(let a=-1.2;a<=1.21;a+=0.3) pC(g,hx+Math.cos(a)*(hr+0.9),Math.sin(a)*(hr+0.9),0.45,nc); pC(g,hx+hr+1.7,0,o.sash?1.3:0.85,o.sash?'#f6d860':shd(nc,0.2)); }
  if(o.bag) pLn(g,1.1,shd(o.bag,-0.25),[tx+1.6,-ry+0.6,tx-1.6,ry-0.2]);
  // on the back
  if(o.back==='lute'){ g.save(); g.translate(tx-rx-0.2,3.8); g.rotate(0.55); pE(g,0,0,3.4,4.4,lgr(g,0,0,4.4,L,'#b8783a',0.35,0.5)); pC(g,0,-1.0,1.0,'#2a160a'); pLn(g,1.4,'#5a3416',[0,-3.6,0,-11.4]); pRR(g,-1.0,-13.6,2.0,2.6,0.4,'#3a200c'); g.globalAlpha=0.7; for(const d of [-0.5,0,0.5]) pLn(g,0.18,'#efe6d6',[d,2.6,d*0.4,-11]); g.restore(); }
  if(o.back==='bow'){ g.strokeStyle='#5a3a1e'; g.lineWidth=1.4; g.beginPath(); g.moveTo(tx-2.4,-ry+0.6); g.quadraticCurveTo(tx-rx-5,0,tx-2.4,ry-0.6); g.stroke(); pLn(g,0.35,'#e8e0d0',[tx-2.4,-ry+0.6,tx-2.4,ry-0.6]); g.save(); g.translate(tx-rx+1.8,-1.4); g.rotate(-0.6); pRR(g,-1.6,-5.5,3.2,11,1.4,lgr(g,0,0,4,L,'#7a4a24',0.3,0.5)); for(const x of [-0.8,0.2,1.0]){ pLn(g,0.9,'#d8d0c0',[x,-5.4,x+0.2,-7.2]); pC(g,x+0.2,-7.4,0.6,'#c83a2a'); } g.restore(); }
  if(o.back==='mapcase'){ pLn(g,3.0,'#3a2412',[tx-rx+0.6,5.6,tx+0.6,-ry+0.8]); pLn(g,2.3,'#9a6a32',[tx-rx+0.6,5.6,tx+0.6,-ry+0.8]); pC(g,tx-rx+0.6,5.6,1.3,'#c8a04a'); pC(g,tx+0.6,-ry+0.8,1.3,'#c8a04a'); }
  if(o.back==='pack'){ pRR(g,tx-rx-5.6,-6.8,9.4,13.6,2.2,lgr(g,tx-rx-1,0,7,L,'#8a6a42',0.3,0.5)); pRR(g,tx-rx-5.6,-6.8,4.0,13.6,1.8,shd('#8a6a42',-0.15)); for(const s of [-1,1]){ pC(g,tx-rx-2.0,s*3.4,0.6,'#d8b04a'); pLn(g,1.0,'#4a3018',[tx-rx+3.6,s*4.6,tx+2.6,s*5.8]); } g.save(); g.translate(tx-rx-6.6,0); pE(g,0,0,2.2,7.6,lgr(g,0,0,7,L,'#a04a3a',0.3,0.5)); for(const y of [-4,4]) pLn(g,0.8,'#4a3018',[-2.1,y,2.1,y]); g.restore(); for(const s of [-1,1]){ pC(g,tx-rx-1,s*8.0,1.9,lgr(g,tx-rx-1,s*8,1.9,L,'#c8743a',0.4,0.5)); pC(g,tx-rx-1,s*8.0,1.1,'#3a2418'); } pC(g,tx-rx+2.2,-7.6,1.1,'#ffd27a'); }
  if(o.crow){ const cx=tx-1.0, cy=-ry+0.6; g.fillStyle='#14141c'; g.beginPath(); g.moveTo(cx-1.6,cy-0.9); g.lineTo(cx-5.2,cy-1.6); g.lineTo(cx-5.4,cy+0.2); g.lineTo(cx-4.8,cy+1.6); g.lineTo(cx-1.6,cy+0.9); g.closePath(); g.fill(); g.strokeStyle=POUT; g.lineWidth=0.6; g.stroke(); pE(g,cx,cy,3.0,2.1,lgr(g,cx,cy,3,L,'#2a2a3a',0.4,0.5)); pE(g,cx-0.4,cy+(L.y>0?0.6:-0.6),1.9,0.9,'rgba(120,140,200,.35)'); pC(g,cx+2.8,cy,1.6,lgr(g,cx+2.8,cy,1.6,L,'#2a2a3a',0.4,0.5)); g.fillStyle='#d8c070'; g.beginPath(); g.moveTo(cx+4.0,cy-0.6); g.lineTo(cx+6.0,cy); g.lineTo(cx+4.0,cy+0.6); g.closePath(); g.fill(); pC(g,cx+3.2,cy-0.9,0.4,'#fff'); pC(g,cx+3.2,cy+0.9,0.4,'#fff'); }
  if(o.apron) for(const s of [-1,1]) pLn(g,0.7,o.apron===true?'#ece4d4':hx6(o.apron,'#ece4d4'),[tx+rx-0.8,s*3.0,tx,s*3.6,tx-rx+0.7,s*1.0]);
  if(o.apron){ const ac=o.apron===true?'#ece4d4':hx6(o.apron,'#ece4d4'); pE(g,tx-rx+0.5,-1.1,0.9,1.2,ac); pE(g,tx-rx+0.5,1.1,0.9,1.2,ac); }
  // hands that hold something
  if(P.hold) pItem(g,P,L,P.hold,o);
  if(P.hold2) pItem2(g,P,L,P.hold2,o);
}
function pBodyPost(g,P,L){
  const o=P.o, tx=P.tx, rx=P.rx, ry=P.ry, r=mulberry32(phash(P.id+'dust'));
  const la=Math.atan2(L.y*rx,L.x*ry); g.strokeStyle='rgba(255,250,232,.28)'; g.lineWidth=0.7; g.beginPath(); g.ellipse(tx,0,rx-0.5,ry-0.5,0,la-0.9,la+0.9); g.stroke();
  const speck=(n,col,sz)=>{ g.fillStyle=col; for(let i=0;i<n;i++){ const a=r()*TAU, d=Math.sqrt(r()); g.beginPath(); g.arc(tx+Math.cos(a)*rx*d,Math.sin(a)*ry*d,sz*(0.5+r()),0,TAU); g.fill(); } };
  if(o.flour) speck(16,'rgba(255,255,255,.7)',0.45);
  if(o.soot) speck(12,'rgba(30,22,20,.4)',0.5);
  if(o.oil){ g.fillStyle='rgba(40,30,16,.45)'; for(let i=0;i<4;i++){ g.beginPath(); g.ellipse(tx+rx-0.5+r()*2,(r()-0.5)*ry*0.9,1.0+r(),0.7+r()*0.6,r()*3,0,TAU); g.fill(); } }
  if(o.mossy) speck(14,'rgba(120,170,70,.55)',0.6);
  if(o.frost){ g.strokeStyle='rgba(225,242,255,.75)'; g.lineWidth=0.7; g.beginPath(); g.ellipse(tx,0,rx-0.4,ry-0.4,0,Math.atan2(L.y,L.x)-1.1,Math.atan2(L.y,L.x)+1.1); g.stroke(); speck(14,'rgba(230,245,255,.8)',0.4); }
}
// ---------- heads (bake)
function pHairTop(g,P,L,hd,H){
  const r=P.hr, gr=lgr(g,-1.6,0,r+0.4,L,H,0.3,0.45);
  switch(hd){
    case 'short': case 'pony': case 'braids': case 'pigtails': case 'bun': case 'long': {
      g.fillStyle=gr; g.beginPath(); g.arc(-2.4,0,r+0.2,0,TAU); if(hd==='long'){ g.moveTo(1.6,-r+0.4); g.ellipse(0.6,-(r-0.4),2.4,1.5,0,0,TAU); g.moveTo(3,r-0.4); g.ellipse(0.6,r-0.4,2.4,1.5,0,0,TAU); } g.fill();
      g.strokeStyle=shd(H,-0.3); g.lineWidth=0.4; g.globalAlpha=0.6; for(const a of [-1.9,-1.1,-0.4,0.4,1.1,1.9]){ g.beginPath(); g.moveTo(-3.6,0); g.quadraticCurveTo(-3.6+Math.cos(a)*2.4,Math.sin(a)*3.4,-2.4+Math.cos(a)*(r-0.3),Math.sin(a)*(r-0.3)); g.stroke(); } g.globalAlpha=1;
      if(hd==='braids'||hd==='pigtails') pLn(g,0.45,shd(H,-0.35),[-1,0,-r-1.2,0]);
      g.fillStyle=gr; for(const y of [-2.9,-0.9,1.0,3.0]){ g.beginPath(); g.moveTo(2.2,y-1.0); g.lineTo(3.5,y+0.2); g.lineTo(2.2,y+1.0); g.closePath(); g.fill(); }
      break; }
    case 'crop': { pC(g,-1.8,0,r-0.2,gr); g.fillStyle=shd(H,-0.25); g.globalAlpha=0.5; for(let i=0;i<18;i++){ const a=i*2.4, d=(i%5)/5*(r-1); g.beginPath(); g.arc(-1.3+Math.cos(a)*d,Math.sin(a)*d,0.3,0,TAU); g.fill(); } g.globalAlpha=1; break; }
    case 'curly': case 'wild': { const R0=hd==='wild'?r+0.3:r-0.9, cr=hd==='wild'?2.3:1.9, cx=hd==='wild'?-1.6:-2.0; g.fillStyle=gr; g.beginPath(); g.arc(cx,0,R0-0.6,0,TAU); for(let i=0;i<13;i++){ const a=0.7+i/12*(TAU-1.4), rr=cr*(hd==='wild'?0.8+((i*7)%5)/10:1); g.moveTo(cx+Math.cos(a)*R0+rr,Math.sin(a)*R0); g.arc(cx+Math.cos(a)*R0,Math.sin(a)*R0,rr,0,TAU); } g.fill(); g.strokeStyle=shd(H,-0.28); g.lineWidth=0.4; for(let i=0;i<9;i++){ const a=i*0.8, d=(i%3+1)*1.3; g.beginPath(); g.arc(cx+Math.cos(a)*d,Math.sin(a)*d,0.8,a,a+2.4); g.stroke(); } break; }
    case 'bald': { pE(g,L.x*2.2,L.y*2.2,2.0,1.3,'rgba(255,255,255,.35)',Math.atan2(L.y,L.x)); g.strokeStyle=gr; g.lineWidth=2.0; g.beginPath(); g.arc(0,0,r-0.9,0.6*Math.PI,1.4*Math.PI); g.stroke(); break; }
    case 'spiky': { g.fillStyle=gr; g.beginPath(); for(let i=0;i<26;i++){ const a=i/26*TAU, front=Math.cos(a)>0.55, q=i%2?(front?r-1.9:r-0.6):(front?r-0.9:r+1.6); g.lineTo(-1.8+Math.cos(a)*q,Math.sin(a)*q); } g.closePath(); g.fill(); pE(g,-1.8+L.x*1.6,L.y*1.6,1.6,0.9,shd(H,0.35),Math.atan2(L.y,L.x)); break; }
  }
}
function pHat(g,P,L,k){
  const r=P.hr, o=P.o;
  switch(k){
    case 'chef': { const W='#f7f5ef', gr=lgr(g,-1.4,0,6.6,L,W,0.12,0.32); g.fillStyle=gr; g.beginPath(); g.arc(-1.4,0,4.4,0,TAU); for(let i=0;i<7;i++){ const a=i/7*TAU+0.45, x=-1.4+Math.cos(a)*3.4, y=Math.sin(a)*3.4; g.moveTo(x+2.6,y); g.arc(x,y,2.6,0,TAU); } g.fill(); g.strokeStyle='rgba(150,140,120,.45)'; g.lineWidth=0.4; for(let i=0;i<7;i++){ const a=i/7*TAU+0.9; g.beginPath(); g.moveTo(-1.4+Math.cos(a)*1.2,Math.sin(a)*1.2); g.lineTo(-1.4+Math.cos(a)*5.6,Math.sin(a)*5.6); g.stroke(); } pE(g,-2.4+L.x*1.5,L.y*1.5,2.2,1.4,'rgba(255,255,255,.6)',Math.atan2(L.y,L.x)); break; }
    case 'straw': { const S='#dcb862'; pC(g,-0.7,0,7.2,lgr(g,-0.7,0,7.2,L,S,0.25,0.45)); g.strokeStyle='rgba(120,86,30,.28)'; g.lineWidth=0.4; for(const q of [6.5,5.7]){ g.beginPath(); g.arc(-0.7,0,q,0,TAU); g.stroke(); } for(let a=0;a<TAU;a+=0.42) pLn(g,0.3,'rgba(120,86,30,.25)',[-0.7+Math.cos(a)*4.8,Math.sin(a)*4.8,-0.7+Math.cos(a)*7.0,Math.sin(a)*7.0]); pC(g,-0.6,0,4.3,lgr(g,-0.6,0,4.3,L,'#e6c672',0.3,0.35)); g.strokeStyle=hx6(o.hatband,'#8a3a2a'); g.lineWidth=1.1; g.beginPath(); g.arc(-0.6,0,4.3,0,TAU); g.stroke(); pLn(g,0.6,'rgba(120,86,30,.35)',[-3,0,1.6,0]); break; }
    case 'top': { pE(g,-1.2,0,6.3,6.1,lgr(g,-1.2,0,6.3,L,'#2a2830',0.25,0.5)); pC(g,-1.0,0,4.4,lgr(g,-1.0,0,4.4,L,'#363440',0.3,0.45)); g.strokeStyle=hx6(P.hatc,'#8a2e22'); g.lineWidth=1.3; g.beginPath(); g.arc(-1.0,0,4.5,0,TAU); g.stroke(); const la=Math.atan2(L.y,L.x); g.strokeStyle='rgba(255,255,255,.22)'; g.lineWidth=0.8; g.beginPath(); g.arc(-1.0,0,3.0,la-0.8,la+0.8); g.stroke(); break; }
    case 'cap': { const C=hx6(P.hatc,'#4a6a3a'); g.fillStyle=shd(C,-0.22); g.beginPath(); g.ellipse(3.2,0,5.4,4.6,0,-Math.PI/2,Math.PI/2); g.closePath(); g.fill(); pC(g,-0.4,0,5.6,lgr(g,-0.4,0,5.6,L,C,0.3,0.45)); for(const a of [0.8,2.35,3.93,5.5]) pLn(g,0.35,'rgba(0,0,0,.22)',[-0.8,0,-0.4+Math.cos(a)*5.4,Math.sin(a)*5.4]); pC(g,-0.8,0,0.8,shd(C,-0.25)); break; }
    case 'beanie': { const C=hx6(P.hatc,'#c84a3a'); pC(g,-1.1,0,5.5,lgr(g,-1.1,0,5.5,L,C,0.3,0.45)); g.strokeStyle=shd(C,-0.22); g.lineWidth=1.2; g.beginPath(); g.arc(-1.1,0,4.9,0,TAU); g.stroke(); for(let a=0;a<TAU;a+=0.45) pLn(g,0.4,'rgba(0,0,0,.18)',[-1.1+Math.cos(a)*1.8,Math.sin(a)*1.8,-1.1+Math.cos(a)*4.2,Math.sin(a)*4.2]); const pp=hx6(o.pompom,'#f6f2ea'); for(let i=0;i<7;i++){ const a=i/7*TAU; pC(g,-1.6+Math.cos(a)*1.1,Math.sin(a)*1.1,1.2,shd(pp,-0.08)); } pC(g,-1.6,0,1.4,pp); break; }
    case 'feather': { const C=hx6(P.hatc,'#7a2a7a'); g.fillStyle=lgr(g,0,0,7,L,C,0.3,0.45); g.beginPath(); g.moveTo(7.6,0); g.quadraticCurveTo(5.4,-6.4,-3.6,-5.6); g.quadraticCurveTo(-7.4,0,-3.6,5.6); g.quadraticCurveTo(5.4,6.4,7.6,0); g.fill(); g.strokeStyle=shd(C,-0.3); g.lineWidth=0.5; g.beginPath(); g.ellipse(-0.6,0,4.6,4.4,0,0,TAU); g.stroke(); const F=hx6(o.featherc,'#ffd84a'); g.fillStyle=F; g.beginPath(); g.moveTo(0.4,-3.4); g.quadraticCurveTo(-6,-10.6,-14,-8.2); g.quadraticCurveTo(-6,-6.2,0.4,-3.4); g.fill(); pLn(g,0.4,'#fff8e0',[0.2,-3.6,-6,-8.2,-13.6,-8.2]); g.strokeStyle=shd(F,-0.3); g.lineWidth=0.3; for(let i=1;i<6;i++){ const x=-i*2.3; g.beginPath(); g.moveTo(x,-6.2-i*0.35); g.lineTo(x-1.2,-5.0-i*0.25); g.stroke(); } break; }
    case 'helm': { const S=o.frost?'#c4d0dc':'#aeb6c2'; if(P.plume){ g.fillStyle=lgr(g,-3,0,6,L,P.plume,0.3,0.5); g.beginPath(); g.moveTo(4.6,0); g.quadraticCurveTo(-1.6,-3,-11,-0.8); g.lineTo(-11.4,0); g.lineTo(-11,0.8); g.quadraticCurveTo(-1.6,3,4.6,0); g.fill(); } pC(g,0,0,6.1,lgr(g,0,0,6.1,L,S,0.4,0.55)); g.strokeStyle='#5a606a'; g.lineWidth=0.8; g.beginPath(); g.arc(0,0,5.7,0,TAU); g.stroke(); pLn(g,1.4,shd(S,-0.25),[5.2,0,-5.6,0]); pLn(g,0.5,shd(S,0.4),[4.8,-0.4,-5,-0.4]); for(let a=0.4;a<TAU;a+=0.8) pC(g,Math.cos(a)*5.0,Math.sin(a)*5.0,0.4,'#e8ecf0'); pRR(g,5.0,-0.75,2.3,1.5,0.4,shd(S,-0.1)); if(P.plume){ g.fillStyle=lgr(g,-2,0,4,L,P.plume,0.3,0.5); g.beginPath(); g.moveTo(4.2,0); g.quadraticCurveTo(-1,-2.2,-6,-0.6); g.lineTo(-6,0.6); g.quadraticCurveTo(-1,2.2,4.2,0); g.fill(); g.strokeStyle=shd(P.plume,-0.35); g.lineWidth=0.3; for(let x=3;x>-6;x-=1.4) pLn(g,0.3,shd(P.plume,-0.35),[x,-0.9,x-0.8,0.9]); } break; }
    case 'miner': { const C=hx6(P.hatc,'#c8a040'); g.fillStyle=lgr(g,-1.8,0,6.8,L,shd(C,-0.25),0.25,0.5); g.beginPath(); g.ellipse(-1.8,0,6.8,6.8,0,0.36*Math.PI,1.64*Math.PI); g.closePath(); g.fill(); pC(g,-1.2,0,5.3,lgr(g,-1.2,0,5.3,L,C,0.4,0.5)); pLn(g,1.0,shd(C,-0.3),[3.6,0,-6.2,0]); for(const s of [-1,1]) pLn(g,0.5,shd(C,-0.2),[3.0,s*2.4,-5.4,s*2.6]); if(o.lamp){ pRR(g,3.3,-1.15,2.4,2.3,0.5,'#8a6a2a'); pC(g,5.9,0,1.05,'#fff4c0'); } break; }
    case 'rain': { const C=hx6(P.hatc,'#e8c03a'); pE(g,-2.0,0,8.4,7.0,lgr(g,-2.0,0,8.4,L,C,0.3,0.45)); g.strokeStyle='rgba(0,0,0,.2)'; g.lineWidth=0.4; g.beginPath(); g.ellipse(-2.0,0,7.5,6.1,0,0,TAU); g.stroke(); pC(g,-0.4,0,4.6,lgr(g,-0.4,0,4.6,L,C,0.4,0.35)); for(let a=0.3;a<TAU;a+=TAU/5) pLn(g,0.4,'rgba(0,0,0,.18)',[-0.4,0,-0.4+Math.cos(a)*4.4,Math.sin(a)*4.4]); break; }
    case 'fancy': { const C=hx6(P.hatc,'#ffb0c8'); pC(g,-0.4,0,8.8,lgr(g,-0.4,0,8.8,L,C,0.3,0.45)); g.strokeStyle=shd(C,-0.3); g.lineWidth=0.6; g.beginPath(); g.arc(-0.4,0,8.4,0,TAU); g.stroke(); g.fillStyle='rgba(255,255,255,.5)'; for(let a=0;a<TAU;a+=0.55){ g.beginPath(); g.arc(-0.4+Math.cos(a)*6.8,Math.sin(a)*6.8,0.55,0,TAU); g.fill(); } const F=hx6(o.featherc,'#fff4e0'); g.fillStyle=F; g.beginPath(); g.moveTo(-1,4); g.quadraticCurveTo(-8,9.5,-14.6,5.4); g.quadraticCurveTo(-7,6,-1,4); g.fill(); pC(g,-0.4,0,4.8,lgr(g,-0.4,0,4.8,L,shd(C,-0.12),0.3,0.4)); g.strokeStyle='#c84a6a'; g.lineWidth=1.4; g.beginPath(); g.arc(-0.4,0,4.9,0,TAU); g.stroke(); for(const a of [-0.9,-0.35,0.25]){ const x=-0.4+Math.cos(a)*5.3, y=Math.sin(a)*5.3; pE(g,x+Math.cos(a)*1.4,y+Math.sin(a)*1.4+0.6,1.1,0.6,'#5a9a3a',a); pC(g,x,y,1.55,'#e84a7a'); g.strokeStyle='#a02a50'; g.lineWidth=0.35; g.beginPath(); g.arc(x,y,0.8,0,4.4); g.stroke(); } break; }
    case 'fur': { const C=hx6(P.hatc,'#8a6a4a'); for(const s of [-1,1]) pE(g,0.2,s*5.4,3.0,2.0,lgr(g,0.2,s*5.4,3,L,C,0.3,0.45)); pC(g,-0.4,0,5.5,lgr(g,-0.4,0,5.5,L,C,0.3,0.45)); pE(g,3.8,0,2.0,4.8,lgr(g,3.8,0,4.8,L,shd(C,0.15),0.3,0.4)); g.strokeStyle='rgba(0,0,0,.2)'; g.lineWidth=0.4; for(let i=0;i<10;i++){ const a=i*0.63; pLn(g,0.4,'rgba(0,0,0,.2)',[-0.4+Math.cos(a)*2,Math.sin(a)*2,-0.4+Math.cos(a)*3.4,Math.sin(a)*3.4+0.6]); } break; }
    case 'kerchief': { const C=hx6(P.hatc,'#c84a3a'); g.fillStyle=C; g.beginPath(); g.moveTo(-r-0.8,0); g.lineTo(-r-3.8,-1.6); g.lineTo(-r-3.4,0.2); g.lineTo(-r-4.0,1.8); g.closePath(); g.fill(); pC(g,-1.3,0,r+0.3,lgr(g,-1.3,0,r+0.3,L,C,0.3,0.45)); pC(g,-r-1.0,0,1.1,shd(C,-0.15)); g.save(); g.beginPath(); g.arc(-1.3,0,r+0.3,0,TAU); g.clip(); g.fillStyle='rgba(255,255,255,.55)'; let j=0; for(let x=-7;x<6;x+=2.2,j++) for(let y=-7+(j%2)*1.1;y<7;y+=2.2){ g.beginPath(); g.arc(x,y,0.4,0,TAU); g.fill(); } g.restore(); g.strokeStyle=shd(C,-0.3); g.lineWidth=0.8; g.beginPath(); g.arc(-1.3,0,r,-1.0,1.0); g.stroke(); break; }
    case 'wizard': { const C=hx6(P.hatc,'#3a3a8a'); pC(g,0,0,7.6,lgr(g,0,0,7.6,L,C,0.25,0.5)); for(let i=0;i<6;i++){ const f=i/6; pC(g,-1.4*f+L.x*f*0.6,-0.4*f+L.y*f*0.6,5.2*(1-f)+0.4,shd(C,f*0.35-0.05)); } for(const a of [0.6,2.2,3.6,5.0]) pStar(g,Math.cos(a)*6.3,Math.sin(a)*6.3,1.0,'#ffe066'); break; }
    case 'party': { pC(g,0,0,5.6,lgr(g,0,0,5.6,L,'#e84a8a',0.3,0.45)); for(let a=0;a<TAU;a+=TAU/6) pLn(g,0.8,'#ffd84a',[0,0,Math.cos(a)*5.4,Math.sin(a)*5.4]); pC(g,0,0,1.6,'#4ac8e8'); break; }
    case 'crown': { g.strokeStyle='#d8a838'; g.lineWidth=1.5; g.beginPath(); g.arc(0,0,4.6,0,TAU); g.stroke(); for(let i=0;i<8;i++){ const a=i/8*TAU; pC(g,Math.cos(a)*5.2,Math.sin(a)*5.2,1.0,['#ffd84a','#ff7aa0','#fff','#b48cff'][i%4]); } break; }
    default: pC(g,-0.3,0,5.6,lgr(g,-0.3,0,5.6,L,hx6(P.hatc,'#6a5a4a'),0.3,0.45));
  }
}
function pHead(g,P,L){
  const o=P.o, r=P.hr, H=P.hair, hd=P.hairdo, hat=P.hat, hood=P.hood, gH=lgr(g,-r-2,0,r+3,L,H,0.25,0.45);
  // hair that hangs behind the head
  if(!hood){
    if(hd==='long'){ g.fillStyle=gH; g.beginPath(); g.moveTo(-0.4,-r-0.4); g.quadraticCurveTo(-r-2,-r-0.8,-r-6.4,-r+1.0); g.quadraticCurveTo(-r-8.2,0,-r-6.4,r-1.0); g.quadraticCurveTo(-r-2,r+0.8,-0.4,r+0.4); g.closePath(); g.fill(); g.strokeStyle=shd(H,-0.3); g.lineWidth=0.4; for(const y of [-3.4,-1.2,1.2,3.4]) pLn(g,0.4,shd(H,-0.3),[-r,y*0.9,-r-6.2,y*1.15]); }
    else if(hd==='pony'){ g.fillStyle=gH; g.beginPath(); g.moveTo(-r-0.6,-1.4); g.quadraticCurveTo(-r-4.4,-2.8,-r-7.6,-0.3); g.quadraticCurveTo(-r-5,1.8,-r-0.6,1.4); g.closePath(); g.fill(); pLn(g,0.35,shd(H,-0.3),[-r-1,0,-r-6.6,-0.2]); }
    else if(hd==='braids'){ for(const s of [-1,1]){ for(let j=0;j<5;j++) pE(g,-r+0.8-j*1.85,s*(2.5+j*0.4),1.3,1.05,lgr(g,-r-j*1.85,s*2.8,1.3,L,H,0.3,0.4),s*(j%2?0.5:-0.5)); pC(g,-r-7.4,s*4.6,0.75,P.trim); } }
    else if(hd==='pigtails'){ for(const s of [-1,1]){ pE(g,-1.4,s*(r+1.6),2.2,2.7,lgr(g,-1.4,s*(r+1.6),2.7,L,H,0.3,0.45),s*0.4); pC(g,-1.0,s*(r+0.2),0.85,P.trim); } }
  }
  // beard sits below and in front of the face
  if(P.beard){ const B=hx6(o.beardc,H), big=P.beard==='big', bx=big?r-0.5:r-1.0, brx=big?4.2:2.9, bry=big?5.0:3.7; pE(g,bx,0,brx,bry,lgr(g,bx,0,bry,L,B,0.25,0.4)); if(big) pE(g,bx+brx+0.4,0,1.6,1.5,lgr(g,bx+brx,0,1.6,L,B,0.25,0.4)); g.strokeStyle=shd(B,-0.3); g.lineWidth=0.35; for(const y of [-2.4,-0.8,0.8,2.4]) pLn(g,0.35,shd(B,-0.3),[bx-0.5,y*0.7,bx+brx*0.85,y*(big?1.15:1.0)]); }
  // ears
  const showEars=!hood&&(hd==='short'||hd==='crop'||hd==='bald'||hd==='spiky'||hd==='pony'||hd==='bun');
  if(showEars) for(const s of [-1,1]) pE(g,0.3,s*(r-0.1),1.05,1.35,shd(P.skin,-0.12));
  // the head itself
  pE(g,0,0,r,r*0.98,lgr(g,0,0,r,L,P.skin,0.25,0.42));
  const la=Math.atan2(L.y,L.x);
  if(!hood){
    if(o.blush) for(const s of [-1,1]) pE(g,r*0.6,s*2.9,0.95,0.6,'rgba(235,105,105,.42)');
    if(o.freckles){ g.fillStyle='rgba(140,70,40,.55)'; for(const [x,y] of [[3.0,-2.4],[3.6,-3.0],[3.2,2.5],[3.8,3.1],[2.6,-3.3],[2.7,3.4]]){ g.beginPath(); g.arc(x,y,0.25,0,TAU); g.fill(); } }
    pC(g,r-0.35,0,0.9,shd(P.skin,0.1)); pC(g,r-0.35+L.x*0.3,L.y*0.3,0.42,shd(P.skin,0.35));
    for(const s of [-1,1]){ pC(g,r*0.72,s*1.95,0.62,'#1e1410'); pC(g,r*0.72-0.2,s*1.95-0.2,0.2,'rgba(255,255,255,.8)'); pLn(g,0.45,shd(P.hair,-0.1),[r*0.6,s*1.2,r*0.62,s*2.8]); }
  }
  if(hood){
    g.fillStyle=lgr(g,-1.6,0,r+1.2,L,hood,0.3,0.45); g.beginPath(); g.arc(-1.8,0,r+0.8,0,TAU); g.moveTo(-r-1.6,-2.6); g.lineTo(-r-4.6,0); g.lineTo(-r-1.6,2.6); g.fill();
    g.strokeStyle=shd(hood,-0.35); g.lineWidth=1.0; g.beginPath(); g.arc(-1.8,0,r+0.4,-0.95,0.95); g.stroke();
    for(const s of [-1,1]) pC(g,r*0.86,s*1.7,0.48,'#1e1410');
    if(o.hairwisp){ g.strokeStyle=H; g.lineWidth=0.6; for(const s of [-1,1]){ g.beginPath(); g.moveTo(r-1.2,s*2.6); g.quadraticCurveTo(r+0.2,s*3.6,r-0.4,s*4.4); g.stroke(); } }
    if(o.sprig){ pE(g,-2.4,-3.8,1.5,0.7,'#6aa83a',-0.6); pE(g,-3.4,-2.8,1.3,0.6,'#8ac85a',0.5); pLn(g,0.3,'#4a3a1a',[-1.4,-4.2,-3.8,-2.6]); }
  }else{
    if(hat!=='helm'&&hat!=='miner'&&hat!=='kerchief') pHairTop(g,P,L,hd,H);
    if(hd==='bun'){ pC(g,-r+0.6,0,2.7,lgr(g,-r+0.6,0,2.7,L,H,0.3,0.45)); g.strokeStyle=shd(H,-0.3); g.lineWidth=0.4; g.beginPath(); g.arc(-r+0.6,0,1.5,0,4.6); g.stroke(); if(o.pin){ pLn(g,0.5,'#d8b04a',[-r-2.2,-1.8,-r+3.0,1.6]); pC(g,-r-2.2,-1.8,0.6,'#7ac8e8'); } }
    if(o.band){ g.strokeStyle=o.band; g.lineWidth=1.1; g.beginPath(); g.arc(-0.8,0,r-0.1,-1.25,1.25); g.stroke(); pC(g,-r+0.1,0,1.0,o.band); }
    if(showEars&&o.earrings) for(const s of [-1,1]) pC(g,0.5,s*(r+1.05),0.55,'#f2c84a');
    else if(o.earrings) for(const s of [-1,1]) pC(g,1.0,s*(r+0.5),0.55,'#f2c84a');
    // a rim of light on the lit side of the hair
    g.strokeStyle='rgba(255,250,235,.22)'; g.lineWidth=0.7; g.beginPath(); g.arc(-1.4,0,r-0.4,la-0.7,la+0.7); g.stroke();
  }
    if(P.stache){ const M=shd(hx6(o.beardc,H),-0.08), big=P.stache==='big'; g.fillStyle=M; for(const s of [-1,1]){ g.beginPath(); if(big){ g.moveTo(r+0.6,0); g.quadraticCurveTo(r+1.9,s*2.6,r+0.3,s*5.6); g.quadraticCurveTo(r-0.4,s*8.0,r-3.0,s*7.2); g.quadraticCurveTo(r-1.4,s*6.4,r-1.2,s*5.0); g.quadraticCurveTo(r-0.5,s*2.2,r-0.5,0); } else { g.moveTo(r+0.5,0); g.quadraticCurveTo(r+1.4,s*2.0,r-0.2,s*3.4); g.quadraticCurveTo(r-0.7,s*2.0,r-0.5,0); } g.closePath(); g.fill(); g.strokeStyle=shd(M,-0.35); g.lineWidth=0.35; g.stroke(); } }
  if(o.eyepatch){ pLn(g,0.6,'#1a1410',[r*0.78,-1.95,-0.6,r*0.95]); pE(g,r*0.8,-1.95,1.15,1.3,'#1a1410'); }
  if(o.glasses){ g.strokeStyle='#2a2420'; g.lineWidth=0.5; for(const s of [-1,1]){ g.beginPath(); g.arc(r*0.8,s*1.95,1.25,0,TAU); g.stroke(); pC(g,r*0.8-0.3,s*1.95-0.35,0.35,'rgba(255,255,255,.75)'); } pLn(g,0.45,'#2a2420',[r*0.8,-0.7,r*0.8,0.7]); }
  if(hat) pHat(g,P,L,hat);
  if(o.goggles){ g.strokeStyle='#3a2a1e'; g.lineWidth=0.9; g.beginPath(); g.arc(-0.4,0,hat?5.6:r-0.3,-1.5,1.5); g.stroke(); for(const s of [-1,1]){ pC(g,2.0,s*2.2,1.7,'#b8943a'); pC(g,2.0,s*2.2,1.15,'#8ad0e0'); pC(g,1.7,s*2.2-0.4,0.4,'rgba(255,255,255,.8)'); } }
  if(o.flower){ const fx=hat?-0.6:-1.4, fy=hat?(hat==='straw'?-5.2:-5.6):-3.8; for(let i=0;i<5;i++){ const a=i/5*TAU; pC(g,fx+Math.cos(a)*0.95,fy+Math.sin(a)*0.95,0.85,o.flower); } pC(g,fx,fy,0.6,'#ffd84a'); }
  if(o.pipe){ pLn(g,0.8,'#4a2c18',[r-0.4,1.3,r+2.2,2.5]); pC(g,r+2.7,2.7,1.15,'#5a3420'); pC(g,r+2.7,2.7,0.5,'#ff8a3a'); }
}
function pHeadPost(g,P,L){
  const o=P.o;
  if(o.flour){ g.fillStyle='rgba(255,255,255,.75)'; const r=mulberry32(phash(P.id+'hf')); for(let i=0;i<8;i++){ g.beginPath(); g.arc((r()-0.6)*8,(r()-0.5)*10,0.3+r()*0.3,0,TAU); g.fill(); } }
  if(o.frost){ const r=mulberry32(phash(P.id+'hz')); g.fillStyle='rgba(235,248,255,.9)'; for(let i=0;i<10;i++){ const a=r()*TAU; g.beginPath(); g.arc(Math.cos(a)*5.6,Math.sin(a)*5.6,0.35+r()*0.4,0,TAU); g.fill(); } for(let i=0;i<5;i++){ const a=Math.PI*0.6+i*0.2; g.beginPath(); g.moveTo(Math.cos(a)*5.7,Math.sin(a)*5.7); g.lineTo(Math.cos(a)*7.3,Math.sin(a)*7.3); g.lineTo(Math.cos(a+0.08)*5.7,Math.sin(a+0.08)*5.7); g.fill(); } }
}
function pBucket(a){ return ((Math.round(a/TAU*PDIR)%PDIR)+PDIR)%PDIR; }
// part keys: b body, h head, c standing still (shadow, arms, body, head), w0..w5 walking frames
function pGet(P,part,b,must){
  const CS=pCS(), base=P.sig+part, key=base+b+'|'+CS; let s=PSPR.get(key); if(s) return s;
  if(performance.now()>PBT&&!must){ if(part==='c'||part[0]==='w') return null; for(let d=1;d<=PDIR/2;d++){ s=PSPR.get(base+((b+d)%PDIR)+'|'+CS)||PSPR.get(base+((b-d+PDIR)%PDIR)+'|'+CS); if(s) return s; } }
  PBAKES++; if(PSPR.size>2400) PSPR.clear();
  const th=b/PDIR*TAU, L=lightLocal(th), res=CS*P.k, c=Math.cos(th), sn=Math.sin(th);
  if(part==='h') s=pBake(P.hh*P.hk,res,g=>{ g.rotate(th); g.scale(P.hk,P.hk); pHead(g,P,L); },g=>{ g.rotate(th); g.scale(P.hk,P.hk); pHeadPost(g,P,L); });
  else if(part==='b') s=pBake(P.bh,res,g=>{ g.rotate(th); pBody(g,P,L); },g=>{ g.rotate(th); pBodyPost(g,P,L); });
  else {
    const bo=pGet(P,'b',b,true), he=pGet(P,'h',b,true), walk=part[0]==='w', ph=walk?(+part[1]+0.5)/6*TAU:0, sw=walk?Math.sin(ph):0;
    const hx=P.hx+(walk?0.5+(P.kid?Math.abs(Math.cos(ph))*0.4:0):0);
    s=pBake(Math.max(P.bh,P.ry+2.2,P.hx+P.hh*P.hk+(walk?0.9:0)),res,g=>{
      const R=P.ry+2; g.drawImage(pShadow(),-R,-R,R*2,R*2);
      g.save(); g.rotate(th); if(walk) pFeet(g,P,sw); pArms(g,P,L,sw,1); g.restore();
      g.drawImage(bo,bo.ox,bo.oy,bo.w,bo.h);
      g.save(); g.rotate(th); if(P.scarf) pScarf(g,P,walk?ph/4.2:0,walk?1:0); g.restore();
      g.drawImage(he,hx*c+he.ox,hx*sn+he.oy,he.w,he.h);
    },null,true);
  }
  PSPR.set(key,s); return s;
}
// ---------- limbs (vector, in the person's local space)
function pFeet(g,P,sw){
  const fx0=P.tx+1.4, st=(P.old?4.4:6.6)*sw, Y=3.9;
  if(!P.dress){ g.strokeStyle=POUT; g.lineWidth=4.4; g.beginPath(); g.moveTo(P.tx,-Y); g.lineTo(fx0-st-1.2,-Y); g.moveTo(P.tx,Y); g.lineTo(fx0+st-1.2,Y); g.stroke(); g.strokeStyle=P.legs; g.lineWidth=3.2; g.stroke(); }
  g.fillStyle=POUT; g.beginPath(); g.ellipse(fx0-st,-Y,3.4,2.3,0,0,TAU); g.moveTo(fx0+st+3.4,Y); g.ellipse(fx0+st,Y,3.4,2.3,0,0,TAU); g.fill();
  g.fillStyle=P.shoe; g.beginPath(); g.ellipse(fx0-st-0.1,-Y,2.7,1.6,0,0,TAU); g.moveTo(fx0+st+2.6,Y); g.ellipse(fx0+st-0.1,Y,2.7,1.6,0,0,TAU); g.fill();
  g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(fx0-st+0.6,-Y-0.4,1.2,0.6,0,0,TAU); g.ellipse(fx0+st+0.6,Y-0.4,1.2,0.6,0,0,TAU); g.fill();
}
const PARM=[0,0,0,0,0,0,0,0,0,0];
function pArms(g,P,L,sw,bs){
  const fl=P.armL==='free', fr=P.armR==='free'; if(!fl&&!fr) return;
  let n=0; const sx=P.tx+0.3;
  for(let s=-1;s<=1;s+=2){ if(!(s>0?fr:fl)) continue; const ao=-s*sw*4.6; PARM[n]=s; PARM[n+1]=sx; PARM[n+2]=s*(P.ry-1.7)*bs; PARM[n+3]=P.tx+1.5+ao; PARM[n+4]=s*(P.ry+0.25-Math.abs(ao)*0.12)*bs; n+=5; }
  g.strokeStyle=POUT; g.lineWidth=P.aw+1.3; g.beginPath(); for(let i=0;i<n;i+=5){ g.moveTo(PARM[i+1],PARM[i+2]); g.lineTo(PARM[i+3],PARM[i+4]); } g.stroke();
  g.lineWidth=P.aw; for(let i=0;i<n;i+=5){ const x0=PARM[i+1],y0=PARM[i+2]; g.strokeStyle=L.y*PARM[i]>0?P.sleeveL:P.sleeveD; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0+(PARM[i+3]-x0)*0.75,y0+(PARM[i+4]-y0)*0.75); g.stroke(); }
  g.fillStyle=POUT; g.beginPath(); for(let i=0;i<n;i+=5){ g.moveTo(PARM[i+3]+2,PARM[i+4]); g.arc(PARM[i+3],PARM[i+4],2.0,0,TAU); } g.fill();
  g.fillStyle=P.hand; g.beginPath(); for(let i=0;i<n;i+=5){ g.moveTo(PARM[i+3]+1.5,PARM[i+4]); g.arc(PARM[i+3],PARM[i+4],1.5,0,TAU); } g.fill();
}
function pScarf(g,P,t,wk){
  const sx=P.hx-P.hr*0.45, len=(P.o.scarfLen||1)*(4.6+wk*6.5), A=0.35+wk*1.5, wv=Math.sin(t*4.2)*A, wv2=Math.sin(t*4.2+1.3)*A;
  for(let i=0;i<2;i++){ const y0=i?-1.0:-2.6, dy=i?-0.4:-1.8, w=i?wv2:wv, ex=sx-len, ey=y0+dy+w;
    g.strokeStyle=POUT; g.lineWidth=3.6; g.beginPath(); g.moveTo(sx,y0); g.quadraticCurveTo(sx-len*0.55,y0+dy*0.4+w*0.4,ex,ey); g.stroke();
    g.strokeStyle=P.scarf; g.lineWidth=2.4; g.stroke(); g.strokeStyle=P.scarfL; g.lineWidth=0.7; g.stroke();
    g.lineWidth=0.5; g.strokeStyle=P.scarf; g.beginPath(); for(let d=-0.8;d<0.9;d+=0.8){ g.moveTo(ex,ey+d); g.lineTo(ex-1.3,ey+d*1.2+w*0.2); } g.stroke(); }
}
function pPuffs(x,y,t,n,col,dir,sz){ for(let i=0;i<n;i++){ const f=(t*0.55+i/n)%1; ctx.fillStyle=`rgba(${col},${(1-f)*0.38})`; ctx.beginPath(); ctx.arc(x+dir*f*5+Math.sin(t*2+i*2)*0.8,y-f*2.5+i*0.4,sz*(0.6+f*1.8),0,TAU); ctx.fill(); } }
// a person at (cx,cy) facing `face`, head turned by ht; every bitmap is pre-rotated so blits stay axis aligned (fast)
function pDraw(n,P,face,ht,wk,ph,breath,cx,cy){
  const k=P.k*(1+breath), t=n.t||0, fb=pBucket(face), hb=pBucket(face+ht);
  let S=null;
  if(hb===fb&&P.armR!=='bow'){ S=wk<0.35?pGet(P,'c',fb):pGet(P,'w'+(Math.floor((((ph%TAU)+TAU)%TAU)/TAU*6)%6),fb); }
  const c=Math.cos(face), s=Math.sin(face);
  ctx.save(); ctx.translate(cx,cy);
  let hxp=P.hx;
  if(S) ctx.drawImage(S,S.ox*k,S.oy*k,S.w*k,S.h*k);
  else{
    const L=lightLocal(face), body=pGet(P,'b',fb), head=pGet(P,'h',hb), sw=Math.sin(ph)*wk, R=(P.ry+2)*k;
    ctx.drawImage(pShadow(),-R,-R,R*2,R*2);
    ctx.save(); ctx.rotate(face); ctx.scale(k,k); ctx.lineCap='round'; ctx.lineJoin='round'; if(wk>0.05) pFeet(ctx,P,sw); pArms(ctx,P,L,sw,1); ctx.restore();
    ctx.drawImage(body,body.ox*k,body.oy*k,body.w*k,body.h*k);
    if(P.scarf||P.armR==='bow'){ ctx.save(); ctx.rotate(face); ctx.scale(k,k); ctx.lineCap='round'; ctx.lineJoin='round';
      if(P.scarf) pScarf(ctx,P,t,wk);
      if(P.armR==='bow'){ const osc=Math.sin(t*5.5), hx=4.6+osc*0.6, hy=-1.4+osc*2.8, ex=hx-2.2, ey=hy-13.5; ctx.strokeStyle=POUT; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(ex,ey); ctx.stroke(); ctx.strokeStyle='#f0e6d0'; ctx.lineWidth=0.5; ctx.stroke(); ctx.strokeStyle='#6a3a18'; ctx.lineWidth=0.6; ctx.beginPath(); ctx.moveTo(hx+0.5,hy); ctx.lineTo(ex+0.5,ey); ctx.stroke();
        ctx.strokeStyle=POUT; ctx.lineWidth=P.aw+1.3; ctx.beginPath(); ctx.moveTo(P.tx+0.3,P.ry-1.7); ctx.lineTo(hx,hy); ctx.stroke(); ctx.strokeStyle=L.y>0?P.sleeveL:P.sleeveD; ctx.lineWidth=P.aw; ctx.stroke(); ctx.fillStyle=P.hand; ctx.beginPath(); ctx.arc(hx,hy,1.5,0,TAU); ctx.fill(); }
      ctx.restore(); }
    hxp=P.hx+wk*0.5;
    ctx.drawImage(head,hxp*c*k+head.ox*k,hxp*s*k+head.oy*k,head.w*k,head.h*k);
  }
  // glows (axis aligned), steam and smoke
  if(P.fx.length){ const nightK=0.45+0.55*(1-daylight()), gl=(x,y,r,a)=>pGlowAt((x*c-y*s)*k,(x*s+y*c)*k,r*k,a);
    const hc=Math.cos(face+ht), hs=Math.sin(face+ht), hX=hxp*c, hY=hxp*s, hg=(x,y,r,a)=>pGlowAt((hX+x*hc-y*hs)*k,(hY+x*hs+y*hc)*k,r*k,a);
    for(const f of P.fx){
      if(f==='lantern') gl(11.9,P.ry+4.7,10+Math.sin(t*9)*0.8,0.5*nightK+0.15);
      else if(f==='lamp') gl(7.6,P.ry+0.6,7+Math.sin(t*11)*0.6,0.45*nightK+0.15);
      else if(f==='lantern2') gl(6.7,-P.ry-1.5,7+Math.sin(t*10)*0.6,0.45*nightK+0.15);
      else if(f==='miner') hg(P.hr+3.4,0,6+nightK*4,0.35+0.4*nightK);
    }
    ctx.rotate(face); ctx.scale(k,k);
    for(const f of P.fx){
      if(f==='kettle') pPuffs(11.4,-P.ry-2.4,t,3,'235,235,240',1,0.9);
      else if(f==='mug') pPuffs(8.6+P.hx-0.9,0,t,3,'245,240,235',0.6,0.7);
      else if(f==='frost'&&!reduceMotion){ for(let i=0;i<2;i++){ const q=(t*0.7+i*0.5)%1, a=i*2.6+Math.floor(t*0.7+i*0.5)*1.7; ctx.globalAlpha=Math.sin(q*Math.PI)*0.9; pStar(ctx,P.tx+Math.cos(a)*P.rx*0.8,Math.sin(a)*P.ry*0.8,1.3,'#eef8ff'); ctx.globalAlpha=1; } }
    }
    ctx.translate(hxp,0); ctx.rotate(ht);
    for(const f of P.fx){
      if(f==='pipe') pPuffs(P.hr+3.0,2.7,t,3,'210,210,215',-0.4,0.7);
      else if(f==='frost'){ const q=(t*0.4+P.seed)%1; if(q<0.35){ ctx.fillStyle=`rgba(240,248,255,${(0.35-q)*1.4})`; ctx.beginPath(); ctx.arc(P.hr+2+q*8,0,1.2+q*6,0,TAU); ctx.fill(); } }
    }
  }
  ctx.restore();
}
function drawPerson(n,L,o){ const P=n._ppx&&n._ppx.src===o?n._ppx:(n._ppx=Object.assign(pResolve(String(n.id||n.kind||'p')+'~',Object.assign({},o),false,null),{src:o})); pDraw(n,P,0,0,0,0,0,0,0); }
function drawNPC(n){
  if(n.kind==='goat') return drawGoat(n);
  if(n.turtle) return drawTurtle(n);
  const P=pProfile(n);
  const now=performance.now(); if(now-PBUD_T>8) PBT=now+2.5; PBUD_T=now;
  // movement: walking when flagged or when the position changed since the last frame
  const sp=n._px==null?0:Math.hypot(n.x-n._px,n.y-n._py); n._px=n.x; n._py=n.y;
  const mv=!!n.moving||(sp>0.12&&sp<30);
  if(mv) n._wph=(n._wph||0)+Math.max(Math.min(sp,4),0.55)*(P.old?0.34:0.42);
  n._wk=(n._wk||0)+((mv?1:0)-(n._wk||0))*0.2;
  // head: looks toward Ash when near, otherwise glances around now and then
  let ht=0;
  if(!PLINE){
    const pl=typeof player!=='undefined'?player:null, d=pl&&!pl.dead?dist(n.x,n.y,pl.x,pl.y):1e9;
    if(d<170) ht=clamp(angDiff(n.face,angTo(n.x,n.y,pl.x,pl.y)),-0.85,0.85);
    else if(!reduceMotion){ const u=((n.t||0)*0.09*P.fidget+P.seed)%1; ht=u<0.08?0.55:(u>0.42&&u<0.5)?-0.5:(u>0.7&&u<0.74)?0.25:0; if(P.fidget>1&&u>0.2&&u<0.26) ht=-0.8; if(P.fidget>1&&u>0.86&&u<0.9) ht=0.8; }
    n._ht=(n._ht||0)+(ht-(n._ht||0))*0.12;
  }else n._ht=n._ht||0;
  const breath=PLINE||reduceMotion?0:Math.sin((n.t||0)*2.3+P.seed*7)*0.014;
  if(PREC){ ctx.save(); ctx.translate(n.x,n.y); const m=ctx.getTransform(); n._sx=m.e/DPR; n._sy=m.f/DPR; ctx.restore(); }
  if(P.twin){ const ox=-Math.sin(n.face)*7.6, oy=Math.cos(n.face)*7.6; pDraw(n,P.ta,n.face,n._ht,n._wk,n._wph||0,breath,n.x-ox,n.y-oy); pDraw(n,P.tb,n.face,-n._ht*0.6,n._wk,(n._wph||0)+1.4,-breath,n.x+ox,n.y+oy); }
  else pDraw(n,P,n.face,n._ht,n._wk,n._wph||0,breath,n.x,n.y);
}
function drawGoat(n){
  ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(n.face);
  const L=lightLocal(n.face), g=n.t*12, mv=n.moving, t=n.t||0;
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.drawImage(pShadow(),-14,-9,28,18);
  for(const [lx,ly,ph] of [[7,-4.2,0],[7,4.2,Math.PI],[-6.5,-4.2,Math.PI],[-6.5,4.2,0]]){ const o=mv?Math.sin(g+ph)*3.2:0; ell(lx+o,ly,2.4,1.6,'#2a2420'); ell(lx+o+0.3,ly,1.5,1.0,'#4a4038'); }
  // perky little tail
  ctx.save(); ctx.translate(-11.2,0); ctx.rotate(Math.sin(t*(mv?14:5))*0.45); ell(-1.6,0,2.4,1.3,'rgba(40,30,20,.6)'); ell(-1.5,0,2.0,1.0,'#f4efe4'); ctx.restore();
  ctx.fillStyle='rgba(40,30,20,.6)'; ctx.beginPath(); ctx.ellipse(0,0,12.2,7.6,0,0,TAU); ctx.fill();
  ctx.fillStyle=rg(0,0,11.5,L,'#ffffff','#e8e2d4','#a49a88'); ctx.beginPath(); ctx.ellipse(0,0,11.5,7,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(150,140,120,.35)'; ctx.lineWidth=0.6; for(const [x,y,a] of [[-5,-3,0.4],[-2,3,-0.3],[2,-3.6,0.2],[-7,1.4,-0.5],[4,2.6,0.3]]){ ctx.beginPath(); ctx.arc(x,y,2.2,a,a+2.2); ctx.stroke(); }
  // collar with a bell
  ctx.strokeStyle='#c83a5a'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.ellipse(8.2,0,1.4,4.6,0,0,TAU); ctx.stroke();
  ell(9.6,3.6,1.4,1.4,'#f2c84a'); ell(9.9,3.9,0.4,0.4,'#8a6a1a');
  // head, tossed haughtily away from whoever is looking
  const pl=typeof player!=='undefined'?player:null; let snub=0;
  if(pl&&dist(n.x,n.y,pl.x,pl.y)<120&&!mv){ const a=angDiff(n.face,angTo(n.x,n.y,pl.x,pl.y)); snub=-Math.sign(a||1)*0.45; }
  n._hd=(n._hd||0)+((snub+Math.sin(t*0.8)*0.18)-(n._hd||0))*0.08;
  ctx.save(); ctx.translate(11.4,0); ctx.rotate(n._hd);
  for(const s of [-1,1]){ ctx.save(); ctx.translate(0.6,s*3.8); ctx.rotate(s*(0.5+Math.sin(t*1.7+s)*0.1)); ell(0,0,1.4,3.2,'#d8d0c0'); ell(0,0.2*s,0.7,2.2,'#eab8b0'); ctx.restore(); }
  ctx.fillStyle='rgba(40,30,20,.6)'; ctx.beginPath(); ctx.ellipse(1.5,0,6.0,4.4,0,0,TAU); ctx.fill();
  ctx.fillStyle=rg(1.5,0,5.4,L,'#ffffff','#e8e2d4','#a49a88'); ctx.beginPath(); ctx.ellipse(1.5,0,5.4,3.8,0,0,TAU); ctx.fill();
  ell(5.6,0,2.4,2.7,'#efe2da'); ell(6.9,-0.8,0.45,0.35,'#7a5a5a'); ell(6.9,0.8,0.45,0.35,'#7a5a5a');
  ell(8.2,0,1.5,1.1,'#f2ece0');
  ctx.strokeStyle='rgba(50,40,30,.7)'; ctx.lineWidth=2.4; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(0.6,s*1.6); ctx.quadraticCurveTo(-3.4,s*3.6,-5.4,s*1.8); ctx.stroke(); }
  ctx.strokeStyle='#a8946a'; ctx.lineWidth=1.6; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(0.6,s*1.6); ctx.quadraticCurveTo(-3.4,s*3.6,-5.4,s*1.8); ctx.stroke(); }
  // unimpressed half-closed eyes
  for(const s of [-1,1]){ ell(3.0,s*3.2,1.1,0.8,'#d8a43a'); ctx.fillStyle='#1a120a'; ctx.fillRect(2.4,s*3.2-0.25,1.2,0.5); ctx.strokeStyle='#8a7a6a'; ctx.lineWidth=0.6; ctx.beginPath(); ctx.moveTo(1.8,s*3.2-s*0.1); ctx.lineTo(4.2,s*3.2-s*0.1); ctx.stroke(); }
  // a duchess has a tiara
  ctx.fillStyle='#f2c84a'; ctx.beginPath(); ctx.moveTo(-1.6,-2.2); ctx.lineTo(-0.6,-1.4); ctx.lineTo(-0.2,-2.6); ctx.lineTo(0.4,-0.8); ctx.lineTo(0.8,0); ctx.lineTo(0.4,0.8); ctx.lineTo(-0.2,2.6); ctx.lineTo(-0.6,1.4); ctx.lineTo(-1.6,2.2); ctx.lineTo(-1.0,0); ctx.closePath(); ctx.fill();
  ell(0.5,0,0.55,0.55,'#ff6a9a');
  ctx.restore();
  ctx.restore();
}
function drawPip(q){
  const t=q.t||0, alt=8+Math.sin(t*5)*3;
  ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(q.x+4,q.y+alt,7,4,0,0,TAU); ctx.fill();
  ctx.save(); ctx.translate(q.x,q.y-alt*0.4); ctx.rotate(q.face); ctx.scale(0.66,0.66);
  const L=lightLocal(q.face), fl=Math.sin(t*22)*0.5+0.5;
  ctx.lineCap='round'; ctx.lineJoin='round';
  // tail with a little ember at the tip
  const tw=Math.sin(t*6)*4, tw2=Math.sin(t*6+1)*5;
  ctx.strokeStyle='rgba(60,20,8,.8)'; ctx.lineWidth=4.6; ctx.beginPath(); ctx.moveTo(-6,0); ctx.quadraticCurveTo(-13,tw,-19,tw2); ctx.stroke();
  ctx.strokeStyle='#d8682e'; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle='#ffb040'; ctx.beginPath(); ctx.moveTo(-18,tw2); ctx.lineTo(-23,tw2-3); ctx.lineTo(-21.5,tw2); ctx.lineTo(-23,tw2+3); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35+0.15*Math.sin(t*9); ctx.drawImage(pGlow(),-27,tw2-5,10,10); ctx.restore();
  // wings
  for(const s of [-1,1]){ const sp=8+fl*10;
    ctx.fillStyle='rgba(120,40,14,.9)'; ctx.beginPath(); ctx.moveTo(3,s*3); ctx.lineTo(-2,s*(5+sp)); ctx.lineTo(-6,s*(3+sp*0.8)); ctx.lineTo(-9,s*(3+sp*0.55)); ctx.lineTo(-7,s*3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,170,100,.85)'; ctx.beginPath(); ctx.moveTo(2,s*3.6); ctx.lineTo(-2,s*(4.4+sp*0.92)); ctx.lineTo(-5.4,s*(3.4+sp*0.72)); ctx.lineTo(-8,s*(3.4+sp*0.5)); ctx.lineTo(-6.4,s*3.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#8a3414'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(2.4,s*3.2); ctx.lineTo(-2,s*(5+sp)); ctx.moveTo(0,s*3.6); ctx.lineTo(-6,s*(3+sp*0.8)); ctx.stroke(); }
  // feet
  for(const s of [-1,1]){ ell(4.5,s*5,1.6,1.2,'#c85a28'); ell(-4,s*5,1.8,1.3,'#c85a28'); }
  // body with a row of soft spines
  ctx.fillStyle='rgba(70,24,8,.75)'; ctx.beginPath(); ctx.ellipse(-0.5,0,8.8,7.0,0,0,TAU); ctx.fill();
  ctx.fillStyle=rg(-0.5,0,8,L,'#ffc488','#f0864a','#a8441a'); ctx.beginPath(); ctx.ellipse(-0.5,0,8,6.2,0,0,TAU); ctx.fill();
  ctx.fillStyle='#ffd27a'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-5+i*3.2,0); ctx.lineTo(-6.6+i*3.2,-1.1); ctx.lineTo(-6.6+i*3.2,1.1); ctx.closePath(); ctx.fill(); }
  // a big round head
  ctx.fillStyle='rgba(70,24,8,.75)'; ctx.beginPath(); ctx.arc(8,0,7.1,0,TAU); ctx.fill();
  ctx.fillStyle=rg(8,0,6.4,L,'#ffd09a','#f69456','#b04c1e'); ctx.beginPath(); ctx.arc(8,0,6.4,0,TAU); ctx.fill();
  for(const s of [-1,1]){ ctx.fillStyle='#fff0d0'; ctx.beginPath(); ctx.moveTo(4.6,s*3.2); ctx.lineTo(1.6,s*4.4); ctx.lineTo(4.0,s*4.6); ctx.closePath(); ctx.fill(); ctx.fillStyle='#f0864a'; ctx.beginPath(); ctx.moveTo(6.2,s*5.2); ctx.lineTo(3.4,s*8.0); ctx.lineTo(4.4,s*5.0); ctx.closePath(); ctx.fill(); }
  ell(13.4,0,2.4,3.2,'#ffc890'); ell(14.6,-1.1,0.45,0.35,'#8a3010'); ell(14.6,1.1,0.45,0.35,'#8a3010');
  for(const s of [-1,1]) ell(10.4,s*5.0,1.3,0.8,'rgba(255,110,110,.5)');
  // huge shiny eyes that blink now and then
  const bl=(t%4.2)<0.12?0.25:1;
  for(const s of [-1,1]){ ctx.fillStyle='#2a1208'; ctx.beginPath(); ctx.ellipse(10,s*2.8,2.9,2.9*bl,0,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(10,s*2.8,2.5,2.5*bl,0,0,TAU); ctx.fill();
    if(bl>0.5){ ctx.fillStyle='#1a0a04'; ctx.beginPath(); ctx.arc(10.6,s*2.6,1.75,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(10.0,s*2.0,0.8,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11.3,s*3.2,0.35,0,TAU); ctx.fill(); } }
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
function drawMarkers(t){
  if(G.mode!=='story') return;
  const list=AREA?AREA.npcs:G.npcs;
  for(const n of list){ if(!inView(n.x,n.y,40)) continue; const m=npcMarker(n.id); if(m) drawMarker(n.x,n.y-30,m,t); }
  if(!AREA){
    for(const d of DOORS){ if(!inView(d.x,d.y,60)) continue; const def=AREADEFS[d.area]; const c=CAST.find(q=>q.inside===d.area); if(c){ const m=npcMarker(c.id); if(m){ drawMarker(d.x,d.y-34,m,t); continue; } } if(d.cave){ const qs=questTargets().some(q=>q.x===CAVEMOUTHS.find(m=>m.area===d.area).x); if(qs) drawMarker(d.x,d.y-70,'?',t); } }
    if(G.goat&&G.side.duchess==='lost'&&inView(G.goat.x,G.goat.y,40)&&G.quests.duchess) drawMarker(G.goat.x,G.goat.y-26,'?',t);
  }
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
// ---------- debug: a lineup of everyone, facing down, on alternating floors (returns a PNG data URL)
function pLineup(z,only){
  z=z||2;
  const list=only?only.map(id=>CASTBY[id]||SPECIAL[id]).filter(Boolean):CAST.concat(Object.values(SPECIAL));
  const cols=14, cw=50, ch=60, rows=Math.ceil(list.length/cols)+1;
  const Wc=Math.ceil(cols*cw*z), Hc=Math.ceil(rows*ch*z), ow=cvs.width, oh=cvs.height;
  cvs.width=Wc; cvs.height=Hc; PCS_FORCE=Math.max(2,Math.min(4,Math.ceil(z))); PLINE=true;
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  const bgs=['#55703a','#6e4c2e','#7c7a74','#e2e6ec','#8a7050','#3e4a36'];
  for(let r=0;r<rows;r++){ ctx.fillStyle=bgs[r%bgs.length]; ctx.fillRect(0,r*ch*z,Wc,ch*z); }
  ctx.setTransform(z,0,0,z,0,0);
  const label=(s,x,y)=>{ ctx.font=`600 5.5px ${UIF}`; ctx.textAlign='center'; ctx.lineJoin='round'; ctx.lineWidth=1.8; ctx.strokeStyle='rgba(0,0,0,.8)'; ctx.strokeText(s,x,y); ctx.fillStyle='#fff'; ctx.fillText(s,x,y); };
  list.forEach((c,i)=>{ const x=(i%cols+0.5)*cw, y=Math.floor(i/cols)*ch+26; const n=mkNPC(c,x,y); n.face=Math.PI/2; n.t=1.2+i*0.37; drawNPC(n); label(c.name.replace(/,.*$/,'').slice(0,18),x,y+29); });
  // last row: walking, turning, and the animals
  const y=(rows-1)*ch+26, demo=[['bertram',0,0.9],['elka',Math.PI*0.25,2.1],['tamsin',Math.PI,0.6],['pell',-Math.PI/2,1.8],['osric',Math.PI*0.75,0.4],['n2',0.3,2.6],['n5',2.4,1.2],['yara',Math.PI*1.25,0]];
  demo.forEach(([id,f,ph],i)=>{ const c=CASTBY[id]||SPECIAL[id]; if(!c) return; const n=mkNPC(c,(i+0.5)*cw,y); n.face=f; n.t=3+i; if(ph){ n.moving=true; n._wk=1; n._wph=ph; } drawNPC(n); label((ph?'walk ':'')+c.name.replace(/,.*$/,'').split(' ')[0],n.x,y+29); });
  let x=(demo.length+0.5)*cw;
  drawGoat({x,y,face:Math.PI/2,t:2,moving:false}); label('Duchess',x,y+29); x+=cw;
  drawPip({x,y,face:Math.PI/2,t:1.1}); label('Pip',x,y+29); x+=cw;
  drawCritter({type:'deer',x,y,face:Math.PI/2,t:1,antlers:true}); label('deer',x,y+29); x+=cw;
  drawCritter({type:'deer',x,y,face:0.4,t:2,graze:true}); label('doe',x,y+29); x+=cw;
  drawCritter({type:'rabbit',x,y,face:Math.PI/2,t:1}); drawCritter({type:'rabbit',x:x+12,y:y+8,face:0.3,t:2,moving:true}); label('rabbits',x,y+29);
  const url=cvs.toDataURL('image/png');
  PCS_FORCE=0; PLINE=false; cvs.width=ow; cvs.height=oh;
  return url;
}
// debug: one person per row through a walk cycle, then glancing left and right
function pStrip(ids,z){
  z=z||4; const cw=44, ch=44, cols=10, Wc=cols*cw*z, Hc=ids.length*ch*z, ow=cvs.width, oh=cvs.height;
  cvs.width=Wc; cvs.height=Hc; PCS_FORCE=Math.max(2,Math.min(4,Math.ceil(z))); PLINE=true;
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#55703a'; ctx.fillRect(0,0,Wc,Hc); ctx.setTransform(z,0,0,z,0,0);
  ids.forEach((id,r)=>{ const c=CASTBY[id]||SPECIAL[id]; if(!c) return; const P=pProfile({id,look:c.look});
    for(let i=0;i<cols;i++){ const x=(i+0.5)*cw, y=(r+0.5)*ch, n={id,kind:id,look:c.look,x,y,face:0,t:1.5};
      if(i<6) pDraw(n,P,0,0,1,(i+0.5)/6*TAU,0,x,y); else pDraw(n,P,0,[-0.7,-0.3,0.35,0.75][i-6],0,0,0,x,y); } });
  const url=cvs.toDataURL('image/png'); PCS_FORCE=0; PLINE=false; cvs.width=ow; cvs.height=oh; return url;
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{drawNPC,drawPerson,drawGoat,drawPip,drawCritter,render,lineup:pLineup,strip:pStrip,pSprites:()=>[PSPR.size,PBAKES],rec(on){ PREC=!!on; }});
