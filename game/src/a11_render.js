
// ================= render
const UIF='Rubik,system-ui,sans-serif', TF='Cinzel,Georgia,serif';
let vigKey='', vigGrad=null;
const TALL=new Set(['oak','pine','birch','dead','spine','willow']);
let BIGOAKS=null;
function visibleProps(m){
  const out=[], c0=Math.floor((cam.x-m)/CH), c1=Math.floor((cam.x+W/zoom+m)/CH), r0=Math.floor((cam.y-m)/CH), r1=Math.floor((cam.y+H/zoom+m)/CH);
  for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++){ const a=propsFor(cx,cy); for(const p of a) if(inView(p.x,p.y,p.R+40)) out.push(p); }
  return out;
}
function render(){
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#0b0d09'; ctx.fillRect(0,0,cvs.width,cvs.height);
  if(!G||!player) return;
  chunkTick++;
  const ox=(Math.random()*2-1)*shakeMag, oy=(Math.random()*2-1)*shakeMag, Z=DPR*zoom, t=G.time, inA=!!AREA;
  const setWorld=()=>ctx.setTransform(Z,0,0,Z,(-cam.x*zoom+ox)*DPR,(-cam.y*zoom+oy)*DPR);
  setWorld();
  if(inA) drawAreaBase();
  else{
    const c0=Math.floor(cam.x/CH), c1=Math.floor((cam.x+W/zoom)/CH), r0=Math.floor(cam.y/CH), r1=Math.floor((cam.y+H/zoom)/CH);
    let budget=Math.max(1,G.chunkBurst||0); G.chunkBurst=0;
    const vis=[];
    for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++) vis.push([cx,cy,dist2((cx+0.5)*CH,(cy+0.5)*CH,player.x,player.y)]);
    vis.sort((a,b)=>a[2]-b[2]);
    const glows=[];
    for(const [cx,cy] of vis){
      let ch=getChunk(cx,cy,false);
      if(!ch&&budget>0){ ch=getChunk(cx,cy,true); budget--; }
      if(ch){ ctx.drawImage(ch.cv,cx*CH,cy*CH,CH+0.5,CH+0.5); if(ch.glow) glows.push([cx,cy,ch.glow]); }
      else{ ctx.fillStyle=chunkPlaceholder(cx,cy); ctx.fillRect(cx*CH,cy*CH,CH+0.5,CH+0.5); }
    }
    if(budget>0&&scene!=='menu'){ const ax=player.x+Math.cos(player.facing)*700, ay=player.y+Math.sin(player.facing)*700; getChunk(Math.floor(ax/CH),Math.floor(ay/CH),true); }
    if(glows.length){ ctx.save(); ctx.globalCompositeOperation='lighter'; for(const [cx,cy,gl] of glows){ ctx.globalAlpha=0.3+0.18*Math.sin(t*1.7+cx*1.3+cy); ctx.drawImage(gl,cx*CH,cy*CH,CH,CH); } ctx.restore(); }
  }
  ctx.lineWidth=1;
  for(const r of G.ripples){ const k=r.t/r.max; if(r.glint){ ctx.fillStyle=`rgba(255,255,240,${0.5*(1-k)})`; ctx.fillRect(r.x-r.r*0.4,r.y,r.r*0.8,1.2); } else { ctx.strokeStyle=`rgba(220,230,240,${(r.splash?0.45:0.35)*(1-k)})`; ctx.beginPath(); ctx.ellipse(r.x,r.y,r.r*(0.3+k),r.r*(0.3+k)*0.6,0,0,TAU); ctx.stroke(); } }
  drawPools(); drawHazards();
  const sun=inA?{dx:4,dy:6,a:0.28}:sunInfo(), props=inA?[]:visibleProps(60);
  const npcs=inA?AREA.npcs:G.npcs;
  ctx.save();
  if(!inA){
    for(const p of props){ if(p.taken) continue; const tall=TALL.has(p.k), k=tall?1.6:0.5, R=tall?p.R*1.05:p.R*0.9; ctx.globalAlpha=sun.a*(tall?1:0.8); ctx.drawImage(SPR.shadow,p.x+sun.dx*k-R,p.y+sun.dy*k-R*0.85,R*2,R*1.7); }
    for(const h of HOUSES) if(inView(h.x,h.y,200)){ ctx.globalAlpha=sun.a*0.9; ctx.fillStyle='#000'; ctx.fillRect(h.x-h.w/2+sun.dx*1.2,h.y-h.h/2+sun.dy*1.2,h.w+4,h.h+4); }
  }
  ctx.globalAlpha=sun.a*0.9;
  const ent=[player,...G.enemies.filter(e=>!e.dead&&!e.frozen&&e.type!=='vorlaxis'&&e.alpha>0.2),...npcs.filter(n=>inView(n.x,n.y,60)),...G.critters];
  if(G.goat&&(inA?G.side.duchess==='follow':true)) ent.push(G.goat);
  for(const e of ent){ if(e.dead) continue; const r=e.r||10, fly=e.flying?2.2:0.5; ctx.drawImage(SPR.shadow,e.x+sun.dx*fly-r*1.3,e.y+sun.dy*fly-r*0.9,r*2.6,r*1.8); }
  ctx.restore();
  if(inA){ for(const o of AREA.objs) if(inView(o.x,o.y,(o.w||40)+30)) drawFurn(o,t); }
  else{
    for(const p of props){ if(TALL.has(p.k)||p.taken) continue; const sp=propSprite(p); drawSprite(sp,p.x,p.y,p.s,p.k==='herb'?0:p.rot*0.3); if(p.k==='vent'&&Math.random()<0.15) emit(p.x,p.y,1,{col:'70,62,60',glow:false,ang:-Math.PI/2,spread:0.5,smin:15,smax:40,lmin:1.2,lmax:2,zmin:4,zmax:8,grow:10,drag:0.5}); if(p.k==='herb'){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.25+0.15*Math.sin(t*3+p.ph); ctx.drawImage(SPR.shadow,p.x-10,p.y-10,20,20); ctx.restore(); } }
    for(const s of STRUCTS){ if(s.k==='wall') continue; if(!inView(s.x,s.y,(s.w||s.r||60)+40)) continue; if(s.k==='cavemouth') drawCaveMouth(s,t); else if(s.k==='column') drawColumn(s); else if(s.k==='glowshroom') drawGlowShroom(s,t); else drawStruct(s,t); }
    for(const d of DOORS) if(d.hs&&inView(d.x,d.y,40)) drawDoor(d);
    for(const o of LANDMARKS) if(inView(o.x,o.y,160)) drawLandmark(o,t);
    drawWall();
    for(const c of CHESTS) if(inView(c.x,c.y,40)) drawChest(c,t);
    for(const l of LILIES) if(inView(l.x,l.y,40)) drawLily(l,t);
  }
  for(const e of G.enemies) if(!e.dead&&!e.frozen) drawTele(e);
  drawPickups();
  if(G.corpse&&G.corpse.type==='vorlaxis') drawVorlaxis(G.corpse);
  for(const e of G.enemies) if(!e.dead&&e.type==='vorlaxis') drawVorlaxis(e);
  const list=G.enemies.filter(e=>!e.dead&&!e.frozen&&!e.flying&&e.type!=='vorlaxis'&&inView(e.x,e.y,60));
  for(const n of npcs) if(inView(n.x,n.y,40)) list.push(n);
  for(const c of G.critters) if(inView(c.x,c.y,40)) list.push(c);
  if(G.goat&&inView(G.goat.x,G.goat.y,40)&&(!inA||G.side.duchess==='follow')){ G.goat.kind='goat'; list.push(G.goat); }
  if(G.allies) for(const a of G.allies) if(inView(a.x,a.y,60)) list.push(a);
  if(!player.dead) list.push(player);
  list.sort((a,b)=>a.y-b.y);
  for(const e of list){ if(e===player) drawPlayer(); else if(e.k==='grey') drawWolf(e,false,1.9,true,true); else if(e.k==='cinder') drawKnight(Object.assign({r:27,state:'chase',blocking:true,swung:0},e),1.3,false,true); else if(e.kind) drawNPC(e); else if(e.type==='deer'||e.type==='rabbit') drawCritter(e); else drawEnemy(e); }
  if(G.fishing){ const F=G.fishing, bob=Math.sin(t*4)*1.5+(F.bite>0?3:0); ctx.strokeStyle='rgba(240,240,240,.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(player.x+Math.cos(player.facing)*24,player.y+Math.sin(player.facing)*24); ctx.quadraticCurveTo((player.x+F.wx)/2,(player.y+F.wy)/2-20,F.wx,F.wy+bob); ctx.stroke(); ctx.fillStyle='#c8322a'; ctx.beginPath(); ctx.arc(F.wx,F.wy+bob,4,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(F.wx,F.wy+bob-2,2,0,TAU); ctx.fill(); if(F.bite>0) drawMarker(F.wx,F.wy-26,'!',t); }
  if(G.corpse&&G.corpse.type!=='vorlaxis'&&G.corpse.deathT<0.6){ ctx.save(); ctx.globalAlpha=1-G.corpse.deathT/0.6; const c=G.corpse; c.flash=1; drawEnemy(Object.assign({},c,{dead:false,alpha:1,spawnIn:0,boss:true})); ctx.restore(); }
  if(G.spirit&&!inA) drawSpirit(G.spirit);
  if(!inA){
    const bossE=G.boss&&!G.boss.dead?G.boss:null;
    if(!BIGOAKS) BIGOAKS=STRUCTS.filter(s=>s.k==='bigoak');
    for(const b of BIGOAKS){ if(!inView(b.x,b.y,b.R*1.4)) continue; const dp=dist(b.x,b.y,player.x,player.y); ctx.globalAlpha=dp<b.R?0.4+0.5*clamp((dp-b.R*0.4)/(b.R*0.6),0,1):1; drawSprite(SPR.bigoak,b.x,b.y,b.R/48,Math.sin(t*0.5)*0.015); }
    ctx.globalAlpha=1;
    for(const p of props){
      if(!TALL.has(p.k)) continue;
      let a=1; const dp=dist(p.x,p.y,player.x,player.y); if(dp<p.R*0.95) a=0.35+0.5*clamp((dp-p.R*0.45)/(p.R*0.5),0,1);
      if(bossE&&dist(p.x,p.y,bossE.x,bossE.y)<p.R) a=Math.min(a,0.4);
      for(const e of G.enemies) if(e.aggro&&!e.dead&&!e.frozen&&dist2(p.x,p.y,e.x,e.y)<p.R*p.R*0.5){ a=Math.min(a,0.55); break; }
      ctx.globalAlpha=a; drawSprite(propSprite(p),p.x,p.y,p.s,Math.sin(t*0.8+p.ph)*0.025*(1+G.rainK*1.5)+p.rot);
    }
    ctx.globalAlpha=1;
  }
  for(const e of G.enemies) if(!e.dead&&!e.frozen&&e.flying&&inView(e.x,e.y,80)) drawEnemy(e);
  if(G.pip) drawPip(G.pip);
  drawMarkers(t);
  if(!inA) drawBirds();
  drawProjectiles(); drawParticles(); drawRings();
  ctx.setTransform(1,0,0,1,0,0);
  if(!inA){ const tint=ambientTint(); if(tint[0]<253||tint[1]<253||tint[2]<253){ ctx.globalCompositeOperation='multiply'; ctx.fillStyle=`rgb(${tint.map(Math.round)})`; ctx.fillRect(0,0,cvs.width,cvs.height); ctx.globalCompositeOperation='source-over'; } }
  drawLights();
  setWorld(); drawTexts();
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(!inA){ drawRain(); drawSnowMist(); }
  drawVignette();
  if(G.fade>0){ ctx.fillStyle=`rgba(0,0,0,${clamp(G.fade,0,1)})`; ctx.fillRect(0,0,W,H); }
  if(scene!=='menu') drawHUD();
}
function drawLights(){
  const dl=daylight(), inA=!!AREA, rk=inA?0:G.rainK*(player.y>WALL_Y?1:0), cinder=!inA&&player.y<2700;
  let dk=(1-dl)*0.46+rk*0.06; if(G.region&&G.region.key==='nests') dk+=0.12; if(G.region&&(G.region.key==='b6'||G.region.key==='mire'||G.region.key==='mosshut')) dk+=0.08;
  if(cinder) dk=Math.max(0,dk-0.12);
  if(inA) dk=AREA.kind==='cave'?AREA.dark:AREA.dark+(1-dl)*0.3;
  const lw=lightCvs.width, lh=lightCvs.height, s=zoom*0.5, t=G.time;
  const lightList=[];
  const src=inA?AREA.lights:LIGHTS;
  for(const L of src){ if(L.night&&dl>0.6) continue; if(L.i<=0.01) continue; if(!inView(L.x,L.y,L.r)) continue; const fl=L.fire?1+0.06*Math.sin(t*9+L.x)+0.04*Math.sin(t*23+L.y):1; if(L.shrine&&!G.shrines[L.shrine.id]) continue; lightList.push([L.x,L.y,L.r*fl,L.i,L.fire]); }
  if(dk>0.02){
    lctx.setTransform(1,0,0,1,0,0); lctx.globalCompositeOperation='source-over'; lctx.clearRect(0,0,lw,lh);
    lctx.fillStyle=`rgba(3,4,10,${dk})`; lctx.fillRect(0,0,lw,lh);
    lctx.globalCompositeOperation='destination-out';
    const Lt=(x,y,r,i)=>{ const sx=(x-cam.x)*s, sy=(y-cam.y)*s, sr=r*s; if(sx<-sr||sy<-sr||sx>lw+sr||sy>lh+sr) return; const g=lctx.createRadialGradient(sx,sy,0,sx,sy,sr); g.addColorStop(0,`rgba(0,0,0,${i})`); g.addColorStop(1,'rgba(0,0,0,0)'); lctx.fillStyle=g; lctx.fillRect(sx-sr,sy-sr,sr*2,sr*2); };
    const pr0=inA&&AREA.kind==='cave'?(AREA.plr||(G.items.lantern?470:330)):300;
    if(!player.dead) Lt(player.x,player.y,player.breathing?pr0+80:pr0,0.95);
    if(G.pip) Lt(G.pip.x,G.pip.y,90,0.5);
    for(const l of lightList) Lt(l[0],l[1],l[2],l[3]);
    for(const pr of G.projectiles) Lt(pr.x,pr.y,80,0.7);
    for(const pl of G.pools) Lt(pl.x,pl.y,pl.r*2.4,0.6);
    for(const e of G.enemies){ if(e.dead||e.frozen) continue; if(e.type==='vorlaxis'){ if(e.alpha>0.2){ Lt(e.x,e.y,260,0.5); if(e.mouthGlow>0) Lt(e.mouthX,e.mouthY,320,0.9); } } else if(e.burnT>0) Lt(e.x,e.y,70,0.5); else if(e.state==='cast'||e.state==='breath') Lt(e.x,e.y,90,0.5); }
    for(const h of G.hazards) if(h.kind==='blast'||h.big) Lt(h.x,h.y,(h.r||60)*1.5,0.4);
    if(!inA&&player.y<3300){ lctx.globalAlpha=0.85; for(let cx=Math.floor(cam.x/CH);cx<=Math.floor((cam.x+W/zoom)/CH);cx++) for(let cy=Math.floor(cam.y/CH);cy<=Math.floor((cam.y+H/zoom)/CH);cy++){ const ch=CHUNKS.get(ckey(cx,cy)); if(ch&&ch.glow) lctx.drawImage(ch.glow,(cx*CH-cam.x)*s-20*s,(cy*CH-cam.y)*s-20*s,(CH+40)*s,(CH+40)*s); } lctx.globalAlpha=1; }
    lctx.globalCompositeOperation='source-over';
    ctx.drawImage(lightCvs,0,0,cvs.width,cvs.height);
  }
  if((dl<0.8||inA)&&lightList.length){
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.setTransform(DPR*zoom,0,0,DPR*zoom,-cam.x*zoom*DPR,-cam.y*zoom*DPR);
    const k=inA?0.6:(1-dl);
    for(const l of lightList){ if(!l[4]) continue; const g=ctx.createRadialGradient(l[0],l[1],0,l[0],l[1],l[2]*0.8); g.addColorStop(0,`rgba(255,150,60,${0.22*k})`); g.addColorStop(1,'rgba(255,110,30,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(l[0],l[1],l[2]*0.8,0,TAU); ctx.fill(); }
    ctx.restore();
  }
}
function drawRain(){
  const rk=G.rainK*(player.y>WALL_Y?1:0); if(rk<0.03) return;
  const n=Math.floor(240*rk); ctx.strokeStyle=`rgba(200,212,230,${0.18+0.2*rk})`; ctx.lineWidth=1; ctx.beginPath();
  for(let i=0;i<n;i++){ const x=Math.random()*(W+60)-30, y=Math.random()*H; ctx.moveTo(x,y); ctx.lineTo(x-5,y+16); }
  ctx.stroke();
}
const FLAKES=[]; for(let i=0;i<160;i++) FLAKES.push({x:Math.random(),y:Math.random(),s:0.6+Math.random()*1.8,v:0.4+Math.random()*0.8,ph:Math.random()*TAU});
let snowK=0, mistK=0;
function drawSnowMist(){
  const b=G.region?G.region.key:'', snowy=b==='b5'||b==='frost'||b==='farm', misty=b==='b6'||b==='mire'||b==='mosshut';
  snowK+=((snowy?1:0)-snowK)*0.02; mistK+=((misty?1:0)-mistK)*0.02;
  if(snowK>0.02){
    ctx.fillStyle=`rgba(245,248,252,${0.75*snowK})`; const t=G.time;
    for(const f of FLAKES){ const x=((f.x*W+Math.sin(t*f.v+f.ph)*30-cam.x*zoom*0.15)%W+W)%W, y=((f.y*H+t*40*f.v-cam.y*zoom*0.15)%H+H)%H; ctx.fillRect(x,y,f.s*1.4,f.s*1.4); }
  }
  if(mistK>0.02){
    const t=G.time; ctx.save(); ctx.globalAlpha=mistK*0.5;
    for(let i=0;i<5;i++){ const x=((i*W*0.31+t*12*(1+i*0.2)-cam.x*zoom*0.3)%(W+600)+W+600)%(W+600)-300, y=H*(0.15+i*0.18)+Math.sin(t*0.3+i)*20; const g=ctx.createRadialGradient(x,y,0,x,y,260); g.addColorStop(0,'rgba(200,215,200,.35)'); g.addColorStop(1,'rgba(200,215,200,0)'); ctx.fillStyle=g; ctx.fillRect(x-260,y-260,520,520); }
    ctx.restore();
  }
}
function drawVignette(){
  const key=W+'x'+H;
  if(vigKey!==key){ vigKey=key; const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.42)'); vigGrad=g; }
  ctx.fillStyle=vigGrad; ctx.fillRect(0,0,W,H);
  if(G.mode!=='menu'&&player&&!player.dead){
    let a=0; if(player.hp/player.maxHp<0.3) a=0.2+0.1*Math.sin(G.time*6);
    a=Math.max(a,(G.hurtVig||0)*0.55);
    if(a>0){ const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.7); g.addColorStop(0,'rgba(170,15,8,0)'); g.addColorStop(1,`rgba(170,15,8,${a})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  }
  if(flashA>0){ ctx.fillStyle=`rgba(${flashCol},${flashA})`; ctx.fillRect(0,0,W,H); }
}
function bar(x,y,w,h,f,col,bg){
  if(bg){ ctx.fillStyle=bg; rr(x,y,w,h,h/2); ctx.fill(); }
  if(f>0){ ctx.fillStyle=col; rr(x,y,Math.max(h,w*clamp(f,0,1)),h,h/2); ctx.fill(); }
}
function wrapText(text,maxW){ const words=text.split(' '), lines=[]; let cur=''; for(const w of words){ const tt=cur?cur+' '+w:w; if(ctx.measureText(tt).width>maxW&&cur){ lines.push(cur); cur=w; } else cur=tt; } if(cur) lines.push(cur); return lines; }
function drawIconBtn(r,kind){
  ctx.fillStyle='rgba(12,10,8,.6)'; rr(r.x,r.y,r.w,r.h,9); ctx.fill(); ctx.strokeStyle='rgba(255,220,180,.22)'; ctx.lineWidth=1; ctx.stroke();
  const cx=r.x+r.w/2, cy=r.y+r.h/2; ctx.fillStyle='#f2e8d8'; ctx.strokeStyle='#f2e8d8';
  if(kind==='pause'){ ctx.fillRect(cx-6,cy-8,4,16); ctx.fillRect(cx+2,cy-8,4,16); }
  else{ ctx.beginPath(); ctx.moveTo(cx-9,cy-4); ctx.lineTo(cx-5,cy-4); ctx.lineTo(cx,cy-9); ctx.lineTo(cx,cy+9); ctx.lineTo(cx-5,cy+4); ctx.lineTo(cx-9,cy+4); ctx.closePath(); ctx.fill(); ctx.lineWidth=2;
    if(kind==='muted'){ ctx.beginPath(); ctx.moveTo(cx+3,cy-5); ctx.lineTo(cx+10,cy+5); ctx.moveTo(cx+10,cy-5); ctx.lineTo(cx+3,cy+5); ctx.stroke(); }
    else{ ctx.beginPath(); ctx.arc(cx+1,cy,5,-0.9,0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(cx+1,cy,9,-0.9,0.9); ctx.stroke(); } }
}
function flask(x,y,full){ ctx.fillStyle=full?'#5ad88a':'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(x,y+2,4.5,0,TAU); ctx.fill(); ctx.fillRect(x-1.6,y-5,3.2,4); ctx.strokeStyle='rgba(230,240,235,.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y+2,4.5,0,TAU); ctx.stroke(); }
