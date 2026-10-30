// ================= (v12 wave 11) ART45: Acts IV and V outdoors in the Realistic look
// Moonfall (map 3) and Nightfall Peak (map 4): their structures, the ascent's puzzle pieces, the story place looks of
// Acts IV and V and the prop kinds PROPS left relit only. Only LOOK.re reaches anything here; Storybook and Classic
// draw exactly as before. Everything is hung on from this module (the act files keep their code): the act files'
// sprite caches (m3wTall, m3wSpr, n4Spr, n4aSpr, the p4 sbSprite keys and the story looks) are wrapped so that in
// this look a sprite is either painted by a Realistic maker of its own (same size and anchor, so every collision,
// depth sort and live glow drawn on top stays where it was) or the Classic art relit as relief under the fixed art
// light (rzRelight, e12c_props.js). Prop kinds get makers in RZK; crystals carry light entries of kind 'crystal'.
// Caches are rzCache entries (keyed by LOOK.gen), so a look change throws them away.

// ---------- 0. small helpers on top of the PROPS painter
const E45={on:()=>LOOK.re&&!LOOK.sb, stats:{made:0,relit:0,ms:0}, deny:/glow|beam|halo|mist|shine|fog|ray|spark/i};
// the Classic art of a cached tall sprite, relit; o: rzRelight options
function e45Relit(w,h,bx,by,draw,o){
  const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), g=cv.getContext('2d'); g.scale(sc,sc); g.translate(bx,by); g.lineCap='round'; g.lineJoin='round';
  const t0=performance.now();
  try{ draw(g); }catch(e){ console.error('e45 art',e); }
  rzRelight(cv,o||{bump:3,ao:0.1,aoR:2,edge:2,sat:0.9}); E45.stats.relit++; E45.stats.rms=(E45.stats.rms||0)+performance.now()-t0;
  cv.ox=bx; cv.oy=by; cv.w2=w; cv.h2=h; return cv;
}
// a sprite from a maker of this module: F=rzHF(w,h,bx,by), make(F,w,h,bx,by), then lit; ox/oy/w2/h2 as the Classic one
// big sprites are painted at 1.5 px per world px (they are cached and only blitted; the cost of lighting grows with
// the pixel count), small ones at the usual 2
function e45HF(w,h,ox,oy,k){ k=k||SS; const W=Math.ceil(w*k), Hp=Math.ceil(h*k), n=W*Hp;
  return {k,W,Hp,n,w,h,ox,oy,h0:new Float32Array(n),a:new Float32Array(n),c:new Float32Array(n*3),m:new Uint8Array(n)}; }
function e45Made(w,h,bx,by,make,o){
  const t0=performance.now(), F=e45HF(w,h,bx,by,w*h>40000?1.5:2); let c;
  try{ const r=make(F,w,h,bx,by); c=r&&r.getContext?r:rzShade(F,o||{ao:0.16,aoR:1.8,rim:0.3}); }catch(e){ console.error('e45 maker',e); c=mkCanvas(2,2); }
  c.ox=bx; c.oy=by; c.w2=w; c.h2=h; E45.stats.made++; E45.stats.ms+=performance.now()-t0; return c;
}
// pick the maker for a key from a table of [regexp, maker] (the first match wins)
function e45Find(T,key){ for(const r of T) if(r[0].test(key)) return r; return null; }

// ---------- 1. the act files' sprite caches in this look
// makers by cache key; filled in by the sections below. A maker entry is [regexp, make(F,w,h,bx,by,key), shadeOpts]
const E45M3=[], E45N4=[], E45N4A=[];
{ const base=m3wTall; m3wTall=function(key,w,h,bx,by,draw,ow,noOut){
  if(!E45.on()) return base.apply(this,arguments);
  const M=e45Find(E45M3,key); if(!M&&E45.deny.test(key)) return base.apply(this,arguments);
  return rzCache('e45m3:'+key,()=>M?e45Made(w,h,bx,by,(F)=>M[1](F,w,h,bx,by,key),M[2]):e45Relit(w,h,bx,by,draw)); }; }
{ const base=m3wSpr; m3wSpr=function(key,R,draw){
  if(!E45.on()) return base.apply(this,arguments);
  return rzCache('e45m3s:'+key,()=>{ const c=spriteOf(R,draw); rzRelight(c,{bump:2.6,ao:0.1,aoR:2,edge:2,sat:0.9}); return c; }); }; }
{ const base=n4Spr; n4Spr=function(key,w,h,ox,oy,draw,ow){
  if(!E45.on()) return base.apply(this,arguments);
  return rzCache('e45n4:'+key,()=>{ const M=e45Find(E45N4,key); return M?e45Made(w,h,ox,oy,(F)=>M[1](F,w,h,ox,oy,key),M[2]):e45Relit(w,h,ox,oy,draw); }); }; }
{ const base=n4aSpr; n4aSpr=function(key,w,h,ox,oy,draw,ow){
  if(!E45.on()) return base.apply(this,arguments);
  return rzCache('e45n4a:'+key,()=>{ const M=e45Find(E45N4A,key); return M?e45Made(w,h,ox,oy,(F)=>M[1](F,w,h,ox,oy,key),M[2]):e45Relit(w,h,ox,oy,draw); }); }; }
// the p4 sprites (Act IV's moon puzzle pieces: switches, chests, gates, stones, braziers) come through sbSprite, which
// always outlines; in this look they are relit instead, with no bold outline
{ const base=sbSprite; sbSprite=function(key,R,draw,w){
  if(!E45.on()||typeof key!=='string'||key.indexOf('p4')!==0) return base.apply(this,arguments);
  return rzCache('e45p4:'+key,()=>{ const c=spriteOf(R,draw); rzRelight(c,{bump:2.6,ao:0.1,aoR:2,edge:2,sat:0.92}); return c; }); }; }
// the story place looks of Acts IV and V (v10_art4a/4b/4s, v10_art5a/5b/5s): no bold outline, relit
const E45LOOK=/^(m4|a4s_|n5|moon_lock_carving|green_fourth_post|hoof$|hat_n5_)/;
{ const base=gtLookSprite; gtLookSprite=function(id,L,state){
  if(!E45.on()||!E45LOOK.test(id)||L.outline===false) return base.apply(this,arguments);   // the soft unoutlined looks stay as painted
  const key=id+'|'+(state==null?'':state);
  return rzCache('e45look:'+key,()=>{ const M=E45LK[id]; return M?M(L,state):e45LookRelit(id,L,state); }); }; }
const E45LK={};
function e45LookRelit(id,L,state){
  const pad=10, W=Math.ceil(L.w*2+pad*2), H=Math.ceil(L.h*2+pad*2), cx=W/2, cy=H/2+L.h*0.25;
  const cv=mkCanvas(W*2,H*2), g=cv.getContext('2d'); g.scale(2,2); g.lineJoin='round'; g.lineCap='round';
  try{ L.draw(g,cx,cy,0,state); }catch(e){ console.error('e45 look',id,e); }
  rzRelight(cv,{bump:2.6,ao:0.1,aoR:2,edge:1.6,sat:0.9});
  // trimmed to what was drawn, as gtLookSprite does (same anchor maths)
  let x0=0,y0=0,x1=cv.width,y1=cv.height;
  try{ const d=g.getImageData(0,0,cv.width,cv.height).data, w=cv.width; x0=1e9; y0=1e9; x1=-1; y1=-1;
    for(let j=0;j<cv.height;j++) for(let i=0;i<w;i++) if(d[(j*w+i)*4+3]>4){ if(i<x0) x0=i; if(i>x1) x1=i; if(j<y0) y0=j; if(j>y1) y1=j; }
    if(x1<0){ x0=y0=0; x1=y1=1; } x0=Math.max(0,x0-2); y0=Math.max(0,y0-2); x1=Math.min(cv.width,x1+3); y1=Math.min(cv.height,y1+3); }catch(e){}
  const c=mkCanvas(x1-x0,y1-y0); c.getContext('2d').drawImage(cv,-x0,-y0);
  c.ox=cx-x0/2; c.oy=cy-y0/2; c.ww=(x1-x0)/2; c.hh=(y1-y0)/2; return c;
}


// ---------- 2. painter primitives for buildings seen from the south at three quarters
// A building is painted by one scene function over its box: for each pixel, scene(x,y,o) finds the front-most part
// there and writes o.z (relief height, world px), o.c (rgb), o.m (material), o.a (coverage, soft at edges) and
// returns true; nothing covered returns false. Tops face the art light (bright), fronts lean toward the viewer
// (a little darker), round things shade from their lit left to their dark right, recesses get occlusion.
const E45O={z:0,c:[0,0,0],m:0,a:1};
function e45Fill(F,x0,y0,x1,y1,scene){
  const k=F.k, W=F.W, o=E45O, I0=Math.max(0,Math.floor((x0+F.ox)*k)), I1=Math.min(W-1,Math.ceil((x1+F.ox)*k)), J0=Math.max(0,Math.floor((y0+F.oy)*k)), J1=Math.min(F.Hp-1,Math.ceil((y1+F.oy)*k));
  for(let j=J0;j<=J1;j++){ const wy=(j+0.5)/k-F.oy; for(let i=I0;i<=I1;i++){ const wx=(i+0.5)/k-F.ox; o.a=1; if(!scene(wx,wy,o)) continue;
    const id=j*W+i, z=o.z*k; F.h0[id]=z>0.05?z:0.05; F.c[id*3]=o.c[0]; F.c[id*3+1]=o.c[1]; F.c[id*3+2]=o.c[2]; F.m[id]=o.m; F.a[id]=o.a>1?1:o.a<0?0:o.a; } }
}
const e45Cov=(d,k)=>d*(k||2)+0.5;                     // coverage from the distance inside an edge (world px)
const e45S=(u)=>u>=1||u<=-1?0:Math.sqrt(1-u*u);        // the round profile across a cylinder
const e45Mul=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
// running bond: the distance to the nearest joint and a hash per block
const E45B={d:0,h:0,r:0,c:0};
function e45Bond(x,y,bw,bh,sd){ const r=Math.floor(y/bh), off=(r&1)*bw*0.5, ci=Math.floor((x+off)/bw), fx=x+off-ci*bw, fy=y-r*bh;
  E45B.d=Math.min(fx,bw-fx,fy,bh-fy); E45B.h=rzHash(ci,r,sd); E45B.r=r; E45B.c=ci; return E45B; }
// pale sea-polished marble with faint grey-blue veins
function e45Marble(x,y,sd,base){ const n=rzFbm(x*0.03,y*0.03,sd,3), v=Math.abs(Math.sin(x*0.045+y*0.017+n*7.5));
  let c=rzMix(base,rzCol(base,-0.07),rzVN(x*0.07,y*0.07,sd+5)); if(v<0.08) c=rzMix(c,[150,156,180],(0.08-v)/0.08*0.5); return c; }
// dressed stone: blocks in a running bond with sunken joints and a colour per block
function e45Stone(o,x,y,bw,bh,sd,base,z,jd,tone){ const B=e45Bond(x,y,bw,bh,sd), j=B.d<(jd||0.7);
  let c=rzCol(base,(B.h-0.5)*(tone||0.12)); c=rzMix(c,rzCol(c,-0.08),rzVN(x*0.25,y*0.25,sd+9));
  o.z=z-(j?0.8:0)+(B.d<1.8?(B.d-1.8)*0.22:0); o.c=j?rzCol(c,-0.17):c; o.m=RZ.ROCK; return B; }
// brass with a little verdigris running down from the seams
function e45Brass(x,y,sd,pat){ let c=rzMix([138,100,50],[200,160,92],rzFbm(x*0.05,y*0.05,sd,3));
  const p=(rzFbm(x*0.11,y*0.012,sd+3,3)-0.45)*2+(pat||0); if(p>0.3) c=rzMix(c,[88,140,122],Math.min(0.85,(p-0.3)*1.4)); return {c,pat:p>0.55}; }

// ---------- 3. Moonfall's great places (x3_world.js M3WK: the same cache keys, sizes and anchors)
// the Mirror Temple: white marble on three steps, a portico of four columns, a pediment with the gold sun and the
// silver moon (the glows on them are x3_world's own), a mirror-glass door and two windows
function e45Temple(F){
  const MB=[236,238,244], TY=[212,216,230], GOLD=[226,178,70], s3=Math.sqrt(3);
  const cols=[-140,-48,48,140];
  rzContact(F,0,50,176,16,0.42);
  e45Fill(F,-180,-240,180,70,(x,y,o)=>{
    // three steps (the front one widest): treads flat, risers falling toward the viewer
    if(y>=31&&y<=52){ const i=Math.min(2,Math.floor((52-y)/7)), hw=170-i*4, ya=52-7*(i+1);
      if(Math.abs(x)<=hw){ const tz=4+i*3; o.a=e45Cov(hw-Math.abs(x)); o.c=e45Marble(x,y,11,rzCol(MB,-0.02*i)); o.m=RZ.BONE;
        if(y<ya+4){ o.z=tz; } else { o.z=tz-(y-ya-4)*1.1; o.c=rzCol(o.c,-0.05); }
        // a sea-worn band of green-grey at the foot
        if(i===0&&y>48) o.c=rzMix(o.c,[150,170,160],0.35);
        return true; } }
    // the columns: fluted shafts, a capital and an abacus, a base
    for(const cx of cols){ const dx=x-cx;
      if(y>=-96&&y<=-88&&Math.abs(dx)<=15){ o.z=34; o.c=e45Marble(x,y,12,MB); o.m=RZ.BONE; o.a=e45Cov(15-Math.abs(dx)); return true; }
      if(y>-88&&y<=-80){ const r=10+(y+80)*-0.45; if(Math.abs(dx)<=r){ const s=e45S(dx/r); o.z=28+7*s; o.c=e45Marble(x,y,13,MB); o.m=RZ.BONE; o.a=e45Cov(r-Math.abs(dx)); return true; } }
      if(y>24&&y<=31&&Math.abs(dx)<=13){ const s=e45S(dx/13); o.z=27+6*s; o.c=e45Marble(x,y,14,MB); o.m=RZ.BONE; o.a=e45Cov(13-Math.abs(dx)); return true; }
      if(y>-80&&y<=24&&Math.abs(dx)<=10){ const u=dx/10, s=e45S(u), fl=0.5+0.5*Math.cos(u*Math.PI*5);
        o.z=24+8*s-(1-fl)*1.1; o.c=rzCol(e45Marble(x,y,15+cx,MB),fl<0.3?-0.08:0); o.m=RZ.BONE; o.a=e45Cov(10-Math.abs(dx));
        if(y>14) o.c=rzMix(o.c,[160,176,170],(y-14)/10*0.3);
        return true; } }
    // the entablature: architrave, a row of dentils, the cornice lip
    if(y>=-106&&y<-88&&Math.abs(x)<=170){ o.a=e45Cov(170-Math.abs(x)); o.m=RZ.BONE;
      if(y<-102){ o.z=36; o.c=e45Marble(x,y,16,MB); }
      else if(y<-96){ const d=((x+400)%9); o.z=d<5.5?32:29; o.c=e45Marble(x,y,16,d<5.5?MB:TY); }
      else { o.z=31-(y+96)*0.15; o.c=e45Marble(x,y,17,rzCol(MB,-0.03)); }
      return true; }
    // the pediment: a raking cornice along both upper edges round a recessed tympanum
    if(y<-106&&y>-210){ const top=-106-100*(1-Math.abs(x)/176); if(y>=top&&Math.abs(x)<=176){ const de=(y-top)/1.15;
      o.a=e45Cov(de); o.m=RZ.BONE;
      if(de<6){ o.z=36-de*0.2; o.c=e45Marble(x,y,18,MB); return true; }
      o.z=20; o.c=e45Marble(x,y,19,TY);
      // the gold sun with its rays
      const sx=x+48, sy=y+130, sr=Math.hypot(sx,sy);
      if(sr<20){ const s=e45S(sr/20); o.z=21+7*s; o.c=rzMix(GOLD,[255,226,140],Math.max(0,-sx-sy)/40); o.m=RZ.METAL; return true; }
      if(sr<33&&sr>23){ const a=Math.atan2(sy,sx), f=Math.abs(((a/(TAU/8))%1+1)%1-0.5); if(f<0.09*(33-sr)/10+0.03){ o.z=22; o.c=rzCol(GOLD,-0.06); o.m=RZ.METAL; return true; } }
      // the silver moon: a crescent of mirror glass
      const mx=x-48, my=y+130, mr=Math.hypot(mx,my);
      if(mr<20){ const inner=Math.hypot((mx-10)/15,(my+6)/17)<1; if(!inner){ const s=e45S(mr/20); o.z=21+6*s; o.c=rzMix([196,210,240],[250,252,255],clamp(0.5-(mx+my)/40,0,1)); o.m=RZ.WET; return true; } o.z=19; o.c=rzCol(TY,-0.06); return true; }
      return true; } }
    // the cella wall behind the portico, in the shade of the roof
    if(Math.abs(x)<=150&&y>=-88&&y<=34){
      // the door: a moulded marble frame round a door of dark mirror glass
      const dy=y-0, inArch=(x*x+(Math.min(0,dy))*(Math.min(0,dy))), dr=Math.sqrt(inArch);
      const doorD=y>=0?Math.min(34-Math.abs(x),34-y):34-dr;
      if(doorD>-5&&y<=34){ if(doorD<=0){ o.z=16-doorD*0.3; o.c=e45Marble(x,y,20,MB); o.m=RZ.BONE; return true; }
        o.z=9; o.m=RZ.GLOSS; let c=rzMix([30,32,70],[88,104,168],clamp(0.65-(x+34)/68*0.6-(y+34)/68*0.35,0,1));
        if(x>-22&&x<-12) c=rzMix(c,[196,206,240],0.35*(1-Math.abs(x+17)/5));
        if(Math.abs(x)<1.2) c=rzCol(c,-0.4);
        o.c=c; return true; }
      // two windows with pale glass
      for(const sd of [-1,1]){ const wx=x-sd*96; if(Math.abs(wx)<=20&&y>=-64&&y<=-10){ const ed=Math.min(20-Math.abs(wx),Math.min(y+64,-10-y));
        if(ed<4.5){ o.z=17; o.c=e45Marble(x,y,21,MB); o.m=RZ.BONE; return true; }
        o.z=10; o.m=RZ.WET; o.c=rzMix([150,170,214],[224,236,252],clamp(0.6-(wx+16)/32*0.5-(y+60)/48*0.3,0,1)); if(Math.abs(wx)<0.9||Math.abs(y+37)<0.9) o.c=e45Marble(x,y,21,MB); return true; } }
      e45Stone(o,x,y,32,14,22,[214,210,206],12-(y+88)*0.02,0.6,0.06); o.c=e45Marble(x,y,23,o.c); o.m=RZ.BONE; o.a=e45Cov(150-Math.abs(x)); return true; }
    return false; });
  return rzShade(F,{ao:0.13,aoR:3,rim:0.22,bump:1,sat:0.95});
}
E45M3.push([/^temple$/,e45Temple,null]);

// the Eclipse Observatory: a drum of violet-grey dressed stone with pilasters, a door of dark oak in a stone portal,
// and a brass dome in riveted gores, weathered green along the seams, its slit open on the night sky
function e45Obs(F){
  const ST=[140,134,152], WD=[78,54,40];
  rzContact(F,0,40,190,24,0.45);
  e45Fill(F,-200,-250,200,90,(x,y,o)=>{
    // the door and its portal (with a board above it for the sign)
    if(Math.abs(x)<=48&&y>=-30&&y<=40){ const ed=Math.min(48-Math.abs(x),y+30);
      if(ed<6){ e45Stone(o,x+400,y,16,10,41,rzCol(ST,0.12),34-ed*0.1,0.6); return true; }
      if(y<-20){ o.z=31; o.c=rzCol(ST,0.05); o.m=RZ.ROCK; return true; }
      const lx=Math.abs(x)-1.5; o.m=RZ.WOOD; o.z=27;
      const pl=((x+60)%9+9)%9; let c=rzMix(WD,rzCol(WD,0.16),rzVN(x*0.3,y*0.04,42)); if(pl<0.8) c=rzCol(c,-0.35);
      if(lx<1.2){ o.z=25; c=rzCol(WD,-0.5); }
      // iron bands with brass studs
      for(const by of [-12,8,28]) if(Math.abs(y-by)<2.2){ o.z=28; c=[58,54,58]; o.m=RZ.METAL; const st=((x+60)%12+12)%12; if(st<2.6&&Math.abs(y-by)<1.4){ o.z=29.5; c=[210,170,90]; } }
      o.c=c; return true; }
    // the drum: a ring of blocks, lit from the left, with pilasters every 40 px
    if(Math.abs(x)<=170&&y>=-30&&y<=40){ const s=e45S(x/170), pil=((x+150)%40+40)%40;
      if(pil<5||pil>37){ const d=pil<5?pil:40-pil; o.z=14+28*s+3; o.c=rzCol(e45Marble(x,y,43,rzCol(ST,0.08)),-d*0.01); o.m=RZ.ROCK; o.a=e45Cov(170-Math.abs(x)); return true; }
      e45Stone(o,x*(0.7+0.3*s),y,22,11,44,ST,14+28*s,0.8,0.14); o.a=e45Cov(170-Math.abs(x));
      if(y>32) o.c=rzMix(o.c,[96,104,96],(y-32)/8*0.35);
      return true; }
    // the sign board at the foot of the slit
    if(Math.abs(x)<=50&&y>=-52&&y<-30){ o.z=172; o.m=RZ.WOOD; const ed=Math.min(50-Math.abs(x),y+52,-30-y); o.c=ed<2?[150,112,52]:rzMix([44,30,26],[66,46,36],rzVN(x*0.2,y*0.5,45)); if(ed<2) o.m=RZ.METAL; return true; }
    // the dome
    if(y<-30){ const yy=(y+30)/206, q=(x/160)*(x/160)+yy*yy; if(q<1){
      const lat=Math.sqrt(Math.max(0.0001,1-yy*yy)), u=clamp(x/(160*lat),-1,1), lon=Math.asin(u), sd=e45S(Math.sqrt(q));
      o.z=34+128*sd; o.a=e45Cov((1-Math.sqrt(q))*160); o.m=RZ.METAL;
      // the slit, its brass jambs, the stars in it
      const hw=15*Math.sqrt(Math.max(0,1-((y+30)/212)*((y+30)/212)))+1.5;
      if(Math.abs(x)<hw+2.5&&y>-234){ if(Math.abs(x)>=hw){ o.z+=2; o.c=[120,84,36]; return true; }
        o.z-=6; o.m=RZ.EMIT; const st=rzHash(Math.floor(x*1.5),Math.floor(y*1.5),46); o.c=st>0.985?[232,226,255]:st>0.97?[150,140,200]:rzMix([14,10,30],[30,22,58],(y+234)/200); return true; }
      // gores with seams and rivets, a ring of rivets two thirds up, verdigris running down from the seams
      const g=lon/(Math.PI/12)+0.5, gf=g-Math.floor(g), gd=Math.abs(gf-0.5)*(Math.PI/12)*160*lat;
      const B=e45Brass(x,y,47,gd<5?0.25:0);
      let c=rzMix(B.c,rzCol(B.c,0.1),rzHash(Math.floor(g),3,47)*0.6);
      const ring=Math.abs(y+150)<1.6;
      if(gd<1.1){ o.z-=1.4; c=rzCol(c,-0.35); o.m=B.pat?RZ.ROCK:RZ.METAL; }
      else if(gd<2.6&&(((y+400)%9)<1.8)){ o.z+=1; c=rzCol(c,0.12); }
      else if(ring){ o.z+=0.8; c=rzCol(c,-0.18); }
      if(B.pat&&gd>=1.1) o.m=RZ.ROCK;
      o.c=c; return true; } }
    return false; });
  const c=rzShade(F,{ao:0.14,aoR:3,rim:0.25,bump:1,sat:0.95});
  // the sign is painted on its board after the light (letters stay crisp)
  const g=c.getContext('2d'); g.save(); g.scale(F.k,F.k); g.translate(F.ox,F.oy); g.fillStyle='rgba(236,226,196,.92)'; g.font=`800 9px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('EYE ON THE MOON',0,-41); g.restore();
  return c;
}
E45M3.push([/^obs$/,e45Obs,null]);

// the Moon Well on its islet: a slim tower of pale sea-polished stone, arched windows of moon glass, a corbelled crown
// carrying the basin of moonlight, a round stone basin at its foot
function e45Well(F){
  const ST=[226,224,232];
  rzContact(F,0,6,36,11,0.45);
  e45Fill(F,-60,-232,60,18,(x,y,o)=>{
    // the basin at the foot: a stone rim round dark water
    { const q=Math.hypot(x/32,(y+4)/10); if(q<1&&y>-14){ const r=q*32; o.a=e45Cov(32-r);
      if(q>0.78||y>-1){ o.z=6+3*e45S((q-0.89)/0.11); o.c=e45Marble(x,y,51,rzCol(ST,-0.08)); o.m=RZ.BONE; if(y>2) o.c=rzMix(o.c,[150,170,162],0.35); return true; }
      o.z=3; o.c=rzMix([46,70,110],[120,150,200],clamp(0.5-x/40,0,1)); o.m=RZ.WET; return true; } }
    // the tower body, tapered, in courses of stone, with four arched windows
    if(y>=-152&&y<=-6){ const t=(y+152)/146, hw=12+6*t; if(Math.abs(x)<=hw){ const u=x/hw, s=e45S(u);
      o.a=e45Cov(hw-Math.abs(x));
      for(let i=0;i<4;i++){ const wy=-34-i*30, dx=Math.abs(x), dyw=y-wy; if(dx<=6.5&&dyw<=0&&dyw>=-12){ const top=dyw<-8.5?Math.hypot(x,dyw+8.5)>6.5:false; if(!top){
        if(dx>5||dyw>-1.2){ o.z=10+6*s; o.c=rzCol(ST,0.06); o.m=RZ.BONE; return true; }
        o.z=7+5*s; o.m=RZ.WET; o.c=rzMix([96,122,196],[214,228,255],clamp(0.55-x/12-(dyw+12)/24,0,1)); return true; } } }
      e45Stone(o,u*20,y,9,8,52,ST,8+8*s,0.55,0.1); o.c=e45Marble(x,y,53,o.c); o.m=RZ.BONE;
      if(y>-26) o.c=rzMix(o.c,[160,176,170],(y+26)/20*0.3);
      return true; } }
    // the crown: corbels, a band, and the bowl of moonlight on top
    if(y<-152&&y>=-171&&Math.abs(x)<=27){ const u=x/27, s=e45S(u);
      if(y>-158){ const cb=((x+60)%7+7)%7; if(cb<4.5){ o.z=17+5*s; o.c=e45Marble(x,y,54,ST); o.m=RZ.BONE; o.a=e45Cov(27-Math.abs(x)); return true; } if(Math.abs(x)<=15){ o.z=12+5*s; o.c=rzCol(ST,-0.3); o.m=RZ.BONE; return true; } return false; }
      const q=Math.hypot(x/26,(y+163)/8);
      if(q<1){ if(q<0.84&&y<-160.5){ o.z=19; o.m=RZ.WET; o.c=rzMix([150,166,226],[236,242,255],clamp(0.6-x/30,0,1)); return true; }
        o.z=20+3*e45S((q-0.92)/0.08); o.c=e45Marble(x,y,55,rzCol(ST,0.04)); o.m=RZ.BONE; o.a=e45Cov((1-q)*26); return true; }
      if(y>-163&&Math.abs(x)<=26){ o.z=19+4*s; o.c=e45Marble(x,y,56,rzCol(ST,-0.04)); o.m=RZ.BONE; o.a=e45Cov(26-Math.abs(x)); return true; } }
    return false; });
  return rzShade(F,{ao:0.14,aoR:2,rim:0.25,bump:1,sat:0.95});
}
E45M3.push([/^well$/,e45Well,null]);

// the Lumen Spire's top: a tapered marble tower in courses, three portholes in brass rims with moon glass, a gallery
// band and the glass lantern dome with a gold crescent on its rod
function e45Spire(F){
  const ST=[232,232,240];
  e45Fill(F,-100,-330,100,50,(x,y,o)=>{
    // the gold rod and crescent
    if(y<-316&&y>-346){ if(Math.abs(x)<1.4&&y>-338){ o.z=60; o.c=[214,170,80]; o.m=RZ.METAL; return true; }
      const d=Math.hypot(x-4,y+338); if(d<5.2&&Math.hypot(x-6.4,y+339.4)>3.6){ o.z=60+2*e45S(d/5.2); o.c=[236,196,96]; o.m=RZ.METAL; return true; } }
    // the lantern dome of glass
    if(y<=-266&&y>-332){ const q=Math.hypot(x/32,(y+268)/62); if(q<1){ const s=e45S(q); o.z=36+22*s; o.a=e45Cov((1-q)*32); o.m=RZ.WET;
      const rib=Math.abs(((Math.asin(clamp(x/(32*Math.sqrt(Math.max(0.01,1-((y+268)/62)**2))),-1,1))/(Math.PI/6)+0.5)%1+1)%1-0.5);
      if(rib<0.06){ o.c=[176,140,70]; o.m=RZ.METAL; o.z+=0.8; return true; }
      o.c=rzMix([150,176,226],[236,244,255],clamp(0.6-x/40-(y+300)/90,0,1)); return true; } }
    // the gallery band
    if(y>-274&&y<=-258&&Math.abs(x)<=37){ o.z=40-(y+274)*0.1; o.c=e45Marble(x,y,61,rzCol(ST,-0.04)); o.m=RZ.BONE; o.a=e45Cov(37-Math.abs(x));
      if(y>-262){ const bl=((x+60)%6+6)%6; if(bl<2.5){ o.z-=2; o.c=rzCol(o.c,-0.25); } } return true; }
    // the tower
    if(y>-258&&y<=-128){ const t=(y+258)/130, hw=30+16*t; if(Math.abs(x)<=hw){ const u=x/hw, s=e45S(u);
      o.a=e45Cov(hw-Math.abs(x));
      for(let i=0;i<3;i++){ const wy=-150-i*40, d=Math.hypot(x,y-wy); if(d<9.5){ if(d>6.6){ o.z=26+10*s+2*e45S((d-8)/1.5); o.c=[192,150,74]; o.m=RZ.METAL; return true; }
        o.z=20+8*s; o.m=RZ.WET; o.c=rzMix([70,104,180],[210,226,255],clamp(0.55-(x+y-wy)/14,0,1)); return true; } }
      e45Stone(o,u*44,y,12,10,62,ST,14+18*s,0.6,0.08); o.c=e45Marble(x,y,63,o.c); o.m=RZ.BONE; return true; } }
    return false; });
  return rzShade(F,{ao:0.13,aoR:2,rim:0.22,bump:1,sat:0.95});
}
E45M3.push([/^spire$/,e45Spire,null]);

// the Gull Isle lighthouse's lamp room: an iron gallery rail, glazing with the lamp inside, a red cone of painted
// iron with standing seams, a brass ball on top (lhcap is the cap the people module's great lamp sits under)
function e45LH(F,w,h,bx,by,key){
  const cap=key==='lhcap', RED=[176,58,46];
  e45Fill(F,-55,-70,55,40,(x,y,o)=>{
    if(Math.hypot(x,y+(cap?92:86))<4.4){ o.z=40+3*e45S(Math.hypot(x,y+(cap?92:86))/4.4); o.c=[214,170,84]; o.m=RZ.METAL; return true; }
    const ry=cap?-62:-56, ay=cap?-90:-84;
    if(y>=ay&&y<=ry){ const hw=30*(y-ay)/(ry-ay); if(Math.abs(x)<=hw){ const u=x/Math.max(1,hw), s=e45S(u), sm=Math.abs(((u*4+0.5)%1+1)%1-0.5);
      o.z=26+10*s+(ry-y)*0.4; o.m=RZ.METAL; o.c=rzMix(rzCol(RED,-0.12),rzCol(RED,0.1),rzVN(x*0.2,y*0.1,71)); if(sm<0.07){ o.z+=1; o.c=rzCol(o.c,0.14); }
      if(rzFbm(x*0.2,y*0.3,72,2)>0.68) o.c=rzMix(o.c,[110,80,70],0.5); o.a=e45Cov(hw-Math.abs(x)); return true; } }
    // the mullions (the cap keeps only the two posts) and the glazing
    if(y>ry&&y<=-20){ if(cap){ for(const sx of [-26,26]) if(Math.abs(x-sx)<2.2){ o.z=24; o.c=[44,44,52]; o.m=RZ.METAL; return true; } return false; }
      if(Math.abs(x)<=24){ const mu=((x+24)%12+12)%12; if(mu<1.6||Math.abs(x)>22.5||y>-22){ o.z=24; o.c=[44,46,54]; o.m=RZ.METAL; return true; }
        o.z=18; o.m=RZ.WET; o.c=rzMix([150,168,206],[226,236,252],clamp(0.6-(x+24)/48*0.6,0,1)); return true; } }
    // the gallery: a rail of iron bars over a deck of iron plates
    if(y>-20&&y<=4&&Math.abs(x)<=36){ if(y>-6){ o.z=14-(y+6)*0.4; o.c=rzMix([52,54,62],[74,76,86],rzVN(x*0.1,1,73)); o.m=RZ.METAL; if(y>-4&&y<-2.6) o.c=[96,98,110]; return true; }
      if(y<-16||((x+60)%10+10)%10<1.8){ o.z=16; o.c=[80,82,94]; o.m=RZ.METAL; return true; } }
    return false; });
  return rzShade(F,{ao:0.12,aoR:1.6,rim:0.25,bump:1,sat:0.95});
}
E45M3.push([/^lh(cap|room)$/,e45LH,null]);

// ---------- 5. crystals, glass and coral
// a crystal cluster: pointed prisms standing out of the ground, two planar faces each (the left one toward the art
// light), a lit ridge, glossy facets, a core of inner light; o: R, n, pal [deep, mid, light], core (rgb, emissive),
// spread (radians), len [min,max] (x R), w [min,max] (x R), lean, base (the rock or sand they grow from), alpha
function e45Crys(F,rng,o){
  const R=o.R, n=o.n||5, P=o.pal, list=[];
  for(let i=0;i<n;i++){ const a=-Math.PI/2+(rng()-0.5)*(o.spread||1.5)+(o.lean||0), L=R*((o.len||[0.5,1])[0]+rng()*((o.len||[0.5,1])[1]-(o.len||[0.5,1])[0])), w=R*((o.w||[0.14,0.22])[0]+rng()*((o.w||[0.14,0.22])[1]-(o.w||[0.14,0.22])[0]));
    const bx=(rng()-0.5)*R*(o.bw||0.7), by=(o.by||0.3)*R+(rng()-0.5)*R*0.16; list.push({a,L,w,bx,by}); }
  list.sort((p,q)=>(q.L-p.L)); list.sort((p,q)=>p.by-q.by);   // the long ones first, the near ones on top
  const zc={v:0}; let zo=0;
  for(const c of list){ zo+=0.6; const ca=Math.cos(c.a), sa=Math.sin(c.a), px=-sa, py=ca, tx=c.bx+ca*c.L, ty=c.by+sa*c.L, sh=c.L*0.2;
    // the prism's outline: two base corners, two shoulders, the tip
    const pts=[[c.bx+px*c.w,c.by+py*c.w],[c.bx+px*c.w+ca*(c.L-sh),c.by+py*c.w+sa*(c.L-sh)],[tx,ty],[c.bx-px*c.w+ca*(c.L-sh),c.by-py*c.w+sa*(c.L-sh)],[c.bx-px*c.w,c.by-py*c.w]];
    const base=o.dark?rzJit(P[0],rng,0.1):rzJit(P[1],rng,0.12), zb=2+zo;
    rzPoly(F,pts,(x,y)=>{ const al=((x-c.bx)*ca+(y-c.by)*sa)/c.L, ac=(x-c.bx)*px+(y-c.by)*py, tw=al>1-sh/c.L?c.w*(1-al)/(sh/c.L):c.w, d=Math.abs(ac)/Math.max(0.3,tw);
      return zb+al*c.L*0.55+(1-d)*c.w*1.1; },(x,y)=>{
      const al=((x-c.bx)*ca+(y-c.by)*sa)/c.L, ac=(x-c.bx)*px+(y-c.by)*py, tw=al>1-sh/c.L?c.w*(1-al)/(sh/c.L):c.w, d=ac/Math.max(0.3,tw);
      let col=d<0?rzMix(base,P[2],0.25+0.35*(1+d)):rzMix(base,P[0],0.25+0.4*d);   // the lit face and the shaded face
      if(Math.abs(d)<0.12) col=rzMix(col,P[2],0.7);                                    // the ridge
      if(o.core&&Math.abs(d)<0.34&&al<0.8) col=rzMix(col,o.core,(1-Math.abs(d)/0.34)*(0.85-al)*(o.coreK||0.9));
      return col; },o.mat||RZ.GLOSS);
    if(o.core){ // the inner light along the core, emissive so it shows at night
      const n2=Math.max(3,Math.round(c.L/2)); for(let k=0;k<n2;k++){ const t=k/n2*0.62; rzDome(F,c.bx+ca*c.L*t,c.by+sa*c.L*t,c.w*0.28,c.w*0.28,0,zb+t*c.L*0.55+c.w*1.2,0.1,rzMix(o.core,[255,255,255],0.2),RZ.EMIT); } }
  }
  return list;
}
function e45CrysSpr(seed,R,o){ const rng=mulberry32(seed), F=rzSq(R);
  rzContact(F,0,R*0.3,R*0.7,R*0.36,0.4);
  if(o.rock) for(let i=0;i<5;i++){ const a=rng()*TAU, d=R*0.3*Math.sqrt(rng()); rzDome(F,Math.cos(a)*d*1.4,R*0.32+Math.sin(a)*d*0.5,R*(0.1+rng()*0.08),R*(0.08+rng()*0.06),rng()*3,0.3,R*0.1,rzJit(o.rock,rng,0.2),RZ.ROCK); }
  e45Crys(F,rng,o);
  return rzShade(F,{ao:0.12,aoR:1.2,rim:0.2,bump:1.3,sat:1});
}
// moonglass (Moonfall's crystals): pale violet or sea blue with a silver core
const E45PAL={moonV:[[70,58,130],[132,116,200],[226,220,255]],moonB:[[46,96,128],[110,178,206],[226,248,255]],
  night:[[18,12,30],[46,36,74],[178,160,240]],ice:[[30,60,104],[90,150,200],[220,244,255]],salt:[[150,142,180],[214,208,232],[252,250,255]],
  coralP:[[150,62,82],[204,104,124],[244,170,176]],coralO:[[160,82,40],[212,128,70],[246,186,120]],coralV:[[86,62,124],[132,100,172],[196,170,226]],
  coralY:[[150,124,60],[196,168,96],[232,214,150]]};
RZK.m_crystal={n:3,make:(s,v)=>e45CrysSpr(s,17,{R:17,n:5,pal:v===1?E45PAL.moonB:E45PAL.moonV,core:v===1?[200,244,255]:[214,200,255],rock:[118,112,136],len:[0.6,1.25],w:[0.18,0.28]})};
RZK.pm_crystal={n:3,make:(s,v)=>e45CrysSpr(s,16,{R:16,n:4,pal:E45PAL.moonV,core:[214,200,255],rock:[120,114,132],len:[0.6,1.2],w:[0.18,0.28]})};
RZK.m_saltpillar={n:3,make:(s,v)=>e45CrysSpr(s,18,{R:18,n:2+v+1,pal:E45PAL.salt,mat:RZ.BONE,spread:0.8,len:[0.6,1.2],w:[0.2,0.3],rock:[200,196,210]})};
RZK.n_shard={n:4,make:(s,v)=>e45CrysSpr(s,20,{R:20,n:3+(s%3),pal:E45PAL.night,dark:1,spread:1.1,len:[0.6,1.35],w:[0.14,0.26],core:v%2?[150,110,255]:null,coreK:0.5})};
RZK.n_icefang={n:3,make:(s,v)=>e45CrysSpr(s,20,{R:20,n:3,pal:E45PAL.ice,mat:RZ.WET,spread:0.7,len:[0.7,1.3],w:[0.16,0.26],core:[190,236,255],coreK:0.4})};
// the light the crystals give (kind 'crystal'): one entry per crystal prop near Ash, kept in step every 1.5 s
const E45CK={m_crystal:[90,0.42],pm_crystal:[80,0.4],n_shard:[70,0.22],n_glasscoral:[60,0.22]}, E45CL={list:[],key:''};
function e45CrysSync(force){
  const on=LOOK.re&&!!G&&!AREA&&typeof curMap==='function';
  if(!on||force){ if(E45CL.list.length){ for(let i=LIGHTS.length-1;i>=0;i--) if(LIGHTS[i].e45) LIGHTS.splice(i,1); E45CL.list.length=0; } E45CL.key=''; if(!on) return; }
  const m=curMap(); if(m!==3&&m!==4) return;
  const cx=Math.floor(player.x/700), cy=Math.floor(player.y/700), key=m+':'+cx+':'+cy; if(key===E45CL.key) return; E45CL.key=key;
  for(let i=LIGHTS.length-1;i>=0;i--) if(LIGHTS[i].e45) LIGHTS.splice(i,1); E45CL.list.length=0;
  const add=(x,y,k,s)=>{ if(E45CL.list.length>=160) return; const C=E45CK[k]; if(!C||Math.abs(x-player.x)>1800||Math.abs(y-player.y)>1400) return; const L={x,y:y-6*(s||1),r:C[0]*(s||1),i:C[1],kind:'crystal',e45:1}; LIGHTS.push(L); E45CL.list.push(L); };
  try{ for(const arr of PROPS.values()) for(const p of arr) if(E45CK[p.k]) add(p.x,p.y,p.k,p.s); }catch(e){}
  try{ if(m===3) for(const o of M3WD.objs) if(o.k==='prop'&&E45CK[o.pk]) add(o.x,o.y,o.pk,o.s); }catch(e){}
}
{ const base=reGroundFrame; reGroundFrame=function(vis,t){ base(vis,t); if(LOOK.re||E45CL.list.length){ try{ e45CrysSync(false); }catch(e){} } }; }

// glass: the Glass Dunes' great spikes (gsp0..2) and the small spikes and cacti; Moonfall glass is clear and pale,
// so the faces are light with a bright ridge and a sharp glint
function e45GSpike(F,w,h,bx,by,key){
  const v=+key.slice(3)||0, rng=mulberry32(91+v*13), P=v%3===2?E45PAL.moonV:E45PAL.moonB;
  rzContact(F,0,4,36,9,0.4);
  e45Crys(F,rng,{R:100,n:5,pal:P,spread:0.5,len:[0.6,1.3],w:[0.08,0.12],bw:0.5,by:0.04,mat:RZ.WET});
  return rzShade(F,{ao:0.1,aoR:1.4,rim:0.18,bump:1.2,sat:1});
}
E45M3.push([/^gsp\d$/,e45GSpike,null]);
RZK.m_glassspike={trunk:'glass',roots:false,tw:10,n:3,make:(s,v)=>e45CrysSpr(s,28,{R:28,n:4+v,pal:v===1?E45PAL.moonV:E45PAL.moonB,mat:RZ.WET,spread:0.7,len:[0.7,1.5],w:[0.12,0.2],by:0.28})};
RZK.m_glasscactus={n:3,make:(s,v)=>{ const rng=mulberry32(s), R=20, F=rzSq(R), P=v===2?E45PAL.moonV:E45PAL.moonB; rzContact(F,0,8,11,5,0.35);
  const arm=(x0,y0,x1,y1,r)=>rzCap(F,x0,y0,2+(8-y0)*0.5,x1,y1,2+(8-y1)*0.5,r,r*0.85,rzJit(P[1],rng,0.1),RZ.WET);
  arm(0,8,0,-15,5); arm(0,-1,-9,-6,3); arm(-9,-6,-10,-13,2.6); if(v!==1){ arm(0,2,9,-2,3); arm(9,-2,9,-9,2.4); }
  rzEach(F,(x,y,id)=>{ if(rzHash(Math.floor(x*2),Math.floor(y*2),s)>0.96){ F.c[id*3]=240; F.c[id*3+1]=250; F.c[id*3+2]=255; } });
  return rzShade(F,{ao:0.12,aoR:1.2,rim:0.2,bump:1.2}); }};
RZK.m_driftglass={n:2,make:(s,v)=>{ const R=20, F=rzSq(R), rot=v?0.45:-0.3, rng=mulberry32(s); rzContact(F,0,3,R*0.9,5,0.3);
  rzDome(F,0,0,R*0.88,4.4,rot,0.5,2.4,[150,206,222],RZ.WET,0.6); rzDome(F,-Math.cos(rot)*R*0.25,-Math.sin(rot)*R*0.25-1,R*0.35,2.2,rot,1.8,1.4,[200,236,244],RZ.WET,0.6);
  return rzShade(F,{ao:0.1,aoR:1,rim:0.15,bump:1.2}); }};

// coral: brain coral (a dome with meandering grooves), staghorn (round branches with pale tips), sea fans (a
// fine lattice), tube sponges (rings round dark mouths); colour is real but not neon
function e45CoralBody(F,rng,kind,R,P,x0,y0,z0){
  x0=x0||0; y0=y0||0; z0=z0||0;
  if(kind==='brain'){ const sd=Math.floor(rng()*999);
    rzDome(F,x0,y0,R,R*0.82,rng()*TAU,z0,R*0.62,P[1],RZ.CLOTH,0.85);
    rzEach(F,(x,y,id)=>{ const dx=x-x0, dy=y-y0; if(dx*dx/(R*R)+dy*dy/(R*R*0.67)>1.02) return; const g=Math.sin((rzFbm(x*0.12,y*0.12,sd,2)*2+rzVN(x*0.3,y*0.3,sd))*9);
      if(Math.abs(g)<0.32){ F.h0[id]-=0.7*F.k; F.c[id*3]*=0.72; F.c[id*3+1]*=0.72; F.c[id*3+2]*=0.76; } else if(g>0.75){ F.c[id*3]=F.c[id*3]*0.8+P[2][0]*0.2; F.c[id*3+1]=F.c[id*3+1]*0.8+P[2][1]*0.2; F.c[id*3+2]=F.c[id*3+2]*0.8+P[2][2]*0.2; } });
    return; }
  if(kind==='stag'){ const n=6+Math.floor(rng()*3);
    const br=(x,y,z,a,L,r,d)=>{ const x2=x+Math.cos(a)*L, y2=y+Math.sin(a)*L*0.8, z2=z+L*0.45; rzCap(F,x,y,z,x2,y2,z2,r,r*0.8,rzJit(P[1],rng,0.1),RZ.CLOTH);
      if(d>0&&rng()<0.8){ br(x2,y2,z2,a-0.45-rng()*0.3,L*0.62,r*0.75,d-1); br(x2,y2,z2,a+0.4+rng()*0.3,L*0.6,r*0.75,d-1); } else rzDome(F,x2,y2,r*0.95,r*0.95,0,z2,r*0.9,P[2],RZ.CLOTH); };
    for(let i=0;i<n;i++) br(x0,y0,z0,-Math.PI/2+(rng()-0.5)*2.6,R*(0.35+rng()*0.2),R*0.11,2); return; }
  if(kind==='fan'){ const n=11;
    for(let i=0;i<n;i++){ const a=-Math.PI*0.92+i/(n-1)*Math.PI*0.84, L=R*(0.75+rng()*0.25); let x=x0, y=y0+R*0.3, z=z0;
      for(let s2=0;s2<4;s2++){ const a2=a+(rng()-0.5)*0.25, l=L/4, x2=x+Math.cos(a2)*l, y2=y+Math.sin(a2)*l*0.85; rzCap(F,x,y,z+s2*1.2,x2,y2,z+s2*1.2+1.2,0.75,0.6,rzJit(P[1],rng,0.12),RZ.CLOTH); x=x2; y=y2; } }
    for(let k=1;k<4;k++){ const rr=R*0.25*k; for(let i=0;i<14;i++){ const a=-Math.PI*0.92+i/13*Math.PI*0.84, b=a+Math.PI*0.84/13; rzCap(F,x0+Math.cos(a)*rr,y0+R*0.3+Math.sin(a)*rr*0.85,z0+k*1.4,x0+Math.cos(b)*rr,y0+R*0.3+Math.sin(b)*rr*0.85,z0+k*1.4,0.45,0.45,P[0],RZ.CLOTH); } }
    rzCap(F,x0,y0+R*0.36,z0,x0,y0+R*0.2,z0+1,1.4,1.2,P[0],RZ.CLOTH); return; }
  // tube sponges
  const n=3+Math.floor(rng()*3);
  for(let i=0;i<n;i++){ const a=rng()*TAU, d=R*0.35*Math.sqrt(rng()), x=x0+Math.cos(a)*d, y=y0+Math.sin(a)*d*0.8, r=R*(0.2+rng()*0.12), z=z0+r*(1.2+rng());
    rzCap(F,x,y+r*0.6,z0,x,y,z,r,r*0.92,rzJit(P[1],rng,0.1),RZ.CLOTH); rzDome(F,x,y,r*0.55,r*0.5,0,z+0.2,0.1,e45Mul(P[0],0.45),RZ.CLOTH); }
}
const E45CORP=()=>[E45PAL.coralP,E45PAL.coralO,E45PAL.coralV,E45PAL.coralY];
// a coral head for the chunk paints (under water: a little veiled by the water's colour), cached by look generation
function e45CoralHead(i,R,wet){ R=Math.max(4,Math.round(R/3)*3); i=i%12; return rzCache('e45cor:'+i+':'+R+':'+(wet?1:0),()=>{
  const rng=mulberry32(4400+i*31+R), F=rzSq(R,4), kind=['brain','stag','tube','fan','brain','stag'][i%6], P=E45CORP()[Math.floor(i/6)%4];
  rzContact(F,0,R*0.15,R*0.95,R*0.75,0.35); e45CoralBody(F,rng,kind,R*0.9,P,0,0,0.3);
  const c=rzShade(F,{ao:0.14,aoR:1.2,rim:0.25,bump:1.2,sat:0.95});
  if(wet){ const g=c.getContext('2d'); g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(36,118,136,.16)'; g.fillRect(0,0,c.width,c.height); g.globalCompositeOperation='source-over'; }
  return c; }); }
// the Reefwall's crests poking out of the water (reefc0..): a staghorn clump, a brain coral, a fan behind
function e45Reefc(F,w,h,bx,by,key){
  const v=+key.slice(5)||0, rng=mulberry32(33+v*7), P=[E45PAL.coralP,E45PAL.coralO,E45PAL.coralV][v%3];
  rzContact(F,0,4,30,9,0.35);
  e45CoralBody(F,rng,'fan',22,E45PAL.coralV,-6,-24,0.5);
  e45CoralBody(F,rng,'stag',32,P,-2,0,0.5);
  e45CoralBody(F,rng,'brain',9,E45PAL.coralP,14,0,2);
  return rzShade(F,{ao:0.14,aoR:1.4,rim:0.22,bump:1.2,sat:0.95});
}
E45M3.push([/^reefc\d+$/,e45Reefc,null]);
// the coral heads painted into the chunks round Coralcombe and along the Reefwall: the same places and sizes as
// x3_world's, each a lit coral head veiled a little by the water
{ const base=m3wCoralPaint; m3wCoralPaint=function(g){ if(!LOOK.re) return base(g);
  const [cx,cy]=M3WG.coral, rng=mulberry32(4401); g.save();
  for(const [r,a] of [[190,0.28],[150,0.3],[118,0.34]]){ g.fillStyle=`rgba(6,22,40,${a})`; g.beginPath(); g.arc(cx,cy,r,0,TAU); g.fill(); }
  for(let i=0;i<70;i++){ const a=rng()*TAU, d=215+rng()*170, x=cx+Math.cos(a)*d, y=cy+Math.sin(a)*d, r=6+rng()*12, c=e45CoralHead(i%24,r,true);
    g.drawImage(c,x-c.half,y-c.half,c.half*2,c.half*2); }
  g.restore(); }; }
{ const base=m3wReefPaint; m3wReefPaint=function(g,y0,y1){ if(!LOOK.re) return base(g,y0,y1);
  const rng=mulberry32(Math.floor(y0)); g.save();
  for(let y=y0;y<y1;y+=14){ for(let k=0;k<3;k++){ const x=lerp(6110,6340,rng()), yy=y+rng()*14; if(!m3wReefIn(x,yy)) continue; const r=4+rng()*8, ci=Math.floor(rng()*4);
    const c=e45CoralHead(ci*3+(Math.floor(r)%3),r,false); g.drawImage(c,x-c.half,yy-c.half,c.half*2,c.half*2); } }
  g.restore(); }; }
// the reef flat itself (sea biomes' rgb hook, the m3 reef bit): coral rubble and sand in natural tones with patches
// of colour, not a pink carpet
{ const orig=m3wSeaRGB; const wrap=function(c,s,x,y){ if(LOOK.re&&((s.m3|0)&1)){ const n=rzFbm(x*0.012,y*0.012,77,3), n2=rzVN(x*0.05,y*0.05,78), w=Math.sin(x*0.08+Math.sin(y*0.05)*2)*Math.sin(y*0.07);
    let col=rzMix([186,168,132],[150,132,104],n2); if(n>0.58) col=rzMix(col,[188,120,118],(n-0.58)*1.6); else if(n<0.36) col=rzMix(col,[118,124,96],(0.36-n)*1.8); if(w>0.55) col=rzMix(col,[214,176,138],(w-0.55)*0.8); return col; }
    return orig(c,s,x,y); };
  m3wSeaRGB=wrap; try{ for(const b in BIOMES){ const B=BIOMES[b]; if(B&&B.rgb===orig) B.rgb=wrap; } }catch(e){} }

// ---------- 6. the other prop kinds of Moonfall and the Peak, and Moonfall's lamps
// a lamp on a post (v 0: Sable's brass and glass, 1: a driftwood post with a paper lantern, 2: moon marble); the
// world origin is the post's foot. Lit glass is emissive (x3_world draws the glow round it).
function e45LampPaint(F,lit,v){
  const post=v===1?[132,98,62]:v===2?[218,216,228]:[168,124,52], mt=v===1?RZ.WOOD:v===2?RZ.BONE:RZ.METAL;
  rzContact(F,0,1,6,2.6,0.4);
  rzDome(F,0,0,5,2.4,0,0.2,1.6,v===2?[160,156,176]:[96,80,52],mt);
  rzCap(F,0,0,1.5,0,-28,15,1.9,1.6,post,mt,v===1?rzBarkTex(5,3,1):null);
  if(v===1){ rzCap(F,-6,-34,17,7,-34,17,1.3,1.1,post,RZ.WOOD); rzCap(F,6,-34,17,6,-31,16,0.3,0.3,[90,70,50],RZ.CLOTH);
    rzDome(F,6,-29,5,6.5,0,13,4.5,lit?[255,212,128]:[214,160,88],lit?RZ.EMIT:RZ.CLOTH,0.9);
    if(!lit) rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.CLOTH&&Math.abs(((y+29)%3+3)%3)<0.5&&Math.hypot(x-6,(y+29)/1.3)<5) F.c[id*3]*=0.8; });
    return; }
  const fr=v===2?[204,202,220]:[150,108,40];
  rzBox(F,0,-33.5,11,11,0,17,0.8,fr,mt);
  rzBox(F,0,-33.5,7.6,8.6,0,17.6,0.6,lit?(v===2?[232,240,255]:[255,238,176]):[120,160,176],lit?RZ.EMIT:RZ.WET);
  rzBox(F,0,-40,13,2.8,0,18.5,0.8,fr,mt); rzDome(F,0,-42,4.6,2.6,0,18.5,2.6,fr,mt); rzDome(F,0,-45.4,1.2,1.2,0,20,1,fr,mt);
}
E45M3.push([/^lamp[0-2][01]$/,(F,w,h,bx,by,key)=>{ e45LampPaint(F,key[5]==='1',+key[4]); return rzShade(F,{ao:0.1,aoR:1,rim:0.25,bump:1.2}); },null]);
RZK.m_lamppost={trunk:'iron',roots:false,tw:5,n:2,make:(s,v)=>{ const F=rzSq(30); e45LampPaint(F,false,v); return rzShade(F,{ao:0.1,aoR:1,rim:0.25,bump:1.2}); }};
// broken columns of moon marble, fluted, with sea stains at the foot and a chip of moon mosaic
RZK.m_column={n:3,make:(s,v)=>{ const rng=mulberry32(s), F=rzSq(20), h=v===2?6:12+v*6, MB=[226,226,236];
  rzContact(F,0,7,14,6,0.4);
  rzCap(F,0,6,0.5,0,6-h,1+h*0.8,10,9.6,MB,RZ.BONE,(t,u)=>{ const fl=0.5+0.5*Math.cos(u*Math.PI*5); return (0.9+fl*0.12)*(t<0.25?0.92+t*0.3:1); });
  const ty=6-h, zt=1+h*0.8+9; rzDome(F,0,ty,10,4.4,0,zt,1.2,rzCol(MB,0.04),RZ.BONE,0.5);
  rzEach(F,(x,y,id)=>{ const top=Math.hypot(x/10,(y-ty)/4.4)<1&&F.h0[id]>=(zt-0.5)*F.k; if(top){ const n=rzFbm(x*0.5,y*0.5,s,2); F.h0[id]+=(n-0.5)*2.4*F.k; if(n<0.4){ F.c[id*3]*=0.86; F.c[id*3+1]*=0.86; F.c[id*3+2]*=0.9; } }
    else if(y>ty+h*0.55){ const k=(y-ty-h*0.55)/(h*0.45); F.c[id*3]=F.c[id*3]*(1-0.25*k)+150*0.25*k; F.c[id*3+1]=F.c[id*3+1]*(1-0.25*k)+172*0.25*k; F.c[id*3+2]=F.c[id*3+2]*(1-0.25*k)+164*0.25*k; } });
  rzDome(F,-3,ty+h*0.5,2.2,2.2,0,12+h*0.4,1,[150,180,232],RZ.WET);
  if(v===2) rzCap(F,8,4,4,19,0,4,4.4,4.2,rzCol(MB,-0.04),RZ.BONE,(t,u)=>0.9+0.1*Math.cos(u*Math.PI*5));
  return rzShade(F,{ao:0.14,aoR:1.4,rim:0.25,bump:1.1}); }};
// a striped canvas tent: a cone of eight panels round its pole, the door in shade, a pennant
RZK.m_tent={n:3,make:(s,v)=>{ const F=rzSq(30), cA=[[188,74,56],[60,108,156],[196,148,58]][v%3], cB=[238,228,206], ax=0, ay=-20, n=8;
  rzContact(F,0,8,28,12,0.45);
  for(let i=0;i<n;i++){ const a0=Math.PI*0.02+i/n*Math.PI*0.96, a1=a0+Math.PI*0.96/n, p0=[Math.cos(a0)*28,Math.sin(a0)*14+6], p1=[Math.cos(a1)*28,Math.sin(a1)*14+6];
    rzPoly(F,[[ax,ay],p0,p1],(x,y)=>{ const d=Math.hypot(x-ax,(y-ay)*1.3)/32; return 2+24*Math.max(0,1-d)+Math.sin((Math.atan2(y-ay,x-ax)-a0)/(a1-a0)*Math.PI)*0.8; },(x,y)=>{ const c=i%2?cB:cA; return rzMix(c,rzCol(c,-0.1),rzVN(x*0.4,y*0.4,s)); },RZ.CLOTH); }
  rzPoly(F,[[-4,16],[0,0],[4,16]],2.5,[46,34,34],RZ.CLOTH);
  rzCap(F,0,-20,26,0,-30,30,0.9,0.8,[96,70,44],RZ.WOOD); rzPoly(F,[[0,-30],[9,-27.5],[0,-25]],31,cA,RZ.CLOTH);
  return rzShade(F,{ao:0.14,aoR:1.6,rim:0.25,bump:1}); }};
// a whale's ribs arching out of the sand round its spine, sun-bleached bone
RZK.m_bones={trunk:'bone',roots:false,tw:8,n:2,make:(s,v)=>{ const rng=mulberry32(s), R=56, F=rzSq(R), B=[226,216,196];
  rzContact(F,0,8,R*0.85,12,0.3);
  const curve=(x0,y0,z0,cx,cy,cz,x1,y1,z1,r0,r1)=>{ let px=x0, py=y0, pz=z0; for(let i=1;i<=8;i++){ const t=i/8, u=1-t, x=u*u*x0+2*u*t*cx+t*t*x1, y=u*u*y0+2*u*t*cy+t*t*y1, z=u*u*z0+2*u*t*cz+t*t*z1; rzCap(F,px,py,pz,x,y,z,lerp(r0,r1,t-1/8),lerp(r0,r1,t),rzJit(B,rng,0.06),RZ.BONE); px=x; py=y; pz=z; } };
  curve(-R*0.85,4,2,0,-4,5,R*0.85,6,2,3.6,2.6);
  // each pair of ribs is a tall bow over the spine: rising from the sand in front, its tip curling back down behind
  for(let i=0;i<6;i++){ const x=-R*0.7+i*R*0.28, hh=30-Math.abs(i-2.5)*5, lx=(i-2.5)*1.6; curve(x+lx,10,1,x+lx*2+4,-hh*0.55,hh*1.1,x+lx*0.6-1,-hh*0.62,hh*0.55,2.8,1.3); }
  return rzShade(F,{ao:0.14,aoR:1.6,rim:0.25,bump:1}); }};
// shells: a scallop, a whelk, a starfish
RZK.m_shell={n:3,make:(s,v)=>{ const F=rzSq(8), rng=mulberry32(s); rzContact(F,0,1,6,3.5,0.3);
  if(v===0){ for(let i=0;i<7;i++){ const a=-Math.PI*0.85+i/6*Math.PI*0.7; rzCap(F,0,3,1,Math.cos(a)*5.4,3+Math.sin(a)*6,2.6,1.1,0.9,[236,196,182],RZ.BONE); } rzDome(F,0,3.4,2,1.2,0,1,0.8,[220,170,156],RZ.BONE); }
  else if(v===1){ rzDome(F,0,0,5,3.4,-0.4,0.3,3.2,[236,222,196],RZ.BONE,0.8); rzDome(F,-3,-1.6,2,1.6,-0.4,2.4,1.6,[226,206,176],RZ.BONE);
    rzEach(F,(x,y,id)=>{ const a=Math.atan2(y,x), r=Math.hypot(x,y); if(Math.abs(Math.sin(a*1+r*1.6))<0.18){ F.c[id*3]*=0.82; F.c[id*3+1]*=0.8; F.c[id*3+2]*=0.78; } }); }
  else { for(let i=0;i<5;i++){ const a=-Math.PI/2+i/5*TAU; rzCap(F,0,0,1.6,Math.cos(a)*5.2,Math.sin(a)*5.2,0.8,1.7,0.7,[222,110,70],RZ.CLOTH); } rzDome(F,0,0,2,2,0,1.2,1,[232,130,84],RZ.CLOTH);
    rzEach(F,(x,y,id)=>{ if(rzHash(Math.floor(x*3),Math.floor(y*3),s)>0.8){ F.c[id*3]=246; F.c[id*3+1]=180; F.c[id*3+2]=140; } }); }
  return rzShade(F,{ao:0.12,aoR:0.8,rim:0.25,bump:1.2}); }};
// pale-stemmed mushrooms with sea-blue caps and glowing spots
RZK.m_mushroom={n:3,make:(s,v)=>{ const rng=mulberry32(s), R=11, F=rzSq(R); rzContact(F,0,2,R*0.8,R*0.5,0.3);
  const caps=[]; for(let i=0;i<3+v;i++) caps.push([(rng()-0.5)*R*1.2,(rng()-0.5)*R*0.8,2.4+rng()*2.6]); caps.sort((a,b)=>a[1]-b[1]);
  for(const [x,y,r] of caps){ rzCap(F,x,y+3,0,x,y,2.4,0.8,0.9,[220,228,222],RZ.BONE); rzDome(F,x,y,r,r*0.78,0,2.2,r*0.6,rzJit([56,150,178],rng,0.1),RZ.WET,0.7); }
  rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.WET&&rzVN(x*1.6,y*1.6,s)>0.66){ F.c[id*3]=190; F.c[id*3+1]=246; F.c[id*3+2]=250; F.m[id]=RZ.EMIT; } });
  return rzShade(F,{ao:0.12,aoR:1,rim:0.25}); }};

// the Peak's kinds: black glass, brass and dark chalk under a violet night
const E45GL=[34,26,52], E45GLV=[176,150,240];
RZK.n_glasstree={trunk:'glass',roots:false,tw:9,n:4,make:(s,v)=>{ const rng=mulberry32(s), R=40, F=rzSq(R); rzContact(F,0,8,14,6,0.45);
  const tips=[]; const br=(x,y,z,a,len,w,d)=>{ const x2=x+Math.cos(a)*len, y2=y+Math.sin(a)*len, z2=z+len*0.5; rzCap(F,x,y,z,x2,y2,z2,w*0.5,w*0.38,rzJit(E45GL,rng,0.15),RZ.GLOSS);
    if(d>0){ const n=d>1?2:2+(rng()<0.4?1:0); for(let i=0;i<n;i++) br(x2,y2,z2,a+(i-(n-1)/2)*(0.5+rng()*0.35)+(rng()-0.5)*0.2,len*(0.55+rng()*0.2),w*0.62,d-1); } else tips.push([x2,y2,z2]); };
  br(0,8,1,-Math.PI/2+(rng()-0.5)*0.15,16+rng()*5,7,3);
  for(const [x,y,z] of tips){ rzLeaf(F,x,y-1.5,2.4,1.1,-Math.PI/2+(rng()-0.5),z+0.5,0.2,0.4,rzJit([92,76,150],rng,0.15),RZ.GLOSS); if(rng()<0.7) rzDome(F,x,y,0.9,0.9,0,z+1.4,0.4,E45GLV,RZ.EMIT); }
  return rzShade(F,{ao:0.12,aoR:1.4,rim:0.2,bump:1.2}); }};
RZK.n_cocoon={n:3,make:(s,v)=>{ const rng=mulberry32(s), F=rzSq(16); rzContact(F,1,10,7,3,0.4);
  for(let i=0;i<6;i++){ const t0=i/6, t1=(i+1)/6, q=t=>[(1-t)*(1-t)*0+2*(1-t)*t*-3+t*t*4,(1-t)*(1-t)*10+2*(1-t)*t*-4+t*t*-14]; const a=q(t0), b=q(t1); rzCap(F,a[0],a[1],1+t0*8,b[0],b[1],1+t1*8,1.6-t0*0.6,1.6-t1*0.6,E45GL,RZ.GLOSS); }
  rzDome(F,4,-4,5,8.5,0.15,7,5,[178,170,204],RZ.CLOTH,0.8);
  rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.CLOTH){ const b=Math.sin((y+4)*1.4+x*0.5+rzVN(x,y,s)*2); if(b>0.75){ F.c[id*3]*=0.78; F.c[id*3+1]*=0.76; F.c[id*3+2]*=0.84; F.h0[id]-=0.3*F.k; } } });
  return rzShade(F,{ao:0.14,aoR:1,rim:0.25}); }};
RZK.n_gear={n:2,make:(s,v)=>{ const F=rzSq(22), rng=mulberry32(s); rzContact(F,0,6,20,7,0.4);
  e45Fill(F,-22,-14,22,10,(x,y,o)=>{ const yy=(y-2)/0.62, r=Math.hypot(x,yy), a=Math.atan2(yy,x)+v*0.2, th=Math.cos(a*10)>0.15;
    if(y>6.5&&Math.hypot(x/21,(y-8)/7)<1){ o.z=6; o.m=RZ.GLOSS; o.c=y<8.7?[86,72,130]:rzJit(E45GL,rng,0.1); return true; }
    if(r<6){ o.z=3; o.c=[70,50,26]; o.m=RZ.METAL; return true; }
    if(r<16||(th&&r<20)){ const B=e45Brass(x,y,s,0.1); o.z=4+(r<16?1.5*e45S((r-11)/5):0); o.c=r>16?rzCol(B.c,-0.08):B.c; o.m=B.pat?RZ.ROCK:RZ.METAL; o.a=e45Cov((r<16?16-r:20-r)); return true; }
    return false; });
  return rzShade(F,{ao:0.14,aoR:1.2,rim:0.25,bump:1.2}); }};
RZK.n_clock={n:2,make:(s,v)=>{ const F=rzSq(30), CH=[92,84,120]; rzContact(F,0,14,14,5,0.45);
  e45Fill(F,-14,-31,14,15,(x,y,o)=>{
    if(y>=-20&&y<=14&&Math.abs(x)<=10){ const d=Math.hypot(x,y+8);
      if(d<7.5){ o.z=15; o.m=RZ.BONE; o.c=rzMix([214,206,236],[244,240,252],clamp(0.5-(x+y+8)/16,0,1)); const a=Math.atan2(y+8,x); if(d>6.6) o.c=[50,42,70];
        if((Math.abs(x)<0.8&&y<-8&&y>-14)||(Math.abs(x-0.3*(-(y+8)))<0.7&&y<-8&&y>-12.5)) o.c=[30,24,44]; return true; }
      if(d<9.5&&v){ o.z=14; o.m=RZ.EMIT; o.c=[170,140,250]; return true; }
      e45Stone(o,x,y,7,5,s,CH,12+(10-Math.abs(x))*0.2-(x>0?x*0.2:0),0.45,0.12); return true; }
    if(y<-20&&y>=-31){ const hw=13*(y+31)/11; if(Math.abs(x)<=hw){ o.z=14+(y+31)*0.6-Math.abs(x)*0.3; o.c=rzMix([60,54,84],[84,78,110],rzVN(x*0.5,y*0.5,s)); o.m=RZ.ROCK; return true; } }
    return false; });
  return rzShade(F,{ao:0.14,aoR:1.2,rim:0.25}); }};
RZK.n_mirror={n:2,make:(s,v)=>{ const F=rzSq(20); rzContact(F,0,13,10,4,0.45);
  rzBox(F,0,12.5,14,3,0,2,0.8,[44,36,66],RZ.GLOSS); rzCap(F,0,12,2,0,-2,8,2,1.8,[52,44,78],RZ.GLOSS);
  e45Fill(F,-9,-23,9,3,(x,y,o)=>{ const q=Math.hypot(x/8.5,(y+10)/12.5); if(q>=1) return false; o.a=e45Cov((1-q)*8.5);
    if(q>0.8){ o.z=10+2*e45S((q-0.9)/0.1); o.c=[170,160,206]; o.m=RZ.METAL; return true; }
    o.z=9; o.m=RZ.GLOSS; o.c=rzMix(v?[34,30,74]:[44,40,96],[150,140,220],clamp(0.4-(x+y+10)/26,0,1)); if(Math.abs((x+3)-(y+16)*0.42)<0.9&&y<-4) o.c=[226,220,255]; return true; });
  return rzShade(F,{ao:0.12,aoR:1,rim:0.25,bump:1.1}); }};
RZK.n_glasscoral={n:3,make:(s,v)=>{ const rng=mulberry32(s), F=rzSq(16); rzContact(F,0,7,11,4,0.4);
  const br=(x,y,z,a,l,w,d)=>{ const x2=x+Math.cos(a)*l, y2=y+Math.sin(a)*l, z2=z+l*0.5; rzCap(F,x,y,z,x2,y2,z2,w*0.5,w*0.4,rzJit([72,62,140],rng,0.12),RZ.GLOSS); if(d>0){ br(x2,y2,z2,a-0.5-rng()*0.3,l*0.7,w*0.7,d-1); br(x2,y2,z2,a+0.5+rng()*0.3,l*0.7,w*0.7,d-1); } else rzDome(F,x2,y2,w*0.55,w*0.55,0,z2,w*0.4,[196,180,255],RZ.EMIT); };
  br(0,7,1,-Math.PI/2+(rng()-0.5)*0.4,8,4,2);
  return rzShade(F,{ao:0.12,aoR:1,rim:0.2,bump:1.2}); }};
RZK.n_dawnflower={n:3,make:(s,v)=>{ const rng=mulberry32(s), F=rzSq(7); rzCap(F,0,5,0,0,0,2,0.5,0.45,[90,150,80],RZ.LEAF);
  for(let i=0;i<5;i++){ const a=i/5*TAU+rng(); rzLeaf(F,Math.cos(a)*2.3,Math.sin(a)*2.3-1,2,1.4,a,2.4,Math.cos(a)*0.3,Math.sin(a)*0.3,[250,246,236],RZ.CLOTH); }
  rzDome(F,0,-1,1.3,1.3,0,2.8,0.9,v===1?[250,206,232]:[250,214,92],RZ.CLOTH);
  return rzShade(F,{ao:0.1,aoR:0.6,rim:0.2}); }};

// ---------- 7. Nightfall Peak: the ground, the faceted glass and its cracks, the broken moon
// natural palettes for the Peak's biomes (GROUND's table takes map biomes by id; Nightfall's were only derived):
// dark basalt and chalk with a cold violet cast, rime on blue-black rock, the Crown's moonglass, the ink, the dawn
REB_DEF[40]=['k','#48445a','#555068','#383548','#77708c','#4e4862'];
REB_DEF[41]=['k','#4a3c46','#574852','#3a2e38','#6e5a62','#54444e'];
REB_DEF[42]=['k','#545268','#616076','#444256','#86819c','#5a5872'];
REB_DEF[43]=['i','#3c4c68','#4a5c7c','#2e3c56','#7688a6','#465672',null,null,1];
REB_DEF[44]=['l','#45406c','#524d7c','#37335c','#7a76a2','#5a5690'];
REB_DEF[45]=['l','#635b8e','#6f679c','#544c7e','#a49ec8','#6a5aa0'];
REB_DEF[46]=['k','#120e1e','#171226','#0c0916','#2a2240','#1a1428'];
REB_DEF[47]=['d','#4a4a5a','#56566a','#3e3e4e','#6c6c82','#3c3c52'];
REB_DEF[48]=['k','#6c6a9c','#7876aa','#5e5c8c','#d6dcf2','#4a4a80'];
REB_DEF[49]=['l','#c0a6bc','#ccb4c8','#ac94aa','#e8dae6','#dcc6d6'];
try{ for(let b=40;b<=49;b++) REB[b]=undefined; }catch(e){}
// the glass facets in this look: seams thin and dark, a few facets catching the moon as a soft sheen with a bright
// edge, cracks a dark bed with a fine vein and a gentle glow (the Ember Stair's warm)
{ const base=n4PaintLvl; n4PaintLvl=function(g,x0,y0,x1,y1,ch,L){ if(!LOOK.re) return base(g,x0,y0,x1,y1,ch,L); return e45PaintLvl(g,x0,y0,x1,y1,ch,L); }; }
function e45PaintLvl(g,x0,y0,x1,y1,ch,L){
  if(y0<79800||y0>91000) return;
  const G0=n4ChunkGeo(x0,y0); if(!G0.lvls.has(L)) return;
  const dawn=N4W.dawnK>=0.5; let gl=null; const GL=()=>gl||(gl=n4GlowCtx(ch,x0,y0));
  g.save(); g.lineCap='round'; g.lineJoin='round';
  for(const t of G0.tris){ if(t.lv!==L) continue; const F=N4FT[t.b]||N4FT[41], P=t.P;
    g.beginPath(); g.moveTo(P[0][0],P[0][1]); g.lineTo(P[1][0],P[1][1]); g.lineTo(P[2][0],P[2][1]); g.closePath();
    if(t.sand){ if(t.s>0.75){ g.fillStyle='rgba(200,190,240,.05)'; g.fill(); } continue; }
    // each facet leans its own way: the ones facing the moon (north west) take a pale sheen, those away a little shade
    const tilt=(t.s-0.5)*2;
    if(tilt>0.15){ g.fillStyle=dawn?`rgba(255,244,230,${0.05*tilt})`:`rgba(${F[0]},${0.07*tilt+0.015})`; g.fill(); }
    else if(tilt<-0.25){ g.fillStyle=`rgba(4,2,12,${0.12*-tilt})`; g.fill(); }
    g.strokeStyle=dawn?'rgba(110,90,80,.16)':'rgba(6,4,14,.32)'; g.lineWidth=0.9; g.stroke();
    if(tilt>0.35){ let k=0, best=1e9; for(let e=0;e<3;e++){ const my=(P[e][1]+P[(e+1)%3][1])/2+(P[e][0]+P[(e+1)%3][0])/2*0.5; if(my<best){ best=my; k=e; } }
      g.strokeStyle=dawn?'rgba(255,248,236,.35)':`rgba(${F[0]},${0.16+tilt*0.22})`; g.lineWidth=1; g.beginPath(); g.moveTo(P[k][0],P[k][1]+0.6); g.lineTo(P[(k+1)%3][0],P[(k+1)%3][1]+0.6); g.stroke(); } }
  const mine=G0.cracks.filter(c=>c.lv===L);
  const path=(q,c)=>{ q.beginPath(); c.P.forEach((p,i)=>i?q.lineTo(p[0],p[1]):q.moveTo(p[0],p[1])); if(c.br){ q.moveTo(c.br[0][0],c.br[0][1]); q.lineTo(c.br[1][0],c.br[1][1]); } };
  for(const c of mine){ const F=N4FT[c.b]||N4FT[41]; path(g,c);
    g.strokeStyle=dawn?'rgba(120,80,50,.22)':'rgba(4,2,10,.55)'; g.lineWidth=c.big?3.2:2.2; g.stroke();
    g.strokeStyle=dawn?'rgba(255,226,170,.75)':c.ember?'rgba(255,170,110,.8)':`rgba(${F[4]},.62)`; g.lineWidth=c.big?1.1:0.8; g.stroke();
    const m=c.mk; if(!m) continue;
    if(m.t==='clock'){ g.strokeStyle=dawn?'rgba(120,90,60,.4)':'rgba(70,56,120,.42)'; g.lineWidth=1.1; g.beginPath(); g.arc(m.x,m.y,m.R,0,TAU); g.stroke(); g.beginPath(); g.moveTo(m.x,m.y); g.lineTo(m.x,m.y-m.R*0.8); g.moveTo(m.x,m.y); g.lineTo(m.x+m.R*0.5,m.y-m.R*0.2); g.stroke(); }
    else if(m.t==='frost'){ g.strokeStyle=dawn?'rgba(255,255,255,.5)':'rgba(214,236,255,.42)'; g.lineWidth=0.8; g.beginPath(); for(let s2=0;s2<5;s2++){ const sx=m.x+Math.cos(m.a)*s2*4, sy=m.y+Math.sin(m.a)*s2*4, l=6-s2; g.moveTo(sx,sy); g.lineTo(sx+Math.cos(m.a+0.9)*l,sy+Math.sin(m.a+0.9)*l); g.moveTo(sx,sy); g.lineTo(sx+Math.cos(m.a-0.9)*l,sy+Math.sin(m.a-0.9)*l); } g.moveTo(m.x,m.y); g.lineTo(m.x+Math.cos(m.a)*20,m.y+Math.sin(m.a)*20); g.stroke(); }
    else n4Glint(g,m.x,m.y,m.R*0.8,dawn?'rgba(255,240,210,.7)':'rgba(230,216,255,.7)'); }
  if(mine.length&&!dawn){ const q=GL(); for(const c of mine){ const F=N4FT[c.b]||N4FT[41]; q.strokeStyle=c.ember?'rgba(255,140,70,.5)':`rgba(${F[5]},.3)`; q.lineWidth=c.big?4.5:3; path(q,c); q.stroke(); } }
  g.restore();
}
// the broken moon over the peak: plates of lunar rock (grey highlands, darker seas, little craters) round a hole of
// violet night, lit from the upper left, a soft moonfire glow round the rim; the fragments drifting off it alike
function e45Lunar(W,H,sd){ const c=mkCanvas(W,H), g=c.getContext('2d'), im=g.createImageData(W,H), d=im.data;
  const cr=[]; const rng=mulberry32(sd); for(let i=0;i<90;i++) cr.push([rng()*W,rng()*H,2+Math.pow(rng(),2.2)*14]);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=(y*W+x)*4, m=rzFbm(x*0.012,y*0.012,sd,4), f=rzFbm(x*0.07,y*0.07,sd+5,2);
    let l=0.8+0.1*(f-0.5); if(m<0.46) l-=(0.46-m)*0.9;
    for(const [cx,cy,r] of cr){ const dx=x-cx, dy=y-cy, q=(dx*dx+dy*dy)/(r*r); if(q<1.4){ if(q<0.7) l-=0.08*(1-q/0.7); else if(q<1) l+=0.1*(dx+dy<0?1:-0.6)*(1-Math.abs(q-0.85)/0.15); } }
    d[i]=clamp(l*262,0,255); d[i+1]=clamp(l*262,0,255); d[i+2]=clamp(l*272,0,255); d[i+3]=255; }
  g.putImageData(im,0,0); return c; }
{ const base=n4MoonCv; n4MoonCv=function(){ if(!E45.on()) return base(); return rzCache('e45moon',e45MoonCv); }; }
function e45MoonCv(){
  const S0=512, c=mkCanvas(S0,S0), g=c.getContext('2d'), R=170; g.translate(S0/2,S0/2); g.lineJoin='round'; g.lineCap='round';
  const gl=g.createRadialGradient(0,0,R*0.7,0,0,R*1.42); gl.addColorStop(0,'rgba(160,130,240,.32)'); gl.addColorStop(1,'rgba(110,80,210,0)'); g.fillStyle=gl; g.fillRect(-S0/2,-S0/2,S0,S0);
  const hg=g.createRadialGradient(-R*0.15,-R*0.12,R*0.05,0,0,R*0.9); hg.addColorStop(0,'#3e2670'); hg.addColorStop(0.55,'#1e1040'); hg.addColorStop(1,'#0a0418'); g.fillStyle=hg; g.beginPath(); g.arc(0,0,R*0.9,0,TAU); g.fill();
  const rng=mulberry32(1311); for(let i=0;i<26;i++){ const a=rng()*TAU, d=rng()*R*0.75; g.fillStyle=`rgba(226,220,255,${0.4+0.5*((i*37)%10)/10})`; g.fillRect(Math.cos(a)*d,Math.sin(a)*d,1.2,1.2); }
  // the rim plates: the same broken pieces as x3's look (same random sequence), filled with lunar rock and relit
  const pieces=[[0.25,1.05],[1.25,2.05],[2.6,3.45],[3.62,4.3],[4.95,5.85]], paths=[];
  for(const [a0,a1] of pieces){ const jag=(a,s2)=>{ const p=[]; for(let k=0;k<4;k++){ const r=R*(0.84+k*0.06), aa=a+(rng()-0.5)*0.06*s2; p.push([Math.cos(aa)*r,Math.sin(aa)*r]); } return p; };
    const A=jag(a0,1), B=jag(a1,-1); paths.push(q=>{ q.beginPath(); q.moveTo(A[0][0],A[0][1]); for(const v of A) q.lineTo(v[0],v[1]); q.arc(0,0,R*1.02,a0,a1); for(let k=B.length-1;k>=0;k--) q.lineTo(B[k][0],B[k][1]); q.arc(0,0,R*0.84,a1,a0,true); q.closePath(); }); }
  const rim=mkCanvas(S0,S0), rg=rim.getContext('2d'); rg.translate(S0/2,S0/2); const tex=e45Lunar(S0,S0,1312);
  rg.fillStyle=rg.createPattern(tex,'no-repeat'); try{ rg.fillStyle.setTransform(new DOMMatrix().translate(-S0/2,-S0/2)); }catch(e){}
  for(const P of paths){ P(rg); rg.fill(); }
  // the sphere's light: brighter toward the upper left, the limb a little darker
  rg.globalCompositeOperation='source-atop'; const sh=rg.createRadialGradient(-R*0.5,-R*0.55,R*0.2,0,0,R*1.1); sh.addColorStop(0,'rgba(255,252,240,.18)'); sh.addColorStop(0.6,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(20,14,50,.38)'); rg.fillStyle=sh; rg.fillRect(-S0/2,-S0/2,S0,S0); rg.globalCompositeOperation='source-over';
  rzRelight(rim,{bump:3,ao:0.12,aoR:3,edge:3,sat:0.85,gain:1.12});
  g.save(); g.shadowColor='rgba(190,170,255,.8)'; g.shadowBlur=18; g.drawImage(rim,-S0/2,-S0/2); g.restore(); g.drawImage(rim,-S0/2,-S0/2);
  g.strokeStyle='rgba(40,26,70,.7)'; g.lineWidth=1.6; for(const P of paths){ P(g); g.stroke(); }
  try{ thrMoth(g,0,R*0.05,R/30,0.6,'#140a24','rgba(220,200,255,.9)'); }catch(e){}
  return c;
}
{ const base=n4FragCv; n4FragCv=function(){ if(!E45.on()) return base(); return rzCache('e45frag',()=>{ const out=[], rng=mulberry32(77), tex=e45Lunar(80,80,1313);
  for(let i=0;i<5;i++){ const c=mkCanvas(80,80), g=c.getContext('2d'); g.translate(40,40); const n=4+Math.floor(rng()*2), P=[]; for(let k=0;k<n;k++){ const a=k/n*TAU+rng()*0.5, r=14+rng()*16; P.push([Math.cos(a)*r,Math.sin(a)*r*0.7]); }
    const pa=()=>{ g.beginPath(); P.forEach((q,k)=>k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.closePath(); };
    const f=mkCanvas(80,80), fg=f.getContext('2d'); fg.translate(40,40); fg.beginPath(); P.forEach((q,k)=>k?fg.lineTo(q[0],q[1]):fg.moveTo(q[0],q[1])); fg.closePath(); fg.save(); fg.clip(); fg.drawImage(tex,-40,-40); fg.restore(); rzRelight(f,{bump:3,ao:0.1,aoR:2,edge:2.4,sat:0.85});
    g.save(); g.shadowColor='rgba(190,170,255,.7)'; g.shadowBlur=8; g.drawImage(f,-40,-40); g.restore(); g.drawImage(f,-40,-40); out.push(c); }
  return out; }); }; }

// ---------- 8. the ascent's puzzle pieces (x4_ascent.js n4aSpr keys; the rest come relit). Every piece keeps its
// box and foot, and the glows and rings x4_ascent draws over them, so what you push, light or ride reads as before.
// the Clockwork's three great gears, lying flat: brass in a toothed rim, a bevelled web with five holes, the hub
function e45Gear(F,w,h,bx,by,key){
  const i=+key.slice(4)||0, R=i===1?150:130, n=i===1?14:12, sd=80+i;
  rzContact(F,6,10,R*0.98,R*0.6,0.4);
  e45Fill(F,-R-10,-R*0.65-10,R+10,R*0.65+10,(x,y,o)=>{ const yy=y/0.62, r=Math.hypot(x,yy), a=Math.atan2(yy,x), tooth=Math.cos(a*n)>-0.05, out=tooth?R:R-14;
    if(r>out) return false; o.a=e45Cov((out-r)*0.62); o.m=RZ.METAL;
    const B=e45Brass(x,yy,sd,-1); let c=B.c, z=10; const pt=rzFbm(x*0.03,yy*0.03,sd+7,3); if(pt>0.56){ c=rzMix(c,[88,140,122],Math.min(0.7,(pt-0.56)*2.6)); B.pat=pt>0.66; }
    if(r>out-4){ z=10-(r-(out-4))*0.9; c=rzCol(c,-0.06); }                 // the bevel at the rim and the teeth
    else if(r>R-22&&r<R-17){ z=9; c=rzCol(c,-0.22); }                      // the groove inside the teeth
    else if(r<R*0.2){ z=r<R*0.08?7:12+e45S(r/(R*0.2))*2; c=r<R*0.08?[50,36,20]:rzCol(c,0.06); }   // the hub and its bore
    for(let k=0;k<5;k++){ const ha=k/5*TAU, hx=Math.cos(ha)*R*0.45, hy=Math.sin(ha)*R*0.45, d=Math.hypot(x-hx,yy-hy); if(d<R*0.1){ o.z=3; o.c=[26,18,30]; o.m=RZ.GLOSS; return true; } if(d<R*0.12){ z=11.5; c=rzCol(c,0.1); } }
    o.z=z; o.c=c; if(B.pat&&r<out-4) o.m=RZ.ROCK; return true; });
  return rzShade(F,{ao:0.12,aoR:2,rim:0.25,bump:1});
}
E45N4A.push([/^gear[0-2]$/,e45Gear,null]);
// blocks of ice (the ice wall and the dam): clear blue with cracks and bubbles inside, a cap of white rime
function e45Ice(F,w,h,bx,by,key){
  const v=+key.slice(-1)||0, H=72+v*8, sd=90+v;
  rzContact(F,0,1,22,7,0.45);
  e45Fill(F,-21,-H-5,21,2,(x,y,o)=>{ if(Math.abs(x)>20) return false; o.a=e45Cov(20-Math.abs(x));
    if(y<-H+3){ o.z=24+(y+H+5)*0.3; o.m=RZ.SNOW; o.c=rzMix([226,238,250],[250,252,255],rzVN(x*0.4,y*0.6,sd)); return true; }
    const t=(-y)/H, s=e45S(x/20); o.m=RZ.WET; o.z=14+4*s+t*6;
    let c=rzMix([26,62,118],[132,190,238],clamp(t*0.9+0.1-(x+20)/40*0.2,0,1));
    const cr=Math.abs(Math.sin(x*0.35+y*0.08+rzFbm(x*0.08,y*0.05,sd,2)*6)); if(cr<0.05) c=rzMix(c,[230,246,255],0.7);
    if(rzHash(Math.floor(x*1.2),Math.floor(y*1.2),sd)>0.985) c=rzMix(c,[240,250,255],0.6);
    if(Math.abs(x+18)<1.6) c=rzMix(c,[210,236,255],0.5);
    o.c=c; return true; });
  return rzShade(F,{ao:0.1,aoR:1.4,rim:0.2,bump:1});
}
E45N4A.push([/^(icew|dam)[0-2]$/,e45Ice,null]);
// the cracked blocks (glass with an ember crack, or ice with a frost crack)
function e45Crk(F,w,h,bx,by,key){
  const ice=key[3]==='i', v=+key.slice(-1)||0, H=50+v*6, sd=95+v, P=ice?[[30,66,120],[130,186,236]]:[[26,20,40],[70,58,104]];
  rzContact(F,0,1,18,6,0.45);
  const crk=[[-6+v*3,-H],[-1,-H*0.66],[-7,-H*0.42],[2,-H*0.18],[-3,0]], br=[[-1,-H*0.66],[8,-H*0.55]];
  e45Fill(F,-17,-H-5,17,2,(x,y,o)=>{ if(Math.abs(x)>16) return false; o.a=e45Cov(16-Math.abs(x));
    if(y<-H+2){ o.z=22; o.m=ice?RZ.SNOW:RZ.GLOSS; o.c=ice?[230,242,252]:[92,80,130]; return true; }
    const t=-y/H, s=e45S(x/16); o.z=12+4*s+t*5; o.m=ice?RZ.WET:RZ.GLOSS; o.c=rzMix(P[0],P[1],clamp(t*0.7+0.15-(x+16)/32*0.3,0,1));
    let d=m3wSegD(crk,x,y); d=Math.min(d,m3wSegD(br,x,y));
    if(d<1.1){ o.m=RZ.EMIT; o.c=ice?[220,244,255]:[255,170,96]; o.z-=1; } else if(d<2.4) o.c=rzMix(o.c,ice?[170,220,255]:[150,70,40],0.45*(2.4-d)/1.3);
    return true; });
  return rzShade(F,{ao:0.12,aoR:1.4,rim:0.22,bump:1});
}
E45N4A.push([/^crki?[0-2]$/,e45Crk,null]);
// lanterns on black glass posts: an iron cage with a ring and a cap, warm glass when lit, dark glass when not
function e45Lan(F,w,h,bx,by,key){
  const on=key.slice(-1)==='1', GL=[34,26,52];
  rzContact(F,0,1,11,4,0.45);
  rzBox(F,0,-1,16,4,0,2,0.8,rzCol(GL,0.1),RZ.GLOSS);
  rzCap(F,0,-2,2,0,-46,16,3,2.6,GL,RZ.GLOSS);
  rzBox(F,0,-48,14,4,0,18,0.8,rzCol(GL,0.1),RZ.GLOSS);
  e45Fill(F,-10,-71,10,-47,(x,y,o)=>{ const ed=Math.min(9-Math.abs(x),Math.min(y+70,-48-y)); if(ed<0) return false; o.a=e45Cov(ed+0.5);
    if(ed<1.6||Math.abs(x)<0.9){ o.z=22; o.c=[56,50,70]; o.m=RZ.METAL; return true; }
    o.z=20; if(on){ o.m=RZ.EMIT; const k=1-Math.min(1,Math.hypot(x,(y+59)*0.7)/9); o.c=rzMix([236,150,60],[255,246,210],k); }
    else { o.m=RZ.GLOSS; o.c=rzMix([30,24,54],[70,60,110],clamp(0.5-(x+y+59)/20,0,1)); if(!on&&m3wSegD([[-6,-67],[-2,-61],[-5,-56]],x,y)<0.6) o.c=[170,150,240]; }
    return true; });
  rzPoly(F,[[-12,-70],[12,-70],[0,-80]],(x,y)=>24+(-70-y)*0.5-Math.abs(x)*0.25,[46,40,62],RZ.METAL);
  rzCap(F,-2.4,-82,26,2.4,-82,26,1.2,1.2,[70,64,86],RZ.METAL); rzCap(F,0,-84.4,26,0,-79.6,26,1.1,1.1,[70,64,86],RZ.METAL);
  return rzShade(F,{ao:0.1,aoR:1,rim:0.25,bump:1.2});
}
E45N4A.push([/^r?lan[01]$/,e45Lan,null]);

// ---------- 9. Moonfall's ground pieces painted into the chunks: rafts and docks of weathered planks, the Moon
// Pier's marble slabs, the mangrove root walkways, Sable's paving, the Silver Rift's lips (same shapes as x3_world's)
const e45Grey=(hex,k)=>{ const c=rzHex(hex), l=c[0]*0.3+c[1]*0.59+c[2]*0.11; return [c[0]+(l-c[0])*k,c[1]+(l-c[1])*k,c[2]+(l-c[2])*k]; };
const e45Rgb=(c,a)=>a==null?`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`:`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
{ const base=m3wRaftPaint; m3wRaftPaint=function(g,R){ if(!LOOK.re) return base(g,R);
  const [x0,y0,x1,y1]=R.r, w=x1-x0, h=y1-y0, rng=mulberry32(Math.floor(x0*3+y0)), vert=h>w;
  g.save();
  g.fillStyle='rgba(10,34,44,.3)'; rrect(g,x0+5,y0+9,w,h,6); g.fill();
  if(!R.plank){ const nb=Math.max(2,Math.round(w/70)); for(let i=0;i<nb;i++){ const bx=x0+16+i*(w-32)/Math.max(1,nb-1||1), yy=y1+2;
    g.fillStyle='rgba(16,24,20,.55)'; g.beginPath(); g.ellipse(bx+1,yy+1,12,5.6,0,0,TAU); g.fill(); g.fillStyle='#6a4c32'; g.beginPath(); g.ellipse(bx,yy-1,11,4.6,0,0,TAU); g.fill();
    g.fillStyle='#8a6a48'; g.beginPath(); g.ellipse(bx-2,yy-2,7,2.4,0,0,TAU); g.fill(); g.fillStyle='#4a4a48'; g.fillRect(bx-11,yy-2,22,1.4); } }
  const cols=R.plank?['#a07848','#b08a5a']:R.id==='town'?['#c89a62','#b88a54']:R.id==='dock'?['#a8845a','#98764e']:[['#c8a070','#b8905e'],['#d8b080','#c49a6a'],['#8cc4bc','#7eb4ac'],['#e8a890','#d8987e'],['#b8a888','#a89878']][Math.floor(rng()*5)];
  const n=Math.ceil((vert?h:w)/12);
  // the deck's dark gaps, then each plank in its own weathered tone, lit along its upper or left edge
  g.fillStyle='#2e241c'; g.fillRect(x0,y0,w,h);
  for(let i=0;i<n;i++){ const c=rzCol(e45Grey(cols[i%2],0.35),(rzHash(i,3,x0|0)-0.5)*0.16), px=vert?x0:x0+i*12, py=vert?y0+i*12:y0, pw=vert?w:Math.min(11,x1-px), ph=vert?Math.min(11,y1-py):h;
    if(pw<=0||ph<=0) continue; g.fillStyle=e45Rgb(c); g.fillRect(px,py,pw,ph);
    g.fillStyle='rgba(255,246,226,.18)'; if(vert) g.fillRect(px,py,pw,1.6); else g.fillRect(px,py,1.6,ph);
    g.fillStyle='rgba(30,20,12,.22)'; if(vert) g.fillRect(px,py+ph-1.6,pw,1.6); else g.fillRect(px+pw-1.6,py,1.6,ph);
    g.fillStyle='rgba(40,30,24,.55)'; for(const e of [0.06,0.94]){ if(vert){ g.fillRect(px+pw*e-1,py+ph/2-1,1.8,1.8); } else { g.fillRect(px+pw/2-1,py+ph*e-1,1.8,1.8); } } }
  rzOver(g,vert?'grainH':'grainV',x0,y0,w,h,0.5);
  // weathering: salt bleaching on one end, a wet dark band at the waterline
  const gr=vert?g.createLinearGradient(x0,0,x1,0):g.createLinearGradient(0,y0,0,y1); gr.addColorStop(0,'rgba(240,236,224,.1)'); gr.addColorStop(0.75,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(20,30,30,.2)'); g.fillStyle=gr; g.fillRect(x0,y0,w,h);
  if(!R.plank){ g.strokeStyle='rgba(90,70,44,.85)'; g.lineWidth=2.2; g.setLineDash([3,2]); g.strokeRect(x0+3,y0+3,w-6,h-6); g.strokeStyle='rgba(214,196,150,.7)'; g.lineWidth=1; g.strokeRect(x0+3,y0+3,w-6,h-6); g.setLineDash([]); }
  g.restore(); }; }
{ const base=m3wPierPaint; m3wPierPaint=function(g){ if(!LOOK.re) return base(g);
  const P=M3WG.pier; g.save();
  g.fillStyle='rgba(10,24,50,.3)'; g.fillRect(P.x0+6,P.y0+10,P.x1-P.x0,P.y1-P.y0);
  g.fillStyle='#8c8aa4'; g.fillRect(P.x0-2,P.y0-2,P.x1-P.x0+4,P.y1-P.y0+4);
  for(let x=P.x0;x<P.x1;x+=30){ const k=(rzHash(x|0,7,301)-0.5)*0.08, c=rzCol([222,222,232],k); g.fillStyle=e45Rgb(c); g.fillRect(x+0.8,P.y0,29,P.y1-P.y0);
    g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(x+0.8,P.y0,29,3); g.fillStyle='rgba(70,70,110,.22)'; g.fillRect(x+0.8,P.y1-4,29,4); }
  rzOver(g,'plaster',P.x0,P.y0,P.x1-P.x0,P.y1-P.y0,0.55);
  const gr=g.createLinearGradient(0,P.y0,0,P.y1); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(0.8,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(70,110,100,.3)'); g.fillStyle=gr; g.fillRect(P.x0,P.y0,P.x1-P.x0,P.y1-P.y0);
  g.fillStyle='#9eaedc'; g.beginPath(); g.arc(13560,65450,26,0,TAU); g.fill(); g.fillStyle='#e2e2ee'; g.beginPath(); g.arc(13570,65444,22,0,TAU); g.fill();
  g.strokeStyle='rgba(120,130,190,.7)'; g.lineWidth=2; g.beginPath(); g.arc(13700,65450,40,0,TAU); g.stroke();
  for(let i=0;i<8;i++){ const a=i/8*TAU, x=13700+Math.cos(a)*34, y=65450+Math.sin(a)*34; g.fillStyle='#5a6aa8'; g.beginPath(); g.arc(x,y,2.8,0,TAU); g.fill(); g.fillStyle='#d8e2ff'; g.beginPath(); g.arc(x-0.7,y-0.7,1.4,0,TAU); g.fill(); }
  g.restore(); }; }
{ const base=m3wRootPaint; m3wRootPaint=function(g,a,b){ if(!LOOK.re) return base(g,a,b);
  const rng=mulberry32(a[0]+b[1]); g.save(); g.lineCap='round'; g.lineJoin='round';
  for(let k=0;k<4;k++){ const off=(k-1.5)*9, pts=[[a[0],a[1]+off]]; for(let i=1;i<=6;i++){ const t=i/6; pts.push([lerp(a[0],b[0],t)+(rng()-0.5)*14,lerp(a[1],b[1],t)+off+(rng()-0.5)*10]); }
    const wd=10-k*2, line=(dx,dy)=>{ g.beginPath(); g.moveTo(pts[0][0]+dx,pts[0][1]+dy); for(let i=1;i<pts.length;i++) g.lineTo(pts[i][0]+dx,pts[i][1]+dy); g.stroke(); };
    g.strokeStyle='rgba(12,20,14,.42)'; g.lineWidth=wd+2; line(2,3);
    g.strokeStyle=k%2?'#5a4230':'#6e5238'; g.lineWidth=wd; line(0,0);
    g.strokeStyle='rgba(206,180,136,.32)'; g.lineWidth=Math.max(1,wd*0.3); line(-wd*0.22,-wd*0.25);
    g.strokeStyle='rgba(30,22,14,.35)'; g.lineWidth=0.8; g.setLineDash([2,5]); line(wd*0.15,wd*0.1); g.setLineDash([]); }
  g.restore(); }; }
{ const base=m3wSablePaint; m3wSablePaint=function(g){ if(!LOOK.re) return base(g);
  g.save(); const cx=9800, cy=67650;
  // the paving is a ring round the pool (the water inside stays clear)
  const ring=()=>{ g.beginPath(); g.ellipse(cx,cy,330,315,0,0,TAU); g.moveTo(cx+224,cy); g.ellipse(cx,cy,224,213,0,0,TAU,true); };
  g.fillStyle='rgba(222,204,166,.66)'; ring(); g.fill('evenodd');
  g.save(); ring(); g.clip('evenodd'); rzOver(g,'grit',cx-330,cy-315,660,630,0.7);
  // flagstones in rings: joints along the rings and across them
  g.strokeStyle='rgba(120,96,64,.38)'; g.lineWidth=1.2;
  for(let r=245;r<330;r+=24){ g.beginPath(); g.ellipse(cx,cy,r,r*0.95,0,0,TAU); g.stroke(); const n=Math.round(r*TAU/34), rr=mulberry32(r);
    for(let i=0;i<n;i++){ const an=i/n*TAU+(rr()-0.5)*0.04; g.beginPath(); g.moveTo(cx+Math.cos(an)*r,cy+Math.sin(an)*r*0.95); g.lineTo(cx+Math.cos(an)*(r+24),cy+Math.sin(an)*(r+24)*0.95); g.stroke(); } }
  g.restore();
  g.strokeStyle='rgba(150,112,70,.6)'; g.lineWidth=3; g.beginPath(); g.ellipse(cx,cy,330,315,0,0,TAU); g.stroke();
  g.fillStyle='rgba(222,204,166,.55)'; rrect(g,9420,67920,760,170,40); g.fill(); g.save(); rrect(g,9420,67920,760,170,40); g.clip(); rzOver(g,'grit',9420,67920,760,170,0.6); g.restore();
  for(let i=0;i<24;i++){ const a=i/24*TAU, x=cx+Math.cos(a)*300, y=cy+Math.sin(a)*286; g.fillStyle='rgba(40,60,110,.7)'; g.beginPath(); g.arc(x,y,4.4,0,TAU); g.fill(); g.fillStyle='#9ab8e6'; g.beginPath(); g.arc(x,y,3.4,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.arc(x-1.2,y-1.2,1.1,0,TAU); g.fill(); }
  g.restore(); }; }
{ const base=m3wRiftPaint; m3wRiftPaint=function(g){ if(!LOOK.re) return base(g);
  // the same drawing with the lips as cut salt glass (a thin dark edge and a bright one) instead of the plum outline
  const o=SBC.outline; try{ SBC.outline='rgba(24,16,44,.75)'; base(g); } finally{ SBC.outline=o; } }; }

// ---------- 10. the Peak's standing things (x4_world.js n4Spr keys): lamp posts, shrines and the silent ruins of a
// copy of Emberhollow, in black glass and dark chalk (paler stone after the dawn)
function e45N4Lamp(F,w,h,bx,by,key){
  const lit=key[4]==='1', dawn=key.slice(-1)==='d', P=dawn?[[96,88,124],[150,142,180]]:[[30,24,46],[64,54,94]];
  rzContact(F,1,1,9,3.5,0.45);
  rzBox(F,0,-0.5,12,3,0,2,0.8,P[1],dawn?RZ.ROCK:RZ.GLOSS);
  rzCap(F,0,-1,2,0,-40,16,2.2,1.8,P[0],dawn?RZ.ROCK:RZ.GLOSS);
  for(let i=0;i<6;i++){ const t0=i/6, t1=(i+1)/6, q=t=>[(1-t)*(1-t)*0+2*(1-t)*t*7+t*t*9,(1-t)*(1-t)*-40+2*(1-t)*t*-44+t*t*-38]; const a=q(t0), b=q(t1); rzCap(F,a[0],a[1],16+t0*2,b[0],b[1],16+t1*2,1.2,1.1,P[0],RZ.METAL); }
  e45Fill(F,4.5,-38.5,14.5,-25.5,(x,y,o)=>{ const ed=Math.min(x-5,14-x,y+38,-26-y); if(ed<0) return false; o.a=e45Cov(ed+0.5);
    if(ed<1.1||Math.abs(x-9.5)<0.7){ o.z=19; o.c=rzCol(P[0],0.2); o.m=RZ.METAL; return true; }
    o.z=18; if(lit){ o.m=RZ.EMIT; o.c=rzMix([236,156,64],[255,246,206],1-Math.min(1,Math.hypot(x-9.5,(y+32)*0.8)/6)); if(x>12) o.c=[214,224,250]; }
    else { o.m=RZ.GLOSS; o.c=rzMix([30,24,52],[70,60,110],clamp(0.5-(x-5+y+38)/20,0,1)); if(m3wSegD([[6,-36],[9,-31],[7,-28]],x,y)<0.55) o.c=[170,150,240]; }
    return true; });
  rzPoly(F,[[3.5,-38],[15.5,-38],[9.5,-43]],(x,y)=>20+(-38-y)*0.6-Math.abs(x-9.5)*0.3,P[0],RZ.METAL);
  return rzShade(F,{ao:0.1,aoR:1,rim:0.25,bump:1.2});
}
E45N4.push([/^lamp[01]d?$/,e45N4Lamp,null]);
function e45N4Shrine(F,w,h,bx,by,key){
  const lit=key.slice(-1)==='1', OB=lit?[[110,72,30],[196,146,62],[246,214,130]]:[[24,18,38],[48,40,74],[110,96,160]];
  rzContact(F,3,4,26,9,0.45);
  rzDome(F,0,2,24,9,0,0.5,3,lit?[70,58,100]:[34,28,52],RZ.ROCK,0.5); rzDome(F,0,0,22,7.5,0,2.5,1.5,lit?[106,92,142]:[50,42,74],RZ.GLOSS,0.4);
  rzPoly(F,[[-9,0],[9,0],[6,-40],[0,-50],[-6,-40]],(x,y)=>{ const t=-y/50; return 5+t*22+(1-Math.abs(x)/(9-3*t))*4; },(x,y)=>{ const d=x/(9+y*0.06); return d<-0.35?OB[2]:d<0.15?OB[1]:OB[0]; },lit?RZ.METAL:RZ.GLOSS);
  rzDome(F,0,-22,3.6,6,0,20,1.4,lit?[255,246,208]:[74,62,112],lit?RZ.EMIT:RZ.GLOSS,0.6);
  return rzShade(F,{ao:0.12,aoR:1.2,rim:0.25,bump:1.2});
}
E45N4.push([/^shrine[01]$/,e45N4Shrine,null]);
function e45Ruin(F,w0,h0,bx,by,key){
  const id=key.slice(5).replace(/d$/,''), dawn=/d$/.test(key)&&!N4RUINS.some(r=>r.id===key.slice(5)), o=N4RUINS.find(r=>r.id===id)||{kind:'house'};
  const w=o.w||120, h=o.h||80, H=24, ST=dawn?[150,140,170]:[54,46,80], TOP=dawn?[188,180,206]:[82,72,118], FL=dawn?[120,112,140]:[40,34,62];
  if(o.kind==='house'||o.kind==='forge') rzContact(F,6,8,w*0.55,h*0.55,0.3); else rzContact(F,0,6,o.kind==='arch'?50:24,12,0.35);
  const sc=(x,y,o2,z,front,base)=>{ e45Stone(o2,x,y,14,7,17,front?rzCol(base,-0.12):base,z,0.5,0.18); o2.m=dawn?RZ.ROCK:RZ.GLOSS; };
  if(o.kind==='house'||o.kind==='forge'){ const gaps=o.gaps||{}, rects=[];
    const wall=(x,y,ww,hh,front)=>{ rects.push({x,y,ww,hh,front}); };
    wall(-w/2,-h/2-H,w,H,true);
    if(!gaps.w) wall(-w/2-4,-h/2-H,8,h+H,false); else { wall(-w/2-4,-h/2-H,8,(h+H)*0.38,false); wall(-w/2-4,-h/2-H+(h+H)*0.68,8,(h+H)*0.32,false); }
    if(!gaps.e) wall(w/2-4,-h/2-H,8,h+H,false); else { wall(w/2-4,-h/2-H,8,(h+H)*0.38,false); wall(w/2-4,-h/2-H+(h+H)*0.68,8,(h+H)*0.32,false); }
    const sw=gaps.s?w*0.36:w; wall(-w/2,h/2-10,sw,10,true); if(gaps.s) wall(w/2-sw,h/2-10,sw,10,true);
    e45Fill(F,-w/2-6,-h/2-H-2,w/2+6,h/2+12,(x,y,q)=>{
      for(let i=rects.length-1;i>=0;i--){ const r=rects[i];
        if(x>=r.x&&x<=r.x+r.ww&&y>=r.y&&y<=r.y+r.hh){ sc(x,y,q,H,false,TOP); q.a=e45Cov(Math.min(x-r.x,r.x+r.ww-x,y-r.y,r.y+r.hh-y)+0.5); if(y-r.y<1.6) q.c=rzCol(q.c,0.15); return true; }
        if(r.front&&x>=r.x&&x<=r.x+r.ww&&y>r.y+r.hh&&y<=r.y+r.hh+H*0.45){ sc(x,y,q,H-(y-r.y-r.hh)*1.2,true,ST); return true; } }
      if(Math.abs(x)<=w/2&&Math.abs(y)<=h/2){ q.m=dawn?RZ.ROCK:RZ.GLOSS; q.z=1;
        if(o.bed&&Math.abs(x-o.bed[0])<=16&&y>=o.bed[1]-10&&y<=o.bed[1]+12){ q.z=5; q.m=RZ.CLOTH; q.c=y<o.bed[1]-3?[106,94,152]:[62,52,98]; if(y<o.bed[1]-6&&x<o.bed[0]-3&&x>o.bed[0]-13) q.c=[140,130,188]; return true; }
        if(o.kind==='forge'&&Math.abs(x)<=12&&y>=-8&&y<=6){ q.z=7; q.m=RZ.METAL; q.c=y<-4?[64,54,96]:[30,24,48]; return true; }
        const B=e45Bond(x+200,y+200,16,16,18); q.c=B.d<0.6?rzCol(FL,-0.35):rzCol(FL,(B.h-0.5)*0.2); if(B.d<0.6) q.z=0.6; return true; }
      return false; });
    // a faint crack of moonlight in the back wall
    rzEach(F,(x,y,id)=>{ if(m3wSegD([[-w/2+10,-h/2-H+6],[-w/2+22,-h/2-H+14],[-w/2+18,-h/2-H+20]],x,y)<0.6&&!dawn){ F.c[id*3]=176; F.c[id*3+1]=156; F.c[id*3+2]=240; F.m[id]=RZ.EMIT; } });
  } else if(o.kind==='arch'){
    e45Fill(F,-48,-82,48,12,(x,y,q)=>{ const d=Math.hypot(x,y+34);
      if(y<-34&&d>=32&&d<=46&&Math.atan2(y+34,x)<-Math.PI*0.39&&x<26){ sc(x,y,q,22+(46-d)*0.3,false,TOP); q.a=e45Cov(Math.min(d-32,46-d)+0.5); return true; }
      if(x>=-46&&x<=-28&&y>=-54&&y<=10){ sc(x,y,q,20+(x+46)*-0.1,x>-34,ST); return true; }
      if(x>=28&&x<=46&&y>=-30&&y<=10){ sc(x,y,q,18,x>40,ST); if(y<-27) q.c=rzCol(q.c,-0.2); return true; }
      return false; });
  } else if(o.kind==='chimney'){
    e45Fill(F,-13,-63,13,7,(x,y,q)=>{ if(y<-56&&Math.abs(x)<=13){ sc(x,y,q,30,false,TOP); if(Math.abs(x)<6&&y>-61&&y<-58){ q.c=[14,10,22]; q.z=26; } return true; }
      if(Math.abs(x)<=10&&y>=-56&&y<=6){ sc(x,y,q,22+e45S(x/10)*5,false,ST); return true; } return false; });
  } else if(o.kind==='well'){
    rzDome(F,0,0,22,13,0,0.5,5,ST,RZ.GLOSS,0.5); rzDome(F,0,-2,15,8,0,5,0.2,[8,4,14],RZ.GLOSS,0.3);
    for(const sx of [-17.5,17.5]) rzBox(F,sx,-15,5,30,0,12,0.8,ST,RZ.GLOSS);
    rzBox(F,0,-30.5,44,5,0,16,1,TOP,RZ.GLOSS);
  }
  return rzShade(F,{ao:0.14,aoR:1.8,rim:0.25,bump:1});
}
E45N4.push([/^ruin_/,e45Ruin,null]);

// ---------- 4. painting ahead: the great places of the map Ash is on are painted in idle time (PROPS's queue), so
// walking up to one never waits on it. [table, key, w, h, bx, by] as the act files ask for them.
const E45PRE={4:[['n4a','gear0',280,189,140,94.5],['n4a','gear1',320,215,160,107.5],['n4a','gear2',280,189,140,94.5]],3:[['m3','obs',400,340,200,250],['m3','temple',360,320,180,240],['m3','well',120,250,60,232],['m3','spire',200,380,100,330],['m3','lhroom',110,110,55,70],['m3','lhcap',110,110,55,70]]};
const E45W={map:-2,gen:-1,id:0};
function e45Pre(m){
  const L=E45PRE[m]; if(!L||!L.length) return;
  if(m===4) RZQ.q.push(()=>{ if(E45.on()){ n4MoonCv(); n4FragCv(); } });
  if(m===3) for(const wet of [0,1]) for(let i=0;i<12;i++) RZQ.q.push(()=>{ if(!E45.on()) return; for(let R=3;R<=18;R+=3) e45CoralHead(i,R,!!wet); });
  for(const [t,k,w,h,bx,by] of L) RZQ.q.push(()=>{ if(!E45.on()) return; if(t==='m3') m3wTall(k,w,h,bx,by,()=>{}); else if(t==='n4') n4Spr(k,w,h,bx,by,()=>{}); else if(t==='n4a') n4aSpr(k,w,h,bx,by,()=>{}); });
  if(RZQ.gen!==LOOK.gen){ RZQ.gen=LOOK.gen; } rzPumpLater();
}
function e45Watch(){ if(E45W.id) return; E45W.id=setInterval(()=>{ try{ if(!LOOK.re||!G||typeof curMap!=='function') return; const m=curMap(); if(m===E45W.map&&LOOK.gen===E45W.gen) return; E45W.map=m; E45W.gen=LOOK.gen; e45Pre(m); e45CrysSync(true); }catch(e){} },1500); }
e45Watch();

// ---------- debug: a sheet of this module's sprites (window.__ebDbg.e45Sheet([[table,key,w,h,bx,by],...],scale,bg))
function e45Sheet(list,sc,bg){
  sc=sc||1; const cs=list.map(([t,k,w,h,bx,by])=>t==='m3'?m3wTall(k,w,h,bx,by,()=>{}):t==='n4'?n4Spr(k,w,h,bx,by,()=>{}):t==='n4a'?n4aSpr(k,w,h,bx,by,()=>{}):t==='kind'?(SPR[k]&&SPR[k][w|0]):null).filter(Boolean);
  const cw=Math.max(...cs.map(c=>(c.w2||c.width/2)))*sc+8, ch=Math.max(...cs.map(c=>(c.h2||c.height/2)))*sc+8, cols=Math.min(6,cs.length), rows=Math.ceil(cs.length/cols);
  const cv=mkCanvas(cols*cw,rows*ch), g=cv.getContext('2d'); g.fillStyle=bg||'#6a6878'; g.fillRect(0,0,cv.width,cv.height);
  cs.forEach((c,i)=>{ const w=(c.w2||c.width/2)*sc, h=(c.h2||c.height/2)*sc; g.drawImage(c,(i%cols)*cw+4,Math.floor(i/cols)*ch+4,w,h); });
  return cv.toDataURL();
}
function e45Prof(){ const o={}; let t=performance.now(); for(let i=0;i<460000;i++) rzFbm(i*0.03,i*0.01,3,3); o.fbm3=performance.now()-t;
  t=performance.now(); for(let i=0;i<460000;i++) rzVN(i*0.03,i*0.01,3); o.vn=performance.now()-t;
  const F=rzHF(360,320,180,240); for(let i=0;i<F.n;i++){ F.a[i]=1; F.h0[i]=10+Math.sin(i)*2; F.c[i*3]=200; F.c[i*3+1]=200; F.c[i*3+2]=200; F.m[i]=9; }
  t=performance.now(); rzShade(F,{ao:0.13,aoR:3}); o.shade=performance.now()-t;
  t=performance.now(); e45Fill(F,-180,-240,180,80,(x,y,q)=>{ q.z=3; q.c=[1,2,3]; q.m=1; return true; }); o.fill=performance.now()-t; return o; }
window.__ebDbg=Object.assign(window.__ebDbg||{},{e45:E45,e45Sheet,e45Prof});
