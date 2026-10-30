// ================= v10_art2a (A2a): art for Act II chapters c_coast, c_salt, c_claws and c_brass (game/story/act2)
// Only looks and poses: defineLook(id, {w, h, draw(g, x, y, t, state)}) for the places those chapters add, and
// definePose('c_mask', pose, draw(g, x, y, t)) for Vesper in the Moth Mask. (x, y) is the point on the ground the
// place or the person stands on. Static parts are baked once into small offscreen canvases (A2A_SPR); only glows,
// twinkles and bobbing are drawn per frame. Colors follow the heist's thief sprite (e7_acts.js TH) so she matches.
reLooksAt();   // (v12 ART23) the looks below get the Realistic repaint (e12d_acts23.js)
const A2A_SPR=new Map();
const A2A_INK='#1c1328';
const A2A_TH={suit:'#3b2b52',suit2:'#2a1e3c',cloak:'#9e90c2',cloak2:'#6f6296',mask:'#f6f0e6',gold:'#e2b65c',spot:'#f2b45a',hood:'#4c3a6a',
  skin:'#e6b896',skin2:'#c8916c',hair:'#2a2430',streak:'#e4e0ee',freck:'#b0704a'};
// bake a sprite once: w x h world px, (ox, oy) is the ground point inside it
function a2aSpr(key,w,h,ox,oy,draw){
  let c=A2A_SPR.get(key); if(c) return c;
  const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), g=cv.getContext('2d');
  g.scale(sc,sc); g.translate(ox,oy); g.lineCap='round'; g.lineJoin='round'; draw(g);
  c={cv,w,h,ox,oy}; A2A_SPR.set(key,c); return c;
}
function a2aPut(g,c,x,y,s,flip){
  s=s||1; g.save(); g.translate(x,y); if(flip) g.scale(-1,1); g.drawImage(c.cv,-c.ox*s,-c.oy*s,c.w*s,c.h*s); g.restore();
}
// a soft round glow, baked per color (no gradient made per frame)
function a2aGlow(g,x,y,r,rgb,a){
  if(a<=0.01) return;
  const c=a2aSpr('glow_'+rgb,64,64,32,32,q=>{ const gr=q.createRadialGradient(0,0,0,0,0,32); gr.addColorStop(0,`rgba(${rgb},1)`); gr.addColorStop(0.45,`rgba(${rgb},.45)`); gr.addColorStop(1,`rgba(${rgb},0)`); q.fillStyle=gr; q.fillRect(-32,-32,64,64); });
  g.save(); g.globalAlpha=a; g.globalCompositeOperation='lighter'; g.drawImage(c.cv,x-r,y-r,r*2,r*2); g.restore();
}
const a2aNight=()=>{ try{ return 1-clamp(daylight(),0,1); }catch(e){ return 0; } };
function a2aEll(g,x,y,rx,ry,col,stroke){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); if(stroke){ g.strokeStyle=A2A_INK; g.lineWidth=stroke; g.stroke(); } }
function a2aShadow(g,x,y,rx,ry,a){ g.save(); g.globalAlpha=a==null?0.28:a; g.fillStyle='#000'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); g.restore(); }

// ---------- nothing (a place's state after it has been picked up)
defineLook('a2a_empty',{w:1,h:1,draw(){}});

// ---------- c_coast: Gerald, fainted flat on his back, legs in the air, silver from horns to hooves
defineLook('a2a_silver_sheep',{w:46,h:36,draw(g,x,y,t){
  const c=a2aSpr('sheep',64,52,32,40,q=>{
    q.save(); q.globalAlpha=0.28; q.fillStyle='#000'; q.beginPath(); q.ellipse(0,2,24,6,0,0,TAU); q.fill(); q.restore();
    // four legs sticking straight up, little black hooves
    q.strokeStyle=A2A_INK; q.lineWidth=4.6; for(const lx of [-11,-4,5,12]){ q.beginPath(); q.moveTo(lx,-12); q.lineTo(lx+(lx<0?-2:2),-30); q.stroke(); }
    q.strokeStyle='#7c8090'; q.lineWidth=2.6; for(const lx of [-11,-4,5,12]){ q.beginPath(); q.moveTo(lx,-12); q.lineTo(lx+(lx<0?-2:2),-28); q.stroke(); }
    q.fillStyle='#2a2430'; for(const lx of [-11,-4,5,12]){ q.beginPath(); q.ellipse(lx+(lx<0?-2:2),-31,2.4,2,0,0,TAU); q.fill(); }
    // the fluffy silver body (lying on its back, so the belly bumps are on top)
    const puffs=[[-14,-6,9],[-5,-9,10],[6,-9,10],[15,-5,8],[-8,-2,9],[3,-1,10],[13,0,7]];
    q.lineWidth=2.2; q.strokeStyle=A2A_INK; for(const [px,py,r] of puffs){ q.beginPath(); q.arc(px,py,r+1,0,TAU); q.stroke(); }
    for(const [px,py,r] of puffs) a2aEll(q,px,py,r,r,'#b4b8c8');
    for(const [px,py,r] of puffs) a2aEll(q,px-2,py-2,r*0.68,r*0.68,'#dfe2ee');
    for(const [px,py,r] of puffs) a2aEll(q,px-3.5,py-3.5,r*0.28,r*0.28,'#ffffff');
    // the head on its side, upside down: grey face, droopy ears, X eyes (fainted)
    a2aEll(q,-25,-3,7.5,6,'#6e7282',2); a2aEll(q,-24,-12,3,5,'#8a8ea0',1.6); a2aEll(q,-25,5,3,4.6,'#8a8ea0',1.6);
    a2aEll(q,-31,-2,2.6,2.2,'#4a4e5c');
    q.strokeStyle='#f4f4fa'; q.lineWidth=1.3; for(const ey of [-5,0]){ q.beginPath(); q.moveTo(-27,ey-1.4); q.lineTo(-24.4,ey+1.4); q.moveTo(-27,ey+1.4); q.lineTo(-24.4,ey-1.4); q.stroke(); }
    // silver dust on the grass around him
    q.fillStyle='rgba(226,230,246,.85)'; for(let i=0;i<14;i++){ const a=i*2.4, d=18+((i*7)%11); q.fillRect(Math.cos(a)*d*1.3,Math.sin(a)*d*0.45-1,1.6,1.6); }
  });
  a2aPut(g,c,x,y,0.8);
  // glitter that twinkles
  for(let i=0;i<6;i++){ const k=Math.sin(t*3+i*1.7); if(k<0.55) continue; const px=x-13+((i*13)%27), py=y-15+((i*7)%11), s=1+2*(k-0.55);
    g.fillStyle='rgba(255,255,255,.95)'; g.fillRect(px-s,py-0.5,s*2,1); g.fillRect(px-0.5,py-s,1,s*2); }
}});

// ---------- c_salt: a little tin gift lantern on a windowsill, stamped with a moth (glows at night)
defineLook('a2a_gift_lantern',{w:20,h:32,draw(g,x,y,t){
  const c=a2aSpr('glant',26,40,13,34,q=>{
    a2aShadow(q,0,1,7,2.4,0.25);
    q.strokeStyle=A2A_INK; q.lineWidth=1.6;
    // the handle and its tag
    q.beginPath(); q.arc(0,-25,4.2,Math.PI,0); q.stroke(); q.fillStyle='#efe2c4'; q.save(); q.translate(5,-24); q.rotate(0.5); q.fillRect(0,-2,6,4); q.strokeRect(0,-2,6,4); q.restore();
    // tin body, warm glass, roof
    q.fillStyle='#8c919c'; q.fillRect(-6.5,-21,13,20); q.strokeRect(-6.5,-21,13,20);
    q.fillStyle='#ffd77a'; q.fillRect(-4.5,-18.5,9,14); q.fillStyle='#ffecb0'; q.fillRect(-4.5,-18.5,3,14);
    q.fillStyle='#6a6e78'; q.beginPath(); q.moveTo(-8,-21); q.lineTo(0,-26); q.lineTo(8,-21); q.closePath(); q.fill(); q.stroke();
    q.fillRect(-7.5,-2.5,15,3); q.strokeRect(-7.5,-2.5,15,3);
    // the moth stamped on the glass
    q.fillStyle='#4c3a6a'; q.beginPath(); q.ellipse(-2.2,-12,2.4,3.4,-0.5,0,TAU); q.ellipse(2.2,-12,2.4,3.4,0.5,0,TAU); q.fill();
    q.fillStyle='#2a1e3c'; q.fillRect(-0.5,-14.5,1,5);
  });
  const n=a2aNight(), fl=0.85+0.15*Math.sin(t*7+x);
  a2aGlow(g,x,y-12,26+6*n,'255,206,120',(0.18+0.55*n)*fl);
  a2aPut(g,c,x,y);
}});

// ---------- c_claws: four deep claw scratches in the rock at the lip of Gullcrag Head
defineLook('a2a_claw_marks',{w:36,h:20,draw(g,x,y){
  const c=a2aSpr('claws',40,24,20,12,q=>{
    for(let i=0;i<4;i++){ const ox=-12+i*7.5;
      q.strokeStyle='rgba(20,14,24,.8)'; q.lineWidth=3.2; q.beginPath(); q.moveTo(ox-2,-8); q.quadraticCurveTo(ox+3,-1,ox+1,8); q.stroke();
      q.strokeStyle='rgba(235,230,214,.85)'; q.lineWidth=1.1; q.beginPath(); q.moveTo(ox-0.6,-8.4); q.quadraticCurveTo(ox+4.4,-1.4,ox+2.4,7.6); q.stroke(); }
    q.fillStyle='rgba(210,200,180,.7)'; for(let i=0;i<8;i++) q.fillRect(-14+i*4,9+(i%3),1.6,1.2);
  });
  a2aPut(g,c,x,y);
}});

// ---------- c_brass, in the Moth's Nest: everything she ever stole, in a glowing circle under the window
defineLook('a2a_glow_pile',{w:96,h:66,draw(g,x,y,t){
  const pu=0.8+0.2*Math.sin(t*1.6);
  a2aGlow(g,x,y-10,62,'255,214,140',0.32*pu);
  const c=a2aSpr('pile',104,74,52,44,q=>{
    // an old sail laid out as a cloth, a ring of shells round its edge
    a2aEll(q,0,0,44,20,'#d8ccb0',2); a2aEll(q,0,-1,39,16,'#e8dec6');
    q.fillStyle='#f4ead8'; for(let i=0;i<14;i++){ const a=i/14*TAU; q.beginPath(); q.arc(Math.cos(a)*41,Math.sin(a)*18,1.8,0,TAU); q.fill(); }
    q.strokeStyle=A2A_INK; q.lineWidth=1.6;
    // a brass glow-lamp (left)
    q.fillStyle='#c8963a'; q.fillRect(-34,-22,12,18); q.strokeRect(-34,-22,12,18); q.fillStyle='#fff0b0'; q.fillRect(-31.5,-19,7,12);
    q.fillStyle='#8a6420'; q.beginPath(); q.moveTo(-36,-22); q.lineTo(-28,-28); q.lineTo(-20,-22); q.closePath(); q.fill(); q.stroke();
    // a jar of glowworms
    q.fillStyle='rgba(190,230,210,.55)'; q.beginPath(); q.ellipse(-14,-12,7,10,0,0,TAU); q.fill(); q.stroke(); q.fillStyle='#8a6a3a'; q.fillRect(-19,-24,10,4); q.strokeRect(-19,-24,10,4);
    q.fillStyle='#b8ff7a'; for(const [gx,gy] of [[-16,-14],[-12,-9],[-14,-6],[-11,-15],[-17,-9]]){ q.beginPath(); q.arc(gx,gy,1.3,0,TAU); q.fill(); }
    // a silver moon-dial
    a2aEll(q,2,-6,9,4.5,'#c8ccd8',1.6); q.fillStyle='#f4f6ff'; q.beginPath(); q.arc(2,-8,4.5,0.6,TAU-0.6); q.fill(); q.fillStyle='#c8ccd8'; q.beginPath(); q.arc(4,-9,3.6,0,TAU); q.fill();
    // Lord Whirligig's gold candlestick
    q.fillStyle='#e2b65c'; q.fillRect(16,-28,4,22); q.strokeRect(16,-28,4,22); a2aEll(q,18,-5,7,2.6,'#e2b65c',1.6); q.fillStyle='#f6f0e0'; q.fillRect(15.5,-36,5,8); q.strokeRect(15.5,-36,5,8);
    // Bob's hat: a blue guard's helmet with a plume and a little glowing badge
    q.fillStyle='#a8acb8'; q.beginPath(); q.ellipse(30,-6,9,6,0,Math.PI,0); q.fill(); q.stroke(); q.fillRect(20,-6,20,3); q.strokeRect(20,-6,20,3);
    q.fillStyle='#3a6ac8'; q.beginPath(); q.moveTo(30,-12); q.quadraticCurveTo(38,-22,33,-24); q.quadraticCurveTo(29,-18,30,-12); q.fill(); q.stroke();
    q.fillStyle='#ffe07a'; q.beginPath(); q.arc(30,-8,2.2,0,TAU); q.fill();
    // glowing shells and a glass float in front
    q.fillStyle='#bfe8ff'; q.beginPath(); q.arc(-24,6,4,0,TAU); q.fill(); q.stroke(); q.fillStyle='#ffd0e8'; q.beginPath(); q.ellipse(10,7,4.5,3,0.3,0,TAU); q.fill(); q.stroke();
    q.fillStyle='#ffe9a8'; q.beginPath(); q.ellipse(-4,8,3.5,2.6,-0.3,0,TAU); q.fill(); q.stroke();
  });
  a2aPut(g,c,x,y);
  // the lights inside them breathe
  a2aGlow(g,x-28,y-58,10,'255,236,160',0.8*pu); a2aGlow(g,x+18,y-80,7,'255,200,110',0.9*(0.7+0.3*Math.sin(t*9)));
  a2aGlow(g,x-14,y-56,9,'180,255,140',0.7*pu); a2aGlow(g,x+30,y-52,5,'255,230,120',0.9*pu);
  a2aGlow(g,x+2,y-52,8,'220,230,255',0.5*pu);
}});

// ---------- c_brass: Vesper's dream diary (a little blue book with a moon on it)
defineLook('a2a_moon_diary',{w:22,h:16,draw(g,x,y,t){
  const c=a2aSpr('diary',26,20,13,12,q=>{
    a2aShadow(q,1,3,10,3,0.25);
    q.strokeStyle=A2A_INK; q.lineWidth=1.6; q.fillStyle='#3a4a8a'; q.save(); q.rotate(-0.18); q.fillRect(-9,-7,18,12); q.strokeRect(-9,-7,18,12);
    q.fillStyle='#efe6d0'; q.fillRect(-8,4,16,1.6);
    q.fillStyle='#ffd86a'; q.beginPath(); q.arc(1,-1,4,0.5,TAU-0.5); q.fill(); q.fillStyle='#3a4a8a'; q.beginPath(); q.arc(2.6,-2,3.4,0,TAU); q.fill();
    q.fillStyle='#ffe9a8'; q.fillRect(-6,-5,1.2,1.2); q.fillRect(5,2,1.2,1.2); q.restore();
  });
  a2aGlow(g,x,y-2,12,'200,190,255',0.18+0.08*Math.sin(t*2));
  a2aPut(g,c,x,y);
}});

// ---------- c_brass: Gran's letters, a bundle tied with string (on the crate table)
defineLook('a2a_letters',{w:22,h:16,draw(g,x,y){
  const c=a2aSpr('letters',26,20,13,14,q=>{
    q.strokeStyle=A2A_INK; q.lineWidth=1.4;
    for(let i=0;i<3;i++){ q.fillStyle=['#efe2c4','#f6ecd6','#e8dab8'][i]; q.save(); q.translate(0,-i*2); q.rotate(-0.12+i*0.1); q.fillRect(-8,-6,16,10); q.strokeRect(-8,-6,16,10); q.beginPath(); q.moveTo(-8,-6); q.lineTo(0,0); q.lineTo(8,-6); q.stroke(); q.restore(); }
    q.strokeStyle='#a0442a'; q.lineWidth=1.4; q.beginPath(); q.moveTo(-9,-3); q.lineTo(9,-3); q.moveTo(0,-11); q.lineTo(0,5); q.stroke();
    q.fillStyle='#a0442a'; q.beginPath(); q.arc(0,-3,1.6,0,TAU); q.fill();
  });
  a2aPut(g,c,x,y);
}});

// ---------- c_brass: note 2, pinned to the great bell (drawn on the bell, above its point)
defineLook('a2a_bell_note',{w:18,h:22,draw(g,x,y,t){
  const c=a2aSpr('note2',22,26,11,13,q=>{
    q.save(); q.rotate(0.12); q.fillStyle='#f4ecd8'; q.strokeStyle=A2A_INK; q.lineWidth=1.4; q.fillRect(-8,-10,16,20); q.strokeRect(-8,-10,16,20);
    q.strokeStyle='rgba(60,50,80,.6)'; q.lineWidth=1; for(let i=0;i<4;i++){ q.beginPath(); q.moveTo(-5,-5+i*4); q.lineTo(4-(i%2)*3,-5+i*4); q.stroke(); }
    q.fillStyle='#c8302a'; q.beginPath(); q.arc(0,-9,1.8,0,TAU); q.fill(); q.restore();
  });
  a2aPut(g,c,x-2,y-18+Math.sin(t*1.3)*0.6);
}});

// ---------- c_brass: the clockwork magpie on the bell beam (drawn on the beam, 78 px above its point)
defineLook('a2a_magpie',{w:36,h:26,draw(g,x,y,t){
  const c=a2aSpr('magpie',40,30,18,20,q=>{
    q.strokeStyle=A2A_INK; q.lineWidth=1.8;
    // tail, body, wing, head, beak
    q.fillStyle='#8a6420'; q.beginPath(); q.moveTo(-8,-4); q.lineTo(-18,-8); q.lineTo(-17,-3); q.closePath(); q.fill(); q.stroke();
    a2aEll(q,0,-4,10,6,'#c89a3a',1.8); q.fillStyle='#e8c060'; q.beginPath(); q.ellipse(-1,-6,5,2.6,0.2,0,TAU); q.fill();
    q.fillStyle='#a87a2a'; q.beginPath(); q.moveTo(-6,-6); q.quadraticCurveTo(2,-12,6,-4); q.quadraticCurveTo(0,-2,-6,-6); q.fill(); q.stroke();
    a2aEll(q,9,-9,5,4.6,'#c89a3a',1.8);
    q.fillStyle='#4a3a1a'; q.beginPath(); q.moveTo(13,-10); q.lineTo(19,-8.5); q.lineTo(13,-7); q.closePath(); q.fill(); q.stroke();
    q.fillStyle='#bfe8ff'; q.beginPath(); q.arc(10,-10,1.8,0,TAU); q.fill();
    // little rivets and legs
    q.fillStyle='#6a4a1a'; q.fillRect(-3,-4,1.2,1.2); q.fillRect(2,-3,1.2,1.2);
    q.strokeStyle='#4a3a1a'; q.lineWidth=1.2; q.beginPath(); q.moveTo(-1,2); q.lineTo(-1,6); q.moveTo(3,2); q.lineTo(3,6); q.stroke();
  });
  const by=y-78+Math.sin(t*3)*1.1, tilt=Math.sin(t*0.7)>0.85?0.25:0;
  g.save(); g.translate(x,by); g.rotate(tilt); a2aPut(g,c,0,0); g.restore();
  if(Math.sin(t*1.9+1)>0.97) a2aGlow(g,x+10,by-10,5,'200,240,255',0.9);
}});

// ---------- c_brass, by the Brassworks gate: a hanky tied to a little stake, with a note tucked in (it flutters)
defineLook('a2a_hanky',{w:26,h:40,draw(g,x,y,t){
  const c=a2aSpr('hanky',30,46,15,42,q=>{
    a2aShadow(q,1,1,8,2.6,0.25);
    q.strokeStyle=A2A_INK; q.lineWidth=1.6;
    q.fillStyle='#8a6a42'; q.fillRect(-2,-34,4,34); q.strokeRect(-2,-34,4,34);
    // the bundle: a white hanky with blue checks, knotted at the top
    q.fillStyle='#f6f2ea'; q.beginPath(); q.moveTo(-9,-22); q.quadraticCurveTo(-11,-10,-3,-8); q.lineTo(5,-8); q.quadraticCurveTo(12,-12,9,-22); q.quadraticCurveTo(0,-27,-9,-22); q.closePath(); q.fill(); q.stroke();
    q.strokeStyle='rgba(70,110,190,.75)'; q.lineWidth=1; for(let i=0;i<3;i++){ q.beginPath(); q.moveTo(-8+i*6,-21); q.lineTo(-6+i*6,-9); q.stroke(); q.beginPath(); q.moveTo(-9,-18+i*4); q.lineTo(9,-18+i*4); q.stroke(); }
    q.fillStyle='#f6f2ea'; q.strokeStyle=A2A_INK; q.lineWidth=1.4; q.beginPath(); q.ellipse(-3,-27,3,2.4,-0.4,0,TAU); q.ellipse(3,-27,3,2.4,0.4,0,TAU); q.fill(); q.stroke();
    // the note, tucked under the knot, signed V
    q.fillStyle='#efe2c4'; q.save(); q.translate(6,-30); q.rotate(0.35); q.fillRect(0,-4,9,8); q.strokeRect(0,-4,9,8); q.fillStyle='#4c3a6a'; q.font='bold 6px sans-serif'; q.fillText('V',2.5,2.5); q.restore();
  });
  const fl=Math.sin(t*3.1)*0.06;
  g.save(); g.translate(x,y); g.rotate(fl*0.3); a2aPut(g,c,0,0); g.restore();
}});

// ---------- Vesper in the Moth Mask: 'glide' (arrival, the cliff), 'sit' (the cliff edge), 'unmask' (the chimney)
// the parts shared by the poses, drawn into a baking context q (facing right, feet at 0,0)
function a2aHood(q,hx,hy,mask){
  q.lineWidth=2; q.strokeStyle=A2A_INK; q.fillStyle=A2A_TH.hood; q.beginPath(); q.arc(hx,hy,9.4,0,TAU); q.fill(); q.stroke();
  for(const s of [-1,1]){ q.strokeStyle=A2A_TH.gold; q.lineWidth=1.5; q.beginPath(); q.moveTo(hx+s*3,hy-8); q.quadraticCurveTo(hx+s*6,hy-18,hx+s*14,hy-21); q.stroke();
    for(let i=1;i<5;i++){ const k=i/5, px=hx+s*(3+k*10), py=hy-8-k*12; q.beginPath(); q.moveTo(px,py); q.lineTo(px+s*3,py-3); q.stroke(); } }
  if(mask){ q.fillStyle=A2A_TH.mask; q.strokeStyle=A2A_INK; q.lineWidth=1.7; q.beginPath(); q.moveTo(hx-1,hy-6); q.quadraticCurveTo(hx+10,hy-8,hx+10.8,hy); q.quadraticCurveTo(hx+9.5,hy+7.5,hx+1.5,hy+7.5); q.quadraticCurveTo(hx-3,hy+1,hx-1,hy-6); q.closePath(); q.fill(); q.stroke();
    q.fillStyle=A2A_INK; q.beginPath(); q.ellipse(hx+6,hy-0.5,2.8,1.3,-0.35,0,TAU); q.fill(); }
}
function a2aWings(q,cy){
  for(const s of [-1,1]){
    q.lineWidth=2.1; q.strokeStyle=A2A_INK;
    q.beginPath(); q.moveTo(s*2,cy-7); q.bezierCurveTo(s*14,cy-36,s*46,cy-42,s*52,cy-22); q.bezierCurveTo(s*55,cy-10,s*38,cy-1,s*6,cy); q.closePath(); q.fillStyle=A2A_TH.cloak; q.fill(); q.stroke();
    q.beginPath(); q.moveTo(s*3,cy); q.bezierCurveTo(s*28,cy+2,s*42,cy+18,s*30,cy+27); q.bezierCurveTo(s*18,cy+32,s*8,cy+20,s*3,cy+9); q.closePath(); q.fillStyle=A2A_TH.cloak2; q.fill(); q.stroke();
    q.strokeStyle='rgba(40,28,60,.45)'; q.lineWidth=1.1; q.beginPath(); q.moveTo(s*5,cy-6); q.lineTo(s*44,cy-28); q.moveTo(s*5,cy-4); q.lineTo(s*48,cy-14); q.moveTo(s*5,cy+2); q.lineTo(s*30,cy+20); q.stroke();
    q.lineWidth=2; q.strokeStyle=A2A_INK; q.fillStyle=A2A_TH.spot; q.beginPath(); q.arc(s*34,cy-21,7,0,TAU); q.fill(); q.stroke();
    q.fillStyle=A2A_INK; q.beginPath(); q.arc(s*34,cy-21,3.2,0,TAU); q.fill(); q.fillStyle='#fff'; q.beginPath(); q.arc(s*33,cy-22.5,1.2,0,TAU); q.fill();
  }
}
// gliding: wings spread, high in the air, her shadow on the ground far below
definePose('c_mask','glide',(g,x,y,t)=>{
  const c=a2aSpr('v_glide',120,96,60,70,q=>{
    a2aWings(q,-26);
    q.lineCap='round'; q.strokeStyle=A2A_INK; q.lineWidth=5.2; q.beginPath(); q.moveTo(-3,-14); q.lineTo(-6,-2); q.moveTo(3,-14); q.lineTo(5,-2); q.stroke();
    q.strokeStyle=A2A_TH.suit2; q.lineWidth=3; q.beginPath(); q.moveTo(-3,-14); q.lineTo(-6,-2); q.moveTo(3,-14); q.lineTo(5,-2); q.stroke();
    q.lineWidth=2.1; q.strokeStyle=A2A_INK; q.fillStyle=A2A_TH.suit; q.beginPath(); q.ellipse(0,-22,7.4,10.4,0,0,TAU); q.fill(); q.stroke();
    q.fillStyle=A2A_TH.gold; q.fillRect(-7,-17,14,2.4);
    a2aHood(q,0,-39,true);
  });
  const bob=Math.sin(t*2.4)*3, lift=64+bob;
  a2aShadow(g,x,y+2,16,5,0.22);
  a2aGlow(g,x,y-lift-26,34,'200,190,255',0.25*a2aNight());
  a2aPut(g,c,x,y-lift,0.82);
});
// sitting on a cliff edge, facing out to sea (west), legs dangling over the drop, cloak spread behind her
definePose('c_mask','sit',(g,x,y,t)=>{
  const c=a2aSpr('v_sit',84,74,42,56,q=>{
    a2aShadow(q,6,2,20,6,0.25);
    // the cloak, pooled on the rock behind her
    q.lineWidth=2.1; q.strokeStyle=A2A_INK; q.fillStyle=A2A_TH.cloak; q.beginPath(); q.moveTo(-4,-30); q.quadraticCurveTo(18,-26,24,-4); q.quadraticCurveTo(10,4,-6,0); q.quadraticCurveTo(-8,-16,-4,-30); q.closePath(); q.fill(); q.stroke();
    q.fillStyle=A2A_TH.spot; q.beginPath(); q.arc(12,-10,3.6,0,TAU); q.fill(); q.stroke();
    // legs over the edge (forward and down, toward the sea)
    q.lineCap='round'; q.strokeStyle=A2A_INK; q.lineWidth=5.4; q.beginPath(); q.moveTo(-4,-8); q.lineTo(-14,-6); q.lineTo(-16,4); q.moveTo(0,-7); q.lineTo(-10,-3); q.lineTo(-11,7); q.stroke();
    q.strokeStyle=A2A_TH.suit2; q.lineWidth=3.2; q.beginPath(); q.moveTo(-4,-8); q.lineTo(-14,-6); q.lineTo(-16,4); q.moveTo(0,-7); q.lineTo(-10,-3); q.lineTo(-11,7); q.stroke();
    // body leaning back on one hand
    q.lineWidth=2.1; q.strokeStyle=A2A_INK; q.fillStyle=A2A_TH.suit; q.beginPath(); q.ellipse(0,-18,7.2,10,0.15,0,TAU); q.fill(); q.stroke();
    q.fillStyle=A2A_TH.gold; q.fillRect(-6.5,-12,13,2.4);
    q.strokeStyle=A2A_INK; q.lineWidth=4.6; q.beginPath(); q.moveTo(4,-22); q.lineTo(12,-12); q.stroke(); q.strokeStyle=A2A_TH.suit; q.lineWidth=2.8; q.beginPath(); q.moveTo(4,-22); q.lineTo(12,-12); q.stroke();
    // her thin tail, curled on the rock
    q.strokeStyle=A2A_INK; q.lineWidth=3.2; q.beginPath(); q.moveTo(6,-6); q.quadraticCurveTo(22,0,26,-8); q.quadraticCurveTo(28,-14,23,-14); q.stroke();
    q.strokeStyle='#5a4a6a'; q.lineWidth=1.6; q.beginPath(); q.moveTo(6,-6); q.quadraticCurveTo(22,0,26,-8); q.quadraticCurveTo(28,-14,23,-14); q.stroke();
    a2aHood(q,-2,-35,true);
  });
  // facing west (left): the sprite is drawn mirrored; a slow swing of the dangling feet
  const sw=Math.sin(t*2)*0.8;
  a2aPut(g,c,x,y+sw*0.2,1,true);
  a2aGlow(g,x,y-34,30,'200,190,255',0.22*a2aNight());
});
// perched on a chimney cap (52 px above her point), crouched, the mask pushed up: her face for the first time
definePose('c_mask','unmask',(g,x,y,t)=>{
  const c=a2aSpr('v_unmask',96,96,48,76,q=>{
    // the cloak hanging down over the back of the chimney
    q.lineWidth=2.1; q.strokeStyle=A2A_INK; q.fillStyle=A2A_TH.cloak2; q.beginPath(); q.moveTo(-8,-34); q.quadraticCurveTo(-22,-14,-16,8); q.lineTo(14,8); q.quadraticCurveTo(20,-14,8,-34); q.closePath(); q.fill(); q.stroke();
    q.fillStyle=A2A_TH.cloak; q.beginPath(); q.moveTo(-7,-34); q.quadraticCurveTo(-14,-18,-10,-2); q.lineTo(9,-2); q.quadraticCurveTo(13,-18,7,-34); q.closePath(); q.fill(); q.stroke();
    q.fillStyle=A2A_TH.spot; for(const s of [-1,1]){ q.beginPath(); q.arc(s*11,2,3.4,0,TAU); q.fill(); q.stroke(); }
    // crouched legs, knees up
    q.lineCap='round'; q.strokeStyle=A2A_INK; q.lineWidth=5.4; q.beginPath(); q.moveTo(-4,-12); q.lineTo(-9,-20); q.lineTo(-7,-2); q.moveTo(4,-12); q.lineTo(9,-20); q.lineTo(7,-2); q.stroke();
    q.strokeStyle=A2A_TH.suit2; q.lineWidth=3.2; q.beginPath(); q.moveTo(-4,-12); q.lineTo(-9,-20); q.lineTo(-7,-2); q.moveTo(4,-12); q.lineTo(9,-20); q.lineTo(7,-2); q.stroke();
    // body
    q.lineWidth=2.1; q.strokeStyle=A2A_INK; q.fillStyle=A2A_TH.suit; q.beginPath(); q.ellipse(0,-24,7.4,9.6,0,0,TAU); q.fill(); q.stroke();
    q.fillStyle=A2A_TH.gold; q.fillRect(-7,-19,14,2.4);
    // the arm that pushed the mask up, still raised to her forehead
    q.strokeStyle=A2A_INK; q.lineWidth=4.8; q.beginPath(); q.moveTo(5,-28); q.lineTo(12,-36); q.lineTo(7,-46); q.stroke();
    q.strokeStyle=A2A_TH.suit; q.lineWidth=3; q.beginPath(); q.moveTo(5,-28); q.lineTo(12,-36); q.lineTo(7,-46); q.stroke();
    // her face: hood down, dark hair with one silver streak, freckles, a big grin
    const hx=0, hy=-42;
    q.fillStyle=A2A_TH.hood; q.strokeStyle=A2A_INK; q.lineWidth=2; q.beginPath(); q.ellipse(hx,hy+7,11,5,0,0,TAU); q.fill(); q.stroke();
    q.fillStyle=A2A_TH.hair; q.beginPath(); q.arc(hx,hy-1,9.6,0,TAU); q.fill(); q.stroke();
    q.beginPath(); q.moveTo(hx-7,hy+2); q.quadraticCurveTo(hx-13,hy+10,hx-9,hy+16); q.lineWidth=3.4; q.strokeStyle=A2A_TH.hair; q.stroke();
    q.fillStyle=A2A_TH.skin; q.lineWidth=1.7; q.strokeStyle=A2A_INK; q.beginPath(); q.ellipse(hx+1,hy+2,7.4,7.8,0,0,TAU); q.fill(); q.stroke();
    q.strokeStyle=A2A_TH.streak; q.lineWidth=2; q.beginPath(); q.moveTo(hx-4,hy-9); q.quadraticCurveTo(hx-1,hy-4,hx-5,hy+1); q.stroke();
    q.fillStyle=A2A_TH.hair; q.beginPath(); q.moveTo(hx-6,hy-3); q.quadraticCurveTo(hx+2,hy-9,hx+8,hy-3); q.quadraticCurveTo(hx+2,hy-6,hx-6,hy-3); q.fill();
    q.fillStyle=A2A_INK; q.beginPath(); q.arc(hx-1.5,hy+1.5,1.1,0,TAU); q.arc(hx+4,hy+1.5,1.1,0,TAU); q.fill();
    q.strokeStyle=A2A_INK; q.lineWidth=1.2; q.beginPath(); q.arc(hx+1.4,hy+4.4,3,0.15,Math.PI-0.15); q.stroke();
    q.fillStyle=A2A_TH.freck; for(const [fx,fy] of [[-3.6,3.6],[-2.4,4.6],[6,3.6],[7,4.6],[-4.4,4.6]]) q.fillRect(hx+fx,hy+fy,0.9,0.9);
    q.fillStyle='rgba(230,120,120,.35)'; q.beginPath(); q.arc(hx-3.6,hy+4.6,1.8,0,TAU); q.arc(hx+6.4,hy+4.6,1.8,0,TAU); q.fill();
    // the mask pushed up on her forehead, antennae and all
    q.fillStyle=A2A_TH.mask; q.strokeStyle=A2A_INK; q.lineWidth=1.6; q.beginPath(); q.moveTo(hx-8,hy-6); q.quadraticCurveTo(hx+1,hy-15,hx+10,hy-6); q.quadraticCurveTo(hx+5,hy-3,hx+1,hy-5); q.quadraticCurveTo(hx-3,hy-3,hx-8,hy-6); q.closePath(); q.fill(); q.stroke();
    q.fillStyle=A2A_INK; q.beginPath(); q.ellipse(hx-3,hy-8.4,1.8,0.9,0.3,0,TAU); q.ellipse(hx+5,hy-8.4,1.8,0.9,-0.3,0,TAU); q.fill();
    for(const s of [-1,1]){ q.strokeStyle=A2A_TH.gold; q.lineWidth=1.5; q.beginPath(); q.moveTo(hx+1+s*3,hy-11); q.quadraticCurveTo(hx+1+s*6,hy-20,hx+1+s*14,hy-22); q.stroke();
      for(let i=1;i<5;i++){ const k=i/5, px=hx+1+s*(3+k*10), py=hy-11-k*10; q.beginPath(); q.moveTo(px,py); q.lineTo(px+s*3,py-3); q.stroke(); } }
  });
  const breathe=Math.sin(t*2.2)*0.5, lift=52;
  a2aGlow(g,x,y-lift-40,40,'210,200,255',0.18+0.3*a2aNight());
  a2aPut(g,c,x,y-lift+breathe);
});
reLooksMine();
