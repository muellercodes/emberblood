// ================= v10_art5b.js (N5b): looks for the finale's summit and ending data (art only).
// Each look is drawn at its place's (x, y), the point it stands on. Static looks are cached once per state by the gate
// library; `live` adds the glows each frame (cheap: one or two radial fills).
//   moon_lock_carving   a moon-glass stone by the Moon Lock, carved with a little moth hugging a thin moon (n_glass)
//   green_fourth_post   the fourth lantern post back on the Emberhollow green (n_end); state 'moth': a tiny grey moth
//                       visiting on its top
//   cocoon_knot         the silver leash knot that holds Hush's hundred little moths in the Moth's Cradle cocoons
//                       (for N5S's q_n5_hush); states 'tied' (default) and 'melted' (a few loose threads)
if(typeof defineLook==='function'){ const N5B_INK='#1c1628';
  const n5bGlow=(g,x,y,r,col,a)=>{ const q=g.createRadialGradient(x,y,0,x,y,r); q.addColorStop(0,`rgba(${col},${a})`); q.addColorStop(1,`rgba(${col},0)`); g.fillStyle=q; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); };
  // a small moth seen from above: two pairs of wings, a fuzzy body, two pale moon spots
  const n5bMoth=(g,x,y,s,wing,spot)=>{ g.save(); g.translate(x,y); g.scale(s,s);
    g.fillStyle=wing; g.strokeStyle=N5B_INK; g.lineWidth=1.2/s;
    for(const d of [-1,1]){ g.beginPath(); g.moveTo(0,-1); g.bezierCurveTo(d*5,-8,d*13,-7,d*11,0); g.bezierCurveTo(d*9,4,d*3,3,0,1); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0,1); g.bezierCurveTo(d*4,3,d*8,7,d*5,9); g.bezierCurveTo(d*2,9,d*1,5,0,3); g.closePath(); g.fill(); g.stroke();
      g.fillStyle=spot; g.beginPath(); g.arc(d*7,-3,1.7,0,TAU); g.fill(); g.fillStyle=wing; }
    g.fillStyle='#4a4058'; g.beginPath(); g.ellipse(0,1,1.6,5,0,0,TAU); g.fill();
    g.strokeStyle='#4a4058'; g.lineWidth=0.8/s; for(const d of [-1,1]){ g.beginPath(); g.moveTo(0,-4); g.quadraticCurveTo(d*2,-8,d*4,-9); g.stroke(); }
    g.restore(); };

  defineLook('moon_lock_carving',{w:40,h:54,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(8,4,16,.35)'; g.beginPath(); g.ellipse(0,0,19,5,0,0,TAU); g.fill();
    // the stone: moon-glass, rounded on top
    const sg=g.createLinearGradient(-16,-50,16,0); sg.addColorStop(0,'#d6d2ea'); sg.addColorStop(1,'#8a84a8');
    g.fillStyle=sg; g.strokeStyle=N5B_INK; g.lineWidth=2;
    g.beginPath(); g.moveTo(-16,-2); g.lineTo(-16,-34); g.quadraticCurveTo(-16,-50,0,-50); g.quadraticCurveTo(16,-50,16,-34); g.lineTo(16,-2); g.closePath(); g.fill(); g.stroke();
    // the carving, cut in: a thin crescent moon and the little moth wrapped all the way round it
    g.fillStyle='#5e5880'; g.beginPath(); g.ellipse(0,-26,12,14,0,0,TAU); g.fill();
    g.fillStyle='#f2f0fb'; g.beginPath(); g.arc(-1,-26,9,Math.PI*0.35,Math.PI*1.65); g.arc(3,-26,7.4,Math.PI*1.62,Math.PI*0.38,true); g.closePath(); g.fill();
    n5bMoth(g,-4,-26,0.9,'#b4aec8','#f6f2ff');
    // the moth's legs holding on round the moon
    g.strokeStyle='#3a3450'; g.lineWidth=1.2; for(const a of [0.9,1.4,4.9,5.4]){ g.beginPath(); g.arc(-1,-26,10.5,a,a+0.35); g.stroke(); }
    // chips and cracks: it is very old
    g.strokeStyle='rgba(40,34,60,.55)'; g.lineWidth=1; g.beginPath(); g.moveTo(9,-44); g.lineTo(6,-38); g.lineTo(10,-33); g.moveTo(-12,-10); g.lineTo(-7,-6); g.stroke();
    g.restore();
  },live(g,x,y,t){ n5bGlow(g,x,y-28,30,'220,226,255',0.14+0.07*Math.sin(t*1.6)); }});

  defineLook('green_fourth_post',{w:34,h:86,draw(g,x,y,t,state){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(20,12,8,.3)'; g.beginPath(); g.ellipse(0,0,12,4,0,0,TAU); g.fill();
    // new wood: a pale post with a crossbar
    g.fillStyle='#c4955c'; g.strokeStyle=N5B_INK; g.lineWidth=2;
    g.fillRect(-3,-74,6,74); g.strokeRect(-3,-74,6,74); g.fillRect(-3,-74,18,4); g.strokeRect(-3,-74,18,4);
    g.strokeStyle='rgba(120,80,40,.6)'; g.lineWidth=1; g.beginPath(); g.moveTo(-1,-66); g.lineTo(-1,-6); g.stroke();
    // the paper lantern hanging from the crossbar
    g.strokeStyle='#3a2a1a'; g.lineWidth=1.2; g.beginPath(); g.moveTo(12,-70); g.lineTo(12,-62); g.stroke();
    g.fillStyle='#f6d58e'; g.strokeStyle='#6a3a1a'; g.lineWidth=1.6; g.beginPath(); g.ellipse(12,-52,7,10,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='rgba(255,160,70,.85)'; g.beginPath(); g.ellipse(12,-51,3.5,5,0,0,TAU); g.fill();
    g.fillStyle='#8a4a22'; g.fillRect(8,-63,8,2); g.fillRect(8,-43,8,2);
    // the tag: FOR WHOEVER IS OUT IN THE DARK
    g.fillStyle='#f1e6cc'; g.strokeStyle=N5B_INK; g.lineWidth=1.2; g.save(); g.translate(-3,-38); g.rotate(-0.12); g.fillRect(-12,-5,10,8); g.strokeRect(-12,-5,10,8);
    g.strokeStyle='#6a5a4a'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-10,-2); g.lineTo(-4,-2); g.moveTo(-10,1); g.lineTo(-5,1); g.stroke(); g.restore();
    // visiting: a tiny grey moth on the top of the post
    if(state==='moth') n5bMoth(g,0,-79,0.55,'#9a8ab0','#ece6ff');
    g.restore();
  },live(g,x,y,t){ const f=0.85+0.15*Math.sin(t*7)+0.05*Math.sin(t*13); n5bGlow(g,x+12,y-52,44,'255,180,90',0.42*f); n5bGlow(g,x+12,y-52,12,'255,240,200',0.5*f); }});

  defineLook('cocoon_knot',{w:46,h:44,draw(g,x,y,t,state){
    g.save(); g.translate(x,y);
    if(state==='melted'){
      // a few loose silver threads, fading on the sand
      g.strokeStyle='rgba(220,226,250,.7)'; g.lineWidth=1.4;
      for(const [a,b,c,d] of [[-14,-4,-2,-10],[0,-2,12,-8],[-6,-14,6,-18]]){ g.beginPath(); g.moveTo(a,b); g.quadraticCurveTo((a+c)/2,b-8,c,d); g.stroke(); }
    } else {
      // the knot: silver leash threads looped tight round each other, pulled from three cocoons
      g.strokeStyle='#e8ecff'; g.lineWidth=2.4;
      for(const a of [-2.4,-1.6,-0.7]){ g.beginPath(); g.moveTo(Math.cos(a)*22,-16+Math.sin(a)*22); g.quadraticCurveTo(Math.cos(a)*8,-18+Math.sin(a)*6,0,-18); g.stroke(); }
      g.fillStyle='#c8cfee'; g.strokeStyle=N5B_INK; g.lineWidth=1.8;
      g.beginPath(); g.ellipse(0,-18,9,7,0.2,0,TAU); g.fill(); g.stroke();
      g.strokeStyle='#8a90b8'; g.lineWidth=1.4; for(const r of [5,3]){ g.beginPath(); g.ellipse(0,-18,r+2,r,0.6,0,TAU); g.stroke(); }
      g.strokeStyle='#e8ecff'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-11); g.quadraticCurveTo(-2,-4,1,0); g.stroke();
    }
    g.restore();
  },live(g,x,y,t,state){ if(state==='melted') return; n5bGlow(g,x,y-18,26,'214,222,255',0.3+0.12*Math.sin(t*3)); }});
}
