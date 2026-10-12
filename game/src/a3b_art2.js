
// ================= art: landmarks, interiors, cave stuff
function rrect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function grad(x0,y0,x1,y1,a,b){ const g=ctx.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,a); g.addColorStop(1,b); return g; }
// shared state for this module (prefixed so it stays out of the other modules' way)
const R2={glow:new Map(),spr:new Map(),base:[],lp:null};
// soft additive glow; the gradient is cached per colour so this costs one drawImage
function glowAt(x,y,r,col,a){
  if(!(r>0)||!(a>0)) return;
  let sp=R2.glow.get(col);
  if(!sp){ if(R2.glow.size>96) R2.glow.clear(); sp=mkCanvas(64,64); const g=sp.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,`rgba(${col},1)`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(0,0,64,64); R2.glow.set(col,sp); }
  const pa=ctx.globalAlpha, pc=ctx.globalCompositeOperation; ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=pa*Math.min(1,a); ctx.drawImage(sp,x-r,y-r,r*2,r*2); ctx.globalAlpha=pa; ctx.globalCompositeOperation=pc;
}
// ---------- small colour and shape helpers (all take a context so they work for cached canvases)
// colours come in as '#rrggbb' or as 'rgb(r,g,b)' (the output of r2c), so shades can be chained
function r2rgb(c){ if(c.charCodeAt(0)===35) return hexRGB(c); const m=c.match(/[\d.]+/g); return m?[+m[0],+m[1],+m[2]]:[128,128,128]; }
function r2c(hex,k){ const c=r2rgb(hex), m=mixRGB(c,k<0?[0,0,0]:[255,246,228],Math.min(1,Math.abs(k))); return `rgb(${m[0]|0},${m[1]|0},${m[2]|0})`; }
function r2a(hex,a){ const c=r2rgb(hex); return `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`; }
function r2lg(g,x0,y0,x1,y1,...cs){ const gr=g.createLinearGradient(x0,y0,x1,y1); cs.forEach((c,i)=>gr.addColorStop(i/(cs.length-1),c)); return gr; }
function r2rg(g,x,y,r0,r1,...cs){ const gr=g.createRadialGradient(x,y,r0,x,y,r1); cs.forEach((c,i)=>gr.addColorStop(i/(cs.length-1),c)); return gr; }
function r2e(g,x,y,rx,ry,col,rot){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,Math.max(0.1,rx),Math.max(0.1,ry),rot||0,0,TAU); g.fill(); }
function r2o(g,x,y,r,col){ g.fillStyle=col; g.beginPath(); g.arc(x,y,Math.max(0.1,r),0,TAU); g.fill(); }
function r2l(g,x0,y0,x1,y1,col,lw){ g.strokeStyle=col; g.lineWidth=lw||1; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); }
function r2rr(g,x,y,w,h,r,col){ g.fillStyle=col; rrect(g,x,y,w,h,Math.max(0,Math.min(r,w/2,h/2))); g.fill(); }
function r2sh(g,x,y,w,h,r,a){ a=a||0.26; r2rr(g,x+2,y+3,w+5,h+5,r+3,`rgba(0,0,0,${a*0.45})`); r2rr(g,x+2,y+2,w+2,h+2,r,`rgba(0,0,0,${a})`); }
function r2shC(g,x,y,rx,ry,a){ a=a||0.26; r2e(g,x+3,y+4,rx+3,ry+3,`rgba(0,0,0,${a*0.45})`); r2e(g,x+2,y+3,rx+1,ry,`rgba(0,0,0,${a})`); }
function r2tear(g,x,y,w,h){ g.beginPath(); g.moveTo(x,y-h); g.bezierCurveTo(x+w*1.1,y-h*0.45,x+w,y,x,y); g.bezierCurveTo(x-w,y,x-w*1.1,y-h*0.45,x,y-h); g.fill(); }
function r2rng(o,s){ return mulberry32((Math.round(o.x)*928371+Math.round(o.y)*364479+(s|0)*7919+((AREA&&AREA.def&&AREA.def.seed)|0)*1299709)|0); }
function r2pk(r,a){ return a[Math.floor(r()*a.length)%a.length]; }
// cached sprites with an arbitrary box: (w,h) world size, (ox,oy) origin inside it, drawn at 2x
function r2S(key,w,h,ox,oy,draw){ let c=R2.spr.get(key); if(!c){ const sc=2; c=mkCanvas(w*sc,h*sc); const g=c.getContext('2d'); g.scale(sc,sc); g.translate(ox,oy); draw(g); c.w2=w; c.h2=h; c.ox=ox; c.oy=oy; R2.spr.set(key,c); } return c; }
function r2put(c,x,y,s){ s=s||1; ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); }
// wood plank fill along x
function r2wood(g,x,y,w,h,col,r,ph,rad){
  g.save(); rrect(g,x,y,w,h,rad==null?2:rad); g.clip(); g.fillStyle=col; g.fillRect(x,y,w,h); ph=ph||7;
  for(let yy=y;yy<y+h;yy+=ph){ g.fillStyle=r2c(col,(r()-0.5)*0.18); g.fillRect(x,yy,w,ph); g.strokeStyle='rgba(30,15,5,.2)'; g.lineWidth=0.5; for(let k=0;k<2;k++){ const gy=yy+1.5+r()*(ph-3); g.beginPath(); g.moveTo(x,gy); g.bezierCurveTo(x+w*0.3,gy+(r()-0.5)*2.4,x+w*0.6,gy+(r()-0.5)*2.4,x+w,gy+(r()-0.5)); g.stroke(); } g.fillStyle='rgba(20,10,4,.32)'; g.fillRect(x,yy+ph-0.7,w,0.7); if(w>40&&r()<0.5){ g.fillRect(x+w*(0.2+r()*0.6),yy,0.7,ph); } }
  g.fillStyle='rgba(255,240,210,.2)'; g.fillRect(x,y,w,1); g.fillRect(x,y,1,h); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x,y+h-1,w,1); g.fillRect(x+w-1,y,1,h);
  g.restore();
}
// 3/4 box: (x,y,w,h) footprint, d = height of the visible front face
function r2box(g,x,y,w,h,d,top,face,rad){ rad=rad==null?2:rad; r2rr(g,x,y+h-d-rad,w,d+rad,rad,face); r2rr(g,x,y,w,h-d,rad,top); g.fillStyle='rgba(255,240,210,.22)'; g.fillRect(x+rad,y,w-rad*2,1); g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(x+rad,y+h-d,w-rad*2,1); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+rad,y+h-1,w-rad*2,1); }

// ---------- palettes
const R2FAB=[
  ['#b8402a','#e8b04a','#6a8a4a','#efe2c4','#4a6a8a'],['#3a5a8a','#8ab0c8','#e8dcc0','#c8584a','#5a7a5a'],['#6a3a6a','#c88aa8','#e8d0b0','#4a6a6a','#d8a040'],['#3a6a4a','#a8c890','#e8d8b0','#a84a3a','#6a4a2a'],
  ['#d8902a','#f0d070','#7aa0c8','#c84a4a','#efe6d6'],['#c86a7a','#f0c0c0','#8aa8a0','#efe2c4','#6a4a5a'],['#2a3a6a','#c8a040','#e8e0d0','#8a2e2e','#5a7a9a'],['#8a5a3a','#c8a070','#5a6a3a','#e8d8b8','#7a3a2a']];
const R2BOOK=['#8a2e22','#2e4a8a','#3a7a4a','#8a6a2a','#5a3a7a','#2a6a6a','#a8783a','#6a2a3a','#3a3a3a','#c8a060','#7a8a3a','#4a2e5a','#b85a3a','#e0d0b0'];
const R2WOOD={oak:'#8a5a32',walnut:'#5e3c22',cherry:'#8a4630',pine:'#b08452',grey:'#857868',dark:'#4a2e1a'};
const R2FLOOR={flags:['#6e6a66','#7a7570','#66625e','#74706a','#5e5a56'],oak:['#8c5c36','#9a6a40','#7e5030','#946238'],walnut:['#54361f','#5e3e25','#4a301c','#5a3a22'],grey:['#7e776c','#8a8378','#726c62','#847c70'],honey:['#b47e4a','#c28c54','#a87244','#ba844e'],white:['#cfc3ae','#d8ccb8','#c4b8a2','#d2c6b2'],red:['#7e3e2c','#8a4632','#743828','#844030'],herring:['#a06a3a','#b07a46','#8e5c32','#9a6438','#a8743e']};
const R2ST={
  ash:{fl:'oak',wl:{k:'timber',c:['#e6d6b6','#5a3820']},fab:0,wood:'cherry',trim:'#5a3820',dec:['sampler','plates','wreath','clockw'],rug:'persian',mat:'HOME'},
  yara:{fl:'honey',wl:{k:'floral',c:['#c8d0b0','#8a4a6a','#e8c050','#5a7a4a'],wain:'#6a4a30'},fab:5,wood:'walnut',trim:'#4a3020',dec:['plates','clockw','sampler','wreath'],rug:'braid'},
  baker:{fl:'tile',tile:['#ecdcbc','#b8664a'],wl:{k:'timber',c:['#eadcc0','#6a4428']},fab:4,wood:'pine',trim:'#6a4428',dec:['pans','sign','garlic','plates'],rug:'stripe',mat:'BREAD'},
  lamps:{fl:'walnut',wl:{k:'panel',c:['#6a4a2a']},fab:7,wood:'oak',trim:'#3a2414',dec:['sconce','lantern','sconce','lantern'],rug:'kilim'},
  inn:{fl:'oak',kitchen:['#e6dcc6','#3e4a52'],wl:{k:'timber',c:['#e2d0aa','#4a2e18']},fab:7,wood:'oak',trim:'#4a2e18',dec:['pans','sign','antlers','garlic','plates'],rug:'persian'},
  guard:{fl:'flags',flp:['#6e6a66','#7a7570','#66625e','#74706a','#5e5a56'],wl:{k:'stone',c:['#6a6a70','#5a5a62','#7a7a82']},fab:6,wood:'walnut',trim:'#3a3a40',dec:['shield','banner','keys','wanted'],rug:'stripe'},
  library:{fl:'flags',flp:['#a08a6a','#ac9676','#94806a','#b09c7a','#8e7a5e'],wl:{k:'panel',c:['#4a2e1e']},fab:3,wood:'walnut',trim:'#2a1a10',dec:['banner','clockw'],arch:1,rug:'persian'},
  tailor:{fl:'white',wl:{k:'damask',c:['#6a3a5a','#86507a'],wain:'#e8d8c8'},fab:2,wood:'cherry',trim:'#e8d8c8',dec:['ribbons','swatches','sampler'],rug:'persian'},
  scholar:{fl:'walnut',wl:{k:'damask',c:['#22284a','#3a4270'],star:1},fab:6,wood:'walnut',trim:'#1a1a2a',dec:['starchart','moonchart','map'],arch:1,rug:'kilim'},
  mayor:{fl:'herring',wl:{k:'damask',c:['#6a2228','#8a3036'],wain:'#4a2a1a'},fab:6,wood:'dark',trim:'#c8a040',dec:['banner','crest'],arch:1,rug:'persian'},
  miner:{fl:'dirt',dirt:'miner',wl:{k:'stone',c:['#5a4a3e','#4a3e34','#6a5a4a'],beams:1},fab:7,wood:'oak',trim:'#3a2a1a',dec:['map','picks','lantern'],rug:'stripe'},
  cook:{fl:'tile',tile:['#d8ceb4','#6e8a64'],wl:{k:'timber',c:['#dcd0b0','#4a3420']},fab:3,wood:'oak',trim:'#4a3420',dec:['pans','garlic','ladles','plates'],rug:'braid'},
  lodge:{fl:'woven',wl:{k:'log',c:['#7a5434']},fab:7,wood:'pine',trim:'#4a3020',dec:['antlers','snowshoes','pelt'],rug:'kilim'},
  hut:{fl:'dirt',dirt:'hut',wl:{k:'stone',c:['#5e6650','#4e5642','#6e7660'],round:1,moss:1},fab:3,wood:'grey',trim:'#3a3a2a',dec:['herbsdry','garlic','herbsdry','wreath'],rug:'braid'},
  farmer:{fl:'dirt',dirt:'farm',wl:{k:'timber',c:['#d8c8a0','#5a3e22']},fab:7,wood:'pine',trim:'#5a3e22',dec:['horseshoe','garlic','tools','sampler'],rug:'stripe'},
  kid:{fl:'honey',wl:{k:'stripes',c:['#5a8ac0','#4a78ac','#f0d070']},fab:4,wood:'pine',trim:'#e8e0d0',dec:['drawings','pennant','drawings'],rug:'play'},
  knitter:{fl:'oak',wl:{k:'floral',c:['#e8d0c8','#c86a7a','#8aa8a0','#7a9a6a'],wain:'#8a5a4a'},fab:5,wood:'cherry',trim:'#6a4030',dec:['quilt','skeins','sampler'],rug:'braid'},
  fiddler:{fl:'grey',wl:{k:'stripes',c:['#5a7a4a','#4e6c40','#c8b070']},fab:3,wood:'oak',trim:'#3a2a1a',dec:['fiddle','sheet','plates'],rug:'stripe'},
  herbalist:{fl:'grey',wl:{k:'timber',c:['#d0d4b0','#4a3a24']},fab:3,wood:'oak',trim:'#4a3a24',dec:['herbsdry','wreath','herbsdry','garlic'],rug:'kilim'}
};
const R2HOMEWALL=[{k:'stripes',c:['#7a3a32','#6a3029','#c8a060']},{k:'stripes',c:['#3a5a6a','#324e5c','#d8c8a0']},{k:'stripes',c:['#c8b48a','#bca67a','#8a5a3a']},
  {k:'damask',c:['#3a5a4a','#4a6e5c'],wain:'#5a3a24'},{k:'damask',c:['#7a5a2a','#8e6c38']},{k:'floral',c:['#e0d4b4','#c84a4a','#e8b84a','#6a8a4a']},
  {k:'floral',c:['#b8c8d8','#f4f0f8','#f0c050','#5a7a6a'],wain:'#6a4a30'},{k:'panel',c:['#7a5434']},{k:'timber',c:['#e4d4b4','#4a3018']},{k:'timber',c:['#d8d0bc','#5a3a22']},{k:'floral',c:['#e8c8b0','#7a5aa8','#f0e0a0','#6a8a5a']},{k:'stripes',c:['#8a8a5a','#7c7c50','#e8dcb0']}];
const R2HOMEDEC=['quilt','plates','sampler','clockw','wreath','garlic','shelfw','horseshoe'];

// ---------- room setup: every visual choice for a house, from its style and seed
function r2Room(A){
  if(A._ri) return A._ri;
  const def=A.def, st=def.style||'home', seed=def.seed||7, rng=mulberry32((hash2(seed,st.length*131+17)*4294967295)|0), K=[]; for(let i=0;i<16;i++) K.push(rng());
  const S0=R2ST[st], R={A,st,seed,x0:A.rx,y0:A.ry,W:A.rw,H:A.rh,flames:[],glows:[]};
  if(S0){ Object.assign(R,{fl:S0.fl,wl:S0.wl,fab:R2FAB[S0.fab],wood:R2WOOD[S0.wood],trim:S0.trim,dec:S0.dec.slice(),rugP:S0.rug,arch:!!S0.arch,mat:S0.mat||null,S0}); }
  else{
    const fls=['oak','walnut','grey','honey','red','white','oak','honey'], wl=R2HOMEWALL[Math.floor(K[1]*R2HOMEWALL.length)], dec=R2HOMEDEC.slice();
    for(let i=dec.length-1;i>0;i--){ const j=Math.floor(K[(i+3)%16]*(i+1)); [dec[i],dec[j]]=[dec[j],dec[i]]; }
    Object.assign(R,{fl:fls[Math.floor(K[0]*fls.length)],wl,fab:R2FAB[Math.floor(K[2]*R2FAB.length)],wood:R2WOOD[['oak','walnut','cherry','pine','oak','cherry'][Math.floor(K[3]*6)]],trim:['#4a3020','#3a2414','#5a3820','#e8e0d0'][Math.floor(K[4]*4)],dec,rugP:['persian','braid','stripe','kilim','check','braid'][Math.floor(K[5]*6)],arch:K[6]<0.2,mat:null,S0:{}});
  }
  if(A.floor==='stone'&&R.fl!=='flags'&&R.fl!=='herring') R.fl='flags';
  R.flp=(S0&&S0.flp)||R2FLOOR[R.fl]||R2FLOOR.oak;
  R.k=K; R.curtain=R.fab[Math.floor(K[7]*3)]; R.flowers=K[8]<0.6; R.frame=st==='kid'||st==='tailor'||K[9]<0.25?'#e8e0d0':st==='guard'?'#4a4a52':'#3a2414';
  R.cap=R.wl.k==='stone'?'#3e3c3e':R.wl.k==='log'?'#5a3c22':'#2e1e12';
  const rf=R.fab; R.rug={c:[rf[0],rf[1],r2c(rf[0],-0.35),rf[3],rf[4]]};
  if(st==='ash') R.rug.c=['#8a2e22','#e8b04a','#4a1610','#efe2c4','#2e4a6a'];
  if(st==='mayor') R.rug.c=['#6a1a20','#d8b04a','#3a0e10','#efe2c4','#2a3a6a'];
  r2WallPlan(R,A);
  A._ri=R; return R;
}
// wall plan: which windows are clear, how wide paintings get, where decor goes
function r2Free(ext,occ){
  let segs=[[ext[0],ext[1]]];
  for(const o of occ){ const n=[]; for(const s of segs){ if(o[1]<=s[0]||o[0]>=s[1]){ n.push(s); continue; } if(o[0]>s[0]) n.push([s[0],o[0]]); if(o[1]<s[1]) n.push([o[1],s[1]]); } segs=n; }
  let best=null; for(const s of segs) if(!best||s[1]-s[0]>best[1]-best[0]) best=s; return best;
}
function r2WallPlan(R,A){
  const wins=A.objs.filter(o=>o.k==='window'), items=A.objs.filter(o=>o.k==='painting'||o.k==='portraits'), occ=[];
  for(const w of wins){ w._ww=20; w._hid=false; }
  const wspan=()=>wins.filter(w=>!w._hid).map(w=>[w.x-w._ww-5,w.x+w._ww+5]);
  for(const it of items){
    const P=it.k==='portraits', ext=P?[it.x-60,it.x+70]:[it.x-26,it.x+26], minW=P?72:30, maxW=P?130:52;
    let sp=r2Free(ext,occ.concat(wspan()));
    if(!sp||sp[1]-sp[0]<minW){ for(const w of wins) if(w.x+w._ww+5>ext[0]&&w.x-w._ww-5<ext[1]) w._ww=11; sp=r2Free(ext,occ.concat(wspan())); }
    if(!sp||sp[1]-sp[0]<minW){ for(const w of wins) if(w.x+w._ww+5>ext[0]&&w.x-w._ww-5<ext[1]) w._hid=true; sp=r2Free(ext,occ.concat(wspan())); }
    if(!sp) sp=ext;
    if(sp[1]-sp[0]>maxW){ const c=clamp(it.x,sp[0]+maxW/2,sp[1]-maxW/2); sp=[c-maxW/2,c+maxW/2]; }
    it._sp=sp; occ.push([sp[0]-2,sp[1]+2]);
  }
  const blk=[];
  for(const o of A.objs){
    if(o.k==='fireplace') blk.push([o.x-50,o.x+50]); else if(o.k==='oven') blk.push([o.x-54,o.x+54]);
    else if((o.k==='board'||o.k==='chart'||o.k==='mapwall'||o.k==='herbs')&&o.y<A.ry+60) blk.push([o.x-44,o.x+44]);
    else if((o.k==='mirror'||o.k==='trophy')&&o.y<A.ry+60) blk.push([o.x-26,o.x+26]);
  }
  for(const w of wins) if(!w._hid){ const cs=[w.x-38,w.x+38]; w._cur=w._ww===20&&!occ.some(o=>o[1]>cs[0]&&o[0]<cs[1]); occ.push(w._cur?cs:[w.x-w._ww-6,w.x+w._ww+6]); }
  // decor: fill the widest gaps with style decor
  const all=occ.concat(blk), gaps=[]; let segs=[[R.x0+10,R.x0+R.W-10]];
  for(const o of all){ const n=[]; for(const s of segs){ if(o[1]<=s[0]||o[0]>=s[1]){ n.push(s); continue; } if(o[0]>s[0]) n.push([s[0],o[0]]); if(o[1]<s[1]) n.push([o[1],s[1]]); } segs=n; }
  for(const s of segs) gaps.push(s);
  const DW={sampler:24,plates:56,quilt:50,wreath:28,clockw:24,garlic:18,shelfw:42,horseshoe:18,pans:58,ladles:34,sign:40,sconce:16,lantern:18,shield:46,banner:28,keys:22,wanted:26,ribbons:44,swatches:38,starchart:44,moonchart:50,map:48,picks:38,antlers:50,snowshoes:38,pelt:36,herbsdry:44,drawings:44,pennant:44,skeins:40,fiddle:22,sheet:24,crest:36,tools:40};
  R.decor=[]; const pool=R.dec.slice(); let n=0; const maxN=Math.max(2,Math.round(R.W/150));
  while(n<maxN&&gaps.length){
    gaps.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0])); const g=gaps[0], gw=g[1]-g[0]; let ok=null;
    for(let t=0;t<pool.length;t++){ const k=pool[t]; if(DW[k]+14<=gw){ ok=k; pool.splice(t,1); break; } }
    if(!ok) break;
    const cx=(g[0]+g[1])/2, w=DW[ok]; R.decor.push({k:ok,x:cx,w}); gaps.shift(); gaps.push([g[0],cx-w/2-4],[cx+w/2+4,g[1]]); n++;
  }
}

// ---------- floors
function r2Floor(g,R){
  const {x0,y0,W,H}=R, r=mulberry32(R.seed*13+5), f=R.fl;
  g.save(); g.beginPath(); g.rect(x0,y0,W,H); g.clip();
  if(f==='tile') r2Tiles(g,r,x0,y0,W,H,R.S0.tile,24);
  else if(f==='flags') r2Flags(g,r,x0,y0,W,H,R.flp,R.st==='library'?0.85:1.1);
  else if(f==='dirt') r2Dirt(g,r,x0,y0,W,H,R.S0.dirt);
  else if(f==='woven') r2Woven(g,r,x0,y0,W,H);
  else if(f==='herring') r2Herring(g,r,x0,y0,W,H,R.flp);
  else r2Planks(g,r,x0,y0,W,H,R.flp,16,f==='grey'||f==='white');
  if(R.S0.kitchen){ const c=R.A.objs.find(o=>o.k==='counter'); if(c){ const kx1=c.x+c.w/2+18, ky1=c.y-c.h/2+6; g.save(); g.beginPath(); g.rect(x0,y0,kx1-x0,ky1-y0); g.clip(); r2Tiles(g,r,x0,y0,kx1-x0,ky1-y0,R.S0.kitchen,22); g.restore(); g.fillStyle='#4a3a2a'; g.fillRect(kx1-2,y0,3,ky1-y0); g.fillRect(x0,ky1-2,kx1-x0+1,3); } }
  // a worn path from the door, and soft shade along the walls (light from upper left)
  g.fillStyle=r2rg(g,x0+W/2,y0+H,10,H*0.8,'rgba(255,240,210,.07)','rgba(255,240,210,0)'); g.fillRect(x0,y0,W,H);
  g.fillStyle=r2lg(g,0,y0+34,0,y0+76,'rgba(0,0,0,.42)','rgba(0,0,0,0)'); g.fillRect(x0,y0+34,W,42);
  g.fillStyle=r2lg(g,x0,0,x0+46,0,'rgba(0,0,0,.36)','rgba(0,0,0,0)'); g.fillRect(x0,y0,46,H);
  g.fillStyle=r2lg(g,x0+W,0,x0+W-22,0,'rgba(0,0,0,.22)','rgba(0,0,0,0)'); g.fillRect(x0+W-22,y0,22,H);
  g.fillStyle=r2lg(g,0,y0+H,0,y0+H-18,'rgba(0,0,0,.25)','rgba(0,0,0,0)'); g.fillRect(x0,y0+H-18,W,18);
  g.restore();
}
function r2Planks(g,r,x0,y0,W,H,pal,ph,worn){
  for(let y=y0,row=0;y<y0+H;y+=ph,row++){
    let x=x0-r()*120;
    while(x<x0+W){
      const L=70+r()*140, c=pal[Math.floor(r()*pal.length)];
      g.fillStyle=r2c(c,(r()-0.5)*0.14); g.fillRect(x,y,L,ph);
      g.strokeStyle='rgba(30,16,6,.16)'; g.lineWidth=0.6;
      for(let k=0;k<3;k++){ const gy=y+2+r()*(ph-4); g.beginPath(); g.moveTo(x+2,gy); g.bezierCurveTo(x+L*0.3,gy+(r()-0.5)*3,x+L*0.7,gy+(r()-0.5)*3,x+L-2,gy+(r()-0.5)*2); g.stroke(); }
      if(r()<0.22){ const kx=x+12+r()*(L-24), ky=y+ph/2+(r()-0.5)*5; r2e(g,kx,ky,2.6,1.5,'rgba(40,20,8,.35)'); g.strokeStyle='rgba(40,20,8,.16)'; g.beginPath(); g.ellipse(kx,ky,5.5,2.8,0,0,TAU); g.stroke(); }
      if(worn&&r()<0.3){ g.fillStyle='rgba(255,250,240,.06)'; g.fillRect(x+r()*L*0.5,y+2,L*0.4,ph-4); }
      g.fillStyle='rgba(255,236,200,.09)'; g.fillRect(x,y,L,1);
      g.fillStyle='rgba(18,9,3,.55)'; g.fillRect(x,y,1,ph);
      g.fillStyle='rgba(20,12,6,.45)'; g.fillRect(x+3,y+3,1.3,1.3); g.fillRect(x+3,y+ph-4.3,1.3,1.3);
      x+=L;
    }
    g.fillStyle='rgba(15,8,3,.5)'; g.fillRect(x0,y+ph-1,W,1);
  }
}
function r2Herring(g,r,x0,y0,W,H,pal){
  const cw=20, p=10, s=0.7;
  for(let c=0;c*cw<W+cw;c++){ const x=x0+c*cw, sg=c%2?-1:1, off=c%2?s*cw:0;
    for(let y=y0-40+off;y<y0+H+40;y+=p){ g.fillStyle=r2c(pal[Math.floor(r()*pal.length)],(r()-0.5)*0.12); g.beginPath(); g.moveTo(x,y); g.lineTo(x+cw,y+sg*s*cw); g.lineTo(x+cw,y+sg*s*cw+p); g.lineTo(x,y+p); g.closePath(); g.fill();
      g.strokeStyle='rgba(30,15,5,.45)'; g.lineWidth=0.8; g.stroke(); g.strokeStyle='rgba(255,230,190,.10)'; g.beginPath(); g.moveTo(x+1,y+1); g.lineTo(x+cw-1,y+sg*s*cw+1); g.stroke(); } }
  g.strokeStyle='rgba(40,20,8,.7)'; g.lineWidth=3; g.strokeRect(x0+8,y0+40,W-16,H-48); g.strokeStyle='rgba(200,150,90,.35)'; g.lineWidth=1; g.strokeRect(x0+12,y0+44,W-24,H-56);
}
function r2Tiles(g,r,x0,y0,W,H,cols,s){
  for(let j=0;j*s<H;j++) for(let i=0;i*s<W;i++){ const c=cols[(i+j)%2], x=x0+i*s, y=y0+j*s; g.fillStyle=r2c(c,(r()-0.5)*0.1); g.fillRect(x,y,s,s); g.fillStyle='rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x+1,y+1); g.lineTo(x+s*0.6,y+1); g.lineTo(x+1,y+s*0.6); g.fill(); g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(x,y+s-2,s,2); }
  g.fillStyle='rgba(60,50,40,.55)'; for(let x=x0;x<x0+W;x+=s) g.fillRect(x-0.6,y0,1.2,H); for(let y=y0;y<y0+H;y+=s) g.fillRect(x0,y-0.6,W,1.2);
}
function r2Flags(g,r,x0,y0,W,H,pal,sz){ sz=sz||1;
  // random ashlar: a grid of cells merged into 1x1, 2x1, 1x2 and 2x2 flags
  const c=Math.round(24*sz), cols=Math.ceil(W/c)+1, rows=Math.ceil(H/c)+1, used=new Uint8Array(cols*rows);
  g.fillStyle='#2a2622'; g.fillRect(x0,y0,W,H);
  const flag=(x,y,w,h)=>{ const col=r2c(pal[Math.floor(r()*pal.length)],(r()-0.5)*0.14); r2rr(g,x+1,y+1,w-2,h-2,2.5,col);
    g.fillStyle='rgba(255,255,255,.1)'; g.fillRect(x+3,y+1.4,w-6,1.2); g.fillRect(x+1.4,y+3,1.2,h-6); g.fillStyle='rgba(0,0,0,.24)'; g.fillRect(x+3,y+h-2.6,w-6,1.2); g.fillRect(x+w-2.6,y+3,1.2,h-6);
    for(let k=0;k<w*h/180;k++){ g.fillStyle=r()<0.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.06)'; g.beginPath(); g.arc(x+4+r()*(w-8),y+4+r()*(h-8),0.8+r()*2.2,0,TAU); g.fill(); }
    if(r()<0.1){ g.strokeStyle='rgba(20,15,10,.35)'; g.lineWidth=0.7; g.beginPath(); let cx=x+5+r()*(w-10), cy=y+3; g.moveTo(cx,cy); for(let k=0;k<3;k++){ cx+=(r()-0.5)*8; cy+=(h-6)/3; g.lineTo(cx,cy); } g.stroke(); } };
  for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ if(used[j*cols+i]) continue; const q=r(); let w=1,h=1;
    const free=(a,b)=>i+a<cols&&j+b<rows&&!used[(j+b)*cols+i+a];
    if(q<0.28&&free(1,0)&&free(0,1)&&free(1,1)){ w=2; h=2; } else if(q<0.62&&free(1,0)){ w=2; } else if(q<0.8&&free(0,1)){ h=2; }
    for(let b=0;b<h;b++) for(let a=0;a<w;a++) used[(j+b)*cols+i+a]=1;
    flag(x0+i*c,y0+j*c,w*c,h*c); }
}
function r2Dirt(g,r,x0,y0,W,H,kind){
  const base=kind==='miner'?'#5a4a3c':kind==='hut'?'#5a4a34':'#76593c'; g.fillStyle=base; g.fillRect(x0,y0,W,H);
  for(let i=0;i<W*H/220;i++){ const x=x0+r()*W, y=y0+r()*H; g.fillStyle=r()<0.5?'rgba(30,20,10,.12)':'rgba(170,140,100,.10)'; g.beginPath(); g.ellipse(x,y,3+r()*14,2+r()*8,r()*3,0,TAU); g.fill(); }
  for(let i=0;i<W*H/900;i++){ const x=x0+r()*W, y=y0+r()*H, s=1+r()*2.2; r2e(g,x+0.6,y+0.8,s,s*0.8,'rgba(0,0,0,.3)'); r2e(g,x,y,s,s*0.8,r2c('#8a8478',(r()-0.5)*0.4)); r2o(g,x-s*0.3,y-s*0.3,s*0.35,'rgba(255,255,255,.25)'); }
  if(kind==='miner'){ for(let i=0;i<10;i++){ r2e(g,x0+r()*W,y0+r()*H,20+r()*30,10+r()*14,'rgba(10,8,8,.18)',r()*3); } }
  if(kind==='hut'){ for(let i=0;i<26;i++){ r2e(g,x0+r()*W,y0+r()*H,6+r()*16,4+r()*9,`rgba(${70+r()*30|0},${100+r()*30|0},${50+r()*20|0},.35)`,r()*3); } for(let i=0;i<60;i++){ const x=x0+r()*W, y=y0+r()*H; r2e(g,x,y,2.4,1.2,r2pk(r,['#6a7a3a','#8a6a2a','#5a6a2a','#9a7a3a']),r()*3); } }
  const strawN=kind==='farm'?420:kind==='miner'?90:140;
  for(let i=0;i<strawN;i++){ let x,y; if(r()<0.55){ const e=Math.floor(r()*4); x=e===0?x0+r()*30:e===1?x0+W-r()*30:x0+r()*W; y=e===2?y0+30+r()*30:e===3?y0+H-r()*24:y0+r()*H; } else { x=x0+r()*W; y=y0+r()*H; } const a=r()*TAU, L=4+r()*9; g.strokeStyle=r2pk(r,['rgba(216,184,96,.75)','rgba(184,152,58,.7)','rgba(232,208,130,.7)']); g.lineWidth=0.9; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); g.stroke(); }
}
function r2Woven(g,r,x0,y0,W,H){
  g.fillStyle='#4a3020'; g.fillRect(x0,y0,W,H); r2Planks(g,r,x0,y0,W,H,['#5a3c24','#4e3420','#604028'],18,false);
  const m=22, s=24, mx0=x0+m, my0=y0+40, mw=W-m*2, mh=H-40-m;
  g.fillStyle='#8a6a3a'; g.fillRect(mx0-3,my0-3,mw+6,mh+6);
  for(let j=0;j*s<mh;j++) for(let i=0;i*s<mw;i++){ const x=mx0+i*s, y=my0+j*s, hz=(i+j)%2===0;
    for(let k=0;k<3;k++){ const c=r2c(['#ae9264','#a08658','#b89a6a'][k],(r()-0.5)*0.12); if(hz){ g.fillStyle=c; g.fillRect(x,y+k*8,s,8); g.fillStyle='rgba(255,240,200,.14)'; g.fillRect(x,y+k*8,s,1.2); g.fillStyle='rgba(60,40,10,.3)'; g.fillRect(x,y+k*8+7,s,1); } else { g.fillStyle=c; g.fillRect(x+k*8,y,8,s); g.fillStyle='rgba(255,240,200,.14)'; g.fillRect(x+k*8,y,1.2,s); g.fillStyle='rgba(60,40,10,.3)'; g.fillRect(x+k*8+7,y,1,s); } } }
  g.strokeStyle='#5a3a1a'; g.lineWidth=3; g.strokeRect(mx0-1.5,my0-1.5,mw+3,mh+3);
}
// ---------- back wall, side walls, front wall
function r2Wall(g,R){
  const {x0,y0,W}=R, L=x0-28, Wd=W+56, wy=y0-38, wh=66, w=R.wl, r=mulberry32(R.seed*31+7), c=w.c;
  g.save(); g.beginPath(); g.rect(L,wy,Wd,wh); g.clip();
  if(w.k==='stripes'){ g.fillStyle=c[0]; g.fillRect(L,wy,Wd,wh); for(let x=L;x<L+Wd;x+=28){ g.fillStyle=c[1]; g.fillRect(x,wy,14,wh); g.fillStyle=r2a(c[2],0.55); g.fillRect(x+16,wy,1.2,wh); g.fillRect(x+25,wy,1.2,wh); } }
  else if(w.k==='damask'){ g.fillStyle=c[0]; g.fillRect(L,wy,Wd,wh); g.fillStyle=w.star?'rgba(216,176,74,.55)':c[1];
    for(let j=0;j<6;j++) for(let i=0;i<Wd/18+1;i++){ const x=L+i*18+(j%2)*9, y=wy+4+j*12; if(w.star){ g.beginPath(); for(let k=0;k<10;k++){ const a=k/10*TAU-Math.PI/2, rr=k%2?1.2:3; g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } g.fill(); } else { g.beginPath(); g.moveTo(x,y-5); g.quadraticCurveTo(x+4,y,x,y+5); g.quadraticCurveTo(x-4,y,x,y-5); g.fill(); g.beginPath(); g.arc(x-4,y-2,1.2,0,TAU); g.arc(x+4,y-2,1.2,0,TAU); g.arc(x-4,y+2,1.2,0,TAU); g.arc(x+4,y+2,1.2,0,TAU); g.fill(); } } }
  else if(w.k==='floral'){ g.fillStyle=c[0]; g.fillRect(L,wy,Wd,wh); for(let j=0;j<5;j++) for(let i=0;i<Wd/20+1;i++){ const x=L+i*20+(j%2)*10+(r()-0.5)*3, y=wy+6+j*13+(r()-0.5)*3; r2e(g,x-3,y+3,2.6,1.1,r2a(c[3],0.8),0.6); r2e(g,x+3,y+3,2.6,1.1,r2a(c[3],0.8),-0.6); const fc=r()<0.5?c[1]:c[2]; for(let k=0;k<5;k++){ const a=k/5*TAU; r2o(g,x+Math.cos(a)*1.8,y+Math.sin(a)*1.8,1.4,r2a(fc,0.9)); } r2o(g,x,y,0.9,'rgba(255,240,180,.9)'); } }
  else if(w.k==='panel'){ const b=c[0]; g.fillStyle=r2c(b,-0.1); g.fillRect(L,wy,Wd,wh); for(let x=L;x<L+Wd;x+=40){ r2wood(g,x+4,wy+6,32,wh-12,r2c(b,(r()-0.5)*0.12),r,wh,2); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+4,wy+wh-7,32,1.5); g.fillRect(x+35,wy+6,1.5,wh-12); g.fillStyle='rgba(255,230,190,.12)'; g.fillRect(x+4,wy+6,32,1); } }
  else if(w.k==='stone'){ g.fillStyle='#2a2826'; g.fillRect(L,wy,Wd,wh); for(let y=wy;y<wy+wh;){ const rh=w.round?11+r()*5:10+r()*4; let x=L-r()*20; while(x<L+Wd){ const sw=w.round?14+r()*14:18+r()*20, col=r2c(r2pk(r,c),(r()-0.5)*0.15); if(w.round){ r2e(g,x+sw/2,y+rh/2,sw/2-1,rh/2-0.8,col); r2e(g,x+sw/2-1,y+rh/2-1.5,sw/2-3,rh/2-3,'rgba(255,255,255,.07)'); if(w.moss&&r()<0.35) r2e(g,x+sw/2+(r()-0.5)*6,y+rh*0.75,4+r()*4,2,'rgba(110,150,70,.55)'); } else { r2rr(g,x+1,y+1,sw-2,rh-2,2,col); g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(x+2,y+1.5,sw-4,1); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x+2,y+rh-2,sw-4,1); } x+=sw; } y+=rh; }
    if(w.beams) for(let x=x0+40;x<x0+W;x+=130){ r2wood(g,x,wy,10,wh,'#5a3e24',r,wh,1); } }
  else if(w.k==='log'){ g.fillStyle='#d8c8a8'; g.fillRect(L,wy,Wd,wh); for(let y=wy;y<wy+wh;y+=11){ const col=r2c(c[0],(r()-0.5)*0.18); g.fillStyle=r2lg(g,0,y,0,y+10,r2c(col,0.25),col,r2c(col,-0.45)); rrect(g,L,y+0.5,Wd,10,5); g.fill(); g.strokeStyle='rgba(40,20,8,.3)'; g.lineWidth=0.6; for(let k=0;k<10;k++){ const bx=L+r()*Wd; g.beginPath(); g.moveTo(bx,y+3+r()*4); g.lineTo(bx+8+r()*16,y+3+r()*4); g.stroke(); } for(let k=0;k<3;k++){ const kx=L+r()*Wd; r2e(g,kx,y+5,2.2,1.6,'rgba(40,20,8,.45)'); } } }
  else { // plaster and timber
    g.fillStyle=c[0]; g.fillRect(L,wy,Wd,wh); for(let i=0;i<Wd*wh/140;i++){ g.fillStyle=r()<0.5?'rgba(0,0,0,.04)':'rgba(255,255,255,.05)'; g.beginPath(); g.ellipse(L+r()*Wd,wy+r()*wh,2+r()*7,1+r()*4,r()*3,0,TAU); g.fill(); }
    const bm=c[1]; r2wood(g,L,y0-2,Wd,7,bm,r,7,0);
    for(let x=x0+6;x<x0+W;x+=104){ r2wood(g,x,wy,8,wh,bm,r,wh,0); r2o(g,x+4,y0+1,1,'rgba(0,0,0,.5)'); if(r()<0.55){ const d=r()<0.5?1:-1, bx=x+4+d*4; g.save(); g.translate(bx,wy); g.fillStyle=r2c(bm,-0.05); g.beginPath(); g.moveTo(0,0); g.lineTo(d*7,0); g.lineTo(d*42,36); g.lineTo(d*35,36); g.closePath(); g.fill(); g.restore(); } }
  }
  if(w.wain){ const wy2=y0+14; r2rr(g,L,wy2,Wd,14,0,w.wain); for(let x=L+6;x<L+Wd;x+=34){ g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x,wy2+3,28,9); g.fillStyle=r2c(w.wain,0.08); g.fillRect(x+1,wy2+4,26,7); g.fillStyle='rgba(255,240,210,.15)'; g.fillRect(x,wy2+3,28,1); } r2wood(g,L,wy2-3,Wd,4,R.trim,r,4,0); }
  g.fillStyle=r2lg(g,0,wy,0,wy+20,'rgba(0,0,0,.42)','rgba(0,0,0,0)'); g.fillRect(L,wy,Wd,20);
  g.fillStyle=r2lg(g,0,y0+16,0,y0+28,'rgba(0,0,0,0)','rgba(0,0,0,.22)'); g.fillRect(L,y0+16,Wd,12);
  g.restore();
  // crown and baseboard
  r2wood(g,L,y0-46,Wd,8,R.trim,r,8,0); g.fillStyle='rgba(255,240,210,.18)'; g.fillRect(L,y0-46,Wd,1.4); g.fillStyle='rgba(0,0,0,.5)'; g.fillRect(L,y0-38,Wd,1.6);
  r2wood(g,L,y0+28,Wd,6,r2c(R.trim,-0.1),r,6,0); g.fillStyle='rgba(255,240,210,.2)'; g.fillRect(L,y0+28,Wd,1); g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(L,y0+33,Wd,1.2);
}
function r2Frame(g,R){
  const {x0,y0,W,H}=R, r=mulberry32(R.seed*17+3), cap=R.cap, log=R.wl.k==='log', stone=R.wl.k==='stone';
  const side=(x,w,lit)=>{ g.fillStyle=cap; g.fillRect(x,y0-46,w,H+72); if(stone){ for(let y=y0-46;y<y0+H+26;y+=12){ g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x,y,w,1); g.fillRect(x+(((y/12)|0)%2?8:16),y,1,12); } } else { g.strokeStyle='rgba(255,230,190,.06)'; g.lineWidth=1; for(let k=4;k<w;k+=6){ g.beginPath(); g.moveTo(x+k,y0-46); g.lineTo(x+k,y0+H+26); g.stroke(); } }
    g.fillStyle=lit?'rgba(255,230,190,.18)':'rgba(0,0,0,.45)'; g.fillRect(lit?x:x+w-3,y0-46,3,H+72); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(lit?x+w-2:x,y0-46,2,H+72); };
  side(x0-28,28,false); side(x0+W,28,true);
  if(log){ for(let y=y0-38;y<y0+28;y+=11) for(const ex of [x0-6,x0+W+6]){ r2o(g,ex,y+5.5,6,'#8a6440'); g.strokeStyle='rgba(60,35,15,.6)'; g.lineWidth=0.6; g.beginPath(); g.arc(ex,y+5.5,3.5,0,TAU); g.stroke(); g.beginPath(); g.arc(ex,y+5.5,1.5,0,TAU); g.stroke(); } }
  // front wall with the doorway
  const fy=y0+H, dx0=x0+W/2-35, dx1=x0+W/2+35;
  for(const [a,b] of [[x0-28,dx0],[dx1,x0+W+28]]){ g.fillStyle=cap; g.fillRect(a,fy,b-a,28); if(stone){ for(let yy=fy;yy<fy+28;yy+=9) for(let xx=a+((yy-fy)/9%2?6:0);xx<b;xx+=18){ g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(xx,yy,1,9); g.fillRect(a,yy,b-a,1); } } else { g.strokeStyle='rgba(255,230,190,.05)'; g.lineWidth=1; for(let yy=fy+5;yy<fy+26;yy+=6){ g.beginPath(); g.moveTo(a,yy); g.lineTo(b,yy); g.stroke(); } } g.fillStyle='rgba(255,230,190,.12)'; g.fillRect(a,fy,b-a,2); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(a,fy+24,b-a,4); }
  // threshold and door posts
  r2rr(g,dx0,fy+2,70,24,0,R.wl.k==='stone'||R.fl==='flags'?'#6a6460':'#5a3e26'); g.fillStyle='rgba(255,240,210,.12)'; g.fillRect(dx0,fy+2,70,1.5); g.fillStyle='rgba(0,0,0,.3)'; for(let x=dx0+12;x<dx1;x+=14) g.fillRect(x,fy+2,1,24);
  for(const px of [dx0-6,dx1]){ r2wood(g,px,fy-2,6,30,R.wl.k==='stone'?'#4a4448':'#6a4428',r,30,1); }
  // the top crown over the side walls
  g.fillStyle=r2c(cap,-0.2); g.fillRect(x0-28,y0-50,W+56,4);
}
function r2Mat(g,R){
  const {x0,y0,W,H}=R, x=x0+W/2-30, y=y0+H-22, r=mulberry32(R.seed+99), c=R.fab;
  r2sh(g,x,y,60,24,4,0.2); r2rr(g,x,y,60,24,4,'#8a6a40'); g.save(); rrect(g,x,y,60,24,4); g.clip();
  for(let i=0;i<30;i++){ g.strokeStyle=i%2?'rgba(60,40,15,.25)':'rgba(220,190,130,.18)'; g.lineWidth=1; g.beginPath(); g.moveTo(x+i*2.2,y); g.lineTo(x+i*2.2-6,y+24); g.stroke(); }
  g.restore(); g.strokeStyle=r2c(c[0],-0.1); g.lineWidth=3; rrect(g,x+3,y+3,54,18,3); g.stroke();
  if(R.mat){ g.fillStyle=r2c(c[0],-0.2); g.font=`900 8px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(R.mat,x+30,y+12.5); }
  else { r2o(g,x+30,y+12,3.4,r2c(c[0],-0.15)); for(let k=0;k<4;k++){ const a=-Math.PI*0.9+k*0.6; r2o(g,x+30+Math.cos(a)*5.5,y+12+Math.sin(a)*5.5,1.6,r2c(c[0],-0.15)); } }
}
// ---------- wall decor (drawn into the cached room)
function r2Decor(g,R){
  const y0=R.y0, r=mulberry32(R.seed*7+77), fab=R.fab;
  for(const d of R.decor) r2Dec1(g,d.k,d.x,y0,R,mulberry32(R.seed*101+Math.round(d.x)),fab);
}
function r2DecorPost(g,R){
  const y0=R.y0;
  if(R.st==='ash'){ // Lantern Day paper lanterns strung across the wall
    const pins=[]; for(let x=R.x0+6;x<=R.x0+R.W-6;x+=R.W/5) pins.push(x);
    g.strokeStyle='#3a2414'; g.lineWidth=0.8; for(let i=0;i<pins.length-1;i++){ g.beginPath(); g.moveTo(pins[i],y0-35); g.quadraticCurveTo((pins[i]+pins[i+1])/2,y0-24,pins[i+1],y0-35); g.stroke(); }
    for(let i=0;i<pins.length-1;i++) for(let k=1;k<6;k++){ const tt=k/6, x=lerp(pins[i],pins[i+1],tt), y=y0-35+(1-(2*tt-1)**2)*5.5; const col=['#e8402a','#f08a2a','#f0c040'][(i*5+k)%3]; g.fillStyle='#2a1a10'; g.fillRect(x-1.6,y,3.2,1.2); r2rr(g,x-2.6,y+1,5.2,6.4,2.2,col); g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(x-1.6,y+1.8,1,4.4); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x+0.8,y+1.8,1,4.4); g.fillStyle='#2a1a10'; g.fillRect(x-1.2,y+7.2,2.4,1); }
  }
}
function r2Dec1(g,k,x,y0,R,r,fab){
  const nail=(nx,ny)=>{ r2o(g,nx,ny,1.2,'#2a2018'); r2o(g,nx-0.3,ny-0.3,0.5,'rgba(255,255,255,.5)'); };
  const paper=(px,py,pw,ph,rot,col)=>{ g.save(); g.translate(px,py); g.rotate(rot); r2rr(g,-pw/2+1,-ph/2+1.5,pw,ph,0,'rgba(0,0,0,.25)'); r2rr(g,-pw/2,-ph/2,pw,ph,0,col||'#efe2c4'); g.restore(); };
  switch(k){
    case 'sampler':{ r2rr(g,x-12,y0-26,24,20,1,'rgba(0,0,0,.3)'); r2rr(g,x-12,y0-27,24,20,1,R.trim==='#e8e0d0'?'#8a5a3a':'#a07a4a'); r2rr(g,x-9,y0-24,18,14,0,'#efe6d0'); g.fillStyle='#c8402a'; g.beginPath(); g.moveTo(x,y0-12.5); g.bezierCurveTo(x-6,y0-16,x-5,y0-22,x,y0-19); g.bezierCurveTo(x+5,y0-22,x+6,y0-16,x,y0-12.5); g.fill(); g.fillStyle=fab[2]; for(let i=-7;i<=7;i+=2) g.fillRect(x+i-0.5,y0-23,1,1); nail(x,y0-29); break; }
    case 'plates':{ r2wood(g,x-28,y0-5,56,4,R.wood,r,4,1); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-26,y0-1,52,2); for(let i=-1;i<=1;i++){ const px=x+i*17, py=y0-13; r2o(g,px+1,py+1,8,'rgba(0,0,0,.25)'); r2o(g,px,py,8,'#f2ede0'); g.strokeStyle=r2pk(r,['#3a5a9a','#2a6a5a','#9a3a3a']); g.lineWidth=1.6; g.beginPath(); g.arc(px,py,6.2,0,TAU); g.stroke(); g.lineWidth=0.8; g.beginPath(); g.arc(px,py,3,0,TAU); g.stroke(); r2o(g,px-3,py-3,1.6,'rgba(255,255,255,.7)'); } break; }
    case 'quilt':{ r2l(g,x-27,y0-33,x+27,y0-33,'#4a2e18',2.4); r2o(g,x-27,y0-33,2,'#6a4428'); r2o(g,x+27,y0-33,2,'#6a4428'); g.save(); g.beginPath(); g.moveTo(x-24,y0-32); g.lineTo(x+24,y0-32); g.lineTo(x+23,y0+6); g.quadraticCurveTo(x,y0+9,x-23,y0+6); g.closePath(); g.clip(); for(let j=0;j<5;j++) for(let i=0;i<6;i++){ g.fillStyle=(i+j)%2?fab[0]:r2pk(r,[fab[1],fab[3],fab[4]]); g.fillRect(x-24+i*8,y0-32+j*8,8,8); if((i+j)%3===0){ g.fillStyle=fab[3]; g.beginPath(); g.moveTo(x-24+i*8,y0-32+j*8); g.lineTo(x-16+i*8,y0-32+j*8); g.lineTo(x-24+i*8,y0-24+j*8); g.fill(); } } g.fillStyle=r2lg(g,x-24,0,x+24,0,'rgba(255,255,255,.12)','rgba(0,0,0,0)','rgba(0,0,0,.2)'); g.fillRect(x-24,y0-32,48,42); g.restore(); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x-23,y0+6,46,2); break; }
    case 'wreath':{ for(let i=0;i<18;i++){ const a=i/18*TAU; r2e(g,x+Math.cos(a)*9,y0-14+Math.sin(a)*9,3.6,2,i%2?'#3a6a32':'#4e8240',a+1.2); } for(let i=0;i<6;i++){ const a=i/6*TAU+0.3; r2o(g,x+Math.cos(a)*9,y0-14+Math.sin(a)*9,1.4,'#c8322a'); } g.fillStyle='#c8402a'; g.beginPath(); g.moveTo(x,y0-5); g.lineTo(x-5,y0-8); g.lineTo(x-5,y0-2); g.closePath(); g.moveTo(x,y0-5); g.lineTo(x+5,y0-8); g.lineTo(x+5,y0-2); g.closePath(); g.fill(); nail(x,y0-24); break; }
    case 'clockw':{ r2o(g,x+1,y0-12,10.5,'rgba(0,0,0,.3)'); r2o(g,x,y0-13,10.5,R.wood); r2o(g,x,y0-13,8,'#f2ead8'); for(let i=0;i<12;i++){ const a=i/12*TAU; g.fillStyle='#3a2a1a'; g.fillRect(x+Math.cos(a)*6.4-0.5,y0-13+Math.sin(a)*6.4-0.5,1,1); } r2l(g,x,y0-13,x+3.5,y0-15,'#2a1a10',1.2); r2l(g,x,y0-13,x-1,y0-19,'#2a1a10',1); r2o(g,x-3,y0-17,3,'rgba(255,255,255,.25)'); break; }
    case 'garlic':{ r2l(g,x,y0-34,x,y0+4,'#b89858',1.2); nail(x,y0-34); for(let i=0;i<6;i++){ const by=y0-28+i*6, bx=x+(i%2?2.5:-2.5); r2e(g,bx,by,3.6,3.2,i%3===2?'#c88a5a':'#efe6d6'); g.strokeStyle='rgba(120,90,60,.4)'; g.lineWidth=0.5; g.beginPath(); g.moveTo(bx,by-3); g.lineTo(bx,by+3); g.stroke(); r2o(g,bx-1.2,by-1.2,0.9,'rgba(255,255,255,.6)'); } break; }
    case 'shelfw':{ r2wood(g,x-21,y0-8,42,4,R.wood,r,4,1); g.fillStyle=r2c(R.wood,-0.3); g.beginPath(); g.moveTo(x-16,y0-4); g.lineTo(x-16,y0+2); g.lineTo(x-10,y0-4); g.fill(); g.beginPath(); g.moveTo(x+16,y0-4); g.lineTo(x+16,y0+2); g.lineTo(x+10,y0-4); g.fill(); r2rr(g,x-17,y0-17,6,9,1,'#4a7aa8'); r2rr(g,x-9,y0-15,7,7,2,'#efe6d6'); r2rr(g,x+1,y0-19,5,11,1,'#8a5a3a'); r2rr(g,x+8,y0-14,8,6,2,'#a85a3a'); for(let i=0;i<5;i++) r2e(g,x+12+Math.cos(i*1.3)*3,y0-17+Math.sin(i*1.3)*2,2.2,1.2,'#4e8240',i); break; }
    case 'horseshoe':{ nail(x,y0-24); g.strokeStyle='rgba(0,0,0,.3)'; g.lineWidth=3.4; g.beginPath(); g.arc(x+1,y0-12,6,Math.PI*1.1,Math.PI*1.9,true); g.stroke(); g.strokeStyle='#7a7a82'; g.lineWidth=3; g.beginPath(); g.arc(x,y0-13,6,Math.PI*1.1,Math.PI*1.9,true); g.stroke(); g.strokeStyle='rgba(255,255,255,.4)'; g.lineWidth=0.8; g.beginPath(); g.arc(x,y0-13,7,Math.PI*0.6,Math.PI*1.0); g.stroke(); break; }
    case 'pans':{ r2l(g,x-29,y0-32,x+29,y0-32,'#3a3a40',2.2); const items=['pan','ladle','pan','whisk','pan']; for(let i=0;i<5;i++){ const px=x-24+i*12, it=items[(i+Math.floor(r()*2))%5]; r2l(g,px,y0-32,px,y0-29,'#2a2a2e',1); if(it==='pan'){ const rr=4.5+r()*2; g.fillStyle='#6a3a1a'; g.fillRect(px-1,y0-29,2,7); r2o(g,px+0.8,y0-21+rr*0.8,rr,'rgba(0,0,0,.3)'); r2o(g,px,y0-22+rr*0.6,rr,'#b8683a'); r2o(g,px,y0-22+rr*0.6,rr-1.4,'#8a4a24'); r2o(g,px-rr*0.35,y0-22,rr*0.35,'rgba(255,220,180,.4)'); } else if(it==='ladle'){ r2l(g,px,y0-29,px,y0-14,'#8a8a94',1.2); r2e(g,px,y0-12,3,2.4,'#9a9aa4'); } else { r2l(g,px,y0-29,px,y0-21,'#6a4a2a',1.6); g.strokeStyle='#aab0b8'; g.lineWidth=0.6; for(let k=-1;k<=1;k++){ g.beginPath(); g.ellipse(px+k*0.8,y0-16,1.6+Math.abs(k),5,0,0,TAU); g.stroke(); } } } break; }
    case 'ladles':{ r2wood(g,x-17,y0-32,34,4,R.wood,r,4,1); const u=[['#8a8a94','spoon'],['#6a4a2a','spat'],['#8a8a94','fork'],['#6a4a2a','spoon']]; for(let i=0;i<4;i++){ const px=x-12+i*8; r2l(g,px,y0-28,px,y0-12,u[i][0],1.4); if(u[i][1]==='spoon') r2e(g,px,y0-10,2.4,3.2,u[i][0]); else if(u[i][1]==='spat') r2rr(g,px-2.5,y0-13,5,6,1,u[i][0]); else { for(let k=-1;k<=1;k++) r2l(g,px+k*1.2,y0-12,px+k*1.2,y0-8,u[i][0],0.7); } } break; }
    case 'sign':{ r2l(g,x-12,y0-34,x-12,y0-26,'#3a3a40',0.8); r2l(g,x+12,y0-34,x+12,y0-26,'#3a3a40',0.8); r2rr(g,x-19,y0-25,40,20,3,'rgba(0,0,0,.3)'); r2wood(g,x-20,y0-26,40,20,'#8a5a32',r,5,3); g.strokeStyle='#d8b04a'; g.lineWidth=1; rrect(g,x-17,y0-23,34,14,2); g.stroke(); if(R.st==='baker'){ r2e(g,x,y0-16,9,4.5,'#d89a50'); for(let i=-1;i<=1;i++) r2l(g,x+i*4-1.5,y0-19,x+i*4+1.5,y0-13,'#8a5420',1); } else { r2rr(g,x-6,y0-21,9,10,1.5,'#c8c8d0'); g.strokeStyle='#c8c8d0'; g.lineWidth=1.4; g.beginPath(); g.arc(x+4,y0-16,2.6,-1.4,1.4); g.stroke(); r2rr(g,x-6,y0-22,9,3,1.5,'#f4f0e6'); } break; }
    case 'sconce':{ r2rr(g,x-3,y0-22,6,12,2,'#b8943a'); r2rr(g,x-4,y0-12,8,2,1,'#d8b04a'); r2rr(g,x-1.6,y0-19,3.2,7,0.5,'#f2ead8'); r2Flame(g,R,x,y0-19,1); break; }
    case 'lantern':{ g.strokeStyle='#2a2a2e'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x-6,y0-30); g.lineTo(x,y0-30); g.lineTo(x,y0-24); g.stroke(); r2rr(g,x-4,y0-24,8,2,1,'#2a2a2e'); r2rr(g,x-3.5,y0-22,7,9,1,'rgba(255,214,120,.85)'); g.strokeStyle='#2a2a2e'; g.lineWidth=0.8; g.strokeRect(x-3.5,y0-22,7,9); r2l(g,x,y0-22,x,y0-13,'#2a2a2e',0.6); r2rr(g,x-4.5,y0-13,9,2,1,'#2a2a2e'); r2Glow(R,x,y0-17,22,'255,200,110',0.35); break; }
    case 'shield':{ g.save(); g.translate(x,y0-14); for(const s of [-1,1]){ g.save(); g.rotate(s*0.7); r2l(g,0,-22,0,22,'#6a4a2a',2); g.fillStyle='#b8bcc4'; g.beginPath(); g.moveTo(0,-27); g.lineTo(2.2,-21); g.lineTo(-2.2,-21); g.fill(); g.restore(); } r2rr(g,-13,-13,27,30,2,'rgba(0,0,0,.3)'); g.fillStyle='#8a2a24'; g.beginPath(); g.moveTo(-13,-14); g.lineTo(13,-14); g.lineTo(13,0); g.quadraticCurveTo(13,10,0,16); g.quadraticCurveTo(-13,10,-13,0); g.closePath(); g.fill(); g.strokeStyle='#c8c8d0'; g.lineWidth=2; g.stroke(); g.fillStyle='#e8b84a'; r2tear(g,0,7,4.5,14); g.fillStyle='#ffe9a0'; r2tear(g,0,6,2,7); g.fillStyle='rgba(255,255,255,.15)'; g.fillRect(-11,-12,6,14); g.restore(); break; }
    case 'banner':{ const bc=R.st==='mayor'?'#7a1a20':R.st==='library'?'#2a4a3a':'#2a3a6a'; r2l(g,x-15,y0-34,x+15,y0-34,'#6a4428',2); r2o(g,x-15,y0-34,1.8,'#d8b04a'); r2o(g,x+15,y0-34,1.8,'#d8b04a'); g.fillStyle=bc; g.beginPath(); g.moveTo(x-12,y0-33); g.lineTo(x+12,y0-33); g.lineTo(x+12,y0+4); g.lineTo(x,y0-2); g.lineTo(x-12,y0+4); g.closePath(); g.fill(); g.fillStyle=r2lg(g,x-12,0,x+12,0,'rgba(255,255,255,.12)','rgba(0,0,0,0)','rgba(0,0,0,.25)'); g.fill(); g.strokeStyle='#d8b04a'; g.lineWidth=1; g.stroke(); g.fillStyle='#d8b04a'; if(R.st==='library'){ r2rr(g,x-6,y0-24,12,9,1,'#e8dcc0'); r2l(g,x,y0-24,x,y0-15,'#8a6a42',0.8); } else { r2tear(g,x,y0-13,4.5,12); g.fillStyle='#ffe9a0'; r2tear(g,x,y0-14,2,6); } break; }
    case 'keys':{ g.fillStyle='#4a3a2a'; g.fillRect(x-1,y0-30,2,4); g.strokeStyle='#8a7a5a'; g.lineWidth=1.3; g.beginPath(); g.arc(x,y0-22,4,0,TAU); g.stroke(); for(let i=-1;i<=1;i++){ g.save(); g.translate(x+i*3,y0-19); g.rotate(i*0.35); g.strokeStyle='#b8943a'; g.lineWidth=1.2; g.beginPath(); g.arc(0,2,2,0,TAU); g.stroke(); r2l(g,0,4,0,13,'#b8943a',1.4); r2l(g,0,11,2.5,11,'#b8943a',1.2); r2l(g,0,13,2,13,'#b8943a',1.2); g.restore(); } break; }
    case 'wanted':{ paper(x,y0-14,20,24,(r()-0.5)*0.15,'#e8d8b0'); g.fillStyle='#3a2414'; g.font=`900 4.5px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('WANTED',x,y0-22.5); r2o(g,x,y0-14,4.5,'#7a8a5a'); r2o(g,x-1.6,y0-15,0.8,'#1a1a1a'); r2o(g,x+1.6,y0-15,0.8,'#1a1a1a'); g.fillStyle='#e8e8e8'; g.beginPath(); g.moveTo(x-2,y0-12); g.lineTo(x-1,y0-10.5); g.lineTo(x,y0-12); g.lineTo(x+1,y0-10.5); g.lineTo(x+2,y0-12); g.fill(); r2l(g,x-6,y0-6,x+6,y0-6,'rgba(60,40,20,.6)',0.7); r2o(g,x,y0-25.5,1,'#c8322a'); break; }
    case 'ribbons':{ r2wood(g,x-22,y0-32,44,4,R.wood,r,4,1); for(let i=0;i<7;i++){ const px=x-18+i*6, L=14+r()*16, c=r2pk(r,['#c84a6a','#4a8ac8','#e8b04a','#6ac84a','#8a4ac8','#e86a3a','#efe6d6']); g.fillStyle=c; g.beginPath(); g.moveTo(px-1.6,y0-28); g.quadraticCurveTo(px+2,y0-28+L*0.5,px-1,y0-28+L); g.lineTo(px+1.4,y0-28+L-1.5); g.quadraticCurveTo(px+4,y0-28+L*0.5,px+1.6,y0-28); g.fill(); } break; }
    case 'swatches':{ for(let j=0;j<2;j++) for(let i=0;i<3;i++){ const px=x-13+i*13, py=y0-24+j*14, c=r2pk(r,fab.concat(['#c84a6a','#4a8ac8','#e8b04a'])); paper(px,py,11,11,(r()-0.5)*0.3,c); if(r()<0.5){ g.fillStyle='rgba(255,255,255,.3)'; for(let k=-4;k<=4;k+=3) g.fillRect(px+k,py-5,1,10); } r2o(g,px,py-5,1,'#c8322a'); } break; }
    case 'starchart':{ paper(x,y0-12,40,28,(r()-0.5)*0.06,'#1e2448'); g.fillStyle='#ffe9a0'; const pts=[]; for(let i=0;i<9;i++){ const sx=x-16+r()*32, sy=y0-23+r()*22; pts.push([sx,sy]); r2o(g,sx,sy,0.6+r()*0.8,'#ffe9a0'); } g.strokeStyle='rgba(255,233,160,.45)'; g.lineWidth=0.5; g.beginPath(); for(let i=0;i<5;i++) g.lineTo(pts[i][0],pts[i][1]); g.stroke(); r2o(g,x-20,y0-26,1,'#c8322a'); r2o(g,x+20,y0-26,1,'#c8322a'); break; }
    case 'moonchart':{ paper(x,y0-14,48,18,0,'#e8dcc0'); for(let i=0;i<5;i++){ const mx=x-18+i*9, my=y0-14; r2o(g,mx,my,3.4,'#2a2a3a'); g.save(); g.beginPath(); g.arc(mx,my,3.4,0,TAU); g.clip(); r2o(g,mx+(i-2)*2.6,my,3.4,'#f4ead0'); g.restore(); } r2o(g,x,y0-24,1,'#c8322a'); break; }
    case 'map':{ paper(x,y0-12,46,30,(r()-0.5)*0.08,'#e8d8b0'); g.strokeStyle='#5a8ab8'; g.lineWidth=1; g.beginPath(); g.moveTo(x-20,y0-20); g.bezierCurveTo(x-8,y0-14,x-10,y0-4,x+4,y0-2); g.stroke(); g.strokeStyle='#8a6a42'; g.lineWidth=0.8; g.setLineDash([2,1.5]); g.beginPath(); g.moveTo(x-16,y0-6); g.lineTo(x-4,y0-18); g.lineTo(x+10,y0-12); g.lineTo(x+16,y0-20); g.stroke(); g.setLineDash([]); for(let i=0;i<4;i++) r2o(g,x+6+r()*12,y0-6+r()*6,1.6,'#4e7a3a'); g.strokeStyle='#c8322a'; g.lineWidth=1.3; r2l(g,x+14,y0-22,x+18,y0-18,'#c8322a',1.3); r2l(g,x+18,y0-22,x+14,y0-18,'#c8322a',1.3); r2o(g,x-21,y0-25,1,'#c8322a'); r2o(g,x+21,y0-25,1,'#c8322a'); break; }
    case 'picks':{ g.save(); g.translate(x,y0-14); for(const s of [-1,1]){ g.save(); g.rotate(s*0.6); r2l(g,0,-14,0,16,'#7a5430',2.4); g.strokeStyle='#8a8a94'; g.lineWidth=2.6; g.beginPath(); g.moveTo(-10,-11); g.quadraticCurveTo(0,-17,10,-11); g.stroke(); g.strokeStyle='rgba(255,255,255,.4)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-8,-12.5); g.quadraticCurveTo(0,-17.5,8,-12.5); g.stroke(); g.restore(); } g.restore(); break; }
    case 'antlers':{ r2e(g,x+1,y0-9,9,7,'rgba(0,0,0,.3)'); g.fillStyle=r2lg(g,0,y0-16,0,y0-2,'#8a5a32','#5a3a1e'); g.beginPath(); g.moveTo(x-8,y0-16); g.lineTo(x+8,y0-16); g.lineTo(x+6,y0-2); g.lineTo(x-6,y0-2); g.closePath(); g.fill(); g.strokeStyle='#e0d0b0'; g.lineCap='round'; g.lineWidth=2.4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(x+s*3,y0-14); g.quadraticCurveTo(x+s*14,y0-18,x+s*21,y0-32); g.stroke(); g.lineWidth=1.8; g.beginPath(); g.moveTo(x+s*10,y0-18); g.lineTo(x+s*9,y0-28); g.moveTo(x+s*16,y0-23); g.lineTo(x+s*22,y0-26); g.moveTo(x+s*15,y0-21); g.lineTo(x+s*13,y0-31); g.stroke(); g.lineWidth=2.4; } g.lineCap='butt'; break; }
    case 'snowshoes':{ for(const s of [-1,1]){ g.save(); g.translate(x+s*7,y0-12); g.rotate(s*0.35); g.strokeStyle='#8a6a42'; g.lineWidth=1.8; g.beginPath(); g.ellipse(0,-3,6,12,0,0,TAU); g.stroke(); g.strokeStyle='rgba(220,200,160,.7)'; g.lineWidth=0.5; for(let k=-10;k<=6;k+=3){ g.beginPath(); g.moveTo(-5,k); g.lineTo(5,k); g.stroke(); } for(let k=-4;k<=4;k+=3){ g.beginPath(); g.moveTo(k,-13); g.lineTo(k,7); g.stroke(); } r2l(g,0,9,0,14,'#8a6a42',1.6); g.restore(); } break; }
    case 'pelt':{ g.strokeStyle='#6a4a2a'; g.lineWidth=1.4; g.strokeRect(x-16,y0-32,32,30); g.fillStyle='#7a5434'; g.beginPath(); g.moveTo(x,y0-30); g.quadraticCurveTo(x+8,y0-30,x+9,y0-24); g.lineTo(x+14,y0-26); g.lineTo(x+10,y0-17); g.quadraticCurveTo(x+11,y0-9,x+13,y0-5); g.lineTo(x+6,y0-7); g.lineTo(x,y0-4); g.lineTo(x-6,y0-7); g.lineTo(x-13,y0-5); g.quadraticCurveTo(x-11,y0-9,x-10,y0-17); g.lineTo(x-14,y0-26); g.lineTo(x-9,y0-24); g.quadraticCurveTo(x-8,y0-30,x,y0-30); g.fill(); g.strokeStyle='rgba(40,25,10,.4)'; g.lineWidth=0.6; for(let i=0;i<14;i++){ const px=x-8+r()*16, py=y0-26+r()*18; g.beginPath(); g.moveTo(px,py); g.lineTo(px+1,py+3); g.stroke(); } break; }
    case 'herbsdry':{ g.strokeStyle='#8a7a5a'; g.lineWidth=0.8; g.beginPath(); g.moveTo(x-22,y0-32); g.quadraticCurveTo(x,y0-28,x+22,y0-32); g.stroke(); nail(x-22,y0-32); nail(x+22,y0-32); for(let i=0;i<5;i++){ const px=x-16+i*8, py=y0-30+Math.sin((i/4)*Math.PI)*3, c=r2pk(r,['#5a8a3a','#7a9a4a','#8a6ab8','#c8b040','#4e7a3a']); r2l(g,px,py,px,py+4,'#8a7a5a',0.7); g.fillStyle=c; g.beginPath(); g.moveTo(px-1.5,py+3); g.lineTo(px+1.5,py+3); g.lineTo(px+4,py+16); g.lineTo(px-4,py+16); g.closePath(); g.fill(); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(px,py+4,4,12); for(let k=0;k<4;k++) r2o(g,px-3+r()*6,py+8+r()*8,1.1,r2c(c,0.25)); g.fillStyle='#b8983a'; g.fillRect(px-2,py+3.5,4,1.2); } break; }
    case 'drawings':{ for(let i=0;i<2;i++){ const px=x-11+i*22, py=y0-14+(i?3:-2), rot=(r()-0.5)*0.3; paper(px,py,18,16,rot,'#f8f4ea'); g.save(); g.translate(px,py); g.rotate(rot); const kind=Math.floor(r()*3); if(kind===0){ r2o(g,-4,-3,3,'#f0c030'); g.strokeStyle='#f0c030'; g.lineWidth=0.7; for(let k=0;k<6;k++){ const a=k/6*TAU; g.beginPath(); g.moveTo(-4+Math.cos(a)*4,-3+Math.sin(a)*4); g.lineTo(-4+Math.cos(a)*6,-3+Math.sin(a)*6); g.stroke(); } r2rr(g,1,0,7,6,0,'#c84a3a'); g.fillStyle='#3a6ac8'; g.beginPath(); g.moveTo(0,0); g.lineTo(4.5,-4); g.lineTo(9,0); g.fill(); } else if(kind===1){ r2e(g,0,1,5,3,'#c8322a'); r2o(g,5,-1,2.4,'#c8322a'); g.fillStyle='#f08a2a'; g.beginPath(); g.moveTo(7,-1); g.lineTo(9.5,-2.5); g.lineTo(9.5,0.5); g.fill(); r2l(g,-5,1,-8,-2,'#c8322a',1); } else { g.strokeStyle='#3a3a3a'; g.lineWidth=0.7; for(const sx of [-4,3]){ g.beginPath(); g.arc(sx,-4,1.6,0,TAU); g.moveTo(sx,-2.4); g.lineTo(sx,2); g.moveTo(sx-2,0); g.lineTo(sx+2,0); g.moveTo(sx,2); g.lineTo(sx-1.5,5); g.moveTo(sx,2); g.lineTo(sx+1.5,5); g.stroke(); } r2o(g,0,-5,1,'#e84a8a'); } g.fillStyle='rgba(220,220,190,.7)'; g.fillRect(-2,-9,4,2); g.restore(); } break; }
    case 'pennant':{ g.strokeStyle='#5a4a3a'; g.lineWidth=0.7; g.beginPath(); g.moveTo(x-22,y0-32); g.quadraticCurveTo(x,y0-24,x+22,y0-32); g.stroke(); for(let i=0;i<6;i++){ const tt=(i+0.5)/6, px=lerp(x-22,x+22,tt), py=y0-32+(1-(2*tt-1)**2)*4; g.fillStyle=['#e84a4a','#f0c030','#4a8ae8','#4ac86a'][i%4]; g.beginPath(); g.moveTo(px-3,py); g.lineTo(px+3,py); g.lineTo(px,py+7); g.closePath(); g.fill(); } break; }
    case 'skeins':{ r2wood(g,x-20,y0-32,40,4,R.wood,r,4,1); for(let i=0;i<4;i++){ const px=x-14+i*9.5, c=r2pk(r,['#c84a6a','#4a8ac8','#e8b04a','#6ac84a','#8a4ac8','#efe6d6']); r2l(g,px,y0-28,px,y0-24,'#6a4a2a',1); r2rr(g,px-3.4,y0-25,6.8,20,3,c); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=0.5; for(let k=-2;k<=2;k++){ g.beginPath(); g.moveTo(px+k,y0-24); g.lineTo(px+k,y0-6); g.stroke(); } r2rr(g,px-3.6,y0-16,7.2,2.2,1,r2c(c,-0.25)); } break; }
    case 'fiddle':{ nail(x,y0-32); g.save(); g.translate(x,y0-13); g.rotate(0.15); r2e(g,1,2,6,10,'rgba(0,0,0,.25)'); g.fillStyle=r2lg(g,-6,0,6,0,'#c8783a','#8a4a1a'); g.beginPath(); g.ellipse(0,4,6,6,0,0,TAU); g.ellipse(0,-5,4.8,5,0,0,TAU); g.fill(); g.fillStyle='#2a1a10'; g.fillRect(-0.8,-20,1.6,16); r2rr(g,-1.6,-23,3.2,4,1,'#4a2a10'); g.strokeStyle='#1a0e06'; g.lineWidth=0.7; g.beginPath(); g.moveTo(-2.4,1); g.quadraticCurveTo(-3.6,-1,-2.4,-3); g.moveTo(2.4,1); g.quadraticCurveTo(3.6,-1,2.4,-3); g.stroke(); g.restore(); g.save(); g.translate(x+8,y0-14); g.rotate(-0.25); r2l(g,0,-16,0,14,'#6a4a2a',0.9); r2l(g,1.2,-15,1.2,13,'rgba(240,235,220,.8)',0.5); g.restore(); break; }
    case 'sheet':{ paper(x,y0-14,20,24,(r()-0.5)*0.12,'#f2ead8'); for(let j=0;j<3;j++){ for(let k=0;k<5;k++) r2l(g,x-8,y0-22+j*7+k*1.2,x+8,y0-22+j*7+k*1.2,'rgba(60,40,20,.35)',0.3); for(let n=0;n<4;n++) r2o(g,x-6+n*4,y0-21+j*7+((n*3+j)%4)*1.2,0.8,'#2a1a10'); } break; }
    case 'crest':{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(x-14,y0-30); g.lineTo(x+16,y0-30); g.lineTo(x+16,y0-12); g.quadraticCurveTo(x+16,y0,x+1,y0+5); g.quadraticCurveTo(x-14,y0,x-14,y0-12); g.fill(); g.fillStyle=r2lg(g,x-15,y0-31,x+15,y0,'#f0d070','#a8802a'); g.beginPath(); g.moveTo(x-15,y0-31); g.lineTo(x+15,y0-31); g.lineTo(x+15,y0-13); g.quadraticCurveTo(x+15,y0-1,x,y0+4); g.quadraticCurveTo(x-15,y0-1,x-15,y0-13); g.closePath(); g.fill(); g.fillStyle='#6a1a20'; g.beginPath(); g.moveTo(x-11,y0-27); g.lineTo(x+11,y0-27); g.lineTo(x+11,y0-14); g.quadraticCurveTo(x+11,y0-4,x,y0); g.quadraticCurveTo(x-11,y0-4,x-11,y0-14); g.closePath(); g.fill(); g.fillStyle='#2a1a10'; g.beginPath(); g.moveTo(x,y0-15); g.bezierCurveTo(x-3,y0-18,x-6,y0-18,x-9,y0-13); g.bezierCurveTo(x-6,y0-15,x-3,y0-14,x,y0-13); g.bezierCurveTo(x+3,y0-14,x+6,y0-15,x+9,y0-13); g.bezierCurveTo(x+6,y0-18,x+3,y0-18,x,y0-15); g.fill(); g.fillStyle='#f0d070'; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(x+i*5-2,y0-21); g.lineTo(x+i*5,y0-25); g.lineTo(x+i*5+2,y0-21); g.fill(); } break; }
    case 'tools':{ r2wood(g,x-20,y0-32,40,4,R.wood,r,4,1); r2l(g,x-12,y0-28,x-12,y0-4,'#7a5430',1.6); g.strokeStyle='#8a8a94'; g.lineWidth=1.8; g.beginPath(); g.arc(x-6,y0-6,6,Math.PI*0.9,Math.PI*1.8); g.stroke(); r2l(g,x+6,y0-28,x+6,y0-2,'#7a5430',1.6); g.strokeStyle='#8a8a94'; g.lineWidth=1; for(let k=-3;k<=3;k++){ g.beginPath(); g.moveTo(x+6+k*1.8,y0-4); g.lineTo(x+6+k*2.2,y0+2); g.stroke(); } r2l(g,x+1,y0-4,x+11,y0-4,'#8a8a94',1.4); break; }
  }
}

// ---------- cached room base
// objects that go into the cached room: anything with a static body that is not flagged live
function r2Bakes(o){ return !!FB[o.k]&&!o.live; }
function r2Base(A){
  const S=clamp(Math.ceil(DPR*zoom*2)/2,1,2), key=A.id+'|'+S+'|'+A.rw+'x'+A.rh+'|'+A.objs.length;
  if(A._r2key!==key){ A._r2key=key; for(const o of A.objs) o._r2b=r2Bakes(o); }
  if(A._base&&A._base.key===key) return A._base;
  let e=R2.base.find(q=>q.key===key);
  if(e){ A._base=e; if(R2.base[0]!==e){ R2.base.splice(R2.base.indexOf(e),1); R2.base.unshift(e); } return e; }
  const R=r2Room(A), bx=A.rx-34, by=A.ry-54, bw=A.rw+68, bh=A.rh+86;
  const cv=mkCanvas(bw*S,bh*S), g=cv.getContext('2d'); g.scale(S,S); g.translate(-bx,-by);
  R.baking=true; R.flames=[]; R.glows=[];
  r2Floor(g,R); r2Wall(g,R); r2Decor(g,R);
  const post=[], bake=(o)=>{ g.save(); try{ FB[o.k](g,o,R); }catch(err){ console.warn('furn',o.k,err); } g.restore(); };
  for(const o of A.objs){ if(!r2Bakes(o)) continue; if(o.k==='heights'){ post.push(o); continue; } bake(o); }
  r2Clutter(g,R,A); r2Frame(g,R); r2Mat(g,R); r2DecorPost(g,R); for(const o of post) bake(o);
  R.baking=false;
  e={key,cv,bx,by,bw,bh,flames:R.flames,glows:R.glows}; R2.base.unshift(e); if(R2.base.length>2) R2.base.length=2;
  A._base=e; return e;
}
// seeded floor clutter along the walls (walk-through, small), so rooms feel lived in
const R2CLUT={home:['plant','basket','boots','logs','broom','stool','crate'],ash:['logs','boots','basket','plant'],yara:['plant','basket','bookstack'],baker:['crate','basket','broom'],lamps:['crate','crate','broom'],inn:['crate','logs','broom','stool'],guard:['crate','boots','broom'],library:['plant','bookstack','plant','bookstack','globe'],tailor:['basket','plant','stool'],scholar:['bookstack','globe','plant'],mayor:['plant','globe','plant'],miner:['crate','boots','crate'],cook:['crate','basket','logs'],lodge:['logs','boots','logs'],hut:['basket','plant','logs'],farmer:['basket','crate','boots','broom'],kid:['ball','basket','stool'],knitter:['basket','plant','stool'],fiddler:['plant','stool','boots'],herbalist:['plant','basket','plant']};
function r2Clutter(g,R,A){
  const r=mulberry32((hash2(R.seed,909)*4294967295)|0), list=(R2CLUT[R.st]||R2CLUT.home).slice(), {x0,y0,W,H}=R;
  const spots=[[x0+18,y0+52],[x0+W-18,y0+52],[x0+18,y0+H-18],[x0+W-18,y0+H-18],[x0+18,y0+H*0.5],[x0+W-18,y0+H*0.5],[x0+W*0.35,y0+46],[x0+W*0.65,y0+46],[x0+18,y0+H*0.72],[x0+W-18,y0+H*0.3]];
  for(let i=spots.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [spots[i],spots[j]]=[spots[j],spots[i]]; }
  const fp=o=>o.w?[o.w/2,(o.h||o.w)/2]:[o.r||16,o.r||16], used=[]; let n=0; const maxN=2+Math.floor(r()*2)+(W>600?1:0);
  for(const [sx,sy] of spots){ if(n>=maxN||!list.length) break;
    if(Math.abs(sx-(x0+W/2))<70&&sy>y0+H-80) continue;
    let ok=true; for(const o of A.objs){ if(o.k==='window'||o.k==='painting'||o.k==='portraits'||o.k==='rug'||o.k==='heights') continue; const [hw,hh]=fp(o); if(Math.abs(sx-o.x)<hw+20&&Math.abs(sy-o.y)<hh+20){ ok=false; break; } }
    for(const u of used) if(dist2(u[0],u[1],sx,sy)<50*50) ok=false;
    if(!ok) continue; const k=list.splice(Math.floor(r()*list.length),1)[0]; used.push([sx,sy]); n++; r2Clut1(g,k,sx,sy,R,r); }
}
function r2Clut1(g,k,x,y,R,r){
  const fab=R.fab;
  if(k==='plant'){ r2shC(g,x,y+3,10,6,0.25); g.fillStyle=r2lg(g,x-9,0,x+9,0,'#c87a4a','#a85a3a','#6a3a1e'); g.beginPath(); g.moveTo(x-9,y-3); g.lineTo(x+9,y-3); g.lineTo(x+7,y+9); g.lineTo(x-7,y+9); g.closePath(); g.fill(); r2e(g,x,y-3,9.6,3.4,'#b86a40'); r2e(g,x,y-3,7.6,2.4,'#3a2414'); const big=r()<0.5; for(let i=0;i<(big?7:11);i++){ const a=-Math.PI/2+(i/(big?6:10)-0.5)*2.6, L=big?14+r()*6:10+r()*8; g.save(); g.translate(x,y-4); g.rotate(a); r2e(g,L*0.5,0,L*0.55,big?5:2.4,i%2?'#3e7a34':'#4e8e40'); if(big){ g.strokeStyle='rgba(20,50,15,.5)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(1,0); g.lineTo(L,0); g.stroke(); } g.restore(); } return; }
  if(k==='basket'){ r2shC(g,x,y+2,11,6,0.25); g.fillStyle='#a07a4a'; g.beginPath(); g.ellipse(x,y+2,11,7,0,0,TAU); g.fill(); g.strokeStyle='rgba(60,40,15,.5)'; g.lineWidth=0.6; for(let k2=-9;k2<=9;k2+=3){ g.beginPath(); g.moveTo(x+k2,y-3); g.lineTo(x+k2*1.05,y+8); g.stroke(); } r2e(g,x,y-1,9.4,4.6,'#5a3a1e'); const what=Math.floor(r()*4); for(let i=0;i<5;i++){ const bx=x-6+i*3, by=y-2+(i%2)*1.5; if(what===0) r2o(g,bx,by,2.6,i%2?'#c8322a':'#7ab03a'); else if(what===1) r2e(g,bx,by,2.4,1.8,'#f4ecd8'); else if(what===2) r2e(g,bx,by,3,1.6,'#d89a50'); else r2e(g,bx,by-0.5,2.4,1.6,r2pk(r,fab)); } g.strokeStyle='#8a6a3a'; g.lineWidth=1.2; g.beginPath(); g.ellipse(x,y-2,10,6,0,Math.PI*1.05,Math.PI*1.95); g.stroke(); return; }
  if(k==='boots'){ for(const s of [-1,1]){ const bx=x+s*4.5; r2rr(g,bx-3+1,y-6+1.5,6,13,2.5,'rgba(0,0,0,.25)'); r2rr(g,bx-3,y-6,6,13,2.6,'#5a3a20'); r2e(g,bx,y+5,3.4,2.6,'#4a2e18'); r2e(g,bx,y-5,2.6,1.4,'#2a1a10'); g.fillStyle='rgba(255,230,190,.2)'; g.fillRect(bx-2.4,y-4,1,9); } return; }
  if(k==='logs'){ r2shC(g,x,y+2,13,7,0.25); for(const [lx,ly] of [[-6,3],[6,3],[0,-3],[-12,3],[12,3]].slice(0,3+Math.floor(r()*3))){ r2o(g,x+lx,y+ly,5.4,'#6a4428'); r2o(g,x+lx,y+ly,4.2,'#c8a070'); g.strokeStyle='rgba(90,60,30,.6)'; g.lineWidth=0.5; g.beginPath(); g.arc(x+lx,y+ly,2.6,0,TAU); g.stroke(); g.beginPath(); g.arc(x+lx,y+ly,1.2,0,TAU); g.stroke(); } return; }
  if(k==='broom'){ const s=x<R.x0+R.W/2?1:-1; g.save(); g.translate(x-s*8,y); g.rotate(s*0.12); r2l(g,0,-24,0,6,'#a07a4a',1.8); g.fillStyle='#d8b860'; g.beginPath(); g.moveTo(-3,4); g.lineTo(3,4); g.lineTo(6,16); g.lineTo(-6,16); g.closePath(); g.fill(); g.strokeStyle='rgba(120,90,30,.6)'; g.lineWidth=0.5; for(let k2=-4;k2<=4;k2+=2){ g.beginPath(); g.moveTo(k2*0.6,5); g.lineTo(k2,16); g.stroke(); } r2rr(g,-3.4,3,6.8,2,1,'#8a2e22'); g.restore(); return; }
  if(k==='stool'){ r2shC(g,x,y+2,9,6,0.25); for(const [lx,ly] of [[-5,4],[5,4],[0,-4]]) r2l(g,x,y,x+lx*1.2,y+ly*1.2+4,'#4a2e18',1.6); r2o(g,x,y,8,r2c(R.wood,-0.2)); r2o(g,x,y-0.6,7,r2c(R.wood,0.1)); r2o(g,x-2,y-2.6,2.4,'rgba(255,240,210,.2)'); return; }
  if(k==='crate'){ r2sh(g,x-11,y-10,22,20,1,0.25); r2rr(g,x-11,y-10,22,20,1,'#7a5434'); r2rr(g,x-9,y-8,18,16,0,'#9a7044'); g.fillStyle='rgba(60,35,15,.45)'; for(let k2=-4;k2<=4;k2+=4) g.fillRect(x-9,y+k2,18,0.8); g.strokeStyle='#6a4428'; g.lineWidth=2; g.beginPath(); g.moveTo(x-9,y-8); g.lineTo(x+9,y+8); g.stroke(); g.fillStyle='rgba(255,240,210,.18)'; g.fillRect(x-11,y-10,22,1); if(r()<0.6){ for(let i=0;i<4;i++) r2o(g,x-5+i*3.4,y-9,2.6,r2pk(r,['#c8322a','#f08a2a','#7ab03a','#e8c040','#8a5a3a'])); } return; }
  if(k==='bookstack'){ for(let i=0;i<4;i++){ const bw=16-i*1.5+r()*2; g.save(); g.translate(x,y-i*3); g.rotate((r()-0.5)*0.4); r2rr(g,-bw/2+1,-3+1,bw,6,1,'rgba(0,0,0,.25)'); r2rr(g,-bw/2,-3,bw,6,1,r2pk(r,R2BOOK)); g.fillStyle='#efe6d0'; g.fillRect(-bw/2+1,1.5,bw-2,1.2); g.restore(); } return; }
  if(k==='globe'){ r2shC(g,x,y+4,8,4,0.25); r2l(g,x,y+8,x,y-2,'#6a4428',1.6); r2e(g,x,y+8,6,2,'#4a2e18'); r2o(g,x,y-8,7.4,'#3a6a9a'); r2e(g,x-2,y-10,3,2,'#5aa04a'); r2e(g,x+3,y-6,2.4,1.6,'#5aa04a'); g.strokeStyle='#d8b04a'; g.lineWidth=1; g.beginPath(); g.arc(x,y-8,8.6,Math.PI*0.6,Math.PI*1.9); g.stroke(); r2o(g,x-2.6,y-10.6,1.6,'rgba(255,255,255,.4)'); return; }
  if(k==='ball'){ r2shC(g,x,y+2,7,4,0.25); r2o(g,x,y,6.4,'#e84a4a'); g.fillStyle='#f4f0e6'; g.beginPath(); g.arc(x,y,6.4,-0.4,0.9); g.lineTo(x,y); g.fill(); g.fillStyle='#3a6ac8'; g.beginPath(); g.arc(x,y,6.4,2.2,3.4); g.lineTo(x,y); g.fill(); r2o(g,x-2,y-2.4,1.8,'rgba(255,255,255,.5)'); return; }
}
// candle flames: recorded while baking (drawn live each frame), drawn straight away otherwise
function r2Glow(R,x,y,r,col,a){ if(R&&R.baking) R.glows.push({x,y,r,col,a}); else glowAt(x,y,r,col,a); }
function r2Flame(g,R,x,y,s){ if(R&&R.baking){ R.flames.push({x,y,s:s||1}); return; } r2FlameLive(x,y,s||1,G?G.time:0,x*0.37+y); }
function r2FlameLive(x,y,s,t,ph){ const f=1+0.16*Math.sin(t*13+ph)+0.1*Math.sin(t*29+ph*1.7), h=5.5*s*f, w=1.9*s, sw=Math.sin(t*7+ph)*0.6*s;
  ctx.fillStyle='rgba(255,120,30,.75)'; r2tear(ctx,x+sw*0.5,y+0.5,w*1.35,h*1.15); ctx.fillStyle='#ffc860'; r2tear(ctx,x+sw*0.3,y,w,h); ctx.fillStyle='#fff6d6'; r2tear(ctx,x,y,w*0.5,h*0.5); }
function r2Window(o){ return o.k==='window'&&!o._hid; }
// sky colours by time of day for the windows
function r2Sky(){ const t=G?G.tod:0.35, d=daylight(), w=clamp(1-Math.min(Math.abs(t-0.25),Math.abs(t-0.75))/0.08,0,1);
  let top=mixRGB([16,22,52],[96,160,232],d), bot=mixRGB([34,44,86],[186,222,252],d); top=mixRGB(top,[150,100,160],w*0.6); bot=mixRGB(bot,[255,170,110],w*0.85);
  return {top:`rgb(${top.map(Math.round)})`,bot:`rgb(${bot.map(Math.round)})`,d,w}; }
function r2LightSpr(){
  if(R2.lp) return R2.lp; const w=150,h=200, mk=(col)=>{ const c=mkCanvas(w,h), g=c.getContext('2d');
    for(let i=0;i<14;i++){ const k=i*1.9-6; g.fillStyle=`rgba(${col},.05)`; g.beginPath(); g.moveTo(50+k,0); g.lineTo(100-k,0); g.lineTo(142-k,h-k*1.4); g.lineTo(58+k,h-k*1.4); g.closePath(); g.fill(); }
    g.globalCompositeOperation='destination-out';
    for(let i=0;i<3;i++){ g.fillStyle='rgba(0,0,0,.12)'; const s=1+i*1.6; g.beginPath(); g.moveTo(75-s,0); g.lineTo(75+s,0); g.lineTo(101+s*1.5,h); g.lineTo(101-s*1.5,h); g.closePath(); g.fill(); g.beginPath(); g.moveTo(52,h*0.4-s); g.lineTo(122,h*0.4-s); g.lineTo(122,h*0.4+s*1.6); g.lineTo(52,h*0.4+s*1.6); g.closePath(); g.fill(); }
    const fade=g.createLinearGradient(0,0,0,h); fade.addColorStop(0,'rgba(0,0,0,.2)'); fade.addColorStop(0.12,'rgba(0,0,0,0)'); fade.addColorStop(0.6,'rgba(0,0,0,.25)'); fade.addColorStop(1,'rgba(0,0,0,1)'); g.fillStyle=fade; g.fillRect(0,0,w,h); return c; };
  R2.lp={day:mk('255,236,196'),dusk:mk('255,170,100'),moon:mk('150,175,255')}; return R2.lp;
}
function drawAreaBase(){
  const A=AREA;
  ctx.fillStyle='#050403'; ctx.fillRect(A.x0-800,A.y0-800,(A.x1-A.x0)+1600,(A.y1-A.y0)+1600);
  if(A.kind==='cave'){ ctx.drawImage(A.canvas,A.x0,A.y0,A.canvas.width/A.canvasS,A.canvas.height/A.canvasS); return; }
  const R=r2Room(A), e=r2Base(A), t=G.time, sky=r2Sky();
  A._bk=true;
  if(!A._r2L){ A._r2L=[]; for(const f of e.flames.slice(0,4)){ const L={x:f.x,y:f.y+6,r:110,i:0,fire:true}; A.lights.push(L); A._r2L.push(L); } }
  // window skies show through holes in the cached wall
  for(const o of A.objs){ if(!r2Window(o)) continue; const ww=o._ww, gx=o.x-ww-1, gy=o.y-44, gh=34; ctx.fillStyle=r2lg(ctx,0,gy,0,gy+gh,sky.top,sky.bot); ctx.fillRect(gx,gy,ww*2+2,gh);
    if(sky.d<0.35){ ctx.fillStyle=`rgba(255,250,220,${0.8*(1-sky.d*2.5)})`; for(let i=0;i<4;i++){ const sx=o.x-ww+((i*37+o.x*3)%(ww*2)), sy=gy+3+((i*23+o.x)%16); ctx.fillRect(sx,sy,1.2,1.2); } if(o===A.objs.find(r2Window)){ ctx.fillStyle='#f4eed8'; ctx.beginPath(); ctx.arc(o.x+ww*0.45,gy+9,4.2,0,TAU); ctx.fill(); ctx.fillStyle=sky.top; ctx.beginPath(); ctx.arc(o.x+ww*0.45+2.2,gy+7.6,3.6,0,TAU); ctx.fill(); } }
    else { ctx.fillStyle=`rgba(255,255,255,${0.6*sky.d})`; const cx=o.x-ww+(((t*2+o.x)%(ww*2+30))-15); ctx.beginPath(); ctx.ellipse(cx,gy+10,7,2.6,0,0,TAU); ctx.ellipse(cx+5,gy+8.5,4.5,2.4,0,0,TAU); ctx.fill(); } }
  ctx.drawImage(e.cv,e.bx,e.by,e.bw,e.bh);
  // light falling through the windows and the doorway
  const lp=r2LightSpr(), pa=ctx.globalAlpha, pc=ctx.globalCompositeOperation; ctx.globalCompositeOperation='lighter';
  for(const o of A.objs){ if(!r2Window(o)) continue; const sc=o._ww<20?0.6:1, lx=o.x-75*sc, ly=A.ry+34;
    if(sky.d>0.02){ ctx.globalAlpha=pa*0.45*sky.d*(1-sky.w*0.6); ctx.drawImage(lp.day,lx,ly,150*sc,200); if(sky.w>0.05){ ctx.globalAlpha=pa*0.5*sky.w; ctx.drawImage(lp.dusk,lx,ly,150*sc,200); } }
    else { ctx.globalAlpha=pa*0.28; ctx.drawImage(lp.moon,lx,ly,150*sc,200); } }
  ctx.globalAlpha=pa; ctx.globalCompositeOperation=pc;
  const dl=sky.d, doorC=dl>0.2?'255,226,170':'140,160,230'; glowAt(A.rx+A.rw/2,A.ry+A.rh+10,58,doorC,0.10+0.16*dl);
  // candles and lamps recorded in the cached room
  const night=dl<0.6;
  for(const L of A._r2L) L.i=night?0.5:0;
  for(const f of e.flames){ if(!night&&f.s<1.2&&!R.S0.lampsOn&&R.st!=='lamps') { ctx.fillStyle='rgba(60,40,20,.8)'; ctx.fillRect(f.x-0.4,f.y-2,0.8,2); continue; } r2FlameLive(f.x,f.y,f.s,t,f.x*0.37+f.y); glowAt(f.x,f.y-3,16*f.s,'255,190,110',night?0.45:0.25); }
  for(const q of e.glows) glowAt(q.x,q.y,q.r*(1+0.04*Math.sin(t*5+q.x)),q.col,q.a*(night?1.25:0.8));
}

// ---------- furniture: FB draws the static body (cached), FL draws the live part every frame
const FB={}, FL={};
FB.rug=(g,o,R)=>{
  const w=o.w,h=o.h,x=o.x-w/2,y=o.y-h/2, c=R.rug.c, p=R.rugP, r=r2rng(o,2);
  if(p==='braid'){ r2e(g,o.x+2,o.y+3,w/2+1,h/2+1,'rgba(0,0,0,.25)'); const n=Math.floor(Math.min(w,h)/2/5); for(let k=0;k<n;k++){ const rx=w/2-k*5, ry=h/2-k*5*(h/w); if(ry<2) break; r2e(g,o.x,o.y,rx,Math.max(2,h/2-k*5),r2c(c[[0,1,3,0,4,1][k%6]],(r()-0.5)*0.1)); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=0.7; g.setLineDash([2,2]); g.beginPath(); g.ellipse(o.x,o.y,Math.max(1,rx-2.5),Math.max(1,h/2-k*5-2.5),0,0,TAU); g.stroke(); g.setLineDash([]); } return; }
  r2rr(g,x+2,y+3,w,h,4,'rgba(0,0,0,.22)');
  g.save(); rrect(g,x,y,w,h,3); g.clip(); g.fillStyle=c[0]; g.fillRect(x,y,w,h);
  if(p==='play'){ g.fillStyle='#5aa04a'; g.fillRect(x,y,w,h); g.strokeStyle='#5a5a5a'; g.lineWidth=12; g.beginPath(); g.moveTo(x+20,y+h-18); g.lineTo(x+20,y+20); g.lineTo(x+w-24,y+20); g.lineTo(x+w-24,y+h-18); g.closePath(); g.stroke(); g.strokeStyle='#f0e8c0'; g.lineWidth=1.2; g.setLineDash([5,5]); g.stroke(); g.setLineDash([]); for(let i=0;i<3;i++){ const hx=x+w*0.36+i*16, hy=y+h*0.48; r2rr(g,hx,hy-7,12,14,1,'#e8dcc0'); g.fillStyle='#3a3a3a'; g.font=`900 7px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(i+1),hx+6,hy); } r2o(g,x+w*0.75,y+h*0.6,6,'#3a6ac8'); r2o(g,x+w*0.25,y+h*0.45,5,'#c84a3a'); }
  else if(p==='stripe'){ let yy=y, i=0; while(yy<y+h){ const sh=[10,4,6,3,8,4][i%6]; g.fillStyle=r2c(c[[0,3,1,4,0,3][i%6]],(r()-0.5)*0.12); g.fillRect(x,yy,w,sh); yy+=sh; i++; } }
  else if(p==='check'){ const s=16; for(let j=0;j*s<h;j++) for(let i=0;i*s<w;i++){ if((i+j)%2){ g.fillStyle=r2a(c[3],0.55); g.fillRect(x+i*s,y+j*s,s,s); } } g.fillStyle=r2a(c[1],0.35); for(let i=0;i*s<w;i++) g.fillRect(x+i*s+s/2-1,y,2,h); for(let j=0;j*s<h;j++) g.fillRect(x,y+j*s+s/2-1,w,2); }
  else { // persian / kilim: border band and a centre motif
    const b=Math.min(14,h*0.18); g.fillStyle=c[2]; g.fillRect(x,y,w,h); g.fillStyle=c[0]; g.fillRect(x+b,y+b,w-b*2,h-b*2);
    g.fillStyle=c[3]; for(let xx=x+6;xx<x+w-4;xx+=10){ for(const yy of [y+b/2,y+h-b/2]){ g.beginPath(); g.moveTo(xx,yy-3); g.lineTo(xx+3,yy); g.lineTo(xx,yy+3); g.lineTo(xx-3,yy); g.fill(); } } for(let yy=y+b+6;yy<y+h-b-2;yy+=10){ for(const xx of [x+b/2,x+w-b/2]){ g.beginPath(); g.moveTo(xx,yy-3); g.lineTo(xx+3,yy); g.lineTo(xx,yy+3); g.lineTo(xx-3,yy); g.fill(); } }
    g.strokeStyle=c[1]; g.lineWidth=1.6; g.strokeRect(x+b+3,y+b+3,w-b*2-6,h-b*2-6);
    if(p==='kilim'){ for(let xx=x+b+14;xx<x+w-b-6;xx+=24){ const cy=o.y; for(let s=12;s>0;s-=4){ g.fillStyle=[c[1],c[3],c[4]][(s/4)%3]; g.beginPath(); g.moveTo(xx,cy-s); g.lineTo(xx+s*0.8,cy); g.lineTo(xx,cy+s); g.lineTo(xx-s*0.8,cy); g.fill(); } } }
    else { const mw=Math.min(w*0.32,70), mh=Math.min(h*0.36,40); for(let k=0;k<4;k++){ const s=1-k*0.24; g.fillStyle=[c[1],c[2],c[3],c[4]][k]; g.beginPath(); g.moveTo(o.x,o.y-mh*s); g.quadraticCurveTo(o.x+mw*0.3*s,o.y-mh*0.3*s,o.x+mw*s,o.y); g.quadraticCurveTo(o.x+mw*0.3*s,o.y+mh*0.3*s,o.x,o.y+mh*s); g.quadraticCurveTo(o.x-mw*0.3*s,o.y+mh*0.3*s,o.x-mw*s,o.y); g.quadraticCurveTo(o.x-mw*0.3*s,o.y-mh*0.3*s,o.x,o.y-mh*s); g.fill(); }
      for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const cx=o.x+sx*(w/2-b-12), cy=o.y+sy*(h/2-b-10); g.fillStyle=c[1]; g.beginPath(); g.moveTo(cx,cy-6); g.lineTo(cx+6,cy); g.lineTo(cx,cy+6); g.lineTo(cx-6,cy); g.fill(); r2o(g,cx,cy,2,c[3]); } }
  }
  for(let i=0;i<w*h/60;i++){ g.fillStyle=r()<0.5?'rgba(0,0,0,.06)':'rgba(255,255,255,.05)'; g.fillRect(x+r()*w,y+r()*h,1.2,1.2); }
  g.fillStyle=r2lg(g,x,y,x+w,y+h,'rgba(255,240,210,.10)','rgba(0,0,0,0)','rgba(0,0,0,.14)'); g.fillRect(x,y,w,h);
  g.restore();
  if(p!=='play'){ g.strokeStyle=r2a(c[3],0.85); g.lineWidth=0.8; for(let yy=y+2;yy<y+h-1;yy+=2.4){ g.beginPath(); g.moveTo(x,yy); g.lineTo(x-4,yy+0.5); g.moveTo(x+w,yy); g.lineTo(x+w+4,yy+0.5); g.stroke(); } }
};
FB.window=(g,o,R)=>{
  if(o._hid) return;
  const x=o.x, ww=o._ww, gy0=o.y-44, gy1=o.y-10, fc=R.frame, arch=R.arch&&ww>=20;
  const glass=()=>{ g.beginPath(); if(arch){ g.moveTo(x-ww,gy1); g.lineTo(x-ww,gy0+ww); g.arc(x,gy0+ww,ww,Math.PI,TAU); g.lineTo(x+ww,gy1); g.closePath(); } else g.rect(x-ww,gy0,ww*2,gy1-gy0); };
  if(o._cur){ const cc=R.curtain; r2l(g,x-37,gy0-6,x+37,gy0-6,'#3a2414',2); r2o(g,x-37,gy0-6,2.2,'#6a4428'); r2o(g,x+37,gy0-6,2.2,'#6a4428');
    for(const s of [-1,1]){ const ox=x+s*(ww+4); g.fillStyle=cc; g.beginPath(); g.moveTo(ox,gy0-5); g.lineTo(ox+s*11,gy0-5); g.quadraticCurveTo(ox+s*9,gy0+12,ox+s*12,gy1+12); g.lineTo(ox+s*4,gy1+12); g.quadraticCurveTo(ox+s*1,gy0+16,ox+s*3,gy0+12); g.quadraticCurveTo(ox,gy0+6,ox,gy0-5); g.closePath(); g.fill(); g.fillStyle='rgba(0,0,0,.2)'; for(let k=0;k<3;k++) g.fillRect(ox+s*(3+k*3),gy0-4,1.2,gy1-gy0+14); g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(ox+s*2,gy0-4,1.4,14); r2rr(g,ox+s*(s>0?2:11)-(s>0?0:0),gy0+11,9,2.4,1,r2c(cc,-0.3)); } }
  g.fillStyle='rgba(0,0,0,.35)'; g.save(); g.translate(2,2); glass(); g.lineWidth=8; g.strokeStyle='rgba(0,0,0,.3)'; g.stroke(); g.restore();
  g.lineWidth=7; g.strokeStyle=fc; glass(); g.stroke(); g.lineWidth=1; g.strokeStyle='rgba(255,240,210,.25)'; g.save(); g.translate(-2,-2); glass(); g.stroke(); g.restore();
  g.save(); g.globalCompositeOperation='destination-out'; glass(); g.fill(); g.restore();
  g.save(); glass(); g.clip(); g.fillStyle='rgba(255,255,255,.13)'; g.beginPath(); g.moveTo(x-ww,gy0+12); g.lineTo(x-ww+10,gy0); g.lineTo(x-ww+16,gy0); g.lineTo(x-ww,gy0+20); g.fill(); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x-ww,gy0,ww*2,2.5); g.fillRect(x-ww,gy0,2.5,gy1-gy0); g.restore();
  g.fillStyle=fc; g.fillRect(x-1.4,gy0,2.8,gy1-gy0); g.fillRect(x-ww,(gy0+gy1)/2-1.2,ww*2,2.4);
  r2rr(g,x-ww-6,gy1+3,ww*2+12,4,1,r2c(fc==='#e8e0d0'?'#c8c0b0':'#6a4428',0.1)); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x-ww-5,gy1+7,ww*2+10,1.5);
  if(R.flowers&&ww>=20&&R.st!=='guard'&&R.st!=='miner'){ const r=r2rng(o,4); r2rr(g,x-ww+2,gy1-3,ww*2-4,6,1,'#a85a3a'); for(let i=0;i<7;i++){ const fx=x-ww+6+i*((ww*2-12)/6); r2e(g,fx,gy1-4,2.6,1.6,'#4e8240',r()); r2o(g,fx+(r()-0.5)*2,gy1-6-r()*2,1.6,r2pk(r,['#e84a4a','#f0c030','#e86ab0','#f4f0e8'])); } }
};
FB.bed=(g,o,R)=>{
  const w=o.w,h=o.h,x=o.x-w/2,y=o.y-h/2, r=r2rng(o,1), wd=R.wood, fab=R.fab;
  r2sh(g,x,y,w,h,5,0.3);
  r2rr(g,x,y+3,w,h-3,4,r2c(wd,-0.35)); r2rr(g,x+1,y+4,w-2,h-6,3,r2c(wd,-0.05));
  r2rr(g,x+4,y+11,w-8,h-18,4,'#e6ddcb');
  const pil=(px,py,pw,ph)=>{ r2rr(g,px+1,py+2,pw,ph,5,'rgba(0,0,0,.18)'); g.fillStyle=r2lg(g,0,py,0,py+ph,'#fffaf0','#d8cfbc'); rrect(g,px,py,pw,ph,5); g.fill(); g.strokeStyle='rgba(120,100,80,.3)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(px+4,py+ph/2); g.quadraticCurveTo(px+pw/2,py+ph/2+2,px+pw-4,py+ph/2); g.stroke(); };
  if(w>=58&&r()<0.45&&!o.inn){ pil(x+6,y+13,w/2-8,13); pil(x+w/2+2,y+13,w/2-8,13); } else pil(x+7,y+13,w-14,14);
  const by=y+33, bh=h-39;
  let cols, pat;
  if(o.home){ cols=['#c8402a','#e8902a','#8a2418','#f0c060']; pat='quilt'; } else if(o.mom){ cols=['#6a4a8a','#8a6aaa','#4a3266','#e8dcc0']; pat='plain'; } else if(o.inn){ cols=['#3a5a8a','#efe6d6','#2a4068','#c8a040']; pat='stripe'; }
  else { const i=Math.floor(r()*5); cols=[fab[i],fab[(i+1)%5],r2c(fab[i],-0.3),fab[(i+3)%5]]; pat=r2pk(r,['quilt','stripe','plaid','star','zig','quilt']); }
  g.save(); rrect(g,x+2,by,w-4,bh,4); g.clip(); r2Pat(g,pat,x+2,by,w-4,bh,cols,r);
  g.fillStyle='rgba(255,255,255,.07)'; for(let k=0;k<3;k++) g.fillRect(x+8+k*(w/3),by,3,bh);
  g.fillStyle=r2lg(g,x,0,x+w,0,'rgba(255,255,255,.12)','rgba(0,0,0,0)','rgba(0,0,0,.18)'); g.fillRect(x,by,w,bh); g.restore();
  r2rr(g,x+2,by-4,w-4,7,2,'#f4eee2'); g.fillStyle='rgba(0,0,0,.14)'; g.fillRect(x+3,by+3,w-6,1.6); g.fillStyle='rgba(120,100,80,.25)'; g.fillRect(x+3,by-1,w-6,0.8);
  // headboard and footboard
  g.fillStyle=r2lg(g,0,y-3,0,y+11,r2c(wd,0.18),r2c(wd,-0.2)); g.beginPath(); g.moveTo(x+1,y+11); g.lineTo(x+1,y+2); g.quadraticCurveTo(o.x,y-6,x+w-1,y+2); g.lineTo(x+w-1,y+11); g.closePath(); g.fill(); g.strokeStyle='rgba(0,0,0,.3)'; g.lineWidth=0.8; g.stroke(); g.fillStyle='rgba(255,240,210,.2)'; g.beginPath(); g.moveTo(x+4,y+2); g.quadraticCurveTo(o.x,y-4.5,x+w-4,y+2); g.lineTo(x+w-4,y+3); g.quadraticCurveTo(o.x,y-3,x+4,y+3); g.fill();
  for(let k=1;k<4;k++) r2l(g,x+k*w/4,y+1,x+k*w/4,y+10,'rgba(0,0,0,.18)',0.8);
  r2rr(g,x,y+h-6,w,6,2,r2c(wd,-0.12)); g.fillStyle='rgba(255,240,210,.2)'; g.fillRect(x+2,y+h-6,w-4,1);
  for(const px of [x+3,x+w-3]) for(const py of [y+3,y+h-3]){ r2o(g,px,py,3.4,r2c(wd,-0.3)); r2o(g,px-0.6,py-0.6,2.2,r2c(wd,0.15)); }
  if(o.home){ const sx=x+w*0.62, sy=by+bh*0.45; r2e(g,sx,sy,7,5,'rgba(40,16,8,.75)',0.4); r2e(g,sx+1,sy-1,4,3,'rgba(20,8,4,.8)',0.4); g.strokeStyle='rgba(255,140,40,.55)'; g.lineWidth=0.8; g.beginPath(); g.ellipse(sx,sy,7.5,5.4,0.4,0,TAU); g.stroke(); r2Toy(g,x+w*0.3,y+21,0.8); }
  else if(o.mom){ for(let k=0;k<3;k++){ r2rr(g,x+6,y+h-20+k*3.4,w-12,3.4,1,k%2?'#e8dcc0':'#8a6aaa'); } g.fillStyle='rgba(0,0,0,.15)'; g.fillRect(x+6,y+h-9.8,w-12,1); }
  else if(o.inn){ r2rr(g,x+8,y+h-20,w-16,9,2,'#f4f0e6'); g.fillStyle='rgba(58,90,138,.5)'; g.fillRect(x+8,y+h-15,w-16,1.5); r2o(g,o.x,y+21,2,'#6ac88a'); }
  else if(r()<0.4){ const bx=x+w*0.25+r()*w*0.4, byy=by+bh*0.55; g.save(); g.translate(bx,byy); g.rotate((r()-0.5)*0.8); r2rr(g,-6,-4,12,8,1,'rgba(0,0,0,.25)'); r2rr(g,-6.5,-4.5,12,8,1,r2pk(r,R2BOOK)); g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(-6.5,-4.5,12,1.2); g.restore(); }
};
function r2Pat(g,p,x,y,w,h,c,r){
  g.fillStyle=c[0]; g.fillRect(x,y,w,h);
  if(p==='quilt'){ const s=Math.max(7,Math.round(w/7)); for(let yy=y;yy<y+h;yy+=s) for(let xx=x;xx<x+w;xx+=s){ g.fillStyle=c[Math.floor(r()*3)]; g.fillRect(xx,yy,s,s); if(r()<0.3){ g.fillStyle=c[3]; g.beginPath(); g.moveTo(xx,yy); g.lineTo(xx+s,yy); g.lineTo(xx,yy+s); g.fill(); } } g.strokeStyle='rgba(255,255,255,.28)'; g.lineWidth=0.6; g.setLineDash([1.4,1.4]); for(let xx=x;xx<x+w;xx+=s){ g.beginPath(); g.moveTo(xx,y); g.lineTo(xx,y+h); g.stroke(); } for(let yy=y;yy<y+h;yy+=s){ g.beginPath(); g.moveTo(x,yy); g.lineTo(x+w,yy); g.stroke(); } g.setLineDash([]); }
  else if(p==='stripe'){ let yy=y, i=0; while(yy<y+h){ const sh=[7,3,2,3][i%4]; g.fillStyle=c[[0,3,1,3][i%4]]; g.fillRect(x,yy,w,sh); yy+=sh; i++; } }
  else if(p==='plaid'){ g.globalAlpha=0.5; for(let xx=x+2;xx<x+w;xx+=12){ g.fillStyle=c[1]; g.fillRect(xx,y,5,h); g.fillStyle=c[3]; g.fillRect(xx+6.5,y,1,h); } for(let yy=y+2;yy<y+h;yy+=12){ g.fillStyle=c[1]; g.fillRect(x,yy,w,5); g.fillStyle=c[3]; g.fillRect(x,yy+6.5,w,1); } g.globalAlpha=1; }
  else if(p==='star'){ g.strokeStyle=c[1]; g.lineWidth=4; g.strokeRect(x+3,y+3,w-6,h-6); const cx=x+w/2, cy=y+h/2, s=Math.min(w,h)*0.3; g.fillStyle=c[3]; g.save(); g.translate(cx,cy); for(let k=0;k<2;k++){ g.rotate(Math.PI/4); g.fillRect(-s/2,-s/2,s,s); } g.restore(); r2o(g,cx,cy,s*0.25,c[1]); }
  else if(p==='zig'){ for(let yy=y+4,i=0;yy<y+h;yy+=7,i++){ g.strokeStyle=i%2?c[1]:c[3]; g.lineWidth=2; g.beginPath(); for(let xx=x;xx<=x+w+6;xx+=6) g.lineTo(xx,yy+((xx-x)/6%2?3:0)); g.stroke(); } }
}
function r2Toy(g,x,y,s){ g.save(); g.translate(x,y); g.scale(s,s); r2e(g,0,0,6,3.6,'#4e9a4a'); r2o(g,5.5,-2,2.8,'#4e9a4a'); g.fillStyle='#f0c040'; g.beginPath(); g.moveTo(-2,-3); g.lineTo(0,-6); g.lineTo(2,-3); g.fill(); r2o(g,6.4,-2.6,0.7,'#1a1a1a'); r2l(g,-6,0,-9,-2,'#4e9a4a',1.6); g.restore(); }
FB.bunk=(g,o,R)=>{
  const x=o.x-31,y=o.y-50,w=62,h=100, r=r2rng(o,3), wd=R.wood, fab=R.fab, i=Math.floor(r()*5);
  r2sh(g,x,y,w,h,4,0.32);
  r2rr(g,x+3,y+h-14,w-6,12,2,r2c(fab[(i+2)%5],-0.25)); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+3,y+h-14,w-6,3);
  r2rr(g,x,y,w,h-12,3,r2c(wd,-0.3)); r2rr(g,x+3,y+6,w-6,h-22,3,'#e6ddcb');
  r2rr(g,x+6,y+8,w-12,13,5,'#f6f0e4'); g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(x+7,y+19,w-14,2);
  g.save(); rrect(g,x+3,y+25,w-6,h-41,3); g.clip(); r2Pat(g,r2pk(r,['stripe','plaid','quilt']),x+3,y+25,w-6,h-41,[fab[i],fab[(i+1)%5],r2c(fab[i],-0.3),fab[(i+3)%5]],r); g.fillStyle=r2lg(g,x,0,x+w,0,'rgba(255,255,255,.1)','rgba(0,0,0,0)','rgba(0,0,0,.2)'); g.fillRect(x,y,w,h); g.restore();
  r2rr(g,x+3,y+23,w-6,5,2,'#f4eee2');
  r2wood(g,x,y-2,w,6,r2c(wd,0.05),r,6,2); r2wood(g,x,y+h-18,w,6,r2c(wd,0.05),r,6,2);
  for(const px of [x+3,x+w-3]) for(const py of [y+1,y+h-15]){ r2o(g,px,py,3.8,r2c(wd,-0.35)); r2o(g,px-0.6,py-0.6,2.4,r2c(wd,0.18)); }
  const lx=x+w-1; for(const s of [0,7]) r2l(g,lx+s,y+20,lx+s,y+h-8,r2c(wd,-0.1),2); for(let k=y+26;k<y+h-10;k+=10) r2l(g,lx,k,lx+7,k,r2c(wd,0.1),1.6);
  const lab=R.st==='kid'?'KEEP OUT':R.st==='miner'?(o.x<R.x0+R.W/2?'PICK':'NO, PICK'):null;
  if(lab){ r2rr(g,o.x-14,y+h-30,28,9,1,'#f4ead0'); g.fillStyle='#8a2e22'; g.font=`900 5.5px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(lab,o.x,y+h-25.5); }
};
function r2Near(o,ks,md){ let best=null,bd=md*md; for(const q of AREA.objs){ if(q===o||!ks.includes(q.k)) continue; const d=dist2(o.x,o.y,q.x,q.y); if(d<bd){ bd=d; best=q; } } return best; }
FB.table=FB.desk=(g,o,R)=>{
  const w=o.w,h=o.h,x=o.x-w/2,y=o.y-h/2, r=r2rng(o,5), desk=o.k==='desk', wd=desk&&R.st==='mayor'?'#5a2e1a':R.wood, d=desk?12:7;
  r2sh(g,x,y,w,h,3,0.3);
  for(const lx of [x+3,x+w-7]) r2rr(g,lx,y+h-3,4,5,1,r2c(wd,-0.4));
  r2rr(g,x,y+h-d-2,w,d+2,2,r2c(wd,-0.28)); r2wood(g,x,y,w,h-d,r2c(wd,0.08),r,7,3); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+2,y+h-d,w-4,1);
  if(desk){ const nd=w>120?3:2; for(let k=0;k<nd;k++){ const dx=x+6+k*((w-12)/nd), dw=(w-12)/nd-4; r2rr(g,dx,y+h-d+2,dw,d-4,1,r2c(wd,-0.15)); g.fillStyle='rgba(255,240,210,.15)'; g.fillRect(dx,y+h-d+2,dw,0.8); r2o(g,dx+dw/2,y+h-d/2,1.3,'#d8b04a'); } if(R.st==='mayor'){ g.strokeStyle='#d8b04a'; g.lineWidth=1; g.strokeRect(x+2,y+2,w-4,h-d-4); } }
  else if(!o.books&&r()<0.55){ const cw=w*0.62, cx=o.x-cw/2, cc=r2pk(r,['#efe6d6','#c84a4a','#3a6a9a','#e8d8a8']), chk=r()<0.5; g.save(); g.beginPath(); g.rect(cx,y+3,cw,h-d-3+5); g.clip(); r2rr(g,cx,y+4,cw,h-d+1,1,cc); if(chk){ g.fillStyle='rgba(255,255,255,.35)'; for(let xx=cx;xx<cx+cw;xx+=6) g.fillRect(xx,y,3,h); for(let yy=y;yy<y+h;yy+=6) g.fillRect(cx,yy,cw,3); } g.restore(); g.fillStyle=r2c(cc,-0.15); for(let xx=cx;xx<cx+cw-2;xx+=5){ g.beginPath(); g.arc(xx+2.5,y+h-d+5,2.5,0,Math.PI); g.fill(); } }
  const top=y+3, tb=y+h-d-3;
  if(o.books||desk){ r2Books(g,R,o,r,x,top,w,tb-top,desk); }
  else { const n=w>80?3:2; for(let k=0;k<n;k++){ const px=x+w*(k+0.5)/n+(r()-0.5)*6, py=(top+tb)/2+(r()-0.5)*4; r2Dish(g,px,py,r); } if(R.st==='inn'||r()<0.6){ const mx=x+w*0.5+(r()-0.5)*w*0.3, my=top+4; r2Mug(g,mx,my,r); } if(R.st!=='inn'&&r()<0.5){ r2rr(g,o.x-2,top+2,4,4,1,'#b8943a'); r2rr(g,o.x-1.2,top-3,2.4,5,0.5,'#f2ead8'); r2Flame(g,R,o.x,top-3,0.8); } }
};
function r2Dish(g,x,y,r){ r2e(g,x+1,y+1.5,7,5,'rgba(0,0,0,.2)'); r2e(g,x,y,7,5,'#f2ede0'); r2e(g,x,y,4.6,3.2,'#e0d8c6'); const f=Math.floor(r()*5); if(f===0){ r2o(g,x-1,y,2.6,'#c8322a'); r2o(g,x+2,y+0.5,2.2,'#7ab03a'); } else if(f===1){ r2e(g,x,y,3.6,2.2,'#d8a050'); g.fillStyle='rgba(120,70,20,.5)'; g.fillRect(x-2,y-0.5,4,0.8); } else if(f===2){ g.fillStyle='#f0c840'; g.beginPath(); g.moveTo(x-3,y+1.5); g.lineTo(x+3,y+1.5); g.lineTo(x+1,y-2); g.fill(); } else if(f===3){ r2e(g,x,y,3.8,2.6,'#8a4a2a'); r2o(g,x-1,y-0.5,0.9,'#e8c060'); r2o(g,x+1.4,y+0.6,0.9,'#5a8a3a'); } r2l(g,x+8,y-3,x+8,y+3,'#b8b8c0',0.9); }
function r2Mug(g,x,y,r){ const c=r2pk(r,['#c8c8d0','#8a5a32','#4a6a9a','#b8643a']); g.strokeStyle=c; g.lineWidth=1.4; g.beginPath(); g.arc(x+4,y,2.4,-1.2,1.2); g.stroke(); r2o(g,x+0.6,y+1,3.6,'rgba(0,0,0,.25)'); r2o(g,x,y,3.6,c); r2o(g,x,y,2.6,r()<0.5?'#5a3418':'#f0e8d0'); r2o(g,x-1,y-1,1,'rgba(255,255,255,.35)'); }
function r2Books(g,R,o,r,x,y,w,h,desk){
  const st=R.st;
  // a stack of books, an open book, paper and ink
  const sx=x+w*0.18+r()*8, sy=y+h*0.5; for(let k=0;k<3;k++){ const bw=16-k*2+r()*3, bh=10-k; g.save(); g.translate(sx,sy-k*2.4); g.rotate((r()-0.5)*0.25); r2rr(g,-bw/2+1,-bh/2+1,bw,bh,1,'rgba(0,0,0,.25)'); r2rr(g,-bw/2,-bh/2,bw,bh,1,r2pk(r,R2BOOK)); g.fillStyle='#efe6d0'; g.fillRect(-bw/2+1,bh/2-2,bw-2,1.4); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(-bw/2,-bh/2,bw,1); g.restore(); }
  const ox=x+w*(o.books?0.7:0.55), oy=y+h*0.48; g.save(); g.translate(ox,oy); g.rotate((r()-0.5)*0.2); r2rr(g,-13,-8,27,17,1,'rgba(0,0,0,.25)'); r2rr(g,-13.5,-8.5,27,17,1,r2pk(r,R2BOOK)); r2rr(g,-12,-7.5,11.6,15,0.5,'#f4ecd8'); r2rr(g,0.4,-7.5,11.6,15,0.5,'#efe6d0'); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(-0.6,-7.5,1.2,15); for(let k=-5;k<=5;k+=2.2){ r2l(g,-10.5,k,-2,k,'rgba(60,40,20,.35)',0.5); r2l(g,2,k,10.5,k,'rgba(60,40,20,.35)',0.5); } g.restore();
  const ix=x+w*0.86, iy=y+h*0.32; r2o(g,ix+0.6,iy+1,3,'rgba(0,0,0,.25)'); r2o(g,ix,iy,3,'#1a1a2a'); r2o(g,ix-0.8,iy-0.8,1,'rgba(255,255,255,.4)'); g.strokeStyle='#efe6d6'; g.lineWidth=1.2; g.beginPath(); g.moveTo(ix,iy-1); g.quadraticCurveTo(ix-4,iy-9,ix-9,iy-12); g.stroke(); g.fillStyle='#efe6d6'; g.beginPath(); g.ellipse(ix-6,iy-9,1.6,4.5,-0.9,0,TAU); g.fill();
  if(desk){ const cx=x+w*0.08+4, cy=y+h*0.2+2; r2o(g,cx+0.6,cy+1,3.4,'rgba(0,0,0,.25)'); r2o(g,cx,cy,3.4,'#b8943a'); r2o(g,cx,cy,2,'#d8b04a'); r2rr(g,cx-1.2,cy-6,2.4,6,0.5,'#f2ead8'); r2Flame(g,R,cx,cy-6,0.8);
    if(st==='guard'){ r2Mug(g,x+w*0.86,y+h*0.75,r); g.strokeStyle='#b8943a'; g.lineWidth=1; g.beginPath(); g.arc(x+w*0.3,y+h*0.85,2.4,0,TAU); g.stroke(); r2l(g,x+w*0.3+2,y+h*0.85,x+w*0.3+7,y+h*0.85,'#b8943a',1.2); }
    else if(st==='scholar'){ g.strokeStyle='#8a8a94'; g.lineWidth=0.8; g.beginPath(); g.moveTo(x+w*0.82,y+h*0.85); g.lineTo(x+w*0.86,y+h*0.6); g.lineTo(x+w*0.9,y+h*0.85); g.stroke(); r2o(g,x+w*0.12,y+h*0.8,5,'#3a6a9a'); g.strokeStyle='#d8b04a'; g.lineWidth=0.8; g.beginPath(); g.ellipse(x+w*0.12,y+h*0.8,5,2,0.3,0,TAU); g.stroke(); r2o(g,x+w*0.12-1,y+h*0.8-1,1.2,'#5aa04a'); }
    else if(st==='mayor'){ r2rr(g,o.x-14,y+h-6,28,6,1,'#d8b04a'); g.fillStyle='#3a2414'; g.font=`900 4.5px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('MAYOR',o.x,y+h-3); r2rr(g,x+w*0.82,y+h*0.62,6,8,1,'#3a2a1a'); r2rr(g,x+w*0.81,y+h*0.62+7,8,3,1,'#c8322a'); } }
}
FB.chair=(g,o,R)=>{
  const t=r2Near(o,['table','desk'],110), r=r2rng(o,6), wd=R.wood, cc=r2pk(r,R.fab);
  let dir='u'; if(t){ const dx=t.x-o.x, dy=t.y-o.y; dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'); }
  const x=o.x, y=o.y; r2sh(g,x-10,y-9,20,19,3,0.28);
  for(const [lx,ly] of [[-9,7],[6,7]]) r2rr(g,x+lx,y+ly,3,4,1,r2c(wd,-0.4));
  r2rr(g,x-10,y-9,20,18,3,r2c(wd,-0.25)); r2wood(g,x-9,y-8,18,15,r2c(wd,0.1),r,5,3);
  r2rr(g,x-7,y-6,14,11,4,cc); r2o(g,x,y-0.5,0.9,r2c(cc,-0.35)); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x-6,y-5.5,12,1.2);
  const back=(bx,by,bw,bh)=>{ r2rr(g,bx+1,by+2,bw,bh,1.5,'rgba(0,0,0,.25)'); r2rr(g,bx,by,bw,bh,1.5,r2c(wd,-0.1)); g.fillStyle='rgba(255,240,210,.25)'; g.fillRect(bx,by,bw,1); };
  if(dir==='r'){ back(x-13,y-13,5,21); for(let k=-8;k<=4;k+=6) r2l(g,x-8,y+k,x-6,y+k,r2c(wd,-0.3),1.4); }
  else if(dir==='l'){ back(x+8,y-13,5,21); for(let k=-8;k<=4;k+=6) r2l(g,x+6,y+k,x+8,y+k,r2c(wd,-0.3),1.4); }
  else if(dir==='d'){ back(x-11,y-15,22,6); }
  else back(x-11,y+6,22,5);
};
FB.shelf=(g,o,R)=>{
  const w=o.w||110, h=o.free?30:24, x=o.x-w/2, y=o.y-h/2, r=r2rng(o,7), wd=R.wood, free=o.free;
  r2sh(g,x,y,w,h,2,0.3);
  const topH=free?6:4; r2rr(g,x,y,w,h,2,r2c(wd,-0.4));
  r2wood(g,x,y,w,topH,r2c(wd,0.12),r,topH,1);
  const rows=2, ry0=y+topH+1, rh=(h-topH-3)/rows;
  for(let k=0;k<rows;k++){ const yy=ry0+k*rh; r2rr(g,x+3,yy,w-6,rh-1.5,0,'#1e140c'); g.fillStyle=r2c(wd,-0.15); g.fillRect(x+2,yy+rh-1.6,w-4,1.6);
    let bx=x+4; while(bx<x+w-6){ const kind=r();
      if(o.jars){ const jw=6+r()*3, jh=rh-3-r()*3, c=r2pk(r,['#6aa04a','#a04a6a','#4a6aa0','#c8a040','#8a5ac8','#c86a3a']); r2rr(g,bx,yy+rh-2-jh,jw,jh,2,'rgba(200,220,230,.35)'); r2rr(g,bx+0.8,yy+rh-2-jh*0.75,jw-1.6,jh*0.75-0.6,1.5,c); r2rr(g,bx+0.5,yy+rh-3-jh,jw-1,2,0.8,'#8a6a42'); if(r()<0.5) r2rr(g,bx+1.4,yy+rh-jh*0.55,jw-2.8,2.4,0.4,'#efe6d6'); g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(bx+1,yy+rh-jh,0.8,jh-3); bx+=jw+1.5+r()*2; continue; }
      if(o.lamps){ const lx=bx+5; r2rr(g,lx-3.5,yy+rh-4,7,2.4,1,'#b8943a'); r2e(g,lx,yy+rh-6.5,3.2,3,'rgba(255,220,150,.85)'); r2rr(g,lx-1.6,yy+rh-12,3.2,4,1,'rgba(255,240,210,.6)'); r2Glow(R,lx,yy+rh-7,12,'255,200,100',0.4); bx+=12+r()*3; continue; }
      if(kind<0.06&&bx<x+w-16){ r2rr(g,bx+1,yy+rh-6,8,4,1,'#a85a3a'); for(let i=0;i<4;i++) r2e(g,bx+5+Math.cos(i*1.6)*2.4,yy+rh-8+Math.sin(i*1.6)*1.4,2.2,1.4,'#4e8240',i); bx+=11; continue; }
      if(kind<0.12){ bx+=3+r()*4; continue; }
      const bw=2.6+r()*3.2, bh=rh-2.5-r()*(rh*0.35), c=r2pk(r,R2BOOK), lean=r()<0.06;
      if(lean){ g.save(); g.translate(bx,yy+rh-1.6); g.rotate(0.35); r2rr(g,0,-bh,bw,bh,0.6,c); g.restore(); bx+=bw+3; continue; }
      r2rr(g,bx,yy+rh-1.6-bh,bw,bh,0.6,c); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(bx,yy+rh-1.6-bh,0.8,bh); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(bx+bw-0.7,yy+rh-1.6-bh,0.7,bh); if(r()<0.5){ g.fillStyle=r()<0.5?'rgba(230,200,110,.8)':'rgba(255,255,255,.4)'; g.fillRect(bx,yy+rh-1.6-bh+1.5,bw,0.8); g.fillRect(bx,yy+rh-4,bw,0.8); }
      bx+=bw+0.4; }
  }
  g.fillStyle='rgba(255,240,210,.18)'; g.fillRect(x,y,1.2,h); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+w-1.2,y,1.2,h);
  if(!free&&!o.lamps&&r()<0.7){ const tx=x+8+r()*(w-24), k=Math.floor(r()*4); if(k===0){ r2rr(g,tx,y-5,7,6,1,'#a85a3a'); for(let i=0;i<5;i++) r2e(g,tx+3.5+Math.cos(i*1.3)*3,y-7+Math.sin(i*1.3)*1.6,2.6,1.4,'#4e8240',i); } else if(k===1){ r2rr(g,tx,y-3,12,3,1,r2pk(r,R2BOOK)); r2rr(g,tx+1,y-6,10,3,1,r2pk(r,R2BOOK)); } else if(k===2&&R.st==='scholar'){ r2o(g,tx+4,y-6,4.5,'#3a6a9a'); r2o(g,tx+3,y-7,1.6,'#5aa04a'); } else { r2rr(g,tx,y-7,6,8,2,'rgba(200,220,230,.5)'); r2rr(g,tx+1,y-5,4,5,1,'#c8a040'); } }
};
FB.fireplace=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,8), st=R.wl.k==='stone'?R.wl.c:['#8a8478','#7a746a','#9a948a','#6e6a62'];
  r2sh(g,x-44,y-22,88,42,3,0.3);
  r2rr(g,x-46,y+6,92,13,2,'#7a746c'); g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(x-45,y+6,90,1.2); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-45,y+17,90,2); for(let k=-30;k<=30;k+=20) g.fillRect(x+k,y+7,0.8,10);
  r2rr(g,x-41,y-24,82,32,2,'#2a2624');
  for(let row=0;row<4;row++){ let sx=x-41+(row%2?-5:0); const sy=y-24+row*8; while(sx<x+41){ const sw=10+r()*8; const a=Math.max(sx,x-41), b=Math.min(sx+sw,x+41); if(b-a>2) r2rr(g,a+0.6,sy+0.6,b-a-1.2,6.8,1.5,r2c(r2pk(r,st),(r()-0.5)*0.15)); sx+=sw; } }
  g.fillStyle='rgba(255,255,255,.1)'; for(let row=0;row<4;row++) g.fillRect(x-40,y-24+row*8+0.8,80,0.8);
  const op=()=>{ g.beginPath(); g.moveTo(x-25,y+8); g.lineTo(x-25,y-6); g.quadraticCurveTo(x-25,y-17,x,y-17); g.quadraticCurveTo(x+25,y-17,x+25,y-6); g.lineTo(x+25,y+8); g.closePath(); };
  g.fillStyle='#3a3430'; g.save(); g.translate(0,-1.5); g.scale(1,1); op(); g.lineWidth=3; g.strokeStyle='#4a4440'; g.stroke(); g.restore();
  g.fillStyle=r2lg(g,0,y-17,0,y+8,'#050403','#1a0e08','#2a160c'); op(); g.fill();
  g.save(); op(); g.clip(); g.strokeStyle='rgba(90,50,30,.35)'; g.lineWidth=0.6; for(let yy=y-14;yy<y+8;yy+=4){ g.beginPath(); g.moveTo(x-25,yy); g.lineTo(x+25,yy); g.stroke(); } g.restore();
  r2e(g,x,y+5,18,3.6,'#5a5450'); r2e(g,x,y+4.6,14,2.6,'#8a8480');
  r2l(g,x-14,y+6,x-14,y-1,'#1a1a1e',1.8); r2l(g,x+14,y+6,x+14,y-1,'#1a1a1e',1.8); r2l(g,x-17,y+3,x+17,y+3,'#1a1a1e',1.6);
  for(const [lx,ly,lw,rot] of [[-5,1,22,0.12],[6,0,20,-0.15],[0,-3,18,0.03]]){ g.save(); g.translate(x+lx,y+ly); g.rotate(rot); r2rr(g,-lw/2,-2.8,lw,5.6,2.8,'#5a3a1e'); g.fillStyle='rgba(255,220,170,.12)'; g.fillRect(-lw/2+2,-2.4,lw-4,1); r2e(g,lw/2-0.6,0,1.6,2.8,'#c8a070'); g.strokeStyle='rgba(90,60,30,.6)'; g.lineWidth=0.4; g.beginPath(); g.ellipse(lw/2-0.6,0,0.8,1.6,0,0,TAU); g.stroke(); g.restore(); }
  r2rr(g,x-48,y-31,96,8,1.5,r2c(R.wood,-0.25)); r2wood(g,x-48,y-31,96,5,r2c(R.wood,0.05),r,5,1.5); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x-46,y-23,92,2);
  g.fillStyle=r2rg(g,x,y-20,2,26,'rgba(10,6,4,.4)','rgba(10,6,4,0)'); g.fillRect(x-26,y-24,52,10);
  // mantel things
  r2rr(g,x-41,y-35,5,4,1,'#b8943a'); r2rr(g,x-39.8,y-41,2.6,6,0.5,'#f2ead8'); r2Flame(g,R,x-38.5,y-41,0.8);
  r2rr(g,x+36,y-35,5,4,1,'#b8943a'); r2rr(g,x+37.2,y-41,2.6,6,0.5,'#f2ead8'); r2Flame(g,R,x+38.5,y-41,0.8);
  const k=Math.floor(r()*3); if(k===0){ r2rr(g,x+20,y-38,9,7,2,'#4a7aa8'); r2o(g,x+22,y-37,1,'rgba(255,255,255,.5)'); } else if(k===1){ r2rr(g,x-28,y-39,7,8,2,'#6a4428'); r2o(g,x-24.5,y-36,2.4,'#f2ead8'); } else { r2Toy(g,x+24,y-34,0.7); }
  r2l(g,x+48,y+4,x+50,y-14,'#2a2a2e',1.4); r2l(g,x+52,y+4,x+53,y-12,'#2a2a2e',1.4); r2rr(g,x+50,y-15,5,3,1,'#b8943a');
};
FL.fireplace=(o,t)=>{
  const x=o.x, y=o.y;
  if(!o.lit){ ctx.fillStyle='rgba(255,90,30,.25)'; for(let i=0;i<3;i++){ ctx.fillRect(x-6+i*6,y+2+Math.sin(t*2+i)*0.4,1.2,1); } return; }
  glowAt(x,y-2,46,'255,150,60',0.45+0.08*Math.sin(t*9));
  for(let i=0;i<6;i++){ const fx=x-15+i*6, h=10+5*Math.sin(t*9+i*1.7)+3*Math.sin(t*17+i), w=4.2+Math.sin(t*5+i)*0.6;
    ctx.fillStyle='rgba(220,60,20,.85)'; r2tear(ctx,fx,y+3,w*1.3,h*1.15); ctx.fillStyle='rgba(255,150,40,.95)'; r2tear(ctx,fx,y+3,w,h*0.85); ctx.fillStyle='rgba(255,230,140,.95)'; r2tear(ctx,fx,y+3,w*0.5,h*0.45); }
  glowAt(x,y+12,40,'255,170,90',0.22);
  if(Math.random()<0.4) emit(x+rand(-16,16),y-2,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:15,smax:40,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:3,drag:1});
};
FB.oven=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,9);
  r2sh(g,x-50,y-25,100,50,8,0.3);
  r2rr(g,x-50,y+8,100,17,3,'#8a8478'); g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(x-49,y+8,98,1.4); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-49,y+21,98,4); for(let k=-36;k<=36;k+=18) g.fillRect(x+k,y+12,0.8,9);
  const dome=()=>{ g.beginPath(); g.moveTo(x-46,y+9); g.lineTo(x-46,y-4); g.bezierCurveTo(x-46,y-28,x+46,y-28,x+46,y-4); g.lineTo(x+46,y+9); g.closePath(); };
  g.save(); dome(); g.clip(); g.fillStyle='#d8c8b0'; g.fillRect(x-48,y-30,96,40);
  for(let row=0;row<8;row++){ const by=y-26+row*4.6; for(let bx=x-48+(row%2?-4:0);bx<x+48;bx+=9){ g.fillStyle=r2c(r2pk(r,['#a84a32','#b85a3a','#984230','#b8603e']),(r()-0.5)*0.12); g.fillRect(bx+0.5,by+0.5,8,3.6); } }
  g.fillStyle=r2lg(g,x-46,0,x+46,0,'rgba(255,230,190,.18)','rgba(0,0,0,0)','rgba(0,0,0,.35)'); g.fillRect(x-48,y-30,96,40); g.fillStyle=r2lg(g,0,y-26,0,y-12,'rgba(255,240,210,.2)','rgba(0,0,0,0)'); g.fillRect(x-48,y-30,96,18); g.restore();
  g.strokeStyle='rgba(60,20,10,.5)'; g.lineWidth=1; dome(); g.stroke();
  const mo=()=>{ g.beginPath(); g.moveTo(x-17,y+9); g.lineTo(x-17,y-1); g.arc(x,y-1,17,Math.PI,TAU); g.lineTo(x+17,y+9); g.closePath(); };
  for(let i=0;i<9;i++){ const a=Math.PI+i/8*Math.PI; g.save(); g.translate(x+Math.cos(a)*20,y-1+Math.sin(a)*20); g.rotate(a+Math.PI/2); r2rr(g,-3,-3,6,6,1,i%2?'#c8b8a0':'#b8a890'); g.restore(); }
  g.fillStyle=r2lg(g,0,y-18,0,y+9,'#0a0604','#1e100a'); mo(); g.fill();
  r2rr(g,x-7,y-34,14,9,1,'#5a5450'); r2rr(g,x-9,y-36,18,3,1,'#3a3634');
  g.save(); g.translate(x+34,y+6); g.rotate(-0.25); r2rr(g,-2,-26,4,22,1,'#a07a4a'); r2e(g,0,-2,7,6,'#b8905a'); g.restore();
  for(let i=0;i<3;i++){ r2e(g,x-36+i*9,y+13,4.5,2.6,'#c88a4a'); r2l(g,x-38+i*9,y+12,x-34+i*9,y+12,'rgba(90,50,20,.6)',0.6); }
};
FL.oven=(o,t)=>{ const x=o.x, y=o.y, lit=o.lit||G.flags.oven_lit;
  if(lit){ glowAt(x,y+2,52,'255,150,60',0.5+0.06*Math.sin(t*7)); ctx.fillStyle='rgba(255,120,40,.8)'; ctx.beginPath(); ctx.moveTo(x-15,y+8); ctx.lineTo(x-15,y); ctx.arc(x,y,15,Math.PI,TAU); ctx.lineTo(x+15,y+8); ctx.closePath(); ctx.fill(); for(let i=0;i<5;i++){ const fx=x-10+i*5, h=7+3*Math.sin(t*10+i*2); ctx.fillStyle='rgba(255,200,90,.95)'; r2tear(ctx,fx,y+7,2.6,h); ctx.fillStyle='rgba(255,245,200,.95)'; r2tear(ctx,fx,y+7,1.2,h*0.5); } if(Math.random()<0.08) emit(x,y-36,1,{col:'200,200,200',glow:false,ang:-Math.PI/2,spread:0.3,smin:10,smax:22,lmin:1,lmax:1.6,zmin:3,zmax:6,grow:6,drag:0.5,alpha:0.4}); }
  else { for(let i=0;i<4;i++){ ctx.fillStyle=`rgba(255,${80+i*20},30,${0.35+0.2*Math.sin(t*2+i*1.3)})`; ctx.fillRect(x-8+i*5,y+6,2,1.2); } } };
FB.counter=(g,o,R)=>{
  const w=o.w,h=o.h,x=o.x-w/2,y=o.y-h/2, r=r2rng(o,10), d=12, gd=o.goods, wd=R.wood;
  r2sh(g,x,y,w,h,3,0.3);
  if(gd==='mugs') for(let i=0;i<4;i++){ const sx=x+w*(i+0.5)/4; r2o(g,sx+2,y+h+5,7,'rgba(0,0,0,.25)'); r2rr(g,sx-1,y+h-1,2,6,0,r2c(wd,-0.45)); r2o(g,sx,y+h+3,6.5,r2c(wd,-0.2)); r2o(g,sx,y+h+2.5,5,r2pk(r,['#8a2e22','#6a3a1a','#2e4a6a'])); r2o(g,sx-1.5,y+h+1,1.5,'rgba(255,255,255,.2)'); }
  r2rr(g,x,y+h-d-2,w,d+2,2,r2c(wd,-0.3)); for(let px=x+4;px<x+w-14;px+=24){ r2rr(g,px,y+h-d+2,20,d-6,1,r2c(wd,-0.15)); g.fillStyle='rgba(255,240,210,.14)'; g.fillRect(px,y+h-d+2,20,0.8); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(px,y+h-5,20,0.8); } g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(x+1,y+h-3,w-2,3);
  if(R.S0.counterTop==='marble'){ r2rr(g,x,y,w,h-d,3,'#e6dfd4'); g.strokeStyle='rgba(120,110,100,.25)'; g.lineWidth=0.7; for(let i=0;i<5;i++){ g.beginPath(); let px=x+r()*w, py=y; g.moveTo(px,py); for(let k=0;k<4;k++){ px+=(r()-0.3)*20; py+=(h-d)/4; g.lineTo(px,py); } g.stroke(); } g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(x+2,y,w-4,1.2); }
  else r2wood(g,x,y,w,h-d,r2c(wd,0.12),r,7,3);
  g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+2,y+h-d,w-4,1.2);
  const ty0=y+3, ty1=y+h-d-3, cy=(ty0+ty1)/2;
  if(gd==='bread'){ for(let bx=x+14;bx<x+w-10;bx+=28){ r2e(g,bx+1,cy+2,12,7,'rgba(0,0,0,.25)'); r2e(g,bx,cy+1,12,7,'#a87a3a'); g.strokeStyle='rgba(90,60,20,.6)'; g.lineWidth=0.6; for(let k=-10;k<=10;k+=3){ g.beginPath(); g.moveTo(bx+k,cy-5); g.lineTo(bx+k+1,cy+7); g.stroke(); } for(let k=0;k<2;k++){ g.save(); g.translate(bx-3+k*6,cy-1+k*2); g.rotate(-0.3+k*0.5); r2e(g,0,0,7,3.6,'#d89a50'); g.fillStyle='rgba(120,60,20,.7)'; for(let s=-4;s<=4;s+=4) g.fillRect(s-0.6,-2,1.2,4); r2e(g,-2,-1.4,3,1,'rgba(255,240,200,.4)'); g.restore(); } } }
  else if(gd==='buns'){ for(let bx=x+8;bx<x+w-30;bx+=48){ r2rr(g,bx,ty0,40,ty1-ty0,2,'#9a9aa4'); r2rr(g,bx+1.5,ty0+1.5,37,ty1-ty0-3,1.5,'#7a7a84'); for(let i=0;i<4;i++) for(let j=0;j<2;j++){ const ux=bx+6+i*9.5, uy=ty0+6+j*8; r2o(g,ux+0.6,uy+1,3.8,'rgba(0,0,0,.25)'); r2o(g,ux,uy,3.8,'#e8a85a'); r2o(g,ux-1.2,uy-1.2,1.5,'rgba(255,240,200,.6)'); r2l(g,ux-1.5,uy,ux+1.5,uy,'rgba(120,60,20,.6)',0.6); } } const cx=x+w-14; r2o(g,cx+1,cy+1.5,9,'rgba(0,0,0,.25)'); r2o(g,cx,cy,9,'#f4ecd8'); r2o(g,cx,cy,7,'#e8b0c0'); r2o(g,cx,cy,4,'#f4ecd8'); for(let i=0;i<5;i++){ const a=i/5*TAU; r2o(g,cx+Math.cos(a)*5.5,cy+Math.sin(a)*5.5,1,'#c8322a'); } }
  else if(gd==='lamps'){ for(let lx=x+14;lx<x+w-8;lx+=22){ r2e(g,lx+1,cy+3,6,3,'rgba(0,0,0,.3)'); r2rr(g,lx-5,cy,10,4,1.5,'#b8943a'); r2e(g,lx,cy-2,4.6,4.2,'rgba(255,214,140,.9)'); r2rr(g,lx-2,cy-11,4,6,1,'rgba(255,240,220,.55)'); r2o(g,lx-1.6,cy-3,1.2,'rgba(255,255,255,.7)'); r2Glow(R,lx,cy-3,16,'255,200,100',0.4); } }
  else if(gd==='mugs'){ const kx=x+12; r2e(g,kx+1,cy+2,10,8,'rgba(0,0,0,.25)'); g.fillStyle=r2lg(g,0,cy-8,0,cy+8,'#9a6a3a','#5a3a1a'); g.beginPath(); g.ellipse(kx,cy,9,8,0,0,TAU); g.fill(); g.strokeStyle='#3a3a40'; g.lineWidth=1.4; g.beginPath(); g.moveTo(kx-5,cy-7); g.lineTo(kx-5,cy+7); g.moveTo(kx+5,cy-7); g.lineTo(kx+5,cy+7); g.stroke(); r2rr(g,kx+8,cy-1.5,5,3,1,'#b8943a'); for(let mx=x+32;mx<x+w-10;mx+=16){ r2Mug(g,mx,cy+(r()-0.5)*6,r); } for(let i=0;i<3;i++){ const bx=x+w-14-i*7, by=ty0+2; r2rr(g,bx-2,by,4,9,1.5,r2pk(r,['#3a6a3a','#6a2a1a','#c8a040'])); r2rr(g,bx-0.8,by-3,1.6,3,0.5,'#2a1a10'); } r2rr(g,x+w*0.55,cy+2,14,6,2,'#d8d0c0'); }
  else if(gd==='cloth'){ for(let bx=x+10;bx<x+w-20;bx+=18){ const c=r2pk(r,['#c84a6a','#4a8ac8','#e8b04a','#6ac84a','#8a4ac8','#e86a3a','#efe6d6','#3a3a5a']); g.save(); g.translate(bx,cy); g.rotate((r()-0.5)*0.3); r2rr(g,-6,-9,13,19,3,'rgba(0,0,0,.25)'); r2rr(g,-7,-10,13,19,3,c); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(-6,-10,3,19); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(2,-10,3,19); if(r()<0.4){ g.fillStyle='rgba(255,255,255,.35)'; for(let k=-8;k<8;k+=4) g.fillRect(-7,k,13,1.4); } g.restore(); } const sx=x+w-12; g.strokeStyle='#8a8a94'; g.lineWidth=1.2; g.beginPath(); g.moveTo(sx-6,cy-4); g.lineTo(sx+4,cy+4); g.moveTo(sx-6,cy+4); g.lineTo(sx+4,cy-4); g.stroke(); g.strokeStyle='#c8322a'; g.beginPath(); g.arc(sx-7,cy-5,1.8,0,TAU); g.arc(sx-7,cy+5,1.8,0,TAU); g.stroke(); r2o(g,x+w*0.5,ty1-2,3.4,'#c84a3a'); r2o(g,x+w*0.5-1,ty1-3,1,'#4e8240'); }
  else if(gd==='rocks'){ r2rr(g,x+8,ty0,34,ty1-ty0,2,'#a07a4a'); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x+8,ty1-1.5,34,1.5); for(let i=0;i<3;i++){ g.save(); g.translate(x+16+i*8,cy); g.rotate(0.5); r2e(g,0,0,4,1.6,'#f08a2a'); r2l(g,-4,0,-6,-1,'#4e8240',1); g.restore(); } r2rr(g,x+30,cy-2,10,1.6,0.5,'#c8c8d0'); r2rr(g,x+26,cy-2.4,5,2.4,1,'#4a2e18'); for(let bx=x+56;bx<x+w-12;bx+=26){ r2o(g,bx+1,cy+1.5,9,'rgba(0,0,0,.25)'); r2o(g,bx,cy,9,'#d8d0c0'); r2o(g,bx,cy,7,'#6a5a4a'); for(let k=0;k<5;k++) r2o(g,bx+(r()-0.5)*8,cy+(r()-0.5)*6,1.6+r(),r2pk(r,['#8a8478','#9a948a','#7a746a'])); } }
  else { for(let bx=x+12;bx<x+w-8;bx+=22){ r2rr(g,bx-7,cy-6,14,12,2,'#a07a4a'); } }
};
FB.board=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,11);
  r2sh(g,x-38,y-14,76,26,2,0.25);
  for(const px of [x-36,x+32]) r2wood(g,px,y-14,4,26,'#5a3a1e',r,26,1);
  g.fillStyle='#4a3020'; g.beginPath(); g.moveTo(x-44,y-18); g.lineTo(x,y-28); g.lineTo(x+44,y-18); g.lineTo(x+40,y-15); g.lineTo(x,y-24); g.lineTo(x-40,y-15); g.closePath(); g.fill();
  r2rr(g,x-38,y-16,76,22,1,'#6a4428'); r2rr(g,x-35,y-13,70,16,0,'#b8905a'); for(let i=0;i<30;i++){ g.fillStyle='rgba(90,60,30,.3)'; g.fillRect(x-35+r()*70,y-13+r()*16,1,1); }
  for(let i=0;i<4;i++){ const px=x-26+i*17, py=y-5+(i%2)*2, rot=(r()-0.5)*0.25; g.save(); g.translate(px,py); g.rotate(rot); r2rr(g,-6,-6.5,13,14,0,'rgba(0,0,0,.25)'); r2rr(g,-6.5,-7,13,14,0,'#efe2c4'); if(i%2===0){ r2o(g,0,-2,2.6,'#7a8a5a'); r2o(g,-0.9,-2.6,0.5,'#1a1a1a'); r2o(g,0.9,-2.6,0.5,'#1a1a1a'); } else { r2e(g,0,-2,3.4,2,'#c8322a'); } for(let k=2;k<6;k+=1.6) r2l(g,-4.5,k,4.5,k,'rgba(60,40,20,.45)',0.4); g.restore(); r2o(g,px,py-6.5,1,'#c8322a'); }
};
FB.rack=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,12);
  r2sh(g,x-16,y-20,32,46,2,0.28);
  r2rr(g,x-17,y+18,34,8,2,'#4a2e18'); r2wood(g,x-17,y+18,34,5,'#6a4428',r,5,2);
  r2l(g,x-15,y+20,x-15,y-24,'#4a2e18',3); r2l(g,x+15,y+20,x+15,y-24,'#4a2e18',3); r2wood(g,x-17,y-26,34,5,'#6a4428',r,5,1);
  if(o.picks){ for(let i=0;i<3;i++){ const px=x-9+i*9; r2l(g,px,y+18,px,y-16,'#7a5430',2); g.strokeStyle='#8a8a94'; g.lineWidth=2.4; g.beginPath(); g.moveTo(px-6,y-14); g.quadraticCurveTo(px,y-19,px+6,y-14); g.stroke(); g.strokeStyle='rgba(255,255,255,.45)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(px-5,y-15.5); g.quadraticCurveTo(px,y-19.5,px+5,y-15.5); g.stroke(); } }
  else { r2l(g,x-9,y+18,x-9,y-20,'#7a5430',1.8); g.fillStyle='#c8ccd4'; g.beginPath(); g.moveTo(x-9,y-28); g.lineTo(x-6.5,y-20); g.lineTo(x-11.5,y-20); g.fill();
    r2rr(g,x-1.6,y-22,3.2,26,1,'#c8ccd4'); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(x-1,y-21,0.8,24); r2rr(g,x-5,y+3,10,2.4,1,'#b8943a'); r2rr(g,x-1.2,y+5,2.4,8,0.6,'#4a2e18'); r2o(g,x,y+14,1.6,'#b8943a');
    r2l(g,x+9,y+20,x+9,y-14,'#a07a4a',1.8); g.fillStyle='#d8b860'; g.beginPath(); g.moveTo(x+6,y+8); g.lineTo(x+12,y+8); g.lineTo(x+14,y+21); g.lineTo(x+4,y+21); g.closePath(); g.fill(); g.strokeStyle='rgba(120,90,30,.6)'; g.lineWidth=0.5; for(let k=5;k<=13;k+=2){ g.beginPath(); g.moveTo(x+k,y+9); g.lineTo(x+k,y+21); g.stroke(); } r2rr(g,x+3,y-8,12,5,1,'#efe2c4'); g.fillStyle='#8a2e22'; g.font=`900 3px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('EMERGENCY',x+9,y-5.5); }
};
FB.cell=(g,o,R)=>{
  const x=o.x-o.w/2, y=o.y-o.h/2, w=o.w, h=o.h, r=r2rng(o,13);
  g.fillStyle='rgba(10,10,14,.35)'; g.fillRect(x,y,w,h);
  for(let i=0;i<90;i++){ const px=x+8+r()*(w-16), py=y+h*0.55+r()*h*0.4, a=r()*TAU, L=3+r()*6; g.strokeStyle='rgba(216,184,96,.55)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(a)*L,py+Math.sin(a)*L); g.stroke(); }
  r2box(g,x+10,y+10,56,18,6,'#7a5434','#5a3a20'); r2rr(g,x+w-30,y+14,16,14,3,'#6a6a72'); r2e(g,x+w-22,y+16,7,2.6,'#4a4a52'); g.strokeStyle='#8a8a94'; g.lineWidth=0.8; g.beginPath(); g.arc(x+w-22,y+14,6,Math.PI,TAU); g.stroke();
  r2rr(g,x+w/2-14,y+12,28,9,1,'#efe2c4'); g.fillStyle='#3a2414'; g.font=`900 4.5px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('A B C D',x+w/2,y+16.5);
  const bar=(x0,y0,x1,y1)=>{ r2l(g,x0+1.5,y0+2,x1+1.5,y1+2,'rgba(0,0,0,.35)',3); r2l(g,x0,y0,x1,y1,'#5a5a66',3); r2l(g,x0-0.8,y0,x1-0.8,y1,'rgba(220,225,235,.4)',0.8); };
  bar(x,y,x,y+h); bar(x+w,y,x+w,y+h); bar(x,y,x+w,y);
  for(let k=x;k<=x+w;k+=12) bar(k,o.y-16,k,o.y+4);
  r2l(g,x,o.y-16,x+w,o.y-16,'#4a4a56',3); r2l(g,x,o.y+4,x+w,o.y+4,'#4a4a56',3); r2rr(g,x+w/2-6,o.y-10,12,10,2,'#3a3a44'); r2o(g,x+w/2,o.y-6,1.5,'#d8b04a');
};
FB.telescope=(g,o,R)=>{
  const x=o.x, y=o.y; r2shC(g,x,y,14,10,0.25);
  for(const a of [0.5,2.6,4.4]) r2l(g,x,y,x+Math.cos(a)*15,y+Math.sin(a)*12,'#4a3020',2.4);
  r2o(g,x,y,4,'#3a3a4a');
  g.save(); g.translate(x,y-4); g.rotate(-0.8); r2rr(g,-8,-4,10,8,2,'rgba(0,0,0,.25)'); g.fillStyle=r2lg(g,0,-6,0,6,'#f0d070','#b8902a','#7a5a1a'); rrect(g,-8,-5,46,10,3); g.fill(); g.fillStyle='#7a5a1a'; for(const k of [4,18,30]) g.fillRect(k,-5.5,2,11); r2rr(g,38,-6,5,12,1.5,'#5a4010'); r2e(g,43,0,1.6,5,'#1a2a4a'); r2e(g,43,-1.6,0.8,1.8,'rgba(180,220,255,.7)'); r2rr(g,-12,-2.4,5,4.8,1,'#3a3a4a'); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(-6,-4,42,1.2); g.restore();
};
FB.chart=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,14);
  r2l(g,x-26,y+14,x-20,y-14,'#5a3a20',2.4); r2l(g,x+26,y+14,x+20,y-14,'#5a3a20',2.4); r2l(g,x,y+12,x,y-8,'#4a2e18',2);
  r2rr(g,x-36,y-17,72,27,2,'rgba(0,0,0,.3)'); r2rr(g,x-37,y-19,74,27,2,'#b8943a'); r2rr(g,x-34,y-16,68,21,1,'#1a2044');
  const pts=[]; for(let i=0;i<14;i++){ const sx=x-31+r()*62, sy=y-14+r()*17; pts.push([sx,sy]); r2o(g,sx,sy,0.5+r()*1.1,'#ffe9a0'); }
  g.strokeStyle='rgba(255,233,160,.4)'; g.lineWidth=0.5; g.beginPath(); for(let i=0;i<5;i++) g.lineTo(pts[i][0],pts[i][1]); g.stroke(); g.beginPath(); for(let i=6;i<10;i++) g.lineTo(pts[i][0],pts[i][1]); g.stroke();
  for(let i=0;i<3;i++){ const sx=x-24+i*22+r()*6, sy=y-10+r()*10; r2l(g,sx-1.6,sy-1.6,sx+1.6,sy+1.6,'#ff5a4a',0.9); r2l(g,sx+1.6,sy-1.6,sx-1.6,sy+1.6,'#ff5a4a',0.9); }
  r2rr(g,x-34,y+6,68,3,1,'#4a2e18');
};
FB.trophy=(g,o,R)=>{
  const x=o.x, y=o.y; r2shC(g,x,y+4,12,8,0.28);
  if(o.antler){ r2rr(g,x-7,y-4,14,14,2,'#4a2e18'); r2wood(g,x-7,y-4,14,10,'#6a4428',r2rng(o,15),10,2); r2e(g,x,y-8,9,7,'#5a3a20'); r2e(g,x,y-9,7,5,'#7a5434');
    g.strokeStyle='#e0d0b0'; g.lineCap='round'; for(const s of [-1,1]){ g.lineWidth=3; g.beginPath(); g.moveTo(x+s*3,y-11); g.quadraticCurveTo(x+s*14,y-14,x+s*20,y-28); g.stroke(); g.lineWidth=2; g.beginPath(); g.moveTo(x+s*9,y-14); g.lineTo(x+s*8,y-24); g.moveTo(x+s*15,y-19); g.lineTo(x+s*22,y-20); g.moveTo(x+s*14,y-17); g.lineTo(x+s*12,y-28); g.stroke(); } g.lineCap='butt'; return; }
  r2rr(g,x-10,y,20,12,2,'#5a5650'); g.fillStyle='#8a8478'; g.fillRect(x-10,y,20,4); g.fillStyle='rgba(255,255,255,.2)'; g.fillRect(x-10,y,20,1);
  r2rr(g,x-6,y-4,12,4,1,'#b8902a'); r2rr(g,x-2,y-9,4,6,1,'#d8b04a');
  g.fillStyle=r2lg(g,x-11,0,x+11,0,'#f8e090','#d8b04a','#9a7420'); g.beginPath(); g.moveTo(x-11,y-24); g.lineTo(x+11,y-24); g.quadraticCurveTo(x+10,y-10,x,y-9); g.quadraticCurveTo(x-10,y-10,x-11,y-24); g.fill();
  g.strokeStyle='#d8b04a'; g.lineWidth=1.8; g.beginPath(); g.arc(x-11,y-19,4,Math.PI*0.5,Math.PI*1.5); g.stroke(); g.beginPath(); g.arc(x+11,y-19,4,-Math.PI*0.5,Math.PI*0.5); g.stroke();
  r2e(g,x,y-24,11,2,'#9a7420'); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(x-7,y-22,2,9);
  r2rr(g,x-7,y+5,14,5,1,'#d8b04a'); g.fillStyle='#3a2414'; g.font=`900 3.4px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('BEST MAYOR',x,y+7.6);
};
FB.bearrug=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,16), fur='#6a4428', dk='#4a2e18';
  const shape=(s,c)=>{ g.fillStyle=c; g.beginPath(); g.ellipse(x,y,52*s,32*s,0,0,TAU); g.fill(); for(const [dx,dy,a] of [[-44,-24,-0.6],[44,-24,0.6],[-44,24,0.6],[44,24,-0.6]]){ g.beginPath(); g.ellipse(x+dx*s,y+dy*s,15*s,9*s,a,0,TAU); g.fill(); } g.beginPath(); g.ellipse(x,y+34*s,8*s,6*s,0,0,TAU); g.fill(); };
  g.save(); g.translate(2,3); shape(1.02,'rgba(0,0,0,.25)'); g.restore(); shape(1,dk); shape(0.92,fur);
  g.fillStyle=r2rg(g,x,y,4,46,'rgba(255,220,170,.2)','rgba(0,0,0,0)'); g.beginPath(); g.ellipse(x,y,46,28,0,0,TAU); g.fill();
  g.strokeStyle='rgba(40,25,10,.4)'; g.lineWidth=0.8; for(let i=0;i<140;i++){ const a=r()*TAU, d=r(), px=x+Math.cos(a)*48*d, py=y+Math.sin(a)*28*d; g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(a)*3,py+Math.sin(a)*3); g.stroke(); }
  for(const [dx,dy] of [[-54,-28],[54,-28],[-54,28],[54,28]]) for(let k=-1;k<=1;k++){ const cx=x+dx+k*3*(dy<0?1:-1)*0.5, cy=y+dy+k*3; r2l(g,cx,cy,cx+Math.sign(dx)*3,cy+Math.sign(dy)*1.5,'#efe6d6',1.2); }
  r2o(g,x+2,y-38,17,'rgba(0,0,0,.25)'); r2o(g,x,y-40,16,dk); r2o(g,x,y-40,14.5,fur); r2o(g,x-11,y-52,5,dk); r2o(g,x+11,y-52,5,dk); r2o(g,x-11,y-52,2.6,'#8a5a3a'); r2o(g,x+11,y-52,2.6,'#8a5a3a');
  r2e(g,x,y-33,7,6,'#9a7050'); r2e(g,x,y-36,3.2,2.2,'#1a0e06'); r2o(g,x-1,y-36.6,0.8,'rgba(255,255,255,.5)');
  g.strokeStyle='#1a0e06'; g.lineWidth=1.2; g.beginPath(); g.arc(x-6,y-44,2.6,0.3,Math.PI-0.3); g.stroke(); g.beginPath(); g.arc(x+6,y-44,2.6,0.3,Math.PI-0.3); g.stroke();
  g.beginPath(); g.moveTo(x-2.4,y-31); g.quadraticCurveTo(x,y-29.5,x+2.4,y-31); g.stroke();
};
FB.sled=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,17); r2sh(g,x-18,y-30,36,62,6,0.25);
  for(const s of [-1,1]){ g.strokeStyle='#4a2e18'; g.lineWidth=3; g.beginPath(); g.moveTo(x+s*17,y+30); g.lineTo(x+s*17,y-26); g.quadraticCurveTo(x+s*17,y-36,x+s*9,y-34); g.stroke(); g.strokeStyle='rgba(255,230,190,.3)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(x+s*16,y+29); g.lineTo(x+s*16,y-26); g.stroke(); }
  for(let k=-24;k<=24;k+=9.6){ r2rr(g,x-15,y+k-3.6,30,7.4,1.5,'#c84a3a'); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x-14,y+k-3.4,28,1.2); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x-14,y+k+2.6,28,1); g.fillStyle='#efe6d6'; g.fillRect(x-1,y+k-3.6,2,7.4); }
  for(let i=0;i<5;i++) r2o(g,x-10+r()*20,y-20+r()*40,0.9,'rgba(40,20,10,.6)');
  g.strokeStyle='#b8a070'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-9,y-34); g.quadraticCurveTo(x,y-46,x+9,y-34); g.stroke();
};
FB.cauldron=(g,o,R)=>{
  const x=o.x, y=o.y, rr=o.small?14:22, r=r2rng(o,18); r2shC(g,x,y+2,rr+2,rr*0.85,0.3);
  if(!o.small){ for(let i=0;i<9;i++){ const a=i/9*TAU; r2e(g,x+Math.cos(a)*(rr+4),y+4+Math.sin(a)*(rr*0.7+3),5,3.6,r2c('#7a746a',(r()-0.5)*0.3)); } for(let i=0;i<3;i++){ g.save(); g.translate(x,y+rr*0.7); g.rotate(-0.4+i*0.4); r2rr(g,-10,-1.6,20,3.2,1.6,'#5a3a1e'); g.restore(); } }
  g.fillStyle=r2rg(g,x-rr*0.3,y-rr*0.2,2,rr*1.1,'#4a4650','#1a1820','#0a080c'); g.beginPath(); g.arc(x,y,rr,0,TAU); g.fill();
  r2e(g,x,y-rr*0.12,rr-1,rr*0.82,'#26232a'); g.strokeStyle='#5a5660'; g.lineWidth=2.6; g.beginPath(); g.ellipse(x,y-rr*0.12,rr-1.5,rr*0.8,0,0,TAU); g.stroke(); g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=1; g.beginPath(); g.ellipse(x,y-rr*0.12,rr-1.5,rr*0.8,0,Math.PI*1.1,Math.PI*1.6); g.stroke();
  for(const s of [-1,1]){ g.strokeStyle='#3a3640'; g.lineWidth=1.6; g.beginPath(); g.arc(x+s*(rr+1),y-rr*0.1,3,0,TAU); g.stroke(); }
};
FL.cauldron=(o,t)=>{ const x=o.x, y=o.y, rr=o.small?14:22, cook=AREA&&AREA.def.style==='cook', c=cook?['#c8a070','#7a5a30']:['#b8e870','#3e7a2a'];
  ctx.fillStyle=c[1]; ctx.beginPath(); ctx.ellipse(x,y-rr*0.1,rr-4,rr*0.68,0,0,TAU); ctx.fill(); ctx.fillStyle=c[0]; ctx.beginPath(); ctx.ellipse(x-rr*0.12+Math.sin(t*0.7)*2,y-rr*0.18,rr*0.6,rr*0.4,0,0,TAU); ctx.fill();
  for(let i=0;i<4;i++){ const ph=(t*0.9+i*0.27)%1, bx=x+Math.cos(i*2.1+t*0.2)*rr*0.45, by=y-rr*0.1+Math.sin(i*1.7)*rr*0.3; ctx.strokeStyle=`rgba(255,255,230,${0.5*(1-ph)})`; ctx.lineWidth=0.9; ctx.beginPath(); ctx.arc(bx,by,1+ph*3*(rr/22),0,TAU); ctx.stroke(); }
  if(cook){ ctx.fillStyle='#8a8478'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(x-6+i*6+Math.sin(t+i)*1.2,y-rr*0.1+Math.cos(t*0.8+i)*2,2.2,0,TAU); ctx.fill(); } }
  else glowAt(x,y-2,rr*1.4,'170,240,120',0.18+0.05*Math.sin(t*2));
  if(Math.random()<0.15) emit(x,y,1,{alpha:0.4,col:'200,220,180',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:25,lmin:1,lmax:1.6,zmin:3,zmax:6,grow:6,drag:0.4}); };
FB.hatstand=(g,o,R)=>{ const x=o.x, y=o.y; r2shC(g,x,y,14,11,0.22); for(let i=0;i<3;i++){ const a=i/3*TAU+0.4; r2l(g,x,y,x+Math.cos(a)*9,y+Math.sin(a)*9,'#4a2e18',2.6); } r2o(g,x,y,5.5,'#5a3a1e'); r2o(g,x-1,y-1,3,'#8a5a32'); for(let i=0;i<3;i++){ const a=i/3*TAU+0.4; r2Hat(g,x+Math.cos(a)*14,y+Math.sin(a)*14,['party','wizard','top'][i],0.95); } };
function r2Hat(g,x,y,k,s){ g.save(); g.translate(x,y); g.scale(s,s); r2o(g,1.5,2,8.5,'rgba(0,0,0,.25)');
  if(k==='party'){ r2o(g,0,0,7,'#e84a8a'); for(let i=0;i<6;i++){ const a=i/6*TAU; r2o(g,Math.cos(a)*4.4,Math.sin(a)*4.4,1,'#fff'); } r2o(g,0,0,3.5,'#ffd84a'); r2o(g,0,0,1.5,'#4ac8e8'); }
  else if(k==='wizard'){ r2o(g,0,0,9,'#3a3a9a'); r2o(g,0,0,5.5,'#5a5ad0'); r2o(g,0,0,2.5,'#7a7ae8'); r2o(g,3,-3,1.4,'#ffe066'); r2o(g,-4,2,1,'#ffe066'); }
  else { r2o(g,0,0,9,'#1a1a1e'); r2o(g,0,0,6,'#2a2a30'); g.strokeStyle='#8a2e22'; g.lineWidth=1.5; g.beginPath(); g.arc(0,0,6,0,TAU); g.stroke(); r2o(g,-2,-2,2,'rgba(255,255,255,.15)'); }
  g.restore(); }
FB.mirror=(g,o,R)=>{ const x=o.x, y=o.y; r2shC(g,x,y+12,12,4,0.25);
  r2l(g,x-12,y+14,x-14,y-2,'#8a6a2a',2); r2l(g,x+12,y+14,x+14,y-2,'#8a6a2a',2); r2l(g,x-15,y+14,x-9,y+14,'#6a4a1a',2); r2l(g,x+9,y+14,x+15,y+14,'#6a4a1a',2);
  r2e(g,x+1.5,y-4,14,18,'rgba(0,0,0,.28)'); g.fillStyle=r2lg(g,x-14,y-22,x+14,y+14,'#f8e090','#d8b04a','#9a7420'); g.beginPath(); g.ellipse(x,y-6,14,18,0,0,TAU); g.fill();
  g.fillStyle=r2lg(g,x-10,y-20,x+10,y+8,'#e8f4ff','#a8c8e8','#6a88a8'); g.beginPath(); g.ellipse(x,y-6,11,15,0,0,TAU); g.fill();
  g.save(); g.beginPath(); g.ellipse(x,y-6,11,15,0,0,TAU); g.clip(); g.fillStyle='rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(x-10,y-4); g.lineTo(x-2,y-20); g.lineTo(x+2,y-20); g.lineTo(x-8,y+2); g.fill(); g.restore(); r2o(g,x,y-24,2,'#f8e090'); };
FB.portraits=(g,o,R)=>{
  const sp=o._sp||[o.x-60,o.x+70], a=sp[0]+2, b=sp[1]-2, w=b-a, top=R.y0-30, bot=R.y0+8;
  const fr=(fx,fy,fw,fh,i)=>{ r2rr(g,fx+1.5,fy+2,fw,fh,1,'rgba(0,0,0,.35)'); g.fillStyle=r2lg(g,fx,fy,fx+fw,fy+fh,'#f0d070','#b8902a'); rrect(g,fx,fy,fw,fh,1); g.fill(); const ix=fx+2.5, iy=fy+2.5, iw=fw-5, ih=fh-5;
    if(i===0){ r2rr(g,ix,iy,iw,ih,0,'#2a2a3a'); for(let k=0;k<4;k++) r2o(g,ix+iw*(0.25+k*0.17),iy+ih*(0.45+(k%2)*0.12),iw*0.2,'#4a4a5a'); r2o(g,ix+iw*0.4,iy+ih*0.45,0.9,'#ff5a3a'); r2o(g,ix+iw*0.6,iy+ih*0.45,0.9,'#ff5a3a'); return; }
    r2rr(g,ix,iy,iw,ih,0,['#b8402a','#8a3a5a','#c8602a','#7a4a2a'][i-1]); const hx=ix+iw/2, hy=iy+ih*0.42, hr=Math.min(iw,ih)*0.2;
    r2e(g,hx,iy+ih,iw*0.38,ih*0.3,['#3a2a4a','#2a4a3a','#4a2a1a','#2a3a5a'][i-1]); r2o(g,hx,hy,hr,'#e8b088'); g.fillStyle='#f0e8d0'; g.beginPath(); g.moveTo(hx-hr*0.7,hy-hr*0.6); g.lineTo(hx-hr*1.1,hy-hr*1.6); g.lineTo(hx-hr*0.2,hy-hr*0.9); g.fill(); g.beginPath(); g.moveTo(hx+hr*0.7,hy-hr*0.6); g.lineTo(hx+hr*1.1,hy-hr*1.6); g.lineTo(hx+hr*0.2,hy-hr*0.9); g.fill(); r2o(g,hx-hr*0.35,hy,0.6,'#1a1a1a'); r2o(g,hx+hr*0.35,hy,0.6,'#1a1a1a');
    if(i===1){ r2o(g,ix+iw*0.8,iy+ih*0.55,1.8,'#ffd84a'); } };
  if(w>=110){ const fw=(w-12)/5; for(let i=0;i<5;i++) fr(a+i*(fw+3),top+(i%2)*3,fw,30-(i%2)*4,i); }
  else { const big=Math.min(30,w*0.36), sx=a+(w-big)/2; fr(sx,top,big,34,0); const sw=(w-big)/2-4; fr(a,top,sw,16,1); fr(a,top+19,sw,16,2); fr(sx+big+4,top,sw,16,3); fr(sx+big+4,top+19,sw,16,4); }
};
FB.gchest=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,19); r2sh(g,x-20,y-14,40,28,4,0.3);
  r2rr(g,x-20,y-2,40,16,2,'#5a3418'); g.fillStyle=r2lg(g,0,y-15,0,y-1,'#9a6a38','#6a4220'); rrect(g,x-20,y-15,40,14,6); g.fill(); g.strokeStyle='rgba(255,230,180,.2)'; g.lineWidth=0.6; for(let k=-14;k<=14;k+=7){ g.beginPath(); g.moveTo(x-19,y-8+k*0.05); g.lineTo(x+19,y-8+k*0.05); g.stroke(); }
  g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x-20,y-2,40,1.4);
  for(const bx of [x-14,x+11]){ r2rr(g,bx,y-15,3,29,1,'#3a3a40'); r2o(g,bx+1.5,y-10,0.7,'#8a8a94'); r2o(g,bx+1.5,y+8,0.7,'#8a8a94'); }
  r2rr(g,x-4,y-4,8,8,1,'#d8b04a'); r2o(g,x,y-1,1.2,'#2a1a10'); g.fillRect(x-0.5,y-1,1,2.5);
  g.fillStyle='#b8402a'; g.beginPath(); g.moveTo(x+6,y-15); g.quadraticCurveTo(x+14,y-16,x+20,y-12); g.lineTo(x+20,y+6); g.quadraticCurveTo(x+17,y+2,x+15,y+8); g.quadraticCurveTo(x+14,y-4,x+6,y-15); g.fill(); g.fillStyle='rgba(240,192,96,.7)'; for(let k=0;k<3;k++) g.fillRect(x+15+k*1.6,y+3+k,0.8,4);
};
FL.gchest=(o,t)=>{ if(!G.pages.p9) glowAt(o.x,o.y,30,'255,230,160',0.2+0.12*Math.sin(t*3)); };
FB.toybox=(g,o,R)=>{
  const x=o.x, y=o.y, r=r2rng(o,20), c=R.st==='ash'?'#3a6a9a':r2pk(r,['#3a6a9a','#c84a3a','#4a8a4a','#d8902a']); r2sh(g,x-20,y-14,40,28,3,0.3);
  g.save(); g.translate(x+4,y-14); g.rotate(-0.2); r2rr(g,-20,-6,38,6,2,r2c(c,0.15)); g.restore();
  r2rr(g,x-20,y-12,40,26,3,r2c(c,-0.25)); r2rr(g,x-18,y-10,36,12,2,'#2a1a10');
  g.save(); g.translate(x-10,y-10); g.rotate(-0.5); r2rr(g,-1.4,-12,2.8,14,0.5,'#c8a070'); r2rr(g,-4,0,8,2,0.5,'#8a5a32'); g.restore();
  r2o(g,x+8,y-6,5,'#c84a3a'); g.fillStyle='#f4f0e8'; g.beginPath(); g.arc(x+8,y-6,5,0.4,1.6); g.lineTo(x+8,y-6); g.fill(); r2Toy(g,x-2,y-7,0.7);
  r2rr(g,x-20,y+2,40,12,2,c); g.fillStyle='#ffd84a'; for(let i=0;i<4;i++){ const sx=x-14+i*9.5, sy=y+8; g.beginPath(); for(let k=0;k<10;k++){ const a=k/10*TAU-Math.PI/2, rr=k%2?1.1:2.6; g.lineTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr); } g.fill(); } g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x-19,y+2,38,1.2);
};
FB.heights=(g,o,R)=>{ const x=o.x, y=R.y0+R.H; r2wood(g,x-6,y-2,12,26,'#d8c8a8',r2rng(o,21),26,1); g.fillStyle='#3a2414'; g.font=`700 3.2px ${UIF}`; g.textAlign='left'; g.textBaseline='middle'; for(let k=0;k<4;k++){ const ly=y+20-k*5.5; r2l(g,x-5,ly,x+2,ly,'#3a2414',0.8); g.fillText(String(4+k*2),x+2.5,ly); } r2e(g,x-1,y+2,3,2,'rgba(40,16,8,.6)'); };
FB.abacus=(g,o,R)=>{ const x=o.x, y=o.y; r2sh(g,x-18,y-12,36,26,2,0.25); r2l(g,x-14,y+14,x-14,y-14,'#4a2e18',2.4); r2l(g,x+14,y+14,x+14,y-14,'#4a2e18',2.4); r2rr(g,x-19,y-15,38,4,1,'#6a4424'); r2rr(g,x-19,y+9,38,4,1,'#6a4424');
  for(let rw=0;rw<4;rw++){ const ry=y-8+rw*5; r2l(g,x-14,ry,x+14,ry,'#8a8a94',0.7); for(let k=0;k<6;k++){ const bx=x-11+k*3.4+(k>2?6:0); r2e(g,bx,ry,1.7,2,['#c84a3a','#3a8a5a','#d8b04a','#3a5a9a'][rw]); r2o(g,bx-0.5,ry-0.6,0.5,'rgba(255,255,255,.5)'); } } };
FB.perch=(g,o,R)=>{ const x=o.x, y=o.y; r2shC(g,x,y+8,12,5,0.22); r2e(g,x,y+10,10,4,'#4a2e18'); r2l(g,x,y+10,x,y-1,'#5a3a1e',2.4); r2rr(g,x-15,y-3,30,4,2,'#6a4424'); g.fillStyle='rgba(255,240,210,.25)'; g.fillRect(x-14,y-3,28,1); r2e(g,x+9,y+11,4.5,2,'#c8c8d0'); for(let i=0;i<4;i++) r2o(g,x+7+i*1.4,y+10.5,0.9,['#d8b04a','#c84a3a','#4a8ac8','#efe6d6'][i]); };
FL.perch=(o,t)=>{ const x=o.x, y=o.y, bob=Math.sin(t*1.3)>0.85?-1.5:0, tilt=Math.sin(t*0.6)*0.25;
  ctx.fillStyle='#14141c'; ctx.beginPath(); ctx.ellipse(x,y-7,7,5.4,-0.15,0,TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x-6,y-6); ctx.lineTo(x-12,y-3); ctx.lineTo(x-6,y-3.5); ctx.fill();
  ctx.fillStyle='rgba(110,130,200,.35)'; ctx.beginPath(); ctx.ellipse(x-1,y-8.5,4,2,-0.2,0,TAU); ctx.fill();
  ctx.save(); ctx.translate(x+5,y-11+bob); ctx.rotate(tilt); ctx.fillStyle='#14141c'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); ctx.fillStyle='#6a6a70'; ctx.beginPath(); ctx.moveTo(3,-1.2); ctx.lineTo(8.5,0.4); ctx.lineTo(3,1.4); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(1.4,-1.2,1,0,TAU); ctx.fill(); ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(1.7,-1.2,0.5,0,TAU); ctx.fill(); ctx.restore();
  ctx.strokeStyle='#d8b04a'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(x-1,y-2); ctx.lineTo(x-1,y-1); ctx.moveTo(x+2,y-2); ctx.lineTo(x+2,y-1); ctx.stroke(); };
FB.mapwall=(g,o,R)=>{ const x=o.x, y=o.y, r=r2rng(o,22); r2sh(g,x-40,y-15,80,26,2,0.25); r2l(g,x-34,y+14,x-34,y-10,'#4a2e18',2.4); r2l(g,x+34,y+14,x+34,y-10,'#4a2e18',2.4);
  r2rr(g,x-40,y-17,80,27,1.5,'#6a4428'); r2rr(g,x-37,y-14,74,21,0,'#b8905a');
  for(let i=0;i<4;i++){ const px=x-26+i*17+(r()-0.5)*4, py=y-4+(r()-0.5)*4, rot=(r()-0.5)*0.3, pw=18, ph=14; g.save(); g.translate(px,py); g.rotate(rot); r2rr(g,-pw/2+1,-ph/2+1,pw,ph,0,'rgba(0,0,0,.25)'); r2rr(g,-pw/2,-ph/2,pw,ph,0,'#ecdcb8'); g.strokeStyle='#5a8ab8'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-7,-4); g.quadraticCurveTo(0,0,6,-3); g.stroke(); for(let k=0;k<3;k++) r2o(g,-5+r()*10,1+r()*4,1,'#4e7a3a'); if(i===2){ r2l(g,1,-1,5,3,'#c8322a',1); r2l(g,5,-1,1,3,'#c8322a',1); } g.restore(); }
  g.strokeStyle='#c8322a'; g.lineWidth=0.5; g.beginPath(); g.moveTo(x-26,y-10); g.lineTo(x-9,y-9); g.lineTo(x+8,y-11); g.lineTo(x+25,y-9); g.stroke(); for(const px of [-26,-9,8,25]) r2o(g,x+px,y-10,1.1,'#c8322a'); };
FB.yarn=(g,o,R)=>{ const x=o.x, y=o.y, r=r2rng(o,23); r2shC(g,x+2,y+3,18,9,0.22);
  g.fillStyle='#a07a4a'; g.beginPath(); g.ellipse(x,y+3,17,9,0,0,TAU); g.fill(); g.strokeStyle='rgba(60,40,15,.45)'; g.lineWidth=0.7; for(let k=-14;k<=14;k+=3.5){ g.beginPath(); g.moveTo(x+k,y-4); g.lineTo(x+k*1.05,y+11); g.stroke(); } r2e(g,x,y,15,6,'#5a3a1e');
  const cols=['#c84a6a','#4a8ac8','#e8b04a','#6ac84a']; for(let i=0;i<4;i++){ const bx=x-10+i*7, by=y-2+(i%2)*3; r2o(g,bx+0.8,by+1,6,'rgba(0,0,0,.25)'); r2o(g,bx,by,6,cols[i]); g.strokeStyle=r2c(cols[i],-0.3); g.lineWidth=0.6; for(let k=0;k<3;k++){ g.beginPath(); g.ellipse(bx,by,5.5,2+k*1.4,0.5+k*0.7,0,TAU); g.stroke(); } r2o(g,bx-2,by-2,1.6,'rgba(255,255,255,.3)'); }
  r2l(g,x-4,y-10,x+6,y+2,'#c8c8d0',1.2); r2l(g,x+2,y-11,x+3,y+2,'#c8c8d0',1.2); r2o(g,x-4,y-10,1.2,'#d8b04a'); r2o(g,x+2,y-11,1.2,'#d8b04a');
  g.strokeStyle=cols[0]; g.lineWidth=1; g.beginPath(); g.moveTo(x+12,y+5); g.bezierCurveTo(x+22,y+10,x+18,y+20,x+30,y+18); g.stroke(); };
FB.rocker=(g,o,R)=>{ const x=o.x, y=o.y, wd=R.wood, r=r2rng(o,24); r2sh(g,x-16,y-14,32,28,6,0.25);
  for(const s of [-1,1]){ g.strokeStyle=r2c(wd,-0.35); g.lineWidth=3; g.beginPath(); g.moveTo(x+s*15,y-18); g.quadraticCurveTo(x+s*19,y,x+s*14,y+18); g.stroke(); }
  r2rr(g,x-14,y-8,28,20,4,r2c(wd,-0.2)); r2wood(g,x-13,y-7,26,17,wd,r,5,4); r2rr(g,x-11,y-5,22,13,5,R.fab[1]); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x-10,y-4.5,20,1.4);
  r2rr(g,x-14,y-16,28,8,2,r2c(wd,-0.1)); for(let k=-9;k<=9;k+=6) r2l(g,x+k,y-9,x+k,y-6,r2c(wd,-0.35),1.5); g.fillStyle='rgba(255,240,210,.25)'; g.fillRect(x-13,y-16,26,1);
  for(const s of [-1,1]) r2rr(g,x+s*14-2.5,y-10,5,18,2,r2c(wd,0.1));
  g.fillStyle=R.fab[0]; g.beginPath(); g.moveTo(x-10,y-16); g.lineTo(x+4,y-16); g.lineTo(x+6,y+2); g.quadraticCurveTo(x-2,y+4,x-9,y+1); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.3)'; for(let k=0;k<4;k++) g.fillRect(x-9,y-13+k*4,14,1.2); };
FB.herbs=(g,o,R)=>{ const x=o.x, y=o.y, r=r2rng(o,25); r2sh(g,x-40,y-8,80,16,2,0.18); r2l(g,x-38,y+10,x-38,y-10,'#5a3a20',2.4); r2l(g,x+38,y+10,x+38,y-10,'#5a3a20',2.4); r2rr(g,x-41,y-12,82,3.6,1.5,'#6a4428');
  for(let i=0;i<6;i++){ const px=x-30+i*12, c=i%2?'#6aa04a':'#a07ad8'; r2l(g,px,y-9,px,y-6,'#8a7a5a',0.7); g.fillStyle=c; g.beginPath(); g.moveTo(px-1.6,y-6); g.lineTo(px+1.6,y-6); g.lineTo(px+5,y+11); g.lineTo(px-5,y+11); g.closePath(); g.fill(); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(px,y-5,5,16); for(let k=0;k<5;k++) r2o(g,px-3.5+r()*7,y+r()*10,1.2,r2c(c,0.3)); g.fillStyle='#b8983a'; g.fillRect(px-2,y-6.5,4,1.4); } };
FB.planter=(g,o,R)=>{ const x=o.x, y=o.y, r=r2rng(o,26), pc=r2pk(r,['#b8643a','#a85a3a','#8a6a5a','#c87a4a']); r2shC(g,x,y+3,13,9,0.25);
  g.fillStyle=r2lg(g,x-12,0,x+12,0,r2c(pc,0.15),pc,r2c(pc,-0.35)); g.beginPath(); g.moveTo(x-12,y-2); g.lineTo(x+12,y-2); g.lineTo(x+9,y+12); g.lineTo(x-9,y+12); g.closePath(); g.fill(); r2e(g,x,y-2,13,4.5,r2c(pc,0.1)); r2e(g,x,y-2,10.5,3.4,'#3a2414');
  for(let i=0;i<9;i++){ const a=i/9*TAU+r()*0.4, L=7+r()*5; g.save(); g.translate(x,y-4); g.rotate(a); r2e(g,L*0.55,0,L*0.55,2.2,i%2?'#4e8240':'#5e9a4a'); g.restore(); }
  for(let i=0;i<7;i++){ const a=r()*TAU, d=r()*7; r2o(g,x+Math.cos(a)*d,y-6+Math.sin(a)*d*0.7,1.6,r2pk(r,['#b48cff','#9a6ae8','#d0b0ff'])); }
  r2o(g,x-1,y-7,1,'#fff'); };
FB.pail=(g,o,R)=>{ const x=o.x, y=o.y; r2shC(g,x,y+2,11,8,0.25); g.fillStyle=r2lg(g,x-11,0,x+11,0,'#c8ccd4','#8a8a94','#5a5a64'); g.beginPath(); g.moveTo(x-11,y-3); g.lineTo(x+11,y-3); g.lineTo(x+9,y+10); g.lineTo(x-9,y+10); g.closePath(); g.fill(); r2l(g,x-10.6,y+2,x+10.6,y+2,'rgba(0,0,0,.25)',1); r2e(g,x,y-3,11,4.5,'#9a9aa4'); r2e(g,x,y-3,9.4,3.6,'#f6f3ea'); r2e(g,x-3,y-4,3,1,'rgba(255,255,255,.9)'); g.strokeStyle='#5a5a64'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-11,y-3); g.quadraticCurveTo(x,y-18,x+11,y-3); g.stroke(); };
FB.hay=(g,o,R)=>{ const x=o.x, y=o.y, r=r2rng(o,27); r2sh(g,x-26,y-20,52,40,6,0.25);
  r2rr(g,x-26,y-2,52,22,6,'#a88a3a'); r2rr(g,x-26,y-20,52,26,7,'#e0c068'); g.strokeStyle='rgba(140,100,30,.55)'; g.lineWidth=0.7; for(let i=0;i<60;i++){ const px=x-24+r()*48, py=y-18+r()*36, a=(r()-0.5)*0.6; g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(a)*7,py+Math.sin(a)*7); g.stroke(); } g.strokeStyle='rgba(255,240,180,.4)'; for(let i=0;i<20;i++){ const px=x-22+r()*44, py=y-18+r()*20; g.beginPath(); g.moveTo(px,py); g.lineTo(px+6,py+(r()-0.5)*2); g.stroke(); }
  for(const bx of [x-10,x+10]){ r2l(g,bx,y-20,bx,y+20,'#7a4a2a',1.6); }
  g.strokeStyle='rgba(224,192,104,.8)'; g.lineWidth=0.9; for(let i=0;i<12;i++){ const px=x-30+r()*60, py=y+16+r()*8, a=r()*TAU; g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(a)*6,py+Math.sin(a)*3); g.stroke(); } };
FB.cart=(g,o,R)=>{ const x=o.x, y=o.y, r=r2rng(o,28); r2sh(g,x-26,y-18,52,36,4,0.3);
  for(const wx of [x-18,x+14]) { r2rr(g,wx,y+12,6,8,2,'#1a1a1e'); }
  r2rr(g,x-26,y+2,52,16,3,'#3a3a44'); r2rr(g,x-27,y-18,54,22,4,'#5a5a66'); r2rr(g,x-23,y-15,46,16,2,'#2a2420');
  for(let i=0;i<10;i++){ const px=x-18+r()*36, py=y-12+r()*10, s=3+r()*3.4; r2o(g,px+0.6,py+0.8,s,'rgba(0,0,0,.3)'); r2o(g,px,py,s,r2c('#8a8478',(r()-0.5)*0.35)); r2o(g,px-s*0.35,py-s*0.35,s*0.35,'rgba(255,255,255,.2)'); }
  g.fillStyle='rgba(255,255,255,.2)'; g.fillRect(x-25,y-18,50,1.2); for(let k=-22;k<=22;k+=11){ r2o(g,x+k,y+6,1,'#8a8a94'); r2o(g,x+k,y+14,1,'#8a8a94'); } };
FB.drawer=(g,o,R)=>{ const x=o.x, y=o.y, r=r2rng(o,29), wd=R.wood; r2sh(g,x-22,y-14,44,28,2,0.3);
  for(const fx of [x-20,x+16]) r2rr(g,fx,y+12,4,3,1,r2c(wd,-0.45));
  r2rr(g,x-22,y-6,44,19,2,r2c(wd,-0.25)); r2wood(g,x-22,y-14,44,9,r2c(wd,0.1),r,9,2); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-21,y-5,42,1);
  for(let k=0;k<2;k++){ r2rr(g,x-19,y-3+k*8,38,6.6,1,r2c(wd,-0.1)); g.fillStyle='rgba(255,240,210,.14)'; g.fillRect(x-19,y-3+k*8,38,0.8); r2o(g,x-7,y+0.3+k*8,1.2,'#d8b04a'); r2o(g,x+7,y+0.3+k*8,1.2,'#d8b04a'); }
  const k=Math.floor(r()*3); if(k===0){ r2rr(g,x-12,y-16,6,8,2,'#4a7aa8'); r2o(g,x-9,y-18,2,'#e84a6a'); r2l(g,x-9,y-16,x-9,y-18,'#4e8240',0.8); } else if(k===1){ r2rr(g,x+4,y-13,10,5,1,'#8a5a32'); g.fillStyle='#d8b04a'; g.fillRect(x+4,y-11,10,0.8); } else { r2rr(g,x-4,y-12,12,4,1,R.fab[0]); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(x-4,y-11,12,0.8); } };
FL.drawer=(o,t)=>{ if(o.clue&&stepOf('gate')&&stepOf('gate').flag==='clue_badge') glowAt(o.x,o.y,26,'255,220,120',0.2+0.1*Math.sin(t*4)); };
FB.note=(g,o,R)=>{ const x=o.x, y=o.y; g.save(); g.translate(x,y); g.rotate(0.2); r2rr(g,-11,-8,23,17,1.5,'rgba(0,0,0,.25)'); r2rr(g,-12,-9,24,17,1.5,'#6a3a24'); r2rr(g,-11,-8,10.6,15,0.5,'#f4ecd8'); r2rr(g,0.4,-8,10.6,15,0.5,'#efe6d0'); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(-0.5,-8,1,15); for(let k=-5;k<=5;k+=2.2){ r2l(g,-9.5,k,-2.4,k,'rgba(60,40,20,.4)',0.5); r2l(g,2,k,9.5,k,'rgba(60,40,20,.4)',0.5); } r2l(g,3,8,4,12,'#c8322a',1.2); g.fillStyle='#c84a5a'; g.beginPath(); g.moveTo(-5,4.4); g.bezierCurveTo(-7,3,-6.5,1.2,-5,2); g.bezierCurveTo(-3.5,1.2,-3,3,-5,4.4); g.fill(); g.restore(); };
FB.painting=(g,o,R)=>{
  const sp=o._sp||[o.x-24,o.x+24], big=o.mayor===3, fw=Math.min(big?54:48,sp[1]-sp[0]), fx=clamp(o.x,sp[0]+fw/2,sp[1]-fw/2)-fw/2, fh=big?38:30, fy=R.y0-31-(big?4:0);
  r2rr(g,fx+2,fy+2.5,fw,fh,1,'rgba(0,0,0,.35)'); g.fillStyle=r2lg(g,fx,fy,fx+fw,fy+fh,'#f4d880','#c8a040','#8a6a1a'); rrect(g,fx,fy,fw,fh,1.5); g.fill(); g.strokeStyle='rgba(90,60,10,.6)'; g.lineWidth=0.6; g.strokeRect(fx+2.2,fy+2.2,fw-4.4,fh-4.4);
  for(const [cx,cy] of [[fx,fy],[fx+fw,fy],[fx,fy+fh],[fx+fw,fy+fh]]) r2o(g,cx,cy,1.6,'#f8e8a0');
  const ix=fx+3.5, iy=fy+3.5, iw=fw-7, ih=fh-7; g.save(); g.beginPath(); g.rect(ix,iy,iw,ih); g.clip(); r2Scene(g,o,ix,iy,iw,ih); g.fillStyle=r2lg(g,ix,iy,ix+iw,iy+ih,'rgba(255,255,255,.14)','rgba(255,255,255,0)','rgba(0,0,0,.15)'); g.fillRect(ix,iy,iw,ih); g.restore();
  r2o(g,fx+fw/2,fy-3,1,'#2a2018'); g.strokeStyle='rgba(40,30,20,.6)'; g.lineWidth=0.5; g.beginPath(); g.moveTo(fx+fw*0.3,fy); g.lineTo(fx+fw/2,fy-3); g.lineTo(fx+fw*0.7,fy); g.stroke();
};
function r2Scene(g,o,x,y,w,h){
  const cx=x+w/2, cy=y+h/2, mi=o.mayor;
  if(mi!=null){ g.fillStyle=['#2a4a3a','#4a2a3a','#2a3a5a','#5a2a1a'][mi]; g.fillRect(x,y,w,h); g.fillStyle=r2rg(g,cx,cy,2,w*0.6,'rgba(255,240,200,.25)','rgba(0,0,0,0)'); g.fillRect(x,y,w,h);
    const s=mi===3?1.4:1;
    if(mi!==2){ r2e(g,cx,y+h+2,w*0.36*s,h*0.36*s,'#1e2a4a'); g.fillStyle='#d8b04a'; g.fillRect(cx-1,y+h-h*0.3*s,2,h*0.3*s); r2o(g,cx,cy-1,h*0.24*s,'#e8b898'); r2o(g,cx-h*0.08*s,cy-2,0.7,'#1a1a1a'); r2o(g,cx+h*0.08*s,cy-2,0.7,'#1a1a1a'); g.fillStyle='#e8e4dc'; g.fillRect(cx-h*0.2*s,cy-h*0.27*s,h*0.4*s,1.6); }
    const mw=[3.5,6,9,7][mi]*s*(w/40), my=mi===2?cy:cy+h*0.07*s; g.fillStyle='#3a2414'; g.beginPath(); g.moveTo(cx,my); g.bezierCurveTo(cx-mw*0.4,my-2,cx-mw*0.8,my-1.5,cx-mw,my+(mi===1?-1.5:1.2)); g.bezierCurveTo(cx-mw*0.6,my+1.2,cx-mw*0.3,my+1.4,cx,my+0.8); g.bezierCurveTo(cx+mw*0.3,my+1.4,cx+mw*0.6,my+1.2,cx+mw,my+(mi===1?-1.5:1.2)); g.bezierCurveTo(cx+mw*0.8,my-1.5,cx+mw*0.4,my-2,cx,my); g.fill(); return; }
  const k=Math.max(0,PAINTINGS.indexOf(o.caption))%8;
  if(k===0){ g.fillStyle=r2lg(g,0,y,0,y+h,'#4a3020','#2a1a10'); g.fillRect(x,y,w,h); g.fillStyle='#6a4a2a'; g.fillRect(x,cy+4,w,h); r2e(g,cx,cy+4,w*0.28,h*0.14,'#e8e0d0'); r2o(g,cx-6,cy,3.4,'#c8322a'); r2o(g,cx+5,cy+0.5,3.2,'#e8b84a'); for(let i=0;i<5;i++) r2o(g,cx-1+(i%3)*2.4,cy-3+Math.floor(i/3)*2.2,1.5,'#6a3a8a'); r2o(g,cx+1.4,cy-3,0.5,'#fff'); r2o(g,cx+2.6,cy-3,0.5,'#fff'); }
  else if(k===1){ g.fillStyle='#1e2a4a'; g.fillRect(x,y,w,h); g.fillStyle='#3a2a3a'; g.beginPath(); g.moveTo(cx-8,y+h); g.lineTo(cx,cy-2); g.lineTo(cx+8,y+h); g.fill(); r2o(g,cx,cy-4,3.6,'#e8b898'); r2o(g,cx,cy-7,2.6,'#e8e8f0'); r2l(g,cx-2.4,cy-5,cx-0.6,cy-4.4,'#1a1a1a',0.7); r2l(g,cx+2.4,cy-5,cx+0.6,cy-4.4,'#1a1a1a',0.7); r2l(g,cx+5,cy+2,cx+9,cy-5,'#3a2a3a',1.4); r2o(g,cx+10,cy-6,2.6,'#ffd84a'); g.fillStyle='rgba(255,216,74,.25)'; g.beginPath(); g.arc(cx+10,cy-6,7,0,TAU); g.fill(); }
  else if(k===2){ g.fillStyle='#8ac0e8'; g.fillRect(x,y,w,h); g.fillStyle='#6aa04a'; g.fillRect(x,cy+2,w,h); r2e(g,cx,cy+1,8,4.4,'#f4f2ea'); r2o(g,cx+8,cy-3,3.2,'#f4f2ea'); g.strokeStyle='#8a7a5a'; g.lineWidth=1; g.beginPath(); g.moveTo(cx+7,cy-5); g.quadraticCurveTo(cx+5,cy-9,cx+3,cy-8); g.moveTo(cx+9,cy-5); g.quadraticCurveTo(cx+10,cy-9,cx+12,cy-8); g.stroke(); for(const lx of [-5,-2,3,6]) r2l(g,cx+lx,cy+4,cx+lx,cy+8,'#f4f2ea',1.2); r2o(g,cx+9,cy-3.4,0.6,'#1a1a1a'); }
  else if(k===3){ g.fillStyle='#1a1410'; g.fillRect(x,y,w,h); g.fillStyle='rgba(255,150,60,.35)'; g.beginPath(); g.arc(cx,cy+2,12,0,TAU); g.fill(); g.fillStyle='#ff8a2a'; r2tear(g,cx,cy+5,3,8); g.fillStyle='#ffe08a'; r2tear(g,cx,cy+5,1.4,4); for(let i=0;i<5;i++){ const a=Math.PI+i/4*Math.PI, px=cx+Math.cos(a)*12, py=cy+3+Math.sin(a)*5; r2o(g,px,py,2.2,'#e8b088'); r2e(g,px,py+4,2.6,3,['#8a3a2a','#3a5a8a','#5a7a3a','#7a5a8a','#8a6a2a'][i]); if(i===2) r2l(g,px-1.6,py+0.9,px+1.6,py+0.9,'#1a1a1a',0.8); } }
  else if(k===4){ g.fillStyle='#e8a0b0'; g.fillRect(x,y,w,h); r2e(g,cx-6,cy+2,7,5,'#c8322a'); r2o(g,cx-1,cy-3,3.6,'#c8322a'); g.fillStyle='#a82a22'; g.beginPath(); g.moveTo(cx-9,cy-1); g.lineTo(cx-14,cy-8); g.lineTo(cx-4,cy-2); g.fill(); r2o(g,cx,cy-4,0.7,'#1a1a1a'); r2rr(g,cx+4,cy,10,7,1,'#f4f0e6'); r2rr(g,cx+4,cy+2.5,10,1.4,0,'#e84a8a'); for(let i=0;i<3;i++){ r2l(g,cx+6+i*3,cy,cx+6+i*3,cy-3,'#f0e8d0',0.8); r2o(g,cx+6+i*3,cy-3.6,0.8,'#ffd84a'); } }
  else if(k===5){ g.fillStyle='#e8d8b0'; g.fillRect(x,y,w,h); g.strokeStyle='#5a8ab8'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x,cy+4); g.bezierCurveTo(cx-6,cy-2,cx+2,cy+8,x+w,cy); g.stroke(); for(let i=0;i<6;i++) r2o(g,x+4+i*w/6,y+5+(i%2)*3,1.4,'#4e7a3a'); r2rr(g,cx-2,cy-4,4,3,0,'#8a5a3a'); r2l(g,cx-5,cy-8,cx+5,cy+2,'#c8322a',1.8); r2l(g,cx+5,cy-8,cx-5,cy+2,'#c8322a',1.8); }
  else if(k===6){ g.fillStyle=r2lg(g,0,y,0,cy,'#5a3a7a','#f0904a'); g.fillRect(x,y,w,h/2+1); r2o(g,cx,cy,6,'#ffd070'); g.fillStyle='#2a4a7a'; g.fillRect(x,cy,w,h); g.fillStyle='rgba(255,208,112,.5)'; for(let k2=0;k2<4;k2++) g.fillRect(cx-5+k2,cy+2+k2*2.4,10-k2*2,1); g.fillStyle='#b8c8d8'; g.save(); g.translate(cx+9,cy-3); g.rotate(-0.6); g.beginPath(); g.ellipse(0,0,4,1.8,0,0,TAU); g.fill(); g.beginPath(); g.moveTo(-4,0); g.lineTo(-6.5,-1.8); g.lineTo(-6.5,1.8); g.fill(); g.restore(); r2o(g,cx+11,cy-4.8,0.5,'#1a1a1a'); }
  else { g.fillStyle=r2lg(g,0,y,0,y+h,'#2a3a6a','#5a5a8a'); g.fillRect(x,y,w,h); g.fillStyle='#3a3a4a'; g.beginPath(); g.moveTo(x+w*0.45,y+h); g.lineTo(x+w*0.75,y+3); g.lineTo(x+w*1.05,y+h); g.fill(); r2o(g,x+w*0.75,y+4,2,'rgba(255,90,40,.8)'); g.fillStyle='#6a3a2a'; g.beginPath(); g.moveTo(x+w*0.2,y+h); g.lineTo(x+w*0.28,cy); g.lineTo(x+w*0.36,y+h); g.fill(); r2o(g,x+w*0.28,cy-1,2.4,'#e8b088'); g.fillStyle='#f0e8d0'; g.beginPath(); g.moveTo(x+w*0.25,cy-2.5); g.lineTo(x+w*0.23,cy-6); g.lineTo(x+w*0.27,cy-3); g.fill(); g.beginPath(); g.moveTo(x+w*0.31,cy-2.5); g.lineTo(x+w*0.33,cy-6); g.lineTo(x+w*0.29,cy-3); g.fill(); r2o(g,x+w*0.42,cy-5,2,'#ffd84a'); g.fillStyle='rgba(255,216,74,.3)'; g.beginPath(); g.arc(x+w*0.42,cy-5,5,0,TAU); g.fill(); }
}
FB.candle=(g,o,R)=>{ const x=o.x, y=o.y; r2e(g,x+1,y+3,4.5,2,'rgba(0,0,0,.3)'); r2e(g,x,y+2,4.5,2.2,'#b8943a'); r2e(g,x,y+1.4,3.4,1.4,'#d8b04a'); r2rr(g,x-1.6,y-6,3.2,8,0.6,'#f2ead8'); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(x-1.2,y-5.5,0.8,7); r2l(g,x+1.6,y-4,x+1.6,y-2,'#f2ead8',1); r2Flame(g,R,x,y-6,1.2); };
FB.goose=(g,o,R)=>{ const x=o.x, y=o.y; r2shC(g,x,y+4,11,5,0.25); for(const s of [-3,3]) r2e(g,x+s,y+7,2.4,1.2,'#f08a2a'); r2e(g,x-1,y,11,7.5,'#f4f2ea'); g.strokeStyle='rgba(150,150,140,.6)'; g.lineWidth=0.7; g.beginPath(); g.arc(x-3,y-1,6,0.2,1.6); g.stroke(); g.fillStyle='#e0ddd0'; g.beginPath(); g.moveTo(x-11,y-1); g.lineTo(x-16,y-4); g.lineTo(x-11,y+2); g.fill();
  g.strokeStyle='#f4f2ea'; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.moveTo(x+7,y-2); g.quadraticCurveTo(x+12,y-6,x+11,y-13); g.stroke(); g.lineCap='butt'; r2o(g,x+12,y-14,3.6,'#f4f2ea'); g.fillStyle='#f08a2a'; g.beginPath(); g.moveTo(x+15,y-15.5); g.lineTo(x+20,y-13.5); g.lineTo(x+15,y-12); g.fill(); r2o(g,x+13,y-15,0.8,'#1a1a1a'); };
FB.rock=(g,o,R)=>{ const x=o.x, y=o.y; r2e(g,x+1,y+4,10,4,'rgba(0,0,0,.25)'); r2rr(g,x-10,y,20,6,3,'#a83a4a'); g.fillStyle='#d8b04a'; g.fillRect(x-10,y+2.5,20,0.8); g.fillStyle=r2rg(g,x-2,y-4,1,9,'#a8a296','#7a746a','#5a564e'); g.beginPath(); g.ellipse(x,y-2,8,6,0,0,TAU); g.fill(); for(const s of [-1,1]){ r2o(g,x+s*3,y-3,2,'#fff'); r2o(g,x+s*3+0.6,y-2.6,0.9,'#1a1a1a'); } r2l(g,x-2,y+0.6,x+2,y+0.6,'#3a3630',0.7); g.fillStyle='#e84a8a'; g.beginPath(); g.moveTo(x+3,y-8); g.lineTo(x-1,y-11); g.lineTo(x-1,y-6); g.closePath(); g.moveTo(x+3,y-8); g.lineTo(x+7,y-11); g.lineTo(x+7,y-6); g.closePath(); g.fill(); r2o(g,x+3,y-8,1.2,'#c83a6a'); };
FB.clock=(g,o,R)=>{ const x=o.x, y=o.y, wd=R.wood; r2sh(g,x-10,y-26,20,52,2,0.3); r2rr(g,x-10,y+18,20,8,1,r2c(wd,-0.35)); r2rr(g,x-8,y-12,16,32,1,r2c(wd,-0.15)); r2wood(g,x-8,y-12,16,30,r2c(wd,-0.05),r2rng(o,30),30,1);
  g.fillStyle=r2c(wd,0.05); g.beginPath(); g.moveTo(x-11,y-12); g.lineTo(x-11,y-24); g.quadraticCurveTo(x,y-32,x+11,y-24); g.lineTo(x+11,y-12); g.closePath(); g.fill(); g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=0.8; g.stroke();
  r2o(g,x,y-19,7,'#d8b04a'); r2o(g,x,y-19,6,'#f2ead8'); for(let i=0;i<12;i++){ const a=i/12*TAU; g.fillStyle='#3a2a1a'; g.fillRect(x+Math.cos(a)*4.8-0.4,y-19+Math.sin(a)*4.8-0.4,0.8,0.8); }
  r2rr(g,x-5,y-8,10,22,2,'#1a1008'); r2rr(g,x-5,y-8,10,22,2,'rgba(140,170,200,.15)'); };
FL.clock=(o,t)=>{ const x=o.x, y=o.y, tod=G?G.tod:0, mins=(tod*24*60+9)%720, ha=mins/720*TAU-Math.PI/2, ma=(mins%60)/60*TAU-Math.PI/2;
  ctx.strokeStyle='#2a1a10'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(x,y-19); ctx.lineTo(x+Math.cos(ha)*3,y-19+Math.sin(ha)*3); ctx.stroke(); ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(x,y-19); ctx.lineTo(x+Math.cos(ma)*4.8,y-19+Math.sin(ma)*4.8); ctx.stroke();
  const sw=Math.sin(t*3.2)*0.35; ctx.save(); ctx.translate(x,y-7); ctx.rotate(sw); ctx.strokeStyle='#b8943a'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,15); ctx.stroke(); ctx.fillStyle='#e8c860'; ctx.beginPath(); ctx.arc(0,16,2.6,0,TAU); ctx.fill(); ctx.restore(); };
FB.lute=(g,o,R)=>{ const x=o.x, y=o.y; g.save(); g.translate(x,y); g.rotate(-0.25); r2e(g,1.5,2,9,12,'rgba(0,0,0,.25)'); g.fillStyle=r2lg(g,-9,0,9,0,'#e0a860','#c8904a','#8a5a2a'); g.beginPath(); g.ellipse(0,0,9,12,0,0,TAU); g.fill(); g.strokeStyle='rgba(90,50,20,.5)'; g.lineWidth=0.5; for(let k=-6;k<=6;k+=3){ g.beginPath(); g.moveTo(k,-11); g.quadraticCurveTo(k*1.3,0,k,11); g.stroke(); }
  r2o(g,0,-2,3,'#2a1a10'); g.strokeStyle='#c8a060'; g.lineWidth=0.5; g.beginPath(); g.arc(0,-2,3.6,0,TAU); g.stroke(); r2rr(g,-2,-28,4,18,1,'#4a2e18'); g.save(); g.translate(0,-28); g.rotate(-0.5); r2rr(g,-2,-7,4,8,1,'#3a2414'); g.restore(); for(const s of [-1,0,1]) r2l(g,s*0.9,-27,s*1.4,8,'rgba(240,235,220,.7)',0.35); r2rr(g,-4,7,8,2,1,'#3a2414'); g.restore(); };
FB.cat=null; // drawn live so it can breathe and swish
FL.cat=(o,t)=>{ const x=o.x, y=o.y, sp=r2CatSpr(o); r2put(sp,x,y); const sw=Math.sin(t*2.2+x)*5; ctx.strokeStyle=sp.col; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x-9,y+1); ctx.quadraticCurveTo(x-18,y-2+sw,x-15,y-11+sw*0.5); ctx.stroke(); ctx.lineCap='butt'; const br=Math.sin(t*1.6)*0.5; ctx.fillStyle=sp.col; ctx.beginPath(); ctx.ellipse(x-1,y-0.5,9,6+br,0,Math.PI,TAU); ctx.fill(); };
function r2CatSpr(o){ const v=Math.abs(Math.round(o.x*3+o.y))%5, col=['#e0a050','#7a7a82','#2a2a2e','#efe6d6','#c8a070'][v];
  const c=r2S('cat'+v,40,30,20,16,g=>{ r2e(g,2,5,12,5,'rgba(0,0,0,.25)'); r2e(g,0,0,10,7,col); if(v===0||v===4){ g.strokeStyle=r2c(col,-0.3); g.lineWidth=1.2; for(let k=-5;k<=4;k+=3){ g.beginPath(); g.moveTo(k,-6); g.quadraticCurveTo(k+1,0,k,5); g.stroke(); } } r2o(g,9,-2,5,col); g.fillStyle=col; g.beginPath(); g.moveTo(6,-5); g.lineTo(7.5,-10.5); g.lineTo(10,-6); g.moveTo(10,-6.5); g.lineTo(13.5,-10); g.lineTo(13.5,-3.5); g.fill(); g.fillStyle='#e88a9a'; g.beginPath(); g.moveTo(7.2,-6); g.lineTo(7.8,-9); g.lineTo(9,-6.4); g.fill();
    if(v===2){ r2o(g,4,4,2,'#efe6d6'); r2o(g,-5,4,2,'#efe6d6'); } r2l(g,8,-2.4,9.6,-2,'#1a1a1a',0.8); r2l(g,11,-2.4,12.4,-2.8,'#1a1a1a',0.8); r2o(g,11.6,0,0.7,'#e88a9a'); g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=0.3; g.beginPath(); g.moveTo(13,0); g.lineTo(17,-1); g.moveTo(13,0.6); g.lineTo(17,1.4); g.stroke(); });
  c.col=col; return c; }
// pots, barrels and sacks: cached sprites, shared with the overworld
function r2PotSpr(k,v){ return r2S('pot'+k+v,36,36,18,18,g=>{
  if(k==='barrel'){ const wd=['#9a6a3a','#8a5a30','#7a5434'][v%3]; r2e(g,3,5,14,12,'rgba(0,0,0,.28)'); g.fillStyle=r2lg(g,-14,0,14,0,r2c(wd,-0.15),r2c(wd,0.1),r2c(wd,-0.4)); g.beginPath(); g.ellipse(0,2,13.6,12.4,0,0,TAU); g.fill(); g.strokeStyle='rgba(30,15,5,.4)'; g.lineWidth=0.7; for(let k2=-10;k2<=10;k2+=4){ g.beginPath(); g.moveTo(k2,4); g.quadraticCurveTo(k2*1.12,9,k2*0.95,13.6-Math.abs(k2)*0.25); g.stroke(); } g.strokeStyle='#3a3a40'; g.lineWidth=1.6; g.beginPath(); g.ellipse(0,5,13.2,9,0,0.15,Math.PI-0.15); g.stroke();
    g.fillStyle=r2c(wd,0.1); g.beginPath(); g.ellipse(0,-1,11.4,9.8,0,0,TAU); g.fill(); g.save(); g.beginPath(); g.ellipse(0,-1,11.4,9.8,0,0,TAU); g.clip(); g.strokeStyle='rgba(40,20,8,.35)'; g.lineWidth=0.6; for(let k2=-8;k2<=8;k2+=4){ g.beginPath(); g.moveTo(k2,-12); g.lineTo(k2,10); g.stroke(); } g.fillStyle='rgba(255,240,210,.12)'; g.fillRect(-11,-11,8,22); g.restore();
    g.strokeStyle='#4a4a52'; g.lineWidth=2; g.beginPath(); g.ellipse(0,-1,12,10.4,0,0,TAU); g.stroke(); g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=0.8; g.beginPath(); g.ellipse(0,-1,12,10.4,0,Math.PI*1.05,Math.PI*1.55); g.stroke(); r2o(g,4,1,1.6,'#2a1a0a'); if(v%4===3){ r2o(g,-4,-3,3,'#8a8a94'); r2o(g,-4,-3,2,'#5a5a64'); } return; }
  if(k==='sack'){ const c=['#d8c8a0','#e8e0cc','#c8b088'][v%3]; r2e(g,3,5,13,10,'rgba(0,0,0,.28)'); g.fillStyle=r2rg(g,-4,-3,2,15,r2c(c,0.15),c,r2c(c,-0.35)); g.beginPath(); g.moveTo(-4,-9); g.quadraticCurveTo(-14,-6,-13,4); g.quadraticCurveTo(-12,12,0,12); g.quadraticCurveTo(12,12,13,4); g.quadraticCurveTo(14,-6,4,-9); g.closePath(); g.fill(); g.strokeStyle='rgba(90,70,40,.35)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(-6,-5); g.quadraticCurveTo(-8,3,-4,9); g.moveTo(5,-6); g.quadraticCurveTo(8,2,6,8); g.stroke();
    r2e(g,0,-10,5,3,r2c(c,-0.1)); r2rr(g,-4.5,-9.5,9,2,1,'#8a6a3a'); g.fillStyle=r2c(c,0.1); g.beginPath(); g.moveTo(-3,-11); g.lineTo(-5,-15); g.lineTo(0,-12); g.lineTo(5,-15); g.lineTo(3,-11); g.fill();
    if(v%3===1){ g.fillStyle='rgba(120,90,50,.7)'; g.font=`900 4px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('FLOUR',0,3); r2e(g,-8,9,4,1.6,'rgba(255,255,255,.5)'); } else { g.strokeStyle='rgba(120,90,50,.6)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(0,7); g.lineTo(0,-2); for(let k2=0;k2<3;k2++){ g.moveTo(0,5-k2*3); g.lineTo(-2.4,3-k2*3); g.moveTo(0,5-k2*3); g.lineTo(2.4,3-k2*3); } g.stroke(); } return; }
  const cs=[['#c8784a','#7a3a1a'],['#4a7aa8','#22406a'],['#6a9a5a','#2e5a2a'],['#b88a5a','#6a4a2a']][v%4];
  r2e(g,3,5,12,10,'rgba(0,0,0,.28)'); g.fillStyle=r2rg(g,-4,-4,1,13,r2c(cs[0],0.25),cs[0],cs[1]); g.beginPath(); g.arc(0,1,11.5,0,TAU); g.fill(); g.strokeStyle='rgba(240,224,192,.35)'; g.lineWidth=1.4; g.beginPath(); g.arc(0,1,8.4,0,TAU); g.stroke(); g.fillStyle='rgba(240,224,192,.3)'; for(let i=0;i<8;i++){ const a=i/8*TAU; g.beginPath(); g.arc(Math.cos(a)*8.4,1+Math.sin(a)*8.4,0.9,0,TAU); g.fill(); }
  r2o(g,0,-1,6.4,r2c(cs[0],0.1)); r2o(g,0,-1,4.6,'#2a140a'); r2o(g,0.6,-0.4,3.2,'#140a04'); g.strokeStyle='rgba(255,230,200,.45)'; g.lineWidth=1.2; g.beginPath(); g.arc(-1,0,9.6,3.6,5.0); g.stroke(); }); }
function drawPot(x,y,k,v){ r2put(r2PotSpr(k,v==null?Math.abs(Math.round(x*0.37+y*0.71))%12:v),x,y); }
function r2Shards(x,y,k){ ctx.fillStyle=k==='barrel'?'rgba(110,70,36,.75)':k==='sack'?'rgba(216,200,160,.6)':'rgba(170,90,50,.7)'; for(let i=0;i<5;i++){ const a=i*1.7, d=6+((i*5)%5); ctx.save(); ctx.translate(x+Math.cos(a)*d,y+Math.sin(a)*d*0.7); ctx.rotate(a); ctx.fillRect(-2.5,-1.5,5,3); ctx.restore(); } if(k==='sack'){ ctx.fillStyle='rgba(250,245,235,.35)'; ctx.beginPath(); ctx.ellipse(x,y+2,10,5,0,0,TAU); ctx.fill(); } }
FL.barrel=FL.pot=FL.sack=(o,t)=>{ if(o.broken) r2Shards(o.x,o.y,o.k); else drawPot(o.x,o.y,o.k); };
FL.shelf=(o,t)=>{ if(o.page&&!G.pages[o.page]) glowAt(o.x,o.y,26,'255,240,200',0.2+0.12*Math.sin(t*3)); };
function drawFurn(o,t){
  if(typeof drawFurnX==='function'&&drawFurnX(o,t)) return;
  const F=FB[o.k], L=FL[o.k];
  if(F||L){ if(F&&!(o._r2b&&AREA&&AREA._bk)){ ctx.save(); F(ctx,o,AREA&&AREA.kind==='house'?r2Room(AREA):r2CaveR()); ctx.restore(); } if(L) L(o,t); return; }
  const x=o.x, y=o.y;
  switch(o.k){
    case 'cchest': ctx.save(); ctx.translate(x,y); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(-16,-6,34,22); ctx.fillStyle=grad(0,-12,0,12,'#8a5a2c','#4a2c14'); ctx.fillRect(-18,-12,36,24); ctx.fillStyle='#d8b04a'; ctx.fillRect(-18,-12,36,4); ctx.fillRect(-18,8,36,4); ctx.fillRect(-2,-12,4,24); if(G.found[o.id]){ ctx.fillStyle='#120a04'; ctx.fillRect(-14,-8,28,16); } else if(o.sealed){ ctx.strokeStyle=`rgba(130,180,255,${0.5+0.3*Math.sin(t*3)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,22,0,TAU); ctx.stroke(); } else glowAt(0,0,36,'255,210,120',0.3+0.15*Math.sin(t*3)); ctx.restore(); break;
    case 'brazier': ctx.fillStyle='#1a1616'; ctx.beginPath(); ctx.arc(x,y,14,0,TAU); ctx.fill(); ctx.strokeStyle='#4a4040'; ctx.lineWidth=2; ctx.stroke(); if(o.lit){ const gl=ctx.createRadialGradient(x,y,0,x,y,11); gl.addColorStop(0,'#ffe2a0'); gl.addColorStop(0.5,'#ff7a2a'); gl.addColorStop(1,'#5a1a08'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(x,y,10,0,TAU); ctx.fill(); if(Math.random()<0.5) emit(x+rand(-4,4),y+rand(-4,4),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:15,smax:50,lmin:.4,lmax:.7,zmin:3,zmax:6,grow:4,drag:1}); } else { ctx.strokeStyle=`rgba(130,180,255,${0.35+0.2*Math.sin(t*2+x)})`; ctx.beginPath(); ctx.arc(x,y,18,0,TAU); ctx.stroke(); } break;
    case 'qitem': if(G.items[o.item]||G.found[o.id]) break; if(o.item==='lucky_lure'){ ctx.fillStyle='#6a4a2c'; ctx.beginPath(); ctx.ellipse(x,y,34,14,0.3,0,TAU); ctx.fill(); ctx.fillStyle='#efe6d6'; ctx.font=`700 7px ${UIF}`; ctx.textAlign='center'; ctx.fillText('SOGGY BISCUIT',x,y+2); } else if(o.item==='oath_plans'){ ctx.fillStyle='#4a3a2a'; ctx.fillRect(x-30,y-18,60,36); ctx.fillStyle='#e8dcc0'; ctx.fillRect(x-22,y-12,44,24); ctx.fillStyle='#c8322a'; ctx.fillRect(x-16,y-6,10,10); } else { ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.arc(x,y,7,0,TAU); ctx.fill(); } glowAt(x,y,30,'255,230,160',0.3+0.15*Math.sin(t*3)); break;
    case 'page': if(G.pages[o.page]) break; ctx.save(); ctx.translate(x,y); ctx.rotate(Math.sin(t)*0.2); ctx.fillStyle='#efe2c4'; ctx.fillRect(-8,-10,16,20); ctx.strokeStyle='rgba(80,50,20,.6)'; ctx.lineWidth=1; for(let k=-6;k<=6;k+=3){ ctx.beginPath(); ctx.moveTo(-5,k); ctx.lineTo(5,k); ctx.stroke(); } ctx.restore(); glowAt(x,y,30,'255,240,200',0.35+0.15*Math.sin(t*3)); break;
    case 'cave_ore': case 'relic': if(G.found[o.id]) break; if(o.k==='relic'){ ctx.fillStyle='#5a2a1a'; ctx.beginPath(); ctx.ellipse(x,y,16,12,0,0,TAU); ctx.fill(); for(let i=0;i<5;i++) glowAt(x-10+i*5,y,6,'255,160,60',0.7); break; } drawStruct({k:'ore',x,y,ref:{id:'_x'}},t); break;
    case 'decor': { const s=o.s; if(o.dk==='crystal'){ for(let i=0;i<4;i++){ ctx.save(); ctx.translate(x,y); ctx.rotate(i*1.6); ctx.fillStyle=i%2?'#b08af0':'#e0c8ff'; ctx.beginPath(); ctx.moveTo(0,-3*s); ctx.lineTo(14*s,0); ctx.lineTo(0,3*s); ctx.fill(); ctx.restore(); } glowAt(x,y,24*s,'180,140,255',0.3); } else if(o.dk==='shroom'){ drawGlowShroom({x,y,s},t); } else if(o.dk==='icicle'){ ctx.fillStyle='rgba(220,240,255,.85)'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(x-8+i*8,y-6); ctx.lineTo(x-4+i*8,y+12*s); ctx.lineTo(x+i*8,y-6); ctx.fill(); } glowAt(x,y,18*s,'200,230,255',0.2); } else if(o.dk==='magma'){ ctx.fillStyle='#2a1210'; ctx.beginPath(); ctx.ellipse(x,y,14*s,10*s,0,0,TAU); ctx.fill(); ctx.fillStyle=`rgba(255,${110+Math.sin(t*3+x)*30|0},40,.9)`; ctx.beginPath(); ctx.ellipse(x,y,9*s,6*s,0,0,TAU); ctx.fill(); glowAt(x,y,28*s,'255,110,40',0.35); } else if(o.dk==='lamp'){ ctx.fillStyle='#4a2e18'; ctx.fillRect(x-2,y-2,4,14); ctx.fillStyle='#ffcf6a'; ctx.beginPath(); ctx.arc(x,y-4,5,0,TAU); ctx.fill(); glowAt(x,y-4,30,'255,200,100',0.4); } break; }
  }
}
function r2CaveR(){ return R2.caveR||(R2.caveR={st:'cave',seed:1,x0:0,y0:0,W:0,H:0,wood:R2WOOD.oak,fab:R2FAB[7],flames:[],glows:[],wl:{k:'stone',c:['#5a5a5a']},S0:{},rug:{c:R2FAB[7]},rugP:'braid'}); }
function drawHatShape(x,y,k,s){
  s=s||1; ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  if(k==='party'){ ctx.fillStyle='#e84a8a'; ctx.beginPath(); ctx.arc(0,0,7,0,TAU); ctx.fill(); ctx.fillStyle='#ffd84a'; ctx.beginPath(); ctx.arc(0,0,3.5,0,TAU); ctx.fill(); ctx.fillStyle='#4ac8e8'; ctx.beginPath(); ctx.arc(0,0,1.5,0,TAU); ctx.fill(); }
  else if(k==='wizard'){ ctx.fillStyle='#3a3a9a'; ctx.beginPath(); ctx.arc(0,0,9,0,TAU); ctx.fill(); ctx.fillStyle='#5a5ad0'; ctx.beginPath(); ctx.arc(0,0,5,0,TAU); ctx.fill(); ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.arc(2,-2,1.5,0,TAU); ctx.fill(); }
  else if(k==='crown'){ for(let i=0;i<8;i++){ ctx.fillStyle=['#ff7aa0','#ffd84a','#fff','#b48cff'][i%4]; ctx.beginPath(); ctx.arc(Math.cos(i/8*TAU)*6,Math.sin(i/8*TAU)*6,2.4,0,TAU); ctx.fill(); } }
  else if(k==='top'){ ctx.fillStyle='#1a1a1e'; ctx.beginPath(); ctx.arc(0,0,9,0,TAU); ctx.fill(); ctx.fillStyle='#2a2a30'; ctx.beginPath(); ctx.arc(0,0,6,0,TAU); ctx.fill(); ctx.strokeStyle='#8a2e22'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,6,0,TAU); ctx.stroke(); }
  else if(k==='chef'){ ctx.fillStyle='#f4f2ea'; ctx.beginPath(); ctx.arc(0,0,7,0,TAU); ctx.fill(); ctx.fillStyle='#e0dcd0'; ctx.beginPath(); ctx.arc(-2,-2,3,0,TAU); ctx.fill(); }
  else if(k==='straw'){ ctx.fillStyle='#d8b860'; ctx.beginPath(); ctx.arc(0,0,9,0,TAU); ctx.fill(); ctx.fillStyle='#b8983a'; ctx.beginPath(); ctx.arc(0,0,5,0,TAU); ctx.fill(); }
  else if(k==='cap'){ ctx.fillStyle='#4a6a3a'; ctx.beginPath(); ctx.arc(0,0,6,0,TAU); ctx.fill(); ctx.fillRect(2,-3,6,6); }
  else if(k==='beanie'){ ctx.fillStyle='#c84a3a'; ctx.beginPath(); ctx.arc(0,0,6,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-1,0,2,0,TAU); ctx.fill(); }
  else if(k==='feather'){ ctx.fillStyle='#7a2a7a'; ctx.beginPath(); ctx.arc(0,0,7,0,TAU); ctx.fill(); ctx.strokeStyle='#ffd84a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-2,0); ctx.quadraticCurveTo(-10,-4,-14,4); ctx.stroke(); }
  else if(k==='helm'){ ctx.fillStyle=grad(-7,-7,7,7,'#c8ccd4','#5a5e66'); ctx.beginPath(); ctx.arc(0,0,7,0,TAU); ctx.fill(); }
  ctx.restore();
}

// ================= wilderness landmarks (static parts cached as sprites, live sparkle on top)
const R2WARDEN={iska:{c:'255,210,140',k:'lantern'},bram:{c:'255,170,110',k:'hammer'},oriel:{c:'255,220,170',k:'dragon'},sedge:{c:'200,230,150',k:'reed'},tove:{c:'190,220,255',k:'spear'}};
function r2Statue(who){ return r2S('statue_'+who,96,104,48,78,g=>{
  const W=R2WARDEN[who]||R2WARDEN.iska, rng=mulberry32(who.length*977+who.charCodeAt(0)), st=['#a8a49a','#9a968c','#b4b0a6'];
  r2e(g,6,14,36,13,'rgba(0,0,0,.28)');
  // plinth: two stepped blocks seen from the front-top
  r2rr(g,-30,-2,60,20,3,'#6a665e'); r2rr(g,-30,-8,60,10,3,'#8a867c'); g.fillStyle='rgba(255,255,255,.15)'; g.fillRect(-28,-8,56,1.4);
  r2rr(g,-22,-16,44,18,2,'#7a766c'); r2rr(g,-22,-21,44,8,2,'#a09c92'); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(-20,-21,40,1.2);
  r2rr(g,-13,-12,26,9,1,'#5a564e'); g.fillStyle='#d8c890'; g.font=`900 5.5px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(who.toUpperCase(),0,-7.4);
  for(let i=0;i<8;i++){ const mx=-28+rng()*56, my=6+rng()*10; r2e(g,mx,my,3+rng()*4,1.6+rng()*1.4,'rgba(110,140,70,.6)'); } r2e(g,-18,-10,5,2,'rgba(110,140,70,.55)');
  // the figure
  const fx=0, fy=-20; g.fillStyle=r2lg(g,-14,0,14,0,'#c8c4ba','#a8a49a','#76726a');
  g.beginPath(); g.moveTo(fx-13,fy); g.quadraticCurveTo(fx-12,fy-26,fx-7,fy-36); g.lineTo(fx+7,fy-36); g.quadraticCurveTo(fx+12,fy-26,fx+13,fy); g.closePath(); g.strokeStyle='rgba(40,36,30,.6)'; g.lineWidth=2; g.stroke(); g.fill();
  g.strokeStyle='rgba(60,55,50,.35)'; g.lineWidth=0.8; for(const k of [-6,0,6]){ g.beginPath(); g.moveTo(fx+k*0.6,fy-30); g.quadraticCurveTo(fx+k,fy-14,fx+k*1.3,fy); g.stroke(); }
  r2e(g,fx,fy-36,9,3.6,'#b4b0a6'); r2o(g,fx,fy-44,8,'rgba(40,36,30,.55)'); r2o(g,fx,fy-44,7,'#bcb8ae'); r2o(g,fx-2,fy-46,3,'rgba(255,255,255,.2)'); g.fillStyle='rgba(50,45,40,.55)'; g.fillRect(fx-3.4,fy-45,2,1); g.fillRect(fx+1.4,fy-45,2,1);
  const arm=(x0,y0,x1,y1)=>{ g.strokeStyle='#a8a49a'; g.lineWidth=4.4; g.lineCap='round'; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); g.lineCap='butt'; };
  if(W.k==='lantern'){ arm(fx+6,fy-32,fx+15,fy-46); r2l(g,fx+15,fy-48,fx+15,fy-51,'#8a867c',1.2); r2rr(g,fx+11,fy-58,8,9,2,'#e8d090'); r2rr(g,fx+10,fy-60,10,3,1,'#8a867c'); r2rr(g,fx+10,fy-49,10,2.4,1,'#8a867c'); arm(fx-6,fy-30,fx-9,fy-16); g.fillStyle='rgba(60,55,50,.5)'; g.fillRect(fx-4,fy-39,2.4,1); g.fillRect(fx+1.6,fy-39,2.4,1); }
  else if(W.k==='hammer'){ arm(fx-6,fy-30,fx-14,fy-38); arm(fx+6,fy-30,fx-10,fy-40); g.save(); g.translate(fx-12,fy-40); g.rotate(-0.7); r2rr(g,-1.6,-2,3.2,30,1,'#8a6a4a'); r2rr(g,-8,-10,16,10,2,'#8a867c'); g.fillStyle='rgba(255,255,255,.2)'; g.fillRect(-7,-10,14,1.6); g.restore(); g.fillStyle='#9a968c'; g.beginPath(); g.ellipse(fx,fy-40,6,5,0,0,Math.PI); g.fill(); }
  else if(W.k==='dragon'){ arm(fx+6,fy-30,fx+14,fy-34); arm(fx-6,fy-30,fx-10,fy-14); r2e(g,fx+14,fy-40,5,3.4,'#9aa088'); r2o(g,fx+18,fy-43,2.6,'#9aa088'); g.fillStyle='#8a9078'; g.beginPath(); g.moveTo(fx+12,fy-41); g.lineTo(fx+7,fy-50); g.lineTo(fx+16,fy-43); g.fill(); g.strokeStyle='#9aa088'; g.lineWidth=1.6; g.beginPath(); g.moveTo(fx+10,fy-38); g.quadraticCurveTo(fx+6,fy-34,fx+8,fy-30); g.stroke(); r2o(g,fx+19,fy-43.5,0.7,'#2a2a2a'); }
  else if(W.k==='reed'){ arm(fx-6,fy-30,fx-13,fy-26); r2l(g,fx-14,fy+2,fx-14,fy-58,'#8a867c',2); r2e(g,fx-14,fy-60,2.4,5,'#7a6a5a'); arm(fx+6,fy-30,fx+9,fy-16); r2e(g,fx+20,fy+6,5,3.6,'#7a9a5a'); r2o(g,fx+18,fy+3,1.6,'#e8e8c8'); r2o(g,fx+22,fy+3,1.6,'#e8e8c8'); r2o(g,fx+18,fy+3,0.7,'#1a1a1a'); r2o(g,fx+22,fy+3,0.7,'#1a1a1a'); }
  else { arm(fx+6,fy-30,fx+13,fy-24); r2l(g,fx+14,fy+4,fx+14,fy-62,'#8a867c',2); g.fillStyle='#c8ccd4'; g.beginPath(); g.moveTo(fx+14,fy-70); g.lineTo(fx+17,fy-60); g.lineTo(fx+11,fy-60); g.fill(); arm(fx-6,fy-30,fx-9,fy-16); g.fillStyle='#e8eef4'; g.beginPath(); g.ellipse(fx,fy-49,9,4,0,Math.PI,TAU); g.fill(); r2e(g,fx-9,fy-35,5,2,'#eef2f8'); r2e(g,fx+9,fy-35,5,2,'#eef2f8'); }
  // flowers left at the foot
  for(let i=0;i<5;i++){ const px=-26+i*13+rng()*4, py=14+rng()*3; r2l(g,px,py,px+(rng()-0.5)*2,py-4,'#4e8240',0.8); r2o(g,px,py-4.5,1.6,['#f0c030','#e84a6a','#f4f0e8','#b48cff','#f08a2a'][i]); }
}); }
function r2Well(){ return r2S('well',100,110,50,72,g=>{
  r2e(g,6,10,32,14,'rgba(0,0,0,.28)');
  g.fillStyle='#6a645a'; g.beginPath(); g.ellipse(0,4,26,12,0,0,Math.PI); g.lineTo(-26,-6); g.ellipse(0,-6,26,12,0,Math.PI,0,true); g.closePath(); g.fill();
  const rng=mulberry32(4242); for(let row=0;row<2;row++) for(let i=0;i<9;i++){ const a=Math.PI*(i+0.5+(row%2)*0.5)/9, sx=Math.cos(a)*25, sy=Math.sin(a)*11; r2rr(g,sx-4,sy-5+row*6,8,5.4,1.5,r2c(r2pk(rng,['#a59c90','#958c80','#b0a89a']),(rng()-0.5)*0.15)); }
  r2e(g,0,-6,26,12,'#8a8478'); r2e(g,0,-6,21,9,'#a59c90'); r2e(g,0,-5,17,7,'#10202a'); g.fillStyle=r2rg(g,0,-4,1,16,'#2a5060','#10202a'); g.beginPath(); g.ellipse(0,-4,15,6,0,0,TAU); g.fill();
  for(const s of [-1,1]){ r2wood(g,s*23-2.5,-46,5,44,'#6a4428',rng,44,1); }
  r2l(g,-21,-36,21,-36,'#4a2e18',2.4); r2o(g,23,-36,2.4,'#3a2414'); g.strokeStyle='#4a2e18'; g.lineWidth=1.6; g.beginPath(); g.moveTo(25,-36); g.lineTo(29,-32); g.lineTo(29,-28); g.stroke();
  r2l(g,4,-36,4,-18,'#b89858',0.9); r2rr(g,0,-20,8,7,1.5,'#7a5434'); r2l(g,0,-18,8,-18,'#3a3a40',0.8);
  g.fillStyle='#9a3a2a'; g.beginPath(); g.moveTo(-34,-42); g.lineTo(0,-64); g.lineTo(34,-42); g.lineTo(30,-39); g.lineTo(0,-58); g.lineTo(-30,-39); g.closePath(); g.fill();
  g.fillStyle='#b8483a'; g.beginPath(); g.moveTo(-34,-42); g.lineTo(0,-64); g.lineTo(0,-58); g.lineTo(-30,-39); g.closePath(); g.fill();
  g.strokeStyle='rgba(60,20,10,.5)'; g.lineWidth=0.7; for(let k=1;k<5;k++){ const t=k/5; g.beginPath(); g.moveTo(-34*(1-t)+0*t,-42*(1-t)-64*t); g.lineTo(34*(1-t),-42*(1-t)-64*t); g.stroke(); }
  r2l(g,-34,-42,0,-64,'#5a2014',1.4); r2l(g,0,-64,34,-42,'#5a2014',1.4);
}); }
function r2Barkley(){ return r2S('barkley',176,180,88,124,g=>{
  const rng=mulberry32(707);
  r2e(g,8,12,42,16,'rgba(0,0,0,.3)');
  // roots
  g.fillStyle='#5a3a22'; for(const [a,l] of [[-0.3,30],[0.35,28],[2.8,30],[3.4,26],[1.57,18]]){ g.beginPath(); g.moveTo(Math.cos(a-0.25)*14,6+Math.sin(a-0.25)*6); g.quadraticCurveTo(Math.cos(a)*l*0.7,10+Math.sin(a)*8,Math.cos(a)*l,10+Math.sin(a)*8); g.quadraticCurveTo(Math.cos(a)*l*0.7,12+Math.sin(a)*8,Math.cos(a+0.25)*14,8+Math.sin(a+0.25)*6); g.fill(); }
  // trunk
  g.fillStyle=r2lg(g,-24,0,24,0,'#8a6440','#6a4a2c','#3e2a18'); g.beginPath(); g.moveTo(-22,10); g.quadraticCurveTo(-26,-20,-18,-46); g.lineTo(18,-46); g.quadraticCurveTo(26,-20,22,10); g.quadraticCurveTo(0,16,-22,10); g.fill();
  g.strokeStyle='rgba(40,25,12,.5)'; g.lineWidth=1; for(let i=0;i<9;i++){ const bx=-18+i*4.5+(rng()-0.5)*2; g.beginPath(); g.moveTo(bx,8); g.quadraticCurveTo(bx+(rng()-0.5)*6,-18,bx+(rng()-0.5)*4,-44); g.stroke(); }
  // canopy
  for(let i=0;i<16;i++){ const a=rng()*TAU, d=rng()*40, cx=Math.cos(a)*d*1.2, cy=-62+Math.sin(a)*d*0.6, r=16+rng()*14; r2o(g,cx+3,cy+5,r,'rgba(10,30,8,.35)'); }
  for(let i=0;i<22;i++){ const a=rng()*TAU, d=rng()*40, cx=Math.cos(a)*d*1.25, cy=-64+Math.sin(a)*d*0.6, r=14+rng()*12; g.fillStyle=r2rg(g,cx-r*0.3,cy-r*0.4,1,r,'#7aa848','#3e7024','#24481a'); g.beginPath(); g.arc(cx,cy,r,0,TAU); g.fill(); }
  for(let i=0;i<40;i++){ r2o(g,(rng()-0.5)*90,-64+(rng()-0.5)*50,1.4+rng()*1.6,'rgba(170,210,110,.6)'); }
  // the face: brows, eye hollows, nose knot, moss beard
  r2e(g,-8,-14,6.4,6,'#2a1a0e'); r2e(g,8,-14,6.4,6,'#2a1a0e');
  g.strokeStyle='#4a301a'; g.lineWidth=3; g.lineCap='round'; g.beginPath(); g.moveTo(-15,-22); g.quadraticCurveTo(-9,-26,-3,-22); g.moveTo(3,-22); g.quadraticCurveTo(9,-26,15,-22); g.stroke(); g.lineCap='butt';
  g.fillStyle='#7a5434'; g.beginPath(); g.ellipse(0,-6,4,6,0,0,TAU); g.fill(); r2o(g,-1,-8,1.6,'rgba(255,230,190,.25)');
  g.fillStyle='#2a1a0e'; g.beginPath(); g.ellipse(0,3,9,4.6,0,0,Math.PI); g.fill();
  for(let i=0;i<14;i++){ const bx=-12+rng()*24, by=6+rng()*4; r2e(g,bx,by+3,2.4,4+rng()*3,i%2?'#6a8a3a':'#5a7a32'); }
  r2e(g,-16,-36,5,2.4,'rgba(110,150,60,.7)'); r2e(g,14,-30,4,2,'rgba(110,150,60,.7)');
}); }
function r2IceBlock(){ return r2S('iceblock',70,76,35,46,g=>{
  r2e(g,5,24,28,9,'rgba(0,0,0,.25)');
  // the adventurer (under the ice)
  g.fillStyle='#4a6a3a'; rrect(g,-8,-8,16,20,5); g.fill(); r2rr(g,-8,8,6,10,2,'#5a4030'); r2rr(g,2,8,6,10,2,'#5a4030');
  r2o(g,0,-14,6.4,'#e8b898'); g.fillStyle='#8a8a94'; g.beginPath(); g.arc(0,-16,7,Math.PI,TAU); g.fill(); r2rr(g,-7.4,-17,14.8,2.4,1,'#6a6a74'); r2o(g,-2.4,-13.4,0.9,'#1a1a1a'); r2o(g,2.4,-13.4,0.9,'#1a1a1a'); g.strokeStyle='#1a1a1a'; g.lineWidth=0.9; g.beginPath(); g.arc(0,-11.6,2.4,0.2,Math.PI-0.2); g.stroke();
  g.strokeStyle='#4a6a3a'; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.moveTo(6,-4); g.lineTo(13,-11); g.stroke(); g.lineCap='butt'; r2o(g,14,-13,3,'#e8b898'); r2rr(g,13,-20,2.6,6,1.2,'#e8b898');
  g.strokeStyle='#5a4030'; g.lineWidth=3; g.beginPath(); g.moveTo(-6,-4); g.lineTo(-11,4); g.stroke(); r2l(g,-12,4,-14,-16,'#a8acb4',1.6);
  // ice: front face, top face, rim highlights
  g.fillStyle='rgba(170,215,245,.62)'; rrect(g,-25,-26,50,48,6); g.fill(); g.fillStyle='rgba(220,240,255,.55)'; g.beginPath(); g.moveTo(-25,-26); g.lineTo(25,-26); g.lineTo(20,-34); g.lineTo(-20,-34); g.closePath(); g.fill();
  g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-20,-34); g.lineTo(20,-34); g.lineTo(25,-26); g.moveTo(-20,-34); g.lineTo(-25,-26); g.stroke(); g.strokeStyle='rgba(110,160,210,.85)'; g.lineWidth=1.6; rrect(g,-25,-26,50,48,6); g.stroke();
  g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(-20,-22); g.lineTo(-14,-22); g.lineTo(-20,10); g.lineTo(-22,10); g.closePath(); g.fill(); g.fillRect(14,-20,3,8);
  g.strokeStyle='rgba(255,255,255,.4)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(8,8); g.lineTo(16,2); g.lineTo(20,12); g.moveTo(-6,16); g.lineTo(0,10); g.stroke();
  for(let i=0;i<7;i++){ const a=i*0.9; r2e(g,Math.cos(a)*26,22+Math.sin(a)*3,5,2.2,'rgba(240,248,255,.9)'); }
}); }
function r2Snowman(v){ return r2S('snowman'+(v%3),60,78,30,54,g=>{
  r2e(g,6,14,20,8,'rgba(0,0,0,.2)');
  g.fillStyle=r2rg(g,-5,-2,2,20,'#ffffff','#e8eef6','#b8c8d8'); g.beginPath(); g.arc(0,6,15,0,TAU); g.fill();
  g.fillStyle=r2rg(g,-4,-16,1,14,'#ffffff','#eaf0f6','#bccad8'); g.beginPath(); g.arc(0,-12,11,0,TAU); g.fill();
  g.fillStyle=r2rg(g,-3,-30,1,10,'#ffffff','#eef2f8','#c4d0dc'); g.beginPath(); g.arc(0,-27,8.4,0,TAU); g.fill();
  for(const yy of [-14,-9,-4]) r2o(g,0,yy,1.3,'#2a2a2e');
  r2o(g,-3,-29,1.4,'#2a2a2e'); r2o(g,3,-29,1.4,'#2a2a2e'); for(let i=-2;i<=2;i++) r2o(g,i*1.8,-24+Math.abs(i)*-0.6+1.4,0.8,'#2a2a2e');
  g.fillStyle='#ff8a2a'; g.beginPath(); g.moveTo(0,-28); g.lineTo(9,-26); g.lineTo(0,-25.4); g.fill();
  const sc=['#c84a3a','#3a6ac8','#4a9a4a'][v%3]; r2rr(g,-9,-20,18,4,2,sc); r2rr(g,4,-18,4,10,1.5,sc); g.fillStyle='rgba(255,255,255,.4)'; for(let k=-7;k<8;k+=4) g.fillRect(k,-20,1.6,4);
  r2l(g,-10,-12,-21,-20,'#5a3a20',1.6); r2l(g,-17,-17,-19,-22,'#5a3a20',1.2); r2l(g,10,-12,21,-18,'#5a3a20',1.6); r2l(g,18,-16,22,-13,'#5a3a20',1.2);
  if(v%3===0){ r2rr(g,-8,-38,16,3,1,'#1a1a1e'); r2rr(g,-5.4,-47,10.8,10,1,'#2a2a30'); r2rr(g,-5.4,-40,10.8,2,0,'#c84a3a'); } else if(v%3===1){ g.fillStyle='#6a6a74'; g.beginPath(); g.moveTo(-7,-34); g.lineTo(7,-34); g.lineTo(5,-42); g.lineTo(-5,-42); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(-5,-41,2,6); } else { g.fillStyle=sc; g.beginPath(); g.arc(0,-33,7.4,Math.PI,TAU); g.fill(); r2o(g,0,-41,2.4,'#ffffff'); }
}); }
function r2Hive(){ return r2S('hive',50,60,25,40,g=>{
  r2e(g,4,14,16,6,'rgba(0,0,0,.25)'); r2l(g,-8,14,-6,0,'#5a3a20',2.4); r2l(g,8,14,6,0,'#5a3a20',2.4); r2rr(g,-14,-1,28,4,1,'#6a4428');
  for(let k=0;k<6;k++){ const ry=-4-k*5, rw=14-k*k*0.32; g.fillStyle=r2lg(g,-rw,0,rw,0,'#f0c860','#d8a038','#9a6a1a'); rrect(g,-rw,ry-3.4,rw*2,6,3); g.fill(); g.strokeStyle='rgba(120,80,20,.45)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(-rw+1,ry+2.4); g.lineTo(rw-1,ry+2.4); g.stroke(); }
  r2o(g,0,-35,3,'#d8a038'); r2e(g,0,-6,3.6,2.6,'#2a1a0a'); g.fillStyle='#e8a82a'; g.beginPath(); g.moveTo(-4,-2); g.quadraticCurveTo(-5,3,-3.6,5); g.quadraticCurveTo(-2.4,3,-2.6,-2); g.fill(); r2o(g,-3.6,5,1.2,'#f0b830');
  r2o(g,-5,-24,2.6,'rgba(255,255,255,.25)');
}); }
function r2Bee(x,y){ ctx.fillStyle='#f0c030'; ctx.beginPath(); ctx.ellipse(x,y,2.2,1.5,0,0,TAU); ctx.fill(); ctx.fillStyle='#1a1a1a'; ctx.fillRect(x-0.4,y-1.5,0.9,3); ctx.fillStyle='rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(x-0.4,y-2,1.3,0.8,-0.4,0,TAU); ctx.fill(); }
function r2Sign(){ return r2S('sign',64,52,32,30,g=>{
  r2e(g,4,14,10,4,'rgba(0,0,0,.25)'); r2rr(g,-2,-20,4,36,1,'#5a3a20'); g.fillStyle='rgba(255,230,190,.2)'; g.fillRect(-2,-20,1,36);
  const board=(y,dir,col)=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(-18*dir+1,y+1); g.lineTo(18*dir+1,y+1); g.lineTo(24*dir+1,y+6); g.lineTo(18*dir+1,y+11); g.lineTo(-18*dir+1,y+11); g.closePath(); g.fill(); g.fillStyle=col; g.beginPath(); g.moveTo(-18*dir,y); g.lineTo(18*dir,y); g.lineTo(24*dir,y+5); g.lineTo(18*dir,y+10); g.lineTo(-18*dir,y+10); g.closePath(); g.fill(); g.strokeStyle='rgba(40,25,10,.55)'; g.lineWidth=0.8; g.stroke(); g.strokeStyle='rgba(40,25,10,.45)'; g.lineWidth=1; g.beginPath(); g.moveTo(-13*dir,y+4); g.lineTo(10*dir,y+4); g.moveTo(-13*dir,y+7); g.lineTo(5*dir,y+7); g.stroke(); r2o(g,0,y+5,0.9,'#2a2018'); };
  board(-22,1,'#b08a5a'); board(-9,-1,'#a07a4a');
}); }
function r2Grave(){ return r2S('grave',60,60,30,34,g=>{
  r2e(g,3,8,16,6,'rgba(0,0,0,.25)'); g.fillStyle='#5a4a30'; g.beginPath(); g.ellipse(0,10,14,9,0,0,TAU); g.fill(); g.fillStyle='#6a8a3a'; for(let i=0;i<10;i++){ g.beginPath(); g.ellipse(-12+i*2.6,6+Math.sin(i)*3,1.4,2.6,0,0,TAU); g.fill(); }
  r2rr(g,-12,-20,25,26,8,'rgba(0,0,0,.3)'); g.fillStyle=r2lg(g,-12,-22,12,4,'#b8b4aa','#8a867c','#6a665e'); g.beginPath(); g.moveTo(-12,4); g.lineTo(-12,-12); g.arc(0,-12,12,Math.PI,TAU); g.lineTo(12,4); g.closePath(); g.fill(); g.strokeStyle='rgba(40,38,34,.5)'; g.lineWidth=0.8; g.stroke();
  g.fillStyle='#3a3834'; g.font=`900 5px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.font=`900 4.2px ${UIF}`; g.fillText('SIR REG',0,-12); g.font=`700 3.4px ${UIF}`; g.fillText('he tripped',0,-6); r2e(g,-6,2,3,1.6,'rgba(110,140,70,.6)');
  for(let i=0;i<3;i++){ r2l(g,6+i*2,10,5+i*2.6,5,'#4e8240',0.8); r2o(g,5+i*2.6,4.6,1.5,['#f0c030','#e84a6a','#f4f0e8'][i]); }
}); }
function r2Wagon(){ return r2S('wagon',140,110,70,58,g=>{
  const rng=mulberry32(99); g.rotate(0.22);
  r2e(g,6,10,48,22,'rgba(0,0,0,.3)');
  const wheel=(wx,wy,broken)=>{ r2o(g,wx+1,wy+2,10,'rgba(0,0,0,.3)'); g.strokeStyle='#3a2414'; g.lineWidth=2.6; g.beginPath(); g.arc(wx,wy,9,broken?0.6:0,broken?TAU-0.9:TAU); g.stroke(); g.lineWidth=1.3; for(let k=0;k<(broken?5:8);k++){ const a=k/8*TAU; g.beginPath(); g.moveTo(wx,wy); g.lineTo(wx+Math.cos(a)*8.4,wy+Math.sin(a)*8.4); g.stroke(); } r2o(g,wx,wy,2.4,'#5a5a64'); };
  wheel(-30,-22,false); wheel(30,-22,false); wheel(-30,24,false);
  r2rr(g,-40,-20,80,42,3,'#4a2e16'); r2wood(g,-38,-18,76,38,'#8a5e32',rng,8,2);
  g.fillStyle='rgba(225,215,195,.92)'; g.beginPath(); g.moveTo(-34,-20); g.quadraticCurveTo(0,-34,34,-20); g.lineTo(34,10); g.quadraticCurveTo(0,0,-34,10); g.closePath(); g.fill();
  g.strokeStyle='rgba(140,120,90,.6)'; g.lineWidth=1.6; for(let k=-24;k<=24;k+=12){ g.beginPath(); g.moveTo(k,-27+Math.abs(k)*0.25); g.quadraticCurveTo(k*1.05,-6,k,5-Math.abs(k)*0.1); g.stroke(); }
  g.fillStyle='rgba(40,30,20,.65)'; g.beginPath(); g.moveTo(10,-8); g.lineTo(22,-12); g.lineTo(18,-2); g.lineTo(24,4); g.lineTo(12,2); g.closePath(); g.fill();
  r2rr(g,-30,8,16,13,1,'#a07a4a'); r2l(g,-30,14,-14,14,'rgba(60,40,20,.6)',0.8); for(let i=0;i<4;i++){ r2o(g,-27+i*3.6,9,2.4,'#efe6f0'); r2e(g,-27+i*3.6,8,2.2,1.1,'#9a4a9a'); r2l(g,-27+i*3.6,7,-27+i*3.6,4.5,'#5a9a3a',1); } r2rr(g,-12,12,12,10,1,'#8a6a3a'); g.strokeStyle='#3a2414'; g.lineWidth=2.4; g.beginPath(); g.arc(38,30,8,-0.5,2.6); g.stroke(); g.fillStyle='#3a4a8a'; g.beginPath(); g.moveTo(-6,-26); g.quadraticCurveTo(4,-34,14,-26); g.lineTo(10,-25); g.lineTo(4,-29); g.lineTo(-1,-25); g.closePath(); g.fill(); r2l(g,4,-30,8,-16,'#4a2e18',1);
  r2l(g,40,-4,62,-8,'#5a3a1e',2.6); r2l(g,40,6,62,4,'#5a3a1e',2.6);
}); }
function r2Scarecrow(){ return r2S('scarecrow',80,80,40,50,g=>{
  r2e(g,4,16,14,5,'rgba(0,0,0,.25)'); r2rr(g,-2,-30,4,46,1,'#5a3a20'); r2rr(g,-26,-22,52,4,1.5,'#6a4428');
  g.fillStyle='#3a6a8a'; g.beginPath(); g.moveTo(-11,-22); g.lineTo(11,-22); g.lineTo(13,2); g.lineTo(-13,2); g.closePath(); g.fill(); r2rr(g,-6,-14,7,7,1,'#c84a3a'); g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=0.5; g.strokeRect(-6,-14,7,7);
  for(const s of [-1,1]){ g.fillStyle='#3a6a8a'; g.fillRect(s>0?10:-24,-24,14,6); g.fillStyle='#d8b860'; for(let k=0;k<4;k++){ g.beginPath(); g.moveTo(s*24,-23+k*1.5); g.lineTo(s*31,-26+k*3); g.lineTo(s*24,-21.5+k*1.5); g.fill(); } }
  g.fillStyle='#d8b860'; for(let k=-10;k<=10;k+=3){ g.beginPath(); g.moveTo(k,2); g.lineTo(k+1.5,8); g.lineTo(k+3,2); g.fill(); }
  r2o(g,0,-30,8.4,'#d8c08a'); g.strokeStyle='rgba(120,90,40,.5)'; g.lineWidth=0.5; for(let k=-6;k<=6;k+=3){ g.beginPath(); g.moveTo(k,-37); g.lineTo(k,-23); g.stroke(); }
  r2o(g,-3,-31,1.3,'#2a1a10'); r2o(g,3,-31,1.3,'#2a1a10'); g.strokeStyle='#2a1a10'; g.lineWidth=0.8; g.beginPath(); g.arc(0,-28.5,3.4,0.3,Math.PI-0.3); g.stroke(); for(let k=-2;k<=2;k++){ g.beginPath(); g.moveTo(k*1.4,-26.4+Math.abs(k)*-0.5); g.lineTo(k*1.4,-25); g.stroke(); }
  r2e(g,0,-37,14,4.4,'#b8983a'); g.fillStyle='#c8a848'; g.beginPath(); g.ellipse(0,-39,7.4,5,0,Math.PI,TAU); g.fill(); r2rr(g,-7.4,-40,14.8,2,0,'#8a3a2a');
  r2e(g,22,-28,4.4,3,'#1a1a22'); r2o(g,25,-31,2.4,'#1a1a22'); g.fillStyle='#d8b04a'; g.beginPath(); g.moveTo(26.6,-31); g.lineTo(30,-30.4); g.lineTo(26.6,-29.6); g.fill(); r2o(g,25.6,-31.6,0.6,'#fff');
}); }
function r2Ribs(){ return r2S('ribs',320,140,130,70,g=>{
  g.lineCap='round'; const bone='#e6dccb', sh='rgba(0,0,0,.25)';
  for(let i=-4;i<=4;i++){ const bx=i*24; for(const s of [-1,1]){ g.strokeStyle=sh; g.lineWidth=7; g.beginPath(); g.moveTo(bx+3,4); g.quadraticCurveTo(bx+s*4+12,s*36+4,bx+s*0+18,s*56+4); g.stroke(); } }
  g.strokeStyle=sh; g.lineWidth=10; g.beginPath(); g.moveTo(-108,4); g.quadraticCurveTo(0,-8,112,8); g.stroke();
  for(let i=-4;i<=4;i++){ const bx=i*24; for(const s of [-1,1]){ g.strokeStyle=bone; g.lineWidth=6; g.beginPath(); g.moveTo(bx,0); g.quadraticCurveTo(bx+s*4+9,s*34,bx+15,s*54); g.stroke(); g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(bx-1.5,0); g.quadraticCurveTo(bx+s*4+7,s*33,bx+13,s*53); g.stroke(); } }
  g.strokeStyle=bone; g.lineWidth=8; g.beginPath(); g.moveTo(-110,0); g.quadraticCurveTo(0,-12,110,4); g.stroke(); for(let i=-10;i<=10;i++){ const vx=i*10.5, vy=-((1-(i/10.5)**2)*6)+i*0.2; r2e(g,vx,vy,4.4,5.4,'#efe6d6'); r2e(g,vx+1,vy+1,1.6,2,'rgba(120,100,80,.35)'); }
  g.lineCap='butt';
  r2e(g,140,8,28,20,'rgba(0,0,0,.25)'); g.fillStyle=r2rg(g,128,-2,2,30,'#f4ecdc','#e6dccb','#b8ae9c'); g.beginPath(); g.ellipse(134,4,27,19,0.15,0,TAU); g.fill(); g.beginPath(); g.moveTo(150,-4); g.quadraticCurveTo(170,0,168,14); g.lineTo(150,16); g.fill();
  r2e(g,138,-2,6,5,'#3a3028'); r2e(g,124,-6,4,3.6,'#3a3028'); for(let k=0;k<5;k++){ g.fillStyle='#f4ecdc'; g.beginPath(); g.moveTo(152+k*3.4,14); g.lineTo(153.7+k*3.4,19); g.lineTo(155.4+k*3.4,14); g.fill(); }
  g.strokeStyle='#e6dccb'; g.lineWidth=4; g.beginPath(); g.moveTo(118,-14); g.quadraticCurveTo(110,-30,118,-38); g.stroke();
}); }
function r2Boat(fin){ return r2S('boat'+(fin?1:0),130,80,65,40,g=>{
  const rng=mulberry32(fin?7:8); r2e(g,4,8,50,18,'rgba(0,0,0,.25)');
  for(const sx of [-34,34]){ r2l(g,sx-8,14,sx-6,-2,'#6a4428',2.4); r2l(g,sx+8,14,sx+6,-2,'#6a4428',2.4); r2rr(g,sx-10,-4,20,4,1,'#7a5434'); }
  const hull=()=>{ g.beginPath(); g.moveTo(-48,0); g.quadraticCurveTo(-38,-20,0,-19); g.quadraticCurveTo(38,-20,50,-2); g.quadraticCurveTo(40,18,0,18); g.quadraticCurveTo(-38,18,-48,0); g.closePath(); };
  if(fin){ g.fillStyle=r2lg(g,0,-19,0,18,'#b07a46','#8a5a30','#5a3a1e'); hull(); g.fill(); g.strokeStyle='#efe6d6'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-44,0); g.quadraticCurveTo(0,6,46,-1); g.stroke(); g.save(); hull(); g.clip(); g.strokeStyle='rgba(40,20,8,.35)'; g.lineWidth=0.6; for(let k=-14;k<=14;k+=4.6){ g.beginPath(); g.moveTo(-50,k); g.quadraticCurveTo(0,k+3,50,k-1); g.stroke(); } g.restore(); r2rr(g,-8,-12,16,24,2,'#6a4428'); r2rr(g,18,-8,10,16,2,'#6a4428'); g.fillStyle='#2a4a8a'; g.font=`900 5px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.font=`900 4px ${UIF}`; g.fillText('BISCUIT II',-24,8); }
  else { g.strokeStyle='#5a3a1e'; g.lineWidth=4; g.beginPath(); g.moveTo(-48,0); g.lineTo(50,-2); g.stroke(); g.strokeStyle='#8a6a42'; g.lineWidth=2.6; for(let k=-36;k<=36;k+=9){ const hw=(1-(k/50)**2); g.beginPath(); g.moveTo(k,-18*hw); g.quadraticCurveTo(k+2,0,k,18*hw); g.stroke(); } g.strokeStyle='#9a7a4a'; g.lineWidth=2; hull(); g.stroke(); r2wood(g,-30,22,40,4,'#a07a4a',rng,4,1); r2wood(g,-26,26,36,4,'#8a6a42',rng,4,1); r2l(g,26,20,34,28,'#8a8a94',1.6); r2rr(g,22,18,6,4,1,'#5a3a1e'); }
}); }
function r2Spring(){ return r2S('spring',164,124,82,62,g=>{
  const rng=mulberry32(55);
  for(let i=0;i<18;i++){ const a=i/18*TAU, rx=Math.cos(a)*54, ry=Math.sin(a)*38; r2e(g,rx+2,ry+3,12+rng()*5,8+rng()*3,'rgba(0,0,0,.25)'); r2e(g,rx,ry,12+rng()*5,8+rng()*3,r2c(r2pk(rng,['#7a7a80','#6a6a70','#8a8a90']),(rng()-0.5)*0.2)); r2e(g,rx-2,ry-2.6,6,2.6,'rgba(255,255,255,.2)'); }
  for(let i=0;i<10;i++){ const a=rng()*TAU; r2e(g,Math.cos(a)*64,Math.sin(a)*46,8,3,'rgba(240,246,252,.85)'); }
  g.fillStyle=r2rg(g,-8,-6,4,52,'#9ae0e4','#5ab0bc','#2e6e80'); g.beginPath(); g.ellipse(0,0,48,33,0,0,TAU); g.fill();
  g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-14,-10,18,6,-0.2,0,TAU); g.fill();
  r2rr(g,30,-34,18,6,2,'#c84a3a'); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(30,-32,18,1); r2o(g,-42,-20,5,'#8a6a42'); r2o(g,-42,-20,3.6,'#a07a4a');
}); }
function r2Kettle(){ return r2S('kettle',50,50,25,26,g=>{
  for(let i=0;i<7;i++){ const a=i/7*TAU; r2e(g,Math.cos(a)*12,4+Math.sin(a)*7,4,3,'#7a746a'); } r2e(g,0,4,9,5,'#2a1a10'); for(let i=0;i<3;i++){ g.save(); g.translate(0,4); g.rotate(i*1.1); r2rr(g,-7,-1,14,2.4,1,'#5a3a1e'); g.restore(); }
  r2e(g,2,0,13,10,'rgba(0,0,0,.3)'); g.fillStyle=r2rg(g,-4,-6,1,14,'#9a9aa4','#5a5a64','#2a2a30'); g.beginPath(); g.ellipse(0,-3,12,10,0,0,TAU); g.fill(); r2e(g,0,-7,6,3,'#4a4a52'); r2o(g,0,-8,2,'#2a2a2e');
  g.strokeStyle='#3a3a40'; g.lineWidth=2.6; g.beginPath(); g.moveTo(10,-2); g.quadraticCurveTo(16,-4,19,-10); g.stroke(); g.strokeStyle='#2a2a2e'; g.lineWidth=1.6; g.beginPath(); g.arc(0,-6,9,Math.PI*1.1,Math.PI*1.9); g.stroke(); r2o(g,-5,-7,2.4,'rgba(255,255,255,.3)');
}); }
function r2Helm(){ return r2S('helm',60,50,30,26,g=>{
  r2e(g,3,6,15,8,'rgba(0,0,0,.25)'); for(let i=0;i<9;i++){ const a=i/9*TAU; r2l(g,Math.cos(a)*13,6+Math.sin(a)*6,Math.cos(a)*17,3+Math.sin(a)*7,'#4e8240',1); r2o(g,Math.cos(a)*18,3+Math.sin(a)*7,2.6,['#ff7aa0','#ffd84a','#fff','#b48cff','#ff9a52'][i%5]); r2o(g,Math.cos(a)*18,3+Math.sin(a)*7,0.9,'#f0c030'); }
  g.fillStyle=r2rg(g,-4,-6,1,15,'#b8bcc8','#6a707c','#2a2e36'); g.beginPath(); g.arc(0,0,12,Math.PI,TAU); g.lineTo(12,8); g.quadraticCurveTo(0,12,-12,8); g.closePath(); g.fill(); r2rr(g,-8,-1,16,3,1,'#120a08'); r2l(g,0,-12,0,-1,'#8a909c',1.4); for(const s of [-1,1]) r2o(g,s*9,4,1,'#c8ccd4'); r2o(g,-4,-6,2.6,'rgba(255,255,255,.3)');
  g.fillStyle='#c84a3a'; g.beginPath(); g.moveTo(0,-12); g.quadraticCurveTo(8,-20,14,-14); g.quadraticCurveTo(8,-15,0,-12); g.fill();
}); }
function r2Xmark(){ return r2S('xmark',60,50,30,25,g=>{
  r2e(g,0,2,20,11,'rgba(90,60,30,.45)'); const rng=mulberry32(3); for(let i=0;i<10;i++) r2o(g,(rng()-0.5)*30,2+(rng()-0.5)*16,1+rng()*1.6,'rgba(110,80,40,.6)');
  g.lineCap='round'; g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=7; g.beginPath(); g.moveTo(-10,-8); g.lineTo(12,12); g.moveTo(12,-8); g.lineTo(-10,12); g.stroke();
  g.strokeStyle='#d8322a'; g.lineWidth=6; g.beginPath(); g.moveTo(-12,-10); g.lineTo(10,10); g.moveTo(10,-10); g.lineTo(-12,10); g.stroke(); g.strokeStyle='rgba(255,180,160,.6)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-11,-11); g.lineTo(9,9); g.moveTo(9,-11); g.lineTo(-11,9); g.stroke(); g.lineCap='butt';
  r2l(g,16,10,24,-10,'#8a6a42',2.2); g.fillStyle='#8a8a94'; g.beginPath(); g.moveTo(14,12); g.lineTo(20,8); g.lineTo(18,16); g.closePath(); g.fill();
}); }
function drawLandmark(o,t){
  if(o.hidden&&o.hidden()&&o.k!=='pot'&&o.k!=='barrel') return;
  const x=o.x, y=o.y;
  switch(o.k){
    case 'pot': case 'barrel': if(o.broken&&G.worldTime-o.brokenT<=300){ r2Shards(x,y,o.k); return; } drawPot(x,y,o.k); return;
    case 'statue': { const S=1.22, W=R2WARDEN[o.who]||R2WARDEN.iska; glowAt(x,y-48*S,30*S,W.c,0.13+0.04*Math.sin(t*2)); r2put(r2Statue(o.who),x,y,S); if(W.k==='lantern'){ glowAt(x+15*S,y-73*S,(24+Math.sin(t*2)*2)*S,W.c,0.5); glowAt(x+15*S,y-73*S,7*S,'255,240,200',0.6); } if(Math.random()<0.03) emit(x+rand(-14,14),y-60+rand(-14,14),1,{col:W.c,ang:-Math.PI/2,spread:1,smin:5,smax:15,lmin:.8,lmax:1.4,zmin:1.5,zmax:2.4,rise:10}); return; }
    case 'wishwell': { r2put(r2Well(),x,y); for(let i=0;i<5;i++){ const tw=0.5+0.5*Math.sin(t*3+i*1.7); ctx.fillStyle=`rgba(255,216,74,${0.5+0.5*tw})`; ctx.beginPath(); ctx.arc(x+Math.cos(i*1.3)*8,y-4+Math.sin(i*1.3)*3,1.4+tw*0.6,0,TAU); ctx.fill(); } glowAt(x,y-4,26,'255,220,120',0.18+0.08*Math.sin(t*2)); return; }
    case 'facetree': { r2put(r2Barkley(),x,y); const blink=Math.sin(t*0.7)>0.97, lk=Math.sin(t*0.4)*1.6; if(!blink){ for(const s of [-1,1]){ ctx.fillStyle='#ffe9a0'; ctx.beginPath(); ctx.ellipse(x+s*8+lk*0.5,y-14,3.4,3.8,0,0,TAU); ctx.fill(); ctx.fillStyle='#2a1a0a'; ctx.beginPath(); ctx.arc(x+s*8+lk,y-13.6,1.6,0,TAU); ctx.fill(); } glowAt(x,y-14,20,'255,230,150',0.18); } else { ctx.strokeStyle='#ffe9a0'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x-11,y-14); ctx.lineTo(x-5,y-14); ctx.moveTo(x+5,y-14); ctx.lineTo(x+11,y-14); ctx.stroke(); } return; }
    case 'fairyring': { for(let i=0;i<12;i++){ const a=i/12*TAU, mx=x+Math.cos(a)*44, my=y+Math.sin(a)*34; ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(mx+2,my+4,6,2.6,0,0,TAU); ctx.fill(); ctx.fillStyle='#efe4cc'; ctx.fillRect(mx-1.6,my-1,3.2,5.6); r2put(r2S('shroom'+(i%2),20,16,10,9,g=>{ g.fillStyle=r2lg(g,0,-6,0,3,i%2?'#e85a3a':'#d8322a','#8a1a14'); g.beginPath(); g.ellipse(0,0,6.6,4.6,0,Math.PI,TAU); g.quadraticCurveTo(0,2.4,-6.6,0); g.fill(); r2o(g,-2.4,-2.4,1.1,'#fff'); r2o(g,2,-3,0.9,'#fff'); r2o(g,0.4,-1,0.7,'#fff'); }),mx,my); }
      const n=isNight()?7:3; for(let i=0;i<n;i++){ const a=t*0.8+i*1.3*(7/n); glowAt(x+Math.cos(a)*30,y+Math.sin(a*1.3)*22-6,isNight()?9:6,'200,255,200',isNight()?0.6:0.3); } return; }
    case 'ribs': r2put(r2Ribs(),x,y); return;
    case 'wagon': r2put(r2Wagon(),x,y); return;
    case 'scarecrow': { r2put(r2Scarecrow(),x,y); return; }
    case 'grave': r2put(r2Grave(),x,y); return;
    case 'iceblock': { if(G.flags.brisket_thawed){ ctx.fillStyle='rgba(150,190,220,.45)'; ctx.beginPath(); ctx.ellipse(x,y+6,28,13,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(x-8,y+3,8,2.4,0,0,TAU); ctx.fill(); return; } r2put(r2IceBlock(),x,y,1.12); const sp=(t*0.6)%1; glowAt(x-14+sp*30,y-20+Math.sin(t*2)*4,6,'255,255,255',0.6*(1-Math.abs(sp*2-1))); return; }
    case 'hotspring': { r2put(r2Spring(),x,y); ctx.strokeStyle=`rgba(255,255,255,${0.2+0.1*Math.sin(t*2)})`; ctx.lineWidth=1; for(let k=0;k<2;k++){ const r=10+((t*8+k*14)%28); ctx.beginPath(); ctx.ellipse(x+6,y+2,r,r*0.6,0,0,TAU); ctx.stroke(); } if(Math.random()<0.25) emit(x+rand(-36,36),y+rand(-24,24),1,{col:'235,240,245',glow:false,ang:-Math.PI/2,spread:0.4,smin:8,smax:20,lmin:1.2,lmax:2,zmin:5,zmax:10,grow:9,drag:0.4,alpha:0.5}); return; }
    case 'boatframe': r2put(r2Boat(!!(G.quests.lure&&G.quests.lure.done)),x,y); return;
    case 'prints': if(G.flags.clue_prints&&!(stepOf('gate'))) return; for(let i=0;i<9;i++){ const px=x+i*14+(i%2?5:-5), py=y-i*24; ctx.save(); ctx.translate(px,py); ctx.rotate(0.5); ctx.fillStyle='rgba(20,14,10,.55)'; ctx.beginPath(); ctx.ellipse(0,-2,3.6,5,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0,5.4,3,2.6,0,0,TAU); ctx.fill(); ctx.restore(); } glowAt(x+50,y-90,40,'255,220,120',0.08+0.05*Math.sin(t*3)); return;
    case 'kettle': if(G.items.kettle) return; r2put(r2Kettle(),x,y,1.15); glowAt(x,y+5,16,'255,150,70',0.2+0.05*Math.sin(t*6)); { const k=(t*0.8)%1; ctx.strokeStyle=`rgba(255,230,160,${0.45*(1-k)})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x,y+2,16+k*14,9+k*8,0,0,TAU); ctx.stroke(); } if(Math.random()<0.1) emit(x+18,y-10,1,{col:'230,230,230',glow:false,ang:-Math.PI/2,spread:0.3,smin:15,smax:30,lmin:0.8,lmax:1.4,zmin:2,zmax:5,grow:5,drag:0.5}); return;
    case 'helm': r2put(r2Helm(),x,y); return;
    case 'greywolf': ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x+6,y+8,46,24,0,0,TAU); ctx.fill(); drawWolf({x,y,face:Math.PI*0.8+Math.sin(t*0.3)*0.2,t,dx:0,dy:0},false,2.0,true,true); if(Math.sin(t*0.9)>0.9) glowAt(x-30,y-40,10,'255,140,170',0.5); return;
    case 'snowman': { if(G.found[o.id]){ ctx.fillStyle='rgba(180,210,235,.5)'; ctx.beginPath(); ctx.ellipse(x,y+6,20,10,0,0,TAU); ctx.fill(); ctx.fillStyle='#ff8a2a'; ctx.beginPath(); ctx.moveTo(x-4,y+4); ctx.lineTo(x+6,y+5.5); ctx.lineTo(x-4,y+7); ctx.fill(); ctx.fillStyle='#2a2a2e'; for(const [dx,dy] of [[-10,8],[8,2],[12,9]]){ ctx.beginPath(); ctx.arc(x+dx,y+dy,1.4,0,TAU); ctx.fill(); } const v=Number(String(o.id).slice(-1))||0; ctx.fillStyle=['#c84a3a','#3a6ac8','#4a9a4a'][v%3]; ctx.fillRect(x+2,y+9,12,3); return; } const v=Number(String(o.id).slice(-1))||0; r2put(r2Snowman(v),x,y); return; }
    case 'beehive': { r2put(r2Hive(),x,y,1.25); const calm=G.found[o.id]; if(!calm){ for(let i=0;i<6;i++){ const a=t*4.6+i*1.1, r=15+Math.sin(t*3+i)*6; r2Bee(x+Math.cos(a)*r*1.2,y-18+Math.sin(a*1.3)*r*0.7); } } else { r2Bee(x+12,y-2); ctx.fillStyle='rgba(255,255,255,.75)'; ctx.font=`900 7px ${UIF}`; ctx.textAlign='center'; ctx.fillText('z',x+16+Math.sin(t)*2,y-24-((t*6)%8)); } return; }
    case 'frostberry': { const k='berry_'+o.id, ripe=!(G.found[k]&&G.worldTime-G.found[k]<240); drawSprite(SPR.fshrub[o.id.length%3],x,y,1.1,0); if(ripe){ for(let i=0;i<7;i++){ const bx=x+Math.cos(i*1.1)*8, by=y+Math.sin(i*1.1)*7; ctx.fillStyle='#2a4a7a'; ctx.beginPath(); ctx.arc(bx+0.5,by+0.6,2.6,0,TAU); ctx.fill(); ctx.fillStyle='#7ac0ff'; ctx.beginPath(); ctx.arc(bx,by,2.5,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(bx-0.8,by-0.8,0.8,0,TAU); ctx.fill(); } glowAt(x,y,20,'150,200,255',0.2+0.06*Math.sin(t*2+x)); } return; }
    case 'sign': r2put(r2Sign(),x,y); return;
    case 'fishspot': { const a=0.25+0.15*Math.sin(t*2+x); ctx.strokeStyle=`rgba(230,240,255,${a})`; ctx.lineWidth=1.5; for(let k=0;k<3;k++){ const r=6+((t*12+k*8)%22); ctx.beginPath(); ctx.ellipse(x,y,r,r*0.55,0,0,TAU); ctx.stroke(); } const fa=t*0.7+x; ctx.fillStyle='rgba(20,40,60,.35)'; ctx.beginPath(); ctx.ellipse(x+Math.cos(fa)*10,y+Math.sin(fa)*5,5,2,fa+Math.PI/2,0,TAU); ctx.fill(); const jp=(t*0.5+x*0.01)%3; if(jp<0.4){ const k=jp/0.4; ctx.fillStyle='#b8c8d8'; ctx.beginPath(); ctx.ellipse(x-6+k*12,y-Math.sin(k*Math.PI)*10,3.6,1.6,-0.6+k*1.2,0,TAU); ctx.fill(); } return; }
    case 'xmark': r2put(r2Xmark(),x,y,1.2); glowAt(x,y,28,'255,120,80',0.15+0.1*Math.sin(t*3)); if(Math.random()<0.04) emit(x+rand(-10,10),y+rand(-8,8),1,{col:'255,230,140',ang:-Math.PI/2,spread:1,smin:10,smax:25,lmin:.5,lmax:.9,zmin:1.5,zmax:2.5,rise:12}); return;
  }
}
// ---------- cave mouths: a dark opening in a rocky hillside, themed
const R2CAVE={earth:{rk:['#8a7a6a','#7a6a5a','#6a5a4c'],top:'#4e7a34',dark:'#0a0806'},crystal:{rk:['#6a6080','#5a5070','#7a7090'],top:'#4e6a4a',dark:'#0c0814'},mine:{rk:['#8a7a68','#7a6a58','#6a5a4a'],top:'#6a7a3a',dark:'#0a0806'},bog:{rk:['#5a6448','#4a5438','#6a7458'],top:'#3e5a2a',dark:'#060a04'},ice:{rk:['#b8c8d8','#a0b0c4','#8a9ab0'],top:'#f0f6fa',dark:'#06101a'},ember:{rk:['#4a3430','#3a2a26','#5a3e38'],top:'#2a1e1c',dark:'#120604'}};
function r2Cave(th){ return r2S('cave_'+th,270,196,135,138,g=>{
  const P=R2CAVE[th]||R2CAVE.earth, rng=mulberry32(th.length*331+th.charCodeAt(0));
  r2e(g,8,10,88,40,'rgba(0,0,0,.28)');
  // the hill behind: rocky lumps rising up and back
  const lumps=[]; for(let i=0;i<15;i++){ const a=Math.PI*1.02+i/14*Math.PI*0.96, d=60+rng()*22; lumps.push([Math.cos(a)*d*1.1,-8+Math.sin(a)*d*0.92,22+rng()*12]); }
  for(let i=0;i<6;i++) lumps.push([(rng()-0.5)*90,-70-rng()*20,24+rng()*10]);
  lumps.sort((a,b)=>a[1]-b[1]);
  for(const [lx,ly,lr] of lumps){ r2o(g,lx+3,ly+5,lr,'rgba(0,0,0,.25)'); }
  for(const [lx,ly,lr] of lumps){ const c=r2pk(rng,P.rk); g.fillStyle=r2rg(g,lx-lr*0.35,ly-lr*0.4,2,lr*1.05,r2c(c,0.22),c,r2c(c,-0.4)); g.beginPath(); for(let k=0;k<7;k++){ const a=k/7*TAU+rng()*0.3, rr=lr*(0.82+rng()*0.22); g.lineTo(lx+Math.cos(a)*rr,ly+Math.sin(a)*rr*0.85); } g.closePath(); g.fill(); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(lx-lr*0.4,ly+lr*0.1); g.lineTo(lx+lr*0.1,ly+lr*0.35); g.stroke(); }
  // a cap on top of the hill: grass, snow, moss or ash
  for(let i=0;i<26;i++){ const a=Math.PI*1.1+rng()*Math.PI*0.8, d=40+rng()*44, px=Math.cos(a)*d*1.1, py=-30+Math.sin(a)*d*0.85; if(th==='ice') r2e(g,px,py,9+rng()*8,4+rng()*3,'rgba(244,248,252,.92)'); else if(th==='ember'){ r2e(g,px,py,6+rng()*6,3,'rgba(30,22,20,.6)'); } else { r2e(g,px,py,4+rng()*5,2.2+rng()*1.6,r2a(P.top,0.8)); g.strokeStyle=r2c(P.top,0.15); g.lineWidth=1; for(let k=0;k<4;k++){ const bx=px-4+k*2.6+rng(); g.beginPath(); g.moveTo(bx,py+1); g.quadraticCurveTo(bx+(rng()-0.5)*3,py-3,bx+(rng()-0.5)*4,py-5-rng()*3); g.stroke(); } } }
  // the opening
  const mouth=(s)=>{ g.beginPath(); g.moveTo(-40*s,12); g.bezierCurveTo(-44*s,-14,-26*s,-44*s,0,-46*s); g.bezierCurveTo(26*s,-44*s,44*s,-14,40*s,12); g.quadraticCurveTo(0,20,-40*s,12); g.closePath(); };
  g.fillStyle=r2c(P.rk[2],-0.25); mouth(1.14); g.fill();
  g.fillStyle=r2lg(g,0,-46,0,14,'#000','#050404',P.dark); mouth(1); g.fill();
  g.fillStyle='rgba(255,255,255,.04)'; g.save(); mouth(1); g.clip(); r2e(g,0,8,30,8,'rgba(60,50,40,.35)'); g.restore();
  for(let i=0;i<8;i++){ const a=Math.PI+0.12+(i+rng()*0.5)/7.5*(Math.PI-0.24), rx=Math.cos(a)*47, ry=Math.sin(a)*46+5, c=r2pk(rng,P.rk), rs=8+rng()*7; g.fillStyle=r2rg(g,rx-rs*0.3,ry-rs*0.4,1,rs*1.1,r2c(c,0.22),c,r2c(c,-0.38)); g.beginPath(); for(let k=0;k<6;k++){ const aa=k/6*TAU+rng()*0.5, rr=rs*(0.72+rng()*0.32); g.lineTo(rx+Math.cos(aa)*rr,ry+Math.sin(aa)*rr*0.8); } g.closePath(); g.fill(); g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=0.8; g.stroke(); }
  // theme dressing
  if(th==='ice'){ g.fillStyle='rgba(225,242,255,.9)'; for(let i=0;i<9;i++){ const ix=-32+i*8+rng()*3, iy=-36+Math.abs(ix)*0.25+rng()*3, L=8+rng()*12; g.beginPath(); g.moveTo(ix-2.4,iy); g.lineTo(ix,iy+L); g.lineTo(ix+2.4,iy); g.fill(); } }
  else if(th==='crystal'){ for(let i=0;i<7;i++){ const a=Math.PI*(1.05+rng()*0.9), d=50+rng()*14, cx=Math.cos(a)*d, cy=Math.sin(a)*d*0.95+4; g.save(); g.translate(cx,cy); g.rotate((rng()-0.5)*0.9); g.fillStyle=r2pk(rng,['#c8a8ff','#a080f0','#e0d0ff']); g.beginPath(); g.moveTo(-3.6,4); g.lineTo(-3.6,-6); g.lineTo(0,-13-rng()*6); g.lineTo(3.6,-6); g.lineTo(3.6,4); g.fill(); g.fillStyle='rgba(255,255,255,.45)'; g.fillRect(-2.4,-6,1.4,9); g.restore(); } }
  else if(th==='mine'){ for(const s of [-1,1]) r2wood(g,s*34-4,-34,8,46,'#6a4a2a',rng,46,1); r2wood(g,-42,-42,84,9,'#7a5634',rng,9,1); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-40,-33,80,2); r2rr(g,-6,-58,30,10,1,'#8a6a3a'); g.fillStyle='#2a1a10'; g.font=`900 6px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('MINE',9,-52.6); for(let k=0;k<6;k++){ r2rr(g,-12,14+k*7,24,3,1,'#5a3a1e'); } r2l(g,-7,12,-9,56,'#8a8a94',1.4); r2l(g,7,12,9,56,'#8a8a94',1.4); g.strokeStyle='#2a2a2e'; g.lineWidth=1; g.beginPath(); g.moveTo(-30,-34); g.lineTo(-30,-28); g.stroke(); r2rr(g,-33,-28,6,7,1,'rgba(255,214,120,.9)'); }
  else if(th==='bog'){ for(let i=0;i<9;i++){ const rx=-30+i*7.5+rng()*3, ry=-38+Math.abs(rx)*0.2; g.strokeStyle=r2pk(rng,['#3e5a2a','#4e6a32','#5a4a2a']); g.lineWidth=1.2; g.beginPath(); g.moveTo(rx,ry); g.quadraticCurveTo(rx+(rng()-0.5)*6,ry+10,rx+(rng()-0.5)*4,ry+16+rng()*12); g.stroke(); } r2e(g,10,26,30,9,'rgba(40,60,40,.75)'); r2e(g,4,24,12,3,'rgba(160,200,160,.25)'); for(let i=0;i<4;i++){ const rx=-46+i*4; r2l(g,rx,22,rx+1,4,'#5a6a3a',1.2); r2e(g,rx+1,3,1.6,4,'#6a4a2a'); } }
  else if(th==='ember'){ g.strokeStyle='rgba(255,110,40,.75)'; g.lineWidth=1.2; for(let i=0;i<6;i++){ const a=Math.PI*(1.1+rng()*0.8), d=40+rng()*30; let px=Math.cos(a)*d, py=Math.sin(a)*d*0.85; g.beginPath(); g.moveTo(px,py); for(let k=0;k<3;k++){ px+=(rng()-0.5)*12; py+=rng()*7; g.lineTo(px,py); } g.stroke(); } }
  else { for(let i=0;i<5;i++){ const a=Math.PI*(1.1+rng()*0.8), d=44+rng()*10, fx=Math.cos(a)*d, fy=Math.sin(a)*d*0.95; for(let k=0;k<5;k++){ const fa=-Math.PI/2+(k-2)*0.45; g.fillStyle='#4e8a3a'; g.save(); g.translate(fx,fy); g.rotate(fa); g.beginPath(); g.ellipse(5,0,6,1.8,0,0,TAU); g.fill(); g.restore(); } } for(let i=0;i<5;i++){ const rx=-24+i*12, ry=-42+Math.abs(rx)*0.15; r2l(g,rx,ry,rx+(rng()-0.5)*5,ry+8+rng()*6,'#5a3a22',1); } }
  // path out of the cave
  g.fillStyle='rgba(110,90,60,.3)'; g.beginPath(); g.ellipse(0,26,30,10,0,0,TAU); g.fill(); for(let i=0;i<8;i++) r2o(g,(rng()-0.5)*50,22+rng()*14,1+rng()*1.6,r2c(P.rk[1],0.1));
}); }
function r2Gate(){ return r2S('cavegate',100,70,50,46,g=>{ g.fillStyle='rgba(0,0,0,.4)'; g.beginPath(); g.moveTo(-36,12); g.bezierCurveTo(-40,-12,-24,-40,0,-42); g.bezierCurveTo(24,-40,40,-12,36,12); g.closePath(); g.fill(); g.save(); g.clip(); for(let k=-30;k<=30;k+=8){ r2l(g,k+1.4,-46,k+1.4,14,'rgba(0,0,0,.4)',3); r2l(g,k,-46,k,14,'#5a5a66',3); r2l(g,k-0.8,-46,k-0.8,14,'rgba(220,225,235,.35)',0.8); } for(const yy of [-26,-4]){ r2l(g,-40,yy,40,yy,'#4a4a56',3.4); } g.restore(); r2rr(g,-8,-12,16,14,2,'#d8b04a'); r2rr(g,-6,-10,12,10,1,'#b8902a'); r2o(g,0,-6,2,'#3a2414'); g.fillRect(-0.8,-6,1.6,4); g.strokeStyle='#d8b04a'; g.lineWidth=2; g.beginPath(); g.arc(0,-12,5,Math.PI,TAU); g.stroke(); g.fillStyle='#7a5a1a'; for(let i=0;i<3;i++){ g.beginPath(); g.arc(-3+i*3,1.4,1.2,Math.PI,TAU); g.fill(); } }); }
function drawCaveMouth(s,t){
  const x=s.x, y=s.y, th=s.theme||'earth';
  r2put(r2Cave(th),x,y);
  if(th==='ember'){ glowAt(x,y-10,44,'255,100,40',0.3+0.08*Math.sin(t*3)); if(Math.random()<0.12) emit(x+rand(-20,20),y-40,1,{col:'70,62,60',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:30,lmin:1.4,lmax:2.2,zmin:5,zmax:9,grow:10,drag:0.5}); if(Math.random()<0.1) emit(x+rand(-24,24),y-6,1,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:10,smax:30,lmin:.4,lmax:.8,zmin:1.5,zmax:2.5}); }
  else if(th==='crystal'){ glowAt(x,y-14,40,'180,140,255',0.22+0.1*Math.sin(t*2)); for(let i=0;i<3;i++){ const a=t*0.7+i*2.1; glowAt(x+Math.cos(a)*50,y-24+Math.sin(a*1.4)*16,5,'230,210,255',0.55*(0.5+0.5*Math.sin(t*3+i))); } }
  else if(th==='mine'){ glowAt(x-30,y-24,22,'255,200,110',0.4+0.05*Math.sin(t*7)); }
  else if(th==='bog'){ if(isNight()) for(let i=0;i<4;i++){ const a=t*0.5+i*1.6; glowAt(x+Math.cos(a)*50,y-10+Math.sin(a*1.7)*20,5,'200,255,140',0.6); } }
  else if(th==='ice'){ const sp=(t*0.4)%1; glowAt(x-30+sp*60,y-36,5,'255,255,255',0.5*(1-Math.abs(sp*2-1))); }
  else { glowAt(x,y-8,30,'255,220,160',0.05); }
  if(AREADEFS[s.ref.area].locked&&!G.found[s.ref.area+'_unlocked']) r2put(r2Gate(),x,y);
}
function drawColumn(s){ const k=(s.broken?1:0)+'_'+Math.round(s.s*10); r2put(r2S('col'+k,100,110,40,80,g=>{
  const r=16*s.s, rng=mulberry32(Math.round(s.s*1000)+(s.broken?7:0)), H=s.broken?14+rng()*16:44*s.s, st='#b8b0a0';
  r2e(g,6,6,r+6,r*0.6+3,'rgba(0,0,0,.28)'); r2rr(g,-r-4,-4,r*2+8,8,2,'#8a8478'); r2e(g,0,-4,r+4,r*0.35+2,'#a8a294');
  g.fillStyle=r2lg(g,-r,0,r,0,'#d8d0c0',st,'#6a645a'); g.fillRect(-r,-4-H,r*2,H); g.strokeStyle='rgba(60,50,40,.3)'; g.lineWidth=1; for(let k2=-r+4;k2<r;k2+=5){ g.beginPath(); g.moveTo(k2,-4-H); g.lineTo(k2,-4); g.stroke(); }
  if(s.broken){ g.fillStyle='#c8c0b0'; g.beginPath(); g.moveTo(-r,-4-H); for(let k2=0;k2<=6;k2++){ g.lineTo(-r+k2*(r*2/6),-4-H-(k2%2?4:-2)-rng()*4); } g.lineTo(r,-4-H); g.closePath(); g.fill(); r2e(g,0,-4-H,r,r*0.3,'#a8a094'); r2e(g,r*1.8,6,r*1.1,r*0.42,'#8a8478',0.4); r2e(g,r*1.7,4,r*0.9,r*0.3,'#a8a294',0.4); }
  else { r2rr(g,-r-4,-10-H,r*2+8,8,2,'#c8c0b0'); r2e(g,0,-10-H,r+4,r*0.35+2,'#d8d0c4'); }
  if(rng()<0.6) r2e(g,-r*0.5,-6-rng()*H*0.5,r*0.5,3,'rgba(110,140,70,.55)');
}),s.x,s.y); }
function drawGlowShroom(s,t){ for(let i=0;i<4;i++){ const x=s.x+Math.cos(i*1.6)*9*s.s, y=s.y+Math.sin(i*1.6)*7*s.s; ctx.fillStyle='#d8e8f0'; ctx.fillRect(x-1,y,2,4); ctx.fillStyle='#7ad8e8'; ctx.beginPath(); ctx.ellipse(x,y,5*s.s,3.4*s.s,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x-1.2*s.s,y-1.2*s.s,1.6*s.s,0.9*s.s,0,0,TAU); ctx.fill(); } glowAt(s.x,s.y,22*s.s,'120,220,240',0.25+0.1*Math.sin(t*2+s.x)); }
function drawDoor(d){ if(!d.hs||d.hs.facade) return; const h=d.hs; ctx.fillStyle='#3a2414'; ctx.fillRect(h.x-13,h.y+h.h/2-4,26,8); ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.arc(h.x+7,h.y+h.h/2,1.6,0,TAU); ctx.fill(); }
function drawMarker(x,y,m,t){
  const bob=Math.sin(t*4)*2.5, c=m==='!'?'#ffcf4a':m==='?'?'#7fe0ff':'#b8b0a0';
  ctx.save(); ctx.translate(x,y+bob);
  ctx.fillStyle='rgba(10,8,6,.75)'; ctx.beginPath(); ctx.arc(0,0,9,0,TAU); ctx.fill(); ctx.strokeStyle=c; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=c; ctx.font=`900 13px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(m==='…'?'…':m,0,0.5);
  ctx.restore();
}
function drawTurtle(n){
  ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(n.face);
  for(const [lx,ly] of [[14,-14],[14,14],[-14,-14],[-14,14]]){ ctx.fillStyle='#7a9a5a'; ctx.beginPath(); ctx.ellipse(lx,ly,7,5,0,0,TAU); ctx.fill(); }
  ctx.fillStyle='#7a9a5a'; ctx.beginPath(); ctx.ellipse(26,0,9,7,0,0,TAU); ctx.fill(); ctx.fillStyle='#1a1a0a'; ctx.beginPath(); ctx.arc(30,-3,1.5,0,TAU); ctx.arc(30,3,1.5,0,TAU); ctx.fill();
  ctx.fillStyle=grad(-20,-18,20,18,'#8a7a4a','#4a3a20'); ctx.beginPath(); ctx.ellipse(0,0,22,18,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(30,20,10,.6)'; ctx.lineWidth=1.5; for(let i=0;i<6;i++){ const a=i/6*TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a)*7,Math.sin(a)*6); ctx.lineTo(Math.cos(a)*20,Math.sin(a)*16); ctx.stroke(); } ctx.beginPath(); ctx.ellipse(0,0,8,7,0,0,TAU); ctx.stroke();
  ctx.fillStyle='rgba(120,160,80,.5)'; ctx.beginPath(); ctx.arc(-6,-6,4,0,TAU); ctx.fill();
  ctx.restore();
}
// ---------- new foes for the caves
function drawBat(e,fl){
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.face); const f=Math.sin(e.t*26)*0.5+0.5, c=fl?'#fff':e.tint==='ice'?'#7a8aa8':e.tint==='ember'?'#7a2a1a':'#3a2a3a';
  ctx.fillStyle=c; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(2,0); ctx.quadraticCurveTo(-4,s*(10+f*8),-8,s*(14+f*6)); ctx.lineTo(-4,s*6); ctx.lineTo(-8,s*8); ctx.lineTo(-2,s*2); ctx.closePath(); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0,0,6,4.5,0,0,TAU); ctx.fill(); ctx.fillStyle='#ff4a3a'; ctx.beginPath(); ctx.arc(4,-1.6,1,0,TAU); ctx.arc(4,1.6,1,0,TAU); ctx.fill();
  ctx.restore();
}
function drawSlime(e,fl){
  const sq=1+Math.sin(e.t*8)*0.08+(e.hopT>0?0.15:0), s=e.small?0.6:1, c=e.tint==='ice'?['#c8e8ff','#5a8ac8']:e.tint==='ember'?['#ffb070','#c8401a']:e.tint==='crystal'?['#e0c8ff','#7a50c8']:['#b8f080','#4a9a3a'];
  ctx.save(); ctx.translate(e.x,e.y); ctx.scale(s*sq,s/sq);
  ctx.fillStyle=fl?'#fff':rg(0,0,14,{x:-0.6,y:-0.7},c[0],c[1],'rgba(20,40,10,.9)'); ctx.beginPath(); ctx.ellipse(0,0,14,12,0,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-5,-5,4,2.5,-0.5,0,TAU); ctx.fill();
  ctx.fillStyle='#1a1a0a'; ctx.beginPath(); ctx.arc(-4,0,1.8,0,TAU); ctx.arc(4,0,1.8,0,TAU); ctx.fill();
  ctx.restore();
}
