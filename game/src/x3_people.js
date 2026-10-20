
// ================= Act IV, Moonfall: the people and the side quests (x3_people.js)
// The named people of Driftwood Landing, Coralcombe (the merfolk, with fish tails) and the Oasis of Sable (looks, homes,
// spots, talk, barks, chats, greetings, shops), the returning cast in Moonfall (Dell, Wren, Mags, Tikka, Glaciar,
// Juniper, Vesper, and Mom and Quill at the Moon Pier), the ten Act IV side quests (m_glaive, m_leash, m_lamps,
// m_moonfish, m_race, m_ferry, m_tidebombs, m_noodle, m_vesper in two versions, m_lighthouse) with their places and
// minigames, Pebble's letters m_pb_1..4 and m_pb_oil, Tamsin's Act IV verse, Duchess in Drowned Lumen and EPI.m.
// Design: scratchpad/bible/ACT4.md sections 4, 10, 11 and 13; THREADS.md. Doc for other helpers: scratchpad/M3PEOPLE.md.
// Everything is wrapped from here (no engine edits). Names in this file start with m3p / M3P (one shared scope).

// ---------- 0. small helpers
const m3pL=(who,full,simple)=>[who,S(full,simple)];
const m3pN=(full,simple)=>['narr',S(full,simple)];
const m3pDo=fn=>({who:'narr',text:'',fn,skipIf:()=>true});
const m3pIf=(cond,who,full,simple)=>({who,text:S(full,simple),skipIf:()=>!cond()});
const m3pQ=id=>!!(G&&G.quests&&G.quests[id]&&G.quests[id].done);
const m3pAt=(id,n)=>{ const q=G&&G.quests&&G.quests[id]; return !!q&&!q.done&&q.step===n; };
const m3pOn=id=>{ const q=G&&G.quests&&G.quests[id]; return !!q&&!q.done; };
const m3pR=st=>stageAt(st)>=0&&reached(st);   // reached() on an unknown id is always true: never trust it
const m3pAct=()=>G?actOf(G.stage):1;
const m3pIV=()=>!!G&&G.mode==='story'&&(m3pAct()>=4||!!G.flags.m_done);
// the Moonfall map module (x3_world) is not in this build: a small stand-in world is laid down for the tests
const M3P_STAND=!!(MAPS[3]&&MAPS[3].placeholder);
const M3P={err:0,base:{},sig:'',syncT:0,ready:false,carry:null,fish:null,noodle:null,race:null,sent:null,lampHeat:{},postT:{},
  breath:{},moonT:{},gapSide:0,cry:0,glint:0,beamA:0,vaultT:0,duchSeen:false,sandyN:null,lastArea:null,fishOn:false,noDuchess:false,noVault:false};
function m3pSay(lines,cb){ runDialogue(lines,()=>{ scene='play'; if(cb) cb(); saveGame(); }); }
function m3pBanner(a,b,t){ setBanner(a,b||'',t||2.6); }
function m3pHeart(id){ if(typeof gainHeartEmber==='function') return gainHeartEmber(id); if(G.found['he_'+id]) return false; G.found['he_'+id]=true; player.maxHp+=10; player.hp=player.maxHp; setBanner(S('Heart Ember!','Heart Ember!'),S('Your heart burns brighter. +10 health.','+10 health!'),2.6); return true; }
function m3pLvl(x,y){ return typeof elevLvl==='function'&&x<IZX-50?elevLvl(x,y):0; }
function m3pHere(){ return typeof elevOf==='function'&&!AREA?elevOf(player):0; }
// a spot up high: where the map has real elevation Ash must be at its level; where it has none the power is enough
function m3pHigh(x,y,abil){ const l=m3pLvl(x,y), g=m3pGround(x,y); if(l>0&&l>g) return m3pHere()>=l; return !abil||hasAbil(abil); }
function m3pGround(x,y){ if(typeof elevLvl!=='function') return 0; let m=99; for(const [dx,dy] of [[200,0],[-200,0],[0,200],[0,-200]]) m=Math.min(m,elevLvl(x+dx,y+dy)); return m===99?0:m; }
function m3pFoe(type,alt,x,y,o){ const t=EDEF[type]?type:alt; if(!EDEF[t]) return null; const e=makeEnemy(t,x,y,Object.assign({level:Math.max(17,(regionAt(x,y)||{}).level||18),aggro:true,homeX:x,homeY:y,leash:800},o||{})); e.spawnIn=0.3; return e; }
const M3PT={};
function m3pT(x,y){ return T(x,y,M3PT); }
function m3pWater(x,y){ return !!m3pT(x,y).water; }
function m3pDeep(x,y){ if(typeof p4DeepAt==='function') return p4DeepAt(x,y); const o=m3pT(x,y); return !!o.water&&(o.depth||0)>=0.5; }
function m3pSand(x,y){ if(x>=IZX-50) return true; if(typeof p4SandAt==='function') return p4SandAt(x,y); const o=m3pT(x,y); return (o.sand||0)>0.5&&!o.water; }
const m3pDiving=()=>typeof p4Diving==='function'&&p4Diving();
const m3pBurrowed=()=>typeof p4Burrowed==='function'&&p4Burrowed();
const m3pSwimming=()=>typeof p4Swimming==='function'&&p4Swimming();
const m3pMoonHits=(x,y,r)=>typeof p4MoonHits==='function'&&p4MoonHits(x,y,r);
const m3pEasy=()=>typeof diffIdx!=='undefined'&&diffIdx===0;
const m3pDay=()=>typeof dayNow==='function'?dayNow():0;
function m3pTod(){ return G&&G.tod!=null?((G.tod%1)+1)%1:0.5; }
const m3pNoon=()=>{ const t=m3pTod(); return t>0.36&&t<0.68; };
const m3pNight=()=>{ const t=m3pTod(); return t>0.78||t<0.2; };
function m3pRoom(A,id){ return A&&A.rooms?A.rooms[id]||null:null; }
function m3pDun(A,id){ if(!A||!A.def) return false; const d=A.def; return d.dun===id||d.id===id||String(d.id).startsWith(id+'_'); }
function m3pFree(x,y,r){ if(!AREA) return {x,y}; if(!areaBlocked(x,y)) return {x,y}; for(let rr=24;rr<(r||200);rr+=24) for(let a=0;a<TAU;a+=0.5){ const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr; if(!areaBlocked(px,py)) return {x:px,y:py}; } return {x,y}; }
// outdoors: the nearest spot Ash can stand on at the same height (a person whose spot ends up in water or a cliff face
// on the real map steps onto dry ground, ACT II lesson: real map, real heights)
function m3pDry(x,y,lvl){
  const inHouse=(px,py)=>HOUSES.some(h=>h.w&&Math.abs(px-h.x)<h.w/2+10&&py>h.y-h.h/2-20&&py<h.y+h.h/2+6);
  const ok=(px,py)=>{ try{ if(blockedAt(px,py)||colAt(px,py,12)||inHouse(px,py)) return false; if(typeof playerBlocked==='function'&&playerBlocked(px,py)) return false; return lvl==null||m3pLvl(px,py)===lvl; }catch(e){ return true; } };
  if(ok(x,y)) return null;
  for(let d=12;d<=260;d+=12){ const k=Math.max(8,Math.round(d/8)); for(let i=0;i<k;i++){ const a=i/k*TAU+Math.PI/2, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; if(ok(px,py)) return {x:px,y:py}; } }
  return null;
}
// a quest landmark of ours and a look-at landmark of the map module on the same spot: while ours is shown, theirs
// gives up its prompt (its art stays), so E does the quest (ACT II lesson 4). Found by distance, since the map module
// names its own landmarks.
function m3pOver(o,r){
  if(!o) return o; r=r||70;
  for(const w of LANDMARKS){
    if(w===o||String(w.id||'').startsWith('m3p')||w.m3pYield||dist(w.x,w.y,o.x,o.y)>r) continue;
    const d0=Object.getOwnPropertyDescriptor(w,'prompt'); if(!d0) continue;
    w.m3pYield=true;
    Object.defineProperty(w,'prompt',{configurable:true,enumerable:true,get(){ try{ if(!(o.hidden&&o.hidden())) return null; }catch(e){} return d0.get?d0.get.call(w):d0.value; }});
  }
  return o;
}

// ---------- 1. speakers who are not people, and their portraits
Object.assign(SPK,{
  m_sandy:SPK.m_sandy||{name:'Queen Sandy',col:'#e8c070'},
  m_noodle:SPK.m_noodle||{name:'Noodle',col:'#f0c880'},
  m_moonfish:SPK.m_moonfish||{name:'The Moonfish',col:'#dfe8ff'},
  f_glaciar:SPK.f_glaciar||{name:'Glaciar',col:'#bfe4ff'},
  f_mags:SPK.f_mags||{name:'Mags Sprocket',col:'#e8a040'},
  m_sentry:SPK.m_sentry||{name:'Moth Knight',col:'#b8a8e8'}
});
// (v12 FACES) the sandworm kids (Sandy with her bow, little Noodle) and the moonfish show the line's mood (a12a_dlg's kit)
function m3pFaceWorm(g,big){
  const k=big?1:0.8, X=PX; g.save(); g.scale(k,k); pxPose(g,{py:64}); pxAura(g,0,0,78);
  g.fillStyle='#c89a52'; g.beginPath(); g.ellipse(0,40,56,30,0,0,TAU); g.fill();
  const gr=g.createRadialGradient(-14,-20,6,0,0,70); gr.addColorStop(0,'#ffe6a8'); gr.addColorStop(0.55,'#e8b866'); gr.addColorStop(1,'#a8743a'); g.fillStyle=gr;
  g.beginPath(); g.ellipse(0,0,50,52,0,0,TAU); g.fill(); g.strokeStyle='#5a3a18'; g.lineWidth=3; g.stroke();
  g.strokeStyle='rgba(120,80,30,.5)'; g.lineWidth=2.4; for(const y of [-26,-8,10,28]){ g.beginPath(); g.ellipse(0,y,44-Math.abs(y)*0.4,7,0,0.2,Math.PI-0.2); g.stroke(); }
  for(const s of [-1,1]) pxEye(g,s*17,-10,s,{rx:big?9:11,ry:big?8.5:11,r:big?4.2:6,white:'#fff8e8',iris:'#2a1808',skin:'#ecbc6c',lash:'#5a3a18'});
  pxBrows(g,{x:17,w:6,y:big?-23:-26,col:'#8a5a28',lw:3,arch:2.4,busy:true});
  if(big){ g.save(); g.translate(0,-50); g.rotate(-(X.ear||0)*0.12); g.fillStyle='#e85a6a'; g.beginPath(); g.moveTo(-26,6); g.lineTo(-12,-10); g.lineTo(0,4); g.lineTo(12,-10); g.lineTo(26,6); g.closePath(); g.fill(); g.strokeStyle='#5a3a18'; g.lineWidth=2; g.stroke(); g.restore(); }
  else if(!(X.blush>1)){ g.fillStyle='rgba(255,140,140,.5)'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*28,8,7,4,0,0,TAU); g.fill(); } }
  pxMouth(g,{y:16,w:big?10:8,c:6,col:'#5a3a18',lw:3,dark:'#4a1a10',tongue:'#e8707a'});
  pxExtras(g,{ex:17,ey:-10,erx:big?9:11,ery:big?8.5:11,cheek:10,top:-34,side:48,no:{blush:!big&&!(X.blush>1)},halo:-66});
  g.restore();
}
function m3pFaceFish(g){
  const X=PX, op=pxOpenMouth();
  g.save(); pxPose(g,{py:40}); glowAtM(g,0,0,90,'210,225,255',X.n==='sad'||X.n==='defeated'?0.18:0.35); pxAura(g,-20,0,70);
  g.save(); g.translate(0,-30); g.rotate(-pxEarTurn(0.2,0.35)); g.fillStyle='#b8c8f0'; g.beginPath(); g.moveTo(-24,4); g.quadraticCurveTo(0,-26,26,4); g.closePath(); g.fill(); g.strokeStyle='#4a5a8a'; g.lineWidth=3; g.stroke(); g.restore();
  g.fillStyle='#dfe8ff'; g.beginPath(); g.ellipse(0,0,56,34,0,0,TAU); g.fill(); g.strokeStyle='#4a5a8a'; g.lineWidth=3; g.stroke();
  g.fillStyle='#b8c8f0'; g.beginPath(); g.moveTo(50,0); g.lineTo(80,-26); g.lineTo(80,26); g.closePath(); g.fill(); g.stroke();
  pxEye(g,-30,-6,1,{rx:9,ry:9,r:4.6,white:'#fff',iris:'#1a2040',skin:'#dfe8ff',lash:'#4a5a8a'});
  g.save(); g.translate(-30,0); pxBrows(g,{x:0,w:6,y:-18,col:'#6a7ab0',lw:2.6,arch:2,only:1,busy:true}); g.restore();
  // the mouth at the front of the face: it opens to an O, smiles or droops
  g.save(); g.translate(-46,10); g.rotate(0.35); pxMouth(g,{y:0,w:5,c:3,col:'#4a5a8a',lw:2.4,dark:'#2a3050',tongue:'#e8a0b0'}); g.restore();
  if(op>0.4){ g.strokeStyle='rgba(220,240,255,.85)'; g.lineWidth=1.6; for(const [x,y,r] of [[-64,-6,4],[-70,-18,3],[-66,-30,2.2]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.stroke(); } }
  g.strokeStyle='rgba(120,140,200,.6)'; g.lineWidth=2; for(let i=0;i<4;i++){ g.beginPath(); g.arc(4+i*12,0,16,-0.9,0.9); g.stroke(); }
  pxExtras(g,{ex:30,ey:-6,erx:9,ery:9,cheek:8,top:-26,side:48,no:{blush:true}});
  g.restore();
}
function glowAtM(g,x,y,r,col,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
if(typeof EVPORT!=='undefined'){
  if(!EVPORT.m_sandy) EVPORT.m_sandy={bg:'#3a2a14',f:g=>m3pFaceWorm(g,true)};
  if(!EVPORT.m_noodle) EVPORT.m_noodle={bg:'#3a2a14',f:g=>m3pFaceWorm(g,false)};
  if(!EVPORT.m_moonfish) EVPORT.m_moonfish={bg:'#16224a',f:m3pFaceFish};
  if(!EVPORT.f_glaciar&&typeof faceDragon==='function') EVPORT.f_glaciar={bg:'#16304a',f:g=>faceDragon(g,{skin:'#bfe4ff',dark:'#3a6a9a',snout:'#e6f6ff',horn:'#f4fbff',eye:'#7ad8ff',k:1,big:true,frill:true})};
  if(!EVPORT.m_sentry) EVPORT.m_sentry={bg:'#1e1630',f:g=>{ if(typeof c1FaceMoth==='function') c1FaceMoth(g,true); else glowAtM(g,0,0,80,'184,168,232',0.4); }};
}

// ---------- 2. items (ACT4 2 and 10)
Object.assign(ITEM_NAMES,{
  m_mooncrumb:ITEM_NAMES.m_mooncrumb||S('A crumb of the moon','A moon crumb'),
  m_book_raw:ITEM_NAMES.m_book_raw||S('A soggy book with a moth on the cover','A soggy moth book'),
  m_book:ITEM_NAMES.m_book||S('The Moon-Priests’ Book of Moths','The Book of Moths'),
  m_stariron:ITEM_NAMES.m_stariron||S('Star-iron from the Fallen Star','Star-iron'),
  m_lampoil:ITEM_NAMES.m_lampoil||S('Everlasting Lamp Oil','Lamp oil that never runs out'),
  m_vletter:ITEM_NAMES.m_vletter||S('A letter a moth dropped, to “my duck”','A letter to “my duck”'),
  m_sandwich:S('Squint’s fish sandwich (for Grandpa Ned)','A fish sandwich for Ned'),
  m_tideproto:S('Mags’s prototype Tide Bombs','Tide Bomb prototypes'),
  m_smokebomb:S('Vesper’s moth-smoke bombs','Moth-smoke bombs'),
  m_rope:S('Rowan’s ferry line','The ferry line')
});
// a desert hat from Jinx (worn like the Sky Feather; the hat name is the key)
const M3P_HATS={m_hat_desert:'Desert Hat'};
function m3pHat(item){ const h=M3P_HATS[item]; if(!h) return; G.hats=G.hats||{}; G.hats[h]=true; G.hat=h; }
{ const base=drawHatShape; drawHatShape=function(x,y,k,s){
  if(k==='Desert Hat'){ s=s||1; ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle='#e8c878'; ctx.beginPath(); ctx.arc(0,0,9,0,TAU); ctx.fill(); ctx.fillStyle='#c8a050'; ctx.beginPath(); ctx.arc(0,0,4.5,0,TAU); ctx.fill(); ctx.fillStyle='#c84a3a'; ctx.fillRect(-4.5,-1.2,9,2.4); ctx.restore(); return; }
  return base(x,y,k,s); }; }
{ const base=ashHat; ashHat=function(k){
  if(k==='Desert Hat'){ const z0=6.2; aE(0,0,z0-1.6,11.5,12,1.2,'#e8c878'); aE(0,0,z0+0.6,6.2,6.6,3.6,'#e8c878'); aE(0,0,z0-0.6,6.4,6.8,1.2,'#c84a3a'); aL(-5.4,0,z0-1.2,-10.5,1.5,z0-6.5,1.3,'#c84a3a',0.9); return; }
  return base(k); }; }

// ---------- 3. the Act IV stage ids (ACT4 6.0): registered here only if the story module does not ship them, so `min`
// gates never meet an unknown stage. Runs at world build, after every module has loaded.
const M3P_STAGES=['m_sail','m_drift','m_lumen','m_coral','m_reef','m_sable','m_burrows','m_glasswall','m_mirror','m_moonpath','m_observatory','m_reforge'];
function m3pStagesFallback(){
  const miss=M3P_STAGES.filter(s=>stageAt(s)<0); if(!miss.length) return;
  const CH={m_sail:'Across the Sea',m_drift:'Across the Sea',m_lumen:'Drowned Lumen',m_coral:'Drowned Lumen',m_reef:'The Glass Desert',m_sable:'The Glass Desert',m_burrows:'The Glass Desert',
    m_glasswall:'Mirrors',m_mirror:'Mirrors',m_moonpath:'The Eclipse Observatory',m_observatory:'The Eclipse Observatory',m_reforge:'The Ember Heart'};
  if(typeof defineStages==='function') defineStages(4,miss.map(id=>({id,chapter:CH[id]||'Moonfall'})));
  else for(const s of miss) STAGES.push(s);
}

// ---------- 4. the people (ACT4 4.1 to 4.3). Home order inside each town is a save key (assignHomesNew): append only.
// Driftwood homes: dabble, winnie, rowan, gilly. Sable homes: rafi, kiln, esme. Merfolk live inside Coralcombe (an area).
const M3P_TOWNS=['m_driftwood','m_sable','m_coralcombe'];
const M3P_CT=M3P_TOWNS.map(t=>'town:'+t).join('|');
const M3P_NOT=M3P_TOWNS.map(t=>'!town:'+t).join('|');
const M3P_DW='town:m_driftwood', M3P_SB='town:m_sable', M3P_CC='town:m_coralcombe';
const M3P_CAST=[
  // Driftwood Landing
  {id:'m_dabble',name:'Mayor Dabble Floatwell',town:'m_driftwood',home:true,house:'The Mayor’s Barge',job:'mayor',col:'#3a7a8a',
    look:{skin:'#e6b494',hair:'#8a5a2a',hairdo:'curly',outfit:'coat',shirt:'#3a7a8a',low:'#2a5a6a',hat:'top',hatc:'#3a5a7a',sash:'#e8c03a',stache:'big',build:'wide',blush:true},
    lines:[S(`Driftwood Landing: the only town that's never in the same place twice!`,`Our town floats. It is never in the same place twice!`),
      S(`My socks have been wet for eleven years. I've made my peace with it.`,`My socks have been wet for eleven years. It's fine.`),
      S(`If you see a raft full of chickens, it's ours. Wave. They like waving.`,`See a raft of chickens? It's ours. Wave!`)]},
  {id:'m_winnie',name:'Old Winnie the Tidewife',town:'m_driftwood',home:true,house:'The Shell Hut',job:'scholar',col:'#9ad0c8',
    look:{skin:'#9a6444',hair:'#efeae0',hairdo:'long',outfit:'robe',shirt:'#3a6a6a',low:'#2a4a4a',shawl:'#9ad0c8',hat:'fancy',hatc:'#f0d0b0',necklace:'#f0e0c0',build:'old',hold:'staff'},
    lines:[S(`The tide follows the moon, child. When someone eats the moon, the tide gets the hiccups.`,`The tide follows the moon. Bite the moon and the tide gets hiccups.`),
      S(`Ollie says hello. Ollie is an octopus. Ollie lives in my teapot. Don't make tea.`,`Ollie the octopus lives in my teapot. Don't make tea.`),
      S(`I've counted every high tide for sixty years. Lately they come twice before breakfast. Rude.`,`The tide comes in twice before breakfast now. Rude!`)]},
  {id:'m_rowan',name:'Rowan Knotwood',town:'m_driftwood',home:true,house:'The Rope Shed',job:'home',col:'#c84a3a',
    look:{skin:'#c8946c',hair:'#3a2a1a',hairdo:'braids',outfit:'vest',shirt:'#7a6a3a',low:'#4a5a6a',hat:'kerchief',hatc:'#c84a3a',build:'strong',hold:'mallet'},
    lines:[S(`This is a "nice to meet you" knot. This one's a "please leave my raft". Different knot.`,`This knot means hello. This one means get off my raft.`),
      S(`The Crab Pirates cut my ferry lines. Pirates. Crab pirates. Crabby pirates.`,`Crab Pirates cut my ferry lines. Crabby pirates!`),
      S(`Every raft in this town is tied to every other raft. If one goes, we all go. That's not a knot. That's a town.`,`Every raft is tied to every other raft. That's a town.`)]},
  {id:'m_squint',name:'Squint',town:'m_driftwood',kid:true,col:'#e8c03a',
    look:{skin:'#e8bc98',hair:'#e8c060',hairdo:'spiky',outfit:'tunic',shirt:'#e8c03a',low:'#3a6aaa',hold:'telescope',eyepatch:true},
    lines:[S(`Land ho! ...Oh. That's Palmcrest. It's always there. Land ho anyway.`,`Land ho! ...Oh. It's just Palmcrest. land ho anyway!`),
      S(`I wear an eyepatch so I'm always ready to be a pirate. I'm not a pirate. I'm ready.`,`My eyepatch is pretend. I'm not a pirate. I'm READY.`),
      S(`My grandpa Ned keeps the lighthouse on Gull Isle. It went dark. He won't come down.`,`Grandpa Ned's lighthouse went dark. He won't come down.`)]},
  {id:'m_gilly',name:'Cook Gilly',town:'m_driftwood',home:true,house:'The Floating Kitchen',job:'inn',col:'#3a8aaa',
    look:{skin:'#f0c4a2',hair:'#b8401a',hairdo:'bun',outfit:'tunic',shirt:'#efe6d6',low:'#5a4a3a',apron:'#3a8aaa',hat:'chef',build:'wide',hold:'ladle',freckles:true},
    lines:[S(`Fish stew! Fish pie! Fish pudding! I'm working on fish cocoa. It's not going well.`,`Fish stew! Fish pie! Fish pudding! Fish cocoa is not going well.`),
      S(`Hilde up north sends me soup recipes. I send back fish. It's a good friendship.`,`Hilde up north sends me soup recipes. I send fish back.`),
      S(`The Moonfish! I just want to see it. Not cook it. ...Mostly not cook it.`,`I just want to see the Moonfish. Not cook it. Mostly.`)]},
  {id:'m_ned',name:'Old Ned',town:'m_driftwood',col:'#e8c03a',
    look:{skin:'#e0ae88',hair:'#efeae0',beard:'big',beardc:'#efeae0',outfit:'coat',shirt:'#2a3a5a',low:'#1a2a4a',hat:'rain',hatc:'#e8c03a',hold:'lamp',build:'old'},
    lines:[S(`Moths. Moths. Every night, all over my lamp. Then the lamp went out and they still came. Moths have no manners.`,`Moths sat on my lamp till it went out. No manners!`),
      S(`Tell Squint I'm fine. Tell her to eat her vegetables. Tell her the eyepatch suits her.`,`Tell Squint I'm fine. And to eat her vegetables.`),
      S(`My cousin Agatha keeps the lighthouse in Gearhaven. Hers spins. Show-off.`,`My cousin Agatha's lighthouse spins. Show-off.`)]},
  // Coralcombe, the merfolk village (inside the area m_coralcombe; drawn with fish tails)
  {id:'m_coralia',name:'Queen Coralia of the Lumenfolk',town:'m_coralcombe',inside:'m_coralcombe',col:'#2a9a9a',merfolk:true,room:'hall',fx:0.5,fy:0.3,
    look:{skin:'#9ad0c8',hair:'#e8c060',hairdo:'long',outfit:'dress',shirt:'#3a8a8a',low:'#2a6a6a',tail:'#2a9a9a',hat:'crown',hatc:'#f08080',necklace:'#f0e0c0'},
    lines:[S(`We have been expecting a dragon for a very long time. I'm a little surprised it's such a small one.`,`We waited a long time for a dragon. You're smaller than I thought.`),
      S(`We left the moon city when it drowned. We kept the moon in our hearts. And in our lamps. Mostly lamps.`,`We kept the moon in our hearts. And in our lamps. Mostly lamps.`),
      S(`A queen must listen to the sea. The sea mostly says "shhh". It is very hard to rule.`,`The sea mostly says "shhh". Ruling is hard.`)]},
  {id:'m_ripple',name:'Elder Ripple',town:'m_coralcombe',inside:'m_coralcombe',col:'#4a7a6a',merfolk:true,room:'archive',fx:0.5,fy:0.36,
    look:{skin:'#8ac0b0',hair:'#efeae0',beard:'big',beardc:'#efeae0',glasses:true,outfit:'robe',shirt:'#4a7a6a',low:'#3a5a4a',tail:'#4a7a6a',hold:'scrolls',build:'old'},
    lines:[S(`The old records say the moth leashed her heralds with silver thread, even then. Poor things.`,`The moth tied her moths with silver thread. Poor things.`),
      S(`Sorry, fish. Not you. The other fish.`,`Sorry, fish. Not you. The other fish.`),
      S(`I have the barnacles in my beard cataloged. There are forty-one. Forty-two. Oh, he moved.`,`I count the barnacles in my beard. Forty-one. Oh, he moved.`)]},
  {id:'m_rocket',name:'Rocket',town:'m_coralcombe',inside:'m_coralcombe',kid:true,col:'#e8a030',merfolk:true,room:'reef',fx:0.5,fy:0.5,
    look:{skin:'#a0d8c8',hair:'#c83a2a',hairdo:'spiky',outfit:'tunic',shirt:'#e8a030',low:'#c87a20',tail:'#e8a030',freckles:true},
    lines:[S(`I'm the fastest swimmer in Coralcombe! Second fastest is a squid named Pickles.`,`I'm the fastest swimmer here! Second is a squid named Pickles.`),
      S(`Race me! I'll give you a head start. A tiny one. The size of a shrimp.`,`Race me! I'll give you a tiny head start.`),
      S(`Pickles cheats. He has eight arms. That's six more than fair.`,`Pickles has eight arms. That's not fair!`)]},
  {id:'m_kipper',name:'Sir Kipper',town:'m_coralcombe',inside:'m_coralcombe',col:'#3a5a8a',merfolk:true,room:'hall',fx:0.72,fy:0.78,
    look:{skin:'#8ac0b0',hair:'#3a2a1a',helm:true,plume:'#f08080',outfit:'armor',shirt:'#a8b8c8',low:'#3a5a8a',trim:'#e8c060',tail:'#3a5a8a',hold:'spear',stache:true},
    lines:[S(`Who swims there? ...Oh. It's you. Carry on. Carefully.`,`Oh, it's you. Carry on. Carefully.`),
      S(`Baron Puffington called my seahorse a "wet pony". I demanded satisfaction. He laughed. Then I left.`,`The Baron called my seahorse a "wet pony". Then I left.`),
      S(`I am not afraid of crabs. I am respectful of crabs. From a distance. A long one.`,`I'm not scared of crabs. I just stay far away.`)]},
  {id:'m_kelp',name:'Nana Kelp',town:'m_coralcombe',inside:'m_coralcombe',col:'#5a8a3a',merfolk:true,room:'kelp',fx:0.5,fy:0.45,
    look:{skin:'#9ad0c8',hair:'#3a7a3a',hairdo:'curly',outfit:'robe',shirt:'#5a8a3a',low:'#3a6a2a',tail:'#5a8a3a',shawl:'#c8e0a0',build:'old',hold2:'basket'},
    lines:[S(`Pearls for your pockets, sprat. They don't do anything. They're just lovely.`,`Pearls for your pockets, sprat. They're just lovely.`),
      S(`A dragon who breathes underwater! Your mother must be so proud. And so confused.`,`A dragon who breathes underwater! Your mom must be proud. And confused.`),
      S(`Eat your seaweed, sprat. It's green. Green is good for horns.`,`Eat your seaweed. Green is good for horns.`)]},
  // the Oasis of Sable
  {id:'m_rafi',name:'Caravan-master Rafi Sandstride',town:'m_sable',home:true,house:'The Big Tent',job:'mayor',col:'#c86a2a',
    look:{skin:'#a87050',hair:'#1a1a1a',beard:true,beardc:'#1a1a1a',outfit:'coat',shirt:'#c86a2a',low:'#7a3a1a',hat:'kerchief',hatc:'#e8c03a',sash:'#3a6aaa',build:'big'},
    lines:[S(`Three hundred years our caravan has crossed the Glass Desert by moonlight! Two hundred and ninety-nine without getting lost!`,`Three hundred years we crossed the desert! Only lost once!`),
      S(`I have never seen snow. Is it true it's cold? On purpose?`,`I have never seen snow. Is it cold on purpose?`),
      S(`My best strider walked into a dune last night. Twice. I told that story already? Then this time it was three times.`,`My strider walked into a dune. Twice! No, three times!`)]},
  {id:'m_saffron',name:'Saffron the Well-Warden',town:'m_sable',col:'#c0c8ff',
    look:{skin:'#7c4c30',hair:'#2a1a10',hairdo:'braids',outfit:'robe',shirt:'#3a3a6a',low:'#2a2a50',shawl:'#c0c8ff',hold:'staff',earrings:true},
    lines:[S(`Don't touch the well. Don't breathe on the well. Don't look at the well like that.`,`Don't touch the well. Don't look at it like that.`),
      S(`The well drinks the moon every night, and gives it back to us. Lamps. Water. Light.`,`The well drinks the moon at night. It gives us light.`),
      S(`I talk to the well at night. It doesn't answer. It's a good listener, though.`,`I talk to the well. It's a good listener.`)]},
  {id:'m_kiln',name:'Old Kiln the Glassblower',town:'m_sable',home:true,house:'The Kiln Tent',job:'lamps',col:'#e8803a',
    look:{skin:'#c08860',hair:'#efeae0',hairdo:'wild',outfit:'vest',shirt:'#5a3a2a',low:'#4a3020',apron:'#5a3a2a',goggles:true,soot:true,build:'old',hold:'staff'},
    lines:[S(`I make glass. Glass bottles, glass bowls, glass shoes. Don't buy the glass shoes.`,`I make glass bottles, bowls and shoes. Don't buy the shoes.`),
      S(`A piece of the moon? You could make a glaive out of that! I could! I would! Bring it!`,`A piece of the MOON? I could make a glaive! Bring it!`),
      S(`EH? Speak up. The furnace is very loud. So am I.`,`EH? Speak up! The furnace is loud.`)]},
  {id:'m_esme',name:'Esme, Keeper of Lamps',town:'m_sable',home:true,house:'The Lamp House',job:'lamps',col:'#e8c03a',
    look:{skin:'#94603e',hair:'#efeae0',hairdo:'bun',outfit:'robe',shirt:'#5a2a5a',low:'#3a1a3a',hat:'fancy',hatc:'#e8c03a',hold:'lamp',build:'tall'},
    lines:[S(`Every lamp in Sable has a name. That one is Bertha. That one is Small Bertha.`,`Every lamp has a name. That's Bertha. That's Small Bertha.`),
      S(`Moths love lamps more than they love anything. I've never decided if that's sad or sweet.`,`Moths love lamps most of all. Is that sad or sweet?`),
      S(`A lamp in the dark says "someone is here". That's all anyone wants to hear, at night.`,`A lamp says "someone is here". That's what we need at night.`)]},
  {id:'m_dusty',name:'Dusty and Dune',town:'m_sable',kid:true,col:'#3aaaaa',
    look:{skin:'#c8946c',hair:'#e8c060',hairdo:'spiky',outfit:'tunic',shirt:'#3aaaaa',low:'#2a6a6a',goggles:true,scarf:'#e8a030',twin:true},
    lines:[S(`Dusty: We surf the dunes on trays! Dune: Stolen trays! Dusty: Borrowed trays!`,`We surf dunes on trays! Borrowed trays!`),
      S(`Dune: We found a baby worm. Dusty: He follows us. Dune: He eats our shoes.`,`We found a baby worm. He eats our shoes!`),
      S(`Dusty: Race you down the big dune! Dune: Last one down is a cactus!`,`Race you down the dune! Last one is a cactus!`)]},
  {id:'m_jinx',name:'Jinx the Mirage Merchant',town:'m_sable',col:'#c86ae0',
    look:{skin:'#d8aa84',hair:'#7a2a7a',hairdo:'long',outfit:'coat',shirt:'#7a2a6a',low:'#4a1a4a',hat:'top',hatc:'#ffd27a',back:'pack',earrings:true},
    lines:[S(`Am I a mirage? Are you? Buy something and find out.`,`Am I a mirage? Are YOU? Buy something!`),
      S(`Today's special: a bottle of shade. Keeps you cool. Mostly empty.`,`Today's special: a bottle of shade. It's mostly empty.`),
      S(`I'm only here at noon. At one o'clock I'm a rumor. At two I'm a legend.`,`I'm here at noon. Later I'm just a rumor.`)]}
];
for(const c of M3P_CAST){ if(CASTBY[c.id]) continue; CAST.push(c); CASTBY[c.id]=c; M3P.base[c.id]=c.look; }
// Old Winnie lives in her Shell Hut and Rafi in the Big Tent (both stand indoors); the others stand by their doors
for(const id of ['m_winnie','m_rafi']) INDOOR[id]=1;
for(const k of M3P_TOWNS) if(!TOWN_NAME[k]) TOWN_NAME[k]={m_driftwood:'Driftwood Landing',m_sable:'the Oasis of Sable',m_coralcombe:'Coralcombe'}[k];
if(typeof TIE_NAMES!=='undefined'){ TIE_NAMES.m_driftwood=TIE_NAMES.m_driftwood||['Dell the captain','the merfolk of Coralcombe','the Sable caravan','old Gull Isle'];
  TIE_NAMES.m_sable=TIE_NAMES.m_sable||['Caravan-master Rafi','the Well-Warden','Old Kiln the glassblower','the lamplighters']; }
{ const base=shortName; shortName=function(id){ const m={m_dabble:'Mayor Dabble',m_winnie:'Old Winnie',m_rowan:'Rowan',m_squint:'Squint',m_gilly:'Cook Gilly',m_ned:'Old Ned',m_coralia:'Queen Coralia',m_ripple:'Elder Ripple',m_rocket:'Rocket',m_kipper:'Sir Kipper',m_kelp:'Nana Kelp',m_rafi:'Rafi',m_saffron:'Saffron',m_kiln:'Old Kiln',m_esme:'Esme',m_dusty:'Dusty and Dune',m_jinx:'Jinx',f_mags:'Mags',m_sandy:'Queen Sandy'}; return m[id]||base(id); }; }
// Mags Sprocket is an Act III person (x2_people); if that module is not in the build she is defined here, with no home
if(!CASTBY.f_mags&&!SPECIAL.f_mags){ SPECIAL.f_mags={id:'f_mags',name:'Mags Sprocket',col:'#e8a040',inside:'ev',
  look:{skin:'#e8bc98',hair:'#c8582a',hairdo:'wild',outfit:'overalls',shirt:'#e8d8b8',low:'#5a4a3a',goggles:true,oil:true,soot:true,build:'strong',hold:'mallet',bag:'#8a5a32'},
  lines:[S(`The engine's fine. It's making that noise on purpose.`,`The engine is fine. The noise is on purpose.`)]}; M3P.magsOwn=true; }
// Queen Sandy, the great mother sandworm (Sandworm Burrows room l): a creature with her own drawer
if(!SPECIAL.m_sandy) SPECIAL.m_sandy={id:'m_sandy',name:'Queen Sandy',col:'#e8c070',inside:'ev',creature:'worm',look:{},lines:[]};
// Tikka (Act I's kobold baker, `tk_come==='yes'`) sails as Dell's ship's cook: a person record for the talk prompt; she
// is drawn as her kobold figure (a9j_events' evDrawKob) by m3pAddVisitors
if(!SPECIAL.ev_tikka&&!CASTBY.ev_tikka) SPECIAL.ev_tikka={id:'ev_tikka',name:'Tikka',col:'#e8c86a',inside:'ev',look:{},lines:[]};
// the merfolk have fish tails: the look field `tail` (ACT4 4) draws a tail instead of legs, in 2D and in 3D
const m3pTailOf=n=>{ const c=n&&(CASTBY[n.id]||SPECIAL[n.id]); const L=(n&&n.look)||(c&&c.look); return L&&L.tail?L.tail:null; };

// ---------- 5. homes, spots and who is where. Each named home owner gets the town house nearest the building the
// bible names (whatever order x3_world's houses come in); with no house near, the person stands outdoors there.
const M3P_HOME={m_dabble:[2350,64650],m_winnie:[2050,64950],m_rowan:[2850,64700],m_gilly:[2550,64900],m_rafi:[9700,67380],m_kiln:[10200,67300],m_esme:[9950,67950]};
const M3P_SPOT={m_dabble:[2240,64800],m_rowan:[2860,64800],m_squint:[2300,64700],m_ned:[1000,61905],m_saffron:[9800,67820],m_dusty:[9100,67300],m_kiln:[10090,67410]};
const M3P_JINX=[[8600,66600],[9000,68600],[8300,67800],[10300,66300],[8900,65900]];
const M3P_RAFT=[2400,61400], M3P_RING=[2400,61300];
// where the returning cast stand in Moonfall
const M3P_VIS={farpier:[8300,27120],farwren:[8240,27160],farmags:[8200,27110],dock:[1260,64790],sign:[1300,64750],wren:[2425,65080],mags:[1560,64800],kitchen:[60,40],jun:[9250,67400],
  roof:[9560,67230],foot:[12480,65330],nap:[2280,64230],pier:{juniper:[13370,65475],quill:[13405,65425],maren:[13505,65430],c_vesper:[13555,65475],tikka:[13600,65430],dell:[13645,65475]}};
// (the Moon Pier, 13350..13780 x 65400..65500: Ash arrives at 13450 and the moonfire bridge starts at 13700, FINALE)
{ const base=assignHomesNew; assignHomesNew=function(){
  const took=[];
  try{
    let i=0;
    for(const c of CAST){
      const at=M3P_HOME[c.id]; if(!at||!c.home||c.generic) continue; i++;
      if(DOORS.some(d=>d.owner===c.id)){ c.home=false; took.push(c); continue; }
      // the map module may plan a named home itself (house.want): leave that one to it, so nobody gets a neighbor's house
      if(HOUSES.some(h=>h.want===c.id)) continue;
      const hs=HOUSES.filter(h=>h.town===c.town&&h.k==='house'&&!h.area&&!h.want); if(!hs.length) continue;
      let h=null, bd=1e18; for(const q of hs){ const d=dist2(q.x,q.y,at[0],at[1]); if(d<bd){ bd=d; h=q; } }
      if(!h||bd>900*900) continue;
      const style=STYLE_OF[c.job]||c.style||'home', door=doorOf(h);
      const def=defHouse('h_'+c.id,{name:c.house||'House',owner:c.id,style,seed:4000+i+c.town.length*31,painting:i,egg:i+3,w:style==='inn'||style==='lodge'?680:560,h:style==='inn'?460:400,town:c.town});
      if(INDOOR[c.id]) c.inside=def.id;
      h.owner=c.id; h.area=def.id; h.door=door;
      DOORS.push({x:door.x,y:door.y,area:def.id,label:`Enter ${def.name}`,outY:door.outY||0,hs:h,owner:c.id});
      c.home=false; took.push(c);
    }
  }catch(e){ console.error('x3_people homes',e); }
  try{ base(); } finally { for(const c of took) c.home=true; }
}; }
// Dell's boat: on the ship route it docks with Ash; on Glaciar's route a day later, or when Ash comes back to Driftwood
// after Drowned Lumen (ACT4 6.1c). Wren, Mags and Tikka come on it.
const m3pShipRoute=()=>G.flags.m_ship!=='glaciar';
function m3pBoatIn(){ if(!G||!G.flags.m_landed) return false; return m3pShipRoute()||!!G.flags.m_boat_in; }
const m3pDellAway=()=>!!G.flags.m_dell_away&&!m3pR('m_reforge');
const m3pPier=()=>m3pIV()&&m3pR('m_reforge')&&stageAt('m_reforge')>=0&&!G.done;
const m3pPierAll=()=>m3pPier()&&(!!G.flags.m_reforged||!!G.flags.m_done);
const m3pVesperOn=()=>typeof vesperFriend==='function'?!!vesperFriend():G.choices.c_vesper==='friend';
// the returning cast that stand somewhere in Moonfall right now: {id:[x,y]}
function m3pVisit(){
  const V={}; if(!G||G.mode!=='story'||!m3pIV()) return V;
  const pier=m3pPier(), all=m3pPierAll(), P=M3P_VIS.pier;
  // before the voyage (ship route): Dell waits at Gearhaven's Far Pier by the Soggy Biscuit Three
  if(!G.flags.m_landed&&G.flags.m_ship!=='glaciar'&&m3pR('m_sail')&&m3pAct()===4){ V.dell=M3P_VIS.farpier; V.wren=M3P_VIS.farwren; V.f_mags=M3P_VIS.farmags; }
  if(G.flags.m_landed){
    if(pier) V.dell=P.dell; else if(m3pBoatIn()&&!m3pDellAway()) V.dell=M3P_VIS.dock;
    if(m3pBoatIn()){ if(m3pQ('m_leash')) V.wren='coral'; else V.wren=M3P_VIS.wren; V.f_mags=M3P_VIS.mags; }
    if(G.flags.tk_come==='yes'&&SPECIAL.ev_tikka){ if(pier) V.ev_tikka=P.tikka; else if(m3pBoatIn()&&!m3pDellAway()){ const d=m3pDoorAt('m_gilly'); V.ev_tikka=d?[d.x+M3P_VIS.kitchen[0],d.y+M3P_VIS.kitchen[1]]:[2610,64960]; } }
    if(G.flags.m_ship==='glaciar'&&G.choices.f_glaciar==='free'&&!pier) V.f_glaciar=M3P_VIS.nap;
  }
  if(all){ V.maren=P.maren; V.quill=P.quill; if(G.flags.m_vesper_ally) V.c_vesper=P.c_vesper; }
  if(G.flags.juniper_found){ if(m3pR('n_bridge')&&stageAt('n_bridge')>=0) V.juniper=P.juniper; else if(m3pR('m_sable')&&m3pAct()===4) V.juniper=M3P_VIS.jun; }
  if(!V.c_vesper&&m3pVesperOn()&&m3pR('m_sable')&&m3pAct()===4&&!m3pQ('m_vesper')){
    // (her job is for the Observatory: once it is over she does not wait on the roof any more)
    if(m3pAt('m_vesper',2)) V.c_vesper=M3P_VIS.foot; else if(m3pNight()&&!m3pR('m_reforge')) V.c_vesper=M3P_VIS.roof; }
  return V;
}
// the same, once per frame (markers and quest gates ask it for every person)
function m3pVisitC(){ const t=G?G.time:0; if(M3P.visC&&M3P.visT===t&&M3P.visG===G) return M3P.visC; M3P.visT=t; M3P.visG=G; return M3P.visC=m3pVisit(); }
function m3pDoorAt(id){ return DOORS.find(d=>d.owner===id)||null; }
// people who are somewhere else for a while (Dell is out at sea fetching Mom)
function m3pAway(id){
  if(!G||G.mode!=='story') return false;
  if(id==='dell') return m3pIV()&&!!G.flags.m_landed&&(m3pDellAway()||(!m3pPier()&&!m3pBoatIn()));
  if(id==='ev_tikka') return m3pIV()&&G.flags.tk_come==='yes'&&!!G.flags.m_landed&&m3pDellAway();
  if(id==='m_jinx') return !m3pNoon();
  // Wren and Mags sail with Dell: on Glaciar's route they are at sea for a day after Ash lands
  if(id==='wren'||id==='f_mags') return m3pIV()&&!!G.flags.m_landed&&!m3pBoatIn()&&!m3pPierAll();
  return false;
}
// where Gilly stands: by her kitchen, or out on her fishing raft while she waits for the Moonfish
const m3pGillyOut=()=>m3pOn('m_moonfish');
{ const base=npcSpot; npcSpot=function(c){
  const id=c&&c.id;
  try{
    const V=m3pVisit(); if(V[id]&&Array.isArray(V[id])) return [V[id][0],V[id][1]];
    if(id==='m_gilly'&&m3pGillyOut()) return [M3P_RAFT[0],M3P_RAFT[1]];
    if(id==='m_jinx'){ const s=M3P_JINX[((m3pDay()%5)+5)%5]; return [s[0],s[1]]; }
    if(M3P_SPOT[id]){ const s=M3P_SPOT[id]; return [s[0],s[1]]; }
    if(M3P_HOME[id]&&!homeDoor(id)){ const s=M3P_HOME[id]; return [s[0],s[1]+70]; }
  }catch(e){ console.error(e); }
  return base(c);
}; }
{ const base=npcPresent; npcPresent=function(id){ try{ if(m3pAway(id)) return false; }catch(e){} return base(id); }; }
// people who live indoors (or are SPECIAL with no town) but stand outdoors in Moonfall: added after the stock rebuild
{ const base=setupNPCs; setupNPCs=function(){ base(); try{ m3pAddVisitors(); }catch(e){ console.error('x3_people visitors',e); } }; }
function m3pAddVisitors(){
  if(!G||G.mode!=='story'||!G.npcs) return;
  const V=m3pVisit();
  for(const id in V){
    const at=V[id]; if(!Array.isArray(at)) continue;
    const c=CASTBY[id]||SPECIAL[id];
    G.npcs=G.npcs.filter(n=>n.id!==id);
    if(id==='f_glaciar'){ G.npcs.push(m3pNapNPC(at)); continue; }
    if(!c) continue;
    // (every visitor in m3pVisit is placed on purpose: Juniper only once she was found in Act I)
    const n=mkNPC(c,at[0],at[1]); n.walker=false; n.m3pVis=true; if(id==='quill'){ n.look=Object.assign({},c.look||{},{hold:'telescope'}); }
    if(id==='ev_tikka'){ n.r=9; n.draw=()=>m3pDrawTikka(n); }
    G.npcs.push(n);
  }
  // a Moonfall person or visitor whose spot is in water or a cliff face on the real map steps onto dry ground
  // (Old Ned stays on his tower top, Gilly on her raft, Glaciar on her isle)
  try{ for(const n of G.npcs){ if(n.y<60000||n.y>71200||n.x>=IZX-50) continue;
    if(n.id==='m_ned'||n.m3pNap||(n.id==='m_gilly'&&m3pGillyOut())) continue;
    if(!(CASTBY[n.id]&&M3P_TOWNS.includes(CASTBY[n.id].town))&&!n.m3pVis) continue;
    const q=m3pDry(n.x,n.y,m3pLvl(n.x,n.y-40)); if(q){ n.x=q.x; n.y=q.y; if(n.home) n.home=[q.x,q.y]; } } }catch(e){ console.error(e); }
  M3P.sig=m3pSig();
}
// Tikka is a kobold: her figure comes from the events module (3D toy or 2D), the NPC record only carries her spot
function m3pDrawTikka(n){ const o=n._kob||(n._kob={k:'kob',id:'ev_tikka',kk:0.86,scarf:'#c84a3a',apron:true,spoon:true,t:0}); o.x=n.x; o.y=n.y; o.face=n.face; o.t=n.t||G.time;
  if(typeof evDrawKob==='function') evDrawKob(o); else { ctx.fillStyle='#b8a060'; ctx.beginPath(); ctx.arc(n.x,n.y-10,9,0,TAU); ctx.fill(); } }
// Glaciar napping on the north anchor isle under a sun hat made of a sail (only on her route)
function m3pNapNPC(at){ const n=mkNPC({id:'f_glaciar',name:'Glaciar',col:'#bfe4ff',look:{}},at[0],at[1]); n.walker=false; n.m3pNap=true; n.r=40; n.draw=()=>m3pDrawNap(n); return n; }
// a cheap signature of everything that moves people around, so the people are rebuilt only when it changes
function m3pSig(){ const V=m3pVisit(); let s=Object.keys(V).sort().map(k=>k+(Array.isArray(V[k])?V[k].join(','):V[k])).join(';');
  s+='|j'+(m3pNoon()?(m3pDay()%5):'x')+'|g'+(m3pGillyOut()?1:0)+'|d'+(m3pAway('dell')?1:0); return s; }
function m3pSyncTick(dt){
  M3P.syncT-=dt; if(M3P.syncT>0) return; M3P.syncT=0.5;
  if(scene!=='play'||DLG||AREA) return;
  const s=m3pSig(); if(s!==M3P.sig){ M3P.sig=s; setupNPCs(); }
}
// the compass and the map: people standing somewhere special
{ const base=questSpot; questSpot=function(spec,npc){
  try{
    if(!spec&&npc) spec='npc:'+npc;
    if(spec&&spec.startsWith('npc:')){ const id=spec.slice(4), V=m3pVisit(), c=CASTBY[id];
      if(AREA){ const n=AREA.npcs.find(q=>q.id===id); if(n) return {x:n.x,y:n.y}; }
      if(V[id]==='coral'||(c&&c.merfolk)){ const d=DOORS.find(q=>q.area==='m_coralcombe'); if(d) return {x:d.x,y:d.y}; const P=POI.m_coralreef; return P?{x:P.x,y:P.y}:{x:1900,y:67600}; }
      if(Array.isArray(V[id])) return {x:V[id][0],y:V[id][1]};
      if(id==='m_sandy'){ const m=CAVEMOUTHS.find(q=>q.area==='m_burrows'); if(m) return {x:m.x,y:m.y}; }
    }
  }catch(e){}
  return base(spec,npc);
}; }
// inside an area: the merfolk at their spots in Coralcombe's rooms, Wren reading in the Pearl Archive after the
// Book of Moths, Queen Sandy in her nest, and nobody twice (a visiting person is not also at home)
// (indoors, Winnie's Shell Hut and Rafi's Big Tent: a person whose spot lands on furniture steps forward onto the floor)
{ const base=areaNPCs; areaNPCs=function(){ base(); try{ m3pAreaPeople(AREA); m3pAreaObjs(AREA); if(AREA&&AREA.kind==='house') m3pIndoorSpots(AREA); }catch(e){ console.error('x3_people area',e); } }; }
function m3pCoralRooms(A){
  // the rooms by their place on the grid: the start room is the Shell Hall; west the Kelp Garden, north the Archive, east the Reef
  const out={}; if(!A||!A.rooms) return out;
  const Rs=Object.values(A.rooms), S0=Rs.find(r=>r.kind==='start')||Rs[0]; if(!S0) return out;
  out.hall=S0; const sx=S0.ox, sy=S0.oy;
  for(const R of Rs){ if(R===S0) continue; const dx=R.ox-sx, dy=R.oy-sy;
    if(dx<0&&Math.abs(dy)<=Math.abs(dx)&&!out.kelp) out.kelp=R; else if(dy<0&&!out.archive) out.archive=R; else if(dx>0&&!out.reef) out.reef=R; }
  return out;
}
// the dry floor cell of a room nearest a point (no walls, water, pits or sand traps; Ash can stand in front of it)
function m3pRoomCell(A,R,tx,ty){
  const c=A&&A.cave; if(!c||!R||!c.grid||R.ox==null) return null; const cs=c.cell||48; let best=null, bd=1e18;
  for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){
    const k=j*c.w+i; if(c.grid[k]!==0||(c.typ&&c.typ[k]!==0)) continue;
    const kb=(j+1)*c.w+i; if(j+1<=R.oy+R.ih&&(c.grid[kb]!==0||(c.typ&&c.typ[kb]!==0))) continue;   // room to stand in front
    const x=A.x0+(i+0.5)*cs, y=A.y0+(j+0.5)*cs; try{ if(areaBlocked(x,y)) continue; }catch(e){}
    const d=dist2(x,y,tx,ty); if(d<bd){ bd=d; best={x,y}; } }
  return best;
}
function m3pRoomSpot(A,R,fx,fy){
  if(!R){ return {x:(A.rx!=null?A.rx+A.rw*fx:A.spawn.x),y:(A.ry!=null?A.ry+A.rh*fy:A.spawn.y-120)}; }
  const x0=R.x0!=null?R.x0:R.cx-R.iw*24, x1=R.x1!=null?R.x1:R.cx+R.iw*24, y0=R.y0!=null?R.y0:R.cy-R.ih*24, y1=R.y1!=null?R.y1:R.cy+R.ih*24;
  const tx=lerp(x0+60,x1-60,fx), ty=lerp(y0+60,y1-60,fy);
  return m3pRoomCell(A,R,tx,ty)||m3pFree(tx,ty,220);
}
function m3pAreaPeople(A){
  if(!A||G.mode!=='story') return;
  const V=m3pVisit();
  // a visiting person is not at home too (Wren's library, Quill's house)
  for(const id in V) if(V[id]&&(CASTBY[id]&&CASTBY[id].inside===A.id)) A.npcs=A.npcs.filter(n=>n.id!==id);
  if(A.id==='m_coralcombe'){
    const RM=m3pCoralRooms(A);
    // (the stock areaNPCs puts every `inside` person at the house spot A.rx+..., which a cave area does not have)
    A.npcs=A.npcs.filter(n=>isFinite(n.x)&&isFinite(n.y));
    for(const c of M3P_CAST){ if(!c.merfolk) continue;
      // a person the map module already set in a room (a template `N` mark) keeps the spot it chose
      const ex=A.npcs.find(n=>n.id===c.id); if(ex){ ex.walker=false; continue; }
      if(!npcPresent(c.id)) continue;
      const p=m3pRoomSpot(A,RM[c.room],c.fx,c.fy); const n=mkNPC(CASTBY[c.id]||c,p.x,p.y); n.walker=false; n.face=Math.PI/2; A.npcs.push(n); }
    if(V.wren==='coral'&&CASTBY.wren&&!A.npcs.some(n=>n.id==='wren')){ const p=m3pRoomSpot(A,RM.archive||RM.hall,0.25,0.55); const n=mkNPC(CASTBY.wren,p.x,p.y); n.walker=false; A.npcs.push(n); }
  }
  if(m3pDun(A,'m_burrows')){
    const R=m3pRoom(A,'l'), ex=A.npcs.find(n=>n.id==='m_sandy'), h=A.npcHere&&A.npcHere.id==='m_sandy'?A.npcHere:null;
    if(ex){ ex.walker=false; if(!ex.draw){ ex.r=46; ex.draw=()=>m3pDrawSandy(ex); } }
    else if(R||h){ const p=h?{x:h.x,y:h.y}:m3pRoomSpot(A,R,0.5,0.35); const n=mkNPC(SPECIAL.m_sandy,p.x,p.y); n.walker=false; n.r=46; n.draw=()=>m3pDrawSandy(n); A.npcs.push(n); }
  }
}
// the stock house layouts put shelves, desks and counters where a person's ix/iy spot is: step such a person forward
// to the first spot where Ash can stand in front of them (ACT II lesson 7)
function m3pIndoorSpots(A){
  if(!A||!A.npcs||!A.npcs.length) return;
  const reachOf=o=>(o.w?Math.max(o.w,o.h||0)/2:o.r||16)+34;
  const good=(x,y)=>{ const sx=x, sy=y+36;
    if(areaBlocked(x,y)||areaBlocked(sx,sy)||colAt(x,y,10)||colAt(sx,sy,12)) return false;
    for(const o of A.objs||[]){ if(o.broken) continue; const d=dist(sx,sy,o.x,o.y), r=reachOf(o); if(d<r&&!(dist(sx,sy,x,y)-70<d-r-2)) return false; }
    return true; };
  for(const n of A.npcs){ if(!n.id||!String(n.id).startsWith('m_')||good(n.x,n.y)) continue;
    let best=null;
    for(let dy=20;dy<=220&&!best;dy+=20) for(const dx of [0,-30,30,-60,60]){ if(good(n.x+dx,n.y+dy)){ best={x:n.x+dx,y:n.y+dy}; break; } }
    if(best){ n.x=best.x; n.y=best.y; if(n.home) n.home=[best.x,best.y]; }
  }
}

// ---------- 6. stand-ins. While the Moonfall map module is not in the build (the placeholder map 3), a small world is
// laid down here so the people, homes, talk and quests can be played and tested: the anchor isles and rafts of
// Driftwood, Gull Isle, Palmcrest, the ferry sandbars, the towns and a house at each named building, shrines, the two
// Crab Pirate forts, sand round Sable. x3_world replaces all of it automatically.
if(M3P_STAND){ try{
  const t=MAPS[3].terrain=MAPS[3].terrain||{};
  t.isles=(t.isles||[]).concat([{x:2000,y:64500,r:200},{x:2600,y:65100,r:180},{x:2300,y:64250,r:150},{x:1000,y:62000,r:380},{x:3200,y:66600,r:520},
    {x:3600,y:64900,r:70},{x:4600,y:65300,r:70},{x:5500,y:65500,r:70}]);
  t.walkways=(t.walkways||[]).concat([{x0:1950,y0:64550,x1:2650,y1:64950},{x0:1050,y0:64720,x1:1950,y1:64880},{x0:1700,y0:64300,x1:1950,y1:64450},
    {x0:2650,y0:64650,x1:2950,y1:64800},{x0:2350,y0:64950,x1:2500,y1:65200}]);
  delete MAPS[3].tz;
}catch(e){ console.error('x3_people stand-in terrain',e); } }
function m3pStandIn(B){
  B.poi('m_driftwood',{x:2300,y:64800,r:650,name:'Driftwood Landing',level:17,town:true});
  B.poi('m_sable',{x:9800,y:67600,r:650,name:'the Oasis of Sable',level:19,town:true});
  B.poi('m_coralreef',{x:1900,y:67600,r:400,name:'Coralcombe Reef',level:17});
  B.poi('m_gull',{x:1000,y:62000,r:380,name:'Gull Isle',level:17});
  B.poi('m_palmcrest',{x:3200,y:66600,r:520,name:'Palmcrest Isle',level:17});
  B.poi('m_moonpath',{x:12600,y:65200,r:300,name:'the Moonpath',level:21});
  B.poi('m_edge',{x:13550,y:65450,r:250,name:'the Edge of the World',level:21});
  B.town('m_driftwood',{name:'Driftwood Landing',music:'town',generics:false,hz:()=>({wc:'#e8d8b8',rc:'#3a8aaa'})});
  B.town('m_sable',{name:'the Oasis of Sable',music:'town',generics:false,hz:()=>({wc:'#f0e0c0',rc:'#c84a3a'})});
  const HS={m_dabble:[2350,64610,'#e8a030'],m_winnie:[2050,64830,'#3a8aaa'],m_rowan:[2850,64690,'#c84a3a'],m_gilly:[2550,64830,'#3a8aaa'],
    m_rafi:[9700,67330,'#c84a3a'],m_kiln:[10220,67250,'#e8a030'],m_esme:[9950,67900,'#7a2a6a']};
  for(const id in HS){ const [x,y,roof]=HS[id], c=CASTBY[id]; B.house({x,y,w:id==='m_rowan'?110:130,h:id==='m_rowan'?62:84,town:c.town,roof}); }
  B.shrine({id:'s_m_driftwood',x:2400,y:64600,name:'Town Raft Shrine'});
  B.shrine({id:'s_m_sable',x:10100,y:67900,name:'Sable Shrine'});
  B.shrine({id:'s_m_moonpath',x:12400,y:65250,name:'Moonpath Shrine'});
  const crab=EDEF.m_crabpirate?'m_crabpirate':'crab';
  B.camp({id:'m_c1',x:5600,y:61800,units:[[crab,3]]});
  B.camp({id:'m_c2',x:5400,y:68200,units:[[crab,3]]});
  if(M3P.ownLumen) B.cave({area:'m_lumen',x:3700,y:62380,noNudge:true});
  if(M3P.ownBurrows) B.cave({area:'m_burrows',x:10600,y:62900,noNudge:true});
  if(typeof p4Add==='function'){
    p4Add('sandbed',{id:'m3p_sand_sable',x0:8700,y0:66800,x1:10850,y1:68400});
    p4Add('sandbed',{id:'m3p_sand_gap',x0:10700,y0:67000,x1:11100,y1:67400});
    p4Add('sandbed',{id:'m3p_sand_north',x0:10200,y0:62400,x1:11000,y1:66800});
  }
}
if(M3P_STAND){ const b0=MAPS[3].build; MAPS[3].build=function(B){ if(b0) b0.call(this,B); try{ m3pStandIn(B); }catch(e){ console.error('x3_people stand-in',e); } }; }
// Coralcombe (ACT4 4.2): four free rooms. x3_world builds the real one; this is used only if no module defined it.
const M3P_TPL={
  hall:['...............','...............','...#.......#...','...............','...............','...............','...............','...#.......#...','...............','..s............','...............'],
  kelp:['...............','..*........*...','...............','....##...##....','...............','...............','...............','....##...##....','...............','..*........*...','...............'],
  archive:['...............','.##.##...##.##.','...............','.##.##...##.##.','...............','...............','...............','.##.##...##.##.','...............','...............','...............'],
  reef:['...............','..##.......##..','...............','.......*.......','...............','...............','...............','..#....*....#..','...............','..##.......##..','...............'],
  bubbles:['...............','...*.......*...','...............','.......X.......','...............','..#.........#..','...............','...*.......*...','...............','..s............','...............']
};
// The little areas the quests need when no other module has made them (checked once every module has loaded, at world
// build): Coralcombe (ACT4 4.2: four free rooms), the Bubble Caves (10.7), and, on the stand-in map only, a tiny
// Drowned Lumen (the Drowned Houses `k`, the Drowned Library `l`) and Sandworm Burrows (Queen Sandy's Nest `l`).
function m3pStandDungeons(){
  if(typeof defineDungeon!=='function'||M3P.dunDone) return; M3P.dunDone=true;
  const R=(at,kind,tpl,o)=>Object.assign({at,kind,tpl,noPots:true},o||{});
  // a sandy, coral-pink look for the stand-in sea caves (the map module's own areas keep theirs)
  if(typeof defineDungeonTheme==='function'&&!CAVE_STYLE.m3p_coral) defineDungeonTheme('m3p_coral',{music:'m_deep',decor:'shell',
    style:{floor:'#c8b48a',floor2:'#bea97e',top:'#e8968e',face:'#7a3a4a',edge:'#ffd8cc',water:'#2a7aa0',accent:'#7ae0ff'},
    pal:{tile:['#c8b48a','#bea97e','#c8b48a','#bea97e'],grout:'rgba(80,50,30,.2)',moss:'240,150,150',rune:'140,230,220',hole:'#0e1820',lip:['#e8968e','#7a3a4a'],water:'#2a7aa0',cave:true}});
  if(!AREADEFS.m_coralcombe){ try{
    defineDungeon('m_coralcombe',{name:S('Coralcombe','Coralcombe'),level:17,theme:CAVE_STYLE.m3p_coral?'m3p_coral':'tide',seed:4171,save:'m_coralcombe',dark:0.12,dunKind:S('The merfolk village','The merfolk village'),noJuniper:true,
      floors:[{id:'1',name:S('Coralcombe','Coralcombe'),map:{rooms:{
        a:R([1,1],'start',M3P_TPL.hall,{sign:S('CORALCOMBE. Wipe your fins.','CORALCOMBE. Wipe your fins.')}),
        b:R([0,1],'free',M3P_TPL.kelp),c:R([1,0],'free',M3P_TPL.archive),d:R([2,1],'free',M3P_TPL.reef)},
        links:[['a','b','open'],['a','c','open'],['a','d','open']]}}]});
    M3P.ownCoral=true; }catch(e){ console.error('x3_people Coralcombe',e); } }
  if(!AREADEFS.m_bubblecaves){ try{
    defineDungeon('m_bubblecaves',{name:S('The Bubble Caves','The Bubble Caves'),level:18,theme:CAVE_STYLE.m3p_coral?'m3p_coral':'tide',seed:4177,save:'m_bubblecaves',dark:0.3,dunKind:S('A sea cave','A sea cave'),noJuniper:true,
      floors:[{id:'1',name:S('The Bubble Caves','The Bubble Caves'),map:{rooms:{
        a:R([0,0],'start',M3P_TPL.bubbles,{loot:['treasure'],sign:S('Bubbles go up. So can you. Mags was here (probably).','Bubbles go up. Mags was here!')})},links:[]}}]});
    M3P.ownBubble=true; }catch(e){ console.error('x3_people Bubble Caves',e); } }
  if(!M3P_STAND) return;
  if(!AREADEFS.m_lumen){ try{
    defineDungeon('m_lumen',{name:S('Drowned Lumen','Drowned Lumen'),level:17,theme:'tide',seed:4181,save:'m_lumen',dark:0.4,dunKind:S('A drowned city','A drowned city'),noJuniper:true,
      floors:[{id:'1',name:S('Drowned Lumen','Drowned Lumen'),map:{rooms:{a:R([1,1],'start',M3P_TPL.hall,{sign:S('LUMEN, CITY OF THE MOON.','LUMEN, CITY OF THE MOON.')}),k:R([0,1],'free',M3P_TPL.kelp),l:R([1,0],'free',M3P_TPL.archive)},
        links:[['a','k','open'],['a','l','open']]}}]});
    M3P.ownLumen=true; }catch(e){ console.error('x3_people Lumen stand-in',e); } }
  if(!AREADEFS.m_burrows){ try{
    defineDungeon('m_burrows',{name:S('The Sandworm Burrows','The Sandworm Burrows'),level:19,theme:'earth',seed:4191,save:'m_burrows',dark:0.4,dunKind:S('Worm tunnels','Worm tunnels'),noJuniper:true,
      floors:[{id:'1',name:S('The Sandworm Burrows','The Sandworm Burrows'),map:{rooms:{a:R([1,1],'start',M3P_TPL.hall,{sign:S('THE BURROWS. Keep moving. Worms like things that keep still.','THE BURROWS. Keep moving.')}),l:R([2,1],'free',M3P_TPL.reef)},
        links:[['a','l','open']]}}]});
    M3P.ownBurrows=true; }catch(e){ console.error('x3_people Burrows stand-in',e); } }
}

// ---------- 7. talk (a1g_talk.js format): bio, rumor (points at a quest or a secret) with its menu label (rumorAsk, under
// "More..."), gifts, secret (3 hearts), best (5 hearts). v11 (J11b): every person here talks in the v11 shape in Act IV
// (game/story/act4/people.js: openers that answer, the old chat as a moment, topics, idle, bye), so their old chat, about
// and deep are gone from this table (the data has them, rewritten).
Object.assign(TALK,{
  m_dabble:{bio:S('Mayor of Driftwood Landing. Wet socks, dry jokes.','The mayor of the raft town. Wet socks.'),
    rumorAsk:[`Is there anything odd out at sea?`,`Anything odd at sea?`],
    rumor:{t:S(`Turtleback Isle is very bumpy for an isle. And it snores. Islands don't snore. Do they?`,`Turtleback Isle snores. Islands don't snore. Do they?`),hint:'m_sec_turtle'},
    loves:['fish'],hates:['honey'],
    secret:{t:S(`The mayor's emergency socks. Dry ones! You'll run faster.`,`My emergency socks. Dry! Run faster.`),reward:{stamina:15}},
    best:{t:S(`I'm naming the next raft after you. The Ash. It's fireproof.`,`The next raft is called The Ash. It's fireproof!`),reward:{coins:100}}},
  m_winnie:{bio:S('The Tidewife of Driftwood. Reads the moon. Lives with an octopus.','She reads the moon. She lives with an octopus.'),
    rumorAsk:[`Where did the moon-priests keep their books?`,`Where are the old books?`],
    rumor:{t:S(`The moon-priests kept their books in a library under the sea. Fish are terrible librarians. Somebody should go and look.`,`The moon-priests kept books under the sea. Someone should look.`),hint:null},
    loves:['fish'],hates:['moonlily'],
    secret:{t:S(`A shell that hums the tide. Hold it and your draughts heal more.`,`A shell that hums. Your draughts heal more.`),reward:{heal:0.1}},
    best:{t:S(`Ollie wants you to have his favorite rock. It's a very good rock.`,`Ollie gives you his best rock. It's a good rock.`),reward:{bless:1}}},
  m_rowan:{bio:S('Raft-builder and ferry captain. Has a knot for every feeling.','She builds rafts. She has a knot for every feeling.'),
    rumorAsk:[`Any wrecks worth diving to?`,`Any wrecks to dive to?`],
    rumor:{t:S(`There's a whole galleon on its side by the Sunken Gate. Pirates' hold, full of something. Fishy. Possibly treasure.`,`A sunken ship sits by the Sunken Gate. Maybe treasure!`),hint:'m_sec_galleon',need:()=>!!G.flags.m_puff_done},
    loves:['fish'],hates:['honey'],
    secret:{t:S(`A sailor's knot charm. You hold on tighter.`,`A knot charm. You hold on tighter.`),reward:{armor:0.05}},
    best:{t:S(`The fastest raft I ever built. It's yours. It's behind the shed.`,`My fastest raft is yours. It's behind the shed.`),reward:{coins:80}}},
  m_squint:{bio:S('Driftwood’s lookout. The eyepatch is pretend.','The town lookout. Her eyepatch is pretend.'),
    rumorAsk:[`Anything glowing out on the water?`,`Anything glowing out there?`],
    rumor:{t:S(`From up here I can see a sunken door in the deep water north of the Spire. Something glows behind it. Water ho!`,`I see a sunken door north of the Spire. Water ho!`),hint:'m_sec_backdoor'},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`My spare spyglass. Treasure shows up on your map.`,`My spare spyglass. See treasure on your map!`),reward:{reveal:true}},
    best:{t:S(`You're an honorary lookout! Say "Land ho!" ...Perfect.`,`You're a lookout now! Say "Land ho!" Perfect!`),reward:{bless:1}}},
  m_gilly:{bio:S('Runs the Floating Kitchen. Puts fish in everything. Rest here.','She runs the Floating Kitchen. Fish in everything. Rest here.'),
    rumorAsk:[`What do the fishermen talk about?`,`What do fishermen say?`],
    rumor:{t:S(`Fishermen say there's a moonfish in the deep water north of town. Glows like the moon. Only comes up when the moon is full. So, never, now.`,`A Moonfish lives in the deep water up north. It glows!`),hint:null},
    loves:['fish'],hates:['moonlily'],
    secret:{t:S(`My best fish pie. Eat it on a bad day.`,`My best fish pie. For a bad day.`),reward:{potmax:1}},
    best:{t:S(`Free meals forever. And a fish named after you. He's a very handsome fish.`,`Free meals forever! And a fish named after you.`),reward:{freeinn:true}}},
  m_ned:{bio:S('Keeper of the Gull Isle lighthouse. Grumpy. Fond of Squint.','The lighthouse keeper. Grumpy. He loves Squint.'),
    rumorAsk:[`What can you see from the top?`,`What can you see from up here?`],
    rumor:{t:S(`From up here you can see a ring of glass spikes in the far north desert. Something fell there. Something that glowed.`,`Far north in the desert, something fell. It glowed.`),hint:'m_sec_crater'},
    loves:['fish'],hates:['honey'],
    secret:{t:S(`A lighthouse lens shard. Your fire reaches further.`,`A lens shard. Your fire goes further.`),reward:{energy:15}},
    best:{t:S(`The lighthouse is yours too now. Squint says you're family. Squint is always right.`,`The lighthouse is yours too. Squint says you're family.`),reward:{maxhp:15}}},
  m_rafi:{bio:S('Master of the Great Caravan. Has never seen snow. Tells every story twice.','The caravan-master. He has never seen snow.'),
    rumorAsk:[`Tell me a desert story.`,`Tell me a desert story.`],
    rumor:{t:S(`In the far south dunes there's an oasis that isn't there. Palms, a pool, all of it. You walk up, and pfft. But my grandmother said at night it hides something real.`,`A fake oasis in the south dunes. At night it hides something real.`),hint:'m_sec_mirage'},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`A strider-hide belt. Run faster on sand.`,`A strider belt. You run faster.`),reward:{speed:1.03}},
    best:{t:S(`You ride at the front of the caravan, forever. That's where the stories are.`,`You ride at the front of the caravan forever!`),reward:{bless:1}}},
  m_saffron:{bio:S('Well-Warden of Sable. Do not touch the well.','She guards the Moon Well. Don’t touch it.'),
    rumorAsk:[`When did the Glasswall grow?`,`When did the wall grow?`],
    rumor:{t:S(`The Glasswall grew up overnight when the moon got sick. Taller than towers. Only the worms go under. Worms are not polite, but they are thorough.`,`The Glasswall grew in one night. Only worms go under it.`),hint:null,need:()=>m3pR('m_sable')},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`A cup of moon water. Heals a little.`,`A cup of moon water. It heals.`),reward:{potmax:1}},
    best:{t:S(`You may touch the well. Once. Gently.`,`You may touch the well. Once. Gently.`),reward:{maxhp:15}}},
  m_kiln:{bio:S('Glassblower of Sable. Sets small things on fire. A bit deaf.','The glassblower. A bit deaf. Sets things on fire.'),
    rumorAsk:[`Found anything in the sand?`,`Found anything in the sand?`],
    rumor:{t:S(`Under the whale bones on the beach there's something buried. I tried to dig it up once. Got a crab in my ear. EH? No, it's still in there.`,`Something is buried under the whale bones on the beach.`),hint:'m_sec_bones'},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`Glass goggles. Glare doesn't bother you.`,`Glass goggles. No more glare!`),reward:{m3pFlag:'m_goggles',m3pBanner:[S('Glass goggles','Glass goggles'),S('The glare of the white glass won’t bother you now.','No more glare!')]}},
    best:{t:S(`I made a glass dragon of you. It's on the furnace. It's melting. It's beautiful.`,`I made a glass you. It's melting. It's beautiful!`),reward:{coins:100}}},
  m_esme:{bio:S('Keeper of Lamps. Names every lamp.','She lights the lamps. Every lamp has a name.'),
    rumorAsk:[`Is there a lamp you have never lit?`,`A lamp you never lit?`],
    rumor:{t:S(`In the mangroves, in the south, there's an old lamp on a stump that nobody has lit for a hundred years. I always wanted to. It's too far for my legs.`,`An old lamp on a stump in the mangroves. Nobody has lit it.`),hint:'m_sec_fireflies'},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`A lamplighter's wick. Your fire lasts longer.`,`A lamplighter's wick. Your fire lasts longer.`),reward:{energy:20}},
    best:{t:S(`I named a lamp after you. Ash. She's very bright and a little bit stubborn.`,`I named a lamp Ash. Bright and stubborn.`),reward:{bless:1}}},
  m_dusty:{bio:S('Twin sand-surfers. Borrow trays. Lose trays.','Twins who surf the dunes on trays.'),
    rumorAsk:[`Where is the sand too hard to dig?`,`Where is the sand hard?`],
    rumor:{t:S(`Dusty: There are hard sand spots in the dunes. Dune: Too hard to dig. Dusty: The big worms could. Dune: Maybe you could, if you were a big worm.`,`Some sand is too hard to dig. Big worms can dig it.`),hint:null},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`Dusty: Our best tray! Dune: Surf down dunes! Dusty: We borrowed it. Dune: From ourselves.`,`Our best tray! Surf down the dunes!`),reward:{m3pFlag:'m_tray',m3pBanner:[S('The twins’ best tray','The twins’ best tray'),S('Sprint down a dune and you slide like a sand-surfer.','Sprint down a dune to surf!')]}},
    best:{t:S(`Dusty: You're our third twin now. Dune: That's not how twins work. Dusty: It is now.`,`You're our third twin now!`),reward:{bless:1}}},
  m_jinx:{bio:S('A merchant who appears at noon in the dunes. Might not be real.','A merchant of the dunes at noon. Maybe a mirage.'),
    rumorAsk:[`Got a riddle for me?`,`Got a riddle?`],
    rumor:{t:S(`A riddle, free of charge: what is round and silver and keeps getting smaller? ...No, not my coin purse.`,`Riddle: what is round and silver and getting smaller?`),hint:null},
    loves:['moonlily'],hates:['fish'],
    secret:{t:S(`A real bottle of shade. It's not empty. Probably.`,`A real bottle of shade.`),reward:{stamina:15}},
    best:{t:S(`For you, my best trick: a lucky coin that's always in your other pocket.`,`My lucky coin. It's in your other pocket.`),reward:{crit:0.04}}},
  // the merfolk of Coralcombe
  m_coralia:{bio:S('Queen of the Lumenfolk, the merfolk of Coralcombe. Calm, regal, a little dry.','The merfolk queen. Calm and a bit dry.'),
    rumorAsk:[`Is there another way into Lumen?`,`Another way into Lumen?`],
    rumor:{t:S(`There is a back door into old Lumen, in the deep water north of the Spire. Our children use it. They think I don't know.`,`There's a back door into Lumen, north of the Spire.`),hint:'m_sec_backdoor'},
    loves:['moonlily'],hates:['fish'],
    secret:{t:S(`A pearl from the royal clam. It makes you a little harder to drown. And to hurt.`,`A royal pearl. You are a bit harder to hurt.`),reward:{maxhp:10}},
    best:{t:S(`You are a friend of the Lumenfolk now, for as long as the sea is wet.`,`You are our friend while the sea is wet. That's forever.`),reward:{bless:1}}},
  m_ripple:{bio:S('Archivist of the Pearl Archive. Slow, kind, forgetful. Apologizes to fish.','He keeps the old books. He says sorry to fish.'),
    rumorAsk:[`What is in the Drowned Library?`,`What is in the Library?`],
    rumor:{t:S(`The priests' vault in the Drowned Library is sealed with moon-wax. Only moonfire melts it. I have never seen moonfire. I would like to, before I forget what I wanted.`,`The Library vault needs moonfire to open.`),hint:null,need:()=>!m3pQ('m_leash')},
    loves:['moonlily'],hates:['fish'],
    secret:{t:S(`A reading pearl. Hold it to your eye and the dark looks a little less dark. Your breath lasts longer, too.`,`A reading pearl. Your breath lasts longer.`),reward:{energy:15}},
    best:{t:S(`I've written you into the Archive. "Ash, the small dragon who came back." I'll forget I did it. You won't.`,`I wrote you into the Archive. You won't forget.`),reward:{reveal:true}}},
  m_rocket:{bio:S('The fastest swimmer in Coralcombe. A boaster and a good sport.','The fastest merfolk swimmer. A good sport.'),
    rumorAsk:[`Any tricks for the race?`,`Any race tricks?`],
    rumor:{t:S(`The race goes round the reef and through the mangroves. There are two old masts down there. If your tail can grab things... nah. Forget I said it.`,`Two old masts on the race course. If your tail can grab...`),hint:null},
    loves:['moonlily'],hates:['fish'],
    secret:{t:S(`My lucky fin-band. You swim faster when you wear it. Okay, you don't. But you feel faster.`,`My lucky fin-band. You feel faster!`),reward:{stamina:15}},
    best:{t:S(`You're my best racing buddy. Even better than Pickles. Don't tell Pickles.`,`You're my best race buddy. Don't tell Pickles.`),reward:{coins:100}}},
  m_kipper:{bio:S('Knight of the Lumenfolk. Very proper. Secretly scared of crabs. Rides a seahorse called Lady Bubbles.','A merfolk knight on a seahorse. Scared of crabs.'),
    rumorAsk:[`Where do the Crab Pirates live?`,`Where are the Crab Pirates?`],
    rumor:{t:S(`The Crab Pirates have two forts on the reef isles. Two! Somebody should do something. Somebody braver. About crabs.`,`The Crab Pirates have two forts. Someone braver should go.`),hint:null},
    loves:['moonlily'],hates:['fish'],
    secret:{t:S(`My spare shell-plate. Strap it on. Crabs fear it. Probably.`,`My spare shell armor. Crabs fear it. Probably.`),reward:{armor:0.04}},
    best:{t:S(`I dub thee Sir Ash of the Dry Lands, Knight of Coralcombe. Rise. Swim. Whatever dragons do.`,`I name you Sir Ash, Knight of Coralcombe! Rise!`),reward:{dmg:0.05}}},
  m_kelp:{bio:S('Healer and pearl-seller of the Kelp Garden. Calls every child “sprat”.','The healer of the Kelp Garden. She calls you sprat.'),
    rumorAsk:[`How do I swim faster?`,`How do I swim faster?`],
    rumor:{t:S(`Rocket thinks nobody can beat him in the reef race. Beat him, sprat. Gently. And I'll teach you a kick that'll make you fly through water.`,`Beat Rocket in the race. I'll teach you a special kick!`),hint:null},
    loves:['moonlily'],hates:['fish'],
    secret:{t:S(`My kelp tonic, sprat. Your draughts will mend you better.`,`My kelp tonic. Your draughts heal more.`),reward:{heal:0.1}},
    best:{t:S(`A pearl pouch. Holds one more draught. And it's lovely.`,`A pearl pouch. One more draught. And lovely!`),reward:{potmax:1}}}
});
// talk rewards with no stock field: a speed belt, a flag (goggles, the twins' tray) with its banner, or a function
{ const base=giveTalkReward; giveTalkReward=function(r){ base(r); try{ if(!r) return;
  if(r.speed&&player){ player.stats.speed*=r.speed; }
  if(r.m3pFlag){ G.flags[r.m3pFlag]=1; if(r.m3pBanner) later(0.4,()=>setBanner(r.m3pBanner[0],r.m3pBanner[1],2.8)); }
  if(typeof r.m3p==='function') r.m3p(); }catch(e){ console.error(e); } }; }

// ---------- 8. first meetings and everyday greetings in each person's own voice. Some first meetings react to what Ash
// did in earlier acts: how he came east (Glaciar or the ship), Vesper friend or foe, Glaciar freed or beaten.
const m3pGl=()=>G.choices.f_glaciar==='free', m3pGlBeat=()=>!!G.choices.f_glaciar&&G.choices.f_glaciar!=='free';
const M3P_FIRST={
  m_dabble:()=>G.flags.m_ship==='glaciar'?S(`You came on a dragon. An ice one! My north beach is frozen solid and the chickens are ice skating.`,`You came on an ice dragon! The chickens are skating!`)
    :S(`Our visiting dragon! Mind the gaps. Mind all the gaps. The chickens are still talking about you.`,`Our dragon! Mind the gaps!`),
  m_winnie:()=>S(`Winnie, the Tidewife, if nobody told you. I read the tide, and the moon. Lately the moon reads badly.`,`I'm Old Winnie. I read the tide and the moon.`),
  m_rowan:()=>S(`Rowan Knotwood. This is my "pleased to meet you" knot. Hold this end. No, the other end.`,`I'm Rowan. This knot means "nice to meet you".`),
  m_squint:()=>S(`Land ho! ...Oh. Dragon ho! I'm Squint, the official lookout. The eyepatch is pretend. The lookout part is real.`,`Dragon ho! I'm Squint, the lookout!`),
  m_gilly:()=>S(`Cook Gilly, Floating Kitchen! You look starving. Fish? Fish pie? Fish on a stick? Fish on a smaller fish?`,`I'm Cook Gilly! You look hungry. Fish?`),
  m_ned:()=>S(`Who's that, climbing my lighthouse? ...A dragon. Hmph. I'm Ned. I keep this light. Mind the moths.`,`Who's climbing my lighthouse? A dragon. Hmph. I'm Old Ned.`),
  m_coralia:()=>G.flags.m_ship==='glaciar'?S(`We felt the sea turn cold when your ice auntie flew over, small dragon. The fish wore little coats for a week.`,`The sea went cold when your auntie flew over!`)
    :m3pGlBeat()?S(`A great cold came down from the north this year, then stopped. Someone stopped it. I think it was you, small dragon.`,`A great cold stopped this year. Was it you?`)
    :S(`Yes, small dragon? The sea is listening, and so am I.`,`Yes, small dragon?`),
  m_ripple:()=>S(`Oh! A visitor. Elder Ripple, of the Pearl Archive. Have we met? I'm sorry. I'm sure I'd remember a dragon. Probably.`,`Oh, a visitor! I'm Elder Ripple. Have we met? Sorry.`),
  m_rocket:()=>S(`Whoa, a dragon who swims? I'm Rocket. Fastest in Coralcombe. Second fastest is a squid. You might be third. Might.`,`A swimming dragon! I'm Rocket. Fastest here!`),
  m_kipper:()=>S(`Who swims there? ...Oh, it's the dragon from the well. Sir Kipper, at your service, and this is Lady Bubbles.`,`Oh, it's you. I'm Sir Kipper. This is Lady Bubbles.`),
  m_kelp:()=>S(`Oh, look at you, sprat, all dry and crispy. Nana Kelp. Healer. Pearls. Hugs, if you need one.`,`Look at you, sprat! I'm Nana Kelp. I heal and sell pearls.`),
  m_rafi:()=>m3pVesperOn()?S(`HO! A girl in a moth mask came through and said her dragon cousin would follow. She said you'd be taller!`,`HO! A moth-mask girl said you would come!`)
    :S(`HO! The dragon from the sea! Sit with the caravan a while.`,`HO! The sea dragon! Sit with us!`),
  m_saffron:()=>S(`Saffron. Well-Warden. Don't touch the well.`,`I'm Saffron. Don't touch the well.`),
  m_kiln:()=>S(`EH? A dragon? In my furnace tent? Old Kiln. Glassblower. Mind the hot bits. All the bits are hot bits.`,`EH? A dragon? I'm Old Kiln. Everything here is hot!`),
  m_esme:()=>S(`Hello, dragon. I'm Esme. I keep the lamps. You must be the brightest thing to walk into Sable in years.`,`Hello, dragon. I'm Esme. I keep the lamps.`),
  m_dusty:()=>S(`Dusty: Hi! I'm Dusty! Dune: I'm Dune! Dusty: We're twins! Dune: We know you know.`,`Hi! We're Dusty and Dune! Twins!`),
  m_jinx:()=>m3pVesperOn()?S(`Am I real? Are you? A girl in a moth mask bought a hat from me last week, so I'm fairly sure I'm real. Jinx, mirage merchant.`,`Am I real? A moth-mask girl bought a hat. So I'm real. I'm Jinx.`)
    :S(`Am I a mirage? Are you? Jinx, merchant of whatever-this-is. Buy something and find out.`,`Am I a mirage? I'm Jinx. Buy something!`)
};
const M3P_HELLO={
  m_dabble:[S(`Ash! Mind the gap!`,`Ash! Mind the gap!`),S(`Our hero! Wet socks and all!`,`Our hero!`)],
  m_winnie:[S(`Ah, the dragon child. Ollie waves.`,`Hello, dragon child.`),S(`Sit, sit.`,`Sit, sit.`)],
  m_rowan:[S(`*ties a "hello" knot*`,`*ties a hello knot*`),S(`Ash. Mind the ropes.`,`Mind the ropes.`)],
  m_squint:[S(`Land ho! Oh. Ash ho!`,`Ash ho!`),S(`Lookout reporting! Nothing to report!`,`Nothing to report!`)],
  m_gilly:[S(`Hungry? Fish?`,`Hungry? Fish?`),S(`There's my favorite dragon! Sit! Eat!`,`Sit! Eat!`)],
  m_ned:[S(`Hmph. You again.`,`Hmph. You again.`),S(`Mind the moths.`,`Mind the moths.`)],
  m_coralia:[S(`Welcome back, small dragon.`,`Welcome back.`),S(`The sea is glad to see you. So am I.`,`The sea is glad you're here.`)],
  m_ripple:[S(`Ah! Hello. Have we met? Oh, yes. Hello again.`,`Hello again!`),S(`Sorry, fish. Hello, dragon.`,`Hello, dragon.`)],
  m_rocket:[S(`Race me!`,`Race me!`),S(`Hey! Still slow?`,`Still slow?`)],
  m_kipper:[S(`Who swims there? Oh. Carry on, friend.`,`Carry on, friend.`),S(`Lady Bubbles says hello.`,`Lady Bubbles says hi.`)],
  m_kelp:[S(`Hello, sprat.`,`Hello, sprat.`),S(`Have you eaten, sprat?`,`Have you eaten?`)],
  m_rafi:[S(`HO! The dragon!`,`HO!`),S(`Sit with the caravan!`,`Sit with us!`)],
  m_saffron:[S(`Don't touch the well.`,`Don't touch the well.`),S(`Dragon.`,`Dragon.`)],
  m_kiln:[S(`EH? Oh, you. Hello!`,`Hello!`),S(`Mind the furnace!`,`Mind the furnace!`)],
  m_esme:[S(`Hello, dragon.`,`Hello, dragon.`),S(`The lamps say hello.`,`The lamps say hi.`)],
  m_dusty:[S(`Dusty: Ash! Dune: Ash!`,`Ash! Ash!`),S(`Dusty: Wanna surf? Dune: We have one tray.`,`Wanna surf? One tray.`)],
  m_jinx:[S(`Back again? Or am I?`,`Back again?`),S(`Something for everyone. Nothing for free.`,`Nothing for free.`)]
};
const M3P_NIGHTL=[S(`The nights are so dark now. Stay near the lamps, Ash.`,`It's so dark at night. Stay near lamps.`),S(`Can you see the moon? I can hardly see the moon.`,`I can hardly see the moon.`),S(`Every night is darker than the last. Keep a lamp lit, Ash.`,`Darker every night. Keep a lamp lit.`)];
{ const base=greetLine; greetLine=function(id){
  if(!M3P_FIRST[id]) return base(id);
  if(!(G.seenTalk&&G.seenTalk['met_'+id])) return M3P_FIRST[id]();
  const dg=deedGreet(id); if(dg) return dg;
  if(friendOf(id)>=5) return pick([S(`Ash! My favorite dragon in the whole east!`,`Ash! My favorite dragon!`),S(`There's my best friend.`,`My best friend!`)]);
  if(isNight()&&!(CASTBY[id]&&CASTBY[id].merfolk)&&Math.random()<0.35) return pick(M3P_NIGHTL);
  return pick(M3P_HELLO[id]||[S(`Hello, Ash.`,`Hello, Ash.`)]);
}; }
// "What's new?" lines that follow the story and the player's choices (every third time)
{ const base=moodLine; moodLine=function(id){
  const F=G.flags, Q=m3pQ, C=G.choices;
  if(id==='m_dabble'&&Q('m_ferry')) return S(`The ferry runs again! The chickens ride for free. They've started queuing. In a line. It's eerie.`,`The ferry runs! Chickens ride free.`);
  if(id==='m_dabble'&&F.m_ship==='glaciar') return S(`Your auntie froze our north beach. We're selling the ice to Sable. Sable is paying in dates. Everybody's happy except the ice.`,`We sell your auntie's ice to Sable. For dates!`);
  if(id==='m_winnie'&&F.m_eclipse1) return S(`When the moth bit the moon the tide went three ways at once. Ollie hid in the sugar bowl. He's still in there.`,`When the moon got bitten, Ollie hid in the sugar bowl.`);
  if(id==='m_rowan'&&Q('m_ferry')) return S(`"Thank you" knot's still holding. Biggest knot in the lagoon. People come to look at it. I charge.`,`My thank-you knot still holds. People come to look.`);
  if(id==='m_squint'&&Q('m_lighthouse')) return S(`Grandpa came down for supper! It was fish. He pretended not to mind. He had seconds.`,`Grandpa came down for supper! I'm so happy!`);
  if(id==='m_gilly'&&G.flags.tk_come==='yes'&&m3pBoatIn()) return S(`That baker girl Tikka says bread is better than fish. We're not speaking. We speak all day. It's lovely.`,`Tikka says bread beats fish. We argue all day. It's lovely.`);
  if(id==='m_gilly'&&Q('m_moonfish')) return S(`I painted the Moonfish on my sign. Now everybody wants to eat here. I tell them it's not on the menu. Some fish are for looking at.`,`I painted the Moonfish on my sign. It's not on the menu!`);
  if(id==='m_ned'&&Q('m_lighthouse')) return S(`Silver light, every night. The moths still come. Now they just sit and look at it. Like me. Hmph.`,`Silver light every night. The moths just look at it.`);
  if(id==='m_coralia'&&C.m_hush==='free') return S(`A white moth flew low over the reef last night, glowing softly. She didn't stop. She didn't need to. You did a kind thing, small dragon.`,`A white moth flew over the reef. Glowing. You did a kind thing.`);
  if(id==='m_coralia'&&m3pVesperOn()) return S(`Your cousin with the moth mask came to the surface to wave at our lookouts. Very rude. Very charming. Family, I suppose.`,`Your cousin in the moth mask waved at us. Rude. Charming.`);
  if(id==='m_ripple'&&Q('m_leash')) return S(`Your librarian friend and I have agreed on nothing at all. It has been the best week of my life.`,`Wren and I agree on nothing. Best week ever!`);
  if(id==='m_rocket'&&F.m_race_won) return S(`Rocket is the fastest swimmer in Coralcombe. Second fastest is... me. Wait. That's not right. Ugh. You.`,`I'm fastest. No. You are. Ugh!`);
  if(id==='m_kipper'&&F.m_puff_done) return S(`You deflated the Baron! I have written a ballad. Forty verses. It rhymes "Puffington" with "huffington". Shall I sing it? I shall.`,`You beat the Baron! I wrote a song with forty verses!`);
  if(id==='m_kelp'&&F.m_dolphin) return S(`How's the Dolphin Kick, sprat? One tail. Remember. Just the one.`,`How's the Dolphin Kick? Just one tail, sprat.`);
  if(id==='m_rafi'&&m3pGl()) return S(`You have an auntie made of snow? Bring her! No, she'd melt. Bring a postcard!`,`Your auntie is made of snow? Bring a postcard!`);
  if(id==='m_saffron'&&F.m_eclipse2) return S(`One candle's worth of moon left in her. I sit with her every night. I won't stop.`,`My well is dim. I sit with her every night.`);
  if(id==='m_kiln'&&G.weapons&&G.weapons.glaive) return S(`How's my glaive? Is it cutting? Is it shining? Have you cut bread with it? Don't.`,`How's my glaive? Don't cut bread with it!`);
  if(id==='m_esme'&&Q('m_lamps')) return S(`Twelve lamps, every night. Bertha is very proud. Small Bertha is unbearable.`,`All twelve lamps glow. Bertha is proud.`);
  if(id==='m_dusty'&&Q('m_noodle')) return S(`Dusty: We miss Noodle. Dune: We don't miss our shoes. Dusty: We miss him a lot. Dune: ...Yeah.`,`We miss Noodle. Not our shoes.`);
  if(id==='m_jinx'&&!m3pVesperOn()) return S(`A moth dropped something in the dunes last week. A letter. I keep a lost-and-found. Everything is for sale. Even lost things.`,`A moth dropped a letter. It's in my lost-and-found.`);
  if(F.m_eclipse2&&m3pMoonPerson(id)&&Math.random()<0.5) return S(`The moon is less than half now. My mother says to keep a lamp in the window. So I keep three.`,`The moon is less than half. I keep three lamps lit.`);
  return base(id);
}; }
const m3pMoonPerson=id=>{ const c=CASTBY[id]; return !!c&&M3P_TOWNS.includes(c.town); };

// ---------- 9. what Moonfall says out loud. The stock Embermere barks, chats and deed greetings stay in Embermere
// mouths (and Act II's in the coast's); a short list of universal ones (Pip, rain, the night, weapons) still works here.
{ const OKB={pip1:1,pip2:1,pip3:1,pip4:1,duC2:1,duC3:1,brC2:1,grC1:1,grC2:1,grC3:1,rain1:1,rain2:1,rain3:1,rain4:1,night3:1,night4:1,low1:1,low2:1,dag1:1,boom1:1,bow1:1,bow2:1,lvl2:1};
  const OKC={pip:1,rain:1,night:1,wings:1,whisper:1,breath:1,mip:1,goat:1,hat:1,duch:1,wolf:1,brisk:1,map:1};
  const notHere=f=>n=>f(n)&&!M3P_TOWNS.includes(n.town)&&!(G&&M3P_TALKERS[n.id]&&m3pIV()&&curMap()===3&&m3pVisitC()[n.id]);
  for(const b of BARKS) if(!OKB[b.k]&&!String(b.k).startsWith('m_')) b.w=notHere(b.w);
  for(const c of CHATS) if(!OKC[c.k]&&!String(c.k).startsWith('m_')){ c.a=notHere(c.a); c.b=notHere(c.b); }
  for(const k in DGREET) for(const e of DGREET[k]) if(!k.includes('@')) e[0]=e[0]+'|'+M3P_NOT; }
const m3pE1=()=>!!G.flags.m_eclipse1, m3pE2=()=>!!G.flags.m_eclipse2, m3pMoonGone=()=>(typeof moonLeft==='function'?moonLeft():100)<100;
// personal barks
B('m_dab1','id:m_dabble',ALWAYS,S(`Mind the gap! Mind that gap too! Mind all the gaps!`,`Mind the gaps!`));
B('m_dab2','id:m_dabble',ALWAYS,S(`*wrings out a sock* Ah. Better. *puts it back on* Ah. Worse.`,`*wrings out a sock* Ah. Worse.`));
B('m_win1','id:m_winnie',ALWAYS,S(`Shh, Ollie. Not now, Ollie.`,`Shh, Ollie.`));
B('m_row1','id:m_rowan',ALWAYS,S(`Bowline, clove hitch, sheepshank, "go away" knot...`,`*ties knots*`));
B('m_squ1','id:m_squint',ALWAYS,S(`LAND HO! ...It's still Palmcrest.`,`LAND HO! Still Palmcrest.`));
B('m_squ2','id:m_squint',()=>!m3pQ('m_lighthouse'),S(`*looks at Gull Isle through her telescope* Still dark. Still dark, Grandpa.`,`Grandpa's light is still dark.`));
B('m_gil1','id:m_gilly',ALWAYS,S(`FISH! Get your fish! Fresh fish, old fish, fish-shaped fish!`,`FISH! Get your fish!`));
B('m_ned1','id:m_ned',ALWAYS,S(`Shoo. Shoo. Go and sit on someone else's lamp.`,`Shoo, moths. Shoo.`));
B('m_ned2','id:m_ned',()=>m3pQ('m_lighthouse'),S(`*polishes the great lamp* Silver. Ha. Silver.`,`*polishes the lamp* Silver!`));
B('m_cor1','id:m_coralia',ALWAYS,S(`The tide is restless. So is the queen.`,`The tide is restless.`));
B('m_rip1','id:m_ripple',ALWAYS,S(`Where did I put... ah. On my head. Sorry, fish.`,`Where's my... oh. Sorry, fish.`));
B('m_roc1','id:m_rocket',ALWAYS,S(`*does a loop* Did you see that? Did you?`,`*loops* Did you see?`));
B('m_kip1','id:m_kipper',ALWAYS,S(`Steady, Lady Bubbles. Steady. Is that a crab? It's a rock. Steady.`,`Is that a crab? It's a rock. Steady.`));
B('m_kel1','id:m_kelp',ALWAYS,S(`Pearls! Kelp tonic! Hugs! One of those is free!`,`Pearls! Tonic! Hugs!`));
B('m_raf1','id:m_rafi',ALWAYS,S(`HO HO! Did I tell you about the time... yes? I'll tell it again, bigger!`,`HO HO! Did I tell you this one?`));
B('m_saf1','id:m_saffron',ALWAYS,S(`Don't touch the well.`,`Don't touch the well.`));
B('m_kil1','id:m_kiln',ALWAYS,S(`EH? WHAT? Oh. Nobody said anything. Good.`,`EH? WHAT?`));
B('m_kil2','id:m_kiln',()=>!!G.items.m_mooncrumb,S(`I can see moonlight in your satchel! Bring it here!`,`Moonlight in your bag! Bring it here!`));
B('m_esm1','id:m_esme',ALWAYS,S(`Bertha, Small Bertha, Old Pip, Gertrude, Gilbert...`,`Bertha, Small Bertha, Old Pip...`));
B('m_dus1','id:m_dusty',ALWAYS,S(`Dusty: Tray race! Dune: We have one tray! Dusty: Tray walk!`,`Tray race! One tray. Tray walk!`));
B('m_jin1','id:m_jinx',ALWAYS,S(`*shimmers a little*`,`*shimmers*`));
// the returning friends, while they stand in Moonfall
const m3pHereV=id=>()=>!!(G&&m3pIV()&&curMap()===3&&m3pVisitC()[id]);
B('m_vdel1','id:dell',m3pHereV('dell'),S(`Toot toot! That's the brass whistle. I just like pressing it.`,`Toot toot! I like the whistle.`));
B('m_vdel2','id:dell',()=>m3pHereV('dell')()&&m3pPier(),S(`End of the world. Lovely spot for a sandwich.`,`End of the world. Nice spot for lunch.`));
B('m_vwre1','id:wren',m3pHereV('wren'),S(`Page forty-one... the raft moved... page forty-two.`,`Page forty-one... the raft moved.`));
B('m_vmag1','id:f_mags',m3pHereV('f_mags'),S(`If you hear a bang from the dock, don't worry. That was me.`,`A bang? That was me.`));
B('m_vtik1','id:ev_tikka',m3pHereV('ev_tikka'),S(`Lumpy buns! Fresh lumpy buns! Lumpy means love!`,`Lumpy buns! Lumpy means love!`));
B('m_vjun1','id:juniper',m3pHereV('juniper'),S(`The dunes moved again. I'll redraw them. Again.`,`The dunes moved! I'll redraw them.`));
B('m_vves1','id:c_vesper',()=>m3pHereV('c_vesper')()&&!m3pPierAll(),S(`Psst. Up here. No, here.`,`Psst. Up here!`));
B('m_vmar1','id:maren',()=>m3pHereV('maren')(),S(`Boots laced before you climb. Both of them. I mean it.`,`Lace your boots first!`));
B('m_vqui1','id:quill',()=>m3pHereV('quill')(),S(`Fascinating. Terrifying. Mostly fascinating.`,`Fascinating! And scary.`));
// town barks: the wobbly tide, the eclipses, the lamps, the dark nights
B('m_dw1',M3P_DW,ALWAYS,S(`The tide went out this morning and didn't come back for lunch.`,`The tide went out and didn't come back!`));
B('m_dw2',M3P_DW,ALWAYS,S(`My raft drifted off with my breakfast on it. I miss my breakfast.`,`My raft drifted off with my breakfast.`));
B('m_dw3',M3P_DW,m3pE1,S(`Did you see that moth? I've stopped going outside. I'm a raft town. Everything is outside.`,`Did you see that moth? I won't go outside!`),{d:'m_eclipse1'});
B('m_dw4',M3P_DW+'|kid',m3pMoonGone,S(`Somebody took a bite out of the moon! Was it you?`,`Who bit the moon? Was it you?`));
B('m_dw5',M3P_DW,()=>G.flags.m_ship==='glaciar',S(`The north beach is still frozen! I've been ice skating! On a beach! Thank your auntie!`,`I went ice skating on the beach!`));
B('m_dw6',M3P_DW,()=>m3pQ('m_lighthouse')&&isNight(),S(`Look! Old Ned's light! Silver! I can see my own feet!`,`Old Ned's light is on! Silver!`),{d:'q_m_lighthouse'});
B('m_dw7',M3P_DW,()=>!!G.flags.m_dell_away,S(`Captain Dell's gone west to fetch your mom. He tooted twice. That's sailor for "back soon".`,`Dell went to get your mom. Back soon!`));
B('m_sb1',M3P_SB,ALWAYS,S(`A dragon in Sable! Is it true you breathe fire? Can you light my lamp? I'll pay in dates.`,`Can you light my lamp? I'll pay in dates!`));
B('m_sb2',M3P_SB,m3pE2,S(`The well's gone dim, and my lamp with it. I keep walking into my own tent pole.`,`The well is dim. So is my lamp.`),{d:'m_eclipse2'});
B('m_sb3',M3P_SB,ALWAYS,S(`Esme says a lamp makes everything better. I hate it when she's right.`,`Esme says lamps make things better. She is right.`));
B('m_sb4',M3P_SB,()=>m3pQ('m_lamps'),S(`All twelve lamps lit again! Esme cried, and Small Bertha looks very pleased with herself.`,`All twelve lamps! Esme cried.`),{d:'q_m_lamps'});
B('m_sb5',M3P_SB+'|kid',m3pMoonGone,S(`Somebody took a bite out of the moon! Was it you?`,`Who bit the moon? Was it you?`));
B('m_sb6',M3P_SB,()=>m3pVesperOn()&&m3pR('m_sable')&&isNight(),S(`There's a girl on the tent roofs at night. Moth mask. She waves at the lamps. Friend of yours?`,`A moth-mask girl sits on the roofs at night. Your friend?`));
B('m_cc1',M3P_CC,ALWAYS,S(`A dragon who swims! What next, a fish who walks?`,`A swimming dragon! What next?`));
B('m_cc2',M3P_CC,ALWAYS,S(`Mind the coral. It bites. Only a little.`,`Mind the coral. It bites a little.`));
B('m_cc3',M3P_CC,()=>!!G.flags.m_puff_done,S(`The Sunken Gate is open! I swam through it twice! The Baron waved. With a fin.`,`The Sunken Gate is open! The Baron waved.`),{d:'m_puffdone'});
B('m_cst1',M3P_CT,()=>hasAbil('dive'),S(`You can breathe water now? Can you breathe soup?`,`You can breathe water? Can you breathe soup?`),{d:'m_dive'});
B('m_cst2',M3P_CT,()=>hasAbil('burrow'),S(`I saw a sand mound with two little horns go past the market! Was that you?`,`A sand mound with horns went by! Was that you?`),{d:'m_burrow'});
B('m_cst3',M3P_CT,()=>hasAbil('moonfire'),S(`Silver fire! Like the old songs! Do it again!`,`Silver fire! Like the old songs!`),{d:'m_moonfire'});
B('m_cst4',M3P_CT,()=>!!(G.weapons&&G.weapons.glaive)&&G.weapon==='glaive',S(`Is that a piece of the moon on a stick?`,`Is that a piece of the moon on a stick?`),{d:'wpn_glaive'});
// two people talking (ACT4 6.14)
VCH('m_ch1','id:m_dabble','id:m_winnie',ALWAYS,[[0,S(`Is it a good day, Winnie?`,`Is it a good day, Winnie?`)],[1,S(`Ollie says no.`,`Ollie says no.`)],[0,S(`Ollie always says no.`,`Ollie always says no.`)]]);
VCH('m_ch2','id:m_rafi','id:m_kiln',ALWAYS,[[0,S(`Kiln, have you ever seen snow?`,`Kiln, have you seen snow?`)],[1,S(`I've made snow. Out of glass. It was sharp.`,`I made glass snow. It was sharp.`)]]);
VCH('m_ch3','id:wren','id:m_ripple',ALWAYS,[[0,S(`Your spelling is atrocious.`,`Your spelling is awful.`)],[1,S(`Your spelling is underwater.`,`Your spelling is underwater.`)],[0,S(`...Fair.`,`Fair.`)]]);
VCH('m_ch4','id:ev_tikka','id:m_gilly',ALWAYS,[[0,S(`Bread is better than fish.`,`Bread is better than fish.`)],[1,S(`Fish is bread. Wet bread.`,`Fish is bread. Wet bread.`)],[0,S(`That's not... hm.`,`That's not... hm.`)]]);
VCH('m_ch5','id:m_rowan','id:m_dabble',ALWAYS,[[0,S(`Mayor, your raft's loose again.`,`Mayor, your raft is loose.`)],[1,S(`Is it? How exciting!`,`How exciting!`)],[0,S(`*ties a "sigh" knot*`,`*ties a sigh knot*`)]]);
VCH('m_ch6','id:m_coralia','id:m_kipper',ALWAYS,[[1,S(`My queen! A crab has entered the hall!`,`My queen! A crab!`)],[0,S(`It lives here, Sir Kipper.`,`It lives here.`)],[1,S(`...Bravely noted.`,`Bravely noted.`)]]);
VCH('m_ch7','id:m_rocket','id:m_kelp',ALWAYS,[[0,S(`Nana! I swam to the Spire and back!`,`I swam to the Spire and back!`)],[1,S(`Did you eat first, sprat?`,`Did you eat first?`)],[0,S(`...No.`,`No.`)],[1,S(`Kelp. Now.`,`Kelp. Now.`)]]);
VCH('m_ch8','id:m_esme','id:m_saffron',ALWAYS,[[0,S(`The lamps are drinking more oil every night.`,`The lamps drink more oil now.`)],[1,S(`The well is giving less light every night.`,`The well gives less light.`)],[0,S(`Then we'll be brighter.`,`Then we'll be brighter.`)],[1,S(`...Yes.`,`Yes.`)]]);
VCH('m_ch9','id:m_squint','id:dell',ALWAYS,[[0,S(`Captain! Is your boat a pirate ship?`,`Is your boat a pirate ship?`)],[1,S(`It's a Biscuit. The Soggy Biscuit Three.`,`It's the Soggy Biscuit Three.`)],[0,S(`A pirate biscuit!`,`A pirate biscuit!`)]]);
VCH('m_ch10',M3P_SB,M3P_SB,m3pE2,[[0,S(`Did you see her drink the well?`,`Did you see her drink the well?`)],[1,S(`Like a cat with milk.`,`Like a cat with milk.`)],[0,S(`A very big cat.`,`A very big cat.`)]]);
VCH('m_ch11',M3P_DW,M3P_DW,ALWAYS,[[0,S(`Where's the town today?`,`Where's the town today?`)],[1,S(`About here, I think.`,`About here.`)],[0,S(`Same as yesterday, then.`,`Same as yesterday.`)],[1,S(`No, yesterday it was about there.`,`No, it was there.`)]]);
// greetings that react to what Ash did, in the east and before
Object.assign(DGREET,{
  m_eclipse1:[[M3P_CT,S(`The sun went out! In the middle of the day! And that shape across it... Ash, was that a moth?`,`The sun went out! Was that a moth?`)]],
  m_eclipse2:[[M3P_SB,S(`She drank our well. Like a bowl of milk. I'll never drink milk again.`,`She drank our well. I'll never drink milk again.`)]],
  m_puffdone:[[M3P_DW+'|'+M3P_CC,S(`You popped the Baron! The whole lagoon heard the PFFFFT!`,`You popped the Baron! We heard the PFFFT!`)]],
  'm_puffdone@m_kipper':[['any',S(`A wet pony, he said! Who is the wet pony now, Baron? ...Him. He's the wet one.`,`Who's the wet pony now, Baron? Him!`)]],
  m_dive:[[M3P_CC,S(`You learned to Dive! Ember taught our priests that, long ago. Welcome to the water, small dragon.`,`You can dive! Ember taught our priests that.`)]],
  m_burrow:[[M3P_SB,S(`The worms taught you to dig? Rafi says that makes you half caravan, half worm. It's a compliment. Mostly.`,`You can dig like a worm! Half worm!`)]],
  m_moonfire:[[M3P_CT,S(`Moonfire! Silver fire! My grandmother sang about it. I didn't think it was real!`,`Moonfire! I didn't think it was real!`)]],
  'm_moonfire@m_coralia':[['any',S(`Moonfire. The girl with horns taught it to Lumen, and now a dragon brings it home to us. I'll have the old song sung tonight.`,`Moonfire comes home to us in a dragon. We will sing tonight.`)]],
  wpn_glaive:[[M3P_SB,S(`Old Kiln made a glaive? Out of the moon? He made me a cup once. It melted.`,`Kiln made a glaive? He made me a cup once. It melted.`)]],
  'wpn_glaive@m_kiln':[['any',S(`MY GLAIVE! In the hands of a dragon! I'll never top it. I'll try. With shoes.`,`MY GLAIVE! I'll never top it. I'll try. With shoes.`)]],
  q_m_ferry:[[M3P_DW,S(`The ferry runs again! I took it to the Strand and back for no reason! Twice!`,`The ferry runs! I rode it twice for fun!`)]],
  q_m_moonfish:[[M3P_DW,S(`Gilly saw the Moonfish! She cried into the soup. The soup was improved.`,`Gilly saw the Moonfish! She cried into the soup.`)]],
  q_m_race:[[M3P_CC,S(`You beat Rocket! Nobody beats Rocket! Except Pickles, once, by cheating.`,`You beat Rocket! Nobody does that!`)]],
  q_m_noodle:[[M3P_SB,S(`You took the baby worm home! Dusty and Dune are telling everyone. They're also telling everyone they want another one.`,`You took Noodle home! The twins want another worm.`)]],
  q_m_lamps:[[M3P_SB,S(`Every lamp in Sable, lit again! It feels like the moon came home. A little bit.`,`Every lamp is lit! Like the moon came home.`)]],
  q_m_leash:[[M3P_CC,S(`Elder Ripple says the old priests' book has been read. By a dry person! He's been smiling for three days.`,`The old book was read! Ripple smiles all day.`)]],
  'ch_c_vesper_friend':[[M3P_SB,S(`A girl in a moth mask stays on the tent roofs. She says she's "watching your back". We said, fine, but don't steal the dates.`,`A moth-mask girl watches your back. Don't steal dates!`)]],
  'ch_c_vesper_foe':[[M3P_DW,S(`A girl in a moth mask sailed past last month. She didn't wave. She didn't look happy. Do you know her?`,`A sad girl in a moth mask sailed past. Do you know her?`)]],
  'ch_f_glaciar_free':[[M3P_DW,S(`They say the ice dragon up north woke up kind this year, and a little dragon did it. Was that you?`,`The ice dragon woke up kind. Was that you?`)]],
  'ch_f_glaciar_defeat':[[M3P_CT,S(`They say an ice dragon slept up north, and now she's sleeping for good. Is it true? That's a bit sad.`,`An ice dragon up north sleeps for good now? Sad.`)]],
  'ch_m_hush_free':[[M3P_CT,S(`A white moth flew over the dunes, glowing like a lamp. She didn't eat a single one. That's a good moth.`,`A glowing white moth flew by. A good moth.`)]],
  'ch_fennick_forgive@m_esme':[['any',S(`I hear your lamp-man back home keeps every lantern lit, all night. I'd like to shake his hand. Carefully. Lamp-men have hot hands.`,`Your lamp-man keeps every lamp lit. I want to shake his hand.`)]]
});
{ const base=syncDeeds; syncDeeds=function(){ base(); try{ if(G&&G.mode==='story'&&m3pIV()){ const F=G.flags, C=G.choices;
  if(F.m_eclipse1) deed('m_eclipse1'); if(F.m_eclipse2) deed('m_eclipse2'); if(F.m_puff_done) deed('m_puffdone');
  for(const a of ['dive','burrow','moonfire']) if(hasAbil(a)) deed('m_'+a);
  for(const c of ['c_vesper','f_glaciar','m_hush','m_deal']) if(C[c]) deed('ch_'+c+'_'+C[c]); } }catch(e){} }; }
Object.assign(DEED_PRI,{m_eclipse1:8,m_eclipse2:8,m_puffdone:7,m_dive:7,m_burrow:7,m_moonfire:7,wpn_glaive:5});

// ---------- 10. shops and the inn (prices about 3.5 times Act I's, BALANCE.md 8)
SHOPTALK.m_kelp=()=>runShop('m_kelp',S(`Pearls for your pockets, sprat, and tonic for your tummy.`,`Pearls and tonic, sprat!`),[
  [S('Refill your healing draughts (kelp tonic, tastes of feet)','Refill your draughts'),20,()=>{ player.potions=player.potionsMax; setBanner(S('Draughts refilled','Draughts full'),S('Tastes of feet. Works, though.','Tastes of feet. It works!'),1.8); },()=>player.potions<player.potionsMax||S('Your flasks are already full, sprat.','Your flasks are full.')],
  [S('A Pearl Lamp (a lantern for dark rooms)','A Pearl Lamp (a lantern)'),60,()=>{ G.items.lantern=1; setBanner(S('Pearl Lamp','Pearl Lamp'),S('It glows soft and silver. Dark rooms will be kinder now.','It glows. Dark rooms are kinder now.'),2.2); },()=>!G.items.lantern||S('You already have a lamp, sprat.','You have a lamp already.')],
  [S('Air bubbles in a jar (fills your air once under water, automatically)','A jar of air bubbles'),40,()=>{ G.items.m_airjar=(G.items.m_airjar||0)+1; setBanner(S('A jar of air','A jar of air'),S('When your air runs low under water, you’ll open it.','It opens when your air runs low.'),2.4); },()=>(G.items.m_airjar||0)<2||S('Two jars is plenty, sprat. Three and you’d float.','Two jars is enough.')],
  [S('A pearl for your pocket (it doesn’t do anything; it’s just lovely)','A pearl. Just lovely.'),5,()=>{ G.items.m_pearl=(G.items.m_pearl||0)+1; setBanner(S('A lovely pearl','A lovely pearl'),S('It does nothing at all. It’s lovely.','It does nothing. It’s lovely.'),2); }]
]);
ITEM_NAMES.m_airjar=S('A jar of air bubbles','A jar of air'); ITEM_NAMES.m_pearl=S('A lovely pearl','A lovely pearl');
SHOPTALK.m_jinx=()=>runShop('m_jinx',S(`Jinx's Wares! Everything is real until you blink.`,`Jinx's shop! Real until you blink.`),[
  [S('A bottle of shade (heals a little; mostly empty)','A bottle of shade (heals)'),15,()=>{ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*0.3); setBanner(S('Ahh. Shade.','Ahh. Shade.'),S('Mostly empty. Somehow cool.','Mostly empty. Cool.'),1.8); }],
  [S('A Pip treat (made of mirage, and oats)','A Pip treat'),70,()=>{ G.pipTreats=(G.pipTreats||0)+1; setBanner(S('Pip treat','Pip treat'),S('Mip! (Pip sniffs it suspiciously, then eats it in one bite.)','Mip! Pip eats it.'),1.8); },()=>G.flags.pip?((G.pipTreats||0)<3||S('Pip is too full. Mip.','Pip is full.')):S('You don’t have a dragon to feed.','No dragon to feed.')],
  [S('Everlasting Lamp Oil (for lamps that must never go out)','Lamp oil that never runs out'),90,()=>{ giveItems({m_lampoil:1}); },()=>(m3pR('m_glasswall')&&!G.items.m_lampoil)||(G.items.m_lampoil?S('You have the oil already. It never runs out. That’s the point.','You have it already.'):S('Lamp oil? Sable’s lamps are lit. Come back when they aren’t.','Sable’s lamps are lit. Not now.'))],
  [S('A desert hat (wide, stripy, very real)','A desert hat'),120,()=>{ G.items.m_hat_desert=1; m3pHat('m_hat_desert'); setBanner(S('The Desert Hat','The Desert Hat'),S('Wide brim, red band. You look like a caravan legend.','You look like a caravan legend!'),2.4); },()=>!G.items.m_hat_desert||S('You’re wearing it. Or I am. One of us is.','You have it already.')],
  [S('The moth-dropped letter from the lost-and-found','The moth-dropped letter'),30,()=>{ giveItems({m_vletter:1}); },()=>(m3pOn('m_vesper')&&!G.items.m_vletter&&!G.flags.m_vletter_read&&!m3pVesperOn())||S('That one’s sold. To you. You have it.','You have it already.')]
]);
ITEM_NAMES.m_hat_desert=S('The Desert Hat','The Desert Hat');
const M3P_INN={
  m_gilly:()=>runShop('m_gilly',S(`The Floating Kitchen! Beds that rock you to sleep, and fish. So much fish.`,`Beds that rock, and fish!`),[
    [S('Rent a hammock for the night','Rent a hammock'),G.flags.perk_freeinn?0:18,()=>{ innRest(); }],
    [S('A bowl of fish stew (full heal)','Fish stew (full heal)'),20,()=>{ player.hp=player.maxHp; setBanner(S('Fish stew','Fish stew'),S('It tastes like the sea gave you a hug.','Like a hug from the sea.'),1.8); }],
    [S('A slice of fish pudding (heal, and courage)','Fish pudding (heal)'),12,()=>{ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*0.5); setBanner(S('Fish pudding','Fish pudding'),S('That took courage. Gilly is so proud.','Brave! Gilly is proud.'),1.8); }]])
};
// extra options in the talk menu of Moonfall people (the inn, the reforge, quest topics, the twins)
{ const base=compTalkOpts; compTalkOpts=function(id,n){
  const o=base(id,n); if(!n||!G||G.mode!=='story') return o;
  try{
    if(M3P_INN[id]&&!m3pGillyOut()) o.unshift({t:S('A bed, or something to eat?','A bed, or food?'),tag:'shop',fn:()=>M3P_INN[id](),end:true});
    // (v11 J11b: the twins' thank-you for Noodle, with its 40 coins, is their talk line in act4/people.js; the old menu row
    // here paid the same 40 coins a second time, so it is gone)
    if(id==='m_squint'&&m3pAt('m_lighthouse',0)&&!G.items.m_sandwich) o.push({t:S('Can I have the sandwich for your grandpa?','The sandwich for Ned?'),tag:'quest',fn:()=>giveItems({m_sandwich:1}),then:[m3pL('m_squint',`Here. It's fish. Everything is fish.`,`Here. It's fish.`)],back:true});
    if(id==='m_rowan'&&m3pAt('m_ferry',1)) o.push({t:S('How do the ferry posts work?','How do the posts work?'),tag:'quest',then:[m3pL('m_rowan',`Each post on the sandbars is crooked. Jump and slam it down straight, like a mallet. Then fling the line across with that tail of yours. Post one, post two, post three, then the Gate.`,`Jump and slam each post down. Then throw the line with your tail.`)],back:true});
    if(id==='m_esme'&&m3pAt('m_lamps',0)) o.push({t:S('Where are the lamps that are hard to reach?','Where are the hard lamps?'),tag:'quest',then:[m3pL('m_esme',`Dot and Dash are up on tall poles by the market: a long, hot flame reaches them, or fly past. Muffin and Barnaby blew over in the eclipse wind and got buried. Look where the sand sparkles. Lady Wellington is on the well's islet. Coco is up the tallest palm. And Little Sun is inside Rafi's tent.`,`Two are on tall poles. Two are buried where sand sparkles. One is on the well island. One is up a palm. One is in Rafi's tent.`)],back:true});
    if(id==='m_kiln'&&m3pAt('m_glaive',2)) o.push({t:S('How do I temper the moon crumb?','How do I temper it?'),tag:'quest',then:[m3pL('m_kiln',`EH? MOONFIRE! In the FURNACE! Breathe it in for a good long while, until the furnace turns SILVER! Not candlelight! MOONFIRE!`,`Breathe MOONFIRE into the furnace until it turns SILVER!`)],back:true});
  }catch(e){ console.error(e); }
  return o; }; }
// pending quest business for this person (so a story talk below never swallows a quest step, a minigame or an offer)
// (only Act IV quests count: an old Act I quest of a visitor, like Dell's fishing rod, is not offered in Moonfall)
function m3pQuestFor(id){
  for(const qid in G.quests){ if(!String(qid).startsWith('m_')) continue; const st=stepOf(qid); if(!st) continue; if(st.t==='talk'&&st.npc===id&&haveAll(st.take)) return true; if(st.mini&&st.npc===id&&!G.flags[st.flag]) return true; }
  const av=availableFrom(id); return !!(av&&String(av).startsWith('m_')&&!QDEFS[av].errand&&!(G.declined&&G.declined[av]===dayNow()));
}
// the people this module speaks for in Moonfall (their story beats in x3_story's stages come first, see below)
const M3P_TALKERS={dell:1,wren:1,f_mags:1,ev_tikka:1,maren:1,quill:1,juniper:1,c_vesper:1,m_sandy:1,f_glaciar:1};
// ---------- 11. the returning cast in Moonfall (ACT4 4.1, 4.3, 6.2c, 11): one-line reasons, their own talk
// v10 (CHANGES.md A4S, N5S): does the story data speak for this person in the current act? A talk entry of this very
// act (a "what's new" line, a first talk or a menu option) that holds now. Then this module's hook stands down and the
// person's menu opens with the data's words; what only this hook can do (Mags's spare bombs, Mom's star-iron, Juniper's
// map shop, Tikka's bun, Glaciar's flight home) still comes first. (An earlier act's entries do not count: Act III's
// lines for Mags are not for Moonfall.)
function m3pDataTalk(id){
  try{ if(typeof S10==='undefined'||!S10||!S10.booted||typeof s10TalkOk!=='function'||!G) return false;
    const a=actOf(G.stage); return (S10.talk[id]||[]).some(T=>!T.bark&&T._owner&&+T._owner.act===a&&s10TalkOk(T)); }catch(e){ return false; }
}
function m3pTalkOnce(key,lines,then){ if(G.seenTalk&&G.seenTalk[key]) return false; G.seenTalk=G.seenTalk||{}; G.seenTalk[key]=1; m3pSay(lines,then); return true; }
const M3P_DELL1=[m3pL('dell',`Pebble brought me a letter from Old Sal. "Dell. Finished your lake boat. Six years and three acts. It floats. Mostly. Sal."`,`Old Sal wrote: "Your lake boat is done. Six years and three acts. It floats. Mostly."`),
  m3pL('dell',`Three acts? What's an act?`,`Three acts? What's an act?`),m3pL('ash',`I think we're in the fourth one.`,`I think we're in the fourth one.`),
  m3pL('dell',`Oh, and my cousin Wendel wrote you a poem. "There once was a dragon called Ash, who watched as the moon went splash." That's it. That's the whole poem.`,`Wendel wrote a poem: "A dragon called Ash watched the moon go splash." That's all.`)];
const M3P_WREN=[m3pL('wren',`Ash! Look at me. Outside. On a raft. In the SEA. I've been sick four times and I've never been happier.`,`Ash! I'm outside! On a raft! I was sick four times. I'm so happy!`),
  m3pL('wren',`Elder Ripple of the merfolk keeps Old Lumen's records. I can read Lumen writing, you know. Badly. Very badly. Better than anyone else up here, which is nobody.`,`I can read Lumen writing. Badly. Better than anyone up here.`),
  m3pL('wren',`If you find anything with writing on it down there, bring it to me. Even if it's soggy. Especially if it's soggy.`,`Find anything with writing? Bring it. Even soggy. Especially soggy.`)];
onTalk(n=>{
  if(!G||G.mode!=='story'||!m3pIV()) return false;
  const id=n.id;
  if(id==='m_ned'&&!m3pHigh(1000,61905,'claws')){ m3pSay([m3pN(`Old Ned is up at the very top of the lighthouse. You'd have to climb the tower to talk to him.`,`Old Ned is at the top of the lighthouse. Climb up!`)]); return true; }
  if(!M3P_TALKERS[id]&&!n.m3pNap) return false;
  // a story beat of the current stage for this person wins (e7_acts runs the onTalk hooks before the stage's talk)
  { const d=STAGEDEF[G.stage]; if(d&&d.talk&&!G.done){ try{ if(d.talk(n)) return true; }catch(e){ console.error(e); } } }
  if(m3pQuestFor(id)) return false;
  // (v10) what no data line can do, before the data's talk: Mags's spare bombs, Mom's star-iron, Juniper's map shop in
  // Sable, Tikka's bun; then a person the story data speaks for in this act gets the data's talk (m3pDataTalk)
  if(id==='f_mags'&&m3pR('m_reef')&&!(G.weapons&&G.weapons.bombs)){ m3pSay([m3pL('f_mags',`No bombs? NO BOMBS? Here. Take these. Don't thank me. Thank me a little.`,`No bombs? Here! Thank me a little.`)],()=>{ giveWeapon('bombs'); }); return true; }
  if(id==='maren'&&m3pPierAll()&&G.items.m_stariron&&!G.flags.m_stariron_done&&m3pDataTalk(id)){ m3pSay([m3pStarIron()]); return true; }
  if(id==='juniper'&&m3pAct()===4&&m3pR('m_sable')&&!(m3pR('n_bridge')&&stageAt('n_bridge')>=0)) return m3pJuniper(n);
  if(id==='ev_tikka'&&G.flags.tk_come==='yes'&&!G.flags.m_tk_bun&&m3pDataTalk(id)){ G.flags.m_tk_bun=1; m3pSay([m3pN(`Tikka presses a warm lumpy bun into your claws. It will heal you when you're badly hurt.`,`Tikka gives you a lumpy bun. It heals you when you're hurt.`)],()=>giveItems({c_lumpybun:1})); return true; }
  // (v11 J11b) Wren's first talk in Driftwood stays this hook's, ahead of the data's talk for her: it is her promise of
  // a book (q_m_leash), and saves already mark it heard here (G.seenTalk.m3p_wren)
  if(id==='wren'&&m3pIV()&&m3pBoatIn()&&!(G.seenTalk&&G.seenTalk.m3p_wren)&&m3pTalkOnce('m3p_wren',(typeof storyOwns==='function'&&storyOwns('scene','m_wren')&&Array.isArray(STORY.m_wren)?STORY.m_wren:M3P_WREN).slice())) return true;
  if(m3pDataTalk(id)) return false;
  // before the voyage: Dell at Gearhaven's Far Pier
  if(id==='dell'&&!G.flags.m_landed&&m3pR('m_sail')){
    m3pSay([m3pL('dell',pick([`Ash! The Soggy Biscuit Three, ready to sail east! Steam paddle, brass whistle, and sandwiches. Hop aboard at the end of the pier.`,`Past the end of every map I own! I've never been so happy or so scared! The boat's at the end of the pier.`]),`Ash! My boat is ready to sail east! Hop aboard at the end of the pier.`),
      m3pL('dell',`Sister Wren's coming too. She's gone green already, and we haven't left the pier.`,`Sister Wren is coming too. She feels sick already.`)]); return true; }
  // Glaciar, napping on the north isle under a sail
  if(n.m3pNap){ const L=G.seenTalk.m3p_nap?[m3pL('f_glaciar',pick([`Zzz... Oh, dumpling! I was resting my eyes. Both of them. For a day.`,`The sun this far south is far too keen. My sail hat helps, a little.`,`The raft children keep sliding down my tail. I pretend to be asleep. I'm a very good pretender.`]),`Zzz... Oh, dumpling! I was resting.`)]
      :[m3pN(`A heap of ice-blue scales is snoring on the north isle, under a sun hat made from a sail. One eye opens.`,`Glaciar naps under a sail hat. One eye opens.`),
        m3pL('f_glaciar',`Dumpling! The raft children brought me a fish. A raw one. I said thank you and froze it for later.`,`Dumpling! The raft children gave me a fish!`),
        m3pL('f_glaciar',`When you want to go home, just say. I don't do fast. But I do far.`,`Want to go home? Just say. I'm slow. But I go far.`)];
    G.seenTalk.m3p_nap=1;
    if(!(typeof CROSSINGS!=='undefined'&&CROSSINGS.m_glaciar_back)&&G.flags.m_landed) L.push(ch('f_glaciar',S('Shall we fly north, dumpling?','Fly north?'),[{t:S('Fly me back to Hearthold','Fly to Hearthold'),fn:()=>later(0.2,()=>mapTravel(6850,49100,{banner:S('Hearthold','Hearthold')}))},{t:S('Not yet, Auntie','Not yet'),then:[m3pL('f_glaciar',`Then I'll nap. Shout if you need me. Loudly. I'm a little deaf on the left.`,`Then I'll nap. Shout loudly!`)]}]));
    m3pSay(L); return true; }
  if(id==='dell'&&m3pIV()&&G.flags.m_landed){
    if(m3pPier()){ m3pSay([m3pL('dell',pick([`The Soggy Biscuit Three, moored at the end of the world. I've never been so far from a lake.`,`Your mom climbed a staircase made of moonlight. I stayed with the sandwiches. Somebody had to.`,`When you come down off that mountain, I'll be right here. The kettle's on. It's always on.`]),`I'll wait here at the pier for you.`)]); return true; }
    if(!G.seenTalk.m3p_dell1&&m3pR('m_drift')){ G.seenTalk.m3p_dell1=1; m3pSay(M3P_DELL1.slice()); return true; }
    m3pSay([m3pL('dell',pick([`The Soggy Biscuit Three! Steam paddle, brass whistle, and a captain who has never once sunk her. It's been eleven days now.`,`Three days east and I still haven't sunk! Old Sal won't believe it.`,`Mags says the engine makes that noise on purpose. I've decided to believe her.`]),`My boat still floats! Eleven days!`),
      m3pL('dell',`If you want to sail home to Gearhaven, the boat's at the end of the dock. Just say.`,`Want to sail home? The boat's at the dock.`)]); return true; }
  if(id==='wren'&&m3pIV()&&m3pBoatIn()){
    // (her first talk is the story data's m_wren when it has one: A4S's "bring me a BOOK", the promise of m_leash)
    if(m3pTalkOnce('m3p_wren',(typeof storyOwns==='function'&&storyOwns('scene','m_wren')&&Array.isArray(STORY.m_wren)?STORY.m_wren:M3P_WREN).slice())) return true;
    if(m3pQ('m_leash')){ m3pSay([m3pL('wren',pick([`Ripple and I are reading every pearl in the Archive. He forgets them, so we read them twice. It's heaven.`,`Page eleven! I keep taking it out to look at it. Ember's friends kept it for five hundred years. Under the SEA.`,`I'm writing it all down. "The Account of the Long Night." Chapter one: I was seasick.`]),`Ripple and I read every pearl. Twice!`)]); return true; }
    m3pSay([m3pL('wren',pick([`The raft keeps moving. My books keep moving. I keep reading. It's like a library that dances.`,`The merfolk keep Lumen's old books, Ash. Lumen's priests wrote about moths. Lots about moths.`]),`My books float! Lumen's priests wrote about moths.`)]); return true; }
  if(id==='f_mags'&&m3pIV()){
    if(!G.seenTalk.m3p_mags){ G.seenTalk.m3p_mags=1; m3pSay([m3pL('f_mags',`I've got a workbench on the dock now, to sell bombs to pirates. Crab pirates. They pay in shells, so it's going badly.`,`I sell bombs to crab pirates. They pay in shells!`)]); return true; }
    m3pSay([m3pL('f_mags',pick([`Do bombs work underwater? I'm going to find out. For science.`,`The engine's fine. That noise is a feature.`,`If it explodes, it's science. If it explodes twice, it's a lot of science.`]),`If it explodes, it's science!`)]); return true; }
  if(id==='ev_tikka'&&m3pIV()&&G.flags.tk_come==='yes'){
    const bun=!G.flags.m_tk_bun; G.flags.m_tk_bun=1;
    m3pSay([m3pL('ev_tikka',m3pPier()?pick([`I made a bun for the mountain. It's lumpy. Lumpy means love. The mountain doesn't deserve it.`,`Captain Dell let me steer once. We went in a circle. A very brave circle.`]):pick([`Lumpy buns! Gilly says they need fish. They do NOT need fish.`,`I carried bread all the way across the sea. To somewhere important! This is the most important place I've ever been.`]),`Lumpy buns! Lumpy means love!`)].concat(bun?[m3pN(`Tikka presses a warm lumpy bun into your claws. It will heal you when you're badly hurt.`,`Tikka gives you a lumpy bun. It heals you when you're hurt.`)]:[]),()=>{ if(bun) giveItems({c_lumpybun:1}); }); return true; }
  if(id==='maren'&&m3pPierAll()){
    const L=[m3pL('maren',pick([`Mountains are hungry work. I packed you a sandwich. It got squashed on the stairs. It's still a sandwich.`,`I mended the Heart. You'll mend the rest. That's how it works in our family: somebody hits it, and somebody breathes.`,`I'm going to stand right here and watch that bridge until you come back down it. Don't argue. You can't. I'm your mother.`]),`Take a sandwich. I'll wait right here.`)];
    if(G.items.m_stariron&&!G.flags.m_stariron_done) L.push(m3pStarIron());
    m3pSay(L); return true; }
  if(id==='quill'&&m3pPierAll()){ m3pSay([m3pL('quill',pick([`My old teacher, Professor Lumley, was the Observatory's last astronomer. He'd have loved this. A mountain! Out of the sea! I'd have hated to tell him the moon is gone.`,`I measured the mountain twice. It's taller than it was an hour ago. I don't like that number.`,`Every time I look through the telescope, the black glass seems to look back at me. I keep looking anyway.`]),`I measured the mountain. It's getting taller!`)]); return true; }
  if(id==='juniper'&&m3pIV()&&m3pR('m_sable')) return m3pJuniper(n);
  if(id==='c_vesper'&&m3pIV()&&m3pVesperOn()){
    if(m3pPierAll()){ m3pSay([m3pL('c_vesper',pick([`Not alone, cousin. I said it. I meant it. Don't make it weird.`,`I stole a hat from a moth knight on the way down. It doesn't fit. I'm keeping it.`]),`Not alone, cousin.`)]); return true; }
    if(m3pQ('m_vesper')){ m3pSay([m3pL('c_vesper',`When you go up, I'll be right behind you. My lockpicks have been out since breakfast.`,`I'll be right behind you.`)]); return true; }
    m3pSay([m3pL('c_vesper',pick([`Gran writes every week. She says the stove's still warm. She says "come home". I say "soon". It's nearly true.`,`The lamps here are nice. Less nice than climbing them. I've climbed all twelve. Don't tell Esme.`,`Cousin. You're getting better at not falling off things. I'm almost impressed.`]),`Cousin. You're getting better at climbing.`)]); return true; }
  if(id==='m_sandy'){ m3pSay([m3pN(`(a rumble that might be a snore)`,`(a rumble, maybe a snore)`),
    m3pL('m_sandy',G.bossDone&&G.bossDone.m_gravelgut||G.items.m_mooncrumb||m3pR('m_glasswall')?`...Oh, it's you, little warm thing. My husband is sleeping it off. A hundred years, he says. I'll wake him for birthdays.`:`...You smell like the sky. Is my husband very sick? He ate something shiny. I told him not to.`,
      G.bossDone&&G.bossDone.m_gravelgut||m3pR('m_glasswall')?`My husband is better now. He's sleeping.`:`Is my husband sick? He ate something shiny.`)]); return true; }
  return false;
});
// Mom and the star-iron (the Fallen Star secret): she folds it into Ash's sword on the Moon Pier
function m3pStarIron(){
  return ch('maren',S(`What's that in your satchel? Is that... star-iron?`,`Is that star-iron?`),[{t:S('Show Mom the star-iron','Show Mom the star-iron'),fn:()=>{ takeItems({m_stariron:1}); G.flags.m_stariron_done=1; player.stats.slash*=1.10; },then:[m3pL('maren',`Star-iron! Leave it with me. Your sword will never be the same. Neither will my anvil.`,`Star-iron! Your sword will never be the same!`),m3pN(`TING. TING. TING. Mom hands your sword back. It hums like a moonlit bell.`,`TING. TING. TING. Your sword hums.`),m3pDo(()=>setBanner(S('Star-iron reforge','Star-iron reforge'),S('Your sword hits 10 percent harder.','Your sword hits harder!'),2.6))]},{t:S('Later','Later'),then:[m3pL('maren',`Bring it when you're ready. I'll bring the hammer.`,`Bring it when you're ready.`)]}]);
}
// Juniper's Map Tent in Sable (ACT4 4.3): the four Act IV dungeon maps, 40 coins each; the Observatory's for free
const M3P_DUN=[['m_lumen',S('Drowned Lumen','Drowned Lumen')],['m_burrows',S('the Sandworm Burrows','the Sandworm Burrows')],['m_mirror',S('the Mirror Temple','the Mirror Temple')],['m_obs',S('the Eclipse Observatory','the Eclipse Observatory')]];
function m3pMapKey(id){ const D=typeof DUNGEONS!=='undefined'&&DUNGEONS[id]; return 'dmap_'+((D&&D.save)||id); }
function m3pJuniper(n){
  if(m3pR('n_bridge')&&stageAt('n_bridge')>=0){ m3pSay([m3pL('juniper',`I saw it from Sable! A mountain! I came under the Glasswall on my belly to get here. I'm drawing it through the Professor's telescope, but it won't hold still.`,`I saw the mountain from Sable! It won't hold still.`)]); return true; }
  const first=!G.flags.m3p_jun; G.flags.m3p_jun=1;
  const L=[]; if(first) L.push(m3pL('juniper',`Ash! I heard about a desert made of glass. I had to come. I've opened a Map Tent. Rook says hi. Rook says bring him a sand worm. I said no.`,`Ash! A glass desert! I opened a Map Tent. Rook says hi.`));
  const opts=[];
  for(const [id,nm] of M3P_DUN){ const key=m3pMapKey(id), have=!!G.found[key];
    if(id==='m_obs'){ if(!have) opts.push({t:S(`The map of ${nm} (free)`,`${nm} map (free)`),fn:()=>{ G.found[key]=true; setBanner(S('Juniper’s map','Juniper’s map'),S('Every room of the Observatory shows on your map.','The Observatory map!'),2.6); },then:[m3pL('juniper',`Nobody should go in THERE without a map.`,`Nobody should go in there without a map.`)]}); continue; }
    if(!have) opts.push({t:S(`The map of ${nm} (40 coins)`,`${nm} map (40 coins)`),cond:()=>(G.coins||0)>=40,fn:()=>{ G.coins-=40; G.found[key]=true; setBanner(S('Juniper’s map','Juniper’s map'),S('Every room of that place shows on your map.','Every room shows on your map.'),2.6); },then:[m3pL('juniper',`Pleasure doing business! I copied it from the oldest charts I could find. Whatever lives in there now is your problem.`,`Thanks! What lives inside is your problem.`)]}); }
  if(!opts.length){ L.push(m3pL('juniper',pick([`You've got every map I've drawn. I'm sketching the dunes now. They keep moving. No wait, that's a worm.`,`All sold! I'm drawing the Glasswall. It's very hard to draw glass. It's mostly the stuff behind it.`]),`You have all my maps!`)); m3pSay(L); return true; }
  opts.push({t:S('Just looking','Just looking'),then:[m3pL('juniper',`The dungeons have their own map chests too. Probably guarded. Probably by something with teeth.`,`Dungeons have map chests too. Guarded.`)]});
  L.push(ch('juniper',S(`Maps! Fresh maps! Mostly dry!`,`Maps! Fresh maps!`),opts)); m3pSay(L); return true;
}

// ---------- 12. the ten side quests (ACT4 10). Rewards: the bible's XP and coins; `fn` names a payoff below.
// where a dungeon's door is: its cave mouth, or a door, or the bible's spot
function m3pAtCave(id,x,y){ if(CAVEMOUTHS.some(m=>m.area===id)) return 'cave:'+id; if(DOORS.some(d=>d.area===id)) return 'area:'+id; const L=LANDMARKS.find(o=>o.area===id); if(L) return `xy:${Math.round(L.x)},${Math.round(L.y)}`; return `xy:${x},${y}`; }
const M3P_FN={
  m_lampsAlly:()=>{ G.flags.m_lamps_ally=1; setBanner(S('The lamplighters will come!','The lamplighters will come!'),S('Esme’s lamplighters will fight beside you at the Observatory.','They will help you fight at the Observatory.'),3.2); },
  m_dolphin:()=>{ G.flags.m_dolphin=1; if(typeof P4!=='undefined'&&typeof p4AirMax==='function') P4.air=p4AirMax(); setBanner(S('Dolphin Kick!','Dolphin Kick!'),S('You hold your breath half as long again under water, and you swim like a merfolk.','You hold your breath longer under water!'),3.2); },
  m_ferryOn:()=>{ G.flags.m_ferry_on=1; setBanner(S('Rowan’s raft ferry','Rowan’s raft ferry'),S('The ferry runs between Driftwood, Palmcrest and Strand Landing. Ask at the ferry posts.','Take the ferry at the ferry posts.'),3.2); },
  m_tidebombsOn:()=>{ G.flags.m_tidebombs=1; if(typeof bombsMax==='function') G.flags.wpn_bombs=bombsMax(); setBanner(S('Tide Bombs!','Tide Bombs!'),S('Your Blast Bombs stick where they land and go off under water too.','Your bombs stick, and work under water!'),3.2); },
  m_wormtunnel:()=>{ G.flags.m_wormtunnel=1; setBanner(S('Worm Tunnel!','Worm Tunnel!'),S('You can burrow twice as long, and dig through packed sand.','You dig longer, and through hard sand!'),3.2); },
  m_vesperAlly:()=>{ G.flags.m_vesper_ally=1; setBanner(S('Vesper is coming with you','Vesper is coming!'),S('Your cousin will be right behind you in the Observatory.','Vesper will help you in the Observatory.'),3.2); },
  m_moonlantern:()=>{ G.flags.m_moonlantern=1; setBanner(S('Moon Lantern!','Moon Lantern!'),S('Your Moonfire keeps moon-glass solid twice as long.','Your moon-glass lasts twice as long!'),3.2); }
};
{ const base=giveReward; giveReward=function(r){ base(r); try{ if(!r) return;
  if(r.fn&&M3P_FN[r.fn]) M3P_FN[r.fn]();
  if(r.heart) m3pHeart(r.heart===true||r.heart===1?'m_moonfish':r.heart);
  if(typeof r.m3p==='function') r.m3p(); }catch(e){ console.error(e); } }; }
{ const base=qAvail; qAvail=function(id){
  if(id==='m_ferry'&&!G.flags.m_puff_done) return false;
  if(id==='m_lamps'&&!G.flags.m_eclipse2) return false;
  // (m_vesper: Vesper's own job when she was befriended in Act II, otherwise Jinx's lost letter, also with no choice saved)
  if(id==='m_vesper'&&m3pVesperOn()&&m3pR('m_reforge')) return false;
  // a returning friend standing in Moonfall does not offer an old quest from home (no '!' over Dell for a fishing rod)
  try{ if(!String(id).startsWith('m_')&&G&&G.mode==='story'&&m3pIV()){ const gv=QDEFS[id]&&QDEFS[id].giver; if(gv&&M3P_TALKERS[gv]&&m3pVisitC()[gv]) return false; } }catch(e){}
  return base(id); }; }
const M3P_Q={
  m_glaive:{title:S('A Piece of the Moon','A Piece of the Moon'),giver:'m_kiln',min:'m_sable',
    offer:[m3pL('m_kiln',`You're the dragon from the sea? Good. GOOD. I need a dragon.`,`You're the sea dragon? Good! I need a dragon.`),
      m3pL('m_kiln',`I have always wanted to make something out of the moon. The MOON! Bits of it fell here once, you know. That's why the sand is glass. But the big bits are long gone.`,`I want to make something out of the moon! Bits fell here once. That's why the sand is glass.`),
      m3pL('m_kiln',`If you ever find a fresh piece of moon, bring it to me. I'll make you something you'll never forget. Unless you hit your head. Don't hit your head.`,`Find a fresh piece of moon. Bring it to me. I'll make you something great!`)],
    steps:[
      {t:'item',item:'m_mooncrumb',n:1,text:S('Find a fresh piece of the moon','Find a fresh piece of the moon'),at:()=>m3pAtCave('m_burrows',10600,62900)},
      {t:'talk',npc:'m_kiln',take:{m_mooncrumb:1},text:S('Bring the moon crumb to Old Kiln','Bring the moon crumb to Old Kiln'),lines:[m3pL('m_kiln',`A crumb of the MOON! Still warm! Well. Cool. Moon-warm.`,`A crumb of the MOON! Moon-warm!`),
        m3pL('m_kiln',`It needs tempering. In moonfire. Real moonfire, not candlelight. Have you got moonfire? No? Then come back when you do. I'll keep it in my hat.`,`It needs moonfire. Real moonfire. Come back when you have it. I'll keep it in my hat.`)]},
      {t:'flag',flag:'m_glaive_temper',text:S('Breathe Moonfire into Old Kiln’s glass furnace','Breathe Moonfire into Kiln’s furnace'),at:'xy:10150,67350'},
      {t:'talk',npc:'m_kiln',text:S('See what Old Kiln made','See what Old Kiln made'),lines:[m3pN(`Old Kiln pulls, twists, blows, spins, and shouts at the furnace for a while. Then, very carefully, he holds up a long silver blade on a long pole.`,`Kiln pulls and twists and shouts. Then he holds up a long silver blade.`),
        m3pL('m_kiln',`The Moon Glaive! Swing it round and it leaves a little crescent of moonlight behind. The crescent lights moon-glass and burns shadows, like your moonfire, but further away.`,`The Moon Glaive! It leaves moonlight behind. It lights moon-glass and burns shadows!`),
        m3pL('m_kiln',`Throw it, and it comes back, like a very polite boomerang. It cuts moth silk. Nothing else cuts moth silk.`,`Throw it and it comes back. It cuts moth silk!`),
        m3pL('m_kiln',`Don't use it to cut bread. It'll cut the table too.`,`Don't cut bread with it. It cuts the table too.`)],reward:{weapon:'glaive',xp:500,coins:40}}]},
  m_leash:{title:S('The Silver Leash','The Silver Leash'),giver:'m_ripple',min:'m_coral',
    offer:[m3pL('m_ripple',`Dragon. A word, if you don't mind. This white moth with the silver thread. We merfolk have seen threads like that before.`,`Dragon. That white moth with the silver thread? We've seen threads like that before.`),
      m3pL('m_ripple',`On the night of the First Eclipse our grandmothers saw the moth's heralds flying on silver leashes, tugged this way and that like kites. The moon-priests knew how to free them. They wrote it down.`,`Long ago the moth's helpers flew on silver leashes. The moon-priests knew how to free them. They wrote it down.`),
      m3pL('m_ripple',`In the Drowned Library there is a vault sealed with moon-wax. Only moonfire melts it. The priests' books are inside, if the fish haven't read them. Sorry, fish. Not you.`,`A vault in the Drowned Library is sealed with moon-wax. Only moonfire melts it. The books are inside.`),
      m3pL('m_ripple',`Find their Book of Moths and take it to someone who reads old Lumen. I read it badly. Very badly. I once read "moth" as "mother" for a whole week.`,`Find the Book of Moths. Take it to someone who reads old Lumen. I read it badly.`)],
    steps:[
      {t:'flag',flag:'m_vault_open',text:S('Melt the moon-wax vault in the Drowned Library with Moonfire','Melt the vault in the Drowned Library with Moonfire'),at:()=>m3pAtCave('m_lumen',3700,62380)},
      {t:'talk',npc:'wren',take:{m_book_raw:1},give:{m_book:1},text:S('Ask Sister Wren to read the Book of Moths','Ask Sister Wren to read the Book of Moths'),lines:'m_leash_reveal',reward:{xp:500,coins:50,bless:1}}]},
  m_lamps:{title:S('Light Every Lamp','Light Every Lamp'),giver:'m_esme',min:'m_glasswall',
    offer:[m3pL('m_esme',`Every lamp in Sable went out when she drank the well. Twelve lamps. Bertha. Small Bertha. Old Pip. No relation. Gertrude, Gilbert, the Twins...`,`Every lamp went out when she drank the well. Twelve lamps! Bertha, Small Bertha, Old Pip...`),
      m3pL('m_esme',`Light them again, dragon, and I'll tell you a secret about moths. It's a good secret. It might save your tail.`,`Light them again. I'll tell you a secret about moths. It might save your tail.`)],
    steps:[
      {t:'flag',flag:'m_lamps12',text:S('Relight Sable’s twelve lamps','Light Sable’s twelve lamps'),at:()=>m3pNextLamp()},
      {t:'talk',npc:'m_esme',text:S('Tell Esme the lamps are lit','Tell Esme the lamps are lit'),lines:[m3pL('m_esme',`Twelve. All twelve. Bertha looks very happy. Small Bertha looks smug.`,`All twelve! Bertha is happy. Small Bertha is smug.`),
        m3pL('m_esme',`Here's my secret: a moth will forget its own name for a lamp. Even a very big moth. Even a sad one.`,`My secret: a moth forgets everything for a lamp. Even a big sad one.`),
        m3pL('m_esme',`And my lamplighters have very long poles. When you go up to that Observatory, we're coming too.`,`My lamplighters have long poles. We're coming to the Observatory too!`)],reward:{xp:450,fn:'m_lampsAlly'}}]},
  m_moonfish:{title:S('Gilly and the Moonfish','Gilly and the Moonfish'),giver:'m_gilly',min:'m_coral',ab:'dive',
    offer:[m3pL('m_gilly',`Dragon! Have you heard of the Moonfish? Most beautiful fish in the sea. It glows like the moon. It only comes up when the moon is full.`,`Have you heard of the Moonfish? It glows like the moon!`),
      m3pL('m_gilly',`Which isn't going to happen any time soon. But you can DIVE now! Find it down in the Drowned Reach and chase it up to my fishing raft. I just want to SEE it. Not cook it. ...Mostly not cook it.`,`You can dive! Find it in the Drowned Reach. Chase it up to my raft. I just want to SEE it.`),
      m3pL('m_gilly',`I'll row out to the trench north of town and wait. Look for a little raft and a lot of hope.`,`I'll row out north and wait on my raft.`)],
    steps:[
      {t:'flag',flag:'m_moonfish_up',text:S('Dive in the Drowned Reach and chase the Moonfish up to Gilly’s raft','Dive and chase the Moonfish up to Gilly’s raft'),at:()=>M3P.fish&&M3P.fish.on?`xy:${Math.round(M3P.fish.x)},${Math.round(M3P.fish.y)}`:'xy:2400,61300'},
      {t:'flag',flag:'m_moonfish_caught',npc:'m_gilly',mini:'m3p_fish',text:S('Help Gilly land the Moonfish (talk to Gilly)','Help Gilly land the Moonfish'),ready:[m3pL('m_gilly',`It's on the line! Help me reel! When it splashes, PULL!`,`It's on the line! When it splashes, PULL!`),m3pL('m_gilly',`Ready?`,`Ready?`)]},
      {t:'talk',npc:'m_gilly',text:S('Talk to Gilly','Talk to Gilly'),lines:[m3pL('m_gilly',`THE MOONFISH! Look at it! LOOK at it!`,`THE MOONFISH! Look at it!`),
        m3pL('m_gilly',`...It swallowed something. That's why it glows. A Heart Ember! Here, you have it. And I'm letting her go. Some fish are for looking at. Don't tell anyone I said that. I have a reputation.`,`It swallowed a Heart Ember! Have it. I'll let her go. Some fish are for looking at.`),
        m3pN(`Gilly lowers the Moonfish back into the sea. It swims down in a slow silver spiral, lighting up the water all the way down.`,`Gilly lets the Moonfish go. It swims down, glowing.`)],reward:{heart:'m_moonfish',xp:400}}]},
  m_race:{title:S('The Coral Race','The Coral Race'),giver:'m_rocket',min:'m_coral',ab:'dive',
    offer:[m3pL('m_rocket',`Race me! Around the reef and back! If you win, Nana Kelp will teach you the Dolphin Kick. If I win, you have to say "Rocket is the fastest" every time you see me. Forever.`,`Race me round the reef! Win, and Nana Kelp teaches you the Dolphin Kick. Lose, and you say "Rocket is the fastest". Forever.`)],
    steps:[
      {t:'flag',flag:'m_race_won',npc:'m_rocket',mini:'m_swimrace',text:S('Race Rocket around the reef (talk to Rocket to start)','Race Rocket round the reef. Talk to him to start.'),
        ready:[m3pL('m_rocket',`Ten rings! Round the reef, out through the mangroves and back! Rings count! Miss one and it doesn't count!`,`Ten rings! Miss one and it doesn't count!`),m3pL('m_rocket',`Ready? We start outside, at the ring!`,`Ready? We start outside!`)]},
      {t:'talk',npc:'m_kelp',text:S('Learn the Dolphin Kick from Nana Kelp','Learn the Dolphin Kick from Nana Kelp'),lines:[m3pL('m_rocket',`(from the Racing Reef) You beat me! Nobody beats me! Except Pickles. Pickles is a squid.`,`You beat me! Nobody beats me! Except Pickles.`),
        m3pL('m_kelp',`The Dolphin Kick, sprat. Kick with your tail, like this. No, your other tail. You only have one tail. That one.`,`The Dolphin Kick, sprat. Kick with your tail. Your only tail.`)],reward:{xp:350,fn:'m_dolphin'}}]},
  m_ferry:{title:S('The Raft Ferry','The Raft Ferry'),giver:'m_rowan',min:'m_reef',
    offer:[m3pL('m_rowan',`This is a "help me" knot. I don't tie it often.`,`This is my "help me" knot. I don't tie it often.`),
      m3pL('m_rowan',`The Crab Pirates cut every one of my ferry lines. With the lines up, my ferry runs from here to the Strand in one go, through the Sunken Gate. The Baron's out of the gate now. But his crab crew is still about. Two forts, on the reef isles.`,`Crab Pirates cut my ferry lines. Two crab forts are on the reef isles. Clear them, and fix my lines.`)],
    steps:[
      {t:'flags',flags:['m_fort1','m_fort2'],n:2,text:S('Clear the two Crab Pirate forts','Clear the two Crab Pirate forts'),at:()=>m3pFortNext()},
      {t:'flags',flags:['m_post1','m_post2','m_post3'],n:3,text:S('Drive in the ferry posts with a Ground Pound and grapple the line across','Pound the ferry posts down. Throw the line with your tail.'),at:()=>m3pPostNext()},
      {t:'talk',npc:'m_rowan',text:S('Tell Rowan the lines are up','Tell Rowan the lines are up'),lines:[m3pL('m_rowan',`This is a "thank you" knot. Biggest one I ever tied. Took me all morning.`,`This is my "thank you" knot. The biggest ever!`),
        m3pL('m_rowan',`The ferry's yours whenever you want it. Driftwood, Palmcrest, the Strand. Mind the chickens.`,`Use the ferry any time. Mind the chickens.`)],reward:{xp:350,coins:60,fn:'m_ferryOn'}}]},
  m_tidebombs:{title:S('Tide Bombs','Tide Bombs'),giver:'f_mags',min:'m_drift',give:{m_tideproto:3},
    offer:[m3pL('f_mags',`Ash! I need to know something very important. Do bombs work UNDERWATER? For science.`,`Ash! Do bombs work UNDERWATER? For science!`),
      m3pL('f_mags',`And also because three big rocks are blocking the Bubble Caves under Palmcrest, and the merfolk asked very politely. Here. Three prototype Tide Bombs. They stick to things. Then they go BOOM. Probably.`,`Three rocks block the Bubble Caves under Palmcrest. Here, three Tide Bombs. They stick. Then BOOM. Probably.`)],
    steps:[
      {t:'flags',flags:['m_rock1','m_rock2','m_rock3'],n:3,text:S('Blow up the three rocks blocking the Bubble Caves under Palmcrest','Blow up the three rocks under Palmcrest'),at:()=>m3pRockNext()},
      {t:'talk',npc:'f_mags',text:S('Tell Mags it worked','Tell Mags it worked'),lines:[m3pL('f_mags',`It WORKED? Underwater? Ha! HA! Science!`,`It WORKED? Under water? SCIENCE!`),
        m3pL('f_mags',`Give me your bombs. ...There. Tide Bombs. They work underwater now, and they stick to walls and to grumpy things. You're welcome. Don't stick one to me.`,`There. Tide Bombs! They work under water and stick. Don't stick one to me.`)],reward:{xp:350,fn:'m_tidebombsOn'}}]},
  m_noodle:{title:S('Noodle Wants His Mom','Noodle Wants His Mom'),giver:'m_dusty',min:'m_glasswall',ab:'burrow',
    offer:[m3pL('m_dusty',`Dusty: We found a baby worm!`,`We found a baby worm!`),
      m3pL('m_dusty',`(Dune) He follows us everywhere! He's eaten six shoes!`,`(Dune) He follows us! He ate six shoes!`),
      m3pL('m_dusty',`(Dusty) We named him Noodle! He keeps crying for his mom!`,`(Dusty) His name is Noodle! He cries for his mom!`),
      m3pL('m_dusty',`(Dune) We don't know where his mom is. Do YOU know where his mom is?`,`(Dune) Do YOU know where his mom is?`),
      m3pN(`A little sandworm, about as long as your tail, pokes his head out of the sand by your feet and goes "mip". Pip looks offended.`,`A baby sandworm pops up and goes "mip". Pip looks offended.`),
      m3pIf(()=>!!G.flags.pip,'pip',`Mip! MIP. (Pip glares at the worm. That is HIS word.)`,`MIP! (That's Pip's word!)`)],
    steps:[
      {t:'flag',flag:'m_noodle_home',text:S('Take Noodle home to his mom in the Sandworm Burrows (he only travels through sand)','Take Noodle home to the Sandworm Burrows. He only goes through sand.'),at:()=>m3pNoodleAt()},
      {t:'talk',npc:'m_sandy',text:S('Talk to Queen Sandy','Talk to Queen Sandy'),lines:[m3pL('m_sandy',`My baby! My Noodle! You brought him home through the sand. You're a good little worm.`,`My baby Noodle! You brought him home! Good little worm.`),
        m3pL('ash',`I'm a dragon.`,`I'm a dragon.`),m3pL('m_sandy',`You're a good little worm. Here. Let me show you how the big worms dig.`,`You're a good little worm. Let me show you how big worms dig.`)],reward:{xp:400,fn:'m_wormtunnel'}}]},
  m_lighthouse:{title:S('The Dark Lighthouse','The Dark Lighthouse'),giver:'m_squint',min:'m_drift',give:{m_sandwich:1},
    offer:[m3pL('m_squint',`My grandpa Ned keeps the lighthouse on Gull Isle. The moths came and the lamp went out and he won't come down. He says he's "thinking". He's been thinking for a month.`,`Grandpa Ned's lighthouse went dark. He won't come down. He's been "thinking" for a month.`),
      m3pL('m_squint',`Will you go up and see him? Take him this sandwich. It's fish. Everything here is fish.`,`Will you go see him? Take him this sandwich. It's fish.`)],
    steps:[
      {t:'talk',npc:'m_ned',take:{m_sandwich:1},text:S('Climb the Gull Isle lighthouse and talk to Old Ned','Climb the lighthouse on Gull Isle. Talk to Old Ned.'),lines:[m3pN(`You hand Old Ned the sandwich. He sniffs it. "Fish," he says. He eats it anyway.`,`You give Ned the sandwich. "Fish," he says. He eats it.`),
        m3pL('m_ned',`Moths. MOTHS. Every night, all over my lamp. They put it out with their silly fluffy bodies. Now it won't light. Not for fire. Not for anything.`,`Moths sat on my lamp till it went out. Now it won't light.`),
        m3pL('ash',`ANOTHER dark lighthouse? What is it with moths and lighthouses?`,`ANOTHER dark lighthouse? Why do moths do this?`),
        m3pL('m_ned',`Big lamp. Moths. It's not complicated. My cousin Agatha in Gearhaven had the same trouble. Hers spins, mind. Show-off.`,`Big lamp. Moths. Simple. My cousin's lamp spins. Show-off.`),
        m3pL('m_ned',`Mine's a moon lamp, you see. Lumen made it. It wants moonlight. And there's no moon left to speak of. And THEY'RE still on it. Light the little oil lamps round the gallery, and they'll go and sit on those instead. Moths have no loyalty.`,`It's a moon lamp. It wants moonlight. Light the little oil lamps first. The moths will move to them.`)]},
      {t:'flag',flag:'m_lighthouse_lit',text:S('Pull the moths off with the six oil lamps, then light the great lamp with Moonfire','Light the 6 small lamps. Then Moonfire on the great lamp.'),at:'xy:1000,61900'},
      {t:'talk',npc:'m_ned',text:S('Talk to Old Ned','Talk to Old Ned'),lines:[m3pN(`The great lamp blazes silver. Its beam sweeps across the whole Sunken Isles, over every wave and every wreck.`,`The great lamp blazes silver. Its beam sweeps the sea.`),
        m3pL('m_ned',`Moonlight in a lighthouse! Ha! Ships'll see that from the edge of the world.`,`Moonlight in a lighthouse! Ha! Ships will see it from far away!`),
        m3pL('m_ned',`Tell Squint I'm coming down for supper. Tell her to make it NOT fish.`,`Tell Squint I'm coming for supper. NOT fish.`)],reward:{xp:400,fn:'m_moonlantern'}}]}
};
// m_vesper has two versions, picked by the Act II choice: befriended, Vesper's own job; not, Jinx's lost-and-found letter
const M3P_VF={title:S('The Moth Mask’s Last Job','The Moth Mask’s Last Job'),giver:'c_vesper',
  offer:[m3pL('c_vesper',`Cousin. I've been watching the Heights. Moth knights on every door, a duke who eats lamps, a vault you'd need two keys to open. And her. The white one. She's up there.`,`Cousin. I've been watching the Heights. Moth knights, a lamp-eating duke, a locked vault. And the white moth.`),
    m3pL('c_vesper',`Luckily for you, I'm the best thief in Gearhaven. Unluckily for me, I can't get past the Glasswall. Worms go under walls. You go under walls. Want a partner?`,`I'm the best thief in Gearhaven. But I can't get past the Glasswall. You can go under it. Partners?`)],
  steps:[
    {t:'flag',flag:'m_vesper_gap',text:S('Widen the Burrow Gap so Vesper can crawl through (burrow under it three times)','Burrow under the Burrow Gap three times'),at:'xy:10900,67200'},
    {t:'flag',flag:'m_vesper_smoke',text:S('Plant Vesper’s three moth-smoke bombs at the Moth Knight posts by the Moonpath, unseen','Plant 3 smoke bombs by the Moth Knights. Don’t get seen!'),at:()=>m3pSentNext()},
    {t:'talk',npc:'c_vesper',text:S('Meet Vesper at the foot of the Moonpath','Meet Vesper at the foot of the Moonpath'),lines:[m3pL('c_vesper',`Perfect. When you go in, I'll be right behind you. Picking locks. Stealing hats. Annoying moths.`,`Perfect. I'll be right behind you. Picking locks. Annoying moths.`),
      m3pL('c_vesper',`Thieves don't usually have partners. I think I like it. Don't tell anyone.`,`Thieves don't have partners. I like it. Don't tell.`)],reward:{xp:450,fn:'m_vesperAlly'}}]};
const M3P_VL={title:S('Vesper’s Lost Letter','Vesper’s Lost Letter'),giver:'m_jinx',
  offer:[m3pL('m_jinx',`Lost and found! Today only! Ooh, here's one. A letter that a moth dropped in the dunes. It's addressed to "my duck". I don't know any ducks. Thirty coins.`,`Lost and found! A letter a moth dropped. It says "my duck". Thirty coins.`)],
  steps:[
    {t:'item',item:'m_vletter',n:1,text:S('Buy the moth-dropped letter from Jinx','Buy the letter from Jinx'),at:'npc:m_jinx'},
    {t:'flag',flag:'m_vletter_read',text:S('Read the letter by a lamp (the ink is moth-dusty)','Read the letter by a lamp'),at:()=>m3pNearestLamp(),reward:{xp:300}}]};
M3P_Q.m_vesper={min:'m_sable',get title(){ return m3pVesperOn()?M3P_VF.title:M3P_VL.title; },get giver(){ return m3pVesperOn()?'c_vesper':'m_jinx'; },
  get offer(){ return m3pVesperOn()?M3P_VF.offer:M3P_VL.offer; },get steps(){ return m3pVesperOn()?M3P_VF.steps:M3P_VL.steps; }};
// insertion order is the order the journal lists them in
for(const id of ['m_tidebombs','m_lighthouse','m_leash','m_moonfish','m_race','m_ferry','m_glaive','m_vesper','m_lamps','m_noodle']) if(!QDEFS[id]) QDEFS[id]=M3P_Q[id];
// Mags hands out plain Blast Bombs with her prototypes if Ash never got any (he skipped Act III's bombs)
{ const base=startQuest; startQuest=function(id){ base(id); try{ if(id==='m_tidebombs'&&!(G.weapons&&G.weapons.bombs)) giveWeapon('bombs'); }catch(e){} }; }
// step text with counters for these quests (the stock "clues" word does not fit posts and rocks)
{ const base=stepText; stepText=function(id){
  const st=stepOf(id); if(!st||!String(id).startsWith('m_')||!M3P_Q[id]) return base(id);
  if(id==='m_lamps'&&st.flag==='m_lamps12') return `${simplify(st.text)} (${m3pLampN()}/12)`;
  if(id==='m_vesper'&&st.flag==='m_vesper_gap') return `${simplify(st.text)} (${Math.min(3,G.flags.m_vgap_n|0)}/3)`;
  if(id==='m_vesper'&&st.flag==='m_vesper_smoke') return `${simplify(st.text)} (${m3pSmokeN()}/3)`;
  if(st.t==='flags') return `${simplify(st.text)} (${st.flags.filter(f=>G.flags[f]).length}/${st.n})`;
  return base(id); }; }
// story lines that the quests use (getters where they depend on choices)
Object.assign(STORY,{
  m_vault:[m3pN(`The moon-wax runs like candle wax in the silver fire. The vault door swings open. Inside, in a shell case, lies a very soggy book with a moth on the cover.`,`The wax melts. The vault opens. Inside is a soggy book with a moth on it.`),
    m3pL('iska',`Moonfire, underwater, on a vault Ember's friends sealed. They knew you'd come. Or they hoped.`,`Moonfire on a vault Ember's friends sealed. They hoped you'd come.`)],
  m_vletter:[m3pN(`In the lamplight the moth dust falls off the page. Inside, in shaky old writing:`,`In the lamplight, the dust falls off. Inside:`),
    m3pN(`"Oh, duck. Wherever you are, come home when you're ready. We are Emberbloods without fire, but fire isn't the only warm thing. Be kind. That's warm too. Love, your Granny Oona."`,`"Oh, duck. Come home when you're ready. Fire isn't the only warm thing. Be kind. Love, Granny Oona."`),
    m3pL('iska',`A moth carried this off before Vesper ever saw it. Keep it, Ash. One day she might need it more than anything.`,`A moth took this before Vesper saw it. Keep it. One day she might need it.`)]
});
Object.defineProperty(STORY,'m_leash_reveal',{configurable:true,get(){ return [
  m3pL('wren',`Old Lumen script! Oh, my eyes. Oh, my heart. Give me a minute. And a dry cloth.`,`Old Lumen writing! Oh my! Give me a minute. And a dry cloth.`),
  m3pL('wren',`"The Book of Moths, by the moon-priests of Lumen." Listen: "The Mother ties her heralds with moon-silk. The leash keeps a moth big, and cold, and always pulled home."`,`"The Mother ties her moths with moon-silk. The leash keeps a moth big and cold."`),
  m3pL('wren',`"Moon-silk will not cut. Not by claw, not by fire. But moonfire, breathed gently, melts the knot and does the moth no harm. A moth cut free goes back to her own size, and her own warmth."`,`"Claws and fire can't cut it. But gentle moonfire melts the knot. A free moth gets warm again."`),
  m3pL('ash',`So I can free Hush. Gently.`,`So I can free Hush. Gently.`),
  m3pL('wren',`Gently. Like blowing on soup. Oh! Wait. Something's tucked in the back. A page. Not Lumen writing. Ours.`,`Gently. Like blowing on soup. Oh! A page is tucked in the back. In our writing!`),
  m3pDo(()=>{ G.flags.m_leash_known=1; }),
  m3pIf(()=>!G.flags.f_page11,'wren',`It's my lost page. The ELEVENTH page of the Wardens' book! Ember must have left a copy with her friends here. It's been under the sea for five hundred years!`,`It's the lost ELEVENTH page! It was under the sea for five hundred years!`),
  m3pIf(()=>!!G.flags.f_page11,'wren',`It's a copy of the eleventh page! Eider found the other one in Hearthold. Two page elevens. I'm going to frame one and sleep with the other.`,`Another eleventh page! Eider found one too. I'll frame one and hug the other.`),
  m3pN(`"On the first Lantern Day, a little gray moth sat on Ember's lantern all night. Ember named her Nyx. We thought nothing of it." (Iska)`,`"A little gray moth sat on Ember's lantern all night. Ember named her Nyx." (Iska)`),
  m3pL('iska',`I wrote that. I really did think nothing of it. I was wrong.`,`I wrote that. I thought nothing of it. I was wrong.`),
  m3pDo(()=>{ G.flags.m_page11=1; G.choices.extra=G.choices.extra||{}; G.choices.extra.m_leash=S(`Wren read the Book of Moths: gentle moonfire can melt a silver leash. And the eleventh page named a little moth Nyx.`,`Gentle moonfire can melt a leash. A little moth was called Nyx.`); })]; }});

// ---------- 13. the places the side quests need (built after the map module's own build)
// Sable's twelve lamps (m_lamps). Lit before the second eclipse; out after it until relit; lit for good once done.
const M3P_LAMPS=[
  {i:0,name:'Bertha',x:9500,y:67400,kind:'post'},{i:1,name:'Small Bertha',x:9620,y:67900,kind:'post',small:true},
  {i:2,name:'Old Pip',x:10050,y:67450,kind:'post'},{i:3,name:'Gertrude',x:9350,y:67700,kind:'post'},{i:4,name:'Gilbert',x:10200,y:67750,kind:'post'},
  {i:5,name:'Dot',x:9680,y:67230,kind:'tall'},{i:6,name:'Dash',x:9920,y:67230,kind:'tall'},
  {i:7,name:'Muffin',x:9300,y:67950,kind:'buried'},{i:8,name:'Barnaby',x:10350,y:67950,kind:'buried'},
  {i:9,name:'Lady Wellington',x:9850,y:67640,kind:'islet'},{i:10,name:'Coco',x:10380,y:67450,kind:'palm'},{i:11,name:'Little Sun',x:9700,y:67380,kind:'tent'}];
const m3pLampLit=i=>!G.flags.m_eclipse2||!!G.flags['m_lamp_'+i]||m3pQ('m_lamps');
const m3pLampN=()=>{ let n=0; for(const L of M3P_LAMPS) if(G.flags['m_lamp_'+L.i]) n++; return n; };
function m3pLightLamp(L,how){
  if(G.flags['m_lamp_'+L.i]||!G.flags.m_eclipse2) return;
  G.flags['m_lamp_'+L.i]=1; const n=m3pLampN(); G.flags.m_lamp_n=n;
  SFX.play('shrine'); emit(L.x,L.y-(L.kind==='tall'?78:44),18,{col:'255,220,140',smin:30,smax:120,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
  if(L.kind==='tent'&&AREA) later(0.3,()=>{ if(scene==='play') m3pSay([m3pL('m_rafi',`Oh! I thought it was a very small sun.`,`Oh! I thought it was a tiny sun.`)]); });
  setBanner(S(`${L.name} is lit!`,`${L.name} is lit!`),m3pOn('m_lamps')?S(`Sable’s lamps: ${n} of 12`,`Lamps: ${n} of 12`):'',2.2);
  if(n>=12) G.flags.m_lamps12=1;
  questPoke(); saveGame();
}
function m3pNextLamp(){ let best=null, bd=1e18; for(const L of M3P_LAMPS){ if(G.flags['m_lamp_'+L.i]) continue; if(L.kind==='tent'){ const d=m3pDoorAt('m_rafi'); const p=d||L; const dd=dist2(p.x,p.y,player.x,player.y); if(dd<bd){ bd=dd; best=d?'area:'+(CASTBY.m_rafi&&CASTBY.m_rafi.inside||'h_m_rafi'):`xy:${L.x},${L.y}`; } continue; }
  const dd=dist2(L.x,L.y,player.x,player.y); if(dd<bd){ bd=dd; best=`xy:${L.x},${L.y}`; } } return best; }
function m3pNearestLamp(){ let best=null, bd=1e18; const add=(x,y)=>{ const d=dist2(x,y,player.x,player.y); if(d<bd){ bd=d; best=`xy:${Math.round(x)},${Math.round(y)}`; } };
  for(const L of M3P_LAMPS) if(L.kind!=='tent'&&m3pLampLit(L.i)&&L.kind!=='buried') add(L.x,L.y);
  const d=m3pDoorAt('m_esme'); if(d) add(d.x+40,d.y+10); else add(9990,67960); return best; }
// the ferry posts (m_ferry): pound each one down, then fling the line on to the next post (the last line runs to the Gate)
const M3P_POSTS=[{i:1,x:3600,y:64900},{i:2,x:4600,y:65300},{i:3,x:5500,y:65500}], M3P_FERRYPOST=[2900,64750], M3P_GATE=[6250,65600];
function m3pPostNext(){ for(const P of M3P_POSTS) if(!G.flags['m_post'+P.i]) return `xy:${P.x},${P.y}`; return `xy:${M3P_GATE[0]},${M3P_GATE[1]}`; }
// the two Crab Pirate forts are the map module's camps m_c1 and m_c2 (ACT4 3.7); found by id, or by place if it named them otherwise
const M3P_FORTS=[['m_fort1','m_c1',5600,61800],['m_fort2','m_c2',5400,68200]];
function m3pFortCamp(c,x,y){ let C=CAMPS.find(q=>q.id===c); if(C) return C; let bd=520*520; for(const q of CAMPS){ const d=dist2(q.x,q.y,x,y); if(d<bd){ bd=d; C=q; } } return C||null; }
function m3pFortNext(){ let best=null, bd=1e18; for(const [f,c,x,y] of M3P_FORTS){ if(G.flags[f]) continue; const C=m3pFortCamp(c,x,y), X=C?C.x:x, Y=C?C.y:y, d=dist2(X,Y,player.x,player.y); if(d<bd){ bd=d; best=`xy:${Math.round(X)},${Math.round(Y)}`; } } return best; }
// the three cracked rocks over the Bubble Caves (m_tidebombs)
const M3P_ROCKS=[{i:1,x:3150,y:67200},{i:2,x:3350,y:67250},{i:3,x:3550,y:67100}], M3P_BUBBLEDOOR=[3350,67160];
function m3pRockNext(){ for(const R of M3P_ROCKS) if(!G.flags['m_rock'+R.i]) return `xy:${R.x},${R.y}`; return null; }
const m3pRocksDone=()=>M3P_ROCKS.every(R=>G.flags['m_rock'+R.i]);
// Old Ned's lighthouse (m_lighthouse): six little oil lamps round the gallery, and the great moon lamp
const M3P_LH={x:1000,y:61900,lamp:[1000,61878]}, M3P_OIL=[0,1,2,3,4,5].map(k=>{ const a=-Math.PI/2+k*TAU/6; return {i:k,x:1000+Math.cos(a)*34,y:61900+Math.sin(a)*38}; });
const m3pOilN=()=>M3P_OIL.filter(o=>G.flags['m_oil'+o.i]).length;
// Old Kiln's glass furnace (m_glaive)
const M3P_FURN=[10150,67350];
// Vesper's moth-smoke job (m_vesper, befriended): three Moth Knight posts by the Moonpath, each with a lamp post
const M3P_SENT=[{i:1,x:12150,y:65330,lamp:[12300,65250]},{i:2,x:12420,y:65470,lamp:[12560,65400]},{i:3,x:12720,y:65330,lamp:[12860,65410]}];
const m3pSmokeN=()=>M3P_SENT.filter(s=>G.flags['m_smoke'+s.i]).length;
function m3pSentNext(){ for(const s of M3P_SENT) if(!G.flags['m_smoke'+s.i]) return `xy:${s.x},${s.y}`; return `xy:${M3P_VIS.foot[0]},${M3P_VIS.foot[1]}`; }
// three sunken chests the lighthouse beam shows at night (the Moon Lantern's last gift)
const M3P_SUNK=[{id:'m3p_sunk1',x:1600,y:61000,coins:120},{id:'m3p_sunk2',x:4300,y:62600,coins:140},{id:'m3p_sunk3',x:1300,y:66400,coins:160}];
function m3pLM(o){ if(LANDMARKS.some(q=>q.id===o.id)) return null; o.noNudge=true; const r=addLandmark(o); if(r&&('prompt' in o)&&curMapOf(o)===3) m3pOver(r); return r; }
const curMapOf=o=>typeof mapAt==='function'?mapAt(o.y):0;
function m3pBuild(B){
  // Sable's lamps (the tent lamp is inside Rafi's tent when he has one), with their night light. On the real map a lamp
  // that would stand inside a tent or in the pool steps onto free ground; the two buried ones always lie in sand.
  for(const L of M3P_LAMPS){ if(L.kind==='tent'||L.kind==='islet') continue; const q=m3pDry(L.x,L.y); if(q){ L.x=Math.round(q.x); L.y=Math.round(q.y); } }
  if(typeof p4Add==='function') for(const L of M3P_LAMPS) if(L.kind==='buried') p4Add('sandbed',{id:'m3p_sand_lamp'+L.i,x0:L.x-110,y0:L.y-90,x1:L.x+110,y1:L.y+90});
  for(const s2 of M3P_SENT){ const q=m3pDry(s2.x,s2.y); if(q){ s2.x=Math.round(q.x); s2.y=Math.round(q.y); } const r=m3pDry(s2.lamp[0],s2.lamp[1]); if(r) s2.lamp=[Math.round(r.x),Math.round(r.y)]; }
  for(const L of M3P_LAMPS){ if(L.kind==='tent') continue;
    L.light={x:L.x,y:L.y-(L.kind==='tall'?78:44),r:L.kind==='tall'?220:170,i:0,fire:true}; LIGHTS.push(L.light);
    m3pLM({id:'m3p_lamp'+L.i,k:'m3p_lamp',L,x:L.x,y:L.y,r:L.kind==='palm'?26:14,draw:()=>{},
      get prompt(){ return m3pLampPrompt(L); },hidden:()=>!m3pLampPrompt(L),act:()=>m3pLampAct(L)}); }
  // the ferry posts and Rowan's raft at the Driftwood ferry post
  for(const P of M3P_POSTS) m3pLM({id:'m3p_post'+P.i,k:'m3p_post',P,x:P.x,y:P.y,r:10,draw:()=>{},get prompt(){ return m3pPostPrompt(P); },hidden:()=>!m3pPostPrompt(P),act:()=>m3pPostAct(P)});
  m3pLM({id:'m3p_ferry',k:'m3p_ferry',x:M3P_FERRYPOST[0],y:M3P_FERRYPOST[1],draw:o=>m3pDrawFerry(o),get prompt(){ return m3pFerryPrompt(); },hidden:()=>!m3pFerryPrompt(),act:()=>m3pFerryMenu('dw')});
  if(!(typeof CROSSINGS!=='undefined'&&CROSSINGS.m_ferry_st)){
    m3pLM({id:'m3p_ferry_st',k:'m3p_ferry',x:6950,y:65750,draw:()=>{},get prompt(){ return m3pFerryPrompt(); },hidden:()=>!m3pFerryPrompt(),act:()=>m3pFerryMenu('st')});
    m3pLM({id:'m3p_ferry_pc',k:'m3p_ferry',x:3300,y:66150,draw:()=>{},get prompt(){ return m3pFerryPrompt(); },hidden:()=>!m3pFerryPrompt(),act:()=>m3pFerryMenu('pc')}); }
  // the cracked rocks (drawn bright from under the water) and the Bubble Caves' door behind them
  if(typeof p4Add==='function'&&P4K.m3p_rock) for(const R of M3P_ROCKS) p4Add('m3p_rock',{id:'m3p_rock'+R.i,x:R.x,y:R.y,R});
  if(M3P.ownBubble) m3pLM({id:'m3p_bubbledoor',k:'m3p_bubbledoor',area:'m_bubblecaves',x:M3P_BUBBLEDOOR[0],y:M3P_BUBBLEDOOR[1],r:20,draw:()=>{},
    get prompt(){ return m3pRocksDone()?S('Swim into the Bubble Caves','Swim into the Bubble Caves'):null; },hidden:()=>!m3pRocksDone(),
    act:()=>enterArea('m_bubblecaves',{x:M3P_BUBBLEDOOR[0],y:M3P_BUBBLEDOOR[1],outY:0})});
  // Old Ned's lighthouse: the oil lamps and the great lamp (x3_world draws the tower)
  m3pLM({id:'m3p_lh',k:'m3p_lh',x:M3P_LH.lamp[0],y:M3P_LH.lamp[1]+2,r:8,draw:()=>{},get prompt(){ return m3pGreatPrompt(); },hidden:()=>!m3pGreatPrompt(),act:()=>m3pGreatAct()});
  M3P_LH.light={x:M3P_LH.lamp[0],y:M3P_LH.lamp[1]-30,r:420,i:0}; LIGHTS.push(M3P_LH.light);
  // Old Kiln's furnace
  m3pLM({id:'m3p_furnace',k:'m3p_furnace',x:M3P_FURN[0],y:M3P_FURN[1],r:M3P_STAND?24:0,draw:()=>{},get prompt(){ return m3pFurnPrompt(); },hidden:()=>!m3pFurnPrompt(),act:()=>m3pFurnAct()});
  M3P.furnLight={x:M3P_FURN[0],y:M3P_FURN[1]-20,r:200,i:0.6,fire:true}; LIGHTS.push(M3P.furnLight);
  // the Moth Knight posts and their lamps (Vesper's job)
  for(const s of M3P_SENT){ s.light={x:s.lamp[0],y:s.lamp[1]-44,r:170,i:0,fire:true}; LIGHTS.push(s.light);
    m3pLM({id:'m3p_sent'+s.i,k:'m3p_sent',s,x:s.x,y:s.y+6,r:6,draw:()=>{},get prompt(){ return m3pSentPrompt(s); },hidden:()=>!m3pSentPrompt(s),act:()=>m3pSentAct(s)}); }
  // Gilly's fishing raft and the Moonfish (a swimmer only a diver sees well), with bubble vents along the trench
  m3pLM({id:'m3p_raft',k:'m3p_raft',x:M3P_RAFT[0],y:M3P_RAFT[1]+8,draw:o=>m3pDrawRaft(o)});
  if(typeof p4Add==='function'){
    for(const [x,y] of [[1700,60800],[2500,60700],[3250,60900]]) p4Add('bubbles',{id:'m3p_bub_'+x,x,y,r:34});
    if(P4K.m3p_fish) M3P.fishO=p4Add('m3p_fish',{id:'m3p_moonfish',x:2400,y:60700});
    for(const c of M3P_SUNK) p4Add('uchest',{id:c.id,x:c.x,y:c.y,coins:c.coins});
  }
  // bubble vents along the Coral Race course (air for a racer who stays under)
  if(typeof p4Add==='function') for(const [x,y] of [[1560,68250],[1500,69250],[2600,69900]]) p4Add('bubbles',{id:'m3p_rbub_'+x,x,y,r:30});
  // the Coral Race's two sunken masts (grapple posts make a shortcut)
  if(typeof ELEV!=='undefined'&&ELEV.grapple) for(const [x,y] of [[1480,68420],[1760,68620]]){ ELEV.grapple({x,y,lvl:0}); m3pLM({id:'m3p_mast_'+x,k:'m3p_mast',x,y,draw:o=>m3pDrawMast(o)}); }
  // the palm with Coco on top, and the market's warm wind ribbon past the Twins (Wind Riding)
  if(typeof WIND!=='undefined'&&WIND.stream&&!(WIND.list&&WIND.list().some(w=>w.id==='m3p_rib_market'))) try{ WIND.stream({id:'m3p_rib_market',pts:[[9450,67290],[9800,67200],[10150,67290]],lv:[0,1],w:56,on:()=>!!G.flags.m_eclipse2&&!m3pQ('m_lamps')}); }catch(e){}
  // Dell's sign on the Driftwood dock while he is away fetching Mom
  m3pLM({id:'m3p_dellsign',k:'m3p_sign',x:M3P_VIS.sign[0],y:M3P_VIS.sign[1],draw:o=>m3pDrawSign(o,m3pDellAway()&&!!G.flags.m_landed),
    get prompt(){ return m3pDellAway()&&G.flags.m_landed?S('Read the sign','Read the sign'):null; },hidden:()=>!(m3pDellAway()&&G.flags.m_landed),
    act:()=>m3pSay([m3pN(`"Back VERY soon. Gone to get Ash's mom. Dell."`,`"Back soon. Gone to get Ash's mom. Dell."`),m3pN(`Underneath, in smaller letters: "P.S. Mags, don't touch the sandwiches."`,`"P.S. Mags, don't touch the sandwiches."`)])});
  // the Coralcombe dive door, if no map module made one
  if(M3P.ownCoral&&typeof p4Add==='function'&&!LANDMARKS.some(o=>o.area==='m_coralcombe')&&!DOORS.some(d=>d.area==='m_coralcombe'))
    p4Add('pool',{id:'m3p_coralpool',x:1900,y:67600,r:60,kind:'water',area:'m_coralcombe',label:S('Dive down to Coralcombe','Dive down to Coralcombe'),arrive:S('Coralcombe','Coralcombe'),outY:0});
}
{ const M=MAPS[3]; if(M){ const b0=M.build; M.build=function(B){ if(b0) b0.call(this,B); try{ m3pBuild(B); }catch(e){ console.error('x3_people build',e); } }; } }
// Brindlecross: "Gone fishing. VERY far. Dell." while Dell is in Moonfall
{ const M=MAPS[0]; if(M){ const b0=M.build; M.build=function(B){ if(b0) b0.call(this,B); try{ m3pLM({id:'m3p_dellsign0',k:'m3p_sign',x:6560,y:7380,draw:o=>m3pDrawSign(o,m3pIV()&&!!G.flags.m_landed),
  get prompt(){ return m3pIV()&&G.flags.m_landed?S('Read the sign','Read the sign'):null; },hidden:()=>!(m3pIV()&&G.flags.m_landed),
  act:()=>m3pSay([m3pN(`"Gone fishing. VERY far. Dell."`,`"Gone fishing. VERY far. Dell."`)])}); }catch(e){ console.error(e); } }; } }

// ---------- 14. quest mechanics
// Sable's lamps: prompts, fire on them, burrowing up the buried ones, climbing the palm
function m3pLampPrompt(L){
  if(m3pOn('m_vesper')&&!m3pVesperOn()&&G.items.m_vletter&&!G.flags.m_vletter_read&&m3pLampLit(L.i)&&L.kind!=='buried') return S('Read the letter by the lamp','Read the letter by the lamp');
  if(!G.flags.m_eclipse2||G.flags['m_lamp_'+L.i]) return null;
  if(L.kind==='palm') return S(`Look up at the tallest palm (${L.name} is at the top)`,`Look up the palm`);
  if(L.kind==='buried') return null;
  return S(`Look at ${L.name}`,`Look at ${L.name}`);
}
function m3pLampAct(L){
  if(m3pOn('m_vesper')&&!m3pVesperOn()&&G.items.m_vletter&&!G.flags.m_vletter_read&&m3pLampLit(L.i)){ m3pReadLetter(); return; }
  if(L.kind==='palm'){
    if(!hasAbil('claws')){ m3pSay([m3pN(`${L.name} the lamp sits at the very top of the tallest palm. The trunk is far too smooth to climb with bare claws.`,`The lamp is at the top of the palm. Too smooth to climb.`)]); return; }
    m3pSay([m3pN(`You dig in your Climbing Claws and go up the palm, scale by scale. A coconut glares at you. At the top, ${L.name} the lamp is cold.`,`You climb the palm with your claws. A coconut glares at you.`),m3pN(`You breathe a little flame into her. She glows.`,`You breathe a little flame. The lamp glows!`)],()=>m3pLightLamp(L,'palm')); return; }
  const hint=L.kind==='tall'?S(`${L.name} hangs on a very tall pole. Your flame won't reach. A long, hot flame might. Or fly up to it.`,`It's too high. Try a long hot flame. Or fly up.`)
    :L.kind==='islet'?S(`${L.name} stands by the Moon Well. Breathe on her to light her.`,`Breathe on the lamp to light it.`):S(`${L.name} the lamp is cold. Breathe on her to light her.`,`The lamp is cold. Breathe on it.`);
  m3pSay([m3pN(hint,hint)]);
}
function m3pLampFire(mx,my,ang,dt,blue,moon){
  if(!G.flags.m_eclipse2||AREA&&AREA.id!==(CASTBY.m_rafi&&CASTBY.m_rafi.inside)) return;
  for(const L of M3P_LAMPS){
    if(G.flags['m_lamp_'+L.i]||L.kind==='buried'||L.kind==='palm') continue;
    if(L.kind==='tent'){ if(!AREA) continue; const o=AREA.objs.find(q=>q.k==='m3p_tentlamp'); if(!o||!inArcC(mx,my,ang,175,0.45,{x:o.x,y:o.y,r:24})) continue; m3pLightLamp(L,'tent'); continue; }
    if(AREA) continue;
    if(!inArcC(mx,my,ang,175,0.45,{x:L.x,y:L.y,r:24})&&!(blue&&typeof p3JetHits==='function'&&p3JetHits(L.x,L.y,26))) continue;
    if(L.kind==='tall'&&!blue&&!player.flying){ if(!M3P.tallT||G.time-M3P.tallT>3){ M3P.tallT=G.time; ftext(L.x,L.y-96,S('Too high! A longer, hotter flame, or fly up.','Too high! Hotter flame, or fly!'),'#ffe0b0',12); } continue; }
    const k='lamp'+L.i; M3P.lampHeat[k]=(M3P.lampHeat[k]||0)+dt; if(M3P.lampHeat[k]>0.35) m3pLightLamp(L,'fire');
  }
}
function m3pBuriedTick(){
  if(!G.flags.m_eclipse2||AREA||!m3pBurrowed()) return;
  for(const L of M3P_LAMPS){ if(L.kind!=='buried'||G.flags['m_lamp_'+L.i]) continue; if(dist2(player.x,player.y,L.x,L.y)<46*46){ setBanner(S(`You dug up ${L.name}!`,`You dug up ${L.name}!`),S('She pops up out of the sand and lights at once.','She pops up and lights!'),2.4); m3pLightLamp(L,'dig'); } }
}
// the ferry posts: a Ground Pound drives a post in; then the Grapple Tail flings the line on to the next one
function m3pPostPrompt(P){
  if(!m3pAt('m_ferry',1)||G.flags['m_post'+P.i]) return null;
  if(!G.flags['m_postd'+P.i]) return S('Look at the crooked ferry post','Look at the crooked post');
  const prev=P.i===1||G.flags['m_post'+(P.i-1)]; if(!prev) return S('Look at the ferry post','Look at the post');
  return S('Fling the ferry line across with your tail','Throw the ferry line with your tail');
}
function m3pPostAct(P){
  if(!G.flags['m_postd'+P.i]){ m3pSay([m3pN(`A ferry post, leaning like it's had a long day. It needs to be driven straight down into the sand. Something heavy, from above.`,`A crooked post. It needs a big slam from above.`)]); return; }
  const prev=P.i===1||G.flags['m_post'+(P.i-1)];
  if(!prev){ m3pSay([m3pN(`The line has to come from the post before this one. Rowan's lines go in order: post one, post two, post three, then the Gate.`,`Do the posts in order. One, two, three, then the Gate.`)]); return; }
  if(!hasAbil('grapple')){ m3pSay([m3pN(`The line is far too heavy to throw by hand. If only your tail could grab it.`,`Too heavy to throw. If only your tail could grab it.`)]); return; }
  G.flags['m_post'+P.i]=1; M3P.lineT={i:P.i,t:G.time};
  SFX.play('whoosh'); emit(P.x,P.y-30,10,{col:'230,210,160',glow:false,smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
  setBanner(S('The ferry line flies across!','The line flies across!'),P.i<3?S(`Post ${P.i} of 3 done.`,`Post ${P.i} of 3.`):S('The last line reaches the Sunken Gate!','The last line reaches the Gate!'),2.4);
  questPoke(); saveGame();
}
function m3pPound(info){
  if(!m3pAt('m_ferry',1)||AREA) return;
  for(const P of M3P_POSTS){ if(G.flags['m_postd'+P.i]) continue; if(dist(info.x,info.y,P.x,P.y)<(info.R||90)+30){ G.flags['m_postd'+P.i]=1; shake(4); SFX.play('boom',0.5);
    emit(P.x,P.y,16,{col:'210,190,140',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); setBanner(S('THUNK! The post goes in straight.','THUNK! The post is straight.'),S('Now fling the line across with your tail.','Now throw the line with your tail.'),2.4); saveGame(); } }
}
if(typeof p3OnPound==='function') p3OnPound(info=>{ try{ m3pPound(info); }catch(e){ console.error(e); } });
// Rowan's raft ferry (the payoff): Driftwood, Palmcrest, Strand Landing, when the map module has no ferry crossings
const M3P_FERRY={dw:{x:2900,y:64800,n:S('Driftwood Landing','Driftwood Landing')},pc:{x:3300,y:66200,n:S('Palmcrest Isle','Palmcrest Isle')},st:{x:6950,y:65800,n:S('Strand Landing','Strand Landing')}};
function m3pFerryPrompt(){ if(!m3pQ('m_ferry')) return null; if(typeof CROSSINGS!=='undefined'&&CROSSINGS.m_ferry_dw) return null; return S('Take Rowan’s raft ferry','Take Rowan’s raft ferry'); }
function m3pFerryMenu(from){
  const opts=[]; for(const k of ['dw','pc','st']) if(k!==from){ const P=M3P_FERRY[k]; opts.push({t:S(`Ferry to ${P.n}`,`Go to ${P.n}`),fn:()=>later(0.2,()=>{ if(typeof mapTravel==='function') mapTravel(P.x,P.y,{banner:P.n}); else { player.x=P.x; player.y=P.y; } })}); }
  opts.push({t:S('Not now','Not now'),then:[m3pN(`The ferry raft bobs on its line, waiting.`,`The raft bobs. It waits.`)]});
  m3pSay([ch('narr',S('Rowan’s raft ferry. Where to? (Mind the chickens.)','Where to? Mind the chickens!'),opts)]);
}
// Tide Bombs: while Mags's prototypes are in the bag, and for good after the quest, a bomb in water sticks and goes off
const m3pTideOn=()=>!!G.flags.m_tidebombs||m3pAt('m_tidebombs',0);
{ const base=armsFizzle; armsFizzle=function(b,hz){
  if(hz==='water'&&G&&G.mode==='story'&&m3pTideOn()&&!AREA){ b.dead=false; b.st='rest'; b.vx=b.vy=0; b.vz=0; b.z=0; b.m3pTide=true; if(G.ripples) G.ripples.push({x:b.x,y:b.y,t:0,max:0.6,r:12,splash:true});
    ftext(b.x,b.y-20,S('Stuck!','Stuck!'),'#cfe6ff',11); return; }
  return base(b,hz); }; }
{ const base=armsBlast; armsBlast=function(x,y,o){ const r=base(x,y,o); try{ m3pBlast(x,y); }catch(e){ console.error(e); } return r; }; }
function m3pBlast(x,y){
  if(AREA||!G||G.mode!=='story'||m3pQ('m_tidebombs')) return;
  for(const R of M3P_ROCKS){ if(G.flags['m_rock'+R.i]||dist(x,y,R.x,R.y)>110) continue;
    G.flags['m_rock'+R.i]=1; shake(5); emit(R.x,R.y,24,{col:'200,220,240',glow:false,smin:40,smax:180,lmin:.3,lmax:.8,zmin:1.5,zmax:3.5});
    const n=M3P_ROCKS.filter(q=>G.flags['m_rock'+q.i]).length; if(n>=3) G.flags.m_bubble_open=1;
    setBanner(S('KA-BLOOP! The rock cracks apart.','KA-BLOOP! The rock breaks!'),n<3?S(`${n} of 3 rocks gone.`,`${n} of 3 rocks.`):S('The way into the Bubble Caves is open!','The Bubble Caves are open!'),2.6);
    questPoke(); saveGame(); }
}
// Old Ned's lighthouse: fire on the oil lamps pulls the moths off; then Moonfire on the great lamp
function m3pGreatPrompt(){ if(!m3pOn('m_lighthouse')||G.flags.m_lighthouse_lit||!m3pHigh(M3P_LH.x,M3P_LH.y,'claws')) return null; return S('Look at the great moon lamp','Look at the great lamp'); }
function m3pGreatAct(){
  const L=[]; if(m3pOilN()<6) L.push(m3pN(`The great lamp is covered in sleepy moths. They're smothering it. Six little oil lamps stand cold round the gallery.`,`Moths cover the great lamp. Six little oil lamps are cold.`));
  else L.push(m3pN(`The moths have all gone to the little oil lamps. The great lamp is clear: a lens of moon-glass, waiting for moonlight.`,`The great lamp is clear. It waits for moonlight.`));
  if(!hasAbil('moonfire')) L.push(m3pL('m_ned',`It wants moonlight, I tell you. Not fire. Come back when you can breathe the moon.`,`It wants moonlight, not fire. Come back later.`));
  m3pSay(L);
}
function m3pLhFire(mx,my,ang,dt){
  if(AREA||!m3pOn('m_lighthouse')||G.flags.m_lighthouse_lit) return;
  if(dist2(player.x,player.y,M3P_LH.x,M3P_LH.y)>260*260||!m3pHigh(M3P_LH.x,M3P_LH.y,'claws')) return;
  for(const o of M3P_OIL){ if(G.flags['m_oil'+o.i]) continue; if(inArcC(mx,my,ang,175,0.45,{x:o.x,y:o.y,r:10})){ G.flags['m_oil'+o.i]=1; SFX.play('pickup'); emit(o.x,o.y-8,8,{col:'255,210,120',smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4});
    const n=m3pOilN(); ftext(o.x,o.y-30,n<6?S(`A moth flutters over to it. ${n} of 6`,`A moth flies to it. ${n} of 6`):S('The great lamp is clear!','The great lamp is clear!'),'#ffe0b0',12); saveGame(); } }
  if(inArcC(mx,my,ang,175,0.45,{x:M3P_LH.lamp[0],y:M3P_LH.lamp[1],r:18})&&(!M3P.lhFireT||G.time-M3P.lhFireT>3)){ M3P.lhFireT=G.time; ftext(M3P_LH.lamp[0],M3P_LH.lamp[1]-40,S('It wants moonlight, not fire.','It wants moonlight, not fire.'),'#dfe8ff',12); }
}
function m3pLhMoon(dt){
  if(AREA||!m3pAt('m_lighthouse',1)||G.flags.m_lighthouse_lit) return;
  if(!m3pMoonHits(M3P_LH.lamp[0],M3P_LH.lamp[1],22)) return;
  if(!m3pHigh(M3P_LH.x,M3P_LH.y,'claws')) return;
  if(m3pOilN()<6){ if(!M3P.lhMothT||G.time-M3P.lhMothT>2.5){ M3P.lhMothT=G.time; ftext(M3P_LH.lamp[0],M3P_LH.lamp[1]-40,S('The moths smother the moonfire! Light the little oil lamps first.','Moths in the way! Light the oil lamps first.'),'#dfe8ff',12); } return; }
  M3P.moonT.lh=(M3P.moonT.lh||0)+dt;
  if(M3P.moonT.lh>0.9){ G.flags.m_lighthouse_lit=1; M3P.moonT.lh=0; SFX.play('shrine'); flashA=0.5; flashCol='220,230,255'; setBanner(S('The great lamp blazes silver!','The lamp shines silver!'),S('Talk to Old Ned.','Talk to Old Ned.'),2.6); questPoke(); saveGame(); }
}
// Old Kiln's furnace: two seconds of Moonfire tempers the moon crumb (the furnace turns silver)
function m3pFurnPrompt(){ if(m3pAt('m_glaive',2)) return S('Look at Old Kiln’s glass furnace','Look at the furnace'); return M3P_STAND?S('Look at the glass furnace','Look at the furnace'):null; }
function m3pFurnAct(){ m3pSay([m3pN(m3pAt('m_glaive',2)?`The furnace roars. The moon crumb sits in a clay cup in the middle of the flames, cold and silver. It wants moonfire.`:`A glass furnace, roaring like a happy dragon. Old Kiln's hat is on top of it, for some reason.`,m3pAt('m_glaive',2)?`The moon crumb sits in the fire. It wants moonfire.`:`A roaring glass furnace. Kiln's hat is on it.`)]); }
function m3pFurnMoon(dt){
  if(AREA||!m3pAt('m_glaive',2)) return;
  if(!m3pMoonHits(M3P_FURN[0],M3P_FURN[1]-10,30)) return;
  M3P.moonT.furn=(M3P.moonT.furn||0)+dt; if(Math.random()<0.4) emit(M3P_FURN[0]+rand(-14,14),M3P_FURN[1]-20,1,{col:'220,230,255',ang:-Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:20});
  if(M3P.moonT.furn>=2){ G.flags.m_glaive_temper=1; SFX.play('shrine'); flashA=0.4; flashCol='220,230,255'; setBanner(S('The furnace turns silver!','The furnace turns silver!'),S('Old Kiln is shouting with joy. Go and see.','Kiln is shouting. Go see!'),2.6); questPoke(); saveGame(); }
}
function m3pFurnFire(mx,my,ang){ if(AREA||!m3pAt('m_glaive',2)) return; if(inArcC(mx,my,ang,175,0.45,{x:M3P_FURN[0],y:M3P_FURN[1]-10,r:26})&&(!M3P.furnT||G.time-M3P.furnT>3)){ M3P.furnT=G.time; bubble({x:M3P_FURN[0],y:M3P_FURN[1]-30},S('NOT candlelight! MOONFIRE!','Not fire! MOONFIRE!'),{who:SPK.m_kiln?SPK.m_kiln.name:'Old Kiln',col:'#e8803a',dy:-30}); } }
// Vesper's job, part 1: burrow under the Burrow Gap three times (she needs the tunnel wider)
function m3pGapTick(){
  if(AREA||!m3pAt('m_vesper',0)||!m3pVesperOn()||G.flags.m_vesper_gap) return;
  const p=player; if(Math.abs(p.y-67200)>180||Math.abs(p.x-10900)>320){ M3P.gapSide=0; return; }
  if(!m3pBurrowed()){ M3P.gapSide=0; return; }
  const side=p.x<10900?-1:1;
  if(M3P.gapSide&&side!==M3P.gapSide){ G.flags.m_vgap_n=(G.flags.m_vgap_n|0)+1; const n=G.flags.m_vgap_n; emit(p.x,p.y,14,{col:'226,196,128',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
    if(n>=3){ G.flags.m_vesper_gap=1; setBanner(S('The Burrow Gap is wide enough!','The gap is wide enough!'),S('A small shape in a moth mask slips through behind you. "Thanks, worm."','Vesper slips through. "Thanks, worm."'),3); questPoke(); saveGame(); }
    else setBanner(S(`The tunnel gets wider. ${n} of 3`,`Wider! ${n} of 3`),'',1.6); }
  M3P.gapSide=side;
}
// Vesper's job, part 2: the Moth Knight posts. Each knight looks slowly round; a lit lamp makes him stare at it.
function m3pSentFace(s){ const S0=M3P.sent||(M3P.sent={}), st=S0[s.i]||(S0[s.i]={a:s.i*2.1,lit:0,cd:0}); return st; }
function m3pSentPrompt(s){ if(!m3pAt('m_vesper',1)||!m3pVesperOn()||G.flags['m_smoke'+s.i]) return null; return S('Plant a moth-smoke bomb','Plant a smoke bomb'); }
function m3pSentAct(s){ if(G.flags['m_smoke'+s.i]) return; G.flags['m_smoke'+s.i]=1; SFX.play('pickup'); emit(s.x,s.y,10,{col:'190,170,230',glow:false,smin:20,smax:70,lmin:.4,lmax:.8,zmin:1.5,zmax:3,grow:6});
  const n=m3pSmokeN(); setBanner(S(`Smoke bomb planted. ${n} of 3`,`Bomb planted. ${n} of 3`),n<3?S('Now get away without being seen!','Now sneak away!'):S('All three! Meet Vesper at the foot of the Moonpath.','All three! Meet Vesper.'),2.4);
  if(n>=3){ G.flags.m_vesper_smoke=1; questPoke(); } saveGame(); }
function m3pSentTick(dt){
  if(AREA||!m3pAt('m_vesper',1)||!m3pVesperOn()) return;
  const p=player, E=m3pEasy(), R=E?140:175, half=E?0.42:0.55;
  for(const s of M3P_SENT){ const st=m3pSentFace(s);
    if(st.lit>0) st.lit-=dt; if(st.cd>0) st.cd-=dt;
    const want=st.lit>0?angTo(s.x,s.y,s.lamp[0],s.lamp[1]):st.a+dt*0.9;
    st.a=st.lit>0?turnTo(st.a,want,3*dt):want;
    if(dist2(p.x,p.y,s.x,s.y)>R*R||st.cd>0||m3pBurrowed()||m3pDiving()||airborne()) continue;
    if(Math.abs(angDiff(st.a,angTo(s.x,s.y,p.x,p.y)))<half){
      st.cd=2.5; const had=!!G.flags['m_smoke'+s.i]; delete G.flags['m_smoke'+s.i];
      const a=angTo(s.x,s.y,p.x,p.y); p.kvx+=Math.cos(a)*420; p.kvy+=Math.sin(a)*420;
      bubble({x:s.x,y:s.y-30},pick([S('Stop! Who goes there?','Stop!'),S('A dragon? Begone!','Begone, dragon!'),S('Intruder! Shoo!','Shoo!')]),{who:S('Moth Knight','Moth Knight'),col:'#b8a8e8',dy:-30});
      SFX.play('warn'); if(had) setBanner(S('Seen! He found the smoke bomb.','Seen! He found the bomb.'),S('Light his lamp to make him look away, then try again.','Light his lamp. Then try again.'),2.6);
    }
  }
}
function m3pSentFire(mx,my,ang){ if(AREA||!m3pAt('m_vesper',1)) return; for(const s of M3P_SENT){ if(inArcC(mx,my,ang,175,0.45,{x:s.lamp[0],y:s.lamp[1],r:22})){ const st=m3pSentFace(s); if(st.lit<=0.5){ SFX.play('pickup'); bubble({x:s.x,y:s.y-30},S('Ooh. A lamp.','Ooh. A lamp.'),{who:S('Moth Knight','Moth Knight'),col:'#b8a8e8',dy:-30}); } st.lit=m3pEasy()?14:9; } } }
// reading Granny Oona's letter by a lamp (m_vesper, not befriended)
function m3pReadLetter(){ m3pSay(STORY.m_vletter.slice(),()=>{ G.flags.m_vletter_read=1; G.flags.m_vesper_letter=1; G.choices.extra=G.choices.extra||{}; G.choices.extra.m_vesper=S(`You found Granny Oona's lost letter to Vesper: "Fire isn't the only warm thing. Be kind."`,`You found Gran's letter to Vesper.`); questPoke(); }); }
// the letter can also be read at Esme's door (the Lamp House always has a lamp lit)
function m3pEsmeLampBuild(){ const d=m3pDoorAt('m_esme'); const x=d?d.x+44:9990, y=d?d.y+6:67960;
  m3pLM({id:'m3p_esmelamp',k:'m3p_esmelamp',x,y,draw:()=>{},get prompt(){ return m3pOn('m_vesper')&&!m3pVesperOn()&&G.items.m_vletter&&!G.flags.m_vletter_read?S('Read the letter by the Lamp House lamp','Read the letter by the lamp'):null; },
    hidden:()=>!(m3pOn('m_vesper')&&!m3pVesperOn()&&G.items.m_vletter&&!G.flags.m_vletter_read),act:()=>m3pReadLetter()}); }

// area objects: Little Sun in Rafi's tent; the vault in the Drowned Library and Duchess's air pocket (if the dungeon
// module has not made its own: x3_dun_a can set `vault:true` / `duchess:true` on DUNGEONS.m_lumen to keep them out)
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.m3pAct){ o.m3pAct(o); return; } return base(o); }; }
{ const base=drawFurn; drawFurn=function(o,t){ if(o&&o.m3pDraw){ o.m3pDraw(o,t); return; } return base(o,t); }; }
function m3pAreaObjs(A){
  if(!A) return;
  const rafi=CASTBY.m_rafi&&CASTBY.m_rafi.inside;
  if(rafi&&A.id===rafi){ const L=M3P_LAMPS[11], x=A.rx+A.rw*0.78, y=A.ry+A.rh*0.3;
    A.objs.push({id:'m3p_tentlamp',k:'m3p_tentlamp',x,y,w:30,h:30,L,m3pDraw:o=>m3pDrawLampAt(o.x,o.y+14,m3pLampLit(11),false,G.time,0.9),
      prompt:()=>G.flags.m_eclipse2&&!G.flags.m_lamp_11?S('Look at the little tent lamp','Look at the tent lamp'):null,
      m3pAct:()=>m3pSay([m3pN(`Little Sun, the tent lamp, is cold and dark. Breathe on her.`,`The tent lamp is cold. Breathe on it.`)])});
    A.lights.push({x,y:y-6,r:150,get i(){ return m3pLampLit(11)?0.8:0; }}); }
  const D=typeof DUNGEONS!=='undefined'&&DUNGEONS.m_lumen;
  // one owner (ACT II lesson 2): when the dungeon module builds its own vault or Duchess, ours stand aside
  const theirs=re=>A.objs.some(o=>!String(o.id||'').startsWith('m3p')&&re.test(String(o.k||'')+' '+String(o.id||'')))||A.npcs.some(n=>re.test(String(n.id||'')+' '+String(n.kind||'')));
  if(m3pDun(A,'m_lumen')&&!(D&&D.vault)&&!M3P.noVault&&!theirs(/vault/i)){ const R=m3pRoom(A,'l'); if(R){ const p=m3pRoomCell(A,R,R.cx,R.y0+70)||m3pFree(R.cx,R.y0+70,160);
    A.objs.push({id:'m3p_vault',k:'m3p_vault',x:p.x,y:p.y,w:56,h:40,m3pDraw:o=>m3pDrawVault(o,G.time),
      prompt:()=>G.flags.m_vault_open?null:S('Look at the sealed vault','Look at the sealed vault'),
      m3pAct:()=>m3pSay([m3pN(G.flags.m_vault_open?`The vault stands open and empty.`:`A round vault door with a moon on it, sealed with thick silver wax. Fire won't touch it. It wants moonlight.`,G.flags.m_vault_open?`The vault is open.`:`A vault sealed with silver wax. It wants moonlight.`)])}); } }
  if(m3pDun(A,'m_lumen')&&!(D&&D.duchess)&&!M3P.noDuchess&&!theirs(/duchess|goat/i)){ const R=m3pRoom(A,'k'); if(R&&!G.flags.m_duchess){ const p=m3pRoomCell(A,R,R.x0+60,R.y0+40)||m3pFree(R.x0+90,R.y0+80,180); M3P.duch={x:p.x,y:p.y,face:0.4,t:0,kind:'goat',moving:false}; } else M3P.duch=null; } else M3P.duch=null;
}
// the moon-wax vault: Moonfire on it (under water too) for about a second
function m3pVaultOpen(){
  if(G.flags.m_vault_open) return false;
  G.flags.m_vault_open=1; giveItems({m_book_raw:1}); SFX.play('shrine');
  m3pSay(STORY.m_vault.slice(),()=>questPoke()); return true;
}
function m3pVaultTick(dt){
  if(!AREA||G.flags.m_vault_open) return; const o=AREA.objs.find(q=>q.k==='m3p_vault'); if(!o) return;
  if(m3pMoonHits(o.x,o.y,30)){ M3P.vaultT+=dt; if(Math.random()<0.4) emit(o.x+rand(-18,18),o.y-10,1,{col:'230,236,255',ang:-Math.PI/2,spread:0.7,smin:20,smax:50,lmin:.4,lmax:.8,zmin:1.4,zmax:2.6}); if(M3P.vaultT>1) m3pVaultOpen(); }
}
// Duchess in an air pocket in Drowned Lumen (THREADS 14.3, sighting 4)
// (if the dungeon module writes STORY.m_duchess too, its lines are the ones played; the flag, coins and XP come with them)
if(!STORY.m_duchess) STORY.m_duchess=[m3pN(`You pop up into a pocket of air under a drowned roof. Somebody is already here. Sitting in the dry corner. Chewing seaweed.`,`You come up in an air pocket. Someone is here, chewing seaweed.`),
  m3pL('ash',`DUCHESS?! You can't even SWIM.`,`DUCHESS?! You can't even SWIM!`),
  m3pIf(()=>G.choices.ending==='lantern','ash',`Does Grandpa know you're here? He's going to be SO cross.`,`Does Grandpa know? He'll be SO cross.`),
  ['goat',S(`Meh.`,`Meh.`)],
  m3pN(`Duchess has a small pile of coins by her hooves. Nobody knows where goats get coins. Nobody asks.`,`Duchess has some coins. Nobody asks where from.`),
  m3pDo(()=>{ G.flags.m_duchess=1; addCoins(30); gainXp(60); })];
// the sighting (a public hook too: a dungeon module with its own air pocket can call m3pDuchessMeet() when Ash surfaces in it)
function m3pDuchessMeet(){ if(G.flags.m_duchess) return false; M3P.duch=null; const had=G.coins|0; m3pSay(STORY.m_duchess.slice(),()=>{ if(!G.flags.m_duchess){ G.flags.m_duchess=1; if((G.coins|0)===had){ addCoins(30); gainXp(60); } } }); return true; }
function m3pDuchTick(){ const d=M3P.duch; if(!d||!AREA||G.flags.m_duchess||scene!=='play'||DLG) return; d.t=G.time; if(dist(player.x,player.y,d.x,d.y)<110&&!m3pDiving()) m3pDuchessMeet(); }
// gentle fire everywhere: lamps, the lighthouse oil lamps, Kiln's furnace (wrong breath), the knights' lamps
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){ base(mx,my,ang,dt); try{ if(G&&G.mode==='story'&&m3pIV()){ const blue=typeof P3!=='undefined'&&!!P3.jetOn;
  m3pLampFire(mx,my,ang,dt,blue,false); m3pLhFire(mx,my,ang,dt); m3pFurnFire(mx,my,ang); m3pSentFire(mx,my,ang); } }catch(e){ console.error(e); } }; }
// Moonfire lights the lamps too (it is silver fire), and the lighthouse, the furnace and the vault want it
function m3pMoonTick(dt){
  if(typeof P4==='undefined'||!P4.arcs||!P4.arcs.length) return;
  m3pLhMoon(dt); m3pFurnMoon(dt); m3pVaultTick(dt);
  if(G.flags.m_eclipse2&&!AREA) for(const L of M3P_LAMPS){ if(G.flags['m_lamp_'+L.i]||L.kind==='buried'||L.kind==='palm'||L.kind==='tent') continue; if(L.kind==='tall'&&!player.flying) continue; if(m3pMoonHits(L.x,L.y,24)){ const k='lamp'+L.i; M3P.lampHeat[k]=(M3P.lampHeat[k]||0)+dt; if(M3P.lampHeat[k]>0.35) m3pLightLamp(L,'moon'); } }
  if(AREA&&G.flags.m_eclipse2&&!G.flags.m_lamp_11){ const o=AREA.objs.find(q=>q.k==='m3p_tentlamp'); if(o&&m3pMoonHits(o.x,o.y,24)) m3pLightLamp(M3P_LAMPS[11],'moon'); }
  if(!AREA&&m3pAt('m_vesper',1)) for(const s of M3P_SENT) if(m3pMoonHits(s.lamp[0],s.lamp[1],22)){ const st=m3pSentFace(s); st.lit=m3pEasy()?14:9; }
}

// ---------- the Moonfish (m_moonfish, step 1): it flees from a diver; push it up into the glowing ring under the raft
function m3pFishTick(dt){
  const on=m3pAt('m_moonfish',0)||m3pAt('m_moonfish',1)||m3pAt('m_moonfish',2);
  const F=M3P.fish||(M3P.fish={x:2400,y:60700,tx:2400,ty:60700,face:0,on:false,push:0,mode:'idle',t:0,cd:0,jelly:false});
  F.on=on&&!AREA&&curMap()===3;
  const O=M3P.fishO; if(O){ O.x=F.x; O.y=F.y; O.fish=F; }
  if(!F.on) return;
  const p=player, up=!!G.flags.m_moonfish_up, need=m3pEasy()?2:3;
  F.t+=dt; if(F.cd>0) F.cd-=dt;
  if(up){ const a=F.t*1.4; F.tx=M3P_RING[0]+Math.cos(a)*50; F.ty=M3P_RING[1]+Math.sin(a)*24; F.mode='ring'; }
  else{
    const d=dist(p.x,p.y,F.x,F.y), chase=(m3pDiving()||m3pSwimming())&&d<190;
    if(F.mode==='back'){ if(dist(F.x,F.y,F.tx,F.ty)<30||F.cd<=0) F.mode='idle'; }
    else if(chase){ F.mode='flee'; const a=angTo(p.x,p.y,F.x,F.y); F.tx=F.x+Math.cos(a)*160; F.ty=F.y+Math.sin(a)*160; }
    else{ F.mode='idle'; if(dist(F.x,F.y,F.tx,F.ty)<30){ F.tx=rand(1300,3500); F.ty=rand(60450,61150); } }
    F.tx=clamp(F.tx,1100,3700); F.ty=clamp(F.ty,60350,61380);
    if(F.mode==='flee'&&F.cd<=0&&dist(F.x,F.y,M3P_RING[0],M3P_RING[1])<95){
      F.push++; F.cd=2.2; F.mode='back'; F.tx=rand(1400,3400); F.ty=rand(60450,60800);
      if(G.ripples) G.ripples.push({x:M3P_RING[0],y:M3P_RING[1],t:0,max:0.9,r:30,splash:true}); SFX.play('pop');
      bubble({x:M3P_RAFT[0],y:M3P_RAFT[1]-30},F.push<need?pick([S('I SAW IT! Again! Push it up again!','I SAW IT! Again!'),S('OH! So shiny! Once more!','So shiny! Once more!')]):S('IT’S AT THE RAFT! Quick, talk to me!','It’s here! Talk to me!'),{who:'Cook Gilly',col:'#3a8aaa',dy:-36});
      if(F.push>=need){ G.flags.m_moonfish_up=1; setBanner(S('The Moonfish is under the raft!','The Moonfish is at the raft!'),S('Swim up and talk to Gilly to land it.','Talk to Gilly to land it.'),2.6); questPoke(); saveGame(); }
      else setBanner(S(`Splash! The Moonfish leaps at the ring. ${F.push} of ${need}`,`Splash! ${F.push} of ${need}`),S('It darts back down. Chase it up again!','Chase it up again!'),2);
    }
    if(!F.jelly&&dist(p.x,p.y,2400,60800)<1400&&m3pDiving()){ F.jelly=true; if(EDEF.m_moonjelly) for(const [x,y] of [[1900,60850],[2800,60750],[2300,61050]]){ const e=m3pFoe('m_moonjelly',null,x,y,{leash:500}); if(e) e.m3pJelly=true; } }
  }
  const sp=F.mode==='flee'?(m3pEasy()?150:178):F.mode==='back'?220:F.mode==='ring'?60:40;
  const dd=dist(F.x,F.y,F.tx,F.ty); if(dd>2){ const a=angTo(F.x,F.y,F.tx,F.ty); F.face=turnTo(F.face,a,6*dt); const s=Math.min(dd,sp*dt); F.x+=Math.cos(F.face)*s; F.y+=Math.sin(F.face)*s; }
}
// landing it: the Act I fishing timing, once (MINI 'm3p_fish' runs the stock bobber; a pull at the splash wins)
MINI.m3p_fish={
  start(){ M3P.fishOn=true; m3pFishGo(); return {music:'arena',tries:0}; },
  update(M,dt){ if(!G.fishing&&!M.done){ M.wait=(M.wait||0)+dt; if(M.wait>1.2){ M.wait=0; M.tries++; m3pFishGo(); } }
    if(dist(player.x,player.y,M3P_RAFT[0],M3P_RAFT[1])>420) miniEnd(false,S('The Moonfish slipped away!','It got away!'),S('Swim back to Gilly’s raft and try again.','Go back to Gilly. Try again.')); },
  end(){ M3P.fishOn=false; G.fishing=null; },
  target:()=>({x:M3P_RING[0],y:M3P_RING[1]}),
  hud:()=>simplify(S('Land the Moonfish! When it splashes, PULL!','When it splashes, PULL!'))
};
function m3pFishGo(){ const p=player; G.fishing={spot:{x:M3P_RING[0],y:M3P_RING[1]},wx:M3P_RING[0],wy:M3P_RING[1]+10,t:rand(1.6,3.2),bite:0,px:p.x,py:p.y,m3p:true}; p.facing=angTo(p.x,p.y,M3P_RING[0],M3P_RING[1]); }
{ const base=catchFish; catchFish=function(...a){ if(M3P.fishOn&&G.mini&&G.mini.kind==='m3p_fish'){ G.mini.done=true; M3P.fishOn=false; SFX.play('upgrade'); miniEnd(true,S('You landed the Moonfish!','You got it!'),S('Talk to Gilly.','Talk to Gilly.')); return; } return base.apply(this,a); }; }
// a long bite window on Easy
{ const base=updateFishing; updateFishing=function(dt,inp){ const F=G.fishing; if(F&&F.m3p&&F.bite>0&&m3pEasy()&&!F.ez){ F.ez=1; F.bite=1.5; } return base(dt,inp); }; }

// ---------- the Coral Race (m_race): ten rings round the Coralcombe reef and out through the mangroves (MINI 'm_swimrace')
const M3P_RACE=[[1900,67180],[2380,67480],[2320,68020],[1880,68180],[1420,67900],[1300,68700],[1720,69620],[2200,70050],[2980,69620],[2700,68650]];
function m3pRaceWater(x,y){ if(typeof p4SwimAt==='function') return p4SwimAt(x,y)||m3pDeep(x,y); return m3pWater(x,y); }
MINI.m_swimrace={
  start(){
    if(AREA) exitArea(true);
    const C=[1900,67900];
    const rs=M3P_RACE.map(([x,y])=>{ let px=x, py=y; for(let k=0;k<30&&!m3pRaceWater(px,py);k++){ px+=(C[0]-px)*0.1+rand(-20,20); py+=(C[1]-py)*0.1+rand(-20,20); } return {x:px,y:py}; });
    const sx=rs[0].x-60, sy=rs[0].y-120; player.x=sx; player.y=sy; player.kvx=player.kvy=0; if(typeof updateCam==='function') updateCam(0,true); G.fade=1;
    let len=dist(sx,sy,rs[0].x,rs[0].y); for(let i=1;i<rs.length;i++) len+=dist(rs[i-1].x,rs[i-1].y,rs[i].x,rs[i].y); len+=dist(rs[rs.length-1].x,rs[rs.length-1].y,sx,sy);
    const limit=m3pEasy()?100:80;
    setBanner(S('The Coral Race!','The Coral Race!'),S('Ten rings. Swim through each one. GO!','Ten rings. GO!'),2.2);
    return {rs,i:0,len,sx,sy,limit,rk:0,music:'arena',fin:false};
  },
  update(M,dt){
    const p=player, b=M.i<M.rs.length?M.rs[M.i]:{x:M.sx,y:M.sy};
    const inW=!p.flying&&!airborne()&&(m3pDiving()||m3pSwimming()||m3pRaceWater(p.x,p.y));
    if(dist(p.x,p.y,b.x,b.y)<78&&inW){ M.i++; SFX.play('pickup'); emit(b.x,b.y,14,{col:'190,240,255',smin:30,smax:100,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
      if(M.i>M.rs.length){ miniEnd(true,S('You beat Rocket!','You win!'),S('Nana Kelp is waiting in the Kelp Garden.','Go see Nana Kelp.')); return; } }
    M.rk=Math.min(M.len,M.len*M.t/M.limit);
    if(M.t>M.limit) miniEnd(false,S('Rocket wins!','Rocket wins!'),S('"Rocket is the fastest!" Talk to Rocket for a rematch.','Talk to Rocket to race again.'));
  },
  end(){},
  target:M=>M.i<M.rs.length?M.rs[M.i]:{x:M.sx,y:M.sy},
  hud:M=>S(`Coral Race! Ring ${Math.min(M.i+1,10)}/10 · ${Math.max(0,Math.ceil(M.limit-M.t))}s`,`Ring ${Math.min(M.i+1,10)}/10 · ${Math.max(0,Math.ceil(M.limit-M.t))}s`),
  draw(M,t){
    M.rs.forEach((r,i)=>{ if(inView(r.x,r.y,70)) m3pDrawRing(r.x,r.y,i===M.i,i<M.i,t,i+1); });
    if(M.i>=M.rs.length&&inView(M.sx,M.sy,70)) m3pDrawRing(M.sx,M.sy,true,false,t,0);
    const q=m3pRaceAt(M,M.rk); if(inView(q.x,q.y,80)) m3pDrawSwimmer(q.x,q.y,q.a,t,'#e8a030','#c83a2a');
  }
};
function m3pRaceAt(M,s){ const pts=[{x:M.sx,y:M.sy}].concat(M.rs,[{x:M.sx,y:M.sy}]); let acc=0; for(let i=1;i<pts.length;i++){ const d=dist(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y); if(acc+d>=s){ const u=d?(s-acc)/d:0; return {x:lerp(pts[i-1].x,pts[i].x,u),y:lerp(pts[i-1].y,pts[i].y,u),a:angTo(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y)}; } acc+=d; } return {x:M.sx,y:M.sy,a:0}; }

// ---------- Noodle (m_noodle, step 1): he follows Ash, but only through sand. On stone, glass or roads he stops and
// cries until Ash comes back to the sand; when Ash burrows, Noodle burrows after him. In the Burrows he goes anywhere.
function m3pNoodleAt(){ const N=M3P.noodle; if(N&&!N.inside&&N.state==='wait') return `xy:${Math.round(N.x)},${Math.round(N.y)}`; return m3pAtCave('m_burrows',10600,62900); }
function m3pNoodleTick(dt){
  const on=m3pAt('m_noodle',0); let N=M3P.noodle;
  if(!on){ if(N&&!(m3pAt('m_noodle',1)&&N.inside)) M3P.noodle=null; return; }
  if(!N){ const s=M3P_SPOT.m_dusty; N=M3P.noodle={x:s[0]+30,y:s[1]+40,face:0,t:0,state:'follow',inside:false,cry:0,crunch:18,trail:[],area:null}; }
  N.t+=dt; const p=player;
  // in an area: only the Burrows (he wriggles in after you); anywhere else he waits outside
  if(AREA){
    if(!m3pDun(AREA,'m_burrows')){ return; }
    if(N.area!==AREA.id){ N.area=AREA.id; N.inside=true; N.x=p.x-30; N.y=p.y+30; N.state='follow'; bubble({x:N.x,y:N.y-14},S('mip! (Noodle wriggles in after you.)','mip!'),{who:'Noodle',col:'#f0c880',dy:-20}); }
    m3pNoodleMove(N,p.x-Math.cos(p.facing)*44,p.y-Math.sin(p.facing)*44,dt,false);
    const R=m3pRoom(AREA,'l');
    if(R&&!G.flags.m_noodle_home&&p.x>R.x0&&p.x<R.x1&&p.y>R.y0&&p.y<R.y1&&dist(N.x,N.y,p.x,p.y)<320) m3pNoodleHome();
    return;
  }
  if(N.inside){ N.inside=false; N.area=null; N.x=p.x+30; N.y=p.y+40; }
  if(curMap()!==3) return;
  const sandA=m3pSand(p.x,p.y)||m3pBurrowed();
  if(dist(N.x,N.y,p.x,p.y)>900){ if(sandA){ N.x=p.x-40; N.y=p.y+30; N.state='follow'; if(!N.popT||G.time-N.popT>6){ N.popT=G.time; bubble({x:N.x,y:N.y-14},S('mip! (Noodle pops up out of the sand. He followed you underground!)','mip! Noodle followed you!'),{who:'Noodle',col:'#f0c880',dy:-20}); } } else N.state='wait'; return; }
  const moved=m3pNoodleMove(N,p.x-Math.cos(p.facing)*44,p.y-Math.sin(p.facing)*44,dt,true);
  N.state=moved||dist(N.x,N.y,p.x,p.y)<70?'follow':'wait';
  if(N.state==='wait'&&!sandA){ N.cry-=dt; if(N.cry<=0){ N.cry=3.2; bubble({x:N.x,y:N.y-14},pick([S('mip... mip! (Noodle won’t leave the sand.)','mip! (He stays on the sand.)'),S('MIIIP. (Noodle cries. He only goes through sand.)','MIIIP! Only sand!')]),{who:'Noodle',col:'#f0c880',dy:-20}); } }
  N.crunch-=dt; if(N.crunch<=0&&N.state==='follow'){ N.crunch=rand(18,30); bubble({x:N.x,y:N.y-14},S('*crunch* (Noodle ate a little glass cactus. It chimed.)','*crunch* *ding*'),{who:'Noodle',col:'#f0c880',dy:-20}); try{ SFX.play('pickup',0.6); }catch(e){} }
}
function m3pNoodleMove(N,tx,ty,dt,sandOnly){
  const d=dist(N.x,N.y,tx,ty); if(d<34){ N.mv=false; return false; }
  const a=angTo(N.x,N.y,tx,ty), sp=Math.min(d*3,250)*dt, nx=N.x+Math.cos(a)*sp, ny=N.y+Math.sin(a)*sp;
  if(sandOnly&&!m3pSand(nx,ny)&&!m3pBurrowed()&&m3pSand(N.x,N.y)){ N.mv=false; return false; }
  if(AREA&&areaBlocked(nx,ny)){ N.x=lerp(N.x,tx,0.1); N.y=lerp(N.y,ty,0.1); return true; }
  N.face=a; N.x=nx; N.y=ny; N.mv=true; return true;
}
function m3pNoodleHome(){
  G.flags.m_noodle_home=1;
  m3pSay([m3pN(`Noodle squeaks, wriggles past you and burrows straight to the enormous sleeping worm curled round her eggs.`,`Noodle squeaks and wriggles to the huge sleeping worm.`),
    m3pL('m_noodle',`mip! MIP! MIIIIP!`,`mip! MIP!`),m3pN(`One great eye opens.`,`One huge eye opens.`)],()=>{ questPoke(); });
}

// ---------- the per-frame tick (outdoors and in areas)
function m3pFrame(dt){
  if(!G||G.mode!=='story'||!player) return;
  if(scene!=='play') return;
  m3pSyncTick(dt);
  if(!m3pIV()) return;
  const map3=curMap()===3;
  // Dell's boat docks a day after Glaciar lands, or when Ash comes back to Driftwood after Drowned Lumen
  if(G.flags.m_landed&&!G.flags.m_boat_in&&!m3pShipRoute()){
    if(G.flags.m_land_day==null) G.flags.m_land_day=m3pDay();
    if(m3pDay()>G.flags.m_land_day||(m3pR('m_coral')&&!AREA&&map3&&dist(player.x,player.y,2300,64800)<900)){ G.flags.m_boat_in=1; later(0.6,()=>setBanner(S('The Soggy Biscuit Three is in!','Dell’s boat is here!'),S('Dell has docked at Driftwood, with Wren and Mags aboard.','Dell, Wren and Mags are here.'),3)); M3P.sig=''; }
  }
  if(map3||AREA){ m3pMoonTick(dt); m3pFishTick(dt); m3pNoodleTick(dt); }
  if(!AREA&&map3){ m3pBuriedTick(); m3pGapTick(); m3pSentTick(dt); m3pForts(); m3pLampLights(); m3pSunkTick(dt); }
  if(AREA) m3pDuchTick();
  m3pAirJar();
  // Mom's letter finds Ash at the Moonpath foot if he got there without it (ACT4 6.8c)
  if(!AREA&&map3&&G.flags.m_eclipse2&&!G.flags.m_pb_3&&typeof pebbleNow==='function'&&dist(player.x,player.y,12600,65300)<320&&!M3P.pbNow){ M3P.pbNow=true; pebbleNow('m_pb_3'); }
  // no bombs when the way to the Sunken Gate opens: Mags's parcel comes at once
  if(m3pR('m_reef')&&!(G.weapons&&G.weapons.bombs)&&!G.flags.m_pb_bombs&&!M3P.pbBombs&&typeof pebbleNow==='function'){ M3P.pbBombs=true; pebbleNow('m_pb_bombs'); }
}
{ const base=updateComps; updateComps=function(dt){ base(dt); if(M3P.err>20) return; try{ m3pFrame(dt); }catch(e){ M3P.err++; console.error('x3_people',e); } }; }
function m3pForts(){ if(!m3pOn('m_ferry')) return; const C=G.campsCleared||{};
  for(const [f,c,x,y] of M3P_FORTS){ if(G.flags[f]) continue; const K=m3pFortCamp(c,x,y), id=K?K.id:c; if(C[id]!=null||C[c]!=null){ G.flags[f]=1; setBanner(S('A Crab Pirate fort is cleared!','A crab fort is cleared!'),S(`Forts: ${M3P_FORTS.filter(q=>G.flags[q[0]]).length} of 2`,`Forts: ${M3P_FORTS.filter(q=>G.flags[q[0]]).length} of 2`),2.2); questPoke(); saveGame(); } } }
function m3pLampLights(){ const nk=1-daylight(); for(const L of M3P_LAMPS){ if(!L.light) continue; L.light.i=m3pLampLit(L.i)?0.25+0.65*nk:0; }
  if(M3P_LH.light) M3P_LH.light.i=G.flags.m_lighthouse_lit?0.4+0.6*nk:0;
  for(const s of M3P_SENT) if(s.light){ const st=M3P.sent&&M3P.sent[s.i]; s.light.i=st&&st.lit>0?0.85:0; }
  if(M3P.furnLight) M3P.furnLight.i=G.flags.m_glaive_temper&&!m3pQ('m_glaive')?0.9:0.55; }
// Nana Kelp's jar of air: opens itself when the air runs low under water
function m3pAirJar(){ if(!(G.items.m_airjar>0)||!m3pDiving()||typeof P4==='undefined'||typeof p4AirMax!=='function') return; if(P4.air<p4AirMax()*0.18){ P4.air=p4AirMax(); G.items.m_airjar--; if(!G.items.m_airjar) delete G.items.m_airjar; setBanner(S('You open a jar of air. Ahh!','Ahh! Fresh air!'),S('Nana Kelp’s bubbles fill your lungs.','The jar fills your air.'),2); SFX.play('pop'); } }
// the lighthouse beam at night shows the three sunken chests (once)
function m3pSunkTick(dt){ if(!G.flags.m_moonlantern||!isNight()||G.flags.m_sunk_seen) return; if(dist(player.x,player.y,1000,61900)>2600) return;
  G.flags.m_sunk_seen=1; for(const c of M3P_SUNK) fogReveal(c.x,c.y,260); setBanner(S('The lighthouse beam sweeps the sea','The beam sweeps the sea'),S('Three sunken chests glint under the water. Dive for them!','Three chests glint under the water!'),3.2); }
// rests: Oriel's whisper at the Moonpath Shrine ('warden' ending only, THREADS 9.1)
{ const base=restAtShrine; restAtShrine=function(s){ base(s); try{ if(s&&s.id==='s_m_moonpath'&&G.choices.ending==='warden'&&!G.flags.m_oriel&&G.mode==='story') later(1.6,()=>{ if(scene!=='play') return; G.flags.m_oriel=1;
  m3pSay([m3pN(`The shrine flame turns five colors, one after another.`,`The shrine flame turns five colors.`),m3pL('oriel',`Emberblood. It's Oriel. The crags are quiet without you. All five of us are with you up there. Even the one who complains about the cold.`,`It's Oriel. All five of us are with you. Even the one who hates the cold.`),m3pL('tove',`I HEARD that.`,`I HEARD that!`)]); }); }catch(e){} }; }
// the tide-bomb prototypes and the sandwich leave the satchel when their quests are done
{ const base=onQuestDone; onQuestDone=function(id){ base(id); try{ if(id==='m_tidebombs') takeItems({m_tideproto:9}); }catch(e){} }; }
// the letter at Esme's lamp is placed once the homes are known
{ const base=assignHomesNew; assignHomesNew=function(){ base(); try{ m3pEsmeLampBuild(); }catch(e){ console.error(e); } }; }
// ---------- drawing hooks: our moving figures and tall things sorted with the people (outdoors and in areas)
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ m3pForRender(list); }catch(e){ M3P.err++; if(M3P.err<5) console.error('x3_people draw',e); } }; }
{ const base=drawTexts; drawTexts=function(){ try{ m3pOverlay(); }catch(e){ M3P.err++; } return base(); }; }
// ---------- once every module has loaded (world build): missing stage ids, the epilogue hook, the letters
function m3pInit(){ m3pStandDungeons(); m3pStagesFallback(); m3pEpiPush(); m3pMail(); M3P.sig=''; }
{ const base=initWorld; initWorld=function(){ try{ m3pInit(); }catch(e){ console.error('x3_people init',e); } return base(); }; }
function m3pReset(){ M3P.sig=''; M3P.visC=null; M3P.pbBombs=false; M3P.fish=null; M3P.noodle=null; M3P.sent=null; M3P.duch=null; M3P.pbNow=false; M3P.vaultT=0; M3P.lampHeat={}; M3P.moonT={}; M3P.gapSide=0; M3P.fishOn=false; if(M3P.fishO) M3P.fishO.fish=null; }
{ const base=loadGame; loadGame=function(s){ const r=base(s); m3pReset(); return r; }; }
{ const base=newRun; newRun=function(m){ base(m); m3pReset(); }; }

// ---------- 15. drawings (world coordinates, small and cheap; Storybook outlines)
const M3P_INK='rgba(28,17,12,.85)';
function m3pShadow(x,y,rx,ry,a){ ctx.fillStyle=`rgba(0,0,0,${a||0.22})`; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); }
function m3pStroke(w){ ctx.strokeStyle=M3P_INK; ctx.lineWidth=w||2; ctx.stroke(); }
// --- merfolk tails. 2D: a tapered tail and a two-lobed fin behind the body, swishing slowly (the person is drawn on top)
function m3pTail2D(n,col){
  const P=pProfile(n), k=P.k, t=(n.t||0), sw=Math.sin(t*2.6+(P.seed||0)*6)*0.28;
  ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(n.face||0); ctx.scale(k,k);
  ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(-12,1,13,5,0,0,TAU); ctx.fill();
  ctx.translate(-3,0); ctx.rotate(sw);
  const lite=shd(col,0.22), dark=shd(col,-0.25);
  ctx.beginPath(); ctx.moveTo(0,-6.4); ctx.quadraticCurveTo(-9,-5.4,-16,-1.8); ctx.lineTo(-16,1.8); ctx.quadraticCurveTo(-9,5.4,0,6.4); ctx.closePath();
  ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle=POUT; ctx.lineWidth=1.6; ctx.stroke();
  ctx.fillStyle=lite; for(const [x,y] of [[-4,-2.2],[-4,2.2],[-8,0],[-11,-1.4],[-11,1.4]]){ ctx.beginPath(); ctx.arc(x,y,1.1,0,TAU); ctx.fill(); }
  ctx.save(); ctx.translate(-16,0); ctx.rotate(sw*0.8);
  ctx.beginPath(); ctx.moveTo(1,0); ctx.quadraticCurveTo(-4,-3,-9,-8.5); ctx.quadraticCurveTo(-6,-2,-6.5,0); ctx.quadraticCurveTo(-6,2,-9,8.5); ctx.quadraticCurveTo(-4,3,1,0); ctx.closePath();
  ctx.fillStyle=lite; ctx.fill(); ctx.strokeStyle=POUT; ctx.lineWidth=1.4; ctx.stroke();
  ctx.strokeStyle=dark; ctx.lineWidth=0.7; ctx.beginPath(); ctx.moveTo(-1,0); ctx.lineTo(-7,-6); ctx.moveTo(-1,0); ctx.lineTo(-7,6); ctx.stroke(); ctx.restore();
  ctx.restore();
}
{ const base=drawNPC; drawNPC=function(n){ if(n&&!T3.on){ const tc=m3pTailOf(n); if(tc) try{ m3pTail2D(n,tc); }catch(e){} } return base(n); }; }
// 3D: no legs (the figure wears its "dress" bottom), and a tail of ellipsoids curling back along the floor to a fin
{ const base=pq3; pq3=function(P){ const had=!!P._q3, Q=base(P); if(!had&&P.o&&P.o.tail){ Q.m3pTail=hx6(P.o.tail,'#2a9a9a'); Q.dress=true; Q.hem=0.2; Q.shoe=Q.m3pTail; } return Q; }; }
{ const base=pqPerson; pqPerson=function(P){ const Q=T3S.Q; if(Q&&Q.m3pTail) try{ m3pTail3D(P,Q); }catch(e){} return base(P); }; }
// the tail curls round to one side on the floor, so it shows from the front too, and ends in a two-lobed fin; scale
// dots along the top. (The "shoes" a dress shows under its hem sit inside the first segment, in the tail color.)
const M3P_TAIL=[[-1.4,0.8,4.3,4.4,5.0,3.0],[-4.3,3.8,2.7,3.8,4.0,2.3],[-6.1,7.3,1.9,3.1,3.2,1.8],[-5.7,10.6,1.5,2.4,2.5,1.4]];
function m3pTail3D(P,Q){
  const c=Q.m3pTail, W=Q.W, O=P.outfit, lite=shd(c,0.22), dark=shd(c,-0.12);
  if(!(O==='dress'||O==='robe'||O==='fur')) pqE(0,0,7.4,4.9*W,5.6*W,4.4,c);
  M3P_TAIL.forEach(([x,y,z,rx,ry,rz],i)=>pqE(x,y*W,z,rx*W,ry*W,rz,i===2?dark:c));
  const tx=-5.7, ty=10.6*W;
  pqPoly([[tx,ty+0.8,1.7],[tx-4.6,ty+5.4,2.9],[tx-0.9,ty+3.8,1.6]],lite,0.12);
  pqPoly([[tx,ty+0.8,1.7],[tx-0.9,ty+3.8,1.6],[tx+4.2,ty+5.0,2.9]],lite,0.12);
  for(const [x,y,z] of [[-2.2,-0.6,6.6],[-0.6,2.6,6.4],[-4.2,3.4,4.8],[-5.0,6.6,3.6],[-6.6,8.0,3.2]]) pqD(x,y*W,z,0.55,lite,0.3);
}
// --- Sable's lamps: posts, tall poles, the islet lamp, Coco on the palm, the buried ones (a glint in the sand)
function m3pDrawLampAt(x,y,lit,tall,t,s){
  s=s||1; const H=(tall?78:44)*s;
  ctx.save(); m3pShadow(x,y+1,6*s,3*s);
  ctx.fillStyle='#5a4a3a'; ctx.fillRect(x-2*s,y-H,4*s,H); ctx.strokeStyle=M3P_INK; ctx.lineWidth=1.6; ctx.strokeRect(x-2*s,y-H,4*s,H);
  ctx.fillStyle='#e8c060'; ctx.fillRect(x-7*s,y-H-2*s,14*s,3*s);
  ctx.fillStyle=lit?'#ffe7a0':'#5a6070'; ctx.beginPath(); ctx.roundRect?ctx.roundRect(x-6*s,y-H-17*s,12*s,15*s,3*s):ctx.rect(x-6*s,y-H-17*s,12*s,15*s); ctx.fill(); m3pStroke(1.6);
  ctx.fillStyle='#c84a3a'; ctx.beginPath(); ctx.moveTo(x-8*s,y-H-17*s); ctx.lineTo(x,y-H-25*s); ctx.lineTo(x+8*s,y-H-17*s); ctx.closePath(); ctx.fill(); m3pStroke(1.4);
  if(lit){ glowAt(x,y-H-10*s,26*s,'255,214,120',0.32+0.06*Math.sin(t*5+x)); ctx.fillStyle='#fff6d0'; ctx.beginPath(); ctx.ellipse(x,y-H-9*s,2.4*s,4*s,0,0,TAU); ctx.fill(); }
  ctx.restore();
}
function m3pDrawPalm(x,y,lit,t){
  ctx.save(); m3pShadow(x+10,y+2,22,7);
  ctx.strokeStyle=M3P_INK; ctx.lineWidth=9; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+18,y-60,x+8,y-118); ctx.stroke();
  ctx.strokeStyle='#a8784a'; ctx.lineWidth=6; ctx.stroke();
  ctx.strokeStyle='rgba(90,60,30,.6)'; ctx.lineWidth=1.2; for(let i=1;i<9;i++){ const u=i/9, px=x+18*2*u*(1-u)+8*u*u, py=y-118*u; ctx.beginPath(); ctx.moveTo(px-3,py); ctx.lineTo(px+3,py-2); ctx.stroke(); }
  const tx=x+8, ty=y-118;
  for(let i=0;i<6;i++){ const a=-Math.PI/2+(i-2.5)*0.62+Math.sin(t*1.3+i)*0.04; ctx.fillStyle=i%2?'#3a8a3a':'#4aa04a'; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.quadraticCurveTo(tx+Math.cos(a-0.3)*30,ty+Math.sin(a-0.3)*30,tx+Math.cos(a)*48,ty+Math.sin(a)*48+12); ctx.quadraticCurveTo(tx+Math.cos(a+0.3)*24,ty+Math.sin(a+0.3)*24,tx,ty); ctx.fill(); m3pStroke(1.4); }
  for(const [dx,dy] of [[-5,4],[4,6]]){ ctx.fillStyle='#6a4a2a'; ctx.beginPath(); ctx.arc(tx+dx,ty+dy,4,0,TAU); ctx.fill(); m3pStroke(1.2); }
  m3pDrawLampAt(tx,ty-2,lit,false,t,0.55);
  ctx.restore();
}
function m3pLampItems(list,t){
  for(const L of M3P_LAMPS){ if(L.kind==='tent'||!inView(L.x,L.y,180)) continue;
    const lit=m3pLampLit(L.i);
    if(L.kind==='buried'){ if(G.flags.m_eclipse2&&!lit){ list.push({x:L.x,y:L.y-40,draw:()=>{ const a=0.5+0.5*Math.sin(t*4+L.i); ctx.save(); ctx.globalAlpha=a; pStar(ctx,L.x-8,L.y-2,4,'#fff4c0'); pStar(ctx,L.x+7,L.y+4,3,'#fff4c0'); pStar(ctx,L.x+1,L.y-8,2.4,'#fff4c0'); ctx.restore(); }}); }
      else list.push({x:L.x,y:L.y,draw:()=>m3pDrawLampAt(L.x,L.y,lit,false,t,0.9)}); continue; }
    if(L.kind==='palm') list.push({x:L.x,y:L.y,draw:()=>m3pDrawPalm(L.x,L.y,lit,t)});
    else list.push({x:L.x,y:L.y,draw:()=>m3pDrawLampAt(L.x,L.y,lit,L.kind==='tall',t,L.small?0.8:1)}); }
}
// --- the ferry posts and Rowan's lines
function m3pDrawPost(P,t){ const d=!!G.flags['m_postd'+P.i]; ctx.save(); m3pShadow(P.x,P.y+2,10,4); ctx.translate(P.x,P.y); ctx.rotate(d?0:0.42);
  ctx.fillStyle='#8a6a3a'; ctx.fillRect(-4,d?-26:-40,8,d?26:40); ctx.strokeStyle=M3P_INK; ctx.lineWidth=2; ctx.strokeRect(-4,d?-26:-40,8,d?26:40); ctx.fillStyle='#6a4a2a'; ctx.fillRect(-6,d?-29:-43,12,4);
  if(d){ ctx.strokeStyle='#d8c090'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(0,-12,7,3,0,0,TAU); ctx.stroke(); } ctx.restore();
  if(!d&&m3pAt('m_ferry',1)&&Math.sin(t*4)>0.4){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=`800 12px ${UIF}`; ctx.textAlign='center'; ctx.fillText('!',P.x+16,P.y-46); } }
function m3pLine(x0,y0,x1,y1,t){ const mx=(x0+x1)/2, my=(y0+y1)/2+Math.min(60,dist(x0,y0,x1,y1)*0.06)+Math.sin(t*1.5)*3; ctx.strokeStyle='rgba(60,40,20,.55)'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo(mx,my,x1,y1); ctx.stroke(); ctx.strokeStyle='#d8c090'; ctx.lineWidth=2.2; ctx.stroke(); }
function m3pFerryLines(t){
  if(!G.quests.m_ferry) return;
  const pts=[[M3P_FERRYPOST[0],M3P_FERRYPOST[1]-14]].concat(M3P_POSTS.map(P=>[P.x,P.y-22]),[[M3P_GATE[0],M3P_GATE[1]-10]]);
  for(let i=0;i<3;i++){ if(!G.flags['m_post'+(i+1)]) continue; const a=i===0?pts[0]:pts[i], b=pts[i+1], c=pts[i+2];
    if(i===0&&(inView(a[0],a[1],600)||inView(b[0],b[1],600))) m3pLine(a[0],a[1],b[0],b[1],t);
    if(inView(b[0],b[1],700)||inView(c[0],c[1],700)) m3pLine(b[0],b[1],c[0],c[1],t); }
}
function m3pDrawFerry(o){ const t=G.time, x=o.x, y=o.y; ctx.save();
  ctx.fillStyle='#6a4a2a'; ctx.fillRect(x-3,y-34,6,34); m3pStroke(1.6); ctx.fillStyle='#e8c03a'; ctx.beginPath(); ctx.moveTo(x+3,y-34); ctx.lineTo(x+18,y-29); ctx.lineTo(x+3,y-24); ctx.fill(); m3pStroke(1.2);
  if(m3pQ('m_ferry')){ const bx=x+40, by=y+24+Math.sin(t*1.8)*1.5; ctx.fillStyle='#a8784a'; ctx.beginPath(); ctx.rect(bx-26,by-12,52,24); ctx.fill(); m3pStroke(2); ctx.strokeStyle='rgba(80,50,20,.6)'; ctx.lineWidth=1.2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(bx+i*10,by-12); ctx.lineTo(bx+i*10,by+12); ctx.stroke(); }
    for(const [dx,dy] of [[-12,-3],[8,2]]){ ctx.fillStyle='#fbf6ee'; ctx.beginPath(); ctx.ellipse(bx+dx,by+dy,5,4,0,0,TAU); ctx.fill(); m3pStroke(1.1); ctx.fillStyle='#e84a3a'; ctx.beginPath(); ctx.arc(bx+dx+3,by+dy-4,1.6,0,TAU); ctx.fill(); ctx.fillStyle='#f0b030'; ctx.beginPath(); ctx.moveTo(bx+dx+5,by+dy-2); ctx.lineTo(bx+dx+8,by+dy-1); ctx.lineTo(bx+dx+5,by+dy); ctx.fill(); } }
  ctx.restore(); }
// --- the cracked rocks under Palmcrest (P4K kind: faint from above, bright for a diver)
function m3pDrawRock(o,t,bright){ if(G.flags['m_rock'+o.R.i]) return; const x=o.x, y=o.y; ctx.save(); ctx.globalAlpha=bright?1:0.4;
  ctx.fillStyle=bright?'#6a7a8a':'#2a4a5a'; ctx.beginPath(); ctx.moveTo(x-26,y+10); ctx.lineTo(x-20,y-14); ctx.lineTo(x-4,y-22); ctx.lineTo(x+16,y-16); ctx.lineTo(x+26,y+2); ctx.lineTo(x+14,y+14); ctx.lineTo(x-12,y+16); ctx.closePath(); ctx.fill(); m3pStroke(2.2);
  if(bright){ ctx.strokeStyle=`rgba(180,230,255,${0.6+0.3*Math.sin(t*4+o.R.i)})`; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(x-6,y-18); ctx.lineTo(x+2,y-4); ctx.lineTo(x-4,y+6); ctx.moveTo(x+2,y-4); ctx.lineTo(x+14,y-2); ctx.stroke(); }
  ctx.restore(); }
if(typeof P4K!=='undefined'){
  P4K.m3p_rock={clr:30,ground(o,t){ m3pDrawRock(o,t,false); },under(o,t){ m3pDrawRock(o,t,true); }};
  P4K.m3p_fish={clr:0,ground(o,t){ const F=o.fish; if(!F||!F.on) return; glowAt(F.x,F.y,44,'210,225,255',0.18+0.08*Math.sin(t*3)); },under(o,t){ const F=o.fish; if(!F||!F.on) return; m3pDrawFish(F.x,F.y,F.face,t); }};
}
function m3pDrawFish(x,y,f,t){ ctx.save(); glowAt(x,y,60,'215,228,255',0.45); ctx.translate(x,y); ctx.rotate(f); const sw=Math.sin(t*9)*0.3;
  ctx.fillStyle='#e8f0ff'; ctx.beginPath(); ctx.ellipse(0,0,22,11,0,0,TAU); ctx.fill(); m3pStroke(2);
  ctx.save(); ctx.translate(-20,0); ctx.rotate(sw); ctx.fillStyle='#c8d4ff'; ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(-12,-10); ctx.lineTo(-9,0); ctx.lineTo(-12,10); ctx.closePath(); ctx.fill(); m3pStroke(1.6); ctx.restore();
  ctx.fillStyle='#c8d4ff'; ctx.beginPath(); ctx.moveTo(-4,-9); ctx.quadraticCurveTo(4,-17,10,-9); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(12,-2,3.4,0,TAU); ctx.fill(); ctx.fillStyle='#1a2040'; ctx.beginPath(); ctx.arc(12.6,-2,1.6,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(140,160,220,.7)'; ctx.lineWidth=1; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(-2+i*6,0,7,-0.9,0.9); ctx.stroke(); }
  ctx.restore(); }
// --- Gilly's fishing raft, and the glowing ring under it
function m3pDrawRaft(o){ const t=G.time, on=m3pGillyOut(); if(!on) return; const x=M3P_RAFT[0], y=M3P_RAFT[1]+Math.sin(t*1.6)*1.5;
  if(!G.flags.m_moonfish_caught){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(200,220,255,${0.25+0.15*Math.sin(t*3)})`; ctx.lineWidth=4; ctx.beginPath(); ctx.ellipse(M3P_RING[0],M3P_RING[1],80,40,0,0,TAU); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.fillStyle='#b8885a'; ctx.beginPath(); ctx.rect(x-34,y-10,68,30); ctx.fill(); m3pStroke(2.2); ctx.strokeStyle='rgba(80,50,20,.55)'; ctx.lineWidth=1.2; for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(x+i*10,y-10); ctx.lineTo(x+i*10,y+20); ctx.stroke(); }
  ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+22,y-6); ctx.quadraticCurveTo(x+30,y-60,x,y-92); ctx.stroke(); ctx.strokeStyle='rgba(240,240,240,.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,y-92); ctx.lineTo(M3P_RING[0],M3P_RING[1]); ctx.stroke();
  ctx.fillStyle='#3a6a8a'; ctx.fillRect(x-26,y-4,14,10); m3pStroke(1.2); ctx.restore(); }
// --- the Coral Race: rings, Rocket swimming, the sunken masts
function m3pDrawRing(x,y,next,done,t,n){ ctx.save(); const a=done?0.25:next?0.75+0.25*Math.sin(t*6):0.5;
  ctx.globalAlpha=a; ctx.strokeStyle=done?'#9ab0c0':next?'#ffe080':'#bfeaff'; ctx.lineWidth=next?6:4; ctx.beginPath(); ctx.ellipse(x,y,46,22,0,0,TAU); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(x,y-2,40,18,0,Math.PI,TAU); ctx.stroke();
  if(next){ glowAt(x,y,60,'255,230,140',0.2); } if(n&&!done){ ctx.globalAlpha=1; ctx.fillStyle='#fff'; ctx.font=`800 13px ${UIF}`; ctx.textAlign='center'; ctx.fillText(String(n),x,y-26); }
  ctx.restore(); }
function m3pDrawSwimmer(x,y,a,t,tail,hair){ ctx.save(); ctx.translate(x,y); ctx.fillStyle='rgba(235,248,255,.6)'; ctx.beginPath(); ctx.ellipse(-16*Math.cos(a),-16*Math.sin(a),18,6,a,0,TAU); ctx.fill();
  ctx.rotate(a); const sw=Math.sin(t*10)*0.35;
  ctx.save(); ctx.translate(-8,0); ctx.rotate(sw); ctx.fillStyle=tail; ctx.beginPath(); ctx.moveTo(0,-5); ctx.quadraticCurveTo(-10,-4,-16,0); ctx.quadraticCurveTo(-10,4,0,5); ctx.fill(); m3pStroke(1.4);
  ctx.fillStyle=shd(tail,0.25); ctx.beginPath(); ctx.moveTo(-15,0); ctx.lineTo(-24,-7); ctx.lineTo(-21,0); ctx.lineTo(-24,7); ctx.closePath(); ctx.fill(); m3pStroke(1.2); ctx.restore();
  ctx.fillStyle='#e8a030'; ctx.beginPath(); ctx.ellipse(0,0,9,6,0,0,TAU); ctx.fill(); m3pStroke(1.6);
  ctx.fillStyle='#a0d8c8'; ctx.beginPath(); ctx.arc(9,0,5.4,0,TAU); ctx.fill(); m3pStroke(1.4); ctx.fillStyle=hair; for(const dy of [-3,0,3]){ ctx.beginPath(); ctx.moveTo(6,dy-2); ctx.lineTo(1,dy); ctx.lineTo(6,dy+2); ctx.fill(); }
  ctx.restore(); }
function m3pDrawMast(o){ const x=o.x, y=o.y; ctx.save(); ctx.fillStyle='rgba(20,60,90,.35)'; ctx.beginPath(); ctx.ellipse(x,y+4,18,6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#6a4a2a'; ctx.fillRect(x-4,y-50,8,52); m3pStroke(1.8); ctx.fillRect(x-20,y-38,40,5); m3pStroke(1.4);
  ctx.fillStyle='rgba(230,220,190,.85)'; ctx.beginPath(); ctx.moveTo(x-18,y-33); ctx.lineTo(x+2,y-33); ctx.lineTo(x-10,y-12); ctx.closePath(); ctx.fill(); m3pStroke(1.2); ctx.restore(); }
// --- Old Ned's lighthouse: oil lamps, the moths, the great lamp (and, for the stand-in world, the tower itself)
function m3pDrawLH(t){
  const x=M3P_LH.x, y=M3P_LH.y, lit=!!G.flags.m_lighthouse_lit;
  if(M3P_STAND){ ctx.save(); m3pShadow(x+10,y+90,46,12); ctx.fillStyle='#efe6d6'; ctx.beginPath(); ctx.moveTo(x-34,y+86); ctx.lineTo(x-24,y-6); ctx.lineTo(x+24,y-6); ctx.lineTo(x+34,y+86); ctx.closePath(); ctx.fill(); m3pStroke(2.6);
    ctx.fillStyle='#c84a3a'; for(const yy of [y+10,y+46]){ ctx.beginPath(); ctx.moveTo(x-28,yy); ctx.lineTo(x+28,yy); ctx.lineTo(x+30,yy+16); ctx.lineTo(x-30,yy+16); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  ctx.save();
  ctx.fillStyle='#3a4a5a'; ctx.beginPath(); ctx.ellipse(x,y+2,44,30,0,0,TAU); ctx.fill(); m3pStroke(2.2);
  ctx.fillStyle=lit?'#f4f8ff':'#8a96a8'; ctx.beginPath(); ctx.arc(M3P_LH.lamp[0],M3P_LH.lamp[1],12,0,TAU); ctx.fill(); m3pStroke(2);
  if(lit) glowAt(M3P_LH.lamp[0],M3P_LH.lamp[1],70,'215,228,255',0.5+0.1*Math.sin(t*2));
  for(const o of M3P_OIL){ const on=!!G.flags['m_oil'+o.i]; ctx.fillStyle=on?'#ffe4a0':'#6a5a4a'; ctx.beginPath(); ctx.arc(o.x,o.y,4,0,TAU); ctx.fill(); m3pStroke(1.2); if(on) glowAt(o.x,o.y,14,'255,210,120',0.4); }
  if(m3pOn('m_lighthouse')&&!lit||!G.quests.m_lighthouse){ for(const o of M3P_OIL){ const on=!!G.flags['m_oil'+o.i], a=t*2.2+o.i*1.05, cx=on?o.x+Math.cos(a*2)*5:M3P_LH.lamp[0]+Math.cos(a)*12, cy=on?o.y-6+Math.sin(a*2)*3:M3P_LH.lamp[1]+Math.sin(a)*8; m3pMoth(cx,cy,Math.sin(t*14+o.i)); } }
  ctx.restore();
}
function m3pMoth(x,y,fl){ ctx.fillStyle='#d8d0e8'; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(x+s*3,y,3.2,2+fl*0.8,s*0.4,0,TAU); ctx.fill(); } ctx.fillStyle='#4a3e5e'; ctx.beginPath(); ctx.ellipse(x,y,1.2,2.4,0,0,TAU); ctx.fill(); }
// the beam at night, once the great lamp shines (a slow silver sweep over the Sunken Isles)
function m3pBeam(){ if(AREA||curMap()!==3||!G.flags.m_lighthouse_lit) return; const nk=1-daylight(); if(nk<0.2) return; const x=M3P_LH.lamp[0], y=M3P_LH.lamp[1], a=G.time*0.35;
  if(!inView(x,y,2400)) return;
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.12*nk; ctx.fillStyle='#dfe8ff'; ctx.beginPath(); ctx.moveTo(x,y); ctx.arc(x,y,2200,a-0.08,a+0.08); ctx.closePath(); ctx.fill();
  ctx.globalAlpha=0.08*nk; ctx.beginPath(); ctx.moveTo(x,y); ctx.arc(x,y,2200,a+Math.PI-0.08,a+Math.PI+0.08); ctx.closePath(); ctx.fill(); ctx.restore(); }
// --- Old Kiln's furnace (the stand-in draws the furnace; the real map draws its own, and we add the silver)
function m3pDrawFurnace(t){ const x=M3P_FURN[0], y=M3P_FURN[1], silver=!!G.flags.m_glaive_temper&&!m3pQ('m_glaive');
  ctx.save(); if(M3P_STAND){ m3pShadow(x,y+18,34,10); ctx.fillStyle='#a8583a'; ctx.beginPath(); ctx.ellipse(x,y,30,24,0,Math.PI,TAU); ctx.lineTo(x+30,y+16); ctx.lineTo(x-30,y+16); ctx.closePath(); ctx.fill(); m3pStroke(2.4);
    ctx.fillStyle='#7a3a2a'; ctx.fillRect(x+12,y-38,10,22); m3pStroke(1.6); }
  ctx.fillStyle=silver?'#eef4ff':'#ffb050'; ctx.beginPath(); ctx.ellipse(x,y+4,12,10,0,Math.PI,TAU); ctx.lineTo(x+12,y+14); ctx.lineTo(x-12,y+14); ctx.closePath(); ctx.fill();
  glowAt(x,y,40,silver?'215,228,255':'255,170,80',0.35+0.08*Math.sin(t*7)); ctx.restore(); }
// --- the Moth Knight posts (Vesper's job): a tall violet knight with a lantern-eye, his gaze, his lamp, the bombs
function m3pDrawSentry(s,t){
  const st=m3pSentFace(s), on=m3pAt('m_vesper',1)&&m3pVesperOn(), E=m3pEasy(), R=E?140:175, half=E?0.42:0.55;
  ctx.save();
  if(on){ ctx.globalAlpha=0.16; ctx.fillStyle=st.cd>0?'#ff6060':'#ffe890'; ctx.beginPath(); ctx.moveTo(s.x,s.y-10); ctx.arc(s.x,s.y-10,R,st.a-half,st.a+half); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1; }
  m3pShadow(s.x,s.y+2,12,5); const f=st.a;
  ctx.fillStyle='#4a3e6a'; ctx.beginPath(); ctx.ellipse(s.x,s.y-14,10,16,0,0,TAU); ctx.fill(); m3pStroke(2);
  ctx.fillStyle='#6a5a8e'; for(const sd of [-1,1]){ ctx.beginPath(); ctx.ellipse(s.x+sd*11,s.y-16,6,15,sd*0.3,0,TAU); ctx.fill(); m3pStroke(1.4); }
  ctx.fillStyle='#8a8aa8'; ctx.beginPath(); ctx.arc(s.x,s.y-34,8,0,TAU); ctx.fill(); m3pStroke(1.8);
  ctx.strokeStyle='#d8c8f0'; ctx.lineWidth=1.6; for(const sd of [-1,1]){ ctx.beginPath(); ctx.moveTo(s.x+sd*3,s.y-41); ctx.quadraticCurveTo(s.x+sd*9,s.y-52,s.x+sd*14,s.y-54); ctx.stroke(); }
  ctx.fillStyle=st.cd>0?'#ff7a6a':'#ffe890'; ctx.beginPath(); ctx.arc(s.x+Math.cos(f)*4,s.y-34+Math.sin(f)*2,2.6,0,TAU); ctx.fill();
  ctx.strokeStyle='#6a5a3a'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(s.x+14,s.y+2); ctx.lineTo(s.x+14,s.y-44); ctx.stroke(); ctx.fillStyle='#c8c8d8'; ctx.beginPath(); ctx.moveTo(s.x+14,s.y-44); ctx.lineTo(s.x+22,s.y-38); ctx.lineTo(s.x+14,s.y-32); ctx.fill(); m3pStroke(1.2);
  if(G.flags['m_smoke'+s.i]){ ctx.fillStyle='#7a5aa8'; ctx.beginPath(); ctx.arc(s.x-14,s.y,5,0,TAU); ctx.fill(); m3pStroke(1.2); ctx.fillStyle='rgba(200,180,240,.5)'; ctx.beginPath(); ctx.arc(s.x-12,s.y-8+Math.sin(t*3)*2,4,0,TAU); ctx.fill(); }
  ctx.restore();
  m3pDrawLampAt(s.lamp[0],s.lamp[1],st.lit>0,false,t,0.9);
}
// --- Noodle, Queen Sandy, Glaciar napping, Duchess in her air bubble, the vault, Dell's signs
function m3pDrawWorm(x,y,face,t,k,col,crown,sleepy){
  ctx.save(); ctx.translate(x,y); ctx.scale(k,k);
  const n=6; for(let i=n-1;i>=0;i--){ const u=i/(n-1), wv=Math.sin(t*5-i*0.9)*3, bx=-Math.cos(face)*i*7+(-Math.sin(face))*wv, by=-Math.sin(face)*i*7+Math.cos(face)*wv*0.6, r=7-u*2.4;
    ctx.fillStyle=i%2?shd(col,-0.08):col; ctx.beginPath(); ctx.ellipse(bx,by-r*0.5,r,r*0.86,0,0,TAU); ctx.fill(); ctx.strokeStyle=M3P_INK; ctx.lineWidth=1.6/k; ctx.stroke(); }
  const hx=Math.cos(face)*3, hy=-6;
  ctx.fillStyle=shd(col,0.12); ctx.beginPath(); ctx.ellipse(hx,hy,8,7.4,0,0,TAU); ctx.fill(); ctx.strokeStyle=M3P_INK; ctx.lineWidth=1.8/k; ctx.stroke();
  for(const s of [-1,1]){ if(sleepy){ ctx.strokeStyle='#2a1808'; ctx.lineWidth=1.4/k; ctx.beginPath(); ctx.arc(hx+s*3.2,hy-1,2,0.2,Math.PI-0.2); ctx.stroke(); } else { ctx.fillStyle='#fff8e8'; ctx.beginPath(); ctx.arc(hx+s*3.2,hy-1.5,2.6,0,TAU); ctx.fill(); ctx.fillStyle='#2a1808'; ctx.beginPath(); ctx.arc(hx+s*3.2,hy-1.2,1.4,0,TAU); ctx.fill(); } }
  ctx.fillStyle='rgba(255,140,140,.5)'; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(hx+s*5.6,hy+2.6,1.8,1.1,0,0,TAU); ctx.fill(); }
  if(crown){ ctx.fillStyle='#e85a6a'; ctx.beginPath(); ctx.moveTo(hx-6,hy-6); ctx.lineTo(hx-3,hy-12); ctx.lineTo(hx,hy-7); ctx.lineTo(hx+3,hy-12); ctx.lineTo(hx+6,hy-6); ctx.closePath(); ctx.fill(); ctx.strokeStyle=M3P_INK; ctx.lineWidth=1.2/k; ctx.stroke(); }
  ctx.restore();
}
function m3pDrawNoodle(N,t){ if(m3pBurrowed()&&!AREA&&dist(N.x,N.y,player.x,player.y)<200){ ctx.save(); ctx.fillStyle='rgba(226,196,128,.95)'; ctx.beginPath(); ctx.ellipse(N.x,N.y,9,4,0,0,TAU); ctx.fill(); m3pStroke(1.2); ctx.restore(); return; }
  m3pShadow(N.x,N.y+2,12,4); m3pDrawWorm(N.x,N.y,N.face||0,t*(N.mv?1.6:0.6),1,'#f0c880',false,false); }
function m3pDrawSandy(n){ const t=G.time, x=n.x, y=n.y; ctx.save();
  for(const [dx,dy] of [[-28,26],[-10,34],[10,30],[26,22],[0,18]]){ ctx.fillStyle='#f6eedc'; ctx.beginPath(); ctx.ellipse(x+dx,y+dy,7,9,0,0,TAU); ctx.fill(); m3pStroke(1.4); }
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+20,86,30,0,0,TAU); ctx.fill();
  for(let i=0;i<14;i++){ const a=i/14*TAU*1.4+0.6, r=70-i*2.2, bx=x+Math.cos(a)*r, by=y+12+Math.sin(a)*r*0.42, rr=18-i*0.5+Math.sin(t*1.2+i)*0.6; ctx.fillStyle=i%2?'#d8a860':'#e8b870'; ctx.beginPath(); ctx.ellipse(bx,by-rr*0.4,rr,rr*0.8,0,0,TAU); ctx.fill(); m3pStroke(2); }
  m3pDrawWorm(x+46,y-26,Math.PI*0.9,t*0.3,3.4,'#e8b870',true,dist(player.x,player.y,x,y)>180);
  if(dist(player.x,player.y,x,y)>180){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=`800 ${12+Math.sin(t*2)*2}px ${UIF}`; ctx.textAlign='center'; ctx.fillText('z',x+80,y-80-((t*10)%20)); }
  ctx.restore(); }
function m3pDrawNap(n){ const t=G.time, x=n.x, y=n.y, near=dist(player.x,player.y,x,y)<200; ctx.save();
  m3pShadow(x,y+18,78,22);
  ctx.fillStyle='#bfe4ff'; ctx.beginPath(); ctx.moveTo(x-70,y+10); ctx.quadraticCurveTo(x-110,y+40,x-130,y+6); ctx.quadraticCurveTo(x-100,y+26,x-70,y-2); ctx.fill(); m3pStroke(2.4);
  ctx.beginPath(); ctx.ellipse(x,y,74,34+Math.sin(t*1.1)*2,0,0,TAU); ctx.fill(); m3pStroke(2.8);
  ctx.fillStyle='#e6f6ff'; ctx.beginPath(); ctx.ellipse(x+6,y+8,52,16,0,0,TAU); ctx.fill();
  ctx.fillStyle='#9ad0f0'; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(x-40+i*18,y-30); ctx.lineTo(x-34+i*18,y-48); ctx.lineTo(x-28+i*18,y-30); ctx.fill(); }
  const hx=x+74, hy=y-4; ctx.fillStyle='#bfe4ff'; ctx.beginPath(); ctx.ellipse(hx,hy,30,20,0.2,0,TAU); ctx.fill(); m3pStroke(2.4);
  ctx.strokeStyle='#f4fbff'; ctx.lineWidth=5; ctx.lineCap='round'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(hx-8,hy+s*12); ctx.quadraticCurveTo(hx-22,hy+s*26,hx-34,hy+s*30); ctx.stroke(); }
  if(near){ ctx.fillStyle='#7ad8ff'; ctx.beginPath(); ctx.ellipse(hx+10,hy-6,4,3,0,0,TAU); ctx.fill(); ctx.fillStyle='#160400'; ctx.beginPath(); ctx.ellipse(hx+10,hy-6,1.2,2.6,0,0,TAU); ctx.fill(); }
  else { ctx.strokeStyle='#3a6a9a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(hx+10,hy-6,4,0.2,Math.PI-0.2); ctx.stroke(); }
  ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(hx-4,hy-10); ctx.lineTo(hx-4,hy-60); ctx.stroke();
  ctx.fillStyle='rgba(240,232,210,.95)'; ctx.beginPath(); ctx.moveTo(hx-4,hy-60); ctx.quadraticCurveTo(hx+36,hy-46,hx+30,hy-14); ctx.lineTo(hx-4,hy-18); ctx.closePath(); ctx.fill(); m3pStroke(1.8);
  ctx.strokeStyle='#c84a3a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(hx,hy-40); ctx.lineTo(hx+28,hy-34); ctx.stroke();
  if(!near){ ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font=`800 14px ${UIF}`; ctx.textAlign='center'; ctx.fillText('z',hx+30,hy-62-((t*10)%24)); }
  ctx.restore(); n._t3top=y-70; }
function m3pDrawDuchess(t){ const d=M3P.duch; if(!d||!inView(d.x,d.y,80)) return; ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(d.x,d.y-10,56,'200,236,255',0.25); ctx.restore();
  d.t=t; if(T3.on&&T3B.goat) T3B.goat(d); else drawGoat(d);
  ctx.save(); ctx.strokeStyle='rgba(225,245,255,.7)'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.ellipse(d.x,d.y-12,40,34,0,0,TAU); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(d.x-14,d.y-30,8,Math.PI*1.1,Math.PI*1.6); ctx.stroke();
  ctx.fillStyle='#3a8a4a'; ctx.beginPath(); ctx.ellipse(d.x+12,d.y-4,6,2,0.4+Math.sin(t*6)*0.2,0,TAU); ctx.fill(); ctx.restore(); }
function m3pDrawVault(o,t){ const x=o.x, y=o.y, open=!!G.flags.m_vault_open; ctx.save();
  ctx.fillStyle=open?'#101828':'#a8b0c8'; ctx.beginPath(); ctx.arc(x,y-6,26,0,TAU); ctx.fill(); m3pStroke(2.6);
  if(!open){ ctx.strokeStyle='#e8ecff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y-6,15,0.5,TAU-0.5); ctx.stroke(); ctx.fillStyle='#e8ecff'; ctx.beginPath(); ctx.arc(x+5,y-6,9,0,TAU); ctx.fill(); ctx.fillStyle='#a8b0c8'; ctx.beginPath(); ctx.arc(x+9,y-8,8,0,TAU); ctx.fill();
    ctx.fillStyle='#dfe4f4'; for(const [dx,h] of [[-14,10],[-2,14],[12,8]]){ ctx.beginPath(); ctx.ellipse(x+dx,y+16+h*0.3,3,h*0.5,0,0,TAU); ctx.fill(); } glowAt(x,y-6,40,'220,230,255',0.15+0.05*Math.sin(t*2)); }
  else { ctx.fillStyle='#e8d0a0'; ctx.beginPath(); ctx.ellipse(x,y-2,10,6,0,0,TAU); ctx.fill(); m3pStroke(1.2); }
  ctx.restore(); }
function m3pDrawSign(o,show){ if(!show) return; const x=o.x, y=o.y; ctx.save(); m3pShadow(x,y+2,10,3); ctx.fillStyle='#6a4a2a'; ctx.fillRect(x-2,y-30,4,30); m3pStroke(1.4); ctx.fillStyle='#d8b880'; ctx.fillRect(x-20,y-44,40,20); m3pStroke(1.8);
  ctx.strokeStyle='rgba(60,40,20,.7)'; ctx.lineWidth=1.2; for(const yy of [y-38,y-33,y-28]){ ctx.beginPath(); ctx.moveTo(x-14,yy); ctx.lineTo(x+14,yy); ctx.stroke(); } ctx.restore(); }
// everything that is sorted with the figures (y order), outdoors and inside areas
function m3pForRender(list){
  if(!G||G.mode!=='story') return; const t=G.time;
  if(AREA){ if(M3P.duch) list.push({x:M3P.duch.x,y:M3P.duch.y,draw:()=>m3pDrawDuchess(t)});
    const N=M3P.noodle; if(N&&N.inside&&inView(N.x,N.y,60)) list.push({x:N.x,y:N.y,draw:()=>m3pDrawNoodle(N,t)}); return; }
  if(curMap()!==3) return;
  m3pLampItems(list,t);
  if(G.quests.m_ferry){ for(const P of M3P_POSTS) if(inView(P.x,P.y,80)) list.push({x:P.x,y:P.y,draw:()=>m3pDrawPost(P,t)});
    list.push({x:0,y:-1e9,draw:()=>m3pFerryLines(t)}); }
  if(inView(M3P_LH.x,M3P_LH.y,240)) list.push({x:M3P_LH.x,y:M3P_LH.y+(M3P_STAND?88:30),draw:()=>m3pDrawLH(t)});
  if(inView(M3P_FURN[0],M3P_FURN[1],120)&&(M3P_STAND||m3pOn('m_glaive'))) list.push({x:M3P_FURN[0],y:M3P_FURN[1]+16,draw:()=>m3pDrawFurnace(t)});
  if(m3pAt('m_vesper',1)&&m3pVesperOn()) for(const s of M3P_SENT) if(inView(s.x,s.y,240)) list.push({x:s.x,y:s.y,draw:()=>m3pDrawSentry(s,t)});
  const N=M3P.noodle; if(N&&!N.inside&&inView(N.x,N.y,60)) list.push({x:N.x,y:N.y,draw:()=>m3pDrawNoodle(N,t)});
}
function m3pOverlay(){ if(!G||G.mode!=='story'||AREA||curMap()!==3) return; m3pBeam(); }

// ---------- 16. Pebble's letters m_pb_1..4 and m_pb_oil (ACT4 6.14, THREADS 9.3), through the shared PEBBLE_MAIL
const m3pMoon=()=>typeof moonLeft==='function'?moonLeft():(G.flags.moon==null?100:G.flags.moon);
const M3P_MAIL=[
  {id:'m_pb_1',from:'quill',when:()=>m3pIV()&&m3pMoon()<=60,lines:[
    m3pL('quill',`Ash, I watched the eclipse from my roof. The moon is now sixty percent of a moon. I have written to the Eclipse Observatory, out of habit. Nobody has answered a letter there in years. Go and knock.`,`The moon is shrinking fast. Nobody answers at the Observatory. Go and knock!`),
    m3pL('quill',`P.S. My old teacher, Professor Lumley, was its last astronomer. If you find his spectacles, they are mine now. He said so. Professor Quill.`,`P.S. If you find Professor Lumley's glasses, they're mine. Quill.`)]},
  {id:'m_pb_2',from:'fennick',when:()=>m3pIV()&&m3pMoon()<=40,lines:[
    {who:'fennick',text:S(`Every lantern in Emberhollow is lit, every night, all night. Nobody here is scared of the dark. Not while I've got oil. Your friend, Fennick.`,`I keep every lantern lit. Nobody is scared. Fennick.`),skipIf:()=>G.choices.fennick==='jail'},
    {who:'fennick',text:S(`The Watch House is the brightest place in Brindlecross. I polish. It's what I'm for now. Fennick.`,`The Watch House shines. I polish. Fennick.`),skipIf:()=>G.choices.fennick!=='jail'}]},
  {id:'m_pb_3',from:'maren',when:()=>!!G.flags.m_eclipse2,then:()=>{ if(!G.flags.m_dell_away&&!m3pR('m_reforge')){ G.flags.m_dell_away=1; M3P.sig=''; } },lines:[
    m3pL('maren',`Ash. You'll have all three pieces of that Heart soon, and it will need a smith.`,`You'll have all three pieces soon. The Heart will need a smith.`),
    m3pL('maren',`So I'm coming. Dell is sailing back to fetch me. Don't argue. You can't, it's a letter.`,`So I'm coming. Dell will fetch me. Don't argue.`),
    m3pL('maren',`He'll bring me round to the old pier at the foot of the Heights, on the far side of Moonfall. I'll find you. Eat something. Love, Mom.`,`I'll come to the old pier by the Heights. I'll find you. Eat something. Love, Mom.`),
    m3pIf(()=>!!G.flags.dr_m_moth,'maren',`P.S. Pebble says you were saying "Nyx" in your sleep. A new friend? Bring them for dinner. Unless they eat moons.`,`P.S. You said "Nyx" in your sleep. A new friend? Unless they eat moons.`),
    m3pN(`Far away in Driftwood, the Soggy Biscuit Three toots twice and steams off west.`,`Far away, Dell's boat toots twice and sails west.`),
    m3pDo(()=>{ if(!G.flags.m_dell_away&&!m3pR('m_reforge')){ G.flags.m_dell_away=1; M3P.sig=''; } })]},
  {id:'m_pb_4',from:'yara',when:()=>m3pIV()&&m3pMoon()<=40&&!!G.flags.m_pb_2,lines:[
    m3pL('yara',`I counted the moon tonight. Less than half. Pebble sat on my windowsill and stared at it all night. She wouldn't eat a thing, except one coin.`,`Less than half a moon. Pebble stared at it all night. She ate one coin.`)]},
  // the fallback bombs (ACT4 6.5): no Blast Bombs when the Sunken Gate opens? Mags sends some (Pebble carries the parcel)
  {id:'m_pb_bombs',from:'f_mags',coin:0,when:()=>m3pIV()&&m3pR('m_reef')&&!(G.weapons&&G.weapons.bombs),then:()=>{ if(!(G.weapons&&G.weapons.bombs)) giveWeapon('bombs'); },lines:[
    m3pN(`Pebble drops a lumpy parcel on your head. It ticks.`,`Pebble drops a parcel on you. It ticks.`),
    m3pL('f_mags',`(a note on the parcel) No bombs? NO BOMBS? Here. Take these. Don't thank me. Thank me a little. A pufferfish hates a bomb. Mags.`,`No bombs? Here! Thank me a little. Pufferfish hate bombs. Mags.`)]},
  {id:'m_pb_oil',from:'fennick',when:()=>m3pQ('m_lamps'),gift:{items:{m_lampoil:1}},lines:[
    {who:'fennick',text:S(`(a letter) Fennick Wick here, lamp man of Emberhollow. Yara says you need lamps that never go out. I spent my whole life making this oil. Use it for something good. That is all I ever wanted. F.`,`Fennick here. Yara says you need lamps that never go out. Here is my best oil. Use it well. F.`),skipIf:()=>G.choices.fennick==='jail'},
    {who:'osric',text:S(`(a letter) Captain Osric here. We found this in Fennick Wick's old shop. He says it is lamp oil that never runs out. He says please use it. He also says sorry. Again. O.`,`Captain Osric here. This is Fennick's oil. It never runs out. He says sorry. Again. O.`),skipIf:()=>G.choices.fennick!=='jail'},
    m3pN(`Wrapped in the letter: a small stone bottle. The oil inside glows faintly gold. (The lamplighters' lamps will burn twice as long.)`,`A little bottle of glowing oil. The lamplighters' lamps will burn twice as long.`)]}
];
M3P.mailShared=false;
function m3pMail(){
  if(M3P.mailShared) return;
  try{ if(typeof pebbleLetter==='function'){ for(const m of M3P_MAIL) if(!PEBBLE_MAIL.some(q=>q&&q.id===m.id)) pebbleLetter(m.id,m); M3P.mailShared=true; }
    else if(typeof PEBBLE_MAIL!=='undefined'&&PEBBLE_MAIL&&PEBBLE_MAIL.push){ for(const m of M3P_MAIL) if(!PEBBLE_MAIL.some(q=>q&&q.id===m.id)) PEBBLE_MAIL.push(m); M3P.mailShared=true; } }catch(e){ console.error(e); }
}
m3pMail();
// ---------- 17. Tamsin's Act IV verse, the epilogue lines (EPI.m), Duchess (above), the journal
if(typeof tamsinVerse==='function') tamsinVerse(()=>!!G.flags.m_done,S(`\u{1F3B5} A moth ate the moon, oh, a bite at a time, so Ash dove and dug and made moonfire shine...`,`\u{1F3B5} A moth ate the moon. Ash made moonfire shine...`));
else if(typeof EV_TAMSIN!=='undefined') EV_TAMSIN.push([()=>!!G.flags.m_done,S(`\u{1F3B5} A moth ate the moon, oh, a bite at a time, so Ash dove and dug and made moonfire shine...`,`\u{1F3B5} A moth ate the moon. Ash made moonfire shine...`)]);
const M3P_EPI=[
  {pri:6,cond:()=>m3pQ('m_race'),line:['narr',S(`Rocket still says he's the fastest swimmer in Coralcombe. Second fastest is a dragon. Third is a squid named Pickles.`,`Rocket is the fastest swimmer. Second is Ash.`)]},
  {pri:6,cond:()=>m3pQ('m_glaive'),line:['narr',S(`Old Kiln never made another glaive. He said one piece of the moon is enough for anybody. He made glass shoes instead. Nobody bought them.`,`Old Kiln made glass shoes. Nobody bought them.`)]},
  {pri:5,cond:()=>m3pQ('m_lighthouse'),line:['narr',S(`Old Ned's lighthouse shines silver every night. Squint shouts LAND HO at it. It's always there.`,`The lighthouse shines every night. Squint shouts LAND HO.`)]},
  {pri:5,cond:()=>m3pQ('m_noodle'),line:['narr',S(`Noodle grew up to be the biggest sandworm in the Glass Desert. He still eats shoes. Dusty and Dune have stopped wearing them.`,`Noodle grew huge. He still eats shoes.`)]},
  {pri:4,cond:()=>m3pQ('m_moonfish'),line:['narr',S(`Cook Gilly never cooked the Moonfish. She painted it on the Floating Kitchen's sign instead. It is the only thing in Driftwood that doesn't taste of fish.`,`Gilly painted the Moonfish on her sign.`)]},
  {pri:4,cond:()=>m3pQ('m_ferry'),line:['narr',S(`Rowan's ferry runs every day now, Driftwood to the Strand. The chickens ride for free.`,`The ferry runs every day. Chickens ride free.`)]},
  {pri:3,cond:()=>m3pQ('m_lamps'),line:['narr',S(`Sable's lamps never went out again. Esme named a new one after Ash's mom. It is very warm and a little bit bossy.`,`Esme named a lamp after Mom. It is warm and bossy.`)]},
  {pri:3,cond:()=>m3pQ('m_leash'),line:['narr',S(`Sister Wren and Elder Ripple wrote a book together about the Book of Moths. They disagreed on every page. It is a very long book.`,`Wren and Ripple wrote a very long book together.`)]},
  {pri:2,cond:()=>m3pQ('m_tidebombs'),line:['narr',S(`Mags Sprocket opened a shop on the Driftwood dock: Tide Bombs, Tide Bomb repairs, and sandwiches. Mostly sandwiches.`,`Mags sells Tide Bombs. And sandwiches.`)]}
];
function m3pEpiPush(){ if(M3P.epi) return; try{ if(typeof EPI!=='undefined'&&EPI){ EPI.m=EPI.m||[]; for(const e of M3P_EPI) EPI.m.push(e); M3P.epi=true; } }catch(e){} }
m3pEpiPush();
if(typeof DREAM_TALK!=='undefined'){ DREAM_TALK.m_moth=Object.assign(DREAM_TALK.m_moth||{},{m_winnie:S(`You dreamed of a little grey moth on a lantern? Ollie dreams of crabs, I think. His arms twitch. Sit down and tell me the rest of yours.`,`A little grey moth on a lantern? Sit. Tell me the rest.`)});
  DREAM_TALK.m_eclipse=Object.assign(DREAM_TALK.m_eclipse||{},{m_esme:S(`A dream of a lantern and a moth? Moths dream of lamps, I think. And lamps, if they dream, dream of somebody coming home.`,`Lamps dream of somebody coming home.`)}); }

// ---------- 18. debug hooks for tests (window.__ebX.m3p, also __eb.m3p)
window.__ebX=Object.assign(window.__ebX||{},{m3p:{
  M3P, cast:()=>M3P_CAST.map(c=>c.id), lamps:()=>M3P_LAMPS.map(L=>({i:L.i,name:L.name,kind:L.kind,x:L.x,y:L.y,lit:m3pLampLit(L.i),flag:!!G.flags['m_lamp_'+L.i]})),
  lm:id=>{ const o=LANDMARKS.find(q=>q.id===id); return o?{x:Math.round(o.x),y:Math.round(o.y),hidden:o.hidden?!!o.hidden():false,prompt:o.prompt||null}:null; },
  npc:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); return n?{x:Math.round(n.x),y:Math.round(n.y),draw:!!n.draw}:null; },
  npcs:()=>(AREA?AREA.npcs:G.npcs).filter(n=>M3P_CAST.some(c=>c.id===n.id)||m3pVisit()[n.id]).map(n=>({id:n.id,x:Math.round(n.x),y:Math.round(n.y)})),
  visit:()=>m3pVisit(), sig:()=>m3pSig(), sync:()=>{ M3P.sig=''; M3P.visC=null; setupNPCs(); return m3pSig(); }, talkHub:n=>{ talkHub(n); return true; }, zoom:z=>{ if(z){ zoom=z; ZOOM0=z; } return zoom; }, chars:v=>{ if(v) T3.on=v!=='classic'; return T3.on?'3d':'classic'; }, roomSpot:(k,fx,fy)=>m3pRoomSpot(AREA,AREA.rooms[k],fx,fy), roomCell:(k,x,y)=>m3pRoomCell(AREA,AREA.rooms[k],x,y),
  talk:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n) return false; talkTo(n); return true; },
  step:id=>{ const q=G.quests[id]; return q?{step:q.step,done:!!q.done,text:stepText(id)}:null; },
  dlg:()=>DLG?{who:$('#dlgWho').textContent,text:DLG.text,opts:DLG.opts?DLG.opts.map(o=>simplify(String(typeof o.t==='function'?o.t():o.t))):null,scene}:{scene},
  play:(picks,max)=>{ const said=[], used=new Set(); picks=picks||[]; let n=0;
    while(n<(max||300)){ n++;
      if(scene==='upgrade'&&typeof chooseUpgrade==='function'){ chooseUpgrade(0); continue; }
      if(!DLG) break;
      if(DLG.text) said.push([$('#dlgWho').textContent,DLG.text]);
      if(DLG.opts){ const lab=DLG.opts.map(o=>simplify(String(typeof o.t==='function'?o.t():o.t))); let i=-1; for(const p of picks){ if(p==='last'){ i=lab.length-1; break; } if(used.has(p)) continue; i=lab.findIndex(l=>l.toLowerCase().includes(String(p).toLowerCase())); if(i>=0){ used.add(p); break; } } if(i<0) i=lab.findIndex(l=>/^(Goodbye|Bye|Never mind|Just looking|Not right now|Nothing|Not now|Later|Not yet)/i.test(l)); if(i<0) i=0; said.push(['>',lab[i]]); DLG.chars=1e9; chooseOpt(i); }
      else { DLG.chars=1e9; advanceDialogue(); } }
    return said; },
  go:id=>{ const c=CASTBY[id]||SPECIAL[id]; const V=m3pVisit();
    const here=AREA&&AREA.npcs.find(q=>q.id===id); if(here){ player.x=here.x; player.y=here.y+50; return {x:Math.round(here.x),y:Math.round(here.y)}; }
    if((c&&c.inside&&c.inside!=='ev'&&!Array.isArray(V[id]))||V[id]==='coral'){ const area=V[id]==='coral'?'m_coralcombe':c.inside; if(!AREA||AREA.id!==area){ if(AREA) exitArea(true); enterArea(area,DOORS.find(q=>q.area===area)||{x:1900,y:67600,outY:40}); } }
    else if(AREA) exitArea(true);
    const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n) return null; player.x=n.x; player.y=n.y+(AREA?50:40); return {x:Math.round(n.x),y:Math.round(n.y)}; },
  say:(id,picks)=>{ const n=window.__ebX.m3p.go(id); if(!n) return null; const q=(AREA?AREA.npcs:G.npcs).find(z=>z.id===id); talkTo(q); return window.__ebX.m3p.play(picks); },
  mini:()=>G.mini?{kind:G.mini.kind,i:G.mini.i,t:+(G.mini.t||0).toFixed(1),rs:G.mini.rs?G.mini.rs.map(r=>[Math.round(r.x),Math.round(r.y)]):null,sx:G.mini.sx,sy:G.mini.sy,fishing:!!G.fishing,bite:G.fishing?G.fishing.bite:0}:null,
  fish:()=>M3P.fish?{x:Math.round(M3P.fish.x),y:Math.round(M3P.fish.y),push:M3P.fish.push,mode:M3P.fish.mode,on:M3P.fish.on}:null,
  noodle:()=>M3P.noodle?{x:Math.round(M3P.noodle.x),y:Math.round(M3P.noodle.y),state:M3P.noodle.state,inside:M3P.noodle.inside}:null,
  sent:()=>M3P_SENT.map(s=>{ const st=m3pSentFace(s); return {i:s.i,x:s.x,y:s.y,a:+st.a.toFixed(2),lit:+st.lit.toFixed(1),cd:+st.cd.toFixed(1),bomb:!!G.flags['m_smoke'+s.i],lamp:s.lamp}; }),
  // simulate a breath at a spot for `secs`: fire (blue for the Blaze jet) through the real breath hook, or Moonfire arcs
  fireAt:(x,y,secs,blue)=>{ const a=angTo(player.x,player.y,x,y); player.facing=a; for(let t=0;t<(secs||1);t+=1/30){ if(blue&&typeof P3!=='undefined') P3.jetOn=true; try{ breathIgnite(player.x,player.y,a,1/30); } finally { if(typeof P3!=='undefined') P3.jetOn=false; } } return true; },
  moonAt:(x,y,secs)=>{ if(typeof P4==='undefined') return false; const a=angTo(player.x,player.y,x,y), keep=P4.arcs.slice(); player.facing=a; for(let t=0;t<(secs||1);t+=1/30){ P4.arcs=[{x:player.x,y:player.y,ang:a,R:175,half:0.45}]; m3pMoonTick(1/30); } P4.arcs=keep; return true; },
  pound:(x,y)=>{ m3pPound({x,y,R:92}); return true; }, blast:(x,y)=>{ m3pBlast(x,y); return true; },
  frame:dt=>m3pFrame(dt||1/30), tick:(sec)=>{ for(let t=0;t<(sec||1);t+=1/30) m3pFrame(1/30); return true; },
  prompt:()=>G.prompt?G.prompt.text:null, use:()=>{ if(G.prompt){ const p=G.prompt; G.prompt=null; p.act(); return true; } return false; },
  lmAct:id=>{ const o=LANDMARKS.find(q=>q.id===id); if(!o) return false; lmAct(o); return true; },
  objAct:k=>{ const o=AREA&&AREA.objs.find(q=>q.k===k||q.id===k); if(!o) return false; areaObjAct(o); return true; },
  rooms:()=>AREA&&AREA.rooms?Object.keys(AREA.rooms).map(k=>{ const R=AREA.rooms[k]; return {k,kind:R.kind,cx:Math.round(R.cx),cy:Math.round(R.cy),x0:Math.round(R.x0),y0:Math.round(R.y0),x1:Math.round(R.x1),y1:Math.round(R.y1)}; }):null,
  vault:()=>m3pVaultOpen(), duchess:()=>m3pDuchessMeet(), noodleHome:()=>m3pNoodleHome(), mail:()=>M3P_MAIL.map(m=>[m.id,!!G.flags[m.id],!!m.when()]), mailShared:()=>M3P.mailShared,
  epi:()=>M3P_EPI.filter(e=>{ try{ return e.cond(); }catch(err){ return false; } }).map(e=>e.line[1]), stages:()=>M3P_STAGES.map(s=>[s,stageAt(s)]),
  reading:v=>setReading(v), simple:t=>simplify(t), stand:M3P_STAND, tailOf:id=>m3pTailOf({id}),
  choose:i=>{ if(DLG){ DLG.chars=1e9; chooseOpt(i); } }, next:()=>{ if(DLG){ DLG.chars=1e9; advanceDialogue(); } },
  mode:m=>{ if(typeof P4!=='undefined'){ P4.mode=m||null; if(!m) P4.swim=false; } return true; }, catchFish:()=>{ catchFish(); return true; },
  inside:id=>{ const c=CASTBY[id]||SPECIAL[id]; return c&&c.inside||null; },
  enter:id=>{ if(AREA) exitArea(true); enterArea(id,DOORS.find(q=>q.area===id)||{x:player.x,y:player.y,outY:40}); return AREA?AREA.id:null; }
}});
if(window.__eb) window.__eb.m3p=window.__ebX.m3p;
