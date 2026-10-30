
// ================= Act III, Frostreach: the people and the side quests (x2_people.js)
// The named people of Hearthold, Rimeholm, Hask's Rest and the wild (looks, homes, talk, barks, chats, greetings,
// shops), the twenty Frozen Folk and their thaw lines, the ten Act III side quests (f_bombs, f_song, f_mumble, f_sled,
// f_rime, f_dogs, f_juniper, f_forge, f_pack, f_warm) with the sled race, the Rimehound fight and the floe escort,
// Mumble the yeti (a toy 3D figure and a 2D one), Greymane's pack, Pebble's letters f_pb_*, Tamsin's verse, Duchess on
// Mount Dread and the EPI.f epilogue lines.
// Design: scratchpad/bible/ACT3.md sections 3.7, 3.8, 4, 10, 11, 13 and THREADS.md. Doc for other helpers:
// scratchpad/F2PEOPLE.md. Everything is wrapped from here (no engine edits). Names in this file start with f2p / F2P.

// ---------- small helpers
const f2pL=(who,full,simple)=>[who,S(full,simple)];
const f2pN=(full,simple)=>['narr',S(full,simple)];
const f2pDo=fn=>({who:'narr',text:'',fn,skipIf:()=>true});
const f2pQ=id=>!!(G&&G.quests&&G.quests[id]&&G.quests[id].done);
const f2pAt=(id,n)=>{ const q=G&&G.quests&&G.quests[id]; return !!q&&!q.done&&q.step===n; };
const f2pOn=id=>{ const q=G&&G.quests&&G.quests[id]; return !!q&&!q.done; };
const f2pR=st=>typeof stageAt==='function'&&stageAt(st)>=0&&reached(st);   // reached() on an unknown id is always true
const f2pAct3=()=>!!G&&G.mode==='story'&&typeof actOf==='function'&&actOf(G.stage)===3;
const f2pVesper=()=>typeof vesperFriend==='function'?!!vesperFriend():!!(G&&G.choices&&G.choices.c_vesper==='friend');
const F2P={err:0,base:{},heat:{},ready:false,mail:false,epi:false,race:null,fight:null,esc:null,dogs:[],kids:[],roars:0,test:null,lastRoar:-9,seenStage:null,drawList:[]};
const F2P_TOWNS=['f_hearthold','f_rimeholm','f_haskrest','f_skyreach'];
const F2P_HH='town:f_hearthold', F2P_RH='town:f_rimeholm', F2P_HR='town:f_haskrest';
const F2P_FT=F2P_TOWNS.map(t=>'town:'+t).join('|');
const F2P_NOTFROST=F2P_TOWNS.map(t=>'!town:'+t).join('|');
function f2pFrostId(id){ const c=CASTBY[id]; return !!c&&F2P_TOWNS.includes(c.town); }
function f2pSay(lines,cb){ runDialogue(lines,()=>{ scene='play'; if(cb) cb(); saveGame(); }); }
function f2pLvl(o){ return typeof elevLvl==='function'?elevLvl(o.x,o.y):0; }
function f2pHere(){ return typeof elevOf==='function'?elevOf(player):0; }
function f2pGround(o){ if(typeof elevLvl!=='function') return 0; let m=99; for(const [dx,dy] of [[180,0],[-180,0],[0,180],[0,-180]]) m=Math.min(m,elevLvl(o.x+dx,o.y+dy)); return m===99?0:m; }
// a spot up high: on the real elevation (x2_world) Ash must stand at its level; where the map has none, the power is enough
function f2pHigh(o,abil){ const l=f2pLvl(o); if(l>0&&l>f2pGround(o)) return f2pHere()>=l; return !abil||hasAbil(abil); }
function f2pFoe(type,alt,x,y,o){ const t=EDEF[type]?type:alt; const e=makeEnemy(t,x,y,Object.assign({level:Math.max(13,(regionAt(x,y)||{}).level||14),aggro:true,homeX:x,homeY:y,leash:1000,snowy:true},o||{})); e.spawnIn=0.3; return e; }
// the blue jet on a spot (Blaze): seconds of blue fire add up on F2P.heat[key] and cool off after a moment
function f2pJet(x,y,r){ try{ return typeof p3JetHits==='function'&&!!p3JetHits(x,y,r||18); }catch(e){ return false; } }
function f2pNeed(s){ try{ return typeof p3Need==='function'?p3Need(s):(G.flags.f_bluefire?s*0.5:s); }catch(e){ return s; } }
function f2pHeat(key,x,y,r,need,dt){
  const H=F2P.heat[key]||(F2P.heat[key]={t:0,last:-9});
  if(f2pJet(x,y,r)){ H.t+=dt; H.last=G.time; if(typeof p3MeltFx==='function') try{ p3MeltFx(x,y-14,0.5); }catch(e){} else if(Math.random()<0.3) emit(x+rand(-8,8),y-10,1,{col:'200,230,255',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1,zmax:2}); }
  else if(G.time-H.last>1.4) H.t=Math.max(0,H.t-dt*0.4);
  if(H.t>=f2pNeed(need)){ H.t=0; return true; }
  return false;
}
function f2pThawed(id){ const F=G.flags; return !!(F['f_thaw_'+id]||F['f_thaw_'+String(id).replace(/^f_/,'')]); }
function f2pFlag(k,v){ if(!G.flags[k]){ G.flags[k]=v==null?1:v; questPoke(); return true; } return false; }

// ---------- speakers who are not people: Mumble the yeti, the sled dogs, Nisse the goat
Object.assign(SPK,{
  f_mumble:SPK.f_mumble||{name:'Mumble',col:'#bfe4ff'},
  f_dog:SPK.f_dog||{name:'A sled dog',col:'#e8d8c0'},
  f_nisse:SPK.f_nisse||{name:'Nisse',col:'#efeae0'},
  f_snarl:SPK.f_snarl||{name:'Snarl',col:'#a8c8e8'}
});
// (v12 FACES) Mumble the shy yeti, the sled dogs and Nisse the goat show the line's mood (a12a_dlg's kit)
function f2pFaceYeti(g){
  const X=PX, n=X.n, fluff=n==='angry'||n==='furious'||n==='scared'||n==='surprised'?1.25:n==='sad'||n==='defeated'?0.75:1;
  g.save(); pxPose(g,{py:66}); pxAura(g,0,10,80);
  g.fillStyle='#e8f2fa'; g.beginPath(); g.ellipse(0,12,62,58,0,0,TAU); g.fill();
  g.strokeStyle='#9ab8d0'; g.lineWidth=3; for(let i=0;i<14;i++){ const a=Math.PI*0.9+i*Math.PI*1.2/13; g.beginPath(); g.moveTo(Math.cos(a)*54,12+Math.sin(a)*52); g.lineTo(Math.cos(a)*(54+10*fluff),12+Math.sin(a)*(52+10*fluff)); g.stroke(); }
  g.fillStyle='#7aaee0'; g.beginPath(); g.ellipse(0,16,36,32,0,0,TAU); g.fill(); g.strokeStyle='#3a6a9a'; g.lineWidth=2.5; g.stroke();
  for(const s of [-1,1]) pxEye(g,s*13,8,s,{rx:5.8,ry:7.2,r:2.4,white:'#1a2030',iris:'#33405a',skin:'#7aaee0',lash:'#1a2030'});
  pxBrows(g,{x:13,w:6,y:-4,col:'#2a4a6a',lw:3,arch:2.6});
  g.fillStyle='#4a2a3a'; g.beginPath(); g.ellipse(0,28,6,4,0,0,TAU); g.fill();
  pxMouth(g,{y:37,w:7,c:4,col:'#1a2a44',lw:2.4,dark:'#2a1424'});
  g.save(); g.translate(0,-40); g.rotate(-(X.ear||0)*0.08); g.fillStyle='#c84a3a'; g.beginPath(); g.ellipse(0,0,26,15,0,Math.PI,TAU); g.fill(); g.fillRect(-26,-2,52,7);
  g.fillStyle='#f0e0a0'; for(let i=-22;i<=22;i+=8) g.fillRect(i,-1,4,5); g.beginPath(); g.arc(0,-16-(X.ear||0)*2,7,0,TAU); g.fill(); g.restore();
  pxExtras(g,{ex:13,ey:8,erx:5.8,ery:7.2,cheek:22,top:-12,side:36});
  g.restore();
}
function f2pFaceDog(g){
  const X=PX, m=X.m||'neutral', pant=m==='neutral'||m==='smile'||m==='laugh'||m==='tiny';
  g.save(); pxPose(g,{py:58}); pxAura(g,0,0,78);
  for(const s of [-1,1]){ g.save(); g.translate(s*30,-26); g.rotate(-s*pxEarTurn(0.25,0.6)); g.fillStyle='#5a4a40'; g.beginPath(); g.moveTo(-s*10,-4); g.lineTo(s*14,-36); g.lineTo(s*16,6); g.closePath(); g.fill(); g.fillStyle='#d8b8b0'; g.beginPath(); g.moveTo(-s*2,-4); g.lineTo(s*11,-24); g.lineTo(s*11,2); g.closePath(); g.fill(); g.restore(); }
  g.fillStyle='#6a5a50'; g.beginPath(); g.ellipse(0,0,48,44,0,0,TAU); g.fill();
  g.fillStyle='#f4ece0'; g.beginPath(); g.ellipse(0,14,32,30,0,0,TAU); g.fill(); g.beginPath(); g.moveTo(-12,-30); g.lineTo(0,4); g.lineTo(12,-30); g.closePath(); g.fill();
  for(const s of [-1,1]) pxEye(g,s*15,-6,s,{rx:6.2,ry:6.6,r:3.4,white:'#5aa8e8',iris:'#10141a',skin:'#6a5a50',lash:'#2a201a'});
  pxBrows(g,{x:15,w:5,y:-16,col:'#f4ece0',lw:3.4,arch:2});
  g.fillStyle='#1a1410'; g.beginPath(); g.ellipse(0,14,7,5,0,0,TAU); g.fill();
  pxMouth(g,{y:24,w:9,c:4.5,col:'#2a201a',lw:2.4,dark:'#3a1410',tongue:'#e8606a'});
  if(pant){ g.fillStyle='#e8606a'; g.beginPath(); g.ellipse(4,m==='laugh'?36:32,6,9,0.2,0,TAU); g.fill(); g.strokeStyle='rgba(150,40,50,.5)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(4,m==='laugh'?30:26); g.lineTo(4.5,m==='laugh'?40:36); g.stroke(); }
  pxExtras(g,{ex:15,ey:-6,erx:6.2,ery:6.6,cheek:8,top:-30,side:46,no:{blush:true}});
  g.restore();
}
function f2pFaceGoat(g){
  const X=PX;
  g.save(); pxPose(g,{py:62}); pxAura(g,0,-4,78);
  g.fillStyle='#b8a888'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*12,-34); g.quadraticCurveTo(s*36,-70,s*48,-40); g.lineTo(s*40,-38); g.quadraticCurveTo(s*30,-58,s*8,-30); g.closePath(); g.fill(); }
  for(const s of [-1,1]){ g.save(); g.translate(s*34,-12); g.rotate(s*(0.4-pxEarTurn(0.4,0.5))); g.fillStyle='#ece4d4'; g.beginPath(); g.ellipse(s*10,0,16,7,0,0,TAU); g.fill(); g.fillStyle='#e0c4b8'; g.beginPath(); g.ellipse(s*12,0.5,10,3.2,0,0,TAU); g.fill(); g.restore(); }
  g.fillStyle='#f6f2e8'; g.beginPath(); g.ellipse(0,0,40,48,0,0,TAU); g.fill();
  for(const s of [-1,1]){ g.save(); g.translate(s*15,-10); g.scale(0.86,1.05); dragonEye(g,0,0,s,{eye:'#d8a43a',skin:'#f6f2e8',dark:'#6a5a44',rot:0.06,bar:true,noglow:true}); g.restore(); }
  pxBrows(g,{x:15,w:6,y:-19,col:'#b0a48c',lw:2.6,arch:2,busy:true});
  g.fillStyle='#efdcd4'; g.beginPath(); g.ellipse(0,26,20,15,0,0,TAU); g.fill(); g.fillStyle='#6a2a2a'; g.beginPath(); g.ellipse(0,22,5,3,0,0,TAU); g.fill();
  if(X.m&&X.m!=='neutral') pxMouth(g,{y:31,w:6,c:3.5,col:'#6a4a40',lw:2,dark:'#4a2020'}); else { g.strokeStyle='#6a4a40'; g.lineWidth=2; g.lineCap='round'; g.beginPath(); g.moveTo(-6,33); g.quadraticCurveTo(0,30,6,33); g.stroke(); }
  g.fillStyle='#dff4ff'; for(let i=-10;i<=10;i+=5){ g.beginPath(); g.moveTo(i-2.4,40); g.lineTo(i,56+Math.abs(i)*-0.6); g.lineTo(i+2.4,40); g.closePath(); g.fill(); }
  pxExtras(g,{ex:15,ey:-10,erx:5.5,ery:5,cheek:8,top:-34,side:40});
  g.restore();
}
if(typeof EVPORT!=='undefined'){
  if(!EVPORT.f_mumble) EVPORT.f_mumble={bg:'#1c3048',f:f2pFaceYeti};
  if(!EVPORT.f_dog) EVPORT.f_dog={bg:'#2a2a34',f:f2pFaceDog};
  if(!EVPORT.f_nisse) EVPORT.f_nisse={bg:'#2a3440',f:f2pFaceGoat};
  if(!EVPORT.f_snarl) EVPORT.f_snarl={bg:'#1a2634',f:f2pFaceDog};
}

// ---------- items (ACT3 2) and two cosmetic hats
Object.assign(ITEM_NAMES,{
  f_powder:'Mags’s blasting powder',f_soup:'Sigrun’s famous hot soup',f_starfrost:'Starfrost ore',f_parsnip:ITEM_NAMES.f_parsnip||'The Parsnip of Fate',
  f_northmaps:'Juniper’s North Maps',f_medal:'The Warm Hands Medal',f_verse1:'The Snow Mother’s Song, verse one',f_verse2:'The Snow Mother’s Song, verse two',
  f_verse3:'The Snow Mother’s Song, verse three',f_cocoa:'Pim’s hot cocoa',f_honey:'Wild honey',f_earmuffs:'Fergus’s mitten earmuffs',f_bucket:'The Snowgob King’s bucket',
  f_shard2:ITEM_NAMES.f_shard2||'The Frost Shard'
});
if(typeof GIFTS!=='undefined'&&Array.isArray(GIFTS)&&!GIFTS.includes('fish')) GIFTS.push('fish');
const F2P_HATS={f_earmuffs:'Mitten Earmuffs',f_bucket:'Bucket Crown'};
function f2pHat(item){ const h=F2P_HATS[item]; if(!h) return; G.hats=G.hats||{}; G.hats[h]=true; G.hat=h; }
{ const base=drawHatShape; drawHatShape=function(x,y,k,s){
  if(k==='Mitten Earmuffs'||k==='Bucket Crown'){ s=s||1; ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
    if(k==='Mitten Earmuffs'){ ctx.strokeStyle='#7a5a3a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,7,Math.PI*1.1,Math.PI*1.9); ctx.stroke(); for(const sd of [-1,1]){ ctx.fillStyle='#c84a3a'; ctx.beginPath(); ctx.ellipse(sd*7,1,3.6,4.6,0,0,TAU); ctx.fill(); ctx.fillStyle='#f0e0c0'; ctx.fillRect(sd*7-3,3,6,2); } }
    else { ctx.fillStyle='#8a96a4'; ctx.beginPath(); ctx.moveTo(-7,4); ctx.lineTo(-5.5,-6); ctx.lineTo(5.5,-6); ctx.lineTo(7,4); ctx.closePath(); ctx.fill(); ctx.fillStyle='#b8c4d0'; ctx.fillRect(-6,-6,12,2.4); ctx.strokeStyle='#4a5260'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-7,4); ctx.lineTo(-5.5,-6); ctx.lineTo(5.5,-6); ctx.lineTo(7,4); ctx.stroke(); ctx.fillStyle='#e8c03a'; ctx.beginPath(); ctx.arc(0,-1,1.6,0,TAU); ctx.fill(); }
    ctx.restore(); return; }
  return base(x,y,k,s); }; }
{ const base=ashHat; ashHat=function(k){
  const z0=6.2;
  if(k==='Mitten Earmuffs'){ aL(0,-6.6,z0-1.0,0,6.6,z0-1.0,0.9,'#7a5a3a',0.9); aE(0,-7.4,z0-3.4,2.6,1.6,3.0,'#c84a3a'); aE(0,7.4,z0-3.4,2.6,1.6,3.0,'#c84a3a'); aE(0.8,-7.6,z0-5.6,2.2,1.4,0.9,'#f0e0c0'); aE(0.8,7.6,z0-5.6,2.2,1.4,0.9,'#f0e0c0'); return; }
  if(k==='Bucket Crown'){ aE(0,0,z0-0.4,6.6,6.6,1.6,'#8a96a4'); aL(0,0,z0+0.2,0,0,z0+6.2,6.2,'#8a96a4',5.0); aE(0,0,z0+6.4,5.2,5.2,0.9,'#b8c4d0'); aD(5.6,0,z0+3.2,1.3,'#e8c03a',0.06); aL(-4.8,0,z0+6.0,0,0,z0+9.4,0.4,'#4a5260',0.4); aL(4.8,0,z0+6.0,0,0,z0+9.4,0.4,'#4a5260',0.4); return; }
  return base(k); }; }

// ---------- the Act III stage ids (ACT3 6.0): registered at world build only if no story module shipped them, so `min`
// gates never meet an unknown stage. These fallbacks carry `f2p:true` and the smallest story they need (so the side
// content can be played and tested without x2_story): Ylva's thaw moves f_thaw on.
const F2P_STAGES=['f_snow','f_pass','f_hearth','f_maze','f_kindle','f_thaw','f_sky','f_gap','f_deep','f_dreadgate','f_dread','f_glaciar'];
const F2P_CH={f_snow:'Snow Way!',f_pass:'Snow Way!',f_hearth:'Home Is Where the Hearth Is',f_maze:'Home Is Where the Hearth Is',f_kindle:'Home Is Where the Hearth Is',f_thaw:'One Thaw at a Time',
  f_sky:'One Thaw at a Time',f_gap:'Knock, Knock',f_deep:'Knock, Knock',f_dreadgate:'Moth to a Flame',f_dread:'Moth to a Flame',f_glaciar:'The Crown of Dread'};
const F2P_OBJ={f_snow:[S('Go to Frostpine Lodge and talk to Ulf','Talk to Ulf at the Lodge'),1500,3400],f_pass:[S('Follow the White Road to Hearthold','Walk to Hearthold'),6180,49000],
  f_hearth:[S('Talk to the Hearthkeeper at the Great Hearth','Talk to the Hearthkeeper'),6880,49040],f_maze:[S('Cross the Glimmerfrost to the Glacier Maze','Go to the Glacier Maze'),5600,44420],
  f_kindle:[S('Wake the Great Hearth with Blaze','Wake the Great Hearth'),6800,48950],f_thaw:[S('Go to Rimeholm and find whoever knows the most','Go to Rimeholm'),1950,46750],
  f_sky:[S('Reach Skyreach Temple','Reach Skyreach Temple'),12650,46480],f_gap:[S('Find Stonehorn Deep in the Badlands','Find Stonehorn Deep'),12200,42450],
  f_deep:[S('Climb down through Stonehorn Deep','Go through Stonehorn Deep'),12200,42450],f_dreadgate:[S('Go to the Dreadgate at the foot of Mount Dread','Go to the Dreadgate'),7300,44160],
  f_dread:[S('Climb through the Heart of Dread','Climb the Heart of Dread'),7300,44160],f_glaciar:[S('Climb to whoever is dreaming the winter, on the Crown of Dread','Climb to the top of Mount Dread'),7300,41250]};
function f2pStagesFallback(){
  if(typeof stageAt!=='function') return;
  const miss=F2P_STAGES.filter(s=>stageAt(s)<0); if(!miss.length) return;
  const defs=miss.map(id=>{ const o=F2P_OBJ[id]; return {id,f2p:true,chapter:F2P_CH[id],objectives:()=>[{text:o[0],x:o[1],y:o[2]}],
    update:id==='f_thaw'?()=>{ if(G.flags.f_ylva&&G.stage==='f_thaw'&&scene==='play'&&!DLG) goStage('f_sky',{card:false}); }:undefined}; });
  if(typeof defineStages==='function') defineStages(3,defs); else for(const s of miss) STAGES.push(s);
}
const f2pFallbackStage=id=>typeof STAGEDEF!=='undefined'&&!!(STAGEDEF[id]&&STAGEDEF[id].f2p);

// ---------- the people (ACT3 4.1 to 4.3). CAST order inside each town is a save key (homes): append only.
// Hearthold homes: toastwhistle, gunnhild, mags, hilde, eider, soren. Rimeholm: ylva, tollef, saga, sigrun, nils, oskar,
// rasmus. Hask's Rest: hask. Fergus, Sigrid and Hjalmar have no house (they turn up in town once thawed).
const F2P_CAST=[
  {id:'f_brynja',name:'Old Brynja, Hearthkeeper',town:'f_hearthold',col:'#e88a4a',
    look:{skin:'#e8c0a0',hair:'#efeae0',hairdo:'bun',outfit:'robe',shirt:'#3a2a2a',low:'#2a1e1e',shawl:'#1a1414',soot:true,build:'old',hold:'staff'},
    lines:[S(`Seventy years I've kept this fire. Never let it go out once. Well. Once. I was nine. There was a sneeze.`,`Seventy years I kept this fire. It went out once. I sneezed.`),
      S(`Don't touch the Hearth with your bare claws. Oh, you're the fire one. Touch away.`,`Don't touch the fire. Oh, you're the fire one. Go ahead.`),
      S(`The north remembers Ember. We put a flower on the Hearth every Lantern Day. Your Lantern Day. We just never knew why.`,`We put a flower on the fire every Lantern Day. We never knew why.`)]},
  {id:'f_brann',name:'Captain Brann Stoutmitt',town:'f_hearthold',col:'#c86a2a',
    look:{skin:'#f0c8a8',hair:'#c86a2a',beard:'big',beardc:'#c86a2a',outfit:'armor',helm:true,plume:'#3a6aaa',cape:'#2a4a7a',frost:true,build:'big',hold:'spear',mittens:'#2a4a7a'},
    lines:[S(`I am not afraid of moths! I simply respect them from a distance! A large distance! Indoors!`,`I am not scared of moths! I just stay far away!`),
      S(`My beard has icicles! I'm keeping them! They're intimidating!`,`My beard has icicles! They look tough!`),
      S(`Gunnar licked the North Gate again! We're working on it!`,`Gunnar licked the gate again!`)]},
  {id:'f_toastwhistle',name:'Mayor Ottilie Toastwhistle',town:'f_hearthold',home:true,house:'Toastwhistle Hall',job:'mayor',col:'#e8c060',
    look:{skin:'#f2d0b8',hair:'#e8c060',hairdo:'curly',outfit:'coat',shirt:'#7a2a4a',low:'#5a1a3a',hat:'fur',hatc:'#efeae0',sash:'#e0c080',necklace:'#e0c080',blush:true},
    lines:[S(`Everything is fine! The Hearth is fine! The snow is fine! I am fine! Why is my voice so high?`,`Everything is fine! I am fine! Why is my voice so high?`),
      S(`I've ordered the winter to stop. In writing. It has not replied.`,`I told the winter to stop. In a letter. No reply.`),
      S(`Every frozen person you warm up gets a cup of cocoa on the town. Pim's cocoa. Don't tell Pim, I haven't asked her.`,`Each person you thaw gets free cocoa. Don't tell Pim.`)]},
  {id:'f_gunnhild',name:'Gunnhild Anvilheart',town:'f_hearthold',home:true,house:'Anvilheart Forge',job:'miner',col:'#c8642a',
    look:{skin:'#c88a62',hair:'#3a2a1a',hairdo:'braids',outfit:'vest',shirt:'#5a3a2a',low:'#3a2a1a',apron:'#3a2a20',soot:true,build:'strong',hold:'hammer'},
    lines:[S(`My forge went cold the night the moth came. I still come in every morning and pick up the hammer. Habit.`,`My forge went cold. I still pick up the hammer.`),
      S(`Your mother's Maren? Maren of Emberhollow? I have her letter on the wall. One letter. It says "no thank you." I framed it.`,`Your mom is Maren? I framed her letter. It says "no thank you."`),
      S(`Northern iron is stubborn. So am I. We get along.`,`Northern iron is stubborn. So am I.`)]},
  {id:'f_mags',name:'Mags Sprocket',town:'f_hearthold',home:true,house:'Sprocket’s Shed',job:'lamps',col:'#e8502a',
    look:{skin:'#d8aa84',hair:'#c83a2a',hairdo:'wild',outfit:'overalls',shirt:'#4a5a6a',low:'#3a4a5a',goggles:true,oil:true,soot:true,belt:'#5a3a1e',bag:'#7a5a32',freckles:true},
    lines:[S(`Mags Sprocket, Gearhaven's third-best tinker! The other two exploded. Not badly! A little!`,`I'm Mags! Third-best tinker. The other two exploded. A little!`),
      S(`I came north to sell steam heaters. Then winter came. Business has never been better and I've never been colder.`,`I sell heaters. Business is great. I'm so cold.`),
      S(`Have you heard of the Moth Mask? Gearhaven's famous thief? I sold her a lock once. She picked it. Then she paid for it. Good manners, that one.`,`I sold the Moth Mask a lock. She picked it. Then she paid!`)]},
  {id:'f_hilde',name:'Hilde Pottersnow',town:'f_hearthold',home:true,house:'The Warm Mitten',job:'inn',col:'#e8706a',
    look:{skin:'#f4d6c2',hair:'#b8401a',hairdo:'bun',outfit:'dress',shirt:'#c84a3a',low:'#7a2a2a',apron:'#efe6d6',shawl:'#e0b0c0',build:'wide',hold2:'kettle',blush:true},
    lines:[S(`Welcome to the Warm Mitten! Beds are soft, soup is hot, and the cat is called Biscuit. Don't sit on Biscuit.`,`Welcome! Soft beds, hot soup. The cat is Biscuit. Don't sit on her.`),
      S(`Sigrun in Rimeholm taught me my soup. If she were here she'd say it needs salt. She'd be right.`,`Sigrun taught me my soup. She'd say it needs salt.`),
      S(`Have some soup. Have some more soup. The chair's had two bowls already.`,`Have some soup! The chair had two bowls.`)]},
  {id:'f_eider',name:'Brother Eider',town:'f_hearthold',home:true,house:'The Hearth Archive',job:'library',style:'library',col:'#7ab09a',ix:0.5,iy:0.4,
    look:{skin:'#a86e4a',hood:'#3a5a4a',outfit:'robe',shirt:'#4a6a5a',low:'#2a3a30',glasses:true,hold:'book',bookc:'#3a5a4a',build:'slim'},
    lines:[S(`Shh. Sorry. Not you. The books. They get nervous in the cold.`,`Shh. Not you. The books are nervous.`),
      S(`My cousin Wren runs the library in Brindlecross. She writes me every week. She underlines things. Aggressively.`,`My cousin Wren writes every week. She underlines a lot.`),
      S(`The oldest songs in the archive are about a Snow Mother who kept Hearthold safe. Nobody knows who she was. I have a theory. It's a big theory. It has wings.`,`Old songs talk of a Snow Mother. I have a theory. It has wings.`)]},
  {id:'f_pim',name:'Pim',town:'f_hearthold',kid:true,col:'#e8c03a',
    look:{skin:'#c8946c',hair:'#2a1a10',hairdo:'pigtails',outfit:'coat',shirt:'#c86a2a',low:'#7a3a1a',hat:'beanie',hatc:'#e8c03a',scarf:'#3a8aaa',scarfLen:1.2,mittens:'#e8c03a'},
    lines:[S(`Hot cocoa! Three coins! Two coins if you heat it yourself!`,`Hot cocoa! Three coins!`),
      S(`My cocoa has a secret ingredient. It's more cocoa.`,`My secret is more cocoa.`),
      S(`When I grow up I'm going to own every cocoa stand in the north. There's only one. It's this one. So I'm halfway.`,`I'll own every cocoa stand. There's one. So I'm halfway!`)]},
  {id:'f_soren',name:'Soren Sledwright',town:'f_hearthold',home:true,house:'The Sled Shed',job:'home',col:'#d8c8a0',
    look:{skin:'#e8bc98',hair:'#d8c8a0',hairdo:'long',beard:true,beardc:'#d8c8a0',outfit:'fur',shirt:'#6a4a2a',low:'#4a3a2a',hat:'beanie',hatc:'#c84a3a',goggles:true,build:'tall',sled:true},
    lines:[S(`Forty years I've sledded this hill. I still scream all the way down.`,`Forty years on this hill. I still scream.`),
      S(`Some girl from the south came up the pass on a sled. Up. On a sled. I like her.`,`A girl sledded up the pass. I like her.`),
      S(`Wax the runners, lean into the turns, and never sled with your mouth open.`,`Wax. Lean in. Keep your mouth shut!`)]},
  {id:'f_fergus',name:'Fergus Fiddlesticks',town:'f_hearthold',col:'#c84a3a',
    look:{skin:'#e8bc98',hair:'#8a5a2a',hairdo:'short',outfit:'coat',shirt:'#c84a3a',low:'#3a3a4a',hat:'beanie',hatc:'#3a6aaa',mittens:'#e8c03a',bag:'#7a5a32',stache:true},
    lines:[S(`MITTENS! Warm mittens! Left ones, right ones, and one very confused middle one!`,`MITTENS! Left ones and right ones!`),
      S(`I stood on that road for a month. My feet are still asleep. They're snoring.`,`I stood frozen for a month. My feet are still asleep.`),
      S(`A dragon with mittens. Now THAT would be good for business.`,`A dragon in mittens. Great for business!`)]},
  {id:'f_sigrid',name:'Sigrid the explorer',town:'f_hearthold',col:'#5a9ad8',
    look:{skin:'#e0ae88',hair:'#e8c060',hairdo:'braids',outfit:'coat',shirt:'#3a6aa8',low:'#3a3a4a',hat:'beanie',hatc:'#e8c03a',bag:'#7a5a32',freckles:true,build:'slim'},
    lines:[S(`I went into the Glacier Maze to find the furnace key. I found a block of ice instead. I was the block of ice.`,`I looked for a key. I turned into ice instead.`),
      S(`Never explore on an empty stomach. Or in a glacier. Or near moths. Lessons learned.`,`Don't explore hungry. Or in a glacier.`)]},
  {id:'f_hjalmar',name:'Hjalmar the explorer',town:'f_hearthold',col:'#c89a5a',
    look:{skin:'#e8bc98',hair:'#c89a5a',hairdo:'short',outfit:'coat',shirt:'#5a7aa8',low:'#3a3a4a',hat:'beanie',hatc:'#c84a3a',beard:true,beardc:'#c89a5a'},
    lines:[S(`I froze mid-sneeze. I've finished the sneeze now. It was worth the wait.`,`I froze mid-sneeze. I finished it now.`),
      S(`ACHOO! Sorry. That one was left over.`,`ACHOO! Sorry. A spare one.`)]},
  // Rimeholm (they start frozen; ACT3 4.2)
  {id:'f_ylva',name:'Grandmother Ylva',town:'f_rimeholm',home:true,house:'Ylva’s Cottage',job:'knitter',col:'#9ab8e8',
    look:{skin:'#f4d6c2',hair:'#efeae0',hairdo:'bun',outfit:'dress',shirt:'#5a7aaa',shawl:'#e8e4dc',glasses:true,build:'old',hold:'yarn',yarnc:'#c84a3a'},
    lines:[S(`I wasn't frozen, dear. I was resting my eyes.`,`I wasn't frozen, dear. I was resting my eyes.`),
      S(`I knitted the whole time I was frozen. In my head. It's a very long scarf.`,`I knitted in my head the whole time. A very long scarf.`),
      S(`The Snow Mother's chapel? My granny said the Snow Mother had horns. Like yours, dear. Only made of ice.`,`Granny said the Snow Mother had horns. Like yours. But ice.`)]},
  {id:'f_tollef',name:'Tollef the Bellringer',town:'f_rimeholm',home:true,house:'The Bell Cottage',job:'home',col:'#6a9a5a',
    look:{skin:'#e0ae88',hair:'#8a5a2a',hairdo:'short',outfit:'tunic',shirt:'#3a5a3a',low:'#2a3a2a',build:'tall',stache:'big',beardc:'#8a5a2a'},
    lines:[S(`WHAT? OH! HELLO! I CAN'T HEAR YOU, I'VE BEEN STANDING NEXT TO A BELL FOR FORTY YEARS!`,`WHAT? HELLO! I CAN'T HEAR! TOO MANY BELLS!`),
      S(`THE BELL HAS A SONG! THE SNOW MOTHER'S SONG! I ONLY KNOW THE FIRST BIT!`,`THE BELL HAS A SONG! I KNOW THE FIRST BIT!`),
      S(`I RING IT EVERY MORNING! THE FISH HATE IT!`,`I RING IT EVERY MORNING! FISH HATE IT!`)]},
  {id:'f_saga',name:'Saga',town:'f_rimeholm',home:true,house:'The Quay Hut',job:'home',col:'#3a9aaa',
    look:{skin:'#c88a62',hair:'#e8c060',hairdo:'pony',outfit:'coat',shirt:'#3a7a8a',low:'#2a4a5a',hat:'rain',hatc:'#e8c03a',hold:'rod',freckles:true,build:'teen'},
    lines:[S(`I had a bite! A big one! ...It got away. A month ago. Probably.`,`I had a big bite! It got away. A month ago.`),
      S(`My dad taught me to fish. Dell Fisk taught him. Dell is famous up here. Mostly for losing boats.`,`Dell taught my dad to fish. Dell loses boats.`),
      S(`Race you to the end of the quay. Mind the holes. I won't.`,`Race you! Mind the holes. I won't.`)]},
  {id:'f_sigrun',name:'Sigrun the Cook',town:'f_rimeholm',home:true,house:'The Smokehouse',job:'cook',col:'#d8b890',
    look:{skin:'#f0c4a2',hair:'#6a4a2a',hairdo:'bun',outfit:'tunic',shirt:'#efe6d6',low:'#5a4a3a',apron:'#c8b8a0',build:'wide',hold:'ladle'},
    lines:[S(`My soup! My soup! It's a soup-sicle. ...Actually, that's not bad. Lick it.`,`My soup is a soup-sicle! Lick it.`),
      S(`Hilde at the Warm Mitten stole my soup recipe. I taught it to her. Same thing.`,`Hilde stole my soup. I taught her. Same thing.`),
      S(`Eat. You're all tail and no supper.`,`Eat! You're all tail.`)]},
  {id:'f_bo',name:'Little Bo',town:'f_rimeholm',kid:true,col:'#3a6aaa',
    look:{skin:'#e8bc98',hair:'#e8c060',hairdo:'spiky',outfit:'coat',shirt:'#c84a3a',low:'#4a3a2a',hat:'beanie',hatc:'#3a6aaa',mittens:'#3a6aaa'},
    lines:[S(`Throw! Ha! Got you! ...Where did everyone go? Why are you a dragon?`,`Throw! Got you! Why are you a dragon?`),
      S(`I've been holding this snowball for a month. I'm keeping it. Forever. His name is Steve.`,`I kept this snowball a month. His name is Steve.`),
      S(`Steve says hi. Steve is a snowball. He can't really talk.`,`Steve says hi. He's a snowball.`)]},
  {id:'f_nils',name:'Nils the Goatherd',town:'f_rimeholm',home:true,house:'The Goat Shed',job:'farmer',col:'#9a8a4a',
    look:{skin:'#d39f78',hair:'#4a3a20',hairdo:'short',outfit:'overalls',shirt:'#7a6a3a',low:'#46607a',hat:'cap',hatc:'#5a4a2a',build:'slim'},
    lines:[S(`Nisse! Don't headbutt the dragon. Don't headbutt the...`,`Nisse! Don't headbutt the dragon!`),
      S(`She likes you. That was a friendly headbutt.`,`She likes you. That was a nice headbutt.`),
      S(`Goats on a sea-stack. Seemed like a good idea. Then the bridge fell. Still a good idea, says Nisse.`,`Goats on a rock in the sea. Nisse likes it.`)]},
  {id:'f_oskar',name:'Oskar the Mailman',town:'f_rimeholm',home:true,house:'The Post Hut',job:'home',col:'#4a6aaa',
    look:{skin:'#e6b494',hair:'#3a2a1a',hairdo:'short',outfit:'coat',shirt:'#3a4a7a',low:'#2a3a5a',hat:'cap',hatc:'#3a4a7a',bag:'#7a5a32',stache:true},
    lines:[S(`I've never been late. Not once. Thirty years. And now: a month. I'm going to have to write myself a strongly worded letter.`,`Thirty years, never late. Now a month late!`),
      S(`I have a letter for Brynja in Hearthold. It's got a snowflake stamp. Very old stamp.`,`I have a letter for Brynja. A very old stamp.`),
      S(`Rain, snow, moths, ice. The post goes through. Eventually.`,`The post always gets there. One day.`)]},
  {id:'f_rasmus',name:'Rasmus Ironsnow',town:'f_rimeholm',home:true,house:'The Old Forge',job:'miner',col:'#c8a070',
    look:{skin:'#c08860',hair:'#efeae0',hairdo:'bald',beard:'big',beardc:'#efeae0',outfit:'vest',shirt:'#5a3a2a',low:'#3a2a1a',apron:'#3a2a20',soot:true,build:'big',hold:'hammer'},
    lines:[S(`I mended Rimeholm's bell once, the year it cracked right through. Still rings sweet. Hmm. Loud, too.`,`I mended the bell once. It still rings sweet.`),
      S(`Gunnhild, in Hearthold. Best hands in the north. Too fast with them. Hmm. She'll learn.`,`Gunnhild has the best hands. Too fast.`),
      S(`A forge is a hearth that went to work. Hmm. Hmm. That's a good one. I'll use it again.`,`A forge is a hearth with a job. Hmm. Good one.`)]},
  // Hask's Rest and the wild (ACT3 4.3)
  {id:'f_hask',name:'Old Hask',town:'f_haskrest',home:true,house:'The Big Tent',job:'hunter',col:'#a08060',
    look:{skin:'#d8a07c',hair:'#8a8a8a',hairdo:'long',beard:'big',beardc:'#8a8a8a',outfit:'fur',shirt:'#6a4a2a',low:'#4a3a2a',hat:'fur',hatc:'#6a4a2a',mittens:'#3a2a1a',build:'big',back:'bow',eyepatch:true},
    lines:[S(`Hrm. Pup. You look like you've never been cold in your life.`,`Hrm. Pup. You've never been cold.`),
      S(`My dogs ran off in the first blizzard. Five of 'em. Best team in the north. Snowball, Pepper, Biscuit Two, Sergeant, and Mittens.`,`My five dogs ran off in the snow. Best team in the north.`),
      S(`Ulf at the Lodge? We trade furs. He thinks sheep are better than dogs. He's wrong. Don't tell him I said his name nicely.`,`Ulf thinks sheep beat dogs. He's wrong.`)]},
  {id:'f_pennant',name:'Brother Pennant',town:'f_skyreach',col:'#e8a030',
    look:{skin:'#a87050',hood:'#e8a030',outfit:'robe',shirt:'#e8a030',low:'#c87a1a',sash:'#c83a2a',build:'short',hairdo:'bald'},
    lines:[S(`I've lived on this kite since the moths came. My feet have forgotten what ground is. Wheee. Sorry. Every time.`,`I live on this kite now. Wheee! Sorry.`),
      S(`The other monks blew away. On purpose! To ride the winds of the far south. They send postcards. The postcards blow away.`,`The other monks flew south. Their postcards blow away.`),
      S(`If you ever feel lost, lick a finger and hold it up. The wind will tell you. It will mostly tell you it's cold.`,`Lost? Lick a finger and hold it up. The wind tells you.`)]}
];
for(const c of F2P_CAST){ if(CASTBY[c.id]) continue; CAST.push(c); CASTBY[c.id]=c; F2P.base[c.id]=c.look; }
for(const id of ['f_toastwhistle','f_gunnhild','f_mags','f_hilde','f_eider']) INDOOR[id]=1;
// Mumble the yeti and Greymane on the Whitepass are not townsfolk (their own figures, no hearts, no gifts)
SPECIAL.f_mumble=SPECIAL.f_mumble||{id:'f_mumble',name:'Mumble',col:'#bfe4ff',look:{},lines:[
  S(`(very quietly) Hello. Sorry. Hello.`,`(very quietly) Hello. Sorry.`),
  S(`(squeak)`,`(squeak)`),
  S(`I used to have a big roar. Like a mountain clearing its throat. Then the purple cold came and now I go... (squeak). The wolves laugh at me.`,`I had a big roar. Now I just squeak. The wolves laugh.`)]};
SPECIAL.f_greymane=SPECIAL.f_greymane||{id:'f_greymane',name:'Greymane',col:'#cfe0f0',look:{},lines:[
  S(`(Greymane thumps his tail once. Snow flies everywhere.)`,`(Greymane thumps his tail. Snow flies.)`)]};
SPECIAL.f_nisse=SPECIAL.f_nisse||{id:'f_nisse',name:'Nisse',col:'#efeae0',look:{},lines:[S(`Meh.`,`Meh.`)]};
for(const k of F2P_TOWNS) if(!TOWN_NAME[k]) TOWN_NAME[k]={f_hearthold:'Hearthold',f_rimeholm:'Rimeholm',f_haskrest:'Hask’s Rest',f_skyreach:'Skyreach Temple'}[k];
{ const base=shortName; shortName=function(id){ const m={f_brynja:'Brynja',f_brann:'Captain Brann',f_toastwhistle:'Mayor Toastwhistle',f_gunnhild:'Gunnhild',f_mags:'Mags',f_hilde:'Hilde',f_eider:'Brother Eider',f_pim:'Pim',f_soren:'Soren',
  f_fergus:'Fergus',f_sigrid:'Sigrid',f_hjalmar:'Hjalmar',f_ylva:'Grandmother Ylva',f_tollef:'Tollef',f_saga:'Saga',f_sigrun:'Sigrun',f_bo:'Little Bo',f_nils:'Nils',f_oskar:'Oskar',f_rasmus:'Rasmus',
  f_hask:'Old Hask',f_pennant:'Brother Pennant',f_mumble:'Mumble',f_greymane:'Greymane',f_nisse:'Nisse'}; return m[id]||base(id); }; }

// ---------- where people stand. Home owners get the town houses in CAST order (assignHomesNew, defineTown order);
// the people the player must find stand at fixed spots
const F2P_SPOT={f_brynja:[6880,49040],f_brann:[6270,48900],f_pim:[6650,49080],f_soren:[7900,48250],f_fergus:[6380,49060],f_sigrid:[6720,49175],f_hjalmar:[6960,49185],
  f_hask:[11400,49680],f_pennant:[12650,46550],f_mumble:[13050,48720],f_greymane:[3600,50300],elka:[7960,48280],elka_race:[10150,47340],juniper_floe:[2100,42100],juniper_tent:[7100,48760]};
const F2P_NISSE=[430,47470];
function f2pElkaHere(){ return f2pAct3()&&f2pR('f_pass'); }
function f2pJunAct3(){ return f2pAct3(); }
{ const base=npcSpot; npcSpot=function(c){
  const id=c&&c.id;
  if(id==='f_soren'&&isNight()){ const d=homeDoor('f_soren'); if(d) return [d.x+26,d.y+30]; }
  if(id==='f_bo'){ const d=homeDoor('f_sigrun'); if(d) return [d.x+56,d.y+40]; return [2250,47320]; }
  if(id==='f_nisse'){ const d=homeDoor('f_nils'); if(d) return [d.x-60,d.y+46]; return [F2P_NISSE[0],F2P_NISSE[1]]; }
  if(id==='elka'&&f2pElkaHere()){ const s=f2pAt('f_sled',0)&&!G.flags.f_sled_won?F2P_SPOT.elka_race:F2P_SPOT.elka; return [s[0],s[1]]; }
  if(id==='juniper'&&f2pJunAct3()){ if(!G.flags.f_juniper_found) return F2P_SPOT.juniper_floe.slice(); if(G.flags.f_juniper_home||f2pQ('f_juniper')) return F2P_SPOT.juniper_tent.slice(); return F2P_SPOT.juniper_floe.slice(); }
  if(F2P_SPOT[id]&&id!=='elka'){ const s=F2P_SPOT[id]; return [s[0],s[1]]; }
  return base(c);
}; }
const f2pRimeGen=id=>/^n_f_rimeholm_/.test(String(id));
{ const base=npcPresent; npcPresent=function(id){
  if(id==='f_sigrid') return f2pThawed('f_sigrid');
  if(id==='f_hjalmar') return f2pThawed('f_hjalmar');
  if(id==='f_greymane') return f2pOn('f_pack')&&!F2P.packWalk;
  if(id==='f_nisse') return f2pThawed('f_nils')&&base('f_nils');
  if(id==='f_mumble'||id==='f_pennant') return !!G&&G.mode==='story'&&(actOf(G.stage)>=3||!!G.flags.c_done);
  if(f2pRimeGen(id)&&!f2pQ('f_rime')&&!G.flags['f_thaw_'+id]) return false;
  if(id==='juniper'&&f2pJunAct3()) return !F2P.esc;
  return base(id);
}; }
// a Frostreach person whose spot lands in a wall, a stall, deep water or a cliff face steps to the nearest free ground
// on the same level (x2_world builds the real streets; V9 8: real map, real heights)
function f2pFree(x,y){ try{ return !blockedAt(x,y)&&!(typeof colAt==='function'&&colAt(x,y,12)); }catch(e){ return true; } }
function f2pNear(x,y){ const lv=typeof elevLvl==='function'?elevLvl(x,y):0;
  for(let d=14;d<=260;d+=14){ const k=Math.max(8,Math.round(d/7)); for(let i=0;i<k;i++){ const a=Math.PI/2+i/k*TAU, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; if(f2pFree(px,py)&&(typeof elevLvl!=='function'||elevLvl(px,py)===lv)) return {x:px,y:py}; } } return null; }
{ const base=setupNPCs; setupNPCs=function(){ base(); try{ if(G&&G.npcs) for(const n of G.npcs){ if(n.y<40000||n.y>51000||n.x>=IZX-50||f2pFree(n.x,n.y)) continue; const q=f2pNear(n.x,n.y); if(q){ n.x=q.x; n.y=q.y; if(n.home) n.home=[q.x,q.y]; } } }catch(e){ console.error('x2_people spots',e); } }; }
// Nisse uses the goat figure (n.kind 'goat'); Mumble and Greymane get their own figures (below)
{ const base=mkNPC; mkNPC=function(c,x,y){ const n=base(c,x,y); if(c&&c.id==='f_nisse'){ n.kind='goat'; n.r=10; } if(c&&c.id==='f_mumble') n.r=26; if(c&&c.id==='f_greymane'){ n.r=20; n.snowy=true; } return n; }; }

// a stand-in for the towns while the Act III world module is not in the build (the placeholder map 2): the POIs, the
// towns and their houses, a few shrines, so homes, talk and quests can be played and tested
function f2pStandIn(B){
  B.poi('f_hearthold',{x:6800,y:49000,r:620,name:'Hearthold',level:13,town:true});
  B.poi('f_rimeholm',{x:1900,y:47000,r:520,name:'Rimeholm',level:14,town:true});
  B.poi('f_haskrest',{x:11400,y:49600,r:300,name:'Hask’s Rest',level:14,town:true});
  B.poi('f_skyreach',{x:12650,y:46150,r:420,name:'Skyreach Temple',level:15});
  B.poi('f_mumble',{x:13050,y:48500,r:240,name:'Mumble’s Hollow',level:14});
  B.poi('f_whitepass',{x:2600,y:50450,r:260,name:'the High Pass',level:13});
  B.town('f_hearthold',{name:'Hearthold',music:'town',generics:{ties:['Ulf at Frostpine Lodge','Elka the sledder','Maren the blacksmith','the Wind Monks']},hz:()=>({wc:'#e8e0d4',rc:'#3a5a7a'})});
  B.town('f_rimeholm',{name:'Rimeholm',music:'tender',generics:{ties:['Grandmother Ylva','Sigrun the cook','Tollef the bellringer']},hz:()=>({wc:'#d8e4ec',rc:'#5a6a7a'})});
  B.town('f_haskrest',{name:'Hask’s Rest',music:'town',generics:false,hz:()=>({wc:'#b89a78',rc:'#6a4a2a'})});
  B.houses(6800,49000,14,220,540,{town:'f_hearthold',seed:7301,roofs:['#3a5a7a','#7a2a2a','#4a4a5a'],snow:true});
  B.houses(1900,47000,12,160,480,{town:'f_rimeholm',seed:7302,roofs:['#5a6a7a','#7a5a3a'],snow:true});
  B.houses(11400,49600,5,120,260,{town:'f_haskrest',seed:7303,roofs:['#6a4a2a','#8a6a3a'],snow:true});
  B.shrine({id:'s_f_hearthold',x:7150,y:49250,name:'Hearth Shrine'});
  B.shrine({id:'s_f_rimeholm',x:2450,y:47450,name:'Rimeholm Shrine'});
  B.shrine({id:'s_f_haskrest',x:11150,y:49850,name:'Trapper’s Shrine'});
  B.shrine({id:'s_f_windscour',x:10100,y:47300,name:'Windscour Shrine'});
  B.shrine({id:'s_f_whitepass',x:2950,y:50300,name:'Whitepass Shrine'});
}
if(MAPS[2]&&MAPS[2].placeholder){ const b0=MAPS[2].build; MAPS[2].build=function(B){ if(b0) b0.call(this,B); try{ f2pStandIn(B); }catch(e){ console.error('x2_people stand-in',e); } }; }

// ---------- talk (a1g_talk.js format, ACT3 4.4): bio, rumor (a quest or a secret, under More... with its own label,
// rumorAsk), gifts (Rimeholm loves fish, Hearthold loves honey, nobody likes moonlily), secret (3 hearts) and best (5
// hearts). Their Act III openers, moments (the old chat), topics (the old about and deep), idle and bye lines are data
// now: game/story/act3/people.js (talk v11, J11).
Object.assign(TALK,{
  f_brynja:{bio:S('Hearthkeeper of Hearthold. Talks to the Great Hearth like a pet.','She keeps the Great Hearth. She talks to it.'),
    rumorAsk:[`Who is the big snowman on the road?`,`Who is the big snowman?`],
    rumor:{t:S(`There's a giant snowman with a monocle on the White Road. Sir Frostington, the children call him. He wasn't there before the winter. Something's inside him. I can smell vegetables.`,`A giant snowman stands on the road. Something is inside. Smells like vegetables.`),hint:'f_lm_frostington',need:()=>f2pR('f_kindle')},
    loves:['honey'],hates:['moonlily'],
    secret:{t:S(`A coal from the Great Hearth. Keep it in your pocket. You'll never be cold.`,`A coal from the Hearth. You'll never be cold.`),reward:{stamina:15}},
    best:{t:S(`You're family to this town now. The Hearth says so. Don't ask me how a fire says things.`,`You're family now. The Hearth says so.`),reward:{maxhp:15}}},
  f_brann:{bio:S('Captain of the Hearthwardens. Loud. Brave. Afraid of moths.','Captain of the guards. Loud and brave. Scared of moths.'),
    rumorAsk:[`Has anyone gone out on the sea ice?`,`Anyone out on the sea ice?`],
    rumor:{t:S(`A girl with a map case went out on the floes last week! On foot! Brave! Or a moth! Probably brave!`,`A girl with maps went out on the ice! Brave!`),hint:'f_lm_tent',need:()=>f2pR('f_kindle')&&!G.flags.f_juniper_found},
    loves:['fish'],hates:['moonlily'],
    secret:{t:S(`Hearthwarden's shield polish! Your armor holds better!`,`Shield polish! Your armor holds better!`),reward:{armor:0.05}},
    best:{t:S(`You're an honorary Hearthwarden! Here's your badge! It's mostly an icicle!`,`You're a Hearthwarden now! Here's your icicle badge!`),reward:{bless:1}}},
  f_toastwhistle:{bio:S('Mayor of Hearthold. Everything is fine. Everything.','The mayor. She says everything is fine.'),
    rumorAsk:[`What are the ice statues for?`,`What are the ice statues?`],
    rumor:{t:S(`The Ice Sculpture Garden, by the town wall, has statues of six monsters from the south. The sign says the first one to fall guards the gold. A mystery! A fine mystery.`,`The ice statues guard gold. The first to fall has it.`),hint:'f_lm_garden',need:()=>f2pR('f_kindle')},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`The key to the city! It opens nothing. But it's very shiny.`,`The key to the city! It opens nothing. Shiny!`),reward:{coins:60}},
    best:{t:S(`I'm going to name a street after you. Ash Lane. It's very warm.`,`I'm naming a street for you. Ash Lane!`),reward:{coins:100}}},
  f_gunnhild:{bio:S('Smith of Hearthold. A big fan of your mom.','The town smith. A big fan of your mom.'),
    rumorAsk:[`Where does starfrost come from?`,`Where is starfrost?`],
    rumor:{t:S(`Starfrost ore grows where fire meets frost. Blue as a glacier. I've heard it rattles out of mammoth bones in the Stonehorn hills, if you knock hard enough.`,`Blue starfrost ore hides in mammoth bones. Knock hard!`),hint:'f_sec_graveyard',need:()=>f2pOn('f_forge')},
    loves:['honey'],hates:['moonlily'],
    secret:{t:S(`A whetstone of northern stone.`,`A whetstone from the north.`),reward:{dmg:0.05}},
    best:{t:S(`I made you a pair of anvil earrings. They're very heavy. Wear them for strength.`,`Anvil earrings! Heavy. For strength.`),reward:{maxhp:10,dmg:0.03}}},
  f_mags:{bio:S('A Gearhaven tinker stranded in the snow. Loves explosions.','A tinker from Gearhaven. She loves explosions.'),
    rumorAsk:[`Who pushed your steam sled off the road?`,`Who pushed your sled?`],
    rumor:{t:S(`The Snowgobs in the Gulch pushed my steam sled right off the road. Their king wears a bucket. A bucket! I want that bucket. For science.`,`The Snowgob King wears a bucket! I want it. For science.`),hint:null,need:()=>f2pR('f_kindle')},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`A spare bomb fuse. Your bombs fit better in the bag. Don't ask how. I don't know how.`,`A spare fuse. More bombs fit in your bag.`),reward:{f2p:()=>{ G.flags.f_bombfuse=1; f2pFuse(); }}},
    best:{t:S(`A tiny brass Ash figure that breathes a spark. I made it at three in the morning. Don't ask.`,`A tiny brass you! It breathes a spark!`),reward:{bless:1}}},
  f_hilde:{bio:S('Innkeeper of the Warm Mitten. Feeds everyone. Even chairs. Rest here.','She runs the inn. She feeds everyone. Rest here.'),
    rumorAsk:[`Is there anywhere warm out there?`,`Anywhere warm out there?`],
    rumor:{t:S(`The Steamwell, on the Whitepass, is a hot spring. Snow monkeys bathe in it. Cheeky ones. Keep your hat on.`,`Snow monkeys bathe in the hot spring. Keep your hat on.`),hint:'f_sec_steam'},
    loves:['fish'],hates:['moonlily'],
    secret:{t:S(`My soup recipe. Your draughts heal more.`,`My soup recipe. Your draughts heal more.`),reward:{heal:0.1}},
    best:{t:S(`Free beds at the Warm Mitten forever. And the cat likes you.`,`Free beds forever. The cat likes you.`),reward:{freeinn:true}}},
  f_eider:{bio:S('Archivist of the Hearth Archive. Sister Wren’s cousin. Whispers.','He keeps the old books. Wren is his cousin.'),
    rumorAsk:[`Were the old songs ever written down?`,`Were the songs written down?`],
    rumor:{t:S(`(whisper) The archive says Rimeholm's bell, a stone on the sky isles and a drum in the Stonehorn hills all have words carved on them. The same tune, three times. Shh. Sorry. It's exciting.`,`A bell, a stone and a drum have the same song on them!`),hint:null,need:()=>f2pR('f_thaw')},
    loves:['honey'],hates:['fish'],
    secret:{t:S(`A copy of the old map of the north.`,`An old map of the north.`),reward:{reveal:true}},
    best:{t:S(`I'm adding you to the archive. Page one. Next to the Snow Mother.`,`You're in the archive now. Page one!`),reward:{bless:1}}},
  f_pim:{bio:S('Runs the only cocoa stand in the north. A tiny businesswoman.','She sells cocoa. A tiny boss.'),
    rumorAsk:[`Who is that extra cup for?`,`Who is that cup for?`],
    rumor:{t:S(`Little Bo from Rimeholm used to buy cocoa every Sunday. Then the village went quiet. I've been saving his Sunday cocoa. It's a month of cocoa now.`,`Little Bo from Rimeholm stopped coming. I saved his cocoa.`),hint:null,need:()=>f2pR('f_thaw')&&!f2pThawed('f_bo')},
    loves:['honey'],hates:['moonlily'],
    secret:{t:S(`Free cocoa refills. Forever. Don't tell my investors.`,`Free cocoa forever! Shh.`),reward:{f2p:()=>{ G.flags.f_pim_free=1; }}},
    best:{t:S(`Partner! You're my business partner now. Half the stand is yours. The cold half.`,`Partner! Half the stand is yours. The cold half.`),reward:{coins:80}}},
  f_soren:{bio:S('Sled maker of Hearthold. Calm, slow, and very fast downhill.','He makes sleds. He is calm, and very fast.'),
    rumorAsk:[`Has anyone sledded the whole Windscour?`,`Anyone sled the Windscour?`],
    rumor:{t:S(`Nobody has ever sledded from the Windscour all the way down to my hill in one go. Some say you'd need to ride the wind for the steep bits. Some say that's cheating. I say it's beautiful.`,`Nobody ever sledded from the Windscour to my hill. Maybe with wind.`),hint:null,need:()=>f2pR('f_gap')},
    loves:['fish'],hates:['moonlily'],
    secret:{t:S(`Sled wax for your feet. You roll quicker. Don't ask.`,`Sled wax for your feet. You roll faster.`),reward:{roll:true}},
    best:{t:S(`The Ash Special, a red sled with flames painted on. It's hanging up in my shed with your name on it. Whenever you want it.`,`A red sled with flames! It's yours. Your name is on it.`),reward:{f2p:()=>{ G.flags.f_ash_sled=1; setBanner(S('The Ash Special','The Ash Special'),S('A red racing sled with flames on it, in Soren’s shed.','A red sled with flames!'),2.8); }}}},
  f_fergus:{bio:S('A mitten seller who froze on the White Road. Sells mittens at the West Gate now.','He sells mittens by the West Gate.'),
    loves:['honey'],hates:['moonlily']},
  f_sigrid:{bio:S('An explorer from Hearthold. Was frozen deep in the Glacier Maze.','An explorer. She was frozen in the maze.'),
    loves:['honey'],hates:['moonlily']},
  f_hjalmar:{bio:S('An explorer who froze mid-sneeze in the Glacier Maze.','He froze while sneezing.'),
    loves:['fish'],hates:['moonlily']},
  // Rimeholm folk: a bio each, gifts (fish!), and a rumor or two
  f_ylva:{bio:S('Elder of Rimeholm. Sleepy, kind, a little sly.','The oldest granny in Rimeholm.'),
    rumorAsk:[`What is carved on the chapel?`,`What is on the chapel?`],
    rumor:{t:S(`The little chapel by the cliffs has a carved dragon curled around a snowflake. My granny said it was a portrait. Of somebody's auntie.`,`The chapel has a dragon around a snowflake. Somebody's auntie.`),hint:null},
    loves:['fish'],hates:['moonlily']},
  f_tollef:{bio:S('Bellringer of Rimeholm. Deaf from the bell. Very loud.','The bell ringer. He is very loud.'),
    rumorAsk:[`What does your bell know?`,`What does the bell know?`],
    rumor:{t:S(`THE BELL KNOWS THE FIRST VERSE OF THE SNOW MOTHER'S SONG! ASK ME TO RING IT! I'LL SING IT! LOUDLY!`,`THE BELL HAS THE FIRST VERSE! I'LL SING IT!`),hint:'f_lm_bell',need:()=>f2pOn('f_song')&&!G.flags.f_v1},
    loves:['fish'],hates:['moonlily']},
  f_saga:{bio:S('Fisher girl of Rimeholm. Brisk and competitive.','A fisher girl. She loves to win.'),
    rumorAsk:[`Is there anything out past the floes?`,`Anything past the ice?`],
    rumor:{t:S(`There's a frozen shipwreck out past the floes. The Captain's chest is still on deck. You'd need to cross the shallows and swing up the mast.`,`A frozen ship is past the ice. Its chest is still there.`),hint:'f_sec_wreck'},
    loves:['fish'],hates:['moonlily']},
  f_sigrun:{bio:S('Cook of Rimeholm. Feeds everyone. No nonsense.','The cook. She feeds everyone.'),
    rumorAsk:[`Who needs your soup the most?`,`Who needs soup most?`],
    rumor:{t:S(`Big shy yeti out past the Pinewhisper. Mumble. Lovely fellow. Lost his roar. Nothing a good hot soup can't fix.`,`Mumble the yeti lost his roar. Hot soup will fix it.`),hint:null,need:()=>!f2pQ('f_mumble')},
    loves:['fish'],hates:['moonlily']},
  f_bo:{bio:S('A cheeky kid of Rimeholm. Owns a snowball called Steve.','A cheeky kid. His snowball is Steve.'),
    loves:['fish'],hates:['moonlily']},
  f_nils:{bio:S('Goatherd of Rimeholm. Gentle. His goat, Nisse, is not.','The goat herder. His goat Nisse is rude.'),
    loves:['fish'],hates:['moonlily']},
  f_oskar:{bio:S('Postman of Rimeholm. Never late. Until now.','The mailman. He is never late. Until now.'),
    rumorAsk:[`Who is that old letter for?`,`Who is that letter for?`],
    rumor:{t:S(`I have a letter for Brynja in Hearthold. An old one. A snowflake stamp. It says something about a Snow Mother. I don't read the post. I only read the outside.`,`My letter for Brynja talks of a Snow Mother.`),hint:null,need:()=>!f2pOn('f_song')&&!f2pQ('f_song')},
    loves:['fish'],hates:['moonlily']},
  f_rasmus:{bio:S('The old smith of Rimeholm. Slow, deep, wise. Makes one pun.','The old smith. Slow and wise. One pun.'),
    loves:['fish'],hates:['moonlily']},
  f_hask:{bio:S('Fur trapper of the Pinewhisper. Talks to dogs more than people. Calls you pup.','A trapper. He talks to dogs. He calls you pup.'),
    rumorAsk:[`What lives in the hollow past your camp?`,`What is in the hollow?`],
    rumor:{t:S(`Big shy yeti in the hollow past my camp. Mumble. He squeaks now. The Rimehounds laugh at him every night. Makes my blood boil. Hrm.`,`Mumble the yeti lives near here. Wolves laugh at him.`),hint:null,need:()=>!f2pQ('f_mumble')},
    loves:['honey'],hates:['moonlily'],
    secret:{t:S(`Hrm. A wolf-tooth charm. Keeps your feet sure on ice.`,`A wolf-tooth charm. Sure feet on ice.`),reward:{stamina:20}},
    best:{t:S(`You're pack now, pup. Here. My spare bow-string. Strongest in the north. Hrm.`,`You're pack now, pup. Take my bowstring.`),reward:{crit:0.04}}},
  f_pennant:{bio:S('The last Wind Monk of Skyreach. Lives on a kite. Says wheee.','The last Wind Monk. He lives on a kite.'),
    rumorAsk:[`What is the stone full of holes?`,`What is the holey stone?`],
    rumor:{t:S(`The Singing Stone on the little isle past the temple is full of holes. Ride the wind past it and it sings. Old words. Very old. Wheee.`,`Ride the wind past the Singing Stone. It sings old words.`),hint:'f_lm_singing',need:()=>f2pR('f_sky')},
    loves:['honey'],hates:['moonlily'],
    secret:{t:S(`A wind feather from the temple roof. Hold it and your wings feel lighter. Wheee!`,`A wind feather. Your wings feel lighter!`),reward:{energy:15}},
    best:{t:S(`You're an honorary Wind Monk! You don't have to shave your head. Please don't. Here, a breath of the high wind.`,`You're a Wind Monk now! Here's some high wind.`),reward:{stamina:20}}}
});
// the shared look of a talk reward hook: {f2p:fn} runs custom payoffs (the same in quest rewards)
{ const base=giveTalkReward; giveTalkReward=function(r){ base(r); if(r&&typeof r.f2p==='function') try{ r.f2p(); }catch(e){ console.error(e); } }; }
{ const base=giveReward; giveReward=function(r){ base(r); if(r&&typeof r.f2p==='function') try{ r.f2p(); }catch(e){ console.error(e); } }; }
// Mags's spare fuse: three more bombs fit in the bag (once, now or when Ash gets the bombs)
function f2pFuse(){ if(!G.flags.f_bombfuse||G.flags.f_bombfuse_bag) return; if(G.weapons&&G.weapons.bombs&&typeof bombBag==='function'){ G.flags.f_bombfuse_bag=1; bombBag(3); } }

// ---------- first meetings and everyday greetings in each person's own voice. In Act III every person here is on the
// v11 talk (act3/people.js: their first meeting is a once opener there); these are for the acts where they are not.
const F2P_FIRST={
  f_brynja:S(`There, there, old girl. Somebody's come to see you. ...Oh. You're the horned boy. Come closer. Let me look at you. Skinny.`,`Oh! The horned boy. Come here. Skinny!`),
  f_brann:S(`Stop right there! Name, and are you a moth? ...Horns. A tail. Not a moth, then. Carry on! Captain Brann Stoutmitt, Hearthwardens!`,`Stop! Are you a moth? No? Carry on! I'm Captain Brann!`),
  f_toastwhistle:S(`A visitor! Welcome to Hearthold, where everything is fine! I'm Mayor Ottilie Toastwhistle. Everything is fine.`,`Welcome! I'm Mayor Toastwhistle. Everything is fine!`),
  f_gunnhild:S(`Hm. A dragon in my forge. Gunnhild Anvilheart. ...Wait. That sword. That's Maren's work. You're Maren's kid?`,`I'm Gunnhild. Wait. That's Maren's sword! You're her kid?`),
  f_mags:S(`A dragon! A real warm one! Mags Sprocket, Gearhaven's third-best tinker. Can I measure your sparks?`,`A dragon! I'm Mags, a tinker. Can I measure your sparks?`),
  f_hilde:S(`Welcome to the Warm Mitten, lamb! I'm Hilde. Sit. Soup. Don't sit on Biscuit. That's the cat.`,`Welcome! I'm Hilde. Sit. Soup. Mind the cat.`),
  f_eider:S(`(whispering) Oh. Hello. I'm Brother Eider, and this is the archive. Sorry. You're very warm. The books like you already.`,`(whisper) Hello. I'm Eider. The books like you.`),
  f_pim:S(`Customer! Hot cocoa, three coins! I'm Pim. I own this stand. And one day, all the stands.`,`Customer! Cocoa, three coins! I'm Pim.`),
  f_soren:S(`Hey. Soren. I make sleds. You look like you'd go fast downhill. That's a compliment.`,`Hey. I'm Soren. I make sleds.`),
  f_fergus:S(`Mittens! Oh, it's you! The dragon who thawed me! Fergus Fiddlesticks. Mittens for life, free, for you.`,`It's you! You thawed me! I'm Fergus. Free mittens!`),
  f_sigrid:S(`The dragon from the maze! Sigrid. I'm home now. I've decided to explore the kitchen next. Much safer.`,`The dragon from the maze! I'm Sigrid.`),
  f_hjalmar:S(`Achoo! Oh. Hello. Hjalmar. We met in the Glacier Maze. I was the frozen one.`,`Achoo! I'm Hjalmar. I was the frozen one.`),
  f_ylva:S(`Hello, dear. I'm Ylva. Everyone's granny, here. Sit, I'll find you some wool.`,`Hello, dear. I'm Ylva. Everyone's granny.`),
  f_tollef:S(`HELLO! TOLLEF! BELLRINGER! WHAT'S YOUR NAME? ...WHAT? NEVER MIND! HELLO!`,`HELLO! I'M TOLLEF! BELL RINGER!`),
  f_saga:S(`You're the dragon who thawed us. I'm Saga. I fish. I'm better at it than you. Probably.`,`I'm Saga. I fish. Better than you.`),
  f_sigrun:S(`You. Dragon. Sigrun. I cook. You sit. That's how this works.`,`I'm Sigrun. I cook. You sit.`),
  f_bo:S(`Hi, dragon! I'm Bo. You met Steve already. Say hi again, Steve.`,`Hi! I'm Bo. Say hi again, Steve.`),
  f_nils:S(`Hello! Nils. Goats. Well, goat. Nisse. Don't turn your back on her.`,`Hello! I'm Nils. My goat is Nisse. Watch out.`),
  f_oskar:S(`Oskar, Rimeholm post. A month late. A whole month. Oh. Hello. Sorry. Thirty years, and never late until now.`,`I'm Oskar, the mailman. A month late! Sorry.`),
  f_rasmus:S(`Hmm. You're the warm one. Rasmus. Smith. Old one. Hmm.`,`Hmm. You're the warm one. I'm Rasmus.`),
  f_hask:S(`Hrm. Pup. Hask. This is my camp. Those are my tents. That was my kennel. Hrm.`,`Hrm. Pup. I'm Hask. This is my camp.`),
  f_pennant:S(`Wheeee... oh! Hello! Sorry, it slips out. Brother Pennant, the last Wind Monk of Skyreach!`,`Hello! I'm Brother Pennant. Wheee!`),
  f_mumble:S(`(very quietly) Hello. Sorry. Hello. I'm Mumble.`,`(quietly) Hello. Sorry. I'm Mumble.`)
};
const F2P_HELLO={
  f_brynja:[S(`There's my warm child.`,`My warm child.`),S(`Come, sit by her. She likes you.`,`Sit by the fire. She likes you.`)],
  f_brann:[S(`Horns! At ease! I mean me! I'm at ease!`,`At ease! I mean me!`),S(`Any moths? Report!`,`Any moths? Report!`)],
  f_toastwhistle:[S(`Ash! Everything is fine!`,`Ash! Everything is fine!`),S(`Oh, good, a hero. Fine. Good. Fine.`,`Good, a hero. Fine.`)],
  f_gunnhild:[S(`Maren's kid! Come in!`,`Maren's kid! Come in!`),S(`Hm. Ash. Good.`,`Hm. Ash. Good.`)],
  f_mags:[S(`Ash! I made a thing! It might explode! Hi!`,`Ash! I made a thing! Hi!`),S(`My favorite fire!`,`My favorite fire!`)],
  f_hilde:[S(`Ash, lamb! Soup?`,`Ash! Soup?`),S(`Come in from the cold, lamb.`,`Come in from the cold.`)],
  f_eider:[S(`(whisper) Hello, Ash.`,`(whisper) Hello.`),S(`Oh. You. Good. Shh.`,`Oh. You. Shh.`)],
  f_pim:[S(`Customer!`,`Customer!`),S(`Back for cocoa? Smart.`,`Back for cocoa? Smart.`)],
  f_soren:[S(`Hey, fast one.`,`Hey, fast one.`),S(`Snow's good today.`,`Good snow today.`)],
  f_fergus:[S(`Mittens for my hero!`,`Mittens for my hero!`)],
  f_sigrid:[S(`Hi, dragon! Still warm?`,`Hi, dragon!`)],
  f_hjalmar:[S(`Achoo! Hello!`,`Achoo! Hello!`)],
  f_ylva:[S(`Hello, dear.`,`Hello, dear.`),S(`There's my warm one.`,`My warm one.`)],
  f_tollef:[S(`HELLO, DRAGON!`,`HELLO, DRAGON!`),S(`WHAT? OH! HELLO!`,`WHAT? HELLO!`)],
  f_saga:[S(`Ash. Caught anything? I have.`,`Caught anything? I have.`)],
  f_sigrun:[S(`Sit. Have a bowl.`,`Sit. Have a bowl.`),S(`You again. Good. Sit.`,`You again. Sit.`)],
  f_bo:[S(`Ash! Steve says hi!`,`Ash! Steve says hi!`)],
  f_nils:[S(`Hello! Mind Nisse.`,`Hello! Mind Nisse.`)],
  f_oskar:[S(`Post's on time today. Barely.`,`Post's on time. Barely.`)],
  f_rasmus:[S(`Hmm. Warm one.`,`Hmm. Warm one.`)],
  f_hask:[S(`Hrm. Pup.`,`Hrm. Pup.`),S(`Pup. Warm enough?`,`Pup. Warm enough?`)],
  f_pennant:[S(`Wheee! Hello again!`,`Wheee! Hello!`)],
  f_mumble:[S(`(quietly) hello again.`,`(quietly) hello.`),S(`(wave)`,`(wave)`)]
};
const F2P_NIGHT=[S(`Late, Ash. Keep near the lamps. The moths like the dark.`,`It's late. Stay near the lamps.`),S(`Can't sleep? Nobody can. That storm hums.`,`Can't sleep? The storm hums.`),S(`Mind the cold out there. It bites at night.`,`The cold bites at night.`)];
// (people Ash has already met in a story scene are greeted as people he knows, not with their first-meeting line)
const F2P_MET={f_brynja:['f_brynja'],f_brann:['f_gate'],f_eider:['f3_eider'],f_pim:['f3_pim'],f_ylva:['f3_ylva_wake'],f_pennant:['f3_pennant_meet'],
  f_mumble:['mb_offer'],f_mags:['bm_offer'],f_gunnhild:['fg_offer'],f_hask:['dg_offer'],f_toastwhistle:['wm_offer'],f_rasmus:['rm_bluefire']};
function f2pMetBefore(id){ try{ const sn=G.story&&G.story._seen; if(sn&&(F2P_MET[id]||[]).some(k=>sn[k])) return true;
  if(id==='f_ylva'&&G.flags.f_ylva) return true; if(id==='f_brann'&&G.choices&&G.choices.f3_moth) return true; }catch(e){} return false; }
{ const base=greetLine; greetLine=function(id){
  if(!F2P_FIRST[id]) return base(id);
  if(!(G.seenTalk&&G.seenTalk['met_'+id])&&!f2pMetBefore(id)) return F2P_FIRST[id];
  const dg=deedGreet(id); if(dg) return dg;
  const f=typeof friendOf==='function'?friendOf(id):0;
  if(f>=5) return pick([S(`Ash! My favorite person in the whole north!`,`Ash! My favorite!`),S(`There's my best friend.`,`My best friend!`)]);
  if(isNight()&&id!=='f_tollef'&&Math.random()<0.4) return pick(F2P_NIGHT);
  return pick(F2P_HELLO[id]||[S(`Hello, Ash.`,`Hello, Ash.`)]);
}; }
// "What's new?" lines for the folk at home while Ash is up north (ACT3 11): Yara reads the mail. (The Frostreach
// people's own news, Ulf's and Brisket's are their Act III openers now: act3/people.js.)
const F2P_HOME_MOOD={
  yara:()=>S(`Pebble tells me how you're getting on up there, Ash. Listen to Tove.`,`Pebble tells me how you are. Listen to Tove.`)
};
{ const base=moodLine; moodLine=function(id){
  if(F2P_HOME_MOOD[id]&&f2pAct3()&&Math.random()<0.6) return F2P_HOME_MOOD[id]();
  return base(id);
}; }

// ---------- what the north says out loud. The stock barks, chats and deed greetings that belong to other lands
// stay in other mouths; a short list of universal ones (Pip, the night, rain, weapons, levels) works everywhere.
{ const OKB={pip1:1,pip2:1,pip3:1,pip4:1,duC2:1,duC3:1,brC2:1,grC1:1,grC2:1,grC3:1,night3:1,night4:1,low1:1,low2:1,dag1:1,boom1:1,bow1:1,bow2:1,lvl2:1,c_cst2:1,c_cst3:1,c_cst4:1};
  // (not 'hat': "Did you see Ash's hat? Marigold must be thrilled." is about Emberhollow's hatter, whom nobody up here knows)
  const OKC={pip:1,night:1,wings:1,whisper:1,breath:1,mip:1,goat:1,duch:1,wolf:1,map:1};
  const notFrost=f=>n=>f(n)&&!F2P_TOWNS.includes(n.town);
  for(const b of BARKS) if(!OKB[b.k]&&!String(b.k).startsWith('f_')) b.w=notFrost(b.w);
  for(const c of CHATS) if(!OKC[c.k]&&!String(c.k).startsWith('f_')){ c.a=notFrost(c.a); c.b=notFrost(c.b); }
  for(const k in DGREET) for(const e of DGREET[k]) if(!k.includes('@')&&!k.startsWith('f_')) e[0]=e[0]+'|'+F2P_NOTFROST; }
const f2pLit=()=>!!G.flags.f_hearth_lit, f2pCold=()=>!G.flags.f_hearth_lit;
// personal barks
B('f_bry1','id:f_brynja',ALWAYS,S(`There, there, old girl. There, there.`,`There, there, old girl.`));
B('f_bry2','id:f_brynja',f2pCold,S(`Come on, old girl. Just one more night. Just one more.`,`Come on, old girl. One more night.`));
B('f_bra1','id:f_brann',ALWAYS,S(`Moths. Moths everywhere. In my dreams. In my helmet. In my DREAMS about my helmet.`,`Moths everywhere! In my dreams! In my helmet!`));
B('f_bra2','id:f_brann',ALWAYS,S(`Hearthwardens! Stand up straight! ...Gunnar, that's a snowman.`,`Stand up straight! ...Gunnar, that's a snowman.`));
B('f_toa1','id:f_toastwhistle',ALWAYS,S(`Fine! Fine. Fine fine fine.`,`Fine! Fine. Fine.`));
B('f_gun1','id:f_gunnhild',()=>!f2pQ('f_forge')&&!G.flags.f_forge_lit,S(`Cold anvil. Cold hammer. Cold Gunnhild.`,`Cold anvil. Cold hammer. Cold me.`));
B('f_gun2','id:f_gunnhild',()=>!!G.flags.f_forge_lit,S(`CLANG! CLANG! Hum hum hum. CLANG!`,`CLANG! CLANG! Hum hum.`));
B('f_mag1','id:f_mags',ALWAYS,S(`Stand back! Further! Further than that! ...Okay, it was a dud. Come back.`,`Stand back! ...It was a dud.`));
B('f_hil1','id:f_hilde',ALWAYS,S(`Soup's on! Soup's always on!`,`Soup's on!`));
B('f_eid1','id:f_eider',ALWAYS,S(`(whispering to a book) There, there. Nobody's going to spill cocoa on you.`,`(whisper) Nobody will spill on you, book.`));
B('f_pim1','id:f_pim',ALWAYS,S(`Cocoa! Get your cocoa! Warms you up from the tummy out!`,`Cocoa! Warms your tummy!`));
B('f_sor1','id:f_soren',ALWAYS,S(`Wheee... sorry. That's the monk's word. Mine is "whoosh."`,`Whoosh!`));
B('f_fer1','id:f_fergus',ALWAYS,S(`MITTENS! Warm mittens! Mittens for paws, claws and hands!`,`MITTENS! For paws and claws!`));
B('f_tol1','id:f_tollef',ALWAYS,S(`WHAT? WHO SAID THAT? NOBODY? HELLO, NOBODY!`,`WHAT? WHO SAID THAT?`));
B('f_sig1','id:f_sigrun',ALWAYS,S(`Eat. Eat. Have you eaten? Eat.`,`Eat! Have you eaten? Eat!`));
B('f_bo1','id:f_bo',ALWAYS,S(`Steve wants to go sledding. Steve always wants to go sledding.`,`Steve wants to go sledding.`));
B('f_nil1','id:f_nils',ALWAYS,S(`Nisse, no. Nisse. NISSE. ...She ate my hat.`,`Nisse, no! She ate my hat.`));
B('f_osk1','id:f_oskar',ALWAYS,S(`Late. Late. A month late. Late.`,`Late. A month late.`));
B('f_ras1','id:f_rasmus',ALWAYS,S(`Hmm. Hmmm. Hmm.`,`Hmm. Hmm.`));
B('f_yl1','id:f_ylva',ALWAYS,S(`Knit one, purl one. Knit one, purl one. Oh, bother. Dropped one.`,`Knit one, purl one. Oops.`));
B('f_hsk1','id:f_hask',()=>!f2pQ('f_dogs'),S(`Hrm. Too quiet. A camp should have barking.`,`Too quiet. A camp needs barking.`));
B('f_hsk2','id:f_hask',()=>f2pQ('f_dogs'),S(`Pepper. PEPPER. Drop the boot.`,`Pepper! Drop the boot!`),{r:['f_dog',S(`Woof!`,`Woof!`)]});
// town barks: the dying Hearth, the blue Hearth, the frozen village, the moths, and later the moon
B('f_hh1',F2P_HH,f2pCold,S(`My soup froze on the spoon. And I was sitting right next to the Hearth!`,`My soup froze. Right next to the Hearth!`));
B('f_hh2',F2P_HH,f2pCold,S(`Brr. My goosebumps have goosebumps.`,`Brr! So cold!`));
B('f_hh3',F2P_HH+'|kid',f2pCold,S(`Are you the horned boy? Can you breathe on my cocoa?`,`Can you breathe on my cocoa?`));
B('f_hh4',F2P_HH,f2pLit,S(`The Hearth is BLUE! I didn't know fire could be blue! I didn't know fire could be HAPPY!`,`The Hearth is BLUE! Fire can be happy!`),{d:'f_hearth'});
B('f_hh5',F2P_HH,f2pLit,S(`I took my coat off. Then I put it back on. Baby steps.`,`I took off my coat. Then put it back on.`));
B('f_hh6',F2P_HH,()=>!!G.flags.f_northgate,S(`The North Gate's open! Gunnar finally stopped licking it. Well. He licked the open bit too.`,`The North Gate is open! Gunnar licked it anyway.`),{d:'f_gate'});
B('f_hh7',F2P_HH,()=>isNight()&&!G.flags.f_hush_done,S(`Shutters closed. Lamps low. The moths come down off the mountain at night.`,`Close the shutters. The moths come at night.`));
B('f_hh8',F2P_HH,()=>G.choices.f_glaciar==='free'&&G.choices.f_glaciar_home==='stay',S(`The Snow Mother is REAL! And she's his AUNTIE!`,`The Snow Mother is real! She's his auntie!`));
B('f_hh9',F2P_HH,()=>(G.flags.f_frozen_n|0)>=6,S(`My cousin was frozen on the Glimmerfrost for a month! The dragon warmed her up! She owes the dragon cocoa now.`,`The dragon thawed my cousin!`));
B('f_rh1',F2P_RH,ALWAYS,S(`Did you know we were frozen? Neither did we.`,`We were frozen? We didn't know!`));
B('f_rh2',F2P_RH,ALWAYS,S(`I missed a month. Did anything good happen? Oh. A dragon kid happened. Good.`,`I missed a month. A dragon kid came. Good.`));
B('f_rh3',F2P_RH,()=>f2pQ('f_rime'),S(`The bell rings every morning again! The whole village comes out to cheer! The fish don't.`,`The bell rings again! We cheer! The fish don't.`),{d:'q_f_rime'});
B('f_hr1',F2P_HR+'|id:f_hask',()=>f2pQ('f_mumble'),S(`Did you hear that roar in the Pinewhisper? The whole forest shook. Hrm. Good lad.`,`Did you hear that roar? Good lad.`));
B('f_ft1',F2P_FT,()=>f2pMoon()<100,S(`Look at the moon. Somebody bit it. Who bites a MOON?`,`Somebody bit the moon!`));
B('f_ft2',F2P_FT,()=>!!G.weapons&&!!G.weapons.bombs&&G.weapon==='bombs',S(`Are those BOMBS? Mags made you bombs? Stand over there. Further.`,`Are those bombs? Stand over there!`),{d:'wpn_bombs'});
B('f_ft3',F2P_FT,()=>hasAbil('blaze'),S(`Your fire went BLUE! I saw it from my window! My window melted a bit!`,`Your fire went blue! My window melted!`),{d:'trial_blaze'});
B('f_ft4',F2P_FT+'|kid',()=>hasAbil('windride'),S(`You RODE the WIND! Like a kite! Can I ride on your back?`,`You rode the wind! Can I ride too?`),{d:'trial_windride'});
B('f_ft5',F2P_FT,()=>G.comp==='greymane'&&compNear('greymane'),S(`Is that a WOLF? A friendly wolf? A friendly ENORMOUS wolf?`,`A friendly giant wolf?!`));
B('f_ft6',F2P_FT,()=>!!G.flags.pip&&!!G.flags.f_pip_warm&&pipNear(),S(`Your little dragon's tummy is glowing! Can I warm my hands on him?`,`Your little dragon's tummy glows!`));
B('f_ft7',F2P_FT,()=>!!G.flags.act1_done,S(`You're the dragon kid from the south! The one from the fire mountain! Mags brought up a Gearhaven paper all about you.`,`You're the dragon kid! We read about you!`));
// Pip in the cold (ACT3 11): he sneezes sparks, chases snowflakes, and glows once he has learned Warm
const F2P_PIP=[S('Mip! (Pip sneezes. Three tiny sparks fly out.)','Mip! (Pip sneezes sparks.)'),S('Mip mip! (Pip tries to catch a snowflake on his tongue. It melts before it lands.)','Mip! (Pip tries to catch snowflakes.)'),
  S('Mrrp. (Pip burrows into your collar, out of the wind.)','Mrrp. (Pip hides from the cold.)'),S('Achoo! Mip. (A spark lands in the snow and fizzles.)','Achoo! Mip. (A spark fizzles.)')];
const F2P_PIPW=[S('Mip! (Pip’s tummy glows warm. Snowflakes fizz on it.)','Mip! (Pip glows warm.)'),S('Mip mip! (Pip warms your claws with his glowing tummy.)','Mip! (Pip warms your claws.)')];
{ const base=pipChirp; pipChirp=function(q){ try{ if(G&&G.mode==='story'&&!AREA&&curMap()===2&&Math.random()<0.45){ bubble(q,pick(G.flags.f_pip_warm&&Math.random()<0.5?F2P_PIPW:F2P_PIP),{kind:'pip',dy:-22}); csfx('chirp'); return; } }catch(e){} return base(q); }; }
function f2pMoon(){ try{ return typeof moonLeft==='function'?moonLeft():(G.flags.moon==null?100:G.flags.moon); }catch(e){ return 100; } }
// two people talking (ACT3 6.14 and more)
VCH('f_ch1','id:f_brynja','id:f_toastwhistle',ALWAYS,[[1,S(`Everything is fine, Hearthkeeper!`,`Everything is fine!`)],[0,S(`Ottilie, the Hearth is blue and your hat is on fire.`,`Ottilie, your hat is on fire.`)],[1,S(`...Everything is fine!`,`...Fine!`)]]);
VCH('f_ch2','id:f_gunnhild','id:f_mags',ALWAYS,[[0,S(`Bigger fire!`,`Bigger fire!`)],[1,S(`Bigger BOOM!`,`Bigger BOOM!`)],[0,S(`...Coffee?`,`...Coffee?`)],[1,S(`...Coffee.`,`...Coffee.`)]]);
VCH('f_ch3','id:f_hilde','id:f_sigrun',ALWAYS,[[1,S(`You stole my soup!`,`You stole my soup!`)],[0,S(`You TAUGHT me your soup!`,`You TAUGHT me!`)],[1,S(`Same thing!`,`Same thing!`)]]);
VCH('f_ch4','id:f_brann','id:f_pim',ALWAYS,[[1,S(`Captain! Your bill!`,`Captain! Your bill!`)],[0,S(`Eleven coins for cocoa?!`,`Eleven coins?!`)],[1,S(`Plus a drawing fee.`,`Plus a drawing fee.`)]]);
VCH('f_ch5','id:f_eider','id:f_brynja',()=>f2pR('f_thaw'),[[0,S(`(whispering) The song has three verses, Hearthkeeper.`,`(whisper) The song has three parts.`)],[1,S(`Then speak up, Eider. Songs are for singing.`,`Speak up! Songs are for singing.`)],[0,S(`(slightly less whispering) Three verses.`,`(a bit louder) Three parts.`)]]);
VCH('f_ch6','id:f_tollef','id:f_ylva',ALWAYS,[[0,S(`GOOD MORNING, YLVA!`,`GOOD MORNING!`)],[1,S(`It's evening, dear.`,`It's evening, dear.`)],[0,S(`WHAT?`,`WHAT?`)],[1,S(`Good morning, Tollef.`,`Good morning.`)]]);
VCH('f_ch7','id:f_bo','id:f_saga',ALWAYS,[[0,S(`Saga! Steve wants to fish.`,`Steve wants to fish.`)],[1,S(`Steve is a snowball, Bo.`,`Steve is a snowball.`)],[0,S(`Snowballs can fish.`,`Snowballs can fish.`)],[1,S(`...Fine. Hold the rod, Steve.`,`Fine. Hold the rod.`)]]);
VCH('f_ch8','id:f_nils','id:f_oskar',ALWAYS,[[1,S(`Letter for you, Nils. A month late.`,`Letter for you. A month late.`)],[0,S(`Nisse ate the last one.`,`Nisse ate the last one.`)],[1,S(`I know. That's why I'm holding this one up high.`,`I know. I'm holding it up high.`)]]);
VCH('f_ch9','id:f_rasmus','id:f_ylva',ALWAYS,[[0,S(`Hmm. Warm day.`,`Warm day.`)],[1,S(`It's snowing, Rasmus.`,`It's snowing.`)],[0,S(`Warm snow. Hmm.`,`Warm snow. Hmm.`)]]);
VCH('f_ch10',F2P_HH,F2P_HH,f2pCold,[[0,S(`Is it cold, or is it me?`,`Is it cold or me?`)],[1,S(`It's the moth.`,`It's the moth.`)],[0,S(`Rude moth.`,`Rude moth.`)]]);
VCH('f_ch11',F2P_HH,F2P_HH,f2pLit,[[0,S(`Have you seen the Hearth?`,`Seen the Hearth?`)],[1,S(`I've been standing next to it all day.`,`I stood by it all day.`)],[0,S(`Me too. Shove over.`,`Me too. Move over.`)]]);
VCH('f_ch12',F2P_RH,F2P_RH,ALWAYS,[[0,S(`What were you doing when you froze?`,`What were you doing?`)],[1,S(`Sneezing.`,`Sneezing.`)],[0,S(`Did you finish?`,`Did you finish?`)],[1,S(`Just now.`,`Just now.`)]]);
VCH('f_ch13','id:f_soren','id:elka',ALWAYS,[[1,S(`Soren! Wax!`,`Soren! Wax!`)],[0,S(`You had wax this morning.`,`You had wax already.`)],[1,S(`I used it all. On the hill. And the dog.`,`I used it all. And on a dog.`)]]);
VCH('f_ch14','id:f_hask','id:f_mumble',()=>f2pQ('f_mumble'),[[0,S(`Hrm. Roar, lad.`,`Roar, lad.`)],[1,S(`(ROOOAR!)`,`(ROOOAR!)`)],[0,S(`Hrm. Good lad.`,`Good lad.`)]]);
// greetings that react to what Ash did: in earlier acts and up here
f2pDG({
  'done@f_gunnhild':[['any',S(`Maren's kid beat the fire mountain! I knew it. I said it. I said it to the anvil.`,`You beat the fire mountain! I told my anvil!`)]],
  'done@f_brynja':[['any',S(`They say you climbed the fire mountain in the south and settled the old dragon there. Good. Some fires need settling.`,`You settled the old fire dragon. Good.`)]],
  'pip@f_hilde':[['any',S(`Is that a baby dragon? Oh, the little warm thing! Soup for him too!`,`A baby dragon! Soup for him too!`)]],
  'pip@f_bo':[['any',S(`You have a BABY dragon? Can Steve meet him? Gently?`,`A baby dragon! Can Steve meet him?`)]],
  'c_clock@f_mags':[['any',S(`You restarted the Great Clock in Gearhaven? I set my watch by that clock! Well. I set my bombs by it.`,`You fixed the Great Clock? I set my bombs by it!`)]],
  'q_c_bolt@f_mags':[['any',S(`You found Hettie's brass dog? Bolt? Cousin Hettie wrote me four pages about it. With diagrams.`,`You found Bolt? Hettie wrote me four pages!`)]],
  'wpn_whip@f_gunnhild':[['any',S(`That's a chain whip. Gearhaven work. Good links. I could make it better. I could make it BURN.`,`A chain whip! I could make it burn!`)]],
  'ch_c_vesper_friend@f_mags':[['any',S(`They say the Moth Mask is your COUSIN? My family just explodes. Hettie's eyebrows never grew back.`,`The Moth Mask is your cousin? Families!`)]],
  'q_race@f_soren':[['any',S(`You beat Elka in a race once? On feet? Hey. Respect.`,`You beat Elka in a race? Respect.`)]],
  ch_greymane_ally:[[F2P_FT,S(`Is it true a giant grey wolf follows you? From the south? We saw paw prints as big as plates.`,`A giant wolf follows you? We saw huge paw prints!`)]],
  f_hearth:[[F2P_HH,S(`You woke the Great Hearth! She's BLUE! I've never seen anything like it!`,`You woke the Hearth! She's blue!`)]],
  'f_hearth@f_brynja':[['any',S(`Look at her, child. Look at my old girl. You did that.`,`Look at my old girl. You did that.`)]],
  f_gate:[[F2P_HH,S(`The North Gate is open! First time in a month! Gunnar's tongue is free!`,`The North Gate is open!`)]],
  f_ylva:[[F2P_RH,S(`You thawed Grandmother Ylva! She's already started knitting you something.`,`You thawed Ylva! She's knitting you something.`)]],
  q_f_rime:[[F2P_RH,S(`The whole village is warm again! Thanks to you, dragon!`,`The whole village is warm! Thank you!`)]],
  q_f_bombs:[[F2P_HH,S(`Was that you? The big BOOM by the lake? Captain Brann fell out of his tower!`,`The big BOOM! Brann fell off his tower!`)]],
  q_f_sled:[[F2P_HH,S(`You beat Elka down the Windscour! In one go! Soren's been talking about it all day.`,`You beat Elka! Soren won't stop talking.`)]],
  q_f_mumble:[[F2P_HR+'|'+F2P_HH,S(`Was that a ROAR in the Pinewhisper? My teacup jumped right off the table.`,`Was that a roar? My cup jumped!`)]],
  q_f_warm:[[F2P_HH,S(`The Warm Hands Medal! You've got the Mayor's medal! She made it herself. You can tell.`,`You got the Mayor's medal! She made it.`)]],
  q_f_dogs:[[F2P_HR,S(`Hask's dogs are home! The camp sounds right again. All that barking. Lovely.`,`Hask's dogs are home! Lovely barking.`)]],
  f_hush:[[F2P_FT,S(`The great white moth is gone? Truly? I'm going to open every window in my house. Then close them. It's cold.`,`The big moth is gone? I'll open my windows!`)]],
  ch_f_glaciar_free:[[F2P_FT,S(`The ice dragon is awake and she's NICE? And she's your auntie? I need to sit down.`,`The ice dragon is nice? And your auntie?`)]]
});
// a deed greeting list that already exists (an Act I key) gets the northern lines added, never replaced
function f2pDG(o){ for(const k in o){ if(DGREET[k]&&!k.includes('@')) DGREET[k]=DGREET[k].concat(o[k]); else DGREET[k]=o[k]; } }
{ const base=syncDeeds; syncDeeds=function(){ base(); try{ if(G&&G.mode==='story'){ const F=G.flags; if(F.f_hearth_lit) deed('f_hearth'); if(F.f_northgate) deed('f_gate'); if(F.f_ylva) deed('f_ylva'); if(F.f_hush_done) deed('f_hush'); } }catch(e){} }; }
Object.assign(DEED_PRI,{f_hearth:8,f_gate:6,f_ylva:7,f_hush:8,trial_blaze:7,trial_windride:7,trial_pound:7,wpn_bombs:5});

// run fn once the game is back in play (no dialogue open)
function f2pCalm(fn,n){ n=n||0; if((DLG||scene!=='play')&&n<200){ later(0.25,()=>f2pCalm(fn,n+1)); return; } try{ fn(); }catch(e){ console.error(e); } }
// ---------- shops, the smiths and the inns (prices about 2.8 times Act I's, BALANCE.md 8)
SHOPTALK.f_pim=()=>runShop('f_pim',S(`Pim's Hot Cocoa! The only cocoa stand in the north, for now. Business is brewing!`,`Pim's Hot Cocoa! The only one!`),[
  [S('A cup of hot cocoa to carry (it warms you up by itself when you are hurt)','Cocoa to carry (heals you when hurt)'),G.flags.f_pim_free?0:3,()=>{ G.items.f_cocoa=(G.items.f_cocoa||0)+1; setBanner(S('Hot cocoa','Hot cocoa'),S(`You carry ${G.items.f_cocoa} of 3. It warms you up when you get hurt.`,`You have ${G.items.f_cocoa} of 3.`),2); },()=>(G.items.f_cocoa||0)<3||S('Your paws are full of cocoa. Three is the limit. Company policy.','Three is the limit!')],
  [S('A cold cocoa you heat yourself (heal now)','Heat your own cocoa (heal now)'),G.flags.f_pim_free?0:2,()=>{ heal(player.maxHp*0.3); setBanner(S('You breathe on the cocoa','You heat the cocoa'),S('Perfect. A hug you can drink.','A hug you can drink!'),1.8); },()=>player.hp<player.maxHp||S('You look plenty warm already. Business is business, but I have a heart.','You are warm already!')]
]);
function f2pReforge(){ runDialogue([f2pL('f_gunnhild',`Star-iron! Give it here. Maren's kid, at MY anvil. Nobody tell Maren. No, tell her. Tell her twice.`,`Star-iron! At MY anvil! Tell your mom!`),f2pN(`CLANG. CLANG. CLANG. The north wind howls at the window. Gunnhild howls back, happily. Your blade comes out of the fire ringing.`,`CLANG! CLANG! Your blade rings.`)],()=>{ scene='play'; reforgeIron(); saveGame(); }); }
SHOPTALK.f_gunnhild=()=>runShop('f_gunnhild',G.flags.f_forge_lit?S(`Anvilheart Forge! Hot again! What do you need?`,`My forge is hot! What do you need?`):S(`Anvilheart Forge. Cold as a fish. I can sell you a whetstone. That's all a cold smith is good for.`,`My forge is cold. I can sell a whetstone.`),[
  [S('Reforge your blade with your star-iron','Reforge with star-iron'),0,()=>later(0.05,f2pReforge),()=>!G.flags.f_forge_lit?S('My forge is cold! Light it and I will.','My forge is cold!'):G.iron>0||S('No star-iron, no reforging. Bring me some.','No star-iron. Bring some.')],
  [S('Warm your claws at the forge (full heal)','Warm up at the forge (heal)'),16,()=>{ player.hp=player.maxHp; setBanner(S('Toasty','Toasty'),S('Your scales glow like a horseshoe.','You feel warm.'),1.6); },()=>!G.flags.f_forge_lit?S('Warm up at a cold forge? Ha. Hug a snowman instead.','The forge is cold.'):player.hp<player.maxHp||S('You are toasty already.','You are warm already.')],
  [S('A northern whetstone (a blessing)','A whetstone (a blessing)'),220,()=>{ G.flags.f_whet=(G.flags.f_whet|0)+1; G.pendingBless++; later(0.6,offerPending); },()=>(G.flags.f_whet|0)<2||S('Two is plenty. Your blade is not a cheese.','Two is plenty.')]
]);
SHOPTALK.f_mags=()=>runShop('f_mags',S(`Sprocket's Shed! Bombs, fuses, and things that go WHEE-BANG!`,`Bombs and things that go BANG!`),[
  [S('A bigger bomb bag (five more bombs fit)','A bigger bomb bag (+5)'),260,()=>{ G.flags.f_bigbag=1; if(typeof bombBag==='function') bombBag(5); },()=>!(G.weapons&&G.weapons.bombs)?S('You need bombs before you need a bag. Science!','You need bombs first!'):!G.flags.f_bigbag||S('One big bag is enough. Two would be a backpack. That explodes.','One big bag is enough.')]
]);
SHOPTALK.f_saga=()=>runShop('f_saga',S(`Fresh fish! Frozen fresh! Rimeholm folk fall for a fish, hook, line and sinker.`,`Fresh fish! Rimeholm loves fish.`),[
  [S('A fish (a gift for Rimeholm folk)','A fish (a gift)'),8,()=>{ giveItems({fish:1}); },()=>(G.items.fish||0)<6||S('Six fish is a lot of fish. Even for me.','Six fish is a lot!')]
]);
SHOPTALK.f_hask=()=>runShop('f_hask',S(`Hrm. Trading post. Furs, honey. Hearthold folk go soft for honey. Don't tell them I said soft.`,`Hrm. Honey and furs. Hearthold loves honey.`),[
  [S('A jar of wild honey (a gift for Hearthold folk)','Wild honey (a gift)'),14,()=>{ giveItems({honey:1}); },()=>(G.items.honey||0)<4||S('Four jars. That is a lot of bee work, pup.','Four jars is a lot.')],
  [S('A fur-lined hood for the wind (more stamina)','A fur hood (more stamina)'),180,()=>{ G.flags.f_hood=1; player.maxStamina+=15; player.stamina=player.maxStamina; setBanner(S('A fur-lined hood','A fur hood'),S('The wind can’t get you now. +15 stamina.','+15 stamina!'),2); },()=>!G.flags.f_hood||S('One hood. One head. Hrm.','One hood. One head.')]
]);
const F2P_INN={
  f_hilde:()=>runShop('f_hilde',S(`The Warm Mitten! Soft beds, hot soup, and a cat called Biscuit.`,`Soft beds and hot soup!`),[
    [S('Rent a bed for the night','Rent a bed'),G.flags.perk_freeinn?0:14,()=>{ innRest(); }],
    [S('A big bowl of soup (full heal)','Soup (full heal)'),12,()=>{ player.hp=player.maxHp; setBanner(S('Soup','Soup'),S('It needs salt. It is perfect anyway.','Perfect soup!'),1.6); }]]),
  f_sigrun:()=>runShop('f_sigrun',S(`Smokehouse. Soup or smoked fish. Both, if you've any sense.`,`Soup or smoked fish.`),[
    [S('A bowl of Sigrun’s soup (full heal)','Soup (full heal)'),10,()=>{ player.hp=player.maxHp; setBanner(S('Sigrun’s soup','Sigrun’s soup'),S('Now THAT has salt.','Lots of salt!'),1.6); }],
    [S('Smoked fish to take away (a gift Rimeholm folk love)','Smoked fish (a gift)'),8,()=>{ giveItems({fish:1}); },()=>(G.items.fish||0)<6||S('You smell like a smokehouse already.','You have lots of fish.')]])
};
// extra options in the talk menu of northern people (the inns, quest topics, letters, little favours)
{ const base=compTalkOpts; compTalkOpts=function(id,n){
  const o=base(id,n); if(!n||!G||G.mode!=='story') return o;
  try{
    if(F2P_INN[id]) o.unshift({t:id==='f_sigrun'?S('Soup, or smoked fish?','Soup, or smoked fish?'):S('A bed, or something warm?','A bed, or something warm?'),tag:'shop',fn:()=>F2P_INN[id](),end:true});
    if(id==='f_brann'&&!G.quests.f_juniper&&qAvail('f_juniper')&&!G.flags.f_juniper_found) o.push({t:S('Have you seen a girl with a map case?','Seen a girl with maps?'),tag:'quest',fn:()=>later(0.2,()=>startQuest('f_juniper')),then:[f2pL('f_brann',`The map girl? Went out on the Shiversea floes last week! On FOOT! I said, miss, the ice moves! She said, then I'll map it moving! Brave! Or a moth! Probably brave!`,`She walked out on the sea ice! Brave! Or a moth!`),f2pL('f_brann',`North-west, past Rimeholm! Where the sea is all floes! Bring her back before her boots freeze!`,`Go north-west, past Rimeholm! Bring her back!`)],end:true});
    if(id==='f_brann'&&f2pAt('f_warm',0)&&!G.flags.f_brann_list) o.push({t:S('Is anyone missing from the town?','Is anyone missing?'),tag:'quest',fn:()=>{ G.flags.f_brann_list=1; },then:[f2pL('f_brann',`Two of my Hearthwardens, frozen at their posts! One at the West Gate, one at the East Gate! And Sir Knut took his whole patrol up the Dreadmoor! Six blue plumes! Not one came home!`,`Two guards froze at the gates! Knut's patrol never came home!`),f2pL('f_brann',`Also the milkman. And a girl who was ice skating. And the post. The post is ALWAYS late, but this is very late!`,`Also the milkman, a skater and the post!`)],back:true});
    if(id==='f_mags'&&f2pAt('f_bombs',3)&&!G.flags.f_bombs_test&&!f2pTestBombHeld()) o.push({t:S('Can I have another test bomb?','Another test bomb?'),tag:'quest',fn:()=>later(0.2,f2pGiveTestBomb),then:[f2pL('f_mags',`You lost it? Did it go BOOM? Was it a GOOD boom? Here. Aim for the Big Boulder this time. On the old Quarry Road, by the lake.`,`Lost it? Here's another. Aim for the Big Boulder!`)],end:true});
    if(id==='f_oskar'&&f2pThawed('f_oskar')&&!G.flags.f_letter_brynja&&!f2pQ('f_song')) o.push({t:S('I can take your letter to Brynja.','I can take the letter to Brynja.'),tag:'quest',fn:()=>{ G.flags.f_letter_brynja=1; giveItems({f_snowletter:1}); },then:[f2pL('f_oskar',`You'd deliver it? For me? A month late is better than two months late. Here. Snowflake stamp. Very old. Careful with the corners.`,`You'll deliver it? Thank you! Careful with the corners.`)],back:true});
    if(id==='f_brynja'&&G.items.f_snowletter&&!G.flags.f_letter_read) o.push({t:S('Oskar the mailman sent you a letter.','Oskar sent you a letter.'),tag:'quest',fn:()=>{ G.flags.f_letter_read=1; takeItems({f_snowletter:1}); f2pCalm(()=>{ if(qAvail('f_song')) offerQuest('f_song'); }); },then:[f2pN(`Brynja breaks the old seal. The paper is yellow and soft as cloth.`,`Brynja opens the old letter.`),f2pL('f_brynja',`"To the Hearthkeeper. If the fire ever runs low, remember the Snow Mother's Song. She will." ...It's my mother's writing. Sixty years this has been in the post.`,`It's from my mom! "If the fire runs low, remember the Snow Mother's Song."`)],end:true});
    if(id==='f_hask'&&f2pQ('f_dogs')&&!f2pSledCross()) o.push({t:S('Can your sled take me somewhere?','Can your sled take me?'),tag:'travel',fn:()=>f2pCalm(()=>f2pSledMenu('rest')),end:true});
    if(id==='juniper'&&f2pAct3()&&G.flags.f_juniper_found&&!G.flags.f_juniper_home&&!F2P.esc) o.push({t:S('Ready to go back to shore?','Ready to go to shore?'),tag:'quest',fn:()=>later(0.2,f2pEscortStart),then:[f2pL('juniper',`Ready. Walk slowly. My boots are full of sea.`,`Ready. Walk slowly.`)],end:true});
    // (Nils and the goat called Duchess: his once opener in act3/people.js, so not added here a second time)
  }catch(e){ console.error(e); }
  return o; }; }
Object.assign(ITEM_NAMES,{f_snowletter:'An old letter with a snowflake stamp'});
// the smith shows a gold ! while Ash carries star-iron in Frostreach (once her forge is hot)
{ const base=storyMarker; storyMarker=function(id){ if(base(id)) return true; return id==='f_gunnhild'&&!!G&&G.iron>0&&!!G.flags.f_forge_lit&&actOf(G.stage)===3; }; }
// ARMS: Mags sells bomb refills once she has made Ash his bombs
{ try{ if(typeof ARMS!=='undefined'&&ARMS.shops&&!ARMS.shops.includes('f_mags')) ARMS.shops.push('f_mags'); }catch(e){} }

// ---------- story-ish talk this module owns (onTalk runs before the stock story talk; claim only what is ours)
onTalk(n=>{
  if(!G||G.mode!=='story') return false;
  // Juniper on her floe (ACT3 10.7): finding her starts (or moves on) Juniper on Thin Ice
  if(n.id==='juniper'&&f2pAct3()&&!G.flags.f_juniper_found&&dist(n.x,n.y,F2P_SPOT.juniper_floe[0],F2P_SPOT.juniper_floe[1])<400){
    const L=[f2pL('juniper',`Ash! Oh, thank goodness. I've been mapping this floe for three days. It's very small. I've mapped it four times.`,`Ash! I mapped this tiny floe four times!`),
      f2pL('juniper',`Rook's going to tell everyone I got lost AGAIN. I did NOT get lost. The ice moved. That's different.`,`I did NOT get lost. The ice moved!`),
      f2pL('juniper',`Get me back to shore? I'll follow you. Walk slowly. My boots are full of sea.`,`Take me to shore? Walk slowly. My boots are wet.`)];
    runDialogue(L,()=>{ scene='play'; if(!G.quests.f_juniper) startQuest('f_juniper'); G.flags.f_juniper_found=1; questPoke(); later(0.4,f2pEscortStart); saveGame(); });
    return true;
  }
  // Mumble while the Rimehounds are about
  if(n.id==='f_mumble'&&F2P.fight&&!F2P.fight.done){ f2pSay([['f_mumble',S(`(squeak!) They're right THERE! Do the big noise! I'll try too!`,`(squeak!) Do the big roar! I'll try!`)]]); return true; }
  return false;
});

// ---------- the ten side quests (ACT3 10). Rewards: XP and coins from BALANCE.md 8 (a side quest about 650 XP and
// 170 coins, a big one twice that); f2p:fn runs the custom payoffs.
{ const base=qAvail; qAvail=function(id){
  if(id==='f_rime'&&!G.flags.f_ylva) return false;
  if(id==='f_forge'&&!(G.weapons&&G.weapons.whip)) return false;
  if(id==='f_pack'&&!G.choices.greymane) return false;
  // Elka is up north in Act III: her Act I races (Frostpine Lodge's course) wait until she is home
  if((id==='race'||id==='skyhoops')&&f2pElkaHere()) return false;
  return base(id); }; }
const F2P_V1=[S(`"Sleep now, the snow is falling slow, the Snow Mother sings it soft and low."`,`"Sleep now, the snow falls slow. Snow Mother sings soft and low."`),S(`"She tucks the hills in white and blue, and saves one gentle snow for you."`,`"She tucks the hills in blue, and saves some snow for you."`)];
const F2P_V2=[S(`"A girl came up with horns of red and fire in her hands, and said:"`,`"A girl with horns of red, and fire in her hands, said:"`),S(`"Auntie, the night is cold and wide. Let's light a fire to keep inside."`,`"Auntie, the night is cold and wide. Let's light a fire inside."`)];
const F2P_V3=[S(`"So snow and spark, together, made a hearth that never, ever fades."`,`"Snow and spark together made a fire that will never fade."`),S(`"When winter's long and dark and deep, the Snow Mother keeps the fire you keep."`,`"When winter's dark and deep, she keeps the fire you keep."`)];
const f2pVerse=v=>v.map(t=>['narr',t]);
const F2P_PACK_ALLY=[
  {t:'flags',flags:['f_wolf1','f_wolf2','f_wolf3'],n:3,text:S('Find Greymane’s three moth-struck pack wolves in the Pinewhisper and Blaze the purple out of them','Find 3 purple wolves. Beat them, then Blaze them.'),at:()=>f2pPackNext()},
  {t:'talk',npc:'f_greymane',text:S('Go back to Greymane on the Whitepass','Go back to Greymane'),lines:[f2pN(`Greymane looks at his three wolves, wet and blinking and themselves again. He howls, long and low. Far away, the pack answers. All of it.`,`Greymane howls. Far away, the whole pack answers.`),
    f2pN(`He puts his huge head against your chest for a moment. Then he trots off toward the mountain, the wolves at his heels. You get the feeling you'll see him again. Somewhere cold. Somewhere it matters.`,`He leans on you. Then he goes. You will see him again.`)],reward:{xp:650,coins:120,f2p:()=>{ G.flags.f_pack_ally=1; setBanner(S('Greymane will come','Greymane will come'),S('When you face the ice dragon, the pack will run with you.','The wolves will help you fight!'),3.2); }}}];
const F2P_PACK_HOME=[
  {t:'flags',flags:['f_pup1','f_pup2','f_pup3'],n:3,text:S('Find Greymane’s three lost pups: one with the snow monkeys at the Steamwell, one in a Dreadmoor snowdrift, one up on a Glimmerfrost ridge','Find 3 lost pups. Hot spring, snowdrift, ice ridge.'),at:()=>f2pPackNext()},
  {t:'talk',npc:'f_greymane',text:S('Go back to Greymane on the Whitepass','Go back to Greymane'),lines:[f2pN(`Three fat pups tumble over Greymane's paws. He licks every one of them until they fall over.`,`Three pups tumble over Greymane's paws.`),
    f2pN(`Greymane sits. Then he howls, and you feel it in your chest, and somehow you understand it.`,`Greymane howls. You feel it in your chest.`),
    f2pL('ash',`...Thank you. I think I just learned a howl.`,`Thank you. I learned a howl!`)],reward:{xp:650,coins:120,f2p:()=>{ G.flags.f_longhowl=1; setBanner(S('The Long Howl','The Long Howl'),S('Your Roar now shatters icicles, ice spikes and snowballs in its ring, and stuns frost foes for longer.','Your roar breaks ice now!'),3.6); }}}];
Object.assign(QDEFS,{
  f_bombs:{title:S('Having a Blast','Mags and the Big Boom'),giver:'f_mags',min:'f_kindle',
    offer:[f2pL('f_mags',`You! Dragon! You've got fire. Real fire. BLUE fire! Do you know what that means?`,`You have BLUE fire! Do you know what that means?`),f2pL('ash',`...Warm hands?`,`...Warm hands?`),
      f2pL('f_mags',`BOMBS! Well. It COULD mean bombs. I had a whole crate of blasting powder on my steam sled. Then the Snowgobs ambushed me in Snowgob Gulch and pushed my sled off the road.`,`BOMBS! My blasting powder crate fell off my sled. The Snowgobs did it!`),
      f2pL('f_mags',`The crate's stuck on a ledge in the Gulch, south-west of town. Get it back and I'll make you something delightful. Delightfully EXPLOSIVE.`,`It's on a ledge in Snowgob Gulch. Get it, and I'll make something EXPLOSIVE.`)],
    steps:[
      {t:'item',item:'f_powder',n:1,text:S('Get Mags’s blasting powder crate back from Snowgob Gulch, south-west of Hearthold','Get Mags’s powder crate from Snowgob Gulch'),at:()=>f2pLMat('f_lm_powder')||'xy:5200,50600'},
      {t:'talk',npc:'f_mags',take:{f_powder:1},text:S('Bring the crate back to Mags in Hearthold','Bring the crate to Mags'),lines:[f2pL('f_mags',`My powder! You're a hero! A very warm hero!`,`My powder! You're a warm hero!`),f2pL('f_mags',`Uh oh. The fuses are frozen. They need a REALLY hot spark. Like, blue hot. Like, you hot.`,`Uh oh. The fuses are frozen. They need blue-hot fire. Your fire!`)]},
      {t:'flag',flag:'f_bombs_lit',text:S('Blaze the Bomb-o-Matic in Sprocket’s Shed','Blaze the Bomb-o-Matic in Mags’s shed'),at:()=>DOORS.some(d=>d.area==='h_f_mags')?'area:h_f_mags':'npc:f_mags',reward:{f2p:()=>f2pCalm(f2pGiveTestBomb)}},
      {t:'flag',flag:'f_bombs_test',text:S('Test the bomb on the Big Boulder blocking the old Quarry Road, by the Glimmerfrost','Bomb the Big Boulder on the Quarry Road'),at:()=>f2pLMat('f_quarry_boulder')||'xy:5900,47600'},
      {t:'talk',npc:'f_mags',text:S('Tell Mags how it went','Tell Mags how it went'),lines:[f2pL('f_mags',`I HEARD it! The whole TOWN heard it! Captain Brann fell out of his tower!`,`I HEARD it! Brann fell out of his tower!`),
        f2pL('f_mags',`Here. Blast Bombs. Throw them, or breathe on them and they go off right away. They crack rocks and ice, flip switches, and make armored things very sorry.`,`Here. Blast Bombs! They break rocks and ice and hit switches.`),
        f2pL('f_mags',`Don't throw them at people you like.`,`Don't throw them at friends.`)],reward:{weapon:'bombs',coins:170,xp:650,f2p:()=>{ f2pEndTestBomb(true); f2pFuse(); }}}]},
  f_song:{title:S('The Snow Mother’s Song','The Snow Mother’s Song'),giver:'f_brynja',min:'f_thaw',
    offer:[f2pL('f_brynja',`Sit down, child. I want to tell you about a song.`,`Sit, child. Let me tell you about a song.`),
      f2pL('f_brynja',`Every Hearthkeeper used to know the Snow Mother's Song. My mother knew the tune. Just the tune. The words were carved in three places, long ago, so they'd never all be lost at once.`,`Long ago, the song's words were carved in three places. So they'd never all get lost.`),
      f2pL('f_brynja',`Funny how that worked out. They all got lost at once.`,`They all got lost at once. Funny.`),
      f2pL('f_eider',`(from the archive door) The first verse is on Rimeholm's bell! The second on the Singing Stone, out on the sky isles! The third on the Rune Drum in the Stonehorn hills! I wrote it down! I wrote it down TWICE!`,`(far away) The bell in Rimeholm! A stone on the sky isles! A drum in the Stonehorn hills!`),
      f2pL('f_brynja',`Find the words. I'd like to hear it sung once before I'm done keeping fires.`,`Find the words. I want to hear it sung once.`)],
    steps:[
      {t:'flags',flags:['f_v1','f_v2','f_v3'],n:3,text:S('Find the three verses of the Snow Mother’s Song: Rimeholm’s bell, the Singing Stone on the sky isles, the Rune Drum in the Stonehorn hills','Find 3 verses: a bell, a stone, a drum'),at:()=>f2pSongNext()},
      {t:'talk',npc:'f_brynja',take:{f_verse1:1,f_verse2:1,f_verse3:1},text:S('Bring the three verses to Brynja at the Great Hearth','Bring the verses to Brynja'),lines:'f_song_reveal',reward:{xp:1300,coins:200,bless:1,f2p:()=>{ G.flags.f_song=1; f2pExtra('f_song',S('You found the Snow Mother’s Song, and Hearthold remembered her name.','You found the Snow Mother’s Song.')); }}}]},
  f_mumble:{title:S('Roar Talent','Mumble’s Lost Roar'),giver:'f_mumble',min:'f_kindle',
    offer:[f2pL('f_mumble',`(very quietly) ...hello. Sorry. Hello.`,`(quietly) ...hello. Sorry.`),f2pL('ash',`Whoa. You're HUGE.`,`Whoa. You're HUGE.`),
      f2pL('f_mumble',`Sorry. I'm Mumble. I used to have a big roar. Like a mountain clearing its throat. Then the purple cold came, and it froze in my throat, and now I go...`,`I'm Mumble. I had a big roar. The purple cold froze it. Now I go...`),
      f2pL('f_mumble',`(squeak)`,`(squeak)`),
      f2pL('f_mumble',`The Rimehounds laugh at me. Every night. Could you... maybe... help me find my roar?`,`The wolves laugh at me. Can you help me find my roar?`)],
    steps:[
      {t:'talk',npc:'f_sigrun',give:{f_soup:1},text:S('Get Sigrun’s famous hot soup in Rimeholm','Get Sigrun’s hot soup in Rimeholm'),at:()=>f2pThawed('f_sigrun')?'npc:f_sigrun':'xy:2200,47250',lines:[f2pL('f_sigrun',`Soup for a yeti? A big one? Then he gets the big pot. Don't spill it. Don't drink it on the way. I'll know.`,`Soup for a yeti? The big pot, then. Don't drink it. I'll know.`)]},
      {t:'talk',npc:'f_mumble',take:{f_soup:1},text:S('Bring the hot soup to Mumble’s Hollow','Bring the soup to Mumble'),lines:[f2pL('f_mumble',`(gulp, gulp, gulp) ...warm. So warm.`,`(gulp, gulp) ...warm.`),f2pL('f_mumble',`(squeak) Still squeaky.`,`(squeak) Still squeaky.`),
        f2pN(`Howls. Lots of them. Close. Six Rimehounds trot out of the trees, grinning, led by a big one with a torn ear.`,`Howls! Six wolves come out of the trees. The big one has a torn ear.`),
        f2pL('f_mumble',`(whisper) That's Snarl. He's the worst.`,`(whisper) That's Snarl. He's the worst.`),f2pL('ash',`Mumble. Watch me. Then do what I do.`,`Mumble. Watch me. Do what I do.`)]},
      {t:'flag',flag:'f_mumble_roar',text:S('Fight the Rimehounds and ROAR so Mumble can copy you','Fight the wolves and ROAR so Mumble copies you'),at:'npc:f_mumble'},
      {t:'talk',npc:'f_mumble',text:S('Talk to Mumble','Talk to Mumble'),lines:[f2pL('f_mumble',`I ROARED! Did you hear me? Everyone heard me! The MOUNTAIN heard me!`,`I ROARED! The MOUNTAIN heard me!`),
        f2pL('f_mumble',`If you ever need somebody big... I'll come. I'll roar. Loudly. Not sorry at all.`,`If you need somebody big, I'll come. I'll roar. Not sorry!`)],reward:{xp:650,coins:120,f2p:()=>{ G.flags.f_mumble_ally=1; f2pExtra('f_mumble',S('Mumble the yeti found his roar, and promised to come when you need somebody big.','Mumble found his roar. He will help you.')); setBanner(S('Mumble will come','Mumble will come'),S('When you face the ice dragon, a very big friend will roar with you.','Mumble will help you fight!'),3.2); }}}]},
  f_sled:{title:S('All Downhill From Here','Elka’s Long Sled'),giver:'elka',min:'f_gap',
    offer:[f2pL('elka',`ASH! You came north too! I knew it! Did Dad send you? Don't answer that.`,`ASH! You came north! Did Dad send you? Don't answer.`),
      f2pL('elka',`Soren says nobody has EVER sledded from the top of the Windscour all the way to his hill in one go. I want to do it. Against you. A RACE.`,`Nobody ever sledded from the Windscour to Soren's hill. Let's RACE!`),
      f2pL('ash',`I don't have a sled.`,`I don't have a sled.`),f2pL('elka',`You've got wind ribbons. That's cheating. I love it. Meet me at the Windscour Shrine!`,`You have wind ribbons. Cheating! I love it. Meet me at the Windscour Shrine!`)],
    steps:[
      {t:'flag',flag:'f_sled_won',npc:'elka',mini:'f_sledrace',text:S('Race Elka from the Windscour Shrine down to Soren’s Sled Hill (talk to Elka at the shrine to start)','Race Elka down to Soren’s hill. Talk to her at the shrine.'),
        ready:[f2pL('elka',`Eight hoops, all the way down to Soren's hill. Hoops count! Miss one and it's still waiting for you! Ride the wind if you can find it!`,`Eight hoops down to Soren's hill. Ride the wind if you can!`),f2pL('elka',`Ready? GO on three. One. Two...`,`Ready? One. Two...`)]},
      {t:'talk',npc:'elka',text:S('Collect your prize from Elka on Soren’s Sled Hill','Get your prize from Elka'),lines:[f2pL('elka',`You beat me! Nobody beats me! Except wolves. And one goose.`,`You beat me! Nobody beats me! Except wolves. And a goose.`),
        f2pL('f_soren',`That was the fastest thing I've ever seen. Here. Ribbon wax. Rub it on your feet. Don't ask.`,`The fastest thing I've seen! Ribbon wax. Rub it on your feet.`),
        f2pL('elka',`Tell Dad I'm fine. Tell him I'm SUPER fine. Tell him I'll be home for supper. SOME supper.`,`Tell Dad I'm SUPER fine. Home for supper. SOME supper.`)],reward:{xp:650,coins:60,f2p:()=>{ G.flags.f_skyhop=1; setBanner(S('Skyhop!','Skyhop!'),S('Wind ribbons carry you faster, and hopping off a ribbon jumps as high as a Double Jump.','Wind ribbons are faster. You hop higher off them!'),3.6); }}}]},
  f_rime:{title:S('Rime and Reason','One Thaw at a Time'),giver:'f_ylva',min:'f_thaw',
    offer:[f2pL('f_ylva',`Six of my neighbors are still frozen, dear. Seven, counting old Rasmus in his forge, but his frost is the thickest. Warm the others up and his will go thin.`,`Six neighbors are still frozen. Seven with Rasmus. Warm the others first.`),
      f2pL('f_ylva',`They're all in silly places. They were all doing silly things. It was a very ordinary evening.`,`They're in silly places. Doing silly things.`)],
    steps:[
      {t:'flags',flags:['f_thaw_f_tollef','f_thaw_f_saga','f_thaw_f_sigrun','f_thaw_f_bo','f_thaw_f_nils','f_thaw_f_oskar'],n:6,text:S('Thaw Rimeholm’s six frozen neighbors','Thaw 6 frozen neighbors'),at:()=>f2pRimeNext()},
      {t:'flag',flag:'f_thaw_f_rasmus',text:S('The frost on the old forge is thin now. Thaw Rasmus the smith','The forge frost is thin. Thaw Rasmus'),at:()=>f2pLMat('f_rasmus')||'xy:2450,46600'},
      {t:'talk',npc:'f_rasmus',text:S('Talk to Rasmus','Talk to Rasmus'),lines:[f2pL('f_rasmus',`Hmm. Warm. You did that. One person at a time. That's the only way anything good ever gets done.`,`Warm. You did that. One at a time.`),
        f2pL('f_rasmus',`Your fire's good, child. It could be better. Come here. Breathe on my anvil. No. Harder. HARDER.`,`Your fire is good. It could be better. Breathe on my anvil. HARDER.`),
        f2pN(`The anvil glows red, then white, then a blue so bright you can see your own bones in your claws. Neat.`,`The anvil glows red, white, then bright blue!`),
        f2pL('f_rasmus',`There. Blue as a glacier, hot as a summer. Bluefire. Go and melt something that deserves it.`,`There. Bluefire. Go melt something.`)],reward:{xp:1000,coins:170,f2p:()=>{ G.flags.f_bluefire=1; setBanner(S('Bluefire!','Bluefire!'),S('Blaze reaches 20 percent farther, and melting and thawing take half as long.','Blaze goes farther and melts faster!'),3.6); }}}]},
  f_dogs:{title:S('Dog Days of Winter','Hask’s Runaway Dogs'),giver:'f_hask',min:'f_thaw',
    offer:[f2pL('f_hask',`Hrm. Pup. You look like you've never been cold a day in your life.`,`Hrm. Pup. You've never been cold.`),
      f2pL('f_hask',`My dogs ran off in the first blizzard. Five of them. Best sled team in the north. Snowball, Pepper, Biscuit Two, Sergeant and Mittens.`,`My five sled dogs ran off. Snowball, Pepper, Biscuit Two, Sergeant and Mittens.`),
      f2pL('f_hask',`Bring them home and I'll run you anywhere you need to go. Faster than any ribbon.`,`Bring them home. My sled will take you anywhere.`)],
    steps:[
      {t:'flags',flags:['f_dog1','f_dog2','f_dog3','f_dog4','f_dog5'],n:5,text:S('Find Hask’s five runaway sled dogs','Find Hask’s 5 sled dogs'),at:()=>f2pDogNext()},
      {t:'talk',npc:'f_hask',text:S('Tell Hask his dogs are home','Tell Hask his dogs are home'),lines:[f2pL('f_hask',`...All five. Hrm. Pup. You did good. Real good.`,`All five. Hrm. Pup. You did good.`),
        f2pL('f_hask',`My sled goes wherever you need. Hearthold, Rimeholm, the Dreadmoor, or right here. Just don't feed Pepper. Pepper bites when he's full.`,`My sled goes to Hearthold, Rimeholm, the moor, or here. Don't feed Pepper.`)],reward:{xp:650,coins:170,f2p:()=>{ G.flags.f_sledline=1; setBanner(S('Hask’s dog sled','Hask’s dog sled'),S('Ride the sled from any sled post: Hask’s Rest, outside Hearthold’s East Gate, below Rimeholm and on the Dreadmoor.','Ride the dog sled from any sled post!'),3.6); }}}]},
  f_juniper:{title:S('Juniper on Thin Ice','Juniper on Thin Ice'),min:'f_kindle',
    steps:[
      {t:'flag',flag:'f_juniper_found',text:S('Find Juniper on the Shiversea floes, north-west past Rimeholm','Find Juniper on the sea ice'),at:'xy:2100,42100'},
      {t:'flag',flag:'f_juniper_home',text:S('Lead Juniper back to the shore. Keep the Snowgobs off her!','Take Juniper to the shore. Keep her safe!'),at:()=>F2P.esc?'xy:2500,43350':'npc:juniper'},
      {t:'talk',npc:'juniper',text:S('Visit Juniper’s Map Tent in Hearthold','Visit Juniper’s tent in Hearthold'),lines:[f2pL('juniper',`Here. Maps of every big cave and temple in the north. I drew them from the outside, so the insides are guesses. Good guesses.`,`Maps of every cave and temple up here. The insides are guesses.`),
        f2pL('juniper',`And look. There's an old ice tunnel under the cliffs north of Rimeholm. It comes out at Glimmer Point. One big boulder blocks it. You've got something loud, right?`,`There's an ice tunnel north of Rimeholm. A boulder blocks it. You have something loud?`)],give:{f_northmaps:1},reward:{f2p:()=>f2pNorthMaps()}},
      {t:'flag',flag:'f_tunnel_open',text:S('Open Juniper’s Tunnel north of Rimeholm (a bomb, a big hammer smash or a Roar)','Open the tunnel. Bomb, hammer or roar!'),at:()=>f2pLMat('f_tunnel_boulder')||'xy:1750,46050',reward:{xp:650,coins:120}}]},
  f_forge:{title:S('Forge Ahead','Gunnhild’s Cold Forge'),giver:'f_gunnhild',min:'f_kindle',
    offer:[f2pL('f_gunnhild',`My forge went cold the night the moth came. I still come in every morning and pick up the hammer. Habit.`,`My forge went cold. I still pick up the hammer.`),
      f2pL('f_gunnhild',`You're MAREN'S kid? Then you've got the fire. Light my forge and I'll make that whip of yours into something your mother would frame.`,`You're Maren's kid! Light my forge. I'll make your whip amazing.`)],
    steps:[
      {t:'flag',flag:'f_forge_lit',text:S('Blaze Gunnhild’s cold forge in Anvilheart Forge','Blaze Gunnhild’s cold forge'),at:()=>DOORS.some(d=>d.area==='h_f_gunnhild')?'area:h_f_gunnhild':'npc:f_gunnhild'},
      {t:'item',item:'f_starfrost',n:1,text:S('Find starfrost ore, the blue ore that grows where fire meets frost (the Mammoth Graveyard in the Stonehorn hills, or deep in Stonehorn Deep)','Find blue starfrost ore in the Stonehorn hills'),at:()=>f2pStarfrostSpot()},
      {t:'talk',npc:'f_gunnhild',take:{f_starfrost:1},text:S('Bring the starfrost to Gunnhild','Bring the starfrost to Gunnhild'),lines:[f2pN(`CLANG. CLANG. CLANG. Gunnhild hums the same lantern song your mom hums. You don't say anything. You just grin.`,`CLANG! CLANG! Gunnhild hums your mom's song. You grin.`),
        f2pL('f_gunnhild',`The Ember Chain. The tip burns. It lights braziers from as far as it reaches, burns roots, and knocks frost right off things. Tell your mother. Tell her Gunnhild of Hearthold says hello. Tell her twice.`,`The Ember Chain! The tip burns. It lights braziers and melts frost. Tell your mom hello. Twice.`)],reward:{xp:650,f2p:()=>{ G.flags.f_emberchain=1; setBanner(S('The Ember Chain!','The Ember Chain!'),S('The Chain Whip’s tip burns: it lights braziers and roots from range, melts ice and hits frost foes harder.','Your whip tip burns now!'),3.6); }}}]},
  f_pack:{title:S('The Long Howl','The Long Howl'),giver:'f_greymane',min:'f_pass',offer:[]},
  f_warm:{title:S('Warm Regards','Warm Hands'),giver:'f_toastwhistle',min:'f_kindle',
    offer:[f2pL('f_toastwhistle',`Ash! Horned boy! Official question from the Mayor: how many frozen people can one dragon warm up?`,`Official question! How many frozen people can you warm up?`),f2pL('ash',`...All of them?`,`...All of them?`),
      f2pL('f_toastwhistle',`TWELVE would do! Twelve, and I'll give you a medal! I've never given anyone a medal! I'll have to make one!`,`TWELVE! Then I'll give you a medal! I'll have to make one!`)],
    steps:[
      {t:'flag',flag:'f_warm12',text:S('Thaw 12 Frozen Folk anywhere in Frostreach','Thaw 12 frozen people'),at:()=>f2pNearestFrozen()},
      {t:'talk',npc:'f_toastwhistle',text:S('Collect your medal from the Mayor','Get your medal from the Mayor'),give:{f_medal:1},lines:[f2pL('f_toastwhistle',`Twelve! TWELVE! Everyone, gather round! Hearthwardens, a drum roll!`,`TWELVE! Gather round! A drum roll!`),
        f2pN(`Captain Brann does a drum roll on his own helmet.`,`Brann drums on his own helmet.`),
        f2pL('f_toastwhistle',`I hereby award Ash of Emberhollow the Warm Hands Medal, for warming hands! And feet! And entire people!`,`The Warm Hands Medal! For warming hands, feet and whole people!`),
        f2pL('f_toastwhistle',`It's a cookie. ...There's a real one too. And this. A Heart Ember from the Hall. We've been saving it for a hero. Everything is FINE now.`,`It's a cookie. There's a real one too. And a Heart Ember! Everything is FINE.`)],reward:{heart:'f_warm',coins:170,xp:650}}]}
});
// Elka goes to the Windscour Shrine for the start of her race as soon as the race is on
{ const base=startQuest; startQuest=function(id){ base(id); if(id==='f_sled'||id==='f_pack') try{ setupNPCs(); }catch(e){} }; }
// The Long Howl has two paths (Act I's choice for Greymane): steps follow G.choices.greymane
Object.defineProperty(QDEFS.f_pack,'steps',{configurable:true,enumerable:true,get(){ return G&&G.choices&&G.choices.greymane==='home'?F2P_PACK_HOME:F2P_PACK_ALLY; }});
// the words that depend on choices and progress (getters, so a talk step can name them by STORY key)
Object.defineProperty(STORY,'f_song_reveal',{configurable:true,get(){ return [
  f2pN(`Brynja sings. Her voice is cracked and old and perfect. The Great Hearth flickers in time, like it's humming along.`,`Brynja sings. Her old voice is perfect. The Hearth hums along.`),
  ...f2pVerse(F2P_V1),...f2pVerse(F2P_V2),...f2pVerse(F2P_V3),
  f2pL('f_eider',`"Horns of red. Fire in her hands." That's an Emberblood. That's EMBER.`,`"Horns of red. Fire in her hands." That's EMBER!`),
  f2pL('f_brynja',`And she called the Snow Mother "Auntie"...`,`She called the Snow Mother "Auntie"...`),
  f2pL('ash',`Ember's auntie? Then who WAS the Snow Mother? And where did she go?`,`Ember's auntie? Who was she?`),
  f2pL('f_eider',`Then the song is a key. Dragons remember songs. My cousin Wren says so, and Wren is never wrong. She tells me constantly.`,`Then the song is a key. Dragons remember songs. Wren says so.`),
  f2pL('f_brynja',`Then go and sing it to her, child. And tell her Hearthold never forgot her. We just forgot her name.`,`Go sing it to her. Tell her we never forgot her. Just her name.`),
  f2pL('f_eider',`Wait. WAIT. Wren's lost page! The eleventh one! It was stuck to the back of a recipe for frost pudding. Very old jam.`,`Wait! Wren's lost page! The eleventh! It was stuck to a pudding recipe!`),
  f2pN(`"On the first Lantern Day, a little grey moth sat on Ember's lantern all night. Ember gave her a name. We thought nothing of it." (Iska)`,`"A grey moth sat on Ember's lantern. Ember gave her a name." (Iska)`),
  f2pL('ash',`A moth with a name. And nobody wrote the name down.`,`Ember named a moth. Nobody wrote the name down.`),
  f2pL('tove',`I remember that moth. She was so small. She was so COLD.`,`I remember that moth. So small. So COLD.`),
  f2pDo(()=>{ G.flags.f_page11=1; })]; }});
Object.defineProperty(STORY,'f_pack_meet',{configurable:true,get(){ return [
  f2pN(`A huge grey wolf steps out of the snow. You know him. Greymane. His eyes are wolf-yellow now, not orange. He wags. Once. Very dignified.`,`A huge grey wolf steps out of the snow. Greymane! He wags. Once.`),
  {who:'narr',text:S(`He followed the cold all the way north, the way wolves follow a storm. And three of his pack followed the purple moths instead.`,`He followed the cold north. Three of his wolves followed the purple moths.`),skipIf:()=>G.choices.greymane!=='ally'},
  {who:'narr',text:S(`Three of his pups wandered north after the first snow. Pups follow anything sparkly. Greymane looks at you, then at the white hills, then at you again.`,`Three of his pups wandered north. Greymane looks at you. Then at the hills.`),skipIf:()=>G.choices.greymane!=='home'},
  f2pL('ash',`I'll help you find them.`,`I'll help you find them.`),
  f2pN(`Greymane licks your face. It's like being hit with a warm, wet blanket. Again.`,`Greymane licks your face. Like a warm, wet blanket.`)]; }});
if(!STORY.f_duchess) STORY.f_duchess=[f2pN(`On the very tip of the black ice spike, at the top of the tallest mountain in the north, stands a goat. In a tiny scarf.`,`On top of the tallest mountain stands a goat. In a tiny scarf.`),
  ['goat',S(`Meh.`,`Meh.`)],f2pL('ash',`DUCHESS? How did you even... You know what. I don't want to know.`,`DUCHESS? How did you... Never mind.`),
  f2pDo(()=>{ if(!G.flags.f_duchess){ G.flags.f_duchess=1; addCoins(30,player.x,player.y); gainXp(60); } })];
// step text with counters (stepText would say "clues") and Sigrun still frozen for the soup
{ const base=stepText; stepText=function(id){
  const st=stepOf(id); if(!st||!String(id).startsWith('f_')) return base(id);
  if(st.mini&&G.mini&&G.mini.qid===id) return base(id);
  if(id==='f_mumble'&&G.quests[id].step===0&&!f2pThawed('f_sigrun')) return simplify(S('Thaw Sigrun the cook in Rimeholm, then ask her for soup','Thaw Sigrun in Rimeholm. Ask for soup.'));
  if(id==='f_warm'&&st.flag==='f_warm12') return `${simplify(st.text)} (${Math.min(12,G.flags.f_frozen_n|0)}/12)`;
  if(st.t==='flags') return `${simplify(st.text)} (${st.flags.filter(f=>G.flags[f]).length}/${st.n})`;
  if(id==='f_juniper'&&st.flag==='f_juniper_home'&&F2P.esc) return `${simplify(st.text)} (${simplify(S('hits','hits'))} ${F2P.esc.hits|0}/3)`;
  return base(id); }; }
function f2pExtra(k,line){ G.choices.extra=G.choices.extra||{}; G.choices.extra[k]=line; }

// ---------- the Frozen Folk (ACT3 3.8 and 4.2): 12 on the edges of the world and 8 in Rimeholm. A frozen person is a
// p3_frost `frozen` object; Blaze held 2 s thaws them (1 s with Bluefire). If the world module placed one already
// (same id, same person, or the same spot) this module only adds the words and the rewards to it.
const f2pLk=(skin,hair,o)=>Object.assign({skin,hair},o);
const F2P_FROZEN=[
  {id:'f_fergus',who:'f_fergus',x:3300,y:50000,coins:20,lines:()=>[f2pL('f_fergus',`Mittens! Get your mittens! ...Why is it so quiet? How long was I standing here?`,`Mittens! Why so quiet? How long was I here?`),
    f2pL('ash',`About a month.`,`About a month.`),f2pL('f_fergus',`A month? My feet are asleep. Here. Take these. Mitten earmuffs. On the house. The house is me. I'll be at Hearthold's West Gate, if anyone needs mittens. Everyone needs mittens.`,`A month? Take these mitten earmuffs! Free! Find me at the West Gate.`)],
    onThaw:()=>{ giveItems({f_earmuffs:1},true); f2pHat('f_earmuffs'); setBanner(S('Mitten Earmuffs','Mitten Earmuffs'),S('Fergus’s gift. Very warm, very red.','Warm and red!'),2.4); }},
  {id:'f_frz_milk',name:S('the milkman','the milkman'),x:5000,y:49100,coins:15,look:f2pLk('#e8bc98','#6a4a2a',{hairdo:'short',outfit:'overalls',shirt:'#efe6d6',low:'#3a5a8a',hat:'cap',hatc:'#3a5a8a',hold2:'basket',basketc:'bread'}),
    line:S(`Moo! I mean, morning! The cow said moo. I said morning. We're both a bit confused.`,`Moo! I mean, morning! We're both confused.`),after:S(`The cow's gone home. She's very cross with the weather. So am I. Moo. Sorry.`,`The cow went home. She's cross. So am I.`)},
  {id:'f_frz_guard1',name:S('a Hearthwarden','a Hearthwarden'),x:6050,y:48850,coins:15,look:f2pLk('#f0c8a8','#8a5a2a',{hairdo:'short',outfit:'armor',helm:true,plume:'#3a6aaa',cape:'#2a4a7a',hold:'spear',build:'strong'}),
    line:S(`I was on watch! I'm still on watch! I watched a whole month of nothing!`,`I was on watch! I watched a month of nothing!`),after:S(`Report: nothing happened for a month. Then a dragon happened. Report ends.`,`Nothing happened for a month. Then a dragon came.`)},
  {id:'f_frz_guard2',name:S('a Hearthwarden','a Hearthwarden'),x:7550,y:48850,coins:15,look:f2pLk('#c88a62','#2a1a10',{hairdo:'braids',outfit:'armor',helm:true,plume:'#3a6aaa',cape:'#2a4a7a',hold:'spear'}),
    line:S(`Captain Brann's going to make me do push-ups. Frozen push-ups count, right?`,`Brann will make me do push-ups. Frozen ones count?`),after:S(`Do frozen push-ups count? I'm going to say they count.`,`Frozen push-ups count. I say so.`)},
  {id:'f_frz_skater',name:S('a skater girl','a skater girl'),x:4800,y:46200,coins:20,face:0.4,look:f2pLk('#f2c8a6','#c86a2a',{hairdo:'pony',outfit:'dress',shirt:'#c84a8a',low:'#5a2a5a',scarf:'#f0e0a0',scarfLen:1.4,hat:'beanie',hatc:'#f0e0a0',build:'teen'}),
    line:S(`...and that's a triple spin! Wait. Did anyone see it? Nobody saw it.`,`A triple spin! Did anyone see? Nobody saw.`),after:S(`I'll do it again. Watch. Watch! ...I fell. Don't look.`,`Watch me spin! ...I fell. Don't look.`)},
  {id:'f_frz_fisher',name:S('an ice fisher','an ice fisher'),x:4350,y:45500,coins:20,look:f2pLk('#d8a07c','#8a8a8a',{hairdo:'short',beard:true,beardc:'#8a8a8a',outfit:'coat',shirt:'#5a6a3a',low:'#3a3a2a',hat:'fur',hatc:'#6a4a2a',hold:'rod'}),
    line:S(`Got one! ...Oh. It's a boot. A frozen boot. Still counts.`,`Got one! Oh. A boot. Still counts.`),after:S(`Two boots now. If I catch a third I'll have a spare.`,`Two boots now. One more for a spare.`)},
  {id:'f_frz_monk',name:S('a Wind Monk','a Wind Monk'),x:9600,y:46200,coins:25,look:f2pLk('#a87050','#2a1a10',{hairdo:'bald',hood:'#e8a030',outfit:'robe',shirt:'#e8a030',low:'#c87a1a',sash:'#c83a2a',build:'short'}),
    line:S(`Om. Omm. Ommmm. Oh! Hello. I was meditating. A bit too well.`,`Ommm. Oh! Hello. I meditated too well.`),after:S(`Brother Pennant is on his kite above the temple. Tell him I'm coming. Slowly. I'm still thawing my knees.`,`Tell Pennant I'm coming. Slowly.`)},
  {id:'f_frz_hiker',name:S('a hiker','a hiker'),x:13300,y:41550,coins:30,look:f2pLk('#e8bc98','#3a2a1a',{hairdo:'short',outfit:'coat',shirt:'#c86a2a',low:'#3a4a3a',hat:'beanie',hatc:'#3a8a5a',back:'pack'}),
    line:S(`I came up here for the view. The view is ice. Lovely ice.`,`I came for the view. It's ice. Lovely ice.`),after:S(`The view's better now. I can see a dragon. Hello, dragon.`,`The view is better now. Hello, dragon.`)},
  {id:'f_frz_trapper',name:S('a trapper','a trapper'),x:12200,y:49900,coins:25,look:f2pLk('#c08860','#6a4a2a',{hairdo:'long',beard:'big',beardc:'#6a4a2a',outfit:'fur',shirt:'#6a4a2a',low:'#4a3a2a',hat:'fur',hatc:'#5a3a1a'}),
    line:S(`Tell Hask I'm sorry I'm late. A month late. Tell him gently.`,`Tell Hask I'm a month late. Gently.`),after:S(`Hask's camp is west of here. Follow the lantern posts. And the barking. If there's barking.`,`Hask's camp is west. Follow the lanterns.`)},
  {id:'f_frz_postman',name:S('a postman','a postman'),x:1950,y:42800,coins:25,look:f2pLk('#e6b494','#8a5a2a',{hairdo:'short',outfit:'coat',shirt:'#3a4a7a',low:'#2a3a5a',hat:'cap',hatc:'#3a4a7a',bag:'#7a5a32'}),
    line:S(`Special delivery! For... the fish? I think I got lost.`,`Special delivery! For the fish? I'm lost.`),after:S(`Don't tell Oskar in Rimeholm. He'll write me a strongly worded letter. He loves those.`,`Don't tell Oskar. He'll write me a letter.`)},
  {id:'f_frz_knight',name:S('Sir Knut of the Hearthwardens','Sir Knut'),x:6500,y:44400,coins:30,look:f2pLk('#f0c8a8','#e8c060',{hairdo:'short',outfit:'armor',helm:true,plume:'#c83a2a',cape:'#7a2a2a',hold:'sword',build:'tall'}),
    line:S(`My patrol! Where's my patrol? They were right behind me when the purple snow came down!`,`Where is my patrol? The purple snow came!`),after:S(`I'll guard the moor until my patrol comes home. Bravely. Next to the warm dragon.`,`I'll guard the moor till they come home.`)},
  {id:'f_frz_kid',name:S('a sledding kid','a sledding kid'),x:7900,y:48150,coins:15,kid:true,look:f2pLk('#c8946c','#2a1a10',{hairdo:'spiky',outfit:'coat',shirt:'#3a8a5a',low:'#3a3a4a',hat:'beanie',hatc:'#c84a3a',mittens:'#c84a3a',sled:true}),
    line:S(`Wheeeee... eee? Why did I stop? I was going so fast.`,`Wheee... Why did I stop? I was so fast!`),after:S(`Again! Again! Soren, push me again!`,`Again! Push me again!`)},
  // Rimeholm (ACT3 4.2): Ylva is the main story (6.6); the others are Rimeholm, One Thaw at a Time (10.5)
  {id:'f_ylva',who:'f_ylva',x:1980,y:46790,lines:()=>STORY.f_ylva||[f2pN(`The ice on the old woman goes soft, then slushy, then drips away. She blinks. She looks down at her knitting.`,`The ice drips away. The old woman blinks.`),
    f2pL('f_ylva',`Oh, bother. I dropped a stitch. Hello, dear. I wasn't frozen. I was resting my eyes.`,`Oh, bother. A dropped stitch. I was resting my eyes, dear.`)],onThaw:()=>{ if(typeof f2sBeat==='function') try{ f2sBeat('ylva'); return; }catch(e){} G.flags.f_ylva=1; }},   // x2_story plays her scene (F2STORY.md 4)
  {id:'f_tollef',who:'f_tollef',x:1950,y:46830,lines:()=>[f2pL('f_tollef',`WHAT? OH! HELLO! I CAN'T HEAR YOU, I'VE BEEN STANDING NEXT TO A BELL FOR FORTY YEARS!`,`WHAT? HELLO! I CAN'T HEAR! TOO MANY BELLS!`),f2pL('f_tollef',`THE BELL HAS A SONG! THE SNOW MOTHER'S SONG! I ONLY KNOW THE FIRST BIT!`,`THE BELL HAS A SONG! I KNOW THE FIRST BIT!`)]},
  {id:'f_saga',who:'f_saga',x:1150,y:46900,coins:10,lines:()=>[f2pL('f_saga',`I had a bite! A big one! ...It got away. A month ago. Probably.`,`I had a big bite! It got away. A month ago.`),f2pL('f_saga',`Here. Some bait. Good bait. Don't eat it.`,`Here. Good bait. Don't eat it.`)],onThaw:()=>{ giveItems({fish:1},true); }},
  {id:'f_sigrun',who:'f_sigrun',x:2200,y:47250,lines:()=>[f2pL('f_sigrun',`My soup! My soup! It's a soup-sicle. ...Actually, that's not bad. Lick it.`,`My soup is a soup-sicle! Lick it.`)],heal:40},
  {id:'f_bo',who:'f_bo',x:1700,y:46650,lines:()=>[f2pL('f_bo',`Throw! Ha! Got you! ...Where did everyone go? Why are you a dragon?`,`Throw! Got you! Why are you a dragon?`),f2pL('f_bo',`I've been holding this snowball for a month. I'm keeping it. Forever. His name is Steve.`,`I kept this snowball a month. His name is Steve.`),f2pL('f_bo',`Here. Pip treat. It was in my pocket. It's frozen. Pip won't mind.`,`Here, a Pip treat. It's frozen.`)],onThaw:()=>{ G.pipTreats=(G.pipTreats||0)+1; }},
  {id:'f_nils',who:'f_nils',x:380,y:47450,lines:()=>[f2pL('f_nils',`Nisse! You're thawed! Don't headbutt the dragon. Don't headbutt the...`,`Nisse! Don't headbutt the dragon!`),['f_nisse',S(`Meh.`,`Meh.`)],f2pL('f_nils',`She likes you. That was a friendly headbutt.`,`She likes you. That was a nice headbutt.`)],coins:15},
  {id:'f_oskar',who:'f_oskar',x:1400,y:46350,lines:()=>[f2pL('f_oskar',`I've never been late. Not once. Thirty years. And now: a month. I'm going to have to write myself a strongly worded letter.`,`Thirty years, never late. Now a month! I'll write myself a cross letter.`),f2pL('f_oskar',`I have a letter for Brynja in Hearthold. It's got a snowflake stamp. Very old stamp.`,`I have a letter for Brynja. A very old stamp.`)],coins:15},
  {id:'f_rasmus',who:'f_rasmus',x:2450,y:46600,need:2,lines:()=>[f2pL('f_rasmus',`Hmm. Warm. You did that. One person at a time.`,`Warm. You did that. One at a time.`)]}
];
// where the Rimeholm folk are and what trick reaches them (the HUD target and the hints)
const F2P_RIME=['f_tollef','f_saga','f_sigrun','f_bo','f_nils','f_oskar'];
const F2P_RASMUS_N=6;
function f2pRasmusReady(){ return F2P_RIME.every(f2pThawed)&&f2pThawed('f_ylva'); }
function f2pFindFrozen(d){ if(typeof P3==='undefined'||!P3.out) return null; return P3.out.find(o=>o.p3==='frozen'&&(o.id===d.id||(d.who&&o.who===d.who)||dist(o.x,o.y,d.x,d.y)<50))||null; }
function f2pFrozenObj(id){ if(typeof P3==='undefined'||!P3.out) return null; return P3.out.find(o=>o.p3==='frozen'&&(o.id===id||o.who===id||o.f2pId===id))||null; }
function f2pPlaceFrozen(){
  if(typeof p3Add!=='function') return; F2P.placed=F2P.placed||{};
  for(const d of F2P_FROZEN){
    const ex=f2pFindFrozen(d);
    const lines=typeof d.lines==='function'?d.lines:null;
    // the world placed this one: the words are this module's (a thaw dialogue replaces the world's one-line bubble for
    // the named folk, whose lines carry a gift or a quest hint); Ylva's thaw is the story's scene and stays as it is
    if(ex){ ex.f2pId=d.id;
      if(lines&&d.id!=='f_ylva'){ try{ Object.defineProperty(ex,'lines',{configurable:true,enumerable:true,get:lines}); ex.f2pLine=ex.line; ex.line=null; }catch(e){} }
      else if(!ex.lines&&!ex.line){ if(lines) Object.defineProperty(ex,'lines',{configurable:true,get:lines}); else if(d.line) ex.line=d.line; }
      if(!ex.after&&d.after) ex.after=d.after; if(!ex.coins&&d.coins) ex.coins=d.coins; if(d.onThaw){ const o0=ex.onThaw; ex.onThaw=o=>{ if(o0) o0(o); d.onThaw(o); }; } continue; }
    const o={id:d.id,x:d.x,y:d.y,flag:'f_thaw_'+d.id,f2pId:d.id,face:d.face!=null?d.face:Math.PI/2};
    for(const k of ['who','look','name','coins','heal','after','line','onThaw','need']) if(d[k]!=null) o[k]=d[k];
    if(lines) Object.defineProperty(o,'lines',{configurable:true,enumerable:true,get:lines});
    if(!d.who) o.leave=false;
    p3Add('frozen',o); F2P.placed[d.id]=1;
  }
  // the reach tricks that come with a frozen villager placed here: Tollef's frozen tower door, Oskar's iron bars
  if(F2P.placed.f_tollef&&!LANDMARKS.some(q=>q.p3==='icewall'&&dist(q.x,q.y,1950,46870)<120)) p3Add('icewall',{id:'f_tower_door',x:1950,y:46872,w:74,h:22,hh:56,style:'block'});
  if(F2P.placed.f_oskar&&typeof p2Add==='function'&&!LANDMARKS.some(q=>/bars/.test(String(q.k||q.p2||''))&&dist(q.x,q.y,1400,46350)<220)){
    try{ p2Add('thinbars',{id:'f_oskar_n',x:1400,y:46268,w:180,h:16,style:'iron'}); p2Add('thinbars',{id:'f_oskar_s',x:1400,y:46432,w:180,h:16,style:'iron'});
      p2Add('thinbars',{id:'f_oskar_w',x:1318,y:46350,w:16,h:180,style:'iron'}); p2Add('thinbars',{id:'f_oskar_e',x:1482,y:46350,w:16,h:180,style:'iron'}); }catch(e){ console.warn('x2_people bars',e); }
  }
}
// the generic Rimeholm neighbors are frozen too, at their doors; they all thaw when the quest ends (one shared line)
function f2pPlaceGenerics(){
  if(typeof p3Add!=='function') return;
  for(const c of CAST){ if(!f2pRimeGen(c.id)) continue; const d=homeDoor(c.id); if(!d) continue; const id='frz_'+c.id;
    // x2_world freezes the neighbors itself (f_frz_<id>, who:<id>): then this stand-in stays off
    if(LANDMARKS.some(q=>q.id===id||(q.p3==='frozen'&&(q.who===c.id||q.flag==='f_thaw_'+c.id)))) continue;
    p3Add('frozen',{id,x:d.x+24,y:d.y+34,flag:'f_thaw_'+c.id,f2pId:c.id,f2pGen:true,name:c.name,look:Object.assign({},c.look),hideNpc:false,leave:false,line:S(`Brrr! Did I miss supper? I missed a month of suppers!`,`Brrr! Did I miss supper? A month of them!`),after:S(`Thank you, dragon. Rimeholm is waking up.`,`Thank you, dragon.`)}); }
}
{ const base=assignHomesNew; assignHomesNew=function(){ base(); try{ f2pPlaceGenerics(); }catch(e){ console.error('x2_people generics',e); } }; }

// ---------- the places the side quests need on the map (built after the world module's own build). A landmark the
// world module already made (same id) keeps its look; this module adds what it does.
function f2pLMid(id){ return LANDMARKS.find(q=>q.id===id)||null; }
function f2pLMat(id){ return f2pLMid(id)?'lm:'+id:null; }
function f2pLM(o){
  const ex=f2pLMid(o.id);
  if(ex){ for(const k in o){ if(k==='id'||k==='x'||k==='y') continue; if(ex[k]==null) { const dsc=Object.getOwnPropertyDescriptor(o,k); if(dsc&&dsc.get) Object.defineProperty(ex,k,dsc); else ex[k]=o[k]; } } if(o.act&&ex.act!==o.act&&!ex.f2pMerged){ const a0=ex.act; ex.f2pMerged=true; ex.act=x=>{ if(o.act(x)!==false) return; if(a0) a0(x); }; } return ex; }
  if(o.draw&&o.hidden&&!o.drawAlways){ const d0=o.draw; o.draw=(q,t)=>{ if(q.hidden&&q.hidden()) return; d0(q,t); }; }
  o.noNudge=true; if(o.always===undefined&&'prompt' in o) o.always=true; return addLandmark(o);
}
const F2P_DOGS=[
  {flag:'f_dog1',name:S('Snowball','Snowball'),x:3900,y:50460,fur:'#f4f0e8',ear:'#d8d0c0',how:'camp'},
  {flag:'f_dog2',name:S('Pepper','Pepper'),x:1200,y:43150,fur:'#3a3430',ear:'#1a1410',how:'floe'},
  {flag:'f_dog3',name:S('Biscuit Two','Biscuit Two'),x:9350,y:47500,fur:'#c8904a',ear:'#8a5a2a',how:'claws'},
  {flag:'f_dog4',name:S('Sergeant','Sergeant'),x:12150,y:47900,fur:'#7a7a80',ear:'#4a4a50',how:'wind'},
  {flag:'f_dog5',name:S('Mittens','Mittens'),x:4700,y:45300,fur:'#8a6a5a',ear:'#f4ece0',how:'ice'}];
const F2P_KENNEL=[11560,49520];
const F2P_SLED={rest:{x:11300,y:49450,n:S('Hask’s Rest','Hask’s Rest')},gate:{x:7600,y:49050,n:S('Hearthold’s East Gate','Hearthold’s East Gate')},rime:{x:2950,y:47450,n:S('below Rimeholm','below Rimeholm')},moor:{x:7900,y:44900,n:S('the Dreadmoor','the Dreadmoor')}};
const F2P_WOLF=[{flag:'f_wolf1',name:S('Frostear','Frostear'),x:10600,y:50300},{flag:'f_wolf2',name:S('Nibbles','Nibbles'),x:12900,y:49900},{flag:'f_wolf3',name:S('Big Bob','Big Bob'),x:13500,y:50700}];
// the pups: in the Steamwell among the snow monkeys, in a drift on the Dreadmoor (clear of the Hush arena), on the
// Glimmerfrost's south pressure ridge (the north one holds the frozen fish secret)
// (x2_world names the spots: f2wSpot('pupsteam'|'pupmoor'|'pupridge'), read at build when it is there)
const F2P_PUP=[{flag:'f_pup1',x:3760,y:49590,how:'stare',spot:'pupsteam'},{flag:'f_pup2',x:7980,y:44520,how:'drift',spot:'pupmoor'},{flag:'f_pup3',x:5700,y:46940,how:'ridge',spot:'pupridge'}];
const F2P_SING=[13250,47250], F2P_DRUM=[13300,41400], F2P_BELL=[1950,46750], F2P_GRAVE=[11000,41700];
function f2pSledCross(){ return typeof CROSSINGS!=='undefined'&&!!(CROSSINGS.f_sled_rest||CROSSINGS.f_sled_gate); }
// x2_world (F2WORLD.md) leaves stand-ins for two quest objects with switches for this module: its powder crate and
// its five dogs. They switch off here and mine take their spots (read live: the world moves things). Its kennel, its
// dog-5 ice block and its skull drum are kept and hooked (V9 8: one owner per thing).
const F2P_CRATE=[5300,50470,5300,50610];
function f2pWorldSpots(){
  if(typeof F2WD==='undefined'||!F2WD) return;
  const c=f2pLMid('f_lm_powder'), d=f2pLMid('f_lm_powder_down');
  if(c){ F2P_CRATE[0]=c.x; F2P_CRATE[1]=c.y; } if(d){ F2P_CRATE[2]=d.x; F2P_CRATE[3]=d.y; }
  F2P_DOGS.forEach((D,i)=>{ const o=f2pLMid('f_dog_'+(i+1)); if(o){ D.x=o.x; D.y=o.y; } });
  const k=(F2WD.objs||[]).find(o=>o&&o.k==='kennel'); if(k){ F2P_KENNEL[0]=k.x; F2P_KENNEL[1]=k.y+24; F2P.worldKennel=true; }
  F2WD.noPowderCrate=true; F2WD.noDogs=true;
  if(F2WD.gulchCrate&&F2WD.gulchCrate.st==='up') F2WD.gulchCrate.st='gone';   // its crate picture goes too (mine is drawn there)
}
function f2pBuild(B){
  f2pPlaceFrozen();
  f2pWorldSpots();
  // f_bombs: the powder crate on its ledge in Snowgob Gulch, the drop below it, the Big Boulder on the Quarry Road
  f2pLM({id:'f_lm_crate',k:'f_crate',x:F2P_CRATE[0],y:F2P_CRATE[1],hidden:()=>!f2pAt('f_bombs',0)||!!G.flags.f_powder_down||!!G.items.f_powder,get prompt(){ return S('Push the crate off the ledge','Push the crate off'); },draw:f2pDrawCrate,act:f2pCrateAct});
  f2pLM({id:'f_lm_cratedrop',k:'f_crate',x:F2P_CRATE[2],y:F2P_CRATE[3],drop:true,hidden:()=>!G.flags.f_powder_down||!!G.items.f_powder||!f2pOn('f_bombs'),get prompt(){ return S('Pick up the blasting powder','Pick up the powder'); },draw:f2pDrawCrate,act:()=>{ G.flags.f_powder_got=1; giveItems({f_powder:1}); SFX.play('pickup'); }});
  if(typeof armsAdd==='function'){
    const q=LANDMARKS.find(o=>o.k==='boulder'&&dist(o.x,o.y,5900,47600)<260);
    if(q){ const t0=q.then; q.then=o=>{ const was=!!G.flags.f_bombs_test; if(t0) t0(o); f2pBoulderBoom(was); }; F2P.quarry=q; }
    else F2P.quarry=armsAdd('boulder',{id:'f_quarry_boulder',x:5900,y:47600,r:46,then:()=>f2pBoulderBoom(!!G.flags.f_bombs_test)});
    const cw=typeof CROSSINGS!=='undefined'&&CROSSINGS.f_tunnel_w, tx=cw?cw.x:1750, ty=cw?cw.y-64:46050;
    const t=LANDMARKS.find(o=>o.k==='boulder'&&dist(o.x,o.y,tx,ty)<220);
    if(t){ const t0=t.then; t.then=o=>{ if(t0) t0(o); f2pTunnelOpen(); }; F2P.tunnel=t; }
    else F2P.tunnel=armsAdd('boulder',{id:'f_tunnel_boulder',x:tx,y:ty,r:40,then:()=>f2pTunnelOpen()});
  }
  // Mittens in x2_world's block of ice (a p3 icewall): found when it melts
  { const D=F2P_DOGS[4], ice=LANDMARKS.find(o=>o.p3==='icewall'&&(o.id==='f_dog5_ice'||dist(o.x,o.y,D.x,D.y)<90));
    if(ice){ F2P.dog5Ice=ice; const t0=ice.then; ice.then=o=>{ if(t0) t0(o); G.flags.f_dog5_free=1; if(f2pAt('f_dogs',0)) f2pDogFound(4); }; } }
  // the Mammoth Graveyard: x2_world's skull drum (a landmark with a p3On pound) gives the starfrost as well as its chest
  { const sk=f2pLMid('f_lm_skulldrum'), P=sk&&sk.p3on&&sk.p3on.pound;
    if(P){ const t0=P.then; P.then=(...a)=>{ if(t0) t0(...a); f2pGraveyard(true); }; F2P.skull=sk; } }
  if(typeof CROSSINGS!=='undefined'&&!CROSSINGS.f_tunnel_w&&typeof defineCrossing==='function'){
    defineCrossing({id:'f_tunnel_w',x:1790,y:46100,to:{x:6500,y:44860},label:S('Crawl through Juniper’s Tunnel','Crawl through the tunnel'),name:S('Juniper’s Tunnel','Juniper’s Tunnel'),kind:'stair',dir:Math.PI/2,need:()=>!!G.flags.f_tunnel_open,locked:S('A huge boulder blocks the tunnel.','A big rock is in the way.'),hidden:()=>!G.flags.f_tunnel_open,clear:60});
    defineCrossing({id:'f_tunnel_e',x:6500,y:44800,to:{x:1790,y:46170},label:S('Crawl through Juniper’s Tunnel','Crawl through the tunnel'),name:S('Juniper’s Tunnel','Juniper’s Tunnel'),kind:'stair',dir:-Math.PI/2,need:()=>!!G.flags.f_tunnel_open,hidden:()=>!G.flags.f_tunnel_open,clear:60});
  }
  // f_song: the bell, the Singing Stone and the Rune Drum
  f2pLM({id:'f_lm_bell',k:'f_bell',x:F2P_BELL[0],y:F2P_BELL[1],hidden:()=>false,get prompt(){ return f2pOn('f_song')&&!G.flags.f_v1?S('Ring the bell','Ring the bell'):S('Look at the bell','Look at the bell'); },draw:f2pDrawBell,act:f2pBellAct});
  f2pLM({id:'f_lm_singing',k:'f_singstone',x:F2P_SING[0],y:F2P_SING[1],r:20,hidden:()=>false,get prompt(){ return S('Look at the Singing Stone','Look at the stone'); },draw:f2pDrawStone,act:f2pStoneAct});
  if(typeof p3Add==='function'){
    const dr=LANDMARKS.find(o=>(o.id==='f_lm_runedrum'||o.p3==='drum')&&dist(o.x,o.y,F2P_DRUM[0],F2P_DRUM[1])<220);
    if(dr){ const t0=dr.then; dr.then=(o,n)=>{ if(t0) t0(o,n); f2pDrumVerse(); }; F2P.drum=dr; }
    else F2P.drum=p3Add('drum',{id:'f_lm_runedrum',x:F2P_DRUM[0],y:F2P_DRUM[1],r:36,then:()=>f2pDrumVerse()});
    // f_forge: the Mammoth Graveyard skull drum (starfrost), if the world has no drum there
    const gd=!F2P.skull&&LANDMARKS.find(o=>o.p3==='drum'&&dist(o.x,o.y,F2P_GRAVE[0],F2P_GRAVE[1])<240);
    if(gd){ const t0=gd.then; gd.then=(o,n)=>{ if(t0) t0(o,n); f2pGraveyard(); }; }
    else if(!F2P.skull) p3Add('drum',{id:'f2p_graveyard',x:F2P_GRAVE[0],y:F2P_GRAVE[1],r:34,then:()=>f2pGraveyard()});
  }
  // f_dogs: the five dogs, the kennel, and the dog sled posts (when the world has no sled crossings)
  F2P_DOGS.forEach((D,i)=>f2pLM({id:'f_lm_dog'+(i+1),k:'f_dog',i,x:D.x,y:D.y,hidden:()=>!f2pAt('f_dogs',0)||!!G.flags[D.flag],get prompt(){ return D.how==='ice'?S('Look at the frozen dog','Look at the frozen dog'):S('Call the dog','Call the dog'); },draw:f2pDrawDogLM,act:o=>f2pDogAct(o,i)}));
  f2pLM({id:'f_lm_kennel',k:'f_kennel',x:F2P_KENNEL[0],y:F2P_KENNEL[1]-(F2P.worldKennel?20:0),hidden:()=>false,get prompt(){ return S('Look at the kennel','Look at the kennel'); },draw:F2P.worldKennel?()=>{}:f2pDrawKennel,act:()=>f2pSay([f2pN(f2pDogsHome()>=5?`Five dog houses, five dogs, one very loud kennel. Pepper is chewing a boot.`:`Five little dog houses. ${f2pDogsHome()} of them have a dog in. The rest have a bowl and a name painted over the door.`,f2pDogsHome()>=5?`Five dogs! Pepper chews a boot.`:`Five dog houses. ${f2pDogsHome()} have a dog.`)])});
  if(!f2pSledCross()) for(const k in F2P_SLED){ const P=F2P_SLED[k]; f2pLM({id:'f_lm_sledpost_'+k,k:'f_sledpost',key:k,x:P.x,y:P.y,hidden:()=>!G.flags.f_sledline,get prompt(){ return S('Ride Hask’s dog sled','Ride the dog sled'); },draw:f2pDrawSledPost,act:()=>f2pSledMenu(k)}); }
  // f_juniper: the empty Map Tent with its note
  f2pLM({id:'f_lm_tent',k:'f_tent',x:7100,y:48700,r:22,hidden:()=>false,get prompt(){ return !G.flags.f_juniper_found&&f2pR('f_kindle')?S('Read the note on the tent','Read the note'):S('Look at Juniper’s Map Tent','Look at the tent'); },draw:f2pDrawTent,act:f2pTentAct});
  // f_forge outdoors (only if Gunnhild has no house): the cold forge beside her
  f2pLM({id:'f_lm_forge',k:'f_forge',x:7000,y:49280,hidden:()=>DOORS.some(d=>d.area==='h_f_gunnhild')||!(f2pOn('f_forge')||G.flags.f_forge_lit),get prompt(){ return G.flags.f_forge_lit?S('Warm your claws at the forge','Warm up at the forge'):S('Look at the cold forge','Look at the forge'); },draw:(o,t)=>f2pDrawForge(o.x,o.y,!!G.flags.f_forge_lit,t),act:()=>f2pForgeAct()});
  f2pLM({id:'f_lm_bomatic',k:'f_bomatic',x:6560,y:49300,hidden:()=>DOORS.some(d=>d.area==='h_f_mags')||!(f2pOn('f_bombs')||G.flags.f_bombs_lit),get prompt(){ return S('Look at the Bomb-o-Matic','Look at the Bomb-o-Matic'); },draw:(o,t)=>f2pDrawBomatic(o.x,o.y,!!G.flags.f_bombs_lit,t),act:()=>f2pBomaticAct()});
  // f_pack: Greymane's pups (the home path); the wolves are spawned near their spots
  for(const P of F2P_PUP){ let q=null; try{ q=typeof f2wSpot==='function'?f2wSpot(P.spot):null; }catch(e){} if(q&&Array.isArray(q)&&q.length>=2){ P.x=q[0]; P.y=q[1]; } else if(q&&q.x!=null){ P.x=q.x; P.y=q.y; } }
  for(const P of F2P_PUP) if(P.how!=='ridge'&&!f2pFree(P.x,P.y)){ const q=f2pNear(P.x,P.y); if(q){ P.x=q.x; P.y=q.y; } }
  F2P_PUP.forEach((P,i)=>f2pLM({id:'f_lm_pup'+(i+1),k:'f_pup',i,x:P.x,y:P.y,hidden:()=>!f2pAt('f_pack',0)||G.choices.greymane!=='home'||!!G.flags[P.flag],get prompt(){ return P.how==='drift'?S('Look at the snowdrift','Look at the snowdrift'):S('Call the pup','Call the pup'); },draw:f2pDrawPupLM,act:o=>f2pPupAct(o,i)}));
  // Duchess on the very top of Mount Dread (THREADS 14.3, sighting 3), after the Glaciar fight
  f2pLM({id:'f_lm_duchess',k:'f_goat',x:7300,y:40820,hidden:()=>true,drawAlways:true,draw:f2pDrawDuchess});
  }
{ const M=MAPS[2]; if(M){ const b0=M.build; M.build=function(B){ if(b0) b0.call(this,B); try{ f2pBuild(B); }catch(e){ console.error('x2_people build',e); } }; } }

// ---------- f_bombs: the crate, the Snowgob King, the Bomb-o-Matic, the test bomb, the Big Boulder
function f2pCrateAct(o){
  if(!f2pHigh(o,'claws')){ f2pSay([f2pN(`A crate stamped SPROCKET: DANGER: FUN sits on a ledge high up the gulch wall. You'd have to climb.`,`The crate is on a high ledge. Climb up!`)]); return; }
  f2pSay([f2pN(`You put your shoulder to the crate. It tips, slides, and drops off the ledge into a snowdrift below with a soft FLUMP. Nothing explodes. Good.`,`You push the crate. It drops into the snow. FLUMP. No boom. Good.`)],()=>{ G.flags.f_powder_down=1; shake(3); emit(o.x,o.y+130,18,{col:'240,248,255',glow:false,smin:40,smax:160,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); });
}
const f2pBombsReal=()=>!!(G.weapons&&G.weapons.bombs)&&!G.flags.f_testbomb;
function f2pTestBombHeld(){ return !!G.flags.f_testbomb&&(G.flags.wpn_bombs|0)>0||(G.wproj||[]).some(b=>b.k==='bomb'&&!b.dead); }
function f2pGiveTestBomb(){
  if(G.flags.f_bombs_test) return;
  // the Big Boulder is already gone (a full hammer smash, or a bomb from somewhere): the test has happened
  if(F2P.quarry&&G.found[F2P.quarry.id]){ f2pFlag('f_bombs_test'); f2pSay([f2pL('f_mags',`Wait. The Big Boulder's already GONE? You smashed it? With a HAMMER? ...I'm not even mad. Come and tell me everything.`,`The Big Boulder is gone? You smashed it? Come tell me!`)]); return; }
  if(f2pBombsReal()){ if(typeof addBombs==='function') addBombs(1,player.x,player.y); setBanner(S('A test bomb','A test bomb'),S('Throw it at the Big Boulder on the old Quarry Road.','Bomb the Big Boulder!'),2.8); return; }
  G.weapons=G.weapons||{sword:true};
  if(!G.flags.f_testbomb){ G.flags.f_testbomb=1; G.flags.f_bombMax0=G.flags.wpn_bombMax==null?0:G.flags.wpn_bombMax; G.weapons.bombs=true; }
  G.flags.wpn_bombMax=1; G.flags.wpn_bombs=1;
  try{ equipWeapon('bombs'); }catch(e){}
  setBanner(S('One test bomb','One test bomb'),S('Hold attack to aim, let go to throw. Aim for the Big Boulder on the old Quarry Road, by the Glimmerfrost.','Hold attack, aim, let go. Hit the Big Boulder!'),4);
  saveGame();
}
function f2pEndTestBomb(keep){
  if(!G.flags.f_testbomb) return;
  G.flags.f_testbomb=0; const m=G.flags.f_bombMax0; if(m) G.flags.wpn_bombMax=m; else delete G.flags.wpn_bombMax; delete G.flags.f_bombMax0;
  if(keep){ G.flags.wpn_bombs=typeof bombsMax==='function'?bombsMax():10; return; }
  delete G.weapons.bombs; delete G.flags.wpn_bombs; if(G.weapon==='bombs') try{ equipWeapon('sword',true); }catch(e){ G.weapon='sword'; }
}
function f2pBoulderBoom(was){
  if(f2pOn('f_bombs')&&G.quests.f_bombs.step>=3) f2pFlag('f_bombs_test');
  if(!was&&G.flags.f_bombs_test) f2pCalm(()=>{ f2pEndTestBomb(false); f2pSay([f2pN(`KA-BOOOOM. Snow goes up. Snow comes down. The boulder is gone. So is your hat, for a second.`,`KA-BOOOOM! Snow flies. The rock is gone!`),f2pN(`The old Quarry Road is open again, all the way along the lake to the Rim Road.`,`The Quarry Road is open again!`)],()=>questPoke()); });
}
// Juniper's Tunnel (f_juniper step 3): the boulder at its west end breaks to a bomb, a full hammer smash or a Roar
function f2pTunnelOpen(){
  if(!f2pFlag('f_tunnel_open')) return;
  f2pCalm(()=>f2pSay([f2pN(`The boulder cracks in half and rolls aside. Behind it, a tunnel of old blue ice runs under the cliffs, glowing faintly.`,`The boulder breaks! An ice tunnel runs under the cliffs.`),
    ['juniper',S(`(far away, faintly) Was that you? Was that the tunnel? It comes out at Glimmer Point! Write that down! I'll write that down!`,`(far away) Was that the tunnel? It goes to Glimmer Point!`)]],()=>setBanner(S('Juniper’s Tunnel is open','The tunnel is open'),S('A shortcut from Rimeholm’s cliffs to Glimmer Point.','A shortcut to Glimmer Point!'),3)));
}
// the Bomb-o-Matic and Gunnhild's forge: area objects in their houses (outdoor stand-ins when there is no house)
{ const base=areaNPCs; areaNPCs=function(){ base(); try{ f2pAreaObjs(AREA); }catch(e){ console.error(e); } try{ f2pIndoorSpots(AREA); }catch(e){ console.error(e); } }; }
// the stock house layouts can put a shelf, a desk or a counter on a person's indoor spot (INT2 7): step such a person
// forward onto the floor, to the first spot where Ash can stand in front of them and their prompt is the nearest one
function f2pIndoorSpots(A){
  if(!A||!A.npcs||!A.npcs.length) return;
  const reachOf=o=>(o.w?Math.max(o.w,o.h||0)/2:o.r||16)+34;
  const good=(x,y)=>{ const sx=x, sy=y+36;
    if(areaBlocked(x,y)||areaBlocked(sx,sy)||colAt(x,y,10)||colAt(sx,sy,12)) return false;
    for(const o of A.objs||[]){ if(o.broken) continue; const d=dist(sx,sy,o.x,o.y), r=reachOf(o); if(d<r&&!(dist(sx,sy,x,y)-70<d-r-2)) return false; }
    return true; };
  for(const n of A.npcs){ if(!n.id||!String(n.id).startsWith('f_')||good(n.x,n.y)) continue;
    let best=null;
    for(let dy=20;dy<=220&&!best;dy+=20) for(const dx of [0,-30,30,-60,60]){ if(good(n.x+dx,n.y+dy)){ best={x:n.x+dx,y:n.y+dy}; break; } }
    if(best){ n.x=best.x; n.y=best.y; if(n.home) n.home=[best.x,best.y]; }
  }
}
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.f2pAct){ o.f2pAct(o); return; } return base(o); }; }
{ const base=drawFurn; drawFurn=function(o,t){ if(o&&o.f2pDraw){ o.f2pDraw(o,t); return; } return base(o,t); }; }
function f2pAreaObjs(A){
  if(!A||A.kind!=='house') return;
  if(A.id==='h_f_mags'&&!A.objs.some(q=>q.id==='f_bomatic')){
    const x=A.rx+A.rw*0.72, y=A.ry+A.rh*0.28; f2pClearSpot(A,x,y,90);
    A.objs.push({id:'f_bomatic',k:'f_bomatic',x,y,w:54,h:44,f2pDraw:(o,t)=>f2pDrawBomatic(o.x,o.y,!!G.flags.f_bombs_lit,t),prompt:()=>S('Look at the Bomb-o-Matic','Look at the Bomb-o-Matic'),f2pAct:()=>f2pBomaticAct()});
    A.lights.push({x,y:y-12,r:150,i:0,obj:{get lit(){ return !!G.flags.f_bombs_lit; }}});
  }
  if(A.id==='h_f_gunnhild'&&!A.objs.some(q=>q.id==='f_forge')){
    const x=A.rx+A.rw*0.3, y=A.ry+A.rh*0.3; f2pClearSpot(A,x,y,90);
    A.objs=A.objs.filter(q=>q.k!=='fireplace');
    A.objs.push({id:'f_forge',k:'f_forge',x,y,w:60,h:46,f2pDraw:(o,t)=>f2pDrawForge(o.x,o.y,!!G.flags.f_forge_lit,t),prompt:()=>G.flags.f_forge_lit?S('Warm your claws at the forge','Warm up at the forge'):S('Look at the cold forge','Look at the forge'),f2pAct:()=>f2pForgeAct()});
    A.lights.push({x,y:y-14,r:200,i:0,obj:{get lit(){ return !!G.flags.f_forge_lit; }}});
  }
}
function f2pClearSpot(A,x,y,r){
  A.objs=A.objs.filter(o=>{ if(o.k==='rug'||o.k==='window'||o.k==='door'||dist(o.x,o.y,x,y)>r) return true;
    for(const c of [o.col].concat(o.bars||[])) if(c){ try{ removeCol(c); }catch(e){} const i=A.cols.indexOf(c); if(i>=0) A.cols.splice(i,1); }
    A.lights=A.lights.filter(L=>L.obj!==o); return false; });
}
function f2pBomaticAct(){
  if(G.flags.f_bombs_lit) f2pSay([f2pN(`The Bomb-o-Matic ticks and whistles happily. A little sign says: DO NOT HUG.`,`The Bomb-o-Matic ticks. A sign says: DO NOT HUG.`)]);
  else if(f2pAt('f_bombs',2)) f2pSay([f2pN(`A machine of pipes, dials and one very nervous bell. The furnace at its heart is frozen solid. It needs fire so hot it burns blue.`,`A machine of pipes. Its furnace is frozen. It needs blue fire.`),f2pL('f_mags',`Breathe on it! Hold it until it goes blue! Then stand back! Not that far! A bit further!`,`Breathe on it! Hold it till it's blue!`)]);
  else f2pSay([f2pN(`A machine of pipes, dials and one very nervous bell. Mags calls it the Bomb-o-Matic.`,`A machine of pipes. The Bomb-o-Matic.`)]);
}
function f2pForgeAct(){
  if(G.flags.f_forge_lit){ heal(25); f2pSay([f2pN(`The forge roars. Your scales glow like a horseshoe.`,`The forge roars. You feel warm.`)]); return; }
  f2pSay([f2pN(`A big stone forge, cold as a fish. Frost grows on the coals. Normal fire would never wake it. It needs Blaze.`,`A cold forge. It needs Blaze.`)]);
}
function f2pBomaticLit(){ if(!f2pFlag('f_bombs_lit')) return; shake(4); SFX.play('boom',0.5);
  f2pCalm(()=>f2pSay([f2pN(`The Bomb-o-Matic shakes. It whistles. It hops, a little. Then it spits out a round black bomb that rolls across the floor to Mags's boots.`,`The machine shakes and whistles. It spits out a bomb!`),
    f2pL('f_mags',`IT WORKS! Ha! I mean, of course it works. Here. One test bomb. Throw it at the Big Boulder on the old Quarry Road, by the lake. If it goes boom, we're in business.`,`IT WORKS! Here. One test bomb. Throw it at the Big Boulder!`)])); }
function f2pForgeLit(){ if(!f2pFlag('f_forge_lit')) return; shake(3); SFX.play('shrine');
  f2pCalm(()=>f2pSay([f2pN(`The coals crack, then roar. Blue fire, then gold, then the deep orange of a happy forge.`,`The coals roar. Blue, gold, then orange. The forge is awake!`),
    f2pL('f_gunnhild',`HA! Look at her go! Maren's kid, you're a marvel. Now bring me starfrost, the blue ore. It grows where fire meets frost. The Stonehorn hills, or deep under them.`,`HA! Look at her go! Now bring me blue starfrost ore. Look in the Stonehorn hills.`)])); }
// the Snowgob King and his gang in Snowgob Gulch (f_bombs step 0)
function f2pGulchTick(){
  if(AREA||!f2pAt('f_bombs',0)||G.flags.f_gulch_king||F2P.king&&!F2P.king.dead) return;
  if(dist(player.x,player.y,5200,50600)>750) return;
  const e=f2pFoe('f_snowgob','kobold',5250,50560,{elite:true}); e.hp*=2.2; e.maxHp=e.hp; e.r*=1.25; e.f2pKing=true; e.name='The Snowgob King'; F2P.king=e;
  if(typeof CAMPS==='undefined'||!CAMPS.some(c=>c.id==='f_gulch')) for(let i=0;i<4;i++) f2pFoe('f_snowgob','kobold',5200+Math.cos(i*1.6)*150,50600+Math.sin(i*1.6)*110,{});
  later(0.4,()=>{ if(F2P.king&&!F2P.king.dead) bubble(F2P.king,S('THIS IS OUR GULCH! I AM THE KING! THIS IS MY CROWN!','MY GULCH! I AM KING!'),{who:S('The Snowgob King','The Snowgob King'),col:'#c8d8e8',dy:-46}); });
}
{ const base=killEnemy; killEnemy=function(e){
  // Greymane's moth-struck wolves never die to a blow: at a fifth of their health they kneel, waiting for Blaze
  if(e&&!e.dead&&e.f2pWolf&&!e.f2pFreeing){ e.hp=Math.max(1,e.maxHp*0.2); if(!e.f2pDown) f2pWolfDown(e); return; }
  const king=e&&!e.dead&&e.f2pKing; base(e); if(king) try{ G.flags.f_gulch_king=1; F2P.king=null; giveItems({f_bucket:1},true); later(0.6,()=>{ f2pHat('f_bucket'); setBanner(S('The Bucket Crown!','The Bucket Crown!'),S('The Snowgob King drops his crown. It is a bucket. It is yours now.','The king drops his bucket crown!'),3); }); saveGame(); }catch(err){ console.error(err); } }; }
// ---------- f_song: the bell, the Singing Stone, the Rune Drum
function f2pVerseGot(n){
  const k='f_v'+n; if(G.flags[k]) return false;
  G.flags[k]=1; giveItems({['f_verse'+n]:1},true); try{ jingle('item','shrine'); }catch(e){}
  later(0.3,()=>setBanner(S(`The Snow Mother’s Song: verse ${n}`,`Verse ${n} of the song`),S(`${['f_v1','f_v2','f_v3'].filter(f=>G.flags[f]).length} of 3 verses. Bring them to Brynja at the Great Hearth.`,`${['f_v1','f_v2','f_v3'].filter(f=>G.flags[f]).length} of 3. Bring them to Brynja.`),3));
  questPoke(); saveGame(); return true;
}
function f2pBellAct(o){
  const need=f2pOn('f_song')&&!G.flags.f_v1;
  if(!need&&o.f2pMerged) return false;   // x2_world's bell rope does the rest
  if(!f2pHigh(o,'claws')){ f2pSay([f2pN(`High on top of the bell tower hangs Rimeholm's great bell. You'd have to climb the tower to reach it.`,`The bell is on top of the tower. Climb up!`)]); return; }
  if(!need){ f2pSay([f2pN(G.flags.f_v1?`Rimeholm's great bell. The first verse of the Snow Mother's Song is carved round its rim, and someone has polished every letter.`:`Rimeholm's great bell, glazed in ice. Words are carved round the rim, too frosted to read.`,G.flags.f_v1?`The bell. The first verse is carved on it.`:`The great bell. Words are carved on it.`)]); return; }
  if(!f2pThawed('f_tollef')){ f2pSay([f2pN(`Words are carved round the bell's rim, but the frost hides them. The rope hangs down into the tower, where somebody is still holding it. Frozen.`,`The words are frosty. The bellringer below is frozen.`),['tove',S(`The bellringer would know the tune. Thaw him first, Ash.`,`Thaw the bellringer first.`)]]); return; }
  f2pSay([f2pL('f_tollef',`(from below) THE BELL? YOU WANT THE SONG? STAND BACK! COVER YOUR EARS! ALL OF THEM!`,`(below) THE SONG? STAND BACK! COVER YOUR EARS!`),
    f2pN(`BONNNG. The frost falls off the bell in one big ring. BONNNG. Tollef sings along, very, very loudly.`,`BONNNG! The frost falls off. Tollef sings LOUDLY.`),...f2pVerse(F2P_V1),
    f2pL('f_tollef',`THAT'S THE FIRST BIT! THE REST IS SOMEWHERE ELSE! ASK THE SKY!`,`THAT'S THE FIRST BIT! THE REST IS ELSEWHERE!`)],()=>{ shake(3); f2pVerseGot(1); });
}
function f2pStoneTry(byWind){
  if(!f2pOn('f_song')||G.flags.f_v2) return false;
  F2P.stoneT=G.time;
  f2pSay([f2pN(byWind?`The wind rushes through the holes in the Singing Stone, and it sings. A low, clear tune, and words glowing one by one along its side.`:`You beat your wings hard. The wind swirls round the stone, through every hole, and it sings. Words glow along its side.`,`The wind blows through the stone. It sings! Words glow on it.`),...f2pVerse(F2P_V2),
    ['tove',S(`"Auntie." Ember's auntie again, Ash. She turns up everywhere we go up here.`,`Ember's auntie again! She is everywhere up here.`)]],()=>f2pVerseGot(2));
  return true;
}
function f2pStoneAct(o){
  if(!(f2pOn('f_song')&&!G.flags.f_v2)&&o.f2pMerged) return false;
  if(f2pOn('f_song')&&!G.flags.f_v2){
    const rib=typeof WIND!=='undefined'&&WIND.here().some(s=>s.pts.some(pt=>dist(pt[0],pt[1],o.x,o.y)<520));
    if(!rib&&hasAbil('windride')){ f2pStoneTry(false); return; }
    f2pSay([f2pN(`A tall stone full of holes, like a flute for a giant. Faint words are carved beside every hole. It needs a big wind through it.`,`A stone full of holes. It needs a big wind.`),['tove',S(hasAbil('windride')?`Ride the wind ribbon past it, Ash. Fast!`:`Only the wind can play that. A big wind. A wind you can ride.`,hasAbil('windride')?`Ride the wind past it!`:`Only a big wind can play it.`)]]); return; }
  f2pSay([f2pN(G.flags.f_v2?`The Singing Stone hums to itself in the breeze. Verse two, forever.`:`A tall stone full of holes. The wind whistles through it.`,`The stone hums in the wind.`)]);
}
function f2pDrumVerse(){
  if(!f2pOn('f_song')||G.flags.f_v3){ return; }
  f2pCalm(()=>f2pSay([f2pN(`BOOOM. The Rune Drum rings, and the carved runes around it light up one by one, gold, all the way round.`,`BOOOM! The runes light up, one by one.`),...f2pVerse(F2P_V3)],()=>f2pVerseGot(3)));
}
function f2pSongNext(){ if(!G.flags.f_v1) return f2pLMat('f_lm_bell')||'xy:1950,46750'; if(!G.flags.f_v2) return f2pLMat('f_lm_singing')||'xy:13250,47250'; return f2pLMat('f_lm_runedrum')||'xy:13300,41400'; }
// ---------- f_forge: starfrost from the Mammoth Graveyard (the dungeon's Bone Pile can give it too: giveItems({f_starfrost:1}))
function f2pGraveyard(world){
  if(G.found.f2p_starfrost) return;
  G.found.f2p_starfrost=true;
  // with x2_world's skull drum its chest holds the coins; the ore rattles out of the ribs
  if(world){ f2pCalm(()=>f2pSay([f2pN(`Something else rattles loose from the mammoth's ribs: a lump of ore as blue as a glacier, cold and warm at the same time. Starfrost.`,`Blue ore falls out of the ribs. Starfrost!`)],()=>giveItems({f_starfrost:1}))); return; }
  f2pCalm(()=>f2pSay([f2pN(`BOOM. The mammoth skull rings like a drum. The bones rattle, and out of the ribs tumbles an old chest, glittering with blue frost.`,`BOOM! The bones rattle. Out falls a frosty chest!`),f2pN(`Inside: coins, and a lump of ore as blue as a glacier. Starfrost.`,`Inside: coins and blue starfrost ore!`)],()=>{ addCoins(120,player.x,player.y); giveItems({f_starfrost:1}); }));
}
function f2pStarfrostSpot(){ return G.found.f2p_starfrost?'xy:12200,42450':'xy:'+F2P_GRAVE[0]+','+F2P_GRAVE[1]; }
// the Ember Chain (f_forge): the whip's tip burns while it lashes, and frost foes take more from it
function f2pEmberChainTick(dt){
  if(!G.flags.f_emberchain) return; const L=player.wl; if(!L||L.ext==null||L.ext<0.4||L.tx==null) return;
  if(Math.random()<0.6) emit(L.tx,L.ty,1,{col:'255,150,60',smin:20,smax:70,lmin:.2,lmax:.4,zmin:1.5,zmax:3,rise:20});
  if(typeof wIgnite==='function'&&!L.f2pLit){ L.f2pLit=1; try{ wIgnite(L.tx,L.ty,26,1.4); }catch(e){} }
  if(typeof P3!=='undefined'&&typeof P3K!=='undefined'&&P3K.icewall) for(const o of (AREA?(AREA.objs||[]):P3.out)) if(o.p3==='icewall'&&!o.done&&dist(o.x,o.y,L.tx,L.ty)<Math.max(o.w,o.h)*0.6+20) try{ P3K.icewall.blaze(o,dt*1.5); }catch(e){}
}
const f2pFrostFoe=e=>!!e&&(String(e.type).startsWith('f_')||!!e.ice||!!e.snowy);
{ const base=damageEnemy; damageEnemy=function(e,amt,o){
  if(o&&o.src==='whip'&&G&&G.flags&&G.flags.f_emberchain&&f2pFrostFoe(e)) amt*=1.2;
  // Greymane's moth-struck wolves (f_pack) never go below a fifth of their health: then they kneel, waiting for Blaze
  if(e&&e.f2pWolf&&!e.dead&&!e.f2pDown){ const r=base(e,amt,o); if(!e.dead&&e.hp<e.maxHp*0.2){ e.hp=e.maxHp*0.2; f2pWolfDown(e); } return r; }
  if(e&&e.f2pWolf&&e.f2pDown) return 0;
  return base(e,amt,o); }; }
// ---------- the roar: Mumble copies it, the tunnel boulder cracks, the Long Howl shatters little ice
{ const base=doRoar; doRoar=function(free){ base(free); try{ f2pRoar(); }catch(e){ console.error(e); } }; }
function f2pRoar(){
  if(!G||G.mode!=='story') return; F2P.lastRoar=G.time;
  const F=F2P.fight; if(F&&!F.done){ const m=f2pMumbleNpc(); if(m&&dist(m.x,m.y,player.x,player.y)<340) f2pMumbleTry(m); }
  const T=F2P.tunnel; if(T&&!G.found[T.id]&&!AREA&&dist(T.x,T.y,player.x,player.y)<300&&typeof breakBoulder==='function') later(0.25,()=>{ if(!G.found[T.id]) breakBoulder(T); });
  if(G.flags.f_longhowl&&!AREA){ for(const e of G.enemies) if(!e.dead&&!e.boss&&f2pFrostFoe(e)&&dist(e.x,e.y,player.x,player.y)<280){ e.stun=Math.max(e.stun||0,1.8); if(/stalag|bat/.test(e.type)&&!e.boss) damageEnemy(e,e.maxHp*0.5,{src:'roar'}); }
    if(typeof P3!=='undefined') for(const o of P3.out) if(o.p3==='icicle'&&dist(o.x,o.y,player.x,player.y)<280&&o.p3k&&o.p3k.hit) try{ o.p3k.hit(o,'hammer'); }catch(e){} }
}
// ---------- f_mumble: soup, then six Rimehounds and Snarl; Ash roars, Mumble copies, the third try is a real ROAR
function f2pMumbleNpc(){ return G.npcs.find(n=>n.id==='f_mumble'); }
function f2pMumbleTick(dt){
  const m=f2pMumbleNpc(); if(AREA||!m) return;
  if(!f2pAt('f_mumble',2)||G.flags.f_mumble_roar){ if(F2P.fight&&!F2P.fight.done) f2pFightClear(); return; }
  const d=dist(player.x,player.y,m.x,m.y);
  if(!F2P.fight&&d<900){
    const foes=[]; for(let i=0;i<6;i++){ const a=-0.6+i*0.25; const e=f2pFoe('f_rimehound','wolf',m.x+Math.cos(a)*420,m.y+Math.sin(a)*300,{level:15}); e.f2pHound=true; e.leash=1400; if(i===0){ e.elite=true; e.hp*=1.8; e.maxHp=e.hp; e.r*=1.15; e.name='Snarl'; e.f2pSnarl=true; } foes.push(e); }
    F2P.fight={foes,tries:0,done:false,t:0};
    later(0.5,()=>{ const s=foes[0]; if(s&&!s.dead) bubble(s,S('Heh heh heh. Squeaky. Squeeeaky!','Heh heh. Squeaky!'),{who:SPK.f_snarl.name,col:SPK.f_snarl.col,dy:-40}); });
    setBanner(S('ROAR!','ROAR!'),S('Fight the Rimehounds, and when your roar is ready, roar near Mumble so he can copy you.','Fight, then ROAR near Mumble!'),3.4);
  }
  const F=F2P.fight; if(!F||F.done) return;
  F.t+=dt;
  if(d>1700){ f2pFightClear(); return; }
  const alive=F.foes.filter(e=>!e.dead);
  if(!alive.length&&!F.allDown){ F.allDown=true; if(F.tries>0) f2pMumbleWin(m); else bubble(m,S('(squeak) Now the big noise? Please?','(squeak) Now the big roar? Please?'),{who:SPK.f_mumble.name,col:SPK.f_mumble.col,dy:-104}); }
}
function f2pMumbleTry(m){
  const F=F2P.fight; if(!F||F.done) return; F.tries++;
  if(F.allDown){ f2pMumbleWin(m); return; }
  if(F.tries===1){ bubble(m,S('(squeak!)','(squeak!)'),{who:SPK.f_mumble.name,col:SPK.f_mumble.col,dy:-104}); for(const e of F.foes) if(!e.dead&&Math.random()<0.5) bubble(e,S('Heh heh!','Heh heh!'),{dy:-30,dur:1.2}); }
  else if(F.tries===2){ bubble(m,S('(SQUEAK!)','(SQUEAK!)'),{who:SPK.f_mumble.name,col:SPK.f_mumble.col,dy:-104}); shake(2); }
  else f2pMumbleWin(m);
}
function f2pMumbleWin(m){
  const F=F2P.fight; if(!F||F.done) return; F.done=true; F2P.mumbleRoarT=G.time;
  later(0.35,()=>{ bubble(m,S('ROOOOAAAAAR!','ROOOOAAAAAR!'),{who:SPK.f_mumble.name,col:SPK.f_mumble.col,dy:-108,dur:2.6}); shake(16); flashA=0.25; flashCol='200,230,255'; SFX.play('roar');
    G.rings.push({x:m.x,y:m.y,rad:20,max:420,speed:900,thick:40,owner:'none',hit:new Set(),dmg:0});
    for(const e of F.foes) if(!e.dead){ e.dead=true; emit(e.x,e.y,10,{col:'230,240,255',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); }
    later(0.9,()=>{ f2pFlag('f_mumble_roar'); setBanner(S('Mumble ROARED!','Mumble ROARED!'),S('Every Rimehound left runs away, yelping. Talk to Mumble.','The wolves ran away! Talk to Mumble.'),3); }); });
}
function f2pFightClear(){ const F=F2P.fight; if(F) for(const e of F.foes) if(!e.dead) e.dead=true; F2P.fight=null; }
// ---------- f_dogs: five dogs, five tricks
function f2pDog5Iced(){ return F2P.dog5Ice?!G.found[F2P.dog5Ice.id]&&!F2P.dog5Ice.done:!G.flags.f_dog5_free; }
function f2pDogsHome(){ return F2P_DOGS.filter(D=>G.flags[D.flag]).length; }
function f2pDogNext(){ const near=[]; F2P_DOGS.forEach((D,i)=>{ if(!G.flags[D.flag]) near.push([dist(player.x,player.y,D.x,D.y),i]); }); near.sort((a,b)=>a[0]-b[0]); return near.length?'lm:f_lm_dog'+(near[0][1]+1):'npc:f_hask'; }
function f2pDogAct(o,i){
  const D=F2P_DOGS[i], nm=simplify(D.name);
  if(D.how==='camp'&&G.enemies.some(e=>!e.dead&&e.hp>0&&dist(e.x,e.y,o.x,o.y)<520)){ f2pSay([f2pN(`The Snowgobs have tied ${nm} up as a snowman, with a carrot for a nose. She looks furious. Chase the Snowgobs off first!`,`The Snowgobs made ${nm} a snowman! Chase them off first!`)]); return; }
  if(D.how==='claws'&&!f2pHigh(o,'claws')){ f2pSay([f2pN(`${nm} is up on a ledge on the cliff, wagging and whining. You'd have to climb.`,`${nm} is on a high ledge. Climb up!`)]); return; }
  if(D.how==='wind'&&!f2pHigh(o,'windride')){ f2pSay([f2pN(`${nm} is out on a floating isle, too far to jump. Only the wind goes there.`,`${nm} is on a sky isle. Ride the wind!`)]); return; }
  if(D.how==='ice'&&f2pDog5Iced()){ f2pSay([f2pN(`${nm} is frozen in a block of clear ice, mid-wag. Only Blaze will melt it.`,`${nm} is frozen in ice. Use Blaze!`)]); return; }
  f2pDogFound(i);
}
function f2pDogFound(i){
  const D=F2P_DOGS[i]; if(G.flags[D.flag]) return;
  G.flags[D.flag]=1; SFX.play('pickup');
  const run={i,x:D.x,y:D.y,t:0,face:angTo(D.x,D.y,F2P_KENNEL[0],F2P_KENNEL[1])}; F2P.dogs.push(run);
  bubble({x:D.x,y:D.y},S('Woof!','Woof!'),{who:simplify(D.name),col:'#e8d8c0',dy:-30});
  setBanner(S(`${simplify(D.name)} is going home!`,`${simplify(D.name)} runs home!`),S(`${f2pDogsHome()} of 5 sled dogs found.`,`${f2pDogsHome()} of 5 dogs.`),2.4);
  questPoke(); saveGame();
}
function f2pDogTick(dt){
  if(!AREA&&!F2P.dog5Ice&&f2pAt('f_dogs',0)&&!G.flags.f_dog5&&!G.flags.f_dog5_free){ const D=F2P_DOGS[4]; if(f2pHeat('dog5',D.x,D.y-10,22,1.2,dt)){ G.flags.f_dog5_free=1; shake(2); emit(D.x,D.y-14,20,{col:'220,240,255',smin:40,smax:160,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); f2pDogFound(4); } }
  for(const r of F2P.dogs){ r.t+=dt; const sp=260*dt; r.x+=Math.cos(r.face)*sp; r.y+=Math.sin(r.face)*sp; }
  F2P.dogs=F2P.dogs.filter(r=>r.t<2.6);
}
function f2pSledMenu(from){
  if(!G.flags.f_sledline){ f2pSay([f2pN(`A sled post with an empty harness. No dogs. A sign: Back soon. Hask.`,`An empty sled post. No dogs.`)]); return; }
  const opts=[]; for(const k in F2P_SLED){ if(k===from) continue; const P=F2P_SLED[k]; opts.push({t:S(`Mush! To ${simplify(P.n)}`,`To ${simplify(P.n)}`),fn:()=>later(0.2,()=>{ if(typeof mapTravel==='function') mapTravel(P.x+40,P.y+50,{banner:P.n}); else { player.x=P.x; player.y=P.y+50; G.fade=1; } })}); }
  opts.push({t:S('Not right now','Not right now'),then:[['f_dog',S(`Woof?`,`Woof?`)]]});
  f2pSay([f2pN(`Five dogs wag in their harness. Pepper bites the sled. Lovingly.`,`Five dogs wag. Pepper bites the sled.`),ch('ash',S('Where to?','Where to?'),opts)]);
}
// ---------- f_juniper: the note, the floe, the escort across the Floe Field
function f2pTentAct(o){
  if(!G.flags.f_juniper_found&&f2pR('f_kindle')&&!f2pQ('f_juniper')){
    f2pSay([f2pN(`An empty tent full of rolled-up maps. Pinned to the flap, a note:`,`An empty tent full of maps. A note says:`),f2pN(`"Gone mapping the Shiversea. Back soon. If not back soon, please send a dragon. (Juniper)"`,`"Gone mapping the sea. If not back, send a dragon. (Juniper)"`),f2pL('ash',`...I'm a dragon.`,`I'm a dragon.`)],()=>{ if(!G.quests.f_juniper&&qAvail('f_juniper')) startQuest('f_juniper'); });
    return; }
  if(o&&o.f2pMerged&&!G.flags.f_juniper_home) return false;
  f2pSay([f2pN(G.flags.f_juniper_home?`Juniper's Map Tent. Maps on every wall. On the biggest one, the Floe Field, a little dragon is drawn carrying a girl over the ice. You didn't carry her. It's a nice drawing anyway.`:`An empty tent full of rolled-up maps. It smells of ink and cold.`,G.flags.f_juniper_home?`Juniper's tent. A map shows a dragon carrying her. Nice.`:`An empty tent full of maps.`)]);
}
const F2P_FLOES=[[1950,42800],[1600,42600],[2250,43050]];
function f2pEscortStart(){
  if(!f2pAt('f_juniper',1)||F2P.esc) return;
  const s=F2P_SPOT.juniper_floe, n=mkNPC(SPECIAL.juniper,s[0],s[1]); n.r=10;
  F2P.esc={n,hits:0,spawned:{},gobs:[],balls:[],t:0};
  setupNPCs(); setBanner(S('Lead Juniper to the shore','Lead Juniper to shore'),S('She follows you. Keep the Snowgobs and their snowballs off her!','Keep the snowballs off her!'),3);
}
function f2pEscortReset(msg){ const E=F2P.esc; if(!E) return; const s=F2P_SPOT.juniper_floe; E.n.x=s[0]; E.n.y=s[1]; E.hits=0; E.balls=[]; if(msg) bubble(E.n,msg,{who:'Juniper',col:'#a0e0b0',dy:-34}); }
function f2pEscortCancel(){ const E=F2P.esc; if(!E) return; for(const g of E.gobs) if(!g.dead) g.dead=true; F2P.esc=null; if(G&&G.npcs) setupNPCs(); }
function f2pEscortTick(dt){
  const E=F2P.esc; if(!E) return;
  if(AREA||curMap()!==2||!f2pAt('f_juniper',1)){ f2pEscortCancel(); return; }
  E.t+=dt; const n=E.n, p=player;
  const tx=p.x-Math.cos(p.facing||0)*46, ty=p.y-Math.sin(p.facing||0)*46, d=dist(n.x,n.y,tx,ty);
  if(d>12){ const sp=Math.min(230,40+d*2.2)*dt, a=angTo(n.x,n.y,tx,ty); n.x+=Math.cos(a)*Math.min(sp,d); n.y+=Math.sin(a)*Math.min(sp,d); n.face=a; n.moving=true; } else n.moving=false; n.t+=dt;
  if(dist(n.x,n.y,p.x,p.y)>900) f2pEscortReset(S('Ash! Wait for me! I ran back!','Wait for me!'));
  // Snowgobs on the floes bowl snowballs at her
  F2P_FLOES.forEach((f,i)=>{ if(E.spawned[i]||Math.min(dist(n.x,n.y,f[0],f[1]),dist(p.x,p.y,f[0],f[1]))>520) return; E.spawned[i]=1; for(let k=0;k<2;k++){ const g=f2pFoe('f_snowgob','kobold',f[0]+rand(-70,70),f[1]+rand(-50,50),{}); g.f2pBowl=rand(0.6,1.6); E.gobs.push(g); } });
  for(const g of E.gobs){ if(g.dead) continue; g.f2pBowl-=dt; if(g.f2pBowl<=0&&dist(g.x,g.y,n.x,n.y)<460){ g.f2pBowl=rand(2.2,3.0); const a=angTo(g.x,g.y,n.x,n.y); E.balls.push({x:g.x,y:g.y,vx:Math.cos(a)*250,vy:Math.sin(a)*250,t:0}); } }
  for(const b of E.balls){ b.t+=dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(dist(b.x,b.y,p.x,p.y)<26){ b.dead=true; emit(b.x,b.y,8,{col:'245,250,255',glow:false,smin:30,smax:110,lmin:.2,lmax:.4,zmin:1,zmax:2}); continue; }
    if(dist(b.x,b.y,n.x,n.y)<16){ b.dead=true; emit(b.x,b.y,10,{col:'245,250,255',glow:false,smin:30,smax:120,lmin:.2,lmax:.5,zmin:1,zmax:2.5});
      if(diffIdx!==0){ E.hits++; if(E.hits>=3){ f2pEscortReset(S(`I'm fine! I'm fine! Really!`,`I'm fine! Really!`)); setBanner(S('Juniper ran back to her floe','Juniper ran back'),S('Lead her again, and stand between her and the snowballs.','Try again. Block the snowballs!'),2.6); } else bubble(n,pick([S('Ow! Cold!','Ow! Cold!'),S('Hey! My maps!','My maps!')]),{who:'Juniper',col:'#a0e0b0',dy:-34}); } }
    if(b.t>2.4) b.dead=true; }
  E.balls=E.balls.filter(b=>!b.dead);
  if(dist(n.x,n.y,2500,43350)<260||(G.flags.f_juniper_found&&!f2pNearSea(n.x,n.y)&&E.t>4&&dist(n.x,n.y,2500,43350)<700)){
    for(const g of E.gobs) if(!g.dead) g.dead=true; F2P.esc=null;
    G.flags.f_juniper_home=1; questPoke(); setupNPCs(); saveGame();
    f2pSay([f2pL('juniper',`Land! Glorious land! It doesn't move! I'm going to map it. Later. After a bath. I'll meet you at my tent in Hearthold.`,`Land! It doesn't move! Meet me at my tent in Hearthold.`)]);
  }
}
function f2pNearSea(x,y){ try{ const o={}; T(x,y,o); return !!(o.water||o.ice); }catch(e){ return false; } }
// ---------- f_pack: Greymane on the Whitepass, three moth-struck wolves or three lost pups
function f2pPackTick(dt){
  if(AREA||curMap()!==2) return;
  if(G.choices.greymane&&!G.quests.f_pack&&f2pR('f_pass')&&scene==='play'&&!DLG&&dist(player.x,player.y,3600,50300)<500&&!F2P.packMeet){
    F2P.packMeet=true; runDialogue(STORY.f_pack_meet,()=>{ scene='play'; startQuest('f_pack'); setupNPCs(); saveGame(); }); return; }
  if(!f2pAt('f_pack',0)) return;
  if(G.choices.greymane==='ally'){
    F2P_WOLF.forEach((W,i)=>{ if(G.flags[W.flag]) return; const live=G.enemies.find(e=>!e.dead&&e.f2pWolf===i+1);
      if(!live&&dist(player.x,player.y,W.x,W.y)<800&&!(F2P['wolfT'+i]>G.time)){ F2P['wolfT'+i]=G.time+4;
        const e=f2pFoe('f_rimehound','wolf',W.x,W.y,{level:16,elite:true}); e.hp*=2; e.maxHp=e.hp; e.r*=1.2; e.f2pWolf=i+1; e.name=simplify(W.name); e.tint='170,120,230';
        for(let k=0;k<2;k++){ const f=f2pFoe('f_rimehound','wolf',W.x+rand(-120,120),W.y+rand(-90,90),{level:15}); f.f2pPackmate=i+1; }
        bubble(e,S('Grrrr... (its eyes glow purple)','Grrr... (purple eyes)'),{who:simplify(W.name),col:'#c8a8f0',dy:-36}); }
      if(live&&live.f2pDown){ live.stun=Math.max(live.stun,0.5); if(f2pHeat('wolf'+i,live.x,live.y,live.r+8,1,dt)) f2pWolfFree(live,i); else if(G.time-live.f2pDownT>16){ live.f2pDown=false; live.hp=live.maxHp*0.5; live.stun=0; bubble(live,S('Grrr! (it shakes itself awake)','Grrr!'),{dy:-36}); } } });
  } else {
    const P=F2P_PUP[0]; if(!G.flags[P.flag]&&dist(player.x,player.y,P.x,P.y)<130){ const mv=Math.hypot(player.vx||0,player.vy||0)>8||dist(player.x,player.y,F2P.stareX||0,F2P.stareY||0)>3; if(mv){ F2P.stareT=0; F2P.stareX=player.x; F2P.stareY=player.y; } else { F2P.stareT=(F2P.stareT||0)+dt; if(F2P.stareT>3){ F2P.stareT=0; f2pPupFound(0,S('The snow monkeys blink first. They let go of the pup, grumbling.','The monkeys blink first! They let the pup go.')); } } }
    const Q=F2P_PUP[1]; if(!G.flags[Q.flag]&&f2pHeat('pup2',Q.x,Q.y-6,26,0.5,dt)) f2pPupFound(1,S('The snowdrift melts away. A fluffy grey pup sneezes out of it.','The snow melts. A pup sneezes out!'));
  }
}
function f2pWolfDown(e){ e.f2pDown=true; e.f2pDownT=G.time; e.stun=Math.max(e.stun||0,0.6); bubble(e,S('(the wolf sinks into the snow, the purple flickering in its eyes)','(the wolf lies down. Use Blaze!)'),{dy:-36,dur:2.4}); setBanner(S('Blaze the purple out of it!','Use Blaze on it!'),S('Hold your fire breath until it burns blue.','Hold fire until it is blue.'),2.4); }
function f2pWolfFree(e,i){
  const W=F2P_WOLF[i]; e.dead=true; emit(e.x,e.y,24,{col:'190,150,240',smin:40,smax:180,lmin:.4,lmax:.8,zmin:1.5,zmax:3.5}); SFX.play('shrine');
  for(const f of G.enemies) if(!f.dead&&f.f2pPackmate===i+1){ f.dead=true; emit(f.x,f.y,8,{col:'230,240,255',glow:false,smin:30,smax:100,lmin:.3,lmax:.5,zmin:1,zmax:2}); }
  G.flags[W.flag]=1; gainXp(120); bubble({x:e.x,y:e.y},S('Awoo?','Awoo?'),{who:simplify(W.name),col:'#cfe0f0',dy:-30});
  setBanner(S(`${simplify(W.name)} is free!`,`${simplify(W.name)} is free!`),S(`${F2P_WOLF.filter(w=>G.flags[w.flag]).length} of 3 wolves. Its eyes are wolf-yellow again.`,`${F2P_WOLF.filter(w=>G.flags[w.flag]).length} of 3 wolves free.`),2.6); questPoke(); saveGame();
}
function f2pPupAct(o,i){
  const P=F2P_PUP[i];
  if(P.how==='stare'){ f2pSay([f2pN(`A grey pup sleeps in the warm water, hugged between two snow monkeys. They hug it tighter when you come close and stare at you. Hard.`,`Two snow monkeys hug a sleeping pup. They stare at you.`),['tove',S(`A staring contest. Don't move. Don't blink. Don't sneeze.`,`A staring contest! Stand very still.`)]]); return; }
  if(P.how==='drift'){ f2pSay([f2pN(`A little grey nose pokes out of a snowdrift and sneezes. The drift is frozen hard.`,`A nose pokes out of the snow. It's frozen hard.`),['tove',S(`Melt it. Gently. Well. Blue, but gently.`,`Melt it with Blaze.`)]]); return; }
  if(!f2pHigh(o,'dbljump')){ f2pSay([f2pN(`A pup is stuck up on the pressure ridge, yipping. It's a big hop up.`,`A pup is up on the ridge. A big hop!`)]); return; }
  f2pPupFound(2,S('The pup licks your nose and jumps into your arms.','The pup jumps into your arms.'));
}
function f2pPupFound(i,line){ const P=F2P_PUP[i]; if(G.flags[P.flag]) return; G.flags[P.flag]=1; SFX.play('pickup'); bubble({x:P.x,y:P.y},S('Yip!','Yip!'),{who:S('a wolf pup','a wolf pup'),col:'#cfe0f0',dy:-24}); setBanner(S('A pup!','A pup!'),line,2.6); F2P.dogs.push({i:-1,x:P.x,y:P.y,t:0,face:angTo(P.x,P.y,3600,50300),pup:true}); questPoke(); saveGame(); }
function f2pPackNext(){ if(G.choices.greymane==='home'){ for(let i=0;i<3;i++) if(!G.flags[F2P_PUP[i].flag]) return 'lm:f_lm_pup'+(i+1); return 'npc:f_greymane'; } for(const W of F2P_WOLF) if(!G.flags[W.flag]){ const e=G.enemies.find(q=>!q.dead&&q.f2pWolf&&F2P_WOLF[q.f2pWolf-1]===W); return e?`xy:${Math.round(e.x)},${Math.round(e.y)}`:`xy:${W.x},${W.y}`; } return 'npc:f_greymane'; }
// ---------- f_rime and f_warm: Rimeholm's neighbors, Rasmus's thick frost, the count to twelve
function f2pRimeNext(){ let best=null, bd=1e18; for(const id of F2P_RIME){ if(f2pThawed(id)) continue; const o=f2pFrozenObj(id); const x=o?o.x:(F2P_FROZEN.find(d=>d.id===id)||{}).x, y=o?o.y:(F2P_FROZEN.find(d=>d.id===id)||{}).y; const d=dist2(player.x,player.y,x,y); if(d<bd){ bd=d; best=`xy:${Math.round(x)},${Math.round(y)}`; } } return best||'npc:f_ylva'; }
function f2pNearestFrozen(){ if(typeof P3==='undefined') return null; let best=null, bd=1e18; for(const o of mapList(P3.out,2)){ if(o.p3!=='frozen'||o.st!=='ice') continue; if(o.f2pId==='f_rasmus'&&!f2pRasmusReady()) continue; const d=dist2(player.x,player.y,o.x,o.y); if(d<bd){ bd=d; best=o; } } return best?`xy:${Math.round(best.x)},${Math.round(best.y)}`:'npc:f_toastwhistle'; }
function f2pThawTick(dt){
  const F=G.flags;
  // the same thaw under both spellings of its flag (the bible's f_thaw_f_<id> and p3_frost's default f_thaw_<id>)
  for(const d of F2P_FROZEN){ const a='f_thaw_'+d.id, b='f_thaw_'+String(d.id).replace(/^f_/,''); if(F[a]&&!F[b]) F[b]=1; else if(F[b]&&!F[a]){ F[a]=1; questPoke(); } }
  if((F.f_frozen_n|0)>=12&&!F.f_warm12) f2pFlag('f_warm12');
  // Rasmus's frost is too thick until Ylva and the six are warm
  const R=f2pFrozenObj('f_rasmus');
  if(R&&R.st==='ice'&&!f2pRasmusReady()&&R.heat>0.1){ R.heat=0; if(!(F2P.rasT>G.time)){ F2P.rasT=G.time+5; ftext(R.x,R.y-60,simplify(S('Too thick! Thaw the others first.','Too thick! Thaw the others first.')),'#dff4ff',13); } }
  // the whole village wakes when Rimeholm is warm again; every Frozen Folk wakes when the Snow Mother stays
  if(f2pQ('f_rime')&&!F.f_rime_gen) { F.f_rime_gen=1; f2pThawMany(o=>o.f2pGen); }
  if(G.choices.f_glaciar_home==='stay'&&!F.f_allthawed){ F.f_allthawed=1; f2pThawMany(o=>true); }
  // Ylva offers One Thaw at a Time right after she wakes (ACT3 10.5)
  if(F.f_ylva&&!G.quests.f_rime&&!F.f_rime_offered&&!(G.declined&&G.declined.f_rime)&&scene==='play'&&!DLG&&!AREA){ const y=G.npcs.find(n=>n.id==='f_ylva'); if(y&&dist(y.x,y.y,player.x,player.y)<700&&qAvail('f_rime')){ F.f_rime_offered=1; later(0.6,()=>f2pCalm(()=>{ if(!G.quests.f_rime&&qAvail('f_rime')) offerQuest('f_rime'); })); } }
}
function f2pThawMany(fn){ if(typeof P3==='undefined'||typeof p3ThawStart!=='function') return 0; let k=0; for(const o of P3.out){ if(o.p3!=='frozen'||o.st!=='ice'||!fn(o)) continue; try{ Object.defineProperty(o,'lines',{value:null,writable:true,configurable:true}); }catch(e){} if(k>2) o.line=null; const j=k++; later(0.4+j*0.35,()=>{ if(o.st==='ice') try{ p3ThawStart(o); }catch(e){} }); } return k; }
// ACT3 6.12 fThawAll (the Snow Mother's breath): every Frozen Folk left outdoors shivers awake, no dialogues (the
// story may call it; it also runs by itself once G.choices.f_glaciar_home==='stay'). Returns how many.
function f2pThawAll(){ G.flags.f_allthawed=1; return f2pThawMany(()=>true); }
// Juniper's North Maps: the Act III dungeons' rooms show on their maps, and the map screen opens around the secrets
const F2P_SECRETS=[[1600,42600],[3800,49400],[4600,48300],[8200,47400],[1200,49600],[4450,45040],[11000,41700],[12150,47900]];
function f2pNorthMaps(){
  G.flags.f_northmaps=1;
  try{ if(typeof DUNGEONS!=='undefined') for(const id of ['f_maze','f_sky','f_deep','f_dread']){ const D=DUNGEONS[id]; G.found['dmap_'+((D&&D.save)||id)]=true; } }catch(e){}
  for(const [x,y] of F2P_SECRETS) fogReveal(x,y,420);
  for(const k of ['f_glacier','f_skyreach','f_stonehorn','f_dreadgate']) if(POI[k]) fogReveal(POI[k].x,POI[k].y,600);
  if(typeof P3!=='undefined') for(const o of mapList(P3.out,2)) if(o.p3==='frozen'&&o.st==='ice') fogReveal(o.x,o.y,260);
  setBanner(S('Juniper’s North Maps','Juniper’s North Maps'),S('Your map now shows the four great doors, the secrets of the north and every frozen person. Inside the dungeons, the rooms are drawn in.','Your map shows doors, secrets and frozen folk!'),3.8);
}
// ---------- Duchess on Mount Dread (after the Glaciar fight) and a few things that happen near places
// she is drawn on the spike from the end of the fight until the act ends (x2_story may play her lines right after the
// outro); walking up to her plays STORY.f_duchess if nobody has yet
function f2pDuchessUp(){ return !!G.choices.f_glaciar&&!G.flags.f_done; }
function f2pPlacesTick(){
  if(AREA||curMap()!==2||scene!=='play'||DLG) return;
  if(f2pDuchessUp()&&!G.flags.f_duchess&&dist(player.x,player.y,7300,40820)<170) runDialogue(STORY.f_duchess,()=>{ scene='play'; if(!G.flags.f_duchess){ G.flags.f_duchess=1; addCoins(30,player.x,player.y); gainXp(60); } saveGame(); });
  // the Singing Stone plays when Ash rides a wind ribbon past it
  if(f2pOn('f_song')&&!G.flags.f_v2&&typeof WIND!=='undefined'&&WIND.ride()&&dist(player.x,player.y,F2P_SING[0],F2P_SING[1])<230&&!(F2P.stoneT>G.time-4)) f2pStoneTry(true);
  // the dream's sung verse (dr_f_auntie 'sing') counts as verse one
  if(f2pOn('f_song')&&!G.flags.f_v1&&G.flags.dr_f_auntie==='sing') f2pVerseGot(1);
}
// the Bomb-o-Matic and the forge want blue fire: two seconds of the jet (inside their houses, or the outdoor stand-ins)
function f2pBlazeTick(dt){
  if(AREA&&AREA.kind==='house'){
    if(AREA.id==='h_f_mags'&&f2pAt('f_bombs',2)&&!G.flags.f_bombs_lit){ const o=AREA.objs.find(q=>q.id==='f_bomatic'); if(o&&f2pHeat('bomatic',o.x,o.y-10,30,2,dt)) f2pBomaticLit(); }
    if(AREA.id==='h_f_gunnhild'&&f2pAt('f_forge',0)&&!G.flags.f_forge_lit){ const o=AREA.objs.find(q=>q.id==='f_forge'); if(o&&f2pHeat('forge',o.x,o.y-10,32,2,dt)) f2pForgeLit(); }
    return; }
  if(f2pAt('f_bombs',2)&&!G.flags.f_bombs_lit){ const o=f2pLMid('f_lm_bomatic'); if(o&&!o.hidden()&&f2pHeat('bomatic',o.x,o.y-10,30,2,dt)) f2pBomaticLit(); }
  if(f2pAt('f_forge',0)&&!G.flags.f_forge_lit){ const o=f2pLMid('f_lm_forge'); if(o&&!o.hidden()&&f2pHeat('forge',o.x,o.y-10,32,2,dt)) f2pForgeLit(); }
}
// Pim's cocoa warms Ash up by itself when he is badly hurt (like Granny Oona's biscuits)
function f2pCocoaTick(){
  if(!(G.items.f_cocoa>0)||player.dead||player.hp>player.maxHp*0.35||(F2P.cocoaT>G.time)||(typeof itemBossTake==='function'&&!itemBossTake('f_cocoa'))) return;
  F2P.cocoaT=G.time+4; G.items.f_cocoa--; if(!G.items.f_cocoa) delete G.items.f_cocoa; heal(player.maxHp*0.3); SFX.play('pickup');
  ftext(player.x,player.y-44,simplify(S('Hot cocoa! A hug you can drink.','Hot cocoa!')),'#ffcf8a',13);
}

// ---------- minigame (a9g_mini.js format): Elka's Long Sled. Eight hoops from the Windscour Shrine down to Soren's
// Sled Hill; Elka sleds the hoop line; two wind ribbons (only blowing during the race) are the shortcuts.
const F2P_HOOPS=[[10060,47520],[10000,47800],[9900,48080],[9500,48250],[9100,48400],[8700,48550],[8300,48500],[7960,48290]];
function f2pOpen(x,y){ try{ return !playerBlocked(x,y); }catch(e){ return true; } }
MINI.f_sledrace={
  start(){
    const hs=F2P_HOOPS.map(([x,y])=>{ if(f2pOpen(x,y)) return {x,y}; for(let r=30;r<200;r+=30) for(let a=0;a<TAU;a+=0.7){ const px=x+Math.cos(a)*r, py=y+Math.sin(a)*r; if(f2pOpen(px,py)) return {x:px,y:py}; } return {x,y}; });
    const sx=F2P_SPOT.elka_race[0], sy=F2P_SPOT.elka_race[1];
    let L=dist(sx,sy,hs[0].x,hs[0].y); for(let i=1;i<hs.length;i++) L+=dist(hs[i-1].x,hs[i-1].y,hs[i].x,hs[i].y);
    const tE=diffIdx===0?34:diffIdx===2?20:25;
    return {hs,i:0,L,sp:L/tE,ek:0,wait:1.4,sx,sy,limit:diffIdx===0?95:75,music:'arena'};
  },
  update(M,dt){
    const h=M.hs[M.i];
    if(h&&dist(player.x,player.y,h.x,h.y)<84){ M.i++; SFX.play('pickup'); emit(h.x,h.y-20,14,{col:'255,220,120',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
      if(M.i>=M.hs.length){ miniEnd(true,S('You beat Elka!','You beat Elka!'),S('Talk to Elka on Soren’s Sled Hill.','Talk to Elka.')); return; } }
    if(M.wait>0) M.wait-=dt; else M.ek+=M.sp*dt;
    const n=G.npcs.find(q=>q.id==='elka'); if(n){ const p=f2pRaceAt(M,M.ek); n.x=p.x; n.y=p.y; n.face=p.a; n.moving=M.wait<=0; }
    if(M.ek>=M.L+20) miniEnd(false,S('Elka wins!','Elka wins!'),S('So close! Talk to Elka at the Windscour Shrine for a rematch.','Talk to Elka to race again.'));
    else if(M.t>M.limit) miniEnd(false,S('Too slow!','Too slow!'),S('The snow got bored. Talk to Elka for another go.','Talk to Elka to try again.'));
  },
  end(){ if(G.npcs) setupNPCs(); },
  target:M=>M.hs[Math.min(M.i,M.hs.length-1)],
  hud:M=>`${simplify(S('Sled race! Hoop','Hoop'))} ${Math.min(M.i+1,8)}/8 · ${simplify(S('Elka','Elka'))} ${Math.round(Math.min(1,M.ek/M.L)*100)}% · ${Math.max(0,Math.ceil(M.limit-M.t))}s`,
  draw(M,t){ M.hs.forEach((h,i)=>{ if(inView(h.x,h.y,80)) f2pDrawHoop(h.x,h.y,i===M.i,i<M.i,t,i); }); const p=f2pRaceAt(M,M.ek); if(inView(p.x,p.y,60)) f2pDrawSled(p.x,p.y+6,p.a); }
};
function f2pRaceAt(M,s){ const pts=[{x:M.sx,y:M.sy}].concat(M.hs); let acc=0; for(let i=1;i<pts.length;i++){ const d=dist(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y); if(acc+d>=s){ const u=(s-acc)/d; return {x:lerp(pts[i-1].x,pts[i].x,u),y:lerp(pts[i-1].y,pts[i].y,u),a:angTo(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y)}; } acc+=d; } const L=pts[pts.length-1]; return {x:L.x,y:L.y,a:Math.PI}; }
// the two shortcut ribbons, built with the map (they only blow during the race)
{ const M=MAPS[2]; if(M){ const b0=M.build; M.build=function(B){ if(b0) b0.call(this,B); try{ if(typeof WIND!=='undefined'){ const on=()=>!!(G.mini&&G.mini.kind==='f_sledrace');
  WIND.stream({id:'f_rib_sled1',pts:[[10090,47420],[10010,47790],[9900,48080],[9500,48250]],w:60,on});
  WIND.stream({id:'f_rib_sled2',pts:[[9150,48390],[8700,48550],[8300,48500],[8020,48320]],w:60,on}); } }catch(e){ console.error('x2_people ribbons',e); } }; } }

// ---------- drawings (world coordinates, small and cheap: static parts are cached Storybook sprites)
const F2P_INK='rgba(28,17,12,.85)';
function f2pSh(x,y,rx,ry){ ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); }
const f2pSpr=(key,R,draw)=>typeof sbSprite==='function'?sbSprite('f2p_'+key,R,draw):spriteOf(R,draw);
function f2pDrawCrate(o){
  if(o.hidden&&o.hidden()) return;
  const sp=f2pSpr('crate',22,g=>{ g.fillStyle='#8a5a2a'; g.fillRect(-16,-14,32,28); g.fillStyle='#a8743a'; g.fillRect(-16,-14,32,8); g.strokeStyle='#5a3a1a'; g.lineWidth=2.2; g.strokeRect(-16,-14,32,28); g.beginPath(); g.moveTo(-16,-6); g.lineTo(16,14); g.stroke();
    g.fillStyle='#e8c03a'; g.font='800 7px sans-serif'; g.textAlign='center'; g.fillText('BOOM',2,4); g.fillStyle='#c83a2a'; g.beginPath(); g.arc(-9,8,3,0,TAU); g.fill(); });
  f2pSh(o.x,o.y+12,18,6); drawSprite(sp,o.x,o.y-2,1,o.drop?0.25:0);
  if(!o.drop&&Math.sin(G.time*3)>0.6){ ctx.fillStyle='rgba(255,255,255,.75)'; ctx.font=`800 11px ${UIF}`; ctx.textAlign='center'; ctx.fillText('!',o.x+20,o.y-22); }
}
function f2pDrawBell(o){
  const sp=f2pSpr('bell',26,g=>{ g.fillStyle='#5a4a3a'; g.fillRect(-20,-26,40,5); g.fillStyle='#b8902a'; g.beginPath(); g.moveTo(-12,-20); g.quadraticCurveTo(-13,4,-19,10); g.lineTo(19,10); g.quadraticCurveTo(13,4,12,-20); g.closePath(); g.fill();
    g.fillStyle='#e0c060'; g.beginPath(); g.ellipse(-5,-6,3,9,0,0,TAU); g.fill(); g.fillStyle='#6a4a1a'; g.beginPath(); g.arc(0,12,3.6,0,TAU); g.fill(); });
  drawSprite(sp,o.x,o.y-26,1,G.time-(F2P.bellT||-9)<1.5?Math.sin(G.time*14)*0.25:0);
  if(!G.flags.f_v1){ ctx.fillStyle='rgba(220,240,255,.55)'; ctx.beginPath(); ctx.ellipse(o.x,o.y-20,18,8,0,0,Math.PI); ctx.fill(); }
}
function f2pDrawStone(o){
  const sp=f2pSpr('stone',30,g=>{ g.fillStyle='#d8d4cc'; g.beginPath(); g.moveTo(-14,22); g.quadraticCurveTo(-18,-6,-6,-26); g.quadraticCurveTo(8,-30,14,-10); g.quadraticCurveTo(18,8,14,22); g.closePath(); g.fill();
    g.fillStyle='#e0b84a'; g.fillRect(-15,-2,30,3); g.fillStyle='#4a4a58'; for(const [x,y] of [[-6,-16],[4,-12],[-2,-2],[6,4],[-8,8],[2,14]]){ g.beginPath(); g.ellipse(x,y,2.6,3.6,0,0,TAU); g.fill(); } });
  f2pSh(o.x,o.y+18,16,5); drawSprite(sp,o.x,o.y-6,1,0);
  if(G.flags.f_v2||G.time-(F2P.stoneT||-9)<4){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y-10,40,'255,220,140',0.25+0.1*Math.sin(G.time*3)); ctx.restore(); }
}
function f2pDrawDog(x,y,face,t,run,fur,ear,s){
  s=s||1; ctx.save(); ctx.translate(x,y); const fl=Math.cos(face)<0; if(fl) ctx.scale(-1,1); ctx.scale(s,s);
  const b=run?Math.abs(Math.sin(t*14))*3:Math.sin(t*3)*0.6;
  ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0,2,13,4,0,0,TAU); ctx.fill();
  ctx.strokeStyle=F2P_INK; ctx.lineWidth=1.6; ctx.fillStyle=fur;
  for(const lx of [-7,-3,5,8]){ ctx.fillRect(lx-1.4,-6-b*0.3,2.8,7); }
  ctx.beginPath(); ctx.ellipse(0,-9-b,11,6,0,0,TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10,-11-b); ctx.quadraticCurveTo(-17,-20-b+Math.sin(t*9)*3,-14,-14-b); ctx.stroke();
  ctx.fillStyle=fur; ctx.beginPath(); ctx.ellipse(10,-15-b,6,5.4,0,0,TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle=ear; ctx.beginPath(); ctx.moveTo(7,-19-b); ctx.lineTo(8,-25-b); ctx.lineTo(11,-19-b); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#1a1410'; ctx.beginPath(); ctx.arc(15.6,-14.6-b,1.5,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11.6,-16.4-b,1.1,0,TAU); ctx.fill();
  ctx.restore();
}
function f2pDrawDogLM(o){
  if(o.hidden&&o.hidden()) return; const D=F2P_DOGS[o.i], t=G.time;
  if(D.how==='camp'){ ctx.save(); ctx.fillStyle='#f6faff'; ctx.strokeStyle=F2P_INK; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(o.x,o.y-8,13,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(o.x,o.y-26,9,0,TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#e8762a'; ctx.beginPath(); ctx.moveTo(o.x+6,o.y-27); ctx.lineTo(o.x+16,o.y-25); ctx.lineTo(o.x+6,o.y-23); ctx.closePath(); ctx.fill(); ctx.fillStyle='#1a1410'; ctx.beginPath(); ctx.arc(o.x+3,o.y-29,1.4,0,TAU); ctx.fill();
    ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(o.x,o.y-8,14,4,0,0,TAU); ctx.stroke(); ctx.fillStyle=D.ear; ctx.beginPath(); ctx.moveTo(o.x-5,o.y-33); ctx.lineTo(o.x-4,o.y-39); ctx.lineTo(o.x-1,o.y-33); ctx.fill(); ctx.restore(); return; }
  if(D.how==='ice'&&F2P.dog5Ice&&f2pDog5Iced()) return;   // x2_world's block of ice is drawn over the spot
  f2pDrawDog(o.x,o.y,Math.sin(t*0.7)>0?0:Math.PI,t,false,D.fur,D.ear,1);
  if(D.how==='ice'&&f2pDog5Iced()){ ctx.save(); ctx.globalAlpha=0.55; ctx.fillStyle='#bfe0f8'; ctx.strokeStyle='#6a8ac8'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(o.x-20,o.y+4); ctx.lineTo(o.x-22,o.y-26); ctx.lineTo(o.x-6,o.y-34); ctx.lineTo(o.x+22,o.y-30); ctx.lineTo(o.x+24,o.y+2); ctx.closePath(); ctx.fill(); ctx.globalAlpha=0.9; ctx.stroke(); ctx.restore();
    const H=F2P.heat.dog5; if(H&&H.t>0) glowAt(o.x,o.y-14,30,'255,200,140',Math.min(0.4,H.t*0.3)); }
  else if(Math.sin(t*4)>0.3){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=`700 9px ${UIF}`; ctx.textAlign='center'; ctx.fillText(simplify(S('Woof!','Woof!')),o.x,o.y-34); }
}
function f2pDrawKennel(o){
  const sp=f2pSpr('kennel',70,g=>{ for(let i=0;i<5;i++){ const x=-56+i*28; g.fillStyle='#8a5a32'; g.fillRect(x-11,-12,22,18); g.fillStyle='#6a3a1a'; g.beginPath(); g.moveTo(x-14,-11); g.lineTo(x,-24); g.lineTo(x+14,-11); g.closePath(); g.fill(); g.fillStyle='#f4f8ff'; g.beginPath(); g.moveTo(x-14,-11); g.lineTo(x,-24); g.lineTo(x+2,-21); g.lineTo(x-11,-10); g.closePath(); g.fill(); g.fillStyle='#2a1a10'; g.beginPath(); g.ellipse(x,0,6,7,0,Math.PI,TAU); g.fill(); g.fillRect(x-6,0,12,6); } });
  f2pSh(o.x,o.y+8,70,8); drawSprite(sp,o.x,o.y-6,1,0);
  const t=G.time; F2P_DOGS.forEach((D,i)=>{ if(!G.flags[D.flag]||F2P.dogs.some(r=>r.i===i)) return; f2pDrawDog(o.x-56+i*28,o.y+14,Math.PI/2+0.3*Math.sin(t+i),t+i,false,D.fur,D.ear,0.8); });
}
function f2pDrawSledPost(o){ if(o.hidden&&o.hidden()) return; const sp=f2pSpr('sledpost',26,g=>{ g.fillStyle='#6a4a2a'; g.fillRect(-3,-24,6,30); g.fillStyle='#c84a3a'; g.fillRect(-14,-24,28,10); g.fillStyle='#f0e0c0'; g.font='800 6px sans-serif'; g.textAlign='center'; g.fillText('SLED',0,-17); g.strokeStyle='#4a3a2a'; g.lineWidth=2; g.beginPath(); g.moveTo(-16,10); g.lineTo(16,10); g.quadraticCurveTo(22,10,20,4); g.stroke(); }); f2pSh(o.x,o.y+8,14,4); drawSprite(sp,o.x,o.y-4,1,0); }
function f2pDrawTent(o){
  const sp=f2pSpr('tent',34,g=>{ g.fillStyle='#4a7a5a'; g.beginPath(); g.moveTo(-28,16); g.lineTo(0,-26); g.lineTo(28,16); g.closePath(); g.fill(); g.fillStyle='#3a5a44'; g.beginPath(); g.moveTo(0,-26); g.lineTo(28,16); g.lineTo(6,16); g.closePath(); g.fill();
    g.fillStyle='#f4f8ff'; g.beginPath(); g.moveTo(-10,-11); g.lineTo(0,-26); g.lineTo(10,-11); g.quadraticCurveTo(0,-7,-10,-11); g.fill(); g.fillStyle='#2a1a10'; g.beginPath(); g.moveTo(-6,16); g.lineTo(0,2); g.lineTo(6,16); g.closePath(); g.fill(); g.fillStyle='#e8d8b0'; g.fillRect(14,-2,12,9); });
  f2pSh(o.x,o.y+14,30,6); drawSprite(sp,o.x,o.y-4,1,0);
  if(!G.flags.f_juniper_found&&f2pR('f_kindle')&&Math.sin(G.time*3)>0.5){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=`800 11px ${UIF}`; ctx.textAlign='center'; ctx.fillText('?',o.x+20,o.y-22); }
}
function f2pDrawForge(x,y,lit,t){
  const sp=f2pSpr('forge',32,g=>{ g.fillStyle='#5a5a62'; g.fillRect(-26,-18,52,30); g.fillStyle='#7a7a84'; g.fillRect(-26,-18,52,8); g.fillStyle='#3a3a40'; g.fillRect(-14,-28,28,12); g.fillStyle='#1a1416'; g.beginPath(); g.ellipse(0,-2,16,8,0,0,TAU); g.fill(); g.fillStyle='#3a3a3a'; g.fillRect(14,2,18,8); });
  f2pSh(x,y+14,30,6); drawSprite(sp,x,y-4,1,0);
  if(lit){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-8,46,'255,150,60',0.35+0.12*Math.sin(t*7)); ctx.restore(); if(Math.random()<0.25) emit(x+rand(-10,10),y-10,1,{col:'255,170,70',ang:-Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.5,zmax:3,rise:20}); }
  else { ctx.fillStyle='rgba(220,240,255,.7)'; ctx.beginPath(); ctx.ellipse(x,y-6,12,4,0,0,TAU); ctx.fill(); }
  const H=F2P.heat.forge; if(H&&H.t>0&&!lit) glowAt(x,y-8,36,'140,190,255',Math.min(0.4,H.t*0.2));
}
function f2pDrawBomatic(x,y,lit,t){
  const sp=f2pSpr('bomatic',30,g=>{ g.fillStyle='#6a7a8a'; g.fillRect(-20,-24,40,36); g.fillStyle='#8a9aaa'; g.fillRect(-20,-24,40,7); g.strokeStyle='#b8902a'; g.lineWidth=4; g.beginPath(); g.moveTo(-20,-10); g.lineTo(-28,-10); g.lineTo(-28,-30); g.stroke(); g.beginPath(); g.moveTo(20,0); g.lineTo(28,0); g.lineTo(28,10); g.stroke();
    g.fillStyle='#f0e0c0'; g.beginPath(); g.arc(-8,-6,6,0,TAU); g.fill(); g.strokeStyle='#3a2a1a'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-8,-6); g.lineTo(-5,-9); g.stroke(); g.fillStyle='#e8c03a'; g.beginPath(); g.arc(8,-14,4,0,TAU); g.fill(); g.fillStyle='#1a1416'; g.fillRect(-4,4,14,8); });
  f2pSh(x,y+14,26,6); drawSprite(sp,x,y-6+(lit?Math.abs(Math.sin(t*9))*-1.2:0),1,0);
  if(lit){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x+3,y+2,24,'255,170,80',0.3); ctx.restore(); if(Math.random()<0.08) emit(x+28,y-30,1,{col:'230,230,240',glow:false,ang:-Math.PI/2,spread:0.4,smin:20,smax:50,lmin:.6,lmax:1,zmin:3,zmax:6,grow:8}); }
  const H=F2P.heat.bomatic; if(H&&H.t>0&&!lit) glowAt(x,y-8,30,'140,190,255',Math.min(0.4,H.t*0.2));
}
function f2pDrawPupLM(o){
  if(o.hidden&&o.hidden()) return; const P=F2P_PUP[o.i], t=G.time;
  if(P.how==='drift'){ ctx.save(); ctx.fillStyle='#f4f8ff'; ctx.strokeStyle=F2P_INK; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(o.x,o.y-6,24,13,0,Math.PI,TAU); ctx.lineTo(o.x+24,o.y+2); ctx.lineTo(o.x-24,o.y+2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#4a4a50'; ctx.beginPath(); ctx.arc(o.x+4,o.y-15+Math.sin(t*2)*0.6,2.6,0,TAU); ctx.fill(); ctx.restore(); return; }
  f2pDrawDog(o.x,o.y,Math.PI/2,t,false,'#9aa2aa','#6a7480',0.7);
  if(P.how==='stare'&&!(typeof F2WD!=='undefined'&&F2WD&&F2WD.monkeys)){ for(const s of [-1,1]){ const x=o.x+s*20, y=o.y-2; ctx.fillStyle='#d8d0c8'; ctx.strokeStyle=F2P_INK; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(x,y-10,9,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e89a8a'; ctx.beginPath(); ctx.ellipse(x,y-9,5,4.4,0,0,TAU); ctx.fill(); ctx.fillStyle='#1a1410'; ctx.beginPath(); ctx.arc(x-1.8,y-10,1,0,TAU); ctx.arc(x+1.8,y-10,1,0,TAU); ctx.fill(); }
    if(Math.random()<0.05) emit(o.x+rand(-30,30),o.y-6,1,{col:'240,240,250',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:30,lmin:1,lmax:1.6,zmin:3,zmax:6,grow:8,alpha:0.5}); }
}
function f2pDrawDuchess(o){ if(!f2pDuchessUp()||AREA) return; const v=F2P.duch||(F2P.duch={x:o.x,y:o.y,face:Math.PI*0.6,t:0,kind:'goat',moving:false}); v.x=o.x; v.y=o.y; v.t=G.time; if(T3.on&&T3B.goat) T3B.goat(v); else drawGoat(v);
  ctx.fillStyle='#c83a5a'; ctx.fillRect(o.x-6,o.y-16,12,3); }
function f2pDrawHoop(x,y,next,done,t,i){
  ctx.save(); ctx.lineWidth=next?5:3.5; ctx.strokeStyle=done?'rgba(200,200,210,.4)':next?`rgba(255,${200+Math.round(40*Math.sin(t*6))},90,.95)`:'rgba(232,80,60,.8)';
  ctx.beginPath(); ctx.ellipse(x,y-26,30,26,0,Math.PI,TAU); ctx.stroke(); ctx.fillStyle=ctx.strokeStyle; ctx.fillRect(x-31,y-27,4,27); ctx.fillRect(x+27,y-27,4,27);
  if(next){ ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font=`800 11px ${UIF}`; ctx.textAlign='center'; ctx.fillText(String(i+1),x,y-56); }
  ctx.restore();
}
function f2pDrawSled(x,y,a){ ctx.save(); ctx.translate(x,y); ctx.rotate(a); ctx.fillStyle='#c84a3a'; ctx.strokeStyle=F2P_INK; ctx.lineWidth=1.6; ctx.fillRect(-14,-6,26,12); ctx.strokeRect(-14,-6,26,12); ctx.strokeStyle='#4a3a2a'; ctx.beginPath(); ctx.moveTo(-16,7); ctx.lineTo(14,7); ctx.quadraticCurveTo(20,7,18,1); ctx.moveTo(-16,-7); ctx.lineTo(14,-7); ctx.quadraticCurveTo(20,-7,18,-1); ctx.stroke(); ctx.restore(); }
function f2pDrawBall(b){ ctx.fillStyle='#f8fbff'; ctx.strokeStyle='#8aa0c0'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(b.x,b.y-10,5,0,TAU); ctx.fill(); ctx.stroke(); }
// Mumble the yeti: a toy 3D figure (T3B.f_yeti) and a 2D one. Big, white, a blue face, a knitted hat far too small.
const F2P_YETI={fur:'#eef5fb',furS:'#c8dceb',furL:'#ffffff',face:'#7aaee0',faceD:'#4a7ab0',hat:'#c84a3a',hatB:'#f0e0a0',foot:'#9ab0c8'};
// Mumble's ROAR pose (arms up, mouth wide) for 2.6 s from now: the Glaciar fight can call it (with drawNPC on any
// object {id:'f_mumble',x,y,face,t} to draw him there)
function f2pMumbleRoar(n){ F2P.mumbleRoarT=G.time; if(n) try{ bubble(n,S('ROOOOAAAAAR!','ROOOOAAAAAR!'),{who:SPK.f_mumble.name,col:SPK.f_mumble.col,dy:-108,dur:2.4}); }catch(e){} }
function f2pYetiPose(n){ const roar=F2P.mumbleRoarT!=null&&G.time-F2P.mumbleRoarT<2.6, shy=!roar&&!f2pQ('f_mumble'); return {roar,shy}; }
T3B.f_yeti=n=>{
  const P=F2P_YETI, v=b3Motion(n,0.08,10), T=b3Tgt(), t=G?G.time:0, ps=f2pYetiPose(n);
  T.m=ps.roar?1:0.08+Math.max(0,Math.sin(t*0.9))*0.06; T.up=ps.roar?1:0; T.sq=ps.shy?0.8:0;
  if(player&&!ps.roar){ const d=dist(n.x,n.y,player.x,player.y); if(d<240) T.hy=clamp(angDiff(n._vf==null?n.face:n._vf,angTo(n.x,n.y,player.x,player.y)),-0.6,0.6)*0.7; }
  const S=b3S(n), face=t3Turn(n,n.face,4), X=n.x, Y=n.y+10;
  b3Shadow(X,Y-1,52,0.34);
  t3Begin(X,Y,face,{k:2.0,flash:0,z:0});   // a HUGE yeti: about twice Ash's height
  b3Reset();
  const br=1+Math.sin(t*2.1)*0.02; b3Rot(0,Math.sin(t*1.2)*0.035,0,0,8);
  for(const s of B3SD){ bL(0,s*4.4,9.5,0.8,s*4.8,1.8,3.5,P.furS,3.1); bE(2.2,s*4.8,1.2,3.8,2.7,1.6,P.foot); }
  bE(0,0,17.5,9.8,10.4*br,11.2*br,P.fur);
  bE(4.2,0,15.6,5.4,7.4,8.2,P.furL,0,0,0,0.02);
  for(const [x,y,z] of [[-2,-9.2,22],[-2,9.2,22],[-6.5,0,24.5],[-1,-5.6,27.4],[-1,5.6,27.4]]) bC(x,y,z,x-1.6,y*1.15,z+2.8,1.9,P.fur,0.01);
  for(const s of B3SD){
    const up=S.up, sq=S.sq*(1-up);
    const hx=lerp(lerp(3.6,6.8,sq),4.8,up), hy=s*lerp(lerp(12.4,6.8,sq),13.6,up), hz=lerp(lerp(8.6,13.6,sq),35,up);
    bL(0.4,s*9.6,23.5,hx,hy,hz,3.3,P.fur,2.8); bB(hx+0.6,hy,hz-0.6,3.0,P.face);
  }
  b3Push(); b3Rot(1,-S.up*0.4+S.sq*0.2,1,0,27.5); if(S.hy) b3Rot(2,S.hy,1,0,27.5);
  bE(1.4,0,31.2,7.0,7.6,6.8,P.fur);
  bE(5.8,0,30.0,2.8,5.6,5.0,P.face,0.1);
  for(const s of B3SD){ if(b3Faces(0.8,s*0.4,0.1)>-0.12){ bEye(8.2,s*2.3,31.6,1.0,'#1a2030'); bLn(8.0,s*1.2,33.4,7.8,s*3.4,33.9-S.up*0.8,0.55,P.faceD,0.03); } }
  if(S.m>0.12) bE(8.4,0,28.0,0.9+S.m*1.3,1.4+S.m*1.9,0.5+S.m*1.7,'#4a2a3a',0,0,0,0.03); else bLn(8.4,-1.0,28.4,8.4,1.0,28.4,0.45,'#4a2a3a',0.03);
  bE(0.8,0,37.0,3.6,3.6,1.9,P.hat); bE(0.8,0,36.0,3.9,3.9,0.7,P.hatB,0,0,0,0.01); bB(0.6,0,39.4,1.5,P.hatB,0.02);
  b3Pop();
  t3End();
};
function f2pYeti2D(n){
  const sp=f2pSpr('yeti2d',46,g=>{ const P=F2P_YETI;
    g.fillStyle=P.furS; g.beginPath(); g.ellipse(-9,30,8,9,0,0,TAU); g.ellipse(9,30,8,9,0,0,TAU); g.fill();
    g.fillStyle=P.fur; g.beginPath(); g.ellipse(0,8,26,28,0,0,TAU); g.fill(); g.fillStyle=P.furL; g.beginPath(); g.ellipse(-4,10,15,18,0,0,TAU); g.fill();
    g.fillStyle=P.fur; g.beginPath(); g.ellipse(-26,10,8,18,0.25,0,TAU); g.ellipse(26,10,8,18,-0.25,0,TAU); g.fill(); g.fillStyle=P.face; g.beginPath(); g.arc(-29,26,6,0,TAU); g.arc(29,26,6,0,TAU); g.fill();
    g.fillStyle=P.fur; g.beginPath(); g.ellipse(0,-24,18,17,0,0,TAU); g.fill(); g.fillStyle=P.face; g.beginPath(); g.ellipse(0,-20,11,10,0,0,TAU); g.fill();
    g.fillStyle='#1a2030'; g.beginPath(); g.arc(-4.5,-22,2.2,0,TAU); g.arc(4.5,-22,2.2,0,TAU); g.fill(); g.fillStyle='#4a2a3a'; g.fillRect(-3,-15,6,1.8);
    g.fillStyle=P.hat; g.beginPath(); g.ellipse(0,-39,9,5,0,Math.PI,TAU); g.fill(); g.fillRect(-9,-40,18,3); g.fillStyle=P.hatB; g.beginPath(); g.arc(0,-45,3,0,TAU); g.fill(); });
  const ps=f2pYetiPose(n), b=Math.sin(G.time*2)*0.8+(ps.roar?Math.sin(G.time*30)*1.2:0);
  f2pSh(n.x,n.y+4,30,8); drawSprite(sp,n.x,n.y-34+b,1,0);
  if(ps.roar){ ctx.fillStyle='#4a2a3a'; ctx.beginPath(); ctx.ellipse(n.x,n.y-49+b,5,4,0,0,TAU); ctx.fill(); }
}
{ const base=drawNPC; drawNPC=function(n){
  if(n&&n.id==='f_mumble'){ if(T3.on&&T3B.f_yeti){ T3B.f_yeti(n); return; } f2pYeti2D(n); return; }
  if(n&&n.id==='f_greymane'){ n.dx=n.dy=0; if(T3.on&&T3C.greymane){ T3C.greymane(n,0,false); return; } drawWolf(n,0,2.05,true,true); return; }
  if(n&&n.id==='f_pennant'&&!AREA){ const y0=n.y, t=G.time, bob=Math.sin(t*1.5)*3;
    ctx.save(); ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(n.x+14,y0-8+bob); ctx.quadraticCurveTo(n.x+40,y0+20,n.x+30,y0+46); ctx.stroke();
      ctx.fillStyle='#c83a2a'; ctx.strokeStyle=F2P_INK; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(n.x-30,y0-8+bob); ctx.lineTo(n.x,y0-22+bob); ctx.lineTo(n.x+30,y0-8+bob); ctx.lineTo(n.x,y0+8+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#e8a030'; ctx.beginPath(); ctx.moveTo(n.x,y0-22+bob); ctx.lineTo(n.x+30,y0-8+bob); ctx.lineTo(n.x,y0-8+bob); ctx.closePath(); ctx.fill(); ctx.restore();
    n.y=y0-14+bob; try{ base(n); } finally { n.y=y0; } return; }
  return base(n); }; }
// the Snowgob King's bucket crown, the wolves' purple glow and the kneeling glimmer
{ const base=drawEnemy; drawEnemy=function(e){ base(e); try{
  if(e.f2pKing){ const h=e.r*2.3+6, x=e.x, y=e.y-h; ctx.save(); ctx.fillStyle='#8a96a4'; ctx.strokeStyle=F2P_INK; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x-9,y+6); ctx.lineTo(x-7,y-7); ctx.lineTo(x+7,y-7); ctx.lineTo(x+9,y+6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle='#b8c4d0'; ctx.fillRect(x-7,y-7,14,3); ctx.fillStyle='#e8c03a'; ctx.beginPath(); ctx.arc(x,y,1.8,0,TAU); ctx.fill(); ctx.restore(); }
  if(e.f2pWolf){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(e.x,e.y-8,30,'170,120,240',e.f2pDown?0.32+0.15*Math.sin(G.time*6):0.18); ctx.restore(); if(e.f2pDown&&Math.random()<0.2) emit(e.x+rand(-12,12),e.y-14,1,{col:'200,170,250',ang:-Math.PI/2,spread:0.6,smin:10,smax:30,lmin:.4,lmax:.7,zmin:1.5,zmax:3,rise:12}); }
  }catch(err){} }; }
// moving things drawn in the y-sorted pass: Juniper on the escort, dogs and pups running home, snowballs
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{
  if(AREA||!G||curMap()!==2) return;
  const E=F2P.esc; if(E&&inView(E.n.x,E.n.y,60)) list.push({x:E.n.x,y:E.n.y,draw:()=>drawNPC(E.n)});
  if(E) for(const b of E.balls) if(inView(b.x,b.y,30)) list.push({x:b.x,y:b.y,draw:()=>f2pDrawBall(b)});
  for(const r of F2P.dogs){ if(!inView(r.x,r.y,40)) continue; const D=r.pup?null:F2P_DOGS[r.i]; list.push({x:r.x,y:r.y,draw:()=>f2pDrawDog(r.x,r.y,r.face,G.time,true,D?D.fur:'#9aa2aa',D?D.ear:'#6a7480',D?1:0.7)}); }
  }catch(e){ console.error(e); } }; }

// ---------- the per-frame tick (outdoors and in houses)
function f2pFrame(dt){
  if(!G||G.mode!=='story'||!player) return;
  f2pThawTick(dt);
  if(scene!=='play') return;
  f2pCocoaTick(); f2pEmberChainTick(dt); f2pBlazeTick(dt);
  if(AREA) return;
  if(curMap()!==2){ if(F2P.esc) f2pEscortCancel(); return; }
  f2pGulchTick(); f2pMumbleTick(dt); f2pDogTick(dt); f2pEscortTick(dt); f2pPackTick(dt); f2pPlacesTick();
  if(G.flags.f_testbomb&&G.flags.f_bombs_test) f2pEndTestBomb(false);
}
{ const base=updateComps; updateComps=function(dt){ base(dt); if(F2P.err>20) return; try{ f2pFrame(dt); }catch(e){ F2P.err++; console.error('x2_people',e); } }; }
{ const base=enterArea; enterArea=function(id,door){ if(F2P.esc) f2pEscortCancel(); return base(id,door); }; }

// ---------- Pebble's letters f_pb_* (THREADS 9.3) through the shared helper (e7b_threads). Mom's three letters are the
// story's (ACT3 6.1a, 6.5a, 6.9); these are the other folk at home.
const F2P_MAIL=[
  {id:'f_pb_wren',from:'wren',when:()=>!!(G.seenTalk&&G.seenTalk.met_f_eider),lines:[
    f2pL('wren',`Dear Ash. My cousin Eider writes that a dragon walked into his archive and the books stopped shivering. I knew at once it was you.`,`Dear Ash. Eider says a dragon came, and the books stopped shivering. That's you!`),
    f2pL('wren',`He is very shy. Be loud near him, kindly. He likes it, secretly. Your friend, Sister Wren. P.S. Wear a scarf.`,`He is shy. Be kind and loud. He likes it. Your friend, Wren. P.S. Wear a scarf.`)]},
  {id:'f_pb_fennick',from:'fennick',when:()=>!!G.flags.f_hearth_lit,lines:()=>G.choices.fennick==='jail'?[
    f2pL('fennick',`The Watch House is the warmest place in Brindlecross. I keep every lamp lit. It's what I'm for now. Stay warm up there. Fennick.`,`I keep the Watch House lamps lit. Stay warm. Fennick.`)]:[
    f2pL('fennick',`Snow on every lantern in Emberhollow, so I lit them twice as bright. Nobody here has had a dark night since you left. Your friend, Fennick.`,`Snow on every lantern, so I lit them twice as bright. Fennick.`)]},
  {id:'f_pb_ulf',from:'ulf',when:()=>f2pQ('f_sled'),lines:[
    f2pL('ulf',`Ash. Elka wrote me a letter. Her first ever. It says she lost a race to you, that she is fine, very fine, and that she will be home for supper. It does not say which supper.`,`Elka wrote me! She lost a race to you. She'll be home for supper. Which supper?`),
    f2pL('ulf',`Thank you for finding her. The sheep have stopped looking north. Ulf.`,`Thank you. The sheep stopped looking north. Ulf.`)]},
  {id:'f_pb_quill',from:'quill',when:()=>!!G.flags.f_moon_bite3||f2pMoon()<=85,lines:[
    f2pL('quill',`The moon is eighty-five percent of a moon. I measured three times. Then I measured my measuring stick. It is the right length. The moon is not. Professor Quill.`,`The moon is smaller again. I measured three times. Professor Quill.`)]},
  {id:'f_pb_dell',from:'dell',when:()=>!!G.flags.f_done&&!G.flags.f_dell_letter,lines:[
    f2pL('dell',`Dear Ash. I bought a boat for the sea, in Gearhaven. I have not lost it yet. It has been four days. When you need to go east, come to the dock. Dell.`,`Dear Ash. I bought a sea boat! Not lost yet! Come to the dock to go east. Dell.`)],then:()=>{ G.flags.f_dell_letter=1; }}
];
function f2pMailPush(){
  if(F2P.mail) return;
  try{ if(typeof pebbleLetter==='function'){ for(const m of F2P_MAIL) pebbleLetter(m.id,m); F2P.mail=true; }
    else if(typeof PEBBLE_MAIL!=='undefined'&&PEBBLE_MAIL&&typeof PEBBLE_MAIL.push==='function'){ for(const m of F2P_MAIL) if(!PEBBLE_MAIL.some(q=>q.id===m.id)) PEBBLE_MAIL.push(m); F2P.mail=true; } }catch(e){}
}
f2pMailPush();
// ---------- Tamsin's Act III verse (THREADS 14.1; e7b_threads adds it too, and a verse is only sung once)
try{ if(typeof tamsinVerse==='function') tamsinVerse(()=>!!G.flags.f_done,S(`\u{1F3B5} The north wind was howling, the Hearth fire was low, so Ash found an auntie made out of snow...`,`\u{1F3B5} Ash found an ice dragon auntie...`)); }catch(e){}
// ---------- the epilogue lines (EPI.f, THREADS 18.3 and ACT3 6.13; the finale shows at most two, highest pri first)
const F2P_EPI=[
  {pri:9,cond:()=>G.choices.f_glaciar_home==='stay',line:['narr',S(`Glaciar stayed in the north as the Snow Mother. Once a year she breathed one gentle snow over Hearthold, for the sledding, and pinched the cheek of every child who asked.`,`Glaciar stayed. She made one gentle snow a year, for sledding.`)]},
  {pri:7,cond:()=>G.choices.f_glaciar==='free'&&G.choices.f_glaciar_home!=='stay',line:['narr',S(`Glaciar rested in the far north, past the edge of the ice. Every Lantern Day a single snowflake the size of a shield landed on Maren's forge.`,`Glaciar rested far north. Every Lantern Day, a giant snowflake landed on the forge.`)]},
  {pri:6,cond:()=>!!G.flags.f_mumble_ally,line:['narr',S(`Mumble the yeti joined the Hearthold choir. He sings the low notes. All of them. Very loudly. Not sorry at all.`,`Mumble joined the choir. He sings very loudly now.`)]},
  {pri:5,cond:()=>f2pQ('f_rime'),line:['narr',S(`Rimeholm's bell rang every morning after that, and nobody in the village ever rested their eyes for a whole month again.`,`Rimeholm's bell rang every morning. Nobody froze again.`)]},
  {pri:4,cond:()=>f2pQ('f_bombs'),line:['narr',S(`Mags Sprocket opened Hearthold's first fireworks shop. Captain Brann fell out of his tower every New Year.`,`Mags opened a fireworks shop. Brann fell off his tower.`)]},
  {pri:4,cond:()=>f2pQ('f_forge'),line:['narr',S(`Gunnhild's forge never went cold again. She wrote to Maren of Emberhollow. Maren wrote back. It said "yes, please." Gunnhild framed that one too.`,`Gunnhild wrote to Maren. Maren said "yes, please." Gunnhild framed it.`)]},
  {pri:3,cond:()=>f2pQ('f_dogs'),line:['narr',S(`Hask's dogs pulled the first mail sled to Rimeholm in a hundred years. Oskar the mailman was early. He cried.`,`Hask's dogs pulled the mail sled. Oskar was early. He cried.`)]},
  {pri:3,cond:()=>f2pQ('f_sled'),line:['narr',S(`Elka and Soren built a sled run from the Windscour all the way down to Hearthold. Everyone calls it the Ash Run. Elka calls it hers.`,`Elka and Soren built a sled run. Everyone calls it the Ash Run.`)]},
  {pri:2,cond:()=>f2pQ('f_juniper'),line:['narr',S(`Juniper's North Maps hang in the Hearth Archive. Brother Eider dusts them every morning and whispers sorry to the corners.`,`Juniper's maps hang in the archive. Eider dusts them every day.`)]},
  {pri:2,cond:()=>f2pQ('f_warm'),line:['narr',S(`Mayor Toastwhistle gave out eleven more medals that winter. All of them were cookies. Everything was fine.`,`The Mayor gave out eleven more medals. All cookies.`)]},
  {pri:3,cond:()=>G.choices.f_glaciar==='defeat',line:['narr',S(`On Mount Dread an ice dragon slept on under her blanket of snow, and every spring a small dragon with red horns climbed up to say hello.`,`Glaciar slept on. Every spring, Ash climbed up to say hello.`)]},
  {pri:1,cond:()=>true,line:['narr',S(`The Great Hearth of Hearthold burned blue and gold all winter, and Old Brynja talked to it every night, and it talked back in sparks.`,`The Great Hearth burned blue and gold all winter.`)]}
];
function f2pEpiPush(){
  if(F2P.epi) return;
  try{ if(typeof EPI!=='undefined'&&EPI&&EPI.f&&typeof EPI.f.push==='function'){ const have=new Set(EPI.f.map(e=>e&&e.line&&e.line[1])); for(const e of F2P_EPI) if(!have.has(e.line[1])) EPI.f.push(e); F2P.epi=true; } }catch(e){ /* EPI comes from e7b_threads: tried again at world build */ }
}
f2pEpiPush();
// ---------- the journal: the Frozen Folk count on the People tab (from Act III on)
{ const base=renderJour; renderJour=function(){ base(); try{
  if(typeof jTab==='undefined'||jTab!=='people'||!G||actOf(G.stage)<3) return;
  const el=$('#jBody .ppl'); if(!el||el.querySelector('.f2pfrz')) return;
  const n=G.flags.f_frozen_n|0, d=document.createElement('div'); d.className='f2pfrz';
  d.innerHTML=`<b>${escapeHtml(simplify(S('The Frozen Folk','The Frozen Folk')))}</b> <span class="hz">❄ ${n}</span><small>${escapeHtml(simplify(S(`Warmed up by your Blaze so far: ${n}. The Mayor wants twelve. Rimeholm wants everyone.`,`You warmed ${n} people. The Mayor wants 12.`)))}</small>`;
  el.prepend(d); }catch(e){ console.error(e); } }; }

// ---------- once every module has loaded (world build): missing stage ids, the shared registries
function f2pInit(){ f2pStagesFallback(); f2pEpiPush(); f2pMailPush(); }
{ const base=initWorld; initWorld=function(){ try{ f2pInit(); }catch(e){ console.error('x2_people init',e); } return base(); }; }
function f2pReset(){ F2P.fight=null; F2P.esc=null; F2P.king=null; F2P.dogs=[]; F2P.heat={}; F2P.packMeet=false; F2P.mumbleRoarT=null; F2P.duch=null; }
{ const base=loadGame; loadGame=function(s){ const r=base(s); f2pReset(); try{ if(G.flags.f_testbomb&&(G.flags.f_bombs_test||f2pQ('f_bombs'))) f2pEndTestBomb(f2pQ('f_bombs')); f2pFuse(); }catch(e){} return r; }; }
{ const base=newRun; newRun=function(m){ base(m); f2pReset(); }; }

// ---------- debug hooks for tests (window.__ebX.f2p, plus the ACT3 13.3 names fThawAll, fSong, fFrozen)
window.__ebX=Object.assign(window.__ebX||{},{f2p:{
  F2P, cast:()=>F2P_CAST.map(c=>c.id), frozenDefs:()=>F2P_FROZEN.map(d=>d.id),
  frozen:()=>typeof P3==='undefined'?[]:P3.out.filter(o=>o.p3==='frozen').map(o=>({id:o.id,f2p:o.f2pId||null,who:o.who||null,st:o.st,x:Math.round(o.x),y:Math.round(o.y),flag:o.flag||null})),
  thaw:id=>{ const o=f2pFrozenObj(id)||(typeof P3!=='undefined'&&P3.out.find(q=>q.id===id)); if(!o||o.st!=='ice') return false; p3ThawStart(o); return true; },
  thawDone:id=>{ const o=f2pFrozenObj(id)||(typeof P3!=='undefined'&&P3.out.find(q=>q.id===id)); if(!o) return false; if(o.st==='ice') p3ThawStart(o); if(o.st==='pop') p3ThawDone(o); return o.st; },
  lm:id=>{ const o=f2pLMid(id); return o?{x:Math.round(o.x),y:Math.round(o.y),hidden:o.hidden?!!o.hidden():false,prompt:o.prompt?String(o.prompt):null}:null; },
  act:id=>{ const o=f2pLMid(id); if(!o||!o.act) return false; o.act(o); return true; },
  npc:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); return n?{x:Math.round(n.x),y:Math.round(n.y)}:null; },
  // (J11 talk tests) stand next to a person, inside their house if they are indoors; returns the npc or null
  go:id=>{ const c=CASTBY[id]||SPECIAL[id]; if(c&&c.inside){ if(!AREA||AREA.id!==c.inside){ if(AREA) exitArea(true); enterArea(c.inside,DOORS.find(q=>q.area===c.inside)); } } else if(AREA) exitArea(true);
    let n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n&&!AREA){ try{ setupNPCs(); }catch(e){} n=G.npcs.find(q=>q.id===id); } if(!n) return null; player.x=n.x; player.y=n.y+(AREA?50:40); return n; },
  where:id=>{ const c=CASTBY[id]||SPECIAL[id]; const n=G.npcs.find(q=>q.id===id); const d=DOORS.find(q=>q.owner===id); return {inside:c&&c.inside||null,door:d?{x:Math.round(d.x),y:Math.round(d.y),area:d.area}:null,out:n?{x:Math.round(n.x),y:Math.round(n.y)}:null,present:npcPresent(id)}; },
  step:id=>{ const q=G.quests[id]; return q?{step:q.step,done:!!q.done,text:stepText(id)}:null; },
  stages:()=>F2P_STAGES.map(s=>[s,stageAt(s),f2pFallbackStage(s)]), frame:f2pFrame, heat:(k,x,y,r,need,dt)=>f2pHeat(k,x,y,r,need,dt),
  roar:()=>{ player.roar=100; doRoar(false); return F2P.fight?F2P.fight.tries:null; }, fight:()=>F2P.fight?{tries:F2P.fight.tries,done:F2P.fight.done,alive:F2P.fight.foes.filter(e=>!e.dead).length}:null,
  killFight:()=>{ const F=F2P.fight; if(!F) return 0; let n=0; for(const e of F.foes) if(!e.dead){ killEnemy(e); n++; } return n; },
  king:()=>F2P.king?{hp:Math.round(F2P.king.hp),x:Math.round(F2P.king.x),y:Math.round(F2P.king.y)}:null, killKing:()=>{ if(F2P.king&&!F2P.king.dead){ killEnemy(F2P.king); return true; } return false; },
  esc:()=>F2P.esc?{x:Math.round(F2P.esc.n.x),y:Math.round(F2P.esc.n.y),hits:F2P.esc.hits,gobs:F2P.esc.gobs.filter(g=>!g.dead).length,balls:F2P.esc.balls.length}:null,
  escTo:(x,y)=>{ if(!F2P.esc) return false; F2P.esc.n.x=x; F2P.esc.n.y=y; return true; }, escStart:()=>{ f2pEscortStart(); return !!F2P.esc; },
  wolves:()=>G.enemies.filter(e=>!e.dead&&e.f2pWolf).map(e=>({i:e.f2pWolf,hp:Math.round(e.hp),max:Math.round(e.maxHp),down:!!e.f2pDown,x:Math.round(e.x),y:Math.round(e.y)})),
  hitWolf:(i,amt)=>{ const e=G.enemies.find(q=>!q.dead&&q.f2pWolf===i); if(!e) return null; e.spawnIn=0; damageEnemy(e,amt||e.maxHp,{src:'slash'}); return {hp:Math.round(e.hp),down:!!e.f2pDown}; },
  blazeAt:(x,y,secs,key,need)=>{ let r=false; for(let t=0;t<secs;t+=1/30){ if(f2pHeatSim(key,need)) { r=true; break; } } return r; },
  wolfFree:i=>{ const e=G.enemies.find(q=>!q.dead&&q.f2pWolf===i); if(!e) return false; f2pWolfFree(e,i-1); return true; },
  dogFound:i=>f2pDogFound(i), pupFound:i=>f2pPupFound(i,'test'), mini:()=>G.mini?{kind:G.mini.kind,i:G.mini.i,t:+G.mini.t.toFixed(1),ek:Math.round(G.mini.ek||0),L:Math.round(G.mini.L||0)}:null, miniState:()=>G.mini,
  // stand next to a landmark (or any x,y) on its own level, on free ground: what a player who climbed up would do
  standAt:(id,y0)=>{ const o=typeof id==='string'?f2pLMid(id):{x:id,y:y0}; if(!o) return null; if(AREA) exitArea(); const lv=typeof elevLvl==='function'?elevLvl(o.x,o.y):0;
    for(let d=24;d<=240;d+=12) for(let i=0;i<12;i++){ const a=Math.PI/2+i/12*TAU, x=o.x+Math.cos(a)*d, y=o.y+Math.sin(a)*d; if(f2pFree(x,y)&&(typeof elevLvl!=='function'||elevLvl(x,y)===lv)){ player.x=x; player.y=y; player.vx=player.vy=0; updateCam(0,true); return {x:Math.round(x),y:Math.round(y),lv,here:f2pHere()}; } }
    return null; },
  verse:n=>f2pVerseGot(n), boulder:()=>{ const o=F2P.quarry; if(o&&!G.found[o.id]&&typeof breakBoulder==='function') breakBoulder(o); return !!(o&&G.found[o.id]); },
  tunnel:()=>{ const o=F2P.tunnel; if(o&&!G.found[o.id]&&typeof breakBoulder==='function') breakBoulder(o); return !!(o&&G.found[o.id]); },
  testBomb:()=>({flag:!!G.flags.f_testbomb,owned:!!(G.weapons&&G.weapons.bombs),n:G.flags.wpn_bombs,max:G.flags.wpn_bombMax}),
  mail:()=>F2P_MAIL.map(m=>[m.id,!!G.flags[m.id],!!m.when()]), epi:()=>F2P_EPI.filter(e=>{ try{ return e.cond(); }catch(err){ return false; } }).map(e=>e.line[1]),
  forgeLit:()=>f2pForgeLit(), bomaticLit:()=>f2pBomaticLit(), graveyard:()=>f2pGraveyard(), drumVerse:()=>f2pDrumVerse(), stoneTry:()=>f2pStoneTry(true)
}});
function f2pHeatSim(key,need){ const H=F2P.heat[key]||(F2P.heat[key]={t:0,last:-9}); H.t+=1/30; H.last=G.time; if(H.t>=f2pNeed(need||2)){ H.t=0; if(key==='forge') f2pForgeLit(); else if(key==='bomatic') f2pBomaticLit(); else if(key==='dog5'){ if(F2P.dog5Ice&&typeof P3K!=='undefined'&&P3K.icewall) P3K.icewall.blaze(F2P.dog5Ice,99); else { G.flags.f_dog5_free=1; f2pDogFound(4); } } else if(key==='pup2') f2pPupFound(1,'test'); return true; } return false; }
if(!window.__ebX.fThawAll) window.__ebX.fThawAll=()=>f2pThawAll();
if(!window.__ebX.fSong) window.__ebX.fSong=()=>{ for(const n of [1,2,3]){ G.flags['f_v'+n]=1; } G.flags.f_song=1; G.flags.f_page11=1; return true; };
if(!window.__ebX.fFrozen) window.__ebX.fFrozen=()=>window.__ebX.f2p.frozen();
