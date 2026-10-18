
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
      // (one fight at a time: no pumpkin patrol while kobolds run around Emberhollow)
      if(G.mode==='story'&&G.stage==='raid'){ runDialogue([[n.id,S(`Kobolds first, Ash! The pumpkins can wait.`,`Kobolds first! The pumpkins can wait.`)]],()=>{ scene='play'; }); return true; }
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
// Four small waves of slimes with a breather between them. Only a few hop at once, they go for Hal's pumpkins (not for
// Ash), and a pumpkin takes three bites to eat, so there is always time to knock a slime off it. A slime cut in half
// leaves two babies that run off scared. When it ends, any slimes left hop back into the hedges one by one (no bang).
const PATCH={
  waves:[[2,3,3,4],[3,3,4,5],[4,5,5,6]],   // slimes in each wave, by difficulty (Easy, Normal, Hard)
  onScreen:[2,3,4],                        // at most this many hopping at once
  bite:[1.7,1.3,1.0],                      // seconds a slime sits on a pumpkin for each bite
  bites:3, rest:4, first:2.5, waveMax:35,  // bites to eat one, breather between waves, the first wait, a wave's time limit
};
const patchK=()=>clamp(typeof diffIdx==='number'?diffIdx:1,0,2);
const patchLive=M=>M.slimes.filter(e=>!e.dead&&!e.patchLeave);
const patchLeft=M=>M.crops.filter(q=>!q.eaten);
function patchSpawn(M){
  const p=player;
  for(let k=0;k<30;k++){
    const a=rand(0,TAU), r=rand(330,400), x=M.cx+Math.cos(a)*r, y=M.cy+Math.sin(a)*r*0.8;
    if(blockedAt(x,y)||dist(x,y,p.x,p.y)<170) continue;
    const e=makeEnemy('slime',x,y,{level:2,aggro:true,homeX:M.cx,homeY:M.cy,leash:99999,elite:false});
    e.mini='patch'; e.spawnIn=0.5; e.cd=rand(0.5,0.9); patchAim(M,e); M.slimes.push(e);
    emit(x,y,10,{col:'120,170,60',glow:false,smin:30,smax:100,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); ftext(x,y-22,'rustle','#c8e8a0',11);
    return true;
  }
  return false;
}
// the nearest pumpkin that fewer than two slimes are already after
function patchAim(M,e){
  const live=patchLeft(M); if(!live.length){ e.cropTarget=null; return; }
  const n=c=>M.slimes.filter(o=>o!==e&&!o.dead&&o.cropTarget===c).length;
  e.cropTarget=live.slice().sort((a,b)=>(n(a)>=2)-(n(b)>=2)||dist2(a.x,a.y,e.x,e.y)-dist2(b.x,b.y,e.x,e.y))[0];
}
function patchSlimeAI(e,dt){
  const p=player, M=G.mini&&G.mini.kind==='defend'?G.mini:null, d=dist(e.x,e.y,p.x,p.y);
  e.dx=e.dy=0; if(e.hopT>0) e.hopT-=dt; e.cd-=dt;
  // going home: wait a moment (each one its own moment), hop away from the patch, then gone in a puff of leaves
  if(!M||e.patchLeave||e.small){
    if(e.leaveT==null) e.leaveT=e.small?rand(1.0,1.8):rand(0.2,1.6);
    e.leaveT-=dt;
    const hx=M?M.cx:e.homeX, hy=M?M.cy:e.homeY, a=e.small?angTo(p.x,p.y,e.x,e.y):angTo(hx,hy,e.x,e.y);
    if(e.cd<=0&&(e.small||e.leaveT<1)){ e.cd=rand(0.45,0.7); e.hopT=0.25; e.vx+=Math.cos(a)*170; e.vy+=Math.sin(a)*170; e.face=a; }
    if(e.leaveT<=-0.9){ e.dead=true; emit(e.x,e.y,8,{col:'120,170,60',glow:false,smin:20,smax:70,lmin:.3,lmax:.5,zmin:1,zmax:2.5}); }
    return;
  }
  const c=e.cropTarget&&!e.cropTarget.eaten?e.cropTarget:(patchAim(M,e),e.cropTarget);
  // a bump hurts a little (they are not trying to hurt you, you are just in the way)
  e.touchCd=(e.touchCd||0)-dt; if(e.touchCd<=0&&d<e.r+p.r){ if(hurtPlayer(e.dmg*0.5,e.x,e.y,120)) e.touchCd=1.2; }
  if(!c) return;
  const dc=dist(e.x,e.y,c.x,c.y);
  if(e.flash>0) e.biteT=0;   // a hit knocks it off its bite
  if(dc<22){
    // sitting on a pumpkin, nibbling: it wobbles and says nom, a bite at a time
    c.shake=0.25;
    e.biteT=(e.biteT||0)+dt;
    if(e.biteT>=M.bite){ e.biteT=0; c.hp--; ftext(c.x,c.y-22,c.hp>0?'nom':'CHOMP',c.hp>0?'#ffd0a0':'#ffb070',c.hp>0?11:14); SFX.play('pop',c.hp>0?0.4:0.8);
      if(c.hp<=0){ c.eaten=true; emit(c.x,c.y,12,{col:'230,130,40',glow:false,smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); e.cropTarget=null; } }
    return;
  }
  e.biteT=Math.max(0,(e.biteT||0)-dt*2);
  if(e.cd<=0){ const a=angTo(e.x,e.y,c.x,c.y); e.cd=rand(0.8,1.15); e.hopT=0.25; const sp=Math.min(150,dc*3.2+40); e.vx+=Math.cos(a)*sp; e.vy+=Math.sin(a)*sp; e.face=a; }
}
{ const base=AI.slime; AI.slime=function(e,dt,p){ if(e.mini==='patch') return patchSlimeAI(e,dt); return base(e,dt,p); }; }
MINI.defend={
  start(){
    const door=DOORS.find(d=>d.owner==='hal')||{x:POI.village.x,y:POI.village.y};
    const cx=door.x+(door.x<POI.village.x?-160:160), cy=door.y+60, crops=[], k=patchK();
    for(let i=0;i<8;i++){ const x=cx+((i%4)-1.5)*46, y=cy+(Math.floor(i/4)-0.5)*46; crops.push({x,y,eaten:false,big:i===5,hp:PATCH.bites,shake:0}); }
    return {cx,cy,crops,music:'combat',waves:PATCH.waves[k].slice(),onScreen:PATCH.onScreen[k],bite:PATCH.bite[k],
      wave:0,todo:0,spawnT:0,phase:'rest',restT:PATCH.first,waveT:0,away:0,slimes:[]};
  },
  update(M,dt){
    const p=player, nW=M.waves.length;
    for(const c of M.crops) if(c.shake>0) c.shake-=dt;
    if(p.dead){ miniEnd(false,S('Hal calls it off','Hal calls it off'),S('Rest up, then talk to Hal to try again.','Rest, then talk to Hal again.')); return; }
    if(dist(p.x,p.y,M.cx,M.cy)>1100){ M.away+=dt; if(M.away>5){ miniEnd(false,S('You left the patch!','You left the patch!'),S('Talk to Hal to try again.','Talk to Hal to try again.')); return; } } else M.away=0;
    if(!patchLeft(M).length){ miniEnd(false,'The slimes ate everything!','Talk to Hal to try again.'); return; }
    if(M.phase==='rest'){
      M.restT-=dt;
      if(M.restT<=0){ M.wave++; M.todo=M.waves[M.wave-1]; M.phase='wave'; M.waveT=0; M.spawnT=0;
        setBanner(S(`Wave ${M.wave} of ${nW}`,`Wave ${M.wave} of ${nW}`),M.wave===nW?S('The last one!','The last one!'):S(`${M.todo} slimes. Knock them off the pumpkins!`,`${M.todo} slimes are coming!`),1.8); SFX.play('warn',0.5); }
      return;
    }
    M.waveT+=dt; M.spawnT-=dt;
    if(M.todo>0&&M.spawnT<=0&&patchLive(M).length<M.onScreen){ if(patchSpawn(M)){ M.todo--; M.spawnT=0.9; } else M.spawnT=0.3; }
    // a wave that runs too long (a slime stuck in a hedge) gives up and hops home
    if(M.waveT>PATCH.waveMax){ M.todo=0; for(const e of patchLive(M)) e.patchLeave=true; }
    if(M.todo<=0&&!patchLive(M).length){
      if(M.wave>=nW){ const left=patchLeft(M).length; M.saved=left; addCoins(left*4,p.x,p.y); miniEnd(true,`${left} pumpkins saved!`,left===8?'Every single one. Hal is weeping.':'Go tell Hal.'); return; }
      M.phase='rest'; M.restT=PATCH.rest; setBanner(S('Phew!','Phew!'),S(`Next wave in ${PATCH.rest} seconds.`,`Next wave soon.`),1.6);
    }
  },
  end(M){ for(const e of M.slimes) if(!e.dead) e.patchLeave=true; },
  target:M=>({x:M.cx,y:M.cy}),
  hud:M=>{ const pk=`Pumpkins ${patchLeft(M).length}/8`;
    if(M.phase==='rest') return M.wave?`Wave ${M.wave} of ${M.waves.length} done! Next in ${Math.max(1,Math.ceil(M.restT))}s · ${pk}`:`Get ready! Slimes in ${Math.max(1,Math.ceil(M.restT))}s · ${pk}`;
    return `Wave ${M.wave} of ${M.waves.length} · ${M.todo+patchLive(M).length} slimes left · ${pk}`; },
  draw(M,t){
    // the tilled patch, so you can see what you are guarding
    ctx.fillStyle='rgba(92,58,30,.45)'; ctx.beginPath(); ctx.ellipse(M.cx,M.cy,122,70,0,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(255,210,140,.35)'; ctx.lineWidth=2; ctx.setLineDash([7,6]); ctx.beginPath(); ctx.ellipse(M.cx,M.cy,128,76,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    for(const c of M.crops){
      if(c.eaten){ ctx.fillStyle='rgba(120,70,20,.5)'; ctx.beginPath(); ctx.ellipse(c.x,c.y,9,5,0,0,TAU); ctx.fill(); continue; }
      const r=c.big?15:11, x=c.x+(c.shake>0?Math.sin(t*60)*1.6:0), y=c.y;
      ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x+2,y+r*0.6,r,r*0.45,0,0,TAU); ctx.fill();
      ctx.fillStyle='#e8782a'; ctx.beginPath(); ctx.ellipse(x,y,r,r*0.82,0,0,TAU); ctx.fill();
      ctx.strokeStyle='#b8521a'; ctx.lineWidth=1.5; for(const k of [-0.5,0,0.5]){ ctx.beginPath(); ctx.ellipse(x+k*r*0.6,y,r*0.35,r*0.8,0,0,TAU); ctx.stroke(); }
      ctx.fillStyle='#4a7a2a'; ctx.fillRect(x-1.5,y-r-3,3,6);
      // bite marks, and three little pips for how much is left
      const bit=PATCH.bites-c.hp;
      if(bit>0){ ctx.fillStyle='#5a3a1a'; for(let i=0;i<bit;i++){ ctx.beginPath(); ctx.arc(x+r*0.75-i*r*0.5,y-r*0.55,r*0.28,0,TAU); ctx.fill(); }
        for(let i=0;i<PATCH.bites;i++){ ctx.fillStyle=i<c.hp?'#ffcf4a':'rgba(40,24,12,.7)'; ctx.beginPath(); ctx.arc(x+(i-1)*7,y+r+6,2.6,0,TAU); ctx.fill(); } }
    }
  }
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
