// ================= Toy 3D bosses: Gloamjaw, Old Gnarl and his knot, the Mirrow Serpent, Skrae the Storm Wyvern, Vorlaxis.
// Each boss is one toy figure built from shaded 3D parts (a3e_toy3d.js), drawn back to front. The 2D ground
// telegraphs stay where they were; the poses and glows here match every AI state so each attack reads from any angle.
// Body space: x forward, y right, z up. Feet sit south of the hit circle so the body's middle stays over it.
{ // everything in this file is block-scoped; only the T3E / T3X drawers and the debug hooks leave it
const T3BS={g:null};                 // a 2D context override (test sheets draw on their own canvas)
function t3bG(){ return T3BS.g||ctx; }
// pooled points for panels (t3Poly copies what it needs, so the pool is reset at the start of each figure)
const _bpP=[]; let _bpN=0; const _bpL=[];
function bpt(x,y,z){ let a=_bpP[_bpN]; if(!a){ a=[0,0,0]; _bpP[_bpN]=a; } _bpN++; a[0]=x; a[1]=y; a[2]=z; return a; }
function bpoly(col,o,a,b,c,d,e2){ _bpL.length=0; _bpL.push(a,b,c); if(d) _bpL.push(d); if(e2) _bpL.push(e2); return t3Poly(_bpL,col,o); }
// a point on the upper surface of an ellipsoid (for warts, plates, studs)
function bSurfZ(cx,cy,cz,rx,ry,rz,x,y){ const u=(x-cx)/rx, v=(y-cy)/ry, q=1-u*u-v*v; return cz+rz*Math.sqrt(Math.max(0,q)); }
// screen position (in world coordinates) of a body-space point; valid between t3Begin and t3End
const _bsp=[0,0,0];
function bScr(x,y,z){ t3P(x,y,z,_bsp); _bsp[0]+=T3R.x; _bsp[1]+=T3R.y; return _bsp; }
// the body-space point at height z that lands on world point (wx,wy) on screen (long reaches: tongues, necks)
function bInv(wx,wy,z,out){
  const R=T3R, sx=(wx-R.x)/R.k, sy=(wy-R.y)/R.k, gx=sx, gy=(sy+(z+R.zl)*T3.st)/T3.ct;
  out[0]=gx*R.c+gy*R.s; out[1]=-gx*R.s+gy*R.c; out[2]=z; return out;
}
// soft additive glow on the current 2D context
const BGLOW=new Map();
function bGlow(x,y,r,col,a){
  if(!(r>0)||!(a>0)) return; const g=t3bG();
  let sp=BGLOW.get(col); if(!sp){ sp=mkCanvas(64,64); const q=sp.getContext('2d'), gr=q.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,`rgba(${col},1)`); gr.addColorStop(0.45,`rgba(${col},.38)`); gr.addColorStop(1,`rgba(${col},0)`); q.fillStyle=gr; q.fillRect(0,0,64,64); BGLOW.set(col,sp); }
  const pa=g.globalAlpha, pc=g.globalCompositeOperation; g.globalCompositeOperation='lighter'; g.globalAlpha=pa*Math.min(1,a); g.drawImage(sp,x-r,y-r,r*2,r*2); g.globalAlpha=pa; g.globalCompositeOperation=pc;
}
// a frame step for drawer-side timers (uses the entity clock so test sheets and slow motion work)
function bDt(e,key){ const now=e.t||0, last=e[key]; e[key]=now; return last==null?0:clamp(now-last,0,0.1); }
const bSmooth=k=>{ k=clamp(k,0,1); return k*k*(3-2*k); };
// rotate (x,z) around a hinge (hx,hz) by a (positive tips the front up)
const _brz=[0,0];
function bRotXZ(x,z,hx,hz,a){ const c=Math.cos(a), s=Math.sin(a), dx=x-hx, dz=z-hz; _brz[0]=hx+dx*c-dz*s; _brz[1]=hz+dx*s+dz*c; return _brz; }

// a simple rig: the upper body leans (pitch, front down) and twists (yaw) around a hip pivot
const RIG={px:0,pz:0,pitch:0,yaw:0,roll:0,ox:0,oy:0,oz:0,cp:1,sp:0,cy:1,sy:0,cr:1,sr:0};
function rigSet(px,pz,pitch,yaw,ox,oy,oz,roll){ const R=RIG; R.px=px; R.pz=pz; R.pitch=pitch||0; R.yaw=yaw||0; R.roll=roll||0; R.ox=ox||0; R.oy=oy||0; R.oz=oz||0; R.cp=Math.cos(R.pitch); R.sp=Math.sin(R.pitch); R.cy=Math.cos(R.yaw); R.sy=Math.sin(R.yaw); R.cr=Math.cos(R.roll); R.sr=Math.sin(R.roll); }
function rp(x,y,z){ const R=RIG; let dx=x-R.px, dz=z-R.pz, dy=y; if(R.roll){ const y1=dy*R.cr-dz*R.sr, z1=dy*R.sr+dz*R.cr; dy=y1; dz=z1; }
  const x1=dx*R.cp+dz*R.sp, z1=-dx*R.sp+dz*R.cp, x2=x1*R.cy-dy*R.sy, y2=x1*R.sy+dy*R.cy; return bpt(R.px+x2+R.ox,y2+R.oy,R.pz+z1+R.oz); }
const _ro={pitch:0,yaw:0,roll:0,bias:0};
function ro(pitch,yaw,bias,roll){ _ro.pitch=RIG.pitch+(pitch||0); _ro.yaw=RIG.yaw+(yaw||0); _ro.roll=RIG.roll+(roll||0); _ro.bias=bias||0; return _ro; }
function rEll(x,y,z,rx,ry,rz,col,pitch,yaw,bias,roll){ const q=rp(x,y,z); return t3Ell(q[0],q[1],q[2],rx,ry,rz,col,ro(pitch,yaw,bias,roll)); }
function rLimb(ax,ay,az,bx,by,bz,r,col,r2,bias){ const a=rp(ax,ay,az), b=rp(bx,by,bz); return t3Limb(a[0],a[1],a[2],b[0],b[1],b[2],r,col,r2,bias); }
function rCone(ax,ay,az,bx,by,bz,r,col,bias){ const a=rp(ax,ay,az), b=rp(bx,by,bz); return t3Cone(a[0],a[1],a[2],b[0],b[1],b[2],r,col,bias); }
function rLine(ax,ay,az,bx,by,bz,w,col,bias){ const a=rp(ax,ay,az), b=rp(bx,by,bz); return t3Line(a[0],a[1],a[2],b[0],b[1],b[2],w,col,bias); }
function rDot(x,y,z,r,col,bias){ const q=rp(x,y,z); return t3Dot(q[0],q[1],q[2],r,col,bias); }
// two-bone reach: the elbow (or knee) between s and h, bent toward the pole direction
function bIK(s,h,L1,L2,px,py,pz,out){
  const dx=h[0]-s[0], dy=h[1]-s[1], dz=h[2]-s[2], d=Math.hypot(dx,dy,dz)||1, dd=Math.min(d,L1+L2-0.01);
  const a=(L1*L1-L2*L2+dd*dd)/(2*dd), hh=Math.sqrt(Math.max(0,L1*L1-a*a)), ux=dx/d, uy=dy/d, uz=dz/d;
  const pd=px*ux+py*uy+pz*uz; let vx=px-pd*ux, vy=py-pd*uy, vz=pz-pd*uz; const vl=Math.hypot(vx,vy,vz)||1; vx/=vl; vy/=vl; vz/=vl;
  out[0]=s[0]+ux*a+vx*hh; out[1]=s[1]+uy*a+vy*hh; out[2]=s[2]+uz*a+vz*hh; return out;
}
// screen position and depth of a body point (to decide if a glowing eye or knot faces the camera)
const _bsd=[0,0,0];
function bScrD(x,y,z){ t3P(x,y,z,_bsd); _bsd[0]+=T3R.x; _bsd[1]+=T3R.y; return _bsd; }
function bDepth(x,y,z){ t3P(x,y,z,_bsd); return _bsd[2]; }

// ---------- Gloamjaw, the thing in the Mirefen: a huge swamp toad
// states: chase (hops), chompW (rears up with the mouth wide) then a snap (e.mouth), tongueW / tongue (e.tongue px),
// spitW (the throat sac swells, then it spits), diveDown (sinks), under / emergeW (only the eyes show), recover
const GJ={body:'#5e7e36',dark:'#3a5420',belly:'#b4b076',jaw:'#55722f',eye:'#e8d84a',mouth:'#4a0e18',tongue:'#d8607e',tip:'#f08aa4',tooth:'#ece4cc',wart:'#4c6a2c',gland:'#6e8e40',stripe:'#b8c878',spot:'#86a456',sac:'#c8c890',sick:'#c6d860',pad:'#4e8a3a'};
const GJ_WARTS=[[-14,-10,3.2],[-4,9,3.6],[-22,7,2.6],[4,-15,2.6],[-16,17,2.4],[-2,-2,2.2],[-26,-6,2.2],[-10,20,2],[-6,-21,2.2],[-30,12,2],[8,12,2],[-20,-18,2.4]];
function t3Gloam(e,fl){
  const g=t3bG(), t=e.t||0, F=t3Turn(e,e.face,10), k=1.12, dt=bDt(e,'_gjT');
  _bpN=0;
  const mv=Math.hypot(e.dx||0,e.dy||0)>5; e._wph=(e._wph||0)+dt*(mv?8.5:0);
  if(e.sub&&e.state!=='diveDown'){ t3GloamEyes(e,fl,F,k); return; }
  // pose
  let open=0, rear=0, lunge=0, crouch=0, sac=0.12+0.08*Math.sin(t*3.2), aim=0, sink=0;
  const st=e.st||0;
  if(e.state==='chompW'){ const q=bSmooth(1-st/0.55); open=q; rear=q; }
  else if(e.mouth>0){ const q=e.mouth/0.3; open=Math.max(0,(q-0.72)/0.28); lunge=Math.sin(q*Math.PI)*1.0; }
  else if(e.state==='tongueW'){ const q=bSmooth(1-st/0.6); open=0.35*q; crouch=q; aim=q; }
  else if(e.state==='tongue'){ open=0.62; crouch=0.6; aim=1; }
  else if(e.state==='spitW'){ const q=1-st/0.5; sac=0.15+0.85*bSmooth(q/0.85); open=q>0.72?(q-0.72)/0.28*0.7:0; rear=0.45*q; }
  else if(e.state==='diveDown'){ sink=bSmooth(1-st/0.5); }
  const hop=mv?Math.max(0,Math.sin(e._wph))*5.5:0, bob=hop+Math.sin(t*2.6)*0.5-crouch*2.5;
  const ox=e.x, oy=e.y+e.r*0.45;
  g.save();
  if(sink>0){ g.globalAlpha=1; const R=33*k, ry=R*T3.ct*0.92, wy=oy+2; g.beginPath(); g.rect(ox-400,wy-500,800,500); g.moveTo(ox+R,wy); g.ellipse(ox,wy,R,ry,0,0,Math.PI); g.closePath(); g.clip(); }
  t3Begin(ox,oy,F,{k,flash:fl,g,z:-sink*27});
  const P=-0.06-rear*0.16+crouch*0.08; // body pitch (negative lifts the front)
  const bz=18+bob+rear*3, bx=-4+lunge*5;
  // legs
  for(const sd of [-1,1]){
    const ph=mv?Math.sin(e._wph+(sd>0?0:0.6)):0, reach=mv?Math.cos(e._wph)*4:0;
    // front legs
    const fx=22+reach+lunge*4, fy=sd*27, sx=12+lunge*4, sz=14+bob*0.7+rear*4;
    t3Limb(sx,sd*18,sz,fx-3,fy,6+Math.max(0,ph)*2,5.6,GJ.body,4.4);
    t3Limb(fx-3,fy,6+Math.max(0,ph)*2,fx,fy,1.6,4.2,GJ.body,3.2);
    for(let q=-1;q<=1;q++){ t3Limb(fx,fy,1.4,fx+5.5,fy+q*3.6+sd*0.8,0.9,1.5,GJ.dark,1.2); t3Ball(fx+6,fy+q*3.6+sd*0.8,1,2.0,GJ.spot); }
    // back legs: a big folded thigh, a shin and a long webbed foot
    const push=mv?Math.max(0,-Math.cos(e._wph))*5:0;
    t3Ell(-18+bx*0.2,sd*22,12+bob*0.6,13,8.5,9.5,GJ.body,{yaw:sd*0.35,pitch:-0.2});
    t3Limb(-8,sd*30,9+bob*0.5,-24-push,sd*31,3.5,4.6,GJ.body,3.6);
    t3Limb(-24-push,sd*31,2.6,-8-push*0.4,sd*36,1.4,3.2,GJ.jaw,2.4);
    for(let q=-1;q<=1;q++) t3Ball(-6-push*0.4,sd*36+q*3.4,1.1,2.2,GJ.spot);
  }
  // body (wide at the hips), belly, glands behind the eyes, warts and a pale stripe down the back
  t3Ell(bx,0,bz,30,28,16.5,GJ.body,{pitch:P});
  t3Ell(bx-13,0,bz+1,19,25,13.5,GJ.body,{pitch:P*0.5,bias:-0.4});
  t3Ell(bx+6,0,bz-7,25,23,10,GJ.belly,{pitch:P,bias:-2});
  for(const [wx,wy,wr] of GJ_WARTS){ const z=bSurfZ(bx,0,bz,30,28,16.5,bx+wx,wy); t3Ball(bx+wx,wy,z-wr*0.4,wr,GJ.wart); }
  for(const sd of [-1,1]){ const z=bSurfZ(bx,0,bz,30,28,16.5,bx+4,sd*15); t3Ell(bx+4,sd*15,z-1.5,8.5,4.6,3.6,GJ.gland,{yaw:-sd*0.35,pitch:P}); }
  { let px=bx+12, pz=bSurfZ(bx,0,bz,30,28,16.5,px,0); for(let i=1;i<=4;i++){ const nx=bx+12-i*9.5, nz=bSurfZ(bx,0,bz,30,28,16.5,nx,0)+(i>2?0.5:0); t3Line(px,0,pz+0.3,nx,0,nz+0.3,2.2,GJ.stripe,0.6); px=nx; pz=nz; } }
  // the throat sac (it swells before a spit)
  const sk=sac;
  t3Ell(bx+24,0,bz-9+sk*1.5,8+sk*7,13+sk*9,5+sk*7,sk>0.4?GJ.sick:GJ.belly,{bias:-1});
  if(sk>0.6&&!fl){ const p=bScr(bx+30,0,bz-8); e._gjSac=[p[0],p[1],sk]; } else e._gjSac=null;
  // head: the skull tips up on a hinge, the jaw drops
  const hx=bx+10, hz=bz+3, up=-(open*0.42+rear*0.12)+aim*0.06, dn=open*0.5;
  let q=bRotXZ(hx+12,hz+4,hx,hz,-up); const skx=q[0], skz=q[1];
  t3Ell(skx,0,skz,18,25,10.5,GJ.body,{pitch:up-0.08});
  // the wide frown of a closed mouth
  if(open<0.12){ for(let i=0;i<6;i++){ const a0=-1.3+i*0.433, a1=a0+0.433, f0=Math.abs(a0)>0.9?-1.2:0, f1=Math.abs(a1)>0.9?-1.2:0; q=bRotXZ(hx+12+Math.cos(a0)*18,hz-2+f0,hx,hz,-up); const x0=q[0], z0=q[1]; q=bRotXZ(hx+12+Math.cos(a1)*18,hz-2+f1,hx,hz,-up); t3Line(x0,Math.sin(a0)*24.5,z0,q[0],Math.sin(a1)*24.5,q[1],2.4,'#1c2a0e',2); } }
  // eyes on top, brows, nostrils, a lily pad that rode along from the swamp
  for(const sd of [-1,1]){
    q=bRotXZ(hx+6,hz+12,hx,hz,-up); t3Ball(q[0],sd*14,q[1],7.6,GJ.body);
    q=bRotXZ(hx+7.6,hz+14,hx,hz,-up); const ex=q[0], ez=q[1];
    t3Ball(ex,sd*14.6,ez,5.6,GJ.eye,{bias:0.2});
    t3Line(ex+5.2,sd*14.6,ez-2.6,ex+5.2,sd*14.6,ez+2.6,1.7,'#1a1a08',0.4);
    t3Dot(ex+4.9,sd*13.4,ez+2.2,0.9,'#ffffff',0.5);
    q=bRotXZ(hx+8,hz+19,hx,hz,-up); t3Ell(q[0]+0.5,sd*15,q[1],7.2,4.8,2.3,'#2c3e18',{roll:sd*0.42,pitch:-0.3,bias:0.3});
    q=bRotXZ(hx+29,hz+5,hx,hz,-up); t3Dot(q[0],sd*5,q[1],1.1,GJ.dark,0.3);
  }
  q=bRotXZ(hx-2,hz+11,hx,hz,-up); t3Ell(q[0],-4,q[1],6.5,6.5,0.9,GJ.pad,{pitch:up}); t3Dot(q[0]+1,-3,q[1]+1.2,1.6,'#f4a8c8',0.1);
  // lower jaw, the inside of the mouth, teeth and tongue
  q=bRotXZ(hx+11,hz-6,hx,hz,dn); t3Ell(q[0],0,q[1],18,24,6.5,GJ.jaw,{pitch:-dn,bias:-0.5});
  const fw=Math.sin(F)*T3.st; // sorts parts as if they sat further forward (mouth insides, teeth)
  if(open>0.1){
    const ins=bRotXZ(hx+10,hz-2.5,hx,hz,dn*0.6); t3Ell(ins[0]+2,0,ins[1]+1,14*Math.min(1,open*2),20,3+open*4,GJ.mouth,{bias:4+fw*14});
    for(let i=-3;i<=3;i++){ const a=i*0.36, rx=hx+11+Math.cos(a)*15.5, ry=Math.sin(a)*21;
      q=bRotXZ(rx,hz-1,hx,hz,-up); t3Cone(q[0],ry,q[1],q[0]+0.6,ry,q[1]-3.4,1.5,GJ.tooth,6+fw*16);
      q=bRotXZ(rx-1,hz-2.5,hx,hz,dn); t3Cone(q[0],ry,q[1],q[0]+0.4,ry,q[1]+3,1.4,GJ.tooth,6+fw*16); }
    if(!(e.tongue>0)){ q=bRotXZ(hx+9,hz-1.5,hx,hz,dn); t3Ell(q[0]+3,0,q[1]+1,8,8,2.6,GJ.tongue,{bias:5+fw*15}); }
  }
  if(e.tongue>0){
    const m=bRotXZ(hx+16,hz-1,hx,hz,dn*0.5), tw=e.r+e.tongue, tip=bInv(e.x+Math.cos(e.face)*tw,e.y+Math.sin(e.face)*tw,m[1]*0.7,[0,0,0]);
    t3Limb(m[0],0,m[1],tip[0],tip[1],tip[2],3.6,GJ.tongue,3.1,1.2);
    t3Ball(tip[0],tip[1],tip[2],7.2,GJ.tip,{bias:1.4});
  }
  t3End();
  g.restore();
  if(sink>0){ g.save(); g.globalAlpha=1; g.strokeStyle='rgba(200,230,180,.4)'; g.lineWidth=2; g.beginPath(); g.ellipse(ox,oy+2,34*k*(1+sink*0.2),34*k*T3.ct*0.92*(1+sink*0.2),0,0,TAU); g.stroke(); g.restore(); t3GloamEyes(e,fl,F,k,1-sink); }
  if(e._gjSac&&!fl){ const s=e._gjSac; bGlow(s[0],s[1],26*s[2],'200,230,90',0.35*s[2]); }
  e._t3top=oy-(44+bob)*T3.st*k+sink*20;
}
const GJ_EYEP=[0,0,0,0];
// the submerged toad: two eyes and the top of the head break the water
function t3GloamEyes(e,fl,F,k,fade){
  const g=t3bG(), t=e.t||0, st=e.st||0;
  const rise=e.state==='emergeW'?bSmooth(1-st/0.7):0, ox=e.x, oy=e.y+6;
  g.save(); g.globalAlpha=fade==null?1:Math.max(0,1-fade*1.4);
  if(fade==null){ g.strokeStyle=`rgba(200,230,180,${0.35+rise*0.3})`; g.lineWidth=2; g.beginPath(); g.ellipse(e.x,e.y+4,e.r*1.1*(1+Math.sin(t*4)*0.04),e.r*0.8,0,0,TAU); g.stroke();
    g.fillStyle=`rgba(14,22,8,${0.28+rise*0.2})`; g.beginPath(); g.ellipse(e.x,e.y+6,e.r*1.0,e.r*0.62,0,0,TAU); g.fill(); }
  t3Begin(ox,oy,F,{k,flash:fl,g,z:rise*4-1});
  t3Ell(9,0,-1,15,21,3.4+rise*2,GJ.body);
  const gl=GJ_EYEP;
  for(const sd of [-1,1]){ t3Ell(7,sd*12.5,1.4,6.6,6.6,4.6,GJ.body); t3Ball(8.6,sd*13,3.2,4.8,GJ.eye,{bias:0.2}); t3Line(13,sd*13,1.2,13,sd*13,5.4,1.6,'#1a1a08',0.4); t3Dot(12.8,sd*12,5,0.8,'#ffffff',0.5);
    t3Ell(8.5,sd*14,7.2,5.5,3.8,1.8,GJ.dark,{roll:sd*0.35,pitch:-0.25,bias:0.3});
    const p=bScr(8.6,sd*13,3.2), j=sd>0?2:0; gl[j]=p[0]; gl[j+1]=p[1]; }
  t3End();
  g.restore();
  if(!fl) for(let j=0;j<4;j+=2) bGlow(gl[j],gl[j+1],7+rise*5,'232,216,74',(0.25+rise*0.35)*(fade==null?1:Math.max(0,1-fade*1.4)));
  e._t3top=oy-14*T3.st*k;
}
T3E.gloamjaw=t3Gloam;

// ---------- Old Gnarl, the root giant of the Leap, and the glowing knot on his back
// states: chase (slow root steps), swipeW then e.swing (a big arm sweep), stompW (rises, e.lift) then stuck (slumped
// forward, roots dug in, the knot blazing), flinch (roots burning, he hops and flails), rootsW (arms up, then down into
// the floor), logW (a log overhead, e.holdLog), recover
const GN={bark:'#7a5636',dark:'#3c2513',root:'#6a4a2c',light:'#a68052',moss:'#6a8a34',mossL:'#9cc452',leaf:'#4a7628',leafL:'#7cae3c',eye:'#c8ff70',eyeS:'#ffe066',knot:'#ffa838',knotS:'#ffe08a',ring:'#2a170a',log:'#8a5a30',logEnd:'#d0aa78'};
const GN_ROOTS=[1.2,1.9,2.55,Math.PI,-2.55,-1.9,-1.2];
// the leaf crown: [x,y,z,size,light]
const GN_CAN=[[-10,0,114,18,0],[-2,-19,108,14,0],[-2,19,108,14,0],[-22,-15,104,14,0],[-22,15,104,14,0],[-30,0,96,12,0],[4,0,118,11,1],[-12,-10,124,10,1],[-12,12,123,9,1],[-26,-4,110,9,1]];
const GN_GROOVE=[0.8,1.5,2.2,2.9,-2.5,-1.8,-1.1];
const _gnA=[0,0,0], _gnB=[0,0,0], _gnE=[0,0,0];
function t3Gnarl(e,fl){
  const g=t3bG(), t=e.t||0, F=t3Turn(e,e.face,7), k=1, dt=bDt(e,'_gnT');
  _bpN=0;
  const st=e.st||0, S=e.state, stuck=S==='stuck'||S==='flinch', flinch=S==='flinch';
  const mv=Math.hypot(e.dx||0,e.dy||0)>5; e._wph=(e._wph||0)+dt*(mv?4.4:0); const wp=e._wph, ws=mv?1:0;
  // pose
  let lean=0.04, twist=0, oz=Math.abs(Math.sin(wp))*2.2*ws+Math.sin(t*1.6)*0.6, headP=0, rootR=56, jit=0;
  const hL=_gnA, hR=_gnB;
  hL[0]=14+Math.sin(wp)*9*ws; hL[1]=-47; hL[2]=34+Math.sin(t*1.6)*1.2; hR[0]=14-Math.sin(wp)*9*ws; hR[1]=47; hR[2]=34+Math.sin(t*1.6+1)*1.2;
  const L3=(h,x,y,z,q)=>{ h[0]=lerp(h[0],x,q); h[1]=lerp(h[1],y,q); h[2]=lerp(h[2],z,q); };
  let logH=0;
  if(S==='swipeW'){ const q=bSmooth(1-st/0.6); twist=-0.38*q; L3(hR,-24,58,100,q); L3(hL,26,-40,56,q); }
  else if(e.swing>0){ const u=bSmooth(1-e.swing/0.3), ph=lerp(1.95,-1.05,u); twist=lerp(-0.38,0.42,u); hR[0]=4+Math.cos(ph)*60; hR[1]=Math.sin(ph)*60; hR[2]=58-Math.sin(u*Math.PI)*16; L3(hL,10,-44,48,1); lean=0.12; }
  else if(S==='stompW'){ const q=bSmooth(e.lift||0); oz+=15*q; lean=-0.16*q; L3(hL,0,-36,134,q); L3(hR,0,36,134,q); }
  else if(stuck){ lean=0.52; oz=-6; headP=0.32; rootR=72; L3(hL,46,-36,3,1); L3(hR,46,36,3,1);
    if(flinch){ lean=0.4; jit=Math.sin(t*38)*1.4; oz=-2+Math.abs(Math.sin(t*9))*4; hL[0]=20; hL[1]=-50; hL[2]=96+Math.sin(t*15)*12; hR[0]=20; hR[1]=50; hR[2]=96+Math.sin(t*15+2)*12; headP=-0.1; } }
  else if(S==='rootsW'){ const q=1-st/0.55; if(q<0.58){ const u=bSmooth(q/0.58); lean=-0.14*u; L3(hL,6,-30,134,u); L3(hR,6,30,134,u); } else { const u=bSmooth((q-0.58)/0.42); lean=lerp(-0.14,0.36,u); hL[0]=lerp(6,54,u); hL[1]=-24; hL[2]=lerp(134,2,u); hR[0]=hL[0]; hR[1]=24; hR[2]=hL[2]; } }
  else if(S==='logW'){ const q=bSmooth(1-st/0.7); logH=1; lean=-0.12*q; L3(hL,-2-12*q,-38,128,Math.min(1,q*3)); L3(hR,-2-12*q,38,128,Math.min(1,q*3)); }
  const ox=e.x, oy=e.y+e.r*0.5;
  t3Begin(ox,oy,F,{k,flash:fl,g});
  // roots spreading into the floor (they stay put while the body leans)
  for(let i=0;i<GN_ROOTS.length;i++){ const a=GN_ROOTS[i]+Math.sin(t*0.9+i*1.7)*0.04+(mv?Math.sin(wp+i)*0.06:0), R=rootR+Math.sin(i*3.1)*7, c=Math.cos(a), s2=Math.sin(a), bend=Math.sin(i*2.3)*0.25, c2=Math.cos(a+bend), s3=Math.sin(a+bend), dz=stuck?-1.2:0;
    t3Limb(c*19,s2*21,11,c*R*0.55,s2*R*0.55,6.5+dz,8.4-(i%3)*0.8,GN.root,6.2);
    t3Limb(c*R*0.55,s2*R*0.55,6.5+dz,c2*R,s3*R,2.4+dz,6.2,GN.root,3.6); t3Ball(c2*R,s3*R,2.6+dz,3.8,GN.root); }
  t3Ell(0,0,13,31,33,14,GN.bark);
  // legs: two stumpy root bundles
  for(const sd of [-1,1]){
    const ph=wp+(sd>0?Math.PI:0), fx=9+Math.sin(ph)*8*ws, fz=Math.max(0,Math.cos(ph))*7*ws, fy=sd*23;
    rigSet(0,22,lean*0.3,twist*0.2,0,jit,oz*0.5); const hip=rp(2,sd*17,26); const foot=bpt(fx,fy,fz+4);
    const kn=bIK(hip,foot,17,17,0.8,sd*0.3,0.2,_gnE);
    t3Limb(hip[0],hip[1],hip[2],kn[0],kn[1],kn[2],12,GN.bark,10.5); t3Limb(kn[0],kn[1],kn[2],foot[0],foot[1],foot[2],10.5,GN.bark,9.5);
    for(let q=-1;q<=1;q++) t3Limb(foot[0],foot[1],foot[2]-1,foot[0]+13,foot[1]+q*8,fz*0.4,5,GN.root,2.6);
  }
  // the upper body leans and twists from the hips: one old trunk with a face in it
  rigSet(0,22,lean,twist,0,jit,oz);
  rEll(0,0,44,26,30,27,GN.bark);
  rEll(3,0,74,24,31,23,GN.bark,0.08*lean);
  for(const a of GN_GROOVE){ const c=Math.cos(a), s2=Math.sin(a), w=Math.sin(a*3)*2; if(Math.abs(a)<0.6) continue; rLine(c*25.5,s2*29.5,22,c*26+w,s2*30,46,2.3,GN.dark,0.4); rLine(c*26+w,s2*30,46,c*24,s2*30.5,70,2,GN.dark,0.4); }
  // moss on the shoulders and down the back
  for(const sd of [-1,1]){ rEll(0,sd*29,90,13,10,5.5,GN.moss,0,sd*0.4,1); rEll(-9,sd*18,94,9,8,4,GN.mossL,0,0,1.2); }
  rEll(-18,0,80,10,15,6,GN.moss,-0.6,0,1);
  // the knot on his back: a dark burl ring around an amber glow
  const kp=stuck?0.75+0.25*Math.sin(t*10):0.35+0.1*Math.sin(t*2);
  rEll(-25,0,50,4.5,13,12,GN.ring,0,0,0.6);
  rEll(-28,0,50,3.2,8.4,7.8,stuck?GN.knotS:GN.knot,0,0,1.2);
  if(stuck) rEll(-29.4,0,50.5,1.6,4.6,4.2,'#fff6d8',0,0,1.6);
  { const kq=rp(-29,0,50); const sd=bScrD(kq[0],kq[1],kq[2]), dk=sd[2], sx=sd[0], sy=sd[1]; const cq=rp(0,0,50); const dc=bDepth(cq[0],cq[1],cq[2]); const K=e._gnKnot||(e._gnKnot=[0,0,0,0]); K[0]=sx; K[1]=sy; K[2]=dk>dc?1:0; K[3]=kp; }
  // the face in the trunk: deep eye hollows under a heavy brow, a knobby nose, a crack of a mouth and a moss beard
  rigSet(0,22,lean+headP,twist*1.1,0,jit,oz);
  const ec=stuck?GN.eyeS:GN.eye;
  for(const sd of [-1,1]){
    rEll(23.4,sd*8.5,86,3.4,5.6,4.4,'#1a0c04',0,0,0.6);
    rDot(25.6,sd*8.5,85.8,2.6,ec,1.3); rDot(26,sd*8,86.6,0.9,'#ffffff',1.5);
    rEll(24.5,sd*9,91.5,5.5,8,3.2,GN.light,0.25,0,1.6,sd*0.32);
  }
  rCone(25,0,83,33,0,78,4.4,GN.light,1.6);
  rLine(25,-8,75.5,26.6,0,74,2.4,GN.ring,1.2); rLine(26.6,0,74,25,8,75.5,2.4,GN.ring,1.2);
  for(let i=0;i<5;i++){ const y=(i-2)*4.8, sw=Math.sin(t*1.8+i)*1.6, len=17+((i*7)%5)*2.2; rLimb(24,y,72,27.5+sw*0.4,y*1.25+sw,72-len,3.8,GN.moss,1.8,1.4); rEll(27.5+sw*0.4,y*1.25+sw,72-len,2.5,2.5,3,GN.mossL,0,0,1.5); }
  { const eq=rp(25.6,0,85.8), dE=bDepth(eq[0],eq[1],eq[2]), hq=rp(3,0,80), dH=bDepth(hq[0],hq[1],hq[2]); const sp2=bScrD(eq[0],eq[1],eq[2]); const E2=e._gnEye||(e._gnEye=[0,0,0]); E2[0]=sp2[0]; E2[1]=sp2[1]; E2[2]=dE>dH+4?1:0; }
  // a leafy crown on his head and back, two bare antler branches poking out of it
  rigSet(0,22,lean+headP*0.5,twist,0,jit,oz);
  for(const sd of [-1,1]){ rLimb(-6,sd*16,98,-14,sd*36,116,4.6,GN.dark,3.4); rLimb(-14,sd*36,116,-20,sd*54,136,3.4,GN.bark,1.6); rLimb(-14,sd*36,116,-6,sd*44,130,2.2,GN.bark,1.1); rLimb(-18,sd*46,126,-30,sd*52,134,1.8,GN.bark,0.9); }
  for(let i=0;i<GN_CAN.length;i++){ const c=GN_CAN[i], sw=Math.sin(t*1.3+i*1.9)*1.6;
    rEll(c[0]+sw,c[1],c[2],c[3],c[3]*0.95,c[3]*0.72,c[4]?GN.leafL:GN.leaf,0,0,c[4]?1:0.4); }
  if(e.dead||e.trialSprout){ rLine(4,0,124,4,0,134,1.6,'#5a9a2a',2); rEll(1,-2,135,3.6,2,1,'#8ad04a',0,-0.5,2.2); rEll(7,2,135,3.6,2,1,'#8ad04a',0,0.5,2.2); }
  // arms with knobby fists and twig fingers
  for(const sd of [-1,1]){
    rigSet(0,22,lean,twist,0,jit,oz); const sh=rp(4,sd*37,78); const h=sd>0?hR:hL; const hand=bpt(h[0],h[1],h[2]);
    const el=bIK(sh,hand,32,32,-0.3,sd*1,-0.45,_gnE);
    t3Limb(sh[0],sh[1],sh[2],el[0],el[1],el[2],10.5,GN.bark,8.6); t3Limb(el[0],el[1],el[2],hand[0],hand[1],hand[2],8.6,GN.bark,8);
    t3Line(sh[0],sh[1],sh[2]+4,el[0],el[1],el[2]+4,1.8,GN.dark,0.6);
    t3Ball(hand[0],hand[1],hand[2],11,GN.bark,{bias:0.5});
    const ux=hand[0]-el[0], uy=hand[1]-el[1], uz=hand[2]-el[2], ul=Math.hypot(ux,uy,uz)||1;
    for(let f=-1;f<=1;f++){ const fx=hand[0]+ux/ul*15+f*(-uy/ul)*7, fy=hand[1]+uy/ul*15+f*(ux/ul)*7, fz=hand[2]+uz/ul*15-2; t3Limb(hand[0]+ux/ul*7,hand[1]+uy/ul*7,hand[2]+uz/ul*7,fx,fy,fz,3.6,GN.dark,1.4,0.8); }
    rEll(4,sd*40,86,7,6,4,GN.moss,0,0,0.8);
  }
  // a log held overhead
  if(logH){ const lx=(hL[0]+hR[0])/2, lz=(hL[2]+hR[2])/2+6; t3Limb(lx,-64,lz,lx,64,lz,13,GN.log,13,0.8); for(const sd of [-1,1]) t3Ell(lx,sd*64.5,lz,12,1.6,12,GN.logEnd,{bias:1.2}); t3Line(lx-5,-56,lz+11,lx-5,56,lz+11,1.4,'#5a3a1e',1); }
  t3End();
  if(!fl){
    const E2=e._gnEye; if(E2[2]) bGlow(E2[0],E2[1],stuck?16:12,stuck?'255,224,102':'184,255,96',0.55);
    const K=e._gnKnot; if(K[2]) bGlow(K[0],K[1],22+kp*14,stuck?'255,210,110':'255,160,60',kp*0.8);
    if(e.burnT>0) bGlow(e.x,e.y-24,e.r*1.25,'255,130,50',0.22+0.06*Math.sin(t*12));
  }
  e._t3top=oy-(134+oz)*T3.st*k;
}
T3E.gnarl=t3Gnarl;
// the knot is its own invisible hit target; while it is open, its light shines through Gnarl from any side
T3E.knot=(e,fl)=>{
  const o=e.owner; if(!o||o.dead||!(e.alpha>0.05)) return;
  const q=o._gnKnot, t=G?G.time:0; if(!q) return;
  const p=0.75+0.25*Math.sin(t*10), g=t3bG();
  bGlow(q[0],q[1],q[2]?30:38,'255,214,120',(q[2]?0.35:0.6)*p);
  if(!q[2]){ g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle=`rgba(255,226,140,${0.5*p})`; g.lineWidth=2; g.beginPath(); g.arc(q[0],q[1],9+Math.sin(t*6)*2,0,TAU); g.stroke(); g.restore(); }
  e._t3top=q[1]-12;
};

// ---------- the Mirrow Serpent: a long body along e.trail that breaks the water in humps, and a crested head on a neck
// states: dive (e.rise 1 to 0, the head goes down), under (only a dark shape and two eye glints), riseW (rising), up (head up,
// spits ice when e.spit>0), whirlGo (under), whirl (half up, mouth open, circling the middle)
const SPN={body:'#2a84a2',dark:'#0e3448',light:'#7ad8e6',belly:'#c4ece4',fin:'#4ac0d8',frill:'#5ad8e8',rib:'#1e6a84',eye:'#ffe066',mouth:'#0a1e2a',tooth:'#eef8f4',under:'#103c4c',spot:'#8ee0ec'};
const SPS=[]; for(let i=0;i<62;i++) SPS.push({x:0,y:0,z:0,r:0});
const _spa=[0,0,0], _spb=[0,0,0], _spc=[0,0,0];
// world point at height z, for the world-aligned body passes (t3Begin with face 0 at the head)
function spW(wx,wy,z){ const R=T3R; return bpt(wx-R.x,(wy-R.y)/T3.ct,z); }
function t3Serpent(e,fl){
  const tr=e.trail; if(!tr||tr.length<6) return;
  const g=t3bG(), t=e.t||0, dt=bDt(e,'_spT'), S=e.state, n=tr.length;
  if(e.spit>0) e.spit=Math.max(0,e.spit-dt);   // the old drawer counted this down each frame
  _bpN=0;
  const sub=!!e.sub, whirl=S==='whirl', rise=sub?0:clamp(e.rise||0,0,1), headUp=!sub&&rise>0.02;
  const F=t3Turn(e,e.face,9);
  // the body along the trail: a sideways wave, and humps that arch out of the water
  let m=0;
  for(let j=0;j<n&&m<SPS.length;j++,m++){
    const a=tr[Math.max(0,j-1)], b=tr[Math.min(n-1,j+1)], dx=a.x-b.x, dy=a.y-b.y, l=Math.hypot(dx,dy)||1, w=Math.sin(j*0.3-t*2.6)*11*Math.min(1,j/8);
    const P=SPS[m]; P.x=tr[j].x-dy/l*w; P.y=tr[j].y+dx/l*w; P.r=Math.max(4.2,14.5-j*0.17);
    let z=(Math.sin(j*0.26-t*1.3)-0.28)*21; if(j<11) z=Math.min(z,-4-(11-j)*0.6); if(sub) z=Math.min(z,-3)-2; P.z=z;
  }
  g.save(); g.globalAlpha=1;
  // 1. the parts under the water: one dark shape seen through the lake (2D strokes, so the overlaps stay even)
  g.lineCap='round'; g.lineJoin='round'; g.strokeStyle=sub?'rgba(6,28,38,.5)':'rgba(6,28,38,.38)';
  for(let band=0;band<3;band++){ const i0=band*20, i1=Math.min(m-1,band*20+20); g.lineCap=band===2?'round':'butt'; g.lineWidth=(SPS[Math.min(m-1,i0+10)].r)*2.1; g.beginPath(); let pen=false;
    for(let i=i0;i<i1;i++){ const A=SPS[i], B=SPS[i+1]; if(A.z>=0&&B.z>=0){ pen=false; continue; }
      let ax=A.x, ay=A.y, bx=B.x, by=B.y; if(A.z>=0||B.z>=0){ const c=A.z/(A.z-B.z), cx=lerp(ax,bx,c), cy=lerp(ay,by,c); if(A.z>=0){ ax=cx; ay=cy; pen=false; } else { bx=cx; by=cy; } }
      if(!pen){ g.moveTo(ax,ay+3); pen=true; } g.lineTo(bx,by+3); }
    g.stroke(); }
  const upK=S==='riseW'?bSmooth(1-(e.st||0)/0.85):0;
  if(!headUp){ g.save(); g.translate(e.x,e.y+3); g.scale(1,T3.ct); g.rotate(F); g.fillStyle=sub?`rgba(6,28,38,${0.55+upK*0.2})`:'rgba(6,28,38,.4)'; g.beginPath(); g.ellipse(2,0,28,17,0,0,TAU); g.fill(); g.beginPath(); g.ellipse(26,0,14,9,0,0,TAU); g.fill();
    for(const sd of [-1,1]){ g.beginPath(); g.moveTo(-6,sd*14); g.quadraticCurveTo(-18,sd*34,-30,sd*28); g.quadraticCurveTo(-18,sd*20,-10,sd*10); g.fill(); } g.restore(); }
  // eye glints under the water, a ring of ripples over the head
  if(!headUp){
    g.strokeStyle=`rgba(220,250,255,${0.28+upK*0.3})`; g.lineWidth=2; g.beginPath(); g.ellipse(e.x+Math.cos(F)*5,e.y+Math.sin(F)*5,(44+Math.sin(t*5)*3)*(1+upK*0.2),(28+Math.sin(t*5)*2)*(1+upK*0.2),0,0,TAU); g.stroke();
    if(!fl) for(const sd of [-1,1]){ const ex=e.x+Math.cos(F)*16-Math.sin(F)*sd*10, ey=e.y+3+(Math.sin(F)*16+Math.cos(F)*sd*10)*T3.ct; g.fillStyle=`rgba(255,230,120,${0.55+upK*0.4})`; g.beginPath(); g.arc(ex,ey,2.4+upK,0,TAU); g.fill(); bGlow(ex,ey,8+upK*7,'255,230,120',0.3+upK*0.45); }
    e._t3top=e.y-12; }
  // 2. white water where the humps break the surface
  g.strokeStyle='rgba(225,250,255,.6)'; g.lineWidth=2;
  for(let i=0;i+1<m;i++){ const A=SPS[i], B=SPS[i+1]; if((A.z>=0)===(B.z>=0)) continue; const c=A.z/(A.z-B.z), cx=lerp(A.x,B.x,c), cy=lerp(A.y,B.y,c), cr=lerp(A.r,B.r,c);
    g.beginPath(); g.ellipse(cx,cy+1,cr*1.4+Math.sin(t*6+i)*1.5,cr*0.62,0,0,TAU); g.stroke(); }
  // 3. the humps behind the head, 4. the head, 5. the humps in front of it
  const hy=e.y;
  t3SerpentHumps(e,fl,m,hy,-1);
  if(headUp) t3SerpentHead(e,fl,F,rise,whirl);
  t3SerpentHumps(e,fl,m,hy,1);
  g.restore();
  if(headUp&&!fl&&Math.random()<0.2&&!T3BS.g) emit(e.x+rand(-20,20),e.y+rand(-6,10),1,{col:'200,240,255',glow:false,ang:Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
}
function t3SerpentHumps(e,fl,m,hy,side){
  const g=t3bG(), t=e.t||0;
  t3Begin(e.x,e.y,0,{k:1,g,flash:fl});
  let any=false;
  for(let i=0;i+1<m;i++){ const A=SPS[i], B=SPS[i+1]; if(A.z<0&&B.z<0) continue; const my=(A.y+B.y)/2; if(side<0?my>=hy:my<hy) continue; any=true;
    let ax=A.x, ay=A.y, az=A.z, bx=B.x, by=B.y, bz=B.z, ar=A.r, br=B.r;
    if(az<0||bz<0){ const c=az/(az-bz), cx=lerp(ax,bx,c), cy=lerp(ay,by,c), cr=lerp(ar,br,c); if(az<0){ ax=cx; ay=cy; az=0; ar=cr; } else { bx=cx; by=cy; bz=0; br=cr; } }
    const p=spW(ax,ay,az), q=spW(bx,by,bz);
    t3Limb(p[0],p[1],p[2],q[0],q[1],q[2],ar,SPN.body,br);
    if(i%3===0&&az>3) t3Dot(p[0],p[1],p[2]+ar*0.92,1.7,SPN.spot,0.4);
    if(i%4===2&&az>5&&bz>5){ const f0=spW(lerp(ax,bx,-0.6),lerp(ay,by,-0.6),az+ar*0.75), f1=spW(bx,by,bz+br*0.75), f2=spW(lerp(ax,bx,0.6),lerp(ay,by,0.6),Math.max(az,bz)+ar+10); bpoly(SPN.fin,{edge:SPN.rib,bias:0.4},f0,f2,f1); }
  }
  // the tail fin flips out of the water at the end
  const T=SPS[m-1], T2=SPS[m-3];
  if(T.z>0&&(side<0?T.y<hy:T.y>=hy)){ any=true; const dx=T.x-T2.x, dy=T.y-T2.y, l=Math.hypot(dx,dy)||1, ux=dx/l, uy=dy/l, sw=Math.sin(t*4)*0.3;
    for(const sd of [-1,1]){ const a=spW(T.x,T.y,T.z), b=spW(T.x+ux*24-uy*sd*7,T.y+uy*24+ux*sd*7,T.z+sd*15+sw*10), c=spW(T.x+ux*15,T.y+uy*15,T.z+sd*3); bpoly(SPN.fin,{edge:SPN.rib,bias:0.3},a,b,c); } }
  if(any) t3End(); else T3R.n=0;
}
function t3SerpentHead(e,fl,F,rise,whirl){
  const g=t3bG(), t=e.t||0, k=1.32, open=e.spit>0?1:whirl?0.75:0;
  const zh=6+28*rise+Math.sin(t*2.1)*1.4, oyH=zh*T3.st*k*0.82;
  t3Begin(e.x,e.y+oyH,F,{k,flash:fl,g});
  // the neck rises out of the water from behind the head
  const B=SPS[9], C=SPS[4], b0=bInv(B.x,B.y,-6,_spa), c0=bInv(C.x,C.y,zh*0.55,_spb), hx=-11, hz=zh-1;
  let px=0,py=0,pz=0,pr=0,started=false;
  for(let s=0;s<=6;s++){ const u=s/6, u1=1-u, x=u1*u1*b0[0]+2*u1*u*c0[0]+u*u*hx, y=u1*u1*b0[1]+2*u1*u*c0[1], z=u1*u1*b0[2]+2*u1*u*c0[2]+u*u*hz, r=lerp(14.5,11.5,u)/k*1.05;
    if(!started){ if(z>=0){ started=true; if(s>0){ const c=pz/(pz-z); px=lerp(px,x,c); py=lerp(py,y,c); pz=0; } else { px=x; py=y; pz=Math.max(0,z); }
        const ring=bScr(px,py,0); g.strokeStyle='rgba(225,250,255,.6)'; g.lineWidth=2.5; g.beginPath(); g.ellipse(ring[0],ring[1]+1,30+Math.sin(t*4)*3,15,0,0,TAU); g.stroke(); }
      else { px=x; py=y; pz=z; pr=r; continue; } }
    if(s>0&&started&&!(px===x&&py===y)){ t3Limb(px,py,pz,x,y,z,pr||r,SPN.body,r); t3Limb(px+2,py,pz-3,x+3,y,z-4,(pr||r)*0.62,SPN.belly,r*0.6,0.4);
      if(s%2===0) bpoly(SPN.fin,{edge:SPN.rib,bias:0.2},bpt(px,py,pz+(pr||r)*0.8),bpt(x-6,y,z+r+8),bpt(x,y,z+r*0.85)); }
    px=x; py=y; pz=z; pr=r; }
  // the head
  const up=open*0.12, H=bRotXZ, hingeX=4, hingeZ=zh-3;
  t3Ell(0,0,zh,17,13,11,SPN.body,{pitch:-up});
  let q=H(17,zh-1.5,hingeX,hingeZ,up); t3Ell(q[0],0,q[1],13,9,6.5,SPN.body,{pitch:0.1-up});
  q=H(15,zh+3.4,hingeX,hingeZ,up); t3Line(q[0]-12,0,q[1]+4.5,q[0]+6,0,q[1]-1,2.2,SPN.light,0.4);
  // lower jaw, throat, mouth and teeth
  const dn=open*0.55; q=H(13,zh-7.5,hingeX,hingeZ,-dn); t3Ell(q[0],0,q[1],14,8.5,3.6,SPN.belly,{pitch:dn,bias:-0.3});
  t3Ell(-2,0,zh-8,11,10,5,SPN.belly,{bias:-0.5});
  const fw=Math.sin(F)*T3.st;
  if(open>0.05){ q=H(12,zh-4.5,hingeX,hingeZ,-dn*0.5); t3Ell(q[0],0,q[1],11,6.5,2.5+open*2.5,SPN.mouth,{bias:2+fw*10});
    for(let i=0;i<4;i++){ const tx=10+i*4.2; for(const sd of [-1,1]){ q=H(tx,zh-3.5,hingeX,hingeZ,up); t3Cone(q[0],sd*(6.5-i*0.9),q[1],q[0]+0.4,sd*(6.5-i*0.9),q[1]-3,1.1,SPN.tooth,4+fw*12); } }
    if(e.spit>0&&!fl){ const mq=H(26,zh-3,hingeX,hingeZ,0), ms=bScr(mq[0],0,mq[1]); bGlow(ms[0],ms[1],16,'190,235,255',0.7*Math.min(1,e.spit/0.15)); } }
  // eyes, brows, nostrils, whiskers
  const eye=SPN_EYE;
  for(const sd of [-1,1]){ q=H(8,zh+4,hingeX,hingeZ,up);
    t3Ball(q[0],sd*8.6,q[1],3.7,SPN.eye,{bias:0.3}); t3Line(q[0]+3.4,sd*8.9,q[1]-1.8,q[0]+3.4,sd*8.9,q[1]+1.8,1.2,'#0a1a20',0.6); t3Dot(q[0]+3.2,sd*8,q[1]+1.6,0.7,'#ffffff',0.8);
    const sp2=bScrD(q[0]+3,sd*8.6,q[1]); const j=sd>0?3:0; eye[j]=sp2[0]; eye[j+1]=sp2[1]; eye[j+2]=sp2[2]>bDepth(0,0,zh)?1:0;
    q=H(8,zh+8,hingeX,hingeZ,up); t3Ell(q[0],sd*8.4,q[1],4.4,2.6,1.5,SPN.rib,{roll:sd*0.4,pitch:-0.2,bias:0.5});
    q=H(28,zh,hingeX,hingeZ,up); t3Dot(q[0],sd*3.4,q[1],1.1,SPN.dark,0.4);
    q=H(25,zh-3,hingeX,hingeZ,up); const wv=Math.sin(t*2.4+sd)*2; t3Line(q[0],sd*4.5,q[1],q[0]+6,sd*12,q[1]-6+wv,1.1,SPN.light,0.2); t3Line(q[0]+6,sd*12,q[1]-6+wv,q[0]+4,sd*17,q[1]-13+wv,0.9,SPN.light,0.2);
  }
  // a crest along the skull and big side frills
  for(let i=0;i<3;i++){ const x0=4-i*8; bpoly(SPN.fin,{edge:SPN.rib,bias:0.6},bpt(x0,0,zh+10-i),bpt(x0-12,0,zh+21-i*2),bpt(x0-8,0,zh+9-i)); }
  const fl2=Math.sin(t*3)*0.08+open*0.15;
  for(const sd of [-1,1]){ const a=bpt(-3,sd*11,zh+3), b=bpt(-20,sd*(31+fl2*20),zh+12+fl2*10), c=bpt(-25,sd*(26+fl2*16),zh-4), d=bpt(-8,sd*12,zh-5);
    bpoly(SPN.frill,{edge:SPN.rib,bias:-0.2},a,b,c,d); t3Line(-4,sd*11,zh+1,b[0]+2,b[1]*0.92,b[2]-2,1,SPN.rib,0); t3Line(-5,sd*11,zh-1,c[0]+3,c[1]*0.92,c[2]+2,1,SPN.rib,0); }
  t3End();
  if(!fl) for(let j=0;j<6;j+=3) if(eye[j+2]) bGlow(eye[j],eye[j+1],9,'255,224,102',0.55);
  e._t3top=e.y+oyH-(zh+22)*T3.st*k;
}
const SPN_EYE=[0,0,0,0,0,0];
T3E.serpent=t3Serpent;

// ---------- Skrae the Storm Wyvern: white and storm-blue, gold stripes and horns, a lightning-bolt tail, fought in the air
// states: chase / recover / toPerch (flapping), diveAim (wings high, nose down), dive (wings swept back), orbs (mouth glows),
// storm (e.charge: wings spread, crackling), galeW (wings raised back) then gale (huge beats), perched / peck / takeoff (on a perch)
const SK={white:'#f2f4fa',belly:'#dfe6f2',back:'#5a6ea8',dark:'#26345a',mem:'#4e66aa',mem2:'#3c5290',gold:'#ffcc40',eye:'#bfefff',mouth:'#2a1a3a',talon:'#2a2a38'};
// wing key points from the shoulder (right wing): elbow, wrist, three finger tips (outer to inner), and the root on the flank
const SKW_O=[[-4,26,3],[6,50,5],[-8,98,4],[-36,84,2],[-52,52,0],[-30,7,-2]];
const SKW_F=[[-9,11,6],[-3,16,13],[-42,17,14],[-46,14,9],[-44,11,4],[-30,6,0]];
const _skw=[]; for(let i=0;i<7;i++) _skw.push([0,0,0]);
const SK_BOLT=[[0,4],[9,6.5],[5,1.6],[18,2],[3,-3.2],[6,0.4],[0,-1.2]];
function skWing(sd,S,fold,raise,lag,sweep,col,fl){
  const ca=Math.cos(sweep), sa=Math.sin(sweep);
  for(let i=0;i<6;i++){ const o=SKW_O[i], f=SKW_F[i];
    let x=lerp(o[0],f[0],fold), y=lerp(o[1],f[1],fold), z=lerp(o[2],f[2],fold);
    if(i!==5){ const x1=x*ca-y*sa, y1=x*sa+y*ca; x=x1; y=y1; }
    const th=raise+(i>=2&&i<=4?lag*(i===2?1:i===3?0.8:0.5):i===1?lag*0.35:0)*(1-fold), c=Math.cos(th), s=Math.sin(th);
    const y2=y*c-z*s, z2=y*s+z*c;
    const q=rp(S[0]+x,S[1]+sd*y2,S[2]+z2); const w=_skw[i]; w[0]=q[0]; w[1]=q[1]; w[2]=q[2]; }
  const s0=rp(S[0],S[1],S[2]), Sx=s0[0], Sy=s0[1], Sz=s0[2];
  const E=_skw[0], W=_skw[1], T1=_skw[2], T2=_skw[3], T3=_skw[4], R=_skw[5];
  const M=(a,b,u)=>bpt(lerp(lerp(a[0],b[0],0.5),W[0],u),lerp(lerp(a[1],b[1],0.5),W[1],u),lerp(lerp(a[2],b[2],0.5),W[2],u));
  bpoly(SK.mem2,{bias:-0.2},bpt(Sx,Sy,Sz),E,W,T3,R);
  bpoly(col,{bias:-0.1},W,T3,M(T3,T2,0.2),T2);
  bpoly(col,{bias:-0.1},W,T2,M(T2,T1,0.16),T1);
  t3Limb(Sx,Sy,Sz,E[0],E[1],E[2],3,SK.dark,2.4); t3Limb(E[0],E[1],E[2],W[0],W[1],W[2],2.4,SK.dark,1.9);
  t3Limb(W[0],W[1],W[2],T1[0],T1[1],T1[2],1.6,SK.dark,0.7); t3Line(W[0],W[1],W[2],T2[0],T2[1],T2[2],1.5,SK.dark); t3Line(W[0],W[1],W[2],T3[0],T3[1],T3[2],1.3,SK.dark);
  t3Line(E[0],E[1],E[2]+1.4,W[0],W[1],W[2]+1.2,1.3,SK.gold,0.2); t3Line(W[0],W[1],W[2]+1,lerp(W[0],T1[0],0.6),lerp(W[1],T1[1],0.6),lerp(W[2],T1[2],0.6)+0.6,1.1,SK.gold,0.2);
  t3Cone(W[0],W[1],W[2],W[0]+4,W[1]+sd*1,W[2]+3,1.4,SK.gold,0.3);
}
function t3Skrae(e,fl){
  const g=t3bG(), t=e.t||0, F=t3Turn(e,e.face,e.state==='dive'?16:9), k=1.25, dt=bDt(e,'_skT'), S=e.state, st=e.st||0;
  _bpN=0; t3SkraeBolts();
  const perch=S==='perched'||S==='peck', take=S==='takeoff';
  // altitude eases between the perch and the sky (body centre about 56 units up while flying)
  const want=perch?0:take?0.45:S==='dive'?0.78:1; e._skA=e._skA==null?want:e._skA+(want-e._skA)*Math.min(1,dt*(want>e._skA?5:4)); const air=e._skA;
  const fp=e.flap||0, flapS=Math.sin(fp);
  // pose
  let fold=0, raise=0.25+0.62*flapS, lag=-0.32*Math.cos(fp), sweep=0.05, pitch=0, headDn=0, open=0, neckX=0, crouch=0, charge=0, legT=1;
  if(perch){ fold=0.96; raise=-0.08+Math.sin(t*1.5)*0.03; lag=0; sweep=0.3; pitch=-0.3; legT=0; }
  if(S==='peck'){ const q=1-st/0.5; neckX=q<0.7?-6*bSmooth(q/0.7):lerp(-6,16,bSmooth((q-0.7)/0.3)); headDn=q<0.7?-0.2:0.5; open=q>0.6?1:0.3; pitch=-0.15; }
  if(take){ const q=1-st/0.4; fold=lerp(0.9,0,bSmooth(q*1.6)); raise=lerp(0.4,1.05,bSmooth(q)); lag=-0.3; crouch=Math.sin(Math.min(1,q*1.5)*Math.PI)*5; pitch=-0.25; legT=q; }
  else if(S==='diveAim'){ const q=bSmooth(1-st/0.8); raise=lerp(raise,1.0,q); lag=lerp(lag,-0.2,q); pitch=0.18*q; headDn=0.2*q; fold=0.15*q; }
  else if(S==='dive'){ fold=0.55; raise=0.18+Math.sin(t*30)*0.03; lag=0.12; sweep=0.55; pitch=0.28; headDn=0.12; }
  else if(S==='orbs'){ const q=1-st/0.6; open=bSmooth(q*1.4); neckX=-4+q*8; headDn=-0.1; e._skOrb=q; }
  else if(S==='storm'){ charge=1; fold=0; raise=0.75+Math.sin(t*20)*0.05; lag=-0.1; pitch=-0.3; headDn=-0.35; open=0.8; }
  else if(S==='galeW'){ const q=bSmooth(1-st/0.7); raise=lerp(raise,1.15,q); lag=lerp(lag,-0.4,q); sweep=lerp(0.05,-0.25,q); pitch=-0.3*q; headDn=-0.15*q; }
  else if(S==='gale'){ const ph=t*17, s2=Math.sin(ph); raise=0.3+0.75*s2; lag=-0.45*Math.cos(ph); sweep=-0.15+0.25*Math.cos(ph); pitch=-0.18; open=0.5; }
  if(e.charge>0) charge=1;
  const zc=20+crouch*-1, Hf=56, zl=air*(Hf-zc)+Math.sin(t*2.2)*2*air+(perch?0:Math.sin(fp)*-1.5*air)-crouch;
  const oy=e.y+(1-air)*zc*T3.st*k;
  t3Begin(e.x,oy,F,{k,flash:fl,g,z:zl});
  // a wing-shaped shadow on the ground while she is up
  if(air>0.15&&!fl){ g.save(); g.globalAlpha*=0.16*air; g.fillStyle='#0a0c18'; const c=T3R.c, s=T3R.s, gx=(bx,by)=>e.x+(bx*c-by*s)*k, gy=(bx,by)=>oy+(bx*s+by*c)*T3.ct*k;
    g.beginPath(); for(const sd of [-1,1]){ const sp=Math.max(0.35,Math.cos(raise)*(1-fold*0.7)); g.moveTo(gx(14,0),gy(14,0)); g.lineTo(gx(14,sd*20*sp),gy(14,sd*20*sp)); g.lineTo(gx(-6,sd*98*sp),gy(-6,sd*98*sp)); g.lineTo(gx(-34,sd*80*sp),gy(-34,sd*80*sp)); g.lineTo(gx(-48,sd*50*sp),gy(-48,sd*50*sp)); g.lineTo(gx(-30,0),gy(-30,0)); g.closePath(); }
    g.fill(); g.beginPath(); g.ellipse(e.x,oy,26*k,13*k*T3.ct*1.4,0,0,TAU); g.fill(); g.restore(); }
  rigSet(-4,zc,pitch,0,0,0,0);
  // tail with a lightning-bolt blade
  { let px=-22, py=0, pz=zc-1, a=Math.PI, pa=0; const n=8;
    for(let i=0;i<n;i++){ a+=Math.sin(t*2.4-i*0.6)*0.12; pa+=perch?0.12:0.02+Math.sin(t*1.7-i*0.5)*0.03; const L=9, nx=px+Math.cos(a)*L*Math.cos(pa), ny=py+Math.sin(a)*L*Math.cos(pa), nz=pz-Math.sin(pa)*L*(perch?1:0.6);
      const r=6-i*0.5; rLimb(px,py,pz,nx,ny,nz,r,i<2?SK.white:SK.back,r-0.5); if(i%2===1) rLine(px,py,pz+r*0.9,nx,ny,nz+(r-0.5)*0.9,1.4,SK.gold,0.3); px=nx; py=ny; pz=nz; }
    const ux=Math.cos(a), uy=Math.sin(a); _bpL.length=0;
    for(const [u,v] of SK_BOLT) _bpL.push(rp(px+ux*u,py+uy*u,pz+v*1.3));
    t3Poly(_bpL,SK.gold,{edge:'#a87a10',bias:0.2});
    const tq=rp(px+ux*9,py+uy*9,pz+1); const tp=bScr(tq[0],tq[1],tq[2]), TT=e._skTail||(e._skTail=[0,0]); TT[0]=tp[0]; TT[1]=tp[1]; }
  // legs: tucked behind in flight, gripping the rock when perched
  for(const sd of [-1,1]){
    const hip=rp(-12,sd*7,zc-4), lt=legT*air;
    const foot=lt>0.5?rp(-26,sd*6,zc-9):bpt(-2,sd*9,crouch*0.3);
    const kn=bIK(hip,foot,10,11,lt>0.5?-0.2:1,sd*0.3,lt>0.5?-1:0.2,_gnE);
    t3Limb(hip[0],hip[1],hip[2],kn[0],kn[1],kn[2],4.6,SK.white,3.6); t3Limb(kn[0],kn[1],kn[2],foot[0],foot[1],foot[2],2.8,SK.dark,2.2);
    for(let q=-1;q<=1;q++) t3Cone(foot[0],foot[1],foot[2],foot[0]+5,foot[1]+q*2.6,foot[2]-1.2,1.2,SK.talon,0.2);
    t3Cone(foot[0],foot[1],foot[2],foot[0]-4,foot[1],foot[2]-1,1.1,SK.talon,0.2);
  }
  // body: white underneath, storm-blue back, gold chevrons
  rEll(4,0,zc,20,12,11,SK.white);
  rEll(-14,0,zc-1,15,10,9,SK.white);
  rEll(-3,0,zc+5,23,8.5,5.5,SK.back,0,0,0.4);
  rEll(4,0,zc-5,15,9,6,SK.belly,0,0,-0.6);
  for(let i=0;i<4;i++){ const x=12-i*9; rLine(x-4,-6,zc+8.5,x,0,zc+10.6,1.8,SK.gold,0.9); rLine(x,0,zc+10.6,x-4,6,zc+8.5,1.8,SK.gold,0.9); }
  // wings
  for(const sd of [-1,1]) skWing(sd,bpt(8,sd*9,zc+6),fold,raise,lag,sweep,SK.mem,fl);
  // neck and head
  const hx=40+neckX, hz=zc+10-headDn*10;
  rLimb(15,0,zc+3,26+neckX*0.4,0,zc+8-headDn*4,6.2,SK.white,5.4); rLimb(26+neckX*0.4,0,zc+8-headDn*4,hx-5,0,hz-1,5.4,SK.white,4.6);
  rLine(15,0,zc+8.5,hx-6,0,hz+3.6,2.4,SK.back,0.6);
  rigSet(-4,zc,pitch+headDn,0,0,0,0);
  const hq=rp(hx,0,hz); const Hx=hq[0], Hz=hq[2];
  rigSet(Hx,Hz,pitch+headDn,0,0,0,0);
  rEll(Hx,0,Hz,8.5,6.2,5.6,SK.white);
  rEll(Hx+9,0,Hz-0.8-open*0.6,7.4,4,3,SK.white,0.1);
  const dq=bRotXZ(Hx+7,Hz-3.6,Hx,Hz-2,-open*0.5); rEll(dq[0],0,dq[1],7,3.4,1.6,SK.belly,open*0.5,0,-0.2);
  if(open>0.1){ rEll(Hx+7,0,Hz-2.6,6,2.8,1.4+open,SK.mouth,0,0,0.8); }
  for(const sd of [-1,1]){
    rLimb(Hx-3,sd*3.6,Hz+4,Hx-13,sd*6.5,Hz+8,1.8,SK.gold,1.2); rCone(Hx-13,sd*6.5,Hz+8,Hx-21,sd*8.5,Hz+8.5,1.3,SK.gold,0.2);
    rDot(Hx+4.6,sd*4.3,Hz+1.6,1.5,SK.eye,1); rDot(Hx+4.9,sd*4,Hz+2.1,0.55,'#ffffff',1.2);
    rEll(Hx+4,sd*4.4,Hz+3.4,3,1.6,0.9,SK.dark,-0.2,0,0.8,sd*0.4);
  }
  bpoly(SK.gold,{bias:0.2},rp(Hx-2,0,Hz+5.5),rp(Hx-10,0,Hz+10),rp(Hx-6,0,Hz+5));
  { const eq=rp(Hx+4.6,0,Hz+1.6), ep=bScrD(eq[0],eq[1],eq[2]), dE=ep[2]; const E=e._skEye||(e._skEye=[0,0,0]); E[0]=ep[0]; E[1]=ep[1]; E[2]=dE>bDepth(Hx,0,Hz)-1?1:0;
    const mq=rp(Hx+17,0,Hz-1); const mp=bScr(mq[0],mq[1],mq[2]); const Mo=e._skMouth||(e._skMouth=[0,0]); Mo[0]=mp[0]; Mo[1]=mp[1]; }
  t3End();
  if(!fl){
    const E=e._skEye; if(E[2]) bGlow(E[0],E[1],8,'138,216,255',0.6);
    if(S==='orbs'){ const q=e._skOrb||0; bGlow(e._skMouth[0],e._skMouth[1],10+q*18,'200,150,255',0.4+q*0.5); bGlow(e._skMouth[0],e._skMouth[1],5+q*6,'240,230,255',0.6); }
    if(e.angry||charge) bGlow(e._skTail[0],e._skTail[1],14,'255,220,120',0.35+0.25*Math.random());
    if(charge||e.state==='storm'){ const cx=e.x, cy=oy-(zl+zc)*T3.st*k; g.save(); g.lineWidth=1.5; for(let i=0;i<3;i++){ const a=rand(0,TAU), r=rand(26,56); g.strokeStyle='rgba(210,230,255,.85)'; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(a)*r*0.5+rand(-6,6),cy+Math.sin(a)*r*0.5); g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); g.stroke(); } g.restore(); bGlow(cx,cy,52,'190,220,255',0.3); }
    if(e.angry&&Math.random()<0.5){ const cx=e.x, cy=oy-(zl+zc+4)*T3.st*k, sd=Math.random()<0.5?-1:1, a=F+sd*Math.PI/2; g.save(); g.strokeStyle=`rgba(200,225,255,${0.5+0.4*Math.random()})`; g.lineWidth=1.2; g.beginPath(); let x=cx+Math.cos(a)*30*k, y=cy+Math.sin(a)*30*k*T3.ct; g.moveTo(x,y); for(let i=0;i<4;i++){ x+=Math.cos(a)*18*k+rand(-6,6); y+=Math.sin(a)*18*k*T3.ct+rand(-6,6); g.lineTo(x,y); } g.stroke(); g.restore(); }
  }
  e._t3top=oy-(zl+zc+26)*T3.st*k;
}
T3E.skrae=t3Skrae;
// lightning bolts that strike the Sky Trial floor (the old drawer drew these with Skrae, so the 3D one keeps them)
function t3SkraeBolts(){
  const T=AREA&&AREA.tri; if(!T||!T.bolts) return; const g=t3bG();
  for(const b of T.bolts){ const k=1-b.t/0.35; g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle=`rgba(220,235,255,${k})`; g.lineWidth=5*k+1; g.beginPath(); let x=b.x+rand(-20,20), y=b.y-420; g.moveTo(x,y); for(let i=0;i<7;i++){ x=lerp(x,b.x,0.35)+rand(-18,18); y+=60; g.lineTo(i===6?b.x:x,i===6?b.y:y); } g.stroke(); g.strokeStyle=`rgba(255,255,255,${k})`; g.lineWidth=1.6; g.stroke(); g.restore(); glowAt(b.x,b.y,70,'200,220,255',0.6*k); }
}

// ---------- Vorlaxis, the First Flame: a huge dragon of dark red scales split by glowing cracks
// The body sits over (e.x,e.y) and the head over (e.headX,e.headY), the two hit circles. e.alt lifts him, e.scale grows him
// (takeoff and landing), e.alpha fades him (he is out of sight while flying, only his shadow sweeps the ground).
// states: walk, breathW / breath, tailW (+ e.tailFx sweep), stompW (rears up), fbW, summonW, roarShift, takeoff, flying,
// landW, stagger (head down, dizzy), recover; dying while e.deathT runs
const VX={body:'#5c1618',scale:'#6a1a1a',dark:'#2e0a0c',mid:'#7a2020',belly:'#7e5436',plate:'#b08a5a',bone:'#dccaa2',boneD:'#7a6448',mem:'#621a1a',mem2:'#420c0e',crackD:'#a02a08',crack:'#ff7a1a',crack2:'#ffa040',crack3:'#ffd060',eye:'#ffb020',mouth:'#1a0303',claw:'#ece0c4',spike:'#2a0a0a'};
const VXW_O=[[-12,44,24],[4,86,38],[-6,150,28],[-48,140,12],[-84,108,0],[-100,66,-8],[-70,10,-14]];
const VXW_F=[[-20,22,32],[-10,30,54],[-66,36,52],[-74,32,42],[-78,28,30],[-80,24,18],[-64,8,-4]];
const _vxw=[]; for(let i=0;i<7;i++) _vxw.push([0,0,0]);
const VX_CRACKS=[[[-34,-18],[-26,-12],[-30,-4]],[[10,20],[20,14],[30,19]],[[-8,24],[0,18],[-4,10]],[[16,-24],[8,-17],[14,-9]],[[-20,20],[-14,26]],[[30,-6],[40,-12]],[[-44,6],[-38,14],[-46,20]],[[2,-6],[-6,2],[-2,8]],[[-16,-24],[-22,-16]]];
const VX_SCALE=[]; for(const x of [-40,-22,-4,14]) for(const y of [-21,21]) VX_SCALE.push([x+8,y,7.5]);
const VX_SPK=[[32,10],[18,12],[4,13],[-10,12.5],[-24,12],[-38,10.5],[-50,9]];
const _vxA=[0,0,0], _vxB=[0,0,0], _vxH=[0,0,0], _vxN=[0,0,0];
const VX_EYE=[0,0,0,0,0,0], VX_MOUTH=[0,0,0];
function vxSurf(x,y){ return Math.max(bSurfZ(14,0,50,36,30,26,x,y),bSurfZ(-22,0,46,32,28,23,x,y)); }
function vxWing(sd,S,fold,raise,lag,sweep,col,fl){
  const ca=Math.cos(sweep), sa=Math.sin(sweep);
  for(let i=0;i<7;i++){ const o=VXW_O[i], f=VXW_F[i];
    let x=lerp(o[0],f[0],fold), y=lerp(o[1],f[1],fold), z=lerp(o[2],f[2],fold);
    if(i!==6){ const x1=x*ca-y*sa, y1=x*sa+y*ca; x=x1; y=y1; }
    const th=raise+(i>=2&&i<=5?lag*(1-(i-2)*0.2):i===1?lag*0.35:0)*(1-fold), c=Math.cos(th), s=Math.sin(th);
    const q=rp(S[0]+x,S[1]+sd*(y*c-z*s),S[2]+y*s+z*c); const w=_vxw[i]; w[0]=q[0]; w[1]=q[1]; w[2]=q[2]; }
  const s0=rp(S[0],S[1],S[2]), Sx=s0[0], Sy=s0[1], Sz=s0[2];
  const E=_vxw[0], W=_vxw[1], T1=_vxw[2], T2=_vxw[3], T3=_vxw[4], T4=_vxw[5], R=_vxw[6];
  const M=(a,b,u)=>bpt(lerp(lerp(a[0],b[0],0.5),W[0],u),lerp(lerp(a[1],b[1],0.5),W[1],u),lerp(lerp(a[2],b[2],0.5),W[2],u));
  bpoly(VX.mem2,{bias:-0.3},bpt(Sx,Sy,Sz),E,W,T4,R);
  bpoly(col,{bias:-0.2},W,T4,M(T4,T3,0.16),T3);
  bpoly(col,{bias:-0.2},W,T3,M(T3,T2,0.16),T2);
  bpoly(col,{bias:-0.2},W,T2,M(T2,T1,0.14),T1);
  t3Limb(Sx,Sy,Sz,E[0],E[1],E[2],7,VX.dark,5.6); t3Limb(E[0],E[1],E[2],W[0],W[1],W[2],5.6,VX.dark,4.2);
  t3Limb(W[0],W[1],W[2],T1[0],T1[1],T1[2],3.4,VX.dark,1.4); t3Limb(W[0],W[1],W[2],T2[0],T2[1],T2[2],2.8,VX.dark,1.2);
  t3Limb(W[0],W[1],W[2],T3[0],T3[1],T3[2],2.6,VX.dark,1.1); t3Limb(W[0],W[1],W[2],T4[0],T4[1],T4[2],2.4,VX.dark,1);
  t3Cone(W[0],W[1],W[2],W[0]+9,W[1]+sd*2,W[2]+7,3,VX.bone,0.4);
  t3Cone(E[0],E[1],E[2],E[0]-2,E[1]+sd*2,E[2]+9,2.6,VX.bone,0.3);
  t3Cone(T1[0],T1[1],T1[2],T1[0]-1,T1[1]+sd*8,T1[2]-2,1.6,VX.bone,0.2);
}
function t3Vorlaxis(e){
  const g=t3bG(), t=e.t||0, S=e.state, st=e.st||0, dt=bDt(e,'_vxT');
  const dying=e.dead&&e.deathT!=null, dT=dying?e.deathT:0;
  let alpha=e.alpha==null?1:e.alpha; if(dying) alpha=clamp(1-dT/2.6,0,1);
  const fl=e.flash>0||(dying&&Math.floor(dT*10)%2===0);
  const fall=dying?bSmooth(Math.min(1,dT/0.7)):0, alt=(e.alt||0)*(1-fall), sc=lerp(e.scale||1,1,fall), k=1.0*sc, F=t3Turn(e,e.face,S==='breath'?20:6), ph=e.phase||1;
  _bpN=0;
  const mv=Math.hypot(e.dx||0,e.dy||0)>5; e._wph=(e._wph||0)+dt*(mv?3.6:0); const wp=e._wph, ws=mv?1:0;
  const fly=!dying&&(S==='takeoff'||S==='flying'||S==='landW');
  // pose
  let pitch=0.02, bodyZ=0, fold=0.5, raise=0.32+Math.sin(t*1.4)*0.04, lag=0.12, sweep=0.22, open=0, headP=0.06, zh=52, front=0, tailCoil=0, droop=0, hr=e.headRel||0, roar=0;
  const mg=e.mouthGlow||0;
  if(S==='breathW'){ open=0.35+Math.sin(t*9)*0.06; headP=0.22; zh=46; fold=0.45; raise=0.35; sweep=0.05; }
  if(S==='breath'){ open=1; headP=0.08; zh=50; fold=0.3; raise=0.45; sweep=0.25; }
  if(S==='fbW'){ open=0.8; headP=-0.18; zh=58; fold=0.5; raise=0.6; }
  if(S==='summonW'||S==='roarShift'){ roar=1; open=1; headP=-0.42; zh=62; fold=0; raise=(S==='roarShift'?0.5:0.4)+Math.sin(t*6)*0.04; lag=-0.25; sweep=-0.12; pitch=-0.14; }
  if(S==='tailW'){ const q=bSmooth(1-st/0.65); tailCoil=q; pitch=0.06*q; headP=0.15; }
  if(S==='stompW'){ const q=bSmooth(1-st/0.75); pitch=-0.6*q; bodyZ=4*q; front=q; fold=lerp(0.46,0,q); raise=lerp(raise,0.75,q); lag=-0.2*q; headP=lerp(0.06,-0.35,q); open=0.5*q; }
  if(S==='stagger'){ droop=1; headP=0.5; zh=16; fold=0.35; raise=-0.32; sweep=0.35; bodyZ=-5; pitch=0.12; open=0.25; }
  if(S==='takeoff'){ const q=clamp(1-st/0.9,0,1); fold=0; raise=0.3+0.8*Math.sin(t*9); lag=-0.4*Math.cos(t*9); pitch=-0.15; }
  if(S==='landW'){ fold=0; raise=0.9+Math.sin(t*7)*0.2; lag=-0.3; pitch=-0.2; sweep=-0.15; }
  if(dying){ if(dT<0.8){ const q=bSmooth(dT/0.8); roar=1; open=q; headP=-0.45*q; zh=52+12*q; pitch=-0.25*q; fold=lerp(0.62,0,q); raise=lerp(0.55,0.9,q); }
    else { const q=bSmooth((dT-0.8)/1.4); open=lerp(1,0.3,q); headP=lerp(-0.45,0.55,q); zh=lerp(64,12,q); pitch=lerp(-0.25,0.12,q); bodyZ=-12*q; fold=lerp(0,0.4,q); raise=lerp(0.9,-0.4,q); sweep=0.3*q; droop=q; } }
  if(e.staggered&&S!=='stagger') { droop=Math.max(droop,0.5); }
  const zb=46, ox=e.x, oy=e.y+zb*T3.st*k, tailFx=e.tailFx||0;
  // the shadow on the ground (it stays even while he is high in the sky)
  { const sh=clamp(1-alt/600,0.55,1), A=(AREA?0.36:0.3)*(fly?0.75+0.25*sh:sh); g.save(); g.globalAlpha=A; g.fillStyle='#000';
    g.beginPath(); g.ellipse(ox,oy,100*sh*k,62*sh*k,0,0,TAU); g.fill();
    if(fly&&alt>30){ const c=Math.cos(F), s=Math.sin(F), P=(bx,by)=>{ g.lineTo(ox+(bx*c-by*s)*k*sh*1.15,oy+(bx*s+by*c)*T3.ct*k*sh*1.15); }; const flap=Math.cos(t*(S==='flying'?3:7))*0.2+0.8;
      g.beginPath(); for(const sd of [-1,1]){ P(26,sd*14); P(0,sd*150*flap); P(-38,sd*132*flap); P(-50,sd*104*flap); P(-80,sd*92*flap); P(-86,sd*58*flap); P(-60,sd*16); P(-60,-sd*16); P(26,-sd*14); } g.closePath(); g.fill();
      g.beginPath(); P(130,0); P(104,12); P(60,16); P(-40,26); P(-120,10); P(-200,0); P(-120,-10); P(-40,-26); P(60,-16); P(104,-12); g.closePath(); g.fill(); }
    g.restore(); }
  if(alpha<=0.01) return;
  const buf=alpha<0.99&&g===ctx?vxBuf():null, G2=buf?buf.getContext('2d'):g;
  if(buf){ G2.setTransform(1,0,0,1,0,0); G2.clearRect(0,0,buf.width,buf.height); G2.setTransform(g.getTransform()); T3BS.g=G2; }
  t3Begin(ox,oy,F,{k,flash:fl,g:G2,z:alt+bodyZ,alpha:buf?1:alpha});
  // legs: four big legs, diagonal pairs step together; tucked up in the air
  const airK=clamp(alt/70,0,1);
  rigSet(-26,44,pitch,0,0,0,0);
  for(let L=0;L<4;L++){ const fr=L<2, sd=L%2?1:-1, lp=wp+(fr?0:Math.PI)+(sd>0?Math.PI:0);
    const hip=fr?rp(26,sd*25,46):rp(-26,sd*26,46);
    let fx=(fr?32:-22)+Math.sin(lp)*13*ws, fy=sd*(fr?35:38), fz=Math.max(0,Math.cos(lp))*9*ws+(droop?0:0);
    let foot;
    if(fr&&front>0){ const q=rp(48,sd*30,52); foot=bpt(lerp(fx,q[0],front),lerp(fy,q[1],front),lerp(fz,q[2],front)); }
    else foot=bpt(fx,fy,fz-bodyZ*0.0);
    if(airK>0){ const q=fr?rp(30,sd*30,14):rp(-38,sd*28,14); foot[0]=lerp(foot[0],q[0],airK); foot[1]=lerp(foot[1],q[1],airK); foot[2]=lerp(foot[2],q[2],airK); }
    if(bodyZ<0){ foot[2]-=bodyZ; }
    const kn=bIK(hip,foot,fr?26:28,fr?26:28,fr?-1:1,sd*0.4,fr?0.1:0.5,_vxN);
    t3Limb(hip[0],hip[1],hip[2],kn[0],kn[1],kn[2],fr?12:15,VX.body,fr?9:11); t3Limb(kn[0],kn[1],kn[2],foot[0],foot[1],foot[2]+4,fr?9:11,VX.dark,fr?7:8);
    t3Ell(foot[0]+3,foot[1],foot[2]+3.5,10,8,5,VX.dark);
    for(let c=-1;c<=1;c++) t3Cone(foot[0]+9,foot[1]+c*5,foot[2]+3,foot[0]+17,foot[1]+c*6.5,foot[2]+0.5,2.2,VX.claw,0.3);
    if(!fr) t3Cone(hip[0]-4,hip[1]+sd*6,hip[2]+16,hip[0]-10,hip[1]+sd*9,hip[2]+26,4,VX.spike,0.2);
  }
  // tail: ten heavy segments, spikes along the top, a spade at the end; it coils before a sweep and whips after
  { let px=-46, py=0, pz=44, a=Math.PI, pz2=pz;
    for(let i=0;i<10;i++){ a+=Math.sin(t*1.8-i*0.55)*0.07+tailCoil*-0.13+tailFx*0.3; const L=16, nx=px+Math.cos(a)*L, ny=py+Math.sin(a)*L; pz2=lerp(pz,Math.max(9,40-i*9)+tailCoil*10*Math.sin(i*0.4),0.75);
      const r=19-i*1.55; rLimb(px,py,pz,nx,ny,pz2,r,VX.body,r-1.5);
      if(i%2===0) rCone(nx,ny,pz2+r*0.7,nx-Math.cos(a)*-4,ny-Math.sin(a)*-4,pz2+r*0.7+12-i*0.8,Math.max(2.4,5.6-i*0.4),VX.spike,0.3);
      if(i===3||i===6){ const mx=(px+nx)/2, my=(py+ny)/2; rLine(mx-3,my-r*0.7,pz2+r*0.3,mx+3,my-r*0.5,pz2+r*0.6,2.2,VX.crack,0.6); }
      px=nx; py=ny; pz=pz2; }
    const ux=Math.cos(a), uy=Math.sin(a);
    bpoly(VX.body,{edge:VX.spike,bias:0.6},rp(px-ux*6,py-uy*6,pz+2),rp(px+ux*8-uy*17,py+uy*8+ux*17,pz+1.5),rp(px+ux*34,py+uy*34,pz+1),rp(px+ux*8+uy*17,py+uy*8-ux*17,pz+1.5)); }
  // the body: chest and haunches, a pale belly, back spikes, glowing cracks
  rigSet(-26,44,pitch,0,0,0,0);
  rEll(14,0,50,36,30,26,VX.body,0.05);
  rEll(-22,0,46,32,28,23,VX.body,-0.04);
  rEll(4,0,31,40,16,9,VX.belly,0,0,-1.5);
  for(let i=0;i<3;i++) rEll(42-i*3,0,48-i*10,6,15-i,5.5,VX.plate,-1.0,0,0.8);
  for(const [x,y,sz] of VX_SCALE){ const z=vxSurf(x,y), th=Math.asin(clamp(y/(x>-4?30:28),-0.95,0.95)); rEll(x,y,z-0.8,sz*1.25,sz*0.8,1.4,VX.scale,0.05,0,0.1,-th*0.9); }
  for(const [x,h] of VX_SPK){ const z=vxSurf(x,0); rCone(x,0,z-2,x-8,0,z+h+(ph>=3?2:0),5.6-(32-x)*0.025,VX.spike,0.4); }
  const cPulse=0.5+0.5*Math.sin(t*3), cCol=ph>=3?VX.crack3:ph>=2?VX.crack2:VX.crack, hot=dying?VX.crack3:cCol;
  for(const cr of VX_CRACKS){ for(let i=0;i+1<cr.length;i++){ const a=cr[i], b=cr[i+1], za=vxSurf(a[0],a[1])+0.4, zb2=vxSurf(b[0],b[1])+0.4; rLine(a[0],a[1],za,b[0],b[1],zb2,3.4,VX.crackD,0.5); rLine(a[0],a[1],za,b[0],b[1],zb2,1.6,hot,0.7); } }
  // wings
  for(const sd of [-1,1]) vxWing(sd,bpt(18,sd*26,74),fold,raise,lag,sweep,VX.mem,fl);
  // neck and head: the head sits over (headX,headY), partly bent back toward its natural place so the neck keeps its shape
  const nb=rp(42,0,64);
  const natX=48+Math.cos(hr)*58, natY=Math.sin(hr)*58, hd=bInv(e.headX!=null?e.headX:ox,e.headY!=null?e.headY:e.y,zh,_vxH);
  const Hx=lerp(natX,hd[0],0.6), Hy=lerp(natY,hd[1],0.6), Hz=zh+bodyZ*-0;
  const hyaw=hr;
  // neck: a curve from the shoulders up and over to the back of the skull
  { const cx=lerp(nb[0],Hx,0.45), cy=lerp(nb[1],Hy,0.5)*0.9, cz=Math.max(nb[2],Hz)+16-droop*24; let px=nb[0], py=nb[1], pz=nb[2];
    const ex=Hx-Math.cos(hyaw)*16, ey=Hy-Math.sin(hyaw)*16, ez=Hz+2;
    for(let s=1;s<=5;s++){ const u=s/5, u1=1-u, x=u1*u1*nb[0]+2*u1*u*cx+u*u*ex, y=u1*u1*nb[1]+2*u1*u*cy+u*u*ey, z=u1*u1*nb[2]+2*u1*u*cz+u*u*ez, r0=lerp(19,13,(s-1)/5), r1=lerp(19,13,u);
      t3Limb(px,py,pz,x,y,z,r0,VX.body,r1);
      t3Limb(px+3,py,pz-r0*0.45,x+3,y,z-r1*0.45,r0*0.62,mg>0.2?'#c85a20':VX.plate,r1*0.6,0.5);
      if(s<5) t3Cone(x,y,z+r1*0.8,x-6,y,z+r1+9,3.6,VX.spike,0.3);
      px=x; py=y; pz=z; } }
  // the head (a local frame turned by the head's own yaw and pitch)
  rigSet(0,0,headP,hyaw,Hx,Hy,Hz);
  const dn=open*0.55, fw=Math.sin(F+hyaw)*T3.st;
  rEll(0,0,4,22,17,14,VX.body,-0.05);
  rEll(25,0,0,22,12.5,8.5,VX.body,0.08);
  rEll(44,0,-1,7,9,6.5,VX.body,0.1);
  for(const sd of [-1,1]){
    // brows, molten eyes, nostrils
    rEll(11,sd*10.5,14,12,5,4,VX.dark,0.32,0,1,sd*0.42);
    rEll(14,sd*11.5,10,3.6,4.2,3.2,'#1a0606',0,0,0.6);
    rDot(15.6,sd*11.8,10,3.3,VX.eye,1.2); rDot(16.2,sd*11.6,10.4,1.5,'#fff2b0',1.4);
    rDot(48.5,sd*4.4,2.6,1.5,'#1a0303',0.6);
    // great horns sweeping back, cheek spikes, jaw spikes
    rLimb(-6,sd*11,14,-26,sd*23,27,6.4,VX.bone,4.6); rLimb(-26,sd*23,27,-44,sd*28,24,4.6,VX.bone,2.8); rCone(-44,sd*28,24,-58,sd*27,15,2.8,VX.boneD,0.2);
    rCone(-2,sd*15,6,-20,sd*30,4,3.2,VX.bone,0.2); rCone(4,sd*15,0,-12,sd*28,-6,2.4,VX.boneD,0.2);
    for(let i=0;i<3;i++) rCone(16+i*9,sd*11.5,-6,10+i*9,sd*17,-10,1.6,VX.boneD,0.2);
  }
  // jaws and teeth
  const jq=bRotXZ(20,-9,-2,-4,-dn); rEll(jq[0],0,jq[1],22,11,5,VX.dark,dn,0,-0.2);
  const inside=mg>0.1?'#d8501a':VX.mouth;
  if(open>0.05){ const iq=bRotXZ(18,-5,-2,-4,-dn*0.5); rEll(iq[0],0,iq[1],20,9,2+open*4,inside,dn*0.5,0,2+fw*14); }
  for(let i=0;i<5;i++){ const x=14+i*6.5, y=10.5-i*1.4; if(open<0.05&&i!==1&&i!==3) continue; for(const sd of [-1,1]){ rCone(x,sd*y,-6,x+0.6,sd*y,-11-(i===3?3:0),1.6+(i===3?0.8:0),VX.claw,(open>0.05?3:0.6)+fw*14);
    if(open>0.05&&i<4){ const q=bRotXZ(x,-8,-2,-4,-dn); rCone(q[0],sd*(y-0.8),q[1],q[0]+0.5,sd*(y-0.8),q[1]+4,1.4,VX.claw,3+fw*14); } } }
  { const eq=rp(16,0,10), ep=bScrD(eq[0],eq[1],eq[2]); VX_EYE[0]=ep[0]; VX_EYE[1]=ep[1];
    const hq=rp(0,0,4); VX_EYE[2]=ep[2]>bDepth(hq[0],hq[1],hq[2])?1:0;
    const mq=rp(50,0,-4), mp=bScr(mq[0],mq[1],mq[2]); VX_MOUTH[0]=mp[0]; VX_MOUTH[1]=mp[1];
    const tq=rp(-4,0,20), tp=bScr(tq[0],tq[1],tq[2]); e._t3top=tp[1]-14*k; }
  t3End();
  if(buf){ T3BS.g=null; g.save(); g.setTransform(1,0,0,1,0,0); g.globalAlpha=alpha; g.drawImage(buf,0,0); g.restore(); }
  // light: eyes, the mouth, the cracks; phase three makes the whole dragon smoulder
  if(!fl){ const pa=g.globalAlpha; g.globalAlpha=pa*alpha;
    if(VX_EYE[2]) bGlow(VX_EYE[0],VX_EYE[1],14+ph*2,'255,154,26',0.75);
    if(mg>0||open>0.6&&S!=='stagger') bGlow(VX_MOUTH[0],VX_MOUTH[1],(34*Math.max(mg,0.4)+6)*k,'255,170,60',0.85*Math.max(mg,0.35));
    if(S==='breathW'||S==='fbW'){ const q=0.5+0.5*Math.sin(t*14); bGlow(VX_MOUTH[0],VX_MOUTH[1],18*k,'255,240,180',0.6+0.3*q); }
    if(ph>=2||dying){ bGlow(ox,oy-(zb+alt)*T3.st*k,(ph>=3||dying?110:80)*k,'255,110,30',(dying?0.35+dT*0.15:ph>=3?0.22:0.12)*(0.8+0.2*cPulse)); }
    if(S==='stagger'){ for(let i=0;i<3;i++){ const a=t*5+i*TAU/3; g.fillStyle='#ffe066'; g.beginPath(); g.arc(VX_EYE[0]+Math.cos(a)*22,e._t3top-4+Math.sin(a)*5,3,0,TAU); g.fill(); } }
    g.globalAlpha=pa; }
}
let VX_BUF=null;
function vxBuf(){ const c=ctx.canvas; if(!VX_BUF) VX_BUF=document.createElement('canvas'); if(VX_BUF.width!==c.width||VX_BUF.height!==c.height){ VX_BUF.width=c.width; VX_BUF.height=c.height; } return VX_BUF; }
T3X.vorlaxis=t3Vorlaxis;

// ---------- test sheets: a boss at 8 facings in each listed state (debug)
function t3bFake(type,x,y,face,o){
  const d=EDEF[type]||{r:20};
  const e={type,x,y,r:d.r,face,t:1.7,state:'chase',st:0.2,cd:1,dx:0,dy:0,flash:0,alpha:1,stun:0,burnT:0,hp:100,maxHp:100,boss:true,mouth:0,tongue:0,sub:false};
  if(type==='vorlaxis') Object.assign(e,{phase:1,state:'walk',headRel:0,alt:0,scale:1,mouthGlow:0,tailFx:0,staggered:false});
  Object.assign(e,o||{});
  if(o&&o.mv){ e.dx=Math.cos(face)*60; e.dy=Math.sin(face)*60; e._wph=o.mv; }
  if(type==='vorlaxis'&&typeof updateHeadPos==='function') updateHeadPos(e);
  if(type==='serpent'){ e.trail=[]; for(let i=0;i<60;i++){ const a=face+Math.PI+Math.sin(i*0.09)*0.7*(o&&o.curl!=null?o.curl:1); e.trail.push({x:x+Math.cos(a)*i*7,y:y+Math.sin(a)*i*7}); } }
  return e;
}
function t3bSheet(type,rows,o){
  o=o||{}; const z=o.zoom||1, cw=o.cw||200, ch=o.ch||180, fa=o.faces||[0,1,2,3,4,5,6,7].map(i=>i*TAU/8), nf=fa.length;
  const c=document.createElement('canvas'); c.width=Math.round(nf*cw*z); c.height=Math.round(rows.length*ch*z); const g=c.getContext('2d');
  g.fillStyle=o.bg||'#55663f'; g.fillRect(0,0,c.width,c.height);
  T3BS.g=g; const keepT=G.time;
  try{
    rows.forEach((row,ri)=>{
      for(let i=0;i<nf;i++){
        g.setTransform(z,0,0,z,0,0); g.globalAlpha=1;
        const cx=(i+0.5)*cw, cy=ri*ch+ch*(o.cy||0.6);
        g.strokeStyle='rgba(0,0,0,.25)'; g.strokeRect(i*cw,ri*ch,cw,ch);
        const e=t3bFake(type,cx,cy,fa[i],row);
        if(row.water){ g.fillStyle='#3a6a7a'; g.fillRect(i*cw,ri*ch,cw,ch); }
        g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=1; g.beginPath(); g.arc(e.x,e.y,e.r,0,TAU); g.stroke();
        if(type==='vorlaxis'){ g.beginPath(); g.arc(e.headX,e.headY,27,0,TAU); g.stroke(); }
        if(row.label&&i===0){ g.fillStyle='#fff'; g.font='11px sans-serif'; g.fillText(row.label,i*cw+4,ri*ch+12); }
        g.save(); g.globalAlpha=row.alpha!=null?row.alpha:1;
        if(type==='vorlaxis') T3X.vorlaxis(e); else T3E[type](e,!!row.fl);
        g.restore();
        if(e._t3top!=null){ g.strokeStyle='rgba(255,80,80,.7)'; g.beginPath(); g.moveTo(e.x-10,e._t3top); g.lineTo(e.x+10,e._t3top); g.stroke(); }
      }
    });
  } finally { T3BS.g=null; G.time=keepT; }
  return c.toDataURL();
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{t3bSheet,t3bFake,T3BS,T3E,T3X,T3R});
}
