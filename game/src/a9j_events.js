// ================= world events, Tikka's story, dreams and small variations: the runtime (the words are in a1l_story2.js)
// A small director watches Ash explore. Every few minutes of free exploring (no fights, dialogue, minigames, bosses, towns'
// busy middles, and never right after another event) it starts one short story moment near Ash, picked from a pool by
// region, time of day, weather, chapter and abilities. Each event has something to see (a person, creature or thing with a
// marker), a talk with real choices, sometimes a little action (fight a few foes, melt or light with fire breath, jump or fly,
// carry something back) and an outcome. Tikka, a runaway kobold, turns up five times across the chapters, and maybe in the
// last fight. Resting at a shrine or an inn bed sometimes starts a dream from long ago (one per chapter, each once).
// Saved state lives only in G.flags (ev_*, tk_*, dr_*), G.found and G.deeds (ev_*, dream_*).

// ---------- people of our own: SPECIAL lets the people renderer, portraits and names know them (inside:'ev' keeps them
// out of towns, since setupNPCs skips anyone who lives inside somewhere)
const EVP={
  ev_wim:{name:'Wim Wobble',col:'#e8c070',look:{shirt:'#6a7a3a',hair:'#8a6a4a',skin:'#e0b088',hat:'feather',hatc:'#8a4a2a',outfit:'vest',low:'#4a3a24',back:'pack',beard:true,trim:'#e8c070',hold:'lamp'}},
  ev_posy:{name:'Posy',col:'#ff9ac0',kid:true,look:{shirt:'#e07aa0',hair:'#e8c060',skin:'#f2c8a6',hairdo:'pigtails',outfit:'dress',low:'#c85a88',trim:'#ffd0e0',band:'#ff7aa0'}},
  ev_bea:{name:'Bea the Goatherd',col:'#d8c070',look:{shirt:'#7a5a3a',hair:'#2a1a10',skin:'#b98058',hat:'straw',outfit:'overalls',low:'#3a5a7a',hold:'staff',trim:'#d8c070',freckles:true}},
  ev_quib:{name:'Quibble the Somewhat Great',col:'#a8a0ff',look:{shirt:'#3a3a9a',hair:'#efeae0',skin:'#e6c0a0',hat:'wizard',outfit:'robe',low:'#2a2a7a',beard:'big',beardc:'#efeae0',hold:'staff',pattern:'stars',build:'old',trim:'#ffe066'}},
  ev_bess:{name:'Barnacle Bess',col:'#8ad8c8',look:{shirt:'#2a6a7a',hair:'#b8a070',skin:'#c8946c',hat:'rain',hatc:'#e8c03a',outfit:'coat',low:'#2a5a6a',hold:'rod',build:'wide',trim:'#8ad8c8',pipe:true}},
  ev_fizz:{name:'Madame Fizzwick',col:'#ff9ad0',look:{shirt:'#a03a6a',hair:'#1a1a1a',skin:'#a87050',hat:'fancy',hatc:'#7a2a5a',outfit:'dress',low:'#7a2a5a',cape:'#ffd27a',trim:'#ffd27a',earrings:true,necklace:'#ffd84a'}},
  ev_clank:{name:'Sir Clanksworth',col:'#c8ccd8',look:{shirt:'#6a6a7a',hair:'#6a4a2a',skin:'#e0b088',helm:true,plume:'#c83a3a',outfit:'armor',low:'#4a4a5a',hold:'sword',trim:'#c8ccd8'}},
  ev_juno:{name:'Juno',col:'#ffb0a0',kid:true,look:{shirt:'#c84a3a',hair:'#2a1a10',skin:'#c8946c',hat:'beanie',hatc:'#3a7ab0',hairdo:'curly',outfit:'coat',low:'#8a3a2a',scarf:'#ffd84a',trim:'#ffb0a0'}},
  ev_pim:{name:'Pim',col:'#a0d0ff',kid:true,look:{shirt:'#3a7ab0',hair:'#e8c060',skin:'#f2c8a6',hat:'beanie',hatc:'#c84a3a',hairdo:'short',outfit:'coat',low:'#2a5a8a',scarf:'#c84a3a',trim:'#a0d0ff'}},
  ev_mopsy:{name:'Mopsy',col:'#c8f0a0',kid:true,look:{shirt:'#5a8a3a',hair:'#8a3a1a',skin:'#e0ae88',hat:'beanie',hatc:'#ffd84a',hairdo:'braids',outfit:'coat',low:'#3a6a2a',scarf:'#ffffff',trim:'#c8f0a0',freckles:true}},
  ev_chuck:{name:'Cheddar Chuck',col:'#ffd860',look:{shirt:'#e8d8a0',hair:'#6a4a2a',skin:'#f0c4a2',hat:'straw',outfit:'tunic',apron:'#f4ead0',build:'wide',stache:'big',blush:true,trim:'#ffd860'}},
  ev_pud:{name:'Mr. Pudding',col:'#e0b080',look:{shirt:'#a05a3a',hair:'#3a2a1a',skin:'#cf9a72',hat:'cap',hatc:'#4a6a3a',outfit:'vest',low:'#5a4030',glasses:true,beard:true,trim:'#e0b080'}},
  ev_lumi:{name:'Lumi',col:'#e8ff9a',kid:true,look:{shirt:'#4a5a8a',hair:'#1a1a1a',skin:'#9c6644',hairdo:'pony',outfit:'tunic',low:'#3a3a6a',hold:'lantern',trim:'#e8ff9a'}},
  ev_thimble:{name:'Granny Thimble',col:'#d8b0e0',look:{shirt:'#8a5a8a',hair:'#efeae0',skin:'#e0ae88',hairdo:'bun',outfit:'dress',low:'#6a3a6a',shawl:'#d8b0e0',build:'old',hold:'cane',hold2:'basket',basketc:'yarn',glasses:true,trim:'#d8b0e0'}}
};
for(const id in EVP) SPECIAL[id]=Object.assign({id,inside:'ev',lines:[]},EVP[id]);
for(const id in EVP) if(!SPK[id]) SPK[id]={name:EVP[id].name,col:EVP[id].col};

// ---------- portraits for speakers who are not people (Tikka, the ghost, the mimic, frogs, young Ember, Vorlaxis long ago)
const EVPORT={
  ev_tikka:{bg:'#3a2a12',f:g=>evFaceKob(g,'#c84a3a',false)}, ev_tock:{bg:'#2e3012',f:g=>evFaceKob(g,'#4a8ac8',true)},
  ev_wisp:{bg:'#1a2638',f:g=>evFaceGhost(g)}, ev_mimic:{bg:'#2a1a0c',f:g=>evFaceMimic(g)}, ev_croak:{bg:'#14280e',f:g=>evFaceFrog(g)},
  ev_fog:{bg:'#202832',f:g=>evFaceFog(g)}, ev_drake:{bg:'#3a1a0a',f:g=>faceDragon(g,{skin:'#f08850',dark:'#b8582a',snout:'#ffb878',horn:'#fff4dc',eye:'#ffe066',k:0.9})},
  ember_kid:{bg:'#3a1424',f:g=>{ faceDragon(g,{skin:'#d8603a',dark:'#8a2e1a',snout:'#f08a5a',horn:'#fff0d8',eye:'#ffe48a',k:0.86}); g.fillStyle='#ff9ac0'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*24,14,6,3.5,0,0,TAU); g.fill(); } }},
  vor_old:{bg:'#2a0c10',f:g=>faceDragon(g,{skin:'#6a1e18',dark:'#2a0806',snout:'#8a3424',horn:'#e8d4ac',eye:'#ffb04a',k:1.1,big:true})},
  cinder_young:{bg:'#251c15',f:g=>{ g.save(); g.scale(0.92,0.92); faceHelm(g); g.restore(); }}
};
function evFaceKob(g,scarf,small){
  const sk='#b8a060', skD='#8a7438';
  g.save(); if(small) g.scale(0.88,0.88);
  g.fillStyle=skD; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*20,-26); g.lineTo(s*40,-44); g.lineTo(s*30,-14); g.closePath(); g.fill(); }
  g.fillStyle=scarf; g.beginPath(); g.ellipse(0,44,40,14,0,0,TAU); g.fill(); g.fillRect(14,44,12,26);
  g.fillStyle=sk; g.beginPath(); g.ellipse(0,-2,34,36,0,0,TAU); g.fill();
  g.fillStyle='#dccb92'; g.beginPath(); g.ellipse(0,24,22,15,0,0,TAU); g.fill();
  g.fillStyle='#4a3a18'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*6,20,3,2,0,0,TAU); g.fill(); }
  for(const s of [-1,1]){ g.fillStyle='#fff'; g.beginPath(); g.ellipse(s*14,-6,9,10,0,0,TAU); g.fill(); g.fillStyle='#2a1a08'; g.beginPath(); g.ellipse(s*14+1,-4,5,6.5,0,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(s*14+3,-7,2.2,0,TAU); g.fill(); }
  g.fillStyle='rgba(255,120,120,.35)'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*24,10,6,3.5,0,0,TAU); g.fill(); }
  g.strokeStyle='#4a3a18'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-10,32); g.quadraticCurveTo(0,38,10,32); g.stroke();
  g.fillStyle='#d8c48a'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*8,-34); g.lineTo(s*16,-56); g.lineTo(s*18,-32); g.closePath(); g.fill(); }
  g.restore();
}
function evFaceGhost(g){
  g.globalAlpha=0.9; g.fillStyle='#eaf6ff'; g.beginPath(); g.arc(0,-6,38,Math.PI,0); g.lineTo(38,50); for(let i=0;i<5;i++){ const x=38-i*19; g.quadraticCurveTo(x-5,62,x-9.5,50); g.quadraticCurveTo(x-14,40,x-19,50); } g.closePath(); g.fill(); g.globalAlpha=1;
  g.fillStyle='#1a2a3a'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*13,-8,6,8,0,0,TAU); g.fill(); } g.beginPath(); g.ellipse(0,16,6,8,0,0,TAU); g.fill();
  g.fillStyle='#fff'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*13+2,-11,2,0,TAU); g.fill(); }
}
function evFaceMimic(g){
  g.fillStyle='#6a4220'; g.fillRect(-46,-10,92,56); g.fillStyle='#8a5a2c'; g.fillRect(-46,-50,92,30);
  g.fillStyle='#d8b050'; g.fillRect(-46,-50,92,5); g.fillRect(-46,40,92,6); g.fillRect(-5,-50,10,96);
  g.fillStyle='#1a0806'; g.fillRect(-40,-20,80,26); g.fillStyle='#e86a7a'; g.beginPath(); g.ellipse(0,2,22,8,0,0,TAU); g.fill();
  g.fillStyle='#f6eedc'; for(let i=0;i<7;i++){ const x=-36+i*12; g.beginPath(); g.moveTo(x,-20); g.lineTo(x+6,-8); g.lineTo(x+12,-20); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x,6); g.lineTo(x+6,-4); g.lineTo(x+12,6); g.closePath(); g.fill(); }
  g.fillStyle='#ffe066'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*18,-36,7,5,0,0,TAU); g.fill(); g.fillStyle='#1a1008'; g.fillRect(s*18-1.5,-40,3,8); g.fillStyle='#ffe066'; }
}
function evFaceFrog(g){
  g.fillStyle='#5a9a34'; g.beginPath(); g.ellipse(0,10,50,36,0,0,TAU); g.fill();
  for(const s of [-1,1]){ g.fillStyle='#6ab040'; g.beginPath(); g.arc(s*24,-22,16,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(s*24,-22,11,0,TAU); g.fill(); g.fillStyle='#1a1a08'; g.beginPath(); g.arc(s*24,-21,6,0,TAU); g.fill(); }
  g.strokeStyle='#2a4a14'; g.lineWidth=3.5; g.beginPath(); g.moveTo(-34,16); g.quadraticCurveTo(0,32,34,16); g.stroke();
  g.fillStyle='#f0c838'; for(let i=0;i<5;i++){ const x=-20+i*10; g.beginPath(); g.moveTo(x-5,-44); g.lineTo(x,-58-(i%2)*6); g.lineTo(x+5,-44); g.closePath(); g.fill(); } g.fillRect(-25,-46,50,6);
}
function evFaceFog(g){ for(let i=0;i<7;i++){ const a=i/7*TAU; g.fillStyle='rgba(225,232,245,.35)'; g.beginPath(); g.arc(Math.cos(a)*22,Math.sin(a)*16,30,0,TAU); g.fill(); } g.fillStyle='rgba(255,255,255,.85)'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*12,-4,4,2.6,0,0,TAU); g.fill(); } }
{ const base=drawPortrait; drawPortrait=function(who){
  const P=EVPORT[who]; if(!P) return base(who);
  const c=$('#portrait'), g=c.getContext('2d'), Sz=176;
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,Sz,Sz); g.fillStyle=P.bg; g.fillRect(0,0,Sz,Sz);
  const gl=g.createRadialGradient(Sz/2,Sz*0.42,6,Sz/2,Sz/2,Sz*0.75); gl.addColorStop(0,'rgba(255,150,70,.28)'); gl.addColorStop(1,'rgba(0,0,0,.45)'); g.fillStyle=gl; g.fillRect(0,0,Sz,Sz);
  g.save(); g.translate(Sz/2,Sz/2+14); try{ P.f(g); }catch(e){} g.restore();
}; }

// ================= state
const EV={g:null,E:null,free:0,gap:150,lastEnd:-999,pipGo:null,carry:null,ally:null,fx:[],hist:[],dream:null,dreamT:0,pipDream:-99};
function evReset(){ EV.g=G; EV.E=null; EV.free=0; EV.gap=rand(130,170); EV.lastEnd=-999; EV.pipGo=null; EV.carry=null; EV.ally=null; EV.fx.length=0; dreamClose(true); }
const EVTOWNS=['village','brindle','copper','lodge','way','farm','mosshut'];
function evInTown(x,y,k){ for(const t of EVTOWNS){ const P=POI[t]; if(P&&dist2(x,y,P.x,P.y)<(P.r*(k||0.85))**2) return true; } return false; }
function evNearSite(x,y,pad){ for(const k in POI){ if(EVTOWNS.includes(k)) continue; const P=POI[k]; if(dist2(x,y,P.x,P.y)<(P.r+(pad||0))**2) return true; } return false; }
function evWaterAt(x,y){ const s=T(x,y,{}); return !!s.water; }
function evNearWater(x,y,R){ for(let k=1;k<=3;k++) for(let i=0;i<12;i++){ const a=i/12*TAU, r=R*k/3; if(evWaterAt(x+Math.cos(a)*r,y+Math.sin(a)*r)) return true; } return false; }
function evLevel(x,y){ return Math.max(1,(regionAt(x,y)||{}).level||1); }
// a spot near Ash for an event (ahead of him, so he sees it): free of colliders, water, towns, camps and other things
function evFree(x,y,r,o){
  o=o||{};
  if(outOfMap(x,y,220)) return false;
  if(!o.north&&y<WALL_Y+160) return false;
  if(!freeSpot(x,y,r)) return false;
  const s=T(x,y,{}); if(s.water||s.lava||s.bog>0.25||s.bridge) return false;
  if(o.road===true&&s.roadD>42) return false;
  if(o.road===false&&s.roadD<60) return false;
  if(inClearing(x,y,40)) return false;
  if(evTreeNear(x,y,o.trees==null?34:o.trees)) return false;
  if(o.clear){ for(let i=0;i<6;i++){ const a=i/6*TAU; const qx=x+Math.cos(a)*o.clear, qy=y+Math.sin(a)*o.clear; if(!freeSpot(qx,qy,14)||evWaterAt(qx,qy)) return false; } }
  for(const e of G.enemies) if(!e.dead&&dist2(e.x,e.y,x,y)<420*420) return false;
  for(const c of CAMPS){ const cl=G.campsCleared[c.id]; if(cl!=null&&G.worldTime-cl<300) continue; if(dist2(c.x,c.y,x,y)<800*800) return false; }
  for(const d of DOORS) if(dist2(d.x,d.y,x,y)<110*110) return false;
  for(const m of CAVEMOUTHS) if(dist2(m.x,m.y,x,y)<160*160) return false;
  for(const l of LANDMARKS) if(dist2(l.x,l.y,x,y)<70*70) return false;
  for(const c of CHESTS) if(dist2(c.x,c.y,x,y)<70*70) return false;
  return true;
}
function evTreeNear(x,y,r){ if(r<=0) return false; const c0=Math.floor((x-r-60)/CH), c1=Math.floor((x+r+60)/CH), r0=Math.floor((y-r-60)/CH), r1=Math.floor((y+r+60)/CH); for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++) for(const q of propsFor(cx,cy)){ if(q.taken||!TREEK[q.k]) continue; const R=r+(q.R||40)*0.6; if(dist2(q.x,q.y,x,y)<R*R) return true; } return false; }
function evSpot(o){
  o=o||{}; const p=player;
  for(let i=0;i<70;i++){
    const spread=i<25?0.7:i<50?1.7:Math.PI, a=p.facing+rand(-spread,spread), r=rand(o.min||280,o.max||430);
    const x=p.x+Math.cos(a)*r, y=p.y+Math.sin(a)*r;
    if(!evFree(x,y,o.rad||30,o)) continue;
    if(o.test&&!o.test(x,y)) continue;
    return {x,y};
  }
  return null;
}
// a point a little away from a centre that is free (for the hat, the nest, goats, fireflies...)
function evNear(cx,cy,r0,r1,o){ for(let i=0;i<50;i++){ const a=rand(0,TAU), r=rand(r0,r1), x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r; if(evFree(x,y,(o&&o.rad)||16,Object.assign({},o||{},{clear:0}))) return {x,y,a}; } return null; }
// land right next to water (fishing, frogs)
function evShore(){
  const p=player;
  for(let i=0;i<120;i++){
    const a=i<60?p.facing+rand(-1.4,1.4):rand(0,TAU), r=rand(220,620); let x=p.x+Math.cos(a)*r, y=p.y+Math.sin(a)*r;
    if(!evWaterAt(x,y)) continue;
    for(let k=0;k<40;k++){ x-=Math.cos(a)*12; y-=Math.sin(a)*12; if(!evWaterAt(x,y)) break; }
    x-=Math.cos(a)*22; y-=Math.sin(a)*22;
    if(evWaterAt(x,y)||!freeSpot(x,y,18)||dist2(x,y,p.x,p.y)<210*210) continue;
    const s=T(x,y,{}); if(s.bridge||s.roadD<40||inClearing(x,y,30)||y<WALL_Y+160) continue;
    let near=false; for(let j=0;j<16;j++){ const b=j/16*TAU; if(evWaterAt(x+Math.cos(b)*68,y+Math.sin(b)*68)){ near=true; break; } }
    if(!near) continue;
    let ok=true; for(const e of G.enemies) if(!e.dead&&dist2(e.x,e.y,x,y)<400*400){ ok=false; break; }
    if(ok) return {x,y,wa:a};
  }
  return null;
}
// ---------- rewards
const EVHATN={top:'Top Hat',wizard:'Wizard Hat',crown:'Flower Crown',party:'Party Hat'};
function evHatGift(){ const H=G.hats||{}; for(const k of ['top','wizard','crown','party']) if(!H[k]) return k; return null; }
function evGive(r){
  if(!r||!player) return; const p=player;
  if(r.coins) addCoins(r.coins,p.x,p.y);
  if(r.maxhp){ p.maxHp+=r.maxhp; p.hp=Math.min(p.maxHp,p.hp+r.maxhp); }
  if(r.heal) heal(r.heal===true?p.maxHp:r.heal);
  if(r.pots) p.potions=p.potionsMax;
  if(r.stamina){ p.stamina=p.maxStamina; p.energy=p.maxEnergy; }
  if(r.treat){ if((G.pipTreats||0)<3) G.pipTreats=(G.pipTreats||0)+r.treat; else addCoins(15,p.x,p.y); }
  if(r.iron){ G.iron+=r.iron; setBanner(S('Star-iron','Star-iron'),S('Take it to Mom at the forge.','Take it to Mom.'),2.4); }
  if(r.hat){ G.hats=G.hats||{}; G.hats[r.hat]=true; if(r.wear) G.hat=r.hat; setBanner(EVHATN[r.hat]||'Hat',S('Looking fabulous.','You look great!'),2); }
  if(r.item) giveItems(r.item);
  if(r.bless){ G.pendingBless+=r.bless; later(1.2,offerPending); }
  if(r.xp) gainXp(r.xp);
  SFX.play('chest');
}

// ================= the events
// def: min (stage), w(c) weight, spot(c), setup(E,at), talk(E) when the main person is used, act(E,dt) while E.phase is 'act',
// tick(E,dt) always, fire(E,o,dt) on fire breath, hit(E,o) on weapon hits, chain/once flags.
const EVD={};
const evN=k=>G.flags['ev_'+k]|0;
const evAgo=k=>(G.worldTime||0)-(G.flags['ev_'+k+'_t']||-1e9);
function evRep(k){ const n=evN(k); let w=n<1?1:n<2?0.45:n<3?0.25:0.12; if(evAgo(k)<1200) w*=0.2; return w; }
function evNpc(id,x,y,o){ const n=mkNPC(SPECIAL[id],x,y); n.k='npc'; n.walker=false; return Object.assign(n,o||{}); }
function evTalkTo(n){ return {text:()=>S(`Talk to ${SPK[n.id]?SPK[n.id].name:n.name}`,`Talk to ${SPK[n.id]?SPK[n.id].name.split(' ')[0]:n.name}`),fn:()=>{ const E=EV.E; if(E&&E.def.talk) E.def.talk(E,n); }}; }
function evRun(lines,cb){ runDialogue(lines,()=>{ scene='play'; if(cb) cb(); }); }
function evTalk(E,key,cb){ const src=E.tk?TKS[E.id]:EVS[E.id]; E.talked=true; E.phase='talk'; if(E.main&&E.main.mark==='!') E.main.mark=null; evRun(src[key](E),()=>{ if(EV.E!==E) return; if(E.phase==='talk') E.phase='wait'; if(cb) cb(); }); }
function evWin(E,key,r){ evTalk(E,key,()=>{ if(r) evGive(r); evEnd(E,true); }); }
function evAct(E,secs){ E.phase='act'; E.actT=0; E.limit=secs||0; }
function evSay(o,text){ if(!o||!text) return; const s=SPK[o.id]||null; bubble(o,text,{who:s?shortNm(s.name):'',col:s?s.col:'#d8c3a0',dy:o.bdy||-40}); }
function shortNm(n){ const w=String(n).split(' '); return ['Sir','Madame','Mr.','Granny','Lord','Barnacle','Cheddar'].includes(w[0])?w.slice(0,2).join(' '):w[0]; }
function evFoes(E,list,x,y,o){
  const lvl=evLevel(x,y), camp={id:'ev_'+E.id,alive:0,cave:true}; E.camp=camp; E.foes=E.foes||[];
  for(const [type,n] of list) for(let i=0;i<n;i++){ const s=evNear(x,y,(o&&o.r0)||20,(o&&o.r1)||110,{rad:14})||{x:x+rand(-60,60),y:y+rand(-60,60)}; const e=makeEnemy(type,s.x,s.y,{level:lvl,aggro:!!(o&&o.aggro),homeX:x,homeY:y,leash:900,camp,face:rand(0,TAU),elite:false}); camp.alive++; E.foes.push(e); }
  return camp;
}
function evFoesLeft(E){ return E.foes?E.foes.filter(f=>!f.dead).length:0; }

// ---------- Stuck in the Mud
EVD.cart={min:'lore',kind:'funny',w:c=>c.road<150?(c.rain?4:1.6):0,spot:()=>evSpot({road:true,rad:34,min:260,max:420}),
  setup(E,at){ const s=T(at.x,at.y,{}); const f=s.roadAng||0;
    E.cart=E.add({k:'cart',x:at.x,y:at.y,face:f,r:34,hit:true,tilt:1,push:true});
    E.mud=E.add({k:'mud',x:at.x,y:at.y+4,r:44,fire:true,dry:0,ground:true});
    E.main=E.add(evNpc('ev_wim',at.x-Math.sin(f)*48,at.y+Math.cos(f)*48+8)); E.main.use=evTalkTo(E.main); },
  talk(E){ evTalk(E,'meet',()=>{ const p=E.plan; if(p==='no') evEnd(E,false); else if(p) { evAct(E,90); E.d.hits=0; setBanner(S(EVS.cart.title,EVS.cart.title),p==='push'?S('Hit the wagon wheels to push it out.','Hit the wagon to push it.'):S('Breathe fire on the mud to dry it out.','Breathe fire on the mud.'),2.4); } }); },
  hit(E,o){ if(E.phase!=='act'||o!==E.cart) return; E.d.hits+=G.weapon==='hammer'?2:1; const a=o.face; o.x+=Math.cos(a)*5; o.y+=Math.sin(a)*5; o.jolt=0.3; shake(2); emit(o.x,o.y+8,10,{col:'90,60,30',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); ftext(o.x,o.y-40,pick(['Heave!','Hup!','Nearly!','Again!']),'#ffd9a0',13); if(E.d.hits>=4) evCartFree(E); },
  fire(E,o,dt){ if(E.phase!=='act'||o!==E.mud) return; o.dry+=dt; if(Math.random()<0.5) emit(o.x+rand(-30,30),o.y+rand(-12,12),1,{col:'230,230,230',glow:false,ang:-Math.PI/2,spread:0.5,smin:15,smax:50,lmin:.6,lmax:1.2,zmin:3,zmax:7,grow:8}); if(o.dry>=1.6) evCartFree(E); },
  act(E){ if(E.limit&&E.actT>E.limit) evQuit(E); }
};
function evCartFree(E){ if(E.phase!=='act') return; E.phase='talk'; E.cart.tilt=0; E.mud.dry=Math.max(E.mud.dry,1.6); SFX.play('pop'); shake(4); emit(E.cart.x,E.cart.y,26,{col:'110,80,40',glow:false,smin:60,smax:220,lmin:.4,lmax:.9,zmin:2,zmax:4}); later(0.7,()=>{ if(EV.E===E) evWin(E,'win'); }); }
function evQuit(E,r){ if(E.phase==='leave') return; const src=E.tk?TKS[E.id]:EVS[E.id]; if(src&&src.quit){ evTalk(E,'quit',()=>{ if(r) evGive(r); evEnd(E,false); }); } else evEnd(E,false); }
EVD.cart2={min:'three',kind:'kind',chain:true,w:c=>evN('cart')&&!evN('cart2')&&evAgo('cart')>900?(c.road<250?7:2):0,spot:()=>evSpot({road:true,rad:34})||evSpot({}),
  setup(E,at){ const s=T(at.x,at.y,{}), f=s.roadAng||0; E.cart=E.add({k:'cart',x:at.x,y:at.y,face:f,r:34,gold:true,push:true}); E.main=E.add(evNpc('ev_wim',at.x-Math.sin(f)*48,at.y+Math.cos(f)*48+8)); E.main.use=evTalkTo(E.main); E.d.hat=evHatGift(); },
  talk(E){ evTalk(E,'meet',()=>evEnd(E,true)); }
};
// ---------- Kitten Up a Tree
EVD.kitten={min:'lore',kind:'kind',w:c=>c.day&&(c.b===0||c.b===1)?(hasAbil('jump')||hasAbil('wings')?2.4:1.6):0,spot:()=>evSpot({road:false,rad:34,clear:60}),
  setup(E,at){ E.tree=E.add({k:'tree',x:at.x,y:at.y,r:16,s:1.18,v:randi(0,3),hit:true,push:true,kit:1}); E.main=E.add(evNpc('ev_posy',at.x+52,at.y+34)); E.main.use=evTalkTo(E.main); E.kit={x:at.x,y:at.y,mode:'tree',t:0}; },
  talk(E){ if(E.d.carry){ return; } evTalk(E,'meet',()=>{ const p=E.plan; E.d.shakes=0;
    if(p==='tail'){ evKitCarry(E); }
    else if(p==='pip'){ evAct(E,40); EV.pipGo={x:E.tree.x,y:E.tree.y-6}; }
    else if(p){ evAct(E,90); setBanner(S(EVS.kitten.title,EVS.kitten.title),p==='jump'?S('Jump up next to the tree to grab him.','Jump next to the tree!'):p==='fly'?S('Fly up to the top of the tree.','Fly up to him!'):S('Tap the tree trunk gently with your weapon.','Tap the tree gently.'),2.4); } }); },
  hit(E,o){ if(E.phase!=='act'||o!==E.tree||E.plan==='pip') return; E.d.shakes++; o.jolt=0.35; ftext(o.x,o.y-30,E.d.shakes<3?S('Mew!','Mew!'):S('MEW!','MEW!'),'#ffe8c0',13); if(E.d.shakes>=3) evKitDrop(E); },
  act(E,dt){ const p=player, tr=E.tree, d=dist(p.x,p.y,tr.x,tr.y);
    if(E.kit.mode==='tree'){
      if((E.plan==='jump'||E.plan==='fly'||E.plan==='shake')&&d<70&&((p.z||0)>16||p.flying)) evKitCarry(E);
      if(E.plan==='pip'&&G.pip&&dist(G.pip.x,G.pip.y,tr.x,tr.y-6)<34){ E.kit.mode='pip'; EV.pipGo={x:E.main.x,y:E.main.y-10}; SFX.play('pop'); }
    } else if(E.kit.mode==='pip'&&G.pip){ EV.pipGo={x:E.main.x,y:E.main.y-10}; if(dist(G.pip.x,G.pip.y,E.main.x,E.main.y-10)<40){ E.kit.mode='posy'; EV.pipGo=null; evKitHome(E); } }
    else if(E.kit.mode==='fall'){ E.kit.t+=dt; if(E.kit.t>0.6) evKitCarry(E); }
    if(E.limit&&E.actT>E.limit&&E.kit.mode!=='carry') { EV.pipGo=null; evKitCarry(E); } }
};
function evKitDrop(E){ E.kit.mode='fall'; E.kit.t=0; SFX.play('roll'); }
function evKitCarry(E){ E.kit.mode='carry'; E.phase='act'; E.limit=0; EV.pipGo=null; E.main.mark='?'; EV.carry={k:'kitten',to:E.main,give:S('Give Sir Fluffington back','Give the kitten back'),fn:()=>{ E.kit.mode='posy'; EV.carry=null; evKitHome(E); }}; SFX.play('pickup'); setBanner(S('Got him!','Got him!'),S('Take Sir Fluffington back to Posy.','Take the kitten to Posy.'),2.2); }
function evKitHome(E){ E.phase='talk'; evWin(E,'win',{coins:15}); }
// ---------- Falling Stars
EVD.stars={min:'lore',kind:'exciting',w:c=>c.night&&!c.rain&&[0,1,2,3,5].includes(c.b)?2.4:0,spot:()=>evSpot({rad:24,min:260,max:380}),
  setup(E,at){ E.d.land=1.6; E.star=E.add({k:'star',x:at.x,y:at.y,z:260,hide:true}); for(let i=0;i<14;i++) EV.fx.push({k:'streak',t:-i*0.18-rand(0,0.2),x:player.x+rand(-500,500),y:player.y-rand(250,420),vx:rand(-500,-260),vy:rand(160,260),life:rand(0.9,1.4)}); },
  tick(E,dt){ const s=E.star; if(s.hide){ E.d.land-=dt; if(E.d.land<=0){ s.hide=false; s.z=0; shake(5); flashA=Math.max(flashA,0.3); flashCol='255,240,200'; SFX.play('boom'); emit(s.x,s.y,30,{col:'255,240,180',smin:60,smax:220,lmin:.4,lmax:.9,zmin:2,zmax:4}); s.use={text:()=>S('Look at the fallen star','Look at the star'),fn:()=>EVD.stars.talk(E)}; s.mark='!'; E.main=s; } }
    if(E.d.rise){ s.z+=dt*160; s.alpha=clamp(1-s.z/300,0,1); } },
  talk(E){ evTalk(E,'meet',()=>{ const s=E.star;
    if(E.plan==='catch'){ s.hide=true; s.use=null; E.d.got=0; E.sparks=[]; for(let i=0;i<3;i++){ const a=i/3*TAU+rand(-0.3,0.3); E.sparks.push(E.add({k:'spark',x:s.x,y:s.y,vx:Math.cos(a)*170,vy:Math.sin(a)*170,z:6,ph:rand(0,TAU)})); } evAct(E,32); setBanner(S('Catch the sparks!','Catch the sparks!'),S('Run into all three before they get away.','Touch all three!'),2.2); }
    else if(E.plan==='free'){ evGive({heal:true}); s.use=null; E.d.rise=true; evEnd(E,true); } }); },
  act(E,dt){ const p=player;
    for(const sp of E.sparks){ if(sp.gone) continue;
      const d=dist(p.x,p.y,sp.x,sp.y);
      if(d<180){ const a=angTo(p.x,p.y,sp.x,sp.y); sp.vx+=Math.cos(a)*260*dt; sp.vy+=Math.sin(a)*260*dt; }
      sp.vx+=rand(-120,120)*dt; sp.vy+=rand(-120,120)*dt; const v=Math.hypot(sp.vx,sp.vy), mx=170; if(v>mx){ sp.vx*=mx/v; sp.vy*=mx/v; }
      const nx=sp.x+sp.vx*dt, ny=sp.y+sp.vy*dt; if(blockedAt(nx,ny)&&!hasAbil('stride')||dist(nx,ny,E.star.x,E.star.y)>420){ sp.vx*=-0.8; sp.vy*=-0.8; } else { sp.x=nx; sp.y=ny; }
      if(d<28){ sp.gone=true; E.d.got++; SFX.play('pickup'); emit(sp.x,sp.y,14,{col:'255,240,170',smin:30,smax:120,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); ftext(sp.x,sp.y-20,`${E.d.got}/3`,'#fff3b0',14); if(E.d.got>=3){ E.phase='talk'; E.star.hide=false; E.star.x=p.x+20; E.star.y=p.y+10; later(0.5,()=>{ if(EV.E===E) evTalk(E,'win',()=>evEnd(E,true)); }); return; } } }
    if(E.limit&&E.actT>E.limit){ for(const sp of E.sparks) sp.gone=true; evQuit(E); } }
};
// ---------- The Ghost Who Lost His Hat
EVD.ghost={min:'lore',kind:'spooky',w:c=>c.night&&c.b!==4?([1,6].includes(c.b)?2.6:1.4):0,spot:()=>evSpot({rad:26}),
  setup(E,at){ E.main=E.add({k:'ghost',x:at.x,y:at.y,id:'ev_wisp',face:Math.PI/2,bdy:-56}); E.main.use={text:()=>S('Talk to the ghost','Talk to the ghost'),fn:()=>EVD.ghost.talk(E)};
    const h=evNear(at.x,at.y,330,520,{rad:14})||{x:at.x+380,y:at.y}; E.hat=E.add({k:'hat',x:h.x,y:h.y,hide:true}); },
  talk(E){ if(EV.carry&&EV.carry.k==='hat') return; evTalk(E,'meet',()=>{ if(!E.plan) return; E.hat.hide=false; E.hat.mark='?'; E.hat.use={text:()=>S('Pick up the hat','Pick up the hat'),fn:()=>{ E.hat.hide=true; E.hat.use=null; E.hat.mark=null; E.main.mark='?'; EV.carry={k:'hat',to:E.main,give:S('Give Sir Wispley his hat','Give back the hat'),fn:()=>{ EV.carry=null; E.main.hat=true; evTalk(E,'back',()=>{ E.d.rise=true; evEnd(E,true); }); }}; SFX.play('pickup'); }}; evAct(E,150); setBanner(S('Find the hat','Find the hat'),S('It blew off somewhere nearby. Look for a tall black hat.','Look for a tall black hat nearby.'),2.4); }); },
  tick(E,dt){ if(E.d.rise){ E.main.z=(E.main.z||0)+dt*70; E.main.alpha=clamp(1-E.main.z/180,0,1); } },
  act(E){ if(E.limit&&E.actT>E.limit&&!EV.carry) evQuit(E); }
};
// ---------- The Hungry Chest
EVD.mimic={min:'lore',kind:'spooky',w:c=>c.b===4?0:([1,2,3,6].includes(c.b)?1.5:0.6),spot:()=>evSpot({rad:24}),
  setup(E,at){ E.main=E.add({k:'mimic',x:at.x,y:at.y,r:14,id:'ev_mimic',open:0,face:Math.PI/2,z:0,bdy:-34}); E.main.use={text:()=>S('Open the chest','Open the chest'),fn:()=>EVD.mimic.talk(E)}; },
  talk(E){ const m=E.main; m.awake=true; m.snap=0.5; shake(4); SFX.play('hit'); m.use=null;
    later(0.45,()=>{ if(EV.E!==E) return; evTalk(E,'meet',()=>{ const p=E.plan;
      if(p==='fed') evTalk(E,'fed',()=>{ evGive({coins:35}); evEnd(E,true); });
      else if(p==='tickle'){ m.hit=true; E.d.hits=0; m.hopT=0; evAct(E,35); setBanner(S('Tickle the chest!','Tickle the chest!'),S('Tap it four times with your weapon.','Tap it 4 times.'),2.2); }
      else if(p==='run'){ E.d.ran=true; m.chase=2.5; evAct(E,0); } }); }); },
  hit(E,o){ if(E.phase!=='act'||o!==E.main||E.plan!=='tickle') return; E.d.hits++; o.snap=0.4; o.vz=160; ftext(o.x,o.y-30,pick([S('Hee hee!','Hee hee!'),S('Hoo hoo!','Hoo hoo!'),S('Stop it!','Stop it!'),S('HA HA!','HA HA!')]),'#ffe8a0',14); csfx('bonk'); if(E.d.hits>=4){ E.phase='talk'; m0(E); evTalk(E,'win',()=>{ evGive({coins:30,pots:true}); evEnd(E,true); }); } },
  act(E,dt){ const m=E.main, p=player;
    if(E.plan==='run'){ m.chase-=dt; if(m.chase>0){ const a=angTo(m.x,m.y,p.x,p.y); evHopTo(m,m.x+Math.cos(a)*40,m.y+Math.sin(a)*40,dt); } else { E.phase='talk'; evEnd(E,false); } return; }
    m.hopT-=dt; if(m.hopT<=0){ m.hopT=rand(0.7,1.1); const a=rand(0,TAU), r=rand(70,130); m.tx=p.x+Math.cos(a)*r; m.ty=p.y+Math.sin(a)*r; m.vz=150; }
    evHopTo(m,m.tx,m.ty,dt);
    if(E.limit&&E.actT>E.limit) evQuit(E); }
};
function m0(E){ E.main.hit=false; }
function evHopTo(o,tx,ty,dt){ if(tx==null) return; const d=dist(o.x,o.y,tx,ty); if(o.z>0||d>4){ const a=angTo(o.x,o.y,tx,ty), sp=Math.min(d,(o.z>0?190:60)*dt); const ox=o.x,oy=o.y; o.x+=Math.cos(a)*sp; o.y+=Math.sin(a)*sp; if(blockedAt(o.x,o.y)||colAt(o.x,o.y,10)){ o.x=ox; o.y=oy; } o.face=turnTo(o.face||0,a,6*dt); } o.vz=(o.vz||0)-520*dt; o.z=Math.max(0,(o.z||0)+o.vz*dt); if(o.z===0&&o.vz<0) o.vz=0; }
EVD.mimic2={min:'lore',kind:'funny',chain:true,w:c=>evN('mimic')&&!evN('mimic2')&&evAgo('mimic')>900&&c.b!==4?4:0,spot:()=>evSpot({rad:24}),
  setup(E,at){ E.main=E.add({k:'mimic',x:at.x,y:at.y,r:14,id:'ev_mimic',open:0.3,awake:true,face:Math.PI/2,z:0,bdy:-34}); E.kid=E.add({k:'mimic',x:at.x+30,y:at.y+16,r:9,small:true,open:0.2,awake:true,face:Math.PI/2,z:0}); E.main.use={text:()=>S('Say hello to the chests','Say hello'),fn:()=>EVD.mimic2.talk(E)}; },
  tick(E,dt){ for(const m of [E.main,E.kid]){ if(m.z<=0&&Math.random()<dt*0.8) m.vz=110; evHopTo(m,m.x,m.y,dt); } },
  talk(E){ E.main.use=null; evTalk(E,'meet',()=>{ evGive({coins:40,treat:G.flags.pip?1:0}); evEnd(E,true); }); }
};
// ---------- Goat Stampede
EVD.goats={min:'lore',kind:'exciting',w:c=>c.day&&(c.b===0||c.b===5)?(c.farm<2600?3:1.5):0,spot:()=>evSpot({road:false,rad:34,clear:110,min:240,max:360}),
  setup(E,at){ E.main=E.add(evNpc('ev_bea',at.x,at.y)); E.main.use=evTalkTo(E.main);
    const pa=evNear(at.x,at.y,90,140,{rad:30})||{x:at.x+110,y:at.y}; E.pen=E.add({k:'pen',x:pa.x,y:pa.y,r:62,ground:true});
    E.goats=[]; for(let i=0;i<7;i++){ const g=evNear(pa.x,pa.y,170,330,{rad:12})||{x:pa.x+rand(-300,300),y:pa.y+rand(-300,300)}; E.goats.push(E.add({k:'goat',kind:'goat',x:g.x,y:g.y,r:10,face:rand(0,TAU),t:rand(0,9),wt:0,inPen:false,push:false})); } },
  talk(E){ evTalk(E,'meet',()=>{ if(!E.plan) return; if(E.d.roar) for(const g of E.goats){ const a=angTo(E.pen.x,E.pen.y,g.x,g.y); g.vx=Math.cos(a)*240; g.vy=Math.sin(a)*240; g.scare=1.2; } evAct(E,90); E.d.n=-1; setBanner(S('Herd the goats!','Herd the goats!'),S('Walk behind them to push them into the pen.','Push them into the pen!'),2.4); }); },
  act(E,dt){ const p=player, P=E.pen; let n=0;
    for(const g of E.goats){
      g.t+=dt; const ox=g.x, oy=g.y; let vx=0, vy=0;
      if(g.inPen){ g.wt-=dt; if(g.wt<=0){ g.wt=rand(1,3); const a=rand(0,TAU), r=rand(0,P.r-18); g.tx=P.x+Math.cos(a)*r; g.ty=P.y+Math.sin(a)*r; } if(g.tx!=null&&dist(g.x,g.y,g.tx,g.ty)>4){ const a=angTo(g.x,g.y,g.tx,g.ty); vx=Math.cos(a)*30; vy=Math.sin(a)*30; } n++; }
      else{
        const d=dist(p.x,p.y,g.x,g.y), fr=E.d.duchess?190:150;
        if(g.scare>0){ g.scare-=dt; vx=g.vx; vy=g.vy; }
        else if(d<fr){ const a=angTo(p.x,p.y,g.x,g.y), sp=(E.d.duchess?150:165)*(1-d/fr*0.4); vx=Math.cos(a)*sp; vy=Math.sin(a)*sp; if(E.d.duchess){ const b=angTo(g.x,g.y,P.x,P.y); vx+=Math.cos(b)*45; vy+=Math.sin(b)*45; } }
        else{ g.wt-=dt; if(g.wt<=0){ g.wt=rand(1.5,3.5); g.wa=rand(0,TAU); g.walk=Math.random()<0.5; } if(g.walk){ vx=Math.cos(g.wa)*28; vy=Math.sin(g.wa)*28; } }
        if(dist(g.x,g.y,P.x,P.y)<P.r-12){ g.inPen=true; g.wt=0; csfx('bleat',0.6); ftext(g.x,g.y-20,S('Meh!','Meh!'),'#fff',12); }
      }
      g.x+=vx*dt; g.y+=vy*dt; collideObs(g); terrainFix(g,ox,oy); if(evWaterAt(g.x,g.y)){ g.x=ox; g.y=oy; g.wa=(g.wa||0)+Math.PI; }
      g.moving=Math.hypot(vx,vy)>8; if(g.moving) g.face=turnTo(g.face,Math.atan2(vy,vx),8*dt);
    }
    if(n!==E.d.n){ E.d.n=n; if(n>0&&n<6) setBanner(S(`Goats in the pen: ${n} of 7`,`Goats in the pen: ${n} of 7`),'',1.6); }
    if(n>=6){ E.phase='talk'; evWin(E,'win',{heal:true,coins:20}); }
    else if(E.limit&&E.actT>E.limit) evQuit(E,{coins:4*n}); }
};
// ---------- The Hat-Swap Wizard
EVD.wizard={min:'lore',kind:'funny',w:c=>!c.night&&[0,1,2].includes(c.b)&&!G.flags.ev_wiz_old?1.3:0,spot:()=>evSpot({rad:26}),
  setup(E,at){ E.main=E.add(evNpc('ev_quib',at.x,at.y)); E.main.use=evTalkTo(E.main); },
  talk(E){ evTalk(E,'meet',()=>{ const m=E.main;
    if(E.plan==='swap'){ G.flags.ev_wiz_old=G.hat||'none'; G.flags.ev_wiz_t=Math.round(G.worldTime); G.hat='wizard'; emit(player.x,player.y-20,24,{col:'190,170,255',smin:30,smax:120,lmin:.4,lmax:.9,zmin:1.5,zmax:3,rise:20}); SFX.play('upgrade'); evEnd(E,true); }
    else if(E.plan==='trick'){ for(let i=0;i<40;i++) emit(m.x+rand(-140,140),m.y-rand(60,160),1,{col:pick(['255,170,200','255,230,140','200,180,255','255,255,255']),glow:false,ang:Math.PI/2,spread:0.6,smin:20,smax:60,lmin:1.6,lmax:2.6,zmin:1.5,zmax:3,drag:0.6}); evGive({stamina:true,coins:5}); evEnd(E,true); }
    else evEnd(E,false); }); }
};
EVD.wizard2={min:'lore',kind:'funny',chain:true,w:c=>G.flags.ev_wiz_old&&!evN('wizard2')&&(G.worldTime-(G.flags.ev_wiz_t||0))>540?8:0,spot:()=>evSpot({rad:26}),
  setup(E,at){ E.main=E.add(evNpc('ev_quib',at.x,at.y)); E.main.use=evTalkTo(E.main); E.d.old=G.flags.ev_wiz_old; },
  talk(E){ evTalk(E,'meet',()=>evEnd(E,true)); }
};
function evWizardReturn(E){ const old=E.d.old; G.hats=G.hats||{}; G.hats.wizard=true; if(old&&old!=='none'){ G.hats[old]=true; G.hat=old; } else G.hat='wizard'; G.flags.ev_wiz_old=null; SFX.play('upgrade'); }
// ---------- The Whispering Fog
EVD.fog={min:'lore',kind:'spooky',w:c=>(c.night||c.rain||c.dawn)&&[1,5,6].includes(c.b)?2.4:0,spot:()=>evSpot({rad:20,min:200,max:260}),
  setup(E,at){ E.d.fog=0; E.wisps=[]; let x=at.x, y=at.y, a=angTo(player.x,player.y,at.x,at.y);
    E.wisps.push(E.add({k:'wisp',x,y,on:true}));
    for(let i=0;i<3;i++){ let ok=null; for(let k=0;k<30&&!ok;k++){ const b=a+rand(-0.9,0.9), r=rand(220,300), qx=x+Math.cos(b)*r, qy=y+Math.sin(b)*r; if(evFree(qx,qy,20,{})) ok={x:qx,y:qy,b}; } if(!ok) ok={x:x+Math.cos(a)*240,y:y+Math.sin(a)*240,b:a}; x=ok.x; y=ok.y; a=ok.b; E.wisps.push(E.add({k:i<2?'wisp':'grove',x,y,on:false,ground:i===2})); }
    E.grove=E.wisps[3]; E.main=E.wisps[0]; E.main.use={text:()=>S('Listen to the fog','Listen to the fog'),fn:()=>EVD.fog.talk(E)}; E.d.i=0; },
  tick(E,dt){ E.d.fog=clamp(E.d.fog+(E.phase==='leave'?-dt*0.5:dt*0.35),0,1); },
  talk(E){ E.main.use=null; evTalk(E,'start',()=>{ if(E.plan==='follow'){ E.wisps[0].on=false; E.wisps[1].on=true; E.d.i=1; evAct(E,150); } else evEnd(E,false); }); },
  act(E){ const p=player, w=E.wisps[E.d.i];
    if(w&&dist(p.x,p.y,w.x,w.y)<(w.k==='grove'?80:55)){
      if(w.k==='grove'){ E.phase='talk'; w.on=true; evTalk(E,'grove',()=>evEnd(E,true)); return; }
      w.on=false; E.d.i++; const nx=E.wisps[E.d.i]; if(nx){ nx.on=true; SFX.play('ui'); if(nx.k==='grove') emit(nx.x,nx.y,30,{col:'190,255,210',smin:20,smax:80,lmin:.6,lmax:1.2,zmin:1.5,zmax:3,rise:15}); } }
    if(E.limit&&E.actT>E.limit) evEnd(E,false); }
};
// ---------- The Lost Drakeling
const DMUMPAL={skin:'#c8603a',dark:'#8a3a1e',belly:'#f6d8a8',snout:'#e08a5a',horn:'#f4e4c4',wing:'#e88a50',wingE:'#7a2e14',spine:'#ffcc80',blush:'#ff8f86'};
EVD.drake={min:'lore',kind:'kind',w:c=>(reached('three')||G.flags.pip)?([2,3,4].includes(c.b)?2.2:c.b<2?0.6:0):0,spot:()=>evSpot({rad:22}),
  setup(E,at){ E.main=E.add({k:'baby',x:at.x,y:at.y,face:Math.PI/2,t:0,id:'ev_drake',bdy:-30}); E.main.use={text:()=>S('Look at the baby drakeling','Look at the baby dragon'),fn:()=>EVD.drake.talk(E)};
    const m=evNear(at.x,at.y,560,780,{rad:24})||{x:at.x+600,y:at.y}; E.mum=E.add({k:'mum',x:m.x,y:m.y,face:angTo(m.x,m.y,at.x,at.y),t:0,hide:true}); E.nest=E.add({k:'nest',x:m.x,y:m.y+4,ground:true,hide:true}); },
  talk(E){ E.main.use=null; evTalk(E,'meet',()=>{ if(!E.plan) return; E.mum.hide=false; E.nest.hide=false; E.mum.mark='?'; if(E.d.pip&&G.pip) EV.pipGo={x:E.mum.x,y:E.mum.y-30}; evAct(E,160); setBanner(S('Find the nest','Find the nest'),S('Lead the baby to its mum. She is not far.','Take the baby to its mum.'),2.4); }); },
  tick(E,dt){ const b=E.main; b.t+=dt; if(E.phase==='wait'&&Math.random()<dt*0.6) emit(b.x,b.y-14,1,{col:'200,200,200',glow:false,ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.6,lmax:1,zmin:2,zmax:4,grow:5});
    if(E.d.fly){ E.d.fz=(E.d.fz||0)+dt*90; E.mum.z=E.d.fz; b.z=E.d.fz; E.mum.alpha=b.alpha=clamp(1-E.d.fz/260,0,1); } },
  act(E,dt){ const p=player, b=E.main, M=E.mum, d=dist(p.x,p.y,b.x,b.y);
    if(d<420){ const a=angTo(b.x,b.y,p.x,p.y); const want=d>60?Math.min(d-50,190*dt):0; if(want>0){ const ox=b.x,oy=b.y; b.x+=Math.cos(a)*want; b.y+=Math.sin(a)*want; if(blockedAt(b.x,b.y)&&!evWaterAt(b.x,b.y)){ b.x=ox; b.y=oy; } } b.face=turnTo(b.face,a,6*dt); b.wait=0; }
    else { b.wait=(b.wait||0)+dt; if(b.wait>2.5){ b.wait=0; evSay(b,S('Peep! PEEP!','Peep! PEEP!')); } }
    if(dist(p.x,p.y,M.x,M.y)<480&&!E.d.called){ E.d.called=true; evSay(M,S('SKREEE!','SKREEE!')); }
    if(dist(b.x,b.y,M.x,M.y)<95){ E.phase='talk'; EV.pipGo=null; M.mark=null; evTalk(E,'win',()=>{ evGive({coins:30,treat:G.flags.pip?1:0}); E.d.fly=true; evEnd(E,true); }); return; }
    if(E.limit&&E.actT>E.limit){ EV.pipGo=null; evQuit(E); } }
};
EVD.drake2={min:'lore',kind:'kind',chain:true,w:c=>evN('drake')&&!evN('drake2')&&evAgo('drake')>900&&c.b!==4?4:0,spot:()=>evSpot({rad:22,min:200,max:320}),
  setup(E,at){ E.main=E.add({k:'young',x:at.x,y:at.y,face:angTo(at.x,at.y,player.x,player.y),t:0,z:140,id:'ev_drake',bdy:-44}); E.main.use={text:()=>S('Say hello','Say hello'),fn:()=>EVD.drake2.talk(E)}; },
  tick(E,dt){ const m=E.main; m.t+=dt; if(E.d.fly){ m.z+=dt*110; m.alpha=clamp(1-m.z/260,0,1); } else if(m.z>0){ m.z=Math.max(0,m.z-dt*120); if(m.z===0&&!E.d.landed){ E.d.landed=true; shake(3); SFX.play('roll'); } } },
  talk(E){ E.main.use=null; evTalk(E,'meet',()=>{ if(!G.flags.ev_drake2_bless){ G.flags.ev_drake2_bless=true; evGive({bless:1}); } else evGive({coins:30}); E.d.fly=true; evEnd(E,true); }); }
};
// ---------- The Fishing Contest
EVD.fish={min:'lore',kind:'kind',w:c=>c.day&&c.water?(c.lake<1300?2.6:1.6):0,spot:()=>evShore(),
  setup(E,at){ E.main=E.add(evNpc('ev_bess',at.x,at.y,{face:at.wa})); E.main.use=evTalkTo(E.main);
    let sp=null; for(const s of [1,-1]){ const b=at.wa+s*Math.PI/2, x=at.x+Math.cos(b)*80, y=at.y+Math.sin(b)*80; if(!evWaterAt(x,y)&&freeSpot(x,y,14)){ sp={x,y}; break; } }
    E.spot=E.add({k:'fspot',x:(sp||at).x,y:(sp||at).y,hide:true,ground:true}); E.d.wa=at.wa; },
  talk(E){ if(E.phase==='act') return; evTalk(E,'meet',()=>{ if(E.plan!=='fish'){ evEnd(E,false); return; }
    if(!G.items.rod){ G.items.rod=1; E.d.lent=true; } E.d.f0=G.stats.fish||0; E.d.b=0; E.d.bt=[rand(19,25),rand(42,50)]; E.spot.hide=false; E.spot.mark='!';
    E.spot.use={text:()=>S('Fish here for the contest','Fish here'),fn:()=>{ startFishing({x:E.spot.x,y:E.spot.y}); }}; evAct(E,75);
    setBanner(S('The Fishing Contest','The Fishing Contest'),S('First to catch two fish wins.','Catch two fish first!'),2.4); }); },
  abort(E){ if(E.d.lent&&!E.d.won){ delete G.items.rod; } if(E.phase==='act') G.fishing=null; },
  act(E){ const mine=(G.stats.fish||0)-E.d.f0;
    if(E.d.b<2&&E.actT>E.d.bt[E.d.b]){ E.d.b++; evSay(E.main,E.d.b===1?S('Got one! That\'s one for Bess!','I got one!'):S('Two! TWO! Bess wins!','Two! I win!')); G.ripples.push({x:E.main.x+Math.cos(E.d.wa)*60,y:E.main.y+Math.sin(E.d.wa)*60,t:0,max:0.8,r:18,splash:true}); SFX.play('hit'); }
    if(E.d.ash!==mine){ E.d.ash=mine; if(mine>0&&mine<2) setBanner(S(`You: ${mine}  Bess: ${E.d.b}`,`You: ${mine}  Bess: ${E.d.b}`),'',1.4); }
    if(mine>=2){ E.phase='talk'; E.d.won=true; G.fishing=null; evTalk(E,'win',()=>{ if(!G.flags.perk_lure){ G.flags.perk_lure=true; setBanner(S('The Golden Bobber','The Golden Bobber'),S('Fish bite faster now.','Fish bite faster now.'),2.2); } else evGive({coins:40}); evEnd(E,true); }); }
    else if(E.d.b>=2||(E.limit&&E.actT>E.limit)){ E.phase='talk'; G.fishing=null; evTalk(E,'lose',()=>{ giveItems({fish:1}); if(E.d.lent){ delete G.items.rod; setBanner(S('Bess takes her rod back','Bess takes her rod back'),'',1.6); } evEnd(E,true); }); } }
};
// ---------- The Show Must Go On
EVD.show={min:'lore',kind:'funny',w:c=>c.road<260&&(c.b===0||c.b===2)?(c.dusk?2.6:1.3):0,spot:()=>evSpot({road:false,rad:40,clear:80,min:260,max:380}),
  setup(E,at){ E.stage=E.add({k:'stage',x:at.x,y:at.y,r:42,push:true,face:Math.PI/2});
    E.main=E.add(evNpc('ev_fizz',at.x+70,at.y+30)); E.main.use=evTalkTo(E.main);
    E.clank=E.add(evNpc('ev_clank',at.x-22,at.y-6,{face:0}));
    E.torches=[E.add({k:'torch',x:at.x-46,y:at.y+18,fire:true,lit:false,heat:0}),E.add({k:'torch',x:at.x+46,y:at.y+18,fire:true,lit:false,heat:0})];
    const looks=[{shirt:'#6a4a8a',hair:'#2a1a10'},{shirt:'#3a6a8a',hair:'#b8a070',hat:'straw'},{shirt:'#8a5a3a',hair:'#1a1a1a'},{shirt:'#5a7a3a',hair:'#8a3a1a',hat:'cap',hatc:'#c84a3a'}];
    E.crowd=[]; for(let i=0;i<4;i++){ const n=mkNPC({id:'ev_crowd'+i,name:'Audience',look:Object.assign({skin:pick(['#f6dbc6','#e0ae88','#b98058','#7c4c30']),outfit:'tunic'},looks[i])},at.x-54+i*36,at.y+96+(i%2)*14); n.k='npc'; n.face=-Math.PI/2; n.crowd=true; E.crowd.push(E.add(n)); } },
  talk(E){ if(E.phase==='act') return; evTalk(E,'meet',()=>{ if(E.plan!=='show'){ evEnd(E,false); return; }
    const p=player; E.stage.push=false; p.x=E.stage.x+14; p.y=E.stage.y+8; p.facing=Math.PI/2; E.d.cheer=0; for(const c of E.crowd) c.cheer=1;
    evTalk(E,'perform',()=>{ evAct(E,30); setBanner(S('The big finish!','The big finish!'),S('Light both stage torches with your fire breath.','Light the two torches!'),2.4); }); }); },
  fire(E,o,dt){ if(E.phase!=='act'||o.k!=='torch'||o.lit) return; o.heat+=dt; if(o.heat>0.45){ o.lit=true; SFX.play('pickup'); emit(o.x,o.y-26,16,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:20,smax:80,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:5}); if(E.torches.every(t=>t.lit)){ E.phase='talk'; for(const c of E.crowd) c.cheer=3; later(0.6,()=>{ if(EV.E===E) evWin(E,'win',{coins:15+5*(E.d.cheer||0)}); }); } } },
  act(E){ if(E.limit&&E.actT>E.limit) evQuit(E,{coins:5}); }
};
// ---------- Snowball Ambush
EVD.snow={min:'lore',kind:'exciting',selfCall:true,w:c=>c.b===5&&!c.night?3:0,spot:()=>evSpot({road:false,rad:26,clear:50,min:300,max:420}),
  setup(E,at){ const a=angTo(player.x,player.y,at.x,at.y), px=-Math.sin(a), py=Math.cos(a); E.forts=[]; E.kids=[];
    const ids=['ev_juno','ev_pim','ev_mopsy'];
    for(let i=0;i<3;i++){ const k=i-1, fx=at.x+px*k*80+Math.cos(a)*Math.abs(k)*-20, fy=at.y+py*k*80+Math.sin(a)*Math.abs(k)*-20;
      E.forts.push(E.add({k:'fort',x:fx,y:fy,r:20,fire:true,melt:0,face:a+Math.PI,push:true}));
      E.kids.push(E.add(evNpc(ids[i],fx+Math.cos(a)*30,fy+Math.sin(a)*30,{face:a+Math.PI,throwT:rand(0.4,1.4),bdy:-36}))); }
    E.main=E.kids[0]; E.main.mark='!'; },
  tick(E,dt){ if(E.phase==='wait'&&dist(player.x,player.y,E.main.x,E.main.y)<300){ evSay(E.main,EVS.snow.call()); E.main.mark=null; evAct(E,60); setBanner(S('Snowball ambush!','Snowball fight!'),S('Melt their three snow forts with fire breath!','Melt their snow forts with fire!'),2.6); } },
  act(E,dt){ const p=player;
    E.kids.forEach((kd,i)=>{ const f=E.forts[i]; kd.face=angTo(kd.x,kd.y,p.x,p.y); if(f.melt>=1) return; kd.throwT-=dt; if(kd.throwT<=0&&dist(kd.x,kd.y,p.x,p.y)<520){ kd.throwT=rand(1.1,1.8); const lead=0.5, tx=p.x+(p.moving?Math.cos(p.facing)*60*lead:0), ty=p.y+(p.moving?Math.sin(p.facing)*60*lead:0); EV.fx.push({k:'snowball',x0:kd.x,y0:kd.y-16,x1:tx+rand(-14,14),y1:ty+rand(-10,10),t:0,dur:0.75}); } });
    if(E.forts.every(f=>f.melt>=1)){ E.phase='talk'; later(0.5,()=>{ if(EV.E!==E) return; for(const k of E.kids){ k.face=angTo(k.x,k.y,p.x,p.y); } evWin(E,'win',{heal:true,coins:10}); }); }
    else if(E.limit&&E.actT>E.limit) evQuit(E,{heal:true}); },
  fire(E,o,dt){ if(o.k!=='fort'||o.melt>=1) return; if(E.phase==='wait'){ EVD.snow.tick(E,0); } o.melt+=dt/0.9; if(Math.random()<0.6) emit(o.x+rand(-14,14),o.y-rand(0,14),1,{col:'235,240,255',glow:false,ang:-Math.PI/2,spread:0.5,smin:15,smax:50,lmin:.6,lmax:1.1,zmin:3,zmax:7,grow:8}); if(o.melt>=1){ o.push=false; SFX.play('pop'); emit(o.x,o.y,20,{col:'230,240,255',glow:false,smin:30,smax:120,lmin:.4,lmax:.8,zmin:2,zmax:5}); const kd=E.kids[E.forts.indexOf(o)]; if(kd) evSay(kd,pick([S('Hey! My fort!','Hey! My fort!'),S('NOOO! It was perfect!','Nooo!'),S('Retreat! RETREAT!','Run away!')])); } }
};
// ---------- The Runaway Cheese
EVD.cheese={min:'lore',kind:'exciting',selfCall:true,w:c=>c.day&&(c.b===0||c.b===5)?(c.farm<2600?2.4:1.2):0,spot:()=>evSpot({road:false,rad:30,clear:70,min:300,max:400}),
  setup(E,at){ E.main=E.add(evNpc('ev_chuck',at.x,at.y)); E.wheel=E.add({k:'wheel',x:at.x+26,y:at.y+10,r:13,roll:0,dir:0,sp:0,hit:true}); E.main.mark='!'; },
  tick(E,dt){ const w=E.wheel, p=player;
    if(E.phase==='wait'&&dist(p.x,p.y,E.main.x,E.main.y)<380){ E.main.mark=null; evSay(E.main,EVS.cheese.call()); let a=angTo(p.x,p.y,w.x,w.y); w.dir=a; w.sp=215; evAct(E,30); setBanner(S('The Runaway Cheese!','The Runaway Cheese!'),S('Catch that cheese wheel before it gets away!','Catch the cheese!'),2.4); } },
  act(E,dt){ const w=E.wheel, p=player;
    if(w.sp>0){
      const ox=w.x, oy=w.y; w.x+=Math.cos(w.dir)*w.sp*dt; w.y+=Math.sin(w.dir)*w.sp*dt; w.roll+=w.sp*dt/13;
      if(blockedAt(w.x,w.y)||colAt(w.x,w.y,10)){ w.x=ox; w.y=oy; w.dir+=Math.PI*rand(0.5,1.5); }
      if(Math.random()<dt*0.8) w.dir+=rand(-0.5,0.5);
      if(E.actT>12) w.sp=Math.max(0,w.sp-dt*12);
      if(Math.random()<0.3) emit(w.x,w.y+8,1,{col:'140,120,80',glow:false,smin:10,smax:40,lmin:.3,lmax:.6,zmin:1,zmax:2});
      if(dist(p.x,p.y,w.x,w.y)<30||((p.z||0)>6&&dist(p.x,p.y,w.x,w.y)<40)) evCheeseCaught(E);
      else if(E.limit&&E.actT>E.limit){ w.sp=0; E.phase='talk'; evQuit(E,{heal:30}); }
    } else if(E.d.caught){
      const d=dist(p.x,p.y,w.x,w.y); if(d>34){ const a=angTo(w.x,w.y,p.x,p.y), mv=Math.min(d-30,p.sprinting?320*dt:220*dt); w.x+=Math.cos(a)*mv; w.y+=Math.sin(a)*mv; w.roll+=mv/13; w.dir=a; }
      if(dist(w.x,w.y,E.main.x,E.main.y)<80){ E.phase='talk'; E.d.caught=false; evWin(E,'win',{heal:true,coins:20}); }
    } },
  hit(E,o){ if(o===E.wheel&&E.phase==='act'&&o.sp>0) evCheeseCaught(E); }
};
function evCheeseCaught(E){ const w=E.wheel; w.sp=0; E.d.caught=true; shake(3); SFX.play('hit'); E.main.mark='?'; setBanner(S('Got it!','Got it!'),S('Roll the cheese back to Cheddar Chuck.','Take the cheese back to Chuck.'),2.2); }
// ---------- The Sleepy Bear
EVD.bear={min:'lore',kind:'spooky',w:c=>c.b===1||c.b===5?1.4:0,spot:()=>evSpot({road:false,rad:30,clear:40}),
  setup(E,at){ E.bear=E.add({k:'bear',x:at.x,y:at.y,r:26,face:rand(0,TAU),sleep:true,push:true,t:0});
    E.basket=E.add({k:'basket',x:at.x+Math.cos(E.bear.face+1.2)*30,y:at.y+Math.sin(E.bear.face+1.2)*30+6});
    const q=evNear(at.x,at.y,150,190,{rad:16})||{x:at.x-160,y:at.y+60}; E.main=E.add(evNpc('ev_pud',q.x,q.y)); E.main.use=evTalkTo(E.main); },
  talk(E){ if(E.phase==='act') return; evTalk(E,'meet',()=>{ const p=E.plan; if(!p) return;
    if(p==='honey'){ E.bear.sleep=false; E.bear.away=true; } else if(p==='lullaby'){ E.bear.roll=1; const a=E.bear.face+Math.PI; E.bear.x+=Math.cos(a)*34; E.bear.y+=Math.sin(a)*34; }
    evBasketUse(E); evAct(E,120); if(p==='sneak') setBanner(S('Quiet now...','Shh!'),S('Walk slowly to the basket. No running, rolling or jumping near the bear.','Walk slowly. No running!'),2.6); }); },
  tick(E,dt){ const b=E.bear; b.t+=dt; if(b.away){ b.lt=(b.lt||0)+dt; const a=b.face; b.x+=Math.cos(a)*40*dt; b.y+=Math.sin(a)*40*dt; b.alpha=clamp(1-(b.lt-1.5)/2,0,1); b.moving=true; } },
  act(E,dt){ const b=E.bear, p=player;
    if(E.plan==='sneak'&&b.sleep&&!EV.carry&&dist(p.x,p.y,b.x,b.y)<150&&(p.sprinting||p.dashT>0||(p.z||0)>6)){ b.sleep=false; E.d.woke=true; E.phase='talk'; evTalk(E,'woke',()=>{ b.away=true; E.phase='act'; }); }
    if(E.limit&&E.actT>E.limit&&!EV.carry) evEnd(E,false); }
};
function evBasketUse(E){ E.basket.use={text:()=>S('Grab the picnic basket','Grab the basket'),fn:()=>{ E.basket.hide=true; E.basket.use=null; SFX.play('pickup'); E.main.mark='?'; EV.carry={k:'basket',to:E.main,give:S('Give back the picnic basket','Give back the basket'),fn:()=>{ EV.carry=null; E.basket.hide=false; E.basket.x=E.main.x+20; E.basket.y=E.main.y+12; evWin(E,'win',E.d.woke?{heal:true,coins:8}:{heal:true,coins:20}); }}; }}; }
// ---------- Firefly Night
EVD.flies={min:'lore',kind:'kind',w:c=>c.night&&!c.rain&&[0,1,6].includes(c.b)?2.2:0,spot:()=>evSpot({rad:24}),
  setup(E,at){ E.main=E.add(evNpc('ev_lumi',at.x,at.y)); E.main.use=evTalkTo(E.main); E.flies=[]; for(let i=0;i<5;i++){ const f=evNear(at.x,at.y,60,220,{rad:10})||{x:at.x+rand(-160,160),y:at.y+rand(-160,160)}; E.flies.push(E.add({k:'fly',x:f.x,y:f.y,vx:0,vy:0,ph:rand(0,TAU),ground:false})); } },
  talk(E){ if(E.phase==='act') return; evTalk(E,'meet',()=>{ if(E.plan!=='catch'){ evEnd(E,false); return; } E.d.got=0; evAct(E,60); setBanner(S('Catch the fireflies','Catch the fireflies'),S('Walk into them. Five for the jar.','Walk into 5 fireflies.'),2.2); }); },
  act(E,dt){ const p=player;
    for(const f of E.flies){ if(f.gone) continue;
      if(f.home){ f.x+=(E.main.x-f.x)*Math.min(1,dt*5); f.y+=(E.main.y-12-f.y)*Math.min(1,dt*5); if(dist(f.x,f.y,E.main.x,E.main.y-12)<6) f.gone=true; continue; }
      const d=dist(p.x,p.y,f.x,f.y); if(d<110){ const a=angTo(p.x,p.y,f.x,f.y); f.vx+=Math.cos(a)*90*dt; f.vy+=Math.sin(a)*90*dt; }
      f.vx+=rand(-60,60)*dt+(E.main.x-f.x)*0.05*dt; f.vy+=rand(-60,60)*dt+(E.main.y-f.y)*0.05*dt; const v=Math.hypot(f.vx,f.vy); if(v>70){ f.vx*=70/v; f.vy*=70/v; }
      f.x+=f.vx*dt; f.y+=f.vy*dt;
      if(d<26){ f.home=true; E.d.got++; SFX.play('pickup'); ftext(f.x,f.y-16,`${E.d.got}/5`,'#e8ff9a',13); } }
    if(E.d.got>=5){ E.phase='talk'; later(0.5,()=>{ if(EV.E===E) evTalk(E,'done',()=>evEnd(E,true)); }); }
    else if(E.limit&&E.actT>E.limit) evQuit(E); }
};
function evFliesReward(E,keep){ if(keep){ if(!G.items.lantern){ G.items.lantern=1; E.d.gotLantern=true; setBanner(S('Firefly lantern','Firefly lantern'),S('Caves will be much brighter now.','Caves are brighter now.'),2.4); } else evGive({coins:15}); } else { evGive({coins:10}); for(let i=0;i<5;i++) EV.fx.push({k:'heart',t:-i*0.1,x:E.main.x,y:E.main.y-20,i}); } }
// ---------- Trouble on the Road
EVD.raid={min:'lore',kind:'exciting',selfCall:true,w:c=>[0,1,2,6].includes(c.b)&&c.road<420?1.1:0,spot:()=>evSpot({rad:30,clear:60,min:320,max:440}),
  setup(E,at){ E.main=E.add(evNpc('ev_thimble',at.x,at.y)); E.main.mark='!';
    const list=!G.bossDone.grizzlefang?[['kobold',3]]:!G.bossDone.morrow?[['kobold',2],['cultist',1]]:[['cultist',2],['kobold',1]];
    evFoes(E,list,at.x,at.y,{r0:40,r1:80,aggro:false}); },
  tick(E,dt){ if(E.phase==='wait'&&dist(player.x,player.y,E.main.x,E.main.y)<300){ E.main.mark=null; evSay(E.main,EVS.raid.call()); for(const f of E.foes) f.aggro=true; evAct(E,0); } },
  act(E){ if(evFoesLeft(E)<=0){ E.phase='talk'; later(0.8,()=>{ if(EV.E!==E) return; evTalk(E,'win',()=>{ if(!G.flags.ev_scarf){ G.flags.ev_scarf=true; evGive({maxhp:5,heal:true}); } else evGive({coins:20,heal:true}); evEnd(E,true); }); }); } }
};
// ---------- The Frog Choir
EVD.frogs={min:'lore',kind:'funny',w:c=>(c.b===6||c.water)&&(c.night||c.rain||c.dusk)?2.4:0,spot:()=>evShore()||evSpot({rad:30}),
  setup(E,at){ const a=at.wa!=null?at.wa:rand(0,TAU); E.frogs=[]; for(let i=0;i<5;i++){ const b=a+(i-2)*0.42, r=58; E.frogs.push(E.add({k:'frog',x:at.x+Math.cos(b)*r,y:at.y+Math.sin(b)*r,face:b+Math.PI,t:rand(0,9),croak:0,z:0,s:i===2?0.75:1})); }
    E.main=E.add({k:'frog',x:at.x+Math.cos(a)*14,y:at.y+Math.sin(a)*14,face:a+Math.PI,lord:true,t:0,croak:0,z:0,s:1.6,id:'ev_croak',bdy:-30}); E.main.use={text:()=>S('Talk to Lord Croakington','Talk to the frog king'),fn:()=>EVD.frogs.talk(E)}; },
  tick(E,dt){ for(const f of E.frogs.concat([E.main])){ f.t+=dt; f.croak=Math.max(0,f.croak-dt*2); if(Math.random()<dt*(E.phase==='talk'?1.2:0.25)){ f.croak=1; if(E.phase!=='talk'&&Math.random()<0.4) ftext(f.x,f.y-14,S('ribbit','ribbit'),'#c8f0a0',10); } } },
  talk(E){ E.main.use=null; evTalk(E,'meet',()=>{ evGive({coins:10+3*(E.d.score||0),heal:true}); evEnd(E,true); }); }
};

// ================= Tikka's meetings (tk1..tk5 are events the director prefers once each becomes possible)
const TK=n=>(G.flags.tk_n|0)===n;
function tkW(c,ok){ return ok?9:0; }
function tkKob(x,y,o){ return Object.assign({k:'kob',x,y,face:Math.PI/2,t:rand(0,9),kk:0.9,scarf:'#c84a3a',id:'ev_tikka',bdy:-36},o||{}); }
EVD.tk1={min:'lore',tk:true,selfCall:true,kind:'kind',w:c=>tkW(c,TK(0)&&(c.b===0||c.b===1)),spot:()=>evSpot({road:false,rad:26,min:260,max:380}),
  setup(E,at){ E.bush=E.add({k:'bush',x:at.x,y:at.y,shake:1}); E.kob=E.add(tkKob(at.x,at.y-6,{hide:true,loaf:true})); E.main=E.bush; E.bush.use={text:()=>S('Look in the shaking bush','Look in the bush'),fn:()=>EVD.tk1.talk(E)}; E.bush.mark='?'; E.d.callT=1.2; },
  tick(E,dt){ if(E.phase==='wait'){ E.d.callT-=dt; if(E.d.callT<=0){ E.d.callT=rand(5,8); evSay(E.bush,TKS.tk1.call()); } } },
  talk(E){ E.bush.use=null; E.bush.mark=null; E.bush.shake=0; E.kob.hide=false; E.kob.y=E.bush.y+22; E.kob.scared=1; E.kob.face=angTo(E.kob.x,E.kob.y,player.x,player.y);
    evTalk(E,'meet',()=>{ if(E.plan==='fight'){ const a=angTo(player.x,player.y,E.bush.x,E.bush.y), x=E.bush.x+Math.cos(a)*230, y=E.bush.y+Math.sin(a)*230; evFoes(E,[['kobold',3]],x,y,{r0:10,r1:60,aggro:true}); evAct(E,0); setBanner(S('Protect Tikka!','Protect Tikka!'),S('Drive off the kobold patrol.','Beat the kobold soldiers.'),2.2); }
      else { evTkBye(E); } }); },
  act(E){ if(E.foes&&evFoesLeft(E)<=0){ E.phase='talk'; later(0.8,()=>{ if(EV.E===E) evTkBye(E); }); } }
};
function evTkBye(E){ E.kob.scared=0; evTalk(E,'bye',()=>{ G.flags.tk_n=Math.max(G.flags.tk_n|0,1); E.kob.leave={a:rand(-0.4,0.4)}; evEnd(E,true); }); }
EVD.tk2={min:'warcamp',tk:true,selfCall:true,kind:'kind',w:c=>tkW(c,TK(1)&&(c.lake<1500||(c.b===0&&player.x>3800))),spot:()=>evSpot({road:false,rad:28,clear:40}),
  setup(E,at){ E.oven=E.add({k:'oven',x:at.x+26,y:at.y-4,fire:true,heat:0,lit:false,push:true,r:16}); E.main=E.add(tkKob(at.x-16,at.y+12,{apron:true,face:0})); E.main.use={text:()=>S('Talk to Tikka','Talk to Tikka'),fn:()=>EVD.tk2.talk(E)}; E.d.callT=1; },
  tick(E,dt){ if(E.phase==='wait'){ E.d.callT-=dt; if(E.d.callT<=0){ E.d.callT=rand(6,9); evSay(E.main,TKS.tk2.call()); } } if(E.oven.lit&&Math.random()<dt*3) emit(E.oven.x,E.oven.y-20,1,{col:'170,160,150',glow:false,ang:-Math.PI/2,spread:0.3,smin:10,smax:30,lmin:1,lmax:1.6,zmin:3,zmax:6,grow:6}); },
  talk(E){ if(E.phase==='act') return; evTalk(E,'meet',()=>{ evAct(E,60); setBanner(S('Light the oven','Light the oven'),S('Breathe fire on it. Gently!','Breathe fire on it. Gently!'),2.2); }); },
  fire(E,o,dt){ if(o!==E.oven||E.phase!=='act') return; o.heat+=dt; if(!o.lit&&o.heat>0.8){ o.lit=true; o.litT=G.time; SFX.play('pickup'); emit(o.x,o.y-10,16,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:20,smax:80,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:5}); } if(o.heat>2.6) E.d.burnt=true; },
  act(E){ const o=E.oven; if(o.lit&&G.time-o.litT>1.6&&!player.breathing){ E.phase='talk'; evTalk(E,'bake',()=>{ G.flags.tk_n=Math.max(G.flags.tk_n|0,2); evEnd(E,true); }); } else if(E.limit&&E.actT>E.limit&&!o.lit) evEnd(E,false); }
};
EVD.tk3={min:'oath',tk:true,selfCall:true,kind:'exciting',w:c=>tkW(c,TK(2)&&(c.b===2||dist(player.x,player.y,POI.way.x,POI.way.y)<1600)),spot:()=>evSpot({rad:26,min:260,max:380}),
  setup(E,at){ E.main=E.add(tkKob(at.x,at.y,{robe:true})); E.main.use={text:()=>S('Talk to the very short cultist','Talk to the tiny cultist'),fn:()=>EVD.tk3.talk(E)}; E.main.mark='?'; E.d.callT=1; },
  tick(E,dt){ const m=E.main; if(E.phase==='wait'){ E.d.callT-=dt; if(E.d.callT<=0){ E.d.callT=rand(6,9); evSay(m,TKS.tk3.call()); m.trip=0.5; } } if(m.trip>0) m.trip-=dt; },
  talk(E){ E.main.mark=null; evTalk(E,'meet',()=>{ const a=rand(0,TAU), x=E.main.x+Math.cos(a)*240, y=E.main.y+Math.sin(a)*240; evFoes(E,[['cultist',2],['kobold',1]],x,y,{r0:10,r1:60,aggro:true}); evAct(E,0); setBanner(S('Help Tikka!','Help Tikka!'),S('The cultists think she is one of them.','Stop the cultists!'),2.2); }); },
  act(E){ if(E.foes&&evFoesLeft(E)<=0){ E.phase='talk'; later(0.8,()=>{ if(EV.E!==E) return; evTalk(E,'bye',()=>{ G.flags.tk_n=Math.max(G.flags.tk_n|0,3); E.main.leave={a:rand(-0.5,0.5)}; evEnd(E,true); }); }); } }
};
EVD.tk4={min:'three',tk:true,selfCall:true,kind:'kind',w:c=>tkW(c,TK(3)&&!!G.bossDone.morrow&&c.b!==2),spot:()=>evSpot({rad:30,clear:50}),
  setup(E,at){ E.main=E.add(tkKob(at.x,at.y,{apron:true})); E.main.use={text:()=>S('Talk to Tikka','Talk to Tikka'),fn:()=>EVD.tk4.talk(E)}; E.main.mark='!';
    const cols=['#4a8ac8','#8ac84a','#c88ae0']; E.kids=[]; for(let i=0;i<3;i++) E.kids.push(E.add(tkKob(at.x+30+i*22,at.y+20+(i%2)*12,{kk:0.66,scarf:cols[i],id:i?'ev_kob'+i:'ev_tock',hop:rand(0,3)})));
    E.d.callT=0.8; },
  tick(E,dt){ if(E.phase==='wait'){ E.d.callT-=dt; if(E.d.callT<=0){ E.d.callT=rand(6,9); evSay(E.main,TKS.tk4.call()); } } },
  talk(E){ E.main.mark=null; evTalk(E,'meet',()=>{ G.flags.tk_n=Math.max(G.flags.tk_n|0,4); const home=G.flags.tk_home, P=home==='baker'?POI.village:home==='farm'?POI.farm:POI.mosshut, a=angTo(E.main.x,E.main.y,P.x,P.y); for(const k of [E.main].concat(E.kids)) k.leave={a,abs:true}; evEnd(E,true); }); }
};
EVD.tk5={min:'gate',tk:true,selfCall:true,kind:'brave',w:c=>tkW(c,TK(4)&&!G.flags.act1_done&&!G.bossDone.vorlaxis),spot:()=>evSpot({rad:26,min:240,max:360}),
  setup(E,at){ E.main=E.add(tkKob(at.x,at.y,{pack:true,lid:true,spoon:true})); E.main.use={text:()=>S('Talk to Tikka','Talk to Tikka'),fn:()=>EVD.tk5.talk(E)}; E.main.mark='!'; E.d.callT=0.8; },
  tick(E,dt){ if(E.phase==='wait'){ E.d.callT-=dt; if(E.d.callT<=0){ E.d.callT=rand(6,9); evSay(E.main,TKS.tk5.call()); } } },
  talk(E){ E.main.mark=null; evTalk(E,'meet',()=>{ G.flags.tk_n=Math.max(G.flags.tk_n|0,5); evGive({heal:true,pots:true}); E.main.leave={a:rand(-0.4,0.4)}; evEnd(E,true); }); }
};

// ================= the director
function evCtx(){ const p=player, s=T(p.x,p.y,{}); return {b:s.b,road:s.roadD,night:isNight(),day:isDay(),dusk:G.tod>0.68&&G.tod<0.84,dawn:G.tod>0.17&&G.tod<0.3,rain:G.rainK>0.45&&p.y>WALL_Y,water:evNearWater(p.x,p.y,520),lake:dist(p.x,p.y,LAKE.x,LAKE.y),farm:dist(p.x,p.y,POI.farm.x,POI.farm.y)}; }
function evExploring(){
  const p=player;
  if(G.mode!=='story'||scene!=='play'||AREA||!p||p.dead) return false;
  if(G.inCombat||G.mini||G.fishing||G.fightSite||(G.boss&&!G.boss.dead)||G.pendingBless>0) return false;
  if(!reached('lore')||G.stage==='raid') return false;
  if(evInTown(p.x,p.y,0.85)||evNearSite(p.x,p.y,300)) return false;
  return true;
}
function evTkDue(){ for(const k of ['tk1','tk2','tk3','tk4','tk5']){ const d=EVD[k]; if(reached(d.min)&&TK(+k[2]-1)) return k; } return null; }
function evPick(c){
  const cand=[]; let tot=0;
  for(const id in EVD){ const d=EVD[id]; if(!reached(d.min)) continue; let w=0; try{ w=d.w(c)||0; }catch(e){ w=0; } if(w<=0) continue; if(!d.tk&&!d.chain) w*=evRep(id); cand.push([id,w]); tot+=w; }
  const out=[]; while(cand.length){ let r=Math.random()*tot, i=0; for(;i<cand.length-1;i++){ r-=cand[i][1]; if(r<=0) break; } const [id,w]=cand.splice(i,1)[0]; tot-=w; out.push(id); }
  return out;
}
function evStart(id,force){
  const d=EVD[id]; if(!d) return false;
  if(EV.E) evClear(EV.E);
  let at=null; try{ at=d.spot?d.spot():evSpot({}); }catch(e){ at=null; }
  if(!at&&!force) return false;
  if(!at){ const p=player; at={x:p.x+Math.cos(p.facing)*300,y:p.y+Math.sin(p.facing)*300,wa:p.facing}; }
  const E={id,def:d,tk:!!d.tk,t:0,phase:'wait',ents:[],d:{},plan:null,x:at.x,y:at.y,main:null,actT:0,limit:0};
  E.add=o=>{ o.t=o.t||0; E.ents.push(o); return o; };
  d.setup(E,at); EV.E=E;
  if(E.main&&!E.main.mark&&E.main.use) E.main.mark='!';
  const src=E.tk?TKS[id]:EVS[id];
  if(src&&src.call&&E.main&&!d.selfCall) later(0.9,()=>{ if(EV.E===E&&E.phase==='wait') evSay(E.main,src.call()); });
  if(G.pip) later(2.2,()=>{ if(EV.E===E&&E.phase==='wait'&&G.pip){ bubble(G.pip,S('Mip! (Pip has spotted something.)','Mip! (Pip sees something!)'),{kind:'pip',dy:-22}); csfx('chirp'); } });
  EV.hist.push({id,t:Math.round(G.time),x:Math.round(at.x),y:Math.round(at.y),stage:G.stage,tod:+G.tod.toFixed(2),b:T(at.x,at.y,{}).b});
  if(EV.hist.length>60) EV.hist.shift();
  return true;
}
function evEnd(E,ok){
  if(!E||E.phase==='leave') return;
  E.phase='leave'; E.leaveT=0;
  if(E.foes) for(const f of E.foes) if(!f.dead&&!ok){ f.dead=true; }
  if(EV.carry) EV.carry=null; EV.pipGo=null;
  if(ok){ const k='ev_'+E.id; G.flags[k]=(G.flags[k]|0)+1; G.flags[k+'_t']=Math.round(G.worldTime); deed(k); gainXp(20+8*evLevel(E.x,E.y)); }
  EV.lastEnd=G.time; EV.free=0; EV.gap=rand(170,280);
  for(const o of E.ents){ o.use=null; o.mark=null; o.hit=false; o.fire=false; o.push=false; }
  if(!ok&&E.def.abort) try{ E.def.abort(E); }catch(e){}
  saveGame();
}
function evClear(E){ if(!E) return; if(E.foes) for(const f of E.foes) if(!f.dead) f.dead=true; EV.carry=null; EV.pipGo=null; if(EV.E===E) EV.E=null; }
function updateEvents(dt){
  if(!G||G.mode!=='story') return;
  if(EV.g!==G) evReset();
  if(!player) return;
  evFx(dt); evAlly(dt);
  if(scene!=='play') return;
  const E=EV.E, p=player;
  if(E){
    E.t+=dt; if(E.phase==='act') E.actT+=dt;
    for(const o of E.ents){ o.t=(o.t||0)+dt; if(o.jolt>0) o.jolt-=dt; if(o.snap>0) o.snap-=dt; if(o.k==='npc'||o.k==='kob'){ evPersonTick(E,o,dt); } if(o.push&&!o.hide) evPushOut(o); }
    try{ if(E.def.tick) E.def.tick(E,dt); if(E.phase==='act'&&E.def.act) E.def.act(E,dt); }catch(err){ console.warn('event',E.id,err); evEnd(E,false); }
    if(E.phase==='leave'){ E.leaveT+=dt; for(const o of E.ents){ if(o.leave) evLeaveStep(o,dt); } if(E.leaveT>2.6){ evClear(E); } }
    // walked away, or something bigger is happening: the moment passes quietly
    else if(dist(p.x,p.y,E.x,E.y)>(E.phase==='act'?1500:1200)||G.fightSite||(G.boss&&!G.boss.dead&&!E.foes)){ evEnd(E,false); }
    else if(E.phase==='wait'&&E.t>150) evEnd(E,false);
  }
  evPrompts();
  // the director: count time spent exploring freely; start something when it has been a while
  if(!EV.E&&G.time-EV.lastEnd>60&&evExploring()){
    EV.free+=dt; const due=evTkDue();
    if(EV.free>=(due?Math.min(EV.gap,75):EV.gap)){
      const c=evCtx(); let ok=false;
      for(const id of evPick(c)){ if(evStart(id)){ ok=true; break; } }
      if(ok){ EV.free=0; EV.gap=rand(170,280); } else EV.free=Math.max(0,EV.gap-20);
    }
  }
}
function evPersonTick(E,o,dt){
  const p=player; if(o.crowd){ o.face=-Math.PI/2; if(o.cheer>0&&Math.random()<dt*o.cheer){ o.hopZ=6; } return; }
  if(E.phase==='leave') return;
  const d=dist(o.x,o.y,p.x,p.y);
  if(o.k==='kob'&&o.hop!=null){ o.hop+=dt; }
  if(d<220&&!o.lockFace) o.face=turnTo(o.face,angTo(o.x,o.y,p.x,p.y),4*dt);
  o.moving=false;
}
function evLeaveStep(o,dt){ const L=o.leave, a=L.a!=null&&L.abs?L.a:(L.a0!=null?L.a0:(L.a0=angTo(player.x,player.y,o.x,o.y)+(L.a||0))); const ox=o.x,oy=o.y; o.x+=Math.cos(a)*70*dt; o.y+=Math.sin(a)*70*dt; if(blockedAt(o.x,o.y)){ o.x=ox; o.y=oy; } o.face=turnTo(o.face||0,a,6*dt); o.moving=true; }
function evPushOut(o){ const p=player; if(p.flying||(p.z||0)>10) return; const r=(o.r||20)+p.r*0.7, d=dist(p.x,p.y,o.x,o.y); if(d<r&&d>0.01){ const a=angTo(o.x,o.y,p.x,p.y); p.x=o.x+Math.cos(a)*r; p.y=o.y+Math.sin(a)*r; } }
// prompts for event people and things (and handing over what Ash is carrying)
function evPrompts(){
  if(scene!=='play'||!player||player.dead||player.flying||G.fishing) return;
  const E=EV.E; if(!E||E.phase==='leave'||E.phase==='talk') return;
  const p=player; let best=null, bd=1e9;
  const offer=(d,text,act,x,y)=>{ if(d<bd){ bd=d; best={text,act,x,y}; } };
  for(const o of E.ents){ const u=o.use; if(!u||o.hide||o.gone) continue; if(E.phase==='act'&&o===E.main&&!u.act) continue; const r=u.r||70, d=dist(p.x,p.y,o.x,o.y); if(d<r){ const tx=typeof u.text==='function'?u.text():u.text; offer(d-10,simplify(tx),()=>u.fn(o),o.x,o.y); } }
  const C=EV.carry; if(C&&C.to){ const d=dist(p.x,p.y,C.to.x,C.to.y); if(d<90) offer(d-40,simplify(C.give),()=>{ const f=C.fn; if(f) f(); },C.to.x,C.to.y); }
  if(!best||G.inCombat) return;
  if(G.prompt&&G.prompt.x!=null&&dist(p.x,p.y,G.prompt.x,G.prompt.y)<bd) return;
  G.prompt=best;
}
// fire breath and weapon swings reach event things (wrapping the story's own hooks; every module shares one scope)
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){ base(mx,my,ang,dt); try{ evBreath(mx,my,ang,dt); }catch(e){} }; }
{ const base=swingBreakables; swingBreakables=function(px,py,dir,range,half){ base(px,py,dir,range,half); try{ evSwing(px,py,dir,range,half); }catch(e){} }; }
{ const base=pipExtras; pipExtras=function(q,dt,tgt){ if(EV.pipGo&&!tgt&&EV.g===G) return EV.pipGo; return base(q,dt,tgt); }; }
function evBreath(mx,my,ang,dt){ const E=EV.E; if(AREA||!E||E.phase==='leave'||!E.def.fire) return; for(const o of E.ents){ if(!o.fire||o.hide) continue; if(inArcC(mx,my,ang,175,0.45,{x:o.x,y:o.y,r:o.r||20})) E.def.fire(E,o,dt); } }
function evSwing(px,py,dir,range,half){ const E=EV.E; if(AREA||!E||E.phase==='leave'||!E.def.hit) return; for(const o of E.ents){ if(!o.hit||o.hide) continue; if(o.hitT&&G.time<o.hitT) continue; if(inArcC(px,py,dir,range,half,{x:o.x,y:o.y,r:o.r||16})){ o.hitT=G.time+0.4; E.def.hit(E,o); } } }

// ================= Tikka in the last fight: she comes up the stairs with snacks, throws buns at Ash and bonks drakelings
function evAlly(dt){
  const b=G.boss, F=G.flags;
  if(!b||b.dead||b.type!=='vorlaxis'||AREA){ if(EV.ally&&G.flags.act1_done){ F.tk_helped=true; F.tk_n=Math.max(F.tk_n|0,6); } if(EV.ally&&(!b||b.dead)){ if(G.bossDone&&G.bossDone.vorlaxis){ F.tk_helped=true; F.tk_n=Math.max(F.tk_n|0,6); } EV.ally=null; } return; }
  if(!EV.ally&&F.tk_come==='yes'&&(F.tk_n|0)>=5&&b.hp<b.maxHp*0.62){
    const P=POI.summit; EV.ally={k:'kob',x:P.x+rand(-60,60),y:P.y+430,face:-Math.PI/2,t:0,kk:0.95,scarf:'#c84a3a',apron:true,lid:true,spoon:true,id:'ev_tikka',cd:3,bonk:2,say:8,kids:[]};
    if(F.tk_home&&(F.tk_trust|0)>=3) for(let i=0;i<3;i++) EV.ally.kids.push({k:'kob',x:P.x-60+i*60,y:P.y+470,face:-Math.PI/2,t:rand(0,9),kk:0.66,scarf:['#4a8ac8','#8ac84a','#c88ae0'][i],id:'ev_kob',hop:rand(0,3)});
    taunt('ev_tikka',TKS.fight[0]); SFX.play('quest'); F.tk_helped=true; F.tk_n=Math.max(F.tk_n|0,6);
  }
  const A=EV.ally; if(!A) return;
  const p=player; A.t+=dt; A.cd-=dt; A.bonk-=dt; A.say-=dt;
  const away=angTo(b.x,b.y,p.x,p.y), tx=p.x+Math.cos(away)*120+Math.cos(A.t*0.7)*30, ty=p.y+Math.sin(away)*120+Math.sin(A.t*0.9)*20, d=dist(A.x,A.y,tx,ty);
  if(d>12){ const a=angTo(A.x,A.y,tx,ty), sp=Math.min(d,(d>300?340:200)*dt); A.x+=Math.cos(a)*sp; A.y+=Math.sin(a)*sp; A.face=turnTo(A.face,a,8*dt); A.moving=true; } else { A.moving=false; A.face=turnTo(A.face,angTo(A.x,A.y,p.x,p.y),6*dt); }
  if(A.cd<=0&&!p.dead&&dist(A.x,A.y,p.x,p.y)<420){ A.cd=11; EV.fx.push({k:'bun',x0:A.x,y0:A.y-18,tgt:p,t:0,dur:0.8}); if(A.say<=0){ A.say=rand(10,16); taunt('ev_tikka',pick(TKS.fight.slice(1))); } }
  if(A.bonk<=0){ A.bonk=2.5; const dr=G.enemies.find(e=>!e.dead&&e.type==='drakeling'&&dist(e.x,e.y,A.x,A.y)<150); if(dr){ damageEnemy(dr,28+4*player.level,{src:'pip',fx:A.x,fy:A.y}); csfx('bonk'); ftext(dr.x,dr.y-20,S('BONK!','BONK!'),'#ffe066',13); } }
  for(const k of A.kids){ k.t+=dt; k.hop=(k.hop||0)+dt; if(Math.random()<dt*0.15) bubble(k,pick([S('Go, Ash!','Go, Ash!'),S('Yay!','Yay!'),S('Bread power!','Bread power!')]),{who:'',col:'#e8c86a',dy:-26}); }
}

// ================= little effects: falling-star streaks, snowballs, buns, hearts
function evFx(dt){
  for(let i=EV.fx.length-1;i>=0;i--){ const f=EV.fx[i]; f.t+=dt;
    if(f.k==='streak'){ if(f.t>f.life) EV.fx.splice(i,1); continue; }
    if(f.k==='heart'){ if(f.t>2.2) EV.fx.splice(i,1); continue; }
    if(f.k==='snowball'||f.k==='bun'){ const u=f.t/f.dur; if(u>=1){ EV.fx.splice(i,1);
        const p=player, x=f.tgt?f.tgt.x:f.x1, y=f.tgt?f.tgt.y:f.y1;
        if(f.k==='snowball'){ emit(x,y,10,{col:'240,245,255',glow:false,smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); if(dist(x,y,p.x,p.y)<24&&!p.flying&&(p.z||0)<8){ ftext(p.x,p.y-30,S('SPLAT!','SPLAT!'),'#ffffff',14); p.slowT=Math.max(p.slowT||0,0.4); csfx('pop'); } }
        else { heal(player.maxHp*0.15); emit(p.x,p.y-10,12,{col:'255,210,140',smin:30,smax:100,lmin:.3,lmax:.6,zmin:1.5,zmax:3,rise:10}); csfx('pop'); }
      } } }
}

// ================= dreams from long ago
function dreamFor(st){ for(const id of DREAM_ORDER){ const D=DREAMS[id]; if(D.stages.includes(st)&&!G.flags['dr_seen_'+id]) return id; } return null; }
function dreamHook(kind){
  try{
    if(!G||G.mode!=='story') return;
    const id=dreamFor(G.stage); if(!id) return;
    const k='dr_try_'+id, n=G.flags[k]|0; G.flags[k]=n+1;
    if(n<2&&Math.random()>0.6) return;
    later(1.3,()=>dreamTry(id,0));
  }catch(e){}
}
function dreamTry(id,n){ if(!G||G.flags['dr_seen_'+id]) return; if(scene!=='play'||DLG||G.pendingBless>0||G.inCombat||(G.boss&&!G.boss.dead)){ if(n<12) later(1.0,()=>dreamTry(id,n+1)); return; } dreamStart(id); }
function dreamStart(id){
  const D=DREAMS[id]; if(!D) return false;
  G.flags['dr_seen_'+id]=true;
  dreamOpen(D);
  const lines=[xl('narr',`You fall asleep, and you dream...`,`You fall asleep and dream...`)].concat(D.lines());
  runDialogue(lines,()=>{ scene='play'; dreamClose(); deed('dream_'+id); EV.pipDream=G.time; setBanner(S('You wake up','You wake up'),S(`${D.title}. It felt like a memory.`,`${D.title}. It felt real.`),2.6); saveGame(); });
  return true;
}
// a soft night-sky picture behind the dialogue while you dream (DOM, under the dialogue box, never takes clicks)
function dreamEl(){
  let el=document.getElementById('evDream'); if(el) return el;
  el=document.createElement('div'); el.id='evDream'; el.setAttribute('aria-hidden','true');
  el.style.cssText='position:fixed;inset:0;z-index:4;pointer-events:none;opacity:0;transition:opacity 1.1s ease;display:none';
  const cv=document.createElement('canvas'); cv.style.cssText='position:absolute;inset:0;width:100%;height:100%'; el.appendChild(cv);
  const tt=document.createElement('div'); tt.className='evDreamT'; tt.style.cssText=`position:absolute;left:0;right:0;top:max(22px,env(safe-area-inset-top,0px));text-align:center;font:600 13px ${UIF};letter-spacing:.22em;text-transform:uppercase;color:rgba(232,218,255,.88);text-shadow:0 2px 10px rgba(0,0,0,.7)`; el.appendChild(tt);
  const t2=document.createElement('div'); t2.className='evDreamN'; t2.style.cssText=`position:absolute;left:0;right:0;top:calc(max(22px,env(safe-area-inset-top,0px)) + 22px);text-align:center;font:700 24px ${UIF};color:#fff2e0;text-shadow:0 2px 14px rgba(120,80,200,.8)`; el.appendChild(t2);
  document.body.appendChild(el); return el;
}
function dreamOpen(D){
  try{
    const el=dreamEl(); el.style.display='block'; el.querySelector('.evDreamT').textContent=simplify(S('A dream from long ago','A dream from long ago')); el.querySelector('.evDreamN').textContent=simplify(D.title);
    EV.dream={scene:D.scene,t:0,seed:Math.random()*1000}; dreamDraw();
    requestAnimationFrame(()=>{ el.style.opacity='1'; });
    const loop=()=>{ if(!EV.dream) return; EV.dream.t+=1/60; dreamDraw(); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  }catch(e){}
}
function dreamClose(now){ const el=document.getElementById('evDream'); EV.dream=null; if(!el) return; el.style.opacity='0'; if(now) el.style.display='none'; else setTimeout(()=>{ if(!EV.dream) el.style.display='none'; },1200); }
function dreamDraw(){
  const el=document.getElementById('evDream'); if(!el||!EV.dream) return; const cv=el.querySelector('canvas');
  const w=innerWidth, h=innerHeight, dpr=Math.min(2,window.devicePixelRatio||1); if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); }
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);
  const D=EV.dream, t=D.t, R=mulberry32(Math.floor(D.seed));
  const bg=g.createRadialGradient(w/2,h*0.32,20,w/2,h*0.4,Math.max(w,h)*0.75); bg.addColorStop(0,'rgba(70,46,120,.94)'); bg.addColorStop(0.55,'rgba(28,18,58,.95)'); bg.addColorStop(1,'rgba(8,4,18,.97)'); g.fillStyle=bg; g.fillRect(0,0,w,h);
  for(let i=0;i<120;i++){ const x=R()*w, y=R()*h*0.75, s=R()*1.6+0.4, tw=0.5+0.5*Math.sin(t*(1+R()*2)+i); g.fillStyle=`rgba(255,250,235,${0.25+0.6*tw*R()})`; g.beginPath(); g.arc(x,y,s,0,TAU); g.fill(); }
  const sc=Math.min(w/1000,h*0.62/560), ox=w/2-500*sc, oy=Math.max(40,h*0.08);
  g.save(); g.translate(ox,oy); g.scale(sc,sc);
  const sil='#140c26', rim='rgba(255,190,140,.35)';
  const glow=(x,y,r,col,a)=>{ const k=g.createRadialGradient(x,y,0,x,y,r); k.addColorStop(0,`rgba(${col},${a})`); k.addColorStop(1,`rgba(${col},0)`); g.fillStyle=k; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); };
  const hx0=-ox/sc-40, hx1=(w-ox)/sc+40, hyB=(h-oy)/sc+40;
  const hill=(y0,amp,col)=>{ g.fillStyle=col; g.beginPath(); g.moveTo(hx0,hyB); for(let x=hx0;x<=hx1;x+=40) g.lineTo(x,y0+Math.sin(x*0.007+amp)*amp*10); g.lineTo(hx1,hyB); g.closePath(); g.fill(); };
  const mtn=()=>{ g.fillStyle='#1d1236'; g.beginPath(); g.moveTo(80,560); g.lineTo(420,150); g.lineTo(520,230); g.lineTo(640,120); g.lineTo(980,560); g.closePath(); g.fill(); g.fillStyle='rgba(230,230,255,.18)'; g.beginPath(); g.moveTo(600,170); g.lineTo(640,120); g.lineTo(690,190); g.closePath(); g.fill(); };
  const dragon=(x,y,s,f,col)=>{ g.save(); g.translate(x,y); g.scale(s*f,s); g.fillStyle=col||sil; g.beginPath(); g.ellipse(0,0,70,34,0,0,TAU); g.fill(); g.beginPath(); g.ellipse(72,-36,30,22,-0.3,0,TAU); g.fill(); g.beginPath(); g.moveTo(-60,0); g.quadraticCurveTo(-130,30,-150,-10); g.lineTo(-140,0); g.quadraticCurveTo(-120,20,-60,14); g.fill(); for(const s2 of [-1,1]){ g.beginPath(); g.moveTo(66,-54); g.lineTo(60+s2*6,-90); g.lineTo(80,-56); g.fill(); } g.restore(); };
  const kid=(x,y,s,col)=>{ g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=col||sil; g.beginPath(); g.ellipse(0,0,14,18,0,0,TAU); g.fill(); g.beginPath(); g.arc(0,-24,11,0,TAU); g.fill(); g.beginPath(); g.moveTo(-6,-32); g.lineTo(-10,-44); g.lineTo(-2,-34); g.fill(); g.beginPath(); g.moveTo(6,-32); g.lineTo(10,-44); g.lineTo(2,-34); g.fill(); g.beginPath(); g.moveTo(-10,10); g.quadraticCurveTo(-30,22,-34,6); g.lineTo(-30,8); g.quadraticCurveTo(-24,14,-10,4); g.fill(); g.restore(); };
  const person=(x,y,s,col)=>{ g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=col||sil; g.beginPath(); g.moveTo(-14,0); g.quadraticCurveTo(-16,-34,0,-36); g.quadraticCurveTo(16,-34,14,0); g.closePath(); g.fill(); g.beginPath(); g.arc(0,-46,10,0,TAU); g.fill(); g.restore(); };
  const lantern=(x,y,s,a)=>{ glow(x,y,46*s,'255,190,110',0.55*a); g.fillStyle=`rgba(255,214,150,${a})`; g.beginPath(); g.ellipse(x,y,8*s,11*s,0,0,TAU); g.fill(); };
  switch(D.scene){
    case 'spark': mtn(); dragon(470,470,1.3,1); kid(640,500,1.4); { const sx=660+Math.sin(t*1.3)*16, sy=410+Math.cos(t*1.7)*10; glow(sx,sy,40,'255,170,80',0.9); g.fillStyle='#fff1c0'; g.beginPath(); g.arc(sx,sy,5,0,TAU); g.fill(); } hill(560,1.2,'#100a20'); break;
    case 'flight': hill(470,2,'#1a1234'); for(let i=0;i<14;i++){ glow(80+i*64+Math.sin(i)*20,500+(i%3)*18,14,'255,200,120',0.7); } { const y=200+Math.sin(t*0.8)*10; dragon(480,y,1.1,1); g.fillStyle=sil; for(const s of [-1,1]){ g.beginPath(); g.moveTo(470,y-20); g.quadraticCurveTo(470+s*40,y-160,470+s*190,y-110+Math.sin(t*2)*20); g.quadraticCurveTo(470+s*90,y-50,470,y); g.fill(); } kid(500,y-44,0.9,'#2a1846'); } break;
    case 'knock': hill(520,1,'#140c26'); g.fillStyle='#22163e'; g.fillRect(420,330,260,190); g.beginPath(); g.moveTo(400,340); g.lineTo(550,230); g.lineTo(700,340); g.closePath(); g.fill(); glow(520,450,120,'255,190,110',0.6); g.fillStyle='rgba(255,210,140,.9)'; g.fillRect(498,410,46,110); person(560,520,1.6,'#2a1a3c'); kid(460,520,1.7); lantern(580,450,1,1); break;
    case 'five': hill(530,1.5,'#120a22'); glow(500,470,160,'255,150,70',0.75); for(let i=0;i<3;i++){ g.fillStyle=['#ff7a30','#ffb050','#fff0a0'][i]; g.beginPath(); g.ellipse(500,478-i*6,22-i*6,30-i*8+Math.sin(t*9+i)*3,0,0,TAU); g.fill(); } for(let i=0;i<6;i++){ const a=Math.PI*(0.95+i*0.22), x=500+Math.cos(a)*200, y=490+Math.sin(a)*60; if(i===2) kid(x,y+10,1.4); else person(x,y+16,1.3+(i===4?0.25:0)); } break;
    case 'split': mtn(); g.fillStyle='rgba(240,240,255,.5)'; for(let i=0;i<40;i++){ g.beginPath(); g.arc((R()*1000+t*20*R())%1000,(R()*560+t*40)%560,1.5,0,TAU); g.fill(); } glow(500,300,200,'255,220,160',0.35+0.15*Math.sin(t*2)); for(let i=0;i<5;i++){ const a=-Math.PI/2+i/5*TAU, x=500+Math.cos(a)*170, y=430+Math.sin(a)*50; lantern(x,y,1.1,1); } kid(500,450,1.6); break;
    case 'knight': hill(540,1,'#120a22'); g.fillStyle='#1c1232'; g.fillRect(300,180,100,360); g.fillRect(600,180,100,360); g.beginPath(); g.moveTo(400,260); g.quadraticCurveTo(500,160,600,260); g.lineTo(600,300); g.quadraticCurveTo(500,210,400,300); g.closePath(); g.fill(); glow(500,420,140,'255,200,140',0.4); g.save(); g.translate(500,520); g.fillStyle=sil; g.beginPath(); g.ellipse(0,-30,26,32,0,0,TAU); g.fill(); g.beginPath(); g.arc(0,-74,16,0,TAU); g.fill(); g.fillRect(22,-100,5,100); g.restore(); kid(380,525,1.4); break;
    case 'lantern': hill(470,1.4,'#140c26'); { const n=G.flags.dr_lantern==='all'?26:G.flags.dr_lantern==='more'?2:1; for(let i=0;i<n;i++){ const x=n>2?70+i*34:500+(i?60:0), y=n>2?430+Math.sin(i*1.7)*30+(i%2)*20:330-(i?20:0); lantern(x,y,n>2?0.7:1.6,0.9); } } kid(470,480,1.5); break;
    case 'home': hill(480,1.2,'#140c26'); for(let i=0;i<30;i++){ const x=40+i*32, y=420+Math.sin(i*1.3)*40+(i%3)*14; lantern(x,y,0.6+(i===15?0.8:0),0.9); } person(470,500,1.2,'#24163a'); kid(520,500,1.2); break;
  }
  g.restore();
  const vg=g.createLinearGradient(0,h*0.55,0,h); vg.addColorStop(0,'rgba(8,4,18,0)'); vg.addColorStop(1,'rgba(8,4,18,.85)'); g.fillStyle=vg; g.fillRect(0,h*0.55,w,h*0.45);
}

// ================= small variations: Mom, Yara and Wren remember dreams and events; Pip chirps about where you are
function evGreet(id){
  if(!G||G.mode!=='story'||!G.seenTalk||!G.seenTalk['met_'+id]) return null;
  const F=G.flags;
  // a dream they have not mentioned yet (the newest first)
  for(let i=DREAM_ORDER.length-1;i>=0;i--){ const d=DREAM_ORDER[i]; if(!F['dr_seen_'+d]) continue; const T=DREAM_TALK[d], k='drt_'+id+'_'+d; if(F[k]) continue; let v=T&&T[id]; if(v&&typeof v==='object') v=v[F['dr_'+d]]; if(!v) continue; F[k]=1; for(let j=0;j<i;j++) F['drt_'+id+'_'+DREAM_ORDER[j]]=1; return v; }
  const one=(k,t)=>{ if(F[k]) return null; F[k]=1; return t; };
  let v=null;
  if(id==='maren'&&F.ev_flower) v=one('ev_flower_told',EV_TALK.momFlower);
  if(!v&&id==='bertram'&&F.tk_bun==='bertram') v=one('tk_bun_told',EV_TALK.bertramBun);
  if(!v&&F.tk_n>=4){ const hk={baker:'bertram',farm:'hollis',moss:'moss'}[F.tk_home]; if(hk===id) v=one('tk_home_told',EV_TALK.home[F.tk_home]); }
  if(!v&&id==='maren'&&F.tk_n>=5&&F.tk_come) v=one('tk_mom_told',F.tk_come==='yes'?EV_TALK.momTikkaYes:EV_TALK.momTikkaHome);
  if(v) return v;
  const st=G.stage;
  if(id==='maren'&&MOM_CH[st]&&Math.random()<0.4) return pick(MOM_CH[st]);
  if(id==='yara'&&YARA_CH[st]&&Math.random()<0.4) return pick(YARA_CH[st]);
  return null;
}
{ const base=greetLine; greetLine=function(id){ try{ const v=evGreet(id); if(v) return v; }catch(e){} return base(id); }; }
{ const base=pipChirp; pipChirp=function(q){
  try{ if(G&&G.mode==='story'&&Math.random()<0.6){ const p=player, s=T(p.x,p.y,{}); let L=null;
    if(G.time-EV.pipDream<120) L=PIP_CH.dream;
    else if(p.hp<p.maxHp*0.35) L=PIP_CH.hurt;
    else if(!AREA&&G.rainK>0.45&&p.y>WALL_Y) L=PIP_CH.rain;
    else if(!AREA&&s.b===5) L=PIP_CH.snow;
    else if(isNight()) L=PIP_CH.night;
    else if(!AREA&&evNearWater(p.x,p.y,160)) L=PIP_CH.water;
    else if(G.deeds&&DAGE('ev_kitten')<600) L=PIP_CH.kitten;
    else if(G.deeds&&DAGE('ev_stars')<600) L=PIP_CH.stars;
    else if((G.flags.tk_n|0)>=1&&Math.random()<0.15) L=PIP_CH.tikka;
    if(L){ bubble(q,pick(L),{kind:'pip',dy:-22}); csfx('chirp'); return; } } }catch(e){}
  base(q); }; }
{ const base=compTalkOpts; compTalkOpts=function(id,n){ const o=base(id,n); try{ if(G&&G.mode==='story'){ const X=EV_TALK.opts[id]; if(X) for(const it of X){ if(it.cond()) o.unshift({t:it.t,key:it.key,then:it.lines,back:true}); } } }catch(e){} return o; }; }
{ const base=tamsinSong; tamsinSong=function(){ const L=base(); try{ const add=EV_TAMSIN.filter(v=>v[0]()).map(v=>['tamsin',v[1]]); if(add.length){ const i=L.findIndex(l=>/that's all I've got/.test(l[1])); if(i>0) L.splice(i,1,...add); else L.push(...add); } }catch(e){} return L; }; }
// villagers notice: barks and chats about the weather, the time of day and what Ash did at the events
for(const [k,w,c,t] of WX_BARKS) B(k,w,c,t);
for(const [k,c,l] of WX_CHATS) VCH(k,'any','any',c,l);
for(const [k,w,c,t,d] of EV_BARKS) B(k,w,c,t,d?{d}:undefined);
for(const k in EV_DGREET) DGREET[k]=EV_DGREET[k];

// ================= drawing
function eventsForRender(list){
  evLightsSync();
  if(!G||G.mode!=='story'||AREA) return;
  const E=EV.E;
  if(E) for(const o of E.ents){ if(o.hide||o.gone) continue; if(!inView(o.x,o.y,o.k==='tree'?160:o.k==='pen'?120:90)) continue;
    if(o.k==='pen'){ list.push({x:o.x,y:o.y-o.r*0.3,draw:()=>evDrawPen(o,-1)}); list.push({x:o.x,y:o.y+o.r*0.6,draw:()=>evDrawPen(o,1)}); continue; }
    const y=o.ground?o.y-200:o.y; list.push({x:o.x,y,r:o.r||10,draw:()=>evDraw(o,E)}); }
  const A=EV.ally; if(A){ if(inView(A.x,A.y,60)) list.push({x:A.x,y:A.y,draw:()=>evDrawKob(A)}); for(const k of A.kids) if(inView(k.x,k.y,60)) list.push({x:k.x,y:k.y,draw:()=>evDrawKob(k)}); }
  if(EV.carry&&player&&!player.dead) list.push({x:player.x,y:player.y+0.5,draw:evDrawCarry});
}
// lights of our own (stars, fireflies, wisps, torches...) so they glow at night like the world's lamps
const EVLT=[];
function evLightsSync(){
  for(const L of EVLT){ const i=LIGHTS.indexOf(L); if(i>=0) LIGHTS.splice(i,1); }
  EVLT.length=0;
  if(AREA||!G||G.mode!=='story') return;
  const add=(x,y,r,i,fire)=>{ const L={x,y,r,i,fire:!!fire,ev:true}; EVLT.push(L); LIGHTS.push(L); };
  const E=EV.E;
  if(E) for(const o of E.ents){ if(o.hide||o.gone) continue; const a=E.phase==='leave'?clamp(1-(E.leaveT-0.6)/2,0,1):1; switch(o.k){
    case 'star': add(o.x,o.y-10,150,0.85*a,true); break; case 'spark': add(o.x,o.y-10,80,0.6*a); break; case 'fly': add(o.x,o.y-16,60,0.5*a); break;
    case 'wisp': if(o.on) add(o.x,o.y-18,110,0.65*a); break; case 'grove': add(o.x,o.y,o.on?220:100,(o.on?0.75:0.35)*a); break;
    case 'ghost': add(o.x,o.y-24,120,0.5*(o.alpha==null?1:o.alpha)*a); break; case 'hat': add(o.x,o.y,70,0.4*a); break;
    case 'torch': if(o.lit) add(o.x,o.y-20,140,0.8*a,true); break; case 'oven': if(o.lit) add(o.x,o.y,120,0.7*a,true); break;
    case 'mimic': if(!o.awake) add(o.x,o.y,60,0.4*a,true); break; case 'npc': if(o.id==='ev_lumi'||o.id==='ev_wim') add(o.x,o.y-14,80,0.45*a,true); break; } }
  if(EV.ally) add(EV.ally.x,EV.ally.y,70,0.3);
}
// above the tree tops: falling-star streaks, snowballs and buns in flight, the fog, and our markers
{ const base=drawBirds; drawBirds=function(){ base(); try{ if(G&&G.mode==='story'&&!AREA){ if(EV.fx.length) evDrawFx(); const E=EV.E; if(E&&E.id==='fog'&&E.d.fog>0) evDrawFog(E); } }catch(e){} }; }
{ const base=drawMarkers; drawMarkers=function(t){ base(t); try{ const E=EV.E; if(!E||AREA||E.phase==='leave'||G.mode!=='story') return; for(const o of E.ents){ if(!o.mark||o.hide||o.gone||!inView(o.x,o.y,60)) continue; drawMarker(o.x,(T3.on&&o._t3top!=null?Math.min(o.y-34,o._t3top-16):o.y-(o.mh||40)),o.mark,t); } }catch(e){} }; }
function evAlphaOf(o,E){ let a=o.alpha==null?1:o.alpha; if(E&&E.phase==='leave'&&!o.keep) a*=clamp(1-(E.leaveT-0.6)/2,0,1); return a; }
function evDraw(o,E){
  const a=evAlphaOf(o,E); if(a<=0.01) return;
  ctx.save(); ctx.globalAlpha*=a;
  try{ (EVDRAW[o.k]||evDrawBlob)(o,E); }catch(err){ if(!EVERR[o.k]){ EVERR[o.k]=1; console.warn('event draw',o.k,err&&err.message); } }
  ctx.restore();
}
const EVERR={};
function evDrawBlob(o){ ctx.fillStyle='#c8a070'; ctx.beginPath(); ctx.arc(o.x,o.y,8,0,TAU); ctx.fill(); }
// a person: the shared people renderer (3D toys or the classic art)
function evDrawPerson(o){ if(o.hopZ>0){ o.hopZ-=0.5; } const y=o.y; if(o.hopZ>0) o.y-=o.hopZ*0.6; drawNPC(o); o.y=y; }
// Tikka and her friends: a young kobold in an apron, scarf or a robe three sizes too big
function evDrawKob(o){
  const t=G.time, mv=evMotion(o), k=o.kk||0.82;
  if(!T3.on) return evDrawKob2D(o,mv);
  const face=t3Turn(o,o.face||0,10), w=o._wp||0, sw=Math.sin(w)*mv, bob=Math.abs(Math.cos(w))*mv*0.8;
  const hopz=o.hop!=null?Math.max(0,Math.sin(o.hop*3.2))*3:0, trip=o.trip>0?Math.sin(o.trip*12)*0.25:0, shiver=o.scared?Math.sin(t*40)*0.06:0;
  const sk='#b8a060', skD='#8a7438', belly='#e4d49a';
  if(!DV.on){ ctx.save(); ctx.globalAlpha*=0.3; ctx.drawImage(SPR.shadow,o.x-10*k,o.y+5*k-3,20*k,7); ctx.restore(); }
  t3Begin(o.x,o.y+5*k,face,{k,z:hopz});
  b3Reset(); if(trip) b3Rot(1,trip,0,0,0); if(shiver) b3Rot(0,shiver,0,0,6);
  for(const sd of B3SD){ const s=sw*sd; bL(0,sd*2.4,7.4,s*3.2,sd*2.7,1.4,2.0,skD,1.7); bE(s*3.2+0.9,sd*2.7,0.9,2.6,1.7,1.0,'#3a2a14',0,sd*0.15); }
  const ts=Math.sin(t*4)*1.4; bL(-3,0,7.6,-8,ts,5,2.3,sk,1.5); bL(-8,ts,5,-12,Math.sin(t*4+1)*2.4,2.6+(o.happy?3:0),1.5,skD,0.5);
  bE(0,0,12+bob,4.4,4.9,5.4,sk); bE(2.1,0,11.4+bob,2.3,3.3,3.8,belly,0.12,0,0,0.05);
  if(o.robe){ bE(-0.2,0,8.6+bob,7.2,7.6,8.4,'#6a4280'); bE(-0.4,0,1.6,8.6,8.8,1.6,'#4a2a5c'); bE(0.6,0,16.4+bob,5.2,6.2,2.6,'#5a3470'); }
  if(o.apron){ bF(0,3.6,-3.4,15.2+bob); bF(1,3.6,3.4,15.2+bob); bF(2,4.8,4.4,6.2+bob); bF(3,4.8,-4.4,6.2+bob); bP(4,'#f2e8d4','#c8b898',0.06); bD(5.1,0,10+bob,0.7,'#d8c098',0.07); }
  if(o.pack){ bE(-4.2,0,13+bob,2.8,4.2,4.8,'#7a5230'); bE(-4.6,0,18+bob,2.2,3.6,1.6,'#c8b088'); }
  const sc=o.scarf||'#c84a3a'; bE(0.4,0,16.4+bob,4.4,5.2,1.7,sc); bL(-2.6,2.2,16+bob,-5.8,3.4+Math.sin(t*3)*0.8,11.5+bob,1.1,sc,0.8,0.02);
  const hz=21+bob; b3Push(); if(o.robe) b3Rot(1,0.05,0,0,hz);
  bB(1.2,0,hz,5.3,sk); bE(5.2,0,hz-1.2,3.8,2.9,2.4,sk,0.12);
  for(const sd of B3SD){ if(b3Faces(0.85,sd*0.5,0.15)<-0.1) continue; bEye(4.4,sd*2.5,hz+0.9,1.75,'#ffffff',false); bD(4.9,sd*2.5,hz+0.8,1.05,'#2a1a08',0.03); bD(5.1,sd*2.25,hz+1.4,0.42,'#ffffff',0.04); bD(5.6,sd*3.4,hz-1.4,0.9,'rgba(255,120,120,.55)',0.02); }
  bLn(7.4,-1.4,hz-2.1,7.4,1.4,hz-2.1,0.5,'#4a2a14',0.04);
  for(const sd of B3SD) bC(-0.2,sd*2.6,hz+3.6,-3.4,sd*4.0,hz+6.2,1.0,'#d8c48a');
  if(o.robe){ bE(-0.6,0,hz+1.4,6.4,6.6,6.4,'#6a4280',0,0,0,-0.02); }
  b3Pop();
  const ah=12.6+bob;
  if(o.loaf){ for(const sd of B3SD) bL(0.6,sd*4.6,15.4+bob,3.6,sd*2.4,ah,1.4,sk,1.2); bE(4.6,0,ah,2.6,5.2,2.4,'#c8843a',0,0.2,0,0.05); bLn(5.5,-2,ah+1.8,5.8,2,ah+1.8,0.4,'#e8b060',0.06); }
  else{ const s=-sw; bL(0.6,4.6,15.4+bob,s*3+1,6.2,ah-1,1.4,sk,1.2); bB(s*3+1,6.2,ah-1.2,1.4,sk,0.03);
    bL(0.6,-4.6,15.4+bob,-s*3+1,-6.2,ah-1,1.4,sk,1.2); bB(-s*3+1,-6.2,ah-1.2,1.4,sk,0.03);
    if(o.lid) bE(-s*3+1.6,-7.6,ah,3.6,0.7,3.6,'#a8acb4',0,0,0,0.04);
    if(o.spoon){ const hx=s*3+1, hy=6.2; bLn(hx-1,hy,ah-3,hx+2,hy,ah+6,0.8,'#a87a48',0.04); bE(hx+2.4,hy,ah+7,1.4,0.8,2,'#c89a60',0,0,0,0.05); } }
  t3End();
  o._t3top=o.y-(29+hopz)*k*T3.st;
}
function evMotion(o){ const now=G.time; let dt=now-(o._mt==null?now:o._mt); o._mt=now; if(!(dt>0)||dt>0.2) dt=0; if(o._mx==null){ o._mx=o.x; o._my=o.y; } const v=dt>0?Math.hypot(o.x-o._mx,o.y-o._my)/dt:0; o._mx=o.x; o._my=o.y; o._wv=(o._wv||0)+((v>8?1:0)-(o._wv||0))*Math.min(1,dt*8); o._wp=(o._wp||0)+v*dt*0.22; return o._wv; }
function evDrawKob2D(o,mv){
  const k=(o.kk||0.82)*1.05, f=o.face||0; ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(f); ctx.scale(k,k);
  const st=Math.sin((o._wp||0))*2*mv; ell(2+st,-5,3,2,'#3a2a14'); ell(2-st,5,3,2,'#3a2a14');
  ctx.strokeStyle='#7a6834'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-6,0); ctx.quadraticCurveTo(-12,Math.sin(G.time*4)*4,-16,Math.sin(G.time*4+1)*6); ctx.stroke();
  ell(0,0,8,8.5,o.robe?'#6a4280':'#b8a060'); if(o.apron) ell(3,0,4.5,6,'#f2e8d4'); ell(-1,0,8.2,2.5,o.scarf||'#c84a3a');
  ell(8,0,5.5,5,'#b8a060'); for(const s of [-1,1]){ ell(10,s*2.4,1.6,1.6,'#fff'); ell(10.6,s*2.4,0.9,0.9,'#2a1a08'); }
  ctx.restore();
}
const EVDRAW={
  npc:evDrawPerson, kob:evDrawKob,
  cart(o){ const t=G.time, tilt=o.tilt?0.12:0, jolt=o.jolt>0?Math.sin(o.jolt*40)*0.06:0;
    if(!T3.on){ ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.face); ctx.fillStyle='#6a4220'; ctx.fillRect(-24,-14,48,28); ctx.fillStyle='#efe2c0'; ctx.fillRect(-20,-12,40,24); for(const [x,y] of [[-14,-16],[14,-16],[-14,16],[14,16]]) ell(x,y,6,3,'#3a2a14'); ctx.restore(); return; }
    t3Begin(o.x,o.y+8,o.face,{k:1.15}); b3Reset(); b3Rot(0,tilt+jolt,0,0,0);
    const wood=o.gold?'#9a6a34':'#8a5a2c';
    bE(0,0,9,15,9,4.6,wood); bE(0,0,13.5,14.6,8.6,2,shd(wood,0.12),0,0,0,0.02);
    bE(-1,0,17.5,13,8,7.4,o.gold?'#f4e4a0':'#efe2c0'); for(const i of [-8,0,8]) bE(i,0,18,1.2,8.4,7.6,'#b89a70',0,0,0,0.02);
    for(const sd of B3SD){ bC(9,sd*3.6,22,10,sd*6.4,30+Math.sin(t*3+sd)*0.8,2.1,o.gold?'#e8c040':'#c8a070'); bC(9.2,sd*3.6,22.2,9.9,sd*5.9,28.4,1.1,'#ff9aa8',0.02); }
    for(const [x,sd] of [[-9,-1],[-9,1],[9,-1],[9,1]]){ bE(x,sd*9.6,5.4,5.4,1.1,5.4,'#4a2e16',0,0,0,sd*0.02); bD(x,sd*10.8,5.4,1.1,'#c8a060',sd>0?0.03:-0.03); }
    bLn(15,0,6,24,0,4,0.8,'#5a3a1a'); t3End(); o._t3top=o.y-34*1.15*T3.st; },
  mud(o){ const d=clamp(o.dry/1.6,0,1); ctx.fillStyle=d<1?`rgba(${Math.round(70+60*d)},${Math.round(48+50*d)},${Math.round(26+40*d)},.85)`:'rgba(150,120,80,.55)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,o.r,o.r*0.55,0,0,TAU); ctx.fill();
    if(d<1){ ctx.fillStyle='rgba(255,255,255,.18)'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.ellipse(o.x-20+i*13,o.y-6+(i%2)*8,5,2,0,0,TAU); ctx.fill(); } } else { ctx.strokeStyle='rgba(90,70,40,.6)'; ctx.lineWidth=1; for(let i=0;i<6;i++){ const a=i/6*TAU; ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(o.x+Math.cos(a)*o.r*0.8,o.y+Math.sin(a)*o.r*0.45); ctx.stroke(); } } },
  tree(o,E){ const p={k:'oak',x:o.x,y:o.y,s:o.s,v:o.v,rot:0}; const jolt=o.jolt>0?Math.sin(o.jolt*50)*0.04:0;
    let cx=o.x, cy=o.y;
    if(DV.on){ const ga=ctx.globalAlpha, h=TREEH.oak*o.s; drawTallLean(p,ga,jolt); cx=o.x+leanDX(o.x,h); cy=o.y+leanDY(o.y,h); ctx.globalAlpha=ga; }
    else drawSprite(propSprite(p),o.x,o.y,o.s,jolt);
    const K=E&&E.kit; if(!K) return;
    let kx=cx, ky=cy-4, on=true;
    if(K.mode==='fall'){ const u=clamp(K.t/0.6,0,1); kx=lerp(cx,player.x,u); ky=lerp(cy,player.y-30,u)-Math.sin(u*Math.PI)*30; }
    else if(K.mode==='pip'&&G.pip){ kx=G.pip.x; ky=G.pip.y-14; }
    else if(K.mode==='posy'){ kx=E.main.x+10; ky=E.main.y-2; }
    else if(K.mode==='carry') on=false;
    if(on) evKitten(kx,ky,K.mode==='tree'); },
  star(o){ const t=G.time, y=o.y-(o.z||0)-6-Math.sin(t*3)*3; glowAt(o.x,y,46,'255,236,160',0.55); ctx.fillStyle='#fff6c8'; ctx.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5+t*0.6, r=i%2?4.2:10; i?ctx.lineTo(o.x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(o.x+Math.cos(a)*r,y+Math.sin(a)*r); } ctx.closePath(); ctx.fill(); ctx.fillStyle='#2a2010'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(o.x+s*2.6,y-1,1.1,0,TAU); ctx.fill(); } },
  spark(o){ const t=G.time, y=o.y-8-Math.abs(Math.sin(t*6+o.ph))*8; glowAt(o.x,y,26,'255,236,150',0.7); ctx.fillStyle='#fffbe0'; ctx.beginPath(); ctx.arc(o.x,y,3.6,0,TAU); ctx.fill(); if(Math.random()<0.5) emit(o.x,y,1,{col:'255,230,150',smin:5,smax:20,lmin:.2,lmax:.4,zmin:1,zmax:2}); },
  ghost(o){ const t=G.time, z=(o.z||0)+8+Math.sin(t*2)*3, a=0.78;
    glowAt(o.x,o.y-20-z,48,'200,230,255',0.3);
    if(!T3.on){ ctx.save(); ctx.globalAlpha*=a; ctx.fillStyle='#e6f4ff'; ctx.beginPath(); ctx.arc(o.x,o.y-14-z,12,Math.PI,0); ctx.lineTo(o.x+12,o.y+6-z); for(let i=0;i<4;i++){ const x=o.x+12-i*6; ctx.quadraticCurveTo(x-1.5,o.y+10-z,x-3,o.y+6-z); ctx.quadraticCurveTo(x-4.5,o.y+2-z,x-6,o.y+6-z); } ctx.closePath(); ctx.fill(); ctx.fillStyle='#1a2a3a'; ctx.beginPath(); ctx.arc(o.x-4,o.y-16-z,2,0,TAU); ctx.arc(o.x+4,o.y-16-z,2,0,TAU); ctx.fill(); ctx.restore(); return; }
    const f=t3Turn(o,o.face||0,6); t3Begin(o.x,o.y+4,f,{k:1.35,z,alpha:a}); b3Reset();
    for(let i=0;i<6;i++){ const b=i/6*TAU+t*0.8; bB(Math.cos(b)*5.6,Math.sin(b)*5.6,2.6+Math.sin(t*4+i)*0.8,2.6,'#dceeff'); }
    bE(0,0,10,6.8,7.2,8.4,'#e6f4ff'); bB(0,0,18.6,7,'#f0f8ff');
    for(const sd of B3SD) bL(1,sd*6.4,12.6,5.6,sd*9.4,10+Math.sin(t*3+sd)*2,1.7,'#e6f4ff',1.3);
    for(const sd of B3SD) bE(6,sd*2.6,19.6,0.8,1.3,1.8,'#1a2a3a',0,0,0,0.03); bE(6.4,0,15.8,0.8,1.3,1.4,'#2a3a4a',0,0,0,0.03);
    if(o.hat){ bE(0,0,24.6,6.6,6.6,0.7,'#1a1a22'); bE(0,0,28.6,4.2,4.2,4.4,'#22222a'); bE(0,0,25.8,4.4,4.4,0.9,'#8a2e22',0,0,0,0.02); }
    t3End(); o._t3top=o.y-(26+z)*1.35*T3.st; },
  hat(o){ const t=G.time, z=6+Math.sin(t*2)*2; glowAt(o.x,o.y-z-6,30,'220,230,255',0.35); evTopHat(o.x,o.y,z,1); },
  mimic(o){ evMimic(o); },
  goat(o){ if(T3.on&&T3B.goat) T3B.goat(o); else drawGoat(o); },
  wisp(o){ if(!o.on) return; const t=G.time, y=o.y-18+Math.sin(t*2.4)*5; glowAt(o.x,y,40,'190,255,220',0.6); ctx.fillStyle='rgba(235,255,245,.95)'; ctx.beginPath(); ctx.arc(o.x,y,4,0,TAU); ctx.fill(); for(let i=0;i<3;i++){ const a=t*2+i*2.1; ctx.fillStyle='rgba(200,255,225,.6)'; ctx.beginPath(); ctx.arc(o.x+Math.cos(a)*9,y+Math.sin(a)*5,1.6,0,TAU); ctx.fill(); } },
  grove(o){ const t=G.time, on=o.on;
    ctx.fillStyle='rgba(120,200,230,.55)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,34,18,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(o.x-8,o.y-4,12,4,0,0,TAU); ctx.fill();
    for(let i=0;i<12;i++){ const a=i/12*TAU, x=o.x+Math.cos(a)*62, y=o.y+Math.sin(a)*34; const gl=on?0.5+0.3*Math.sin(t*2+i):0.18; glowAt(x,y-4,18,i%2?'190,255,220':'230,200,255',gl); ctx.fillStyle=i%2?'#d8f8e0':'#efd8ff'; ctx.beginPath(); ctx.ellipse(x,y-3,4,2.6,0,0,TAU); ctx.fill(); ctx.fillStyle='#e8e0d0'; ctx.fillRect(x-0.8,y-3,1.6,4); }
    for(let i=0;i<8;i++){ const a=i*0.8+0.3, x=o.x+Math.cos(a)*40, y=o.y+Math.sin(a)*24+10; ctx.fillStyle=['#ff9ac0','#ffe066','#9ad0ff'][i%3]; ctx.beginPath(); ctx.arc(x,y,2.2,0,TAU); ctx.fill(); } },
  baby(o){ if(T3.on&&T3B.hatchling){ ctx.save(); ctx.translate(o.x,o.y); ctx.scale(1.5,1.5); ctx.translate(-o.x,-o.y); T3B.hatchling(o.x,o.y-(o.z||0)*T3.st,o.face||0,o.t,false); ctx.restore(); o._t3top=o.y-30-(o.z||0); } else { ctx.save(); ctx.globalAlpha*=1; drawPip({x:o.x,y:o.y-(o.z||0),face:o.face||0,t:o.t}); ctx.restore(); } },
  young(o){ if(T3.on){ const t=o.t, D=EV._yd||(EV._yd={sleep:false,legs:0,shell:false,puff:false,hy:0}); D.flap=0.3+Math.sin(t*(o.z>0?18:8))*0.9; D.m=Math.sin(t*2)>0.7?0.6:0; D.happy=true; D.hp=Math.sin(t*1.4)*0.06; D.hr=0; b3Shadow(o.x,o.y+6,12,0.25); b3Dragon(o,D,t3Turn(o,o.face||0,6),o.x,o.y+6,8+(o.z||0),1.5,false,DMUMPAL); o._t3top=o.y-(34+(o.z||0))*T3.st; } else drawPip({x:o.x,y:o.y-(o.z||0),face:o.face||0,t:o.t}); },
  mum(o){ const t=G.time; if(T3.on){ const D=EV._md||(EV._md={sleep:false,legs:0,shell:false,puff:false,hy:0}); D.flap=0.4+Math.sin(t*(o.z>0?14:4))*0.8; D.m=Math.sin(t*1.3)>0.8?0.7:0; D.happy=false; D.hp=0; D.hr=Math.sin(t*0.7)*0.1; b3Shadow(o.x,o.y+8,20,0.3); b3Dragon(o,D,t3Turn(o,o.face||0,4),o.x,o.y+8,6+(o.z||0),2.4,false,DMUMPAL); o._t3top=o.y-(54+(o.z||0))*T3.st; } else { ctx.save(); ctx.translate(o.x,o.y-(o.z||0)); ctx.scale(2.2,2.2); drawPip({x:0,y:0,face:o.face||0,t}); ctx.restore(); } },
  nest(o){ ctx.fillStyle='rgba(150,110,50,.9)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,30,16,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(90,60,25,.95)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,20,10,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(200,160,80,.8)'; ctx.lineWidth=1.2; for(let i=0;i<10;i++){ const a=i/10*TAU; ctx.beginPath(); ctx.moveTo(o.x+Math.cos(a)*18,o.y+Math.sin(a)*9); ctx.lineTo(o.x+Math.cos(a+0.6)*30,o.y+Math.sin(a+0.6)*15); ctx.stroke(); } },
  fspot(o){ const t=G.time; ctx.strokeStyle=`rgba(255,240,180,${0.35+0.2*Math.sin(t*3)})`; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.ellipse(o.x,o.y,18,9,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); },
  stage(o){ evStage(o); },
  torch(o){ const t=G.time;
    if(T3.on){ t3Begin(o.x,o.y,0,{k:1}); b3Reset(); bLn(0,0,0,0,0,22,1.6,'#5a3a1a'); bE(0,0,23,3.6,3.6,2.2,'#4a4a52'); t3End(); } else { ctx.fillStyle='#5a3a1a'; ctx.fillRect(o.x-1.5,o.y-24,3,24); ctx.fillStyle='#4a4a52'; ctx.beginPath(); ctx.ellipse(o.x,o.y-24,4,2.5,0,0,TAU); ctx.fill(); }
    if(o.lit){ const y=o.y-(T3.on?23*T3.st+8:30); glowAt(o.x,y,44,'255,170,80',0.55+0.1*Math.sin(t*9)); for(let i=0;i<3;i++){ ctx.fillStyle=['#ff7a30','#ffb050','#fff0a0'][i]; ctx.beginPath(); ctx.ellipse(o.x,y+2-i*2,5-i*1.4,8-i*2+Math.sin(t*12+i)*1.5,0,0,TAU); ctx.fill(); } } },
  fort(o){ const m=clamp(1-o.melt,0,1); if(m<=0.02){ ctx.fillStyle='rgba(200,215,235,.5)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,18,8,0,0,TAU); ctx.fill(); return; }
    if(T3.on){ t3Begin(o.x,o.y,o.face||0,{k:1}); b3Reset(); bE(0,0,4*m,16,10,7*m+1,'#eef4ff'); for(let i=-2;i<=2;i++) bB(1,i*5,9*m+1.5,3.2*m+0.5,'#f8fbff'); bE(-3,0,2,12,8,3,'#dfe8f6',0,0,0,-0.02); t3End(); }
    else { ctx.fillStyle='#eef4ff'; ctx.beginPath(); ctx.ellipse(o.x,o.y,18,10*m+2,0,0,TAU); ctx.fill(); } },
  wheel(o){ if(T3.on){ t3Begin(o.x,o.y+3,o.dir||0,{k:1.1}); b3Reset(); const r=o.roll||0; bE(0,0,10,10,4.2,10,'#e8b43a'); for(const sd of B3SD){ for(let i=0;i<14;i++){ const a=r+i/14*TAU; bF(i,Math.cos(a)*9.4,sd*4.3,10+Math.sin(a)*9.4); } bP(14,'#ffd860','#d8a030',sd*0.03); for(let i=0;i<3;i++){ const a=r+i*2.1+0.5, q=i===1?3.2:6; bD(Math.cos(a)*q,sd*4.5,10+Math.sin(a)*q,1.3,'#e0a830',sd*0.05); } } t3End(); o._t3top=o.y-24*T3.st; } else { ctx.fillStyle='#f2c444'; ctx.beginPath(); ctx.ellipse(o.x,o.y-6,11,8,0,0,TAU); ctx.fill(); ctx.strokeStyle='#c89020'; ctx.stroke(); } },
  bear(o){ evBear(o); },
  basket(o){ if(T3.on){ t3Begin(o.x,o.y,0.4,{k:1}); b3Reset(); bE(0,0,3.6,6.4,4.6,3.6,'#b8844a'); bE(0,0,6.6,5.6,4,1.2,'#e84a4a',0,0,0,0.02); for(const i of [-3,0,3]) bD(i,0,7.6,0.9,'#ffffff',0.04); bLn(0,-4,6,0,0,11,0.7,'#8a5a2a'); bLn(0,0,11,0,4,6,0.7,'#8a5a2a'); t3End(); } else { ctx.fillStyle='#b8844a'; ctx.fillRect(o.x-7,o.y-6,14,9); ctx.fillStyle='#e84a4a'; ctx.fillRect(o.x-6,o.y-8,12,3); } },
  fly(o){ const t=G.time, y=o.y-16+Math.sin(t*3+o.ph)*6, a=0.5+0.5*Math.sin(t*5+o.ph*3); glowAt(o.x,y,22,'220,255,120',0.45*a+0.2); ctx.fillStyle=`rgba(250,255,190,${0.6+0.4*a})`; ctx.beginPath(); ctx.arc(o.x,y,2.2,0,TAU); ctx.fill(); },
  frog(o){ evFrog(o); },
  bush(o){ const t=G.time, sh=o.shake?Math.sin(t*18)*0.08*(Math.sin(t*1.7)>0?1:0.2):0; const sp=SPR.bush&&SPR.bush[1]; if(sp) drawSprite(sp,o.x,o.y,1.25,sh); else { ctx.fillStyle='#3a6a2a'; ctx.beginPath(); ctx.arc(o.x,o.y,18,0,TAU); ctx.fill(); } },
  oven(o){ const t=G.time;
    if(T3.on){ t3Begin(o.x,o.y,Math.PI/2,{k:1}); b3Reset(); bE(0,0,6,10,10,8.4,'#9a8a7a'); for(let i=0;i<8;i++){ const a=i/8*TAU; bB(Math.cos(a)*9,Math.sin(a)*9,3,2.6,i%2?'#8a7a6a':'#aa9a88'); } bE(7.6,0,4.6,2,4.4,3.6,o.lit?'#ff8a3a':'#2a1a14',0,0,0,0.05); bLn(-3,0,13,-3,0,19,2.2,'#7a6a5a'); t3End(); }
    else { ctx.fillStyle='#9a8a7a'; ctx.beginPath(); ctx.arc(o.x,o.y-4,11,0,TAU); ctx.fill(); ctx.fillStyle=o.lit?'#ff8a3a':'#2a1a14'; ctx.beginPath(); ctx.ellipse(o.x,o.y+2,4,3,0,0,TAU); ctx.fill(); }
    if(o.lit) glowAt(o.x,o.y-2,40,'255,160,70',0.5+0.1*Math.sin(t*8)); },
  pen(o){}
};
function evKitten(x,y,scared){ if(T3.on&&T3B.cat){ const K=EV._kit||(EV._kit={x:0,y:0}); K.x=x; K.y=y; T3B.cat(K,G.time); } else { ell(x,y,6,4.5,'#e0a050'); ell(x+5,y-2,3.4,3,'#e0a050'); } if(scared&&Math.sin(G.time*2)>0.6){ ctx.fillStyle='rgba(255,255,255,.9)'; ctx.font=`700 9px ${UIF}`; ctx.textAlign='center'; ctx.fillText('mew',x+10,y-14); } }
function evTopHat(x,y,z,k){ if(T3.on){ t3Begin(x,y,0.3,{k,z}); b3Reset(); bE(0,0,0.6,6.6,6.6,0.7,'#1a1a22'); bE(0,0,4.6,4.2,4.2,4.4,'#22222a'); bE(0,0,1.8,4.4,4.4,0.9,'#8a2e22',0,0,0,0.02); t3End(); } else { ctx.fillStyle='#1a1a22'; ctx.beginPath(); ctx.ellipse(x,y-z,8,3.4,0,0,TAU); ctx.fill(); ctx.fillRect(x-5,y-z-12,10,12); ctx.fillStyle='#8a2e22'; ctx.fillRect(x-5,y-z-3,10,2); } }
function evMimic(o){ const t=G.time, open=o.awake?(o.snap>0?0.9:0.35+0.25*Math.max(0,Math.sin(t*3))):0, k=o.small?0.6:1, z=o.z||0;
  if(!o.awake) glowAt(o.x,o.y-4,30*k,'255,210,120',0.25+0.15*Math.sin(t*3));
  if(!T3.on){ ctx.save(); ctx.translate(o.x,o.y-z); ctx.scale(k,k); ctx.fillStyle='#6a4220'; ctx.fillRect(-15,-6,30,16); ctx.fillStyle='#8a5a2c'; ctx.fillRect(-15,-10-open*8,30,6); ctx.fillStyle='#d8b050'; ctx.fillRect(-2,-10-open*8,4,20); if(open>0.1){ ctx.fillStyle='#f6eedc'; for(let i=0;i<5;i++) ctx.fillRect(-12+i*6,-5,2,3); } ctx.restore(); return; }
  t3Begin(o.x,o.y+3,t3Turn(o,o.face||0,8),{k:k*1.15,z}); b3Reset();
  bE(0,0,4.6,9,12,4.6,'#7a4c24'); for(const sd of B3SD) bE(0,sd*7,5,9.2,1.3,4.9,'#d8b050',0,0,0,0.02);
  if(open>0.15){ bE(1,0,7.6,7.4,10.4,2,'#1a0806',0,0,0,0.03); bE(3,0,7.8,4.4,4,1,'#e86a7a',0,0,0,0.05); for(let i=0;i<6;i++) bC(8.2,-8.4+i*3.4,8.8,8.6,-8.4+i*3.4,7.2,0.85,'#f6eedc',0.06); }
  b3Push(); b3Rot(1,-open*1.1,-8.6,0,9.4); bE(0,0,11.4,9,12,3.4,'#9a6a34'); for(const sd of B3SD) bE(0,sd*7,11.6,9.2,1.3,3.6,'#d8b050',0,0,0,0.02); bD(9.2,0,10.8,1.4,'#e8c050',0.05);
  if(o.awake){ for(const sd of B3SD){ bEye(8.4,sd*4.4,13.4,1.6,'#ffe066',false); bD(8.9,sd*4.4,13.4,0.7,'#1a1008',0.03); } if(open>0.15) for(let i=0;i<6;i++) bC(8.4,-8.4+i*3.4,9.8,8.8,-8.4+i*3.4,11.2,0.85,'#f6eedc',0.06); }
  b3Pop(); t3End(); o._t3top=o.y-(18+z)*k*T3.st; }
function evDrawPen(o,half){
  const N=16, t=G.time;
  if(!T3.on){ ctx.strokeStyle='#7a5a32'; ctx.lineWidth=2; ctx.beginPath(); if(half<0) ctx.ellipse(o.x,o.y,o.r,o.r*0.6,0,Math.PI,TAU); else ctx.ellipse(o.x,o.y,o.r,o.r*0.6,0,0,Math.PI); ctx.stroke(); return; }
  if(half<0){ ctx.fillStyle='rgba(150,190,90,.22)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,o.r,o.r*0.62,0,0,TAU); ctx.fill(); }
  t3Begin(o.x,o.y,0,{k:1}); b3Reset();
  for(let i=0;i<N;i++){ const a=i/N*TAU, s=Math.sin(a); if((half<0)!==(s<0)) continue; if(i===4) continue; const x=Math.cos(a)*o.r, y=s*o.r, a2=(i+1)/N*TAU; bE(x,y,6,1.6,1.6,6.4,'#8a6238'); if(i+1!==4) { const x2=Math.cos(a2)*o.r, y2=Math.sin(a2)*o.r; bLn(x,y,9,x2,y2,9,1.1,'#a07848'); bLn(x,y,4.5,x2,y2,4.5,1.1,'#a07848'); } }
  t3End(); }
function evStage(o){
  const t=G.time;
  if(!T3.on){ ctx.fillStyle='#8a6a42'; ctx.fillRect(o.x-40,o.y-20,80,34); ctx.fillStyle='#a83a3a'; ctx.fillRect(o.x-44,o.y-44,88,10); return; }
  t3Begin(o.x,o.y,Math.PI/2,{k:1}); b3Reset();
  bE(0,0,3,16,28,3,'#8a6a42'); for(const i of [-18,-6,6,18]) bE(0,i,6.2,15.5,0.5,0.4,'#6a4a2a',0,0,0,0.02);
  for(const sd of B3SD){ bLn(-12,sd*27,5,-12,sd*27,36,1.6,'#5a3a1a'); bE(-12,sd*20,22,2,7.4,15,'#b83a3a',0,0,0,0.01); bE(-12,sd*24,22,1.6,3,15.4,'#8a2a2a',0,0,0,0.015); }
  bE(-13,0,22,1.2,14,14.6,'#3a1a3a',0,0,0,-0.02);
  bE(-12,0,37,2,29,2.4,'#e8b040'); for(let i=-3;i<=3;i++) bD(-11,i*7.5,35,1.6,['#ff7aa0','#ffe066','#7ae0ff'][(i+3)%3],0.04);
  t3End();
}
function evBear(o){
  const t=o.t||0, sl=o.sleep&&!o.away, br=sl?Math.sin(t*1.6)*0.6:0;
  if(sl&&Math.sin(t*1.2)>0){ const f=(t*0.5)%1; ctx.fillStyle=`rgba(255,255,255,${0.85*(1-f)})`; ctx.font=`700 ${10+f*6}px ${UIF}`; ctx.textAlign='center'; ctx.fillText('Z',o.x+14+f*10,o.y-30-f*24); }
  if(!T3.on){ ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.face||0); ell(0,0,20+br,14,'#7a5236'); ell(18,0,9,8,'#7a5236'); ell(24,0,4,3.4,'#c89a70'); ctx.restore(); return; }
  const f=t3Turn(o,o.face||0,4), walk=o.moving?Math.sin(t*7):0;
  t3Begin(o.x,o.y+6,f,{k:1.25}); b3Reset(); if(o.roll) b3Rot(0,0.5,0,0,0);
  const fur='#7a5236', dk='#5a3a24', z0=sl?0:4;
  for(const [x,sd] of [[8,-1],[8,1],[-8,-1],[-8,1]]){ const s=walk*sd*(x>0?1:-1)*2; bE(x+s+(sl?2:0),sd*6.4,z0?3:1.8,4,3,sl?2:4,dk); }
  bE(0,0,(sl?7:12)+br*0.4,15+br*0.3,10.6+br*0.3,sl?7:9,fur); bE(-14,0,(sl?7:12),3,3,3,shd(fur,0.2));
  const hz=sl?6:16; bB(14,0,hz,7,fur); for(const sd of B3SD) bB(12,sd*5,hz+5.6,2.4,dk); bE(19,0,hz-1.6,3.8,3.2,2.8,'#c89a70'); bD(22.4,0,hz-0.6,1.1,'#1a1008',0.04);
  for(const sd of B3SD){ if(sl) bLn(17.4,sd*2.4,hz+1.6,18.2,sd*3.6,hz+1.2,0.5,'#1a1008',0.04); else { bD(17.6,sd*2.6,hz+1.8,1.1,'#1a1008',0.04); bD(17.9,sd*2.4,hz+2.2,0.4,'#ffffff',0.05); } }
  t3End(); o._t3top=o.y-(sl?20:30)*1.25*T3.st;
}
function evFrog(o){
  const t=o.t||0, k=(o.s||1), cr=o.croak||0;
  ctx.fillStyle='rgba(70,140,60,.85)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+2,11*k,6*k,0,0.25,TAU-0.25); ctx.lineTo(o.x,o.y+2); ctx.closePath(); ctx.fill();
  if(!T3.on){ ell(o.x,o.y-2,5*k,4*k,'#5a9a34'); for(const s of [-1,1]) ell(o.x+s*2.5*k,o.y-5*k,1.6*k,1.6*k,'#fff'); return; }
  t3Begin(o.x,o.y+1,t3Turn(o,o.face||0,6),{k:k*0.9,z:cr*2}); b3Reset();
  bE(0,0,3,4,4.6,2.8,'#5a9a34'); for(const sd of B3SD){ bE(-1.4,sd*4.4,1.6,2.6,1.4,1.2,'#4a8a2a'); bB(2,sd*2.2,5.4,1.5,'#6ab040'); bD(2.6,sd*2.3,5.8,0.9,'#1a1a08',0.03); bD(2.8,sd*2.1,6.2,0.35,'#ffffff',0.04); }
  bE(3.2,0,2.4,1.6+cr*1.2,2.2+cr*1.4,1.2+cr*1.1,'#e8f0a0',0,0,0,0.04);
  if(o.lord){ for(let i=0;i<5;i++){ const a=i/5*TAU; bC(Math.cos(a)*1.6+0.4,Math.sin(a)*1.6,6.6,Math.cos(a)*1.9+0.4,Math.sin(a)*1.9,8.6,0.6,'#f0c838',0.05); } bE(0.4,0,6.6,2,2,0.6,'#e0b030',0,0,0,0.04); }
  t3End(); o._t3top=o.y-(10+cr*2)*k*0.9*T3.st;
}
function evDrawCarry(){
  const C=EV.carry, p=player; if(!C) return; const z=(p.z||0), y=p.y-(T3.on&&p._t3top!=null?p.y-p._t3top+2:44)-z*0.2;
  if(C.k==='kitten') evKitten(p.x,y+2,false);
  else if(C.k==='hat') evTopHat(p.x,y+10,0,1);
  else if(C.k==='basket'){ if(T3.on){ t3Begin(p.x,y+10,0.4,{k:1}); b3Reset(); bE(0,0,3.6,6.4,4.6,3.6,'#b8844a'); bE(0,0,6.6,5.6,4,1.2,'#e84a4a',0,0,0,0.02); t3End(); } else { ctx.fillStyle='#b8844a'; ctx.fillRect(p.x-7,y,14,9); } }
}
function evDrawFx(){
  const t=G.time;
  for(const f of EV.fx){
    if(f.k==='streak'){ if(f.t<0) continue; const u=f.t/f.life, x=f.x+f.vx*f.t, y=f.y+f.vy*f.t, a=Math.sin(u*Math.PI); ctx.strokeStyle=`rgba(255,248,220,${0.85*a})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-f.vx*0.12,y-f.vy*0.12); ctx.stroke(); glowAt(x,y,10,'255,240,200',0.6*a); }
    else if(f.k==='snowball'||f.k==='bun'){ const u=clamp(f.t/f.dur,0,1), x1=f.tgt?f.tgt.x:f.x1, y1=f.tgt?f.tgt.y-10:f.y1, x=lerp(f.x0,x1,u), y=lerp(f.y0,y1,u)-Math.sin(u*Math.PI)*50;
      ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x,lerp(f.y0+16,y1+10,u),4,2,0,0,TAU); ctx.fill();
      if(f.k==='snowball'){ ctx.fillStyle='#f8fbff'; ctx.beginPath(); ctx.arc(x,y,4.2,0,TAU); ctx.fill(); ctx.fillStyle='rgba(180,200,230,.7)'; ctx.beginPath(); ctx.arc(x+1.2,y+1.2,2,0,TAU); ctx.fill(); }
      else { ctx.fillStyle='#c8843a'; ctx.beginPath(); ctx.ellipse(x,y,6,4.6,t*6,0,TAU); ctx.fill(); ctx.fillStyle='#f0c070'; ctx.beginPath(); ctx.ellipse(x-1.5,y-1.5,2.4,1.4,t*6,0,TAU); ctx.fill(); } }
    else if(f.k==='heart'){ if(f.t<0) continue; const a=clamp(1-f.t/2.2,0,1), ang=f.i/5*TAU+f.t*0.8, r=14+f.t*14, x=f.x+16*Math.pow(Math.sin(ang),3)*(r/16), y=f.y-f.t*30-(13*Math.cos(ang)-5*Math.cos(2*ang)-2*Math.cos(3*ang)-Math.cos(4*ang))*(r/16); glowAt(x,y,16,'220,255,120',0.6*a); }
  }
}
function evDrawFog(E){
  const a=E.d.fog, t=G.time; if(a<=0) return;
  const cx=cam.x+W/zoom/2, cy=cam.y+H/zoom/2, R=Math.max(W,H)/zoom;
  for(let i=0;i<18;i++){ const ph=i*2.4, x=cx+Math.cos(ph+t*0.05)*R*0.45+Math.sin(t*0.1+i)*40, y=cy+Math.sin(ph*1.3+t*0.04)*R*0.32; const g=ctx.createRadialGradient(x,y,0,x,y,R*0.28); g.addColorStop(0,`rgba(225,232,244,${0.22*a})`); g.addColorStop(1,'rgba(225,232,244,0)'); ctx.fillStyle=g; ctx.fillRect(x-R*0.28,y-R*0.28,R*0.56,R*0.56); }
}

// ================= debug hooks (tests)
function evInfo(){ const E=EV.E; return E?{id:E.id,phase:E.phase,plan:E.plan,t:+E.t.toFixed(1),actT:+E.actT.toFixed(1),x:Math.round(E.x),y:Math.round(E.y),d:JSON.parse(JSON.stringify(E.d,(k,v)=>typeof v==='number'?Math.round(v*100)/100:v)),
  ents:E.ents.map((o,i)=>({i,k:o.k,id:o.id||null,x:Math.round(o.x),y:Math.round(o.y),use:!!(o.use&&!o.hide),mark:o.mark||null,hide:!!o.hide,fire:!!o.fire,hit:!!o.hit,gone:!!o.gone})),
  carry:EV.carry?EV.carry.k:null,foes:E.foes?evFoesLeft(E):null}:null; }
window.__ebDbg=Object.assign(window.__ebDbg||{},{evDrawKob,EVDRAW,evMimic,evBear,evFrog,evStage,evTopHat,evKitten});
window.__ebX=Object.assign(window.__ebX||{},{
  startEvent:(id,soft)=>{ if(EV.g!==G) evReset(); return evStart(id,!soft); },
  evInfo, evList:()=>Object.keys(EVD), evHist:()=>EV.hist.slice(), evFlags:()=>Object.fromEntries(Object.entries(G.flags).filter(([k])=>/^(ev_|tk_|dr_)/.test(k))),
  evUse:(i)=>{ const E=EV.E; if(!E) return false; const o=i==null?E.ents.find(q=>q.use&&!q.hide):E.ents[i]; if(!o||!o.use) return false; player.x=o.x; player.y=o.y+30; o.use.fn(o); return true; },
  evGive:()=>{ const C=EV.carry; if(!C) return false; player.x=C.to.x; player.y=C.to.y+30; C.fn(); return true; },
  evHit:(i)=>{ const E=EV.E; if(!E) return false; const o=E.ents[i]; if(!o) return false; o.hitT=0; evSwing(o.x-30,o.y,0,80,Math.PI); return true; },
  evFire:(i,secs)=>{ const E=EV.E; if(!E) return false; const o=E.ents[i]; if(!o) return false; for(let k=0;k<Math.round((secs||1)*30);k++) evBreath(o.x-60,o.y,0,1/30); return true; },
  evEnd:()=>{ if(EV.E){ evEnd(EV.E,false); EV.E&&evClear(EV.E); } }, evKillFoes:()=>{ const E=EV.E; if(E&&E.foes) for(const f of E.foes) if(!f.dead) killEnemy(f); },
  evDirector:()=>({free:+EV.free.toFixed(1),gap:+EV.gap.toFixed(1),exploring:evExploring(),cur:EV.E?EV.E.id:null,lastEnd:+EV.lastEnd.toFixed(1)}),
  evNudge:(s)=>{ EV.free=Math.max(EV.free,EV.gap-(s||0)); EV.lastEnd=-999; },
  evSet:(i,o)=>{ const E=EV.E; if(!E||!E.ents[i]) return false; Object.assign(E.ents[i],o); return true; }, evData:(o)=>{ const E=EV.E; if(!E) return false; Object.assign(E.d,o); return true; }, evCtx, evPick:()=>evPick(evCtx()),
  dream:(id)=>dreamStart(id), dreamFor:()=>dreamFor(G.stage), dreamHook, dreamOpenTest:()=>!!EV.dream,
  evGreet:(id)=>evGreet(id), dreamTalkReset:()=>{ for(const k in G.flags) if(k.startsWith('drt_')) delete G.flags[k]; },
  tkSet:(n,o)=>{ G.flags.tk_n=n; Object.assign(G.flags,o||{}); }, evAlly:()=>EV.ally?{x:Math.round(EV.ally.x),y:Math.round(EV.ally.y),kids:EV.ally.kids.length}:null, evEpilogue
});
