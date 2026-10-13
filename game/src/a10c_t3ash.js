
// ================= Ash as a 3D toy figure (T3X.ash takes over drawPlayer while the 3D characters are on)
// Built every frame from the toy engine's shapes (a3e_toy3d.js). The figure is posed in "rig space" (x forward, y to his
// right, z up, feet at the origin, about 38 tall) and goes through a little transform stack (AR) on its way to the engine,
// so the whole body can tumble in a roll, spin in a Whirlwind, lean into a sprint and bank in flight, while the head, the
// weapons and the wings carry their own local frames. Things that lie on the ground (swing arcs, the spear's streak) stay 2D.

// ---------- the transform stack: point = m * v + t (m is 3x3, row major)
const AR={m:[1,0,0,0,1,0,0,0,1],t:[0,0,0],st:[],n:0};
function arReset(){ const m=AR.m; m[0]=m[4]=m[8]=1; m[1]=m[2]=m[3]=m[5]=m[6]=m[7]=0; AR.t[0]=AR.t[1]=AR.t[2]=0; AR.n=0; }
function arPush(){ let s=AR.st[AR.n]; if(!s){ s=new Array(12); AR.st[AR.n]=s; } const m=AR.m; for(let i=0;i<9;i++) s[i]=m[i]; s[9]=AR.t[0]; s[10]=AR.t[1]; s[11]=AR.t[2]; AR.n++; }
function arPop(){ const s=AR.st[--AR.n], m=AR.m; for(let i=0;i<9;i++) m[i]=s[i]; AR.t[0]=s[9]; AR.t[1]=s[10]; AR.t[2]=s[11]; }
function arMove(x,y,z){ const m=AR.m, t=AR.t; t[0]+=m[0]*x+m[1]*y+m[2]*z; t[1]+=m[3]*x+m[4]*y+m[5]*z; t[2]+=m[6]*x+m[7]*y+m[8]*z; }
function arMul(a,b,c,d,e,f,g,h,i){ const m=AR.m; for(let r=0;r<9;r+=3){ const x=m[r], y=m[r+1], z=m[r+2]; m[r]=x*a+y*d+z*g; m[r+1]=x*b+y*e+z*h; m[r+2]=x*c+y*f+z*i; } }
function arPitch(a){ if(!a) return; const c=Math.cos(a), s=Math.sin(a); arMul(c,0,s, 0,1,0, -s,0,c); }   // the front tips down
function arYaw(a){ if(!a) return; const c=Math.cos(a), s=Math.sin(a); arMul(c,-s,0, s,c,0, 0,0,1); }     // turns toward his right
function arRoll(a){ if(!a) return; const c=Math.cos(a), s=Math.sin(a); arMul(1,0,0, 0,c,-s, 0,s,c); }    // lifts his right side
function arP(x,y,z,o){ const m=AR.m, t=AR.t; o[0]=m[0]*x+m[1]*y+m[2]*z+t[0]; o[1]=m[3]*x+m[4]*y+m[5]*z+t[1]; o[2]=m[6]*x+m[7]*y+m[8]*z+t[2]; return o; }
// an ellipsoid's own pitch, yaw and roll, composed with the stack and turned back into the engine's angles
const _ao={pitch:0,yaw:0,roll:0,bias:0};
function arO(o){
  let p=0,y=0,r=0; if(o){ p=o.pitch||0; y=o.yaw||0; r=o.roll||0; }
  const m=AR.m, cy=Math.cos(y), sy=Math.sin(y), cp=Math.cos(p), sp=Math.sin(p), cr=Math.cos(r), sr=Math.sin(r);
  const R00=cy*cp, R01=cy*sp*sr-sy*cr, R02=cy*sp*cr+sy*sr, R10=sy*cp, R11=sy*sp*sr+cy*cr, R12=sy*sp*cr-cy*sr, R20=-sp, R21=cp*sr, R22=cp*cr;
  const M00=m[0]*R00+m[1]*R10+m[2]*R20, M10=m[3]*R00+m[4]*R10+m[5]*R20, M20=m[6]*R00+m[7]*R10+m[8]*R20;
  const M21=m[6]*R01+m[7]*R11+m[8]*R21, M22=m[6]*R02+m[7]*R12+m[8]*R22;
  _ao.bias=o&&o.bias||0;
  if(Math.abs(M20)>0.99999){ const M01=m[0]*R01+m[1]*R11+m[2]*R21, M11=m[3]*R01+m[4]*R11+m[5]*R21; _ao.yaw=0; _ao.pitch=M20<0?Math.PI/2:-Math.PI/2; _ao.roll=M20<0?Math.atan2(M01,M11):Math.atan2(-M01,M11); return _ao; }
  _ao.pitch=Math.asin(-M20); _ao.roll=Math.atan2(M21,M22); _ao.yaw=Math.atan2(M10,M00); return _ao;
}
// the engine's shapes, through the stack
const _q1=[0,0,0], _q2=[0,0,0];
function aE(x,y,z,rx,ry,rz,col,o){ arP(x,y,z,_q1); return t3Ell(_q1[0],_q1[1],_q1[2],rx,ry,rz,col,arO(o)); }
function aB(x,y,z,r,col,bias){ arP(x,y,z,_q1); _ao.pitch=_ao.yaw=_ao.roll=0; _ao.bias=bias||0; return t3Ell(_q1[0],_q1[1],_q1[2],r,r,r,col,_ao); }
function aL(ax,ay,az,bx,by,bz,r,col,r2,bias){ arP(ax,ay,az,_q1); arP(bx,by,bz,_q2); return t3Limb(_q1[0],_q1[1],_q1[2],_q2[0],_q2[1],_q2[2],r,col,r2,bias); }
function aC(ax,ay,az,bx,by,bz,r,col,bias){ arP(ax,ay,az,_q1); arP(bx,by,bz,_q2); return t3Cone(_q1[0],_q1[1],_q1[2],_q2[0],_q2[1],_q2[2],r,col,bias); }
function aN(ax,ay,az,bx,by,bz,w,col,bias){ arP(ax,ay,az,_q1); arP(bx,by,bz,_q2); return t3Line(_q1[0],_q1[1],_q1[2],_q2[0],_q2[1],_q2[2],w,col,bias); }
function aD(x,y,z,r,col,bias){ arP(x,y,z,_q1); return t3Dot(_q1[0],_q1[1],_q1[2],r,col,bias); }
function aCyl(x,y,z,r1,r2,h,col,o){ arP(x,y,z,_q1); return t3Cyl(_q1[0],_q1[1],_q1[2],r1,r2,h,col,o); }
const APool=[], AView=[]; for(let i=0;i<20;i++) APool.push([0,0,0]); for(let n=0;n<=20;n++) AView.push(APool.slice(0,n));
function aPt(i,x,y,z){ arP(x,y,z,APool[i]); }
function aPoly(n,col,o){ return t3Poly(AView[n],col,o); }
// little vector helpers (vectors are reused arrays)
function vSet(o,x,y,z){ o[0]=x; o[1]=y; o[2]=z; return o; }
function vCopy(o,a){ o[0]=a[0]; o[1]=a[1]; o[2]=a[2]; return o; }
function vDir(o,yaw,el){ const c=Math.cos(el); o[0]=c*Math.cos(yaw); o[1]=c*Math.sin(yaw); o[2]=Math.sin(el); return o; }
function vPerp(o,yaw){ o[0]=-Math.sin(yaw); o[1]=Math.cos(yaw); o[2]=0; return o; }
function vNorm(o){ const l=Math.hypot(o[0],o[1],o[2])||1; o[0]/=l; o[1]/=l; o[2]/=l; return o; }
function vLerp(o,a,b,k){ o[0]=lerp(a[0],b[0],k); o[1]=lerp(a[1],b[1],k); o[2]=lerp(a[2],b[2],k); return o; }
// a limb along u from h+u*a0 to h+u*a1, and a point h+u*a+v*b
function aSeg(h,u,a0,a1,r,col,r2,bias){ return aL(h[0]+u[0]*a0,h[1]+u[1]*a0,h[2]+u[2]*a0,h[0]+u[0]*a1,h[1]+u[1]*a1,h[2]+u[2]*a1,r,col,r2,bias); }
function aPtUV(i,h,u,a,v,b){ aPt(i,h[0]+u[0]*a+v[0]*b,h[1]+u[1]*a+v[1]*b,h[2]+u[2]*a+v[2]*b); }
// marks: body-space points remembered while building, projected to the screen afterwards (glows, flames, rings)
const AM={}; for(const k of ['snout','jet','ham','bA','bB','hand','eyeL','eyeR','tip','head','mouth']){ AM[k]=[0,0,0]; AM[k].on=false; }
function aMark(k,x,y,z){ const a=AM[k]; arP(x,y,z,a); a.on=true; }
const AWE=[[],[]]; for(const w of AWE) for(let i=0;i<10;i++) w.push([0,0,0]);
const AHS=[]; for(let i=0;i<8;i++) AHS.push([0,0,0]); AHS.n=0;
const _s1=[0,0,0], _s2=[0,0,0], _s3=[0,0,0];
function aScr(a,out){ t3P(a[0],a[1],a[2],out); out[0]+=T3R.x; out[1]+=T3R.y; return out; }
// glow sprites for any context (the sheet draws into its own canvas)
const AGLOW=new Map();
function aGlow(g,x,y,r,col,a){
  if(!(r>0)||!(a>0)) return;
  let sp=AGLOW.get(col); if(!sp){ sp=mkCanvas(64,64); const c=sp.getContext('2d'), gr=c.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,`rgba(${col},1)`); gr.addColorStop(0.45,`rgba(${col},.45)`); gr.addColorStop(1,`rgba(${col},0)`); c.fillStyle=gr; c.fillRect(0,0,64,64); AGLOW.set(col,sp); }
  const pa=g.globalAlpha, pc=g.globalCompositeOperation; g.globalCompositeOperation='lighter'; g.globalAlpha=pa*Math.min(1,a); g.drawImage(sp,x-r,y-r,r*2,r*2); g.globalAlpha=pa; g.globalCompositeOperation=pc;
}
function aSweep(g,R,lo,hi,col,inner){ const r0=R*(inner||0.3), gr=g.createRadialGradient(0,0,r0,0,0,R); gr.addColorStop(0,'rgba(255,240,220,0)'); gr.addColorStop(0.8,col); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.beginPath(); g.arc(0,0,R,lo,hi); g.arc(0,0,r0,hi,lo,true); g.closePath(); g.fill(); }

// ---------- palette (the old sprite, the dialogue portrait), and an ember tint for the roll's afterimages
const ASHP={skin:'#9a3420',dark:'#5e1a10',head:'#b0402a',lite:'#e2694a',snout:'#c8573a',chest:'#d06a44',horn:'#efe0bf',horn2:'#d2c29e',horn3:'#a8987a',
  eye:'#ffd34d',pupil:'#2a0a02',brow:'#6e2214',cloak:'#7a2a20',cloakIn:'#4a1410',cloakE:'#2e0a06',vest:'#9a7048',vestD:'#6a4a2c',belt:'#4a2c18',gold:'#d8a840',
  steel:'#b8c0ca',boot:'#4a3020',claw:'#efe2c4',mem:'#c8502e',memIn:'#94341e',memE:'#3e0e08',bone:'#3a0e08'};
const ASHG={};
{ const em=hexRGB('#ff8044'); for(const k in ASHP){ const c=mixRGB(hexRGB(ASHP[k]),em,0.6); ASHG[k]='#'+c.map(q=>clamp(Math.round(q),0,255).toString(16).padStart(2,'0')).join(''); } }
const HZ=10, ASH_ARM=11.6;
let AFINE=true;   // small details (nostrils, smile, bracers, cloak lining...) only when Ash is big enough on screen to see them

// ---------- weapons: where the hands go, and the weapon itself
const AW={hR:[0,0,0],hL:[0,0,0],uR:[1,0,0],vR:[0,1,0],uL:[1,0,0],vL:[0,1,0],P:[0,0,0],useR:false,useL:false,twist:0,lean:0,gyaw:0,len:20,lenL:10,fin:false,psi:0,glow:0,fall:-1,k:0,snap:0,arrow:false,out:false,hideR:false,hideL:false,hand:1,pk:0};
const ASH_PIKE=70, ASH_HAM=21;
function ashArmed(){ return !(G&&G.mode==='story'&&!(G.flags&&G.flags.forge)); }
function ashWpnId(p){ if(!ashArmed()) return null; return p.swingT>0&&p.swingW?p.swingW:curWeapon(); }
function ashSteel(fin){ const t=(G&&G.tier)||0; return t>=3?'#86c8f4':t===2?'#a2cfea':t===1?'#bcd2e2':fin?'#ecc89c':'#c4ccd6'; }
function ashSteelE(){ const t=(G&&G.tier)||0; return t>=3?'#1e4a80':t>0?'#3e5464':'#4a525c'; }
function ashRangOut(){ if(!G||!G.wproj) return false; for(const q of G.wproj) if(q.k==='rang'&&!q.dead) return true; return false; }
function ashWpnPose(p,wid,bz,sw){
  const W=AW, sp=p.swingT>0&&p.swingW===wid, pr=sp?clamp(1-p.swingT/p.swingDur,0,1):0;
  W.useR=W.useL=false; W.twist=W.lean=W.gyaw=0; W.fin=false; W.hideR=W.hideL=false; W.hand=1; W.arrow=false; W.snap=0; W.fall=-1; W.glow=0; W.followL=false;
  const D=WEAPONS[wid]; if(D&&D.pose3d){ D.pose3d(p,W,bz,sw,pr,sp); return; }   // registry weapons (e6b_arms.js)
  if(wid==='sword'){
    W.useR=true;
    if(sp){
      const ez=1-Math.pow(1-pr,2.2), s=p.swingSide||1;
      if(p.swingSpin){
        const a=-s*0.5+s*TAU*ez, la=s*1.25; W.gyaw=a-la; W.fin=true; W.len=29;
        vSet(W.hR,1+Math.cos(la)*8.8,Math.sin(la)*8.8,bz+8.2); vDir(W.uR,la,-0.06); vPerp(W.vR,la);
        W.useL=true; vSet(W.hL,-2.5,-s*7.5,bz+6.5); W.lean=0.06;
      }else{
        const span=p.swingFin?1.4:1.15, a=lerp(-s*span,s*span,ez); W.twist=a*0.3; const la=a-W.twist;
        const dz=p.swingFin?lerp(6,-2.5,ez):lerp(1.4,-0.6,ez), el=p.swingFin?lerp(0.6,-0.3,ez):-0.07;
        vSet(W.hR,1.6+Math.cos(la)*8.8,2.0+Math.sin(la)*8.8,bz+8+dz); vDir(W.uR,la,el); vPerp(W.vR,la);
        W.len=p.swingFin?30:26; W.fin=p.swingFin; W.useL=true; vSet(W.hL,-0.8,-8.8,bz+4.8); W.lean=p.swingFin?0.16:0.06;
      }
    }else{ vSet(W.hR,3.4-sw*1.2,7.4,bz+3.2); vDir(W.uR,-0.12,0.36); vPerp(W.vR,-0.12); W.len=21; }
  }else if(wid==='daggers'){
    W.useR=W.useL=true; W.len=W.lenL=11.5;
    if(sp){
      const ez=1-Math.pow(1-pr,2), s=p.swingSide||1;
      if(p.swingSpin){
        const a=ez*TAU*s; W.gyaw=a; W.fin=true; W.len=W.lenL=12.5;
        vSet(W.hR,1.2,9.6,bz+7.6); vDir(W.uR,1.35,-0.05); vPerp(W.vR,1.35);
        vSet(W.hL,1.2,-9.6,bz+7.6); vDir(W.uL,-1.35,-0.05); vPerp(W.vL,-1.35);
      }else if(p.swingFin){
        const ext=Math.sin(Math.min(1,pr*1.6)*Math.PI*0.5)*22*(pr<0.75?1:1-(pr-0.75)/0.25);
        W.fin=true; W.len=W.lenL=13; W.lean=0.3;
        vSet(W.hR,6+ext*0.24,3.4,bz+8.8); vDir(W.uR,0.07,-0.05); vPerp(W.vR,0.07);
        vSet(W.hL,6+ext*0.24,-3.4,bz+8.8); vDir(W.uL,-0.07,-0.05); vPerp(W.vL,-0.07);
      }else{
        const a=lerp(s*0.85,-s*0.85,ez), ext=Math.sin(pr*Math.PI)*15, reach=6.4+ext*0.32; W.twist=a*0.22; const la=a-W.twist;
        const H=s>0?W.hR:W.hL, U=s>0?W.uR:W.uL, V=s>0?W.vR:W.vL, Hg=s>0?W.hL:W.hR, Ug=s>0?W.uL:W.uR, Vg=s>0?W.vL:W.vR;
        vSet(H,1.2+Math.cos(la)*reach,s*3+Math.sin(la)*reach,bz+7.6); vDir(U,la,-0.05); vPerp(V,la);
        vSet(Hg,3.8,-s*6.2,bz+7.4); vDir(Ug,-s*0.3,0.55); vPerp(Vg,-s*0.3); W.lean=0.06; W.hand=s;
      }
    }else{
      vSet(W.hR,4.3-sw*0.8,6.4,bz+4.4); vDir(W.uR,0.34,0.3); vPerp(W.vR,0.34);
      vSet(W.hL,4.3+sw*0.8,-6.4,bz+4.4); vDir(W.uL,-0.34,0.3); vPerp(W.vL,-0.34);
    }
  }else if(wid==='spear'){
    W.useR=true; W.len=ASH_PIKE;
    if(sp){
      W.useL=true;
      if(p.swingSpin){
        const a=(1-Math.pow(1-pr,2))*TAU; W.gyaw=a; W.fin=true;
        vSet(W.uR,1,0,0); vSet(W.vR,0,1,0); vSet(W.P,-29,2,bz+7.4); vSet(W.hR,-3,2,bz+7.4); vSet(W.hL,5,2,bz+7.4);
      }else{
        const e=spearExt(pr), fin=p.swingFin, rear=lerp(-5.5,fin?11:9.6,e); W.fin=fin;
        vSet(W.uR,1,0,-0.015); vNorm(W.uR); vSet(W.vR,0,1,0);
        vSet(W.P,rear-12,1.0,bz+6.9); vSet(W.hR,rear,1.0,bz+6.9); vSet(W.hL,clamp(rear+12,4,8.6),1.0,bz+6.9);
        W.lean=0.06+0.16*e*(fin?1.3:1); W.twist=0.12*(1-e);
      }
    }else{
      vSet(W.hR,2.4-sw*0.9,7.2,bz+4.4); vSet(W.uR,0.9,0.04,0.42); vNorm(W.uR); vSet(W.vR,-0.04,1,0); vNorm(W.vR);
      vSet(W.P,W.hR[0]-W.uR[0]*21,W.hR[1]-W.uR[1]*21,W.hR[2]-W.uR[2]*21);
    }
  }else if(wid==='hammer'){
    W.useR=true;
    const h=p.ham, idle=2.16, top=2.62, imp=-0.24;
    const iP=_s1, tP=_s2, mP=_s3; vSet(iP,3.4,7.0,bz+8.2); vSet(tP,-0.6,2.6,bz+15.6); vSet(mP,7.8,2.2,bz+5.0);
    let psi=idle;
    if(!h){ vCopy(W.hR,iP); }
    else{
      W.useL=true; const wind=0.34/((p.stats&&p.stats.atkSpeed)||1);
      if(h.ph==='wind'){ const k=1-Math.pow(1-clamp(h.t/wind,0,1),2); psi=lerp(idle,top,k); vLerp(W.hR,iP,tP,k); W.lean=-0.12*k; }
      else if(h.ph==='hold'){ psi=top+Math.sin((G?G.time:0)*55)*0.05*h.ch; vCopy(W.hR,tP); W.glow=h.ch; W.lean=-0.12-0.04*h.ch; }
      else if(h.ph==='fall'){ const k=clamp(h.t/0.09,0,1), kk=k*k; psi=lerp(top,imp,kk); vLerp(W.hR,tP,mP,kk); W.glow=h.ch; W.fall=kk; W.lean=lerp(-0.12,0.3,kk); }
      else{ const k=clamp(h.t/0.26,0,1); if(k<0.45){ psi=imp; vCopy(W.hR,mP); W.lean=0.3; } else { const j=smooth((k-0.45)/0.55); psi=lerp(imp,idle,j); vLerp(W.hR,mP,iP,j); W.lean=0.3*(1-j); if(j>0.7) W.useL=false; } W.glow=h.ch*(1-k); }
    }
    W.psi=psi; const c=Math.cos(psi), s=Math.sin(psi);
    vSet(W.uR,c,0,s); vSet(W.hL,W.hR[0]-c*2.8,W.hR[1]-0.6,W.hR[2]-s*2.8);
  }else if(wid==='bow'){
    W.useL=true; W.hand=-1;
    const b=p.bow, snap=p.bowSnap>0?p.bowSnap/0.14:0;
    if(b||snap>0){
      const k=b?b.k:0, amt=b?Math.min(1,0.45+k):snap; W.twist=0.45*amt; W.k=k; W.snap=b?0:snap; W.arrow=!!b;
      const ya=-W.twist, f=W.uL, up=W.vL; vDir(f,ya,0); const lx=f[1], ly=-f[0], ca=0.56;
      vSet(up,lx*Math.sin(ca),ly*Math.sin(ca),Math.cos(ca));
      vSet(W.hL,0.2+f[0]*10.6,-6.4+f[1]*10.6,bz+10.2);
      const back=2.6+4*k, pull=b?5.4*k:0, N=W.P; vSet(N,W.hL[0]-f[0]*(back+pull),W.hL[1]-f[1]*(back+pull),W.hL[2]);
      W.useR=true; if(b) vCopy(W.hR,N); else vSet(W.hR,N[0]-4*snap,N[1]+4.5*snap,N[2]+1);
    }else{
      W.k=0; vSet(W.hL,1.7+sw*0.8,-7.8,bz+2.6); vSet(W.vL,0.28,-0.14,0.95); vNorm(W.vL); vSet(W.uL,0.95,0,-0.28); vNorm(W.uL);
      vSet(W.P,W.hL[0]-W.uL[0]*2.6,W.hL[1]-W.uL[1]*2.6,W.hL[2]-W.uL[2]*2.6);
    }
  }else if(wid==='boomerang'){
    W.useR=true; const out=ashRangOut(), th=p.throwT>0?clamp(p.throwT/0.14,0,1):0; W.out=out; W.hideR=out;
    if(out){ if(th>0) vSet(W.hR,lerp(5,10,th),lerp(7.4,4.6,th),bz+lerp(5.5,8.8,th)); else vSet(W.hR,4.6,7.6,bz+5.6); }
    else if(th>0) vSet(W.hR,lerp(4.2,9,th),lerp(7.6,5.4,th),bz+lerp(3.6,8.2,th));
    else vSet(W.hR,4.2-sw*1,7.6,bz+3.4);
    const a=0.85-th*0.6; vSet(W.uR,Math.cos(a),Math.sin(a),0); vSet(W.vR,-Math.sin(a)*0.9,Math.cos(a)*0.9,0.44); vNorm(W.vR);
  }
}
// the Ember Blade: grip, pommel, guard, a flat blade and a bright ridge so it reads edge-on too
function ashBlade(h,u,v,L,fin,pal,mk){
  const st=ashSteel(fin), se=ashSteelE();
  aSeg(h,u,-2.8,1.8,0.95,'#3a2414');
  aB(h[0]-u[0]*3.7,h[1]-u[1]*3.7,h[2]-u[2]*3.7,1.3,pal.gold);
  const gx=h[0]+u[0]*2.2, gy=h[1]+u[1]*2.2, gz=h[2]+u[2]*2.2; aL(gx-v[0]*3.4,gy-v[1]*3.4,gz-v[2]*3.4,gx+v[0]*3.4,gy+v[1]*3.4,gz+v[2]*3.4,0.9,pal.gold);
  const b0=2.6; aPtUV(0,h,u,b0,v,-1.75); aPtUV(1,h,u,b0+L-4.6,v,-1.55); aPtUV(2,h,u,b0+L,v,0); aPtUV(3,h,u,b0+L-4.6,v,1.55); aPtUV(4,h,u,b0,v,1.75);
  aPoly(5,st,{edge:se});
  aL(h[0]+u[0]*(b0+0.4),h[1]+u[1]*(b0+0.4),h[2]+u[2]*(b0+0.4),h[0]+u[0]*(b0+L-3.6),h[1]+u[1]*(b0+L-3.6),h[2]+u[2]*(b0+L-3.6),0.32,shd(st,0.45),0.2,0.05);
  if(mk){ aMark('bA',h[0]+u[0]*b0,h[1]+u[1]*b0,h[2]+u[2]*b0); aMark('bB',h[0]+u[0]*(b0+L),h[1]+u[1]*(b0+L),h[2]+u[2]*(b0+L)); }
}
// a Twin Fang: a short curved blade
function ashFang(h,u,v,L,fin,pal){
  const st=ashSteel(fin);
  aSeg(h,u,-2.4,1.2,1.1,'#7a2418'); aB(h[0]-u[0]*2.9,h[1]-u[1]*2.9,h[2]-u[2]*2.9,0.95,pal.gold);
  const gx=h[0]+u[0]*1.5, gy=h[1]+u[1]*1.5, gz=h[2]+u[2]*1.5; aL(gx-v[0]*2.3,gy-v[1]*2.3,gz-v[2]*2.3,gx+v[0]*2.3,gy+v[1]*2.3,gz+v[2]*2.3,0.7,pal.gold);
  const b0=1.9; aPtUV(0,h,u,b0,v,-1.45); aPtUV(1,h,u,b0+L*0.5,v,-2.3); aPtUV(2,h,u,b0+L,v,1.1); aPtUV(3,h,u,b0+L*0.56,v,0.6); aPtUV(4,h,u,b0,v,1.45);
  aPoly(5,st,{edge:ashSteelE()});
}
function ashPike(B,u,v,L,fin,pal,t){
  const sl=L-10, st=ashSteel(fin);
  aSeg(B,u,0,sl,1.45,'#8e5c30');
  aSeg(B,u,sl*0.34,sl*0.34+3.4,1.65,'#3a2414');
  aB(B[0],B[1],B[2],1.35,'#8a929c');
  aSeg(B,u,sl-1.6,sl+0.8,1.95,pal.gold);
  const sx=B[0]+u[0]*(sl-1.2), sy=B[1]+u[1]*(sl-1.2), sz=B[2]+u[2]*(sl-1.2), sw=Math.sin(t*7)*1.2;
  aC(sx,sy,sz, sx-u[0]*5.5+v[0]*sw,sy-u[1]*5.5+v[1]*sw,sz-u[2]*5.5-3.2,1.5,'#c8322a');
  const h0=sl+0.6; aPtUV(0,B,u,h0,v,-1.2); aPtUV(1,B,u,h0+3.8,v,-3.3); aPtUV(2,B,u,h0+12,v,0); aPtUV(3,B,u,h0+3.8,v,3.3); aPtUV(4,B,u,h0,v,1.2);
  aPoly(5,st,{edge:ashSteelE()});
  aMark('bA',B[0]+u[0]*h0,B[1]+u[1]*h0,B[2]+u[2]*h0); aMark('bB',B[0]+u[0]*(h0+12),B[1]+u[1]*(h0+12),B[2]+u[2]*(h0+12));
}
function ashHammerAt(P,psi,glow,pal,tier){
  const c=Math.cos(psi), s=Math.sin(psi), L=ASH_HAM;
  aL(P[0]-c*3,P[1],P[2]-s*3,P[0]+c*L,P[1],P[2]+s*L,1.5,'#8e5c30');
  aB(P[0]-c*3.6,P[1],P[2]-s*3.6,1.45,'#7a828c');
  const C0=P[0]+c*(L+0.6), C1=P[1], C2=P[2]+s*(L+0.6), wx=-s, wz=c, hs=tier>=3?'#78acdc':tier>0?'#90a8c0':'#8a929c', pt=-(psi+Math.PI/2);
  aL(C0-wx*5.2,C1,C2-wz*5.2,C0+wx*5.2,C1,C2+wz*5.2,5.3,hs);
  for(const q of [-1,1]) aE(C0+wx*q*6.6,C1,C2+wz*q*6.6,1.1,5.7,5.7,shd(hs,-0.18),{pitch:pt});
  aE(C0,C1,C2,1.6,5.65,5.65,pal.gold,{pitch:pt});
  const gl=clamp(glow,0,1), rc=gl>0.01?shd('#ff7a2a',0.5*gl):'#c8501e';
  aD(C0,C1+5.5,C2,1.5,rc,0.05); aD(C0,C1-5.5,C2,1.5,rc,0.05);
  aMark('ham',C0,C1,C2);
}
function ashBow(W,pal,fire){
  const Gp=W.hL, f=W.uL, up=W.vL, k=W.k, span=13.5-1.2*k, back=2.6+4*k;
  // two limbs, each a quadratic curve from the grip to its tip (sampled into three tapering pieces)
  for(const s of [-1,1]){
    const Tx=Gp[0]+up[0]*s*span-f[0]*back, Ty=Gp[1]+up[1]*s*span-f[1]*back, Tz=Gp[2]+up[2]*s*span-f[2]*back;
    const Cx=Gp[0]+up[0]*s*span*0.62+f[0]*3.4, Cy=Gp[1]+up[1]*s*span*0.62+f[1]*3.4, Cz=Gp[2]+up[2]*s*span*0.62+f[2]*3.4;
    let px=Gp[0], py=Gp[1], pz=Gp[2], r=1.75;
    for(const q of [0.36,0.7,1]){ const a=(1-q)*(1-q), b=2*(1-q)*q, d=q*q, x=a*Gp[0]+b*Cx+d*Tx, y=a*Gp[1]+b*Cy+d*Ty, z=a*Gp[2]+b*Cz+d*Tz, r2=1.75-0.8*q; aL(px,py,pz,x,y,z,r,'#9a4a24',r2); px=x; py=y; pz=z; r=r2; }
    aD(Tx,Ty,Tz,0.95,'#e0b050',0.03);
    APool[18+(s>0?1:0)][0]=Tx; APool[18+(s>0?1:0)][1]=Ty; APool[18+(s>0?1:0)][2]=Tz;
  }
  aL(Gp[0]-up[0]*1.9,Gp[1]-up[1]*1.9,Gp[2]-up[2]*1.9,Gp[0]+up[0]*1.9,Gp[1]+up[1]*1.9,Gp[2]+up[2]*1.9,1.7,'#3a2414');
  // the string (pulled back to the nock while drawing, humming after a shot)
  const N=W.P, vib=W.snap>0?Math.sin(((G&&G.time)||0)*90)*1.8*W.snap:0;
  const nx=N[0]+f[0]*vib, ny=N[1]+f[1]*vib, nz=N[2];
  const T0=APool[18], T1=APool[19], t0x=T0[0], t0y=T0[1], t0z=T0[2], t1x=T1[0], t1y=T1[1], t1z=T1[2];
  aN(t0x,t0y,t0z,nx,ny,nz,0.55,'#f5f0e1',0.02); aN(nx,ny,nz,t1x,t1y,t1z,0.55,'#f5f0e1',0.02);
  if(W.arrow){
    const ax=nx+f[0]*0.5, ay=ny+f[1]*0.5;
    aN(ax,ay,nz,nx+f[0]*24,ny+f[1]*24,nz,1.7,'#2a1a0e',0.01); aN(ax,ay,nz,nx+f[0]*24,ny+f[1]*24,nz,0.95,'#c89a62',0.03);
    aC(nx+f[0]*23.4,ny+f[1]*23.4,nz,nx+f[0]*28.6,ny+f[1]*28.6,nz,1.45,fire?'#ffd27a':'#e8eef4',0.04);
    aPt(0,nx+f[0]*0.4,ny+f[1]*0.4,nz); aPt(1,nx+f[0]*4.8,ny+f[1]*4.8,nz); aPt(2,nx+f[0]*5.6,ny+f[1]*5.6,nz+1.9); aPt(3,nx+f[0]*1.6,ny+f[1]*1.6,nz+2.1); aPoly(4,'#c8322a',{bias:0.03});
    aMark('tip',nx+f[0]*28,ny+f[1]*28,nz);
  }
}
// the Wing-rang: a flat V of wood with a red gem, in its own plane (ux, uy) around a centre c
const RANG=[[5,0],[-0.5,-5.6],[-7,-10.5],[-5.4,-7.6],[-7.4,-6.6],[-4.8,-4.4],[-6.2,-3.2],[-3.55,-1.5],[-2,0],[-3.55,1.5],[-6.2,3.2],[-4.8,4.4],[-7.4,6.6],[-5.4,7.6],[-7,10.5],[-0.5,5.6]];
function ashRangAt(cx,cy,cz,ux,uy,s,fire,lite){
  for(let i=0;i<16;i++){ const q=RANG[i], a=q[0]*s, b=q[1]*s; aPt(i,cx+ux[0]*a+uy[0]*b,cy+ux[1]*a+uy[1]*b,cz+ux[2]*a+uy[2]*b); }
  aPoly(16,fire?'#ff9a3a':'#e8963a',{edge:'#2a0e06'});
  if(lite) return;
  aD(cx+ux[0]*1.4*s,cy+ux[1]*1.4*s,cz+ux[2]*1.4*s+0.2,1.7*s,'#ff5a35',0.03);
  aD(cx+ux[0]*1.0*s+uy[0]*-0.5*s,cy+ux[1]*1.0*s+uy[1]*-0.5*s,cz+ux[2]*1.0*s+0.3,0.6*s,'#ffe6cc',0.05);
  for(const q of [-1,1]) aN(cx+ux[0]*3.6*s+uy[0]*q*0.8*s,cy+ux[1]*3.6*s+uy[1]*q*0.8*s,cz+ux[2]*3.6*s+uy[2]*q*0.8*s, cx+ux[0]*-6*s+uy[0]*q*9.2*s,cy+ux[1]*-6*s+uy[1]*q*9.2*s,cz+ux[2]*-6*s+uy[2]*q*9.2*s,0.55,'#fff0d0',0.02);
}
const _ru=[0,0,0], _rv=[0,0,0];
function ashWpnDraw(p,wid,pal){
  const W=AW, t=p.t||0, tier=(G&&G.tier)||0, D=WEAPONS[wid];
  if(D&&D.draw3d){ D.draw3d(p,W,pal,t,tier); return; }
  if(wid==='sword'){ ashBlade(W.hR,W.uR,W.vR,W.len,W.fin,pal,true); aMark('hand',W.hR[0],W.hR[1],W.hR[2]); }
  else if(wid==='daggers'){ if(!W.hideR) ashFang(W.hR,W.uR,W.vR,W.len,W.fin,pal); if(!W.hideL) ashFang(W.hL,W.uL,W.vL,W.lenL,W.fin,pal); aMark('hand',W.hR[0],W.hR[1],W.hR[2]); }
  else if(wid==='spear'){
    const B=W.P; if(!(p.swingT>0&&p.swingW==='spear')){ B[0]=W.hR[0]-W.uR[0]*21; B[1]=W.hR[1]-W.uR[1]*21; B[2]=W.hR[2]-W.uR[2]*21; }
    ashPike(B,W.uR,W.vR,ASH_PIKE,W.fin,pal,t); aMark('hand',W.hR[0],W.hR[1],W.hR[2]);
  }else if(wid==='hammer'){
    ashHammerAt(W.hR,W.psi,W.glow,pal,tier); aMark('hand',W.hR[0],W.hR[1],W.hR[2]);
    // remember the head's path through the smash for the motion streak
    AHS.n=0;
    if(W.fall>0.12){ const c0=2.62, n=6; for(let i=0;i<n;i++){ const ps=lerp(c0,W.psi,i/(n-1)), L=ASH_HAM+0.6, P=W.hR; arP(P[0]+Math.cos(ps)*L,P[1],P[2]+Math.sin(ps)*L,AHS[i]); } AHS.n=n; }
  }else if(wid==='bow'){ ashBow(W,pal,hasSkill('firearrow')>0||p.breathing); aMark('hand',W.hL[0],W.hL[1],W.hL[2]); }
  else if(wid==='boomerang'){
    if(!W.hideR){ const h=W.hR, s=0.82; ashRangAt(h[0]-W.uR[0]*-6.2*s-W.vR[0]*9.4*s,h[1]-W.uR[1]*-6.2*s-W.vR[1]*9.4*s,h[2]-W.uR[2]*-6.2*s-W.vR[2]*9.4*s,W.uR,W.vR,s,false,false); }
    aMark('hand',W.hR[0],W.hR[1],W.hR[2]);
  }
}

// ---------- hats, rebuilt in 3D (head space: the skull's centre is the origin, its top is about z 7)
const HATC=['#ff7aa0','#ffd84a','#ffffff','#b48cff'];
function ashHat(k){
  const z0=6.2;
  if(k==='party'){ aC(0,0,z0, -1.4,0,z0+11.5,4.4,'#e84a8a'); aB(-1.5,0,z0+11.8,1.6,'#ffd84a',0.02); aD(3.1,-1.4,z0+2.4,0.85,'#4ac8e8',0.06); aD(1.4,2.6,z0+4.4,0.8,'#ffd84a',0.06); aD(0.4,-1.1,z0+7,0.7,'#4ac8e8',0.06); aD(-2.6,1.6,z0+3.4,0.8,'#4ac8e8',0.06); }
  else if(k==='wizard'){ aE(0,0,z0+0.3,9.8,9.8,1.0,'#2e2e86'); aL(0,0,z0+1.6,-1.2,0,z0+9.4,5.3,'#3a3a9a',2.8); aC(-1.2,0,z0+9.4,-6.8,0,z0+15.4,2.9,'#3a3a9a'); aD(4.8,0.4,z0+3.4,1.25,'#ffe066',0.06); aD(-0.8,4.2,z0+5,0.75,'#ffe066',0.06); aD(-2.4,-3.6,z0+6.6,0.6,'#ffe066',0.06); }
  else if(k==='crown'){ for(let i=0;i<8;i++){ const a=i/8*TAU, x=Math.cos(a)*6.4, y=Math.sin(a)*6.9, z=4.6-Math.cos(a)*1.3; aB(x,y,z,1.8,HATC[i%4],0.02); if(i%2===0) aD(Math.cos(a+0.39)*6.9,Math.sin(a+0.39)*7.4,z,0.9,'#5aa040',0.03); } }
  else if(k==='top'){ aE(0,0,z0+0.4,8.8,8.8,0.9,'#1a1a1e'); aCyl(0,0,z0+0.6,5.2,5.6,8.6,'#26262c',{top:'#34343c'}); aCyl(0,0,z0+0.7,5.45,5.6,2.0,'#8a2e22',{open:true,bias:0.4}); }
  else if(k==='chef'){ aCyl(0,0,z0-0.4,5.2,5.5,3.8,'#ecead8'); aE(0,0,z0+5.4,6.8,6.8,4.0,'#f8f6ee'); aB(-2.8,2.4,z0+7.4,2.7,'#f4f2ea'); aB(2.3,-2.2,z0+7.6,2.5,'#f4f2ea'); }
  else if(k==='straw'){ aE(0,0,z0+0.2,11.8,11.8,0.9,'#d8b860'); aE(0,0,z0+2.4,5.8,5.8,3.6,'#c8a850'); aE(0,0,z0+1.4,6.0,6.0,1.2,'#8a3a2a',{bias:0.1}); }
  else if(k==='cap'){ aE(0.3,0,z0-0.9,7.4,7.8,4.6,'#4a6a3a'); aE(7.0,0,z0-1.8,4.2,5.6,0.7,'#3e5a30',{pitch:0.12}); aB(0,0,z0+3.6,0.95,'#3e5a30'); }
  else if(k==='beanie'){ aE(0,0,z0-0.6,7.8,8.2,5.0,'#c84a3a'); aE(0,0,z0-2.8,8.0,8.4,1.6,'#e8e2d8'); aB(-0.6,0,z0+4.6,2.3,'#f4f2ea'); }
  else if(k==='feather'){ aE(0.3,0,z0-0.8,7.2,7.6,4.0,'#7a2a7a'); aE(0.3,0,z0-2.4,7.5,7.9,1.2,'#5a1a5a'); aL(-1.2,3.8,z0+1.4,-7.4,6.2,z0+7.6,1.4,'#ffd84a',0.9); aL(-7.4,6.2,z0+7.6,-12,4.8,z0+7,0.9,'#ffd84a',0.3); }
  else if(k==='helm'){ aE(0,0,z0-1.3,8.1,8.5,5.4,'#a8b0ba'); aE(0,0,z0-3.6,8.4,8.8,1.1,'#7a828c'); aL(6,0,z0-2,-6,0,z0+3,0.9,'#dfe4ea'); }
  else if(k==='Sky Feather'){
    aB(0,0,z0+0.4,2.8,'#7a2a1a'); aD(1.8,0,z0+1.6,1.05,'#ffd84a',0.06);
    const F=[['#c8322a',-0.6],['#e8862a',0],['#ffd84a',0.6]];
    for(const [c,a] of F){ const sx=Math.sin(a), mx=-6.6*Math.cos(a), my=sx*6.2; aL(-0.4,sx*1.2,z0+1.2,mx,my,z0+6.4,2.1,c,1.5); aL(mx,my,z0+6.4,mx*1.75-2,my*1.7,z0+7.6,1.5,c,0.35); }
  }
}

// ---------- wings: 3D membranes on dark bones, from folded on his back to spread wide
// right-wing keyframes relative to the root (wrist W, finger tips F0..F3, trailing root H)
const WG_F=[[-1.6,2.8,5.2],[-4.4,4.6,-4.6],[-5.0,3.6,-8.0],[-4.4,2.2,-10.2],[-3.2,0.8,-10.4],[-2.0,-1.0,-9.2]];
const WG_O=[[1.4,17.5,9.5],[-2.4,35,7],[-9.6,31,-0.5],[-12.6,22,-6.4],[-10,11,-8.6],[-4.2,1.4,-8.8]];
const WGT=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]], WGM=[[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
function ashWings(pal,o,ang,fk,bz,lite){
  const Rx=-3.3, Ry=2.6, Rz=bz+10.2;
  for(const sd of [-1,1]){
    const ca=Math.cos(ang*o), sa=Math.sin(ang*o);
    for(let i=0;i<6;i++){
      const F=WG_F[i], O=WG_O[i], q=WGT[i]; q[0]=lerp(F[0],O[0],o); q[1]=lerp(F[1],O[1],o); q[2]=lerp(F[2],O[2],o);
    }
    const W0=WGT[0];
    for(let i=1;i<5;i++){ const q=WGT[i]; q[0]=W0[0]+(q[0]-W0[0])*fk; q[1]=W0[1]+(q[1]-W0[1])*fk; q[2]=W0[2]+(q[2]-W0[2])*fk; }
    for(let i=0;i<6;i++){ const q=WGT[i], y=q[1]*ca-q[2]*sa, z=q[1]*sa+q[2]*ca; q[0]=Rx+q[0]; q[1]=sd*(Ry+y); q[2]=Rz+z; }
    // scallops between the finger tips, pulled toward the wrist
    for(let i=0;i<4;i++){ const a=WGT[i+1], b=WGT[i+2], m=WGM[i], pk=i===3?0.2:0.24; for(let j=0;j<3;j++) m[j]=lerp((a[j]+b[j])/2,W0[j],pk); }
    const W=WGT[0], F0=WGT[1], F1=WGT[2], F2=WGT[3], F3=WGT[4], H=WGT[5], M=WGM, ed=lite?null:pal.memE;
    aPt(0,W[0],W[1],W[2]); aPt(1,F0[0],F0[1],F0[2]); aPt(2,M[0][0],M[0][1],M[0][2]); aPt(3,F1[0],F1[1],F1[2]); aPoly(4,pal.mem,{edge:ed});
    aPt(0,W[0],W[1],W[2]); aPt(1,F1[0],F1[1],F1[2]); aPt(2,M[1][0],M[1][1],M[1][2]); aPt(3,F2[0],F2[1],F2[2]); aPoly(4,pal.mem,{edge:ed});
    aPt(0,W[0],W[1],W[2]); aPt(1,F2[0],F2[1],F2[2]); aPt(2,M[2][0],M[2][1],M[2][2]); aPt(3,F3[0],F3[1],F3[2]); aPoly(4,pal.memIn,{edge:ed});
    aPt(0,W[0],W[1],W[2]); aPt(1,F3[0],F3[1],F3[2]); aPt(2,M[3][0],M[3][1],M[3][2]); aPt(3,H[0],H[1],H[2]); aPt(4,Rx,sd*Ry,Rz); aPoly(5,pal.memIn,{edge:ed});
    // bones: the arm along the leading edge, the fingers, the wrist claw
    aL(Rx,sd*Ry,Rz,W[0],W[1],W[2],1.35,pal.bone,1.05);
    if(!lite){ for(let i=1;i<5;i++){ if(!AFINE&&i%2===0) continue; const f=WGT[i]; aN(W[0],W[1],W[2],f[0],f[1],f[2],0.95-0.12*i,pal.bone,0.01); }
      aC(W[0],W[1],W[2],W[0]+1.4,W[1]+sd*0.6,W[2]+2.6,0.85,pal.claw); if(AFINE) aB(W[0],W[1],W[2],1.3,pal.dark,0.01); }
    // the trailing edge, for the glow
    const E=AWE[sd<0?0:1], src=[F0,M[0],F1,M[1],F2,M[2],F3,M[3],H];
    for(let i=0;i<9;i++) arP(src[i][0],src[i][1],src[i][2],E[i]);
  }
}
function ashNubs(pal,bz,f,lite){
  // little wing buds on his shoulder blades: a bony edge with a bright leathery fan, fluttering in a jump
  for(const sd of [-1,1]){
    const ang=0.75*f-0.15, ca=Math.cos(ang), sa=Math.sin(ang), rx=-3.8, rz=bz+11;
    const rot=(y,z,o)=>{ o[1]=y*ca-z*sa; o[2]=y*sa+z*ca; return o; }, T=rot(8.6+f*1.6,4.6+f*1.4,_s1), M=rot(6.8,-0.2,_s2), Lo=rot(3.4,-3.0,_s3);
    const tx=rx-4.2-f*1.4, ty=sd*(2.4+T[1]), tz=rz+T[2];
    aPt(0,rx,sd*2.4,rz+1.2); aPt(1,tx,ty,tz); aPt(2,rx-5.8,sd*(2.4+M[1]),rz+M[2]); aPt(3,rx-4.4,sd*(2.4+Lo[1]),rz+Lo[2]); aPoly(4,pal.lite,{edge:lite?null:pal.memE});
    aL(rx,sd*2.4,rz+1.2,tx,ty,tz,1.05,pal.dark,0.7);
    if(!lite) aC(tx,ty,tz,tx-0.6,ty+sd*1.0,tz+2.0,0.75,pal.claw);
  }
}
// ---------- the head (head space: the skull's centre at the origin, x forward)
function ashHead(pal,lite,jo,blink){
  aE(0,0,0,7.7,8.1,7.2,pal.head);
  aE(6.3,0,-2.6,4.7,4.5,3.4,pal.snout,{pitch:0.12});
  if(jo>0.04){ aE(5.4,0,-5.0-jo*2.0,4.1,3.9,1.6,pal.snout,{pitch:-0.3*jo}); aE(6.7,0,-4.6-jo*1.0,3.0,3.0,0.8+jo*0.9,'#2a0604',{bias:0.04}); aMark('mouth',8.8,0,-4.9-jo*1.0); }
  aMark('snout',10.6,0,-2.4);
  for(const sd of [-1,1]){
    if(AFINE){ aL(0.6,sd*4.0,5.3,-2.7,sd*5.3,8.5,2.0,pal.horn,1.6); aL(-2.7,sd*5.3,8.5,-5.7,sd*5.8,9.4,1.6,pal.horn2,1.25); }
    else aL(0.6,sd*4.0,5.3,-5.7,sd*5.8,9.4,2.0,pal.horn,1.25);
    aC(-5.7,sd*5.8,9.4,-9.3,sd*5.9,8.7,1.3,pal.horn3);
    if(lite) continue;
    if(AFINE) aD(10.7,sd*1.35,-1.5,0.55,pal.dark,0.03);
    if(blink) aN(5.5,sd*4.7,0.8,5.9,sd*2.4,0.8,0.85,pal.dark,0.03);
    else{ aD(5.3,sd*3.55,0.9,2.1,pal.eye,0.02); aE(5.95,sd*3.6,0.85,0.3,0.6,1.3,pal.pupil,{bias:0.035}); aD(6.1,sd*3.05,1.85,0.55,'#ffffff',0.05); }
    aE(4.9,sd*3.85,4.15,1.4,2.3,0.75,pal.brow,{roll:sd*0.12,pitch:0.25,bias:-2.8});   // (sorted as if level with the eyes, so the far brow hides)
    aC(1.4,sd*6.7,-0.9,-3.2,sd*9.9,1.2,1.5,pal.horn);
    aMark(sd<0?'eyeL':'eyeR',5.3,sd*3.55,1.0);
  }
  if(lite) return;
  aC(-5.8,0,4.6,-8.4,0,8.0,1.5,pal.dark); aC(-7.3,0,0.8,-10.2,0,3.4,1.45,pal.dark); aC(-7.0,0,-3.2,-9.7,0,-1.4,1.25,pal.dark);
  if(jo<0.2&&AFINE){ aN(8.6,-2.9,-4.3,10.3,0,-4.75,0.55,pal.dark,0.04); aN(10.3,0,-4.75,8.6,2.9,-4.3,0.55,pal.dark,0.04); }
}

// ---------- the whole figure
const AS={hR:[0,0,0],hL:[0,0,0],sh:[0,0,0]};
const AINFO={breath:false,fly:false,jo:0,roar:0,wid:null,pk:0,glow:0,night:0,wo:0,fire:false,flask:0};
function ashBuild(g,p,fx,fy,o){
  const gh=o.ghost||null, lite=!!gh, raw=!!o.raw, pal=lite?ASHG:ASHP, t=p.t||0;
  AFINE=!lite&&(raw||o.fine||(o.k||1)*zoom>=1.5);
  const A=gh?null:(p._a||(p._a={mv:0,spr:0,bank:0,roarT:0,lt:null,pf:null}));
  for(const km in AM) AM[km].on=false; AHS.n=0; if(!gh) AINFO.wg=null;
  // the roll (0..1, or -1): ghosts remember the phase they were left at
  let rk=-1;
  if(gh){ if(gh._rk==null){ gh._rk=p.dashT>0?clamp(1-p.dashT/0.3,0,1):-1; gh._f=p._vf!=null?p._vf:gh.f; } rk=gh._rk; }
  else if(p.dashT>0) rk=clamp(1-p.dashT/0.3,0,1);
  let face;
  if(gh) face=gh._f;
  else if(raw) face=rk>=0&&p.dashDir!=null?p.dashDir:p.facing;
  else if(rk>=0){ p._vf=p.dashDir; p._vft=G.time; face=p.dashDir; }
  else face=t3Turn(p,p.facing,(p.swingT>0||p.bow||p.ham)?30:14);
  const fly=!gh&&!!p.flying, air=!gh&&!fly&&rk<0&&((p.z||0)>0.5||(p.vz||0)>0);
  let mv=0, spr=0, bank=0, roar=0;
  if(raw){ mv=p.moving&&rk<0?1:0; spr=p.sprinting?1:0; roar=o.roar||0; }
  else if(A){
    const now=G.time, dt=A.lt==null?0:clamp(now-A.lt,0,0.1); A.lt=now;
    A.mv+=((p.moving&&rk<0?1:0)-A.mv)*Math.min(1,dt*10); A.spr+=((p.sprinting?1:0)-A.spr)*Math.min(1,dt*7);
    const turn=A.pf==null||dt<=0?0:angDiff(A.pf,face)/dt; A.pf=face;
    A.bank+=((fly?clamp(-turn*0.08,-0.5,0.5):0)-A.bank)*Math.min(1,dt*5);
    if(G.rings) for(const r of G.rings) if(r.owner==='player'&&!r._ash){ r._ash=true; A.roarT=0.75; }
    if(A.roarT>0) A.roarT=Math.max(0,A.roarT-dt);
    mv=A.mv; spr=A.spr; bank=A.bank;
    if(A.roarT>0){ const u=1-A.roarT/0.75; roar=smooth(clamp(u/0.14,0,1))*(1-smooth(clamp((u-0.72)/0.28,0,1))); }
  }
  // ---- the base pose: idle, walk, sprint
  const w=(p.walkT||0)*10, sw=Math.sin(w)*mv, cw=Math.cos(w), stride=4.3+1.8*spr;
  let bob=(Math.abs(cw)-0.6)*mv*(1+0.6*spr);
  const br=Math.sin(t*2.3)*(1-mv);
  let pitch=spr*0.2, piv=0, roll=bank, gyaw=0, drop=0, twist=0, hp=0, hy=0, hfx=0, hfz=br*0.25, jo=0;
  let fRx=sw*stride, fLx=-sw*stride, fRz=Math.max(0,cw)*2.6*mv*(1+0.4*spr), fLz=Math.max(0,-cw)*2.6*mv*(1+0.4*spr);
  const armSw=sw*(3.4+2.6*spr), hR=AS.hR, hL=AS.hL;
  vSet(hR,1.3-armSw,7.8,HZ+1.9+bob+spr*Math.max(0,-sw)*3.4); vSet(hL,1.3+armSw,-7.8,HZ+1.9+bob+spr*Math.max(0,sw)*3.4);
  let tailUp=0, cfl=mv*2.2+spr*3.4, clift=spr*3, csway=Math.sin(w)*1.3*mv+Math.sin(t*1.7)*0.45, tailW=1;
  const hasW=!lite&&hasAbil('wings'), hasJ=!lite&&!hasW&&(hasAbil('jump')||(G&&G.mode==='normal'));
  let wo=clamp(p.wingO||0,0,1), wang=0, wfk=1; const ph=MV.flapPh||0;
  if(hasW&&MV.showWings>0&&!fly){ wang=0.22+0.3*Math.cos(ph); wfk=0.86+0.14*Math.cos(ph); }
  if(rk>=0){
    // a forward somersault: tuck into a ball and tumble once around the hips
    const tk=clamp(Math.sin(rk*Math.PI)*2.6,0,1);
    pitch=smooth(rk)*TAU; piv=10; drop=6.5*tk;
    fRx=lerp(fRx,3.6,tk); fLx=lerp(fLx,3.0,tk); fRz=lerp(fRz,6.0,tk); fLz=lerp(fLz,6.4,tk);
    vSet(hR,lerp(hR[0],5.4,tk),lerp(hR[1],5.0,tk),lerp(hR[2],HZ+1.4,tk)); vSet(hL,lerp(hL[0],5.4,tk),lerp(hL[1],-5.0,tk),lerp(hL[2],HZ+1.4,tk));
    hp=0.6*tk; hfx=1.4*tk; hfz=-2.4*tk; cfl=0; clift=-1*tk; tailUp=3*tk; bob=0; tailW=1-0.6*tk;
  }else if(fly){
    const gl=!!p.gliding;
    pitch=0.4; piv=16;
    fRx=-2.4+Math.sin(t*3.1)*1.4; fLx=-1.6-Math.sin(t*3.1)*1.4; fRz=2.4; fLz=3.2;
    vSet(hR,4.4,8.4,HZ+5.4+Math.cos(ph)*0.9); vSet(hL,4.4,-8.4,HZ+5.4+Math.cos(ph)*0.9);
    hp=-0.34; cfl=8.5; clift=7.5; csway=Math.sin(t*11)*1.7; tailUp=4.5;
    wang=gl?0.16:0.12+0.62*Math.cos(ph); wfk=gl?0.97:0.82+0.18*Math.cos(ph);
  }else if(air){
    const u=clamp((p.vz||0)/220,-1,1), up=Math.max(0,u), dn=Math.max(0,-u);
    if(p.slam){ pitch=0.3; piv=14; fRx=2.4; fLx=1.6; fRz=6; fLz=6.5; vSet(hR,3.6,3.6,HZ+21); vSet(hL,3.6,-3.6,HZ+21); cfl=2; clift=6; tailUp=5; hp=0.25; }
    else{
      fRx=1.8-dn*0.8; fLx=-1.2+dn*0.4; fRz=1.0+3.8*up; fLz=0.4+2.2*up;
      vSet(hR,-1.2+2.8*dn,8.9+1.6*dn,HZ+8.6+2.5*up); vSet(hL,-1.2+2.8*dn,-8.9-1.6*dn,HZ+8.6+2.5*up);
      pitch=-0.06*up+0.05*dn; piv=12; cfl=1.5+mv*2; clift=2+4*up; tailUp=2*up-1.5*dn; hp=-0.08*up+0.1*dn;
    }
    if(hasW){ wang=0.2+Math.sin(t*26)*0.1; wfk=0.9+Math.sin(t*26)*0.06; }
  }
  // breath: head forward, jaw open
  const breath=!gh&&!!p.breathing;
  if(breath){ jo=0.85+Math.sin(t*31)*0.12; hp+=fly?0.62:0.14; hfx+=1.5; }
  // hurt: a little flinch back
  const hf=gh?0:clamp((p.hurtFlash||0)/0.12,0,1); if(hf>0){ pitch-=0.2*hf; hp-=0.15*hf; }
  // the weapon in his hands (nothing before Mom hands him the sword; nothing in the middle of a tumble)
  const wid=gh||rk>=0?null:ashWpnId(p), bz0=HZ+bob;
  if(wid){ ashWpnPose(p,wid,bz0,sw); if(AW.useR) vCopy(hR,AW.hR); if(AW.useL) vCopy(hL,AW.hL); twist+=AW.twist; pitch+=AW.lean; gyaw+=AW.gyaw; }
  // drinking: the free hand lifts a green flask, head back
  let fk=0, fs=0;
  if(!gh&&p.drinkT>0){ const k=1-p.drinkT/0.9; fk=smooth(clamp(k/0.22,0,1))*(1-smooth(clamp((k-0.8)/0.2,0,1))); fs=wid==='bow'?1:-1; hp-=0.45*fk; hfz+=Math.sin(t*15)*0.3*fk;
    const H=fs>0?hR:hL; vSet(H,lerp(H[0],8.4,fk),lerp(H[1],fs*2.4,fk),lerp(H[2],bz0+15.4,fk)); if(wid==='daggers'){ if(fs<0) AW.hideL=fk>0.1; else AW.hideR=fk>0.1; } }
  // the roar: chest out, arms wide, snout up, wings out
  if(roar>0){ pitch-=0.22*roar; hp-=0.55*roar; jo=Math.max(jo,roar); cfl+=2.5*roar;
    const busy=p.swingT>0||p.bow||p.ham;
    if(!busy){ vSet(hR,lerp(hR[0],-1.6,roar),lerp(hR[1],11.6,roar),lerp(hR[2],bz0+12,roar)); if(!fk) vSet(hL,lerp(hL[0],-1.6,roar),lerp(hL[1],-11.6,roar),lerp(hL[2],bz0+12,roar)); }
    if(hasW){ wo=Math.max(wo,roar); wang=lerp(wang,0.32,roar); } }
  // arms cannot stretch: keep each hand within reach of its shoulder
  const bz=bz0;
  for(const sd of [-1,1]){ const H=sd>0?hR:hL, sx=0.2, sy=sd*6.4, sz=bz+9.6, dx=H[0]-sx, dy=H[1]-sy, dz=H[2]-sz, d=Math.hypot(dx,dy,dz); if(d>ASH_ARM){ const k=ASH_ARM/d; H[0]=sx+dx*k; H[1]=sy+dy*k; H[2]=sz+dz*k; } }
  if(wid){
    // the weapon follows the hand that holds it (after the reach limit, the drink and the roar moved the hands)
    if(wid!=='bow'){ const d0=hR[0]-AW.hR[0], d1=hR[1]-AW.hR[1], d2=hR[2]-AW.hR[2]; AW.hR[0]+=d0; AW.hR[1]+=d1; AW.hR[2]+=d2; if(wid==='spear'){ AW.P[0]+=d0; AW.P[1]+=d1; AW.P[2]+=d2; } }
    if(wid==='daggers'||wid==='bow'||AW.followL) vCopy(AW.hL,hL);
    if(wid==='bow'){ if(AW.arrow) vCopy(AW.P,hR); else if(!(AW.snap>0)) vSet(AW.P,hL[0]-AW.uL[0]*2.6,hL[1]-AW.uL[1]*2.6,hL[2]-AW.uL[2]*2.6); }
  }
  // ---- build
  const k=o.k||1, z=Math.max(0,o.z||0);
  t3Begin(fx,fy,face,{k,flash:!!o.flash,alpha:o.alpha==null?1:o.alpha,z:z/(T3.st*k),g});
  arReset();
  if(gyaw) arYaw(gyaw);
  if(pitch||roll){ arMove(0,0,piv); arPitch(pitch); arRoll(roll); arMove(0,0,-piv); }
  if(drop) arMove(0,0,-drop);
  // legs and boots
  for(const sd of [-1,1]){
    const fx_=sd>0?fRx:fLx, fz=sd>0?fRz:fLz, y=sd*3.3;
    aL(0.2,sd*3.0,bz+1.2,fx_-0.2,y,fz+3.6,2.5,pal.skin,2.3);
    if(!lite){ aL(fx_-0.25,y,fz+4.6,fx_+0.1,y,fz+1.6,2.75,pal.boot,2.6); if(AFINE) aE(fx_-0.25,y,fz+4.9,2.95,2.95,0.95,pal.steel); }
    aE(fx_+1.5,y,fz+1.55,3.5,2.45,1.75,pal.boot);
  }
  // tail: three fat tapering pieces that sway side to side, the tip dragging on the ground
  { let px=-3.4, py=0, pz=bz-0.8, r=3.7; const ph2=t*2.2+(p.walkT||0)*6, TL=[0,6.2,6.0,5.4], TR=[3.7,2.9,2.0,1.15];
    for(let i=1;i<=3;i++){ const f=i/3, x=px-TL[i]*tailW, y=Math.sin(ph2-i*0.7)*(1.0+i*2.2)*tailW, zz=lerp(bz-0.8,1.5,Math.min(1,f*1.5))+tailUp*f*f, r2=TR[i];
      aL(px,py,pz,x,y,zz,r,pal.skin,r2); if(AFINE&&i<3) aC(x+2.6,y,zz+r2*0.75,x+0.6,y,zz+r2+1.9,1.15,pal.dark); px=x; py=y; pz=zz; r=r2; }
    aC(px,py,pz,px-3.6,py*1.15,pz+0.4,1.4,pal.dark); }
  // upper body (twists with a swing)
  arPush(); arYaw(twist);
  aE(0.3,0,bz+1.2,4.9,5.7,2.7,pal.belt);
  if(!lite) aD(5.05,0,bz+1.3,1.15,pal.gold,0.03);
  aE(0,0,bz+6.6,5.5,6.3,6.1+br*0.15,pal.vest);
  if(!lite) aE(2.7,0,bz+7.6,3.0,3.3,4.6,pal.chest,{bias:0.15});
  aL(0.2,0,bz+11.6,0.9,0,bz+15.4,3.0,pal.skin,2.7);
  aE(-2.6,0,bz+11.7,3.1,6.1,2.3,pal.cloak,{bias:-0.1});
  for(const sd of [-1,1]) aE(0.3,sd*6.5,bz+10.5,3.8,3.4,2.5,pal.steel,{roll:-sd*0.42});
  for(const sd of [-1,1]){ const H=sd>0?hR:hL, sx=0.2, sy=sd*6.4, sz=bz+9.6;
    aL(sx,sy,sz,H[0],H[1],H[2],2.25,pal.skin,1.95);
    if(AFINE) aL(lerp(sx,H[0],0.56),lerp(sy,H[1],0.56),lerp(sz,H[2],0.56),lerp(sx,H[0],0.88),lerp(sy,H[1],0.88),lerp(sz,H[2],0.88),2.35,pal.vestD,2.2);
    aB(H[0],H[1],H[2],2.15,pal.head); }
  // cloak: four panels folding around his back to a rounded hem, with a darker lining a hair inside
  { const az=bz+11.4, hz=bz-6.2+clift, sy=csway, ed=lite?null:pal.cloakE;
    const CA=[[-4.4,0,az+0.3],[-3.6,3.4,az],[-2.4,6.0,az-0.6]], CH=[[-6.9-cfl,sy,hz-0.4],[-6.1-cfl*0.85,4.9+sy*0.6,hz+0.4],[-4.4-cfl*0.6,8.7+sy*0.4,hz+2.4]];
    for(let pass=0;pass<(AFINE?2:1);pass++){ const q=pass?0.7:0, col=pass?pal.cloakIn:pal.cloak, op=pass?{shade:false}:{edge:ed};
      for(const sd of [-1,1]) for(let j=0;j<2;j++){ const a0=CA[j], a1=CA[j+1], h0=CH[j], h1=CH[j+1], s0=j?sd:1;
        aPt(0,a0[0]+q,a0[1]*sd*0.96,a0[2]-q*0.5); aPt(1,a1[0]+q,a1[1]*sd*0.96,a1[2]-q*0.5); aPt(2,h1[0]+q,(h1[1]-sy)*sd*0.96+sy,h1[2]+q*0.3); aPt(3,h0[0]+q,(h0[1]-sy)*sd*0.96+sy,h0[2]+q*0.3); aPoly(4,col,op); } } }
  if(hasW) ashWings(pal,wo,wang,wfk,bz,lite);
  else if(hasJ){ const up=(p.z||0)>0||MV.flapT>0; ashNubs(pal,bz,up?0.55+0.45*Math.sin(t*46):0,lite); }
  if(wid) ashWpnDraw(p,wid,pal);
  if(fk>0.05){ const H=fs>0?hR:hL; const bx=H[0]+0.6, by=H[1]-fs*0.3, bz2=H[2]+1.2; aB(bx,by,bz2,3.0,'#3ec46a'); aD(bx-0.8,by-0.8,bz2+1.4,0.95,'#d8ffe4',0.05);
    aL(bx+1.5,by,bz2+2.0,bx+3.0,by,bz2+4.0,1.1,'#a8e8c0'); aB(bx+3.4,by,bz2+4.6,1.15,'#a07040'); }
  // head
  arPush(); arMove(1.0+hfx,0,bz+18.6+hfz); arPitch(hp); arYaw(hy);
  aMark('head',0,0,0);
  const blink=!lite&&jo<0.1&&((t*0.29+0.37)%1)<0.035;
  ashHead(pal,lite,jo,blink);
  if(!lite&&G&&G.hat) ashHat(G.hat);
  if(breath) aMark('jet',fly?24:30,0,fly?-8:-15);
  arPop();
  arPop();
  AINFO.parts=T3R.n;
  t3End();
  AINFO.breath=breath; AINFO.fly=fly; AINFO.jo=jo; AINFO.roar=roar; AINFO.wid=wid; AINFO.glow=wid==='hammer'?AW.glow:0; AINFO.wo=hasW?wo:0; AINFO.flask=fk;
  AINFO.pk=!gh&&p.wEquipT>0?Math.sin(clamp(p.wEquipT/0.35,0,1)*Math.PI):0; AINFO.fire=wid==='bow'&&AW.arrow&&(hasSkill('firearrow')>0||p.breathing);
  AINFO.night=G?1-daylight():0;
}
// glows and flames on top of the figure (screen space; the context is still in the figure's transform)
function ashPost(g,p,k){
  const I=AINFO, t=p.t||0, a=_s1, b=_s2;
  // how much of the snout faces the camera (glows at the mouth fade when he faces away)
  let vis=1; if(AM.head.on&&AM.snout.on){ aScr(AM.head,_s3); const hd=_s3[2]; aScr(AM.snout,a); vis=clamp((a[2]-hd+1)/5,0.12,1); }
  if(I.breath&&AM.snout.on){
    aScr(AM.snout,a); if(AM.jet.on) aScr(AM.jet,b); else { b[0]=a[0]; b[1]=a[1]; }
    const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L, fl=1+Math.sin(t*37)*0.12, w0=2.2*k, w1=(I.fly?6:8.5)*k*fl;
    g.save(); g.globalCompositeOperation='lighter';
    const gr=g.createLinearGradient(a[0],a[1],b[0],b[1]); gr.addColorStop(0,`rgba(255,248,210,${0.95*vis})`); gr.addColorStop(0.45,`rgba(255,180,80,${0.35+0.35*vis})`); gr.addColorStop(1,'rgba(255,90,30,0)');
    g.fillStyle=gr; g.beginPath(); g.moveTo(a[0]+nx*w0,a[1]+ny*w0); g.quadraticCurveTo(a[0]+dx*0.5+nx*w1*0.9,a[1]+dy*0.5+ny*w1*0.9,b[0]+nx*w1*0.5,b[1]+ny*w1*0.5); g.lineTo(b[0]-nx*w1*0.5,b[1]-ny*w1*0.5); g.quadraticCurveTo(a[0]+dx*0.5-nx*w1*0.9,a[1]+dy*0.5-ny*w1*0.9,a[0]-nx*w0,a[1]-ny*w0); g.closePath(); g.fill();
    g.restore();
    aGlow(g,a[0],a[1],10*k*fl,'255,220,140',0.9*vis); aGlow(g,a[0],a[1],4.5*k,'255,250,225',0.9*vis);
  }else if((I.roar>0.05||I.jo>0.3)&&AM.mouth.on){ aScr(AM.mouth,a); aGlow(g,a[0],a[1],(6+5*I.roar)*k,'255,170,80',(0.55+0.4*I.roar)*vis); }
  if(I.wid==='hammer'&&AM.ham.on){
    aScr(AM.ham,a);
    if(AHS.n>1){ g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round'; g.lineJoin='round';
      for(let pass=0;pass<2;pass++){ g.strokeStyle=pass?'rgba(255,240,210,.55)':`rgba(255,${200-Math.round(70*I.glow)},120,.28)`; g.lineWidth=(pass?3:9)*k; g.beginPath(); for(let i=0;i<AHS.n;i++){ aScr(AHS[i],b); if(i) g.lineTo(b[0],b[1]); else g.moveTo(b[0],b[1]); } g.stroke(); }
      g.restore(); }
    if(I.glow>0.01){ const pul=I.glow>=1?0.75+0.25*Math.sin(((G&&G.time)||0)*14):1; aGlow(g,a[0],a[1],(12+9*I.glow)*k,'255,190,100',0.75*I.glow*pul); aGlow(g,a[0],a[1],5*k,'255,240,200',0.5*I.glow); }
  }
  if((I.wid==='sword'||I.wid==='spear')&&p.swingT>0&&AM.bA.on&&((G&&G.tier)||0)>=2){ aScr(AM.bA,a); aScr(AM.bB,b); g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle=`rgba(120,190,255,${0.25+0.1*G.tier})`; g.lineWidth=3.5*k; g.lineCap='round'; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); g.restore(); }
  if(I.fire&&AM.tip.on){ aScr(AM.tip,a); aGlow(g,a[0],a[1],9*k,'255,170,70',0.85); }
  if(I.wg&&AM.tip.on){ aScr(AM.tip,a); aGlow(g,a[0],a[1],I.wg.r*k,I.wg.col,I.wg.a); }   // a registry weapon's glow (the glaive at night, a bomb's fuse)
  if(AM.hand.on){ aScr(AM.hand,a); I.hx=a[0]; I.hy=a[1]; I.ht=G?G.time:0; }   // where the hand is on screen, for the whip's chain
  if(I.pk>0&&AM.hand.on){ aScr(AM.hand,a); g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle=`rgba(255,220,150,${0.6*I.pk})`; g.lineWidth=1.5*k; g.beginPath(); g.arc(a[0],a[1],(9+12*(1-I.pk))*k,0,TAU); g.stroke(); g.restore(); aGlow(g,a[0],a[1],8*k,'255,220,150',0.4*I.pk); }
  // wing edges glow warm (much brighter at night and in flight)
  if(I.wo>0.08){
    const up=I.fly?0.5-0.5*Math.cos(MV.flapPh||0):0, al=(0.12+0.4*I.night+0.1*(I.fly?1:0))*I.wo;
    g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round'; g.lineJoin='round'; g.strokeStyle=`rgba(255,${120+40*up|0},60,${al})`; g.lineWidth=1.8*k;
    for(const E of AWE){ g.beginPath(); for(let i=0;i<9;i++){ aScr(E[i],b); if(i) g.lineTo(b[0],b[1]); else g.moveTo(b[0],b[1]); } g.stroke(); }
    g.restore();
  }
  // gold eyes glow a little in the dark
  if(I.night>0.2&&AM.head.on&&AM.eyeL.on){ aScr(AM.head,_s3); const hd=_s3[2]; for(const e of [AM.eyeL,AM.eyeR]){ aScr(e,a); if(a[2]>hd+1.5) aGlow(g,a[0],a[1],4*k,'255,200,80',0.32*I.night); } }
}
// the 2D swing arcs and streaks, flat on the ground (the same shapes as drawHeroWeapon drew)
function ashArcs(g,p,x,y){
  if(!ashArmed()||p.drinkT>0||!(p.swingT>0)||!p.swingW) return;
  const w=p.swingW, st=p.stats, K=wReachK(), pr=clamp(1-p.swingT/p.swingDur,0,1);
  g.save(); g.translate(x,y); g.rotate(p.swingDir!=null?p.swingDir:p.facing);
  if(w==='sword'){
    const ez=1-Math.pow(1-pr,2.2), s=p.swingSide||1;
    if(p.swingSpin){ const R=st.range*1.2, a0=-s*0.5, a=a0+s*TAU*ez; aSweep(g,R,Math.min(a0,a),Math.max(a0,a),'rgba(255,190,110,.42)'); }
    else{ const span=p.swingFin?1.4:1.15, a0=-s*span, a=lerp(a0,s*span,ez), R=st.range*(p.swingFin?1.25:1); aSweep(g,R,Math.min(a0,a),Math.max(a0,a),p.swingFin?'rgba(255,190,110,.42)':'rgba(240,244,250,.3)'); }
  }else if(w==='daggers'){
    const ez=1-Math.pow(1-pr,2), s=p.swingSide||1;
    if(p.swingSpin){ const R=44*K*1.45, a=ez*TAU*s; aSweep(g,R,Math.min(0,a),Math.max(0,a),'rgba(225,205,255,.42)',0.4); }
    else if(p.swingFin){
      const ext=Math.sin(Math.min(1,pr*1.6)*Math.PI*0.5)*22*(pr<0.75?1:1-(pr-0.75)/0.25);
      g.globalCompositeOperation='lighter'; g.lineCap='round';
      for(const q of [-1,1]){ const gr=g.createLinearGradient(-14,0,20+ext,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(1,`rgba(235,225,255,${0.6*(1-pr)})`); g.strokeStyle=gr; g.lineWidth=2.6; g.beginPath(); g.moveTo(-14,q*10); g.lineTo(20+ext,q*5); g.stroke(); }
    }else{ const R=44*K, a0=s*0.85, a=lerp(a0,-a0,ez); aSweep(g,R,Math.min(a0,a),Math.max(a0,a),'rgba(240,236,255,.34)',0.45); }
  }else if(w==='spear'){
    if(p.swingSpin){ const a=(1-Math.pow(1-pr,2))*TAU, R=92*K; aSweep(g,R,Math.min(-0.3,a-0.3),Math.max(-0.3,a-0.3),'rgba(255,220,170,.38)',0.35); }
    else{
      const fin=p.swingFin, len=100*K*(fin?1.2:1), e=spearExt(pr), tip=34+(len-34)*e;
      if(e>0.05){ g.globalCompositeOperation='lighter';
        const gr=g.createLinearGradient(14,0,tip+10,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(1,fin?'rgba(255,210,130,.75)':'rgba(230,240,255,.6)');
        const hw=(fin?4.6:3)*(pr<0.68?1:e); g.fillStyle=gr; g.beginPath(); g.moveTo(14,2-hw); g.lineTo(tip+10,2); g.lineTo(14,2+hw); g.closePath(); g.fill();
        if(fin&&pr<0.6){ g.strokeStyle=`rgba(255,220,160,${0.5*(1-pr/0.6)})`; g.lineWidth=1.4; for(const q of [-1,1]){ g.beginPath(); g.moveTo(tip-30,2+q*9); g.quadraticCurveTo(tip-8,2+q*4,tip+4,2); g.stroke(); } } }
    }
  }
  g.restore();
}
function ashDraw(g,p,fx,fy,o){
  const z=Math.max(0,o.z||0), k=(o.k||1)*(1+z/240);
  const sq=!o.ghost&&p.sqT>0&&p.sqD?p.sqA*Math.sin(p.sqT/p.sqD*Math.PI):0;
  g.save();
  if(sq){ const cy=fy-z; g.translate(fx,cy); g.scale(1+sq,1-sq); g.translate(-fx,-cy); }
  o.k=k; ashBuild(g,p,fx,fy,o);
  if(!o.ghost) ashPost(g,p,k);
  g.restore();
  if(!o.ghost&&AM.head.on){ aScr(AM.head,_s1); p._t3top=_s1[1]-(G&&G.hat?13:10)*T3.st*k; }
}
// the roll's afterimages and the dagger dash's ghost: faded ember copies
function ashGhost(g,p,gh){
  if(!(gh.a>0)) return;
  ashBuild(g,p,gh.x,gh.y+6,{ghost:gh,k:1,alpha:clamp(gh.a,0,1)*0.5});
}
T3X.ash=function(p){
  const g=ctx, z=(p.z||0)+(p.flying?Math.sin(p.t*2.6)*2.2:0);
  if(z>0.5||p.flying) drawMoveShadow(p);
  for(const gh of p.ghosts) ashGhost(g,p,gh);
  ashArcs(g,p,p.x,p.y);
  const blink=p.iframes>0&&p.iframes<5&&p.dashT<=0&&Math.floor(p.t*18)%2===0;
  ashDraw(g,p,p.x,p.y+6,{z,alpha:blink?0.55:1,flash:p.hurtFlash>0});
};

// ---------- arrows and the Wing-rang in flight (drawWeaponFx calls these while T3.on): lifted to hand height, in 3D
const AFX_AZ=15, AFX_RZ=12;
function t3ArrowParts(fire,cut){
  if(!cut){ t3Line(-15,0,0,2.5,0,0,2.2,'#2a1a0e'); t3Line(-15,0,0,2.5,0,0,1.2,'#c89a62',0.02); t3Cone(2,0,0,8.6,0,0,2.3,fire?'#ffd27a':'#e8eef4',0.03); }
  else{ t3Line(-15,0,0,-0.5,0,0,2.2,'#2a1a0e'); t3Line(-15,0,0,-0.5,0,0,1.2,'#c89a62',0.02); }
  t3Poly([[-16,0,0],[-11.6,0,0],[-12.6,0,2.7],[-16.8,0,2.5]],'#c8322a',{bias:0.02});
  t3Poly([[-16,0,0],[-11.6,0,0],[-12.6,2.3,-1.4],[-16.8,2.2,-1.3]],'#c8322a',{bias:0.01});
  t3Poly([[-16,0,0],[-11.6,0,0],[-12.6,-2.3,-1.4],[-16.8,-2.2,-1.3]],'#c8322a',{bias:0.01});
}
function t3FlyArrow(a){
  const c=Math.cos(a.a), s=Math.sin(a.a), lift=AFX_AZ*T3.st;
  ctx.save(); ctx.globalAlpha=0.15; ctx.strokeStyle='#000'; ctx.lineWidth=2.4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(a.x-c*15+3,a.y-s*15+4); ctx.lineTo(a.x+c*6+3,a.y+s*6+4); ctx.stroke(); ctx.restore();
  if(a.full||a.fire){ ctx.save(); ctx.translate(a.x,a.y-lift); ctx.rotate(a.a); ctx.globalCompositeOperation='lighter'; const gr=ctx.createLinearGradient(-46,0,0,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(1,a.fire?'rgba(255,150,60,.55)':'rgba(220,240,255,.45)'); ctx.strokeStyle=gr; ctx.lineWidth=a.fire?4:2.4; ctx.beginPath(); ctx.moveTo(-46,0); ctx.lineTo(0,0); ctx.stroke(); ctx.restore(); }
  t3Begin(a.x,a.y,a.a,{z:AFX_AZ}); t3ArrowParts(a.fire,false); t3End();
  if(a.fire) glowAt(a.x+c*6,a.y+s*6-lift,12,'255,180,80',0.8);
}
function t3StuckArrow(s){
  const al=clamp((s.life-s.t)/0.3,0,1);
  if(s.ground){
    // it came down and stuck into the ground, nose first
    t3Begin(s.x,s.y,s.a,{alpha:al*0.9});
    t3Line(-10.6,0,9.4,1.2,0,-0.4,2.2,'#2a1a0e'); t3Line(-10.6,0,9.4,1.2,0,-0.4,1.2,'#c89a62',0.02);
    t3Poly([[-11.2,0,9.9],[-8.2,0,7.3],[-8.4,0,9.8],[-11.4,0,12.2]],'#c8322a',{bias:0.02});
    t3Poly([[-11.2,0,9.9],[-8.2,0,7.3],[-9,2.1,8.4],[-12,2.1,10.8]],'#c8322a',{bias:0.01});
    t3End(); return;
  }
  const wob=Math.sin(s.t*45)*0.16*Math.max(0,1-s.t*4);
  t3Begin(s.x,s.y,s.a+wob,{z:AFX_AZ,alpha:al}); t3ArrowParts(s.fire,true); t3End();
}
const _rx=[1,0,0], _ry=[0,1,0];
function t3FlyRang(a){
  const lift=AFX_RZ*T3.st;
  ctx.save(); ctx.globalAlpha=0.17; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(a.x+3,a.y+4,10,5.5,0,0,TAU); ctx.fill(); ctx.restore();
  const tl=0.32; vSet(_ry,0,Math.cos(tl),Math.sin(tl));
  for(let i=0;i<a.trail.length;i+=2){ t3Begin(a.trail[i],a.trail[i+1],a.spin-0.5*(a.trail.length-i),{z:AFX_RZ,alpha:0.1+0.05*i}); arReset(); ashRangAt(0,0,0,_rx,_ry,1.15,a.fire,true); t3End(); }
  if(a.fire) glowAt(a.x,a.y-lift,18,'255,190,100',0.7);
  t3Begin(a.x,a.y,a.spin,{z:AFX_RZ}); arReset(); ashRangAt(0,0,0,_rx,_ry,1.15,a.fire,false); t3End();
}

// ---------- debug: a sheet of Ash in many states at 8 facings (returns a data URL)
function ashSheet(rows,S,o){
  o=o||{}; S=S||2; const cw=o.cw||74, chh=o.ch||84, L=96, c=document.createElement('canvas'); c.width=(8*cw+L)*S; c.height=rows.length*chh*S; const g=c.getContext('2d');
  g.fillStyle=o.bg||'#6a8a4a'; g.fillRect(0,0,c.width,c.height);
  const save={weapon:G.weapon,weapons:G.weapons,abil:G.abil,hat:G.hat,tier:G.tier,wproj:G.wproj,mode:G.mode,flags:G.flags,tod:G.tod,flap:MV.flapPh,flapT:MV.flapT,show:MV.showWings,skills:G.skills};
  try{
    rows.forEach((r,ri)=>{
      G.weapons={}; for(const id of WEAPON_IDS) G.weapons[id]=true; G.weapon=r.w||'sword'; G.abil=r.abil||{}; G.hat=r.hat||null; G.tier=r.tier||0; G.wproj=r.rangOut?[{k:'rang'}]:[]; G.flags=Object.assign({},save.flags,{forge:r.unarmed?false:true}); G.mode=r.mode||'story'; G.skills=r.skills||{};
      if(r.tod!=null) G.tod=r.tod; MV.flapPh=r.flap||0; MV.flapT=r.flapT||0; MV.showWings=0;
      g.setTransform(S,0,0,S,0,0); g.fillStyle='rgba(0,0,0,.6)'; g.font=`700 10px ${UIF}`; g.textAlign='left'; g.textBaseline='middle'; g.fillText(r.label||'',6,ri*chh+chh/2);
      for(let i=0;i<8;i++){
        const q=Object.assign({},player,{ghosts:[],_a:null,_vf:null,swingT:0,dashT:0,bow:null,ham:null,drinkT:0,breathing:false,flying:false,gliding:false,slam:false,z:0,vz:0,moving:false,sprinting:false,hurtFlash:0,iframes:0,sqT:0,throwT:0,bowSnap:0,wEquipT:0,wingO:0,swingW:null,swingSpin:false,swingFin:false},r.p||{});
        q.facing=i*TAU/8; q.swingDir=q.facing; if(r.p&&r.p.dashDir==='f') q.dashDir=q.facing;
        const x=L+i*cw+cw/2, y=ri*chh+chh*0.74, zz=q.z||0;
        g.setTransform(S,0,0,S,0,0);
        g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x,y,12,5.4,0,0,TAU); g.fill();
        if(r.arcs!==false){ g.save(); g.globalAlpha=0.9; ashArcs(g,q,x,y-6); g.restore(); }
        ashDraw(g,q,x,y,{raw:true,z:zz,roar:r.roar||0,flash:!!r.flash});
      }
    });
  }finally{ Object.assign(G,{weapon:save.weapon,weapons:save.weapons,abil:save.abil,hat:save.hat,tier:save.tier,wproj:save.wproj,mode:save.mode,flags:save.flags,tod:save.tod,skills:save.skills}); MV.flapPh=save.flap; MV.flapT=save.flapT; MV.showWings=save.show; }
  return c.toDataURL();
}
function ashBench(n){ const t0=performance.now(); ctx.save(); for(let i=0;i<n;i++){ ashDraw(ctx,player,100+(i%10)*40,100+Math.floor(i/10)*50,{raw:true}); } ctx.restore(); return performance.now()-t0; }
window.__ebDbg=Object.assign(window.__ebDbg||{},{ash:{sheet:ashSheet,bench:ashBench,AW,AINFO,fx:{t3FlyRang,t3FlyArrow,t3StuckArrow}}});
