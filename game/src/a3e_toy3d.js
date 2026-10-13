// ================= Toy 3D: characters built from shaded 3D shapes, seen by a camera that looks down at the
// valley from the south (the Link's Awakening toy look). Any facing angle works, so turning is smooth.
//
// Body space: x forward (the way the character faces), y to its right, z up. Units are world px (before k).
// The origin is the point between the feet, on the ground. A figure is drawn like this:
//   t3Begin(x,y,face,{k:1,flash:false,alpha:1,z:0})   feet at world (x,y), lifted by z (jumping, flying)
//   t3Ell(x,y,z, rx,ry,rz, col[, {pitch,yaw,roll,hi}])  ellipsoid (pitch tips the front down, yaw turns it left/right)
//   t3Ball(x,y,z, r, col[, o])                         sphere
//   t3Limb(ax,ay,az, bx,by,bz, r, col[, r2])           capsule from a to b (r2 tapers it toward b)
//   t3Cone(bx,by,bz, tx,ty,tz, r, col)                 cone from a base circle to a tip (horns, ears, hats)
//   t3Cyl(x,y,z, r1,r2,h, col[, {top}])                upright cylinder or frustum (top hats, robes, skirts)
//   t3Poly(pts, col[, {edge,shade,bias}])              flat panel from body-space points [[x,y,z],...] (capes, wings, blades)
//   t3Dot(x,y,z, r, col[, bias])                       a little flat dot that faces the camera (eyes, buttons, studs)
//   t3Line(ax,ay,az, bx,by,bz, w, col)                 a thin stroke (staffs, strings, whiskers)
//   t3End()                                             sort back to front and draw
// Every part takes an optional depth bias in o.bias (positive draws it later, in front).
// Colours are '#rrggbb'. Shading, the highlight and the dark rim come from the colour.
const T3={tilt:0.8, ct:0, st:0, L:[-0.52,-0.64], LW:[-0.42,-0.5,0.76], on:true};
T3.ct=Math.cos(T3.tilt); T3.st=Math.sin(T3.tilt);
{ const l=Math.hypot(T3.L[0],T3.L[1]); T3.L[0]/=l; T3.L[1]/=l; const w=Math.hypot(...T3.LW); for(let i=0;i<3;i++) T3.LW[i]/=w; }
const T3R={x:0,y:0,c:1,s:0,k:1,zl:0,flash:false,alpha:1,list:[],n:0,m:null,g:null};
const T3G=new Map(); // gradient cache
function t3Shade(col,k){ return shd(col,k); }
function t3Begin(x,y,face,o){
  const R=T3R; R.g=(o&&o.g)||ctx; R.x=x; R.y=y; R.c=Math.cos(face); R.s=Math.sin(face);
  R.k=(o&&o.k)||1; R.flash=!!(o&&o.flash); R.alpha=o&&o.alpha!=null?o.alpha:1; R.zl=(o&&o.z)||0; R.n=0;
  R.m=R.g.getTransform();
}
// body point to screen offset (relative to the feet) and depth (bigger is nearer the camera)
function t3P(bx,by,bz,out){
  const R=T3R, wx=bx*R.c-by*R.s, wy=bx*R.s+by*R.c, wz=bz+R.zl;
  out[0]=wx*R.k; out[1]=(wy*T3.ct-wz*T3.st)*R.k; out[2]=wy*T3.st+wz*T3.ct; return out;
}
function t3Part(){ const R=T3R; let p=R.list[R.n]; if(!p){ p={}; R.list[R.n]=p; } R.n++; p.bias=0; return p; }
const _t3a=[0,0,0], _t3b=[0,0,0], _t3c=[0,0,0];
// rotate a body-space axis by pitch (around y), yaw (around z) and roll (around x), then into the world by facing
function t3Axis(v,o,out){
  let [x,y,z]=v;
  if(o){
    if(o.roll){ const c=Math.cos(o.roll), s=Math.sin(o.roll); const y2=y*c-z*s, z2=y*s+z*c; y=y2; z=z2; }
    if(o.pitch){ const c=Math.cos(o.pitch), s=Math.sin(o.pitch); const x2=x*c+z*s, z2=-x*s+z*c; x=x2; z=z2; }
    if(o.yaw){ const c=Math.cos(o.yaw), s=Math.sin(o.yaw); const x2=x*c-y*s, y2=x*s+y*c; x=x2; y=y2; }
  }
  const R=T3R, wx=x*R.c-y*R.s, wy=x*R.s+y*R.c;
  out[0]=wx*R.k; out[1]=(wy*T3.ct-z*T3.st)*R.k; return out;
}
const _t3x=[1,0,0], _t3y=[0,1,0], _t3z=[0,0,1], _ax=[0,0], _ay=[0,0], _az=[0,0];
function t3Ell(x,y,z,rx,ry,rz,col,o){
  const p=t3Part(); t3P(x,y,z,_t3a);
  t3Axis(_t3x,o,_ax); t3Axis(_t3y,o,_ay); t3Axis(_t3z,o,_az);
  const a=rx*rx*_ax[0]*_ax[0]+ry*ry*_ay[0]*_ay[0]+rz*rz*_az[0]*_az[0];
  const b=rx*rx*_ax[0]*_ax[1]+ry*ry*_ay[0]*_ay[1]+rz*rz*_az[0]*_az[1];
  const d=rx*rx*_ax[1]*_ax[1]+ry*ry*_ay[1]*_ay[1]+rz*rz*_az[1]*_az[1];
  const h=(a-d)/2, q=Math.sqrt(h*h+b*b), l1=(a+d)/2+q, l2=Math.max(0.0004,(a+d)/2-q);
  p.t=0; p.sx=_t3a[0]; p.sy=_t3a[1]; p.d=_t3a[2]+(o&&o.bias||0); p.ang=0.5*Math.atan2(2*b,a-d); p.s1=Math.sqrt(l1); p.s2=Math.sqrt(l2); p.col=col; p.hi=o&&o.hi;
  return p;
}
function t3Ball(x,y,z,r,col,o){ return t3Ell(x,y,z,r,r,r,col,o); }
function t3Limb(ax,ay,az,bx,by,bz,r,col,r2,bias){
  const p=t3Part(); t3P(ax,ay,az,_t3a); t3P(bx,by,bz,_t3b);
  p.t=1; p.ax=_t3a[0]; p.ay=_t3a[1]; p.bx=_t3b[0]; p.by=_t3b[1]; p.d=(_t3a[2]+_t3b[2])/2+(bias||0); p.r1=r*T3R.k; p.r2=(r2==null?r:r2)*T3R.k; p.col=col;
  return p;
}
function t3Cone(bx,by,bz,tx,ty,tz,r,col,bias){ const p=t3Limb(bx,by,bz,tx,ty,tz,r,col,r*0.1,bias); p.cone=true; t3P(bx,by,bz,_t3a); t3P(tx,ty,tz,_t3b); p.d=_t3a[2]*0.62+_t3b[2]*0.38+(bias||0); return p; }
function t3Cyl(x,y,z,r1,r2,h,col,o){
  const p=t3Part(); t3P(x,y,z,_t3a); t3P(x,y,z+h,_t3b);
  p.t=2; p.ax=_t3a[0]; p.ay=_t3a[1]; p.by=_t3b[1]; p.r1=r1*T3R.k; p.r2=r2*T3R.k; p.d=(_t3a[2]+_t3b[2])/2+(o&&o.bias||0); p.col=col; p.top=o&&o.top||null; p.open=!!(o&&o.open);
  return p;
}
function t3Poly(pts,col,o){
  const p=t3Part(); if(!p.pts) p.pts=[]; p.pts.length=0; let dsum=0;
  for(const q of pts){ t3P(q[0],q[1],q[2],_t3a); p.pts.push(_t3a[0],_t3a[1]); dsum+=_t3a[2]; }
  // world normal for flat shading (two sided)
  const R=T3R, w=(q)=>[q[0]*R.c-q[1]*R.s, q[0]*R.s+q[1]*R.c, q[2]];
  const A=w(pts[0]), B=w(pts[1]), C=w(pts[pts.length-1]);
  const ux=B[0]-A[0], uy=B[1]-A[1], uz=B[2]-A[2], vx=C[0]-A[0], vy=C[1]-A[1], vz=C[2]-A[2];
  let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx; const nl=Math.hypot(nx,ny,nz)||1; nx/=nl; ny/=nl; nz/=nl;
  const lit=Math.abs(nx*T3.LW[0]+ny*T3.LW[1]+nz*T3.LW[2]);
  p.t=3; p.d=dsum/pts.length+(o&&o.bias||0); p.col=col; p.lk=o&&o.shade===false?0:(lit-0.62)*0.9; p.edge=o&&o.edge||null;
  return p;
}
function t3Dot(x,y,z,r,col,bias){ const p=t3Part(); t3P(x,y,z,_t3a); p.t=4; p.sx=_t3a[0]; p.sy=_t3a[1]; p.d=_t3a[2]+(bias||0.01); p.r1=r*T3R.k; p.col=col; return p; }
function t3Line(ax,ay,az,bx,by,bz,w,col,bias){ const p=t3Limb(ax,ay,az,bx,by,bz,w/2,col,null,bias); p.t=5; return p; }
// a soft dark ellipse on the ground under the figure (most callers do not need it; the world draws contact shadows)
function t3Shadow(r,a){ const R=T3R, g=R.g; g.save(); g.globalAlpha=(a||0.3)*R.alpha; g.fillStyle='#000'; g.beginPath(); g.ellipse(R.x,R.y,r*R.k,r*R.k*T3.ct*0.8,0,0,TAU); g.fill(); g.restore(); }

function t3Grad(col,qx,qy,mode){
  const key=col+'|'+qx+'|'+qy+'|'+mode; let gr=T3G.get(key); if(gr) return gr;
  if(T3G.size>6000) T3G.clear();
  const g=ctx;
  if(mode===2){ // Storybook ellipsoid: flat cel bands (a highlight spot, the base, a shadow crescent leaning to plum)
    const hx=qx/10, hy=qy/10, hl=sbTone(col,0.36), sh=sbTone(col,-0.3);
    gr=g.createRadialGradient(hx,hy,0.02,hx*0.25,hy*0.25,1.04);
    gr.addColorStop(0,hl); gr.addColorStop(0.15,hl); gr.addColorStop(0.17,col); gr.addColorStop(0.69,col); gr.addColorStop(0.71,sh); gr.addColorStop(1,sh);
  }else if(mode===3){ // Storybook limb: a lit stripe, the base, a shadow side
    const R=qx/2, s=qy, hl=sbTone(col,0.32), sh=sbTone(col,-0.3);
    gr=g.createLinearGradient(0,-R*s,0,R*s);
    gr.addColorStop(0,hl); gr.addColorStop(0.24,hl); gr.addColorStop(0.26,col); gr.addColorStop(0.62,col); gr.addColorStop(0.64,sh); gr.addColorStop(1,sh);
  }else if(mode===0){ // ellipsoid in a unit circle
    const hx=qx/10, hy=qy/10;
    gr=g.createRadialGradient(hx,hy,0.02,hx*0.25,hy*0.25,1.04);
    gr.addColorStop(0,t3Shade(col,0.5)); gr.addColorStop(0.2,t3Shade(col,0.2)); gr.addColorStop(0.62,col); gr.addColorStop(0.9,t3Shade(col,-0.32)); gr.addColorStop(1,t3Shade(col,-0.5));
  }else{ // limb across local y from -qx to +qx; qy is the lit side (-1 or 1)
    const R=qx/2, s=qy;
    gr=g.createLinearGradient(0,-R*s,0,R*s);
    gr.addColorStop(0,t3Shade(col,0.34)); gr.addColorStop(0.32,t3Shade(col,0.08)); gr.addColorStop(0.7,col); gr.addColorStop(1,t3Shade(col,-0.42));
  }
  T3G.set(key,gr); return gr;
}
function t3End(){
  const R=T3R, g=R.g, L=T3.L, m=R.m, n=R.n, list=R.list;
  // insertion sort (lists are short) back to front
  for(let i=1;i<n;i++){ const p=list[i]; let j=i-1; while(j>=0&&list[j].d>p.d){ list[j+1]=list[j]; j--; } list[j+1]=p; }
  const a0=g.globalAlpha; if(R.alpha!==1) g.globalAlpha=a0*R.alpha;
  const ox=R.x, oy=R.y, fl=R.flash, cel=LOOK.sb;
  if(cel&&T3.ol!==false) t3Outline(g,list,n,m,ox,oy,R.k);
  for(let i=0;i<n;i++){
    const p=list[i];
    if(p.t===0){ // ellipsoid
      const c=Math.cos(p.ang), s=Math.sin(p.ang), mr=Math.sqrt(p.s1*p.s2);
      g.setTransform(m); g.transform(c*p.s1,s*p.s1,-s*p.s2,c*p.s2,ox+p.sx,oy+p.sy);
      let hx=(c*L[0]+s*L[1])*0.46*mr/p.s1, hy=(-s*L[0]+c*L[1])*0.46*mr/p.s2; const hl=Math.hypot(hx,hy); if(hl>0.62){ hx*=0.62/hl; hy*=0.62/hl; }
      g.fillStyle=fl?'#ffffff':t3Grad(p.col,Math.round(hx*10),Math.round(hy*10),cel?2:0);
      g.beginPath(); g.arc(0,0,1,0,TAU); g.fill();
    }else if(p.t===1||p.t===5){ // limb, cone or line
      const dx=p.bx-p.ax, dy=p.by-p.ay, len=Math.hypot(dx,dy), an=Math.atan2(dy,dx), c=Math.cos(an), s=Math.sin(an);
      g.setTransform(m); g.transform(c,s,-s,c,ox+p.ax,oy+p.ay);
      if(p.t===5){ g.strokeStyle=fl?'#fff':p.col; g.lineWidth=p.r1*2; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.lineTo(len,0); g.stroke(); continue; }
      const side=(-s*L[0]+c*L[1])<0?1:-1, rm=Math.max(p.r1,p.r2);
      g.fillStyle=fl?'#ffffff':t3Grad(p.col,Math.max(1,Math.round(rm*2)),side,cel?3:1);
      g.beginPath();
      if(len<0.5){ g.arc(0,0,rm,0,TAU); }
      else if(p.cone){ g.moveTo(0,-p.r1); g.lineTo(len,0); g.lineTo(0,p.r1); g.arc(0,0,p.r1,Math.PI/2,Math.PI*1.5); }
      else{
        const r1=p.r1, r2=p.r2, sn=clamp((r1-r2)/len,-0.95,0.95), al=Math.asin(sn);
        g.arc(0,0,r1,Math.PI/2+al,Math.PI*1.5-al); g.arc(len,0,r2,-Math.PI/2-al,Math.PI/2+al);
      }
      g.closePath(); g.fill();
    }else if(p.t===2){ // upright cylinder or frustum
      g.setTransform(m); const x=ox+p.ax, yb=oy+p.ay, yt=oy+p.by, r1=p.r1, r2=p.r2, e1=r1*T3.ct, e2=r2*T3.ct, rm=Math.max(r1,r2);
      if(!fl&&cel){ const key=p.col+'|cylc|'+Math.round(rm); let gr=T3G.get(key); if(!gr){ const hl=sbTone(p.col,0.32), sh=sbTone(p.col,-0.3); gr=g.createLinearGradient(-rm,0,rm,0); gr.addColorStop(0,hl); gr.addColorStop(0.2,hl); gr.addColorStop(0.22,p.col); gr.addColorStop(0.66,p.col); gr.addColorStop(0.68,sh); gr.addColorStop(1,sh); T3G.set(key,gr); } g.translate(x,0); g.fillStyle=gr; }
      else if(!fl){ const key=p.col+'|cyl|'+Math.round(rm); let gr=T3G.get(key); if(!gr){ gr=g.createLinearGradient(-rm,0,rm,0); gr.addColorStop(0,t3Shade(p.col,0.3)); gr.addColorStop(0.35,t3Shade(p.col,0.08)); gr.addColorStop(0.75,p.col); gr.addColorStop(1,t3Shade(p.col,-0.45)); T3G.set(key,gr); } g.translate(x,0); g.fillStyle=gr; }
      else{ g.translate(x,0); g.fillStyle='#fff'; }
      g.beginPath(); g.moveTo(-r1,yb); g.ellipse(0,yb,r1,e1,0,Math.PI,0,true); g.lineTo(r2,yt); g.ellipse(0,yt,r2,e2,0,0,Math.PI,true); g.closePath(); g.fill();
      if(!p.open){ g.fillStyle=fl?'#fff':(p.top||(cel?sbTone(p.col,0.26):t3Shade(p.col,0.22))); g.beginPath(); g.ellipse(0,yt,r2,e2,0,0,TAU); g.fill(); }
    }else if(p.t===3){ // panel
      g.setTransform(m); g.fillStyle=fl?'#fff':cel?(p.lk>0.1?sbTone(p.col,0.24):p.lk<-0.12?sbTone(p.col,-0.26):p.col):(p.lk?t3Shade(p.col,clamp(p.lk,-0.5,0.4)):p.col);
      const q=p.pts; g.beginPath(); g.moveTo(ox+q[0],oy+q[1]); for(let k=2;k<q.length;k+=2) g.lineTo(ox+q[k],oy+q[k+1]); g.closePath(); g.fill();
      if(p.edge){ g.strokeStyle=p.edge; g.lineWidth=0.8*R.k; g.lineJoin='round'; g.stroke(); }
    }else if(p.t===4){ // dot
      g.setTransform(m); g.fillStyle=fl?'#fff':p.col; g.beginPath(); g.arc(ox+p.sx,oy+p.sy,p.r1,0,TAU); g.fill();
    }
  }
  g.setTransform(m); g.globalAlpha=a0;
}
// Storybook outline (e5_look): every part's silhouette grown by w goes into ONE path (all subpaths wind the same way,
// so the nonzero fill is their union) and is filled once in the plum outline colour under the figure; flat panels get a
// round stroke. Inner borders stay clean, only the outside of the toy gets the bold line. T3.ow is the width in world px.
T3.ow=1.25;
function t3Outline(g,list,n,m,ox,oy,k){
  const w=T3.ow*k, ct=T3.ct; let polys=false;
  g.setTransform(m); g.fillStyle=SBC.outline; g.beginPath();
  for(let i=0;i<n;i++){
    const p=list[i];
    if(p.t===0){ const cx=ox+p.sx, cy=oy+p.sy, rx=p.s1+w, ry=p.s2+w; g.moveTo(cx+Math.cos(p.ang)*rx,cy+Math.sin(p.ang)*rx); g.ellipse(cx,cy,rx,ry,p.ang,0,TAU); }
    else if(p.t===1||p.t===5){
      const ax=ox+p.ax, ay=oy+p.ay, bx=ox+p.bx, by=oy+p.by, dx=bx-ax, dy=by-ay, len=Math.hypot(dx,dy), an=Math.atan2(dy,dx);
      const r1=p.r1+w, r2=(p.t===5?p.r1:p.r2)+w;
      if(len<0.5){ const r=Math.max(r1,r2); g.moveTo(ax+r,ay); g.arc(ax,ay,r,0,TAU); }
      else if(p.cone){ const s0=an+Math.PI/2; g.moveTo(ax+Math.cos(s0)*r1,ay+Math.sin(s0)*r1); g.arc(ax,ay,r1,s0,an+Math.PI*1.5); g.lineTo(bx+Math.cos(an)*w*1.6,by+Math.sin(an)*w*1.6); g.closePath(); }
      else{ const sn=clamp((r1-r2)/len,-0.95,0.95), al=Math.asin(sn), s0=an+Math.PI/2+al; g.moveTo(ax+Math.cos(s0)*r1,ay+Math.sin(s0)*r1); g.arc(ax,ay,r1,s0,an+Math.PI*1.5-al); g.arc(bx,by,r2,an-Math.PI/2-al,an+Math.PI/2+al); g.closePath(); }
    }
    else if(p.t===2){ const x=ox+p.ax, yb=oy+p.ay, yt=oy+p.by, R1=p.r1+w, R2=p.r2+w, E1=p.r1*ct+w, E2=p.r2*ct+w;
      g.moveTo(x+R1,yb); g.ellipse(x,yb,R1,E1,0,0,Math.PI); g.lineTo(x-R2,yt); g.ellipse(x,yt,R2,E2,0,Math.PI,TAU); g.closePath(); }
    else if(p.t===3) polys=true;
  }
  g.fill();
  if(polys){ g.strokeStyle=SBC.outline; g.lineWidth=w*2; g.lineJoin='round'; g.beginPath();
    for(let i=0;i<n;i++){ const p=list[i]; if(p.t!==3) continue; const q=p.pts; g.moveTo(ox+q[0],oy+q[1]); for(let j=2;j<q.length;j+=2) g.lineTo(ox+q[j],oy+q[j+1]); g.closePath(); }
    g.stroke(); }
}
// registries: each character module adds its own drawers here (only used while T3.on)
// T3X.ash(p)          Ash (the whole drawPlayer)            T3X.npc(n) -> true if drawn (people)
// T3X.spirit(sp)      Ember and the Wardens as spirits      T3X.vorlaxis(e)
// T3E[type](e,fl)     enemies and bosses by type            T3A[k](a)  final-battle allies by kind ('grey','cinder')
// T3B[kind](o)        animals: 'goat','turtle','pip','birds' (no argument), and critter types
// T3C[id](c,v,down)   companions: 'brisket','juniper','duchess','greymane'
const T3X={}, T3E={}, T3A={}, T3B={}, T3C={};
// smooth turning for any drawn thing: returns a visual facing that eases toward ang (rate in radians per second)
function t3Turn(e,ang,rate){
  const now=G?G.time:0, dt=clamp(now-(e._vft!=null?e._vft:now),0,0.1); e._vft=now;
  if(e._vf==null) e._vf=ang; else e._vf+=angDiff(e._vf,ang)*Math.min(1,(rate||12)*dt);
  return e._vf;
}
// helpers for walking figures
// walk phase w (radians), amount a (0 idle .. 1 walking): returns leg swing and body bob
function t3Walk(w,a){ return {sw:Math.sin(w)*a, bob:Math.abs(Math.sin(w))*a, sw2:Math.cos(w)*a}; }
// 3D characters on or off (Settings, saved as eb_chars)
T3.on=store.get('eb_chars','3d')!=='classic';

// ---------- reference figures (patterns for the character modules; also used by the test sheet)
// a plain villager: feet at the origin, about 40 tall
function t3RefPerson(o){
  o=o||{}; const w=t3Walk(o.walk||0,o.move||0), skin=o.skin||'#e8b48a', shirt=o.shirt||'#4a7ab0', pants=o.pants||'#5a4030', hair=o.hair||'#5a3a1e';
  const bob=w.bob*1.2;
  // legs and shoes
  for(const sd of [-1,1]){ const s=w.sw*sd; t3Limb(0,sd*3.1,9+bob,s*4.6,sd*3.3,2.4,2.5,pants); t3Ell(s*4.6+1.2,sd*3.3,1.6,3.2,2.2,1.7,'#3a2a1c'); }
  // body
  t3Ell(0,0,15+bob,5.6,6.6,7.4,shirt);
  t3Ell(0.6,0,8.6+bob,4.6,5.6,2.8,pants);
  // arms
  for(const sd of [-1,1]){ const s=-w.sw*sd; t3Limb(0,sd*6.4,19+bob,s*4.2,sd*7.4,11.5+bob,2.2,shirt,1.9); t3Ball(s*4.4,sd*7.5,10.8+bob,2.2,skin); }
  // head
  const hz=28.5+bob; t3Ball(0,0,hz,8.4,skin);
  t3Ell(-2.4,0,hz+1.6,7.4,8.7,7.6,hair); t3Ell(3.2,0,hz+5.6,4.8,7.4,3.2,hair,{pitch:0.35});
  for(const sd of [-1,1]){ t3Dot(7.2,sd*3.1,hz+0.4,1.25,'#2a1a10'); t3Dot(7.5,sd*3.25,hz+0.9,0.42,'#ffffff',0.02); t3Ell(6.9,sd*5.2,hz-2.4,1.1,1.6,1.0,shd(skin,-0.12)); }
  t3Dot(8.0,0,hz-2.6,0.9,shd(skin,-0.25));
}
// a wolf on four legs, about 24 tall
function t3RefWolf(o){
  o=o||{}; const w=t3Walk(o.walk||0,o.move||0), fur=o.fur||'#8a8a86', dark=shd(fur,-0.35), lite=shd(fur,0.3);
  for(const [lx,ly,ph] of [[7,-3.6,0],[7,3.6,Math.PI],[-7,-3.6,Math.PI],[-7,3.6,0]]){ const s=Math.sin((o.walk||0)+ph)*(o.move||0)*4; t3Limb(lx,ly,8,lx+s,ly,1.5,2,dark,1.6); }
  t3Ell(0,0,11,11,5.4,5.6,fur);
  t3Ell(-1,0,8.6,8,4.6,3,lite,{bias:-0.5});
  t3Limb(-10,0,12,-17,0,9+Math.sin(G?G.time*5:0)*1.5,2.6,fur,1.4);
  t3Ell(12,0,15,5.4,4.4,4.6,fur,{pitch:0.2});
  t3Ell(17,0,13.4,4,2.4,2.2,lite,{pitch:0.25});
  t3Dot(20.6,0,13.8,1,'#1a1a18');
  for(const sd of [-1,1]){ t3Cone(11,sd*2.8,18.5,9.5,sd*3.4,24,1.9,dark); t3Dot(15.6,sd*2.1,16.4,0.9,'#ffe066'); }
}
// draws a test sheet of a reference figure at 8 angles (debug)
function t3Sheet(kind,walk){
  const c=document.createElement('canvas'); c.width=8*90; c.height=110; const g=c.getContext('2d');
  g.fillStyle='#6a8a4a'; g.fillRect(0,0,c.width,c.height);
  for(let i=0;i<8;i++){ g.setTransform(2,0,0,2,0,0); g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(22+i*45,44,9,4,0,0,TAU); g.fill();
    t3Begin(22+i*45,44,i*TAU/8,{k:1,g}); if(kind==='wolf') t3RefWolf({walk:walk||0,move:walk?1:0}); else t3RefPerson({walk:walk||0,move:walk?1:0}); t3End(); }
  return c.toDataURL();
}
window.__ebX=Object.assign(window.__ebX||{},{t3Sheet,T3});
function t3Bench(n){ const t0=performance.now(); ctx.save(); for(let i=0;i<n;i++){ t3Begin(100+(i%10)*40,100+Math.floor(i/10)*50,i*0.7,{k:1}); t3RefPerson({walk:i,move:1}); t3End(); } ctx.restore(); return performance.now()-t0; }
window.__ebX.t3Bench=t3Bench;
