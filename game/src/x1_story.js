
// ================= Act II main story: The Masked Thief (x1_story)
// The eight Act II stages after the heist (c_coast, c_gear, c_salt, c_claws, c_brass, c_light, c_spire, c_snow), every
// main-story scene and talk of bible/ACT2.md section 4, the dungeon story lines of section 5 (played by the dungeon
// helpers by key), Vesper the Moth Mask (a SPECIAL person placed by story code), her trust (G.flags.c_trust, 0 to 7),
// the rooftop chase (MINI.c_roofchase), two small areas (c_tidehouse, the Tide Clock's three rooms, and c_mothnest,
// the bell loft of the Great Clock), the world-state flags the terrain reads (c_lowtide, c_clock_on, c_spire_up,
// c_snow), the Spire confrontation (G.choices.c_vesper 'friend' or 'foe'), Shard 1, Nyxara's first words, the first
// bite of the moon and endAct(2). Everything is a wrapper or a registry entry: no engine file is edited.
// Contract for the other Act II helpers: scratchpad/C1STORY.md (stages, flags, STORY keys, the calls to make).
// Lines are [speaker, S(full, simple)]; Pip is "he"; no em dash anywhere.

// ---------- 0. small helpers
const C1ST={cam:null,glide:null,sight:null,trustSeen:null,q:[],boss:null,lights:[],silk:null,goat:null,fallen:0,dbg:{}};
const c1Easy=()=>!!(G&&G.diff&&G.diff.name==='Easy');
const c1Hard=()=>!!(G&&G.diff&&G.diff.name==='Hard');
const c1On=()=>!!G&&G.mode==='story'&&!G.done&&actOf(G.stage)===2;
const c1Out=()=>!AREA&&curMap()===1;
// once-only scenes: every main script starts with a silent mark, so a scene played by any route (a dungeon's own
// story hook, a fallback, a debug call) is never played twice
function c1Seen(k){ const s=G&&G.flags&&G.flags.c_sn; return !!(s&&s[k]); }
function c1sMark(k){ if(!G||!G.flags) return; (G.flags.c_sn=G.flags.c_sn||{})[k]=1; }
function c1Def(key,lines){ STORY[key]=[xdo(()=>c1sMark(key))].concat(lines); return STORY[key]; }
const c1If=(who,f,s,cond)=>({who,text:S(f,s),skipIf:()=>!cond()});
const c1Pip=(f,s)=>({who:'pip',text:S(f,s||f),skipIf:()=>!(G.flags&&G.flags.pip)});
// play a STORY key (or a list of lines); done runs after the scene closes
function c1Play(key,done,opt){
  const L0=typeof key==='string'?STORY[key]:key, L=typeof L0==='function'?L0():L0;
  if(!L||!L.length){ if(done) try{ done(); }catch(e){ console.error(e); } return false; }
  runDialogue(L,()=>{ scene='play'; C1ST.cam=null; if(done) try{ done(); }catch(e){ console.error(e); } try{ saveGame(); }catch(e){} },opt);
  return true;
}
// play several keys in a row (keys already seen are skipped when skipSeen)
function c1Chain(keys,done,opt){ const L=[]; for(const k of keys){ if(opt&&opt.skipSeen&&c1Seen(k)) continue; const v=STORY[k]; const a=typeof v==='function'?v():v; if(a&&a.length) L.push(...a); } return c1Play(L,done,opt); }
// a beat that waits for a calm moment (playing, no dialogue, no fight, no minigame): c1When(id, cond, fn)
function c1When(id,cond,fn){ if(C1ST.q.some(q=>q.id===id)) return; C1ST.q.push({id,cond,fn}); }
function c1sCalm(){ return scene==='play'&&!DLG&&!G.mini&&!(G.boss&&!G.boss.dead)&&!player.dead; }
function c1Queue(){
  if(!C1ST.q.length||!c1sCalm()) return;
  for(let i=0;i<C1ST.q.length;i++){ const q=C1ST.q[i]; let ok=false; try{ ok=!q.cond||q.cond(); }catch(e){ console.error(e); }
    if(ok){ C1ST.q.splice(i,1); try{ q.fn(); }catch(e){ console.error(e); } return; } }
}
// where a person is: outdoors near the story, inside their house (the door), or the bible spot
function c1Who(id,x,y){
  const n=(G.npcs||[]).find(q=>q.id===id); if(n) return {x:n.x,y:n.y,npc:id};
  const c=CASTBY[id];
  if(c&&c.inside&&AREADEFS[c.inside]){ if(AREA&&AREA.id===c.inside){ const m=AREA.npcs.find(q=>q.id===id); if(m) return {x:m.x,y:m.y,npc:id,area:AREA.id}; }
    const d=DOORS.find(q=>q.area===c.inside); if(d) return {x:d.x,y:d.y,area:c.inside,npc:id}; }
  if(C1ST.fb[id]&&C1ST.fbAt[id]) return {x:C1ST.fbAt[id][0],y:C1ST.fbAt[id][1],npc:id};
  return {x,y,npc:id};
}
const c1sObj=(f,s,at,extra)=>Object.assign({text:S(f,s),x:at.x,y:at.y},at.area?{area:at.area}:{},at.npc?{npc:at.npc}:{},extra||{});
// world time to the evening (the "Wait until dark" offers): a fade, then 21:00
function c1WaitDark(){ G.fade=1; G.tod=0.875; later(0.3,()=>setBanner(S('Night falls','Night falls'),S('The brass lamps flicker on, one by one.','The lamps come on.'),2.6)); saveGame(); }
// trust: side quests and scenes may also just add to G.flags.c_trust; a watcher shows the banner either way
function c1Trust(n){ G.flags.c_trust=clamp((G.flags.c_trust||0)+(n==null?1:n),0,7); }
function c1TrustTick(){
  const F=G.flags, t=clamp(F.c_trust|0,0,7); if((F.c_trust|0)!==t) F.c_trust=t;
  if(C1ST.trustSeen==null){ C1ST.trustSeen=t; return; }
  if(t<C1ST.trustSeen){ C1ST.trustSeen=t; return; }
  if(t>C1ST.trustSeen&&scene==='play'){ C1ST.trustSeen=t; setBanner(S('Vesper trusts you a little more.','Vesper trusts you more.'),'●'.repeat(t)+'○'.repeat(7-t),3.2); try{ SFX.play('shrine'); }catch(e){} }
}
function c1Moon(p){ if(typeof moonSet==='function') moonSet(p); else G.flags.moon=Math.min(G.flags.moon==null?100:G.flags.moon,p); }
const c1Friend=()=>typeof vesperFriend==='function'?!!vesperFriend():G.choices.c_vesper==='friend';

// ---------- 1. speakers, portraits, items
const C1_SPK={c_mask:{name:'The Moth Mask',col:'#c8c0dc'},c_vesper:{name:'Vesper',col:'#b8a8e8'},c_pearl:{name:'Pearl',col:'#7ad8cc'},
  c_squawk:{name:'Captain Squawk',col:'#6ad85a'},c_bolt:{name:'Bolt',col:'#e8c050'},c_pinch:{name:'Grand Admiral Pinch',col:'#ff8a5a'},
  c_shadow:{name:'Shadow Ash',col:'#8a7ab0'},c_saltbeard:{name:'Captain Saltbeard',col:'#a8e0f0'},
  goat:{name:'Duchess',col:'#e8e0d0'},pebble:{name:'Pebble',col:'#9aa0b8'}};
for(const k in C1_SPK) if(!SPK[k]) SPK[k]=C1_SPK[k];
if(!SPK.nyxara) SPK.nyxara={get name(){ return G&&G.flags&&(G.flags.f_nyx_named||G.flags.f_moon_bite3)?'Nyxara':'The Lady of the Moths'; },col:'#b8a8e8'};
Object.assign(ITEM_NAMES,{
  c_diary:S("Vesper's dream diary","Vesper's dream diary"),c_letters:S("Gran's letters","Gran's letters"),
  c_shard1:S('The Dusk Shard (Shard 1 of the Ember Heart)','The Dusk Shard'),c_birdclock:S("Lord Whirligig's bird clock","The bird clock")});
// Vesper Saltwhistle: not in any town; story code places her (sightings, the rooftop, the snow)
const C1_VLOOK={skin:'#e0b090',hair:'#2a2430',hairdo:'pony',hood:'#5a4a6a',cape:'#6a5a7a',outfit:'vest',shirt:'#3a3448',low:'#2a2436',trim:'#c8c0d8',belt:'#4a3a4a',mittens:'#3a3448',build:'slim',hold:'clasp',freckles:true};
const C1_VOUT={skin:'#e6b896',hair:'#2a2430',hairdo:'pony',shirt:'#e8c03a',outfit:'coat',low:'#2a2436',trim:'#c8c0d8',freckles:true,build:'slim',scarf:'#6a5a7a',hold:'clasp'};
if(!SPECIAL.c_vesper) SPECIAL.c_vesper={id:'c_vesper',name:'Vesper',col:'#b8a8e8',inside:'ev',kid:true,look:C1_VOUT,lines:[S(`Somebody has to make sure you don't climb anything stupid.`,`Don't climb anything silly.`)]};
// people the main story needs: x1_people owns them (CAST, homes, talk). If a run has no x1_people yet, the story
// puts a stand-in at the bible's spot so the main path still works (C1ST.fb); x1_people replaces them automatically.
const C1_PEOPLE={
  c_barley:{name:'Old Barley',col:'#d8d4cc',at:[3900,21100],look:{skin:'#d39f78',hair:'#d8d4cc',beard:true,beardc:'#d8d4cc',hat:'straw',outfit:'tunic',shirt:'#e8e0c8',low:'#6a5a3a',belt:'#5a3a1e',build:'old',hold:'staff',pipe:true}},
  c_bobs:{name:'Constables Bob and Bob',col:'#3a6ac8',at:[6990,24300],look:{skin:'#c8ccd8',hair:'#8a8e98',helm:true,plume:'#3a6ac8',outfit:'armor',shirt:'#a8acb8',low:'#7a7e8a',trim:'#e0b84a',hold:'spear',twin:true,build:'tall'}},
  c_penny:{name:'Penny Press',col:'#c8643a',kid:true,at:[7050,25850],look:{skin:'#9a6444',hair:'#2a1a10',hairdo:'short',hat:'cap',hatc:'#8a6a4a',outfit:'coat',shirt:'#e8e0c8',low:'#5a4a3a',trim:'#c8643a',freckles:true,bag:'#c8b890',hold:'scrolls'}},
  c_hettie:{name:'Professor Hettie Sprocket',col:'#e8762a',at:[6600,25800],look:{skin:'#f2c8a6',hair:'#e8762a',hairdo:'wild',outfit:'overalls',shirt:'#e8d8b8',low:'#4a5a6a',trim:'#e0a040',goggles:true,oil:true,soot:true,freckles:true,build:'short',hold:'mallet',bag:'#8a5a32'}},
  c_hester:{name:'Captain Hester Ticklebrass',col:'#e0b84a',at:[6700,24560],look:{skin:'#e8b894',hair:'#b8b0a8',hairdo:'bun',outfit:'coat',shirt:'#24345e',low:'#1a2644',trim:'#e0b84a',hat:'cap',hatc:'#1a2644',hatband:'#e0b84a',build:'tall',glasses:true,neck:'#e0b84a',hold:'behind'}},
  c_whirligig:{name:'Lord Percival Whirligig',col:'#e0c060',at:[7900,24960],look:{skin:'#f0c4a2',hair:'#4a3a2a',hat:'top',hatc:'#1a1a1a',hatband:'#e0c060',stache:'big',beardc:'#5a4a3a',outfit:'coat',shirt:'#5a2a4a',low:'#3a1a30',trim:'#e0c060',sash:'#e0c060',necklace:'#e0c060',glasses:true,build:'wide',hold:'cane'}},
  c_ottoline:{name:'Archivist Ottoline Inkwell',col:'#c8a0e0',at:[7700,24460],look:{skin:'#c8946c',hair:'#d8d4cc',hairdo:'bun',outfit:'robe',shirt:'#5a3a7a',low:'#3a2450',trim:'#c8a0e0',glasses:true,build:'short',hold:'book',bookc:'#6a2a3a',shawl:'#c8a0e0'}},
  c_mina:{name:'Tide Warden Mina Mudge',col:'#e8c03a',at:[2200,26380],look:{skin:'#e8bc98',hair:'#8a5a2a',hairdo:'braids',hat:'rain',hatc:'#e8c03a',outfit:'coat',shirt:'#e8c03a',low:'#3a4a5a',trim:'#3a4a5a',build:'slim',hold:'staff',freckles:true}},
  c_oona:{name:'Granny Oona Saltwhistle',col:'#6a8aa0',at:[1150,27100],look:{skin:'#d8aa84',hair:'#efeae0',hairdo:'braids',hood:'#6a8aa0',shawl:'#a06a4a',outfit:'dress',shirt:'#4a5a6a',low:'#3a4a5a',build:'old',frost:true,mittens:'#c86a4a',hold:'yarn'}},
  c_ambrose:{name:'Clockkeeper Ambrose Tickett',col:'#c8a040',at:[7230,24740],look:{skin:'#e8bc98',hair:'#efeae0',beard:'big',beardc:'#efeae0',outfit:'robe',shirt:'#6a4a2a',low:'#4a3420',trim:'#c8a040',glasses:true,build:'old',hold:'lamp',hat:'cap',hatc:'#4a3420'}},
  c_mo:{name:'Harbormaster Mo Barnacle',col:'#c8582a',at:[7080,25960],look:{skin:'#d8a07c',hair:'#c8582a',beard:'big',beardc:'#c8582a',hat:'rain',hatc:'#e8c03a',outfit:'coat',shirt:'#24345e',low:'#1a2a40',trim:'#e8c03a',scarf:'#c83a2a',pipe:true,build:'big',hold:'rod'}},
  c_agatha:{name:'Keeper Agatha Brightwater',col:'#e8c03a',at:[12300,28560],look:{skin:'#e6b494',hair:'#efeae0',hairdo:'bun',outfit:'coat',shirt:'#24345e',low:'#3a3a4a',trim:'#e8c03a',glasses:true,build:'strong',hold2:'lantern'}},
  c_fig:{name:'Auntie Fig',col:'#c86a8a',at:[7300,26260],look:{skin:'#b07a56',hair:'#efeae0',hairdo:'curly',outfit:'dress',shirt:'#c86a8a',low:'#8a3a5a',pattern:'dots',patc:'#f0d0dc',apron:true,shawl:'#e0b0c0',build:'wide',blush:true,hold2:'kettle'}}
};
C1ST.fb={}; C1ST.fbAt={};
for(const id in C1_PEOPLE){ const P=C1_PEOPLE[id]; if(CASTBY[id]||SPECIAL[id]) continue;
  SPECIAL[id]={id,name:P.name,col:P.col,inside:'ev',kid:!!P.kid,look:P.look,lines:[S('Busy day. Busy, busy day.','Busy day!')]};
  if(!SPK[id]) SPK[id]={name:P.name,col:P.col}; C1ST.fb[id]=true; C1ST.fbAt[id]=P.at; }
// where the stand-ins stand (some move as the story goes on)
function c1FbSpot(id){
  const P=C1_PEOPLE[id]; if(!P) return null; const st=G.stage;
  if(id==='c_bobs'&&!['c_coast','c_gear'].includes(st)) return [7700,25280];
  if(id==='c_mo'&&st==='c_snow') return [7080,25960];
  return P.at;
}
// portraits for the speakers that are not plain people
// (v12 FACES) the moth face (the Moon Temple's sentry moths): eyes on the head with lids, brows and a mouth when it
// feels something, antennae that droop or stand
function c1FaceMoth(g,big){
  const O='#1a1424', X=PX, ear=X.ear||0; g.save(); pxPose(g,{py:58}); g.lineWidth=3; g.strokeStyle=O;
  for(const s of [-1,1]){ g.fillStyle='#8a7aa8'; g.beginPath(); g.moveTo(s*8,-6); g.bezierCurveTo(s*40,-60,s*86,-50,s*76,-4); g.bezierCurveTo(s*70,22,s*30,24,s*8,8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#6a5a8a'; g.beginPath(); g.moveTo(s*8,10); g.bezierCurveTo(s*40,20,s*56,52,s*30,58); g.bezierCurveTo(s*14,56,s*8,34,s*6,16); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=big?'#c8a8ff':'#e8e0ff'; g.beginPath(); g.arc(s*48,-18,13,0,TAU); g.fill(); g.stroke(); g.fillStyle=O; g.beginPath(); g.arc(s*48,-18,6,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(s*46,-21,2.2,0,TAU); g.fill(); }
  g.fillStyle='#4a3e5e'; g.beginPath(); g.ellipse(0,8,12,30,0,0,TAU); g.fill(); g.stroke();
  for(const s of [-1,1]){ g.strokeStyle='#d8c8f0'; g.lineWidth=2.4; g.beginPath(); g.moveTo(s*4,-20); g.quadraticCurveTo(s*(14+(ear<0?-ear*6:0)),-52+(ear<0?-ear*18:-ear*4),s*(30+(ear<0?-ear*4:0)),-58+(ear<0?-ear*30:-ear*6)); g.stroke(); }
  for(const s of [-1,1]) pxEye(g,s*5.5,-14,s,{rx:4.2,ry:4.6,r:2.6,white:big?'#e8d8ff':'#f4f0ff',iris:'#2a2034',skin:'#4a3e5e',lash:O});
  pxBrows(g,{x:5.5,w:3.4,y:-21,col:'#d8c8f0',lw:2,arch:1.6,busy:true});
  pxMouth(g,{y:-4,w:3.6,c:2.6,col:'#d8c8f0',lw:1.8,dark:'#1a1424',busy:true});
  glowAtG(g,0,-10,90,'184,168,232',0.18);
  pxExtras(g,{ex:6,ey:-14,erx:4.2,ery:4.6,cheek:-8,top:-26,side:14,k:0.7,no:{blush:true}});
  g.restore();
}
// Grand Admiral Pinch, a crab in a bicorne under his shell: (v12 FACES) eyes on stalks that stand up or droop, lids,
// brows, a mouth, and claws that come up to salute or to snap
function c1FacePinch(g){
  const O='#2a0e08', X=PX, ear=X.ear||0, n=X.n, hot=n==='angry'||n==='furious';
  g.save(); pxPose(g,{py:58}); pxAura(g,0,0,84); g.lineWidth=3; g.strokeStyle=O; g.lineJoin='round';
  g.fillStyle='#6a4428'; g.beginPath(); g.moveTo(-64,40); g.lineTo(-40,-30); g.lineTo(44,-36); g.lineTo(66,40); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#1a1008'; for(const x of [-30,0,30]){ g.beginPath(); g.arc(x,6,8,0,TAU); g.fill(); }
  // claws: raised and open when he shouts, tucked when he sulks
  const up=hot||n==='surprised'||n==='laughing'||n==='proud'?1:n==='sad'||n==='defeated'||n==='ashamed'||n==='scared'?-1:0, snap=pxOpenMouth();
  for(const s of [-1,1]){ g.save(); g.translate(s*44,40); g.rotate(s*(0.2-up*0.45)); g.fillStyle='#d8502e';
    g.beginPath(); g.ellipse(s*10,-14,13,18,s*0.3,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#e8603a'; g.save(); g.translate(s*14,-30); g.rotate(-s*snap*0.5); g.beginPath(); g.moveTo(-s*4,2); g.quadraticCurveTo(s*2,-16,s*14,-12); g.quadraticCurveTo(s*6,-6,s*6,4); g.closePath(); g.fill(); g.stroke(); g.restore(); g.restore(); }
  g.fillStyle='#e8603a'; g.beginPath(); g.ellipse(0,36,40,22,0,0,TAU); g.fill(); g.stroke();
  for(const s of [-1,1]){ const a=s*(0.32-ear*0.18), tx=s*12+Math.sin(a)*24, ty=22-Math.cos(a)*24*(ear<0?0.9:1);
    g.strokeStyle=O; g.lineWidth=3.4; g.beginPath(); g.moveTo(s*12,22); g.lineTo(tx,ty); g.stroke();
    pxEye(g,tx,ty-4,s,{rx:7.5,ry:7.5,r:3.4,white:'#fff',iris:O,skin:'#e8603a',lash:O,ring:O}); }
  const ex=12+Math.sin(0.32-ear*0.18)*24, ey=22-Math.cos(0.32-ear*0.18)*24*(ear<0?0.9:1)-4;
  pxBrows(g,{x:ex,w:6,y:ey-11,col:O,lw:3,arch:2,busy:true});
  pxMouth(g,{y:38,w:10,c:5,col:O,lw:2.6,dark:'#3a0a06'});
  g.fillStyle='#1a2a4a'; g.beginPath(); g.moveTo(10,-12); g.lineTo(32,-12); g.lineTo(26,-24); g.closePath(); g.fill(); g.stroke();
  pxExtras(g,{ex,ey,erx:7.5,ery:7.5,cheek:32,top:-30,side:44,no:{blush:true}});
  g.restore();
}
function glowAtG(g,x,y,r,col,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
function c1Horns(g,y,k){ g.fillStyle='#f0e6d0'; g.strokeStyle='#3a2a20'; g.lineWidth=2.5; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*14,y); g.quadraticCurveTo(s*22,y-16*k,s*30,y-24*k); g.quadraticCurveTo(s*20,y-10*k,s*24,y+2); g.closePath(); g.fill(); g.stroke(); } }
const C1_PORT={
  c_mask:{bg:'#1e1630',f:g=>{ if(typeof faceThief==='function') faceThief(g); else c1FaceMoth(g,false); }},
  c_vesper:{bg:'#2a2040',f:g=>{ g.save(); g.translate(0,6); g.scale(1.2,1.2); facePerson(g,C1_VOUT,true); c1Horns(g,-44,0.7);
    // the mask, pushed up on her forehead
    g.fillStyle='#d8d4e4'; g.strokeStyle='#2a2034'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-26,-50); g.quadraticCurveTo(0,-70,26,-50); g.quadraticCurveTo(14,-42,0,-46); g.quadraticCurveTo(-14,-42,-26,-50); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='#e2b65c'; g.lineWidth=2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*6,-58); g.quadraticCurveTo(s*14,-80,s*28,-84); g.stroke(); }
    g.strokeStyle='#c8c8d8'; g.lineWidth=3; g.beginPath(); g.moveTo(10,-30); g.quadraticCurveTo(18,-14,14,4); g.stroke(); g.restore(); }},
  c_pearl:{bg:'#14343a',f:g=>{ glowAtG(g,0,-10,100,'120,220,210',0.3); facePerson(g,{skin:'#e8c09a',hair:'#3a6a6a',hairdo:'wild',outfit:'coat',shirt:'#2a5a6a',low:'#1a3a44',trim:'#e0c070',freckles:true,build:'strong'},false); c1Horns(g,-46,1);
    g.strokeStyle='#c8a060'; g.lineWidth=5; g.beginPath(); g.moveTo(-50,70); g.quadraticCurveTo(-10,30,40,62); g.stroke(); g.strokeStyle='rgba(90,60,30,.6)'; g.lineWidth=1.5; for(let i=0;i<8;i++){ const t=i/7, x=-50+t*90, y=70-Math.sin(t*Math.PI)*24; g.beginPath(); g.moveTo(x-3,y-3); g.lineTo(x+3,y+3); g.stroke(); } }},
  c_squawk:{bg:'#1a3a2a',f:g=>{ const O='#14200e'; g.lineWidth=3; g.strokeStyle=O;
    g.fillStyle='#d83a2a'; g.beginPath(); g.ellipse(0,26,34,40,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#3ab84a'; g.beginPath(); g.ellipse(0,-10,30,30,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#f0d040'; g.beginPath(); g.moveTo(14,-14); g.quadraticCurveTo(44,-8,26,12); g.quadraticCurveTo(22,0,12,-2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#fff'; g.beginPath(); g.arc(4,-18,8,0,TAU); g.fill(); g.stroke(); g.fillStyle=O; g.beginPath(); g.arc(6,-18,4,0,TAU); g.fill();
    g.fillStyle='#1a2a4a'; g.beginPath(); g.moveTo(-26,-34); g.lineTo(22,-34); g.lineTo(12,-52); g.lineTo(-16,-52); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#e0b84a'; g.fillRect(-6,-46,12,6); }},
  c_bolt:{bg:'#3a2a14',f:g=>{ const O='#2a1a08'; g.lineWidth=3; g.strokeStyle=O;
    g.fillStyle='#d8a840'; g.beginPath(); g.ellipse(0,0,40,34,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#b88a30'; g.beginPath(); g.ellipse(-38,-14,12,26,-0.5,0,TAU); g.fill(); g.stroke(); g.beginPath(); g.ellipse(36,-30,10,18,0.9,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#e8a83a'; g.beginPath(); g.ellipse(0,20,18,12,0,0,TAU); g.fill(); g.stroke(); g.fillStyle=O; g.beginPath(); g.arc(0,14,5,0,TAU); g.fill();
    for(const s of [-1,1]){ g.fillStyle='#fff6c0'; g.beginPath(); g.arc(s*15,-6,8,0,TAU); g.fill(); g.stroke(); glowAtG(g,s*15,-6,18,'255,240,170',0.5); }
    g.fillStyle='#c8963a'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(-26+i*10,-30,2,0,TAU); g.fill(); } }},
  nyxara:{bg:'#120c22',f:g=>c1FaceMoth(g,true)},
  c_pinch:{bg:'#2a1a14',f:c1FacePinch},
  c_shadow:{bg:'#120a1e',f:g=>{ if(typeof faceDragon==='function') faceDragon(g,{skin:'#3a2a52',dark:'#1a1028',snout:'#5a4a7a',horn:'#8a7ab0',eye:'#c8a8ff',k:0.86}); }},
  c_saltbeard:{bg:'#0e2230',f:g=>{ g.globalAlpha=0.85; facePerson(g,{skin:'#bfe6f0',hair:'#e8f6ff',beard:'big',beardc:'#e8f6ff',outfit:'coat',shirt:'#2a4a5a',low:'#1a2a3a',trim:'#a8e0f0',hat:'top',hatc:'#1a2a3a'},false); g.globalAlpha=1; glowAtG(g,0,0,90,'160,220,255',0.25); }}
};
for(const k in C1_PORT) if(!EVPORT[k]) EVPORT[k]=C1_PORT[k];

// ---------- 2. the main story (bible/ACT2.md section 4). Every scene is STORY.<key>; C1STORY.md lists when each plays
// Chapter 1 (card: Act II · Chapter 3), Salt on the Wind
c1Def('c_arrive',[
  xl('narr',`The Southern Pass winds down and down out of the hills, until the valley runs out and the ground turns into sky.`,`The pass winds down. Then the ground turns into sky.`),
  xl('narr',`No. Not sky. Water. Blue all the way to the edge of the world, wrinkled like a bedsheet, and it smells like salt and old boats.`,`No, not sky. Water! Blue to the edge of the world. It smells like salt.`),
  xl('ash',`Pip. Pip, look. It's a lake that forgot to stop.`,`Pip, look! A lake that forgot to stop.`),
  c1Pip(`Mip!`),
  xl('ash',`That's the sea. I've read about the sea. It's supposed to be big. It's being VERY big about it.`,`That's the sea. It is VERY big.`),
  c1If('ash',`Good thing I folded back down to normal size. A giant dragon would scare all the boats.`,`Good thing I am small again. A giant dragon would scare the boats.`,()=>G.choices.ending==='heir'),
  xl('narr',`Far below, on the white cliffs, a city ticks. Clock towers. Chimneys puffing steam. A harbor full of ships that aren't going anywhere.`,`Far below, a city ticks. Clock towers, steam, and ships that don't move.`),
  {who:'narr',text:S(`And gliding down over the cliffs toward it, small and grey against the sky, is a figure with wings like a moth.`,`Someone with moth wings glides down toward it.`),fn:()=>c1GlideStart()},
  xl('ash',`There you are.`,`There you are.`),
  xl('narr',`You turn the brass gear over in your claws. Stamped on it, in tiny letters: GEARHAVEN.`,`You look at the brass gear. It says GEARHAVEN.`),
  xl('ash',`That's Mom's Heart you've got. I'm bringing it home.`,`That's Mom's Heart. I'm bringing it home.`)
]);
c1Def('c_barley',[
  xl('c_barley',`Evening. You'll be the dragon, then. The sheep said there'd be a dragon.`,`Hello. You must be the dragon. The sheep said so.`),
  xl('ash',`The sheep SAID?`,`The sheep SAID?`),
  xl('c_barley',`Not in words. Sheep don't do words. Gerald fainted, which is how Gerald says most things.`,`Not in words. Gerald fainted. That's how Gerald talks.`),
  xl('c_barley',`Saw a girl go over last night. Gliding, on a grey cloak like moth wings, carrying something that glowed. Right down to Gearhaven, she went.`,`Last night a girl glided over on moth wings. She held something glowing. She went to Gearhaven.`),
  xl('c_barley',`Follow the chalk road. It goes downhill all the way. Most things do, in the end.`,`Follow the white road. It goes downhill all the way.`)
]);
// Chapter 2 (card: Chapter 4), The City of Clocks
c1Def('c_gate',[
  xl('narr',`Gearhaven. Every roof has a clock on it. Every clock says one minute to midnight. It's suppertime.`,`Gearhaven! Every roof has a clock. Every clock is stuck at one minute to midnight.`),
  xl('c_bobs',`Halt! Who goes there?`,`Halt! Who goes there?`),
  xl('c_bobs',`...It's a lizard, Bob.`,`It's a lizard, Bob.`),
  xl('ash',`I'm a dragon. Mostly. Part. I'm Ash.`,`I'm a dragon. Mostly. I'm Ash.`),
  xl('c_bobs',`I'm Bob. He's also Bob. We are both Bob. State your business, Mostly Part Dragon.`,`I'm Bob. He's Bob too. What do you want, dragon?`),
  xl('ash',`I'm looking for a thief. In a moth mask. She stole something from my family.`,`I'm looking for a thief in a moth mask. She stole from my family.`),
  xl('c_bobs',`The Moth Mask! She's a legend! She's a menace! She once stole Bob's hat.`,`The Moth Mask! A legend! She stole Bob's hat.`),
  xl('c_bobs',`It was MY hat, Bob.`,`It was MY hat, Bob.`),
  xl('narr',`A girl in an enormous coat skids up, notebook first.`,`A girl in a huge coat runs up with a notebook.`),
  xl('c_penny',`HEADLINE: DRAGON KID ARRIVES IN GEARHAVEN. HORNS: TWO. TAIL: ONE. REASON: UNKNOWN. Penny Press, Gearhaven Gazette. Any comment?`,`HEADLINE: DRAGON KID ARRIVES! I'm Penny Press, from the newspaper. Any comment?`),
  xl('ash',`Um. Hello?`,`Um. Hello?`),
  xl('c_penny',`"Um, hello," says mysterious dragon. Great quote. What's that in your claw?`,`"Um, hello," says the dragon. Great quote! What's in your claw?`),
  xl('narr',`You show her the brass gear.`,`You show her the brass gear.`),
  xl('c_penny',`A gear that says Gearhaven. In Gearhaven. That's like finding a sock that says SOCK. You want Professor Sprocket. Down the Great Stair, by the canal. Follow the colored smoke.`,`A gear that says Gearhaven? In Gearhaven? Ask Professor Sprocket. Go down the big stairs, by the canal. Follow the colored smoke.`)
]);
c1Def('c_hettie',[
  xl('c_hettie',`Visitor! Don't touch that. Or that. That one you can touch. No, not like that. Oh, you're a DRAGON. Can I measure your tail? Later. What's that?`,`Hello! Don't touch that. Oh, you're a DRAGON! What's that?`),
  xl('narr',`She snatches the gear, screws a magnifying glass into her goggles, and squints.`,`She grabs the gear and looks very close.`),
  xl('c_hettie',`Gearhaven gear, brass, size four, slightly chewed. Boring. BUT.`,`A brass gear. Boring. BUT.`),
  xl('c_hettie',`Look in the teeth. Silver dust. It glitters. Moth dust! There's only one person in this city who leaves moth dust on everything she touches.`,`See the silver dust? Moth dust! Only one person leaves moth dust everywhere.`),
  xl('c_hettie',`The Moth Mask! She runs the rooftops at night. Steals from the clock barons. Leaves presents in Saltmarsh. Half the city wants her caught and the other half leaves its windows open.`,`The Moth Mask! She runs on the roofs at night. She robs the rich and gives presents to the poor.`),
  xl('c_hettie',`If she took something from you, tell Captain Ticklebrass. Clockwatch Hall, top of the town. She's very strict. She once arrested a pigeon.`,`Tell Captain Ticklebrass. Clockwatch Hall, at the top of the town. She once arrested a pigeon.`),
  xl('c_hettie',`Oh, and if you see a brass dog about this high, very shiny, slightly sneezy, he's mine. Bolt. He ran off when the moths came. Bring him home?`,`And if you see a shiny brass dog, he's mine. Bolt. He ran away. Bring him home?`),
  xdo(()=>{ G.flags.c_hettie=1; })
]);
STORY.c_hester_early=[xl('c_hester',`A gear? Show it to Professor Sprocket in the Lower Town first. She can read a gear like I read a timetable. Then come back. You have... let us say ten minutes.`,`A gear? Show it to Professor Sprocket first. Then come back.`)];
c1Def('c_hester',[
  xl('c_hester',`You are forty seconds late. I have been expecting you for forty seconds. The Press girl ran ahead.`,`You are forty seconds late. The newspaper girl ran ahead.`),
  xl('c_hester',`The Moth Mask. Of course. She has robbed Lord Whirligig nine times. She has robbed me twice. She left me a thank-you note. It was very well written.`,`The Moth Mask. She robbed Lord Whirligig nine times. She robbed me twice!`),
  xl('ash',`She stole the Ember Heart. A warm red stone, about this big. It's... what's left of my grandpa. Sort of. It's complicated.`,`She stole the Ember Heart. A warm red stone. It's a bit of my grandpa. Sort of.`),
  xl('c_hester',`Then it is the most precious thing she has ever taken. She will want to sell it to a baron, or hide it in the rafters. Either way, she will be on the roofs tonight.`,`Then she will be on the roofs tonight.`),
  xl('c_hester',`She always strikes Whirligig Manor after dark. Wait by the manor. When she runs, run after her. Do not fall off anything. The paperwork is terrible.`,`She robs Whirligig Manor after dark. Wait by the manor. When she runs, chase her! Don't fall off anything.`),
  xl('c_hester',`One more thing. The Great Clock stopped the night before last. One minute to midnight. Nobody knows why. I do not like things I don't know why.`,`Also, the Great Clock stopped. Nobody knows why. I don't like that.`),
  xdo(()=>{ G.flags.c_hester=1; })
]);
c1Def('c_chase_start',[
  xl('narr',`Night. The brass lamps flicker on. Up on the roof of Whirligig Manor, a shadow moves between the chimneys.`,`Night. The lamps come on. A shadow moves on the roof of Whirligig Manor.`),
  xl('c_whirligig',`(from a window) THIEF! Not AGAIN! That's my good clock! The one with the little bird!`,`THIEF! Not AGAIN! That's my good clock!`),
  xl('narr',`The shadow straightens up. A grey cloak, patterned like moth wings. A silver mask with feathery antennae. A sack over one shoulder.`,`A grey cloak like moth wings. A silver mask. A sack on her back.`),
  xl('c_mask',`Oh, look. The little ember came all this way. That's sweet. Go home.`,`Oh look. The little ember came all this way. Go home.`),
  xl('ash',`Give it BACK!`,`Give it BACK!`),
  xl('c_mask',`Catch me first.`,`Catch me first.`)
]);
STORY.c_chase_retry=[xl('narr',`The Moth Mask is back on the roof of Whirligig Manor, swinging her sack.`,`The Moth Mask is back on the roof!`),xl('c_mask',`Round two, little ember? Try to keep up this time.`,`Round two? Keep up this time.`)];
c1Def('c_chase_end',[
  xl('narr',`The rooftops end at the Clockwatch Hall. Across a dark gap stands the Great Clock, its huge white face stuck at one minute to midnight.`,`The roofs end. Across a gap stands the Great Clock.`),
  {who:'narr',text:S(`The Moth Mask doesn't stop. She leaps the gap and catches the clock's minute hand with both claws.`,`The Moth Mask jumps the gap. She grabs the clock's big hand.`),fn:()=>c1SightLeap()},
  xl('narr',`CREAK. The hand tips down under her weight. Her grip slips. For a moment she hangs over the long drop to the canal, right in front of you.`,`CREAK. The hand tips down. She slips! She hangs over the long drop.`),
  xl('narr',`The tip of the minute hand is close enough to reach.`,`You can just reach her.`),
  xc('ash',`What do you do?`,`What do you do?`,[
    xo(`Grab her wrist and pull her up`,`Pull her up`,{tone:'kind',fn:()=>{ G.flags.c_chase='helped'; c1Trust(1); },then:[
      xl('narr',`You grab her wrist. She's lighter than you thought. You heave, and she scrambles back onto the hand, breathing hard.`,`You grab her wrist and pull. She climbs back up.`),
      xl('c_mask',`...Why did you do that?`,`Why did you do that?`),
      xl('ash',`You were going to fall.`,`You were going to fall.`),
      xl('c_mask',`I don't fall. I just drop on purpose. Sometimes.`,`I don't fall. I drop on purpose.`),
      xl('narr',`For a second, behind the mask, she almost smiles. Then she's climbing, claw over claw, straight up the clock face like it's a ladder.`,`She almost smiles. Then she climbs up the clock like a ladder.`)]}),
    xo(`Grab the sack!`,`Grab the sack!`,{tone:'brave',fn:()=>{ G.flags.c_chase='sack'; },then:[
      xl('narr',`You grab the sack. She kicks off the clock face, swings up onto the hand, and the sack tears. Out falls Lord Whirligig's clock with the little bird. Not the Heart.`,`You grab the sack. It rips! Out falls a clock with a little bird. Not the Heart.`),
      xl('c_mask',`Wrong sack, little ember. Better luck never.`,`Wrong sack, little ember.`),
      xl('narr',`She climbs, claw over claw, straight up the clock face like it's a ladder.`,`She climbs up the clock like a ladder.`),
      xdo(()=>{ if(!G.items.c_birdclock) giveItems({c_birdclock:1},true); })]})
  ]),
  xl('ash',`HEY! That's not fair! You can't just climb up a CLOCK!`,`HEY! You can't just climb up a CLOCK!`),
  {who:'narr',text:S(`She vanishes into the dark at the top of the tower. Something flutters down and lands on your nose. A note.`,`She is gone at the top. A note flutters down onto your nose.`),fn:()=>{ C1ST.sight=null; }}
]);
c1Def('c_note1',[
  xl('narr',`The note says: "Go home. This isn't your story. M."`,`The note says: "Go home. This isn't your story. M."`),
  c1If('narr',`Underneath, smaller: "P.S. Thanks for the hand. Don't make it a habit."`,`P.S. "Thanks for the hand."`,()=>G.flags.c_chase==='helped'),
  xl('ash',`She climbed a whole clock with her claws. Like a ladder.`,`She climbed a whole clock with her claws.`),
  xl('ash',`I need claws like that. Not these ones. Better ones.`,`I need claws like that.`),
  c1Pip(`Mip.`)
]);
STORY.c_whirl_bird=[xl('c_whirligig',`My bird clock! You got it back from that... that MOTH. Hmph. Thank you. Here. Wipe your feet.`,`My bird clock! Hmph. Thank you. Wipe your feet.`),xdo(()=>{ takeItems({c_birdclock:1}); addCoins(30); G.flags.c_birdclock_back=1; })];
STORY.c_whirl_wait=[xl('c_whirligig',`She ALWAYS comes after dark. Nine times! I have started leaving out snacks so she'll at least be polite.`,`She always comes after dark. Nine times!`)];
// Chapter 3 (card: Chapter 5), The Turning Library (v12: was "The Girl from Saltmarsh", which named who she is)
c1Def('c_ottoline',[
  xl('c_ottoline',`Welcome to the Turning Library. Please don't run. The shelves run for you. ...WHAT DO YOU NEED? Sorry. Sorry. I shouted. What do you need?`,`Welcome to the Turning Library. WHAT DO YOU NEED? Sorry. I shouted.`),
  xl('ash',`How does somebody climb straight up the Great Clock? With their claws?`,`How does somebody climb up the Great Clock? With claws?`),
  xl('c_ottoline',`Oh! Like Mother Pearl! Our founder. Come, come, the shelf's coming round.`,`Oh! Like Mother Pearl! Come, the shelf is coming round.`),
  xl('narr',`A shelf slides up beside you, carrying a heavy blue book. On the cover is a woman with horns, a coil of rope, and a lantern.`,`A shelf slides up with a blue book. On it: a woman with horns, a rope and a lantern.`),
  xl('c_ottoline',`A thousand years ago, a young woman sailed into this bay with nothing but a rope and a stubborn streak. She had horns like yours. Claws that could climb anything. And no fire. Not a spark.`,`Long ago a young woman sailed here with a rope. She had horns like yours. Claws that climb anything. And no fire at all.`),
  xl('c_ottoline',`So she built a clock instead. And a lighthouse. And a city. Where she came from, nobody ever wrote down.`,`So she built a clock. And a lighthouse. And a city.`),
  xl('ash',`Horns and a tail? That's a lot like me.`,`Horns and a tail? Like me!`),
  xl('c_ottoline',`They say Pearl learned to climb in the sea caves at Gullcrag, past Saltmarsh. Nobody goes there now. The tide hasn't gone out for three days. And the gulls. So many gulls.`,`Pearl learned to climb in the sea caves past Saltmarsh. But the tide is stuck high. And so many gulls!`),
  xl('c_ottoline',`And the Moth Mask? The barons' gold always seems to end up in Saltmarsh. If I wanted to find her, I'd start there. Quietly. QUIETLY. Sorry.`,`And the Moth Mask? Try Saltmarsh. Quietly. QUIETLY. Sorry.`),
  xdo(()=>{ G.flags.c_ottoline=1; })
]);
STORY.c_ottoline_diary=[xl('c_ottoline',`A dream diary? Let me see. Moon letters in the margins. I can't read them. But I know somebody who can, and she'll be insufferable about it. I'll send a copy to Wren.`,`Moon letters! I can't read them. I'll send a copy to my friend Wren.`),xdo(()=>{ G.flags.c_diary_sent=1; })];
c1Def('c_mina',[
  xl('narr',`Saltmarsh stands on stilts over a silver lagoon. Boardwalks wobble between the houses. A gull sits on every post. The whole village smells of chowder.`,`Saltmarsh stands on stilts over the water. A gull on every post. It smells like soup.`),
  xl('c_mina',`High tide, high tide, high tide. Oh! A dragon. Hello. Sorry. It's been high tide for three days. The sea has forgotten how to leave.`,`High tide, high tide! Oh, a dragon. Hello. The sea forgot how to go out.`),
  xl('c_mina',`The Tide Clock is stuck. Something flew over the night it stopped, big and soft, and now there's silver dust in the works and seaweed in the gears.`,`The Tide Clock is stuck. Something big flew over. Now there's dust and seaweed in the gears.`),
  xl('ash',`I need to get to the Gullcrag Caves.`,`I need to get to the Gullcrag Caves.`),
  xl('c_mina',`Not at high tide you don't. The sands are under the sea, and the sea is in a very bad mood. Fix my clock and she'll go out again. The door's open. Mind the crabs.`,`Not at high tide! Fix my clock and the sea will go out. The door is open. Mind the crabs.`),
  xl('narr',`At the end of the longest boardwalk, a very small old woman in a shawl waves at you from a crooked little house.`,`Far down the boardwalk, a tiny old woman waves from a crooked house.`),
  xdo(()=>{ G.flags.c_mina=1; })
]);
c1Def('c_lowtide',[
  xl('narr',`CLUNK. The big hand of the Tide Clock swings from HIGH to LOW.`,`CLUNK! The big hand swings from HIGH to LOW.`),
  xl('narr',`Outside, all along the coast, the sea takes a long breath out. Water pours off the sands. Crabs look up, surprised. A very surprised fish flops on the mud.`,`Outside, the sea goes out. Crabs look up. A fish flops on the mud.`),
  xl('c_mina',`LOW TIDE! Oh, you lovely dragon. I'll keep her on LOW for you. The fish can wait.`,`LOW TIDE! Oh, you lovely dragon!`),
  xl('c_mina',`The Gullcrag sands are open. South, past the jetty. The caves are at the foot of the big dark cliff. Follow the gulls. Or run from them. Either works.`,`The sands are open. Go south, past the jetty. The caves are under the big dark cliff.`),
  xdo(()=>{ G.flags.c_lowtide=true; })
]);
c1Def('c_fishstep',[
  xl('narr',`Just before dawn, something wakes you. Out of the inn window, along the longest boardwalk, a cloaked figure creeps up to Granny Oona's crooked little house.`,`Before dawn, you look out of the window. A cloaked figure creeps to Granny Oona's house.`),
  xl('narr',`She lays a fish on the step. She straightens the doormat. Then she's gone, up a post and over a roof, quick as a cat.`,`She leaves a fish on the step. Then she runs off over the roofs.`),
  xl('ash',`Fish delivery. In a moth cloak. At five in the morning.`,`Fish delivery. In a moth cloak. So early!`),
  c1Pip(`Mip.`)
]);
// c_claws: the Gullcrag Caves (the dungeon lines are in section 3)
c1Def('c_cliff',[
  xl('narr',`The warp sets you down on top of Gullcrag Head. Wind. Gulls. The whole coast laid out below you like a map.`,`You land on top of the big cliff. Wind and gulls. The whole coast below.`),
  xl('narr',`Someone is sitting on the edge of the cliff, legs dangling, mask on. The Moth Mask.`,`Someone sits on the cliff edge. The Moth Mask!`),
  xl('c_mask',`Pearl's claws. Huh. They suit you.`,`Pearl's claws. They suit you.`),
  xl('ash',`You KNOW about Pearl?`,`You KNOW about Pearl?`),
  xl('c_mask',`Everybody in Saltmarsh knows about Pearl. Some of us more than others.`,`Everybody in Saltmarsh knows about Pearl.`),
  xl('ash',`Where's the Ember Heart?`,`Where is the Ember Heart?`),
  xl('c_mask',`Somewhere safe. Somewhere you can't climb. Yet.`,`Somewhere safe. Somewhere you can't climb. Yet.`),
  xl('c_mask',`Ask the old ladies in Saltmarsh, little ember. They love a story.`,`Ask the old ladies in Saltmarsh. They love a story.`),
  {who:'narr',text:S(`She stands, steps backwards off the cliff, and her grey cloak opens like a pair of wings. She glides away toward the city, a moth against the sunset.`,`She steps off the cliff. Her cloak opens like wings. She glides away.`),fn:()=>c1SightGlideAway(7200,24600)},
  xl('ash',`I REALLY need to learn how to do that.`,`I REALLY need to learn that.`)
]);
// Chapter 4 (card: Chapter 6), The Brassworks
c1Def('c_nest',[
  xl('narr',`The bell loft at the top of the Great Clock. Somebody lives here. A hammock between the beams. A tin of biscuits. Moth drawings pinned everywhere. A blanket that smells of the sea.`,`The bell loft at the top of the clock. Someone lives here! A hammock, biscuits, moth drawings.`),
  xl('narr',`No Ember Heart. But on a crate there's a stack of letters tied with string, and a little book with a moon on the cover.`,`No Ember Heart. But there are letters, and a little book with a moon on it.`),
  xl('narr',`The letters are from Saltmarsh, in shaky handwriting. "Dear Vesper. Don't climb anything tall. Love, Gran." "Dear Vesper. You left fish on my step again. Thank you. Please come in next time. Love, Gran."`,`The letters say: "Dear Vesper. Don't climb anything tall. Love, Gran."`),
  xl('ash',`Vesper. Her name is Vesper.`,`Vesper. Her name is Vesper.`),
  xl('narr',`The little book is a dream diary. The pages are full of moons, and moths, and the same words over and over.`,`The book is a dream diary. Full of moons and moths.`),
  xl('narr',`"The Lady came again. She says: bring the warm stone to the Spire. She says the fire will come back to us. She says Gran will be warm. She says I'll be real."`,`"The Lady came again. She says: bring the warm stone to the Spire. Gran will be warm."`),
  xl('ash',`The Spire? What spire? There isn't a spire.`,`The Spire? There isn't a spire.`),
  xl('narr',`Every gear in the clock's works is furred with silver dust. And pinned to the great bell is one more note.`,`Every gear is covered in silver dust. One more note is pinned to the bell.`),
  xl('narr',`"If you can read this, you can climb. Stop it. - M." Underneath, smaller: "My other drops are none of your business either."`,`"If you can read this, you can climb. Stop it. M."`),
  xdo(()=>{ G.flags.c_nest=1; giveItems({c_diary:1,c_letters:1},true); if(typeof QDEFS!=='undefined'&&QDEFS.c_notes&&!G.quests.c_notes) try{ startQuest('c_notes'); }catch(e){ console.error(e); } })
]);
c1Def('c_duchess',[
  xl('narr',`On the very top of the Great Clock, higher than any roof in Gearhaven, a goat is eating a weathervane.`,`On top of the Great Clock, a goat is eating a weathervane.`),
  xl('goat',`Meh.`,`Meh.`),
  xl('ash',`That's not just any goat. That's Duchess, from Farmer Hollis's. How did you get up here? I needed claws!`,`That's Duchess! How did you get up here? I needed claws!`),
  xl('goat',`Meh.`,`Meh.`),
  xl('narr',`Duchess has left a little pile of coins by the hatch. Nobody knows where goats get coins.`,`Duchess left a pile of coins. Nobody knows where goats get coins.`),
  xdo(()=>{ G.flags.c_duchess=true; addCoins(30); gainXp(40); })
]);
c1Def('c_pip_fetch',[
  c1If('narr',`Something clicks in the rafters. A clockwork magpie, all brass feathers and one glass eye, swoops down, snatches the brass gear right out of your claws, and flaps up to the highest beam.`,`A brass magpie swoops down. It grabs your gear and flies up high!`,()=>!!G.flags.pip),
  c1If('ash',`Hey! That's my clue! Give it back, you... you tin chicken!`,`Hey! Give it back, you tin chicken!`,()=>!!G.flags.pip),
  c1If('narr',`The magpie clacks its beak. It sounds a lot like laughing.`,`The magpie clacks. It sounds like laughing.`,()=>!!G.flags.pip),
  c1If('narr',`Pip goes very still. His tail swishes. He has watched a certain thief do this all over the rooftops. He has been taking notes.`,`Pip goes very still. He watched the thief do this. He was learning.`,()=>!!G.flags.pip),
  c1Pip(`Mip.`),
  c1If('narr',`Pip shoots up to the beam, plucks the gear out of the magpie's beak, and is back on your head before it can even say clack.`,`Pip zooms up and grabs the gear back! He lands on your head.`,()=>!!G.flags.pip),
  c1If('ash',`You stole it back! Pip! That's stealing! ...From a thief. So it's fine. Good boy!`,`You stole it back! From a thief. So it's fine. Good boy!`,()=>!!G.flags.pip),
  c1If('narr',`The magpie gives up and goes back to its nest, which is made entirely of teaspoons.`,`The magpie goes back to its nest. It is made of teaspoons.`,()=>!!G.flags.pip),
  xdo(()=>{ if(G.flags.pip){ G.flags.c_pip_fetch=true; later(0.6,()=>setBanner(S(`Pip learned Fetch!`,`Pip can Fetch!`),S(`When something shiny is out of reach and it says "Pip, fetch!", press ${balCtls().use}.`,`Shiny thing out of reach? Press ${balCtls().use}.`),3.4)); } })
]);
c1Def('c_ambrose',[
  xl('c_ambrose',`Eh? You climbed my clock? On the OUTSIDE? Nobody's done that since... well. Since the girl. Tick.`,`Eh? You climbed my clock? On the OUTSIDE? Only the girl did that. Tick.`),
  xl('c_ambrose',`She stopped the night something flew over. Big. Soft. Wings like old curtains. Silver dust in every gear. Tick.`,`The clock stopped when something big flew over. Silver dust in every gear. Tick.`),
  xl('c_ambrose',`But dust up top wouldn't stop her for long. Her heart's not up there, young dragon. It's down in the Brassworks. The great drive. If the drive is jammed, she'll never tick again.`,`Her heart is down in the Brassworks. The great drive. It is jammed.`),
  xl('c_ambrose',`Lord Whirligig locked the Brassworks gate when the moths came, and now it's stuck shut with dust. But there's the old smokestack. Mother Pearl built that chimney. She never could resist a chimney. Tick... tock.`,`The gate is stuck. But you can climb the old smokestack. Mother Pearl built it. Tick... tock.`),
  xdo(()=>{ G.flags.c_ambrose=1; })
]);
STORY.c_whirl_brass=[xl('c_whirligig',`My Brassworks! Do be careful with the... with the everything. And if you see a large brass gentleman with a key in his back, do NOT wind him up.`,`My Brassworks! Be careful. And if you see a big brass man with a key, do NOT wind him up.`)];
c1Def('c_clock_bong',[
  xl('narr',`Far above, through the floors and the pipes and the stone, something enormous goes CLUNK.`,`Far above, something huge goes CLUNK.`),
  xl('narr',`Then: tick. And: tock. And then, all over Gearhaven, every little clock on every roof starts ticking at once.`,`Tick. Tock. Every clock in Gearhaven starts ticking!`),
  xl('narr',`The Great Clock's hands swing to midnight. BONG. BONG. BONG. Twelve times, so loud the gulls fall off the roofs.`,`BONG! BONG! BONG! Twelve times. The gulls fall off the roofs.`),
  xl('narr',`The conveyor streets lurch and start to roll. Steam whistles. People run out of their houses in their nightgowns, cheering.`,`The moving streets start to roll. People run out cheering.`),
  xl('c_whirligig',`My clocks! My lovely clocks! ...Dragon. You did this? Hmph. Well. Thank you. Wipe your feet next time.`,`My clocks! Dragon, you did this? Hmph. Thank you.`),
  xl('c_hester',`Twelve bongs. Exactly twelve. I counted. I could cry. I won't. It would be inefficient.`,`Twelve bongs. Exactly twelve. I counted.`),
  xl('narr',`High on a chimney across the square, a figure in a grey cloak watches the clock. For one second she pushes her mask up to see better. A girl. Your age, or a bit older. Then the mask goes back down, and she's gone.`,`On a chimney, a girl in a grey cloak watches. She lifts her mask. Then she is gone.`),
  xl('c_penny',`(scribbling) HEADLINE: CLOCK SAVED BY LIZARD. MOTH MASK HAS A FACE. I'm going to need a bigger notebook.`,`HEADLINE: CLOCK SAVED BY LIZARD! MOTH MASK HAS A FACE!`),
  xdo(()=>{ G.flags.c_clock_on=true; })
]);
// Chapter 5 (card: Chapter 7), The Spinning Lighthouse
c1Def('c_squawk',[
  xl('narr',`A green and red blur shoots across the market and crashes into a fruit stall.`,`A green and red bird crashes into a fruit stall.`),
  xl('c_squawk',`SQUAWK! LIGHT GONE! MOTHS! SQUAWK!`,`SQUAWK! LIGHT GONE! MOTHS!`),
  xl('c_mo',`That's Agatha's parrot! Captain Squawk, from the Spinning Lighthouse out on Lantern Point.`,`That's Agatha's parrot! From the lighthouse.`),
  xl('c_squawk',`AGATHA SAYS HELP! AGATHA SAYS COOKIES! ...MOSTLY HELP!`,`AGATHA SAYS HELP! AND COOKIES! MOSTLY HELP!`),
  xl('c_mo',`The lighthouse has been dark since the night the clock stopped. Ships won't sail at night without it. And now the moths are all over it, thick as fog. Barnacles.`,`The lighthouse is dark. Moths are all over it. Barnacles!`),
  xl('c_mo',`The Lantern Road goes east, but the rope bridge over the Cut is gone. Cut. By those robed moth folk, the Hushers. You'd need to swing across. Got a rope?`,`Go east on the Lantern Road. But the bridge over the Cut is gone. Got a rope?`),
  xl('ash',`I've got something better. I've got a TAIL.`,`Better. I've got a TAIL.`),
  xdo(()=>{ G.flags.c_squawk=1; })
]);
c1Def('c_agatha',[
  xl('c_agatha',`You're the dragon Squawk went to fetch? Hm. Smaller than I pictured. Squawk said "big as a mountain."`,`You're the dragon? Smaller than I thought. Squawk said big as a house.`),
  xl('c_squawk',`BIG AS A MOUNTAIN!`,`BIG AS A MOUNTAIN!`),
  xl('c_agatha',`Squawk says that about everything. He said it about a sandwich.`,`He says that about everything. Even a sandwich.`),
  xl('c_agatha',`Forty years I've kept that light. Never missed a night. Then the moths came like a grey snowstorm and covered the lamp. Ate the light right out of it.`,`Forty years I kept that light. Then the moths came and ate the light.`),
  xl('c_agatha',`There's a big one up top. Biggest moth you ever saw. And there's someone else up there too. A girl in a grey cloak, going up and down my stairs like she owns them.`,`There's a huge moth up top. And a girl in a grey cloak.`),
  xl('ash',`Vesper.`,`Vesper.`),
  c1If('c_agatha',`Is that lamp oil in your bag? "Fennick's Brightest"? Smells like the good stuff. Save it for my lamp.`,`Is that Fennick's lamp oil? The good stuff! Save it for my lamp.`,()=>!!G.items.c_lampoil),
  xl('c_agatha',`The door's open. Mind the third step. Mind all the steps, really. There are three hundred of them.`,`The door is open. Mind the steps. There are three hundred.`),
  xdo(()=>{ G.flags.c_agatha=1; })
]);
c1Def('c_lamp_vesper',[
  xl('narr',`The Gloomwing is gone. The Lamp Room is quiet. Then the moths come back. Not to you. To her.`,`The Gloomwing is gone. Then the moths come back. Not for you. For her.`),
  xl('narr',`Vesper is backed against the great lamp, mask crooked, while a whirl of grey moths spins around her like a storm.`,`Vesper is against the lamp. Moths spin around her like a storm.`),
  xl('c_mask',`Get off! I did what she asked! I brought the stone! She said I'd have my fire!`,`Get off! I brought the stone! She said I'd get my fire!`),
  xl('narr',`The moths whisper. It sounds like a hundred tiny voices saying the same thing. "All of it. All of it. The Mother wants all of it."`,`The moths whisper: "All of it. The Mother wants all of it."`),
  xc('ash',`What do you do?`,`What do you do?`,[
    xo(`Breathe fire on the moths. Save her!`,`Save her with fire!`,{tone:'brave',fn:()=>{ G.flags.c_lamp='saved'; c1Trust(1); c1MothsOff(false); },then:[
      xl('narr',`You take the biggest breath of your life and roar fire across the Lamp Room. The moths scatter, squealing, out of the broken windows.`,`You roar fire! The moths fly out of the windows.`),
      xl('c_mask',`You... why do you keep DOING that?`,`Why do you keep DOING that?`),
      xl('ash',`Because you keep needing it.`,`Because you keep needing it.`)]}),
    xo(`"Where is the Ember Heart, Vesper?"`,`"Where is the Heart, Vesper?"`,{fn:()=>{ G.flags.c_lamp='asked'; c1MothsOff(true); },then:[
      xl('narr',`She flinches at her name. Then she dives through the moths, into the shadow under the lamp, and comes out on the other side of the room, scratched and furious.`,`She jumps at her name. She dives into the shadow and comes out across the room.`),
      xl('c_mask',`You don't get to call me that.`,`Don't call me that.`)]})
  ]),
  {who:'ash',text:S(`Wait. This is yours. Your gran's, I mean. You dropped it, up north.`,`Wait. This is your gran's. You dropped it up north.`),fn:()=>{ G.flags.c_lk_now=!!G.items.a1_locket&&!G.flags.c_locket_given; },skipIf:()=>!G.flags.c_lk_now},
  c1If('narr',`She snatches the shell locket out of your claw. She doesn't say thank you. She doesn't have to.`,`She grabs the shell locket. She doesn't say thanks. She doesn't have to.`,()=>!!G.flags.c_lk_now),
  xdo(()=>{ if(G.flags.c_lk_now){ takeItems({a1_locket:1}); G.flags.c_locket_given=true; c1Trust(1); } G.flags.c_lk_now=false; }),
  xl('c_mask',`Don't follow me. I mean it. Not where I'm going.`,`Don't follow me. I mean it.`),
  {who:'narr',text:S(`She steps into the shadow of the lamp, and the shadow swallows her.`,`She steps into the shadow. It swallows her.`),fn:()=>c1SightPoof()},
  xl('narr',`You're alone with the great dark lamp.`,`You are alone with the big dark lamp.`),
  c1If('narr',`You pour Fennick's Brightest into the lamp's well. It smells like the lamp shop in Emberhollow. It smells like home.`,`You pour in Fennick's oil. It smells like home.`,()=>!!G.items.c_lampoil),
  xl('narr',`You breathe on the wick. It catches. The great lens turns.`,`You breathe on the wick. It lights! The lens turns.`),
  xl('narr',`A beam of gold light swings out over the sea. Round and round, the way it used to. Past the harbor, past the breakwaters, over the dark water.`,`A gold beam swings out over the sea. Round and round.`),
  xl('narr',`And where the beam passes, for a moment, it lights up something that wasn't there before. A tower. Black as a burnt match, tall as the Great Clock, standing on a rock in the sea. Covered in moths.`,`The beam lights up something new. A black tower in the sea. Covered in moths.`),
  xl('c_squawk',`(from far below) SQUAWK! SPIRE! BIGGER THAN A HOUSE!`,`SQUAWK! SPIRE! BIGGER THAN A HOUSE!`),
  xl('ash',`"Bring the warm stone to the Spire." That's where she's going.`,`"Bring the warm stone to the Spire." That's where she's going!`),
  xdo(()=>{ G.flags.c_lit=1; })
]);
// Chapter 6 (card: Chapter 8), The Shadow Spire
c1Def('c_causeway',[
  xl('narr',`Night. The lighthouse beam swings over the sea. Each time it passes, black stones show in the water, a path of them, leading out to the Spire.`,`Night. The lighthouse beam swings. Black stones show a path to the Spire.`),
  xl('narr',`Between the stones, curtains of moths hang in the air like grey silk. They hiss when you get close.`,`Curtains of moths hang between the stones. They hiss.`),
  c1If('c_bobs',`We are Bob. We will hold the breakwater. Nothing gets past us. Except you. You can get past us. Go on.`,`We are Bob. We hold the breakwater. Go on!`,()=>!!(G.quests.c_bob&&G.quests.c_bob.done)),
  c1If('c_bolt',`Bark! (whirr) Bark! (his tail spins like a propeller)`,`Bark! (whirr) Bark!`,()=>!!(G.quests.c_bolt&&G.quests.c_bolt.done)),
  xl('ash',`Okay. Shadow, skip, swing. Shadow, skip, swing. I can do this.`,`Shadow, skip, swing. I can do this.`),
  c1Pip(`Mip!`),
  xdo(()=>{ G.flags.c_causeway=1; })
]);
c1Def('c_roof_intro',[
  xl('narr',`The top of the Shadow Spire. A round roof of black glass under an enormous moon. In the middle stands a broken lamp, dark and violet, and a ring of moths turning slowly around it.`,`The top of the Spire. Black glass under a huge moon. A broken violet lamp. Moths circle it.`),
  xl('narr',`Vesper stands in front of the lamp. No mask tonight. In her hand, something glows violet through her fingers.`,`Vesper stands by the lamp. No mask. Something glows violet in her hand.`),
  xl('c_vesper',`You climbed the Spire. Of course you did. Is there anything you don't climb?`,`You climbed the Spire. Of course. Is there anything you don't climb?`),
  xl('ash',`Ladders. Ladders are weird. Vesper, give me the Heart.`,`Ladders. Ladders are weird. Vesper, give me the Heart.`),
  xl('c_vesper',`The Lady comes at moonrise. She said she'd give my family its fire back. Gran would be warm. I'd be a real Emberblood. Like you.`,`The Lady comes at moonrise. She will give my family fire. Gran will be warm.`),
  xl('c_vesper',`You've got everything. Fire, a mom, a whole valley that loves you. I've got a cold house and a gran who can't feel her fingers. So no. You don't get to have this too.`,`You have fire, a mom, a whole valley. I have a cold house. So no. You don't get this too.`),
  xl('narr',`She pulls on her mask. Around her, three shadows stand up out of the floor and pull on masks too.`,`She puts on her mask. Three shadows stand up from the floor. They wear masks too.`),
  xl('c_mask',`Let's finish the chase, little ember.`,`Let's finish the chase, little ember.`)
]);
// the choice at the end of the Vesper fight (the fight pauses at 10 percent: x1_foes calls c1SpireChoice)
c1Def('c_choice',[
  xl('narr',`Vesper drops to one knee. Her clones melt back into the floor. The violet light in her hand flickers.`,`Vesper falls to one knee. Her shadows melt away.`),
  xc('narr',`She raises her moth hooks one more time.`,`She lifts her hooks one more time.`,[
    xo(`Finish the fight (she will remember this)`,`Finish the fight`,{tone:'brave',fn:()=>{ G.choices.c_vesper='foe'; },then:()=>STORY.c_end_fought.concat(STORY.c_truth,STORY.c_nyxara,STORY.c_snowfall)}),
    xo(`Lower your sword. "Why are you doing this?"`,`Lower your sword. "Why?"`,{tone:'kind',cond:()=>(G.flags.c_trust||0)>=4,fn:()=>{ G.choices.c_vesper='friend'; },then:()=>STORY.c_end_ally.concat(STORY.c_truth,STORY.c_nyxara,STORY.c_snowfall)}),
    xo(`"Pearl wrote a letter. To you. To all of you."`,`"Pearl wrote you a letter."`,{tone:'kind',cond:()=>(G.flags.c_trust||0)===3&&!!((G.quests.c_logbook&&G.quests.c_logbook.done)||G.flags.c_logbook_done),fn:()=>{ G.flags.c_trust=4; C1ST.trustSeen=4; G.choices.c_vesper='friend'; },then:()=>STORY.c_end_pearl.concat(STORY.c_truth,STORY.c_nyxara,STORY.c_snowfall)})
  ])
]);
c1Def('c_end_fought',[
  xl('ash',`It's over, Vesper.`,`It's over, Vesper.`),
  xl('narr',`You strike. She blocks, too slow. Her hooks clatter away across the glass. Her mask cracks down the middle and falls off.`,`You strike. Her hooks fly away. Her mask cracks and falls off.`),
  xl('c_vesper',`Fine. FINE. You win. You always win. Here's your stupid stone.`,`Fine. You win. Here's your stupid stone.`),
  xl('narr',`She throws something at your feet. Violet, warm, glowing. But small. Much smaller than the Heart. A piece, with one sharp edge, like a slice of a plum.`,`She throws something down. Violet and warm. But small. Just a piece.`),
  xl('ash',`This isn't the Heart. This is a BIT of the Heart. Where's the rest?`,`This is just a BIT of the Heart. Where is the rest?`),
  xl('c_vesper',`Gone. Ask the moon.`,`Gone. Ask the moon.`),
  xl('narr',`She will remember this.`,`She will remember this.`),
  c1If('narr',`(She does not look back at you.)`,`(She does not look back.)`,()=>(G.flags.c_trust||0)<4)
]);
c1Def('c_end_ally',[
  xl('narr',`You lower your sword. It feels very heavy and very right.`,`You lower your sword. It feels right.`),
  xl('ash',`Vesper. Why are you doing this? Really?`,`Vesper. Why are you doing this?`),
  xl('narr',`For a long moment she doesn't move. Then she takes off her mask, and she's just a tired girl on a cold roof.`,`She takes off her mask. She is just a tired girl on a cold roof.`),
  xl('c_vesper',`Because Gran's cold. She's been cold her whole life. All of us have. We're Emberbloods and we've never had a single spark.`,`Because Gran is cold. We are Emberbloods with no fire. Not one spark.`),
  xl('c_vesper',`There's a soft voice in my dreams. The Lady of the Moths. She calls me "little thief". She says she can give my family our fire back, and make Gran warm.`,`A voice in my dreams says she can give us fire and make Gran warm.`),
  c1If('ash',`She talks to me too. At the window, in my dreams. I told her to go away.`,`She talks to me too. I told her to go away.`,()=>G.flags.dr_c_whisper==='go'),
  c1If('ash',`...She talks to me too. In my dreams. At the window.`,`She talks to me too.`,()=>!!G.flags.dr_c_whisper&&G.flags.dr_c_whisper!=='go'),
  xl('c_vesper',`She said the fire was ours too. Pearl's share. That your side got all of it and we got none. That's not fair, is it? Tell me that's fair.`,`She said your side got all the fire. That's not fair, is it?`),
  c1If('ash',`It's not fair. But I lit your gran's stove. She laughed so hard she cried. Fire isn't something you keep. It's something you share.`,`It's not fair. But I lit your gran's stove. Fire is for sharing.`,()=>!!(G.quests.c_oona&&G.quests.c_oona.done)),
  c1If('ash',`It's not fair. But fire isn't something you keep in a box. It's something you share. I'd have shared it. You only had to ask.`,`It's not fair. But fire is for sharing. You only had to ask.`,()=>!(G.quests.c_oona&&G.quests.c_oona.done)),
  xl('c_vesper',`...You'd have shared it? Gran always says fire isn't the only warm thing. I never believed her.`,`You'd have shared it? Gran says fire isn't the only warm thing.`),
  xl('ash',`You're my cousin, you know. Sort of.`,`You're my cousin. Sort of.`),
  xl('c_vesper',`Don't make it weird.`,`Don't make it weird.`),
  xl('ash',`Too late.`,`Too late.`),
  xl('narr',`She laughs, a small cracked laugh. Then she opens her hand.`,`She laughs a little. Then she opens her hand.`)
]);
c1Def('c_end_pearl',[
  xl('ash',`Wait. Pearl wrote something. In her logbook. The last page. It's for you. For all of you with no fire.`,`Wait. Pearl wrote something. It's for you. For everyone with no fire.`),
  xl('narr',`Vesper freezes.`,`Vesper freezes.`),
  xl('ash',`"To my children with no fire. Don't be sad. Fire isn't the only warm thing. Hands are warm. Soup is warm. A lit window is warm. I had no fire, so I built a city full of warm windows. You can too."`,`"To my children with no fire. Fire isn't the only warm thing. Hands are warm. Soup is warm. I built a city of warm windows. You can too."`),
  xl('narr',`Vesper sits down on the cold glass, very suddenly. She pushes up her mask and wipes her face on her sleeve.`,`Vesper sits down. She wipes her face on her sleeve.`),
  xl('c_vesper',`She really wrote that?`,`She really wrote that?`),
  xl('ash',`I've got the page. It's a bit soggy. Pearl spilled tea on it a thousand years ago.`,`I have the page. Pearl spilled tea on it long ago.`),
  xl('c_vesper',`There's a soft voice in my dreams. The Lady of the Moths. She calls me "little thief". She says she can give my family our fire back, and make Gran warm.`,`A voice in my dreams says she can give us fire and make Gran warm.`),
  c1If('ash',`She talks to me too. At the window, in my dreams. I told her to go away.`,`She talks to me too. I told her to go away.`,()=>G.flags.dr_c_whisper==='go'),
  c1If('ash',`...She talks to me too. In my dreams. At the window.`,`She talks to me too.`,()=>!!G.flags.dr_c_whisper&&G.flags.dr_c_whisper!=='go'),
  xl('c_vesper',`But Pearl never needed a Lady, did she? She just built warm windows.`,`Pearl never needed a Lady. She built warm windows.`),
  xl('narr',`She laughs, a small cracked laugh. Then she opens her hand.`,`She laughs a little. Then she opens her hand.`)
]);
c1Def('c_truth',[
  xl('narr',`In her palm lies a piece of the Ember Heart. It was red once. Now it glows violet, like the sky just after sunset, and it beats very slowly. One sharp edge, like a slice of a plum.`,`In her hand is a piece of the Ember Heart. It glows violet now. It beats slowly.`),
  xl('c_vesper',`I never had the whole thing for long. The night I got back, I took it to the Moon Ring in the Moth Wood, like the Lady said.`,`The night I came back, I took the Heart to the Moon Ring in the Moth Wood.`),
  xl('c_vesper',`A moth came down, grey and soft as dust, so big her shadow put out the stars. Two pale moons on her wings. And a white one that kept going "shhh".`,`A giant grey moth came. And a white one that went "shhh".`),
  xl('c_vesper',`The Heart burned her feet. So she cracked it on the stones. Three pieces. "So my moths can carry it," she said. The white one called her Mother.`,`It burned her. She broke it in three. The white one called her Mother.`),
  xl('c_vesper',`The white one flew north with one piece. The Mother flew east with another. The third fell in the grass by my foot. It burned the moths. It didn't burn me. I kept it.`,`The white one flew north. The Mother flew east. The third fell by my foot. I kept it.`),
  xl('c_vesper',`It went purple in my hand. Like it was sad. The moths have been angry with me ever since. The Mother wants all three. That's what they call her. She said if I brought the last piece here tonight, she'd keep her promise.`,`It turned purple in my hand. The moths are angry. The Mother wants all three pieces.`),
  c1If('c_vesper',`I kept it in Gran's locket. The one you brought back.`,`I kept it in Gran's locket. The one you brought back.`,()=>!!G.flags.c_locket_given),
  c1If('c_vesper',`Take it. You'll need it more than me. I don't think she was ever going to keep her promise.`,`Take it. I don't think she was ever going to keep her promise.`,()=>G.choices.c_vesper==='friend'),
  xl('narr',`You take the Shard. It's warm all the way through, like a Lantern Bun straight out of the oven. The Dusk Shard.`,`You take the Shard. It's warm, like a fresh bun. The Dusk Shard.`),
  xdo(()=>{ giveItems({c_shard1:1},true); G.flags.c_shard1=true; })
]);
c1Def('c_nyxara',[
  xl('narr',`The moon goes dim. Not behind a cloud. Just dimmer, like a lamp being turned down.`,`The moon goes dim. Like a lamp turned down.`),
  xl('narr',`Every moth on the Spire turns to face you at once. Thousands of tiny painted eyes. And through all of them, one soft voice.`,`Every moth turns to look at you. And one soft voice speaks.`),
  xl('nyxara',`Thank you, little ember. You have been such a help.`,`Thank you, little ember. You helped so much.`),
  xl('nyxara',`Go home now, little ember. Stay home.`,`Go home now. Stay home.`),
  c1If('ash',`...Grandpa? No. You're gone.`,`Grandpa? No. You are gone.`,()=>G.choices.ending==='hero'||!G.choices.ending),
  c1If('ash',`Grandpa? Are you awake up there?`,`Grandpa? Are you awake?`,()=>G.choices.ending==='warden'),
  c1If('ash',`Grandpa? Did you get down off Bertram's oven shelf?`,`Grandpa? Did you get off the oven shelf?`,()=>G.choices.ending==='heir'),
  c1If('ash',`Grandpa? ...No. Grandpa's at home. Mom makes him wipe his feet.`,`Grandpa? No. He is at home.`,()=>G.choices.ending==='lantern'),
  xl('nyxara',`Oh, no, dear. Not him. Someone much, much older.`,`No, dear. Someone much older.`),
  xl('c_vesper',`...That's her. That's the Lady. She sounded so kind in my dreams.`,`That's her. The Lady. She sounded so kind in my dreams.`),
  xl('narr',`The moths lift off the Spire all at once, a grey river pouring up into the sky, and fly away north.`,`All the moths fly up like a grey river. They fly away north.`)
]);
c1Def('c_snowfall',[
  xl('narr',`Something cold lands on your nose.`,`Something cold lands on your nose.`),
  xl('narr',`Snow starts falling on the coast. White, and soft, drifting down out of a clear summer night. In the middle of summer.`,`Snow starts to fall. In summer!`),
  xl('ash',`Is that... snow? It's the middle of summer.`,`Is that snow? It's summer!`),
  c1Pip(`Mip? (Pip snaps at a snowflake. Then another. He looks very offended that they taste of nothing.)`,`Mip? (Pip bites a snowflake. It tastes of nothing. He is cross.)`),
  xl('c_vesper',`It's never snowed in Saltmarsh. Not once. Not in Gran's whole life.`,`It never snowed in Saltmarsh. Not once.`),
  c1If('c_vesper',`I'll find you, when it's time. Somebody has to make sure you don't climb anything stupid. You've got horns, cousin, not sense.`,`I'll find you when it's time. You have horns, cousin, not sense.`,()=>G.choices.c_vesper==='friend'),
  c1If('narr',`When you look round, Vesper is gone. Only a scrap of grey silk from her cloak lies on the glass where she stood.`,`Vesper is gone. Only a scrap of grey silk is left.`,()=>G.choices.c_vesper!=='friend'),
  xdo(()=>{ c1Moon(95); G.flags.c_snow=true; G.choices.extra=G.choices.extra||{}; G.choices.extra.c_vesper=G.choices.c_vesper==='friend'?S('You asked Vesper why, and she told you.','You asked Vesper why.'):S('You fought Vesper to the end. She threw you the Shard and vanished.','You fought Vesper. She threw you the Shard.'); }),
  xl('narr',`That night the moon has a bite out of it. Just a small one. As if someone tasted it.`,`That night, the moon has a little bite out of it.`)
]);
STORY.c_warp_out=[xl('narr',`A ring of warm light opens on the roof, the way Pearl's warps do. You step into it, and the Spire falls away below you.`,`A ring of warm light opens. You step in.`)];
// Epilogue (card: Act II · Epilogue), The Breakwater (v12: was "Snow in Summer", shown a minute before the snow)
c1Def('c_snow_city',[
  xl('narr',`By morning, Gearhaven is white. Snow on the clock towers. Snow on the conveyor streets, riding round and round. Children having snowball fights in their summer clothes.`,`By morning, Gearhaven is white. Snow everywhere. Kids throw snowballs in summer clothes.`),
  xl('c_fig',`Snow! In June! I've put a tea cosy on my head, dearie, and I'm not taking it off.`,`Snow in June! I put a tea cosy on my head, dearie.`),
  xl('c_hester',`Snow is not on the schedule. I have checked the schedule twice.`,`Snow is not on the schedule. I checked twice.`),
  c1If('c_vesper',`(on the Clockwatch roof, legs dangling) Told you I'd be around. Gran says thank you. She says it's the first winter she's ever been warm in.`,`Told you I'd be around. Gran says thank you. She is warm this winter.`,()=>G.choices.c_vesper==='friend'),
  xl('c_penny',`HEADLINE: SNOW IN SUMMER. SOMEBODY TOOK A BITE OUT OF THE MOON. DRAGON KID LOOKS WORRIED.`,`HEADLINE: SNOW IN SUMMER! SOMEONE BIT THE MOON!`),
  c1If('narr',`On the Clockwatch roof, where somebody used to sit, there's nobody. Just a scrap of grey silk, caught on a chimney.`,`On the roof, nobody sits now. Just a scrap of grey silk.`,()=>G.choices.c_vesper!=='friend'),
  xl('narr',`Far to the north, past the mountains, the sky is as white as paper.`,`Far to the north, the sky is white as paper.`)
]);
STORY.c_hints={
  c_coast:S('Gearhaven is down the Pass Road, south-east, on the white cliffs. Follow the chalk road.','Gearhaven is south-east. Follow the white road.'),
  c_gear:S('Professor Sprocket\'s workshop is in the Lower Town by the canal. Then the Clockwatch Hall at the top of the town. The Moth Mask strikes Whirligig Manor after dark.','See Professor Sprocket, then the Captain. The thief comes after dark.'),
  c_salt:S('Ask at the Turning Library. Then west along the Coast Road to Saltmarsh, where the Tide Clock is stuck.','Ask at the library. Then go west to Saltmarsh.'),
  c_claws:S('The Gullcrag Caves are at the foot of the dark cliff south of Saltmarsh. The tide is low now.','The caves are under the dark cliff. The tide is low now.'),
  c_brass:S('Climb the Great Clock. Ask the Clockkeeper. The way into the Brassworks is up its old smokestack in the Brass Yards.','Climb the clock. Ask the Clockkeeper. Then climb the smokestack.'),
  c_light:S('Lantern Point is east along the Lantern Road. Swing over the Cut on the old bridge posts.','Go east. Swing over the Cut with your tail.'),
  c_spire:S('The Spire\'s path shows at night, from the end of the west breakwater. Shadow, skip, swing.','The path shows at night. Shadow, skip, swing.'),
  c_snow:S('Go back to Gearhaven. Everybody is out in the snow.','Go back to Gearhaven.')
};

// ---------- 3. the dungeon story lines (bible section 5), played by the dungeon helpers (x1_dun_a, x1_dun_b).
// Pass c1DunStory(id) as defineDungeon's `story` (or play any key with c1Play(key)); see C1STORY.md for each key.
// The Gullcrag Caves (c_gullcrag): the Climbing Claws
c1Def('c_gull_in',[
  xl('c_pearl',`That bell hasn't been rung in a long time. Mind the sand. It gets in the hinges.`,`Someone rang my bell. Mind the sand.`),
  xl('ash',`Who said that?`,`Who said that?`),
  xl('c_pearl',`Pearl. I cut the steps in these caves and put up the signs. The sea did the digging.`,`Pearl. I cut these steps. The sea dug the caves.`),
  xl('ash',`Pearl? Mother Pearl? The library lady told me about you.`,`Pearl? The one who built the city?`),
  xl('c_pearl',`Did she. Then she told you I climbed. Good. Saves time.`,`Then you know I climb. Good.`),
  xl('c_pearl',`This cave breathes with the tide. In, out. Learn when it breathes in and it'll carry you. Get it wrong and it'll carry you anyway, just somewhere wetter.`,`This cave breathes with the tide. Learn it and it will carry you.`)
]);
c1Def('c_gull_bell',[xl('c_pearl',`That's the Tide Bell. Hit it hard. I hung it there so the sea would listen, and it mostly does.`,`The Tide Bell. Hit it hard. The sea listens.`)]);
c1Def('c_gull_barrel',[xl('c_pearl',`Barrels float. Dragons sink like anchors. Think about that.`,`Barrels float. Dragons don't. Think about that.`)]);
c1Def('c_gull_shrine',[
  xl('c_pearl',`My hall. I carved that statue myself, so you can blame me for the nose.`,`My hall. I carved that statue. Blame me for the nose.`),
  xl('c_pearl',`I had no fire, Ash. Not a spark. Mother cried about it the day I was born. Then she laughed, because I grabbed her horn and climbed straight up her face.`,`I had no fire, Ash. Not a spark. So I climbed. I even climbed up my mother's face!`),
  xl('c_pearl',`So I climbed. Cliffs, towers, my mother. I left the knack of it here for whoever came next. Put your hand on mine.`,`So I climbed. I left it here for you. Touch my hand.`)
]);
c1Def('c_gull_gift',[
  xl('narr',`You touch the statue's hand. Your claws tingle, then itch, then grow, just a little: curved, strong and grippy.`,`You touch the statue's hand. Your claws grow. Strong and grippy!`),
  xl('c_pearl',`The Climbing Claws. Cracked walls, chalk cliffs, anything with a handhold. Walk into it and up you go.`,`The Climbing Claws! Walk into a wall with handholds and up you go.`),
  xl('ash',`I can climb the Great Clock. I can get to her.`,`I can climb the clock! I can get to her!`),
  xl('c_pearl',`Anything with a crack in it, and everything has a crack if you look. The tide's on its way in, by the way. Up you go.`,`Anything with a crack. Oh, the tide is coming in. Up you go!`)
]);
STORY.c_gull_how=S(`Walk into a cracked wall with handholds to climb it. You can't attack while you climb.`,`Walk into a wall with handholds to climb. No attacks while climbing.`);
STORY.c_gull_bossline=S(`The Grand Admiral! When the tide comes in, CLIMB. Hit his claw when it's stuck. Mind the cannons.`,`When the tide comes in, CLIMB! Hit his stuck claw.`);
c1Def('c_pinch_intro',[
  xl('c_pinch',`Who dares enter the lagoon of GRAND ADMIRAL PINCH without saluting?`,`Salute Grand Admiral Pinch!`),
  xl('ash',`Um. Hello, Admiral. You look a bit crabby.`,`Um. Hi, Admiral. You look crabby.`),
  xl('c_pinch',`That is not a salute! Prepare to be pinched!`,`That is not a salute! Get pinched!`)
]);
c1Def('c_gull_won',[
  xl('narr',`Grand Admiral Pinch staggers, sits down in the sand, and sulks. Then he spots an old teacup in the wreck, squeezes into it, and looks enormously dignified.`,`The Admiral sits down and sulks. Then he squeezes into an old teacup. He looks very proud.`),
  xl('c_pinch',`I meant to do that. Dismissed.`,`I meant to do that. Dismissed.`),
  xl('c_pearl',`He's been Admiral of this lagoon for four hundred years. Nobody's told him there's no navy. Let him keep his teacup.`,`He's been Admiral here for four hundred years. Let him keep his teacup.`)
]);
c1Def('c_gull_end',[
  xl('c_pearl',`My cradle. Mother rocked me here, the one time she came south. She sang me the lantern song, flat as a board.`,`My cradle. Mother sang me the lantern song here. Flat.`),
  xl('c_pearl',`There's a girl who climbs my cliffs at night, Ash. She has my claws and no fire, like me. She's angry about it. So was I, when I was her age.`,`A girl climbs my cliffs at night. She has my claws and no fire. She is angry about it.`),
  xl('c_pearl',`Two more of my places are waiting: the Brassworks under my clock, and my lighthouse. The warp knows the way up.`,`Two more of my places wait: the Brassworks and my lighthouse. The warp will take you up.`)
]);
// The Brassworks (c_brassworks): the Grapple Tail
c1Def('c_brass_in',[
  xl('c_pearl',`Down the chimney. Good. That's how I always came in, too.`,`Down my chimney. That's how I came in too.`),
  xl('c_pearl',`This is the Brassworks. My clock's heart. A baron owns it now and he's put his name on all the doors. I put my name on all the gears first. Look closely.`,`This is the Brassworks. My clock's heart. My name is on all the gears.`),
  xl('c_pearl',`Everything in here keeps a rhythm: the steam, the gears, the belts. Learn it before it steps on your tail.`,`Watch the rhythm of the steam and the gears.`)
]);
c1Def('c_brass_shrine',[
  xl('c_pearl',`My tool rack. My wrenches, my good hammer, and my favorite thing I ever made.`,`My tool rack. And my favorite thing I ever made.`),
  xl('c_pearl',`I couldn't breathe fire, so I learned to grab things. Ropes. Rails. The odd baron by the collar. My tail did half the work. It just needed reminding.`,`I had no fire, so I learned to grab things. My tail did half the work.`)
]);
c1Def('c_brass_gift',[
  xl('narr',`On the velvet cushion sits a little brass hook, shaped like a curled claw. You pick it up and it clicks onto the tip of your tail as if it had been waiting there all along.`,`A little brass hook sits on a cushion. It clicks onto the tip of your tail.`),
  xl('narr',`Your tail twitches. Then it lashes out all by itself, and the hook bites into a brass ring on the ceiling with a clang.`,`Your tail flicks up by itself. Clang! The hook grabs a ring on the ceiling.`),
  xl('c_pearl',`The Grapple Tail! The hook only reminds your tail what it could always do. Aim at a ring or a post and it'll pull you over.`,`The Grapple Tail! Aim at a ring or a post. Your tail pulls you over.`),
  xl('ash',`My tail is a rope!`,`My tail is a rope!`),
  xl('c_pearl',`A rope with opinions. Hold on. The floor's about to go.`,`A rope with opinions. Hold on, the floor is going!`)
]);
STORY.c_brass_how=S(`Walk up to a brass ring or a post and use your action button. Your tail pulls you over gaps. It can pull light things to you, too.`,`At a ring or a post, use your action button. Your tail pulls you over.`);
STORY.c_brass_bossline=S(`Ticktock! Grab the key on his back with your tail and PULL. Jump his stomps. When the pendulum swings, get up on the rings!`,`Grab his back key with your tail and PULL! Jump his stomps!`);
c1Def('c_ticktock_intro',[
  xl('narr',`In the middle of the pit, something enormous and brass is standing very still. Then its eyes light up. Tick. Tock. TICK.`,`Something huge and brass stands in the pit. Its eyes light up. Tick. Tock. TICK.`),
  xl('ash',`Hi. Big fella. Nice clock.`,`Hi, big fella. Nice clock.`),
  xl('narr',`The colossus raises both fists.`,`It raises both fists.`)
]);
c1Def('c_brass_won',[
  xl('narr',`Ticktock sways, sits down with a sound like a hundred spoons dropping, and goes very still. Then, slowly, very gently, he pats you on the head.`,`Ticktock sits down with a crash. Then he pats you on the head, very gently.`),
  xl('c_pearl',`My Ticktock. I built him to guard my workshop. The dust got in his gears and he forgot who his friends were. He remembers now.`,`My Ticktock. Dust got in his gears and he forgot his friends. He remembers now.`),
  xl('narr',`Ticktock ticks. It sounds happy.`,`Ticktock ticks. It sounds happy.`)
]);
c1Def('c_brass_end',[
  xl('c_pearl',`My first workshop. Before the city. Before the baron. Just me, a bench, and a very big idea.`,`My first workshop. Just me, a bench and a big idea.`),
  xl('c_pearl',`Everyone said a clock was silly. "Pearl," they said, "nobody needs to know what time it is." Then I built one, and now everybody's late for things.`,`Everyone said a clock was silly. Now everybody is late for things!`),
  xl('c_pearl',`Somebody's holding my clock at one minute to midnight. Pull the big lever, Ash. Let it go on.`,`Pull the big lever, Ash. Let my clock go on.`)
]);
// The Spinning Lighthouse (c_lighthouse): the Shadow Dash
c1Def('c_light_in',[
  xl('c_pearl',`My lighthouse. The first one on this coast. Before it, ships found the rocks by hitting them. Very efficient. Very wet.`,`My lighthouse. The first on this coast. Before it, ships found rocks by hitting them.`),
  xl('c_pearl',`Something's eaten my light. Moths. They love a flame and they hate a light. Funny creatures. Like some people.`,`Moths ate my light. They love a flame and hate a light.`),
  xl('c_pearl',`My little lens still turns, see? When the beam comes round, the moth webs shrivel. When it goes, the shadows come back. Use both.`,`When the beam comes round, the moth webs shrink. When it goes, shadows come back. Use both.`)
]);
c1Def('c_light_shrine',[
  xl('c_pearl',`My lens room. I used to sit here on long nights and watch the beam go round, and round, and round.`,`My lens room. I watched the beam go round and round here.`),
  xl('c_pearl',`A light that strong throws shadows a mile long. I used to curse them. Then one night I stepped into one, and came out at the far end.`,`Strong light makes long shadows. One night I stepped into one.`)
]);
c1Def('c_light_gift',[
  xl('narr',`The little lens turns, and its beam sweeps across you. Behind you, your own shadow stretches long across the floor. Then it moves. On its own. It waves.`,`The beam sweeps over you. Your shadow stretches out. Then it waves at you!`),
  xl('narr',`You step forward, and somehow you're standing where your shadow's head was, three steps away, without taking the steps.`,`You step, and you are suddenly three steps away. Like magic.`),
  xl('c_pearl',`The Shadow Dash! Dash, and for a moment you're a shadow. Moth curtains can't catch you. Nobody looking for you can see you.`,`The Shadow Dash! Dash and you become a shadow. Moth curtains can't stop you.`),
  xl('c_pearl',`Start your dash inside a shadow and you'll ride it all the way to the far end. Over gaps, if the shadow's long enough.`,`Dash from inside a shadow and you ride it to the end. Even over gaps!`),
  xl('c_pearl',`And those bars? Made of shadow. They only let a shadow through in the dark. Wait for the beam to pass.`,`Shadow bars let you through only in the dark. Wait for the beam to pass.`),
  xl('ash',`Mom is never going to find me at bedtime again.`,`Mom will never find me at bedtime!`),
  c1Pip(`Mip?! (Pip hides behind you. Then he realises that's where your shadow is. Pip is very confused.)`,`Mip?! (Pip hides in your shadow. He is very confused.)`)
]);
STORY.c_light_how=S(`Dash to become a shadow: pass moth curtains and shadow bars. Start in a shadow to ride it far.`,`Dash to be a shadow. Pass moth curtains and shadow bars.`);
STORY.c_light_bossline=S(`The Gloomwing! Turn the mirrors so the light hits it. When it hides in the shadows, DASH in after it!`,`Turn the mirrors so light hits it! When it hides in a shadow, DASH in!`);
c1Def('c_gloomwing_intro',[
  xl('narr',`The lamp room is dark. Something huge and soft is wrapped around the great lamp like a scarf. Two enormous eyes open on its wings. Then two more. They're not eyes. They're worse.`,`Something huge and soft wraps the lamp like a scarf. Two big eyes open on its wings. Then two more.`)
]);
c1Def('c_light_won',[
  xl('narr',`The beam hits the Gloomwing full on. It shrieks, shudders, and all the grey dust falls off its wings like snow.`,`The beam hits the Gloomwing. The grey dust falls off its wings.`),
  xl('narr',`Underneath, its wings are gold. It blinks at you with soft, sleepy eyes, bumps its fuzzy head against the glass, and flutters out of the broken window toward the dawn.`,`Its wings are gold underneath! It blinks, bumps the glass, and flies out to the dawn.`),
  xl('c_pearl',`Poor thing. Somebody told it the dark was its friend. Light's kinder, in the end.`,`Poor thing. Someone told it the dark was its friend. Light is kinder.`)
]);
c1Def('c_light_end',[
  xl('c_pearl',`That's the last of my places, Ash. The claws, the tail, the shadow. All of it was waiting for whoever came next. I'm glad it was you.`,`That's the last of my places. Claws, tail, shadow. I'm glad it was you.`),
  xl('c_pearl',`And Ash? The girl in the grey cloak. She's mine too. All my children are. Be kind to her, if she lets you. Be kind anyway, if she doesn't.`,`And Ash? The girl in the grey cloak is my family too. Be kind to her. Be kind anyway.`)
]);
// The Shadow Spire (c_spire): everything at once (no Pearl here; the moths whisper)
c1Def('c_spire_in',[
  xl('narr',`Inside, the Spire is black glass, cold as a winter window. Violet lamps burn without any heat. Far above, the moon shines through a hole in the roof.`,`Inside, the Spire is cold black glass. Violet lamps burn with no heat.`),
  xl('nyxara',`(a hundred tiny voices, from every wall) Little ember. Little ember. Come up. Come up.`,`Little ember. Come up. Come up.`),
  xl('ash',`Nope. Not creepy. Not creepy at all. Pip, hold my horn.`,`Nope. Not creepy at all. Pip, hold my horn.`),
  c1Pip(`Mip. (Pip holds your horn. Very tightly.)`,`Mip. (Pip holds your horn tight.)`)
]);
c1Def('c_spire_dark',[xl('narr',`The dark is spreading across the floor like spilled ink. Where it touches, you feel slow and cold. The violet lamps burn cold. Maybe yours burns warmer.`,`Dark ink spreads on the floor. It makes you slow. Your fire is warmer than the violet lamps.`)]);
c1Def('c_spire_clones',[
  xl('narr',`Two shadows peel up off the floor. They look exactly like you. They move when you move. One of them is doing it backwards.`,`Two shadows stand up. They look like you. They copy you. One does it backwards.`),
  xl('ash',`Hey. Stop copying me.`,`Hey. Stop copying me.`),
  xl('narr',`Both shadows mouth, "Hey. Stop copying me."`,`They both say, "Hey. Stop copying me."`)
]);
c1Def('c_spire_sketch',[xl('narr',`A sketchbook, left on a step. Drawings of an old woman by a cold stove. Of stilt houses. Of a horned kid in a scarf, with a note underneath: "taller in person. no he isn't."`,`A sketchbook. A drawing of an old woman. And one of you: "taller in person. no he isn't."`)]);
c1Def('c_spire_core',[xl('narr',`The Spire is hollow in the middle, all the way up. Warm air rises from somewhere deep below. Warm. In here. You spread your wings.`,`The Spire is hollow inside. Warm air rises. You spread your wings.`)]);
c1Def('c_shadowash',[
  xl('narr',`The floor is a black mirror. Your reflection looks up at you. Then it puts its hands flat on the glass from the other side, and climbs out.`,`The floor is a black mirror. Your reflection climbs out of it!`),
  xl('c_shadow',`I wasn't snoring. I was practicing my gentle breaths.`,`I was not snoring. I was practicing breathing.`),
  xl('ash',`That's MY line!`,`That's MY line!`),
  xl('c_shadow',`That's MY line!`,`That's MY line!`)
]);
c1Def('c_shadowash_won',[
  xl('narr',`The shadow you flickers in the gold light, shrinks, and slides back into the floor. For a second the mirror shows just you again. You look tired. And brave.`,`The shadow shrinks into the floor. The mirror shows just you. Tired, and brave.`),
  xl('ash',`I am NOT that annoying.`,`I am NOT that annoying.`),
  c1Pip(`Mip.`)
]);
// boss taunts (x1_foes picks them; each is S(full,simple))
const C1_TAUNTS={
  c_mothmask:[S(`Keep up, little ember!`,`Keep up!`),S(`You fight like someone with a mom waiting at home.`,`You fight like someone with a mom at home.`),S(`Which one's me? Guess!`,`Which one is me? Guess!`),S(`I've been climbing since I could walk. What've you been doing? Lighting lanterns?`,`I've climbed since I could walk. You light lanterns!`)],
  c_mothmask3:[S(`You can't follow me here!`,`You can't follow me here!`)],
  c_mothmask_follow:[S(`...How did you DO that?`,`How did you DO that?`)],
  c_shadowash:[S(`Gentle breaths. Gentle breaths...`,`Gentle breaths...`),S(`Mip! (in a deep, wrong voice)`,`Mip! (in a wrong voice)`),S(`I can be a frog. I can be the best frog.`,`I can be the best frog.`)],
  c_pinch:[S(`PINCH! Salute your Admiral! I am the CLAW around here!`,`SALUTE your Admiral!`)]
};
// what defineDungeon's `story` should be for each Act II dungeon (keys as e9a expects them)
function c1DunStory(id){
  const M={c_gullcrag:{in:'c_gull_in',shrine:'c_gull_shrine',gift:'c_gull_gift',how:'c_gull_how',boss:'c_pinch_intro',bossline:'c_gull_bossline',won:'c_gull_won',end:'c_gull_end'},
    c_brassworks:{in:'c_brass_in',shrine:'c_brass_shrine',gift:'c_brass_gift',how:'c_brass_how',boss:'c_ticktock_intro',bossline:'c_brass_bossline',won:'c_brass_won',end:'c_brass_end'},
    c_lighthouse:{in:'c_light_in',shrine:'c_light_shrine',gift:'c_light_gift',how:'c_light_how',boss:'c_gloomwing_intro',bossline:'c_light_bossline',won:'c_light_won',end:'c_light_end'},
    c_spire:{in:'c_spire_in',boss:'c_roof_intro'}}[id]||{};
  const o={}; for(const k in M) o[k]=STORY[M[k]]; return o;
}
// defaults, so a dungeon registered without a `story` still says the right things (a later defineDungeon story wins)
for(const id of ['c_gullcrag','c_brassworks','c_lighthouse','c_spire']){ const st=c1DunStory(id); for(const k in st) if(st[k]&&!STORY['trial_'+id+'_'+k]) STORY['trial_'+id+'_'+k]=st[k]; }

// ---------- 4. the stages. Cards are numbered after the heist's two chapters (ACTS.md): the bible's Chapter 1 is
// "Act II · Chapter 3" here, and so on to Chapter 8; the epilogue is "Act II · Epilogue".
const C1P={pass:{x:3400,y:20500},fold:{x:3900,y:21100},gate:{x:6950,y:24250},hettie:{x:6600,y:25750},hester:{x:6700,y:24500},
  manor:{x:7900,y:24900},library:{x:7700,y:24400},salt:{x:2100,y:26450},tide:{x:2250,y:26330},gull:{x:1400,y:29400},gullShrine:{x:2300,y:28300},
  clock:{x:7200,y:24600},clockBase:{x:7200,y:24720},ambrose:{x:7200,y:24700},stack:{x:10350,y:24650},brassGate:{x:10200,y:24800},
  market:{x:7000,y:25900},cut:{x:9550,y:26950},agatha:{x:12300,y:28500},light:{x:12880,y:29050},breakwater:{x:7150,y:28950},
  spire:{x:7400,y:30000},hall:{x:6700,y:24500},oona:{x:1150,y:27050},chowder:{x:2000,y:26800}};
const c1Near=(P,r)=>c1Out()&&dist(player.x,player.y,P.x,P.y)<r;
const c1InArea=id=>!!AREA&&(AREA.id===id||String(AREA.id).startsWith(id+'_'));
const c1DunObj=(id,f,s,P)=>c1InArea(id)?{text:S(f,s),x:player.x,y:player.y,area:AREA.id}:{text:S(f,s),x:P.x,y:P.y};
defineStages(2,[
  {id:'c_coast',chapter:S('The Sheep Who Saw Too Much','Salt on the Wind'),card:['Act II · Chapter 3',S('The Sheep Who Saw Too Much','Salt on the Wind')],at:{x:C1P.pass.x,y:C1P.pass.y},
    objectives:()=>[{text:S('Follow the Pass Road down to Gearhaven','Follow the road to Gearhaven'),x:C1P.gate.x,y:C1P.gate.y}],
    hint:()=>STORY.c_hints.c_coast,
    soFar:S('A masked thief stole the Ember Heart and fled south. The only clue was a brass gear stamped GEARHAVEN. Ash followed the Southern Pass down to the sea.','A thief stole the Ember Heart. She dropped a gear that says GEARHAVEN. Ash went south to the sea.'),
    mom:[S(`The sea! Pebble says you can smell it from the pass. Bring me back a shell. A plain one is fine.`,`The sea! Bring me back a shell.`)],
    marker:id=>id==='c_barley'&&!c1Seen('c_barley'),
    enter(o){ if(o.load) return; if(o.prev==='c_pass'||!c1Seen('c_arrive')) later(3.4,()=>c1When('arrive',()=>c1Out(),()=>c1Play('c_arrive'))); },
    talk(n){ if(n.id==='c_barley'&&!c1Seen('c_barley')){ c1Play('c_barley'); return true; } return false; },
    update(dt){ if(scene==='play'&&c1Near(C1P.gate,300)) goStage('c_gear'); }},
  {id:'c_gear',chapter:S('Against the Clock','The City of Clocks'),card:['Act II · Chapter 4',S('Against the Clock','The City of Clocks')],at:{x:C1P.gate.x,y:C1P.gate.y+40},
    objectives(){
      const F=G.flags;
      if(G.mini&&G.mini.kind==='c_roofchase'){ const M=G.mini; return [{text:S('Chase the Moth Mask over the rooftops!','Chase the Moth Mask!'),x:M.mx||C1P.hall.x,y:M.my||C1P.hall.y,near:true}]; }
      if(!F.c_hettie) return [c1sObj('Show the gear to Professor Sprocket in the Lower Town','Show the gear to Professor Sprocket',c1Who('c_hettie',C1P.hettie.x,C1P.hettie.y))];
      if(!F.c_hester) return [c1sObj('Tell Captain Ticklebrass at the Clockwatch Hall','Tell the Captain at Clockwatch Hall',c1Who('c_hester',C1P.hester.x,C1P.hester.y))];
      if(!isNight()) return [{text:S('Wait for night by Whirligig Manor (the Captain or Lord Whirligig can help you wait)','Wait for night by Whirligig Manor'),x:C1P.manor.x,y:C1P.manor.y}];
      return [{text:S('Watch the roof of Whirligig Manor','Watch the roof of Whirligig Manor'),x:C1P.manor.x,y:C1P.manor.y}];
    },
    hint:()=>STORY.c_hints.c_gear,
    soFar:S('Gearhaven\'s Great Clock had stopped at one minute to midnight. Professor Sprocket found moth dust on the gear: the Moth Mask, Gearhaven\'s rooftop thief. Captain Ticklebrass said she would rob Whirligig Manor after dark.','The Great Clock stopped. The thief is the Moth Mask. She will rob Whirligig Manor after dark.'),
    mom:[S(`A city of clocks! Is it very loud? Tell me it's very loud.`,`A city of clocks! Is it loud?`)],
    marker:id=>{ const F=G.flags; return (id==='c_hettie'&&!F.c_hettie)||(id==='c_hester'&&F.c_hettie&&!F.c_hester); },
    enter(o){ if(!c1Seen('c_gate')) later(o.load?1.4:0.6,()=>c1When('gate',()=>c1Out(),()=>c1Play('c_gate'))); },
    talk(n){
      const F=G.flags;
      if(n.id==='c_hettie'&&!F.c_hettie){ c1Play('c_hettie',()=>questUpdated()); return true; }
      if(n.id==='c_hester'&&!F.c_hester){ if(!F.c_hettie){ c1Play(STORY.c_hester_early); return true; } c1Play('c_hester',()=>questUpdated()); return true; }
      return false;
    },
    update(dt){ c1ChaseWatch(dt); }},
  {id:'c_salt',chapter:S('Turning the Tide','The Turning Library'),card:['Act II · Chapter 5',S('Turning the Tide','The Turning Library')],at:{x:C1P.library.x,y:C1P.library.y+120},
    objectives(){
      const F=G.flags;
      if(!F.c_ottoline&&!F.c_mina) return [c1sObj('Ask at the Turning Library how anyone climbs a clock','Ask at the library how to climb a clock',c1Who('c_ottoline',C1P.library.x,C1P.library.y))];
      if(!F.c_mina) return [{text:S('Follow the Coast Road west to Saltmarsh','Go west to Saltmarsh'),x:C1P.salt.x,y:C1P.salt.y}];
      if(c1InArea('c_tidehouse')) return [{text:S('Fix the Tide Clock: burn the kelp, lift the weight, free the big hand','Fix the Tide Clock'),x:player.x,y:player.y,area:AREA.id}];
      return [{text:S('Fix the Tide Clock (inside the Tide House)','Fix the Tide Clock in the Tide House'),x:C1P.tide.x,y:C1P.tide.y,area:'c_tidehouse'}];
    },
    hint:()=>STORY.c_hints.c_salt,
    soFar:S('The Moth Mask climbed the Great Clock like a ladder. Archivist Inkwell told the story of Mother Pearl, Gearhaven\'s founder, who had horns and a tail and could climb anything, and who learned in the Gullcrag Caves past Saltmarsh. But the tide had been stuck high for three days.','The thief climbed the Great Clock. Pearl, who built the city, learned to climb in the Gullcrag Caves. But the tide is stuck high.'),
    mom:[S(`Saltmarsh? Wear your boots. And eat the chowder.`,`Wear your boots. Eat the chowder.`)],
    marker:id=>{ const F=G.flags; return (id==='c_ottoline'&&!F.c_ottoline&&!F.c_mina)||(id==='c_mina'&&F.c_mina&&!F.c_lowtide&&!AREA); },
    talk(n){
      const F=G.flags;
      if(n.id==='c_ottoline'&&!F.c_ottoline){ c1Play('c_ottoline',()=>questUpdated()); return true; }
      if(n.id==='c_mina'&&F.c_mina&&!F.c_lowtide){ c1Play([xl('c_mina',`The Tide House door is right there. Burn the kelp, gently. Lift the weight. Free the big hand. Forty waves since you got here. Sorry.`,`Burn the kelp. Lift the weight. Free the big hand.`)]); return true; }
      return false;
    },
    update(dt){
      const F=G.flags;
      if(!F.c_mina&&scene==='play'&&c1Near(C1P.salt,520)) c1Play('c_mina',()=>questUpdated());
      if(F.c_tide_fixed&&!c1Seen('c_lowtide')&&scene==='play') c1Play('c_lowtide',()=>{ gainXp(600); addCoins(60); goStage('c_claws',{card:false}); });
    }},
  {id:'c_claws',chapter:S('Turning the Tide','The Turning Library'),at:{x:C1P.gull.x+150,y:C1P.gull.y-200},
    objectives:()=>[c1DunObj('c_gullcrag','Explore the Gullcrag Caves at the foot of Gullcrag Head','Explore the Gullcrag Caves',C1P.gull)],
    hint:()=>STORY.c_hints.c_claws,
    soFar:S('Ash fixed Saltmarsh\'s Tide Clock and the sea went out at last. The Gullcrag Caves, where Pearl learned to climb, wait at the foot of the dark cliff.','The tide went out. The Gullcrag Caves are open.'),
    update(dt){ const F=G.flags;
      if((F.trial_c_gullcrag_done||F.c_gull_done)&&!c1Seen('c_cliff')) c1When('cliff',()=>c1Out(),()=>c1CliffScene()); }},
  {id:'c_brass',chapter:S('All Wound Up','The Brassworks'),card:['Act II · Chapter 6',S('All Wound Up','The Brassworks')],at:{x:C1P.clockBase.x,y:C1P.clockBase.y+80},
    objectives(){
      const F=G.flags;
      if(c1InArea('c_mothnest')) return [{text:S('Look around the bell loft','Look around the bell loft'),x:player.x,y:player.y,area:AREA.id}];
      if(!F.c_nest) return [{text:S('Climb the Great Clock to the very top','Climb to the top of the Great Clock'),x:C1P.clock.x,y:C1P.clock.y}];
      if(!F.c_ambrose) return [c1sObj('Ask Clockkeeper Ambrose why the Great Clock stopped','Ask the Clockkeeper why the clock stopped',c1Who('c_ambrose',C1P.ambrose.x,C1P.ambrose.y))];
      if(c1InArea('c_brassworks')) return [{text:S('Restart the Great Clock from the Brassworks','Restart the Great Clock'),x:player.x,y:player.y,area:AREA.id}];
      if(!G.found.seen_c_brassworks) return [{text:S('Climb the Brassworks smokestack in the Brass Yards','Climb the smokestack in the Brass Yards'),x:C1P.stack.x,y:C1P.stack.y}];
      return [{text:S('Restart the Great Clock from the Brassworks','Restart the Great Clock'),x:C1P.stack.x,y:C1P.stack.y,area:'c_brassworks'}];
    },
    hint:()=>STORY.c_hints.c_brass,
    soFar:()=>G.flags.c_nest?S('With Pearl\'s Climbing Claws, Ash climbed the Great Clock and found the Moth Mask\'s hideout. Her name was Vesper. Her dream diary said a Lady wanted the warm stone brought to "the Spire". The Great Clock\'s heart, the great drive in the Brassworks, was jammed.','Ash found the thief\'s hideout. Her name is Vesper. The clock\'s heart is jammed in the Brassworks.'):S('Pearl gave Ash her Climbing Claws in the Gullcrag Caves. On the cliff top the Moth Mask said: "Ask the old ladies in Saltmarsh." Now Ash can climb the Great Clock, the way she did.','Ash has the Climbing Claws now. Time to climb the Great Clock.'),
    mom:[S(`Claws! Mind the furniture.`,`Claws! Mind the furniture.`)],
    marker:id=>(id==='c_ambrose'&&G.flags.c_nest&&!G.flags.c_ambrose),
    talk(n){
      const F=G.flags;
      if(n.id==='c_ambrose'&&!F.c_ambrose){ if(!F.c_nest){ c1Play([xl('c_ambrose',`Eh? The clock? Yes, she's stopped. Tick. Somebody lives up in her bell loft, you know. Climbs up the outside. Tick.`,`The clock stopped. Somebody lives in the bell loft. Tick.`)]); return true; } c1Play('c_ambrose',()=>questUpdated()); return true; }
      if(n.id==='c_whirligig'&&!F.c_clock_on&&!c1Seen('c_whirl_brass_t')){ c1sMark('c_whirl_brass_t'); c1Play('c_whirl_brass'); return true; }
      return false;
    },
    update(dt){ const F=G.flags;
      if((F.trial_c_brassworks_done||F.c_brass_done)&&!F.c_clock_on) c1When('bong',()=>scene==='play'&&!DLG,()=>c1ClockBong()); }},
  {id:'c_light',chapter:S('Moth to a Flame','The Spinning Lighthouse'),card:['Act II · Chapter 7',S('Moth to a Flame','The Spinning Lighthouse')],at:{x:C1P.market.x,y:C1P.market.y},
    objectives(){
      const F=G.flags;
      if(!F.c_squawk) return [{text:S('Go back down to the Gear Market. Something is happening there.','Go to the Gear Market'),x:C1P.market.x,y:C1P.market.y}];
      if(c1InArea('c_lighthouse')) return [{text:S('Climb the Spinning Lighthouse and relight the lamp','Relight the lighthouse lamp'),x:player.x,y:player.y,area:AREA.id}];
      if(!F.c_cut&&!F.c_agatha) return [{text:S('Follow the Lantern Road east and cross the Cut (swing on the old bridge posts)','Go east and swing over the Cut'),x:C1P.cut.x,y:C1P.cut.y}];
      if(!F.c_agatha) return [c1sObj('Find Keeper Agatha on Lantern Point','Find Keeper Agatha',c1Who('c_agatha',C1P.agatha.x,C1P.agatha.y))];
      return [{text:S('Climb the Spinning Lighthouse and relight the lamp','Relight the lighthouse lamp'),x:C1P.light.x,y:C1P.light.y,area:'c_lighthouse'}];
    },
    hint:()=>STORY.c_hints.c_light,
    soFar:S('The Great Clock struck midnight and Gearhaven woke up. But the Spinning Lighthouse on Lantern Point was still dark, smothered in moths, and ships could not sail at night. Keeper Agatha\'s parrot came for help.','The clock works again! But the lighthouse is dark and full of moths.'),
    mom:[S(`You fixed a whole city's clock. I told the chickens.`,`You fixed a clock! I told the chickens.`)],
    marker:id=>id==='c_agatha'&&G.flags.c_squawk&&!G.flags.c_agatha,
    talk(n){ if(n.id==='c_agatha'&&G.flags.c_squawk&&!G.flags.c_agatha){ c1Play('c_agatha',()=>{ gainXp(300); questUpdated(); }); return true; } return false; },
    update(dt){ const F=G.flags;
      if(!F.c_squawk&&scene==='play'&&c1Near(C1P.market,520)) c1Play('c_squawk',()=>questUpdated());
      if(F.c_squawk&&!F.c_cut&&c1Out()&&player.x>9880&&player.x<12000&&player.y>26300&&player.y<28400){ F.c_cut=1; setBanner(S('Across the Cut!','Across the Cut!'),S('Your tail is a rope with opinions.','Your tail is a rope!'),2.6); questUpdated(); }
      if((F.trial_c_lighthouse_done||F.c_light_done)&&!F.c_spire_up) c1When('lamp',()=>scene==='play'&&!DLG,()=>c1LampScene()); }},
  {id:'c_spire',chapter:S('The Shadow Spire','The Shadow Spire'),card:['Act II · Chapter 8',S('The Shadow Spire','The Shadow Spire')],at:{x:C1P.breakwater.x,y:C1P.breakwater.y-60},
    objectives(){
      const F=G.flags;
      if(c1InArea('c_spire')) return [{text:S('Climb the Shadow Spire','Climb the Shadow Spire'),x:player.x,y:player.y,area:AREA.id}];
      if(!F.c_causeway&&!isNight()) return [{text:S('Wait for night. The Spire\'s path only shows in the dark (the Captain or Keeper Agatha can help you wait).','Wait for night'),x:C1P.breakwater.x,y:C1P.breakwater.y}];
      if(!F.c_causeway) return [{text:S('Go to the end of the west breakwater','Go to the end of the breakwater'),x:C1P.breakwater.x,y:C1P.breakwater.y}];
      if(!G.found.seen_c_spire) return [{text:S('Cross the Shadow Causeway to the Spire','Cross the path to the Spire'),x:C1P.spire.x,y:C1P.spire.y}];
      return [{text:S('Climb the Shadow Spire','Climb the Shadow Spire'),x:C1P.spire.x,y:C1P.spire.y,area:'c_spire'}];
    },
    hint:()=>STORY.c_hints.c_spire,
    soFar:S('When the lighthouse burned again, its beam showed a black spire standing in the sea where no spire had ever been. Vesper had gone there to give the Lady the warm stone at moonrise.','The lighthouse beam showed a black Spire in the sea. Vesper went there.'),
    mom:[S(`A black tower in the sea? Take a lantern. Take two.`,`A black tower? Take a lantern!`)],
    update(dt){ const F=G.flags;
      if(!F.c_causeway&&isNight()&&scene==='play'&&c1Near(C1P.breakwater,280)) c1Play('c_causeway',()=>{ gainXp(300); questUpdated(); });
      c1SpireWatch(dt); }},
  {id:'c_snow',chapter:S('The Breakwater','The Breakwater'),card:['Act II · Epilogue',S('The Breakwater','The Breakwater')],at:{x:C1P.breakwater.x,y:C1P.breakwater.y-60},
    objectives:()=>G.flags.c_done?[]:[{text:S('Go back to Gearhaven','Go back to Gearhaven'),x:C1P.market.x,y:C1P.market.y}],
    idle:()=>G.flags.c_done?S('The north has gone white. Rest when you are ready for the next part of the story.','Rest when you are ready.'):'',
    hint:()=>STORY.c_hints.c_snow,
    soFar:S('At the top of the Shadow Spire the truth came out: Vesper gave the Heart to a great moth, which cracked it into three Shards. She kept one in secret, and now Ash has it. Then a voice thanked Ash, snow fell in midsummer, and the moon had a bite out of it.','Vesper gave the Heart to a great moth. It broke into three. Ash has one piece. Then snow fell, and the moon had a bite out of it.'),
    mom:[S(`Snow? In summer? Wear the scarf. Both scarves.`,`Snow in summer? Wear your scarf!`)],
    update(dt){ const F=G.flags;
      if(!F.c_done&&!c1Seen('c_snow_city')&&scene==='play'&&c1Near(C1P.market,460)) c1Play('c_snow_city',()=>c1EndAct()); }}
]);
// the whole act: where __eb.actStart(2) begins (the arrival), and a little more in the kit for testing the coast
defineAct(2,{arrive:'c_coast',at:{x:C1P.pass.x,y:C1P.pass.y}});
// talk outside the stage hooks: little story beats with people (Whirligig's bird clock, the dream diary)
onTalk(n=>{
  if(!c1On()) return false;
  const F=G.flags;
  if(n.id==='c_whirligig'&&G.items.c_birdclock&&!F.c_birdclock_back){ c1Play('c_whirl_bird'); return true; }
  return false;
});
// options in people's talk menus: "Wait here until dark", the dream diary for Ottoline
{ const base=compTalkOpts; compTalkOpts=function(id,n){ const o=base(id,n); try{ if(c1On()) c1TalkOpts(id,o); }catch(e){ console.error(e); } return o; }; }
function c1TalkOpts(id,o){
  const F=G.flags, st=G.stage, day=!isNight();
  const wait=(who,line,simple)=>o.unshift({t:S('Wait here until dark','Wait until dark'),tag:'quest',fn:()=>later(0.2,c1WaitDark),then:[[who,S(line,simple)]],end:true});
  if(st==='c_gear'&&F.c_hester&&day&&(id==='c_hester'||id==='c_whirligig')) wait(id,id==='c_hester'?`Very well. I shall count the seconds until sunset. All of them.`:`Wait with ME? Hmph. Fine. Have a biscuit. Don't crumb.`,id==='c_hester'?`Very well. We wait for dark.`:`Hmph. Fine. Have a biscuit.`);
  if(st==='c_spire'&&!F.c_causeway&&day&&(id==='c_hester'||id==='c_agatha')) wait(id,id==='c_hester'?`Sunset is in a while. I have a very good chair. You may borrow it.`:`Sit. Squawk will tell us when it's dark. He'll tell us loudly.`,id==='c_hester'?`Sit. We wait for dark.`:`Sit. Squawk will tell us.`);
}

// ---------- 5. the big beats (each one is safe to call twice)
// Vesper's sightings: masked, drawn with the heist's thief sprite (drawThief): {x,y,z,face,mode:'wait'|'move'|'dive',alpha}
function c1GlideStart(){ const p=player; C1ST.glide={x:p.x-170,y:p.y-150,vx:105,vy:62,t:0,life:9}; C1ST.cam={x:p.x+120,y:p.y+30,k:0.45}; }
function c1SightAt(x,y,mode){ C1ST.sight={x,y,z:mode==='sit'?0:0,face:1,mode:mode||'wait',heart:false,alpha:1,t:0}; return C1ST.sight; }
function c1SightLeap(){ const S0=C1ST.sight||c1SightAt(C1P.hall.x+30,C1P.hall.y,'wait'); S0.go={x:C1P.clock.x-20,y:C1P.clock.y-60,t:0,d:1.2}; S0.mode='dive'; C1ST.cam={x:(C1P.hall.x+C1P.clock.x)/2,y:C1P.clock.y-20,k:0.75}; }
function c1SightGlideAway(tx,ty){ const S0=C1ST.sight; if(!S0) return; S0.mode='dive'; S0.away={vx:(tx-S0.x)/Math.max(1,dist(S0.x,S0.y,tx,ty))*190,vy:(ty-S0.y)/Math.max(1,dist(S0.x,S0.y,tx,ty))*190,t:0}; S0.face=tx<S0.x?-1:1; }
function c1SightPoof(){ const S0=C1ST.sight; if(!S0) return; emit(S0.x,S0.y-20,24,{col:'90,70,130',glow:false,smin:30,smax:120,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:6}); C1ST.sight=null; }
// the moth storm around her in the Lamp Room: fire scatters it (dive: she dodges through it to the far side)
function c1MothsOff(dive){ const S0=C1ST.sight; if(!S0) return; S0.moths=false;
  emit(S0.x,S0.y-30,dive?14:30,{col:'200,196,214',glow:false,smin:80,smax:260,lmin:.5,lmax:1,zmin:2,zmax:4,grow:2,drag:1});
  if(dive){ S0.go={x:S0.x-200,y:S0.y+10,t:0,d:0.8}; S0.mode='dive'; }
  else emit(player.x,player.y-20,24,{kind:'fire',ang:Math.atan2(S0.y-player.y,S0.x-player.x),spread:0.5,smin:120,smax:320,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:5}); }
function c1DrawMoths(S0,t){
  const cx=S0.x, cy=S0.y-34-(S0.z||0);
  ctx.save(); ctx.lineWidth=1.2; ctx.strokeStyle='rgba(30,22,44,.85)';
  for(let i=0;i<22;i++){ const a=t*(1.4+(i%3)*0.4)*(i%2?1:-1)+i*(TAU/22), r=38+(i%5)*9+Math.sin(t*2+i)*6, x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r*0.62, f=Math.abs(Math.sin(t*14+i));
    ctx.fillStyle=i%4?'#b8b0c8':'#8a8098'; ctx.beginPath(); ctx.ellipse(x-4,y,5.5,1.8+4*f,0.5,0,TAU); ctx.ellipse(x+4,y,5.5,1.8+4*f,-0.5,0,TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#2a2034'; ctx.fillRect(x-1,y-3,2,6); }
  ctx.restore();
}
function c1SightTick(dt){
  const S0=C1ST.sight; if(S0){ S0.t+=dt;
    if(S0.go){ const g=S0.go; g.t+=dt; const k=Math.min(1,g.t/g.d); if(!g.x0){ g.x0=S0.x; g.y0=S0.y; } S0.x=lerp(g.x0,g.x,k); S0.y=lerp(g.y0,g.y,k); S0.z=Math.sin(k*Math.PI)*70; if(k>=1){ S0.go=null; S0.mode='wait'; S0.z=0; } }
    if(S0.away){ S0.away.t+=dt; S0.x+=S0.away.vx*dt; S0.y+=S0.away.vy*dt; S0.z=Math.min(90,(S0.z||0)+dt*30); S0.alpha=Math.max(0,1-S0.away.t/4); if(S0.alpha<=0) C1ST.sight=null; } }
  const g=C1ST.glide; if(g){ g.t+=dt; g.x+=g.vx*dt; g.y+=g.vy*dt; if(g.t>g.life) C1ST.glide=null; }
}
// the cliff top after the Gullcrag Caves: she is sitting on the edge
function c1CliffScene(){
  // (placed when the scene's first line shows, wherever the warp has put Ash by then)
  const at=xdo(()=>{ const p=player; c1SightAt(p.x+110,p.y-30,'wait').face=-1; C1ST.cam={x:p.x+60,y:p.y-20,k:0.5}; });
  c1Play([at,...STORY.c_cliff],()=>{ G.flags.c_gull_done=1; gainXp(200); goStage('c_brass'); });
}
// the Great Clock starts again (the end of the Brassworks): inside, the freight lift carries Ash out of the front gate
function c1ClockBong(){
  if(G.flags.c_clock_on) return;
  const inside=c1InArea('c_brassworks');
  c1Play('c_clock_bong',()=>{
    G.flags.c_clock_on=true; G.flags.c_brass_done=1;
    if(inside&&AREA){ G.ow={x:C1P.brassGate.x,y:C1P.brassGate.y+60}; exitArea(); }
    later(0.6,()=>goStage('c_light'));
  },{mood:'victory'});
}
// the lamp is lit (the end of the Spinning Lighthouse): Vesper, the moths, the rescue, the Spire is revealed
function c1LampScene(){
  if(G.flags.c_spire_up) return;
  const L=[];
  if(!c1Seen('c_light_end')) L.push(...STORY.c_light_end);
  // Vesper against the lamp, in a storm of moths
  L.push(xdo(()=>{ const S0=c1SightAt(player.x+96,player.y-70,'wait'); S0.face=-1; S0.moths=true; C1ST.cam={x:player.x+48,y:player.y-30,k:0.55}; }),...STORY.c_lamp_vesper);
  c1Play(L,()=>{
    C1ST.sight=null; const F=G.flags; F.c_spire_up=true; F.c_bridge=1; F.c_light_done=1; gainXp(300);
    if(AREA&&c1InArea('c_lighthouse')){ G.ow={x:C1P.agatha.x+40,y:C1P.agatha.y+90}; exitArea(); }
    later(0.8,()=>{ setBanner(S('The Shadow Spire','The Shadow Spire'),S('A black tower stands in the sea past the harbor. Its path shows only at night.','A black tower in the sea. The path shows at night.'),4); });
    later(1.2,()=>goStage('c_spire'));
  });
}
// a stage the story data has taken over (e10_story marks STAGEDEF[id]._s10): its own triggers here stand down
function c1Data(id){ return !!(typeof STAGEDEF!=='undefined'&&STAGEDEF[id]&&STAGEDEF[id]._s10); }
// the Vesper fight pauses at 10 percent (x1_foes calls this; a watcher calls it if nobody does)
function c1SpireChoice(e){
  if(G.flags.c_choice_done||C1ST.choiceRun) return false;
  C1ST.choiceRun=true; G.taunt=null; G.tauntQ=[];
  if(e){ e.invuln=true; e.passive=true; e.tele=null; e.vx=e.vy=0; }
  // no fight on screen (the beat was called without her): she kneels in front of Ash for the scene
  else { const S0=c1SightAt(player.x+92,player.y-36,'wait'); S0.face=-1; C1ST.cam={x:player.x+46,y:player.y-18,k:0.6}; }
  for(const o of G.enemies) if(o!==e&&!o.dead&&(o.type==='c_mothclone'||o.clone)) o.dead=true;
  G.projectiles=(G.projectiles||[]).filter(p=>p.owner!=='enemy');
  c1Play('c_choice',()=>{
    G.flags.c_choice_done=1; C1ST.choiceRun=false; C1ST.sight=null;
    // x1_foes handed the kneel to us (C1.hook.vesperKneel): its finish() ends the fight properly (XP, the room solved)
    const fin=C1ST.kneelFin; C1ST.kneelFin=null;
    if(fin){ G.flags.c_mask_xp=1; try{ fin(); }catch(err){ console.error(err); } }
    if(e&&!e.dead){ e.dead=true; if(G.boss===e) G.boss=null; }
    const v=(EDEF.c_mothmask&&EDEF.c_mothmask.value)||2500; if(!G.flags.c_mask_xp){ G.flags.c_mask_xp=1; gainXp(v); }
    later(0.8,()=>c1SpireOut());
  });
  return true;
}
function c1SpireOut(){
  c1Play('c_warp_out',()=>{
    if(AREA){ G.ow={x:C1P.breakwater.x,y:C1P.breakwater.y-40}; exitArea(); }
    else if(curMap()===1&&dist(player.x,player.y,C1P.breakwater.x,C1P.breakwater.y)>200) mapTravel(C1P.breakwater.x,C1P.breakwater.y-40,{noSave:true});
    G.tod=Math.max(G.tod,0.9); later(0.4,()=>goStage('c_snow'));
  });
}
function c1SpireWatch(dt){
  const F=G.flags; if(F.c_choice_done||C1ST.choiceRun) return;
  const b=G.boss&&G.boss.type==='c_mothmask'?G.boss:(AREA?G.enemies.find(e=>e.type==='c_mothmask'):null);
  // (with x1_foes in the build its own Vesper kneels at 10 percent and calls C1.hook.vesperKneel below, so its finish()
  //  ends the fight properly: the watcher then only covers a Vesper that died some other way)
  if(b&&!b.dead&&b.hp<=b.maxHp*0.1&&!b.kneel&&typeof vesperKneel!=='function'&&scene==='play') c1SpireChoice(b);
  else if(b&&b.dead&&scene==='play') c1SpireChoice(null);
}
// x1_foes stops the Vesper fight at 10 percent and asks for the choice (C1FOES.md 3.5): this is the story's choice
if(typeof C1!=='undefined'&&C1&&C1.hook) C1.hook.vesperKneel=(e,finish)=>{ C1ST.kneelFin=finish; if(!c1SpireChoice(e)&&G.flags.c_choice_done){ C1ST.kneelFin=null; finish(); } };
// the end of the act
function c1EndAct(){
  if(G.flags.c_done) return;
  gainXp(600);
  endAct(2,{title:S('Act II: The Masked Thief','Act II: The Masked Thief'),lines:[
    S('Shard 1 of 3, the Dusk Shard. One more flew north. One more flew east.','You have 1 of 3 Shards.'),
    S('To the north, the world has gone white. And the moon has a bite out of it.','The north is white. The moon has a bite gone.')]});
}
// any Act II boss: its intro the first time it shows up, its "won" lines after it falls (once, by any route)
const C1_BOSS={c_pinch:{intro:'c_pinch_intro',won:'c_gull_won'},c_ticktock:{intro:'c_ticktock_intro',won:'c_brass_won'},c_gloomwing:{intro:'c_gloomwing_intro',won:'c_light_won'},
  c_shadowash:{intro:'c_shadowash',won:'c_shadowash_won'},c_mothmask:{intro:'c_roof_intro'}};
function c1BossTick(dt){
  C1ST.bt=(C1ST.bt||0)-dt; if(C1ST.bt>0) return; C1ST.bt=0.25;
  let b=G.boss&&C1_BOSS[G.boss.type]?G.boss:null;
  if(!b&&AREA) b=G.enemies.find(e=>!e.dead&&C1_BOSS[e.type])||null;
  if(b&&!b.dead){ C1ST.boss=b; const B=C1_BOSS[b.type]; if(B.intro&&!c1Seen(B.intro)&&scene==='play'&&!DLG) c1Play(B.intro); return; }
  // (a boss taken away with hp left is not a win: Ash died and woke at a shrine, or left the room; resetBoss and
  // exitArea only mark it dead. A real win always ends at hp 0.)
  const o=C1ST.boss; if(o&&o.dead&&o.hp>0){ C1ST.boss=null; return; }
  if(o&&(o.dead||o.hp<=0)){ C1ST.boss=null; const B=C1_BOSS[o.type]; if(B&&B.won&&!c1Seen(B.won)) later(2.6,()=>c1When('won_'+o.type,()=>!c1Seen(B.won),()=>c1Play(B.won))); }
}
// ---------- the Great Clock's hatch (into the Moth's Nest) and Duchess on the roof cap
function c1ClockTop(){ try{ return typeof elevLvl==='function'&&elevLvl(C1P.clock.x,C1P.clock.y-30)>=4; }catch(e){ return false; } }
function c1Hatch(){ return c1ClockTop()?{x:C1P.clock.x,y:C1P.clock.y-36,top:true}:{x:C1P.clockBase.x,y:C1P.clockBase.y+26,top:false}; }
function c1HatchAct(){
  if(!hasAbil('claws')){ c1Play([xl('narr',`The hatch into the bell loft is right at the top of the Great Clock, higher than any roof in Gearhaven. You would need claws like hers to get up there.`,`The hatch is way up at the top. You need climbing claws like hers.`)]); return; }
  const go=()=>{ const h=c1Hatch(); enterArea('c_mothnest',{x:h.x,y:h.y,outY:h.top?30:24}); };
  if(!c1Seen('c_duchess')&&reached('c_brass')) c1Play('c_duchess',go); else go();
}
// ---------- the Tide House door in Saltmarsh (x1_world may build the tower around it; its own door wins if it adds one)
function c1TideDoor(){ return DOORS.find(d=>d.area==='c_tidehouse'); }
// ---------- outdoor prompts
{ const base=miniPrompts; miniPrompts=function(offer){ base(offer); try{ if(G&&G.mode==='story'&&curMap()===1&&!AREA) c1Prompts(offer); }catch(e){ console.error(e); } }; }
function c1Prompts(offer){
  const p=player, F=G.flags;
  // (x1_world puts its own hatch door on top of its Great Clock tower: then that door is the way in, not this prompt)
  if(reached('c_brass')&&actOf(G.stage)>=2&&!(c1ClockTop()&&DOORS.some(q=>q.area==='c_mothnest'))){ const h=c1Hatch(), d=dist(p.x,p.y,h.x,h.y); if(d<64&&(h.top||!c1ClockTop())) offer(d-4,h.top?S('Open the hatch into the bell loft','Open the hatch'):(hasAbil('claws')?S('Climb the Great Clock to the bell loft','Climb the clock'):S('Look up at the Great Clock','Look up at the clock')),c1HatchAct,h.x,h.y); }
}
// ---------- per frame (outdoors through updateStory, inside areas through updateArea)
function c1Tick(dt){
  if(!G||G.mode!=='story'||G.done) return;
  if(AREA&&c1RChase()){ miniEnd(false,S('She got away!','She got away!'),S('Wait by Whirligig Manor to try again.','Wait by the manor. Try again!')); c1ChaseLights(false); }
  c1TrustTick(); c1Queue(); c1BossTick(dt);
  if(actOf(G.stage)!==2) return;
  const F=G.flags, p=player;
  // Duchess on the roof cap: walking near plays her scene once
  if(c1Out()&&reached('c_brass')&&!c1Seen('c_duchess')&&hasAbil('claws')&&scene==='play'){ const h=c1Hatch(); if(h.top&&dist(p.x,p.y,h.x,h.y+10)<150) c1Play('c_duchess'); }
  // the Moth's Nest: the note on entering, Pip's Fetch at the great bell
  if(c1InArea('c_mothnest')&&scene==='play'){
    if(!c1Seen('c_nest')) c1Play('c_nest',()=>{ gainXp(600); questUpdated(); });
    else if(!c1Seen('c_pip_fetch')&&G.flags.pip){ const b=AREA.objs.find(o=>o.k==='c1_nbell'); if(b&&dist(p.x,p.y,b.x,b.y)<110) c1Play('c_pip_fetch'); }
  }
}
{ const base=updateStory; updateStory=function(dt){ base(dt); try{ c1Tick(dt); }catch(e){ console.error(e); } }; }
{ const base=updateArea; updateArea=function(dt){ base(dt); try{ if(AREA&&G&&G.mode==='story'&&!G.done){ c1Tick(dt); const d=STAGEDEF[G.stage]; if(d&&d.update&&actOf(G.stage)===2) d.update(dt); } }catch(e){ console.error(e); } }; }
// (also: a fade that a scene starts under, like "wait here until dark", clears while the Act II scene plays)
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ if(G&&G.mode==='story'){ c1SightTick(dt); if(scene==='dialogue'&&G.fade>0&&actOf(G.stage)===2) G.fade=Math.max(0,G.fade-dt*1.4); } }catch(e){ console.error(e); } }; }
{ const base=simUpdate; simUpdate=function(dt){ base(dt); try{ if(G&&G.mode==='story') c1SightTick(dt); }catch(e){ console.error(e); } }; }
// the camera leans toward a scene (C1ST.cam = {x,y,k})
{ const base=updateCam; updateCam=function(dt,snap){
  const C=C1ST.cam; if(!C||AREA||!player||!G||G.mode!=='story') return base(dt,snap);
  if(scene!=='dialogue'&&!(G.mini&&G.mini.kind==='c_roofchase')){ C1ST.cam=null; return base(dt,snap); }
  const px=player.x, py=player.y; player.x=px+(C.x-px)*C.k; player.y=py+(C.y-py)*C.k; try{ base(dt,snap); }finally{ player.x=px; player.y=py; } }; }
// ---------- people: the stand-ins (when x1_people is not there) and Vesper on the Clockwatch roof in the snow
{ const base=setupNPCs; setupNPCs=function(){ base(); try{ if(G&&G.mode==='story') c1People(); }catch(e){ console.error(e); } }; }
function c1People(){
  if(actOf(G.stage)<2) return;
  for(const id in C1ST.fb){ const at=c1FbSpot(id); if(!at||!SPECIAL[id]) continue; if(G.npcs.some(n=>n.id===id)) continue; const n=mkNPC(SPECIAL[id],at[0],at[1]); n.walker=false; G.npcs.push(n); }
  if(G.stage==='c_snow'&&!c1Data('c_snow')&&c1Friend()&&!G.npcs.some(n=>n.id==='c_vesper')){ const n=mkNPC(SPECIAL.c_vesper,C1P.hall.x+40,C1P.hall.y+90); n.walker=false; n.c1roof=true; G.npcs.push(n); }
}
onTalk(n=>{
  if(n.id!=='c_vesper'||!c1On()) return false;
  const L=[xl('c_vesper',`Gran made me sit by her stove for an hour. An hour! Then she made me eat soup. It was warm. Don't tell anyone.`,`Gran made me sit by her stove. Then soup. It was warm.`)];
  if(G.flags.dr_seen_c_twins&&!c1Seen('c_vesper_twins')) L.push(xdo(()=>c1sMark('c_vesper_twins')),xl('c_vesper',`Gran says "fire isn't the only warm thing" every single night. How do you know that?`,`Gran says that every night! How do you know it?`));
  c1Play(L); return true;
});
// ---------- drawing: the glide, the sightings, Duchess, the hatch, the Tide House door, the scrap of silk
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ if(G&&G.mode==='story') c1Render(list); }catch(e){ console.error(e); } }; }
// a soft light on Vesper when she is in a scene at night (and the glide), so the moment can be seen
const C1_SL=[];
function c1SightLights(){
  for(const L of C1_SL){ const i=LIGHTS.indexOf(L); if(i>=0) LIGHTS.splice(i,1); } C1_SL.length=0;
  if(AREA) return; const add=(x,y,r,i)=>{ const L={x,y,r,i,c1:true}; C1_SL.push(L); LIGHTS.push(L); };
  const S0=C1ST.sight; if(S0) add(S0.x,S0.y-30-(S0.z||0),170,0.8*(S0.alpha==null?1:S0.alpha));
  const g=C1ST.glide; if(g) add(g.x,g.y-30,160,0.7);
}
function c1Render(list){
  c1SightLights(); c1RoofPreview(list);
  // the arrival glide: high up (small, with her shadow far below on the ground)
  const g=C1ST.glide; if(g&&!AREA) list.push({x:g.x,y:g.y+120,draw:()=>{ if(typeof drawThief!=='function') return; const a=Math.min(1,(g.life-g.t)/1.5);
    ctx.save(); ctx.globalAlpha=0.22*a; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(g.x+10,g.y+110,26,8,0,0,TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(g.x,g.y); ctx.scale(0.62,0.62); ctx.translate(-g.x,-g.y); drawThief({x:g.x,y:g.y,z:0,face:1,mode:'dive',alpha:a*0.9,heart:false}); ctx.restore(); }});
  const S0=C1ST.sight; if(S0&&inView(S0.x,S0.y,140)){ list.push({x:S0.x,y:S0.y+(S0.z>4?40:0),draw:()=>{ if(typeof drawThief==='function') drawThief(S0); }}); if(S0.moths) list.push({x:S0.x,y:S0.y+(S0.z>4?41:1),draw:()=>c1DrawMoths(S0,G.time)}); }
  if(AREA||curMap()!==1||actOf(G.stage)<2) return;
  if(reached('c_brass')){ const h=c1Hatch();
    if(inView(h.x,h.y,90)) list.push({x:h.x,y:h.y-6,draw:()=>c1DrawHatch(h)});
    if(h.top&&reached('c_brass')&&inView(h.x+46,h.y,80)){ const D=C1ST.goat||(C1ST.goat={x:h.x+52,y:h.y+8,hx:h.x+52,hy:h.y+8,face:Math.PI,t:0,r:10,kind:'goat'}); D.t+=0.016; list.push({x:D.x,y:D.y,draw:()=>{ try{ drawNPC(D); }catch(e){} }}); } }
  if(!c1TideDoor()&&inView(C1P.tide.x,C1P.tide.y,90)) list.push({x:C1P.tide.x,y:C1P.tide.y,draw:c1DrawTideDoor});
  if(G.stage==='c_snow'&&!c1Data('c_snow')&&!c1Friend()&&G.choices.c_vesper==='foe'&&inView(C1P.hall.x,C1P.hall.y,80)) list.push({x:C1P.hall.x+30,y:C1P.hall.y+70,draw:()=>c1DrawSilk(C1P.hall.x+30,C1P.hall.y+60)});
}
function c1DrawHatch(h){
  const x=h.x, y=h.y, t=G.time;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0,8,24,8,0,0,TAU); ctx.fill();
  ctx.fillStyle='#6a4428'; ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=2.4; ctx.fillRect(-18,-10,36,20); ctx.strokeRect(-18,-10,36,20);
  ctx.strokeStyle='#4a2e18'; ctx.lineWidth=1.2; for(let i=-10;i<=10;i+=7){ ctx.beginPath(); ctx.moveTo(i,-10); ctx.lineTo(i,10); ctx.stroke(); }
  ctx.fillStyle='#e0b84a'; ctx.beginPath(); ctx.arc(10,0,3,0,TAU); ctx.fill();
  ctx.restore();
  if(!G.flags.c_nest) glowAt(x,y,34+Math.sin(t*3)*4,'255,210,140',0.28);
}
function c1DrawTideDoor(){
  const x=C1P.tide.x, y=C1P.tide.y;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='#5a4028'; ctx.strokeStyle='#22160a'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(-16,10); ctx.lineTo(-16,-18); ctx.quadraticCurveTo(0,-32,16,-18); ctx.lineTo(16,10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#e8d8a0'; ctx.fillRect(-20,-44,40,14); ctx.strokeRect(-20,-44,40,14);
  ctx.fillStyle='#3a2a18'; ctx.font=`800 8px ${UIF}`; ctx.textAlign='center'; ctx.fillText('TIDE HOUSE',0,-34);
  ctx.restore();
}
function c1DrawSilk(x,y){ const t=G.time; ctx.save(); ctx.translate(x,y); ctx.rotate(Math.sin(t*2)*0.2); ctx.fillStyle='#9a90b8'; ctx.strokeStyle='#3a3050'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(10,6,4,18); ctx.quadraticCurveTo(-6,10,0,0); ctx.fill(); ctx.stroke(); ctx.restore(); }
// ---------- the snow: every coast biome gets ambient snow 0.6 once G.flags.c_snow is set (x1_world dusts the ground)
// snow lying on the ground of the coast once it has fallen (drawn over the ground, under everything standing on it)
{ const base=drawPools; drawPools=function(){ base(); try{ if(G&&G.mode==='story'&&!AREA&&G.flags&&G.flags.c_snow&&curMap()===1){ ctx.fillStyle='rgba(238,243,250,.4)'; ctx.fillRect(cam.x-40,cam.y-40,W/zoom+80,H/zoom+80); } }catch(e){} }; }
{ const base=ambHere; ambHere=function(){ const a=base(); try{ if(a&&G&&G.flags&&G.flags.c_snow&&curMap()===1&&(a.snow||0)<0.6){ if(C1ST.ambSrc!==a){ C1ST.ambSrc=a; C1ST.amb=Object.assign({},a,{snow:0.6}); } return C1ST.amb; } }catch(e){} return a; }; }
// ---------- rests: Vesper's fish on Granny Oona's step (the Chowder Pot), the Warden's whisper ('warden' ending)
{ const base=innRest; innRest=function(){ base(); try{ c1Rested('inn'); }catch(e){ console.error(e); } }; }
{ const base=restAtShrine; restAtShrine=function(s){ base(s); try{ c1Rested('shrine'); }catch(e){ console.error(e); } }; }
function c1Rested(kind){
  if(!c1On()) return; const F=G.flags, ow=AREA?G.ow:player;
  if(kind==='inn'&&(G.stage==='c_salt'||G.stage==='c_claws')&&ow&&dist(ow.x,ow.y,C1P.salt.x,C1P.salt.y)<900&&!c1Seen('c_fishstep')) later(2.8,()=>c1When('fish',null,()=>c1Play('c_fishstep')));
  if(kind==='shrine'&&G.choices.ending==='warden'&&F.c_clock_on&&!F.c_warden_whisper&&curMap()===1) later(3,()=>c1When('warden',null,()=>c1Play('c_warden_whisper')));
}
STORY.c_warden_whisper=[
  xl('narr',`The shrine flame flickers red, then blue, then green, then gold, then white.`,`The shrine flame turns five colors.`),
  xl('iska',`(very far away, inside the flame) Ash. We're still here. All five of us. Keep your fire close. It's getting dark out there.`,`We are still here, Ash. Keep your fire close.`),
  xl('bram',`(even further away) AND EAT YOUR VEGETABLES!`,`EAT YOUR VEGETABLES!`),
  xdo(()=>{ G.flags.c_warden_whisper=1; })
];
// ---------- saves: transient state resets on a new run or a load (all story state lives in G.flags / G.choices)
function c1Reset(){ C1ST.cam=null; C1ST.glide=null; C1ST.sight=null; C1ST.trustSeen=null; C1ST.q=[]; C1ST.boss=null; C1ST.goat=null; C1ST.choiceRun=false; C1ST.preRoof=false; c1ChaseLights(false); }
{ const base=newRun; newRun=function(mode){ base(mode); try{ c1Reset(); }catch(e){} }; }
{ const base=loadGame; loadGame=function(s){ base(s); try{ c1Reset(); c1Migrate(); }catch(e){ console.error(e); } }; }
// starting Act II at a later stage (a test save, or a jump from a menu) gets the same implied world flags
{ const base=startAct; startAct=function(n,o){ const r=base(n,o); try{ if(r&&n===2){ c1Migrate(); setupNPCs(); } }catch(e){ console.error(e); } return r; }; }
// older Act II saves: flags implied by later stages (so a save from a stage past a beat never replays it)
function c1Migrate(){
  const F=G.flags; if(actOf(G.stage)!==2) return;
  const at=s=>reached(s);
  if(at('c_gear')){ c1sMark('c_arrive'); }
  if(at('c_salt')){ for(const k of ['c_gate','c_hettie','c_hester','c_chase_start','c_chase_end','c_note1']) c1sMark(k); F.c_hettie=F.c_hester=1; }
  if(at('c_claws')){ c1sMark('c_mina'); c1sMark('c_lowtide'); F.c_mina=1; F.c_lowtide=true; F.c_tide_fixed=1; }
  if(at('c_brass')){ c1sMark('c_cliff'); F.c_gull_done=1; }
  if(at('c_light')){ for(const k of ['c_nest','c_ambrose','c_clock_bong']) c1sMark(k); F.c_nest=F.c_ambrose=1; F.c_clock_on=true; }
  if(at('c_spire')){ for(const k of ['c_squawk','c_agatha','c_lamp_vesper']) c1sMark(k); F.c_squawk=F.c_agatha=F.c_cut=1; F.c_spire_up=true; F.c_bridge=1; }
  if(at('c_snow')){ F.c_choice_done=1; F.c_snow=true; F.c_shard1=true; if(!G.items.c_shard1) G.items.c_shard1=1; if(!G.choices.c_vesper) G.choices.c_vesper='foe'; c1Moon(95); }
}
// ---------- the journal: Vesper's card with her trust as moths (once her name is learned)
{ const base=renderJour; renderJour=function(){ base(); try{ c1JourCard(); }catch(e){ console.error(e); } }; }
function c1JourCard(){
  if(typeof jTab==='undefined'||jTab!=='people'||!G||!G.flags.c_nest) return;
  const el=document.querySelector('#jBody .ppl'); if(!el||el.querySelector('[data-c1v]')) return;
  const t=G.flags.c_trust|0, moth=on=>`<svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><path d="M8 6 C5 0 0 1 1 5 C2 9 6 9 8 6 C10 9 14 9 15 5 C16 1 11 0 8 6Z" fill="${on?'#ffcf4a':'#7a748a'}" stroke="#2a2034" stroke-width="1"/></svg>`;
  const d=document.createElement('div'); d.setAttribute('data-c1v','1');
  const bio=simplify(S('Gearhaven\'s rooftop thief, the Moth Mask. Granny Oona\'s granddaughter, from Saltmarsh. She climbs like Pearl.','The Moth Mask. Granny Oona\'s girl. She climbs like Pearl.'));
  const st=G.choices.c_vesper==='friend'?simplify(S('A friend.','A friend.')):G.choices.c_vesper==='foe'?simplify(S('Gone.','Gone.')):simplify(S('Trust','Trust'));
  d.innerHTML=`<b>Vesper</b> <span class="hz" title="${t} of 7">${Array.from({length:7},(_,i)=>moth(i<t)).join('')}</span><small>${escapeHtml(st)} · ${escapeHtml(bio)}</small>`;
  el.prepend(d);
}
// ---------- cross-act threads Act II owns (added only when the shared helper module has not added them already)
if(typeof DREAMS!=='undefined'){
  if(!DREAMS.c_twins) DREAMS.c_twins={stages:['c_brass'],title:S('The Basket by the Fire','The Basket by the Fire'),scene:'twins',lines:()=>[
    xl('narr',`You are Ember again. Grown up now. Two baby dragons sleep in a basket by the fire, curled up like cinnamon buns.`,`You are Ember, grown up. Two baby dragons sleep by the fire.`),
    xl('narr',`One sneezes in its sleep, and a little flame pops out. The other one sneezes too. Nothing comes out. Just a tiny cold puff. Then she climbs straight out of the basket and up the curtains.`,`One baby sneezes fire. The other has no fire. She climbs up the curtains instead!`),
    xl('iska',`That one has your fire. And this little one... doesn't. Will that be hard for her?`,`One has your fire. This one does not. Will that be hard?`),
    xc('ember',`What will you give her?`,`What will you give her?`,[
      xo(`A lantern of her own`,`A lantern of her own`,{fn:()=>{ G.flags.dr_c_twins='lantern'; },then:[xl('ember',`Here, little one. You don't need to breathe fire to carry a light.`,`You don't need fire to carry a light.`)]}),
      xo(`My warmest blanket`,`My warmest blanket`,{tone:'kind',fn:()=>{ G.flags.dr_c_twins='blanket'; },then:[xl('narr',`You lift her down off the curtains and tuck your warmest blanket round her. She stops shivering and smiles in her sleep.`,`You tuck a warm blanket round her. She smiles.`)]}),
      xo(`A promise`,`A promise`,{fn:()=>{ G.flags.dr_c_twins='promise'; },then:[xl('ember',`Fire isn't the only warm thing, little one. I promise.`,`Fire is not the only warm thing. I promise.`)]})]),
    xl('narr',`Later the little climber crawls back into the basket. The two of them sleep curled up together, one warm and one cold, and neither of them seems to mind.`,`Later both babies sleep together. One warm, one cold.`)]};
  if(!DREAMS.c_whisper) DREAMS.c_whisper={stages:['c_light'],title:S('The Moth at the Window','The Moth at the Window'),scene:'whisper',lines:()=>[
    xl('narr',`You dream you're home in Emberhollow. It's night. The forge is warm. Mom is humming.`,`You dream of home. It is night. Mom is humming.`),
    xl('narr',`Something taps at the window. Tap. Tap. A grey moth, with two pale moons painted on her wings.`,`Tap, tap. A grey moth is at the window.`),
    xc('nyxara',`Little ember. Would you like to never lose anything, ever again?`,`Little ember. Do you want to never lose anything again?`,[
      xo(`Who are you?`,`Who are you?`,{fn:()=>{ G.flags.dr_c_whisper='who'; },then:[xl('nyxara',`Someone who understands. Everyone leaves, dear. I can make it stop.`,`Someone who knows. Everyone leaves. I can stop it.`)]}),
      xo(`Go away.`,`Go away.`,{tone:'brave',fn:()=>{ G.flags.dr_c_whisper='go'; },then:[xl('nyxara',`Shh. I'll come back. I always come back. That's the thing about the night.`,`Shh. I will come back. The night always does.`)]}),
      xo(`...What do you mean?`,`What do you mean?`,{fn:()=>{ G.flags.dr_c_whisper='what'; },then:[xl('nyxara',`Your mother. Your friends. Everyone you love. One day they all go away. Unless the night never ends.`,`One day everyone goes away. Unless night never ends.`)]})]),
    xl('narr',`In the forge, a log falls and the fire flares up. The moth flutters away. You wake up cold.`,`The fire flares. The moth flies off. You wake up cold.`),
    xl('ash',`Just a bad dream. Just a bad dream.`,`Just a bad dream.`)]};
  if(typeof DREAM_ORDER!=='undefined') for(const id of ['c_twins','c_whisper']) if(!DREAM_ORDER.includes(id)){ const i=DREAM_ORDER.indexOf('home'); DREAM_ORDER.splice(i>=0?Math.max(i+1,DREAM_ORDER.length):DREAM_ORDER.length,0,id); }
  if(typeof DREAM_TALK!=='undefined'&&!DREAM_TALK.c_twins) DREAM_TALK.c_twins={c_oona:S(`You've got a dreaming look about you, duck. Sit by the stove a minute. Dreams go down easier warm.`,`You look dreamy, duck. Sit by the stove.`)};
}
if(typeof EV_TAMSIN!=='undefined'&&!EV_TAMSIN.some(v=>String(v&&v[1]).includes('moth mask'))) EV_TAMSIN.push([()=>!!(G&&G.flags&&G.flags.c_done),S(`\u{1F3B5} A thief in a moth mask ran off with our light, and Ash chased her south through the clockwork and night...`,`\u{1F3B5} Ash chased a thief through the night...`)]);
// Pebble's Act II letters (bible 8.2) and the Act II epilogue lines (8.8): only when the shared helper module
// (e7b_threads) is there and has not already filled them in
if(typeof PEBBLE_MAIL!=='undefined'&&Array.isArray(PEBBLE_MAIL)&&!PEBBLE_MAIL.some(m=>m&&String(m.id).startsWith('c_pb_'))) PEBBLE_MAIL.push(
  {id:'c_pb_1',from:'maren',when:()=>reached('c_coast'),lines:[
    c1If('maren',`Ash. The forge is very quiet without that stone humming in it. Catch that thief. Love, Mom.`,`The forge is so quiet. Catch that thief. Love, Mom.`,()=>G.flags.a1_heart!=='ward'),
    c1If('maren',`Ash. The mountain looks very bare without that stone on top. Catch that thief, and eat properly. Love, Mom.`,`The mountain looks bare. Catch that thief. Love, Mom.`,()=>G.flags.a1_heart==='ward'),
    c1If('maren',`P.S. The mountain is quiet. I keep looking at it anyway.`,`P.S. The mountain is quiet now.`,()=>G.choices.ending==='hero'),
    c1If('maren',`P.S. I climbed up and told your grandfather you'd gone south. He grunted. It was a nice grunt.`,`P.S. I told Grandpa. He grunted. A nice grunt.`,()=>G.choices.ending==='warden'),
    c1If('maren',`P.S. Your grandfather sits on the shelf above Bertram's oven and says, and I quote, "The hatchling will fail." Nobody listens. Bertram gives him the burnt ones.`,`P.S. Grandpa says you will fail. Nobody listens.`,()=>G.choices.ending==='heir'),
    c1If('maren',`P.S. Grandpa ate four of Bertram's buns and the doormat. He says hello. He says it with smoke.`,`P.S. Grandpa ate the doormat. He says hello.`,()=>G.choices.ending==='lantern'),
    xl('narr',`Pebble eyes your coin pouch. Pebble is Elder Yara's crow, and Pebble does not work for free.`,`Pebble wants a coin. She does not work for free.`)]},
  {id:'c_pb_2',from:'morrow',when:()=>!!G.flags.dr_c_whisper,lines:[
    c1If('narr',`The letter smells of pumpkins.`,`The letter smells of pumpkins.`,()=>G.choices.morrow!=='jail'),
    c1If('narr',`The letter is stamped "Watch House Library. Please Return."`,`The letter is from the Watch House.`,()=>G.choices.morrow==='jail'),
    xl('morrow',`Young Ash. Word reaches even my pumpkins. A voice in your dreams that promises you things? I had one of those once. Do not answer it. Ever. Morrow.`,`A voice in your dreams? I had one once. Don't answer it. Morrow.`),
    c1If('morrow',`P.S. The cells are in alphabetical order now.`,`P.S. I tidied the cells.`,()=>G.choices.morrow==='jail')]},
  {id:'c_pb_3',from:'yara',when:()=>(G.flags.moon==null?100:G.flags.moon)<100,lines:[
    xl('yara',`I counted the moon tonight. That sounds strange. But it is smaller, Ash. By about one bite. Pebble and I are keeping an eye on it.`,`The moon is one bite smaller. Pebble and I are watching it.`)]},
  {id:'c_pb_4',from:'maren',when:()=>!!G.flags.c_clock_on,lines:[
    xl('maren',`Ash! Pebble says you fixed a CLOCK. A whole city's clock! I told everyone. I told the chickens.`,`You fixed a whole city's clock! I told the chickens.`),
    xl('maren',`Yara says the best smith on that coast is Ingrid Anvilsong. Tell her I said her braids are too long for a forge. Tell her nicely. She's bigger than me.`,`Tell Ingrid her braids are too long for a forge. Nicely!`),
    c1If('maren',`Fennick sends a can of his Brightest Lamp Oil. He says it's for "any lamp that's having a bad night." He's been very good, you know. Every lantern, every night.`,`Fennick sent lamp oil, for any lamp having a bad night.`,()=>G.choices.fennick==='forgive'),
    c1If('maren',`Tikka sent you a bun. It's lumpy. It's wonderful. Eat it when you're hurt.`,`Tikka sent a lumpy bun. Eat it when you are hurt.`,()=>!!G.flags.tk_home),
    xl('maren',`Wendel wrote you a poem. "Ash, Ash, as brave as an eyelash." He says eyelashes are very brave. They stand in front of your eyes all day.`,`Wendel wrote a poem: "Ash, Ash, as brave as an eyelash."`),
    xl('maren',`I keep a lantern lit in the window every night, like I said I would. Yara says she can see it from her porch.`,`My lantern is in the window every night.`),
    xl('maren',`Love, Mom. P.S. It's very cold here for summer. Odd.`,`Love, Mom. P.S. It is cold here. Odd.`),
    xdo(()=>{ if(G.choices.fennick==='forgive') giveItems({c_lampoil:1}); if(G.flags.tk_home) giveItems({c_lumpybun:1}); })]},
  {id:'c_pb_5',from:'wren',when:()=>reached('c_salt'),lines:[
    c1If('wren',`Dear Ash. Remember the torn page? Ember's other child sailed south, with no fire. And now you have gone south too. Well, walked. Same thing.`,`Dear Ash. The torn page said Ember's other child went south. Now you have too!`,()=>!!(G.quests.a1_moth&&G.quests.a1_moth.done)),
    c1If('wren',`Dear Ash. My oldest books say a girl with horns once went south over the pass, a very long time ago, with a rope and a lantern. And now YOU have gone south. Well, walked. Same thing.`,`Dear Ash. Long ago a girl with horns went south. Now you have too!`,()=>!(G.quests.a1_moth&&G.quests.a1_moth.done)),
    xl('wren',`My old friend Ottoline keeps the Turning Library in Gearhaven. We have written to each other for thirty years and never once agreed about anything. It's been wonderful.`,`My friend Ottoline runs the library there. We never agree. It is wonderful.`),
    xl('wren',`Ask her about the old logbook on her shelves, the one with pages missing. And tell her she's wrong about commas. Your friend, Sister Wren.`,`Ask her about the old logbook. Your friend, Wren.`)]},
  {id:'c_pb_6',from:'wren',when:()=>!!G.flags.c_diary_sent,lines:[
    xl('wren',`Ash. Ottoline copied out the moon letters from that girl's diary and sent them to me. They are very old. Older than the Wardens.`,`The moon letters in the diary are very, very old.`),
    xl('wren',`They spell the same two words over and over. "Stay." And "Keep." I don't like this, Ash. I don't like it at all.`,`They spell "Stay" and "Keep." I don't like it.`),
    xl('wren',`Keep your fire close. Wren.`,`Keep your fire close. Wren.`)]},
  {id:'c_pb_7',from:'quill',when:()=>(G.flags.moon==null?100:G.flags.moon)<100,lines:[
    xl('quill',`The moon is five percent smaller. I measured twice. I hate it.`,`The moon is smaller. I measured!`),
    xl('quill',`I have checked my telescope, my glasses and my eyes. All fine. The moon is not. Professor Quill.`,`It is not my glasses. Professor Quill.`)]});
if(typeof ITEM_NAMES!=='undefined'){ if(!ITEM_NAMES.c_lampoil) ITEM_NAMES.c_lampoil=S("Fennick's Brightest Lamp Oil","Fennick's lamp oil"); if(!ITEM_NAMES.c_lumpybun) ITEM_NAMES.c_lumpybun=S("Tikka's lumpy bun","Tikka's lumpy bun"); }
if(typeof EPI!=='undefined'&&EPI&&Array.isArray(EPI.c)&&!EPI.c.length) EPI.c.push(
  {pri:9,cond:()=>G.choices.c_vesper==='friend',line:['narr',S(`Vesper Saltwhistle still climbs the Great Clock every night. Now she sits on the top and waves at the moon, and Granny Oona leaves the window open for her.`,`Vesper still climbs the Great Clock. Now Gran leaves the window open.`)]},
  {pri:8,cond:()=>G.choices.c_vesper==='foe',line:['narr',S(`Nobody on the coast saw the Moth Mask again. But every winter, Granny Oona found a fish on her step, with a little bow on it.`,`Every winter, Gran found a fish on her step.`)]},
  {pri:6,cond:()=>!!(G.quests.c_oona&&G.quests.c_oona.done),line:['narr',S(`Granny Oona's stove never went out again. She keeps a kettle on it for anyone who climbs in through the window.`,`Gran's stove never went out again.`)]},
  {pri:5,cond:()=>!!(G.quests.c_bolt&&G.quests.c_bolt.done),line:['narr',S(`Bolt the brass dog learned to fetch. Every morning he fetches Lord Whirligig's hat.`,`Bolt fetches Lord Whirligig's hat every day.`)]},
  {pri:4,cond:()=>!!(G.quests.c_bob&&G.quests.c_bob.done),line:['narr',S(`Captain Ticklebrass promoted all three Bobs. They now have one very long badge between them.`,`All three Bobs got one long badge.`)]},
  {pri:3,cond:()=>!!G.flags.c_regatta_won,line:['narr',S(`The Harbor Regatta has a new rule: no dragons. It's called the Ash Rule.`,`The Regatta has a new rule: no dragons.`)]},
  {pri:2,cond:()=>true,line:['narr',S(`The Great Clock has not stopped once since. Clockkeeper Ambrose says "Tick." Everyone agrees.`,`The Great Clock never stopped again.`)]});
// moths crowd the lamps at night in Gearhaven (THREADS N4), and the kids notice the bitten moon
B('c1_moths','town:c_gearhaven',()=>c1On()&&isNight()&&!G.flags.c_snow,()=>pick([S('Never seen so many moths. They are eating my curtains. And my clocks.','So many moths! They eat my curtains!'),S('The moths ate a hole in my best curtain last night. Shaped like a moth.','The moths ate my curtain!')]));
B('c1_moon','kid',()=>!!G.flags&&(G.flags.moon==null?100:G.flags.moon)<100&&(G.flags.moon==null?100:G.flags.moon)>=95,S('Somebody took a bite out of the moon! Was it you?','Who bit the moon? Was it you?'));

// ---------- 6. the rooftop chase (MINI.c_roofchase): Whirligig Manor to the Clockwatch Hall, over the Clock Quarter.
// The roofs are a layer of their own, drawn over the town: while the chase runs Ash is up on them (houses and
// cliffs below do not block him; the edges of the roofs do), gaps drop him back to the last roof, the step needs a
// Double Jump (or the slower ladder at its side), the conveyor bridge lurches, chimneys puff steam on a beat, and a
// clothesline slides him down to the last roof. She runs at 115 percent of Ash's walk and drops moth bombs.
const C1R={w:112,
  // [x0,y0,x1,y1,kind]: roof, gap, conv, steam, step, line, dome (the dome segments follow an arc)
  segs:[[7950,24870,8200,24800,'roof'],[8200,24800,8220,24620,'roof'],[8220,24620,7990,24600,'roof'],[7990,24600,7910,24600,'gap'],
    [7910,24600,7740,24700,'roof'],[7740,24700,7640,24810,'roof'],[7640,24810,7531,24797,'gap2'],[7531,24797,7470,24610,'roof'],
    [7470,24610,7438,24530,'dome'],[7438,24530,7445,24440,'dome'],[7445,24440,7490,24365,'dome'],[7490,24365,7380,24380,'roof'],
    [7380,24380,7200,24400,'conv'],[7200,24400,7120,24360,'roof'],[7120,24360,6960,24340,'steam'],[6960,24340,6890,24450,'roof'],
    [6890,24450,6866,24530,'step'],[6866,24530,6820,24610,'roof'],[6820,24610,6650,24660,'line'],[6650,24660,6700,24520,'roof']],
  chim:[0.22,0.52,0.82], bobs:[[0.18,`Bob! She went left!`,`She went left!`],[0.2,`Our left or her left, Bob?`,`Our left or hers?`],[0.24,`...Yes!`,`Yes!`],[0.55,`Run, Mostly Part Dragon, run!`,`Run, dragon, run!`],[0.8,`Mind the laundry!`,`Mind the laundry!`]]};
(function c1RouteInit(){
  let s=0; C1R.L=[];
  for(const q of C1R.segs){ const [x0,y0,x1,y1,k]=q, len=Math.hypot(x1-x0,y1-y0); C1R.L.push({x0,y0,x1,y1,k,len,s0:s,s1:s+len,ux:(x1-x0)/len,uy:(y1-y0)/len}); s+=len; }
  C1R.total=s;
  C1R.waits=[]; let n=0; for(const g of C1R.L){ if(g.k==='roof'&&(n++)%2===1) C1R.waits.push(g.s0+g.len*0.6); }
})();
// position on the route at distance s
function c1RAt(s){ s=clamp(s,0,C1R.total); for(const g of C1R.L) if(s<=g.s1+0.001){ const t=(s-g.s0)/g.len; return {x:g.x0+(g.x1-g.x0)*t,y:g.y0+(g.y1-g.y0)*t,g}; } const g=C1R.L[C1R.L.length-1]; return {x:g.x1,y:g.y1,g}; }
// nearest point of the route to (x,y): {s, d, g}
function c1RProj(x,y){ let best=null; for(const g of C1R.L){ const t=clamp(((x-g.x0)*g.ux+(y-g.y0)*g.uy),0,g.len), px=g.x0+g.ux*t, py=g.y0+g.uy*t, d=Math.hypot(x-px,y-py); if(!best||d<best.d) best={s:g.s0+t,d,g,px,py}; } return best; }
const c1RChase=()=>!!(G&&G.mini&&G.mini.kind==='c_roofchase');
// while chasing: no flying over it all, no houses or cliffs underneath, the roof edges hold Ash in
{ const base=canFlyHere; canFlyHere=function(){ if(c1RChase()) return false; return base(); }; }
{ const base=collideObs; collideObs=function(e){ if(e===player&&c1RChase()) return; return base(e); }; }
{ const base=terrainFix; terrainFix=function(e,ox,oy){ if(e===player&&c1RChase()) return c1RConfine(e,ox,oy); return base(e,ox,oy); }; }
{ const base=landOK; landOK=function(x,y){ if(c1RChase()&&x<IZX-50) return c1RProj(x,y).d<C1R.w/2+4; return base(x,y); }; }
{ const base=addOccluders; addOccluders=function(list){ if(c1RChase()) return; return base(list); }; }
// x1_world gives the Clock Quarter real height (level 2 streets, level 3 roofs, towers): the chase runs on its own roof
// layer, so while it runs the faces underneath neither stop, climb nor hop Ash; the route's edges are the only walls
{ const base=updatePlayer; updatePlayer=function(dt,inp){ if(c1RChase()&&!AREA&&typeof ELV!=='undefined'){ ELV.ign++; try{ return base(dt,inp); } finally{ ELV.ign--; } } return base(dt,inp); }; }
{ const base=playerBlocked; playerBlocked=function(x,y){ if(c1RChase()&&x<IZX-50) return c1RBlocked(x,y,G.mini); return base(x,y); }; }
// (and the foe push after the move: e3 puts an Ash it finds inside a face back where he last stood on the ground,
// so in mid-jump over a face below the roofs he was snapped back to his take-off spot and fell into the wide gap)
{ const base=separate; separate=function(){ if(c1RChase()&&!AREA&&typeof ELV!=='undefined'){ ELV.ign++; try{ return base(); } finally{ ELV.ign--; } } return base(); }; }
function c1RBlocked(x,y,M){
  const P=c1RProj(x,y); if(P.d>C1R.w/2) return true;
  // the step: a short wall across the roof that only a Double Jump (high enough) or the ladder gets over
  if(M&&!M.stepUp){ const st=M.stepS; if(P.s>st-2&&M.as<st-2){ const p=player; if(!(p.dbl&&(p.z||0)>10)) return true; } }
  return false;
}
function c1RConfine(e,ox,oy){
  const M=G.mini; if(!c1RBlocked(e.x,e.y,M)) return;
  if(!c1RBlocked(e.x,oy,M)) e.y=oy; else if(!c1RBlocked(ox,e.y,M)) e.x=ox; else { e.x=ox; e.y=oy; }
  e.hitWall=true;
}
MINI.c_roofchase={
  start(){
    const p=player, st=C1R.L.find(g=>g.k==='step');
    p.x=C1R.L[0].x0+C1R.L[0].ux*10; p.y=C1R.L[0].y0+C1R.L[0].uy*10; p.z=0; p.vz=0; p.flying=false; p.kvx=p.kvy=0;
    G.fade=0.8; G.tod=Math.max(G.tod,0.86);
    c1ChaseLights(true); G.banner=null; G.bannerQ=[];
    setBanner(S('Chase the Moth Mask!','Chase the Moth Mask!'),S(`Don't lose sight of her. Sprint, and jump the gaps!`,`Don't lose her! Run and jump!`),3.2);
    return {music:'combat',ms:120,mv:0,as:0,far:0,bombT:3,bombs:[],safeS:0,fall:0,stepS:st.s0+st.len*0.5,stepUp:false,ladder:null,lurchT:0,lurch:0,slide:null,
      wait:0,wi:0,bobI:0,mx:0,my:0,mz:0,face:-1,swing:0,lose:c1Easy()?{d:800,t:8}:{d:600,t:5},done:false,bumps:0,tipped:false};
  },
  update(M,dt){
    const p=player, easy=c1Easy();
    if(M.done) return;
    // Ash's progress along the roofs
    const P=c1RProj(p.x,p.y); M.as=P.s; const air=(p.z||0)>2||p.flying;
    const g=P.g;
    // the ladder beside the step (no Double Jump, or it keeps failing): climbing takes a moment
    if(M.ladder){ M.ladder.t+=dt; p.x=M.ladder.x; p.y=M.ladder.y-Math.min(1,M.ladder.t/1.5)*26; p.kvx=p.kvy=0; if(M.ladder.t>=1.5){ const q=c1RAt(M.stepS+30); p.x=q.x; p.y=q.y; M.stepUp=true; M.ladder=null; M.safeS=M.stepS+30; } }
    else if(M.slide){ M.slide.s+=dt*430; const q=c1RAt(M.slide.s); p.x=q.x; p.y=q.y; p.z=6+Math.sin(M.slide.s*0.05)*2; if(M.slide.s>=M.slide.end){ M.slide=null; p.z=0; M.safeS=g.s1+10; } }
    else{
      if(!M.stepUp&&M.as>M.stepS+4) M.stepUp=true;
      // the ladder: walk into the side of the step
      if(!M.stepUp){ const lad=c1RLadder(M); if(dist(p.x,p.y,lad.x,lad.y)<30&&!air){ M.ladder={x:lad.x,y:lad.y,t:0}; bubble(p,S('Up the ladder!','Up the ladder!'),{who:'Ash',col:'#ffb070',dy:-52}); } }
      if(!M.stepUp&&Math.abs(P.s-(M.stepS-6))<16&&!air){ M.bumps+=dt; if(M.bumps>1.2&&!M.tipped){ M.tipped=true; setBanner(S('Too high!','Too high!'),hasAbil('dbljump')||(typeof canDblJump==='function'&&canDblJump())?S('Jump, then jump again in the air (Double Jump). Or take the ladder on the side.','Double Jump! Or use the ladder.'):S('Take the ladder on the side. A Double Jump would be quicker.','Use the ladder on the side.'),3.4); } }
      // the clothesline
      if(g.k==='line'&&P.s<g.s0+28&&!M.slide){ M.slide={s:g.s0+4,end:g.s1}; bubble(p,S('Wheeeee!','Wheeee!'),{who:'Ash',col:'#ffb070',dy:-52}); try{ SFX.play('roll'); }catch(e){} }
      // a gap: landing in it drops Ash back to the roof before it
      const lip=easy?22:14, inGap=(g.k==='gap'||g.k==='gap2')&&P.s>g.s0+lip&&P.s<g.s1-lip-6;
      if(inGap&&!air) c1RFall(M,g.s0-34,S('Whoa!','Whoa!'));
      else if(g.k!=='gap'&&g.k!=='gap2'&&!air&&g.k!=='conv') M.safeS=Math.max(M.safeS,Math.min(P.s,g.s1-8));
      // the conveyor bridge lurches: on it without jumping when it does, Ash is thrown back
      M.lurchT+=dt; const per=easy?3.4:c1Hard()?2.2:2.7;
      if(M.lurchT>per-0.6&&!M.lurchWarn){ M.lurchWarn=true; try{ SFX.play('block',0.7); }catch(e){} }
      if(M.lurchT>=per){ M.lurchT=0; M.lurchWarn=false; M.lurch=0.35; shake(2); if(g.k==='conv'&&!air) c1RFall(M,g.s0-26,S('The bridge lurched!','It lurched!')); }
      if(M.lurch>0) M.lurch-=dt;
      // chimney steam on a beat
      if(g.k==='steam'&&!(M.steamCd>G.time)){ for(let i=0;i<C1R.chim.length;i++){ if(!c1RSteam(M,i)) continue; const q=c1RAt(g.s0+g.len*C1R.chim[i]); if(dist(p.x,p.y,q.x,q.y)<40&&(p.z||0)<16){ M.steamCd=G.time+0.7; p.kvx=-g.ux*240; p.kvy=-g.uy*240; p.slowT=Math.max(p.slowT||0,0.5); if(!(M.coughT>G.time)){ M.coughT=G.time+1.6; bubble(p,S('*cough* Steam!','*cough*'),{who:'Ash',col:'#ffb070',dy:-52}); } break; } } }
    }
    // the Moth Mask runs ahead (and waits at every second roof on Easy)
    const gap=M.ms-M.as, walk=(p.stats&&p.stats.speed)||200;
    let v=walk*1.15*(easy?0.92:1);
    if(gap<90) v=Math.max(v,330);
    if(easy&&M.wi<C1R.waits.length&&M.ms>=C1R.waits[M.wi]){ if(gap>230){ v=0; M.wait+=dt; if(M.wait>0.2&&!(M.yoT>G.time)){ M.yoT=G.time+3; c1RSay(M,[S('Over here! Try to keep up!','Over here!'),S('Coming, little ember?','Coming?'),S('I can wait. Not for long.','I can wait.')]); } } else { M.wi++; M.wait=0; } }
    if(M.ms>=C1R.total-30){ M.ms=C1R.total-30; v=0; }
    M.ms=Math.min(C1R.total-30,M.ms+v*dt);
    const mq=c1RAt(M.ms); M.face=mq.g.ux<0?-1:1; M.mx=mq.x; M.my=mq.y; M.mz=(mq.g.k==='gap'||mq.g.k==='gap2')?Math.sin(clamp((M.ms-mq.g.s0)/mq.g.len,0,1)*Math.PI)*(mq.g.k==='gap2'?54:34):mq.g.k==='line'?8:0;
    M.swing=mq.g.k==='gap2'?1:Math.max(0,M.swing-dt*2);
    // moth bombs: a sparkle, then a slowing cloud
    M.bombT-=dt; if(M.bombT<=0&&M.ms<C1R.total-120){ M.bombT=6; M.bombs.push({x:M.mx,y:M.my,t:0}); }
    for(const b of M.bombs){ b.t+=dt; if(b.t>0.6&&b.t<2.6&&dist(p.x,p.y,b.x,b.y)<56&&!air){ p.slowT=Math.max(p.slowT||0,0.3); if(!b.hit){ b.hit=true; bubble(p,S('Moth dust! Achoo!','Achoo!'),{who:'Ash',col:'#ffb070',dy:-52}); } } }
    M.bombs=M.bombs.filter(b=>b.t<2.8);
    // the Bobs shout from the street below
    if(M.bobI<C1R.bobs.length&&M.as/C1R.total>=C1R.bobs[M.bobI][0]){ const b=C1R.bobs[M.bobI++], q=c1RAt(M.as); bubble({x:q.x+70,y:q.y+120},S(b[1],b[2]),{who:'Bob',col:'#3a6ac8',dy:-30}); }
    // losing her: too far behind for too long
    if(M.ms-M.as>M.lose.d) M.far+=dt; else M.far=Math.max(0,M.far-dt*2);
    if(M.far>M.lose.t){ M.done=true; c1RLose(); return; }
    // the end of the roofs
    if(M.as>=C1R.total-48&&!air){ M.done=true; c1RWin(); }
  },
  target:M=>({x:M.mx,y:M.my}),
  hud:M=>{ const far=M.ms-M.as>M.lose.d*0.7; return far?S(`She's getting away! Run!`,`She's getting away!`):S(`Chase the Moth Mask! Don't lose sight of her.`,`Chase the Moth Mask!`); },
  end(M,win){ c1ChaseLights(false); },
  draw(M,t){ c1RDraw(M,t); }
};
function c1RSay(M,opts){ bubble({x:M.mx,y:M.my-M.mz},pick(opts),{who:SPK.c_mask.name,col:SPK.c_mask.col,dy:-60}); }
// the chimneys puff in a rolling wave (one after the other), with a clear moment after each wave
function c1RSteamPh(i){ const per=c1Easy()?2.8:c1Hard()?2.0:2.4, on=c1Easy()?0.6:c1Hard()?0.9:0.8; return {ph:(G.time-i*0.25+per*8)%per,per,on}; }
function c1RSteam(M,i){ const q=c1RSteamPh(i); return q.ph<q.on; }
function c1RLadder(M){ const q=c1RAt(M.stepS-30), g=q.g; return {x:q.x-g.uy*(C1R.w/2-6),y:q.y+g.ux*(C1R.w/2-6)}; }
function c1RFall(M,s,txt){
  const p=player, q=c1RAt(Math.max(0,Math.min(M.safeS,s))); M.fall++;
  emit(p.x,p.y,14,{col:'150,130,110',glow:false,smin:20,smax:80,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:5});
  p.x=q.x; p.y=q.y; p.z=0; p.vz=0; p.kvx=p.kvy=0; G.fade=0.5; ftext(p.x,p.y-40,txt,'#ffd9a0',15); try{ SFX.play('warn',0.6); }catch(e){}
}
function c1RWin(){
  G.flags.c_chase_won=1;
  later(0.05,()=>{
    miniEnd(true,S('Caught up!','Caught up!'),S('The roofs end at the Clockwatch Hall.','The roofs end here.'));
    const p=player, S0=c1SightAt(p.x+46,p.y-26,'wait'); S0.face=1;
    C1ST.cam={x:(p.x+C1P.clock.x)/2,y:p.y,k:0.6};
    c1Chain(['c_chase_end','c_note1'],()=>{ C1ST.sight=null; gainXp(600); addCoins(60); c1RDown(); goStage('c_salt'); });
  });
}
function c1RLose(){
  G.flags.c_chase_lost=(G.flags.c_chase_lost|0)+1; C1ST.chaseRetryAt=G.time+4;
  later(0.05,()=>{ miniEnd(false,S('She got away!','She got away!'),S('Wait by Whirligig Manor to try again.','Wait by the manor. Try again!')); c1RDown(true); });
}
// back down to the street (a safe spot near the end, or near the manor after a loss)
function c1RDown(lost){
  const p=player, to=lost?{x:C1P.manor.x+40,y:C1P.manor.y+140}:{x:C1P.hall.x+150,y:C1P.hall.y+240};
  let at=to; try{ if(typeof nearestLand==='function'){ const s=nearestLand(to.x,to.y); if(s) at=s; } }catch(e){}
  p.x=at.x; p.y=at.y; p.z=0; p.vz=0; G.fade=0.9; updateCam(0,true);
}
// starting the chase: night, near the manor, after the briefing
function c1ChaseWatch(dt){
  const F=G.flags;
  if(!F.c_hester||G.mini||!c1Out()||scene!=='play'||!isNight()||F.c_chase_won) return;
  if(dist(player.x,player.y,C1P.manor.x,C1P.manor.y)>380) return;
  // after a loss Ash is set down by the manor: a few seconds to breathe (or walk off) before round two starts by itself
  if(G.time<(C1ST.chaseRetryAt||0)) return;
  const S0=c1SightAt(C1R.L[0].x0+40,C1R.L[0].y0-10,'wait'); S0.face=1;
  C1ST.cam={x:C1R.L[0].x0,y:C1R.L[0].y0,k:0.6}; c1ChaseLights(true); C1ST.preRoof=true;
  c1Play(c1Seen('c_chase_start')?STORY.c_chase_retry:'c_chase_start',()=>{ C1ST.sight=null; C1ST.preRoof=false; later(0.1,()=>startMini('c_roofchase',null)); });
}
// lights along the route while it runs (the night is dark)
function c1ChaseLights(on){
  for(const L of C1ST.lights){ const i=LIGHTS.indexOf(L); if(i>=0) LIGHTS.splice(i,1); } C1ST.lights.length=0;
  if(!on) return;
  for(let s=60;s<C1R.total;s+=200){ const q=c1RAt(s); const L={x:q.x,y:q.y-30,r:260,i:0.7,fire:true,c1:true}; C1ST.lights.push(L); LIGHTS.push(L); }
}
// the roofs drawn while she waits on the manor roof (the chase-start scene), so she stands on something
const C1_ROOF0={bombs:[],stepUp:false,lurch:0,lurchT:0,swing:0,ms:0,as:0,mx:0,my:0,mz:0,face:1,wait:0,stepS:0};
function c1RoofPreview(list){
  if(!C1ST.preRoof||G.mini||AREA) return;
  if(!C1_ROOF0.stepS){ const st=C1R.L.find(g=>g.k==='step'); C1_ROOF0.stepS=st.s0+st.len*0.5; }
  list.push({x:C1R.L[0].x0,y:-1e9,draw:()=>c1RDraw(C1_ROOF0,G.time,true)});
}
// ---------- drawing the roofs (one pass, cached per segment kind; cheap shapes only)
function c1RDraw(M,t,noMask){
  const w=C1R.w, h2=w/2;
  ctx.save();
  // shadows below the roofs, so they read as high up over the street
  ctx.fillStyle='rgba(10,8,20,.42)';
  for(const g of C1R.L){ if(g.k==='gap'||g.k==='gap2'||g.k==='line') continue; const nx=-g.uy*h2, ny=g.ux*h2; ctx.beginPath(); ctx.moveTo(g.x0+nx+8,g.y0+ny+22); ctx.lineTo(g.x1+nx+8,g.y1+ny+22); ctx.lineTo(g.x1-nx+8,g.y1-ny+22); ctx.lineTo(g.x0-nx+8,g.y0-ny+22); ctx.closePath(); ctx.fill(); }
  for(const g of C1R.L){
    if(!inView((g.x0+g.x1)/2,(g.y0+g.y1)/2,g.len/2+w)) continue;
    const nx=-g.uy*h2, ny=g.ux*h2, ex=g.ux*6, ey=g.uy*6;
    const quad=(k0,k1,col,out)=>{ ctx.beginPath(); ctx.moveTo(g.x0+nx*k0-ex,g.y0+ny*k0-ey); ctx.lineTo(g.x1+nx*k0+ex,g.y1+ny*k0+ey); ctx.lineTo(g.x1+nx*k1+ex,g.y1+ny*k1+ey); ctx.lineTo(g.x0+nx*k1-ex,g.y0+ny*k1-ey); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); if(out){ ctx.strokeStyle=out; ctx.lineWidth=3; ctx.stroke(); } };
    if(g.k==='gap'||g.k==='gap2'){
      // the drop: a dark street with two lamp glows, and roof lips at both ends
      quad(1.2,-1.2,'rgba(8,6,16,.75)'); ctx.strokeStyle='rgba(255,210,140,.55)'; ctx.setLineDash([6,8]); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(g.x0+nx*1.1,g.y0+ny*1.1); ctx.lineTo(g.x0-nx*1.1,g.y0-ny*1.1); ctx.moveTo(g.x1+nx*1.1,g.y1+ny*1.1); ctx.lineTo(g.x1-nx*1.1,g.y1-ny*1.1); ctx.stroke(); ctx.setLineDash([]);
      if(g.k==='gap2'){ const ax=(g.x0+g.x1)/2, ay=(g.y0+g.y1)/2-90; ctx.fillStyle='#4a3a28'; ctx.fillRect(ax-3,ay-6,6,6); glowAt(ax,ay,20,'255,220,150',0.3); }
      continue;
    }
    if(g.k==='line'){
      // two posts and a sagging line with washing on it
      ctx.strokeStyle='#e8e0d0'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(g.x0,g.y0-30); ctx.quadraticCurveTo((g.x0+g.x1)/2,(g.y0+g.y1)/2-6,g.x1,g.y1-22); ctx.stroke();
      for(let i=1;i<6;i++){ const k=i/6, x=lerp(g.x0,g.x1,k), y=lerp(g.y0-30,g.y1-22,k)+Math.sin(k*Math.PI)*16; ctx.fillStyle=['#e86a5a','#5aa0e8','#f0d050','#8ad05a','#e0a0d0'][i%5]; ctx.fillRect(x-7,y,14,16+Math.sin(t*3+i)*2); }
      for(const [x,y] of [[g.x0,g.y0],[g.x1,g.y1]]){ ctx.fillStyle='#5a3a20'; ctx.fillRect(x-3,y-34,6,34); }
      continue;
    }
    const col=g.k==='conv'?'#6a6a72':g.k==='dome'?'#5a8a9a':'#9a4a3a', col2=g.k==='conv'?'#4a4a52':g.k==='dome'?'#3e6a7a':'#7a3428';
    quad(1,-1,col,'#1a1018');
    // tiles (ridge line and stripes)
    ctx.strokeStyle=col2; ctx.lineWidth=2; const n=Math.max(1,Math.floor(g.len/22));
    for(let i=1;i<n;i++){ const k=i/n, x=g.x0+(g.x1-g.x0)*k, y=g.y0+(g.y1-g.y0)*k; ctx.beginPath(); ctx.moveTo(x+nx*0.9,y+ny*0.9); ctx.lineTo(x-nx*0.9,y-ny*0.9); ctx.stroke(); }
    ctx.strokeStyle='rgba(255,230,200,.35)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(g.x0,g.y0); ctx.lineTo(g.x1,g.y1); ctx.stroke();
    if(g.k==='conv'){ const sh=M.lurch>0?Math.sin(t*60)*3:0, warn=M.lurchT>(c1Easy()?2.8:c1Hard()?1.6:2.1); ctx.strokeStyle=warn?'#ffb050':'#2a2a30'; ctx.lineWidth=3; for(let i=0;i<n;i++){ const k=(i+((G.time*0.4)%1))/n, x=g.x0+(g.x1-g.x0)*k+sh, y=g.y0+(g.y1-g.y0)*k; ctx.beginPath(); ctx.arc(x,y,7,0,TAU); ctx.stroke(); } }
    if(g.k==='steam') for(let i=0;i<C1R.chim.length;i++){ const q=c1RAt(g.s0+g.len*C1R.chim[i]), x=q.x+nx*0.7, y=q.y+ny*0.7; ctx.fillStyle='#5a4a44'; ctx.fillRect(x-8,y-26,16,26); ctx.strokeStyle='#1a1018'; ctx.lineWidth=2; ctx.strokeRect(x-8,y-26,16,26);
      const sq=c1RSteamPh(i), on=sq.ph<sq.on, warn=!on&&sq.ph>sq.per-0.45;
      if(on){ for(let j=0;j<5;j++){ ctx.fillStyle=`rgba(236,236,244,${0.55-j*0.08})`; ctx.beginPath(); ctx.arc(q.x+Math.sin(t*4+j)*6,q.y-10-j*10,18+j*5,0,TAU); ctx.fill(); } }
      else if(warn){ ctx.fillStyle='rgba(255,220,180,.6)'; ctx.beginPath(); ctx.arc(x,y-30,5,0,TAU); ctx.fill(); } }
    if(g.k==='step'){ const sx=g.x0+g.ux*g.len*0.5, sy=g.y0+g.uy*g.len*0.5; ctx.fillStyle='#d8cfc0'; ctx.strokeStyle='#1a1018'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(sx+nx,sy+ny); ctx.lineTo(sx-nx,sy-ny); ctx.lineTo(sx-nx-g.ux*14,sy-ny-g.uy*14-16); ctx.lineTo(sx+nx-g.ux*14,sy+ny-g.uy*14-16); ctx.closePath(); ctx.fill(); ctx.stroke();
      if(!M.stepUp){ const L=c1RLadder(M); ctx.strokeStyle='#8a5a2a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(L.x-7,L.y+6); ctx.lineTo(L.x-7,L.y-36); ctx.moveTo(L.x+7,L.y+6); ctx.lineTo(L.x+7,L.y-36); for(let k=0;k<5;k++){ ctx.moveTo(L.x-7,L.y-k*9); ctx.lineTo(L.x+7,L.y-k*9); } ctx.stroke(); } }
  }
  // the end: the Clockwatch Hall roof with its whistle weathervane
  { const e=C1R.L[C1R.L.length-1]; ctx.fillStyle='#e0b84a'; ctx.beginPath(); ctx.arc(e.x1,e.y1-40,6,0,TAU); ctx.fill(); ctx.strokeStyle='#1a1018'; ctx.lineWidth=2; ctx.stroke(); ctx.fillRect(e.x1-1.5,e.y1-34,3,30); }
  // moth bombs
  for(const b of M.bombs){ if(b.t<0.6){ for(let i=0;i<6;i++){ const a=i/6*TAU+t*4; ctx.fillStyle='rgba(230,230,255,.9)'; ctx.beginPath(); ctx.arc(b.x+Math.cos(a)*12,b.y+Math.sin(a)*8,2,0,TAU); ctx.fill(); } }
    else{ const k=1-(b.t-0.6)/2.2; ctx.fillStyle=`rgba(200,196,230,${0.45*k})`; ctx.beginPath(); ctx.ellipse(b.x,b.y,56,40,0,0,TAU); ctx.fill(); for(let i=0;i<8;i++){ ctx.fillStyle=`rgba(255,255,255,${0.7*k})`; ctx.fillRect(b.x+Math.sin(i*2.1+t)*40,b.y+Math.cos(i*1.7+t)*26,2,2); } } }
  // her rope over the wide gap
  if(M.swing>0.05){ const g=C1R.L.find(q=>q.k==='gap2'), ax=(g.x0+g.x1)/2, ay=(g.y0+g.y1)/2-90; ctx.strokeStyle=`rgba(230,220,200,${M.swing})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(M.mx,M.my-M.mz-30); ctx.stroke(); }
  ctx.restore();
  // the Moth Mask herself
  if(!noMask&&typeof drawThief==='function') drawThief({x:M.mx,y:M.my,z:M.mz,face:M.face,mode:M.mz>8?'dive':(M.ms-M.as>200&&c1Easy()&&M.wait>0?'wait':'move'),heart:false,alpha:1});
}

// ---------- 7. the small areas
// The Tide House (c_tidehouse): three rooms inside Saltmarsh's Tide Clock. a the Gear Room (burn the kelp off three
// wooden gears, gently), b the Weight Shaft (push one weight into the channel to make a step, the other onto the hook
// plate), c the Clock Face (knock the crab shell out of the big hand's cog with the Wing-rang, then pull the lever).
defineDungeonTheme('c_tide',{style:{floor:'#5c4832',floor2:'#544230',top:'#9a7a52',face:'#3a2a1a',edge:'#e0c088',water:'#24485a',accent:'#f0c870'},decor:'shell',pal:typeof TPAL!=='undefined'?TPAL.tide:undefined});
const C1_TIDE={
  a:['...............','..l.........l..','...............','.....##.##.....','...............','.......l.......','...............','..#.........#..','...............','..s............','...............'],
  b:['...............','...............','.......P.......','...............','...............','ooooooooooooooo','...............','.......B.......','....B..........','..S.........s..','...............'],
  c:['...............','.....ooooo.....','.....o.H.o.....','.....ooooo.....','.....ooooo.....','...............','...............','...............','..s............','...............','...............']};
defineDungeon('c_tidehouse',{name:S('The Tide House','The Tide House'),level:9,theme:'c_tide',seed:2251,save:'c_tidehouse',dark:0.32,dunKind:S('The Tide Clock','The Tide Clock'),noJuniper:true,
  story:{in:[xl('narr',`Inside the Tide Clock it smells of seaweed, wet wood and very old oil. Somewhere above you, a big gear is trying to turn and can't.`,`Inside it smells of seaweed and old oil. A big gear is stuck.`),xl('c_mina',`(from outside) Gently with the fire, dragon! It's a wooden clock!`,`Gently with the fire! It's a wooden clock!`)]},
  floors:[{id:'1',name:S('The Tide Clock','The Tide Clock'),map:{
    rooms:{
      a:{at:[0,2],kind:'start',puzzle:true,tpl:C1_TIDE.a,foes:[['crab',2]],sign:S('THE GEAR ROOM. Kelp in the gears? A SHORT breath of fire. Not a long one. - M. Mudge','Burn the kelp off the gears. A SHORT breath!'),noPots:true},
      b:{at:[0,1],kind:'blocks',tpl:C1_TIDE.b,sign:S('THE WEIGHT SHAFT. The weight goes on the hook plate. The channel is in the way. Think backwards. The rune stone puts the weights back.','Push one weight into the gap. Push the other onto the plate.'),noPots:true},
      c:{at:[0,0],kind:'switches',tpl:C1_TIDE.c,acc:['boomerang','arrow','hammer'],sign:S('THE CLOCK FACE. If the big hand sticks: knock the shell out of the cog, then pull the lever. Then tell the sea it may go out. - M. Mudge','Knock the shell out of the cog. Then pull the lever.'),noPots:true}},
    links:[['a','b','gate:a'],['b','c','gate:b']]}}]});
// the Gear Room's lantern-pods are the three kelp-wrapped wooden gears (same mechanic, its own art and words)
{ const P=AREADEFS.c_tidehouse; if(P) P.c1tide=true; }
const c1Tide=()=>!!(AREA&&AREA.def&&AREA.def.id==='c_tidehouse');
{ const base=DUN_DRAW.lpod; DUN_DRAW.lpod=(q,t,o)=>{ if(!c1Tide()) return base(q,t,o); c1DrawGear(q,t); }; }
function c1DrawGear(q,t){
  const x=q.x, y=q.y-26, lit=q.lit, stop=q.c1stop>G.time, a=lit&&!stop?t*1.4:0.2;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(2,30,22,7,0,0,TAU); ctx.fill();
  ctx.fillStyle='#4a3420'; ctx.fillRect(-4,8,8,22);
  ctx.rotate(a); ctx.fillStyle='#b8874a'; ctx.strokeStyle='#3a2410'; ctx.lineWidth=2.4; ctx.beginPath();
  for(let i=0;i<20;i++){ const ang=i/20*TAU, r=i%2?17:22; i?ctx.lineTo(Math.cos(ang)*r,Math.sin(ang)*r):ctx.moveTo(Math.cos(ang)*r,Math.sin(ang)*r); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#8a6034'; ctx.beginPath(); ctx.arc(0,0,9,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#2a1a0c'; ctx.beginPath(); ctx.arc(0,0,3,0,TAU); ctx.fill();
  ctx.rotate(-a);
  if(!lit){ ctx.strokeStyle='#3e7a3a'; ctx.lineWidth=5; ctx.lineCap='round'; for(let i=0;i<4;i++){ const k=i*1.6+0.4; ctx.beginPath(); ctx.moveTo(Math.cos(k)*-20,Math.sin(k)*-20); ctx.quadraticCurveTo(Math.cos(k+0.8)*8,Math.sin(k+0.8)*8,Math.cos(k+1.4)*20,Math.sin(k+1.4)*20); ctx.stroke(); }
    ctx.fillStyle='#5a9a4a'; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.ellipse(Math.cos(i*1.3)*14,Math.sin(i*1.3)*14+6,4,8,i,0,TAU); ctx.fill(); } }
  else if(stop){ ctx.fillStyle='rgba(120,110,100,.5)'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(Math.sin(t*3+i)*6,-26-i*8,6+i*2,0,TAU); ctx.fill(); } }
  ctx.restore();
  if(lit) glowAt(x,y,40,'255,210,140',0.25);
}
{ const base=podLight; podLight=function(o){
  if(!c1Tide()) return base(o);
  const A=AREA; if(o.lit) return; o.lit=true; G.found[o.id]=true;
  try{ SFX.play('pop'); }catch(e){} emit(o.x,o.y-26,20,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:30,smax:110,lmin:.3,lmax:.7,zmin:2,zmax:5,grow:5});
  const R=A.rooms[o.room], all=A.dn.pods.filter(q=>q.room===o.room), n=all.filter(q=>q.lit).length;
  setBanner(S('The kelp burns away','The kelp burns off!'),n<all.length?S(`${n} of ${all.length} gears are turning.`,`${n} of ${all.length} gears turn.`):S('All three gears are turning!','All three gears turn!'),2.2);
  if(R&&R.kind!=='pods'&&!R.solved&&all.every(q=>q.lit)){ solveRoom(R,true); jingle('secret','shrine'); }
  saveGame(); }; }
// the start room holds the gears, so it solves when they all turn (kind 'start' never solves on its own)
{ const base=caveBreath; caveBreath=function(hit,dt){ base.apply(this,arguments); try{ if(!c1Tide()) return;
  for(const o of AREA.dn.pods){ if(!o.lit||!hit(o.x,o.y,24)) continue; o.c1heat=(o.c1heat||0)+dt; if(o.c1heat>1.1){ o.c1heat=0; o.c1stop=G.time+3; ftext(o.x,o.y-62,S('Gently! It\'s a wooden clock!','Gently! Wood!'),'#ffd0a0',14); try{ SFX.play('warn',0.5); }catch(e){} } } }catch(e){} }; }
{ const base=trialObjAct; trialObjAct=function(o){ if(c1Tide()&&o&&o.tobj==='lpod'){ runDialogue([['narr',o.lit?S('A wooden gear, clean and turning. Tick, tock.','The gear turns. Tick, tock.'):S('A big wooden gear, wrapped in slimy kelp. It wants to turn. A short breath of fire would burn the kelp off.','A gear wrapped in kelp. A short breath of fire!')]],()=>{ scene='play'; }); return true; } return base.apply(this,arguments); }; }
// the lever on the Clock Face (it only moves once the shell is knocked out of the cog)
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){ base.apply(this,arguments); try{ if(def&&def.id==='c_tidehouse') c1TideBuild(A); }catch(e){ console.error(e); } }; }
function c1TideBuild(A){
  const R=A.rooms.c, a=A.rooms.a, cs=A.cave.cell; if(!R) return;
  if(a&&!a.solved&&A.dn.pods.filter(q=>q.room==='a').every(q=>q.lit)){ a.solved=true; G.found[`cv_${caveSid(A.def)}_a_solved`]=true; refreshCaveGates(); }
  const x=A.x0+(R.ox+1+11.5)*cs, y=A.y0+(R.oy+1+6.5)*cs;
  const o={k:'c1_tlever',x,y,id:'c1_tlever',room:'c',r:18,prompt:()=>G.flags.c_tide_fixed?null:S('Pull the big lever','Pull the lever')};
  A.objs.push(o); addAreaCol({t:'c',x,y,r:12});
  A.objs.push({k:'c1_tface',x:A.x0+(R.ox+1+7.5)*cs,y:A.y0+(R.oy+1+0.2)*cs,id:'c1_tface',room:'c'});
}
FL.c1_tlever=(o,t)=>{
  const R=AREA&&AREA.rooms&&AREA.rooms.c, ready=!!(R&&R.solved), pulled=!!G.flags.c_tide_fixed, x=o.x, y=o.y;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0,8,18,6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#4a3420'; ctx.strokeStyle='#1a1008'; ctx.lineWidth=2; ctx.fillRect(-12,-6,24,14); ctx.strokeRect(-12,-6,24,14);
  ctx.rotate(pulled?0.9:-0.6); ctx.fillStyle='#8a8a92'; ctx.fillRect(-2.5,-34,5,32); ctx.fillStyle='#c83a2a'; ctx.beginPath(); ctx.arc(0,-36,6,0,TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
  if(ready&&!pulled) glowAt(x,y-16,40+Math.sin(t*4)*6,'255,220,140',0.4);
};
FL.c1_tface=(o,t)=>{
  const x=o.x, y=o.y, R=AREA&&AREA.rooms&&AREA.rooms.c, low=!!G.flags.c_tide_fixed;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='#efe6d0'; ctx.strokeStyle='#3a2a18'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,26,0,TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#3a2a18'; ctx.font=`800 7px ${UIF}`; ctx.textAlign='center'; ctx.fillText('HIGH',0,-15); ctx.fillText('LOW',0,21);
  ctx.rotate(low?Math.PI:0); ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,-18); ctx.stroke();
  ctx.restore();
  if(R&&!R.solved){ ctx.fillStyle='#e8d8c0'; ctx.beginPath(); ctx.ellipse(x+12,y+6,6,4,0.4,0,TAU); ctx.fill(); }
};
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.k==='c1_tlever'){ c1TideLever(o); return; } if(o&&String(o.k).startsWith('c1_n')){ c1NestAct(o); return; } return base.apply(this,arguments); }; }
function c1TideLever(o){
  const R=AREA&&AREA.rooms&&AREA.rooms.c;
  if(G.flags.c_tide_fixed) return;
  if(!R||!R.solved){ runDialogue([['narr',S('You heave on the lever. It won\'t budge. Up on the clock face, something pale is jammed in the big hand\'s cog: a crab shell. Knock it out first. It\'s out of reach, across the gap.','The lever is stuck. A crab shell jams the cog. Knock it out first!')]],()=>{ scene='play'; }); return; }
  G.flags.c_tide_fixed=1; try{ SFX.play('block'); SFX.play('roll'); }catch(e){} shake(6); saveGame();
}
// the Tide House door (unless x1_world makes one), added once the world is built
{ const base=initWorld; initWorld=function(){ base.apply(this,arguments); try{ if(!DOORS.some(d=>d.area==='c_tidehouse')) DOORS.push({x:C1P.tide.x,y:C1P.tide.y+12,area:'c_tidehouse',label:S('Enter the Tide House','Go in the Tide House'),outY:36,cave:true,c1:true}); }catch(e){ console.error(e); } }; }

// The Moth's Nest (c_mothnest): the bell loft at the top of the Great Clock, Vesper's hideout
defHouse('c_mothnest',{name:S('The Moth\'s Nest','The Moth\'s Nest'),style:'attic',floor:'wood',w:520,h:360,dark:0.36,seed:7719});
{ const base=houseLayout; houseLayout=function(def){ if(!def||def.id!=='c_mothnest') return base.apply(this,arguments); return c1NestLayout(def); }; }
function c1NestLayout(def){
  const W=def.w, H=def.h, items=[], put=(k,x,y,o)=>items.push(Object.assign({k,x,y},o||{}));
  put('window',W*0.22,17,{}); put('cobweb',W*0.72,20,{}); put('cobweb',W*0.1,20,{});
  put('c1_nbell',W*0.5,112,{r:40,w:90,h:70});
  put('c1_nhammock',W*0.18,H*0.48,{w:110,h:40});
  put('c1_ncrate',W*0.8,H*0.46,{r:22});
  put('c1_ntin',W*0.68,H*0.72,{r:12});
  put('c1_ndraw',W*0.36,44,{w:60,h:20}); put('c1_ndraw',W*0.62,44,{w:60,h:20,v:1});
  put('c1_ngears',W-40,H*0.3,{w:40,h:110});
  put('crate',W*0.88,H*0.75,{r:20});
  return {W,H,items};
}
const C1_NEST_SAY={
  c1_nbell:[S('The great bell of the Great Clock. Silver dust is caked in every groove. A note was pinned here.','The great bell. Covered in silver dust.')],
  c1_nhammock:[S('A hammock made from an old sail with a moth painted on it. It smells of the sea. Under the pillow there is a book of jokes, and most of them are about clock barons.','A hammock made from a sail. It smells of the sea.')],
  c1_ncrate:[S('A crate used as a table. A candle stub, a cup with a chip in it, and a ring where a stack of letters sat.','A crate for a table. A candle and a cup.')],
  c1_ntin:[S('A biscuit tin. Inside: three biscuits and a note, "FOR GRAN. NOT FOR ME. NOT EVEN ONE." One biscuit has a bite out of it.','A biscuit tin. "FOR GRAN." One has a bite gone.')],
  c1_ndraw:[S('Moth drawings, dozens of them. Every moth has two painted eyes on its wings. Some of the drawings have been scribbled over, hard.','Moth drawings. Every moth has two painted eyes.'),S('A drawing of a little stilt house with smoke coming out of the chimney. Somebody drew the smoke in, carefully, after.','A drawing of a house with warm smoke.')],
  c1_ngears:[S('The clock\'s works: wheels, springs and pins, all furred with silver dust. Something big jammed them from far below.','The clock gears. Covered in dust.')]};
FURN_LABEL.c1_nbell='Look at the great bell'; FURN_LABEL.c1_nhammock='Look at the hammock'; FURN_LABEL.c1_ncrate='Look at the crate'; FURN_LABEL.c1_ntin='Open the biscuit tin'; FURN_LABEL.c1_ndraw='Look at the drawings'; FURN_LABEL.c1_ngears='Look at the clockwork';
S('Look at the great bell','Look at the bell'); S('Look at the hammock','The hammock'); S('Open the biscuit tin','Open the tin'); S('Look at the drawings','Look at the drawings'); S('Look at the clockwork','Look at the gears');
function c1NestAct(o){ const L=C1_NEST_SAY[o.k]; if(!L) return; const t=L[(o.v|0)%L.length]; runDialogue([['narr',t]],()=>{ scene='play'; }); }
FL.c1_nbell=(o,t)=>{
  const x=o.x, y=o.y;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='#3a2414'; ctx.fillRect(-56,-70,112,10); ctx.fillRect(-52,-66,8,76); ctx.fillRect(44,-66,8,76);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0,34,46,12,0,0,TAU); ctx.fill();
  const gr=ctx.createLinearGradient(-40,0,40,0); gr.addColorStop(0,'#8a6a2a'); gr.addColorStop(0.45,'#f0d080'); gr.addColorStop(1,'#7a5a20');
  ctx.fillStyle=gr; ctx.strokeStyle='#2a1a08'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-12,-58); ctx.quadraticCurveTo(-30,-50,-32,-10); ctx.quadraticCurveTo(-34,18,-44,26); ctx.lineTo(44,26); ctx.quadraticCurveTo(34,18,32,-10); ctx.quadraticCurveTo(30,-50,12,-58); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(220,220,240,.55)'; for(let i=0;i<14;i++) ctx.fillRect(-30+((i*37)%60),-40+((i*23)%60),2,2);
  if(!c1Seen('c_nest')){ ctx.fillStyle='#f4ecd8'; ctx.save(); ctx.rotate(0.12); ctx.fillRect(-9,-20,18,22); ctx.restore(); }
  // the clockwork magpie on the beam (until Pip deals with it)
  if(!c1Seen('c_pip_fetch')){ const bx=26, by=-76+Math.sin(t*3)*1.2; ctx.fillStyle='#c89a3a'; ctx.strokeStyle='#2a1a08'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.ellipse(bx,by,10,6,0.2,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx+8,by-2); ctx.lineTo(bx+16,by); ctx.lineTo(bx+8,by+2); ctx.closePath(); ctx.fill(); ctx.fillStyle='#bfe8ff'; ctx.beginPath(); ctx.arc(bx+5,by-2,2,0,TAU); ctx.fill(); ctx.strokeStyle='#8a6a2a'; ctx.beginPath(); ctx.moveTo(bx-9,by); ctx.lineTo(bx-20,by-4); ctx.stroke(); }
  ctx.restore();
};
FL.c1_nhammock=(o,t)=>{ const x=o.x, y=o.y, sw=Math.sin(t*1.2)*3; ctx.save(); ctx.translate(x,y);
  ctx.strokeStyle='#6a4a2a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-58,-14); ctx.lineTo(-44,0); ctx.moveTo(58,-14); ctx.lineTo(44,0); ctx.stroke();
  ctx.fillStyle='#d8c8a8'; ctx.strokeStyle='#3a2a1a'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(-46,0); ctx.quadraticCurveTo(0,30+sw,46,0); ctx.quadraticCurveTo(0,14+sw,-46,0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#8a7aa8'; ctx.beginPath(); ctx.ellipse(-6,12+sw,10,6,0,0,TAU); ctx.fill(); ctx.fillStyle='#e8c040'; ctx.beginPath(); ctx.arc(-9,11+sw,2,0,TAU); ctx.arc(-3,11+sw,2,0,TAU); ctx.fill();
  ctx.fillStyle='#4a6a8a'; ctx.beginPath(); ctx.ellipse(20,12+sw,16,7,0.2,0,TAU); ctx.fill(); ctx.restore(); };
FL.c1_ncrate=(o,t)=>{ const x=o.x, y=o.y; ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(-20,10,42,8); ctx.fillStyle='#8a6a42'; ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=2.2; ctx.fillRect(-20,-14,40,28); ctx.strokeRect(-20,-14,40,28); ctx.beginPath(); ctx.moveTo(-20,-14); ctx.lineTo(20,14); ctx.stroke();
  ctx.fillStyle='#f0e0b0'; ctx.fillRect(-6,-24,4,10); glowAt(-4,-26,26,'255,210,140',0.4); ctx.fillStyle='#ffcf6a'; ctx.beginPath(); ctx.arc(-4,-27,2.5,0,TAU); ctx.fill();
  if(!c1Seen('c_nest')){ ctx.fillStyle='#efe2c4'; ctx.fillRect(4,-22,12,8); ctx.fillStyle='#3a5a8a'; ctx.fillRect(6,-30,10,7); ctx.fillStyle='#e8d070'; ctx.beginPath(); ctx.arc(11,-27,2,0,TAU); ctx.fill(); }
  ctx.restore(); };
FL.c1_ntin=(o,t)=>{ const x=o.x, y=o.y; ctx.fillStyle='#c83a3a'; ctx.strokeStyle='#2a0a0a'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y,12,8,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e8c050'; ctx.beginPath(); ctx.ellipse(x,y-2,8,4,0,0,TAU); ctx.fill(); };
FL.c1_ndraw=(o,t)=>{ const x=o.x, y=o.y; for(let i=0;i<3;i++){ const px=x-22+i*22, py=y+(i%2)*4; ctx.fillStyle='#efe6d0'; ctx.fillRect(px-9,py-11,18,18); ctx.strokeStyle='#5a4a3a'; ctx.lineWidth=1; ctx.strokeRect(px-9,py-11,18,18);
  ctx.fillStyle=o.v&&i===1?'#8a5a3a':'#6a5a8a'; ctx.beginPath(); ctx.ellipse(px-4,py-2,4,6,-0.4,0,TAU); ctx.ellipse(px+4,py-2,4,6,0.4,0,TAU); ctx.fill(); ctx.fillStyle='#f0e8ff'; ctx.beginPath(); ctx.arc(px-4,py-3,1.3,0,TAU); ctx.arc(px+4,py-3,1.3,0,TAU); ctx.fill(); } };
FL.c1_ngears=(o,t)=>{ const x=o.x, y=o.y; for(let i=0;i<3;i++){ const gy=y-40+i*40, r=14+(i%2)*6, a=G.flags.c_clock_on?t*(i%2?-1:1):0; ctx.save(); ctx.translate(x,gy); ctx.rotate(a); ctx.fillStyle='#9a7a3a'; ctx.strokeStyle='#2a1a08'; ctx.lineWidth=2; ctx.beginPath(); for(let k=0;k<16;k++){ const an=k/16*TAU, rr=k%2?r-4:r; k?ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr):ctx.moveTo(Math.cos(an)*rr,Math.sin(an)*rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); if(!G.flags.c_clock_on){ ctx.fillStyle='rgba(220,220,240,.5)'; ctx.fillRect(x-8,gy-4,4,3); ctx.fillRect(x+4,gy+3,3,2); } } };
// colliders for the custom furniture
{ const base=furnCollider; furnCollider=function(o){ base(o); try{ if(o.k==='c1_nbell') o.col=addAreaCol({t:'c',x:o.x,y:o.y,r:34}); else if(o.k==='c1_ncrate') o.col=addAreaCol({t:'c',x:o.x,y:o.y,r:20}); else if(o.k==='c1_ngears') o.col=addAreaCol({t:'r',x0:o.x-20,y0:o.y-60,x1:o.x+20,y1:o.y+50}); else if(o.k==='c1_nhammock') o.col=addAreaCol({t:'r',x0:o.x-46,y0:o.y-6,x1:o.x+46,y1:o.y+14}); }catch(e){} }; }

// ---------- 8. one entry point for the dungeon helpers (C1STORY.md section 4): c1Beat(name, arg)
//   'gull_done'    the Gullcrag Caves are finished (the warp out): c_cliff plays the next time Ash is outdoors, then c_brass
//   'brass_lever'  the great drive is freed in Pearl's First Workshop: c_clock_bong, c_clock_on, then c_light
//   'light_lit'    the lamp in the Lamp Room is lit after the Gloomwing: c_light_end (if not seen), c_lamp_vesper, c_spire_up
//   'spire_choice' the Vesper fight reaches 10 percent: the choice, the truth, Nyxara, the snow, then c_snow (arg: the foe)
//   'tide_fixed'   (the Tide House's own lever calls this) the Tide Clock reads LOW: c_lowtide, c_claws
// The same beats also fire from the dungeons' reward altars (G.flags.trial_<id>_done), so a dungeon that never calls
// c1Beat still moves the story on.
function c1Beat(name,arg){
  const F=G.flags;
  switch(name){
    case 'gull_done': F.c_gull_done=1; if(c1Out()&&!c1Seen('c_cliff')) c1When('cliff',()=>c1Out(),()=>c1CliffScene()); return true;
    case 'brass_lever': F.c_brass_done=1; c1When('bong',()=>scene==='play'&&!DLG,()=>c1ClockBong()); return true;
    case 'light_lit': F.c_light_done=1; if(!c1Data('c_light')) c1When('lamp',()=>scene==='play'&&!DLG,()=>c1LampScene()); return true;
    case 'spire_choice': return c1SpireChoice(arg||G.boss||null);
    case 'tide_fixed': F.c_tide_fixed=1; return true;
  }
  return false;
}
// ---------- 9. debug hooks (tests: scratchpad/b_c1s/t_c1s.py)
// __eb.actStart(2,'<stage>') also gets the world flags implied by the stages before it (the same as an old save)
{ const base=window.__ebX&&window.__ebX.actStart; if(typeof base==='function') window.__ebX.actStart=function(n,w){ const r=base(n,w); try{ if((n|0)===2&&G.mode==='story'){ c1Migrate(); setupNPCs(); } }catch(e){ console.error(e); } return r; }; }
const C1S_DBG={
  C1ST,C1:C1ST,C1R,C1P,play:c1Play,chain:c1Chain,seen:c1Seen,mark:c1sMark,trust:c1Trust,beat:c1Beat,spireChoice:c1SpireChoice,endAct:c1EndAct,dunStory:c1DunStory,taunts:C1_TAUNTS,
  proj:(x,y)=>{ const P=c1RProj(x,y); return {s:Math.round(P.s),d:Math.round(P.d),k:P.g.k}; },
  at:s=>{ const q=c1RAt(s); return {x:Math.round(q.x),y:Math.round(q.y),k:q.g.k}; },
  route:()=>C1R.L.map(g=>({k:g.k,s0:Math.round(g.s0),s1:Math.round(g.s1),x0:g.x0,y0:g.y0,x1:g.x1,y1:g.y1})),
  chase:()=>{ const M=G.mini; if(!M||M.kind!=='c_roofchase') return null; return {as:Math.round(M.as),ms:Math.round(M.ms),total:Math.round(C1R.total),far:+M.far.toFixed(2),fall:M.fall,stepUp:M.stepUp,stepS:Math.round(M.stepS),ladder:!!M.ladder,slide:!!M.slide,safeS:Math.round(M.safeS),lurchT:+M.lurchT.toFixed(2),done:M.done,steam:C1R.chim.map((_,i)=>{ const q=c1RSteamPh(i); return q.ph<q.on?0:+(q.per-q.ph).toFixed(2); })}; },
  dlg:()=>{ if(!DLG) return null; const L=lineParts(DLG.lines[DLG.i]); return {who:typeof L.who==='function'?L.who():L.who,text:DLG.text,i:DLG.i,n:DLG.lines.length,opts:DLG.opts?DLG.opts.map(o=>simplify(typeof o.t==='function'?o.t():o.t)):null}; },
  choose:i=>{ if(!DLG||!DLG.opts) return false; DLG.chars=1e9; DLG.fullAt=performance.now()-2000; DLG.optsAt=performance.now()-2000; dlgChoose(i); return true; },
  next:()=>{ if(!DLG) return false; if(DLG.opts) return false; advanceDialogue(); return true; },
  npc:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); return n?{x:Math.round(n.x),y:Math.round(n.y)}:null; },
  talk:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n) return false; talkTo(n); return true; },
  prompt:()=>G.prompt?{text:G.prompt.text,x:Math.round(G.prompt.x||0),y:Math.round(G.prompt.y||0)}:null,
  rest:k=>{ if(k==='inn') innRest(); else restAtShrine(SHRINES.find(q=>mapAt(q.y)===curMap())||SHRINES[0]); return true; },
  use:()=>{ if(G.prompt){ const p=G.prompt; G.prompt=null; p.act(); return true; } return false; },
  // a test fallback for very slow machines: put Ash at the end of the roofs (the win still runs the normal way)
  chaseSkip:()=>{ const M=G.mini; if(!M||M.kind!=='c_roofchase') return false; const q=c1RAt(C1R.total-30); player.x=q.x; player.y=q.y; player.z=0; M.stepUp=true; M.ms=C1R.total-30; M.safeS=C1R.total-40; return true; },
  state:()=>({stage:G.stage,act:G.act,trust:G.flags.c_trust|0,vesper:G.choices.c_vesper||null,moon:G.flags.moon==null?100:G.flags.moon,shard:!!G.items.c_shard1,
    lowtide:!!G.flags.c_lowtide,clock:!!G.flags.c_clock_on,spire:!!G.flags.c_spire_up,snow:!!G.flags.c_snow,done:!!G.flags.c_done,seen:Object.keys(G.flags.c_sn||{}),q:C1ST.q.map(q=>q.id),fb:Object.keys(C1ST.fb),
    obj:(()=>{ try{ const o=questObjective(); return o?{text:o.text,x:Math.round(o.x||0),y:Math.round(o.y||0)}:null; }catch(e){ return String(e); } })()})
};
window.__ebX=Object.assign(window.__ebX||{},{c1s:C1S_DBG,c1:Object.assign({},(window.__ebX&&window.__ebX.c1)||{},C1S_DBG)});
