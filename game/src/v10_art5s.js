// ================= v10_art5s.js (N5S): looks for the finale's friend errands and the Duchess mystery (art only).
// defineLook(id, {w, h, draw(g, x, y, t, state)}) and nothing else. (x, y) is the point on the ground the place stands
// on. Static looks are cached once per state by e10c_gates; `live` parts (glints, a sway) are drawn every frame.
//   n5_vesper_sulk    Vesper sitting on the rim of the Crown, legs over the dark, back to everyone (q_n5_vesper)
//   n5_knot           the silver knot that ties a hundred little white moths in their cocoons (the Moth's Cradle)
//   n5_chewed_tassel  a lantern tassel chewed to a soggy stub, with goat hair (the Bridgefoot)
//   n5_shadow_pen     a black glass copy of a goat pen with a shadow goat in it (the Silent Green)
//   n5_pen_note       a note stuck to a fence post, a muddy hoofprint at the bottom (Hollis Farm)
//   hoof              one two-toed hoof print (the prints place n5_f_prints, look 'hoof')
//   hat_n5_goathorns  Hollis's sock goat horns (the item's hat look)
if(typeof defineLook==='function'){
  const N5S_INK='#1c1328';
  const V5={suit:'#3b2b52',suit2:'#2a1e3c',cloak:'#9e90c2',cloak2:'#6f6296',mask:'#f6f0e6',gold:'#e2b65c',skin:'#e6b896',hair:'#2a2430',streak:'#e4e0ee',silk:'#e8e4f4'};
  const n5Ell=(g,x,y,rx,ry,col,lw,rot)=>{ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,rot||0,0,TAU); g.fill(); if(lw){ g.strokeStyle=N5S_INK; g.lineWidth=lw; g.stroke(); } };
  const n5Shadow=(g,x,y,rx,ry,a)=>{ g.save(); g.globalAlpha=a==null?0.28:a; g.fillStyle='#000'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); g.restore(); };
  const n5Twinkle=(g,x,y,s,a)=>{ g.fillStyle=`rgba(255,255,255,${a})`; g.fillRect(x-s,y-0.6,s*2,1.2); g.fillRect(x-0.6,y-s,1.2,s*2); };
  const n5Halo=(g,x,y,r,rgb,a)=>{ g.save(); g.globalAlpha=a; g.fillStyle=`rgb(${rgb})`; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); g.restore(); };
  // ---------- Vesper sulking on the rim of the Crown: sitting, legs over the edge, back turned, a little lilac huff
  defineLook('n5_vesper_sulk',{w:70,h:80,anim:true,draw(g,x,y,t){
    const k=0.75+0.25*Math.sin(t*2.1); n5Halo(g,x,y-24,34,'190,170,255',0.12*k);
    g.save(); g.translate(x,y); g.scale(1.3,1.3);
    n5Shadow(g,0,1,14,4,0.3);
    // legs dangling over the rim (drawn below her), swinging a little
    const sw=Math.sin(t*1.6)*2;
    g.strokeStyle=N5S_INK; g.lineWidth=4.6; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*4,-4); g.lineTo(s*5+sw*s*0.5,10); g.stroke(); }
    g.strokeStyle=V5.suit2; g.lineWidth=3; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*4,-4); g.lineTo(s*5+sw*s*0.5,10); g.stroke(); }
    // cloak spread on the rock, back to us
    g.fillStyle=V5.cloak; g.strokeStyle=N5S_INK; g.lineWidth=1.6; g.beginPath(); g.moveTo(-12,-2); g.quadraticCurveTo(-14,-22,-6,-30); g.lineTo(6,-30); g.quadraticCurveTo(14,-22,12,-2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=V5.cloak2; g.beginPath(); g.moveTo(-6,-28); g.quadraticCurveTo(0,-20,6,-28); g.lineTo(5,-4); g.lineTo(-5,-4); g.closePath(); g.fill();
    // head from behind: dark hair, the white streak, the mask string
    n5Ell(g,0,-36,7.2,6.8,V5.hair,1.4);
    g.strokeStyle=V5.streak; g.lineWidth=1.6; g.beginPath(); g.moveTo(-3,-42); g.quadraticCurveTo(-1,-37,-3,-31); g.stroke();
    g.strokeStyle=V5.gold; g.lineWidth=1; g.beginPath(); g.moveTo(-7,-37); g.lineTo(7,-37); g.stroke();
    g.restore();
    // a little huff cloud, now and then
    const ph=(t*0.35)%1; if(ph<0.5){ const a=0.55*(1-ph*2); g.fillStyle=`rgba(230,224,250,${a})`; g.beginPath(); g.arc(x+16+ph*14,y-58-ph*16,4+ph*6,0,TAU); g.fill(); }
  }});

  // ---------- the silver knot (state 'loose' after the moths fly free: a few melted threads)
  defineLook('n5_knot',{w:124,h:70,draw(g,x,y,t,state){
    g.save(); g.translate(x,y); g.scale(1.35,1.35);
    const loose=state==='loose';
    // cocoons round the knot
    const C=[[-34,-4],[-24,-14],[-10,-18],[10,-18],[24,-14],[34,-4],[-28,6],[28,6]];
    for(const [cx,cy] of C){ n5Shadow(g,cx,cy+5,6,2,0.25); n5Ell(g,cx,cy,5,7.5,loose?'#6a6488':'#ece8f8',1.4); if(!loose){ g.strokeStyle='#a8a2c4'; g.lineWidth=0.8; for(const k of [-3,0,3]){ g.beginPath(); g.moveTo(cx-4,cy+k); g.lineTo(cx+4,cy+k); g.stroke(); }
      // a little white moth asleep inside each one, wings folded
      n5Ell(g,cx-1.4,cy-1,1.8,3,'#ffffff'); n5Ell(g,cx+1.4,cy-1,1.8,3,'#ffffff'); } }
    if(!loose){
      g.strokeStyle='#c8d4f0'; g.lineWidth=1.3; for(const [cx,cy] of C){ g.beginPath(); g.moveTo(0,-4); g.quadraticCurveTo(cx*0.5,cy*0.5-6,cx,cy); g.stroke(); }
      g.fillStyle='#e6ecff'; g.strokeStyle=N5S_INK; g.lineWidth=1.6; g.beginPath(); g.ellipse(0,-4,7,5,0,0,TAU); g.fill(); g.stroke();
      g.strokeStyle='#9aa8d0'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-5,-6); g.quadraticCurveTo(0,0,5,-6); g.moveTo(-5,-2); g.quadraticCurveTo(0,-8,5,-2); g.stroke();
      // the thread that goes up toward the dark
      g.strokeStyle='rgba(220,228,255,.8)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(0,-8); g.quadraticCurveTo(6,-24,2,-44); g.stroke();
    } else {
      g.strokeStyle='rgba(200,212,240,.5)'; g.lineWidth=1; for(const [cx,cy] of C){ g.beginPath(); g.moveTo(cx*0.6,cy*0.6-2); g.lineTo(cx,cy); g.stroke(); }
    }
    g.restore();
  }, live(g,x,y,t,state){ if(state==='loose') return; const a=0.16+0.1*Math.sin(t*2.4); n5Halo(g,x,y-4,14,'210,220,255',a); const k=Math.sin(t*3.3); if(k>0.5) n5Twinkle(g,x+4,y-9,1+3*(k-0.5),0.9); }});

  // ---------- the chewed tassel at the foot of the first Bridgefoot lantern, a tuft of white goat hair
  defineLook('n5_chewed_tassel',{w:30,h:20,draw(g,x,y){
    g.save(); g.translate(x,y);
    n5Shadow(g,0,1,10,3,0.25);
    g.fillStyle='#c84a3a'; g.strokeStyle=N5S_INK; g.lineWidth=1.3; g.beginPath(); g.moveTo(-6,-2); g.lineTo(-2,-8); g.lineTo(2,-8); g.lineTo(3,-2); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='#a83a2c'; g.lineWidth=1.2; for(const k of [-4,-2,0,2]){ g.beginPath(); g.moveTo(k,-2); g.lineTo(k+(k%4?1:-1),1); g.stroke(); }
    g.fillStyle='rgba(150,190,230,.55)'; g.beginPath(); g.ellipse(-1,1,6,1.6,0,0,TAU); g.fill();
    g.strokeStyle='#f2eee6'; g.lineWidth=1.1; for(const [hx,hy,a] of [[7,-1,-0.6],[9,-2,-0.2],[8,0,0.3]]){ g.beginPath(); g.moveTo(hx,hy); g.lineTo(hx+Math.cos(a)*5,hy+Math.sin(a)*5-2); g.stroke(); }
    g.restore();
  }});

  // ---------- the Silent Green's goat pen: black glass fence, a shadow goat standing perfectly still
  defineLook('n5_shadow_pen',{w:110,h:70,draw(g,x,y){
    g.save(); g.translate(x,y);
    n5Ell(g,0,-6,48,20,'rgba(30,26,48,.55)');
    // fence: back rail, posts, front rail with the gate open
    const post=(px,py)=>{ g.fillStyle='#2a2440'; g.strokeStyle=N5S_INK; g.lineWidth=1.4; g.fillRect(px-2,py-14,4,14); g.strokeRect(px-2,py-14,4,14); g.fillStyle='#6a6290'; g.fillRect(px-2,py-14,4,2); };
    g.strokeStyle='#4a4268'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-46,-18); g.lineTo(46,-18); g.moveTo(-46,-24); g.lineTo(46,-24); g.stroke();
    for(const px of [-46,-23,0,23,46]) post(px,-14);
    // the shadow goat (side on, very still)
    g.fillStyle='#14101e'; g.strokeStyle='#4a4268'; g.lineWidth=1.2;
    g.beginPath(); g.ellipse(2,-14,13,7,0,0,TAU); g.fill(); g.stroke();
    for(const lx of [-6,-2,6,10]){ g.fillRect(lx,-9,2.4,9); }
    g.beginPath(); g.ellipse(-12,-21,5,4.4,-0.3,0,TAU); g.fill(); g.stroke();
    g.strokeStyle='#14101e'; g.lineWidth=2; g.beginPath(); g.moveTo(-13,-24); g.quadraticCurveTo(-11,-31,-6,-30); g.moveTo(-10,-24); g.quadraticCurveTo(-7,-30,-3,-28); g.stroke();
    g.fillStyle='#8a82b0'; g.fillRect(-15,-22,1.6,1.6);
    // front rail with a gap for the gate
    g.strokeStyle='#4a4268'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-46,4); g.lineTo(-10,4); g.moveTo(10,4); g.lineTo(46,4); g.moveTo(-46,-2); g.lineTo(-10,-2); g.moveTo(10,-2); g.lineTo(46,-2); g.stroke();
    for(const px of [-46,-23,-10,10,23,46]) post(px,8);
    g.restore();
  }});

  // ---------- Hollis Farm: a note stuck to the pen's gatepost, a muddy hoofprint at the bottom
  defineLook('n5_pen_note',{w:30,h:44,draw(g,x,y){
    g.save(); g.translate(x,y);
    n5Shadow(g,0,1,6,2,0.3);
    g.fillStyle='#7a5434'; g.strokeStyle=N5S_INK; g.lineWidth=1.6; g.fillRect(-3,-34,6,34); g.strokeRect(-3,-34,6,34);
    g.save(); g.translate(0,-22); g.rotate(-0.08); g.fillStyle='#f6eed6'; g.fillRect(-8,-9,16,18); g.strokeRect(-8,-9,16,18);
      g.fillStyle='#4a3a2a'; g.fillRect(-6,-6,9,1.2); g.fillRect(-6,-3,11,1.2); g.fillRect(-6,0,6,1.2);
      g.fillStyle='#6a4a2a'; g.beginPath(); g.ellipse(-1.6,5,1.6,2.2,0.2,0,TAU); g.ellipse(1.8,5,1.6,2.2,-0.2,0,TAU); g.fill();
      g.fillStyle='#c84a3a'; g.beginPath(); g.arc(0,-8,1.6,0,TAU); g.fill();
    g.restore();
    g.restore();
  }});

  // ---------- one two-toed hoof print (a prints place with look 'hoof' draws one of these per step, pointing +x, centred;
  // see CHANGES.md N5S ENGINE REQUEST 6)
  defineLook('hoof',{w:14,h:12,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(236,240,255,.95)'; g.strokeStyle='rgba(40,46,104,.85)'; g.lineWidth=1.3;
    for(const s of [-1,1]){ g.beginPath(); g.moveTo(-4,s*0.8); g.quadraticCurveTo(-3,s*4.6,2,s*4.2); g.quadraticCurveTo(5,s*3,5,s*0.8); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
  }});

  // ---------- Hollis's goat horns, made from a sock (a hat: drawn centred on the top of Ash's head)
  defineLook('hat_n5_goathorns',{w:30,h:20,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='#e8e0cc'; g.strokeStyle=N5S_INK; g.lineWidth=1.4;
    g.beginPath(); g.ellipse(0,0,9,3.4,0,0,TAU); g.fill(); g.stroke();
    for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*4,-1); g.quadraticCurveTo(s*7,-12,s*14,-10); g.quadraticCurveTo(s*9,-7,s*7,0); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle='#b8a888'; g.lineWidth=0.9; for(const k of [0.3,0.55,0.8]){ g.beginPath(); g.moveTo(s*(4+6*k),-1-9*k); g.lineTo(s*(6+5*k),-1-6*k); g.stroke(); } g.strokeStyle=N5S_INK; g.lineWidth=1.4; }
    g.fillStyle='#c84a3a'; g.fillRect(-2,-2,4,3);
    g.restore();
  }});
}
