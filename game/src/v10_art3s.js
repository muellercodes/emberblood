// ================= v10_art3s.js (A3S): looks for the Act III side-quest gates on Embermere and the Coast (art only).
// Each look is drawn at its place's (x, y), the point it stands on. Small, cheap, storybook outlines; no state kept.
//   tove_stone_ice    the carved Tove stone in its puddle of melted moth-frost (Tove's statue, Frostpine)
//   egg_shells        an old nest on Cinder Mountain's rim with a red scorched shell and an ice-blue one
//   iska_box          Iska's little stone box with its lantern wax seal, by the broken flagstone
//   ring_scale_ice    a white wing-scale as big as a plate in the Moon Ring's grass, two moth shapes pressed round it
//   egg_nest          the same nest once the shells and the ember are taken
//   sprocket_boulder  Hettie's opened cellar hatch with the brass Bomb Bag on top (the boulder's rubble round it)
//   sprocket_cellar   the same hatch once the Bomb Bag is taken
//   frozen_bun        Bertram's giant frozen Lantern bun (drawn over the gate's boulder until it bursts)
//   frozen_bun_open   the burst bun, crumbs everywhere and a Heart Ember glowing in the middle
//   frozen_bun_crumbs the burst bun once the Heart Ember is taken
//   hearth_plume      the hat look for item f3_plume (Captain Brann's spare plume, the what_knights payoff)
reLooksAt();   // (v12 ART23) the looks below get the Realistic repaint (e12d_acts23.js)
if(typeof defineLook==='function'){ const A3S_INK='#2b2420';
  defineLook('tove_stone_ice',{w:56,h:34,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(150,190,230,.45)'; g.beginPath(); g.ellipse(0,-2,28,9,0,0,TAU); g.fill();
    g.fillStyle='rgba(190,160,240,.55)'; for(const [dx,dy,r] of [[-22,-3,4],[20,-5,3.5],[16,1,2.5],[-14,2,2.5]]){ g.beginPath(); g.moveTo(dx-r,dy); g.lineTo(dx,dy-r*1.8); g.lineTo(dx+r,dy); g.closePath(); g.fill(); }
    g.fillStyle='#8a8e98'; g.strokeStyle=A3S_INK; g.lineWidth=2; g.beginPath(); g.moveTo(-16,-2); g.lineTo(-14,-22); g.lineTo(14,-24); g.lineTo(17,-2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#a8acb6'; g.beginPath(); g.moveTo(-14,-22); g.lineTo(14,-24); g.lineTo(12,-20); g.lineTo(-12,-18); g.closePath(); g.fill();
    g.strokeStyle='#4a4e58'; g.lineWidth=1.2; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(-10,-15+i*4); g.lineTo(10,-16+i*4); g.stroke(); }
    g.fillStyle='#e8f4ff'; g.beginPath(); g.arc(-6,-9,1.6,0,TAU); g.arc(0,-9,1.6,0,TAU); g.arc(6,-9,1.6,0,TAU); g.fill();
    g.restore();
  }});
  const nest=g=>{
    g.strokeStyle='#5a3a22'; g.lineWidth=2.4; for(let i=0;i<9;i++){ const a=i/9*Math.PI; g.beginPath(); g.moveTo(Math.cos(a)*-24,-2+Math.sin(a)*3); g.lineTo(Math.cos(a)*24,-6-Math.sin(a)*2); g.stroke(); }
    g.fillStyle='#7a5232'; g.strokeStyle=A3S_INK; g.lineWidth=1.8; g.beginPath(); g.ellipse(0,-3,24,7,0,0,TAU); g.fill(); g.stroke();
  };
  defineLook('egg_nest',{w:54,h:20,draw(g,x,y){ g.save(); g.translate(x,y); nest(g); g.restore(); }});
  defineLook('egg_shells',{w:54,h:32,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(255,140,60,.25)'; g.beginPath(); g.arc(0,-8,22,0,TAU); g.fill();
    nest(g);
    // the red, scorched shell
    g.fillStyle='#c8442a'; g.beginPath(); g.moveTo(-18,-6); g.quadraticCurveTo(-16,-22,-6,-20); g.lineTo(-8,-15); g.lineTo(-4,-12); g.lineTo(-6,-7); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#3a1a10'; g.beginPath(); g.arc(-12,-14,2.2,0,TAU); g.arc(-15,-9,1.5,0,TAU); g.fill();
    // the ice-blue, frosty shell
    g.fillStyle='#bfe6ff'; g.beginPath(); g.moveTo(4,-6); g.quadraticCurveTo(6,-24,17,-20); g.lineTo(14,-15); g.lineTo(19,-11); g.lineTo(17,-6); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='#ffffff'; g.lineWidth=1; g.beginPath(); g.moveTo(9,-16); g.lineTo(12,-12); g.moveTo(12,-16); g.lineTo(9,-12); g.stroke();
    // the little Heart Ember under them
    g.fillStyle='#ff9a4a'; g.beginPath(); g.arc(1,-5,3.4,0,TAU); g.fill(); g.fillStyle='#ffe0a0'; g.beginPath(); g.arc(1,-5,1.6,0,TAU); g.fill();
    g.restore();
  }});
  defineLook('iska_box',{w:34,h:28,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0,0,16,5,0,0,TAU); g.fill();
    g.fillStyle='#8c8478'; g.strokeStyle=A3S_INK; g.lineWidth=1.8; g.fillRect(-13,-15,26,15); g.strokeRect(-13,-15,26,15);
    g.fillStyle='#a49c90'; g.fillRect(-14,-20,28,6); g.strokeRect(-14,-20,28,6);
    g.fillStyle='#b8302a'; g.beginPath(); g.arc(0,-11,4.5,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#ffd27a'; g.fillRect(-1.5,-14,3,5);
    g.fillStyle='#f3ead2'; g.save(); g.rotate(-0.25); g.fillRect(4,-26,10,8); g.strokeRect(4,-26,10,8); g.restore();
    g.restore();
  }});
  defineLook('ring_scale_ice',{w:70,h:34,draw(g,x,y){
    g.save(); g.translate(x,y);
    // two moth shapes pressed into the grass
    g.fillStyle='rgba(40,70,40,.35)';
    for(const [cx,cy,rot] of [[-24,-2,-0.3],[24,-3,0.35]]){ g.save(); g.translate(cx,cy); g.rotate(rot); g.beginPath(); g.ellipse(-6,0,8,5,0.4,0,TAU); g.ellipse(6,0,8,5,-0.4,0,TAU); g.fill(); g.restore(); }
    g.fillStyle='rgba(200,180,240,.35)'; g.beginPath(); g.ellipse(0,-2,16,6,0,0,TAU); g.fill();
    // the plate-sized white scale
    g.fillStyle='#f4f6ff'; g.strokeStyle=A3S_INK; g.lineWidth=1.8; g.beginPath(); g.moveTo(-12,-2); g.quadraticCurveTo(-12,-16,0,-18); g.quadraticCurveTo(12,-16,12,-2); g.quadraticCurveTo(0,2,-12,-2); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='rgba(150,170,220,.9)'; g.lineWidth=1; for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(i*3.5,-2); g.lineTo(i*2,-15); g.stroke(); }
    g.fillStyle='rgba(255,220,255,.6)'; g.beginPath(); g.arc(-4,-11,2.2,0,TAU); g.fill();
    g.restore();
  }});
  const hatch=(g,bag)=>{
    g.fillStyle='#7c746a'; g.strokeStyle=A3S_INK; g.lineWidth=1.4; for(const [dx,dy,r] of [[-30,-2,5],[-24,4,4],[28,-3,6],[22,5,3.5],[-6,8,3],[10,9,3.5]]){ g.beginPath(); g.arc(dx,dy,r,0,TAU); g.fill(); g.stroke(); }
    g.fillStyle='#2a1e18'; g.fillRect(-16,-12,32,16); g.strokeRect(-16,-12,32,16);
    g.fillStyle='#8a5a32'; g.save(); g.translate(-16,-12); g.rotate(-0.5); g.fillRect(-2,-14,16,16); g.strokeRect(-2,-14,16,16); g.restore();
    g.save(); g.translate(16,-12); g.rotate(0.5); g.fillRect(-14,-14,16,16); g.strokeRect(-14,-14,16,16); g.restore();
    if(!bag) return;
    // the brass Bomb Bag, Mark Two
    g.fillStyle='#c89a3a'; g.beginPath(); g.ellipse(0,-6,10,7,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#6a4a2a'; g.fillRect(-8,-8,16,3); g.fillStyle='#ffe08a'; g.beginPath(); g.arc(0,-6,2,0,TAU); g.fill();
  };
  defineLook('sprocket_boulder',{w:70,h:40,draw(g,x,y){ g.save(); g.translate(x,y); hatch(g,true); g.restore(); }});
  defineLook('sprocket_cellar',{w:70,h:40,draw(g,x,y){ g.save(); g.translate(x,y); hatch(g,false); g.restore(); }});
  const bunBody=(g,s,open,ember)=>{
    g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0,0,46*s,12*s,0,0,TAU); g.fill();
    g.fillStyle='#c8803a'; g.strokeStyle=A3S_INK; g.lineWidth=2.2;
    if(open){
      for(const sd of [-1,1]){ g.beginPath(); g.moveTo(sd*6,0); g.quadraticCurveTo(sd*46,-4,sd*40,-30); g.quadraticCurveTo(sd*26,-46,sd*8,-34); g.closePath(); g.fill(); g.stroke(); }
      g.fillStyle='#f4e2b8'; for(const sd of [-1,1]){ g.beginPath(); g.moveTo(sd*8,-4); g.quadraticCurveTo(sd*30,-8,sd*28,-26); g.lineTo(sd*10,-28); g.closePath(); g.fill(); }
      g.fillStyle='#c8803a'; for(const [dx,dy] of [[-52,2],[-44,8],[50,4],[42,10],[-20,10],[24,12],[0,14]]){ g.beginPath(); g.arc(dx,dy,3,0,TAU); g.fill(); g.stroke(); }
      if(!ember) return;
      g.fillStyle='rgba(255,150,60,.35)'; g.beginPath(); g.arc(0,-16,18,0,TAU); g.fill();
      g.fillStyle='#ff9a4a'; g.beginPath(); g.arc(0,-16,7,0,TAU); g.fill(); g.stroke(); g.fillStyle='#ffe6a8'; g.beginPath(); g.arc(-1.5,-17.5,3,0,TAU); g.fill();
      return; }
    g.beginPath(); g.moveTo(-44,-2); g.quadraticCurveTo(-48,-50,0,-56); g.quadraticCurveTo(48,-50,44,-2); g.quadraticCurveTo(0,8,-44,-2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#e0a050'; g.beginPath(); g.ellipse(-14,-40,14,7,-0.3,0,TAU); g.fill();
    g.strokeStyle='#f6efe2'; g.lineWidth=5; g.beginPath(); g.moveTo(-26,-38); g.quadraticCurveTo(0,-28,26,-38); g.moveTo(0,-54); g.quadraticCurveTo(4,-30,0,-6); g.stroke();
    // the frost on it, and icicles
    g.fillStyle='rgba(200,225,255,.55)'; g.beginPath(); g.moveTo(-44,-2); g.quadraticCurveTo(-48,-30,-30,-46); g.lineTo(-22,-30); g.lineTo(-30,-8); g.closePath(); g.fill();
    g.fillStyle='#d8ecff'; g.strokeStyle=A3S_INK; g.lineWidth=1.2; for(const dx of [-34,-18,6,22,36]){ g.beginPath(); g.moveTo(dx-3,-4); g.lineTo(dx,8); g.lineTo(dx+3,-4); g.closePath(); g.fill(); g.stroke(); }
  };
  defineLook('frozen_bun',{w:100,h:72,draw(g,x,y){ g.save(); g.translate(x,y); bunBody(g,1,false); g.restore(); }});
  defineLook('frozen_bun_open',{w:110,h:60,draw(g,x,y){ g.save(); g.translate(x,y); bunBody(g,1,true,true); g.restore(); }});
  defineLook('frozen_bun_crumbs',{w:110,h:60,draw(g,x,y){ g.save(); g.translate(x,y); bunBody(g,1,true,false); g.restore(); }});
  // the hat: Captain Brann's spare plume (item f3_plume's hat look: the engine draws it on Ash's head and in the hat menu)
  defineLook('hearth_plume',{w:20,h:20,draw(g,x,y){
    g.save(); g.translate(x,y);
    g.fillStyle='#8a96a4'; g.beginPath(); g.arc(0,0,7.5,0,TAU); g.fill();
    g.fillStyle='#b8c4d0'; g.beginPath(); g.arc(-1.5,-1.5,4,0,TAU); g.fill();
    g.fillStyle='#3a6aaa'; g.beginPath(); g.moveTo(-1.5,1); g.quadraticCurveTo(-3,-9,4,-13); g.quadraticCurveTo(3,-6,2,1); g.closePath(); g.fill();
    g.strokeStyle='#2a4a7a'; g.lineWidth=1; g.stroke();
    g.restore();
  }});
}
reLooksMine();
