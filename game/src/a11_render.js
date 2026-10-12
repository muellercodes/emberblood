
// ================= render
const UIF='Rubik,system-ui,sans-serif', TF='Cinzel,Georgia,serif';
let vigKey='', vigGrad=null, vigCv=null;
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
  const wtx=(-cam.x*zoom+ox)*DPR, wty=(-cam.y*zoom+oy)*DPR, D3=depthFrame(Z,wtx,wty);
  const setWorld=()=>ctx.setTransform(Z,0,0,Z,wtx,wty);
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
  for(const r of G.ripples){ const k=r.t/r.max; if(r.glint){ ctx.fillStyle=`rgba(255,255,240,${0.5*(1-k)})`; ctx.fillRect(r.x-r.r*0.4,r.y,r.r*0.8,1.2); if(D3.full) glowAt(r.x,r.y,r.r*0.9,'255,248,225',0.4*Math.sin(Math.PI*k)); } else { ctx.strokeStyle=`rgba(220,230,240,${(r.splash?0.45:0.35)*(1-k)})`; ctx.beginPath(); ctx.ellipse(r.x,r.y,r.r*(0.3+k),r.r*(0.3+k)*0.6,0,0,TAU); ctx.stroke(); } }
  drawPools(); drawHazards();
  const sun=inA?{dx:4,dy:6,a:0.28}:D3.on?depthSun():sunInfo(), props=inA?[]:visibleProps(60);
  const npcs=inA?AREA.npcs:G.npcs;
  ctx.save();
  if(!inA&&D3.on){ if(!DSKIP.shadow) shadowLayer(sun,props); }
  else if(!inA){
    for(const p of props){ if(p.taken) continue; const tall=TALL.has(p.k), k=tall?1.6:0.5, R=tall?p.R*1.05:p.R*0.9; ctx.globalAlpha=sun.a*(tall?1:0.8); ctx.drawImage(SPR.shadow,p.x+sun.dx*k-R,p.y+sun.dy*k-R*0.85,R*2,R*1.7); }
    for(const h of mapList(HOUSES,curMap())) if(inView(h.x,h.y,200)){ const sw=Math.min(36,Math.abs(sun.dx)*2.4+8), side=sun.dx>=0?1:-1; ctx.fillStyle='#000'; ctx.globalAlpha=sun.a*0.7; ctx.beginPath(); if(side>0){ ctx.moveTo(h.x+h.w/2,h.y-h.h/2+8); ctx.lineTo(h.x+h.w/2+sw,h.y-h.h/2+8+sw*0.6); ctx.lineTo(h.x+h.w/2+sw,h.y+h.h/2+4); ctx.lineTo(h.x+h.w/2,h.y+h.h/2); } else { ctx.moveTo(h.x-h.w/2,h.y-h.h/2+8); ctx.lineTo(h.x-h.w/2-sw,h.y-h.h/2+8+sw*0.6); ctx.lineTo(h.x-h.w/2-sw,h.y+h.h/2+4); ctx.lineTo(h.x-h.w/2,h.y+h.h/2); } ctx.closePath(); ctx.fill(); ctx.globalAlpha=sun.a*0.45; ctx.fillRect(h.x-h.w/2-2,h.y+h.h/2-2,h.w+4,7); }
  }
  ctx.globalAlpha=sun.a*0.9;
  const ent=[player,...G.enemies.filter(e=>!e.dead&&!e.frozen&&e.type!=='vorlaxis'&&e.alpha>0.2),...npcs.filter(n=>inView(n.x,n.y,60)),...G.critters];
  if(G.goat&&(inA?G.side.duchess==='follow':true)) ent.push(G.goat);
  for(const e of ent){ if(e.dead) continue; const r=e.r||10, fly=e.flying?2.2:0.5; ctx.drawImage(SPR.shadow,e.x+sun.dx*fly-r*1.3,e.y+sun.dy*fly-r*0.9,r*2.6,r*1.8); }
  ctx.restore();
  if(inA){ for(const o of AREA.objs) if(inView(o.x,o.y,(o.w||40)+30)) drawFurn(o,t); }
  else{
    for(const p of props){ if(TALL.has(p.k)||p.taken) continue; const sp=propSprite(p); drawSprite(sp,p.x,p.y,p.s,p.k==='herb'?0:p.rot*0.3); if(p.k==='vent'&&Math.random()<0.15) emit(p.x,p.y,1,{col:'70,62,60',glow:false,ang:-Math.PI/2,spread:0.5,smin:15,smax:40,lmin:1.2,lmax:2,zmin:4,zmax:8,grow:10,drag:0.5}); if(p.k==='herb'){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.25+0.15*Math.sin(t*3+p.ph); ctx.drawImage(SPR.shadow,p.x-10,p.y-10,20,20); ctx.restore(); } }
    const mk=curMap(); for(const s of mapList(STRUCTS,mk)){ if(s.k==='wall') continue; if(!inView(s.x,s.y,(s.w||s.r||60)+40)) continue;
      if(D3.on&&s.k==='stone'){ drawStoneLean(s,t); continue; }
      const lf=D3.on?LEAN_S[s.k]:0; if(lf) leanOn(s.x,leanBase(s),lf);
      if(s.k==='cavemouth') drawCaveMouth(s,t); else if(s.k==='column') drawColumn(s); else if(s.k==='glowshroom') drawGlowShroom(s,t); else drawStruct(s,t);
      if(lf) leanOff(); }
    for(const d of mapList(DOORS,mk)) if(d.hs&&inView(d.x,d.y,40)) drawDoor(d);
    for(const o of mapList(LANDMARKS,mk)) if(inView(o.x,o.y,160)){ const lf=D3.on?LEAN_S[o.k]:0; if(lf) leanOn(o.x,o.y,lf); drawLandmark(o,t); if(lf) leanOff(); }
    if(G.mini) drawMiniWorld(t);
    drawWall();
    for(const c of mapList(CHESTS,mk)) if(inView(c.x,c.y,40)) drawChest(c,t);
    for(const l of mapList(LILIES,mk)) if(inView(l.x,l.y,40)) drawLily(l,t);
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
  if(!player.dead&&!player.flying) list.push(player);
  compsForRender(list); eventsForRender(list);
  if(!inA) addOccluders(list);
  list.sort((a,b)=>a.y-b.y);
  for(const e of list){ if(e.occ){ drawOcc(e,t); continue; } if(D3.on) contactShadow(e); if(e===player) drawPlayer(); else if(e.draw) e.draw(); else if(e.k&&T3.on&&T3A[e.k]) T3A[e.k](e); else if(e.k==='grey') drawWolf(e,false,1.9,true,true); else if(e.k==='cinder') drawKnight(Object.assign({r:27,state:'chase',blocking:true,swung:0},e),1.3,false,true); else if(e.kind) drawNPC(e); else if(e.type==='deer'||e.type==='rabbit') drawCritter(e); else drawEnemy(e); }
  if(G.fishing){ const F=G.fishing, bob=Math.sin(t*4)*1.5+(F.bite>0?3:0); ctx.strokeStyle='rgba(240,240,240,.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(player.x+Math.cos(player.facing)*24,player.y+Math.sin(player.facing)*24); ctx.quadraticCurveTo((player.x+F.wx)/2,(player.y+F.wy)/2-20,F.wx,F.wy+bob); ctx.stroke(); ctx.fillStyle='#c8322a'; ctx.beginPath(); ctx.arc(F.wx,F.wy+bob,4,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(F.wx,F.wy+bob-2,2,0,TAU); ctx.fill(); if(F.bite>0) drawMarker(F.wx,F.wy-26,'!',t); }
  if(G.corpse&&G.corpse.type!=='vorlaxis'&&G.corpse.deathT<0.6){ ctx.save(); ctx.globalAlpha=1-G.corpse.deathT/0.6; const c=G.corpse; c.flash=1; drawEnemy(Object.assign({},c,{dead:false,alpha:1,spawnIn:0,boss:true})); ctx.restore(); }
  if(G.spirit&&!inA) drawSpirit(G.spirit);
  if(!inA){
    const bossE=G.boss&&!G.boss.dead?G.boss:null;
    if(!BIGOAKS) BIGOAKS=STRUCTS.filter(s=>s.k==='bigoak');
    if(D3.on){ for(const b of BIGOAKS) if(inView(b.x,b.y,b.R*1.4)) drawBigOakLean(b,t); drawTallProps(props,t,bossE); }
    else for(const b of BIGOAKS){ if(!inView(b.x,b.y,b.R*1.4)) continue; const dp=dist(b.x,b.y,player.x,player.y); ctx.globalAlpha=dp<b.R?0.4+0.5*clamp((dp-b.R*0.4)/(b.R*0.6),0,1):1; drawSprite(SPR.bigoak,b.x,b.y,b.R/48,Math.sin(t*0.5)*0.015); }
    ctx.globalAlpha=1;
    if(!D3.on) for(const p of props){
      if(!TALL.has(p.k)) continue;
      let a=1; const dp=dist(p.x,p.y,player.x,player.y); if(dp<p.R*0.95) a=0.35+0.5*clamp((dp-p.R*0.45)/(p.R*0.5),0,1);
      if(bossE&&dist(p.x,p.y,bossE.x,bossE.y)<p.R) a=Math.min(a,0.4);
      for(const e of G.enemies) if(e.aggro&&!e.dead&&!e.frozen&&dist2(p.x,p.y,e.x,e.y)<p.R*p.R*0.5){ a=Math.min(a,0.55); break; }
      ctx.globalAlpha=a; drawSprite(propSprite(p),p.x,p.y,p.s,Math.sin(t*0.8+p.ph)*0.025*(1+G.rainK*1.5)+p.rot);
    }
    ctx.globalAlpha=1;
  }
  for(const e of G.enemies) if(!e.dead&&!e.frozen&&e.flying&&inView(e.x,e.y,80)) drawEnemy(e);
  drawAirborneHook();
  if(G.pip) drawPip(G.pip);
  drawMarkers(t);
  if(!inA) drawBirds();
  drawProjectiles(); drawWeaponFx(); drawParticles(); drawRings();
  ctx.setTransform(1,0,0,1,0,0);
  if(!inA){ const tint=depthGrade(ambientTint()); if(tint[0]<253||tint[1]<253||tint[2]<253){ ctx.globalCompositeOperation='multiply'; ctx.fillStyle=`rgb(${tint.map(Math.round)})`; ctx.fillRect(0,0,cvs.width,cvs.height); ctx.globalCompositeOperation='source-over'; } }
  drawLights();
  if(D3.on) depthPost();
  setWorld(); drawTexts();
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(!inA){ drawRain(); drawSnowMist(); }
  drawVignette();
  if(G.fade>0){ ctx.fillStyle=`rgba(0,0,0,${clamp(G.fade,0,1)})`; ctx.fillRect(0,0,W,H); }
  if(scene!=='menu') drawHUD();
}
// ---------- characters behind houses (UX build). The 3D figures are tall, so somebody standing just north of a
// house used to draw over its roof. Houses (and columns) are still drawn where they were, under everything; for
// each one with a figure behind it, an occluder sorts into the entity list at the house's front (south) edge and
// draws the house again, clipped to those figures' boxes, over them. Figures in front of the house draw after it.
// Cheap: only houses with somebody behind them, and only inside those boxes. The lean (a11c_depth.js) is the same.
const OCC_K={house:1,forge:1,library:1,column:1};
let OCCS=null; const OCCL=[];
function occFront(s){ return s.k==='column'?s.y:s.y+s.h/2; }
// the world box the structure is drawn in, widened by its lean
function occBox(s,o){
  if(s.k==='column'){ const k=s.s||1, r=16*k, H=s.broken?30:44*k; o[0]=s.x-r-6; o[2]=s.x+r+10; o[1]=s.y-H-14; o[3]=s.y+10; }
  else{ const c=houseSprite(s); o[0]=s.x-c.ox; o[1]=s.y-c.oy; o[2]=o[0]+c.width/HSC; o[3]=o[1]+c.height/HSC; }
  if(DV.on){ const f=LEAN_S[s.k]||0, by=occFront(s), h=by-o[1], dx=(s.x-DV.cx)*DV.k*f*h, dy=(by-DV.cy)*DV.k*DV.vf*f*h; if(dx<0) o[0]+=dx; else o[2]+=dx; if(dy<0) o[1]+=dy; }
  return o;
}
// a figure's box on screen, in world units: feet a little below e.y, the head up to _t3top (set by the 3D figures)
function figBox(e,o){
  const r=e.r||12, z=e===player?(player.z||0):(e.z||0), w=Math.max(18,r*1.6);
  const top=e._t3top!=null&&e._t3top<e.y&&e._t3top>e.y-400?e._t3top:e.y-(e===player?46:e.kind?44:r*2.4+18)-z;
  o[0]=e.x-w; o[2]=e.x+w; o[1]=top-6; o[3]=e.y+r*0.8+8;
  return o;
}
let OCC_ON=true, OCC_F=0;
function addOccluders(list){
  OCC_F++; if(!OCC_ON) return;
  if(!OCCS) OCCS=STRUCTS.filter(s=>OCC_K[s.k]);
  const n=list.length, fb=[0,0,0,0], hb=[0,0,0,0];
  for(const s of OCCS){
    if(!inView(s.x,s.y,(s.w||60)+140)) continue;
    const front=occFront(s); let o=null, hbOk=false;
    for(let i=0;i<n;i++){
      const e=list[i]; if(e.y>=front||e.y<front-420||e.x==null) continue;
      if(!hbOk){ occBox(s,hb); hbOk=true; }
      if(e.x<hb[0]-60||e.x>hb[2]+60) continue;
      figBox(e,fb);
      if(fb[2]<hb[0]||fb[0]>hb[2]||fb[3]<hb[1]||fb[1]>hb[3]) continue;
      if(!o){ o=OCCL.find(q=>q.occ===s); if(!o){ o={occ:s,clips:[],pool:[],x:s.x,y:0,hasP:false}; OCCL.push(o); } o.clips.length=0; o.y=front-0.001; o.hasP=false; }
      const c=o.pool[o.clips.length]||(o.pool[o.clips.length]=[0,0,0,0]);
      c[0]=Math.max(fb[0],hb[0]); c[1]=Math.max(fb[1],hb[1]); c[2]=Math.min(fb[2],hb[2]); c[3]=Math.min(fb[3],hb[3]); o.clips.push(c);
      if(e===player) o.hasP=true;
    }
    if(o){ o.f=OCC_F; list.push(o); }
  }
}
function drawOcc(o,t){
  const s=o.occ;
  ctx.save(); ctx.beginPath(); for(const c of o.clips) ctx.rect(c[0],c[1],c[2]-c[0],c[3]-c[1]); ctx.clip();
  const lf=DV.on?LEAN_S[s.k]:0; if(lf) leanOn(s.x,leanBase(s),lf);
  if(s.k==='column') drawColumn(s); else drawHouseStruct(s,t);
  ctx.restore();
  // Ash really hidden behind a roof (his body or head under the house's pixels): a soft glow shows where he is
  o.hid=false;
  if(o.hasP&&!player.dead){ const p=player, top=p._t3top!=null&&p._t3top<p.y?p._t3top:p.y-30-(p.z||0);
    if(occOpaque(s,p.x,p.y-8-(p.z||0))||occOpaque(s,p.x,top+7)){ o.hid=true; glowAt(p.x,(p.y+top)/2,(p.r||14)*1.7,'255,205,130',0.26+0.06*Math.sin(G.time*5)); } }
}
// is the house drawn at world point (x,y)? Reads a cached alpha mask of its sprite, undoing the lean
const OCCA=new WeakMap();
function occOpaque(s,wx,wy){
  if(s.k==='column') return false;
  const c=houseSprite(s); let m=OCCA.get(c);
  if(m===undefined){ m=null; try{ const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; m=new Uint8Array(c.width*c.height); for(let i=0;i<m.length;i++) m[i]=d[i*4+3]; }catch(e){ m=null; } OCCA.set(c,m); }
  if(!m) return false;
  let x=wx, y=wy;
  if(DV.on){ const f=LEAN_S[s.k]||0, by=occFront(s), kx=(s.x-DV.cx)*DV.k*f, ky=(by-DV.cy)*DV.k*DV.vf*f; y=(wy-ky*by)/(1-ky); x=wx-kx*(by-y); }
  const px=Math.floor((x-(s.x-c.ox))*HSC), py=Math.floor((y-(s.y-c.oy))*HSC);
  return px>=0&&py>=0&&px<c.width&&py<c.height&&m[py*c.width+px]>140;
}
// debug: switch the occluders off for a comparison, list the ones drawn last frame, and stand in a plain 3D
// reference figure for Ash and the villagers (only when a test asks; the character builds fill T3X themselves)
window.__ebX=Object.assign(window.__ebX||{},{occ(on){ if(on!=null) OCC_ON=!!on; return OCC_ON; },
  occOpaqueAt(hx,hy,wx,wy){ const s=STRUCTS.find(q=>OCC_K[q.k]&&Math.abs(q.x-hx)<1&&Math.abs(q.y-hy)<1); return !!s&&occOpaque(s,wx,wy); },
  occLast:()=>OCCL.filter(o=>o.f===OCC_F).map(o=>({k:o.occ.k,x:o.occ.x,y:o.occ.y,w:o.occ.w,h:o.occ.h,front:occFront(o.occ),clips:o.clips.length,rects:o.clips.map(c=>c.slice()),ash:o.hasP,hid:!!o.hid})),
  houses:()=>STRUCTS.filter(s=>OCC_K[s.k]&&s.k!=='column').map(s=>{ const c=houseSprite(s); return {k:s.k,x:s.x,y:s.y,w:s.w,h:s.h,top:s.y-c.oy,vert:!!s.vert}; }),
  t3TestFigs(){
    if(!T3X.ash) T3X.ash=p=>{ ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x,p.y+6,11,5,0,0,TAU); ctx.fill(); t3Begin(p.x,p.y+6,t3Turn(p,p.facing,12),{k:0.95,z:p.z||0}); t3RefPerson({walk:p.walkT*11,move:p.moving?1:0,shirt:'#b8402a',hair:'#3a1a10',pants:'#3a2a24'}); t3End(); p._t3top=p.y+6-(p.z||0)-40*0.95*T3.st; };
    if(!T3X.npc) T3X.npc=n=>{ t3Begin(n.x,n.y+6,t3Turn(n,n.face||0,10),{k:1}); t3RefPerson({walk:(n.t||0)*9,move:n.walk?1:0}); t3End(); n._t3top=n.y+6-40*T3.st; return true; };
    return true; }});
function drawLights(){
  const dl=daylight(), inA=!!AREA, rk=inA?0:G.rainK*(player.y>WALL_Y?1:0), cinder=!inA&&player.y<2700;
  let dk=(1-dl)*0.46+rk*0.06+mapNight(); if(G.region&&G.region.key==='nests') dk+=0.12; if(G.region&&(G.region.key==='b6'||G.region.key==='mire'||G.region.key==='mosshut')) dk+=0.08;
  if(cinder) dk=Math.max(0,dk-0.12);
  if(inA) dk=AREA.kind==='cave'?AREA.dark:AREA.dark+(1-dl)*0.3;
  const lw=lightCvs.width, lh=lightCvs.height, s=zoom*0.5, t=G.time;
  const lightList=[];
  const src=inA?AREA.lights:mapList(LIGHTS,curMap());
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
    if(!inA&&(player.y<3300||mapLavaGlow())){ lctx.globalAlpha=0.85; for(let cx=Math.floor(cam.x/CH);cx<=Math.floor((cam.x+W/zoom)/CH);cx++) for(let cy=Math.floor(cam.y/CH);cy<=Math.floor((cam.y+H/zoom)/CH);cy++){ const ch=CHUNKS.get(ckey(cx,cy)); if(ch&&ch.glow) lctx.drawImage(ch.glow,(cx*CH-cam.x)*s-20*s,(cy*CH-cam.y)*s-20*s,(CH+40)*s,(CH+40)*s); } lctx.globalAlpha=1; }
    lctx.globalCompositeOperation='source-over';
    ctx.drawImage(lightCvs,0,0,cvs.width,cvs.height);
  }
  if((dl<0.8||inA)&&lightList.length){
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.setTransform(DPR*zoom,0,0,DPR*zoom,-cam.x*zoom*DPR,-cam.y*zoom*DPR);
    const k=inA?0.6:(1-dl);
    for(const l of lightList){ if(!l[4]) continue; const g=ctx.createRadialGradient(l[0],l[1],0,l[0],l[1],l[2]*0.8); g.addColorStop(0,`rgba(255,150,60,${0.22*k})`); g.addColorStop(1,'rgba(255,110,30,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(l[0],l[1],l[2]*0.8,0,TAU); ctx.fill(); }
    depthGlows(lightList,k);
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
  const b=G.region?G.region.key:'', am=ambHere(), snowy=b==='b5'||b==='frost'||b==='farm'?1:am?am.snow||0:0, misty=b==='b6'||b==='mire'||b==='mosshut'?1:am?am.mist||0:0;
  snowK+=(snowy-snowK)*0.02; mistK+=(misty-mistK)*0.02;
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
  // the gradient is painted once per size into a screen sized canvas, then copied 1:1 each frame (much cheaper than a gradient fill)
  const dm=DV.on?DEPTH.mode:'off', key=cvs.width+'x'+cvs.height+dm;
  if(vigKey!==key){ vigKey=key;
    if(!vigCv||vigCv.width!==cvs.width||vigCv.height!==cvs.height) vigCv=mkCanvas(cvs.width,cvs.height);
    const vg=vigCv.getContext('2d'); vg.setTransform(1,0,0,1,0,0); vg.clearRect(0,0,vigCv.width,vigCv.height); vg.setTransform(DPR,0,0,DPR,0,0);
    if(dm==='off'){ const g=vg.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.42)'); vigGrad=g; }
    else{ const g=vg.createRadialGradient(W/2,H*0.52,Math.min(W,H)*0.3,W/2,H*0.52,Math.max(W,H)*0.74); g.addColorStop(0,'rgba(18,10,4,0)'); g.addColorStop(0.55,'rgba(18,10,4,.14)'); g.addColorStop(1,`rgba(14,8,4,${dm==='full'?0.52:0.46})`); vigGrad=g; }
    vg.fillStyle=vigGrad; vg.fillRect(0,0,W,H); }
  ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(vigCv,0,0); ctx.setTransform(DPR,0,0,DPR,0,0);
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
