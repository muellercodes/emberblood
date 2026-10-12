
// ================= Toy 3D foes (v7): kobolds, the purse thief, Grizzlefang, cultists, Morrow, drakelings, the Brood Mother,
// knights, Sir Cindervane (also as a final-battle ally) and the Trial foes (crabs, eels, gust sprites, Bramblehorn).
// Every T3E[type](e,fl) builds its figure from shaded 3D parts each frame (engine: a3e_toy3d.js) and sets e._t3top
// (the world y of the top of the head) for the HP bar and stun stars. Telegraphs, swing arcs and auras stay 2D on the ground.
// Body space: x forward, y to the right, z up. Feet at (e.x, e.y+e.r*0.45). Flyers float with z over a ground shadow.

const FO={g:null};                  // a sheet canvas while testing; null draws into the game (ctx)
function foG(){ return FO.g||ctx; }
// ---------- pose layers. A bends the upper body (lean, twist, wobble) around a pivot height, B moves the whole figure (topple, tilt).
function foLayer(){ return {on:false,px:0,pz:0,p:0,r:0,y:0,cp:1,sp:0,cr:1,sr:0,cy:1,sy:0,ox:0,oy:0,oz:0}; }
const FOA=foLayer(), FOB=foLayer();
function foSet(L,pz,pitch,roll,yaw,ox,oy,oz,px){
  L.on=true; L.pz=pz; L.px=px||0; L.p=pitch||0; L.r=roll||0; L.y=yaw||0; L.cp=Math.cos(L.p); L.sp=Math.sin(L.p); L.cr=Math.cos(L.r); L.sr=Math.sin(L.r);
  L.cy=Math.cos(L.y); L.sy=Math.sin(L.y); L.ox=ox||0; L.oy=oy||0; L.oz=oz||0;
}
function foRot(L,v){
  let x=v[0]-L.px, y=v[1], z=v[2]-L.pz;
  if(L.r){ const y2=y*L.cr-z*L.sr, z2=y*L.sr+z*L.cr; y=y2; z=z2; }
  if(L.p){ const x2=x*L.cp+z*L.sp, z2=-x*L.sp+z*L.cp; x=x2; z=z2; }
  if(L.y){ const x2=x*L.cy-y*L.sy, y2=x*L.sy+y*L.cy; x=x2; y=y2; }
  v[0]=x+L.px+L.ox; v[1]=y+L.oy; v[2]=z+L.pz+L.oz;
}
let FOU=true;                       // true: parts go through layer A (upper body). Legs and tails switch it off.
function foUp(){ FOU=true; } function foLow(){ FOU=false; }
const _fq=[0,0,0], _fq2=[0,0,0], _fqt=[0,0,0], _fo={pitch:0,yaw:0,roll:0,bias:0}, _fc={top:null,bias:0,open:false}, _fpo={edge:null,shade:true,bias:0};
function foP(x,y,z,v){ v[0]=x; v[1]=y; v[2]=z; if(FOU&&FOA.on) foRot(FOA,v); if(FOB.on) foRot(FOB,v); return v; }
function foO(pitch,yaw,roll,bias){
  let p=pitch||0, w=yaw||0, r=roll||0;
  if(FOU&&FOA.on){ p+=FOA.p; w+=FOA.y; r+=FOA.r; } if(FOB.on){ p+=FOB.p; w+=FOB.y; r+=FOB.r; }
  _fo.pitch=p; _fo.yaw=w; _fo.roll=r; _fo.bias=bias||0; return _fo;
}
function foE(x,y,z,rx,ry,rz,col,pitch,yaw,roll,bias){ foP(x,y,z,_fq); return t3Ell(_fq[0],_fq[1],_fq[2],rx,ry,rz,col,foO(pitch,yaw,roll,bias)); }
function foB(x,y,z,r,col,bias){ foP(x,y,z,_fq); _fo.pitch=_fo.yaw=_fo.roll=0; _fo.bias=bias||0; return t3Ell(_fq[0],_fq[1],_fq[2],r,r,r,col,_fo); }
function foL(ax,ay,az,bx,by,bz,r,col,r2,bias){ foP(ax,ay,az,_fq); foP(bx,by,bz,_fq2); return t3Limb(_fq[0],_fq[1],_fq[2],_fq2[0],_fq2[1],_fq2[2],r,col,r2,bias); }
function foC(ax,ay,az,bx,by,bz,r,col,bias){ foP(ax,ay,az,_fq); foP(bx,by,bz,_fq2); return t3Cone(_fq[0],_fq[1],_fq[2],_fq2[0],_fq2[1],_fq2[2],r,col,bias); }
function foN(ax,ay,az,bx,by,bz,w,col,bias){ foP(ax,ay,az,_fq); foP(bx,by,bz,_fq2); return t3Line(_fq[0],_fq[1],_fq[2],_fq2[0],_fq2[1],_fq2[2],w,col,bias); }
function foD(x,y,z,r,col,bias){ foP(x,y,z,_fq); return t3Dot(_fq[0],_fq[1],_fq[2],r,col,bias); }
function foY(x,y,z,r1,r2,h,col,top,bias,open){ foP(x,y,z,_fq); _fc.top=top||null; _fc.bias=bias||0; _fc.open=!!open; return t3Cyl(_fq[0],_fq[1],_fq[2],r1,r2,h,col,_fc); }
const FOPL=[]; for(let n=0;n<=14;n++){ const a=[]; for(let i=0;i<n;i++) a.push([0,0,0]); FOPL.push(a); }
// flat panel from a flat list [x,y,z, x,y,z, ...]
function foQ(f,col,edge,bias,flat){ const n=(f.length/3)|0, pts=FOPL[n]; for(let i=0;i<n;i++) foP(f[i*3],f[i*3+1],f[i*3+2],pts[i]); _fpo.edge=edge||null; _fpo.bias=bias||0; _fpo.shade=!flat; return t3Poly(pts,col,_fpo); }
// ---------- glows: queued in body space while building, drawn additively after t3End (dimmed when behind the body)
const FOGQ=[]; let FOGN=0; const FOGS=new Map();
function foGlowSpr(col){ let s=FOGS.get(col); if(!s){ s=mkCanvas(64,64); const q=s.getContext('2d'), gr=q.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,`rgba(${col},1)`); gr.addColorStop(0.3,`rgba(${col},0.5)`); gr.addColorStop(1,`rgba(${col},0)`); q.fillStyle=gr; q.fillRect(0,0,64,64); FOGS.set(col,s); } return s; }
function foGlow(x,y,z,r,col,a,occ){
  foP(x,y,z,_fq); t3P(_fq[0],_fq[1],_fq[2],_fqt);
  let q=FOGQ[FOGN]; if(!q){ q={}; FOGQ[FOGN]=q; } FOGN++;
  q.x=T3R.x+_fqt[0]; q.y=T3R.y+_fqt[1]; q.r=r*T3R.k; q.col=col; q.a=a; q.d=_fqt[2]; q.occ=!!occ;
}
function foGlows(dc){
  if(!FOGN) return; const g=foG(), pa=g.globalAlpha, pc=g.globalCompositeOperation; g.globalCompositeOperation='lighter';
  for(let i=0;i<FOGN;i++){ const q=FOGQ[i]; let a=q.a; if(q.occ&&q.d<dc) a*=0.25; if(a<=0.01||!(q.r>0)) continue; g.globalAlpha=pa*Math.min(1,a); g.drawImage(foGlowSpr(q.col),q.x-q.r,q.y-q.r,q.r*2,q.r*2); }
  g.globalAlpha=pa; g.globalCompositeOperation=pc; FOGN=0;
}
// ---------- begin and end a figure
const _fb={k:1,flash:false,alpha:1,z:0,g:null};
function foBegin(x,y,face,k,fl,z){ _fb.k=k; _fb.flash=!!fl; _fb.alpha=1; _fb.z=z||0; _fb.g=foG(); t3Begin(x,y,face,_fb); FOA.on=false; FOB.on=false; FOU=true; FOGN=0; }
function foEnd(zc){ FO.n=T3R.n; t3End(); FOA.on=false; FOB.on=false; FOU=true; t3P(0,0,zc||10,_fqt); foGlows(_fqt[2]); }
// world y of a body height (for e._t3top)
function foTop(fy,h,k,z){ return fy-(h+(z||0))*k*T3.st; }
// ---------- per-figure time, walking, state timers and eased poses
function foDt(e){ const now=G?G.time:0, dt=clamp(now-(e._fot!=null?e._fot:now),0,0.1); e._fot=now; return dt; }
function foWalk(e,dt,stride){
  const sp=Math.hypot(e.dx||0,e.dy||0);
  e._wp=(e._wp||0)+sp*dt/stride;
  const tg=sp>8?Math.min(1,sp/Math.max(40,(e.speed||100)*0.7)):0;
  e._wa=(e._wa||0)+(tg-(e._wa||0))*Math.min(1,dt*10);
  return e._wa;
}
// time spent in the current state; e._pst is the state before it (for follow-through poses)
function foSt(e){ const now=G?G.time:0; if(e._ps!==e.state){ e._pst=e._ps; e._ps=e.state; e._sT=now; } return now-(e._sT!=null?e._sT:now); }
// eases a list of numbers stored on e[key] toward the values in tg (smooth pose changes even when states snap)
function foEase(e,key,tg,dt,rate){
  let v=e[key]; if(!v||v.length!==tg.length){ v=e[key]=tg.slice(); return v; }
  const a=Math.min(1,dt*(rate||12)); for(let i=0;i<tg.length;i++) v[i]+=(tg[i]-v[i])*a; return v;
}
const _ft=[]; for(let i=0;i<24;i++) _ft.push(0);
function foTg(){ for(let i=0;i<arguments.length;i++) _ft[i]=arguments[i]; _ft.length=arguments.length; return _ft; }
function foNorm(v){ const l=Math.hypot(v[0],v[1],v[2])||1; v[0]/=l; v[1]/=l; v[2]/=l; return v; }
const foSm=t=>t*t*(3-2*t);
// colour tint (cave and Trial rooms tint their foes a little: e.tint is 'ice', 'ember', 'crystal' or a '#rrggbb')
const FOTC=new Map(), FOTN={ice:'#9ec4ff',ember:'#ff7a3a',crystal:'#c8a0ff'};
function foT(e,col){
  const t=e.tint; if(!t) return col; const key=col+t; let v=FOTC.get(key); if(v) return v;
  const tc=FOTN[t]||(typeof t==='string'&&/^#[0-9a-fA-F]{6}$/.test(t)?t:null);
  if(!tc) v=col; else { const m=mixRGB(hexRGB(col),hexRGB(tc),FOTN[t]?0.28:0.18); v='#'+m.map(q=>clamp(Math.round(q),0,255).toString(16).padStart(2,'0')).join(''); }
  if(FOTC.size>800) FOTC.clear(); FOTC.set(key,v); return v;
}
// ground shadow for flyers and hoppers
function foShadow(x,y,r,a){ const g=foG(); if(!SPR.shadow||!(a>0)) return; const pa=g.globalAlpha; g.globalAlpha=pa*Math.min(1,a); g.drawImage(SPR.shadow,x-r,y-r*0.5,r*2,r); g.globalAlpha=pa; }
// a boss corpse topples back over its first 0.6 s (the render loop draws it white and fading)
function foDeath(e){ return e.deathT!=null?clamp(e.deathT/0.45,0,1):0; }
// a tiny gold crown (elite crabs and gust sprites wear one)
function foCrown(x,y,z,r){ foY(x,y,z,r,r*1.05,r*0.7,'#e8b840','#a8781e',0.05,true); for(let i=0;i<5;i++){ const a=i/5*TAU; foC(x+Math.cos(a)*r*0.92,y+Math.sin(a)*r*0.92,z+r*0.6,x+Math.cos(a)*r,y+Math.sin(a)*r,z+r*1.5,r*0.32,'#f4cc50',0.06); } foD(x+r,y,z+r*0.4,r*0.25,'#e83a4a',0.08); }

// ================= kobolds: little lizard folk with spears (kind 0), the purse thief (1), Grizzlefang the war chief (2)
const FOK={sk:'#a89458',skD:'#7a6834',skK:'#3e3418',belly:'#dccb92',lea:'#5a3a20',eye:'#ffd84a',steel:'#c9ced6',wood:'#8a6a42',
  ck:'#c2a862',ckD:'#8a7438',ckK:'#4a3c18',fur:'#8a7a6a',furL:'#a8988a',furD:'#5a4a3a',bone:'#ece2cc',iron:'#9aa2ac'};
function foCleaver(hx,hy,hz,dx,dy,dz,ex,ey,ez,col){
  // handle from the hand back, blade forward along d, edge toward e
  foN(hx-dx*2.2,hy-dy*2.2,hz-dz*2.2,hx+dx*2,hy+dy*2,hz+dz*2,1.4,'#4a3420');
  const b0x=hx+dx*2, b0y=hy+dy*2, b0z=hz+dz*2, b1x=hx+dx*8.6, b1y=hy+dy*8.6, b1z=hz+dz*8.6;
  foQ([b0x-ex*0.6,b0y-ey*0.6,b0z-ez*0.6, b1x-ex*0.6,b1y-ey*0.6,b1z-ez*0.6, b1x+ex*4.4,b1y+ey*4.4,b1z+ez*4.4, b0x+ex*3.8,b0y+ey*3.8,b0z+ez*3.8],col||FOK.iron,'#3a3e44',0.02);
  foN(b1x+ex*4.3,b1y+ey*4.3,b1z+ez*4.3,b0x+ex*3.7,b0y+ey*3.7,b0z+ez*3.7,0.7,'#eef4f8',0.03);
  foD(b1x-dx*1.4+ex*0.6,b1y-dy*1.4+ey*0.6,b1z-dz*1.4+ez*0.6,0.55,'#2a2a30',0.04);
}
const _fkH=[0,0,0], _fkD=[0,0,0], _fkE=[0,0,0];
function foKobold(e,fl,kind){
  const sneak=kind===1, chief=kind===2, g=foG(), dt=foDt(e), t=e.t||0, st=e.state, inS=foSt(e);
  const k=(chief?1.95:sneak?0.95:1)*e.r/(chief?24:sneak?10:11);
  const spin=chief&&st==='spin', face=spin?(e._vf=e.face):t3Turn(e,e.face,12);
  const mv=foWalk(e,dt,(chief?6.4:sneak?3.6:4.4)*k), w=e._wp||0, stun=e.stun>0, dead=foDeath(e);
  const fx=e.x, fy=e.y+e.r*0.45;
  const sk=fl?'#ffffff':foT(e,chief?FOK.ck:FOK.sk), skD=foT(e,chief?FOK.ckD:FOK.skD), skK=foT(e,chief?FOK.ckK:FOK.skK), belly=foT(e,FOK.belly);
  // pose
  let lean=(sneak?0.32:0.1)*mv, tw=0, wob=0, crouch=0, lunge=0, jaw=0, tailUp=0, pull=0, bob=Math.abs(Math.cos(w))*mv*(sneak?1.4:0.9);
  let dz=0; // dizzy circle
  if(kind===0){
    if(st==='windup'){ const p=foSm(clamp(1-e.st/0.38,0,1)); lean=-0.3*p; pull=-6.5*p; crouch=1.3*p; tailUp=p; tw=0.25*p; }
    else if(st==='strike'){ lean=0.45; pull=7.5; lunge=2.6; jaw=1; tw=-0.2; }
    else if(st==='recover'){ const p=clamp(e.st/0.55,0,1); lean=0.34*p; pull=6*p; jaw=p>0.55?1:0.2; tw=-0.15*p; }
  }else if(sneak){
    if(e.tired>0){ lean=0.55; bob=Math.abs(Math.sin(t*13))*0.8; jaw=0.8; }
    else jaw=Math.sin(t*3)>0.6?0.5:0;
  }
  if(stun){ wob=Math.sin(t*7)*0.24; lean=0.22; jaw=0.5; pull=-1.5; }
  // the war chief's moves
  let bombUp=false;
  if(chief){
    lean=0.06*mv; jaw=0.35+0.15*Math.sin(t*2);
    if(st==='cleave'){ const p=foSm(clamp(1-e.st/0.45,0,1)); lean=-0.32*p; crouch=1.5*p; tailUp=p; jaw=0.3+0.7*p; }
    else if(st==='recover'&&e._pst==='cleave'&&inS<0.45){ lean=0.4*(1-inS/0.45); jaw=1; }
    else if(st==='spinW'){ const p=foSm(clamp(1-e.st/0.65,0,1)); tw=-1.0*p; crouch=2.2*p; lean=0.15*p; jaw=1; }
    else if(st==='spin'){ lean=0.12; crouch=1; jaw=1; tailUp=0.6; }
    else if(st==='dizzy'){ dz=1; jaw=0.9; }
    else if(st==='bombs'){ const p=foSm(clamp(1-e.st/0.5,0,1)); tw=0.5*p; lean=-0.15*p; jaw=0.6; }
    else if(st==='recover'&&e._pst==='bombs'&&inS<0.4){ tw=-0.45*(1-inS/0.4); lean=0.2*(1-inS/0.4); }
  }
  // the spinning chief's dust ring and blade swooshes stay on the ground
  if(spin){
    g.fillStyle='rgba(255,230,180,.16)'; g.beginPath(); g.arc(e.x,e.y,e.r+30,0,TAU); g.fill();
    g.save(); g.lineCap='round';
    for(let i=0;i<3;i++){ const a0=-t*18+i*TAU/3; g.strokeStyle=`rgba(255,250,235,${0.55-i*0.12})`; g.lineWidth=3.2-i*0.6; g.beginPath(); g.ellipse(e.x,fy-12*k*T3.st,e.r+14,(e.r+14)*T3.ct,0,a0,a0+1.6); g.stroke(); }
    g.restore();
  }
  let zl=0;
  if(dead){ /* topples back */ }
  foBegin(fx,fy,face,k,fl,zl);
  if(dead) foSet(FOB,0,-1.3*dead,0,0,-3*dead,0,0);
  else if(dz){ foSet(FOB,0,Math.sin(t*5)*0.16,Math.cos(t*5)*0.16,0); }
  const hip=7.4-crouch+bob*0.4;
  // legs and feet (lower body, no lean)
  foLow();
  for(const sd of [-1,1]){
    const s=Math.sin(w)*mv*sd*(sneak?1.35:1)+(chief&&st==='spinW'?sd*0.3:0), lift=Math.max(0,Math.cos(w)*sd)*mv*(sneak?2.6:1.8);
    const footX=s*3.8+(st==='strike'?sd*1.2:0), footY=sd*(2.9+crouch*0.4), kx=1.8+s*2.2, kz=hip*0.55+lift*0.5;
    foL(-0.3,sd*2.4,hip,kx,sd*2.9,kz,2.0,skD,1.8);
    foL(kx,sd*2.9,kz,footX-0.4,footY,1.3+lift,1.7,skD,1.4);
    foE(footX+0.9,footY,0.9+lift,2.7,1.8,1.1,'#2a2212',0,sd*0.15);
  }
  // tail (lower body; sways, lifts when winding up)
  { const ts=Math.sin(t*4)*1.2+(spin?2.5:0), ts2=Math.sin(t*4+1)*2.4, tz=tailUp*4;
    foL(-3,0,hip+0.6,-8.4,ts,hip-1.6+tz*0.6,2.5,sk,1.7);
    foL(-8.4,ts,hip-1.6+tz*0.6,-13.4,ts2,2.4+tz,1.7,skD,0.5); }
  // upper body
  foUp(); foSet(FOA,7.4,lean,wob,tw,lunge,0,hip-7.4+bob*0.3);
  const hz=20.8, pot=chief?1.25:1;
  foE(0,0,12.4,4.6,5.2,5.8,sk,0.12);
  foE(2.2*pot,0,11.6,2.5*pot,3.6*pot,4.3*pot,belly,0.12,0,0,0.05);
  foE(-0.2,0,8.6,4.6,5.4,2.6,foT(e,FOK.lea));
  if(!chief) foN(2.4,-3.3,16.4,3.7,3.2,9.8,1.3,'#3e2614',0.08);
  for(let i=0;i<2;i++) foC(-3.8,0,16.2-i*3.4,-6.6,0,17.4-i*3.4,1.25,skK,-4);
  // head
  foB(1.4,0,hz,5.7,sk);
  foE(5.8,0,hz-1.2,4.2,3.2,2.6,sk,0.12);
  foE(5.0,0,hz-3.0-jaw*1.3,3.3,2.6,1.1,skD,0.1+jaw*0.35);
  if(jaw>0.3){ foE(5.4,0,hz-2.5-jaw*0.6,2.7,2.1,1.0,'#6a1a14',0.1,0,0,-0.02); for(const sd of [-1,1]) foC(7.2,sd*1.3,hz-2.2,7.4,sd*1.3,hz-3.3,0.45,'#f6eedc',0.06); }
  if(chief) for(const sd of [-1,1]) foD(9.1,sd*1.0,hz-0.5,0.45,skK,0.04);
  // eyes and angry brows
  const patch=chief?-1:0;
  for(const sd of [-1,1]){
    if(sd===patch){ foE(4.6,sd*2.9,hz+1.3,1.4,2.0,2.0,'#1a1410',0,0,0,0.03); continue; }
    if(dz){ foD(4.9,sd*2.8,hz+1.2,1.7,'#ffffff',0.02); foD(4.9+Math.cos(t*9+sd)*0.6,sd*2.8,hz+1.2+Math.sin(t*9+sd)*0.6,0.75,'#1a1208',0.03); continue; }
    foD(4.9,sd*2.8,hz+1.2,1.55,FOK.eye,0.02); foD(5.3,sd*2.9,hz+1.2,0.72,'#1a1208',0.03); foD(5.4,sd*2.45,hz+1.8,0.42,'#ffffff',0.04);
    foL(4.8,sd*1.4,hz+2.5,4.1,sd*4.0,hz+3.4,0.6,skK,0.45,0.03);
  }
  if(sneak){ foL(2.6,-5.2,hz+1.4,6.0,0,hz+1.3,1.7,'#2a1a24',1.7,0.005); foL(6.0,0,hz+1.3,2.6,5.2,hz+1.4,1.7,'#2a1a24',1.7,0.005); }
  if(chief){ foN(4.4,1.2,hz+3.6,4.6,-3.0,hz+0.6,0.5,'#1a1410',0.02); foN(-2,-5.2,hz+2.4,2.4,-4.6,hz+2.8,0.5,'#1a1410'); for(const sd of [-1,1]) if(sd!==patch) foN(4.4,sd*3.8,hz-0.6,6.4,sd*2.7,hz-1.2,0.7,'#c83a2a',0.03); }
  // horns and crest (elites get gold horns)
  const horn=e.elite?'#f0c050':skK;
  for(const sd of [-1,1]) foC(-0.4,sd*3.0,hz+2.6,-5.6,sd*5.2,hz+4.6,1.3,horn);
  foC(-0.8,0,hz+4.6,-4.8,0,hz+7.0,1.1,horn);
  if(chief){ for(let i=-1;i<=1;i++) foC(0.6+Math.abs(i)*-0.6,i*2.2,hz+4.4,0.2+Math.abs(i)*-1,i*2.6,hz+8.6-Math.abs(i)*1.2,0.9,FOK.bone,0.02); }
  // arms and what they hold
  if(kind===0){
    const ax=-7.6+pull, ay=4.9, az=10.6, bx=14+pull, by=3.4, bz=12.6;
    foN(ax,ay,az,bx,by,bz,1.3,FOK.wood,0.02);
    foC(bx-0.4,by,bz,bx+5.4,by-0.15,bz+0.4,1.55,e.elite?'#f0c050':FOK.steel,0.02);

    const h1x=ax+(bx-ax)*0.32, h1y=ay+(by-ay)*0.32, h1z=az+(bz-az)*0.32, h2x=ax+(bx-ax)*0.62, h2y=ay+(by-ay)*0.62, h2z=az+(bz-az)*0.62;
    foL(0.6,4.6,15.6,h1x,h1y,h1z,1.5,sk,1.3); foB(h1x,h1y,h1z,1.5,sk,0.03);
    foL(0.6,-4.6,15.6,h2x,h2y,h2z,1.5,sk,1.3); foB(h2x,h2y,h2z,1.5,sk,0.03);
  }else if(sneak){
    const sb=Math.abs(Math.sin(w))*mv*1.2;
    foB(-5.0,3.2,18.4+sb,4.9,'#c8a050');
    foB(-2.8,3.6,22.4+sb,1.3,'#8a6a2a',0.02); foE(-3.4,3.4,23.6+sb,1.3,1.3,0.45,'#ffd84a',0.4,0,0,0.04);
    foL(0.6,4.6,15.6,-1.4,4.6,20.6+sb,1.5,sk,1.3); foB(-1.6,4.2,21.2+sb,1.5,sk,0.03);
    const s=-Math.sin(w)*mv; foL(0.6,-4.6,15.6,s*4.6,-6,11.2,1.5,sk,1.3); foB(s*4.8,-6.1,10.8,1.5,sk);
    if(e.tired>0) foE(7.6,0.6,hz-3.4,1.6,1.0,0.5,'#e86a7a',0.5,0,0,0.05);
  }else{
    // fur cloak, collar, bone necklace
    const fl2=Math.sin(t*3)*0.8;
    foE(-1.8,0,15.6,4.2,6.6,6.4,FOK.fur,0,0,0,-0.05);
    foQ([-2.8,-5.8,17.2, -2.8,5.8,17.2, -6.6-fl2,7.6,3.4, -5.6,4.0,5.0, -7.0-fl2,0,2.6, -5.6,-4.0,5.0, -6.6-fl2,-7.6,3.4],FOK.furD,'#3a2e22',-0.1);
    for(let i=0;i<5;i++){ const a=Math.PI*0.4+i*Math.PI*1.2/4; foE(Math.cos(a)*4.2-0.6,Math.sin(a)*5.0,17.6+(i%2)*0.6,3.0,3.2,2.6,i%2?FOK.fur:FOK.furL,0.3,a); }
    for(let i=-2;i<=2;i++){ const a=i*0.36; foC(Math.cos(a)*4.3+0.4,Math.sin(a)*4.9,16.4,Math.cos(a)*4.6+0.8,Math.sin(a)*5.1,14.0,0.6,FOK.bone,0.06); }
    // hands and cleavers
    for(const sd of [-1,1]){
      const H=_fkH, D=_fkD, E=_fkE; let hold=true;
      const sw=-Math.sin(w)*mv*sd;
      H[0]=2+sw*3; H[1]=sd*6.8; H[2]=10.6; D[0]=0.75; D[1]=sd*0.12; D[2]=-0.55; E[0]=0.4; E[1]=0; E[2]=0.9;
      if(st==='cleave'){ const p=foSm(clamp(1-e.st/0.45,0,1)); H[0]=lerp(2,-1,p); H[1]=sd*lerp(6.8,4.2,p); H[2]=lerp(10.6,28.5,p); D[0]=lerp(0.75,-0.5,p); D[1]=sd*0.2*p; D[2]=lerp(-0.55,0.8,p); E[0]=lerp(0.4,0.3,p); E[1]=sd*0.85*p; E[2]=lerp(0.9,0.4,p); }
      else if(st==='recover'&&e._pst==='cleave'&&inS<0.45){ H[0]=9.5; H[1]=sd*3.4; H[2]=9; D[0]=0.55; D[1]=0; D[2]=-0.85; E[0]=0.85; E[2]=0.5; }
      else if(st==='spinW'){ const p=foSm(clamp(1-e.st/0.65,0,1)); H[0]=lerp(2,-2.5,p); H[1]=sd*lerp(6.8,10.5,p); H[2]=lerp(10.6,14.5,p); D[0]=lerp(0.75,-0.7,p); D[1]=sd*0.55*p; D[2]=lerp(-0.55,0,p); E[0]=0; E[1]=0; E[2]=1; }
      else if(spin){ H[0]=0.5; H[1]=sd*12; H[2]=14.6; D[0]=0.1; D[1]=sd; D[2]=0.05; E[0]=-sd*1; E[1]=0; E[2]=0.2; }
      else if(dz){ H[0]=1.5; H[1]=sd*7.4; H[2]=7.6+Math.sin(t*5+sd)*0.8; D[0]=0.2; D[1]=0; D[2]=-1; E[0]=1; E[1]=0; E[2]=0; }
      else if(st==='bombs'&&sd<0){ const p=foSm(clamp(1-e.st/0.5,0,1)); H[0]=lerp(2,-3.4,p); H[1]=-lerp(6.8,6.4,p); H[2]=lerp(10.6,25,p); hold=false; bombUp=true; }
      else if(st==='recover'&&e._pst==='bombs'&&inS<0.4&&sd<0){ H[0]=10; H[1]=-4; H[2]=17; hold=false; }
      else if(stun){ H[2]=8.6; D[0]=0.3; D[2]=-0.95; }
      foL(0.4,sd*4.8,15.6,H[0],H[1],H[2],1.9,sk,1.6); foB(H[0],H[1],H[2],1.8,sk,0.03);
      if(hold){ foNorm(D); const dd=E[0]*D[0]+E[1]*D[1]+E[2]*D[2]; E[0]-=dd*D[0]; E[1]-=dd*D[1]; E[2]-=dd*D[2]; foNorm(E); foCleaver(H[0],H[1],H[2],D[0],D[1],D[2],E[0],E[1],E[2]); }
      else if(bombUp){ // a fizzing bomb held up and back
        foB(H[0]-0.6,H[1],H[2]+2.4,2.7,'#2a2a32',0.04); foD(H[0]-1.6,H[1]-1,H[2]+3.6,0.7,'#8a8a96',0.06);
        foN(H[0]-0.6,H[1],H[2]+5,H[0]-1.6,H[1],H[2]+6.4,0.6,'#c8a060',0.05);
        const fz=0.6+0.4*Math.sin(t*40); foGlow(H[0]-1.6,H[1],H[2]+6.6,4*fz,'255,210,90',0.9); foD(H[0]-1.6,H[1],H[2]+6.6,0.8,'#fff4b0',0.07);
      }
    }
  }
  foEnd(12);
  e._t3top=foTop(fy,chief?29.5:sneak?26:27.5,k,dz?0:0);
}
T3E.kobold=(e,fl)=>foKobold(e,fl,0);
T3E.sneak=(e,fl)=>foKobold(e,fl,1);
T3E.grizzlefang=(e,fl)=>foKobold(e,fl,2);

// ================= cultists of the Scaled Oath (hooded robes, glowing casting hands) and High Priest Morrow
const FOC={rb:['#6a4280','#4a2a5c','#2a1436'],pr:['#8a4aa0','#5e2a74','#2e1040'],trim:'#9a5a32',gold:'#e0b048',skin:'#d8b898',rope:'#a8844a',hole:'#0a0408'};
function foCastDur(st){ return st==='cast'?0.65:st==='volley'?0.5:st==='ring'?0.8:st==='orbs'?0.6:st==='summon'?0.8:0; }
function foCultist(e,fl,priest){
  const dt=foDt(e), t=e.t||0, st=e.state, k=priest?1.42*e.r/19:e.r/13;
  foSt(e);
  const dur=foCastDur(st), casting=dur>0, cg=casting?foSm(clamp(1-e.st/dur,0,1)):0, stun=e.stun>0, dead=foDeath(e);
  let face=t3Turn(e,e.face,10), zl=0;
  if(priest&&(st==='blinkOut'||st==='blinkIn')){ const a=clamp(e.alpha==null?1:e.alpha,0,1); face+=(1-a)*TAU*0.9*(st==='blinkOut'?1:-1); zl=(1-a)*6; }
  const mv=foWalk(e,dt,4.2*k), w=e._wp||0, fx=e.x, fy=e.y+e.r*0.45;
  const P=priest?FOC.pr:FOC.rb, rb0=fl?'#ffffff':foT(e,P[0]), rb1=foT(e,P[1]), rb2=foT(e,P[2]), trim=priest||e.elite?FOC.gold:FOC.trim;
  const fireC='255,170,70', violet='210,130,255', hot=priest&&(st==='orbs'||st==='summon')?violet:fireC;
  // hand targets (eased so poses blend)
  let lx=5.6,ly=-2.1,lz=15.6, rx=5.6,ry=2.1,rz=15.6, lean=0.04*mv;
  const bob=Math.abs(Math.cos(w))*mv*0.7;
  if(st==='cast'){ lx=rx=lerp(5.6,9.2,cg); ly=-lerp(2.1,4.2,cg); ry=-ly; lz=rz=lerp(15.6,21.5,cg); lean=-0.12*cg; }
  else if(st==='volley'){ lx=rx=lerp(5.6,10.4,cg); ly=-lerp(2.1,6.4,cg); ry=-ly; lz=rz=lerp(15.6,19.5,cg); lean=0.1*cg; }
  else if(st==='ring'){ lx=rx=lerp(5.6,2,cg); ly=-lerp(2.1,9.4,cg); ry=-ly; lz=rz=lerp(15.6,32,cg); lean=-0.16*cg; }
  else if(st==='orbs'){ lx=rx=lerp(5.6,8.4,cg); ly=-lerp(2.1,3.4,cg); ry=-ly; lz=rz=lerp(15.6,16.8,cg); lean=0.1*cg; }
  else if(st==='summon'){ lx=rx=lerp(5.6,1.5,cg); ly=-lerp(2.1,7.8,cg); ry=-ly; lz=rz=lerp(15.6,35,cg); lean=-0.22*cg; }
  else if(st==='recover') lean=0.08;
  if(stun){ lx=rx=4; ly=-6.5; ry=6.5; lz=rz=10; lean=0.25; }
  const hp=foEase(e,'_fh',foTg(lx,ly,lz,rx,ry,rz,lean),dt,casting?18:9);
  // Morrow's summoning circle glows on the ground under him
  if(priest&&st==='summon'){ const gg=foG(), pa=gg.globalAlpha, pc=gg.globalCompositeOperation; gg.globalCompositeOperation='lighter'; gg.globalAlpha=pa*(0.3+0.4*cg); gg.drawImage(foGlowSpr(violet),fx-40*k,fy-40*k*T3.ct,80*k,80*k*T3.ct); gg.globalAlpha=pa; gg.globalCompositeOperation=pc; }
  foBegin(fx,fy,face,k,fl,zl);
  if(dead) foSet(FOB,0,-1.25*dead,0,0,-4*dead,0,0);
  // feet peeking out under the hem
  foLow();
  for(const sd of [-1,1]){ const s=Math.sin(w)*mv*sd; foE(6.6+s*2.6,sd*2.6,0.9+Math.max(0,Math.cos(w)*sd)*mv*1.2,2.4,1.7,1.1,'#2a1a14'); }
  foUp(); foSet(FOA,10,hp[6]+(stun?Math.sin(t*6)*0.06:0),stun?Math.sin(t*7)*0.18:Math.sin(w)*mv*0.05,0,0,0,bob*0.5);
  // robe, hem, rope belt, chest, stole
  // the robe is a stack of frustums (each one draws over the one below it, so the hem and belt read as bands)
  foY(0,0,0,7.8,7.4,2.2,priest?FOC.gold:rb2);
  foY(0,0,2.2,7.4,6.0,9.2,rb1);
  foY(0,0,11.4,6.1,5.95,1.4,priest?FOC.gold:FOC.rope);
  foY(0,0,12.8,5.8,4.8,6.8,rb1);
  foE(0.2,0,20.8,4.8,6.0,4.8,rb0);
  for(const sd of [-1,1]) foQ([4.4,sd*1.5,23, 4.8,sd*3.4,22.8, 6.8,sd*3.6,8.2, 6.6,sd*1.5,8.2],trim,null,0.35);
  foD(5.6,0,19.4,priest?1.5:1.1,priest?'#e8304a':'#e8843a',0.4);
  if(priest){ // a short mantle with a gold edge
    foE(-0.6,0,23.4,5.4,7.6,3.4,rb2,0,0,0,-0.05);
    foE(-0.4,0,22.2,5.8,8.0,1.2,FOC.gold,0,0,0,-0.08);
  }
  // sleeves and hands
  for(const sd of [-1,1]){
    const hx=sd<0?hp[0]:hp[3], hy=sd<0?hp[1]:hp[4], hz=sd<0?hp[2]:hp[5];
    foL(0.4,sd*5.4,23.6,hx-1.0,hy,hz+0.4,2.1,rb1,3.1);
    foB(hx,hy,hz,1.75,casting?(hot===violet?'#f0c8ff':'#ffd27a'):FOC.skin,0.03);
    if(casting) foGlow(hx,hy,hz,(priest?5.5:4.5)+cg*4.5,hot,0.4+0.45*cg,true);
  }
  if(st==='cast'&&cg>0.3){ const r=0.6+cg*2.2; foB(10.4,0,21.6,r,'#ffe9a8',0.1); foGlow(10.4,0,21.6,r*3.4,fireC,0.85,true); }
  if(priest&&st==='orbs'){ for(let i=-1;i<=1;i++){ const r=0.4+cg*1.8, oz=21.5+Math.sin(t*8+i)*0.8; foB(9.6,i*3.4,oz,r,'#f4d8ff',0.1); foGlow(9.6,i*3.4,oz,r*2.6,violet,0.55,true); } }
  if(priest){ // the staff of the Oath, in his right hand
    const hx=hp[3], hy=hp[4], hz=hp[5];
    foN(hx-0.5,hy+0.3,hz-17,hx+0.5,hy-0.2,hz+15,1.3,'#b8862e',0.02);
    foB(hx+0.6,hy-0.2,hz+16.6,2.2,'#c890ff',0.06); foN(hx+0.4,hy-0.2,hz+14,hx+0.6,hy-0.2,hz+19,0.6,FOC.gold,0.07);
    foGlow(hx+0.6,hy-0.2,hz+16.6,8+(casting?6*cg:2*Math.sin(t*3)),violet,0.7,true);
  }
  // hood, peak, the dark face hole and glowing eyes
  foB(0.2,0,28.8,6.7,rb0);
  if(priest){ foC(0.2,0,32.4,-1.2,0,44.5,4.8,rb0); foY(0.2,0,32.6,5.3,5.1,1.5,FOC.gold,null,0.3,true); foD(5.2,0,35.6,1.1,'#e8304a',0.2); for(const sd of [-1,1]){ foC(0.6,sd*4.6,33.4,1.8,sd*8.6,37.4,1.5,FOC.gold); foC(1.8,sd*8.6,37.4,3.6,sd*8.4,41.2,0.9,FOC.gold); } }
  else foC(-2.2,0,32.2,-8.4,0,34.6+Math.sin(t*2)*0.6,3.5,rb0,-1.5);
  foE(3.8,0,28.0,2.8,5.4,5.9,rb1,0,0,0,0.02);
  foE(4.5,0,27.8,2.6,4.3,4.8,FOC.hole,0,0,0,0.04);
  const ey=priest&&e.hp<e.maxHp*0.5?'#ff5a7a':'#ff9a3a';
  for(const sd of [-1,1]){ foD(6.9,sd*1.6,28.4,0.95,ey,0.08); foGlow(6.9,sd*1.6,28.4,2.6,priest?'255,140,200':'255,160,70',0.6,true); }
  foEnd(16);
  // Morrow's orbiting wisps (they orbit in the world, like the old art)
  if(priest&&(e.alpha==null||e.alpha>0.5)){
    foBegin(fx,fy,0,1,fl,0);
    for(let i=0;i<3;i++){ const a=t*2+i*TAU/3, x=Math.cos(a)*30, y=Math.sin(a)*30, z=26*k+Math.sin(t*3+i)*3; foB(x,y,z,2.4,'#f6d8ff'); foGlow(x,y,z,8,'255,190,255',0.85); }
    foEnd(26*k);
  }
  e._t3top=foTop(fy,priest?44:36,k,zl);
}
T3E.cultist=(e,fl)=>foCultist(e,fl,false);
T3E.morrow=(e,fl)=>foCultist(e,fl,true);

// ================= drakelings (small flying dragons) and the Brood Mother (a big pink drake with a frill)
const FODR={d:['#e8844a','#b4542a','#5a2410'],b:['#c8507a','#8a2a50','#3a0a1e'],dBelly:'#f6cf98',bBelly:'#f4b8c8',dWing:'#dc7c46',bWing:'#b8467a',horn:'#efe0c0',frill:'#f49ab8'};
const _fw=[0,0,0];
// a wing point: (x along the body, u out along the wing) folded up by the flap angles (th1 for the arm, th2 for the hand)
function foWing(s,x,u,th1,th2,ry0,zr,v){ const u1=Math.min(u,8), u2=Math.max(0,u-8); v[0]=x; v[1]=s*(ry0+u1*Math.cos(th1)+u2*Math.cos(th2)); v[2]=zr+u1*Math.sin(th1)+u2*Math.sin(th2); return v; }
// wing outline: [x, u, u is a fraction of the span, how much a charge sweeps it back]. Leading edge A, wrist B, tip T,
// then a scalloped trailing edge with two finger tips back to the body.
const FOWT=[[4.4,0,0,0],[0.6,8,0,0.3],[-3,1,1,1],[-5.2,0.66,1,0.8],[-9.8,0.72,1,0.7],[-8.2,0.42,1,0.5],[-11.4,0.38,1,0.4],[-7.4,0.16,1,0.2],[-6.6,0,0,0]], FOWF=new Array(27).fill(0), FOFR=new Array(18).fill(0);
function foDrake(e,fl,brood){
  const g=foG(), dt=foDt(e), t=e.t||0, st=e.state, inS=foSt(e), k=brood?2.3*e.r/32:e.r/13, dead=foDeath(e), stun=e.stun>0;
  const face=t3Turn(e,e.face,brood?7:10), fx=e.x, fy=e.y+e.r*0.45;
  const C=brood?FODR.b:FODR.d, bc0=fl?'#ffffff':foT(e,C[0]), bc1=foT(e,C[1]), bc2=foT(e,C[2]), belly=foT(e,brood?FODR.bBelly:FODR.dBelly), wingC=foT(e,brood?FODR.bWing:FODR.dWing);
  const horn=e.elite?'#f0c050':FODR.horn;
  // pose targets: body pitch, height, head position (x,z), jaw, wing flap speed, sweep, spread, tail curl
  let pitch=0, zb=brood?19:17, hx=10, hz=5, jaw=0, fr=brood?9:15, sweep=0, hold=-1, curl=0, glowM=0, glowC=0;
  if(st==='aim'){ const p=foSm(clamp(1-e.st/(brood?0.85:0.6),0,1)); pitch=-0.38*p; zb+=(brood?-5:-1)*p; hx=9; hz=7+p; jaw=0.4*p; hold=0.95; curl=p; }
  else if(st==='charge'){ pitch=0.24; zb-=brood?7:5; hx=11.6; hz=3.4; sweep=1; fr=brood?20:30; jaw=0.3; }
  else if(st==='recover'){ fr=brood?7:11; zb-=1.5; }
  else if(st==='breathW'){ const p=foSm(clamp(1-e.st/0.75,0,1)); pitch=-0.25*p; zb-=10*p; hx=lerp(10,7.4,p); hz=lerp(5,9.5,p); glowC=p; fr=8; }
  else if(st==='breath'){ pitch=0.12; zb-=11; hx=12; hz=3.6; jaw=1; glowM=1; fr=7; }
  else if(st==='eggs'){ const p=foSm(clamp(1-e.st/0.7,0,1)); zb=lerp(zb,6,p); pitch=-0.55*p; curl=-p; fr=6; jaw=0.3; }
  if(stun){ zb-=4; fr=5; jaw=0.4; }
  if(dead){ zb*=1-dead; pitch=-0.4*dead; fr=0; }
  const P=foEase(e,'_fd',foTg(pitch,zb,hx,hz,jaw,sweep,curl),dt,st==='charge'?16:8);
  pitch=P[0]; zb=P[1]; hx=P[2]; hz=P[3]; jaw=P[4]; sweep=P[5]; curl=P[6];
  e._flp=(e._flp||t)+dt*fr; const ph=e._flp, th=hold>=0?hold+Math.sin(t*30)*0.05:(dead?-0.5:Math.sin(ph)*0.85+0.12);
  const hov=dead?0:Math.sin(t*3)*1.6, z=zb+hov;
  // ground shadow under the flyer
  foShadow(fx,fy,(brood?20:11)*k*(1-clamp(z/90,0,0.5)),0.36*(1-clamp(z/80,0,0.6)));
  foBegin(fx,fy,face,k,fl,z);
  foSet(FOB,0,pitch,stun?Math.sin(t*6)*0.2:Math.sin(t*1.7)*0.06,0);
  foLow();
  // body, chest, belly
  foE(-0.5,0,0,7.8,4.5,4.3,bc0);
  foE(4.2,0,0.8,4.4,4.0,3.9,bc0);
  foE(1,0,-1.9,6.4,3.3,2.5,belly,0,0,0,-0.2);
  if(brood){ for(let i=0;i<4;i++) foE(5-i*3.2,0,-2.6+i*0.15,1.3,2.6,0.8,shd(belly,0.15),0.1,0,0,-0.15); }
  // back spines
  for(let i=0;i<(brood?5:3);i++){ const x=3.6-i*2.9; foC(x,0,3.2-i*0.15,x-1.6,0,(brood?7.2:6.2)-i*0.25,brood?1.2:0.9,bc2,-4); }
  // tucked legs (they reach down while laying eggs)
  for(const sd of [-1,1]){
    const dn=Math.max(0,-curl)*4;
    foL(3,sd*3.2,-1.8,4.4,sd*3.4,-4.6-dn,1.2,bc1,1.0); if(brood) foB(4.8,sd*3.4,-5-dn,1.1,bc2);
    foL(-4,sd*3.2,-1.6,-3.2,sd*3.6,-5.2-dn,1.6,bc1,1.2); if(brood) foB(-2.8,sd*3.6,-5.6-dn,1.2,bc2);
  }
  // tail with a spade tip
  { const sw=Math.sin(t*5)*2.2, sw2=Math.sin(t*5+1.1)*3.4, cz=curl*5;
    foL(-6.8,0,0.2,-12.4,sw,-0.8+cz*0.5,2.5,bc0,1.7); foL(-12.4,sw,-0.8+cz*0.5,-18,sw2,0.4+cz,1.7,bc1,0.6);
    foQ([-17.6,sw2,0.4+cz, -21,sw2+2,1+cz, -23.4,sw2,1.4+cz, -21,sw2-2,1+cz],bc2,null,0.1); }
  // wings: arm panel and hand panel per side
  const span=brood?17:15.5, th1=th*0.55, th2=th;
  for(const sd of [-1,1]){
    const sx=-6*sweep, su=1-0.3*sweep, W=FOWF;
    for(let i=0;i<9;i++){ const q=FOWT[i]; foWing(sd,q[0]+sx*q[3],(q[2]?q[1]*span:q[1])*su,th1,th2,2.4,2.4,_fw); W[i*3]=_fw[0]; W[i*3+1]=_fw[1]; W[i*3+2]=_fw[2]; }
    foQ(W,wingC,bc2,0);
    foN(W[0],W[1],W[2],W[3],W[4],W[5],brood?1.6:1.3,bc1,0.05); foN(W[3],W[4],W[5],W[6],W[7],W[8],brood?1.2:1.0,bc1,0.05);
    foN(W[3],W[4],W[5],W[12],W[13],W[14],0.6,bc1,0.04); if(brood) foN(W[3],W[4],W[5],W[18],W[19],W[20],0.6,bc1,0.04);
    if(brood) foC(W[3],W[4],W[5],W[3]+1,W[4]+sd*0.6,W[5]+1.4,0.6,horn,0.06);
  }
  // neck and head
  foL(5.8,0,1.8,hx-1.6,0,hz-0.6,2.6,bc0,2.1);
  foB(hx,0,hz,4.0,bc0);
  foE(hx+3.5,0,hz-0.6,3.5,2.5,2.0,bc0,0.1);
  foE(hx+3.0,0,hz-2.3-jaw*1.4,3.0,2.0,0.9,bc1,0.1+jaw*0.55);
  if(jaw>0.25){ foE(hx+3.2,0,hz-1.7-jaw*0.7,2.5,1.6,0.9,'#5a1008',0.1,0,0,-0.02); for(const sd of [-1,1]) foC(hx+5.2,sd*1.2,hz-1.8,hx+5.4,sd*1.2,hz-2.9,0.45,'#fff4e0',0.05); }
  for(const sd of [-1,1]){
    foD(hx+2.2,sd*2.5,hz+1.3,1.3,'#ffe066',0.02); foD(hx+2.6,sd*2.55,hz+1.3,0.6,'#2a0a04',0.03); foD(hx+2.7,sd*2.2,hz+1.8,0.36,'#ffffff',0.04);
    foL(hx+2.0,sd*1.2,hz+2.8,hx+1.0,sd*3.2,hz+3.4,0.5,bc2,0.38,0.03);
    foC(hx-0.6,sd*1.8,hz+2.8,hx-4.6,sd*2.9,hz+5.6,brood?1.3:1.05,horn);
    if(brood) foD(hx+6,sd*0.8,hz-0.2,0.35,bc2,0.04);
  }
  if(brood){
    // a second pair of horns and the frill fan behind the head
    for(const sd of [-1,1]) foC(hx-1.2,sd*2.6,hz+0.6,hx-5.4,sd*4.6,hz+1.4,0.9,horn);
    const n=5, cx=hx-1.4, cz=hz+0.8, fan=1+0.08*Math.sin(t*4);
    const pts=FOFR; for(let i=0;i<=n;i++){ const a=-1.35+i*2.7/n; pts[i*3]=cx-2.6-Math.cos(a)*2.4; pts[i*3+1]=Math.sin(a)*6.6*fan; pts[i*3+2]=cz+Math.cos(a)*5.4*fan; }
    for(let i=0;i<n;i++){ foQ([cx,0,cz, pts[i*3],pts[i*3+1],pts[i*3+2], pts[i*3+3],pts[i*3+4],pts[i*3+5]],FODR.frill,bc1,-0.4,true); }
    for(let i=0;i<=n;i++) foN(cx,0,cz,pts[i*3],pts[i*3+1],pts[i*3+2],0.6,bc1,-0.3);
  }
  // fire: a glow in the chest while she draws breath, a roaring glow at the mouth while breathing
  if(glowC>0){ foGlow(3,0,0.5,(brood?9:6)*(0.6+glowC),'255,140,60',0.35+0.5*glowC); foGlow(hx+4,0,hz-1,4*glowC,'255,200,120',0.6*glowC); }
  if(glowM>0){ const f=0.85+0.15*Math.sin(t*40); foGlow(hx+6.5,0,hz-1.4,10*f,'255,210,130',0.95); foGlow(hx+10,0,hz-2,14*f,'255,120,40',0.55); }
  if(st==='aim'||st==='charge') foGlow(hx+2,0,hz+1.4,3,'255,230,120',0.5,true);
  foEnd(0);
  e._t3top=foTop(fy,brood?12:10,k,z);
}
T3E.drakeling=(e,fl)=>foDrake(e,fl,false);
T3E.broodmother=(e,fl)=>foDrake(e,fl,true);

// ================= knights of the Obsidian Gate (sword and shield) and Sir Cindervane, their champion (red cape, cracks of fire)
const FOKN={st:['#6c717c','#3e424c','#18191e'],ch:['#4e525e','#2c2e36','#121216'],shield:'#2e2e38',rim:'#c8aa6e',gold:'#d0a444',
  cape:'#a01e16',capeD:'#4a0a08',tab:'#6e1c18',blade:'#d6dae0',grip:'#3a2a1a',plume:'#d8301e',horn:'#24242a'};
const _kp=[0,0,0], _kn=[0,0,0], _ku=[0,0,0], _kv=[0,0,0], FOSH=new Array(21).fill(0), FOEM=new Array(12).fill(0);
// a sword in hand h pointing along d (unit)
function foSword(hx,hy,hz,dx,dy,dz,len,w){
  let px=dy, py=-dx; const pl=Math.hypot(px,py); if(pl<0.2){ px=0; py=1; } else { px/=pl; py/=pl; }
  foN(hx-dx*3.2,hy-dy*3.2,hz-dz*3.2,hx+dx*1.2,hy+dy*1.2,hz+dz*1.2,1.8,FOKN.grip,0.01);
  foB(hx-dx*3.7,hy-dy*3.7,hz-dz*3.7,1.25,FOKN.gold,0.02);
  foN(hx+dx*1.4-px*3.9,hy+dy*1.4-py*3.9,hz+dz*1.4,hx+dx*1.4+px*3.9,hy+dy*1.4+py*3.9,hz+dz*1.4,1.7,FOKN.gold,0.02);
  foL(hx+dx*1.7,hy+dy*1.7,hz+dz*1.7,hx+dx*len,hy+dy*len,hz+dz*len,w,FOKN.blade,0.3,0.01);
  foN(hx+dx*2.8,hy+dy*2.8,hz+dz*2.8,hx+dx*(len-5),hy+dy*(len-5),hz+dz*(len-5),w*0.4,'#8a929c',0.02);
}
// a heater shield centred at c, facing n (unit); s scales it
const FOSHP=[-6,7, 6,7, 6.5,0.6, 3.9,-6, 0,-9.6, -3.9,-6, -6.5,0.6], FOEMQ=[0,4.4, 2.8,0.4, 0,-5, -2.8,0.4];
function foShield(cx,cy,cz,nx,ny,nz,s,face,rim,emb){
  // v: up, made perpendicular to n; u = v x n
  let vx=-nz*nx, vy=-nz*ny, vz=1-nz*nz; const vl=Math.hypot(vx,vy,vz)||1; vx/=vl; vy/=vl; vz/=vl;
  const ux=vy*nz-vz*ny, uy=vz*nx-vx*nz, uz=vx*ny-vy*nx;
  for(let i=0;i<7;i++){ const u=FOSHP[i*2]*s, v=FOSHP[i*2+1]*s; FOSH[i*3]=cx+ux*u+vx*v; FOSH[i*3+1]=cy+uy*u+vy*v; FOSH[i*3+2]=cz+uz*u+vz*v; }
  foQ(FOSH,face,rim,0);
  const ox=cx+nx*0.55, oy=cy+ny*0.55, oz=cz+nz*0.55, E=FOEM, q=FOEMQ;
  for(let i=0;i<4;i++){ const u=q[i*2]*s, v=q[i*2+1]*s; E[i*3]=ox+ux*u+vx*v; E[i*3+1]=oy+uy*u+vy*v; E[i*3+2]=oz+uz*u+vz*v; }
  foQ(E,emb,null,0.02,true);
  foB(cx+nx*1.0+vx*1.2*s,cy+ny*1.0+vy*1.2*s,cz+nz*1.0+vz*1.2*s,1.3*s,rim,0.03);
}
// points on an ellipsoid's surface (for cracks of fire): yaw angle u, elevation v
function foSurf(cx,cy,cz,rx,ry,rz,u,v,o){ const c=Math.cos(v); o[0]=cx+rx*c*Math.cos(u)*1.02; o[1]=cy+ry*c*Math.sin(u)*1.02; o[2]=cz+rz*Math.sin(v)*1.02; return o; }
// crack paths on the breastplate as [u,v] pairs (yaw from the front, elevation)
const FOCRK=[[[-0.55,0.55],[-0.2,0.15],[-0.5,-0.2],[-0.15,-0.62]],[[0.5,0.6],[0.25,0.2],[0.6,-0.1]],[[0.15,-0.25],[0.45,-0.55]]];
const _kc0=[0,0,0], _kc1=[0,0,0];
function foCracks(cx,cy,cz,rx,ry,rz,list,w,col,glow,a){
  for(const path of list) for(let i=0;i<path.length-1;i++){
    foSurf(cx,cy,cz,rx,ry,rz,path[i][0],path[i][1],_kc0); foSurf(cx,cy,cz,rx,ry,rz,path[i+1][0],path[i+1][1],_kc1);
    foN(_kc0[0],_kc0[1],_kc0[2],_kc1[0],_kc1[1],_kc1[2],w,col,0.06);
    if(glow&&i===0) foGlow(_kc0[0],_kc0[1],_kc0[2],4.5,glow,a,true);
  }
}
// knight poses (see foKnight): [hand xyz, blade dir xyz, shield centre xyz, shield normal xyz, lean, twist, crouch]
const FOKP=new Array(15).fill(0);
const FOKREST=[6.5,9,15, 0.72,0.08,0.69, 9.6,-3.2,18.5, 1,-0.22,0, 0,0,0];
const FOKRR=[-1.5,8.2,31.5, -0.62,0.3,0.73, 0,0,0,0,0,0, -0.08,0.32,0];     // sword raised over the right shoulder
const FOKRL=[0,-4.5,31, -0.5,-0.55,0.68, 0,0,0,0,0,0, -0.06,-0.3,0];       // raised over the left shoulder (backhand)
const FOKOV=[1.5,2.2,38.5, -0.15,0.05,1, 0,0,0,0,0,0, -0.14,0,-0.5];       // overhead for the quake
const FOKSR=[10,-4,13.5, 0.5,-0.82,-0.28, 0,0,0,0,0,0, 0.16,-0.38,0];     // after a forehand slash
const FOKSL=[10,9.5,13.5, 0.5,0.82,-0.28, 0,0,0,0,0,0, 0.16,0.34,0];      // after a backhand slash
const FOKPL=[11.5,1.5,12.5, 0.34,0,-0.94, 0,0,0,0,0,0, 0.32,0,2.6];       // sword planted after the quake
const FOKST=[5,10,9, 0.5,0.2,-0.85, 0,0,0,0,0,0, 0.24,0,1];               // stunned, sword drooping
const FOKCH=[-3,9.5,15, 0.85,0.2,0.48, 11,-1.5,17, 1,0,0.05, 0,0,0];      // charging: shield first, sword back
function foKSet(K,src,swordOnly){ const n=swordOnly?6:15; for(let i=0;i<n;i++) K[i]=src[i]; if(swordOnly){ K[12]=src[12]; K[13]=src[13]; K[14]=src[14]; } }
function foKRaise(K,p,to){ for(let i=0;i<6;i++) K[i]=lerp(FOKREST[i],to[i],p); K[12]=to[12]*p; K[13]=to[13]*p; K[14]=to[14]*p; }
function foKLow(K){ K[6]=3; K[7]=-10.6; K[8]=13.5; K[9]=0.35; K[10]=-1; K[11]=0.05; }
function foKnight(e,fl,champ,ally){
  const dt=foDt(e), t=e.t||0, st=e.state, inS=foSt(e), stun=e.stun>0, dead=foDeath(e);
  const k=champ?1.42*1.06*e.r/27:1.06*e.r/19, face=t3Turn(e,e.face,champ?7:8), fx=e.x, fy=e.y+e.r*0.45;
  const S=champ?FOKN.ch:FOKN.st, s0=fl?'#ffffff':foT(e,S[0]), s1=foT(e,S[1]), s2=foT(e,S[2]);
  const angry=champ&&!ally&&e.hp<e.maxHp*0.5, mv=foWalk(e,dt,(champ?7:6)*k), w=e._wp||0;
  // pose K: sword hand (0-2), blade direction (3-5), shield centre (6-8), shield normal (9-11), lean, twist, crouch (12-14)
  const K=FOKP; foKSet(K,FOKREST); K[12]=0.05*mv;
  if(!e.blocking&&!ally) foKLow(K);
  if(ally){ const sw=e.cd>2.85?(e.cd-2.85)/0.35:0; if(sw>0.5) foKRaise(K,foSm((1-sw)*2),FOKRR); else if(sw>0) foKSet(K,FOKSR,1); }
  else if(st==='windup'){ foKRaise(K,foSm(clamp(1-e.st/0.7,0,1)),FOKRR); foKLow(K); K[6]=4; K[7]=-10; }
  else if(st==='recover'&&e.swung>0){ foKSet(K,FOKSR,1); foKLow(K); }
  else if(st==='slashW'){ const c=e.combo|0; if(e.swung>0.12) foKSet(K,(c-1)%2===0?FOKSR:FOKSL,1); else foKRaise(K,foSm(clamp(1-e.st/(c?0.32:0.38),0,1)),c%2===0?FOKRR:FOKRL); }
  else if(st==='chargeAim'){ const p=foSm(clamp(1-e.st/0.75,0,1)); foKSet(K,FOKCH); K[12]=0.3*p; K[14]=2*p; }
  else if(st==='charge'){ foKSet(K,FOKCH); K[6]=11.5; K[12]=0.44; K[14]=1.2; }
  else if(st==='quakeW'){ foKRaise(K,foSm(clamp(1-e.st/0.85,0,1)),FOKOV); foKLow(K); }
  else if(st==='recover'&&e._pst==='quakeW'&&inS<1.1){ foKSet(K,FOKPL,1); foKLow(K); K[6]=5; }
  if(stun){ foKSet(K,FOKST,1); foKLow(K); }
  if(e.blockTxtT>0&&e.blocking){ K[6]-=2.4; K[11]=0.25; }
  const P=foEase(e,'_fk',K,dt,st==='charge'||e.swung>0?20:11);
  _kp[0]=P[3]; _kp[1]=P[4]; _kp[2]=P[5]; foNorm(_kp); _kn[0]=P[9]; _kn[1]=P[10]; _kn[2]=P[11]; foNorm(_kn);
  const hx=P[0], hy=P[1], hz=P[2], cx=P[6], cy=P[7], cz=P[8], lean=P[12], tw=P[13], cr=P[14];
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,-1.2*dead,0.2*dead,0,-5*dead,0,0);
  const hip=12-cr, wob=stun?Math.sin(t*6)*0.12:0, bob=Math.abs(Math.cos(w))*mv*0.8;
  // cape (champion) hangs from the shoulders behind
  if(champ){
    const fl1=Math.sin(t*3)*1.6, fl2=Math.sin(t*3+1.3)*1.6, run=st==='charge'?1:0, bx=-9-run*4.5, bz=1.5+run*4.5;
    foUp(); foSet(FOA,hip,lean,wob,tw,0,0,bob*0.4-cr*0.5);
    for(const sd of [-1,1]) foQ([-3.2,sd*8,27, -3.8,0,27.6, bx-1-fl2,0,bz-0.5, bx-fl1,sd*11,bz+0.8],FOKN.cape,FOKN.capeD,-0.6);
  }
  // legs (lower body)
  foLow();
  for(const sd of [-1,1]){
    const s=Math.sin(w)*mv*sd+(st==='charge'?Math.sin(t*16)*0.8*sd:0), lift=Math.max(0,Math.cos(w)*sd)*mv*1.6, wide=(st==='chargeAim'||cr>1.5)?1.6:0;
    const kx=1.4+s*2.4, ky=sd*(4+wide*0.6), kz=hip*0.55+lift*0.5, ax=s*4.4-(wide&&sd<0?2:0), ay=sd*(4.1+wide), az=2+lift;
    foL(0,sd*3.6,hip,kx,ky,kz,3.0,s1,2.7); foL(kx,ky,kz,ax,ay,az,2.7,s0,2.5);
    foB(kx+0.6,ky,kz,2.3,s0,0.1); foE(ax+1.9,ay,1.6,4.0,2.7,1.8,s2);
  }
  foUp(); foSet(FOA,hip,lean,wob,tw,0,0,bob*0.4-cr*0.5);
  // faulds, tabard, breastplate, gorget, pauldrons
  foY(0,0,hip-3.4,7.4,6.8,4.6,s1,s0);
  foQ([6.5,-2.7,17.4, 6.5,2.7,17.4, 7.7,2.5,hip-3.2, 7.7,-2.5,hip-3.2],champ?'#2a1a1a':FOKN.tab,null,0.4);
  foE(0.4,0,19.8,6.6,8.4,7.4,s0);
  foN(6.9,0,25,7.3,0,15.5,1.0,shd(S[0],0.35),0.05);
  if(champ){ const ca=angry?0.9:0.55+0.15*Math.sin(t*4); foCracks(0.4,0,19.8,6.6,8.4,7.4,FOCRK,angry?1.0:0.8,ally?'#ffc860':angry?'#ffc040':'#ff8a2a',angry?'255,150,50':'255,120,40',ally?0.35:ca); }
  foB(0,0,26.6,4.4,s1);
  for(const sd of [-1,1]){
    foB(-0.2,sd*8.9,25.2,4.7,s0);
    foE(-0.2,sd*8.9,23.6,5.1,5.1,1.4,champ||e.elite?FOKN.gold:s2,0,0,0,-0.1);
    if(champ) foN(1.6,sd*10.4,28.4,3.6,sd*9.6,25.6,0.8,angry?'#ffc040':'#ff8a2a',0.08);
  }
  // sword arm
  { const ex=(0.2+hx)/2-1.4, ey=(8.6+hy)/2+1.6, ez=(25+hz)/2-1.6;
    foL(0.2,8.6,25,ex,ey,ez,2.6,s1,2.4); foL(ex,ey,ez,hx,hy,hz,2.4,s0,2.2); foB(hx,hy,hz,2.3,s1,0.03);
    foSword(hx,hy,hz,_kp[0],_kp[1],_kp[2],champ?30:27,champ?1.5:1.3); }
  // shield arm
  { const sx=cx-_kn[0]*1.8, sy=cy-_kn[1]*1.8, sz=cz-_kn[2]*1.8, ex=(0.2+sx)/2-1, ey=(-8.6+sy)/2-1.8, ez=(25+sz)/2-1.8;
    foL(0.2,-8.6,25,ex,ey,ez,2.6,s1,2.4); foL(ex,ey,ez,sx,sy,sz,2.4,s0,2.2); foB(sx,sy,sz,2.2,s1);
    foShield(cx,cy,cz,_kn[0],_kn[1],_kn[2],champ?1.22:1.14,FOKN.shield,FOKN.rim,champ?'#c8402a':'#9a6a3a'); }
  // helm: visor slit glows orange (gold for an ally)
  foE(0.6,0,32.6,6.1,6.1,6.6,s0);
  foE(3.5,0,31.8,3.4,5.4,4.6,s1,0,0,0,0.02);
  const vis=ally?'#ffd070':angry?'#ffb040':'#ff8a2a';
  foN(6.7,-3.3,32.8,6.7,3.3,32.8,1.5,vis,0.05);
  foGlow(6.8,0,32.8,champ?6:4.5,ally?'255,210,120':'255,140,50',angry?0.9:0.6,true);
  if(champ){
    // a plume of red horsehair: a tapering chain of capsules that streams back and waves
    let px=2.4, py=0, pz=39.2;
    for(let i=1;i<=5;i++){ const wv=Math.sin(t*5-i*0.9)*0.8*i/5, nx2=2.4-i*2.5, nz2=39.6+Math.sin(i*0.7)*0.8-i*i*0.12+(st==='charge'?i*0.5:0); foL(px,py,pz,nx2,wv,nz2,2.6-(i-1)*0.36,FOKN.plume,2.6-i*0.36,0.04); px=nx2; py=wv; pz=nz2; }
    for(const sd of [-1,1]){ foC(0.6,sd*5,35.4,2.6,sd*9.6,38.6,1.7,FOKN.horn); foC(2.6,sd*9.6,38.6,4.4,sd*9.2,43,1.0,FOKN.gold); }
  }else foE(-0.2,0,38.8,5.6,1.3,1.8,e.elite?FOKN.gold:s1,0,0,0,0.03);
  foEnd(20);
  e._t3top=foTop(fy,champ?43:40,k);
}
T3E.knight=(e,fl)=>foKnight(e,fl,false,false);
T3E.cindervane=(e,fl)=>foKnight(e,fl,true,false);
// Cindervane as a final-battle ally: holds the stairs facing north and cuts down a drakeling every few seconds
T3A.cinder=a=>{
  let e=a._t3; if(!e){ e=a._t3={type:'cindervane',r:27,state:'chase',st:0,blocking:true,stun:0,dx:0,dy:0,hp:1,maxHp:1,swung:0,combo:0,speed:82}; }
  e.x=a.x; e.y=a.y; e.face=a.face; e.t=a.t; e.cd=a.cd; e.dx=a.dx||0; e.dy=a.dy||0;
  const g=foG(); g.save(); foKnight(e,false,true,true); g.restore();
};

// ================= Trial foes: snapper crabs, Mirrow eels, gust sprites and Bramblehorn
const _fu=[0,0,0], _fd=[0,0,0];
// a crab claw: palm at c, pointing along d (unit), fingers opened by op
function foClaw(cx,cy,cz,dx,dy,dz,op,c0,c1){
  let ux=-dz*dx, uy=-dz*dy, uz=1-dz*dz; const ul=Math.hypot(ux,uy,uz)||1; ux/=ul; uy/=ul; uz/=ul;
  foE(cx,cy,cz,4.6,3.2,3.0,c0,-Math.asin(clamp(dz,-1,1)),Math.atan2(dy,dx));
  const bx=cx+dx*3.2, by=cy+dy*3.2, bz=cz+dz*3.2;
  foC(bx+ux*1,by+uy*1,bz+uz*1,cx+dx*8.6+ux*op,cy+dy*8.6+uy*op,cz+dz*8.6+uz*op,1.8,c0,0.02);
  foC(bx-ux*0.9,by-uy*0.9,bz-uz*0.9,cx+dx*7.6-ux*op*0.8,cy+dy*7.6-uy*op*0.8,cz+dz*7.6-uz*op*0.8,1.4,c1,0.01);
}
function foCrab(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/14, stun=e.stun>0;
  const face=t3Turn(e,e.face,12), fx=e.x, fy=e.y+e.r*0.45;
  const c0=fl?'#ffffff':foT(e,'#f08a5a'), c1=foT(e,'#c8503a'), c2=foT(e,'#6a1e14');
  const sp=Math.hypot(e.dx||0,e.dy||0), mv=clamp(sp/50,0,1); e._wp=(e._wp||0)+dt*(sp>5?17:0);
  // claws: palm (x,y,z), direction (x,y,z), opening, droop. Guard: claws up in front of the face.
  let px=10.5,py=6,pz=12, ddx=0.5,ddy=-0.3,ddz=0.8, op=0.4, droop=0;
  if(st==='snapW'){ const p=foSm(clamp(1-e.st/0.42,0,1)); px=lerp(10.5,7.5,p); py=lerp(6,12.5,p); pz=lerp(12,9.5,p); ddx=lerp(0.5,0.85,p); ddy=lerp(-0.3,0.35,p); ddz=lerp(0.8,0.3,p); op=lerp(0.4,4,p); }
  else if(e.snap>0){ px=14.5; py=5; pz=6.5; ddx=1; ddy=-0.3; ddz=0; op=0.1; }
  else if(st==='open'||stun||!e.blocking){ px=9; py=12.5; pz=2.8; ddx=0.7; ddy=0.5; ddz=-0.45; op=2.6; droop=1; }
  const P=foEase(e,'_fc',foTg(px,py,pz,ddx,ddy,ddz,op,droop),dt,e.snap>0?32:14);
  _fd[0]=P[3]; _fd[1]=P[4]; _fd[2]=P[5]; foNorm(_fd);
  foBegin(fx,fy,face,k,fl,0);
  if(stun) foSet(FOB,0,0,Math.sin(t*8)*0.12,0);
  // six scuttling legs
  for(const sd of [-1,1]) for(let i=0;i<3;i++){
    const ph=e._wp+i*2.1+(sd>0?0:Math.PI), lx=-5.6+i*4.4, o=Math.sin(ph)*2.4*mv, lift=Math.max(0,Math.cos(ph))*mv*1.8;
    foL(lx,sd*8,5.4,lx-1.2+o*0.5,sd*13.4,8.2+lift,1.6,c1,1.3);
    foL(lx-1.2+o*0.5,sd*13.4,8.2+lift,lx-2.4+o,sd*16.2,0.6+lift*0.5,1.3,c1,0.5);
  }
  // shell: a darker rim underneath, the dome, a few pale bumps
  foE(-0.5,0,5,9.4,11.8,3.2,c1,0,0,0,-0.3);
  foE(-0.5,0,6.8,8.6,11,5,c0);
  foE(-1,0,10.2,5.2,7,1.6,shd(c0,0.12),0,0,0,0.05);
  for(let i=0;i<2;i++){ const a=i*2.6+0.9; foB(-1.5+Math.cos(a)*4,Math.sin(a)*6,10.6,1.1,'#ffd8c0',0.08); }
  foN(7.7,-1.8,5.8,7.9,1.8,5.8,0.9,c2,0.06);
  // eyestalks (they droop when the claws are open)
  const dr=P[7];
  for(const sd of [-1,1]){
    const ex=7.6-dr*0.8, ey=sd*4.4, ez=14.4-dr*3;
    foL(5.2,sd*3,9,ex,ey,ez-1.4,0.8,c1,0.7);
    foB(ex,ey,ez,2.1,'#ffffff',0.02); foD(ex+1.6,ey,ez+0.2,1.0,'#120a08',0.04); foD(ex+1.8,ey-sd*0.3,ez+0.8,0.35,'#ffffff',0.05);
    if(dr>0.5) foE(ex+0.2,ey,ez+1.1,2.2,2.2,0.9,c0,0.2,0,0,0.05);   // sleepy lids while the claws are down
  }
  if(e.elite) foCrown(-1,0,11.5,2.4);
  // the claws
  for(const sd of [-1,1]){
    const cx=P[0], cy=sd*P[1], cz=P[2], dx=_fd[0], dy=sd*_fd[1], dz=_fd[2];
    const ex=(5.5+cx)/2, ey=(sd*6.8+cy)/2+sd*2.2, ez=(6.2+cz)/2+1.4;
    foL(5.5,sd*6.8,6.2,ex,ey,ez,1.9,c1,1.7); foL(ex,ey,ez,cx-dx*2,cy-dy*2,cz-dz*2,1.8,c1,1.6);
    foClaw(cx,cy,cz,dx,dy,dz,P[6],c0,c1);
  }
  foEnd(7);
  e._t3top=foTop(fy,16,k);
}
T3E.crab=foCrab;

// Mirrow eel: under the water it is the old dark shadow; up, a long neck rises out of a ripple ring
const FOEL=new Array(21).fill(0);
function foEel(e,fl){
  const st=e.state, sub=e.sub&&st!=='rise'&&st!=='spit'&&st!=='up';
  if(sub){ if(!FO.g) drawEel(e,fl); e._t3top=e.y-e.r; return; }
  const g=foG(), dt=foDt(e), t=e.t||0, k=e.r/12, face=t3Turn(e,e.face,10), fx=e.x, fy=e.y+e.r*0.3;
  let H=16, jaw=0;
  if(st==='rise') H=lerp(2,9,foSm(clamp(1-e.st/0.55,0,1)));
  else if(st==='spit'){ H=17.5; jaw=1; }
  else if(st==='dive') H=16*clamp(e.st/0.3,0,1);
  const P=foEase(e,'_fe',foTg(H,jaw),dt,st==='dive'?20:12); H=P[0]; jaw=P[1];
  const s0=fl?'#ffffff':foT(e,'#7ad0d8'), s1=foT(e,'#2e8a9a'), s2=foT(e,'#103a48'), fin=foT(e,e.elite?'#f0c050':'#5ae0e8');
  const rr=(10+Math.sin(t*4)*1.2)*k, ry=rr*0.42;
  // ripple ring, back half (the front half is drawn over the neck)
  g.save(); g.lineWidth=1.5; g.strokeStyle='rgba(220,245,255,.5)'; g.beginPath(); g.ellipse(fx,fy,rr,ry,0,Math.PI,TAU); g.stroke(); g.restore();
  foBegin(fx,fy,face,k,fl,0);
  // the neck: a chain of capsules from under the water up to the head, swaying
  const N=6, sw=st==='up'?1:0.5, hz=Math.max(2,H);
  for(let i=0;i<=N;i++){ const u=i/N; FOEL[i*3]=lerp(-4,1.5,u)-Math.sin(u*Math.PI)*2.6; FOEL[i*3+1]=Math.sin(u*2.4+t*3)*1.9*(1-u*0.6)*sw; FOEL[i*3+2]=-3+(hz+3)*foSm(u); }
  for(let i=0;i<N;i++){ const a=i*3, b=a+3, r1=lerp(4.3,3.3,i/N), r2=lerp(4.3,3.3,(i+1)/N); foL(FOEL[a],FOEL[a+1],FOEL[a+2],FOEL[b],FOEL[b+1],FOEL[b+2],r1,i%2?s1:shd(s1,0.08),r2); }
  // a fin down the back of the neck
  if(hz>6){ const a=6, b=12; foQ([FOEL[a]-3.2,FOEL[a+1],FOEL[a+2], FOEL[b]-3.6,FOEL[b+1],FOEL[b+2]+1, FOEL[b]-6.6,FOEL[b+1],FOEL[b+2]-1.2, FOEL[a]-6.2,FOEL[a+1],FOEL[a+2]-2],fin,s2,-0.6); }
  // head
  const hx=FOEL[N*3]+1.4, hy=FOEL[N*3+1], hh=FOEL[N*3+2]+1.4;
  foE(hx+1.4,hy,hh,5.6,4.0,3.4,s0,0.2);
  foE(hx+2.2,hy,hh-2.2-jaw*1.4,4.4,3.0,1.2,shd(s0,0.15),0.2+jaw*0.5);
  if(jaw>0.3){ foE(hx+2.6,hy,hh-1.6-jaw*0.6,3.2,2.2,1.0,'#0a2028',0.2,0,0,-0.02); foGlow(hx+6.4,hy,hh-1.4,6*jaw,'160,220,255',0.8*jaw,true); foB(hx+5.8,hy,hh-1.3,1.4*jaw,'#dff6ff',0.06); }
  for(const sd of [-1,1]){
    foD(hx+3.4,hy+sd*2.6,hh+1.4,1.45,'#ffe066',0.02); foD(hx+3.8,hy+sd*2.7,hh+1.4,0.62,'#0a1a20',0.03); foD(hx+3.9,hy+sd*2.3,hh+1.9,0.36,'#ffffff',0.04);
    foQ([hx-0.4,hy+sd*3.4,hh+1.6, hx-4.6,hy+sd*8.4,hh+5, hx-3.6,hy+sd*7.2,hh+1, hx-5.4,hy+sd*6.4,hh-1.6],fin,s2,0);
    foN(hx+6,hy+sd*1.5,hh-0.6,hx+7.6,hy+sd*3.4,hh-3.6+Math.sin(t*4+sd)*0.6,0.55,s2,0.04);
  }
  foEnd(hz*0.6);
  // the water around the neck, and the ripple ring's front half
  g.save(); g.fillStyle='rgba(60,150,180,.38)'; g.beginPath(); g.ellipse(fx,fy,rr*0.82,ry*0.82,0,0,TAU); g.fill();
  g.lineWidth=1.6; g.strokeStyle='rgba(225,248,255,.65)'; g.beginPath(); g.ellipse(fx,fy,rr,ry,0,0,Math.PI); g.stroke(); g.restore();
  e._t3top=foTop(fy,hz+6,k);
}
T3E.eel=foEel;

// gust sprite: a little cloud with a face that puffs its cheeks and blows you about
const FOGU=[[0,0,0,6.2,0],[1.4,-5.2,-0.6,4.6,1],[1.4,5.2,-0.6,4.6,1],[-3.4,-3.4,2.8,4.3,0],[-3.4,3.4,2.8,4.3,0],[-1,0,5.4,4.7,0],[-5.4,0,-0.4,4.4,0],[2.2,0,-3.6,4.0,0]];
function foGust(e,fl){
  const g=foG(), dt=foDt(e), t=e.t||0, st=e.state, k=e.r/12, face=t3Turn(e,e.face,10), fx=e.x, fy=e.y+e.r*0.45;
  foSt(e);
  const ch=e.cheeks||0, blow=st==='blow', z=13+Math.sin(t*2.4)*3, pf=1+ch*0.22;
  foShadow(fx,fy,11*k,0.32);
  foBegin(fx,fy,face,k,fl,z);
  foSet(FOB,0,blow?0.12:-0.05*ch,Math.sin(t*1.6)*0.08,0);
  for(const q of FOGU){ const sc=q[4]?pf:1+ch*0.06; foB(q[0]*(q[4]?1+ch*0.15:1),q[1]*(q[4]?1+ch*0.2:1),q[2],q[3]*sc,fl?'#ffffff':q[2]>1?'#f6faff':q[2]<-1?'#a4b8da':'#d4e2f4'); }
  // a curly tail of little puffs
  for(let i=1;i<=4;i++){ const a=t*3+i*0.9; foB(-6.4-i*2.2,Math.sin(a)*1.6*i/4+i*1.1,-1.4+Math.cos(a)*1.2,3.5-i*0.6,'#dce8f4'); }
  // face
  const fz=1.4;
  if(blow){ for(const sd of [-1,1]) foN(6.2,sd*1.4,fz+1.6,6.0,sd*3.2,fz+1.2,0.7,'#2a3448',0.05); }
  else for(const sd of [-1,1]){ foD(6.1,sd*2.3,fz+1.4,1.3,'#2a3448',0.03); foD(6.4,sd*2.0,fz+2.0,0.42,'#ffffff',0.05); foN(6.0,sd*1.2,fz+3.4,5.6,sd*3.4,fz+3.9,0.6,'#5a6a88',0.04); }
  if(blow){ foD(6.8,0,fz-1.6,2.1,'#2a3448',0.04); foD(7.0,0,fz-1.4,1.1,'#5a6a88',0.05); }
  else foD(6.6,0,fz-1.4,ch>0.2?0.6:0.9,'#2a3448',0.04);
  if(ch>0.1||blow){ const cr=1.2+ch*1.2; for(const sd of [-1,1]) foD(5.6,sd*4.6,fz-0.6,cr,'#ffaabb',0.04); }
  if(blow){ for(let i=0;i<3;i++){ const u=(t*3+i/3)%1, x0=8+u*16; foN(x0,(i-1)*2.6*(1+u),fz-1,x0+4,(i-1)*3*(1+u),fz-1,1.1*(1-u)+0.2,'#ffffff',0.1); } }
  if(e.elite) foCrown(-0.5,0,9.6,2.3);
  foEnd(z);
  // two wind swirls spinning around it (2D, like the old art)
  t3P(-2,0,2,_fqt); const sx=T3R.x+_fqt[0], sy=T3R.y+_fqt[1];
  g.save(); g.lineCap='round'; g.strokeStyle='rgba(255,255,255,.65)'; g.lineWidth=1.3;
  for(let i=0;i<2;i++){ const a=t*4+i*Math.PI; g.beginPath(); g.ellipse(sx,sy,10*k,7*k,0,a,a+1.6); g.stroke(); }
  g.restore();
  e._t3top=foTop(fy,10,k,z);
}
T3E.gust=foGust;

// Bramblehorn: a bark beetle the size of a cart with a horn like a battering ram (mini-boss of the Leap)
function foBramble(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, inS=foSt(e), k=e.r/24, stun=e.stun>0;
  const face=t3Turn(e,e.face,st==='charge'?14:9), fx=e.x, fy=e.y+e.r*0.45;
  const b0=fl?'#ffffff':foT(e,'#9a7a4a'), b1=foT(e,'#6a4c2a'), b2=foT(e,'#2a1a0c'), horn=foT(e,'#dcc49c'), leg='#1e1408', moss=foT(e,'#6e9a3c');
  const sp=Math.hypot(e.dx||0,e.dy||0); e._wp=(e._wp||0)+dt*sp/(5.5*k); const mv=clamp(sp/60,0,1);
  // pose: head pitch (minus lifts the horn), body pitch (minus rears up), shell open, crouch
  let hp=0.12, bp=0, op=0, cr=0;
  if(e.blocking) hp=0.22;
  if(st==='gore'){ const p=foSm(clamp(1-e.st/0.45,0,1)); hp=lerp(0.2,-0.6,p); bp=-0.06*p; }
  else if(st==='recover'&&e._pst==='gore'&&inS<0.35){ hp=0.45; bp=0.08; }
  else if(st==='chargeAim'){ const p=foSm(clamp(1-e.st/0.8,0,1)); hp=0.3; bp=0.08*p; cr=2*p; }
  else if(st==='charge'){ hp=0.32; bp=0.1; cr=1; }
  else if(st==='stompW'){ const p=foSm(clamp(1-e.st/0.7,0,1)); bp=-0.42*p; op=p; hp=-0.2*p; }
  else if(st==='recover'&&e._pst==='stompW'&&inS<0.3){ bp=0.06; op=1-inS/0.3; }
  if(stun){ hp=0.5; bp=0.05; }
  const P=foEase(e,'_fbr',foTg(hp,bp,op,cr),dt,st==='gore'||st==='charge'?18:10); hp=P[0]; bp=P[1]; op=P[2]; cr=P[3];
  foBegin(fx,fy,face,k,fl,0);
  foSet(FOB,0,bp,stun?Math.sin(t*6)*0.08:0,0,0,0,(bp<0?-bp*16:0)-cr,-16);
  // six legs
  foLow();
  for(const sd of [-1,1]) for(let i=0;i<3;i++){
    const ph=e._wp+i*2.1+(sd>0?0:Math.PI), lx=9-i*10, o=Math.sin(ph)*4*mv, lift=Math.max(0,Math.cos(ph))*mv*2.6;
    foL(lx,sd*9,7,lx+1.2+o*0.4,sd*17,12.5+lift,1.9,leg,1.6);
    foL(lx+1.2+o*0.4,sd*17,12.5+lift,lx+3.2+o,sd*20.5,0.8+lift*0.6,1.6,leg,0.9);
    foE(lx+3.6+o,sd*20.6,0.7+lift*0.6,1.6,1.2,0.6,leg);
  }
  // body: dark belly, wings (when the shell opens), the two shell halves, moss and a little mushroom
  foE(-3,0,8,18,11.5,6,b2,0,0,0,-0.5);
  if(op>0.05){ const fz=Math.sin(t*50)*1.4*op; for(const sd of [-1,1]) foQ([2,sd*3,15, -24,sd*(14+fz),19+fz, -27,sd*(6+fz),16, -12,sd*2,14],'#e8d0a0','#a08050',-0.2); }
  for(const sd of [-1,1]) foE(-5,sd*(6.4+op*3.6),12+op*3,17,8.8,8.6,b0,0,0,sd*(0.2+op*0.85));
  if(op<0.3) foN(9,0,19.2,-20,0,16.4,1.1,b2,0.3);
  for(const sd of [-1,1]) for(let i=0;i<3;i++){ const yy=sd*(6.4+op*3.6+(i-1)*3.4), zz=19.6+op*3-Math.abs(i-1)*1.6; foN(4-i,yy,zz-0.4,-16+i*2,yy*1.05,zz-2.6,0.7,b1,0.25); }
  foE(-10,-5,19.6,4.6,3.4,1.4,moss,0,0,-0.25,0.2); foE(-1,6,19.8,3.8,3.2,1.3,moss,0,0,0.25,0.2); foE(-17,3,16.6,3,2.6,1.3,moss,0.3,0,0.2,0.2);
  if(op<0.4){ foL(-8,4.5,19.8,-8,4.5,22.6,0.8,'#f0e6d0',null,0.3); foE(-8,4.5,23,2.6,2.6,1.4,'#d83a2a',0,0,0,0.35); foD(-8,3.6,24,0.5,'#ffffff',0.4); }
  // the pronotum and its little curved horn
  foE(10,0,12.4,7.6,10,7.8,b1);
  foL(12,0,18.6,21,0,23,2.4,horn,1.7,0.1); foL(21,0,23,28,0,21,1.7,horn,0.6,0.1);
  // head with the battering-ram horn (pitches up for the gore, down when charging)
  foUp(); foSet(FOA,11,hp,0,0,0,0,0,14);
  foE(18,0,10,6.4,7.8,6,b1);
  for(const sd of [-1,1]){ foC(22,sd*3.4,7,25.6,sd*1.6,6.2,1.4,b2); foD(22.4,sd*5.4,12.6,1.9,stun?'#ffe066':'#e84a2a',0.03); foD(22.9,sd*5.1,13.3,0.55,'#ffffff',0.05); }
  foL(21,0,12,33,0,15.6,4.4,horn,2.9); foL(33,0,15.6,39.6,0,20.6,2.9,horn,1.4); foC(39.4,0,20.4,42.4,0,25,1.5,horn);
  for(let i=0;i<4;i++){ const u=0.15+i*0.2, x=lerp(21,33,u), z=lerp(12,15.6,u), r=lerp(4.4,2.9,u); foN(x,-r*0.95,z+0.4,x,r*0.95,z+0.4,0.9,'#8a6a40',0.05); }
  foEnd(12);
  e._t3top=foTop(fy,24,k);
}
T3E.bramble=foBramble;

// ================= debug sheet: a foe type at 8 facings in a list of states (each row is {state, st, ...fields})
function t3FoeSheet(type,rows,o){
  o=o||{}; const sc=o.scale||2, cw=o.cw||64, chh=o.ch||70, fs=o.faces||[0,1,2,3,4,5,6,7], n=fs.length, c=document.createElement('canvas');
  c.width=n*cw*sc; c.height=rows.length*chh*sc; const g=c.getContext('2d');
  g.fillStyle=o.bg||'#6a8a4a'; g.fillRect(0,0,c.width,c.height);
  FO.g=g; const r0=EDEF[type]?EDEF[type].r:14;
  for(let j=0;j<rows.length;j++){
    const S=rows[j];
    for(let i=0;i<n;i++){
      const e=Object.assign({type,r:r0,t:1.3,state:'chase',st:0.2,dx:0,dy:0,speed:EDEF[type]?EDEF[type].speed:100,alpha:1,hp:100,maxHp:100,stun:0,cd:1,tint:null,elite:false,swung:0,blocking:false,snap:0,cheeks:0,_wp:0,_wa:0},S);
      e.face=fs[i]*TAU/8; e._vf=e.face; e._ps=e.state;
      const x=(i+0.5)*cw, y=(j+0.74)*chh; e.x=x; e.y=y-e.r*0.45;
      g.setTransform(sc,0,0,sc,0,0);
      g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x,y,e.r*0.9,e.r*0.4,0,0,TAU); g.fill();
      g.globalAlpha=e.alpha; if(o.ally) T3A[o.ally](e); else { const f=T3E[type]; if(f) f(e,!!S.flash); } g.globalAlpha=1;
      if(o.top&&e._t3top!=null){ g.fillStyle='#f00'; g.fillRect(x-4,e._t3top,8,0.6); }
    }
    g.setTransform(sc,0,0,sc,0,0); g.fillStyle='#fff'; g.font='6px sans-serif'; g.fillText(S.label||S.state,2,j*chh+7);
  }
  FO.g=null; g.setTransform(1,0,0,1,0,0);
  return c.toDataURL();
}
function foeScr(id){ const e=G.enemies.find(q=>q.id===id)||G.boss; if(!e) return null; return {x:(e.x-cam.x)*zoom,y:(e.y-cam.y)*zoom,state:e.state,z:zoom}; }
// times n figures of a type drawn to a scratch canvas (ms)
function t3FoeBench(type,n,sc){
  const es=[]; ctx.save(); ctx.setTransform(sc||1,0,0,sc||1,0,0);
  for(let i=0;i<n;i++) es.push({type,r:EDEF[type].r,t:i*0.37,state:'chase',st:0.2,dx:60,dy:0,speed:100,alpha:1,hp:100,maxHp:100,stun:0,cd:1,blocking:true,face:i*0.7,x:40+(i%10)*70,y:60+Math.floor(i/10)*90});
  for(const e of es) T3E[type](e,false);
  const t0=performance.now(); for(let r=0;r<5;r++) for(const e of es) T3E[type](e,false); const ms=(performance.now()-t0)/5;
  ctx.restore(); return [ms,FO.n];
}
window.__ebX=Object.assign(window.__ebX||{},{t3FoeSheet,foeScr,t3FoeBench});
