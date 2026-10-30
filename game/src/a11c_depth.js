
// ================= depth: the toy diorama look (setting "3D depth": off, light, full)
// The game stays 2D. A few cheap passes make it read like a little model seen through a camera:
//  * tall things lean away from the screen centre (trees, houses, posts, statues, the wall), drawn with a shear
//    or an offset anchored at their base, so the ground and collisions never move
//  * one soft shadow layer per view (canopy shaped tree shadows, house footprints pushed along the sun, contact
//    blobs), drawn at low resolution so it is soft, and only redrawn when the camera crosses a 128 px step or the
//    sun moves; between redraws each frame is a plain copy of the tiles that hold shadows
//  * tilt-shift blur at the top and bottom of the screen from a downscaled copy of the frame, masked by gradients
//  * a warm grade by day, a soft local contrast lift (full), bloom on lamps, windows and fire, water sparkle (full)
// Light is the phone setting: one blur level, no full screen glow passes, the blur copy refreshed every fourth frame.
// Off draws exactly the old way. A frame pacing guard steps the heavy passes down on slow devices.
const DEPTH_MODES=['off','light','full'];
const DEPTH_LABEL={off:'Off',light:'Light',full:'Full'};
function depthPhone(){ try{ return matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<900; }catch(e){ return false; } }
const DSKIP={};
const DEPTH={mode:(()=>{ const v=store.get('eb_depth',null); return DEPTH_MODES.includes(v)?v:(depthPhone()?'light':'full'); })()};
function setDepth(m){ if(!DEPTH_MODES.includes(m)) return DEPTH.mode; DEPTH.mode=m; GOV.lvl=0; GOV.n=GOV.slow=0; store.set('eb_depth',m); SHL.key=''; DP.ok=false; vigKey=''; depthSyncRow(); return m; }
function getDepth(){ return DEPTH.mode; }
// per-frame view state: camera centre, world matrix, lean strength
const LEAN_D=2400, LEAN_VF=0.55;
const DV={on:false,full:false,lite:false,cx:0,cy:0,k:1/LEAN_D,vf:LEAN_VF,Z:1,tx:0,ty:0,last:0,ashY:0};
const TREEH={oak:64,birch:58,pine:76,spine:76,dead:52,willow:54};
// frame pacing guard: if most frames over a two second window take longer than about 21 ms while playing,
// the heaviest passes switch off one step at a time (the saved setting is not touched)
const GOV={lvl:0,n:0,slow:0,last:0,off:false};
function govTick(){
  const now=performance.now(), dt=now-GOV.last; GOV.last=now;
  if(GOV.off||scene!=='play'||!(dt>0&&dt<100)||document.hidden) return;
  GOV.n++; if(dt>21) GOV.slow++;
  if(GOV.n>=120){ if(GOV.slow>GOV.n*0.7&&GOV.lvl<2){ GOV.lvl++; SHL.key=''; } GOV.n=0; GOV.slow=0; }
}
function depthFrame(Z,tx,ty){
  DV.on=DEPTH.mode!=='off'; DV.full=DEPTH.mode==='full'&&GOV.lvl<2; DV.lite=DEPTH.mode==='full'&&GOV.lvl===1;
  if(DV.on) govTick();
  // full: a few extra sun glints on open water by day (the toy plastic sparkle)
  if(DV.full&&!AREA&&G.ripples&&G.ripples.length<40&&Math.random()<0.3*daylight()){ const x=cam.x+Math.random()*W/zoom, y=cam.y+Math.random()*H/zoom, s=T(x,y,{}); if(s.water&&!s.bridge&&!s.lava) G.ripples.push({x,y,t:0,max:0.6+Math.random()*0.7,r:5+Math.random()*8,glint:true}); }
  DV.Z=Z; DV.tx=tx; DV.ty=ty;
  DV.cx=cam.x+W/zoom/2; DV.cy=cam.y+H/zoom/2;
  return DV;
}
// the diorama sun: shadows sweep from the west in the morning, through short ones falling toward the camera at
// noon, to long ones in the east at dusk (shadows that fall south stay visible in this three-quarter view)
const DSUN={dx:0,dy:0,a:0};
function depthSun(){
  const t=G?G.tod:0.35, d=daylight();
  if(d<0.05){ DSUN.dx=3; DSUN.dy=5; DSUN.a=0.1; return DSUN; }
  const u=clamp((t-0.2)/0.6,0,1), phi=Math.PI*(1-u)*0.86+Math.PI*0.07, el=Math.sin(u*Math.PI), len=7+25*(1-el);
  DSUN.dx=Math.cos(phi)*len; DSUN.dy=Math.sin(phi)*len*0.8+2; DSUN.a=0.12+0.26*d; return DSUN;
}
// offset of a point h px above the ground at (x,y)
function leanDX(x,h){ return (x-DV.cx)*h*DV.k; }
function leanDY(y,h){ return (y-DV.cy)*h*DV.k*DV.vf; }
// shear the world transform so everything drawn next leans outward, pinned on the line y=by
function leanOn(bx,by,f){
  const kx=(bx-DV.cx)*DV.k*f, ky=(by-DV.cy)*DV.k*DV.vf*f, Z=DV.Z;
  ctx.setTransform(Z,0,-kx*Z,(1-ky)*Z,Z*kx*by+DV.tx,Z*ky*by+DV.ty);
}
function leanOff(){ ctx.setTransform(DV.Z,0,0,DV.Z,DV.tx,DV.ty); }
// how strongly each struct or landmark leans, and where its base line is
const LEAN_S={house:0.62,forge:0.62,library:0.56,torch:1,lantern:1,stone:1.1,column:0.9,cavemouth:0.42,statue:0.8,facetree:0.6,scarecrow:0.9,grave:0.8,sign:0.9,snowman:0.9,beehive:0.9,wishwell:0.6,ribs:0.55,iceblock:0.7,boatframe:0.5,wagon:0.6};
function leanBase(s){
  switch(s.k){ case 'house': case 'forge': case 'library': return s.y+s.h/2; case 'torch': return s.y+2; case 'lantern': return s.y+12; case 'stone': return s.y+18*(s.s||1); case 'cavemouth': return s.y+12; }
  return s.y;
}
// ---------- soft shadow layer (static things: trees, houses, posts), cached per 128 px camera step and sun angle
const SHL={cv:null,g:null,ox:0,oy:0,q:0.3,key:'',redraws:0,ups:0,big:null,bg:null,bigOK:false,bigZ:0,zLast:0,zStable:0};
function silOf(sp){
  if(sp._sil) return sp._sil;
  const c=mkCanvas(sp.width*0.25,sp.height*0.25), g=c.getContext('2d');
  g.drawImage(sp,0,0,c.width,c.height); g.globalCompositeOperation='source-in'; g.fillStyle=LOOK.sb?'#2e1838':'#000'; g.fillRect(0,0,c.width,c.height);
  sp._sil=c; return c;
}
function hull(P){
  P.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]), lo=[], up=[];
  for(const p of P){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0) lo.pop(); lo.push(p); }
  for(let i=P.length-1;i>=0;i--){ const p=P[i]; while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
// rotate by rot, then stretch by e along the angle phi (2x2 part of a canvas transform)
function stretchM(phi,e,rot){
  const c1=Math.cos(phi), s1=Math.sin(phi), c2=Math.cos(rot-phi), s2=Math.sin(rot-phi);
  return [c1*e*c2-s1*s2, s1*e*c2+c1*s2, -c1*e*s2-s1*c2, -s1*e*s2+c1*c2];
}
const STW=128; // shadow tile size in world px (the layer origin snaps to 128 too, so tiles line up with the world)
function shadowLayer(sun,props){
  if(!BIGOAKS) BIGOAKS=STRUCTS.filter(s=>s.k==='bigoak');
  const q=DV.full?0.3125:0.25, M=100, vw=W/zoom, vh=H/zoom;
  const ox=Math.floor((cam.x-M)/STW)*STW, oy=Math.floor((cam.y-M)/STW)*STW;
  const ntx=Math.ceil((cam.x+vw+M-ox)/STW)+1, nty=Math.ceil((cam.y+vh+M-oy)/STW)+1, lw=ntx*STW*q, lh=nty*STW*q;
  if(!SHL.cv||SHL.cv.width!==lw||SHL.cv.height!==lh||SHL.q!==q){ SHL.cv=mkCanvas(lw,lh); SHL.g=SHL.cv.getContext('2d'); SHL.q=q; SHL.key=''; }
  const ux=Math.round(sun.dx)/40, uy=Math.round(sun.dy)/40;
  const key=ox+','+oy+','+ux+','+uy+','+lw+','+lh;
  if(key!==SHL.key){ SHL.key=key; SHL.ox=ox; SHL.oy=oy; SHL.ntx=ntx; SHL.nty=nty; SHL.tiles=new Uint8Array(ntx*nty); SHL.redraws++; drawShadowLayer(SHL.g,lw,lh,ox,oy,q,ux,uy); SHL.bigOK=false; }
  // daylight shadows, fading to faint moon shadows at night, weaker under rain clouds
  const dl=daylight(), rk=G.rainK*(player.y>WALL_Y?1:0);
  const a=(0.07+0.27*dl)*(1-0.55*rk), aq=Math.round(a*60)/60;
  if(a<0.095) return; // deep night: moon shadows are too faint to be worth a pass
  // low props (bushes, rocks): small blobs straight onto the ground, they rarely overlap
  const SH=SPR.shadow; ctx.globalAlpha=a*0.85;
  if(!DSKIP.lowp) for(const p of props){ if(p.taken||TREEH[p.k]||p.k==='herb'||p.k==='vent') continue; const h=p.k==='crag'?16:p.k==='bush'||p.k==='shrub'||p.k==='fshrub'||p.k==='mbush'?10:7, r=p.R*0.95; ctx.drawImage(SH,p.x+ux*h-r,p.y+uy*h-r*0.8,r*2,r*1.6); }
  // the soft layer is scaled up once into a canvas at screen resolution, so each frame is a plain 1:1 copy
  // (when the zoom is changing, or the screen is very large, it is scaled on the fly)
  const Zd=DV.Z, bw=Math.ceil(lw/q*Zd), bh=Math.ceil(lh/q*Zd);
  if(Zd!==SHL.zLast){ SHL.zLast=Zd; SHL.zStable=0; } else SHL.zStable++;
  const useBig=bw*bh<=3.4e6&&SHL.zStable>2;
  if(useBig&&(!SHL.bigOK||SHL.bigZ!==Zd||SHL.bigA!==aq)){
    if(!SHL.big||SHL.big.width!==bw||SHL.big.height!==bh){ SHL.big=mkCanvas(bw,bh); SHL.bg=SHL.big.getContext('2d'); }
    // the shadow strength is baked in too, so the copy each frame is a plain blit (it is redone when the light changes)
    const g=SHL.bg; g.globalCompositeOperation='copy'; g.globalAlpha=aq; g.imageSmoothingEnabled=true; g.drawImage(SHL.cv,0,0,lw,lh,0,0,bw,bh); g.globalCompositeOperation='source-over'; g.globalAlpha=1;
    SHL.bigOK=true; SHL.bigZ=Zd; SHL.bigA=aq; SHL.ups++;
  }
  const big=useBig&&SHL.bigOK; let n=0;
  if(big){ ctx.globalAlpha=1; ctx.setTransform(1,0,0,1,0,0); if(!DSKIP.shcomp) ctx.drawImage(SHL.big,Math.round(ox*Zd+DV.tx),Math.round(oy*Zd+DV.ty)); leanOff(); n=1; }
  else{
    // scaled on the fly: copy only the runs of tiles that hold a shadow
    ctx.globalAlpha=a;
    const T=SHL.tiles, tq=STW*q, tx0=Math.max(0,Math.floor((cam.x-ox)/STW)), tx1=Math.min(ntx-1,Math.floor((cam.x+vw-ox)/STW)), ty0=Math.max(0,Math.floor((cam.y-oy)/STW)), ty1=Math.min(nty-1,Math.floor((cam.y+vh-oy)/STW));
    if(!DSKIP.shcomp) for(let ty=ty0;ty<=ty1;ty++) for(let tx=tx0;tx<=tx1;tx++){
      if(!T[ty*ntx+tx]) continue;
      let e=tx; while(e+1<=tx1&&T[ty*ntx+e+1]) e++;
      ctx.drawImage(SHL.cv,tx*tq,ty*tq,(e-tx+1)*tq,tq,ox+tx*STW,oy+ty*STW,(e-tx+1)*STW,STW);
      n++; tx=e;
    }
  }
  SHL.runs=n;
  ctx.globalAlpha=1;
}
function drawShadowLayer(g,lw,lh,ox,oy,q,ux,uy){
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,lw,lh);
  const x0=ox, y0=oy, x1=ox+lw/q, y1=oy+lh/q, inR=(x,y,m)=>x>x0-m&&y>y0-m&&x<x1+m&&y<y1+m;
  const len=Math.hypot(ux,uy)*40, phi=Math.atan2(uy,ux), e=1+len*0.018;
  const T=(x,y)=>g.setTransform(q,0,0,q,(x-ox)*q,(y-oy)*q);
  const SH=SPR.shadow, TL=SHL.tiles, ntx=SHL.ntx, nty=SHL.nty;
  // remember which tiles hold anything: the box around a caster and its shadow
  const mark=(xa,ya,xb,yb)=>{ const a=Math.max(0,Math.floor((xa-ox)/STW)), b=Math.min(ntx-1,Math.floor((xb-ox)/STW)), c=Math.max(0,Math.floor((ya-oy)/STW)), d=Math.min(nty-1,Math.floor((yb-oy)/STW)); for(let ty=c;ty<=d;ty++) for(let tx=a;tx<=b;tx++) TL[ty*ntx+tx]=1; };
  const markS=(x,y,r,h)=>{ const sx=x+ux*h, sy=y+uy*h; mark(Math.min(x,sx)-r-6,Math.min(y,sy)-r-6,Math.max(x,sx)+r+6,Math.max(y,sy)+r+6); };
  // trees in the layer area
  const c0=Math.floor((x0-80)/CH), c1=Math.floor((x1+80)/CH), r0=Math.floor((y0-80)/CH), r1=Math.floor((y1+80)/CH);
  const trees=[];
  g.globalAlpha=1;
  T(0,0);
  for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++){
    const arr=propsFor(cx,cy);
    for(const p of arr){ if(p.taken||!TREEH[p.k]||!inR(p.x,p.y,p.R+90)) continue; trees.push(p); }
  }
  // tree trunks (one path), then canopy shaped shadows stretched along the sun
  g.globalAlpha=0.85; g.strokeStyle=LOOK.sb?'#2e1838':'#000'; g.lineCap='round';
  g.beginPath(); for(const p of trees){ const h=TREEH[p.k]*p.s*0.8; g.moveTo(p.x,p.y); g.lineTo(p.x+ux*h,p.y+uy*h); } g.lineWidth=7; g.stroke();
  g.globalAlpha=1;
  for(const p of trees){
    const sp=propSprite(p), sil=silOf(sp), h=TREEH[p.k]*p.s, sx=p.x+ux*h, sy=p.y+uy*h, hh=sp.half*p.s*(p.k==='dead'?0.95:0.9);
    const m=stretchM(phi,e,LOOK.sb?0:p.rot); markS(p.x,p.y,hh*e,h);
    g.setTransform(q*m[0],q*m[1],q*m[2],q*m[3],(sx-ox)*q,(sy-oy)*q); g.drawImage(sil,-hh,-hh,hh*2,hh*2);
  }
  // contact blobs at the trunks
  T(0,0); g.globalAlpha=0.9;
  for(const p of trees){ const r=13*p.s; g.drawImage(SH,p.x-r,p.y-r*0.55,r*2,r*1.1); }
  // the big oaks
  for(const b of BIGOAKS||[]){ if(!inR(b.x,b.y,b.R*2)) continue; const sp=SPR.bigoak, sil=silOf(sp), sc=b.R/48, h=118*sc, hh=sp.half*sc*0.92, sx=b.x+ux*h, sy=b.y+uy*h; markS(b.x,b.y,hh*e,h);
    g.globalAlpha=0.9; T(0,0); g.lineWidth=26; g.beginPath(); g.moveTo(b.x,b.y); g.lineTo(sx,sy); g.stroke();
    const m=stretchM(phi,e,0); g.globalAlpha=1; g.setTransform(q*m[0],q*m[1],q*m[2],q*m[3],(sx-ox)*q,(sy-oy)*q); g.drawImage(sil,-hh,-hh,hh*2,hh*2);
    T(0,0); g.globalAlpha=0.9; g.drawImage(SH,b.x-40,b.y-24,80,48); }
  // houses: the footprint pushed along the sun (a box of the house height), softened by the low resolution
  T(0,0); g.globalAlpha=1; g.fillStyle=LOOK.sb?'#2e1838':'#000';
  const mk=curMap();
  for(const h of mapList(HOUSES,mk)){
    if(!inR(h.x,h.y,h.w+120)) continue;
    const hh=(h.k==='library'?62:h.k==='forge'?54:h.vert?58:48), dx=ux*hh, dy=uy*hh, X0=h.x-h.w/2-2, X1=h.x+h.w/2+2, Y0=h.y-h.h/2, Y1=h.y+h.h/2+3;
    const P=hull([[X0,Y0],[X1,Y0],[X1,Y1],[X0,Y1],[X0+dx,Y0+dy],[X1+dx,Y0+dy],[X1+dx,Y1+dy],[X0+dx,Y1+dy]]); mark(Math.min(X0,X0+dx)-20,Math.min(Y0,Y0+dy)-8,Math.max(X1,X1+dx)+20,Math.max(Y1,Y1+dy)+20);
    g.beginPath(); for(let i=0;i<P.length;i++) i?g.lineTo(P[i][0],P[i][1]):g.moveTo(P[i][0],P[i][1]); g.closePath(); g.fill();
    g.globalAlpha=0.7; g.drawImage(SH,X0-14,Y1-14,X1-X0+28,26); g.globalAlpha=1;
  }
  // posts, lanterns, standing stones, columns, statues
  g.lineWidth=4; g.beginPath();
  for(const s of mapList(STRUCTS,mk)){
    if(!inR(s.x,s.y,80)) continue;
    if(s.k==='torch'){ g.moveTo(s.x,s.y+2); g.lineTo(s.x+ux*30,s.y+2+uy*30); }
    else if(s.k==='lantern'){ g.moveTo(s.x,s.y+12); g.lineTo(s.x+ux*16,s.y+12+uy*16); }
  }
  g.stroke();
  for(const s of mapList(STRUCTS,mk)){
    if(!inR(s.x,s.y,80)) continue;
    if(s.k==='torch'||s.k==='lantern'||s.k==='stone'||s.k==='column'||s.k==='pillar'||s.k==='ward') markS(s.x,s.y,40,56);
    if(s.k==='torch'){ g.drawImage(SH,s.x+ux*30-8,s.y+uy*30-6,16,12); g.drawImage(SH,s.x-7,s.y-2,14,8); }
    else if(s.k==='lantern'){ g.drawImage(SH,s.x+ux*18-10,s.y+12+uy*18-10,20,20); }
    else if(s.k==='stone'){ const k=s.s||1, h=34*k; g.globalAlpha=0.95; g.drawImage(SH,s.x+ux*h*0.5-18*k,s.y+uy*h*0.5-14*k,36*k,30*k); g.drawImage(SH,s.x+ux*h-14*k,s.y+uy*h-12*k,28*k,24*k); g.globalAlpha=1; }
    else if(s.k==='column'){ const k=s.s||1, h=(s.broken?24:54)*k; g.beginPath(); g.moveTo(s.x,s.y); g.lineTo(s.x+ux*h,s.y+uy*h); g.lineWidth=28*k; g.stroke(); g.lineWidth=4; }
    else if(s.k==='pillar'||s.k==='ward'){ g.drawImage(SH,s.x+ux*14-34,s.y+uy*14-30,68,60); }
  }
  for(const o of mapList(LANDMARKS,mk)){
    if(!inR(o.x,o.y,90)) continue;
    const h=o.k==='statue'?90:o.k==='facetree'?110:o.k==='scarecrow'?44:o.k==='snowman'?40:o.k==='grave'||o.k==='sign'?24:0;
    if(!h) continue;
    const w=o.k==='facetree'?44:o.k==='statue'?26:16; markS(o.x,o.y,o.k==='facetree'?66:26,h);
    g.globalAlpha=0.95; g.beginPath(); g.moveTo(o.x,o.y); g.lineTo(o.x+ux*h,o.y+uy*h); g.lineWidth=w; g.stroke(); g.lineWidth=4;
    if(o.k==='facetree'){ const sil=silOf(SPR.oak[0]), hh=60; g.globalAlpha=1; g.drawImage(sil,o.x+ux*h-hh,o.y+uy*h-hh,hh*2,hh*2); }
  }
  g.globalAlpha=1; g.setTransform(1,0,0,1,0,0);
}
// a tight soft blob right under a character's feet, drawn just before it
function contactShadow(e){
  if(!DV.on) return;
  if(e===player&&(airborne()||player.dead)) return;
  if(e.flying||e.dead) return;
  const r=(e.r||10)*(e===player?0.95:0.9);
  ctx.globalAlpha=AREA?0.42:0.34; ctx.drawImage(SPR.shadow,e.x-r,e.y-r*0.32,r*2,r*1.05); ctx.globalAlpha=1;
}
// ---------- tree drawing with lean: trunk, then the canopy pushed out from the screen centre
function drawTallLean(p,a,rot){
  const sp=propSprite(p), h=TREEH[p.k]*p.s, dx=leanDX(p.x,h), dy=leanDY(p.y,h);
  ctx.globalAlpha=a;
  if(p.k==='dead'||Math.abs(dx)+Math.abs(dy)>6){
    const w0=(p.k==='dead'?8:7)*p.s, w1=w0*0.7, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
    ctx.fillStyle=LOOK.sb?(p.k==='dead'?(p.y<3000?'#4e3a38':'#8a6a4e'):'#8a5e3c'):p.k==='dead'?(p.y<3000?'#1c1614':'#4e463c'):'#3a2a18';
    ctx.beginPath(); ctx.moveTo(p.x+nx*w0,p.y+ny*w0); ctx.lineTo(p.x+dx+nx*w1,p.y+dy+ny*w1); ctx.lineTo(p.x+dx-nx*w1,p.y+dy-ny*w1); ctx.lineTo(p.x-nx*w0,p.y-ny*w0); ctx.closePath(); ctx.fill();
    if(LOOK.sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=1.8; ctx.lineJoin='round'; ctx.stroke(); }
  }
  drawSprite(sp,p.x+dx,p.y+dy,p.s,rot);
}
function tallFade(p,dx,dy,bossE){
  let a=1; const cx=p.x+dx, cy=p.y+dy, dp=dist(cx,cy,player.x,player.y-(player.z||0)); if(dp<p.R*0.95) a=0.35+0.5*clamp((dp-p.R*0.45)/(p.R*0.5),0,1);
  if(bossE&&dist(cx,cy,bossE.x,bossE.y)<p.R) a=Math.min(a,0.4);
  for(const e of G.enemies) if(e.aggro&&!e.dead&&!e.frozen&&dist2(cx,cy,e.x,e.y)<p.R*p.R*0.5){ a=Math.min(a,0.55); break; }
  return a;
}
const TALLS=[];
function drawTallProps(props,t,bossE){
  if(LOOK.re){ rzTallProps(props,t,bossE); return; }   // (v12 PROPS) the Realistic trunks and crowns, e12c_props.js
  // trees in back-to-front order; in full each crown first lays a soft dark halo on the crowns behind it
  TALLS.length=0; for(const p of props) if(TREEH[p.k]) TALLS.push(p);
  TALLS.sort((a,b)=>a.y-b.y);
  const halo=DV.full&&!DV.lite&&!DSKIP.halo, ha=AREA?0:0.16+0.1*daylight();
  for(const p of TALLS){
    const h=TREEH[p.k]*p.s, dx=leanDX(p.x,h), dy=leanDY(p.y,h), a=tallFade(p,dx,dy,bossE), rot=Math.sin(t*0.8+p.ph)*0.025*(1+G.rainK*1.5)+(LOOK.sb?0:p.rot);
    if(halo&&a>0.9&&p.k!=='dead'){ const sp=propSprite(p), sil=silOf(sp), hh=sp.half*p.s*1.04; ctx.globalAlpha=ha; ctx.drawImage(sil,p.x+dx-hh+3,p.y+dy-hh+7,hh*2,hh*2); }
    drawTallLean(p,a,rot);
  }
  ctx.globalAlpha=1;
}
function drawBigOakLean(b,t){
  const sc=b.R/48, h=118*sc, dx=leanDX(b.x,h), dy=leanDY(b.y,h), cx=b.x+dx, cy=b.y+dy, dp=dist(cx,cy,player.x,player.y);
  ctx.globalAlpha=dp<b.R?0.4+0.5*clamp((dp-b.R*0.4)/(b.R*0.6),0,1):1;
  drawSprite(SPR.bigoak,cx,cy,sc,Math.sin(t*0.5)*0.015);
  ctx.globalAlpha=1;
}
// the trunk of a big oak, drawn with its roots (before the characters) so it rises toward the leaning crown
function bigOakTrunk(s){
  if(!DV.on) return;
  const sc=s.R/48, h=118*sc, dx=leanDX(s.x,h)*0.8, dy=leanDY(s.y,h)*0.8, L=Math.hypot(dx,dy); if(L<2) return;
  const nx=-dy/L, ny=dx/L, w0=20, w1=15;
  const gr=ctx.createLinearGradient(s.x-nx*w0,s.y-ny*w0,s.x+nx*w0,s.y+ny*w0); gr.addColorStop(0,'#2e1e10'); gr.addColorStop(0.45,'#6a4a2a'); gr.addColorStop(1,'#24180c');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(s.x+nx*w0,s.y+ny*w0); ctx.lineTo(s.x+dx+nx*w1,s.y+dy+ny*w1); ctx.lineTo(s.x+dx-nx*w1,s.y+dy-ny*w1); ctx.lineTo(s.x-nx*w0,s.y-ny*w0); ctx.closePath(); ctx.fill();
}
// standing stones: a darker body from the base up to the leaning top so they read as upright blocks
function drawStoneLean(s,t){
  const k=s.s||1, h=34*k, dx=leanDX(s.x,h), dy=leanDY(s.y,h)-h*0.32;
  ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.a);
  ctx.fillStyle=LOOK.re?'#57534c':LOOK.sb?'#6c6862':'#3a3630'; ctx.beginPath(); ctx.ellipse(0,0,14*k,22*k,0,0,TAU); ctx.fill(); if(LOOK.sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=1.8; ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.translate(s.x+dx*0.5,s.y+dy*0.5); ctx.rotate(s.a); ctx.fillStyle=LOOK.re?'#67625a':LOOK.sb?'#7c7872':'#4a453e'; ctx.beginPath(); ctx.ellipse(0,0,14*k,22*k,0,0,TAU); ctx.fill(); ctx.restore();
  drawStruct(Object.assign({},s,{x:s.x+dx,y:s.y+dy}),t);
}
// ---------- the Obsidian Wall: a stone face below its top, the top pushed back and splayed by the lean
function wallLean(){ const Hw=44, fh=16-((WALL_Y-DV.cy)*Hw*DV.k*DV.vf), sx=1+Hw*DV.k; return {fh:clamp(fh,6,34),sx}; }
let wallFaceGrad=null;
function drawWallDepth(x0,x1){
  const L=wallLean(), fh=L.fh, sx=L.sx, cx=DV.cx, By=WALL_Y+26, X=(x,s)=>cx+(x-cx)*s;
  if(!wallFaceGrad){ wallFaceGrad=ctx.createLinearGradient(0,WALL_Y-10,0,WALL_Y+26); wallFaceGrad.addColorStop(0,'#3a3644'); wallFaceGrad.addColorStop(0.5,'#24212b'); wallFaceGrad.addColorStop(1,'#121016'); }
  const segs=[[0,GATE_X0-80],[GATE_X1+80,WORLD.w]].map(([a,b])=>[Math.max(a,x0-60),Math.min(b,x1+60)]).filter(([a,b])=>b>a);
  // the south face of the wall, from its foot up to the leaning top
  ctx.fillStyle=wallFaceGrad;
  for(const [a,b] of segs){ ctx.beginPath(); ctx.moveTo(a,By); ctx.lineTo(b,By); ctx.lineTo(X(b,sx),By-fh); ctx.lineTo(X(a,sx),By-fh); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1.2; ctx.beginPath();
  for(const [a,b] of segs){
    for(const f of [0.36,0.7]){ const y=By-fh*f, s=1+(sx-1)*f; ctx.moveTo(X(a,s),y); ctx.lineTo(X(b,s),y); }
    for(let x=Math.ceil(a/34)*34;x<b;x+=34){ const o=(Math.floor(x/34)%2)*17; ctx.moveTo(x+o,By); ctx.lineTo(X(x+o,1+(sx-1)*0.36),By-fh*0.36); ctx.moveTo(X(x+o+8,1+(sx-1)*0.36),By-fh*0.36); ctx.lineTo(X(x+o+8,1+(sx-1)*0.7),By-fh*0.7); }
  }
  ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.05)'; for(const [a,b] of segs){ ctx.beginPath(); ctx.moveTo(X(a,sx),By-fh); ctx.lineTo(X(b,sx),By-fh); ctx.lineTo(X(b,1+(sx-1)*0.85),By-fh*0.85); ctx.lineTo(X(a,1+(sx-1)*0.85),By-fh*0.85); ctx.closePath(); ctx.fill(); }
  // the top of the wall, pushed back by the face height and splayed a touch
  ctx.save(); ctx.transform(sx,0,0,1,cx*(1-sx),-fh);
  ctx.fillStyle=wallPattern;
  for(const [a,b] of segs) ctx.fillRect(a,WALL_Y-26,b-a,52);
  ctx.fillStyle='rgba(0,0,0,.25)'; for(const [a,b] of segs) ctx.fillRect(a,WALL_Y+22,b-a,4);
  ctx.fillStyle='#4a4656'; for(let x=Math.floor(x0/40)*40;x<x1;x+=40){ if(x>GATE_X0-90&&x<GATE_X1+80) continue; ctx.fillRect(x,WALL_Y-30,22,10); }
  ctx.fillStyle='rgba(0,0,0,.35)'; for(let x=Math.floor(x0/40)*40;x<x1;x+=40){ if(x>GATE_X0-90&&x<GATE_X1+80) continue; ctx.fillRect(x,WALL_Y-20,22,2.5); }
  if(GATE_COL&&!GATE_COL.off){ ctx.fillStyle='#14121a'; ctx.fillRect(GATE_X0,WALL_Y-20,GATE_X1-GATE_X0,40); ctx.strokeStyle='#5a5466'; ctx.lineWidth=3; ctx.beginPath(); for(let x=GATE_X0+8;x<GATE_X1;x+=14){ ctx.moveTo(x,WALL_Y-20); ctx.lineTo(x,WALL_Y+20+fh); } ctx.moveTo(GATE_X0,WALL_Y); ctx.lineTo(GATE_X1,WALL_Y); ctx.stroke(); }
  ctx.restore();
  // the two gate towers: taller, so a taller face and more lean
  if(x1>GATE_X0-200&&x0<GATE_X1+200){
    const fT=fh*1.7+8, sT=1+(sx-1)*1.7, Bt=WALL_Y+60;
    for(const tx of [GATE_X0-80,GATE_X1]){
      ctx.fillStyle='#1c1a22'; ctx.beginPath(); ctx.moveTo(tx,Bt); ctx.lineTo(tx+80,Bt); ctx.lineTo(X(tx+80,sT),Bt-fT); ctx.lineTo(X(tx,sT),Bt-fT); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(255,120,50,.22)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(X(tx+24,1+(sT-1)*0.5),Bt-fT*0.5); ctx.lineTo(X(tx+56,1+(sT-1)*0.5),Bt-fT*0.5); ctx.stroke();
      ctx.save(); ctx.transform(sT,0,0,1,cx*(1-sT),-fT);
      const gr=ctx.createLinearGradient(tx,WALL_Y-60,tx+80,WALL_Y+60); gr.addColorStop(0,'#4a4656'); gr.addColorStop(1,'#16141c'); ctx.fillStyle=gr; ctx.fillRect(tx,WALL_Y-60,80,120); ctx.strokeStyle='rgba(255,120,50,.35)'; ctx.lineWidth=2; ctx.strokeRect(tx+10,WALL_Y-50,60,100);
      ctx.restore();
    }
  }
}
// ---------- post passes: tilt-shift, toy grade, bloom
const DP={fr:0,cfr:0,ok:false,ctx:0,cty:0,cz:0,cfull:false,cA:false,cte:0,cbs:0,caps:0,cw:0,ch:0,A:null,a:null,Am:null,am:null,B:null,b:null,Bm:null,bm:null,C:null,c:null,aw:0,ah:0,bw:0,bh:0};
function dpMk(w,h){ const c=mkCanvas(Math.max(w,136),Math.max(h,136)); return [c,c.getContext('2d')]; }
function depthSizes(){
  const cw=cvs.width, ch=cvs.height; if(DP.cw===cw&&DP.ch===ch&&DP.A) return;
  DP.ok=false; DP.cw=cw; DP.ch=ch; DP.aw=Math.ceil(cw/4); DP.ah=Math.ceil(ch/4); DP.hw=0; DP.bw=Math.ceil(cw/12); DP.bh=Math.ceil(ch/12);
  [DP.A,DP.a]=dpMk(DP.aw,DP.ah); [DP.Am,DP.am]=dpMk(DP.aw,DP.ah); [DP.B,DP.b]=dpMk(DP.bw,DP.bh); [DP.Bm,DP.bm]=dpMk(DP.bw,DP.bh); [DP.C,DP.c]=dpMk(DP.bw,DP.bh); [DP.O,DP.o]=dpMk(DP.aw,DP.ah); DP.hw=Math.ceil(cw/2); DP.hh=Math.ceil(ch/2); [DP.H,DP.h]=dpMk(DP.hw,DP.hh);
  for(const g of [DP.a,DP.am,DP.b,DP.bm,DP.c,DP.o]){ g.imageSmoothingEnabled=true; try{ g.imageSmoothingQuality='medium'; }catch(e){} }
}
// a vertical alpha mask on a small canvas: 1 at the top fading to 0 at te, 0 until bs, then up to bmax at the bottom
function dpMask(g,w,h,top,te,bs,bmax){
  const gr=g.createLinearGradient(0,0,0,h), S=6;
  for(let i=0;i<=S;i++){ const u=i/S, y=te*u; gr.addColorStop(clamp(y/h,0,1),`rgba(0,0,0,${(top*(1-smooth(u))).toFixed(3)})`); }
  for(let i=0;i<=S;i++){ const u=i/S, y=bs+(h-bs)*u; gr.addColorStop(clamp(y/h,0,1),`rgba(0,0,0,${(bmax*smooth(u)).toFixed(3)})`); }
  g.globalCompositeOperation='destination-in'; g.fillStyle=gr; g.fillRect(0,0,w,h); g.globalCompositeOperation='source-over';
}
function depthPost(){
  if(!DV.on||DSKIP.post||(GOV.lvl>=2&&DEPTH.mode==='light')) return;
  depthSizes();
  const now=performance.now(), dt=Math.min(0.1,(now-(DV.last||now))/1000); DV.last=now;
  const cw=DP.cw, ch=DP.ch, s=cw/W, inA=!!AREA, cave=inA&&AREA.kind==='cave', menu=scene==='menu';
  // keep Ash in the sharp band: the bands back away when he walks near the top or bottom of the view
  const ay=menu?H*0.55:clamp(((player.y-(player.z||0))-cam.y)*zoom,0,H);
  DV.ashY+=(ay-DV.ashY)*(DV.ashY?Math.min(1,dt*7):1);
  const full=DV.full, str=cave?0.55:inA?0.62:1;
  const te=clamp(Math.min(H*(full?0.34:0.27),DV.ashY-H*0.15),H*0.06,H*0.4), bs=clamp(Math.max(H*(full?0.7:0.77),DV.ashY+H*0.17),H*0.55,H*0.94);
  const A=DP.A, a=DP.a, aw=DP.aw, ah=DP.ah, k=aw/cw, B=DP.B, bw=DP.bw, bh=DP.bh, kk=bw/cw;
  // 1) downscale the finished world (the whole frame for full, the bands plus a margin for light). This is the
  // costly step, so it runs every other frame (every fourth in light); in between, the last copy is shifted by how far the camera moved
  DP.fr++;
  const tx=DV.tx, ty=DV.ty, mg=40*s, far=Math.abs(tx-DP.ctx)>mg*0.7||Math.abs(ty-DP.cty)>mg*0.7;
  const need=DSKIP.every||!DP.ok||DP.fr-DP.cfr>=(DV.full?2:GOV.lvl?5:4)||DP.cz!==DV.Z||DP.cfull!==full||DP.cA!==inA||far||Math.abs(te-DP.cte)>12||Math.abs(bs-DP.cbs)>12;
  if(need){
    // two exact halvings (a 4x4 box filter) of just the rows that are needed: cheaper than mipmaps, and steady in motion
    const h=DP.h, hw=DP.hw, hh=DP.hh, t1=full?ch:Math.min(ch,Math.ceil(te*s+mg)), b0=full?ch:Math.max(0,Math.floor(bs*s-mg));
    const half=(y0,y1)=>{ if(y1<=y0) return; const Y0=y0&~3, Y1=Math.min(ch,(y1+3)&~3); h.drawImage(cvs,0,Y0,cw,Y1-Y0,0,Y0/2,hw,(Y1-Y0)/2); a.drawImage(DP.H,0,Y0/2,hw,(Y1-Y0)/2,0,Y0/4,aw,(Y1-Y0)/4); };
    h.globalCompositeOperation='copy'; a.globalCompositeOperation='copy';
    if(DSKIP.cap1){ try{ a.imageSmoothingQuality='medium'; }catch(e){} if(full) a.drawImage(cvs,0,0,cw,ch,0,0,aw,ah); else{ a.drawImage(cvs,0,0,cw,t1,0,0,aw,t1*k); a.drawImage(cvs,0,b0,cw,ch-b0,0,b0*k,aw,(ch-b0)*k); } }
    else{ try{ a.imageSmoothingQuality='low'; h.imageSmoothingQuality='low'; }catch(e){} half(0,t1); if(!full) half(b0,ch); }
    a.globalCompositeOperation='source-over'; h.globalCompositeOperation='source-over';
    if(full){ const b=DP.b, c=DP.c, o=DP.o; b.globalCompositeOperation='copy'; b.drawImage(A,0,0,aw,ah,0,0,bw,bh); b.globalCompositeOperation='source-over';
      c.globalCompositeOperation='copy'; c.drawImage(B,0,0); c.globalCompositeOperation='multiply'; c.drawImage(B,0,0); c.globalCompositeOperation='source-over';
      // the source for the toy grade: the blurred frame, warmed a little (this is where the daytime warmth comes from)
      const d=inA?0.4:daylight(); o.globalCompositeOperation='copy'; o.drawImage(A,0,0); o.globalCompositeOperation='multiply'; o.fillStyle=`rgb(255,${Math.round(255-14*d)},${Math.round(255-46*d)})`; o.fillRect(0,0,aw,ah); o.globalCompositeOperation='source-over';
      // it fades out smoothly into the blurred bands (a hard edge there would show as a line)
      const gr=o.createLinearGradient(0,0,0,ah), r0=te*s*k*0.3, r1=te*s*k, r2=bs*s*k, r3=(bs*s+(ch-bs*s)*0.75)*k, S=5;
      for(let i=0;i<=S;i++){ const u=i/S; gr.addColorStop(clamp((r0+(r1-r0)*u)/ah,0,1),`rgba(0,0,0,${smooth(u).toFixed(3)})`); gr.addColorStop(clamp((r2+(r3-r2)*u)/ah,0,1),`rgba(0,0,0,${(1-smooth(u)).toFixed(3)})`); }
      o.globalCompositeOperation='destination-in'; o.fillStyle=gr; o.fillRect(0,0,aw,ah); o.globalCompositeOperation='source-over'; }
    DP.ok=true; DP.cfr=DP.fr; DP.ctx=tx; DP.cty=ty; DP.cz=DV.Z; DP.cfull=full; DP.cA=inA; DP.cte=te; DP.cbs=bs; DP.caps++;
  }
  const dx=tx-DP.ctx, dy=ty-DP.cty;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1;
  // 2) toy grade (full): a soft-light pass of the warmed, blurred frame lifts local contrast and colour by day.
  // Only the sharp middle needs it: the bands drawn next cover the rest with blur
  if(full){
    const dl=inA?0.5:daylight(), rk=inA?0:G.rainK, ko=(cave?0:(inA?0.14:0.36*dl*(1-0.5*rk)))*(LOOK.sb?0.55:1);
    if(ko>0.02&&!DSKIP.orton&&!DV.lite){ const y0=Math.floor(te*s*0.3), y1=Math.ceil(bs*s+(ch-bs*s)*0.75); ctx.globalCompositeOperation='soft-light'; ctx.globalAlpha=ko; ctx.drawImage(DP.O,0,y0*k-dy*k,aw,(y1-y0)*k,dx,y0,cw,y1-y0); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; }
  }
  // 3) tilt-shift: the mild level over the whole band, the strong level near the very edges (full)
  const am=DP.am; if(!DSKIP.amc){ am.globalCompositeOperation='copy'; am.drawImage(A,dx*k,dy*k); } if(!DSKIP.mask) dpMask(am,aw,ah,str,te*s*k,bs*s*k,str*(full?0.8:0.72));
  const tA=Math.ceil(te*s*k)+1, bA=Math.floor(bs*s*k)-1;
  if(!DSKIP.bands){ ctx.drawImage(DP.Am,0,0,aw,tA,0,0,cw,tA/k); ctx.drawImage(DP.Am,0,bA,aw,ah-bA,0,bA/k,cw,(ah-bA)/k); }
  if(full&&!DSKIP.strong){
    const bm=DP.bm; bm.globalCompositeOperation='copy'; bm.drawImage(B,dx*kk,dy*kk);
    const te2=Math.min(te*0.55,H*0.2), bs2=Math.max(bs+(H-bs)*0.35,H*0.82);
    dpMask(bm,bw,bh,str*0.85,te2*s*kk,bs2*s*kk,str*0.7);
    const tB=Math.ceil(te2*s*kk)+1, bB=Math.floor(bs2*s*kk)-1;
    ctx.drawImage(DP.Bm,0,0,bw,tB,0,0,cw,tB/kk); ctx.drawImage(DP.Bm,0,bB,bw,bh-bB,0,bB/kk,cw,(bh-bB)/kk);
    // 4) bloom: the strong blur squared (so only bright things glow), added on top at dusk, night and in caves
    const dl=inA?0.5:daylight(), kb=(cave?0.35:inA?0.08+0.25*(1-dl):(1-dl)*0.62)*(LOOK.sb?0.35:1);
    if(kb>0.03&&!DSKIP.bloom&&!DV.lite){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=kb; ctx.drawImage(DP.C,0,0,bw,bh,dx,dy,cw,ch); }
  }
  ctx.restore();
}
// warm, slightly golden daylight, folded into the existing ambient multiply pass so it costs nothing extra
function depthGrade(tint){
  if(!DV.on) return tint;
  // never adds a pass: it only warms the multiply that already runs at dawn, dusk and night (full gets its
  // noon warmth from the toy grade in depthPost instead)
  if(tint[0]>=253&&tint[1]>=253&&tint[2]>=253) return tint;
  const d=daylight(), k=(DV.full?1:0.7)*d;
  return [tint[0],tint[1]*(1-0.03*k),tint[2]*(1-0.085*k)];
}
// bloom halos for lamps and fires (cheap cached sprites); full also gets the screen bloom in depthPost
function depthGlows(list,k){
  if(!DV.on||!list.length||DSKIP.glow) return;
  const m=DV.full&&!DV.lite?0.5:0.9;
  for(const l of list){ if(!l[4]||!inView(l[0],l[1],l[2]*0.3)) continue; glowAt(l[0],l[1],l[2]*0.28,'255,190,110',0.36*k*m); glowAt(l[0],l[1],l[2]*0.08,'255,236,190',0.55*k*m); }
}
// ---------- settings row (injected into the Settings panel so body.html stays untouched)
function depthSyncRow(){ for(const b of document.querySelectorAll('#setDepth button')) b.setAttribute('aria-pressed',String(b.dataset.v===DEPTH.mode)); }
function depthRow(){
  try{
    if(document.getElementById('setDepth')) return;
    const panel=document.querySelector('#settings .panel')||document.getElementById('settings'); if(!panel) return;
    const row=document.createElement('div'); row.className='setrow';
    row.innerHTML='<span>3D depth<small>Makes the valley look like a tiny toy world. Light runs better on phones.</small></span><div class="seg" id="setDepth" role="group" aria-label="3D depth">'+DEPTH_MODES.map(m=>`<button type="button" data-v="${m}" aria-pressed="false">${DEPTH_LABEL[m]}</button>`).join('')+'</div>';
    const done=document.getElementById('bSettingsClose'); let ref=done; while(ref&&ref.parentElement!==panel) ref=ref.parentElement;
    if(ref) panel.insertBefore(row,ref); else panel.appendChild(row);
    for(const b of row.querySelectorAll('button')) b.addEventListener('click',()=>{ try{ SFX.init(); }catch(e){} setDepth(b.dataset.v); try{ SFX.play('ui'); }catch(e){} });
    depthSyncRow();
  }catch(e){}
}
depthRow();
window.__ebX=Object.assign(window.__ebX||{},{setDepth,getDepth,depthAuto(on){ GOV.off=!on; GOV.lvl=0; GOV.n=GOV.slow=0; return !GOV.off; },depthStats(){ return {mode:DEPTH.mode,auto:GOV.off?'off':GOV.lvl,shadowRedraws:SHL.redraws,shadowUpscales:SHL.ups,captures:DP.caps,frames:DP.fr}; }});
window.__ebDbg=Object.assign(window.__ebDbg||{},{render:()=>render(),DV,DSKIP,SHL,DP,DEPTH,depthPost});
