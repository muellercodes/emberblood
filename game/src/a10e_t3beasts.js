
// ================= Toy 3D animals: wolves and Greymane, Duchess the goat, Pip, Shellby, deer, rabbits, birds, bats,
// slimes, drakeling eggs, Clover the sheep, Puff the hatchling, the Lake King and the house pets.
// Built with the toy 3D engine (a3e_toy3d.js). Every figure is written in body space (x forward, y to its right,
// z up) through a small pose layer (the b3* helpers), so a whole animal or one part of it (a head, a sitting torso,
// a wing) can be tipped, rolled or turned as a group. Smooth state changes come from eased pose numbers (b3S).
const B3={m:[1,0,0,0,1,0,0,0,1,0,0,0],id:true,st:[],sp:0,dt:0,o:{pitch:0,yaw:0,roll:0,bias:0},po:{edge:null,shade:true,bias:0},
  q:[0,0,0],q2:[0,0,0],q3:[0,0,0],R:[0,0,0,0,0,0,0,0,0],pts:[],pool:[],F:new Array(48).fill(0),T:{},rate:{}};
for(let i=0;i<16;i++) B3.pool.push([0,0,0]);
const B3SD=[-1,1], B3SD3=[-1,0,1], B3CLAW=[-0.7,0,0.7], B3RIDGE=[3.6,-0.6,-4.8], B3VERT=[-7.4,7.4];
function b3Reset(){ const m=B3.m; m[0]=m[4]=m[8]=1; m[1]=m[2]=m[3]=m[5]=m[6]=m[7]=m[9]=m[10]=m[11]=0; B3.id=true; B3.sp=0; }
function b3Push(){ let s=B3.st[B3.sp]; if(!s){ s=new Array(13); B3.st[B3.sp]=s; } const m=B3.m; for(let i=0;i<12;i++) s[i]=m[i]; s[12]=B3.id; B3.sp++; }
function b3Pop(){ B3.sp--; const s=B3.st[B3.sp], m=B3.m; for(let i=0;i<12;i++) m[i]=s[i]; B3.id=s[12]; }
// rotate everything drawn after this by ang around an axis through (px,py,pz): ax 0 roll (around x), 1 pitch (around y,
// plus tips the front down), 2 yaw (around z)
function b3Rot(ax,ang,px,py,pz){
  if(!ang) return;
  const c=Math.cos(ang), s=Math.sin(ang), R=B3.R, m=B3.m;
  if(ax===0){ R[0]=1;R[1]=0;R[2]=0; R[3]=0;R[4]=c;R[5]=-s; R[6]=0;R[7]=s;R[8]=c; }
  else if(ax===1){ R[0]=c;R[1]=0;R[2]=s; R[3]=0;R[4]=1;R[5]=0; R[6]=-s;R[7]=0;R[8]=c; }
  else { R[0]=c;R[1]=-s;R[2]=0; R[3]=s;R[4]=c;R[5]=0; R[6]=0;R[7]=0;R[8]=1; }
  const dx=px-(R[0]*px+R[1]*py+R[2]*pz), dy=py-(R[3]*px+R[4]*py+R[5]*pz), dz=pz-(R[6]*px+R[7]*py+R[8]*pz);
  m[9]+=m[0]*dx+m[1]*dy+m[2]*dz; m[10]+=m[3]*dx+m[4]*dy+m[5]*dz; m[11]+=m[6]*dx+m[7]*dy+m[8]*dz;
  for(let r=0;r<9;r+=3){ const a0=m[r],a1=m[r+1],a2=m[r+2]; m[r]=a0*R[0]+a1*R[3]+a2*R[6]; m[r+1]=a0*R[1]+a1*R[4]+a2*R[7]; m[r+2]=a0*R[2]+a1*R[5]+a2*R[8]; }
  B3.id=false;
}
function b3Move(dx,dy,dz){ const m=B3.m; m[9]+=m[0]*dx+m[1]*dy+m[2]*dz; m[10]+=m[3]*dx+m[4]*dy+m[5]*dz; m[11]+=m[6]*dx+m[7]*dy+m[8]*dz; B3.id=false; }
function b3T(x,y,z,o){ const m=B3.m; o[0]=m[0]*x+m[1]*y+m[2]*z+m[9]; o[1]=m[3]*x+m[4]*y+m[5]*z+m[10]; o[2]=m[6]*x+m[7]*y+m[8]*z+m[11]; return o; }
// the engine's own part angles for (pose * local pitch, yaw, roll)
function b3Eul(p,y,r){
  const o=B3.o; if(B3.id){ o.pitch=p; o.yaw=y; o.roll=r; return; }
  const m=B3.m, cp=Math.cos(p), sp=Math.sin(p), cy=Math.cos(y), sy=Math.sin(y), cr=Math.cos(r), sr=Math.sin(r);
  const l00=cy*cp, l01=cy*sp*sr-sy*cr, l02=cy*sp*cr+sy*sr, l10=sy*cp, l11=sy*sp*sr+cy*cr, l12=sy*sp*cr-cy*sr, l20=-sp, l21=cp*sr, l22=cp*cr;
  const M00=m[0]*l00+m[1]*l10+m[2]*l20, M10=m[3]*l00+m[4]*l10+m[5]*l20, M20=m[6]*l00+m[7]*l10+m[8]*l20;
  const M21=m[6]*l01+m[7]*l11+m[8]*l21, M22=m[6]*l02+m[7]*l12+m[8]*l22;
  o.pitch=Math.asin(clamp(-M20,-1,1)); o.roll=Math.atan2(M21,M22); o.yaw=Math.atan2(M10,M00);
}
// posed parts (same arguments as the engine, angles and bias as plain numbers so nothing is allocated)
function bE(x,y,z,rx,ry,rz,col,pitch,yaw,roll,bias){
  const o=B3.o, q=b3T(x,y,z,B3.q);
  if(rx===ry&&ry===rz){ o.pitch=o.yaw=o.roll=0; } else b3Eul(pitch||0,yaw||0,roll||0);
  o.bias=bias||0; return t3Ell(q[0],q[1],q[2],rx,ry,rz,col,o);
}
function bB(x,y,z,r,col,bias){ return bE(x,y,z,r,r,r,col,0,0,0,bias); }
function bL(ax,ay,az,bx,by,bz,r,col,r2,bias){ const a=b3T(ax,ay,az,B3.q), b=b3T(bx,by,bz,B3.q2); return t3Limb(a[0],a[1],a[2],b[0],b[1],b[2],r,col,r2,bias); }
function bC(ax,ay,az,bx,by,bz,r,col,bias){ const a=b3T(ax,ay,az,B3.q), b=b3T(bx,by,bz,B3.q2); return t3Cone(a[0],a[1],a[2],b[0],b[1],b[2],r,col,bias); }
function bD(x,y,z,r,col,bias){ const a=b3T(x,y,z,B3.q); return t3Dot(a[0],a[1],a[2],r,col,bias); }
function bLn(ax,ay,az,bx,by,bz,w,col,bias){ const a=b3T(ax,ay,az,B3.q), b=b3T(bx,by,bz,B3.q2); return t3Line(a[0],a[1],a[2],b[0],b[1],b[2],w,col,bias); }
// a flat panel from the first n points of B3.F (x,y,z triples)
function bP(n,col,edge,bias,noShade){
  const F=B3.F, L=B3.pts; L.length=n;
  for(let i=0;i<n;i++){ const p=B3.pool[i]; b3T(F[i*3],F[i*3+1],F[i*3+2],p); L[i]=p; }
  const o=B3.po; o.edge=edge||null; o.bias=bias||0; o.shade=noShade?false:true; return t3Poly(L,col,o);
}
function bF(i,x,y,z){ const F=B3.F; F[i*3]=x; F[i*3+1]=y; F[i*3+2]=z; }
// an eye: a coloured dot with a tiny white highlight up and to the left on screen
function bEye(x,y,z,r,col,hl){
  const a=b3T(x,y,z,B3.q3), R=T3R; t3Dot(a[0],a[1],a[2],r,col,0.02);
  if(hl!==false) t3Dot(a[0]-R.c*r*0.3,a[1]+R.s*r*0.3,a[2]+r*0.38,r*0.4,'#ffffff',0.03);
}
// where a body point lands on the screen (world coordinates), after t3Begin
function b3Scr(x,y,z,out){ const a=b3T(x,y,z,B3.q3); t3P(a[0],a[1],a[2],out); out[0]+=T3R.x; out[1]+=T3R.y; return out; }
// how much a body direction faces the camera (1 straight at it, below 0 turned away)
function b3Faces(dx,dy,dz){ const R=T3R, m=B3.m, x=m[0]*dx+m[1]*dy+m[2]*dz, y=m[3]*dx+m[4]*dy+m[5]*dz, z=m[6]*dx+m[7]*dy+m[8]*dz, wy=x*R.s+y*R.c; return wy*T3.st+z*T3.ct; }
const _b3s=[0,0,0], _b3s2=[0,0,0];

// a steady number per thing (enemy ids are numbers, companion ids are names)
function b3Id(e){ if(e._b3id==null) e._b3id=typeof e.id==='number'?e.id:Math.floor(Math.random()*997); return e._b3id; }
// ---------- motion: speed from how far a thing moved since it was last drawn, and a gait phase that runs with it
function b3Motion(e,fk,fmax){
  if(e._sv!=null){ e._b3v=e._sv; e._b3g=e._sg||0; B3.dt=0; return e._sv; }
  const now=G?G.time:0; let dt=now-(e._b3t==null?now:e._b3t); e._b3t=now; if(!(dt>0)||dt>0.3) dt=0;
  if(e._b3x==null){ e._b3x=e.x; e._b3y=e.y; e._b3v=0; e._b3g=(b3Id(e)*1.7+(e.x||0)*0.013)%TAU; }
  if(dt>0){ const v=Math.min(700,Math.hypot(e.x-e._b3x,e.y-e._b3y)/dt); e._b3v+=(v-e._b3v)*Math.min(1,dt*9); }
  e._b3x=e.x; e._b3y=e.y; e._b3g+=dt*Math.min(fmax,e._b3v*fk); B3.dt=dt;
  return e._b3v;
}
// eased pose numbers: B3.T holds this frame's targets; b3S(e) eases e's own copy toward them
const B3K=['c','l','s','h','n','i','b','m','w','ws','ears','tu','wag','lie','bound','hy','hp','daze','pant','eat','fold','sq','up'];
const B3RATE={l:20,m:18,w:16,ws:26,lie:5,s:6,h:8,bound:5,hy:6,hp:7,wag:5,eat:8,fold:8,sq:18,up:9};
function b3Tgt(){ const T=B3.T; for(const k of B3K) T[k]=0; return T; }
function b3S(e){
  let S=e._ws; const T=B3.T, snap=!S||e._snap; if(!S){ S=e._ws={}; }
  const dt=B3.dt;
  for(const k of B3K){ if(snap) S[k]=T[k]; else { const r=B3RATE[k]||12; S[k]+=(T[k]-S[k])*Math.min(1,dt*r); } }
  return S;
}
// one leg from a hip to a foot, bent at the knee (kd 1 bends forward, -1 back), ending in a paw or hoof
function b3Leg(hx,hy,hz,fx,fy,fz,L,r1,r2,col,col2,kd,prx,pry,prz,pcol){
  const dx=fx-hx, dz=fz-hz, d=Math.hypot(dx,dz)||1, h=L*0.5, m=d<L?Math.sqrt(h*h-d*d*0.25):0;
  const kx=(hx+fx)*0.5+(-dz/d)*m*kd, kz=(hz+fz)*0.5+(dx/d)*m*kd, ky=(hy+fy)*0.5;
  bL(hx,hy,hz,kx,ky,kz,r1,col,r1*0.82);
  bL(kx,ky,kz,fx,fy,fz+prz*0.7,r2,col2,r2*0.86);
  if(prx) bE(fx+prx*0.28,fy,fz+prz,prx,pry,prz,pcol);
}
// a soft round shadow on the ground (for things that fly or sit outside the world's own shadow pass)
function b3Shadow(x,y,r,a){ const s=pShadow(); ctx.save(); ctx.globalAlpha*=a; ctx.drawImage(s,x-r,y-r*0.5,r*2,r); ctx.restore(); }

// ================= wolves
const WPAL={
  grey:{fur:'#8f8d87',saddle:'#77756f',lite:'#d2cfc6',dark:'#4c4a46',paw:'#3c3a36',nose:'#1a1a18',ear:'#8a6a62',tail:'#3e3c38'},
  snow:{fur:'#d2d8de',saddle:'#adb6be',lite:'#f3f6f9',dark:'#7c8590',paw:'#6c757e',nose:'#2a2e34',ear:'#b8a0a8'},
  alpha:{fur:'#dde4ea',saddle:'#8fa2b6',lite:'#ffffff',dark:'#62748a',paw:'#56687c',nose:'#1e2228',ear:'#b8a0b0',crest:'#bfe6ff'},
  grey_king:{fur:'#e8edf2',saddle:'#c9d3dd',lite:'#ffffff',dark:'#66717e',paw:'#55606c',nose:'#1e2228',ear:'#c8a8b4',mane:'#f6f9fc',tip:'#a4b2c2'}
};
// the wolf figure. P: {k, pal, eye, glow, king (Greymane extras), crest (Frost Alpha), friendly}
function b3Wolf(e,P,S,face,X,Y,Z,fl){
  const pal=P.pal, t=G?G.time:0, king=!!P.king, a=Math.min(1,(e._b3v||0)/60), g=e._b3g||0, run=Math.min(1,(e._b3v||0)/150);
  const lift=S.l*3.4;
  t3Begin(X,Y,face,{k:P.k,flash:fl,z:Z+lift});
  b3Reset();
  if(S.lie>0.01){ const an=S.lie*1.48; b3Move(0,5.6*Math.sin(an),0); b3Rot(0,an,0,0,5.6); }
  if(S.daze>0.01) b3Rot(0,Math.sin(t*5)*0.07*S.daze,0,0,0);
  // torso: crouch lowers it and tips the front down, sitting pivots it up around the hips, a gallop rocks it
  const pvx=-6.6, pvz=9.6, trem=S.c>0.3?Math.sin(t*47)*0.35*S.c:0;
  const tp=S.c*0.13-S.s*0.74-S.w*0.26*(1-S.ws*0.6)+S.l*0.05+Math.sin(g)*0.07*run*S.bound*(1-S.l)+S.i*-0.08, drop=S.c*2.6+S.s*4.2-a*Math.abs(Math.sin(g))*0.7*(1-S.bound)*(1-S.s);
  const ctp=Math.cos(tp), stp=Math.sin(tp);
  // legs: a trot (diagonal pairs) that becomes a gallop at speed; leaps stretch them out, sitting folds the back ones
  const trot=1-S.bound;
  for(let i=0;i<4;i++){
    const front=i<2, sd=i%2?1:-1, hx0=front?6.6:-6.6, hy=sd*(front?3.0:3.25), hz0=front?8.8:9.6;
    const hdx=hx0-pvx, hdz=hz0-pvz, hx=pvx+ctp*hdx+stp*hdz+trem*0.2, hz=pvz-stp*hdx+ctp*hdz-drop;
    const off=trot*((front?0:Math.PI)+(sd>0?Math.PI:0))+S.bound*((front?0:Math.PI*0.95)+(sd>0?0.45:0));
    const ph=g+off, str=(front?4.3:4.7)*a*(1-S.s)*(1-S.lie);
    let fx=hx0+Math.sin(ph)*str+(front?0.4:-0.2), fz=Math.max(0,Math.cos(ph))*(2.4+run*1.6)*a*(1-S.s)*(1-S.lie), fy=hy*1.04;
    if(S.l>0.01){ fx=lerp(fx,hx0+(front?6.4:-6.2),S.l); fz=lerp(fz,front?3.6:2.4,S.l); }
    if(S.c>0.01){ fx=lerp(fx,hx0+(front?1.4:-1.6),S.c); fz*=1-S.c; }
    if(front){ fx=lerp(fx,hx-0.4+0.6,S.s); } else if(S.s>0.01){ fx=lerp(fx,hx+3.8,S.s); fz*=1-S.s; }
    if(front&&sd>0&&S.w>0.01){ fx=lerp(fx,hx+lerp(3.6,9.0,S.ws),S.w); fz=lerp(fz,lerp(12.5,1.4,S.ws),S.w); }
    if(S.lie>0.01){ fx=lerp(fx,hx0+(front?2.2:-2.4)+Math.sin(t*1.3+i)*0.3,S.lie); fz=lerp(fz,1.2,S.lie); }
    const L=front?9.7:10.4;
    b3Leg(hx,hy,hz,fx,fy,fz,L,front?2.25:2.55,front?1.45:1.55,pal.fur,front?pal.lite:pal.fur,front?1:-1,1.95,1.55,1.15,pal.paw);
    if(king&&front){ for(const cy of B3CLAW) bC(fx+1.9,fy+cy,fz+0.5,fx+3.0,fy+cy*1.2,fz+0.1,0.42,'#eef2f6'); }
  }
  // the torso group
  b3Push(); b3Move(0,0,-drop); b3Rot(1,tp,pvx,0,pvz); if(trem) b3Rot(0,trem*0.08,0,0,10);
  const br=1+Math.sin(t*2.2+b3Id(e))*0.025+S.i*0.12;
  bE(0,0,11.2,10.2,5.4*br,5.7*br,pal.fur);
  bE(-1.2,0,13.5,9.6,4.8,3.2,pal.saddle,0.03);
  bE(6.4,0,11.6,5.2,5.3*br,6.3*br,king?pal.mane:pal.lite,-0.1,0,0,-0.15);
  if(king) bE(-0.4,0,8.3,7.6,4.0,2.6,pal.lite,0,0,0,-0.4);
  bE(-6.8,0,11.5,4.8,5.25,5.5,pal.fur);
  if(king){ for(const xx of B3RIDGE) bC(xx,0,15.4,xx-3.6,0,18.6+Math.sin(t*3+xx)*0.3,1.7,pal.mane); bLn(4,-4.6,14.8,-3,-4.9,14.2,0.6,pal.tip); }
  // tail: wagging when happy, low and straight in a crouch or leap, curled on the ground when sitting
  {
    const wg=Math.sin(t*(S.wag>0.5?11:4.5))*(0.25+S.wag*0.75), e1=-0.42+S.tu*0.6-S.s*0.55+S.l*0.32, w1=wg*0.55+S.s*1.0, e2=e1-0.32-S.s*0.2, w2=wg*0.85+S.s*1.3;
    const bx=-10.3, bz=12.8, l1=king?5.6:4.8, l2=king?5.4:4.6, tr=king?3.6:2.9;
    const x1=bx-Math.cos(e1)*Math.cos(w1)*l1, y1=Math.cos(e1)*Math.sin(w1)*l1, z1=bz+Math.sin(e1)*l1;
    const x2=x1-Math.cos(e2)*Math.cos(w2)*l2, y2=y1+Math.cos(e2)*Math.sin(w2)*l2, z2=Math.max(1.5,z1+Math.sin(e2)*l2);
    bL(bx,0,bz,x1,y1,z1,2.1,pal.fur,tr);
    bL(x1,y1,z1,x2,y2,z2,tr,pal.fur,tr*0.55);
    bB(x2+(x2-x1)*0.08,y2+(y2-y1)*0.08,z2+(z2-z1)*0.08,tr*0.62,pal.tail||pal.lite,0.01);
  }
  // neck and head (the neck group lowers for sniffing and crouching, the head group tips up to howl)
  b3Push();
  const nk=S.n*0.78+S.c*0.42+S.b*0.18-S.i*0.12+S.daze*0.3+S.lie*0.1, hp=-S.h*1.0-S.i*0.3+S.hp;
  b3Rot(1,nk,6.6,0,13.2);
  if(S.hy) b3Rot(2,S.hy,7.5,0,14);
  bL(6.8,0,13.6,10.6,0,16.6,4.3,king?pal.mane:pal.fur,3.7);
  bE(10.6,0,14.2,3.0,3.3,3.5,pal.lite,0,0,0,0.05);
  if(king){ // the great white mane, in shaggy tufts all round the neck
    bE(8.2,0,15.4,5.4,6.6,6.9,pal.mane,0.1);
    for(let j=0;j<7;j++){ const an=-1.35+j*0.45, cs=Math.cos(an), sn=Math.sin(an); bC(8.4,sn*4.6,15.6+cs*4.6,4.6,sn*7.6,15.0+cs*7.0,3.1,j%2?pal.mane:'#e4ebf2'); }
  }
  b3Push();
  b3Rot(1,hp,11,0,16.2);
  const hz=17.6, sn=Math.sin(t*7)*0.15*(S.n>0.4?1:0);
  bE(12.8,0,hz,5.8,5.3,5.1,pal.fur);
  if(king) bE(12.0,0,hz+2.9,4.4,3.5,2.0,pal.saddle,0.05);
  for(const s of B3SD){ bC(12.4,s*3.8,hz-1.5,9.6,s*6.5,hz-2.6,king?2.4:1.85,pal.lite); }
  // muzzle, nose and the jaw that opens to bite, pant or howl
  bE(17.3,0,hz-1.5,4.5,2.8,2.5,pal.lite,0.12);
  if(king) bE(16.9,0,hz+0.1,3.8,2.0,1.3,pal.fur,0.18,0,0,0.02);
  bB(21.2+sn,0,hz-0.8,1.4,pal.nose,0.05); if(king) bD(21.4+sn,-0.3,hz-0.25,0.42,'#ffffff',0.06);
  const mo=S.m;
  if(mo>0.06){ bE(17.0,0,hz-2.5,3.5,1.85,1.0,'#5a1a1c',0,0,0,-0.03); }
  b3Push(); b3Rot(1,mo*0.62,13.4,0,hz-1.9);
  bE(16.8,0,hz-3.1,3.8,2.2,1.2,pal.lite,0.08);
  if(mo>0.5||S.pant>0.5){ const tl=S.pant*1.4+mo*0.6; bE(17.9,0.5,hz-3.8-tl*0.6,1.7+tl*0.4,1.35,0.6,'#e07a8a',0.5,0,0,0.04); }
  if(mo>0.5) for(const s of B3SD) bC(19.4,s*1.25,hz-2.6,19.5,s*1.25,hz-1.6,0.45,'#f6f2e6',0.03);
  b3Pop();
  if(mo>0.3) for(const s of B3SD) bC(19.6,s*1.25,hz-1.3,19.7,s*1.25,hz-2.7,0.48,'#f6f2e6',0.03);
  // eyes (glowing for the alphas), fierce brows, and the ears that flatten back
  const ec=P.eye;
  for(const s of B3SD){
    if(S.lie>0.6){ bLn(16.0,s*2.5,hz+0.7,17.1,s*2.2,hz+1.0,0.55,pal.nose,0.03); }
    else{ if(P.ring) bD(16.08,s*2.47,hz+0.8,king?1.55:1.35,P.ring,0.015); bEye(16.1,s*2.45,hz+0.8,king?1.15:1.05,ec,true); }
    if(!P.friendly) bLn(15.2,s*1.5,hz+2.3,17.0,s*2.8,hz+1.6,0.75,pal.dark,0.04);
    const eb=S.ears, ex=lerp(10.4,7.6,eb), ez=lerp(hz+9.2,hz+5.6,eb);
    bC(11.4,s*2.9,hz+3.4,ex,s*(3.8+eb*0.5),ez,king?2.5:2.1,pal.dark);
    bC(12.0,s*2.85,hz+3.5,lerp(ex+0.7,ex+0.4,eb),s*(3.45+eb*0.4),ez-1.2,king?1.6:1.35,pal.ear,0.02);
  }
  if(P.crest){ for(let j=0;j<3;j++) bC(9.4-j*2.4,0,hz+2.8-j*1.2,7.2-j*2.6,0,hz+6.8-j*1.4,1.35,pal.crest); }
  if(king) bLn(14.2,-3.6,hz+3.5,16.9,-1.5,hz-0.4,0.6,'#5a6472',0.05);
  // where the eyes and mouth are on screen (glows, breath)
  if(P.glow||S.b>0.05||S.i>0.05||S.h>0.05){ b3Scr(16.3,-2.45,hz+0.8,B3.eyeL||(B3.eyeL=[0,0,0])); b3Scr(16.3,2.45,hz+0.8,B3.eyeR||(B3.eyeR=[0,0,0])); b3Scr(22,0,hz-1.7,B3.mouth||(B3.mouth=[0,0,0])); B3.eyeVis=b3Faces(1,0,0); }
  b3Pop(); b3Pop(); b3Pop();
  t3End();
}
// glows drawn over the figure after t3End: the eyes, the frost breath, howl rings
function b3WolfFx(S,P,k){
  const t=G.time;
  if(P.glow&&B3.eyeL){ const v=clamp(0.55+B3.eyeVis*0.9,0,1); if(v>0.02){ const r=(P.king?5:3.2)*k, a=(P.king?0.75:0.5)*v*(P.glowA||1); glowAt(B3.eyeL[0],B3.eyeL[1],r,P.glow,a); glowAt(B3.eyeR[0],B3.eyeR[1],r,P.glow,a); } }
  if((S.b>0.05||S.i>0.05)&&B3.mouth){ const m=B3.mouth, a=S.b*0.9+S.i*0.5; glowAt(m[0],m[1],(6+S.b*6+Math.sin(t*20)*1.2)*k,'150,205,255',a*0.8); glowAt(m[0],m[1],(3+S.b*2)*k,'235,245,255',a*0.7); if(S.i>0.3) glowAt(m[0],m[1],4*k,'255,255,255',S.i*0.6); }
  if(S.h>0.4&&B3.mouth){ const m=B3.mouth; ctx.save(); ctx.lineCap='round'; for(let i=0;i<3;i++){ const q=(t*1.6+i/3)%1, r=(4+q*16)*k; ctx.strokeStyle=`rgba(225,240,255,${(1-q)*0.7*S.h})`; ctx.lineWidth=1.6*k*(1-q*0.5); ctx.beginPath(); ctx.arc(m[0],m[1]-2*k,r,-Math.PI*0.85,-Math.PI*0.15); ctx.stroke(); } ctx.restore(); }
}
function wolfEye(night){ return night?'#ffe066':'#d0a43e'; }
// one reused settings object for the wolf drawer (nothing allocated per frame)
const B3WP={};
function b3WP(k,pal,eye,glow,king,friendly){ const P=B3WP; P.k=k; P.pal=pal; P.eye=eye; P.glow=glow; P.king=king; P.friendly=friendly; P.glowA=1; P.crest=false; P.ring=null; return P; }
T3E.wolf=(e,fl)=>{
  const boss=!!e.caveBoss, pal=boss?WPAL.alpha:e.snowy?WPAL.snow:WPAL.grey, k=e.r/13*(boss?1.08:1);
  const v=b3Motion(e,0.085,16), T=b3Tgt(), t=G.time, st=e.state;
  T.bound=v>150?1:0; T.pant=v>60&&e.aggro?0.6:0; T.m=T.pant?0.22+Math.max(0,Math.sin(t*10))*0.2:0;
  if(e.stun>0){ T.daze=1; T.ears=1; T.n=0.25; T.m=0.15; }
  else if(!e.aggro&&!e.returning){
    if(v<14){ const u=((e.t||0)*0.13+b3Id(e)*0.31)%1; if(e.waiting&&u<0.55) T.s=1; else if(u>0.25) T.n=1; T.hy=Math.sin((e.t||0)*0.7+b3Id(e))*0.35*(1-T.n); }
  }
  else if(st==='crouch'){ T.c=1; T.ears=1; T.tu=-0.5; T.m=0.3; T.pant=0; }
  else if(st==='lunge'){ T.l=1; T.m=1; T.ears=0.85; T.tu=0.1; T.bound=1; }
  else if(st==='recover'){ T.ears=0.3; }
  const S=b3S(e), face=t3Turn(e,e.face,13), X=e.x, Y=e.y+e.r*0.45, night=isNight()||!!e.inArea;
  const P=b3WP(k,pal,boss?'#a8ecff':wolfEye(night),boss?'140,220,255':night?'255,214,90':null,false,false); P.glowA=boss?1:0.5; P.crest=boss;
  b3Wolf(e,P,S,face,X,Y,0,fl);
  b3WolfFx(S,P,k);
  e._t3top=Y-(26+S.l*3.4-S.s*1)*k*T3.st;
};
// how long ago e changed state (and what it was before), for follow-through poses
function b3State(e,st){ const t=G.time; if(e._b3ps!==st){ e._b3pp=e._b3ps; e._b3ps=st; e._b3t0=t; } return t-(e._b3t0==null?t:e._b3t0); }
// claw streaks after a swipe, in the air in front of the paw
function b3Claws(x,y,face,k,q){
  if(q<=0||q>=1) return;
  ctx.save(); ctx.translate(x,y); ctx.rotate(face); ctx.lineCap='round';
  for(let i=-1;i<=1;i++){ ctx.strokeStyle=`rgba(235,245,255,${0.85*(1-q)})`; ctx.lineWidth=2.2*k*(1-q*0.5); ctx.beginPath(); ctx.arc(-4*k,i*5*k,22*k,-0.75+q*0.3,0.55+q*0.6); ctx.stroke(); }
  ctx.restore();
}
// ---------- Greymane, the Alpha of the Frostpine Pack (the Frost Ward boss)
T3E.greymane=(e,fl)=>{
  const k=1.8, v=b3Motion(e,0.06,12), T=b3Tgt(), t=G.time, st=e.state, since=b3State(e,st);
  T.bound=v>140?1:0; T.pant=v>40?0.4:0; T.m=0.12+(v>40?Math.max(0,Math.sin(t*8))*0.18:0);
  switch(st){
    case 'howl': { const p=clamp(1-e.st/1.0,0,1); T.s=1; T.h=p>0.12?1:0.5; T.m=p>0.2?1:0.3; T.ears=0.35; T.pant=0; break; }
    case 'swipeW': T.w=1; T.ws=0; T.ears=0.7; T.m=0.55; T.hy=-0.15; break;
    case 'pounceW': T.c=1; T.ears=1; T.m=0.55; T.tu=-0.4; T.pant=0; break;
    case 'pounce': T.l=1; T.m=1; T.ears=0.9; T.bound=1; break;
    case 'frostW': T.i=1; T.m=0; T.ears=0.25; T.pant=0; break;
    case 'frost': T.b=1; T.m=1; T.ears=0.55; T.pant=0; break;
    case 'recover': if(e._b3pp==='swipeW'&&since<0.3){ T.w=1-clamp((since-0.12)/0.18,0,1); T.ws=1; T.m=0.7; } else if(e._b3pp==='howl'&&since<0.35){ T.s=1; T.h=0.6; } T.ears=0.3; break;
  }
  if(e.stun>0){ T.daze=1; T.ears=1; T.n=0.2; }
  const S=b3S(e), face=t3Turn(e,e.face,10), X=e.x, Y=e.y+e.r*0.45;
  const P=b3WP(k,WPAL.grey_king,'#ffb24a','255,150,50',true,false); P.ring='#3a1a08';
  b3Wolf(e,P,S,face,X,Y,0,fl);
  b3WolfFx(S,P,k);
  if(st==='recover'&&e._b3pp==='swipeW') b3Claws(X+Math.cos(face)*30,Y-14+Math.sin(face)*22,face,1.4,since/0.3);
  e._t3top=Y-(28+S.l*3.4)*k*T3.st;
};
// Greymane fighting beside Ash in the final battle (bites Vorlaxis now and then)
T3A.grey=a=>{
  const k=1.9, v=b3Motion(a,0.06,12), T=b3Tgt(), t=G.time;
  T.bound=v>140?1:0; T.pant=0.6; T.m=0.25+Math.max(0,Math.sin(t*9))*0.2; T.wag=0.2;
  if(a.cd>6.55){ T.l=1; T.m=1; T.ears=0.8; } else if(a.cd>6.2){ T.m=0.6; }
  const S=b3S(a), face=t3Turn(a,a.face,10), X=a.x, Y=a.y+10;
  b3Shadow(X,Y-2,30,0.3);
  const P=b3WP(k,WPAL.grey_king,'#a8e4ff','122,200,255',true,true); P.ring='#10202e';
  b3Wolf(a,P,S,face,X,Y,0,false);
  b3WolfFx(S,P,k);
};
// Greymane as a companion: bites (a lunge and a snap), howls, sits when Ash waits, and lies down when knocked over
T3C.greymane=(c,v,down)=>{
  const k=1.55, sp=b3Motion(c,0.065,13), T=b3Tgt(), t=G.time, dt=B3.dt;
  if(c.howlT>0) c.howlT-=1/60;
  c._b3still=sp<10&&!c.act?(c._b3still||0)+dt:0;
  T.bound=sp>170?1:0; T.pant=sp>40?0.7:0.35; T.m=0.2+(sp>40?Math.max(0,Math.sin(t*9))*0.2:Math.max(0,Math.sin(t*3))*0.1); T.wag=G.inCombat?0.15:0.8;
  if(down){ T.lie=1; T.m=0.4; T.pant=1; T.ears=0.8; T.wag=0; }
  else if(c.howlT>0){ T.s=1; T.h=1; T.m=1; T.ears=0.3; T.pant=0; T.wag=0; }
  else if(c.act==='lunge'){ T.l=1; T.m=1; T.ears=0.85; T.bound=1; T.wag=0; }
  else if(c.snap>0){ T.m=1; T.ears=0.6; }
  else if(c.mode==='stay'||c._b3still>1.6){ T.s=1; }
  if(!down&&!c.act&&!G.inCombat&&player&&sp<10){ const d=dist(c.x,c.y,player.x,player.y); if(d<140) T.hy=clamp(angDiff(c._vf==null?c.face:c._vf,angTo(c.x,c.y,player.x,player.y)),-0.6,0.6)*0.8; }
  const S=b3S(c), face=t3Turn(c,c.face,11), X=c.x, Y=c.y+c.r*0.45;
  b3Shadow(X,Y-1,down?30:25,0.32);
  const P=b3WP(k,WPAL.grey_king,'#a8e4ff','122,200,255',true,true); P.ring='#10202e';
  b3Wolf(c,P,S,face,X,Y,0,false);
  b3WolfFx(S,P,k);
  if(c.snap>0){ c.snap-=1/60; const hx=c.x+Math.cos(face)*34, hy=c.y-12+Math.sin(face)*26; ctx.save(); ctx.translate(hx,hy); ctx.rotate(face); ctx.strokeStyle=`rgba(255,255,255,${clamp(c.snap*4,0,1)})`; ctx.lineWidth=2; ctx.lineCap='round'; for(const s of B3SD){ ctx.beginPath(); ctx.moveTo(-2,s*7); ctx.lineTo(6,s*2); ctx.stroke(); } ctx.restore(); }
};
// Greymane waiting by the Frost Ward for Ash to ask him along
T3C.greywait=W=>{
  const k=1.55, t=G.time, T=b3Tgt(); b3Motion(W,0.06,12);
  W.t=t;
  const near=player?dist(W.x,W.y,player.x,player.y):999;
  T.s=1; T.wag=near<220?1:0; T.pant=near<220?0.8:0.3; T.m=0.15+Math.max(0,Math.sin(t*(near<220?8:2.5)))*0.2; T.ears=near<220?0:0.25;
  if(isNight()&&((t*0.05)%1)<0.12){ T.h=1; T.m=1; T.pant=0; }
  const S=b3S(W), face=t3Turn(W,W.face,6), X=W.x, Y=W.y+9;
  b3Shadow(X,Y-1,27,0.34);
  const P=b3WP(k,WPAL.grey_king,'#a8e4ff','122,200,255',true,true); P.ring='#10202e';
  b3Wolf(W,P,S,face,X,Y,0,false);
  b3WolfFx(S,P,k);
  if(!(G.comps&&G.comps.greymane)) drawMarker(W.x,W.y-46,'!',t);
};

// a roll that lays a figure on its side or back: the body (centre height zb) comes to rest at height zr
function b3Lay(ang,zb,zr){ const c=Math.cos(ang); if(Math.abs(1-c)<1e-4) return; const zc=(zr-zb*c)/(1-c); b3Move(0,(zb-zc)*Math.sin(ang),0); b3Rot(0,ang,0,0,zc); }

// ================= Duchess, the proud and rude goat (white, a golden tiara, a red collar with a bell)
const GPAL={fur:'#f5f1e7',shade:'#e4ddcd',lite:'#fffdf6',hoof:'#3a302a',horn:'#ad986c',nose:'#efdcd4',gold:'#f2c84a'};
function b3Goat(n,S,face,X,Y,Z,fl){
  const P=GPAL, t=G?G.time:0, a=Math.min(1,(n._b3v||0)/45), g=n._b3g||0, run=Math.min(1,(n._b3v||0)/220), seed=b3Id(n);
  t3Begin(X,Y,face,{k:1,flash:fl,z:Z+S.l*1.6});
  b3Reset();
  if(S.lie>0.01) b3Lay(S.lie*2.45,10.6,5.2);
  if(S.daze>0.01) b3Rot(0,Math.sin(t*6)*0.06*S.daze,0,0,0);
  if(S.w>0.3) b3Rot(0,Math.sin(t*38)*0.035,0,0,6);
  const tp=S.c*0.12+S.l*0.05+Math.sin(g)*0.06*run*S.bound, drop=S.c*1.4-a*Math.abs(Math.sin(g))*0.5*(1-S.bound), ctp=Math.cos(tp), stp=Math.sin(tp), pvx=-5.8, pvz=8.8;
  // legs: a bouncy trot, a gallop when charging, a hoof pawing the ground before a charge, stiff in the air when fainted
  const trot=1-S.bound;
  for(let i=0;i<4;i++){
    const front=i<2, sd=i%2?1:-1, hx0=front?5.6:-5.8, hy=sd*(front?2.7:2.85), hz0=front?8.4:8.8;
    const hdx=hx0-pvx, hdz=hz0-pvz, hx=pvx+ctp*hdx+stp*hdz, hz=pvz-stp*hdx+ctp*hdz-drop;
    const ph=g+trot*((front?0:Math.PI)+(sd>0?Math.PI:0))+S.bound*((front?0:Math.PI)+(sd>0?0.4:0)), str=(front?3.6:3.9)*a*(1-S.lie);
    let fx=hx0+Math.sin(ph)*str, fz=Math.max(0,Math.cos(ph))*(2.0+run*1.8)*a*(1-S.lie), fy=hy*1.05;
    if(S.l>0.01){ fx=lerp(fx,hx0+(front?4.8:-4.6),S.l*0.7); }
    if(front&&sd>0&&S.w>0.01){ fx=lerp(fx,hx+1.2+Math.sin(t*17)*2.4,S.w); fz=lerp(fz,1.0+Math.max(0,Math.cos(t*17))*1.6,S.w); }
    if(S.lie>0.01){ fx=lerp(fx,hx0+(front?1.6:-1.6),S.lie); fz=lerp(fz,0,S.lie); }
    b3Leg(hx,hy,hz,fx,fy,fz,S.lie>0.5?hz:8.9,1.85,1.15,P.fur,P.fur,front?1:-1,1.25,1.05,0.95,P.hoof);
  }
  b3Push(); b3Move(0,0,-drop); b3Rot(1,tp,pvx,0,pvz);
  const br=1+Math.sin(t*2.4+seed)*0.025;
  bE(0,0,10.6,9.0,5.3*br,5.4*br,P.fur);
  bE(0.2,0,8.0,7.0,4.0,2.6,P.shade,0,0,0,-0.3);
  bE(-6.2,0,10.8,4.2,4.9,5.0,P.fur);
  bE(5.2,0,10.6,4.6,4.8,5.6,P.fur);
  // a perky little tail that never stops flicking
  { const wg=Math.sin(t*(a>0.3?15:5)+seed)*(0.8+S.tu*0.6), tz=16.0+S.tu*1.2-S.lie*2; bL(-8.4,0,12.8,-10.0,wg*0.9,tz,1.35,P.fur,0.75); }
  // neck, collar and bell
  b3Push();
  const nk=S.c*0.6+S.eat*1.05+S.lie*0.9+S.daze*0.2-S.up*0.1;
  b3Rot(1,nk,5.4,0,12.2);
  bL(5.4,0,12.4,8.6,0,17.0,3.0,P.fur,2.45);
  bE(6.7,0,13.6,1.15,3.35,3.35,'#c83a5a',-1.0);
  { const bs=Math.sin(t*(a>0.3?14:3))*0.5*(0.4+a); bB(8.2+bs*0.3,bs*0.6,11.5,1.25,P.gold,0.02); }
  // the head: nose in the air (haughty), turned away from whoever is looking, always chewing something
  b3Push();
  if(S.up>0.01) b3Move(S.up*2.6,0,-S.up*1.2);
  b3Rot(1,-0.28+S.c*0.62+S.up*0.35+S.hp+S.eat*0.15,8.6,0,17.0);
  if(S.hy) b3Rot(2,S.hy,8.6,0,17.0);
  if(S.daze>0.01) b3Rot(0,Math.sin(t*7)*0.3*S.daze,8.6,0,17.4);
  const chew=Math.sin(t*(S.sq>0.3?13:6.5))*(0.35+S.sq*0.4)*(S.m>0.5?0:1);
  bE(10.1,0,18.7,4.4,3.5,3.7,P.fur);
  bB(10.4,0,21.4,1.7,P.lite,0.01);
  bE(13.6,0,17.7,3.4,2.45,2.45,P.nose,0.25);
  if(S.m>0.1) bE(13.8,0,16.4,1.9,1.4,0.8,'#6a2a2a',0,0,0,-0.02);
  b3Push(); b3Rot(1,S.m*0.55,11.2,0,17.0);
  bE(13.6,chew*0.5,16.0-S.m*0.3,2.6,1.75,1.0,P.nose,0.1);
  bC(12.8,chew*0.3,15.8,12.3,chew*0.6,12.2,1.2,'#e6dcc6');
  b3Pop();
  if(S.sq>0.05) for(const s of B3SD) bB(12.2,s*(1.9+S.sq*0.4),17.1,1.3*S.sq+0.4,P.fur,0.02);
  // unimpressed half-closed eyes with goat pupils (crossed out when she has fainted)
  for(const s of B3SD){
    if(S.lie>0.6){ bLn(11.4,s*3.0,19.0,12.6,s*2.8,20.0,0.5,'#3a2a1a',0.04); bLn(11.4,s*3.0,20.0,12.6,s*2.8,19.0,0.5,'#3a2a1a',0.04); continue; }
    bEye(12.0,s*2.95,19.5,1.12,'#d8a43a',false);
    bLn(11.55,s*3.0,19.46,12.4,s*2.9,19.46,0.48,'#1a120a',0.025);
    const q=b3T(12.02,s*2.96,19.5,B3.q3); t3Dot(q[0],q[1],q[2]+0.72,1.06,'#e2d9c8',0.035);
  }
  // ears out to the sides, curved horns, and the tiara
  const ef=Math.sin(t*1.7+seed)*0.4-S.c*0.8;
  for(const s of B3SD){
    bC(9.4,s*2.6,19.6,8.4,s*6.9,18.7+ef,1.35,'#ece6d9');
    bC(9.7,s*2.7,19.5,8.8,s*6.2,18.6+ef,0.75,'#eab8b0',0.02);
    bL(9.3,s*1.3,21.2,7.4,s*2.0,24.0,1.15,P.horn,0.85);
    bL(7.4,s*2.0,24.0,4.9,s*2.7,23.0,0.85,P.horn,0.3);
  }
  bE(10.5,0,22.5,1.1,2.0,0.5,P.gold,0,0,0,0.02);
  bC(10.8,0,22.8,11.0,0,25.4,0.65,P.gold,0.02); bC(10.5,-1.3,22.6,10.7,-1.5,24.4,0.55,P.gold,0.02); bC(10.5,1.3,22.6,10.7,1.5,24.4,0.55,P.gold,0.02);
  bD(11.4,0,23.1,0.65,'#ff6a9a',0.04); bD(11.5,-0.2,23.35,0.22,'#ffffff',0.05);
  b3Pop(); b3Pop(); b3Pop();
  t3End();
}
function b3GoatState(n,T){
  // snub: turn her nose away from Ash when he comes close and stands there
  const pl=typeof player!=='undefined'?player:null; let snub=0;
  if(pl&&(n._b3v||0)<12&&dist(n.x,n.y,pl.x,pl.y)<120){ const a=angDiff(n._vf==null?n.face:n._vf,angTo(n.x,n.y,pl.x,pl.y)); snub=-Math.sign(a||1)*0.55; }
  T.hy=snub+Math.sin((G?G.time:0)*0.8+b3Id(n))*0.18;
}
T3B.goat=n=>{
  const v=b3Motion(n,0.13,15), T=b3Tgt(); b3GoatState(n,T);
  T.bound=v>200?1:0;
  const S=b3S(n), face=t3Turn(n,n.face,10), X=n.x, Y=n.y+(n.r||10)*0.45;
  b3Goat(n,S,face,X,Y,0,false);
};
// Duchess as a companion: winds up (pawing the ground), charges horns first, head-butts, eats loot (and spits out coins)
T3C.duchess=(c,v,down)=>{
  const sp=b3Motion(c,0.13,16), T=b3Tgt(), t=G.time;
  b3GoatState(c,T); T.bound=sp>200?1:0;
  if(down){ T.lie=1; T.hy=0; }
  else if(c.act==='wind'){ T.c=1; T.w=1; T.tu=1; T.hy=0; }
  else if(c.act==='charge'){ T.c=1; T.l=1; T.bound=1; T.hy=0; }
  else if(c.act==='recover'){ T.daze=1; T.hy=0; }
  if(!down&&c.butt>0){ T.up=1; T.c=0.6; T.hy=0; }
  if(!down&&c.eat&&dist(c.x,c.y,c.eat.x,c.eat.y)<40){ T.eat=1; T.hy=0; }
  if(!down&&c.spit>0){ T.sq=1; if(c.spit<0.3){ T.m=1; T.sq=0.3; } }
  if(c.butt>0) c.butt-=1/60;
  if(c.act==='charge'){ ctx.save(); ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=1.4; for(let i=-1;i<=1;i++){ const ox=-Math.sin(c.dir)*i*6, oy=Math.cos(c.dir)*i*6; ctx.beginPath(); ctx.moveTo(c.x-Math.cos(c.dir)*16+ox,c.y-Math.sin(c.dir)*16+oy); ctx.lineTo(c.x-Math.cos(c.dir)*(30-Math.abs(i)*6)+ox,c.y-Math.sin(c.dir)*(30-Math.abs(i)*6)+oy); ctx.stroke(); } ctx.restore(); }
  const S=b3S(c), face=t3Turn(c,c.face,c.act==='charge'||c.act==='wind'?18:11), X=c.x, Y=c.y+c.r*0.45;
  b3Shadow(X,Y-1,15,0.3);
  b3Goat(c,S,face,X,Y,0,false);
};

// ================= Pip, the baby dragon: big shiny eyes, stubby flapping wings, an ember on his tail ("Mip!")
const PPAL={skin:'#f2884a',dark:'#c8582a',belly:'#ffd9a2',snout:'#ffc48e',horn:'#fff0d0',wing:'#ffab6a',wingE:'#b84a1e',spine:'#ffd27a',blush:'#ff8f86'};
// a big cartoon eye: dark rim, white, a big shiny pupil and two highlights (or a happy closed arc)
function bEyeBig(x,y,z,r,happy,iris){
  const a=b3T(x,y,z,B3.q3), R=T3R, lx=-R.c, ly=R.s;
  if(happy){ const p=b3T(x,y,z,B3.q); t3Line(p[0]-lx*r*0.8,p[1]-ly*r*0.8,p[2]-r*0.15,p[0],p[1],p[2]+r*0.45,r*0.42,'#3a1608',0.03); t3Line(p[0],p[1],p[2]+r*0.45,p[0]+lx*r*0.8,p[1]+ly*r*0.8,p[2]-r*0.15,r*0.42,'#3a1608',0.031); return; }
  t3Dot(a[0],a[1],a[2],r*1.15,'#3a1608',0.02); t3Dot(a[0],a[1],a[2],r,'#ffffff',0.021);
  t3Dot(a[0]-lx*r*0.05,a[1]-ly*r*0.05,a[2]-r*0.06,r*0.84,iris||'#2a1206',0.022);
  t3Dot(a[0]+lx*r*0.28,a[1]+ly*r*0.28,a[2]+r*0.32,r*0.32,'#ffffff',0.023);
  t3Dot(a[0]-lx*r*0.3,a[1]-ly*r*0.3,a[2]-r*0.32,r*0.14,'#ffffff',0.024);
}
// shared baby dragon (Pip, and Puff the hatchling with o.puff): o = {flap, m (mouth), happy, hp (head pitch), hr (head roll), hy, legs, sleep, shell}
function b3Dragon(q,o,face,X,Y,Z,k,fl,PAL){
  const t=G?G.time:0, seed=b3Id(q);
  t3Begin(X,Y,face,{k,flash:fl,z:Z});
  b3Reset();
  if(o.sleep) b3Rot(1,0.15,0,0,0);
  // body and belly
  bE(-0.8,0,6.4,4.8,4.0,4.4,PAL.skin,-0.25);
  bE(0.7,0,5.7,3.5,3.0,3.5,PAL.belly,-0.25,0,0,0.03);
  // stubby legs paddling in the air (tucked in when asleep)
  const pd=o.sleep?0:Math.sin(t*6+seed)*0.6;
  for(const s of B3SD){
    bL(2.0,s*2.3,4.2,2.8+pd*s*0.5,s*2.6,1.7+o.legs*-0.8,1.25,PAL.skin,1.05); bB(3.1+pd*s*0.5,s*2.6,1.2+o.legs*-0.8,1.1,PAL.belly);
    bL(-2.6,s*2.6,4.2,-2.0-pd*s*0.5,s*2.9,1.4+o.legs*-0.6,1.55,PAL.skin,1.3); bB(-1.6-pd*s*0.5,s*3.0,0.9+o.legs*-0.6,1.3,PAL.belly);
  }
  // tail with a little ember flame on the tip
  { const w1=Math.sin(t*5+seed)*1.4, w2=Math.sin(t*5+seed+0.9)*2.4, w3=Math.sin(t*5+seed+1.7)*3.0, cs=o.sleep?1:0;
    const x1=-8, y1=w1+cs*3, z1=3.6, x2=-10.8+cs*2.6, y2=w2+cs*6.4, z2=4.2-cs*2.2, x3=-12.6+cs*6.2, y3=w3+cs*8.6, z3=6.0-cs*4.6;
    bL(-4.6,0,4.8,x1,y1,z1,1.95,PAL.skin,1.45); bL(x1,y1,z1,x2,y2,z2,1.45,PAL.skin,1.0); bL(x2,y2,z2,x3,y3,z3,1.0,PAL.skin,0.6);
    if(!o.puff){ bC(x3,y3,z3,x3-1.6,y3,z3+2.4+Math.sin(t*14)*0.4,1.05,'#ffb040',0.02); bB(x3,y3,z3+0.2,0.85,'#ffe28a',0.03); b3Scr(x3-0.6,y3,z3+1.4,B3.tip||(B3.tip=[0,0,0])); }
  }
  // soft spines down the back
  bC(-1.4,0,10.4,-3.2,0,11.6,0.95,PAL.spine); bC(-3.4,0,8.0,-5.4,0,8.6,0.85,PAL.spine);
  // wings: stubby, flapping fast (folded when asleep)
  const fa=o.flap;
  for(const s of B3SD){
    b3Push(); b3Rot(0,s*fa,0,s*2.4,9.2);
    bF(0,0.6,s*2.4,9.6); bF(1,-0.6,s*8.4,10.8); bF(2,-2.8,s*7.0,9.4); bF(3,-4.2,s*4.8,9.0); bF(4,-3.2,s*2.4,8.8);
    bP(5,PAL.wing,PAL.wingE,-0.01);
    bL(0.4,s*2.4,9.6,-0.6,s*8.4,10.8,0.62,PAL.dark,0.4,0.02);
    b3Pop();
  }
  // the big round head
  b3Push(); b3Rot(1,o.hp,3.0,0,9.0); if(o.hy) b3Rot(2,o.hy,3.0,0,9.0); if(o.hr) b3Rot(0,o.hr,3.0,0,9.0);
  bE(4.6,0,11.6,5.4,5.2,5.0,PAL.skin);
  bE(8.8,0,10.4,2.9,2.8,2.2,PAL.snout,0.15);
  bD(11.3,-0.9,10.9,0.38,'#8a3010',0.03); bD(11.3,0.9,10.9,0.38,'#8a3010',0.03);
  if(o.m>0.05){ bE(9.4,0,9.0,1.7*o.m+0.4,1.5,0.9*o.m+0.2,'#7a1a10',0,0,0,0.02); bE(9.6,0,8.7-o.m*0.5,1.1,1.0,0.4,'#ff8a8a',0,0,0,0.025); }
  for(const s of B3SD){
    bD(8.0,s*3.7,9.9,1.15,PAL.blush,0.015);
    if(b3Faces(0.8,s*0.55,0.2)>-0.12){
      if(o.sleep){ bLn(7.4,s*2.8,12.4,8.4,s*2.4,12.0,0.5,'#3a1608',0.03); }
      else bEyeBig(8.0,s*2.75,12.6,2.25,o.happy);
    }
    bC(3.9,s*1.9,15.4,3.3,s*2.4,18.6,0.95,PAL.horn);
    bC(3.4,s*4.3,12.8,0.6,s*7.4,13.8-fa*0.8,1.5,PAL.dark);
  }
  bC(1.0,0,15.0,-1.0,0,16.4,0.9,PAL.spine);
  if(o.shell){ bE(3.8,0,15.6,3.4,3.6,1.6,'#fbf2dc',0,0,0.15,0.04); for(let j=0;j<4;j++){ const an=j*1.6; bC(3.8+Math.cos(an)*2.6,Math.sin(an)*2.8,16.0,3.8+Math.cos(an)*2.9,Math.sin(an)*3.1,17.8,0.9,'#f4ead0',0.04); } }
  b3Scr(11.6,0,10.0,B3.mouth||(B3.mouth=[0,0,0]));
  b3Pop();
  t3End();
}
T3B.pip=q=>{
  const t=G.time, k=1.12;
  if(q._b3cd!=null&&q.cd>q._b3cd+0.4) q._b3shot=t; q._b3cd=q.cd;
  if(q._b3ch!=null&&q.chirp>q._b3ch+5) q._b3chirp=t; q._b3ch=q.chirp;
  const F=q.fx, shot=clamp((t-(q._b3shot||-9))/0.32,0,1), chirp=t-(q._b3chirp||-9)<0.8, excited=!!(F&&F.pt), carry=!!(F&&F.fetch&&F.fetch._pip);
  const O=B3.pipO||(B3.pipO={});
  const sk=shot<1?1-shot:0;
  O.flap=0.35+Math.sin(t*(carry||excited?30:22))*0.85; O.m=Math.max(sk,chirp?0.7:0); O.happy=chirp||excited; O.hp=-sk*0.3+Math.sin(t*1.1)*0.05; O.hr=Math.sin(t*1.3)*0.16; O.hy=0; O.legs=carry?1:0; O.sleep=false; O.shell=false; O.puff=false;
  const bob=Math.sin(t*5)*2.2+(excited?Math.abs(Math.sin(t*9))*3:0)+(chirp?Math.sin(clamp((t-q._b3chirp)/0.5,0,1)*Math.PI)*4:0);
  const face=t3Turn(q,q.face,9), X=q.x, Y=q.y+6, Z=10+bob-sk*1.5;
  b3Shadow(X,Y,8.5-bob*0.3,0.24);
  b3Dragon(q,O,face,X,Y,Z,k,false,PPAL);
  if(B3.tip) glowAt(B3.tip[0],B3.tip[1],6+Math.sin(t*9)*1.2,'255,170,70',0.45);
  if(sk>0&&B3.mouth) glowAt(B3.mouth[0],B3.mouth[1],9*sk+3,'255,170,70',0.85*sk);
};

// a flattened plate lying on an ellipsoid's surface (turtle scutes): centre (cx,cy,cz), radii (ax,ay,az), at azimuth a and elevation el
function b3Plate(cx,cy,cz,ax,ay,az,a,el,r1,r2,th,col,bias){
  const ce=Math.cos(el), x=ax*ce*Math.cos(a), y=ay*ce*Math.sin(a), z=az*Math.sin(el);
  let nx=x/(ax*ax), ny=y/(ay*ay), nz=z/(az*az); const nl=Math.hypot(nx,ny,nz)||1; nx/=nl; ny/=nl; nz/=nl;
  bE(cx+x+nx*th*0.35,cy+y+ny*th*0.35,cz+z+nz*th*0.35,r1,r2,th,col,Math.atan2(nx,nz),0,-Math.asin(clamp(ny,-1,1)),bias);
}
// a heavy eyelid over the top of an eye (a skin-coloured dot nudged up on screen)
function bLid(x,y,z,r,col,k){ const q=b3T(x,y,z,B3.q3); t3Dot(q[0],q[1],q[2]+r*(k==null?0.55:k),r*1.02,col,0.035); }

const TURTA=[0.7,1.57,2.44,-0.7,-1.57,-2.44];
// ================= Old Shellby, the thousand-year-old turtle in Mirrow Grotto
T3B.turtle=n=>{
  const t=G.time, v=b3Motion(n,0.08,6), a=Math.min(1,v/20), g=n._b3g||0, T=b3Tgt(), pl=player;
  const d=pl?dist(n.x,n.y,pl.x,pl.y):999;
  if(d<220) T.hy=clamp(angDiff(n._vf==null?n.face:n._vf,angTo(n.x,n.y,pl.x,pl.y)),-0.9,0.9);
  T.m=scene==='dialogue'&&d<150?Math.max(0,Math.sin(t*9))*0.8:0;
  const S=b3S(n), face=t3Turn(n,n.face,3), X=n.x, Y=n.y+6;
  const skin='#86a062', sk2='#6e8a4e', shell='#7a6640', plate='#a08a58', rim='#5e4c2c', br=Math.sin(t*1.2)*0.25;
  t3Begin(X,Y,face,{k:1});
  b3Reset();
  // stumpy legs that paddle slowly when he walks
  for(let i=0;i<4;i++){ const front=i<2, sd=i%2?1:-1, ph=g+(front?0:Math.PI)+(sd>0?Math.PI:0), sw=Math.sin(ph)*3*a, lf=Math.max(0,Math.cos(ph))*1.6*a;
    const hx=front?11.5:-11.5, fx=(front?15:-14.5)+sw;
    bL(hx,sd*11.5,4.2,fx,sd*14.6,1.2+lf,3.7,skin,3.2);
    bE(fx+(front?1.2:-0.6),sd*15.0,0.9+lf,3.4,2.9,1.5,sk2);
    for(const c of B3SD3) bC(fx+(front?3.6:2.2),sd*15.0+c*1.3,0.9+lf,fx+(front?4.8:3.2),sd*15.2+c*1.5,0.6+lf,0.45,'#d8d0b0',0.02); }
  bC(-19,0,4.2,-25,0,2.4,2.3,skin);
  // the shell: a skirt of edge plates, the dome, carved plates with moss, and a little flower somebody left
  bE(0,0,5.2,20.2,17.2,3.2,rim);
  bE(0,0,7.6+br*0.3,19.0,16.0,10.6+br,shell);
  b3Plate(0,0,7.6,19,16,10.6+br,0,Math.PI/2,5.6,5.0,0.7,plate,0.02);
  for(const xx of B3VERT) b3Plate(0,0,7.6,19,16,10.6+br,xx>0?0:Math.PI,1.12,5.0,4.8,0.7,plate,0.02);
  for(let j=0;j<6;j++) b3Plate(0,0,7.6,19,16,10.6+br,TURTA[j],0.6,5.4,4.8,0.7,plate,0.015);
  bE(-4.6,-4.2,16.6+br,3.0,2.4,0.7,'#6e8e40',0.2,0,0.25,0.04);
  bD(-3.6,3.0,18.6+br,1.1,'#ff9ab8',0.06); bD(-3.6,3.0,18.6+br,0.45,'#ffe066',0.07);
  // the wrinkly old head on a long neck: it turns toward Ash, the eyes are sleepy, the brows are bushy and white
  b3Push(); if(S.hy) b3Rot(2,S.hy*0.8,14,0,5.5);
  bL(14.6,0,5.8,22.0,0,9.2,5.0,skin,4.6);
  bLn(18.0,-4.4,9.6,18.2,4.4,9.6,0.55,sk2,0.03);
  b3Push(); if(S.hy) b3Rot(2,S.hy*0.35,22.0,0,9.2); b3Rot(1,Math.sin(t*0.7)*0.06,22.0,0,9.2);
  bE(25.4,0,10.6,6.9,5.7,5.4,skin);
  bE(30.6,0,9.4,2.8,3.7,2.8,sk2,0.2);
  bE(29.6,0,7.8-S.m*0.9,3.2,3.4,1.2+S.m*0.6,S.m>0.2?'#3a2a1a':sk2,0.1,0,0,0.02);
  const bl=(t%5.5)<0.15;
  for(const s of B3SD){
    if(bl) bLn(28.4,s*3.9,12.6,29.8,s*3.4,12.6,0.6,'#2a2a1a',0.04);
    else{ bEye(29.0,s*3.8,12.6,1.3,'#1a1a0a',true); bLid(29.02,s*3.81,12.6,1.3,skin,0.62); }
    bE(28.2,s*4.0,14.6,2.4,1.25,0.9,'#efe8da',0,0,0,0.05);
  }
  b3Pop(); b3Pop();
  t3End();
};

// ================= deer and rabbits in the meadows
const DPAL={coat:'#a96e40',lite:'#d6a676',belly:'#efe2cc',dark:'#5a3418',hoof:'#24160c',nose:'#1a100a',antler:'#e2d2b0',inner:'#e8b8a0'};
T3B.deer=c=>{
  const t=G.time, v=b3Motion(c,0.075,15), T=b3Tgt(), P=DPAL, pl=player, seed=b3Id(c);
  const flee=c.flee>0||v>140, mv=v>8, graze=!mv&&c.graze, alert=!mv&&!graze&&pl&&dist(c.x,c.y,pl.x,pl.y)<330;
  T.bound=flee?1:0; T.eat=graze?1:0; T.tu=flee?1:0; T.ears=alert?0:0.3;
  if(alert) T.hy=clamp(angDiff(c._vf==null?c.face:c._vf,angTo(c.x,c.y,pl.x,pl.y)),-1,1)*0.7;
  const S=b3S(c), face=t3Turn(c,c.face,9), X=c.x, Y=c.y+c.r*0.45, g=c._b3g||0, a=Math.min(1,v/40);
  const hop=S.bound*Math.abs(Math.sin(g))*3.2*a;
  t3Begin(X,Y,face,{k:1,z:hop});
  b3Reset();
  const tp=S.bound*Math.cos(g)*0.12*a;
  for(let i=0;i<4;i++){
    const front=i<2, sd=i%2?1:-1, hx=front?5.4:-5.8, hy=sd*(front?2.3:2.4), hz=(front?11.2:11.8)-tp*hx;
    const off=(1-S.bound)*((front?0:Math.PI*0.5)+(sd>0?Math.PI:0))+S.bound*((front?0:Math.PI)+(sd>0?0.25:0));
    const ph=g+off, str=(front?4.6:5)*a; let fx=hx+Math.sin(ph)*str, fz=Math.max(0,Math.cos(ph))*(2.2+S.bound*2.4)*a;
    if(S.bound>0.5&&hop>1.5){ fx=lerp(fx,hx+(front?4.6:-5.2),0.6); fz=Math.max(fz,1.8); }
    b3Leg(hx,hy,hz,fx,hy*1.05,fz,11.9,front?1.75:2.2,0.95,P.coat,P.coat,front?1:-1,0.95,0.8,0.85,P.hoof);
  }
  b3Push(); b3Rot(1,tp,0,0,13);
  bE(0,0,13.4,9.6,4.5,4.7,P.coat);
  bE(5.2,0,13.4,4.4,4.2,5.0,P.coat);
  bE(-6.2,0,14.0,4.2,4.4,4.6,P.coat);
  bE(0,0,10.6,7.0,3.4,2.2,P.belly,0,0,0,-0.3);
  bE(-9.3,0,14.4,1.6,2.7,2.9,'#fbf6ec',0,0,0,0.02);
  { const fl=S.tu, wg=Math.sin(t*(fl>0.5?16:2.6)+seed)*0.5; bE(-10.6,wg,15.4+fl*1.6,1.6,1.3,2.1,fl>0.5?'#fffaf0':P.coat,-0.4-fl*0.9,0,0,0.03); }
  if(!c.antlers) for(let j=0;j<7;j++){ const sx=-6+j*2.1, sy=((j*7)%3-1)*1.6; bD(sx,sy,17.9-Math.abs(sx)*0.06,0.5,'#fff4e2',0.02); }
  // neck and head: down to the grass when grazing, held high and turned toward Ash when alert
  b3Push(); b3Rot(1,S.eat*1.55-(alert?0.12:0),6.2,0,15.2); if(S.hy) b3Rot(2,S.hy,6.4,0,15.6);
  bL(6.4,0,15.4,9.6,0,21.0,2.5,P.coat,2.05);
  bE(9.0,0,18.4,1.5,1.7,1.9,'#fbf6ec',0,0,0,0.03);
  const nib=S.eat>0.5?Math.max(0,Math.sin(t*3.1))*0.6:0;
  b3Push(); b3Rot(1,0.12+nib*0.4+(S.eat>0.5?-0.4:0),9.6,0,21.0);
  bE(11.0,0,22.4,3.6,2.6,2.7,P.coat,0.15);
  bE(13.8,0,21.6,2.4,1.65,1.6,'#7a4a2a',0.25);
  bB(15.9,0,21.5,0.75,P.nose,0.04);
  for(const s of B3SD){
    bEye(12.4,s*2.1,23.2,0.85,'#1a100a',true);
    const tw=Math.sin(t*2.3+s+seed)*0.6*(S.eat>0.5?1.4:0.6), el=lerp(26.6,25.4,S.ears);
    bC(10.3,s*1.6,24.2,9.4-S.ears,s*5.4,el+tw,1.45,P.coat);
    bC(10.5,s*1.75,24.2,9.7-S.ears,s*4.9,el-0.3+tw,0.85,P.inner,0.02);
    if(c.antlers){ bL(10.2,s*1.1,24.8,8.8,s*3.4,28.6,0.62,P.antler,0.5); bL(8.8,s*3.4,28.6,6.6,s*5.6,32.6,0.5,P.antler,0.24); bL(9.2,s*2.6,27.2,11.4,s*3.0,30.2,0.44,P.antler,0.22); }
  }
  b3Pop(); b3Pop(); b3Pop();
  t3End();
  c._t3top=Y-(c.antlers?33:27)*T3.st;
};
const RPAL={fur:'#9a8670',lite:'#c8b8a2',dark:'#6a5a48',belly:'#ece2d2',tail:'#fbf8f2',inner:'#eab4ac'};
T3B.rabbit=c=>{
  const t=G.time, v=b3Motion(c,0.09,17), T=b3Tgt(), P=RPAL, pl=player, seed=b3Id(c);
  const mv=v>8, alert=!mv&&pl&&dist(c.x,c.y,pl.x,pl.y)<330;
  T.ears=alert?0:mv?0.35:0.75;
  const S=b3S(c), face=t3Turn(c,c.face,12), X=c.x, Y=c.y+2.4, g=c._b3g||0, a=Math.min(1,v/40);
  const hp=Math.max(0,Math.sin(g)), hop=hp*4.2*a, st=hp*a;
  t3Begin(X,Y,face,{k:1.25,z:hop});
  b3Reset();
  b3Rot(1,-st*0.25+Math.cos(g)*0.15*a,0,0,3);
  for(const s of B3SD){
    bE(-2.4,s*2.0,3.4,3.0,1.5,2.6,P.fur);
    bE(-1.4-st*2.4,s*2.2,0.7-st*0.2,2.8,1.0,0.7,P.dark,-st*0.4);
    bE(2.6+st*1.6,s*1.2,0.8+st*0.6,1.0,0.8,0.8,P.lite);
  }
  bE(-0.6,0,4.4,4.2,3.2,3.4,P.fur);
  bE(0.6,0,3.4,2.8,2.4,2.2,P.belly,0,0,0,0.02);
  bB(-4.8,0,5.0,1.55,P.tail,0.02);
  b3Push(); if(alert) b3Rot(2,clamp(angDiff(c._vf==null?c.face:c._vf,angTo(c.x,c.y,pl.x,pl.y)),-0.9,0.9)*0.5,2,0,6);
  bE(3.6,0,6.8,2.7,2.4,2.5,P.fur);
  bE(5.0,0,6.2,1.5,1.7,1.3,P.lite,0,0,0,0.01);
  bD(6.35,0,6.7,0.42+Math.max(0,Math.sin(t*14+seed))*0.12,'#e88a8a',0.03);
  for(const s of B3SD){
    bEye(5.0,s*1.75,7.6,0.75,'#1a120c',true);
    const e=S.ears, tx=lerp(2.8,-1.2,e), tz=lerp(14.4,11.0,e), sw=Math.sin(t*1.9+s*1.3+seed)*0.4;
    bL(3.0,s*0.9,8.8,tx,s*(1.4+e*0.6)+sw*0.3,tz,1.0,P.fur,0.72);
    bL(3.25,s*0.92,9.0,tx+0.3,s*(1.38+e*0.6)+sw*0.3,tz-0.6,0.5,P.inner,0.35,0.03);
  }
  b3Pop();
  t3End();
  c._t3top=Y-17*T3.st;
};

// ================= birds: flocks flying over, and now and then landing in the grass to peck about
function b3Bird(x,y,face,z,ph,flapK,peck,hop,fold){
  const k=fold?1.55:1.3;
  t3Begin(x,y,face,{k,z:(z+hop)/k});
  b3Reset();
  const body='#3e3632', dark='#2a2420', belly='#9a8a78';
  if(peck) b3Rot(1,peck*0.5,0,0,1);
  bE(0,0,1.6,2.6,1.4,1.35,body,-fold*0.25);
  bE(0.5,0,1.1,1.8,1.05,0.85,belly,0,0,0,0.02);
  bB(2.6,0,2.4+fold*0.6,1.15,body);
  bC(3.5,0,2.3+fold*0.6,4.8,0,2.0+fold*0.4,0.45,'#e0a040',0.02);
  if(fold){ for(const s of B3SD){ bD(3.0,s*0.75,2.7+fold*0.6,0.32,'#ffffff',0.03); bE(-0.4,s*1.2,1.9,2.2,0.5,1.0,dark); } bL(0.4,-0.6,0.6,0.5,-0.7,-0.1,0.25,'#c89040'); bL(0.4,0.6,0.6,0.5,0.7,-0.1,0.25,'#c89040'); }
  bF(0,-2.0,0,1.8); bF(1,-4.6,-1.2,2.0+fold*0.8); bF(2,-4.6,1.2,2.0+fold*0.8); bP(3,dark,null,-0.02);
  if(!fold){
    const th=Math.sin(ph)*0.95*flapK+0.12;
    for(const s of B3SD){
      b3Push(); b3Rot(0,s*th,0,s*0.8,2.0);
      bF(0,0.9,s*0.8,2.0); bF(1,-0.6,s*6.4,2.1); bF(2,-2.2,s*4.4,2.0); bF(3,-1.6,s*0.8,1.9); bP(4,body,null,0.01);
      b3Pop();
    }
  }
  t3End();
}
T3B.birds=()=>{
  const t=G.time;
  for(const f of G.birds){
    // a cosmetic landing: some flocks glide down, peck about for a few seconds and fly off (sooner if Ash comes close)
    const L=f._b3||(f._b3={mode:0,alt:f.alt,alt0:f.alt,sp0:f.sp,land:Math.random()<0.45,gt:0,lt:t});
    let dt=t-L.lt; L.lt=t; if(!(dt>0)||dt>0.2) dt=0;
    const pl=player, dp=pl?dist(f.x,f.y,pl.x,pl.y):999;
    if(L.mode===0&&L.land&&f.t>1.5&&f.t<6&&dp>260&&dp<800){
      const lx=f.x+Math.cos(f.a)*f.sp/1.1, ly=f.y+Math.sin(f.a)*f.sp/1.1;
      if(typeof blockedAt==='function'&&!blockedAt(lx,ly)&&!blockedAt(lx+40,ly)&&!blockedAt(lx-40,ly)&&!colAt(lx,ly,50)) L.mode=1; else L.land=false;
    }
    if(L.mode===1){ f.sp*=Math.exp(-dt*1.1); L.alt=Math.max(0,L.alt-dt*L.alt0/2.6); if(L.alt<=0){ L.mode=2; f.sp=0; L.gt=0; } }
    else if(L.mode===2){ f.t-=dt; L.gt+=dt; f.sp=0; if(L.gt>7||dp<170){ L.mode=3; if(dp<300&&pl) f.a=angTo(pl.x,pl.y,f.x,f.y); f.sp=L.sp0*1.2; } }
    else if(L.mode===3){ L.alt+=dt*95; if(L.alt>=L.alt0){ L.alt=L.alt0; L.mode=0; L.land=false; } }
    const alt=L.alt, ground=alt<0.5;
    for(const b of f.birds){
      const x=f.x+b.ox, y=f.y+b.oy;
      if(!inView(x,y-alt*0.72,40)) continue;
      b3Shadow(x+alt*0.22,y+alt*0.08,ground?3.2:3.8,ground?0.3:Math.max(0.1,0.22-alt*0.0005));
      if(ground){
        const u=(t*0.9+b.ph)%3, pk=u<0.5?Math.sin(u/0.5*Math.PI):0, hp=u>2.2&&u<2.6?Math.sin((u-2.2)/0.4*Math.PI)*2:0, fa=f.a+Math.sin(b.ph*3+Math.floor(t*0.5+b.ph))*1.4;
        b3Bird(x,y,fa,0,0,0,pk,hp,1);
      }else{
        const glide=Math.sin(f.t*1.3+b.ph)<-0.35&&L.mode!==3, desc=L.mode===1?0.5:1;
        b3Bird(x,y,f.a,alt,f.t*(L.mode===3?18:12)+b.ph,glide?0.1:desc,0,0,0);
      }
    }
  }
};

// ================= cave bats: big ears, red eyes, flapping membrane wings; they fold back to swoop
const BATC={def:['#4a3448','#5c4258','#2a1a28'],ice:['#7a8aa8','#8c9cbc','#4a5a78'],ember:['#7a2a1a','#9a3a20','#3a1008']};
T3E.bat=(e,fl)=>{
  const t=G.time, k=e.r/9*1.15, pal=BATC[e.tint]||BATC.def, sw=e.state==='swoop'?1:0, seed=b3Id(e), T=b3Tgt(); b3Motion(e,0,0);
  T.c=sw; T.daze=e.stun>0?1:0;
  const S=b3S(e), face=t3Turn(e,e.face,14), z=lerp(15+Math.sin(t*3+seed)*2.5,8,S.c)-S.daze*4, X=e.x, Y=e.y+e.r*0.2;
  const th=S.daze>0.5?-0.5+Math.sin(t*6)*0.2:lerp(Math.sin(t*26+seed)*0.95+0.1,0.55,S.c);
  t3Begin(X,Y,face,{k,flash:fl,z});
  b3Reset();
  b3Rot(1,S.c*0.3,0,0,0); if(S.daze>0.01) b3Rot(0,Math.sin(t*9)*0.4*S.daze,0,0,0);
  bE(0,0,0,3.9,3.4,3.6,pal[0]);
  bE(1.0,0,-0.7,2.7,2.5,2.5,shd(pal[0],0.18),0,0,0,0.02);
  bL(-2.0,-1.0,-2.4,-2.8,-1.0,-3.8,0.5,pal[2]); bL(-2.0,1.0,-2.4,-2.8,1.0,-3.8,0.5,pal[2]);
  bB(3.2,0,1.6,2.9,pal[0]);
  bE(5.4,0,1.0,1.5,1.3,1.1,shd(pal[0],0.12),0.1);
  bD(6.8,0,1.2,0.45,'#e08a9a',0.03);
  for(const s of B3SD){
    bC(2.8,s*1.4,3.9,2.0,s*2.9,8.4,1.5,pal[0]); bC(3.1,s*1.45,4.0,2.4,s*2.7,7.5,0.82,'#c87a8a',0.02);
    bEye(4.9,s*1.35,2.4,0.8,'#ff4a3a',false);
    bC(5.9,s*0.6,0.4,6.0,s*0.6,-0.9,0.34,'#f6f0e4',0.03);
  }
  b3Scr(5.1,0,2.3,B3.eyeL||(B3.eyeL=[0,0,0])); const ev=b3Faces(1,0,0.3);
  for(const s of B3SD){
    b3Push(); b3Rot(0,s*th,0.4,s*2.2,1.0); if(S.c>0.01) b3Rot(2,-s*0.65*S.c,0.4,s*2.2,1.0);
    bF(0,1.2,s*2.4,1.0); bF(1,0.8,s*9.0,1.8); bF(2,-2.4,s*15.4,0.8); bF(3,-4.2,s*12.0,0.6); bF(4,-6.8,s*10.6,0.4); bF(5,-5.2,s*7.0,0.6); bF(6,-3.0,s*2.4,0.6);
    bP(7,pal[1],pal[2],-0.01);
    bL(1.2,s*2.4,1.0,0.8,s*9.0,1.8,0.7,pal[2],0.5,0.01);
    bLn(0.8,s*9.0,1.8,-2.4,s*15.4,0.8,0.55,pal[2],0.01); bLn(0.8,s*9.0,1.8,-6.8,s*10.6,0.4,0.5,pal[2],0.01);
    b3Pop();
  }
  t3End();
  if(ev>-0.2) glowAt(B3.eyeL[0],B3.eyeL[1],4*k,e.tint==='ice'?'160,220,255':'255,80,60',0.45);
  if(e.tint==='ember') glowAt(X,Y-z*k*T3.st,10*k,'255,120,50',0.3+Math.sin(t*7+seed)*0.08);
  e._t3top=Y-(z+7)*k*T3.st;
};

// ================= slimes: squishy see-through jelly with big eyes; they squash before a hop, stretch in the air, splat on landing
const SLC={def:['#9ee05e','#3e8a2e'],ice:['#c4e4ff','#4a7ac0'],ember:['#ffa860','#c8401a'],crystal:['#dcc6ff','#7048c0']};
T3E.slime=(e,fl)=>{
  const t=G.time, k=e.r/13, seed=b3Id(e), pl=player;
  const pal=typeof e.tint==='string'&&e.tint[0]==='#'?(B3.slt===e.tint?B3.slp:(B3.slt=e.tint,B3.slp=[shd(e.tint,0.15),shd(e.tint,-0.45)])):(SLC[e.tint]||SLC.def);
  // hop arc and squash: anticipation before the hop, stretch in the air, splat after landing, a jiggle when resting
  const hp=e.hopT>0?1-e.hopT/0.25:0;
  if(e.hopT>0) e._b3air=true; else if(e._b3air){ e._b3air=false; e._b3land=t; }
  const land=Math.exp(-(t-(e._b3land||-9))*12), pre=e.hopT<=0&&e.cd<0.2?1-Math.max(0,e.cd)/0.2:0, jig=Math.sin(t*8+seed)*0.05;
  const z=e.hopT>0?Math.sin(hp*Math.PI)*7:0, st=e.hopT>0?Math.sin(hp*Math.PI)*0.2:0;
  const sy=1+st-land*0.26-pre*0.16+jig+(e.stun>0?Math.sin(t*18)*0.08:0), sx=1/Math.sqrt(Math.max(0.5,sy));
  const rx=12.5*sx, rz=9.4*sy, cz=rz*0.9;
  const face=t3Turn(e,e.face,10), X=e.x, Y=e.y+e.r*0.3;
  const look=pl?clamp(angDiff(face,angTo(e.x,e.y,pl.x,pl.y)),-0.6,0.6):0;
  // facing the camera? then the face is drawn on top, otherwise the eyes show faintly through the jelly
  const fv=Math.sin(face)*T3.st+0.4*T3.ct;
  for(let pass=0;pass<(fl?1:3);pass++){
    t3Begin(X,Y,face,{k,flash:fl,z,alpha:pass===1?0.8:1}); b3Reset();
    if(pass===0||fl){
      if(!fl){ bE(0.5,0,cz*0.8,rx*0.45,rx*0.42,rz*0.42,pal[1]);
        for(let j=0;j<3;j++){ const q=(t*0.35+j/3+seed*0.1)%1; bB(-3+j*3,(j-1)*3.2,1.5+q*rz*1.4,0.9+j*0.3,shd(pal[0],0.35)); }
        if(e.tint==='crystal') bC(0,0,cz*0.5,0.5,0,cz*1.3,2.2,'#f4e8ff');
        if(e.tint==='ice') bE(-1,1,cz*0.8,2.6,2.6,2.6,'#e8f6ff',0.5,0.6,0.3);
        if(e.tint==='ember') bB(0.5,0,cz*0.85,3.2,'#ffe08a');
        if(fv<=0&&fv>-0.15) b3SlimeFace(rx,rz,cz,look,t,e,true); }
      else { bE(0,0,cz,rx,rx,rz,pal[0]); bE(0,0,1.6,rx*1.06,rx*1.06,1.9,pal[0]); }
    }
    if(pass===1){ bE(0,0,cz,rx,rx,rz,pal[0]); bE(0,0,1.6,rx*1.07,rx*1.07,1.9,shd(pal[0],-0.1),0,0,0,-0.5); }
    if(pass===2){
      if(fv>0) b3SlimeFace(rx,rz,cz,look,t,e,false);
      if(e.tint==='crystal') for(let j=0;j<3;j++) bC(-2+j*2.2,(j-1)*3,cz+rz*0.82,-2.6+j*2.2,(j-1)*3.8,cz+rz*0.82+4.5-j*0.8,1.2,j%2?'#b89aff':'#f0e4ff',0.02);
      if(e.tint==='ice') for(let j=0;j<4;j++){ const an=j*1.7+0.4; bB(Math.cos(an)*rx*0.4,Math.sin(an)*rx*0.4,cz+rz*0.9,1.1,'#ffffff',0.02); }
      const q=b3T(-rx*0.3,-rx*0.25,cz+rz*0.72,B3.q3), R=T3R; t3Dot(q[0]-R.c*1.6,q[1]+R.s*1.6,q[2]+0.6,2.4,shd(pal[0],0.55),0.05); t3Dot(q[0]-R.c*2.4,q[1]+R.s*2.4,q[2]+1.2,1.1,'#ffffff',0.06);
    }
    t3End();
  }
  if(e.tint==='ember') glowAt(X,Y-(cz+z)*k*T3.st,16*k,'255,140,60',0.3+Math.sin(t*5+seed)*0.08);
  e._t3top=Y-(rz*1.8+z)*k*T3.st;
};
// big googly eyes that follow Ash, and a small grumpy mouth
function b3SlimeFace(rx,rz,cz,look,t,e,behind){
  const ex=rx*0.78, ez=cz+rz*0.38, bl=((t+b3Id(e)*0.7)%3.8)<0.12;
  for(const s of B3SD){
    const y=s*rx*0.32+look*1.2;
    if(bl){ bLn(ex,y-1.6,ez,ex,y+1.6,ez,0.6,'#1a2a10',0.03); continue; }
    bD(ex,y,ez,2.5,'#ffffff',0.02); bD(ex+0.4,y+look*0.9+s*0.2,ez-0.3,1.4,'#1a1a0a',0.03);
    if(!behind){ const q=b3T(ex,y,ez,B3.q3), R=T3R; t3Dot(q[0]-R.c*0.5,q[1]+R.s*0.5,q[2]+0.7,0.5,'#ffffff',0.04); }
  }
  bE(ex+0.6,look*1.2,cz-rz*0.05,0.6,1.8,0.5,'#2a3a1a',0,0,0,0.025);
}

const EGGSP=[[3.6,-2.8,9.6,1.0],[-1.6,4.6,6.4,1.2],[4.9,1.8,5.0,0.9],[-4.1,-3.0,9.4,0.8],[0.8,-5.2,4.8,1.1],[2.2,3.8,11.6,0.7],[-3.2,1.4,12.4,0.75],[5.2,-1.0,7.6,0.6]];
// ================= drakeling eggs: they rock harder and crack as they get ready to hatch, then a snout peeks out
T3E.egg=(e,fl)=>{
  const t=G.time, k=e.r/12*1.4, h=e.hatch==null?4:e.hatch, wob=Math.sin((e.t||t)*(20-h*3))*(h<1.5?0.25:0.08), seed=b3Id(e);
  const face=t3Turn(e,e.face,4), X=e.x, Y=e.y+e.r*0.3;
  t3Begin(X,Y,face,{k,flash:fl});
  b3Reset(); b3Rot(0,wob,0,0,0); b3Rot(1,wob*0.4*Math.sin(seed),0,0,0);
  const shell='#fbf2dc', pk=clamp((0.55-h)/0.55,0,1);
  bE(0,0,7.2,5.8,5.8,7.4,shell);
  for(const q of EGGSP) bD(q[0],q[1],q[2],q[3],'#a8683a',0.01);
  if(h<2){ // cracks across the front, more of them as it gets close
    const n=h<1?6:4;
    for(let i=0;i<n;i++){ const a0=-1.0+i*0.36, a1=a0+0.36, z0=10.6+(i%2?1.2:-0.9), z1=10.6+(i%2?-0.9:1.2);
      const r0=Math.sqrt(Math.max(0,1-((z0-7.2)/7.4)**2))*5.95, r1=Math.sqrt(Math.max(0,1-((z1-7.2)/7.4)**2))*5.95;
      bLn(Math.cos(a0)*r0,Math.sin(a0)*r0,z0,Math.cos(a1)*r1,Math.sin(a1)*r1,z1,0.55,'#4a2810',0.03); }
    if(h<1) bLn(Math.cos(0.2)*5.9,Math.sin(0.2)*5.9,9.8,Math.cos(0.3)*5.4,Math.sin(0.3)*5.4,6.0,0.5,'#4a2810',0.03);
  }
  if(pk>0){ // the top pops off and a little drakeling peeks out
    bB(0.6,0,12.6+pk*1.6,3.4,'#f08850',0.01);
    bE(3.4,0,12.2+pk*1.6,1.8,1.6,1.4,'#ffb878',0.2,0,0,0.02);
    for(const s of B3SD) bEyeBig(2.8,s*1.5,13.8+pk*1.6,0.85,false);
    bE(-0.6,0.6,14.8+pk*4.6,3.6,3.6,1.8,shell,0,0,0.4+pk*0.5,0.03);
  }
  t3End();
  e._t3top=Y-15*k*T3.st;
};

const SHEEPW=[[-5.6,-3.2,11.4,5.0],[-5.6,3.2,11.4,5.0],[0.2,-4.2,12.2,5.4],[0.2,4.2,12.2,5.4],[5.2,-3.0,11.6,4.7],[5.2,3.0,11.6,4.7],[-1.0,0,15.4,5.6],[-6.4,0,14.0,4.4],[4.4,0,14.8,4.4],[-8.6,0,10.4,3.4]];
// ================= Clover, Hal's jumping sheep (z is her hop)
T3B.sheep=(x,y,t,z,face)=>{
  const O=B3.sheepO||(B3.sheepO={x:0,y:0}); O.x=x; O.y=y;
  const pl=player, air=Math.min(1,z/4), br=Math.sin(t*2)*0.25, wool='#f6f3ea', w2='#e4e0d4', face0=face||0;
  let hy=0; if(pl&&dist(x,y,pl.x,pl.y)<160) hy=clamp(angDiff(face0,angTo(x,y,pl.x,pl.y)),-0.9,0.9);
  b3Shadow(x+1,y+2,13-z*0.25,0.3);
  t3Begin(x,y,face0,{k:1,z});
  b3Reset();
  if(air>0) b3Rot(1,-0.15*air*Math.sign(Math.cos(t*3)),0,0,9);
  for(let i=0;i<4;i++){ const front=i<2, sd=i%2?1:-1, hx=front?5:-5.2, hy2=sd*3.0; bL(hx,hy2,7,hx+(front?1.6:-1.6)*air,hy2,lerp(0.8,4.6,air),1.3,'#3a3430',1.0); bE(hx+(front?1.6:-1.6)*air+0.4,hy2,lerp(0.7,4.2,air),1.2,1.0,0.8,'#2a2420'); }
  // a cloud of wool
  bE(0,0,10.2,8.6,6.0,4.6,w2);
  for(const q of SHEEPW) bB(q[0],q[1],q[2]+(q[2]>13?br:0),q[3]+br*0.3,wool);
  bB(-10.6,0,12.0,1.7,wool,0.02);
  // her black face, ears, the red collar and bell
  b3Push(); if(hy) b3Rot(2,hy*0.7,8,0,12);
  bE(11.0,0,13.4,3.7,3.0,3.3,'#3a3430',0.15);
  bB(9.8,0,16.4,2.7,wool,0.02);
  for(const s of B3SD){ bC(9.8,s*2.6,15.0,8.6,s*6.0,14.0+Math.sin(t*2+s)*0.4,1.15,'#3a3430'); bEye(13.1,s*1.75,14.5,0.95,'#ffffff',false); bD(13.35,s*1.75,14.4,0.5,'#1a1410',0.03); }
  bE(8.6,0,11.0,1.0,3.4,3.0,'#c8322a',-0.5);
  bB(9.8+Math.sin(t*4)*0.3,0,9.4,1.25,'#ffd84a',0.02);
  b3Pop();
  t3End();
};

// ================= Puff the hatchling (a drakeling baby who follows Ash in the Trial of the Sky, then sleeps in the nest)
const HPAL={skin:'#f08850',dark:'#b8582a',belly:'#fff0d0',snout:'#ffb878',horn:'#fff4dc',wing:'#f4a26a',wingE:'#a8481c',spine:'#ffe0a0',blush:'#ff9a8a'};
T3B.hatchling=(x,y,face,t,sleep)=>{
  const O=B3.puffO||(B3.puffO={x:0,y:0,id:7}); O.x=x; O.y=y;
  const D=B3.puffD||(B3.puffD={});
  D.sleep=!!sleep; D.flap=sleep?-1.15:0.3+Math.sin(t*16)*0.9; D.m=sleep?0:(Math.sin(t*2)>0.6?0.6:0); D.happy=!sleep&&Math.sin(t*2)>0.6; D.hp=sleep?0.35:Math.sin(t*1.4)*0.08; D.hr=sleep?0.25:Math.sin(t*1.7)*0.18; D.hy=0; D.legs=0; D.shell=true; D.puff=true;
  const Z=sleep?0.5:7+Math.sin(t*5)*1.8;
  if(!sleep) b3Shadow(x,y+5,6,0.22);
  b3Dragon(O,D,face,x,y+5,Z,0.86,false,HPAL);
  if(sleep){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=`700 10px ${UIF}`; ctx.textAlign='center'; const f=(t*0.6)%1; ctx.globalAlpha=1-f; ctx.fillText('z',x+10+f*8,y-12-f*14); ctx.globalAlpha=1; }
};

// ================= the Lake King: a huge fish circling under the water of Lake Mirrow, a golden crown fin poking out
T3B.lakeking=(o,t)=>{
  const x=o.x, y=o.y;
  ctx.lineWidth=1.3;
  for(let k=0;k<3;k++){ const r=10+((t*14+k*16)%48), a=0.4*(1-r/58); ctx.strokeStyle=`rgba(225,238,248,${a})`; ctx.beginPath(); ctx.ellipse(x,y,r*1.3,r*0.75,0,0,TAU); ctx.stroke(); }
  const caught=!!G.flags.lakeking_caught, an=t*0.55, fx=x+Math.cos(an)*30, fy=y+Math.sin(an)*18, f=Math.atan2(Math.cos(an)*18,-Math.sin(an)*30), sw=Math.sin(t*6), crown=Math.sin(t*0.9)>-0.3||!!MV.lk;
  // the body, deep under the surface (drawn faint)
  t3Begin(fx,fy,f,{k:1,z:-7,alpha:0.48});
  b3Reset(); b3Rot(2,sw*0.06,0,0,0);
  bE(0,0,0,30,11,8.5,'#123444');
  bE(20,0,0.6,10,8.2,7.0,'#16404e');
  bE(-6,0,-3,20,7,4,'#2a5a62',0,0,0,-0.2);
  b3Push(); b3Rot(2,sw*0.35,-26,0,0);
  bF(0,-26,0,0); bF(1,-44,0,10); bF(2,-40,0,0); bF(3,-44,0,-10); bP(4,'#0e2c3a',null,0);
  b3Pop();
  for(const s of B3SD){ b3Push(); b3Rot(0,s*(0.4+Math.sin(t*3+s)*0.25),10,s*9,-2); bF(0,12,s*9,-2); bF(1,4,s*20,-4); bF(2,0,s*12,-3); bP(3,'#14384a',null,0.02); b3Pop(); }
  for(const s of B3SD) bD(26.5,s*5.6,2.4,1.6,'#d8e8f0',0.03);
  t3End();
  // the crown fin above the water
  if(crown){
    t3Begin(fx,fy,f,{k:1.45,z:-7/1.45});
    b3Reset(); b3Rot(2,sw*0.06,0,0,0);
    bF(0,-9,0,6); for(let i=0;i<4;i++){ bF(1+i*2,-6.5+i*4.4,0,12+(i%2?1.8:4.6)+Math.sin(t*4+i)*0.4); bF(2+i*2,-4.4+i*4.4,0,7.5); } bF(9,10,0,6.4);
    bP(10,'#f0c038','#8a5a10',0.05);
    for(let i=0;i<4;i++) bD(-6.2+i*4.4,0,12+(i%2?1.8:4.6),0.75,i%2?'#ff6a9a':'#7ae0ff',0.06);
    t3End();
    ctx.strokeStyle='rgba(235,245,252,.55)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(fx,fy-1,12,4,f,0,TAU); ctx.stroke();
  }
  if(Math.random()<0.02) G.ripples.push({x:x+rand(-30,30),y:y+rand(-16,16),t:0,max:0.7,r:8});
  const L=MV.lk;
  if(L){ const p=player, bob=Math.sin(t*4)*1.5+(L.phase==='bite'?3:0); ctx.strokeStyle='rgba(240,240,240,.75)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(p.x+Math.cos(p.facing)*24,p.y+Math.sin(p.facing)*24); ctx.quadraticCurveTo((p.x+L.wx)/2,(p.y+L.wy)/2-20,L.wx,L.wy+bob); ctx.stroke(); ctx.fillStyle='#c8322a'; ctx.beginPath(); ctx.arc(L.wx,L.wy+bob,4,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(L.wx,L.wy+bob-2,2,0,TAU); ctx.fill(); if(L.phase==='bite') drawMarker(L.wx,L.wy-26,'!',t); }
  else if(caught&&Math.sin(t*0.5)>0.9) rGlint(x+8,y-4,t,0,0.6);
};

// ================= house pets: the cats, Pebble the crow on her perch, and the goose
const CATC=['#e0a050','#7a7a82','#2a2a2e','#efe6d6','#c8a070'];
T3B.cat=(o,t)=>{
  const v=Math.abs(Math.round(o.x*3+o.y))%5, col=CATC[v], pl=player, near=pl&&dist(o.x,o.y,pl.x,pl.y)<110, seed=v*1.3+o.x*0.01;
  const O=o._b3c||(o._b3c={hy:0,op:0,lt:t}); let dt=t-O.lt; O.lt=t; if(!(dt>0)||dt>0.2) dt=0;
  O.hy+=((near?clamp(angDiff(0,angTo(o.x,o.y,pl.x,pl.y)),-1.1,1.1):Math.sin(t*0.2+seed)*0.25)-O.hy)*Math.min(1,dt*4); O.op+=((near?1:0)-O.op)*Math.min(1,dt*3);
  const lite=v===2?'#efe6d6':shd(col,0.3), stripe=shd(col,-0.35), br=Math.sin(t*1.6+seed)*0.3, inner='#e88a9a';
  t3Begin(o.x,o.y+3,0,{k:1});
  b3Reset();
  bE(-0.6,0,4.6+br*0.2,8.2,5.6,4.6+br,col);
  bE(-6.0,0,4.4,3.8,5.4,4.2,col);
  bE(4.4,0,5.0,3.6,4.4,4.3,col);
  if(v===2) bE(5.6,0,4.4,2.0,3.0,3.2,lite,0,0,0,0.03);
  if(v===0||v===4) for(let j=0;j<3;j++) bE(-4+j*3.2,0,8.8+br*0.9,0.7,4.6,0.6,stripe,0,0,0,0.02);
  for(const s of B3SD) bE(7.2,s*2.1,1.2,1.9,1.35,1.1,v===2?lite:col,0,0,0,0.02);
  // the tail wraps round her side, the tip swishes
  { const sw=Math.sin(t*2.2+o.x)*0.9; bL(-8,3,3.2,-8.8,5.2,2.0,1.5,col,1.45); bL(-8.8,5.2,2.0,-4.8,6.9,1.6,1.45,col,1.35); bL(-4.8,6.9,1.6,-0.6+sw*0.6,7.3,1.8+Math.max(0,sw)*2.2,1.35,v===2?lite:col,1.1); }
  b3Push(); b3Rot(2,O.hy,5,0,7);
  bE(7.6,0,8.8,3.8,3.6,3.3,col);
  bE(10.3,0,7.9,1.6,1.9,1.3,lite,0.1,0,0,0.02);
  bD(11.7,0,8.3,0.45,inner,0.03);
  for(const s of B3SD){
    bC(6.9,s*2.2,11.0,6.4,s*2.9,14.4,1.45,col); bC(7.2,s*2.15,11.0,6.8,s*2.7,13.7,0.8,inner,0.02);
    if(O.op>0.5){ bEye(10.2,s*1.65,9.4,0.85,'#a8d048',false); bLn(10.26,s*1.65,8.8,10.26,s*1.65,10.0,0.3,'#1a1a0a',0.025); }
    else bLn(9.8,s*1.1,9.3,10.4,s*2.2,9.4,0.45,'#1a1a1a',0.03);
    bLn(11.2,s*1.0,7.8,13.6,s*3.4,8.2,0.22,'rgba(255,255,255,.7)',0.04); bLn(11.2,s*1.0,7.6,13.6,s*3.2,7.2,0.22,'rgba(255,255,255,.7)',0.04);
  }
  b3Pop();
  t3End();
};
// Pebble, Yara's crow: bobs, tilts her head and looks around from her perch
T3B.crow=(o,t)=>{
  const x=o.x, y=o.y, bob=Math.sin(t*1.3)>0.85?1:0, tilt=Math.sin(t*0.6)*0.25, pl=player;
  let ft=Math.sin(t*0.23+x)*0.7; if(pl&&dist(x,y,pl.x,pl.y)<120) ft=angTo(x,y,pl.x,pl.y);
  const f=t3Turn(o,ft,4);
  const blk='#1c1c26', sheen='#2e3654';
  t3Begin(x,y-2,f,{k:1.3});
  b3Reset();
  for(const s of B3SD){ bLn(0.4,s*1.0,2.4,0.6,s*1.0,0.2,0.45,'#d8b04a'); bLn(0.6,s*1.0,0.2,2.0,s*1.2,0.1,0.35,'#d8b04a',0.01); }
  bE(0,0,4.6,3.6,2.6,3.0,blk,-0.55);
  for(const s of B3SD) bE(-0.6,s*2.2,4.8,3.6,0.9,2.2,sheen,-0.4,0,0,0.01);
  bF(0,-2.2,0,3.4); bF(1,-6.6,-1.6,1.2); bF(2,-6.2,1.6,1.2); bP(3,blk,null,-0.02);
  b3Push(); b3Rot(1,bob*0.45,1.6,0,7.6); b3Rot(0,tilt,1.6,0,7.6);
  bB(2.4,0,8.6,2.3,blk);
  bC(4.2,0,8.4,7.4,0,7.9,0.85,'#5a5a66',0.02);
  for(const s of B3SD){ bD(3.8,s*1.5,9.3,0.75,'#ffffff',0.02); bD(4.0,s*1.5,9.25,0.38,'#000000',0.03); }
  b3Pop();
  t3End();
};
// the goose: preens, looks about, and honks now and then
T3B.goose=(o,t)=>{
  const x=o.x, y=o.y, seed=(o.x*0.37+o.y*0.11)%7, u=(t*0.25+seed)%4, honk=u<0.5?Math.sin(u/0.5*Math.PI):0, preen=u>2&&u<2.9?Math.sin((u-2)/0.9*Math.PI):0, pl=player;
  let hy=Math.sin(t*0.4+seed)*0.4; if(pl&&dist(x,y,pl.x,pl.y)<120) hy=clamp(angDiff(0,angTo(x,y,pl.x,pl.y)),-1,1);
  const W='#f4f2ea', W2='#e2dfd2', OR='#f08a2a';
  t3Begin(x,y+4,0,{k:1});
  b3Reset();
  for(const s of B3SD){ bL(1.4,s*2.4,3.2,1.6,s*2.6,0.5,0.55,OR); bE(2.4,s*2.6,0.35,2.2,1.4,0.35,OR); }
  bE(0,0,6.0,8.0,5.0,4.6,W,-0.08);
  bC(-6.6,0,7.2,-11.0,0,9.6,2.6,W2);
  for(const s of B3SD) bE(-1.2,s*3.8,7.0,6.0,1.4,3.0,W2,-0.1,0,0,0.01);
  b3Push(); b3Rot(1,-honk*0.35+preen*1.6,5.4,0,8.0); b3Rot(2,hy*(1-preen)+preen*2.2,5.4,0,8.0);
  bL(5.6,0,8.4,8.8,0,12.6,2.0,W,1.65);
  bL(8.8,0,12.6,9.6+honk*1.6,0,16.4+honk*0.8,1.65,W,1.5);
  const hx=9.6+honk*1.6, hz=16.4+honk*0.8;
  bE(hx+0.8,0,hz+0.8,2.7,2.0,2.1,W);
  bC(hx+2.8,0,hz+0.6,hx+5.8,0,hz+0.3-honk*0.6,1.0,OR,0.02);
  if(honk>0.3) bC(hx+2.8,0,hz-0.2,hx+5.2,0,hz-1.2-honk,0.7,'#d86a1a',0.01);
  for(const s of B3SD) bD(hx+1.6,s*1.6,hz+1.4,0.5,'#1a1a1a',0.03);
  b3Pop();
  t3End();
  if(honk>0.6&&pl&&dist(x,y,pl.x,pl.y)<260){ ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font=`800 8px ${UIF}`; ctx.textAlign='center'; ctx.fillText('HONK',x+16,y-20); }
};
// the goose used to be baked into the room picture; with 3D on it is drawn live here instead (see FB.goose)
if(!FL.goose) FL.goose=(o,t)=>{ if(T3.on&&T3B.goose) T3B.goose(o,t); };

// ================= debug: a sheet of figures at 8 facings, one row per state (returns a PNG data URL)
// rows: [{label, draw(x,y,face,col)}]; x,y is the ground point under the middle of the cell
function b3Sheet(rows,z,cw,ch,bg,faces){
  z=z||2; cw=cw||64; ch=ch||64;
  const cols=faces?faces.length:8, lw=74, Wc=Math.ceil((lw+cols*cw)*z), Hc=Math.ceil(rows.length*ch*z), ow=cvs.width, oh=cvs.height;
  cvs.width=Wc; cvs.height=Hc; ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  const bgs=bg||['#5f7a44','#6b8550'];
  for(let r=0;r<rows.length;r++){ ctx.fillStyle=bgs[r%bgs.length]; ctx.fillRect(0,r*ch*z,Wc,ch*z); }
  ctx.setTransform(z,0,0,z,0,0);
  rows.forEach((row,r)=>{
    ctx.font=`700 8px ${UIF}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.lineWidth=2;
    ctx.strokeText(row.label,4,r*ch+ch/2); ctx.fillText(row.label,4,r*ch+ch/2);
    for(let i=0;i<cols;i++){
      const x=lw+(i+0.5)*cw, y=r*ch+ch*(row.gy||0.72), f=faces?faces[i]:i*TAU/cols;
      if(!row.noShadow){ ctx.globalAlpha=0.28; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(x,y,(row.sh||11),(row.sh||11)*0.42,0,0,TAU); ctx.fill(); ctx.globalAlpha=1; }
      ctx.save(); try{ row.draw(x,y,f,i); }catch(err){ console.warn('sheet',row.label,err); } ctx.restore();
    }
  });
  const url=cvs.toDataURL('image/png');
  cvs.width=ow; cvs.height=oh;
  return url;
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{b3Sheet,b3Bird,T3E,T3B,T3C,T3A,T3,T3R});
