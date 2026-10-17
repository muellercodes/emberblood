// ================= v10_art4a (A4a): art for Act IV chapters 1 to 3 (game/story/act4: m_sail, m_drift, m_lumen,
// m_coral, m_reef, m_sable, m_burrows). Only looks: defineLook(id, {w, h, draw(g, x, y, t, state)}).
// Small props (the tide post, Squint's spyglass, the bitten raft lantern, the dusty balcony rail) are static looks,
// cached once per state by the gate library, with a `live` glow or twinkle on top. Two looks are pictures over the
// whole screen while a scene plays (anim:true): the voyage east (m4a_voyage_ship / m4a_voyage_glaciar) and the first
// eclipse (m4a_eclipse: the dark, the covered sun, Nyxara the size of a house, Hush on her silver thread). They draw
// in screen space from the place's spot, so they cover everything drawn before them; the story keeps each one shown
// only while its scene runs. Nyxara and Hush use x3_story's own moth figure (m3sMothFig) when it is in the build.
const A4A_INK='#2a1c2c';
const A4A_SPR=new Map();
// bake a sprite once: w x h world px, (ox, oy) is the ground point inside it
function a4aSpr(key,w,h,ox,oy,draw){
  let c=A4A_SPR.get(key); if(c) return c;
  const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), q=cv.getContext('2d');
  q.scale(sc,sc); q.translate(ox,oy); q.lineCap='round'; q.lineJoin='round'; draw(q);
  c={cv,w,h,ox,oy}; A4A_SPR.set(key,c); return c;
}
function a4aGlow(g,x,y,r,rgb,a){
  if(a<=0.01) return;
  const c=a4aSpr('glow_'+rgb,64,64,32,32,q=>{ const gr=q.createRadialGradient(0,0,0,0,0,32); gr.addColorStop(0,`rgba(${rgb},1)`); gr.addColorStop(0.45,`rgba(${rgb},.42)`); gr.addColorStop(1,`rgba(${rgb},0)`); q.fillStyle=gr; q.fillRect(-32,-32,64,64); });
  g.save(); g.globalAlpha=Math.min(1,a); g.globalCompositeOperation='lighter'; g.drawImage(c.cv,x-r,y-r,r*2,r*2); g.restore();
}
const a4aNight=()=>{ try{ return 1-clamp(daylight(),0,1); }catch(e){ return 0; } };
const a4aNow=()=>performance.now()/1000;
function a4aEll(q,x,y,rx,ry,col,lw){ q.fillStyle=col; q.beginPath(); q.ellipse(x,y,rx,ry,0,0,TAU); q.fill(); if(lw){ q.strokeStyle=A4A_INK; q.lineWidth=lw; q.stroke(); } }
function a4aShadow(q,x,y,rx,ry,a){ q.save(); q.globalAlpha=a==null?0.25:a; q.fillStyle='#000'; q.beginPath(); q.ellipse(x,y,rx,ry,0,0,TAU); q.fill(); q.restore(); }
// a moon disc with n bites out of its right edge (cookie bites), on its own little canvas
function a4aMoonSpr(n,R){
  return a4aSpr('moon'+n+'_'+R,R*2+8,R*2+8,R+4,R+4,q=>{
    q.fillStyle='#f4f1e4'; q.beginPath(); q.arc(0,0,R,0,TAU); q.fill();
    q.fillStyle='rgba(200,196,214,.6)'; for(const [a,b,r] of [[-0.3,-0.25,0.2],[0.2,0.3,0.14],[-0.1,0.45,0.1],[0.35,-0.35,0.09]]){ q.beginPath(); q.arc(a*R,b*R,r*R,0,TAU); q.fill(); }
    q.globalCompositeOperation='destination-out';
    for(let i=0;i<n;i++){ const a=-0.55+i*0.62; q.beginPath(); q.arc(Math.cos(a)*R*1.08,Math.sin(a)*R*1.08,R*0.34,0,TAU); q.fill(); }
    q.globalCompositeOperation='source-over';
  });
}
// a state change on a look starts its clock (kept per look id). `first` is the state a picture starts from: going
// back to it starts the clock over (a scene played again, a reload). A state the clock never saw but that comes
// before the current one in `order` counts as long done (frames can be far apart on a slow machine).
const A4A_ST={};
function a4aClock(id,state,first,order){
  const now=a4aNow(); let c=A4A_ST[id]; if(!c) c=A4A_ST[id]={st:undefined,t0:now,hist:{}};
  if(c.st!==state){ if(state===first) c.hist={}; c.st=state; c.t0=now; c.hist[state]=now; }
  const cur=order?order.indexOf(state):-1;
  c.since=k=>{ if(c.hist[k]!=null) return now-c.hist[k]; const i=order?order.indexOf(k):-1; return i>=0&&cur>=0&&i<cur?99:-1; };
  return c; }
// screen size (CSS px) and a transform to draw in it
function a4aScreen(g){ const dpr=typeof DPR!=='undefined'?DPR:1; const sw=typeof W!=='undefined'?W:g.canvas.width/dpr, sh=typeof H!=='undefined'?H:g.canvas.height/dpr; g.setTransform(dpr,0,0,dpr,0,0); return {w:sw,h:sh}; }

// ---------- m_drift: the tide post at the edge of the Town Raft (neat old notches, wild new ones, TWO BITES)
defineLook('m4a_tide_post',{w:30,h:76,draw(g,x,y){
  const c=a4aSpr('tidepost',40,84,20,78,q=>{
    a4aShadow(q,0,2,12,4);
    // the post, grey-brown driftwood with a rope ring at its foot
    q.fillStyle='#8a6a4a'; q.strokeStyle=A4A_INK; q.lineWidth=2.4; q.beginPath(); q.moveTo(-6,0); q.lineTo(-5.5,-64); q.quadraticCurveTo(0,-70,5.5,-64); q.lineTo(6,0); q.closePath(); q.fill(); q.stroke();
    q.fillStyle='#a8865e'; q.fillRect(-4,-62,3,60);
    q.strokeStyle='#5a4028'; q.lineWidth=1; for(const yy of [-50,-30,-14]){ q.beginPath(); q.moveTo(-5,yy); q.lineTo(5,yy+2); q.stroke(); }
    q.strokeStyle='#c8a870'; q.lineWidth=3; q.beginPath(); q.ellipse(0,-6,8,3,0,0,TAU); q.stroke(); q.strokeStyle=A4A_INK; q.lineWidth=1; q.beginPath(); q.ellipse(0,-6,8.6,3.6,0,0,TAU); q.stroke();
    // notches: neat steps low down, then wild ones going every which way
    q.strokeStyle='#f4ead6'; q.lineWidth=1.6;
    for(let i=0;i<5;i++){ const yy=-12-i*5; q.beginPath(); q.moveTo(-5,yy); q.lineTo(-1,yy); q.stroke(); }
    for(const [x0,y0,x1,y1] of [[-5,-40,0,-46],[-5,-52,1,-44],[1,-48,5,-56],[-5,-58,2,-52],[0,-60,5,-54]]){ q.beginPath(); q.moveTo(x0,y0); q.lineTo(x1,y1); q.stroke(); }
    // TWO BITES: a tiny scratched moon with two bites, by the wildest notch
    q.strokeStyle='#fff6e0'; q.lineWidth=1.2; q.beginPath(); q.arc(1.5,-35,3.4,0.9,TAU-0.6); q.stroke();
    q.beginPath(); q.arc(4.6,-36.4,1.4,1.8,4.4); q.stroke(); q.beginPath(); q.arc(4.2,-32.8,1.3,2.2,4.6); q.stroke();
    // a gull's white splash on top, because a post at sea always has one
    q.fillStyle='#ffffff'; q.beginPath(); q.ellipse(-1,-65,3,1.6,0.2,0,TAU); q.fill();
  });
  g.drawImage(c.cv,x-c.ox,y-c.oy,c.w,c.h);
}});

// ---------- m_drift: Squint's brass spyglass, on a swivel at the rail of the crow's nest
defineLook('m4a_spyglass',{w:34,h:40,draw(g,x,y){
  const c=a4aSpr('spyglass',44,48,22,42,q=>{
    a4aShadow(q,0,2,9,3);
    // a little wooden stand
    q.strokeStyle=A4A_INK; q.lineWidth=3.6; q.beginPath(); q.moveTo(0,-14); q.lineTo(-7,0); q.moveTo(0,-14); q.lineTo(7,0); q.moveTo(0,-14); q.lineTo(0,1); q.stroke();
    q.strokeStyle='#8a5a32'; q.lineWidth=2; q.beginPath(); q.moveTo(0,-14); q.lineTo(-7,0); q.moveTo(0,-14); q.lineTo(7,0); q.moveTo(0,-14); q.lineTo(0,1); q.stroke();
    // the glass: three brass tubes, pointing up and out to sea
    q.save(); q.translate(0,-17); q.rotate(-0.55);
    const tube=(x0,len,r,col)=>{ q.fillStyle=col; q.strokeStyle=A4A_INK; q.lineWidth=1.8; q.beginPath(); q.rect(x0,-r,len,r*2); q.fill(); q.stroke(); q.fillStyle='rgba(255,246,200,.6)'; q.fillRect(x0+1,-r+1,len-2,1.4); };
    tube(-12,9,3.2,'#b8862e'); tube(-4,10,4,'#d8a840'); tube(5,9,5,'#e8bc52');
    q.fillStyle='#9ad8f0'; q.beginPath(); q.ellipse(14.5,0,1.6,4.4,0,0,TAU); q.fill(); q.strokeStyle=A4A_INK; q.lineWidth=1.2; q.stroke();
    q.restore();
  });
  g.drawImage(c.cv,x-c.ox,y-c.oy,c.w,c.h);
},live(g,x,y,t){ const k=Math.sin(t*2.4); if(k>0.6){ const s=1.5+3*(k-0.6); g.fillStyle='rgba(255,255,240,.95)'; g.fillRect(x+9-s,y-27,s*2,1.2); g.fillRect(x+9-0.6,y-27-s,1.2,s*2); } }});

// ---------- m_drift: a raft lantern with a bite out of its glass (lamp_thief); 'fixed' has new glass and a tag
function a4aLantern(q,bitten){
  a4aShadow(q,0,2,9,3);
  // the post and its hook
  q.fillStyle='#6a4a2e'; q.strokeStyle=A4A_INK; q.lineWidth=2; q.fillRect(-2.5,-50,5,50); q.strokeRect(-2.5,-50,5,50);
  q.strokeStyle=A4A_INK; q.lineWidth=2.2; q.beginPath(); q.moveTo(0,-50); q.lineTo(9,-52); q.lineTo(9,-47); q.stroke();
  // the lantern box
  q.save(); q.translate(9,-30);
  q.fillStyle='#3a3a44'; q.fillRect(-7,-17,14,3); q.fillRect(-7,6,14,3); q.strokeRect(-7,-17,14,26);
  q.fillStyle=bitten?'rgba(150,170,190,.55)':'rgba(255,214,120,.85)'; q.fillRect(-6,-14,12,20);
  if(bitten){ // the bite: a round chunk gone from the top corner, with little tooth marks round it
    q.save(); q.globalCompositeOperation='destination-out'; q.beginPath(); q.arc(6,-13,6.2,0,TAU); q.fill(); q.restore();
    q.strokeStyle='#e8f0ff'; q.lineWidth=1.1; q.beginPath(); q.arc(6,-13,6.2,Math.PI*0.5,Math.PI*1.05); q.stroke();
    q.fillStyle='#e8f0ff'; for(const a of [1.7,2.1,2.5,2.9]){ q.beginPath(); q.arc(6+Math.cos(a)*6.4,-13+Math.sin(a)*6.4,0.9,0,TAU); q.fill(); }
    q.fillStyle='#5a5a66'; q.beginPath(); q.ellipse(0,0,2.2,3,0,0,TAU); q.fill();   // a cold wick
  } else {
    q.fillStyle='#fff4c8'; q.beginPath(); q.ellipse(0,-3,2.4,4,0,0,TAU); q.fill();
    // the tag: SORRY
    q.fillStyle='#f4ead6'; q.strokeStyle=A4A_INK; q.lineWidth=1; q.save(); q.rotate(0.25); q.fillRect(3,8,9,5); q.strokeRect(3,8,9,5); q.fillStyle='#8a2a2a'; q.fillRect(4.5,10,6,1.2); q.restore();
  }
  q.strokeStyle=A4A_INK; q.lineWidth=1.6; q.strokeRect(-6,-14,12,20);
  q.fillStyle='#4a4a56'; q.beginPath(); q.moveTo(-7,-17); q.lineTo(0,-22); q.lineTo(7,-17); q.closePath(); q.fill(); q.stroke();
  q.restore();
}
defineLook('m4a_chewed_lamp',{w:30,h:60,draw(g,x,y){ const c=a4aSpr('lamp_bit',40,64,16,60,q=>a4aLantern(q,true)); g.drawImage(c.cv,x-c.ox,y-c.oy,c.w,c.h); }});
defineLook('m4a_lamp_fixed',{w:30,h:60,draw(g,x,y){ const c=a4aSpr('lamp_ok',40,64,16,60,q=>a4aLantern(q,false)); g.drawImage(c.cv,x-c.ox,y-c.oy,c.w,c.h); },
  live(g,x,y,t){ a4aGlow(g,x+9,y-32,24+a4aNight()*30,'255,210,120',0.35+0.45*a4aNight()+0.05*Math.sin(t*3)); }});

// ---------- m_lumen: silver moth dust on the balcony rail and a scrape as long as a boat across the marble
defineLook('m4a_balcony_dust',{w:120,h:40,draw(g,x,y){
  const c=a4aSpr('balcdust',140,46,104,30,q=>{
    // the long scrape: three gouges in the marble, running off toward the sunrise (east is to the right)
    q.strokeStyle='rgba(150,158,184,.5)'; q.lineWidth=1.6;
    for(const dy of [-5,0,5]){ q.beginPath(); q.moveTo(-100,dy+4); q.quadraticCurveTo(-40,dy-2,8,dy-6); q.stroke(); }
    q.strokeStyle='rgba(210,220,255,.75)'; q.lineWidth=0.9; for(const dy of [-5,0,5]){ q.beginPath(); q.moveTo(-98,dy+5); q.quadraticCurveTo(-40,dy-1,6,dy-5); q.stroke(); }
    q.fillStyle='rgba(214,222,255,.8)'; for(let i=0;i<22;i++){ const u=i/22; q.fillRect(-96+u*100,4-u*10+((i*7)%9)-4,1.4,1.4); }
    // claw tips at the end, pointing right
    q.fillStyle='rgba(90,96,120,.7)'; for(const dy of [-7,-1,5]){ q.beginPath(); q.moveTo(8,dy-2); q.lineTo(16,dy-4); q.lineTo(8,dy+1); q.closePath(); q.fill(); }
    // a stretch of rail, thick with silver dust
    q.fillStyle='#e8e6f2'; q.strokeStyle=A4A_INK; q.lineWidth=2; q.fillRect(18,-24,14,26); q.strokeRect(18,-24,14,26);
    q.fillStyle='#d2d0e2'; q.fillRect(19,-23,4,24);
    q.fillStyle='rgba(214,222,255,.95)'; for(let i=0;i<26;i++){ const px=16+((i*7)%19), py=-26+((i*11)%9); q.fillRect(px,py,1.8,1.4); }
    q.fillStyle='rgba(200,210,250,.8)'; for(let i=0;i<30;i++){ const a=i*2.3, d=6+((i*5)%13); q.fillRect(25+Math.cos(a)*d*1.4,6+Math.sin(a)*d*0.4,1.5,1.5); }
  });
  g.drawImage(c.cv,x-c.ox,y-c.oy,c.w,c.h);
},live(g,x,y,t){ for(let i=0;i<5;i++){ const k=Math.sin(t*3.1+i*1.9); if(k<0.5) continue; const px=x+14+((i*9)%17), py=y-20+((i*5)%9), s=1+2.4*(k-0.5);
  g.fillStyle='rgba(235,240,255,.95)'; g.fillRect(px-s,py-0.6,s*2,1.2); g.fillRect(px-0.6,py-s,1.2,s*2); } }});

// ---------- the moths of Act IV (screen pictures): x3_story's figure when it is in the build, a simple one if not
function a4aMoth(g,Wd,f,kind,eyes){
  try{ if(typeof m3sMothFig==='function'){ const o=kind==='hush'?M3S_HUSH:M3S_NYX; m3sMothFig(g,Wd,f,o,eyes||0); return; } }catch(e){}
  const nyx=kind!=='hush', fore=nyx?'#241c34':'#f4f2fa', hind=nyx?'#2b2140':'#e8e4f4', ring=nyx?'#d6c8f4':'#ece2ff';
  g.lineJoin='round'; g.strokeStyle='#1a1424'; g.lineWidth=Math.max(1.4,Wd*0.02);
  for(const s of [-1,1]){
    g.fillStyle=hind; g.beginPath(); g.moveTo(s*Wd*0.05,0); g.bezierCurveTo(s*Wd*0.5*f,0,s*Wd*0.7*f,Wd*0.4,s*Wd*0.45*f,Wd*0.6); g.bezierCurveTo(s*Wd*0.2,Wd*0.6,s*Wd*0.08,Wd*0.3,s*Wd*0.05,0); g.fill(); g.stroke();
    g.fillStyle=fore; g.beginPath(); g.moveTo(s*Wd*0.05,-Wd*0.06); g.bezierCurveTo(s*Wd*0.3*f,-Wd*0.55,s*Wd*0.95*f,-Wd*0.6,s*Wd*1.0*f,-Wd*0.3); g.bezierCurveTo(s*Wd*0.9*f,0,s*Wd*0.4*f,Wd*0.08,s*Wd*0.05,Wd*0.05); g.fill(); g.stroke();
    g.fillStyle=ring; g.beginPath(); g.arc(s*Wd*0.58*f,-Wd*0.27,Wd*0.14,0,TAU); g.fill(); g.stroke();
    g.fillStyle=nyx?'#8a5ad8':'#9a6ae0'; g.beginPath(); g.arc(s*Wd*0.58*f,-Wd*0.27,Wd*0.08,0,TAU); g.fill();
  }
  g.fillStyle=nyx?'#3a3050':'#ffffff'; g.beginPath(); g.ellipse(0,Wd*0.1,Wd*0.07,Wd*0.3,0,0,TAU); g.fill(); g.stroke();
}
function a4aMoonDisc(g,x,y,R,cov,sunA,t){
  // the sun, then the dark moon sliding over it, and the silver ring when it is covered
  if(sunA>0.01){ g.save(); g.globalAlpha=sunA; a4aGlow(g,x,y,R*3.2,'255,220,150',0.5*(1-cov*0.75)); g.fillStyle='#fff2c4'; g.beginPath(); g.arc(x,y,R,0,TAU); g.fill();
    if(cov>0.55){ const c2=(cov-0.55)/0.45; a4aGlow(g,x,y,R*1.9,'235,225,255',0.6*c2); g.strokeStyle=`rgba(255,250,235,${0.85*c2})`; g.lineWidth=2.5;
      for(let i=0;i<12;i++){ const a=i/12*TAU+t*0.05, r1=R*1.04, r2=R*(1.25+0.18*Math.sin(t*2+i)); g.beginPath(); g.moveTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1); g.lineTo(x+Math.cos(a)*r2,y+Math.sin(a)*r2); g.stroke(); } }
    g.restore(); }
  if(cov>0.01){ const mx=x-R*2.8*(1-cov), my=y+R*0.6*(1-cov); g.save(); g.globalAlpha=Math.min(1,cov*1.4); g.fillStyle='#1c1630'; g.beginPath(); g.arc(mx,my,R*1.02,0,TAU); g.fill(); g.strokeStyle='#3b2233'; g.lineWidth=Math.max(2,R*0.07); g.stroke(); g.restore(); }
}

// ---------- m_reef: the first eclipse, over the whole screen. States: dark, rise, bite, eyes, leave (the scene sets
// them line by line). Nothing is drawn for any other state.
defineLook('m4a_eclipse',{w:60,h:60,anim:true,draw(g,x,y,t,state){
  const ORD=['dark','rise','bite','eyes','leave'];
  if(!state||!ORD.includes(state)) return;
  const C=a4aClock('m4a_eclipse',state,'dark',ORD), now=a4aNow(), since=C.since, ramp=(k,d)=>{ const s=since(k); return s<0?0:Math.min(1,s/(d||1)); };
  const lv=ramp('leave',2.6), dark=ramp('dark',2)*(1-lv), cov=Math.min(ramp('dark',2.2),1-ramp('leave',1.6)), rise=ramp('rise',2.6), fade=1-lv;
  g.save();
  const S=a4aScreen(g), sw=S.w, sh=S.h, narrow=sw<600;
  // the day goes violet and dark (the sky band at the top darker still)
  g.fillStyle=`rgba(20,10,40,${0.5*dark})`; g.fillRect(0,0,sw,sh);
  const gr=g.createLinearGradient(0,0,0,sh*0.55); gr.addColorStop(0,`rgba(14,6,30,${0.6*dark})`); gr.addColorStop(1,'rgba(14,6,30,0)'); g.fillStyle=gr; g.fillRect(0,0,sw,sh*0.55);
  const sx=sw*(narrow?0.8:0.82), sy=Math.max(60,sh*(narrow?0.16:0.14)), R=Math.max(22,Math.min(sw,sh)*0.055);
  a4aMoonDisc(g,sx,sy,R,cov,Math.min(1,0.3+dark*1.2),now);
  // Nyxara rises over the dunes (right of Ash on a wide screen, above him on a phone); she leaves up and away east
  if(rise>0.01&&fade>0.01){
    const e=rise*rise*(3-2*rise), Wd=narrow?Math.min(sw*0.4,220):Math.min(sw*0.26,330);
    const bx=narrow?sw*0.52:sw*0.7, by=narrow?sh*0.3:sh*0.4, lx=sw*0.45*lv*lv, ly=-sh*0.75*lv;
    const nx=bx+lx, ny=lerp(sh+Wd,by,e)+ly, bite=since('bite'), grow=bite>=0?1.06:1, fl=0.74+0.26*Math.cos(now*(2.1+lv*3));
    const eyes=ramp('eyes',1.4)*(1-lv);
    // her shadow on the sand, far below
    g.save(); g.globalAlpha=0.28*e*fade; g.fillStyle='#0c0618'; g.beginPath(); g.ellipse(nx-Wd*0.1,ny+Wd*0.9,Wd*1.1,Wd*0.25,0,0,TAU); g.fill(); g.restore();
    // Hush, big again, on the silver thread that goes all the way up into the sky
    const ha=ramp('rise',3.4)*fade, hx=nx-Wd*(narrow?0.95:1.25), hy=ny+Wd*(narrow?0.55:0.25)+Math.sin(now*1.6)*6, hs=0.42;
    if(ha>0.01){
      g.save(); g.globalAlpha=ha; g.strokeStyle='#e8eef8'; g.lineWidth=2; g.shadowColor='#cfe0ff'; g.shadowBlur=8;
      g.beginPath(); g.moveTo(hx,hy-Wd*hs*0.2); g.quadraticCurveTo((hx+nx)/2,Math.max(hy,ny)+Wd*0.2,nx,ny+Wd*0.1); g.stroke();
      g.beginPath(); g.moveTo(hx,hy-Wd*hs*0.2); g.lineTo(hx+Wd*0.15,-20); g.stroke();
      const gl=(now*0.6)%1; g.shadowBlur=0; g.fillStyle='#ffffff'; g.beginPath(); g.arc(lerp(hx,hx+Wd*0.15,gl),lerp(hy,-20,gl),3,0,TAU); g.fill();
      g.translate(hx,hy); g.scale(hs*Wd/190,hs*Wd/190); a4aMoth(g,190,0.7+0.3*Math.cos(now*3.2),'hush',0); g.restore();
    }
    g.save(); g.globalAlpha=Math.min(1,e*1.4)*fade; a4aGlow(g,nx,ny,Wd*1.3,'150,120,230',0.25*e); g.translate(nx,ny); g.scale(grow*Wd/200,grow*Wd/200); a4aMoth(g,200,fl,'nyx',eyes); g.restore();
  }
  // the bite: one flash of violet-white light
  const b=since('bite'); if(b>=0&&b<0.8){ g.fillStyle=`rgba(232,220,255,${0.45*(1-b/0.8)})`; g.fillRect(0,0,sw,sh); }
  g.restore();
}});

// ---------- m_sail: the voyage east, a painted picture over the whole screen while the voyage scene plays.
// States: (none) the sea at dusk; 'moths' the bitten moon and a hundred moths flying east; 'dawn' the floating town in
// the mist, and the picture fades out to show Driftwood.
function a4aBoat(g,x,y,s,t){
  g.save(); g.translate(x,y+Math.sin(t*1.6)*3*s); g.rotate(Math.sin(t*1.1)*0.03); g.scale(s,s); g.lineJoin='round'; g.strokeStyle=A4A_INK; g.lineWidth=2.4;
  // steam puffs from the funnel
  for(let i=0;i<4;i++){ const k=((t*0.35+i*0.25)%1); g.fillStyle=`rgba(240,240,248,${0.75*(1-k)})`; g.beginPath(); g.arc(-8-k*40,-62-k*36,6+k*12,0,TAU); g.fill(); }
  // hull
  g.fillStyle='#c8483a'; g.beginPath(); g.moveTo(-64,-12); g.lineTo(60,-12); g.quadraticCurveTo(66,-12,58,4); g.lineTo(-52,4); g.quadraticCurveTo(-62,0,-64,-12); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#f0e6d0'; g.fillRect(-60,-12,118,4);
  // cabin, funnel, flag
  g.fillStyle='#e8c87a'; g.fillRect(-24,-34,40,22); g.strokeRect(-24,-34,40,22);
  g.fillStyle='#8ad0e8'; for(const wx of [-18,-6,6]){ g.fillRect(wx,-29,7,7); g.strokeRect(wx,-29,7,7); }
  g.fillStyle='#3a3a44'; g.fillRect(-12,-56,10,22); g.strokeRect(-12,-56,10,22); g.fillStyle='#e8c03a'; g.fillRect(-12,-50,10,4);
  g.strokeStyle=A4A_INK; g.beginPath(); g.moveTo(28,-12); g.lineTo(28,-58); g.stroke(); g.fillStyle='#e8c03a'; g.beginPath(); g.moveTo(28,-58); g.lineTo(46,-52); g.lineTo(28,-46); g.closePath(); g.fill(); g.stroke();
  // the paddle wheel turning at the stern
  g.save(); g.translate(-50,-6); g.rotate(t*2); g.fillStyle='#8a5a32'; g.beginPath(); g.arc(0,0,12,0,TAU); g.fill(); g.stroke();
  g.strokeStyle='#5a3a1e'; g.lineWidth=2; for(let i=0;i<6;i++){ const a=i/6*TAU; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*12,Math.sin(a)*12); g.stroke(); } g.restore();
  // little people at the rail: Dell's yellow hat, Wren's book
  g.fillStyle='#e8c03a'; g.beginPath(); g.arc(22,-38,5,Math.PI,0); g.fill(); g.fillStyle='#e6b494'; g.beginPath(); g.arc(22,-36,3.4,0,TAU); g.fill();
  g.fillStyle='#a6c868'; g.beginPath(); g.arc(-30,-18,4,0,TAU); g.fill(); g.fillStyle='#5a3a6a'; g.fillRect(-34,-16,7,5);
  g.restore();
}
function a4aGlaciar(g,x,y,s,t){
  g.save(); g.translate(x,y+Math.sin(t*0.9)*6*s); g.scale(s,s); g.lineJoin='round'; g.strokeStyle='#2c4c6c'; g.lineWidth=2.6;
  const fl=Math.sin(t*1.2)*0.35;
  // wings (slow, slow)
  for(const sd of [-1,1]){ g.save(); g.scale(1,sd); g.fillStyle=sd<0?'#a8d8f4':'#8cc4e8'; g.beginPath(); g.moveTo(-10,-6); g.quadraticCurveTo(-30,-70-fl*30,10,-96-fl*40); g.quadraticCurveTo(20,-60,40,-10); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  // the long body, the tail, the head pointing east (right)
  g.fillStyle='#bfe4fa'; g.beginPath(); g.moveTo(-110,4); g.quadraticCurveTo(-60,-14,0,-12); g.quadraticCurveTo(50,-14,74,-22); g.quadraticCurveTo(94,-24,98,-14); g.quadraticCurveTo(90,-4,72,-6); g.quadraticCurveTo(40,8,0,10); g.quadraticCurveTo(-60,16,-110,4); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#f4fbff'; g.beginPath(); g.moveTo(84,-22); g.lineTo(78,-36); g.lineTo(90,-24); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#2c4c6c'; g.beginPath(); g.arc(88,-16,2,0,TAU); g.fill();
  // Ash, tiny, holding on to a horn
  g.fillStyle='#d8582a'; g.beginPath(); g.arc(40,-22,6,0,TAU); g.fill(); g.strokeStyle='#3a1a10'; g.lineWidth=1.6; g.stroke();
  g.restore();
}
function a4aVoyage(kind){ return {w:60,h:60,anim:true,draw(g,x,y,t,state){
  const ORD=['sea','moths','dawn'], id='m4a_voyage_'+kind, C=a4aClock(id,state==null?'sea':state,'sea',ORD), now=a4aNow(), sn=C.since;
  const fin=sn('sea')<0?1:Math.min(1,sn('sea')/0.6), dawn=sn('dawn')<0?0:Math.min(1,sn('dawn')/1.8), out=sn('dawn')<0?0:Math.max(0,Math.min(1,(sn('dawn')-1.4)/2.4));
  const moths=sn('moths')<0?0:Math.min(1,sn('moths')/1.2);
  const A=fin*(1-out); if(A<=0.01) return;
  g.save(); const S=a4aScreen(g), sw=S.w, sh=S.h, hz=sh*0.56; g.globalAlpha=A;
  // the sky: dusk blue to night indigo, warming to pink and gold at dawn
  const sk=g.createLinearGradient(0,0,0,hz);
  sk.addColorStop(0,`rgb(${lerp(18,236,dawn)|0},${lerp(22,170,dawn)|0},${lerp(58,160,dawn)|0})`); sk.addColorStop(1,`rgb(${lerp(58,255,dawn)|0},${lerp(70,214,dawn)|0},${lerp(128,150,dawn)|0})`);
  g.fillStyle=sk; g.fillRect(0,0,sw,hz);
  if(dawn<1){ g.fillStyle=`rgba(255,255,255,${0.8*(1-dawn)})`; for(let i=0;i<46;i++){ const px=(i*137.5)%sw, py=(i*61.3)%(hz*0.9), tw=0.5+0.5*Math.sin(now*2+i); g.fillRect(px,py,1+tw,1+tw); } }
  // the bitten moon
  if(moths>0){ const R=Math.max(18,Math.min(sw,sh)*0.06), mx=sw*0.22, my=hz*0.3; g.save(); g.globalAlpha=A*moths*(1-dawn*0.7); a4aGlow(g,mx,my,R*3,'230,236,255',0.35); const c=a4aMoonSpr(2,Math.round(R)); g.drawImage(c.cv,mx-c.ox,my-c.oy,c.w,c.h); g.restore(); }
  // the sea, with slow wave lines
  const se=g.createLinearGradient(0,hz,0,sh); se.addColorStop(0,`rgb(${lerp(24,120,dawn)|0},${lerp(52,150,dawn)|0},${lerp(104,190,dawn)|0})`); se.addColorStop(1,'#0c1c3a'); g.fillStyle=se; g.fillRect(0,hz,sw,sh-hz);
  g.strokeStyle=`rgba(200,220,255,${0.35})`; g.lineWidth=2; for(let j=0;j<7;j++){ const yy=hz+12+j*j*9, off=(now*(18+j*6))%60; g.beginPath(); for(let xx=-60+off;xx<sw+60;xx+=60){ g.moveTo(xx,yy); g.quadraticCurveTo(xx+15,yy-4,xx+30,yy); } g.stroke(); }
  // the floating town in the morning mist
  if(dawn>0){ g.save(); g.globalAlpha=A*dawn; const tx=sw*0.74, ty=hz+4; g.fillStyle='#6a5a6e';
    for(const [dx,w,h] of [[-90,40,22],[-50,30,30],[-18,44,18],[24,34,26],[60,48,16]]) { g.fillRect(tx+dx,ty-h,w,h); g.beginPath(); g.moveTo(tx+dx-4,ty-h); g.lineTo(tx+dx+w/2,ty-h-12); g.lineTo(tx+dx+w+4,ty-h); g.closePath(); g.fill(); }
    g.fillRect(tx+8,ty-62,3,44); g.fillRect(tx-110,ty-3,220,5);
    g.fillStyle='rgba(255,240,240,.55)'; g.fillRect(0,hz-24,sw,30); g.restore(); }
  // the boat (or Glaciar) heading east
  const bs=Math.min(1.6,Math.max(0.9,sw/700));
  if(kind==='glaciar') a4aGlaciar(g,sw*0.46,hz-sh*0.12,bs,now); else a4aBoat(g,sw*0.46,hz+sh*0.12,bs,now);
  // a hundred moths, all flying east
  if(moths>0){ g.fillStyle=`rgba(240,236,255,${0.9*moths})`; g.strokeStyle='rgba(60,50,90,.7)'; g.lineWidth=1;
    for(let i=0;i<60;i++){ const sp=40+(i%7)*14, px=((i*97.3+now*sp)%(sw+80))-40, py=hz*0.2+((i*53.7)%(hz*0.75))+Math.sin(now*3+i)*6, f=0.5+0.5*Math.sin(now*14+i), s=3+(i%3);
      g.beginPath(); g.moveTo(px,py); g.lineTo(px-s,py-s*f); g.lineTo(px-s*0.6,py+s*0.2); g.closePath(); g.moveTo(px,py); g.lineTo(px-s,py+s*f); g.lineTo(px-s*0.6,py-s*0.2); g.closePath(); g.fill(); } }
  g.restore();
}}; }
defineLook('m4a_voyage_ship',a4aVoyage('ship'));
defineLook('m4a_voyage_glaciar',a4aVoyage('glaciar'));
