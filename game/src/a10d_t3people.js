
// ================= Toy 3D people: every villager, kid, twin, prisoner and Trial NPC, the two human companions
// (Brisket and Juniper), Ember's spirit and the Wardens, built as chunky little 3D toy figures.
// The look of each person comes from the same profile the 2D renderer resolves (pProfile / pResolve in a10b_chars.js),
// so every look field (build, hair, hats, outfits, patterns, held things) shows the same person in 3D.
// Figures are baked into small offscreen sprites per (person, facing bucket of 32, head turn, walk frame, zoom),
// kept in an LRU cache, so a busy town costs one blit per person. Glows, smoke and steam are drawn live on top.

// ---------- a local frame for parts (the head turns on the neck, a knocked down figure lies on its back)
const PQM={r:[1,0,0,0,1,0,0,0,1],t:[0,0,0],st:[],id:true};
function pqReset(){ const r=PQM.r; r[0]=r[4]=r[8]=1; r[1]=r[2]=r[3]=r[5]=r[6]=r[7]=0; PQM.t[0]=PQM.t[1]=PQM.t[2]=0; PQM.st.length=0; PQM.id=true; }
function pqPush(){ PQM.st.push([PQM.r.slice(),PQM.t.slice(),PQM.id]); }
function pqPop(){ const s=PQM.st.pop(); for(let i=0;i<9;i++) PQM.r[i]=s[0][i]; for(let i=0;i<3;i++) PQM.t[i]=s[1][i]; PQM.id=s[2]; }
function pqMove(x,y,z){ const r=PQM.r, t=PQM.t; t[0]+=r[0]*x+r[1]*y+r[2]*z; t[1]+=r[3]*x+r[4]*y+r[5]*z; t[2]+=r[6]*x+r[7]*y+r[8]*z; }
function pqMul(m){ const r=PQM.r, a=r.slice(); for(let i=0;i<3;i++) for(let j=0;j<3;j++) r[i*3+j]=a[i*3]*m[j]+a[i*3+1]*m[3+j]+a[i*3+2]*m[6+j]; PQM.id=false; }
function pqYaw(a){ if(!a) return; const c=Math.cos(a), s=Math.sin(a); pqMul([c,-s,0,s,c,0,0,0,1]); }
function pqPitch(a){ if(!a) return; const c=Math.cos(a), s=Math.sin(a); pqMul([c,0,s,0,1,0,-s,0,c]); }
function pqRoll(a){ if(!a) return; const c=Math.cos(a), s=Math.sin(a); pqMul([1,0,0,0,c,-s,0,s,c]); }
const _pqa=[0,0,0], _pqb=[0,0,0], _pqo={pitch:0,yaw:0,roll:0,bias:0}, _pqm=[0,0,0,0,0,0,0,0,0];
function pqP(x,y,z,o){ const r=PQM.r, t=PQM.t; o[0]=r[0]*x+r[1]*y+r[2]*z+t[0]; o[1]=r[3]*x+r[4]*y+r[5]*z+t[1]; o[2]=r[6]*x+r[7]*y+r[8]*z+t[2]; return o; }
// a part's own orientation, combined with the frame, as the engine's pitch / yaw / roll
function pqOri(pitch,yaw,roll,bias){
  const o=_pqo; o.bias=bias||0;
  if(PQM.id){ o.pitch=pitch||0; o.yaw=yaw||0; o.roll=roll||0; return o; }
  const cy=Math.cos(yaw||0), sy=Math.sin(yaw||0), cp=Math.cos(pitch||0), sp=Math.sin(pitch||0), cr=Math.cos(roll||0), sr=Math.sin(roll||0);
  const q=[cy*cp, cy*sp*sr-sy*cr, cy*sp*cr+sy*sr, sy*cp, sy*sp*sr+cy*cr, sy*sp*cr-cy*sr, -sp, cp*sr, cp*cr], r=PQM.r, m=_pqm;
  for(let i=0;i<3;i++) for(let j=0;j<3;j++) m[i*3+j]=r[i*3]*q[j]+r[i*3+1]*q[3+j]+r[i*3+2]*q[6+j];
  o.pitch=Math.asin(clamp(-m[6],-1,1)); o.yaw=Math.atan2(m[3],m[0]); o.roll=Math.atan2(m[7],m[8]); return o;
}
// how much a direction in the current frame faces the camera (above 0: visible side)
function pqVis(nx,ny,nz){
  const r=PQM.r, l=Math.hypot(nx,ny,nz)||1; nx/=l; ny/=l; nz/=l;
  const bx=r[0]*nx+r[1]*ny+r[2]*nz, by=r[3]*nx+r[4]*ny+r[5]*nz, bz=r[6]*nx+r[7]*ny+r[8]*nz, R=T3R;
  return (bx*R.s+by*R.c)*T3.st+bz*T3.ct;
}
// the primitives, placed in the current frame
function pqE(x,y,z,rx,ry,rz,col,pitch,yaw,roll,bias){ pqP(x,y,z,_pqa); t3Ell(_pqa[0],_pqa[1],_pqa[2],rx,ry,rz,col,pqOri(pitch,yaw,roll,bias)); }
function pqB(x,y,z,r,col,bias){ pqP(x,y,z,_pqa); _pqo.pitch=_pqo.yaw=_pqo.roll=0; _pqo.bias=bias||0; t3Ell(_pqa[0],_pqa[1],_pqa[2],r,r,r,col,_pqo); }
function pqL(ax,ay,az,bx,by,bz,r,col,r2,bias){ pqP(ax,ay,az,_pqa); pqP(bx,by,bz,_pqb); t3Limb(_pqa[0],_pqa[1],_pqa[2],_pqb[0],_pqb[1],_pqb[2],r,col,r2,bias); }
function pqC(ax,ay,az,bx,by,bz,r,col,bias){ pqP(ax,ay,az,_pqa); pqP(bx,by,bz,_pqb); t3Cone(_pqa[0],_pqa[1],_pqa[2],_pqb[0],_pqb[1],_pqb[2],r,col,bias); }
function pqN(ax,ay,az,bx,by,bz,w,col,bias){ pqP(ax,ay,az,_pqa); pqP(bx,by,bz,_pqb); t3Line(_pqa[0],_pqa[1],_pqa[2],_pqb[0],_pqb[1],_pqb[2],w,col,bias); }
function pqD(x,y,z,r,col,bias){ pqP(x,y,z,_pqa); t3Dot(_pqa[0],_pqa[1],_pqa[2],r,col,bias==null?0.01:bias); }
// an upright frustum (skirts, hats, cups); a lying figure gets a tapered capsule instead
function pqY(x,y,z,r1,r2,h,col,top,bias,open){
  if(PQM.id||PQM.r[8]>0.97){ pqP(x,y,z,_pqa); t3Cyl(_pqa[0],_pqa[1],_pqa[2],r1,r2,h,col,{top:top||null,bias:bias||0,open:!!open}); }
  else { pqP(x,y,z,_pqa); pqP(x,y,z+h,_pqb); t3Limb(_pqa[0],_pqa[1],_pqa[2],_pqb[0],_pqb[1],_pqb[2],r1*0.9,col,r2*0.9,bias); }
}
function pqPoly(pts,col,bias,edge){ const out=[]; for(const q of pts){ pqP(q[0],q[1],q[2],_pqa); out.push([_pqa[0],_pqa[1],_pqa[2]]); } t3Poly(out,col,{bias:bias||0,edge:edge||null}); }
// a stroke on the visible side of an ellipsoid surface; dirs holds unit directions [x,y,z,...]
function pqBand(cx,cy,cz,a,b,c,dirs,w,col,bias,lift){
  lift=lift||1.04; let px=0,py=0,pz=0,pv=-1;
  for(let i=0;i<dirs.length;i+=3){ const ux=dirs[i], uy=dirs[i+1], uz=dirs[i+2], x=cx+ux*a*lift, y=cy+uy*b*lift, z=cz+uz*c*lift, v=pqVis(ux/a,uy/b,uz/c);
    if(i>0&&v>0.04&&pv>0.04) pqN(px,py,pz,x,y,z,w,col,bias==null?0.2:bias);
    px=x; py=y; pz=z; pv=v; }
}
// a dot on the visible side of an ellipsoid surface
function pqSDot(cx,cy,cz,a,b,c,ux,uy,uz,r,col,bias){ if(pqVis(ux/a,uy/b,uz/c)<0.08) return; pqD(cx+ux*a*1.02,cy+uy*b*1.02,cz+uz*c*1.02,r,col,bias==null?0.25:bias); }
const PQDIR=new Map();
// unit directions of a ring at elevation el (radians) from azimuth a0 to a1
function pqRing(el,a0,a1,n){ const key='r'+el+'|'+a0+'|'+a1+'|'+n; let d=PQDIR.get(key); if(d) return d; d=[]; for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n; d.push(Math.cos(a)*Math.cos(el),Math.sin(a)*Math.cos(el),Math.sin(el)); } PQDIR.set(key,d); return d; }
// a meridian at azimuth az from elevation e0 to e1
function pqMer(az,e0,e1,n){ const key='m'+az+'|'+e0+'|'+e1+'|'+n; let d=PQDIR.get(key); if(d) return d; d=[]; for(let i=0;i<=n;i++){ const e=e0+(e1-e0)*i/n; d.push(Math.cos(az)*Math.cos(e),Math.sin(az)*Math.cos(e),Math.sin(e)); } PQDIR.set(key,d); return d; }
// a strap loop over the shoulder at a sideways offset yo (front, over the top, down the back)
function pqStrap(yo,u0,u1,n){ const key='s'+yo+'|'+u0+'|'+u1+'|'+n; let d=PQDIR.get(key); if(d) return d; d=[]; const k=Math.sqrt(1-yo*yo); for(let i=0;i<=n;i++){ const u=u0+(u1-u0)*i/n; d.push(Math.cos(u)*k,yo,Math.sin(u)*k); } PQDIR.set(key,d); return d; }
// a tilted great circle (sashes, straps): the circle through the front (x) tipped by tilt toward +y and +z
function pqTilt(tilt,u0,u1,n){ const key='t'+tilt+'|'+u0+'|'+u1+'|'+n; let d=PQDIR.get(key); if(d) return d; d=[]; const c=Math.cos(tilt), s=Math.sin(tilt); for(let i=0;i<=n;i++){ const u=u0+(u1-u0)*i/n; d.push(Math.cos(u),Math.sin(u)*c,Math.sin(u)*s); } PQDIR.set(key,d); return d; }
// a band around an upright cylinder (visible arc only)
function pqCylBand(cx,cy,z,r,w,col,bias){ let px=0,py=0,pv=-1; for(let i=0;i<=16;i++){ const a=-Math.PI+i/16*TAU, x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r, v=pqVis(Math.cos(a),Math.sin(a),0); if(i&&v>0.02&&pv>0.02) pqN(px,py,z,x,y,z,w,col,bias==null?0.3:bias); px=x; py=y; pv=v; } }
const RGBA3=new Map();
function pqA(hex,a){ const k=hex+'|'+a; let v=RGBA3.get(k); if(v) return v; const c=hexRGB(hx6(hex,'#808080')); v=`rgba(${c[0]},${c[1]},${c[2]},${a})`; RGBA3.set(k,v); return v; }
// the record of live effects for a sprite: kind, screen dx, dy, how visible (0..1)
const T3S={P:null,Q:null,S:null,fx:null,top:0};
function pqFx(kind,x,y,z,vis){ pqP(x,y,z,_pqa); t3P(_pqa[0],_pqa[1],_pqa[2],_pqb); T3S.fx.push(kind,_pqb[0],_pqb[1],vis==null?1:vis); }
function pqTop(x,y,z){ pqP(x,y,z,_pqa); t3P(_pqa[0],_pqa[1],_pqa[2],_pqb); if(_pqb[1]<T3S.top) T3S.top=_pqb[1]; }

// ---------- the 3D proportions and colours of a person (cached on the profile)
function pq3(P){
  if(P._q3) return P._q3;
  const o=P.o, b=o.build||'', O=P.outfit, kid=!!P.kid, Q={};
  Q.k=P.k/PSCALE; Q.kid=kid; Q.old=!!P.old;
  Q.hs=kid?1.17:b==='teen'?1.07:1;
  const big=b==='wide'||b==='big';
  Q.W=(o.wide||1)*(big?1.14:b==='strong'?1.1:b==='slim'?0.88:b==='old'?0.96:1); Q.D=big?1.12:b==='strong'?1.04:b==='slim'?0.92:1;
  Q.big=big; Q.strong=b==='strong'; Q.belly=!!P.belly;
  Q.trx=5.3*Q.D; Q.try=6.2*Q.W; Q.trz=7.0; Q.zt=15.2; Q.zs=19.6; Q.ys=Q.try-0.7;
  Q.hr=8.2*Q.hs; Q.hz=22.0+Q.hr*0.8-(Q.old?1.1:0); Q.hx=Q.old?1.7:0.4;
  Q.aw=(O==='robe'||O==='coat'||O==='fur')?2.35:2.1; if(Q.strong||big) Q.aw+=0.25;
  Q.sleeve=O==='armor'?'#7c828c':(O==='fur'||O==='coat')?P.low:P.shirt;
  Q.skin=P.skin; Q.hair=P.hair; Q.beard=hx6(o.beardc,P.hair);
  Q.brow=P.hair==='#e8e4dc'||P.hair==='#efeae0'?'#f4f0e8':shd(P.hair,-0.2);
  Q.hand=P.hand; Q.legs=P.legs; Q.shoe=P.shoe;
  Q.pat=o.pattern||null; Q.patc=hx6(o.patc,'#efe6d6');
  Q.dress=O==='dress'||O==='robe'||O==='fur'; Q.hem=(O==='dress'?7.3:7.6)*Q.W;
  // how far above the crown of the head the hair or hat reaches (in head radii)
  const hd=P.hairdo, hat=P.hat;
  let top=hd==='spiky'?1.38:hd==='bun'?1.36:hd==='wild'?1.3:hd==='curly'?1.2:hd==='bald'?1.0:1.1;
  if(P.hood) top=1.24;
  else if(hat) top={chef:1.95,straw:1.38,top:2.05,cap:1.14,beanie:1.42,feather:1.62,helm:P.plume?1.56:1.12,miner:1.16,rain:1.12,fancy:1.5,fur:1.14,kerchief:1.12,wizard:2.4,party:2.05,crown:1.12}[hat]||1.12;
  Q.top=top;
  // seeded specks for flour, soot, oil, moss and frost
  const rr=mulberry32(phash(P.id+'speck')); Q.specks=[]; for(let i=0;i<22;i++){ const a=(rr()-0.5)*2.6, e=(rr()-0.5)*1.5; Q.specks.push(Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e),rr()); }
  P._q3=Q; return Q;
}

// ---------- the person, in body space (x forward, y right, z up; feet at the origin; a grown-up is about 40 tall)
function pqPerson(P){
  const Q=T3S.Q, S=T3S.S, o=P.o, O=P.outfit, sw=S.sw||0, bob=S.bob||0, walk=!!S.walk;
  const W=Q.W, trx=Q.trx, tryy=Q.try, zt=Q.zt+bob, zs=Q.zs+bob, ys=Q.ys, X=S.extra||null;
  const front=pqVis(1,0,0);
  // ---- legs and shoes
  const stride=Q.old?2.8:Q.kid?3.6:4.2;
  for(const sd of [-1,1]){
    const s=sw*sd, lift=walk?Math.max(0,Math.cos(S.ph||0)*sd)*1.2:0, fx=s*stride;
    if(!Q.dress) pqL(0.2,sd*2.7*W,8.8+bob, fx,sd*2.9*W,2.9+lift, 2.35,Q.legs,2.15);
    if(Q.dress) pqE(fx*0.6+Q.hem-1.7,sd*2.6*W,1.4+lift, 2.5,1.8,1.4, Q.shoe);
    else pqE(fx+1.1,sd*2.9*W,1.6+lift, 3.0,2.05,1.65, Q.shoe);
    if(!Q.dress) pqD(fx+2.3,sd*2.9*W,2.7+lift,0.55,'rgba(255,255,255,.22)',0.3);
  }
  // ---- things trailing behind
  if(o.sled){ const sx=-17-(walk?1:0); pqN(5,ys+1.6,11.5+bob, sx+6,0,2.6, 0.45,'#d8c8a0',-0.5); pqE(sx,0,2.0, 6.2,4.2,1.2,'#b07a40'); for(const yy of [-3.6,3.6]) pqL(sx-6,yy,0.5,sx+5.2,yy,0.6,0.5,'#5a5e66',0.5); pqL(sx+5.4,-3.6,0.8,sx+6.4,-3.6,2.4,0.5,'#5a5e66'); pqL(sx+5.4,3.6,0.8,sx+6.4,3.6,2.4,0.5,'#5a5e66'); for(const xx of [-3,0,3]) pqN(sx+xx,-3.6,3.2,sx+xx,3.6,3.2,0.35,'rgba(70,40,15,.55)',0.3); }
  if(P.cape){ const cp=P.cape, fl=walk?1.6:0.3*Math.sin((S.t||0)*2), tl=[-2.2,-ys+0.6,zs+1.6], tm=[-trx-0.4,0,zs+1.0], tr=[-2.2,ys-0.6,zs+1.6], bl=[-trx-1.2,-tryy-1.5,3.6], bm=[-trx-2.6-fl,0,3.0+fl*0.6], br=[-trx-1.2,tryy+1.5,3.6];
    pqPoly([tl,tm,bm,bl],cp,-0.2); pqPoly([tm,tr,br,bm],shd(cp,-0.06),-0.2); pqE(-1.6,0,zs+2.0, 3.2,tryy*0.78,1.8, cp); }
  // ---- skirts, coats and the lower body
  const low=P.low, top=P.top;
  if(O==='dress'){ pqY(0,0,1.8, 7.3*W,4.9*W,9.9+bob, low, shd(low,0.1)); }
  else if(O==='robe'){ pqY(0,0,0.5, 7.6*W,5.3*W,11.6+bob, low, shd(low,0.1)); }
  else if(O==='fur'){ pqY(0,0,2.6, 7.6*W,5.8*W,9.0+bob, low, shd(low,0.1)); }
  else if(O==='coat'){ pqY(-0.3,0,4.4, 7.1*W,5.8*W,7.4+bob, low, shd(low,0.1)); }
  if(!Q.dress){ pqE(0.2,0,9.3+bob, trx*0.86,tryy*0.86,2.9, O==='overalls'?low:Q.legs); }
  if(O==='tunic') pqE(0.1,0,10.3+bob, trx+0.5,tryy+0.4,2.8, shd(top,-0.16));
  else if(O==='armor'){ pqE(0,0,10.2+bob, trx+0.7,tryy+0.6,3.0,'#6a707a'); for(let a=-1.2;a<=1.21;a+=0.4) pqSDot(0,0,10.2+bob,trx+0.7,tryy+0.6,3.0,Math.cos(a),Math.sin(a),-0.2,0.35,'rgba(30,34,40,.5)'); }
  // ---- torso
  pqE(0,0,zt, trx,tryy,Q.trz, top, Q.old?0.14:0);
  if(Q.belly) pqE(trx*0.42,0,zt-2.2, trx*0.78,tryy*0.8,5.0, top);
  // patterns on whatever shows the shirt
  const pc=Q.pat, pcol=Q.patc;
  if(pc&&O!=='armor'&&O!=='coat'&&O!=='vest'){
    if(pc==='stripes'){ for(let a=-2.8;a<=2.81;a+=0.47) pqBand(0,0,zt,trx,tryy,Q.trz,pqMer(a,-0.78,0.78,4),0.95,pqA(pcol,0.6),0.15); }
    else if(pc==='plaid'){ for(let a=-2.8;a<=2.81;a+=0.62) pqBand(0,0,zt,trx,tryy,Q.trz,pqMer(a,-0.8,0.8,4),0.85,pqA(pcol,0.42),0.15); for(const e of [-0.5,0,0.5]) pqBand(0,0,zt,trx,tryy,Q.trz,pqRing(e,-3.14,3.14,16),0.85,pqA(pcol,0.42),0.15); }
    else if(pc==='dots'){ let j=0; for(let e=-0.62;e<=0.8;e+=0.42,j++) for(let a=-2.9+(j%2)*0.3;a<=2.9;a+=0.6) pqSDot(0,0,zt,trx,tryy,Q.trz,Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e),0.6,pcol); }
    else if(pc==='stars'){ for(let i=0;i<Q.specks.length;i+=4) pqSDot(0,0,zt,trx,tryy,Q.trz,Q.specks[i],Q.specks[i+1],Q.specks[i+2],0.75,pcol); }
  }
  if(pc&&(O==='dress'||(O==='robe'&&pc==='stars'))){
    const r1=O==='robe'?7.6*W:7.3*W, r2=O==='robe'?5.3*W:4.9*W, z0=O==='robe'?0.5:1.8, hh=O==='robe'?11.6:9.9, sl=(r1-r2)/hh;
    for(let j=0,h=1.6;h<hh-1;h+=2.3,j++) for(let a=-3.1+(j%2)*0.3;a<3.1;a+=0.55){ const r=r1-sl*h, nx=Math.cos(a), ny=Math.sin(a); if(pqVis(nx,ny,sl)<0.1) continue; pqD(nx*(r+0.15),ny*(r+0.15),z0+h,pc==='stars'?0.8:0.62,pcol,0.2); }
  }
  // ---- outfit details
  if(O==='vest'){ pqE(trx*0.74,0,zt+0.8, 1.5,2.2*W,5.6, P.shirt);
    if(pc&&pqVis(1,0,0)>0){ const fx2=trx*0.74+1.3; if(pc==='dots'||pc==='stars') for(let e=-0.6;e<=0.7;e+=0.65) for(const yy of [-1,0,1]) pqD(fx2,yy*1.3,zt+0.8+e*5,0.5,pqA(pcol,0.8),0.3); else { for(const yy of [-1.1,0,1.1]) pqN(fx2-0.4,yy,zt-3.6,fx2-0.4,yy,zt+5.0,0.6,pqA(pcol,pc==='plaid'?0.45:0.65),0.3); if(pc==='plaid') for(const zz of [-2,1,4]) pqN(fx2-0.2,-1.8,zt+zz,fx2-0.2,1.8,zt+zz,0.6,pqA(pcol,0.45),0.3); } }
    for(const sd of [-1,1]) pqBand(0,0,zt,trx,tryy,Q.trz,pqMer(sd*0.36,-0.85,0.85,4),0.7,shd(low,-0.3),0.18);
    if(o.fleece) for(const sd of [-1,1]) for(let e=-0.7;e<=0.85;e+=0.31) pqSDot(0,0,zt,trx,tryy,Q.trz,Math.cos(sd*0.38)*Math.cos(e),Math.sin(sd*0.38)*Math.cos(e),Math.sin(e),1.05,'#efe6d2'); }
  else if(O==='coat'){ pqE(trx*0.8,0,zt+3.2, 1.2,1.8,3.2, P.shirt);
    for(const sd of [-1,1]) pqBand(0,0,zt,trx,tryy,Q.trz,pqMer(sd*0.24,-0.95,0.62,4),0.85,P.trim,0.18);
    for(const e of [-0.45,-0.05,0.35]) pqSDot(0,0,zt,trx,tryy,Q.trz,Math.cos(e),0,Math.sin(e),0.55,'#d8b04a');
    if(pqVis(1,0,0.15)>0) pqN(7.1*W,0,4.6, 5.8*W,0,11.6+bob, 0.7,shd(low,-0.32),0.4); }
  else if(O==='overalls'){ pqE(trx*0.66,0,zt-1.4, 1.9,3.2*W,4.4, low);
    for(const sd of [-1,1]){ pqBand(0,0,zt,trx,tryy,Q.trz,pqStrap(sd*0.42,-0.25,Math.PI+0.3,10),1.2,shd(low,-0.08),0.2); pqD(trx*0.66+1.6,sd*2.4,zt+2.4,0.55,'#d8b04a',0.4); } }
  else if(O==='armor'){ pqE(trx*0.72,0,zt-0.4, 1.5,2.6*W,6.0, P.shirt);
    for(const sd of [-1,1]) pqBand(0,0,zt,trx,tryy,Q.trz,pqMer(sd*0.46,-0.9,0.78,4),0.6,shd(P.trim,0.1),0.3);
    pqD(trx+0.6,0,zt+1.4,0.9,P.trim,0.4);
    for(const sd of [-1,1]){ pqE(-0.2,sd*(tryy-0.2),zs+0.5, 3.3,3.0,2.5,'#b4bcc8'); pqD(0.6,sd*(tryy+0.8),zs+1.6,0.45,'#e8ecf0',0.3); } }
  else if(O==='dress'){ pqBand(0,0,zt,trx,tryy,Q.trz,pqRing(0.62,-1.2,1.2,6),0.8,P.trim,0.2); pqBand(0,0,zt,trx,tryy,Q.trz,pqRing(-0.62,-3.14,3.14,16),1.0,shd(P.trim,-0.1),0.2); }
  else if(O==='robe'){ if(pqVis(1,0,0.2)>0) pqN(7.7*W,0,0.8, 5.4*W,0,12+bob, 1.0,P.trim,0.4); pqBand(0,0,zt,trx,tryy,Q.trz,pqMer(0,-0.9,0.7,4),1.0,P.trim,0.2);
    for(let a=-3.0;a<3.0;a+=0.4){ const nx=Math.cos(a), ny=Math.sin(a), a2=a+0.4; if(pqVis(nx,ny,0.2)<0.05||pqVis(Math.cos(a2),Math.sin(a2),0.2)<0.05) continue; pqN(nx*7.75*W,ny*7.75*W,1.1, Math.cos(a2)*7.75*W,Math.sin(a2)*7.75*W,1.1, 1.0,shd(P.trim,-0.1),0.3); } }
  else if(O==='fur'){ const fc=shd(low,0.28); for(let a=-3.0;a<3.0;a+=0.5){ const nx=Math.cos(a), ny=Math.sin(a); if(pqVis(nx,ny,0)<-0.1) continue; pqB(nx*7.4*W,ny*7.4*W,3.0,1.5,fc,0.2); } for(let a=-3.0;a<3.0;a+=0.62){ const nx=Math.cos(a), ny=Math.sin(a); if(pqVis(nx,ny,0.5)<-0.2) continue; pqB(nx*4.2*W,ny*4.8*W,zt+6.2,1.6,fc,0.2); } }
  else if(O==='tunic'){ pqBand(0,0,zt,trx,tryy,Q.trz,pqRing(0.8,-1.4,1.4,6),0.8,P.trim,0.2); }
  // belt, sash, bag strap
  if(o.belt&&!Q.dress){ const bc=hx6(o.belt,'#3a2414'); pqBand(0,0,zt,trx,tryy,Q.trz,pqRing(-0.6,-3.14,3.14,18),1.5,bc,0.22); pqSDot(0,0,zt,trx,tryy,Q.trz,Math.cos(-0.6),0,Math.sin(-0.6),0.85,'#d8b04a',0.4); }
  if(o.sash){ const sc=hx6(o.sash,'#e0c080'); pqBand(0,0,zt,trx,tryy,Q.trz,pqTilt(-0.75,-Math.PI,Math.PI,22),2.2,sc,0.22); pqSDot(0,0,zt,trx,tryy,Q.trz,0.85,0.38,-0.36,1.1,'#f6d860',0.5); pqSDot(0,0,zt,trx,tryy,Q.trz,0.85,0.38,-0.36,0.55,'#c84a3a',0.6); }
  if(o.bag){ const bc=hx6(o.bag,'#7a5a32'); pqBand(0,0,zt,trx,tryy,Q.trz,pqTilt(-0.8,-Math.PI,Math.PI,22),0.9,shd(bc,-0.25),0.22); pqE(-1.4,tryy+1.0,9.6+bob, 2.8,1.6,2.5, bc); pqE(-1.2,tryy+1.3,10.8+bob, 2.6,1.2,1.2, shd(bc,-0.15)); pqD(-1.0,tryy+2.6,10.2+bob,0.45,'#d8b04a',0.2); }
  // apron
  if(o.apron){ const ac=o.apron===true?'#ece4d4':hx6(o.apron,'#ece4d4'), bx=Q.belly?1.9:0, D=Q.D;
    if(Q.dress){ const zt2=11.2+bob, r2=(O==='robe'?5.3:4.9)*W+0.25, r1=Q.hem+0.25, z1=O==='robe'?1.2:2.4; pqPoly([[r2,-3.0,zt2],[r2,3.0,zt2],[r1,4.1,z1],[r1,-4.1,z1]],ac,0.4); pqPoly([[4.5*D,-2.4,zt+3.6],[4.5*D,2.4,zt+3.6],[4.9*D,3.0,zt-3.8],[4.9*D,-3.0,zt-3.8]],ac,0.45); }
    else { pqPoly([[4.4*D+bx*0.7,-2.5,zt+3.4],[4.4*D+bx*0.7,2.5,zt+3.4],[5.0*D+bx,3.1,zt-3.8],[5.0*D+bx,-3.1,zt-3.8]],ac,0.45); pqPoly([[5.0*D+bx,-3.6,zt-3.6],[5.0*D+bx,3.6,zt-3.6],[5.8*D+bx*0.6,4.3,4.2],[5.8*D+bx*0.6,-4.3,4.2]],shd(ac,-0.05),0.45); }
    for(const sd of [-1,1]) pqBand(0,0,zt,trx,tryy,Q.trz,pqMer(sd*0.62,0.42,1.25,3),0.6,shd(ac,-0.12),0.22);
    if(pqVis(-1,0,0)>0) for(const sd of [-1,1]) pqB(-trx-0.2,sd*1.0,zt-3.6,0.9,ac,0.3);
    if(o.flour&&pqVis(1,0,0)>0) for(let i=0;i<Q.specks.length;i+=4) if(Q.specks[i+3]<0.6) pqD(5.2*D+bx+0.3,Q.specks[i+1]*3.0,zt-3.4+Q.specks[i+2]*6.4,0.42,'rgba(255,255,255,.8)',0.6); }
  // shawl, blanket
  if(P.shawl){ const sh=P.shawl; pqE(-1.0,0,zs+0.8, trx+1.0,tryy+1.4,3.4, sh); for(const sd of [-1,1]) pqL(1.6,sd*(tryy-0.6),zs+0.6, trx*0.8,sd*2.6,zt-3.0, 1.9,sh,0.9);
    if(o.blanket){ for(const a of [-1.6,-0.9,-0.2,0.5,1.2]) pqBand(-1.0,0,zs+0.8,trx+1.0,tryy+1.4,3.4,pqMer(a+3.14,-0.6,0.9,3),0.6,'rgba(239,230,214,.55)',0.15); pqBand(-1.0,0,zs+0.8,trx+1.0,tryy+1.4,3.4,pqRing(0.2,-3.14,3.14,16),0.6,'rgba(239,230,214,.55)',0.15); }
    else for(let a=-1.2;a<=1.2;a+=0.3) pqSDot(-1.0,0,zs+0.8,trx+1.0,tryy+1.4,3.4,Math.cos(a+Math.PI)*0.8,Math.sin(a+Math.PI)*0.8,-0.6,0.5,shd(sh,0.25)); }
  if(P.hood&&!P.cape) pqE(-trx+0.4,0,zs+1.8, 2.6,tryy*0.75,2.2, P.hood);
  // round the neck
  const nk=P.scarf||hx6(o.neck,null);
  if(nk){ pqE(0.3,0,21.6+bob, 4.4,5.0*W,2.1, nk); pqBand(0.3,0,21.6+bob,4.4,5.0*W,2.1,pqRing(0,-1.4,1.4,6),0.4,shd(nk,-0.2),0.25);
    if(P.scarf){ const len=(o.scarfLen||1)*(4.2+(walk?5:0)), fl=walk?Math.sin((S.ph||0)*2)*1.6:Math.sin((S.t||0)*2)*0.5;
      pqL(trx*0.62,1.6,21, trx*0.95,2.5,14.8, 1.25,P.scarf,1.05,0.3);
      pqL(-2.6,-1.2,21.4, -2.6-len,-2.2+fl,19.2-len*0.25, 1.2,P.scarf,1.0); pqL(-2.6,-0.2,21.6, -2.4-len*0.85,-0.6-fl,19.8-len*0.2, 1.1,shd(P.scarf,-0.08),0.95); }
    else pqB(trx*0.55,2.2,21.0+bob,1.2,shd(nk,-0.1),0.3); }
  if(o.tape) for(const sd of [-1,1]){ pqN(trx*0.5,sd*2.4,22.0+bob, trx*0.95,sd*2.9,13.0+bob, 0.95,'#f2d860',0.35); for(let i=0;i<3;i++) pqD(trx*0.6+i*0.15,sd*2.5,20.4-i*2.6+bob,0.25,'#5a4a20',0.45); }
  if(o.necklace){ const nc=hx6(o.necklace,'#e8c060'); for(let u=-1;u<=1.01;u+=0.25){ const a=u*0.8, e=0.82-0.3*(1-u*u); pqSDot(0,0,zt,trx,tryy,Q.trz,Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e),0.42,nc,0.3); } pqSDot(0,0,zt,trx,tryy,Q.trz,Math.cos(0.52),0,Math.sin(0.52),o.sash?1.1:0.8,o.sash?'#f6d860':shd(nc,0.2),0.4); }
  // specks
  if(o.soot||o.oil||o.mossy||o.frost||o.flour){ const col=o.soot?'rgba(30,22,20,.42)':o.oil?'rgba(40,30,16,.5)':o.mossy?'rgba(120,170,70,.7)':o.frost?'rgba(230,245,255,.9)':'rgba(255,255,255,.75)';
    for(let i=0;i<Q.specks.length;i+=4) pqSDot(0,0,zt,trx,tryy,Q.trz,Q.specks[i],Q.specks[i+1],Q.specks[i+2],0.4+Q.specks[i+3]*0.35,col,0.3); }
  // ---- on the back
  const bk=o.back;
  if(bk==='lute'){ pqE(-trx-1.4,2.4,11.6+bob, 1.3,3.4,4.3,'#b8783a',0,0,0.5,0); pqL(-trx-1.3,0.2,15.0+bob, -trx-1.2,-3.6,23.5+bob, 0.75,'#5a3416'); pqE(-trx-1.2,-4.0,24.4+bob, 0.7,0.9,1.3,'#3a200c'); if(pqVis(-1,0,0)>0) pqD(-trx-2.75,2.0,12.2+bob,0.9,'#2a160a',0.3); }
  else if(bk==='bow'){ const pts=[[-trx-1.0,-4.2,24.5],[-trx-2.6,-1.6,19],[-trx-3.0,1.2,12.5],[-trx-1.6,3.8,6.5]]; for(let i=0;i<3;i++) pqL(pts[i][0],pts[i][1],pts[i][2]+bob,pts[i+1][0],pts[i+1][1],pts[i+1][2]+bob,0.75,'#5a3a1e'); pqN(-trx-1.0,-4.2,24.5+bob,-trx-1.6,3.8,6.5+bob,0.3,'rgba(232,224,208,.9)',0.1);
    pqL(-trx-0.8,2.4,12.0+bob, -trx-1.4,0.2,21.5+bob, 1.7,'#7a4a24',1.5); for(const yy of [-0.6,0.4,1.3]) pqC(-trx-1.4,yy,21.6+bob, -trx-1.6,yy-0.2,24.8+bob, 0.8,'#c83a2a',0.1); }
  else if(bk==='mapcase'){ pqL(-trx-0.9,-3.8,7.2+bob, -trx-0.6,4.0,21.8+bob, 1.5,'#9a6a32'); pqB(-trx-0.9,-3.8,7.2+bob,1.6,'#c8a04a'); pqB(-trx-0.6,4.0,21.8+bob,1.6,'#c8a04a'); }
  else if(bk==='pack'){ pqE(-trx-3.0,0,14.6+bob, 3.2,5.0,6.4,'#8a6a42'); pqE(-trx-5.6,0,14.0+bob, 1.4,4.0,4.2,shd('#8a6a42',-0.12)); pqL(-trx-3.0,-5.6,21.6+bob, -trx-3.0,5.6,21.6+bob, 2.0,'#a04a3a'); for(const sd of [-1,1]){ pqB(-trx-2.4,sd*5.6,10.0+bob,1.6,'#c8743a'); pqBand(0,0,zt,trx,tryy,Q.trz,pqMer(sd*0.75,0.1,1.2,3),0.9,'#4a3018',0.2); } pqD(-trx-6.2,2.4,17.4+bob,0.9,'#ffd27a',0.2); }
  if(o.crow){ const cx=-0.4, cy=-ys+0.8, cz=zs+3.6; pqE(cx,cy,cz, 2.6,1.6,1.8,'#2a2a3a'); pqL(cx-2,cy,cz-0.2, cx-4.6,cy,cz-1.4, 1.1,'#1a1a24',0.5); pqB(cx+2.2,cy,cz+1.4,1.45,'#2a2a3a'); pqC(cx+3.4,cy,cz+1.3, cx+5.6,cy,cz+0.9, 0.55,'#d8c070'); for(const sd of [-1,1]) pqD(cx+2.9,cy+sd*0.9,cz+1.9,0.36,'#ffffff',0.05); }
  // ---- arms and held things
  pqHeld(P,Q,S,zt,zs,sw);
  // ---- the head
  pqPush(); pqMove(Q.hx,0,Q.hz+bob); if(S.ht) pqYaw(S.ht); if(Q.old) pqPitch(0.1);
  pqHead(P,Q,S);
  pqTop(0,0,Q.hr*Q.top);
  pqPop();
}
// one arm from the shoulder to a hand position (side sd: -1 left, 1 right)
function pqArm(Q,sd,zs,hx,hy,hz,col,bias){
  const sx=0.1, sy=sd*Q.ys, ex=(sx+hx)/2-0.5, ey=(sy+hy)/2+sd*1.0, ez=(zs+hz)/2-0.6;
  pqL(sx,sy,zs, ex,ey,ez, Q.aw,col||Q.sleeve,Q.aw*0.94,bias==null?0.25:bias);
  pqL(ex,ey,ez, hx,hy,hz, Q.aw*0.94,col||Q.sleeve,Q.aw*0.88,bias==null?0.25:bias);
  pqB(hx,hy,hz, P_HANDR*(Q.hand!==Q.skin?1.15:1), Q.hand, (bias==null?0.25:bias)+0.05);
}
const P_HANDR=1.95;
function pqFree(Q,sd,zs,sw,old){ const a=-sw*sd*(old?0.35:0.6), L=7.7; pqArm(Q,sd,zs, Math.sin(a)*L+0.6, sd*(Q.ys+0.9), zs-Math.cos(a)*L); }
function pqHeld(P,Q,S,zt,zs,sw){
  const o=P.o, ys=Q.ys, X=S.extra, hold=P.hold, hold2=P.hold2, b=S.bob||0;
  let rDone=false, lDone=false;
  // ---- companions: Brisket's sword and shield, Juniper's sling
  if(X&&X.brisket){
    const tn=X.taunt, ba=tn?0.5:X.ba, c=Math.cos(ba), s=Math.sin(ba), hz=tn?zs+3.5:zt-1.0+(X.swing?2.5:0);
    const hx=1.6+c*4.2, hy=ys+1.2+s*4.2;
    pqArm(Q,1,zs,hx,hy,hz); rDone=true;
    const tz=tn?hz+8:hz+(X.swing?1.0:-3.4), L=16.5;
    pqL(hx-c*2.4,hy-s*2.4,hz, hx+c*0.9,hy+s*0.9,hz, 0.75,'#5a3a1e',0.7,0.3);
    pqL(hx+c*1.0-s*2.6,hy+s*1.0+c*2.6,hz, hx+c*1.0+s*2.6,hy+s*1.0-c*2.6,hz, 0.6,'#9aa2ae',0.6,0.32);
    pqB(hx-c*2.9,hy-s*2.9,hz,0.85,'#8a929c',0.3);
    pqL(hx+c*1.6,hy+s*1.6,hz, hx+c*L,hy+s*L,tz, 1.25,'#d4dae2',0.7,0.3);
    pqN(hx+c*2,hy+s*2,hz+0.4, hx+c*(L-1.5),hy+s*(L-1.5),tz+0.3, 0.35,'rgba(255,255,255,.8)',0.35);
    // the shield on the left forearm
    const shz=tn?zs+1.5:zt-1.2;
    pqArm(Q,-1,zs,3.4,-(ys+0.4),shz); lDone=true;
    pqPush(); pqMove(4.6,-(ys+2.0),shz+0.4); pqYaw(-0.95);
    pqE(0,0,0, 0.9,4.1,5.3,'#b07a3e');
    if(pqVis(1,0,0)>0){ pqN(1.0,0,-4.4, 1.0,0,4.4, 1.5,'#b03a2a',0.3); pqB(1.0,0,0,1.45,'#c8ced8',0.45); pqD(1.9,-0.4,0.6,0.5,'#ffffff',0.6);
      const d=pqRing(0,0,TAU,14); let px=0,py=0,pz=0; for(let i=0;i<d.length;i+=3){ const yy=d[i]*4.0, zz=d[i+1]*5.2; if(i>0) pqN(0.75,py,pz,0.75,yy,zz,0.8,'#a4aebc',0.35); py=yy; pz=zz; } }
    pqPop();
  }
  if(X&&X.sling){
    if(X.sling==='whirl'){ const hx=1.2, hy=ys+1.2, hz=zs+6.2; pqArm(Q,1,zs,hx,hy,hz); pqFx(9,hx,hy,hz+1.4,1); }
    else { const hx=0.8, hy=ys+1.0, hz=zs-7.6; pqArm(Q,1,zs,hx,hy,hz); pqN(hx,hy,hz-0.6, hx-1.0,hy+0.5,hz-4.2, 0.3,'#6a4a2a',0.3); pqE(hx-1.1,hy+0.6,hz-4.6, 1.3,1.1,1.0,'#7a5432',0,0,0,0.3); }
    rDone=true;
  }
  // ---- what the right hand holds
  const R=(hx,hy,hz)=>{ pqArm(Q,1,zs,hx,hy,hz); rDone=true; };
  const Lh=(hx,hy,hz)=>{ pqArm(Q,-1,zs,hx,hy,hz); lDone=true; };
  if(!rDone&&hold) switch(hold){
    case 'hammer': R(3.4,ys+1.4,zt-2.8); pqL(3.4,ys+1.5,10.4+b, 3.9,ys+1.7,18.6+b, 0.75,'#5a3a1e',0.7,0.1); pqL(1.6,ys+1.7,19.0+b, 6.2,ys+1.7,19.0+b, 1.55,'#8a929c',1.45,0.1); break;
    case 'ladle': R(3.8,ys+1.3,zt-2.6); pqN(3.6,ys+1.3,10.8+b, 5.4,ys+1.6,19.8+b, 0.85,'#8a8c90',0.1); pqE(5.9,ys+1.7,20.8+b, 1.9,1.9,1.1,'#a8acb2'); pqD(5.9,ys+1.7,21.7+b,1.3,'#b8742e',0.2); break;
    case 'staff': { R(3.9,ys+1.3,zt+0.6); pqL(4.1,ys+1.6,0.5, 4.6,ys+1.8,33.0+b, 0.8,'#4a2e16',0.7,0.1); pqL(4.6,ys+1.8,33+b, 6.4,ys+1.8,34.4+b, 0.72,'#4a2e16',0.68); pqL(6.4,ys+1.8,34.4+b, 7.5,ys+1.8,32.4+b, 0.66,'#4a2e16',0.6); pqN(7.5,ys+1.8,32.4+b,7.5,ys+1.8,31.2+b,0.3,'#2a1a10');
      pqE(7.5,ys+1.8,29.6+b, 1.55,1.55,1.9,'#3a2a1a'); pqB(7.5,ys+1.8,29.6+b,1.1,'#ffe6a0',0.4); pqFx(1,7.5,ys+1.8,29.6+b,1); break; }
    case 'cane': R(4.6,ys+0.4,zt-4.4); pqL(4.8,ys+0.8,10.8+b, 6.6,ys+1.2,0.3, 0.7,'#5a3e22',0.65); pqL(4.8,ys+0.8,10.8+b, 3.3,ys+0.8,12.0+b, 0.66,'#5a3e22'); pqL(3.3,ys+0.8,12.0+b, 2.6,ys+0.8,10.9+b, 0.6,'#5a3e22'); break;
    case 'rod': R(4.2,ys+1.0,zt-1.8); pqL(3.6,ys+1.0,11.4+b, -6.0,ys+2.6,32.0+b, 0.62,'#6a4a2a',0.32); pqN(-6.0,ys+2.6,32.0+b, -7.4,ys+3.0,21.6, 0.28,'rgba(240,240,240,.85)'); pqB(-7.4,ys+3.0,21.0,0.95,'#e8402a'); pqD(-7.4,ys+3.0,21.9,0.5,'#ffffff',0.1); pqB(3.6,ys+1.0,12.4+b,1.0,'#5a5e66',0.2); break;
    case 'pick': R(3.6,ys+0.6,zt-0.6); pqL(4.4,ys+0.9,12.4+b, -5.0,ys+1.4,26.0+b, 0.78,'#6a4626'); pqC(-5.0,ys+1.4,26.0+b, -0.6,ys+1.4,29.4+b, 1.05,'#8a929c'); pqC(-5.0,ys+1.4,26.0+b, -8.4,ys+1.4,21.4+b, 1.05,'#8a929c'); break;
    case 'shovel': R(3.6,ys+0.6,zt-0.6); pqL(4.4,ys+0.9,12.4+b, -5.0,ys+1.4,25.0+b, 0.78,'#7a5430'); pqE(-6.4,ys+1.4,27.0+b, 1.0,2.4,3.2,'#8e969e',-0.64); break;
    case 'spear': R(4.1,ys+1.2,zt-0.6); pqL(4.5,ys+1.7,0.6, 5.0,ys+1.9,42.0+b, 0.72,'#6a4a2a',0.66,0.1); pqC(5.0,ys+1.9,41.4+b, 5.1,ys+1.9,47.6+b, 1.35,'#c8d0da'); pqB(5.0,ys+1.9,40.4+b,0.95,hx6(P.trim,'#c84a3a')); break;
    case 'pitchfork': R(4.1,ys+1.2,zt-0.6); pqL(4.5,ys+1.7,0.6, 5.0,ys+1.9,33.0+b, 0.72,'#7a5430',0.66,0.1); pqL(5.0,ys-0.2,33.2+b, 5.0,ys+4.0,33.2+b, 0.45,'#7a8088'); for(const yy of [-0.1,1.9,3.9]) pqN(5.0,ys+yy,33.2+b, 5.1,ys+yy,38.6+b, 0.62,'#8a929c'); break;
    case 'telescope': R(4.6,ys-0.6,zt+0.6); pqL(2.6,ys-0.4,zt-0.6, 7.4,ys-1.6,zt+4.4, 1.4,'#c8a04a',1.2,0.2); pqL(7.4,ys-1.6,zt+4.4, 10.4,ys-2.2,zt+7.4, 1.08,'#e0be62',0.92,0.2); for(const f of [0.32,0.62]) pqB(2.6+4.8*f,ys-0.4-1.2*f,zt-0.6+5*f,1.45,'#6a4a1a',0.15); pqD(10.6,ys-2.2,zt+7.7,0.8,'#cfe8ff',0.4); break;
    case 'lamp': R(5.8,ys-0.6,zt-2.8); pqE(7.0,ys-0.4,zt-1.8, 1.8,1.8,1.3,'#b8943a'); pqB(7.0,ys-0.4,zt-0.3,0.95,'#fff2b0',0.3); pqFx(2,7.0,ys-0.4,zt-0.2,1); break;
    case 'mallet': R(3.8,ys+1.2,zt-2.8); pqL(3.6,ys+1.3,10.6+b, 4.0,ys+1.5,17.4+b, 0.72,'#7a5430'); pqL(1.6,ys+1.5,18.0+b, 6.4,ys+1.5,18.0+b, 1.95,'#9a6a3a',1.85); break;
    case 'sword': R(4.4,ys+0.9,zt-2.6); pqL(4.6,ys+1.1,13.4+b, 5.6,ys+1.6,25.0+b, 0.85,'#c8a070',0.5,0.15); pqL(4.6,ys-0.6,13.2+b, 4.6,ys+2.8,13.2+b, 0.6,'#7a4a2a'); pqB(4.3,ys+1.0,10.8+b,0.75,'#7a4a2a'); break;
    case 'scrolls': R(5.2,ys-1.0,zt-2.0); for(const [dx,dz,a] of [[0,0,0],[0.8,1.6,0.3],[-0.6,-1.4,-0.2]]){ pqL(4.6+dx,ys-3.6,zt-2.4+dz, 5.0+dx,ys+1.0+a*3,zt-1.6+dz+a, 0.95,'#efe2c0',0.95,0.3); pqD(4.9+dx,ys-1.2,zt-2.0+dz+0.2,0.42,'#c84a3a',0.4); } break;
    case 'book': { const bc=hx6(o.bookc,'#5a2a22'); R(5.6,2.6,zt-0.6); Lh(5.6,-2.6,zt-0.6); pqE(6.6,0,zt+0.4, 0.7,3.6,2.8,bc,0.15); pqE(6.0,0,zt+0.5, 0.6,3.3,2.5,'#f2e6c8',0.15); if(pqVis(1,0,0)>0) pqN(7.3,0,zt-2.0,7.3,0,zt+2.8,0.45,shd(bc,0.25),0.4); break; }
    case 'yarn': { const Y=hx6(o.yarnc,'#e0a0b8'); R(5.6,2.2,zt-1.6); Lh(5.2,-2.8,zt-1.4); pqB(6.0,-3.8,zt-0.8,2.2,Y,0.3); pqBand(6.0,-3.8,zt-0.8,2.2,2.2,2.2,pqTilt(0.7,-Math.PI,Math.PI,12),0.3,shd(Y,-0.25),0.35); pqE(6.6,0.8,zt-3.0, 0.8,2.2,1.8,Y,0,0,0,0.25); pqN(5.0,-0.6,zt-0.4, 7.8,2.8,zt-3.8, 0.4,'#e8e0d0',0.4); pqN(5.0,2.4,zt-0.6, 7.8,-0.4,zt-3.6, 0.4,'#e8e0d0',0.4); break; }
    case 'mug': R(5.2,2.4,zt-1.8); Lh(5.2,-2.4,zt-1.8); pqY(6.2,0,zt-3.4, 2.0,2.0,3.2,'#8a5a3a','#5a3018',0.3); pqB(6.2,2.2,zt-1.8,0.9,'#7a4a2a',0.25); pqFx(6,6.2,0,zt+0.2,1); break;
    case 'clasp': R(5.4,1.0,zt-1.4); Lh(5.4,-1.0,zt-1.4); break;
    case 'behind': R(-5.6,3.0,zt-2.8); Lh(-5.6,-3.0,zt-2.8); break;
    case 'reed': R(3.9,ys+1.3,zt+0.4); pqL(4.1,ys+1.6,0.5, 4.5,ys+1.8,34+b, 0.55,'#8a9a5a',0.45); pqE(4.5,ys+1.8,35.6+b, 1.0,1.0,2.4,'#7a5a3a'); break;
  }
  // ---- what the left hand holds
  if(!lDone&&hold2) switch(hold2){
    case 'basket': { const cols=o.basketc==='bread'?['#d89848','#c07830']:o.basketc==='eggs'?['#f6efe0','#e8dcc4']:o.basketc==='apples'?['#d8402a','#e8a030']:['#5a9a3a','#8ac85a','#c890e0'];
      Lh(4.4,-(ys+1.4),zt-1.6); pqY(5.0,-(ys+2.0),6.6+b, 3.1,3.6,3.6,'#b8884a','#7a5226');
      for(let i=0;i<5;i++){ const a=i*1.3+0.4, d=i?1.6:0; pqB(5.0+Math.cos(a)*d,-(ys+2.0)+Math.sin(a)*d,10.4+b,1.15,cols[i%cols.length],0.2); }
      pqN(5.0,-(ys+2.0)-3.4,10.2+b, 4.6,-(ys+1.6),13.4+b, 0.55,'#6a4420',0.3); pqN(4.6,-(ys+1.6),13.4+b, 5.0,-(ys+2.0)+3.4,10.2+b, 0.55,'#6a4420',0.3); break; }
    case 'cheese': Lh(5.4,-(ys+0.6),zt-2.8); pqY(6.4,-(ys+0.4),zt-5.6, 3.5,3.5,2.6,'#e0a830','#f2cc58',0.2); for(const [dx,dy] of [[-1,-1],[1.2,0.6],[-0.4,1.4]]) pqD(6.4+dx,-(ys+0.4)+dy,zt-2.9,0.42,'#d8a838',0.4); break;
    case 'loaf': Lh(4.8,-(ys+1.2),zt-2.8); pqE(6.0,-(ys+0.6),zt-2.0, 4.2,2.0,1.9,'#d8984a',0,0.35); for(const d of [-2,0,2]) pqN(6.0+d*0.94-0.4,-(ys+0.6)+d*0.34-0.6,zt-0.3, 6.0+d*0.94+0.4,-(ys+0.6)+d*0.34+0.6,zt-0.3, 0.42,'#f2d8a0',0.3); break;
    case 'kettle': Lh(4.8,-(ys+1.2),zt-2.2); pqE(5.6,-(ys+2.0),zt-6.0, 2.9,2.9,2.6,'#4a4a50'); pqB(5.6,-(ys+2.0),zt-3.2,0.7,'#2a2a2e',0.2); pqC(7.8,-(ys+2.0),zt-6.0, 10.2,-(ys+2.0),zt-3.8, 0.9,'#3a3a40'); pqN(3.6,-(ys+2.0),zt-4.2, 4.8,-(ys+1.2),zt-2.4, 0.5,'#2a2a2e',0.2); pqFx(5,10.4,-(ys+2.0),zt-3.4,1); break;
    case 'tray': Lh(4.6,-(ys+1.0),zt+2.2); pqY(5.4,-(ys+1.6),zt+2.6, 4.4,4.4,0.55,'#9aa0a6','#b8bec4'); pqY(4.2,-(ys+2.6),zt+3.15, 1.2,1.0,1.4,'#f6eedc','#8a5a32',0.2); pqY(6.6,-(ys+0.4),zt+3.15, 1.2,1.0,1.4,'#f6eedc','#8a5a32',0.2); pqB(6.8,-(ys+2.8),zt+3.9,1.1,'#d89848',0.2); break;
    case 'hatbox': Lh(4.4,-(ys+1.0),zt-2.6); pqY(5.0,-(ys+1.8),6.0+b, 3.4,3.4,4.2,'#f8e8ee','#ffd0e0'); for(let a=-2.8;a<2.9;a+=0.7){ if(pqVis(Math.cos(a),Math.sin(a),0)<0.1) continue; pqN(5.0+Math.cos(a)*3.5,-(ys+1.8)+Math.sin(a)*3.5,6.2+b, 5.0+Math.cos(a)*3.5,-(ys+1.8)+Math.sin(a)*3.5,10.0+b, 0.7,'#ff8ab0',0.2); } pqB(5.0,-(ys+1.8),10.5+b,0.9,'#c84a6a',0.3); pqN(4.4,-(ys+1.0),zt-2.6, 5.0,-(ys+1.8),10.4+b, 0.45,'#c84a6a',0.3); break;
    case 'lantern': Lh(4.2,-(ys+1.0),zt-3.6); pqN(4.2,-(ys+1.0),zt-4.4, 4.5,-(ys+1.3),zt-5.6, 0.35,'#2a1a10',0.2); pqE(4.5,-(ys+1.3),zt-7.2, 1.35,1.35,1.75,'#3a2a1a'); pqB(4.8,-(ys+1.3),zt-7.2,0.95,'#ffe6a0',0.35); pqFx(1,4.6,-(ys+1.3),zt-7.2,0.8); break;
    case 'fish': Lh(4.4,-(ys+1.0),zt-3.8); pqE(4.6,-(ys+1.6),zt-8.2, 1.2,1.0,3.5,'#a8c8d0'); pqC(4.6,-(ys+1.6),zt-5.0, 4.6,-(ys+1.6),zt-3.6, 1.25,'#7a9aa8'); if(pqVis(1,0,0)>-0.2) pqD(5.6,-(ys+1.6),zt-10.6,0.35,'#1a1a1a',0.2); break;
    case 'fiddle': { const t=S.bow||0; Lh(8.8,-5.6,zt+2.2); pqPush(); pqMove(4.8,-3.0,zt+2.6); pqYaw(-0.62); pqRoll(0.5); pqE(0,0,0, 3.2,2.0,0.95,'#b8642a'); pqE(2.6,0,0.1, 1.9,1.6,0.85,'#c0702e'); pqL(3.6,0,0.3, 7.4,0,0.4, 0.55,'#1e1410'); pqB(7.8,0,0.4,0.7,'#5a3010'); pqD(0.8,0,0.95,0.6,'#1e1410',0.2); pqPop();
      const hx=5.6+t*0.8, hy=3.4-t*2.2, hz=zt+1.6; pqArm(Q,1,zs,hx,hy,hz); pqN(hx,hy,hz+0.4, hx-1.6,hy-10.0,hz+2.6, 0.4,'#f0e6d0',0.4); rDone=true; break; }
    case 'drake': { Lh(5.0,-(ys+0.4),zt+1.0); const dx=5.4, dy=-(ys+0.6), dz=zt+3.0; pqE(dx,dy,dz, 2.2,1.4,1.6,'#ffcf9a'); pqB(dx+1.9,dy,dz+1.6,1.25,'#ffcf9a'); for(const sd of [-1,1]) pqPoly([[dx,dy,dz+1],[dx-1.6,dy+sd*3.4,dz+3.2],[dx-2.4,dy+sd*1.2,dz+1.6]],'#ffb070',0.1); pqL(dx-1.8,dy,dz, dx-4.2,dy,dz-1.2, 0.7,'#ffcf9a',0.3); break; }
    case 'flame': { Lh(6.2,-(ys-1.0),zt+1.6); pqB(7.4,-(ys-1.2),zt+3.6,1.9,'#fff0c0',0.3); pqFx(10,7.4,-(ys-1.2),zt+3.6,1); break; }
  }
  // ---- free arms swing
  if(!rDone) pqFree(Q,1,zs,sw,Q.old);
  if(!lDone) pqFree(Q,-1,zs,sw,Q.old);
}
// ---------- the head, in head space (centre at the origin, x is where the face points)
function pqHead(P,Q,S){
  const o=P.o, r=Q.hr, hd=P.hairdo, hat=P.hat, hood=P.hood, H=Q.hair, skin=Q.skin, front=pqVis(1,0,0);
  const morrow=P.id==='morrow';
  pqB(0,0,0,r,morrow?'#2a1030':skin);
  // ears
  const showEars=!hood&&(hd==='short'||hd==='crop'||hd==='bald'||hd==='spiky'||hd==='pony'||hd==='bun')&&hat!=='fur';
  if(showEars) for(const sd of [-1,1]){ pqE(0.02*r,sd*0.96*r,-0.06*r, 0.17*r,0.13*r,0.26*r, shd(skin,-0.1)); if(o.earrings) pqD(0.04*r,sd*1.04*r,-0.36*r,0.1*r,'#f2c84a',0.05); }
  else if(o.earrings&&!hood) for(const sd of [-1,1]) pqD(0.25*r,sd*0.98*r,-0.42*r,0.1*r,'#f2c84a',0.05);
  // the face
  const eb=r*0.22, ez=0.04*r, ex=0.85*r, ey=0.35*r, er=(Q.kid?0.165:Q.old?0.13:0.15)*r;
  if(morrow){ for(const sd of [-1,1]){ pqD(ex,sd*ey*0.9,ez,er*0.9,'#ff9a3a',eb); pqD(ex+0.02*r,sd*ey*0.9,ez+0.02*r,er*0.4,'#fff0c0',eb+0.02); } pqFx(8,ex,0,ez,front>0?1:0); }
  else{
    for(const sd of [-1,1]){
      if(o.eyepatch&&sd<0){ pqD(ex,sd*ey,ez,er*1.45,'#1a1410',eb); continue; }
      pqD(ex,sd*ey,ez,er,P.spirit?shd(skin,-0.45):'#1e1410',eb); pqD(ex+0.03*r,sd*ey-0.04*r,ez+0.06*r,er*0.36,'#ffffff',eb+0.02);
      pqN(0.86*r,sd*0.2*r,0.3*r, 0.8*r,sd*0.5*r,0.31*r, Q.old?0.11*r:0.075*r, Q.brow, eb);
    }
    pqB(0.97*r,0,-0.15*r,0.12*r,shd(skin,0.04),eb*0.5);
    if(!P.beard&&!P.stache){ pqN(0.9*r,-0.15*r,-0.37*r, 0.94*r,0,-0.43*r, 0.06*r,'rgba(110,40,30,.7)',eb); pqN(0.94*r,0,-0.43*r, 0.9*r,0.15*r,-0.37*r, 0.06*r,'rgba(110,40,30,.7)',eb); }
    if(o.blush||Q.kid) for(const sd of [-1,1]) pqD(0.78*r,sd*0.57*r,-0.22*r,0.15*r,'rgba(235,105,105,.42)',eb*0.6);
    if(o.freckles) for(const sd of [-1,1]) for(const [yy,zz] of [[0.42,-0.16],[0.55,-0.1],[0.5,-0.28]]) pqD(0.84*r,sd*yy*r,zz*r,0.04*r,'rgba(140,70,40,.65)',eb*0.7);
    if(o.soot) pqD(0.8*r,-0.5*r,-0.3*r,0.17*r,'rgba(40,30,25,.32)',eb*0.6);
  }
  // beards and mustaches
  if(P.beard){ const B=Q.beard;
    if(P.beard==='big'){ pqE(0.6*r,0,-0.78*r, 0.5*r,0.74*r,0.6*r, B); pqE(0.62*r,0,-1.2*r, 0.36*r,0.48*r,0.42*r, B); for(const sd of [-1,1]) pqE(0.22*r,sd*0.74*r,-0.42*r, 0.32*r,0.26*r,0.5*r, B); }
    else { pqE(0.62*r,0,-0.66*r, 0.4*r,0.6*r,0.4*r, B); for(const sd of [-1,1]) pqE(0.22*r,sd*0.74*r,-0.38*r, 0.3*r,0.24*r,0.44*r, B); }
  }
  if(P.stache){ const M=shd(Q.beard,-0.06), big=P.stache==='big';
    for(const sd of [-1,1]){ pqE(0.95*r,sd*0.17*r,-0.27*r, 0.12*r,0.22*r,0.11*r, M, 0,0,sd*0.35, eb*0.8); if(big){ pqE(0.86*r,sd*0.42*r,-0.22*r, 0.11*r,0.2*r,0.15*r, M, 0,0,-sd*0.8, eb*0.8); pqB(0.8*r,sd*0.56*r,-0.08*r,0.08*r,M,eb*0.8); } } }
  // hair (unless a hood covers it)
  if(!hood){
    const covers=hat==='helm'||hat==='miner'||hat==='kerchief', hatOn=!!hat;
    if(hd!=='bald'&&!covers) pqE(-0.28*r,0,0.2*r, 0.9*r,1.04*r,0.92*r, H);
    if(!covers&&hd!=='bald'&&hd!=='crop') pqE(0.38*r,0,0.64*r, 0.56*r,0.86*r,0.38*r, H, 0.35);
    if(hd==='crop'&&!covers) pqE(0.42*r,0,0.6*r, 0.44*r,0.74*r,0.25*r, H, 0.4);
    if(hd==='bald'){ for(const sd of [-1,1]) pqE(-0.25*r,sd*0.86*r,-0.04*r, 0.36*r,0.22*r,0.3*r, H); pqE(-0.78*r,0,-0.12*r, 0.28*r,0.7*r,0.3*r, H); if(!hatOn) pqD(0.2*r,-0.25*r,0.98*r,0.14*r,'rgba(255,255,255,.4)',0.4); }
    if(hd==='spiky'){ const n=hatOn?5:8; for(let i=0;i<n;i++){ const az=hatOn?Math.PI-0.9+i*0.45:Math.PI-1.4+i*(2.8/(n-1)), el=hatOn?0.05:(i%2?0.55:0.95); const ux=Math.cos(az)*Math.cos(el), uy=Math.sin(az)*Math.cos(el), uz=Math.sin(el); pqC(-0.28*r+ux*0.75*r,uy*0.85*r,0.2*r+uz*0.75*r, -0.28*r+ux*1.32*r,uy*1.3*r,0.2*r+uz*1.32*r, 0.26*r, H); }
      if(!hatOn) for(const yy of [-0.4,0,0.4]) pqC(0.2*r,yy*r,0.82*r, 0.42*r,yy*1.1*r,1.32*r, 0.22*r, H, 0.1); }
    if(hd==='curly'||hd==='wild'){ const wild=hd==='wild', cr=(wild?0.26:0.25)*r, R0=(wild?0.92:0.9)*r; let i=0;
      for(const el of hatOn?[0.08]:[0.12,0.6,1.08]) for(let az=-2.9;az<=2.91;az+=hatOn?0.5:(el>1?1.2:el>0.5?0.62:0.5)){ if(Math.abs(az)<(hatOn?1.6:el<0.4?1.25:el<0.9?0.5:-1)) continue; const q=wild?1+((i*7)%5)/22:1; i++; pqB(-0.24*r+Math.cos(az)*Math.cos(el)*R0*q,Math.sin(az)*Math.cos(el)*R0*1.1*q,0.2*r+Math.sin(el)*R0*0.95*q,cr*q,shd(H,(i%3)*0.05)); }
      if(wild&&!hatOn) for(const sd of [-1,1]) pqB(-0.32*r,sd*1.02*r,0.05*r,0.28*r,shd(H,0.04)); }
    if(hd==='bun'){ if(hatOn) pqB(-0.9*r,0,0.18*r,0.34*r,H); else { pqB(-0.48*r,0,0.92*r,0.42*r,H); pqBand(-0.48*r,0,0.92*r,0.42*r,0.42*r,0.42*r,pqRing(0,-3.1,3.1,10),0.08*r,shd(H,-0.3),0.1); if(o.pin){ pqN(-0.95*r,-0.45*r,0.95*r, -0.05*r,0.45*r,1.1*r, 0.08*r,'#d8b04a',0.3); pqD(-0.95*r,-0.45*r,0.95*r,0.1*r,'#7ac8e8',0.35); } } }
    if(hd==='long'){ pqE(-0.62*r,0,-0.55*r, 0.42*r,0.94*r,0.95*r, H); for(const sd of [-1,1]) pqE(0.15*r,sd*0.9*r,-0.42*r, 0.3*r,0.2*r,0.62*r, H); }
    if(hd==='braids'){ for(const sd of [-1,1]){ for(let j=0;j<4;j++) pqB(-0.22*r+j*0.08*r,sd*(0.86-j*0.04)*r,(-0.42-j*0.36)*r,(0.24-j*0.02)*r,shd(H,(j%2)*0.08)); pqD(-0.0*r,sd*0.74*r,-1.72*r,0.12*r,hx6(o.band,P.trim),0.2); } }
    if(hd==='pigtails'){ for(const sd of [-1,1]){ pqE(-0.3*r,sd*1.08*r,0.02*r, 0.34*r,0.3*r,0.44*r, H); pqD(-0.28*r,sd*0.88*r,0.22*r,0.11*r,hx6(o.band,P.trim),0.2); } }
    if(hd==='pony'){ const sw=S.walk?Math.sin((S.ph||0)*2)*0.12*r:0; pqB(-0.92*r,0,0.28*r,0.17*r,hx6(o.band,P.trim)); pqL(-1.0*r,0,0.2*r, -1.42*r,sw,-0.66*r, 0.3*r,H,0.14*r); }
    if(o.band){ pqBand(0,0,0,r,r,r,pqRing(0.4,-3.14,3.14,18),0.13*r,o.band,0.3,1.08); pqB(-1.04*r,0,0.38*r,0.15*r,o.band); }
    if(o.flower){ const fx=hatOn?0.05*r:-0.05*r, fy=-0.78*r, fz=hatOn?0.82*r:0.62*r; for(let i=0;i<5;i++){ const a=i/5*TAU; pqD(fx,fy+Math.cos(a)*0.13*r,fz+Math.sin(a)*0.13*r,0.11*r,o.flower,0.3); } pqD(fx,fy,fz,0.08*r,'#ffd84a',0.33); }
  }
  // the hood frames the face
  if(hood){
    pqE(-0.3*r,0,0.12*r, 1.14*r,1.17*r,1.12*r, hood, 0,0,0, front>-0.35?-0.45*r:0);
    if(P.id==='morrow') pqC(-0.95*r,0,0.7*r, -1.45*r,0,1.1*r, 0.42*r, hood, 0.05);
    if(front>-0.3){ let px=0,py=0,pz=0,pv=-1; for(let i=0;i<=16;i++){ const u=i/16*TAU, x=0.36*r, y=0.95*r*Math.cos(u), z=0.12*r+0.91*r*Math.sin(u), v=pqVis(0.58,0.81*Math.cos(u),0.81*Math.sin(u)); if(i&&v>0&&pv>0) pqN(px,py,pz,x,y,z,0.16*r,shd(hood,-0.35),0.15); px=x; py=y; pz=z; pv=v; } }
    if(o.hairwisp) for(const sd of [-1,1]) pqN(0.82*r,sd*0.52*r,0.4*r, 0.86*r,sd*0.7*r,-0.2*r, 0.1*r,H,eb);
    if(o.sprig){ pqE(-0.3*r,-0.6*r,1.0*r, 0.3*r,0.14*r,0.12*r,'#6aa83a',0,0.6); pqE(-0.45*r,-0.45*r,1.08*r, 0.26*r,0.12*r,0.1*r,'#8ac85a',0,-0.5); }
  }
  // glasses, goggles, eyepatch strap, pipe
  if(o.glasses&&!morrow) for(const sd of [-1,1]){ if(pqVis(ex,sd*ey,ez)<0.05) continue; const cx=ex+0.07*r, cy=sd*ey, rr=0.22*r; let py=0,pz=0; for(let i=0;i<=8;i++){ const a=i/8*TAU, yy=cy+Math.cos(a)*rr, zz=ez+Math.sin(a)*rr; if(i) pqN(cx,py,pz,cx,yy,zz,0.06*r,'#2a2420',eb+0.05); py=yy; pz=zz; } if(sd>0) pqN(cx,-ey+rr,ez,cx,ey-rr,ez,0.06*r,'#2a2420',eb+0.05); }
  if(o.eyepatch) pqBand(0,0,0,r,r,r,pqTilt(0.7,-0.3,2.6,8).map((v,i)=>i%3===1?-v:v),0.07*r,'#1a1410',0.3,1.05);
  if(o.pipe){ pqN(0.92*r,0.16*r,-0.38*r, 1.24*r,0.42*r,-0.5*r, 0.09*r,'#4a2c18',eb); pqY(1.28*r,0.44*r,-0.66*r, 0.13*r,0.16*r,0.28*r,'#5a3420','#ff8a3a',eb); pqFx(4,1.28*r,0.44*r,-0.34*r,front>-0.2?1:0.5); }
  if(hat) pqHat(P,Q,S,hat);
  if(o.horns){ const hc=shd(skin,0.45); for(const sd of [-1,1]){ pqL(-0.05*r,sd*0.42*r,0.78*r, -0.55*r,sd*0.62*r,1.22*r, 0.2*r,hc,0.13*r); pqL(-0.55*r,sd*0.62*r,1.22*r, -1.05*r,sd*0.6*r,1.18*r, 0.13*r,hc,0.04*r); } }
  if(o.goggles){ const gz=hat?0.72*r:0.5*r; pqBand(0,0,0,r,r,r,pqRing(hat?0.72:0.5,-3.14,3.14,18),0.1*r,'#3a2a1e',0.25,hat?1.12:1.05); for(const sd of [-1,1]){ if(pqVis(0.8,sd*0.36,0.5)<0) continue; pqB(0.78*r,sd*0.36*r,gz,0.21*r,'#b8943a',0.3); pqD(0.95*r,sd*0.36*r,gz+0.02*r,0.15*r,'#8ad0e0',0.45); pqD(0.97*r,sd*0.32*r,gz+0.07*r,0.05*r,'#ffffff',0.5); } }
  if(o.flour) for(let i=0;i<12;i+=4) pqSDot(0,0,0,r*1.05,r*1.05,r*1.05,Q.specks[i]*0.6,Q.specks[i+1]*0.8,0.6,0.07*r,'rgba(255,255,255,.75)',0.3);
  if(o.frost) for(let i=0;i<24;i+=4) pqSDot(-0.2*r,0,0.2*r,r*1.0,r*1.08,r*1.0,Q.specks[i]*0.7-0.3,Q.specks[i+1],0.5+Q.specks[i+2]*0.4,0.06*r,'rgba(235,248,255,.95)',0.3);
}
function pqHat(P,Q,S,k){
  const r=Q.hr, o=P.o, C=hx6(P.hatc,null);
  switch(k){
    case 'chef': { const Wh='#f7f5ef'; pqY(-0.04*r,0,0.56*r, 0.84*r,0.86*r,0.46*r, Wh, '#ffffff'); for(const [x,y,z,rr] of [[-0.05,0,1.42,0.48],[0.34,0,1.18,0.42],[-0.42,0,1.18,0.42],[-0.05,0.4,1.2,0.42],[-0.05,-0.4,1.2,0.42]]) pqB(x*r,y*r,z*r,rr*r,Wh); break; }
    case 'straw': { const Sc='#dcb862'; pqE(-0.05*r,0,0.74*r, 1.36*r,1.36*r,0.11*r, Sc); pqE(-0.08*r,0,0.98*r, 0.74*r,0.74*r,0.42*r, shd(Sc,0.06)); pqBand(-0.08*r,0,0.98*r,0.74*r,0.74*r,0.42*r,pqRing(-0.42,-3.14,3.14,16),0.16*r,hx6(o.hatband,'#8a3a2a'),0.2); break; }
    case 'top': { const T='#2a2830'; pqE(0,0,0.72*r, 1.14*r,1.14*r,0.1*r, T); pqY(0,0,0.74*r, 0.7*r,0.72*r,1.2*r, T, '#3a3842'); pqCylBand(0,0,0.9*r,0.72*r,0.24*r,C||'#8a2e22',0.4*r); break; }
    case 'cap': { const Cc=C||'#4a6a3a'; pqE(0.02*r,0,0.56*r, 0.98*r,1.0*r,0.58*r, Cc); pqE(0.8*r,0,0.5*r, 0.42*r,0.62*r,0.08*r, shd(Cc,-0.22), -0.12); pqD(0,0,1.15*r,0.1*r,shd(Cc,-0.25),0.2); for(const a of [0.8,2.35,-0.8,-2.35]) pqBand(0.02*r,0,0.56*r,0.98*r,1.0*r,0.58*r,pqMer(a,0.1,1.3,3),0.05*r,'rgba(0,0,0,.2)',0.15); break; }
    case 'beanie': { const Cc=C||'#c84a3a'; pqE(-0.06*r,0,0.5*r, 1.0*r,1.03*r,0.64*r, Cc); pqBand(-0.06*r,0,0.5*r,1.0*r,1.03*r,0.64*r,pqRing(-0.32,-3.14,3.14,18),0.2*r,shd(Cc,-0.2),0.2); for(let a=-2.8;a<2.9;a+=0.5) pqBand(-0.06*r,0,0.5*r,1.0*r,1.03*r,0.64*r,pqMer(a,0.0,1.1,3),0.05*r,'rgba(0,0,0,.16)',0.15); pqB(-0.12*r,0,1.18*r,0.26*r,hx6(o.pompom,'#f6f2ea')); break; }
    case 'feather': { const Cc=C||'#7a2a7a', F=hx6(o.featherc,'#ffd84a'); pqE(0,0,0.74*r, 1.22*r,1.18*r,0.11*r, Cc, -0.08); pqE(-0.06*r,0,0.98*r, 0.68*r,0.7*r,0.4*r, Cc); pqBand(-0.06*r,0,0.98*r,0.68*r,0.7*r,0.4*r,pqRing(-0.4,-3.14,3.14,16),0.12*r,shd(Cc,-0.35),0.2);
      pqL(0.05*r,0.42*r,1.12*r, -0.55*r,0.58*r,1.58*r, 0.17*r,F,0.13*r,0.1); pqL(-0.55*r,0.58*r,1.58*r, -1.25*r,0.52*r,1.4*r, 0.13*r,F,0.05*r,0.1); break; }
    case 'helm': { const Sc=o.frost?'#c4d0dc':'#aeb6c2'; pqE(-0.1*r,0,0.5*r, 1.03*r,1.07*r,0.62*r, Sc); pqBand(-0.1*r,0,0.5*r,1.03*r,1.07*r,0.62*r,pqRing(-0.18,-3.14,3.14,18),0.13*r,shd(Sc,-0.25),0.2); pqBand(-0.1*r,0,0.5*r,1.03*r,1.07*r,0.62*r,pqMer(0,0,1.57,4).concat(pqMer(Math.PI,1.57,0,4)),0.12*r,shd(Sc,0.25),0.2);
      for(let a=-2.6;a<2.7;a+=0.75) pqSDot(-0.1*r,0,0.5*r,1.03*r,1.07*r,0.62*r,Math.cos(a)*0.97,Math.sin(a)*0.97,-0.12,0.05*r,'#e8ecf0',0.3);
      if(P.plume){ pqL(0.32*r,0,1.06*r, -0.2*r,0,1.48*r, 0.2*r,P.plume,0.26*r,0.05); pqL(-0.2*r,0,1.48*r, -0.9*r,0,1.36*r, 0.26*r,P.plume,0.14*r,0.05); pqL(-0.9*r,0,1.36*r, -1.3*r,0,0.95*r, 0.14*r,shd(P.plume,-0.1),0.05*r,0.05); } break; }
    case 'miner': { const Cc=C||'#c8a040'; pqE(-0.08*r,0,0.5*r, 1.04*r,1.07*r,0.64*r, Cc); pqBand(-0.08*r,0,0.5*r,1.04*r,1.07*r,0.64*r,pqRing(-0.2,-3.14,3.14,18),0.16*r,shd(Cc,-0.3),0.2); pqBand(-0.08*r,0,0.5*r,1.04*r,1.07*r,0.64*r,pqMer(0,0.1,1.57,3).concat(pqMer(Math.PI,1.57,0.1,3)),0.12*r,shd(Cc,-0.18),0.2);
      if(o.lamp!==false){ pqE(0.86*r,0,0.66*r, 0.2*r,0.26*r,0.22*r,'#8a6a2a'); pqD(1.05*r,0,0.67*r,0.17*r,'#fff4c0',0.4); pqFx(3,1.1*r,0,0.66*r,pqVis(1,0,0)>-0.2?1:0.3); } break; }
    case 'rain': { const Cc=C||'#e8c03a'; pqE(-0.1*r,0,0.56*r, 0.95*r,0.98*r,0.56*r, Cc); pqE(-0.24*r,0,0.48*r, 1.32*r,1.24*r,0.1*r, Cc, 0.12); pqBand(-0.1*r,0,0.56*r,0.95*r,0.98*r,0.56*r,pqRing(-0.15,-3.14,3.14,16),0.06*r,'rgba(0,0,0,.2)',0.2); break; }
    case 'fancy': { const Cc=C||'#ffb0c8', F=hx6(o.featherc,'#fff4e0'); pqE(0,0,0.76*r, 1.45*r,1.45*r,0.11*r, Cc, 0.06,0,0.1); pqE(-0.05*r,0,0.98*r, 0.66*r,0.66*r,0.38*r, shd(Cc,-0.12)); pqBand(-0.05*r,0,0.98*r,0.66*r,0.66*r,0.38*r,pqRing(-0.4,-3.14,3.14,16),0.16*r,'#c84a6a',0.2);
      for(const a of [-0.95,-0.4,0.15]){ const fx=Math.cos(a)*0.7*r-0.05*r, fy=Math.sin(a)*0.7*r, fz=0.92*r; pqB(fx,fy,fz,0.17*r,'#e84a7a',0.15); pqD(fx+0.12*r,fy,fz+0.05*r,0.07*r,'#a02a50',0.3); }
      pqL(-0.3*r,-0.55*r,1.1*r, -1.0*r,-0.95*r,1.45*r, 0.15*r,F,0.11*r,0.1); pqL(-1.0*r,-0.95*r,1.45*r, -1.55*r,-0.75*r,1.1*r, 0.11*r,F,0.04*r,0.1); break; }
    case 'fur': { const Cc=C||'#8a6a4a'; pqE(-0.06*r,0,0.5*r, 1.03*r,1.06*r,0.62*r, Cc); for(const sd of [-1,1]) pqE(0.02*r,sd*0.95*r,-0.1*r, 0.3*r,0.18*r,0.44*r, Cc); pqE(0.72*r,0,0.66*r, 0.26*r,0.82*r,0.24*r, shd(Cc,0.18), 0.3); for(let a=-2.6;a<2.7;a+=0.55) pqBand(-0.06*r,0,0.5*r,1.03*r,1.06*r,0.62*r,pqMer(a,0.1,1.0,2),0.06*r,'rgba(0,0,0,.18)',0.15); break; }
    case 'kerchief': { const Cc=C||'#c84a3a'; pqE(-0.2*r,0,0.5*r, 0.98*r,1.05*r,0.62*r, Cc); for(let e=0.0;e<1.3;e+=0.35) for(let a=-3.0;a<3.0;a+=0.62) pqSDot(-0.2*r,0,0.5*r,0.98*r,1.05*r,0.62*r,Math.cos(a+e)*Math.cos(e),Math.sin(a+e)*Math.cos(e),Math.sin(e),0.06*r,'rgba(255,255,255,.6)',0.2);
      pqBand(-0.2*r,0,0.5*r,0.98*r,1.05*r,0.62*r,pqRing(-0.1,-1.4,1.4,8),0.08*r,shd(Cc,-0.3),0.2); for(const sd of [-1,1]) pqC(-1.02*r,sd*0.08*r,0.25*r, -1.42*r,sd*0.32*r,-0.12*r, 0.2*r, Cc, 0.05); pqB(-1.04*r,0,0.28*r,0.15*r,shd(Cc,-0.12)); break; }
    case 'wizard': { const Cc=C||'#3a3a8a'; pqE(0,0,0.74*r, 1.26*r,1.26*r,0.1*r, Cc); pqL(0,0,0.86*r, -0.12*r,0,1.5*r, 0.66*r,Cc,0.44*r); pqC(-0.12*r,0,1.5*r, -0.62*r,0,2.45*r, 0.44*r, shd(Cc,0.04)); for(const [x,y,z] of [[0.55,0.25,1.1],[0.3,-0.35,1.4],[0.08,0.2,1.8]]) pqD(x*r,y*r,z*r,0.09*r,'#ffe066',0.35); break; }
    case 'party': { pqC(0,0,0.68*r, 0,0,2.0*r, 0.52*r, '#e84a8a'); for(const [z,a] of [[0.95,0.4],[1.3,-0.5],[1.6,0.9]]) pqD(Math.cos(a)*0.4*r*(2.0-z)/1.3,Math.sin(a)*0.4*r*(2.0-z)/1.3,z*r,0.08*r,'#ffd84a',0.3); pqB(0,0,2.05*r,0.17*r,'#ffd84a'); break; }
    case 'crown': { pqBand(0,0,0.0,r,r,r,pqRing(0.62,-3.14,3.14,18),0.12*r,'#d8a838',0.25,1.06); for(let i=0;i<8;i++){ const a=i/8*TAU; pqB(Math.cos(a)*0.66*r,Math.sin(a)*0.66*r,0.86*r,0.12*r,['#ffd84a','#ff7aa0','#ffffff','#b48cff'][i%4],0.1); } break; }
    default: { const Cc=C||'#6a5a4a'; pqE(0,0,0.56*r, 0.96*r,0.98*r,0.56*r, Cc); }
  }
}

// ---------- sprites: bake a figure once per pose and zoom, keep the most recent ones
const T3P={spr:new Map(),px:0,deadline:0,last:0,bakes:0,bakeMs:0,hits:0,parts:0,tB:0,tC:0,tE:0,force:false,maxPx:12e6,maxN:1400};
function t3pRes(){ const m=ctx.getTransform(), s=Math.hypot(m.a,m.b)||1; return Math.max(0.5,Math.round(s*20)/20); }
function t3pBake(face,k,build,arg,res){
  const q0=performance.now(); t3Begin(0,0,face,{k}); pqReset(); T3S.fx=[]; T3S.top=0; build(arg);
  const R=T3R, ct=T3.ct, q1=performance.now(); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; T3P.parts+=R.n;
  for(let i=0;i<R.n;i++){ const p=R.list[i];
    if(p.t===0){ const m=Math.max(p.s1,p.s2); if(p.sx-m<x0) x0=p.sx-m; if(p.sx+m>x1) x1=p.sx+m; if(p.sy-m<y0) y0=p.sy-m; if(p.sy+m>y1) y1=p.sy+m; }
    else if(p.t===1||p.t===5){ const m=Math.max(p.r1,p.r2); x0=Math.min(x0,p.ax-m,p.bx-m); x1=Math.max(x1,p.ax+m,p.bx+m); y0=Math.min(y0,p.ay-m,p.by-m); y1=Math.max(y1,p.ay+m,p.by+m); }
    else if(p.t===2){ const m=Math.max(p.r1,p.r2); x0=Math.min(x0,p.ax-m); x1=Math.max(x1,p.ax+m); y0=Math.min(y0,p.by-p.r2*ct,p.ay-p.r1*ct); y1=Math.max(y1,p.ay+p.r1*ct,p.by+p.r2*ct); }
    else if(p.t===3){ const q=p.pts; for(let j=0;j<q.length;j+=2){ if(q[j]<x0) x0=q[j]; if(q[j]>x1) x1=q[j]; if(q[j+1]<y0) y0=q[j+1]; if(q[j+1]>y1) y1=q[j+1]; } }
    else if(p.t===4){ x0=Math.min(x0,p.sx-p.r1); x1=Math.max(x1,p.sx+p.r1); y0=Math.min(y0,p.sy-p.r1); y1=Math.max(y1,p.sy+p.r1); }
  }
  if(x0>x1){ x0=y0=-1; x1=y1=1; }
  const pad=1.2/res; x0-=pad; y0-=pad; x1+=pad; y1+=pad;
  const Wd=Math.max(1,Math.min(720,Math.ceil((x1-x0)*res))), Hd=Math.max(1,Math.min(720,Math.ceil((y1-y0)*res)));
  const cv=document.createElement('canvas'); cv.width=Wd; cv.height=Hd;
  const g=cv.getContext('2d'); g.setTransform(res,0,0,res,-x0*res,-y0*res);
  const q2=performance.now(); R.g=g; R.m=g.getTransform(); R.x=0; R.y=0; if(LOOK.re) rfBakeBegin(arg); t3End(); if(LOOK.re) rfBakeEnd(); R.g=ctx; const q3=performance.now();
  T3P.tB+=q1-q0; T3P.tC+=q2-q1; T3P.tE+=q3-q2;
  return {cv,ox:x0,oy:y0,w:Wd/res,h:Hd/res,fx:T3S.fx,top:T3S.top};
}
function t3pGet(key,face,k,build,arg,stale){
  const res=t3pRes(), kk=key+'@'+res+(LOOK.re?'r':LOOK.sb?'s':''), M=T3P.spr; let e=M.get(kk);
  if(e){ M.delete(kk); M.set(kk,e); T3P.hits++; return e; }
  const now=performance.now(); if(now-T3P.last>8) T3P.deadline=now+3.5; T3P.last=now;
  if(stale&&!T3P.force&&now>T3P.deadline) return stale;
  const tb=performance.now(); e=t3pBake(face,k,build,arg,res); T3P.bakeMs+=performance.now()-tb; M.set(kk,e); T3P.px+=e.cv.width*e.cv.height; T3P.bakes++;
  while((T3P.px>T3P.maxPx||M.size>T3P.maxN)&&M.size>1){ const it=M.entries().next().value; M.delete(it[0]); T3P.px-=it[1].cv.width*it[1].cv.height; }
  return e;
}
function t3pBucket(a){ return ((Math.round(a/TAU*32)%32)+32)%32; }
// live effects that ride on a sprite: glows, smoke, steam, frost sparkles
function t3pPuffs(x,y,t,n,col,k,dir){ for(let i=0;i<n;i++){ const f=(t*0.5+i/n)%1; ctx.fillStyle=`rgba(${col},${((1-f)*0.42).toFixed(3)})`; ctx.beginPath(); ctx.arc(x+(Math.sin(t*1.7+i*2.1)*1.1+dir*f*3)*k,y-f*9*k,k*(0.7+f*1.9),0,TAU); ctx.fill(); } }
function t3pFx(e,x,y,t,k,P){
  const fx=e.fx; if(!fx.length&&!(P&&P.o.frost)) return;
  const nightK=0.45+0.55*(1-daylight());
  for(let i=0;i<fx.length;i+=4){ const kd=fx[i], X=x+fx[i+1], Y=y+fx[i+2], v=fx[i+3];
    if(kd===1) pGlowAt(X,Y,(10+Math.sin(t*9)*0.8)*k,(0.5*nightK+0.15)*v);
    else if(kd===2) pGlowAt(X,Y,(7+Math.sin(t*11)*0.6)*k,(0.45*nightK+0.15)*v);
    else if(kd===3) pGlowAt(X,Y,(6+nightK*4)*k,(0.35+0.4*nightK)*v);
    else if(kd===4) t3pPuffs(X,Y,t,3,'210,210,215',k*0.8,0.5);
    else if(kd===5) t3pPuffs(X,Y,t,3,'235,235,240',k,0.8);
    else if(kd===6) t3pPuffs(X,Y,t,3,'245,240,235',k*0.8,0.2);
    else if(kd===8&&v>0) pGlowAt(X,Y,5*k,0.35+0.25*nightK);
    else if(kd===10) pGlowAt(X,Y,(9+Math.sin(t*7)*1.2)*k,0.55+0.25*nightK);
  }
  if(P&&P.o.frost&&!reduceMotion){ for(let j=0;j<2;j++){ const q=(t*0.7+j*0.5)%1, a=j*2.6+Math.floor(t*0.7+j*0.5)*1.7; ctx.globalAlpha=Math.sin(q*Math.PI)*0.9; pStar(ctx,x+Math.cos(a)*6*k,y-14*k+Math.sin(a)*6*k,1.4*k,'#eef8ff'); ctx.globalAlpha=1; } }
}
// a soft round shadow under the feet
function t3pShadow(x,y,k,a){ const R=9.5*k; ctx.globalAlpha*=a; ctx.drawImage(pShadow(),x-R,y-R*0.5,R*2,R); ctx.globalAlpha/=a; }

// ---------- drawing a person
const T3SS={sw:0,bob:0,ph:0,walk:false,ht:0,t:0,bow:0,extra:null,down:false};
function t3pBuildPerson(P){
  const S=T3S.S;
  if(S.down){ pqMove(18,0,T3S.Q.trx*0.95); pqPitch(-1.42); }
  pqPerson(P);
}
// draws P with its feet below (x,y); returns the sprite. ex: extra state for companions ({key,...})
function t3pDraw(n,P,face,ht,wk,ph,breath,x,y,ex,noShadow){
  const Q=pq3(P), fb=ex&&ex.down?t3pBucket(face):t3pBucket(face), hb=ex&&ex.down?0:clamp(Math.round(ht/(TAU/32)),-4,4);
  const wf=ex&&ex.down?-1:wk<0.35?-1:Math.floor(((ph%TAU)+TAU)%TAU/TAU*8)%8;
  let bf=0; if(P.hold2==='fiddle'&&!(ex&&ex.down)) bf=((Math.floor((n.t||0)*5.5/TAU*6)%6)+6)%6;
  const key=P.sig+'|'+fb+'|'+hb+'|'+wf+'|'+bf+(ex?ex.key:'');
  const S=T3SS; S.walk=wf>=0; S.ph=S.walk?(wf+0.5)/8*TAU:0; S.sw=S.walk?Math.sin(S.ph):0; S.bob=S.walk?(1-Math.abs(S.sw))*0.9:0;
  S.ht=hb*TAU/32; S.t=(n.t||0); S.bow=Math.sin(bf/6*TAU); S.extra=ex||null; S.down=!!(ex&&ex.down);
  T3S.P=P; T3S.Q=Q; T3S.S=S;
  const e=t3pGet(key,fb*TAU/32,Q.k,t3pBuildPerson,P,n._t3spr);
  n._t3spr=e;
  const fy=y+(S.down?0:6*Q.k);
  if(!noShadow) t3pShadow(x,fy,Q.k*(S.down?1.5:1),0.8);
  const sy=1+breath, sx=1+breath*0.4;
  ctx.drawImage(e.cv,x+e.ox*sx,fy+e.oy*sy,e.w*sx,e.h*sy);
  t3pFx(e,x,fy,n.t||0,Q.k,P);
  n._t3top=fy+e.top*sy; n._t3pp=true;
  return e;
}
// walking, breathing and the head turning toward Ash (the same rules the 2D people use)
function t3pMotion(n,P){
  const sp=n._px==null?0:Math.hypot(n.x-n._px,n.y-n._py); n._px=n.x; n._py=n.y;
  const mv=!!n.moving||(sp>0.12&&sp<30);
  if(mv) n._wph=(n._wph||0)+Math.max(Math.min(sp,4),0.55)*(P.old?0.34:0.42);
  n._wk=(n._wk||0)+((mv?1:0)-(n._wk||0))*0.2;
  let ht=0;
  if(!PLINE){
    const pl=typeof player!=='undefined'?player:null, d=pl&&!pl.dead?dist(n.x,n.y,pl.x,pl.y):1e9;
    if(d<170) ht=clamp(angDiff(n._vf!=null?n._vf:n.face,angTo(n.x,n.y,pl.x,pl.y)),-0.85,0.85);
    else if(!reduceMotion){ const u=((n.t||0)*0.09*P.fidget+P.seed)%1; ht=u<0.08?0.55:(u>0.42&&u<0.5)?-0.5:(u>0.7&&u<0.74)?0.25:0; if(P.fidget>1&&u>0.2&&u<0.26) ht=-0.8; if(P.fidget>1&&u>0.86&&u<0.9) ht=0.8; }
    n._ht=(n._ht||0)+(ht-(n._ht||0))*0.12;
  }else n._ht=n._ht||0;
}
// pDerive draws one random number fewer once a generic villager's skin is stored on its look, so the very first
// profile of a generic differs from every later one. Settle the look first, so each person always looks the same.
function t3pProfile(n){
  if(!n._pp){ const id=String(n.id||n.kind||'x'), c=CASTBY[id]; if(c&&c.generic&&c.look&&!c.look.skin){ pProfile(n); n._pp=null; } }
  return pProfile(n);
}
T3X.npc=function(n){
  if(n.kind==='goat'||n.turtle) return false;
  const P=t3pProfile(n);
  t3pMotion(n,P);
  const f=PLINE?n.face:t3Turn(n,n.face,11);
  const br=PLINE||reduceMotion?0:Math.sin((n.t||0)*2.3+P.seed*7)*0.014;
  if(PREC){ ctx.save(); ctx.translate(n.x,n.y); const m=ctx.getTransform(); n._sx=m.e/DPR; n._sy=m.f/DPR; ctx.restore(); }
  if(P.twin){
    const ox=-Math.sin(f)*7.6, oy=Math.cos(f)*7.6, ta=n._twa||(n._twa={t:0}), tb=n._twb||(n._twb={t:0}); ta.t=tb.t=n.t;
    const da=()=>t3pDraw(ta,P.ta,f,n._ht,n._wk,n._wph||0,br,n.x-ox,n.y-oy,null), db=()=>t3pDraw(tb,P.tb,f,-n._ht*0.6,n._wk,(n._wph||0)+1.4,-br,n.x+ox,n.y+oy,null);
    if(n.y-oy<=n.y+oy){ da(); db(); } else { db(); da(); }
    n._t3top=Math.min(ta._t3top,tb._t3top); n._t3pp=true;
  }else t3pDraw(n,P,f,n._ht,n._wk,n._wph||0,br,n.x,n.y,null);
  return true;
};

// ---------- the companions: Brisket (sword, shield, taunts) and Juniper (sling), standing or knocked down
T3C.brisket=function(c,v,down){
  v.look=brisketLook(); v.id='brisket'; v.kind='brisket';
  const P=pProfile(v);
  if(down){ const e=t3pDraw(v,P,0.3,0,0,0,0,c.x,c.y+2,{key:'|down',down:true,brisket:true,ba:1.2}); c._t3top=v._t3top; c._t3pp=true; return; }
  // a taunt just happened when the cooldown jumped back up
  if(c._ptc!=null&&c.tauntCd>c._ptc+2) c._tnT=G.time; c._ptc=c.tauntCd;
  const taunt=c._tnT!=null&&G.time-c._tnT<0.7;
  let f=c.face, ba=0.3; const sw=c.act==='swing'?1-clamp(c.actT/0.3,0,1):-1;
  if(sw>=0){ const e=smooth(sw); f=c.dir+lerp(-0.45,0.45,e); ba=lerp(1.5,-1.25,e); }
  v.face=f; t3pMotion(v,P); const vf=sw>=0||taunt?f:t3Turn(v,f,12); if(sw>=0||taunt){ v._vf=f; }
  const bq=Math.round(ba*6)/6, ex={key:'|b'+bq+(taunt?'t':'')+(sw>=0?'s':''),brisket:true,ba:bq,taunt,swing:sw>=0};
  const br=reduceMotion?0:Math.sin((v.t||0)*2.3+P.seed*7)*0.014;
  t3pDraw(v,P,vf,taunt?0:v._ht,v._wk,v._wph||0,br,c.x,c.y,ex);
  c._t3top=v._t3top; c._t3pp=true;
  if(taunt){ const k=(G.time-c._tnT)/0.7; if(k<0.35&&Math.floor(G.time*20)%2===0){ ctx.save(); ctx.strokeStyle='rgba(255,240,200,.85)'; ctx.lineWidth=1.6; for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*0.45; ctx.beginPath(); ctx.moveTo(c.x+Math.cos(a)*14,c.y-22+Math.sin(a)*14); ctx.lineTo(c.x+Math.cos(a)*20,c.y-22+Math.sin(a)*20); ctx.stroke(); } ctx.restore(); } }
  if(sw>0.15&&sw<0.98){ ctx.save(); ctx.translate(c.x,c.y-6); ctx.scale(1,T3.ct); ctx.rotate(c.dir); ctx.lineCap='round';
    ctx.strokeStyle=`rgba(255,250,235,${0.75*(1-sw)})`; ctx.lineWidth=3.2; ctx.beginPath(); ctx.arc(0,0,c.r+24,lerp(1.1,-1.0,sw),1.1); ctx.stroke();
    ctx.strokeStyle=`rgba(255,220,160,${0.4*(1-sw)})`; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(0,0,c.r+19,lerp(0.95,-0.85,sw),0.95); ctx.stroke(); ctx.restore(); }
};
T3C.juniper=function(c,v,down){
  v.look=SPECIAL.juniper.look; v.id='juniper'; v.kind='juniper';
  const P=pProfile(v);
  if(down){ t3pDraw(v,P,0.3,0,0,0,0,c.x,c.y+2,{key:'|down',down:true}); c._t3top=v._t3top; c._t3pp=true; return; }
  const whirl=c.act==='sling', f=c.face; v.face=f; t3pMotion(v,P);
  const vf=t3Turn(v,f,12), br=reduceMotion?0:Math.sin((v.t||0)*2.3+P.seed*7)*0.014;
  const e=t3pDraw(v,P,vf,whirl?0:v._ht,v._wk,v._wph||0,br,c.x,c.y,{key:whirl?'|sw':'|si',sling:whirl?'whirl':'idle'});
  c._t3top=v._t3top; c._t3pp=true;
  if(whirl){ const fx=e.fx; let hx=c.x, hy=c.y-24; for(let i=0;i<fx.length;i+=4) if(fx[i]===9){ hx=c.x+fx[i+1]; hy=c.y+6*pq3(P).k+fx[i+2]; }
    const a=G.time*30, px=hx+Math.cos(a)*7.5, py=hy+Math.sin(a)*7.5*T3.ct;
    ctx.save(); ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(hx,hy,7.5,7.5*T3.ct,0,0,TAU); ctx.stroke();
    ctx.strokeStyle='#6a4a2a'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(px,py); ctx.stroke();
    ell(px,py,1.9,1.5,'#7a5432'); ell(px-0.3,py-0.3,1.0,0.8,'#9a9288'); ctx.restore(); }
  if(c.point){ const a=angTo(c.x,c.y,c.point.x,c.point.y); ctx.save(); ctx.translate(c.x+Math.cos(a)*20,c.y+Math.sin(a)*20); ctx.rotate(a); ctx.globalAlpha*=0.5+0.4*Math.sin(G.time*8); ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(-3,-4.5); ctx.lineTo(-1,0); ctx.lineTo(-3,4.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
};

// ---------- spirits: the five Wardens and Ember, glowing see-through figures
const T3WARD={hollow:'iska',ash:'bram',crag:'oriel',mire:'sedge',frost:'tove'};
const T3SPIRIT={
  iska:{hue:'#ffd696',look:{outfit:'robe',hood:'#ffcf86',hold:'staff'}},
  bram:{hue:'#ffbe78',look:{outfit:'robe',build:'big',beard:'big',hairdo:'bald',hold:'hammer'}},
  oriel:{hue:'#ffe2aa',look:{outfit:'robe',hairdo:'long',hold2:'drake',cape:'#ffd29a'}},
  sedge:{hue:'#dce6a0',look:{outfit:'robe',hairdo:'curly',hold:'reed',hat:'rain'}},
  tove:{hue:'#d2e6ff',look:{outfit:'fur',hat:'fur',hold:'spear',scarf:'#e6f0ff',hairdo:'braids'}},
  ember:{hue:'#ffb878',look:{outfit:'robe',hairdo:'long',hold2:'flame',horns:true,cape:'#ffa060'}}
};
function t3pSpiritP(id){
  const D=T3SPIRIT[id]||T3SPIRIT.iska; if(D.P) return D.P;
  const h=D.hue, look=Object.assign({skin:shd(h,0.35),hair:shd(h,-0.08),shirt:shd(h,0.12),low:h,trim:shd(h,0.45),hatc:shd(h,0.05),legs:shd(h,-0.1),shoe:shd(h,-0.2),beardc:shd(h,0.2)},D.look);
  for(const k of ['hood','cape','scarf']) if(look[k]) look[k]=shd(h,k==='cape'?-0.12:0.05);
  D.P=pResolve('spirit_'+id,look,false,null); D.P.spirit=id; return D.P;
}
const T3SPV={t:0};
function t3pSpiritDraw(id,x,y,alpha,face,t){
  const P=t3pSpiritP(id), Q=pq3(P), fb=t3pBucket(face), wf=Math.floor(((t*0.8)%1)*4);
  const S=T3SS; S.walk=false; S.ph=0; S.sw=0; S.bob=0; S.ht=0; S.t=t; S.bow=0; S.extra=null; S.down=false;
  T3S.P=P; T3S.Q=Q; T3S.S=S;
  const e=t3pGet('spirit|'+id+'|'+fb,fb*TAU/32,Q.k,t3pBuildPerson,P,null);
  const z=10+Math.sin(t*2)*3, fy=y+20;
  const zy=fy-z*T3.st;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=alpha*0.24; ctx.drawImage(pGlow(),x-40,zy-20-40,80,80);
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=alpha*0.6; ctx.drawImage(e.cv,x+e.ox,zy+e.oy,e.w,e.h);
  ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=alpha*0.22; ctx.drawImage(e.cv,x+e.ox,zy+e.oy,e.w,e.h);
  ctx.restore();
  ctx.save(); ctx.globalAlpha*=alpha*0.25; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(x,fy,9,4,0,0,TAU); ctx.fill(); ctx.restore();
  t3pFx(e,x,fy-z*T3.st,t,Q.k,null);
}
T3X.spirit=function(sp){
  const k=sp.on?clamp(sp.t/0.8,0,1):clamp(1-(sp.fade||0)/1.5,0,1); if(k<=0) return;
  const id=sp.id==='ember'?'ember':(T3WARD[sp.id]||sp.id);
  const want=player?angTo(sp.x,sp.y,player.x,player.y):Math.PI/2, f=t3Turn(sp,want,3);
  t3pSpiritDraw(id,sp.x,sp.y,k,f,G.time);
};
// v11 (STORY_PLAN 3.4): in Acts III and IV some of Ember's flames are handed over by somebody else, so her spirit only
// floats over the shrines where she is the one who speaks. The others show who does: Brother Pennant on his kite
// (Skyreach, Wind Riding), King Grumblehorn snoring under the drum stone (Stonehorn, Ground Pound), Sir Kipper on Lady
// Bubbles beside the flame (Drowned Lumen, Dive) and the worm king's voice coming up through the sand (the Burrows).
const T3KEEP={f_sky:'pennant',f_deep:'grumblehorn',m_lumen:'kipper',m_burrows:'gravelgut'};
function t3pKeeper(){ const id=AREA&&AREA.def&&AREA.def.id; if(!id) return null; return T3KEEP[typeof dunRoot==='function'?dunRoot(id):id]||null; }
const T3KN={};
function t3pKeeperNpc(id,x,y,face){ const n=T3KN[id]||(T3KN[id]={id,t:0,face}); n.x=x; n.y=y; n.t=G.time; n.face=face; n._px=x; n._py=y; return n; }
// a person from the cast at n.x,n.y (3D or classic), raised by lift (no ground shadow then); dx,dy move the drawing only
function t3pKeeperDraw(n,lift,dx,dy){
  ctx.save(); ctx.translate(dx||0,(dy||0)-lift);
  if(T3.on){ const P=t3pProfile(n), f=t3Turn(n,n.face,4); t3pDraw(n,P,f,0,0,0,reduceMotion?0:Math.sin(G.time*2.1)*0.012,n.x,n.y,null,lift>0); }
  else drawNPC(n);
  ctx.restore();
}
function t3pKeepPennant(o,t,sx,sy){
  const sw=reduceMotion?0:Math.sin(t*0.9)*12, bob=reduceMotion?0:Math.sin(t*1.7)*4, px=sx+sw, kx=sx+sw*1.3+8, ky=sy-176+bob, tilt=reduceMotion?0:Math.sin(t*1.3)*0.12;
  ctx.save(); ctx.lineCap='round';
  // the kite string runs off toward the open window, slack in the wind
  ctx.strokeStyle='rgba(110,70,36,.55)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(kx,ky+4); ctx.quadraticCurveTo(kx+110,ky+70,kx+260,ky-40); ctx.stroke();
  // the tail: three ribbon bows on a line
  ctx.strokeStyle='rgba(90,40,16,.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(kx,ky+26);
  for(let i=1;i<=4;i++) ctx.lineTo(kx-8*i+Math.sin(t*3+i)*5,ky+26+12*i); ctx.stroke();
  for(let i=1;i<=3;i++){ const bx=kx-8*i+Math.sin(t*3+i)*5, by=ky+26+12*i; ctx.fillStyle=i%2?'#c83a2a':'#f4d060';
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx-6,by-3); ctx.lineTo(bx-6,by+3); ctx.closePath(); ctx.moveTo(bx,by); ctx.lineTo(bx+6,by-3); ctx.lineTo(bx+6,by+3); ctx.closePath(); ctx.fill(); }
  // the kite: a diamond in the Wind Monks' orange, with red spars
  ctx.save(); ctx.translate(kx,ky); ctx.rotate(tilt);
  ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.moveTo(2,-26); ctx.lineTo(24,-4); ctx.lineTo(2,30); ctx.lineTo(-20,-4); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f0b040'; ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(22,-6); ctx.lineTo(0,28); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#d08420'; ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(-22,-6); ctx.lineTo(0,28); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff2c8'; ctx.beginPath(); ctx.arc(0,-6,6,0,TAU); ctx.fill(); ctx.fillStyle='#c83a2a'; ctx.beginPath(); ctx.arc(0,-6,3,0,TAU); ctx.fill();
  ctx.strokeStyle='#a83020'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(0,28); ctx.moveTo(-22,-6); ctx.lineTo(22,-6); ctx.stroke();
  ctx.strokeStyle='#5a2a10'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(22,-6); ctx.lineTo(0,28); ctx.lineTo(-22,-6); ctx.closePath(); ctx.stroke();
  ctx.restore();
  // two ropes from the kite to his sash: he lives on it
  const hy=sy-96+bob;
  ctx.strokeStyle='rgba(90,50,22,.8)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(kx-10,ky+4); ctx.lineTo(px-5,hy); ctx.moveTo(kx+10,ky+4); ctx.lineTo(px+5,hy); ctx.stroke();
  ctx.restore();
  // then Brother Pennant himself, feet dangling over the flame
  t3pKeeperDraw(t3pKeeperNpc('f_pennant',sx,sy-26,Math.PI/2),46,sw,bob);
}
// King Grumblehorn is asleep under the floor: every snore puffs dust off the drum stone and a Z drifts up
function t3pKeepSnore(o,t,cx,cy){
  if(G.bossDone&&G.bossDone.f_grumblehorn) return;
  const per=3.4, ph=(t%per)/per;
  if(ph<0.04&&!(o._sn>G.time)){ o._sn=G.time+per*0.6; emit(cx+rand(-60,60),cy+rand(-10,20),14,{col:'200,180,150',glow:false,ang:-Math.PI/2,spread:2.6,smin:20,smax:70,lmin:.5,lmax:1.1,zmin:2,zmax:4,grow:5,drag:1.2}); }
  ctx.save(); ctx.textAlign='center'; ctx.lineJoin='round';
  for(let i=0;i<3;i++){ const f=((t/per)+i/3)%1, s=11+f*12, x=cx+46+f*26+Math.sin(f*7+i)*5, y=cy+6-f*86;
    ctx.globalAlpha=Math.min(1,f*5)*(1-f)*0.9; ctx.font=`800 ${s.toFixed(1)}px ${UIF}`;
    ctx.strokeStyle='rgba(60,40,24,.75)'; ctx.lineWidth=3; ctx.strokeText('Z',x,y); ctx.fillStyle='#f6ecd8'; ctx.fillText('Z',x,y); }
  ctx.restore();
}
// the worm king's voice comes up through the sand: slow rings ripple out from the flame, grains hop
function t3pKeepSand(o,t,cx,y0){
  if(G.bossDone&&G.bossDone.m_gravelgut) return;
  const cy=y0+6;
  ctx.save(); ctx.lineWidth=2.2; ctx.setLineDash([10,7]);
  for(let i=0;i<3;i++){ const f=((t*0.32)+i/3)%1, rx=140+f*130; ctx.lineDashOffset=-t*12-i*9;
    ctx.strokeStyle=`rgba(120,78,30,${(0.42*(1-f)*Math.min(1,f*6)).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(cx,cy,rx,rx*0.48,0,0,TAU); ctx.stroke(); }
  ctx.restore();
  if(Math.random()<0.25){ const a=rand(0,TAU), r=rand(140,250); emit(cx+Math.cos(a)*r,cy+Math.sin(a)*r*0.48,2,{col:'214,176,110',glow:false,ang:-Math.PI/2,spread:0.8,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1,zmax:2}); }
}
// Sir Kipper keeps watch beside the flame on Lady Bubbles, his seahorse, bobbing in the water
function t3pKeepKipper(o,t,sx,sy){
  // (on the flame's left, where the rooms have open floor; she faces the flame)
  const x=sx-104, y=sy+16, bob=reduceMotion?0:Math.sin(t*1.9)*3;
  ctx.save(); ctx.translate(x,y+bob); ctx.scale(-1,1);
  ctx.fillStyle='rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(0,26-bob,20,6,0,0,TAU); ctx.fill();
  // Lady Bubbles: a coral seahorse facing the flame, curled tail, a dorsal fin that flutters
  const C='#f08a5a', D='#c05a3a', L='#ffc49a';
  ctx.strokeStyle=D; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(4,6); ctx.quadraticCurveTo(12,22,2,26); ctx.quadraticCurveTo(-8,28,-6,20); ctx.quadraticCurveTo(-4,15,1,17); ctx.stroke();
  ctx.fillStyle=C; ctx.beginPath(); ctx.ellipse(2,-6,11,16,-0.15,0,TAU); ctx.fill();
  ctx.fillStyle=L; ctx.beginPath(); ctx.ellipse(-3,-4,5,11,-0.15,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,220,190,.8)'; const fl=reduceMotion?0:Math.sin(t*9)*2; ctx.beginPath(); ctx.moveTo(11,-12); ctx.quadraticCurveTo(20+fl,-6,12,2); ctx.closePath(); ctx.fill();
  ctx.fillStyle=C; ctx.beginPath(); ctx.ellipse(-6,-20,7,9,0.4,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-11,-31,8,7,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-15,-33); ctx.lineTo(-29,-30); ctx.lineTo(-29,-26); ctx.lineTo(-15,-27); ctx.closePath(); ctx.fill();
  ctx.fillStyle=D; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(-9+i*2.4,-39+i*1.8,2.2,0,TAU); ctx.fill(); }
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-13,-32,2.6,0,TAU); ctx.fill(); ctx.fillStyle='#2a1208'; ctx.beginPath(); ctx.arc(-13.6,-32,1.4,0,TAU); ctx.fill();
  ctx.restore();
  if(Math.random()<0.04) emit(x+18,y-20,1,{col:'200,235,255',ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.8,lmax:1.4,zmin:1.4,zmax:2.4,rise:20});
  // and the knight in the saddle, looking at whoever has come for the flame
  const want=player?angTo(x,y,player.x,player.y):Math.PI/2;
  t3pKeeperDraw(t3pKeeperNpc('m_kipper',x-5,y-2,want),14,0,bob);
}
const T3KEEPDRAW={pennant:t3pKeepPennant,grumblehorn:t3pKeepSnore,kipper:t3pKeepKipper,gravelgut:t3pKeepSand};
// the flame's own dais in the spirit's room (the spirit floats at the room's middle, which is not always the dais)
function t3pShrineAt(o){ if(o._shr===undefined){ const q=AREA&&AREA.objs.find(v=>v.k==='tv'&&v.kind==='shrine'&&v.ref&&v.ref.room===o.room); o._shr=q?{x:q.x,y:q.y}:null; } return o._shr||{x:o.x,y:o.y+74}; }
// Ember's spirit over her shrine in each Trial (and the keepers above, where the flame is somebody else's to give)
if(typeof FL!=='undefined'&&FL.tspirit){ const old=FL.tspirit; FL.tspirit=(o,t)=>{
  const kp=t3pKeeper(); if(kp&&T3KEEPDRAW[kp]){ try{ const s=t3pShrineAt(o); T3KEEPDRAW[kp](o,t,s.x,s.y); }catch(e){ console.error(e); } return; }
  if(!T3.on) return old(o,t);
  const id=AREA&&AREA.def.id, gifted=id&&TRIALS[id]&&hasAbil(TRIALS[id].abil), a=gifted?0.45:0.9;
  const want=player?angTo(o.x,o.y,player.x,player.y):Math.PI/2, f=t3Turn(o,want,2.5);
  ctx.save(); ctx.translate(0,Math.sin(t*1.6)*3); t3pSpiritDraw('ember',o.x,o.y,a,f,t); ctx.restore();
  if(Math.random()<0.2) emit(o.x+rand(-12,12),o.y+rand(-10,20),1,{col:'255,210,150',ang:-Math.PI/2,spread:0.5,smin:10,smax:40,lmin:.6,lmax:1.1,zmin:1.2,zmax:2.4,rise:16});
}; }

// ---------- hide and seek: a found kid pops out from behind the hiding spot as a little 3D kid
const T3KIDS=[{shirt:'#c84a3a',hair:'#2a1a10',hairdo:'spiky',skin:'#c8946c',outfit:'tunic'},{shirt:'#3a7ab0',hair:'#e8c060',hairdo:'pigtails',skin:'#f2c8a6',outfit:'dress',low:'#2a5a8a'},{shirt:'#5a8a3a',hair:'#8a3a1a',hairdo:'curly',skin:'#e0ae88',outfit:'overalls',low:'#3e5a7a'},{shirt:'#e0a030',hair:'#1a1a1a',hairdo:'pony',skin:'#7c4c30',outfit:'tunic',hat:'cap',hatc:'#3a6a9a'}];
if(typeof drawSeekProp==='function'){ const old=drawSeekProp; drawSeekProp=function(s,t){
  if(!T3.on||!s.found) return old(s,t);
  const x=s.x, y=s.y, i=Math.max(0,G.mini&&G.mini.spots?G.mini.spots.indexOf(s):0)%T3KIDS.length;
  if(!s._kid){ s._kid={id:'seekkid'+i,t:0,face:Math.PI/2,x,y}; s._kidP=pResolve('seekkid'+i,Object.assign({},T3KIDS[i]),true,null); }
  const n=s._kid; n.t=t; n.x=x; n.y=y;
  ctx.save(); ctx.translate(0,-Math.abs(Math.sin(t*8))*3); t3pDraw(n,s._kidP,Math.PI/2+Math.sin(t*3)*0.5,0,0,0,0,x,y-2,null); ctx.restore();
  if(s.k==='barrel'){ drawPot(x+16,y,'barrel'); }
  else if(s.k==='bush'){ ctx.fillStyle='#2f5a1d'; ctx.beginPath(); ctx.arc(x+18,y,18,0,TAU); ctx.fill(); ctx.fillStyle='#4d7f2c'; ctx.beginPath(); ctx.arc(x-4+18,y-4,12,0,TAU); ctx.fill(); }
  else if(s.k==='cart'){ ctx.fillStyle='#6a4a2a'; ctx.fillRect(x-20+20,y-12,40,24); ctx.fillStyle='#3a2a1a'; ctx.beginPath(); ctx.arc(x-12+20,y+12,6,0,TAU); ctx.arc(x+12+20,y+12,6,0,TAU); ctx.fill(); }
  else { for(const [dx,dy] of [[-10,0],[10,0],[0,-14]]){ ctx.fillStyle='#8a6a42'; ctx.fillRect(x+dx-10+20,y+dy-10,20,20); ctx.strokeStyle='#5a4228'; ctx.lineWidth=2; ctx.strokeRect(x+dx-10+20,y+dy-10,20,20); } }
}; }

// ---------- debug: a sheet of people at several facings (returns a PNG data URL)
function t3pSheet(o){
  o=o||{}; const z=o.zoom||2, LK=o.looks||null, ids=LK?LK.map((L,i)=>'tlook'+i):o.ids||CAST.filter(c=>!c.generic).map(c=>c.id).concat(['juniper','morrow','sal','marlo','minnow']);
  const angs=o.angles||[Math.PI/2,Math.PI/4,0,-Math.PI/4,-Math.PI/2,Math.PI*0.75,Math.PI], walk=o.walk||0, cw=o.cw||40, ch=o.ch||56, lab=o.label!==false;
  const cols=angs.length, rows=ids.length, Wc=Math.ceil(cols*cw*z+(lab?70*z:0)), Hc=Math.ceil(rows*ch*z), ow=cvs.width, oh=cvs.height;
  cvs.width=Wc; cvs.height=Hc; PLINE=true; T3P.force=true;
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  const bgs=o.bg?[o.bg]:['#5f7a3e','#6a8a4a'];
  for(let r=0;r<rows;r++){ ctx.fillStyle=bgs[r%bgs.length]; ctx.fillRect(0,r*ch*z,Wc,ch*z); }
  ctx.setTransform(z,0,0,z,0,0);
  ids.forEach((id,r)=>{ const c=LK?{id,name:LK[r].name||LK[r].hat||LK[r].hold||LK[r].hold2||id,look:LK[r],kid:!!LK[r].kid}:CASTBY[id]||SPECIAL[id]; if(!c) return;
    if(lab){ ctx.font=`600 7px ${UIF}`; ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.fillText(String(c.name||id).replace(/,.*$/,'').slice(0,16),3,r*ch+ch/2); }
    angs.forEach((a,i)=>{ const x=(lab?70:0)+(i+0.5)*cw, y=r*ch+ch*0.62; const n=mkNPC(c,x,y); n.face=a; n.t=1.2+r*0.37; if(walk){ n.moving=true; n._wk=1; n._wph=walk+(o.phStep||0)*i; } if(o.ht) n._ht=o.ht;
      const P=LK?(c._P||(c._P=pResolve(id,Object.assign({},LK[r]),!!LK[r].kid,null))):t3pProfile(n); const br=0; if(P.twin){ const ox=-Math.sin(a)*7.6, oy=Math.cos(a)*7.6; t3pDraw(n,P.ta,a,n._ht||0,walk?1:0,walk,br,x-ox,y-oy,null); t3pDraw({t:n.t},P.tb,a,0,walk?1:0,walk+1.4,br,x+ox,y+oy,null); } else t3pDraw(n,P,a,n._ht||0,walk?1:0,walk+(o.phStep||0)*i,br,x,y,null); }); });
  const url=cvs.toDataURL('image/png');
  PLINE=false; T3P.force=false; cvs.width=ow; cvs.height=oh; return url;
}
// debug: draw any object through a drawer at several facings (companions, spirits)
function t3pSheetFn(fn,o){
  o=o||{}; const z=o.zoom||2, n=o.n||8, cw=o.cw||56, ch=o.ch||64, rows=o.rows||1, Wc=n*cw*z, Hc=rows*ch*z, ow=cvs.width, oh=cvs.height;
  cvs.width=Wc; cvs.height=Hc; T3P.force=true; ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle=o.bg||'#5f7a3e'; ctx.fillRect(0,0,Wc,Hc); ctx.setTransform(z,0,0,z,0,0);
  for(let r=0;r<rows;r++) for(let i=0;i<n;i++) fn(i,r,(i+0.5)*cw,r*ch+ch*0.6);
  const url=cvs.toDataURL('image/png'); T3P.force=false; cvs.width=ow; cvs.height=oh; return url;
}
window.__ebX=Object.assign(window.__ebX||{},{t3pSheet,t3pSheetFn,t3pStats:()=>({n:T3P.spr.size,px:T3P.px,bakes:T3P.bakes,bakeMs:Math.round(T3P.bakeMs),hits:T3P.hits,parts:T3P.parts,build:Math.round(T3P.tB),canvas:Math.round(T3P.tC),draw:Math.round(T3P.tE)}),t3pClear:()=>{ T3P.spr.clear(); T3P.px=0; },
  t3pForce(v){ T3P.force=!!v; },
  t3pDrawComp(id,x,y,face,state){ const c=Object.assign({id,x,y,face,dir:face,r:10,t:G.time,act:null,actT:0,tauntCd:5,down:0},state||{}); const v={id,kind:id,x,y,face,t:G.time}; (T3C[id])(c,v,c.down>0); },
  t3pSpirit(id,x,y,face,t){ t3pSpiritDraw(id,x,y,1,face,t||1); }});
