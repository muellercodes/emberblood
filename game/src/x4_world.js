
// ================= Finale world: Nightfall Peak (map 4, x 0..9000, y 80000..91000)
// Built from the story bible (scratchpad/bible/FINALE.md 1, 3, 5, 6.0, 7.5, 8.1, 11, 17, 18): a round island of black
// glass in a sea of ink, a small apron to the south (the Bridgefoot) where the moonfire bridge lands, and five rings
// climbing counter-clockwise round C=(4500,85200): Tier I the Ember Stair (r 3300..4100, levels 1-2), Tier II the
// Clockstop Cliffs (2400..3300, levels 3-4), Tier III the Rime Spiral (1500..2400, levels 5-6), Tier IV the Moonglass
// Crown (880..1500, level 7), the moat (720..880, void) crossed by the Moon Road, and the summit (r 720, level 8).
// Every map 4 terrain sample carries o.ink, o.void, o.spike (glass spike walls), o.nsea (the Ink Sea), o.deck, o.foot,
// o.glass (shine 0..1) next to the engine's o.sand and o.ice. Ink, void, spikes and the sea block walkers and Water
// Stride; a jump that lands in ink or void costs health and hops Ash back. No flying on the peak except in calm zones.
// After the ending (G.flags.n_dawn 0..1) the same mountain turns warm and bright: Dawnlight Peak.
// Doc for x4_ascent, x4_foes, x4_story and the integrator: scratchpad/N4WORLD.md. Prefix n4w/N4W, debug __eb.n4w.
const N4W={k:4,y0:80000,C:{x:4500,y:85200},built:false,t:0,calm:{},open:[],haz:[],drops:[],lamps:[],objs:[],folk:[],dynF:{},
  dawnK:-1,dawnShown:-1,tide:{high:false,t:0,ext:false},vents:[],msgT:-99,flash:{t:9,rum:-1},fr:0,mist:0,snow:0,moonA:0,
  hintT:{},noProp:[],tend:[],sh:{},lastHaz:null,refresh:[],posts:[]};
const N4D=Math.PI/180;
const n4F=k=>!!(G&&G.flags&&G.flags[k]);
// polar helpers: angle 0 is south (toward the bridge), 90 east, 180 north, 270 west (counter-clockwise on screen)
const n4P=(r,a)=>[4500+r*Math.sin(a*N4D),85200+r*Math.cos(a*N4D)];
function n4Ang(x,y){ let a=Math.atan2(x-4500,y-85200)/N4D; return a<0?a+360:a; }
// is angle a (0..360) inside [a0,a1]? a1 may be above 360 (330..470 means 330 round through 0 to 110)
function n4In(a,a0,a1){ let d=(a-a0)%360; if(d<0) d+=360; return d<=a1-a0; }
const n4Dw=(px,r)=>px/r/N4D;     // degrees for a length of px at radius r
// a ring sector polygon (outer arc then inner arc back); rT tapers the outer radius to rEnd in the last tp degrees
function n4Sec(r0,r1,a0,a1,o){
  o=o||{}; const st=o.step||2, n=Math.max(2,Math.ceil((a1-a0)/st)), P=[];
  for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n; let r=r1; if(o.tp){ const e=Math.min(a-a0,a1-a); if(e<o.tp) r=lerp(o.rEnd,r1,smooth(e/o.tp)); } P.push(n4P(r,a)); }
  for(let i=n;i>=0;i--) P.push(n4P(r0,a0+(a1-a0)*i/n));
  return P;
}
function n4BB(P,m){ m=m||0; const b=[1e9,1e9,-1e9,-1e9]; for(const p of P){ if(p[0]<b[0]) b[0]=p[0]; if(p[1]<b[1]) b[1]=p[1]; if(p[0]>b[2]) b[2]=p[0]; if(p[1]>b[3]) b[3]=p[1]; } return [b[0]-m,b[1]-m,b[2]+m,b[3]+m]; }
function n4SegD(pts,x,y){ let b=1e9; for(let i=0;i<pts.length-1;i++){ const a=pts[i], c=pts[i+1], dx=c[0]-a[0], dy=c[1]-a[1], l2=dx*dx+dy*dy||1, t=clamp(((x-a[0])*dx+(y-a[1])*dy)/l2,0,1), d=Math.hypot(a[0]+dx*t-x,a[1]+dy*t-y); if(d<b) b=d; } return b; }
function n4InPoly(P,x,y){ let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i], b=P[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c; }
const n4InD=(x,y,cx,cy,r)=>{ const dx=x-cx, dy=y-cy; return dx*dx+dy*dy<=r*r; };
// the angle of a point seen from a center K on a clock dial: 0 is up (screen north), clockwise
const n4Phi=(x,y,kx,ky)=>{ let a=Math.atan2(x-kx,ky-y)/N4D; return a<0?a+360:a; };
function n4Arc(r,a0,a1,st){ const o=[], n=Math.max(1,Math.ceil(Math.abs(a1-a0)/(st||4))); for(let i=0;i<=n;i++) o.push(n4P(r,a0+(a1-a0)*i/n)); return o; }
const n4Diff=()=>{ const d=typeof diffIdx==='number'?diffIdx:1; return d<=0?0:d>=2?2:1; };
const n4Map4=()=>!!G&&!!player&&!AREA&&player.x<IZX-50&&curMap()===4;
const n4Reached=s=>typeof reached==='function'&&typeof STAGEDEF!=='undefined'&&!!STAGEDEF[s]&&reached(s);
const n4Dawn=()=>{ const v=G&&G.flags?+G.flags.n_dawn||0:0; return clamp(v,0,1); };

// ---------- sounds of our own (a low rumble after lightning, glass tinks underfoot, ink splashes, void whooshes)
function n4Snd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return; v=v==null?1:v;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.4*v; out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.3,dur/3)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'rumble': nz(2.6,0.16,'lowpass',160,40,0.7); tn('sine',52,34,2.2,0.07); break;
      case 'tink': { const f=rand(2300,2900); tn('sine',f,f*0.98,0.07,0.012); break; }
      case 'ink': nz(0.5,0.22,'lowpass',900,120,0.8); tn('sine',140,60,0.4,0.06); break;
      case 'void': nz(0.9,0.2,'bandpass',300,1600,0.7); tn('sine',420,90,0.7,0.03); break;
      case 'lamp': [660,880,990].forEach((f,i)=>tn('sine',f,f,0.5,0.03,i*0.05)); break;
      case 'chime': [784,988,1175,1568].forEach((f,i)=>tn('sine',f,f*0.996,1.4,0.03,i*0.09)); break;
      case 'creak': tn('sawtooth',80,60,0.6,0.02); nz(0.5,0.04,'bandpass',420,260,3); break;
    }
  }catch(e){}
}

// ================= 1. prop kinds (black glass with violet glints; STYLE.md cel tones from the top left)
const N4PAL={glass:['#120c1c','#2a2142','#4d4072','#c4b0ff'],ice:['#0c1830','#1d335e','#3d68a6','#c8ecff'],brass:['#4e3418','#86622e','#c49a4a','#ffe6a0'],
  stone:['#3c3452','#5e557a','#8c84ac','#e4dcff'],ruin:['#1a1428','#30284a','#52487a','#bba8ff'],folk:['#100c18','#221c32','#3c3256','#9a88d8']};
const N4OC='#0b0712';
function n4Tri(g,ax,ay,bx,by,cx,cy){ g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.lineTo(cx,cy); g.closePath(); g.fill(); }
function n4Glint(g,x,y,s,col){ g.fillStyle=col||'#e2d6ff'; g.beginPath(); g.moveTo(x,y-s); g.quadraticCurveTo(x,y,x+s*0.7,y); g.quadraticCurveTo(x,y,x,y+s); g.quadraticCurveTo(x,y,x-s*0.7,y); g.quadraticCurveTo(x,y,x,y-s); g.fill(); }
// a glass spike from its base (x,y): shadow side, base, a lit sliver on the left, a glint at the tip
function n4Spike(g,x,y,w,h,lean,P){
  const tx=x+lean, ty=y-h;
  g.fillStyle=P[0]; n4Tri(g,x-w/2,y,x+w/2,y,tx,ty);
  g.fillStyle=P[1]; n4Tri(g,x-w/2,y,x+w*0.12,y,tx,ty);
  g.fillStyle=P[2]; n4Tri(g,x-w/2,y,x-w*0.22,y,tx,ty+h*0.08);
  g.strokeStyle=P[3]; g.globalAlpha=0.55; g.lineWidth=Math.max(0.8,w*0.06); g.beginPath(); g.moveTo(x-w*0.3,y-h*0.15); g.lineTo(tx-w*0.04,ty+h*0.22); g.stroke(); g.globalAlpha=1;
}
function n4Shadow(g,rx,ry,dy){ g.fillStyle='rgba(6,3,12,.35)'; g.beginPath(); g.ellipse(2,dy||0,rx,ry,0,0,TAU); g.fill(); }
definePropKind('n_glasstree',{n:4,tall:true,R:40,col:{r:9},h:72,rot:false,oc:N4OC,make(seed,v){ const rng=mulberry32(seed), R=40, P=N4PAL.glass; return spriteOf(R,g=>{
  n4Shadow(g,14,5,8); g.lineCap='round'; g.lineJoin='round';
  const tips=[];
  const br=(x,y,a,len,w,d)=>{ const x2=x+Math.cos(a)*len, y2=y+Math.sin(a)*len; g.strokeStyle=P[0]; g.lineWidth=w+1.6; g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2); g.stroke(); g.strokeStyle=P[1]; g.lineWidth=w; g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2); g.stroke(); g.strokeStyle=P[2]; g.lineWidth=Math.max(0.8,w*0.35); g.beginPath(); g.moveTo(x-w*0.25,y); g.lineTo(x2-w*0.25,y2); g.stroke();
    if(d>0){ const n=d>1?2:2+(rng()<0.4?1:0); for(let i=0;i<n;i++) br(x2,y2,a+(i-(n-1)/2)*(0.5+rng()*0.35)+(rng()-0.5)*0.2,len*(0.55+rng()*0.2),w*0.62,d-1); } else tips.push([x2,y2]); };
  br(0,8,-Math.PI/2+(rng()-0.5)*0.15,16+rng()*5,7,3);
  for(const [x,y] of tips) if(rng()<0.75) n4Glint(g,x,y,2.2+rng()*1.4); }); }});
definePropKind('n_shard',{n:4,R:20,col:{r:14},rot:false,oc:N4OC,make(seed,v){ const rng=mulberry32(seed), P=N4PAL.glass; return spriteOf(20,g=>{
  n4Shadow(g,15,5,9); const n=3+Math.floor(rng()*3), sp=[];
  for(let i=0;i<n;i++) sp.push([(rng()-0.5)*18,6+rng()*5,5+rng()*6,12+rng()*16,(rng()-0.5)*7]);
  sp.sort((a,b)=>a[3]-b[3]).reverse(); sp.sort((a,b)=>a[1]-b[1]);
  for(const s of sp) n4Spike(g,s[0],s[1],s[2],s[3],s[4],P);
  if(rng()<0.6) n4Glint(g,sp[0][0]+sp[0][4],sp[0][1]-sp[0][3]+3,2); }); }});
definePropKind('n_icefang',{n:3,R:20,col:{r:14},rot:false,oc:'#081022',make(seed){ const rng=mulberry32(seed), P=N4PAL.ice; return spriteOf(20,g=>{
  n4Shadow(g,14,5,9); for(let i=0;i<3;i++){ const x=(i-1)*7+(rng()-0.5)*4; n4Spike(g,x,8+rng()*3,6+rng()*5,(i===1?24:14)+rng()*8,(rng()-0.5)*5,P); }
  g.strokeStyle='rgba(150,220,255,.75)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-11,9); g.lineTo(11,9); g.stroke(); }); }});
definePropKind('n_cocoon',{n:3,R:16,col:{r:8,low:true},rot:false,oc:N4OC,make(seed){ const rng=mulberry32(seed), P=N4PAL.glass; return spriteOf(16,g=>{
  n4Shadow(g,7,3,10); g.lineCap='round'; g.strokeStyle=P[0]; g.lineWidth=3.2; g.beginPath(); g.moveTo(0,10); g.quadraticCurveTo(-3,-4,4,-14); g.stroke(); g.strokeStyle=P[2]; g.lineWidth=1.4; g.beginPath(); g.moveTo(-0.6,9); g.quadraticCurveTo(-3.6,-4,3.2,-14); g.stroke();
  const cx=4, cy=-4; g.fillStyle='#8a80aa'; g.beginPath(); g.ellipse(cx,cy,5,8.5,0.15,0,TAU); g.fill(); g.fillStyle='#c4bce0'; g.beginPath(); g.ellipse(cx-1.5,cy-2,2.6,5,0.15,0,TAU); g.fill();
  g.strokeStyle='rgba(70,60,100,.6)'; g.lineWidth=0.9; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(cx-4.5,cy-4+i*4); g.quadraticCurveTo(cx,cy-2+i*4,cx+4.5,cy-5+i*4); g.stroke(); } }); }});
definePropKind('n_gear',{n:2,R:22,col:{r:16,low:true},rot:false,oc:N4OC,make(seed,v){ const P=N4PAL.brass; return spriteOf(22,g=>{
  n4Shadow(g,18,6,6); g.save(); g.translate(0,2); g.scale(1,0.62);
  celFill(g,(q,dx,dy)=>sbStar(q,10,20,16,v*0.2,dx,dy),P[1],{r:20,tones:[P[2],P[1],P[0]]});
  g.fillStyle=P[0]; g.beginPath(); g.arc(0,0,6,0,TAU); g.fill(); g.restore();
  // half sunk in black glass
  g.fillStyle=N4PAL.glass[1]; g.beginPath(); g.ellipse(0,8,21,7,0,0,Math.PI); g.lineTo(-21,8); g.closePath(); g.fill();
  g.fillStyle=N4PAL.glass[2]; g.fillRect(-21,6.5,42,2.2); n4Glint(g,-12,6,1.8); }); }});
definePropKind('n_clock',{n:2,R:30,col:{r:10},rot:false,oc:N4OC,make(seed,v){ const P=N4PAL.stone; return spriteOf(30,g=>{
  n4Shadow(g,14,5,14);
  // a short clock tower of dark chalk, the face stuck at midnight
  g.fillStyle=P[0]; g.fillRect(-10,-20,20,34); g.fillStyle=P[1]; g.fillRect(-10,-20,13,34); g.fillStyle=P[2]; g.fillRect(-10,-20,4,34);
  g.fillStyle=P[0]; n4Tri(g,-13,-20,13,-20,0,-30); g.fillStyle=P[1]; n4Tri(g,-13,-20,2,-20,0,-30);
  g.fillStyle='#d8d0f0'; g.beginPath(); g.arc(0,-8,7.5,0,TAU); g.fill(); g.strokeStyle='#2a2240'; g.lineWidth=1.2; g.stroke();
  g.strokeStyle='#1a1428'; g.lineWidth=1.6; g.beginPath(); g.moveTo(0,-8); g.lineTo(0,-14); g.moveTo(0,-8); g.lineTo(0.6,-12.5); g.stroke();
  if(v) { g.fillStyle='rgba(180,150,255,.5)'; g.beginPath(); g.arc(0,-8,9.5,0,TAU); g.fill(); g.fillStyle='#d8d0f0'; g.beginPath(); g.arc(0,-8,7.5,0,TAU); g.fill(); g.strokeStyle='#1a1428'; g.lineWidth=1.6; g.beginPath(); g.moveTo(0,-8); g.lineTo(0,-14); g.stroke(); } }); }});
definePropKind('n_mirror',{n:2,R:20,col:{r:9},rot:false,oc:N4OC,make(seed,v){ const P=N4PAL.glass; return spriteOf(20,g=>{
  n4Shadow(g,10,4,13); g.fillStyle=P[0]; g.fillRect(-2,-2,4,15); g.fillRect(-7,11,14,3);
  g.fillStyle='#6a5a98'; g.beginPath(); g.ellipse(0,-10,8.5,12.5,0,0,TAU); g.fill();
  g.fillStyle=v?'#2e2a5a':'#3a3470'; g.beginPath(); g.ellipse(0,-10,6.6,10.5,0,0,TAU); g.fill();
  g.strokeStyle='rgba(220,210,255,.7)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-3,-16); g.lineTo(2,-4); g.moveTo(1,-18); g.lineTo(4,-12); g.stroke(); }); }});
definePropKind('n_glasscoral',{n:3,R:16,col:{r:10,low:true},rot:false,oc:N4OC,make(seed){ const rng=mulberry32(seed); return spriteOf(16,g=>{
  n4Shadow(g,11,4,7); g.lineCap='round';
  const col=['#3a3270','#5a52a0','#8a80d0'];
  const br=(x,y,a,l,w,d)=>{ const x2=x+Math.cos(a)*l, y2=y+Math.sin(a)*l; g.strokeStyle=col[0]; g.lineWidth=w+1.4; g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2); g.stroke(); g.strokeStyle=col[1]; g.lineWidth=w; g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2); g.stroke(); if(d>0){ br(x2,y2,a-0.5-rng()*0.3,l*0.7,w*0.7,d-1); br(x2,y2,a+0.5+rng()*0.3,l*0.7,w*0.7,d-1); } else { g.fillStyle=col[2]; g.beginPath(); g.arc(x2,y2,w*0.8,0,TAU); g.fill(); } };
  br(0,7,-Math.PI/2+(rng()-0.5)*0.4,8,4,2); }); }});
definePropKind('n_dawnflower',{n:3,R:7,outline:true,rot:false,make(seed,v){ const rng=mulberry32(seed); return spriteOf(7,g=>{
  g.strokeStyle='#5aa050'; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,5); g.lineTo(0,0); g.stroke();
  const n=5; for(let i=0;i<n;i++){ const a=i/n*TAU+rng(); g.fillStyle='#fffaf0'; g.beginPath(); g.ellipse(Math.cos(a)*2.4,Math.sin(a)*2.4-1,2,1.4,a,0,TAU); g.fill(); }
  g.fillStyle=v===1?'#ffd8f0':'#ffe066'; g.beginPath(); g.arc(0,-1,1.3,0,TAU); g.fill(); }); }});
// tendrils are drawn live (they lean away from light), so the prop sprite is only a dark crack at the root
definePropKind('n_tendril',{n:2,R:16,outline:false,rot:false,make(seed){ return spriteOf(16,g=>{ g.fillStyle='rgba(8,4,16,.55)'; g.beginPath(); g.ellipse(0,6,9,3.4,0,0,TAU); g.fill(); g.strokeStyle='rgba(150,110,255,.5)'; g.lineWidth=1; g.beginPath(); g.moveTo(-8,6); g.lineTo(-2,5); g.lineTo(3,7); g.lineTo(9,5); g.stroke(); }); }});

// standing things drawn by this module (cached outlined sprites; ruins, lamp posts, shadow folk, shrines)
const N4S=new Map();
function n4Spr(key,w,h,ox,oy,draw,ow){
  const k=(LOOK.sb?'s:':'c:')+key; let c=N4S.get(k); if(c) return c;
  const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), g=cv.getContext('2d'); g.scale(sc,sc); g.translate(ox,oy); g.lineCap='round'; g.lineJoin='round'; draw(g);
  cv.ox=ox; cv.oy=oy; cv.w2=w; cv.h2=h;
  c=LOOK.sb?outlineSprite(cv,N4OC,ow||1.6,{force:true}):cv; c.ox=ox; c.oy=oy; c.w2=w; c.h2=h; N4S.set(k,c); return c;
}
function n4Put(c,x,y,s,a){ s=s||1; if(a!=null&&a<1){ const p=ctx.globalAlpha; ctx.globalAlpha=p*a; ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); ctx.globalAlpha=p; } else ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); }
function n4Box(g,x,y,w,h,P){ g.fillStyle=P[0]; g.fillRect(x,y,w,h); g.fillStyle=P[1]; g.fillRect(x,y,w*0.72,h); g.fillStyle=P[2]; g.fillRect(x,y,Math.max(1.5,w*0.14),h); }
// a lamp post: a broken lantern of black glass on an iron post (lit: warm gold with a little silver)
function n4LampArt(g,lit,dawn){
  const P=dawn?N4PAL.stone:N4PAL.glass;
  g.fillStyle='rgba(6,3,12,.35)'; g.beginPath(); g.ellipse(2,1,9,3.5,0,0,TAU); g.fill();
  n4Box(g,-2.2,-40,4.4,41,P); g.fillStyle=P[0]; g.fillRect(-6,-2,12,3); g.fillRect(-5,-41,10,3);
  g.strokeStyle=P[0]; g.lineWidth=2.4; g.beginPath(); g.moveTo(0,-40); g.quadraticCurveTo(7,-44,9,-38); g.stroke();
  // the cage: one pane cracked out
  g.fillStyle=lit?'#ffcf6a':'#2a2346'; g.fillRect(5,-38,9,12); if(lit){ g.fillStyle='#fff3c8'; g.fillRect(7.5,-35.5,4,6); g.fillStyle='rgba(220,230,255,.7)'; g.fillRect(12,-37,1.4,10); }
  g.strokeStyle=P[0]; g.lineWidth=1.6; g.strokeRect(5,-38,9,12); g.beginPath(); g.moveTo(9.5,-38); g.lineTo(9.5,-26); g.stroke();
  if(!lit){ g.strokeStyle='rgba(190,170,255,.6)'; g.lineWidth=0.9; g.beginPath(); g.moveTo(6,-36); g.lineTo(9,-31); g.lineTo(7,-28); g.stroke(); }
  g.fillStyle=P[0]; n4Tri(g,3.5,-38,15.5,-38,9.5,-43);
}
// ruins of a silent copy of Emberhollow: kind 'house' (walls only, a gap where a door would be), 'arch', 'chimney', 'well', 'forge'
function n4RuinArt(g,o){
  const P=N4PAL.ruin, w=o.w||120, h=o.h||80, H=24;
  g.fillStyle='rgba(6,3,12,.4)'; g.fillRect(-w/2+6,-h/2+8,w,h);
  if(o.kind==='house'||o.kind==='forge'){
    // the floor inside (glass flagstones) and the bed, the anvil
    g.fillStyle='#2c2442'; g.fillRect(-w/2,-h/2,w,h);
    g.strokeStyle='rgba(150,130,210,.28)'; g.lineWidth=1; for(let x=-w/2+16;x<w/2;x+=16){ g.beginPath(); g.moveTo(x,-h/2); g.lineTo(x,h/2); g.stroke(); }
    if(o.bed){ g.fillStyle='#3e3462'; g.fillRect(o.bed[0]-16,o.bed[1]-10,32,22); g.fillStyle='#6a5e98'; g.fillRect(o.bed[0]-16,o.bed[1]-10,32,7); g.fillStyle='#8c82bc'; g.fillRect(o.bed[0]-13,o.bed[1]-8,10,4); }
    if(o.kind==='forge'){ g.fillStyle='#1c1630'; g.fillRect(-12,-8,24,14); g.fillStyle='#3a3060'; g.fillRect(-12,-8,24,4); }
    // the walls: north wall seen from the front (tall), side walls thin, south wall low (with gaps)
    const wall=(x,y,ww,hh,front)=>{ g.fillStyle=P[1]; g.fillRect(x,y,ww,hh); if(front){ g.fillStyle=P[0]; g.fillRect(x,y+hh,ww,H*0.45); g.fillStyle=P[2]; g.fillRect(x,y,ww,2); } };
    const gaps=o.gaps||{};
    wall(-w/2,-h/2-H,w,H,true);
    if(!gaps.w) wall(-w/2-4,-h/2-H,8,h+H,false); else { wall(-w/2-4,-h/2-H,8,(h+H)*0.38,false); wall(-w/2-4,-h/2-H+(h+H)*0.68,8,(h+H)*0.32,false); }
    if(!gaps.e) wall(w/2-4,-h/2-H,8,h+H,false); else { wall(w/2-4,-h/2-H,8,(h+H)*0.38,false); wall(w/2-4,-h/2-H+(h+H)*0.68,8,(h+H)*0.32,false); }
    const sw=gaps.s?w*0.36:w; wall(-w/2,h/2-10,sw,10,true); if(gaps.s) wall(w/2-sw,h/2-10,sw,10,true);
    g.strokeStyle='rgba(190,170,255,.45)'; g.lineWidth=1; g.beginPath(); g.moveTo(-w/2+10,-h/2-H+6); g.lineTo(-w/2+22,-h/2-H+14); g.lineTo(-w/2+18,-h/2-H+20); g.stroke();
  }else if(o.kind==='arch'){
    g.fillStyle=P[0]; g.fillRect(-46,-54,18,64); g.fillRect(28,-30,18,40); g.fillStyle=P[1]; g.fillRect(-46,-54,12,64); g.fillRect(28,-30,12,40);
    g.strokeStyle=P[1]; g.lineWidth=14; g.beginPath(); g.arc(0,-34,38,Math.PI,Math.PI*1.62); g.stroke(); g.strokeStyle=P[2]; g.lineWidth=3; g.beginPath(); g.arc(0,-34,44,Math.PI,Math.PI*1.6); g.stroke();
  }else if(o.kind==='chimney'){
    n4Box(g,-10,-58,20,64,P); g.fillStyle=P[0]; g.fillRect(-13,-62,26,6);
  }else if(o.kind==='well'){
    g.fillStyle=P[0]; g.beginPath(); g.ellipse(0,0,22,13,0,0,TAU); g.fill(); g.fillStyle='#08040e'; g.beginPath(); g.ellipse(0,-2,15,8,0,0,TAU); g.fill();
    g.fillStyle=P[1]; g.fillRect(-20,-30,5,30); g.fillRect(15,-30,5,30); g.fillStyle=P[2]; g.fillRect(-22,-33,44,5);
  }
}
// a frozen shadow person of Hearthold (scarf, mittens, mid-step)
function n4FolkArt(g,v){
  const P=N4PAL.folk;
  g.fillStyle='rgba(6,3,12,.35)'; g.beginPath(); g.ellipse(2,1,10,4,0,0,TAU); g.fill();
  const lean=v%2?-3:3;
  g.fillStyle=P[0]; g.fillRect(-5,-12,4,13); g.fillRect(2,-12,4,11);
  g.fillStyle=P[1]; g.beginPath(); g.moveTo(-8,-12); g.lineTo(8,-12); g.lineTo(6+lean*0.4,-30); g.lineTo(-6+lean*0.4,-30); g.closePath(); g.fill();
  g.fillStyle=P[2]; g.fillRect(-8+lean*0.3,-30,3,17);
  g.fillStyle=P[1]; g.beginPath(); g.arc(lean*0.6,-36,6.5,0,TAU); g.fill();
  g.fillStyle=v===2?'#5a3a6a':'#3a3a6a'; g.fillRect(-7+lean*0.5,-31,14,4); g.fillRect(3+lean*0.5,-31,3,9);
  g.fillStyle=P[2]; g.beginPath(); g.arc(-9+lean,-19,3,0,TAU); g.arc(9+lean*0.2,-21,3,0,TAU); g.fill();
  g.fillStyle='rgba(200,230,255,.55)'; g.beginPath(); g.arc(-1+lean*0.6,-38,1.2,0,TAU); g.arc(2.5+lean*0.6,-38,1.2,0,TAU); g.fill();
  g.strokeStyle='rgba(170,220,255,.5)'; g.lineWidth=1; g.beginPath(); g.moveTo(-9,-28); g.lineTo(-7,-20); g.moveTo(7,-25); g.lineTo(5,-16); g.stroke();
}
// a shrine on the peak: black glass until touched, then warm gold with a little silver
function n4ShrineArt(g,lit){
  const P=lit?['#5a3a1e','#a8742e','#f0c060','#fff2c0']:N4PAL.glass;
  g.fillStyle='rgba(6,3,12,.4)'; g.beginPath(); g.ellipse(3,4,26,9,0,0,TAU); g.fill();
  g.fillStyle=lit?'#3e3058':'#1e1830'; g.beginPath(); g.ellipse(0,2,24,9,0,0,TAU); g.fill(); g.fillStyle=lit?'#6a5a8e':'#2e2648'; g.beginPath(); g.ellipse(0,0,22,7.5,0,0,TAU); g.fill();
  // the obelisk
  g.fillStyle=P[0]; g.beginPath(); g.moveTo(-9,0); g.lineTo(9,0); g.lineTo(6,-40); g.lineTo(0,-50); g.lineTo(-6,-40); g.closePath(); g.fill();
  g.fillStyle=P[1]; g.beginPath(); g.moveTo(-9,0); g.lineTo(2,0); g.lineTo(1,-44); g.lineTo(0,-50); g.lineTo(-6,-40); g.closePath(); g.fill();
  g.fillStyle=P[2]; g.beginPath(); g.moveTo(-9,0); g.lineTo(-5,0); g.lineTo(-3,-43); g.lineTo(-6,-40); g.closePath(); g.fill();
  // the ember mark
  g.fillStyle=lit?'#fff6d0':'#4a3e70'; g.beginPath(); g.ellipse(0,-22,3.6,6,0,0,TAU); g.fill();
  if(lit){ g.fillStyle='#e8eeff'; g.beginPath(); g.ellipse(0,-22,1.4,2.6,0,0,TAU); g.fill(); }
  else { g.strokeStyle='rgba(180,160,255,.55)'; g.lineWidth=0.9; g.beginPath(); g.moveTo(-4,-32); g.lineTo(-1,-27); g.lineTo(-3,-23); g.stroke(); }
}

// ================= 2. cliff looks (ELEV styles): black obsidian, violet chalk, black ice, moon glass, the summit
ELEV.style('n_obsid',{face:'#3e2f52',lit:'#5e4a7a',dark:'#1f162c',lip:'#c8acff',out:'#0c0716',top:'#5c4670',topK:0.03,tex:'facet'});
ELEV.style('n_chalk',{face:'#676086',lit:'#8a82ac',dark:'#3a3456',lip:'#e6deff',out:'#120c22',top:'#706a94',topK:0.02,tex:'layers'});
ELEV.style('n_ice',{face:'#2e4c80',lit:'#4c72b0',dark:'#172a50',lip:'#c4e4ff',out:'#081226',top:'#40608e',topK:0.02,tex:'streak'});
ELEV.style('n_glass',{face:'#3c3680',lit:'#5c56b2',dark:'#1e1a4c',lip:'#dcd4ff',out:'#0b0924',top:'#544f96',topK:0.02,tex:'shine'});
ELEV.style('n_summit',{face:'#4c4090',lit:'#7a6cc4',dark:'#2a2060',lip:'#f4ecff',out:'#120c2e',top:'#8c80cc',topK:0.01,tex:'shine'});
// Dawnlight Peak: the same cliffs, clear glass with a soft pink-gold sheen
const N4DAWN_STY={n_obsid:{face:'#a88aa8',lit:'#d2b4c6',dark:'#6e5a7e',lip:'#fff0d8',out:'#3b2233'},n_chalk:{face:'#c0b0c8',lit:'#e4d8e4',dark:'#8a7a98',lip:'#fff6e8',out:'#3b2233'},
  n_ice:{face:'#9ab8d8',lit:'#c8e0f0',dark:'#6a86aa',lip:'#ffffff',out:'#2c3a5a'},n_glass:{face:'#b0a4d0',lit:'#d8d0ec',dark:'#7a70a8',lip:'#fff8ee',out:'#3b2233'},
  n_summit:{face:'#c8b8e0',lit:'#ece2f6',dark:'#9688bc',lip:'#ffffff',out:'#3b2233'}};

// ================= 3. biomes 40 to 49 (bible 3.7, colors lifted into STYLE.md's readable range: deep violets, not mud)
const N4MW={shallow:'#9cb8ee',deep:'#4a62b4',lip:'#eef2ff'};    // moonwater: silver water is friendly
const N4AMB={birds:false,rain:0,thunder:false,mist:0,snow:0,embers:0,ash:0};
function n4Bi(id,d){ d.critters=false; d.events={}; d.water=d.water||N4MW; d.ambient=Object.assign({},N4AMB,d.ambient||{}); d.rgb=n4RGB; return defineBiome(id,d); }
const n4Pick=(rng,n)=>Math.floor(rng()*n);
n4Bi(40,{name:'the Bridgefoot',level:21,col:['#4a4268','#534a74','#41395c'],road:'#8a80b0',shore:'#5a5282',music:'n_ascent',chests:1,
  ambient:{wind:0.25,night:0.18,n4mist:0.45},
  props(rng,x,y,s,grove){ return n4Props(rng,x,y,s,grove,40); }, decor(g,rng,x,y,s,r){ n4Decor(g,rng,x,y,s,r,40); }});
n4Bi(41,{name:'the Ember Stair',level:21,col:['#4e3652','#573d5c','#452f49'],road:'#7e5e70',shore:'#5a3e50',music:'n_ascent',chests:3,
  ambient:{wind:0.3,night:0.16,n4emb:0.35,n4ash:0.3},
  props(rng,x,y,s,grove){ return n4Props(rng,x,y,s,grove,41); }, decor(g,rng,x,y,s,r){ n4Decor(g,rng,x,y,s,r,41); }});
n4Bi(42,{name:'the Clockstop Cliffs',level:22,col:['#4c4a6e','#55537a','#434164'],road:'#8a7ea4',shore:'#5a5474',music:'n_clocks',chests:3,
  ambient:{wind:0.5,night:0.15,n4mist:0.2},
  props(rng,x,y,s,grove){ return n4Props(rng,x,y,s,grove,42); }, decor(g,rng,x,y,s,r){ n4Decor(g,rng,x,y,s,r,42); }});
n4Bi(43,{name:'the Rime Spiral',level:22,col:['#304872','#38527e','#2a4066'],road:'#7a8aac',shore:'#3e4e70',music:'n_rime',chests:2,water:{shallow:'#a6c4f0',deep:'#4a66ae',lip:'#f2f8ff'},
  ambient:{wind:0.8,night:0.14,n4snow:0.7},
  props(rng,x,y,s,grove){ return n4Props(rng,x,y,s,grove,43); }, decor(g,rng,x,y,s,r){ n4Decor(g,rng,x,y,s,r,43); }});
n4Bi(44,{name:'the Moonglass Crown',level:23,col:['#3e3a7a','#464286','#37346e'],road:'#7a76b0',shore:'#5a5690',music:'n_glass',chests:2,footprints:'sand',_sand:[92,80,150],
  ambient:{wind:0.4,night:0.2,n4mist:0.3},
  props(rng,x,y,s,grove){ return n4Props(rng,x,y,s,grove,44); }, decor(g,rng,x,y,s,r){ n4Decor(g,rng,x,y,s,r,44); }});
n4Bi(45,{name:"the Moon's Rest",level:23,col:['#6a5caa','#7366b6','#60529c'],road:'#b0a8e0',shore:'#6a5aa0',music:'n_summit',chests:0,
  ambient:{wind:0.6,night:0.1},
  props(){ return null; }, decor(g,rng,x,y,s,r){ n4Decor(g,rng,x,y,s,r,45); }});
n4Bi(46,{name:'the Ink Sea',level:23,col:['#0e0a1c','#120e24','#0a0716'],road:'#2a2040',shore:'#1a1428',music:'n_ascent',chests:0,
  ambient:{wind:0.3,night:0.25,n4mist:0.6},
  props(){ return null; }, decor(g,rng,x,y,s,r){ n4Decor(g,rng,x,y,s,r,46); }});
n4Bi(47,{name:'the Silent Green',level:22,col:['#46465c','#4f4f66','#3e3e54'],road:'#6a6a84',shore:'#3a3a50',music:'n_ascent',chests:3,
  ambient:{wind:0.2,night:0.2,n4mist:0.5},
  props(rng,x,y,s,grove){ return n4Props(rng,x,y,s,grove,47); }, decor(g,rng,x,y,s,r){ n4Decor(g,rng,x,y,s,r,47); }});
n4Bi(48,{name:'the Moonfire Bridge',level:21,col:['#7a78b8','#8686c6','#6e6caa'],road:'#e0e8ff',shore:'#4a4a80',music:'n_bridge',chests:0,
  ambient:{wind:0.3,night:0.05},
  props(){ return null; }, decor(){} });
n4Bi(49,{name:'the Dawn Glass',level:21,col:['#c8a8c8','#d6b8d4','#b898b8'],road:'#f0e2f0',shore:'#e0c8d8',music:'n_dawn',chests:0,water:{shallow:'#9ad0f4',deep:'#4a8ad0',lip:'#ffffff'},
  ambient:{wind:0.2,night:0,birds:true},
  props(rng){ return rng()<0.1?{k:'n_dawnflower',v:n4Pick(rng,3)}:null; }, decor(){} });
const N4B_PEAK=[40,41,42,43,44,45,46,47,48,49];
const N4GLASS={40:0.3,41:0.4,42:0.2,43:0.5,44:0.8,45:1,46:0,47:0.2,48:0.6,49:0.6};
// Dawnlight Peak: each biome lerps toward a warm, bright twin of itself (biome 49 is the look, not a place)
const N4DAWN_RGB={40:[204,184,214],41:[214,172,190],42:[202,190,216],43:[186,206,230],44:[198,190,232],45:[230,220,246],46:[86,140,206],47:[184,204,170],48:[244,236,255]};
// the last word on the ground color of every map 4 biome: the Ink Sea, ink pools, void chasms, spike banks, the deck, dawn
function n4RGB(c,s,x,y){
  if(s.nsea){
    c=mixRGB([10,7,22],[20,14,38],clamp(0.5+s.n,0,1));
    // a violet lip where the ink meets the cliffs (and round the Bridgefoot)
    let lip=0; const dx=x-4500, dy=y-85200, r=Math.sqrt(dx*dx+dy*dy);
    if(r<4260){ const ux=dx/r, uy=dy/r; if(elevLvl(x-ux*18,y-uy*18)>0) lip=1; else if(elevLvl(x-ux*40,y-uy*40)>0) lip=0.5; }
    if(y>89150){ const fd=n4FootD(x,y); if(fd<34) lip=Math.max(lip,1-fd/34); }
    if(lip>0) c=mixRGB(c,[96,64,176],lip*0.55);
    // the broken moon's reflection: a pale cracked ring smeared on the ink north of the peak
    if(y<81100&&y>80150){ const ex=(x-4500)/760, ey=(y-80620)/230, d=Math.sqrt(ex*ex+ey*ey); if(d<1.15){ let k=Math.max(0,1-Math.abs(d-0.84)/0.2); k*=0.55+0.45*Math.sin(y*0.09+x*0.004); if(d<0.62) k=Math.max(k,0.22*(1-d/0.62)); if(Math.sin(Math.atan2(ey,ex)*5+1.3)>0.82) k*=0.25; c=mixRGB(c,[170,158,226],clamp(k,0,1)*0.55); } }
  }else if(s.void){
    c=mixRGB([6,4,14],[16,10,30],clamp(0.5+s.n*1.4,0,1));
  }else if(s.ink){
    c=mixRGB([14,9,26],[34,22,58],clamp(0.5+s.n*1.6,0,1));
  }else{
    if(s.spike) c=mixRGB(c,[20,14,32],0.38);
    if(s.deck){ const k=0.5+0.5*Math.sin(y*0.3), e=Math.abs(x-4500)/60; c=mixRGB([170,168,236],[236,238,255],k*0.5+(1-e)*0.3); if(e>0.85) c=mixRGB(c,[90,80,170],0.6); }
  }
  const K=N4W.dawnK;
  if(K>0){ const D=N4DAWN_RGB[s.b]||N4DAWN_RGB[41]; let t=D; if(s.void) t=[60,52,92]; else if(s.ink&&!s.nsea) t=[120,170,226]; c=mixRGB(c,mixRGB(t,[255,246,236],Math.max(0,s.n)*0.25),K*0.85); }
  return c;
}
// ground marks per biome (sparse and chunky; the big cracks and their glow are painted by n4Paint)
function n4Decor(g,rng,x,y,s,r,b){
  if(b===46||s.nsea){ if(r<0.012){ g.fillStyle='rgba(150,110,255,.45)'; g.fillRect(x-3,y,6,1); }
    else if(r<0.05){ const w=10+rng()*18; g.strokeStyle=`rgba(${r<0.03?'130,100,230':'90,70,170'},${0.22+rng()*0.16})`; g.lineWidth=1.4; g.beginPath(); g.moveTo(x-w,y); g.quadraticCurveTo(x,y-3-rng()*3,x+w,y); g.stroke(); }
    return; }
  if(s.ink||s.void||s.water) return;
  if(s.sand>0.5){ if(r<0.16){ g.strokeStyle='rgba(150,140,220,.35)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-8,y); g.quadraticCurveTo(x,y-3,x+8,y); g.stroke(); } else if(r<0.2) n4Glint(g,x,y,1.4,'rgba(220,210,255,.8)'); return; }
  if(r<0.05) sbPebble(g,x,y,1.4+rng()*1.6,b===43?'#5a78a8':b===41?'#6a4a6c':'#5a5480');
  else if(r<0.075){ g.fillStyle='rgba(190,170,255,.32)'; g.fillRect(x-1,y-1,2,2); }
  else if(b===41&&r<0.1){ g.strokeStyle='rgba(255,140,80,.24)'; g.lineWidth=1; g.beginPath(); g.moveTo(x,y); g.lineTo(x+6,y+2); g.lineTo(x+9,y-1); g.stroke(); }
  else if(b===43&&r<0.12){ g.fillStyle='rgba(220,240,255,.55)'; const q=1+rng(); g.fillRect(x-q*1.5,y-0.4,q*3,0.8); g.fillRect(x-0.4,y-q*1.5,0.8,q*3); }
  else if(b===47&&r<0.11) sbTuft(g,x,y,'rgba(100,100,120,.5)',0.8);
}

// ================= 4. terrain: the Ink Sea, ink, void, glass spike walls, sand, ice (bible 3.2 and 5)
// A feature is {k:'ink'|'void'|'spike'|'sand'|'ice', bb, test(x,y,r,a), on?()}; a coarse grid finds the few near a point.
const N4FE=[], N4IX={cs:256,cells:null,nx:0,ny:0};
function n4FAdd(k,bb,test,o){ const f=Object.assign({k,bb,test,on:null,id:''},o||{}); N4FE.push(f); N4IX.cells=null; return f; }
function n4FSec(k,r0,r1,a0,a1,o){ o=o||{}; const P=n4Sec(r0,r1,a0,a1,{step:3}), mi=o.minus; return n4FAdd(k,n4BB(P,6),mi?(x,y,r,a)=>r>=r0&&r<=r1&&n4In(a,a0,a1)&&!mi(x,y,r,a):(x,y,r,a)=>r>=r0&&r<=r1&&n4In(a,a0,a1),Object.assign({sec:[r0,r1,a0,a1]},o)); }
function n4FDisc(k,cx,cy,R,o){ o=o||{}; const mi=o.minus; return n4FAdd(k,[cx-R,cy-R,cx+R,cy+R],(x,y,r,a)=>n4InD(x,y,cx,cy,R)&&!(mi&&mi(x,y,r,a)),Object.assign({disc:[cx,cy,R]},o)); }
function n4FAnn(k,cx,cy,R0,R1,o){ o=o||{}; const mi=o.minus; return n4FAdd(k,[cx-R1,cy-R1,cx+R1,cy+R1],(x,y,r,a)=>{ const d2=(x-cx)*(x-cx)+(y-cy)*(y-cy); return d2>=R0*R0&&d2<=R1*R1&&!(mi&&mi(x,y,r,a)); },Object.assign({ann:[cx,cy,R0,R1]},o)); }
function n4IxBuild(){
  const cs=N4IX.cs, nx=Math.ceil(9000/cs)+1, ny=Math.ceil(11000/cs)+1, cells=new Array(nx*ny).fill(null);
  for(const f of N4FE){ const i0=clamp(Math.floor(f.bb[0]/cs),0,nx-1), i1=clamp(Math.floor(f.bb[2]/cs),0,nx-1), j0=clamp(Math.floor((f.bb[1]-80000)/cs),0,ny-1), j1=clamp(Math.floor((f.bb[3]-80000)/cs),0,ny-1);
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*nx+i; (cells[k]||(cells[k]=[])).push(f); } }
  N4IX.nx=nx; N4IX.ny=ny; N4IX.cells=cells;
}
// the Bridgefoot apron: a rounded box (bible landD box 3400..5600 x 89300..90150) with a natural edge
function n4FootD(x,y){ const qx=Math.abs(x-4500)-940, qy=Math.abs(y-89725)-265; const d=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-160; return d-(d<60&&d>-60?fbm(x*0.006+3,y*0.006,2)*22:0); }
const n4OnDeck=(x,y)=>x>=4440&&x<=4560&&y>=90100&&y<=91000;
// walkable overrides over ink and void (a lowered drawbridge, clock hands, gear teeth): {id,bb,test(x,y),on()}
function n4OpenAt(x,y){ for(const o of N4W.open){ const b=o.bb; if(b&&(x<b[0]||y<b[1]||x>b[2]||y>b[3])) continue; if(o.on&&!o.on()) continue; if(o.test(x,y)) return o; } return null; }
// the flags at a point: writes ink, void, spike, sand, ice, nsea, deck, foot (all of them, every time)
function n4Feat(x,y,O){
  O.ink=0; O.void=0; O.spike=0; O.sand=0; O.ice=0; O.nsea=0; O.deck=0; O.foot=0; O.wall=0;
  const dx=x-4500, dy=y-85200, r=Math.sqrt(dx*dx+dy*dy);
  if(r>4020){
    if(n4OnDeck(x,y)){ O.deck=1; return O; }
    if(y>89100&&n4FootD(x,y)<=0) O.foot=1;
    else if(r>4220||(elevLvl(x,y)===0&&!(elevFace(x,y)&8))){ O.nsea=1; O.ink=1; return O; }   // (8: the stairs' lower half is level 0 too)
  }
  if(!N4IX.cells) n4IxBuild();
  const i=Math.floor(x/N4IX.cs), j=Math.floor((y-80000)/N4IX.cs);
  if(i<0||j<0||i>=N4IX.nx||j>=N4IX.ny) return O;
  const L=N4IX.cells[j*N4IX.nx+i]; if(!L) return O;
  let a=-1;
  for(let n=0;n<L.length;n++){
    const f=L[n], b=f.bb; if(x<b[0]||y<b[1]||x>b[2]||y>b[3]) continue; if(f.on&&!f.on()) continue;
    if(a<0){ a=Math.atan2(dx,dy)/N4D; if(a<0) a+=360; }
    if(!f.test(x,y,r,a)) continue;
    if(f.k==='sand') O.sand=Math.max(O.sand,f.soft?f.soft(x,y,r,a):1); else O[f.k]=1;
  }
  if((O.ink||O.void||O.spike)&&N4W.open.length&&n4OpenAt(x,y)){ O.ink=0; O.void=0; O.spike=0; }
  return O;
}
const N4BO={}, N4HO={};
// what blocks walkers here (before roads, walkways and water): the sea, void, spikes, and ink (until the dawn)
function n4Block(x,y){ n4Feat(x,y,N4BO); if(N4BO.nsea||N4BO.void||N4BO.spike||N4BO.wall) return true; if(N4BO.ink) return !(N4W.dawnK>=0.5); return false; }
// a hazard at a point (for landings and falls): 'ink' | 'void' | null; dynamic ones from x4_ascent and x4_foes too
function n4HazAt(x,y){
  if(y<79900||y>91100) return null;
  n4Feat(x,y,N4HO);
  if(N4HO.void) return 'void';
  if(N4HO.ink&&!(N4W.dawnK>=0.5&&!N4HO.nsea)) return 'ink';
  return n4DynHaz(x,y);
}
function n4DynHaz(x,y){ for(const h of N4W.haz){ const b=h.bb; if(b&&(x<b[0]||y<b[1]||x>b[2]||y>b[3])) continue; if(h.on&&!h.on()) continue; if(h.test(x,y)) return h.kind||'ink'; } return null; }
// what stops Ash in the AIR too (a jump or a flight): glass spike walls, the Ink Sea, and the two deep voids whose
// puzzles are not jumps (the Silk Gallery: grapple; the moat round the summit: the Moon Road). Other ink and void is
// jumped over on purpose. After the dawn only the sea is left.
const N4AO={};
function n4AirBlock(x,y){
  if(y<79900||y>91100) return false;
  n4Feat(x,y,N4AO);
  if(N4AO.nsea||N4AO.wall) return true;
  if(N4W.dawnK>=1) return false;
  if(N4AO.spike) return true;
  if(!N4AO.void) return false;
  const r=Math.hypot(x-4500,y-85200); if(r<890) return true;
  return r>2320&&r<3380&&n4In(n4Ang(x,y),N4G.gallery.a0,N4G.gallery.a1);
}
// the biome of a point: rings by radius (corrected by level near the edges), the optional arcs, the Bridgefoot, sea, deck
const N4RB=[0,41,42,43,44,45], N4EDGE=[0,3300,2400,1500,880], N4LR=[0,1,1,2,2,3,3,4,5];
const N4ARC={1:[208,352],2:[118,200],3:[26,110],4:[305,372]};
function n4BiomeOf(x,y,O){
  O.t=1;
  if(O.deck){ O.b=O.b2=48; return 48; }
  if(O.nsea){ O.b=O.b2=46; return 46; }
  if(O.foot){ const d=Math.hypot(x-4500,y-90180); if(d<300&&y>89880){ O.b=48; O.b2=40; O.t=0.5+0.5*clamp((300-d)/80,0,1); return 48; } O.b=O.b2=40; return 40; }
  const dx=x-4500, dy=y-85200, r=Math.sqrt(dx*dx+dy*dy);
  let ring=r<880?5:r<1500?4:r<2400?3:r<3300?2:1;
  if(ring<5&&ring>0){ const lv=elevLvl(x,y), rl=N4LR[lv]||0; if(rl&&rl!==ring&&Math.abs(rl-ring)===1){ const e=N4EDGE[Math.min(rl,ring)]; if(Math.abs(r-e)<90) ring=rl; } }
  let b=N4RB[ring];
  const arc=N4ARC[ring];
  if(arc){ let a=Math.atan2(dx,dy)/N4D; if(a<0) a+=360; let d=(a-arc[0])%360; if(d<0) d+=360; const span=arc[1]-arc[0], inA=d<=span;
    const ed=(inA?Math.min(d,span-d):Math.min(d-span,360-d))*N4D*r;
    if(inA){ O.b=47; O.b2=b; O.t=ed<50?0.5+0.5*ed/50:1; return 47; }
    if(ed<50){ O.b=b; O.b2=47; O.t=0.5+0.5*ed/50; return b; } }
  O.b=O.b2=b; return b;
}
// the sample hook: every map 4 sample gets all its fields, the forced biome, and no water under ink, void or spikes
function n4Extra(x,y,o){
  n4Feat(x,y,o); n4BiomeOf(x,y,o);
  o.glass=N4GLASS[o.b]||0;
  if(o.nsea||o.ink||o.void||o.spike){ o.water=0; o.depth=0; o.shore=0; o.sea=0; o.deep=0; o.seaD=0; o.road=0; o.bridge=0; }
  if(o.deck){ o.water=0; o.shore=0; }
  if(N4W.dawnK>=0.5&&o.ink&&!o.nsea){ o.water=1; o.depth=0.65; }
}

// ================= 5. the shapes of the peak (absolute coordinates; every spot is listed in N4WORLD.md)
const N4G={
  // Tier I: the Sluice river (moonwater, w is the half width) and its waterfall off the outer edge
  river:[52,46,40,34,28,22,16,10].map(a=>n4P(3700,a)).concat([n4P(3900,8.6),n4P(4190,8)]),
  fall:n4P(4090,8.25),
  inkGaps:[30,40], crystal:n4P(4000,56), chasm:[52.5,59], bridge1:{r0:3640,r1:3760,a0:52.1,a1:59.4},
  launch:[8398,85064], ventT:[8379,84792],
  leap:{a0:113.5,a1:128.5,r0:3598,wall:3642,gate:[114.4,116.6],pits:[[117.8,118.9],[120.6,121.95],[123.7,125.5]],flame:n4P(3870,126.8)},
  tide:{x:n4P(3800,139)[0],y:n4P(3800,139)[1],r:215,eye:36,stones:[[3605,140.4],[3652,138.6],[3702,139.9],[3751,138.4]]},
  sky:{x:5765,y:81600,r:330,isle:110},
  echoGate:172, echo1:{x:4500,y:81500,r:380,step:[4720,81650,50],moat:[4250,81330,110,45],b4:[4750,81330,55,125],throne:[4500,81170]},
  ventC:[3303,81911],
  // Tier II
  clock:{x:2165,y:83565,r:300,rim:345,hub:45,six:[80,120],nine:[170,210],wallIn:[140,165],wallOut:[228,252],tower:[2095,83020,2235,83120],alcove:[2430,83820]},
  gallery:{a0:264,a1:300,posts:[270,276,282,288,294].map(a=>n4P(2850,a)),shore:[n4P(2850,263.2),n4P(2850,300.8)],hidden:n4P(2600,284),isle:58},
  climbCols:[2550,2800,3050],
  gear:{a0:6,a1:20.5,shelves:[[2600,358],[2850,352],[3150,357]].map(([r,a])=>n4P(r,a)),plate:[4600,88200],post:n4P(2850,22)},
  echo2:{x:6515,y:87215,r:360,balc:[[6300,87000],[6730,87430]]},
  u2:{a0:96,a1:104,post:n4P(2800,102)},
  // Tier III
  dam:{a:190,hw:8,ledge:[4000,82900,4400,83020]},     // the channel is 16 degrees wide: no jump clears it
  aurora:{a0:229.5,a1:286,pillars:[n4P(1950,248),n4P(1950,268)]},
  echo3:{x:3121,y:86579,r:400},
  emberLedge:[6600,85200,70],
  // Tier IV
  lagoon:[50,56,62,68].map(a=>n4P(1190,a)), lagoonUp:[[74,270],[80,240],[86,260]].map(([a,r])=>({p:n4P(1190,a),r})), lagoonSpikes:[84,92],
  moonstone:n4P(1455,81), m2:[5300,84380],
  echo4:{x:3315,y:85096,r:290},
  nest:n4P(1190,328), pane6:[4093,86318],
  // the Moon Road over the moat (r 720..880): I1 (a Double Jump step from Tier IV), I2 (grapple post), I3 (wind),
  // then the moon-glass strip to the Moon Door on the summit's south rim
  road:{I1:n4P(830,300),r1:66,I2:n4P(808,320),r2:60,I3:n4P(808,340),r3:60,strip:[n4P(808,341),n4P(812,348),n4P(806,354.5),n4P(780,359.2),n4P(740,0.2),n4P(706,0)],w:56,door:[4500,85920]},
  summit:{x:4500,y:85200,r:720,floor:600}
};
// the Sluice's water edge exactly as e2_terrain draws it (so the spike banks start where the water stops)
function n4RiverWd(x,y){ const d=n4SegD(N4G.river,x,y); return d-120-(d<290?fbm(x*0.004,y*0.004,2)*20:0); }
// echo wins open the way up (only once x4_foes has made that echo; until then the way stays open for testing)
const N4ECHO=[null,['n_echo1','n_echo_vor'],['n_echo2','n_echo_vesper'],['n_echo3','n_echo_glaciar'],['n_echo4','n_echo_hush']];
function n4EchoDone(k){ const e=N4ECHO[k]; if(!e||!G) return true; if(typeof SITES==='undefined'||!SITES[e[0]]) return true; return !!(G.bossDone&&G.bossDone[e[1]])||n4F('n_echo'+k+'_done'); }

// ---------- the features (rings counter-clockwise from the bridge)
(function n4Features(){
  const sec=n4FSec, dw=n4Dw;
  // Tier I. 1B the Sluice: glass spike banks so the river is the only road, two ink gaps across it, the drawbridge chasm
  sec('spike',3150,4260,12,48,{id:'sluice_banks',minus:(x,y)=>n4RiverWd(x,y)<0});
  for(const a of N4G.inkGaps) sec('ink',3540,3860,a-dw(30,3700),a+dw(30,3700),{id:'sluice_ink_'+a});
  const C1=N4G.crystal; sec('ink',3150,4260,N4G.chasm[0],N4G.chasm[1],{id:'drawbridge',minus:(x,y)=>n4InD(x,y,C1[0],C1[1],46)});
  // 1C: stubs at the ends of the cracked wall (θ 66) and banks along the ink falls (θ 74, 80, 86)
  sec('spike',3150,3368,66-dw(24,3260),66+dw(24,3260),{id:'crack_in'}); sec('spike',4032,4260,66-dw(24,4060),66+dw(24,4060),{id:'crack_out'});
  sec('spike',3150,3355,70,90,{id:'falls_in'}); sec('spike',4045,4260,70,90,{id:'falls_out'});
  // 1D the Leap Court: a walled pocket on the outer side of the ring with a gate, three ink pits and the flame
  const L=N4G.leap;
  sec('spike',L.r0,L.wall,L.a0,L.a1,{id:'leap_wall',minus:(x,y,r,a)=>n4In(a,L.gate[0],L.gate[1])});
  sec('spike',L.r0,4260,L.a0,L.a0+0.8,{id:'leap_end0'}); sec('spike',L.r0,4260,L.a1-0.8,L.a1,{id:'leap_end1'});
  L.pits.forEach((p,i)=>sec('ink',L.wall,4260,p[0],p[1],{id:'leap_pit'+(i+1)}));
  // the Sky Court: a void chasm with the flame's island in it
  const SK=N4G.sky; n4FDisc('void',SK.x,SK.y,SK.r,{id:'sky_chasm',minus:(x,y)=>n4InD(x,y,SK.x,SK.y,SK.isle)});
  // the Echo Gate (θ 172): the ring narrows to an opening at r 3790..4010
  sec('spike',3150,3790,171.6,172.4,{id:'gate_in'}); sec('spike',4010,4260,171.6,172.4,{id:'gate_out'});
  // Echo 1: B4 stands on a ledge past a 70 px ink gap
  const E1=N4G.echo1; n4FAnn('ink',E1.b4[0],E1.b4[1],E1.b4[2],E1.b4[3],{id:'echo1_b4'});
  // Tier II. 2A the Midnight Clock: an ink face round a hub, a stone rim walkable only at the 6 and the 9, walls that
  // send the ring over the clock (the alcove behind its moth curtain is a dead end on the entry side)
  const K=N4G.clock, inArcs=(p)=>(p>=K.six[0]&&p<=K.six[1])||(p>=K.nine[0]&&p<=K.nine[1]);
  n4FDisc('ink',K.x,K.y,K.r,{id:'clock_face',minus:(x,y)=>n4InD(x,y,K.x,K.y,K.hub)});
  n4FAnn('spike',K.x,K.y,K.r,K.rim,{id:'clock_rim',minus:(x,y)=>inArcs(n4Phi(x,y,K.x,K.y))});
  n4FAnn('spike',K.x,K.y,K.rim,620,{id:'clock_wall_in',minus:(x,y,r)=>{ const p=n4Phi(x,y,K.x,K.y); return p<K.wallIn[0]||p>K.wallIn[1]||r<2330||r>3330; }});
  n4FAnn('spike',K.x,K.y,K.rim,760,{id:'clock_wall_out',minus:(x,y,r)=>{ const p=n4Phi(x,y,K.x,K.y); return p<K.wallOut[0]||p>K.wallOut[1]||r<2330||r>3330; }});
  // 2B the Silk Gallery: a void chasm across the ring with pillar islands (grapple posts) and two curtain necks
  const GA=N4G.gallery, gIs=(x,y)=>GA.posts.some(p=>n4InD(x,y,p[0],p[1],GA.isle))||n4InD(x,y,GA.hidden[0],GA.hidden[1],50);
  sec('void',2330,3370,GA.a0,GA.a1,{id:'gallery',minus:gIs});
  for(const a of [262,306]){ sec('spike',2340,2700,a-0.6,a+0.6,{id:'curtain_'+a+'_in'}); sec('spike',3000,3360,a-0.6,a+0.6,{id:'curtain_'+a+'_out'}); }
  // 2D the Gear Bridge: an ink band across the ring (the gears turn into a walkway; x4_ascent opens their teeth)
  sec('ink',2330,3370,N4G.gear.a0,N4G.gear.a1,{id:'gear_pool'});
  // Echo 2: spike banks flank the Mask Hall so the way on leads through it
  const E2=N4G.echo2, out2=(x,y)=>n4InD(x,y,E2.x,E2.y,E2.r+12);
  sec('spike',2340,2482,37,53,{id:'echo2_in',minus:out2}); sec('spike',3218,3360,37,53,{id:'echo2_out',minus:out2});
  // U2 the Long Climb: a void gap with one grapple pillar
  const P2=N4G.u2.post; sec('void',2330,3370,N4G.u2.a0,N4G.u2.a1,{id:'u2_gap',minus:(x,y)=>n4InD(x,y,P2[0],P2[1],55)});
  // Tier III. 3A the ice wall stubs (θ 126) and the Floe Gap
  sec('spike',1440,1556,126-dw(24,1500),126+dw(24,1500),{id:'icewall_in'}); sec('spike',2344,2460,126-dw(24,2400),126+dw(24,2400),{id:'icewall_out'});
  sec('void',1440,2460,135,150,{id:'floe_gap'});
  // 3B the Ice Dam: an ink channel that the burst dam freezes into an ice bridge (G.flags.n_dam)
  const D=N4G.dam;
  const onLedge=(x,y)=>x>=D.ledge[0]&&x<=D.ledge[2]&&y>=D.ledge[1]&&y<=D.ledge[3];   // the ledge's top only: ink under its face
  sec('ink',1440,2460,D.a-D.hw,D.a+D.hw,{id:'dam_ink',on:()=>!n4F('n_dam'),minus:onLedge});
  sec('ice',1440,2460,D.a-D.hw-0.4,D.a+D.hw+0.4,{id:'dam_ice',on:()=>n4F('n_dam'),minus:onLedge});
  // 3C the Aurora Bridge: a void chasm with two ice pillars
  const AU=N4G.aurora; sec('void',1440,2460,AU.a0,AU.a1,{id:'aurora',minus:(x,y)=>AU.pillars.some(p=>n4InD(x,y,p[0],p[1],70))});
  // Echo 3: flanks of the Rime Throne
  const E3=N4G.echo3, out3=(x,y)=>n4InD(x,y,E3.x,E3.y,E3.r+12);
  sec('spike',1440,1562,302,328,{id:'echo3_in',minus:out3}); sec('spike',2338,2460,302,328,{id:'echo3_out',minus:out3});
  // Tier IV. the Moth Door wall (θ 12; a gap for the one-way silk curtain at r 1120..1260)
  sec('spike',820,1560,11.4,12.6,{id:'mothdoor_wall',minus:(x,y,r)=>r>1120&&r<1260});
  // 4A the Drowned Mirror: stubs at the glass wall's ends, the spike field the lagoon rises over (G.flags.n_lagoon)
  sec('spike',820,905,61.4,62.6,{id:'glasswall_in'}); sec('spike',1475,1560,61.4,62.6,{id:'glasswall_out'});
  sec('spike',820,1560,N4G.lagoonSpikes[0],N4G.lagoonSpikes[1],{id:'lagoon_spikes',on:()=>!n4F('n_lagoon')});
  // 4B the Glass Dunes (black glass sand, soft edges), M2's glass-walled pit (burrow under), the Moon Lock neck
  n4FSec('sand',840,1540,92,160,{id:'dunes',soft:(x,y,r,a)=>clamp(Math.min((a-92)*N4D*r,(160-a)*N4D*r,r-840,1540-r)/40,0,1)});
  n4FAnn('spike',N4G.m2[0],N4G.m2[1],70,92,{id:'m2_pit'});
  sec('spike',820,1120,161.4,162.6,{id:'moonlock_in'}); sec('spike',1260,1560,161.4,162.6,{id:'moonlock_out'});
  // Echo 4: the Eclipse Hall's sand rim
  const E4=N4G.echo4; n4FAnn('sand',E4.x,E4.y,200,290,{id:'echo4_sand',soft:(x,y)=>{ const d=Math.hypot(x-E4.x,y-E4.y); return clamp(Math.min(d-200,290-d)/18,0,1); }});
  // the Moth's Cradle: a sand nest, and pane 6 under the big cocoon inside a ring of spikes (burrow under)
  const NE=N4G.nest; n4FDisc('sand',NE[0],NE[1],150,{id:'cradle_nest',soft:(x,y)=>clamp((150-Math.hypot(x-NE[0],y-NE[1]))/30,0,1)});
  const P6=N4G.pane6; n4FAnn('spike',P6[0],P6[1],60,84,{id:'pane6_ring'}); n4FDisc('sand',P6[0],P6[1],60,{id:'pane6_sand'});
  // the moat: void wherever the ground is still Tier IV's level 7 (the summit and the Moon Road islands are level 8),
  // and the moon-glass strip (void until Moonfire lights the glass: p4_moon's moonglass holds Ash up)
  n4FAnn('void',4500,85200,690,880,{id:'moat',minus:(x,y)=>elevLvl(x,y)!==7});
  const R=N4G.road; n4FAdd('void',n4BB(R.strip,R.w),(x,y)=>n4SegD(R.strip,x,y)<=R.w/2+2&&!n4InD(x,y,4500,85200,712)&&!n4InD(x,y,R.I3[0],R.I3[1],R.r3+2),{id:'road_strip'});
})();
// the drawbridge (1B): its lane over the chasm is ground once the crystal drops it (G.flags.n_bridge1)
N4W.open.push({id:'drawbridge',bb:n4BB(n4Sec(N4G.bridge1.r0,N4G.bridge1.r1,N4G.bridge1.a0,N4G.bridge1.a1),4),on:()=>n4F('n_bridge1'),
  test:(x,y)=>{ const B=N4G.bridge1, r=Math.hypot(x-4500,y-85200); return r>=B.r0&&r<=B.r1&&n4In(n4Ang(x,y),B.a0,B.a1); }});

// ================= 6. elevation (bible 3.3): nested plateaus, ramps, the one-way shortcut drops, climbs, posts, vents
// Sector outer arcs reach 45 px past the disc they sit on (tapering to its edge at the ends) so no slivers are left.
function n4Elev(){
  const k=4, pl=d=>ELEV.plateau(Object.assign({k},d));
  pl({disc:[4500,85200,4100],lvl:1,style:'n_obsid',noise:18,seed:41,id:'n_peak'});
  pl({poly:n4Sec(3255,4145,100,352,{tp:3,rEnd:4092}),lvl:2,style:'n_obsid',noise:18,seed:41,id:'n_t1hi'});
  pl({disc:[4500,85200,3300],lvl:3,style:'n_chalk',noise:14,seed:42,id:'n_t2'});
  pl({poly:n4Sec(2355,3345,330,560,{tp:3,rEnd:3292}),lvl:4,style:'n_chalk',noise:14,seed:42,id:'n_t2hi'});
  pl({disc:[4500,85200,2400],lvl:5,style:'n_ice',noise:12,seed:43,id:'n_t3'});
  pl({poly:n4Sec(1455,2445,230,470,{tp:3,rEnd:2392}),lvl:6,style:'n_ice',noise:12,seed:43,id:'n_t3hi'});
  pl({disc:[4500,85200,1500],lvl:7,style:'n_glass',noise:10,seed:44,id:'n_t4'});
  pl({disc:[4500,85200,720],lvl:8,style:'n_summit',noise:3,seed:45,id:'n_summit'});
  // the Bridgefoot: the grand stairs up to Tier I, the Double Jump step under lantern 3
  ELEV.ramp({k,x0:4380,y0:89150,x1:4620,y1:89400,dir:'n',kind:'stairs'});
  pl({disc:[3760,89560,90],lvl:1,style:'n_obsid',step:true,noise:5,id:'n_lan_high'});
  // Tier I: the one-way shortcut from the Silent Green (θ 352) back to the top of the stairs
  ELEV.ledge({k,x0:3880,y0:88600,x1:4100,y1:89220});
  // Echo 1: B2's step pillar
  const E1=N4G.echo1; pl({disc:E1.step,lvl:3,style:'n_obsid',step:true,noise:3,id:'n_echo1_b2'});
  // Tier II: the clock tower (claws), the Chalk Climb's three cracked columns, the gear shelves, the Mask Hall balconies,
  // U2's climbable face up to Tier III, the shortcut from the Clockmaker's Rest (θ 200) down to the Clockstop Shrine
  pl({rect:N4G.clock.tower,lvl:4,style:'n_chalk',climb:true,noise:0,id:'n_clocktower'});
  for(const r of N4G.climbCols) pl({poly:n4Sec(r-40,r+40,328.6,333.5,{step:1}),lvl:4,style:'n_chalk',climb:true,noise:3,id:'n_chalkcol_'+r});
  N4G.gear.shelves.forEach((p,i)=>pl({rect:[p[0]-45,p[1]-28,p[0]+45,p[1]+28],lvl:5,style:'n_chalk',noise:0,id:'n_gearshelf'+(i+1)}));
  for(const b of N4G.echo2.balc) pl({disc:[b[0],b[1],60],lvl:5,style:'n_chalk',climb:true,noise:3,id:'n_balcony_'+b[0]});
  pl({poly:n4Sec(2350,2446,112,118,{step:1}),lvl:5,style:'n_ice',climb:true,noise:2,id:'n_longclimb'});
  ELEV.ledge({k,x0:3360,y0:82180,x1:3700,y1:82860});
  // Tier III: the Ice Dam's ledge, the Heart Ember's ice ledge (a ramp under a lid), the shortcut at θ 110
  pl({rect:N4G.dam.ledge,lvl:6,style:'n_ice',noise:0,id:'n_damledge'});
  const EL=N4G.emberLedge; pl({disc:EL,lvl:7,style:'n_ice',noise:3,id:'n_emberledge'});
  ELEV.ramp({k,x0:EL[0]-26,y0:EL[1]+48,x1:EL[0]+26,y1:EL[1]+124,dir:'n',kind:'stairs'});
  // the Moon Road: I1 is a Double Jump step that juts over Tier IV's edge, I2 and I3 are pillars, the strip is level 8
  const R=N4G.road;
  pl({disc:[R.I1[0],R.I1[1],R.r1],lvl:8,style:'n_summit',step:true,noise:2,id:'n_road1'});
  pl({disc:[R.I2[0],R.I2[1],R.r2],lvl:8,style:'n_summit',noise:2,id:'n_road2'});
  pl({disc:[R.I3[0],R.I3[1],R.r3],lvl:8,style:'n_summit',noise:2,id:'n_road3'});
  pl({poly:n4Lane(R.strip,R.w),lvl:8,style:'n_summit',noise:0,id:'n_roadstrip'});
  // grapple posts (U2 and the Silk Gallery's hidden fourth post wait on a flag; see N4WORLD.md)
  // (every post is kept in N4W.posts too; `when` never depends on where Ash stands, `from` is the lowest level he
  // must stand on for the post to glow: I2's post sits a few steps off Tier IV's rim and must only work from I1)
  const gp=d=>{ const o=Object.assign({k},d); if(o.from) o.when=()=>!!player&&elevLvl(player.x,player.y)>=o.from&&(!d.when||d.when()); N4W.posts.push(Object.assign({},d,{x:d.x,y:d.y})); ELEV.grapple(o); };
  for(const p of N4G.gallery.posts) gp({x:p[0],y:p[1],lvl:3});
  for(const p of N4G.gallery.shore) gp({x:p[0],y:p[1],lvl:3});
  gp({x:N4G.gallery.hidden[0],y:N4G.gallery.hidden[1],lvl:3,when:()=>n4F('n_vline')});
  gp({x:N4G.gear.post[0],y:N4G.gear.post[1],lvl:4});
  for(const b of N4G.echo2.balc) gp({x:b[0],y:b[1]-8,lvl:5});
  gp({x:N4G.u2.post[0],y:N4G.u2.post[1],lvl:4,when:()=>n4EchoDone(2)});
  gp({x:R.I2[0],y:R.I2[1],lvl:8,from:8});
  // vents: the Updraft Terraces (always); the Wind Chimney's is added once Echo 1 is beaten (n4Sync)
  ELEV.vent({k,x:N4G.ventT[0],y:N4G.ventT[1],r:70,lift:1});
  // the waterfall where the Sluice pours off the edge into the ink
  ELEV.fall({k,x:N4G.fall[0],y:N4G.fall[1]-6,w:46,kind:'water'});
}
// a lane polygon round a polyline (for the moon-glass strip)
function n4Lane(pts,w){
  const L=[], R=[];
  for(let i=0;i<pts.length;i++){ const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)], dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1, nx=-dy/l*w/2, ny=dx/l*w/2; L.push([pts[i][0]+nx,pts[i][1]+ny]); R.push([pts[i][0]-nx,pts[i][1]-ny]); }
  return L.concat(R.reverse());
}
n4Elev();
// grapple posts with a `when` (x1_world does the same for map 1)
{ const bp=ELEV.posts, PC={src:null,n:-1,l:null,t:-1}; ELEV.posts=function(k){ const L=bp(k); if(k!==4) return L; const t=G?G.time:0; if(PC.src===L&&PC.n===L.length&&PC.t===t) return PC.l; PC.src=L; PC.n=L.length; PC.t=t; PC.l=L.filter(q=>!q.when||q.when()); return PC.l; }; }

// ================= 7. flight: no flying on the peak except in calm zones (bible 3.4), and the one-way drops
// Calm zones with fly:true let wings work; the four wind crossings (fly:false) only name the place: Wind Riding works in
// no-fly air already (POWERS3 4) and free flight there would cross the gaps without the puzzle.
function n4Calm(id,o){ const z=Object.assign({id,fly:true,on:null},o); if(o.sec){ const [r0,r1,a0,a1]=o.sec; z.bb=n4BB(n4Sec(r0,r1,a0,a1),4); z.test=(x,y)=>{ const r=Math.hypot(x-4500,y-85200); return r>=r0&&r<=r1&&n4In(n4Ang(x,y),a0,a1); }; }
  else if(o.disc){ const [cx,cy,R]=o.disc; z.bb=[cx-R,cy-R,cx+R,cy+R]; z.test=(x,y)=>n4InD(x,y,cx,cy,R); }
  N4W.calm[id]=z; return z; }
N4W.calmOn={cz_echo3:false,cz_summit:false};
n4Calm('cz_terrace',{sec:[3350,4050,68,112]});
n4Calm('cz_sky',{sec:[3350,4050,150,170]});
n4Calm('cz_chimney',{sec:[3150,3800,195,208],on:()=>n4EchoDone(1)});
n4Calm('cz_floe',{sec:[1750,2380,133,152],fly:false,wind:true});
n4Calm('cz_aurora',{sec:[1750,2380,228,292],fly:false,wind:true});
n4Calm('cz_echo3',{disc:[3121,86579,330],on:()=>!!N4W.calmOn.cz_echo3});
n4Calm('cz_gust',{sec:[1300,2050,16,26],fly:false,wind:true});
n4Calm('cz_road',{disc:[4106,85883,170],fly:false,wind:true});
n4Calm('cz_summit',{disc:[4500,85200,900],on:()=>!!N4W.calmOn.cz_summit});
function n4CalmAt(x,y,flyOnly){ for(const id in N4W.calm){ const z=N4W.calm[id], b=z.bb; if(flyOnly&&!z.fly) continue; if(x<b[0]||y<b[1]||x>b[2]||y>b[3]) continue; if(z.on&&!z.on()) continue; if(z.test(x,y)) return z; } return null; }
// one-way drops back to each ring's shrine (the end of every optional arc): Ash pushes off the edge in any direction
N4W.drops.push({id:'drop_t1',from:2,to:1,sec:[3300,4110,349,355.5]},{id:'drop_t2',from:4,to:3,sec:[2430,3270,197,203]},{id:'drop_t3',from:6,to:5,sec:[1530,2370,106.5,113.5]});

// ================= 8. ground art baked into the chunks (ELEV.deco at level 98: over every cliff, under everything live)
// glowing violet cracks (ember-orange hairlines on Tier I), rims along ink and void, the arena sigils, the Midnight Clock's
// dial, the green, the launch pad; cracks and rims also go into the chunk's glow layer (they shine through the dark)
const N4T={}, N4SG=new Float32Array(33*33), N4SV=new Float32Array(33*33), N4SK=new Uint8Array(33*33);
function n4GlowCtx(ch,x0,y0){ if(!ch.glow) ch.glow=mkCanvas(CPX/4,CPX/4); const q=(CPX/4)/CH, gl=ch.glow.getContext('2d'); gl.setTransform(q,0,0,q,-x0*q,-y0*q); gl.lineCap='round'; gl.lineJoin='round'; return gl; }
function n4Hit(bb,x0,y0,x1,y1,m){ m=m||0; return bb[0]<x1+m&&bb[2]>x0-m&&bb[1]<y1+m&&bb[3]>y0-m; }
function n4Paint(g,x0,y0,x1,y1,ch){
  if(y0<79800||y0>91000) return;
  const K=N4W.dawnK>0?N4W.dawnK:0, dawn=K>=0.5, t0=n4Now();
  let gl=null; const GL=()=>gl||(gl=n4GlowCtx(ch,x0,y0));
  g.save(); g.lineCap='round'; g.lineJoin='round';
  // 1. the rims of ink pools, void chasms and the Ink Sea's coast (marching squares over a 16 px sample grid)
  const N=33, st=CH/(N-1); let anyI=false, anyV=false, mixd=false;
  { const dx=x0+CH/2-4500, dy=y0+CH/2-85200, rc=Math.hypot(dx,dy); if(rc>3800) mixd=true; }
  if(!mixd) for(const f of N4FE){ if((f.k==='ink'||f.k==='void')&&n4Hit(f.bb,x0,y0,x1,y1,20)){ mixd=true; break; } }
  if(mixd){
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const x=x0+i*st, y=y0+j*st; n4Feat(x,y,N4T); const k=j*N+i; N4SG[k]=N4T.ink?1:0; N4SV[k]=N4T.void?1:0; N4SK[k]=(elevFace(x+st/2,y+st/2)&1)?1:0; if(N4T.ink) anyI=true; if(N4T.void) anyV=true; }
    if(anyI){ const L=msLines(N4SG,N,x0,y0,st,0.5,[],N4SK);
      if(L.length){ msStroke(g,L,'rgba(6,3,14,.85)',5); msStroke(g,L,dawn?'rgba(200,230,255,.9)':'rgba(150,110,255,.75)',1.8);
        if(!dawn){ const q=GL(); q.strokeStyle='rgba(150,100,255,.55)'; q.lineWidth=7; q.beginPath(); for(let i=0;i<L.length;i+=6){ q.moveTo(L[i],L[i+1]); q.lineTo(L[i+2],L[i+3]); } q.stroke(); } } }
    if(anyV){ const L=msLines(N4SV,N,x0,y0,st,0.5,[],N4SK);
      if(L.length){ msStroke(g,L,'rgba(4,2,10,.9)',7); msStroke(g,L,dawn?'rgba(255,240,220,.8)':'rgba(200,170,255,.7)',2.4);
        if(!dawn){ const q=GL(); q.strokeStyle='rgba(170,120,255,.5)'; q.lineWidth=10; q.beginPath(); for(let i=0;i<L.length;i+=6){ q.moveTo(L[i],L[i+1]); q.lineTo(L[i+2],L[i+3]); } q.stroke(); } } }
  }
  // 2. (the facets and cracks are painted level by level, see n4PaintLvl) 3. the places: sigils on the arena floors, the clock dial, the green, the launch pad, the Moon Road's ghost
  const S=N4G.summit; if(n4Hit([S.x-600,S.y-600,S.x+600,S.y+600],x0,y0,x1,y1)) n4Sigil(g,S.x,S.y,560,dawn?'rgba(255,236,200,.55)':'rgba(214,196,255,.5)',true,()=>GL());
  for(const E of [N4G.echo1,N4G.echo2,N4G.echo3,N4G.echo4]){ const R=E.r-30; if(n4Hit([E.x-R,E.y-R,E.x+R,E.y+R],x0,y0,x1,y1)) n4Sigil(g,E.x,E.y,R,dawn?'rgba(255,236,200,.4)':'rgba(190,160,255,.36)',false,()=>GL()); }
  const Kc=N4G.clock; if(n4Hit([Kc.x-360,Kc.y-360,Kc.x+360,Kc.y+360],x0,y0,x1,y1)) n4Dial(g,Kc,dawn);
  if(n4Hit([4240,89390,4760,89910],x0,y0,x1,y1)) n4Green(g,4500,89650,dawn);
  const LP=N4G.launch; if(n4Hit([LP[0]-60,LP[1]-60,LP[0]+60,LP[1]+60],x0,y0,x1,y1)) n4Pad(g,LP[0],LP[1]);
  const R=N4G.road; if(n4Hit(n4BB(R.strip,60),x0,y0,x1,y1)){ g.setLineDash([6,10]); g.strokeStyle=dawn?'rgba(255,255,255,.5)':'rgba(200,190,255,.32)'; g.lineWidth=2; for(const sd of [-1,1]){ const L=n4Lane(R.strip,R.w-10*sd*0); g.beginPath(); g.moveTo(L[0][0],L[0][1]); for(const p of L) g.lineTo(p[0],p[1]); g.closePath(); g.stroke(); break; } g.setLineDash([]); }
  if(n4Hit([4400,90060,4600,91000],x0,y0,x1,y1)){ g.strokeStyle='rgba(255,255,255,.55)'; g.lineWidth=3; g.beginPath(); g.moveTo(4446,90100); g.lineTo(4446,91000); g.moveTo(4554,90100); g.lineTo(4554,91000); g.stroke(); const q=GL(); q.strokeStyle='rgba(200,210,255,.8)'; q.lineWidth=18; q.beginPath(); q.moveTo(4500,90100); q.lineTo(4500,91000); q.stroke(); }
  g.restore(); N4FC.key=''; n4Pf('p98',t0);
}
// faceted black glass and its glowing cracks, painted per level (after that level's cliff tops, before the next level's),
// so a crack never runs over a cliff face. The facets come from one jittered world lattice, so chunks meet seamlessly.
const N4LS=96, N4FC={key:'',geo:null};
function n4H(i,j,s){ let h=(Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(s|0,2246822519))|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }
function n4LP(i,j){ return [i*N4LS+(n4H(i,j,1)-0.5)*N4LS*0.72, j*N4LS+(n4H(i,j,2)-0.5)*N4LS*0.72]; }
// the level of a spot where a facet or crack may go, or -1 (faces, ink, void, water, sea, deck, spikes)
function n4OkPt(x,y){ if(elevFace(x,y)&1) return -1; T(x,y,N4T); if(N4T.out||N4T.water||N4T.ink||N4T.void||N4T.nsea||N4T.deck||N4T.spike) return -1; return elevLvl(x,y); }
function n4ChunkGeo(x0,y0){
  const key=x0+','+y0; if(N4FC.key===key) return N4FC.geo;
  const i0=Math.floor(x0/N4LS)-1, j0=Math.floor(y0/N4LS)-1, i1=Math.floor((x0+CH)/N4LS)+1, j1=Math.floor((y0+CH)/N4LS)+1;
  const tris=[], cracks=[], LV=new Map(), lvls=new Set();
  const pl=(i,j)=>{ const k=i*65536+j; let v=LV.get(k); if(v===undefined){ const p=n4LP(i,j); v=n4OkPt(p[0],p[1]); LV.set(k,v); } return v; };
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){
    const fl=n4H(i,j,3)<0.5, Q=fl?[[[i,j],[i+1,j],[i+1,j+1]],[[i,j],[i+1,j+1],[i,j+1]]]:[[[i,j],[i+1,j],[i,j+1]],[[i+1,j],[i+1,j+1],[i,j+1]]];
    for(let t=0;t<2;t++){ const q=Q[t], L=pl(q[0][0],q[0][1]); if(L<0||pl(q[1][0],q[1][1])!==L||pl(q[2][0],q[2][1])!==L) continue;
      const P=q.map(v=>n4LP(v[0],v[1])), cx=(P[0][0]+P[1][0]+P[2][0])/3, cy=(P[0][1]+P[1][1]+P[2][1])/3;
      if(cx<x0-N4LS||cx>x0+CH+N4LS||cy<y0-N4LS||cy>y0+CH+N4LS) continue;
      if(n4OkPt(cx,cy)!==L) continue;
      tris.push({P,lv:L,b:N4T.b,s:n4H(i,j,4+t),sand:N4T.sand>0.5,ice:!!N4T.ice}); lvls.add(L); } }
  // cracks: short glowing veins, some long faults; each stays on its own level
  const rng=mulberry32(((x0*7919)^(y0*104729)^0x4e58)|0);
  for(let n=0;n<30;n++){
    const x=x0+rng()*CH, y=y0+rng()*CH, big=n<5, L=n4OkPt(x,y), b=N4T.b, sand=N4T.sand>0.5; if(L<0||sand) continue;
    let a=rng()*TAU, px=x, py=y; const P=[[px,py]], m=big?4+Math.floor(rng()*4):2+Math.floor(rng()*3);
    for(let s=0;s<m;s++){ a+=(rng()-0.5)*1.2; const l=big?16+rng()*18:8+rng()*12, nx=px+Math.cos(a)*l, ny=py+Math.sin(a)*l; if(n4OkPt(nx,ny)!==L) break; px=nx; py=ny; P.push([px,py]); }
    if(P.length<2) continue;
    const br=big&&P.length>3?(()=>{ const k=1+Math.floor(rng()*(P.length-2)), ba=a+(rng()<0.5?1:-1)*(0.8+rng()*0.6), bl=10+rng()*14, bx=P[k][0]+Math.cos(ba)*bl, by=P[k][1]+Math.sin(ba)*bl; return n4OkPt(bx,by)===L?[P[k],[bx,by]]:null; })():null;
    const r2=rng(); let mk=null;
    if(b===42&&r2<0.2) mk={t:'clock',x:x+rng()*30-15,y:y+rng()*30-15,R:7+rng()*5};
    else if(b===43&&r2<0.35) mk={t:'frost',x:x+rng()*20-10,y:y+rng()*20-10,a:rng()*TAU};
    else if((b===44||b===45)&&r2<0.4) mk={t:'glint',x:x+rng()*20-10,y:y+rng()*20-10,R:1.6+rng()*1.4};
    if(mk&&n4OkPt(mk.x,mk.y)!==L) mk=null;
    cracks.push({P,br,lv:L,b,big,ember:b===41&&rng()<0.5,mk}); lvls.add(L);
  }
  N4FC.key=key; N4FC.geo={tris,cracks,lvls}; return N4FC.geo;
}
// facet tones by ring: [light rgb, light alpha, dark alpha, seam rgba, crack rgb, glow rgb]
const N4FT={40:['205,190,255',0.07,0.13,'8,4,20,.3','178,140,255','150,110,255'],41:['215,180,255',0.07,0.14,'6,2,14,.34','178,138,255','150,110,255'],
  42:['250,246,255',0.08,0.07,'40,30,70,.32','176,150,255','150,120,255'],43:['230,246,255',0.12,0.08,'40,70,120,.3','150,220,255','120,200,255'],
  44:['240,226,255',0.09,0.08,'40,24,80,.24','214,190,255','190,160,255'],45:['240,230,255',0.1,0.1,'20,12,40,.3','226,206,255','200,170,255'],
  47:['200,200,214',0.05,0.1,'20,20,30,.28','150,150,170','120,120,150']};
function n4PaintLvl(g,x0,y0,x1,y1,ch,L){
  if(y0<79800||y0>91000) return;
  const t0=n4Now(), G0=n4ChunkGeo(x0,y0); n4Pf('cgeo',t0); if(!G0.lvls.has(L)) return;
  const dawn=N4W.dawnK>=0.5; let gl=null; const GL=()=>gl||(gl=n4GlowCtx(ch,x0,y0));
  g.save(); g.lineCap='round'; g.lineJoin='round';
  // facets: a few lit, a few shadowed, all seamed; the lit ones get a bright edge toward the broken moon (north)
  for(const t of G0.tris){ if(t.lv!==L) continue; const F=N4FT[t.b]||N4FT[41], P=t.P;
    g.beginPath(); g.moveTo(P[0][0],P[0][1]); g.lineTo(P[1][0],P[1][1]); g.lineTo(P[2][0],P[2][1]); g.closePath();
    if(t.sand){ if(t.s>0.7){ g.fillStyle=`rgba(${F[0]},${F[1]*0.6})`; g.fill(); } continue; }
    if(dawn){ if(t.s>0.6){ g.fillStyle=`rgba(255,244,226,${0.06+(t.s-0.6)*0.2})`; g.fill(); } else if(t.s<0.3){ g.fillStyle='rgba(120,90,60,.07)'; g.fill(); } g.strokeStyle='rgba(120,96,80,.18)'; g.lineWidth=1; g.stroke(); continue; }
    if(t.s>0.6){ g.fillStyle=`rgba(${F[0]},${F[1]+(t.s-0.6)*0.18})`; g.fill(); }
    else if(t.s<0.32){ g.fillStyle=`rgba(4,2,12,${F[2]})`; g.fill(); }
    g.strokeStyle=`rgba(${F[3]})`; g.lineWidth=1.3; g.stroke();
    if(t.s>0.6){ let k=0, best=1e9; for(let e=0;e<3;e++){ const my=(P[e][1]+P[(e+1)%3][1])/2; if(my<best){ best=my; k=e; } }
      g.strokeStyle=`rgba(${F[0]},${0.18+(t.s-0.6)*0.5})`; g.lineWidth=1.4; g.beginPath(); g.moveTo(P[k][0],P[k][1]+1); g.lineTo(P[(k+1)%3][0],P[(k+1)%3][1]+1); g.stroke(); } }
  // cracks: dark bed, bright vein, glow (embers on the Ember Stair)
  const mine=G0.cracks.filter(c=>c.lv===L);
  const path=(q,c)=>{ q.beginPath(); c.P.forEach((p,i)=>i?q.lineTo(p[0],p[1]):q.moveTo(p[0],p[1])); if(c.br){ q.moveTo(c.br[0][0],c.br[0][1]); q.lineTo(c.br[1][0],c.br[1][1]); } };
  for(const c of mine){ const F=N4FT[c.b]||N4FT[41]; path(g,c);
    g.strokeStyle=dawn?'rgba(150,100,60,.22)':'rgba(6,2,14,.62)'; g.lineWidth=c.big?4.2:3; g.stroke();
    g.strokeStyle=dawn?'rgba(255,226,160,.95)':c.ember?'rgba(255,196,128,.96)':`rgba(${F[4]},.95)`; g.lineWidth=c.big?2:1.4; g.stroke();
    const m=c.mk; if(!m) continue;
    if(m.t==='clock'){ g.strokeStyle=dawn?'rgba(120,90,60,.45)':'rgba(70,56,120,.5)'; g.lineWidth=1.4; g.beginPath(); g.arc(m.x,m.y,m.R,0,TAU); g.stroke(); g.beginPath(); g.moveTo(m.x,m.y); g.lineTo(m.x,m.y-m.R*0.8); g.moveTo(m.x,m.y); g.lineTo(m.x+m.R*0.5,m.y-m.R*0.2); g.stroke(); }
    else if(m.t==='frost'){ g.strokeStyle=dawn?'rgba(255,255,255,.6)':'rgba(214,240,255,.55)'; g.lineWidth=1; g.beginPath(); for(let s=0;s<5;s++){ const sx=m.x+Math.cos(m.a)*s*4, sy=m.y+Math.sin(m.a)*s*4, l=6-s; g.moveTo(sx,sy); g.lineTo(sx+Math.cos(m.a+0.9)*l,sy+Math.sin(m.a+0.9)*l); g.moveTo(sx,sy); g.lineTo(sx+Math.cos(m.a-0.9)*l,sy+Math.sin(m.a-0.9)*l); } g.moveTo(m.x,m.y); g.lineTo(m.x+Math.cos(m.a)*20,m.y+Math.sin(m.a)*20); g.stroke(); }
    else n4Glint(g,m.x,m.y,m.R,dawn?'rgba(255,240,210,.85)':'rgba(230,216,255,.85)'); }
  if(mine.length&&!dawn){ const q=GL(); for(const c of mine){ const F=N4FT[c.b]||N4FT[41]; q.strokeStyle=c.ember?'rgba(255,150,80,.9)':`rgba(${F[5]},.8)`; q.lineWidth=c.big?9:6; path(q,c); q.stroke(); } }
  g.restore(); n4Pf('plvl',t0);
}
for(let L=0;L<=8;L++) ELEV.deco({k:4,bb:[0,79800,9000,91200],lvl:L,order:6,paint:(g,x0,y0,x1,y1,ch)=>n4PaintLvl(g,x0,y0,x1,y1,ch,L)});
// a moth sigil: rings, ticks, a moth with open wings in the middle
function n4Sigil(g,x,y,R,col,big,GL){
  g.save(); g.strokeStyle=col; g.fillStyle=col; g.lineWidth=big?3.2:2.4;
  g.beginPath(); g.arc(x,y,R,0,TAU); g.stroke(); g.lineWidth=big?2:1.6; g.beginPath(); g.arc(x,y,R*0.86,0,TAU); g.stroke();
  for(let i=0;i<24;i++){ const a=i/24*TAU, l=i%2?0.92:0.88; g.beginPath(); g.moveTo(x+Math.cos(a)*R*0.86,y+Math.sin(a)*R*0.86); g.lineTo(x+Math.cos(a)*R*l*1.07,y+Math.sin(a)*R*l*1.07); g.stroke(); }
  const s=R*0.42; g.lineWidth=big?3:2.2;
  for(const sd of [-1,1]){ g.beginPath(); g.moveTo(x,y-s*0.1); g.bezierCurveTo(x+sd*s*0.5,y-s*0.95,x+sd*s*1.25,y-s*0.7,x+sd*s*1.05,y-s*0.05); g.bezierCurveTo(x+sd*s*1.2,y+s*0.4,x+sd*s*0.55,y+s*0.75,x,y+s*0.2); g.stroke();
    g.beginPath(); g.arc(x+sd*s*0.62,y-s*0.32,s*0.16,0,TAU); g.stroke(); }
  g.beginPath(); g.ellipse(x,y,s*0.08,s*0.42,0,0,TAU); g.fill();
  g.restore();
  if(big&&N4W.dawnK<0.5){ const q=GL(); q.strokeStyle='rgba(170,140,255,.35)'; q.lineWidth=8; q.beginPath(); q.arc(x,y,R,0,TAU); q.stroke(); }
}
// the Midnight Clock's dial: a stone rim with big friendly numbers round an ink face (12 points away from the shrine)
function n4Dial(g,K,dawn){
  g.save();
  const rot=280, at=(h,R)=>{ const p=(rot+h*30)*N4D; return [K.x+Math.sin(p)*R,K.y-Math.cos(p)*R]; };
  g.strokeStyle=dawn?'rgba(250,240,230,.85)':'rgba(170,160,206,.9)'; g.lineWidth=40; g.beginPath(); g.arc(K.x,K.y,(K.r+K.rim)/2,0,TAU); g.stroke();
  g.strokeStyle='rgba(20,14,34,.85)'; g.lineWidth=3; g.beginPath(); g.arc(K.x,K.y,K.r,0,TAU); g.stroke(); g.beginPath(); g.arc(K.x,K.y,K.rim,0,TAU); g.stroke();
  // the walkable arcs of the rim (the 6 and the 9) are pale flagstones; the rest is set with glass teeth
  for(const [a0,a1] of [K.six,K.nine]){ g.strokeStyle=dawn?'rgba(255,250,240,.95)':'rgba(222,214,250,.95)'; g.lineWidth=34; g.beginPath(); g.arc(K.x,K.y,(K.r+K.rim)/2,(a0-90)*N4D,(a1-90)*N4D); g.stroke(); }
  g.fillStyle='rgba(30,22,52,.9)'; g.font=`700 30px ${UIF}`; g.textAlign='center'; g.textBaseline='middle';
  for(let h=1;h<=12;h++){ const [x,y]=at(h,(K.r+K.rim)/2); g.fillText(String(h),x,y); }
  g.strokeStyle='rgba(150,120,230,.6)'; g.lineWidth=2; for(let m=0;m<60;m++){ if(m%5===0) continue; const p=(rot+m*6)*N4D; g.beginPath(); g.moveTo(K.x+Math.sin(p)*(K.r-4),K.y-Math.cos(p)*(K.r-4)); g.lineTo(K.x+Math.sin(p)*(K.r-14),K.y-Math.cos(p)*(K.r-14)); g.stroke(); }
  g.fillStyle=dawn?'#e8dcf0':'#8a80b4'; g.beginPath(); g.arc(K.x,K.y,K.hub,0,TAU); g.fill(); g.strokeStyle='rgba(20,14,34,.9)'; g.lineWidth=3; g.stroke();
  g.fillStyle='#2a2244'; g.beginPath(); g.arc(K.x,K.y,10,0,TAU); g.fill();
  g.restore();
}
// the copy of the village green: a round lawn of black glass grass with a pale ring of stones
function n4Green(g,x,y,dawn){
  g.save(); g.fillStyle=dawn?'rgba(150,200,130,.55)':'rgba(70,80,104,.55)'; g.beginPath(); g.ellipse(x,y,250,170,0,0,TAU); g.fill();
  g.strokeStyle=dawn?'rgba(255,250,236,.8)':'rgba(170,160,210,.55)'; g.lineWidth=5; g.setLineDash([10,9]); g.beginPath(); g.ellipse(x,y,250,170,0,0,TAU); g.stroke(); g.setLineDash([]);
  const rng=mulberry32(4501); for(let i=0;i<60;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*0.9, px=x+Math.cos(a)*250*d, py=y+Math.sin(a)*170*d; sbTuft(g,px,py,dawn?'rgba(90,150,70,.7)':'rgba(120,110,160,.55)',0.9+rng()*0.4); }
  g.restore();
}
function n4Pad(g,x,y){ g.save(); g.fillStyle='rgba(10,6,20,.45)'; g.beginPath(); g.ellipse(x+3,y+4,46,26,0,0,TAU); g.fill(); g.fillStyle='#4a4066'; g.beginPath(); g.ellipse(x,y,44,24,0,0,TAU); g.fill(); g.fillStyle='#62577e'; g.beginPath(); g.ellipse(x-4,y-3,36,18,0,0,TAU); g.fill();
  g.strokeStyle='rgba(225,220,255,.85)'; g.lineWidth=3; for(const k of [0,1]){ g.beginPath(); g.moveTo(x-12,y+6-k*12); g.lineTo(x,y-4-k*12); g.lineTo(x+12,y+6-k*12); g.stroke(); } g.restore(); }
ELEV.deco({k:4,bb:[0,79800,9000,91200],lvl:98,order:9,paint:n4Paint});

// ================= 9. the map and everything placed on it
// lamp posts along the way (breathe on one: it burns for 30 s, a little warm light in all this dark)
const N4LAMPS=[[3600,89920],[5450,90020],
  [3760,3],[3700,62],[3700,93],[3470,106],[3470,131],[3470,157],[3560,191],[3700,222],[3700,252],[3760,283],[3700,312],[3700,341],
  [2720,214],[2800,251],[2860,314],[2860,341],[2860,30],[2760,63],[2760,86],[2860,142],[2860,172],
  [1980,120],[1900,162],[1880,178],[2000,210],[1950,292],[1950,340],[1950,6],[1950,52],[1950,82],
  [1190,88],[1190,166],[1190,198],[1190,228],[1190,248],[1260,288],[1190,320],[1190,350]];
// talkable frozen shadow people of Hearthold (Tier III)
const N4FOLK=[[1700,118],[2200,160],[1700,171],[2250,206],[1650,216],[2200,296],[1700,336],[2250,352],[1800,40],[2200,96]];
const N4FOLK_L=[S('...is it morning yet?','Is it morning?'),S('...I left the kettle on.','I left the kettle on.'),S('...the Great Hearth is warm. Come in.','Come in. It is warm.'),S('...have you seen my other mitten?','Where is my mitten?')];
// the silent copy of Emberhollow on Tier I's optional arc (houses with no doors, the forge with no fire, the well)
const N4RUINS=[{id:'gate',kind:'arch',x:776,y:84300},{id:'yara',kind:'house',x:650,y:84700,w:130,h:84,gaps:{e:1}},{id:'ash',kind:'house',x:1123,y:87150,w:120,h:84,gaps:{s:1},bed:[22,-8]},
  {id:'forge',kind:'forge',p:[3640,280],w:120,h:80,gaps:{s:1}},{id:'bakery',kind:'house',p:[3880,292],w:110,h:76},{id:'well',kind:'well',p:[3560,271]},
  {id:'h1',kind:'house',p:[3760,232],w:110,h:76,gaps:{s:1}},{id:'h2',kind:'house',p:[3640,322],w:110,h:76},{id:'c1',kind:'chimney',p:[3900,243]},{id:'c2',kind:'chimney',p:[3540,332]}];
function n4Build(B){
  N4W.built=true; N4W.B=B;
  // shrines (bible 3.6): black glass until touched
  for(const [id,x,y,nm,sm] of [['n_sh_foot',4880,89880,'Bridgefoot Shrine','Bridgefoot Shrine'],['n_sh_clock',3256,82860,'Clockstop Shrine','Clockstop Shrine'],['n_sh_rime',6403,84313,'Rime Shrine','Rime Shrine'],
    ['n_sh_glass',5003,86279,'Moonglass Shrine','Moonglass Shrine'],['n_sh_crown',3331,85875,'Crown Shrine','Crown Shrine']]) B.shrine({id,x,y,name:S(nm,sm)});
  // lamp posts (each a light whose strength follows the lamp; a small collider at the foot)
  for(const L of N4LAMPS){ let [x,y]=L.length===2&&L[1]>360?L:n4P(L[0],L[1]); for(let t=0;t<8&&(blockedAt(x,y)||n4HazAt(x,y));t++){ const a=Math.atan2(x-4500,y-85200); x+=Math.sin(a)*30; y+=Math.cos(a)*30; }
    if(blockedAt(x,y)) continue; const o={x,y,lit:0,id:'nl'+N4W.lamps.length}; o.L=B.light({x,y:y-40,r:230,i:0,lamp:true}); o.col=addCol({t:'c',x,y,r:6,low:true}); N4W.lamps.push(o); }
  // ruins of the silent copy of Emberhollow
  for(const R of N4RUINS){ const o=Object.assign({},R); if(R.p){ const q=n4P(R.p[0],R.p[1]); o.x=q[0]; o.y=q[1]; } o.base=o.y+(o.h?o.h/2:4); N4W.objs.push(Object.assign(o,{k:'ruin'}));
    if(o.kind==='house'||o.kind==='forge'){ const w=o.w, h=o.h, G2=o.gaps||{}; addCol({t:'r',x0:o.x-w/2,y0:o.y-h/2-8,x1:o.x+w/2,y1:o.y-h/2+4});
      for(const s of [-1,1]){ const gx=s<0?'w':'e', xx=o.x+s*(w/2-2); if(G2[gx]){ addCol({t:'r',x0:xx-5,y0:o.y-h/2,x1:xx+5,y1:o.y-h/2+h*0.3}); addCol({t:'r',x0:xx-5,y0:o.y+h*0.18,x1:xx+5,y1:o.y+h/2}); } else addCol({t:'r',x0:xx-5,y0:o.y-h/2,x1:xx+5,y1:o.y+h/2}); }
      if(G2.s){ addCol({t:'r',x0:o.x-w/2,y0:o.y+h/2-10,x1:o.x-w/2+w*0.36,y1:o.y+h/2}); addCol({t:'r',x0:o.x+w/2-w*0.36,y0:o.y+h/2-10,x1:o.x+w/2,y1:o.y+h/2}); } else addCol({t:'r',x0:o.x-w/2,y0:o.y+h/2-10,x1:o.x+w/2,y1:o.y+h/2}); }
    else if(o.kind==='arch'){ addCol({t:'r',x0:o.x-46,y0:o.y-8,x1:o.x-28,y1:o.y+10}); addCol({t:'r',x0:o.x+28,y0:o.y-8,x1:o.x+46,y1:o.y+10}); }
    else addCol({t:'c',x:o.x,y:o.y,r:o.kind==='well'?20:11}); }
  // the frozen shadow people (talk to them)
  N4FOLK.forEach(([r,a],i)=>{ const [x,y]=n4P(r,a); if(blockedAt(x,y)) return; const o={k:'folk',x,y,v:i%3,base:y,i}; N4W.objs.push(o); addCol({t:'c',x,y,r:10});
    B.landmark({id:'n_folk_'+i,k:'n4w',x,y:y-6,r:0,clr:50,noNudge:true,prompt:S('Say hi','Say hi'),draw:()=>{},act:()=>n4FolkTalk(o)}); });
  // the Glass Dunes: sand gaps so a burrower passes under the walls of M2's pit and pane 6's spike ring
  if(typeof p4Add==='function'){ try{ const m=N4G.m2, q=N4G.pane6; p4Add('sandgap',{id:'n_m2_gap',x0:m[0]-96,y0:m[1]-96,x1:m[0]+96,y1:m[1]+96}); p4Add('sandgap',{id:'n_pane6_gap',x0:q[0]-88,y0:q[1]-88,x1:q[0]+88,y1:q[1]+88}); }catch(e){ console.error('n4w sandgap',e); } }
  // chests on the peak stay on the main ring floors (see n4ChestOK); scatterChests runs after this build
  n4NoPropZones();
}
// where no trees, shards or coral grow (arenas, courts, puzzle floors; the spike walls still grow their shards)
function n4NoPropZones(){
  const Z=N4W.noProp, d=(x,y,r)=>Z.push({d:[x,y,r]}), s=(r0,r1,a0,a1)=>Z.push({s:[r0,r1,a0,a1]});
  d(4500,89650,330); d(4500,89240,180); d(5250,89720,280); d(3760,89560,140); d(4880,89880,110);
  for(const E of [N4G.echo1,N4G.echo2,N4G.echo3,N4G.echo4]) d(E.x,E.y,E.r+40);
  d(N4G.summit.x,N4G.summit.y,900); d(N4G.clock.x,N4G.clock.y,480); d(N4G.tide.x,N4G.tide.y,N4G.tide.r+70); d(N4G.sky.x,N4G.sky.y,N4G.sky.r+50);
  d(N4G.launch[0],N4G.launch[1],120); d(N4G.ventT[0],N4G.ventT[1],120); d(N4G.ventC[0],N4G.ventC[1],140);
  s(3300,4140,112.5,129.5); s(3300,4140,63,68); s(3300,4140,72,88); s(3300,4140,170.5,173.5); s(2330,3370,258,308); s(2330,3370,326,337); s(2330,3370,342,26); s(2330,3370,94,120);
  s(1440,2460,122,154); s(1440,2460,172,206); s(1440,2460,225,292); s(1440,2460,14,28); s(860,1540,30,92); s(840,1540,155,168); s(1200,1560,295,305);
  d(N4G.m2[0],N4G.m2[1],130); d(N4G.pane6[0],N4G.pane6[1],120); d(N4G.dam.ledge[0]+200,N4G.dam.ledge[1]+60,260);
}
function n4NoPropAt(x,y){ let r=-1, a=-1; for(const z of N4W.noProp){ if(z.d){ if(n4InD(x,y,z.d[0],z.d[1],z.d[2])) return true; } else { if(r<0){ r=Math.hypot(x-4500,y-85200); a=n4Ang(x,y); } const q=z.s; if(r>=q[0]&&r<=q[1]&&n4In(a,q[2],q[3])) return true; } } return false; }
// what grows where: glass spike hedges on every wall, then each ring's own things
function n4Props(rng,x,y,s,grove,b){
  if(s.spike) return rng()<0.86?{k:'n_shard',v:n4Pick(rng,4),s:0.8+rng()*0.55}:null;
  if(s.ink||s.void||s.nsea||s.deck) return null;
  if(N4W.dawnK>=0.5){ return rng()<0.07?{k:'n_dawnflower',v:n4Pick(rng,3),s:0.9+rng()*0.4}:null; }
  if(n4NoPropAt(x,y)) return null;
  const r=rng(), inWood=b===44&&(()=>{ const a=n4Ang(x,y); return a>=170&&a<=245; })(), cradle=b===47&&Math.hypot(x-4500,y-85200)<1600;
  if(cradle){ if(r<0.08) return {k:'n_cocoon',v:n4Pick(rng,3),s:0.9+rng()*0.6}; if(r<0.1) return {k:'n_glasscoral'}; return null; }
  switch(b){
    case 40: if(r<0.012) return {k:'n_glasstree',v:n4Pick(rng,4)}; if(r<0.02) return {k:'n_shard',v:n4Pick(rng,4),s:0.6+rng()*0.4}; return null;
    case 41: if(grove>0.3&&r<0.04) return {k:'n_glasstree',v:n4Pick(rng,4),s:0.85+rng()*0.35}; if(r<0.006) return {k:'n_glasstree',v:n4Pick(rng,4)}; if(r<0.014) return {k:'n_shard',v:n4Pick(rng,4),s:0.6+rng()*0.5}; if(r<0.019) return {k:'n_cocoon',v:n4Pick(rng,3)}; return null;
    case 42: if(r<0.007) return {k:'n_clock',v:n4Pick(rng,2)}; if(r<0.017) return {k:'n_gear',v:n4Pick(rng,2),s:0.7+rng()*0.5}; if(r<0.024) return {k:'n_shard',v:n4Pick(rng,4),s:0.6+rng()*0.4}; return null;
    case 43: if(grove>0.22&&r<0.045) return {k:'n_icefang',v:n4Pick(rng,3),s:0.8+rng()*0.5}; if(r<0.018) return {k:'n_icefang',v:n4Pick(rng,3)}; if(r<0.024) return {k:'n_shard',v:n4Pick(rng,4),s:0.6+rng()*0.4}; return null;
    case 44: if(inWood) return r<0.2?{k:'n_tendril',v:n4Pick(rng,2),s:0.8+rng()*0.6}:r<0.23?{k:'n_cocoon',v:n4Pick(rng,3)}:null;
      if(s.sand>0.5) return r<0.01?{k:'n_glasscoral',v:n4Pick(rng,3)}:null;
      if(r<0.03) return {k:'n_tendril',v:n4Pick(rng,2)}; if(r<0.04) return {k:'n_glasscoral',v:n4Pick(rng,3)}; if(r<0.045) return {k:'n_mirror',v:n4Pick(rng,2)}; if(r<0.052) return {k:'n_cocoon',v:n4Pick(rng,3)}; return null;
    case 47: if(r<0.014) return {k:'n_glasstree',v:n4Pick(rng,4)}; if(r<0.02) return {k:'n_shard',v:n4Pick(rng,4),s:0.6+rng()*0.4}; return null;
  }
  return null;
}
// the n_ terrain data for defineMap: moonwater rivers and ponds, islets; ink, void, spikes and the sea come from extra/block
const N4TERR={seeds:[[4500,85200,41]],roads:[],
  rivers:[{pts:N4G.river,w:120}],
  lakes:[],
  ponds:[{x:5250,y:89720,r:240},{x:N4G.tide.x,y:N4G.tide.y,r:N4G.tide.r},{x:N4G.echo1.moat[0],y:N4G.echo1.moat[1],r:N4G.echo1.moat[2],inner:N4G.echo1.moat[3]}].concat(N4G.lagoon.map(p=>({x:p[0],y:p[1],r:330}))),
  isles:[{x:5250,y:89720,r:70},{x:N4G.tide.x,y:N4G.tide.y,r:N4G.tide.eye}],
  walkways:[],
  extra:n4Extra, block:n4Block};
// the moonfire bridge both ways (bible 3.5; the Moonfall end sits at the end of the Moon Pier, ACT4.md 3.6)
const N4X_IN={id:'n_bridge_in',x:13700,y:65450,to:{x:4500,y:90800},kind:'bridge',dir:0,clear:120,
  label:S('Cross the moonfire bridge','Cross the bridge'),name:S('The Moonfire Bridge','The Moonfire Bridge'),
  need:()=>n4Reached('n_bridge')||n4F('n_bridge_open'),locked:S('The bridge is only a shimmer. Not yet.','It is not ready yet.'),
  hidden:()=>!(n4Reached('n_bridge')||n4F('n_bridge_open')),arrive:S('Black glass all the way up, and not one bird.','It is so quiet here.'),
  onTravel(){ for(const f of N4W.onBridge||[]) try{ f(); }catch(e){ console.error(e); } if(!(N4W.onBridge&&N4W.onBridge.length)&&G&&!G.flags.n_depart) G.flags.n_depart=1; }};
const N4X_OUT={id:'n_bridge_out',x:4500,y:90900,to:{x:13450,y:65450},kind:'bridge',dir:Math.PI/2,clear:60,
  label:S('Cross back to Moonfall','Go back to Moonfall'),name:S('The Moonfire Bridge','The Moonfire Bridge'),arrive:S('Real wind again, with salt in it. It feels like a hug.','The wind feels nice.')};
// Act IV's world module may still be the placeholder: its test bridge (12800,65400) gives way to the real one
if(MAPS[3]&&MAPS[3].placeholder&&MAPS[3].crossings) MAPS[3].crossings=MAPS[3].crossings.filter(c=>c.id!=='pm_bridge_3');
defineMap(4,{id:'nightfall',name:S('Nightfall Peak','Nightfall Peak'),w:9000,h:11000,music:'n_ascent',spawn:{x:4500,y:90800},chests:12,
  ambient:{night:0.2,wind:0.3,birds:false,mist:0,rain:0,thunder:false},sky:{tint:'#b04a8c',k:0.22},
  terrain:N4TERR,
  onEnter(from){ n4Sync(true); },
  build(B){ n4Build(B); },
  crossings:[N4X_IN,N4X_OUT]});

// ================= 10. the engine hooks (map 4 only; every other map passes straight through)
// the region, music and ambience of a point follow the forced biome (not the Voronoi seeds)
const N4BI={};
{ const base=biomeInfo; biomeInfo=function(x,y,o){ if(y>=79800&&y<=91200&&x<IZX-50&&MAPS[4]&&!MAPS[4].placeholder){ o=o||{}; n4Feat(x,y,N4BI); N4BI.b=0; n4BiomeOf(x,y,N4BI); o.b=N4BI.b; o.b2=N4BI.b2; o.t=N4BI.t; return o; } return base(x,y,o); }; }
// no world events on the peak (no kittens, goats or snowball fights in the Night Mother's mountain)
{ const base=evPick; evPick=function(c){ if(c&&c.b>=40&&c.b<=49) return []; return base(c); }; }
// flight: wings work only in calm zones, in a vent's updraft, on a wind stream, over a boss fight that allows it,
// and everywhere after the dawn
function n4FlyOK(){
  const p=player; if(!p) return true;
  if(N4W.dawnK>=1) return true;
  if(typeof P3!=='undefined'&&P3&&(P3.ride||(P3.mv&&P3.mv.kind==='hop'))) return true;
  if((p.elvVentT||0)>0||ELEV.ventAt(p.x,p.y)) return true;
  const b=G&&G.bf; if(b&&b.d&&b.d.flyOK&&G.boss&&!G.boss.dead) return true;
  return !!n4CalmAt(p.x,p.y,true);
}
function n4NoFlyNote(){
  const p=player; if(p.flying) return;
  const dblLeft=typeof hasDbl==='function'&&hasDbl()&&!p.dbl;
  if(!((MV.jumpBuf>0||MV.holdT>0.3)&&p.z>0&&!dblLeft)) return;
  MV.noFlyT=Math.max(MV.noFlyT||0,2);
  if(G.time-N4W.msgT<20) return; N4W.msgT=G.time;
  const t=S('The moon-wind is too strong to fly here.','The wind is too strong to fly.');
  ftext(p.x,p.y-(p.z||0)-34,t,'#e0d0ff',13);
  try{ mvTip(S('No flying','No flying'),t+' '+S('Look for calm air: soft silver motes drift where your wings will work.','Look for the silver sparkles. You can fly there.'),7,'n4w_nofly'); }catch(e){}
}
{ const base=canFlyHere; canFlyHere=function(){ const r=base.apply(this,arguments); if(!r||!n4Map4()) return r; if(n4FlyOK()) return true; n4NoFlyNote(); return false; }; }
// landing a jump in ink or void (the dawn turns the ink into plain moonwater); moon-glass and the dive keep p4's rules
{ const base=landBad; landBad=function(x,y){
  if(y>=79900&&y<=91100&&x<IZX-50&&!outOfMap(x,y,30)&&MAPS[4]&&!MAPS[4].placeholder){
    if(typeof p4GlassSolidAt==='function'&&typeof P4!=='undefined'&&P4.glass.length&&p4GlassSolidAt(x,y)) return base(x,y);
    const h=n4HazAt(x,y); if(h) return h; }
  return base(x,y); }; }
// in the air, spike walls, the sea and the deep voids (n4AirBlock) still stop Ash: no jumping over a wall or the moat
{ const base=playerBlocked; playerBlocked=function(x,y){
  const p=player;
  if(p&&(p.flying||(p.z||0)>0)&&y>=79900&&y<=91100&&x<IZX-50&&n4AirBlock(x,y)&&!(typeof p4GlassSolidAt==='function'&&typeof P4!=='undefined'&&P4.glass.length&&p4GlassSolidAt(x,y))){ if(G&&N4AO.void&&!N4AO.spike){ N4W.airHit=G.time; N4W.airX=x; N4W.airY=y; } return true; }
  return base(x,y); }; }
// ink: a splash of shadow, 10 percent of max health (Easy 6, Hard 14), and a hop back; void: a whoosh, the same cost
const N4SAFE=[];
function n4SafeSpot(p,x,y){
  let sx=p.safeX, sy=p.safeY;
  const ok=(a,b)=>a!=null&&dist(a,b,x,y)<900&&!playerBlocked(a,b)&&!n4HazAt(a,b);
  if(ok(sx,sy)) return [sx,sy];
  for(let i=N4SAFE.length-1;i>=0;i--){ const s=N4SAFE[i]; if(ok(s[0],s[1])) return s; }
  const s=nearestLand(x,y); return s?[s.x,s.y]:null;
}
{ const base=backToSafe; backToSafe=function(p,bad){
  if(bad!=='ink'&&bad!=='void') return base(p,bad);
  const x=p.x, y=p.y;
  if(bad==='ink'){ n4Snd('ink'); emit(x,y,22,{col:'60,30,110',glow:false,ang:-Math.PI/2,spread:1.3,smin:60,smax:200,lmin:.3,lmax:.7,zmin:2,zmax:4,drag:2,rise:-160}); emit(x,y,10,{col:'170,120,255',smin:30,smax:120,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); ftext(x,y-26,S('Ink!','Ink!'),'#c8a8ff',14); }
  else { n4Snd('void'); emit(x,y,18,{col:'190,160,255',ang:Math.PI/2,spread:0.5,smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3,drag:1}); ftext(x,y-26,S('Whoosh!','Whoosh!'),'#d8c8ff',14); }
  p.z=0; p.vz=0; p.flying=false; p.landing=false; p.gliding=false;    // on the ground first, so the safe-spot test is a walker's
  const s=n4SafeSpot(p,x,y); if(s){ p.x=s[0]; p.y=s[1]; }
  p.avx=p.avy=0; p.kvx=p.kvy=0; MV.hover=null; MV.lx=p.x; MV.ly=p.y;
  emit(p.x,p.y,12,{col:'200,180,255',smin:30,smax:100,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
  const pct=[0.06,0.10,0.14][n4Diff()], a=(p.stats&&p.stats.armor)||1, dm=G.diff?G.diff.dmg:1;
  p.iframes=0; HURT_SRC='lava'; hurtPlayer(p.maxHp*pct/Math.max(0.01,dm*a),x,y,0); HURT_SRC='';
  p.iframes=Math.max(p.iframes,0.8); N4W.lastHaz={kind:bad,t:G.time,x,y};
}; }
// the dawn: ink pools are plain moonwater (Water Stride walks them, Dive swims them, walkers stay out)
{ const base=mapBlocked; mapBlocked=function(x,y){ if(N4W.dawnK>=0.5&&y>=79900&&y<=91100){ n4Feat(x,y,N4BO); if(N4BO.ink&&!N4BO.nsea&&!N4BO.void&&!N4BO.spike){ const Z=MAPS[4]&&MAPS[4].tz; if(Z&&Z.walkways.some(w=>x>=w.x0&&x<=w.x1&&y>=w.y0&&y<=w.y1)) return false; return true; } } return base(x,y); }; }
{ const base=mapStrideBlocked; mapStrideBlocked=function(x,y){ if(N4W.dawnK>=0.5&&y>=79900&&y<=91100){ n4Feat(x,y,N4BO); if(N4BO.ink&&!N4BO.nsea&&!N4BO.void&&!N4BO.spike) return false; } return base(x,y); }; }
// the light on the peak: no day and night until the ending; the dark is the map's (0.42 plus the biome's night)
function n4NearLight(){ const p=player; for(const L of N4W.lamps) if((L.lit>0||N4W.dawnK>=1)&&dist2(p.x,p.y,L.x,L.y)<260*260) return true; for(const s of mapList(SHRINES,4)) if(G.shrines[s.id]&&dist2(p.x,p.y,s.x,s.y)<260*260) return true; return false; }
{ const base=mapNight; mapNight=function(){
  const v=base(); if(!n4Map4()) return v;
  const K=N4W.dawnK>0?N4W.dawnK:0; if(K>=1) return v;
  const a=ambHere(), want=0.31+(a&&a.night||0)*0.9-(n4NearLight()?0.06:0), dl=daylight();
  return lerp(want-(1-dl)*0.46,v,K); }; }
{ const base=moonGlowK; moonGlowK=function(){ if(n4Map4()&&N4W.dawnK<1) return (n4Diff()>=2?330:380)/300; return base(); }; }
// glowing cracks shine through the dark (the chunk glow layers become light, as lava does)
{ const base=mapLavaGlow; mapLavaGlow=function(){ if(n4Map4()&&N4W.dawnK<0.5&&!N4W.noGlow) return true; return base(); }; }
// birds come back at dawn
const N4AMB_DAWN={wind:0.2,birds:true,night:0,rain:0,mist:0,snow:0};
{ const base=ambHere; ambHere=function(){ const a=base(); if(a&&N4W.dawnK>=1&&n4Map4()) return N4AMB_DAWN; return a; }; }
// no dreams up here (bible 3.6)
{ const base=dreamHook; dreamHook=function(kind){ if(G&&G.mode==='story'&&curMap()===4&&!n4Reached('n_end')){ if(kind==='shrine'&&!G.flags.n_nodream){ G.flags.n_nodream=1; later(1.2,()=>{ try{ setBanner(S('No dreams','No dreams'),S('No dreams up here. The peak eats them.','No dreams here.'),3); }catch(e){} }); } return; } return base(kind); }; }
// chests on the peak stay on the ring floors (never on a puzzle island, a shelf, an arena or the summit)
function n4ChestOK(x,y){
  const r=Math.hypot(x-4500,y-85200), lv=elevLvl(x,y);
  if(r<1500) return false;
  if(n4NoPropAt(x,y)) return false;
  const want=r>4100?[0]:r>3300?[1,2]:r>2400?[3,4]:[5,6]; if(!want.includes(lv)) return false;
  for(const f of N4FE){ if(f.k!=='ink'&&f.k!=='void'&&f.k!=='spike') continue; const b=f.bb; if(x>b[0]-60&&x<b[2]+60&&y>b[1]-60&&y<b[3]+60){ n4Feat(x,y,N4BO); if(N4BO.ink||N4BO.void||N4BO.spike) return false; } }
  const C=N4G.crystal; if(dist(x,y,C[0],C[1])<120) return false;
  return !blockedAt(x,y);
}
{ const base=scatterChests; scatterChests=function(M){ base(M); if(!M||M.k!==4) return; for(let i=CHESTS.length-1;i>=0;i--){ const c=CHESTS[i]; if(itemMap(c)===4&&/^m4ch/.test(c.id)&&!n4ChestOK(c.x,c.y)) CHESTS.splice(i,1); } }; }
// breathe on a lamp post: it burns for 30 s
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){ base(mx,my,ang,dt); try{ if(AREA||curMap()!==4) return; for(const L of N4W.lamps){ if(L.lit>1||dist2(mx,my,L.x,L.y)>260*260) continue; if(!inArcC(mx,my,ang,175,0.45,{x:L.x,y:L.y-30,r:16})) continue; if(L.lit<=0){ n4Snd('lamp'); emit(L.x+9,L.y-34,14,{col:'255,210,120',ang:-Math.PI/2,spread:1,smin:20,smax:80,lmin:.4,lmax:.8,zmin:1.5,zmax:3}); } L.lit=30; } }catch(e){ console.error('n4w lamp',e); } }; }
// talk to a shadow person: one of four memories, each once, then a shiver
function n4FolkTalk(o){
  const seen=G.flags.n_folk_said|0, left=[0,1,2,3].filter(i=>!(seen&(1<<i)));
  if(!left.length){ setBanner(S('A shadow person','A shadow person'),S('It does not move. It is only a memory.','It is only a memory.'),2.4); return; }
  const i=left[(o.i*7+seen)%left.length]; G.flags.n_folk_said=seen|(1<<i);
  setBanner(S('A shadow person','A shadow person'),N4FOLK_L[i],3.2); n4Snd('chime',0.5);
}

// ================= 11. the world's own state (flags read every frame), dynamic terrain, chunk refresh
function n4Redraw(boxes){
  const all=boxes.includes('all');
  for(const [key] of [...CHUNKS]){ const cx=Math.floor(key/1000), cy=key-cx*1000; if(mapAt(cy*CH+CH/2)!==4) continue;
    if(all||boxes.some(b=>b!=='all'&&(cx+1)*CH>=b[0]&&cx*CH<=b[2]&&(cy+1)*CH>=b[1]&&cy*CH<=b[3])) CHUNKS.delete(key); }
  for(const [key,arr] of [...PROPS]){ const cx=Math.floor(key/1000), cy=key-cx*1000; if(mapAt(cy*CH+CH/2)!==4) continue;
    if(all||boxes.some(b=>b!=='all'&&(cx+1)*CH>=b[0]-60&&cx*CH<=b[2]+60&&(cy+1)*CH>=b[1]-60&&cy*CH<=b[3]+60)){ for(const p of arr) if(p.col) removeCol(p.col); PROPS.delete(key); } }
  const O=MAPS[4]&&MAPS[4].ov; if(O){ let r0=O.h; for(const b of boxes) r0=Math.min(r0,b==='all'?0:Math.max(0,Math.floor((b[1]-O.y0)/O.s))); O.row=Math.min(O.row,r0); O.done=false; }
  try{ placeholderCol.clear(); }catch(e){}
  if(G) G.chunkBurst=Math.max(G.chunkBurst||0,6);
}
const N4DYN=[
  {flag:'n_bridge1',bb:n4BB(n4Sec(3150,4260,51.5,60),20)},
  {flag:'n_dam',bb:n4BB(n4Sec(1440,2460,181,199),20)},
  {flag:'n_lagoon',bb:n4BB(n4Sec(820,1560,60,100),20),set:on=>n4LagoonSet(on)}];
function n4LagoonSet(on){ const Z=MAPS[4]&&tzOf(MAPS[4]); if(!Z) return; Z.ponds=Z.ponds.filter(p=>!p.n4up); if(on) for(const u of N4G.lagoonUp) Z.ponds.push({x:u.p[0],y:u.p[1],r:u.r,n4up:1}); }
// the Wind Chimney's updraft is there once the first echo is beaten
function n4VentSet(on){ const E=ELEV.map(4); if(!E) return; const has=E.vents.find(v=>v.n4c); if(on===!!has) return;
  if(on) E.vents.push({x:N4G.ventC[0],y:N4G.ventC[1],r:80,lift:0,lvl:2,i:E.vents.length,n4c:1}); else E.vents.splice(E.vents.indexOf(has),1);
  n4Redraw([[N4G.ventC[0]-160,N4G.ventC[1]-160,N4G.ventC[0]+160,N4G.ventC[1]+160]]); }
// the Tide Court: high 4 s (Easy 6), low 4 s; stepping stones are ground at low tide (x4_ascent may drive it instead)
function n4TideSet(high){ const T=N4W.tide; if(T.high===high&&T.init) return; T.init=true; T.high=high; const Z=MAPS[4]&&tzOf(MAPS[4]); if(!Z) return;
  Z.walkways=Z.walkways.filter(w=>!w.n4tide);
  if(!high) for(const [r,a] of N4G.tide.stones){ const [x,y]=n4P(r,a); Z.walkways.push({x0:x-22,y0:y-22,x1:x+22,y1:y+22,n4tide:1}); }
  const p=player; if(high&&p&&!p.flying&&!(p.z>0)&&curMap()===4&&dist(p.x,p.y,N4G.tide.x,N4G.tide.y)<N4G.tide.r&&!canWalkWater()&&T0water(p.x,p.y)){ backToSafe(p,'water'); } }
const T0water=(x,y)=>!!T(x,y,{}).water;
// the dawn: quantized so the ground is redrawn a few times while it brightens
function n4DawnSet(K){
  if(K===N4W.dawnK) return; const was=N4W.dawnK; N4W.dawnK=K;
  const E=ELEV.map(4);
  if(E) for(const P of E.plats){ if(!P.S0) P.S0=Object.assign({},P.S); const D=N4DAWN_STY[P.style]; if(!D) continue;
    for(const f of ['face','lit','dark','lip','out']) if(D[f]&&P.S0[f]) P.S[f]=K<=0?P.S0[f]:'#'+mixRGB(hexRGB(P.S0[f]),hexRGB(D[f]),K).map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join(''); }
  if(MAPS[4]){ MAPS[4].name=K>=1?S('Dawnlight Peak','Dawnlight Peak'):S('Nightfall Peak','Nightfall Peak'); MAPS[4].sky=K>=1?{tint:'#ffd0b0',k:0.08}:{tint:'#b04a8c',k:0.22}; try{ if(MAPUI.tabs) MAPUI.tabs.dataset.maps=''; }catch(e){} }
  if(was>=0) n4Redraw(['all']);
}
function n4Sync(force){
  if(!G||!G.flags||!N4W.built) return;
  const boxes=[];
  for(const d of N4DYN){ const v=n4F(d.flag); if(force||v!==N4W.dynF[d.flag]){ const ch=N4W.dynF[d.flag]!==undefined&&v!==N4W.dynF[d.flag]; N4W.dynF[d.flag]=v; if(d.set) d.set(v); if(ch) boxes.push(d.bb); } }
  n4VentSet(n4EchoDone(1));
  const K=Math.round(n4Dawn()*4)/4; if(force||K!==N4W.dawnK) n4DawnSet(K);
  if(boxes.length) n4Redraw(boxes);
  // Juniper's Peak Map shows the outline of the peak and the five shrine spots
  if(G.items&&G.items.n_map&&!G.flags.n_map_seen){ G.flags.n_map_seen=1; for(let a=0;a<360;a+=3){ const [x,y]=n4P(4100,a); fogReveal(x,y,260); } for(const s of mapList(SHRINES,4)) fogReveal(s.x,s.y,320); fogReveal(4500,89700,700); }
}
// the life of the peak: the held night, lightning, lamps, tinks, drops, hazards that move, the glide rule, the tide
function n4Life(dt){
  const p=player; if(!p||!G) return;
  N4W.t+=dt;
  if(!n4Map4()) return;
  const K=N4W.dawnK, a=ambHere()||{}, dn=n4Dawn();
  // the held night; the dawn brings the morning with it (then the day runs on as anywhere else)
  if(dn<1){ G.tod=0.02+0.25*dn; N4W.dawnTod=0; } else if(!N4W.dawnTod){ N4W.dawnTod=1; if(G.tod<0.27||G.tod>0.75) G.tod=0.27; }
  // remember a few safe spots (a fall from the sky hops back to the last one)
  if(!p.flying&&!(p.z>0)&&!p.hop&&p.safeX!=null){ const L=N4SAFE[N4SAFE.length-1]; if(!L||dist2(L[0],L[1],p.safeX,p.safeY)>120*120){ N4SAFE.push([p.safeX,p.safeY]); if(N4SAFE.length>12) N4SAFE.shift(); } }
  // violet lightning: a silent flash, then a low rumble
  if(K<0.5){ const F=N4W.flash; F.t-=dt; if(F.t<=0){ F.t=rand(8,14); flashA=Math.max(flashA,0.26); flashCol='176,132,255'; F.rum=0.6; } if(F.rum>0){ F.rum-=dt; if(F.rum<=0) n4Snd('rumble'); } }
  // lamps
  for(const L of N4W.lamps){ if(L.lit>0) L.lit=Math.max(0,L.lit-dt); const on=K>=1?1:L.lit>0?Math.min(1,L.lit/2):0; L.L.i=on*0.8; }
  // glass underfoot
  if(p.moving&&!p.flying&&!(p.z>0)&&K<1){ N4W.tinkT=(N4W.tinkT||0)-dt*(p.sprinting?1.6:1); if(N4W.tinkT<=0){ N4W.tinkT=0.34; n4Snd('tink',0.8); } }
  // ash, and violet-orange embers on the Ember Stair
  const vx=cam.x, vy=cam.y, vw=W/zoom, vh=H/zoom;
  if(K<0.5){ const ash=(a.n4ash||0.12); if(Math.random()<dt*10*ash) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:'92,80,118',glow:false,ang:0.5,spread:0.4,smin:14,smax:40,lmin:3,lmax:5,zmin:1.2,zmax:2.4,drag:0.05,alpha:0.8});
    if(a.n4emb&&Math.random()<dt*12*a.n4emb) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:Math.random()<0.5?'255,130,90':'190,120,255',ang:-Math.PI/2,spread:0.8,smin:10,smax:34,lmin:2,lmax:4,zmin:0.8,zmax:1.6,drag:0.1,rise:4}); }
  // the one-way drops at the end of each optional arc
  n4Drops(dt);
  // a jump into the deep void's wind: pushed back, with a word the first time in a while
  if(N4W.airHit!=null&&G.time-N4W.airHit<0.12&&(p.z>0||p.flying)&&G.time-(N4W.airMsgT||-99)>6){ N4W.airMsgT=G.time;
    ftext(p.x,p.y-(p.z||0)-34,S('The void wind pushes you back!','The wind pushes you back!'),'#d8c8ff',13); n4Snd('void',0.5);
    emit(N4W.airX,N4W.airY,10,{col:'200,180,255',ang:Math.atan2(p.y-N4W.airY,p.x-N4W.airX),spread:0.6,smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3,drag:2}); }
  // hazards that come and go (ink falls, the flooded summit): Ash on the ground in one is hopped back
  if(N4W.haz.length&&!p.flying&&!(p.z>0)&&!p.hop&&!p.dead&&!(typeof P4!=='undefined'&&P4.mode)){ const h=n4DynHaz(p.x,p.y); if(h&&!(typeof p4GlassSolidAt==='function'&&P4.glass.length&&p4GlassSolidAt(p.x,p.y))) backToSafe(p,h); }
  // leaving calm air in flight: glide straight down; over ink or void that is a fall
  if(p.flying&&!n4FlyOK()){ if(!p.landing&&!p.gliding) p.landing=true; const k=Math.exp(-dt*5); p.avx*=k; p.avy*=k;
    if(p.z<16&&!(typeof P3!=='undefined'&&P3.ride)){ const h=n4HazAt(p.x,p.y); if(h&&!(typeof p4GlassSolidAt==='function'&&P4.glass.length&&p4GlassSolidAt(p.x,p.y))) backToSafe(p,h); } }
  // the tide
  const T=N4W.tide; if(!T.ext){ T.t+=dt; const hi=n4Diff()===0?6:4, per=hi+4, ph=T.t%per; n4TideSet(ph<hi); }
}
function n4Drops(dt){
  const p=player; if(p.flying||(p.z||0)>0||p.hop||p.dead) { N4W.dropT=0; return; }
  const ml=Math.hypot(p.inMx||0,p.inMy||0); if(ml<0.4){ N4W.dropT=0; return; }
  const mx=p.inMx/ml, my=p.inMy/ml, ax=p.x+mx*14, ay=p.y+my*14;
  if(!(elevFace(ax,ay)&1)){ N4W.dropT=0; return; }
  const r=Math.hypot(ax-4500,ay-85200), a=n4Ang(ax,ay), lv=elevLvl(p.x,p.y);
  for(const D of N4W.drops){ const s=D.sec; if(lv!==D.from||r<s[0]||r>s[1]||!n4In(a,s[2],s[3])) continue;
    N4W.dropT=(N4W.dropT||0)+dt; if(N4W.dropT<0.08) return;
    const t=ELEV.findHop(p.x,p.y,mx,my,'down'); if(t&&t.l===D.to){ N4W.dropT=0; ELEV.hopTo(t.x,t.y,'down'); } return; }
  N4W.dropT=0;
}
// a tiny profiler for the per-frame hooks (off unless a test turns it on: __ebX.n4w.prof)
const N4PF={on:false,ms:{},n:0};
function n4Now(){ return N4PF.on?(window.__realNow?window.__realNow():performance.now()):0; }
function n4Pf(k,t0){ if(N4PF.on) N4PF.ms[k]=(N4PF.ms[k]||0)+n4Now()-t0; }
{ const base=update; update=function(dt){ let t0=n4Now(); try{ n4Sync(); }catch(e){ console.error('n4w sync',e); } n4Pf('sync',t0); const r=base(dt); t0=n4Now(); try{ if(scene==='play'&&G&&G.mode!=='menu') n4Life(dt); }catch(e){ console.error('n4w life',e); } n4Pf('life',t0); if(N4PF.on) N4PF.n++; return r; }; }

// ================= 12. live art: calm motes, the tide stones, the drawbridge, the deck's moonfire, the aurora, tendrils,
// lamps, ruins, shadow folk, shrines, the broken moon, mist, snow that falls up
function n4View(b,m){ m=m||0; return b[2]>cam.x-m&&b[0]<cam.x+W/zoom+m&&b[3]>cam.y-m&&b[1]<cam.y+H/zoom+m; }
const N4MOTE=[]; for(let i=0;i<110;i++) N4MOTE.push([Math.random(),Math.random(),0.5+Math.random(),Math.random()*TAU]);
function n4DrawGround(t){
  const K=N4W.dawnK;
  // calm air: soft silver motes drifting up where wings work
  if(K<1) for(const id in N4W.calm){ const z=N4W.calm[id]; if(!z.fly||(z.on&&!z.on())||!n4View(z.bb,40)) continue; const b=z.bb, w=b[2]-b[0], h=b[3]-b[1], n=Math.min(N4MOTE.length,Math.max(10,Math.round(w*h/14000)));
    for(let i=0;i<n;i++){ const M=N4MOTE[i], x=b[0]+((M[0]*w+Math.sin(t*0.4+M[3])*30)%w+w)%w, y=b[1]+((M[1]*h-t*22*M[2])%h+h)%h; if(!inView(x,y,10)||!z.test(x,y)) continue; const a=0.55+0.45*Math.sin(t*2+M[3]); glowAt(x,y,14,'210,220,255',0.45*a); ctx.fillStyle=`rgba(244,246,255,${0.9*a})`; ctx.beginPath(); ctx.arc(x,y,1.8,0,TAU); ctx.fill(); } }
  // the Tide Court's stepping stones (low tide) and the high water
  const TD=N4G.tide; if(inView(TD.x,TD.y,TD.r+40)){ const hi=N4W.tide.high;
    for(const [r,a] of TD.stones){ const [x,y]=n4P(r,a); if(hi){ ctx.strokeStyle='rgba(230,236,255,.35)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(x,y,16+Math.sin(t*3+r)*2,8,0,0,TAU); ctx.stroke(); continue; }
      ctx.fillStyle='rgba(10,6,20,.35)'; ctx.beginPath(); ctx.ellipse(x+2,y+4,21,12,0,0,TAU); ctx.fill(); ctx.fillStyle='#4a4270'; ctx.beginPath(); ctx.ellipse(x,y,20,12,0,0,TAU); ctx.fill(); ctx.fillStyle='#6e66a0'; ctx.beginPath(); ctx.ellipse(x-3,y-3,13,7,0,0,TAU); ctx.fill(); ctx.strokeStyle=N4OC; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(x,y,20,12,0,0,TAU); ctx.stroke(); }
    if(hi){ ctx.strokeStyle='rgba(220,232,255,.28)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(TD.x,TD.y,TD.r-10+Math.sin(t*2)*4,0,TAU); ctx.stroke(); } }
  // the drawbridge over the chasm (raised on the far side until the crystal drops it)
  const B1=N4G.bridge1; if(inView(n4P(3700,55.5)[0],n4P(3700,55.5)[1],420)) n4DrawBridge1(t);
  // the deck: silver moonfire licking up along the rails
  if(inView(4500,90550,520)){ for(let y=90140;y<91000;y+=110){ if(!inView(4500,y,60)) continue; const f=0.5+0.5*Math.sin(t*5+y*0.07); glowAt(4446,y,30,'200,210,255',0.25+0.2*f); glowAt(4554,y,30,'200,210,255',0.25+0.2*(1-f)); } if(Math.random()<0.5) emit(Math.random()<0.5?4448:4552,rand(90120,90990),1,{col:'220,226,255',ang:-Math.PI/2,spread:0.3,smin:20,smax:60,lmin:.4,lmax:.8,zmin:1.2,zmax:2.4,rise:30,drag:1}); }
  // the Ink Sea: a few violet glints near the camera; the moon's reflection shimmers
  if(K<0.5){ const gl=N4W.glints||(N4W.glints=[]); if(gl.length<14&&Math.random()<0.5){ const x=rand(cam.x,cam.x+W/zoom), y=rand(cam.y,cam.y+H/zoom); n4Feat(x,y,N4T); if(N4T.nsea) gl.push({x,y,t:0}); }
    for(let i=gl.length-1;i>=0;i--){ const q=gl[i]; q.t+=1/60; if(q.t>1.4){ gl.splice(i,1); continue; } const s=Math.sin(Math.PI*q.t/1.4); ctx.fillStyle=`rgba(190,150,255,${0.7*s})`; ctx.fillRect(q.x-4*s,q.y-0.6,8*s,1.2); ctx.fillRect(q.x-0.6,q.y-2.5*s,1.2,5*s); }
    if(inView(4500,80620,800)){ ctx.strokeStyle='rgba(210,200,255,.22)'; ctx.lineWidth=2; for(let k=0;k<5;k++){ const y=80470+k*60, ph=t*0.6+k; ctx.beginPath(); ctx.moveTo(4500-420+Math.sin(ph)*40,y); ctx.lineTo(4500+420+Math.sin(ph+1)*40,y); ctx.stroke(); } } }
  // the frozen aurora over the Aurora Bridge chasm
  if(K<1){ const [ax,ay]=n4P(1950,258); if(inView(ax,ay,1100)) n4DrawAurora(t); }
  // the deep voids (no jumping across): the moat's wind circles the summit; moth silk hangs over the Silk Gallery
  if(K<1&&inView(4500,85200,900)){ ctx.save(); ctx.lineCap='round';
    for(let i=0;i<30;i++){ const r=742+(i*37)%120, a0=i*0.7+t*(0.35+(i%3)*0.08), mx=4500+Math.cos(a0+0.15)*r, my=85200+Math.sin(a0+0.15)*r; if(!inView(mx,my,40)||!n4AirBlock(mx,my)) continue;
      const k=0.5+0.5*Math.sin(t*1.7+i); ctx.strokeStyle=`rgba(196,176,255,${0.18+0.22*k})`; ctx.lineWidth=1.6+k; ctx.beginPath(); ctx.arc(4500,85200,r,a0,a0+0.3); ctx.stroke(); }
    ctx.restore(); }
  { const GA=N4G.gallery, P=[GA.shore[0]].concat(GA.posts,[GA.shore[1]]), [gx,gy]=n4P(2850,282);
    if(inView(gx,gy,1100)){ ctx.save(); ctx.lineCap='round';
      for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1], sw=Math.sin(t*0.8+i)*4; if(!inView((a[0]+b[0])/2,(a[1]+b[1])/2,260)) continue;
        ctx.strokeStyle='rgba(20,12,34,.5)'; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(a[0],a[1]-38); ctx.quadraticCurveTo((a[0]+b[0])/2+sw,(a[1]+b[1])/2-12,b[0],b[1]-38); ctx.stroke();
        ctx.strokeStyle=K>=0.5?'rgba(255,250,240,.6)':'rgba(232,222,255,.55)'; ctx.lineWidth=1.5; ctx.stroke(); }
      for(const a of [267,273,279,285,291,297]){ const A=n4P(2360,a), B=n4P(3340,a+1.5), sw=Math.sin(t*0.6+a)*8; if(!inView((A[0]+B[0])/2,(A[1]+B[1])/2,560)) continue;
        ctx.strokeStyle='rgba(232,222,255,.22)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.quadraticCurveTo((A[0]+B[0])/2+sw,(A[1]+B[1])/2+30,B[0],B[1]); ctx.stroke(); }
      ctx.restore(); } }
}
function n4DrawBridge1(t){
  const down=n4F('n_bridge1'), B=N4G.bridge1, rm=(B.r0+B.r1)/2;
  ctx.save();
  if(down){ const P0=n4P(rm,B.a0+0.2), P1=n4P(rm,B.a1-0.2), ang=Math.atan2(P1[1]-P0[1],P1[0]-P0[0]), L=Math.hypot(P1[0]-P0[0],P1[1]-P0[1]);
    ctx.translate(P0[0],P0[1]); ctx.rotate(ang);
    ctx.fillStyle='rgba(6,3,12,.4)'; ctx.fillRect(0,-56,L,124);
    ctx.fillStyle='#2a2244'; ctx.fillRect(0,-60,L,120); for(let x=0;x<L;x+=22){ ctx.fillStyle=(x/22)%2?'#3e3462':'#352c56'; ctx.fillRect(x,-58,20,116); }
    ctx.strokeStyle='rgba(200,180,255,.45)'; ctx.lineWidth=2; ctx.strokeRect(0,-60,L,120); ctx.strokeStyle=N4OC; ctx.lineWidth=3; ctx.strokeRect(0,-62,L,124);
  } else { const P1=n4P(rm,B.a1), P2=n4P(rm,B.a1+1); ctx.translate(P1[0],P1[1]); ctx.rotate(Math.atan2(P2[1]-P1[1],P2[0]-P1[0]));
    // raised: we see its underside standing up on the far bank, chains taut
    ctx.fillStyle='rgba(6,3,12,.4)'; ctx.fillRect(2,-56,30,124); ctx.fillStyle='#2a2244'; ctx.fillRect(-4,-62,22,124); ctx.fillStyle='#3e3462'; ctx.fillRect(-4,-62,8,124); ctx.strokeStyle=N4OC; ctx.lineWidth=2.4; ctx.strokeRect(-4,-62,22,124);
    ctx.strokeStyle='rgba(190,180,220,.6)'; ctx.lineWidth=2; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(6,-58); ctx.lineTo(40,-70); ctx.moveTo(6,58); ctx.lineTo(40,70); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
  const C=N4G.crystal; ctx.fillStyle='rgba(6,3,12,.4)'; ctx.beginPath(); ctx.ellipse(C[0]+3,C[1]+6,30,12,0,0,TAU); ctx.fill(); ctx.fillStyle='#3a3260'; ctx.beginPath(); ctx.ellipse(C[0],C[1],34,22,0,0,TAU); ctx.fill(); ctx.strokeStyle=N4OC; ctx.lineWidth=2; ctx.stroke();
}
function n4DrawAurora(t){
  const g=ctx; g.save(); g.globalCompositeOperation='lighter';
  for(let a=232;a<=284;a+=2.2){ const [x,y]=n4P(1700+((a*37)%7)*60,a), h=180+Math.sin(a*0.7)*70, k=0.5+0.5*Math.sin(a*0.9+t*0.3); if(!inView(x,y-h/2,h)) continue;
    const gr=g.createLinearGradient(x,y,x,y-h); gr.addColorStop(0,'rgba(120,255,200,0)'); gr.addColorStop(0.15,`rgba(120,240,210,${0.16*k})`); gr.addColorStop(0.45,`rgba(150,120,255,${0.26*k})`); gr.addColorStop(1,'rgba(200,120,255,0)'); g.fillStyle=gr; g.fillRect(x-18,y-h,36,h); }
  g.restore();
}
// tendrils: shadow vines that reach toward a light at arm's length and shrink from it up close
function n4Tendril(p,t){
  const pl=player; let lean=0, k=1;
  const lights=[[pl.x,pl.y,1]]; for(const L of N4W.lamps) if(L.lit>0) lights.push([L.x,L.y,1.3]);
  for(const [lx,ly,w] of lights){ const d=dist(p.x,p.y,lx,ly); if(d>440) continue; const dir=lx>p.x?1:-1; if(d<190*w){ lean-=dir*0.9*(1-d/(190*w)); k=Math.min(k,0.55+0.45*d/(190*w)); } else lean+=dir*0.5*(1-(d-190*w)/(440-190*w)); }
  const H=(30+(p.v||0)*10)*(p.s||1)*k, sw=Math.sin(t*1.3+p.ph)*0.25+lean, x=p.x, y=p.y+4;
  const tx=x+sw*H*0.9, ty=y-H, cx=x+sw*H*0.2+Math.sin(t+p.ph)*4, cy=y-H*0.55;
  ctx.lineCap='round';
  ctx.strokeStyle=N4OC; ctx.lineWidth=7*(p.s||1); ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(cx,cy,tx,ty); ctx.stroke();
  ctx.strokeStyle='#2c2048'; ctx.lineWidth=4.6*(p.s||1); ctx.stroke();
  ctx.strokeStyle='rgba(170,130,255,.7)'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(x-1.5,y-2); ctx.quadraticCurveTo(cx-2,cy,tx-1,ty+2); ctx.stroke();
  ctx.strokeStyle='#2c2048'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(tx+sw*4,ty+4,4.5,-Math.PI/2,Math.PI*0.9); ctx.stroke();
}
function n4DrawObj(o,t){
  const K=N4W.dawnK;
  if(o.k==='ruin'){ const c=n4Spr('ruin_'+o.id+(K>=0.5?'d':''),(o.w||120)+40,(o.h||90)+110,((o.w||120)+40)/2,(o.h||90)/2+80,g=>n4RuinArt(g,o)); n4Put(c,o.x,o.y); }
  else if(o.k==='folk'){ if(K>=1) return; const c=n4Spr('folk'+o.v,40,56,20,48,g=>n4FolkArt(g,o.v)); n4Put(c,o.x,o.y); }
  else if(o.k==='lamp'){ const L=o.ref, lit=L.lit>0||K>=1; const c=n4Spr('lamp'+(lit?1:0)+(K>=0.5?'d':''),34,56,12,50,g=>n4LampArt(g,lit,K>=0.5)); n4Put(c,L.x,L.y); if(lit){ const f=0.85+0.15*Math.sin(t*9+L.x); glowAt(L.x+9,L.y-32,46,'255,200,110',0.55*f); glowAt(L.x+9,L.y-32,12,'255,246,210',0.7*f); } }
}
{ const base=drawHazards; drawHazards=function(){ base(); const t0=n4Now(); try{ if(n4Map4()) n4DrawGround(G.time); }catch(e){ if(!N4W.errG){ N4W.errG=1; console.error('n4w ground',e); } } n4Pf('ground',t0); }; }
{ const base=eventsForRender; eventsForRender=function(list){ base(list); if(!n4Map4()) return; const t=G.time, t0=n4Now();
  try{
    for(const o of N4W.objs){ if(!inView(o.x,o.y-30,140)) continue; list.push({x:o.x,y:o.base,r:8,flying:true,draw:()=>{ try{ n4DrawObj(o,t); }catch(e){} }}); }
    for(const L of N4W.lamps){ if(!inView(L.x,L.y-30,60)) continue; list.push({x:L.x,y:L.y,r:6,flying:true,draw:()=>{ try{ n4DrawObj({k:'lamp',ref:L},t); }catch(e){} }}); }
    if(N4W.dawnK<1){ const c0=Math.floor((cam.x-60)/CH), c1=Math.floor((cam.x+W/zoom+60)/CH), r0=Math.floor((cam.y-60)/CH), r1=Math.floor((cam.y+H/zoom+60)/CH);
      for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++){ const A=PROPS.get(ckey(cx,cy)); if(!A) continue; for(const p of A) if(p.k==='n_tendril'&&inView(p.x,p.y-20,40)) list.push({x:p.x,y:p.y+4,r:6,flying:true,draw:()=>{ try{ n4Tendril(p,t); }catch(e){} }}); } }
  }catch(e){ if(!N4W.errE){ N4W.errE=1; console.error('n4w figures',e); } } n4Pf('figures',t0); }; }
// shrines on the peak: black glass until touched, then warm gold with a little silver
{ const base=drawStruct; drawStruct=function(s,t){ if(s&&s.k==='shrine'&&s.ref&&/^n_sh_/.test(s.ref.id)){ const lit=!!(G&&G.shrines&&G.shrines[s.ref.id]); n4Put(n4Spr('shrine'+(lit?1:0),60,72,30,58,g=>n4ShrineArt(g,lit)),s.x,s.y+6);
  if(lit){ const f=0.85+0.15*Math.sin(t*3); glowAt(s.x,s.y-16,46,'255,190,90',0.45*f); glowAt(s.x,s.y-16,12,'235,240,255',0.6*f); } else glowAt(s.x,s.y-16,22,'150,110,255',0.18+0.1*Math.sin(t*2)); return; } return base(s,t); }; }
// the moonfire bridge's ends (on Moonfall it runs east off the Moon Pier into the dark)
{ const base=drawCrossing; drawCrossing=function(def,t){ if(def&&(def.id==='n_bridge_in'||def.id==='n_bridge_out')){ try{ n4DrawXing(def,t); }catch(e){} return; } return base(def,t); }; }
function n4DrawXing(def,t){
  const x=def.x, y=def.y, a=def.dir, out=def.id==='n_bridge_out', L=out?140:900;
  ctx.save(); ctx.translate(x,y); ctx.rotate(a);
  if(!out){ for(let s=0;s<L;s+=40){ const f=1-s/L; ctx.globalAlpha=f; ctx.fillStyle=(s/40)%2?'#9a9ae0':'#b8b8f0'; ctx.fillRect(s,-56,38,112); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(s,-4,38,8); }
    ctx.globalAlpha=1; for(let s=0;s<L;s+=50){ const f=(1-s/L)*(0.6+0.4*Math.sin(t*4+s*0.1)); glowAt(s,-56,26,'200,210,255',0.4*f); glowAt(s,56,26,'200,210,255',0.4*f); } }
  ctx.restore();
  if(!out&&Math.random()<0.4) emit(x+rand(0,500),y+(Math.random()<0.5?-56:56),1,{col:'220,226,255',ang:-Math.PI/2,spread:0.3,smin:20,smax:60,lmin:.4,lmax:.8,zmin:1.2,zmax:2.4,rise:30,drag:1});
  // a glowing post instead of the wooden sign
  const px=x-30, py=y-6; ctx.fillStyle='#2a2244'; ctx.fillRect(px-4,py-60,8,60); ctx.fillStyle='#4a4280'; ctx.fillRect(px-4,py-60,3,60); glowAt(px,py-66,24,'210,220,255',0.6+0.2*Math.sin(t*3)); ctx.fillStyle='#eef0ff'; ctx.beginPath(); ctx.arc(px,py-66,6,0,TAU); ctx.fill();
}
// ---------- screen space: the broken moon, violet mist, snow that falls up
let N4MOON=null, N4FRAG=null, N4MIST=null;
function n4MoonCv(){
  if(N4MOON) return N4MOON; const S0=512, c=mkCanvas(S0,S0), g=c.getContext('2d'), R=170; g.translate(S0/2,S0/2); g.lineJoin='round'; g.lineCap='round';
  const gl=g.createRadialGradient(0,0,R*0.6,0,0,R*1.45); gl.addColorStop(0,'rgba(170,120,255,.45)'); gl.addColorStop(1,'rgba(120,80,220,0)'); g.fillStyle=gl; g.fillRect(-S0/2,-S0/2,S0,S0);
  const hg=g.createRadialGradient(-R*0.15,-R*0.1,R*0.05,0,0,R*0.88); hg.addColorStop(0,'#6a3ab8'); hg.addColorStop(0.5,'#3a1c70'); hg.addColorStop(1,'#140826'); g.fillStyle=hg; g.beginPath(); g.arc(0,0,R*0.88,0,TAU); g.fill();
  const rng=mulberry32(1311); g.fillStyle='rgba(230,220,255,.8)'; for(let i=0;i<26;i++){ const a=rng()*TAU, d=rng()*R*0.75; g.fillRect(Math.cos(a)*d,Math.sin(a)*d,1.6,1.6); }
  // the cracked rim: a broken plate (arc pieces with jagged ends, two of them missing: those float as fragments)
  const pieces=[[0.25,1.05],[1.25,2.05],[2.6,3.45],[3.62,4.3],[4.95,5.85]];
  for(const [a0,a1] of pieces){ const jag=(a,s)=>{ const p=[]; for(let k=0;k<4;k++){ const r=R*(0.84+k*0.06), aa=a+(rng()-0.5)*0.06*s; p.push([Math.cos(aa)*r,Math.sin(aa)*r]); } return p; };
    const A=jag(a0,1), B=jag(a1,-1);
    const path=()=>{ g.beginPath(); g.moveTo(A[0][0],A[0][1]); for(const q of A) g.lineTo(q[0],q[1]); g.arc(0,0,R*1.02,a0,a1); for(let k=B.length-1;k>=0;k--) g.lineTo(B[k][0],B[k][1]); g.arc(0,0,R*0.84,a1,a0,true); g.closePath(); };
    g.save(); g.shadowColor='rgba(190,170,255,.9)'; g.shadowBlur=18; path(); g.fillStyle='#e8ecff'; g.fill(); g.restore();
    path(); g.fillStyle='#e8ecff'; g.fill(); g.fillStyle='#bcc3ea'; g.save(); path(); g.clip(); g.beginPath(); g.arc(0,0,R*0.92,a0,a1); g.arc(0,0,R*0.84,a1,a0,true); g.fill(); g.restore();
    g.strokeStyle='#3b2233'; g.lineWidth=4; path(); g.stroke();
    g.strokeStyle='rgba(120,110,170,.8)'; g.lineWidth=1.6; const am=(a0+a1)/2; g.beginPath(); g.moveTo(Math.cos(am)*R*1.0,Math.sin(am)*R*1.0); g.lineTo(Math.cos(am+0.05)*R*0.93,Math.sin(am+0.05)*R*0.93); g.lineTo(Math.cos(am-0.02)*R*0.87,Math.sin(am-0.02)*R*0.87); g.stroke(); }
  // a tiny moth in the hole
  try{ thrMoth(g,0,R*0.05,R/30,0.6,'#140a24','rgba(220,200,255,.9)'); }catch(e){}
  N4MOON=c; return c;
}
function n4FragCv(){
  if(N4FRAG) return N4FRAG; N4FRAG=[]; const rng=mulberry32(77);
  for(let i=0;i<5;i++){ const c=mkCanvas(80,80), g=c.getContext('2d'); g.translate(40,40); g.lineJoin='round'; const n=4+Math.floor(rng()*2), P=[]; for(let k=0;k<n;k++){ const a=k/n*TAU+rng()*0.5, r=14+rng()*16; P.push([Math.cos(a)*r,Math.sin(a)*r*0.7]); }
    g.save(); g.shadowColor='rgba(190,170,255,.9)'; g.shadowBlur=10; g.fillStyle='#e8ecff'; g.beginPath(); P.forEach((q,k)=>k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.closePath(); g.fill(); g.restore();
    g.fillStyle='#bcc3ea'; g.beginPath(); g.moveTo(P[0][0],P[0][1]); g.lineTo(P[1][0],P[1][1]); g.lineTo(0,4); g.closePath(); g.fill();
    g.strokeStyle='#3b2233'; g.lineWidth=3; g.beginPath(); P.forEach((q,k)=>k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.closePath(); g.stroke(); N4FRAG.push(c); }
  return N4FRAG;
}
function n4MistCv(){ if(N4MIST) return N4MIST; const c=mkCanvas(128,128), g=c.getContext('2d'), gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(150,120,230,.5)'); gr.addColorStop(1,'rgba(150,120,230,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128); N4MIST=c; return c; }
const N4UP=[]; for(let i=0;i<110;i++) N4UP.push({x:Math.random(),y:Math.random(),s:0.6+Math.random()*1.6,v:0.4+Math.random()*0.8,ph:Math.random()*TAU});
function n4DrawSky(){
  const p=player, t=G.time, K=N4W.dawnK, dn=n4Dawn(), a=ambHere()||{};
  // mist and snow that falls up, faded in and out as Ash moves between rings
  N4W.mist+=((K<1?(a.n4mist||0):0)-N4W.mist)*0.02; N4W.snow+=((K<1?(a.n4snow||0):0)-N4W.snow)*0.02;
  if(N4W.mist>0.02){ const c=n4MistCv(); ctx.save(); ctx.globalAlpha=N4W.mist*0.55; for(let i=0;i<5;i++){ const s=Math.max(W,H)*0.6, x=((i*W*0.33+t*10*(1+i*0.25)-cam.x*zoom*0.3)%(W+s)+W+s)%(W+s)-s*0.75, y=H*(0.1+i*0.2)+Math.sin(t*0.27+i)*24-s/2; ctx.drawImage(c,x,y,s,s); } ctx.restore(); }
  if(N4W.snow>0.02){ ctx.fillStyle=`rgba(225,236,255,${0.7*N4W.snow})`; for(const f of N4UP){ const x=((f.x*W+Math.sin(t*f.v+f.ph)*26-cam.x*zoom*0.15)%W+W)%W, y=((f.y*H-t*36*f.v-cam.y*zoom*0.15)%H+H)%H; ctx.fillRect(x,y,f.s*1.4,f.s*1.4); } }
  // the broken moon over the peak (bigger near the top); after the dawn, the moon the ending made
  const r=Math.hypot(p.x-4500,p.y-85200), k=1-clamp((r-700)/3400,0,1), R=Math.min(W,H)*lerp(0.13,0.22,k);
  // to the right of the hotbar and below it, so the HUD never hides it (on a phone: below the minimap)
  const mx=W*(W<600?0.5:0.66)-(p.x-4500)*0.01*zoom, my=W<600?H*0.27:84+R*0.72;
  N4W.moonA+=((G.boss&&!G.boss.dead?0.24:0.42)-N4W.moonA)*0.05;
  if(dn<1){ const c=n4MoonCv(), s=R/170*1.0; ctx.save(); ctx.globalAlpha=N4W.moonA*(1-dn); ctx.drawImage(c,mx-256*s,my-256*s,512*s,512*s);
    const F=n4FragCv(); for(let i=0;i<5;i++){ const ang=-0.5+i*0.62+Math.sin(t*0.2+i)*0.05, d=R*(1.25+0.12*Math.sin(t*0.5+i*1.7)), fx=mx+Math.cos(ang)*d, fy=my+Math.sin(ang)*d*0.55+R*0.15, fs=s*(0.5+0.18*i%3*0.3); ctx.drawImage(F[i],fx-40*fs,fy-40*fs,80*fs,80*fs); }
    ctx.restore(); }
  if(dn>0&&typeof drawMoon==='function'){ try{ drawMoon(ctx,mx,my,R*0.62,{bites:0,look:moonLook(),alpha:0.9*dn}); }catch(e){} }
}
{ const base=drawRain; drawRain=function(){ base(); const t0=n4Now(); try{ if(n4Map4()&&scene!=='menu') n4DrawSky(); }catch(e){ if(!N4W.errS){ N4W.errS=1; console.error('n4w sky',e); } } n4Pf('sky',t0); }; }

// ================= 13. hooks for the other finale modules (see N4WORLD.md)
// n4wHazard({id,kind:'ink'|'void',bb?,test(x,y),on?()}): a hazard that comes and goes (ink falls, the flooded summit)
function n4wHazard(o){ N4W.haz=N4W.haz.filter(h=>h.id!==o.id); N4W.haz.push(o); return o; }
// n4wOpen({id,bb?,test(x,y),on?()}): walkable ground over ink or void (clock hands, gear teeth); n4wRefresh(bb) redraws
function n4wOpen(o){ N4W.open=N4W.open.filter(h=>h.id!==o.id); N4W.open.push(o); return o; }
function n4wRefresh(bb){ n4Redraw([bb||'all']); }
// n4wWall({id,bb,test(x,y),on?()}): an invisible wall under a kit's own art (the cracked wall, the ice wall, the glass
// wall, the Moon Lock, gate doors): it stops walkers AND jumps like a spike wall but leaves the ground and props alone.
// on() can switch it; n4wWall(id,null) takes it away.
function n4wWall(o,rm){
  const id=typeof o==='string'?o:o.id;
  for(let i=N4FE.length-1;i>=0;i--) if(N4FE[i].k==='wall'&&N4FE[i].id===id) N4FE.splice(i,1);
  N4IX.cells=null;
  if(typeof o==='string'||rm===null) return null;
  return n4FAdd('wall',o.bb,(x,y)=>o.test(x,y),{id,on:o.on||null});
}
function n4wCalm(id,on){ if(id in N4W.calmOn) N4W.calmOn[id]=!!on; else if(N4W.calm[id]) N4W.calm[id].on=on==null?null:()=>!!on; return N4W.calm[id]; }
function n4wTide(high){ N4W.tide.ext=true; n4TideSet(!!high); }
const n4wTideHigh=()=>!!N4W.tide.high;
const n4wHazAt=(x,y)=>n4HazAt(x,y);
const n4wRing=(x,y)=>{ const o={}; n4Feat(x,y,o); n4BiomeOf(x,y,o); const r=Math.hypot(x-4500,y-85200); return {b:o.b,ring:o.b===48||o.b===40?0:r<880?5:r<1500?4:r<2400?3:r<3300?2:1,r:Math.round(r),a:+n4Ang(x,y).toFixed(1),lvl:elevLvl(x,y)}; };

// ================= 14. debug (window.__eb.n4w)
const N4SPOT={arrive:[4500,90800],deck:[4500,90500],foot:[4920,89930],green:[4500,89650],stairs:[4500,89380],ramp_top:[4500,88980],
  sluice_in:n4P(3560,11),sluice:n4P(3700,25),landing:n4P(3860,50),drawbridge:n4P(3700,61),terrace:n4P(3700,72),launch:[8398,85030],shelf:n4P(3700,104),
  leap:n4P(3480,116),leap_in:n4P(3800,117),tide:n4P(3450,139),sky:n4P(3420,160),gate:n4P(3520,170),echo1:[4500,81560],chimney:n4P(3520,200),
  green2:n4P(3700,255),ashhouse:[1123,87230],silent_end:n4P(3700,346),
  sh_clock:[3296,82910],clock:n4P(2700,222),alcove:[2430,83790],clock_exit:n4P(2700,246),gallery:n4P(2850,257),gallery_far:n4P(2850,312),climb:n4P(2850,326),climb_top:n4P(2850,338),
  gear:n4P(2850,0),gear_far:n4P(2850,26),echo2:[6515,87215],u2:n4P(2850,92),u2_far:n4P(2850,108),clockmaker:n4P(2850,150),
  sh_rime:[6443,84363],icewall:n4P(1950,122),floe:n4P(1950,131),floe_far:n4P(1950,154),dam:n4P(1950,178),dam_far:n4P(1950,202),aurora:n4P(1950,224),aurora_far:n4P(1950,292),
  echo3:[3121,86579],gust:n4P(1950,18),choir:n4P(1950,60),emberledge:[6600,85200],
  sh_glass:[5043,86329],lagoon:n4P(1190,32),moonstone:n4P(1420,81),lagoon_far:n4P(1190,96),dunes:n4P(1190,110),lock:n4P(1190,158),wood:n4P(1190,190),echo4:[3315,85096],sh_crown:[3371,85925],
  cradle:n4P(1190,335),road:n4P(950,300),I2:N4G.road.I2,I3:N4G.road.I3,summit:[4500,85300],door:[4500,85860]};
// reachability flood on a 12 px grid (for tests): walking, Water Stride, ramps, one-way drops and ledges, and the
// powers asked for: dbl (steps), claws (climbable faces), grapple (posts within 340), wings (fly zones and vents)
function n4Flood(x0,y0,o){
  o=o||{}; const cs=12, X0=0, Y0=80000, nx=Math.ceil(9000/cs), ny=Math.ceil(11000/cs), V=new Uint8Array(nx*ny), PA=new Int32Array(nx*ny).fill(-1), HOW=new Uint8Array(nx*ny), q=[];
  const stride=!!o.stride, idx=(x,y)=>{ const i=Math.floor((x-X0)/cs), j=Math.floor((y-Y0)/cs); return i<0||j<0||i>=nx||j>=ny?-1:j*nx+i; };
  const walk=(x,y)=>{ if(elevFace(x,y)&1) return false; if(!blockedAt(x,y)) return true; if(!stride) return false; return !mapStrideBlocked(x,y)&&!!T(x,y,N4T).water; };
  let cur=-1;
  // how: 1 walk, 2 drop, 3 step, 4 climb, 5 jump, 6 grapple, 7 wings, 8 vent, 9 link (a kit's wind stream etc.)
  const push=(x,y,how)=>{ const k=idx(x,y); if(k<0||V[k]) return; const cx=X0+(k%nx+0.5)*cs, cy=Y0+(Math.floor(k/nx)+0.5)*cs; if(!walk(cx,cy)) return; V[k]=1; PA[k]=cur; HOW[k]=how||1; q.push(k); };
  push(x0,y0);
  const links=(o.links||[]).map(L=>({a:[L[0],L[1]],b:[L[2],L[3]],r:L[4]||48}));
  const posts=o.grapple?N4W.posts.filter(p=>!p.when||p.when()):[], zones=o.wings?Object.values(N4W.calm).filter(z=>z.fly&&(!z.on||z.on())):[], zoneDone={};
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7]];
  let n=0;
  while(q.length){ const k=q.pop(); n++; cur=k; const i=k%nx, j=Math.floor(k/nx), x=X0+(i+0.5)*cs, y=Y0+(j+0.5)*cs;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ii=i+di, jj=j+dj; if(ii<0||jj<0||ii>=nx||jj>=ny) continue; const kk=jj*nx+ii; if(V[kk]) continue; const xx=x+di*cs, yy=y+dj*cs; if(!walk(xx,yy)||!elevMoveOK(x,y,xx,yy)) continue; V[kk]=1; PA[kk]=k; HOW[kk]=1; q.push(kk); }
    for(const L of links) if(dist2(x,y,L.a[0],L.a[1])<L.r*L.r) push(L.b[0],L.b[1],9);
    // next to a face: drops, ledges, steps, climbs
    let nearFace=0; for(const [dx,dy] of dirs){ const f=elevFace(x+dx*14,y+dy*14); if(f&1) nearFace|=f; }
    if(nearFace){ const lv=elevLvl(x,y);
      for(const [dx,dy] of dirs){ const f=elevFace(x+dx*14,y+dy*14); if(!(f&1)) continue;
        const r=Math.hypot(x+dx*14-4500,y+dy*14-85200), a=n4Ang(x+dx*14,y+dy*14);
        let down=(f&4)&&dy>-0.55; for(const D of N4W.drops) if(lv===D.from&&r>=D.sec[0]&&r<=D.sec[1]&&n4In(a,D.sec[2],D.sec[3])) down=true;
        if(down){ const t=ELEV.findHop(x,y,dx,dy,'down'); if(t) push(t.x,t.y,2); }
        if(o.dbl&&(f&16)){ const t=ELEV.findHop(x,y,dx,dy,'up',lv,lv+1); if(t) push(t.x,t.y,3); }
        if(o.claws&&(f&2)){ for(const tl of [lv+1,lv+2]){ const t=ELEV.findHop(x,y,dx,dy,'up',lv,tl); if(t) push(t.x,t.y,4); } const t2=ELEV.findHop(x,y,dx,dy,'down'); if(t2) push(t2.x,t2.y,4); } } }
    // jumps over ink, void and water to the same level (a running jump about 110 px, a Double Jump about 200;
    // faces and n4AirBlock cells stop a jump), only from the cells at the edge of a hazard
    let edge=false; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const xx=x+di*cs, yy=y+dj*cs; if(n4HazAt(xx,yy)||(!walk(xx,yy)&&T(xx,yy,N4T).water)){ edge=true; break; } }
    if(edge){ const lv=elevLvl(x,y), J=o.dbl?(o.jump||200):(o.jump1||110), nst=Math.ceil(J/cs);
      for(const [dx,dy] of dirs){ let d0=0;
        for(let s=2;s<=nst;s++){ const xx=x+dx*s*cs, yy=y+dy*s*cs, D=s*cs*Math.hypot(dx,dy);
          let stop=false; for(let d=d0+5;d<=D;d+=5){ const px=x+dx/Math.hypot(dx,dy)*d, py=y+dy/Math.hypot(dx,dy)*d; if((elevFace(px,py)&1)||n4AirBlock(px,py)||elevLvl(px,py)>lv){ stop=true; break; } } if(stop) break; d0=D;
          if(elevLvl(xx,yy)===lv&&walk(xx,yy)&&!n4HazAt(xx,yy)){ push(xx,yy,5); break; } } } }
    for(const P of posts){ if(dist2(x,y,P.x,P.y)<340*340){ const lv=elevLvl(x,y); if(P.lvl<=lv+1&&!(P.from&&lv<P.from)) push(P.x,P.y+16,6); } }
    for(const z of zones){ if(zoneDone[z.id]||!z.test(x,y)) continue; zoneDone[z.id]=1; const lv=elevLvl(x,y)+1, b=z.bb;
      for(let yy=b[1];yy<=b[3];yy+=cs) for(let xx=b[0];xx<=b[2];xx+=cs){ if(!z.test(xx,yy)) continue; if(elevLvl(xx,yy)<=lv) push(xx,yy,7); } }
    if(o.wings){ const v=ELEV.ventAt(x,y); if(v&&!zoneDone['v'+v.i]){ zoneDone['v'+v.i]=1; const c=v.lvl+1+v.lift; for(let yy=v.y-480;yy<=v.y+480;yy+=cs) for(let xx=v.x-480;xx<=v.x+480;xx+=cs){ if(dist2(xx,yy,v.x,v.y)<480*480&&elevLvl(xx,yy)<=c) push(xx,yy,8); } } }
  }
  const near=(x,y)=>{ const k=idx(x,y); if(k<0) return -1; for(const [di,dj] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){ const kk=k+di+dj*nx; if(kk>=0&&kk<V.length&&V[kk]) return kk; } return -1; };
  const at=(x,y)=>near(x,y)>=0;
  // the way the flood found to (x,y): the cells where the way changes level or kind of move (for tests and debugging)
  const path=(x,y)=>{ let k=near(x,y); const out=[]; let last=null, g=0; while(k>=0&&g++<100000){ const cx=Math.round(X0+(k%nx+0.5)*cs), cy=Math.round(Y0+(Math.floor(k/nx)+0.5)*cs), lv=elevLvl(cx,cy), h=HOW[k], key=lv+':'+h;
      if(key!==last||h!==1){ out.push([cx,cy,lv,h,Math.round(n4Ang(cx,cy)),Math.round(Math.hypot(cx-4500,cy-85200))]); last=key; } k=PA[k]; } return out.reverse(); };
  N4W.fl={V,at,n,path}; return {n,at,path};
}
const N4W_DBG={N4W,N4G,N4FE,spots:N4SPOT,hazAt:n4HazAt,ring:n4wRing,feat:(x,y)=>Object.assign({},n4Feat(x,y,{})),calmAt:(x,y)=>{ const z=n4CalmAt(x,y); return z?z.id:null; },
  hazard:n4wHazard,open:n4wOpen,wall:n4wWall,refresh:n4wRefresh,calm:n4wCalm,tide:n4wTide,tideHigh:n4wTideHigh,
  go(name){ const s=typeof name==='string'?N4SPOT[name]:name; if(!s) return null; return window.__ebX.goMap(4,s[0],s[1]); },
  set(flag,v){ G.flags[flag]=v===undefined?1:v; n4Sync(); return {flag,v:G.flags[flag]}; },
  sync(){ n4Sync(); return true; },
  air:(x,y)=>n4AirBlock(x,y),
  dawn(v){ G.flags.n_dawn=v==null?1:v; n4Sync(); return N4W.dawnK; },
  haz(x,y){ const r=n4wRing(x,y), z=n4CalmAt(x,y); return Object.assign(r,{haz:n4HazAt(x,y),blocked:blockedAt(x,y),calm:z?z.id:null,nofly:!n4FlyOK(),face:elevFace(x,y)}); },
  clean(){ G.enemies.length=0; G.particles.length=0; G.texts.length=0; G.banner=null; G.bannerQ=[]; try{ MV.tip=null; }catch(e){} return true; },
  flood:(x,y,o)=>{ const now=window.__realNow||(()=>performance.now()), t0=now(), r=n4Flood(x,y,o); return {n:r.n,ms:Math.round(now()-t0)}; },
  reach:(x,y)=>!!(N4W.fl&&N4W.fl.at(x,y)),
  path:(name)=>{ const s=N4SPOT[name]; return s&&N4W.fl?N4W.fl.path(s[0],s[1]):null; },
  reachAll:(names)=>{ const o={}; for(const n of names){ const s=N4SPOT[n]; o[n]=!!(s&&N4W.fl&&N4W.fl.at(s[0],s[1])); } return o; },
  lamps:()=>N4W.lamps.map(L=>({x:Math.round(L.x),y:Math.round(L.y),lit:+L.lit.toFixed(1)})),
  elevProf:()=>{ const E=ELEV.map(4); if(!E) return null; const now=window.__realNow||(()=>performance.now()), t0=now(); E.dirty=true; E.G=null; elvBuild(E); return {ms:Math.round(now()-t0),prof:E.prof,cells:E.G?E.G.w*E.G.h:0}; },
  chunkMs:(n,cy,cx)=>{ n=n||6; cy=cy||170; cx=cx||4; const now=window.__realNow||(()=>performance.now()), t0=now(); for(let i=0;i<n;i++){ CHUNKS.delete(ckey(cx+i,cy)); genChunk(cx+i,cy); } return (now()-t0)/n; },
  prof:(on)=>{ if(on!=null){ N4PF.on=!!on; N4PF.ms={}; N4PF.n=0; return true; } const o={frames:N4PF.n}; for(const k in N4PF.ms) o[k]=Math.round(N4PF.ms[k]/Math.max(1,N4PF.n)*100)/100; return o; },
  glow:(on)=>{ N4W.noGlow=!on; return !N4W.noGlow; },
  land:(x,y)=>landBad(x,y),
  inkHop:(kind)=>{ const p=player, hp=p.hp, x=p.x, y=p.y; backToSafe(p,kind||'ink'); return {hp0:hp,hp1:p.hp,max:p.maxHp,from:[Math.round(x),Math.round(y)],to:[Math.round(p.x),Math.round(p.y)]}; },
  fly:()=>({ok:n4FlyOK(),can:!!canFlyHere()}),
  xing:(id)=>{ const c=CROSSINGS[id]||XBY.flat().find(q=>q&&q.id===id); return c?{hidden:!!(c.hidden&&c.hidden()),need:!c.need||!!c.need(),x:c.x,y:c.y,to:c.to}:null; },
  chests:()=>mapList(CHESTS,4).map(c=>({id:c.id,x:Math.round(c.x),y:Math.round(c.y),lvl:elevLvl(c.x,c.y),ring:n4wRing(c.x,c.y).ring})),
  frame:(n)=>{ const now=window.__realNow||(()=>performance.now()); if(!window.__step) return null; const t0=now(); window.__step(n||10); return Math.round((now()-t0)/(n||10)*10)/10; },
  benchT:(n)=>{ n=n||40000; const now=window.__realNow||(()=>performance.now()), o={}, t0=now(); for(let i=0;i<n;i++) T(500+(i*37)%8000,80500+(i*53)%10000,o); const t1=now(); for(let i=0;i<n;i++) blockedAt(500+(i*37)%8000,80500+(i*53)%10000); const t2=now(); for(let i=0;i<n;i++) T(500+(i*37)%8000,500+(i*53)%10000,o); return {T_us:(t1-t0)/n*1000,blocked_us:(t2-t1)/n*1000,T0_us:(now()-t2)/n*1000}; }};
window.__ebX=Object.assign(window.__ebX||{},{n4w:N4W_DBG});
