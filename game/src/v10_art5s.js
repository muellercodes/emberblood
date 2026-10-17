// ================= v10_art5s.js (N5S): looks for the finale's friend errands and the Duchess mystery (art only).
// defineLook(id, {w, h, draw(g, x, y, t, state)}) and nothing else. (x, y) is the point on the ground the place stands
// on. Static looks are cached once per state by e10c_gates; `live` parts (glints, a sway) are drawn every frame.
//   n5_cracked_mask   Vesper's real moth mask, cracked down the middle, a "Sorry. V." scrap under it (Silk Gallery)
//   n5_vesper_hang    Vesper hanging by one hand off the rim of a Silk Gallery island, a snapped silk line (anim)
//   n5_ice_scale      one of Glaciar's scales, blue as deep ice, half in the snow (the Floe Gap)
//   n5_moth_scale     a white moth scale stuck to a shadow vine, glittering (the Tendril Wood)
//   n5_knot           the silver knot that ties a hundred little white moths in their cocoons (the Moth's Cradle)
//   n5_chewed_tassel  a lantern tassel chewed to a soggy stub, with goat hair (the Bridgefoot)
//   n5_shadow_pen     a black glass copy of a goat pen with a shadow goat in it (the Silent Green)
//   n5_pen_note       a note stuck to a fence post, a muddy hoofprint at the bottom (Hollis Farm)
//   hat_n5_goathorns  Hollis's sock goat horns (for ENG's hat drawing, see CHANGES.md N5S ENGINE REQUEST 7)
if(typeof defineLook==='function'){
  const N5S_INK='#1c1328';
  const V5={suit:'#3b2b52',suit2:'#2a1e3c',cloak:'#9e90c2',cloak2:'#6f6296',mask:'#f6f0e6',gold:'#e2b65c',skin:'#e6b896',hair:'#2a2430',streak:'#e4e0ee',silk:'#e8e4f4'};
  const n5Ell=(g,x,y,rx,ry,col,lw,rot)=>{ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,rot||0,0,TAU); g.fill(); if(lw){ g.strokeStyle=N5S_INK; g.lineWidth=lw; g.stroke(); } };
  const n5Shadow=(g,x,y,rx,ry,a)=>{ g.save(); g.globalAlpha=a==null?0.28:a; g.fillStyle='#000'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); g.restore(); };
  const n5Twinkle=(g,x,y,s,a)=>{ g.fillStyle=`rgba(255,255,255,${a})`; g.fillRect(x-s,y-0.6,s*2,1.2); g.fillRect(x-0.6,y-s,1.2,s*2); };
  const n5Halo=(g,x,y,r,rgb,a)=>{ g.save(); g.globalAlpha=a; g.fillStyle=`rgb(${rgb})`; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); g.restore(); };
  // a moth mask seen from above: two wings of white card with gold trim and two eye holes
  const n5Mask=(g,cracked)=>{
    for(const s of [-1,1]){ g.save(); if(cracked) g.translate(s*1.6,s*0.6);
      g.fillStyle=V5.mask; g.strokeStyle=N5S_INK; g.lineWidth=1.6;
      g.beginPath(); g.moveTo(0,-6); g.quadraticCurveTo(s*10,-13,s*16,-7); g.quadraticCurveTo(s*14,1,s*7,4); g.quadraticCurveTo(s*3,3,0,1); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle=V5.gold; g.lineWidth=1.1; g.beginPath(); g.moveTo(s*2,-5); g.quadraticCurveTo(s*10,-11,s*14,-6.5); g.stroke();
      g.fillStyle=N5S_INK; g.beginPath(); g.ellipse(s*7,-3,2.6,1.8,s*0.3,0,TAU); g.fill();
      g.restore(); }
    if(cracked){ g.strokeStyle=N5S_INK; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,-7); g.lineTo(1.2,-3); g.lineTo(-0.8,0); g.lineTo(0.6,3); g.stroke(); }
  };

  // ---------- Vesper: the cracked mask and the scrap of paper (state 'seen' looks the same)
  defineLook('n5_cracked_mask',{w:40,h:26,draw(g,x,y){
    g.save(); g.translate(x,y);
    n5Shadow(g,0,1,17,4,0.25);
    g.save(); g.translate(7,-2); g.rotate(0.35); g.fillStyle='#efe2c0'; g.strokeStyle=N5S_INK; g.lineWidth=1.2; g.fillRect(-6,-4,12,8); g.strokeRect(-6,-4,12,8);
      g.fillStyle='#4c3a6a'; g.fillRect(-4,-1.6,3,1.2); g.fillRect(0,-1.6,1.4,1.2); g.fillRect(-4,0.8,5,1); g.restore();
    g.translate(-3,-4); g.rotate(-0.15); n5Mask(g,true);
    g.restore();
  }, live(g,x,y,t){ const k=Math.sin(t*2.6); if(k>0.5) n5Twinkle(g,x+9,y-12,1+3*(k-0.5),0.9); }});

  // ---------- Vesper hanging off the rim of an island by one hand (drawn below the rim, swaying a little)
  defineLook('n5_vesper_hang',{w:70,h:96,anim:true,draw(g,x,y,t){
    const sw=Math.sin(t*1.7)*0.09;
    g.save(); g.translate(x,y);
    // the snapped silk line: a loose curl lying over the rim and a frayed end hanging down
    g.strokeStyle=V5.silk; g.lineWidth=1.4; g.beginPath(); g.moveTo(-26,-6); g.bezierCurveTo(-12,-14,6,-2,14,-10); g.stroke();
    g.beginPath(); g.moveTo(14,-10); g.quadraticCurveTo(22,6,18,24+Math.sin(t*2.3)*2); g.stroke();
    // the rim (a lip of black rock) she is holding
    g.fillStyle='#3a3456'; g.strokeStyle=N5S_INK; g.lineWidth=1.6; g.beginPath(); g.moveTo(-18,-2); g.lineTo(18,-2); g.lineTo(14,4); g.lineTo(-14,4); g.closePath(); g.fill(); g.stroke();
    // her hand on the rim, then she swings from the shoulder
    n5Ell(g,-2,-1,3.4,2.6,V5.skin,1.2);
    g.rotate(sw);
    g.strokeStyle=N5S_INK; g.lineWidth=5; g.beginPath(); g.moveTo(-2,0); g.lineTo(-1,16); g.stroke();
    g.strokeStyle=V5.suit; g.lineWidth=3.2; g.beginPath(); g.moveTo(-2,0); g.lineTo(-1,16); g.stroke();
    // cloak fluttering, body, legs kicking over nothing
    g.fillStyle=V5.cloak2; g.strokeStyle=N5S_INK; g.lineWidth=1.6; g.beginPath(); g.moveTo(-6,18); g.quadraticCurveTo(-16,34,-10+Math.sin(t*3)*3,50); g.lineTo(8,46); g.quadraticCurveTo(8,30,6,18); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=V5.suit; g.beginPath(); g.ellipse(0,30,7.5,12,0,0,TAU); g.fill(); g.stroke();
    const kick=Math.sin(t*5)*4;
    g.strokeStyle=N5S_INK; g.lineWidth=4.6; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*3,40); g.lineTo(s*4+(s<0?kick:-kick)*0.5,56); g.stroke(); }
    g.strokeStyle=V5.suit2; g.lineWidth=3; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*3,40); g.lineTo(s*4+(s<0?kick:-kick)*0.5,56); g.stroke(); }
    // the other arm flailing
    g.strokeStyle=N5S_INK; g.lineWidth=4.4; g.beginPath(); g.moveTo(5,22); g.lineTo(15,16+Math.sin(t*4)*4); g.stroke();
    g.strokeStyle=V5.suit; g.lineWidth=2.8; g.beginPath(); g.moveTo(5,22); g.lineTo(15,16+Math.sin(t*4)*4); g.stroke();
    // head: dark hair with the white streak, a bare face (the mask is back on the cliff), looking up
    n5Ell(g,0,14,6.6,6.2,V5.skin,1.4);
    g.fillStyle=V5.hair; g.beginPath(); g.ellipse(0,11.5,7,4.6,0,Math.PI,TAU); g.fill();
    g.strokeStyle=V5.streak; g.lineWidth=1.4; g.beginPath(); g.moveTo(-2,8); g.quadraticCurveTo(-1,12,-3,15); g.stroke();
    g.fillStyle=N5S_INK; g.fillRect(-3,13,1.6,1.8); g.fillRect(1.6,13,1.6,1.8);
    g.restore();
    // a little "!" so a kid looks twice
    const b=Math.abs(Math.sin(t*3))*3; g.fillStyle='#fff3c0'; g.strokeStyle=N5S_INK; g.lineWidth=1.4; g.beginPath(); g.arc(x+20,y-24-b,7,0,TAU); g.fill(); g.stroke();
    g.fillStyle=N5S_INK; g.fillRect(x+19,y-29-b,2,6); g.fillRect(x+19,y-21.5-b,2,2);
  }});

  // ---------- Glaciar's scale, half buried in the snow
  defineLook('n5_ice_scale',{w:44,h:30,draw(g,x,y){
    g.save(); g.translate(x,y);
    n5Ell(g,0,1,19,5,'rgba(220,236,255,.9)');
    g.save(); g.rotate(-0.25);
    g.fillStyle='#5aa0e0'; g.strokeStyle=N5S_INK; g.lineWidth=1.8; g.beginPath(); g.moveTo(-12,-1); g.quadraticCurveTo(-11,-18,0,-22); g.quadraticCurveTo(11,-18,12,-1); g.quadraticCurveTo(0,4,-12,-1); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#a8dcff'; g.beginPath(); g.moveTo(-7,-4); g.quadraticCurveTo(-6,-15,0,-18); g.quadraticCurveTo(-1,-10,-2,-3); g.closePath(); g.fill();
    g.strokeStyle='#2c6aa8'; g.lineWidth=1; for(const k of [-5,0,5]){ g.beginPath(); g.moveTo(k*0.6,-17); g.lineTo(k,-2); g.stroke(); }
    g.restore();
    // snow drifted over its foot
    n5Ell(g,-6,0,11,4.4,'#f4f8ff'); n5Ell(g,7,1,8,3.4,'#eaf2ff');
    g.restore();
  }, live(g,x,y,t){ for(let i=0;i<3;i++){ const k=Math.sin(t*2.2+i*2.1); if(k>0.6) n5Twinkle(g,x-6+i*6,y-16+i*3,1+3*(k-0.6),0.95); } }});

  // ---------- a white moth scale stuck to a shadow vine
  defineLook('n5_moth_scale',{w:36,h:44,draw(g,x,y){
    g.save(); g.translate(x,y);
    n5Shadow(g,0,1,10,3,0.3);
    g.strokeStyle='#120c22'; g.lineWidth=5; g.beginPath(); g.moveTo(-6,2); g.quadraticCurveTo(-12,-14,2,-24); g.quadraticCurveTo(10,-30,6,-38); g.stroke();
    g.strokeStyle='#3a2a5a'; g.lineWidth=2.6; g.beginPath(); g.moveTo(-6,2); g.quadraticCurveTo(-12,-14,2,-24); g.quadraticCurveTo(10,-30,6,-38); g.stroke();
    g.save(); g.translate(1,-24); g.rotate(0.5); n5Ell(g,0,0,6,4,'#f8f6ff',1.2); n5Ell(g,-1,-1,3,2,'#ffffff'); g.restore();
    g.restore();
  }, live(g,x,y,t){ const a=0.18+0.12*Math.sin(t*3); n5Halo(g,x+1,y-24,11,'240,236,255',a); const k=Math.sin(t*4.1); if(k>0.4) n5Twinkle(g,x+3,y-27,1+4*(k-0.4),0.95); }});

  // ---------- the silver knot (state 'loose' after the moths fly free: a few melted threads)
  defineLook('n5_knot',{w:90,h:50,draw(g,x,y,t,state){
    g.save(); g.translate(x,y);
    const loose=state==='loose';
    // cocoons round the knot
    const C=[[-34,-4],[-24,-14],[-10,-18],[10,-18],[24,-14],[34,-4],[-28,6],[28,6]];
    for(const [cx,cy] of C){ n5Shadow(g,cx,cy+5,6,2,0.25); n5Ell(g,cx,cy,5,7.5,loose?'#6a6488':'#d8d4e8',1.4); if(!loose){ g.strokeStyle='#a8a2c4'; g.lineWidth=0.8; for(const k of [-3,0,3]){ g.beginPath(); g.moveTo(cx-4,cy+k); g.lineTo(cx+4,cy+k); g.stroke(); } } }
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
