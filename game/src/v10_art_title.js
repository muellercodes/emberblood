// ================= v10_art_title (v12 TITLE): the title screen
// Emberhollow at dusk on Lantern Day, painted in code like a page of a storybook: watercolour washes, ink lines with a
// little wobble, paper grain. The still parts are painted once into two cached canvases (the sky, and the land in front
// of it) and painted again only when the screen size, the look, the menu's layout or the player's progress changes.
// Each frame draws those two, then the few things that move: clouds, the smoke from the mountain, lantern flicker, a
// few stars, the moth, a tail on a rooftop, fireflies. Small things for a careful eye, never named and never explained:
// a grey moth on a lantern, a horned shadow in the mountain's cloud, five faint stars over five old stones, a crack of
// light at the gate on the mountain, a moon with a small bite-shaped shadow, a small figure with horns and a tail on a
// roof. The picture follows the latest journey (the one Continue plays) and shows only what that player has seen:
// after Act I the smoke is gone, the moth sits on the empty peak, the five stars burn brighter and the gate stands
// open; the moon loses exactly what the story took from it; Act II leaves a clock stopped at one minute to midnight,
// Act III a snowflake, Act IV a seashell, and after the finale the moon is whole again, the way that ending left it.
// The logo is lettered with a broad brush into #logoCv (the h1 keeps the word for screen readers and as a fallback).
// The file name puts it in the build with the v10 art (build.mjs adds every v10_art*.js after the gate library); it
// only declares things, and the hook at the bottom wraps render() while the scene is the menu.
const TTL={ok:true,errs:0,key:'',P:null,L:null,prog:null,sky:null,land:null,dpr:1,spr:{},lan:[],perch:[],stars:[],
  clouds:[],flies:[],t:0,last:0,chkT:0,ms:0,buildMs:0,frames:0,moth:null,snow:null,tail:null,gate:null,force:null,
  logo:{key:'',glow:null,ink:null,sparks:[],tops:[],w:0,h:0,dpr:1,ok:false,ms:0},tex:''};

// ---------- small helpers (all local to the title)
function ttlMk(w,h){ return mkCanvas(Math.max(1,Math.ceil(w)),Math.max(1,Math.ceil(h))); }
function ttlH(i,s){ let h=Math.imul(i|0,374761393)^Math.imul((s|0)+1013,668265263); h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }
function ttlN(x,s){ const i=Math.floor(x), f=x-i, u=f*f*(3-2*f); return ttlH(i,s)*(1-u)+ttlH(i+1,s)*u; }
function ttlN2(x,y,s,p){ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy), m=q=>((q%p)+p)%p;
  const h=(a,b)=>ttlH(m(a)+m(b)*7919,s); return (h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v; }
function ttlGs(R){ return (R()+R()+R()-1.5)/1.5; }
function ttlA(c,a){ const r=typeof c==='string'?hexRGB(c):c; return `rgba(${r[0]|0},${r[1]|0},${r[2]|0},${Math.max(0,Math.min(1,a)).toFixed(3)})`; }
function ttlTone(c,k){ return typeof sbTone==='function'?sbTone(c,k):c; }
function ttlPath(g,P,close){ g.beginPath(); g.moveTo(P[0][0],P[0][1]); for(let i=1;i<P.length;i++) g.lineTo(P[i][0],P[i][1]); if(close!==false) g.closePath(); }
function ttlEll(cx,cy,rx,ry,n,rot){ const o=[], c=Math.cos(rot||0), s=Math.sin(rot||0); for(let i=0;i<n;i++){ const a=i/n*TAU, x=Math.cos(a)*rx, y=Math.sin(a)*ry; o.push([cx+x*c-y*s,cy+x*s+y*c]); } return o; }
function ttlBB(P){ let a=1e9,b=1e9,c=-1e9,d=-1e9; for(const p of P){ if(p[0]<a)a=p[0]; if(p[1]<b)b=p[1]; if(p[0]>c)c=p[0]; if(p[1]>d)d=p[1]; } return [a,b,c,d]; }
function ttlRad(g,x,y,r,rgb,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${rgb},${a})`); gr.addColorStop(0.45,`rgba(${rgb},${a*0.42})`); gr.addColorStop(1,`rgba(${rgb},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
// a Catmull-Rom curve through the points, sampled every `step` px
function ttlSpl(pts,step,closed){
  const n=pts.length; if(n<2) return pts.map(p=>p.slice());
  const Q=i=>closed?pts[((i%n)+n)%n]:pts[Math.max(0,Math.min(n-1,i))], out=[], segs=closed?n:n-1;
  for(let i=0;i<segs;i++){
    const p0=Q(i-1),p1=Q(i),p2=Q(i+1),p3=Q(i+2), m=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
    for(let k=0;k<m;k++){ const t=k/m, t2=t*t, t3=t2*t;
      out.push([0.5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                0.5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]); }
  }
  if(!closed) out.push(pts[n-1].slice());
  return out;
}
// straight segments, resampled every `step` px
function ttlRes(pts,step){ const out=[]; for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], m=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step)); for(let k=0;k<m;k++) out.push([a[0]+(b[0]-a[0])*k/m,a[1]+(b[1]-a[1])*k/m]); } out.push(pts[pts.length-1].slice()); return out; }
// ---------- ink: a pen line that wanders a little and swells and thins along its length, with tapered ends.
// o: {col, alpha, seed, wob (px), taper (0..0.5 of the length), straight (no smoothing), closed, even (no swell)}
function ttlInk(g,pts,w,o){
  o=o||{}; const seed=o.seed|0, closed=!!o.closed, wob=o.wob==null?Math.min(1.5,0.3+w*0.3):o.wob;
  const src=closed?pts.concat([pts[0]]):pts, P=o.straight?ttlRes(src,Math.max(1.2,w*0.9)):ttlSpl(pts,Math.max(1.2,w*0.9),closed);
  if(closed&&!o.straight) P.push(P[0].slice());
  const n=P.length; if(n<2) return;
  const cum=[0]; for(let i=1;i<n;i++) cum.push(cum[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  const len=cum[n-1]||1, ta=closed?0:(o.taper==null?0.2:o.taper), Lp=[], Rp=[];
  for(let i=0;i<n;i++){
    const a=P[Math.max(0,i-1)], b=P[Math.min(n-1,i+1)]; let dx=b[0]-a[0], dy=b[1]-a[1]; const d=Math.hypot(dx,dy)||1; dx/=d; dy/=d;
    const s=cum[i], t=s/len, off=(ttlN(s/(9+w*4),seed)-0.5)*2*wob;
    let k=o.even?1:0.62+0.76*ttlN(s/(14+w*6),seed+31); if(ta>0) k*=Math.min(1,0.2+0.8*Math.min(t,1-t)/ta);
    const hw=Math.max(0.25,w*k*0.5), x=P[i][0]-dy*off, y=P[i][1]+dx*off;
    Lp.push(x-dy*hw,y+dx*hw); Rp.push(x+dy*hw,y-dx*hw);
  }
  g.beginPath(); g.moveTo(Lp[0],Lp[1]); for(let i=2;i<Lp.length;i+=2) g.lineTo(Lp[i],Lp[i+1]);
  for(let i=Rp.length-2;i>=0;i-=2) g.lineTo(Rp[i],Rp[i+1]); g.closePath();
  const ga=g.globalAlpha; if(o.alpha!=null) g.globalAlpha=ga*o.alpha; g.fillStyle=o.col||TTL.P.ink; g.fill(); g.globalAlpha=ga;
}
// the edges of a shape drawn as separate pen strokes that run a little past the corners, the way a hand draws a box
function ttlEdges(g,poly,w,o){ o=o||{}; const n=poly.length, ov=o.over==null?w*1.2:o.over, last=o.open?n-1:n;
  for(let i=0;i<last;i++){ const a=poly[i], b=poly[(i+1)%n], dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1, ex=dx/l*ov, ey=dy/l*ov;
    ttlInk(g,[[a[0]-ex,a[1]-ey],[b[0]+ex,b[1]+ey]],w,{col:o.col,alpha:o.alpha,seed:(o.seed|0)+i*7,taper:0.12,straight:true}); } }
// watercolour: the shape's edge wanders a little on each layer, so the edges come out soft with darker overlaps
function ttlDeform(poly,amp,depth,R){ let p=poly; for(let d=0;d<depth;d++){ const q=[]; for(let i=0;i<p.length;i++){ const a=p[i], b=p[(i+1)%p.length]; q.push(a);
  const dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1, s=ttlGs(R)*amp*Math.min(1,l/(amp*3+0.01)); q.push([(a[0]+b[0])/2-dy/l*s,(a[1]+b[1])/2+dx/l*s]); } p=q; amp*=0.5; } return p; }
// o: {core (alpha of the solid middle, 0 for none), la (alpha of each soft layer), layers, amp (px), edge (rim alpha), seed}
function ttlWash(g,poly,col,o){
  o=o||{}; const R=mulberry32((o.seed|0)*7+977), amp=o.amp==null?4:o.amp, layers=o.layers==null?4:o.layers;
  g.save(); g.fillStyle=col;
  if(o.core!==0){ g.globalAlpha=o.core==null?1:o.core; ttlPath(g,amp>0.5?ttlDeform(poly,amp*0.35,2,R):poly); g.fill(); }
  g.globalAlpha=o.la==null?0.14:o.la; for(let k=0;k<layers;k++){ ttlPath(g,ttlDeform(poly,amp,3,R)); g.fill(); }
  if(o.edge){ g.globalAlpha=o.edge; g.strokeStyle=o.edgeCol||col; g.lineWidth=o.edgeW||1.5; g.lineJoin='round'; ttlPath(g,ttlDeform(poly,amp*0.3,2,R)); g.stroke(); }
  g.restore();
}
// soft blooms of colour inside a shape (the unevenness of a real wash)
function ttlMottle(g,poly,cols,n,r,seed,a){ const R=mulberry32(seed|0), bb=ttlBB(poly); g.save(); ttlPath(g,poly); g.clip();
  for(let i=0;i<n;i++){ const x=bb[0]+R()*(bb[2]-bb[0]), y=bb[1]+R()*(bb[3]-bb[1]), rr=r*(0.45+R()*0.9), c=cols[i%cols.length], gr=g.createRadialGradient(x,y,0,x,y,rr);
    gr.addColorStop(0,ttlA(c,a)); gr.addColorStop(0.6,ttlA(c,a*0.45)); gr.addColorStop(1,ttlA(c,0)); g.fillStyle=gr; g.fillRect(x-rr,y-rr,rr*2,rr*2); }
  g.restore(); }
// granulation: pigment specks that settle into the paper
function ttlSpeck(g,poly,col,n,seed,a,sz){ const R=mulberry32(seed|0), bb=ttlBB(poly); g.save(); ttlPath(g,poly); g.clip(); g.fillStyle=col;
  for(let i=0;i<n;i++){ g.globalAlpha=a*(0.3+R()*0.7); const s=(sz||1)*(0.5+R()); g.fillRect(bb[0]+R()*(bb[2]-bb[0]),bb[1]+R()*(bb[3]-bb[1]),s,s); } g.restore(); }
function ttlTwinkle(g,x,y,s,rgb,a){ g.fillStyle=`rgba(${rgb},${a})`; for(const r of [0,Math.PI/2]){ g.save(); g.translate(x,y); g.rotate(r); g.beginPath(); g.moveTo(-s,0); g.quadraticCurveTo(0,-s*0.09,s,0); g.quadraticCurveTo(0,s*0.09,-s,0); g.fill(); g.restore(); } }

// ---------- palettes: Storybook (bright, warm plum ink) and Classic (the original dark ember look)
function ttlPal(sb){
  if(sb) return {sb:true,ink:'#3b2233',
    sky:[[0,'#2b2b63'],[0.24,'#4b4288'],[0.46,'#8a5a9b'],[0.64,'#d27b93'],[0.8,'#f6a879'],[1,'#ffdb9e']],
    sun:'255,200,150', streaks:['#e98ea2','#b4709f','#ffc58c','#9c6caa'], star:'255,246,222', starWarm:'255,214,128',
    moon:'#fff4dc', moonShade:'#dcbca6', moonGlow:'255,238,206', moonEmber:'#ffb04a',
    cloud:'#f2b8b2', cloudLit:'#ffe2c2', cloudShade:'#a8739c', mtn:'#5d3e71', mtnLit:'#a8628c', mtnDark:'#3b2950', mtnRim:'#ffb27c', lava:'#ff8c3c',
    smoke:'#dcc6cf', smokeDark:'#4a3058', hillFar:'#7c6ca0', hillMid:'#4f7d8a', hillNear:'#4f7f5d', forest:'#2c4852', path:'#f0d098',
    stone:'#aaa2b6', stoneDark:'#625873', wall:'#f6dfb4', wallFar:'#d8bcb0', wallShade:'#9c7484', timber:'#6e4232', brick:'#9a4e3e', door:'#7a4a34',
    roofs:['#c95a3c','#dc9c4c','#8c4c6c','#5c6c9c','#bb6c3c','#a8503a'], win:'#ffd27a', winHot:'#fff4c4', winGlow:'255,186,96',
    lan:['#ff7a3a','#ffb03a','#ec4a3a','#ffd25a','#ff5a6a'], lanGlow:'255,166,80', grass:'#3e603f', grassLit:'#5c7d48', grassDark:'#25362e',
    tree:'#2f5a46', treeLit:'#4e7c50', fence:'#7a5240', veil:'44,22,54', vig:'52,26,60', grainD:[70,40,62], grainL:[255,246,226],
    moth:'#aca2ac', mothDark:'#6a5e6c', mothGlow:'230,230,245', snow:'#f4fbff', shell:'#ffd8c8', fly:'214,255,140'};
  return {sb:false,ink:'#1a0b08',
    sky:[[0,'#0a0712'],[0.3,'#1a0f26'],[0.52,'#3a1a30'],[0.7,'#6a2630'],[0.86,'#a8442c'],[1,'#e2843e']],
    sun:'255,120,50', streaks:['#7a2a36','#4a2034','#c2562e','#5a2a40'], star:'255,240,214', starWarm:'255,196,110',
    moon:'#ece0c4', moonShade:'#b0a088', moonGlow:'240,226,196', moonEmber:'#ff9a3a',
    cloud:'#5a2a34', cloudLit:'#c25e3a', cloudShade:'#2a1420', mtn:'#26171d', mtnLit:'#5e2c26', mtnDark:'#140c10', mtnRim:'#ff8a3a', lava:'#ff6a2a',
    smoke:'#7a6266', smokeDark:'#140a0e', hillFar:'#2e2032', hillMid:'#1f2729', hillNear:'#1c2b20', forest:'#10181a', path:'#6c4c34',
    stone:'#5e565c', stoneDark:'#2a2428', wall:'#6e5444', wallFar:'#4c3c38', wallShade:'#2a1c1a', timber:'#2a160e', brick:'#4a2218', door:'#2e1a10',
    roofs:['#6a2a1e','#7a4a24','#4a2a34','#2e3448','#5e3020','#542218'], win:'#ffc35a', winHot:'#ffe9a8', winGlow:'255,150,60',
    lan:['#ff6a2a','#ffa83a','#e8401f','#ffc35a','#ff4a3a'], lanGlow:'255,130,50', grass:'#18241a', grassLit:'#26341e', grassDark:'#0d150f',
    tree:'#132018', treeLit:'#22341f', fence:'#2a1a12', veil:'11,6,7', vig:'0,0,0', grainD:[0,0,0], grainL:[255,220,180],
    moth:'#8c828a', mothDark:'#3e363c', mothGlow:'210,210,232', snow:'#e8f4ff', shell:'#e8b8a8', fly:'200,255,120'};
}

// ---------- what the latest journey has seen (the save the Continue button plays)
function ttlProg(){
  if(TTL.force) return Object.assign({a1:false,a2:false,a3:false,a4:false,a5:false,moon:100,end:'',four:false},TTL.force,{key:'force:'+JSON.stringify(TTL.force)});
  let s=null; try{ const i=latestSlot(); s=i>=0?slotSave(i):null; }catch(e){ s=null; }
  if(!s) return {a1:false,a2:false,a3:false,a4:false,a5:false,moon:100,end:'',four:false,key:'new'};
  const f=s.flags||{}, ch=s.choices||{}, st=s.stage||''; let act=1; try{ act=actOf(st)||1; }catch(e){}
  const a1=!!(f.act1_done||st==='done'||act>=2), a2=a1&&!!(f.act2_done||f.c_done||act>=3), a3=a2&&!!(f.act3_done||f.f_done||act>=4), a4=a3&&!!(f.act4_done||f.m_done||act>=5);
  const a5=!!(s.done&&(f.act5_done||f.n_done||ch.n_end));
  let moon=f.moon==null?100:+f.moon; if(!isFinite(moon)) moon=100; if(a5) moon=100;
  const end=a5?String(ch.n_end||''):'', four=a5&&!!(s.case&&s.case.solved&&s.case.solved.n5_fourth_lantern);
  return {a1,a2,a3,a4,a5,moon,end,four,key:[a1,a2,a3,a4,a5,moon,end,four].map(String).join('|')};
}

// ---------- layout: where the picture's parts go, from where the menu sits on screen
function ttlRects(){
  const m=document.getElementById('menu'); if(!m||!m.classList.contains('on')) return TTL.rects&&TTL.rects.W===W&&TTL.rects.H===H?TTL.rects:null;
  try{ const c=m.querySelector('.menu').getBoundingClientRect(), h=m.querySelector('.ttlhead').getBoundingClientRect(), s=m.querySelector('.stack').getBoundingClientRect();
    if(!(c.width>0)) return null; TTL.rects={c,h,s,W,H}; return TTL.rects; }catch(e){ return null; }
}
function ttlLayout(){
  const w=W, h=H, r=ttlRects(); let side=w/h>=1.2; try{ side=matchMedia('(min-aspect-ratio: 6/5)').matches; }catch(e){}
  const L={W:w,H:h,side};
  if(side){
    const cx=r?r.c.right:Math.min(470,w*0.42); L.colR=cx; L.x0=Math.min(w*0.62,cx+w*0.012); L.x1=w; const sw=L.x1-L.x0; L.sw=sw;
    L.u=clamp(Math.min(sw/800,h/780),0.34,1.8); const u=L.u;
    L.peak={x:L.x0+sw*0.46,y:h*0.3}; L.mw=Math.max(sw*0.6,330*u); L.mb=h*0.655;
    L.moon={x:L.x0+sw*0.86,y:h*0.16,r:32*u};
    L.cloud={x:L.peak.x+sw*0.15,y:h*0.11};
    L.hz=h*0.61; L.t0=h*0.765; L.t1=h*1.03; L.fg=h*0.985;
    L.vis={x0:L.x0+8*u,y0:0,x1:w-6*u,y1:h-6*u};
    L.green=[L.x0+sw*0.33,L.x0+sw*0.73];
  } else {
    const y0=r?r.h.bottom:h*0.17, y1=r?r.s.top:h*0.56, bh=Math.max(140,y1-y0);
    L.y0=y0; L.y1=y1; L.x0=0; L.x1=w; L.sw=w; L.bh=bh;
    L.u=clamp(Math.min(w/540,bh/330),0.34,1.6); const u=L.u;
    L.peak={x:w*0.54,y:y0+bh*0.22}; L.mw=Math.max(w*0.8,300*u); L.mb=y0+bh*0.78;
    L.moon={x:w*0.15,y:y0+Math.max(bh*0.11,34*u),r:28*u};
    L.cloud={x:L.peak.x+w*0.22,y:y0+bh*0.07};
    L.hz=y0+bh*0.66; L.t0=y0+bh*0.93; L.t1=y1+64*u; L.fg=y1+74*u;
    L.vis={x0:6*u,y0:y0+4*u,x1:w-6*u,y1:y1-6*u};
    L.green=[w*0.24,w*0.8];
  }
  return L;
}
// while another panel covers the title (slots, settings), the menu is hidden and cannot be measured: keep the last layout
function ttlLayoutKey(){ const r=ttlRects(), q=v=>Math.round(v/6); if(r) TTL.lk=[q(r.c.left),q(r.c.right),q(r.h.bottom),q(r.s.top),Math.round(W),Math.round(H)].join(','); return TTL.lk||'-'; }

// ---------- geometry shared by the sky and the land: the mountain's outline, the hills, the five stones
function ttlGeom(L){
  const u=L.u, pk=L.peak, cw=24*u, hgt=L.mb-pk.y, R=mulberry32(5150);
  L.cw=cw;
  L.mtnY=x=>{ const d=Math.abs(x-pk.x);
    if(d<cw){ const k=d/cw; return pk.y+(x<pk.x?-1.5*u:1*u)*k*k+5*u*(1-k*k)*0.9-(x<pk.x?2*u:0)*k; }
    const t=Math.min(1.6,(d-cw)/(L.mw-cw)); let y=pk.y+hgt*Math.pow(t,0.62);
    y+=(ttlN(x/(54*u),77)-0.5)*16*u*Math.min(1,t*1.6);
    if(x>pk.x) y-=Math.max(0,Math.sin(Math.min(1,t*2.2)*Math.PI))*10*u*(t<0.45?1:0.4);
    return y; };
  const hill=(base,amp,per,ph,seed)=>x=>base+amp*Math.sin(x/per+ph)+amp*0.55*Math.sin(x/(per*0.43)+ph*2.1)+(ttlN(x/(per*0.3),seed)-0.5)*amp*0.6;
  L.hFar=hill(L.side?L.H*0.632:L.hz+4*u,15*u,150*u,0.7,11);
  L.hMid=hill(L.side?L.H*0.69:L.hz+22*u,17*u,120*u,2.2,12);
  L.hNear=hill(L.side?L.H*0.745:L.t0-8*u,12*u,170*u,4.1,13);
  // the five old stones, on the hills, away from the middle of the mountain; a faint star over each one
  const xs=L.side?[0.06,0.2,0.69,0.82,0.95]:[0.07,0.23,0.7,0.83,0.95];
  L.stones=xs.map((f,i)=>{ const x=L.x0+L.sw*f+(R()-0.5)*14*u, on=i%2?L.hMid:L.hFar, y=on(x)+(i%2?3:2)*u;
    const top=Math.min(L.mtnY(x),L.hFar(x))-26*u, lo=L.side?L.H*0.05:L.y0+10*u, sy=clamp(top-(30+R()*110)*u,lo,Math.max(lo,top));
    return {x,y,mid:!!(i%2),sx:x+(R()-0.5)*8*u,sy}; });
}

// ---------- the sky: gradient, washes, stars, the moon, paper
function ttlPaintSky(g,L,P,pr){
  const {W:w,H:h,u}=L, R=mulberry32(4111), hy=L.mb+30*u;
  const gr=g.createLinearGradient(0,0,0,hy); for(const [s,c] of P.sky) gr.addColorStop(s,c); g.fillStyle=gr; g.fillRect(0,0,w,h);
  ttlRad(g,L.peak.x-L.mw*0.18,hy,Math.max(w,h)*0.7,P.sun,P.sb?0.34:0.4);
  for(let i=0;i<10;i++){ const y=hy*(0.12+R()*0.78), x=R()*w, rx=w*(0.18+R()*0.3), ry=(6+R()*18)*u;
    ttlWash(g,ttlEll(x,y,rx,ry,22),P.streaks[i%4],{seed:i*31+5,core:0,la:P.sb?0.055:0.07,layers:6,amp:ry*0.9}); }
  // stars, thicker high up
  const n=Math.round(w*hy/(L.side?2300:1900)), su=Math.max(0.75,u); TTL.stars=[];
  for(let i=0;i<n;i++){ const x=R()*w, y=Math.pow(R(),1.7)*hy*0.66; if(Math.hypot(x-L.moon.x,y-L.moon.y)<L.moon.r*1.6) continue;
    if(y>L.mtnY(x)-12*u) continue;
    const a=Math.max(0,(1-y/(hy*0.7)))*(0.3+R()*0.62), r=(0.45+R()*R()*1.2)*su;
    g.fillStyle=`rgba(${P.star},${a.toFixed(3)})`; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
    if(r>1.15*su&&R()<0.5) ttlTwinkle(g,x,y,r*3.4,P.star,a*0.55);
    if(TTL.stars.length<14&&R()<0.08&&a>0.35) TTL.stars.push({x,y,r,a,ph:R()*TAU,sp:0.5+R()*1.3}); }
  // the five faint stars (brighter once the stones have been lit)
  for(const s of L.stones){ const a=pr.a1?0.95:0.6; ttlRad(g,s.sx,s.sy,(pr.a1?9:6)*su,P.starWarm,pr.a1?0.32:0.16);
    ttlTwinkle(g,s.sx,s.sy,(pr.a1?6.4:4.4)*su,P.starWarm,a*0.85); g.fillStyle=`rgba(${P.starWarm},${a})`; g.beginPath(); g.arc(s.sx,s.sy,(pr.a1?1.6:1.2)*su,0,TAU); g.fill(); }
  ttlPaper(g,L,P,false);
  ttlMoon(g,L,P,pr);
}
// the moon: whole, bitten as the story bit it, dark in the eclipse, or whole again as the finale left it
function ttlMoon(g,L,P,pr){
  const {x,y,r}=L.moon, u=L.u, v=pr.moon, gone=!pr.a5&&v<=0, ember=pr.a5&&pr.end==='embermoon';
  const bites=pr.a5?0:v>=100?0:v>=95?1:v>=85?2:v>=60?3:4;
  const body=ember?P.moonEmber:P.moon, glow=ember?'255,170,80':P.moonGlow;
  g.save(); g.globalCompositeOperation='lighter'; ttlRad(g,x,y,r*(gone?2.2:pr.a5?4.6:3.8),glow,gone?0.1:pr.a5?0.36:P.sb?0.26:0.2); g.restore();
  const S=Math.ceil(r*2.6), c=ttlMk(S*2,S*2), m=c.getContext('2d'), cx=S, cy=S, R=mulberry32(808);
  m.save(); m.translate(cx,cy);
  if(gone){
    m.fillStyle=P.sb?'#2b2448':'#0c0812'; m.beginPath(); m.arc(0,0,r,0,TAU); m.fill();
    m.globalCompositeOperation='lighter'; m.strokeStyle=`rgba(${P.moonGlow},.75)`; m.lineWidth=1.6*u; m.beginPath(); m.arc(0,0,r,0,TAU); m.stroke();
    m.strokeStyle=`rgba(${P.moonGlow},.22)`; m.lineWidth=5*u; m.stroke(); m.restore(); g.drawImage(c,x-S,y-S); return;
  }
  const disc=ttlEll(0,0,r,r,40); ttlWash(m,disc,body,{seed:17,amp:0.6*u,layers:3,la:0.25});
  m.save(); ttlPath(m,disc); m.clip(); const mg=m.createRadialGradient(-r*0.35,-r*0.35,r*0.1,0,0,r*1.05); mg.addColorStop(0,'rgba(255,255,255,.55)'); mg.addColorStop(0.6,ttlA(body,0)); mg.addColorStop(1,ttlA(P.moonShade,0.7)); m.fillStyle=mg; m.fillRect(-r,-r,r*2,r*2);
  for(const [cx,cy,cr] of [[-0.3,0.2,0.22],[0.25,0.38,0.14],[0.1,-0.25,0.12],[-0.45,-0.25,0.09],[0.42,-0.02,0.08]]){ m.fillStyle=ttlA(P.moonShade,ember?0.26:0.32); m.beginPath(); m.arc(cx*r,cy*r,cr*r,0,TAU); m.fill(); m.strokeStyle=ttlA('#ffffff',0.4); m.lineWidth=Math.max(0.6,0.7*u); m.beginPath(); m.arc(cx*r+0.2*cr*r,cy*r+0.25*cr*r,cr*r,Math.PI*0.1,Math.PI*0.9); m.stroke(); }
  m.restore();
  ttlMottle(m,disc,[P.moonShade,'#ffffff'],6,r*0.5,23,ember?0.18:0.24);
  ttlSpeck(m,disc,P.moonShade,Math.round(r*r*0.03),31,0.3,Math.max(0.7,u*0.8));
  // the bites: each one a cookie bite (a big round notch with two little tooth scallops at its edge)
  const BA=[-0.55,0.15,0.85,-1.2];
  m.globalCompositeOperation='destination-out';
  for(let i=0;i<bites;i++){ const a=BA[i], br=r*(0.36+i*0.04), bx=Math.cos(a)*r*1.06, by=Math.sin(a)*r*1.06;
    m.beginPath(); m.arc(bx,by,br,0,TAU); m.fill();
    for(const s of [-1,1]){ const aa=a+s*0.62*(br/r)*1.6; m.beginPath(); m.arc(Math.cos(aa)*r*1.0,Math.sin(aa)*r*1.0,br*0.42,0,TAU); m.fill(); } }
  m.globalCompositeOperation='source-over';
  // before any bite: only a faint shadow shaped like one, on the upper right edge
  if(!bites&&!pr.a5){ m.save(); m.beginPath(); m.arc(0,0,r,0,TAU); m.clip(); const a=BA[0], br=r*0.34, bx=Math.cos(a)*r*1.02, by=Math.sin(a)*r*1.02;
    m.fillStyle=ttlA(P.moonShade,P.sb?0.7:0.75); m.beginPath(); m.arc(bx,by,br,0,TAU); for(const s of [-1,1]){ const aa=a+s*0.58*(br/r)*1.6; m.moveTo(Math.cos(aa)*r+br*0.4,Math.sin(aa)*r); m.arc(Math.cos(aa)*r,Math.sin(aa)*r,br*0.4,0,TAU); } m.fill();
    m.fillStyle=ttlA(P.moonShade,0.45); m.beginPath(); m.arc(bx,by,br*1.25,0,TAU); m.fill(); m.restore(); }
  // the finale's moth ending: a little moth sits on the whole moon
  if(pr.a5&&pr.end==='moth') ttlMothShape(m,r*0.18,r*0.12,r*0.5,1,-0.3,P,true);
  if(ember){ m.save(); m.fillStyle=ttlA(P.mothDark,0.85); m.beginPath(); m.arc(0,0,r*1.05,Math.PI*0.55,Math.PI*1.12); m.arc(0,0,r*0.86,Math.PI*1.1,Math.PI*0.6,true); m.closePath(); m.fill();
    m.strokeStyle=ttlA(P.mothDark,0.9); m.lineWidth=Math.max(0.6,r*0.03); m.beginPath(); const ax=Math.cos(Math.PI*1.12)*r*0.95, ay=Math.sin(Math.PI*1.12)*r*0.95; m.moveTo(ax,ay); m.quadraticCurveTo(ax-r*0.05,ay-r*0.2,ax+r*0.06,ay-r*0.3); m.moveTo(ax,ay); m.quadraticCurveTo(ax+r*0.1,ay-r*0.16,ax+r*0.2,ay-r*0.22); m.stroke(); m.restore(); }
  // ink: round the lit edge, a broken line, and round each bite
  m.globalCompositeOperation='source-atop'; m.fillStyle=ttlA(P.ink,0.12); m.fillRect(-S,-S,S*2,S*2); m.globalCompositeOperation='source-over';
  const arc=[]; for(let i=0;i<=40;i++){ const a=-Math.PI*0.95+i/40*Math.PI*1.75; arc.push([Math.cos(a)*r,Math.sin(a)*r]); }
  ttlInk(m,arc,1.4*u,{col:P.ink,alpha:0.55,seed:5,taper:0.25});
  for(let i=0;i<bites;i++){ const a=BA[i], br=r*(0.36+i*0.04), bx=Math.cos(a)*r*1.06, by=Math.sin(a)*r*1.06, pts=[];
    for(let k=0;k<=12;k++){ const aa=a+Math.PI+(k/12-0.5)*1.7; pts.push([bx+Math.cos(aa)*br,by+Math.sin(aa)*br]); } ttlInk(m,pts,1.1*u,{col:P.ink,alpha:0.5,seed:40+i,taper:0.3}); }
  m.restore();
  g.drawImage(c,x-S,y-S);
}

// ---------- paper: grain, a few fibres, and the darker edges of the page. `atop` paints only over what is there.
function ttlGrainTile(P){
  const s=256, c=ttlMk(s,s), g=c.getContext('2d'), im=g.createImageData(s,s), d=im.data, R=mulberry32(99), D=P.grainD, Lc=P.grainL;
  for(let y=0;y<s;y++) for(let x=0;x<s;x++){ const i=(y*s+x)*4, lo=ttlN2(x/32,y/32,7,8)*0.62+ttlN2(x/8,y/8,9,32)*0.38, f=R();
    const dark=f<0.5, a=(P.sb?0.035:0.045)+lo*(P.sb?0.06:0.07)+(f<0.04?0.12:0)+(f>0.985?0.1:0), col=dark?D:Lc;
    d[i]=col[0]; d[i+1]=col[1]; d[i+2]=col[2]; d[i+3]=Math.round(Math.min(1,a*(dark?1:P.sb?0.8:0.32))*255); }
  g.putImageData(im,0,0);
  g.lineCap='round';
  for(let k=0;k<70;k++){ const x=R()*s, y=R()*s, a=R()*TAU, l=6+R()*18, dark=R()<0.5; g.strokeStyle=dark?ttlA(D,0.07):ttlA(Lc,0.12); g.lineWidth=0.6+R()*0.6;
    for(const ox of [-s,0,s]) for(const oy of [-s,0,s]){ g.beginPath(); g.moveTo(x+ox,y+oy); g.quadraticCurveTo(x+ox+Math.cos(a+0.6)*l*0.5,y+oy+Math.sin(a+0.6)*l*0.5,x+ox+Math.cos(a)*l,y+oy+Math.sin(a)*l); g.stroke(); } }
  return c;
}
function ttlPaper(g,L,P,atop){
  const w=L.W, h=L.H; g.save(); if(atop) g.globalCompositeOperation='source-atop';
  const pat=g.createPattern(TTL.spr.grain,'repeat'); try{ pat.setTransform(new DOMMatrix().scale(1/TTL.dpr)); }catch(e){}
  g.fillStyle=pat; g.fillRect(0,0,w,h);
  const cx=L.side?L.x0+L.sw*0.45:w/2, cy=L.side?h*0.42:(L.y0+L.y1)/2, vg=g.createRadialGradient(cx,cy,Math.min(w,h)*0.3,cx,cy,Math.hypot(w,h)*0.66);
  vg.addColorStop(0,`rgba(${P.vig},0)`); vg.addColorStop(0.7,`rgba(${P.vig},${P.sb?0.14:0.26})`); vg.addColorStop(1,`rgba(${P.vig},${P.sb?0.46:0.66})`);
  g.fillStyle=vg; g.fillRect(0,0,w,h); g.restore();
}

// ---------- the land: mountain, hills, stones, Whisperwood, the town and its lanterns, the near grass
function ttlPaintLand(g,L,P,pr){
  const u=L.u; TTL.lan=[]; TTL.wins=[]; TTL.perch=[]; TTL.tail=null; TTL.gate=null; TTL.four=null;
  ttlMountain(g,L,P,pr);
  ttlHills(g,L,P,pr);
  ttlTown(g,L,P,pr);
  ttlForeground(g,L,P,pr);
  // the base glow of every window and lantern (the flicker on top is drawn each frame)
  g.save(); g.globalCompositeOperation='lighter';
  for(const q of TTL.wins){ g.globalAlpha=P.sb?0.5:0.7; g.drawImage(TTL.spr.glowWin,q.x-q.r,q.y-q.r,q.r*2,q.r*2); }
  for(const q of TTL.lan){ g.globalAlpha=P.sb?0.55:0.75; const s=q.r*6; g.drawImage(TTL.spr.glowLan,q.x-s/2,q.y-s/2,s,s); }
  g.restore();
  // a veil behind the menu so its words read over the picture
  g.save();
  if(L.side){ const x1=L.colR+90*u, vg=g.createLinearGradient(0,0,x1,0); vg.addColorStop(0,`rgba(${P.veil},${P.sb?0.5:0.62})`); vg.addColorStop(0.62,`rgba(${P.veil},${P.sb?0.3:0.42})`); vg.addColorStop(1,`rgba(${P.veil},0)`); g.fillStyle=vg; g.fillRect(0,0,x1,L.H); }
  else { const vg=g.createLinearGradient(0,L.y1-36*u,0,L.H); vg.addColorStop(0,`rgba(${P.veil},0)`); vg.addColorStop(0.18,`rgba(${P.veil},${P.sb?0.34:0.46})`); vg.addColorStop(1,`rgba(${P.veil},${P.sb?0.62:0.74})`); g.fillStyle=vg; g.fillRect(0,L.y1-36*u,L.W,L.H); }
  g.restore();
  ttlPaper(g,L,P,true);
}
function ttlMountain(g,L,P,pr){
  const u=L.u, pk=L.peak, R=mulberry32(321), xa=pk.x-L.mw*1.25, xb=pk.x+L.mw*1.25, ridge=[];
  for(let x=xa;x<=xb;x+=3*u) ridge.push([x,Math.min(L.mtnY(x),L.mb+80*u)]);
  const poly=ridge.concat([[xb,L.mb+90*u],[xa,L.mb+90*u]]);
  ttlWash(g,poly,P.mtn,{seed:11,amp:2.5*u,layers:3,la:0.2});
  g.save(); ttlPath(g,poly); g.clip();
  const lg=g.createLinearGradient(0,pk.y,0,L.mb); lg.addColorStop(0,ttlA(P.mtnLit,P.sb?0.5:0.45)); lg.addColorStop(0.5,ttlA(P.mtnLit,0.1)); lg.addColorStop(1,ttlA(P.mtnDark,0.45)); g.fillStyle=lg; g.fillRect(xa,pk.y-10*u,xb-xa,L.mb-pk.y+100*u);
  const sg=g.createLinearGradient(pk.x-L.mw*0.2,0,pk.x+L.mw*0.9,0); sg.addColorStop(0,ttlA(P.mtnDark,0)); sg.addColorStop(1,ttlA(P.mtnDark,0.5)); g.fillStyle=sg; g.fillRect(pk.x-L.mw*0.2,pk.y-10*u,L.mw*1.6,L.mb);
  const wl=g.createLinearGradient(pk.x-L.mw*1.05,0,pk.x+L.mw*0.1,0); wl.addColorStop(0,ttlA(P.mtnRim,P.sb?0.3:0.16)); wl.addColorStop(0.55,ttlA(P.mtnLit,P.sb?0.22:0.14)); wl.addColorStop(1,ttlA(P.mtnLit,0)); g.fillStyle=wl; g.fillRect(pk.x-L.mw*1.3,pk.y-10*u,L.mw*1.4,L.mb);
  ttlMottle(g,poly,[P.mtnLit,P.mtnDark,P.mtn],30,52*u,41,0.22);
  // folds running down from the rim: lit on the left (toward the glow), in shadow on the right
  for(let i=0;i<14;i++){ const s=i<7?-1:1, k=(i%7)/7, x0=pk.x+s*L.cw*(0.3+k*1.5)+(R()-0.5)*6*u, y0=L.mtnY(x0)+3*u;
    const spread=(0.12+k*0.8)*L.mw*(0.8+R()*0.4), depth=(0.55+R()*0.45)*(L.mb-y0), pts=[];
    for(let j=0;j<=10;j++){ const t=j/10, x=x0+s*spread*Math.pow(t,0.95)+(ttlN(t*3+i,i)-0.5)*10*u*t, y=y0+depth*t; if(y<L.mtnY(x)+2*u) continue; pts.push([x,y]); }
    if(pts.length<4) continue;
    ttlInk(g,pts.map(p=>[p[0]+8*u,p[1]+1*u]),16*u,{col:P.mtnDark,alpha:P.sb?0.3:0.34,seed:60+i,taper:0.55,wob:3*u});
    ttlInk(g,pts.map(p=>[p[0]-3*u,p[1]]),6*u,{col:P.mtnLit,alpha:P.sb?0.26:0.2,seed:80+i,taper:0.5,wob:2*u});
    ttlInk(g,pts,1*u,{col:P.ink,alpha:0.38*(1-k*0.5),seed:90+i,taper:0.45}); }
  // pen hatching on the shadowed flank, and a little on the near foot of the lit one
  g.strokeStyle=P.ink; g.lineCap='round';
  for(let i=0;i<Math.round(260*Math.min(1.6,L.mw/(500*u)));i++){ const right=R()<0.8, x=pk.x+(right?1:-1)*(L.cw+Math.pow(R(),0.8)*L.mw*1.05), top=L.mtnY(x)+8*u, y=top+Math.pow(R(),0.7)*(L.mb-top);
    if(y>L.mb+10*u||(!right&&y<L.mb-(L.mb-pk.y)*0.35)) continue; const l=(3+R()*4)*u; g.globalAlpha=(right?0.14:0.09)+R()*0.12; g.lineWidth=0.7*u;
    g.beginPath(); g.moveTo(x,y); g.lineTo(x+l*0.8,y+l*0.55); g.stroke(); }
  g.globalAlpha=1;
  ttlSpeck(g,poly,P.ink,Math.round(L.mw*L.mw*0.004/(u*u)*u),71,0.18,u);
  // evening haze gathers at the foot
  { const hg=g.createLinearGradient(0,L.mb-(L.mb-pk.y)*0.42,0,L.mb); hg.addColorStop(0,ttlA(P.sky[4][1],0)); hg.addColorStop(1,ttlA(P.sky[4][1],P.sb?0.42:0.3)); g.fillStyle=hg; g.fillRect(xa,L.mb-(L.mb-pk.y)*0.42,xb-xa,(L.mb-pk.y)*0.42+90*u); }
  // small pines on the lower slopes
  for(let x=pk.x-L.mw*1.1;x<pk.x+L.mw*1.1;x+=(4+R()*7)*u){ const y=L.mb-R()*R()*40*u; if(y<L.mtnY(x)+20*u) continue; const h=(5+R()*7)*u; g.fillStyle=ttlA(P.forest,0.8); g.beginPath(); g.moveTo(x-h*0.3,y); g.lineTo(x,y-h); g.lineTo(x+h*0.3,y); g.closePath(); g.fill(); }
  // the lava trickle and the crater glow, while the mountain still smokes
  if(!pr.a1){ const pts=[]; let x=pk.x+L.cw*0.3, y=L.mtnY(x)+2*u; for(let k=0;k<8;k++){ pts.push([x,y]); x+=(3+R()*5)*u; y+=(8+R()*6)*u; }
    ttlInk(g,pts,2.6*u,{col:P.lava,alpha:0.9,seed:7,taper:0.5}); g.save(); g.globalCompositeOperation='lighter'; for(const p of pts) ttlRad(g,p[0],p[1],7*u,'255,120,40',0.22); g.restore(); }
  g.restore();
  // the gate on the upper slope, on the road up, with light through the crack
  const gx=pk.x+L.cw+(L.mw-L.cw)*0.13, gy=L.mtnY(gx)+12*u, gw=8*u, gh=11*u;
  const road=[[pk.x-L.mw*0.42,L.mb-6*u],[pk.x-L.mw*0.16,L.mb-40*u],[pk.x+L.mw*0.18,L.mtnY(pk.x+L.mw*0.18)+22*u],[pk.x-L.mw*0.02,L.mtnY(pk.x-L.mw*0.02)+40*u],[gx-6*u,gy+gh*0.5]];
  ttlInk(g,road,1.6*u,{col:P.path,alpha:P.sb?0.5:0.4,seed:3,taper:0.3,wob:1.5*u});
  g.save(); g.fillStyle=P.sb?'#24162e':'#07040a'; g.beginPath(); g.moveTo(gx-gw/2,gy+gh/2); g.lineTo(gx-gw/2,gy-gh*0.2); g.quadraticCurveTo(gx,gy-gh*0.8,gx+gw/2,gy-gh*0.2); g.lineTo(gx+gw/2,gy+gh/2); g.closePath(); g.fill(); g.restore();
  const open=pr.a1?2.6*u:0.9*u; g.fillStyle=P.winHot; g.fillRect(gx-open/2,gy-gh*0.42,open,gh*0.92);
  ttlInk(g,[[gx-gw/2-1*u,gy+gh/2],[gx-gw/2,gy-gh*0.2],[gx,gy-gh*0.62],[gx+gw/2,gy-gh*0.2],[gx+gw/2+1*u,gy+gh/2]],1.3*u,{col:P.ink,seed:12,taper:0.1});
  if(pr.a1){ g.save(); g.globalCompositeOperation='lighter'; ttlRad(g,gx,gy+gh*0.6,12*u,P.winGlow,0.25); g.restore(); }
  TTL.gate={x:gx,y:gy,h:gh,open};
  // the crater: a glowing lip while it smokes, cold after
  if(!pr.a1){ g.save(); g.globalCompositeOperation='lighter'; ttlRad(g,pk.x,pk.y+3*u,L.cw*1.5,'255,120,40',0.5); g.restore();
    ttlInk(g,[[pk.x-L.cw*0.85,pk.y+2.5*u],[pk.x,pk.y+5.5*u],[pk.x+L.cw*0.85,pk.y+2.5*u]],2.2*u,{col:P.lava,seed:4,taper:0.3}); }
  else ttlInk(g,[[pk.x-L.cw*0.85,pk.y+2.5*u],[pk.x,pk.y+5*u],[pk.x+L.cw*0.85,pk.y+2.5*u]],1.4*u,{col:P.ink,alpha:0.55,seed:4,taper:0.3});
  // the warm rim the set sun leaves along the top, then the ink outline
  const top=ridge.filter(p=>p[1]<L.mb+10*u);
  ttlInk(g,top.map(p=>[p[0],p[1]+1.6*u]),1.6*u,{col:P.mtnRim,alpha:P.sb?0.6:0.5,seed:21,taper:0.35,wob:0.6*u});
  ttlInk(g,top,2.1*u,{col:P.ink,alpha:0.95,seed:22,taper:0.25,wob:0.9*u});
}
function ttlHills(g,L,P,pr){
  const u=L.u, w=L.W, step=4*u, R=mulberry32(612), band=(fn,yb)=>{ const pts=[]; for(let x=-10*u;x<=w+10*u;x+=step) pts.push([x,fn(x)]); return {top:pts,poly:pts.concat([[w+10*u,yb],[-10*u,yb]])}; };
  // far hills
  const far=band(L.hFar,L.H+10);
  ttlWash(g,far.poly,P.hillFar,{seed:31,amp:2*u,layers:2,la:0.2});
  g.save(); ttlPath(g,far.poly); g.clip(); const fg=g.createLinearGradient(0,L.hFar(L.peak.x)-20*u,0,L.hFar(L.peak.x)+60*u); fg.addColorStop(0,ttlA(P.sky[P.sky.length-2][1],0.28)); fg.addColorStop(1,ttlA(P.hillFar,0)); g.fillStyle=fg; g.fillRect(0,0,w,L.H); g.restore();
  ttlInk(g,far.top,1.3*u,{col:P.ink,alpha:0.5,seed:32,taper:0.05,wob:0.8*u});
  // Whisperwood: a band of pines over the far hills on one side
  const wx0=L.side?L.x0-L.sw*0.1:-10*u, wx1=L.side?L.x0+L.sw*0.26:w*0.3;
  for(let x=wx0;x<wx1;x+=(5+R()*4)*u){ const by=L.hFar(x)+6*u+R()*8*u, ph=(15+R()*16)*u*(1-Math.abs((x-(wx0+wx1)/2)/(wx1-wx0))*0.6), pw=ph*(0.32+R()*0.1);
    const tri=[[x-pw/2,by],[x+(R()-0.5)*2*u,by-ph],[x+pw/2,by]]; ttlWash(g,tri,P.forest,{seed:Math.round(x),amp:0.8*u,layers:1,la:0.3});
    ttlInk(g,[[x-pw/2,by],[x,by-ph],[x+pw/2,by]],0.9*u,{col:P.ink,alpha:0.55,seed:Math.round(x)+3,taper:0.2,straight:true}); }
  // mid hills
  const mid=band(L.hMid,L.H+10);
  ttlWash(g,mid.poly,P.hillMid,{seed:33,amp:2*u,layers:2,la:0.2});
  ttlMottle(g,mid.poly,[P.hillMid,P.hillNear,P.hillFar],16,60*u,34,0.22);
  ttlInk(g,mid.top,1.4*u,{col:P.ink,alpha:0.6,seed:35,taper:0.05,wob:0.8*u});
  // the five old stones (far ones first)
  for(const s of L.stones.filter(q=>!q.mid).concat(L.stones.filter(q=>q.mid))) ttlStone(g,L,P,s,pr);
  // the near hill and the lane winding up toward the mountain
  const near=band(L.hNear,L.H+10);
  ttlWash(g,near.poly,P.hillNear,{seed:36,amp:2*u,layers:2,la:0.2});
  ttlMottle(g,near.poly,[P.grassLit,P.hillNear,P.grassDark],18,70*u,37,0.26);
  const lx=L.side?L.x0+L.sw*0.52:L.W*0.5, lane=[[lx-40*u,L.t0+6*u],[lx+10*u,L.hNear(lx)+14*u],[lx-26*u,L.hMid(lx-26*u)+8*u],[L.peak.x-L.mw*0.3,L.hMid(L.peak.x-L.mw*0.3)+3*u]];
  ttlInk(g,lane,7*u,{col:P.path,alpha:P.sb?0.55:0.45,seed:38,taper:0.6,wob:1.5*u});
  ttlInk(g,near.top,1.4*u,{col:P.ink,alpha:0.62,seed:39,taper:0.05,wob:0.8*u});
}
function ttlStone(g,L,P,s,pr){
  const u=L.u*(s.mid?1:0.82), w=6.5*u, h=11*u, x=s.x, y=s.y;
  const sh=[[x-w*0.55,y],[x-w*0.5,y-h*0.7],[x-w*0.2,y-h],[x+w*0.3,y-h*0.95],[x+w*0.55,y-h*0.6],[x+w*0.5,y]];
  if(pr.a1){ g.save(); g.globalCompositeOperation='lighter'; ttlRad(g,x,y-h*0.3,14*u,'255,190,110',TTL.P.sb?0.3:0.38); g.restore(); }
  g.fillStyle=ttlA(P.ink,0.3); g.beginPath(); g.ellipse(x+1*u,y+0.5*u,w*0.8,1.6*u,0,0,TAU); g.fill();
  ttlWash(g,sh,P.stone,{seed:Math.round(x),amp:0.6*u,layers:1,la:0.3});
  g.save(); ttlPath(g,sh); g.clip(); g.fillStyle=ttlA(P.stoneDark,0.55); g.fillRect(x+w*0.08,y-h,w,h); g.restore();
  if(pr.a1){ g.fillStyle=ttlA('#ffd27a',0.75); g.fillRect(x-w*0.15,y-h*0.6,1.2*u,h*0.35); }
  ttlInk(g,sh.concat([sh[0]]),1.1*u,{col:P.ink,seed:Math.round(x)+5,taper:0.05,straight:true});
}
// one lantern: a paper lantern on a string, lit from inside
function ttlLantern(g,L,P,x,y,r,col,seed){
  const u=L.u, lw=Math.max(0.7,0.9*u);
  g.strokeStyle=ttlA(P.ink,0.8); g.lineWidth=lw*0.8; g.beginPath(); g.moveTo(x,y-r*1.45); g.lineTo(x,y-r); g.stroke();
  const gr=g.createRadialGradient(x-r*0.2,y-r*0.15,r*0.1,x,y,r*1.1); gr.addColorStop(0,P.winHot); gr.addColorStop(0.45,col); gr.addColorStop(1,ttlTone(col,-0.35)); g.fillStyle=gr;
  g.beginPath(); g.ellipse(x,y,r*0.84,r,0,0,TAU); g.fill();
  g.strokeStyle=ttlA(P.ink,0.35); g.lineWidth=lw*0.7; for(const k of [-0.42,0.42]){ g.beginPath(); g.ellipse(x,y,Math.abs(k)*r*0.84,r*0.96,0,k<0?Math.PI/2:-Math.PI/2,k<0?Math.PI*1.5:Math.PI/2); g.stroke(); }
  g.fillStyle=P.ink; g.fillRect(x-r*0.42,y-r*1.06,r*0.84,r*0.24); g.fillRect(x-r*0.36,y+r*0.84,r*0.72,r*0.22);
  g.strokeStyle=ttlA(P.ink,0.7); g.lineWidth=lw*0.7; g.beginPath(); g.moveTo(x,y+r*1.05); g.lineTo(x+(ttlH(seed,3)-0.5)*r*0.3,y+r*1.55); g.stroke();
  ttlInk(g,ttlEll(x,y,r*0.84,r,16),lw,{col:P.ink,closed:true,seed,wob:0.3*u,alpha:0.85});
  TTL.lan.push({x,y,r,ph:ttlH(seed,9)*TAU,sp:2+ttlH(seed,10)*2.5});
}
// a string of lanterns hung between two points
function ttlString(g,L,P,a,b,sag,seed,every){
  const u=L.u, n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/((every||17)*u))), pts=[];
  for(let i=0;i<=24;i++){ const t=i/24; pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+sag*4*t*(1-t)]); }
  ttlInk(g,pts,0.9*u,{col:P.ink,alpha:0.75,seed,taper:0.02,even:true,wob:0.2*u});
  for(let i=1;i<n;i++){ const t=i/n, x=a[0]+(b[0]-a[0])*t, y=a[1]+(b[1]-a[1])*t+sag*4*t*(1-t), r=(4.2+ttlH(seed+i,1)*1.7)*u*Math.max(1,(every||16)/16);
    ttlLantern(g,L,P,x,y+r*1.45,r,P.lan[(seed+i)%P.lan.length],seed*31+i); }
}
// a house seen from the front. k: {gable, roof, far, near, seed, door, frame, tower, rh}
function ttlHouse(g,L,P,x,gy,w,hh,k){
  const u=L.u, R=mulberry32(k.seed), far=!!k.far, near=!!k.near, lw=(far?1.05:near?1.7:1.45)*u, ink=P.ink;
  const x0=x-w/2, x1=x+w/2, ey=gy-hh, gable=!!k.gable, rh=k.rh||(gable?w*(0.5+R()*0.18):hh*(0.55+R()*0.25)), ov=w*0.1;
  const roofCol=P.roofs[k.roof%P.roofs.length], wall=far?P.wallFar:P.wall;
  const out={x,x0,x1,ey,gy,rh,gable,w,hh,far,ridgeY:ey-rh};
  // chimney first, behind the roof
  if(!k.tower&&R()<0.8){ const cx=x+(R()<0.5?-1:1)*w*(0.18+R()*0.14), cw=Math.max(2.6*u,w*0.075), top=ey-rh*(gable?0.62:1)-(7+R()*6)*u, bot=ey-rh*0.25;
    const ch=[[cx-cw,bot],[cx-cw,top],[cx+cw,top],[cx+cw,bot]]; ttlWash(g,ch,P.brick,{seed:k.seed+1,amp:0.5*u,layers:1,la:0.3}); ttlEdges(g,ch,lw*0.85,{col:ink,seed:k.seed+2,open:true});
    g.fillStyle=ttlA(ink,0.85); g.fillRect(cx-cw*1.25,top-1.6*u,cw*2.5,1.8*u);
    const wisp=[]; for(let i=0;i<7;i++) wisp.push([cx+Math.sin(i*0.9+k.seed)*3*u+i*2.2*u,top-3*u-i*5*u]); ttlInk(g,wisp,2.4*u,{col:P.smoke,alpha:P.sb?0.38:0.3,seed:k.seed+3,taper:0.5,wob:1*u}); }
  // walls with the shade on one side and toward the ground
  const wallP=[[x0,gy],[x0,ey],[x1,ey],[x1,gy]];
  ttlWash(g,wallP,wall,{seed:k.seed,amp:0.9*u,layers:2,la:0.2});
  g.save(); ttlPath(g,wallP); g.clip();
  ttlMottle(g,wallP,[ttlTone(wall,0.25),P.wallShade],5,w*0.35,k.seed+9,0.2);
  const sg=g.createLinearGradient(x0,0,x1,0); sg.addColorStop(0,ttlA(P.wallShade,0)); sg.addColorStop(1,ttlA(P.wallShade,P.sb?0.45:0.6)); g.fillStyle=sg; g.fillRect(x0,ey,w,hh);
  const bg=g.createLinearGradient(0,ey,0,gy); bg.addColorStop(0,ttlA(P.wallShade,0.4)); bg.addColorStop(0.22,ttlA(P.wallShade,0)); bg.addColorStop(0.8,ttlA(P.wallShade,0)); bg.addColorStop(1,ttlA(P.wallShade,0.4)); g.fillStyle=bg; g.fillRect(x0,ey,w,hh);
  if(k.frame&&!far){ g.globalAlpha=0.85; const fx=[x0+w*0.04,x0+w*0.34,x0+w*0.66,x1-w*0.04]; for(const xx of fx) ttlInk(g,[[xx,ey],[xx,gy]],1.8*u,{col:P.timber,seed:k.seed+(xx|0),straight:true,taper:0});
    ttlInk(g,[[x0,ey+hh*0.5],[x1,ey+hh*0.5]],1.6*u,{col:P.timber,seed:k.seed+5,straight:true,taper:0});
    for(let i=0;i<fx.length-1;i++) ttlInk(g,[[fx[i],ey+hh*0.5],[fx[i+1],ey+hh*0.02]],1.2*u,{col:P.timber,seed:k.seed+i+11,straight:true,taper:0.05}); g.globalAlpha=1; }
  ttlSpeck(g,wallP,P.ink,Math.round(w*hh/(30*u*u)),k.seed+6,0.15,u);
  g.restore();
  // windows (most of them lit), flower boxes on the near houses, a door
  const two=!far&&hh>32*u&&!k.tower, ww=(far?5.6:near?9:7.6)*u, wh=(far?6.6:near?11:9.6)*u;
  const rows=k.tower?[ey+hh*0.16,ey+hh*0.5]:two?[ey+hh*0.12,ey+hh*0.56]:[ey+hh*(far?0.3:0.24)];
  const nx=gable?(w>58*u?2:1):Math.max(2,Math.min(4,Math.round(w/(27*u))));
  out.wins=[];
  const dw=(near?11:9)*u, dh=Math.min(hh*(two?0.4:0.56),(near?18:15)*u), dx=gable&&nx===1?x+w*0.2:x+(nx%2?w*0.16:0)+(R()-0.5)*w*0.06, hasDoor=k.door!==false&&!far;
  rows.forEach((wy,ri)=>{ for(let i=0;i<nx;i++){ let wx=nx===1?x:x0+w*(0.2+0.6*i/(nx-1)); if(nx===1&&hasDoor&&ri===rows.length-1) wx=x-w*0.2;
    if(hasDoor&&ri===rows.length-1&&Math.abs(wx-dx)<(ww+dw)/2+1*u) continue;
    if(R()<0.1&&!k.tower) continue;
    const lit=R()<0.84, wp=[[wx-ww/2,wy],[wx+ww/2,wy],[wx+ww/2,wy+wh],[wx-ww/2,wy+wh]], round=R()<0.25&&!far;
    const gr=g.createLinearGradient(0,wy,0,wy+wh); gr.addColorStop(0,lit?P.winHot:ttlTone(P.wallShade,-0.3)); gr.addColorStop(1,lit?P.win:ttlTone(P.wallShade,-0.5)); g.fillStyle=gr;
    if(round){ g.beginPath(); g.moveTo(wx-ww/2,wy+wh); g.lineTo(wx-ww/2,wy+ww/2); g.arc(wx,wy+ww/2,ww/2,Math.PI,0); g.lineTo(wx+ww/2,wy+wh); g.closePath(); g.fill(); }
    else { ttlPath(g,wp); g.fill(); }
    g.strokeStyle=ttlA(ink,0.7); g.lineWidth=lw*0.55; g.beginPath(); g.moveTo(wx,wy+(round?ww*0.2:0)); g.lineTo(wx,wy+wh); g.moveTo(wx-ww/2,wy+wh*0.55); g.lineTo(wx+ww/2,wy+wh*0.55); g.stroke();
    if(round) ttlInk(g,[[wx-ww/2,wy+wh],[wx-ww/2,wy+ww/2],[wx-ww*0.36,wy+ww*0.15],[wx,wy],[wx+ww*0.36,wy+ww*0.15],[wx+ww/2,wy+ww/2],[wx+ww/2,wy+wh]],lw*0.8,{col:ink,seed:k.seed+i*3+(wy|0),taper:0.05});
    else ttlEdges(g,wp,lw*0.8,{col:ink,seed:k.seed+i*3+(wy|0),over:0.8*u});
    if(!far){ ttlInk(g,[[wx-ww*0.72,wy+wh+1*u],[wx+ww*0.72,wy+wh+1*u]],1.6*u,{col:ink,seed:k.seed+i+40,taper:0.1,straight:true});
      if(near||R()<0.4){ g.fillStyle=ttlA(P.timber,0.9); g.fillRect(wx-ww*0.6,wy+wh+1.6*u,ww*1.2,2.4*u); for(let f=0;f<5;f++){ g.fillStyle=['#ff6a7a','#ffd25a','#ff9ad0','#ffffff','#ff8a3a'][(k.seed+f)%5]; g.beginPath(); g.arc(wx-ww*0.5+f*ww*0.25,wy+wh+1.2*u,1.1*u,0,TAU); g.fill(); } } }
    if(lit) TTL.wins.push({x:wx,y:wy+wh/2,r:(far?11:near?20:16)*u});
    out.wins.push({x:wx,y:wy,w:ww,h:wh}); } });
  if(hasDoor){ const dp=[[dx-dw/2,gy],[dx-dw/2,gy-dh*0.72],[dx,gy-dh],[dx+dw/2,gy-dh*0.72],[dx+dw/2,gy]], open=R()<0.35;
    g.fillStyle=open?P.win:P.door; ttlPath(g,dp); g.fill();
    if(open){ g.fillStyle=ttlA(P.door,0.95); g.beginPath(); g.moveTo(dx-dw/2,gy); g.lineTo(dx-dw/2,gy-dh*0.72); g.lineTo(dx-dw*0.05,gy-dh*0.9); g.lineTo(dx-dw*0.05,gy); g.closePath(); g.fill(); TTL.wins.push({x:dx,y:gy-dh*0.4,r:22*u}); }
    else { g.strokeStyle=ttlA(ink,0.4); g.lineWidth=0.6*u; g.beginPath(); g.moveTo(dx,gy-dh*0.95); g.lineTo(dx,gy); g.stroke(); g.fillStyle=ttlA(P.win,0.9); g.fillRect(dx+dw*0.2,gy-dh*0.45,1.3*u,1.3*u); }
    ttlInk(g,dp,lw*0.95,{col:ink,seed:k.seed+50,taper:0.05,straight:true});
    ttlInk(g,[[dx-dw*0.75,gy+0.6*u],[dx+dw*0.75,gy+0.6*u]],1.8*u,{col:ttlTone(P.stone,-0.2),seed:k.seed+51,straight:true,taper:0.1}); }
  // roof
  const roofP=gable?[[x0-ov,ey+1.4*u],[x,ey-rh],[x1+ov,ey+1.4*u]]:[[x0-ov,ey+1.4*u],[x0+w*0.14,ey-rh],[x1-w*0.14,ey-rh],[x1+ov,ey+1.4*u]];
  ttlWash(g,roofP,roofCol,{seed:k.seed+3,amp:1.1*u,layers:2,la:0.22});
  g.save(); ttlPath(g,roofP); g.clip();
  const rg=g.createLinearGradient(0,ey-rh,0,ey); rg.addColorStop(0,ttlA(ttlTone(roofCol,0.32),0.5)); rg.addColorStop(1,ttlA(ttlTone(roofCol,-0.4),0.45)); g.fillStyle=rg; g.fillRect(x0-ov,ey-rh,w+ov*2,rh+2*u);
  if(gable){ g.fillStyle=ttlA(ttlTone(roofCol,-0.45),0.36); g.beginPath(); g.moveTo(x,ey-rh); g.lineTo(x1+ov,ey+1.4*u); g.lineTo(x,ey+1.4*u); g.closePath(); g.fill(); }
  else { g.fillStyle=ttlA(ttlTone(roofCol,-0.45),0.3); g.beginPath(); g.moveTo(x1-w*0.14,ey-rh); g.lineTo(x1+ov,ey+1.4*u); g.lineTo(x1-w*0.3,ey+1.4*u); g.closePath(); g.fill(); }
  const rr=Math.max(2,Math.round(rh/((far?4.4:5.4)*u)));
  for(let j=1;j<rr;j++){ const yy=ey-rh+rh*j/rr; for(let xx=x0-ov+((j%2)*3*u);xx<x1+ov;xx+=(far?5:6.4)*u){ if(R()<0.3) continue; g.strokeStyle=ttlA(ink,far?0.17:0.26); g.lineWidth=0.8*u; g.beginPath(); g.moveTo(xx,yy); g.quadraticCurveTo(xx+1.6*u,yy+2.2*u,xx+3.4*u,yy+0.4*u); g.stroke(); } }
  g.restore();
  // a dormer on long roofs
  if(!gable&&!far&&w>70*u&&R()<0.7){ const dxm=x+(R()-0.5)*w*0.3, dwm=12*u, dyb=ey-rh*0.25, dyt=dyb-10*u, dorm=[[dxm-dwm/2,dyb],[dxm-dwm/2,dyt+3*u],[dxm,dyt-4*u],[dxm+dwm/2,dyt+3*u],[dxm+dwm/2,dyb]];
    ttlWash(g,dorm,wall,{seed:k.seed+70,amp:0.4*u,layers:1,la:0.3}); g.fillStyle=P.win; g.fillRect(dxm-3*u,dyt+3.5*u,6*u,6*u); TTL.wins.push({x:dxm,y:dyt+6*u,r:12*u});
    ttlInk(g,[[dxm-dwm/2-2*u,dyt+4*u],[dxm,dyt-5*u],[dxm+dwm/2+2*u,dyt+4*u]],2.6*u,{col:ttlTone(roofCol,-0.2),seed:k.seed+71,straight:true,taper:0.05});
    ttlInk(g,dorm,lw*0.9,{col:ink,seed:k.seed+72,taper:0.05,straight:true}); }
  // the tower's round window (a clock once the coast's clocks have stopped)
  if(k.tower){ const cx=x, cy=ey-rh*0.36, cr=Math.min(w*0.24,6.5*u); out.clock={x:cx,y:cy,r:cr};
    if(TTL.prog&&TTL.prog.a2) ttlClock(g,L,P,cx,cy,cr); else { g.fillStyle=ttlA(P.winHot,0.9); g.beginPath(); g.arc(cx,cy,cr*0.72,0,TAU); g.fill(); ttlInk(g,ttlEll(cx,cy,cr*0.72,cr*0.72,14),lw*0.8,{col:ink,closed:true,seed:k.seed+70}); TTL.wins.push({x:cx,y:cy,r:10*u}); } }
  ttlEdges(g,[[x0,gy],[x0,ey],[x1,ey],[x1,gy]],lw,{col:ink,seed:k.seed+60,open:true});
  ttlEdges(g,roofP,lw*1.05,{col:ink,seed:k.seed+80,open:true});
  ttlInk(g,[[x0-ov-1*u,ey+1.4*u],[x1+ov+1*u,ey+1.4*u]],lw*1.2,{col:ink,seed:k.seed+90,straight:true,taper:0.05});
  if(far){ g.save(); ttlPath(g,roofP.concat([[x1,gy],[x0,gy]])); g.fillStyle=ttlA(P.hillFar,P.sb?0.1:0.16); g.fill(); g.restore(); }
  return out;
}
// the clock stopped at one minute to midnight
function ttlClock(g,L,P,x,y,r){
  const u=L.u; g.fillStyle=P.sb?'#fff6e0':'#e8d8b8'; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
  ttlInk(g,ttlEll(x,y,r,r,16),1.1*u,{col:P.ink,closed:true,seed:77});
  g.strokeStyle=P.ink; g.lineCap='round';
  for(let i=0;i<12;i++){ const a=i/12*TAU; g.lineWidth=0.5*u; g.beginPath(); g.moveTo(x+Math.sin(a)*r*0.76,y-Math.cos(a)*r*0.76); g.lineTo(x+Math.sin(a)*r*0.92,y-Math.cos(a)*r*0.92); g.stroke(); }
  const hour=-(1/60)*TAU/12, min=-(1/60)*TAU;
  g.lineWidth=1.2*u; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.sin(hour)*r*0.5,y-Math.cos(hour)*r*0.5); g.stroke();
  g.lineWidth=0.8*u; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.sin(min)*r*0.84,y-Math.cos(min)*r*0.84); g.stroke();
  g.fillStyle=P.ink; g.beginPath(); g.arc(x,y,0.8*u,0,TAU); g.fill();
}
function ttlTree(g,L,P,x,gy,s,seed){
  const u=L.u, R=mulberry32(seed), blobs=[];
  ttlInk(g,[[x,gy],[x+(R()-0.5)*2*u,gy-s*0.55]],2.4*u,{col:P.timber,seed,taper:0.1,straight:true});
  for(let i=0;i<5;i++) blobs.push([x+(R()-0.5)*s*0.7,gy-s*0.62-R()*s*0.42,s*(0.26+R()*0.14)]);
  for(const [bx,by,br] of blobs) ttlWash(g,ttlEll(bx,by,br,br*0.9,14),P.tree,{seed:seed+(bx|0),amp:1.2*u,layers:2,la:0.28});
  for(const [bx,by,br] of blobs.slice(0,3)) ttlWash(g,ttlEll(bx-br*0.25,by-br*0.3,br*0.5,br*0.4,10),P.treeLit,{seed:seed+(by|0),amp:0.8*u,core:0.55,layers:1,la:0.2});
  for(const [bx,by,br] of blobs){ const arc=[]; for(let k=0;k<=8;k++){ const a=Math.PI*(1.05+k/8*0.95); arc.push([bx+Math.cos(a)*br,by+Math.sin(a)*br*0.9]); } ttlInk(g,arc,1*u,{col:P.ink,alpha:0.6,seed:seed+(br|0),taper:0.3}); }
}
// a festival stall: a counter under a striped awning, a lantern hung under it
function ttlStall(g,L,P,x,gy,s,seed){
  const u=L.u*s, w=34*u, h=26*u, R=mulberry32(seed), x0=x-w/2, x1=x+w/2, top=gy-h, stripe=P.lan[(seed+2)%P.lan.length], cream=P.sb?'#fff2d8':'#d8c4a0';
  for(const px of [x0+2*u,x1-2*u]) ttlInk(g,[[px,gy],[px,top+4*u]],1.6*u,{col:P.timber,seed:seed+(px|0),straight:true,taper:0.05});
  const ctr=[[x0,gy],[x0,gy-h*0.42],[x1,gy-h*0.42],[x1,gy]]; ttlWash(g,ctr,P.door,{seed,amp:0.5*u,layers:1,la:0.3});
  g.fillStyle=ttlA(P.wallShade,0.35); g.fillRect(x0,gy-h*0.42,w,2*u);
  for(let i=0;i<6;i++){ g.fillStyle=['#ffcf5a','#ff7a3a','#ffe08a','#d04a3a'][(seed+i)%4]; g.beginPath(); g.arc(x0+5*u+i*(w-10*u)/5,gy-h*0.42-1.6*u,1.8*u,0,TAU); g.fill(); }
  ttlEdges(g,ctr,1.2*u,{col:P.ink,seed:seed+3,open:true});
  // the awning: stripes, a scalloped edge
  const n=6, aw=[[x0-3*u,top+8*u],[x0+2*u,top],[x1-2*u,top],[x1+3*u,top+8*u]];
  g.save(); ttlPath(g,aw); g.clip(); for(let i=0;i<n;i++){ g.fillStyle=i%2?cream:stripe; g.beginPath(); g.moveTo(x0-3*u+i*(w+6*u)/n,top+8*u); g.lineTo(x0+2*u+i*(w-4*u)/n,top); g.lineTo(x0+2*u+(i+1)*(w-4*u)/n,top); g.lineTo(x0-3*u+(i+1)*(w+6*u)/n,top+8*u); g.closePath(); g.fill(); } g.restore();
  for(let i=0;i<n;i++){ const cx=x0-3*u+(i+0.5)*(w+6*u)/n, r=(w+6*u)/n/2; g.fillStyle=i%2?cream:stripe; g.beginPath(); g.arc(cx,top+8*u,r,0,Math.PI); g.fill(); }
  const sc=[]; for(let i=0;i<=n*4;i++){ const k=i/(n*4), cx=x0-3*u+k*(w+6*u), ph=(k*n)%1; sc.push([cx,top+8*u+Math.sin(ph*Math.PI)*(w+6*u)/n/2]); } ttlInk(g,sc,1*u,{col:P.ink,seed:seed+5,taper:0.05});
  ttlEdges(g,aw.slice(0,4),1.2*u,{col:P.ink,seed:seed+6,open:true});
  ttlLantern(g,L,P,x+(R()-0.5)*w*0.3,top+15*u,3.6*u,P.lan[(seed+4)%P.lan.length],seed+9);
  g.fillStyle=ttlA(P.ink,0.3); g.beginPath(); g.ellipse(x+2*u,gy+1*u,w*0.6,2*u,0,0,TAU); g.fill();
}
// the puppet booth: a tall box with the curtain closed, a striped top, and a little horned puppet hanging at its side
function ttlBooth(g,L,P,x,gy,s,seed){
  const u=L.u*s, w=30*u, h=50*u, x0=x-w/2, x1=x+w/2, top=gy-h, cloth=P.sb?'#7a3a6a':'#3a1428', curtain=P.sb?'#d8443a':'#8a1e18', cream=P.sb?'#fff2d8':'#d8c4a0';
  const box=[[x0,gy],[x0,top+10*u],[x1,top+10*u],[x1,gy]]; ttlWash(g,box,cloth,{seed,amp:0.6*u,layers:1,la:0.3});
  g.save(); ttlPath(g,box); g.clip(); g.strokeStyle=ttlA(P.ink,0.25); g.lineWidth=0.7*u; for(let xx=x0+4*u;xx<x1;xx+=5*u){ g.beginPath(); g.moveTo(xx,top+30*u); g.quadraticCurveTo(xx+1*u,gy-8*u,xx-0.5*u,gy); g.stroke(); }
  const sh=g.createLinearGradient(x0,0,x1,0); sh.addColorStop(0,ttlA(P.wallShade,0)); sh.addColorStop(1,ttlA(P.wallShade,0.45)); g.fillStyle=sh; g.fillRect(x0,top,w,h); g.restore();
  // the stage window with its curtain closed
  const sw0=x0+4*u, sw1=x1-4*u, sy0=top+13*u, sy1=top+29*u;
  g.fillStyle=P.sb?'#2a1630':'#0a0408'; g.fillRect(sw0,sy0,sw1-sw0,sy1-sy0);
  for(const sd of [0,1]){ const cx0=sd?x:sw0, cx1=sd?sw1:x; g.fillStyle=curtain; g.beginPath(); g.moveTo(cx0,sy0); g.lineTo(cx1,sy0); g.quadraticCurveTo(sd?cx1-1*u:cx1+1*u,sy1-6*u,cx1,sy1); g.lineTo(cx0,sy1); g.closePath(); g.fill();
    g.strokeStyle=ttlA(P.ink,0.35); g.lineWidth=0.6*u; for(let k=1;k<4;k++){ const xx=cx0+(cx1-cx0)*k/4; g.beginPath(); g.moveTo(xx,sy0); g.lineTo(xx+(sd?-0.5:0.5)*u,sy1); g.stroke(); } }
  g.fillStyle=P.sb?'#ffcf5a':'#c89a3a'; g.fillRect(sw0-1*u,sy0-2.4*u,sw1-sw0+2*u,2.4*u); g.fillRect(sw0-1*u,sy1,sw1-sw0+2*u,2*u);
  ttlEdges(g,[[sw0,sy1],[sw0,sy0],[sw1,sy0],[sw1,sy1]],0.9*u,{col:P.ink,seed:seed+2});
  // a painted star on the front
  ttlTwinkle(g,x,top+38*u,3.6*u,P.sb?'255,214,120':'220,170,80',0.9);
  // the striped top
  const roof=[[x0-3*u,top+10*u],[x,top-2*u],[x1+3*u,top+10*u]];
  g.save(); ttlPath(g,roof); g.clip(); for(let i=0;i<5;i++){ g.fillStyle=i%2?cream:P.lan[0]; g.beginPath(); g.moveTo(x,top-2*u); g.lineTo(x0-3*u+i*(w+6*u)/5,top+10*u); g.lineTo(x0-3*u+(i+1)*(w+6*u)/5,top+10*u); g.closePath(); g.fill(); } g.restore();
  ttlEdges(g,roof,1.2*u,{col:P.ink,seed:seed+3,open:true}); ttlEdges(g,box,1.2*u,{col:P.ink,seed:seed+4,open:true});
  ttlInk(g,[[x,top-2*u],[x,top-9*u]],0.9*u,{col:P.ink,seed:seed+5,straight:true}); g.fillStyle=P.lan[1]; g.beginPath(); g.moveTo(x,top-9*u); g.lineTo(x+6*u,top-7*u); g.lineTo(x,top-5*u); g.closePath(); g.fill();
  // the puppet: a little green dragon with felt horns, hanging by its string, resting
  const px=x1+4*u, py0=top+12*u, py=py0+12*u; ttlInk(g,[[px-2*u,py0],[px,py-4*u]],0.5*u,{col:P.ink,seed:seed+6,straight:true}); ttlInk(g,[[px+2*u,py0],[px,py-4*u]],0.5*u,{col:P.ink,seed:seed+7,straight:true});
  g.fillStyle=P.sb?'#5aa04a':'#2e5a24'; g.beginPath(); g.ellipse(px,py,3*u,3.6*u,0,0,TAU); g.fill(); g.beginPath(); g.ellipse(px+2.6*u,py+1.4*u,2.2*u,1.5*u,0.3,0,TAU); g.fill();
  g.fillStyle=cream; for(const sd of [-1,1]){ g.beginPath(); g.moveTo(px+sd*1.6*u,py-3*u); g.lineTo(px+sd*2.6*u,py-6.4*u); g.lineTo(px+sd*0.4*u,py-3.4*u); g.closePath(); g.fill(); }
  g.fillStyle=P.ink; g.fillRect(px+0.6*u,py-0.6*u,1*u,1*u);
  ttlInk(g,ttlEll(px,py,3*u,3.6*u,10),0.6*u,{col:P.ink,closed:true,seed:seed+8,alpha:0.8});
  g.fillStyle=ttlA(P.ink,0.3); g.beginPath(); g.ellipse(x+2*u,gy+1*u,w*0.62,2*u,0,0,TAU); g.fill();
}
function ttlTown(g,L,P,pr){
  const u=L.u, w=L.W, R=mulberry32(7300), ts=L.side?1.2:1, tsm=L.side?1.42:1, gl=L.green, back=[], mid=[], front=[];
  const tm=L.side?L.H*0.905:L.y1+18*u, py=L.side?L.t0+(tm-L.t0)*0.5:(L.t0+tm)/2+2*u;
  // the ground of the green: misty toward the back, darker toward us
  { const gg=g.createLinearGradient(0,L.t0-10*u,0,L.H); gg.addColorStop(0,ttlA(P.grassLit,P.sb?0.3:0.18)); gg.addColorStop(0.3,ttlA(P.hillNear,0)); gg.addColorStop(0.62,ttlA(P.grassDark,0.4)); gg.addColorStop(1,ttlA(P.grassDark,0.85)); g.fillStyle=gg; g.fillRect(0,L.t0-10*u,w,L.H); }
  // a lane across the green, from the near grass to the houses at the back
  { const cx=(gl[0]+gl[1])/2, yb=L.H+6*u, ya=L.t0+4*u, lp=[], rp=[]; for(let i=0;i<=16;i++){ const t=i/16, x=cx+Math.sin(t*3.4+0.2)*40*u*(1-t)+(1-t)*24*u, y=yb+(ya-yb)*Math.pow(t,0.8), hw=(7+44*Math.pow(1-t,1.8))*u*ts; lp.push([x-hw,y]); rp.push([x+hw,y]); }
    const poly=lp.concat(rp.reverse()); ttlWash(g,poly,P.path,{seed:51,amp:3*u,core:P.sb?0.22:0.24,layers:3,la:0.07}); ttlMottle(g,poly,[P.grassDark,P.path,P.grassDark],12,26*u,52,0.24);
    { const RC=mulberry32(57); g.save(); ttlPath(g,poly); g.clip(); g.strokeStyle=ttlA(P.ink,0.22); g.lineWidth=0.8*u; for(let i=0;i<90;i++){ const t=RC(), y=yb+(ya-yb)*Math.pow(t,0.8), x=cx+Math.sin(t*3.4+0.2)*40*u*(1-t)+(1-t)*24*u+(RC()-0.5)*1.8*(7+44*Math.pow(1-t,1.8))*u*ts, r=(1+3.5*(1-t))*u; g.beginPath(); g.ellipse(x,y,r,r*0.45,0,Math.PI*1.1,Math.PI*1.9); g.stroke(); } g.restore(); }
    ttlInk(g,lp,1*u,{col:P.ink,alpha:0.3,seed:53,taper:0.3}); ttlInk(g,rp.slice().reverse(),1*u,{col:P.ink,alpha:0.3,seed:54,taper:0.3}); }
  // the back row, end to end, with the tower near the green
  const towerX=L.side?L.x0+L.sw*0.42:w*0.4;
  let x=-20*u, seed=100;
  while(x<w+40*u){ const hw=(46+R()*30)*u*ts, isT=Math.abs(x+hw/2-towerX)<hw*0.6&&!back.some(b=>b.tower);
    back.push({x:x+hw/2,w:isT?26*u*ts:hw,hh:isT?54*u*ts:(20+R()*12)*u*ts,gable:isT||R()<0.5,roof:(seed*7)%6,seed:seed++,tower:isT,rh:isT?34*u*ts:0}); x+=(isT?30*u*ts:hw)+(R()-0.35)*10*u; }
  for(const b of back){ const gy=L.t0+(ttlH(b.seed,4)-0.5)*6*u; if(R()<0.35&&!b.tower) ttlTree(g,L,P,b.x+b.w*0.55,gy,(26+R()*10)*u*ts,b.seed+500); b.out=ttlHouse(g,L,P,b.x,gy,b.w,b.hh,{gable:b.gable,roof:b.roof,far:true,seed:b.seed,door:false,tower:b.tower,rh:b.rh}); }
  // the green: posts with lanterns, and strings between the posts and the houses around them
  const ph=(L.side?44:34)*u*ts, posts=[gl[0]+(gl[1]-gl[0])*0.12,(gl[0]+gl[1])/2,gl[1]-(gl[1]-gl[0])*0.12].map((px,i)=>[px,py+(i===1?-5*u:0)]);
  for(const [px,pyy] of posts){ ttlInk(g,[[px,pyy],[px,pyy-ph]],3.4*u,{col:P.timber,seed:px|0,taper:0.05,straight:true}); ttlInk(g,[[px-1.7*u,pyy],[px-1.7*u,pyy-ph]],1*u,{col:P.ink,alpha:0.8,seed:(px|0)+1,straight:true,taper:0.1}); ttlInk(g,[[px+1.8*u,pyy],[px+1.8*u,pyy-ph]],1*u,{col:P.ink,alpha:0.8,seed:(px|0)+2,straight:true,taper:0.1});
    ttlInk(g,[[px-7*u,pyy-ph+3*u],[px+7*u,pyy-ph+3*u]],2.2*u,{col:P.timber,seed:(px|0)+3,straight:true,taper:0.1}); g.fillStyle=ttlA(P.ink,0.3); g.beginPath(); g.ellipse(px+2*u,pyy+1*u,6*u,1.6*u,0,0,TAU); g.fill(); }
  const tops=posts.map(([px,pyy])=>[px,pyy-ph+3*u]);
  ttlStall(g,L,P,gl[0]+(gl[1]-gl[0])*0.31,py+6*u,ts,21); ttlBooth(g,L,P,gl[0]+(gl[1]-gl[0])*0.69,py+8*u,ts,22);
  // the middle row: houses either side of the green
  const midSpan=L.side?[[L.x0-L.sw*0.3,gl[0]-4*u],[gl[1]+4*u,w+40*u]]:[[-30*u,gl[0]-4*u],[gl[1]+4*u,w+40*u]];
  for(const [a,b] of midSpan){ for(let x2=a;x2<b;){ const hw=(56+R()*26)*u*tsm; if(x2+hw*0.5<b+hw*0.3) mid.push({x:x2+hw/2,w:hw}); x2+=hw+(3+R()*7)*u; } }
  const strings=[];
  for(const m of mid){ const sd=seed++, gy=tm+(ttlH(sd,5)-0.5)*5*u, hh=(30+R()*10)*u*tsm, gable=R()<0.55;
    m.out=ttlHouse(g,L,P,m.x,gy,m.w,hh,{gable,roof:(sd*5)%6,seed:sd,frame:R()<0.45,near:L.side}); if(R()<0.3){ const tx=m.x+m.w*0.56; if(tx<w) ttlTree(g,L,P,tx,gy+2*u,(30+R()*12)*u*tsm,sd+900); } }
  const lm=mid.filter(m=>m.x<gl[0]).pop(), rm=mid.find(m=>m.x>gl[1]);
  const tw=back.find(b=>b.tower);
  ttlString(g,L,P,tops[0],tops[1],12*u*ts,11,17*ts); ttlString(g,L,P,tops[1],tops[2],12*u*ts,12,17*ts);
  if(lm) ttlString(g,L,P,[lm.out.x1+lm.out.w*0.06,lm.out.ey+1*u],tops[0],10*u,13,16*ts);
  if(rm) ttlString(g,L,P,tops[2],[rm.out.x0-rm.out.w*0.06,rm.out.ey+1*u],10*u,14,16*ts);
  if(tw&&tw.out) ttlString(g,L,P,[tw.out.x+2*u,tw.out.ey-tw.out.rh*0.1],tops[1],16*u,15,16*ts);
  // bigger lanterns on the post tops: the moth's favourite places
  for(const [px,pyy] of tops){ ttlLantern(g,L,P,px,pyy-10*u*ts,7*u*ts,P.lan[(px|0)%P.lan.length],(px|0)+7); TTL.perch.push(TTL.lan[TTL.lan.length-1]); }
  // after the finale, if Ash lit one more: a fourth post of new wood with a little lantern, nearer to us
  if(pr.four){ const fx=gl[0]+(gl[1]-gl[0])*0.42, fy=py+(L.side?30:14)*u, fh=ph*0.86;
    ttlInk(g,[[fx,fy],[fx,fy-fh]],3*u,{col:P.sb?'#c89a64':'#7a5a38',seed:401,taper:0.05,straight:true}); ttlInk(g,[[fx-1.6*u,fy],[fx-1.6*u,fy-fh]],0.9*u,{col:P.ink,alpha:0.8,seed:402,straight:true,taper:0.1}); ttlInk(g,[[fx+1.7*u,fy],[fx+1.7*u,fy-fh]],0.9*u,{col:P.ink,alpha:0.8,seed:403,straight:true,taper:0.1});
    ttlInk(g,[[fx-5*u,fy-fh+3*u],[fx+5*u,fy-fh+3*u]],2*u,{col:P.sb?'#c89a64':'#7a5a38',seed:404,straight:true,taper:0.1}); g.fillStyle=P.sb?'#fff2d8':'#d8c4a0'; g.fillRect(fx+2.4*u,fy-fh*0.55,5*u,3.4*u); ttlEdges(g,[[fx+2.4*u,fy-fh*0.55],[fx+7.4*u,fy-fh*0.55],[fx+7.4*u,fy-fh*0.55+3.4*u],[fx+2.4*u,fy-fh*0.55+3.4*u]],0.6*u,{col:P.ink,seed:405});
    ttlLantern(g,L,P,fx,fy-fh+3*u-7*u,4.6*u,P.lan[3],406); TTL.four=TTL.lan[TTL.lan.length-1]; posts.push([fx,fy]); }
  // warm pools of lantern light on the grass under the posts, the stall and the booth
  { g.save(); g.globalCompositeOperation='lighter'; const spots=posts.map(p=>[p[0],p[1]+2*u,1]).concat([[gl[0]+(gl[1]-gl[0])*0.31,py+8*u,0.8],[gl[0]+(gl[1]-gl[0])*0.69,py+10*u,0.8]]);
    for(const [qx,qy,k] of spots){ const rx=46*u*ts*k, gr=g.createRadialGradient(qx,qy,0,qx,qy,rx); gr.addColorStop(0,`rgba(${P.lanGlow},${P.sb?0.22:0.26})`); gr.addColorStop(0.5,`rgba(${P.lanGlow},${P.sb?0.08:0.1})`); gr.addColorStop(1,`rgba(${P.lanGlow},0)`); g.fillStyle=gr; g.save(); g.translate(qx,qy); g.scale(1,0.28); g.translate(-qx,-qy); g.fillRect(qx-rx,qy-rx,rx*2,rx*2); g.restore(); } g.restore(); }
  // the front row, only at the edges, close and big
  if(L.side){ const fr=[[L.x0-L.sw*0.5,L.x0+L.sw*0.02],[w-L.sw*0.1,w+80*u]];
    for(const [a,b] of fr) for(let x2=a;x2<b;){ const hw=(96+R()*26)*u*tsm; front.push({x:x2+hw/2,w:hw}); x2+=hw+(4+R()*8)*u; }
    for(const f of front){ const sd=seed++, gy=L.t1+(ttlH(sd,6)-0.5)*4*u, hh=(50+R()*10)*u*tsm; f.out=ttlHouse(g,L,P,f.x,gy,f.w,hh,{gable:R()<0.5,roof:(sd*3)%6,seed:sd,frame:R()<0.6,near:true}); } }
  // the small figure with horns and a tail, sitting on a roof, looking at the mountain
  const vis=L.vis, cands=(L.side?mid.filter(m=>m.x>gl[1]):back).map(b=>b.out).filter(o=>o&&!o.far===!!L.side&&o.x>vis.x0+20*u&&o.x<vis.x1-30*u&&o.ridgeY>vis.y0+20*u&&o.ridgeY<vis.y1-14*u&&(L.side||o.x>w*0.55));
  const roofOf=cands.length?cands[Math.min(cands.length-1,L.side?0:1)]:null;
  if(roofOf){ const rx=roofOf.gable?roofOf.x:roofOf.x0+roofOf.w*0.34, ry=roofOf.ridgeY+(roofOf.gable?1.4*u:0.8*u); ttlRoofKid(g,L,P,rx,ry,L.side?1.12:1.05);
    if(pr.a4){ const wn=(roofOf.wins||[])[0]; if(wn) ttlShell(g,L,P,wn.x+wn.w*0.25,wn.y+wn.h+0.2*u,(roofOf.far?4:5.2)*u); else ttlShell(g,L,P,roofOf.x0+6*u,roofOf.ey+4*u,4*u); } }
  else if(pr.a4){ const p=TTL.perch[2]||TTL.perch[0]; if(p) ttlShell(g,L,P,p.x+5*u,py-1*u,4.4*u); }
  // where the moth may sit: the post lanterns, and string lanterns in plain view
  const inView=q=>q.x>vis.x0+10*u&&q.x<vis.x1-10*u&&q.y>vis.y0+10*u&&q.y<vis.y1-10*u&&(!L.side||q.x>L.colR+24*u);
  TTL.perch=TTL.perch.filter(inView); for(const q of TTL.lan) if(TTL.perch.length<6&&inView(q)&&!TTL.perch.includes(q)&&q.r>4.4*u) TTL.perch.push(q);
  if(TTL.four) TTL.perch.unshift(TTL.four);
}
// a child on the ridge, seen from behind: red like an ember, two cream horns curving back, a tail down the roof (the
// tail moves; it is drawn each frame)
function ttlRoofKid(g,L,P,x,y,s){
  const u=L.u*s, ink=P.ink, body=P.sb?'#7c2c2a':'#3a100c', rim=P.sb?'#ffb46a':'#ff8a3a', horn=P.sb?'#efe0bf':'#c4b090';
  g.save(); g.globalCompositeOperation='lighter'; ttlRad(g,x,y-9*u,15*u,P.lanGlow,0.2); g.restore();
  const back=[[x-4.6*u,y],[x-4.5*u,y-5.6*u],[x-3.2*u,y-9.2*u],[x+3.2*u,y-9.2*u],[x+4.5*u,y-5.6*u],[x+4.6*u,y]];
  g.fillStyle=body; ttlPath(g,back); g.fill();
  g.beginPath(); g.ellipse(x-4.9*u,y-1.8*u,1.7*u,2.1*u,0,0,TAU); g.ellipse(x+4.9*u,y-1.8*u,1.7*u,2.1*u,0,0,TAU); g.fill();
  g.beginPath(); g.arc(x,y-12.2*u,3.7*u,0,TAU); g.fill();
  // tousled hair on top of the head, dark
  g.fillStyle=ttlTone(body,-0.45); g.beginPath(); g.arc(x,y-13.2*u,3.5*u,Math.PI*1.02,Math.PI*1.98); g.closePath(); g.fill();
  for(const sd of [-1,1]){ const hp=[[x+sd*1.2*u,y-15.2*u],[x+sd*2.6*u,y-16.2*u],[x+sd*3.5*u,y-18.6*u],[x+sd*3.4*u,y-21.4*u],[x+sd*2.8*u,y-19*u],[x+sd*1.9*u,y-17.4*u],[x+sd*0.6*u,y-16.4*u]];
    g.fillStyle=horn; ttlPath(g,hp); g.fill(); ttlInk(g,hp,0.6*u,{col:ink,closed:true,seed:sd+3,wob:0.1*u,alpha:0.85}); }
  ttlInk(g,[[x-4.6*u,y],[x-4.5*u,y-5.6*u],[x-3.2*u,y-9.2*u]],1*u,{col:rim,alpha:0.85,seed:3,taper:0.3});
  ttlInk(g,[[x-3.5*u,y-11.6*u],[x-2.4*u,y-14.6*u],[x-0.6*u,y-15.6*u]],0.8*u,{col:rim,alpha:0.7,seed:4,taper:0.3});
  ttlInk(g,ttlEll(x,y-12.2*u,3.7*u,3.7*u,12),0.6*u,{col:ink,closed:true,seed:8,alpha:0.6});
  TTL.tail={x:x+2.6*u,y:y-1*u,u,body,rim};
}
function ttlShell(g,L,P,x,y,s){
  const u=L.u, ribs=6; g.fillStyle=P.shell; g.beginPath(); g.moveTo(x,y); for(let i=0;i<=ribs;i++){ const a=Math.PI*(1.08+i/ribs*0.84); g.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s*0.95); } g.closePath(); g.fill();
  g.strokeStyle=ttlA(P.ink,0.75); g.lineWidth=0.55*u; for(let i=1;i<ribs;i++){ const a=Math.PI*(1.08+i/ribs*0.84); g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*s*0.95,y+Math.sin(a)*s*0.9); g.stroke(); }
  const arc=[]; for(let i=0;i<=ribs*2;i++){ const a=Math.PI*(1.08+i/(ribs*2)*0.84); arc.push([x+Math.cos(a)*s,y+Math.sin(a)*s*0.95]); } ttlInk(g,arc,0.9*u,{col:P.ink,seed:61,taper:0.1});
  g.fillStyle=P.ink; g.fillRect(x-1.2*u,y-0.4*u,2.4*u,1*u);
}
function ttlForeground(g,L,P,pr){
  const u=L.u, w=L.W, R=mulberry32(8800), top=[];
  for(let x=-10*u;x<=w+10*u;x+=4*u) top.push([x,L.fg+Math.sin(x/(90*u))*5*u+(ttlN(x/(30*u),3)-0.5)*6*u]);
  const poly=top.concat([[w+10*u,L.H+10],[-10*u,L.H+10]]);
  ttlWash(g,poly,P.grass,{seed:41,amp:2*u,layers:2,la:0.2});
  ttlMottle(g,poly,[P.grassLit,P.grassDark],16,60*u,42,0.3);
  g.save(); ttlPath(g,poly); g.clip(); const dg=g.createLinearGradient(0,L.fg,0,L.H); dg.addColorStop(0,ttlA(P.grassDark,0)); dg.addColorStop(1,ttlA(P.grassDark,0.75)); g.fillStyle=dg; g.fillRect(0,L.fg-10*u,w,L.H); g.restore();
  ttlInk(g,top,1.5*u,{col:P.ink,alpha:0.7,seed:43,taper:0.02,wob:1*u});
  // tufts along the bank
  for(let x=-5*u;x<w;x+=(5+R()*9)*u){ const y=L.fg+Math.sin(x/(90*u))*5*u+(ttlN(x/(30*u),3)-0.5)*6*u+2*u; for(let k=-1;k<=1;k++){ const l=(4+R()*5)*u; ttlInk(g,[[x+k*1.6*u,y],[x+k*1.6*u+k*2*u+(R()-0.5)*2*u,y-l]],1*u,{col:k?P.ink:P.grassLit,alpha:k?0.55:0.8,seed:(x|0)+k,taper:0.5,straight:true}); } }
  // a pond on the green (wide screens): the sky in it, ripples, reeds; the lanterns (and the moon, when it is over it) shimmer in it each frame
  TTL.pond=null;
  if(L.side){ const pxc=L.x0+L.sw*0.29, pyc=L.H*0.935, rx=Math.min(96*u,L.sw*0.17), ry=14*u, pond=ttlEll(pxc,pyc,rx,ry,30);
    ttlWash(g,pond,P.sb?'#272c5e':'#0c0a18',{seed:71,amp:1.4*u,layers:2,la:0.25});
    g.save(); ttlPath(g,pond); g.clip(); const rg=g.createLinearGradient(0,pyc-ry,0,pyc+ry); rg.addColorStop(0,ttlA(P.sky[4][1],P.sb?0.55:0.45)); rg.addColorStop(0.35,ttlA(P.sky[3][1],0.25)); rg.addColorStop(1,ttlA(P.sky[0][1],0.2)); g.fillStyle=rg; g.fillRect(pxc-rx,pyc-ry,rx*2,ry*2);
    for(let i=0;i<16;i++){ const yy=pyc-ry*0.75+i*ry*0.1, xx=pxc+(R()-0.5)*rx*1.5*(1-Math.abs(i/16-0.5)), l=(6+R()*12)*u; ttlInk(g,[[xx-l,yy],[xx+l,yy]],0.8*u,{col:i%3?'#ffffff':P.ink,alpha:i%3?0.32:0.3,seed:i+80,straight:true,taper:0.45}); }
    g.restore();
    const lip=[]; for(let i=0;i<=20;i++){ const a=Math.PI*(0.04+i/20*0.92); lip.push([pxc+Math.cos(a)*rx,pyc+Math.sin(a)*ry]); } ttlInk(g,lip,1.3*u,{col:P.ink,alpha:0.75,seed:83,taper:0.15});
    const back=[]; for(let i=0;i<=20;i++){ const a=Math.PI*(1.04+i/20*0.92); back.push([pxc+Math.cos(a)*rx,pyc+Math.sin(a)*ry]); } ttlInk(g,back,1*u,{col:P.ink,alpha:0.45,seed:84,taper:0.2});
    for(const ex of [pxc-rx*0.92,pxc+rx*0.95]) for(let k=0;k<6;k++){ const x=ex+(R()-0.5)*12*u, y=pyc+(R()-0.3)*ry*0.6, l=(8+R()*10)*u; ttlInk(g,[[x,y],[x+(R()-0.5)*4*u,y-l]],1.1*u,{col:k%2?P.ink:P.grassLit,alpha:0.75,seed:k+(ex|0),taper:0.4,straight:true}); if(k%3===0){ g.fillStyle=P.timber; g.beginPath(); g.ellipse(x+(R()-0.5)*2*u,y-l*0.85,1.1*u,2.6*u,0,0,TAU); g.fill(); } }
    TTL.pond={x:pxc,y:pyc,rx,ry,poly:pond}; }
  // a low fence on the right
  const f0=L.side?L.x0+L.sw*0.62:w*0.62, f1=w+10*u, fy=L.fg+2*u;
  for(let x=f0;x<f1;x+=16*u){ const yy=fy+Math.sin(x/(90*u))*5*u; ttlInk(g,[[x,yy+6*u],[x+0.6*u,yy-12*u]],2.6*u,{col:P.fence,seed:x|0,straight:true,taper:0.08}); ttlInk(g,[[x-1.4*u,yy+6*u],[x-0.8*u,yy-12*u]],0.9*u,{col:P.ink,alpha:0.7,seed:(x|0)+1,straight:true}); }
  for(const dy of [-8,-2]){ const pts=[]; for(let x=f0-4*u;x<f1;x+=12*u) pts.push([x,fy+dy*u+Math.sin(x/(90*u))*5*u]); if(pts.length>1){ ttlInk(g,pts,1.8*u,{col:P.fence,seed:dy+70,taper:0.03,even:true}); ttlInk(g,pts.map(p=>[p[0],p[1]+1.2*u]),0.8*u,{col:P.ink,alpha:0.6,seed:dy+71,taper:0.03}); } }
  // wildflowers and tufts on the green
  { const y0=L.side?L.H*0.875:L.t0+8*u, y1=L.side?L.fg:L.y1; const cols=P.sb?['#ffd25a','#ff8ab0','#ffffff','#ff7a5a','#c8a0ff']:['#c89a3a','#a85a6a','#c8bca8','#a8502a'];
    for(let i=0;i<Math.round((L.side?L.sw:w)/(5*u));i++){ const x=(L.side?L.x0:0)+R()*(L.side?L.sw:w), y=y0+Math.pow(R(),0.8)*(y1-y0), r=(0.8+R()*0.9)*u*(0.7+0.5*(y-y0)/(y1-y0+1));
      if(R()<0.35){ ttlInk(g,[[x,y+2*u],[x+(R()-0.5)*2*u,y-3*u*(1+(y-y0)/(y1-y0+1))]],0.9*u,{col:R()<0.5?P.grassLit:P.ink,alpha:0.55,seed:i,taper:0.5,straight:true}); continue; }
      g.fillStyle=cols[i%cols.length]; g.globalAlpha=0.85; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); g.globalAlpha=1; } }
  // a tall lantern post close by, on the right of the lane (the lantern on it is one the moth likes)
  if(L.side){ const ts=1.3, px=L.x0+L.sw*0.66, by=L.H*1.01, ph=150*u*ts, ax=px-24*u*ts, ay=by-ph+8*u;
    ttlInk(g,[[px,by],[px+1*u,by-ph]],8*u,{col:P.timber,seed:301,taper:0.04,straight:true});
    ttlInk(g,[[px-3.2*u,by],[px-2.2*u,by-ph]],1.4*u,{col:P.ink,seed:302,straight:true,taper:0.05}); ttlInk(g,[[px+3.6*u,by],[px+4.2*u,by-ph]],1.4*u,{col:P.ink,seed:303,straight:true,taper:0.05});
    ttlInk(g,[[px+2*u,by-ph+2*u],[ax-2*u,ay-2*u]],3*u,{col:P.timber,seed:304,taper:0.05,straight:true}); ttlInk(g,[[px+2*u,by-ph+6*u],[px-10*u,by-ph+16*u]],1.6*u,{col:P.timber,seed:305,taper:0.1,straight:true});
    ttlInk(g,[[px+2*u,by-ph+3.6*u],[ax-2*u,ay-0.4*u]],0.9*u,{col:P.ink,seed:306,straight:true,taper:0.05});
    g.fillStyle=P.ink; g.beginPath(); g.arc(px+1*u,by-ph-2*u,3.2*u,0,TAU); g.fill();
    ttlLantern(g,L,P,ax,ay+15*u*ts,11*u*ts,P.lan[1],311); TTL.perch.splice(TTL.four?1:0,0,TTL.lan[TTL.lan.length-1]);
    g.fillStyle=ttlA(P.ink,0.35); g.beginPath(); g.ellipse(px+4*u,by,14*u,3*u,0,0,TAU); g.fill(); }
  // fireflies to wander over the grass and the green
  TTL.flies=[]; const fr=mulberry32(9001), n=L.side?10:7;
  for(let i=0;i<n;i++) TTL.flies.push({x:L.x0+fr()*L.sw,y:(L.side?L.t0:L.hz)+fr()*((L.side?L.H*0.95:L.y1)-(L.side?L.t0:L.hz)),ph:fr()*TAU,sp:0.4+fr()*0.6,s:fr()*1000});
}

// ---------- sprites built with the layers (clouds, smoke, the mountain's cloud and the shadow in it, glows)
function ttlSprites(L,P,pr){
  const u=L.u, d=TTL.dpr, S=TTL.spr;
  const glow=(rgb,a)=>{ const s=64, c=ttlMk(s,s), g=c.getContext('2d'), gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2); gr.addColorStop(0,`rgba(${rgb},${a})`); gr.addColorStop(0.22,`rgba(${rgb},${a*0.5})`); gr.addColorStop(0.55,`rgba(${rgb},${a*0.14})`); gr.addColorStop(1,`rgba(${rgb},0)`); g.fillStyle=gr; g.fillRect(0,0,s,s); return c; };
  S.glowLan=glow(P.lanGlow,1); S.glowWin=glow(P.winGlow,0.7); S.glowMoth=glow(P.mothGlow,1); S.glowFly=glow(P.fly,1); S.glowGate=glow(P.winGlow,1);
  // clouds: soft lumps with a lit top and a shaded belly
  TTL.clouds=[]; const R=mulberry32(2024), n=L.side?4:3;
  for(let i=0;i<n;i++){ const cw=(150+R()*130)*u, ch=(34+R()*24)*u, c=ttlMk((cw+40*u)*d,(ch+40*u)*d), g=c.getContext('2d'); g.setTransform(d,0,0,d,0,0);
    const cx=cw/2+20*u, base=ch+16*u, lumps=[]; for(let k=0;k<7;k++){ const lx=cx+(k/6-0.5)*cw*0.85, lr=(0.42+R()*0.5)*ch*(1-Math.abs(k/6-0.5)*0.8); lumps.push([lx,base-lr*0.7,lr]); }
    for(const [lx,ly,lr] of lumps) ttlWash(g,ttlEll(lx,ly,lr*1.25,lr,16),P.cloud,{seed:i*10+(lx|0),amp:2*u,core:0.6,layers:3,la:0.16});
    g.save(); g.globalCompositeOperation='source-atop'; const lg=g.createLinearGradient(0,base-ch,0,base); lg.addColorStop(0,ttlA(P.cloudLit,0.7)); lg.addColorStop(0.6,ttlA(P.cloud,0)); lg.addColorStop(1,ttlA(P.cloudShade,0.55)); g.fillStyle=lg; g.fillRect(0,0,cw+40*u,ch+40*u); g.restore();
    for(const [lx,ly,lr] of lumps.slice(1,6)){ const arc=[]; for(let k=0;k<=8;k++){ const a=Math.PI*(1.12+k/8*0.76); arc.push([lx+Math.cos(a)*lr*1.25,ly+Math.sin(a)*lr]); } ttlInk(g,arc,0.9*u,{col:P.ink,alpha:P.sb?0.3:0.4,seed:(lx|0)+i,taper:0.4}); }
    const y=(L.side?L.H*(0.05+R()*0.22):L.y0+R()*(L.bh*0.3))-ch/2;
    TTL.clouds.push({c,w:cw+40*u,h:ch+40*u,x:R()*(L.W+cw)-cw*0.5,y,sp:(3+R()*5)*u*(R()<0.25?-1:1),a:0.62+R()*0.25}); }
  // smoke puffs (a soft watercolour blot)
  { const s=48, c=ttlMk(s,s), g=c.getContext('2d'); ttlWash(g,ttlEll(s/2,s/2,s*0.36,s*0.32,16),P.smoke,{seed:5,amp:3,core:0.45,layers:4,la:0.12}); S.puff=c; }
  // the mountain's cloud with the horned shadow in it (only while it still smokes)
  S.mcloud=null; S.horns=null;
  if(!pr.a1){ const cw=176*u, ch=118*u, c=ttlMk(cw*d,ch*d), g=c.getContext('2d'); g.setTransform(d,0,0,d,0,0); const RR=mulberry32(77);
    for(let k=0;k<13;k++){ const a=k/13*TAU, rr=(17+RR()*13)*u, lx=cw/2+Math.cos(a)*cw*0.27*(0.6+RR()*0.5), ly=ch*0.55+Math.sin(a)*ch*0.2*(0.6+RR()*0.5); ttlWash(g,ttlEll(lx,ly,rr*1.2,rr,14),P.smoke,{seed:k+3,amp:2.4*u,core:0.3,layers:3,la:0.11}); }
    g.save(); g.globalCompositeOperation='source-atop'; const lg=g.createLinearGradient(0,0,0,ch); lg.addColorStop(0,ttlA(P.cloudLit,0.34)); lg.addColorStop(1,ttlA(P.smokeDark,0.3)); g.fillStyle=lg; g.fillRect(0,0,cw,ch); g.restore();
    S.mcloud={c,w:cw,h:ch};
    const hc=ttlMk(cw*d,ch*d), h=hc.getContext('2d'); h.setTransform(d,0,0,d,0,0); const hx=cw/2-6*u, hy=ch*0.58;
    const bez=(p0,p1,p2,p3,n)=>{ const o=[]; for(let i=0;i<=n;i++){ const t=i/n, m=1-t; o.push([m*m*m*p0[0]+3*m*m*t*p1[0]+3*m*t*t*p2[0]+t*t*t*p3[0],m*m*m*p0[1]+3*m*m*t*p1[1]+3*m*t*t*p2[1]+t*t*t*p3[1]]); } return o; };
    const head=bez([hx-28*u,hy+3*u],[hx-20*u,hy-2*u],[hx-10*u,hy-5*u],[hx-2*u,hy-12*u],8).concat(bez([hx-2*u,hy-12*u],[hx+5*u,hy-15*u],[hx+12*u,hy-13*u],[hx+17*u,hy-6*u],6),
      bez([hx+17*u,hy-6*u],[hx+24*u,hy+4*u],[hx+28*u,hy+16*u],[hx+34*u,hy+30*u],8),[[hx+14*u,hy+32*u]],bez([hx+12*u,hy+22*u],[hx+8*u,hy+12*u],[hx-6*u,hy+11*u],[hx-26*u,hy+8*u],8));
    ttlWash(h,head,P.smokeDark,{seed:9,amp:2.6*u,core:0.42,layers:6,la:0.1});
    const horn=(b0,b1,c1,c2,tp,sd)=>{ const pts=bez(b0,c1,c2,tp,10).concat(bez(tp,[c2[0]-3*u,c2[1]+6*u],[c1[0]+2*u,c1[1]+8*u],b1,10)); ttlWash(h,pts,P.smokeDark,{seed:sd,amp:1.6*u,core:0.48,layers:6,la:0.1}); };
    horn([hx-1*u,hy-12*u],[hx+8*u,hy-13*u],[hx+5*u,hy-22*u],[hx+16*u,hy-29*u],[hx+27*u,hy-28*u],41);
    horn([hx+9*u,hy-11*u],[hx+15*u,hy-8*u],[hx+17*u,hy-17*u],[hx+24*u,hy-19*u],[hx+31*u,hy-15*u],42);
    for(let i=0;i<4;i++){ const sx=hx+22*u+i*3.4*u, sy=hy+0*u+i*7.4*u, sp=[[sx-1.5*u,sy],[sx+5*u,sy-1*u],[sx+1*u,sy+3.5*u]]; ttlWash(h,sp,P.smokeDark,{seed:30+i,amp:0.8*u,core:0.42,layers:4,la:0.1}); }
    S.horns={c:hc,w:cw,h:ch};
  }
}

// ---------- building it all
function ttlBuild(){
  const t0=performance.now(), pr=TTL.progNext||ttlProg(); TTL.prog=pr;
  const P=ttlPal(!!LOOK.sb), L=ttlLayout(), d=Math.min(window.devicePixelRatio||1,2), pw=Math.round(L.W*d), ph=Math.round(L.H*d);
  TTL.P=P; TTL.L=L; TTL.dpr=d; ttlGeom(L);
  if(!TTL.spr.grain||TTL.spr.grainSb!==P.sb){ TTL.spr.grain=ttlGrainTile(P); TTL.spr.grainSb=P.sb; }
  ttlSprites(L,P,pr);
  const mk=c=>{ if(!c||c.width!==pw||c.height!==ph) c=ttlMk(pw,ph); const g=c.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.globalAlpha=1; g.globalCompositeOperation='source-over'; g.clearRect(0,0,pw,ph); g.setTransform(d,0,0,d,0,0); return c; };
  TTL.sky=mk(TTL.sky); ttlPaintSky(TTL.sky.getContext('2d'),L,P,pr);
  TTL.land=mk(TTL.land); ttlPaintLand(TTL.land.getContext('2d'),L,P,pr);
  // the moth starts on a lantern (or on the empty peak)
  const m=TTL.moth||{}; m.mode='rest'; m.t=0; m.wait=4+Math.random()*4; m.k=1; m.i=0;
  const perch=ttlMothPerch(0); m.x=perch.x; m.y=perch.y; TTL.moth=pr.a5&&pr.end!=='moth'?null:m;
  TTL.snow=pr.a3?{x:L.x0+L.sw*0.7,y:(L.side?0:L.y0),t:0,rot:0}:null;
  TTL.buildMs=performance.now()-t0;
}
function ttlMothPerch(i){
  const L=TTL.L, u=L.u;
  if(TTL.prog&&TTL.prog.a1&&!TTL.prog.a5) return {x:L.peak.x-L.cw*0.35,y:L.mtnY(L.peak.x-L.cw*0.35)-2.2*u};
  const q=TTL.perch.length?TTL.perch[i%TTL.perch.length]:(TTL.lan[0]||{x:L.peak.x,y:L.mb,r:4*u});
  return {x:q.x+q.r*0.35,y:q.y-q.r*0.55};
}
function ttlCheck(){
  TTL.progT=(TTL.progT||0)-0.5; if(!TTL.prog||TTL.progDirty||TTL.progT<=0){ TTL.progNext=ttlProg(); TTL.progDirty=false; TTL.progT=4; }
  const pr=TTL.progNext||ttlProg(), key=[W,H,DPR,LOOK.sb?1:0,pr.key,ttlLayoutKey()].join('/');
  if(key!==TTL.key){ TTL.key=key; ttlBuild(); ttlTextures(); }
  ttlLogoSync();
}

// ---------- each frame
function ttlMothShape(g,x,y,s,k,ang,P,flat){
  // a small grey moth: forewings and hindwings, two pale spots, feelers. s = wingspan, k = how open the wings are
  g.save(); g.translate(x,y); g.rotate(ang||0); const half=s/2, ink=P.ink;
  for(const sd of [-1,1]){ g.save(); g.scale(sd*Math.max(0.12,k),1);
    g.fillStyle=flat?ttlA(P.mothDark,0.85):P.moth; g.beginPath(); g.moveTo(0,-half*0.12); g.quadraticCurveTo(half*0.55,-half*0.75,half,-half*0.42); g.quadraticCurveTo(half*0.88,-half*0.02,half*0.2,half*0.12); g.closePath(); g.fill();
    g.fillStyle=flat?ttlA(P.mothDark,0.7):ttlTone(P.moth,-0.12); g.beginPath(); g.moveTo(0,half*0.04); g.quadraticCurveTo(half*0.6,half*0.08,half*0.62,half*0.42); g.quadraticCurveTo(half*0.3,half*0.6,0,half*0.3); g.closePath(); g.fill();
    if(!flat){ g.fillStyle='rgba(255,252,240,.85)'; g.beginPath(); g.arc(half*0.56,-half*0.36,Math.max(0.5,half*0.11),0,TAU); g.fill();
      g.strokeStyle=ttlA(ink,0.75); g.lineWidth=Math.max(0.5,s*0.045); g.beginPath(); g.moveTo(0,-half*0.12); g.quadraticCurveTo(half*0.55,-half*0.75,half,-half*0.42); g.quadraticCurveTo(half*0.88,-half*0.02,half*0.2,half*0.12); g.stroke(); }
    g.restore(); }
  g.fillStyle=flat?ttlA(P.mothDark,0.9):P.mothDark; g.beginPath(); g.ellipse(0,half*0.05,Math.max(0.6,s*0.06),half*0.34,0,0,TAU); g.fill();
  g.strokeStyle=flat?ttlA(P.mothDark,0.9):ttlA(ink,0.85); g.lineWidth=Math.max(0.4,s*0.03); g.beginPath(); g.moveTo(-0.3,-half*0.28); g.quadraticCurveTo(-half*0.18,-half*0.55,-half*0.3,-half*0.62); g.moveTo(0.3,-half*0.28); g.quadraticCurveTo(half*0.18,-half*0.55,half*0.3,-half*0.62); g.stroke();
  g.restore();
}
function ttlMothUpdate(dt){
  const m=TTL.moth, L=TTL.L, u=L.u; if(!m) return; m.t+=dt;
  if(reduceMotion){ m.k=1; return; }
  if(m.mode==='rest'){ m.k=0.82+0.18*Math.sin(m.t*0.8); if(m.t>m.wait){ m.t=0;
      if(TTL.prog.a1&&!TTL.prog.a5){ m.mode='loop'; m.cx=m.x; m.cy=m.y; m.dur=3.2; }
      else if(TTL.perch.length>1||!TTL.prog.a1){ let j=m.i; if(TTL.perch.length>1){ while(j===m.i) j=Math.floor(Math.random()*TTL.perch.length); } const to=ttlMothPerch(j); m.mode='fly'; m.from={x:m.x,y:m.y}; m.to=to; m.j=j; m.dur=1.8+Math.hypot(to.x-m.x,to.y-m.y)/(140*u); m.cy=Math.min(m.y,to.y)-(30+Math.random()*30)*u; } } }
  else if(m.mode==='fly'){ const t=Math.min(1,m.t/m.dur), e=t*t*(3-2*t), a=m.from, b=m.to, cx=(a.x+b.x)/2+Math.sin(m.t*3)*10*u;
    m.x=(1-e)*(1-e)*a.x+2*(1-e)*e*cx+e*e*b.x+Math.sin(m.t*7.3)*2*u; m.y=(1-e)*(1-e)*a.y+2*(1-e)*e*m.cy+e*e*b.y+Math.cos(m.t*6.1)*2*u;
    m.k=0.25+0.75*Math.abs(Math.sin(m.t*26)); if(t>=1){ m.mode='rest'; m.i=m.j; m.t=0; m.wait=6+Math.random()*9; m.x=b.x; m.y=b.y; } }
  else if(m.mode==='loop'){ const t=Math.min(1,m.t/m.dur), a=t*TAU, r=16*u*Math.sin(t*Math.PI);
    m.x=m.cx+Math.sin(a)*r*1.4; m.y=m.cy-Math.abs(Math.sin(a*0.5))*22*u+Math.cos(a)*r*0.3; m.k=0.25+0.75*Math.abs(Math.sin(m.t*24));
    if(t>=1){ m.mode='rest'; m.t=0; m.wait=9+Math.random()*8; m.x=m.cx; m.y=m.cy; } }
}
function ttlFrame(){
  const now=performance.now(); let dt=TTL.last?(now-TTL.last)/1000:0; TTL.last=now; dt=Math.max(0,Math.min(0.05,dt));
  TTL.chkT-=dt; if(TTL.chkT<=0||!TTL.sky||TTL.sky.width!==cvs.width||TTL.sky.height!==cvs.height){ TTL.chkT=0.5; ttlCheck(); }
  const t0=performance.now(); if(!reduceMotion) TTL.t+=dt; const t=TTL.t, g=ctx, d=TTL.dpr, L=TTL.L, P=TTL.P, u=L.u, pr=TTL.prog;
  g.setTransform(1,0,0,1,0,0); g.globalAlpha=1; g.globalCompositeOperation='source-over';
  g.drawImage(TTL.sky,0,0);
  g.setTransform(d,0,0,d,0,0);
  // clouds slide behind the mountain
  for(const c of TTL.clouds){ let x=((c.x+c.sp*t)%(L.W+c.w*2)+(L.W+c.w*2))%(L.W+c.w*2)-c.w; g.globalAlpha=c.a; g.drawImage(c.c,x,c.y,c.w,c.h); }
  g.globalAlpha=1; g.setTransform(1,0,0,1,0,0); g.drawImage(TTL.land,0,0); g.setTransform(d,0,0,d,0,0);
  // the thread of smoke from the crater, rising into the cloud with the horned shadow in it
  if(!pr.a1){ const pk=L.peak, cl=L.cloud, S=TTL.spr, N=30, C=[], Lp=[], Rp=[];
    for(let i=0;i<=N;i++){ const p=i/N, e=Math.pow(p,1.4); C.push([pk.x+(cl.x-pk.x)*e+Math.sin(p*6.5-t*0.9)*7*u*p+Math.sin(p*14-t*1.9)*1.6*u*p,pk.y+1*u+(cl.y+20*u-pk.y)*p]); }
    for(let i=0;i<=N;i++){ const a=C[Math.max(0,i-1)], b=C[Math.min(N,i+1)]; let dx=b[0]-a[0], dy=b[1]-a[1]; const dd=Math.hypot(dx,dy)||1; dx/=dd; dy/=dd; const p=i/N, hw=(1.1+10*p*p)*u*(1+0.06*Math.sin(p*7-t*1.1)); Lp.push([C[i][0]-dy*hw,C[i][1]+dx*hw]); Rp.push([C[i][0]+dy*hw,C[i][1]-dx*hw]); }
    const rib=(k,a)=>{ g.fillStyle=ttlA(P.smoke,a); g.beginPath(); for(let i=0;i<=N;i++){ const q=[C[i][0]+(Lp[i][0]-C[i][0])*k,C[i][1]+(Lp[i][1]-C[i][1])*k]; i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]); } for(let i=N;i>=0;i--) g.lineTo(C[i][0]+(Rp[i][0]-C[i][0])*k,C[i][1]+(Rp[i][1]-C[i][1])*k); g.closePath(); g.fill(); };
    g.globalAlpha=1; rib(1.9,P.sb?0.12:0.16); rib(1,P.sb?0.36:0.42); rib(0.45,P.sb?0.3:0.3);
    g.strokeStyle=ttlA(P.ink,P.sb?0.22:0.3); g.lineWidth=0.7*u; g.beginPath(); for(let i=2;i<=N*0.8;i++) i>2?g.lineTo(Lp[i][0],Lp[i][1]):g.moveTo(Lp[i][0],Lp[i][1]); g.stroke();
    for(let i=0;i<9;i++){ const p=0.5+((t*0.035+i/9)%1)*0.5, e=Math.pow(p,1.4), x=pk.x+(cl.x-pk.x)*e+Math.sin(p*6.5-t*0.9)*7*u*p, y=pk.y+1*u+(cl.y+20*u-pk.y)*p, sz=(16+44*(p-0.5))*u;
      g.globalAlpha=Math.min(1,(p-0.5)*8)*(1-Math.max(0,(p-0.85)/0.15))*0.5; g.drawImage(S.puff,x-sz/2,y-sz/2,sz,sz); }
    if(S.mcloud){ const dx=Math.sin(t*0.13)*6*u, dy=Math.cos(t*0.11)*3*u; g.globalAlpha=0.9; g.drawImage(S.mcloud.c,cl.x-S.mcloud.w/2+dx,cl.y-S.mcloud.h/2+dy,S.mcloud.w,S.mcloud.h);
      const br=0.5+0.5*Math.sin(t*0.5); g.globalAlpha=(P.sb?0.07:0.07)+br*(P.sb?0.15:0.14); const sc=1+br*0.03; g.drawImage(S.horns.c,cl.x-S.horns.w*sc/2+dx*1.2,cl.y-S.horns.h*sc/2+dy,S.horns.w*sc,S.horns.h*sc); } }
  g.globalCompositeOperation='lighter';
  // the crack of light at the gate breathes
  if(TTL.gate){ const q=TTL.gate, s=(pr.a1?26:18)*u; g.globalAlpha=(pr.a1?0.5:0.38)+0.22*Math.sin(t*1.3); g.drawImage(TTL.spr.glowGate,q.x-s/2,q.y-s/2,s,s); }
  // lanterns flicker
  for(const q of TTL.lan){ const f=ttlN(t*q.sp+q.ph*3,q.ph*100|0); g.globalAlpha=(P.sb?0.22:0.3)*f+0.04; const s=q.r*(5+f*2); g.drawImage(TTL.spr.glowLan,q.x-s/2,q.y-s/2,s,s); }
  // a few stars twinkle
  for(const s of TTL.stars){ const k=0.5+0.5*Math.sin(t*s.sp+s.ph); g.globalAlpha=s.a*k*0.8; ttlTwinkle(g,s.x,s.y,s.r*4.2,P.star,1); }
  // fireflies
  if(!reduceMotion) for(const f of TTL.flies){ const k=Math.max(0,Math.sin(t*f.sp*2.2+f.ph)), x=f.x+(ttlN(t*0.12+f.s,5)-0.5)*60*u, y=f.y+(ttlN(t*0.1+f.s,6)-0.5)*30*u, s=7*u; if(k<0.05) continue; g.globalAlpha=k*0.8; g.drawImage(TTL.spr.glowFly,x-s/2,y-s/2,s,s); }
  g.globalCompositeOperation='source-over'; g.globalAlpha=1;
  if(TTL.pond){ const q=TTL.pond; g.save(); ttlPath(g,q.poly); g.clip();
    if(!(pr.moon<=0&&!pr.a5)&&Math.abs(L.moon.x-q.x)<q.rx*0.8){ const mx=L.moon.x+(q.x-L.moon.x)*0.15; g.fillStyle=pr.a5&&pr.end==='embermoon'?'rgba(255,190,110,.7)':'rgba(255,248,226,.7)';
      for(let i=0;i<6;i++){ const yy=q.y-q.ry*0.55+i*q.ry*0.22, wv=Math.sin(t*1.6+i*1.7)*2.2*u, hw=(7-i*0.7)*u; g.globalAlpha=0.75-i*0.09; g.fillRect(mx-hw+wv,yy,hw*2,0.9*u); } }
    g.globalCompositeOperation='lighter'; for(const l of TTL.lan){ if(Math.abs(l.x-q.x)>q.rx*0.9||l.y>q.y) continue; const f=ttlN(t*l.sp+l.ph*3,l.ph*100|0); g.globalAlpha=0.34*f+0.12; g.drawImage(TTL.spr.glowLan,l.x-l.r*1.1+Math.sin(t*2+l.ph)*1.2*u,q.y-q.ry*0.9,l.r*2.2,q.ry*1.8); }
    g.restore(); g.globalAlpha=1; g.globalCompositeOperation='source-over'; }
  // the moth
  ttlMothUpdate(dt); const m=TTL.moth;
  if(m){ const ws=Math.max(9,13.5*u); g.globalCompositeOperation='lighter'; g.globalAlpha=P.sb?0.28:0.34; g.drawImage(TTL.spr.glowMoth,m.x-ws*1.2,m.y-ws*1.2,ws*2.4,ws*2.4); g.globalCompositeOperation='source-over'; g.globalAlpha=1; ttlMothShape(g,m.x,m.y,ws,m.k,m.mode==='rest'?0:Math.sin(t*3)*0.25,P,false); }
  // the snowflake (after Act III)
  if(TTL.snow){ const s=TTL.snow, top=L.side?-10*u:L.y0, bot=L.side?L.t0:L.y1-8*u;
    if(!reduceMotion){ s.t+=dt; s.y+=dt*11*u; s.rot+=dt*0.4; if(s.y>bot){ s.y=top; s.x=L.x0+L.sw*(0.15+Math.random()*0.75); } }
    else { s.x=L.moon.x-L.moon.r*1.8; s.y=L.moon.y+L.moon.r*1.6; }
    ttlSnowflake(g,s.x+Math.sin(s.t*0.7)*14*u,s.y,Math.max(4,6*u),s.rot,P); }
  // the tail on the roof sways
  if(TTL.tail){ const q=TTL.tail, uu=q.u, sw=reduceMotion?0:Math.sin(t*1.1)*1.4, pts=[[q.x,q.y],[q.x+3*uu,q.y+3*uu],[q.x+5.5*uu+sw*uu,q.y+6*uu],[q.x+6*uu+sw*1.6*uu,q.y+9.5*uu],[q.x+4.2*uu+sw*2*uu,q.y+11.5*uu]];
    ttlInk(g,pts,2*uu,{col:q.body,seed:5,taper:0.12,wob:0.2*uu,even:true}); const e=pts[pts.length-1]; g.fillStyle=q.body; g.beginPath(); g.moveTo(e[0]-2*uu,e[1]); g.lineTo(e[0],e[1]-2.4*uu); g.lineTo(e[0]+2*uu,e[1]); g.lineTo(e[0],e[1]+2.2*uu); g.closePath(); g.fill(); }
  ttlLogoFrame(dt);
  const ms=performance.now()-t0; TTL.ms=TTL.frames?TTL.ms*0.95+ms*0.05:ms; TTL.frames++;
}
function ttlSnowflake(g,x,y,s,rot,P){
  g.save(); g.translate(x,y); g.rotate(rot); g.strokeStyle=P.snow; g.lineCap='round'; g.lineWidth=Math.max(0.7,s*0.14);
  g.shadowColor='rgba(170,220,255,.8)'; g.shadowBlur=s*0.8;
  for(let i=0;i<6;i++){ g.rotate(TAU/6); g.beginPath(); g.moveTo(0,0); g.lineTo(0,-s); g.moveTo(0,-s*0.55); g.lineTo(-s*0.28,-s*0.8); g.moveTo(0,-s*0.55); g.lineTo(s*0.28,-s*0.8); g.stroke(); }
  g.restore();
}

// ---------- the logo: EMBERBLOOD lettered with a broad brush, inked, filled with ember light, glowing
// glyphs: w = advance (cap height 1), s = strokes as curve points (x right, y down from the top of the capitals)
const TTL_GL={
  E:{w:0.6,s:[[[0.13,0.03],[0.12,0.5],[0.13,0.97]],[[0.06,0.05],[0.3,0.03],[0.55,0.02],[0.6,0.12]],[[0.15,0.49],[0.31,0.48],[0.46,0.46]],[[0.05,0.97],[0.32,0.98],[0.57,0.94],[0.62,0.84]]]},
  M:{w:0.98,s:[[[0.03,0.99],[0.1,0.95],[0.11,0.5],[0.13,0.04]],[[0.13,0.04],[0.31,0.46],[0.49,0.88]],[[0.49,0.88],[0.67,0.46],[0.85,0.04]],[[0.85,0.04],[0.87,0.5],[0.88,0.95],[0.96,0.99]]]},
  B:{w:0.66,s:[[[0.13,0.03],[0.12,0.5],[0.13,0.97]],[[0.06,0.04],[0.4,0.01],[0.6,0.12],[0.56,0.35],[0.3,0.47],[0.14,0.48]],[[0.17,0.48],[0.48,0.5],[0.67,0.67],[0.61,0.9],[0.36,0.99],[0.05,0.97]]]},
  R:{w:0.7,s:[[[0.13,0.03],[0.12,0.5],[0.13,0.98]],[[0.06,0.04],[0.42,0.01],[0.62,0.14],[0.58,0.39],[0.32,0.51],[0.15,0.51]],[[0.3,0.51],[0.47,0.71],[0.6,0.92],[0.74,0.99]]]},
  L:{w:0.58,s:[[[0.14,0.02],[0.12,0.5],[0.13,0.97]],[[0.06,0.97],[0.32,0.98],[0.53,0.94],[0.6,0.83]]]},
  O:{w:0.82,s:[[[0.44,0.02],[0.15,0.12],[0.06,0.5],[0.16,0.88],[0.45,0.99]],[[0.42,0.02],[0.71,0.12],[0.79,0.5],[0.69,0.88],[0.4,0.99]]]},
  D:{w:0.76,s:[[[0.13,0.03],[0.12,0.5],[0.13,0.97]],[[0.05,0.04],[0.44,0.01],[0.71,0.2],[0.76,0.5],[0.68,0.8],[0.43,0.98],[0.05,0.97]]]}
};
const TTL_RATIO=3.7;
// a broad-nib stroke: the nib (a short line at a fixed angle) swept along the curve, plus a round brush in the middle
function ttlNib(g,pts,nib,ang,seed,press){
  const P=ttlSpl(pts,0.7,false), n=P.length, ca=Math.cos(ang), sa=Math.sin(ang); if(n<2) return;
  const e=[]; for(let i=0;i<n;i++){ const t=i/(n-1), pr=(press?press(t):1)*(0.86+0.28*ttlN(i/22,seed)), hx=ca*nib*0.5*pr, hy=sa*nib*0.5*pr; e.push([P[i][0]-hx,P[i][1]-hy,P[i][0]+hx,P[i][1]+hy,pr]); }
  g.beginPath();
  for(let i=1;i<n;i++){ const a=e[i-1], b=e[i], q=[[a[0],a[1]],[a[2],a[3]],[b[2],b[3]],[b[0],b[1]]];
    let ar=0; for(let k=0;k<4;k++){ const p=q[k], r=q[(k+1)%4]; ar+=p[0]*r[1]-r[0]*p[1]; } if(ar<0) q.reverse();
    g.moveTo(q[0][0],q[0][1]); g.lineTo(q[1][0],q[1][1]); g.lineTo(q[2][0],q[2][1]); g.lineTo(q[3][0],q[3][1]); g.closePath(); }
  g.fill();
  g.lineCap='round'; g.lineJoin='round'; g.lineWidth=nib*0.3; ttlPath(g,P,false); g.stroke();
}
function ttlPress(t){ return t<0.1?0.5+0.5*t/0.1:t>0.86?0.62+0.38*(1-t)/0.14:1; }
function ttlLogoBuild(cssW,cssH,d,sb){
  const lg=TTL.logo, w=Math.round(cssW*d), h=Math.round(cssH*d), word='EMBERBLOOD', R=mulberry32(1871);
  const adv=[...word].map(ch=>TTL_GL[ch].w+0.07), kern=[0,0,0,0,0,0,-0.05,0,-0.02,0], tot=adv.reduce((a,b)=>a+b,0)+kern.reduce((a,b)=>a+b,0)+0.5;
  const cap=Math.min(w*0.93/tot,h*0.5), x0=(w-tot*cap)/2+cap*0.04, base=h*0.66, nib=cap*0.2, ang=-0.5;
  const M=ttlMk(w,h), m=M.getContext('2d'); m.fillStyle='#fff'; m.strokeStyle='#fff';
  const strokes=[]; lg.tops=[];
  let px=x0;
  [...word].forEach((ch,i)=>{ const G0=TTL_GL[ch], sc=(i===0?1.14:i===5?1.05:1)*(0.98+R()*0.05), rot=(R()-0.5)*0.07, dy=(Math.sin(i*1.9)*0.035+(R()-0.5)*0.03)*cap-(i===0?0.04*cap:0);
    const cx=px+G0.w*cap*0.5, cy=base-cap*0.5, cr=Math.cos(rot), sr=Math.sin(rot);
    const tf=([gx,gy])=>{ const lx=(gx-G0.w*0.5)*cap*sc, ly=(gy-0.5)*cap*sc+(i===0?-0.05*cap:0); return [cx+lx*cr-ly*sr,cy+dy+lx*sr+ly*cr-(sc-1)*cap*0.5]; };
    G0.s.forEach((s,k)=>strokes.push({pts:s.map(p=>tf([p[0]+(R()-0.5)*0.02,p[1]+(R()-0.5)*0.02])),nib:nib*sc,seed:i*10+k}));
    for(let k=0;k<3;k++){ const tp=tf([0.15+k*0.3*G0.w,0.04]); lg.tops.push(tp); }
    px+=(adv[i]+kern[i])*cap; });
  // the tail: a swash under the word that curls up past the D and ends in a spade
  const sw=[[x0+cap*1.0,base+cap*0.16],[x0+cap*2.6,base+cap*0.34],[x0+cap*4.6,base+cap*0.32],[x0+cap*6.3,base+cap*0.2],[x0+cap*7.35,base+cap*0.04],[x0+cap*7.85,base-cap*0.22],[x0+cap*7.75,base-cap*0.42]];
  strokes.push({pts:sw,nib:nib*0.62,seed:99,press:t=>0.35+0.65*Math.sin(Math.PI*Math.min(1,t*1.1))});
  for(const s of strokes) ttlNib(m,s.pts,s.nib,ang,s.seed,s.press||ttlPress);
  const e=sw[sw.length-1], pe=sw[sw.length-2], dx=e[0]-pe[0], dy=e[1]-pe[1], dl=Math.hypot(dx,dy)||1, ux=dx/dl, uy=dy/dl, sp=cap*0.15;
  m.beginPath(); m.moveTo(e[0]+ux*sp*1.3,e[1]+uy*sp*1.3); m.quadraticCurveTo(e[0]-uy*sp*0.9+ux*sp*0.2,e[1]+ux*sp*0.9+uy*sp*0.2,e[0]-uy*sp*0.85-ux*sp*0.4,e[1]+ux*sp*0.85-uy*sp*0.4);
  m.lineTo(e[0]-ux*sp*0.15,e[1]-uy*sp*0.15); m.lineTo(e[0]+uy*sp*0.85-ux*sp*0.4,e[1]-ux*sp*0.85-uy*sp*0.4); m.quadraticCurveTo(e[0]+uy*sp*0.9+ux*sp*0.2,e[1]-ux*sp*0.9+uy*sp*0.2,e[0]+ux*sp*1.3,e[1]+uy*sp*1.3); m.fill();
  const ink=sb?'#3b2233':'#170805', ow=cap*(sb?0.075:0.06);
  // tinted copies of the letter shape
  const tint=(col)=>{ const c=ttlMk(w,h), g=c.getContext('2d'); g.drawImage(M,0,0); g.globalCompositeOperation='source-in'; g.fillStyle=col; g.fillRect(0,0,w,h); return c; };
  const inkC=tint(ink);
  // glow (its own canvas, so it can breathe)
  const GL=ttlMk(w,h), gg=GL.getContext('2d'); gg.shadowColor=sb?'rgba(255,140,60,.9)':'rgba(255,90,30,.95)'; gg.shadowBlur=cap*(sb?0.42:0.55); gg.globalAlpha=0.85; gg.drawImage(tint(sb?'#ff9a4a':'#ff6a2a'),0,0); gg.shadowBlur=cap*0.16; gg.drawImage(tint('#ffb05a'),0,0);
  // letters: a sticker shadow, the ink outline (the shape grown in every direction), then the ember fill
  const O=ttlMk(w,h), o=O.getContext('2d');
  if(sb){ for(let a=0;a<12;a++){ const aa=a/12*TAU; o.drawImage(inkC,Math.cos(aa)*ow,Math.sin(aa)*ow+cap*0.075); } }
  for(let a=0;a<16;a++){ const aa=a/16*TAU; o.drawImage(inkC,Math.cos(aa)*ow,Math.sin(aa)*ow); }
  const F=ttlMk(w,h), f=F.getContext('2d'), top=base-cap*1.1, bot=base+cap*0.2, fg=f.createLinearGradient(0,top,0,bot);
  if(sb){ fg.addColorStop(0,'#fff7d2'); fg.addColorStop(0.34,'#ffd84e'); fg.addColorStop(0.66,'#ff9a34'); fg.addColorStop(1,'#ec5628'); }
  else { fg.addColorStop(0,'#fff2cf'); fg.addColorStop(0.36,'#ffc35a'); fg.addColorStop(0.7,'#e8521f'); fg.addColorStop(1,'#9a2410'); }
  f.fillStyle=fg; f.fillRect(0,0,w,h);
  // the wash is uneven: brighter blooms, darker pools, and dry-brush streaks along the strokes
  const blob=(x,y,r,col,a)=>{ const gr=f.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,ttlA(col,a)); gr.addColorStop(1,ttlA(col,0)); f.fillStyle=gr; f.fillRect(x-r,y-r,r*2,r*2); };
  for(let i=0;i<26;i++) blob(x0+R()*tot*cap,base-cap*(0.2+R()*0.8),cap*(0.2+R()*0.4),R()<0.55?'#fff6c8':(sb?'#d8401c':'#7a1a0a'),0.32);
  f.globalAlpha=0.38; f.strokeStyle=sb?'#fff2c0':'#ffe2a0'; f.lineCap='round';
  for(const s of strokes){ const P=ttlSpl(s.pts,1,false); f.lineWidth=Math.max(1,s.nib*0.09); f.beginPath(); P.forEach((p,k)=>{ const q=[p[0]-s.nib*0.16,p[1]-s.nib*0.1]; k?f.lineTo(q[0],q[1]):f.moveTo(q[0],q[1]); }); f.stroke(); }
  f.globalAlpha=1; f.fillStyle=sb?'rgba(120,40,20,.22)':'rgba(40,6,0,.3)'; for(let i=0;i<w*h/90;i++){ const s=d*(0.6+R()*0.9); f.fillRect(R()*w,R()*h,s,s); }
  // a bright rim along the upper left edges
  const Hc=ttlMk(w,h), hg=Hc.getContext('2d'); hg.drawImage(tint(sb?'#fffbe8':'#fff0c8'),0,0); hg.globalCompositeOperation='destination-out'; hg.drawImage(M,cap*0.035,cap*0.05);
  f.globalAlpha=0.85; f.drawImage(Hc,0,0); f.globalAlpha=1;
  f.globalCompositeOperation='destination-in'; f.drawImage(M,0,0);
  o.drawImage(F,0,0);
  // ink spatter, as if the brush flicked
  o.fillStyle=ink; for(let i=0;i<9;i++){ const x=x0+R()*tot*cap, y=R()<0.5?base-cap*(1.15+R()*0.2):base+cap*(0.35+R()*0.2), r=cap*(0.012+R()*0.022); o.beginPath(); o.arc(x,y,r,0,TAU); o.fill(); }
  lg.glow=GL; lg.ink=O; lg.cap=cap; lg.base=base;
}
function ttlLogoSync(){
  const lg=TTL.logo, h1=document.querySelector('#menu .logo'), cv=document.getElementById('logoCv'); if(!h1||!cv) return;
  const m=document.getElementById('menu'); if(!m||!m.classList.contains('on')) return;
  const box=h1.parentElement.getBoundingClientRect().width||h1.getBoundingClientRect().width; if(!(box>0)) return;
  let side=W/H>=1.2; try{ side=matchMedia('(min-aspect-ratio: 6/5)').matches; }catch(e){}
  const maxH=side?(H<560?Math.max(48,H*0.17):Math.min(150,H*0.2)):Math.min(132,H*0.15);
  const cssW=Math.floor(Math.min(box,maxH*TTL_RATIO,620)), cssH=Math.round(cssW/TTL_RATIO), d=Math.min(window.devicePixelRatio||1,2), key=[cssW,d,LOOK.sb?1:0].join('/');
  if(key===lg.key) return;
  const t0=performance.now(); lg.key=key; lg.w=cssW; lg.h=cssH; lg.dpr=d;
  cv.width=Math.round(cssW*d); cv.height=Math.round(cssH*d); cv.style.width=cssW+'px'; cv.style.height='auto';
  ttlLogoBuild(cssW,cssH,d,!!LOOK.sb); lg.ok=true; h1.classList.add('drawn'); lg.sparks=[]; lg.ms=performance.now()-t0; lg.drawn=0;
  ttlLogoDraw(0);
}
function ttlLogoDraw(dt){
  const lg=TTL.logo, cv=document.getElementById('logoCv'); if(!lg.ok||!cv) return; const g=cv.getContext('2d'), w=cv.width, h=cv.height, t=TTL.t;
  g.setTransform(1,0,0,1,0,0); g.globalCompositeOperation='source-over'; g.globalAlpha=1; g.clearRect(0,0,w,h);
  g.globalAlpha=reduceMotion?0.85:0.72+0.28*Math.sin(t*1.25); g.drawImage(lg.glow,0,0); g.globalAlpha=1; g.drawImage(lg.ink,0,0);
  if(reduceMotion||!lg.tops.length) return;
  if(lg.sparks.length<9&&Math.random()<dt*5){ const p=lg.tops[Math.floor(Math.random()*lg.tops.length)]; lg.sparks.push({x:p[0]+(Math.random()-0.5)*lg.cap*0.2,y:p[1],t:0,life:1.1+Math.random()*1.1,vx:(Math.random()-0.5)*lg.cap*0.15,ph:Math.random()*TAU}); }
  g.globalCompositeOperation='lighter';
  for(const s of lg.sparks){ s.t+=dt; const k=s.t/s.life, x=s.x+s.vx*k+Math.sin(s.t*4+s.ph)*lg.cap*0.04, y=s.y-k*lg.cap*0.75, a=(1-k)*Math.min(1,k*5), r=lg.cap*0.07*(1-k*0.5);
    g.globalAlpha=a*0.9; g.drawImage(TTL.spr.glowLan,x-r*2,y-r*2,r*4,r*4); g.fillStyle='rgba(255,236,180,'+(a*0.95).toFixed(3)+')'; g.fillRect(x-lg.dpr*0.6,y-lg.dpr*0.6,lg.dpr*1.2,lg.dpr*1.2); }
  lg.sparks=lg.sparks.filter(s=>s.t<s.life); g.globalCompositeOperation='source-over'; g.globalAlpha=1;
}
function ttlLogoFrame(dt){ const lg=TTL.logo; if(!lg.ok) return; if(reduceMotion){ if(!lg.drawn){ ttlLogoDraw(0); lg.drawn=1; } return; } ttlLogoDraw(dt); }

// ---------- the menu signs' textures: a paper grain (Storybook) and wood grain (Classic), drawn once per look
function ttlTextures(){
  const sb=!!LOOK.sb, k=sb?'sb':'cl'; if(TTL.tex===k) return; TTL.tex=k; const m=document.getElementById('menu'); if(!m) return;
  try{
    if(sb){ const s=200, c=ttlMk(s,s), g=c.getContext('2d'), im=g.createImageData(s,s), d=im.data, R=mulberry32(55);
      for(let y=0;y<s;y++) for(let x=0;x<s;x++){ const i=(y*s+x)*4, lo=ttlN2(x/25,y/25,3,8)*0.65+ttlN2(x/6.25,y/6.25,4,32)*0.35, v=255-lo*26-R()*10; d[i]=v; d[i+1]=v-lo*6-3; d[i+2]=v-lo*16-8; d[i+3]=255; }
      g.putImageData(im,0,0); g.lineCap='round';
      for(let n=0;n<60;n++){ const x=R()*s, y=R()*s, a=R()*TAU, l=5+R()*14; g.strokeStyle=R()<0.5?'rgba(190,150,110,.28)':'rgba(255,255,255,.5)'; g.lineWidth=0.6+R()*0.5;
        for(const ox of [-s,0,s]) for(const oy of [-s,0,s]){ g.beginPath(); g.moveTo(x+ox,y+oy); g.quadraticCurveTo(x+ox+Math.cos(a+0.7)*l*0.5,y+oy+Math.sin(a+0.7)*l*0.5,x+ox+Math.cos(a)*l,y+oy+Math.sin(a)*l); g.stroke(); } }
      m.style.setProperty('--ttlPaper',`url(${c.toDataURL('image/jpeg',0.86)})`); }
    else { const w=480, h=110, c=ttlMk(w,h), g=c.getContext('2d'), R=mulberry32(66);
      g.fillStyle='#808080'; g.fillRect(0,0,w,h);
      for(let y=0;y<h;y+=1.4){ const v=128+(ttlN(y/9,1)-0.5)*70+(R()-0.5)*18; g.strokeStyle=`rgba(${v|0},${v|0},${v|0},.55)`; g.lineWidth=1.3; g.beginPath(); for(let x=0;x<=w;x+=12){ const yy=y+Math.sin(x/70+y*0.3)*1.6+(ttlN(x/40+y,2)-0.5)*2.4; x?g.lineTo(x,yy):g.moveTo(x,yy); } g.stroke(); }
      for(let n=0;n<3;n++){ const kx=40+R()*(w-80), ky=20+R()*(h-40); for(let r=2;r<16;r+=2.2){ g.strokeStyle=`rgba(40,40,40,${0.4-r*0.02})`; g.lineWidth=1; g.beginPath(); g.ellipse(kx,ky,r*2.4,r*0.7,0,0,TAU); g.stroke(); } }
      const sh=g.createLinearGradient(0,0,0,h); sh.addColorStop(0,'rgba(255,255,255,.22)'); sh.addColorStop(0.5,'rgba(128,128,128,0)'); sh.addColorStop(1,'rgba(0,0,0,.3)'); g.fillStyle=sh; g.fillRect(0,0,w,h);
      m.style.setProperty('--ttlWood',`url(${c.toDataURL('image/jpeg',0.84)})`); }
  }catch(e){}
}

// ---------- hooks: while the scene is the menu, the title paints the screen instead of the world
{ const base=render; render=function(){
  if(scene==='menu'&&TTL.ok&&G){ TTL.away=0; try{ ttlFrame(); return; }catch(e){ TTL.errs++; console.error('title',e); if(TTL.errs>2){ TTL.ok=false; ttlOff(); } } }
  else if(TTL.sky&&++TTL.away>180) ttlFree();
  return base.apply(this,arguments); }; }
// a few seconds into play the big title canvases are let go (a phone keeps that memory for the game); they are
// painted again on the way back to the menu
function ttlFree(){ for(const k of ['sky','land']){ const c=TTL[k]; if(c){ c.width=1; c.height=1; } TTL[k]=null; } TTL.key=''; TTL.away=0; }
function ttlOff(){ try{ const m=document.getElementById('menu'); if(m) m.classList.remove('ttl'); const h=document.querySelector('#menu .logo'); if(h) h.classList.remove('drawn'); }catch(e){} }
function ttlOn(){ return TTL.ok&&scene==='menu'; }
function ttlSync(){ TTL.chkT=0; TTL.progDirty=true; }
try{ const m=document.getElementById('menu'); if(m) m.classList.add('ttl'); }catch(e){}
window.__ebTitle={perf:()=>({frameMs:+TTL.ms.toFixed(3),buildMs:+TTL.buildMs.toFixed(1),logoMs:+TTL.logo.ms.toFixed(1),frames:TTL.frames}),prog:()=>TTL.prog,layout:()=>TTL.L&&{side:TTL.L.side,u:TTL.L.u,x0:TTL.L.x0,y0:TTL.L.y0,y1:TTL.L.y1},
  force(p){ TTL.force=p||null; TTL.key=''; TTL.chkT=0; TTL.progDirty=true; }, moth:()=>TTL.moth&&{x:TTL.moth.x,y:TTL.moth.y,mode:TTL.moth.mode}, perch:()=>TTL.perch.length, ok:()=>TTL.ok};
