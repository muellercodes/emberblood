
// ================= HUD
function drawHUD(){
  HUD_HITS.length=0;
  const p=player, L=SAFE.l+14, T=SAFE.t+14, story=G.mode==='story';
  ctx.textBaseline='middle';
  // vitals panel
  const pw=Math.min(250,MINI_R().x-L-10); HUD_RX=L+pw+8;
  if(LOOK.sb) sbPanel(L,T,pw,story?80:68,13); else{ ctx.fillStyle='rgba(10,8,6,.58)'; rr(L,T,pw,story?80:68,10); ctx.fill(); ctx.strokeStyle='rgba(255,220,180,.16)'; ctx.lineWidth=1; ctx.stroke(); }
  const bx=L+12, bw=pw-62;
  let y=T+12;
  if(story){
    ctx.font=`700 10px ${UIF}`; ctx.fillStyle='#e8d6b8'; ctx.textAlign='left'; ctx.fillText(`LEVEL ${p.level}`,bx,y);
    bar(bx+52,y-1.5,bw-52,3,p.xp/xpNeed(p.level),'#e2b44a','rgba(255,255,255,.12)'); y+=12;
  }
  bar(bx,y,bw,11,clamp(p.hpShow/p.maxHp,0,1),'rgba(255,230,210,.45)','rgba(60,14,10,.9)');
  bar(bx,y,bw,11,clamp(p.hp/p.maxHp,0,1),p.hp<p.maxHp*0.3?'#e8341f':'#c63a28',null);
  ctx.font=`700 9px ${UIF}`; ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.fillText(`${Math.ceil(Math.max(0,p.hp))} / ${p.maxHp}`,bx+6,y+6); y+=16;
  bar(bx,y,bw,6,p.stamina/p.maxStamina,p.stamina<p.maxStamina*0.25?'#a8a040':'#7cc456','rgba(30,40,20,.9)'); y+=10;
  bar(bx,y,bw*0.8,5,p.energy/p.maxEnergy,p.exhausted?'#7c5530':'#f0a030','rgba(60,34,10,.9)'); y+=11;
  for(let i=0;i<p.potionsMax;i++) flask(bx+5+i*13,y+1,i<p.potions);
  HUD_HITS.push({x:bx-6,y:y-12,w:p.potionsMax*13+10,h:26,fn:()=>{ touch.pressed.drink=true; }}); // tap the flasks to drink
  if(story){ const cx=bx+8+p.potionsMax*13+8; ctx.fillStyle='#ffd84a'; ctx.beginPath(); ctx.arc(cx,y+1,5,0,TAU); ctx.fill(); ctx.strokeStyle='#8a6a1a'; ctx.lineWidth=1.2; ctx.stroke(); ctx.font=`700 10px ${UIF}`; ctx.fillStyle='#ffe9a0'; ctx.textAlign='left'; ctx.fillText(String(G.coins||0),cx+8,y+1.5); }
  const rx=L+pw-26, ry=T+(story?42:36), R=16, full=p.roar>=100;
  if(full){ ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(rx,ry,0,rx,ry,30); g.addColorStop(0,'rgba(255,170,70,.4)'); g.addColorStop(1,'rgba(255,120,40,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(rx,ry,30,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.lineWidth=4; ctx.strokeStyle='rgba(50,22,12,.95)'; ctx.beginPath(); ctx.arc(rx,ry,R,0,TAU); ctx.stroke();
  ctx.strokeStyle=full?`rgb(255,${200+Math.sin(G.time*10)*40|0},90)`:'#e07a34'; ctx.beginPath(); ctx.arc(rx,ry,R,-Math.PI/2,-Math.PI/2+TAU*clamp(p.roar/100,0,1)); ctx.stroke();
  ctx.textAlign='center'; ctx.font=`800 8px ${TF}`; ctx.fillStyle=full?'#ffe08a':'#b8967a'; ctx.fillText('ROAR',rx,ry); if(full&&!usingTouch){ ctx.font=`800 8px ${UIF}`; ctx.fillText(btnLabel('roar'),rx,ry+9); }
  // quest tracker / wave info
  let qy=T+(story?92:80); TRACK_R=null;
  const obj=questObjective(), fo=story?focusObjective():null;
  if(obj){
    // (v11 polish) each goal is one short line with its distance at the end; the whole sentence is in the journal
    const maxW=Math.min(300,W*0.5-L), sideStory=!(fo&&fo.side);
    const txt=(t,x,y)=>{ ctx.lineWidth=LOOK.sb?3.6:3; ctx.strokeStyle=LOOK.sb?'rgba(59,34,51,.92)':'rgba(0,0,0,.6)'; ctx.lineJoin='round'; ctx.strokeText(t,x,y); ctx.fillText(t,x,y); };
    ctx.textAlign='left';
    // a phone (or any small screen): just the goal the compass follows, then "+N more"
    const compact=W<600||H<560;
    if(compact){
      const g=fo||obj, n=activeQuests().length;
      ctx.save(); ctx.translate(L+6,qy); ctx.rotate(Math.PI/4); ctx.fillStyle='#ffcf7a'; ctx.strokeStyle=LOOK.sb?SBC.outline:'rgba(0,0,0,.7)'; ctx.lineWidth=1.6; ctx.strokeRect(-3.5,-3.5,7,7); ctx.fillRect(-3.5,-3.5,7,7); ctx.restore();
      const cw=Math.max(maxW,Math.min(300,MINI_R().x-L-12));   // as wide as the room left of the minimap
      goalLine(g.text,L+16,qy,cw-14,g.x!=null?dist(p.x,p.y,g.x,g.y)/25:null,'#f6ead8',txt);
      let ly=qy+8;
      if(n>0){ ly+=8; ctx.font=`600 10px ${UIF}`; ctx.fillStyle='rgba(230,215,190,.8)'; txt(`+${n} more ${usingTouch?'(tap here)':`(${btnLabel('journal')})`}`,L+16,ly); ly+=6; }
      TRACK_R={x:L-4,y:qy-12,w:cw+12,h:ly-qy+18};
    }else{
    ctx.font=`700 10.5px ${TF}`; ctx.fillStyle='#ffcf7a'; txt((sideStory?'◆ ':'')+obj.title.toUpperCase(),L+2,qy);
    goalLine(obj.text,L+2,qy+16,maxW,sideStory&&obj.x!=null?dist(p.x,p.y,obj.x,obj.y)/25:null,'#f6ead8',txt);
    let ly=qy+30;
    // on touch the list stops above the buttons on its side (they move with Settings > Handed)
    const tq=tracked(), room=(usingTouch?Math.min(H-SAFE.b-200,touchTopOver(L-4,L+maxW+8)-14):H-120)-ly;
    let shown=0;
    for(const id of tq){
      if(room<22+shown*20||shown>=(H<600?2:3)) break;
      const d=QDEFS[id], foc=G.focus===id;
      // a tracked quest: a coloured mark (gold when the compass follows it, green for an errand, blue for a side quest), its goal and, when followed, the distance
      ly+=4; const col=foc?'#ffcf7a':d.errand?'#9fe0b4':'#7fd6f0';
      ctx.save(); ctx.translate(L+6,ly+0.5); ctx.rotate(Math.PI/4); ctx.fillStyle=col; ctx.strokeStyle=LOOK.sb?SBC.outline:'rgba(0,0,0,.7)'; ctx.lineWidth=1.6; ctx.strokeRect(-3,-3,6,6); ctx.fillRect(-3,-3,6,6); ctx.restore();
      goalLine(stepText(id),L+16,ly,maxW-14,foc&&fo&&fo.x!=null?dist(p.x,p.y,fo.x,fo.y)/25:null,foc?'#fff0d8':'#e2eef2',txt,`500 11.5px ${UIF}`);
      ly+=16; shown++;
    }
    const more=activeQuests().length-shown;
    if(more>0&&room>30){ ly+=4; ctx.font=`600 10px ${UIF}`; ctx.fillStyle='rgba(230,215,190,.78)'; txt(`+${more} more in your journal ${usingTouch?'(tap here)':`(${btnLabel('journal')})`}`,L+2,ly); ly+=12; }
    TRACK_R={x:L-4,y:qy-12,w:maxW+12,h:ly-qy+16};
    }
  }else if(G.mode==='normal'){
    ctx.textAlign='left'; ctx.font=`700 11px ${TF}`; ctx.fillStyle='#ffcf7a'; ctx.fillText(`ARENA · ${G.diff.name.toUpperCase()}`,L+2,qy);
    ctx.font=`800 18px ${TF}`; ctx.fillStyle='#fff3dc'; ctx.fillText(G.wave>0?`Wave ${G.wave}`:'Get ready',L+2,qy+20);
    ctx.font=`700 13px ${UIF}`; ctx.fillStyle='#f2e6d4'; ctx.fillText(`Score ${fmt(G.score)}`,L+2,qy+40);
    if(G.combo>=2){ const m=comboMult(); ctx.fillStyle=m>1?'#ffcf5a':'#d8c4a4'; ctx.fillText(`${G.combo} streak${m>1?'  ×'+m:''}`,L+2,qy+57); }
  }
  // minimap + buttons
  drawIconBtn(PAUSE_R(),'pause'); drawIconBtn(MUTE_R(),allMuted()?'muted':'sound');
  drawMinimap(fo||obj);
  // boss bar
  const b=G.boss;
  if(b&&!b.dead){
    const bw2=Math.min(620,W-40-SAFE.l-SAFE.r), bx2=(W-bw2)/2, by=usingTouch?(W>=720?T+40:T+(story?170:150)):H-SAFE.b-46;
    ctx.textAlign='center'; ctx.font=`800 15px ${TF}`; ctx.fillStyle='#ffd9b0'; ctx.lineJoin='round'; ctx.lineWidth=LOOK.sb?4.6:3.4; ctx.strokeStyle=LOOK.sb?SBC.outline:'rgba(0,0,0,.7)'; ctx.strokeText(EDEF[b.type].name,W/2,by-20); ctx.fillText(EDEF[b.type].name,W/2,by-20);
    bar(bx2,by-8,bw2,12,clamp(b.hp/b.maxHp,0,1),b.invuln?'#8a5a3a':'#b8281e','rgba(30,6,4,.9)');
    ctx.strokeStyle='rgba(255,200,150,.3)'; ctx.lineWidth=1; rr(bx2,by-8,bw2,12,6); ctx.stroke();
    // phase marks on the bar and one pip per phase (lit up to the phase the fight is in); bossPhase (e8_foes.js) sets b.phases and b.bph
    const th=b.phases||(b.type==='vorlaxis'?[0.66,0.33]:null);
    if(th){ ctx.fillStyle='rgba(255,255,255,.55)'; for(const f of th) ctx.fillRect(bx2+bw2*f-1,by-8,2,12);
      const ph=b.type==='vorlaxis'?(b.phase||1)-1:(b.bph||0), n=th.length+1;
      for(let i=0;i<n;i++){ const x=bx2+bw2-6-(n-1-i)*15, y=by-20; ctx.beginPath(); ctx.moveTo(x,y-5); ctx.lineTo(x+5,y); ctx.lineTo(x,y+5); ctx.lineTo(x-5,y); ctx.closePath(); ctx.fillStyle=i<=ph?'#ff9a3a':'rgba(40,20,14,.85)'; ctx.fill(); ctx.strokeStyle='rgba(255,215,170,.75)'; ctx.lineWidth=1; ctx.stroke(); } }
    // (v11 polish) the title under the bar: light letters with an outline, readable on any ground
    ctx.font=`600 11.5px ${UIF}`; let sub=EDEF[b.type].title; if(EDEF[b.type].short&&ctx.measureText(sub).width>bw2) sub=EDEF[b.type].short; sub=simplify(sub);
    ctx.lineJoin='round'; ctx.lineWidth=LOOK.sb?3.6:3.2; ctx.strokeStyle=LOOK.sb?'rgba(59,34,51,.95)':'rgba(10,6,4,.85)'; ctx.strokeText(sub,W/2,by+16); ctx.fillStyle=LOOK.sb?'#fff0d4':'#f2dcc0'; ctx.fillText(sub,W/2,by+16);
  }
  doorNoteDraw();   // the short note over a locked door Ash bumped (a2e_interiors.js)
  drawWeaponHud(); if(story) drawCompHud(); drawMoveHud(); if(story){ lvQueue(); drawSkillHud(); }
  drawBanner(); drawTaunt(); drawCompass(fo||obj); if(story) drawMiniHUD();
  // prompt: (v11 polish) drawn after the speech bubbles (drawCompHud draws them), so it is always on top
  if(G.prompt&&scene==='play'){
    drawPromptPill(b);
  }
  if(story&&G.hintT>=29&&G.playTime<5&&!G.flags.coach) G.flags.coach=1;   // a new journey (startStory sets G.hintT=30): the coach is on
  if(scene==='play'&&tipOn('play')) drawCoach(b);
  drawOffscreen(); drawTouch();
}
function drawMinimap(obj){
  const M=MINI_R(), r=M.r, cx=M.x+r, cy=M.y+r, p=player, span=1100, sc=r/span;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fillStyle='#14100c'; ctx.fill(); ctx.clip();
  const toM=(x,y)=>[cx+(x-p.x)*sc,cy+(y-p.y)*sc];
  if(AREA){
    if(AREA.rooms&&AREA.dn&&typeof dunMiniDraw==='function') dunMiniDraw(ctx,toM,sc);   // rooms, doors, keys (e9a_dungeon.js)
    else if(AREA.mini){ const c=AREA.cave, k=c.cell; ctx.imageSmoothingEnabled=false; ctx.drawImage(AREA.mini,cx+(AREA.x0-p.x)*sc,cy+(AREA.y0-p.y)*sc,c.w*k*sc,c.h*k*sc); }
    else { ctx.fillStyle='#5a3e28'; const [x,y]=toM(AREA.rx,AREA.ry); ctx.fillRect(x,y,AREA.rw*sc,AREA.rh*sc); }
    const [ex,ey]=toM(AREA.exit.x,AREA.exit.y); ctx.fillStyle='#8fe08a'; ctx.beginPath(); ctx.arc(ex,ey,4,0,TAU); ctx.fill();
  } else { const O=ovOf(curMap()); if(O.cv){ const ow=span*2/O.s; ctx.imageSmoothingEnabled=true; ctx.drawImage(O.cv,p.x/O.s-ow/2,(p.y-O.y0)/O.s-ow/2,ow,ow,cx-r,cy-r,r*2,r*2); } }
  if(G.mode==='story'){ const mk=curMap();
    for(const s of mapList(SHRINES,mk)){ const [x,y]=toM(s.x,s.y); ctx.fillStyle=G.shrines[s.id]?'#7fd0ff':'#6b6f7a'; ctx.beginPath(); ctx.arc(x,y,3,0,TAU); ctx.fill(); }
    for(const c of mapList(CHESTS,mk)) if(!c.open&&dist2(c.x,c.y,p.x,p.y)<700*700){ const [x,y]=toM(c.x,c.y); ctx.fillStyle='#ffd27a'; ctx.fillRect(x-2,y-1.5,4,3); }
    if(!AREA){ for(const n of G.npcs){ const m=npcMarker(n.id); if(!m||m==='…'||m==='✉'||dist2(n.x,n.y,p.x,p.y)>span*span) continue; const [x,y]=toM(n.x,n.y); ctx.fillStyle=m==='!'?'#ffcf4a':'#7fe0ff'; ctx.font=`900 10px ${UIF}`; ctx.textAlign='center'; ctx.fillText(m,x,y); }
      for(const m of mapList(CAVEMOUTHS,mk)){ if(dist2(m.x,m.y,p.x,p.y)>span*span) continue; const [x,y]=toM(m.x,m.y); ctx.fillStyle='#1a1410'; ctx.strokeStyle='#c8b8a0'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x,y,3.5,Math.PI,TAU); ctx.lineTo(x+3.5,y+2); ctx.lineTo(x-3.5,y+2); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    if(!AREA) for(const q of questTargets()){ let [x,y]=toM(q.x,q.y); const d=dist(x,y,cx,cy); if(d>r-6){ const a=Math.atan2(y-cy,x-cx); x=cx+Math.cos(a)*(r-6); y=cy+Math.sin(a)*(r-6); } ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4); ctx.fillStyle='#7fe0ff'; ctx.strokeStyle='#08303a'; ctx.lineWidth=1.2; ctx.fillRect(-3,-3,6,6); ctx.strokeRect(-3,-3,6,6); ctx.restore(); }
  }
  for(const e of G.enemies) if(!e.dead&&!e.frozen&&(e.aggro||e.boss)&&dist2(e.x,e.y,p.x,p.y)<span*span){ const [x,y]=toM(e.x,e.y); ctx.fillStyle=e.boss?'#ff9a3a':'#ff5a40'; ctx.beginPath(); ctx.arc(x,y,e.boss?3.5:2,0,TAU); ctx.fill(); }
  ctx.restore();
  if(obj&&obj.x!=null){ let [x,y]=toM(obj.x,obj.y); const d=dist(x,y,cx,cy); if(d>r-6){ const a=Math.atan2(y-cy,x-cx); x=cx+Math.cos(a)*(r-6); y=cy+Math.sin(a)*(r-6); } ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4); ctx.fillStyle='#ffb547'; ctx.strokeStyle='#3a2208'; ctx.lineWidth=1.5; ctx.fillRect(-4,-4,8,8); ctx.strokeRect(-4,-4,8,8); ctx.restore(); }
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(p.facing); ctx.fillStyle='#ffe2a0'; ctx.strokeStyle='#2a1a08'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(-4,-4); ctx.lineTo(-2,0); ctx.lineTo(-4,4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  if(LOOK.sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(cx,cy,r+1.5,0,TAU); ctx.stroke(); ctx.strokeStyle='#fff3d6'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.stroke(); }
  else{ ctx.strokeStyle='rgba(220,190,150,.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.stroke(); }
  ctx.font=`800 10px ${TF}`; ctx.fillStyle='#f2e0c0'; ctx.textAlign='center'; ctx.fillText('N',cx,M.y+9);
  // time and region
  const day=daylight(), tod=G.tod, hrs=Math.floor(((tod*24)+24)%24), mins=Math.floor((tod*24*60)%60);
  ctx.font=`600 10px ${UIF}`; ctx.fillStyle='#e6d6bc'; ctx.textAlign='center';
  const reg=G.region?G.region.name:regionAt(p.x,p.y).name;
  ctx.lineWidth=LOOK.sb?3.4:3; ctx.strokeStyle=LOOK.sb?'rgba(59,34,51,.92)':'rgba(10,8,6,.7)'; ctx.lineJoin='round';
  const tt=`${day>0.25?'☀':'☾'} ${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`; ctx.strokeText(tt,cx,M.y+r*2+11); ctx.fillText(tt,cx,M.y+r*2+11);
  ctx.font=`600 10px ${TF}`; ctx.fillStyle='#e8d6b8'; const rt=reg.length>26?reg.slice(0,25)+'.':reg; ctx.strokeText(rt,cx,M.y+r*2+25); ctx.fillText(rt,cx,M.y+r*2+25);
  if(AREA&&AREA.rooms&&typeof dunHudStrip==='function') dunHudStrip(M);   // small keys, map, compass, Boss Key
}
function drawCompass(obj){
  if(!obj||obj.x==null||scene!=='play') return;
  const sx=(obj.x-cam.x)*zoom, sy=(obj.y-cam.y)*zoom;
  if(sx>40&&sx<W-40&&sy>40&&sy<H-40){
    // (v11 polish) on screen: the marker fades out as Ash gets close (it sat on Grizzlefang's head and on the cellar
    // stairs), and a person who already shows a ! or ? over their head needs no second mark
    const dW=dist(player.x,player.y,obj.x,obj.y), k=clamp((dW-130)/110,0,1);
    if(k<=0.02) return;
    if(obj.npc&&typeof npcMarker==='function'){ const m=npcMarker(obj.npc); if(m==='!'||m==='?') return; }
    if(G.boss&&!G.boss.dead&&dist(G.boss.x,G.boss.y,obj.x,obj.y)<400) return;   // the boss bar says who to fight
    const bob=Math.sin(G.time*4)*3;
    ctx.save(); ctx.globalAlpha=k; ctx.translate(sx,sy-34+bob); ctx.rotate(Math.PI/4); ctx.fillStyle='rgba(255,181,71,.9)'; ctx.strokeStyle=LOOK.sb?SBC.outline:'#3a2208'; ctx.lineWidth=1.5; ctx.fillRect(-5,-5,10,10); ctx.strokeRect(-5,-5,10,10); ctx.restore(); return;
  }
  const m=34, ex=clamp(sx,m+SAFE.l,W-m-SAFE.r), ey=clamp(sy,m+SAFE.t+(W<720?185:150),H-m-SAFE.b), a=Math.atan2(sy-ey,sx-ex);
  // (v11 polish) under a banner the arrow steps back (it sat on top of the Level title)
  const under=G.banner&&scene==='play'&&Math.abs(ex-W/2)<320&&ey>H*0.14&&ey<H*0.26+70;
  ctx.save(); if(under) ctx.globalAlpha=0.3; ctx.translate(ex,ey); ctx.rotate(a); ctx.fillStyle='#ffb547'; ctx.strokeStyle='#3a2208'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(13,0); ctx.lineTo(-7,-8); ctx.lineTo(-3,0); ctx.lineTo(-7,8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function drawBanner(){
  bnTick(); drawPlate();
  // (v11 polish) a banner waits out talks, menus and the blessing pick (its clock stops there too), so it never sits
  // frozen under a dialogue box
  if(scene!=='play') return;
  // the next banner in line steps up when the last one is done (setBanner in a9a_env.js queues them)
  if(!G.banner&&G.bannerQ&&G.bannerQ.length) G.banner=G.bannerQ.shift();
  const bn=G.banner; if(!bn) return;
  // another module may grow the text after the fact (the skills build adds the skill point line): more time to read it
  const len=bn.text.length+bn.sub.length; if(len!==bn.len){ bn.len=len; bn.dur=Math.max(bn.dur,bn.t+readT(bn.text+' '+bn.sub)*0.8); if(bn.log) bn.log.sub=bn.sub; }
  // (v11 polish) more waiting: no counter chip, this one just makes room a little sooner
  const nq=G.bannerQ?G.bannerQ.length:0;
  if(nq&&!bn.hurry&&bn.style!=='boss'){ bn.hurry=true; bn.dur=Math.max(bn.t+0.8,Math.min(bn.dur,Math.max(2.6,bn.dur*0.65))); }
  const a=clamp(Math.min(bn.t/0.25,(bn.dur-bn.t)/0.5),0,1); if(a<=0) return;
  ctx.save(); ctx.globalAlpha=a; ctx.textAlign='center'; ctx.lineJoin='round';
  const y=H*(bn.style==='region'?0.2:(usingTouch&&bn.style==='boss'?0.42:0.26)), quest=!!bn.q;
  let tw=0, bot=y;
  if(bn.style==='boss'){
    ctx.font=`800 ${W<560?26:40}px ${TF}`; ctx.lineWidth=LOOK.sb?7:6; ctx.strokeStyle=LOOK.sb?SBC.outline:'rgba(0,0,0,.75)'; ctx.strokeText(bn.text,W/2,y); ctx.fillStyle='#ff7a3a'; ctx.fillText(bn.text,W/2,y); tw=ctx.measureText(bn.text).width;
    ctx.font=`600 14px ${UIF}`; const ls=wrapText(bn.sub,W-48); ctx.fillStyle=LOOK.sb?'#fff4dc':'#f0dcc0'; ls.forEach((l,i)=>{ ctx.lineWidth=LOOK.sb?4.6:4; ctx.strokeText(l,W/2,y+32+i*18); ctx.fillText(l,W/2,y+32+i*18); }); bot=y+32+ls.length*18;
  }else{
    // quest news is a size down from a level up or a region title: it is read, not announced
    const fs=bn.style==='region'?(W<560?22:30):quest?(W<560?19:24):(W<560?22:32);
    ctx.font=`${bn.style==='region'?'600':'800'} ${fs}px ${TF}`;
    if(LOOK.sb){ tw=ctx.measureText(bn.text).width; if(bn.style==='region') sbRibbon(W/2,y,Math.min(W-24,tw+72),W<560?34:44); ctx.lineWidth=quest?6:7; ctx.strokeStyle=SBC.outline; }
    else{ ctx.lineWidth=quest?5:6; ctx.strokeStyle='rgba(0,0,0,.65)'; }
    ctx.strokeText(bn.text,W/2,y); ctx.fillStyle=bn.style==='region'?(LOOK.sb?'#fff4dc':'#f6e9d6'):'#ffd27a'; ctx.fillText(bn.text,W/2,y); tw=ctx.measureText(bn.text).width;
    const sy=y+(quest?25:30);
    if(bn.sub){ ctx.font=`600 14px ${UIF}`; const ls=wrapText(bn.sub,Math.min(W-48,620)).slice(0,3); ls.forEach((l,i)=>{ ctx.lineWidth=LOOK.sb?4.6:4; ctx.strokeText(l,W/2,sy+i*18); ctx.fillStyle=LOOK.sb?'#fff4dc':'#f0dcc0'; ctx.fillText(l,W/2,sy+i*18); }); bot=sy+ls.length*18; }
  }
  ctx.restore();
  // touch: tap the banner to let it go (with a mouse any click does it, see the mousedown handler in a5_input.js)
  if(usingTouch&&scene==='play'&&bn.t>0.3){ const bw=Math.min(W-24,Math.max(tw,200)+40); HUD_HITS.push({x:W/2-bw/2,y:y-26,w:bw,h:bot-y+34,fn:bannerSkip}); }
}
function drawTaunt(){
  if(!G.taunt&&G.tauntQ&&G.tauntQ.length) G.taunt=G.tauntQ.shift();
  const t=G.taunt; if(!t) return;
  const a=clamp(Math.min(t.t/0.2,(t.dur-t.t)/0.4),0,1); if(a<=0) return;
  ctx.save(); ctx.globalAlpha=a; ctx.textAlign='center';
  ctx.font=`italic 500 15px ${UIF}`;
  const maxW=Math.min(520,W-56), lines=wrapText('“'+t.text+'”',maxW), lh=20;
  const bw=Math.min(maxW+32,Math.max(...lines.map(l=>ctx.measureText(l).width))+40), bh=34+lines.length*lh, x=(W-bw)/2, y=H*0.6;
  if(LOOK.sb){ sbPanel(x,y,bw,bh,14); ctx.strokeStyle=t.col; ctx.lineWidth=2; rr(x+4,y+4,bw-8,bh-8,10); ctx.stroke(); }
  else{ ctx.fillStyle='rgba(14,8,6,.84)'; rr(x,y,bw,bh,10); ctx.fill(); ctx.strokeStyle=t.col; ctx.lineWidth=1; ctx.stroke(); }
  ctx.font=`800 12px ${TF}`; ctx.fillStyle=t.col; ctx.fillText(t.who.toUpperCase(),W/2,y+16);
  ctx.font=`italic 500 15px ${UIF}`; ctx.fillStyle='#f6e9d6'; lines.forEach((l,i)=>ctx.fillText(l,W/2,y+36+i*lh));
  ctx.restore();
}
function drawOffscreen(){
  let n=0; const m=22;
  for(const e of G.enemies){
    if(e.dead||e.frozen||e.alpha<0.3||!e.aggro) continue;
    const sx=(e.x-cam.x)*zoom, sy=(e.y-cam.y)*zoom;
    if(sx>-10&&sx<W+10&&sy>-10&&sy<H+10) continue;
    if(dist(e.x,e.y,player.x,player.y)>900&&!e.boss) continue;
    if(!e.boss&&++n>10) continue;
    const ex=clamp(sx,m+SAFE.l,W-m-SAFE.r), ey=clamp(sy,m+SAFE.t,H-m-SAFE.b), a=Math.atan2(sy-ey,sx-ex), s=e.boss?12:7;
    ctx.save(); ctx.translate(ex,ey); ctx.rotate(a); ctx.fillStyle=e.boss?'#ff9a3a':'rgba(255,80,60,.85)'; ctx.beginPath(); ctx.moveTo(s,0); ctx.lineTo(-s*0.7,-s*0.7); ctx.lineTo(-s*0.7,s*0.7); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
// ---------- prompt pill and first-play hints (controls build): they name the right button for the device in use
// find a spot for a box (centre x,y) that clears the touch buttons: nudge it up a little, else slide it sideways, else lift it above them
function touchClear(w,h,y){
  if(!usingTouch) return {x:W/2,y};
  const L=tLayout(), x0=SAFE.l+10+w/2, x1=W-SAFE.r-10-w/2;
  const free=(x,y)=>!L.some(b=>Math.abs(b.x-x)<w/2+b.r+6&&Math.abs(b.y-y)<h/2+b.r+6);
  for(let it=0;it<8;it++){
    for(let dy=0;dy<=80;dy+=8) if(free(W/2,y-dy)) return {x:W/2,y:y-dy};
    let best=null; for(let x=x0;x<=x1;x+=8) if(free(x,y)&&(best==null||Math.abs(x-W/2)<Math.abs(best-W/2))) best=x;
    if(best!=null) return {x:best,y};
    let top=1e9; for(const b of L) if(Math.abs(b.y-y)<h/2+b.r+6) top=Math.min(top,b.y-b.r);
    y=top-h/2-8;
  }
  return {x:W/2,y};
}
let PROMPT_R=null;
// where the prompt pill and the hint box start on touch: a little above the buttons (short screens: along the bottom)
function touchBase(){ const B=H-SAFE.b; return B-SAFE.t<600?B-30:Math.min(B-300,touchTopOver(0,W)-30); }
// (v11) the person or thing the prompt is about gets a soft gold ring at its feet, so it is always clear who E (or a
// click) will talk to or what it will use, even with two people standing close together
function drawPromptTarget(){
  const pr=G.prompt; if(!pr||pr.x==null||pr.y==null||!player) return;
  if(Math.abs(pr.x-player.x)<2&&Math.abs(pr.y-player.y)<2) return;   // a prompt about Ash himself (fishing, flying)
  const sx=(pr.x-cam.x)*zoom, sy=(pr.y-cam.y)*zoom; if(sx<-40||sy<-40||sx>W+40||sy>H+40) return;
  const n=AREA?AREA.npcs&&AREA.npcs.find(q=>q.x===pr.x&&q.y===pr.y):G.npcs.find(q=>q.x===pr.x&&q.y===pr.y);
  const r=(n?20:16)*zoom, k=0.5+0.5*Math.sin((G.time||0)*4.2), g=ctx;
  g.save(); g.translate(sx,sy+(n?3:0)*zoom); g.scale(1,0.5);
  g.lineWidth=4.5; g.strokeStyle=LOOK.sb?'rgba(59,34,51,.45)':'rgba(0,0,0,.35)'; g.beginPath(); g.arc(0,0,r+2+k*2,0,TAU); g.stroke();
  g.lineWidth=2.4; g.strokeStyle=`rgba(255,214,120,${0.75+0.2*k})`; g.setLineDash([7,5]); g.lineDashOffset=-(G.time||0)*12; g.beginPath(); g.arc(0,0,r+2+k*2,0,TAU); g.stroke();
  g.restore();
}
function drawPromptPill(b){
  drawPromptTarget();
  const dev=curDevice(), t=simplify(G.prompt.text);
  // the key that does it: E (or the controller's top button); the left-handed keyboard shows Enter when it will
  // talk or open, and \ when a foe is close (Enter attacks then)
  const lk=dev==='kb'&&lefty()&&!useMode()?'\\':'';
  ctx.font=`800 12px ${UIF}`; const kw=dev==='kb'?Math.max(22,ctx.measureText(lk||actKey('use')).width+11):22;
  ctx.font=`600 14px ${UIF}`;
  const gw=dev==='touch'?0:kw, tw=ctx.measureText(t).width+30+(gw?gw+9:0);
  const at=touchClear(tw,32,usingTouch?touchBase():H-SAFE.b-(b&&!b.dead?96:70)), py=at.y, px=at.x; PROMPT_R={x:px-tw/2,y:py-16,w:tw,h:32};
  if(LOOK.sb) sbPill(px-tw/2,py-16,tw,32); else{ ctx.fillStyle='rgba(12,9,6,.8)'; rr(px-tw/2,py-16,tw,32,16); ctx.fill(); ctx.strokeStyle=dev==='pad'?'rgba(255,214,140,.65)':'rgba(255,210,150,.4)'; ctx.lineWidth=1; ctx.stroke(); }
  let x=px-tw/2+15;
  if(gw){ drawBtnGlyph(ctx,'use',x+gw/2,py,11,dev,lk); x+=gw+9; }
  ctx.font=`600 14px ${UIF}`; ctx.fillStyle=LOOK.sb?SBC.outline:'#ffe6c0'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(t,x,py);
}
function hintText(){ return simplify(hintTextRaw()); }
function hintTextRaw(){
  const dev=curDevice(), K=a=>btnLabel(a,dev), jump=G.mode!=='story'||hasAbil('jump'), L=lefty();
  if(dev==='touch'){
    // a phone on its side has little room: one short line
    if(H-SAFE.t-SAFE.b<600) return `Drag on the ${settings.touch==='two'?(L?'right':'left'):'free side'} to move · SLASH attacks, talks and opens · Tap flasks to drink`;
    if(settings.touch==='two') return `Drag on the ${L?'right':'left'} to move, push all the way to sprint · SLASH attacks, and says TALK or OPEN when it will do that instead · Tap the flasks to drink, the minimap for the map, the quest list for the journal`;
    return 'Drag anywhere low on the screen to move · Ash swings by himself · SLASH says TALK or OPEN near people and chests · Walk into a door to go in · Settings has more layouts';
  }
  if(dev==='pad'){
    const mv=L?'Right stick':'Left stick';
    return `${mv} move, push it all the way to sprint · ${K('attack')} or ${padBtnName(padSw(PB.R2))} attack (it talks and opens when no foe is near) · ${padBtnName(padSw(PB.L2))} fire · ${K('roll')} roll${jump?` · ${K('jump')} jump`:''} · ${K('use')} talk and open · ${K('drink')} drink · ${K('map')} map${L?' · Southpaw is on':''}`;
  }
  if(L) return `Arrow keys move · Right Shift sprint · Click or Enter attack, and talk or open when no foe is near · Right click or ' fire · Right Ctrl roll${jump?' · / jump':''} · . drink · ; roar · L log · M map`;
  if(settings.mouseAim) return `WASD move · Shift sprint · Mouse aim · Left click slash, or talk and open when no foe is near · Right click fire · ${K('roll')} roll${jump?` · ${K('jump')} jump`:''} · ${K('drink')} drink · ${K('use')} use · ${K('map')} map`;
  return `WASD move, Ash faces the way he walks · Shift sprint · Click or J attack, and talk or open when no foe is near · Right click or K fire · ${K('roll')} roll${jump?` · ${K('jump')} jump`:''} · ${K('drink')} drink · ${K('use')} use · L log · ${K('map')} map`;
}
// ---------- (v11 polish) the controls coach: one short line at a time, each control when it becomes useful (move and
// talk first, attack and roll once the sword is in hand, roll away in the first fight, drink when hurt, the map later).
// A new journey turns it on (G.flags.coach); each tip shows once per journey (G.flags.coach_<id>). Old saves get none.
// Settings > Tips Off hides it, and its X closes it for good (Tips off and on brings it back), as the old hint did.
// Each tip is [id, when, max seconds, done early, parts by device]; a part is text, or {k:action} for a key or button.
const COACH={id:null,shown:0,gap:0,last:0,moved:0,px:0,py:0,sc:null,pot:0,a:0};
function coachLeft(){ return lefty()?'Right':'Left'; }
const COACH_TIPS=[
  ['move',()=>true,10,()=>COACH.moved>260&&COACH.shown>4,{
    kb:[{k:'move'},'Move',{k:'sprint'},'Run',{k:'use'},'Talk'],
    pad:[()=>coachLeft()+' stick','Move',{k:'use'},'Talk'],
    touch:[()=>settings.touch==='two'?`Drag on the ${lefty()?'right':'left'} to move`:'Drag low on the screen to move','·','SLASH says TALK near people']}],
  ['door',()=>!AREA&&!G.inCombat&&DOORS.some(d=>dist2(d.x,d.y,player.x,player.y)<150*150),6,()=>!!AREA,{
    all:['Walk into a door to go inside']}],
  ['sword',()=>!!(G.flags.forge||(G.weapons&&G.weapons.sword)),8,null,{
    kb:()=>settings.mouseAim?[{t:'Click'},'Slash toward the mouse',{k:'roll'},'Roll']:[{k:'attack'},'or click to attack',{k:'roll'},'Roll'],
    pad:[{k:'attack'},'Attack',{k:'roll'},'Roll'],
    touch:()=>autoAttackOn()?['Ash swings by himself near foes','·','ROLL dodges']:['SLASH attacks','·','ROLL dodges']}],
  ['fight',()=>G.inCombat&&G.enemies.some(e=>!e.dead&&e.tele&&dist2(e.x,e.y,player.x,player.y)<320*320),6,null,{
    kb:['A red mark means a hit is coming:',{k:'roll'},'Roll away'], pad:['A red mark means a hit is coming:',{k:'roll'},'Roll away'],
    touch:['A red mark means a hit is coming: ROLL away']}],
  ['drink',()=>player.potions>0&&player.hp<player.maxHp*0.5,7,()=>player.potions<COACH.pot,{
    kb:[{k:'drink'},'Drink a healing draught'], pad:[{k:'drink'},'Drink a healing draught'], touch:['Tap the flasks at the top to drink']}],
  ['roar',()=>player.roar>=100,6,()=>player.roar<100,{
    kb:['Your ROAR is full:',{k:'roar'},'Roar'], pad:['Your ROAR is full:',{k:'roar'},'Roar'], touch:['Your ROAR is full: tap ROAR']}],
  ['jump',()=>hasAbil('jump'),6,null,{
    kb:[{k:'jump'},'Jump'], pad:[{k:'jump'},'Jump'], touch:['JUMP hops over gaps and low walls']}],
  ['map',()=>G.playTime>150&&!G.inCombat&&!!G.flags.forge,8,null,{
    kb:[{k:'map'},'Map',{k:'journal'},'Journal',{k:'log'},'What was said'], pad:[{k:'map'},'Map',{k:'journal'},'Journal'],
    touch:['Tap the minimap for the map, the goal list for the journal']}],
];
const COACH_ARENA={kb:[{k:'move'},'Move',{k:'attack'},'Attack',{k:'roll'},'Roll',{k:'drink'},'Drink'],pad:[()=>coachLeft()+' stick','Move',{k:'attack'},'Attack',{k:'roll'},'Roll',{k:'drink'},'Drink'],
  touch:['Drag to move','·','SLASH attacks','·','ROLL dodges','·','Tap the flasks to drink']};
function coachParts(P,dev){
  let L=P[dev]||P.all||P.kb; if(typeof L==='function') L=L();
  return L.map(q=>typeof q==='function'?{t:q()}:typeof q==='string'?{t:simplify(q)}:q.k?(dev==='touch'?{t:simplify(btnLabel(q.k,'touch'))}:{k:q.k}):q);
}
function coachTick(){
  const now=G.time, dt=clamp(now-(COACH.last||now),0,0.1); COACH.last=now;
  if(COACH.g!==G){ COACH.g=G; COACH.id=null; COACH.shown=0; COACH.gap=now+0.6; COACH.moved=0; COACH.px=player.x; COACH.py=player.y; }
  COACH.moved+=Math.min(60,dist(player.x,player.y,COACH.px,COACH.py)); COACH.px=player.x; COACH.py=player.y;
  if(G.mode!=='story') return G.hintT>0?{parts:COACH_ARENA,a:Math.min(1,G.hintT/1.5)}:null;
  if(!G.flags.coach) return null;
  // it waits while a banner, a chapter card or a talk is up, and for the quest news that is about to come
  const card=COACH.card||(COACH.card=document.getElementById('card'));
  const busy=scene!=='play'||!!G.banner||!!G.fishing||SK.hintEnd>G.time&&tipOn('skills')||!!(card&&card.classList.contains('on'))||G.timers.some(tm=>tm.fn===questUpdated&&tm.t<4);
  if(COACH.id){
    const T=COACH_TIPS.find(t=>t[0]===COACH.id);
    if(!busy) COACH.shown+=dt;
    const over=COACH.shown>=T[2]||(T[3]&&COACH.shown>1.2&&T[3]());
    if(over&&!COACH.out){ COACH.out=now; }
    if(COACH.out&&now-COACH.out>0.5){ G.flags['coach_'+T[0]]=1; COACH.id=null; COACH.out=0; COACH.gap=now+1.4; return null; }
    if(busy) return null;
    const a=COACH.out?clamp(1-(now-COACH.out)/0.5,0,1):clamp(COACH.shown/0.3,0,1);
    return {parts:T[4],a};
  }
  if(busy||now<COACH.gap) return null;
  for(const T of COACH_TIPS){ if(G.flags['coach_'+T[0]]) continue; let ok=false; try{ ok=!!T[1](); }catch(e){} if(ok){ COACH.id=T[0]; COACH.shown=0; COACH.out=0; COACH.pot=player.potions; break; } }
  return null;
}
function drawCoach(b){
  const C=coachTick(); if(!C||C.a<=0.01) return;
  const dev=curDevice(), parts=coachParts(C.parts,dev), r=usingTouch?0:9;
  const sc=COACH.sc||(COACH.sc=mkCanvas(8,8).getContext('2d')), TXT=`600 13px ${UIF}`;
  // widths: key caps and pad buttons are measured by drawing them once on a scratch canvas
  ctx.font=TXT; let tw=0; const ws=parts.map((q,i)=>{ const w=q.k?drawBtnGlyph(sc,q.k,20,20,r,dev):ctx.measureText(q.t).width; const gap=i===0?0:(q.k&&!parts[i-1].k?16:q.k?6:parts[i-1].k?7:6); tw+=w+gap; return [w,gap]; });
  const bh=usingTouch?32:30, bw=tw+(usingTouch?58:54);
  let y0=H-SAFE.b-(b&&!b.dead?96:30)-bh/2-(G.prompt&&!usingTouch?48:0), cx=W/2;
  if(usingTouch){ let top=touchBase()-bh-24; if(G.prompt&&PROMPT_R) top=Math.min(top,PROMPT_R.y-bh-10); const at=touchClear(bw,bh,top+bh/2); cx=at.x; y0=at.y; }
  // never up on the vitals, the quest goal or the minimap
  const shortT=usingTouch&&H-SAFE.t-SAFE.b<600;
  y0=Math.max(y0,SAFE.t+(shortT?164:24)+bh/2);
  if(shortT){ const mx=MINI_R().x-14; if(mx-SAFE.l-14>=bw) cx=clamp(cx,SAFE.l+14+bw/2,mx-bw/2); }
  cx=clamp(cx,SAFE.l+8+bw/2,W-SAFE.r-8-bw/2);
  ctx.save(); ctx.globalAlpha=C.a; ctx.textBaseline='middle'; ctx.textAlign='left';
  if(LOOK.sb) sbPanel(cx-bw/2,y0-bh/2,bw,bh,bh/2); else{ ctx.fillStyle='rgba(12,9,6,.8)'; rr(cx-bw/2,y0-bh/2,bw,bh,bh/2); ctx.fill(); ctx.strokeStyle='rgba(255,210,150,.28)'; ctx.lineWidth=1; ctx.stroke(); }
  let x=cx-bw/2+(usingTouch?14:16);
  parts.forEach((q,i)=>{ const [w,gap]=ws[i]; x+=gap;
    if(q.k) drawBtnGlyph(ctx,q.k,x+w/2,y0,r,dev);
    else { ctx.font=TXT; ctx.fillStyle=q.t==='·'?'rgba(255,220,170,.55)':LOOK.sb?'#fff3d6':'#efdfc6'; ctx.fillText(q.t,x,y0+0.5); }
    x+=w; });
  ctx.restore();
  // the X closes it for good (turning Settings > Tips off and on brings it back)
  if(C.a>0.3) tipX(cx+bw/2-(usingTouch?19:17),y0,()=>{ G.hintT=0; if(COACH.id){ COACH.out=G.time; } tipShut('play'); },usingTouch?11:8);
}
// ---------- touch buttons
const WICON_STUB=/\{\s*\}\s*$/.test(String(drawWeaponIcon));
function touchIcon(id,x,y,r,col,label){
  ctx.save(); ctx.translate(x,y); const k=r/34; ctx.scale(k,k); ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round';
  if(id==='attack'){ ctx.rotate(-0.8); ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(16,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(10,-4); ctx.lineTo(10,4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8,-7); ctx.lineTo(-8,7); ctx.stroke(); ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-15,0); ctx.lineTo(-11,0); ctx.stroke(); }
  else if(id==='fire'){ ctx.beginPath(); ctx.moveTo(0,-15); ctx.quadraticCurveTo(12,-2,9,7); ctx.quadraticCurveTo(6,14,0,14); ctx.quadraticCurveTo(-6,14,-9,7); ctx.quadraticCurveTo(-12,-2,0,-15); ctx.fill(); ctx.fillStyle='rgba(20,10,6,.6)'; ctx.beginPath(); ctx.moveTo(0,-3); ctx.quadraticCurveTo(5,4,3,8); ctx.quadraticCurveTo(0,11,-3,8); ctx.quadraticCurveTo(-5,4,0,-3); ctx.fill(); }
  else if(id==='roll'){ ctx.beginPath(); ctx.arc(0,0,11,-2.6,1.9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5,-13); ctx.lineTo(-11,-8); ctx.lineTo(-3,-6); ctx.closePath(); ctx.fill(); }
  else if(id==='roar'){ ctx.beginPath(); ctx.arc(-8,0,4,0,TAU); ctx.fill(); for(const rr of [8,14]){ ctx.beginPath(); ctx.arc(-8,0,rr,-0.8,0.8); ctx.stroke(); } }
  else if(id==='drink'){ ctx.beginPath(); ctx.moveTo(-3,-14); ctx.lineTo(3,-14); ctx.lineTo(3,-6); ctx.quadraticCurveTo(11,-2,10,6); ctx.quadraticCurveTo(8,14,0,14); ctx.quadraticCurveTo(-8,14,-10,6); ctx.quadraticCurveTo(-11,-2,-3,-6); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8,4); ctx.quadraticCurveTo(0,1,8,4); ctx.quadraticCurveTo(7,12,0,12); ctx.quadraticCurveTo(-7,12,-8,4); ctx.fill(); }
  else if(id==='use'){ ctx.beginPath(); ctx.arc(0,0,4.5,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0,0,10,0,TAU); ctx.stroke(); ctx.globalAlpha=0.6; for(let i=0;i<4;i++){ const a=i*Math.PI/2+Math.PI/4; ctx.beginPath(); ctx.moveTo(Math.cos(a)*14,Math.sin(a)*14); ctx.lineTo(Math.cos(a)*18,Math.sin(a)*18); ctx.stroke(); } }
  else if(id==='jump'){
    if(label==='JUMP'){ ctx.lineWidth=3.6; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(0,-10); ctx.lineTo(10,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10,9); ctx.lineTo(0,-1); ctx.lineTo(10,9); ctx.stroke(); ctx.globalAlpha=0.55; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(-12,16); ctx.lineTo(12,16); ctx.stroke(); }
    else { // a wing: FLY in the air, LAND while flying
      ctx.beginPath(); ctx.moveTo(-15,8); ctx.quadraticCurveTo(-8,-15,15,-13); ctx.quadraticCurveTo(8,-7,11,-4); ctx.quadraticCurveTo(3,-2,7,2); ctx.quadraticCurveTo(-1,4,1,8); ctx.quadraticCurveTo(-7,7,-15,8); ctx.closePath(); ctx.fill();
      if(label==='LAND'){ ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(-4,11); ctx.lineTo(0,16); ctx.lineTo(4,11); ctx.stroke(); }
    }
  }
  else if(id==='weapon'){ // two arrows chasing each other: switch weapons
    ctx.lineWidth=2.4; ctx.globalAlpha=0.85;
    for(const s of [0,Math.PI]){ ctx.beginPath(); ctx.arc(0,0,17,s-2.3,s-0.75); ctx.stroke(); const a=s-0.75, ex=Math.cos(a)*17, ey=Math.sin(a)*17; ctx.save(); ctx.translate(ex,ey); ctx.rotate(a+Math.PI/2); ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(-2,-4); ctx.lineTo(-2,4); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  // what SLASH does near people and things (see useMode in a5_input.js)
  else if(id==='talk'){ rrect(ctx,-15,-13,30,21,8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8,7); ctx.lineTo(-11,15); ctx.lineTo(-1,7.5); ctx.closePath(); ctx.fill(); for(const dx of [-7,0,7]){ ctx.beginPath(); ctx.arc(dx,-2.5,2.4,0,TAU); ctx.fill(); } }
  else if(id==='open'){ ctx.strokeRect(-14,-1,28,14); ctx.beginPath(); ctx.moveTo(-14,-1); ctx.lineTo(-11,-12); ctx.lineTo(11,-12); ctx.lineTo(14,-1); ctx.stroke(); ctx.fillRect(-3,-3,6,7); ctx.globalAlpha=0.6; ctx.beginPath(); ctx.moveTo(-6,-17); ctx.lineTo(-4,-14); ctx.moveTo(0,-19); ctx.lineTo(0,-15); ctx.moveTo(6,-17); ctx.lineTo(4,-14); ctx.stroke(); }
  else if(id==='read'){ for(const sg of [-1,1]){ ctx.beginPath(); ctx.moveTo(0,-9); ctx.quadraticCurveTo(sg*8,-14,sg*16,-11); ctx.lineTo(sg*16,10); ctx.quadraticCurveTo(sg*8,7,0,12); ctx.closePath(); ctx.stroke(); } ctx.lineWidth=2; ctx.globalAlpha=0.7; for(const sg of [-1,1]) for(const yy of [-4,1,6]){ ctx.beginPath(); ctx.moveTo(sg*4,yy-1); ctx.lineTo(sg*12,yy-2.5); ctx.stroke(); } }
  else if(id==='enter'||id==='leave'){ ctx.strokeRect(-4,-15,17,30); ctx.beginPath(); ctx.arc(8,1,1.8,0,TAU); ctx.fill(); const d=id==='enter'?1:-1, x0=id==='enter'?-17:3, x1=id==='enter'?3:-17; ctx.beginPath(); ctx.moveTo(x0,1); ctx.lineTo(x1,1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x1+d*2,1); ctx.lineTo(x1-d*5,-5); ctx.lineTo(x1-d*5,7); ctx.closePath(); ctx.fill(); }
  else if(id==='stairs'){ ctx.beginPath(); ctx.moveTo(-15,13); ctx.lineTo(-15,6); ctx.lineTo(-6,6); ctx.lineTo(-6,-2); ctx.lineTo(3,-2); ctx.lineTo(3,-10); ctx.lineTo(12,-10); ctx.lineTo(12,13); ctx.closePath(); ctx.stroke(); }
  else if(id==='rest'){ ctx.beginPath(); ctx.arc(-3,2,12,0.75,TAU-0.75,false); ctx.quadraticCurveTo(-6,2,5.5,9.6); ctx.closePath(); ctx.fill(); ctx.font=`900 11px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('z',11,-9); ctx.font=`900 8px ${UIF}`; ctx.fillText('z',17,-15); }
  else if(id==='take'){ ctx.beginPath(); ctx.moveTo(-6,-9); ctx.lineTo(6,-9); ctx.lineTo(3,-4); ctx.quadraticCurveTo(14,1,11,9); ctx.quadraticCurveTo(8,15,0,15); ctx.quadraticCurveTo(-8,15,-11,9); ctx.quadraticCurveTo(-14,1,-3,-4); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5,-5); ctx.lineTo(5,-5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(4,-12); ctx.lineTo(-4,-12); ctx.closePath(); ctx.fill(); }
  else if(id==='fish'||id==='reel'||id==='wait'){ ctx.beginPath(); ctx.moveTo(5,-15); ctx.lineTo(5,5); ctx.arc(-1,5,6,0,Math.PI); ctx.lineTo(-7,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-7,-2); ctx.lineTo(-10,3); ctx.lineTo(-4,3); ctx.closePath(); ctx.fill(); if(id==='reel'){ ctx.lineWidth=2.2; for(const q of [0,1]){ ctx.beginPath(); ctx.arc(5,-6,9+q*5,-0.9,0.4); ctx.stroke(); } } }
  else if(id==='pet'||id==='help'){ ctx.beginPath(); ctx.moveTo(0,13); ctx.bezierCurveTo(-17,1,-12,-15,0,-6); ctx.bezierCurveTo(12,-15,17,1,0,13); ctx.closePath(); ctx.fill(); }
  else if(id==='look'){ ctx.beginPath(); ctx.moveTo(-16,0); ctx.quadraticCurveTo(0,-14,16,0); ctx.quadraticCurveTo(0,14,-16,0); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,5,0,TAU); ctx.fill(); }
  else if(id==='play'){ ctx.beginPath(); ctx.ellipse(-5,9,6,4.5,-0.4,0,TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(0,8); ctx.lineTo(0,-14); ctx.quadraticCurveTo(6,-8,12,-9); ctx.stroke(); }
  else if(id==='whistle'){ ctx.beginPath(); ctx.arc(-4,4,8,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-4,-4); ctx.lineTo(11,-4); ctx.lineTo(11,2); ctx.lineTo(3,2); ctx.stroke(); ctx.beginPath(); ctx.arc(-4,4,2.6,0,TAU); ctx.fill(); ctx.lineWidth=2.2; for(const q of [0,1]){ ctx.beginPath(); ctx.arc(10,-9,4+q*5,-1.9,-0.3); ctx.stroke(); } }
  ctx.restore();
}
function drawTouch(){
  if(!usingTouch||scene!=='play') return;
  ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
  const mode=settings.touch||'two', L=tLayout(), right=touchRight();
  if(touch.stickId!==null){
    ctx.fillStyle='rgba(255,255,255,.07)'; ctx.strokeStyle=touch.full>0.35?'rgba(140,230,120,.6)':'rgba(255,220,180,.35)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(touch.ox,touch.oy,58,0,TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,200,150,.4)'; ctx.beginPath(); ctx.arc(touch.sx,touch.sy,26,0,TAU); ctx.fill();
  }else{
    // a ghost stick where the thumb will land: the other side for two thumbs, the free side of the buttons for one hand
    let gx=right?SAFE.l+100:W-SAFE.r-100;
    if(mode!=='two'){ let e=right?W:0; for(const b of L) e=right?Math.min(e,b.x-b.r):Math.max(e,b.x+b.r); gx=right?clamp(e/2,SAFE.l+70,e-70):clamp((e+W)/2,e+70,W-SAFE.r-70); }
    const gy=H-SAFE.b-(mode==='two'?110:120);
    ctx.strokeStyle='rgba(255,220,180,.2)'; ctx.setLineDash([6,6]); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(gx,gy,54,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.font=`700 11px ${UIF}`; ctx.fillStyle='rgba(255,230,200,.4)'; ctx.fillText(mode==='two'?'MOVE':'DRAG TO MOVE',gx,gy);
  }
  const um=useMode(), pu=0.5+0.5*Math.sin(G.time*(um&&um.hot?11:5));
  for(const b of L){
    const held=touch.held[b.id]||(b.id==='fire'&&touch.fireT>0); let ready=true, prog=1, ring=true;
    if(b.id==='roar'){ prog=player.roar/100; ready=prog>=1; }
    else if(b.id==='roll'){ prog=player.stamina/player.maxStamina; ready=player.stamina>=player.stats.rollCost*0.5; }
    else if(b.id==='fire'){ prog=player.energy/player.maxEnergy; ready=!player.exhausted; }
    else if(b.id==='drink'){ prog=player.potions/player.potionsMax; ready=player.potions>0; }
    else ring=false;
    // SLASH also talks, opens and picks things up: it says so, with a soft gold pulse
    const use=b.id==='attack'&&!!um, big=b.id==='jump'||b.id==='attack';
    if(use){ ctx.fillStyle=`rgba(255,190,90,${(um.hot?0.2:0.1)+pu*0.14})`; ctx.beginPath(); ctx.arc(b.x,b.y,b.r+7+pu*4,0,TAU); ctx.fill(); }
    else if(b.id==='roar'&&ready){ ctx.fillStyle=`rgba(255,170,70,${0.1+pu*0.1})`; ctx.beginPath(); ctx.arc(b.x,b.y,b.r+6,0,TAU); ctx.fill(); }
    if(LOOK.sb){ ctx.fillStyle=SBC.outline; ctx.globalAlpha=0.55; ctx.beginPath(); ctx.arc(b.x,b.y+3,b.r+1.5,0,TAU); ctx.fill(); ctx.globalAlpha=1; }
    ctx.fillStyle=LOOK.sb?(held?'rgba(255,150,70,.7)':use?'rgba(110,60,24,.86)':big?'rgba(59,34,51,.68)':'rgba(59,34,51,.6)'):held?'rgba(255,150,70,.45)':use?'rgba(64,36,14,.78)':big?'rgba(26,18,12,.58)':'rgba(16,12,8,.52)'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,TAU); ctx.fill();
    ctx.lineWidth=LOOK.sb?(big?3.6:3):big?3:2.5; ctx.strokeStyle=use?`rgba(255,${200+Math.round(30*pu)},120,.95)`:b.id==='jump'?'rgba(150,215,255,.75)':ready?(LOOK.sb?'rgba(255,243,214,.92)':'rgba(255,220,180,.7)'):'rgba(140,120,100,.5)'; ctx.stroke();
    if(ring){ ctx.strokeStyle=b.id==='roar'&&ready?'#ffd27a':b.id==='drink'?'#5ad88a':'rgba(255,170,90,.9)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(b.x,b.y,b.r-5,-Math.PI/2,-Math.PI/2+TAU*clamp(prog,0,1)); ctx.stroke(); }
    const col=ready?'#fff0dc':'rgba(255,240,220,.5)', iy=b.y-b.r*0.12;
    let label=b.label;
    if(b.id==='weapon'){
      touchIcon('weapon',b.x,iy,b.r*0.62,'rgba(255,220,170,.75)');
      if(WICON_STUB){ touchIcon('attack',b.x,iy,b.r*0.42,col); } else drawWeaponIcon(ctx,curWeapon(),b.x,iy,b.r*0.95);
      { const D=WEAPONS[curWeapon()], cs=D&&D.chip?D.chip(player):null; if(cs&&cs.count!=null) wCount(b.x+b.r*0.62,b.y-b.r*0.55,cs.count,cs.low,false); }
    }
    else if(use){ touchIcon(um.k,b.x,iy,b.r*0.6,'#ffe2a8',um.label); label=um.label; }
    else{ touchIcon(b.id,b.x,iy,b.r*0.62,b.id==='fire'&&ready?'#ffb060':b.id==='drink'&&ready?'#8ef0b0':b.id==='jump'?'#d8f0ff':col,b.label); if(b.id==='attack'&&autoAttackOn()) label='AUTO'; }
    if(b.id==='drink'&&player.potions>0){ ctx.font=`800 ${Math.max(9,Math.round(b.r*0.34))}px ${UIF}`; ctx.fillStyle='#bff5cf'; ctx.fillText(String(player.potions),b.x+b.r*0.5,b.y-b.r*0.52); }
    ctx.fillStyle=use?'#ffe9c4':col; ctx.font=`800 ${Math.max(8,Math.round(b.r*(use?0.25:0.22)))}px ${UIF}`; ctx.fillText(label,b.x,b.y+b.r*0.58);
  }
  ctx.restore();
}

// ================= (v11 polish) banner manners
// Drew found the messages noisy: "Quest updated" again and again around doors, one story banner held over a whole boss
// fight with a "+3" counter beside it, house names over the street. setBanner (a9a_env.js) is wrapped here:
// - quest news (Quest updated, Story quest, New side quest, a quest's own step, Quest complete, clues, Case Book pages)
//   waits while a fight is on (foes after Ash, a boss up, a boss intro) and comes 1.5 s after it is over, one at a time;
// - "Quest updated" for the goal that was announced last (only its "(leave here first)" tail changed, or the same step
//   said again) shows nothing, and that tail is never part of a banner (the goal list says it);
// - the very same message again within 20 s shows nothing;
// - a name inside a house is a small name plate of its own (not a banner, not in the queue), shown on the first visit
//   only (a2e_interiors.js, and here for floors) and gone the moment Ash walks out.
// Banners also wait out talks and menus (drawBanner) and the counter chip is gone (drawBanner).
const BNR={g:null,goal:'',seen:new Map(),hold:[],fightT:-99,base:null,plate:null,last:0};
const BN_QUEST=/^(Quest updated|Story quest|New side quest|New errand|Quest complete|Errand done|A new page in the Case Book!|A new page!|New clue!|Solved!)$/;
function bnCore(s){ return String(s==null?'':s).replace(/\s*\(leave here first\)\s*$/i,'').trim(); }
function bnQuesty(t,style){
  if(style==='clue') return true; if(style) return false;
  if(BN_QUEST.test(t)) return true;
  try{ for(const id in G.quests){ const d=QDEFS[id]; if(d&&simplify(String(d.title||'').replace('Errand: ',''))===t) return true; } }catch(e){}
  return false;
}
function bnFight(){ return !!(G&&(G.inCombat||(G.boss&&!G.boss.dead)||G.fightIntro)); }
function bnStub(text,sub){ return {text,sub,t:0,dur:0,style:'',len:0,key:'',stub:true}; }
function bnReset(){ BNR.g=G; BNR.goal=''; BNR.seen.clear(); BNR.hold=[]; BNR.fightT=-99; BNR.plate=null; }
function bnShow(text,sub,dur,style,t,s,q){
  BNR.seen.set(t+'|'+s,G.time); if(BNR.seen.size>80) BNR.seen.delete(BNR.seen.keys().next().value);
  if(t==='Quest updated') BNR.goal=bnCore(s);
  const b=BNR.base(text,sub,dur,style); if(b&&q) b.q=true;
  return b;
}
{ const base=setBanner; BNR.base=base; setBanner=function(text,sub,dur,style){
    if(!G) return base(text,sub,dur,style);
    if(BNR.g!==G) bnReset();
    style=style||'';
    const t=simplify(String(text==null?'':text)), q=bnQuesty(t,style);
    if(q&&sub) sub=bnCore(sub);
    const s=sub?simplify(String(sub)):'';
    // a name inside a house: the small plate (style 'place' from enterArea decides the first visit itself)
    if((style==='region'||style==='place')&&AREA&&AREA.kind==='house'){
      const k='v11pl_'+AREA.id; if(style==='region'&&G.found[k]) return bnStub(t,s);
      G.found[k]=true; BNR.plate={text:t,area:AREA.id,t:0,dur:2.6}; return bnStub(t,s);
    }
    if(t==='Quest updated'&&bnCore(s)===BNR.goal) return bnStub(t,s);
    // a quest's first step right behind the banner that starts it ("New side quest: Ember's Trials: ...") says the
    // same thing again: the goal list has it
    if(q&&!BN_QUEST.test(t)){ const Q=[G.banner].concat(G.bannerQ||[]); if(Q.some(b=>b&&/^(New side quest|Story quest|New errand)$/.test(b.text)&&String(b.sub).startsWith(t))) return bnStub(t,s); }
    const key=t+'|'+s, last=BNR.seen.get(key);
    if(last!=null&&G.time-last<20&&!/^Level \d+$/.test(t)&&style!=='boss') return bnStub(t,s);
    if(q&&bnFight()){ const h=bnStub(t,s); h.args=[text,sub,dur,style]; BNR.hold=BNR.hold.filter(o=>o.text+'|'+o.sub!==key); BNR.hold.push(h); if(BNR.hold.length>6) BNR.hold.shift(); return h; }
    return bnShow(text,sub,dur,style,t,s,q);
  }; }
// every frame (from drawBanner): fights hold quest news back, a calm moment lets it out, the plate keeps to its room
function bnTick(){
  if(!G) return; if(BNR.g!==G) bnReset();
  const now=G.time, dt=clamp(now-(BNR.last||now),0,0.1); BNR.last=now;
  const fight=bnFight(); if(fight) BNR.fightT=now;
  if(fight){
    // quest news already up or waiting when the fight starts: it steps aside and comes back after (if barely read)
    const bn=G.banner;
    if(bn&&bn.q&&!bn.held){ bn.held=true; if(bn.t<bn.dur*0.5){ const h=bnStub(bn.text,bn.sub); h.args=[bn.text,bn.sub,bn.dur,bn.style]; BNR.hold.unshift(h); BNR.seen.delete(bn.text+'|'+bn.sub); if(bn.text==='Quest updated') BNR.goal=''; } bn.dur=Math.min(bn.dur,bn.t+0.35); }
    if(G.bannerQ&&G.bannerQ.some(b=>b.q)){ for(const b of G.bannerQ) if(b.q){ const h=bnStub(b.text,b.sub); h.args=[b.text,b.sub,b.dur,b.style]; BNR.hold.push(h); BNR.seen.delete(b.text+'|'+b.sub); if(b.text==='Quest updated'&&BNR.goal===bnCore(b.sub)) BNR.goal=''; } G.bannerQ=G.bannerQ.filter(b=>!b.q); }
  }else if(BNR.hold.length&&scene==='play'&&now-BNR.fightT>1.5&&!G.banner&&!(G.bannerQ&&G.bannerQ.length)){
    const h=BNR.hold.shift(); let [text,sub,dur,style]=h.args;
    // a goal held through a fight may be old news by now: say the goal as it is now, or nothing if it was said
    if(h.text==='Quest updated'){ const o=questObjective(); sub=o?bnCore(o.text):''; if(!sub||sub===BNR.goal) return; }
    const t=simplify(String(text)), s=sub?simplify(String(sub)):'';
    bnShow(text,sub,dur,style,t,s,true);
  }
  const P=BNR.plate;
  if(P){ if(!AREA||AREA.id!==P.area||P.t>=P.dur) BNR.plate=null; else if(scene==='play') P.t+=dt; }
}
// the house name plate: a small parchment (Storybook) or dark (classic) tag at the top, clear of the vitals and minimap
function drawPlate(){
  const P=BNR.plate; if(!P||scene!=='play') return;
  const a=clamp(Math.min(P.t/0.25,(P.dur-P.t)/0.45),0,1); if(a<=0) return;
  ctx.save(); ctx.globalAlpha=a; ctx.font=`700 15px ${TF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
  const tw=ctx.measureText(P.text).width, w=Math.min(W-24,tw+46), h=30, x=W/2-w/2, M=MINI_R();
  // under the top row (the weapon bar, Pip and the skills toast live up there), or below the goal list on a narrow screen
  let y=SAFE.t+74-(1-Math.min(1,P.t/0.3))*6;
  if(x<HUD_RX+4||x+w>M.x-8) y=Math.max(y,TRACK_R?TRACK_R.y+TRACK_R.h+6:SAFE.t+150,M.y+M.r*2+34);
  if(LOOK.sb){ sbPill(x,y,w,h); ctx.fillStyle=SBC.outline; }
  else{ ctx.fillStyle='rgba(14,9,6,.82)'; rr(x,y,w,h,h/2); ctx.fill(); ctx.strokeStyle='rgba(255,210,150,.45)'; ctx.lineWidth=1; ctx.stroke(); ctx.fillStyle='#f6e2c0'; }
  ctx.fillText(P.text,W/2,y+h/2+1);
  // a small gold diamond at each end, like the goal marks
  for(const s of [-1,1]){ ctx.save(); ctx.translate(W/2+s*(tw/2+12),y+h/2+1); ctx.rotate(Math.PI/4); ctx.fillStyle='#e8a43a'; ctx.fillRect(-2.6,-2.6,5.2,5.2); ctx.restore(); }
  ctx.restore();
}
// (v11 polish) a level up comes one thing at a time: the Level banner (it already says how many skill points and which
// key opens Skills, so the first-time "You have N skill points" toast is folded into it), then the queue, then the coach
function lvQueue(){
  const left=SK.hintEnd-G.time; if(!(left>0)) return;
  const lvUp=b=>b&&/^Level \d+$/.test(b.text), lv=lvUp(G.banner)?G.banner:(G.bannerQ||[]).find(lvUp);
  // the Level banner already carries the same words ("+2 skill points ... Press U to open your Skills"): no second box
  if(lv&&String(lv.sub).includes(simplify(skCtrlHint()))){ SK.hintEnd=0; return; }
  if((scene!=='play'||lv)&&left>9.65) SK.hintEnd=G.time+10;
}

// ================= (v11 polish) short goals
// goalLine draws one goal on one line: the goal (cut short to fit, see goalShort) and, after a dot, how far it is.
function goalLine(text,x,y,maxW,dm,col,txt,font){
  const F=font||`500 12px ${UIF}`, SF=`600 10.5px ${UIF}`, raw=String(text==null?'':text);
  // (the "(leave here first)" tail is not shown: the distance and the marker already point at the way out)
  const suf=dm!=null?`· ${Math.max(1,Math.round(dm))} m`:'';
  ctx.font=SF; const sw=suf?ctx.measureText(suf).width+7:0;
  ctx.font=F; const g=goalShort(raw,maxW-sw);
  ctx.fillStyle=col; txt(g,x,y);
  if(suf){ const gw=ctx.measureText(g).width; ctx.font=SF; ctx.fillStyle=LOOK.sb?'#f4dcb4':'#d8c4a4'; txt(suf,x+gw+7,y+0.5); }
}
// the goal cut to fit one line (ctx.font set): the whole goal if it fits, else its Simple words version (written
// short for younger players), else as many of its first sentences as fit, else its first clause, else cut with an
// ellipsis. A count at the end (" · 2/3 lit") always stays.
const GSC=new Map();
function goalShort(raw,maxW){
  const key=ctx.font+'|'+Math.round(maxW)+'|'+raw, c=GSC.get(key); if(c!=null) return c;
  let t=bnCore(raw), tail='';
  const m=/\s·\s([^·]*\d[^·]*)$/.exec(t); if(m){ tail=' · '+m[1].trim(); t=t.slice(0,m.index).trim(); }
  const trim=s=>s.trim().replace(/[.;:,]$/,''), fits=s=>ctx.measureText(s+tail).width<=maxW;
  let out=null;
  if(fits(trim(t))) out=trim(t);
  if(out==null){ const s=simpleText(t); if(s&&s!==t&&fits(trim(s))) out=trim(s); }
  if(out==null){ const parts=t.replace(/([.!?;])\s+(?=["“'‘]?[A-Z])/g,'$1\u0001').split('\u0001'); let acc='';
    for(const q of parts){ const n=acc?acc+' '+q:q; if(fits(trim(n))) acc=n; else break; } if(acc&&trim(acc).length>=8) out=trim(acc); }
  if(out==null){ const c0=t.split(/,\s+|\s+\(|:\s+/)[0]; if(trim(c0).length>=10&&fits(trim(c0))) out=trim(c0); }
  if(out==null){ const w=trim(t).split(/\s+/); let s=''; for(const q of w){ const n=s?s+' '+q:q; if(ctx.measureText(n+'…'+tail).width<=maxW) s=n; else break; } out=(s||w[0])+'…'; }
  out+=tail; if(GSC.size>400) GSC.clear(); GSC.set(key,out); return out;
}
// the Simple words version of a text, whatever the Words setting (a1k_simple.js)
function simpleText(t){
  try{ simpleInit(); const v=SIMPLE.map[h32(t)]; if(v!=null) return v;
    for(const q of SIMPLE.tpl){ const m=q.re.exec(t); if(m) return q.s.replace(/\{(\d+)\}/g,(_,i)=>m[+i]!=null?m[+i]:''); } }catch(e){}
  return null;
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{bnr:()=>({goal:BNR.goal,hold:BNR.hold.map(h=>[h.text,h.sub]),plate:BNR.plate&&BNR.plate.text,fightT:BNR.fightT}),coach:()=>({id:COACH.id,shown:COACH.shown,flags:Object.keys(G.flags).filter(k=>/^coach/.test(k))}),goalShort:(t,w)=>{ ctx.font=`500 12px ${UIF}`; return goalShort(t,w||300); }});
