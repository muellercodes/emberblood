// ================= v10_art4s.js (A4S): looks for the Act IV backtracking spots (art only).
// Each look is drawn at its place's (x, y), the point it stands on. Small, cheap, storybook outlines; no state kept.
//   a4s_nameboard    the broken nameboard of the Soggy Biscuit ONE (the Plughole Rock, Lake Mirrow)
//   a4s_niche        a little stone niche sealed with silver, a note inside (the Moon Step, Iska's Ward-stone)
//   a4s_trails       a flat old stone with three silver lines (the Moth Watch, by the Moon Ring)
//   a4s_oar_sign     an oar stuck in the sand with a painted board: NOT TREASURE (Saltbeard's sand pen)
//   a4s_cocoon       a barrel-sized cocoon of moon silk with a warm glow inside (the Dreadgate)
//   a4s_cocoon_cut   the same cocoon peeled open, empty
if(typeof defineLook==='function'){ const A4S_INK='#2b2420';
  defineLook('a4s_nameboard',{w:46,h:20,draw(g,x,y){
    g.save(); g.translate(x,y-5); g.rotate(-0.08);
    g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(2,7,22,4,0,0,TAU); g.fill();
    g.fillStyle='#b07a48'; g.strokeStyle=A4S_INK; g.lineWidth=1.8;
    g.beginPath(); g.moveTo(-21,-6); g.lineTo(14,-6); g.lineTo(17,-2); g.lineTo(13,1); g.lineTo(16,5); g.lineTo(-21,5); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='#8a5a32'; g.lineWidth=1; g.beginPath(); g.moveTo(-20,-1); g.lineTo(12,-1); g.stroke();
    g.fillStyle='#f2e6c8'; for(let i=0;i<7;i++){ g.fillRect(-18+i*4.4,-4,2.6,2.2); g.fillRect(-18+i*4.4,1,2.6,2.2); }
    g.fillStyle='#4a8a5a'; g.beginPath(); g.ellipse(-16,5,4,1.6,0,0,TAU); g.fill();
    g.restore();
  }});
  defineLook('a4s_niche',{w:34,h:34,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0,0,16,4,0,0,TAU); g.fill();
    g.fillStyle='#9a948a'; g.strokeStyle=A4S_INK; g.lineWidth=2;
    g.beginPath(); g.moveTo(-14,0); g.lineTo(-14,-20); g.quadraticCurveTo(0,-32,14,-20); g.lineTo(14,0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#3a3640'; g.beginPath(); g.moveTo(-8,-2); g.lineTo(-8,-17); g.quadraticCurveTo(0,-25,8,-17); g.lineTo(8,-2); g.closePath(); g.fill();
    g.fillStyle='#efe4c8'; g.strokeStyle=A4S_INK; g.lineWidth=1; g.fillRect(-5,-11,10,7); g.strokeRect(-5,-11,10,7);
    g.strokeStyle='#d8e4ff'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-8,-17); g.quadraticCurveTo(0,-25,8,-17); g.stroke();
    g.fillStyle='rgba(220,230,255,.35)'; g.beginPath(); g.arc(0,-14,14,0,TAU); g.fill();
    g.restore();
  }});
  defineLook('a4s_trails',{w:48,h:24,draw(g,x,y){
    g.save(); g.translate(x,y-4);
    g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0,5,22,5,0,0,TAU); g.fill();
    g.fillStyle='#a8a4b0'; g.strokeStyle=A4S_INK; g.lineWidth=1.8; g.beginPath(); g.ellipse(0,0,20,8,0,0,TAU); g.fill(); g.stroke();
    g.strokeStyle='#e8f0ff'; g.lineWidth=1.6;
    for(const a of [Math.PI, -Math.PI/2, 0]){ g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(Math.cos(a)*8+2,Math.sin(a)*3-2,Math.cos(a)*17,Math.sin(a)*6); g.stroke(); }
    g.fillStyle='#f4f0ff'; g.beginPath(); g.arc(0,0,2.2,0,TAU); g.fill();
    g.fillStyle='rgba(220,230,255,.3)'; g.beginPath(); g.ellipse(0,0,24,11,0,0,TAU); g.fill();
    g.restore();
  }});
  defineLook('a4s_oar_sign',{w:30,h:44,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0,0,10,3,0,0,TAU); g.fill();
    g.strokeStyle=A4S_INK; g.lineWidth=4; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-36); g.stroke();
    g.strokeStyle='#c09060'; g.lineWidth=2.4; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-36); g.stroke();
    g.fillStyle='#c09060'; g.strokeStyle=A4S_INK; g.lineWidth=1.6; g.beginPath(); g.ellipse(0,-38,4,7,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#e8dcc0'; g.fillRect(-13,-28,26,12); g.strokeRect(-13,-28,26,12);
    g.fillStyle='#a03a2a'; g.fillRect(-10,-25,20,2); g.fillRect(-10,-21,14,2);
    g.strokeStyle='#a03a2a'; g.lineWidth=1.4; g.beginPath(); g.moveTo(5,-23); g.lineTo(9,-19); g.moveTo(9,-23); g.lineTo(5,-19); g.stroke();
    g.restore();
  }});
  const cocoon=(g,x,y,cut)=>{
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0,0,22,6,0,0,TAU); g.fill();
    if(!cut){
      g.fillStyle='rgba(255,170,90,.35)'; g.beginPath(); g.arc(0,-20,22,0,TAU); g.fill();
      g.fillStyle='#e6e8f4'; g.strokeStyle=A4S_INK; g.lineWidth=2; g.beginPath(); g.ellipse(0,-20,16,22,0,0,TAU); g.fill(); g.stroke();
      g.strokeStyle='#b8bcd8'; g.lineWidth=1.2; for(let i=-2;i<=2;i++){ g.beginPath(); g.ellipse(0,-20,16,22,0,Math.PI*0.15+i*0.25,Math.PI*0.6+i*0.25); g.stroke(); }
      for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-15+i*10,-6-i*2); g.quadraticCurveTo(-6+i*6,-20,-12+i*8,-36); g.stroke(); }
      g.fillStyle='rgba(255,150,70,.55)'; g.beginPath(); g.arc(0,-18,5,0,TAU); g.fill();
      g.strokeStyle='#d8dcf0'; g.lineWidth=1; g.beginPath(); g.moveTo(-14,-30); g.lineTo(-24,-42); g.moveTo(13,-32); g.lineTo(22,-44); g.stroke();
    } else {
      g.fillStyle='#e6e8f4'; g.strokeStyle=A4S_INK; g.lineWidth=1.8;
      for(const s of [-1,1]){ g.beginPath(); g.moveTo(0,-2); g.quadraticCurveTo(s*20,-6,s*22,-22); g.quadraticCurveTo(s*12,-14,s*4,-4); g.closePath(); g.fill(); g.stroke(); }
      g.beginPath(); g.moveTo(-6,-2); g.quadraticCurveTo(0,-20,6,-2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='rgba(255,200,150,.25)'; g.beginPath(); g.ellipse(0,-3,10,3,0,0,TAU); g.fill();
    }
    g.restore();
  };
  defineLook('a4s_cocoon',{w:48,h:52,draw(g,x,y){ cocoon(g,x,y,false); }});
  defineLook('a4s_cocoon_cut',{w:48,h:30,draw(g,x,y){ cocoon(g,x,y,true); }});
}
