// ================= v10_art2s.js (A2S): looks for the Act II side-quest and Embermere gate spots (art only).
// Each look is drawn at its place's (x, y), the point it stands on. Small, cheap, storybook outlines; no state kept.
//   a2s_sketch_page  Vesper's sketchbook page under a pebble (Vesper's Lookout)
//   a2s_handprints   two tiny handprints by a little iron hook (Pearl's First Hook)
//   a2s_ledger       a Warden's ledger on a stone shelf (the Wardens' Lockup)
//   a2s_pond_chest   a tin chest dripping pond weed (Bramble Pond)
//   a2s_goat_stash   a chewed hat, a heap of coins and a glowing ember (Duchess's Perch)
//   a2s_eye_words    letters carved inside the Chalk Dragon's opened eye
if(typeof defineLook==='function'){ const A2S_INK='#2b2420';
  defineLook('a2s_sketch_page',{w:30,h:22,draw(g,x,y,t){
    g.save(); g.translate(x,y-6); g.rotate(-0.12);
    g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(-12,-6,26,16);
    g.fillStyle='#f3ead2'; g.strokeStyle=A2S_INK; g.lineWidth=1.6; g.fillRect(-13,-9,26,16); g.strokeRect(-13,-9,26,16);
    g.strokeStyle='#7a6a8a'; g.lineWidth=1; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-10,-5+i*3); g.lineTo(6,-5+i*3); g.stroke(); }
    g.fillStyle='#e8a040'; for(let i=0;i<4;i++){ g.beginPath(); g.arc(-8+i*5,3,1.4,0,TAU); g.fill(); }
    g.fillStyle='#8a8e98'; g.strokeStyle=A2S_INK; g.lineWidth=1.4; g.beginPath(); g.ellipse(7,-6,5,4,0,0,TAU); g.fill(); g.stroke();
    g.restore();
    const a=0.25+0.15*Math.sin(t*3); g.fillStyle=`rgba(255,240,200,${a})`; g.beginPath(); g.arc(x,y-8,16,0,TAU); g.fill();
  }});
  defineLook('a2s_handprints',{w:34,h:24,draw(g,x,y,t){
    g.save(); g.translate(x,y-4);
    g.fillStyle='#2a1a14'; g.globalAlpha=0.85; for(const [dx,dy] of [[-9,0],[-12,-5],[-9,-7],[-6,-7],[-4,-4]]){ g.beginPath(); g.arc(dx,dy,dx===-9&&dy===0?4:1.6,0,TAU); g.fill(); }
    g.globalAlpha=1; g.strokeStyle='#e6dccb'; g.lineWidth=1.2; for(const [dx,dy] of [[5,0],[3,-6],[6,-7],[9,-6],[11,-3]]){ g.beginPath(); g.moveTo(dx-1.5,dy-1.5); g.lineTo(dx+1.5,dy+1.5); g.moveTo(dx+1.5,dy-1.5); g.lineTo(dx-1.5,dy+1.5); g.stroke(); }
    g.strokeStyle=A2S_INK; g.lineWidth=2.6; g.beginPath(); g.moveTo(0,-14); g.lineTo(0,-24); g.stroke();
    g.strokeStyle='#8a7a6a'; g.lineWidth=2; g.beginPath(); g.arc(0,-27,3.5,Math.PI*0.2,Math.PI*1.8); g.stroke();
    g.restore();
  }});
  defineLook('a2s_ledger',{w:34,h:26,draw(g,x,y,t){
    g.save(); g.translate(x,y);
    g.fillStyle='#7a6e64'; g.strokeStyle=A2S_INK; g.lineWidth=1.8; g.fillRect(-16,-8,32,8); g.strokeRect(-16,-8,32,8);
    g.fillStyle='#5a3a2a'; g.fillRect(-11,-17,22,10); g.strokeRect(-11,-17,22,10);
    g.fillStyle='#efe2c0'; g.fillRect(-10,-16,20,3);
    g.fillStyle='#c8a040'; g.fillRect(-1,-17,2,10);
    g.restore();
    const a=0.2+0.12*Math.sin(t*2.4); g.fillStyle=`rgba(255,235,190,${a})`; g.beginPath(); g.arc(x,y-12,16,0,TAU); g.fill();
  }});
  defineLook('a2s_pond_chest',{w:36,h:28,draw(g,x,y,t){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(40,70,60,.35)'; g.beginPath(); g.ellipse(0,0,18,5,0,0,TAU); g.fill();
    g.fillStyle='#8a9aa0'; g.strokeStyle=A2S_INK; g.lineWidth=2; g.fillRect(-14,-16,28,16); g.strokeRect(-14,-16,28,16);
    g.fillStyle='#6a7a80'; g.fillRect(-14,-20,28,5); g.strokeRect(-14,-20,28,5);
    g.fillStyle='#e8d070'; g.fillRect(-3,-14,6,5);
    g.strokeStyle='#4a8a4a'; g.lineWidth=2; for(const dx of [-10,-2,8]){ g.beginPath(); g.moveTo(dx,-19); g.quadraticCurveTo(dx+2,-10,dx-1,-2+Math.sin(t*2+dx)*1.5); g.stroke(); }
    g.restore();
  }});
  defineLook('a2s_goat_stash',{w:40,h:28,draw(g,x,y,t){
    g.save(); g.translate(x,y);
    g.fillStyle='#b89a50'; g.strokeStyle=A2S_INK; g.lineWidth=1.4; g.beginPath(); g.ellipse(0,-2,16,6,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#e0b84a'; for(const [dx,dy] of [[-8,-5],[-4,-7],[0,-5],[4,-7],[-6,-9],[2,-9]]){ g.beginPath(); g.arc(dx,dy,2.6,0,TAU); g.fill(); g.stroke(); }
    g.fillStyle='#3a5a8a'; g.beginPath(); g.moveTo(8,-4); g.lineTo(18,-6); g.lineTo(15,-14); g.lineTo(9,-12); g.closePath(); g.fill(); g.stroke();
    const k=0.6+0.4*Math.sin(t*3); g.fillStyle=`rgba(255,140,60,${0.35*k})`; g.beginPath(); g.arc(-12,-8,9,0,TAU); g.fill();
    g.fillStyle='#ff9a4a'; g.beginPath(); g.arc(-12,-8,3.5,0,TAU); g.fill();
    g.restore();
  }});
  defineLook('a2s_eye_words',{w:30,h:20,draw(g,x,y,t){
    g.save(); g.translate(x,y-6);
    g.fillStyle='#d8d0c0'; g.strokeStyle=A2S_INK; g.lineWidth=1.6; g.beginPath(); g.ellipse(0,0,14,8,0,0,TAU); g.fill(); g.stroke();
    g.strokeStyle='#6a6252'; g.lineWidth=1; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(-9,-3+i*3); g.lineTo(9,-3+i*3); g.stroke(); }
    g.restore();
    const a=0.2+0.1*Math.sin(t*3); g.fillStyle=`rgba(255,250,230,${a})`; g.beginPath(); g.arc(x,y-6,15,0,TAU); g.fill();
  }});
}
