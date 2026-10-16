// ================= v10 art for the c_gear pilot (ENG): looks for story data, drawn with defineLook only
// window_clock: Lord Whirligig's new bird clock in a manor window (it glows at night; state 'gone' after the robbery)
// gear_hatch: the open works hatch by the Great Clock square, its gears packed with silver moth dust
// icon_magnifier: Professor Sprocket's spare glass (the Case Book and the satchel use icon_* looks, drawn centred)
// A look draws at (x, y) = the middle of its base on the ground, except icon_* looks, which are centred.

defineLook('window_clock',{w:40,h:52,draw(g,x,y,t,state){
  const O='#3b2233', night=typeof daylight==='function'?daylight()<0.45:false, gone=state==='gone'||state==='stolen';
  g.save(); g.translate(x,y);
  // the window: a stone sill and an arched frame on the manor wall
  g.lineJoin='round'; g.lineWidth=2.4; g.strokeStyle=O;
  g.fillStyle=night?'#ffd98a':'#9fc6d8'; g.beginPath(); g.moveTo(-15,-6); g.lineTo(-15,-34); g.quadraticCurveTo(0,-50,15,-34); g.lineTo(15,-6); g.closePath(); g.fill();
  if(night){ const gr=g.createRadialGradient(0,-24,2,0,-24,26); gr.addColorStop(0,'rgba(255,240,180,.95)'); gr.addColorStop(1,'rgba(255,190,90,.0)'); g.fillStyle=gr; g.fill(); }
  g.stroke();
  g.strokeStyle=night?'rgba(120,70,30,.55)':'rgba(255,255,255,.55)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(0,-44); g.lineTo(0,-6); g.moveTo(-15,-24); g.lineTo(15,-24); g.stroke();
  g.fillStyle='#d8c8a8'; g.strokeStyle=O; g.lineWidth=2.2; g.beginPath(); g.rect(-19,-7,38,6); g.fill(); g.stroke();
  if(!gone){
    // the clock on the sill: a brass case, a white face, two hands, and the little bird on top
    const glow=night?0.55+0.25*Math.sin(t*3):0;
    if(glow){ const gr=g.createRadialGradient(0,-18,1,0,-18,22); gr.addColorStop(0,`rgba(255,236,150,${glow})`); gr.addColorStop(1,'rgba(255,236,150,0)'); g.fillStyle=gr; g.fillRect(-24,-42,48,40); }
    g.fillStyle='#d8a440'; g.strokeStyle=O; g.lineWidth=2; g.beginPath(); g.moveTo(-9,-7); g.lineTo(-9,-22); g.quadraticCurveTo(0,-32,9,-22); g.lineTo(9,-7); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=night?'#fff6c8':'#fbf4e2'; g.beginPath(); g.arc(0,-17,6,0,Math.PI*2); g.fill(); g.lineWidth=1.4; g.stroke();
    g.strokeStyle=O; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,-17); g.lineTo(0,-21.5); g.moveTo(0,-17); g.lineTo(3,-16); g.stroke();
    // the bird bobs now and then
    const bob=Math.sin(t*2)>0.85?-2:0;
    g.fillStyle='#4aa8d8'; g.strokeStyle=O; g.lineWidth=1.6; g.beginPath(); g.ellipse(0,-30+bob,4.6,3.6,0,0,Math.PI*2); g.fill(); g.stroke();
    g.beginPath(); g.arc(3.6,-32.5+bob,2.6,0,Math.PI*2); g.fill(); g.stroke();
    g.fillStyle='#f0b030'; g.beginPath(); g.moveTo(5.8,-33+bob); g.lineTo(8.6,-32+bob); g.lineTo(5.8,-31.4+bob); g.closePath(); g.fill();
    g.fillStyle=O; g.beginPath(); g.arc(4.2,-33.2+bob,0.8,0,Math.PI*2); g.fill();
    g.strokeStyle='#2a6a98'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-4,-30+bob); g.lineTo(-7.5,-28+bob); g.stroke();
  }else{
    // an empty sill with a little dust ring where it stood
    g.fillStyle='rgba(214,226,255,.75)'; g.beginPath(); g.ellipse(0,-8,9,2,0,0,Math.PI*2); g.fill();
  }
  g.restore();
}});

defineLook('gear_hatch',{w:56,h:30,draw(g,x,y,t,state){
  const O='#3b2233';
  g.save(); g.translate(x,y);
  g.fillStyle='rgba(40,20,40,.22)'; g.beginPath(); g.ellipse(2,4,30,9,0,0,Math.PI*2); g.fill();
  // the frame (a flat iron ring in the paving) and the open lid leaning back
  g.lineJoin='round';
  g.fillStyle='#6a5e58'; g.strokeStyle=O; g.lineWidth=2.4; g.beginPath(); g.ellipse(0,-6,25,12,0,0,Math.PI*2); g.fill(); g.stroke();
  g.fillStyle='#241820'; g.beginPath(); g.ellipse(0,-6,19,8.5,0,0,Math.PI*2); g.fill();
  // the works below: two brass gears, turning very slowly (the clock is stuck: they only twitch)
  const tw=Math.sin(t*9)*0.03*(Math.sin(t*0.7)>0.8?1:0);
  const gear=(cx,cy,r,n,a,col)=>{ g.save(); g.translate(cx,cy); g.scale(1,0.5); g.rotate(a); g.fillStyle=col; g.strokeStyle=O; g.lineWidth=1.6;
    g.beginPath(); for(let i=0;i<n*2;i++){ const an=i*Math.PI/n, rr=i%2?r:r*0.78; g.lineTo(Math.cos(an)*rr,Math.sin(an)*rr); } g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#241820'; g.beginPath(); g.arc(0,0,r*0.28,0,Math.PI*2); g.fill(); g.restore(); };
  gear(-6,-6,11,8,tw,'#c8963a'); gear(9,-5,7,6,-tw*1.5+0.3,'#d8a440');
  // silver moth dust caught in the teeth (it twinkles)
  for(let i=0;i<9;i++){ const a=i*0.7+1, r=6+(i*5)%11, px=Math.cos(a)*r-2, py=-6+Math.sin(a)*r*0.4, k=0.5+0.5*Math.sin(t*3+i*1.7);
    g.fillStyle=`rgba(220,230,255,${0.55+0.4*k})`; g.fillRect(px-1,py-1,2,2); }
  // the lid, propped open on its hinge
  g.fillStyle='#7a6e66'; g.strokeStyle=O; g.lineWidth=2.2; g.beginPath(); g.moveTo(-20,-12); g.lineTo(-14,-30); g.lineTo(16,-30); g.lineTo(20,-12); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle='rgba(59,34,51,.5)'; g.lineWidth=1.2; for(const lx of [-8,0,8]){ g.beginPath(); g.moveTo(lx-1,-13); g.lineTo(lx,-29); g.stroke(); }
  g.fillStyle='#d8a440'; g.beginPath(); g.arc(0,-21,2.4,0,Math.PI*2); g.fill();
  g.restore();
}});

defineLook('icon_magnifier',{w:24,h:24,draw(g,x,y,t,state){
  const O='#3b2233';
  g.save(); g.translate(x,y); g.lineCap='round'; g.lineJoin='round';
  g.strokeStyle=O; g.lineWidth=6; g.beginPath(); g.moveTo(4,4); g.lineTo(10,10); g.stroke();
  g.strokeStyle='#8a5a32'; g.lineWidth=3.4; g.beginPath(); g.moveTo(4,4); g.lineTo(10,10); g.stroke();
  g.fillStyle='rgba(190,225,255,.85)'; g.strokeStyle=O; g.lineWidth=2.4; g.beginPath(); g.arc(-2,-2,7.4,0,Math.PI*2); g.fill(); g.stroke();
  g.strokeStyle='#d8a440'; g.lineWidth=1.6; g.beginPath(); g.arc(-2,-2,6.2,0,Math.PI*2); g.stroke();
  g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=1.6; g.beginPath(); g.arc(-3,-3,3.6,Math.PI*1.05,Math.PI*1.55); g.stroke();
  g.restore();
}});
