// ================= (v12 wave 11) INSIDE: interiors, caves and dungeons in the Realistic look
// Only LOOK.re reaches anything here; Storybook and Classic draw exactly as before. Hooks in the older files are one
// line each (an `if(LOOK.re) return ri...()` at the top of a draw function). Everything static is painted once into
// the cached room canvas (r2Base in a3b_art2.js) or the cave canvas (renderCaveRooms in a2f_caves.js), lit from the
// fixed art light (upper left, soft, slightly warm) with ambient occlusion baked where things meet. LIGHT draws the
// moving light on top (window shafts, hearths, Ash's flame), so no time of day is baked here. Sizes, anchors,
// footprints and collision never change: only the pixels inside them do.
//   1. shared: noise tables, a per-pixel painter, colour helpers
//   2. houses: floors, walls, the wall tops and doorway, rugs, the furniture layer (relit as one), soft shadows,
//      each act's own materials (brass in Gearhaven, heavy timber in Frostreach, pale sea stone in Moonfall)
//   3. live house objects (chests, crates, cobwebs, stairs and the rest) as cached lit sprites
//   4. caves and dungeons: rock floors, layered walls, each theme's materials, puzzle cells, puzzle objects

// ---------- 1. shared
const RI={gen:-1,m:new Map(),sh:null,st:{}};
function riCache(key,make){ if(RI.gen!==LOOK.gen){ RI.m.clear(); RI.gen=LOOK.gen; } let c=RI.m.get(key); if(c===undefined){ c=make(); RI.m.set(key,c); } return c; }
// 256 x 256 tileable noise: 'f' smooth fbm (features of about 64 px), 'w' white noise, 'r' ridged (thin lines)
const RIT={};
function riTab(k){
  if(RIT[k]) return RIT[k];
  const N=256, t=new Float32Array(N*N);
  if(k==='w'){ for(let i=0;i<N*N;i++) t[i]=rzHash(i&255,i>>8,91); return (RIT[k]=t); }
  const vn=(x,y,p,s)=>{ const X=x*p/N, Y=y*p/N, xi=Math.floor(X), yi=Math.floor(Y), fx=X-xi, fy=Y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy), h=(a,b)=>rzHash(((a%p)+p)%p,((b%p)+p)%p,s);
    const A=h(xi,yi), B=h(xi+1,yi), C=h(xi,yi+1), D=h(xi+1,yi+1); return A+(B-A)*u+(C-A)*v+(A-B-C+D)*u*v; };
  const P=k==='r'?[8,16,32]:[4,8,16,32,64], Wt=k==='r'?[0.6,0.3,0.1]:[0.5,0.25,0.13,0.07,0.05];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ let v=0; for(let o=0;o<P.length;o++) v+=Wt[o]*vn(x,y,P[o],k.length*31+o*7); t[y*N+x]=k==='r'?1-Math.abs(v*2-1):v; }
  return (RIT[k]=t);
}
// bilinear sample of a table at (x, y) table pixels, wrapping
function riS(t,x,y){ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, x0=xi&255, y0=yi&255, x1=(x0+1)&255, y1=(y0+1)&255;
  const a=t[(y0<<8)|x0], b=t[(y0<<8)|x1], c=t[(y1<<8)|x0], d=t[(y1<<8)|x1]; return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy; }
function riW(x,y){ return (RIT.w||riTab('w'))[((y&255)<<8)|(x&255)]; }   // the table may not exist yet (a cave's tiles can be made before any riPaint)
const riSm=(a,b,x)=>{ const t=x<=a?0:x>=b?1:(x-a)/(b-a); return t*t*(3-2*t); };
// paint w x h world px at k px per world px: fn(x, y, out) writes out[0..2] (0..255) and may set out[3] (alpha 0..1)
function riPaint(w,h,k,fn){
  const W=Math.max(1,Math.round(w*k)), H=Math.max(1,Math.round(h*k)), cv=mkCanvas(W,H), g=cv.getContext('2d'), id=g.createImageData(W,H), d=id.data, o=[0,0,0,1];
  riTab('f'); riTab('w'); riTab('r');
  for(let j=0;j<H;j++){ const y=(j+0.5)/k; for(let i=0;i<W;i++){ o[3]=1; fn((i+0.5)/k,y,o); const p=(j*W+i)*4; d[p]=o[0]<0?0:o[0]>255?255:o[0]; d[p+1]=o[1]<0?0:o[1]>255?255:o[1]; d[p+2]=o[2]<0?0:o[2]>255?255:o[2]; d[p+3]=o[3]>=1?255:o[3]<=0?0:o[3]*255; } }
  g.putImageData(id,0,0); return cv;
}
// a natural version of a painted colour: a little less saturated, a touch warmer
function riNat(c,sat){ const l=c[0]*0.3+c[1]*0.59+c[2]*0.11, s=sat==null?0.86:sat; return [l+(c[0]-l)*s+3,l+(c[1]-l)*s+1,l+(c[2]-l)*s-2]; }
const riHex=c=>typeof c==='string'?hexRGB(c.charCodeAt(0)===35?c:'#808080'):c;
function riSet(o,c,k){ o[0]=c[0]*k; o[1]=c[1]*k; o[2]=c[2]*k; }
const riStats=(k,ms)=>{ const s=RI.st[k]||(RI.st[k]={n:0,ms:0,max:0}); s.n++; s.ms+=ms; if(ms>s.max) s.max=ms; };

// ---------- 2. houses
// the act a house belongs to (by its town; floors above and below take their house's town)
function riRegion(A){
  const d=A&&A.def; if(!d) return 'e'; if(d._riReg) return d._riReg;
  let t=d.town||''; if(!t&&d.floorOf&&AREADEFS[d.floorOf]) t=AREADEFS[d.floorOf].town||'';
  const id=(d.floorOf||d.id)||'';
  const r=t==='c_gearhaven'?'brass':/^c_/.test(t)||/^h_c_|^h_n_c_/.test(id)?'coast':/^f_/.test(t)||/^h_f_|^h_n_f_/.test(id)?'frost':/^m_/.test(t)||/^h_m_|^h_n_m_/.test(id)?'moon':'e';
  return (d._riReg=r);
}
// the room's Realistic materials, chosen once from its style, region and seed (never changes the layout)
function riRoom(R){
  if(R.ri) return R.ri;
  const A=R.A, reg=riRegion(A), st=R.st, wk=R.wl.k, K=R.k||[0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];
  let floor=R.fl, wall=wk, fp=(R.flp||[]).map(riHex), wc=(R.wl.c||['#888']).map(riHex);
  const homey=st==='home'||st==='kid'||st==='farmer'||st==='knitter'||st==='fiddler'||st==='herbalist'||st==='cook'||st==='inn'||st==='baker'||st==='attic'||st==='guest'||st==='ash'||st==='yara';
  if(reg==='brass'){ if(wk==='timber'||wk==='stripes'||wk==='floral'||wk==='log') wall='brass'; else if(wk==='stone') wall='iron';
    if(floor!=='tile'&&floor!=='flags'&&floor!=='herring'&&floor!=='dirt'){ floor='oak'; fp=['#5a3e2a','#4e3624','#634430','#553a26'].map(hexRGB); } }
  else if(reg==='frost'){ if(wk==='timber'||wk==='stripes'||wk==='floral'||(homey&&wk!=='stone'&&wk!=='panel')) { wall='log'; wc=[hexRGB('#9a6a3e')]; }
    if(floor!=='tile'&&floor!=='flags'&&floor!=='herring'&&floor!=='dirt'&&floor!=='woven'){ floor='oak'; fp=['#b88a56','#c49662','#a87c4c','#be905c'].map(hexRGB); } }
  else if(reg==='moon'){ if(wk==='timber'||wk==='stripes'||wk==='floral'||wk==='log'||wk==='stone') { wall='seastone'; wc=[[214,206,190],[200,194,180],[224,218,204]]; }
    if(floor==='oak'||floor==='walnut'||floor==='honey'||floor==='red'||floor==='grey'||floor==='white'||floor==='flags'){ floor='flags'; fp=[[196,188,172],[186,180,166],[206,198,182],[178,172,160],[200,194,178]]; } }
  else if(reg==='coast'){ if(wk==='timber'&&homey){ wall='boards'; wc=[hexRGB('#d8d4c6'),hexRGB('#6a5a48')]; }
    if(floor==='oak'||floor==='walnut'||floor==='red'){ floor='grey'; fp=['#8e8678','#9a9284','#857e72','#948c7e'].map(hexRGB); } }
  if(floor==='grey'&&st==='attic'&&reg==='e') fp=['#8e7656','#9a8160','#83694c','#93795a','#7c6648'].map(hexRGB);   // the attic: old unvarnished pine
  return (R.ri={reg,floor,wall,fp:fp.map(c=>riNat(c,0.82)),wc,seed:(R.seed|0)*7+13,attic:st==='attic',K});
}

// ---- floors: one painter per material, all in floor-local world px (0..W, 0..H)
// exp(-t) for t >= 0 from a table (the painters call it millions of times)
const RIE=(()=>{ const a=new Float32Array(1025); for(let i=0;i<=1024;i++) a[i]=Math.exp(-i/64); return a; })();
function riE(t){ return t>=16?0:t<=0?1:RIE[(t*64)|0]; }
const RIY={y:NaN,W:0,H:0,ay:0,wy:0,wy2:0};
function riRowY(W,H,y){ const R=RIY; if(R.y===y&&R.W===W&&R.H===H) return R; R.y=y; R.W=W; R.H=H; R.ay=0.46*riE(y/20)+0.14*riE(y/64)+0.22*riE((H-y)/10); R.wy=riSm(0.25,0.85,y/H)*0.9; const q=(y-H*0.56)/(H*0.3); R.wy2=0.25*riE(q*q); return R; }
function riAO(W,H,x,y){ const R=riRowY(W,H,y); let a=1-R.ay-0.24*riE(x/16)-0.2*riE((W-x)/16); return a<0.3?0.3:a; }
function riWear(W,H,x,y){ const R=riRowY(W,H,y), dx=(x-W/2)/Math.max(60,W*0.13), q=(x-W/2)/(W*0.3); return riE(dx*dx)*R.wy+R.wy2*riE(q*q); }
function riPlanksFn(W,H,pal,ph,seed,o){
  o=o||{}; const rng=mulberry32(seed), rows=[], F=riTab('f'), Rr=riTab('r'), rough=o.rough||0;
  for(let y=0;y<H+ph;y+=ph){ const segs=[]; let x=-rng()*150; while(x<W){ const L=o.long?120+rng()*200:70+rng()*150, c=pal[Math.floor(rng()*pal.length)%pal.length], tone=0.88+rng()*0.22;
      segs.push({a:x,b:x+L,c:[c[0]*tone,c[1]*tone,c[2]*tone*(0.97+rng()*0.06)],s:rng()*256,f:0.7+rng()*0.9,kn:rng()<0.3?{x:x+14+rng()*(L-28),y:y+ph*(0.3+rng()*0.4),r:1.6+rng()*1.8}:null,gr:rng()<0.12}); x+=L; }
    rows.push(segs); }
  return (x,y,out)=>{
    const r=Math.floor(y/ph), t=y-r*ph, segs=rows[r]; let b=segs[0]; for(let i=0;i<segs.length;i++){ const s=segs[i]; if(x>=s.a&&x<s.b){ b=s; break; } }
    const c=b.c, n=riS(F,x*0.15+b.s*3,y*2+b.s), gl=riS(Rr,x*0.05+b.s*5,(y+(n-0.5)*7)*7*b.f+b.s), fib=riS(F,x*2.2+b.s*7,y*14);
    let k=0.92+0.16*(n-0.5)+0.06*(fib-0.5);
    if(gl>0.78) k-=0.14*(gl-0.78)/0.22;
    { const cu=Math.min(t,ph-t); if(cu<4) k*=0.94+0.015*cu; }
    if(b.kn){ const dx=(x-b.kn.x)/(b.kn.r*2.4), dy=(y-b.kn.y)/(b.kn.r), d=Math.sqrt(dx*dx+dy*dy); if(d<1) k*=0.62+0.3*d; else if(d<3) k-=0.05*Math.max(0,Math.sin(d*6))*(3-d)/2; }
    if(b.gr) k*=0.92;
    // the edges: a lit top bevel, a shaded bottom, a dark gap between boards, the board ends
    const tb=ph-t, ea=x-b.a, eb=b.b-x;
    if(t<1.1) k*=1.1; else if(tb<0.7) k*=0.34; else if(tb<1.9) k*=0.82;
    if(ea<0.7) k*=0.4; else if(ea<1.6) k*=1.07; if(eb<0.8) k*=0.5; else if(eb<1.8) k*=0.86;
    // two nail heads at each board end
    for(const nx of [b.a+4,b.b-4]){ const ddx=x-nx; if(ddx>-1.4&&ddx<1.4) for(const ny of [3.6,ph-3.8]){ const dd=ddx*ddx+(t-ny)*(t-ny); if(dd<1.4){ k*=dd<0.5?0.45:0.7; if(ddx<-0.2&&t<ny-0.1) k*=1.5; } } }
    if(rough){ const sc=riW((x*0.22)|0,(y*1.6)|0); if(sc>0.994) k*=0.82; }
    const ao=riAO(W,H,x,y), wr=riWear(W,H,x,y)*(o.wear==null?1:o.wear), sh=0.5+0.5*riS(F,x*0.35+40,y*0.35);
    k*=ao*(1+0.06*wr)*(0.97+0.06*sh);
    const l=(c[0]+c[1]+c[2])/3, ws=wr*0.25;
    out[0]=(c[0]+(l-c[0])*ws+wr*6)*k; out[1]=(c[1]+(l-c[1])*ws+wr*5)*k; out[2]=(c[2]+(l-c[2])*ws+wr*3)*k;
  };
}
// stone flags: a grid of cells merged into 1x1, 2x1, 1x2 and 2x2 stones, each with its own tone, rounded bevelled
// edges and recessed mortar, a little polish in the walked middle and the odd crack
function riFlagsFn(W,H,pal,sz,seed,o){
  o=o||{}; const c=Math.round(24*sz), cols=Math.ceil(W/c)+1, rows=Math.ceil(H/c)+1, id=new Int32Array(cols*rows).fill(-1), fl=[], rng=mulberry32(seed), F=riTab('f'), Rr=riTab('r');
  for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ if(id[j*cols+i]>=0) continue; const q=rng(); let w=1,h=1; const free=(a,b)=>i+a<cols&&j+b<rows&&id[(j+b)*cols+i+a]<0;
    if(q<0.28&&free(1,0)&&free(0,1)&&free(1,1)){ w=2; h=2; } else if(q<0.62&&free(1,0)) w=2; else if(q<0.8&&free(0,1)) h=2;
    const n=fl.length, p=pal[Math.floor(rng()*pal.length)%pal.length], tone=0.86+rng()*0.26; fl.push({x:i*c,y:j*c,w:w*c,h:h*c,c:[p[0]*tone,p[1]*tone,p[2]*tone],s:rng()*256,r:2+rng()*3.5,cr:rng()<0.12?{a:rng()*TAU,o:rng()*20}:null});
    for(let b=0;b<h;b++) for(let a=0;a<w;a++) id[(j+b)*cols+i+a]=n; }
  const mort=o.mort||[46,42,38];
  return (x,y,out)=>{
    const i=Math.min(cols-1,Math.floor(x/c)), j=Math.min(rows-1,Math.floor(y/c)), f=fl[id[j*cols+i]];
    const m=1.25, rr=f.r, lx=x-f.x-m, ly=y-f.y-m, w=f.w-2*m, h=f.h-2*m;
    // rounded-rectangle distance inside the stone (positive inside), jittered by noise so edges are not ruler straight
    const qx=Math.min(lx,w-lx), qy=Math.min(ly,h-ly), cx=Math.max(0,rr-qx), cy=Math.max(0,rr-qy);
    let d=(cx>0&&cy>0?rr-Math.sqrt(cx*cx+cy*cy):Math.min(qx,qy))+(riS(F,x*2.2,y*2.2)-0.5)*2.4;
    const ao=riAO(W,H,x,y);
    if(d<0){ const k=(0.75+0.3*riW(x*3|0,y*3|0))*ao*(d>-0.8?0.9:0.7); out[0]=mort[0]*k; out[1]=mort[1]*k; out[2]=mort[2]*k; return; }
    const n=riS(F,x*1.1+f.s,y*1.1+f.s*2), sp=riW(x*2|0,y*2|0);
    let k=0.9+0.2*(n-0.5)+(sp>0.94?0.08:sp<0.05?-0.08:0);
    // the bevel: the edge toward the light (up-left) is lit, the far edge shaded
    if(d<3.2){ const e=1-d/3.2, gx=(lx<w/2?-1:1)*(qx<qy?1:0.3), gy=(ly<h/2?-1:1)*(qy<=qx?1:0.3), lit=-(gx*0.6+gy*0.8); k*=1+e*e*0.28*lit-e*e*0.1; }
    if(f.cr){ const u=(x-f.x)*Math.cos(f.cr.a)+(y-f.y)*Math.sin(f.cr.a)-f.cr.o-f.w*0.3, wv=riS(Rr,x*0.9,y*0.9); if(Math.abs(u+wv*8-4)<0.6) k*=0.55; }
    const wr=riWear(W,H,x,y)*(o.wear==null?1:o.wear);
    k*=ao*(1+0.07*wr);
    const C=f.c; out[0]=C[0]*k+wr*4; out[1]=C[1]*k+wr*4; out[2]=C[2]*k+wr*3;
  };
}
// glazed tiles: two colours in a check, handmade (each its own tone, soft edges, mottled glaze), dark grout
function riTilesFn(W,H,cols,s,seed,x0off,y0off){
  const F=riTab('f'), a=riNat(riHex(cols[0]),0.74), b=riNat(riHex(cols[1]),0.7);
  return (x,y,out)=>{
    const X=x+(x0off||0), Y=y+(y0off||0), i=Math.floor(X/s), j=Math.floor(Y/s), u=X-i*s, v=Y-j*s, C=(i+j)%2?b:a, h=rzHash(i,j,seed), h2=rzHash(i,j,seed+5);
    const g=Math.min(u,s-u,v,s-v)+(riS(F,X*3,Y*3)-0.5)*0.8, ao=riAO(W,H,x,y);
    if(g<1){ const k=(0.5+0.25*riW(X*3|0,Y*3|0))*ao; out[0]=112*k; out[1]=100*k; out[2]=86*k; return; }
    let k=(0.84+h*0.2)*(0.93+0.12*(riS(F,X*1.2+h*90,Y*1.2)-0.5)*2)*(0.97+0.05*riS(F,X*6,Y*6));
    if(g<2.6) k*=1-0.14*(2.6-g)/1.6*(u<s/2&&u<v||v<s*0.4?-0.5:1);
    if(h2>0.9) k*=0.9;
    k*=ao; const wr=riWear(W,H,x,y)*0.6; out[0]=C[0]*k*(1-wr*0.05)+wr*4; out[1]=C[1]*k+wr*4; out[2]=C[2]*k+wr*3;
  };
}
// packed earth: patches, grit, small stones; straw is laid on afterwards with canvas strokes
function riDirtFn(W,H,kind,seed){
  const F=riTab('f'), base=kind==='miner'?[88,74,60]:kind==='hut'?[90,76,54]:[116,90,62];
  return (x,y,out)=>{
    const n=riS(F,x*0.7+seed,y*0.7), n2=riS(F,x*2.6,y*2.6+seed), w=riW(x*2|0,y*2|0), ao=riAO(W,H,x,y);
    let k=(0.82+0.32*n)*(0.94+0.12*n2)*(w>0.97?0.8:w<0.03?1.15:1)*ao;
    const st=riW(x*0.33|0,y*0.33|0); if(st>0.985){ k*=1.25; }
    const wet=kind==='hut'?riSm(0.6,0.8,n)*0.25:0;
    out[0]=base[0]*k*(1-wet*0.4); out[1]=base[1]*k*(1-wet*0.1); out[2]=base[2]*k*(1-wet*0.3);
  };
}
// a reed mat over dark boards: strands of 8 px in a basket weave, each strand round across its width
function riWovenFn(W,H,seed){
  const under=riPlanksFn(W,H,[[78,54,36],[70,48,32],[86,60,40]],18,seed), F=riTab('f'), m=22, s=24, mx0=m, my0=40, mw=W-m*2, mh=H-40-m;
  return (x,y,out)=>{
    const u=x-mx0, v=y-my0;
    if(u<-3||v<-3||u>mw+3||v>mh+3){ under(x,y,out); return; }
    if(u<0||v<0||u>mw||v>mh){ const k=0.55*riAO(W,H,x,y); out[0]=92*k; out[1]=66*k; out[2]=34*k; return; }
    const i=Math.floor(u/s), j=Math.floor(v/s), hz=(i+j)%2===0, a=hz?v-j*s:u-i*s, along=hz?u:v, st=Math.floor(a/8), q=(a-st*8)/8;
    const round=Math.sin(q*Math.PI), fib=riS(F,(hz?along:a*7)*1.8+st*31,(hz?a*7:along)*1.8);
    let k=(0.62+0.42*round)*(0.92+0.16*fib)*(q<0.08||q>0.92?0.7:1);
    const C=[[176,150,104],[164,138,92],[186,160,114]][(st+i*3+j)%3];
    k*=riAO(W,H,x,y)*(1+0.05*riWear(W,H,x,y)); out[0]=C[0]*k; out[1]=C[1]*k; out[2]=C[2]*k;
  };
}
// herringbone parquet inside a plank border
function riHerringFn(W,H,pal,seed){
  const F=riTab('f'), cw=20, p=10, sl=0.7, border=riPlanksFn(W,H,pal.map(c=>[c[0]*0.82,c[1]*0.8,c[2]*0.8]),10,seed+5,{long:true});
  return (x,y,out)=>{
    if(x<10||y<42||x>W-10||y>H-8){ border(x,y,out); return; }
    const c=Math.floor(x/cw), sg=c%2?-1:1, off=c%2?sl*cw:0, lx=x-c*cw, yy=y-sg*sl*lx-off, b=Math.floor(yy/p), t=yy-b*p, h=rzHash(c,b,seed);
    const C=pal[Math.floor(h*pal.length)%pal.length], along=lx*1.2+t*0.3, n=riS(F,along*0.5+h*200,t*3+h*90);
    let k=(0.9+h*0.16)*(0.92+0.14*n);
    if(t<0.7||p-t<0.6||lx<0.6) k*=0.45; else if(t<1.6) k*=1.08; else if(p-t<1.6) k*=0.85;
    const ao=riAO(W,H,x,y), wr=riWear(W,H,x,y); k*=ao*(1+0.06*wr);
    out[0]=C[0]*k+wr*5; out[1]=C[1]*k+wr*4; out[2]=C[2]*k+wr*3;
  };
}
function riFloor(g,R){
  const t0=performance.now(), I=riRoom(R), {x0,y0,W,H}=R, S=R.S||2, f=I.floor, sd=I.seed;
  let fn;
  if(f==='tile') fn=riTilesFn(W,H,R.S0.tile||['#e0d4bc','#b8664a'],24,sd);
  else if(f==='flags') fn=riFlagsFn(W,H,I.fp,R.st==='library'||R.st==='archive'?0.85:I.reg==='moon'?1.25:1.1,sd,{wear:R.st==='cellar'||R.st==='vault'?0.4:1});
  else if(f==='dirt') fn=riDirtFn(W,H,R.S0.dirt,sd);
  else if(f==='woven') fn=riWovenFn(W,H,sd);
  else if(f==='herring') fn=riHerringFn(W,H,I.fp,sd);
  else fn=riPlanksFn(W,H,I.fp,I.reg==='frost'?22:16,sd,{rough:I.attic||f==='grey'||f==='white',wear:I.attic?0.6:1,long:I.reg==='frost'});
  const kit=R.S0.kitchen&&R.A.objs.find(o=>o.k==='counter');
  if(kit){ const kx1=kit.x+kit.w/2+18-x0, ky1=kit.y-kit.h/2+6-y0, tf=riTilesFn(W,H,R.S0.kitchen,22,sd+3), base=fn;
    fn=(x,y,o)=>{ if(x<kx1&&y<ky1){ if(x>kx1-2.4||y>ky1-2.4){ const k=0.5*riAO(W,H,x,y); o[0]=78*k; o[1]=60*k; o[2]=42*k; return; } tf(x,y,o); } else base(x,y,o); }; }
  const cv=riPaint(W,H,Math.min(S,1),fn);
  g.drawImage(cv,x0,y0,W,H);
  if(f==='dirt') riStraw(g,R);
  riStats('floor',performance.now()-t0);
}
function riStraw(g,R){
  const r=mulberry32(R.seed*29+3), {x0,y0,W,H}=R, kind=R.S0.dirt, n=kind==='farm'?380:kind==='miner'?70:120;
  g.save(); g.lineCap='round';
  for(let i=0;i<n;i++){ let x,y; if(r()<0.55){ const e=Math.floor(r()*4); x=e===0?x0+r()*30:e===1?x0+W-r()*30:x0+r()*W; y=e===2?y0+30+r()*30:e===3?y0+H-r()*24:y0+r()*H; } else { x=x0+r()*W; y=y0+r()*H; }
    const a=r()*TAU, L=4+r()*9, v=r(); g.strokeStyle=`rgba(${150+v*70|0},${120+v*60|0},${50+v*40|0},.8)`; g.lineWidth=0.7; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); g.stroke();
    g.strokeStyle='rgba(40,26,10,.25)'; g.beginPath(); g.moveTo(x+0.6,y+0.8); g.lineTo(x+Math.cos(a)*L+0.6,y+Math.sin(a)*L+0.8); g.stroke(); }
  g.restore();
}

// ---- the back wall (crown y0-46, wall y0-38 .. y0+28, baseboard y0+28 .. y0+34), as one painted band
function riWoodK(x,y,s,vert,F){ const a=vert?y:x, b=vert?x:y, n=riS(F,a*0.2+s,b*2.4+s), gl=riS(RIT.r||riTab('r'),a*0.06+s*3,(b+(n-0.5)*5)*6+s), fib=riS(F,a*2+s,b*12); return (0.88+0.16*(n-0.5)+0.05*(fib-0.5))*(gl>0.76?1-0.16*(gl-0.76)/0.24:1); }
function riWallFn(R){
  const I=riRoom(R), {x0,y0,W}=R, L=x0-28, Wd=W+56, F=riTab('f'), Rr=riTab('r'), w=R.wl, kind=I.wall, c=I.wc.map(q=>riNat(q,0.84)), trim=riNat(riHex(R.trim||'#4a3020'),0.8), rng=mulberry32(I.seed*3+1);
  const top=y0-46, ytop=y0-38, ybot=y0+28;
  // timber frame: posts, a rail, braces
  const posts=[], braces=[]; if(kind==='timber'){ for(let x=x0+6;x<x0+W;x+=104){ posts.push(x); if(rng()<0.55){ const d=rng()<0.5?1:-1; braces.push([x+4+d*4,ytop,x+4+d*42,ybot-8]); } } }
  // stone: courses of blocks (or rounded fieldstones)
  const course=[]; if(kind==='stone'||kind==='iron'||kind==='seastone'){ let y=ytop; while(y<ybot){ const rh=kind==='seastone'?16+rng()*4:w.round?11+rng()*5:10+rng()*4, segs=[]; let x=L-rng()*24; while(x<L+Wd){ const sw=kind==='seastone'?34+rng()*26:w.round?14+rng()*14:18+rng()*22; segs.push([x,x+sw,rng(),rng()*256]); x+=sw; } course.push([y,y+rh,segs]); y+=rh; } }
  const beamsM=w.beams?(()=>{ const a=[]; for(let x=x0+40;x<x0+W;x+=130) a.push(x); return a; })():[];
  const plaster=(x,y,o,C)=>{ const n=riS(F,x*0.9,y*0.9), n2=riS(F,x*3.1+50,y*3.1), n3=riS(F,x*7+9,y*7), cr=riS(Rr,x*0.8+20,y*0.8)*riSm(0.55,0.7,riS(F,x*0.3,y*0.3+90));
    let k=(0.86+0.2*n)*(0.94+0.1*n2)*(0.97+0.05*n3)-(cr>0.982?0.2:0);
    const st=riSm(0.58,0.8,riS(F,x*0.18+11,y*0.6)); k*=1-0.08*st*riSm(ytop+20,ybot,y);
    k*=1-0.28*riE((y-ytop)/9)-0.18*riE((ybot-y)/6);
    o[0]=C[0]*k-st*4; o[1]=C[1]*k-st*2; o[2]=C[2]*k-st*6; };
  const wood=(x,y,o,C,s,vert,e0,e1)=>{ let k=riWoodK(x,y,s,vert,F); if(e0<1.8) k*=1.08+0.1*(1.8-e0); else if(e1<2) k*=0.62+0.12*e1; riSet(o,C,k); };
  return (x,y,o)=>{
    const X=x+L, Y=y+top;
    // crown moulding and baseboard
    if(Y<ytop){ const t=Y-top; riSet(o,trim,riWoodK(X,Y,3,false,F)*(t<1.4?1.16:t>6.8?0.5:t>5.4?0.8:1)); return; }
    if(Y>=ybot){ const t=Y-ybot; riSet(o,[trim[0]*0.9,trim[1]*0.9,trim[2]*0.9],riWoodK(X,Y,7,false,F)*(t<1.1?1.18:t>4.8?0.45:1)); return; }
    const sh=1-0.3*riE((Y-ytop)/7);   // the ceiling's shadow on the top of the wall
    if(kind==='timber'){
      const C0=c[0], bm=c[1]||[90,56,32];
      const pm=((X-(x0+6))%104+104)%104, px=X-pm; if(pm<8&&px<x0+W){ wood(X,Y,o,bm,px,true,pm,8-pm); riSet(o,o,sh); return; }
      if(Y>=y0-2&&Y<y0+5){ wood(X,Y,o,bm,9,false,Y-(y0-2),y0+5-Y); riSet(o,o,sh); return; }
      for(const b of braces){ const dx=b[2]-b[0], dy=b[3]-b[1], t=((X-b[0])*dx+(Y-b[1])*dy)/(dx*dx+dy*dy); if(t<0||t>1) continue; const px=b[0]+dx*t, py=b[1]+dy*t, dd=Math.hypot(X-px,Y-py); if(dd<3.6){ wood(X,Y,o,[bm[0]*0.95,bm[1]*0.95,bm[2]*0.95],b[0],true,3.6-dd,dd+3.6); riSet(o,o,sh); return; } }
      if(I.attic&&Y<y0-2){ // the underside of the roof: weathered boards between the rafters, darker toward the ridge
        const bh=9, r=Math.floor((Y-ytop)/bh), t=Y-ytop-r*bh, sd=rzHash(r,Math.floor((X-L)/104),I.seed); let k=riWoodK(X,Y,r*31+sd*99,false,F)*(0.8+0.22*sd)*(0.72+0.28*riSm(ytop,y0-2,Y));
        if(t<0.9) k*=0.45; else if(t<2) k*=1.08; else if(bh-t<1.6) k*=0.8;
        let sk=1; { const dr=pm-8; if(dr>=0&&dr<6) sk*=0.62+0.38*dr/6; }
        riSet(o,[118,88,60],k*sk*sh); return; }
      plaster(X,Y,o,C0);
      // the timber stands a little proud: a hairline where plaster meets it, and its soft shadow to the right and below
      let sk=1; { const e=Math.min(pm,Math.abs(pm-8),104-pm); if(e<1.2) sk*=0.74; const dr=pm-8; if(dr>=0&&dr<5) sk*=0.72+0.28*dr/5; }
      { const dr=Y-(y0+5); if(dr>=0&&dr<4) sk*=0.7+0.3*dr/4; const du=(y0-2)-Y; if(du>=0&&du<1.2) sk*=0.8; }
      riSet(o,o,sk);
      riSet(o,o,sh); return;
    }
    if(kind==='stone'||kind==='iron'||kind==='seastone'){
      for(const bx of beamsM) if(X>=bx&&X<bx+10){ wood(X,Y,o,[90,62,36],bx,true,X-bx,bx+10-X); riSet(o,o,sh); return; }
      let row=course[course.length-1]; for(const q of course) if(Y>=q[0]&&Y<q[1]){ row=q; break; }
      let sg=row[2][0]; for(const s of row[2]) if(X>=s[0]&&X<s[1]){ sg=s; break; }
      const lx=X-sg[0], ly=Y-row[0], bw=sg[1]-sg[0], bh=row[1]-row[0], C=c[Math.floor(sg[2]*c.length)%c.length];
      let d;
      if(w.round){ const ex=(lx-bw/2)/(bw/2-0.8), ey=(ly-bh/2)/(bh/2-0.6); d=(1-Math.sqrt(ex*ex+ey*ey))*Math.min(bw,bh)*0.5; }
      else d=Math.min(lx,bw-lx,ly,bh-ly)-1+(riS(F,X*2,Y*2)-0.5)*(kind==='seastone'?0.8:2);
      if(d<0){ const mc=kind==='iron'?[30,28,30]:kind==='seastone'?[150,144,132]:[44,40,36], k=(0.8+0.3*riW(X*3|0,Y*3|0))*sh; riSet(o,mc,k); if(w.moss&&riS(F,X*1.5,Y*1.5)>0.62){ o[0]=o[0]*0.6+40; o[1]=o[1]*0.6+62; o[2]=o[2]*0.6+26; } return; }
      const n=riS(F,X*1.3+sg[3],Y*1.3), sp=riW(X*2|0,Y*2|0);
      let k=(0.86+sg[2]*0.22)*(0.9+0.22*(n-0.5))*(sp>0.95?1.08:1);
      if(d<2.6){ const e=1-d/2.6; k*=1+e*((lx<bw/2&&lx<ly)||ly<bh*0.35?0.22:-0.24); }
      if(kind==='iron'){ const rv=(Math.abs(lx-4)<1.4||Math.abs(bw-lx-4)<1.4)&&Math.abs(ly-bh/2)<1.4; if(rv) k*=1.35; }
      if(kind==='seastone'&&riW(X*0.5|0,Y*0.5|0)>0.992) k*=0.82;   // a fossil shell or two in the pale stone
      riSet(o,C,k*sh); return;
    }
    if(kind==='log'){
      const lh=11, r=Math.floor((Y-ytop)/lh), t=(Y-ytop)-r*lh, q=t/lh, C=c[0], tone=0.88+rzHash(r,3,I.seed)*0.2;
      if(q<0.06||q>0.95){ const k=(0.7+0.2*riW(X*2|0,Y*2|0))*sh; o[0]=196*k; o[1]=182*k; o[2]=156*k; return; }   // chinking
      const cyl=Math.sin(q*Math.PI), lit=1.12-0.5*q, n=riS(F,X*0.25+r*40,Y*3.2), bark=riS(Rr,X*0.6+r*17,Y*2.4);
      let k=tone*(0.55+0.5*cyl)*lit*(0.9+0.14*(n-0.5))*(bark>0.9?0.82:1);
      riSet(o,C,k*sh); return;
    }
    if(kind==='panel'||kind==='boards'){
      const pw=kind==='boards'?16:40, i=Math.floor((X-L)/pw), lx=X-L-i*pw, C=kind==='boards'?c[0]:c[0], tone=0.9+rzHash(i,7,I.seed)*0.16;
      if(kind==='boards'){ let k=tone*riWoodK(X,Y,i*13,true,F)*0.96; if(lx<0.9) k*=0.5; else if(lx<2) k*=1.08; else if(lx>pw-1.6) k*=0.82; riSet(o,C,k*sh*(1-0.12*riE((ybot-Y)/8))); return; }
      const fr=5, ly=Y-ytop, ph=ybot-ytop; let k=riWoodK(X,Y,i*17,true,F)*tone;
      if(lx<fr||lx>pw-fr||ly<6||ly>ph-6){ k*=0.82; if(lx<1||ly<1) k*=1.2; }
      else { const ex=Math.min(lx-fr,pw-fr-lx), ey=Math.min(ly-6,ph-6-ly), e=Math.min(ex,ey); if(e<3){ const lit=(lx-fr<pw-fr-lx&&ex<=ey)||(ly-6<ph-6-ly&&ey<ex); k*=lit?1.16:0.72; } }
      riSet(o,C,k*sh); return;
    }
    if(kind==='brass'){
      // riveted brass sheets over a dark wood wainscot, a steam pipe along the top
      const wain=Y>y0+8;
      if(wain){ const i=Math.floor((X-L)/36), lx=X-L-i*36; let k=riWoodK(X,Y,i*9,true,F)*(lx<1?0.55:lx<2?1.1:1); if(Y<y0+10) k*=1.25; riSet(o,[86,58,38],k*sh); return; }
      if(Y<ytop+7){ const q=(Y-ytop)/7, k=(0.5+0.75*Math.sin(q*Math.PI))*(0.9+0.1*riS(F,X*0.1,3)); const j=((X-L)%120)<5; riSet(o,j?[120,92,52]:[176,128,70],k*(j?0.9:1)); return; }
      const sw=48, i=Math.floor((X-L)/sw), lx=X-L-i*sw, ly=Y-ytop-7, brush=riS(F,X*0.05+i*30,Y*6), pat=riSm(0.55,0.85,riS(F,X*0.4+i*11,Y*0.6))*riSm(y0-20,y0+6,Y);
      let k=(0.78+0.28*brush)*(1+0.16*riE((((ly-8)/7)**2)));
      if(lx<1.2) k*=0.45; else if(lx<2.4) k*=1.2; else if(lx>sw-1.6) k*=0.7;
      const rv=(Math.abs(lx-4.5)<1.6||Math.abs(sw-lx-4.5)<1.6)&&((ly%9)+9)%9<2.4&&((ly%9)+9)%9>-0.1;
      if(rv) k*=(lx<sw/2?1.45:0.75);
      const C=[200*(1-pat*0.4)+pat*80,150*(1-pat*0.2)+pat*120,80*(1-pat*0.1)+pat*100]; riSet(o,C,k*sh); return;
    }
    // wallpapers (stripes, damask, floral): the painted paper is laid on after; here the bare plaster under it
    plaster(X,Y,o,c[0]);
  };
}
function riWall(g,R){
  const t0=performance.now(), I=riRoom(R), {x0,y0,W}=R, L=x0-28, Wd=W+56, S=R.S||2, w=R.wl, kind=I.wall;
  const paper=kind==='stripes'||kind==='damask'||kind==='floral';
  if(paper){ // the Classic paper pattern, then aged: paper fibre, seams, a faded top, grime at the foot
    RI.raw=1; try{ r2Wall(g,R); } finally{ RI.raw=0; }
    const F=riTab('f'), Rr=riTab('r'), k=Math.min(S,1.25), cv=mkCanvas(Wd*k,80*k), q=cv.getContext('2d'); q.drawImage(g.canvas,(L-R.bx)*S,(y0-46-R.by)*S,Wd*S,80*S,0,0,Wd*k,80*k);
    const id=q.getImageData(0,0,cv.width,cv.height), d=id.data, CW=cv.width, CH=cv.height; riTab('w');
    for(let j=0;j<CH;j++){ const Y=y0-46+(j+0.5)/k; for(let i=0;i<CW;i++){ const X=L+(i+0.5)/k, p=(j*CW+i)*4;
      let m;
      if(Y<y0-38||Y>=y0+28||(w.wain&&Y>=y0+11)) m=riWoodK(X,Y,5,false,F);
      else { const fib=riS(F,X*2.6,Y*2.6), seam=((X-L)%52+52)%52<1?0.86:1, st=riSm(0.6,0.82,riS(F,X*0.2+70,Y*0.5)); m=(0.92+0.1*fib)*seam*(1-0.1*st)*(1-0.24*riE((Y-(y0-38))/9))*(1-0.16*riE(((w.wain?y0+11:y0+28)-Y)/7)); if(riS(Rr,X*0.7,Y*0.7)>0.988) m*=0.85; }
      const l=(d[p]*0.3+d[p+1]*0.59+d[p+2]*0.11), s=0.8; d[p]=(l+(d[p]-l)*s)*m+2; d[p+1]=(l+(d[p+1]-l)*s)*m; d[p+2]=(l+(d[p+2]-l)*s)*m-3; } }
    q.putImageData(id,0,0); g.drawImage(cv,L,y0-46,Wd,80);
  } else {
    const cv=riPaint(Wd,80,1,riWallFn(R)); g.drawImage(cv,L,y0-46,Wd,80);
    if(w.wain&&kind!=='brass'){ RI.raw=1; try{ g.save(); g.beginPath(); g.rect(L,y0+11,Wd,17); g.clip(); r2WainR(g,R); g.restore(); } finally{ RI.raw=0; } }
  }
  riStats('wall',performance.now()-t0);
}
// the wainscot rail and panels of the Classic wall, painted again in wood over the Realistic wall
function r2WainR(g,R){ const {x0,y0,W}=R, L=x0-28, Wd=W+56, F=riTab('f'), wc=riNat(riHex(R.wl.wain),0.8);
  const cv=riPaint(Wd,17,Math.min(R.S||2,1.25),(x,y,o)=>{ const X=x+L, Y=y+y0+11; if(y<3){ riSet(o,riNat(riHex(R.trim),0.8),riWoodK(X,Y,2,false,F)*(y<1?1.2:0.85)); return; } const i=Math.floor((X-L-6)/34), lx=X-L-6-i*34, ly=y-3; let k=riWoodK(X,Y,i*5,true,F); if(lx<1||lx>27&&lx<29) k*=0.6; else if(ly<1.2||lx<2.2) k*=1.15; else if(ly>12) k*=0.75; riSet(o,wc,k*(1-0.2*riE((17-y)/4))); });
  g.drawImage(cv,L,y0+11,Wd,17); }

// ---- the wall tops seen from above (side walls and the front wall) and the doorway
function riFrame(g,R){
  const t0=performance.now(), I=riRoom(R), {x0,y0,W,H}=R, S=R.S||2, F=riTab('f'), kind=I.wall, shut=!!(R.A&&R.A.def&&R.A.def.noExit), dx0=shut?x0+W/2:x0+W/2-35, dx1=shut?x0+W/2:x0+W/2+35;
  const stoneT=kind==='stone'||kind==='iron'||kind==='seastone', logT=kind==='log';
  const cap=stoneT?(kind==='seastone'?[176,170,156]:kind==='iron'?[70,68,72]:[96,92,88]):logT?[118,84,52]:kind==='brass'?[92,64,42]:[86,58,36];
  const top=(x,y,o,along,vert,inner)=>{ // inner: distance to the room side (0 at the edge)
    let k;
    if(stoneT){ const bl=Math.floor(along/(kind==='seastone'?30:18)), lx=along-bl*(kind==='seastone'?30:18); k=(0.86+rzHash(bl,vert?1:2,I.seed)*0.2)*(0.9+0.2*(riS(F,x*1.3,y*1.3)-0.5)); if(lx<1) k*=0.5; }
    else if(logT){ k=riWoodK(x,y,3,vert,F)*(0.9+0.15*Math.sin((vert?x:y)*0.6)); }
    else k=riWoodK(x,y,11,vert,F);
    k*=(0.62+0.38*riSm(0,12,inner))*(0.94+0.12*riS(F,x*0.5,y*0.5));
    riSet(o,cap,k);
  };
  // side walls (x0-28 .. x0 and x0+W .. x0+W+28) from the crown down past the front wall
  const sh=H+72;
  for(const [sx,lit] of [[x0-28,false],[x0+W,true]]){
    const cv=riPaint(28,sh,1,(x,y,o)=>{ const X=x+sx, Y=y+y0-46, inner=lit?x:28-x; top(X,Y,o,Y,true,inner); if(inner<1.4) riSet(o,o,lit?1.3:0.55); else if(inner<3.2) riSet(o,o,lit?1.12:0.8); else if(inner>26.5) riSet(o,o,0.5); });
    g.drawImage(cv,sx,y0-46,28,sh);
  }
  // the front wall with the doorway
  for(const [a,b] of [[x0-28,dx0],[dx1,x0+W+28]]){ if(b-a<1) continue;
    const cv=riPaint(b-a,28,1,(x,y,o)=>{ const X=x+a, Y=y+y0+H; top(X,Y,o,X,false,y); if(y<2) riSet(o,o,1.22); else if(y>26) riSet(o,o,0.6); });
    g.drawImage(cv,a,y0+H,b-a,28); }
  if(!shut){
    const th=riPaint(70,24,1,(x,y,o)=>{ const X=x+dx0, Y=y+y0+H+2; if(stoneT||R.fl==='flags'){ const k=(0.86+0.2*riS(F,X*1.2,Y*1.2))*(y<1.6?1.2:1)*(Math.abs(x-35)<0.8?0.6:1); riSet(o,[118,112,104],k); } else { const i=Math.floor(x/14), lx=x-i*14; let k=riWoodK(X,Y,i*7,true,F)*(lx<0.8?0.5:lx<1.8?1.1:1)*(y<1.6?1.2:1)*(1-0.18*riWear(70,24,x,y*0.2)); riSet(o,[104,72,44],k); } });
    g.drawImage(th,dx0,y0+H+2,70,24);
    for(const px of [dx0-6,dx1]){ const post=riPaint(6,30,1,(x,y,o)=>{ const X=x+px, Y=y+y0+H-2; riSet(o,stoneT?[84,78,76]:[108,70,42],(stoneT?0.9+0.2*riS(F,X*2,Y*2):riWoodK(X,Y,px,true,F))*(x<1.2?1.25:x>4.8?0.6:1)); }); g.drawImage(post,px,y0+H-2,6,30); }
  }
  // the dark line over the crown, and soft shade where the side walls rise from the floor
  g.fillStyle='rgba(12,8,6,.7)'; g.fillRect(x0-28,y0-50,W+56,4);
  riStats('frame',performance.now()-t0);
}

// ---- cloth: rugs and the door mat, painted the Classic way, then woven (thread texture, a soft pile, frayed edges)
function riCloth(g,R,x,y,w,h,draw,o){
  o=o||{}; const S=R.S||2, k=Math.min(S,1.25), pad=8, cv=mkCanvas((w+pad*2)*k,(h+pad*2)*k), q=cv.getContext('2d');
  q.scale(k,k); q.translate(pad-x,pad-y); RI.sh=null; draw(q); q.setTransform(1,0,0,1,0,0);
  const F=riTab('f'), W2=cv.width, H2=cv.height, id=q.getImageData(0,0,W2,H2), d=id.data, n=W2*H2, al=new Float32Array(n), ab=new Float32Array(n), tmp=new Float32Array(n); riTab('w');
  for(let i=0;i<n;i++) al[i]=d[i*4+3]/255;
  rzBlur(al,W2,H2,Math.max(1,Math.round(1.4*k)),ab,tmp);
  const sat=o.sat==null?0.78:o.sat;
  for(let j=0;j<H2;j++) for(let i=0;i<W2;i++){ const p=j*W2+i; if(al[p]<=0.01) continue; const X=x-pad+(i+0.5)/k, Y=y-pad+(j+0.5)/k;
    const wv=(Math.sin(X*TAU/1.6)*Math.sin(Y*TAU/1.6))*0.5, fib=riS(F,X*3,Y*3), e=ab[p];
    let m=(0.9+0.06*wv+0.1*(fib-0.5))*(0.82+0.18*Math.min(1,e*1.6));
    const wr=riWear(R.W,R.H,X-R.x0,Y-R.y0)*0.35; m*=1+wr*0.12;
    const l=d[p*4]*0.3+d[p*4+1]*0.59+d[p*4+2]*0.11, s=sat*(1-wr*0.3);
    d[p*4]=(l+(d[p*4]-l)*s)*m+wr*6; d[p*4+1]=(l+(d[p*4+1]-l)*s)*m+wr*5; d[p*4+2]=(l+(d[p*4+2]-l)*s)*m+wr*3;
    if(e<0.6) d[p*4+3]=Math.min(255,d[p*4+3]*(0.55+0.45*riW(i,j)+0.2)); }
  q.putImageData(id,0,0);
  // the floor darkens a little under the rug's edge (it sits on the boards), then the rug
  riShadowBlit(g,cv,x-pad,y-pad,w+pad*2,h+pad*2,0.28,1.5);
  g.drawImage(cv,x-pad,y-pad,w+pad*2,h+pad*2);
}
// a soft dark copy of a layer's alpha, offset toward the lower right (light from the upper left)
function riShadowBlit(g,cv,x,y,w,h,a,off){
  const s=mkCanvas(Math.max(1,cv.width/4),Math.max(1,cv.height/4)), q=s.getContext('2d'); q.imageSmoothingEnabled=true; q.drawImage(cv,0,0,s.width,s.height); q.globalCompositeOperation='source-in'; q.fillStyle='#0a0604'; q.fillRect(0,0,s.width,s.height);
  g.save(); g.globalAlpha=a; g.imageSmoothingEnabled=true; g.drawImage(s,x+off,y+off*1.4,w,h); g.restore();
}

// ---- the room as a whole: r2Base hands the baking over to this in the Realistic look
const RI_WALLK={window:1,painting:1,portraits:1,board:1,chart:1,mapwall:1,herbs:1,mirror:1};
function riBase(A,cv,g,S,bx,by,bw,bh,R){
  const t0=performance.now(); R.S=S; R.bx=bx; R.by=by; riRoom(R);
  const post=[], wallK=[], cloth=[], furn=[];
  for(const o of A.objs){ if(!r2Bakes(o)) continue; if(o.k==='heights'){ post.push(o); continue; } if(o.k==='rug'||o.k==='bearrug') { cloth.push(o); continue; } if(RI_WALLK[o.k]||(o.k==='trophy'&&o.y<A.ry+40)) { wallK.push(o); continue; } furn.push(o); }
  const bake=(q,o)=>{ q.save(); try{ FB[o.k](q,o,R); }catch(err){ console.warn('furn',o.k,err); } q.restore(); };
  r2Floor(g,R);
  for(const o of cloth){ if(o.k==='rug'){ const w=o.w,h=o.h; riCloth(g,R,o.x-w/2-6,o.y-h/2-4,w+12,h+10,q=>bake(q,o)); } else { riCloth(g,R,o.x-60,o.y-50,120,100,q=>bake(q,o),{sat:0.85}); } }
  r2Wall(g,R);
  // wall decor and things hung on the wall: their own layer, relit gently, so frames and plates have some depth
  const dh=Math.min(bh,(A.ry+44)-by), D=mkCanvas(cv.width,Math.ceil(dh*S)), dg=D.getContext('2d'); dg.scale(S,S); dg.translate(-bx,-by);
  r2Decor(dg,R); for(const o of wallK) if(o.k!=='window') bake(dg,o); r2DecorPost(dg,R);
  rzRelight(D,{bump:2,ao:0.1,aoR:Math.round(2*S),edge:Math.max(1,Math.round(1.2*S)),sat:0.86,split:0.6}); riGrain(D,S,0.1);
  riShadowBlit(g,D,bx,by,bw,D.height/S,0.32,1.6); g.drawImage(D,bx,by,bw,D.height/S);
  for(const o of wallK) if(o.k==='window') bake(g,o);
  // the furniture: one layer, its soft shadows on another (r2sh and r2shC draw there while RI.sh is set)
  const L=mkCanvas(cv.width,cv.height), lg=L.getContext('2d'); lg.scale(S,S); lg.translate(-bx,-by);
  const SHc=mkCanvas(Math.ceil(cv.width/2),Math.ceil(cv.height/2)), shg=SHc.getContext('2d'); shg.scale(S/2,S/2); shg.translate(-bx,-by);
  RI.sh=shg;
  try{ for(const o of furn) bake(lg,o); r2Clutter(lg,R,A); } finally{ RI.sh=null; }
  const t1=performance.now();
  rzRelight(L,{bump:2.6,ao:0.12,aoR:Math.round(3*S),edge:Math.max(1,Math.round(1.6*S)),sat:0.84,split:0.8});
  riGrain(L,S,0.12);
  riStats('relight',performance.now()-t1);
  // shadows: blurred (down and up again), then laid under the furniture; plus a soft occlusion skirt from the layer itself
  const sb=mkCanvas(Math.max(1,SHc.width/4),Math.max(1,SHc.height/4)), sbg=sb.getContext('2d'); sbg.imageSmoothingEnabled=true; sbg.drawImage(SHc,0,0,sb.width,sb.height);
  g.save(); g.imageSmoothingEnabled=true; g.globalAlpha=0.95; g.drawImage(sb,bx,by,bw,bh); g.restore();
  riShadowBlit(g,L,bx,by,bw,bh,0.34,1.2);
  g.drawImage(L,bx,by,bw,bh);
  r2Frame(g,R); if(!A.def.noExit) riCloth(g,R,R.x0+R.W/2-34,R.y0+R.H-24,68,28,q=>r2Mat(q,R),{sat:0.8});
  for(const o of post) bake(g,o);
  riStats('room',performance.now()-t0);
}
// r2sh / r2shC (a3b_art2.js) send their shapes here while the furniture is baked: a soft dark pool on the shadow
// layer instead of a hard offset shape on the furniture
function riShTo(g){ return !!(RI.sh&&g!==RI.sh); }
function riShM(g,q){ try{ const m=g.getTransform(); q.setTransform(m.a/2,m.b/2,m.c/2,m.d/2,m.e/2,m.f/2); }catch(e){} }
function riSh(g,x,y,w,h,r,a){ const q=RI.sh; q.save(); riShM(g,q); q.fillStyle=`rgba(10,6,3,${Math.min(0.7,(a||0.26)*1.5)})`; rrect(q,x+1,y+2,w+3,h+3,Math.max(0,Math.min(r+2,w/2,h/2))); q.fill(); q.restore(); }
function riShC(g,x,y,rx,ry,a){ const q=RI.sh; q.save(); riShM(g,q); q.fillStyle=`rgba(10,6,3,${Math.min(0.7,(a||0.26)*1.5)})`; q.beginPath(); q.ellipse(x+1.5,y+2.5,Math.max(0.1,rx+1),Math.max(0.1,ry+1),0,0,TAU); q.fill(); q.restore(); }


// ---------- 3. live house objects (drawn every frame): cached lit sprites
// a 2D drawing (the Classic shapes, drawn with g) relit once into a sprite: (w,h) world size, (ox,oy) its origin
function riRS(key,w,h,ox,oy,draw,o){ return riCache('rs:'+key,()=>{ const sc=2, c=mkCanvas(w*sc,h*sc), g=c.getContext('2d'); g.scale(sc,sc); g.translate(ox,oy); g.lineJoin='round'; g.lineCap='round'; draw(g);
  rzRelight(c,Object.assign({bump:2.6,ao:0.12,aoR:3,edge:2,sat:0.85},o||{})); riGrain(c,sc,0.08); c.ox=ox; c.oy=oy; c.w2=w; c.h2=h; return c; }); }
function riHF(key,w,h,ox,oy,make,o){ return riCache('hf:'+key,()=>{ const F=rzHF(w,h,ox,oy); make(F); return rzShade(F,o||{ao:0.16,aoR:1.6,rim:0.35}); }); }
function riPut(c,x,y){ ctx.drawImage(c,x-c.ox,y-c.oy,c.w2,c.h2); }
const riPlankTx=(sd,horiz)=>(u,v)=>{ const a=horiz?u:v, b=horiz?v:u; return 0.82+0.22*rzVN(a*0.16+sd,b*1.9,sd)+0.06*Math.sin(b*2.8+rzVN(a*0.25,b,sd+1)*5)-(rzHash(Math.floor(a*0.5),Math.floor(b*1.2),sd)>0.97?0.12:0); };
// a crate seen from above: four frame boards, slats, a cross brace, nails
function riCrate(){ return riHF('crate',48,48,24,24,F=>{
  rzContact(F,1.5,2.5,21,21,0.5); const C=[150,112,70], C2=[132,96,58];
  for(let i=0;i<5;i++) rzBox(F,0,-12+i*6,30,5.4,0,10,0.9,rzJit(C2,mulberry32(i+3),0.14),RZ.WOOD,riPlankTx(i*7,true));
  rzBox(F,0,-16.5,38,5,0,12.5,1.1,C,RZ.WOOD,riPlankTx(1,true)); rzBox(F,0,16.5,38,5,0,12.5,1.1,C,RZ.WOOD,riPlankTx(2,true));
  rzBox(F,-16.5,0,5,28,0,12.2,1.1,C,RZ.WOOD,riPlankTx(3,false)); rzBox(F,16.5,0,5,28,0,12.2,1.1,C,RZ.WOOD,riPlankTx(4,false));
  rzBox(F,0,0,44,4.6,Math.PI/4,13.6,1,[144,104,62],RZ.WOOD,riPlankTx(5,true)); rzBox(F,0,0,40,4.4,-Math.PI/4,13.1,1,[138,100,60],RZ.WOOD,riPlankTx(6,true));
  for(const [nx,ny] of [[-16.5,-16.5],[16.5,-16.5],[-16.5,16.5],[16.5,16.5],[0,0]]) rzDome(F,nx,ny,1,1,0,13.8,0.5,[70,66,64],RZ.METAL);
},{ao:0.2,aoR:1.4,rim:0.4}); }
// a wooden chest 36 x 24 (iron bands, a lock); open shows the dark inside and the lid thrown back
function riChest(open){ return riHF('chest'+(open?1:0),48,40,24,20,F=>{
  rzContact(F,1,3,20,13,0.5);
  if(open) rzBox(F,0,-14,36,6,0,15,1.4,[120,80,44],RZ.WOOD,rzWoodTx(7,true));
  rzBox(F,0,0,36,24,0,9,1.6,[128,84,44],RZ.WOOD,rzWoodTx(6,true));
  if(open) rzEach(F,(x,y,id)=>{ if(Math.abs(x)<15.2&&Math.abs(y)<9.2){ F.h0[id]=(2.4+Math.min(15.2-Math.abs(x),9.2-Math.abs(y))*0.1)*F.k; F.c[id*3]=30; F.c[id*3+1]=18; F.c[id*3+2]=9; } });
  else rzBox(F,0,-4,36,12,0,11.5,2.4,[138,92,50],RZ.WOOD,rzWoodTx(7,true));
  for(const y of [-10.5,10.5]) rzBox(F,0,y,36,3,0,open?9.6:11.9,0.6,[176,150,96],RZ.METAL);
  if(!open){ rzBox(F,0,0,4.4,24,0,12.3,0.6,[170,146,98],RZ.METAL); rzBox(F,0,1.5,5.4,5.4,0,13.2,0.8,[206,172,88],RZ.METAL); }
},{ao:0.14,aoR:1.2,rim:0.35}); }
// silk: radial threads in a downward fan and sagging spirals between them, very fine, with a little dust
function riWeb(){ return riCache('web',()=>{ const sc=2, w=72, h=44, c=mkCanvas(w*sc,h*sc), g=c.getContext('2d'); g.scale(sc,sc); g.translate(36,4); const rng=mulberry32(77);
  const A=[]; for(let i=0;i<7;i++) A.push(Math.PI*(0.06+i*0.148)+(rng()-0.5)*0.08);
  g.lineCap='round'; g.strokeStyle='rgba(236,238,244,.42)'; g.lineWidth=0.5;
  for(const a of A){ g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*34,Math.sin(a)*34); g.stroke(); }
  for(let r=5;r<=31;r+=3.2+rng()*1.4){ g.strokeStyle=`rgba(236,238,244,${0.18+0.22*(1-r/34)})`; g.beginPath(); for(let i=0;i<A.length-1;i++){ const a0=A[i], a1=A[i+1], rr=r*(0.96+rng()*0.08), am=(a0+a1)/2, sag=r*0.88;
      const x0=Math.cos(a0)*rr, y0=Math.sin(a0)*rr, x1=Math.cos(a1)*rr, y1=Math.sin(a1)*rr; if(!i) g.moveTo(x0,y0); g.quadraticCurveTo(Math.cos(am)*sag,Math.sin(am)*sag,x1,y1); } g.stroke(); }
  g.fillStyle='rgba(220,214,200,.5)'; for(let i=0;i<14;i++){ const a=A[0]+rng()*(A[6]-A[0]), r=4+rng()*26; g.fillRect(Math.cos(a)*r,Math.sin(a)*r,0.7,0.7); }
  c.ox=36; c.oy=4; c.w2=w; c.h2=h; return c; }); }
function riCandles(){ return riRS('candles',40,26,20,20,g=>{
  g.fillStyle='rgba(60,40,20,.25)'; g.beginPath(); g.ellipse(1,1,16,4,0,0,TAU); g.fill();
  for(let i=0;i<3;i++){ const cx=-10+i*10, h=14-i*3; g.fillStyle=r2lg(g,cx-2.6,0,cx+2.6,0,'#fbf2dc','#e6d6b2','#b8a47e'); g.fillRect(cx-2.6,-h,5.2,h); g.fillStyle='#fff8e6'; g.beginPath(); g.ellipse(cx,-h,2.6,1,0,0,TAU); g.fill();
    g.fillStyle='#efe2c4'; g.beginPath(); g.ellipse(cx-1.6,-h+2.4,0.9,2,0,0,TAU); g.fill(); g.strokeStyle='#2a1a10'; g.lineWidth=0.6; g.beginPath(); g.moveTo(cx,-h); g.lineTo(cx,-h-1.6); g.stroke(); }
},{bump:1.6,edge:1.4}); }
function riCoins(){ return riRS('coins',30,22,15,12,g=>{
  for(let i=0;i<6;i++){ const a=i*1.1, d=i?5:0, x=Math.cos(a)*d, y=Math.sin(a)*d*0.6-i*1.2; g.fillStyle='#8a6418'; g.beginPath(); g.ellipse(x,y+0.9,6,3.5,0,0,TAU); g.fill(); g.fillStyle=r2lg(g,x-6,y-3,x+6,y+3,'#fff0a0','#e8b830','#a87a18'); g.beginPath(); g.ellipse(x,y,6,3.5,0,0,TAU); g.fill(); g.strokeStyle='rgba(120,84,20,.7)'; g.lineWidth=0.5; g.beginPath(); g.ellipse(x,y,4.4,2.4,0,0,TAU); g.stroke(); }
},{bump:2,edge:1.2,sat:0.95,split:0.5}); }
function riBanner(){ return riRS('banner',36,50,18,22,g=>{
  g.fillStyle='#3a2818'; g.fillRect(-16,-20,32,2.4);
  g.save(); g.beginPath(); g.rect(-14,-18,28,40); g.moveTo(-14,22); g.lineTo(0,14); g.lineTo(14,22); g.rect(-14,-18,28,32); g.clip();
  g.fillStyle='#4a1e4a'; g.fillRect(-14,-18,28,42); for(let i=0;i<5;i++){ const x=-14+i*6.2; g.fillStyle=r2lg(g,x,0,x+6.2,0,'rgba(0,0,0,.22)','rgba(255,220,255,.12)','rgba(0,0,0,.18)'); g.fillRect(x,-18,6.2,42); } g.restore();
  g.fillStyle='#4a1e4a'; g.beginPath(); g.moveTo(-14,13); g.lineTo(-14,22); g.lineTo(0,15); g.lineTo(14,22); g.lineTo(14,13); g.closePath(); g.fill();
  g.fillStyle='#c8a040'; g.beginPath(); g.ellipse(0,0,6,9,0,0,TAU); g.fill(); g.strokeStyle='#8a6a20'; g.lineWidth=0.8; g.stroke(); g.fillStyle='#e8c860'; g.beginPath(); g.ellipse(-1.5,-2.5,2,3,0,0,TAU); g.fill();
},{bump:2.2,sat:0.8}); }
function riMoose(){ return riRS('moose',72,48,36,22,g=>{
  g.fillStyle='#5a3a24'; g.beginPath(); g.ellipse(0,6,12,16,0,0,TAU); g.fill(); g.fillStyle=r2lg(g,-12,0,12,0,'#7a5434','#5a3a24','#3a2414'); g.beginPath(); g.ellipse(0,6,11,15,0,0,TAU); g.fill();
  g.fillStyle='#3a2414'; g.beginPath(); g.ellipse(0,18,8,6,0,0,TAU); g.fill(); g.fillStyle='#1a0e06'; g.beginPath(); g.arc(-3,19,1.3,0,TAU); g.arc(3,19,1.3,0,TAU); g.fill();
  g.strokeStyle='#d8c8a8'; g.lineWidth=4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*8,-4); g.quadraticCurveTo(s*24,-12,s*30,-2); g.moveTo(s*20,-8); g.lineTo(s*22,-18); g.moveTo(s*26,-6); g.lineTo(s*32,-14); g.stroke(); }
  g.fillStyle='#120a06'; g.beginPath(); g.arc(-5,2,2,0,TAU); g.arc(5,2,2,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(-5.6,1,0.8,0.8); g.fillRect(4.4,1,0.8,0.8);
}); }
function riHouseX(o,t){
  const x=o.x, y=o.y;
  switch(o.k){
    case 'hchest': { const open=!!G.found[o.id]; riPut(riChest(open),x,y); if(!open) glowAt(x,y,32,'255,214,140',0.18+0.1*Math.sin(t*3+x)); return true; }
    case 'crate': riPut(riCrate(),x,y); return true;
    case 'cobweb': riPut(riWeb(),x,y); return true;
    case 'banner': riPut(riBanner(),x,y); return true;
    case 'moosehead': riPut(riMoose(),x,y); return true;
    case 'candles': { riPut(riCandles(),x,y); for(let i=0;i<3;i++){ const cx=x-10+i*10, h=14-i*3; r2FlameLive(cx,y-h-1.2,0.62,t,cx*0.37+i); glowAt(cx,y-h-3,16,'255,200,110',0.42+0.08*Math.sin(t*9+i)); } return true; }
    case 'coinpile': { if(G.found[o.id]) return true; riPut(riCoins(),x,y); glowAt(x,y-2,20,'255,220,110',0.16+0.08*Math.sin(t*4+x)); return true; }
  }
  return false;
}


// ---------- 4. caves and dungeons: the cave canvas (renderCaveRooms in a2f_caves.js hands over to riCaveRooms)
// each theme's materials. f (floor): natural earth, gravel, moss, snow, sand, basalt, rock; built slab, marble, iron,
// plank. w (walls): natural rock or icerock; built block, iceblock, plate. Colours come from the theme's CAVE_STYLE.
const RIC={
  earth:{f:'earth',w:'rock',roots:1}, mine:{f:'gravel',w:'rock',timber:1}, bog:{f:'moss',w:'rock',wet:1,moss:1}, ice:{f:'snow',w:'icerock'}, crystal:{f:'rock',w:'rock',crys:1}, ember:{f:'basalt',w:'rock',hot:1},
  leap:{f:'slab',w:'block',moss:1}, tide:{f:'slab',w:'block',wet:1}, sky:{f:'marble',w:'block',gold:1}, c_tide:{f:'slab',w:'block',wet:1},
  c_sea:{f:'sand',w:'rock',wet:1}, c_brass:{f:'iron',w:'plate'}, c_light:{f:'plank',w:'block'}, c_shadow:{f:'slab',w:'block',crys:1},
  f_glacier:{f:'snow',w:'iceblock'}, f_forge:{f:'slab',w:'block',hot:1}, f_sky:{f:'marble',w:'block',gold:1}, f_stone:{f:'slab',w:'block'}, f_dread:{f:'slab',w:'block'},
  m_lumen:{f:'slab',w:'block'}, m_burrows:{f:'sand',w:'rock',roots:1}, m_mirror:{f:'marble',w:'block'}, m_obs:{f:'slab',w:'block'}, m_coral:{f:'sand',w:'rock',wet:1}, m3p_coral:{f:'sand',w:'rock',wet:1}, m3lab:{f:'slab',w:'block'}
};
function riTheme(th){ return RIC[th]||{f:'rock',w:'rock'}; }
// the cave canvas: 0.5 px per world px as before on phones, 0.75 elsewhere (the texture holds up better close in)
function riCaveS(){ return 0.5; }
function riCaveRooms(A,def){
  const t0=performance.now(), c=A.cave, cs=c.cell, S=riCaveS(), W2=c.w*cs, H2=c.h*cs, th=def.theme, st=CAVE_STYLE[th]||CAVE_STYLE.earth, T=riTheme(th), rng=mulberry32(def.seed);
  RI.cv={th,S,T,st};
  const w=c.w, h=c.h, n=w*h, cls=new Uint8Array(n);   // 0 floor, 1 water, 2 wall at an edge, 3 rock deep inside
  const solid=(i,j)=>i<0||j<0||i>=w||j>=h||c.grid[j*w+i]===1&&c.typ[j*w+i]!==1;
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const k=j*w+i; if(c.typ[k]===1){ cls[k]=1; continue; } if(c.grid[k]!==1){ cls[k]=0; continue; }
    let touch=false; for(let dj=-1;dj<=1&&!touch;dj++) for(let di=-1;di<=1;di++){ if(!(di||dj)) continue; if(!solid(i+di,j+dj)){ touch=true; break; } } cls[k]=touch?2:3; }
  // water depth: how many cells to the nearest bank (0..3)
  const wd=new Uint8Array(n); for(let k=0;k<n;k++) if(cls[k]===1) wd[k]=3;
  for(let it=0;it<3;it++) for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const k=j*w+i; if(cls[k]!==1) continue; let m=wd[k]; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const a=i+di, b=j+dj; const q=a<0||b<0||a>=w||b>=h?-1:cls[b*w+a]===1?wd[b*w+a]:-1; m=Math.min(m,q+1); } wd[k]=m; }
  const cv=riCavePaint(c,def,st,T,cls,wd,S);
  const g=cv.getContext('2d'); g.save(); g.scale(S,S);
  // puzzle cells (pits, spikes, runes, currents and the rest): their own painters, on top of the rock
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const k=j*w+i; if(c.grid[k]!==0||cls[k]===1) continue; if(c.typ[k]>=3) trialPaintCell(g,c,k,i,j,i*cs,j*cs,cs,st,rng,def); }
  riCaveMarks(g,A,def,c,cs,st);
  riCaveDecor(g,c,cs,st,T,cls,rng,def);
  if(def.trial) for(let j=0;j<h;j++) for(let i=0;i<w;i++){ if(cls[j*w+i]!==2) continue; const face=!solid(i,j+1); trialPaintWall(g,c,i,j,i*cs,j*cs,cs,st,rng,def,face,face?cs*0.6:cs); }
  g.restore();
  A.canvas=cv; A.canvasS=S; renderCaveMini(A);
  riStats('cave',performance.now()-t0);
}
// the theme's texture tiles (TS x TS world px at 1 px each, RGB): floor, wall top, wall face rows, ice. Painted once
// per theme and look; the cave pass then only samples them, so a whole cave paints in a few tens of ms
const RI_TS=384;
function riCaveTiles(th,st,T,cs,S){ S=S||0.5; return riCache('cvt:'+th+':'+cs+':'+S,()=>{
  const TS=Math.round(RI_TS*S), F=riTab('f'), Rr=riTab('r'), nat=T.w==='rock'||T.w==='icerock', seed=th.length*37%997, C=k=>riNat(hexRGB(st[k]),nat?0.8:0.84);
  const fl=C('floor'), fl2=C('floor2'), top=C('top'), face=C('face'), acc=hexRGB(st.accent), o=[0,0,0,1];
  const floorK=riCaveFloorFn(T,fl,fl2,acc,F,Rr,seed,cs);
  const mk=(w,h,fn)=>{ const a=new Uint8ClampedArray(w*h*3); for(let y=0;y<h;y++) for(let x=0;x<w;x++){ fn((x+0.5)/S,(y+0.5)/S,o); const p=(y*w+x)*3; a[p]=o[0]; a[p+1]=o[1]; a[p+2]=o[2]; } return a; };
  const floor=mk(TS,TS,(x,y,o)=>{ const i=Math.floor(x/cs), j=Math.floor(y/cs); floorK(x,y,i,j,x-i*cs,y-j*cs,o); });
  const tops=mk(TS,TS,(x,y,o)=>{ const j=Math.floor(y/cs), v=y-j*cs; let kk;
    if(T.w==='block'||T.w==='iceblock'||T.w==='plate'){ const bw=T.w==='plate'?cs:cs*0.5, row=Math.floor(v/(cs*0.3)), off=row%2?bw*0.5:0, bx=((x+off)%bw+bw)%bw, by=v-row*cs*0.3; kk=(0.86+rzHash(Math.floor((x+off)/bw),j*7+row,seed)*0.2)*(0.92+0.14*riS(F,x*1.4,y*1.4)); if(bx<1.4||by<1.2) kk*=T.w==='plate'?0.7:0.55; else if(bx<2.6||by<2.4) kk*=1.08; if(T.w==='plate'&&(Math.abs(bx-4)<1.3||Math.abs(bw-bx-4)<1.3)&&Math.abs(by-cs*0.15)<1.3) kk*=1.4; }
    else { const n1=riS(F,x*0.9+seed,y*0.9), lay=Math.sin(y*0.55+riS(F,x*0.25,y*0.25)*5), cr=riS(Rr,x*0.7,y*0.7+seed)*riSm(0.55,0.75,riS(F,x*0.2+30,y*0.2)); kk=(0.8+0.3*n1)*(0.92+0.12*riS(F,x*3,y*3))*(lay>0.8?0.88:lay<-0.85?1.06:1)*(cr>0.97?0.74:1); }
    riSet(o,T.w==='iceblock'||T.w==='icerock'?[top[0]*0.96,top[1],top[2]*1.06]:top,kk);
    if(T.w==='iceblock'){ const sp=riS(F,x*0.5+40,y*0.5); o[0]+=sp*18; o[1]+=sp*22; o[2]+=sp*26; } });
  const FR=Math.ceil(32*S), faces=mk(TS,FR,(x,y,o)=>{ const fy=y; let kk;   // face rows from the top edge of the face down
    if(T.w==='block'||T.w==='iceblock'||T.w==='plate'){ const rh=cs*0.4/3, row=Math.floor(fy/rh), bw=cs*0.5, off=row%2?bw*0.5:0, bx=((x+off)%bw+bw)%bw, by=fy-row*rh; kk=(0.86+rzHash(Math.floor((x+off)/bw),row,seed+3)*0.22)*(0.93+0.12*riS(F,x*1.6,fy*1.6)); if(by<1.3||bx<1.3) kk*=0.5; else if(by<2.6) kk*=1.1; }
    else { const strata=Math.sin(fy*0.9+riS(F,x*0.12,fy*0.2+seed)*7), crack=riS(Rr,x*1.2,fy*0.3+seed); kk=(0.8+0.3*riS(F,x*0.8+seed,fy*0.8))*(strata>0.75?0.8:strata<-0.8?1.08:1)*(crack>0.965?0.68:1)*(0.9+0.15*riS(F,x*2.5,fy*2.5)); }
    riSet(o,T.w==='iceblock'?[face[0]*1.1,face[1]*1.15,face[2]*1.2]:face,kk); });
  const ice=mk(TS,TS,(x,y,o)=>{ o[0]=o[1]=o[2]=170; riIce(x,y,0,0,o,F,Rr); });
  return {floor,tops,faces,FR,TS,ice,top,face,fl,wat:riNat(hexRGB(st.water),0.86)};
}); }
// the cave canvas, pixel by pixel: floor (from the tile, with large soft tone changes and occlusion at the walls),
// deep water, a wall's top with a lit lip toward the light, its front face darker toward its foot
function riCavePaint(c,def,st,T,cls,wd,S){
  const cs=c.cell, w=c.w, h=c.h, tl=riCaveTiles(def.theme,st,T,cs,S), TS=tl.TS, F=riTab('f'), nat=T.w==='rock'||T.w==='icerock', seed=(def.seed|0)%997;
  const W=Math.round(w*cs*S), H=Math.round(h*cs*S), cv=mkCanvas(W,H), g=cv.getContext('2d'), id=g.createImageData(W,H), d=id.data;
  const SOL=(i,j)=>i<0||j<0||i>=w||j>=h||cls[j*w+i]>=2, WAT=(i,j)=>i>=0&&j>=0&&i<w&&j<h&&cls[j*w+i]===1;
  // per cell: neighbour bits (1 N solid, 2 S, 4 W, 8 E, 16 NW, 32 NE, 64 N water; for walls 128 face below)
  const nb=new Uint8Array(w*h);
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){ let b=0; if(SOL(i,j-1)) b|=1; if(SOL(i,j+1)) b|=2; if(SOL(i-1,j)) b|=4; if(SOL(i+1,j)) b|=8; if(SOL(i-1,j-1)) b|=16; if(SOL(i+1,j-1)) b|=32; if(WAT(i,j-1)) b|=64; if(!SOL(i,j+1)) b|=128; nb[j*w+i]=b; }
  const f2=(d0,r)=>{ const t=1-d0/(r*3); return t>0?t*t:0; };
  const top=tl.top, wat=tl.wat, snow=T.f==='snow'||T.w==='icerock', iceT=c.typ;
  for(let py=0;py<H;py++){ const y=(py+0.5)/S, j=Math.min(h-1,Math.floor(y/cs)), v=y-j*cs, ty=py%TS;
    for(let px=0;px<W;px++){ const x=(px+0.5)/S, i=Math.min(w-1,Math.floor(x/cs)), u=x-i*cs, k=j*w+i, q=cls[k], b=nb[k], tx=px%TS, p=(py*W+px)*4;
      let r,gg,bb;
      if(q===3){ const kk=0.08+0.05*riS(F,x*0.5,y*0.5); r=top[0]*kk; gg=top[1]*kk; bb=top[2]*kk; }
      else if(q===2){
        const faceS=b&128; let th0=faceS?cs*0.6:cs; if(faceS&&nat) th0+=(riS(F,x*0.6,j*13.7)-0.5)*7;
        if(v<th0){ const tp=(ty*TS+tx)*3; let kk=1;
          const nz=nat?(riS(F,x*1.7,y*1.7)-0.5)*3:0, eN=(b&1)?99:v, eW=(b&4)?99:u, eE=(b&8)?99:cs-u, eS=faceS?th0-v:99;
          if(eN+nz<3.2||eW+nz<3.2) kk=1.24; else if(eE+nz<2.6) kk=0.7; if(eS<2.4) kk*=1.16;
          r=tl.tops[tp]*kk; gg=tl.tops[tp+1]*kk; bb=tl.tops[tp+2]*kk; }
        else { const fy=v-th0, fh=cs-th0, f=fy/fh, fp=(Math.min(tl.FR-1,(fy*S)|0)*TS+tx)*3; let kk=1.05-0.7*f*f; if(f<0.06) kk*=1.22; if(T.wet&&f>0.6) kk*=0.88;
          r=tl.faces[fp]*kk; gg=tl.faces[fp+1]*kk; bb=tl.faces[fp+2]*kk; }
      }
      else if(q===1){
        const dN=WAT(i,j-1)?99:v, dS=WAT(i,j+1)?99:cs-v, dW=WAT(i-1,j)?99:u, dE=WAT(i+1,j)?99:cs-u, de=Math.min(dN,dS,dW,dE), deep=Math.min(1,(wd[k]-1)*0.33+Math.min(1,de/cs)*0.5);
        if(de<2.2&&nat){ r=tl.face[0]*0.6; gg=tl.face[1]*0.6; bb=tl.face[2]*0.6; }
        else { const sh=f2(de,4), n=riS(F,x*0.6+seed,y*0.6), dk=(0.95-0.52*deep)*(0.92+0.12*n); r=wat[0]*dk+sh*26; gg=wat[1]*dk+sh*34; bb=wat[2]*dk+sh*30;
          if(dN<14&&(b&1)){ const a=1-dN/14; r*=1-0.5*a; gg*=1-0.5*a; bb*=1-0.45*a; } }
      }
      else {
        const tp=(ty*TS+tx)*3, ice=iceT[k]===2, src=ice?tl.ice:tl.floor, big=0.88+0.24*riS(F,x*0.035+seed,y*0.035);
        r=src[tp]; gg=src[tp+1]; bb=src[tp+2];
        let a=ice?1:big;
        if(b&1) a-=0.55*f2(v,4.5); if(b&4) a-=0.32*f2(u,3.4); if(b&8) a-=0.26*f2(cs-u,3.4); if(b&2) a-=0.18*f2(cs-v,2.6);
        if(!(b&1)&&!(b&4)&&(b&16)) a-=0.3*f2(Math.hypot(u,v),3.8); if(!(b&1)&&!(b&8)&&(b&32)) a-=0.26*f2(Math.hypot(cs-u,v),3.8);
        if(b&64) a-=0.15*f2(v,2.6);
        if(a<0.25) a=0.25; r*=a; gg*=a; bb*=a;
        if(snow){ const o2=1-a; r-=o2*14; bb+=o2*10; }
      }
      d[p]=r; d[p+1]=gg; d[p+2]=bb; d[p+3]=255;
    } }
  g.putImageData(id,0,0); return cv;
}
// slick ice (the Icefang floor and every ice cell): pale blue, glassy, with long streaks of reflected light and cracks
function riIce(x,y,u,v,o,F,Rr){
  const n=riS(F,x*0.5,y*0.5), st=riS(F,x*0.12+y*0.12,(y-x)*0.9), cr=riS(Rr,x*0.9,y*0.9), a=(o[0]+o[1]+o[2])/(3*170);
  // deep clear ice: blue-teal under the surface, darker in the depths, with long bright reflections and white cracks
  const dp=riS(F,x*0.22+31,y*0.22);
  let r=96+34*n-22*dp, gg=150+30*n-16*dp, b=196+26*n-8*dp;
  const streak=Math.pow(Math.max(0,st-0.5)/0.5,1.6); r+=streak*120; gg+=streak*96; b+=streak*58;
  if(cr>0.978&&riS(F,x*0.15+80,y*0.15)>0.6){ r=r*0.7+70; gg=gg*0.72+76; b=b*0.78+66; }
  const ao=Math.min(1,a*1.25); o[0]=r*ao; o[1]=gg*ao; o[2]=b*Math.min(1,ao+0.1);
}
function riCaveFloorFn(T,fl,fl2,acc,F,Rr,seed,cs){
  const f=T.f, slab=f==='slab'||f==='marble'||f==='iron';
  return (x,y,i,j,u,v,o)=>{
    const n1=riS(F,x*0.45+seed,y*0.45), n2=riS(F,x*1.6,y*1.6+seed), wn=riW(x*1.3|0,y*1.3|0);
    let C=n1<0.5?fl:fl2, kk;
    if(slab){ // one dressed slab per cell: its own tone, mortar joints, a bevel, wear
      const h=rzHash(i,j,seed), e=Math.min(u,cs-u,v,cs-v)+(riS(F,x*2,y*2)-0.5)*1.2;
      if(e<1.3){ const mk=f==='iron'?0.35:T.moss?0.4:0.45; riSet(o,f==='marble'?[fl[0]*0.7,fl[1]*0.68,fl[2]*0.64]:[fl[0]*mk+8,fl[1]*mk+8,fl[2]*mk+6],0.9+0.2*wn); if(T.moss&&riS(F,x*1.4,y*1.4)>0.55){ o[0]=o[0]*0.6+30; o[1]=o[1]*0.6+52; o[2]=o[2]*0.6+20; } if(T.gold&&f==='marble') { o[0]=190; o[1]=150; o[2]=80; } return; }
      kk=(0.88+h*0.18)*(0.93+0.12*n2);
      if(e<3) kk*=1+(u<v&&u<cs-v||v<u&&v<cs-u?0.08:-0.1)*(3-e)/1.7;
      if(f==='marble'){ const vein=riS(Rr,x*1.1+h*80+riS(F,x*0.8,y*0.8)*14,y*1.1+h*40); kk*=vein>0.962?1-0.16*(vein-0.962)/0.038:1; kk*=0.97+0.06*riS(F,x*0.35+h*60,y*0.35); kk*=1+0.06*riE(((u-cs*0.35)**2+(v-cs*0.3)**2)/(cs*cs*0.06)); }
      if(f==='iron'){ const br=riS(F,x*0.08+h*50,y*4); kk*=0.84+0.24*br; const rv=(Math.abs(u-5)<1.5||Math.abs(cs-u-5)<1.5)&&(Math.abs(v-5)<1.5||Math.abs(cs-v-5)<1.5); if(rv) kk*=1.45; const rust=riSm(0.6,0.8,riS(F,x*0.7+30,y*0.7)); C=[C[0]*(1-rust*0.2)+rust*40,C[1]*(1-rust*0.3)+rust*14,C[2]*(1-rust*0.4)]; }
      if(h>0.9&&f!=='iron'){ const cr=riS(Rr,x*0.8,y*0.8); if(cr>0.94) kk*=0.66; }
      if(T.wet&&riS(F,x*0.3+70,y*0.3)>0.62){ kk*=0.85; C=[C[0]*0.9,C[1]*0.96,C[2]*1.04]; }
      riSet(o,C,kk); return;
    }
    if(f==='plank'){ const ph=12, r=Math.floor(y/ph), t=y-r*ph, b=Math.floor((x+rzHash(r,1,seed)*90)/90), hh=rzHash(r,b,seed); kk=(0.86+hh*0.2)*riWoodK(x,y,r*7+b,false,F); if(t<0.8) kk*=0.45; else if(t<1.8) kk*=1.08; const bx=(x+rzHash(r,1,seed)*90)%90; if(bx<0.8) kk*=0.5; riSet(o,fl,kk); return; }
    const big=riS(F,x*0.16+seed*2,y*0.16);
    kk=(0.9+0.34*n1)*(0.92+0.14*n2)*(0.92+0.18*big);
    if(wn>0.985) kk*=1.2; else if(wn<0.02) kk*=0.78;
    const cr=riS(Rr,x*0.55+seed,y*0.55), crm=riSm(0.62,0.8,riS(F,x*0.2+90,y*0.2));
    if(cr>0.975&&crm>0.05) kk*=1-0.35*crm;
    if(f==='earth'){ const st=riW(x*0.28|0,y*0.28|0); if(st>0.992){ kk*=1.35; } C=[C[0]*1.05,C[1],C[2]*0.92]; }
    else if(f==='gravel'){ kk*=0.9+0.25*(riW(x*0.7|0,y*0.7|0)-0.5); C=[C[0]*0.96,C[1]*0.96,C[2]*0.98]; }
    else if(f==='moss'){ const m=riSm(0.5,0.72,riS(F,x*0.5+40,y*0.5)); C=[C[0]*(1-m*0.25),C[1]*(1+m*0.2),C[2]*(1-m*0.3)]; const p=riS(F,x*0.25+7,y*0.25+3); if(p<0.3){ const d=(0.3-p)/0.3; C=[C[0]*(1-d*0.5),C[1]*(1-d*0.4),C[2]*(1-d*0.25)]; kk*=1-0.2*d; if(riW(x|0,y|0)>0.995) kk*=2; } }
    else if(f==='snow'){ const sp=riW(x*2|0,y*2|0); kk=0.86+0.2*n1+0.06*n2; C=[C[0]*1.02,C[1]*1.03,C[2]*1.06]; if(sp>0.996) kk*=1.25; }
    else if(f==='sand'){ const rip=Math.sin(y*0.45+riS(F,x*0.3,y*0.3)*9+x*0.08); kk*=0.94+0.06*rip; if(wn>0.996){ C=[220,206,190]; kk=1; } }
    else if(f==='basalt'){ const gl=riS(Rr,x*0.4+seed,y*0.4); C=[C[0]*1.3,C[1]*1.22,C[2]*1.2]; if(gl>0.982&&T.hot&&riS(F,x*0.15+60,y*0.15)>0.6){ const e=(gl-0.982)/0.018; riSet(o,C,kk); o[0]+=e*170; o[1]+=e*60; o[2]+=e*12; return; } }
    else if(f==='rock'&&T.crys){ if(wn>0.996){ C=[acc[0]*0.8,acc[1]*0.8,acc[2]*0.9]; kk=1.1; } }
    if(T.roots){ const rt=riS(Rr,x*0.22+11,y*0.22+5); if(rt>0.975&&riS(F,x*0.15,y*0.15)>0.55){ C=[70,48,30]; kk=0.9; } }
    riSet(o,C,kk);
  };
}
// the floor marks of the Classic cave, in stone: carved sigils in puzzle rooms, the boss ring, mine-cart rails
function riCaveMarks(g,A,def,c,cs,st){
  const ac=hexRGB(st.accent).join(',');
  for(const k in c.rooms){ const R=c.rooms[k];
    if(R.kind==='torches'||R.kind==='braziers'||R.kind==='crystal'){ const x=(R.ox+8.5)*cs, y=(R.oy+6.5)*cs; g.save(); g.lineCap='round';
      for(const [col,lw,dy] of [['rgba(0,0,0,.4)',4,1],[`rgba(${ac},.16)`,2.2,0],['rgba(255,240,220,.08)',1,-1]]){ g.strokeStyle=col; g.lineWidth=lw; g.beginPath(); g.arc(x,y+dy,cs*2.2,0,TAU); g.stroke(); g.beginPath(); g.arc(x,y+dy,cs*1.4,0,TAU); g.stroke(); for(let a=0;a<6;a++){ g.beginPath(); g.moveTo(x+Math.cos(a)*cs*1.4,y+dy+Math.sin(a)*cs*1.4); g.lineTo(x+Math.cos(a)*cs*2.2,y+dy+Math.sin(a)*cs*2.2); g.stroke(); } }
      g.restore(); }
    if(R.kind==='tboss'&&def.trial&&def.theme!=='sky'){ const x=(R.ox+1+R.iw/2)*cs, y=(R.oy+1+R.ih/2)*cs, P=TPAL[def.theme], col=P.rune; g.save(); g.lineCap='round';
      for(const [rr,lw,a] of [[cs*7.6,10,0.3],[cs*7.6,3,0.55],[cs*6.6,2,0.5],[cs*2.4,3,0.5]]){ g.strokeStyle=a>0.5?`rgba(${col},${a})`:`rgba(0,0,0,${a})`; g.lineWidth=lw; g.beginPath(); g.ellipse(x,y,rr,rr*0.78,0,0,TAU); g.stroke(); }
      for(let q=0;q<12;q++){ const an=q/12*TAU; g.strokeStyle=`rgba(${col},.38)`; g.lineWidth=2.4; g.beginPath(); g.moveTo(x+Math.cos(an)*cs*2.4,y+Math.sin(an)*cs*2.4*0.78); g.lineTo(x+Math.cos(an)*cs*6.6,y+Math.sin(an)*cs*6.6*0.78); g.stroke(); g.fillStyle=`rgba(${col},.65)`; g.beginPath(); const qx=x+Math.cos(an)*cs*7.1, qy=y+Math.sin(an)*cs*7.1*0.78; g.moveTo(qx,qy-7); g.lineTo(qx+7,qy); g.lineTo(qx,qy+7); g.lineTo(qx-7,qy); g.closePath(); g.fill(); }
      g.restore(); }
    if(R.cart){ const ms=c.marks.filter(m=>m.room===k&&(m.ch==='B'||m.ch==='P')); if(ms.length===2){ const [a,b]=ms; riRails(g,(a.i+0.5)*cs,(a.j+0.5)*cs,(b.i+0.5)*cs,(b.j+0.5)*cs,cs); } } }
}
// a straight run of mine rails: worn sleepers, two iron rails with a bright running top
function riRails(g,x0,y0,x1,y1,cs){
  const L=Math.hypot(x1-x0,y1-y0), a=Math.atan2(y1-y0,x1-x0); g.save(); g.translate(x0,y0); g.rotate(a);
  for(let s=-cs*0.4;s<=L+cs*0.4;s+=cs*0.5){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(s-2,-15,8,32); g.fillStyle='#5a3e26'; g.fillRect(s-3,-16,7,32); g.fillStyle='rgba(255,230,190,.12)'; g.fillRect(s-3,-16,7,1.5); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(s+2.4,-16,1.6,32); }
  for(const off of [-10,10]){ g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(-cs*0.4,off-1,L+cs*0.8,5); g.fillStyle='#4a4a52'; g.fillRect(-cs*0.4,off-2,L+cs*0.8,4); g.fillStyle='rgba(220,220,230,.6)'; g.fillRect(-cs*0.4,off-2,L+cs*0.8,1.2); }
  g.restore();
}
// things on the rock: crystals on the walls, icicles under ice faces, roots hanging down earth faces, timbers in the
// mine, warm veins in the hot caves; drawn with canvas strokes onto the cave canvas (world units)
function riCaveDecor(g,c,cs,st,T,cls,rng,def){
  const w=c.w, h=c.h, ac=hexRGB(st.accent);
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const k=j*w+i; if(cls[k]!==2) continue; const below=j+1<h?cls[k+w]:2; if(below>=2) continue;
    const x=i*cs, y=j*cs, ty=y+cs*0.6, r=rng();
    if(T.roots&&r<0.35){ for(let q=0;q<2;q++){ const rx=x+6+rng()*(cs-12), L=cs*(0.25+rng()*0.35); g.strokeStyle=q?'rgba(50,34,20,.9)':'rgba(84,60,36,.9)'; g.lineWidth=1.8-q*0.5; g.beginPath(); g.moveTo(rx,ty); g.quadraticCurveTo(rx+rng()*8-4,ty+L*0.5,rx+rng()*10-5,ty+L); g.stroke(); } }
    if(T.timber&&i%4===0){ g.fillStyle='#4a3220'; g.fillRect(x+4,ty-2,7,cs*0.42); g.fillStyle='rgba(255,220,170,.18)'; g.fillRect(x+4,ty-2,1.6,cs*0.42); g.fillStyle='#5a3e26'; g.fillRect(x-2,ty-4,cs*0.5,6); g.fillStyle='rgba(255,220,170,.2)'; g.fillRect(x-2,ty-4,cs*0.5,1.4); }
    if((T.w==='icerock'||T.w==='iceblock')&&r<0.45){ for(let q=0;q<3;q++){ const ix=x+5+rng()*(cs-10), L=5+rng()*12; g.fillStyle='rgba(210,236,255,.75)'; g.beginPath(); g.moveTo(ix-2.4,ty+cs*0.38); g.lineTo(ix,ty+cs*0.38+L); g.lineTo(ix+2.4,ty+cs*0.38); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(ix-1,ty+cs*0.38,0.8,L*0.6); } }
    if(T.crys&&r<0.16){ const cx=x+cs*0.5+(rng()-0.5)*cs*0.4, cy=ty+cs*0.2; for(let q=0;q<3;q++){ const a=-Math.PI/2+(q-1)*0.5+(rng()-0.5)*0.2, L=7+rng()*8; g.save(); g.translate(cx+(q-1)*4,cy); g.rotate(a);
        g.fillStyle=`rgb(${ac[0]*0.5|0},${ac[1]*0.5|0},${ac[2]*0.6|0})`; g.beginPath(); g.moveTo(0,-2.6); g.lineTo(L,0); g.lineTo(0,2.6); g.closePath(); g.fill(); g.fillStyle=`rgba(${ac[0]},${ac[1]},${ac[2]},.85)`; g.beginPath(); g.moveTo(0,-2.6); g.lineTo(L,0); g.lineTo(0,0); g.closePath(); g.fill(); g.restore(); } }
    if(T.hot&&r<0.12){ g.strokeStyle='rgba(255,120,40,.55)'; g.lineWidth=1.4; g.beginPath(); let px=x+rng()*cs, py=ty+2; g.moveTo(px,py); for(let q=0;q<3;q++){ px+=(rng()-0.5)*10; py+=cs*0.12; g.lineTo(px,py); } g.stroke(); }
    if(T.moss&&r<0.4){ g.fillStyle='rgba(70,96,40,.55)'; g.beginPath(); g.ellipse(x+rng()*cs,ty-2,6+rng()*8,2.5+rng()*2,0,0,TAU); g.fill(); }
  }
}


// ---- a cached texture tile (TS world px square at S px each) cut into cells: cells never straddle a tile edge
function riTile(key,S,fn){ return riCache('tile:'+key+':'+S,()=>riPaint(RI_TS,RI_TS,S,fn)); }
// draw the tile's texture over (x,y,w,h); it is sampled at (lx,ly) (default: x,y), wrapping at the tile's edge
function riTileDraw(g,tile,x,y,w,h,S,lx,ly){ const TS=RI_TS; lx=lx==null?x:lx; ly=ly==null?y:ly;
  for(let oy=0;oy<h;){ const sy=(((ly+oy)%TS)+TS)%TS, hh=Math.min(h-oy,TS-sy);
    for(let ox=0;ox<w;){ const sx=(((lx+ox)%TS)+TS)%TS, ww=Math.min(w-ox,TS-sx); g.drawImage(tile,sx*S,sy*S,ww*S,hh*S,x+ox,y+oy,ww,hh); ox+=ww; }
    oy+=hh; } }
// packed snow: matte, faintly lumpy, sparkles; reads as "here you stop" next to glassy ice
function riSnowFn(){ const F=riTab('f'); return (x,y,o)=>{ const n=riS(F,x*0.7,y*0.7), n2=riS(F,x*2.4+30,y*2.4), sp=riW(x*2|0,y*2|0); const k=(0.86+0.12*n)*(0.95+0.08*n2)*(sp>0.995?1.18:sp<0.01?0.92:1); o[0]=212*k; o[1]=218*k; o[2]=226*k; const pr=Math.sin(x*0.35+y*0.21+n*6); if(pr>0.9){ o[0]*=0.96; o[1]*=0.97; } }; }
function riIceFn(){ const F=riTab('f'), Rr=riTab('r'); return (x,y,o)=>{ o[0]=o[1]=o[2]=170; riIce(x,y,0,0,o,F,Rr); }; }
// the rebuilt caves' cells in this look (e9b_caves2.js c2PaintStatic hands over to this)
function riC2Static(A,def){
  const c=A.cave, cs=c.cell, S=A.canvasS, g=A.canvas.getContext('2d'), P=C2PAL[def.theme]||C2PAL.mine, rng=mulberry32(def.seed*13+7), Zc=c.c2, T=C2.T;
  const st=CAVE_STYLE[def.theme]||CAVE_STYLE.earth, TT=riTheme(def.theme), tl=riCaveTiles(def.theme,st,TT,cs,S);
  g.save(); g.setTransform(S,0,0,S,0,0); g.lineJoin='round'; g.lineCap='round';
  const typ=(i,j)=>(i<0||j<0||i>=c.w||j>=c.h)?-1:c.typ[j*c.w+i], solid=(i,j)=>i<0||j<0||i>=c.w||j>=c.h||c.grid[j*c.w+i]===1, wet=q=>q===T.water||q===T.current||q===T.whirl||q===T.spring;
  for(const id in c.rooms){ const R=c.rooms[id]; if(!R.tint2) continue; g.globalAlpha=0.7; g.fillStyle=R.tint2; g.fillRect((R.ox+1)*cs,(R.oy+1)*cs,R.iw*cs,R.ih*cs); g.globalAlpha=1; }
  const snow=def.theme==='ice', snowT=snow?riTile('snow',S,riSnowFn()):null, iceT=riTile('ice2',S,riIceFn());
  const faceStrip=(x,y,w,hh,a)=>{ const gr=g.createLinearGradient(0,y,0,y+hh); gr.addColorStop(0,`rgba(${tl.face.map(v=>v*1.1|0).join(',')},${a})`); gr.addColorStop(0.5,`rgba(${tl.face.map(v=>v*0.55|0).join(',')},${a})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,w,hh); };
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){
    const k=j*c.w+i, t=c.typ[k]; if(c.grid[k]===1) continue;
    const x=i*cs, y=j*cs;
    if(t<40){ if(!snow) continue; const R=c2RoomOf(c,i,j); if(!R||!R.lay) continue; riTileDraw(g,snowT,x,y,cs,cs,S);
      const q=(a,b)=>typ(a,b)===T.ice; g.fillStyle='rgba(90,110,130,.28)'; if(q(i,j-1)) g.fillRect(x,y,cs,1.6); if(q(i-1,j)) g.fillRect(x,y,1.6,cs); if(q(i+1,j)) g.fillRect(x+cs-1.6,y,1.6,cs); if(q(i,j+1)) g.fillRect(x,y+cs-1.6,cs,1.6);
      if(solid(i,j-1)){ const gr=g.createLinearGradient(0,y,0,y+cs*0.4); gr.addColorStop(0,'rgba(40,60,90,.4)'); gr.addColorStop(1,'rgba(40,60,90,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.4); }
      continue; }
    if(t===T.abyss){
      g.fillStyle=P.abyss; g.fillRect(x,y,cs,cs);
      if(typ(i,j-1)!==T.abyss){ faceStrip(x,y,cs,cs*0.62,1); g.fillStyle='rgba(0,0,0,.3)'; for(let s=0;s<3;s++) g.fillRect(x+rng()*cs,y+cs*0.12+s*cs*0.13,5+rng()*12,1.4); g.fillStyle='rgba(255,240,210,.22)'; g.fillRect(x,y,cs,1.6); }
      if(typ(i-1,j)!==T.abyss&&!solid(i-1,j)){ const gr=g.createLinearGradient(x,0,x+8,0); gr.addColorStop(0,'rgba(0,0,0,.5)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,8,cs); }
      if(typ(i+1,j)!==T.abyss&&!solid(i+1,j)){ g.fillStyle='rgba(255,240,210,.06)'; g.fillRect(x+cs-3,y,3,cs); }
      if(typ(i,j+1)!==T.abyss&&!solid(i,j+1)){ g.fillStyle='rgba(255,240,210,.14)'; g.fillRect(x,y+cs-2,cs,2); }
    }else if(wet(t)){
      const base=hexRGB(t===T.spring?(P.spring||'#2a8a9a'):(P.water||'#1f4a44')).map(v=>v*0.92), dN=!wet(typ(i,j-1)), dS=!wet(typ(i,j+1)), dW=!wet(typ(i-1,j)), dE=!wet(typ(i+1,j));
      g.fillStyle=`rgb(${base.map(v=>v|0).join(',')})`; g.fillRect(x,y,cs,cs);
      // depth: darker away from the banks
      const deep=!(dN||dS||dW||dE); if(deep){ g.fillStyle='rgba(0,8,16,.22)'; g.fillRect(x,y,cs,cs); }
      for(const [on,gx0,gy0,gx1,gy1,rx,ry,rw,rh] of [[dN,0,y,0,y+cs*0.45,x,y,cs,cs*0.45],[dS,0,y+cs,0,y+cs*0.6,x,y+cs*0.6,cs,cs*0.4],[dW,x,0,x+cs*0.4,0,x,y,cs*0.4,cs],[dE,x+cs,0,x+cs*0.6,0,x+cs*0.6,y,cs*0.4,cs]]){ if(!on) continue; const gr=g.createLinearGradient(gx0,gy0,gx1,gy1); gr.addColorStop(0,'rgba(150,200,200,.2)'); gr.addColorStop(1,'rgba(150,200,200,0)'); g.fillStyle=gr; g.fillRect(rx,ry,rw,rh); }
      if(dN){ g.fillStyle='rgba(0,0,0,.38)'; g.fillRect(x,y,cs,5); }
      g.strokeStyle=P.foam||'rgba(255,255,255,.5)'; g.lineWidth=1.1; g.globalAlpha=0.7;
      const brk=(x0,y0,x1,y1)=>{ const n=4; for(let s=0;s<n;s++){ if(rng()<0.3) continue; const a=s/n, b=(s+0.6+rng()*0.3)/n; g.beginPath(); g.moveTo(x0+(x1-x0)*a,y0+(y1-y0)*a+(rng()-0.5)); g.lineTo(x0+(x1-x0)*b,y0+(y1-y0)*b+(rng()-0.5)); g.stroke(); } };
      if(dN) brk(x+1,y+6.5,x+cs-1,y+6.5); if(dS) brk(x+1,y+cs-3,x+cs-1,y+cs-3); if(dW) brk(x+2.5,y+2,x+2.5,y+cs-2); if(dE) brk(x+cs-2.5,y+2,x+cs-2.5,y+cs-2);
      g.globalAlpha=1;
    }else if(t===T.ice){
      riTileDraw(g,iceT,x,y,cs,cs,S);
      // where slick ice meets anything else, a fine bright edge and a darker line under it
      g.fillStyle='rgba(255,255,255,.55)'; if(typ(i,j-1)!==T.ice) g.fillRect(x,y,cs,1.2); if(typ(i-1,j)!==T.ice) g.fillRect(x,y,1.2,cs);
      g.fillStyle='rgba(60,100,140,.4)'; if(typ(i,j+1)!==T.ice) g.fillRect(x,y+cs-1.4,cs,1.4); if(typ(i+1,j)!==T.ice) g.fillRect(x+cs-1.4,y,1.4,cs);
    }else if(t===T.lava){
      riLavaDraw(g,x,y,cs,cs);
    }else if(t===T.low||t===T.mid){
      const lo=t===T.low;
      if(lo){ riTileDraw(g,riTile('crust',S,riCrustFn()),x,y,cs,cs,S); }
      else { riTileDraw(g,riTile('basalt',S,(xx,yy,o)=>{ riSet(o,[96,78,70],(0.86+0.24*riS(riTab('f'),xx*0.8,yy*0.8))*(riW(xx*1.4|0,yy*1.4|0)>0.99?1.2:1)); }),x,y,cs,cs,S);
        g.fillStyle='rgba(255,240,220,.12)'; g.fillRect(x+1,y+1,cs-2,2); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x,y+cs-4,cs,4); }
    }else if(t===T.pad){
      g.fillStyle=(P.water||'#1f4a44'); g.fillRect(x,y,cs,cs);
      g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x+cs/2+2,y+cs/2+4,cs*0.48,cs*0.38,0,0,TAU); g.fill();
      g.fillStyle='#4e7e3c'; g.beginPath(); g.moveTo(x+cs/2,y+cs/2); g.ellipse(x+cs/2,y+cs/2,cs*0.47,cs*0.4,0,0.35,TAU-0.15); g.closePath(); g.fill();
      g.strokeStyle='rgba(20,40,14,.7)'; g.lineWidth=1.4; g.stroke(); g.strokeStyle='rgba(200,240,170,.22)'; g.lineWidth=1; for(let a=0.8;a<6;a+=0.9){ g.beginPath(); g.moveTo(x+cs/2,y+cs/2); g.lineTo(x+cs/2+Math.cos(a)*cs*0.38,y+cs/2+Math.sin(a)*cs*0.32); g.stroke(); }
    }
  }
  // rails: sleepers, then two steel rails with a bright running top; over a shaft the sleepers sit on a trestle
  const R=Zc.rail;
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){
    const k=j*c.w+i; if(!R[k]) continue;
    const x=(i+0.5)*cs, y=(j+0.5)*cs, nb=[0,1,2,3].filter(d=>{ const q=(j+C2DIR[d][1])*c.w+i+C2DIR[d][0]; return R[q]; }), over=c.typ[k]===T.abyss;
    if(over){ g.fillStyle='#3e2a1a'; for(const d of nb){ const [dx,dy]=C2DIR[d]; if(dx) g.fillRect(x+Math.min(0,dx*cs/2),y-cs*0.32,cs/2,cs*0.14), g.fillRect(x+Math.min(0,dx*cs/2),y+cs*0.18,cs/2,cs*0.14); else g.fillRect(x-cs*0.32,y+Math.min(0,dy*cs/2),cs*0.14,cs/2), g.fillRect(x+cs*0.18,y+Math.min(0,dy*cs/2),cs*0.14,cs/2); }
      g.fillStyle='rgba(0,0,0,.5)'; g.fillRect(x-3,y+6,6,cs*0.45); }
    for(const d of nb){ const [dx,dy]=C2DIR[d]; for(const f of [0.14,0.4]){ const tx=x+dx*cs*f, ty=y+dy*cs*f; g.fillStyle='rgba(0,0,0,.35)'; if(dx) g.fillRect(tx-2,ty-cs*0.34,6,cs*0.72); else g.fillRect(tx-cs*0.34,ty-2,cs*0.72,6);
        g.fillStyle='#5e4228'; if(dx){ g.fillRect(tx-3,ty-cs*0.36,6,cs*0.72); g.fillStyle='rgba(255,230,190,.14)'; g.fillRect(tx-3,ty-cs*0.36,1.4,cs*0.72); } else { g.fillRect(tx-cs*0.36,ty-3,cs*0.72,6); g.fillStyle='rgba(255,230,190,.14)'; g.fillRect(tx-cs*0.36,ty-3,cs*0.72,1.4); } } }
    for(const [col,lw,dy0] of [['rgba(0,0,0,.45)',5,1.2],['#4a4a54',3.6,0],['rgba(226,228,236,.75)',1.2,-1]]){ g.strokeStyle=col; g.lineWidth=lw; for(const d of nb){ const [dx,dy]=C2DIR[d]; for(const s of [-1,1]){ g.beginPath(); g.moveTo(x+(dy?s*cs*0.22:0),y+(dx?s*cs*0.22:0)+dy0); g.lineTo(x+dx*cs*0.5+(dy?s*cs*0.22:0),y+dy*cs*0.5+(dx?s*cs*0.22:0)+dy0); g.stroke(); } } }
    if(nb.length===1){ const [dx,dy]=C2DIR[(nb[0]+2)%4]; g.fillStyle='#7a3a22'; const bx=x+dx*cs*0.18, by=y+dy*cs*0.18; if(dx) g.fillRect(bx-4,by-cs*0.34,8,cs*0.68); else g.fillRect(bx-cs*0.34,by-4,cs*0.68,8); g.fillStyle='rgba(255,220,180,.2)'; if(dx) g.fillRect(bx-4,by-cs*0.34,8,1.5); else g.fillRect(bx-cs*0.34,by-4,cs*0.68,1.5); }
  }
  for(const m of Zc.marks){ if(m.kind!=='lift') continue; const x=m.i*cs, y=m.j*cs;
    const L=typ(m.i-1,m.j)!==T.abyss||!Zc.marks.some(q=>q.kind==='lift'&&q.i===m.i-1&&q.j===m.j), Rr=!Zc.marks.some(q=>q.kind==='lift'&&q.i===m.i+1&&q.j===m.j), U=!Zc.marks.some(q=>q.kind==='lift'&&q.i===m.i&&q.j===m.j-1), D=!Zc.marks.some(q=>q.kind==='lift'&&q.i===m.i&&q.j===m.j+1);
    for(const [col,lw] of [['#3e2814',6],['#6a4628',4]]){ g.strokeStyle=col; g.lineWidth=lw; g.beginPath(); if(U){ g.moveTo(x,y+2); g.lineTo(x+cs,y+2); } if(D){ g.moveTo(x,y+cs-2); g.lineTo(x+cs,y+cs-2); } if(L){ g.moveTo(x+2,y); g.lineTo(x+2,y+cs); } if(Rr){ g.moveTo(x+cs-2,y); g.lineTo(x+cs-2,y+cs); } g.stroke(); } }
  g.restore();
}


// ---- puzzle pieces in caves and dungeons (drawFurnX and stoneBlock in a3c_art3.js hand over to these)
// a dressed stone block: a lit top with bevelled edges and a darker front face `lift` px tall, soft contact shadow
function riStoneBlockSpr(w,h,top,face,lift){ return riCache(`sb:${w}x${h}:${top}:${face}:${lift}`,()=>{
  const pad=6, k=2, tc=riNat(r2rgb(top),0.85), Fc=riNat(r2rgb(face),0.85), F=riTab('f'), Rr=riTab('r'), sd=(w*7+h*3+lift)%97;
  const cv=riPaint(w+pad*2,h+pad*2+2,k,(x,y,o)=>{ const X=x-pad, Y=y-pad, ft=h-lift;
    if(X<0||X>w||Y<0||Y>h){ // the contact shadow around the block, heavier to the lower right
      const dx=Math.max(0,-X,X-w), dy=Math.max(0,-Y,Y-h), d=Math.hypot(dx+(X>w?-1.5:1.5),dy+(Y>h?-2:2)), a=Math.max(0,0.45*(1-d/6))*(X>w||Y>h?1:0.5); o[0]=o[1]=o[2]=8; o[3]=a; return; }
    const e=Math.min(X,w-X,Y,h-Y);
    if(Y<ft){ let kk=(0.88+0.2*riS(F,X*1.6+sd,Y*1.6))*(0.95+0.08*riS(F,X*5,Y*5));
      const et=Math.min(X,w-X,Y,ft-Y); if(et<2.4){ const lit=(X<w-X&&X<=Y)||(Y<ft-Y&&Y<X); kk*=lit?1.22:0.8; }
      if(riS(Rr,X*0.8+sd,Y*0.8)>0.975) kk*=0.75; riSet(o,tc,kk); }
    else { const f=(Y-ft)/Math.max(1,lift); let kk=(0.9+0.18*riS(F,X*1.6+sd,Y*1.2))*(1.02-0.45*f); if(Y-ft<1.2) kk*=1.25; if(e<1) kk*=0.75; riSet(o,Fc,kk); }
  });
  cv.ox=w/2+pad; cv.oy=h/2+pad; cv.w2=w+pad*2; cv.h2=h+pad*2+2; return cv; }); }
function riStoneBlock(x,y,w,h,top,face,lift){ lift=lift==null?10:lift; riPut(riStoneBlockSpr(Math.round(w),Math.round(h),top,face,lift),x,y); }
// a pressure plate: a stone slab sunk in a frame; pressed, it sits lower and its seam glows the dungeon's colour
function riPlateSpr(pr){ return riCache('plate'+(pr?1:0),()=>{ const F=riTab('f'), cv=riPaint(44,44,2,(x,y,o)=>{ const X=x-22, Y=y-22, e=Math.min(20-Math.abs(X),20-Math.abs(Y));
    if(e<0){ o[0]=o[1]=o[2]=6; o[3]=Math.max(0,0.4*(1+e/2)); return; }
    if(e<3){ riSet(o,[96,92,96],(0.8+0.2*riS(F,x*2,y*2))*(X<-17||Y<-17?1.15:0.8)); return; }
    if(e<4.2){ riSet(o,[22,20,24],1); return; }
    const p=pr?0.78:1, sh=pr?(Y<-14?0.7:1):(Y>13?0.82:Y<-13?1.12:1); riSet(o,[126,122,128],(0.86+0.2*riS(F,x*1.3,y*1.3))*p*sh); });
  cv.ox=22; cv.oy=22; cv.w2=44; cv.h2=44; return cv; }); }
function riLeverSpr(on){ return riRS('lever'+(on?1:0),48,52,24,36,g=>{
  g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(2,8,16,6,0,0,TAU); g.fill();
  g.fillStyle=r2lg(g,0,-6,0,10,'#7a7a84','#3a3a42'); rrect(g,-14,-6,28,16,3); g.fill(); g.fillStyle='#24242a'; g.fillRect(-8,-3,16,4);
  g.save(); g.rotate(on?0.7:-0.7); g.fillStyle=r2lg(g,-2.5,0,2.5,0,'#8a6440','#5a3a20'); g.fillRect(-2.5,-26,5,26); g.fillStyle=r2rg(g,-2,-28,1,7,'#ff8a6a','#c83a2a','#6a1a10'); g.beginPath(); g.arc(0,-26,6,0,TAU); g.fill(); g.restore();
  for(const sx of [-10,10]){ g.fillStyle='#9a9aa6'; g.beginPath(); g.arc(sx,2,1.4,0,TAU); g.fill(); } },{bump:2.2,edge:1.6}); }
function riSignSpr(){ return riRS('csign',48,40,24,26,g=>{
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,12,8,3,0,0,TAU); g.fill();
  g.fillStyle=r2lg(g,-2.5,0,2.5,0,'#6a4a2c','#3a2414'); g.fillRect(-2.5,-6,5,18);
  for(let k=0;k<3;k++){ g.fillStyle=r2c('#8a6a42',(k-1)*0.08); g.fillRect(-20,-22+k*6.7,40,6.7); g.fillStyle='rgba(30,16,6,.5)'; g.fillRect(-20,-22+k*6.7+6,40,0.8); }
  g.strokeStyle='#3a2414'; g.lineWidth=1.6; g.strokeRect(-20,-22,40,20); g.fillStyle='#2a2a30'; for(const [nx,ny] of [[-17,-19],[17,-19],[-17,-5],[17,-5]]){ g.beginPath(); g.arc(nx,ny,1,0,TAU); g.fill(); }
  g.strokeStyle='rgba(30,16,6,.7)'; g.lineWidth=1; for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(-13,-17+k*5); g.lineTo(13,-17+k*5); g.stroke(); } },{bump:2.4}); }
function riTorchSpr(sym,lit){ return riRS('ctorch'+sym+(lit?1:0),36,44,18,22,g=>{
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,9,15,6,0,0,TAU); g.fill();
  g.fillStyle=r2lg(g,-13,0,13,0,'#5a5058','#3a3036','#241e22'); g.beginPath(); g.ellipse(0,6,13,8,0,0,TAU); g.fill();
  g.fillStyle=r2lg(g,-4,0,4,0,'#7a6e76','#5a4e56','#3a3036'); g.fillRect(-4,-14,8,20);
  g.fillStyle='#1a1418'; g.beginPath(); g.ellipse(0,-14,11,6,0,0,TAU); g.fill(); g.fillStyle=lit?'#3a1a08':'#2a2228'; g.beginPath(); g.ellipse(0,-14.6,8.4,4,0,0,TAU); g.fill();
  drawSym(sym,0,7,0.55,lit?'#ffe0a0':'rgba(220,210,190,.75)',g); },{bump:2.2}); }
function riMuralSpr(order){ return riRS('mural'+order.join(''),160,48,80,24,g=>{
  g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-74,-18,152,42);
  g.fillStyle=r2lg(g,0,-22,0,18,'#7a6a58','#4a3a2c'); g.fillRect(-76,-22,152,40); g.fillStyle='#2e241c'; g.fillRect(-70,-17,140,30);
  order.forEach((sy,i)=>{ drawSym(sy,-52+i*35,-2,0.8,'#e0c088',g); if(i<3){ g.fillStyle='#a88a62'; g.beginPath(); g.moveTo(-36+i*35,-5); g.lineTo(-30+i*35,-2); g.lineTo(-36+i*35,1); g.fill(); } }); },{bump:2.6}); }
function riFurnX(o,t){
  const x=o.x, y=o.y;
  switch(o.k){
    case 'plate': riPut(riPlateSpr(!!o.pressed),x,y); if(o.pressed){ const st=caveSt(); glowAt(x,y,34,hexRGB(st.accent).join(','),0.28); ctx.strokeStyle=`rgba(${hexRGB(st.accent).join(',')},.7)`; ctx.lineWidth=1.4; ctx.strokeRect(x-15.8,y-15.8,31.6,31.6); } return true;
    case 'lever': riPut(riLeverSpr(!!o.on),x,y); if(!o.on) glowAt(x,y-14,30,'255,200,120',0.18+0.1*Math.sin(t*3)); return true;
    case 'csign': riPut(riSignSpr(),x,y); return true;
    case 'ctorch': { const lit=o.lit; riPut(riTorchSpr(o.sym|0,!!lit),x,y);
      if(lit){ const fy=y-18; r2FlameLive(x,fy+3,1.5,t,x*0.37); glowAt(x,fy,34,'255,190,90',0.5+0.1*Math.sin(t*9+x)); if(Math.random()<0.4) emit(x+rand(-3,3),fy,1,{kind:'fire',ang:-Math.PI/2,spread:0.4,smin:15,smax:45,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:3,drag:1}); }
      else { ctx.strokeStyle=`rgba(255,200,140,${0.22+0.14*Math.sin(t*2+x)})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(x,y-8,20,0,TAU); ctx.stroke(); }
      return true; }
    case 'mural': riPut(riMuralSpr(o.order||[0,1,2,3]),x,y); return true;
    case 'decor': return riDecor(o,t);
  }
  return false;
}
// the dungeon's plain tile under its special cells (dunTile in e9a_dungeon.js): the theme's floor tile, lighter or darker
function riDunTile(g,x,y,cs,st,k2){
  const C=RI.cv; if(!C){ return false; } const tl=riCaveTiles(C.th,st,C.T,cs,C.S), cv=riCaveTileCv(C.th,tl,cs,C.S);
  const TS=tl.TS/C.S, sx=((x%TS)+TS)%TS, sy=((y%TS)+TS)%TS; g.drawImage(cv,sx*C.S,sy*C.S,cs*C.S,cs*C.S,x,y,cs,cs);
  if(k2){ g.fillStyle=k2>0?`rgba(255,246,228,${Math.min(0.5,k2*0.8)})`:`rgba(0,0,0,${Math.min(0.7,-k2)})`; g.fillRect(x,y,cs,cs); }
  return true;
}
function riCaveTileCv(th,tl,cs,S){ return riCache('cvtc:'+th+':'+cs+':'+S,()=>{ const n=tl.TS, c=mkCanvas(n,n), g=c.getContext('2d'), id=g.createImageData(n,n); for(let i=0;i<n*n;i++){ id.data[i*4]=tl.floor[i*3]; id.data[i*4+1]=tl.floor[i*3+1]; id.data[i*4+2]=tl.floor[i*3+2]; id.data[i*4+3]=255; } g.putImageData(id,0,0); return c; }); }
// the face a raised floor hangs over the cell below it (e9a_dungeon.js), in the theme's rock or masonry
function riRaisedFace(g,x,y,cs,fh,st,ledge){
  const C=RI.cv; const T=C?C.T:{w:'rock'}, tl=C?riCaveTiles(C.th,st,C.T,cs,C.S):null;
  if(tl){ const fc=riCaveFaceCv(C.th,tl,C.S), TS=tl.TS/C.S, sx=((x%TS)+TS)%TS; g.drawImage(fc,sx*C.S,0,cs*C.S,Math.min(fc.height,fh*C.S),x,y,cs,fh); }
  else { g.fillStyle=st.face; g.fillRect(x,y,cs,fh); }
  const gr=g.createLinearGradient(0,y,0,y+fh); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(0,0,0,.6)'); g.fillStyle=gr; g.fillRect(x,y,cs,fh);
  g.fillStyle='rgba(255,244,220,.3)'; g.fillRect(x,y-1,cs,2); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x,y+1,cs,1);
  const sg=g.createLinearGradient(0,y+fh,0,y+fh+14); sg.addColorStop(0,'rgba(0,0,0,.45)'); sg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=sg; g.fillRect(x,y+fh,cs,14);
  if(ledge){ g.fillStyle='rgba(255,236,190,.45)'; g.fillRect(x+cs*0.2,y+fh-3,cs*0.6,2); }
}
function riCaveFaceCv(th,tl,S){ return riCache('cvfc:'+th+':'+S,()=>{ const n=tl.TS, m=tl.FR, c=mkCanvas(n,m), g=c.getContext('2d'), id=g.createImageData(n,m); for(let i=0;i<n*m;i++){ id.data[i*4]=tl.faces[i*3]; id.data[i*4+1]=tl.faces[i*3+1]; id.data[i*4+2]=tl.faces[i*3+2]; id.data[i*4+3]=255; } g.putImageData(id,0,0); return c; }); }


// ---- after every act's own painting (this module loads after all of them, so this wrapper runs last): a fine grain
// over the whole cave canvas, so flat fills from any act read as material, and one gentle palette for them all
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){ base.apply(this,arguments); if(LOOK.re&&A&&A.canvas) try{ riCavePost(A,def); }catch(e){ console.warn('riCavePost',e); } }; }
function riCavePost(A,def){
  const t0=performance.now(), cv=A.canvas, W=cv.width, H=cv.height, g=cv.getContext('2d'), F=riTab('f'), Wn=riTab('w'), S=A.canvasS||0.5, img=g.getImageData(0,0,W,H), d=img.data;
  for(let y=0;y<H;y++){ const wy=y/S; for(let x=0;x<W;x++){ const p=(y*W+x)*4, wx=x/S, n=0.94+0.1*riS(F,wx*1.7,wy*1.7)+0.05*(Wn[((y&255)<<8)|(x&255)]-0.5);
    const r=d[p], gg=d[p+1], b=d[p+2], l=r*0.3+gg*0.59+b*0.11; d[p]=(l+(r-l)*0.92)*n; d[p+1]=(l+(gg-l)*0.92)*n; d[p+2]=(l+(b-l)*0.92)*n; } }
  g.putImageData(img,0,0); riStats('cavePost',performance.now()-t0);
}
// a slick ice cell for the act dungeons (the Glacier Maze): glassy tile, and the long bright streaks all on one slant
function riIceCell(g,x,y,cs,i,j){
  const C=RI.cv, S=C?C.S:0.5; riTileDraw(g,riTile('ice2',S,riIceFn()),x,y,cs,cs,S);
  const o=((i*17+j*31)%5)*7; g.strokeStyle='rgba(255,255,255,.34)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+o,y+cs); g.lineTo(x+o+cs*0.55,y); g.stroke();
  g.strokeStyle='rgba(255,255,255,.16)'; g.lineWidth=5; g.beginPath(); g.moveTo(x+o+16,y+cs); g.lineTo(x+o+16+cs*0.45,y+cs*0.18); g.stroke();
  return true;
}
// deep water for the act dungeons: dark in the middle of a cell field, a cool glint across it
function riWaterCell(g,x,y,cs,col){
  const c=hexRGB(col&&col.charCodeAt(0)===35?col:'#2a5a8a').map(v=>v*0.82); g.fillStyle=`rgb(${c.map(v=>v|0).join(',')})`; g.fillRect(x,y,cs,cs);
  g.fillStyle='rgba(0,10,24,.28)'; g.fillRect(x+cs*0.12,y+cs*0.12,cs*0.76,cs*0.76);
  g.strokeStyle='rgba(200,235,255,.14)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x+5,y+cs*0.42); g.quadraticCurveTo(x+cs/2,y+cs*0.32,x+cs-5,y+cs*0.46); g.stroke();
  return true;
}
// a raised level's top in the act dungeons: the theme's floor tile, tinted toward the level's colour
function riLevelTop(g,x,y,cs,col){
  const C=RI.cv; if(!C) return false; riDunTile(g,x,y,cs,CAVE_STYLE[C.th]||CAVE_STYLE.earth,0);
  g.save(); g.globalAlpha=0.55; g.globalCompositeOperation='color'; g.fillStyle=col; g.fillRect(x,y,cs,cs); g.restore();
  g.save(); g.globalAlpha=0.35; g.fillStyle=col; g.fillRect(x,y,cs,cs); g.restore(); return true;
}


// molten lava, continuous across cells: black crust plates floating on it, glowing seams, bright yellow cores
function riLavaFn(){ const F=riTab('f'), Rr=riTab('r'); return (x,y,o)=>{
  const wx=x+8*riS(F,x*0.3,y*0.3), wy=y+8*riS(F,x*0.3+50,y*0.3), h=riS(F,wx*0.9,wy*0.9)*0.7+riS(F,wx*2.4,wy*2.4)*0.3, cr=riS(Rr,wx*0.7,wy*0.7);
  if(h>0.5&&cr<0.93){ const e=Math.min(1,(h-0.5)/0.07), k=0.62+0.32*riS(F,x*3,y*3); o[0]=44*k+(1-e)*170; o[1]=26*k+(1-e)*60; o[2]=20*k+(1-e)*12; return; }
  const hot=Math.max(0,0.5-h)/0.5, seam=cr>0.93?(cr-0.93)*14:0;
  o[0]=200+55*hot+40*seam; o[1]=60+150*hot*hot+60*seam; o[2]=16+60*hot*hot*hot+20*seam; }; }
function riLavaDraw(g,x,y,w,h,lx,ly){ const t=riTile('lava',1,riLavaFn()); riTileDraw(g,t,x,y,w,h,1,lx,ly); }


function riCrustFn(){ const F=riTab('f'), Rr=riTab('r'); return (x,y,o)=>{ const cr=riS(Rr,x*0.55,y*0.55), n=riS(F,x*1.2,y*1.2), k=0.7+0.4*n;
  if(cr>0.88){ const e=(cr-0.88)/0.12; o[0]=60+195*e; o[1]=24+120*e*e; o[2]=14+40*e*e*e; return; } o[0]=46*k; o[1]=30*k; o[2]=26*k; }; }


// cave decor in this look: crystal clusters with facets, hanging icicles, a magma pool, a miner's lamp on a post
function riCrysSpr(sc,v){ return riRS('crys'+sc+'_'+v,70*sc+10,60*sc+10,35*sc+5,40*sc+5,g=>{ const r=mulberry32(v*13+7); g.scale(sc,sc);
  g.fillStyle='rgba(10,6,20,.35)'; g.beginPath(); g.ellipse(2,4,16,6,0,0,TAU); g.fill();
  const n=4+(v%3); for(let i=0;i<n;i++){ const a=-Math.PI/2+(i/(n-1)-0.5)*1.6+(r()-0.5)*0.3, L=14+r()*14, w=3.2+r()*2.4, bx=(i-(n-1)/2)*4;
    g.save(); g.translate(bx,2); g.rotate(a+Math.PI/2);
    g.fillStyle='#4a3a7a'; g.beginPath(); g.moveTo(-w,0); g.lineTo(-w,-L); g.lineTo(0,-L-w*1.4); g.lineTo(0,0); g.closePath(); g.fill();
    g.fillStyle='#b8a0f0'; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-L-w*1.4); g.lineTo(w,-L); g.lineTo(w,0); g.closePath(); g.fill();
    g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(0.4,-L+2,0.9,L-4); g.fillStyle='rgba(230,214,255,.8)'; g.beginPath(); g.moveTo(-w,-L); g.lineTo(0,-L-w*1.4); g.lineTo(w,-L); g.lineTo(0,-L+w*0.5); g.closePath(); g.fill();
    g.restore(); } },{bump:1.4,edge:1.2,sat:0.95,split:0.4}); }
function riIcicleSpr(sc){ return riRS('icic'+sc,40*sc+8,30*sc+8,20*sc+4,8,g=>{ g.scale(sc,sc);
  for(let i=0;i<3;i++){ const x=-8+i*8, L=12+((i*7)%5)*2; g.fillStyle=r2lg(g,x-3,0,x+3,0,'rgba(230,246,255,.95)','rgba(170,210,240,.9)','rgba(120,170,215,.9)'); g.beginPath(); g.moveTo(x-3.4,-6); g.lineTo(x,L); g.lineTo(x+3.4,-6); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.8)'; g.fillRect(x-1.6,-5,0.9,L*0.6); }
  g.fillStyle='rgba(240,250,255,.9)'; g.beginPath(); g.ellipse(0,-6,14,3,0,0,TAU); g.fill(); },{bump:1.2,edge:1,sat:0.95}); }
function riMagmaSpr(sc){ return riRS('magma'+sc,36*sc+8,28*sc+8,18*sc+4,14*sc+4,g=>{ g.scale(sc,sc);
  g.fillStyle='#1e1210'; g.beginPath(); g.ellipse(0,0,15,11,0,0,TAU); g.fill(); g.fillStyle='#3a2420'; g.beginPath(); g.ellipse(-1,-1,13,9,0,0,TAU); g.fill();
  g.fillStyle=r2rg(g,0,0,1,10,'#ffe08a','#ff8a2a','#b8320e'); g.beginPath(); g.ellipse(0,0,9,6,0,0,TAU); g.fill();
  g.fillStyle='rgba(40,20,14,.85)'; for(const [a,b,c,d] of [[-4,-1,3,1.6],[3,2,2.4,1.2],[1,-3,2,1]]){ g.beginPath(); g.ellipse(a,b,c,d,0.4,0,TAU); g.fill(); } },{bump:2,edge:1.4,sat:1,split:0.3}); }
function riLampSpr(){ return riRS('cvlamp',30,44,15,30,g=>{
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,12,7,3,0,0,TAU); g.fill();
  g.fillStyle=r2lg(g,-2,0,2,0,'#6a4a2c','#3a2414'); g.fillRect(-2,-8,4,20); g.fillStyle='#2a2a30'; g.fillRect(-1,-12,2,5);
  g.fillStyle='#2e2e34'; g.fillRect(-5.5,-21,11,2); g.fillRect(-5.5,-9,11,2); g.fillStyle='rgba(255,214,130,.9)'; g.fillRect(-4.5,-19,9,10); g.fillStyle='#2e2e34'; g.fillRect(-0.6,-19,1.2,10); g.fillRect(-4.5,-14.6,9,1);
  g.strokeStyle='#2e2e34'; g.lineWidth=1.2; g.beginPath(); g.arc(0,-22,3,Math.PI,TAU); g.stroke(); },{bump:2,edge:1.4}); }
function riDecor(o,t){
  const x=o.x, y=o.y, s=o.s||1, sc=Math.round(s*5)/5;
  if(o.dk==='crystal'){ riPut(riCrysSpr(sc,Math.abs(Math.round(x*7+y*3))%4),x,y); glowAt(x,y-8*s,26*s,'180,140,255',0.26+0.06*Math.sin(t*2+x)); return true; }
  if(o.dk==='icicle'){ riPut(riIcicleSpr(sc),x,y); glowAt(x,y,16*s,'200,230,255',0.14); return true; }
  if(o.dk==='magma'){ riPut(riMagmaSpr(sc),x,y); glowAt(x,y,28*s,'255,110,40',0.3+0.08*Math.sin(t*3+x)); return true; }
  if(o.dk==='lamp'){ riPut(riLampSpr(),x,y); glowAt(x,y-14,30,'255,200,100',0.38); return true; }
  return false;
}


// a fine material grain over a painted layer (alpha kept): flat fills read as wood, cloth or paint, not vector shapes
function riGrain(cv,S,amt){
  const g=cv.getContext('2d'), W=cv.width, H=cv.height, F=riTab('f'), Wn=riTab('w'); let img; try{ img=g.getImageData(0,0,W,H); }catch(e){ return; } const d=img.data, a=amt||0.1;
  for(let y=0;y<H;y++){ const wy=y/S; for(let x=0;x<W;x++){ const p=(y*W+x)*4; if(d[p+3]===0) continue; const wx=x/S, n=1-a*0.5+a*(0.7*riS(F,wx*2.3,wy*2.3)+0.3*Wn[((y&255)<<8)|(x&255)]);
    d[p]*=n; d[p+1]*=n; d[p+2]*=n; } }
  g.putImageData(img,0,0);
}

window.__ebDbg=Object.assign(window.__ebDbg||{},{RI,riRoom,riTab});
