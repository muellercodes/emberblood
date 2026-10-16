
// ================= Finale foes (x4_foes): the shades of Nightfall Peak, the four echo fights, and Nyxara, the Night Mother
// Bible: scratchpad/bible/FINALE.md 6 (echoes), 7 (allies in fights), 8 (Nyxara), 14 (foes), 17, 18. Doc for x4_story,
// x4_ascent and the integrator: scratchpad/N4FOES.md. Prefix n4f/N4F everywhere; debug hooks on window.__ebX.n4f.
//   Foes of the peak     n_shade, n_shade_wolf, n_shade_drake, n_mothling, n_lampmoth, n_inkknight, n_glasswing, n_frostshade
//   Echoes (boss sites)  n_echo1 n_echo_vor (the Shadow Throne), n_echo2 n_echo_vesper (the Mask Hall),
//                        n_echo3 n_echo_glaciar (the Rime Throne), n_echo4 n_echo_hush (the Eclipse Hall)
//   The Night Mother     n_summit n_nyxara (the Moon's Rest): four phases, the Heart moment, Heartfire, the fall
// The echoes wrap the bosses' own brains at run time (Vorlaxis x0_vorlaxis, Vesper x1_foes, Glaciar x2_foes, Hush
// x3_foes): nothing is copied, every echo is drawn with that boss's own figure in a shadow skin.
// Story hooks (x4_story sets them, every one optional): N4F.hook.fightStart(k,e), phase(k,i,e), heart(e,resume),
// fall(e), won(k), reset(k), ally(id). See N4FOES.md.
const N4F={hook:{},skinOn:false,dmg:0,hits:0,bySrc:{},ev:{},fight:null,cue:null,dth:{},tips:{},said:{},fall:null,
  allies:[],nyx:null,fx:[],moonFill:0,spark:{used:false},ward:0,big:false,bot:null};
const N4FCOL={violet:'190,120,255',silver:'225,232,255',white:'255,255,255',red:'255,80,70',orange:'255,160,60',gold:'255,214,120',ink:'120,70,200',ice:'170,220,255'};
const n4fD=(e,n,h)=>byDiff(e,n,h);
const n4fEasy=()=>foeDiff().easy, n4fHard=()=>foeDiff().hard;
// a boss hit of n (BALANCE.md literal hits at the boss's level, plus the difficulty's enemy damage)
function n4fDmg(e,n){ return n*((e&&e.edK)||1)*foeDiff().edmg; }
// a telegraph time for this difficulty (FINALE 8.2: x1.4 / 1 / 0.8)
function n4fTele(t){ return t*n4fD(1.4,1,0.8); }
function n4fEv(k){ N4F.ev[k]=(N4F.ev[k]||0)+1; }
function n4fTxt(e,t,col,sz){ ftext(e.x,(e._t3top!=null&&e._t3top<e.y?e._t3top:e.y-e.r-20)-(e.z||0)*0.2-14,t,col||'#ffe066',sz||15); }
function n4fSay(e,who,line,gap){ if(e&&e._n4say>G.time) return; if(e) e._n4say=G.time+(gap||7); taunt(who,line); }
function n4fTip(id,title,text,dur){ if(N4F.tips[id]) return; N4F.tips[id]=1; try{ mvTip(title,text,dur||7,'n4f_'+id); }catch(err){ setBanner(title,text,3); } }
function n4fHook(k){ const f=N4F.hook[k]; if(typeof f!=='function') return undefined; try{ return f.apply(null,Array.prototype.slice.call(arguments,1)); }catch(err){ console.error('n4f hook '+k,err); return undefined; } }
function n4fPuff(x,y,col,n){ emit(x,y,n||16,{col:col||'110,80,170',glow:false,smin:30,smax:150,lmin:.3,lmax:.7,zmin:2,zmax:5,grow:6,drag:1}); }
// moth flecks: the echoes and shades peel little dark moths while they move
function n4fFlecks(e,dt,k){ if(!inView(e.x,e.y,120)) return; const mv=Math.hypot(e.dx||0,e.dy||0)>8; if(Math.random()<dt*(mv?10:3)*(k||1)){ const a=rand(0,TAU), r=rand(0,e.r*0.9);
  emit(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*0.6-(e.z||0)-e.r*0.6,1,{col:Math.random()<0.5?'40,26,70':'150,110,230',glow:false,ang:-Math.PI/2+rand(-0.8,0.8),spread:0.5,smin:14,smax:46,lmin:.6,lmax:1.2,zmin:1.2,zmax:2.4,drag:0.6,rise:20}); } }
// the hurt flash on a figure (0..1 for 0.28 s after a hit)
function n4fHurtK(e){ return e.lastHit!=null?clamp(1-((G?G.time:0)-e.lastHit)/0.28,0,1):0; }
// floors: a hit never takes health below frac of the bar until a gate is met (the mechanics are required)
function n4fFloor(e,a,o,frac){ const room=e.hp-e.maxHp*frac; if(room<=0.5) return false; return Math.min(a,room/((o&&o.mult)||1)); }
function n4fGate(e,a,o,frac,done,txt){ if(done||a===false) return a; const b=a, r=n4fFloor(e,a,o,frac); if((r===false||r<b)&&!(e._n4gt>G.time)){ e._n4gt=G.time+3.2; n4fTxt(e,txt,'#ffd27a',13); } return r; }
// Ash's level and state
function n4fLvl(x,y){ try{ return elevLvl(x==null?player.x:x,y==null?player.y:y); }catch(e){ return 0; } }
function n4fUp(){ return airborne()||(typeof P3!=='undefined'&&!!P3.ride)||(typeof P2!=='undefined'&&P2.mv&&P2.mv.kind==='hang'); }
function n4fBur(){ return typeof p4Burrowed==='function'&&p4Burrowed(); }
function n4fDiving(){ return typeof P4!=='undefined'&&(P4.mode==='dive'||(P4.mv&&P4.mv.kind==='pool')); }
function n4fShadowed(){ return typeof p2Shadowed==='function'&&p2Shadowed(); }
function n4fMoonOn(){ return typeof p4MoonOn==='function'&&p4MoonOn(); }
function n4fMoonAt(x,y,r){ return typeof p4MoonHits==='function'&&p4MoonHits(x,y,r||16); }
function n4fBlueAt(x,y,r){ return typeof p3JetHits==='function'&&p3JetHits(x,y,r||12); }
function n4fFireAt(x,y,r){ const p=player; return !!p&&p.breathing&&((inBreath(x,y,r||12)&&!n4fMoonOn())||n4fBlueAt(x,y,r)); }
function n4fPounded(x,y,r){ const L=typeof P3!=='undefined'?P3.lastPound:null; return !!L&&G.time-L.t<0.06&&dist(L.x,L.y,x,y)<(r||60)+(L.R||0)*0.3; }
function n4fMap4(){ return !!G&&!AREA&&player&&player.y>=79900&&player.y<=91100&&player.x<IZX-50; }
// the five boss sites of the peak and which fight is on
const N4FSITE={n_echo1:'n_echo_vor',n_echo2:'n_echo_vesper',n_echo3:'n_echo_glaciar',n_echo4:'n_echo_hush',n_summit:'n_nyxara'};
const N4FK={n_echo_vor:1,n_echo_vesper:2,n_echo_glaciar:3,n_echo_hush:4,n_nyxara:5};
function n4fOn(){ const k=G&&G.fightSite; return k&&N4FSITE[k]?k:null; }
function n4fBoss(type){ const e=G&&G.boss; return e&&!e.dead&&(!type||e.type===type)?e:null; }
// a fight is open once its stage is a real stage the story has reached (no stray objectives before the finale exists),
// or when a test asked for it
function n4fStageOK(st){ if(N4F.force) return true; return typeof STAGES!=='undefined'&&STAGES.includes(st)&&reached(st); }
// x4_story (it loads after this file, in the same scope): when it is in the build it runs the friends, the Spark, the
// Ward-lights, the giant heir, the Heart moment, the fall and the phase scenes, and this file calls it (n4sHeart,
// n4sFall, n4sPhaseStart, n4sAllyHere, n4sAllyBeat, n4sGlaciarCalm). Without it the stand-ins in this file play.
function n4fS(){ return typeof n4sHeart==='function'; }
function n4fAllyHere(id){ if(typeof n4sAllyHere==='function'){ try{ return !!n4sAllyHere(id); }catch(e){ return false; } } return !!N4F.allies.find(a=>a.id===id); }
function n4fCalm(){ if(typeof n4sGlaciarCalm==='function'){ try{ if(n4sGlaciarCalm()) return true; }catch(e){} } return N4F.calmT>0; }

// ---------- the shadow skin: any toy figure drawn inside n4fSkin() comes out near-black with a violet rim light and
// white eyes (the echoes and the shades are the moon's dark copies of old foes). The parts are recoloured just before
// the toy engine sorts and draws them; colours are cached, so it costs a lookup per part.
const N4FSK=new Map();
function n4fHex(r,g,b){ return '#'+[r,g,b].map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join(''); }
function n4fSkinCol(c,dot){
  if(typeof c!=='string') return c; const key=(dot?'d':'p')+c; let v=N4FSK.get(key); if(v) return v;
  let r=40,g=30,b=60; if(c[0]==='#'&&c.length>=7){ r=parseInt(c.slice(1,3),16); g=parseInt(c.slice(3,5),16); b=parseInt(c.slice(5,7),16); }
  const L=(0.3*r+0.59*g+0.11*b)/255, sat=(Math.max(r,g,b)-Math.min(r,g,b))/255;
  if(dot) v=L>0.55?'#f6f0ff':L>0.32?'#b090f0':'#140a22';
  else if(L>0.86&&sat<0.18) v='#ece4ff';
  else if(sat>0.5&&L>0.42) v='#7a4ae0';
  else { const q=Math.round(clamp(L*1.2,0,1)*5)/5, m=mixRGB([18,12,34],[78,60,118],q); v=n4fHex(m[0],m[1],m[2]); }
  if(N4FSK.size>3000) N4FSK.clear(); N4FSK.set(key,v); return v;
}
{ const base=t3End; t3End=function(){
    if(N4F.skinOn){ const R=T3R; for(let i=0;i<R.n;i++){ const p=R.list[i]; p.col=n4fSkinCol(p.col,p.t===4); if(p.top) p.top=n4fSkinCol(p.top,false); if(p.edge) p.edge='#6a4aa8'; } }
    return base.apply(this,arguments); }; }
{ const base=foGlow; foGlow=function(x,y,z,r,col,a,occ){ if(N4F.skinOn) col=N4F.glowCol||'170,120,255'; return base(x,y,z,r,col,a,occ); }; }
function n4fSkin(fn,glow){ const o=SBC.outline; N4F.skinOn=true; N4F.glowCol=glow||null; SBC.outline='#9a6aff'; try{ fn(); } finally{ N4F.skinOn=false; N4F.glowCol=null; SBC.outline=o; } }
// the Classic look: the shadows are drawn with the toy figure in the shadow skin there too (a canvas filter over a stock
// 2D drawer was far too slow on phones: one filtered layer per path). T3 is switched on just for the figure.
function n4fSkin2(fn,glow){ const o=T3.on; T3.on=true; try{ n4fSkin(fn,glow); } finally{ T3.on=o; } }
// a violet rim glow under a shadow figure (both looks)
function n4fRim(e,r,a){ glowAt(e.x,e.y-(e.z||0)*0.8-r*0.4,r,'150,100,255',a==null?0.22:a); }

// ---------- ground marks (telegraphs that are not a foe's own e.tele): circle, line, cone, donut. fire(z) runs at the end
FZK.n4fmark={
  tick(z){ if(z.owner&&z.owner.dead){ z.done=true; return; } if(z.follow){ const q=z.follow(z); if(q){ z.x=q.x; z.y=q.y; if(q.ang!=null) z.ang=q.ang; } }
    if(!z.fired&&z.t>=z.dur){ z.fired=true; if(z.fire) try{ z.fire(z); }catch(err){ console.error(err); } if(!z.hold) z.done=true; } },
  drawG(z){ const k=clamp(z.t/z.dur,0,1), col=z.col||N4FCOL.red; if(z.fired&&!z.hold) return; ctx.save();
    if(z.shape==='line'){ ctx.translate(z.x,z.y); ctx.rotate(z.ang||0); const L=z.len, w=z.w||30;
      ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.fillRect(0,-w/2,L,w); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.strokeRect(0,-w/2,L,w); ctx.fillStyle=`rgba(${col},0.25)`; ctx.fillRect(0,-w/2,L*k,w); }
    else if(z.shape==='cone'){ ctx.translate(z.x,z.y); ctx.rotate(z.ang||0); const R=z.len, h=z.half||0.5;
      ctx.fillStyle=`rgba(${col},${0.1+0.12*k})`; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R,-h,h); ctx.closePath(); ctx.fill(); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle=`rgba(${col},0.22)`; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,Math.max(1,R*k),-h,h); ctx.closePath(); ctx.fill(); }
    else if(z.shape==='donut'){ ctx.fillStyle=`rgba(${col},${0.1+0.12*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r2,0,TAU); ctx.arc(z.x,z.y,z.r1,0,TAU,true); ctx.fill();
      ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(z.x,z.y,z.r2,0,TAU); ctx.stroke(); ctx.strokeStyle=`rgba(${col},0.4)`; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(z.x,z.y,lerp(z.r1,z.r2,k),0,TAU); ctx.stroke(); }
    else { ctx.fillStyle=`rgba(${col},${0.1+0.12*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2.4; ctx.stroke();
      ctx.fillStyle=`rgba(${col},0.22)`; ctx.beginPath(); ctx.arc(z.x,z.y,Math.max(1,z.r*k),0,TAU); ctx.fill(); }
    ctx.restore(); } };
function n4fMark(o){ return fzAdd('n4fmark',Object.assign({dur:0.8,r:50,col:N4FCOL.red,shape:'circle'},o)); }
// a puddle of shadow ink left by a breath or a landing: slows and nips (the Echo of the First Flame's breath)
FZK.n4fink={
  tick(z,dt){ const p=player; z.a=clamp(Math.min(z.t/0.3,(z.life-z.t)/0.6),0,1); if(p.dead||n4fUp()||dist(p.x,p.y,z.x,z.y)>z.r) return;
    p.slowT=Math.max(p.slowT||0,0.25); z.nip=(z.nip||0)-dt; if(z.nip<=0){ z.nip=0.8; hurtPlayer(z.dmg||5,p.x,p.y,0); } },
  drawG(z){ const a=z.a==null?1:z.a; if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='rgba(20,10,38,.82)'; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r,z.r*0.72,0,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(150,100,240,.6)'; ctx.lineWidth=2; ctx.stroke(); const s=0.5+0.5*Math.sin(G.time*4+z.x); ctx.fillStyle=`rgba(200,170,255,${0.4*s})`; ctx.beginPath(); ctx.ellipse(z.x-z.r*0.3,z.y-z.r*0.2,z.r*0.25,z.r*0.08,-0.3,0,TAU); ctx.fill(); ctx.restore(); } };

// ---------- the arena: black glass shards that rise in a ring (FINALE 6.0) with violet light in them
ARENA_STY.n4glass=function(g,rng,v){ const out='#120a20', fill='#2a1e46', lit='#5a4a8e';
  g.fillStyle='rgba(0,0,0,.34)'; g.beginPath(); g.ellipse(24,55,18,4.6,0,0,TAU); g.fill();
  const sh=[[24,12,46+rng()*10],[11,9,24+rng()*10],[37,10,30+rng()*10]]; if(v===1) sh.push([30,6,18]); if(v===2) sh.push([16,6,14]);
  for(const [x,w,h] of sh){ const pts=[[x-w/2,54],[x+w/2,54],[x+w*0.34,54-h*0.7],[x+rng()*2-1,54-h],[x-w*0.36,54-h*0.66]];
    g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(const q of pts) g.lineTo(q[0],q[1]); g.closePath(); g.fillStyle=fill; g.fill(); g.lineWidth=1.5; g.strokeStyle=out; g.stroke();
    g.strokeStyle=lit; g.lineWidth=1.1; g.beginPath(); g.moveTo(x-1,54-h*0.92); g.lineTo(x-w*0.22,54-h*0.3); g.stroke();
    g.strokeStyle='#c8a8ff'; g.globalAlpha=0.75; g.lineWidth=0.9; g.beginPath(); g.moveTo(x+w*0.18,54-h*0.62); g.lineTo(x+w*0.08,54-h*0.18); g.stroke(); g.globalAlpha=1; } };

// ---------- words: STORY.bosses[type].intro/outro read the story's own keys first (x4_story writes them), else the
// bible's lines built in here. Lines are [who, S(full, simple)] or {who, text, skipIf} (a line that only plays sometimes)
function n4fL(who,full,simple,cond){ return cond?{who,text:S(full,simple),skipIf:()=>{ try{ return !cond(); }catch(e){ return true; } }}:[who,S(full,simple)]; }
function n4fLines(type,introKey,outroKey,intro,outro){
  const B={}; Object.defineProperty(B,'intro',{get(){ const s=STORY[introKey]; if(s&&s.length) return s; return n4fRetry(type)&&intro.short?intro.short():intro(); },set(v){ STORY[introKey]=v; },configurable:true,enumerable:true});
  Object.defineProperty(B,'outro',{get(){ const s=STORY[outroKey]; if(s&&s.length) return s; return outro?outro():[]; },set(v){ STORY[outroKey]=v; },configurable:true,enumerable:true});
  STORY.bosses[type]=B; }
// a retry (Ash fell in this fight before): the short intro
function n4fRetry(type){ return !!(G&&G.flags&&G.flags['n4f_try_'+type]); }
function n4fSpk(id,name,col){ if(!SPK[id]) SPK[id]={name,col}; }
n4fSpk('n_echo_vor','Echo of the First Flame','#6a4a8a'); n4fSpk('n_echo_vesper','Echo of the Moth Mask','#5a4a7a');
n4fSpk('n_echo_glaciar','Echo of the Ice Dragon','#4a5a8a'); n4fSpk('n_echo_hush','Echo of the Hush','#5a5a6a'); n4fSpk('n_memory','A memory','#c8c0e8');

// ---------- the damage log (tests), and stand-ins for Cindervane's Spark, the Wardens' lights and the heir's giant Ash
// (x4_story owns those three when it is in the build: n4fS() switches these off)
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){
    const p=player, k=n4fOn();
    if(k&&p&&!p.dead&&!(p.iframes>0)&&scene==='play'&&!(window.__eb&&window.__eb.god)&&!n4fS()){
      if(G.items&&G.items.n_spark&&!N4F.spark.used&&!(p.flying&&!airHitOK(sx,sy))){ N4F.spark.used=true; p.iframes=0.8; flashA=Math.max(flashA,0.3); flashCol='255,214,120'; SFX.play('block'); ftext(p.x,p.y-40,S('CLANG! The Spark holds!','CLANG!'),'#ffe08a',16); n4fEv('spark'); return false; }
      if(N4F.ward>0&&!(p.flying&&!airHitOK(sx,sy))){ N4F.ward--; p.iframes=0.7; SFX.play('block'); emit(p.x,p.y-20,16,{col:'255,226,140',smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); ftext(p.x,p.y-40,S('A Ward-light blocks it!','Blocked!'),'#ffe08a',14); return false; }
      if(N4F.big) amt*=0.7; }
    const h0=p?p.hp:0, r=base(amt,sx,sy,kb);
    if(r&&p&&k){ const d=Math.max(0,h0-p.hp); N4F.dmg+=d; N4F.hits++; let src='other', bd=320*320; if(sx!=null) for(const q of G.enemies){ if(q.dead) continue; const dd=dist2(q.x,q.y,sx,sy); if(dd<bd){ bd=dd; src=q.type+':'+(q.state||''); } } N4F.bySrc[src]=(N4F.bySrc[src]||0)+d; }
    return r; }; }
// the heir's giant Ash in Heartfire hits harder (FINALE 8.4)
{ const base=damageEnemy; damageEnemy=function(e,amt,o){ if(N4F.big&&e&&e.type==='n_nyxara') amt*=1.3; return base(e,amt,o); }; }

// ================= 2. the foes of the peak (FINALE 14): shadow copies of old foes, plus lamp moths and moths of ink.
// Level 1 numbers (BALANCE.md 6): spawn them at the peak's level (21 to 23). Every shade is the stock foe's own brain
// and figure, drawn in the shadow skin (near-black, violet rim, white eyes) and peeling little moths as it moves.
const N4F_SHADE2D={kobold:(e,fl)=>foKobold(e,fl,0),wolf:(e,fl)=>T3E.wolf(e,fl),drake:(e,fl)=>foDrake(e,fl,false),knight:(e,fl)=>foKnight(e,fl,false,false),cultist:(e,fl)=>foCultist(e,fl,false),slime:(e,fl)=>T3E.slime(e,fl)};
function n4fShade3(fig){ return (e,fl)=>{ n4fSkin(()=>fig(e,fl)); }; }
function n4fShade2(k){ return (e,fl)=>{ n4fRim(e,e.r*2.2,0.18); n4fSkin2(()=>N4F_SHADE2D[k](e,fl)); }; }
function n4fShadeAI(base){ return (e,dt,p)=>{ base(e,dt,p); n4fFlecks(e,dt,0.6); }; }
// ---------- n_shade: an ink kobold. It bursts into little mothlings when it falls (Easy one, else two)
defineFoe('n_shade',{name:'Shade',r:12,hp:34,speed:135,dmg:10,value:14,dcol:'70,46,120',
  ai:n4fShadeAI(AI.kobold),
  onDeath(e){ if(G.mode!=='story'||e.small) return; const n=n4fEasy()?1:2; for(let i=0;i<n;i++){ const a=rand(0,TAU); const m=makeEnemy('n_mothling',e.x+Math.cos(a)*14,e.y+Math.sin(a)*14,{level:e.level,aggro:true,small:true,homeX:e.x,homeY:e.y,leash:1400}); m.spawnIn=0.15; m.cd=rand(0.6,1.4); if(e.inArea) m.inArea=e.inArea; if(e.inArena) m.inArena=e.inArena; }
    n4fPuff(e.x,e.y-10,'90,60,150',14); },
  draw3d:n4fShade3((e,fl)=>foKobold(e,fl,0)), draw2d:n4fShade2('kobold'),
  sheet:[{state:'chase',label:'idle'},{state:'chase',dx:80,label:'walk'},{state:'windup',st:0.2,label:'windup'},{state:'strike',label:'strike'}]});
// ---------- n_shade_wolf: a shadow wolf (Tier III)
defineFoe('n_shade_wolf',{name:'Shade Wolf',r:13,hp:40,speed:195,dmg:11,value:18,dcol:'60,46,110',
  ai:n4fShadeAI(AI.wolf),
  draw3d:n4fShade3((e,fl)=>T3E.wolf(e,fl)), draw2d:n4fShade2('wolf'),
  sheet:[{state:'chase',label:'idle'},{state:'chase',dx:120,label:'run'},{state:'crouch',st:0.2,label:'crouch'},{state:'lunge',dx:300,label:'lunge'}]});
// ---------- n_shade_drake: a shadow drakeling (flying; Tier I and III)
defineFoe('n_shade_drake',{name:'Shade Drake',r:13,hp:44,speed:165,dmg:12,value:22,flying:true,dcol:'80,50,140',
  ai:n4fShadeAI(AI.drakeling),
  draw3d:n4fShade3((e,fl)=>foDrake(e,fl,false)), draw2d:n4fShade2('drake'),
  sheet:[{state:'chase',dx:80,label:'fly'},{state:'aim',st:0.3,label:'aim'},{state:'charge',dx:400,label:'dive'}]});
// ---------- n_inkknight: an ink shield (front hits x0.15). The hammer or a Chain Whip pull knocks it off for 5 s; Moonfire
// melts it for 5 s (p4: e.ink)
defineFoe('n_inkknight',{name:'Ink Knight',r:19,hp:140,speed:70,dmg:17,value:45,shield:true,kbRes:0.25,dcol:'50,36,96',
  init(e){ e.ink=true; e.moonK=1.6; },
  ai:(e,dt,p)=>{ AI.knight(e,dt,p); if(e.n4shT>0){ e.n4shT-=dt; e.blocking=false; if(e.n4shT<=0) e.shield=true; else e.shield=false; } n4fFlecks(e,dt,0.5); },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.blocking&&!h.behind&&(h.src==='hammer'||h.src==='whip')&&!(e.n4shT>0)){ e.n4shT=5; e.shield=false; e.blocking=false; stunEnemy(e,0.6); SFX.play('block'); n4fTxt(e,h.src==='whip'?S('Yank! The ink shield is off!','Shield off!'):S('Smash! The ink shield breaks!','Shield broken!'),'#e0d0ff',14); emit(e.x,e.y-14,18,{col:'60,30,120',glow:false,smin:40,smax:160,lmin:.3,lmax:.7,zmin:2,zmax:4,drag:2}); }
    else if(e.blocking&&!h.behind&&!(e.n4shT>0)&&!(e._n4inkT>G.time)){ e._n4inkT=G.time+4; n4fTxt(e,S('An ink shield! Hammer it, whip it, or melt it with Moonfire.','Ink shield! Hammer, whip, or Moonfire!'),'#e0d0ff',12); } },
  over(e,l){ if(e.dead||!(e.blocking||e.shield)||e.n4shT>0) return; const a=e.face, x=e.x+Math.cos(a)*e.r*0.9, y=e.y+Math.sin(a)*e.r*0.5-18-(l||0); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35+0.15*Math.sin(G.time*5);
    ctx.fillStyle='rgba(120,70,220,1)'; ctx.beginPath(); ctx.ellipse(x,y,10,15,a,0,TAU); ctx.fill(); ctx.restore(); },
  draw3d:n4fShade3((e,fl)=>foKnight(e,fl,false,false)), draw2d:n4fShade2('knight'),
  sheet:[{state:'chase',blocking:true,label:'guard'},{state:'chase',dx:60,blocking:true,label:'walk'},{state:'windup',st:0.3,blocking:true,label:'windup'},{state:'recover',st:0.4,label:'open'}]});
// ---------- n_glasswing: a glass-winged caster: three glass shards (a sword swing sends them back)
defineFoe('n_glasswing',{name:'Glasswing',r:13,hp:40,speed:90,dmg:10,value:20,dcol:'120,90,200',
  ai:FK.shooter({mode:'spread',n:3,spread:0.2,spd:300,kind:'ice',r:7,windup:0.6,keep:[180,300],range:520,back:true,dmg:1}),
  draw3d:(e,fl)=>{ n4fSkin(()=>foCultist(e,fl,false)); n4fGlassWings(e); }, draw2d:(e,fl)=>{ n4fShade2('cultist')(e,fl); n4fGlassWings2(e); },
  sheet:[{state:'chase',label:'idle'},{state:'chase',dx:60,label:'walk'},{state:'cast',st:0.3,label:'cast'}]});
function n4fGlassWings(e){ if(e.dead) return; const t=e.t||0, f=Math.sin(t*6)*0.2, x=e.x, y=e.y-26, sp=e.state==='cast'?1.25:1; ctx.save(); ctx.globalAlpha*=0.55;
  for(const s of [-1,1]){ ctx.fillStyle='rgba(200,220,255,.5)'; ctx.strokeStyle='rgba(230,240,255,.9)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x+s*15*sp,y-4,14*sp,8,s*(0.5+f),0,TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x+s*18*sp,y-6,2,0,TAU); ctx.fill(); } ctx.restore(); }
function n4fGlassWings2(e){ n4fGlassWings(e); }
// ---------- n_frostshade: a hopping blob of black frost; every landing leaves slippery ice. Blaze kills it in 1 s
defineFoe('n_frostshade',{name:'Frost Shade',r:14,hp:38,speed:95,dmg:10,value:16,kbRes:1.1,dcol:'90,110,170',
  init(e){ e.ice=true; e.n4blz=0; },
  ai:(e,dt,p)=>{ const h0=e.hopT||0; AI.slime(e,dt,p); if(h0>0&&!(e.hopT>0)){ if(FZK.f2ice) fzAdd('f2ice',{x:e.x,y:e.y,r:34,life:5,rot:rand(-0.3,0.3)}); else fzAdd('n4fink',{x:e.x,y:e.y,r:30,life:4,dmg:0}); }
    if(e.n4blz>0&&!(e._n4bT>G.time-0.2)) e.n4blz=Math.max(0,e.n4blz-dt*0.5); n4fFlecks(e,dt,0.4); },
  onBlaze(e,dt){ e.n4blz=(e.n4blz||0)+dt; e._n4bT=G.time; if(Math.random()<dt*20) emit(e.x,e.y-10,1,{col:'220,240,255',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:6,drag:1});
    if(e.n4blz>=1&&!e.dead){ n4fTxt(e,S('Melted!','Melted!'),'#cfefff',14); damageEnemy(e,e.hp+10,{src:'fire'}); } },
  draw3d:(e,fl)=>{ n4fSkin(()=>T3E.slime(e,fl),'170,220,255'); if(!e.dead&&inView(e.x,e.y,40)) glowAt(e.x,e.y-8,e.r*1.6,'150,200,255',0.18); }, draw2d:n4fShade2('slime'),
  sheet:[{state:'chase',label:'idle'},{state:'chase',hopT:0.15,label:'hop'}]});
// frostshades are icy (the Blaze jet hurts them more), and the jet hook reaches every one of them
{ const base=makeEnemy; makeEnemy=function(type,x,y,opt){ const e=base(type,x,y,opt); if(type==='n_frostshade'&&!e.onBlaze) e.onBlaze=FOES.n_frostshade.onBlaze; return e; }; }

// ---------- n_mothling: a little moth of ink (flying). When Ash breathes fire, every mothling within 400 rushes the
// flame (they love it, and it burns them): a cue for the Glaive spin, a roar, or Heartfire
function n4fMothAI(e,dt,p){
  p=p||player; e.dx=e.dy=0;
  if(p.breathing&&!p.dead&&dist2(e.x,e.y,p.x,p.y)<400*400){ const f=p.facing, fx=p.x+Math.cos(f)*70, fy=p.y+Math.sin(f)*70; steer(e,fx,fy,e.speed*1.5*foeDiff().spd); e.face=turnTo(e.face,angTo(e.x,e.y,fx,fy),10*dt); e.state='rush';
    if(!e._n4rushSaid&&!N4F.said.moths){ N4F.said.moths=1; n4fTip('moths',S('Moths love fire','Moths love fire'),S('Mothlings rush at your flame. Spin the Glaive or roar to swat a whole swarm.','Moths fly at your fire! Spin the Glaive or roar.')); }
    e._n4rushSaid=true; e.touchCd=(e.touchCd||0)-dt; if(e.touchCd<=0&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+2){ if(hurtPlayer(e.dmg,e.x,e.y,90)) e.touchCd=0.9; } return; }
  if(e.state==='rush') e.state='chase';
  AI.bat(e,dt);
  if(Math.random()<dt*2) emit(e.x,e.y-14,1,{col:'150,110,230',glow:false,smin:5,smax:20,lmin:.4,lmax:.8,zmin:1,zmax:2,drag:1});
}
defineFoe('n_mothling',{name:'Mothling',r:8,hp:14,speed:220,dmg:6,value:6,flying:true,kbRes:1.4,dcol:'110,80,170',
  ai:n4fMothAI,
  // Heartfire (phase 4 of the Night Mother) burns them in one touch
  onHurt(e,amt,o){ if(N4F.heartfire&&(o.src==='fire'||o.src==='burn'||o.src==='moon')) return e.hp+5; },
  draw3d:(e,fl)=>n4fMothFig(e,fl,1,false), draw2d:(e,fl)=>n4fMoth2(e,fl,1),
  sheet:[{state:'chase',dx:80,label:'fly'},{state:'swoop',dx:300,label:'swoop'},{state:'rush',dx:200,label:'rush the flame'}]});
// a small moth toy (the mothlings, Nyxara's moth bubbles and fliers): wings from c1Wing (x1_foes), drawn in shadow
function n4fMothFig(e,fl,sz,light){
  const dt=foDt(e), t=(e.t||0)+(e.id||0)*0.37, k=(e.r/8)*0.62*(sz||1), face=t3Turn(e,e.face,12), fx=e.x, fy=e.y+e.r*0.4, z=(e.z||0)+16+Math.sin(t*5)*3;
  const flap=Math.sin(t*(e.state==='swoop'||e.state==='rush'?30:22));
  const body=fl?'#ffffff':light?'#e8e4f4':'#2a1e44', wing=light?'#f2eefa':'#3a2c5e', wingD=light?'#c8c0dc':'#241a3e';
  foShadow(fx,fy,10*k,0.22);
  foBegin(fx,fy,face,k,fl,z);
  for(const sd of [-1,1]){ c1Wing(sd,1,sd*2,6,13,9,0.35+flap*0.75,2,wing,wingD,2.4,light?'#9a7ad8':'#d8c8ff'); c1Wing(sd,-3,sd*1.6,5,9,6,0.2+flap*0.6,6,wingD,null,0,null); }
  foE(-2,0,6,5,2.6,2.6,body); foB(3.5,0,6.8,2.6,body);
  for(const sd of [-1,1]){ foD(5.4,sd*1.3,7.4,0.9,light?'#2a2240':'#f4eeff',0.05); foN(4.6,sd*0.8,8.6,7.6,sd*2.8,11.6,0.35,light?'#bcb4cc':'#8a72c8',0.04); }
  foEnd(8); e._t3top=foTop(fy,18,k,z);
}
function n4fMoth2(e,fl,sz){ const x=e.x, y=e.y-14-(e.z||0), r=e.r*(sz||1), f=Math.sin((e.t||0)*24); ctx.save(); ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+3,r,r*0.4,0,0,TAU); ctx.fill();
  ctx.translate(x,y); ctx.rotate(e.face+Math.PI/2); ctx.fillStyle=fl?'#fff':'#3a2c5e'; ctx.strokeStyle='#120a20'; ctx.lineWidth=1.2;
  for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(s*r*0.8,0,r*0.8,r*(0.55+0.25*f),s*0.3,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#d8c8ff'; ctx.beginPath(); ctx.arc(s*r*0.85,-1,r*0.18,0,TAU); ctx.fill(); ctx.fillStyle=fl?'#fff':'#3a2c5e'; }
  ctx.fillStyle=fl?'#fff':'#241a3e'; ctx.beginPath(); ctx.ellipse(0,0,r*0.3,r*0.75,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#f4eeff'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(s*2,-r*0.55,1.4,0,TAU); ctx.fill(); } ctx.restore(); }

// ---------- n_lampmoth: a big moth perched on a glass post, holding a lamp. Its beam sweeps 90 degrees every 4 s; a
// beam on Ash rings an alarm (3 shades come). It cannot see a Shadow Dash or a burrowing Ash. An arrow, the Chain Whip
// or the Moon Glaive pops its lamp: it drops, stunned 3 s, and two hits finish it. Placing: spawn it with opt.face (the
// middle of its sweep, radians) and opt.sweep (default 90 degrees)
function n4fLampBeam(e){ const T=4, a=e.n4base+Math.sin((e.t||0)*TAU/T+(e.id||0))*e.n4sweep/2; return a; }
function n4fLampSees(e){ const p=player; if(p.dead||n4fShadowed()||n4fBur()||n4fDiving()) return false; const a=e.n4beam, d=dist(e.x,e.y,p.x,p.y); if(d>260+p.r) return false; return Math.abs(angDiff(a,angTo(e.x,e.y,p.x,p.y)))<0.24+Math.atan2(p.r,Math.max(d,1)); }
defineFoe('n_lampmoth',{name:'Lamp Moth',r:16,hp:40,speed:0,dmg:0,value:20,kbRes:0,dcol:'200,180,120',
  init(e,opt){ e.n4base=opt&&opt.face!=null?opt.face:e.face; e.n4sweep=opt&&opt.sweep?opt.sweep:Math.PI/2; e.n4beam=e.n4base; e.n4drop=0; e.n4alarm=0; e.z=34; e.leash=99999; e.aggro=false; },
  idle(e,dt){ FOES.n_lampmoth.ai(e,dt,player); },
  ai(e,dt,p){ e.dx=e.dy=0; e.vx=e.vy=0;
    if(e.n4drop>0){ e.n4drop-=dt; e.state='dropped'; e.z=Math.max(0,(e.z||0)-dt*160); if(e.n4drop<=0){ e.state='perch'; e.lampOut=false; n4fPuff(e.x,e.y-20,'230,210,150',10); } return; }
    e.state=e.n4alarm>0?'alarm':'perch'; e.z=lerp(e.z||0,34,Math.min(1,dt*3)); e.n4beam=n4fLampBeam(e); e.face=e.n4beam; e.n4alarm=Math.max(0,e.n4alarm-dt);
    if(e.n4alarm<=0&&!e.lampOut&&n4fLampSees(e)){ e.n4alarm=10; SFX.play('warn'); ftext(e.x,e.y-70,S('ALARM!','ALARM!'),'#ffd27a',17); n4fEv('alarm');
      n4fTip('lamp',S('Lamp moths','Lamp moths'),S('Stay out of the lamp beams, or Shadow Dash through them. An arrow, the whip or the Glaive pops the lamp.','Keep out of the beams! Pop the lamp with an arrow.'));
      for(let i=0;i<3;i++){ const s=spotNear(p.x,p.y,90,190); spawnRune('n_shade',s.x,s.y,{level:e.level,aggro:true},0.7+i*0.15); } } },
  onHurt(e,amt,o){ const h=foeHit(e,o), s=h.src;
    if(e.n4drop>0) return Math.max(amt,e.maxHp*0.55);
    if(s==='arrow'||s==='boomerang'||s==='proj'||s==='whip'||s==='glaive'){ e.n4drop=3; e.lampOut=true; e.state='dropped'; SFX.play('pop'); n4fTxt(e,S('Pop! The lamp goes out!','Pop!'),'#ffe8a0',15); emit(e.x,e.y-40,16,{col:'255,230,160',smin:40,smax:160,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); n4fEv('lamppop'); return false; }
    if(!(e._n4hiT>G.time)){ e._n4hiT=G.time+3; n4fTxt(e,S('Too high! An arrow, the whip or the Glaive pops its lamp.','Too high! Shoot the lamp!'),'#ffe8a0',12); } return false; },
  draw3d:(e,fl)=>n4fLampFig(e,fl), draw2d:(e,fl)=>n4fLamp2(e,fl),
  sheet:[{state:'perch',label:'perched'},{state:'alarm',n4alarm:1,label:'alarm'},{state:'dropped',n4drop:2,lampOut:true,z:0,label:'lamp popped'}]});
function n4fLampFig(e,fl){
  const t=e.t||0, k=1.15, fx=e.x, fy=e.y+8, face=t3Turn(e,e.n4beam!=null?e.n4beam:e.face,10), z=e.z||0, drop=e.state==='dropped', al=e.state==='alarm';
  // the glass post
  foBegin(fx,fy,0,k,false,0); foY(0,0,0,7,5,Math.max(4,z-2),'#2a2240','#4a3e6e'); foY(0,0,0,10,9,3,'#1c162e'); foEnd(10);
  const flap=Math.sin(t*(al?16:4))*(drop?0.1:1);
  foBegin(fx,fy,face,k,fl,z+(drop?0:Math.sin(t*2)*1.5));
  for(const sd of [-1,1]){ c1Wing(sd,2,sd*3,10,22,14,0.5+flap*0.25+(drop?-0.4:0),3,'#3e3060','#221a3a',4,'#e8d8ff'); }
  foE(-3,0,10,8,4,4,fl?'#ffffff':'#2a1e44'); foB(5,0,11,4.2,fl?'#ffffff':'#2a1e44');
  for(const sd of [-1,1]){ foD(8.4,sd*2,12,1.3,'#f6f0ff',0.05); foN(7,sd*1.4,14,10,sd*5,19,0.5,'#8a72c8',0.04); }
  // the lamp it holds out in front (warm; red in an alarm; dark once popped)
  foN(7,0,9,13,0,8,0.8,'#8a7a5a',0.03);
  if(!e.lampOut){ foB(14,0,6,3.4,al?'#ff8a6a':'#ffe8a0'); foGlow(14,0,6,16,al?'255,120,90':'255,230,160',0.8,false); }
  else foB(14,0,6,3,'#4a4050');
  foEnd(12); e._t3top=foTop(fy,24,k,z);
}
function n4fLamp2(e,fl){ const x=e.x, y=e.y, z=e.z||0; ctx.save(); ctx.fillStyle='#2a2240'; ctx.fillRect(x-5,y-z,10,z); ctx.translate(x,y-z-10); ctx.rotate((e.n4beam||e.face)+Math.PI/2);
  ctx.fillStyle=fl?'#fff':'#3e3060'; ctx.strokeStyle='#120a20'; ctx.lineWidth=1.4; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(s*14,4,14,9,s*0.3,0,TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle=fl?'#fff':'#2a1e44'; ctx.beginPath(); ctx.ellipse(0,2,5,11,0,0,TAU); ctx.fill(); ctx.stroke(); if(!e.lampOut){ ctx.fillStyle=e.state==='alarm'?'#ff8a6a':'#ffe8a0'; ctx.beginPath(); ctx.arc(0,-14,4,0,TAU); ctx.fill(); } ctx.restore(); }
// the beams, on the ground under everything (a soft cone that sweeps; it flashes red in an alarm)
function n4fLampBeams(){ for(const e of G.enemies){ if(e.dead||e.type!=='n_lampmoth'||e.lampOut||!inView(e.x,e.y,300)) continue;
    const a=e.n4beam, al=e.n4alarm>0; ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(a); ctx.globalCompositeOperation='lighter';
    const gr=ctx.createLinearGradient(0,0,260,0); gr.addColorStop(0,al?'rgba(255,120,90,.5)':'rgba(255,236,170,.42)'); gr.addColorStop(1,'rgba(255,236,170,0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,260,-0.24,0.24); ctx.closePath(); ctx.fill(); ctx.restore(); } }
{ const base=drawPools; drawPools=function(){ base(); try{ if(!AREA||!AREA.cave) n4fLampBeams(); }catch(err){ console.error(err); } }; }

// ================= 3. the five fights: lifecycle, the arena dressing hooks, Pip's cues and the allies who fight beside Ash
// N4FM[siteKey] = {start(e), tick(dt,e), reset(), win(), ground(t), tall(list), air()}: each fight module fills its own.
const N4FM={};
// the fight begins (the walls rise); the boss is still a spawn rune for 1.5 s
function n4fFightStart(k){
  N4F.fight={k,t:0,type:N4FSITE[k],boss:null}; N4F.spark.used=false; N4F.ward=0; N4F.big=false; N4F.heartfire=false; N4F.cue=null; N4F.dmg0=N4F.dmg;
  N4F.allies=n4fS()?[]:n4fAlliesFor(k);   // x4_story runs the friends when it is in the build; these are its stand-ins
  const M=N4FM[k]; if(M&&M.begin) try{ M.begin(); }catch(err){ console.error(err); }
}
// the boss has spawned (its init): story hook
function n4fBossIn(e){ const F=N4F.fight; if(F&&N4FSITE[F.k]===e.type){ F.boss=e; } n4fHook('fightStart',F?F.k:null,e); }
// Ash fell (the stock reset): the walls drop, every moving part goes away, the next try starts clean
function n4fFightReset(k){
  const M=N4FM[k]; if(M&&M.reset) try{ M.reset(); }catch(err){ console.error(err); }
  const t=N4FSITE[k]; if(t&&G&&G.flags) G.flags['n4f_try_'+t]=1;
  if(!N4F.fight||N4F.fight.k===k){ N4F.fight=null; N4F.allies=[]; N4F.cue=null; N4F.heartfire=false; N4F.big=false; } n4fHook('reset',k);
}
// a win (after the outro): the fight module tidies up, then the story's hook, else the stage moves on by itself
const N4F_NEXT={n_echo1:['n_stair','n_clocks',['Finale · The Second Ring','The Clockstop Cliffs']],n_echo2:['n_clocks','n_rime',['Finale · The Third Ring','The Rime Spiral']],
  n_echo3:['n_rime','n_glass',['Finale · The Fourth Ring','The Moonglass Crown']],n_echo4:['n_glass','n_crown',['Finale · The Summit','The Moon Road']]};
function n4fWon(k){
  const M=N4FM[k]; if(M&&M.win) try{ M.win(); }catch(err){ console.error(err); }
  if(!N4F.fight||N4F.fight.k===k){ N4F.fight=null; N4F.allies=[]; N4F.cue=null; }
  const t=N4FSITE[k]; if(t){ G.flags[t+'_won']=1; const n=N4FK[t]; if(n<5) G.flags['n_echo'+n+'_done']=1; }
  if(typeof N4F.hook.won==='function'){ n4fHook('won',k); return; }
  const N=N4F_NEXT[k]; if(N&&G.stage===N[0]&&typeof STAGEDEF!=='undefined'&&STAGEDEF[N[1]]) try{ setStage(N[1],N[2]); }catch(err){ console.error(err); }
}
// every frame (after the foes moved)
{ const base=updateEnemies; updateEnemies=function(dt){ base(dt); try{ n4fFrame(dt); }catch(err){ console.error('n4f frame',err); } }; }
function n4fFrame(dt){
  const F=N4F.fight; if(!F) return;
  if(!G.bf||!G.fightSite||G.fightSite!==F.k){ if(!G.fightIntro&&!(G.boss&&!G.boss.dead)) { N4F.fight=null; N4F.allies=[]; } return; }
  F.t+=dt; const e=G.boss&&!G.boss.dead&&G.boss.type===F.type?G.boss:null;
  const M=N4FM[F.k]; if(M&&M.tick) M.tick(dt,e);
  if(e&&!player.dead) n4fAlliesTick(dt,e,F.k);
}
{ const base=newRun; newRun=function(mode){ base(mode); for(const k in N4FM){ const M=N4FM[k]; if(M.reset) try{ M.reset(); }catch(err){} } N4F.fight=null; N4F.allies=[]; N4F.cue=null; N4F.heartfire=false; N4F.big=false; N4F.fall=null; N4F.moonFill=0; N4F.dth={}; }; }
// drawing: ground marks under everyone, standing pieces in the y-sorted list, flyers over everything
{ const base=drawPools; drawPools=function(){ base(); const F=N4F.fight; if(!F||AREA) return; const M=N4FM[F.k]; if(M&&M.ground) try{ M.ground(G.time); }catch(err){ console.error(err); } }; }
{ const base=eventsForRender; eventsForRender=function(list){ base(list); if(AREA) return; const F=N4F.fight; if(F){ const M=N4FM[F.k]; if(M&&M.tall) try{ M.tall(list); }catch(err){ console.error(err); } n4fAlliesTall(list); } n4fFallTall(list); }; }
{ const base=drawAirborneHook; drawAirborneHook=function(){ base(); if(AREA) return; const F=N4F.fight; if(!F) return; const M=N4FM[F.k]; if(M&&M.air) try{ M.air(); }catch(err){ console.error(err); } n4fAlliesAir(); }; }
// Pip: in every fight Pip flies to the thing that matters next and chirps over it (FINALE 8.2, "listen to Pip")
{ const base=pipExtras; pipExtras=function(q,dt,tgt){ const c=N4F.fight&&N4F.cue; if(c&&!tgt){ if(Math.random()<dt*0.6) emit(q.x,q.y-12,2,{col:'255,220,140',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1,zmax:2}); return {x:c.x,y:c.y-30}; } return base(q,dt,tgt); }; }
// the big pulsing arrow on Easy after two falls in the same part of the fight (FINALE 8.6)
function n4fArrowOn(){ const F=N4F.fight; if(!F||!n4fEasy()) return false; const key=F.k+':'+(F.boss&&F.boss.nPhase||F.boss&&F.boss.bph||0); return (N4F.dth[key]||0)>=2; }
function n4fDrawCue(){ const c=N4F.cue; if(!c||!N4F.fight) return; const big=n4fArrowOn(), t=G.time, b=Math.sin(t*6)*(big?10:5), s=big?1.8:1;
  ctx.save(); ctx.globalAlpha=big?0.95:0.75; ctx.fillStyle='#ffe08a'; ctx.strokeStyle='#3b2233'; ctx.lineWidth=2.5*s; const y=c.y-70-b;
  ctx.beginPath(); ctx.moveTo(c.x,y+18*s); ctx.lineTo(c.x-12*s,y); ctx.lineTo(c.x-5*s,y); ctx.lineTo(c.x-5*s,y-14*s); ctx.lineTo(c.x+5*s,y-14*s); ctx.lineTo(c.x+5*s,y); ctx.lineTo(c.x+12*s,y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
{ const base=drawMarkers; drawMarkers=function(t){ base(t); if(!AREA&&N4F.fight&&N4F.cue&&(n4fArrowOn()||N4F.cue.arrow)) n4fDrawCue(); }; }
// Ash fell in a fight: count it per part of the fight (the Easy arrow)
{ const base=playerDied; playerDied=function(){ const F=N4F.fight; if(F){ const e=F.boss, key=F.k+':'+(e&&(e.nPhase||e.bph)||0); N4F.dth[key]=(N4F.dth[key]||0)+1; } return base(); }; }
// flight in the fights that need it (Echo of the Ice Dragon's air phase, Nyxara's Moon's Ring): only then
{ const base=canFlyHere; canFlyHere=function(){ const F=N4F.fight; if(F&&G.mode==='story'&&!AREA&&hasAbil('wings')&&G.boss&&!G.boss.dead&&F.fly) return true; return base.apply(this,arguments); }; }

// ================= the allies in the fights (FINALE 7): who joins, what they do, how they look
// Earned across the game (THREADS 10; nAllies() in e7b_threads). Each one fights in the fight of its own act and in the
// last one. They cannot be hurt and never solve a mechanic for Ash; they only make mistakes cheaper.
const N4F_ALLY_AT={n_echo1:['greymane','cinder'],n_echo2:['vesper'],n_echo3:['glaciar'],n_echo4:['hush'],n_summit:['greymane','cinder','tikka','vesper','glaciar','hush']};
function n4fAllyHas(id){ if(typeof nAllies==='function'){ try{ return nAllies().includes(id); }catch(e){} }
  const C=G.choices||{}; return id==='greymane'?C.greymane==='ally':id==='cinder'?C.cinder==='ally':id==='tikka'?(G.flags.tk_come==='yes'):id==='vesper'?C.c_vesper==='friend':id==='glaciar'?C.f_glaciar==='free':id==='hush'?C.m_hush==='free':false; }
function n4fAlliesFor(k){ const out=[], p=player, P=POI[k]||{x:p.x,y:p.y};
  for(const id of N4F_ALLY_AT[k]||[]){ if(!n4fAllyHas(id)) continue; const v=n4fHook('ally',id,k); if(v===false) continue;
    const a={id,x:p.x+rand(-60,60),y:p.y+rand(30,70),face:-Math.PI/2,t:rand(0,3),cd:rand(2,4),cd2:rand(3,6),dx:0,dy:0,z:0,state:'chase',r:13};
    if(id==='cinder'){ a.post=k==='n_summit'?{x:4500,y:85840}:{x:4500,y:81260}; a.x=a.post.x; a.y=a.post.y; a.cd=3.2; }
    if(id==='glaciar'){ a.r=60; a.r0=60; a.mode='air'; a.z=150; a.orb=rand(0,TAU); a.x=P.x; a.y=P.y-300; }
    if(id==='hush'){ a.r=42; a.z=k==='n_echo4'?40:120; a.orb=rand(0,TAU); }
    if(id==='tikka'){ a.r=9; a.cd=6; a.cd2=2.5; }
    out.push(a); }
  return out; }
function n4fAlly(id){ return N4F.allies.find(a=>a.id===id)||null; }
// a walker: follows Ash a little behind, or runs to a spot; stays inside the fight's walls
function n4fAllyWalk(a,dt,tx,ty,sp){ const d=dist(a.x,a.y,tx,ty); if(d>16){ const ang=angTo(a.x,a.y,tx,ty); a.face=turnTo(a.face,ang,8*dt); const s=Math.min(sp,d*4); a.dx=Math.cos(a.face)*s; a.dy=Math.sin(a.face)*s; a.x+=a.dx*dt; a.y+=a.dy*dt; } else { a.dx=a.dy=0; }
  const b=G.bf; if(b&&b.A&&b.A.on) arenaHold(b.A,a,40); }
function n4fAlliesTick(dt,e,k){
  const p=player;
  for(const a of N4F.allies){ a.t+=dt; a.cd-=dt; a.cd2-=dt; const T=N4F_ALLYK[a.id]; if(T) T(a,dt,e,k); }
}
// the ally moves, fight by fight (e is the boss)
const N4F_ALLYK={
  greymane(a,dt,e,k){ const p=player, open=e.n4open||(k!=='n_summit'&&!e.invuln&&!(e.z>40)&&!(e.alt>30));
    if(k==='n_summit'&&e.nPhase===1&&a.cd2<=0){ a.cd2=20; a.howlT=4; SFX.play('howl'); n4fTxt(a,S('AWOOO!','AWOO!'),'#e8f0ff',14); for(const q of G.enemies) if(!q.dead&&q.type==='n_mothling') q.n4slowT=4; }
    if(a.howlT>0) a.howlT-=dt;
    const gap=k==='n_summit'?6:7;
    if(open&&a.cd<=0){ n4fAllyWalk(a,dt,e.x+Math.cos(a.t)*e.r*0.8,e.y+Math.sin(a.t)*e.r*0.5,420); if(dist(a.x,a.y,e.x,e.y)<e.r+50){ a.cd=gap; a.bite=0.4; if(!e.invuln&&!e.dead){ damageEnemy(e,e.maxHp*0.03,{src:'comp',fx:a.x,fy:a.y}); SFX.play('slash3'); shake(4); emit(e.x,e.y-20,12,{col:'230,240,250',smin:60,smax:180,lmin:.3,lmax:.6,zmin:2,zmax:4}); n4fEv('greybite'); } } }
    else n4fAllyWalk(a,dt,p.x-60*Math.cos(a.t*0.3),p.y+50,300);
    if(a.bite>0) a.bite-=dt; },
  cinder(a,dt,e,k){ a.face=-Math.PI/2; a.dx=a.dy=0; if(a.post){ a.x=lerp(a.x,a.post.x,Math.min(1,dt*3)); a.y=lerp(a.y,a.post.y,Math.min(1,dt*3)); }
    if(a.cd<=0){ a.cd=3.2; const want=k==='n_summit'?'n_mothling':'n_shade'; let best=null, bd=1e9; for(const q of G.enemies){ if(q.dead||q.type!==want) continue; const d=dist(q.x,q.y,a.x,a.y); if(d<bd){ bd=d; best=q; } }
      if(best){ a.slash=0.35; emit(best.x,best.y-10,12,{col:'255,210,140',smin:60,smax:180,lmin:.2,lmax:.45,zmin:2,zmax:4}); damageEnemy(best,best.hp+10,{src:'comp'}); n4fEv('cinderkill');
        if(Math.random()<0.3) taunt('cinder',pick([S('None shall pass!','Nobody passes!'),S('Not while I stand!','Not while I stand!'),S('Ha! Too slow, little shadow!','Too slow!')])); } }
    if(a.slash>0) a.slash-=dt; },
  vesper(a,dt,e,k){ const p=player; n4fAllyWalk(a,dt,p.x+Math.cos(a.t*0.5)*90,p.y+Math.sin(a.t*0.5)*60,320); a.state=Math.hypot(a.dx,a.dy)>20?'chase':'chase';
    if(k==='n_echo2'&&a.cd<=0){ a.cd=6; const L=G.enemies.filter(q=>!q.dead&&q.type==='n_echo_vclone'); if(L.length){ const c=pick(L); a.throwT=0.35; later(0.3,()=>{ if(!c.dead) n4fVClonePop(c,S('Vesper popped a fake!','Vesper got one!')); }); }
      if(!e.dead){ e.n4mark=2.2; taunt('c_vesper',pick([S('That one! The one that does not flicker!','That one is real!'),S('Elbow out. That is her. That is ME.','That one! Elbow out!')])); } } }
  ,
  glaciar(a,dt,e,k){ a.orb+=dt*0.35; const C=G.bf&&G.bf.A?{x:G.bf.A.cx,y:G.bf.A.cy,R:arenaR(G.bf.A)}:{x:e.x,y:e.y,R:400}; const tx=C.x+Math.cos(a.orb)*(C.R+120), ty=C.y+Math.sin(a.orb)*(C.R+60)*0.8;
    a.dx=(tx-a.x)*1.5; a.dy=(ty-a.y)*1.5; a.x+=a.dx*dt; a.y+=a.dy*dt; a.face=Math.atan2(a.dy,a.dx); a.z=150; a.state='chase'; a.mode='air';
    if(k==='n_echo3'&&a.cd<=0){ a.cd=15; N4F.calmT=5; taunt('f_glaciar',pick([S('Enough snow, me! Calm down!','Calm down, me!'),S('Hush, you dreary thing.','Hush, gloomy me.')])); n4fEv('glacalm'); } },
  hush(a,dt,e,k){ a.orb+=dt*0.4; const C=G.bf&&G.bf.A?{x:G.bf.A.cx,y:G.bf.A.cy,R:arenaR(G.bf.A)}:{x:e.x,y:e.y,R:300};
    let tx=C.x+Math.cos(a.orb)*C.R*0.75, ty=C.y+Math.sin(a.orb)*C.R*0.5; if(a.perch){ tx=a.perch.x; ty=a.perch.y; }
    a.x=lerp(a.x,tx,Math.min(1,dt*1.2)); a.y=lerp(a.y,ty,Math.min(1,dt*1.2)); a.face=angTo(a.x,a.y,e.x,e.y); a.state=k==='n_echo4'?'fold':'chase'; a.z=lerp(a.z,a.perch?60:(k==='n_echo4'?50:110),Math.min(1,dt*2)); },
  tikka(a,dt,e,k){ const p=player; n4fAllyWalk(a,dt,p.x-50,p.y+40,280); a.state=Math.hypot(a.dx,a.dy)>20?'chase':'chase';
    if(a.cd<=0){ a.cd=11; if(dist(p.x,p.y,a.x,a.y)<420&&p.hp<p.maxHp){ const h=Math.round(p.maxHp*0.15*((G.diff&&G.diff.heal)||1)); p.hp=Math.min(p.maxHp,p.hp+h); ftext(p.x,p.y-40,S('A lumpy bun! +','Bun! +')+h,'#9cf08a',15); SFX.play('ui'); a.throwT=0.4; n4fEv('bun'); if(Math.random()<0.4) taunt('ev_tikka',pick([S('Eat it! It is only a little burnt!','Eat it!'),S('BUN!','BUN!')])); } }
    if(a.cd2<=0){ a.cd2=2.5; let best=null, bd=260; for(const q of G.enemies){ if(q.dead||q.boss||(q.type!=='n_mothling'&&q.type!=='n_shade')) continue; const d=dist(q.x,q.y,a.x,a.y); if(d<bd){ bd=d; best=q; } }
      if(best){ a.bonk=0.3; damageEnemy(best,best.hp+5,{src:'comp'}); ftext(best.x,best.y-20,S('BONK!','BONK!'),'#ffe066',13); } }
    if(a.throwT>0) a.throwT-=dt; if(a.bonk>0) a.bonk-=dt; }
};
// the mothlings Greymane howled at are slow for a while
{ const base=updateEnemies; updateEnemies=function(dt){ for(const q of G.enemies){ if(q.n4slowT>0&&!q.dead){ q.n4slowT-=dt; if(!q.n4sp0) q.n4sp0=q.speed; q.speed=q.n4sp0*0.5; if(q.n4slowT<=0){ q.speed=q.n4sp0; q.n4sp0=0; } } } base(dt); }; }
// how they look (their own figures from the acts they come from)
function n4fAlliesTall(list){ for(const a of N4F.allies){ if(a.id==='glaciar'||a.id==='hush') continue; if(!inView(a.x,a.y,80)) continue; if(!a.it) a.it={x:0,y:0,draw:()=>n4fAllyDraw(a)}; a.it.x=a.x; a.it.y=a.y; list.push(a.it); } }
function n4fAlliesAir(){ for(const a of N4F.allies){ if(a.id!=='glaciar'&&a.id!=='hush') continue; if(!inView(a.x,a.y-(a.z||0),260)) continue; n4fAllyDraw(a); } }
function n4fAllyDraw(a){
  try{
    if(a.id==='greymane'){ if(T3.on&&T3A.grey){ a.cd=Math.max(0,a.cd); T3A.grey(a); } else drawWolf(Object.assign({r:24,state:'chase',st:0,face:a.face,t:a.t,dx:a.dx,dy:a.dy,flash:0,alpha:1},{x:a.x,y:a.y}),false,1.9,true,true); }
    else if(a.id==='cinder'){ ctx.save(); ctx.globalAlpha*=0.78; if(T3.on&&T3A.cinder) T3A.cinder(a); else drawKnight(Object.assign({r:27,state:'chase',blocking:true,swung:a.slash>0?0.3:0,face:a.face,t:a.t,x:a.x,y:a.y,dx:0,dy:0},{}),1.3,false,true); ctx.restore(); glowAt(a.x,a.y-30,60,'255,190,120',0.18); }
    else if(a.id==='vesper'){ a.r0=13; a.clone=false; a.dead=false; a.state=a.throwT>0?'throw':'chase'; if(a.throwT>0) a.throwT-=1/60; if(T3.on&&typeof c1FigVesper==='function') c1FigVesper(a,false); else if(typeof c1Vesper2==='function') c1Vesper2(a,false); }
    else if(a.id==='tikka'){ const e=a._f||(a._f={type:'kobold',r:9,state:'chase',st:0,stun:0,hp:1,maxHp:1,swung:0,flash:0,alpha:1}); Object.assign(e,{x:a.x,y:a.y,face:a.face,t:a.t,dx:a.dx,dy:a.dy,state:a.bonk>0?'strike':'chase'});
      if(T3.on) foKobold(e,false,0); else drawKobold(e,0.8,false,false);
      if(a.throwT>0){ const p=player, u=1-a.throwT/0.4; ctx.fillStyle='#e8b070'; ctx.strokeStyle='#3b2233'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(lerp(a.x,p.x,u),lerp(a.y,p.y,u)-30-Math.sin(u*Math.PI)*40,5,0,TAU); ctx.fill(); ctx.stroke(); } }
    else if(a.id==='glaciar'){ if(T3.on&&typeof f2FigGlaciar==='function') f2FigGlaciar(a,false); else if(typeof f2Glaciar2==='function') f2Glaciar2(a,false); }
    else if(a.id==='hush'){ a.shadow=false; if(T3.on&&typeof M3HUSH!=='undefined') M3HUSH.draw3d(a,false); else if(typeof M3HUSH!=='undefined') M3HUSH.draw2d(a,false); glowAt(a.x,a.y-(a.z||0)-20,90,'255,245,225',0.18); }
  }catch(err){ if(!N4F.allyErr){ N4F.allyErr=1; console.error('n4f ally draw',a.id,err); } }
}

// ================= 4. Echo of the First Flame (site n_echo1, type n_echo_vor), the Shadow Throne (FINALE 6.1)
// Vorlaxis's own Waking brain (x0_vorlaxis vorP1: tail sweep, breath sweep, stomp rings, fireball fans) on a shadow
// copy at 45 percent of his health at level 21, one phase fewer (no sky, no crust). Below half: double stomp rings and
// two shades summoned now and then. His breath leaves ink puddles; his fireballs are black with violet cores.
// Twist, the Dark Braziers: four braziers, each reached with an Act I move (B1 on the floor: breathe; B2 on a step
// pillar: Double Jump up; B3 on an islet in a moonwater moat: Water Stride; B4 on a ledge past an ink gap: jump). While
// two or more burn the echo is solid; with fewer it fades to see-through: it takes x0.3 and hits x1.2, and it cannot be
// finished. Every 14 s (Easy 20, Hard 10) it turns and snuffs the nearest lit brazier with a wing gust (a cone from its
// head toward the brazier; standing in it pushes Ash 200 px).
const N4V={C:{x:4500,y:81500},br:[]};
function n4vBraziers(){ return [
  {id:'b1',x:4280,y:81650,need:null},
  {id:'b2',x:4720,y:81650,need:'pillar',lvl:3,sx:4720,sy:81650,sr:56},
  {id:'b3',x:4250,y:81330,need:'islet',sx:4250,sy:81330,sr:62},
  {id:'b4',x:4750,y:81330,need:'ledge',sx:4750,sy:81330,sr:66}].map(b=>Object.assign(b,{lit:false,heat:0,litAt:-99,snuff:0})); }
N4V.br=n4vBraziers();
// can Ash light this one from where he stands? (B1 anywhere; the others only from on top of their spot)
function n4vCanLight(b){ const p=player; if(!b.need) return true; if(dist(p.x,p.y,b.sx,b.sy)>b.sr) return false; if(b.need==='pillar') return n4fLvl()>=3||(p.z||0)>34; return true; }
function n4vLitN(){ let n=0; for(const b of N4V.br) if(b.lit) n++; return n; }
function n4vSolid(){ return n4vLitN()>=2; }
function n4vTick(dt,e){
  const p=player;
  for(const b of N4V.br){ if(b.snuff>0) b.snuff-=dt;
    if(!b.lit){ const fire=n4fFireAt(b.x,b.y-20,16); if(fire&&n4vCanLight(b)){ b.heat+=dt; if(Math.random()<dt*20) emit(b.x,b.y-24,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.3,lmax:.5,zmin:2,zmax:4}); if(b.heat>=0.3){ b.lit=true; b.heat=0; b.litAt=G.time; SFX.play('cast'); n4fEv('brazier'); emit(b.x,b.y-26,20,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:40,smax:140,lmin:.3,lmax:.7,zmin:2,zmax:5});
          if(n4vLitN()===2){ ftext(e?e.x:b.x,(e?e.y-120:b.y-60),S('Two braziers burn! The echo is solid!','It is solid now! Hit it!'),'#ffe08a',16); } } }
      else if(fire&&!n4vCanLight(b)&&!(b.nag>G.time)){ b.nag=G.time+3; ftext(b.x,b.y-60,b.need==='pillar'?S('Too high. Double Jump up onto the pillar!','Double Jump up!'):b.need==='islet'?S('Too far. Walk out over the water to it!','Walk on the water to it!'):S('Too far. Jump the ink gap!','Jump over the ink!'),'#ffe0b0',13); }
      else if(b.heat>0) b.heat=Math.max(0,b.heat-dt); } }
  // the echo is solid only while two burn (a soft fade between the two)
  if(e){ const s=n4vSolid(); e.n4ghost=lerp(e.n4ghost==null?1:e.n4ghost,s?0:1,Math.min(1,dt*4)); e.n4solid=s; e.edK=e.n4edK*(s?1:1.2);
    // Pip hovers over the nearest dark brazier
    let best=null, bd=1e9; for(const b of N4V.br){ if(b.lit) continue; const d=dist(p.x,p.y,b.x,b.y); if(d<bd){ bd=d; best=b; } } N4F.cue=best?{x:best.x,y:best.y-30}:null;
    if(!s&&!N4F.said.vghost&&e.hp<e.maxHp*0.97){ N4F.said.vghost=1; n4fTip('vghost',S('The Dark Braziers','The Dark Braziers'),S('The echo is a see-through shadow. Light two braziers and it turns solid: then your hits really land.','Light two braziers! Then hit it.')); } }
}
// the brain: Vorlaxis's Waking moves, wrapped (his health is shown to it as full, so it never takes to the sky)
function n4vAI(e,dt,p){
  const d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.tideCd=99; e.sumCd-=dt; e.pullCd-=dt; if(e.tailFx>0) e.tailFx=Math.max(0,e.tailFx-dt*2.5);
  e.mouthGlow=Math.max(0,e.mouthGlow-dt*2); e.chest=Math.max(0,e.chest-dt*2);
  const relT=e.state==='breath'?0:clamp(angDiff(e.face,a),-0.75,0.75); e.headRel=lerp(e.headRel||0,relT,1-Math.exp(-dt*5)); e.dx=0; e.dy=0;
  n4fFlecks(e,dt,1.6);
  if(n4vGust(e,dt,p)){ updateHeadPos(e); return; }
  // below half: two shades now and then (Cindervane holds the steps if he came)
  if(e.bph>=1&&e.sumCd<=0&&e.state==='walk'){ e.sumCd=byDiff(14,11,9); if(countType('n_shade')<4){ for(let i=0;i<2;i++){ const s=spotNear(e.x,e.y,120,220); spawnRune('n_shade',s.x,s.y,{aggro:true},0.6+i*0.2); } n4fSay(e,'n_echo_vor',S('Rise, little shadows.','Rise, shadows.'),9); } }
  const s0=e.state, n0=G.projectiles.length, hp=e.hp; e.hp=e.maxHp;
  try{ vorP1(e,dt,p,d,a); } finally{ e.hp=hp; }
  // black fireballs with violet cores (the fan he just threw)
  for(let i=n0;i<G.projectiles.length;i++){ const q=G.projectiles[i]; if(q.owner==='enemy'&&q.kind==='fireball') q.kind='orb'; }
  // phase 2: always two stomp rings (Normal and Hard already had them)
  if(s0==='stompW'&&e.state!=='stompW'&&e.bph>=1&&!vk('stomp2')) G.rings.push({x:e.x,y:e.y,rad:e.r,max:560,speed:330,thick:22,dmg:ed(15),delay:0.45});
  // the breath leaves ink puddles, not fire
  if(e.state==='breath'){ e.n4pT=(e.n4pT||0)-dt; if(e.n4pT<=0){ e.n4pT=0.38; updateHeadPos(e); const ang=e.face+(e.headRel||0), L=rand(130,360), x=e.mouthX+Math.cos(ang)*L, y=e.mouthY+Math.sin(ang)*L; if(dist(x,y,N4V.C.x,N4V.C.y)<340) fzAdd('n4fink',{x,y,r:40,life:6,dmg:n4fDmg(e,4)}); } }
  updateHeadPos(e);
}
// the wing gust that snuffs a brazier: a cone telegraph from its head toward the brazier, then the gust
function n4vGust(e,dt,p){
  if(e.n4g){ const g=e.n4g; g.t+=dt; e.state='breathW'; e.mouthGlow=0.4; e.face=turnTo(e.face,angTo(e.x,e.y,g.b.x,g.b.y),4*dt);
    if(g.t>=g.dur){ updateHeadPos(e); const ang=angTo(e.headX,e.headY,g.b.x,g.b.y);
      if(!p.dead&&!n4fUp()&&dist(e.headX,e.headY,p.x,p.y)<g.len+p.r&&Math.abs(angDiff(ang,angTo(e.headX,e.headY,p.x,p.y)))<0.42){ p.kvx+=Math.cos(ang)*900; p.kvy+=Math.sin(ang)*900; ftext(p.x,p.y-40,S('Whoosh!','Whoosh!'),'#e0d0ff',14); }
      g.b.lit=false; g.b.snuff=1; n4fPuff(g.b.x,g.b.y-26,'60,40,90',22); SFX.play('whoosh'); shake(4); n4fEv('gust');
      for(let i=0;i<24;i++){ const u=Math.random(); emit(lerp(e.headX,g.b.x,u),lerp(e.headY,g.b.y,u),1,{col:'180,150,240',glow:false,ang,spread:0.3,smin:200,smax:400,lmin:.2,lmax:.4,zmin:1.5,zmax:3,drag:2}); }
      e.n4g=null; toRecover(e,0.6); e.n4gT=byDiff(20,14,10); }
    return true; }
  e.n4gT=(e.n4gT==null?byDiff(20,14,10):e.n4gT)-dt*foeDiff().atk;
  if(e.n4gT<=0&&(e.state==='walk'||e.state==='recover')){ let best=null, bd=1e9; for(const b of N4V.br){ if(!b.lit) continue; const d=dist(e.x,e.y,b.x,b.y); if(d<bd){ bd=d; best=b; } }
    if(!best){ e.n4gT=2; return false; }
    updateHeadPos(e); const len=dist(e.headX,e.headY,best.x,best.y)+40, dur=n4fTele(1.0); e.n4g={b:best,t:0,dur,len}; e.tele=null; e.state='breathW';
    n4fMark({shape:'cone',x:e.headX,y:e.headY,ang:angTo(e.headX,e.headY,best.x,best.y),len,half:0.42,dur,col:'200,170,255',owner:e,follow:()=>{ updateHeadPos(e); return {x:e.headX,y:e.headY,ang:angTo(e.headX,e.headY,best.x,best.y)}; }});
    n4fSay(e,'n_echo_vor',pick([S('Your little lights mean nothing here.','Your lights mean nothing.'),S('Darkness suits this throne.','Dark is better.')]),8); return true; }
  return false;
}
defineFoe('n_echo_vor',{boss:true,name:'Echo of the First Flame',title:S('A shadow of Vorlaxis','A shadow of Grandpa'),short:'Echo of the First Flame',
  lv:21,hp:21000,r:56,speed:72,dmg:17,value:1000,kbRes:0,dcol:'80,50,140',phases:[0.5],
  phaseText:[[S('Shadow Rage!','Shadow Rage!'),S('Double stomp rings, and shades rise from the floor. Keep two braziers burning!','Two rings! Keep two braziers lit!'),['n_echo_vor',S('Burn black, hatchling. Like me.','Burn black, like me.')]]],
  init(e){ Object.assign(e,{phase:1,state:'walk',headRel:0,alt:0,scale:1,mouthGlow:0,tailFx:0,staggered:false,cd:1.8,st:0,stMax:1,tideCd:99,sumCd:6,pullCd:4,chest:0,n4ghost:1,n4solid:false});
    e.n4edK=(e.edK||1)*Math.pow(1.10,21-10); e.edK=e.n4edK; e.leash=99999; updateHeadPos(e); n4fBossIn(e); },
  ai:(e,dt,p)=>n4vAI(e,dt,p),
  onHurt(e,amt,o){ let a=amt; if(!e.n4solid){ a*=0.3; if(!(e._n4ghT>G.time)){ e._n4ghT=G.time+3.4; n4fTxt(e,S('Your hit passes through the shadow! Light two braziers!','It is a shadow! Light two braziers!'),'#e0d0ff',13); } }
    return n4fGate(e,a,o,e.bph>=1?0.004:0.5,e.n4solid,S('Light two braziers to make it solid!','Light two braziers!')); },
  onDeath(e){ for(let i=0;i<70;i++){ const a=rand(0,TAU), r=rand(0,80); emit(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*0.6-40,1,{col:Math.random()<0.5?'40,26,70':'170,130,240',glow:false,ang:-Math.PI/2+rand(-1,1),spread:0.6,smin:60,smax:220,lmin:.8,lmax:1.6,zmin:1.4,zmax:3,drag:0.8,rise:40}); } SFX.play('pop'); },
  draw3d:(e,fl)=>n4vDraw(e), draw2d:(e,fl)=>n4vDraw(e),
  sheet:[{state:'walk',label:'walk',headRel:0,alt:0,scale:1,mouthGlow:0,tailFx:0,phase:1},{state:'breathW',st:0.4,label:'breath / gust',headRel:0,alt:0,scale:1,mouthGlow:1,tailFx:0,phase:1},{state:'stompW',st:0.4,label:'stomp',headRel:0,alt:0,scale:1,mouthGlow:0,tailFx:0,phase:1},{state:'tailW',st:0.3,label:'tail sweep',headRel:0,alt:0,scale:1,mouthGlow:0,tailFx:1,phase:1}]});
function n4vDraw(e){ if(e.headX==null) updateHeadPos(e); const g=e.n4ghost||0; ctx.save(); ctx.globalAlpha*=1-0.55*g; n4fRim(e,150,0.2+0.15*(1-g));
  n4fSkin2(()=>drawVorlaxis(e)); ctx.restore(); }
// the head is a hit circle too (as for Vorlaxis)
{ const base=hitCircles; hitCircles=function(e){ if(e.type==='n_echo_vor'){ if(e.headX==null) updateHeadPos(e); const L=e._n4hc||(e._n4hc=[{},{}]); Object.assign(L[0],{x:e.x,y:e.y,r:e.r,m:1}); Object.assign(L[1],{x:e.headX,y:e.headY,r:27,m:e.staggered?2:1.4}); return L; } return base(e); }; }
// the braziers: obsidian bowls on short stands, dark until breathed on
function n4vDrawBrazier(b){ const x=b.x, y=b.y, lit=b.lit, t=G.time, onTop=b.need==='pillar'?48:0;
  const s=sbSprite('n4f_brazier',26,g=>{ g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0,20,16,5,0,0,TAU); g.fill(); g.fillStyle='#241a36'; g.fillRect(-4,0,8,20); g.fillStyle='#3a2c58'; g.beginPath(); g.moveTo(-15,-4); g.lineTo(15,-4); g.lineTo(10,6); g.lineTo(-10,6); g.closePath(); g.fill();
    g.fillStyle='#5a4a86'; g.fillRect(-15,-6,30,3); g.fillStyle='#ff8a4a'; g.globalAlpha=0.5; g.fillRect(-9,-5,18,1.5); g.globalAlpha=1; },1.6);
  drawSprite(s,x,y-14-onTop,1,0);
  if(lit){ const fy=y-34-onTop, f=0.8+0.2*Math.sin(t*14+x); glowAt(x,fy,60,'255,150,70',0.45); ctx.save(); ctx.globalCompositeOperation='lighter';
    const fl=(w,h,c)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(x-w,fy+8); ctx.quadraticCurveTo(x-w*1.1,fy-h*0.4,x+Math.sin(t*9+x)*w*0.4,fy-h); ctx.quadraticCurveTo(x+w*1.1,fy-h*0.4,x+w,fy+8); ctx.closePath(); ctx.fill(); };
    fl(11,26*f,'rgba(255,100,40,.75)'); fl(7,20*f,'rgba(255,180,70,.85)'); fl(3.5,12*f,'rgba(255,245,210,.95)'); ctx.restore(); }
  else { if(b.snuff>0){ ctx.save(); ctx.globalAlpha=b.snuff; ctx.fillStyle='rgba(120,100,140,.5)'; ctx.beginPath(); ctx.arc(x,y-40-onTop-(1-b.snuff)*20,8+(1-b.snuff)*10,0,TAU); ctx.fill(); ctx.restore(); }
    if(b.heat>0) glowAt(x,y-30-onTop,30,'255,150,70',b.heat*1.5); else glowAt(x,y-26-onTop,18,'150,110,230',0.18+0.08*Math.sin(t*2+x)); } }
N4FM.n_echo1={
  begin(){ for(const b of N4V.br){ b.lit=false; b.heat=0; b.snuff=0; } N4F.said.vghost=0; },
  tick(dt,e){ n4vTick(dt,e); },
  reset(){ for(const b of N4V.br){ b.lit=false; b.heat=0; } },
  win(){},
  tall(list){ for(const b of N4V.br){ if(!b.it) b.it={x:b.x,y:b.y+2,draw:()=>n4vDrawBrazier(b)}; list.push(b.it); } }
};
defineBoss('n_echo1',{boss:'n_echo_vor',at:{x:4500,y:81500,r:380,name:S('The Shadow Throne','The Shadow Throne'),level:21},stage:'n_stair',open:()=>n4fStageOK('n_stair'),
  arena:{shape:'ring',r:405,style:'n4glass',glow:'170,120,255'},flyOK:false,music:'n_echo',spawn:{dx:0,dy:-230},
  onStart(){ n4fFightStart('n_echo1'); }, onReset(){ n4fFightReset('n_echo1'); }, onWin(){ n4fWon('n_echo1'); }});
const N4V_END=()=>G.choices.ending||'hero';
const n4vIntro=()=>[
  n4fL('narr',`On a black glass throne sits a dragon made of shadow. It looks exactly like Grandpa. It even has his frown.`,`A shadow dragon sits on a throne. It looks like Grandpa.`),
  n4fL('n_echo_vor',`So. You are what Ember's line became. Small. Soft. Barely a spark.`,`So. You are Ember's child. Small. Barely a spark.`),
  n4fL('ash',`I heard you the first time, Grandpa. And I already won.`,`I heard you the first time. And I won.`,()=>N4V_END()==='hero'),
  n4fL('ash',`You're supposed to be asleep on the mountain. ...Oh. You're not him. You're a copy.`,`You should be asleep. Oh. You are just a copy.`,()=>N4V_END()==='warden'),
  n4fL('ash',`Small? I'm the dragon now. Sit.`,`Small? I am the dragon now. Sit!`,()=>N4V_END()==='heir'),
  n4fL('ash',`That's not my grandpa. My grandpa wipes his feet.`,`You are not my grandpa. My grandpa wipes his feet.`,()=>N4V_END()==='lantern'),
  n4fL('n_echo_vor',`Then come and take it from me, hatchling.`,`Then come and take it, little one.`),
  n4fL('ash',`Okay. Again.`,`Okay. Again!`),
  n4fL('cinder',`Halt! ...Oh. It is you, Emberblood. I said one last fight. It seems I miscounted.`,`Oh! It is you! I said one last fight. I counted wrong.`,()=>n4fAllyHas('cinder')),
  n4fL('ash',`Sir Cindervane! You came back!`,`Sir Cindervane! You came back!`,()=>n4fAllyHas('cinder')),
  n4fL('cinder',`Some knights do not know when to sit down. I hold the stairs. Go.`,`I will guard the stairs. Go!`,()=>n4fAllyHas('cinder')),
  n4fL('narr',`Greymane's hackles rise. He has met this dragon before, too.`,`Greymane growls. He knows this dragon.`,()=>n4fAllyHas('greymane'))];
n4vIntro.short=()=>[n4fL('n_echo_vor',`Back again, hatchling? The throne is still mine.`,`Back again? The throne is still mine.`),n4fL('ash',`Not for long. Braziers first, Ash.`,`Not for long! Light the braziers.`)];
n4fLines('n_echo_vor','n_echo1_intro','n_echo1_outro',n4vIntro,()=>[
  n4fL('narr',`The shadow dragon cracks like old glass and bursts into a cloud of moths.`,`The shadow dragon breaks into moths.`),
  n4fL('narr',`For a moment, one last memory hangs in the air. A voice, younger and sadder than any you ever heard him use.`,`A memory floats in the air. A sad voice.`),
  n4fL('n_memory',`...Ember? Is that you, up there with the lanterns?`,`Ember? Is that you with the lanterns?`),
  n4fL('ash',`Even the moon remembers you missing her, Grandpa.`,`The moon remembers you missed her, Grandpa.`),
  n4fL('ash',`I hope you found her.`,`I hope you found her.`,()=>N4V_END()==='hero'),
  n4fL('ash',`Goodnight, Grandpa. The real one.`,`Goodnight, real Grandpa.`,()=>N4V_END()==='warden'),
  n4fL('ash',`I'm telling the little one in the birdcage. He'll pretend he doesn't care. He'll care.`,`I will tell tiny Grandpa. He will care.`,()=>N4V_END()==='heir'),
  n4fL('ash',`I'm telling him the moon remembers. He'll pretend he doesn't care. He'll care.`,`I will tell Grandpa. He will care.`,()=>N4V_END()==='lantern'),
  n4fL('narr',`Up ahead, a column of silver air roars up the cliff. The Wind Chimney.`,`Up ahead, the wind roars up the cliff.`)]);

// ================= 5. Echo of the Moth Mask (site n_echo2, type n_echo_vesper), the Mask Hall (FINALE 6.2)
// Vesper's own moves (x1_foes VESPER_MOVES: the dash slash, the hook flurry, the moth bomb) on a shadow copy at 45
// percent of her health at level 22, one phase fewer. Twist, Clones and Balconies: she splits into 3 clones (Easy 2,
// Hard 4); clones flicker, the real one does not; a Shadow Dash through a clone pops it. The Chain Whip on the real one
// yanks her off her feet: stagger 3 s (Easy 4, Hard 2), the main window. Every 20 s she leaps up onto a balcony (a
// pillar top, one level up) and throws knife fans (three line telegraphs): climb up with the Claws or grapple to the
// post and knock her down (one hit drops her, stagger 2 s). Gates: half her health only goes after a whip yank (Hard
// two); the last of it only after a balcony knock-down.
const N4E2={C:{x:6515,y:87215},balc:[{x:6300,y:87000},{x:6730,y:87430}]};
const N4E2_MOVES=(typeof VESPER_MOVES!=='undefined'?VESPER_MOVES:[]).filter(m=>m.k!=='c1vault');
function n4e2Clones(){ return G.enemies.filter(q=>!q.dead&&q.type==='n_echo_vclone'); }
function n4fVClonePop(c,txt){ if(c.dead) return; c.dead=true; n4fPuff(c.x,c.y-16,'90,60,150',20); SFX.play('pop'); if(txt) ftext(c.x,c.y-40,txt,'#d8c0ff',13); n4fEv('clonepop'); }
function n4e2Split(e,first){
  const n=byDiff(2,3,4)-n4e2Clones().length; if(n<=0) return; const L=fkLevel(e,{}), C=N4E2.C;
  const spots=[]; for(let i=0;i<=n;i++){ const an=rand(0,TAU), r=rand(90,250); spots.push({x:C.x+Math.cos(an)*r,y:C.y+Math.sin(an)*r}); }
  n4fPuff(e.x,e.y-16,'90,60,150',22); if(!e.n4bal){ e.x=spots[0].x; e.y=spots[0].y; e.mv=null; e.tele=null; e.state='chase'; n4fPuff(e.x,e.y-16,'90,60,150',22); }
  for(let i=1;i<=n;i++){ const c=makeEnemy('n_echo_vclone',spots[i].x,spots[i].y,{level:L,aggro:true,elite:false,homeX:spots[i].x,homeY:spots[i].y,leash:99999}); c.spawnIn=0.2; c.cd=rand(0.6,1.6); n4fPuff(c.x,c.y-16,'90,60,150',18); }
  SFX.play('cast'); if(!first) n4fSay(e,'n_echo_vesper',pick([S('Which one is me? Guess!','Which one is me?'),S('Keep up, little ember!','Keep up!')]),8);
  if(first) n4fTip('clones',S('Clones!','Clones!'),S('Only the real one stays still and clear; the clones flicker. A Shadow Dash through a clone pops it. Whip the real one!','Clones flicker. Dash through them! Whip the real one!'));
}
// the whip yank: she is pulled off her feet (the main window)
function n4e2Yank(e){ e.n4stag=byDiff(4,3,2); e.yanks=(e.yanks||0)+1; e.mv=null; e.tele=null; e.state='dizzy'; e.dizzyT=0; shake(6); SFX.play('block'); n4fTxt(e,S('YANK! She is off her feet!','Yank! She falls!'),'#ffe066',16); n4fEv('yank'); }
// the balcony: up, knife fans, and down again (or knocked down)
function n4e2Balcony(e,dt,p){
  const B=e.n4bal; B.t+=dt;
  if(B.ph==='leap'){ const u=clamp(B.t/0.55,0,1); e.x=lerp(B.x0,B.b.x,u); e.y=lerp(B.y0,B.b.y,u); e.z=48*u+Math.sin(u*Math.PI)*60; e.state='vault'; e.noClip=true; e.dx=e.dy=0;
    if(u>=1){ B.ph='perch'; B.t=0; B.fanT=0.6; e.z=48; e.state='perch'; } return; }
  if(B.ph==='perch'){ e.state='perch'; e.dx=e.dy=0; e.x=B.b.x; e.y=B.b.y; e.z=48; e.face=turnTo(e.face,angTo(e.x,e.y,p.x,p.y),6*dt); B.fanT-=dt;
    if(B.fanT<=0){ B.fanT=byDiff(2.8,2.2,1.8); const a0=angTo(e.x,e.y,p.x,p.y), dur=n4fTele(0.8), sp=byDiff(0.34,0.3,0.26);
      for(let i=-1;i<=1;i++){ const a=a0+i*sp; n4fMark({shape:'line',x:e.x,y:e.y,ang:a,len:620,w:26,dur,col:N4FCOL.violet,owner:e,fire:z=>{ shoot(z.x,z.y,z.ang,560,7,n4fDmg(e,16),'bolt','enemy',{life:1.4}); }}); }
      SFX.play('warn'); n4fEv('fan'); }
    if(B.t>=byDiff(9,8,7)){ B.ph='down'; B.t=0; B.x0=e.x; B.y0=e.y; const a=angTo(e.x,e.y,N4E2.C.x,N4E2.C.y); B.tx=e.x+Math.cos(a)*120; B.ty=e.y+Math.sin(a)*120; } return; }
  if(B.ph==='down'||B.ph==='knock'){ const T=B.ph==='knock'?0.35:0.45, u=clamp(B.t/T,0,1); e.x=lerp(B.x0,B.tx,u); e.y=lerp(B.y0,B.ty,u); e.z=48*(1-u)+Math.sin(u*Math.PI)*(B.ph==='knock'?10:40); e.state=B.ph==='knock'?'stuck':'vault';
    if(u>=1){ e.z=0; e.noClip=false; e.n4bal=null; shake(6); SFX.play('boom'); emit(e.x,e.y,16,{col:'110,80,170',glow:false,smin:40,smax:150,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:5});
      if(B.ph==='knock'){ e.n4stag=2; e.state='dizzy'; } else { e.state='recover'; e.st=0.4; } e.n4balT=byDiff(22,20,16)*(e.bph>=1?0.75:1); } return; }
}
function n4e2Knock(e){ const B=e.n4bal; if(!B||B.ph!=='perch') return; B.ph='knock'; B.t=0; B.x0=e.x; B.y0=e.y; const a=angTo(e.x,e.y,N4E2.C.x,N4E2.C.y); B.tx=e.x+Math.cos(a)*110; B.ty=e.y+Math.sin(a)*110; e.knocks=(e.knocks||0)+1;
  n4fTxt(e,S('Knocked off the balcony!','Knocked down!'),'#ffe066',16); n4fEv('knock'); n4fSay(e,'n_echo_vesper',S('Hey! That was MY trick!','That was MY trick!'),5); }
function n4e2Pre(e,dt,d,a){
  const p=player, F=foeDiff();
  n4fFlecks(e,dt,1); if(e.n4mark>0) e.n4mark-=dt;
  N4F.cue={x:e.x,y:e.y-(e.z||0)};
  if(e.n4bal){ n4e2Balcony(e,dt,p); return true; }
  if(e.n4stag>0){ e.n4stag-=dt; e.dx=e.dy=0; e.state='dizzy'; e.st=0.2; if(e.n4stag<=0){ e.state='recover'; e.st=0.3; } return true; }
  if(e.dizzyT>0){ e.dizzyT-=dt; e.dx=e.dy=0; e.state='dizzy'; e.st=0.2; if(e.dizzyT<=0){ e.state='recover'; e.st=0.3; } return true; }
  // new clones now and then; the balcony every 20 s
  e.cloneT=(e.cloneT||0)+dt*F.atk; if(e.cloneT>=(e.bph>=1?10:14)){ e.cloneT=0; n4e2Split(e,false); }
  e.n4balT=(e.n4balT==null?byDiff(14,12,10):e.n4balT)-dt*F.atk;
  if(e.n4balT<=0&&!e.mv&&e.state==='chase'){ let b=N4E2.balc[0]; if(dist(p.x,p.y,b.x,b.y)<dist(p.x,p.y,N4E2.balc[1].x,N4E2.balc[1].y)) b=N4E2.balc[1]; e.n4bal={ph:'leap',t:0,b,x0:e.x,y0:e.y}; e.tele=null; SFX.play('jump');
    n4fSay(e,'n_echo_vesper',S('Up here, little ember! Catch me!','Up here! Catch me!'),6);
    n4fTip('balc',S('The balcony','The balcony'),S('She is up on a pillar. Climb it with your Claws, or grapple the post, and knock her down!','Climb up or grapple! Knock her down!')); return true; }
  // keep her inside the hall
  const C=N4E2.C, dd=dist(e.x,e.y,C.x,C.y); if(dd>320){ const an=angTo(C.x,C.y,e.x,e.y); e.x=C.x+Math.cos(an)*320; e.y=C.y+Math.sin(an)*320; }
  bossCad(e,e.bph>=1?0.85:1);
  return false;
}
const N4E2_AI=FK.brain({move:'strafe',slant:1.1,stop:70,turn:8,cd:[0.55,1.15],recoverMove:0.4,pre:n4e2Pre,moves:N4E2_MOVES});
defineFoe('n_echo_vesper',{boss:true,name:'Echo of the Moth Mask',title:S('A shadow of Vesper','A shadow of Vesper'),short:'Echo of the Moth Mask',
  lv:22,hp:15000,r:13,speed:230,dmg:26,value:1000,kbRes:0.5,dcol:'80,60,140',phases:[0.5],
  phaseText:[[S('More masks!','More masks!'),S('Her clones come back faster and she climbs more often. Whip her, and knock her off the balcony!','Whip her! Knock her down!'),['n_echo_vesper',S('She PROMISED.','She promised!')]]],
  init(e){ e.r0=13; e.leash=99999; e.n4edK=(e.edK||1)*Math.pow(1.10,22-13); e.edK=e.n4edK; e.yanks=0; e.knocks=0; e.cloneT=0; e.n4balT=byDiff(14,12,10); n4fBossIn(e); later(0.4,()=>{ if(!e.dead&&G.boss===e) n4e2Split(e,true); }); },
  onPhase(e,i){ e.n4balT=Math.min(e.n4balT||6,6); n4e2Split(e,false); },
  ai:N4E2_AI,
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.n4bal){ if(e.n4bal.ph==='perch'&&(n4fLvl()>=5||(player.z||0)>40||h.src==='whip')){ n4e2Knock(e); return amt*0.4; } if(!(e._n4hiT>G.time)){ e._n4hiT=G.time+3; n4fTxt(e,S('She is up on the balcony! Climb up or grapple the post!','Climb up to her!'),'#e0d0ff',13); } return false; }
    if(h.src==='whip'&&!(e.n4stag>0)){ n4e2Yank(e); a*=1.2; }
    else if(e.n4stag>0) a*=1.4; else a*=0.6;
    a=n4fGate(e,a,o,0.5,e.bph>=1||(e.yanks||0)>=byDiff(1,1,2),S('Crack the Chain Whip on the real one!','Whip the real one!'));
    if(a!==false&&e.bph>=1) a=n4fGate(e,a,o,0.004,(e.knocks||0)>=1,S('Knock her off a balcony first!','Knock her off the balcony!'));
    return a; },
  onDeath(e){ for(const c of n4e2Clones()) n4fVClonePop(c,null); for(let i=0;i<50;i++){ const an=rand(0,TAU), r=rand(0,30); emit(e.x+Math.cos(an)*r,e.y+Math.sin(an)*r*0.6-20,1,{col:Math.random()<0.5?'40,26,70':'170,130,240',glow:false,ang:-Math.PI/2+rand(-1,1),spread:0.6,smin:40,smax:160,lmin:.6,lmax:1.4,zmin:1.2,zmax:2.6,drag:0.8,rise:30}); } SFX.play('pop'); },
  draw3d:(e,fl)=>n4e2Draw(e,fl), draw2d:(e,fl)=>n4e2Draw(e,fl),
  sheet:typeof c1Sheet==='function'?c1Sheet([{state:'chase',label:'idle'},{state:'chase',dx:120,label:'run'},{state:'dashW',st:0.3,at:0.4,label:'dash windup'},{state:'windup',st:0.2,label:'flurry'},{state:'perch',z:48,label:'balcony'},{state:'dizzy',label:'yanked'}]):null});
defineFoe('n_echo_vclone',{name:'Echo of the Moth Mask',r:13,hp:1,speed:220,dmg:26,value:0,kbRes:0.8,dcol:'80,60,140',lv:22,
  ai:(e,dt,p)=>{ if(typeof CLONE_AI==='function') CLONE_AI(e,dt,p); n4fFlecks(e,dt,0.6); },
  init(e){ e.clone=true; e.r0=13; e.real=G.boss&&G.boss.type==='n_echo_vesper'?G.boss:null; e.edK=(e.edK||1)*Math.pow(1.10,22-13)*0.4; e.leash=99999; e.elite=false; e.onShadow=(c)=>n4fVClonePop(c,S('Just a shadow!','A fake!')); },
  onHurt(e,amt,o){ n4fVClonePop(e,foeHit(e,o).fire?S('Burnt away!','Poof!'):S('Just a shadow!','A fake!')); return false; },
  draw3d:(e,fl)=>n4e2Draw(e,fl), draw2d:(e,fl)=>n4e2Draw(e,fl), sheet:[{state:'chase',clone:true,label:'clone'}]});
function n4e2Draw(e,fl){
  const t=G.time; ctx.save();
  if(e.clone) ctx.globalAlpha*=0.55+0.3*Math.abs(Math.sin(t*9+(e.id||0)))*(Math.sin(t*23+(e.id||0)*3)>0.6?0.3:1);
  if(e.n4mark>0&&!e.clone){ ctx.save(); ctx.strokeStyle=`rgba(255,220,120,${0.5+0.4*Math.sin(t*10)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(e.x,e.y+4,24,12,0,0,TAU); ctx.stroke(); ctx.restore(); }
  if(e.n4bal&&(e.z||0)>4){ ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+4,14,6,0,0,TAU); ctx.fill(); }
  n4fRim(e,40,0.16);
  if(typeof c1FigVesper==='function') n4fSkin2(()=>c1FigVesper(e,fl));
  ctx.restore(); }
N4FM.n_echo2={
  begin(){},
  // the story's Vesper (x4_story runs the friends): she pops clones herself; every 6 s she also points at the real one
  tick(dt,e){ if(!e||!n4fS()||!n4fAllyHere('vesper')) return; N4E2.vT=(N4E2.vT||0)+dt; if(N4E2.vT>=6){ N4E2.vT=0; e.n4mark=2.2; } },
  reset(){ for(const c of G.enemies) if(!c.dead&&c.type==='n_echo_vclone') c.dead=true; },
  win(){ for(const c of G.enemies) if(!c.dead&&c.type==='n_echo_vclone') c.dead=true; },
  ground(t){ for(const b of N4E2.balc){ const e=G.boss, on=e&&e.n4bal&&e.n4bal.b===b; if(!on) continue; ctx.save(); ctx.strokeStyle=`rgba(255,220,140,${0.5+0.3*Math.sin(t*8)})`; ctx.lineWidth=3; ctx.setLineDash([8,6]); ctx.lineDashOffset=-t*30; ctx.beginPath(); ctx.arc(b.x,b.y-48,62,0,TAU); ctx.stroke(); ctx.restore(); } }
};
defineBoss('n_echo2',{boss:'n_echo_vesper',at:{x:6515,y:87215,r:360,name:S('The Mask Hall','The Mask Hall'),level:22},stage:'n_clocks',open:()=>n4fStageOK('n_clocks'),
  arena:{shape:'ring',r:385,style:'n4glass',glow:'170,120,255'},flyOK:false,music:'n_echo',spawn:{dx:0,dy:-120},
  onStart(){ n4fFightStart('n_echo2'); }, onReset(){ n4fFightReset('n_echo2'); }, onWin(){ n4fWon('n_echo2'); }});
const n4e2Intro=()=>[
  n4fL('narr',`In a hall full of moth lamps, a masked figure waits. Then there are three of her. Then five.`,`A masked shadow waits. Then there are lots of her!`),
  n4fL('n_echo_vesper',`The Heart will give my family its fire back. She promised. She PROMISED.`,`The Heart will give my family fire. She promised!`),
  n4fL('ash',`She promised you lots of things. She lied about all of them.`,`She promised lots of things. She lied.`),
  n4fL('c_vesper',`Do I really stand like that? With my elbow out? Ugh. Help me knock her down. I can't watch this.`,`Do I really stand like that? Ugh. Let's knock her down.`,()=>n4fAllyHas('vesper'))];
n4e2Intro.short=()=>[n4fL('n_echo_vesper',`Back for more, little ember?`,`Back for more?`),n4fL('ash',`Whip the real one. Knock her off the balcony. Got it.`,`Whip her. Knock her down. Got it.`)];
n4fLines('n_echo_vesper','n_echo2_intro','n_echo2_outro',n4e2Intro,()=>[
  n4fL('narr',`The shadow thief spins, stumbles, and pops into a cloud of moths.`,`The shadow thief pops into moths.`),
  n4fL('narr',`A memory hangs in the air. A small voice, in a small room by the sea.`,`A memory floats by. A small voice by the sea.`),
  n4fL('n_memory',`Granny, why can't I make fire like the stories?`,`Granny, why can't I make fire?`),
  n4fL('n_memory',`Oh, duck. Fire isn't the only warm thing.`,`Oh, duck. Fire is not the only warm thing.`),
  n4fL('c_vesper',`...She used to say that. Every night.`,`She used to say that every night.`,()=>vesperFriend()),
  n4fL('ash',`She was right.`,`She was right.`,()=>vesperFriend()),
  n4fL('c_vesper',`Don't make it a whole thing.`,`Don't make it a big thing.`,()=>vesperFriend()),
  n4fL('ash',`I hope you heard that, Vesper. Wherever you are.`,`I hope Vesper heard that.`,()=>!vesperFriend())]);

// ================= 6. Echo of the Ice Dragon (site n_echo3, type n_echo_glaciar), the Rime Throne (FINALE 6.3)
// Glaciar's own coil brain (x2_foes f2GlaciarAI: frost breath, icicle rain, tail sweep) on a shadow copy at 45 percent
// of her health at level 22. Twist, part 1, the Chains: four frost chains run from posts (NE, SE, SW, NW, r 300) to her;
// while any holds, a frost shield covers her (x0.15). Each lock sits in an ice dome: Ground Pound its rune plate (or a
// Blast Bomb) and the dome cracks for 6 s (Easy 9); Blaze the lock 1.5 s (Easy 1.0, Hard 2.0) and it SNAPS. All four:
// the shield shatters. Part 2, the Wind (below half): she breaks free and flies; the arena is calm air and a wind
// stream rings it (r 250). Blizzard breath from above (it slows). Every 12 s she slams down (a circle, 1.2 s): a Ground
// Pound within 120 px right after she lands stuns her 4 s (Easy 6, Hard 3). When she draws a huge breath (1.2 s, her
// chest glows) a Blast Bomb into her mouth staggers her 3 s.
const N4E3={C:{x:3121,y:86579},R:360,posts:[],stream:null};
function n4e3PostsMake(){ const C=N4E3.C; N4E3.posts=[[-45,'ne'],[45,'se'],[135,'sw'],[225,'nw']].map(([deg,id],i)=>{ const a=deg*Math.PI/180, x=C.x+Math.cos(a)*300, y=C.y+Math.sin(a)*300;
  return {i,id,x,y,px:C.x+Math.cos(a)*258,py:C.y+Math.sin(a)*258,lx:x,ly:y-30,crack:0,heat:0,snap:false,snapT:0,col:null}; }); }
n4e3PostsMake();
function n4e3Left(){ return N4E3.posts.filter(q=>!q.snap).length; }
// a Ground Pound or a bomb on (or near) a rune plate cracks that post's dome
function n4e3Crack(q,how){ if(q.snap) return; const was=q.crack>0; q.crack=byDiff(9,6,6); q.heat=0; if(!was){ SFX.play('block'); shake(4); emit(q.lx,q.ly,16,{col:'210,235,255',smin:40,smax:160,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); ftext(q.lx,q.ly-40,S('The dome cracks! Blaze the lock!','Cracked! Blaze the lock!'),'#dff4ff',14); n4fEv('dome'); } }
function n4e3OnPound(info){ if(!N4F.fight||N4F.fight.k!=='n_echo3') return; for(const q of N4E3.posts) if(!q.snap&&(dist(info.x,info.y,q.px,q.py)<(info.R||90)*0.5+40||dist(info.x,info.y,q.x,q.y)<(info.R||90)*0.5+46)) n4e3Crack(q,'pound');
  const e=n4fBoss('n_echo_glaciar'); if(e&&e.n4land>0&&dist(info.x,info.y,e.x,e.y)<120+(info.R||90)*0.3){ e.n4land=0; e.n4stun=byDiff(6,4,3); e.stuns=(e.stuns||0)+1; e.mv=null; e.tele=null; e.n4slam=null; e.z=0; shake(10); SFX.play('boom'); n4fTxt(e,S('POUND! The ice cracks under her! Stunned!','POUND! She is stunned!'),'#ffe066',17); n4fEv('glastun'); } }
if(typeof p3OnPound==='function') p3OnPound(n4e3OnPound);
{ const base=armsBlast; armsBlast=function(x,y,o){ const r=base(x,y,o); try{ if(N4F.fight&&N4F.fight.k==='n_echo3') for(const q of N4E3.posts) if(!q.snap&&(dist(x,y,q.px,q.py)<90||dist(x,y,q.x,q.y)<90)) n4e3Crack(q,'bomb'); }catch(err){ console.error(err); } return r; }; }
function n4e3PostsTick(dt,e){
  const need=byDiff(1.0,1.5,2.0);
  for(const q of N4E3.posts){ if(q.snapT>0) q.snapT-=dt; if(q.snap) continue;
    if(q.crack>0){ q.crack-=dt; if(n4fBlueAt(q.lx,q.ly,18)){ q.heat+=dt; if(typeof f2Work==='function') f2Work(); if(Math.random()<dt*20) emit(q.lx,q.ly,1,{col:'220,240,255',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:70,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:6,drag:1}); }
      else q.heat=Math.max(0,q.heat-dt*0.4);
      if(q.heat>=need){ q.snap=true; q.snapT=1; q.crack=0; SFX.play('boom'); shake(7); emit(q.lx,q.ly,24,{col:'200,230,255',smin:60,smax:220,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); n4fEv('snap');
        const left=n4e3Left(); ftext(q.lx,q.ly-50,left?S('SNAP! A chain breaks!','SNAP!'):S('SNAP! The last chain!','The last chain!'),'#ffe066',17);
        if(!left&&e){ e.n4shield=false; e.n4stun=byDiff(4,3,2.5); e.mv=null; e.tele=null; SFX.play('boom'); shake(14); flashA=Math.max(flashA,0.3); flashCol='200,230,255'; n4fTxt(e,S('The frost shield shatters!','Her shield breaks!'),'#ffffff',18); n4fSay(e,'n_echo_glaciar',S('...The chains. Who made the chains?','Who made the chains?'),5); } }
      if(q.crack<=0&&!q.snap){ q.heat=0; ftext(q.lx,q.ly-40,S('The dome seals again.','It froze again.'),'#cfe0ff',12); } }
    else if(n4fBlueAt(q.lx,q.ly,18)&&!(q.nag>G.time)){ q.nag=G.time+3; ftext(q.lx,q.ly-40,S('The dome is too thick. Ground Pound the rune plate first!','Pound the plate first!'),'#dff4ff',13); } }
}
// the brain: her coil (phase 1) through f2GlaciarAI; the air (phase 2) is ours, with her breath and boulders inside it
const N4E3_AIR=typeof GLA_MOVES!=='undefined'?FK.brain({move:'hold',turn:3,cd:[1.4,2.2],recoverMove:0,moves:[Object.assign({},GLA_MOVES.breath,{dmgN:9,max:700,w:3,if:()=>!n4fCalm()}),GLA_MOVES.boulders]}):null;
function n4e3AI(e,dt,p){
  e._tnT=G.time+999; n4fFlecks(e,dt,1.4); if(N4F.calmT>0) N4F.calmT-=dt;
  if(e.n4stun>0){ e.n4stun-=dt; e.state='stagger'; e.dx=e.dy=0; e.tele=null; e.mv=null; e.z=Math.max(0,(e.z||0)-dt*420); e.flying=false; if(e.n4stun<=0){ e.state='chase'; e.cd=0.6; } return; }
  if(e.mode==='n4air'){ n4e3Air(e,dt,p); return; }
  if(n4fCalm()&&e.mv&&e.mv.o&&e.mv.o.k==='f2gbreath'){ e.mv=null; e.tele=null; e.state='recover'; e.st=0.6; }
  if(typeof f2GlaciarAI==='function') f2GlaciarAI(e,dt,p);
  // Pip hovers over the next chain post (the nearest one still holding)
  let best=null, bd=1e9; for(const q of N4E3.posts){ if(q.snap) continue; const d=dist(p.x,p.y,q.x,q.y); if(d<bd){ bd=d; best=q; } } N4F.cue=best?{x:best.x,y:best.y-50}:null;
}
function n4e3Air(e,dt,p){
  const C=N4E3.C, D0=foeDiff(); e.noClip=true;
  // the slam: a circle where she will land, the landing, then a short window on the ground
  if(e.n4slam){ const S0=e.n4slam; S0.t+=dt;
    if(S0.ph==='aim'){ e.state='diveAim'; steer(e,S0.x,S0.y-30,e.speed*3); e.z=lerp(e.z||0,120,Math.min(1,dt*2)); if(S0.t>=S0.dur){ S0.ph='drop'; S0.t=0; e.state='dive'; } return; }
    if(S0.ph==='drop'){ e.x=lerp(e.x,S0.x,Math.min(1,dt*14)); e.y=lerp(e.y,S0.y,Math.min(1,dt*14)); e.z=Math.max(0,(e.z||0)-dt*700); e.flying=e.z>20;
      if(e.z<=0){ S0.ph='land'; S0.t=0; e.state='perched'; e.flying=false; e.n4land=byDiff(3.2,2.5,1.8); shake(10); SFX.play('boom'); if(typeof f2Snow==='function') f2Snow(e.x,e.y,30);
        if(!p.dead&&!n4fUp()&&dist(p.x,p.y,e.x,e.y)<120+p.r*0.5) hurtPlayer(n4fDmg(e,38),e.x,e.y,420);
        G.rings.push({x:e.x,y:e.y,rad:e.r,max:260,speed:420,thick:16,dmg:0,kb:300});
        n4fTip('slam',S('She landed!','She landed!'),S('Right after she lands, Ground Pound close to her: the ice cracks and she is stunned!','Ground Pound next to her now!')); } return; }
    if(S0.ph==='land'){ e.state='perched'; e.dx=e.dy=0; e.n4land-=dt; N4F.cue={x:e.x,y:e.y}; if(e.n4land<=0){ e.n4slam=null; e.state='takeoff'; e.st=0.6; e.n4slamT=byDiff(14,12,10); } return; } }
  // the huge breath: she breathes in (her chest glows); a Blast Bomb thrown into her mouth goes off inside
  if(e.n4inh){ const I=e.n4inh; I.t+=dt; e.state='breathW'; e.dx=e.dy=0; e.n4chest=clamp(I.t/I.dur,0,1); const H=f2GlaHead(e);
    if(typeof G.wproj!=='undefined') for(const b of G.wproj){ if(b.k!=='bomb'||b.dead) continue; if(dist(b.x,b.y,H.x,H.y)<70){ b.dead=true; e.n4inh=null; e.n4chest=0; e.n4stun=byDiff(4,3,3); e.stuns=(e.stuns||0)+1; e.bombs=(e.bombs||0)+1;
        shake(12); SFX.play('boom'); emit(H.x,H.y-(e.z||0)*0.8,30,{kind:'fire',smin:80,smax:260,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:8}); n4fTxt(e,S('GULP! BOOM! She swallowed the bomb!','GULP! BOOM!'),'#ffe066',18); n4fEv('glabomb'); return; } }
    if(I.t>=I.dur){ e.n4inh=null; e.n4chest=0; if(n4fCalm()){ e.state='recover'; e.st=0.6; e.n4inhT=byDiff(18,15,12); return; }
      const a=angTo(e.x,e.y,p.x,p.y); n4fMark({shape:'cone',x:H.x,y:H.y,ang:a,len:520,half:0.55,dur:0.25,col:'200,230,255',fire:z=>{ const pp=player; if(!pp.dead&&dist(z.x,z.y,pp.x,pp.y)<z.len+pp.r&&Math.abs(angDiff(z.ang,angTo(z.x,z.y,pp.x,pp.y)))<z.half+0.1&&!n4fShadowed()){ hurtPlayer(n4fDmg(e,30),z.x,z.y,260); pp.slowT=Math.max(pp.slowT||0,2.5); }
        for(let i=0;i<40;i++) emit(z.x,z.y,1,{col:'225,240,255',glow:false,ang:z.ang+rand(-0.5,0.5),spread:0.1,smin:300,smax:600,lmin:.5,lmax:.9,zmin:2,zmax:5,grow:12,drag:1}); }});
      e.state='recover'; e.st=0.8; e.n4inhT=byDiff(18,15,12); } return; }
  e.n4slamT=(e.n4slamT==null?6:e.n4slamT)-dt*D0.atk; e.n4inhT=(e.n4inhT==null?9:e.n4inhT)-dt*D0.atk;
  if(!e.mv&&(e.state==='chase'||e.state==='recover'||e.state==='takeoff')){
    if(e.n4slamT<=0){ const q={x:p.x,y:p.y}; const d=dist(q.x,q.y,C.x,C.y); if(d>300){ const an=angTo(C.x,C.y,q.x,q.y); q.x=C.x+Math.cos(an)*300; q.y=C.y+Math.sin(an)*300; }
      const dur=n4fTele(1.2); e.n4slam={ph:'aim',t:0,dur,x:q.x,y:q.y}; n4fMark({x:q.x,y:q.y,r:120,dur:dur+0.15,col:N4FCOL.red,owner:e}); SFX.play('warn'); n4fSay(e,'n_echo_glaciar',S('Down you go, dumpling.','Down you go.'),7); return; }
    if(e.n4inhT<=0){ e.n4inh={t:0,dur:n4fTele(1.2)}; SFX.play('warn'); n4fTip('inhale',S('A huge breath!','A huge breath!'),S('Her chest glows: throw a Blast Bomb into her open mouth!','Throw a bomb in her mouth!')); return; } }
  if(e.state==='takeoff'){ e.st-=dt; e.z=lerp(e.z||0,120,Math.min(1,dt*3)); if(e.st<=0) e.state='chase'; }
  if(N4E3_AIR) N4E3_AIR(e,dt,p);
  if(!e.mv&&e.state==='chase'){ e.c8=(e.c8||0)+dt*0.45*D0.spd; const R=180, tx=C.x+Math.sin(e.c8)*R, ty=C.y+Math.sin(e.c8*2)*R*0.5; steer(e,tx,ty,e.speed*3); e.z=lerp(e.z||0,120,Math.min(1,dt*2)); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),2.6*dt); }
  e.flying=(e.z||0)>20;
  N4F.cue=e.n4inh?{x:e.x,y:e.y-60}:null;
}
// the wind ring of the air phase (two laps, so a ride can go round and round: n4fLoop keeps it going)
function n4e3Stream(on){ if(typeof WIND==='undefined'||typeof P3==='undefined') return; const C=N4E3.C;
  if(on&&!N4E3.stream){ const pts=[]; for(let i=0;i<=72;i++){ const a=-Math.PI/2-i/36*TAU; pts.push([C.x+Math.cos(a)*250,C.y+Math.sin(a)*250]); } N4E3.stream=WIND.stream({id:'n4f_e3ring',pts,w:64,speed:400,lv:[6,6],any:true,n4loop:true}); }
  if(!on&&N4E3.stream){ P3.streams=P3.streams.filter(o=>o!==N4E3.stream); if(P3.ride&&P3.ride.o===N4E3.stream) try{ p3RideOff(player,'drop'); }catch(err){} N4E3.stream=null; } }
// a looping ride: the second lap is the first again
function n4fLoop(){ if(typeof P3==='undefined'||!P3.ride) return; const R=P3.ride, o=R.o; if(!o||!o.n4loop) return; const half=o.L*0.5; if(R.dir>0&&R.s>half) R.s-=half; else if(R.dir<0&&R.s<half) R.s+=half; }
{ const base=updatePlayer; updatePlayer=function(dt,inp){ const r=base(dt,inp); try{ n4fLoop(); }catch(err){} return r; }; }
if(typeof F2HC!=='undefined'&&F2HC.f_glaciar) F2HC.n_echo_glaciar=F2HC.f_glaciar;
defineFoe('n_echo_glaciar',{boss:true,name:'Echo of the Ice Dragon',title:S('A shadow of Glaciar','A shadow of Glaciar'),short:'Echo of the Ice Dragon',
  lv:22,hp:15000,r:60,speed:60,dmg:26,value:1000,kbRes:0,dcol:'70,80,140',phases:[0.5],
  phaseText:[[S('The Wind!','The Wind!'),S('She flies! Ride the wind ring and hit her from the air. Pound her when she lands; bomb her mouth when she breathes in!','She flies! Ride the wind! Pound her when she lands!'),['n_echo_glaciar',S('Cold is kind. Cold is KIND.','Cold is kind!')]]],
  init(e){ if(typeof f2BossInit==='function') f2BossInit(e); const C=N4E3.C; e.mode='coil'; e.z=0; e.fly=0; e.c8=rand(0,TAU); e.homeX=C.x; e.homeY=C.y; e.r0=60; e.leash=99999; e.n4shield=true; e.stuns=0;
    e.f2ctx={cx:C.x,cy:C.y,R:N4E3.R,A:null,rect:false}; e.n4edK=(e.edK||1)*Math.pow(1.10,22-17); e.edK=e.n4edK; n4fBossIn(e); },
  onPhase(e,i){ if(i===1){ e.mode='n4air'; e.mv=null; e.tele=null; e.state='takeoff'; e.st=1; e.n4slamT=5; e.n4inhT=9; if(N4F.fight) N4F.fight.fly=true; if(typeof n4wCalm==='function') n4wCalm('cz_echo3',true); n4e3Stream(true);
    shake(14); SFX.play('roar'); n4fTip('wind',S('She flies!','She flies!'),S('The air is calm now: fly! Jump into the wind ring to ride round the hall and hit her from up high.','Fly! Ride the wind ring round the hall!')); } },
  ai:(e,dt,p)=>n4e3AI(e,dt,p),
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.n4shield&&n4e3Left()>0){ a*=0.15; if(!(e._n4shT>G.time)){ e._n4shT=G.time+3.4; n4fTxt(e,S('A frost shield! Break her four chains: pound a rune plate, then Blaze the lock.','Frost shield! Break the chains!'),'#dff4ff',13); } }
    if((e.z||0)>36&&!(e.n4stun>0)){ const up=(player.z||0)>30||player.flying||(typeof P3!=='undefined'&&P3.ride); if(f2Ranged(o)||h.src==='glaive'||up) a=a; else if(h.fire) a*=0.5; else { if(!(e._n4hiT>G.time)){ e._n4hiT=G.time+2.4; n4fTxt(e,S('She is up in the air! Fly up, or use arrows and the Glaive.','Too high! Fly up!'),'#e8f6ff',13); } return false; } }
    if(e.n4stun>0||e.state==='perched') a*=e.n4stun>0?1.6:1.2;
    a=n4fGate(e,a,o,0.5,n4e3Left()===0,S('Break all four chains first!','Break the four chains!'));
    if(a!==false&&e.bph>=1) a=n4fGate(e,a,o,0.004,(e.stuns||0)>=1,S('Pound her when she lands, or bomb her mouth!','Pound her when she lands!'));
    return a; },
  onDeath(e){ n4e3Stream(false); for(let i=0;i<80;i++){ const an=rand(0,TAU), r=rand(0,90); emit(e.x+Math.cos(an)*r,e.y+Math.sin(an)*r*0.6-30-(e.z||0),1,{col:Math.random()<0.5?'40,30,80':'200,220,255',glow:false,ang:-Math.PI/2+rand(-1,1),spread:0.6,smin:60,smax:220,lmin:.8,lmax:1.6,zmin:1.4,zmax:3,drag:0.8,rise:40}); } SFX.play('pop'); },
  draw3d:(e,fl)=>n4e3Draw(e,fl), draw2d:(e,fl)=>n4e3Draw(e,fl),
  sheet:[{state:'chase',mode:'coil',z:0,label:'coiled'},{state:'breathW',mode:'coil',z:0,st:0.5,label:'breath'},{state:'chase',mode:'air',z:120,dx:120,label:'flying'},{state:'perched',mode:'air',z:0,label:'landed'},{state:'stagger',mode:'stagger',z:0,label:'stunned'}]});
function n4e3Draw(e,fl){ n4fRim(e,140,0.2);
  if(typeof f2FigGlaciar==='function') n4fSkin2(()=>f2FigGlaciar(e,fl),'170,210,255');
  if(e.n4chest>0){ const H=f2GlaHead(e); glowAt(H.x,H.y-(H.z||0)*0.8,50+40*e.n4chest,'200,230,255',0.6*e.n4chest); }
  if(e.n4shield&&n4e3Left()>0&&!e.dead){ const t=G.time, y=e.y-(e.z||0)*0.8-40; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.22+0.06*Math.sin(t*3); ctx.fillStyle='rgba(160,210,255,1)'; ctx.beginPath(); ctx.ellipse(e.x,y,110,80,0,0,TAU); ctx.fill();
    ctx.globalAlpha=0.5; ctx.strokeStyle='rgba(230,245,255,1)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(e.x,y,110,80,0,0,TAU); ctx.stroke(); ctx.restore(); } }
// the chain posts: frost pillars, a padlock in an ice dome, the rune plate on the floor, the chain to her
function n4e3DrawPost(q){ const t=G.time, x=q.x, y=q.y;
  const s=sbSprite('n4f_cpost',40,g=>{ g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0,30,20,6,0,0,TAU); g.fill(); g.fillStyle='#2a3458'; g.beginPath(); g.moveTo(-14,30); g.lineTo(-11,-26); g.lineTo(0,-34); g.lineTo(11,-26); g.lineTo(14,30); g.closePath(); g.fill(); g.fillStyle='#46548a'; g.beginPath(); g.moveTo(-10,28); g.lineTo(-8,-24); g.lineTo(-1,-30); g.lineTo(-2,28); g.closePath(); g.fill(); },1.8);
  drawSprite(s,x,y-26,1,0);
  const lx=q.lx, ly=q.ly;
  if(!q.snap){ ctx.save(); ctx.fillStyle='#8a7ab8'; ctx.strokeStyle='#241a3e'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(lx,ly-6,6,Math.PI,0); ctx.stroke(); ctx.fillRect(lx-7,ly-6,14,11); ctx.strokeRect(lx-7,ly-6,14,11);
    if(q.heat>0){ glowAt(lx,ly,30,'150,200,255',0.3+q.heat); }
    // the dome (cracked: lines across it, and it pulses)
    const crk=q.crack>0; ctx.globalAlpha=crk?0.5:0.75; ctx.fillStyle='rgba(200,230,255,.55)'; ctx.beginPath(); ctx.ellipse(lx,ly-2,20,22,0,0,TAU); ctx.fill(); ctx.globalAlpha=1; ctx.strokeStyle=crk?'rgba(255,255,255,.95)':'rgba(230,245,255,.8)'; ctx.lineWidth=1.6; ctx.stroke();
    if(crk){ ctx.beginPath(); ctx.moveTo(lx-12,ly-14); ctx.lineTo(lx-2,ly-4); ctx.lineTo(lx-8,ly+8); ctx.moveTo(lx+10,ly-16); ctx.lineTo(lx+3,ly-2); ctx.lineTo(lx+12,ly+6); ctx.stroke(); const k=q.crack/byDiff(9,6,6); ctx.strokeStyle='rgba(255,226,140,.9)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(lx,ly-2,26,-Math.PI/2,-Math.PI/2+TAU*k); ctx.stroke(); }
    ctx.restore(); }
  else if(q.snapT>0){ ctx.save(); ctx.globalAlpha=q.snapT; ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(lx,ly,30*(1-q.snapT)+8,0,TAU); ctx.fill(); ctx.restore(); } }
function n4e3Ground(t){ const e=n4fBoss('n_echo_glaciar');
  for(const q of N4E3.posts){ const lit=q.crack>0; ctx.save(); ctx.fillStyle='#3b2233'; ctx.beginPath(); ctx.arc(q.px,q.py,19,0,TAU); ctx.fill(); ctx.fillStyle=lit?'#ffe08a':'#9ab0e0'; ctx.beginPath(); ctx.arc(q.px,q.py,15,0,TAU); ctx.fill();
    ctx.strokeStyle='#3a4a7a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(q.px-7,q.py); ctx.lineTo(q.px+7,q.py); ctx.moveTo(q.px,q.py-7); ctx.lineTo(q.px,q.py+7); ctx.stroke();
    if(!q.snap&&e&&!e.dead&&(e.z||0)<30){ ctx.strokeStyle='rgba(30,40,80,.6)'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(e.x,e.y); ctx.stroke(); ctx.strokeStyle='rgba(200,225,255,.85)'; ctx.lineWidth=3; ctx.setLineDash([9,5]); ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(e.x,e.y); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore(); } }
N4FM.n_echo3={
  begin(){ for(const q of N4E3.posts){ q.crack=0; q.heat=0; q.snap=false; q.snapT=0; if(!q.col) q.col=addCol({t:'c',x:q.x,y:q.y,r:16}); q.col.off=false; } N4F.calmT=0; },
  tick(dt,e){ n4e3PostsTick(dt,e); },
  reset(){ n4e3Stream(false); if(typeof n4wCalm==='function') n4wCalm('cz_echo3',false); for(const q of N4E3.posts){ q.crack=0; q.heat=0; q.snap=false; if(q.col) q.col.off=true; } },
  win(){ n4e3Stream(false); if(typeof n4wCalm==='function') n4wCalm('cz_echo3',false); for(const q of N4E3.posts) if(q.col) q.col.off=true; },
  ground(t){ n4e3Ground(t); },
  tall(list){ for(const q of N4E3.posts){ if(!q.it) q.it={x:q.x,y:q.y+2,draw:()=>n4e3DrawPost(q)}; list.push(q.it); } }
};
defineBoss('n_echo3',{boss:'n_echo_glaciar',at:{x:3121,y:86579,r:400,name:S('The Rime Throne','The Rime Throne'),level:22},stage:'n_rime',open:()=>n4fStageOK('n_rime'),
  arena:{shape:'ring',r:420,style:'n4glass',glow:'170,210,255'},flyOK:false,music:'n_echo',spawn:{dx:0,dy:0},
  onStart(){ n4fFightStart('n_echo3'); }, onReset(){ n4fFightReset('n_echo3'); }, onWin(){ n4fWon('n_echo3'); }});
const n4e3Intro=()=>[
  n4fL('narr',`On a throne of black ice, chained in frost, a shadow dragon lifts her head. Her breath is a blizzard.`,`A shadow ice dragon sits on an ice throne, in chains.`),
  n4fL('n_echo_glaciar',`The Mother says cold is kind. The Mother says sleep is kindest. The Mother says fire is a lie.`,`The Mother says cold is kind. Fire is a lie.`),
  n4fL('ash',`That's not you talking. That's the Shard. Well. A copy of you, with a copy of the Shard. This is very confusing.`,`That is the Shard talking. This is confusing!`),
  n4fL('f_glaciar',`Was I really that dreary? Dumpling, I need a scarf. And you need to melt those chains.`,`Was I that gloomy? Melt those chains, dumpling!`,()=>n4fAllyHas('glaciar'))];
n4e3Intro.short=()=>[n4fL('n_echo_glaciar',`Cold again, dumpling? Cold is kind.`,`Cold again? Cold is kind.`),n4fL('ash',`Pound the plate, Blaze the lock. Four times.`,`Pound the plate. Blaze the lock. Four times!`)];
n4fLines('n_echo_glaciar','n_echo3_intro','n_echo3_outro',n4e3Intro,()=>[
  n4fL('narr',`The ice cracks. The shadow dragon shatters into a flurry of moths.`,`The ice dragon breaks into moths.`),
  n4fL('n_memory',`Auntie Glee! Can we make the big snow? For the sledding?`,`Auntie Glee! Can we make snow for sledding?`),
  n4fL('n_memory',`Every year, dumpling. Every single year.`,`Every year, dumpling.`),
  n4fL('f_glaciar',`I forgot the sledding. For a thousand years, I forgot it. Thank you for reminding me, dumpling.`,`I forgot the sledding. Thank you for reminding me.`,()=>G.choices.f_glaciar==='free'),
  n4fL('ash',`Every Lantern Day. Sleds AND cake.`,`Every Lantern Day. Sleds and cake!`,()=>G.choices.f_glaciar==='free'),
  n4fL('ash',`Even ice dragons get lonely, huh, Pip?`,`Ice dragons get lonely too, Pip.`,()=>G.choices.f_glaciar!=='free'),
  n4fL('pip',`Mip.`,`Mip.`,()=>G.choices.f_glaciar!=='free')]);

// ================= 7. Echo of the Hush (site n_echo4, type n_echo_hush), the Eclipse Hall (FINALE 6.4)
// Hush's own brain, look and arena parts from x3_foes (M3HUSH.def with one phase fewer and the shadow look, M3HUSH.parts
// outdoors): the lamp rule (a freshly lit moonstone pulls her down, dazzled 3 s), the Eclipse (every 18 s, Easy 24,
// Hard 14: the hall goes dark; she dives into one shadow pool and erupts from the other; Moonfire all three moonstones
// to end it at once), the Great Shush (too tall to jump: burrow in the rim sand), and the leash knots (a Glaive throw
// through a knot staggers her 3 s). The shadow pools are p4 pools (Ash can dive them too), made for the fight. If the
// real Hush came, the eclipse is only half dark, and she watches her echo with her wings folded over her eyes.
const N4E4={C:{x:3315,y:85096},R:290,parts:null,pools:[]};
if(typeof M3HC!=='undefined'&&typeof M3HUSH!=='undefined') M3HC.n_echo_hush=M3HUSH.hitCircles;
function n4e4Parts(){ const C=N4E4.C, R=N4E4.R;
  if(!N4E4.parts&&typeof M3HUSH!=='undefined'){ N4E4.parts=M3HUSH.parts(C.x,C.y,R,{outdoor:true,stones:[[C.x,C.y-200],[C.x+173,C.y+100],[C.x-173,C.y+100]],pools:[[C.x-150,C.y-10],[C.x+150,C.y-10]],knots:[[C.x-120,C.y-90],[C.x+120,C.y+70]],rim:[200,290],dome:{x:C.x,y:C.y-300}}); }
  const P=N4E4.parts; if(!P) return null; P.on=true; if(!M3.parts.includes(P)) M3.parts.push(P); for(const S0 of P.stones){ S0.lit=0; S0.heat=0; S0.lureAt=-99; if(S0.col) S0.col.off=false; } for(const K of P.knots){ K.jerkT=0; K.glow=0; }
  M3.hushParts=P; return P; }
function n4e4PartsOff(){ const P=N4E4.parts; if(P&&typeof M3HUSH!=='undefined') M3HUSH.partsOff(P); if(typeof M3!=='undefined'&&M3.hushParts===P) M3.hushParts=null; if(typeof M3!=='undefined') M3.darkTo=0; }
// the two linked shadow pools (p4's pool kind), only while the fight is on
function n4e4Pools(on){ if(typeof p4Add!=='function') return; const C=N4E4.C;
  if(on&&!N4E4.pools.length){ N4E4.pools=[p4Add('pool',{id:'n4f_e4_pw',x:C.x-150,y:C.y-10,r:44,kind:'shadow',link:'n4f_e4_pe'}),p4Add('pool',{id:'n4f_e4_pe',x:C.x+150,y:C.y-10,r:44,kind:'shadow',link:'n4f_e4_pw'})]; }
  if(!on&&N4E4.pools.length){ for(const o of N4E4.pools){ let i=LANDMARKS.indexOf(o); if(i>=0) LANDMARKS.splice(i,1); i=P4.out.indexOf(o); if(i>=0) P4.out.splice(i,1); } N4E4.pools=[]; } }
const N4E4_DEF=typeof M3HUSH!=='undefined'?M3HUSH.def({phases:3,shadow:true,echo:true,lv:23,hp:18000,value:1000,name:'Echo of the Hush',title:S('A shadow of Hush','A shadow of Hush'),short:'Echo of the Hush',eclDark:0.92}):{boss:true,name:'Echo of the Hush',lv:23,hp:13500,r:42};
defineFoe('n_echo_hush',Object.assign({},N4E4_DEF,{dcol:'70,60,110',
  init(e,opt){ if(N4E4_DEF.init) N4E4_DEF.init(e,Object.assign({},opt||{},{parts:N4E4.parts})); e.eclDark=n4fAllyHere('hush')?0.5:0.92; e.leash=99999; e.n4edK=e.edK||1; n4fBossIn(e); },
  ai(e,dt,p){ if(N4E4_DEF.ai) N4E4_DEF.ai(e,dt,p); n4fFlecks(e,dt,1.2);
    // Pip: the dark moonstones in an eclipse, a glowing knot in the shush, else the nearest dark moonstone
    const P=e.m3hp; let c=null; if(P){ if(e.bph>=2){ const K=P.knots.find(q=>!(q.jerkT>0)); if(K) c={x:K.x,y:K.y}; } else { let bd=1e9; for(const s of P.stones){ if(s.lit>0) continue; const d=dist(player.x,player.y,s.x,s.y); if(d<bd){ bd=d; c={x:s.x,y:s.y-40}; } } } } N4F.cue=c; },
  onDeath(e){ if(typeof M3!=='undefined') M3.darkTo=0; for(let i=0;i<100;i++){ const an=rand(0,TAU), r=rand(0,70); emit(e.x+Math.cos(an)*r,e.y+Math.sin(an)*r*0.6-30-(e.z||0),1,{col:Math.random()<0.6?'235,232,248':'120,90,190',glow:false,ang:-Math.PI/2+rand(-1.2,1.2),spread:0.6,smin:60,smax:240,lmin:.8,lmax:1.8,zmin:1.2,zmax:2.6,drag:0.6,rise:50}); } SFX.play('pop'); },
  draw3d:(e,fl)=>{ n4fRim(e,120,0.18); if(N4E4_DEF.draw3d) N4E4_DEF.draw3d(e,fl); },
  draw2d:(e,fl)=>{ n4fRim(e,120,0.18); if(N4E4_DEF.draw2d) N4E4_DEF.draw2d(e,fl); }}));
N4FM.n_echo4={
  begin(){ n4e4Parts(); n4e4Pools(true); },
  tick(dt,e){},
  reset(){ n4e4PartsOff(); n4e4Pools(false); },
  win(){ n4e4PartsOff(); n4e4Pools(false); },
  tall(list){ const e=n4fBoss('n_echo_hush'), P=N4E4.parts; if(e&&P&&typeof M3HUSH!=='undefined'){ if(!N4E4.it) N4E4.it={flying:true,draw:()=>{ const b=n4fBoss('n_echo_hush'); if(b&&N4E4.parts) M3HUSH.leash(b,N4E4.parts); }}; N4E4.it.x=e.x; N4E4.it.y=e.y-1; list.push(N4E4.it); } }
};
defineBoss('n_echo4',{boss:'n_echo_hush',at:{x:3315,y:85096,r:290,name:S('The Eclipse Hall','The Eclipse Hall'),level:23},stage:'n_glass',open:()=>n4fStageOK('n_glass'),
  arena:{shape:'ring',r:310,style:'n4glass',glow:'200,190,255'},flyOK:false,music:'n_echo_hush',spawn:{dx:0,dy:-60},
  onStart(){ n4fFightStart('n_echo4'); }, onReset(){ n4fFightReset('n_echo4'); }, onWin(){ n4fWon('n_echo4'); }});
const n4e4Intro=()=>[
  n4fL('narr',`In a hall of brass rings and drowned stars, a great shadow moth unfolds her wings. Two painted eyes stare at you. Then the two real ones blink.`,`A shadow moth opens her wings. Her eyes blink at you.`),
  n4fL('n_echo_hush',`Shhhhhh.`,`Shhhhh.`),
  n4fL('narr',`Beside you, the real Hush folds her wings over her eyes.`,`The real Hush covers her eyes.`,()=>n4fAllyHas('hush')),
  n4fL('ash',`It's okay, Hush. You don't have to watch.`,`It's okay, Hush. Don't look.`,()=>n4fAllyHas('hush'))];
n4e4Intro.short=()=>[n4fL('n_echo_hush',`Shhhh. Again?`,`Shhh. Again?`),n4fL('ash',`Light the moonstones. Burrow from the shush. Hit the knots.`,`Light the stones. Burrow. Hit the knots.`)];
n4fLines('n_echo_hush','n_echo4_intro','n_echo4_outro',n4e4Intro,()=>[
  n4fL('narr',`The shadow moth falls apart into a hundred little moths that flutter away into the dark.`,`The shadow moth breaks into little moths.`),
  n4fL('n_memory',`My quiet one. Stay with me. Everyone else leaves.`,`My quiet one. Stay with me. Everyone else leaves.`),
  n4fL('narr',`Hush trembles. Then, slowly, she turns toward the top of the mountain.`,`Hush shakes. Then she looks up at the top.`,()=>G.choices.m_hush==='free'),
  n4fL('ash',`We're going to go and see her, aren't we.`,`We are going to see her.`,()=>G.choices.m_hush==='free'),
  n4fL('ash',`She said that to Hush every night. No wonder Hush only ever whispered.`,`She said that every night. No wonder Hush only whispers.`,()=>G.choices.m_hush!=='free')]);

// ================= 8. Nyxara, the Night Mother (site n_summit, type n_nyxara), the Moon's Rest (FINALE 8)
// The biggest fight in the game. A moth the size of a house, under the broken moon. The bar is split 30 / 25 / 25 / 20:
//   Phase 1 Moonsilk     she hovers high. Moonfire the anchor pillars (two stand behind moth curtains: Shadow Dash in),
//                        each lit anchor snags a wing with its silver chain; then grapple a chain ring and PULL: she
//                        crashes down: GROUNDED!
//   Phase 2 Shadow Sea   the floor floods with ink. Dive into a shadow pool and pop out of its twin; she rests under a
//                        glowing platform: Ground Pound it, the moonlight flings her out: GROUNDED!
//   Phase 3 Moon's Ring  the summit is calm air and two wind rings circle it. She perches on a moon fragment to eat it:
//                        ride the wind to her and Moonfire her face: CHOKED! She tumbles down: GROUNDED!
//   The Heart moment     she swallows the last of the moon; everything goes black; the Ember Heart nearly goes out, and
//                        every friend Ash made lights it again (x4_story's scene: N4F.hook.heart(e,resume); a stand-in
//                        plays here when there is none). It cannot be failed.
//   Phase 4 Heartfire    she is down for good. Break the glowing cracks on her wings (swings, the Glaive, Heartfire).
// Difficulty (8.2): windows per phase 2/2/2, 3/3/2, 3/3/3; outside a window her damage taken is x0.25 / 0.15 / 0.1, and
// a phase cannot end without at least one window. On Easy each window takes at least one slice off the bar.
const N4N={C:{x:4500,y:85200},floor:600,wall:700,
  M:[1,0.7,0.45,0.2,0],
  anchors:[[4804,85504],[4804,84896],[4196,84896],[4196,85504]].map(([x,y],i)=>({i,x,y,heat:0,snag:false,lit:0,curtain:y<85200,col:null,pullT:0})),
  plats:[[4500,85500],[4760,85050],[4240,85050]].map(([x,y],i)=>({i,x,y,r:100,glow:0,crack:0})),
  rim:[[4500,84660],[4968,85470],[4032,85470]],
  frags:[[4500,85850],[5118,85401],[4882,84674],[4118,84674],[3882,85401]].map(([x,y],i)=>({i,x,y,gone:false,eat:0,growT:0,bob:rand(0,TAU)})),
  pools:[],streams:[],streamsUp:[],dark:0,darkTo:0,haz:null};
// the platform pools sit on the platform's inner edge (toward the middle); each rim pool links to the far platform
for(const P of N4N.plats){ const a=angTo(P.x,P.y,N4N.C.x,N4N.C.y); P.px=P.x+Math.cos(a)*68; P.py=P.y+Math.sin(a)*68; }
const N4N_LINK=[[0,0],[1,2],[2,1]];   // rim i -> platform j: north rim to the south platform, east rim to the west, west rim to the east
function n4nW(p){ return byDiff([2,2,2],[3,3,2],[3,3,3])[p-1]||2; }         // windows a phase takes
function n4nOut(){ return byDiff(0.25,0.15,0.1); }                             // damage taken outside a window
function n4nWin(){ return byDiff(8,6,4.5); }                                   // the grounded window
function n4nHit(e,n){ return n4fDmg(e,n*2.3); }                                // the bible's base numbers to BALANCE's level 23 hits
function n4nHurt(amt,sx,sy,kb,air){ if(!air) return hurtPlayer(amt,sx,sy,kb); const h=HURT_SRC; HURT_SRC='air'; try{ return hurtPlayer(amt,sx,sy,kb); } finally{ HURT_SRC=h; } }
function n4nSay(e,f,s,gap){ n4fSay(e,'nyxara',S(f,s),gap||9); }
// the bar mark a phase ends at, and the slice one window takes
function n4nMark(p){ return N4N.M[p]; }
function n4nSlice(p){ return (N4N.M[p-1]-N4N.M[p])/n4nW(p); }
defineFoe('n_nyxara',{boss:true,name:'Nyxara, the Night Mother',title:S('Eater of the Moon','Eater of the Moon'),short:'The Night Mother',
  lv:23,hp:15000,r:70,speed:120,dmg:20,value:5000,flying:true,kbRes:0,dcol:'150,130,220',
  speaker:{id:'nyxara',name:'Nyxara',col:'#b8a8e8'},
  init(e){ n4nInit(e); },
  ai:(e,dt,p)=>n4nAI(e,dt,p),
  onHurt:(e,amt,o)=>n4nOnHurt(e,amt,o),
  onDeath(e){ n4nDeath(e); },
  draw3d:(e,fl)=>n4nDraw(e,fl), draw2d:(e,fl)=>n4nDraw2(e,fl),
  sheet:[{state:'hover',alt:120,z:120,nPhase:1,label:'phase 1: high'},{state:'grounded',alt:0,nPhase:1,label:'grounded'},{state:'beamW',alt:120,z:120,nPhase:1,st:0.4,label:'moonbeam'},{state:'perch',alt:80,nPhase:3,label:'phase 3: eating'},
    {state:'choked',alt:0,nPhase:3,label:'choked'},{state:'grounded',alt:0,nPhase:4,cracks:1,label:'phase 4: cracks'},{state:'sweepW',alt:0,nPhase:4,st:0.3,label:'wing sweep'}]});
// the bosses here run their own windows: a stock stun (a pound, a whip crack) does not cut their moves short
{ const base=stunEnemy; stunEnemy=function(e,t){ if(e&&(e.type==='n_nyxara'||e.type==='n_echo_vor'||e.type==='n_echo_glaciar'||e.type==='n_echo_hush')) return; return base(e,t); }; }
if(typeof M3NOSTUN!=='undefined') M3NOSTUN.add('n_echo_hush');
function n4nInit(e){
  const C=N4N.C, F=G.flags;
  Object.assign(e,{alt:120,z:120,state:'hover',st:0,cd:2.4,win:0,wins:[0,0,0,0,0],winStart:0,nPhase:1,mode:'p1',noClip:true,leash:99999,orb:0,face:Math.PI/2,phases:[0.7,0.45,0.2],bph:0,
    pulls:0,cracks:[],sayT:0,tauntT:6,adds:0,trans:0,gale:0,n4open:false});
  e.homeX=C.x; e.homeY=C.y; N4N.e=e; N4F.nyx=e;
  e.p2rings=N4N.anchors.map(A=>({dx:0,dy:0,h:22,need:1.2,repeat:true,done:true,A,onPull:(r,q,info)=>{ if(info.taut&&Math.random()<0.25) emit(A.x,A.y-30,2,{col:'230,235,255',smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.2,zmax:2}); r.A.pullT=info.strain; },then:(r,q)=>n4nPulled(q,r.A)}));
  // the checkpoint (8.6): the phase Ash fell in (Hard: phase 1, or 4 once the Heart moment is done)
  let ck=F.n_phase|0; if(n4fHard()) ck=F.n_heart_done?4:1; if(ck===4&&!F.n_heart_done) ck=3; ck=clamp(ck||1,1,4);
  n4fBossIn(e);
  n4nPhaseGo(e,ck,true);
  if(ck>1) later(0.8,()=>setBanner(S('Checkpoint','Checkpoint'),[S('','') ,S('The Moonsilk','Phase 1'),S('The Shadow Sea','Phase 2'),S("The Moon's Ring",'Phase 3'),S('Heartfire!','Heartfire!')][ck],2.4));
}
// the phases: set up the arena for phase p (fresh = from a checkpoint or the first start)
function n4nPhaseGo(e,p,fresh){
  const F=N4F.fight, prev=e.nPhase; e.nPhase=p; e.bph=Math.min(3,p-1); e.mode='p'+p; e.win=0; e.n4open=false; e.mv=null; e.tele=null; e.wins[p]=0; e.sub=false; e.invuln=false; e.alpha=1;
  e.hp=Math.min(e.hp,e.maxHp*N4N.M[p-1]); if(fresh) e.hp=e.maxHp*N4N.M[p-1];
  G.flags.n_phase=n4fHard()?(G.flags.n_heart_done?4:1):p;
  // what each phase's arena needs
  n4nFlood(p===2); n4nPools(p===2); n4nStreams(p===3); n4nVeils(p===1); if(F) F.fly=p===3; if(typeof n4wCalm==='function') n4wCalm('cz_summit',p===3);
  for(const A of N4N.anchors){ A.snag=false; A.heat=0; A.lit=0; A.pullT=0; } e.pulls=0; for(const r of e.p2rings||[]) r.done=true;
  for(const f of N4N.frags){ f.gone=false; f.eat=0; f.growT=0; } N4N.darkTo=0;
  if(p===1){ e.alt=e.z=120; e.state='hover'; e.flying=true; e.cd=2; }
  if(p===2){ e.alt=e.z=0; e.state='swim'; e.flying=false; e.sub=true; e.restT=byDiff(6,5,4); e.x=N4N.C.x; e.y=N4N.C.y; }
  if(p===3){ e.alt=e.z=90; e.state='fly'; e.flying=true; e.perch=null; e.toFrag=null; e.choke=0; e.cd=2.5; }
  if(p===4){ e.alt=e.z=0; e.state='grounded'; e.flying=false; e.x=N4N.C.x; e.y=N4N.C.y-30; e.face=Math.PI/2; n4nCracksMake(e); N4F.heartfire=true; G.flags.n_heart_done=1; n4nHeirBig(true); }
  n4fHook('phase','n_summit',p,e);
  const T=N4N_HINT[p]; if(p===4&&n4fS()){} else if(T&&!fresh) later(0.4,()=>{ if(G.boss===e&&!e.dead) setBanner(T[0],T[1],3); }); else if(T&&fresh&&p===1) later(1.2,()=>{ if(G.boss===e&&!e.dead) setBanner(T[0],T[1],3.2); });
}
const N4N_HINT={1:[S('The Moonsilk','The Moonsilk'),S('Light the moon anchors with Moonfire. Then grapple the chains to pull her down!','Moonfire the pillars. Grapple the chains!')],
  2:[S('The Shadow Sea','The Shadow Sea'),S('Dive into a shadow pool to reach the glowing platform. Ground Pound it!','Dive in a pool. Pound the glowing platform!')],
  3:[S("The Moon's Ring","The Moon's Ring"),S('Fly! Ride the wind to the piece she is eating. Moonfire in her face!','Fly to her. Moonfire her face!')],
  4:[S('Heartfire!','Heartfire!'),S('Break the glowing cracks on her wings!','Hit the glowing cracks!')]};
// a window: she is down on the floor (GROUNDED!), every hit lands in full
function n4nGround(e,x,y,why){ e.win=n4nWin(); e.winStart=e.hp; e.n4open=true; e.state='grounded'; e.alt=e.z=0; e.flying=false; e.sub=false; e.mv=null; e.tele=null; if(x!=null){ e.x=x; e.y=y; }
  shake(14); SFX.play('boom'); flashA=Math.max(flashA,0.25); flashCol='230,220,255';
  emit(e.x,e.y,40,{col:'200,190,255',glow:false,smin:80,smax:300,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:6,drag:1});
  ftext(e.x,e.y-130,S('GROUNDED!','GROUNDED!'),'#ffe066',26); n4fEv('grounded'); if(why) n4nSay(e,why[0],why[1],2); N4F.cue={x:e.x,y:e.y-60}; }
function n4nWinEnd(e){ const p=e.nPhase; e.wins[p]=(e.wins[p]||0)+1; e.n4open=false;
  // Easy: every window takes at least its slice off the bar
  if(n4fEasy()){ const want=e.maxHp*(N4N.M[p-1]-n4nSlice(p)*e.wins[p]); if(e.hp>want+0.5){ e.hp=Math.max(e.maxHp*N4N.M[p]+0.5,want); ftext(e.x,e.y-110,S('The moonlight hurts her!','Ouch for her!'),'#e8dcff',15); } }
  n4nPhaseCheck(e); }
// a phase ends when its share of the bar is gone (and it had at least one window)
function n4nPhaseCheck(e){ const p=e.nPhase; if(p>=4||e.trans) return; if(e.hp<=e.maxHp*N4N.M[p]+0.6&&(e.wins[p]||0)>=1) n4nTransition(e,p); }
// between phases: a short scripted moment (her lines as bubbles), she cannot be hurt
const N4N_TRANS={
  1:[['nyxara',`Enough of the floor. Let the sea come up and tuck you in.`,`No more floor. Let the dark sea come up.`],['narr',`Ink pours up out of the glass, and the summit floods with shadow. Only the rim and three pale platforms stay dry.`,`Black ink floods the floor. Only the edge and three platforms stay dry.`]],
  2:[['nyxara',`Fine. If you won't sleep, I will finish my supper.`,`Fine. I will finish my supper.`],['narr',`The ink drains up into the sky like rain falling the wrong way. Nyxara rises toward the last floating pieces of the moon.`,`The ink goes up into the sky. Nyxara flies to the last moon pieces.`],['ash',`She's eating the last pieces! Wings, Ash. Ride the wind!`,`She is eating the last pieces! Fly! Ride the wind!`]],
  3:[['narr',`Nyxara swallows the last piece of the moon.`,`Nyxara eats the last piece of the moon.`]]};
function n4nTransition(e,p){
  e.trans=1; e.win=0; e.n4open=false; e.mv=null; e.tele=null; e.invuln=true; e.hp=Math.min(e.hp,e.maxHp*N4N.M[p]); e.transT=p===3?2.2:3.2; e.transTo=p+1; e.state=p===3?'gulp':'rise';
  for(const z of G.fz||[]) if(z.k==='n4fmark'||z.k==='n4nring') z.done=true;
  G.projectiles=G.projectiles.filter(q=>q.owner!=='enemy');
  if(e.win>0) e.win=0; shake(10); SFX.play('roar');
  const L=N4N_TRANS[p]; if(L&&!n4fS()) for(const [w,f,s] of L) taunt(w,S(f,s));   // x4_story plays these as a scene (n4sPhaseStart)
  if(p===1){ e.alt=e.z=0; } if(p===2){ n4nFlood(false); } if(p===3){ e.x=N4N.C.x; e.y=N4N.C.y-60; e.alt=e.z=80; }
}
function n4nTransTick(e,dt){ e.transT-=dt; e.dx=e.dy=0; e.invuln=true;
  if(e.state==='rise'){ e.alt=e.z=lerp(e.z,e.transTo===2?0:120,Math.min(1,dt*1.5)); }
  if(e.state==='gulp'){ e.alt=e.z=lerp(e.z,60,Math.min(1,dt*2)); for(const f of N4N.frags) if(!f.gone){ f.gone=true; emit(f.x,f.y-80,20,{col:'230,235,255',smin:40,smax:160,lmin:.3,lmax:.7,zmin:1.4,zmax:3}); } N4N.darkTo=0.9; }
  if(e.transT>0) return;
  const to=e.transTo;
  if(to===4){ e.trans=0; e.invuln=false; n4nHeart(e); return; }
  // the story's scene for the new phase (a dialogue: the fight waits), then the phase
  if(n4fS()&&typeof n4sPhaseStart==='function'&&!e.transScene){ e.transScene=true; let went=false; const go=()=>{ if(went) return; went=true; e.transScene=false; e.trans=0; e.invuln=false; if(!e.dead&&G.boss===e) n4nPhaseGo(e,to,false); };
    try{ n4sPhaseStart(to,go); }catch(err){ console.error(err); go(); } return; }
  if(e.transScene) return;
  e.trans=0; e.invuln=false; n4nPhaseGo(e,to,false);
}
// a pull on a chain ring (Grapple Tail): enough pulls and she crashes down
function n4nPulled(e,A){ if(e.nPhase!==1||e.win>0||e.trans) return; A.snag=false; e.pulls=(e.pulls||0)+1; for(const r of e.p2rings) if(r.A===A) r.done=true; n4fEv('pull');
  shake(8); SFX.play('boom'); emit(A.x,A.y-40,20,{col:'230,235,255',smin:60,smax:200,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
  const need=n4nPullNeed(e);
  if(e.pulls>=need){ e.pulls=0; for(const B of N4N.anchors){ B.snag=false; B.heat=0; } for(const r of e.p2rings) r.done=true; e.alt=e.z=0; n4nGround(e,N4N.C.x,N4N.C.y-20,['You tied me DOWN? How rude!','You tied me down? Rude!']); }
  else ftext(A.x,A.y-60,S('PULL! One more!','One more!'),'#ffe066',16); }
function n4nPullNeed(e){ let n=byDiff(1,2,2); if(n4fAllyHere('vesper')&&n>1) n--; return n; }
function n4nSnagNeed(){ return byDiff(2,3,4); }
// the fight's own lifecycle (walls rising, reset on a fall, the win)
N4FM.n_summit={
  begin(){ N4N.darkTo=0; N4N.dark=0; for(const A of N4N.anchors){ A.snag=false; A.heat=0; A.lit=0; if(!A.col) A.col=addCol({t:'c',x:A.x,y:A.y,r:26}); A.col.off=false; } N4F.moonFill=0; },
  tick(dt,e){ if(e) n4nArena(dt,e); },
  reset(){ n4nCleanup(); },
  win(){ n4nCleanup(); if(N4F.fall) N4F.fall.fade=true; },
  ground(t){ n4nGroundDraw(t); },
  tall(list){ n4nTall(list); },
  air(){ n4nAir(); }
};
function n4nCleanup(){ n4nFlood(false); n4nPools(false); n4nStreams(false); n4nVeils(false); n4nLights(null); N4N.streamsUp=[]; N4N.dim=0; if(typeof n4wCalm==='function') n4wCalm('cz_summit',false); N4N.darkTo=0; N4N.dark=0; N4F.heartfire=false; n4nHeirBig(false); G.flags.n_heart_on=0;
  for(const A of N4N.anchors){ A.snag=false; A.heat=0; if(A.col) A.col.off=true; } N4F.ward=0; if(N4N.heartUI) N4N.heartUI=null; N4N.e=null; }
defineBoss('n_summit',{boss:'n_nyxara',at:{x:4500,y:85200,r:600,name:S("The Moon's Rest","The Moon's Rest"),level:23},stage:'n_nyxara',open:()=>n4fStageOK('n_nyxara'),
  arena:{shape:'ring',r:N4N.wall,style:'n4glass',glow:'200,180,255'},flyOK:false,music:'n_nyxara',spawn:{dx:0,dy:-120},
  onStart(){ n4fFightStart('n_summit'); }, onReset(){ n4fFightReset('n_summit'); }, onWin(){ n4fWon('n_summit'); }});
const n4nIntro=()=>[
  n4fL('narr',`The summit is a wide round floor of pale glass, right under the broken moon.`,`The top is a round glass floor under the broken moon.`),
  n4fL('narr',`Something enormous is folded over the edge of the moon, like a blanket over a lamp. It unfolds.`,`Something huge is wrapped over the moon. It unfolds.`),
  n4fL('narr',`Wings. Wings as wide as a town square, grey and soft as dust, with two pale moons painted on them. A moth the size of a house.`,`Wings as big as a town! A moth the size of a house.`),
  n4fL('nyxara',`There you are. Little ember. Look how big you've grown.`,`There you are, little ember. How big you are.`),
  n4fL('ash',`Are you... my great-great-great...`,`Are you my great-great-great...`),
  n4fL('nyxara',`No.`,`No.`), n4fL('ash',`Oh, thank goodness.`,`Oh, good.`),
  n4fL('nyxara',`I am much older than your family, dear. I was here when the moon was new.`,`I am older than your family. I was here when the moon was new.`),
  n4fL('nyxara',`And you brought me your heart. Whole again. Your mother did such lovely work. A cracked heart can't burn, you see. A whole one can.`,`You brought me the Heart. Whole again. Now it can burn.`),
  n4fL('ash',`You wanted me to fix it. This whole time.`,`You wanted me to fix it. All along.`),
  n4fL('nyxara',`Shh. Shh. Don't be sad. Give it to me, and I'll make it burn black. Then the sun will go out, and the night will never end, and nobody, nobody will ever have to say goodbye again.`,`Give it to me. I will make it burn black. Then night never ends, and nobody says goodbye.`),
  n4fL('ash',`That's not a night. That's just a really long nap with no breakfast.`,`That is just a long nap with no breakfast!`),
  n4fL('ash',`Give the moon back, Nyxara.`,`Give the moon back, Nyxara.`),
  n4fL('nyxara',`Hush now, little ember. Go to sleep.`,`Hush, little ember. Go to sleep.`)];
n4nIntro.short=()=>[n4fL('nyxara',`Back again, little ember? You must be so tired.`,`Back again? You must be so tired.`),n4fL('ash',`Not tired. Not even a little. ...A little.`,`Not tired! ...A little.`)];

// ---------- Nyxara's brain
function n4nAI(e,dt,p){
  e.dx=e.dy=0; e.noClip=true; e.stun=0; e.inArena=N4N;   // she flies over her own glass walls (to the moon pieces at r 650)
  if(e.trans){ n4nTransTick(e,dt); return; }
  if(e.nPhase<4&&e.mode!=='heart'&&!(e.win>0)) n4nPhaseCheck(e);
  if(e.trans) return;
  if(e.mode==='heart'){ e.state='gone'; e.invuln=true; e.alpha=0.02; return; }
  // her taunts now and then
  e.tauntT-=dt; if(e.tauntT<=0&&!e.win){ e.tauntT=rand(9,14); const L=N4N_TAUNT[e.nPhase]; if(L) taunt('nyxara',pick(L)); }
  if(e.win>0){ e.win-=dt; e.state=e.state==='dizzy'?'dizzy':'grounded'; e.n4open=true; N4F.cue={x:e.x,y:e.y-60}; if(e.nPhase===2) e.sub=false;
    if(Math.random()<dt*6) emit(e.x+rand(-60,60),e.y-20,1,{col:'230,220,255',glow:false,ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.5,lmax:1,zmin:1.5,zmax:3,rise:20});
    if(e.win<=0){ e.win=0; n4nWinEnd(e); if(!e.trans) n4nRise(e); } return; }
  if(e.rise>0){ e.rise-=dt; e.invuln=false; if(e.nPhase===1){ e.alt=e.z=lerp(e.z,120,Math.min(1,dt*2.4)); e.state='rise'; } else if(e.nPhase===2){ e.alt=e.z=0; e.state='sink'; e.alpha=clamp(e.rise/0.6,0.15,1); if(e.rise<=0){ e.sub=true; e.alpha=1; e.state='swim'; } }
    if(e.rise<=0) e.flying=e.nPhase!==2; return; }
  if(e.nPhase===1) n4nP1(e,dt,p); else if(e.nPhase===2) n4nP2(e,dt,p); else if(e.nPhase===3) n4nP3(e,dt,p); else n4nP4(e,dt,p);
}
const N4N_TAUNT={
  1:[S('Shh, shh.','Shh, shh.'),S('Why fight? Sleep is so soft.','Why fight? Sleep is soft.'),S("There's nowhere to hide from the moon, dear. Oh. Except behind that pillar. Clever.",'You cannot hide. Oh. Except behind that pillar.')],
  2:[S("Under the dark it's quiet. Come down. Stay.",'Under the dark it is quiet. Stay.')],
  3:[S('Mmm. Crunchy.','Mmm. Crunchy.'),S('The moon is MINE. I have eaten nearly all of it.','The moon is MINE.')],
  4:[S("Stop! You're letting it all OUT!",'Stop! You are letting it out!'),S("It's leaking! My moon is LEAKING!",'My moon is leaking!'),S('Everyone leaves. EVERYONE LEAVES.','Everyone leaves!')]};
// after a window: she tears free (phase 1), sinks back under the ink (2), or flies off to the next piece (3)
function n4nRise(e){ e.state='rise'; e.rise=e.nPhase===2?0.6:1.0; e.cd=byDiff(2.2,1.6,1.2); if(e.nPhase===1){ for(const A of N4N.anchors){ A.snag=false; A.heat=0; } for(const r of e.p2rings) r.done=true; e.pulls=0; n4nSay(e,'Ow. My poor wings. Again, then.','Ow. Again, then.',4); }
  if(e.nPhase===2){ e.restT=byDiff(11,9,7); } if(e.nPhase===3){ e.perch=null; e.toFrag=null; e.choke=0; e.flying=true; } }
// the attack picker (between the mechanics): weighted moves, every 2.6 / 2.0 / 1.5 s
function n4nPick(e,list){ let tot=0; for(const m of list) tot+=m[1]; let r=Math.random()*tot; for(const m of list){ r-=m[1]; if(r<=0) return m[0]; } return list[list.length-1][0]; }
function n4nCdTick(e,dt){ e.cd-=dt*foeDiff().atk; return e.cd<=0&&!e.act; }
function n4nCd(e){ e.cd=byDiff(2.6,2.0,1.5)*rand(0.85,1.15); }
function n4nCap(){ return byDiff(3,5,6); }
function n4nMoths(e,n,fly){ const have=countType('n_mothling'), room=Math.max(0,n4nCap()-have); n=Math.min(n,room); for(let i=0;i<n;i++){ const s=spotNear(e.x,e.y,90,220); spawnRune('n_mothling',s.x,s.y,{aggro:true,level:23},0.5+i*0.12); } return n; }
// ===== phase 1: high over the middle; the anchors; Moonbeam Sweep, Dust Rain, Lullaby, the moth swarm
function n4nP1(e,dt,p){
  const C=N4N.C; e.orb=(e.orb||0)+dt*0.25; const tx=C.x+Math.cos(e.orb)*90, ty=C.y-40+Math.sin(e.orb)*50; steer(e,tx,ty,60); e.alt=e.z=lerp(e.z,120,Math.min(1,dt*2)); e.flying=true; e.face=turnTo(e.face,angTo(e.x,e.y,p.x,p.y),1.5*dt);
  // the anchors: Moonfire on a moonstone (0.8 s) flings its chain up onto a wing
  let snag=0; for(const A of N4N.anchors) if(A.snag) snag++;
  const need=n4nSnagNeed();
  for(const A of N4N.anchors){ A.lit=Math.max(0,A.lit-dt);
    if(A.snag) continue;
    if(n4fMoonAt(A.x,A.y-60,20)){ if(A.curtain&&dist(p.x,p.y,A.x,A.y)>120){ if(!(A.nag>G.time)){ A.nag=G.time+3; ftext(A.x,A.y-90,S('Moths are in the way! Shadow Dash through the curtain!','Moths! Dash through!'),'#e0d0ff',13); } continue; }
      A.heat+=dt; A.lit=0.3; if(Math.random()<dt*20) emit(A.x,A.y-60,1,{col:'214,226,255',smin:20,smax:80,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6});
      if(A.heat>=0.8){ A.snag=true; A.heat=0; snag++; SFX.play('cast'); shake(4); n4fEv('snag'); emit(A.x,A.y-60,24,{col:'230,235,255',smin:60,smax:220,lmin:.3,lmax:.6,zmin:1.4,zmax:3});
        ftext(A.x,A.y-100,snag>=need?S('Snagged! Now grapple a chain and PULL!','Snagged! Grapple and PULL!'):S('Snagged! Light another anchor!','Snagged! Light another!'),'#e8eeff',15);
        if(snag>=need) n4fTip('pull',S('Pull her down!','Pull her down!'),S('Grapple a glowing chain ring at the foot of a pillar, hold the button and walk away from it to PULL.','Grapple a chain ring. Hold and walk away!')); } }
    else A.heat=Math.max(0,A.heat-dt*0.4); }
  const ready=snag>=need; for(const r of e.p2rings){ r.dx=r.A.x-e.x; r.dy=r.A.y+8-e.y; r.done=!(ready&&r.A.snag); }
  // Pip: the next dark anchor (or the chain to pull)
  let best=null, bd=1e9; for(const A of N4N.anchors){ if(ready?!A.snag:A.snag) continue; const d=dist(p.x,p.y,A.x,A.y); if(d<bd){ bd=d; best=A; } } N4F.cue=best?{x:best.x,y:best.y-(ready?20:80),arrow:false}:null;
  // her attacks
  if(n4nAct(e,dt,p)) return;
  if(n4nCdTick(e,dt)){ n4nCd(e); const k=n4nPick(e,[['beam',3],['dust',2.5],['lull',2],['swarm',countType('n_mothling')<n4nCap()?1.5:0]]);
    if(k==='beam') n4nBeamStart(e,p); else if(k==='dust') n4nDust(e,p); else if(k==='lull') n4nLullaby(e); else n4nSwarmStart(e); }
}
// a running attack (e.act: {k, t, ...}); returns true while it holds her
function n4nAct(e,dt,p){ const A=e.act; if(!A) return false; A.t+=dt;
  if(A.k==='beam') return n4nBeamTick(e,A,dt,p);
  if(A.k==='swarm'){ e.state='shiver'; if(A.t>=A.dur){ n4nMoths(e,byDiff(3,4,5)); e.act=null; } return true; }
  if(A.k==='jaws') return n4nJawsTick(e,A,dt,p);
  if(A.k==='gale') return n4nGaleTick(e,A,dt,p);
  if(A.k==='ecl') return n4nEclTick(e,A,dt,p);
  if(A.k==='sweep'||A.k==='bite'||A.k==='tornado') return n4nP4Act(e,A,dt,p);
  if(A.t>=(A.dur||0.5)){ e.act=null; } return true; }
// Moonbeam Sweep: a pale line from her (1.0 s), then it sweeps 120 degrees in 2.2 s; the anchor pillars stop it
function n4nBeamStart(e,p){ const dir=Math.random()<0.5?1:-1, a0=angTo(e.x,e.y,p.x,p.y)-dir*Math.PI/3, dur=n4fTele(1.0); e.act={k:'beam',t:0,dur,a:a0,dir,sw:2.2,hitT:0}; e.state='beamW';
  n4fMark({shape:'line',x:e.x,y:e.y,ang:a0,len:650,w:44,dur,col:'230,230,255',owner:e,follow:()=>({x:e.x,y:e.y,ang:e.act&&e.act.k==='beam'?e.act.a:a0})}); SFX.play('warn'); }
function n4nBeamEnd(x,y,a,L){ // the beam stops at the first anchor pillar in its way
  let best=L; for(const A of N4N.anchors){ const dx=A.x-x, dy=A.y-y, u=dx*Math.cos(a)+dy*Math.sin(a); if(u<0||u>best) continue; const v=Math.abs(-dx*Math.sin(a)+dy*Math.cos(a)); if(v<30) best=Math.max(0,u-Math.sqrt(Math.max(0,30*30-v*v))); } return best; }
function n4nBeamTick(e,A,dt,p){
  if(A.t<A.dur){ e.state='beamW'; return true; }
  const k=(A.t-A.dur)/A.sw; if(k>=1){ e.act=null; e.state='hover'; return false; }
  e.state='beam'; A.a+=A.dir*(Math.PI*2/3)/A.sw*dt; const L=n4nBeamEnd(e.x,e.y,A.a,650); A.L=L;
  if(!p.dead&&!n4fUp()&&!n4fBur()&&segD(p.x,p.y,e.x,e.y,e.x+Math.cos(A.a)*L,e.y+Math.sin(A.a)*L)<22+p.r*0.6) hurtPlayer(n4nHit(e,20),e.x+Math.cos(A.a)*L*0.5,e.y+Math.sin(A.a)*L*0.5,200);
  // safe behind a pillar (a word the first time)
  if(L<640&&!N4F.said.beamsafe){ const ex=e.x+Math.cos(A.a)*L, ey=e.y+Math.sin(A.a)*L; if(dist(ex,ey,p.x,p.y)<120){ N4F.said.beamsafe=1; ftext(p.x,p.y-40,S('Safe behind the pillar!','Safe!'),'#e8f0ff',14); } }
  if(Math.random()<dt*30){ const u=Math.random()*L; emit(e.x+Math.cos(A.a)*u,e.y+Math.sin(A.a)*u,1,{col:'235,235,255',smin:20,smax:70,lmin:.2,lmax:.4,zmin:1.4,zmax:2.6}); }
  return true; }
// Dust Rain: circles (7, Easy 5, Hard 9) where sleepy dust lands; it leaves drowsy puddles
function n4nDust(e,p){ const n=byDiff(5,7,9), dur=n4fTele(1.1); e.state='shiver'; SFX.play('warn');
  for(let i=0;i<n;i++){ const a=rand(0,TAU), r=i?rand(60,240):0, x=p.x+Math.cos(a)*r, y=p.y+Math.sin(a)*r;
    n4fMark({x,y,r:60,dur:dur+i*0.05,col:'215,210,250',fire:z=>{ const pp=player; if(!pp.dead&&!n4fUp()&&dist(z.x,z.y,pp.x,pp.y)<60+pp.r*0.5) hurtPlayer(n4nHit(e,16),z.x,z.y,80); fzAdd('n4ndrowse',{x:z.x,y:z.y,r:56,life:4}); emit(z.x,z.y,14,{col:'225,220,250',glow:false,smin:30,smax:120,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:8,drag:2}); }}); } }
FZK.n4ndrowse={ tick(z,dt){ const p=player; z.a=clamp(Math.min(z.t/0.3,(z.life-z.t)/0.6),0,1); if(!p.dead&&!n4fUp()&&dist(p.x,p.y,z.x,z.y)<z.r) p.slowT=Math.max(p.slowT||0,0.3); },
  drawG(z){ ctx.save(); ctx.globalAlpha=(z.a||0)*0.8; ctx.fillStyle='rgba(200,195,240,.5)'; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r,z.r*0.7,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.6)'; for(let i=0;i<5;i++){ const a=i*1.3+G.time*0.6; ctx.beginPath(); ctx.arc(z.x+Math.cos(a)*z.r*0.5,z.y+Math.sin(a)*z.r*0.35,1.6,0,TAU); ctx.fill(); } ctx.restore(); } };
// Lullaby: soft notes rise from her shadow (0.8 s), then a ring rolls out: jump it, or get drowsy
function n4nLullaby(e){ const dur=n4fTele(0.8); e.state='sing'; e.act={k:'lull',t:0,dur:dur}; SFX.play('cast');
  for(let i=0;i<8;i++) later(i*0.09,()=>emit(e.x+rand(-60,60),e.y-10,1,{col:'230,220,255',ang:-Math.PI/2,spread:0.4,smin:40,smax:90,lmin:.6,lmax:1,zmin:2,zmax:3}));
  later(dur,()=>{ if(e.dead||G.boss!==e) return; fzAdd('n4nring',{x:e.x,y:e.y,rad:40,speed:240,thick:26,max:900,dmg:n4nHit(e,10),drowsy:2.5,col:'220,200,255'}); }); }
// a rolling ring (Lullaby, Ink Wave): jump it
FZK.n4nring={ tick(z,dt){ z.rad+=z.speed*dt; if(z.rad>z.max){ z.done=true; return; } const p=player; if(z.hit||p.dead||n4fUp()||n4fBur()||n4fDiving()) return;
    if(Math.abs(dist(p.x,p.y,z.x,z.y)-z.rad)<z.thick/2+p.r*0.6){ if(hurtPlayer(z.dmg,z.x,z.y,180)){ z.hit=true; if(z.drowsy){ p.slowT=Math.max(p.slowT||0,z.drowsy); N4N.dim=Math.max(N4N.dim||0,z.drowsy); ftext(p.x,p.y-40,S('So sleepy...','Sleepy...'),'#e0d8ff',14); } } } },
  drawG(z){ ctx.save(); ctx.strokeStyle=`rgba(${z.col||'220,200,255'},.35)`; ctx.lineWidth=z.thick+8; ctx.beginPath(); ctx.arc(z.x,z.y,z.rad,0,TAU); ctx.stroke(); ctx.strokeStyle=`rgba(${z.col||'220,200,255'},.9)`; ctx.lineWidth=z.thick*0.45; ctx.stroke();
    ctx.setLineDash([10,14]); ctx.lineDashOffset=-G.time*60; ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(z.x,z.y,z.rad-z.thick*0.2,0,TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); } };
function n4nSwarmStart(e){ e.act={k:'swarm',t:0,dur:n4fTele(0.7)}; e.state='shiver'; emit(e.x,e.y-e.z,20,{col:'200,190,230',glow:false,smin:40,smax:150,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:6,drag:1}); SFX.play('warn'); }
// ===== phase 2: the Shadow Sea (the flood, the pools, the platforms; Night Jaws, Ink Wave, Moth Bubbles)
function n4nFloodTest(x,y){ const C=N4N.C, d=dist(x,y,C.x,C.y); if(d>=520) return false; if(typeof P4!=='undefined'&&P4.mv&&P4.mv.kind==='pool') return false;
  const ice=n4fAllyHere('glaciar'); for(const P of N4N.plats) if(dist(x,y,P.x,P.y)<P.r+(ice?30:0)) return false; if(ice&&d>400&&d<460) return false; return true; }
function n4nFlood(on){ if(typeof n4wHazard!=='function') return; if(on){ N4N.flood=1; n4wHazard({id:'n4f_flood',kind:'ink',bb:[3970,84670,5030,85730],test:n4nFloodTest,on:()=>!!N4N.flood}); }
  else { N4N.flood=0; if(typeof N4W!=='undefined') N4W.haz=N4W.haz.filter(h=>h.id!=='n4f_flood'); } }
function n4nPools(on){ if(typeof p4Add!=='function') return;
  if(on&&!N4N.pools.length){ const L=[]; N4N.plats.forEach((P,j)=>L.push(p4Add('pool',{id:'n4f_np'+j,x:P.px,y:P.py,r:40,kind:'shadow',link:null})));
    N4N.rim.forEach(([x,y],i)=>{ const j=N4N_LINK[i][1], o=p4Add('pool',{id:'n4f_nr'+i,x,y,r:44,kind:'shadow',link:'n4f_np'+j}); L.push(o); L[j].link='n4f_nr'+i; }); N4N.pools=L; }
  if(!on&&N4N.pools.length){ for(const o of N4N.pools){ let i=LANDMARKS.indexOf(o); if(i>=0) LANDMARKS.splice(i,1); i=P4.out.indexOf(o); if(i>=0) P4.out.splice(i,1); } N4N.pools=[]; } }
function n4nOnPlat(x,y){ for(const P of N4N.plats) if(dist(x,y,P.x,P.y)<P.r+8) return P; return null; }
function n4nP2(e,dt,p){
  const C=N4N.C; e.sub=!(e.act&&e.act.k==='jaws'&&e.act.up); e.flying=false; e.alt=e.z=0;
  if(e.restP){ const P=e.restP; e.restT2-=dt; e.state='rest'; e.x=lerp(e.x,P.x,Math.min(1,dt*4)); e.y=lerp(e.y,P.y,Math.min(1,dt*4)); P.glow=1; N4F.cue={x:P.x,y:P.y-30};
    if(e.restT2<=0){ e.restP=null; P.glow=0; e.restT=byDiff(11,9,7); n4nSay(e,'Too slow, little ember.','Too slow!',6); } return; }
  for(const P of N4N.plats) P.glow=Math.max(0,P.glow-dt*2);
  // swim toward Ash (under the ink), and now and then to a platform to rest under it
  e.restT=(e.restT==null?6:e.restT)-dt*foeDiff().atk;
  if(e.restT<=0&&!e.act){ let P=N4N.plats[(Math.random()*3)|0]; const here=n4nOnPlat(p.x,p.y); if(P===here) P=N4N.plats[(P.i+1)%3]; e.restGo=P; e.restT=99; }
  if(e.restGo){ const P=e.restGo; steer(e,P.x,P.y,320); e.state='swim'; if(dist(e.x,e.y,P.x,P.y)<20){ e.restGo=null; e.restP=P; e.restT2=byDiff(5,4,3); SFX.play('warn'); taunt('pip',S('MIP! MIP!','MIP! MIP!'));
      n4fTip('plat',S('She is resting under a platform!','Under the platform!'),S('Dive into the pool on the far rim: it comes out on that platform. Then Ground Pound it!','Dive in a pool. Pound the glowing platform!')); } return; }
  const d=dist(p.x,p.y,C.x,C.y), a=angTo(C.x,C.y,p.x,p.y), r=Math.min(470,Math.max(120,d-60)); steer(e,C.x+Math.cos(a)*r,C.y+Math.sin(a)*r,150); e.state='swim';
  // Pip: the pool that leads to the platform nearest Ash's way
  if(!e.restP){ let best=null, bd=1e9; for(const o of N4N.pools){ const dd=dist(p.x,p.y,o.x,o.y); if(dd<bd){ bd=dd; best=o; } } N4F.cue=best?{x:best.x,y:best.y-20}:null; }
  if(n4nAct(e,dt,p)) return;
  if(n4nCdTick(e,dt)){ n4nCd(e); const k=n4nPick(e,[['jaws',3],['wave',2],['bubbles',2]]);
    if(k==='jaws'){ const dur=n4fTele(1.0); e.act={k:'jaws',t:0,dur,x:p.x,y:p.y,up:false}; n4fMark({x:p.x,y:p.y,r:95,dur,col:'150,100,255'}); SFX.play('warn'); }
    else if(k==='wave'){ e.state='swell'; e.act={k:'wave',t:0,dur:n4fTele(0.7)}; later(n4fTele(0.7),()=>{ if(e.dead||G.boss!==e||e.nPhase!==2) return; fzAdd('n4nring',{x:e.x,y:e.y,rad:30,speed:260,thick:24,max:760,dmg:n4nHit(e,14),col:'150,100,255'}); SFX.play('whoosh'); }); }
    else { const n=byDiff(2,3,4); e.act={k:'bub',t:0,dur:n4fTele(0.6)}; later(n4fTele(0.6),()=>{ if(e.dead||G.boss!==e) return; for(let i=0;i<n;i++) shoot(e.x+rand(-30,30),e.y+rand(-20,20),angTo(e.x,e.y,player.x,player.y)+rand(-0.8,0.8),170,10,n4nHit(e,12),'orb','enemy',{homing:1.3,life:6}); SFX.play('pop'); }); } }
}
// Night Jaws: a circle under Ash, then she bursts up through it (and is open for a moment)
function n4nJawsTick(e,A,dt,p){ if(A.t<A.dur){ e.x=lerp(e.x,A.x,Math.min(1,dt*3)); e.y=lerp(e.y,A.y,Math.min(1,dt*3)); return true; }
  if(!A.up){ A.up=true; e.x=A.x; e.y=A.y; e.sub=false; e.state='jaws'; shake(9); SFX.play('boom'); emit(A.x,A.y,30,{col:'60,30,110',glow:false,ang:-Math.PI/2,spread:1.2,smin:80,smax:260,lmin:.3,lmax:.7,zmin:2,zmax:5,rise:-200});
    if(!p.dead&&!n4fUp()&&dist(p.x,p.y,A.x,A.y)<95+p.r*0.5) hurtPlayer(n4nHit(e,24),A.x,A.y,400); }
  if(A.t>A.dur+0.6){ e.act=null; e.sub=true; e.state='swim'; } return true; }
// a Ground Pound on the platform she rests under: the moon-glass cracks, the moonlight flings her out
function n4nOnPound(info){ const e=N4N.e; if(!e||e.dead||G.boss!==e) return;
  if(e.nPhase===2&&e.restP){ const P=e.restP; if(dist(info.x,info.y,P.x,P.y)<P.r+30){ P.crack=1; P.glow=0; e.restP=null; const a=angTo(N4N.C.x,N4N.C.y,P.x,P.y);
      for(let i=0;i<30;i++) emit(P.x+rand(-60,60),P.y+rand(-40,40),1,{col:'235,240,255',ang:-Math.PI/2,spread:0.3,smin:200,smax:500,lmin:.4,lmax:.8,zmin:2,zmax:4});
      n4nGround(e,P.x+Math.cos(a)*40,P.y+Math.sin(a)*30,['Ow! That was the MOON! You hit me with the MOON!','Ow! You hit me with the MOON!']); } } }
if(typeof p3OnPound==='function') p3OnPound(n4nOnPound);
// ===== phase 3: the Moon's Ring (calm air, two wind rings, the fragments)
function n4nStreams(on){ if(typeof WIND==='undefined'||typeof P3==='undefined') return; const C=N4N.C;
  if(on&&!N4N.streams.length){ const ring=(R,dir,spd,id)=>{ const pts=[]; for(let i=0;i<=96;i++){ const a=Math.PI/2+dir*i/48*TAU; pts.push([C.x+Math.cos(a)*R,C.y+Math.sin(a)*R]); } return WIND.stream({id,pts,w:70,speed:spd,lv:[8,8],any:true,n4loop:true}); };
    N4N.streams=[ring(650,-1,420,'n4f_nouter'),ring(330,1,360,'n4f_ninner')]; }
  if(!on&&N4N.streams.length){ P3.streams=P3.streams.filter(o=>!N4N.streams.includes(o)); if(P3.ride&&N4N.streams.includes(P3.ride.o)) try{ p3RideOff(player,'drop'); }catch(err){} N4N.streams=[]; } }
function n4nNextFrag(e){ let best=null, bd=-1; for(const f of N4N.frags){ if(f.gone) continue; const d=dist(player.x,player.y,f.x,f.y); if(d>bd){ bd=d; best=f; } } return best; }
function n4nFace(e){ return {x:e.x+Math.cos(e.face)*64,y:e.y+Math.sin(e.face)*40-(e.z||0)*0.2}; }
function n4nP3(e,dt,p){
  const C=N4N.C; e.flying=true;
  // the pieces grow back (Easy after 20 s); there are always at least two to eat
  let left=0; for(const f of N4N.frags){ if(f.gone){ f.growT+=dt; if(n4fEasy()&&f.growT>20){ f.gone=false; f.eat=0; } } else left++; }
  if(left<2){ const f=N4N.frags.filter(q=>q.gone).sort((a,b)=>b.growT-a.growT)[0]; if(f){ f.gone=false; f.eat=0; } }
  if(e.tumble){ const T=e.tumble; T.t+=dt; const u=clamp(T.t/0.8,0,1); e.x=lerp(T.x0,T.x1,u); e.y=lerp(T.y0,T.y1,u); e.alt=e.z=lerp(T.z0,0,u)+Math.sin(u*Math.PI)*30; e.state='choked';
    if(u>=1){ e.tumble=null; n4nGround(e,T.x1,T.y1,null); } return; }
  if(e.perch){ const f=e.perch; e.state='perch'; e.x=lerp(e.x,f.x,Math.min(1,dt*5)); e.y=lerp(e.y,f.y,Math.min(1,dt*5)); e.alt=e.z=lerp(e.z,80,Math.min(1,dt*3)); e.face=turnTo(e.face,angTo(f.x,f.y,C.x,C.y),3*dt);
    f.eat+=dt; N4F.cue={x:f.x,y:f.y-100};
    if(Math.random()<dt*3) ftext(f.x+rand(-30,30),f.y-150,S('CRUNCH','CRUNCH'),'#e8e8ff',13);
    // Moonfire in her face: CHOKED
    const F=n4nFace(e); if(n4fMoonAt(F.x,F.y,42)){ e.choke+=dt; if(Math.random()<dt*25) emit(F.x,F.y-60,1,{col:'214,226,255',smin:20,smax:80,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6}); } else e.choke=Math.max(0,e.choke-dt*0.5);
    if(e.choke>=byDiff(0.6,1.0,1.3)){ e.choke=0; e.perch=null; n4fEv('choke'); taunt('nyxara',S("*cough* That's SPICY!",'*cough* SPICY!')); const a=angTo(C.x,C.y,e.x,e.y); e.tumble={t:0,x0:e.x,y0:e.y,z0:e.z,x1:C.x+Math.cos(a)*440,y1:C.y+Math.sin(a)*440}; ftext(e.x,e.y-140,S('CHOKED!','CHOKED!'),'#ffe066',24); shake(8); return; }
    if(f.eat>=byDiff(6,5,4)){ f.gone=true; f.growT=0; f.eat=0; e.perch=null; SFX.play('pop'); emit(f.x,f.y-90,24,{col:'230,235,255',smin:40,smax:160,lmin:.3,lmax:.7,zmin:1.4,zmax:3}); n4nSay(e,'Mmm. Crunchy.','Mmm. Crunchy.',4); e.cd=0.6; }
    return; }
  // flying to the next piece (Pip and Hush show which one), with attacks on the way
  if(!e.toFrag||e.toFrag.gone){ e.toFrag=n4nNextFrag(e); e.travel=byDiff(4.2,3.4,2.6); }
  N4N.next=e.toFrag; const f=e.toFrag; if(f) N4F.cue={x:f.x,y:f.y-100};
  if(n4nAct(e,dt,p)) return;
  e.travel-=dt; if(f){ if(e.travel<=0){ steer(e,f.x,f.y,300); e.alt=e.z=lerp(e.z,90,Math.min(1,dt*2)); e.state='fly'; if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),3*dt); if(dist(e.x,e.y,f.x,f.y)<24){ e.perch=f; f.eat=0; e.choke=0; } }
    else { e.orb=(e.orb||0)+dt*0.5; steer(e,C.x+Math.cos(e.orb)*260,C.y+Math.sin(e.orb)*200,200); e.alt=e.z=lerp(e.z,120,Math.min(1,dt*2)); e.state='fly'; e.face=turnTo(e.face,angTo(e.x,e.y,p.x,p.y),2*dt); } }
  if(n4nCdTick(e,dt)){ n4nCd(e); const k=n4nPick(e,[['gale',2.5],['shards',3],['ecl',1.4],['fliers',countType('n_mothling')<n4nCap()?1.5:0]]);
    if(k==='gale'){ const dur=n4fTele(1.0), a=angTo(e.x,e.y,p.x,p.y); e.act={k:'gale',t:0,dur,a}; e.state='galeW'; n4fMark({shape:'cone',x:e.x,y:e.y,ang:a,len:420,half:0.55,dur,col:'230,240,255',owner:e}); SFX.play('warn'); }
    else if(k==='shards'){ const dur=n4fTele(0.8), a0=angTo(e.x,e.y,p.x,p.y); e.state='cast'; e.act={k:'sh',t:0,dur};
      for(let i=-1;i<=1;i++){ const a=a0+i*0.32; n4fMark({shape:'line',x:e.x,y:e.y,ang:a,len:640,w:24,dur,col:'230,235,255',owner:e,fire:z=>{ const h0=HURT_SRC; shoot(z.x,z.y,z.ang,600,8,n4nHit(e,16),'ice','enemy',{life:1.3}); }}); } SFX.play('warn'); }
    else if(k==='ecl'){ e.act={k:'ecl',t:0,dur:n4fTele(0.6)}; e.state='cover'; SFX.play('warn'); }
    else { e.act={k:'swarm',t:0,dur:n4fTele(0.7)}; e.state='shiver'; } }
}
// Gale: a wide cone of wind (it knocks Ash out of a stream)
function n4nGaleTick(e,A,dt,p){ if(A.t<A.dur) return true; e.act=null; e.state='fly'; SFX.play('whoosh');
  for(let i=0;i<30;i++) emit(e.x,e.y,1,{col:'235,245,255',glow:false,ang:A.a+rand(-0.5,0.5),spread:0.1,smin:300,smax:600,lmin:.3,lmax:.6,zmin:1.5,zmax:3,drag:1});
  if(!p.dead&&dist(e.x,e.y,p.x,p.y)<420+p.r&&Math.abs(angDiff(A.a,angTo(e.x,e.y,p.x,p.y)))<0.6&&!n4fShadowed()){ n4nHurt(n4nHit(e,6),e.x,e.y,0,true);
    if(typeof P3!=='undefined'&&P3.ride) try{ p3RideOff(p,'hop'); }catch(err){} p.avx=(p.avx||0)+Math.cos(A.a)*300; p.avy=(p.avy||0)+Math.sin(A.a)*300; p.kvx+=Math.cos(A.a)*300; p.kvy+=Math.sin(A.a)*300; ftext(p.x,p.y-50,S('Whoosh! Hop back on the wind!','Whoosh!'),'#e8f0ff',13); }
  return false; }
// Eclipse Wing: 2.5 s of dark (only Ash's glow, Pip's and her eye-spots); on Hard she dives at Ash in it
function n4nEclTick(e,A,dt,p){ if(A.t<A.dur){ e.state='cover'; return true; }
  if(!A.dark){ A.dark=true; N4N.darkTo=n4fAllyHere('hush')?0.55:0.88; A.end=A.t+2.5; if(n4fHard()){ A.dive=A.t+0.6; } }
  if(A.dive&&A.t>=A.dive&&!A.dove){ A.dove=true; const a=angTo(e.x,e.y,p.x,p.y); n4fMark({shape:'line',x:e.x,y:e.y,ang:a,len:520,w:60,dur:0.7,col:N4FCOL.red,owner:e,fire:z=>{ const pp=player; const dx=pp.x-z.x, dy=pp.y-z.y, u=dx*Math.cos(z.ang)+dy*Math.sin(z.ang), v=Math.abs(-dx*Math.sin(z.ang)+dy*Math.cos(z.ang)); if(u>0&&u<z.len&&v<36&&!n4fShadowed()) n4nHurt(n4nHit(e,20),z.x,z.y,300,true); e.x+=Math.cos(z.ang)*Math.min(400,u); e.y+=Math.sin(z.ang)*Math.min(400,u); }}); }
  if(A.t>=A.end){ N4N.darkTo=0; e.act=null; e.state='fly'; return false; }
  return true; }
// ===== the arena every frame (all phases): the darkness, the dim edges of drowsiness, Glaciar's help with the wings
function n4nArena(dt,e){
  N4N.dark+=(N4N.darkTo-N4N.dark)*Math.min(1,dt*(N4N.darkTo>N4N.dark?3:2)); if(N4N.dim>0) N4N.dim-=dt;
  n4nLights(e); n4nHeartTick(dt);
  if(e.nPhase===3&&n4fAllyHere('glaciar')&&player.flying&&!(typeof P3!=='undefined'&&P3.ride)) player.flyE=Math.min(flyMax(),player.flyE+flyMax()*0.08*dt);
  // Hush perches on the piece Nyxara will eat next (phase 3), and lights her in the dark
  const H=n4fAlly('hush'); if(H) H.perch=e.nPhase===3&&N4N.next?{x:N4N.next.x+30,y:N4N.next.y+10}:null;
}
// the fights are night scenes under the broken moon: a little darker than the climb (the moon fills it back in phase 4)
{ const base=mapNight; mapNight=function(){ const F=N4F.fight; if(!F||AREA) return base(); const b=base();
    if(F.k==='n_summit') return b+0.2*(1-0.7*(N4F.moonFill||0))+N4N.dark*0.8; return b+0.1; }; }

// ---------- how her bar takes hits (phases 1 to 3): full in a window (GROUNDED!), a chip outside one, nothing out of reach
// (high over the floor for a blade, under the ink). A phase cannot end before its first window: the bar stops at the mark.
function n4nOnHurt(e,amt,o){
  if(e.mode==='heart'||e.trans||e.n4done) return false;
  const h=foeHit(e,o), p=e.nPhase; let a=amt;
  if(p===4) return n4nCrackHit(e,amt,o,h);
  const up=n4fUp()||player.flying, far=h.ranged||h.comp||h.fire||h.src==='glaive'||h.src==='whip'||h.src==='moon'||h.src==='bomb';
  if(e.win>0){ a=amt; }
  else {
    if((p===1||p===3)&&(e.z||0)>40&&!far&&!up){ if(!(e._n4hiT>G.time)){ e._n4hiT=G.time+3; n4fTxt(e,p===1?S('She is too high! Light the anchors and pull her down!','Too high! Light the pillars!'):S('She is up in the sky! Fly to her and Moonfire her face!','Too high! Fly to her!'),'#e8f0ff',13); } return false; }
    if(p===2&&e.sub){ if(!(e._n4hiT>G.time)){ e._n4hiT=G.time+3; n4fTxt(e,S('She is under the ink! Pound the platform she hides under!','She is under the ink!'),'#e0d0ff',13); } return false; }
    a=amt*n4nOut();
    if(!(e._n4chT>G.time)&&!h.comp){ e._n4chT=G.time+5; n4fTxt(e,S('Only a scratch! Bring her down for a real hit!','Only a scratch!'),'#d8d0f0',12); }
  }
  // the bar stops at this phase's mark (the next phase starts there), and a window takes at most its own slice (so a
  // phase lasts its windows: 2/2/2, 3/3/2, 3/3/3); outside a window the chip can run half a slice ahead
  const n=(e.wins[p]||0), fl=Math.max(N4N.M[p],N4N.M[p-1]-n4nSlice(p)*(e.win>0?n+1:n+0.5));
  const r=n4fFloor(e,a,o,fl);
  if((r===false||r<a)&&(e.wins[p]||0)<1&&!(e._n4gt>G.time)){ e._n4gt=G.time+3.2; n4fTxt(e,S('Bring her down first!','Bring her down first!'),'#ffd27a',13); }
  return r; }

// ================= the Heart moment (FINALE 8.4): it cannot be lost and never plays twice
// x4_story owns the scene (n4sHeart(done)); N4F.hook.heart(e, resume) can take it over; without either, the stand-in
// below plays the bible's lines: the black, the Heart, the meter with four marks, the voices, Pip's first word.
const N4N_MARKS=[0.25,0.5,0.75,0.9];
const N4N_SEAMC=['168,120,255','140,210,255','228,234,255','255,150,60'];
function n4nHeart(e){
  e.mode='heart'; e.state='gone'; e.invuln=true; e.win=0; e.n4open=false; e.act=null; e.mv=null; e.tele=null; e.alpha=0.02; e.flying=false; e.alt=e.z=0; e.perch=null; e.tumble=null;
  N4N.next=null; N4F.cue=null; N4N.darkTo=0;
  for(const q of G.enemies) if(!q.dead&&q!==e&&!q.boss){ n4fPuff(q.x,q.y,'200,190,240',10); q.dead=true; }
  G.projectiles=G.projectiles.filter(q=>q.owner!=='enemy'); for(const z of G.fz||[]) if(z.k==='n4fmark'||z.k==='n4nring'||z.k==='n4ndrowse') z.done=true;
  n4nStreams(false); n4nFlood(false); n4nPools(false); if(N4F.fight) N4F.fight.fly=false; if(typeof n4wCalm==='function') n4wCalm('cz_summit',false);
  G.flags.n_heart_on=1; n4fEv('heart');
  let done=false; const resume=()=>{ if(done) return; done=true; n4nHeartEnd(e); };
  N4N.resume=resume;
  if(typeof N4F.hook.heart==='function'){ const r=n4fHook('heart',e,resume); if(r!==false) return; }
  if(n4fS()){ try{ n4sHeart(resume); return; }catch(err){ console.error(err); } }
  n4nHeartStandIn(e,resume);
}
function n4nHeartEnd(e){
  G.flags.n_heart_on=0; G.flags.n_heart_done=1; N4N.heartUI=null; N4N.resume=null; n4fEv('heartEnd');
  if(!e||e.dead||G.boss!==e) return;
  e.invuln=false; e.alpha=1; n4nPhaseGo(e,4,false);
  if(!n4fS()){ flashA=Math.max(flashA,0.5); flashCol='255,230,170'; SFX.play('roar'); }
}
// ---- the stand-in scene
function n4nHeartLines(key,fallback){ const s=STORY[key]; return s&&s.length?s:fallback(); }
const N4N_HSTART=()=>[
  n4fL('narr',`Nyxara swallows the last piece of the moon.`,`Nyxara eats the last piece of the moon.`),
  n4fL('narr',`And everything goes black.`,`Everything goes black.`),
  n4fL('narr',`Not dark. Black. No lanterns. No stars. You can't even see your own claws.`,`So black. You cannot see your claws.`),
  n4fL('narr',`You breathe fire. Nothing comes out but a little puff of smoke.`,`You breathe fire. Only smoke comes out.`),
  n4fL('ash',`My fire. My fire's going out.`,`My fire is going out!`),
  n4fL('nyxara',`Shh. There. Isn't that better? No more fighting. No more goodbyes. Give me the Heart, and we'll all just... rest.`,`There. No more fighting. Give me the Heart. Let's rest.`),
  n4fL('narr',`Something tugs at your satchel. The Ember Heart floats up out of it, glowing faintly. Black flames lick at its edges.`,`The Heart floats out of your bag. Black fire licks at it.`),
  n4fL('narr',`It's still warm. Barely. And then you hear voices. Not from the dark. From the Heart.`,`It is still a little warm. Then you hear voices from the Heart.`)];
const N4N_HEND=()=>[
  n4fL('narr',`The Heart flickers. Almost. Almost.`,`The Heart flickers. Almost!`),
  n4fL('narr',`Then Pip climbs up your arm, puffs out every single scale, and says, very loudly, the first word Pip has ever said.`,`Then Pip climbs up your arm. Pip says a word for the very first time.`),
  {who:'pip',text:S(`ASH!`,`ASH!`),fn:()=>{ const H=N4N.heartUI; if(H){ H.word=0.001; } shake(6); }},
  {who:'narr',text:S(`And Pip breathes one tiny spark into the Heart.`,`Pip breathes one tiny spark into the Heart.`),fn:()=>{ const H=N4N.heartUI; if(H) H.spark=0.001; }},
  {who:'narr',text:S(`The Ember Heart blazes like a sunrise.`,`The Heart shines like the sun!`),fn:()=>{ const H=N4N.heartUI; if(H){ H.blaze=0.001; flashA=Math.max(flashA,0.85); flashCol='255,236,190'; SFX.play('levelup'); shake(10); } }},
  n4fL('ash',`Did Pip just... TALK?`,`Did Pip just TALK?`),
  n4fL('pip',`Mip.`,`Mip.`),
  n4fL('nyxara',`No. No, no, no. That light is MINE!`,`No! That light is MINE!`),
  n4fL('ash',`It's not yours. It never was. Let's finish this.`,`It is not yours. Let's finish this.`)];
function n4fEnd(){ return (G.choices&&G.choices.ending)||'hero'; }
// one voice per mark (the first that applies), FINALE 8.4
function n4nSeamLines(k){ const C=G.choices||{}, F=G.flags||{}, L=[];
  const v=(who,col,full,simple)=>({who,text:S(full,simple),fn:()=>n4nVoice(col)});
  if(k===0){ if(C.c_vesper==='friend') L.push(v('c_vesper',N4N_SEAMC[0],`Hey. Cousin. Emberbloods without fire still have warm hands. Here. Take mine.`,`Cousin. I have no fire. But my hands are warm. Take them.`));
    else L.push(v('juniper',N4N_SEAMC[0],`Ash! You can't get lost now. I drew you a map. Follow it home!`,`Ash! You can't get lost. I drew you a map!`)); }
  if(k===1){ if(C.f_glaciar==='free') L.push(v('f_glaciar',N4N_SEAMC[1],`Cold keeps things, she says. Warm GIVES things. Give, dumpling.`,`Cold keeps things. Warm gives things. Give, dumpling!`));
    else L.push(v('elka',N4N_SEAMC[1],`Faster than a wolf, Ash! FASTER!`,`Faster than a wolf, Ash!`)); }
  if(k===2){ if(C.m_hush==='free'){ L.push(v('narr',N4N_SEAMC[2],`A soft white light settles on your shoulder. Hush. For once, she doesn't say shhh.`,`Hush lands on your shoulder. She does not say shhh.`)); L.push(n4fL('f_hush',`...Hold on, little ember. Hold on.`,`Hold on.`)); }
    else L.push(v('quill',N4N_SEAMC[2],`The moon always comes back, Ash. I have measured it. Every month. It's the most reliable thing I know.`,`The moon always comes back. I measured it.`)); }
  if(k===3){ L.push(v('maren',N4N_SEAMC[3],`Ash! I can feel it from here. Don't you dare go out. You still haven't eaten your sandwich.`,`Ash! Don't you go out! You did not eat your sandwich!`));
    if(F.tk_come==='home') L.push(n4fL('narr',`Far, far away in Embermere, in one small window, a lantern is burning. Tikka promised.`,`Far away, Tikka's lantern burns in her window.`));
    const end=n4fEnd();
    if(end==='lantern') L.push(n4fL('narr',`Far below, a small orange light is climbing up out of the dark. It's flapping very hard.`,`A small orange light flies up from below. It flaps very hard.`),n4fL('grandpa',`Nobody. Puts out. MY. Grandchild.`,`Nobody puts out MY grandchild!`),
      n4fL('narr',`Grandpa lands on your head, which is rude, and breathes into the Heart with you. It's the first fire he has breathed in a whole year. It's a big one.`,`Grandpa lands on your head and breathes fire into the Heart with you.`));
    else if(end==='warden') L.push(n4fL('narr',`Five small lights blink on around you. One, two, three, four, five.`,`Five little lights shine around you.`),n4fL('iska',`Sixth Warden. We felt the dark from our Ward-fires. We came.`,`Sixth Warden. We felt the dark. We came.`),
      n4fL('bram',`And to SHOUT! BREATHE, kid!`,`BREATHE, kid!`),n4fL('vor',`...Breathe from your belly, hatchling. Not your nose.`,`Breathe from your belly, little one.`));
    else if(end==='heir') L.push(n4fL('narr',`The fire you took from Grandpa, the fire that once made you huge, wakes up deep in your belly.`,`The big fire you once had wakes up in your belly.`),n4fL('grandpa',`(very far away, from a birdcage in a bakery) You call THAT a flame? Pathetic. Do it BIGGER.`,`(far away) Is that a flame? Do it BIGGER!`),n4fL('ash',`Thanks, Grandpa.`,`Thanks, Grandpa.`));
    else L.push(n4fL('ember',`Little ember. Remember what my father taught me? Breathe from your belly. Not your nose.`,`Little ember. Breathe from your belly.`)); }
  return L; }
function n4nVoice(col){ const H=N4N.heartUI; if(!H) return; const a=rand(-2.6,-0.5); H.voices.push({col,t:0,x:H.x+Math.cos(a)*130,y:H.y-60+Math.sin(a)*70}); }
function n4nHeartStandIn(e,resume){
  const p=player; p.flying=false; p.landing=false; p.gliding=false; p.z=0; p.vz=0; p.kvx=p.kvy=0; p.facing=-Math.PI/2;
  if(typeof P3!=='undefined'&&P3.ride) try{ p3RideOff(p,'drop'); }catch(err){}
  const H=N4N.heartUI={t:0,dark:0,meter:0,mark:0,phase:'intro',x:p.x,y:p.y,seam:[0,0,0,0],flash:0,blaze:0,word:0,spark:0,idle:0,voices:[],resume,fl:0};
  runDialogue(n4nHeartLines('n_heart_start',N4N_HSTART),()=>{ scene='play'; H.phase='hold'; n4fTip('heart',S('Keep the Heart warm!','Warm the Heart!'),S('Hold BREATHE to keep the Heart warm!','Hold FIRE to warm the Heart!'),9); });
}
function n4nHeartTick(dt){
  const H=N4N.heartUI; if(!H) return; const p=player; H.t+=dt; if(H.flash>0) H.flash-=dt;
  H.dark=H.blaze>0?Math.max(0,H.dark-dt*1.2):Math.min(1,H.dark+dt*1.4); H.fl=Math.min(1,H.fl+(H.phase==='intro'?0.3:1)*dt);
  for(const v of H.voices) v.t+=dt; if(H.word>0) H.word+=dt; if(H.spark>0) H.spark+=dt; if(H.blaze>0) H.blaze+=dt;
  p.x=H.x; p.y=H.y; p.kvx=p.kvy=0; p.iframes=Math.max(p.iframes||0,0.5); p.energy=p.maxEnergy; p.exhausted=false;
  for(const q of G.enemies) if(!q.dead){ q.dx=q.dy=0; }
  if(H.phase==='blaze'){ if(H.blaze>1.4){ N4N.heartUI=null; H.resume(); } return; }
  if(H.phase!=='hold') return;
  const fill=byDiff(0.25,0.2,0.18), back=byDiff(0.05,0.12,0.2), floor=H.mark>0?N4N_MARKS[H.mark-1]:0;
  if(p.breathing){ H.meter=Math.min(1,H.meter+fill*dt); H.idle=0; } else { H.meter=Math.max(floor,H.meter-back*dt); H.idle+=dt; }
  if(H.mark<4&&H.meter>=N4N_MARKS[H.mark]){ H.meter=N4N_MARKS[H.mark]; const k=H.mark; H.phase='voice';
    runDialogue(n4nSeamLines(k),()=>{ scene='play'; H.seam[k]=1; H.mark=k+1; H.phase='hold'; H.flash=0.6; SFX.play('cast'); }); return; }
  if(H.mark>=4&&H.meter>=1){ H.phase='end'; runDialogue(n4nHeartLines('n_heart_end',N4N_HEND),()=>{ scene='play'; H.phase='blaze'; if(!(H.blaze>0)) H.blaze=0.001; }); }
}
// the Heart moment cannot be lost; fire breath there is only a puff of smoke
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){ if(N4N.heartUI||(N4N.e&&N4N.e.mode==='heart')) return false; return base(amt,sx,sy,kb); }; }
{ const base=doBreath; doBreath=function(dt){
    const H=N4N.heartUI;
    if(H&&!(H.blaze>0)){ const p=player, a=p.facing; if(Math.random()<0.5) emit(p.x+Math.cos(a)*16,p.y+Math.sin(a)*16-6,1,{col:'90,80,100',glow:false,ang:-Math.PI/2,spread:0.8,smin:10,smax:40,lmin:.5,lmax:1,zmin:2,zmax:5,grow:8,drag:1});
      if(H.phase==='hold'&&Math.random()<0.6) emit(H.x+rand(-6,6),H.y-78+rand(-6,6),1,{col:'255,170,90',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); return; }
    base(dt);
    // Heartfire (stand-in look: x4_story draws its own): gold and silver sparks in the breath
    if(N4F.heartfire&&!n4fS()&&Math.random()<0.7){ const p=player, a=p.facing; emit(p.x+Math.cos(a)*60,p.y+Math.sin(a)*60,2,{col:Math.random()<0.5?'255,214,120':'226,232,255',ang:a,spread:0.3,smin:200,smax:360,lmin:.3,lmax:.5,zmin:2,zmax:4,drag:1}); } }; }
// Heartfire burns twice as hot on her (stand-in: x4_story owns this when it is in the build)
{ const base=damageEnemy; damageEnemy=function(e,amt,o){ if(e&&e.type==='n_nyxara'&&N4F.heartfire&&!n4fS()&&o&&(o.src==='fire'||o.src==='burn')) amt*=2; return base(e,amt,o); }; }
// the giant heir in Heartfire (stand-in: scale 1.5, x1.3 dealt, x0.7 taken)
function n4nHeirBig(on){ N4F.big=!!on&&!n4fS()&&n4fEnd()==='heir'; }
{ const base=drawPlayer; drawPlayer=function(){ if(N4F.big&&N4F.fight&&!player.dead){ const s=1.5, p=player; ctx.save(); ctx.translate(p.x,p.y); ctx.scale(s,s); ctx.translate(-p.x,-p.y); try{ base(); } finally{ ctx.restore(); } return; } return base(); }; }

// ================= phase 4: Heartfire (FINALE 8.5). She is down for good; six cracks glow on her wings. Break the needed
// number (4 / 5 / 6, each 2 / 3 / 4 hits; swings, Glaive throws, arrows, or 1.2 s of Heartfire). Each broken crack sends a
// stream of silver light up into the empty moon. Her bar is the cracks: each one takes its slice; the last one is the end.
const N4N_CRK=[[-150,-26],[-112,34],[-205,30],[150,-26],[112,34],[205,30]];
function n4nCrackNeed(){ return byDiff(4,5,6); }
function n4nCrackHits(){ return byDiff(2,3,4); }
function n4nCracksMake(e){ e.cracks=N4N_CRK.map(([dx,dy],i)=>({i,dx,dy,x:e.x+dx,y:e.y+dy,hits:0,heat:0,broken:false,glow:rand(0,TAU),cd:0,flash:0})); e.broken=0; e.n4pin=0; e.n4frz=0; e.beats={}; e.cd=2.4; e.n4done=false; }
function n4nCrackPos(e){ const a=(e.face||Math.PI/2)-Math.PI/2, c=Math.cos(a), s=Math.sin(a); for(const k of e.cracks){ k.x=e.x+k.dx*c-k.dy*s; k.y=e.y+k.dx*s+k.dy*c; } }
// which crack a hit landed on: the hit circle's multiplier carries its index (1.6 + i/1000); else the nearest to the blow
function n4nCrackOf(e,o){ const m=o&&o.mult; if(m>=1.59&&m<1.62){ const i=Math.round((m-1.6)*1000); const k=e.cracks[i]; if(k&&!k.broken) return k; }
  const fx=o&&o.fx!=null?o.fx:null, fy=o&&o.fy!=null?o.fy:null; if(fx==null) return null; let best=null, bd=46; for(const k of e.cracks){ if(k.broken) continue; const d=dist(fx,fy,k.x,k.y); if(d<bd){ bd=d; best=k; } } return best; }
function n4nCrackHit(e,amt,o,h){
  if(e.n4done) return false;
  if(h.comp){ // a friend's blow: half a hit on the crack nearest Ash, never the breaking one (that is Ash's)
    if(!(e._n4cpT>G.time)){ e._n4cpT=G.time+2; let best=null, bd=1e9; for(const k of e.cracks){ if(k.broken) continue; const d=dist(player.x,player.y,k.x,k.y); if(d<bd){ bd=d; best=k; } }
      if(best){ best.hits=Math.min(n4nCrackHits()-1,best.hits+0.5); best.flash=0.3; } } return false; }
  if(h.fire) return false;   // Heartfire works by holding it on a crack (its heat), not by the breath's ticks
  const k=n4nCrackOf(e,o);
  if(!k){ if(!(e._n4hiT>G.time)){ e._n4hiT=G.time+2.6; n4fTxt(e,S('Hit the glowing cracks on her wings!','Hit the glowing cracks!'),'#fff0b8',14); } return false; }
  if(k.cd>G.time) return false; k.cd=G.time+0.14;
  n4nCrackStrike(e,k,1,h.src); return false; }
function n4nCrackStrike(e,k,n,src){ k.hits+=n; k.flash=0.3; SFX.play('hit'); emit(k.x,k.y-30,10,{col:'255,236,170',smin:60,smax:200,lmin:.2,lmax:.45,zmin:1.5,zmax:3}); n4fEv('crackhit');
  if(src&&settings.nums) ftext(k.x,k.y-56,(Math.ceil(n4nCrackHits()-k.hits)>0?String(Math.ceil(n4nCrackHits()-k.hits)):'!'),'#ffe066',15);
  if(k.hits>=n4nCrackHits()) n4nCrackBreak(e,k,src==='vesper'); }
function n4nCrackBreak(e,k,byVesper){
  if(k.broken||e.n4done) return; k.broken=true; k.heat=0; e.broken=(e.broken||0)+1; const need=n4nCrackNeed(), left=need-e.broken;
  shake(9); SFX.play('boom'); flashA=Math.max(flashA,0.2); flashCol='235,240,255'; n4fEv('crack');
  for(let i=0;i<36;i++) emit(k.x+rand(-14,14),k.y-30,1,{col:Math.random()<0.6?'235,240,255':'255,226,150',ang:-Math.PI/2+rand(-0.3,0.3),spread:0.2,smin:260,smax:620,lmin:.5,lmax:1.1,zmin:1.5,zmax:3});
  N4N.streamsUp.push({x:k.x,y:k.y-30,t:0});
  N4F.moonFill=Math.min(1,0.08+0.85*e.broken/need);
  e.hp=Math.max(1,e.maxHp*N4N.M[3]*(left/need)); e.lastHit=G.time;
  ftext(k.x,k.y-80,left>0?S('CRACK! The moonlight pours out!','CRACK!'):S('The last crack!','The last crack!'),'#ffffff',18);
  if(left<=0){ n4nLastCrack(e); return; }
  n4nBeats(e,left);
  if(e.broken===1) n4nSay(e,"Stop! You're letting it all OUT!",'Stop! It is all coming out!',4);
}
// the friends' big moments (taunt lines, once each): at the 2nd crack, the 3rd, and with two left (Vesper pries one open,
// so the very last crack is always Ash's)
function n4fAllyBeat(id,line){
  if(typeof n4sAllyBeat==='function'){ try{ return !!n4sAllyBeat(id); }catch(err){ return false; } }
  const end=n4fEnd(), here=id==='wardens'?end==='warden':id==='ember'?end==='hero':id==='grandpa'?end==='lantern':!!N4F.allies.find(a=>a.id===id);
  if(!here) return false; const k='beat_'+id; if(!N4F.said[k]){ N4F.said[k]=1; if(line) taunt(line[0],line[1]); } return true; }
function n4nBeats(e,left){ const b=e.beats, br=e.broken;
  if(br===2&&!b.two){ b.two=1;
    if(n4fAllyBeat('greymane',['narr',S(`Greymane leaps and pins one of her wings to the floor!`,`Greymane pins her wing down!`)])){ e.n4pin=6; n4fEv('pin'); }
    if(n4fAllyBeat('tikka',['ev_tikka',S(`One lumpy bun, coming UP!`,`Here comes a bun!`)])){ const p=player, hh=Math.round(p.maxHp*0.4*((G.diff&&G.diff.heal)||1)); p.hp=Math.min(p.maxHp,p.hp+hh); ftext(p.x,p.y-40,S('A big lumpy bun! +','Big bun! +')+hh,'#9cf08a',16); n4fEv('bigbun'); }
    n4fAllyBeat('cinder',['cinder',S(`None shall pass! Not even moths!`,`Nobody gets past me!`)]); }
  if(br===3&&!b.three){ b.three=1;
    if(n4fAllyBeat('glaciar',['f_glaciar',S(`Hold STILL, old moth.`,`Hold still!`)])){ e.n4frz=8; n4fEv('freeze'); }
    const end=n4fEnd();
    if(end==='lantern'&&n4fAllyBeat('grandpa',['grandpa',S(`Get AWAY from my grandchild, you oversized sock!`,`Get away from my grandchild, you big sock!`)])){ if(!n4fS()) e.n4gpa=0.5; }
    if(end==='warden'&&n4fAllyBeat('wardens',['iska',S(`Five lights, one for each of us. Stand close, Warden.`,`Five lights for you. Stand close!`)])){ if(!n4fS()) N4F.ward=5; }
    if(end==='hero'&&n4fAllyBeat('ember',['ember',S(`I'm right here, little ember. Aim for the cracks.`,`I am here. Aim for the cracks!`)])){ if(!n4fS()) e.n4emb=0.5; } }
  if(left===2&&!b.vesper){ b.vesper=1;
    if(n4fAllyBeat('vesper',['c_vesper',S(`Hey, Night Mother! You've got a crack. Let me help with that.`,`Hey! You have a crack. Let me help!`)])){ let best=null, bd=1e9; for(const k of e.cracks){ if(k.broken) continue; const d=dist(player.x,player.y,k.x,k.y); if(d<bd){ bd=d; best=k; } }
      if(best){ N4N.vpry={x:best.x,y:best.y,t:0}; n4fEv('vpry'); n4nCrackStrike(e,best,99,'vesper'); } } }
}
// the last crack: slow motion, no more attacks, the fall (FINALE 9)
function n4nLastCrack(e){
  e.n4done=true; e.invuln=true; e.act=null; e.tele=null; e.state='fallen'; player.iframes=Math.max(player.iframes||0,4); e.win=0; e.n4open=false; N4F.cue=null; N4F.moonFill=1;
  G.timeScale=0.3; G.slowT=1.2; flashA=Math.max(flashA,0.7); flashCol='240,244,255'; shake(16); SFX.play('roar');
  for(const z of G.fz||[]) if(z.k==='n4fmark'||z.k==='n4nring'||z.k==='n4ntorn') z.done=true; G.projectiles=G.projectiles.filter(q=>q.owner!=='enemy');
  for(const q of G.enemies) if(!q.dead&&q!==e&&!q.boss){ n4fPuff(q.x,q.y,'220,220,250',10); q.dead=true; }
  for(const k of e.cracks){ N4N.streamsUp.push({x:k.x,y:k.y-30,t:-rand(0,0.4),big:true}); }
  N4F.fall={x:e.x,y:e.y,face:e.face,t:0,k:1}; n4fEv('lastCrack');
  later(1.6,()=>n4nFallGo(e));
}
// the fall: N4F.hook.fall(e, finish), else x4_story's n4sFall(e, finish) (her fall, the plea, the choice, then finish()),
// else the stand-in: she is beaten (hp 0) and the fall lines play as the fight's outro
function n4nFallGo(e){
  if(e.dead) return;
  const finish=()=>n4nFinish(e);
  if(typeof N4F.hook.fall==='function'){ const r=n4fHook('fall',e,finish); if(r!==false) return; }
  if(typeof n4sFall==='function'){ try{ if(n4sFall(e,finish)!==false) return; }catch(err){ console.error(err); } }
  e.invuln=false; e.passive=false; e.n4fin=true; e.hp=0; killEnemy(e);
}
// after the story's choice: the fight ends with her bar at 0 (no second outro: the story has played the fall)
function n4nFinish(e){ if(e.n4fin) return; e.n4fin=true; e.hp=0; e.dead=true; e.invuln=true; G.bossDone.n_nyxara=true;
  if(G.boss===e) G.boss=null; if(G.fightSite==='n_summit') G.fightSite=null; if(G.bf&&G.bf.k==='n_summit'){ try{ bossFightEnd(false); }catch(err){ console.error(err); } }
  n4fWon('n_summit'); }
function n4nDeath(e){ N4F.fall=N4F.fall||{x:e.x,y:e.y,face:e.face,t:0,k:1}; G.flags.n_phase=0; N4N.heartUI=null; }
// the stand-in fall lines (x4_story has its own): the fight's outro when the story is not in the build
const N4N_FALL=()=>[
  n4fL('narr',`The last crack bursts. Light pours out of Nyxara's wings in a great silver river, up, up, into the empty moon.`,`The last crack breaks. Silver light pours up into the moon.`),
  n4fL('narr',`The moon starts to fill. Slowly. Like a cup.`,`The moon starts to fill up, like a cup.`),
  n4fL('narr',`Nyxara crumples onto the glass. She's still big. But she's getting smaller. Every second, smaller.`,`Nyxara falls down. She gets smaller and smaller.`),
  n4fL('narr',`In her claws she holds one last sliver of moon, tight, the way you'd hold a blanket.`,`She holds the last bit of moon tight, like a blanket.`),
  n4fL('nyxara',`Don't. Please. It always leaves. Every morning it goes away. Every month it gets thin. I only wanted it to stay.`,`Please don't. It always goes away. I only wanted it to stay.`),
  n4fL('ash',`My grandpa said "mine" too. About the whole valley. It made him so lonely he turned into a mountain.`,`My grandpa said "mine" too. It made him so lonely.`),
  n4fL('nyxara',`Everyone leaves, little ember.`,`Everyone leaves.`),
  n4fL('ash',`Yeah. The moon leaves every morning. And it comes back every night. That's not leaving. That's... visiting.`,`The moon goes every morning. And comes back every night. That is visiting!`)];
n4fLines('n_nyxara','n_nyxara_intro','n_nyxara_outro',n4nIntro,()=>STORY.n_fall&&STORY.n_fall.length?STORY.n_fall:N4N_FALL());
// ---- phase 4, her brain: grounded in the middle, turning to face Ash; Wing Sweep, Moth Tornado, Last Bite
function n4nP4(e,dt,p){
  e.flying=false; e.alt=e.z=0; e.n4open=true; e.dx=e.dy=0;
  if(e.n4done){ e.state='fallen'; return; }
  if(e.n4pin>0) e.n4pin-=dt; if(e.n4frz>0) e.n4frz-=dt;
  n4nCrackPos(e);
  // Heartfire on a crack (1.2 s) breaks it; the cracks glow and flash
  for(const k of e.cracks){ if(k.broken) continue; if(k.flash>0) k.flash-=dt;
    if(n4fFireAt(k.x,k.y-24,22)){ k.heat+=dt; if(Math.random()<dt*20) emit(k.x,k.y-30,1,{col:'255,226,150',smin:30,smax:100,lmin:.2,lmax:.5,zmin:1.4,zmax:2.6}); if(k.heat>=1.2){ k.heat=0; n4fEv('crackfire'); n4nCrackBreak(e,k); if(e.n4done) return; } }
    else k.heat=Math.max(0,k.heat-dt*0.5); }
  // Pip: the nearest unbroken crack
  let best=null, bd=1e9; for(const k of e.cracks){ if(k.broken) continue; const d=dist(p.x,p.y,k.x,k.y); if(d<bd){ bd=d; best=k; } } N4F.cue=best?{x:best.x,y:best.y-40}:null;
  // stand-in helpers: Grandpa's fire jet every 5 s, the ember spirit's shots (x4_story runs its own)
  if(e.n4gpa>0){ e.n4gpa-=dt; if(e.n4gpa<=0){ e.n4gpa=5; if(best){ best.hits=Math.min(n4nCrackHits()-1,best.hits+1); best.flash=0.3; for(let i=0;i<14;i++) emit(lerp(p.x,best.x,i/14),lerp(p.y-50,best.y-30,i/14),1,{kind:'fire',smin:20,smax:60,lmin:.3,lmax:.5,zmin:2,zmax:4}); } } }
  if(e.n4emb>0){ e.n4emb-=dt; if(e.n4emb<=0){ e.n4emb=3; if(best){ best.hits=Math.min(n4nCrackHits()-1,best.hits+0.5); best.flash=0.3; emit(best.x,best.y-30,8,{col:'255,190,120',smin:40,smax:120,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); } } }
  // the Glaive leaves a gold trail in Heartfire
  if(typeof G.wproj!=='undefined') for(const q of G.wproj) if(q.k==='glaive'&&Math.random()<0.6) emit(q.x,q.y-10,1,{col:Math.random()<0.5?'255,214,120':'240,240,255',smin:5,smax:30,lmin:.3,lmax:.6,zmin:1.4,zmax:2.4});
  if(n4nAct(e,dt,p)) return;
  if(e.state==='dizzy'){ e.dizzyT-=dt; if(e.dizzyT>0) return; e.state='grounded'; }
  // she shuffles back to the middle, turning to face Ash
  const C=N4N.C; if(dist(e.x,e.y,C.x,C.y-30)>12){ steer(e,C.x,C.y-30,90); }
  e.face=turnTo(e.face,angTo(e.x,e.y,p.x,p.y),0.7*dt); e.state='grounded';
  if(n4nCdTick(e,dt)){ n4nCd(e); const k=n4nPick(e,[['sweep',e.n4pin>0?0:3],['tornado',2],['bite',e.n4frz>0?0:2.2]]);
    const a=angTo(e.x,e.y,p.x,p.y);
    if(k==='sweep'){ const dur=n4fTele(0.8); e.act={k:'sweep',t:0,dur,a}; e.state='sweepW'; e.face=a; n4fMark({shape:'cone',x:e.x,y:e.y,ang:a,len:260,half:1.3,dur,col:N4FCOL.red,owner:e}); SFX.play('warn'); }
    else if(k==='tornado'){ const dur=n4fTele(0.8), s=spotNear(p.x,p.y,40,90); e.act={k:'tornado',t:0,dur,x:s.x,y:s.y}; e.state='shiver'; n4fMark({x:s.x,y:s.y,r:120,dur,col:'220,210,250',owner:e}); SFX.play('warn'); }
    else { const dur=n4fTele(0.9); e.act={k:'bite',t:0,dur,a,ph:'aim'}; e.state='biteW'; e.face=a; n4fMark({shape:'line',x:e.x,y:e.y,ang:a,len:620,w:70,dur,col:N4FCOL.red,owner:e}); SFX.play('warn'); } }
}
function n4nP4Act(e,A,dt,p){
  if(A.k==='sweep'){ if(A.t<A.dur){ e.state='sweepW'; return true; }
    if(!A.hit){ A.hit=true; e.state='sweep'; shake(8); SFX.play('whoosh'); for(let i=0;i<24;i++){ const an=A.a+rand(-1.3,1.3); emit(e.x+Math.cos(an)*rand(80,250),e.y+Math.sin(an)*rand(80,250),1,{col:'220,215,245',glow:false,ang:an,spread:0.2,smin:80,smax:220,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6,drag:2}); }
      if(!p.dead&&!n4fUp()&&dist(e.x,e.y,p.x,p.y)<260+p.r&&Math.abs(angDiff(A.a,angTo(e.x,e.y,p.x,p.y)))<1.3+0.1) hurtPlayer(n4nHit(e,22),e.x,e.y,420); }
    if(A.t>A.dur+0.45){ e.act=null; e.state='grounded'; } return true; }
  if(A.k==='tornado'){ if(A.t<A.dur){ e.state='shiver'; return true; }
    if(!A.on){ A.on=true; fzAdd('n4ntorn',{x:A.x,y:A.y,r:120,life:4,dmg:n4nHit(e,8),tick:0,owner:e}); SFX.play('whoosh'); }
    if(A.t>A.dur+0.4){ e.act=null; e.state='grounded'; } return true; }
  if(A.k==='bite'){
    if(A.ph==='aim'){ if(A.t<A.dur){ e.state='biteW'; return true; } A.ph='go'; A.x0=e.x; A.y0=e.y; A.d=0; e.state='bite'; SFX.play('roar'); }
    if(A.ph==='go'){ const st=700*dt; A.d+=st; e.x+=Math.cos(A.a)*st; e.y+=Math.sin(A.a)*st;
      const C=N4N.C; if(dist(e.x,e.y,C.x,C.y)>N4N.floor-40){ const an=angTo(C.x,C.y,e.x,e.y); e.x=C.x+Math.cos(an)*(N4N.floor-40); e.y=C.y+Math.sin(an)*(N4N.floor-40); A.d=620; }
      if(!A.hit&&!p.dead&&!n4fUp()&&dist(e.x,e.y,p.x,p.y)<70+p.r){ A.hit=true; hurtPlayer(n4nHit(e,28),e.x,e.y,500); }
      if(A.d>=620){ e.act=null; e.state='dizzy'; e.dizzyT=2; shake(8); SFX.play('boom'); n4fTxt(e,S('She is dizzy! Hit the cracks!','Dizzy! Hit the cracks!'),'#ffe066',15); } return true; } }
  e.act=null; return false; }
// Moth Tornado: a whirl of dust that drifts after Ash for 4 s (pushes, nips); Heartfire breaks it
FZK.n4ntorn={ tick(z,dt){ const p=player; if(z.owner&&(z.owner.dead||z.owner.n4done)){ z.done=true; return; }
    const a=angTo(z.x,z.y,p.x,p.y), d=dist(z.x,z.y,p.x,p.y); if(d>4){ z.x+=Math.cos(a)*Math.min(d,95*dt); z.y+=Math.sin(a)*Math.min(d,95*dt); }
    if(n4fFireAt(z.x,z.y-20,40)){ z.burn=(z.burn||0)+dt; if(z.burn>0.5){ z.done=true; n4fPuff(z.x,z.y,'255,220,150',24); ftext(z.x,z.y-60,S('Heartfire breaks the whirlwind!','Poof!'),'#ffe8a0',14); n4fEv('tornfire'); return; } }
    z.tick-=dt; if(d<z.r&&!p.dead&&!n4fUp()){ p.kvx+=Math.cos(a)*240*dt*4; p.kvy+=Math.sin(a)*240*dt*4; if(z.tick<=0){ z.tick=0.5; hurtPlayer(z.dmg,z.x,z.y,60); } } },
  drawG(z){ const t=G.time, k=clamp(Math.min(z.t/0.3,(z.life-z.t)/0.5),0,1); ctx.save(); ctx.globalAlpha=k;
    for(let i=0;i<4;i++){ ctx.strokeStyle=`rgba(${i%2?'200,190,240':'240,236,255'},${0.35+0.1*i})`; ctx.lineWidth=6-i; ctx.beginPath(); ctx.ellipse(z.x,z.y-i*14,z.r*(1-i*0.18),z.r*0.5*(1-i*0.18),t*(3+i),0.3,TAU-0.6); ctx.stroke(); }
    ctx.fillStyle='rgba(220,215,250,.18)'; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r,z.r*0.55,0,0,TAU); ctx.fill(); ctx.restore(); },
  tall(z,list){ if(!z.it) z.it={x:0,y:0,draw:()=>{ const t=G.time, k=clamp(Math.min(z.t/0.3,(z.life-z.t)/0.5),0,1); ctx.save(); ctx.globalAlpha=0.7*k; for(let i=0;i<10;i++){ const h=i*12, r=24+i*7, an=t*7+i*0.7; ctx.fillStyle=i%2?'rgba(200,190,240,.55)':'rgba(240,236,255,.5)'; ctx.beginPath(); ctx.ellipse(z.x+Math.cos(an)*r*0.4,z.y-h-10,r,r*0.32,0,0,TAU); ctx.fill(); } ctx.restore(); }}; z.it.x=z.x; z.it.y=z.y; list.push(z.it); } };
// the fallen Night Mother after the stand-in win: crumpled on the glass, getting smaller (x4_story draws its own)
function n4fFallTall(list){ const F=N4F.fall; if(!F||n4fS()||!n4fMap4()) return; if(G.choices&&G.choices.n_end){ N4F.fall=null; return; }
  F.t+=1/60; if(F.fade){ F.fa=(F.fa||0)+1/60; if(F.fa>3){ N4F.fall=null; return; } } F.k=Math.max(0.4,1-F.t*0.02);
  if(!F.it) F.it={x:0,y:0,draw:()=>n4nFallDraw(F)}; F.it.x=F.x; F.it.y=F.y; list.push(F.it); }
// the camera pulls back in the big fights (the whole summit floor in view)
{ const base=moveZoom; moveZoom=function(dt){ const F=N4F.fight; if(F&&!AREA&&player&&!player.dead&&G.boss&&!G.boss.dead){ const want=F.k==='n_summit'?(player.flying?0.7:0.78):(player.flying?0.8:0.9); MV.zoomK+=(want-MV.zoomK)*(1-Math.exp(-dt*2)); zoom=ZOOM0*MV.zoomK; return; } base(dt); }; }

// ================= Nyxara's look (FINALE 8.1): a moth the size of a house. Soft grey dust wings with a violet shimmer,
// two huge painted eyes pale as two moons, a white fur ruff, feathery antennae, eyes like black glass with a violet
// shine, six thin legs, and the glow of the broken moon around her. High up she flies with a huge soft shadow below;
// grounded she sprawls over a third of the floor. In phase 4 six cracks of moonlight glow on her wings.
const N4NC={fur:'#9690ac',furD:'#645e7c',furL:'#bdb7cf',ruff:'#f4f2fc',wing:'#77708f',wingL:'#968cb6',band:'#352d4c',wingD:'#554d6e',hband:'#2a2340',edge:'#d8d0f0',spot:'#f0f2ff',ring:'#221b38',sea:'#bfc4dc',eye:'#0b0716',leg:'#3e3858',ant:'#e4e0f2'};
// one of her wings: a dark dusty band round the edge, the grey wing, a violet shimmer, and (forewings) a painted moon
const _n4w=[];
function n4nWing(sd,x,y,z,span,L,th,sweep,band,col,shim,moon,fl){
  const c=Math.cos(th), s=Math.sin(th), tx=-sweep, ty=sd*span*c, tz=span*s;
  const panel=(k,cl,bias)=>{ _n4w.length=0; for(const [u0,v] of C1WING){ const u=u0*k, bend=Math.sin(u*Math.PI)*0.06*span; _n4w.push(x+u*tx+v*L*k*(1-u*0.25), y+u*ty, z+u*tz+bend*0.3+(1-k)*0.4); } foQ(_n4w,cl,null,bias); };
  panel(1,fl?'#ffffff':band,-0.12); panel(0.86,fl?'#ffffff':col,-0.11); if(shim) panel(0.5,fl?'#ffffff':shim,-0.1);
  if(moon){ const u=0.56, mx=x+u*tx-L*0.04, my=y+u*ty, mz=z+u*tz+0.8, ay=sd*c, az=s;
    // a painted moon flat on the wing (it tilts with it): a dark ring, the pale disc, three grey seas
    const disc=(ox,oy,R,cl,bias)=>{ _n4w.length=0; for(let i=0;i<12;i++){ const f=i/12*TAU, a1=Math.cos(f)*R, b1=Math.sin(f)*R; _n4w.push(mx+ox+a1, my+(oy+b1)*ay, mz+(oy+b1)*az+0.05); } foQ(_n4w,cl,null,bias,true); };
    disc(0,0,moon*1.22,fl?'#ffffff':N4NC.ring,-0.095); disc(0,0,moon,fl?'#ffffff':N4NC.spot,-0.09);
    disc(moon*0.3,moon*0.2,moon*0.3,N4NC.sea,-0.085); disc(-moon*0.32,-moon*0.25,moon*0.2,N4NC.sea,-0.085); disc(-moon*0.05,moon*0.42,moon*0.16,N4NC.sea,-0.085); } }
const N4N_K=2.9;
// the pose for a state: [wing lift, sweep, flap amount, flap speed, pitch, roll, legs down 0..1]
function n4nPose(e){ const st=e.state, t=G.time, hi=(e.z||0)>25;
  switch(st){
    case 'cover': return [1.35,-14,0.05,2,0,0,0];
    case 'perch': return [0.78,4,0.14,2.2,0.28,0,0.6];
    case 'choked': return [0.3,2,0.6,10,0.2,Math.sin(t*8)*0.45,0];
    case 'beamW': return [0.95,-4,0.06,3,-0.12,0,0];
    case 'beam': return [0.7,-2,0.1,4,0.05,0,0];
    case 'sing': return [0.62,2,0.22,1.6,0,0,0];
    case 'shiver': return [hi?0.55:0.3,2,0.1,22,0,0,hi?0:1];
    case 'galeW': return [1.2,-10,0.05,3,-0.1,0,0];
    case 'gulp': return [1.3,-12,0.08,2,0.3,0,0];
    case 'jaws': return [1.05,-6,0.15,6,-0.25,0,0.5];
    case 'sweepW': return [0.95,6,0.04,4,-0.1,0,1];
    case 'sweep': return [-0.02,20,0,0,0.1,0,1];
    case 'biteW': return [0.55,-6,0.04,6,-0.22,0,1];
    case 'bite': return [0.22,-10,0.1,12,0.34,0,1];
    case 'dizzy': return [0.05,4,0.02,2,0.12,Math.sin(t*3)*0.16,1];
    case 'fallen': return [-0.06,10,0,0,0.3,0.2,1];
    case 'grounded': case 'rest': case 'swim': case 'sink': return [0.12,4,0.05,1.4,0.04,0,1];
    case 'rise': return [0.6,0,0.6,6,0,0,0];
  }
  return hi?[0.5,2,0.5,3.2,0,0,0]:[0.12,4,0.05,1.4,0.04,0,1];
}
function n4nFig(e,fl){
  const dt=foDt(e), t=G.time, K=N4N_K*(e.n4scale||1), zb=(e.z||0)/K, fx=e.x, fy=e.y+6, face=t3Turn(e,e.face==null?Math.PI/2:e.face,3.2), dead=foDeath(e), hurt=n4fHurtK(e);
  const Q=n4nPose(e), P=foEase(e,'_n4p',foTg(Q[0],Q[1],Q[2],Q[3],Q[4],Q[5],Q[6]),dt,5), th=P[0]+Math.sin(t*P[3])*P[2], sw=P[1], legs=P[6];
  const C=N4NC, fur=fl?'#ffffff':C.fur, furD=fl?'#ffffff':C.furD, wing=fl?'#ffffff':hurt>0?'#c8bce0':C.wing, wingD=fl?'#f0f0f0':C.wingD;
  // the huge soft shadow (her attacks from the sky come from it)
  foShadow(fx,fy,(e.z||0)>25?190:150,(e.z||0)>25?0.3:0.42);
  foBegin(fx,fy,face,K,fl,zb);
  if(dead) foSet(FOB,20,0,dead*0.8,0,0,0,-dead*8); else foSet(FOB,20,P[4],P[5],0);
  // the broken-moon glow behind her
  foGlow(-6,0,18,120,'190,170,255',0.16+0.04*Math.sin(t*1.3),true);
  // wings: forewings (the painted moon eyes) and hindwings, all four from the thorax
  for(const sd of [-1,1]){
    n4nWing(sd,-10,sd*6,24,40,30,th*0.9-0.04,sw+8,C.hband,wingD,null,0,fl);
    n4nWing(sd,4,sd*7,29,56,42,th,sw,C.band,wing,hurt>0?'#d0c4ec':C.wingL,11,fl); }
  // body: the abdomen in soft bands, the thorax, the white ruff, the head
  foE(-28,0,19,18,10.5,10,furD); foE(-20,0,20.5,6,11.5,10.6,fur); foE(-33,0,18,6,9,8.5,fur);
  foE(-4,0,25,14,12,12,fur); foE(8,0,28,8,14,12.5,fl?'#ffffff':C.ruff);
  for(let i=0;i<7;i++){ const a=-1.3+i*0.43; foD(9,Math.sin(a)*13,28+Math.cos(a)*9,2.2,fl?'#ffffff':C.ruff,0.03); }
  foB(16,0,31,8.5,fl?'#ffffff':C.furL);
  // eyes like black glass, with a violet shine; antennae like silver ferns
  for(const sd of [-1,1]){ foE(21.5,sd*5,32.5,3.4,3.6,4.2,C.eye,0,0,0,0.05); foD(23,sd*4.6,34.4,1.1,'#b89cff',0.07); foD(22.6,sd*5.6,33.4,0.6,'#ffffff',0.08);
    foL(20,sd*3,38,30,sd*15,56,0.7,C.ant,0.5); for(let j=1;j<6;j++){ const u=j/6, ax=lerp(20,30,u), ay=sd*lerp(3,15,u), az=lerp(38,56,u); foN(ax,ay,az,ax-2.5,ay+sd*3.4,az-1.2,0.45,C.ant,0.07); foN(ax,ay,az,ax+1.5,ay-sd*2.6,az+0.8,0.45,C.ant,0.07); } }
  // six thin legs: splayed on the floor when she is down, tucked when she flies
  foLow(); for(let i=0;i<3;i++){ const bx=6-i*8; for(const sd of [-1,1]){ const kx=bx+(i-1)*4, ky=sd*(13+i*2), kz=lerp(20,16,legs), fxL=bx+(i-1)*10, fyL=sd*lerp(14,28+i*3,legs), fzL=lerp(8,0,legs);
    foL(bx,sd*6,20,kx,ky,kz,0.9,C.leg,0.7); foL(kx,ky,kz,fxL,fyL,fzL,0.7,C.leg,0.5); } } foUp();
  foEnd(30); e._t3top=foTop(fy,62,K,zb);
}
// a screen point on her (body space at her current pose, before the pose layer): for cracks and chains
const _n4q=[0,0,0];
function n4nBodyPt(e,wx,wy,bz){ const K=N4N_K*(e.n4scale||1); return {x:wx, y:e.y+6+(wy-e.y)*T3.ct-(bz*K+(e.z||0))*T3.st}; }
function n4nDraw(e,fl){
  if(e.mode==='heart'||e.alpha<0.05) return;
  if(e.sub&&e.nPhase===2) return;   // under the ink: only her ripple and her eyes show (the ground layer)
  // a soft halo of night behind her, so the moth reads against the pale glass
  { const K=N4N_K*(e.n4scale||1), cy=e.y+6-((e.z||0)+26*K*T3.st), R=230*(e.n4scale||1), g=ctx.createRadialGradient(e.x,cy,R*0.15,e.x,cy,R); g.addColorStop(0,'rgba(18,8,36,.42)'); g.addColorStop(0.6,'rgba(30,14,60,.22)'); g.addColorStop(1,'rgba(30,14,60,0)');
    ctx.save(); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(e.x,cy,R,R*0.72,0,0,TAU); ctx.fill(); ctx.restore(); }
  if(T3.on) n4nFig(e,fl); else n4nFig2(e,fl);
  n4nCracksDraw(e);
  if(e.state==='dizzy'||e.state==='grounded'&&e.n4open&&e.nPhase<4){ const top=e._t3top!=null&&T3.on?e._t3top:e.y-110; ctx.fillStyle='#ffe066'; for(let i=0;i<5;i++){ const a=G.time*4+i*TAU/5; ctx.beginPath(); ctx.arc(e.x+Math.cos(a)*46,top+8+Math.sin(a)*9,4,0,TAU); ctx.fill(); } }
}
function n4nDraw2(e,fl){ n4nDraw(e,fl); }
// ---- the Classic look: the same moth in flat shapes
function n4nFig2(e,fl){
  const t=G.time, st=e.state, s=e.n4scale||1, z=(e.z||0)*0.75, x=e.x, y=e.y-z-34*s, C=N4NC, Q=n4nPose(e), th=Q[0]+Math.sin(t*Q[3])*Q[2];
  ctx.save(); ctx.fillStyle=`rgba(10,6,20,${(e.z||0)>25?0.22:0.32})`; ctx.beginPath(); ctx.ellipse(e.x,e.y+6,160*s,52*s,0,0,TAU); ctx.fill();
  glowAt(x,y,200*s,'205,195,255',0.22);
  ctx.translate(x,y); ctx.rotate((e.face==null?Math.PI/2:e.face)+Math.PI/2+(Q[5]||0)); ctx.scale(s,s);
  const ww=clamp(0.55+0.45*Math.cos(th),0.35,1.05), lift=Math.sin(th)*40;
  for(const sd of [-1,1]){
    c1E2(sd*96*ww,24-lift*0.3,92*ww+8,46,fl?'#fff':C.hband,sd*0.35,2.4); c1E2(sd*92*ww,22-lift*0.3,80*ww+6,38,fl?'#fff':C.wingD,sd*0.35,0);
    c1E2(sd*112*ww,-18-lift*0.6,118*ww+8,62,fl?'#fff':C.band,sd*-0.3,2.6); c1E2(sd*106*ww,-20-lift*0.6,104*ww+6,52,fl?'#fff':C.wing,sd*-0.3,0); c1E2(sd*70*ww,-14-lift*0.6,50*ww,28,fl?'#fff':C.wingL,sd*-0.3,0);
    ctx.fillStyle='rgba(215,208,236,.8)'; for(let i=0;i<6;i++){ const a=-0.9+i*0.36; ctx.beginPath(); ctx.arc(sd*(112*ww+Math.cos(a)*110*ww),-18-lift*0.6+Math.sin(a)*56,2.6,0,TAU); ctx.fill(); }
    const mx=sd*128*ww, my=-22-lift*0.6; ctx.fillStyle=C.ring; ctx.beginPath(); ctx.arc(mx,my,31,0,TAU); ctx.fill(); ctx.fillStyle=C.spot; ctx.beginPath(); ctx.arc(mx,my,26,0,TAU); ctx.fill();
    ctx.fillStyle=C.sea; for(const [ox,oy,r] of [[7,5,7],[-8,-7,5],[-3,10,4]]){ ctx.beginPath(); ctx.arc(mx+ox*sd,my+oy,r,0,TAU); ctx.fill(); } }
  c1E2(0,34,22,48,fl?'#fff':C.furD,0,2.4); c1E2(0,-6,26,26,fl?'#fff':C.fur,0,2.4); c1E2(0,-26,30,16,fl?'#fff':C.ruff,0,2); c1E2(0,-44,18,16,fl?'#fff':C.furL,0,2.2);
  for(const sd of [-1,1]){ ctx.fillStyle=C.eye; ctx.beginPath(); ctx.ellipse(sd*8,-48,6,7,0,0,TAU); ctx.fill(); ctx.fillStyle='#b89cff'; ctx.beginPath(); ctx.arc(sd*8-1.5,-51,2,0,TAU); ctx.fill();
    ctx.strokeStyle=C.ant; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sd*6,-58); ctx.quadraticCurveTo(sd*18,-86,sd*34,-96); ctx.stroke(); for(let j=1;j<6;j++){ const u=j/6, ax=sd*lerp(6,34,u), ay=lerp(-58,-96,u); ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax+sd*7,ay+3); ctx.stroke(); } }
  ctx.restore(); e._t3top=y-90*s;
}
// ---- phase 4: the cracks of moonlight on her wings (drawn where their hit circles are, lifted to the wing)
function n4nCracksDraw(e){ if(e.nPhase!==4||!e.cracks||!e.cracks.length) return; const t=G.time, need=n4nCrackHits();
  for(const k of e.cracks){ const q=T3.on?n4nBodyPt(e,k.x,k.y,26):{x:k.x,y:k.y-44}; const x=q.x, y=q.y, f=k.flash>0?1:0;
    ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
    if(k.broken){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+0.2*Math.sin(t*6+k.i); ctx.drawImage(foGlowSpr('225,232,255'),x-34,y-34,68,68); ctx.globalAlpha=0.35; ctx.fillStyle='rgba(235,240,255,1)'; ctx.fillRect(x-5,y-140,10,140); ctx.restore(); continue; }
    const pulse=0.6+0.4*Math.sin(t*5+k.glow), hot=clamp(k.heat/1.2,0,1), hit=clamp(k.hits/need,0,1);
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.55*pulse+0.35*f+0.3*hot; ctx.drawImage(foGlowSpr('255,226,150'),x-30-10*hit,y-30-10*hit,60+20*hit,60+20*hit); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
    const z=[[-15,-9],[-5,-2],[-8,6],[4,3],[2,11],[13,7]], w=3.2+hit*2.5;
    ctx.strokeStyle='rgba(40,20,60,.85)'; ctx.lineWidth=w+3; ctx.beginPath(); z.forEach((p,i)=>i?ctx.lineTo(x+p[0],y+p[1]):ctx.moveTo(x+p[0],y+p[1])); ctx.stroke();
    ctx.strokeStyle=f?'#ffffff':`rgb(255,${226+Math.round(29*pulse)},${150+Math.round(90*hot)})`; ctx.lineWidth=w; ctx.stroke();
    if(hit>0){ ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x-5,y-2); ctx.lineTo(x-12,y-14); ctx.moveTo(x+4,y+3); ctx.lineTo(x+12,y-6); ctx.stroke(); }
    if(hot>0){ ctx.strokeStyle='rgba(255,236,170,.95)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,24,-Math.PI/2,-Math.PI/2+TAU*hot); ctx.stroke(); }
    ctx.restore(); } }
// her hit circles: phase 4 the cracks first (their multiplier carries their number), the head when she is down, the body
function n4nHC(e){ const L=e._hc||(e._hc=[]); L.length=0; if(e.mode==='heart'||e.n4done) return L;
  if(e.nPhase===4&&e.cracks) for(const k of e.cracks) if(!k.broken) L.push({x:k.x,y:k.y,r:22,m:1.6+k.i*0.001});
  if((e.z||0)<25&&!e.sub){ const f=e.face||Math.PI/2; L.push({x:e.x+Math.cos(f)*62,y:e.y+Math.sin(f)*42,r:30,m:1.4}); }
  L.push({x:e.x,y:e.y,r:e.r,m:1}); return L; }
{ const base=hitCircles; hitCircles=function(e){ if(e&&e.type==='n_nyxara') return n4nHC(e); return base(e); }; }

// ================= the Moon's Rest dressing
// the moth curtains round the two north anchors (phase 1): p2's moth curtains, a box round each pillar; a shadow slips in
N4N.veils=[]; N4N.veilOn=false;
function n4nVeils(on){ N4N.veilOn=!!on; if(typeof p2Add!=='function') return;
  if(!N4N.veils.length) for(const A of N4N.anchors){ if(!A.curtain) continue; const x=A.x, y=A.y, h=130;
    for(const [dx,dy,w,hh] of [[0,-h,2*h+16,16],[0,h,2*h+16,16],[-h,0,16,2*h-16],[h,0,16,2*h-16]]){ const o=p2Add('mothcurtain',{id:'n4f_veil_'+A.i+'_'+dx+'_'+dy,x:x+dx,y:y+dy,w,h:hh}); o.n4veil=A;
      if(o.col){ const c=o.col; Object.defineProperty(c,'off',{get(){ return !N4N.veilOn||!p2CurtainBlocks(o); },configurable:true}); } N4N.veils.push(o); } }
  for(const o of N4N.veils){ const i=LANDMARKS.indexOf(o), j=P2.out.indexOf(o);
    if(on){ if(i<0) LANDMARKS.push(o); if(j<0) P2.out.push(o); } else { if(i>=0) LANDMARKS.splice(i,1); if(j>=0) P2.out.splice(j,1); } } }
// the lights: each moonstone when it glows, and her own glow (the summit is dark under the empty moon)
N4N.L={x:4500,y:85200,r:420,i:0};
if(typeof LIGHTS!=='undefined'){ LIGHTS.push(N4N.L); for(const A of N4N.anchors){ A.L={x:A.x,y:A.y-60,r:190,i:0}; LIGHTS.push(A.L); } }
function n4nLights(e){ const on=!!(e&&!e.dead&&e.mode!=='heart'&&N4F.fight&&N4F.fight.k==='n_summit');
  N4N.L.i=on?(e.sub?0.25:0.55):0; if(e){ N4N.L.x=e.x; N4N.L.y=e.y-(e.z||0)*0.72-50; }
  for(const A of N4N.anchors) if(A.L) A.L.i=on&&e.nPhase===1?(A.snag?0.8:A.heat>0||A.lit>0?0.6:0.12):0; }
// the floor: a faint moth sigil, the ink flood with its ripple and the three moon-glass platforms, the anchors' rings
function n4nGroundDraw(t){
  const e=N4N.e&&!N4N.e.dead?N4N.e:null, C=N4N.C; ctx.save();
  // the sigil (a great moth drawn in thin violet lines)
  ctx.globalAlpha=0.22; ctx.strokeStyle='#b49cf0'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(C.x,C.y,560,0,TAU); ctx.stroke(); ctx.lineWidth=2;
  for(const sd of [-1,1]){ ctx.beginPath(); ctx.ellipse(C.x+sd*230,C.y-60,220,150,sd*-0.35,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(C.x+sd*170,C.y+150,150,100,sd*0.4,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(C.x+sd*250,C.y-70,46,0,TAU); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(C.x,C.y+20,40,180,0,0,TAU); ctx.stroke(); ctx.globalAlpha=1;
  // the Shadow Sea
  if(N4N.flood){ const k=N4N.floodA=Math.min(1,(N4N.floodA||0)+1/40);
    ctx.globalAlpha=k; ctx.fillStyle='#120a22'; ctx.beginPath(); ctx.arc(C.x,C.y,520,0,TAU); ctx.fill();
    const g=ctx.createRadialGradient(C.x,C.y,60,C.x,C.y,520); g.addColorStop(0,'rgba(80,40,140,.35)'); g.addColorStop(1,'rgba(40,20,80,0)'); ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle='rgba(170,130,255,.7)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(C.x,C.y,520,0,TAU); ctx.stroke();
    for(let i=0;i<26;i++){ const a=i*2.39+t*0.05, r=80+((i*97)%420), s=0.5+0.5*Math.sin(t*2+i); ctx.fillStyle=`rgba(200,170,255,${0.35*s})`; ctx.fillRect(C.x+Math.cos(a)*r-6,C.y+Math.sin(a)*r,12,1.6); }
    if(n4fAllyHere('glaciar')){ ctx.strokeStyle='rgba(200,235,255,.75)'; ctx.lineWidth=18; ctx.setLineDash([26,10]); ctx.beginPath(); ctx.arc(C.x,C.y,430,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
    // her ripple under the ink, and her two moon-eyes looking up through it
    if(e&&e.nPhase===2&&e.sub&&!e.restP){ for(let i=0;i<3;i++){ const r=((t*60+i*30)%90)+20; ctx.strokeStyle=`rgba(230,235,255,${0.6*(1-r/110)})`; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(e.x,e.y,r*1.6,r*0.8,0,0,TAU); ctx.stroke(); }
      for(const sd of [-1,1]){ ctx.fillStyle='rgba(235,235,255,.32)'; ctx.beginPath(); ctx.ellipse(e.x+sd*70,e.y-10,22,12,0,0,TAU); ctx.fill(); } }
    for(const P of N4N.plats){ const lit=P.glow>0;
      ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(P.x,P.y+8,P.r+6,(P.r+6)*0.86,0,0,TAU); ctx.fill();
      ctx.fillStyle=lit?'#d8c8ff':'#cfd4ec'; ctx.beginPath(); ctx.arc(P.x,P.y,P.r,0,TAU); ctx.fill(); ctx.strokeStyle='#3b2233'; ctx.lineWidth=4; ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(P.x-28,P.y-30,36,12,-0.4,0,TAU); ctx.fill();
      if(lit){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+0.35*Math.sin(t*9); ctx.drawImage(foGlowSpr('170,110,255'),P.x-P.r*1.5,P.y-P.r*1.5,P.r*3,P.r*3); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=k;
        for(const sd of [-1,1]){ ctx.fillStyle='rgba(60,20,110,.55)'; ctx.beginPath(); ctx.ellipse(P.x+sd*36,P.y+4,18,10,0,0,TAU); ctx.fill(); }
      }
      if(P.crack){ ctx.strokeStyle='rgba(90,80,140,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.x-50,P.y-20); ctx.lineTo(P.x-6,P.y+4); ctx.lineTo(P.x+40,P.y-30); ctx.moveTo(P.x-6,P.y+4); ctx.lineTo(P.x+10,P.y+60); ctx.stroke(); } }
    ctx.globalAlpha=1; } else N4N.floodA=0;
  // phase 1: the chain ring at each anchor's foot (PULL when its chain is snagged and enough are)
  if(e&&e.nPhase===1){ let sn=0; for(const A of N4N.anchors) if(A.snag) sn++; const ready=sn>=n4nSnagNeed();
    for(const A of N4N.anchors){ const rx=A.x, ry=A.y+20; ctx.strokeStyle='#3b2233'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(rx,ry,10,0,TAU); ctx.stroke(); ctx.strokeStyle=A.snag&&ready?'#fff2b0':'#c8d0e8'; ctx.lineWidth=3.5; ctx.stroke();
      if(A.snag&&ready){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+0.4*Math.sin(t*8); ctx.drawImage(foGlowSpr('255,236,160'),rx-30,ry-30,60,60); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; } } }
  // phase 4: a gold ring on the floor under each glowing crack (where a blow lands)
  if(e&&e.nPhase===4&&e.cracks&&!e.n4done) for(const k of e.cracks){ if(k.broken) continue; ctx.strokeStyle=`rgba(255,226,150,${0.45+0.3*Math.sin(t*5+k.i)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(k.x,k.y,24,14,0,0,TAU); ctx.stroke(); }
  // phase 3: where the piece she is eating hangs (a ring on the floor under it)
  if(e&&e.nPhase===3&&e.perch){ const f=e.perch; ctx.strokeStyle='rgba(255,236,160,.8)'; ctx.lineWidth=3; ctx.setLineDash([10,8]); ctx.lineDashOffset=-t*40; ctx.beginPath(); ctx.ellipse(f.x,f.y,60,28,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}
// standing pieces: the anchor pillars (moonstone, coiled chain) in phase 1, the floating moon fragments in phase 3
function n4nTall(list){ const e=N4N.e&&!N4N.e.dead?N4N.e:null; if(!e) return;
  if(e.nPhase===1||e.trans&&e.transTo===2) for(const A of N4N.anchors){ if(!A.it) A.it={x:A.x,y:A.y+2,draw:()=>n4nAnchorDraw(A)}; list.push(A.it); }
  if(e.nPhase===3||(e.trans&&e.transTo>=3)) for(const f of N4N.frags){ if(f.gone&&!(f.eat>0)) continue; if(!f.it) f.it={x:f.x,y:f.y,flying:true,draw:()=>n4nFragDraw(f)}; f.it.y=f.y+2; list.push(f.it); } }
function n4nAnchorDraw(A){ const t=G.time, x=A.x, y=A.y, lit=A.snag||A.lit>0||A.heat>0, oc=C1OL();
  const s=sbSprite('n4f_anchor',46,g=>{ g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0,40,24,8,0,0,TAU); g.fill();
    g.fillStyle='#5a5470'; g.beginPath(); g.moveTo(-17,40); g.lineTo(-13,-30); g.lineTo(0,-38); g.lineTo(13,-30); g.lineTo(17,40); g.closePath(); g.fill();
    g.fillStyle='#7a7496'; g.beginPath(); g.moveTo(-12,38); g.lineTo(-9,-28); g.lineTo(-1,-34); g.lineTo(-2,38); g.closePath(); g.fill();
    g.strokeStyle='#cfd6f0'; g.lineWidth=2; for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(0,30-i*5,15,5,0,0,Math.PI); g.stroke(); } },1.8);
  drawSprite(s,x,y-30,1,0);
  ctx.save(); ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(x,y-82); ctx.lineTo(x+11,y-68); ctx.lineTo(x,y-54); ctx.lineTo(x-11,y-68); ctx.closePath(); ctx.fill();
  ctx.fillStyle=lit?'#f4f8ff':'#8a94b8'; ctx.beginPath(); ctx.moveTo(x,y-79); ctx.lineTo(x+8,y-68); ctx.lineTo(x,y-57); ctx.lineTo(x-8,y-68); ctx.closePath(); ctx.fill();
  if(lit){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=A.snag?0.85:0.5+A.heat; ctx.drawImage(foGlowSpr('200,215,255'),x-50,y-118,100,100); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; }
  if(A.heat>0&&!A.snag){ ctx.strokeStyle='rgba(230,240,255,.95)'; ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(x,y-68,20,-Math.PI/2,-Math.PI/2+TAU*clamp(A.heat/0.8,0,1)); ctx.stroke(); }
  ctx.restore(); }
function n4nFragDraw(f){ const t=G.time, F=typeof n4FragCv==='function'?n4FragCv():null, bob=Math.sin(t*1.4+f.bob)*8, x=f.x, y=f.y-96+bob, e=N4N.e;
  ctx.save(); ctx.fillStyle='rgba(10,6,24,.25)'; ctx.beginPath(); ctx.ellipse(f.x,f.y+4,34,12,0,0,TAU); ctx.fill();
  ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.55; ctx.drawImage(foGlowSpr('220,225,255'),x-60,y-60,120,120); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  const sc=f.gone?clamp(1-f.eat,0,1):1;
  if(F) ctx.drawImage(F[f.i%F.length],x-40*1.3*sc,y-40*1.3*sc,80*1.3*sc,80*1.3*sc); else { ctx.fillStyle='#e8ecff'; ctx.beginPath(); ctx.arc(x,y,24*sc,0,TAU); ctx.fill(); }
  // she is eating it: a ring timer
  if(e&&e.perch===f){ const k=clamp(f.eat/byDiff(6,5,4),0,1); ctx.strokeStyle='rgba(40,20,60,.8)'; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(x,y,44,0,TAU); ctx.stroke(); ctx.strokeStyle='rgba(255,120,110,.95)'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(x,y,44,-Math.PI/2,-Math.PI/2+TAU*k); ctx.stroke(); }
  ctx.restore(); }
// over everything: the silver chains from the anchors to her wings, PULL, the moth curtains' word, Vesper's pry, the light
function n4nAir(){ const e=N4N.e&&!N4N.e.dead?N4N.e:null, t=G.time; if(!e) return;
  if(e.nPhase===1&&!e.trans){ let sn=0; for(const A of N4N.anchors) if(A.snag) sn++; const ready=sn>=n4nSnagNeed();
    for(const A of N4N.anchors){ if(!A.snag) continue; const sd=A.x<e.x?-1:1, w=T3.on?n4nBodyPt(e,e.x+sd*120,e.y+(A.y<e.y?-20:20),30):{x:e.x+sd*120,y:e.y-(e.z||0)*0.75-50};
      const x0=A.x, y0=A.y-70, mx=(x0+w.x)/2, my=(y0+w.y)/2+30+Math.sin(t*3+A.i)*6*(1-(A.pullT||0));
      ctx.save(); ctx.lineCap='round'; ctx.strokeStyle='rgba(40,30,70,.6)'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo(mx,my,w.x,w.y); ctx.stroke();
      ctx.strokeStyle='#eef2ff'; ctx.lineWidth=3.5; ctx.setLineDash([7,4]); ctx.lineDashOffset=-t*20; ctx.stroke(); ctx.setLineDash([]);
      ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35; ctx.strokeStyle='rgba(200,215,255,1)'; ctx.lineWidth=12; ctx.stroke(); ctx.restore();
      if(ready){ const b=Math.abs(Math.sin(t*5))*8; ctx.save(); ctx.font=`900 ${W<600?18:20}px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=5; ctx.strokeStyle='#3b2233'; const tx=simplify(S('PULL!','PULL!')); ctx.strokeText(tx,A.x,A.y-100-b); ctx.fillStyle='#ffe066'; ctx.fillText(tx,A.x,A.y-100-b); ctx.restore(); } } }
  // phase 2: POUND! over the glowing platform she hides under
  if(e.nPhase===2&&e.restP){ const P=e.restP, b=6*Math.abs(Math.sin(t*5)); ctx.save(); ctx.fillStyle='#fff6c0'; ctx.font=`900 ${W<600?20:24}px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=5; ctx.strokeStyle='#3b2233'; const tx=simplify(S('POUND!','POUND!')); ctx.strokeText(tx,P.x,P.y-P.r-16-b); ctx.fillText(tx,P.x,P.y-P.r-16-b); ctx.restore(); }
  if(N4N.vpry&&N4N.vpry.t<1.6){ const V=N4N.vpry; V.t+=1/60; ctx.save(); ctx.globalAlpha=1-V.t/1.6; ctx.fillStyle='#e8d8ff'; ctx.font=`800 16px ${UIF}`; ctx.textAlign='center'; ctx.fillText(simplify(S('Vesper pries it open!','Vesper helps!')),V.x,V.y-110-V.t*20); ctx.restore(); }
}
// screen space (after the world): the moon filling with light, the streams of light going up to it, the drowsy dim,
// and the stand-in Heart moment
function n4nMoonPos(){ const p=player, r=Math.hypot(p.x-4500,p.y-85200), k=1-clamp((r-700)/3400,0,1), R=Math.min(W,H)*lerp(0.13,0.22,k);
  return {x:W*(W<600?0.5:0.66)-(p.x-4500)*0.01*zoom, y:W<600?H*0.27:84+R*0.72, R}; }
function n4nScreen(){
  const F=N4F.fight, here=F&&F.k==='n_summit', t=G.time;
  // drowsy: the edges of the screen go dim
  if(here&&N4N.dim>0){ const a=clamp(N4N.dim/2.5,0,1)*0.55, g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.25,W/2,H/2,Math.max(W,H)*0.7); g.addColorStop(0,'rgba(20,10,40,0)'); g.addColorStop(1,`rgba(20,10,40,${a})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  // the moon fills (FINALE 8.5: each broken crack fills it a little, like a cup)
  const fill=N4F.moonFill||0, show=(here||(!n4fS()&&N4F.fall))&&fill>0&&n4fMap4();
  const M=n4nMoonPos();
  if(show){ ctx.save(); ctx.beginPath(); ctx.arc(M.x,M.y,M.R*0.86,0,TAU); ctx.clip(); const top=M.y+M.R*0.86-2*M.R*0.86*fill;
    const g=ctx.createLinearGradient(0,top,0,M.y+M.R); g.addColorStop(0,'rgba(250,250,255,.95)'); g.addColorStop(1,'rgba(200,210,255,.85)'); ctx.fillStyle=g; ctx.fillRect(M.x-M.R,top+Math.sin(t*2)*1.5,M.R*2,M.R*2);
    ctx.restore(); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35*fill; ctx.drawImage(foGlowSpr('225,232,255'),M.x-M.R*1.8,M.y-M.R*1.8,M.R*3.6,M.R*3.6); ctx.restore(); }
  // the streams of silver light from the broken cracks, up into the moon
  if(N4N.streamsUp.length){ for(const s of N4N.streamsUp) s.t+=1/60; N4N.streamsUp=N4N.streamsUp.filter(s=>s.t<2.6);
    ctx.save(); ctx.lineCap='round'; ctx.globalCompositeOperation='lighter';
    for(const s of N4N.streamsUp){ if(s.t<0) continue; const sx=(s.x-cam.x)*zoom, sy=(s.y-cam.y)*zoom, k=clamp(s.t/0.5,0,1), a=s.t<2?1:1-(s.t-2)/0.6, ex=lerp(sx,M.x,k), ey=lerp(sy,M.y,k), cx=(sx+M.x)/2+(sx<M.x?-80:80), cy=Math.min(sy,M.y)-60;
      for(const [w,al] of [[s.big?26:16,0.25],[s.big?10:6,0.85]]){ ctx.strokeStyle=`rgba(225,232,255,${al*a})`; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(lerp(sx,cx,k),lerp(sy,cy,k),ex,ey); ctx.stroke(); } }
    ctx.restore(); }
  if(N4N.heartUI) n4nHeartDraw();
}
{ const base=drawRain; drawRain=function(){ base(); try{ if(!AREA&&scene!=='menu'&&G&&player) n4nScreen(); }catch(err){ if(!N4F.scrErr){ N4F.scrErr=1; console.error('n4f screen',err); } } }; }
// her eye-spots in the dark of an Eclipse Wing (over the darkness: drawn with the floating words)
{ const base=drawTexts; drawTexts=function(){ try{ const e=N4N.e; if(e&&!e.dead&&N4N.dark>0.35&&!AREA){ const t=G.time, a=clamp((N4N.dark-0.35)/0.4,0,1); ctx.save(); ctx.globalCompositeOperation='lighter';
      for(const sd of [-1,1]){ const q=T3.on?n4nBodyPt(e,e.x+sd*110,e.y-8,34):{x:e.x+sd*120,y:e.y-(e.z||0)*0.75-60}; ctx.globalAlpha=a*(0.7+0.3*Math.sin(t*3+sd)); ctx.drawImage(foGlowSpr('235,232,255'),q.x-42,q.y-42,84,84); ctx.globalAlpha=a; ctx.fillStyle='rgba(250,250,255,.9)'; ctx.beginPath(); ctx.arc(q.x,q.y,13,0,TAU); ctx.fill(); ctx.fillStyle='rgba(60,40,110,.9)'; ctx.globalCompositeOperation='source-over'; ctx.beginPath(); ctx.arc(q.x,q.y,5.5,0,TAU); ctx.fill(); ctx.globalCompositeOperation='lighter'; }
      ctx.restore(); } }catch(err){} base(); }; }
// ---- the stand-in Heart moment (screen space): the black, Ash and Pip, the Heart with its seams, the meter, the voices
function n4nHeartDraw(){
  const U=N4N.heartUI, p=player, t=U.t, a=U.dark, sx=(p.x-cam.x)*zoom, sy=(p.y-cam.y)*zoom, hx=(U.x-cam.x)*zoom, hy=(U.y-82-cam.y)*zoom+Math.sin(t*2)*3;
  ctx.save();
  if(a>0.01){ const g=ctx.createRadialGradient(sx,sy-20*zoom,20*zoom,sx,sy-20*zoom,120*zoom); g.addColorStop(0,`rgba(0,0,0,${a*0.15})`); g.addColorStop(1,`rgba(0,0,0,${a})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  const warm=0.25+0.75*U.meter, R=15*zoom*1.4;
  if(U.fl>0){ ctx.globalAlpha=U.fl;
    ctx.globalCompositeOperation='lighter'; ctx.drawImage(foGlowSpr('255,170,90'),hx-(70+90*U.meter)*zoom,hy-(70+90*U.meter)*zoom,(140+180*U.meter)*zoom,(140+180*U.meter)*zoom); ctx.globalCompositeOperation='source-over';
    if(!(U.blaze>0)) for(let i=0;i<9;i++){ const an=i/9*TAU+t*0.7, l=(26-14*U.meter)*zoom*(0.7+0.3*Math.sin(t*7+i*2)), bx=hx+Math.cos(an)*R*0.9, by=hy+Math.sin(an)*R*0.9;
      ctx.fillStyle=i%2?'rgba(40,14,70,.92)':'rgba(16,6,30,.95)'; ctx.beginPath(); ctx.moveTo(bx-Math.sin(an)*5,by+Math.cos(an)*5); ctx.quadraticCurveTo(bx+Math.cos(an)*l*0.6,by+Math.sin(an)*l*0.6,bx+Math.cos(an)*l,by+Math.sin(an)*l-l*0.3); ctx.quadraticCurveTo(bx+Math.cos(an)*l*0.4,by+Math.sin(an)*l*0.4,bx+Math.sin(an)*5,by-Math.cos(an)*5); ctx.fill(); }
    ctx.fillStyle='#3a1206'; ctx.beginPath(); ctx.ellipse(hx,hy,R+2,R*1.12+2,0,0,TAU); ctx.fill();
    const g=ctx.createRadialGradient(hx-4,hy-5,2,hx,hy,R*1.1); g.addColorStop(0,`rgba(255,${200+40*warm|0},${120+60*warm|0},1)`); g.addColorStop(0.55,`rgba(${220+30*warm|0},${90+60*warm|0},40,1)`); g.addColorStop(1,'rgba(110,30,14,1)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(hx,hy,R,R*1.12,0,0,TAU); ctx.fill();
    const seams=[[[-0.9,-0.2],[-0.2,-0.5],[0.3,-0.9]],[[-0.7,0.6],[0,0.1],[0.9,0.3]],[[-0.1,-1.05],[0.15,-0.2],[-0.25,0.6],[0.1,1.08]]];
    for(let i=0;i<3;i++){ const lit=U.seam[i]||U.blaze>0, c=N4N_SEAMC[i]; ctx.strokeStyle=lit?`rgba(${c},1)`:'rgba(40,20,30,.85)'; ctx.lineWidth=lit?2.6:1.6; ctx.beginPath(); seams[i].forEach((q,j)=>j?ctx.lineTo(hx+q[0]*R,hy+q[1]*R):ctx.moveTo(hx+q[0]*R,hy+q[1]*R)); ctx.stroke(); if(lit) glowAt(hx+seams[i][1][0]*R,hy+seams[i][1][1]*R,24,c,0.7); }
    if(U.seam[3]||U.blaze>0) glowAt(hx,hy,30,'255,200,120',0.8);
    ctx.strokeStyle='#2a0c06'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(hx,hy,R,R*1.12,0,0,TAU); ctx.stroke();
    if(!(U.blaze>0)&&U.phase!=='intro'){ const RR=R+20; ctx.lineCap='round'; ctx.strokeStyle='rgba(40,30,60,.85)'; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(hx,hy,RR,0,TAU); ctx.stroke();
      ctx.strokeStyle=`rgba(255,${p.breathing?236:190},${p.breathing?140:100},1)`; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(hx,hy,RR,-Math.PI/2,-Math.PI/2+TAU*U.meter); ctx.stroke();
      for(let i=0;i<4;i++){ const an=-Math.PI/2+TAU*N4N_MARKS[i], lit=U.mark>i, c=N4N_SEAMC[i]; ctx.fillStyle=lit?`rgba(${c},1)`:'rgba(120,110,140,.9)'; ctx.beginPath(); ctx.arc(hx+Math.cos(an)*RR,hy+Math.sin(an)*RR,lit?5:3.5,0,TAU); ctx.fill(); if(lit) glowAt(hx+Math.cos(an)*RR,hy+Math.sin(an)*RR,14,c,0.8); } }
    ctx.globalAlpha=1; }
  // the voices' lights fly into the Heart; Pip's spark; Pip's first word
  for(const v of U.voices){ const k=clamp(v.t/2.2,0,1), q=k*k*(3-2*k), vx=lerp((v.x-cam.x)*zoom,hx,q), vy=lerp((v.y-cam.y)*zoom,hy,q)-Math.sin(q*Math.PI)*30; if(k>=1) continue; glowAt(vx,vy,26,v.col,0.85); ctx.fillStyle=`rgba(${v.col},1)`; ctx.beginPath(); ctx.arc(vx,vy,4.5,0,TAU); ctx.fill(); }
  const pp=G.pip?{x:(G.pip.x-cam.x)*zoom,y:(G.pip.y-cam.y)*zoom}:{x:sx+20,y:sy-30};
  if(U.spark>0&&U.spark<1){ const k=U.spark, q=k*k*(3-2*k), x=lerp(pp.x,hx,q), y=lerp(pp.y-14,hy,q)-Math.sin(q*Math.PI)*20; glowAt(x,y,18,'255,220,140',1); ctx.fillStyle='#fff8e0'; ctx.beginPath(); ctx.arc(x,y,3,0,TAU); ctx.fill(); }
  if(U.word>0&&U.word<3.2){ const k=clamp(U.word/0.35,0,1), s=0.6+0.6*k, al=1-clamp((U.word-2.4)/0.8,0,1); ctx.save(); ctx.translate(pp.x,pp.y-58-k*14); ctx.scale(s,s); ctx.globalAlpha=al; ctx.font=`900 30px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='#3a1806'; ctx.strokeText('ASH!',0,0); ctx.fillStyle='#ffe28a'; ctx.fillText('ASH!',0,0); ctx.restore(); }
  // the blaze: a sunrise from the Heart that washes the black away
  if(U.blaze>0&&U.blaze<1.4){ const k=U.blaze/1.4, g=ctx.createRadialGradient(hx,hy,0,hx,hy,Math.max(W,H)*(0.2+k*1.2)); g.addColorStop(0,`rgba(255,248,220,${0.9*(1-k)})`); g.addColorStop(0.4,`rgba(255,200,120,${0.6*(1-k)})`); g.addColorStop(1,'rgba(255,150,80,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  // the prompt
  if(U.phase==='hold'&&scene==='play'){ const big=U.idle>5, s=big?1.15+0.06*Math.sin(t*5):1; ctx.save(); ctx.translate(W/2,H*0.8); ctx.scale(s,s); ctx.textAlign='center'; ctx.font=`800 ${W<600?18:22}px ${UIF}`;
    const tx=simplify(S('Hold BREATHE to keep the Heart warm!','Hold FIRE to warm the Heart!')); ctx.lineWidth=5; ctx.strokeStyle='rgba(30,12,4,.9)'; ctx.strokeText(tx,0,0); ctx.fillStyle=`rgba(255,${210+40*Math.sin(t*4)|0},150,1)`; ctx.fillText(tx,0,0); ctx.restore(); }
  ctx.restore();
}
// the stand-in fall: she lies crumpled on the glass, smaller every second, holding the last sliver of moon
function n4nFallDraw(F){ const e=F.fig||(F.fig={type:'n_nyxara',x:F.x,y:F.y,face:F.face,state:'fallen',z:0,r:70,t:0,alpha:1,nPhase:0,cracks:[]}); e.x=F.x; e.y=F.y; e.n4scale=F.k; e.state='fallen'; e.t=G.time;
  ctx.save(); if(F.fade) ctx.globalAlpha=clamp(1-(F.fa||0)/3,0,1); if(T3.on) n4nFig(e,false); else n4nFig2(e,false);
  const t=G.time; glowAt(F.x+20*F.k,F.y-40*F.k,40*F.k,'235,240,255',0.6+0.2*Math.sin(t*2)); ctx.fillStyle='#eef2ff'; ctx.beginPath(); ctx.arc(F.x+20*F.k,F.y-40*F.k,10*F.k,0.6,TAU-0.6); ctx.arc(F.x+26*F.k,F.y-40*F.k,8*F.k,TAU-0.8,0.8,true); ctx.fill();
  ctx.restore(); }
// the camera leans toward her where she is drawn (as for Vorlaxis in the sky): she is the thing to watch
{ const base=updateCam; updateCam=function(dt,snap){ const e=N4N.e; if(!(e&&!e.dead&&G.boss===e&&N4F.fight&&N4F.fight.k==='n_summit'&&!AREA&&e.mode!=='heart')) return base(dt,snap);
    const nc=e.noClip, ey=e.y; e.noClip=false; e.y=ey-(e.z||0)*0.72-40; try{ return base(dt,snap); } finally{ e.noClip=nc; e.y=ey; } }; }

// ================= 12. the scripted fighter (tests) and the debug hooks (window.__ebX.n4f, also __eb.n4f)
// The bot plays through Ash's own controls: it walks with the stick, breathes fire or Moonfire (FIRE, facing the target;
// it swaps the breath like the O key), holds fire for Blaze, jumps and Ground Pounds (JUMP, then ATTACK in the air),
// Shadow Dashes (ROLL on dry ground), dives into shadow pools (ROLL on a pool) and burrows (ROLL on sand). Shortcuts, as
// in the earlier bots: a blade, whip or Glaive blow is the game's wStrike on the hit circle in reach (no swing
// animation; the whip and Glaive reach 150 and 260), a Blast Bomb is thrown with throwBomb, and a PULL on a grapple
// ring calls the ring's own onPull and then while Ash stands at it (the rope itself is not simulated).
const N4FB={on:false,k:null,mech:true,heal:true,t:0,inp:{},tap:{},force:{},forceT:0,tx:null,ty:null,prog:{t:0,x:0,y:0},stuckT:0,side:1,hitT:0,heals:0,ev:{},dealt:0,dodges:0,rollT:0,pound:0,pullT:0,bombT:0,fireT:0,jT:0};
function n4bEv(k){ N4FB.ev[k]=(N4FB.ev[k]||0)+1; }
function n4bTap(k){ N4FB.tap[k]=true; }
{ const base=readInput; readInput=function(dt){ const o=base(dt);
    if(N4FB.on){ const I=N4FB.inp; for(const k in I) if(I[k]) o[k]=I[k]; let any=false; for(const k in N4FB.tap) if(N4FB.tap[k]){ o[k]=true; any=true; } if(any) N4FB.tap={}; }
    if(N4FB.forceT>0){ N4FB.forceT-=dt; for(const k in N4FB.force) o[k]=N4FB.force[k]; if(N4FB.forceT<=0) N4FB.force={}; } return o; }; }
{ const base=updateEnemies; updateEnemies=function(dt){ if(N4FB.on) try{ n4bFrame(dt); }catch(err){ console.error('n4f bot',err); } base(dt); }; }
function n4bGo(x,y){ N4FB.tx=x; N4FB.ty=y; }
function n4bAt(x,y,r){ return dist(player.x,player.y,x,y)<(r||40); }
// the Shadow Sea is up: keep to the rim (and the platform Ash is on); a way round the rim to the target
function n4bSea(){ return !!(N4N.flood&&N4F.fight&&N4F.fight.k==='n_summit'); }
function n4bRimWay(tx,ty){ const C=N4N.C, p=player, rp=dist(p.x,p.y,C.x,C.y), rt=dist(tx,ty,C.x,C.y), P=n4nOnPlat(p.x,p.y);
  if(P){ const Q=n4nOnPlat(tx,ty); if(Q===P) return {x:tx,y:ty}; return {x:p.x,y:p.y}; }
  if(rp<530){ const a=angTo(C.x,C.y,p.x,p.y); return {x:C.x+Math.cos(a)*565,y:C.y+Math.sin(a)*565}; }
  const a0=angTo(C.x,C.y,p.x,p.y), a1=angTo(C.x,C.y,tx,ty), d=angDiff(a0,a1);
  if(Math.abs(d)<0.22||rt<525&&Math.abs(d)<0.1) return {x:rt<530?C.x+Math.cos(a1)*560:tx,y:rt<530?C.y+Math.sin(a1)*560:ty};
  const a=a0+Math.sign(d)*0.3; return {x:C.x+Math.cos(a)*565,y:C.y+Math.sin(a)*565}; }
function n4bMove(dt){
  const p=player, I=N4FB.inp; I.mx=0; I.my=0; I.sprint=false; if(N4FB.tx==null) return;
  let tx=N4FB.tx, ty=N4FB.ty; if(n4bSea()){ const w=n4bRimWay(tx,ty); tx=w.x; ty=w.y; }
  const dx=tx-p.x, dy=ty-p.y, d=Math.hypot(dx,dy); if(d<8) return;
  const P=N4FB.prog; P.t+=dt; if(P.t>0.5){ if(dist(p.x,p.y,P.x,P.y)<12&&d>40){ N4FB.stuckT=0.45; N4FB.side=Math.random()<0.5?1:-1; } P.t=0; P.x=p.x; P.y=p.y; }
  let a=Math.atan2(dy,dx); if(N4FB.stuckT>0){ N4FB.stuckT-=dt; a+=N4FB.side*1.2; }
  const k=Math.min(1,d/30); I.mx=Math.cos(a)*k; I.my=Math.sin(a)*k; I.sprint=d>160&&!n4fDiving()&&!n4fBur(); }
// keep a distance r from a foe at an angle (default: where Ash is), inside the walls
function n4bNear(e,r,a){ const p=player, b=G.bf; a=a!=null?a:angTo(e.x,e.y,p.x,p.y); const q={x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r}; if(b&&b.A&&b.A.on) arenaHold(b.A,q,40); n4bGo(q.x,q.y); }
// a blow on the best hit circle in reach (the highest multiplier): the sword, or the whip / Glaive (src)
function n4bSwing(e,mul,src,reach){
  const p=player; if(!e||e.dead||e.invuln||e.spawnIn>0||n4fBur()||n4fDiving()) return false; reach=reach||78; let best=null;
  for(const c of hitCircles(e)) if(dist(p.x,p.y,c.x,c.y)-c.r<reach&&(!best||c.m>best.m)) best=c;
  if(!best) return false; p.facing=angTo(p.x,p.y,best.x,best.y);
  if(!(p.swingT>0)){ p.swingW='sword'; p.swingFin=false; p.swingSpin=false; p.swingDur=0.2; p.swingT=0.2; p.swingHit=new Set(G.enemies.map(q=>q.id)); p.swingHitstop=true; p.swingObj=true; ATK.swingT=G.time; }
  const before=e.hp; wStrike(e,best,mul||1,'sword',{src:src&&src!=='sword'?src:undefined,kb:60,ka:p.facing,fx:p.x,fy:p.y}); N4FB.dealt+=Math.max(0,before-e.hp); return true; }
// breathe (fire, or Moonfire) at a spot: closer first, then stand and breathe facing it
function n4bBreath(x,y,moon,reach){ const p=player, I=N4FB.inp; reach=reach||150;
  if(typeof canMoon==='function'&&canMoon()&&moon!==n4fMoonOn()&&typeof p4MoonToggle==='function') p4MoonToggle();
  const d=dist(p.x,p.y,x,y); if(d>reach){ n4bGo(x+(p.x-x)/Math.max(1,d)*reach*0.75,y+(p.y-y)/Math.max(1,d)*reach*0.75); I.fire=false; return false; }
  N4FB.tx=null; p.facing=angTo(p.x,p.y,x,y); I.fire=true; if(p.exhausted) p.exhausted=false; return true; }
function n4bPound(){ if(N4FB.pound>0||n4fDiving()||n4fBur()||(player.z||0)>2) return false; N4FB.pound=0.45; n4bTap('jump'); n4bEv('pound'); return true; }
function n4bRoll(){ if(N4FB.rollT>G.time) return false; N4FB.rollT=G.time+0.55; n4bTap('roll'); return true; }
function n4bBomb(x,y){ const p=player; if(N4FB.bombT>G.time||typeof throwBomb!=='function'||bombsN()<=0) return false; const d=dist(p.x,p.y,x,y); if(d>430) return false;
  p.facing=angTo(p.x,p.y,x,y); throwBomb(p,clamp((d*0.8-70)/(300-70),0,1)); N4FB.bombT=G.time+1.4; n4bEv('bomb'); return true; }
function n4bPull(r,e,dt){ if(!r||r.done) { N4FB.pullT=0; return false; } r.onPull(r,e,{strain:N4FB.pullT/r.need,taut:true,dt}); N4FB.pullT+=dt; if(N4FB.pullT>=r.need){ N4FB.pullT=0; r.then(r,e); n4bEv('pull'); } return true; }
// where the danger is: marked circles, lines, cones, donuts; the foes' own wind-ups. A point to run to, or null
function n4bDanger(){
  const p=player, out=(cx,cy,r)=>{ const a=angTo(cx,cy,p.x,p.y)+(Math.random()<0.5?0.3:-0.3); return {x:cx+Math.cos(a)*(r+55),y:cy+Math.sin(a)*(r+55)}; };
  const side=(x0,y0,ang,w)=>{ const nx=-Math.sin(ang), ny=Math.cos(ang), s=((p.x-x0)*nx+(p.y-y0)*ny)>=0?1:-1; return {x:p.x+nx*s*(w/2+60),y:p.y+ny*s*(w/2+60)}; };
  const inLine=(x0,y0,ang,len,w)=>{ const dx=p.x-x0, dy=p.y-y0, u=dx*Math.cos(ang)+dy*Math.sin(ang), v=-dx*Math.sin(ang)+dy*Math.cos(ang); return u>-p.r&&u<len+p.r&&Math.abs(v)<w/2+p.r; };
  for(const z of G.fz||[]){ if(z.fired||z.sparkle) continue;
    if(z.k==='n4fmark'||z.k==='c1mark'||z.k==='c1lob'||z.k==='m3mark'){
      if(z.shape==='line'){ if(inLine(z.x,z.y,z.ang||0,z.len,z.w||30)) return side(z.x,z.y,z.ang||0,z.w||30); continue; }
      if(z.shape==='cone'){ if(dist(z.x,z.y,p.x,p.y)<z.len+p.r&&Math.abs(angDiff(z.ang||0,angTo(z.x,z.y,p.x,p.y)))<(z.half||0.5)+0.15) return out(z.x,z.y,z.len); continue; }
      if(z.shape==='donut'){ const d=dist(z.x,z.y,p.x,p.y); if(d>z.r1-p.r&&d<z.r2+p.r) return {x:z.x+(p.x-z.x)/Math.max(1,d)*Math.max(10,z.r1-60),y:z.y+(p.y-z.y)/Math.max(1,d)*Math.max(10,z.r1-60)}; continue; }
      if(z.r&&dist(z.x,z.y,p.x,p.y)<z.r+p.r) return out(z.x,z.y,z.r); }
    if(z.k==='n4ntorn'&&dist(z.x,z.y,p.x,p.y)<z.r+50) return out(z.x,z.y,z.r+30); }
  for(const q of G.enemies){ if(q.dead||!q.tele) continue; const T=q.tele;
    if(T.shape==='arc'||T.shape==='cone'){ const r=T.r||T.len||60, half=T.half||1; if(dist(q.x,q.y,p.x,p.y)<r+p.r&&Math.abs(angDiff(q.face,angTo(q.x,q.y,p.x,p.y)))<half+0.2) return out(q.x,q.y,r); }
    else if(T.shape==='line'){ if(inLine(q.x,q.y,q.face,T.len||300,T.w||30)) return side(q.x,q.y,q.face,T.w||30); }
    else if(T.shape==='circle'||T.shape==='ring'){ const r=T.r||60; if(dist(q.x,q.y,p.x,p.y)<r+p.r) return out(q.x,q.y,r); } }
  return null; }
// jump rolling rings (Lullaby, Ink Wave, stomp rings); dash through the Great Shush
function n4bHop(){ const p=player; if((p.z||0)>3||n4fDiving()||n4fBur()||N4FB.pound>0||N4FB.jT>G.time) return; let jump=false;
  for(const z of G.fz||[]) if(z.k==='n4nring'&&!z.hit&&Math.abs(dist(z.x,z.y,p.x,p.y)-z.rad)<60&&dist(z.x,z.y,p.x,p.y)>z.rad-10) jump=true;
  for(const R of G.rings) if(R.owner!=='player'&&R.dmg>0&&Math.abs(dist(R.x,R.y,p.x,p.y)-R.rad)<56&&!(R.delay>0)) jump=true;
  if(jump&&!(N4F.fight&&N4F.fight.fly&&player.flying)){ N4FB.jT=G.time+0.6; n4bTap('jump'); n4bEv('hop'); } }
function n4bFrame(dt){
  const p=player, I=N4FB.inp; N4FB.t+=dt; I.fire=false; I.attack=false; I.mx=0; I.my=0;
  if(p.dead){ N4FB.tx=null; return; }
  if(N4FB.heal&&p.hp<p.maxHp*0.4){ p.hp=p.maxHp; N4FB.heals++; }
  if(N4FB.pound>0){ N4FB.pound-=dt; if((p.z||0)>0||(p.vz||0)>0) I.attack=true; }
  // the Heart moment (the stand-in, or the story's): hold fire
  if(G.flags.n_heart_on||N4N.heartUI){ N4FB.tx=null; I.fire=true; if(typeof canMoon==='function'&&canMoon()&&n4fMoonOn()&&typeof p4MoonToggle==='function') p4MoonToggle(); n4bEv('heartHold'); return; }
  const e=G.boss&&!G.boss.dead?G.boss:null;
  if(!e||G.fightIntro||scene!=='play'){ N4FB.tx=null; n4bMove(dt); return; }
  N4FB.hitT-=dt; const swing=(k,src,reach)=>{ if(N4FB.hitT<=0&&n4bSwing(e,k||1,src,reach)){ N4FB.hitT=0.42; return true; } return false; };
  const busy=n4bPlan(e,dt,swing);
  // small foes close by get swatted
  if(N4FB.hitT<=0&&!I.fire){ let q=null, bd=1e9; for(const f of G.enemies){ if(f===e||f.dead||f.boss||f.passive||f.spawnIn>0) continue; const dd=dist(p.x,p.y,f.x,f.y)-f.r; if(dd<60&&dd<bd){ bd=dd; q=f; } } if(q&&n4bSwing(q,1)){ N4FB.hitT=0.42; n4bEv('swat'); } }
  if(!busy){ const q=n4bDanger(); if(q){ n4bGo(q.x,q.y); I.fire=false; N4FB.dodges++; } }
  n4bHop(); n4bMove(dt);
}
// ---- one boss's plan for this frame (true while a dodge must not pull Ash away)
function n4bPlan(e,dt,swing){
  const p=player, T=e.type, M=N4FB.mech, near=(r,a)=>n4bNear(e,r==null?e.r+40:r,a);
  // Echo of the First Flame: two braziers lit (B1 on the floor, B3 on the moat islet, B2 on the pillar), then his head
  if(T==='n_echo_vor'){
    if(M&&!n4vSolid()){ for(const id of ['b1','b3','b2','b4']){ const b=N4V.br.find(o=>o.id===id); if(b&&!b.lit&&!(b.skipT>G.time)) return n4bBrazier(b,dt); } }
    if(e.state==='breathW'||e.state==='breath'){ near(e.r+170,e.face+Math.PI*0.6); return false; }
    n4bGo(e.headX+Math.cos(e.face)*40,e.headY+Math.sin(e.face)*40); swing(1); return false; }
  // Echo of the Moth Mask: whip the real one (yank), knock her off a balcony (the whip from below), then the blade
  if(T==='n_echo_vesper'){
    if(e.n4bal){ const B=e.n4bal; if(B.ph==='perch'){ n4bGo(B.b.x,B.b.y+50); if(M&&dist(p.x,p.y,e.x,e.y)<170){ if(N4FB.hitT<=0&&n4bSwing(e,1,'whip',170)){ N4FB.hitT=0.42; n4bEv('whipKnock'); } } } else near(160); return true; }
    if(e.n4stag>0||e.state==='dizzy'){ near(e.r+30); swing(1); return false; }
    if(M&&(e.yanks||0)<byDiff(1,1,2)+(e.bph>=1?1:0)){ near(110); if(dist(p.x,p.y,e.x,e.y)<150&&N4FB.hitT<=0&&n4bSwing(e,1,'whip',150)){ N4FB.hitT=0.5; n4bEv('whip'); } return false; }
    near(e.r+34); swing(1); return false; }
  // Echo of the Ice Dragon: pound a rune plate, Blaze its lock (x4); in the air pound her landing, bomb her breath
  if(T==='n_echo_glaciar'){
    if(e.mode!=='n4air'){
      if(M&&n4e3Left()>0&&!(e.n4stun>0)){ let q=null; for(const o of N4E3.posts) if(!o.snap&&(!q||dist(p.x,p.y,o.px,o.py)<dist(p.x,p.y,q.px,q.py))) q=o;
        // Blaze the lock from outside the post (away from her tail), facing in
        if(q.crack>0.6){ const a=angTo(N4E3.C.x,N4E3.C.y,q.x,q.y), sx=q.x+Math.cos(a)*70, sy=q.y+Math.sin(a)*70; if(!n4bAt(sx,sy,24)){ n4bGo(sx,sy); return false; } if(n4bBreath(q.lx,q.ly,false,200)) n4bEv('blaze'); return true; }
        if(!n4bAt(q.px,q.py,26)){ n4bGo(q.px,q.py); return false; } n4bPound(); return true; }
      near(e.r+30); swing(1); return false; }
    if(e.n4stun>0){ near(e.r+20); swing(1); return false; }
    if(e.n4slam&&e.n4slam.ph==='land'&&e.n4land>0){ if(M&&dist(p.x,p.y,e.x,e.y)<110){ n4bPound(); return true; } n4bGo(e.x,e.y+60); return true; }
    if(M&&e.n4inh){ const H=f2GlaHead(e); n4bBomb(H.x,H.y); near(220); return false; }
    if((e.z||0)>36){ near(200); if(dist(p.x,p.y,e.x,e.y)<260) swing(0.8,'glaive',260); return false; }
    near(e.r+30); swing(1); return false; }
  // Echo of the Hush: Moonfire a moonstone (the lamp rule), all three in an eclipse, burrow from the shush, hit the knots
  if(T==='n_echo_hush'){ const P=e.m3hp, C=N4E4.C; if(!P){ near(); swing(1); return false; }
    const sh=(G.fz||[]).find(z=>z.k==='m3shush');
    if(M&&sh){ const r=dist(p.x,p.y,C.x,C.y); if(!n4fBur()){ if(r<215||r>280){ const a=angTo(C.x,C.y,p.x,p.y); n4bGo(C.x+Math.cos(a)*245,C.y+Math.sin(a)*245); } else { N4FB.tx=null; if(n4bRoll()) n4bEv('burrow'); } } else N4FB.tx=null; return true; }
    if(n4fBur()) n4bRoll();
    if(e.low||e.downT>0){ near(e.r+26); swing(1); return false; }
    const lightStone=all=>{ let S0=null; for(const s of P.stones) if(!(s.lit>(all?3:0))&&(!S0||dist(p.x,p.y,s.x,s.y)<dist(p.x,p.y,S0.x,S0.y))) S0=s; if(!S0) return false;
      if(dist(p.x,p.y,S0.x,S0.y+70)>30) n4bGo(S0.x,S0.y+70); else { n4bBreath(S0.x,S0.y-22,true,175); n4bEv('stone'); } return true; };
    if(M&&e.bph===0&&!(e.lureCd>G.time)){ if(lightStone(false)) return false; }
    if(M&&e.bph===1&&e.ecl){ if(lightStone(true)) return false; }
    if(M&&e.bph>=2){ let K=null; for(const k of P.knots) if(!(k.jerkT>0)&&(!K||dist(p.x,p.y,k.x,k.y)<dist(p.x,p.y,K.x,K.y))) K=k;
      if(K){ n4bGo(K.x,K.y+36); if(dist(p.x,p.y,K.x,K.y)<70){ const j=e.jerks; swing(1); if(e.jerks>j) n4bEv('knot'); } return false; } }
    near(e.r+50,(N4FB.t*0.6)%TAU); swing(1,(e.z||0)>40?'glaive':null,(e.z||0)>40?240:78); return false; }
  // Nyxara
  if(T==='n_nyxara') return n4bNyx(e,dt,swing);
  near(); swing(1); return false;
}
// the Echo's braziers: B1 from the floor; B3 from the islet (walk over the water); B2 from the pillar top (Double Jump);
// B4 from the ledge (jump the ink ring)
function n4bBrazier(b,dt){ const p=player;
  if(!b.need){ if(n4bBreath(b.x,b.y-20,false,110)) n4bEv('brazier'); return true; }
  if(b.need==='islet'){ const sx=b.sx, sy=b.sy+36; if(!n4bAt(sx,sy,14)){ n4bGo(sx,sy); b.tryT=(b.tryT||0)+dt; if(b.tryT>14){ b.tryT=0; b.skipT=G.time+30; } return true; } N4FB.tx=null; p.facing=-Math.PI/2; N4FB.inp.fire=true; n4bEv('brazier'); return true; }
  if(b.need==='pillar'){ if(n4fLvl()>=3&&dist(p.x,p.y,b.sx,b.sy)<b.sr){ const sx=b.sx, sy=b.sy+28; if(!n4bAt(sx,sy,10)){ n4bGo(sx,sy); return true; } p.facing=-Math.PI/2; N4FB.inp.fire=true; n4bEv('brazier'); return true; }
    const sx=b.sx, sy=b.sy+b.sr+30; if(!n4bAt(sx,sy,16)&&(p.z||0)<2){ n4bGo(sx,sy); return true; }
    n4bGo(b.sx,b.sy+10); if((p.z||0)<2&&!(N4FB.jT>G.time)){ N4FB.jT=G.time+0.25; n4bTap('jump'); } else if((p.z||0)>8&&(p.vz||0)<40&&!(N4FB.j2T>G.time)){ N4FB.j2T=G.time+1; n4bTap('jump'); }
    if((p.z||0)>34&&dist(p.x,p.y,b.sx,b.sy)<b.sr){ p.facing=angTo(p.x,p.y,b.x,b.y-20); N4FB.inp.fire=true; } b.tryT=(b.tryT||0)+dt; if(b.tryT>12){ b.tryT=0; b.skipT=G.time+30; } return true; }
  if(b.need==='ledge'){ const sx=b.sx, sy=b.sy+150; if(dist(p.x,p.y,b.sx,b.sy)<40){ p.facing=-Math.PI/2; N4FB.tx=null; N4FB.inp.fire=true; return true; }
    if(dist(p.x,p.y,b.sx,b.sy)>140){ n4bGo(sx,sy); return true; } n4bGo(b.sx,b.sy); if((p.z||0)<2&&!(N4FB.jT>G.time)){ N4FB.jT=G.time+0.8; n4bTap('jump'); } b.tryT=(b.tryT||0)+dt; if(b.tryT>12){ b.tryT=0; b.skipT=G.time+30; } return true; }
  return false; }
// ---- the Night Mother
function n4bNyx(e,dt,swing){
  const p=player, M=N4FB.mech, C=N4N.C, near=(r,a)=>n4bNear(e,r,a);
  if(e.mode==='heart'||e.trans||e.n4done){ N4FB.tx=null; return true; }
  // a window: hit her head (or her body)
  if(e.win>0||e.state==='dizzy'&&e.nPhase<4){ const f=e.face||Math.PI/2, hx=e.x+Math.cos(f)*62, hy=e.y+Math.sin(f)*42; n4bGo(hx+Math.cos(f)*50,hy+Math.sin(f)*40); swing(1); return false; }
  if(e.nPhase===1){ let sn=0; for(const A of N4N.anchors) if(A.snag) sn++; const ready=sn>=n4nSnagNeed();
    // inside a curtain box with nothing left to do there: Shadow Dash back out (south)
    const box=N4N.anchors.find(q=>q.curtain&&Math.abs(p.x-q.x)<130&&Math.abs(p.y-q.y)<130);
    if(box&&(box.snag||!M)){ if(dist(p.x,p.y,box.x,box.y)<60&&p.y<box.y+10){ n4bGo(box.x,box.y+60); return true; } N4FB.tx=null; p.facing=Math.PI/2; if(n4bRoll()) n4bEv('dashOut'); return true; }
    if(M&&ready){ // pull a snagged anchor's chain ring (the open ones first)
      let A=null; for(const q of N4N.anchors) if(q.snag&&(!A||n4bAnchorCost(q)<n4bAnchorCost(A))) A=q;
      const r=e.p2rings.find(q=>q.A===A); const s=n4bAnchorSpot(A,40); if(!n4bAt(s.x,s.y,26)){ n4bGo(s.x,s.y); return true; } N4FB.tx=null; n4bPull(r,e,dt); return true; }
    if(M){ let A=null; for(const q of N4N.anchors) if(!q.snag&&(!A||n4bAnchorCost(q)<n4bAnchorCost(A))) A=q;
      if(A){ const inside=dist(p.x,p.y,A.x,A.y)<=120;
        if(A.curtain&&!inside){ const s={x:A.x,y:A.y+190}; if(!n4bAt(s.x,s.y,20)){ n4bGo(s.x,s.y); return true; } N4FB.tx=null; p.facing=-Math.PI/2; if(n4bRoll()) n4bEv('dash'); return true; }
        const s=n4bAnchorSpot(A,110); if(!A.curtain){ if(!n4bAt(s.x,s.y,26)){ n4bGo(s.x,s.y); return true; } }
        if(n4bBreath(A.x,A.y-60,true,170)) n4bEv('anchor'); return true; } }
    near(240,(N4FB.t*0.3)%TAU); return false; }
  if(e.nPhase===2){ const here=n4nOnPlat(p.x,p.y);
    if(M&&e.restP){ const P=e.restP; if(here===P){ if(!n4bAt(P.x,P.y,40)){ n4bGo(P.x,P.y); return true; } n4bPound(); return true; }
      if(here){ return n4bPoolGo(N4N.pools.find(o=>o.id==='n4f_np'+here.i)); }
      const i=N4N_LINK.findIndex(L=>L[1]===P.i), o=N4N.pools.find(q=>q.id==='n4f_nr'+i); return n4bPoolGo(o); }
    if(here){ return n4bPoolGo(N4N.pools.find(o=>o.id==='n4f_np'+here.i)); }
    // wait on the rim, near the pool to the next platform
    const a=angTo(C.x,C.y,p.x,p.y); n4bGo(C.x+Math.cos(a)*565,C.y+Math.sin(a)*565); return false; }
  if(e.nPhase===3){
    if(e.perch&&M){ const F=n4nFace(e), a=angTo(C.x,C.y,F.x,F.y), sx=C.x+Math.cos(a)*(dist(C.x,C.y,F.x,F.y)-120), sy=C.y+Math.sin(a)*(dist(C.x,C.y,F.x,F.y)-120);
      if(!n4bAt(sx,sy,30)){ n4bGo(sx,sy); return true; } if(n4bBreath(F.x,F.y,true,170)) n4bEv('faceFire'); return true; }
    if(e.tumble){ n4bGo(e.tumble.x1,e.tumble.y1+60); return true; }
    const f=e.toFrag; if(f){ const a=angTo(C.x,C.y,f.x,f.y); n4bGo(C.x+Math.cos(a)*470,C.y+Math.sin(a)*470); return false; }
    near(260); return false; }
  if(e.nPhase===4){ if(!e.cracks) return false; let k=null; for(const q of e.cracks) if(!q.broken&&(!k||dist(p.x,p.y,q.x,q.y)<dist(p.x,p.y,k.x,k.y))) k=q; if(!k) return false;
    const a=angTo(e.x,e.y,k.x,k.y), sx=k.x+Math.cos(a)*48, sy=k.y+Math.sin(a)*36;
    if(e.act&&e.act.k==='bite'&&e.act.ph==='go'){ return false; }
    if(!n4bAt(sx,sy,24)){ n4bGo(sx,sy); return false; }
    // every other crack with Heartfire (1.2 s), the rest with blows
    if(M&&k.i%2===1&&N4FB.mech){ if(n4bBreath(k.x,k.y-24,false,120)) n4bEv('crackFire'); return false; }
    if(swing(1)) n4bEv('crackSwing'); return false; }
  return false; }
// a spot by an anchor, on the side toward the middle (r px out)
function n4bAnchorSpot(A,r){ const a=angTo(A.x,A.y,N4N.C.x,N4N.C.y); return {x:A.x+Math.cos(a)*r,y:A.y+Math.sin(a)*r}; }
function n4bAnchorCost(A){ return dist(player.x,player.y,A.x,A.y)+(A.curtain?250:0); }
// walk onto a shadow pool and ROLL into it (the twin carries Ash across)
function n4bPoolGo(o){ if(!o) return false; const p=player; if(n4fDiving()){ N4FB.tx=null; return true; } if(!n4bAt(o.x,o.y,16)){ n4bGo(o.x,o.y); return true; } N4FB.tx=null; if(n4bRoll()) n4bEv('pool'); return true; }

// ---- tests: a fight now. __ebX.n4f.test(site,{diff:0|1|2, intro:false, phase, heartDone, level, allies:[ids]})
const N4F_KIT=['jump','stride','wings','dbljump','skimmer','claws','grapple','shadow','blaze','windride','pound','dive','burrow','moonfire'];
function n4fKit(o){ o=o||{}; if(window.__eb&&window.__eb.bal&&o.diff!=null) window.__eb.bal.setDiff(o.diff);
  G.abil=G.abil||{}; for(const id of N4F_KIT) G.abil[id]=true; G.skills=G.skills||{}; G.skills.dbljump=G.skills.dbljump||1; G.flags.forge=true;
  for(const w of ['bombs','glaive','whip']) if(G.weapons&&!G.weapons[w]&&typeof giveWeapon==='function') try{ giveWeapon(w,true); }catch(err){}
  G.flags.wpn_bombs=10; if(typeof equipWeapon==='function'&&G.weapons&&G.weapons.sword) try{ equipWeapon('sword',true); }catch(err){}
  if(typeof P2!=='undefined'&&P2.tips) for(const k of ['climb','hang','pull','chain','ring']) P2.tips[k]=9;
  if(typeof P4!=='undefined'&&P4.tips) for(const k of ['dive','burrow','deep','sand','moonswap','pool','sink']) P4.tips[k]=9;
  if(o.level&&window.__eb&&window.__eb.bal&&window.__eb.bal.hero) window.__eb.bal.hero(o.level); return true; }
const N4F_SITEAT={n_echo1:{x:4500,y:81760},n_echo2:{x:6515,y:87470},n_echo3:{x:3121,y:86830},n_echo4:{x:3315,y:85290},n_summit:{x:4500,y:85780}};
function n4fTest(k,o){ o=o||{}; const s=SITES[k]; if(!s) return null; const P=POI[s.poi], type=s.boss;
  N4F.force=true; n4fKit(o); if(DLG){ DLG=null; hideAll(); } if(scene!=='play') scene='play'; if(AREA) exitArea(true); if(G.fightSite) resetBoss();
  for(const q of G.enemies) if(!q.dead&&dist(q.x,q.y,P.x,P.y)<P.r+1000) q.dead=true;
  delete G.siteGuards[k]; G.bossDone[type]=false; G.flags[type+'_won']=0; G.fightIntro=false; if(!o.retry) delete G.flags['n4f_try_'+type];
  Object.assign(N4F,{dmg:0,hits:0,bySrc:{},ev:{},tips:{},said:{},fall:null,moonFill:0,dth:{},finished:false}); if(typeof M3!=='undefined') M3.ev={};
  if(k==='n_summit'){ if(o.phase) G.flags.n_phase=o.phase; else delete G.flags.n_phase; G.flags.n_heart_done=o.heartDone||o.phase===4?1:0; G.flags.n_heart_on=0; }
  if(o.allies){ const C=G.choices; C.greymane=o.allies.includes('greymane')?'ally':'no'; C.cinder=o.allies.includes('cinder')?'ally':'no'; G.flags.tk_come=o.allies.includes('tikka')?'yes':'no';
    C.c_vesper=o.allies.includes('vesper')?'friend':'foe'; C.f_glaciar=o.allies.includes('glaciar')?'free':'foe'; C.m_hush=o.allies.includes('hush')?'free':'foe'; }
  if(o.ending) G.choices.ending=o.ending;
  const at=N4F_SITEAT[k]||{x:P.x,y:P.y+P.r*0.48}; player.x=at.x; player.y=at.y; player.kvx=player.kvy=0; player.dead=false; player.hp=player.maxHp; player.flying=false; player.z=0; updateCam(0,true); G.chunkBurst=16;
  if(o.intro===false){ G.fightSite=k; startBossFight(k); }
  return {k,boss:type,x:P.x,y:P.y,r:P.r};
}
const N4F_DBG={N4F,N4N,N4FB,N4V,N4E2,N4E3,N4E4,N4FM,N4FSITE,test:n4fTest,kit:n4fKit,
  types:['n_shade','n_shade_wolf','n_shade_drake','n_mothling','n_lampmoth','n_inkknight','n_glasswing','n_frostshade','n_echo_vclone','n_echo_vor','n_echo_vesper','n_echo_glaciar','n_echo_hush','n_nyxara'],
  sites:['n_echo1','n_echo2','n_echo3','n_echo4','n_summit'],
  bot(k,o){ o=o||{}; Object.assign(N4FB,{on:true,k,mech:o.mech!==false,heal:o.heal!==false,t:0,inp:{},tap:{},tx:null,ty:null,hitT:0,heals:0,ev:{},dealt:0,dodges:0,rollT:0,pound:0,pullT:0,bombT:0,jT:0,j2T:0}); for(const b of N4V.br){ b.tryT=0; b.skipT=0; } return true; },
  stop(){ N4FB.on=false; N4FB.tx=null; N4FB.inp={}; N4FB.tap={}; return true; },
  state(){ const e=G.boss, F=N4F.fight; return {scene,site:G.fightSite,intro:!!G.fightIntro,fight:F?F.k:null,done:Object.assign({},G.bossDone),flags:{n_phase:G.flags.n_phase||0,n_heart_on:G.flags.n_heart_on||0,n_heart_done:G.flags.n_heart_done||0},
      dmg:Math.round(N4F.dmg),hits:N4F.hits,heals:N4FB.heals,dodges:N4FB.dodges,dealt:Math.round(N4FB.dealt),t:+N4FB.t.toFixed(1),ev:Object.assign({},N4F.ev,typeof M3!=='undefined'&&N4FB.k==='n_echo4'?Object.fromEntries(Object.entries(M3.ev||{}).map(([k,v])=>['m3_'+k,v])):{}),bot:Object.assign({},N4FB.ev),
      src:Object.fromEntries(Object.entries(N4F.bySrc).map(([k,v])=>[k,Math.round(v)])),moonFill:+(N4F.moonFill||0).toFixed(2),fall:!!N4F.fall,heartUI:N4N.heartUI?N4N.heartUI.phase:null,
      allies:N4F.allies.map(a=>a.id),cue:N4F.cue?{x:Math.round(N4F.cue.x),y:Math.round(N4F.cue.y)}:null,
      boss:e&&!e.dead?{type:e.type,hp:Math.round(e.hp),max:Math.round(e.maxHp),pct:+(e.hp/e.maxHp).toFixed(3),bph:e.bph||0,nPhase:e.nPhase||0,state:e.state,mode:e.mode||null,level:e.level,x:Math.round(e.x),y:Math.round(e.y),z:Math.round(e.z||0),
        win:+(e.win||0).toFixed(1),wins:e.wins,trans:e.trans||0,broken:e.broken||0,lit:e.type==='n_echo_vor'?n4vLitN():undefined,yanks:e.yanks,knocks:e.knocks,stuns:e.stuns,chains:e.type==='n_echo_glaciar'?n4e3Left():undefined,
        dazzles:e.dazzles,eclBroken:e.eclBroken,jerks:e.jerks,invuln:!!e.invuln,sub:!!e.sub}:null,
      foes:G.enemies.filter(q=>!q.dead).map(q=>q.type),player:{x:Math.round(player.x),y:Math.round(player.y),z:Math.round(player.z||0),hp:Math.round(player.hp),max:player.maxHp,lvl:n4fLvl(),level:player.level,fly:!!player.flying,dive:n4fDiving(),bur:n4fBur()}}; },
  dlg(){ return DLG?{who:lineParts(DLG.lines[DLG.i]).who,opts:DLG.opts?DLG.opts.length:0,i:DLG.i,n:DLG.lines.length,text:DLG.text}:null; },
  choose(i){ if(typeof chooseOpt==='function'&&DLG&&DLG.opts){ DLG.chars=1e9; chooseOpt(i||0); return true; } return false; },
  run(sec,dt){ return window.__eb.foes.step(sec,dt||1/30); },
  input(o,sec){ N4FB.force=Object.assign({},o); N4FB.forceT=sec==null?0.1:sec; return true; },
  tap(k){ N4FB.on=true; N4FB.tap[k]=true; return true; },
  // Nyxara: jump to a phase now (fresh), or start the Heart moment now
  phase(p){ const e=n4fBoss('n_nyxara'); if(!e) return false; if(p===4&&!G.flags.n_heart_done) G.flags.n_heart_done=1; e.trans=0; e.mode='p'+p; n4nPhaseGo(e,p,true); return true; },
  heart(){ const e=n4fBoss('n_nyxara'); if(!e) return false; e.hp=e.maxHp*N4N.M[3]; n4nTransition(e,3); return true; },
  hook(k,fn){ N4F.hook[k]=fn; return true; },
  devEval(src){ return eval(src); }};
window.__ebX=Object.assign(window.__ebX||{},{n4f:N4F_DBG});
if(window.__eb) window.__eb.n4f=N4F_DBG;
