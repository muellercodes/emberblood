
// ================= time of day, weather, ambience
function daylight(){ const t=G?G.tod:0.35; if(t<0.2||t>0.8) return 0; if(t<0.3) return smooth((t-0.2)/0.1); if(t>0.7) return smooth((0.8-t)/0.1); return 1; }
const isNight=()=>daylight()<0.25;
const isDay=()=>daylight()>0.85;
function sunInfo(){
  const t=G?G.tod:0.35, d=daylight();
  if(d<0.05) return {dx:Math.cos(1.3*Math.PI)*8,dy:Math.sin(1.3*Math.PI)*8,a:0.1};
  const phi=Math.PI+(t-0.25)*TAU, el=Math.max(0.05,Math.sin((t-0.25)*TAU*0.999)), len=6+24*(1-el);
  return {dx:Math.cos(phi)*len,dy:Math.sin(phi)*len,a:0.12+0.26*d};
}
function ambientTint(){
  const t=G?G.tod:0.35, d=daylight();
  let c=mixRGB([118,132,182],[255,255,255],d);
  const w=clamp(1-Math.min(Math.abs(t-0.25),Math.abs(t-0.75))/0.07,0,1);
  c=mixRGB(c,[255,184,132],w*0.55);
  const rk=G?G.rainK*(player&&player.y>WALL_Y?1:0):0;
  c=mixRGB(c,[150,160,178],rk*0.45);
  return c;
}
function updateWeather(dt){
  const w=G.weather; w.t-=dt;
  if(w.t<=0){ if(w.type==='clear'&&Math.random()<0.45){ w.type='rain'; w.t=rand(60,130); } else { w.type='clear'; w.t=rand(120,280); } }
  const target=w.type==='rain'?1:0; G.rainK+=(target-G.rainK)*Math.min(1,dt*0.25);
  const rk=G.rainK*(player.y>WALL_Y?1:0);
  if(rk>0.75&&Math.random()<dt*0.03){ flashA=Math.max(flashA,0.35); flashCol='220,230,255'; later(rand(0.6,1.6),()=>SFX.play('thunder')); }
}
function updateAmbience(dt){
  if(G.mode==='menu') return;
  if(AREA){ SFX.ambient({wind:AREA.kind==='cave'?0.05:0.005,rain:0,lava:AREA.def.theme==='ember'?0.08:0}); return; }
  const reg=G.region?G.region.key:'', cinder=player.y<2700, rk=G.rainK*(cinder?0:1);
  SFX.ambient({wind:(reg==='b3'||cinder?0.07:0.035)+rk*0.04,rain:0.12*rk,lava:cinder?0.12:0});
  G.chirpT=(G.chirpT||0)-dt;
  if(G.chirpT<=0){
    const green=reg==='b0'||reg==='b1'||reg==='village'||reg==='lake';
    if(isNight()){ G.chirpT=rand(0.4,0.9); if(green&&rk<0.3) SFX.play('cricket'); }
    else{ G.chirpT=rand(1.2,4); if(green&&rk<0.3&&isDay()) SFX.play('bird',0.8); }
  }
}
function ambientEmit(dt){
  if(!G||!player) return;
  if(AREA){ for(const r of G.ripples) r.t+=dt; if(G.ripples.length) G.ripples=G.ripples.filter(r=>r.t<r.max); if(AREA.kind==='cave'&&Math.random()<dt*3) emit(rand(cam.x,cam.x+W/zoom),rand(cam.y,cam.y+H/zoom),1,{col:AREA.def.theme==='ember'?'255,140,60':'200,200,220',glow:AREA.def.theme==='ember',ang:Math.PI/2,spread:0.3,smin:5,smax:20,lmin:2,lmax:4,zmin:0.6,zmax:1.4,drag:0.1}); return; }
  const vx=cam.x, vy=cam.y, vw=W/zoom, vh=H/zoom, py=player.y;
  if(py<2750&&Math.random()<dt*14) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:'255,140,50',ang:-Math.PI/2,spread:0.8,smin:10,smax:40,lmin:2,lmax:4,zmin:0.8,zmax:1.8,drag:0.1,rise:4});
  if(G.region&&G.region.key==='b2'&&Math.random()<dt*12) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:'190,185,180',glow:false,ang:0.6,spread:0.4,smin:20,smax:50,lmin:3,lmax:5,zmin:1,zmax:2.2,drag:0.05});
  // water glints and rain ripples
  const rk=G.rainK*(py>WALL_Y?1:0);
  for(let i=0;i<(rk>0.1?6:2);i++){
    if(Math.random()>dt*30) continue;
    const x=rand(vx,vx+vw), y=rand(vy,vy+vh), s=T(x,y,{});
    if(s.water&&!s.bridge) G.ripples.push({x,y,t:0,max:rand(0.8,1.4),r:rand(6,14),glint:rk<0.1});
    else if(rk>0.2&&!s.lava) G.ripples.push({x,y,t:0,max:0.35,r:rand(2,4),splash:true});
  }
  for(const r of G.ripples) r.t+=dt;
  if(G.ripples.length) G.ripples=G.ripples.filter(r=>r.t<r.max);
  // smoke from chimneys and vents
  for(const h of HOUSES){ if(h.chim&&inView(h.x,h.y,200)&&Math.random()<dt*(h.burnt?6:2)) emit(h.chim[0],h.chim[1],1,{alpha:0.45,col:h.burnt?'50,45,42':'160,160,160',glow:false,ang:-Math.PI/2+0.4,spread:0.3,smin:15,smax:35,lmin:2,lmax:3.5,zmin:4,zmax:7,grow:9,drag:0.3}); }
}

// ================= run state
function newRun(mode){
  G={mode,diff:DIFFS[diffIdx],gen:0,enemies:[],projectiles:[],hazards:[],pools:[],rings:[],pickups:[],particles:[],texts:[],timers:[],critters:[],birds:[],ripples:[],npcs:[],
    boss:null,corpse:null,time:0,playTime:0,worldTime:0,kills:0,score:0,combo:0,comboT:0,deaths:0,banner:null,taunt:null,hintT:0,
    timeScale:1,slowT:0,hurtVig:0,dashBuf:0,roarBuf:0,hpMul:1,dmgMul:1,eliteChance:0,maxAlive:14,queue:[],spawnT:0,phase:'idle',wave:0,
    tod:0.32,rainK:0,weather:{type:'clear',t:rand(100,220)},shrines:{},lastShrine:'s_village',campsCleared:{},campState:{},chestsOpened:{},
    stage:'wake',flags:{},wards:{hollow:true},wardReady:{},wardHeat:{},wardHeatT:{},wardMsgT:0,bossDone:{},side:{},ores:{},iron:0,tier:0,lilyN:0,lanterns:{},
    fightSite:null,fightIntro:false,siteGuards:{},pip:null,goat:null,spirit:null,questKills:0,done:false,pendingBless:0,blessDelay:0,prompt:null,region:null,regionT:0,
    inCombat:false,arena:null,autoSaveT:60,wolfT:20,critterT:3,fogT:0,herbs:{},eliteChance:mode==='story'?0.06:0,
    coins:0,items:{},quests:{},choices:{},found:{},pages:{},pagesGiven:0,stats:{},hat:null,hats:{},pipTreats:0,caveCleared:{},area:null,ow:null,fishing:null,allies:null,fade:0,lastQ:null,track:[],focus:null,friends:{},seenTalk:{},secrets:{},miniDone:{},mini:null,
    weapons:{sword:true},weapon:'sword',abil:{},skills:{},sp:0,comp:null,comps:{},deeds:{}};
  if(AREA) exitArea(true);
  player=makePlayer();
}
function later(t,fn){ G.timers.push({t,fn,gen:G.gen}); }
function updateTimers(dt){
  if(!G||!G.timers.length) return;
  const due=[]; G.timers=G.timers.filter(tm=>{ tm.t-=dt; if(tm.t<=0){ due.push(tm); return false; } return true; });
  for(const tm of due) if(tm.gen===G.gen) tm.fn();
}
// ================= messages people can read: banners, taunts and floating hints (the UX build)
// How long a message stays up: about 1.5 s plus 0.07 s a letter, at least lo (3 s) and at most hi (9 s).
function readT(text,lo,hi){ const n=String(text==null?'':text).length; return clamp(1.5+0.07*n,lo==null?3:lo,hi==null?9:hi); }
// A count like "2 of 4 braziers lit" and "3 of 4 braziers lit" is the same banner, so it updates in place.
const bannerKey=s=>String(s==null?'':s).replace(/\d+/g,'#');
// Banners wait their turn instead of replacing each other (G.bannerQ, drawn as a small "+1" by drawBanner).
// A level up goes first (the skills build adds its skill point line to it right away) and the banner it
// pushed aside comes back afterwards with all of its reading time. Returns the banner object.
function setBanner(text,sub,dur,style){
  text=simplify(String(text==null?'':text)); sub=sub?simplify(String(sub)):'';
  const b={text,sub,t:0,dur:Math.max(dur||2,readT(text+' '+sub)),style:style||'',len:text.length+sub.length,key:bannerKey(text)};
  b.log=logAdd({k:'banner',text,sub,style:b.style,key:'b:'+b.key});
  if(!G) return b;
  const cur=G.banner, Q=G.bannerQ||(G.bannerQ=[]);
  if(!cur||cur.t>=cur.dur-0.05){ if(Q.length){ Q.push(b); G.banner=Q.shift(); } else G.banner=b; return b; }
  if(cur.key===b.key){ cur.text=text; cur.sub=sub; cur.len=b.len; cur.log=b.log; cur.dur=Math.max(cur.dur,cur.t+b.dur*0.8); return cur; }
  const qi=Q.findIndex(q=>q.key===b.key); if(qi>=0){ Q[qi]=b; return b; }
  if(/^Level \d+$/.test(text)||cur.style==='region'){
    if(cur.style!=='region'||cur.t<1.5){ cur.dur=Math.max(1.5,cur.dur-cur.t)+0.25; cur.t=0; Q.unshift(cur); }
    G.banner=b;
  }else Q.push(b);
  while(Q.length>6){ const r=Q.findIndex(q=>q.style==='region'); Q.splice(r>=0?r:0,1); }
  return b;
}
// a click or the use button lets the banner go early (once it has been up long enough to see)
function bannerSkip(){ const b=G&&G.banner; if(b&&b.t>0.6&&b.dur-b.t>0.4){ b.dur=b.t+0.4; return true; } return false; }
function taunt(who,text){
  const s=SPK[who]||{name:'',col:'#d8c3a0'}; text=simplify(String(text==null?'':text));
  const t={who:s.name,col:s.col,text,t:0,dur:readT(text,3.4,8)};
  logAdd({k:'taunt',who:s.name,col:s.col,text});
  if(!G) return;
  const cur=G.taunt;
  if(cur&&cur.t<cur.dur-0.5){ const Q=G.tauntQ||(G.tauntQ=[]); Q.push(t); if(Q.length>3) Q.shift(); return; }
  G.taunt=t;
}
// Floating words over the world: a hint like "Mom has your sword at the forge" stays up long enough to read
// and goes in the log. Damage numbers and short callouts ("BLOCK", "Hop!", "STUNNED!") stay quick.
// ftext itself lives in a8_systems.js; this wraps it (every module shares one scope, so callers get the wrapper).
const ftextQuick=ftext;
ftext=function(x,y,txt,col,size){
  if(typeof txt==='string'&&txt.length>=10) txt=simplify(txt);
  ftextQuick(x,y,txt,col,size);
  const s=String(txt); if(s.length<10||!/[a-z]{2}/.test(s)||!/\s/.test(s)) return;
  const t=G.texts[G.texts.length-1]; if(!t||t.txt!==s) return;
  t.life=t.max=clamp(1.1+0.065*s.length,2,4.5); t.vy=-34; t.vx*=0.3;
  if(s.length>=14) logAdd({k:'hint',text:s,col});
};

// ================= camps, roaming wolves
function spawnGroup(units,cx,cy,opt){
  let n=0;
  for(const [type,c] of units) for(let i=0;i<c;i++){ const s=spotNear(cx,cy,30,180); makeEnemy(type,s.x,s.y,Object.assign({face:rand(0,TAU)},opt)); n++; }
  return n;
}
function updateCamps(){
  if(AREA) return;
  for(const c of CAMPS){
    const st=G.campState[c.id]||(G.campState[c.id]={id:c.id,active:false,alive:0});
    const d=dist(player.x,player.y,c.x,c.y);
    if(!st.active&&d<1500&&d>420){
      const cl=G.campsCleared[c.id]; if(cl!=null&&G.worldTime-cl<300) continue;
      const lvl=regionAt(c.x,c.y).level;
      st.alive=spawnGroup(c.units,c.x,c.y,{level:lvl,aggro:false,camp:st,homeX:c.x,homeY:c.y,elite:undefined,snowy:biomeInfo(c.x,c.y,{}).b===5});
      st.active=true;
    }else if(st.active&&d>2700){
      for(const e of G.enemies) if(e.camp===st) e.dead=true;
      st.active=false;
    }
  }
}
function updateWolves(dt){
  G.wolfT-=dt; if(G.wolfT>0||AREA) return; G.wolfT=rand(25,45);
  if(!isNight()||player.y<WALL_Y+100) return;
  const b=biomeInfo(player.x,player.y,{}).b; if(b!==1&&b!==5&&b!==0) return;
  if(inClearing(player.x,player.y,300)) return;
  if(G.enemies.filter(e=>e.type==='wolf'&&!e.dead&&e.roam).length>=3) return;
  const a=rand(0,TAU), s=spotNear(player.x+Math.cos(a)*800,player.y+Math.sin(a)*800,0,120);
  const lvl=Math.max(1,regionAt(s.x,s.y).level);
  for(let i=0;i<3;i++){ const q=spotNear(s.x,s.y,10,80); const w=makeEnemy('wolf',q.x,q.y,{level:lvl,aggro:true,homeX:q.x,homeY:q.y,leash:1500}); w.roam=true; w.snowy=b===5; }
  SFX.play('howl');
}
function cullFar(){ for(const e of G.enemies) if(e.roam&&dist(e.x,e.y,player.x,player.y)>2500) e.dead=true; }

