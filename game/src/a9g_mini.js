
// ================= minigames for side quests: chase, hide and seek, defend the patch, the race, and Wendel's song
const MINI={};
function startMini(kind,qid){
  const M=MINI[kind]; if(!M||G.mini) return;
  const step=stepOf(qid);
  G.mini=Object.assign({kind,qid,flag:step&&step.flag,t:0,ox:player.x,oy:player.y},M.start(qid)||{});
  if(G.mini&&G.mini.kind) { jingle('quest',null); }
}
function miniEnd(win,title,sub){
  const M=G.mini; if(!M) return; G.mini=null;
  if(MINI[M.kind].end) MINI[M.kind].end(M,win);
  if(win){ if(M.flag) G.flags[M.flag]=true; jingle('complete','upgrade'); questPoke(); }
  else SFX.play('warn');
  setBanner(title||(win?'You did it!':'Not this time'),sub||(win?'':'Talk to them again to have another go.'),2.6);
  saveGame();
}
function miniUpdate(dt){
  const M=G.mini; if(!M) return;
  if(AREA&&M.kind!=='simon'){ miniEnd(false,'Game over','You went inside. Talk to them again to start over.'); return; }
  M.t+=dt;
  MINI[M.kind].update(M,dt);
}
function miniTalk(n){
  // a quest step that starts a minigame when you talk to its person
  for(const qid in G.quests){
    const st=stepOf(qid);
    if(st&&st.mini&&st.npc===n.id&&!G.mini&&!G.flags[st.flag]){
      const lines=(st.ready||[[n.id,'Ready?']]).slice(0,-1);
      const last=(st.ready||[[n.id,'Ready?']]).slice(-1)[0];
      lines.push(ch(last[0],last[1],[{t:'Let’s go!',tone:'brave',fn:()=>{ later(0.05,()=>startMini(st.mini,qid)); }},{t:'Give me a minute.',then:[[n.id,`Okay. I'll be right here.`]]}]));
      runDialogue(lines,()=>{ scene='play'; });
      return true;
    }
  }
  return false;
}
function miniPrompts(offer){
  const M=G.mini; if(!M||!MINI[M.kind].prompts) return;
  MINI[M.kind].prompts(M,offer);
}
function freeAround(x,y,r0,r1,tries){ for(let t=0;t<(tries||80);t++){ const a=rand(0,TAU), r=rand(r0,r1), px=x+Math.cos(a)*r, py=y+Math.sin(a)*r; if(!blockedAt(px,py)&&!blockedAt(px+16,py)&&!blockedAt(px-16,py)&&!blockedAt(px,py+16)&&!blockedAt(px,py-16)) return {x:px,y:py}; } return {x:x+r0,y:y}; }

// ---------- Stop, Thief!
MINI.chase={
  start(){ const p=freeAround(player.x,player.y,140,220); const e=makeEnemy('sneak',p.x,p.y,{level:2,aggro:true,homeX:player.x,homeY:player.y,leash:99999}); e.mini=true; e.invulnT=0; return {e,limit:75,music:'combat'}; },
  update(M){
    if(M.e.dead){ giveItems({purse:1}); miniEnd(true,'Got it!','The sneak drops Pell’s purse and runs off crying.'); return; }
    if(M.t>M.limit){ M.e.dead=true; deathFx(M.e); miniEnd(false,'It got away!','Talk to Pell to try again.'); }
  },
  target:M=>M.e&&!M.e.dead?{x:M.e.x,y:M.e.y}:null,
  hud:M=>`Catch the sneak! ${Math.max(0,Math.ceil(M.limit-M.t))}s`,
  end(M){ if(M.e&&!M.e.dead){ M.e.dead=true; } }
};
// ---------- Hide and Seek
MINI.seek={
  start(){
    const B=POI.brindle, hs=HOUSES.filter(h=>h.town==='brindle'&&h.k==='house');
    const spots=[], kinds=['barrel','bush','cart','crates'], names=['Jem','Pip-squeak','Moll','Nib'];
    shuffle(hs.slice()).slice(0,8).forEach(h=>{ if(spots.length>=4) return; const side=Math.random()<0.5?-1:1; const x=h.x+side*(h.w/2+26), y=h.y+rand(-h.h*0.2,h.h*0.25); if(blockedAt(x,y)) return; spots.push({x,y,k:kinds[spots.length],name:names[spots.length],found:false}); });
    while(spots.length<4){ const p=freeAround(B.x,B.y,200,520); spots.push({x:p.x,y:p.y,k:kinds[spots.length],name:names[spots.length],found:false}); }
    return {spots,limit:120,music:'puzzle'};
  },
  update(M){
    for(const s of M.spots){ if(s.found) continue; const d=dist(player.x,player.y,s.x,s.y); if(d<240&&Math.random()<0.012) ftext(s.x,s.y-24,pick(['hee hee','*giggle*','shhh!','snrk']),'#ffe0b0',11); }
    if(M.spots.every(s=>s.found)){ miniEnd(true,'Found everyone!','Go tell Nib.'); return; }
    if(M.t>M.limit) miniEnd(false,'Time’s up!','The kids pop out laughing. Talk to Nib to play again.');
  },
  prompts(M,offer){ for(const s of M.spots){ if(s.found) continue; const d=dist(player.x,player.y,s.x,s.y); if(d<62) offer(d-40,`Peek behind the ${s.k==='bush'?'bush':s.k==='cart'?'cart':s.k==='crates'?'crates':'barrel'}`,()=>{ s.found=true; SFX.play('pop'); emit(s.x,s.y,10,{col:'255,230,180',smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); setBanner(`Found ${s.name}!`,`${M.spots.filter(q=>q.found).length} of 4`,1.4); },s.x,s.y,true); } },
  target:M=>{ const s=M.spots.filter(q=>!q.found).sort((a,b)=>dist2(a.x,a.y,player.x,player.y)-dist2(b.x,b.y,player.x,player.y))[0]; return s&&dist(s.x,s.y,player.x,player.y)>400?{x:POI.brindle.x,y:POI.brindle.y}:null; },
  hud:M=>`Hide and seek: ${M.spots.filter(q=>q.found).length}/4 found · ${Math.max(0,Math.ceil(M.limit-M.t))}s`,
  draw(M,t){ for(const s of M.spots){ if(!inView(s.x,s.y,60)) continue; drawSeekProp(s,t); } }
};
function drawSeekProp(s,t){
  const x=s.x, y=s.y;
  if(s.found){ ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+8,10,5,0,0,TAU); ctx.fill(); ctx.fillStyle='#e8b090'; ctx.beginPath(); ctx.arc(x,y-4+Math.sin(t*8)*2,7,0,TAU); ctx.fill(); ctx.fillStyle='#5a3a20'; ctx.beginPath(); ctx.arc(x,y-7+Math.sin(t*8)*2,7,Math.PI,TAU); ctx.fill(); }
  if(s.k==='barrel'){ drawPot(x+(s.found?16:0),y,'barrel'); }
  else if(s.k==='bush'){ ctx.fillStyle='#2f5a1d'; ctx.beginPath(); ctx.arc(x+(s.found?18:0),y,18,0,TAU); ctx.fill(); ctx.fillStyle='#4d7f2c'; ctx.beginPath(); ctx.arc(x-4+(s.found?18:0),y-4,12,0,TAU); ctx.fill(); }
  else if(s.k==='cart'){ ctx.fillStyle='#6a4a2a'; ctx.fillRect(x-20+(s.found?20:0),y-12,40,24); ctx.fillStyle='#3a2a1a'; ctx.beginPath(); ctx.arc(x-12+(s.found?20:0),y+12,6,0,TAU); ctx.arc(x+12+(s.found?20:0),y+12,6,0,TAU); ctx.fill(); }
  else { for(const [dx,dy] of [[-10,0],[10,0],[0,-14]]){ ctx.fillStyle='#8a6a42'; ctx.fillRect(x+dx-10+(s.found?20:0),y+dy-10,20,20); ctx.strokeStyle='#5a4228'; ctx.lineWidth=2; ctx.strokeRect(x+dx-10+(s.found?20:0),y+dy-10,20,20); } }
  if(!s.found&&Math.sin(t*3+x)>0.92){ ctx.fillStyle='#ffe0b0'; ctx.beginPath(); ctx.arc(x+8,y-14,2,0,TAU); ctx.fill(); }
}
// ---------- Pumpkin Patrol
MINI.defend={
  start(){
    const c=CASTBY.hal, door=DOORS.find(d=>d.owner==='hal')||{x:POI.village.x,y:POI.village.y};
    const cx=door.x+(door.x<POI.village.x?-160:160), cy=door.y+60, crops=[];
    for(let i=0;i<8;i++){ const x=cx+((i%4)-1.5)*46, y=cy+(Math.floor(i/4)-0.5)*46; crops.push({x,y,eaten:false,big:i===5}); }
    return {cx,cy,crops,limit:60,wave:0,music:'combat'};
  },
  update(M,dt){
    M.spawnT=(M.spawnT||1)-dt;
    if(M.spawnT<=0&&M.t<M.limit-4){ M.spawnT=Math.max(1.6,4.2-M.t*0.05); const n=2+Math.floor(M.t/20);
      for(let i=0;i<n;i++){ const a=rand(0,TAU), x=M.cx+Math.cos(a)*420, y=M.cy+Math.sin(a)*360; if(blockedAt(x,y)) continue; const live=M.crops.filter(q=>!q.eaten); if(!live.length) break; const e=makeEnemy('slime',x,y,{level:2,aggro:true,homeX:M.cx,homeY:M.cy,leash:99999,tint:'#9ad04a'}); e.mini=true; e.cropTarget=pick(live); e.spawnIn=0.3; } }
    for(const e of G.enemies){ if(e.dead||!e.mini||!e.cropTarget) continue; const c=e.cropTarget; if(c.eaten){ const live=M.crops.filter(q=>!q.eaten); e.cropTarget=live.length?pick(live):null; continue; } if(dist(e.x,e.y,c.x,c.y)<22){ c.eaten=true; SFX.play('pop'); ftext(c.x,c.y-20,'CHOMP','#ffb070',13); emit(c.x,c.y,12,{col:'230,130,40',glow:false,smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } }
    const left=M.crops.filter(q=>!q.eaten).length;
    if(!left){ miniEnd(false,'The slimes ate everything!','Talk to Hal to try again.'); return; }
    if(M.t>=M.limit){ M.saved=left; addCoins(left*4,player.x,player.y); miniEnd(true,`${left} pumpkins saved!`,left===8?'Every single one. Hal is weeping.':'Go tell Hal.'); }
  },
  end(M){ for(const e of G.enemies) if(e.mini&&!e.dead){ e.dead=true; deathFx(e); } },
  target:M=>({x:M.cx,y:M.cy}),
  hud:M=>`Guard the pumpkins! ${M.crops.filter(q=>!q.eaten).length}/8 left · ${Math.max(0,Math.ceil(M.limit-M.t))}s`,
  draw(M,t){ for(const c of M.crops){ if(c.eaten){ ctx.fillStyle='rgba(120,70,20,.5)'; ctx.beginPath(); ctx.ellipse(c.x,c.y,9,5,0,0,TAU); ctx.fill(); continue; } const r=c.big?15:11; ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(c.x+2,c.y+r*0.6,r,r*0.45,0,0,TAU); ctx.fill(); ctx.fillStyle='#e8782a'; ctx.beginPath(); ctx.ellipse(c.x,c.y,r,r*0.82,0,0,TAU); ctx.fill(); ctx.strokeStyle='#b8521a'; ctx.lineWidth=1.5; for(const k of [-0.5,0,0.5]){ ctx.beginPath(); ctx.ellipse(c.x+k*r*0.6,c.y,r*0.35,r*0.8,0,0,TAU); ctx.stroke(); } ctx.fillStyle='#4a7a2a'; ctx.fillRect(c.x-1.5,c.y-r-3,3,6); } }
};
// ---------- The Frostpine Dash
MINI.race={
  start(){
    const L=POI.lodge, flags=[]; let a0=rand(0,TAU);
    for(let i=0;i<6;i++){ const a=a0+i*TAU/6, r=360+(i%2)*120; let x=L.x+Math.cos(a)*r, y=L.y+Math.sin(a)*r; for(let k=0;k<20&&blockedAt(x,y);k++){ x+=rand(-60,60); y+=rand(-60,60); } flags.push({x,y}); }
    let len=dist(L.x,L.y,flags[0].x,flags[0].y); for(let i=1;i<6;i++) len+=dist(flags[i-1].x,flags[i-1].y,flags[i].x,flags[i].y);
    return {flags,i:0,limit:75,elkaT:len/150,len,music:'arena',sx:player.x,sy:player.y};
  },
  update(M){
    const f=M.flags[M.i];
    if(dist(player.x,player.y,f.x,f.y)<48){ M.i++; SFX.play('pickup'); emit(f.x,f.y,14,{col:'255,220,120',smin:30,smax:100,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); if(M.i>=M.flags.length){ if(M.t<=M.elkaT) miniEnd(true,'You win!','You beat Elka to the last flag.'); else miniEnd(false,'Elka wins!','So close. Talk to Elka for a rematch.'); return; } }
    // Elka runs the course too
    const n=G.npcs.find(q=>q.id==='elka');
    if(n){ const p=raceAt(M,Math.min(1,M.t/M.elkaT)); n.x=p.x; n.y=p.y; n.face=p.a; n.moving=true; n.t+=0.05; }
    if(M.t>M.elkaT+1.5){ miniEnd(false,'Elka wins!','Talk to Elka for a rematch.'); }
  },
  end(){ const n=G.npcs.find(q=>q.id==='elka'); if(n){ n.x=n.home[0]; n.y=n.home[1]; n.moving=false; } },
  target:M=>M.flags[M.i],
  hud:M=>`Race! Flag ${M.i+1} of 6 · Elka is ${M.t<M.elkaT?Math.round(Math.min(1,M.t/M.elkaT)*100)+'% around':'done'}`,
  draw(M,t){ M.flags.forEach((f,i)=>{ if(!inView(f.x,f.y,60)) return; const next=i===M.i, done=i<M.i; ctx.fillStyle='#4a3420'; ctx.fillRect(f.x-1.5,f.y-30,3,32); ctx.fillStyle=done?'#6a6a6a':next?'#ff5a3a':'#c84a3a'; ctx.beginPath(); ctx.moveTo(f.x+1,f.y-30); ctx.lineTo(f.x+20,f.y-24+Math.sin(t*6+i)*2); ctx.lineTo(f.x+1,f.y-18); ctx.fill(); ctx.fillStyle='#fff'; ctx.font=`800 10px ${UIF}`; ctx.textAlign='center'; ctx.fillText(String(i+1),f.x+9,f.y-22); if(next){ ctx.strokeStyle=`rgba(255,200,120,${0.4+0.3*Math.sin(t*5)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(f.x,f.y,40,0,TAU); ctx.stroke(); } }); }
};
function raceAt(M,k){
  const pts=[{x:M.sx,y:M.sy}].concat(M.flags); let want=k*M.len, acc=0;
  for(let i=1;i<pts.length;i++){ const d=dist(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y); if(acc+d>=want){ const u=(want-acc)/d; return {x:lerp(pts[i-1].x,pts[i].x,u),y:lerp(pts[i-1].y,pts[i].y,u),a:angTo(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y)}; } acc+=d; }
  const L=pts[pts.length-1]; return {x:L.x,y:L.y,a:0};
}
// ---------- Wendel's song: listen, then play it back
const NOTES=[['Do',262],['Re',294],['Mi',330],['So',392]];
function playNote(i,delay){ try{ const ac=SFX.ac; if(!ac||SFX.muted) return; const t=ac.currentTime+(delay||0), o=ac.createOscillator(), g=ac.createGain(); o.type='triangle'; o.frequency.value=NOTES[i][1]; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.12,t+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+0.5); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.55); }catch(e){} }
MINI.simon={
  start(){ later(0.1,()=>{ if(G.mini&&G.mini.kind==='simon') simonRound(G.mini); }); return {round:0,pos:0,rounds:[[0,2],[0,2,3],[3,2,0,1],[1,3,2,0,2]],music:'house'}; },
  update(){},
  hud:()=>null
};
function simonListen(S){ const seq=S.rounds[S.round]; S.pos=0; return {who:'wendel',text:`Round ${S.round+1} of ${S.rounds.length}. Listen: ${seq.map(i=>NOTES[i][0]).join(', ')}.`,fn:()=>seq.forEach((n,i)=>playNote(n,0.2+i*0.45))}; }
function simonAsk(S){ const seq=S.rounds[S.round]; return ch('ash',`Your turn. Note ${S.pos+1} of ${seq.length}.`,NOTES.map(([nm],i)=>({t:`♪ ${nm}`,fn:()=>{ playNote(i,0); if(i===seq[S.pos]) S.pos++; else S.wrong=true; },then:()=>simonNext(S)}))); }
function simonNext(S){
  const seq=S.rounds[S.round];
  if(S.wrong){ S.wrong=false; const want=NOTES[seq[S.pos]][0]; return [['wendel',pick([`Ooh, close! That one was ${want}. Let's try that round again.`,`Almost! The next note was ${want}. From the top.`])],simonListen(S),simonAsk(S)]; }
  if(S.pos<seq.length) return [simonAsk(S)];
  S.round++;
  if(S.round>=S.rounds.length){ S.won=true; return [['wendel','That’s it! That’s the whole song! Ash, you’re a natural.']]; }
  return [['wendel',pick(['Perfect! The next one is longer.','Lovely. Now this one.','Yes! Keep going.'])],simonListen(S),simonAsk(S)];
}
function simonRound(S){
  runDialogue([simonListen(S),simonAsk(S)],()=>{ scene='play'; if(G.mini===S) miniEnd(!!S.won,S.won?'Song complete!':'Maybe later',S.won?'Wendel is grinning from ear to ear.':'Talk to Wendel to play again.'); },{mood:'tender'});
}
// HUD and world drawing hooks
function drawMiniHUD(){
  const M=G.mini; if(!M||!MINI[M.kind].hud) return; const txt=MINI[M.kind].hud(M); if(!txt) return;
  ctx.save(); ctx.font=`800 15px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(txt).width+34, y=SAFE.t+(W<720?196:26);
  ctx.fillStyle='rgba(14,8,6,.8)'; rr(W/2-w/2,y-16,w,32,16); ctx.fill(); ctx.strokeStyle='rgba(255,200,120,.55)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='#ffe2b0'; ctx.fillText(txt,W/2,y+1); ctx.restore();
}
function drawMiniWorld(t){ const M=G.mini; if(M&&MINI[M.kind].draw) MINI[M.kind].draw(M,t); }
