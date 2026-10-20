
// ================= Act IV main story: The Night Mother (x3_story)
// The twelve Act IV stages (m_sail to m_reforge), every main-story scene and talk of bible/ACT4.md section 6, the story
// words of the four dungeons (section 7, played by the dungeon helpers by key), Nyxara in person at the three eclipses
// (a moth the size of a house, a bite out of the moon, darker nights), Hush on the silver leash and the Act IV choice
// (G.choices.m_hush 'free' or 'foe'), Shard 3, Mom and Quill arriving on Dell's boat, the reforging of the Ember Heart
// (a three-tap rhythm game), the last bite of the moon (moonSet(0)), Nightfall Peak rising on the Moon Pier, and
// endAct(4) with Ash left on the pier for the finale. Everything is a wrapper or a registry entry: no engine file is
// edited. Contract for the other Act IV helpers: scratchpad/M3STORY.md (stages, flags, STORY keys, the calls to make).
// Owners elsewhere (this file only hooks in, and its stand-ins switch off when the real thing is in the build): the
// map, doors, crossings, the Moonpath braziers and m_moonpath_lit (x3_world); the people (x3_people); the boss sites
// and the Hush fight (x3_foes); the dungeons (x3_dun_a, x3_dun_b); the bridge and the peak's own map (the finale).
// Top-level names start with m3s / M3S; the debug hooks are window.__eb.m3s.
// Lines are [speaker, S(full, simple)]; Pip is "he"; "Mom"; no em dash anywhere.

// ---------- 0. small helpers
// (what other Act IV modules registered before this one loaded: their versions of these optional talks win)
const M3S_PRE={wren:!!STORY.m_wren};
const M3S={q:[],rep:{},cam:null,ecl:null,peak:null,voy:null,forge:null,hushFx:null,hushRun:false,hushFin:null,introQ:false,boss:null,bt:0,fb:{},fbAt:{},grey:0,fadeTo:null,lights:[],standin:null,dbg:{}};
const m3sEasy=()=>!!(G&&G.diff&&G.diff.name==='Easy');
const m3sHard=()=>!!(G&&G.diff&&G.diff.name==='Hard');
const m3sOn=()=>!!G&&G.mode==='story'&&!G.done&&actOf(G.stage)===4;
const m3sOut=()=>!AREA&&curMap()===3;
// once-only scenes: every script starts with a silent mark (G.flags.m_sn[key]), so a scene played by any route is
// never played twice. That holds even when two modules both play the same key (a foes module's boss intro and a
// dungeon's room story, say): on a second play every line skips itself and its actions do not run again.
// m3sDef(key, lines, {again:true}) makes a scene that may be played again (a person's repeat talk).
function m3sSeen(k){ const s=G&&G.flags&&G.flags.m_sn; return !!(s&&s[k]); }
function m3sMark(k){ if(!G||!G.flags) return; (G.flags.m_sn=G.flags.m_sn||{})[k]=1; }
function m3sDef(key,lines,o){
  const again=!!(o&&o.again), rep=()=>!again&&!!M3S.rep[key];
  const wrap=L=>{
    if(Array.isArray(L)) return L[2]?{who:L[0],text:L[1],opts:L[2],skipIf:rep}:{who:L[0],text:L[1],skipIf:rep};
    if(!L||typeof L!=='object') return L;
    const c=Object.assign({},L), s0=L.skipIf, f0=L.fn;
    c.skipIf=()=>rep()||(s0?!!s0():false);
    if(f0) c.fn=function(){ if(!rep()) return f0.apply(this,arguments); };
    return c;
  };
  const head={who:'narr',text:'',fn:()=>{ M3S.rep[key]=m3sSeen(key); m3sMark(key); },skipIf:()=>true};
  STORY[key]=[head].concat(lines.map(wrap)); return STORY[key];
}
const m3sIf=(who,f,s,cond)=>({who,text:S(f,s),skipIf:()=>{ try{ return !cond(); }catch(e){ return true; } }});
const m3sPip=(f,s)=>m3sIf('pip',f,s||f,()=>!!(G.flags&&G.flags.pip));
const m3sAct=(f,s,fn)=>({who:'narr',text:S(f,s),fn});            // a narrated line that also does something
// play a STORY key (or a list of lines); done runs after the scene closes
function m3sPlay(key,done,opt){
  const L0=typeof key==='string'?STORY[key]:key, L=typeof L0==='function'?L0():L0;
  if(!L||!L.length){ if(done) try{ done(); }catch(e){ console.error(e); } return false; }
  runDialogue(L,()=>{ scene='play'; M3S.cam=null; if(done) try{ done(); }catch(e){ console.error(e); } try{ saveGame(); }catch(e){} },opt);
  return true;
}
function m3sChain(keys,done,opt){ const L=[]; for(const k of keys){ if(opt&&opt.skipSeen&&m3sSeen(k)) continue; const v=STORY[k]; const a=typeof v==='function'?v():v; if(a&&a.length) L.push(...a); } return m3sPlay(L,done,opt); }
// a beat that waits for a calm moment (playing, no dialogue, no boss fight, no minigame)
function m3sWhen(id,cond,fn){ if(M3S.q.some(q=>q.id===id)) return; M3S.q.push({id,cond,fn}); }
// (also not over a chapter card, nor while the HUD moon is away at the centre of the screen for its bite)
function m3sCalm(){ return scene==='play'&&!DLG&&!G.mini&&!(G.boss&&!G.boss.dead)&&!player.dead
  &&!(typeof moonCardOn==='function'&&moonCardOn())&&!(typeof MOON!=='undefined'&&MOON&&MOON.anim); }
function m3sQueue(){
  if(!M3S.q.length||!m3sCalm()) return;
  for(let i=0;i<M3S.q.length;i++){ const q=M3S.q[i]; let ok=false; try{ ok=!q.cond||q.cond(); }catch(e){ console.error(e); }
    if(ok){ M3S.q.splice(i,1); try{ q.fn(); }catch(e){ console.error(e); } return; } }
}
function m3sMoon(p){ if(typeof moonSet==='function') moonSet(p); else G.flags.moon=Math.min(G.flags.moon==null?100:+G.flags.moon,p); }
const m3sMoonNow=()=>typeof moonLeft==='function'?moonLeft():(G.flags.moon==null?100:+G.flags.moon);
const m3sFriend=()=>typeof vesperFriend==='function'?!!vesperFriend():G.choices.c_vesper==='friend';
const m3sGlaciar=()=>!!(G&&G.choices&&G.choices.f_glaciar==='free');
const m3sQDone=q=>!!(G&&G.quests&&G.quests[q]&&G.quests[q].done);
const m3sIn=id=>!!AREA&&(AREA.id===id||String(AREA.id).startsWith(id+'_')||!!(AREA.def&&AREA.def.dun===id));
const m3sRoom=(id,room)=>m3sIn(id)&&!!AREA.curRoom&&AREA.curRoom.id===room;
const m3sNear=(P,r)=>m3sOut()&&dist(player.x,player.y,P.x,P.y)<r;
const m3sExtra=(k,t)=>{ G.choices.extra=G.choices.extra||{}; G.choices.extra[k]=t; };
function m3sJ(name,sfx){ try{ if(typeof jingle==='function') jingle(name,sfx); else if(sfx) SFX.play(sfx); }catch(e){} }
// is a dungeon really built? (x3_world puts a one-room placeholder area behind each door until x3_dun_a/b define it)
function m3sDunPh(id){ const D=typeof DUNGEONS!=='undefined'?DUNGEONS[id]:null, A=AREADEFS[id]; return !A||!!(A.placeholder||(D&&D.placeholder)); }
const m3sDunReal=id=>!m3sDunPh(id);
// where a door really is (the world module's own door, when it is in the build), else the bible's spot
function m3sDoorAt(area,P){ const d=DOORS.find(q=>q.area===area&&q.x<IZX-50); return d?{x:d.x,y:d.y}:P; }
// an area id (or any floor of it) for the objectives: only when that area exists, so the compass points at its door
const m3sArea=id=>AREADEFS[id]?{area:id}:{};

// ---------- the places (absolute world coordinates from the bible; x3_world builds the same spots)
const M3SP={hearth:{x:6850,y:49100},northGate:{x:6800,y:48100},farPier:{x:8350,y:27150},dock:{x:1150,y:64800},isle:{x:2300,y:64150},
  raft:{x:2300,y:64750},winnie:{x:2050,y:64950},reading:{x:2520,y:64600},spire:{x:3700,y:62380},channel:{x:3700,y:62540},coral:{x:1900,y:67600},
  sunken:{x:5850,y:65600},arch:{x:6250,y:65600},strand:{x:6900,y:65600},road:{x:9200,y:67500},sable:{x:9800,y:67600},rafi:{x:9700,y:67400},
  well:{x:9800,y:67650},saffron:{x:9800,y:67820},worm:{x:10600,y:62900},gap:{x:10900,y:67200},mirror:{x:12300,y:68400},
  foot:{x:12600,y:65300},obsDoor:{x:12950,y:64400},obs:{x:12900,y:64000},terrace:{x:13500,y:64050},pier:{x:13400,y:65450},pierEnd:{x:13700,y:65450}};

// ---------- 1. speakers, portraits, items (each only if nobody registered it first)
const M3S_SPK={m_dabble:{name:'Mayor Dabble Floatwell',col:'#e8c03a'},m_winnie:{name:'Old Winnie',col:'#9ad0c8'},m_coralia:{name:'Queen Coralia',col:'#f08080'},
  m_kipper:{name:'Sir Kipper',col:'#8ab0f0'},m_rafi:{name:'Rafi Sandstride',col:'#e8a030'},m_saffron:{name:'Saffron',col:'#c0c8ff'},m_kiln:{name:'Old Kiln',col:'#e8905a'},
  m_esme:{name:'Esme',col:'#e8c03a'},m_ripple:{name:'Elder Ripple',col:'#8ac0b0'},m_puffington:{name:'Baron Puffington',col:'#f0c84a'},
  m_octavia:{name:'Madame Octavia',col:'#c088e8'},m_gravelgut:{name:'Gravelgut',col:'#e0b878'},m_fanfare:{name:'Lord Fanfare',col:'#6ad8b0'},
  m_umberwing:{name:'Duke Umberwing',col:'#c0a8dc'},m_zapp:{name:'Lady Zapp',col:'#9af0ff'},m_bigfin:{name:'Big Fin',col:'#d8b888'},m_prism:{name:'Prism',col:'#d8f0ff'},
  m_sandy:{name:'Queen Sandy',col:'#ecd098'},f_glaciar:{name:'Glaciar',col:'#a8e0ff'},f_mags:{name:'Mags Sprocket',col:'#e8963a'},
  c_vesper:{name:'Vesper',col:'#b8a8e8'},goat:{name:'Duchess',col:'#e8e0d0'}};
for(const k in M3S_SPK) if(!SPK[k]) SPK[k]=M3S_SPK[k];
for(const [k,v] of [['m_mooncrumb',S('A crumb of the moon (silver, and still cool)','A crumb of the moon')],['m_book_raw',S('A soggy book with a moth on the cover','A soggy book')],
  ['m_book',S("The Moon-Priests' Book of Moths","The Book of Moths")],['m_stariron',S('Star-iron from the Fallen Star','Star-iron')],
  ['m_lampoil',S('Everlasting Lamp Oil','Lamp oil that never runs out')],['m_vletter',S("Granny Oona's lost letter","Granny Oona's letter")]]) if(!ITEM_NAMES[k]) ITEM_NAMES[k]=v;
// portraits for the speakers that are not plain people (drawn on a 176 px card, centred, about 60 px each way)
function m3sGlowG(g,x,y,r,col,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
const m3sDot=(g,x,y,r)=>{ g.beginPath(); g.arc(x,y,r,0,TAU); };
// (v12 FACES) the Act IV creatures and bosses show the line's mood (a12a_dlg's kit: pxPose, pxEye, pxBrows, pxMouth,
// crWideMouth, crBeak, pxExtras); four that had no face get one (Lady Zapp, Big Fin, Prism, Great-grandma Greatshell)
// Baron Puffington, the pufferfish who guards the Sunken Gate: he puffs up (spikes out) when he is cross or startled and
// goes soft when he is sad; his moustache bristles or droops
function m3sFacePuff(g){ const O='#2a1a0c', X=PX, n=X.n, puff=n==='angry'||n==='furious'||n==='surprised'||n==='scared'||n==='proud'?1.12:n==='sad'||n==='defeated'||n==='ashamed'?0.9:1;
  g.save(); pxPose(g,{py:60}); pxAura(g,0,6,88); g.lineJoin='round'; g.lineWidth=3; g.strokeStyle=O;
  g.fillStyle='#e8c040'; for(let i=0;i<14;i++){ const a=i/14*TAU, L=52+18*puff*puff; g.beginPath(); g.moveTo(Math.cos(a-0.12)*52,Math.sin(a-0.12)*48+6); g.lineTo(Math.cos(a)*L,Math.sin(a)*(L-6)+6); g.lineTo(Math.cos(a+0.12)*52,Math.sin(a+0.12)*48+6); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle='#f0d058'; g.beginPath(); g.ellipse(0,6,56*puff,52*puff,0,0,TAU); g.fill(); g.stroke();
  g.fillStyle='#fff6d0'; g.beginPath(); g.ellipse(0,24,38,26,0,0,TAU); g.fill();
  g.fillStyle='#8a5a2a'; for(const [x,y,r] of [[-30,-18,6],[24,-26,5],[38,0,5],[-40,10,4],[10,-36,4]]){ m3sDot(g,x,y,r); g.fill(); }
  for(const s of [-1,1]) pxEye(g,s*18,-10,s,{rx:11,ry:11,r:5.2,white:'#fff',iris:O,skin:'#f0d058',lash:O,ring:O});
  pxBrows(g,{x:18,w:8,y:-25,col:'#8a5a2a',lw:3.6,arch:2.4,busy:true});
  pxMouth(g,{y:26,w:8,c:5,col:O,lw:2.6,dark:'#8a2a24',tongue:'#e87a7a'});
  const mt=X.m==='smile'||X.m==='laugh'||n==='proud'?-0.18:X.m==='frown'||X.m==='wobble'?0.25:n==='angry'||n==='furious'?-0.3:0;
  g.fillStyle='#5a3418'; for(const s of [-1,1]){ g.save(); g.translate(0,12); g.rotate(s*mt); g.beginPath(); g.moveTo(0,-2); g.bezierCurveTo(s*18,-10,s*40,-4,s*54,-16); g.bezierCurveTo(s*44,4,s*20,6,0,4); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  g.save(); g.translate(0,-44*puff); g.rotate(-(X.ear||0)*0.06); g.fillStyle='#1a2a4a'; g.beginPath(); g.moveTo(-22,0); g.lineTo(20,0); g.lineTo(12,-16); g.lineTo(-14,-16); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#e0b84a'; g.fillRect(-5,-11,10,6); g.restore();
  pxExtras(g,{ex:18,ey:-10,erx:11,ery:11,cheek:6,top:-40,side:56,no:{blush:true},halo:-78});
  g.restore(); }
// Mother Octavia, the octopus who hoarded every lamp in Lumen: goat-bar eyes with lids, brows, a mouth, and arms that
// curl up in a temper and hang limp when she is sad
function m3sFaceOcto(g){ const O='#1a0a24', X=PX, n=X.n, curl=n==='angry'||n==='furious'||n==='surprised'||n==='scared'||n==='laughing'?1:n==='sad'||n==='defeated'||n==='ashamed'||n==='sleepy'?-1:0;
  g.save(); pxPose(g,{py:60}); pxAura(g,0,-6,86); g.lineJoin='round'; g.lineWidth=3; g.strokeStyle=O;
  m3sGlowG(g,46,-46,40,'190,220,255',pxGlowCol('x','x','dim')==='dim'?0.25:0.5);
  g.fillStyle='#6a2a8a'; for(let i=0;i<6;i++){ const x=-60+i*24, cu=curl*(i%2?14:10)*(x<0?-1:1); g.beginPath(); g.moveTo(x,30); g.quadraticCurveTo(x-10+cu,60-curl*14,x+6+cu*1.4,76-curl*18); g.quadraticCurveTo(x+12+cu*0.6,60-curl*10,x+14,30); g.closePath(); g.fill(); g.stroke(); }
  g.strokeStyle='#6a2a8a'; g.lineWidth=11; g.beginPath(); g.moveTo(40,18); g.quadraticCurveTo(70,-10,48,-40); g.stroke(); g.strokeStyle=O; g.lineWidth=3;
  g.fillStyle='#eaf2ff'; m3sDot(g,46,-46,10); g.fill(); g.stroke();
  g.fillStyle='#7a3a9a'; g.beginPath(); g.ellipse(0,-6,52,46,0,0,TAU); g.fill(); g.stroke();
  g.fillStyle='#a8f0ff'; for(const [x,y] of [[-30,-30],[-12,-40],[22,-34],[34,-16],[-38,-6]]){ m3sDot(g,x,y,3.2); g.fill(); }
  for(const s of [-1,1]){ g.save(); g.translate(s*18,2); g.scale(1.6,2.2); dragonEye(g,0,0,s,{eye:'#f8d050',skin:'#7a3a9a',dark:O,rot:0.02,bar:true,noglow:true}); g.restore(); }
  pxBrows(g,{x:18,w:9,y:-16,col:'#4a1a6a',lw:3.6,arch:2.6,k:1.2,busy:true});
  pxMouth(g,{y:26,w:10,c:5,col:'#4a1a6a',lw:2.6,dark:'#2a0a2a',tongue:'#e07090'});
  pxExtras(g,{ex:18,ey:2,erx:12,ery:10,cheek:16,top:-34,side:50,halo:-60});
  g.restore(); }
// Gravelgut, the great sandworm: a maw ringed with teeth that gapes or clenches, a glow inside that warms or reddens,
// and two small eyes on the top ring
function m3sFaceGut(g){ const O='#2a160a', X=PX, m=X.m||'neutral', op=pxOpenMouth(), cl=m==='teeth'||m==='set'||m==='flat'?0.6:m==='smirk'||m==='tiny'?0.75:1;
  const glow=pxGlowCol('230,236,255','255,120,70','170,170,200','255,226,170');
  g.save(); pxPose(g,{py:60}); pxAura(g,0,-6,90); g.lineJoin='round'; g.lineWidth=3; g.strokeStyle=O;
  for(let i=2;i>=0;i--){ g.fillStyle=['#c89a5a','#d8aa6a','#e6bc7c'][i]; g.beginPath(); g.ellipse(0,20+i*-14,70-i*6,44-i*4,0,0,TAU); g.fill(); g.stroke(); }
  const rx=40*(0.8+op*0.25)*cl, ry=30*(0.8+op*0.3)*(m==='smile'||m==='laugh'?0.9:1)*cl, my=-6+(m==='frown'?3:0);
  g.fillStyle='#3a1c12'; g.beginPath(); g.ellipse(0,my,rx,ry,0,0,TAU); g.fill(); g.stroke();
  g.fillStyle='#dff4ff'; for(let i=0;i<12;i++){ const a=i/12*TAU, inr=0.55-op*0.12; g.beginPath(); g.moveTo(Math.cos(a-0.18)*rx*0.95,Math.sin(a-0.18)*ry*0.95+my); g.lineTo(Math.cos(a)*rx*inr,Math.sin(a)*ry*inr+my); g.lineTo(Math.cos(a+0.18)*rx*0.95,Math.sin(a+0.18)*ry*0.95+my); g.closePath(); g.fill(); }
  m3sGlowG(g,0,my+4,20+op*8,glow,0.8); g.fillStyle=`rgb(${glow})`; m3sDot(g,0,my+4,5+op*2); g.fill();
  for(const s of [-1,1]) pxEye(g,s*24,-42,s,{rx:5,ry:5,r:3,white:'#fff8e8',iris:'#2a1808',skin:'#e6bc7c',lash:O});
  pxBrows(g,{x:24,w:5,y:-51,col:'#8a5a2a',lw:3,arch:2,busy:true});
  pxExtras(g,{ex:24,ey:-42,erx:5,ery:5,cheek:-34,top:-56,side:62,no:{blush:true},halo:-74});
  g.restore(); }
// Lord Fanfare, the peacock of the Mirror Temple (frosted white under the spell, his colours back after): his fan opens
// wide when he is proud or glad and folds when he is sorry; a crest, an eye with a lid and brow, and a beak
function m3sFaceFan(g){ const O='#14241e', X=PX, n=X.n, after=!!(G&&G.flags&&G.flags.m_sn&&G.flags.m_sn.m_mirror_won), op=pxOpenMouth();
  const fan=n==='proud'||n==='happy'||n==='laughing'||n==='surprised'||n==='angry'||n==='furious'?1.08:n==='sad'||n==='ashamed'||n==='defeated'||n==='scared'?0.78:1;
  g.save(); pxPose(g,{py:64}); pxAura(g,0,0,86); g.lineJoin='round'; g.lineWidth=3; g.strokeStyle=O;
  for(let i=0;i<9;i++){ const a=-Math.PI/2+(-Math.PI/2+i/8*Math.PI)*fan; const x=Math.cos(a)*76*fan, y=Math.sin(a)*70*fan+30; g.fillStyle=after?'#3ab070':'#c8e0f0'; g.beginPath(); g.ellipse(x,y,14,24,a+Math.PI/2,0,TAU); g.fill(); g.stroke(); g.fillStyle=after?'#e8c03a':'#7a3ad8'; m3sDot(g,x,y,6); g.fill(); }
  g.fillStyle=after?'#2a8ab0':'#d8e8f4'; g.beginPath(); g.ellipse(0,26,26,36,0,0,TAU); g.fill(); g.stroke();
  g.fillStyle=after?'#3a9ad0':'#eef6ff'; g.beginPath(); g.ellipse(0,-22,20,22,0,0,TAU); g.fill(); g.stroke();
  // the beak (side on): the lower half drops open
  g.fillStyle='#d89820'; g.save(); g.translate(16,-18); g.rotate(op*0.5); g.beginPath(); g.moveTo(0,0); g.lineTo(16,2); g.lineTo(0,6); g.closePath(); g.fill(); g.stroke(); g.restore();
  g.fillStyle='#f0b030'; g.save(); g.translate(16,-18); g.rotate(-op*0.2); g.beginPath(); g.moveTo(0,-4); g.lineTo(18,2); g.lineTo(0,3); g.closePath(); g.fill(); g.stroke(); g.restore();
  g.save(); g.translate(5,0); pxEye(g,0,-25,-1,{rx:5.8,ry:6.4,r:3.8,white:'#fff',iris:O,skin:after?'#3a9ad0':'#eef6ff',lash:O}); pxBrows(g,{x:0,w:6,y:-35,col:after?'#1a5a80':'#8aa0b8',lw:3,arch:2,only:-1}); g.restore();
  g.fillStyle='#ffd24a'; for(let i=-2;i<=2;i++){ const t=pxEarTurn(0.3,0.5); g.save(); g.translate(i*7,-42); g.rotate(i*0.12-t*0.3*Math.sign(i||1)); g.beginPath(); g.moveTo(0,0); g.lineTo(-3,-10-t*4); g.lineTo(3,-10-t*4); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  pxExtras(g,{ex:8,ey:-26,erx:4.6,ery:5,cheek:-16,top:-44,side:22,no:{blush:!(X.blush>1)},halo:-66});
  g.restore(); }
// Duke Umberwing, the moth with a monocle: dark eyes with lids, brows, antennae that droop or stand, a mouth
function m3sFaceDuke(g){ const O='#160e20', X=PX;
  g.save(); pxPose(g,{py:64}); pxAura(g,0,-6,86); g.lineJoin='round'; g.lineWidth=3; g.strokeStyle=O;
  const wf=pxEarTurn(0.15,0.25);
  for(const s of [-1,1]){ g.save(); g.translate(s*12,10); g.rotate(-s*wf); g.fillStyle='#6a5a7e'; g.beginPath(); g.moveTo(0,0); g.bezierCurveTo(s*28,-60,s*74,-50,s*68,0); g.bezierCurveTo(s*58,30,s*18,34,0,20); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#d8d0e8'; m3sDot(g,s*42,-16,8); g.fill(); g.stroke(); g.restore(); }
  g.fillStyle='#5a2a5a'; g.beginPath(); g.moveTo(-44,74); g.quadraticCurveTo(-40,20,0,24); g.quadraticCurveTo(40,20,44,74); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#9a8aae'; g.beginPath(); g.ellipse(0,-6,30,32,0,0,TAU); g.fill(); g.stroke();
  for(const s of [-1,1]) pxEye(g,s*12,-8,s,{rx:8,ry:9,r:3,white:'#241a30',iris:'#3a2c4a',skin:'#9a8aae',lash:O});
  pxBrows(g,{x:12,w:6,y:-21,col:'#5a4a6e',lw:3,arch:2.4,busy:true});
  pxMouth(g,{y:12,w:6,c:4,col:O,lw:2.4,dark:'#2a1424'});
  g.strokeStyle='#e8e0ff'; g.lineWidth=2.6; m3sDot(g,12,-8,12); g.stroke(); g.beginPath(); g.moveTo(22,-2); g.lineTo(30,26); g.stroke();
  const ear=X.ear||0; g.strokeStyle='#d8ccf0'; g.lineWidth=2.2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*8,-34); g.quadraticCurveTo(s*(14+(ear<0?-ear*8:0)),-66+(ear<0?-ear*18:-ear*4),s*(34+(ear<0?-ear*6:0)),-72+(ear<0?-ear*34:-ear*6)); g.stroke(); }
  pxExtras(g,{ex:12,ey:-8,erx:8,ery:9,cheek:4,top:-34,side:30,no:{blush:!(X.blush>1)},halo:-80});
  g.restore(); }
// Lady Zapp, the Lantern Eel: a long glowing eel with a lamp on her chin, lashes (she is very taken with herself),
// sparks when she is cross, and her glow goes quiet when she is beaten
function m3sFaceZapp(g){ const O='#0a2030', X=PX, n=X.n, hot=n==='angry'||n==='furious', quiet=n==='sad'||n==='defeated'||n==='ashamed'||n==='peaceful';
  g.save(); pxPose(g,{py:62}); pxAura(g,0,-6,86); g.lineJoin='round'; g.lineCap='round';
  // her body curls up behind her head
  g.strokeStyle='#1e6a8a'; g.lineWidth=26; g.beginPath(); g.moveTo(-60,70); g.quadraticCurveTo(-70,10,-36,-10); g.stroke(); g.strokeStyle='#2a8ab0'; g.lineWidth=14; g.stroke();
  g.fillStyle='#7ad8f0'; for(const s of [-1,1]){ g.save(); g.translate(s*34,-8); g.rotate(-s*pxEarTurn(0.3,0.5)); g.beginPath(); g.moveTo(0,-10); g.quadraticCurveTo(s*22,-24,s*26,2); g.quadraticCurveTo(s*16,4,0,10); g.closePath(); g.fill(); g.strokeStyle=O; g.lineWidth=2.4; g.stroke(); g.restore(); }
  g.fillStyle='#2a8ab0'; g.beginPath(); g.ellipse(0,0,36,34,0,0,TAU); g.fill(); g.strokeStyle=O; g.lineWidth=3; g.stroke();
  g.fillStyle='#4ab0d0'; g.beginPath(); g.ellipse(0,14,26,18,0,0,TAU); g.fill();
  g.fillStyle='rgba(200,250,255,.55)'; for(const [x,y] of [[-20,-18],[-6,-26],[10,-24],[22,-14]]){ m3sDot(g,x,y,2.4); g.fill(); }
  for(const s of [-1,1]) pxEye(g,s*13,-6,s,{rx:7.4,ry:7.8,r:4.4,white:'#fff',iris:'#1a3a6a',pupil:'#081428',skin:'#2a8ab0',lash:O});
  // long lashes
  g.strokeStyle=O; g.lineWidth=2; for(const s of [-1,1]) for(const k of [0,1,2]){ const a=-Math.PI/2+s*(0.55+k*0.35); g.beginPath(); g.moveTo(s*13+Math.cos(a)*7.4,-6+Math.sin(a)*7.8*Math.max(0.3,pxOpen())); g.lineTo(s*13+Math.cos(a)*12,-6+Math.sin(a)*12*Math.max(0.3,pxOpen())); g.stroke(); }
  pxBrows(g,{x:13,w:6,y:-19,col:O,lw:2.6,arch:3.4,busy:true});
  pxMouth(g,{y:18,w:7,c:4.5,col:O,lw:2.6,dark:'#081a2a',tongue:'#e07a9a'});
  // the lantern on her chin
  g.strokeStyle='#1e6a8a'; g.lineWidth=2.4; g.beginPath(); g.moveTo(0,30); g.quadraticCurveTo(8,40,4,48); g.stroke();
  const lc=hot?'255,240,140':quiet?'170,210,230':'210,250,255'; m3sGlowG(g,4,52,quiet?14:24,lc,quiet?0.4:0.8); g.fillStyle=`rgb(${lc})`; m3sDot(g,4,52,5); g.fill();
  if(hot){ g.strokeStyle='#fff6a0'; g.lineWidth=2.2; for(const [x,y,a] of [[-44,-26,0.4],[44,-30,2.6],[-40,24,-0.6],[46,16,3.6]]){ g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*6,y+Math.sin(a)*6-4); g.lineTo(x+Math.cos(a)*3,y+Math.sin(a)*3+2); g.lineTo(x+Math.cos(a)*10,y+Math.sin(a)*10); g.stroke(); } }
  pxExtras(g,{ex:13,ey:-6,erx:7.4,ery:7.8,cheek:8,top:-30,side:36,halo:-60});
  g.restore(); }
// Big Fin, the sandshark matriarch: a scarred fin, a gold tooth, small fierce eyes and a grin full of teeth
function m3sFaceFin(g){ const O='#2a2a34', X=PX, m=X.m||'neutral';
  g.save(); pxPose(g,{py:60}); pxAura(g,0,-2,86); g.lineJoin='round';
  g.fillStyle='#e8c88a'; g.beginPath(); g.ellipse(0,58,70,20,0,0,TAU); g.fill();
  g.save(); g.translate(0,-30); g.rotate(-pxEarTurn(0.15,0.3)); g.fillStyle='#8a92a2'; g.beginPath(); g.moveTo(-14,4); g.quadraticCurveTo(2,-34,22,-46); g.quadraticCurveTo(14,-20,18,6); g.closePath(); g.fill(); g.strokeStyle=O; g.lineWidth=3; g.stroke();
  g.strokeStyle='#e8e0d8'; g.lineWidth=2; g.beginPath(); g.moveTo(-2,-14); g.lineTo(12,-24); g.moveTo(2,-8); g.lineTo(14,-16); g.stroke(); g.restore();
  g.fillStyle='#a0a8b8'; g.beginPath(); g.ellipse(0,4,50,40,0,0,TAU); g.fill(); g.strokeStyle=O; g.lineWidth=3; g.stroke();
  g.fillStyle='#e6e8ee'; g.beginPath(); g.ellipse(0,24,38,20,0,0,TAU); g.fill();
  g.strokeStyle='rgba(60,60,80,.45)'; g.lineWidth=2; for(const s of [-1,1]) for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(s*(36+i*4),-2+i*6); g.lineTo(s*(40+i*4),8+i*6); g.stroke(); }
  for(const s of [-1,1]) pxEye(g,s*20,-8,s,{rx:5.2,ry:5.2,r:3.6,white:'#f4f6fa',iris:'#10141e',skin:'#a0a8b8',lash:O});
  pxBrows(g,{x:20,w:7,y:-18,col:'#5a6070',lw:3.6,arch:1.6});
  crWideMouth(g,{y:20,w:30,d:12,col:O,lw:3,teeth:true,inside:'#4a1418',tc:'#f6f2e6'});
  if(!pxOpenMouth()&&(m==='neutral'||m==='smile'||m==='smirk'||m==='set')){ g.fillStyle='#f0c040'; g.strokeStyle='#8a6010'; g.lineWidth=1; g.beginPath(); g.moveTo(8,25+(m==='smile'?3:1)); g.lineTo(11,33); g.lineTo(14,25+(m==='smile'?3:1)); g.closePath(); g.fill(); g.stroke(); }
  pxExtras(g,{ex:20,ey:-8,erx:5.2,ery:5.2,cheek:8,top:-34,side:48,no:{blush:true},halo:-80});
  g.restore(); }
// Prism, the glass lion: a mane of crystal spikes with rainbows in it, eyes, brows, a muzzle; he cracks all over when
// he is beaten (defeated) and his mane stands out when he is proud
function m3sFacePrism(g){ const O='#3a5a7a', X=PX, n=X.n, mane=n==='proud'||n==='angry'||n==='furious'||n==='surprised'?1.12:n==='sad'||n==='defeated'||n==='ashamed'?0.88:1;
  g.save(); pxPose(g,{py:62}); pxAura(g,0,-4,88); g.lineJoin='round';
  const rb=['255,140,160','255,210,120','170,240,170','140,200,255','200,160,255'];
  for(let i=0;i<16;i++){ const a=i/16*TAU, L=(52+(i%2)*10)*mane; g.fillStyle=`rgba(${rb[i%5]},.55)`; g.beginPath(); g.moveTo(Math.cos(a-0.2)*30,Math.sin(a-0.2)*30-2); g.lineTo(Math.cos(a)*L,Math.sin(a)*L-2); g.lineTo(Math.cos(a+0.2)*30,Math.sin(a+0.2)*30-2); g.closePath(); g.fill(); g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=1.6; g.stroke(); }
  g.fillStyle='rgba(225,245,255,.92)'; g.beginPath(); g.ellipse(0,0,34,36,0,0,TAU); g.fill(); g.strokeStyle=O; g.lineWidth=2.6; g.stroke();
  g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-12,-18,10,5,-0.5,0,TAU); g.fill();
  for(const s of [-1,1]){ g.fillStyle='rgba(225,245,255,.95)'; g.beginPath(); g.ellipse(s*26,-28,8,9,0,0,TAU); g.fill(); g.stroke(); }
  for(const s of [-1,1]) pxEye(g,s*13,-6,s,{rx:6.2,ry:6.6,r:3.8,white:'#fff',iris:'#4a8ac8',pupil:'#1a2a4a',skin:'rgba(225,245,255,1)',lash:O});
  pxBrows(g,{x:13,w:6,y:-17,col:'#6a9ac0',lw:3,arch:2.6});
  g.fillStyle='rgba(240,250,255,.95)'; g.beginPath(); g.ellipse(0,16,16,12,0,0,TAU); g.fill(); g.strokeStyle=O; g.lineWidth=2; g.stroke();
  g.fillStyle='#b8a0e8'; g.beginPath(); g.moveTo(-5,9); g.lineTo(5,9); g.lineTo(0,14); g.closePath(); g.fill();
  pxMouth(g,{y:20,w:7,c:4,col:O,lw:2.4,dark:'#2a3a5a',tongue:'#f0a0c0'});
  if(n==='defeated'||n==='hurt'){ g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=1.4; for(const [x,y,a] of [[-20,-20,0.6],[16,-26,2.2],[22,8,3.6],[-24,14,5.2],[0,-32,1.4]]){ g.beginPath(); g.moveTo(x,y); let px=x, py=y; for(let k=0;k<3;k++){ px+=Math.cos(a+k*0.9)*6; py+=Math.sin(a+k*0.9)*6; g.lineTo(px,py); } g.stroke(); } }
  pxExtras(g,{ex:13,ey:-6,erx:6.2,ery:6.6,cheek:6,top:-34,side:36,halo:-72});
  g.restore(); }
// Great-grandma Greatshell, the huge old turtle in the Sunken Garden (Shellby's great-grandma): barnacles and moss on her
// shell, heavy old lids, white brows and a slow smile
function m3sFaceShell(g){ const O='#2a3a1a', X=PX;
  g.save(); pxPose(g,{py:64}); pxAura(g,0,0,80); g.lineJoin='round';
  g.fillStyle='#6a7a5a'; g.beginPath(); g.ellipse(0,44,74,34,0,Math.PI,0); g.fill(); g.strokeStyle='#3a4a2a'; g.lineWidth=3; g.stroke();
  g.fillStyle='#4a8a3a'; for(const [x,y,r] of [[-54,34,8],[-36,20,6],[44,28,7],[60,40,5],[20,16,5]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  g.fillStyle='#e8e0cc'; for(const [x,y] of [[-46,28],[-24,18],[34,20],[52,32],[-60,42]]){ g.beginPath(); g.arc(x,y,3.4,0,TAU); g.fill(); g.strokeStyle='#8a8070'; g.lineWidth=1.2; g.stroke(); }
  g.fillStyle='#8aa06a'; g.beginPath(); g.ellipse(0,0,36,32,0,0,TAU); g.fill(); g.strokeStyle='#4a5a2a'; g.lineWidth=2.6; g.stroke();
  g.fillStyle='rgba(40,60,20,.2)'; for(const [x,y] of [[-20,-18],[18,-20],[0,-26],[-24,6],[24,8]]){ g.beginPath(); g.arc(x,y,3.2,0,TAU); g.fill(); }
  g.strokeStyle='rgba(60,70,40,.45)'; g.lineWidth=1.4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*22,-2); g.lineTo(s*28,0); g.moveTo(s*22,2); g.lineTo(s*27,5); g.stroke(); }
  for(const s of [-1,1]) pxEye(g,s*13,-6,s,{rx:7,ry:6.6,r:3.8,white:'#fbfbf2',iris:'#2a2a10',skin:'#7a906a',lash:O});
  // old heavy lids: a little lower than anyone's, always
  if(pxOpen()>0.05&&!pxWince(1)){ g.fillStyle='#7a906a'; for(const s of [-1,1]){ g.save(); g.beginPath(); g.ellipse(s*13,-6,7.6,7.2,0,0,TAU); g.clip(); g.fillRect(s*13-9,-15,18,Math.max(3,6-(pxOpen()-1)*8)); g.restore(); g.strokeStyle=O; g.lineWidth=1.8; g.beginPath(); g.moveTo(s*13-7,-15+Math.max(3,6-(pxOpen()-1)*8)); g.lineTo(s*13+7,-15+Math.max(3,6-(pxOpen()-1)*8)); g.stroke(); } }
  pxBrows(g,{x:13,w:7,y:-17,col:'#f0eee0',lw:3.4,arch:2});
  pxMouth(g,{y:14,w:10,c:5,col:O,lw:2.6,dark:'#3a1a10'});
  pxExtras(g,{ex:13,ey:-6,erx:7,ery:6.6,cheek:6,top:-28,side:36,halo:-58});
  g.restore(); }
const M3S_PORT={
  m_puffington:{bg:'#13344a',f:m3sFacePuff}, m_octavia:{bg:'#160c2a',f:m3sFaceOcto}, m_gravelgut:{bg:'#2a1c10',f:m3sFaceGut},
  m_fanfare:{bg:'#12302a',f:m3sFaceFan}, m_umberwing:{bg:'#1c1628',f:m3sFaceDuke},
  m_zapp:{bg:'#0e2a3e',f:m3sFaceZapp}, m_bigfin:{bg:'#2c2618',f:m3sFaceFin}, m_prism:{bg:'#1a2a40',f:m3sFacePrism}, m_greatshell:{bg:'#16281e',f:m3sFaceShell},
  m_sandy:{bg:'#2c2014',f:g=>{ const O='#2a1a0c'; g.lineJoin='round'; g.lineWidth=3; g.strokeStyle=O;
    g.fillStyle='#e6c48a'; g.beginPath(); g.ellipse(0,10,64,56,0,0,TAU); g.fill(); g.stroke();
    g.strokeStyle='#c8a068'; g.lineWidth=2; for(const y of [-20,0,20,40]){ g.beginPath(); g.ellipse(0,y,58,8,0,0.15,Math.PI-0.15); g.stroke(); } g.strokeStyle=O; g.lineWidth=3;
    for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*30,-6); g.quadraticCurveTo(s*20,-14,s*10,-6); g.stroke(); }
    g.fillStyle='#f0a8a0'; for(const s of [-1,1]){ m3sDot(g,s*36,12,7); g.fill(); }
    g.beginPath(); g.moveTo(-12,22); g.quadraticCurveTo(0,30,12,22); g.stroke(); }},
  f_glaciar:{bg:'#14304a',f:g=>{ if(typeof faceDragon==='function') faceDragon(g,{skin:'#bfe6f8',dark:'#6aa8d0',snout:'#e6f6ff',horn:'#ffffff',eye:'#6ad0ff',k:0.86,frill:true}); }},
  f_mags:{bg:'#3a2414',f:g=>{ if(typeof facePerson==='function') facePerson(g,{skin:'#f2c8a6',hair:'#e8762a',hairdo:'wild',outfit:'overalls',shirt:'#e8d8b8',low:'#3a5a6a',goggles:true,oil:true,soot:true,freckles:true},false); }}
};
for(const k in M3S_PORT) if(!EVPORT[k]) EVPORT[k]=M3S_PORT[k];

// ---------- 2. people the main story needs. x3_people owns them (CAST, homes, talk); when a run has no x3_people yet,
// a stand-in stands at the bible's spot so the main path still works (M3S.fb). Real CAST/SPECIAL entries replace them.
const M3S_PEOPLE={
  m_dabble:{name:'Mayor Dabble Floatwell',col:'#e8c03a',at:[2300,64760],look:{skin:'#e6b494',hair:'#8a5a2a',hairdo:'curly',outfit:'coat',shirt:'#3a7a8a',low:'#2a5a6a',hat:'top',hatc:'#3a5a7a',sash:'#e8c03a',stache:'big',build:'wide',blush:true}},
  m_winnie:{name:'Old Winnie the Tidewife',col:'#9ad0c8',at:[2050,64950],look:{skin:'#9a6444',hair:'#efeae0',hairdo:'long',outfit:'robe',shirt:'#3a6a6a',shawl:'#9ad0c8',hat:'fancy',hatc:'#f0d0b0',necklace:'#f0e0c0',build:'old',hold:'staff'}},
  m_coralia:{name:'Queen Coralia',col:'#f08080',at:[1900,67330],area:'m_coralcombe',look:{skin:'#9ad0c8',hair:'#e8c060',hairdo:'long',outfit:'dress',shirt:'#3a8a8a',tail:'#2a9a9a',hat:'crown',hatc:'#f08080',necklace:'#f0e0c0'}},
  m_kipper:{name:'Sir Kipper',col:'#8ab0f0',at:[1990,67360],area:'m_coralcombe',look:{skin:'#8ac0b0',hair:'#3a2a1a',helm:true,plume:'#f08080',outfit:'armor',tail:'#3a5a8a',hold:'spear',stache:true}},
  m_rafi:{name:'Caravan-master Rafi Sandstride',col:'#e8a030',at:[9700,67400],look:{skin:'#a87050',hair:'#1a1a1a',beard:true,outfit:'coat',shirt:'#c86a2a',low:'#7a3a1a',hat:'kerchief',hatc:'#e8c03a',sash:'#3a6aaa',build:'big'}},
  m_saffron:{name:'Saffron the Well-Warden',col:'#c0c8ff',at:[9800,67830],look:{skin:'#7c4c30',hair:'#2a1a10',hairdo:'braids',outfit:'robe',shirt:'#3a3a6a',low:'#2a2a50',shawl:'#c0c8ff',hold:'staff',earrings:true}}
};
for(const id in M3S_PEOPLE){ const P=M3S_PEOPLE[id]; if(CASTBY[id]||SPECIAL[id]) continue;
  SPECIAL[id]={id,name:P.name,col:P.col,inside:'ev',kid:false,look:P.look,lines:[S('The moon looks smaller every night. Mind how you go.','The moon gets smaller. Be careful.')]};
  if(!SPK[id]) SPK[id]={name:P.name,col:P.col}; M3S.fb[id]=true; M3S.fbAt[id]=P.at; }
// where a person is: outdoors near the story, inside their house (the door), or the bible spot
function m3sWho(id,x,y){
  const n=(AREA?AREA.npcs:G.npcs||[]).find(q=>q.id===id); if(n) return {x:n.x,y:n.y,npc:id,area:AREA?AREA.id:undefined};
  const c=CASTBY[id];
  if(c&&c.inside&&AREADEFS[c.inside]){ const d=DOORS.find(q=>q.area===c.inside); if(d) return {x:d.x,y:d.y,area:c.inside,npc:id}; }
  if(M3S.fb[id]&&M3S.fbAt[id]) return {x:M3S.fbAt[id][0],y:M3S.fbAt[id][1],npc:id};
  return {x,y,npc:id};
}
const m3sObj=(f,s,at,extra)=>Object.assign({text:S(f,s),x:at.x,y:at.y},at.area?{area:at.area}:{},at.npc?{npc:at.npc}:{},extra||{});
const m3sDunObj=(id,f,s,P)=>m3sIn(id)?{text:S(f,s),x:player.x,y:player.y,area:AREA.id}:{text:S(f,s),x:P.x,y:P.y,area:AREADEFS[id]?id:undefined};
// ---------- 3. the main story (bible/ACT4.md section 6). Every scene is STORY.<key>; M3STORY.md lists when each plays
// Chapter 1, Across the Sea (6.1): the morning after Act III, in Hearthold
m3sDef('m_intro',[
  xl('narr',`Morning in Hearthold. The Great Hearth crackles. Pim is already selling cocoa. Pebble lands on your head with two letters, and takes two coins.`,`Morning in Hearthold. Pebble lands on your head with two letters. She takes two coins.`),
  xdo(()=>{ G.coins=Math.max(0,(G.coins|0)-2); }),
  xl('maren',`(the first letter) Ash. I went out to look at the moon tonight. Then I came back in and lit an extra lantern in the window. Love, Mom.`,`(a letter) I looked at the moon tonight. Then I lit an extra lantern in the window. Love, Mom.`),
  xl('dell',`(the second letter) Ash! Dell again! The Soggy Biscuit Three is ready in Gearhaven. She has a steam paddle, a brass whistle, and a captain who has never once sunk her. That's me. It has been FIVE days.`,`Ash! It's Dell! My boat, the Soggy Biscuit Three, is ready in Gearhaven. I have not sunk her once!`),
  xl('dell',`Come to the Far Pier when you're ready to sail east. Nobody else will sail into a dark sea, so it's me or a bathtub. I've packed sandwiches. And a librarian. Long story. Dell.`,`Come to the Far Pier. We will sail east. I packed sandwiches. And a librarian. Dell.`),
  xl('tove',`East, where the moon's light fell. I'm going to hand you over to Iska for this part, Ash. She's better with the dark. I'm better with complaining about the cold.`,`East, where the moon's light fell. Iska will help you now. She is good with the dark.`),
  xl('iska',`Ash, it's Iska. Tove says the dark is my job now, and she's right. East is where the moon's light fell. We'll need a lot of lanterns.`,`Ash, it's Iska. I'll help you now, not Tove. We go east. We'll need lots of lanterns.`),
  m3sIf('narr',`Pip climbs up onto your head. Pip is far too big for your head now. Pip disagrees.`,`Pip climbs onto your head. He is too big now. Pip does not agree.`,()=>!!G.flags.pip),
  m3sIf('narr',`A shadow slides over the town. Glaciar lands outside the walls with a soft, enormous WHUMPH. Half of Hearthold faints. The other half cheers.`,`Glaciar lands outside the walls. WHUMPH! Half the town faints. The other half cheers.`,m3sGlaciar),
  m3sIf('f_glaciar',`Good morning, dumpling! I heard the word "east". I don't do fast. But I do far.`,`Good morning, dumpling! I heard "east". I'm slow. But I go far.`,m3sGlaciar),
  xc('ash',`How will you go east?`,`How will you go east?`,()=>[
    xo(`Fly with Auntie Glaciar`,`Fly with Auntie Glaciar`,{tone:'brave',cond:m3sGlaciar,fn:()=>{ G.flags.m_ship='glaciar'; },then:[
      xl('f_glaciar',`Wonderful! Climb aboard. Mind the frost on my neck, it's slippery. Hold on to a horn. Not THAT horn. The other horn.`,`Wonderful! Climb on. Hold a horn. Not THAT horn. The other one.`)]}),
    xo(`Sail with Dell from Gearhaven`,`Sail with Dell`,{fn:()=>{ G.flags.m_ship='ship'; },then:()=>m3sGlaciar()
      ?[xl('f_glaciar',`A boat! How quaint. Then I'll nap. Shout if you need me. Loudly. I'm a little deaf on the left.`,`A boat! How sweet. I will nap. Shout if you need me.`)]
      :[xl('iska',`Gearhaven is a long way from here. Fast travel to a Gearhaven shrine, then walk down to the Far Pier.`,`Gearhaven is far. Fast travel to a shrine there. Then walk to the Far Pier.`)]})])
]);
// 6.1b the voyage by ship (the first time Ash lands in Moonfall from the Far Pier)
m3sDef('m_voyage_ship',[
  xdo(()=>m3sVoy('ship')),
  xl('narr',`The Soggy Biscuit Three chugs out of Gearhaven with a toot of steam. Dell stands at the wheel in his yellow rain hat, grinning so hard his beard sticks out sideways.`,`Dell's boat toots out of Gearhaven. Dell grins so hard his beard sticks out.`),
  xl('dell',`Three days east, Ash! Past the end of every map I own! I've never been so happy or so scared!`,`Three days east, Ash! Past every map I own! I'm so happy. And so scared!`),
  xl('wren',`(green, hugging a book) I'm fine. Books don't get seasick. I'm just going to read... over the side.`,`(green, hugging a book) I'm fine. Books don't get seasick. I'll just read... over the side.`),
  xl('ash',`Sister Wren? You came outside?`,`Sister Wren? You came outside?`),
  xl('wren',`My cousin Eider wrote to me about the dragon child who thawed a whole village. I thought: if Ash can climb a mountain, I can sit on a boat. I was wrong. But I'm here.`,`My cousin wrote about you. I thought, if Ash can climb a mountain, I can sit on a boat. I was wrong. But I'm here.`),
  xl('f_mags',`(from below deck) The engine's fine! It's making that noise on purpose! Mostly! I'm the engineer now. Dell pays me in sandwiches.`,`(from below) The engine is fine! The noise is on purpose! Mostly! Dell pays me in sandwiches.`),
  m3sIf('ev_tikka',`(from the galley) Lumpy buns! Lumpy buns for everyone! Lumpy means love!`,`Lumpy buns for everyone! Lumpy means love!`,()=>G.flags.tk_come==='yes'),
  m3sAct(`On the second night the moon comes up over the sea. Two bites are missing from its edge, like a cookie.`,`On the second night the moon comes up. Two bites are gone, like a cookie.`,()=>{ if(M3S.voy) M3S.voy.moon=1; }),
  m3sAct(`Something flutters past the mast. A moth. Then another. Then a hundred, all flying east, toward the moon. Every one has two pale painted eyes on its wings.`,`A moth flies past. Then a hundred, all flying east. Each has two painted eyes.`,()=>{ if(M3S.voy) M3S.voy.moths=1; }),
  xl('iska',`They're going home to her. Follow the moths, Ash. They always know where the light is.`,`They are going home to her. Follow the moths. They know where the light is.`),
  m3sAct(`On the third morning a town comes out of the mist. It's floating.`,`On the third morning a town comes out of the mist. It floats!`,()=>{ M3S.fadeTo=0; })
]);
// 6.1c the flight with Glaciar
m3sDef('m_voyage_glaciar',[
  xdo(()=>m3sVoy('glaciar')),
  xl('narr',`Glaciar flies slowly. Very slowly. Clouds overtake her. A seagull overtakes her and looks back, smug.`,`Glaciar flies very slowly. A seagull passes her. It looks smug.`),
  xl('f_glaciar',`Isn't this lovely, dumpling? I haven't flown this far in a thousand years. My left wing's gone to sleep.`,`Isn't this lovely, dumpling? My left wing fell asleep.`),
  xl('ash',`Auntie, it's been two days.`,`Auntie, it's been two days.`),
  xl('f_glaciar',`Two days is nothing. I once took a week to turn round.`,`Two days is nothing. I once took a week to turn round.`),
  m3sAct(`On the second night the moon comes up over the sea. Two bites are missing from its edge, like a cookie.`,`On the second night the moon comes up. Two bites are gone, like a cookie.`,()=>{ if(M3S.voy) M3S.voy.moon=1; }),
  m3sAct(`Moths flutter past Glaciar's nose, hundreds of them, all flying east.`,`Hundreds of moths fly past, all going east.`,()=>{ if(M3S.voy) M3S.voy.moths=1; }),
  xl('f_glaciar',`Ugh. Moths. I can taste her on the wind. Like cold tea. Hold on, dumpling.`,`Ugh. Moths. I can taste her on the wind. Hold on, dumpling.`),
  xl('iska',`Follow the moths, Ash. They always know where the light is.`,`Follow the moths. They know where the light is.`),
  m3sAct(`On the third morning a town comes out of the mist. It's floating. Glaciar lands on its north beach and the whole beach freezes solid. The raft folk cheer. Free ice!`,`On the third morning, a floating town! Glaciar lands. The beach freezes. Free ice!`,()=>{ M3S.fadeTo=0; }),
  xl('f_glaciar',`I'll wait here, dumpling. The sun this far south is very rude. Dell's boat is a day behind us. He sent a pigeon. The pigeon was very tired.`,`I'll wait here, dumpling. Dell's boat is a day behind us. He sent a very tired pigeon.`),
  m3sIf('f_glaciar',`Oh, and Brann sends his regards. He's very brave now. He asked me to say it loudly. HE IS VERY BRAVE.`,`Brann says hello. He is VERY BRAVE now.`,()=>true)
]);
// the Glaciar route: Dell's boat comes in a day later (or the first time Ash is back in Driftwood after Drowned Lumen)
m3sDef('m_dell_late',[
  xl('narr',`A brass whistle toots across the lagoon. The Soggy Biscuit Three chugs in, one paddle squeaking, and bumps gently into the West Dock.`,`Toot toot! Dell's boat bumps into the dock.`),
  xl('dell',`Ash! We made it! Mags fixed the engine twice and Wren read the whole way. Out loud. To the fish.`,`Ash! We made it! Wren read to the fish the whole way.`),
  xl('wren',`They were a very good audience. Much better than the seagulls.`,`The fish listened well. Better than the seagulls.`),
  xdo(()=>{ G.flags.m_dell_docked=1; })
]);
// Chapter 1, Driftwood Landing (6.2)
m3sDef('m_dabble',[
  xl('m_dabble',`Welcome! Welcome to Driftwood Landing, the only town in the world that's never in the same place twice! I'm Mayor Dabble Floatwell. Mind the gap. Mind all the gaps.`,`Welcome to Driftwood Landing! This town is never in the same place twice. I'm Mayor Dabble. Mind the gaps!`),
  xl('m_dabble',`We're a raft town. We go where the tide takes us. Usually that's somewhere nice. Lately...`,`We are a raft town. We go where the tide takes us. Lately...`),
  xl('narr',`The whole town lurches. A raft full of chickens drifts past, out to sea. The chickens look worried.`,`The whole town wobbles. A raft full of chickens floats away. They look worried.`),
  xl('m_dabble',`Lately the tide's gone wobbly. Too high, then too low, then sideways. Old Winnie says it's the moon. Go and see Old Winnie. She's the one with the seashell hat. Wave to the chickens.`,`The tide has gone wobbly. Old Winnie says it's the moon. Go see her. She has a seashell hat. Wave to the chickens.`),
  xdo(()=>{ G.flags.m_dabble=1; })
]);
m3sDef('m_winnie',[
  xl('m_winnie',`Sit, sit. Mind the octopus. He's just visiting. He's been visiting for nine years.`,`Sit, sit. Mind the octopus. He is just visiting. For nine years.`),
  xl('m_winnie',`The tide follows the moon, dragon child. When the moon is round and fat, the tide is steady. When someone takes bites out of it...`,`The tide follows the moon, child. When someone bites the moon...`),
  xl('ash',`The tide goes wobbly.`,`The tide goes wobbly.`),
  xl('m_winnie',`Wobbly, he says! Ha! I like you. Yes. Wobbly. And it's happened before.`,`Wobbly! Ha! I like you. Yes. And it happened before.`),
  xl('m_winnie',`Five hundred years ago the Night Mother bit the moon for the very first time. A moth as big as the dark, my gran said. The tide went mad. It rose up and up, and it swallowed a whole city. Old Lumen, the moon city. It stood out there.`,`Long ago, the Night Mother bit the moon for the first time. The sea rose up and swallowed a city. Old Lumen, the moon city.`),
  xl('narr',`She points north. Out in the shoals, a slim white tower sticks up out of the sea, with a little balcony near the top.`,`She points north. A white tower sticks up out of the sea.`),
  xl('m_winnie',`The Lumen Spire. The rest of the city's underneath it. Drowned. The moon folk who lived there went into the sea and grew tails. Merfolk now. Lovely people. Never come up.`,`The Lumen Spire. The city is under it, drowned. Its people grew tails. Merfolk now.`),
  xl('m_winnie',`If anyone left a way to follow that moth east, it's down in that city. But you'd have to breathe water to get there.`,`The way east is down in that city. But you must breathe water to get there.`),
  xl('ash',`I can't breathe water.`,`I can't breathe water.`),
  xl('m_winnie',`Not yet, child. Not yet.`,`Not yet, child. Not yet.`),
  xl('iska',`Ember came east too, long ago, when she was young. I can feel her flame in that tower, Ash. Like a candle in a window.`,`Ember came here long ago. I can feel her flame in that tower, Ash.`),
  xl('m_winnie',`Walk the sandbars north. The last bit's deep. You'll need to swing. Do dragons swing?`,`Walk the sandbars north. The last bit is deep. You'll need to swing. Do dragons swing?`),
  xl('ash',`This one does.`,`This one does.`),
  xdo(()=>{ G.flags.m_winnie=1; })
]);
if(!M3S_PRE.wren) m3sDef('m_wren',[
  xl('wren',`Ash! Look at me. Outside. On a raft. In the SEA. I've been sick four times and I've never been happier.`,`Ash! Look at me! On a raft in the SEA! I was sick four times. I'm so happy.`),
  xl('wren',`Elder Ripple of the merfolk keeps Old Lumen's records. I can read Lumen writing, you know. Badly. Very badly. Better than anyone else up here, which is nobody.`,`The merfolk keep Old Lumen's books. I can read Lumen writing. Badly. Better than anyone else up here.`),
  xl('wren',`If you find anything with writing on it down there, bring it to me. Even if it's soggy. Especially if it's soggy.`,`If you find writing down there, bring it to me. Even if it's soggy.`)
]);
// Chapter 2, Drowned Lumen (6.3, 6.4)
m3sDef('m_lumen_channel',[xl('iska',`Deep water. Too deep to walk on. Is there anything up there you can swing to?`,`Deep water. Too deep to walk on. Is there something up there to swing to?`)]);
m3sDef('m_lumen_after',[xl('iska',`Kipper's Coralcombe is down in the reef south of Driftwood. A ring of coral with deep water in the middle. You can go down now, Ash.`,`Coralcombe is in the reef south of Driftwood. You can go down now, Ash.`)]);
m3sDef('m_coral_in',[
  xl('narr',`You dive into the ring of coral, down and down, through a curtain of bubbles, into a village made of shells.`,`You dive down through bubbles, into a village made of shells.`),
  xl('narr',`Pearl lamps glow on every doorstep. Fish swim through the windows. Lady Bubbles swims a loop round you, very pleased.`,`Pearl lamps glow. Fish swim through the windows.`),
  xl('m_kipper',`Make way! Make way! The dragon from the well, Majesty. I told you he was real.`,`Make way! The dragon from the well! I told you, Majesty.`),
  xl('m_coralia',`So you did. Let him pass, Sir Kipper. We have waited a very long time for a dragon. I thought he would be bigger.`,`Let him pass. We waited a long time for a dragon. I thought he would be bigger.`),
  xl('ash',`I'm medium!`,`I'm medium!`)
]);
m3sDef('m_coralia',[
  xl('m_coralia',`I am Coralia, Queen of the Lumenfolk. Our grandmothers' grandmothers' grandmothers lived in Lumen, under the moon, until the moth came the first time. When the city drowned, we chose the sea.`,`I am Coralia, Queen of the Lumenfolk. Long ago we lived in Lumen. When it drowned, we chose the sea.`),
  xl('ash',`Are you related to the moon?`,`Are you related to the moon?`),
  xl('m_coralia',`I hope not. I can't count that high.`,`I hope not. I can't count that high.`),
  xl('m_coralia',`Our moon-priests drove her away that night with a fire made of moonlight. A girl with horns had taught it to them, long before. We still sing about her. Sir Kipper tells me she was your family.`,`Our priests drove the moth away with moonlight fire. A girl with horns taught them. Kipper says she was your family.`),
  xl('ash',`She still is.`,`She still is.`),
  xl('m_coralia',`Then welcome home, a little bit.`,`Then welcome home, a little bit.`),
  xl('m_coralia',`You've come for the third piece of your Heart. A great grey moth, two pale moons on her wings, carried it east over the Glass Desert to the Eclipse Observatory, where Lumen's astronomers watched the moon.`,`A giant grey moth took the last piece of your Heart east. To the Eclipse Observatory, past the Glass Desert.`),
  xl('m_coralia',`And now a white moth guards it there. Our scouts saw her. White as foam, with a silver thread tied to her neck that goes all the way up into the sky.`,`Now a white moth guards it. She has a silver thread on her neck. It goes up into the sky.`),
  xl('ash',`Hush. That's Hush. I beat her. She went small. She was so cold.`,`Hush! I beat her. She went small. She was so cold.`),
  xl('m_coralia',`She is not small now.`,`She is not small now.`),
  xl('m_coralia',`The only way east is under the Reefwall, through the Sunken Gate. But the gate is... blocked. By a fish. A very full-of-himself fish. He calls himself Baron Puffington.`,`The way east is under the Reefwall, through the Sunken Gate. But a puffed-up fish is stuck in it. Baron Puffington.`),
  xl('m_kipper',`He called my seahorse a "wet pony"!`,`He called my seahorse a "wet pony"!`),
  xl('m_coralia',`Clear the gate, dragon, and the way east is yours. And go carefully. The moon gets smaller every night. We feel it in the water.`,`Clear the gate, and you can go east. Be careful. The moon gets smaller every night.`),
  m3sIf('m_coralia',`If you want to know about silver leashes, speak to Elder Ripple in the Pearl Archive. He knows more than is good for him.`,`Want to know about silver leashes? Ask Elder Ripple in the Pearl Archive.`,()=>!G.quests.m_leash),
  xdo(()=>{ G.flags.m_coral_met=1; })
]);
// Chapter 3, the Sunken Gate and the first eclipse (6.5)
m3sDef('m_mags_bombs',[
  xl('narr',`A little parcel bobs up beside you, tied to a cork. A note on it says MAGS.`,`A parcel floats up, tied to a cork. It says MAGS.`),
  xl('f_mags',`No bombs? NO BOMBS? Here. Take these. Don't thank me. Thank me a little.`,`No bombs? Here, take these. Don't thank me. Thank me a little.`),
  xdo(()=>{ if(typeof giveWeapon==='function'&&WEAPONS.bombs&&!(G.weapons&&G.weapons.bombs)) giveWeapon('bombs'); G.flags.m_bombs_given=1; })
]);
STORY.bosses=STORY.bosses||{};
// a boss's words (STORY.bosses[type].intro / .outro, which e8_foes' sites play): the story owns the words. A foes
// module that registered first (x3_foes loads before this file) keeps its silent action steps (xdo lines), appended.
function m3sBossWords(type,intro,outro){
  const B=STORY.bosses[type];
  if(!B){ STORY.bosses[type]={intro,outro}; return STORY.bosses[type]; }
  const mine=new Set([...intro,...outro]);
  const acts=L=>(Array.isArray(L)?L:[]).filter(l=>l&&!Array.isArray(l)&&!mine.has(l)&&typeof l.fn==='function'&&!l.text&&!l.opts);
  let a=[],b=[]; try{ a=acts(B.intro); b=acts(B.outro); }catch(e){}
  try{ B.intro=intro.concat(a); }catch(e){} try{ B.outro=outro.concat(b); }catch(e){}
  return B;
}
m3sDef('m_puff_intro',[
  xl('narr',`Under the Reefwall, in the green dark, the arch of the Sunken Gate is plugged. Completely. By a pufferfish. A spiky, spotty, yellow pufferfish the size of a cottage, with a tiny captain's hat and a magnificent whiskery moustache.`,`The Sunken Gate is plugged by a pufferfish. A huge, spiky, yellow one. With a tiny hat and a big moustache.`),
  xl('m_puffington',`Who goes there? State your business! Pay the toll! Admire my moustache!`,`Who goes there? Pay the toll! Admire my moustache!`),
  xl('ash',`Are you... stuck in the gate?`,`Are you stuck in the gate?`),
  xl('m_puffington',`Stuck? I'm not STUCK. I'm guarding. I am Baron Puffington, Keeper of the Sunken Gate, and I puff up like this on purpose.`,`Stuck? I am guarding! I am Baron Puffington. I puff up on purpose.`),
  xl('ash',`How long have you been puffed up?`,`How long have you been puffed up?`),
  xl('m_puffington',`Ten days. Eleven. It's hard to count in a gate.`,`Ten days. It's hard to count in a gate.`),
  xl('m_puffington',`The toll is one pie! A fish pie! ...No. Not fish. Never mind. The toll is all of it! Crabs! Get him!`,`The toll is one pie! No, not fish. The toll is all of it! Crabs, get him!`)]);
m3sDef('m_puff_outro',[
  xl('narr',`With a long, sad PFFFFFFFFT, Baron Puffington goes down like a balloon. He is now a normal-sized pufferfish. His moustache is still enormous.`,`PFFFFFT! The Baron goes down like a balloon. Now he is small. His moustache is still huge.`),
  xl('m_puffington',`Fine! The gate's open. I was getting a cramp anyway. Do you know how hard it is to hold your breath for ten days?`,`Fine! The gate is open. Try holding your breath for ten days!`),
  xl('ash',`Maybe just... don't puff up in doorways?`,`Maybe don't puff up in doorways?`),
  xl('m_puffington',`That's actually very good advice. I shall write it on my hat.`,`That is good advice. I will write it on my hat.`),
  xl('narr',`The Baron swims off into the deep with tremendous dignity, and bumps into a rock.`,`The Baron swims off, very proud. He bumps into a rock.`),
  xl('iska',`Swim through, Ash. The Glass Desert is on the other side.`,`Swim through, Ash. The Glass Desert is on the other side.`),
  xdo(()=>{ G.flags.m_puff_done=1; G.bossDone=G.bossDone||{}; G.bossDone.m_puffington=true; })]);
m3sBossWords('m_puffington',STORY.m_puff_intro,STORY.m_puff_outro);
m3sDef('m_eclipse1',[
  xdo(()=>m3sEcl('start',1)),
  xl('narr',`You climb out of the sea onto a beach that crunches. The sand here is half glass. It sparkles. It's very, very hot.`,`You climb onto a beach that crunches. The sand is half glass. It is very hot.`),
  xl('iska',`Moonfall. The place where the moon's light fell, a long time ago, and broke, and turned the sand to glass.`,`Moonfall. The moon's light fell here long ago. It turned the sand to glass.`),
  xl('ash',`It's beautiful. It's also burning my feet.`,`It's pretty. It's also burning my feet.`),
  m3sAct(`Then the light changes.`,`Then the light changes.`,()=>m3sEcl('dark')),
  m3sAct(`The sun goes out like a lamp being covered. And over the dunes rises a moth wider than the beach.`,`The sun goes dark. A huge moth flies up.`,()=>m3sEcl('rise')),
  xl('iska',`Ash. That's her.`,`Ash. That's her.`),
  m3sAct(`Her wings are grey as dust, with two pale moons painted on them. Behind her, on a thin silver thread that glints all the way up into the sky, flies a great white moth.`,`Her wings are grey, with two pale moons. Behind her flies a white moth on a silver thread.`,()=>m3sEcl('hush')),
  xl('ash',`Hush? She's big again!`,`Hush? She's big again!`),
  m3sIf('nyxara',`A dragon, all grown up. You'll burn so beautifully.`,`A dragon, all grown up. You will burn so well.`,()=>G.choices.ending==='heir'),
  xl('nyxara',`Hello, little ember. I wanted to see you with my own eyes. You are so warm.`,`Hello, little ember. You are so warm.`),
  xl('nyxara',`Don't mind me. I'm only having a snack. Come along, my Hush.`,`I am just having a snack. Come, my Hush.`),
  m3sAct(`She spreads her wings over the moon, and takes a bite. A big one.`,`She takes a big bite of the moon.`,()=>m3sEcl('bite',60)),
  xl('narr',`CRUNCH. Far behind you, the whole sea lurches, and every raft in Driftwood bumps into every other raft.`,`CRUNCH. Far away, the sea wobbles. Every raft in Driftwood bumps.`),
  m3sAct(`A hundred small pale marks on her wings open, one by one. They are eyes.`,`Lots of little marks on her wings open. They are eyes.`,()=>m3sEcl('eyes')),
  xl('nyxara',`Mmm. Now, little ember. Shall we make a deal?`,`Mmm. Now, little ember. Shall we make a deal?`),
  xl('nyxara',`Give me the two Shards in your satchel, and I'll leave your little valley alone. Forever. Your mother will never see a single moth.`,`Give me your two Shards. Then I will leave your valley alone. Forever. Your mother will never see a moth.`),
  xc('ash',`What do you say?`,`What do you say?`,[
    xo(`No way.`,`No way.`,{tone:'brave',fn:()=>{ G.choices.m_deal='refuse'; },then:[
      xl('ash',`No way. Not ever. Not for a hundred valleys.`,`No way. Not ever. Not for a hundred valleys.`),
      xl('nyxara',`Brave. How lovely. Keep them warm for me, then. Everyone comes to me in the end.`,`Brave. How lovely. Keep them warm for me. Everyone comes to me in the end.`)]}),
    xo(`Why do you want the moon so much?`,`Why do you want the moon?`,{tone:'kind',fn:()=>{ G.choices.m_deal='ask'; },then:[
      xl('ash',`Why? Why do you want the moon so much?`,`Why do you want the moon so much?`),
      xl('nyxara',`...Nobody ever asks me that.`,`Nobody asks me that.`),
      xl('nyxara',`Because the moon leaves me, little ember. Every single morning. And one day it might not come back. If I hold it very tight, it can never go.`,`The moon leaves me every morning. One day it might not come back. If I hold it tight, it can never go.`),
      xl('narr',`For one second her voice sounds small. Then it's gone.`,`For one second her voice sounds small.`),
      xl('ash',`That's sad. It's still not a reason to eat it.`,`That's sad. But you still can't eat it.`),
      xl('nyxara',`Keep them warm for me. I'll see you soon.`,`Keep them warm for me. See you soon.`)]})]),
  m3sAct(`The moon slides off the sun. Daylight comes back, thin and pale. The moth is gone, and the white one with her.`,`The moon slides off the sun. The light comes back, thin and pale. The moths are gone.`,()=>m3sEcl('leave')),
  m3sPip(`Mip... (Pip climbs down off your head and hides inside your scarf.)`,`Mip... (Pip hides in your scarf.)`),
  xl('iska',`Follow the caravan road east, Ash. Where there's a road, there are people. Where there are people, there's usually soup.`,`Follow the road east, Ash. Where there's a road, there are people. And usually soup.`),
  xdo(()=>{ G.flags.m_eclipse1=1; m3sExtra('m_deal',G.choices.m_deal==='ask'?S(`You asked Nyxara why she wants the moon. For a second she sounded small.`,`You asked Nyxara why. She sounded small.`):S(`You told Nyxara "No way", not for a hundred valleys.`,`You told Nyxara "No way".`)); })
]);
// Chapter 3, the Oasis of Sable (6.6) and the Worm Mouth (6.7)
m3sDef('m_rafi',[
  xl('m_rafi',`Ho! A dragon! Out of the sea! Now I have seen everything. Except snow. I have never seen snow.`,`Ho! A dragon, out of the sea! Now I have seen everything. Except snow.`),
  xl('ash',`I've seen SO much snow.`,`I've seen SO much snow.`),
  xl('m_rafi',`Then you are a lucky dragon! I am Rafi Sandstride, master of the Great Caravan. For three hundred years we have crossed the Glass Desert by the light of the moon.`,`Lucky dragon! I am Rafi, master of the Great Caravan. We cross the desert by moonlight.`),
  xl('m_rafi',`And yesterday the sun went out! In the middle of the day! My striders are still hiding behind their own tails.`,`And yesterday the sun went out! In the day! My striders are still hiding.`),
  xl('m_rafi',`The nights are darker every week. Last night my best strider walked into a dune. Twice. On purpose, I think. He was embarrassed about the first time.`,`The nights get darker. My best strider walked into a dune. Twice!`),
  xl('m_rafi',`The Eclipse Observatory? Beyond the Mirror Flats, up on the Heights. Nobody goes there. When the moon got sick, the Glasswall grew up around the Flats. Spikes of glass taller than towers. Nobody can climb it. Nobody can fly over it.`,`The Observatory is past the Mirror Flats. A wall of glass spikes grew around them. Nobody can climb it or fly over it.`),
  xl('m_rafi',`But the sandworms go under it. The big worms of the Burrows, north of here. Worms go under everything.`,`But the sandworms go under it. The big worms of the Burrows, north of here.`),
  xl('m_saffron',`(from the well) And something in the Burrows has gone wrong. The old king worm. He's eating glass. Worms don't eat glass. He's sick.`,`(from the well) The old king worm is sick. He is eating glass!`),
  xl('iska',`Ember left a flame with the worms too, I think. She left one everywhere that was kind to her. Even the places that ate her a little.`,`Ember left a flame with the worms too, I think. Even the places that ate her a little.`),
  xl('m_rafi',`North on the old road, to the Worm Mouth. Bring water. Bring a hat. Bring a bigger hat.`,`Go north on the old road, to the Worm Mouth. Bring water. Bring a hat. A big one.`),
  xdo(()=>{ G.flags.m_rafi=1; })
]);
m3sDef('m_worm_ring',[xl('iska',`That sand wants to swallow you, Ash! Fly over it, or Blaze it into a glass path.`,`A ring of quicksand. Fly over it, or Blaze it into glass.`)]);
m3sDef('m_burrows_after',[xl('iska',`Back to Sable, Ash. Old Kiln might like that crumb. And then the Glasswall.`,`Back to Sable, Ash. Then the Glasswall.`)]);
// Chapter 4, Mirrors: the second eclipse at Sable (6.8)
m3sDef('m_eclipse2',[
  m3sAct(`You're almost back to the oasis when the sun goes dark again.`,`You are almost back at the oasis. The sun goes dark again.`,()=>m3sEcl('start',2)),
  m3sAct(`This time she's close. Nyxara drops out of the eclipse like a black sail and lands right on top of the Moon Well's tower. The whole oasis screams. The striders hide behind their own tails.`,`This time she is close. Nyxara lands on top of the Moon Well's tower. Everyone screams.`,()=>m3sEcl('land')),
  xl('nyxara',`Oh, this is pretty. A little well full of moonlight. Like a bowl of milk, left out just for me.`,`Oh, how pretty. A little well of moonlight. Like milk, just for me.`),
  m3sAct(`She dips her long curled tongue into the Moon Well and drinks. The silver light drains out of it like bathwater.`,`She drinks from the Moon Well with her long tongue. The silver light drains away.`,()=>m3sEcl('drink')),
  xl('m_saffron',`No! NO! Get away from my well, you oversized curtain!`,`No! Get away from my well, you big curtain!`),
  xl('nyxara',`Shh.`,`Shh.`),
  m3sIf('nyxara',`And where is my little thief, hm? You took her from me, little ember. She was going to stay with me forever.`,`Where is my little thief? You took her from me, little ember.`,m3sFriend),
  m3sIf('nyxara',`My little thief did her job so well. I do wonder where she is now. Somewhere cold, I hope.`,`My little thief did so well. I wonder where she is now.`,()=>!m3sFriend()),
  m3sAct(`She looks up at the moon, still dark against the sun, and takes another bite. CRUNCH.`,`She looks up at the moon and takes another bite. CRUNCH.`,()=>m3sEcl('bite',40)),
  xl('narr',`The moon is less than half now. The day comes back grey, like old dishwater.`,`Less than half the moon is left. The day comes back grey.`),
  xl('nyxara',`One more piece, little ember. My Hush is keeping it for you, up in the Observatory. Go and fetch it. Bring me all three.`,`One more piece, little ember. My Hush has it, in the Observatory. Bring me all three.`),
  m3sAct(`She lifts off without a sound. The wind from her wings knocks down every tent in Sable. Far above, a white shape on a silver thread flies low over the oasis toward the Heights.`,`She flies off without a sound. Her wind knocks down every tent. A white moth on a silver thread flies toward the Heights.`,()=>m3sEcl('leave')),
  xl('m_rafi',`...I take back what I said about having seen everything.`,`I take it back. I had not seen everything.`),
  xl('m_saffron',`The well isn't dead. It's dim. One candle's worth of moon left in it. Go, dragon. Get your Shard.`,`The well is not dead. Just dim. Go, dragon. Get your Shard.`),
  xl('narr',`The nights keep getting darker.`,`The nights get darker.`),
  xl('iska',`The Glasswall, Ash. East of town. You're a worm now. Go under.`,`The Glasswall is east of town. You're a worm now. Go under!`),
  xdo(()=>{ G.flags.m_eclipse2=1; })
]);
// 6.8c Mom's letter (Pebble brings it after eclipse 2; on reading, Dell sails off to fetch her)
const M3S_PB3=[
  xl('maren',`Ash. You'll have all three pieces of that Heart soon, and it will need a smith.`,`You'll have all three pieces soon. The Heart will need a smith.`),
  xl('maren',`So I'm coming. Dell is sailing back to fetch me. Don't argue. You can't, it's a letter.`,`So I'm coming. Dell will fetch me. Don't argue.`),
  xl('maren',`He'll bring me round to the old pier at the foot of the Heights, on the far side of Moonfall. I'll find you. Love, Mom.`,`I'll come to the old pier by the Heights. I'll find you. Love, Mom.`),
  m3sIf('maren',`P.S. Pebble says you were talking to a moth in your sleep. Very politely. Good.`,`P.S. You talked to a moth in your sleep. Very politely.`,()=>!!G.flags.dr_m_moth),
  xl('narr',`Far away in Driftwood, the Soggy Biscuit Three toots twice and steams off west.`,`Far away, Dell's boat toots twice and sails off west.`)];
// the Mirror Flats and the Moonpath (6.8b, 6.9b)
m3sDef('m_moonpath',[
  xl('iska',`The Moonpath. Lumen's astronomers walked up it every night, by moonlight. The stairs are made of moon-glass. Without moonlight they're just air.`,`The Moonpath. Its stairs are made of moon-glass. Without moonlight they are just air.`),
  xl('ash',`There's hardly any moonlight left.`,`There's hardly any moonlight left.`),
  xl('iska',`Then make your own. Moonfire on the stairs makes them solid. Light the moon braziers at each bend, and they'll stay that way.`,`Then make your own! Moonfire makes the stairs solid. Light the braziers at each bend.`),
  m3sIf('iska',`And Ash, before we climb. Hush is up there, on that leash. Elder Ripple said something about a vault in the Drowned Library. Moonfire works underwater, you know. Just saying.`,`And Ash, Hush is up there on a leash. Ripple spoke of a vault in the Drowned Library. Moonfire works underwater!`,()=>!G.flags.m_leash_known&&!!G.quests.m_leash),
  m3sIf('iska',`And Ash, before we climb. Hush is up there, on that leash. I wonder if anyone in Moonfall knows about leashes. The merfolk know a lot of old things.`,`And Ash, Hush is up there on a leash. Maybe the merfolk know about leashes.`,()=>!G.flags.m_leash_known&&!G.quests.m_leash)
]);
m3sDef('m_moonpath_lamp',[xl('iska',`Moths and lamps. Every single time.`,`Moths and lamps. Every time.`)]);
m3sDef('m_oriel',[
  xl('oriel',`Emberblood. It's Oriel. The crags are quiet without you. All five of us are with you up there. Even the one who complains about the cold.`,`It's Oriel. All five of us are with you up there. Even the one who complains about the cold.`),
  xl('tove',`I HEARD that.`,`I HEARD that.`),
  xdo(()=>{ G.flags.m_oriel=1; })
]);
// Chapter 5, the Eclipse Observatory (6.10)
m3sDef('m_obs_in',[
  xl('narr',`Inside the Observatory everything ticks. Brass planets on brass arms turn slowly overhead. Star maps cover the walls. Somewhere far above, something huge creaks, like a door the size of the sky.`,`Inside, everything ticks. Brass planets turn overhead. Star maps cover the walls. Far above, something huge creaks.`),
  m3sAct(`Through a slit in the dome you can see the moon. As you watch, a shadow crosses it. CRUNCH. What's left is a thin silver curl, like a fingernail.`,`Through the dome you see the moon. A shadow crosses it. CRUNCH. Only a thin curl is left.`,()=>{ m3sMoon(20); m3sJ('m_bite','hit'); shake(6); }),
  xl('narr',`The nights keep getting darker.`,`The nights get darker.`),
  xl('iska',`The Eclipse Dial. The astronomers could turn the whole dome to watch the sun, or the moon, or the eclipse. Each one changes the light in here. Each one changes what's real.`,`The Eclipse Dial. Sun, moon or eclipse. Each one changes the light in here. And what is real.`),
  xl('ash',`What's real changes?`,`What's real changes?`),
  xl('iska',`You'll see. Turn the dial and watch what the room does.`,`You'll see. Turn the dial and watch.`),
  xdo(()=>{ G.flags.m_obs_in=1; })
]);
// 6.11 Hush, the Moon Shard, and the choice
m3sDef('m_hush_intro',[
  xl('narr',`Under the great dome, on a floor of brass rings, a huge white moth sits very still. Frost glitters in her fur. A silver thread runs from her neck down to two knots in the floor, then straight up through the open dome into the dark.`,`Under the dome sits a huge white moth. Frost glitters in her fur. A silver thread runs from her neck to the floor, then up into the dark.`),
  xl('narr',`Beside her, in a little brass cradle, something glows silver. The Moon Shard.`,`Beside her, something glows silver. The Moon Shard.`),
  xl('f_hush',`You again. Loud one. I flew home, like you said. I told her you were coming.`,`You again. I flew home. I told her you were coming.`),
  xl('ash',`Hush. You came back.`,`Hush. You came back.`),
  xl('f_hush',`I flew to the Mother, small and cold. She made me big again. "You came back small," she said. "Never again." Then she gave me this.`,`I flew to the Mother, small and cold. She made me big again. "Never small again," she said. Then she gave me this.`),
  xl('narr',`The silver leash glints. Somewhere far above, something tugs it, gently. Hush flinches.`,`The silver leash glints. Far above, something tugs it. Hush flinches.`),
  xl('f_hush',`The Mother brought the Shard here herself. They all go up to her, in the end.`,`The Mother brought the Shard here. They all go up to her, in the end.`),
  xl('f_hush',`I'm to keep it until you bring the other two. Then the Mother gets all three. Shhh. Don't be loud about it.`,`I keep it until you bring the other two. Then the Mother gets all three. Shhh.`),
  m3sIf('c_vesper',`Hi, moth. Remember the Dreadgate? I brought more fire bombs.`,`Hi, moth. Remember me? I brought more fire bombs.`,()=>!!G.flags.m_vesper_ally),
  m3sIf('m_esme',`(from the stairs) Lamplighters! Poles up! Wicks lit!`,`(from the stairs) Lamplighters! Poles up! Wicks lit!`,()=>!!G.flags.m_lamps_ally),
  xl('f_hush',`Shhhhhhhhh.`,`Shhhhhhhhh.`)
]);
m3sDef('m_hush_out',[
  m3sAct(`Hush sinks down onto the brass floor and folds her wings.`,`Hush sinks to the floor and folds her wings.`,()=>{ m3sHushFxAt(null); m3sHushPose('down'); }),
  xl('f_hush',`Take it. It was never mine. Nothing is ever mine.`,`Take it. It was never mine. Nothing is ever mine.`),
  xdo(()=>{ if(!(G.items.m_shard3>0)) giveItems({m_shard3:1}); G.flags.m_hush_done=1; }),
  xl('narr',`The Moon Shard is cold, and then, in your claws, warm.`,`The Moon Shard is cold. Then, in your claws, warm.`),
  xl('iska',`Ash. If you leave her tied, the Mother will pull her home and keep her cold forever. If you cut her loose, she's free. Free to go anywhere. Even away from you.`,`Ash. If you leave her tied, the Mother keeps her cold forever. If you cut her free, she can go anywhere. Even away from you.`),
  m3sIf('iska',`But moon-silk won't cut. Not with claws, not with fire. Somebody in Moonfall might have known how. I don't.`,`But moon-silk won't cut. Not with claws or fire. Someone in Moonfall might know how. I don't.`,()=>!G.flags.m_leash_known),
  m3sIf('iska',`You know how. Gently. Like the Book said.`,`You know how. Gently. Like the Book said.`,()=>!!G.flags.m_leash_known),
  xc('ash',`Hush lies on the brass floor. The silver leash is still tied to her neck, pulling her up toward the dark.`,`Hush is hurt. The silver leash pulls her up.`,()=>[
    xo(`Cut the leash`,`Cut the leash`,{tone:'kind',cond:()=>!!G.flags.m_leash_known,fn:()=>{ G.choices.m_hush='free'; },then:[
      m3sAct(`You breathe Moonfire on the first knot, as softly as you'd blow on hot soup. The silver thread melts like frost on a window. Then the second knot.`,`You breathe soft Moonfire on the knots, like blowing on soup. The silver thread melts.`,()=>m3sHushPose('knots')),
      m3sAct(`You cut the leash. Hush shivers, stretches her wings, and floats up out of the Observatory, free and glowing faintly. She doesn't look back. Then she does, once.`,`You cut the leash. Hush flies away, free. She looks back once.`,()=>m3sHushPose('free')),
      xl('f_hush',`Shhh. Thank you. Quietly.`,`Thank you. Quietly.`)]}),
    xo(`Leave the leash on`,`Leave the leash on`,{tone:'brave',fn:()=>{ G.choices.m_hush='foe'; },then:[
      xl('ash',`Leave the leash on. If she's free, the Mother can follow her to us.`,`If she is free, the Mother can follow her to us.`),
      m3sAct(`You take the Shard. The leash tightens, and Hush breaks into a hundred little white moths that flutter up the silver thread to their Mother.`,`You take the Shard. Hush turns into little moths and flies up to the Mother.`,()=>m3sHushPose('foe')),
      xl('f_hush',`(far above, very small) You're careful. She isn't.`,`You're careful. She isn't.`)]})]),
  xdo(()=>{ m3sExtra('m_hush',G.choices.m_hush==='free'?S(`You melted Hush's silver leash with the gentlest Moonfire, and she flew away free.`,`You cut Hush's leash. She flew away free.`):S(`You took the Moon Shard and left Hush on her leash. The Mother pulled her home.`,`You left Hush on her leash. The Mother took her home.`)); m3sHushAfter(); })
]);
// the Final Chapter, the Ember Heart (6.12): in room q, the Eclipse Lens
m3sDef('m_reforge',[
  xl('narr',`At the very top of the Observatory, under the great dome, lies the Eclipse Lens: a disc of moon-glass as big as a pond, set in brass, pointing at the sky.`,`At the top lies the Eclipse Lens: a disc of moon-glass as big as a pond.`),
  xl('iska',`This is where Lumen watched the moon. And this, Ash, is where your Heart gets mended. You'll need a blacksmith, though.`,`Here your Heart gets fixed. You'll need a blacksmith, though.`),
  m3sAct(`Footsteps on the stairs. Lots of footsteps. And puffing. A lot of puffing.`,`Footsteps on the stairs. And lots of puffing.`,()=>m3sMomIn()),
  xl('maren',`Ash? ASH! Oh, thank goodness. Those stairs are made of MOONLIGHT. Do you know how hard it is to climb moonlight with a hammer?`,`Ash? ASH! Those stairs are made of MOONLIGHT. It's hard to climb moonlight with a hammer!`),
  xdo(()=>{ G.flags.m_maren=1; G.flags.m_dell_away=0; G.flags.m_dell_pier=1; }),
  xl('ash',`MOM?!`,`MOM?!`),
  xl('narr',`Mom drops the hammer and hugs you. Then she holds you at arm's length and looks at you. Then she hugs you again.`,`Mom drops her hammer and hugs you. She looks at you. Then she hugs you again.`),
  xl('maren',`Dell's boat is faster than it looks. He's down at the old pier, minding the boat. And the sandwiches.`,`Dell is down at the old pier with the boat. And the sandwiches.`),
  m3sIf('maren',`Tikka made you a bun. It's lumpy. She says lumpy means love.`,`Tikka made you a bun. It's lumpy. Lumpy means love.`,()=>G.flags.tk_come==='yes'),
  xl('quill',`(arriving last, behind a telescope bigger than she is) The Eclipse Observatory! My old teacher, Professor Lumley, was its very last astronomer. I always meant to visit. The end of the world seemed like a good excuse.`,`(with a huge telescope) The Eclipse Observatory! My old teacher worked here. The end of the world is a good reason to visit.`),
  xl('maren',`Right. Shards. Show me.`,`Right. Shards. Show me.`),
  xl('narr',`You tip the three Shards out of your satchel: violet, ice-blue and silver. Mom turns each one over in her fingers, the way she checks a horseshoe.`,`You tip out the three Shards: violet, ice-blue and silver. Mom checks each one.`),
  xl('maren',`Hand them here. Broken things come into my forge every day, and not one of them leaves broken.`,`Give them here. I fix broken things.`),
  xl('maren',`Here's how. Set them on the Lens. You breathe, the hottest breath you've got, then the coolest. I hammer. Three times. Gently. GENTLY. Like Bertram's oven.`,`Set them on the Lens. You breathe hot, then cool. I hammer three times. GENTLY.`),
  xl('narr',`You set the three Shards on the Lens. They slide together and almost fit, like a puzzle whose edges have been worn soft.`,`You set the Shards on the Lens. They almost fit, like a puzzle.`),
  xl('narr',`You breathe Blaze into the Lens, blue and hot. Then Moonfire, silver and cool. The Lens catches the last of the eclipse light and throws it all back a hundred times brighter.`,`You breathe hot Blaze, then cool Moonfire. The Lens shines a hundred times brighter.`),
  xl('narr',`Gold and silver fire wrap round the Shards. They glow. They hum. Then they sing: one clear note, the way a lantern would sound, if a lantern could sing.`,`Gold and silver fire wrap the Shards. They glow. They hum. They sing one clear note.`),
  xl('maren',`Keep breathing. Here we go.`,`Keep breathing. Here we go!`)
]);
m3sDef('m_reforge2',[
  xl('narr',`TING. TING. TING.`,`TING. TING. TING.`),
  xl('narr',`In the middle of the Lens sits a warm stone the size of a plum: an orange core, with three glowing seams round it, violet, ice-blue and silver. It's beating, softly, like a heart.`,`On the Lens sits a warm stone with three glowing lines. It beats softly, like a heart.`),
  xdo(()=>m3sHeartWhole()),
  xl('ash',`The Ember Heart. It's whole again.`,`The Ember Heart. It's whole again.`),
  xl('maren',`Of course it is. You did the breathing. I just hit it.`,`Of course. You did the breathing. I just hit it.`),
  xl('nyxara',`(from very far away) Yes. Make it whole. A cracked heart can't burn, little ember. A whole one can.`,`(far away) Yes. Make it whole. A whole heart can burn.`),
  xl('ash',`Why does she sound happy about this?`,`Why is she happy about this?`),
  xl('maren',`...I don't like that. I don't like that at all.`,`I don't like that. Not at all.`),
  m3sPip(`Mip. (Pip curls up on the warm Heart and falls asleep at once, glowing a little.)`,`Mip. (Pip falls asleep on the warm Heart.)`),
  xl('quill',`Er. Everyone? The moon. Look at the moon.`,`Er. Everyone? Look at the moon.`),
  xl('maren',`Outside. All of us. Down to the pier. If something's coming out of that sea, I want to see it with my own eyes.`,`Outside, everyone! Down to the pier!`)
]);
// the last eclipse and Nightfall Peak, on the old Moon Pier at the foot of the Heights (N17)
m3sDef('m_peak',[
  m3sAct(`You all run down the Moonpath, two glowing stairs at a time, and out along the old Moon Pier to the edge of the world.`,`You all run down the Moonpath and out onto the old Moon Pier.`,()=>{ M3S.fadeTo=0; m3sPartyLook(); }),
  m3sAct(`High above, the last thin curl of moon slides across the sun. On it, wings spread wider than the sky, is Nyxara.`,`Up high, the last bit of moon slides over the sun. Nyxara is on it, wings wider than the sky.`,()=>m3sEcl('start',3)),
  m3sAct(`Far out at the edge of the world, the last sliver of moon goes out like a candle.`,`The last bit of moon goes out.`,()=>{ m3sEcl('bite',0); G.flags.m_eclipse3=1; }),
  m3sAct(`And out of the sea, with a sound like a thousand moths taking off, rises a mountain of black glass.`,`A black mountain rises out of the sea.`,()=>m3sPeak('rise')),
  xl('nyxara',`Come up, little ember. Bring your heart.`,`Come up, little ember. Bring your heart.`),
  m3sAct(`The mountain stands in the dark sea, sharp as a broken bottle, with violet lightning crawling up its sides. At the top, where the moon should be, hangs a broken ring of cold light.`,`The mountain is sharp like broken glass. Purple lightning crawls up it. A broken ring of light hangs at the top.`,()=>m3sEcl('gone')),
  xl('ash',`It looks like... Cinder Mountain? And a clock tower? And snow? It's every place I've ever been, all squashed together.`,`It looks like Cinder Mountain! And a clock tower! And snow! Every place I've been, squashed together.`),
  xl('quill',`Fascinating. Terrifying. Mostly fascinating. I need to measure it.`,`Amazing. Scary. Mostly amazing. I must measure it.`),
  m3sAct(`Then the Heart in your satchel grows warm. At the end of the old Moon Pier, a bridge of silver fire unrolls across the dark sea, all the way to the black mountain.`,`The Heart grows warm. At the end of the pier, a bridge of silver fire rolls out to the black mountain.`,()=>m3sPeak('bridge')),
  xl('maren',`...You're going up there.`,`You're going up there.`),
  xl('ash',`I'm going up there.`,`I'm going up there.`),
  xl('maren',`Then I'll walk you to the bridge.`,`Then I'll walk you to the bridge.`),
  m3sIf('juniper',`(running down the pier, out of breath) I saw it from Sable! I ran ALL the way! Somebody give me a pencil!`,`(running up) I saw it from Sable! I ran ALL the way! Give me a pencil!`,()=>!!(SPECIAL.juniper||CASTBY.juniper)),
  m3sIf('f_glaciar',`(far away, a voice like wind chimes) Not alone, dumpling.`,`(far away) Not alone, dumpling.`,m3sGlaciar),
  m3sIf('c_vesper',`(from the stairs behind you) Not alone, cousin.`,`(behind you) Not alone, cousin.`,()=>!!G.flags.m_vesper_ally),
  m3sIf('narr',`Far off over the dark sea, a small white light glows once, softly, and goes out.`,`Far away, a small white light glows once.`,()=>G.choices.m_hush==='free'),
  xl('iska',`And with one more lantern than you think you need. Always.`,`And with one more lantern than you need. Always.`),
  xdo(()=>{ G.flags.m_done=1; G.tod=0.02; })
]);
// on the pier afterwards: the star-iron (the Fallen Star secret), Mom's own business. (v12: the old pier sandwich line
// for Mom is gone: her Act IV talk on the pier is the story data's, so this file's talk hook never played it)
STORY.m_stariron=[
  xl('maren',`Star-iron! Leave it with me. Your sword will never be the same. Neither will my anvil.`,`Star-iron! Give it here. Your sword will never be the same!`),
  xl('narr',`CLANG. CLANG. Mom folds the star-iron into your blade. It hums like a struck bell.`,`CLANG! Mom puts the star-iron in your sword. It hums.`),
  xdo(()=>{ takeItems({m_stariron:1}); if(typeof giveTalkReward==='function') giveTalkReward({dmg:0.1}); else player.stats.slash*=1.1; G.flags.m_stariron_done=1; setBanner(S('Star-iron sword','Star-iron sword'),S('Your sword hits 10 percent harder.','Your sword hits harder.'),3); })];
// ---------- 4. the dungeon story words (bible section 7), played by the dungeon helpers (x3_dun_a, x3_dun_b).
// Pass m3sDunStory(id) as defineDungeon's `story` (or play any key with m3sPlay(key)); M3STORY.md lists them all.
// Drowned Lumen (m_lumen): Dive
m3sDef('m_lumen_in',[
  xl('iska',`A whole city, under the sea. Lamps still in the windows. Someone loved this place very much.`,`A whole city under the sea. Lamps still in the windows. Someone loved it.`),
  xl('sedge',`(a sleepy, soggy voice from Ash's fire) Mmm? Is it wet? It's wet. Wake me when it's wetter.`,`(sleepy, from your fire) Is it wet? Wake me when it's wetter.`),
  xl('sedge',`...Ooh. Actually, this IS wet. I'll stay up.`,`Ooh. This IS wet. I will stay up.`)
]);
m3sDef('m_lumen_mosaic',[
  xl('narr',`The three moon lamps flare. On the wall between them a silver mosaic lights up: a moon over a sea, and words in old letters.`,`The lamps light up a silver picture: a moon over the sea, and old words.`),
  xl('narr',`THE MOON RISES, THE SEA FALLS. THE MOON FALLS, THE SEA RISES.`,`MOON UP, SEA DOWN. MOON DOWN, SEA UP.`),
  xl('iska',`The whole city breathed with the moon. Remember that, Ash. Up and down. Full and empty.`,`The city breathed with the moon. Up and down. Full and empty.`)
]);
// (v11: Dive comes from Coralia's merfolk. Sir Kipper keeps watch beside Ember's flame; Ember herself speaks only once
// in Act IV, at the Mirror Temple)
m3sDef('m_lumen_shrine',[
  xl('narr',`Beside the flame, the dark water bulges. A seahorse in a tiny saddle comes up out of it, and on the seahorse sits a merman in shell armour.`,`A merman on a seahorse comes up out of the water.`),
  xl('m_kipper',`A dragon. At the bottom of Lumen. Nobody ever wrote a rule about that.`,`A dragon, down here? Nobody wrote a rule about that.`),
  xl('m_kipper',`Sir Kipper of Coralcombe, and Lady Bubbles. The Queen keeps a knight beside this flame. A girl with horns left it with our grandmothers.`,`I'm Sir Kipper. We guard this flame. A girl with horns left it.`),
  xl('ash',`That was Ember. She's my family.`,`That was Ember. She's my family.`),
  xl('m_kipper',`Then it's yours. Take it, and then come and see the Queen.`,`Then it's yours. Take it. Then come and see the Queen.`)
]);
m3sDef('m_lumen_gift',[
  xl('narr',`The flame is cool, not hot. It wraps around you like a bubble and settles in your chest. You take a breath. It tastes like the sea.`,`The flame is cool. It wraps you like a bubble. You breathe. It tastes like the sea.`),
  xl('m_kipper',`Now dive. Nose down, tail down, and kick. Your tail is the wrong sort, but kick anyway.`,`Now dive! Nose down, and kick.`),
  xl('ash',`Old Winnie said "not yet." I think she meant now.`,`Winnie said "not yet." She meant now.`)
]);
STORY.m_lumen_how=S(`In deep water, press ROLL to dive under. Swim under arches, touch switches on the bottom, and watch your blue air ring. Bubbles and air pockets fill it again.`,`In deep water, press ROLL to dive. Bubbles give you air.`);
STORY.m_lumen_bossline=S(`Octavia! When her arms slam down, hit the glowing tips! When the room floods, watch for her eye. And remember the valves, Ash. She can't swim in an empty room.`,`Hit her glowing arm tips! Watch for her eye. Use the valves!`);
m3sDef('m_octavia_intro',[
  xl('narr',`In the Lamp Cellar, every round window is full of lamps. Stolen lamps. Hundreds of them. And in the middle of them all, something with a lot of arms opens two gold eyes.`,`The cellar is full of stolen lamps. In the middle, something with lots of arms opens two gold eyes.`),
  xl('m_octavia',`MINE. All mine. Every lamp in Lumen, down here with me where it's dark. You can't have them. You can't have ANY of them.`,`MINE! Every lamp in Lumen is mine. You can't have ANY of them.`)
]);
m3sDef('m_lumen_won',[
  xl('narr',`Octavia flops on the dais, all eight arms in a tangle, and makes a noise like a very sad bath.`,`Octavia flops down, arms in a tangle. She makes a sad bath noise.`),
  xl('m_octavia',`Fine! FINE! Take your lamps. I only wanted something pretty to look at down here. It's DARK at the bottom of the sea, you know.`,`Fine! Take your lamps. I just wanted something pretty. It's DARK down here.`),
  xl('ash',`You could just... share them? Leave them in the windows?`,`You could share them? Put them back in the windows?`),
  xl('m_octavia',`...Share. Hm. I've never tried sharing. Is it nice?`,`Share? I never tried. Is it nice?`),
  xl('narr',`One by one, she puts the moon lamps back in Lumen's windows. All through the drowned city, lights come on.`,`One by one, she puts the lamps back. All through the city, lights come on.`),
  xdo(()=>{ G.flags.m_lumen_lit=1; })
]);
m3sDef('m_lumen_library',[xl('sedge',`Finally! Somewhere wetter than me!`,`Finally! Somewhere wetter than me!`)]);
m3sDef('m_lumen_window',[
  xl('narr',`Through the great round window, something with a lot of arms drifts past. An eye the size of a door looks in at you, blinks, and leaves.`,`Something with lots of arms drifts past the window. A huge eye looks at you. It blinks. It leaves.`),
  xl('ash',`...I didn't like that.`,`I didn't like that.`)
]);
m3sDef('m_vault_open',[xl('iska',`Moonfire, underwater, on a vault Ember's friends sealed. They knew you'd come. Or they hoped.`,`Moonfire underwater! Ember's friends sealed this. They hoped you'd come.`)]);
m3sDef('m_lumen_end',[
  xl('m_kipper',`Look at that. Lumen's lights, on again. My grandmother's grandmother would have cried. I may, a little.`,`Lumen's lights are on again! I may cry a little.`),
  xl('m_kipper',`Coralcombe is in the reef south of the floating town. Dive in the middle of the ring. The Queen will want to hear this from you.`,`Our home is the reef south of the floating town. The Queen wants to see you.`),
  xl('narr',`Step into the warp ring to go back outside.`,`Step in the warp ring to go outside.`)
]);
m3sDef('m_duchess',[
  xl('narr',`You pop up into a pocket of air under a drowned roof. Somebody is already here. Sitting in the dry corner. Chewing seaweed.`,`You pop up in a pocket of air. Somebody is already here. Chewing seaweed.`),
  xl('ash',`DUCHESS?! You can't even SWIM.`,`DUCHESS?! You can't even SWIM.`),
  m3sIf('ash',`Does Grandpa know you're here? He's going to be SO cross.`,`Does Grandpa know? He'll be SO cross.`,()=>G.choices.ending==='lantern'),
  xl('goat',`Meh.`,`Meh.`),
  xdo(()=>{ if(!G.flags.m_duchess){ G.flags.m_duchess=1; addCoins(30); gainXp(60); } })
]);
STORY.m_zapp_taunt=[S(`Bzzzt!`,`Bzzzt!`),S(`Ooh, shiny. Shiny me.`,`Ooh, shiny me.`)];
// the Sandworm Burrows (m_burrows): Burrow
m3sDef('m_burrows_in',[xl('iska',`Tunnels and bones, and something very big breathing somewhere under us. Keep your fire close, Ash.`,`Tunnels and bones. Something big breathes below. Stay close.`)]);
// (v11: Burrow comes from the worm king, Gravelgut, in a clear moment before the shiny thing in him takes over)
m3sDef('m_burrows_shrine',[
  xl('narr',`The sand round the flame trembles. A voice comes up through it, so deep you feel it in your teeth.`,`The sand shakes. A deep voice comes up through it.`),
  xl('m_gravelgut',`Mmmrrr. Little warm thing. You smell like her. The girl with horns.`,`Little warm thing. You smell like the girl with horns.`),
  xl('ash',`Ember? You knew Ember?`,`You knew Ember?`),
  xl('m_gravelgut',`Ate her once. Spat her out. Too spicy. After that we were friends, and she left her fire with us. For her family.`,`I ate her once. Too spicy! Then we were friends. She left her fire here, for her family.`)
]);
m3sDef('m_burrows_gift',[
  xl('narr',`The flame sinks into you like warm sand through your fingers. Your claws itch. You want to dig.`,`The flame sinks into you like warm sand. Your claws itch. You want to dig.`),
  xl('m_gravelgut',`Dig like us. Down into the sand, under walls, under biters. Come up under them and they fly.`,`Dig like us! Go under walls and biters. Pop up and they fly.`),
  xl('m_gravelgut',`Then come down and find me, warm thing. Something shiny is stuck in me. It hurts. It makes me not me.`,`Then come and find me. Something shiny is stuck in me. It hurts.`)
]);
STORY.m_burrows_how=S(`On sand, press ROLL to dig down. Move under sand walls, foes and worms. Press ROLL again to pop up under someone. Watch your gold dig ring.`,`On sand, press ROLL to dig. Press it again to pop up!`);
STORY.m_burrows_bossline=S(`Gravelgut! Make him surface into the glass pillars. When he's stuck, hit his throat! And burrow, Ash, burrow when he comes up under you!`,`Lure him into the glass pillars! Hit his throat! Burrow when he comes up!`);
m3sDef('m_gravelgut_intro',[
  xl('narr',`The sand in the middle of the hall heaves. Something enormous rises out of it: a sandworm as long as a street, with a round mouth full of glass teeth. In his throat, something glows silver.`,`The sand heaves. A giant worm rises, with glass teeth. Something silver glows in his throat.`),
  xl('m_gravelgut',`(a rumble you feel in your teeth) Mmmmrrr. Shiny. Want shiny. Tummy hurts. Want MORE shiny.`,`(a deep rumble) Shiny. Want shiny. Tummy hurts. Want MORE!`),
  xl('iska',`He's sick, Ash. Something in him is making him wild. Be quick, and be kind if you can.`,`He's sick, Ash. Be quick. Be kind if you can.`)
]);
m3sDef('m_burrows_won',[
  xl('narr',`Gravelgut gives one enormous cough. Something small and bright flies out of his mouth, bounces three times, and rolls to your feet. It glows silver.`,`Gravelgut gives a huge cough. Something small and bright rolls to your feet. It glows silver.`),
  xdo(()=>{ if(!(G.items.m_mooncrumb>0)&&!G.flags.m_crumb_got){ giveItems({m_mooncrumb:1}); G.flags.m_crumb_got=1; } }),
  xl('ash',`It's... a crumb. Of the moon.`,`It's a crumb. Of the moon.`),
  xl('m_gravelgut',`(a rumble) Oof. Oh, that's better. My tummy. I've had a tummy ache for a month. Why did I eat that?`,`Oof. Oh, that's better. My tummy hurt for a month. Why did I eat that?`),
  xl('iska',`She spilled it, Ash. Nyxara. She's a messy eater.`,`Nyxara spilled it, Ash. She's a messy eater.`),
  xl('m_gravelgut',`Thank you, little warm thing. I'm going to lie down for a hundred years.`,`Thank you, little warm thing. I'll lie down for a hundred years.`)
]);
m3sDef('m_sandy_talk',[
  xl('m_sandy',`(a rumble that might be a snore) ...You smell like the sky. Is my husband very sick? He ate something shiny. I told him not to.`,`(a sleepy rumble) You smell like the sky. Is my husband sick? He ate something shiny.`),
  m3sIf('ash',`He's better now. He coughed it up. He's having a hundred-year nap.`,`He's better now. He's having a long nap.`,()=>!!G.flags.m_crumb_got||!!G.items.m_mooncrumb)
],{again:true});
m3sDef('m_burrows_bell',[xl('iska',`The Worm Bell. Now they'll go slow. Worms are polite, once you ring.`,`The Worm Bell! Now the worms go slow.`)]);
m3sDef('m_burrows_end',[
  xl('iska',`A crumb of the moon. Keep it, Ash. Somebody in Sable who works with fire and glass might know what to do with a thing like that.`,`A crumb of the moon. Keep it. Someone in Sable who works with glass will know.`),
  xl('iska',`Go back to Sable first. Then under the Glasswall, the way the worms go. There's one more of Ember's flames past it, in a temple.`,`Go back to Sable first. Then dig under the Glasswall, like the worms.`),
  xl('narr',`Step into the warp ring to go back outside.`,`Step in the warp ring to go outside.`)
]);
STORY.m_bigfin_taunt=[S(`CHOMP!`,`CHOMP!`),S(`Nobody burrows in MY sand!`,`Nobody digs in MY sand!`)];
// the Mirror Temple (m_mirror): Moonfire, and Pip's Lantern
m3sDef('m_mirror_in',[
  xl('iska',`Mirrors everywhere. Careful, Ash. Not everything in here is real. Not everything in here is you.`,`Mirrors everywhere. Careful, Ash. Not everything here is real.`),
  xl('ash',`That one's me. I'd know that face anywhere. It's handsome.`,`That one's me. I know that face. It's handsome.`)
]);
// (the data scene m_mirror_shrine, game/story/act4/m_mirror.js, replaces this one in place: Ember's one appearance in
// Act IV and her confession, v11)
m3sDef('m_mirror_shrine',[
  xl('ember',`Hello, Ash. You found the last one. I made this one here, with the moon-priests: my fire, mixed with moonlight.`,`Hello, Ash. This is my last flame. My fire, mixed with moonlight.`),
  xl('ash',`What's it for?`,`What's it for?`),
  xl('ember',`For someone I loved. In case she ever got lost in the dark.`,`For someone I loved. In case she got lost.`),
  xl('ash',`Who?`,`Who?`),
  xl('ember',`Take it, Ash. And if you ever meet her, be gentler than I was.`,`Take it. If you meet her, be gentler than me.`)
]);
m3sDef('m_mirror_gift',[
  xl('narr',`The flame is silver. It's cool, like a breeze on a summer night. When it touches you, your shadow sits up and pays attention.`,`The flame is silver and cool, like a summer night breeze.`),
  xl('iska',`Moonfire. Breathe it like fire, but think of the moon. It lights moon-glass so you can stand on it, wakes moon braziers, burns shadows and shadow vines, and it even works underwater.`,`Moonfire! It lights moon-glass and moon braziers. It burns shadows. It works underwater too.`)
]);
STORY.m_mirror_how=S(`Swap your breath to MOONFIRE (the little moon by your fire meter), then breathe it like fire. It lights moon-glass, moon braziers and Shades, burns shadow vines, and works underwater.`,`Swap to MOONFIRE, then breathe. It lights moon-glass. It works underwater too!`);
STORY.m_mirror_bossline=S(`Lord Fanfare! Moonfire the violet eyes on his tail! When he blocks the skylight, keep the braziers lit, and turn the big mirror on him!`,`Moonfire the purple eyes on his tail! Keep the braziers lit! Turn the big mirror on him!`);
m3sDef('m_mirror_boss_in',[
  xl('narr',`In the middle of the Mirror Hall, a peacock as tall as a house is admiring himself in six mirrors at once. His feathers are glass and silver. On every tail feather is an eye, painted dark violet.`,`A peacock as tall as a house admires himself in six mirrors. On every tail feather is a purple eye.`),
  xl('m_fanfare',`Mirror, mirror, on the wall... it's ME. It's always me.`,`Mirror, mirror, on the wall... it's ME.`),
  xl('m_fanfare',`Oh! A visitor. A small, scaly, slightly singed visitor. I am Lord Fanfare, Keeper of the Moon Flame, Most Beautiful Thing in the World. Don't look at my tail.`,`Oh! A small, scaly visitor. I am Lord Fanfare, the Most Beautiful Thing in the World. Don't look at my tail.`),
  xl('m_fanfare',`No, do look. Look at it.`,`No, do look. Look at it.`),
  xl('ash',`It's nice. Why are the eyes on it purple?`,`It's nice. Why are the eyes purple?`),
  xl('m_fanfare',`A voice in the mirrors told me I was the only light that matters. Isn't that lovely? Now. Shoo. You're making the mirrors look crowded.`,`A voice in the mirrors said I'm the only light that matters. Lovely! Now shoo.`)
]);
m3sDef('m_pip_lamp',[
  xl('narr',`A tiny spark of moonlight floats up out of the brazier, like a firefly made of silver.`,`A tiny silver spark floats out of the brazier, like a firefly.`),
  xl('narr',`It drifts round your head, twice, and lands on the end of Pip's nose. Pip goes cross-eyed looking at it.`,`It lands on Pip's nose. Pip goes cross-eyed.`),
  xl('pip',`Mip?`,`Mip?`),
  xl('narr',`The spark sinks in. Pip starts to glow, a soft silver-gold, like a little lantern with legs.`,`The spark sinks in. Pip glows silver-gold, like a little lantern with legs.`),
  xl('iska',`Oh, look at that! A lantern of his very own. I couldn't have made a better one.`,`Look! A lantern of his very own. I couldn't make a better one.`),
  xdo(()=>{ G.flags.m_pip_lamp=1; }),
  xl('narr',`Pip's Lantern: Pip glows in the dark now. He lights up dark rooms, and painted moth eyes on the walls, and the hidden paths they guard.`,`Pip's Lantern: Pip glows in the dark. He shows hidden moth eyes and secret paths.`)
]);
m3sDef('m_mirror_won',[
  xl('narr',`The last violet eye on Lord Fanfare's tail goes out. One by one, his feathers turn back to green and gold.`,`The last purple eye goes out. His feathers turn green and gold again.`),
  xl('m_fanfare',`Oh dear. Was I horrid? I think I was horrid. Something cold got into the mirrors and whispered to me.`,`Oh dear. Was I horrid? Something cold whispered to me from the mirrors.`),
  xl('ash',`You're still very shiny.`,`You're still very shiny.`),
  xl('m_fanfare',`Thank you. You're quite shiny yourself. For a lizard.`,`Thank you. You're shiny too. For a lizard.`),
  xl('ash',`I'm a dragon.`,`I'm a dragon.`),
  xl('m_fanfare',`Even better. Dragons go with everything. I was supposed to guard Ember's flame for her family, you know. Not from them. I shall polish something to make up for it.`,`Even better! I was meant to guard Ember's flame for her family. Not from them. I will polish something to say sorry.`)
]);
// Nyxara's voice through every mirror at once (6.9): plays straight after the peacock's outro
m3sDef('m_mirror_voice',[
  xl('narr',`Every mirror in the temple goes dark at once. In each one, a pair of white eyes opens.`,`Every mirror goes dark. In each one, two white eyes open.`),
  xl('nyxara',`Moonfire. Oh, little ember. Lumen's priests burned me with that, long ago. It hurt very much.`,`Moonfire. The priests burned me with it once. It hurt.`),
  xl('nyxara',`Mend it, little ember. Then give it to me. You will want to, at the end.`,`Mend it. Then give it to me. You will want to.`),
  xl('ash',`I won't.`,`I won't.`),
  xl('nyxara',`Everyone does.`,`Everyone does.`),
  xl('narr',`The eyes close. The mirrors are just mirrors again. One of them shows you, looking a bit worried. You fix your hair. It helps.`,`The eyes close. A mirror shows you, a bit worried. You fix your hair. It helps.`)
]);
m3sDef('m_mirror_end',[
  xl('iska',`That was the last of Ember's flames, Ash. The Moonpath starts at the foot of the Heights, north of here.`,`That was Ember's last flame. The Moonpath is north of here.`),
  xl('narr',`Step into the warp ring to go back outside.`,`Step in the warp ring to go outside.`)
]);
STORY.m_prism_taunt=[S(`RAWR. Do you like my mane? Everyone likes my mane.`,`RAWR. Do you like my mane?`)];
STORY.m_fanfare_taunt=[S(`Mirror, mirror, on the wall...`,`Mirror, mirror...`),S(`Don't look at my tail! ...No, DO look.`,`Don't look! No, DO look.`),S(`Do you know how long it takes to polish four hundred feathers? FOUR HUNDRED MINUTES.`,`Four hundred feathers to polish!`),S(`MY FEATHER!`,`MY FEATHER!`)];
// the Eclipse Observatory (m_obs): no gift; Duke Umberwing, Hush, the Lens
m3sDef('m_obs_scope',[
  xl('narr',`You put your eye to the great telescope. Far to the east, past the end of every map, is a patch of sea where the stars look wrong. Bent. Like something big is underneath them, waiting.`,`You look through the telescope. Far east, the stars over the sea look wrong. Something big is waiting there.`),
  xl('ash',`...I'm going to pretend I didn't see that.`,`I'll pretend I didn't see that.`)
]);
m3sDef('m_obs_star',[xl('iska',`That's MY constellation! They named one after me! ...After my lanterns. Close enough.`,`That's MY star picture! Named after my lanterns. Close enough!`)]);
m3sDef('m_obs_vesper',[
  xl('c_vesper',`Two locks? Cute.`,`Two locks? Cute.`),
  xl('narr',`Click. Click. The Vault door swings open.`,`Click. Click. The door swings open.`),
  xl('c_vesper',`Thieves don't knock, cousin. Come on.`,`Thieves don't knock, cousin. Come on.`)
]);
m3sDef('m_obs_museum',[
  xl('narr',`The Duke's Lamp Museum. Hundreds of stolen lamps on shelves, each with a neat little label.`,`The Duke's Lamp Museum. Hundreds of stolen lamps, all with labels.`),
  xl('narr',`GRANDMA'S READING LAMP, EATEN YEAR 412. A VERY NICE LANTERN (BORROWED).`,`GRANDMA'S READING LAMP. A VERY NICE LANTERN (BORROWED).`),
  m3sIf('narr',`One label says: WICK'S FINEST LAMP, EMBERHOLLOW.`,`One says: WICK'S FINEST LAMP, EMBERHOLLOW.`,()=>!!G.choices.fennick)
]);
m3sDef('m_obs_ante',[xl('iska',`Hush is through this door, Ash. One more lantern than you think you need, remember?`,`Hush is through this door. One more lantern than you need.`)]);
m3sDef('m_umber_intro',[
  xl('narr',`At a table set for one sits a moth as tall as a door, in a velvet cloak that is really his folded wings. He wears a monocle of moon-glass. On his plate is a lamp. He is eating it.`,`At a table sits a tall moth in a velvet cloak and a monocle. He is eating a lamp.`),
  xl('m_umberwing',`Crunchy. Oh! A guest. Charmed. Duke Umberwing, Captain of the Moth Knights, Keeper of the Door. Do wipe your feet.`,`Crunchy. Oh! A guest. I am Duke Umberwing, Keeper of the Door. Wipe your feet.`),
  xl('m_umberwing',`The Mother says nobody goes up. So nobody goes up. En garde!`,`The Mother says nobody goes up. En garde!`)
]);
m3sDef('m_umber_won',[
  xl('m_umberwing',`Oh, bother. Bested by a lizard. Here, the key, the key. Take it.`,`Oh, bother. Here, take the key.`),
  xl('narr',`He tucks one last lamp under his arm and climbs up onto the window ledge.`,`He tucks a lamp under his arm and climbs onto the window.`),
  xl('m_umberwing',`I'm keeping this one. It has sentimental value. I stole it on a Tuesday.`,`I'm keeping this one. I stole it on a Tuesday.`),
  xl('narr',`He flutters out into the dark.`,`He flutters out into the dark.`),
  xdo(()=>{ G.flags.m_umber_done=1; })
]);
STORY.m_umber_taunt=[S(`Charmed. Do wipe your feet. En garde!`,`En garde!`),S(`Is that a LAMP? No. Focus. ...Is it, though?`,`Is that a LAMP? Focus!`),S(`Ooh! A LAMP.`,`Ooh! A LAMP.`)];
STORY.m_obs_bossline=S(`Hush! Moonfire the moonstones to bring her down. Burrow under the Great Shush. Hit the knots. And when she's pulled up, grapple the ring and PULL!`,`Moonfire the stones! Burrow under the Shush! Hit the knots! Grapple the ring and PULL!`);
STORY.m_hush_taunt=[S(`Shhh.`,`Shhh.`),S(`So loud. You're always so LOUD.`,`So LOUD.`),S(`It's so cold up here.`,`So cold up here.`),S(`Mother, it hurts. Shhh. It hurts.`,`Mother, it hurts.`)];
m3sDef('m_obs_won',[xl('iska',`Up the last stairs, Ash. To the Lens. Somebody's coming. I can hear a hammer.`,`Up the last stairs to the Lens, Ash. I can hear a hammer coming.`)]);
// boss taunts for x3_foes (each S(full,simple)): taunt('<speaker>', pick(M3S_TAUNTS.<type>))
const M3S_TAUNTS={m_puffington:[S(`I'm not STUCK! I'm GUARDING!`,`I'm GUARDING!`),S(`Pffffft.`,`Pffffft.`),S(`You popped my DIGNITY!`,`You popped my DIGNITY!`),S(`Mind the moustache!`,`Mind the moustache!`)],
  m_octavia:[S(`Mine! MINE! All the pretty lamps are mine!`,`All the lamps are MINE!`),S(`It's so dark down here. Give me your light!`,`Give me your light!`)],
  m_gravelgut:[S(`Mmmrrr. SHINY.`,`SHINY.`),S(`Tummy HURTS.`,`Tummy HURTS.`)],
  m_fanfare:STORY.m_fanfare_taunt,m_umberwing:STORY.m_umber_taunt,m_hushboss:STORY.m_hush_taunt,m_zapp:STORY.m_zapp_taunt,m_bigfin:STORY.m_bigfin_taunt,m_prism:STORY.m_prism_taunt};
// Hush's "outro" for a foes module or a dungeon boss room that ends her fight its own way: it only asks for the
// story's outro and choice (m3sHushDown), which plays as soon as that dialogue closes and things are calm, so the
// choice can never play twice, whoever ends the fight.
STORY.m_hush_won_q=[xdo(()=>{ if(!G.flags.m_hush_done&&!M3S.hushRun) m3sWhen('hush_out',null,()=>m3sHushDown(null)); })];
// what defineDungeon's `story` should be for each Act IV dungeon (keys as e9a expects them)
function m3sDunStory(id){
  const M={m_lumen:{in:'m_lumen_in',shrine:'m_lumen_shrine',gift:'m_lumen_gift',how:'m_lumen_how',boss:'m_octavia_intro',bossline:'m_lumen_bossline',won:'m_lumen_won',end:'m_lumen_end'},
    m_burrows:{in:'m_burrows_in',shrine:'m_burrows_shrine',gift:'m_burrows_gift',how:'m_burrows_how',boss:'m_gravelgut_intro',bossline:'m_burrows_bossline',won:'m_burrows_won',end:'m_burrows_end'},
    m_mirror:{in:'m_mirror_in',shrine:'m_mirror_shrine',gift:'m_mirror_gift',how:'m_mirror_how',boss:'m_mirror_boss_in',bossline:'m_mirror_bossline',won:'m_mirror_won_v',end:'m_mirror_end'},
    m_obs:{in:'m_obs_in',boss:'m_hush_intro',bossline:'m_obs_bossline',won:'m_hush_won_q'}}[id]||{};
  const o={}; for(const k in M) if(STORY[M[k]]) o[k]=STORY[M[k]]; return o;
}
// the peacock's outro and the voice in the mirrors play as one scene
STORY.m_mirror_won_v=STORY.m_mirror_won.concat(STORY.m_mirror_voice);
// defaults, so a dungeon registered without a `story` still says the right things (a later defineDungeon story wins)
for(const id of ['m_lumen','m_burrows','m_mirror','m_obs']){ const st=m3sDunStory(id); for(const k in st) if(st[k]&&!STORY['trial_'+id+'_'+k]) STORY['trial_'+id+'_'+k]=st[k]; }
// every Act IV boss's words in STORY.bosses (for a foes module that plays STORY.bosses[type].intro / .outro); the
// once-only marks keep each scene from playing twice, whoever plays it
m3sBossWords('m_octavia',STORY.m_octavia_intro,STORY.m_lumen_won);
m3sBossWords('m_gravelgut',STORY.m_gravelgut_intro,STORY.m_burrows_won);
m3sBossWords('m_fanfare',STORY.m_mirror_boss_in,STORY.m_mirror_won_v);
m3sBossWords('m_umberwing',STORY.m_umber_intro,STORY.m_umber_won);
m3sBossWords('m_hushboss',STORY.m_hush_intro,STORY.m_hush_won_q);
// ---------- 5. hints (Iska, bible 6.14), the stages and the act
STORY.m_hints={
  m_sail:S(`Dell is waiting at Gearhaven's Far Pier. Or, if your auntie is awake, she's outside Hearthold's North Gate, pretending not to be.`,`Dell waits at Gearhaven's Far Pier. Or Glaciar waits by Hearthold's North Gate.`),
  m_drift:S(`Mayor Dabble is on the big Town Raft. Old Winnie is the one with the seashell hat. And the octopus.`,`Mayor Dabble is on the Town Raft. Old Winnie has a seashell hat.`),
  m_lumen:S(`North across the Spire Shoals. Walk the sandbars, then swing up to the Spire's balcony.`,`Go north over the sandbars. Then swing up to the tower's balcony.`),
  m_coral:S(`Coralcombe is the ring of coral south of Driftwood. Dive in the middle.`,`Coralcombe is the coral ring south of Driftwood. Dive in the middle.`),
  m_reef:S(`The Sunken Gate is in the Reefwall, east across the sea. A pufferfish is stuck in it. Bring bombs. Pufferfish hate bombs. Everybody hates bombs.`,`The Sunken Gate is east, in the Reefwall. A pufferfish is stuck in it. Bring bombs!`),
  m_sable:S(`Follow the Caravan Road east from the beach. The oasis is where the palms are.`,`Follow the road east from the beach. The oasis has palm trees.`),
  m_burrows:S(`North from Sable to the Worm Mouth. Fly over the quicksand, or make a glass path with Blaze.`,`Go north from Sable to the Worm Mouth. Fly over the quicksand, or Blaze it.`),
  m_glasswall:S(`The Burrow Gap is east of Sable, at the foot of the Glasswall. Go UNDER. Then find the temple of mirrors.`,`The Burrow Gap is east of Sable. Dig UNDER the wall. Then find the mirror temple.`),
  m_mirror:S(`Mirrors, beams and moon-glass. When in doubt, turn a mirror. When in more doubt, turn another one.`,`Mirrors and beams. When in doubt, turn a mirror.`),
  m_moonpath:S(`Moonfire on the moon-glass stairs. Light the three moon braziers and the door at the top will open.`,`Moonfire the glass stairs. Light the three braziers. The door will open.`),
  m_observatory:S(`Sun, Moon, Eclipse. Turn the dial and the room changes. Light a lamp if a moth gets in your way. Moths always look.`,`Turn the dial to change the room. Light a lamp for moths. They always look.`),
  m_reforge:S(`Up to the Eclipse Lens, at the very top. Someone is coming up the stairs behind you. Someone with a hammer.`,`Go up to the Eclipse Lens at the top. Someone with a hammer is coming.`)};
const M3S_YARA=[S(`I counted the lanterns in the square tonight. We needed four more than last month. The moon is getting smaller, Ash. Hurry.`,`We need more lanterns every night. The moon is shrinking. Hurry, Ash.`)];
const m3sHint=st=>()=>STORY.m_hints[st];
const m3sStageCard={m_sail:['Act IV · Chapter 1',S('Across the Sea','Across the Sea')]};
const m3sLit=()=>clamp(G.flags.m_moonpath_lit|0,0,3);
// a dungeon objective: inside it, "where you are"; outside, its door (the world's own, or the bible's spot)
const m3sDunGoal=(id,inF,inS,outF,outS,P)=>m3sIn(id)?{text:S(inF,inS),x:player.x,y:player.y,area:AREA.id}:Object.assign({text:S(outF,outS)},m3sDoorAt(id,P),m3sArea(id));
// the main beats' XP (BALANCE.md 8: Act IV main beats about 1000 each, five of them, plus the small ones)
const M3S_XP={land:300,winnie:600,coralia:800,eclipse1:1000,rafi:600,eclipse2:1000,obs:400,reforge:1000,peak:600,stand:600};
defineStages(4,[
  {id:'m_sail',chapter:S('Across the Sea','Across the Sea'),at:{x:M3SP.hearth.x,y:M3SP.hearth.y},
    objectives(){
      const F=G.flags; if(curMap()===3) return [];
      const o=[];
      if(F.m_ship!=='glaciar'||!m3sGlaciar()) o.push({text:S(`Go to Gearhaven's Far Pier and sail east with Dell`,`Go to Gearhaven's Far Pier. Sail east with Dell`),x:M3SP.farPier.x,y:M3SP.farPier.y});
      if(m3sGlaciar()&&F.m_ship!=='ship') o.push({text:S(`Fly east with Glaciar from outside Hearthold's North Gate`,`Fly east with Glaciar from the North Gate`),x:M3SP.northGate.x,y:M3SP.northGate.y});
      return o;
    },
    hint:m3sHint('m_sail'), yara:M3S_YARA,
    soFar:S(`The moon has two bites out of it. The last Shard is somewhere east. Dell has a sea boat (and Auntie Glaciar has wings).`,`The moon has two bites gone. The last Shard is east. Dell has a boat.`),
    mom:[S(`A sea boat! Wear a hat. Wear two hats.`,`A sea boat! Wear a hat.`)],
    // (startAct(4) runs the act's intro itself; a stage set any other way, or a reload before the intro, starts it here)
    enter(o){ if(!m3sSeen('m_intro')) m3sIntroStart({fromEnter:!o.load,quiet:!!o.load}); },
    update(dt){ if(curMap()===3&&!AREA&&!G.flags.m_landed&&scene==='play') m3sLand(); }},
  {id:'m_drift',chapter:S('Across the Sea','Across the Sea'),at:{x:M3SP.dock.x+150,y:M3SP.dock.y},
    objectives(){ const F=G.flags;
      if(!F.m_dabble) return [m3sObj(`Talk to Mayor Dabble on the Town Raft`,`Talk to Mayor Dabble on the Town Raft`,m3sWho('m_dabble',M3SP.raft.x,M3SP.raft.y))];
      return [m3sObj(`Ask Old Winnie the Tidewife about the moon`,`Ask Old Winnie about the moon`,m3sWho('m_winnie',M3SP.winnie.x,M3SP.winnie.y))]; },
    hint:m3sHint('m_drift'), yara:M3S_YARA,
    soFar:S(`Ash sailed east to Moonfall: the Sunken Isles, where drowned Old Lumen sleeps under the sea, and the Glass Desert, where the moon's broken light fell as glass.`,`Ash sailed to Moonfall. There is a city under the sea and a desert of glass.`),
    mom:[S(`A floating town? Does it have floors? Mind you don't fall between them.`,`A floating town! Don't fall in.`)],
    marker:id=>{ const F=G.flags; return (id==='m_dabble'&&!F.m_dabble)||(id==='m_winnie'&&!F.m_winnie); },
    talk(n){ const F=G.flags;
      if(n.id==='m_dabble'&&!F.m_dabble){ m3sPlay('m_dabble',()=>questUpdated()); return true; }
      if(n.id==='m_winnie'&&!F.m_winnie){ m3sPlay('m_winnie',()=>{ gainXp(M3S_XP.winnie); goStage('m_lumen'); }); return true; }
      return false; }},
  {id:'m_lumen',chapter:S('Drowned Lumen','Drowned Lumen'),card:['Act IV · Chapter 2',S('Drowned Lumen','Drowned Lumen')],at:{x:3300,y:63300},
    objectives:()=>[m3sDunGoal('m_lumen',`Find Ember's flame in drowned Old Lumen`,`Find Ember's flame in Old Lumen`,'Cross the Spire Shoals to the Lumen Spire','Cross the sandbars to the white tower',M3SP.spire)],
    hint:m3sHint('m_lumen'), yara:M3S_YARA,
    soFar:S(`Old Lumen, the moon city, drowned long ago, the first time the moth bit the moon. Its tower still sticks out of the sea.`,`Old Lumen, the moon city, drowned long ago. Its tower sticks out of the sea.`),
    update(dt){ const F=G.flags;
      if(!m3sSeen('m_lumen_channel')&&scene==='play'&&m3sNear(M3SP.channel,240)&&!hasAbil('dive')) m3sPlay('m_lumen_channel');
      if((F.trial_m_lumen_done||F.m_lumen_done)&&G.stage==='m_lumen'){ F.m_lumen_done=1; goStage('m_coral',{card:false}); } }},
  {id:'m_coral',chapter:S('Drowned Lumen','Drowned Lumen'),at:{x:M3SP.coral.x+260,y:M3SP.coral.y-420},
    objectives(){
      if(m3sIn('m_coralcombe')) return [m3sObj(`Speak to Queen Coralia`,`Talk to Queen Coralia`,m3sWho('m_coralia',player.x,player.y-60))];
      return [Object.assign({text:S('Dive into Coralcombe Reef and meet the merfolk','Dive into the coral ring. Meet the merfolk'),npc:'m_coralia'},m3sDoorAt('m_coralcombe',M3SP.coral),m3sArea('m_coralcombe'))]; },
    hint:m3sHint('m_coral'), yara:M3S_YARA,
    soFar:S(`Ash can dive! The merfolk of Coralcombe are Lumen's grandchildren. A white moth on a silver leash guards the last Shard.`,`Ash can dive! The merfolk are Lumen's grandchildren. A white moth guards the last Shard.`),
    enter(o){ if(!m3sSeen('m_lumen_after')) m3sWhen('lumen_after',()=>m3sOut(),()=>m3sPlay('m_lumen_after')); },
    marker:id=>id==='m_coralia'&&!G.flags.m_coral_met,
    talk(n){ if(n.id==='m_coralia'&&!G.flags.m_coral_met){ m3sPlay(m3sSeen('m_coral_in')?'m_coralia':STORY.m_coral_in.concat(STORY.m_coralia),()=>{ gainXp(M3S_XP.coralia); goStage('m_reef'); }); return true; } return false; }},
  {id:'m_reef',chapter:S('The Glass Desert','The Glass Desert'),card:['Act IV · Chapter 3',S('The Glass Desert','The Glass Desert')],at:{x:4600,y:65300},
    objectives(){ const F=G.flags, p=player;
      if(!F.m_puff_done){ if(dist(p.x,p.y,M3SP.sunken.x,M3SP.sunken.y)>700) return [{text:S('Swim east to the Sunken Gate','Swim east to the Sunken Gate'),x:M3SP.sunken.x,y:M3SP.sunken.y}];
        return [{text:S('Get Baron Puffington out of the gate','Get the pufferfish out of the gate'),x:M3SP.sunken.x,y:M3SP.sunken.y}]; }
      if(p.x<M3SP.arch.x+60) return [{text:S('Dive under the Reefwall through the Sunken Gate','Dive under the reef wall, through the gate'),x:M3SP.arch.x,y:M3SP.arch.y}];
      return [{text:S('Climb out onto the beach at Strand Landing','Climb out at Strand Landing'),x:M3SP.strand.x,y:M3SP.strand.y}]; },
    hint:m3sHint('m_reef'), yara:M3S_YARA,
    soFar:S(`The way east is under the Reefwall, through the Sunken Gate. A pufferfish is stuck in it.`,`The way east is through the Sunken Gate. A pufferfish is stuck in it.`),
    enter(o){ m3sBombsCheck(); },
    update(dt){ const F=G.flags;
      if(G.bossDone&&G.bossDone.m_puffington&&!F.m_puff_done){ F.m_puff_done=1; questUpdated(); }
      if(F.m_puff_done&&!F.m_eclipse1&&scene==='play'&&m3sNear(M3SP.strand,300)) m3sEclipse1(); }},
  {id:'m_sable',chapter:S('The Glass Desert','The Glass Desert'),at:{x:M3SP.strand.x+200,y:M3SP.strand.y+100},
    objectives(){
      if(!m3sNear(M3SP.sable,700)&&!G.flags.m_sable_seen) return [{text:S('Follow the Caravan Road to the Oasis of Sable','Follow the road to the Oasis of Sable'),x:M3SP.road.x,y:M3SP.road.y}];
      return [m3sObj(`Talk to Caravan-master Rafi`,`Talk to Rafi, the caravan boss`,m3sWho('m_rafi',M3SP.rafi.x,M3SP.rafi.y))]; },
    hint:m3sHint('m_sable'), yara:M3S_YARA,
    soFar:S(`During an eclipse, Nyxara came herself: the great grey moth, with two pale moons on her wings. She took a huge bite of the moon, and every night since has been darker.`,`Nyxara came, the great grey moth. She took a huge bite of the moon.`),
    mom:[S(`The sun went out? In the DAY? Wear something warm. And bright.`,`The sun went out? Wear something bright!`)],
    marker:id=>id==='m_rafi'&&!G.flags.m_rafi,
    talk(n){ if(n.id==='m_rafi'&&!G.flags.m_rafi){ m3sPlay('m_rafi',()=>{ gainXp(M3S_XP.rafi); goStage('m_burrows'); }); return true; } return false; },
    update(dt){ if(!G.flags.m_sable_seen&&m3sNear(M3SP.sable,700)){ G.flags.m_sable_seen=1; questUpdated(); } }},
  {id:'m_burrows',chapter:S('The Glass Desert','The Glass Desert'),at:{x:10300,y:64400},
    objectives:()=>[m3sDunGoal('m_burrows',`Find Ember's flame in the Sandworm Burrows`,`Find Ember's flame in the Burrows`,'Find the Sandworm Burrows at the Worm Mouth, north of Sable','Find the Worm Mouth, north of Sable',M3SP.worm)],
    hint:m3sHint('m_burrows'), yara:M3S_YARA,
    soFar:S(`The sandworms go under the Glasswall. To follow them, Ash must learn to burrow.`,`The sandworms go under the glass wall. Ash must learn to dig.`),
    update(dt){ const F=G.flags;
      if(!m3sSeen('m_worm_ring')&&scene==='play'&&m3sNear(M3SP.worm,480)&&!hasAbil('burrow')) m3sPlay('m_worm_ring');
      if((F.trial_m_burrows_done||F.m_burrows_done)&&G.stage==='m_burrows'){ F.m_burrows_done=1; goStage('m_glasswall'); m3sWhen('burrows_after',()=>m3sOut(),()=>{ if(!m3sSeen('m_burrows_after')) m3sPlay('m_burrows_after'); }); } }},
  {id:'m_glasswall',chapter:S('Mirrors','Mirrors'),card:['Act IV · Chapter 4',S('Mirrors','Mirrors')],at:{x:M3SP.sable.x-300,y:M3SP.sable.y-500},
    objectives(){ const F=G.flags;
      if(!F.m_eclipse2) return [{text:S('Go back to the Oasis of Sable','Go back to the Oasis of Sable'),x:M3SP.sable.x,y:M3SP.sable.y}];
      if(!F.m_gap_dug) return [{text:S('Burrow under the Glasswall at the Burrow Gap','Dig under the glass wall at the Burrow Gap'),x:M3SP.gap.x,y:M3SP.gap.y}];
      return [Object.assign({text:S('Find the Mirror Temple on the Mirror Flats','Find the Mirror Temple on the white flats')},m3sDoorAt('m_mirror',M3SP.mirror),m3sArea('m_mirror'))]; },
    hint:m3sHint('m_glasswall'), yara:M3S_YARA,
    soFar:S(`Nyxara drank Sable's Moon Well and bit the moon again. Mom is coming! Under the Glasswall lies the Mirror Temple.`,`Nyxara drank the Moon Well. She bit the moon again. Mom is coming!`),
    mom:[S(`Worms? Under the ground? Wipe your feet before you come home.`,`Worms! Wipe your feet.`)],
    update(dt){ m3sGlassTick(dt); if(m3sIn('m_mirror')) goStage('m_mirror',{card:false}); }},
  {id:'m_mirror',chapter:S('Mirrors','Mirrors'),at:{x:M3SP.mirror.x,y:M3SP.mirror.y+200},
    objectives:()=>[m3sDunGoal('m_mirror',`Find Ember's last flame in the Mirror Temple`,`Find Ember's last flame in the temple`,'Explore the Mirror Temple','Explore the Mirror Temple',M3SP.mirror)],
    hint:m3sHint('m_mirror'), yara:M3S_YARA,
    soFar:S(`The Mirror Temple keeps Ember's moonfire, and a peacock who thinks he is the most beautiful thing in the world.`,`The Mirror Temple keeps Ember's moonfire. And a very vain peacock.`),
    update(dt){ const F=G.flags;
      if((F.trial_m_mirror_done||F.m_mirror_done)&&G.stage==='m_mirror'){ F.m_mirror_done=1;
        // Pip's Lantern (bible 7.3, room g): the dungeon plays it; if it never did, it plays here, before the Moonpath
        if(F.pip&&!F.m_pip_lamp){ if(!M3S.pipQ){ M3S.pipQ=true; m3sWhen('piplamp',null,()=>m3sPlay('m_pip_lamp',()=>{ M3S.pipQ=false; goStage('m_moonpath'); })); } }
        else goStage('m_moonpath'); } }},
  {id:'m_moonpath',chapter:S('The Eclipse Observatory','The Eclipse Observatory'),card:['Act IV · Chapter 5',S('The Eclipse Observatory','The Eclipse Observatory')],at:{x:M3SP.foot.x-150,y:M3SP.foot.y+150},
    objectives(){ const n=m3sLit();
      if(n<3) return [{text:S(`Light the Moonpath with Moonfire (${n} of 3 braziers lit)`,`Light the Moonpath with Moonfire (${n} of 3)`),x:M3SP.foot.x,y:M3SP.foot.y}];
      return [Object.assign({text:S('Climb to the Eclipse Observatory','Climb up to the Observatory')},m3sDoorAt('m_obs',M3SP.obsDoor),m3sArea('m_obs'))]; },
    hint:m3sHint('m_moonpath'), yara:M3S_YARA,
    soFar:S(`Moonfire lights the moon-glass stairs of the Moonpath, up to the Eclipse Observatory.`,`Moonfire lights the glass stairs, up to the Observatory.`),
    mom:[S(`Stairs made of moonlight? Hold the rail. There IS a rail? Hold it anyway.`,`Moonlight stairs? Hold the rail!`)],
    update(dt){ const F=G.flags;
      if(!m3sSeen('m_moonpath')&&scene==='play'&&m3sNear(M3SP.foot,300)){ m3sPlay('m_moonpath',()=>{ if(F.m_eclipse2&&!F.m_pb_3&&typeof pebbleNow==='function') later(1.2,()=>pebbleNow('m_pb_3')); }); }
      if(m3sIn('m_obs')) goStage('m_observatory',{card:false}); }},
  {id:'m_observatory',chapter:S('The Eclipse Observatory','The Eclipse Observatory'),at:{x:M3SP.foot.x-150,y:M3SP.foot.y+150},
    objectives:()=>[m3sDunGoal('m_obs','Climb the Observatory to the Dome Gallery','Climb up to the dome','Go back into the Eclipse Observatory','Go back into the Observatory',M3SP.obsDoor)],
    hint:m3sHint('m_observatory'), yara:M3S_YARA,
    soFar:S(`Hush is back, big and cold, on a silver leash. She guards the last Shard in the Eclipse Observatory.`,`Hush is back, big and cold. She guards the last Shard.`),
    enter(o){ if(!m3sSeen('m_obs_in')) m3sWhen('obs_in',()=>m3sIn('m_obs')||!AREADEFS.m_obs,()=>{ if(!m3sSeen('m_obs_in')) m3sPlay('m_obs_in',()=>gainXp(M3S_XP.obs)); }); }},
  {id:'m_reforge',chapter:S('The Ember Heart','The Ember Heart'),card:['Act IV · Final Chapter',S('The Ember Heart','The Ember Heart')],at:{x:M3SP.foot.x-150,y:M3SP.foot.y+150},
    objectives(){ const F=G.flags;
      if(F.m_done) return [{text:S('Walk to the end of the Moon Pier, where the moonfire bridge begins','Walk to the end of the pier'),x:M3SP.pierEnd.x,y:M3SP.pierEnd.y}];
      if(F.m_reforged) return [{text:S('Watch the sea from the Moon Pier','Watch the sea from the pier'),x:M3SP.pier.x,y:M3SP.pier.y}];
      return [m3sDunGoal('m_obs','Go up to the Eclipse Lens','Go up to the Eclipse Lens','Go up to the Eclipse Lens at the top of the Observatory','Go up to the Eclipse Lens',M3SP.obsDoor)]; },
    idle:()=>G.flags.m_done?S('Nightfall Peak waits at the end of the moonfire bridge. Rest when you are ready.','The bridge waits. Rest when ready.'):'',
    hint:()=>G.flags.m_done?S(`The bridge starts at the end of the Moon Pier. Mom will walk you there.`,`The bridge starts at the end of the pier.`):STORY.m_hints.m_reforge,
    soFar:()=>G.flags.m_done?S(`At the Eclipse Observatory, Hush guarded the last Shard on a silver leash. Ash won it, and the Ember Heart was made whole again. Then Nyxara ate the last of the moon, and a black mountain rose out of the sea at the edge of the world.`,`Ash got the last piece and the Heart was fixed. Then Nyxara ate the rest of the moon. A black mountain rose up.`)
      :S(`Ash won the last Shard. Mom climbed all the way up the Moonpath with her hammer. Time to mend the Ember Heart.`,`Ash won the last Shard. Mom came with her hammer. Time to fix the Heart.`),
    // (Dell's boat is in at the Moon Pier now, with Mom and Quill on their way up the Moonpath)
    enter(o){ const F=G.flags; F.m_dell_away=0; F.m_dell_pier=1; F.m_dell_left=F.m_dell_left||1; if(F.m_eclipse2) F.m_pb_3=F.m_pb_3||1; setupNPCs(); },
    update(dt){ const F=G.flags;
      // the Eclipse Lens is room q of the Observatory (x3_dun_b may also call m3sBeat('lens') at the Lens itself)
      if(!F.m_reforged&&m3sRoom('m_obs','q')&&scene==='play'&&!DLG) m3sReforge();
      // the act screen once the HUD moon has shown its last bite (or after a while, if the HUD moon is hidden)
      // (the bite animation runs in real time, so the wait for it is counted in real time too)
      if(F.m_done&&!F.act4_done&&scene==='play'&&!DLG){ M3S.endT=(M3S.endT||0)+dt; if(!M3S.endAt) M3S.endAt=performance.now();
        const hud=typeof MOON!=='undefined'&&MOON&&!!MOON.hud, run=hud&&!!MOON.anim, bite=run||(hud&&typeof moonPending==='function'&&moonPending());
        if(run) M3S.endAt=performance.now();   // (playing: always wait for its end; the 30 s are for one that never starts)
        if(M3S.endT>0.6&&(!bite||performance.now()-M3S.endAt>30000)){ M3S.endT=0; M3S.endAt=0; m3sEndAct(); } }
      if(F.m_done&&F.act4_done&&STAGEDEF.n_bridge&&scene==='play'&&m3sNear(M3SP.pierEnd,240)) m3sToFinale(); }}
]);
// the whole act: where __eb.actStart(4) begins (Hearthold, the morning after Act III), the intro, a fair test kit
// (bible 13.4: Tikka came along; every other branch value comes from e7_acts' and e7b_threads' kits)
defineAct(4,{arrive:'m_sail',at:{x:M3SP.hearth.x,y:M3SP.hearth.y},intro:o=>m3sIntroStart(o||{}),kit:{flags:{tk_come:'yes'}}});
// ---------- 6. the big beats (each one is safe to call twice)
// the act's opening: from startAct(4) (after the Act III screen, the act card is already up) or from a goStage into m_sail
function m3sIntroStart(o){
  o=o||{};
  if(M3S.introQ||m3sSeen('m_intro')) return;
  M3S.introQ=true;
  if(o.fromEnter&&!o.quiet) showCard(simplify(actLabel(4)),simplify((ACTS[4]&&ACTS[4].name)||''));
  later(o.quiet?0.6:3.0,()=>m3sWhen('intro',()=>scene==='play'&&!DLG,()=>{
    if(m3sSeen('m_intro')){ M3S.introQ=false; return; }
    if(curMap()===2) G.tod=0.3;   // morning in Hearthold
    m3sPlay('m_intro',()=>{
      M3S.introQ=false; const c=m3sStageCard.m_sail; showCard(simplify(c[0]),simplify(c[1]));
      if(G.flags.m_ship==='glaciar'&&m3sGlaciar()) later(3.0,()=>m3sTravel('glaciar')); else later(3.1,questUpdated);
    });
  }));
}
// mTravel('glaciar') in the bible: straight to Driftwood's north isle; the flight scene plays on arrival (m3sLand)
function m3sTravel(how){
  if(G.flags.m_landed||curMap()===3) return;
  if(how==='glaciar'){ G.flags.m_ship='glaciar'; mapTravel(M3SP.isle.x,M3SP.isle.y,{noSave:true}); }
}
// the first arrival in Moonfall (by Dell's boat or on Glaciar's back): the voyage scene, then Driftwood
function m3sLand(){
  if(G.flags.m_landed||M3S.landing) return;
  M3S.landing=true;
  const p=player, gl=m3sGlaciar()&&(dist(p.x,p.y,M3SP.isle.x,M3SP.isle.y)<900||(G.flags.m_ship==='glaciar'&&dist(p.x,p.y,M3SP.dock.x,M3SP.dock.y)>600));
  G.flags.m_ship=gl?'glaciar':'ship';
  m3sExtra('m_ship',gl?S(`You flew east on Auntie Glaciar's back. Very slowly.`,`You flew east on Glaciar. Slowly.`):S(`You sailed east with Dell on the Soggy Biscuit Three.`,`You sailed east with Dell.`));
  G.fade=1; M3S.fadeTo=null;
  m3sPlay(gl?'m_voyage_glaciar':'m_voyage_ship',()=>{
    M3S.landing=false; M3S.voy=null; M3S.fadeTo=null; G.flags.m_landed=1;
    if(gl) G.flags.m_land_day=typeof dayNow==='function'?dayNow():0; else G.flags.m_dell_docked=1;
    gainXp(M3S_XP.land); goStage('m_drift');
  });
}
function m3sVoy(kind){ M3S.voy={kind,t:0,moon:0,moths:0,a:1}; }
// Mags sends bombs when the Sunken Gate needs them and Ash has none (bible 6.5)
function m3sBombsCheck(){
  if(G.flags.m_bombs_given||!WEAPONS.bombs||(G.weapons&&G.weapons.bombs)) return;
  // (x3_people sends Mags's parcel by Pebble, m_pb_bombs: then this stand-in stays quiet)
  if(typeof pebbleAll==='function'&&pebbleAll().some(d=>d.id==='m_pb_bombs')) return;
  m3sWhen('bombs',()=>m3sOut()&&!(G.weapons&&G.weapons.bombs),()=>m3sPlay('m_mags_bombs'));
}
// the first eclipse, on the Strand (6.5b, THREADS N12)
function m3sEclipse1(){
  if(G.flags.m_eclipse1||M3S.eclRun) return; M3S.eclRun=true;
  M3S.cam={x:player.x+180,y:player.y-120,k:0.55};
  m3sPlay('m_eclipse1',()=>{ M3S.eclRun=false; m3sEcl('end'); G.flags.m_eclipse1=1; gainXp(M3S_XP.eclipse1); goStage('m_sable'); },{mood:'m_eclipse'});
}
// the second eclipse, at Sable's Moon Well (6.8a, N13 at 40)
function m3sEclipse2(){
  if(G.flags.m_eclipse2||M3S.eclRun) return; M3S.eclRun=true;
  M3S.cam={x:(player.x+M3SP.well.x)/2,y:(player.y+M3SP.well.y)/2-80,k:0.85};
  m3sPlay('m_eclipse2',()=>{ M3S.eclRun=false; m3sEcl('end'); G.flags.m_eclipse2=1; gainXp(M3S_XP.eclipse2); questUpdated(); },{mood:'m_eclipse'});
}
// Chapter 4 outdoors: back to the well (eclipse 2), the Burrow Gap (6.8b), the Mirror Flats banner
function m3sGlassTick(dt){
  const F=G.flags, p=player; if(!m3sOut()) return;
  if(!F.m_eclipse2&&scene==='play'&&dist(p.x,p.y,M3SP.well.x,M3SP.well.y)<500) m3sEclipse2();
  if(!F.m_eclipse2) return;
  const bur=typeof p4Burrowed==='function'&&p4Burrowed();
  // (x3_world shows the Burrow Gap lines and the Mirror Flats banner itself: these are its stand-ins)
  const W3=typeof M3WD!=='undefined';
  if(!W3&&!F.m_gap_dug&&bur&&dist(p.x,p.y,M3SP.gap.x,M3SP.gap.y)<90){ F.m_gap_dug=1; if(typeof bubble==='function') bubble(player,simplify(S(`That's the Glasswall. Pretty, isn't it? Pretty and pointy.`,`The Glasswall. Pretty and pointy!`)),{who:SPK.iska?SPK.iska.name:'Iska',col:SPK.iska?SPK.iska.col:'#ffc870',dur:3.4}); questUpdated(); }
  // (no Burrow Gap built yet, or Ash found another way): reaching the far side counts too
  if(!F.m_gap_dug&&p.x>11050&&p.y>65200&&p.y<71200){ F.m_gap_dug=1; questUpdated(); }
  if(!W3&&F.m_gap_dug&&!F.m_gap_out&&!bur&&p.x>10990&&Math.abs(p.y-M3SP.gap.y)<400){ F.m_gap_out=1; if(typeof bubble==='function') bubble(player,simplify(S(`Under! Ha! UNDER!`,`Under! Ha! UNDER!`)),{who:'Ash',dur:2.6}); }
  if(!W3&&!F.m_flats_seen&&p.x>10980&&p.x<13750&&p.y>65400&&p.y<71200){ F.m_flats_seen=1; setBanner(S('The Mirror Flats','The Mirror Flats'),S('White glass to the edge of the sky. Mirages shimmer everywhere. Some of them wave.','Shiny white glass everywhere!'),4,'region'); }
}
// Hush at the Observatory: x3_foes calls m3sBeat('hush_down', e) when she is beaten (a watcher calls it otherwise)
// m3sHushDown(e, finish): e is Hush (or null), finish is the foes module's own end of the fight (XP, the room solved,
// bossDone), called once the choice is made. Safe to call twice.
function m3sHushDown(e,finish){
  const fin=()=>{ if(typeof finish==='function') try{ finish(); }catch(err){ console.error(err); } };
  if(M3S.hushRun){ if(typeof finish==='function') M3S.hushFin=finish; return false; }
  if(G.flags.m_hush_done&&G.choices.m_hush){ if(e&&!e.dead){ e.dead=true; if(G.boss===e) G.boss=null; } fin(); return false; }
  M3S.hushRun=true; M3S.hushFin=typeof finish==='function'?finish:null;
  // (the foes module's finish() gives the fight's XP itself)
  if(M3S.hushFin) G.flags.m_hush_xp=1;
  const b=e&&!e.dead?e:null;
  // (x3_foes' Hush is already kneeling, in her own pose: she only stops)
  if(b){ b.invuln=true; b.passive=true; b.tele=null; b.vx=b.vy=0; if(!b.kneel) b.state='idle'; }
  G.taunt=null; G.tauntQ=[];
  for(const o of G.enemies) if(o!==b&&!o.dead&&(o.type==='f_mothling'||o.type==='m_mothling'||o.hushMinion)&&dist(o.x,o.y,player.x,player.y)<1200) o.dead=true;
  G.projectiles=(G.projectiles||[]).filter(p=>p.owner!=='enemy');
  m3sHushFxAt(b);
  // (inside the Observatory too: she may kneel anywhere in the Dome Gallery)
  // (a real Hush may be far from Ash: the camera looks at her, with room above for her flight)
  M3S.cam=b?{x:b.x,y:b.y-(b.z||0)-150,k:1,area:true}:{x:(player.x+M3S.hushFx.x)/2,y:(player.y+M3S.hushFx.y)/2-40,k:0.8,area:true};
  m3sPlay('m_hush_out',()=>{
    M3S.hushRun=false;
    const f2=M3S.hushFin; M3S.hushFin=null; if(f2) try{ f2(); }catch(err){ console.error(err); }
    if(b&&!b.dead){ b.dead=true; if(G.boss===b) G.boss=null; }
    m3sHushAfter();
  },{mood:'tender'});
  return true;
}
// the leash, the knots and Hush on the brass floor for the outro's pictures (at her body, or beside Ash with no fight)
function m3sHushFxAt(b){
  if(!b) b=G.enemies.find(o=>o.type==='m_hushboss'&&!o.dead&&o.hp>0)||null;
  if(M3S.hushFx&&M3S.hushFx.pose!=='free'&&M3S.hushFx.pose!=='foe') return M3S.hushFx;
  // (with a real Hush the story draws the leash, the knots and her flight or crumble during the outro's lines, and
  // hides her body when she goes: x3_foes draws no leash while she kneels, and its own flight only plays outside a
  // dialogue, so M3.hushOutcome is not used)
  M3S.hushFx={x:b?b.x:player.x+130,y:b?b.y:player.y-50,pose:'down',t:0,ent:b,mine:!b};
  return M3S.hushFx;
}
// x3_foes' story hooks (its section 11): when its Hush kneels it hands the end of the fight to the story (the outro and
// the choice); finish() is its own end of the fight (XP, bossDone, the room solved), called after the choice
if(typeof M3!=='undefined'&&M3&&M3.hook&&!M3.hook.hushDone) M3.hook.hushDone=(e,finish)=>{ m3sHushDown(e,finish); };
// after the choice, by any route (the story's own outro, or a foes module that played STORY.bosses.m_hushboss.outro):
// Shard 3, the choice's default, the fight's XP once, a blessing, then the Final Chapter. Safe to call twice.
function m3sHushAfter(){
  const F=G.flags;
  G.bossDone=G.bossDone||{}; G.bossDone.m_hushboss=true;
  if(!(G.items.m_shard3>0)&&!G.items.m_heart&&!F.m_heart) giveItems({m_shard3:1});
  if(!G.choices.m_hush) G.choices.m_hush='foe';
  if(!F.m_hush_xp){ F.m_hush_xp=1; gainXp((EDEF.m_hushboss&&EDEF.m_hushboss.value)||4100); G.pendingBless=(G.pendingBless|0)+1; }
  F.m_hush_done=1;
  later(2.4,()=>{ if(M3S.hushFx&&!M3S.hushRun) M3S.hushFx=null; });
  m3sWhen('to_reforge',()=>scene==='play'&&!DLG,()=>{ if(actOf(G.stage)===4&&!reached('m_reforge')){ goStage('m_reforge'); later(3.4,()=>m3sWhen('obs_won',null,()=>{ if(!m3sSeen('m_obs_won')&&!G.flags.m_reforged) m3sPlay('m_obs_won'); })); } });
}
function m3sHushPose(pose){
  const H=M3S.hushFx; if(!H) return;
  H.pose=pose; H.t=0;
  if(pose==='knots'){ for(const s of [-1,1]) emit(H.x+s*70,H.y+40,16,{col:'230,236,255',smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:20}); try{ SFX.play('shrine'); }catch(e){} }
  if(pose==='free'||pose==='foe'){ if(H.ent) H.ent.alpha=0; try{ SFX.play(pose==='free'?'shrine':'pop'); }catch(e){} }
  if(pose==='foe') for(let i=0;i<4;i++) emit(H.x,H.y-30,26,{col:'238,236,250',glow:false,ang:-Math.PI/2,spread:0.7,smin:60,smax:220,lmin:.8,lmax:1.6,zmin:1.5,zmax:3,rise:60});
}
// Mom and Professor Quill come up the stairs (inside the Lens room, or at the door when there is no Observatory yet)
function m3sMomIn(){
  const L=AREA?AREA.npcs:G.npcs, p=player;
  const put=(id,dx,dy)=>{ const c=CASTBY[id]||SPECIAL[id]; if(!c||L.some(n=>n.id===id)) return; const n=mkNPC(c,p.x+dx,p.y+dy); n.walker=false; n.m3=true; n.face=angTo(n.x,n.y,p.x,p.y); L.push(n); };
  put('maren',-70,110); put('quill',80,130);
  try{ SFX.play('step'); }catch(e){}
}
function m3sHeartWhole(){
  if(G.flags.m_heart&&G.items.m_heart) return;
  const S3={}; for(const k of ['c_shard1','f_shard2','m_shard3']) if(G.items[k]>0) S3[k]=G.items[k]; takeItems(S3);
  giveItems({m_heart:1}); G.flags.m_heart=1; G.flags.m_reforged=1; if(!G.flags.m_reforge_xp){ G.flags.m_reforge_xp=1; gainXp(M3S_XP.reforge); }
  m3sHeartFx();
}
// the reforging in room q: Mom's scene, the three taps, the Heart; then everyone runs down to the Moon Pier
function m3sReforge(){
  if(G.flags.m_reforged||M3S.forgeRun) return false; M3S.forgeRun=true;
  M3S.cam=null;
  m3sPlay('m_reforge',()=>m3sForgeTaps(()=>m3sPlay('m_reforge2',()=>{ M3S.forgeRun=false; m3sToPier(); },{mood:'tender'})),{mood:'m_eclipse'});
  return true;
}
function m3sToPier(){
  G.flags.m_reforged=1; G.flags.m_maren=1; G.flags.m_dell_pier=1; G.flags.m_dell_away=0;
  G.tod=0.5; G.fade=1; M3S.fadeTo=null;
  mapTravel(M3SP.pier.x,M3SP.pier.y,{noSave:true});
  player.facing=0; setupNPCs(); saveGame();
  later(0.25,()=>{ G.fade=1; M3S.cam={x:player.x+260,y:player.y-60,k:0.7}; m3sPlay('m_peak',()=>m3sPeakDone(),{mood:'m_eclipse'}); });
}
// everyone on the pier turns to look out to sea
function m3sPartyLook(){ for(const n of G.npcs) if(dist(n.x,n.y,M3SP.pier.x,M3SP.pier.y)<800){ n.face=angTo(n.x,n.y,M3SP.pierEnd.x+800,M3SP.pierEnd.y-300); } player.facing=-0.35; }
function m3sPeakDone(){
  m3sEcl('end'); G.tod=0.02; G.flags.m_done=1; M3S.endT=0; M3S.endAt=0;
  setupNPCs();   // (the Final Chapter's update shows the act screen after the HUD moon's last bite)
}
// the end of the act (FINALE's contract: m_heart item and flag, the moon at 0, m_done, then n_bridge)
function m3sEndAct(){
  if(G.flags.act4_done) return;
  m3sMoon(0); G.flags.m_done=1; if(!G.flags.m_end_xp){ G.flags.m_end_xp=1; gainXp(M3S_XP.peak); }
  if(M3S.peak) M3S.peak.aT=0;
  const free=G.choices.m_hush==='free';
  endAct(4,{title:S('Act IV: The Night Mother','Act IV: The Night Mother'),lines:[
    S('The Ember Heart is whole.','The Ember Heart is whole.'),S('The moon is gone.','The moon is gone.'),
    free?S('Hush is free.','Hush is free.'):S('Hush went back to the Mother.','Hush went back to the Mother.'),
    S('Next: Nightfall Peak.','Next: Nightfall Peak.')],next:'n_bridge'});
}
// "Continue the story": the finale's first stage (FINALE.md: n_bridge), or a banner until the finale is built
function m3sGoTo(s){
  if(!STAGEDEF[s]){ setBanner(S('To be continued!','To be continued!'),S('Nightfall Peak waits across the moonfire bridge. That part of the story is still being written.','The next part is coming soon.'),4); return false; }
  const n=actOf(s); if(n!==G.act&&ACTS[n]&&actStages(n).length) return startAct(n,{stage:s});
  goStage(s); return true;
}
function m3sToFinale(){ if(M3S.finT&&G.time-M3S.finT<4) return false; M3S.finT=G.time; return m3sGoTo('n_bridge'); }
// endAct(n,{next:'<stage id>'}) works with a stage id as well as a function (Act III may hand off with next:'m_sail')
{ const base=endAct; endAct=function(n,o){ if(o&&typeof o.next==='string'){ const s=o.next; o=Object.assign({},o,{next:()=>m3sGoTo(s)}); } return base(n,o); };
  // (the debug handle e7_acts made holds the old function: it gets this one too)
  for(const k of ['__ebX','__eb']) if(window[k]&&typeof window[k].endAct==='function') window[k].endAct=endAct; }
// ---------- 7. the reforging taps (bible 5.6): three taps; press ATTACK (or any key, or tap) as the shrinking gold ring
// meets the Heart. A generous window (twice as wide on Easy); a miss only makes Mom say "Gently!" and that tap is retried.
function m3sForgeTaps(done){
  const easy=m3sEasy(), hard=m3sHard();
  M3S.forge={n:0,need:3,t:0,per:easy?2.3:hard?1.6:1.9,win:easy?0.46:hard?0.17:0.23,u0:0.3,pause:0.7,msg:'',msgWho:'',msgT:0,flash:0,hammer:0,miss:0,tap:false,pad:true,done};
  scene='m3forge'; hideAll(); M3S.cam=null;
}
function m3sForgePress(){
  const F=M3S.forge; if(!F||F.pause>0) return;
  const th=F.per*(1-F.u0);
  if(Math.abs(F.t-th)<=F.win){
    F.n++; F.flash=1; F.hammer=1; F.msg=F.n>=F.need?S('TING! The Heart is whole!','TING! It is whole!'):S('TING!','TING!'); F.msgWho=''; F.msgT=1.3; F.pause=F.n>=F.need?1.4:0.75; F.t=0;
    shake(7); try{ SFX.play('chest'); SFX.play('shrine'); }catch(e){}
  }else{ F.miss++; F.msg=S('Gently!','Gently!'); F.msgWho='maren'; F.msgT=1.4; F.pause=0.6; F.t=0; try{ SFX.play('ui'); }catch(e){} }
}
function m3sForgeTick(dt){
  const F=M3S.forge; if(!F) return;
  F.flash=Math.max(0,F.flash-dt*2); F.hammer=Math.max(0,F.hammer-dt*2.6); if(F.msgT>0) F.msgT-=dt;
  // input: any key (Escape opens nothing here), a click or a tap, or any gamepad button
  let down=F.tap; F.tap=false;
  try{ if(pressed.size&&!pressed.has('Escape')) down=true; }catch(e){}
  try{ const gp=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[]; const on=gp.some(q=>q.buttons.some(b=>b&&b.pressed)); if(on&&!F.pad) down=true; F.pad=on; }catch(e){}
  if(F.pause>0){ F.pause-=dt; if(F.pause<=0&&F.n>=F.need) m3sForgeEnd(); return; }
  F.t+=dt;
  if(down) m3sForgePress();
  else if(F.t>F.per+0.15){ F.t=0; F.msg=S('Now! When the rings meet!','Tap when they meet!'); F.msgWho='maren'; F.msgT=1.4; F.pause=0.35; }
}
function m3sForgeEnd(){ const F=M3S.forge; M3S.forge=null; scene='play'; if(F&&F.done) try{ F.done(); }catch(e){ console.error(e); } }
addEventListener('pointerdown',()=>{ if(scene==='m3forge'&&M3S.forge) M3S.forge.tap=true; },true);
function m3sDrawForge(F){
  const g=ctx, cx=W/2, cy=H*0.46, R0=Math.min(W,H)*0.3, t=G.time;
  g.save(); g.fillStyle='rgba(12,8,24,.84)'; g.fillRect(0,0,W,H);
  // the Eclipse Lens: moon-glass in a brass ring, catching the eclipse light
  m3sGlowG(g,cx,cy,R0*1.5,'200,190,255',0.25+0.2*F.flash);
  g.fillStyle='rgba(206,222,246,.22)'; m3sDot(g,cx,cy,R0*1.08); g.fill();
  g.lineWidth=7; g.strokeStyle=SBC.outline; g.stroke(); g.lineWidth=4; g.strokeStyle='#d8a84a'; g.stroke();
  // the window band round the Heart, the target ring and the shrinking gold ring
  const dw=F.win/F.per;
  g.fillStyle='rgba(255,214,120,.2)'; g.beginPath(); g.arc(cx,cy,R0*(F.u0+dw),0,TAU); g.arc(cx,cy,Math.max(4,R0*(F.u0-dw)),0,TAU,true); g.fill();
  g.lineWidth=3; g.strokeStyle='#fff4dc'; g.setLineDash([6,5]); m3sDot(g,cx,cy,R0*F.u0); g.stroke(); g.setLineDash([]);
  if(F.pause<=0){ const u=Math.max(0,1-F.t/F.per); g.lineWidth=9; g.strokeStyle=SBC.outline; m3sDot(g,cx,cy,R0*u); g.stroke(); g.lineWidth=5; g.strokeStyle='#ffcf5a'; g.stroke(); }
  // the Heart: three Shards closing round an orange core (closer with every TING)
  const k=F.n/F.need, gap=(1-k)*R0*0.09, hr=R0*0.2, cols=[['#9a6ad8','#cdb0f6'],['#7ad0f0','#d8f6ff'],['#d8dcec','#ffffff']];
  m3sGlowG(g,cx,cy,hr*2.6,'255,150,70',0.25+0.45*k);
  g.fillStyle='#ff8a3a'; m3sDot(g,cx,cy,hr*(0.35+0.4*k)); g.fill();
  for(let i=0;i<3;i++){ const a0=-Math.PI/2+i*TAU/3, a1=a0+TAU/3, am=(a0+a1)/2, ox=Math.cos(am)*gap, oy=Math.sin(am)*gap;
    g.beginPath(); g.moveTo(cx+ox,cy+oy); g.arc(cx+ox,cy+oy,hr,a0+0.04,a1-0.04); g.closePath();
    g.fillStyle=cols[i][0]; g.fill(); g.lineWidth=3; g.strokeStyle=SBC.outline; g.stroke();
    g.fillStyle=cols[i][1]; g.globalAlpha=0.7; g.beginPath(); g.arc(cx+ox+Math.cos(am)*hr*0.45,cy+oy+Math.sin(am)*hr*0.45,hr*0.16,0,TAU); g.fill(); g.globalAlpha=1; }
  // Mom's hammer, coming down on every TING
  const hx=cx+R0*0.78, hy=cy-R0*0.62, ha=-0.9+F.hammer*1.1;
  g.save(); g.translate(hx,hy); g.rotate(ha); g.fillStyle='#8a5a32'; g.strokeStyle=SBC.outline; g.lineWidth=3; g.fillRect(-4,0,8,R0*0.5); g.strokeRect(-4,0,8,R0*0.5);
  g.fillStyle='#9aa4b4'; g.fillRect(-22,-12,44,22); g.strokeRect(-22,-12,44,22); g.restore();
  // words: the count, what to do, and Mom
  g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round';
  // (a line too wide for a phone shrinks to fit)
  const tx=(s,x,y,sz,col)=>{ g.font=`800 ${sz}px ${UIF}`; const w=g.measureText(s).width, mx=W-28; if(w>mx){ sz=Math.max(10,Math.floor(sz*mx/w)); g.font=`800 ${sz}px ${UIF}`; } g.lineWidth=Math.max(4,sz*0.28); g.strokeStyle=SBC.outline; g.strokeText(s,x,y); g.fillStyle=col; g.fillText(s,x,y); };
  tx(simplify(S(`The Ember Heart · ${F.n} of 3`,`The Heart · ${F.n} of 3`)),cx,Math.max(40,cy-R0*1.32),Math.round(Math.min(26,W*0.05)),'#ffe6a0');
  tx(simplify(usingTouch?S('Tap the screen when the gold ring meets the Heart!','Tap when the rings meet!'):S('Press ATTACK when the gold ring meets the Heart!','Press ATTACK when the rings meet!')),cx,Math.min(H-40,cy+R0*1.32),Math.round(Math.min(18,W*0.04)),'#fff4dc');
  if(F.msgT>0&&F.msg){ g.globalAlpha=clamp(F.msgT/0.3,0,1); const who=F.msgWho&&SPK[F.msgWho]?SPK[F.msgWho].name+': ':''; tx(who+simplify(F.msg),cx,cy-R0*0.72,Math.round(Math.min(34,W*0.07)),F.msgWho?'#ffd0a0':'#ffffff'); g.globalAlpha=1; }
  if(F.flash>0){ g.globalAlpha=F.flash*0.35; g.fillStyle='#fff0c8'; g.fillRect(0,0,W,H); g.globalAlpha=1; }
  g.restore();
}
// ---------- 8. the eclipses (bible 5.2): the day darkens over 2 s, a dark disc slides over the sun, Nyxara comes (a moth
// the size of a house), the bite (the moon value drops, the HUD plays its bite animation when calm), daylight comes back
// grey and thin. The scripts drive it step by step: m3sEcl('start',n), 'dark', 'rise', 'hush', 'land', 'drink',
// 'bite',pct, 'eyes', 'leave', 'gone', 'end'. G.flags.m_eclipse_on is up while it runs (x9_music2 plays m_eclipse).
function m3sEcl(cmd,arg){
  let E=M3S.ecl;
  if(cmd==='start'||!E){
    if(E&&cmd==='start'&&!E.ending) return;
    const n=cmd==='start'?(arg||1):1;
    if(!AREA&&isNight()&&n<3) G.tod=0.42;   // an eclipse needs a sun
    E=M3S.ecl={n,t:0,k:0,kT:0,disc:0,discT:0,sunA:1,moth:null,hush:null,flyer:null,flash:0,eyes:0,eyesK:0,leave:0,drink:0,well:n===2?1:0,sky:n===3,ending:false,gone:false};
    G.flags.m_eclipse_on=1;
    if(n===3){ E.kT=1; E.discT=1; }
    if(cmd==='start') return;
  }
  const p=player;
  switch(cmd){
    case 'dark': E.kT=1; E.discT=1; break;
    // (a phone held upright gets her above Ash; a wide screen gets her over the dunes to his right)
    case 'rise': if(W<600){ E.moth={x:p.x+30,y:p.y-40,z:0,zT:150,s:0.2,sT:0.62,a:0,aT:1,f:0,vx:0}; M3S.cam={x:p.x+20,y:p.y-230,k:0.8}; }
      else { E.moth={x:p.x+300,y:p.y+10,z:0,zT:130,s:0.25,sT:0.85,a:0,aT:1,f:0,vx:0}; M3S.cam={x:p.x+210,y:p.y-130,k:0.75}; } break;
    case 'hush': if(E.moth) E.hush={x:E.moth.x+(W<600?-120:-260),y:E.moth.y-60,z:E.moth.z,s:W<600?0.4:0.45,a:0,aT:1,f:0,dx:W<600?-120:-260}; break;
    // (the camera sits between Ash and the well so both are in the picture; she is a little smaller here, perched)
    case 'land': { E.kT=1; E.discT=1; const sc=W<600?0.48:0.62, d=Math.hypot(p.x-M3SP.well.x,p.y-M3SP.well.y);
      E.moth={x:M3SP.well.x,y:M3SP.well.y+8,z:620,zT:80,s:sc,sT:sc,a:0,aT:1,f:0,vx:0,perch:true};
      M3S.cam={x:(p.x+M3SP.well.x)/2,y:(p.y+M3SP.well.y)/2-(W<600?150:110),k:d>500?0.75:1}; break; }
    case 'drink': E.drink=1; try{ SFX.play('water'); }catch(e){} break;
    case 'bite': m3sMoon(arg==null?m3sMoonNow():arg); E.flash=1; m3sJ('m_bite','hit'); shake(10); if(E.moth){ E.moth.zT+=16; E.moth.sT*=1.05; } if(arg===0){ E.sunT=0; E.gone=true; } break;
    case 'eyes': E.eyes=1; break;
    case 'leave': E.leave=1; E.discT=0; if(E.n<3) E.kT=0; if(E.n===2) E.flyer={x:M3SP.well.x-500,y:M3SP.well.y-200,t:0}; break;
    case 'gone': E.gone=true; E.discT=0; break;
    case 'end': E.ending=true; E.kT=0; E.discT=0; if(E.moth) E.moth.aT=0; if(E.hush) E.hush.aT=0; M3S.grey=E.n<3?9:0; break;
  }
}
function m3sEclTick(dt){
  const E=M3S.ecl; if(!E) return;
  E.t+=dt;
  const ap=(v,to,sp)=>v<to?Math.min(to,v+dt*sp):Math.max(to,v-dt*sp);
  E.k=ap(E.k,E.kT,0.5); E.disc=ap(E.disc,E.discT,0.55); E.flash=Math.max(0,E.flash-dt*1.6); E.eyesK=ap(E.eyesK,E.eyes,0.7);
  if(E.sunT!=null) E.sunA=ap(E.sunA,E.sunT,0.4);
  const M=E.moth;
  if(M){ M.f+=dt; M.z+=(M.zT-M.z)*Math.min(1,dt*1.3); M.s+=(M.sT-M.s)*Math.min(1,dt*1.3); M.a=ap(M.a,M.aT,0.9);
    if(E.leave){ M.vx+=dt*90; M.x+=M.vx*dt; M.zT+=dt*240; M.aT=0; } }
  const Hh=E.hush;
  if(Hh&&M){ Hh.f+=dt; Hh.x+=((M.x+(Hh.dx||-260))-Hh.x)*Math.min(1,dt*0.8); Hh.y+=((M.y-60)-Hh.y)*Math.min(1,dt*0.8); Hh.z+=((M.z+10)-Hh.z)*Math.min(1,dt*0.9); Hh.a=ap(Hh.a,E.leave?0:Hh.aT,0.8); }
  if(E.flyer){ const F=E.flyer; F.t+=dt; const u=Math.min(1,F.t/5); F.x=lerp(M3SP.well.x-500,M3SP.obs.x,u); F.y=lerp(M3SP.well.y-200,M3SP.obs.y,u); if(u>=1) E.flyer=null; }
  if(E.well){ if(E.wellK==null) E.wellK=1; if(E.drink) E.wellK=Math.max(0.12,E.wellK-dt*0.35); }
  if(E.ending&&E.k<0.02&&E.disc<0.02&&(!M||M.a<0.02)){ M3S.ecl=null; G.flags.m_eclipse_on=0; }
}
// the extra dark of the eclipse rides on the night dark outdoors; the light turns violet, then grey and thin after
{ const base=mapNight; mapNight=function(){ let v=base(); try{ const E=M3S.ecl; if(E&&!AREA) v+=E.k*(E.n===3?0.5:0.58); }catch(e){} return v; }; }
{ const base=ambientTint; ambientTint=function(){ let c=base(); try{ if(AREA||!G) return c; const E=M3S.ecl; if(E) c=mixRGB(c,[110,96,160],E.k*0.5); if(M3S.grey>0) c=mixRGB(c,[178,178,192],Math.min(1,M3S.grey/3)*0.32); }catch(e){} return c; }; }
// a moth seen from above, head up, centred on (0,0). W is half the wingspan; f how open the wings are (0.55 to 1)
const M3S_MARKS=[[0.3,-0.16],[0.44,-0.44],[0.7,-0.5],[0.84,-0.3],[0.52,-0.1],[0.24,-0.34],[0.9,-0.44],[0.34,0.3],[0.5,0.42]];
// (v11: Nyxara is "grey and soft as dust, with two pale moons painted on her wings", n_nyxara.js: dusty grey wings, a
// pale moon where the painted eyes were, and still the small marks that open like eyes when she is angry)
const M3S_NYX={fore:'#787282',fore2:'#8a8494',hind:'#6a6476',band:'#d2cedb',ring:'#f2f0f7',moonSh:'#b2aec6',eye:'#8a5ad8',pupil:'#140a24',fur:'#625c6e',fur2:'#7e788a',ant:'#e2e0ee',marks:9,glow:'168,160,218',moonEyes:true,moons:true,dust:true};
const M3S_DUST=[[0.2,-0.22],[0.28,-0.42],[0.38,-0.56],[0.62,-0.58],[0.8,-0.52],[0.92,-0.3],[0.86,-0.14],[0.68,-0.06],[0.4,-0.02],[0.22,0.06],[0.3,0.2],[0.46,0.3],[0.56,0.52],[0.4,0.58],[0.2,0.4],[0.74,-0.4],[0.5,-0.48],[0.16,-0.1]];
const M3S_HUSH={fore:'#f4f2fa',fore2:'#e6e2f2',hind:'#e8e4f4',band:'#cfdcf4',ring:'#ece2ff',eye:'#9a6ae0',pupil:'#2a1a4a',fur:'#ffffff',fur2:'#e8e4f6',ant:'#f0ecff',marks:0,glow:'230,236,255',frost:true};
function m3sMothFig(g,Wd,f,o,open){
  const O=SBC.outline, lw=Math.max(1.4,Wd*0.017), W=Wd;
  g.lineJoin='round'; g.lineCap='round';
  if(o.glow){ g.save(); g.globalCompositeOperation='lighter'; m3sGlowG(g,0,0,W*1.25,o.glow,0.2); g.restore(); }
  // six long thin legs, under the wings
  g.strokeStyle=O; g.lineWidth=lw*0.8;
  for(const s of [-1,1]) for(let i=0;i<3;i++){ const y0=-W*0.06+i*W*0.07; g.beginPath(); g.moveTo(s*W*0.05,y0); g.quadraticCurveTo(s*W*0.2,y0+W*0.05,s*W*(0.26+i*0.03),y0+W*(0.16+i*0.05)); g.stroke(); }
  for(const s of [-1,1]){
    g.fillStyle=o.hind; g.strokeStyle=O; g.lineWidth=lw;
    g.beginPath(); g.moveTo(s*W*0.05,W*0.02); g.bezierCurveTo(s*W*0.42*f,W*0.02,s*W*0.74*f,W*0.34,s*W*0.56*f,W*0.6); g.bezierCurveTo(s*W*0.38*f,W*0.78,s*W*0.12,W*0.5,s*W*0.04,W*0.18); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=o.fore;
    g.beginPath(); g.moveTo(s*W*0.05,-W*0.08); g.bezierCurveTo(s*W*0.24*f,-W*0.5,s*W*0.86*f,-W*0.66,s*W*1.0*f,-W*0.36); g.bezierCurveTo(s*W*1.06*f,-W*0.12,s*W*0.7*f,W*0.1,s*W*0.05,W*0.06); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=o.fore2; g.beginPath(); g.moveTo(s*W*0.09,-W*0.04); g.bezierCurveTo(s*W*0.3*f,-W*0.36,s*W*0.62*f,-W*0.42,s*W*0.72*f,-W*0.2); g.bezierCurveTo(s*W*0.66*f,-W*0.02,s*W*0.36*f,W*0.04,s*W*0.09,W*0.04); g.closePath(); g.fill();
    g.strokeStyle=o.band; g.lineWidth=W*0.034; g.beginPath(); g.moveTo(s*W*0.3*f,-W*0.5); g.bezierCurveTo(s*W*0.6*f,-W*0.64,s*W*0.92*f,-W*0.58,s*W*0.98*f,-W*0.36); g.stroke();
    g.strokeStyle=O; g.lineWidth=lw;
    g.fillStyle=o.band; m3sDot(g,s*W*0.44*f,W*0.4,W*0.05); g.fill();
    // the dust: fine pale and dark specks over the wings
    if(o.dust){ const ds=Math.max(0.8,W*0.012); for(let i=0;i<M3S_DUST.length;i++){ const [ux,uy]=M3S_DUST[i]; g.fillStyle=i%3?'rgba(236,232,244,.5)':'rgba(52,46,64,.35)'; m3sDot(g,s*W*ux*f,W*uy,ds*(1+(i%2)*0.6)); g.fill(); } }
    // the painted eye (Hush), or a pale painted moon (Nyxara): a soft glow, a crescent of shadow, two little craters
    const ex=s*W*0.58*f, ey=-W*0.27, er=W*0.15;
    if(o.moons){
      g.save(); g.globalCompositeOperation='lighter'; m3sGlowG(g,ex,ey,er*1.8,'236,234,255',0.32); g.restore();
      g.fillStyle=o.ring; m3sDot(g,ex,ey,er); g.fill(); g.stroke();
      g.save(); m3sDot(g,ex,ey,er-lw*0.5); g.clip(); g.fillStyle=o.moonSh; m3sDot(g,ex-s*er*0.55,ey+er*0.2,er*0.9); g.fill();
      g.fillStyle=o.ring; m3sDot(g,ex+s*er*0.12,ey-er*0.06,er*0.8); g.fill(); g.restore();
      g.fillStyle='rgba(176,170,196,.7)'; m3sDot(g,ex+s*er*0.3,ey-er*0.25,er*0.16); g.fill(); m3sDot(g,ex+s*er*0.05,ey+er*0.38,er*0.11); g.fill();
    } else {
    g.fillStyle=o.ring; m3sDot(g,ex,ey,er); g.fill(); g.stroke();
    g.fillStyle=o.eye; m3sDot(g,ex,ey,er*0.66); g.fill();
    g.fillStyle=o.pupil; m3sDot(g,ex,ey,er*0.3); g.fill();
    g.fillStyle='rgba(255,255,255,.85)'; m3sDot(g,ex-er*0.25,ey-er*0.27,er*0.13); g.fill();
    }
    // a hundred small pale marks like closed eyes; they open one by one when she is angry
    if(o.marks){ const nOpen=Math.round((open||0)*o.marks);
      for(let i=0;i<o.marks;i++){ const [ux,uy]=M3S_MARKS[i], mx=s*W*ux*f, my=W*uy, mr=W*0.035;
        if(i<nOpen){ g.fillStyle='#e8e0ff'; g.beginPath(); g.ellipse(mx,my,mr*1.3,mr,0,0,TAU); g.fill(); g.fillStyle='#2a1a40'; m3sDot(g,mx,my,mr*0.5); g.fill(); }
        else { g.strokeStyle='rgba(216,208,236,.8)'; g.lineWidth=Math.max(1,W*0.012); g.beginPath(); g.arc(mx,my-mr*0.4,mr*1.2,0.35,Math.PI-0.35); g.stroke(); } } g.strokeStyle=O; g.lineWidth=lw; }
    if(o.frost){ g.fillStyle='rgba(200,236,255,.9)'; for(const [ux,uy] of [[0.36,-0.3],[0.62,-0.48],[0.8,-0.22],[0.3,0.36]]){ const x=s*W*ux*f, y=W*uy; g.fillRect(x-1.5,y-1.5,3,3); } }
  }
  // the furry body, like smoke
  g.fillStyle=o.fur; g.beginPath(); g.ellipse(0,W*0.1,W*0.075,W*0.3,0,0,TAU); g.fill(); g.stroke();
  g.fillStyle=o.fur2; for(let i=0;i<4;i++){ m3sDot(g,0,W*(0.02+i*0.09),W*0.045); g.fill(); }
  g.fillStyle=o.fur; m3sDot(g,0,-W*0.13,W*0.085); g.fill(); g.stroke();
  // antennae like silver ferns
  g.strokeStyle=o.ant; g.lineWidth=Math.max(1.2,W*0.014);
  for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*W*0.03,-W*0.2); g.quadraticCurveTo(s*W*0.08,-W*0.42,s*W*0.24,-W*0.52); g.stroke();
    for(let i=1;i<6;i++){ const u=i/6, x=s*(W*0.03+W*0.21*u), y=-W*0.2-W*0.32*u; g.beginPath(); g.moveTo(x,y); g.lineTo(x+s*W*0.04,y-W*0.01); g.moveTo(x,y); g.lineTo(x-s*W*0.01,y-W*0.04); g.stroke(); } }
  // two real eyes like small white moons
  for(const s of [-1,1]){ if(o.moonEyes){ g.save(); g.globalCompositeOperation='lighter'; m3sGlowG(g,s*W*0.045,-W*0.15,W*0.06,'240,240,255',0.8); g.restore(); }
    g.fillStyle=o.moonEyes?'#f4f4ff':'#3a2a5a'; m3sDot(g,s*W*0.045,-W*0.15,W*0.026); g.fill(); }
}
// the world layer (drawn after the night shade, so she is never darkened): her shadow, Hush on the leash, Nyxara
function m3sDrawWorld(){
  const E=M3S.ecl, t=G.time;
  if(E&&!AREA){
    const M=E.moth, Hh=E.hush;
    if(M&&M.a>0.01){ ctx.save(); ctx.globalAlpha=0.3*M.a; ctx.fillStyle='#120a20'; ctx.beginPath(); ctx.ellipse(M.x,M.y+12,200*M.s,70*M.s,0,0,TAU); ctx.fill(); ctx.restore(); }
    if(Hh&&Hh.a>0.01&&M){
      // the silver leash: from her neck to Nyxara, and on up into the sky
      const hx=Hh.x, hy=Hh.y-Hh.z, nx=M.x+30*M.s, ny=M.y-M.z+30*M.s;
      ctx.save(); ctx.globalAlpha=Hh.a; ctx.strokeStyle='#e8eef8'; ctx.lineWidth=2; ctx.shadowColor='#cfe0ff'; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.moveTo(hx,hy-10); ctx.quadraticCurveTo((hx+nx)/2,Math.max(hy,ny)+30,nx,ny); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx,hy-10); ctx.lineTo(hx+40,hy-900); ctx.stroke();
      const gl=(t*0.6)%1; ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(lerp(hx,hx+40,gl),lerp(hy-10,hy-900,gl),3,0,TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha=Hh.a; ctx.translate(hx,hy); ctx.scale(Hh.s,Hh.s); m3sMothFig(ctx,190,0.7+0.3*Math.cos(Hh.f*3.2),M3S_HUSH,0); ctx.restore();
    }
    if(M&&M.a>0.01){ ctx.save(); ctx.globalAlpha=M.a; ctx.translate(M.x,M.y-M.z); ctx.scale(M.s,M.s);
      const f=M.perch?0.95+0.05*Math.cos(M.f*1.2):0.74+0.26*Math.cos(M.f*2.1);
      m3sMothFig(ctx,200,f,M3S_NYX,E.eyesK);
      if(E.drink&&M.perch&&!E.leave){ ctx.strokeStyle='#b8a0e0'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(0,-30); ctx.bezierCurveTo(20,40,-30,90,0,M.z/M.s-20); ctx.stroke(); }
      ctx.restore(); }
    // the Moon Well's silver light, draining as she drinks
    if(E.well){ const wk=E.wellK==null?1:E.wellK; glowAt(M3SP.well.x,M3SP.well.y,90+30*wk,'200,215,255',0.5*wk); }
    // the white shape on the silver thread, flying low over Sable toward the Heights
    if(E.flyer){ const F=E.flyer; ctx.save(); ctx.globalAlpha=Math.min(1,F.t)*Math.min(1,(5-F.t)); ctx.translate(F.x,F.y-260); ctx.rotate(0.6); ctx.scale(0.35,0.35); m3sMothFig(ctx,190,0.75+0.25*Math.cos(t*4),M3S_HUSH,0); ctx.restore(); }
  }
  m3sDrawHushFx();
  // after the peak rises: the start of the moonfire bridge glows at the end of the Moon Pier, until the finale's own
  // bridge shows there (its crossing is hidden until n_bridge, so Act IV's walk to the end of the pier needs this one)
  const finBridge=LANDMARKS.some(o=>o.id==='xing_n_bridge_in')&&(!!G.flags.n_bridge_open||(stageAt('n_bridge')>=0&&reached('n_bridge')));
  if(G.flags.m_eclipse3&&!AREA&&curMap()===3&&inView(M3SP.pierEnd.x,M3SP.pierEnd.y,300)&&!finBridge){
    const pk=M3S.peak, b=pk?pk.bridge:1;
    if(b>0.01){ ctx.save(); ctx.globalCompositeOperation='lighter'; const x0=M3SP.pierEnd.x, y0=M3SP.pierEnd.y, x1=x0+600*b;
      const gr=ctx.createLinearGradient(x0,y0,x1,y0); gr.addColorStop(0,'rgba(220,232,255,.9)'); gr.addColorStop(1,'rgba(160,190,255,0)');
      ctx.strokeStyle=gr; ctx.lineWidth=18; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y0); ctx.stroke(); ctx.lineWidth=6; ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.stroke();
      glowAt(x0,y0,120+10*Math.sin(t*3),'200,215,255',0.5); ctx.restore(); }
  }
}
// Hush after her fight: lying on the brass floor with the leash, then free (she floats up) or crumbling into little moths
function m3sDrawHushFx(){
  const H=M3S.hushFx; if(!H) return; const t=G.time;
  if(H.ent&&!H.ent.dead&&H.pose==='down'){ H.x=H.ent.x; H.y=H.ent.y; H.z=H.mine?0:(H.ent.z||0); }
  const kx=[H.x-80,H.x+80], ky=H.y+46, hy=H.y-(H.z||0);
  const leash=H.pose==='down'||H.pose==='knots'?1:H.pose==='foe'?Math.max(0,1-H.t/2.4):Math.max(0,1-H.t*1.5);
  if(leash>0.01){ ctx.save(); ctx.globalAlpha=leash; ctx.strokeStyle='#e8eef8'; ctx.lineWidth=2.2; ctx.shadowColor='#cfe0ff'; ctx.shadowBlur=8;
    for(const x of kx){ ctx.beginPath(); ctx.moveTo(H.x,hy-12); ctx.quadraticCurveTo((H.x+x)/2,ky+14,x,ky); ctx.stroke(); }
    if(H.pose!=='knots'){ ctx.beginPath(); ctx.moveTo(H.x,hy-12); ctx.lineTo(H.x+10,hy-1200); ctx.stroke(); }
    ctx.fillStyle='#ffffff'; for(const x of kx){ ctx.beginPath(); ctx.arc(x,ky,5,0,TAU); ctx.fill(); }
    ctx.restore(); }
  if(H.pose==='down'||H.pose==='knots'){ if(H.mine){ ctx.save(); ctx.translate(H.x,H.y); ctx.scale(0.62,0.62); m3sMothFig(ctx,200,0.58,M3S_HUSH,0); ctx.restore(); } return; }
  if(H.pose==='free'){ const u=Math.min(1,H.t/3), z=u*u*420, a=Math.max(0,1-Math.max(0,H.t-1.6)/1.4);
    ctx.save(); ctx.globalAlpha=a; glowAt(H.x,hy-z,160,'230,236,255',0.6*a); ctx.translate(H.x,hy-z); ctx.scale(0.62-0.2*u,0.62-0.2*u); m3sMothFig(ctx,200,0.7+0.3*Math.cos(t*3),M3S_HUSH,0); ctx.restore(); return; }
  if(H.pose==='foe'){ const a=Math.max(0,1-H.t/2.6);
    ctx.save(); for(let i=0;i<60;i++){ const u=((i*0.137+H.t*0.5)%1), x=H.x+Math.sin(i*7.3+t*3)*40*(1-u)+10*u, y=hy-20-u*900*(0.3+H.t*0.4), s=0.45+0.3*((i*0.71)%1);
      ctx.globalAlpha=a*(1-u*0.6); thrMoth(ctx,x,y,s,t*14+i,'#f4f2fa','rgba(160,120,230,.9)'); } ctx.restore(); }
}
// the screen layer: the darkening sky, the sun and the bitten disc, Nyxara across the sun (the last eclipse)
const M3S_DISC=new Map();
function m3sDiscSprite(b,R){
  const key=b+'|'+Math.round(R); let c=M3S_DISC.get(key); if(c) return c;
  const S0=Math.ceil(R*2.6)+6; c=mkCanvas(S0,S0); const q=c.getContext('2d'); q.translate(S0/2,S0/2);
  q.fillStyle='#1c1630'; q.beginPath(); q.arc(0,0,R,0,TAU); q.fill(); q.lineWidth=Math.max(2,R*0.07); q.strokeStyle='#3b2233'; q.stroke();
  if(b>0&&typeof biteShape==='function'&&typeof MOON_BITES!=='undefined'){ q.globalCompositeOperation='destination-out'; for(let i=0;i<Math.min(5,b);i++){ q.beginPath(); biteShape(q,MOON_BITES[i],R); q.fill(); } q.globalCompositeOperation='source-over'; }
  if(M3S_DISC.size>24) M3S_DISC.clear(); M3S_DISC.set(key,c); return c;
}
function m3sDrawSky(E){
  if(AREA) return; const k=E.k; if(k<0.01&&E.disc<0.01) return;
  const g=ctx, t=G.time, sx=W*(W<600?0.8:0.74), sy=Math.max(64,H*(W<600?0.25:0.15)), R=Math.max(24,Math.min(W,H)*0.06);
  g.save();
  const gr=g.createLinearGradient(0,0,0,H*0.55); gr.addColorStop(0,`rgba(18,8,36,${0.78*k})`); gr.addColorStop(1,'rgba(18,8,36,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H*0.55);
  const cov=E.disc, sa=E.sunA*Math.min(1,k*1.6+0.25);
  if(sa>0.01){ g.globalAlpha=sa; m3sGlowG(g,sx,sy,R*3.4,'255,220,150',0.55*(1-cov*0.75));
    g.fillStyle='#fff2c4'; m3sDot(g,sx,sy,R); g.fill();
    if(cov>0.55){ const c2=(cov-0.55)/0.45; g.globalCompositeOperation='lighter'; m3sGlowG(g,sx,sy,R*1.9,'235,225,255',0.6*c2); g.globalCompositeOperation='source-over';
      g.strokeStyle=`rgba(255,250,235,${0.85*c2})`; g.lineWidth=2.5; for(let i=0;i<12;i++){ const a=i/12*TAU+t*0.05, r1=R*1.04, r2=R*(1.25+0.18*Math.sin(t*2+i)); g.beginPath(); g.moveTo(sx+Math.cos(a)*r1,sy+Math.sin(a)*r1); g.lineTo(sx+Math.cos(a)*r2,sy+Math.sin(a)*r2); g.stroke(); } }
    g.globalAlpha=1; }
  const bites=typeof bitesOf==='function'?bitesOf():2;
  if(cov>0.01&&bites<6){ const mx=sx-R*2.8*(1-cov), my=sy+R*0.6*(1-cov), D=m3sDiscSprite(bites,R*1.02); g.globalAlpha=Math.min(1,cov*1.4); g.drawImage(D,mx-D.width/2,my-D.height/2); g.globalAlpha=1; }
  // the last eclipse: wings spread wider than the sky
  if(E.sky&&k>0.05){ if(E.gone&&E.goneT==null) E.goneT=E.t; const fade=E.goneT==null?1:Math.max(0,1-(E.t-E.goneT)/1.5);
    if(fade>0.01){ const Wd=Math.min(W*0.42,520); g.save(); g.globalAlpha=Math.min(0.9,k)*fade; g.translate(sx-R*0.3,sy+R*0.4); g.scale(1,0.8); m3sMothFig(g,Wd,0.82+0.12*Math.cos(t*1.4),M3S_NYX,1); g.restore(); } }
  if(E.flash>0){ g.globalAlpha=E.flash*0.45; g.fillStyle='#e8dcff'; g.fillRect(0,0,W,H*0.55); g.globalAlpha=1; }
  g.restore();
}
// ---------- 9. Nightfall Peak rises (N17): a vista over the Endless Sea, seen from the Moon Pier. Only the silhouette
// from Moonfall is drawn here (FINALE.md owns the peak, its map and the playable bridge).
function m3sPeak(cmd){
  if(cmd==='rise'){ M3S.peak={t:0,rise:0,riseT:1,bridge:0,bridgeT:0,a:0,aT:1,bolt:null,boltT:1.2}; m3sJ('n_rise','boom'); shake(16); flashA=0.4; flashCol='190,160,255'; }
  else if(cmd==='bridge'&&M3S.peak){ M3S.peak.bridgeT=1; try{ SFX.play('shrine'); }catch(e){} }
  else if(cmd==='out'&&M3S.peak) M3S.peak.aT=0;
}
// the peak in unit coordinates (base -0.5..0.5 at y 0, top at y -1): a crater on the left (Cinder Mountain), a clock
// tower, a snowy shoulder, all squashed together: it is made of the moon's memories (THREADS D9)
const M3S_PEAK=[[-0.5,0],[-0.44,-0.1],[-0.4,-0.09],[-0.35,-0.2],[-0.31,-0.27],[-0.26,-0.27],[-0.22,-0.2],[-0.19,-0.26],[-0.16,-0.36],[-0.13,-0.36],[-0.13,-0.5],[-0.105,-0.55],[-0.08,-0.5],[-0.08,-0.41],[-0.05,-0.48],
  [-0.02,-0.6],[0,-0.7],[0.02,-0.84],[0.035,-1],[0.05,-0.86],[0.08,-0.74],[0.12,-0.64],[0.16,-0.6],[0.2,-0.62],[0.25,-0.5],[0.3,-0.42],[0.35,-0.31],[0.41,-0.18],[0.46,-0.08],[0.5,0]];
let M3S_PEAKCV=null;
function m3sPeakCanvas(w){
  w=Math.max(80,Math.round(w)); if(M3S_PEAKCV&&M3S_PEAKCV.w===w) return M3S_PEAKCV;
  const h=Math.round(w*0.95), pad=8, c=mkCanvas(w+pad*2,h+pad*2), q=c.getContext('2d'); q.translate(pad+w/2,pad+h);
  const P=(pts)=>{ q.beginPath(); pts.forEach(([x,y],i)=>i?q.lineTo(x*w,y*h):q.moveTo(x*w,y*h)); q.closePath(); };
  P(M3S_PEAK); q.fillStyle='#120c1e'; q.fill(); q.lineJoin='round'; q.lineWidth=4; q.strokeStyle='#3b2233'; q.stroke();
  q.save(); P(M3S_PEAK); q.clip();
  q.fillStyle='#1e1530'; q.beginPath(); q.moveTo(0.035*w,-h); q.lineTo(-0.5*w,0); q.lineTo(-0.1*w,0); q.closePath(); q.fill();
  q.strokeStyle='rgba(150,110,220,.75)'; q.lineWidth=2.2;
  for(const [a,b] of [[[0.035,-1],[0,-0.55]],[[0.035,-1],[0.1,-0.5]],[[-0.105,-0.55],[-0.1,-0.3]],[[0.2,-0.62],[0.22,-0.3]],[[-0.28,-0.27],[-0.3,-0.1]],[[0,-0.7],[-0.04,-0.2]],[[0.3,-0.42],[0.27,-0.12]]]){ q.beginPath(); q.moveTo(a[0]*w,a[1]*h); q.lineTo(b[0]*w,b[1]*h); q.stroke(); }
  q.fillStyle='#dbe8ff'; P([[0.12,-0.64],[0.16,-0.6],[0.2,-0.62],[0.235,-0.54],[0.19,-0.56],[0.15,-0.52],[0.11,-0.58]]); q.fill();
  q.restore();
  q.fillStyle='rgba(255,120,60,.85)'; q.beginPath(); q.ellipse(-0.285*w,-0.27*h,0.024*w,0.008*h,0,0,TAU); q.fill();
  q.fillStyle='#e8e0c8'; q.beginPath(); q.arc(-0.105*w,-0.465*h,0.017*w,0,TAU); q.fill(); q.strokeStyle='#3b2233'; q.lineWidth=1.5; q.stroke();
  q.beginPath(); q.moveTo(-0.105*w,-0.465*h); q.lineTo(-0.105*w,-0.48*h); q.moveTo(-0.105*w,-0.465*h); q.lineTo(-0.112*w,-0.47*h); q.stroke();
  c.w=w; c.h=h; c.pad=pad; M3S_PEAKCV=c; return c;
}
let M3S_STARS=null;
function m3sStars(w,h){
  const key=w+'x'+h; if(M3S_STARS&&M3S_STARS.key===key) return M3S_STARS;
  const c=mkCanvas(Math.max(1,Math.round(w)),Math.max(1,Math.round(h))), q=c.getContext('2d'), rng=mulberry32(4404);
  for(let i=0;i<Math.round(w*h/2600);i++){ const x=rng()*w, y=rng()*h, r=rng()<0.1?1.6:0.9; q.fillStyle=`rgba(230,226,255,${0.35+rng()*0.55})`; q.fillRect(x,y,r,r); }
  c.key=key; M3S_STARS=c; return c;
}
function m3sDrawVista(P){
  const a=P.a; if(a<0.01) return;
  const g=ctx, t=G.time, phone=W<600, hz=H*(phone?0.34:0.42), vb=hz+H*(phone?0.1:0.13);
  g.save(); g.globalAlpha=a;
  const sky=g.createLinearGradient(0,0,0,hz); sky.addColorStop(0,'#07040f'); sky.addColorStop(1,'#1c1236'); g.fillStyle=sky; g.fillRect(0,0,W,hz);
  g.drawImage(m3sStars(W,hz),0,0);
  const sea=g.createLinearGradient(0,hz,0,vb); sea.addColorStop(0,'rgba(14,12,32,1)'); sea.addColorStop(1,'rgba(14,12,32,0)'); g.fillStyle=sea; g.fillRect(0,hz,W,vb-hz);
  const pw=Math.min(W*(phone?0.78:0.5),hz*1.6), px=W*(phone?0.6:0.64), C=m3sPeakCanvas(pw), ph=C.h*P.rise;
  // the broken ring of cold light where the moon should be
  if(typeof drawMoon==='function'){ g.save(); g.globalAlpha=a*Math.min(1,P.rise*1.3); drawMoon(g,px+pw*0.04,hz-C.h*P.rise-pw*0.16,Math.max(14,pw*0.1),{bites:6}); g.restore(); }
  g.save(); g.beginPath(); g.rect(0,0,W,hz); g.clip();
  g.drawImage(C,px-C.w/2-C.pad,hz-ph-C.pad);
  // violet lightning crawling up its sides
  const B=P.bolt; if(B&&B.t<0.2&&P.rise>0.3){ g.globalCompositeOperation='lighter'; g.strokeStyle='rgba(210,170,255,.95)'; g.lineWidth=2.5; g.beginPath(); B.pts.forEach(([x,y],i)=>{ const X=px+x*pw, Y=hz-ph+C.h+y*C.h; i?g.lineTo(X,Y):g.moveTo(X,Y); }); g.stroke(); g.globalCompositeOperation='source-over'; }
  g.restore();
  // the sea where it rose: foam rings at its foot
  g.strokeStyle=`rgba(200,190,255,${0.35*Math.min(1,P.rise*2)})`; g.lineWidth=2; for(let i=0;i<3;i++){ const r=pw*(0.5+i*0.08+0.03*Math.sin(t*2+i)); g.beginPath(); g.ellipse(px,hz+4,r,6+i*3,0,0,TAU); g.stroke(); }
  // the bridge of silver fire unrolling across the dark sea toward the mountain
  if(P.bridge>0.01){ const x0=W*(phone?0.12:0.3), y0=vb+H*0.06, x1=px-pw*0.18, y1=hz+2, u=P.bridge;
    g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round';
    g.beginPath(); for(let i=0;i<=24;i++){ const v=i/24*u, x=lerp(x0,x1,v), y=lerp(y0,y1,v)-Math.sin(v*Math.PI)*H*0.04; i?g.lineTo(x,y):g.moveTo(x,y); }
    g.strokeStyle='rgba(160,190,255,.5)'; g.lineWidth=12; g.stroke(); g.strokeStyle='rgba(240,246,255,.95)'; g.lineWidth=4; g.stroke();
    const ex=lerp(x0,x1,u), ey=lerp(y0,y1,u)-Math.sin(u*Math.PI)*H*0.04; m3sGlowG(g,ex,ey,26,'220,232,255',0.8); g.restore(); }
  g.restore();
}
// the voyage east: the night sea, the bitten moon, the boat (or Glaciar) and the moths, under the dialogue box
function m3sDrawVoyage(V){
  const a=V.a; if(a<0.01) return;
  const g=ctx, t=V.t, hz=H*0.52;
  g.save(); g.globalAlpha=a;
  const sky=g.createLinearGradient(0,0,0,hz); sky.addColorStop(0,'#0b0a24'); sky.addColorStop(1,'#2a2a5a'); g.fillStyle=sky; g.fillRect(0,0,W,hz);
  g.drawImage(m3sStars(W,hz),0,0);
  const sea=g.createLinearGradient(0,hz,0,H); sea.addColorStop(0,'#1c2e5a'); sea.addColorStop(1,'#0a1430'); g.fillStyle=sea; g.fillRect(0,hz,W,H-hz);
  const mx=W*0.74, my=H*0.18, mr=Math.max(18,Math.min(W,H)*0.06);
  if(V.moon>0&&typeof drawMoon==='function'){ drawMoon(g,mx,my,mr,{bites:2}); g.fillStyle='rgba(220,230,255,.18)'; for(let i=0;i<8;i++){ const y=hz+12+i*18, w2=mr*(1.4-i*0.12)+6*Math.sin(t*2+i); g.fillRect(mx-w2,y,w2*2,3); } }
  g.strokeStyle='rgba(150,180,230,.25)'; g.lineWidth=2; for(let i=0;i<9;i++){ const y=hz+20+i*(H-hz)/9, o=(t*30+i*70)%80; g.beginPath(); for(let x=-80+o;x<W+80;x+=80){ g.moveTo(x,y); g.quadraticCurveTo(x+20,y-5,x+40,y); } g.stroke(); }
  const bx=W*0.42+Math.sin(t*0.4)*W*0.04, by=hz+(H-hz)*0.38+Math.sin(t*1.6)*4;
  g.lineJoin='round'; g.lineWidth=3; g.strokeStyle=SBC.outline;
  if(V.kind==='glaciar'){
    const s=Math.min(W,H)/700, wf=Math.sin(t*1.4);
    g.save(); g.translate(bx,by-120*s); g.scale(s,s);
    g.fillStyle='#bfe6f8'; g.beginPath(); g.moveTo(-40,0); g.quadraticCurveTo(-160,-120-50*wf,-260,-60); g.quadraticCurveTo(-150,-30,-60,20); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0,10,120,40,0,0,TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(90,-6); g.quadraticCurveTo(150,-60,190,-60); g.lineTo(220,-48); g.quadraticCurveTo(170,-30,120,20); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#e6f6ff'; g.beginPath(); g.moveTo(-100,20); g.quadraticCurveTo(-190,40,-240,10); g.quadraticCurveTo(-180,10,-110,0); g.fill(); g.stroke();
    g.fillStyle='#ff8a3a'; m3sDot(g,10,-30,11); g.fill(); g.stroke();
    g.fillStyle='#bfe6f8'; g.beginPath(); g.moveTo(40,0); g.quadraticCurveTo(120,-140-50*wf,30,-180); g.quadraticCurveTo(40,-80,0,-10); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }else{
    const s=Math.min(W,H)/700;
    g.save(); g.translate(bx,by); g.scale(s,s);
    g.fillStyle='#8a4a2a'; g.beginPath(); g.moveTo(-150,-10); g.lineTo(150,-10); g.lineTo(120,30); g.lineTo(-120,30); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#e8c03a'; g.fillRect(-150,-18,300,10); g.strokeRect(-150,-18,300,10);
    g.fillStyle='#efe6d6'; g.fillRect(-60,-70,100,52); g.strokeRect(-60,-70,100,52);
    g.fillStyle='#3a6aaa'; for(const x of [-46,-14,18]){ g.fillRect(x,-58,18,16); }
    g.fillStyle='#3a3a4a'; g.fillRect(50,-110,24,92); g.strokeRect(50,-110,24,92);
    g.fillStyle='#c84a3a'; g.save(); g.translate(-110,6); g.rotate(t*1.6); for(let i=0;i<6;i++){ g.rotate(TAU/6); g.fillRect(-4,-34,8,34); } g.restore(); g.beginPath(); g.arc(-110,6,10,0,TAU); g.fill(); g.stroke();
    // Dell in his yellow rain hat, Ash with his horns, looking out to sea
    g.fillStyle='#e8b894'; m3sDot(g,-22,-80,8); g.fill(); g.stroke(); g.fillStyle='#e8c03a'; g.beginPath(); g.ellipse(-22,-88,15,4,0,0,TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(-22,-88,8,Math.PI,0); g.fill(); g.stroke();
    g.fillStyle='#ff8a3a'; m3sDot(g,12,-80,9); g.fill(); g.stroke(); g.fillStyle='#fff0d4'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(12+s*4,-87); g.lineTo(12+s*8,-99); g.lineTo(12+s*9,-86); g.closePath(); g.fill(); g.stroke(); }
    for(let i=0;i<4;i++){ const u=((t*0.35+i*0.25)%1); g.globalAlpha=a*(1-u)*0.7; g.fillStyle='#e8ecf4'; m3sDot(g,62+u*60,-120-u*120,12+u*20); g.fill(); } g.globalAlpha=a;
    g.restore();
  }
  if(V.moths&&typeof thrMoth==='function'){ const ms=Math.max(0.8,Math.min(W,H)/560); for(let i=0;i<14;i++){ const u=((t*0.06+i*0.071)%1), x=lerp(-40,W+40,u), y=H*(0.08+0.36*((i*0.37)%1))+Math.sin(t*3+i)*10; g.globalAlpha=a*0.95; thrMoth(g,x,y,ms*(0.9+0.5*((i*0.53)%1)),t*12+i,'#a89cc4','rgba(120,80,200,.95)'); } g.globalAlpha=a; }
  g.restore();
}
// ---------- 10. per frame: the animations (also under dialogue), the story ticks (outdoors and inside areas)
function m3sAnim(dt){
  if(!G||G.mode!=='story') return;
  if(scene==='m3forge') m3sForgeTick(dt);
  if(M3S.dbg.freeze) return;   // (screenshots: hold the show where it is)
  m3sEclTick(dt);
  if(M3S.grey>0) M3S.grey=Math.max(0,M3S.grey-dt);
  const P=M3S.peak;
  if(P){ P.t+=dt; P.rise=Math.min(P.riseT,P.rise+dt/4.2); P.bridge=Math.min(P.bridgeT,P.bridge+dt/3.2);
    P.a=P.a<P.aT?Math.min(P.aT,P.a+dt/1.4):Math.max(P.aT,P.a-dt/1.6); if(P.aT===0&&P.a<=0.01){ M3S.peak=null; }
    else { P.boltT-=dt; if(P.boltT<=0){ P.boltT=rand(0.7,2.0); const pts=[]; let x=rand(-0.1,0.1), y=-0.92; for(let i=0;i<7;i++){ pts.push([x,y]); x+=rand(-0.06,0.06)+(x<0?-0.02:0.02); y+=rand(0.08,0.14); } P.bolt={t:0,pts}; }
      if(P.bolt) P.bolt.t+=dt; } }
  const V=M3S.voy; if(V) V.t+=dt;
  if(M3S.fadeTo!=null){ G.fade=Math.max(M3S.fadeTo,G.fade-dt*0.7); if(V) V.a=Math.min(V.a,G.fade); if(G.fade<=M3S.fadeTo+0.001) M3S.fadeTo=null; }
  else if(V&&scene==='dialogue') G.fade=Math.max(G.fade,0.98);
  const H=M3S.hushFx; if(H) H.t+=dt;
}
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ m3sAnim(dt); }catch(e){ console.error(e); } }; }
{ const base=simUpdate; simUpdate=function(dt){ base(dt); try{ m3sAnim(dt); }catch(e){ console.error(e); } }; }
const M3S_BOSS={m_octavia:{intro:'m_octavia_intro',won:'m_lumen_won'},m_gravelgut:{intro:'m_gravelgut_intro',won:'m_burrows_won'},
  m_fanfare:{intro:'m_mirror_boss_in',won:'m_mirror_won_v',seen:'m_mirror_won'},m_umberwing:{intro:'m_umber_intro',won:'m_umber_won'},m_hushboss:{intro:'m_hush_intro'}};
const m3sFindBoss=type=>G.boss&&G.boss.type===type&&!G.boss.dead?G.boss:(G.enemies.find(e=>e.type===type&&!e.dead)||null);
// any Act IV boss: its intro the first time it shows up, its "won" lines after it falls (once, by any route)
function m3sBossTick(dt){
  M3S.bt-=dt; if(M3S.bt>0) return; M3S.bt=0.25;
  let b=G.boss&&M3S_BOSS[G.boss.type]?G.boss:null;
  if(!b&&AREA) b=G.enemies.find(e=>!e.dead&&M3S_BOSS[e.type])||null;
  if(b&&!b.dead){ M3S.boss=b; if(b.type==='m_hushboss') M3S.hushE=b; const B=M3S_BOSS[b.type];
    // (a foes module that plays the intro itself, at the fight's start, plays this same STORY key: it is marked seen)
    if(B.intro&&!m3sSeen(B.intro)&&scene==='play'&&!DLG&&!G.fightIntro) m3sPlay(B.intro); return; }
  // (a boss taken away with hp left is not a win: Ash fell and woke at a shrine, or left the room; resetBoss and
  // exitArea only mark it dead. A real win always ends at hp 0.)
  const o=M3S.boss; if(o&&o.dead&&o.hp>0){ M3S.boss=null; if(o===M3S.hushE) M3S.hushE=null; return; }
  if(o&&(o.dead||o.hp<=0)){ M3S.boss=null; const B=M3S_BOSS[o.type], key=B&&(B.seen||B.won);
    if(B&&B.won&&!m3sSeen(key)) later(3.4,()=>m3sWhen('won_'+o.type,null,()=>{ if(!m3sSeen(key)) m3sPlay(B.won); })); }
}
function m3sTick(dt){
  if(!G||G.mode!=='story'||G.done) return;
  m3sQueue(); m3sBossTick(dt);
  if(actOf(G.stage)!==4) return;
  const F=G.flags, p=player;
  // Coralcombe: the arrival lines on entering the village (or, with no village built yet, at the ring with Dive)
  if(!m3sSeen('m_coral_in')&&reached('m_coral')&&scene==='play'){ if(m3sIn('m_coralcombe')) m3sPlay('m_coral_in'); else if(!AREADEFS.m_coralcombe&&hasAbil('dive')&&m3sNear(M3SP.coral,240)) m3sPlay('m_coral_in'); }
  // the Glaciar route: Dell's boat comes in a day later (or once Drowned Lumen is done)
  if(F.m_landed&&F.m_ship==='glaciar'&&!F.m_dell_docked&&!F.m_dell_away&&scene==='play'&&m3sNear(M3SP.raft,900)&&(((typeof dayNow==='function')&&dayNow()>(F.m_land_day|0))||F.trial_m_lumen_done)) m3sPlay('m_dell_late');
  // Mom's letter read: Dell steams off west to fetch her (until the Moon Pier)
  if(F.m_pb_3&&!F.m_dell_left&&!reached('m_reforge')){ F.m_dell_left=1; F.m_dell_away=1; setupNPCs(); }
  // the Moonpath: the third brazier opens the door at the top
  if(m3sLit()>=3&&!F.m_mp_open&&reached('m_moonpath')){ F.m_mp_open=1; setBanner(S('The Moonpath is lit','The Moonpath is lit'),S('The last brazier flares silver. At the top of the Heights, a great door swings open.','The last brazier flares. A great door opens!'),4); questUpdated(); }
  // Hush beaten with nobody calling the story's hook (x3_foes should call m3sBeat('hush_down', e, finish) when she
  // kneels): her fight ends its own way first (the room opens), then the outro and the choice play. Hush taken away
  // with hp left (Ash fell, or left the room) is not a win.
  if(!F.m_hush_done&&!M3S.hushRun&&scene==='play'&&reached('m_observatory')){ const b=m3sFindBoss('m_hushboss');
    if(b) M3S.hushE=b;
    else { const o=M3S.hushE; if(o&&o.dead){ M3S.hushE=null; if(o.hp<=0) m3sHushDown(null); }
      else if(G.bossDone&&G.bossDone.m_hushboss) m3sHushDown(null); } }
  // a dungeon that is only x3_world's placeholder so far: its stand-in story
  if(AREA) m3sStandInside(dt); else M3S.phT=0;
  // Pip's Lantern in the Mirror Temple's room g (the dungeon calls m3sBeat('pip_lamp'); this is the fallback)
  if(F.pip&&!F.m_pip_lamp&&hasAbil('moonfire')&&m3sRoom('m_mirror','g')&&scene==='play'){ M3S.pipT=(M3S.pipT||0)+dt; if(M3S.pipT>6){ M3S.pipT=0; m3sPlay('m_pip_lamp'); } }
  // the dream m_eclipse: the next time Ash is near Pip, Pip glows a little brighter, just for him
  if(F.dr_seen_m_eclipse&&!F.m_pipglow&&G.pip&&scene==='play'&&!DLG&&dist(G.pip.x,G.pip.y,p.x,p.y)<160){ F.m_pipglow=1; if(typeof bubble==='function') bubble(G.pip,simplify(S('Mip. (Pip glows a little brighter, just for you.)','Mip. (Pip glows for you.)')),{who:'Pip',dur:3.4}); }
}
{ const base=updateStory; updateStory=function(dt){ base(dt); try{ m3sTick(dt); }catch(e){ console.error(e); } }; }
{ const base=updateArea; updateArea=function(dt){ base(dt); try{ if(AREA&&G&&G.mode==='story'&&!G.done){ m3sTick(dt); const d=STAGEDEF[G.stage]; if(d&&d.update&&actOf(G.stage)===4) d.update(dt); } }catch(e){ console.error(e); } }; }
// the camera leans toward a scene (M3S.cam = {x,y,k}) while it plays
{ const base=updateCam; updateCam=function(dt,snap){
  const C=M3S.cam; if(!C||(AREA&&!C.area)||!player||!G||G.mode!=='story') return base(dt,snap);
  if(scene!=='dialogue'){ M3S.cam=null; return base(dt,snap); }
  const px=player.x, py=player.y; player.x=px+(C.x-px)*C.k; player.y=py+(C.y-py)*C.k; try{ base(dt,snap); }finally{ player.x=px; player.y=py; } }; }
// drawing: the world layer before the floating texts, the sky and the peak after them (screen space), the voyage
// picture under the HUD, the forge on top of it
{ const base=drawTexts; drawTexts=function(){ try{ if(G&&G.mode==='story'){ m3sDrawScreen('sky'); m3sDrawWorld(); } }catch(e){ console.error(e); } base(); try{ if(G&&G.mode==='story') m3sDrawScreen('vista'); }catch(e){ console.error(e); } }; }
// (the sky is far away: it goes behind her; the peak's vista goes over everything in the world)
function m3sDrawScreen(layer){ const E=M3S.ecl, P=M3S.peak; if(layer==='sky'?!E:!P) return; ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0); if(layer==='sky') m3sDrawSky(E); else m3sDrawVista(P); ctx.restore(); }
{ const base=drawHUD; drawHUD=function(){ try{ if(M3S.voy&&G&&G.mode==='story') m3sDrawVoyage(M3S.voy); }catch(e){ console.error(e); } base(); try{ if(scene==='m3forge'&&M3S.forge) m3sDrawForge(M3S.forge); }catch(e){ console.error(e); } }; }

// ---------- 11. people: stand-ins, Mom and Quill away from home, the party on the Moon Pier
// Mom (and Quill) leave home once Mom's letter is read and Dell has sailed to fetch them; they are in Moonfall from the
// reforge on, and walk Ash to the bridge in the finale (until FINALE's departure, G.flags.n_depart)
const m3sAway=()=>{ const F=G.flags, a=actOf(G.stage); return (a===4&&!!(F.m_dell_left||F.m_maren||F.m_reforged))||(a===5&&!F.n_depart&&!!F.m_maren); };
{ const base=npcPresent; npcPresent=function(id){ try{ if(G&&G.mode==='story'&&(id==='maren'||id==='quill')&&m3sAway()) return false; }catch(e){} return base(id); }; }
{ const base=setupNPCs; setupNPCs=function(){ base(); try{ if(G&&G.mode==='story') m3sPeople(); }catch(e){ console.error(e); } }; }
// on the Moon Pier (x3_world: the deck is x 13330..13780, y 65400..65500; lamps at x 13470 and 13660 on its north edge,
// Dell's boat moored off its south side at x 13560): Dell (and Tikka) by the boat from the Final Chapter on; Mom,
// Quill, Vesper (an ally) and Juniper (once the peak rises) after the reforge. [id, x, y, cond, after the reforge]
const M3S_PARTY=[['dell',13565,65488],['ev_tikka',13610,65486,()=>G.flags.tk_come==='yes'],
  ['maren',13445,65445,null,true],['quill',13520,65440,null,true],['juniper',13350,65425,()=>!!G.flags.m_done,true],['c_vesper',13625,65438,()=>!!G.flags.m_vesper_ally,true]];
function m3sPeople(){
  const a=actOf(G.stage); if(a<4) return;
  if(a===4) for(const id in M3S.fb){ const P=M3S_PEOPLE[id]; if(!P||!SPECIAL[id]) continue; if(P.area&&AREADEFS[P.area]) continue; if(G.npcs.some(n=>n.id===id)) continue; const n=mkNPC(SPECIAL[id],P.at[0],P.at[1]); n.walker=false; G.npcs.push(n); }
  const F=G.flags, on=(a===4&&reached('m_reforge'))||(a===5&&!F.n_depart&&!!F.m_reforged);
  // (x3_people places the party on the pier itself, m3pVisit: this is its stand-in)
  if(!on||typeof m3pVisit==='function') return;
  for(const [id,x,y,cond,forge] of M3S_PARTY){
    if(forge&&!F.m_reforged) continue; if(cond&&!cond()) continue; const c=CASTBY[id]||SPECIAL[id]; if(!c) continue;
    if(G.npcs.some(n=>n.id===id&&dist(n.x,n.y,M3SP.pier.x,M3SP.pier.y)<900)) continue;
    const far=G.npcs.find(n=>n.id===id); if(far){ far.x=x; far.y=y; far.home=[x,y]; far.walker=false; continue; }
    const n=mkNPC(c,x,y); n.walker=false; n.m3pier=true; n.face=angTo(x,y,M3SP.pierEnd.x,M3SP.pierEnd.y); G.npcs.push(n);
  }
}
// the merfolk stand-ins inside Coralcombe, when the village is built but its people are not
{ const base=areaNPCs; areaNPCs=function(){ base(); try{ const A=AREA; if(A&&A.id==='m_coralcombe') for(const id of ['m_coralia','m_kipper']) if(M3S.fb[id]&&SPECIAL[id]&&!A.npcs.some(n=>n.id===id)){
  const R=A.rooms&&Object.values(A.rooms).find(r=>r.kind==='start'), x=R?R.cx+(id==='m_kipper'?96:0):player.x+(id==='m_kipper'?96:0), y=R?R.cy-70:player.y-90; const n=mkNPC(SPECIAL[id],x,y); n.walker=false; A.npcs.push(n); } }catch(e){ console.error(e); } }; }
// small talks outside the stage hooks: Wren in Driftwood, the star-iron and Quill on the pier
onTalk(n=>{
  if(!G||G.mode!=='story'||G.done||curMap()!==3) return false;
  const a=actOf(G.stage); if(a!==4&&a!==5) return false;
  const F=G.flags;
  // (the star-iron is Mom's own business; otherwise the story data's talk for this act wins, as in x3_people)
  if(n.id==='maren'&&F.m_maren&&G.items.m_stariron&&!F.m_stariron_done){ m3sPlay('m_stariron'); return true; }
  if(typeof m3pDataTalk==='function'&&m3pDataTalk(n.id)) return false;
  if(n.id==='wren'&&!M3S_PRE.wren&&a===4&&!m3sSeen('m_wren')&&!G.items.m_book_raw){ m3sPlay('m_wren'); return true; }
  if(n.id==='maren'&&F.m_maren&&G.items.m_stariron&&!F.m_stariron_done){ m3sPlay('m_stariron'); return true; }
  if(n.id==='quill'&&F.m_maren&&a===4){ m3sPlay([xl('quill',`I'm measuring the peak. I've started over four times, and it's taller every time.`,`The mountain keeps getting taller than my numbers!`)]); return true; }
  return false;
});
// rests: Oriel's whisper at the Moonpath Shrine ('warden' ending only)
{ const base=restAtShrine; restAtShrine=function(s){ base(s); try{ if(m3sOn()){ m3sMomLetterFirst(); if(G.choices.ending==='warden'&&!G.flags.m_oriel&&s&&s.id==='s_m_moonpath') later(3,()=>m3sWhen('oriel',null,()=>{ if(!G.flags.m_oriel) m3sPlay('m_oriel'); })); } }catch(e){ console.error(e); } }; }
// Mom's letter (6.8c) comes at the first rest or fast travel after eclipse 2, before any other letter that is due
function m3sMomLetterFirst(){ const F=G.flags; if(!F.m_eclipse2||F.m_pb_3||reached('m_reforge')||typeof pebbleNow!=='function') return; if(pebbleNow('m_pb_3')&&typeof PEBRT!=='undefined') PEBRT.wait=Math.max(PEBRT.wait,2.6); }
{ const base=innRest; innRest=function(){ base(); try{ if(m3sOn()) m3sMomLetterFirst(); }catch(e){ console.error(e); } }; }
{ const base=travelTo; travelTo=function(s){ base(s); try{ if(m3sOn()) m3sMomLetterFirst(); }catch(e){ console.error(e); } }; }

// ---------- 12. saves: transient state resets; older Act IV saves get the flags their stage implies
function m3sReset(){
  Object.assign(M3S,{q:[],rep:{},cam:null,ecl:null,peak:null,voy:null,forge:null,hushFx:null,hushRun:false,hushFin:null,hushE:null,introQ:false,boss:null,grey:0,fadeTo:null,landing:false,eclRun:false,forgeRun:false,pipQ:false,pipT:0,endQ:false,endT:0,endAt:0,finT:0,fxOn:false,fxCalm:0,forgeCalm:0});
  if(G&&G.flags) G.flags.m_eclipse_on=0; if(scene==='m3forge') scene='play';
}
{ const base=newRun; newRun=function(mode){ base(mode); try{ m3sReset(); }catch(e){} }; }
{ const base=loadGame; loadGame=function(s){ base(s); try{ m3sReset(); const b=typeof bitesOf==='function'?bitesOf():0; m3sMigrate(); if(typeof bitesOf==='function'&&bitesOf()!==b) G.flags.moon_hud=bitesOf(); }catch(e){ console.error(e); } }; }
{ const base=startAct; startAct=function(n,o){ const r=base(n,o); try{ if(r&&n===4){ m3sMigrate(); setupNPCs(); } }catch(e){ console.error(e); } return r; }; }
function m3sMigrate(){
  const F=G.flags, C=G.choices; if(actOf(G.stage)!==4) return;
  const at=s=>reached(s);
  if(at('m_drift')){ m3sMark('m_intro'); m3sMark('m_voyage_ship'); m3sMark('m_voyage_glaciar'); F.m_landed=1; if(!F.m_ship) F.m_ship='ship'; if(F.m_ship==='ship') F.m_dell_docked=1; }
  if(at('m_lumen')){ m3sMark('m_dabble'); m3sMark('m_winnie'); F.m_dabble=F.m_winnie=1; }
  if(at('m_coral')){ m3sMark('m_lumen_channel'); F.m_lumen_done=1; }
  if(at('m_reef')){ m3sMark('m_coral_in'); m3sMark('m_coralia'); m3sMark('m_lumen_after'); F.m_coral_met=1; }
  if(at('m_sable')){ m3sMark('m_eclipse1'); F.m_puff_done=1; F.m_eclipse1=1; F.m_bombs_given=1; if(!C.m_deal) C.m_deal='refuse'; m3sMoon(60); }
  if(at('m_burrows')){ m3sMark('m_rafi'); F.m_rafi=1; F.m_sable_seen=1; }
  if(at('m_glasswall')){ m3sMark('m_worm_ring'); F.m_burrows_done=1; }
  if(at('m_mirror')){ m3sMark('m_eclipse2'); m3sMark('m_burrows_after'); F.m_eclipse2=1; F.m_gap_dug=1; F.m_flats_seen=1; m3sMoon(40); }
  if(at('m_moonpath')){ F.m_mirror_done=1; }
  if(at('m_observatory')){ m3sMark('m_moonpath'); F.m_moonpath_lit=Math.max(3,F.m_moonpath_lit|0); F.m_mp_open=1;
    // (x3_world keeps each Moonpath brazier lit for good in G.found; a save moved past the Moonpath gets them lit too)
    try{ if(typeof M3W_MP!=='undefined') for(const P of M3W_MP) if(P&&P.braz&&P.braz.id) G.found[P.braz.id]=true; }catch(e){} }
  if(at('m_reforge')){ for(const k of ['m_obs_in','m_hush_intro','m_hush_out']) m3sMark(k); F.m_obs_in=1; F.m_hush_done=1; F.m_hush_xp=1; if(!C.m_hush) C.m_hush='foe'; if(!(G.items.m_shard3>0)&&!G.items.m_heart) G.items.m_shard3=1; m3sMoon(20);
    G.bossDone.m_hushboss=true; F.m_pb_3=1; F.m_dell_left=1; F.m_dell_away=0; F.m_dell_pier=1; }
  if(F.m_reforged){ for(const k of ['m_reforge','m_reforge2']) m3sMark(k); F.m_maren=1; F.m_dell_pier=1; F.m_dell_away=0; if(!G.items.m_heart){ for(const k of ['c_shard1','f_shard2','m_shard3']) delete G.items[k]; G.items.m_heart=1; } F.m_heart=1; }
  if(F.m_done){ m3sMark('m_peak'); F.m_eclipse3=1; m3sMoon(0); }
}
// a test save at a later Act IV stage (__eb.actStart(4,'<stage>')) also gets the powers the dungeons before it give
function m3sKit(){
  if(actOf(G.stage)!==4) return; const at=s=>reached(s), A=G.abil=G.abil||{};
  if(at('m_coral')) A.dive=true;
  if(at('m_glasswall')){ A.burrow=true; if(!G.flags.m_crumb_got){ G.flags.m_crumb_got=1; G.items.m_mooncrumb=1; } }
  if(at('m_moonpath')){ A.moonfire=true; if(G.flags.pip) G.flags.m_pip_lamp=1; }
}
{ const base=window.__ebX&&window.__ebX.actStart; if(typeof base==='function') window.__ebX.actStart=function(n,w){ const r=base(n,w); try{ if((n|0)===4&&G.mode==='story'){ m3sMigrate(); m3sKit(); if(typeof bitesOf==='function') G.flags.moon_hud=bitesOf(); setupNPCs(); saveGame(true); } }catch(e){ console.error(e); } return r; }; }
// ---------- 12b. v10: Act IV is story data now (game/story/act4). Its scene lines call this file's old pictures with
// storyEmit('m4fx:<name>[:<arg>]') (the names A4b's data emits): the eclipses (m3sEcl's commands), Hush's leash and her
// going (m3sHushPose), Mom and Quill coming up the stairs, the three taps of the reforge, the Heart made whole, the party
// on the pier looking out to sea, and the black peak's vista (m3sPeak). G.flags.s10_fx says this listener is in, so the
// data's own stand-in pictures (places shown only with !flag s10_fx) step aside.
function m3sFx(cmd){
  const [k,a,b]=String(cmd).split(':'), cam=M3S.cam;
  switch(k){
    // (the data scene aims its own camera: an eclipse command only draws)
    case 'ecl': m3sEcl(a,b!=null&&b!==''?+b:undefined); M3S.cam=cam; M3S.fxOn=true; break;
    case 'hush': if(!M3S.hushFx) m3sHushFxAt(null); m3sHushPose(a); break;
    case 'mom_in': m3sMomIn(); break;
    case 'forge': m3sFxForge(); break;
    case 'heart_whole': m3sHeartFx(); break;
    case 'party_look': m3sPartyLook(); break;
    case 'peak': m3sPeak(a); M3S.fxOn=true; break;
    default: console.error('m4fx: unknown picture '+cmd);
  }
}
// (the engine's storyListen when it has one (I5); else this file wraps storyEmit and window.storyEmit)
if(typeof storyListen==='function') storyListen('m4fx:',rest=>{ try{ if(G&&G.mode==='story') m3sFx(rest); }catch(e){ console.error(e); } });
else { const base=storyEmit; storyEmit=function(name){ const r=base(name); try{ const s=String(name||'');
    if(s.startsWith('m4fx:')&&G&&G.mode==='story') m3sFx(s.slice(5)); }catch(e){ console.error(e); } return r; };
  window.storyEmit=storyEmit; }
// the three taps (m_reforge's last line): they start as soon as Mom's scene is over, and the data's next step (the
// Heart, m_reforge2) waits for them (its step `if: '!flag m4_forging'`). A reload in the middle starts them again; the
// test autoplay goes straight on.
function m3sFxForge(){
  if(G.flags.m_reforged) return;
  if(typeof S10!=='undefined'&&S10&&S10.auto) return;
  G.flags.m4_forging=1;
}
function m3sForgeWatch(dt){
  const F=G.flags; if(!F.m4_forging||M3S.forge) return;
  if(F.m_reforged||G.stage!=='m_reforge'||(typeof S10!=='undefined'&&S10&&S10.auto)){ F.m4_forging=0; return; }
  if(scene!=='play'||DLG||G.mini){ M3S.forgeCalm=0; return; }
  M3S.forgeCalm=(M3S.forgeCalm||0)+dt; if(M3S.forgeCalm<0.2) return;
  M3S.forgeCalm=0; m3sForgeTaps(()=>{ G.flags.m4_forging=0; try{ questUpdated(); }catch(e){} });
}
// the pictures of the Heart made whole (the data gives the Heart and takes the Shards itself)
function m3sHeartFx(){
  flashA=0.7; flashCol='255,190,110'; shake(8); m3sJ('complete','shrine');
  emit(player.x,player.y-30,60,{col:'255,190,100',ang:-Math.PI/2,spread:1.6,smin:60,smax:280,lmin:.6,lmax:1.3,zmin:2,zmax:4,rise:30});
}
// a data scene that started an eclipse or the vista is over: the eclipse ends and the vista fades, leaving the world's
// own peak on the horizon (x3_world) and the glow of the bridge at the end of the pier (m3sDrawWorld)
function m3sFxAfter(dt){
  if(!M3S.fxOn) return;
  if(scene!=='play'||DLG){ M3S.fxCalm=0; return; }
  M3S.fxCalm=(M3S.fxCalm||0)+dt; if(M3S.fxCalm<0.3) return;
  M3S.fxOn=false; M3S.fxCalm=0;
  if(M3S.ecl&&!M3S.ecl.ending) m3sEcl('end');
  if(M3S.peak) M3S.peak.aT=0;
}
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ if(G&&G.mode==='story'){ if(G.flags&&!G.flags.s10_fx) G.flags.s10_fx=1; m3sForgeWatch(dt); m3sFxAfter(dt); } }catch(e){ console.error(e); } }; }
{ const base=simUpdate; simUpdate=function(dt){ base(dt); try{ if(G&&G.mode==='story'){ if(G.flags&&!G.flags.s10_fx) G.flags.s10_fx=1; m3sForgeWatch(dt); m3sFxAfter(dt); } }catch(e){ console.error(e); } }; }
// ---------- 13. cross-act threads Act IV owns (each added only if nobody added it first): Pebble's letters, the two
// dreams, Tamsin's verse, the epilogue lines, the town chatter
if(typeof pebbleLetter==='function'){
  const have=id=>typeof pebbleAll==='function'&&pebbleAll().some(d=>d.id===id);
  // (Mom's letter: x3_people's when it has one; m3sTick sends Dell off once it is read, by either)
  if(!have('m_pb_3')) pebbleLetter('m_pb_3',{from:'maren',when:()=>!!G.flags.m_eclipse2&&!G.flags.m_reforged,lines:M3S_PB3,then:()=>{ G.flags.m_dell_away=1; G.flags.m_dell_left=1; setupNPCs(); }});
  if(!have('m_pb_1')) pebbleLetter('m_pb_1',{from:'quill',when:()=>m3sMoonNow()<=60&&actOf(G.stage)>=4,lines:[
    xl('quill',`Ash, I watched the eclipse from my roof. The moon is now sixty percent of a moon. I have written to the Eclipse Observatory. They are very old and very slow at replying. Go and knock.`,`The moon is shrinking fast. Go to the Eclipse Observatory and knock!`)]});
  if(!have('m_pb_2')) pebbleLetter('m_pb_2',{from:'fennick',when:()=>m3sMoonNow()<=40&&actOf(G.stage)>=4,lines:()=>G.choices.fennick==='jail'
    ?[xl('fennick',`The Watch House is the brightest place in Brindlecross. I polish. It's what I'm for now. Fennick.`,`The Watch House is so bright. I polish the lamps. Fennick.`)]
    :[xl('fennick',`Every lantern in Emberhollow is lit, every night, all night. Nobody here is scared of the dark. Not while I've got oil. Your friend, Fennick.`,`I keep every lantern lit. Nobody is scared. Fennick.`)]});
  if(!have('m_pb_4')) pebbleLetter('m_pb_4',{from:'yara',when:()=>m3sMoonNow()<=40&&!!G.flags.m_pb_2&&actOf(G.stage)>=4,lines:[
    xl('yara',`I counted the moon tonight. Less than half. Pebble sat on my windowsill and stared at it all night. She wouldn't eat a thing, except one coin.`,`Less than half the moon is left. Pebble won't eat. Only a coin.`)]});
  if(!have('m_pb_oil')) pebbleLetter('m_pb_oil',{from:'fennick',when:()=>m3sQDone('m_lamps'),gift:{items:{m_lampoil:1}},lines:()=>G.choices.fennick==='jail'
    ?[xl('osric',`(a letter) Captain Osric here. We found this in Fennick Wick's old shop. He says it is lamp oil that never runs out. He says please use it. He also says sorry. Again. O.`,`Captain Osric here. This lamp oil never runs out. Fennick says sorry. O.`)]
    :[xl('fennick',`(a letter) Fennick Wick here, lamp man of Emberhollow. Yara says you need lamps that never go out. I spent my whole life making this oil. Use it for something good. That is all I ever wanted. F.`,`Fennick here. This lamp oil never runs out. Use it for something good. F.`)]});
}
if(typeof defineDream==='function'&&typeof DREAMS!=='undefined'){
  // v11: part two of the first Lantern Day memory (part one is a1l_story2.js, the 'lantern' dream: a little grey moth
  // lands on the extra lantern). Years later, grown-up Ember doesn't climb the hill, and the moth waits.
  // (v12) the waiting moth is the hint; her two pale moons and her name are Act V's (REVEAL_PLAN secret 13): she is a
  // little grey moth, Ember gives her a name that the dream's wind takes, and in the morning she just flies away
  if(!DREAMS.m_moth) defineDream('m_moth',{stages:['m_coral','m_reef'],title:S('The Moth on the Lantern','The Moth on the Lantern'),scene:'moth',lines:()=>[
    xl('narr',`Lantern Day again, on the shortest night. You're Ember, still small, on the hill above the valley. A little grey moth is already waiting on the lantern post. She came last year, too.`,`Lantern Day again. You are young Ember. A little grey moth waits on the lantern post.`),
    xl('ember_kid',`You came back! If you're going to keep coming back, you need a name.`,`You came back! You need a name.`),
    xc('narr',`She shivers on the cold post.`,`She shivers on the cold post.`,[
      xo(`Let her sit on your lantern`,`Let her sit on your lantern`,{tone:'kind',fn:()=>{ G.flags.dr_m_moth='warm'; },then:[xl('ember_kid',`Sit on mine. As long as you like. Now, a name. A night sort of name, because you come in the night.`,`Sit on mine. Now, a name for you.`)]}),
      xo(`Make her a tiny lantern of her own`,`Make her a tiny lantern`,{fn:()=>{ G.flags.dr_m_moth='gift'; },then:[xl('narr',`You fold a lantern no bigger than a thimble and light it with the smallest breath you've ever breathed. The moth climbs inside.`,`You make a tiny lantern. The moth climbs in.`),xl('ember_kid',`There. Your own. And now your own name.`,`Your own lantern! And your own name.`)]}),
      xo(`Tell her lanterns are hot`,`Tell her it's hot`,{fn:()=>{ G.flags.dr_m_moth='shoo'; },then:[xl('ember_kid',`Mind your wings, it's hot! ...Fine. Sit on the paper bit. And you can have a name.`,`Careful, it's hot! Fine. Sit here. You can have a name.`)]})]),
    xl('narr',`You whisper her a name. In the dream the wind takes it, the way names go in dreams.`,`You give her a name. The wind takes it.`),
    xl('narr',`Every Lantern Day after that, the little moth is waiting on the hill. Ember grows taller every year. The moth stays exactly the same size.`,`Every year, the little moth waits on the hill. Ember grows up.`),
    xl('narr',`Then one year Ember has a baby on her hip and a house full of lanterns. She lights them in her own windows, down in the valley, and she doesn't climb the hill.`,`One year Ember has a baby. She lights lanterns at home. She doesn't climb the hill.`),
    xl('narr',`Up on the hill, a little grey moth sits on a cold lantern post all night, facing the valley.`,`On the hill, the moth waits all night by a cold lantern post.`),
    xl('narr',`In the morning she flies off into the grey, looking back three times. She waits the next year, too. And the next.`,`In the morning she flies away. She looks back three times. She waits the next year too.`)]});
  if(!DREAMS.m_eclipse) defineDream('m_eclipse',{stages:['m_sable','m_burrows'],title:S('The Night Without Morning','No Morning'),scene:'eclipse',lines:()=>[
    xl('narr',`You dream of a world where the sun never comes up. Not dark. Just grey. The moon is gone. Even the stars look tired.`,`In your dream, the sun never comes up. The moon is gone.`),
    xl('narr',`On the hill above Emberhollow, a girl with horns sits alone, holding a lantern that has gone out.`,`Young Ember sits alone with a lantern that went out.`),
    xl('ember_kid',`It went out. It's never gone out before.`,`It went out. It never went out before.`),
    xl('ember_kid',`I was waiting for somebody. They didn't come.`,`I was waiting for someone. They didn't come.`),
    xc('narr',`She holds the cold lantern out to you.`,`She holds out the cold lantern.`,[
      xo(`Light it again`,`Light it again`,{tone:'brave',fn:()=>{ G.flags.dr_m_eclipse='light'; },then:[xl('narr',`You breathe on it. Nothing. You breathe harder. A tiny spark catches, and holds.`,`You breathe on it. A tiny spark catches.`)]}),
      xo(`Sit with her`,`Sit with her`,{tone:'kind',fn:()=>{ G.flags.dr_m_eclipse='sit'; },then:[xl('narr',`You sit down beside her. Her shoulder is warm against yours. The lantern flickers back on, all by itself.`,`You sit with her. The lantern lights up by itself.`)]})]),
    xl('narr',`You wake up. Your claws are warm. Pip is sitting on your chest, glowing like a nightlight.`,`You wake up. Pip glows on your chest.`)]});
}
if(typeof tamsinVerse==='function') tamsinVerse(()=>!!G.flags.m_done,S(`\u{1F3B5} A moth ate the moon, oh, a bite at a time, so Ash dove and dug and made moonfire shine...`,`\u{1F3B5} A moth ate the moon. Ash made moonfire shine...`));
// (each line is added unless the same words are there already: x3_people may add its own quests' lines first)
function m3sEpi(...L){ if(typeof EPI==='undefined'||!EPI) return; const A=EPI.m=EPI.m||[]; for(const e of L){ const t=e&&e.line&&e.line[1]; if(!A.some(q=>q&&q.line&&q.line[1]===t)) A.push(e); } }
m3sEpi(
  {pri:7,cond:()=>G.choices.m_hush==='free',line:['narr',S(`Hush lives in the Eclipse Observatory now, the first moth astronomer in the world. She counts the stars very, very quietly.`,`Hush lives in the Observatory now. She counts the stars, quietly.`)]},
  {pri:2,cond:()=>true,line:['narr',S(`Baron Puffington wrote "Don't puff up in doorways" on his hat. He has not been stuck since. Mostly.`,`The Baron has not been stuck since. Mostly.`)]});
// (the side quests' lines belong to x3_people: these stand in only when it has added none)
if(typeof EPI!=='undefined'&&EPI&&!(EPI.m||[]).some(q=>q&&q.pri<7&&q.pri!==2)) m3sEpi(
  {pri:6,cond:()=>m3sQDone('m_race'),line:['narr',S(`Rocket still says he's the fastest swimmer in Coralcombe. Second fastest is a dragon. Third is a squid named Pickles.`,`Rocket is the fastest swimmer. Second is Ash.`)]},
  {pri:6,cond:()=>m3sQDone('m_glaive'),line:['narr',S(`Old Kiln never made another glaive. He said one piece of the moon is enough for anybody. He made glass shoes instead. Nobody bought them.`,`Old Kiln made glass shoes. Nobody bought them.`)]},
  {pri:5,cond:()=>m3sQDone('m_lighthouse'),line:['narr',S(`Old Ned's lighthouse shines silver every night. Squint shouts LAND HO at it. It's always there.`,`The lighthouse shines every night. Squint shouts LAND HO.`)]},
  {pri:5,cond:()=>m3sQDone('m_noodle'),line:['narr',S(`Noodle grew up to be the biggest sandworm in the Glass Desert. He still eats shoes. Dusty and Dune have stopped wearing them.`,`Noodle grew huge. He still eats shoes.`)]},
  {pri:4,cond:()=>m3sQDone('m_moonfish'),line:['narr',S(`Cook Gilly never cooked the Moonfish. She painted it on the Floating Kitchen's sign instead. It is the only thing in Driftwood that doesn't taste of fish.`,`Gilly painted the Moonfish on her sign.`)]},
  {pri:4,cond:()=>m3sQDone('m_ferry'),line:['narr',S(`Rowan's ferry runs every day now, Driftwood to the Strand. The chickens ride for free.`,`The ferry runs every day. Chickens ride free.`)]},
  {pri:3,cond:()=>m3sQDone('m_lamps'),line:['narr',S(`Sable's lamps never went out again. Esme named a new one after Ash's mom. It is very warm and a little bit bossy.`,`Esme named a lamp after Mom. It is warm and bossy.`)]},
  {pri:2,cond:()=>true,line:['narr',S(`Baron Puffington wrote "Don't puff up in doorways" on his hat. He has not been stuck since. Mostly.`,`The Baron has not been stuck since. Mostly.`)]});
// chatter in Moonfall (THREADS 4.5 and bible 6.14), only when the people module has not added its own
const m3sBk=(k,who,c,t)=>{ try{ B('m3s_'+k,who,c,t); }catch(e){} };
if(typeof BARKS!=='undefined'&&!BARKS.some(b=>/^m_/.test(String(b.k)))){
  const inA=()=>actOf(G.stage)>=4&&curMap()===3;
  m3sBk('dw1','town:m_driftwood',inA,S(`The tide went out this morning and didn't come back for lunch.`,`The tide went out and didn't come back.`));
  m3sBk('dw2','town:m_driftwood',inA,S(`My raft drifted off with my breakfast on it. I miss my breakfast.`,`My raft floated off with my breakfast.`));
  m3sBk('dw3','town:m_driftwood',()=>inA()&&!!G.flags.m_eclipse1,S(`Did you see that moth? I've stopped going outside. I'm a raft town. Everything is outside.`,`Did you SEE that moth? I'm staying inside. Oh wait.`));
  m3sBk('sb1','town:m_sable',inA,S(`A dragon in Sable! Is it true you breathe fire? Can you light my lamp? I'll pay in dates.`,`A dragon! Can you light my lamp?`));
  m3sBk('sb2','town:m_sable',()=>inA()&&!!G.flags.m_eclipse2,S(`The well is dim. My lamp is dim. My mood is dim.`,`The well is dim. My mood is dim.`));
  m3sBk('sb3','town:m_sable',inA,S(`Esme says lamps make everything better. She's right. She's always right. It's annoying.`,`Esme says lamps make it better. She is right.`));
  m3sBk('sq','id:m_squint',inA,S(`LAND HO! ...It's still Palmcrest.`,`LAND HO! It's still Palmcrest.`));
  m3sBk('sf','id:m_saffron',inA,S(`Don't touch the well.`,`Don't touch the well.`));
  m3sBk('mf1','id:m_coralia,m_kipper,m_ripple,m_rocket,m_kelp',inA,S(`A dragon who swims! What next, a fish who walks?`,`A dragon who swims!`));
  m3sBk('mf2','id:m_coralia,m_kipper,m_ripple,m_rocket,m_kelp',inA,S(`Mind the coral. It bites. Only a little.`,`Mind the coral. It bites!`));
  m3sBk('kid','kid',()=>inA()&&m3sMoonNow()<95,S(`Somebody took a bite out of the moon! Was it you?`,`Who bit the moon? Was it you?`));
}
if(typeof CHATS!=='undefined'&&!CHATS.some(c=>/^m_/.test(String(c.k)))){
  const inA=()=>actOf(G.stage)>=4&&curMap()===3;
  try{
    VCH('m3s_dw','id:m_dabble','id:m_winnie',inA,[[0,S(`Is it a good day, Winnie?`,`Is it a good day, Winnie?`)],[1,S(`Ollie says no.`,`Ollie says no.`)],[0,S(`Ollie always says no.`,`Ollie always says no.`)]]);
    VCH('m3s_rk','id:m_rafi','id:m_kiln',inA,[[0,S(`Kiln, have you ever seen snow?`,`Kiln, have you seen snow?`)],[1,S(`I've made snow. Out of glass. It was sharp.`,`I MADE snow. Out of glass. It was sharp.`)]]);
    VCH('m3s_wr','id:wren','id:m_ripple',inA,[[1,S(`Your spelling is atrocious.`,`Your spelling is awful.`)],[0,S(`Your spelling is underwater.`,`Your spelling is underwater.`)]]);
    VCH('m3s_tg','id:ev_tikka','id:m_gilly',inA,[[0,S(`Bread is better than fish.`,`Bread is better than fish.`)],[1,S(`Fish IS bread. Wet bread.`,`Fish IS bread. Wet bread.`)]]);
  }catch(e){}
}

// ---------- 14. stand-ins: while a dungeon, the Puffington site or the Moonpath braziers are not built yet, the main
// path can still be walked: a prompt at the spot (no area at all), or the part's story when Ash steps into x3_world's
// one-room placeholder area. Each stand-in plays that part's story words, gives the power the real dungeon's gift
// shrine gives (grantAbility, the same call), and moves the act on. Each one switches itself off as soon as the real
// thing exists (a real dungeon in AREADEFS, a boss site for m_puffington, the world's moonstones on the Moonpath).
const m3sWorldBraziers=()=>typeof P4!=='undefined'&&!!P4.out&&P4.out.some(o=>o.p4==='moonstone'&&dist(o.x,o.y,M3SP.foot.x,M3SP.foot.y)<1200);
const m3sPuffSite=()=>Object.keys(SITES).some(k=>SITES[k]&&SITES[k].boss==='m_puffington');
const M3S_STAND_IN={m_lumen:S(`You climb in through the balcony door and down, and down, into the drowned moon city.`,`You climb down into the drowned city.`),
  m_burrows:S(`You slide down the Worm Mouth into the tunnels of the great sandworms.`,`You slide down into the worm tunnels.`),
  m_mirror:S(`You step between the tall mirrors into the Mirror Temple.`,`You step into the Mirror Temple.`)};
function m3sStandDun(id,abil){
  if(M3S.standRun) return false; M3S.standRun=true;
  const st=m3sDunStory(id), L=[['narr',M3S_STAND_IN[id]]];
  for(const k of ['in','shrine','gift']) if(st[k]) L.push(...st[k]);
  L.push(xdo(()=>{ if(abil&&!hasAbil(abil)) grantAbility(abil); }));
  for(const k of ['boss','won']) if(st[k]) L.push(...st[k]);
  if(id==='m_mirror'&&G.flags.pip&&!G.flags.m_pip_lamp) L.push(...STORY.m_pip_lamp);
  if(st.end) L.push(...st.end);
  m3sPlay(L,()=>{ M3S.standRun=false; G.flags['trial_'+id+'_done']=true; G.flags[id+'_done']=1; gainXp(M3S_XP.stand); questPoke();
    if(AREA&&m3sIn(id)) later(0.2,()=>{ if(AREA) exitArea(); }); });
  return true;
}
function m3sStandObs(){
  const F=G.flags;
  if(G.stage==='m_reforge'){ if(!F.m_reforged) m3sReforge(); return; }
  if(M3S.standRun||F.m_hush_done) return; M3S.standRun=true;
  if(G.stage==='m_moonpath') goStage('m_observatory',{card:false,quiet:true});
  const L=[]; if(!m3sSeen('m_obs_in')) L.push(...STORY.m_obs_in); L.push(...STORY.m_umber_intro,...STORY.m_umber_won,...STORY.m_hush_intro);
  m3sPlay(L,()=>{ M3S.standRun=false; later(0.3,()=>m3sHushDown(null)); },{mood:'m_eclipse'});
}
const M3S_STAND=[
  {k:'lumen',at:M3SP.spire,r:120,on:()=>G.stage==='m_lumen'&&!AREADEFS.m_lumen,label:S('Climb down into Drowned Lumen','Go down into Drowned Lumen'),act:()=>m3sStandDun('m_lumen','dive')},
  {k:'puff',at:M3SP.sunken,r:300,on:()=>G.stage==='m_reef'&&!G.flags.m_puff_done&&!m3sPuffSite(),label:S('Unplug the Sunken Gate','Unplug the Sunken Gate'),
    act:()=>m3sPlay(STORY.m_puff_intro.concat(STORY.m_puff_outro),()=>{ G.bossDone.m_puffington=true; G.flags.m_puff_done=1; gainXp(M3S_XP.stand); questUpdated(); })},
  {k:'burrows',at:M3SP.worm,r:150,on:()=>G.stage==='m_burrows'&&!AREADEFS.m_burrows,label:S('Slide down into the Sandworm Burrows','Go down into the Burrows'),act:()=>m3sStandDun('m_burrows','burrow')},
  {k:'mirror',at:M3SP.mirror,r:150,on:()=>(G.stage==='m_mirror'||G.stage==='m_glasswall'&&G.flags.m_gap_dug)&&!AREADEFS.m_mirror,label:S('Enter the Mirror Temple','Go into the Mirror Temple'),
    act:()=>{ if(G.stage==='m_glasswall') goStage('m_mirror',{card:false,quiet:true}); m3sStandDun('m_mirror','moonfire'); }},
  {k:'braz',at:M3SP.foot,r:170,on:()=>G.stage==='m_moonpath'&&m3sLit()<3&&!m3sWorldBraziers(),label:S('Light the moon braziers with Moonfire','Light the moon braziers'),
    act:()=>{ if(!hasAbil('moonfire')){ m3sPlay([xl('narr',`The moon braziers are cold blue bowls. Fire does nothing. They want moonlight.`,`The braziers want moonlight, not fire.`)]); return; }
      for(const id of ['foot','bend1','bend2']) m3sBrazier(id); m3sPlay(STORY.m_moonpath_lamp); }},
  {k:'obs',at:M3SP.obsDoor,r:150,on:()=>!AREADEFS.m_obs&&((G.stage==='m_moonpath'&&m3sLit()>=3)||G.stage==='m_observatory'||(G.stage==='m_reforge'&&!G.flags.m_reforged)),
    label:()=>G.stage==='m_reforge'?S('Go up to the Eclipse Lens','Go up to the Lens'):S('Enter the Eclipse Observatory','Go into the Observatory'),act:()=>m3sStandObs()}
];
{ const base=miniPrompts; miniPrompts=function(offer){ base(offer); try{ if(G&&G.mode==='story'&&!AREA&&curMap()===3&&m3sOn()) m3sPrompts(offer); }catch(e){ console.error(e); } }; }
function m3sPrompts(offer){
  const p=player;
  for(const s of M3S_STAND){ const d=dist(p.x,p.y,s.at.x,s.at.y); if(d>s.r) continue; let ok=false; try{ ok=s.on(); }catch(e){} if(!ok) continue;
    offer(d,typeof s.label==='function'?s.label():s.label,s.act,s.at.x,s.at.y); }
}
// inside x3_world's placeholder area of a dungeon that is not built yet: its story plays by itself, once, then Ash is
// put back outside its door (the Observatory's placeholder also holds the Eclipse Lens until x3_dun_b builds room q)
function m3sStandInside(dt){
  if(!AREA||!AREA.def||M3S.standRun||scene!=='play'||DLG) return;
  const root=AREA.def.dun||AREA.def.id; if(!m3sDunPh(root)) return;
  M3S.phT=(M3S.phT||0)+(dt||0); if(M3S.phT<0.7) return;     // (a moment to look round first)
  const st=G.stage, F=G.flags;
  if(root==='m_lumen'&&st==='m_lumen'&&!F.m_lumen_done) m3sStandDun('m_lumen','dive');
  else if(root==='m_burrows'&&st==='m_burrows'&&!F.m_burrows_done) m3sStandDun('m_burrows','burrow');
  else if(root==='m_mirror'&&(st==='m_mirror'||st==='m_glasswall')&&!F.m_mirror_done){ if(st==='m_glasswall') goStage('m_mirror',{card:false,quiet:true}); m3sStandDun('m_mirror','moonfire'); }
  else if(root==='m_obs'&&((st==='m_moonpath'&&m3sLit()>=3)||st==='m_observatory'||(st==='m_reforge'&&!F.m_reforged))) m3sStandObs();
}
// a moon brazier on the Moonpath was lit (by x3_world's brazier, or the stand-in): the count and its banner
function m3sBrazier(id){
  const F=G.flags, k='m_mpb_'+id; if(F[k]) return false; F[k]=1;
  F.m_moonpath_lit=Math.min(3,(F.m_moonpath_lit|0)+1);
  if(F.m_moonpath_lit<3) setBanner(S('A moon brazier is lit','A moon brazier is lit'),S(`${F.m_moonpath_lit} of 3. Its stairs will stay solid now.`,`${F.m_moonpath_lit} of 3.`),2.6);
  questUpdated(); return true;
}

// ---------- 15. one entry point for the other Act IV helpers (M3STORY.md lists every name): m3sBeat(name, arg, arg2)
// A name in M3S_PLAYS plays that scene once, when things are calm. The others move the story on.
const M3S_PLAYS={duchess:'m_duchess',mosaic:'m_lumen_mosaic',library:'m_lumen_library',window:'m_lumen_window',vault:'m_vault_open',octavia:'m_octavia_intro',
  octavia_won:'m_lumen_won',sandy:'m_sandy_talk',bell:'m_burrows_bell',gravelgut:'m_gravelgut_intro',gravelgut_won:'m_burrows_won',fanfare:'m_mirror_boss_in',fanfare_won:'m_mirror_won_v',
  pip_lamp:'m_pip_lamp',voice:'m_mirror_voice',scope:'m_obs_scope',star:'m_obs_star',vault2:'m_obs_vesper',museum:'m_obs_museum',ante:'m_obs_ante',
  umber_in:'m_umber_intro',umber_won:'m_umber_won',hush_in:'m_hush_intro',lamp:'m_moonpath_lamp',channel:'m_lumen_channel',ring:'m_worm_ring'};
function m3sBeat(name,arg,arg2){
  const F=G.flags;
  if(M3S_PLAYS[name]){ const k=M3S_PLAYS[name], again=name==='sandy';
    if(m3sSeen(k)&&!again) return false; if(name==='pip_lamp'&&(!F.pip||F.m_pip_lamp)) return false;
    m3sWhen('beat_'+name,null,()=>{ if(!m3sSeen(k)||again) m3sPlay(k,typeof arg==='function'?arg:null); }); return true; }
  switch(name){
    case 'lumen_done': F.m_lumen_done=1; return true;
    case 'burrows_done': F.m_burrows_done=1; return true;
    case 'mirror_done': F.m_mirror_done=1; return true;
    case 'puff_done': F.m_puff_done=1; G.bossDone.m_puffington=true; return true;
    case 'gap': F.m_gap_dug=1; return true;
    // (x3_world calls this when one of its braziers is lit for good, with 'foot', 'bend1' or 'bend2', and leaves the
    // banners to the story; it then sets m_moonpath_lit to its own count, the same number)
    case 'brazier': return m3sBrazier(arg||('b'+((F.m_moonpath_lit|0)+1)));
    case 'hush_down': return m3sHushDown(arg||m3sFindBoss('m_hushboss'),arg2);
    case 'lens': return m3sReforge();
    case 'eclipse1': m3sEclipse1(); return true;
    case 'eclipse2': m3sEclipse2(); return true;
  }
  return false;
}
// ---------- 16. debug hooks: window.__eb.m3s (tests: scratchpad/c_m3s/t_m3s.py), and the bible's names (13.5) for the
// parts this module owns (only where nobody else made them)
const M3S_DBG={M3S,M3SP,M3S_STAND,M3S_XP,STORY,play:m3sPlay,chain:m3sChain,seen:m3sSeen,mark:m3sMark,beat:m3sBeat,hushDown:m3sHushDown,reforge:m3sReforge,toPier:m3sToPier,endAct:m3sEndAct,
  dunStory:m3sDunStory,taunts:M3S_TAUNTS,ecl:m3sEcl,peak:m3sPeak,land:m3sLand,travel:m3sTravel,brazier:m3sBrazier,migrate:m3sMigrate,goTo:m3sGoTo,intro:m3sIntroStart,
  dlg:()=>{ if(!DLG) return null; const L=lineParts(DLG.lines[DLG.i]); return {who:typeof L.who==='function'?L.who():L.who,text:DLG.text,i:DLG.i,n:DLG.lines.length,mood:DLG.mood||null,opts:DLG.opts?DLG.opts.map(o=>simplify(typeof o.t==='function'?o.t():o.t)):null}; },
  choose:i=>{ if(!DLG||!DLG.opts) return false; DLG.chars=1e9; DLG.fullAt=performance.now()-2000; DLG.optsAt=performance.now()-2000; dlgChoose(i); return true; },
  next:()=>{ if(!DLG) return false; if(DLG.opts) return false; advanceDialogue(); return true; },
  npc:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); return n?{x:Math.round(n.x),y:Math.round(n.y)}:null; },
  talk:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n) return false; talkTo(n); return true; },
  prompt:()=>G.prompt?{text:G.prompt.text,x:Math.round(G.prompt.x||0),y:Math.round(G.prompt.y||0)}:null,
  use:()=>{ if(G.prompt){ const p=G.prompt; G.prompt=null; p.act(); return true; } return false; },
  rest:k=>{ if(k==='inn') innRest(); else restAtShrine(SHRINES.find(q=>mapAt(q.y)===curMap())||SHRINES[0]); return true; },
  forge:()=>M3S.forge?{n:M3S.forge.n,t:+M3S.forge.t.toFixed(2),per:M3S.forge.per,win:M3S.forge.win,pause:+M3S.forge.pause.toFixed(2),miss:M3S.forge.miss,msg:M3S.forge.msg}:null,
  forgeTap:hit=>{ const F=M3S.forge; if(!F) return false; F.pause=0; F.t=hit===false?0.02:F.per*(1-F.u0); m3sForgePress(); return true; },
  freeze:(on)=>{ M3S.dbg.freeze=!!on; return M3S.dbg.freeze; },
  anim:sec=>{ const f=M3S.dbg.freeze; M3S.dbg.freeze=false; for(let t=0;t<(sec||1);t+=1/30) m3sAnim(1/30); M3S.dbg.freeze=f; return true; },
  state:()=>({stage:G.stage,act:G.act,moon:m3sMoonNow(),bites:typeof bitesOf==='function'?bitesOf():null,hud:G.flags.moon_hud,ship:G.flags.m_ship||null,landed:!!G.flags.m_landed,deal:G.choices.m_deal||null,hush:G.choices.m_hush||null,
    leash:!!G.flags.m_leash_known,shard3:!!G.items.m_shard3,heart:!!G.items.m_heart,heartFlag:!!G.flags.m_heart,shards:['c_shard1','f_shard2','m_shard3'].filter(k=>G.items[k]>0),
    e1:!!G.flags.m_eclipse1,e2:!!G.flags.m_eclipse2,e3:!!G.flags.m_eclipse3,eclOn:!!G.flags.m_eclipse_on,ecl:M3S.ecl?{n:M3S.ecl.n,k:+M3S.ecl.k.toFixed(2),disc:+M3S.ecl.disc.toFixed(2),moth:!!M3S.ecl.moth}:null,
    peak:M3S.peak?{rise:+M3S.peak.rise.toFixed(2),bridge:+M3S.peak.bridge.toFixed(2),a:+M3S.peak.a.toFixed(2)}:null,dellAway:!!G.flags.m_dell_away,maren:!!G.flags.m_maren,reforged:!!G.flags.m_reforged,done:!!G.flags.m_done,act4:!!G.flags.act4_done,
    pipLamp:!!G.flags.m_pip_lamp,lit:m3sLit(),abil:['dive','burrow','moonfire'].filter(a=>hasAbil(a)),seen:Object.keys(G.flags.m_sn||{}),q:M3S.q.map(q=>q.id),fb:Object.keys(M3S.fb),scene,dark:typeof moonDark==='function'?+moonDark().toFixed(3):null,
    xp:player.xp,level:player.level,
    obj:(()=>{ try{ const o=questObjective(); return o?{text:o.text,x:Math.round(o.x||0),y:Math.round(o.y||0)}:null; }catch(e){ return String(e); } })()})
};
window.__ebX=Object.assign(window.__ebX||{},{m3s:M3S_DBG});
{ const X=window.__ebX, B={
    mEclipse:n=>{ n=n|0; if(n===1){ G.flags.m_puff_done=1; m3sEclipse1(); } else if(n===2) m3sEclipse2(); else if(n===3){ G.flags.m_reforged=1; m3sToPier(); } return n; },
    mMoon:p=>{ m3sMoon(p); return m3sMoonNow(); }, mReforge:()=>m3sReforge(), mLeash:()=>{ G.flags.m_leash_known=1; return true; },
    mDellAway:b=>{ G.flags.m_dell_away=b?1:0; setupNPCs(); return !!G.flags.m_dell_away; }};
  for(const k in B) if(!(k in X)) X[k]=B[k]; }
