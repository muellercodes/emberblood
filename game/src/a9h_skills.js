// ================= skill tree: points from levels and Trials, the Skills screen, the HUD star and the journal Hero page
// G.skills {nodeId:rank} and G.sp (unspent points) are saved by saveData. Stat effects are applied once, when a rank is
// learned (player.stats is saved by snapshotPlayer), so nothing is re-applied on load. Flag nodes only set G.skills[id];
// the weapons, abilities and companions builds read them with hasSkill(id).
const SK_BR=[
  {id:'blade',name:'Blade',col:'#d6e6f6',deep:'#2a4562',blurb:'Hit harder, swing faster and look cool doing it.'},
  {id:'flame',name:'Flame',col:'#ffa24c',deep:'#7a2a0e',blurb:'Hotter breath and a roar that rattles teeth.'},
  {id:'wings',name:'Wings',col:'#92defe',deep:'#174a64',blurb:'Light feet, double jumps and longer flights.'},
  {id:'heart',name:'Heart',col:'#ff9aaa',deep:'#6c1e30',blurb:'More health, more draughts and better friends.'}
];
const SK_BRBY={}; for(const b of SK_BR) SK_BRBY[b.id]=b;
const SK_ROW_NEED=[0,2,4];
const SK_TRIAL={jump:'Unlocks with the Trial of the Leap',stride:'Unlocks with the Trial of the Tide',wings:'Unlocks with the Trial of the Sky'};
const SK_WPN_FROM={bow:'the Trial of the Tide',boomerang:'the Trial of the Leap'};
const SK_RESET_COST=30;
const skPct=(m,r)=>Math.round((Math.pow(m,r)-1)*100);
const SKILL_TREE=[
  // Blade
  {id:'keen',br:'blade',row:0,max:3,name:'Keen Edge',desc:'Sharpen everything you swing. Even the spoon.',each:'+8% weapon damage',now:r=>`+${8*r}%`,
    fx:p=>{ p.stats.wpnMul+=0.08; },un:p=>{ p.stats.wpnMul-=0.08; }},
  {id:'quick',br:'blade',row:0,max:2,name:'Quick Hands',desc:'Swing faster than a squirrel on its third breakfast.',each:'+8% attack speed',now:r=>`+${skPct(1.08,r)}%`,
    fx:p=>{ p.stats.atkSpeed*=1.08; },un:p=>{ p.stats.atkSpeed/=1.08; }},
  {id:'eye',br:'blade',row:1,max:2,name:'Dragon Eye',desc:'Spot the weak spot. Some hits land extra hard.',each:'+8% chance of a critical hit',now:r=>`${8*r}%`,
    fx:p=>{ p.stats.critCh+=0.08; },un:p=>{ p.stats.critCh=Math.max(0,p.stats.critCh-0.08); }},
  {id:'spin',br:'blade',row:1,max:1,name:'Whirlwind',desc:'The last hit of a sword, dagger or spear combo becomes a big spin that hits everything around you. Dizzy, but worth it.'},
  {id:'firearrow',br:'blade',row:2,max:1,name:'Fire Arrows',weapon:'bow',desc:'Arrows catch fire, set foes burning and light braziers. Please aim away from the haystacks.'},
  {id:'longthrow',br:'blade',row:2,max:1,name:'Long Throw',weapon:'boomerang',desc:'Your boomerang flies 50% farther and fetches coins and pickups on the way back. Good boomerang.'},
  // Flame
  {id:'hot',br:'flame',row:0,max:3,name:'Hotter Fire',desc:'Spicier breath. Marshmallows, beware.',each:'+12% fire damage',now:r=>`+${skPct(1.12,r)}%`,
    fx:p=>{ p.stats.fire*=1.12; },un:p=>{ p.stats.fire/=1.12; }},
  {id:'lungs',br:'flame',row:0,max:2,name:'Deep Lungs',desc:'Breathe fire for longer before you run out of puff.',each:'Fire breath costs 12% less',now:r=>`${-skPct(0.88,r)}% less`,
    fx:p=>{ p.stats.fireCost*=0.88; },un:p=>{ p.stats.fireCost/=0.88; }},
  {id:'thunder',br:'flame',row:1,max:2,name:'Thunder Roar',desc:'A roar so loud the fish complain.',each:'+25% roar damage, and the roar fills 10% faster',now:r=>`+${skPct(1.25,r)}% roar damage`,
    fx:p=>{ p.stats.roarDmg*=1.25; p.stats.roarRate*=1.1; },un:p=>{ p.stats.roarDmg/=1.25; p.stats.roarRate/=1.1; }},
  {id:'trail',br:'flame',row:2,max:1,name:'Ember Trail',desc:'Rolling leaves a trail of fire behind you. Very cool. Well, very hot.',
    fx:p=>{ p.stats.emberDash=true; if(!p.ups.emberdash){ p.ups.emberdash=1; G.flags.sk_trailUps=1; } },
    un:p=>{ if(G.flags.sk_trailUps){ delete p.ups.emberdash; delete G.flags.sk_trailUps; p.stats.emberDash=false; } }},
  // Wings
  {id:'light',br:'wings',row:0,max:2,name:'Light Feet',desc:'Tiptoe like a dragon who skipped dinner.',each:'Rolls cost 15% less stamina, and +4% speed',now:r=>`+${skPct(1.04,r)}% speed`,
    fx:p=>{ p.stats.rollCost*=0.85; p.stats.speed*=1.04; },un:p=>{ p.stats.rollCost/=0.85; p.stats.speed/=1.04; }},
  {id:'dbljump',br:'wings',row:0,max:1,name:'Double Jump',abil:'jump',desc:'Jump again in midair. Gravity is more of a suggestion.'},
  {id:'slam',br:'wings',row:1,max:1,name:'Meteor Slam',abil:'jump',desc:'Attack in midair to crash down and bonk everything nearby.'},
  {id:'skimmer',br:'wings',row:1,max:1,name:'Skimmer',abil:'stride',desc:'Sprint across water for free, and faster. Skip like a stone!'},
  {id:'strongwings',br:'wings',row:2,max:2,name:'Strong Wings',abil:'wings',desc:'Fly longer before your wings get wobbly.',each:'+40% flight time',now:r=>`+${40*r}%`,
    fx:p=>{ p.stats.flyMax+=0.4; },un:p=>{ p.stats.flyMax-=0.4; }},
  // Heart
  {id:'tough',br:'heart',row:0,max:3,name:'Tough Scales',desc:'Thicker scales. Hugs hurt a little less too.',each:'+12 max health',now:r=>`+${12*r}`,
    fx:p=>{ p.maxHp+=12; p.hp+=12; },un:p=>{ p.maxHp-=12; p.hp=Math.min(p.hp,p.maxHp); p.hpShow=Math.min(p.hpShow,p.maxHp); }},
  {id:'flask',br:'heart',row:0,max:1,name:'Bigger Flasks',desc:'Carry one more healing draught. Mom packed extra.',each:'+1 healing draught',
    fx:p=>{ p.potionsMax+=1; p.potions+=1; },un:p=>{ p.potionsMax-=1; p.potions=Math.min(p.potions,p.potionsMax); }},
  {id:'ember',br:'heart',row:1,max:1,name:'Ember Heart',desc:'Every foe you beat warms you up a little.',each:'Heal 2 health for each foe you beat',
    fx:p=>{ p.stats.killHeal+=2; },un:p=>{ p.stats.killHeal=Math.max(0,p.stats.killHeal-2); }},
  {id:'hide',br:'heart',row:1,max:2,name:'Iron Hide',desc:'Take less damage. Like wearing a frying pan, but stylish.',each:'Take 8% less damage',now:r=>`${-skPct(0.92,r)}% less`,
    fx:p=>{ p.stats.armor*=0.92; },un:p=>{ p.stats.armor/=0.92; }},
  {id:'pipbond',br:'heart',row:2,max:1,name:'Pip’s Best Friend',pip:true,desc:'Pip attacks faster and sometimes heals you. Mip!'},
  {id:'rally',br:'heart',row:2,max:1,name:'Rally',desc:'Knocked-down friends get back up twice as fast, and cheer you on for a small heal.'}
];
const SKN={}; for(const n of SKILL_TREE) SKN[n.id]=n;
const SK_STAT0={wpnMul:1,critCh:0,flyMax:1,jumpK:1,atkSpeed:1,fire:1,fireCost:32,roarDmg:45,roarRate:1,rollCost:24,speed:200,killHeal:0,armor:1};
const SK={tab:null,from:'play',hintEnd:0,lv:null,fx:[],pl:null,arm:0,toastT:0,just:null,built:false,ic:{}};

// ---------- rules
function skStats(){ if(!player) return; const s=player.stats; for(const k in SK_STAT0) if(typeof s[k]!=='number'||!isFinite(s[k])) s[k]=SK_STAT0[k]; if(!player.ups) player.ups={}; }
const skRank=id=>hasSkill(id);
function skSpent(br){ let n=0; for(const q of SKILL_TREE) if(!br||q.br===br) n+=skRank(q.id); return n; }
function wpnName(id){ return (typeof WEAPONS!=='undefined'&&WEAPONS[id]&&WEAPONS[id].name)||id; }
function skNeedTxt(n){
  if(n.abil&&!hasAbil(n.abil)) return SK_TRIAL[n.abil];
  if(n.weapon&&!(G.weapons&&G.weapons[n.weapon])) return `Needs the ${wpnName(n.weapon)} from ${SK_WPN_FROM[n.weapon]}`;
  if(n.pip&&!(G.flags&&G.flags.pip)) return 'Unlocks once Pip joins you';
  if(n.id==='trail'&&player&&player.stats.emberDash&&!skRank('trail')) return 'You already roll in flames, thanks to a blessing';
  return '';
}
// why a node cannot take another rank right now (null when it can)
function skWhy(n){
  const r=skRank(n.id), br=SK_BRBY[n.br];
  if(r>=n.max) return {k:'max',t:`${n.name} is mastered. It is as good as it gets!`};
  const need=SK_ROW_NEED[n.row], have=skSpent(n.br);
  if(have<need){ const d=need-have; return {k:'row',t:`Spend ${d} more point${d>1?'s':''} in ${br.name} to open row ${n.row+1}`}; }
  const q=skNeedTxt(n); if(q) return {k:'need',t:q};
  if((G.sp|0)<1) return {k:'sp',t:'No skill points left. Level up or beat a Trial to earn more.'};
  return null;
}
function skCanAny(br){ for(const n of SKILL_TREE) if((!br||n.br===br)&&!skWhy(n)) return true; return false; }
function skAllMastered(){ for(const n of SKILL_TREE) if(skRank(n.id)<n.max) return false; return true; }
// learn one rank: returns '' on success, or the reason it could not
function learnSkill(id,quiet){
  const n=SKN[id]; if(!n||!G||G.mode!=='story') return 'No such skill';
  const why=skWhy(n); if(why) return why.t;
  skStats(); G.skills=G.skills||{}; G.skills[id]=(G.skills[id]|0)+1; G.sp=(G.sp|0)-1;
  if(n.fx) n.fx(player);
  if(!quiet){ SFX.play('upgrade'); const p=player; emit(p.x,p.y,22,{col:'255,226,140',smin:40,smax:170,lmin:.4,lmax:.9,zmin:1.4,zmax:2.8,rise:20}); }
  saveGame();
  return '';
}
// Elder Yara's fresh start: undo every stat effect and give the points back
function resetSkills(){
  if(!G||!player) return 0;
  const spent=skSpent(); skStats();
  for(const n of SKILL_TREE){ const r=skRank(n.id); for(let i=0;i<r;i++) if(n.un) n.un(player); }
  const s=player.stats; for(const k of ['atkSpeed','fire','fireCost','roarDmg','roarRate','rollCost','speed','armor','wpnMul','critCh','flyMax']) if(typeof s[k]==='number') s[k]=Math.round(s[k]*1e6)/1e6;
  G.skills={}; G.sp=(G.sp|0)+spent; saveGame();
  return spent;
}
function skYaraNear(){ const L=(AREA?AREA.npcs:G.npcs)||[]; return !!player&&L.some(n=>(n.id||n.kind)==='yara'&&dist(n.x,n.y,player.x,player.y)<300); }

// ---------- points: from leveling up (gainXp) and from Trial bosses
function onLevelUp(level){
  if(!G) return; G.sp=(G.sp|0)+1;
  if(G.mode!=='story'||!player) return;
  const lv=SK.lv;
  if(lv&&lv.pend&&G.time-lv.t<0.05){ lv.n++; lv.level=level; if(lv.txt){ lv.txt.txt=`+${lv.n} Skill points`; lv.txt.life=lv.txt.max; } return; }
  SK.lv={level,n:1,t:G.time,pend:true}; SK.lv.txt=skCelebrate(1,0);
}
function giveSkillPoint(n){
  n=(n|0)||1; if(!G) return; G.sp=(G.sp|0)+n;
  if(G.mode==='story'&&player) skCelebrate(n,0);
}
function skCelebrate(n,k){
  const p=player;
  for(let i=0;i<16;i++){ const a=i/16*TAU; emit(p.x+Math.cos(a)*8,p.y+Math.sin(a)*8,1,{ang:a,spread:0.08,smin:110,smax:165,lmin:.45,lmax:.75,col:'255,236,150',zmin:1.8,zmax:3,drag:3.2}); }
  emit(p.x,p.y-6,14,{col:'200,235,255',ang:-Math.PI/2,spread:1.1,smin:30,smax:110,lmin:.8,lmax:1.4,zmin:1.2,zmax:2.4,rise:35,drag:1.6});
  if(G.texts.length>60) G.texts.shift();
  const ft={x:p.x,y:p.y-50-k*18,txt:`+${n} Skill point${n>1?'s':''}`,col:'#ffe27a',size:16,life:1.9,max:1.9,vy:-36,vx:0}; G.texts.push(ft);
  SK.fx.push({t0:G.time+k*0.12});
  return ft;
}
function skPad(){ try{ return !!padActive(); }catch(e){ return false; } }
function skCtrl(){ return skPad()?'pad':usingTouch?'touch':'key'; }
function skCtrlHint(){ return {key:'Press U to open your Skills.',touch:'Tap the gold star to open your Skills.',pad:'Open your Skills from the pause menu.'}[skCtrl()]; }

// ---------- HUD: star chip by the LEVEL text, the first-time hint and a star burst over Ash
function skStarPath(g,x,y,R,r,rot){ g.beginPath(); for(let i=0;i<10;i++){ const a=(rot||0)-Math.PI/2+i*Math.PI/5, d=i%2?r:R; if(i) g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d); else g.moveTo(x+Math.cos(a)*d,y+Math.sin(a)*d); } g.closePath(); }
function drawSkillHud(){
  if(!G||G.mode!=='story'||!player) return;
  if(SK.pl!==player){ SK.pl=player; skStats(); }
  // the level-up banner (set right after onLevelUp) learns about the new point
  const lv=SK.lv;
  if(lv&&lv.pend){ lv.pend=false; const bn=G.banner;
    if(bn&&bn.text===`Level ${lv.level}`){ const n=lv.n; bn.sub=`Health and strength up. +${n} skill point${n>1?'s':''}${G.pendingBless>0?', and a blessing awaits':''}! ${skCtrlHint()}`; bn.dur=Math.max(bn.dur,3.4); } }
  const sp=G.sp|0, t=G.time;
  if(sp>0&&!G.flags.sk_hint&&scene==='play'){ G.flags.sk_hint=1; SK.hintEnd=t+10; }
  // star burst over Ash
  if(SK.fx.length){
    const sx=(player.x-cam.x)*zoom, sy=(player.y-cam.y-(player.z||0))*zoom;
    for(const f of SK.fx){
      const a=t-f.t0; if(a<0||a>1.5) continue;
      const s=Math.min(1,a/0.22), al=a<1.1?1:1-(a-1.1)/0.4, y=sy-(76+a*22)*zoom, R=15*s*(1+0.12*Math.sin(a*14));
      ctx.save(); ctx.globalAlpha=al; ctx.globalCompositeOperation='lighter';
      const gr=ctx.createRadialGradient(sx,y,0,sx,y,R*3); gr.addColorStop(0,'rgba(255,230,140,.55)'); gr.addColorStop(1,'rgba(255,170,60,0)'); ctx.fillStyle=gr; ctx.fillRect(sx-R*3,y-R*3,R*6,R*6);
      ctx.strokeStyle='rgba(255,240,190,.8)'; ctx.lineWidth=1.6; ctx.beginPath();
      for(let i=0;i<8;i++){ const q=i/8*TAU+a*1.6, r0=R*1.25, r1=R*(1.6+0.5*s)+(i%2?0:6*s); ctx.moveTo(sx+Math.cos(q)*r0,y+Math.sin(q)*r0); ctx.lineTo(sx+Math.cos(q)*r1,y+Math.sin(q)*r1); }
      ctx.stroke(); ctx.globalCompositeOperation='source-over';
      skStarPath(ctx,sx,y,R,R*0.45,a*0.8); ctx.fillStyle='#ffd24a'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='#7a4a0a'; ctx.stroke();
      skStarPath(ctx,sx-R*0.12,y-R*0.15,R*0.45,R*0.2,a*0.8); ctx.fillStyle='rgba(255,250,220,.85)'; ctx.fill();
      ctx.restore();
    }
    SK.fx=SK.fx.filter(f=>t-f.t0<1.5);
  }
  SK.chip=null; if(sp<=0||skAllMastered()) return;
  const L=SAFE.l+14, T=SAFE.t+14, pw=Math.min(250,MINI_R().x-L-10);
  const key=skCtrl()==='key';
  ctx.font=`800 10px ${UIF}`; const nw=ctx.measureText(String(sp)).width;
  const cw=Math.round(22+nw+(key?14:0)), ch=16, cx=L+pw-8-cw, cy=T+4, pulse=0.5+0.5*Math.sin(t*4);
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const gr=ctx.createRadialGradient(cx+cw/2,cy+ch/2,2,cx+cw/2,cy+ch/2,28); gr.addColorStop(0,`rgba(255,200,80,${0.22+pulse*0.2})`); gr.addColorStop(1,'rgba(255,160,50,0)');
  ctx.fillStyle=gr; ctx.fillRect(cx-16,cy-18,cw+32,ch+36);
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='rgba(58,30,8,.94)'; rr(cx,cy,cw,ch,8); ctx.fill(); ctx.strokeStyle=`rgba(255,214,120,${0.6+pulse*0.4})`; ctx.lineWidth=1.2; ctx.stroke();
  skStarPath(ctx,cx+9,cy+8,6.2,2.7,Math.sin(t*2)*0.15); ctx.fillStyle='#ffd650'; ctx.fill(); ctx.lineWidth=1; ctx.strokeStyle='#8a5a10'; ctx.stroke();
  ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='#fff1c4'; ctx.fillText(String(sp),cx+17,cy+8.5);
  if(key){ const kx=cx+19+nw; ctx.fillStyle='rgba(255,230,180,.16)'; rr(kx,cy+3,10,10,2.5); ctx.fill(); ctx.font=`800 7.5px ${UIF}`; ctx.fillStyle='#f4dfb8'; ctx.textAlign='center'; ctx.fillText('U',kx+5,cy+8.5); }
  // the first time: say where to spend it
  const left=SK.hintEnd-t;
  if(left>0){
    const a=clamp(Math.min((10-left)/0.3,left/0.6),0,1), ring=(t*1.4)%1;
    ctx.globalAlpha=a*(1-ring); ctx.strokeStyle='#ffe08a'; ctx.lineWidth=2; rr(cx-3-ring*8,cy-3-ring*8,cw+6+ring*16,ch+6+ring*16,10+ring*8); ctx.stroke(); ctx.globalAlpha=a;
    const title=sp>1?`You have ${sp} skill points!`:'You earned a skill point!', body=skCtrlHint();
    ctx.font=`800 12px ${UIF}`; const w1=ctx.measureText(title).width; ctx.font=`500 12px ${UIF}`; const w2=ctx.measureText(body).width;
    const bw=Math.min(Math.max(w1,w2)+26,W-L-SAFE.r-12), bh=46, room=MINI_R().x-(L+pw)-18;
    let bx,by,side;
    if(room>=bw+10){ bx=L+pw+12; by=Math.max(SAFE.t+4,cy+ch/2-bh/2); side='l'; } else { bx=clamp(cx+cw/2-bw+40,L,W-SAFE.r-bw-8); by=T+90; side='u'; }
    ctx.fillStyle='rgba(22,11,7,.95)'; ctx.strokeStyle='rgba(255,210,120,.9)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    if(side==='l'){ const ay=cy+ch/2; ctx.moveTo(L+pw-2,ay); ctx.lineTo(bx+1,ay-7); ctx.lineTo(bx+1,ay+7); }
    else { const ax=cx+cw/2; ctx.moveTo(ax,by-9); ctx.lineTo(ax-8,by+1); ctx.lineTo(ax+8,by+1); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    rr(bx,by,bw,bh,10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); if(side==='l'){ const ay=cy+ch/2; ctx.moveTo(bx+2,ay-6); ctx.lineTo(bx+2,ay+6); } else { const ax=cx+cw/2; ctx.moveTo(ax-7,by+2); ctx.lineTo(ax+7,by+2); }
    ctx.strokeStyle='rgba(22,11,7,1)'; ctx.lineWidth=3; ctx.stroke();
    ctx.textAlign='left'; ctx.font=`800 12px ${UIF}`; ctx.fillStyle='#ffd27a'; ctx.fillText(title,bx+13,by+15);
    ctx.font=`500 12px ${UIF}`; ctx.fillStyle='#f2e6d4'; ctx.fillText(body,bx+13,by+32);
    HUD_HITS.push({x:bx,y:by,w:bw,h:bh,fn:()=>openSkills()});
  }
  ctx.restore();
  SK.chip={x:cx-10,y:cy-10,w:cw+20,h:ch+20}; HUD_HITS.push(Object.assign({fn:()=>openSkills()},SK.chip));
}

// ---------- icons: hand-drawn medallions, cached as images
const skP=d=>new Path2D(d);
function skInk(g,p,fill,w){ g.lineJoin='round'; g.lineCap='round'; g.lineWidth=w||6; g.strokeStyle='rgba(26,10,4,.92)'; g.stroke(p); g.fillStyle=fill; g.fill(p); }
function skLine(g,p,col,w){ g.lineJoin='round'; g.lineCap='round'; g.lineWidth=w+5; g.strokeStyle='rgba(26,10,4,.92)'; g.stroke(p); g.lineWidth=w; g.strokeStyle=col; g.stroke(p); }
function skCirc(x,y,r){ const p=new Path2D(); p.arc(x,y,r,0,TAU); return p; }
function skEll(x,y,rx,ry){ const p=new Path2D(); p.ellipse(x,y,rx,ry,0,0,TAU); return p; }
function skMix(a,b,t){ const A=hexRGB(a), B=hexRGB(b); return `rgb(${Math.round(A[0]+(B[0]-A[0])*t)},${Math.round(A[1]+(B[1]-A[1])*t)},${Math.round(A[2]+(B[2]-A[2])*t)})`; }
function skSword(g,rot,s,tx,ty){
  g.save(); g.translate(tx||0,ty||0); g.rotate(rot); g.scale(s,s);
  skInk(g,skP('M-5 12 L-5 -25 L0 -34 L5 -25 L5 12 Z'),'#eef3f8');
  g.strokeStyle='rgba(110,130,160,.85)'; g.lineWidth=1.8; g.beginPath(); g.moveTo(0,-27); g.lineTo(0,10); g.stroke();
  skInk(g,skP('M-15 11 L15 11 Q17 14 15 17 L-15 17 Q-17 14 -15 11 Z'),'#e2b04c');
  skInk(g,skP('M-3.2 17 L3.2 17 L3.2 29 L-3.2 29 Z'),'#8a4422');
  skInk(g,skCirc(0,32,5),'#e2b04c');
  g.restore();
}
function skSpark(g,x,y,r,col){ const p=skP(`M${x} ${y-r} Q${x} ${y} ${x+r} ${y} Q${x} ${y} ${x} ${y+r} Q${x} ${y} ${x-r} ${y} Q${x} ${y} ${x} ${y-r} Z`); g.save(); g.shadowColor='rgba(255,255,220,.95)'; g.shadowBlur=r*0.9; g.fillStyle=col; g.fill(p); g.restore(); }
function skFlameP(cx,by,w,h){ return skP(`M${cx} ${by-h} Q${cx+w*1.15} ${by-h*0.45} ${cx+w} ${by-w} A${w} ${w} 0 0 1 ${cx-w} ${by-w} Q${cx-w*1.15} ${by-h*0.45} ${cx} ${by-h} Z`); }
function skFlame(g,cx,by,w,h){ skInk(g,skFlameP(cx,by,w,h),'#ff6a1e',5); g.fillStyle='#ffb43a'; g.fill(skFlameP(cx,by-w*0.12,w*0.66,h*0.66)); g.fillStyle='#fff0b0'; g.fill(skFlameP(cx,by-w*0.2,w*0.36,h*0.38)); }
const SK_HEART='M0 34 C-26 16 -40 0 -32 -18 C-26 -32 -6 -32 0 -16 C6 -32 26 -32 32 -18 C40 0 26 16 0 34 Z';
const SK_WING='M-32 -2 L28 -34 L26 -4 Q18 -6 14 6 Q6 2 0 14 Q-8 8 -14 18 Q-22 8 -32 -2 Z';
function skWing(g,fill){
  skInk(g,skP(SK_WING),fill);
  g.strokeStyle='rgba(26,10,4,.8)'; g.lineWidth=2.4; g.lineCap='round'; g.beginPath();
  for(const [x,y] of [[26,-4],[14,6],[0,14],[-14,18]]){ g.moveTo(6,-21); g.lineTo(x,y); } g.stroke();
  skLine(g,skP('M-32 -2 L28 -34'),'#f6e2c8',3.5);
  skInk(g,skP('M28 -34 L35 -39 L31 -31 Z'),'#fff3dc',3);
}
function skStarP(x,y,R,r){ const p=new Path2D(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, d=i%2?r:R; if(i) p.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d); else p.moveTo(x+Math.cos(a)*d,y+Math.sin(a)*d); } p.closePath(); return p; }
function skArrowArc(g,r,a1,a2,col){
  const p=new Path2D(); p.arc(0,0,r,a1,a2); skLine(g,p,col,6);
  const tx=Math.cos(a2)*r, ty=Math.sin(a2)*r, d=a2+Math.PI/2;
  skInk(g,skP(`M${tx+Math.cos(d)*11} ${ty+Math.sin(d)*11} L${tx+Math.cos(d+Math.PI/2)*8} ${ty+Math.sin(d+Math.PI/2)*8} L${tx+Math.cos(d-Math.PI/2)*8} ${ty+Math.sin(d-Math.PI/2)*8} Z`),col,4);
}
// draws one symbol in a 100 x 100 box centred on the origin
function skSym(g,id,pal){
  const C='#fff3dc', ac=pal.col||'#ffd27a';
  switch(id){
    case 'keen': skSword(g,-Math.PI/4,1.05); skSpark(g,17,-19,12,'#ffffff'); skSpark(g,-20,13,6,'#fff6d0'); break;
    case 'quick':
      for(const [r,al] of [[30,.95],[39,.65],[48,.35]]){ const p=new Path2D(); p.arc(14,14,r,Math.PI*0.98,Math.PI*1.47); g.globalAlpha=al; skLine(g,p,ac,4); }
      g.globalAlpha=1; skSword(g,-Math.PI/4,0.84,8,-6); break;
    case 'spin': skArrowArc(g,31,0.3,2.45,ac); skArrowArc(g,31,0.3+Math.PI,2.45+Math.PI,ac); skSword(g,0.35,0.6); break;
    case 'eye': {
      const al=skP('M-38 2 Q0 -34 38 2 Q0 36 -38 2 Z');
      skLine(g,skP('M-34 -12 Q0 -42 34 -12'),ac,4);
      skInk(g,al,'#fff3dc');
      g.save(); g.clip(al);
      const ir=g.createRadialGradient(-3,-3,2,0,2,18); ir.addColorStop(0,'#fff0a0'); ir.addColorStop(0.55,'#f39a22'); ir.addColorStop(1,'#8a3a08');
      g.fillStyle=ir; g.fill(skCirc(0,2,17)); g.fillStyle='#1a0804'; g.fill(skEll(0,2,4.2,14)); g.fillStyle='#fff'; g.fill(skCirc(-6,-5,3.6)); g.fill(skCirc(5,8,1.6));
      g.restore(); skSpark(g,28,-24,9,'#ffffff'); break; }
    case 'firearrow':
      g.save(); g.rotate(Math.PI/4);
      skFlame(g,0,-12,10,32);
      skLine(g,skP('M0 34 L0 -16'),'#c89058',4);
      skInk(g,skP('M0 20 L-10 32 L-10 24 L0 12 Z'),'#f2ece0',3); skInk(g,skP('M0 20 L10 32 L10 24 L0 12 Z'),'#f2ece0',3);
      skInk(g,skP('M0 -32 L8 -16 L0 -19 L-8 -16 Z'),'#dfe4ea',3);
      g.restore(); break;
    case 'longthrow': {
      g.save(); g.setLineDash([4,6]); g.lineWidth=3; g.strokeStyle=ac; g.globalAlpha=0.85; const p=new Path2D(); p.arc(0,6,32,-3.0,0.35); g.stroke(p); g.restore();
      skLine(g,skP('M-27 12 Q-8 -30 22 -8'),'#d9a066',10);
      g.strokeStyle='rgba(255,255,255,.4)'; g.lineWidth=2; g.stroke(skP('M-22 4 Q-8 -22 14 -10'));
      skInk(g,skCirc(21,22,9),'#ffd84a',4); g.strokeStyle='#b8901a'; g.lineWidth=1.6; g.stroke(skCirc(21,22,5.5)); break; }
    case 'hot': skFlame(g,-23,30,8,24); skFlame(g,23,28,7,21); skFlame(g,0,36,22,70); break;
    case 'lungs':
      skLine(g,skP('M-40 -14 Q-31 -22 -22 -14 T-4 -14'),C,4.5); skLine(g,skP('M-42 2 Q-33 -6 -24 2 T-6 2'),C,4.5); skLine(g,skP('M-40 18 Q-31 10 -22 18 T-4 18'),C,4.5);
      g.save(); g.translate(14,2); g.rotate(Math.PI/2); skFlame(g,0,10,13,40); g.restore(); break;
    case 'thunder':
      for(const s of [-1,1]) for(const r of [27,37]){ const p=new Path2D(); const m=s>0?0:Math.PI; p.arc(0,0,r,m-0.55,m+0.55); skLine(g,p,ac,4); }
      skInk(g,skP('M8 -36 L-14 4 L-1 4 L-9 36 L16 -6 L3 -6 L12 -36 Z'),'#ffe05a'); break;
    case 'trail':
      g.fillStyle='rgba(0,0,0,.3)'; g.fill(skEll(-6,33,32,5));
      skFlame(g,-30,32,6,18); skFlame(g,-16,32,8,25); skFlame(g,-1,32,9,30);
      { const p=new Path2D(); p.arc(20,-8,15,-2.6,1.9); skLine(g,p,C,6); skInk(g,skP('M13.2 -25.7 L5 -18.9 L15.9 -16.2 Z'),C,4); } break;
    case 'light':
      skInk(g,skP('M26 -36 C8 -34 -12 -16 -22 20 C-4 18 16 0 26 -36 Z'),'#e6f6ff');
      g.strokeStyle='rgba(70,120,150,.55)'; g.lineWidth=1.6; g.beginPath(); for(const [x,y,dx,dy] of [[14,-20,8,-2],[6,-10,8,0],[-2,0,7,2],[8,-26,-6,-4],[0,-16,-7,-3],[-8,-4,-7,-2]]){ g.moveTo(x,y); g.lineTo(x+dx,y+dy); } g.stroke();
      skLine(g,skP('M30 -40 Q4 -8 -28 34'),'#d8c098',2.5);
      g.globalAlpha=0.7; skLine(g,skP('M-36 30 Q-28 26 -20 30'),ac,3); skLine(g,skP('M-40 18 Q-34 15 -28 18'),ac,3); g.globalAlpha=1; break;
    case 'dbljump': g.fillStyle='rgba(0,0,0,.35)'; g.fill(skEll(0,35,22,6)); skLine(g,skP('M-19 16 L0 -2 L19 16'),C,8); skLine(g,skP('M-19 -10 L0 -28 L19 -10'),ac,8); break;
    case 'a_jump': g.fillStyle='rgba(0,0,0,.35)'; g.fill(skEll(0,34,24,6)); skLine(g,skP('M-21 8 L0 -16 L21 8'),C,9); g.fillStyle='rgba(255,240,210,.5)'; g.fill(skCirc(-24,30,4)); g.fill(skCirc(26,29,3)); break;
    case 'slam': {
      const ring=new Path2D(); ring.ellipse(0,30,33,8,0,0,TAU); skLine(g,ring,ac,4);
      g.strokeStyle=ac; g.lineWidth=3; g.lineCap='round'; g.beginPath(); for(const [x,y,dx,dy] of [[-38,22,-6,-6],[38,22,6,-6],[-24,16,-3,-7],[24,16,3,-7]]){ g.moveTo(x,y); g.lineTo(x+dx,y+dy); } g.stroke();
      skFlame(g,0,6,14,48); skInk(g,skCirc(0,0,14),'#6e5444',5);
      g.strokeStyle='#ffb040'; g.lineWidth=2; g.beginPath(); g.moveTo(-7,-4); g.lineTo(-1,1); g.lineTo(-4,8); g.moveTo(4,-8); g.lineTo(7,0); g.stroke(); break; }
    case 'skimmer':
      skLine(g,skP('M-40 22 Q-30 14 -20 22 T0 22 T20 22 T40 22'),'#bfe8ff',4.5); skLine(g,skP('M-30 36 Q-20 28 -10 36 T10 36 T30 36'),'#8fc8f0',3.5);
      g.save(); g.setLineDash([3,5]); g.lineWidth=2.6; g.strokeStyle=C; g.stroke(skP('M-36 12 Q-26 -12 -14 10 Q-2 -22 10 -8')); g.restore();
      g.fillStyle='rgba(220,245,255,.9)'; for(const [x,y,r] of [[-36,13,2.6],[-14,11,3],[-18,8,1.8]]) g.fill(skCirc(x,y,r));
      skInk(g,skEll(16,-11,12,7),'#b4aea4',4); g.fillStyle='rgba(255,255,255,.35)'; g.fill(skEll(13,-13,6,2.5)); break;
    case 'a_stride':
      skLine(g,skP('M-40 14 Q-30 6 -20 14 T0 14 T20 14 T40 14'),'#bfe8ff',4.5); skLine(g,skP('M-34 30 Q-24 22 -14 30 T6 30 T26 30'),'#8fc8f0',3.5);
      skInk(g,skEll(-10,-12,6,10),C,4); skInk(g,skEll(10,-24,6,10),C,4); break;
    case 'strongwings': skWing(g,skMix(pal.col,'#ffffff',0.35)); skSpark(g,-22,-26,9,'#ffffff'); break;
    case 'a_wings': skWing(g,'#ffe2b0'); break;
    case 'tough':
      for(const row of [[[-13,-31],[13,-31]],[[-26,-13],[0,-13],[26,-13]],[[-13,5],[13,5]]]) for(const [x,y] of row){
        const r=13, p=skP(`M${x-r} ${y} Q${x-r} ${y+r*1.25} ${x} ${y+r*1.65} Q${x+r} ${y+r*1.25} ${x+r} ${y} Q${x} ${y-r*0.5} ${x-r} ${y} Z`);
        skInk(g,p,'#e8705a',4); g.strokeStyle='rgba(255,230,200,.55)'; g.lineWidth=2.2; g.beginPath(); g.moveTo(x-r*0.55,y+r*0.25); g.quadraticCurveTo(x-r*0.5,y+r*0.9,x-r*0.05,y+r*1.2); g.stroke(); }
      break;
    case 'flask': {
      const body=new Path2D(); body.moveTo(-7,-22); body.lineTo(-7,-12.4); body.arc(0,9,22,Math.atan2(-21.4,-7),Math.atan2(-21.4,7),true); body.lineTo(7,-22); body.closePath();
      skInk(g,body,'rgba(220,240,235,.9)');
      g.save(); g.clip(body); g.fillStyle='#3fc678'; g.fill(skP('M-30 4 Q-15 -2 0 4 T30 4 L30 40 L-30 40 Z')); g.fillStyle='rgba(255,255,255,.45)'; g.fill(skEll(-9,14,4,8)); g.restore();
      skInk(g,skP('M-11 -26 L11 -26 L11 -21 L-11 -21 Z'),'#eef4f2',4); skInk(g,skP('M-6 -36 L6 -36 L6 -26 L-6 -26 Z'),'#a8743a',4);
      skInk(g,skCirc(23,-19,10),ac,4); g.strokeStyle='#fff3dc'; g.lineWidth=3.2; g.lineCap='round'; g.beginPath(); g.moveTo(23,-24.5); g.lineTo(23,-13.5); g.moveTo(17.5,-19); g.lineTo(28.5,-19); g.stroke(); break; }
    case 'ember': skInk(g,skP(SK_HEART),'#e8445a'); g.fillStyle='rgba(255,255,255,.25)'; g.fill(skEll(-16,-14,7,4)); skFlame(g,0,24,10,32); break;
    case 'hide': {
      const sh=skP('M0 -34 L28 -24 L26 6 Q20 26 0 36 Q-20 26 -26 6 L-28 -24 Z'), gr=g.createLinearGradient(-28,-34,28,36);
      gr.addColorStop(0,'#eef2f6'); gr.addColorStop(0.5,'#a8b2bc'); gr.addColorStop(1,'#68727e'); skInk(g,sh,gr);
      g.save(); g.scale(0.72,0.72); g.translate(0,2); g.strokeStyle='rgba(60,70,84,.85)'; g.lineWidth=3.4; g.stroke(sh); g.restore();
      for(const [x,y] of [[-20,-20],[20,-20],[-18,8],[18,8],[0,27]]){ g.fillStyle='#4e5864'; g.fill(skCirc(x,y,2.8)); g.fillStyle='rgba(255,255,255,.6)'; g.fill(skCirc(x-0.8,y-0.8,1)); }
      g.fillStyle='rgba(255,255,255,.35)'; g.fill(skP('M-18 -24 L-6 -28 L-14 10 L-20 4 Z')); break; }
    case 'pipbond': {
      skInk(g,skP('M-15 -17 L-23 -36 L-5 -23 Z'),'#fff0d0',4); skInk(g,skP('M15 -17 L23 -36 L5 -23 Z'),'#fff0d0',4);
      skInk(g,skP('M-23 -2 L-38 -9 L-30 8 Z'),'#f0864a',4); skInk(g,skP('M23 -2 L38 -9 L30 8 Z'),'#f0864a',4);
      const hg=g.createRadialGradient(-8,-10,3,0,0,27); hg.addColorStop(0,'#ffd8a8'); hg.addColorStop(0.6,'#f69456'); hg.addColorStop(1,'#b04c1e');
      skInk(g,skCirc(0,0,25),hg);
      skInk(g,skEll(0,13,12,8.5),'#ffc890',3); g.fillStyle='#8a3010'; g.fill(skEll(-4,11,1.6,1.2)); g.fill(skEll(4,11,1.6,1.2));
      for(const s of [-1,1]){ g.fillStyle='#2a1208'; g.fill(skEll(s*10,-5,6.5,7.5)); g.fillStyle='#fff'; g.fill(skCirc(s*10-2.2,-8,2.5)); g.fill(skCirc(s*10+2,-2,1.1)); g.fillStyle='rgba(255,110,110,.55)'; g.fill(skEll(s*18,6,4,2.4)); }
      g.save(); g.translate(25,-25); g.scale(0.34,0.34); skInk(g,skP(SK_HEART),ac,9); g.restore(); break; }
    case 'rally':
      skLine(g,skP('M-20 38 L-20 -32'),'#c89058',5);
      skInk(g,skP('M-18 -32 Q2 -40 30 -30 Q20 -19 30 -6 Q4 -14 -18 -8 Z'),ac);
      g.fillStyle='#fff3dc'; g.fill(skStarP(6,-19,8,3.4)); skInk(g,skCirc(-20,-35,4.5),'#e2b04c',3);
      g.globalAlpha=0.8; for(const [x,y] of [[2,6],[14,0],[22,10]]) skSpark(g,x+4,y+10,5,'#ffffff'); g.globalAlpha=1; break;
    case 'star': {
      g.save(); g.shadowColor='rgba(255,190,60,.9)'; g.shadowBlur=14; const sg=g.createLinearGradient(0,-40,0,36); sg.addColorStop(0,'#fff2a8'); sg.addColorStop(0.5,'#ffcf3a'); sg.addColorStop(1,'#e08a12');
      skInk(g,skStarP(0,3,40,17),sg,6); g.restore(); g.fillStyle='rgba(255,255,240,.7)'; g.fill(skStarP(-4,-3,15,6.5)); break; }
    case 'br_blade': skSword(g,-Math.PI/4,1.12); break;
    case 'br_flame': skFlame(g,0,36,22,72); break;
    case 'br_wings': skWing(g,skMix(pal.col,'#ffffff',0.3)); break;
    case 'br_heart': skInk(g,skP(SK_HEART),pal.col); g.fillStyle='rgba(255,255,255,.35)'; g.fill(skEll(-16,-14,7,4)); break;
    // weapon fallbacks for the Hero page (used only while drawWeaponIcon draws nothing)
    case 'w_sword': skSword(g,-Math.PI/4,1.1); break;
    case 'w_daggers': skSword(g,-Math.PI/4,0.78,-9,2); skSword(g,Math.PI/4,0.78,9,2); break;
    case 'w_spear': g.save(); g.rotate(Math.PI/4); skLine(g,skP('M0 40 L0 -22'),'#b07a44',5); skInk(g,skP('M0 -42 L9 -22 L0 -16 L-9 -22 Z'),'#e2e8ee',4); skLine(g,skP('M-7 -16 L7 -16'),'#d84a3a',3); g.restore(); break;
    case 'w_hammer': g.save(); g.rotate(-Math.PI/5); skLine(g,skP('M0 38 L0 -10'),'#a06a3a',6); skInk(g,skP('M-20 -30 L20 -30 L20 -10 L-20 -10 Z'),'#9aa4ae'); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(-16,-27,32,4); g.restore(); break;
    case 'w_bow': { const p=new Path2D(); p.arc(-30,0,40,-1.05,1.05); skLine(g,p,'#b07a44',6); g.strokeStyle='#f2ece0'; g.lineWidth=1.8; g.beginPath(); g.moveTo(-30+Math.cos(-1.05)*40,Math.sin(-1.05)*40); g.lineTo(-30+Math.cos(1.05)*40,Math.sin(1.05)*40); g.stroke(); skLine(g,skP('M-12 0 L30 0'),'#d8c098',3); skInk(g,skP('M36 0 L26 -6 L26 6 Z'),'#dfe4ea',3); break; }
    case 'w_boomerang': skLine(g,skP('M-28 16 Q-6 -34 26 -6'),'#d9a066',11); g.strokeStyle='rgba(255,255,255,.4)'; g.lineWidth=2; g.stroke(skP('M-22 8 Q-6 -26 18 -8')); break;
    default: skInk(g,skCirc(0,0,14),C);
  }
}
function skMedal(g,pal,lock){
  g.fillStyle='rgba(0,0,0,.45)'; g.fill(skCirc(0,3,47));
  const rim=g.createLinearGradient(0,-48,0,48); rim.addColorStop(0,'#8a5230'); rim.addColorStop(0.5,'#5a2c16'); rim.addColorStop(1,'#2a120a'); g.fillStyle=rim; g.fill(skCirc(0,0,47));
  const f=g.createRadialGradient(-12,-16,4,0,0,42); f.addColorStop(0,skMix(pal.deep,pal.col,0.42)); f.addColorStop(0.72,pal.deep); f.addColorStop(1,skMix(pal.deep,'#000000',0.45));
  g.fillStyle=f; g.fill(skCirc(0,0,41));
  g.strokeStyle=pal.col; g.globalAlpha=0.45; g.lineWidth=1.6; g.stroke(skCirc(0,0,37.5)); g.globalAlpha=1;
  g.fillStyle='rgba(255,255,255,.08)'; g.fill(skEll(0,-22,27,12));
}
function skIcon(id,pal,size){
  const key=id+'|'+(pal.id||pal.k||'')+'|'+size+(pal.bare?'b':''); if(SK.ic[key]) return SK.ic[key];
  const S=size*2, c=mkCanvas(S,S), g=c.getContext('2d');
  g.translate(S/2,S/2); g.scale(S/100,S/100);
  if(pal.bare) g.scale(1.18,1.18); else skMedal(g,pal);
  g.save(); if(!pal.bare) g.scale(0.92,0.92); skSym(g,id,pal); g.restore();
  return SK.ic[key]=c.toDataURL();
}
const SK_GOLD={k:'gold',col:'#ffd27a',deep:'#5a3a10'};
const SK_SVG={
  lock:'<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4.6 7V5.2a3.4 3.4 0 0 1 6.8 0V7" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="7" width="10" height="7.6" rx="1.8" fill="currentColor"/></svg>',
  x:'<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  check:'<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.6l3.1 3.1L13 4.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  star:'<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 1.2l2 4.3 4.7.6-3.4 3.2.9 4.7L8 11.7 3.8 14l.9-4.7L1.3 6.1 6 5.5z" fill="currentColor"/></svg>'
};

// ---------- the Skills screen (DOM built here, so body.html stays untouched)
const SK_CSS=`
#skills .skp{max-width:960px;width:100%;max-height:100%;display:flex;flex-direction:column;padding:16px 18px 14px;position:relative;overflow:hidden}
.skhd{display:flex;align-items:center;gap:12px;flex:none}
.skhd h2{margin:0!important;flex:1 1 auto;min-width:0}
.skpts{display:inline-flex;align-items:center;gap:8px;padding:3px 14px 3px 4px;border-radius:999px;background:linear-gradient(180deg,#4a200f,#28110a);border:1px solid rgba(255,200,110,.55);font-size:13px;color:#e8d0b0;white-space:nowrap;box-shadow:0 0 18px rgba(255,170,60,.18)}
.skpts img{width:30px;height:30px;display:block}
.skpts b{font-family:var(--f-display);font-size:21px;color:var(--gold);line-height:1;font-variant-numeric:tabular-nums}
.skpts.none{border-color:var(--edge);box-shadow:none}.skpts.none b{color:var(--muted)}.skpts.none img{filter:grayscale(.8) brightness(.7)}
.skpts.bump{animation:skBump .55s ease}
.skx{flex:none;width:40px;height:40px;border-radius:10px;border:1px solid var(--edge);background:linear-gradient(180deg,var(--btn-hi),var(--btn));color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0}
.skx:hover{border-color:var(--ember)}.skx:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.sksub{margin:4px 0 10px!important;font-size:13px;flex:none}
.sktabs{margin:0 0 4px;flex:none}
.sktabs button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:8px 6px;font-weight:600;position:relative;min-width:0}
.sktabs img{width:22px;height:22px;flex:none;display:block}
.sktabs .skc{font-size:11px;font-weight:700;min-width:18px;padding:1px 5px;border-radius:9px;background:rgba(0,0,0,.35);color:var(--muted);font-variant-numeric:tabular-nums}
.sktabs button[aria-pressed="true"]{background:linear-gradient(180deg,#5c2512,#3a160c);color:var(--ink);box-shadow:inset 0 -3px 0 var(--ac)}
.sktabs button[aria-pressed="true"] .skc{color:var(--ink)}
.sktabs .dot{position:absolute;top:5px;right:6px;width:8px;height:8px;border-radius:50%;background:#ffd860;box-shadow:0 0 8px #ffb030}
.skbody{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:6px 4px 10px 2px;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 8px,#000 calc(100% - 10px),transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 8px,#000 calc(100% - 10px),transparent 100%);-webkit-overflow-scrolling:touch;text-align:left}
.skbh{display:flex;justify-content:space-between;align-items:baseline;gap:4px 12px;flex-wrap:wrap;margin:2px 0 10px}
.skbh b{font-family:var(--f-display);color:var(--ac);letter-spacing:.08em;font-size:15px;text-transform:uppercase}
.skbh span{color:var(--muted);font-size:13px}
.sktl{display:flex;align-items:center;gap:10px;margin:0 0 7px;font-size:12px;color:var(--muted)}
.sktl>span:not(.sktn):not(.ln){display:inline-flex;align-items:center;gap:6px}
.sktn{font-family:var(--f-display);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ember);flex:none}
.sktl .ln{flex:1;height:1px;background:linear-gradient(90deg,rgba(255,140,70,.35),rgba(255,140,70,0))}
.sktier.shut .sktn{color:#9a7f6a}.sktier.shut .sktl{color:#d8b49a}
.skprog{display:inline-flex;gap:4px;margin-left:2px}.skprog i{width:7px;height:7px;transform:rotate(45deg);background:rgba(255,255,255,.16);display:inline-block}.skprog i.on{background:var(--ac)}
.skrow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.skrow.one{grid-template-columns:minmax(0,1fr);max-width:calc(50% - 5px);margin:0 auto}
.skcn{height:18px;display:flex;justify-content:center}.skcn i{width:2px;height:100%;background:var(--ac);opacity:.6}.skcn.shut i{opacity:.35;background:repeating-linear-gradient(180deg,var(--ac) 0 3px,transparent 3px 7px)}
.skn{position:relative;display:grid;grid-template-columns:60px minmax(0,1fr);grid-template-rows:1fr auto;column-gap:12px;row-gap:9px;padding:11px 12px;border-radius:12px;background:linear-gradient(180deg,#2e150d,#1c0d09);border:1px solid var(--edge)}
.skic{grid-row:1/3;position:relative;width:60px;height:60px}
.skic img{width:60px;height:60px;display:block}
.sklk{position:absolute;right:-3px;bottom:-3px;width:24px;height:24px;border-radius:50%;background:#1a0c08;border:1px solid var(--edge);display:grid;place-items:center;color:#e8c8a8}
.sktx{min-width:0}
.sknm{font-family:var(--f-display);font-weight:800;font-size:15.5px;color:var(--ink);letter-spacing:.02em;display:flex;align-items:center;gap:4px 10px;flex-wrap:wrap;line-height:1.2}
.skpip{display:inline-flex;gap:5px;padding-left:1px}
.skpip i{width:8px;height:8px;transform:rotate(45deg);border:1.5px solid var(--ac);display:inline-block;border-radius:1px;opacity:.75}
.skpip i.on{background:var(--ac);box-shadow:0 0 6px var(--ac);opacity:1}
.skpip i.new{animation:skPip .7s ease}
.skds{font-size:13.5px;line-height:1.42;color:var(--muted);margin:4px 0 0}
.skef{font-size:12.5px;line-height:1.35;color:#bfe8f2;margin:5px 0 0}
.skef em{font-style:normal;color:#a6e6a8;white-space:nowrap}
.skrq{font-size:12.5px;line-height:1.35;color:#ffb08a;margin:5px 0 0;display:flex;gap:6px;align-items:flex-start}
.skrq svg{flex:none;margin-top:1px}
.sklrn{grid-column:2;align-self:end;padding:8px 12px!important;font-size:14px!important;display:flex!important;justify-content:center;align-items:center;gap:8px}
.sklrn.off{background:rgba(0,0,0,.18);border-style:dashed;border-color:rgba(255,140,70,.28);color:#bfa58c;font-weight:600;font-size:13px!important}
.sklrn.off svg{opacity:.8}
.sklrn b{display:inline-flex;align-items:center;gap:3px;color:#ffe7a8;font-weight:800;font-size:13px;padding:1px 7px;border-radius:7px;background:rgba(0,0,0,.25)}
#skills .btn[aria-disabled="true"]{cursor:default}
#skills .skres .btn[aria-disabled="true"]{opacity:.6;filter:saturate(.5)}
#skills .btn[aria-disabled="true"]:hover{border-color:rgba(255,140,70,.45)}
.skmx{grid-column:2;align-self:end;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:800;color:var(--ac);padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.25);letter-spacing:.1em;text-transform:uppercase}
.skn.can{border-color:rgba(255,200,110,.75);box-shadow:0 0 0 1px rgba(255,200,110,.18),0 6px 22px rgba(255,140,50,.13)}
.skn.max{box-shadow:inset 0 0 0 1px var(--ac);background:linear-gradient(180deg,#36190e,#200f09)}
.skn.lock .skic img{filter:grayscale(.85) brightness(.62)}
.skn.lock .sknm{color:#cdb8a4}
.skn.pop{animation:skPop .8s ease}
.skn.no{animation:skNo .38s ease}
.skres{margin-top:16px;padding:10px 12px;border:1px dashed rgba(255,140,70,.32);border-radius:10px;display:flex;gap:10px 14px;align-items:center;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.skres p{flex:1 1 240px;margin:0!important;font-size:13px;line-height:1.45}
.skres b{color:var(--ink)}
.skres .btn{width:auto;flex:none}
.skft{display:flex;gap:12px;align-items:center;justify-content:flex-end;margin-top:10px;flex:none}
.skkeys{flex:1;font-size:12px;color:var(--muted);text-align:left}
.skkeys kbd{font-family:var(--f-ui);font-weight:700;color:var(--ink);background:#3a1a10;border:1px solid var(--edge);border-bottom-width:2px;border-radius:5px;padding:0 5px;font-size:11px}
.skft .btn{width:auto;min-width:150px}
.sktoast{position:absolute;left:50%;bottom:70px;transform:translate(-50%,10px);width:max-content;max-width:calc(100% - 32px);background:rgba(16,8,5,.97);border:1px solid rgba(255,200,110,.6);border-radius:10px;padding:9px 16px;font-size:14px;line-height:1.4;color:var(--ink);opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.55);z-index:2}
.sktoast.on{opacity:1;transform:translate(-50%,0)}
.skbadge{display:inline-flex;align-items:center;gap:3px;margin-left:8px;padding:1px 8px;border-radius:9px;background:rgba(255,200,90,.18);color:#ffe08a;font-size:13px;vertical-align:1px}
@keyframes skBump{0%{transform:scale(1)}35%{transform:scale(1.12)}100%{transform:scale(1)}}
@keyframes skPip{0%{transform:rotate(45deg) scale(2.2);box-shadow:0 0 16px #fff}100%{transform:rotate(45deg) scale(1)}}
@keyframes skPop{0%{box-shadow:0 0 0 2px #ffe08a,0 0 34px rgba(255,190,80,.7);transform:scale(1.015)}100%{transform:scale(1)}}
@keyframes skNo{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}50%{transform:translateX(5px)}75%{transform:translateX(-3px)}}
#skills.ov{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
@media (max-width:640px){
  #skills.ov{padding-left:max(10px,env(safe-area-inset-left,0px));padding-right:max(10px,env(safe-area-inset-right,0px))}
  #skills .skp{padding:14px 12px 12px}
  .skhd{gap:8px}.skhd h2{font-size:24px!important}
  .skpts{padding-right:10px}.skpts span{font-size:12px}
  .skrow,.skrow.one{grid-template-columns:minmax(0,1fr);max-width:none}
  .sktabs button{flex-direction:column;gap:2px;padding:6px 2px 7px;font-size:12px}
  .sktabs .skc{position:absolute;top:3px;right:4px;font-size:10px;padding:0 4px;min-width:0}
  .sktabs .dot{top:5px;right:auto;left:6px}
  .skn{grid-template-columns:52px minmax(0,1fr);column-gap:10px;padding:10px}
  .skic,.skic img{width:52px;height:52px}
  .skkeys{display:none}.skft .btn{flex:1}
}
@media (max-height:520px){
  #skills.ov{padding-top:max(6px,env(safe-area-inset-top,0px));padding-bottom:max(6px,env(safe-area-inset-bottom,0px))}
  #skills .skp{padding:10px 14px 8px}
  .skhd h2{font-size:22px!important}
  .skpts img{width:24px;height:24px}.skpts b{font-size:18px}
  .skx{width:36px;height:36px}
  .sksub,.skft{display:none}
  .sktabs{margin-bottom:8px}.sktabs button{padding:5px 6px;flex-direction:row}
  .sktabs .skc{position:static}
  .skn{padding:9px 10px;row-gap:7px}.skds{font-size:12.5px}
  .sktoast{bottom:14px}
}
@media (prefers-reduced-motion:reduce){.skn.pop,.skn.no,.skpts.bump,.skpip i.new{animation:none}.sktoast{transition:none}}
/* journal Hero page */
.hr{color:var(--muted)}
.hrtop{display:flex;gap:14px;align-items:center;margin:2px 0 10px}
.hrlv{flex:none;width:66px;height:66px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#7a3a18,#2a120a 70%);border:2px solid #c98a3a;box-shadow:0 0 0 3px rgba(0,0,0,.35),0 0 18px rgba(255,150,60,.22)}
.hrlv small{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#e8c890;line-height:1}
.hrlv b{font-family:var(--f-display);font-size:28px;line-height:1.05;color:var(--gold)}
.hrxp{flex:1;min-width:0}
.hrxpt{display:flex;justify-content:space-between;gap:8px;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-variant-numeric:tabular-nums}
.hrxpt span:last-child{color:var(--ink);letter-spacing:.02em}
.hrbar{height:10px;border-radius:6px;background:rgba(255,255,255,.07);border:1px solid rgba(255,140,70,.2);overflow:hidden;margin:5px 0 4px}
.hrbar i{display:block;height:100%;background:linear-gradient(90deg,#b8781e,#ffd27a);border-radius:6px}
.hrxp small{font-size:12.5px}
.hrsp{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:rgba(0,0,0,.25);border:1px solid rgba(255,140,70,.15);border-radius:10px;padding:8px 10px}
.hrsp.on{border-color:rgba(255,200,110,.55);background:linear-gradient(90deg,rgba(120,70,20,.35),rgba(0,0,0,.2))}
.hrsp img{width:30px;height:30px;flex:none}.hrsp:not(.on) img{filter:grayscale(.8) brightness(.7)}
.hrsp span{flex:1 1 160px;color:var(--ink)}.hrsp span b{color:var(--gold)}
.hrsp .btn{width:auto;flex:none;padding:8px 16px}
.hrst{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
@media (max-width:640px){.hrst{grid-template-columns:repeat(2,minmax(0,1fr))}}
.hrst div{background:rgba(0,0,0,.25);border:1px solid rgba(255,140,70,.13);border-radius:8px;padding:6px 10px}
.hrst b{display:block;font-size:17px;line-height:1.25;color:var(--ink);font-variant-numeric:tabular-nums}
.hrst b.up{color:#a6e6a8}
.hrst span{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.hrab{display:grid;gap:6px}
.hrabi{display:flex;gap:10px;align-items:center;background:rgba(0,0,0,.22);border-radius:9px;padding:7px 10px;border:1px solid rgba(255,140,70,.1)}
.hrabi img{width:44px;height:44px;flex:none;filter:grayscale(1) brightness(.5)}
.hrabi.own{border-color:rgba(255,200,110,.35)}.hrabi.own img{filter:none}
.hrabi b{color:var(--ink)}.hrabi:not(.own) b{color:#a89480}
.hrabi small{display:block;font-size:12.5px;line-height:1.38}
.hrok{display:inline-block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin-left:8px;padding:1px 6px;border-radius:5px;background:rgba(140,220,140,.15);color:#a6e6a8;font-weight:700;vertical-align:1px}
.hrwp{display:grid;grid-template-columns:repeat(auto-fill,minmax(102px,1fr));gap:6px}
.hrw{background:rgba(0,0,0,.22);border:1px solid rgba(255,140,70,.12);border-radius:9px;padding:6px 6px 8px;text-align:center}
.hrw canvas{width:60px;height:60px;display:block;margin:0 auto 2px}
.hrw b{display:block;font-size:13px;color:#a89480;line-height:1.25}.hrw.own b{color:var(--ink)}
.hrw small{display:block;font-size:11px;line-height:1.3;margin-top:2px}
.hrw.eq{border-color:rgba(255,200,110,.6)}.hrw.eq small{color:var(--gold)}
.hrsk{display:flex;flex-wrap:wrap;gap:6px}
.hrsk span{font-size:12.5px;padding:3px 9px;border-radius:8px;background:rgba(0,0,0,.25);border:1px solid rgba(255,140,70,.15);color:var(--ink)}
.hrsk span i{font-style:normal;color:var(--muted);margin-left:4px}
`;
(function skBuildDom(){
  // appended to body so it comes after the game's own style tags in both build flavors
  const st=document.createElement('style'); st.id='skCss'; st.textContent=SK_CSS; document.body.appendChild(st);
  const ov=document.createElement('div'); ov.id='skills'; ov.className='ov dim';
  ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-labelledby','skTitle');
  ov.innerHTML=`<div class="panel skp" id="skPanel">
    <div class="skhd"><h2 id="skTitle">Skills</h2><div class="skpts" id="skPts"><img id="skStar" alt=""><b id="skSp">0</b><span id="skSpL">points to spend</span></div><button type="button" class="skx" id="skClose" tabindex="0" aria-label="Close skills">${SK_SVG.x}</button></div>
    <p class="sksub" id="skSub"></p>
    <div class="seg sktabs" id="skTabs" role="group" aria-label="Skill branches"></div>
    <div class="skbody" id="skBody"></div>
    <div class="skft"><span class="skkeys" id="skKeys"></span><button type="button" class="btn c hot" id="skDone" tabindex="0">Done</button></div>
    <div class="sktoast" id="skToast" role="status" aria-live="polite"></div>
  </div>`;
  document.body.appendChild(ov);
  // Hero tab in the journal (a12b_ui binds every #jTabs button when it loads, after this file)
  const jt=$('#jTabs'); if(jt&&!jt.querySelector('[data-t="hero"]')){ const b=document.createElement('button'); b.type='button'; b.dataset.t='hero'; b.setAttribute('aria-pressed','false'); b.textContent='Hero'; jt.appendChild(b); }
  // Skills in the pause menu, under Journal
  const pj=$('#bPauseJournal');
  if(pj){ const b=document.createElement('button'); b.type='button'; b.className='btn c'; b.id='bPauseSkills'; b.textContent='Skills'; pj.insertAdjacentElement('afterend',b);
    b.addEventListener('click',()=>{ if(scene==='paused'){ SFX.play('ui'); openSkills(); } }); }
  const pz=$('#pause'); if(pz&&window.MutationObserver) new MutationObserver(skPauseLabel).observe(pz,{attributes:true,attributeFilter:['class']});
  $('#skClose').addEventListener('click',()=>closeSkills());
  $('#skDone').addEventListener('click',()=>closeSkills());
  $('#skTabs').addEventListener('click',e=>{ const b=e.target.closest('button[data-br]'); if(b&&scene==='skills') skSetTab(b.dataset.br,true); });
  $('#skBody').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||scene!=='skills') return; if(b.dataset.learn) skTryLearn(b.dataset.learn); else if(b.dataset.res) skTryReset(b); });
})();
function skPauseLabel(){
  const b=$('#bPauseSkills'); if(!b) return;
  const story=!!(G&&G.mode==='story'); b.hidden=!story;
  const sp=story?(G.sp|0):0; b.innerHTML=sp>0?`Skills<span class="skbadge">${SK_SVG.star}${sp}</span>`:'Skills';
}
function skBuildTabs(){
  if(SK.built) return; SK.built=true;
  $('#skStar').src=skIcon('star',{k:'star',bare:true},30);
  $('#skTabs').innerHTML=SK_BR.map(b=>`<button type="button" tabindex="0" data-br="${b.id}" style="--ac:${b.col}" aria-pressed="false"><img src="${skIcon('br_'+b.id,Object.assign({bare:true},b),22)}" alt="" width="22" height="22"><span>${b.name}</span><span class="skc">0</span><span class="dot" hidden></span></button>`).join('');
}
function openSkills(){
  if(!G||G.mode!=='story'||!player) return;
  if(scene==='skills'){ closeSkills(); return; }
  if(scene!=='play'&&scene!=='paused'&&scene!=='journal') return;
  SK.from=scene; scene='skills'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null;
  SFX.play('ui'); SK.hintEnd=0; SK.arm=0; skStats(); skBuildTabs();
  if(!SK.tab||((G.sp|0)>0&&!skCanAny(SK.tab))){ const b=SK_BR.find(q=>skCanAny(q.id)); SK.tab=b?b.id:(SK.tab||'blade'); }
  skRender(); $('#skBody').scrollTop=0;
  for(const e of document.querySelectorAll('#skills [data-focus]')) e.removeAttribute('data-focus');
  const f=$('#skBody .sklrn:not([aria-disabled])')||$(`#skTabs button[data-br="${SK.tab}"]`); if(f) f.setAttribute('data-focus','');
  $('#skKeys').innerHTML=skCtrl()==='key'?'<kbd>Arrows</kbd> move · <kbd>Enter</kbd> learn · <kbd>Q</kbd> <kbd>E</kbd> branch · <kbd>Esc</kbd> close':'';
  show('skills');
}
function closeSkills(){
  if(scene!=='skills') return;
  const f=SK.from; SK.from='play'; skToast('');
  if(f==='journal'){ scene='journal'; renderJour(); show('jour'); }
  else if(f==='paused'){ scene='paused'; skPauseLabel(); show('pause'); }
  else { scene='play'; hideAll(); }
  SFX.play('ui'); saveGame();
}
function skSetTab(id,focus){
  if(!SK_BRBY[id]) return; const ch=SK.tab!==id; SK.tab=id; SK.arm=0;
  skRender(); if(ch){ $('#skBody').scrollTop=0; SFX.play('ui'); }
  if(focus){ const b=$(`#skTabs button[data-br="${id}"]`); if(b&&document.activeElement!==b&&!usingTouch) b.focus({preventScroll:true}); }
}
function skToast(t){
  const el=$('#skToast'); if(!el) return; clearTimeout(SK.toastT);
  if(!t){ el.classList.remove('on'); return; }
  el.textContent=t; el.classList.add('on'); SK.toastT=setTimeout(()=>el.classList.remove('on'),2800);
}
function skCard(n,br){
  const E=escapeHtml, r=skRank(n.id), why=skWhy(n), can=!why, max=r>=n.max, lock=!!why&&(why.k==='row'||why.k==='need'), needT=max?'':skNeedTxt(n);
  const pips=Array.from({length:n.max},(_,i)=>`<i class="${i<r?'on':''}${SK.just===n.id&&i===r-1?' new':''}"></i>`).join('');
  const eff=n.each?`<div class="skef">${n.max>1?'Each rank: ':''}${E(n.each)}${r&&n.max>1&&n.now?` · <em>Total ${E(n.now(r))}</em>`:''}</div>`:'';
  const rq=needT?`<div class="skrq">${SK_SVG.lock}<span>${E(needT)}</span></div>`:'';
  const lab=can?`${r?'Rank up':'Learn'} <b>${SK_SVG.star}1</b>`:why.k==='sp'?'Need a skill point':why.k==='row'?`${SK_SVG.lock} Row ${n.row+1} is locked`:`${SK_SVG.lock} Locked`;
  const btn=max?`<span class="skmx">${SK_SVG.check}Mastered</span>`:`<button type="button" tabindex="0" class="btn c sm sklrn${can?' hot':' off'}" data-learn="${n.id}"${can?'':' aria-disabled="true"'} aria-label="${E(n.name)}: ${can?(r?'rank up':'learn'):E(why.t)}">${lab}</button>`;
  return `<div class="skn${can?' can':''}${max?' max':''}${lock?' lock':''}" data-id="${n.id}"><div class="skic"><img src="${skIcon(n.id,br,60)}" alt="" width="60" height="60">${lock?`<span class="sklk">${SK_SVG.lock}</span>`:''}</div><div class="sktx"><div class="sknm">${E(n.name)}<span class="skpip" role="img" aria-label="Rank ${r} of ${n.max}">${pips}</span></div><div class="skds">${E(n.desc)}</div>${eff}${rq}</div>${btn}</div>`;
}
function skRender(){
  if(!player) return;
  const sp=G.sp|0, br=SK_BRBY[SK.tab]||SK_BR[0], spent=skSpent(br.id), body=$('#skBody');
  const act=document.activeElement, keep=act&&body.contains(act)?(act.dataset.learn||(act.dataset.res?'_res':'')):null;
  $('#skSp').textContent=sp; $('#skSpL').textContent=sp===1?'point to spend':'points to spend'; $('#skPts').classList.toggle('none',!sp);
  $('#skSub').textContent=`Level ${player.level}. You earn 1 point every level, and 1 more for each Trial you beat.`;
  for(const b of document.querySelectorAll('#skTabs button')){ const id=b.dataset.br; b.setAttribute('aria-pressed',String(id===br.id)); const k=skSpent(id), sc=b.querySelector('.skc'); sc.textContent=k; sc.hidden=!k; b.querySelector('.dot').hidden=!skCanAny(id); }
  $('#skPanel').style.setProperty('--ac',br.col);
  const out=[`<div class="skbh"><b>${br.name}</b><span>${escapeHtml(br.blurb)} ${spent} point${spent===1?'':'s'} spent here.</span></div>`];
  for(let row=0;row<3;row++){
    const nodes=SKILL_TREE.filter(n=>n.br===br.id&&n.row===row), need=SK_ROW_NEED[row], open=spent>=need;
    if(row) out.push(`<div class="skcn${open?'':' shut'}"><i></i></div>`);
    const prog=Array.from({length:need},(_,i)=>`<i class="${i<spent?'on':''}"></i>`).join('');
    const label=open?'':`<span>${SK_SVG.lock} Spend ${need} points in ${br.name} to open<span class="skprog">${prog}</span></span>`;
    out.push(`<div class="sktier${open?'':' shut'}"><div class="sktl"><span class="sktn">Row ${row+1}</span>${label}<span class="ln"></span></div><div class="skrow${nodes.length===1?' one':''}">${nodes.map(n=>skCard(n,br)).join('')}</div></div>`);
  }
  const all=skSpent();
  if(all){
    const near=skYaraNear(), ok=near&&(G.coins|0)>=SK_RESET_COST, armed=Date.now()-SK.arm<4000;
    out.push(`<div class="skres"><p><b>Changed your mind?</b> Elder Yara can help you forget every skill and get your ${all} point${all>1?'s':''} back. She asks ${SK_RESET_COST} coins for her trouble. ${near?'She is right here.':'Find her by the well in Emberhollow.'}</p><button type="button" tabindex="0" class="btn c sm" data-res="1"${ok?'':' aria-disabled="true"'}>${armed?'Tap again to forget them all':near?`Start over (${SK_RESET_COST} coins)`:'Ask Elder Yara'}</button></div>`);
  }
  body.innerHTML=out.join('');
  SK.just=null;
  if(keep){ const b=keep==='_res'?body.querySelector('button[data-res]'):body.querySelector(`button[data-learn="${keep}"]`); if(b) b.focus({preventScroll:true}); else { const c=body.querySelector(`.skn[data-id="${keep}"]`); const nb=c&&c.parentElement.querySelector('.sklrn')||body.querySelector('.sklrn'); if(nb) nb.focus({preventScroll:true}); } }
}
function skTryLearn(id){
  const n=SKN[id]; if(!n) return;
  const why=skWhy(n);
  if(why){ skToast(why.t); SFX.play('ui',0.5); const c=$(`#skBody .skn[data-id="${id}"]`); if(c){ c.classList.remove('no'); void c.offsetWidth; c.classList.add('no'); } return; }
  learnSkill(id); SK.just=id; skRender();
  const r=skRank(id), c=$(`#skBody .skn[data-id="${id}"]`); if(c) c.classList.add('pop');
  const pts=$('#skPts'); pts.classList.remove('bump'); void pts.offsetWidth; pts.classList.add('bump');
  skToast(n.max>1?`${n.name}, rank ${r}!${n.now?' Total '+n.now(r)+'.':''}`:`You learned ${n.name}!`);
}
function skTryReset(b){
  const spent=skSpent(); if(!spent) return;
  if(!skYaraNear()){ skToast('Find Elder Yara by the well in Emberhollow. She can help you start over.'); return; }
  if((G.coins|0)<SK_RESET_COST){ skToast(`Yara asks for ${SK_RESET_COST} coins. You have ${G.coins|0}.`); return; }
  if(Date.now()-SK.arm>4000){ SK.arm=Date.now(); skToast('Are you sure? Tap again to forget every skill.'); b.textContent='Tap again to forget them all'; return; }
  SK.arm=0; G.coins-=SK_RESET_COST; const n=resetSkills(); SFX.play('shrine'); skRender();
  const pts=$('#skPts'); pts.classList.remove('bump'); void pts.offsetWidth; pts.classList.add('bump');
  skToast(`Yara taps you on the nose. Your skills are fresh again, and ${n} point${n>1?'s are':' is'} back!`);
}
// keyboard: arrows move between buttons by where they sit on screen, Q and E (or 1 to 4) pick a branch, Escape or U closes
function skNav(dx,dy){
  const all=[...document.querySelectorAll('#skills button')].filter(b=>b.offsetParent!==null&&!b.hidden);
  const cur=document.activeElement;
  if(!all.includes(cur)){ const f=$('#skBody .sklrn:not([aria-disabled])')||$(`#skTabs button[data-br="${SK.tab}"]`); if(f) f.focus(); return; }
  const tabs=[...document.querySelectorAll('#skTabs button')], ti=tabs.indexOf(cur);
  if(ti>=0&&dx){ const n=tabs[clamp(ti+dx,0,tabs.length-1)]; if(n!==cur) skSetTab(n.dataset.br,true); return; }
  const r=cur.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  let best=null, bs=1e9;
  for(const b of all){
    if(b===cur) continue;
    const q=b.getBoundingClientRect(), qx=q.left+q.width/2, qy=q.top+q.height/2, ddx=qx-cx, ddy=qy-cy;
    const along=dx?ddx*dx:ddy*dy; if(along<=6) continue;
    const overlap=dx?(q.bottom>r.top&&q.top<r.bottom):(q.right>r.left&&q.left<r.right);
    const across=overlap?0:(dx?Math.abs(ddy):Math.abs(ddx));
    const s=along+across*2.5; if(s<bs){ bs=s; best=b; }
  }
  if(best){ best.focus({preventScroll:true}); best.scrollIntoView({block:'nearest',inline:'nearest'}); }
}
addEventListener('keydown',e=>{
  if(scene!=='skills') return;
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')) return;
  const c=e.code, stop=()=>{ e.preventDefault(); e.stopPropagation(); };
  if(c==='Escape'||c==='KeyU'||c==='Backspace'){ stop(); if(!e.repeat) closeSkills(); return; }
  const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],KeyA:[-1,0],KeyD:[1,0],KeyW:[0,-1],KeyS:[0,1]}[c];
  if(d){ stop(); skNav(d[0],d[1]); return; }
  const i=SK_BR.findIndex(b=>b.id===SK.tab);
  if(c==='KeyQ'||c==='PageUp'||c==='BracketLeft'){ stop(); skSetTab(SK_BR[(i+3)%4].id,true); return; }
  if(c==='KeyE'||c==='PageDown'||c==='BracketRight'){ stop(); skSetTab(SK_BR[(i+1)%4].id,true); return; }
  const n={Digit1:0,Digit2:1,Digit3:2,Digit4:3}[c]; if(n!=null){ stop(); skSetTab(SK_BR[n].id,true); return; }
  if(c==='KeyN'||c==='KeyP'||c==='KeyM'||c==='KeyI'||c==='Tab') return;
  if(c!=='Enter'&&c!=='Space'&&c!=='NumpadEnter') e.stopPropagation();
},true);

// ---------- journal Hero page (renderJour in a12b_ui calls these for jTab==='hero')
const SK_WPN_HINT={sword:'From Mom at the forge',daggers:'A reward for Stop, Thief!',spear:'Pell sells one',hammer:'Mom can forge one',boomerang:'In the Trial of the Leap',bow:'In the Trial of the Tide'};
function skStatTxt(m){ const d=Math.round((m-1)*100); return d>0?`+${d}%`:d<0?`${d}%`:'Normal'; }
function heroTabHtml(){
  if(!player) return '';
  skStats();
  const p=player, s=p.stats, E=escapeHtml, need=xpNeed(p.level), xp=Math.floor(p.xp), sp=G.sp|0, ctl=skCtrl();
  const o=[];
  o.push(`<div class="hr"><div class="hrtop"><div class="hrlv"><small>Level</small><b>${p.level}</b></div><div class="hrxp"><div class="hrxpt"><span>Experience</span><span>${xp} / ${need}</span></div><div class="hrbar"><i style="width:${(clamp(xp/need,0,1)*100).toFixed(1)}%"></i></div><small>${Math.max(0,need-xp)} more to reach level ${p.level+1}. Each level makes you tougher and gives a skill point.</small></div></div>`);
  o.push(`<div class="hrsp${sp?' on':''}"><img src="${skIcon('star',{k:'star',bare:true},30)}" alt=""><span>${sp?`<b>${sp} skill point${sp>1?'s':''}</b> ready to spend.`:'No skill points right now. You get one every level.'}</span><button type="button" tabindex="0" class="btn c sm${sp?' hot':''}" data-sk="1">Open Skills</button></div>`);
  const tile=(v,l,up)=>`<div><b${up?' class="up"':''}>${E(v)}</b><span>${E(l)}</span></div>`;
  const dmg=s.dmgMul*(s.wpnMul||1)*((s.slash||15)/15), arm=s.armor||1;
  o.push('<div class="jh2">How strong you are</div><div class="hrst">'+[
    tile(String(p.maxHp),'Health'),tile(String(Math.round(p.maxStamina)),'Stamina'),tile(String(Math.round(p.maxEnergy)),'Fire meter'),tile(String(p.potionsMax),'Draughts'),
    tile(skStatTxt(dmg),'Damage',dmg>1.005),tile(skStatTxt(s.atkSpeed||1),'Swing speed',(s.atkSpeed||1)>1.005),tile(skStatTxt(s.fire||1),'Fire breath',(s.fire||1)>1.005),tile(skStatTxt((s.roarDmg||45)/45),'Roar power',(s.roarDmg||45)>45.2),
    tile(s.critCh>0?`${Math.round(s.critCh*100)}%`:'None yet','Critical hits',s.critCh>0),tile(arm<0.995?`${Math.round((1-arm)*100)}% less`:'Normal','Damage taken',arm<0.995),
    tile(skStatTxt((s.speed||200)/200),'Move speed',(s.speed||200)>201),tile(s.killHeal>0?`+${s.killHeal}`:'None yet','Heal per foe',s.killHeal>0)
  ].join('')+'</div>');
  const how={
    jump:{key:'Press C to jump over gaps, fences and small rocks. Sprint first to jump farther.',touch:'Tap JUMP to hop over gaps, fences and small rocks. Run first to jump farther.',pad:'Press the bottom face button to jump over gaps, fences and small rocks.'}[ctl],
    stride:'Walk right onto lakes and rivers. Sprinting on water is a little faster.',
    wings:{key:'Jump, then press C again in the air to take off. Press C once more to land. Keep an eye on the flight meter.',touch:'Jump, then tap JUMP again in the air to take off. Tap it once more to land.',pad:'Jump, then press jump again in the air to take off. Press it once more to land.'}[ctl]};
  const AB=[['jump','Jump','a_jump','Waiting in the Trial of the Leap, deep in Whisperwood.'],['stride','Water Stride','a_stride','Waiting in the Trial of the Tide, on an island in Lake Mirrow.'],['wings','Wings','a_wings','Waiting in the Trial of the Sky, up in the Drakeling Crags.']];
  o.push('<div class="jh2">Abilities</div><div class="hrab">'+AB.map(([id,nm,ic,where])=>{ const own=hasAbil(id); return `<div class="hrabi${own?' own':''}"><img src="${skIcon(ic,SK_GOLD,44)}" alt=""><div><b>${nm}</b>${own?'<span class="hrok">Yours</span>':''}<small>${E(own?how[id]:where)}</small></div></div>`; }).join('')+'</div>');
  const ids=typeof WEAPON_IDS!=='undefined'?WEAPON_IDS:['sword'], has=id=>!!(G.weapons&&G.weapons[id])&&!(id==='sword'&&!G.flags.forge), cur=typeof curWeapon==='function'?curWeapon():'sword';
  const nOwn=ids.filter(has).length;
  o.push(`<div class="jh2">Weapons · ${nOwn} of ${ids.length}</div><div class="hrwp">`+ids.map(id=>{ const own=has(id), eq=own&&cur===id, W0=(typeof WEAPONS!=='undefined'&&WEAPONS[id])||{};
    return `<div class="hrw${own?' own':''}${eq?' eq':''}"><canvas width="112" height="112" data-wpn="${id}" data-own="${own?1:0}" aria-hidden="true"></canvas><b>${E(W0.name||id)}</b><small>${E(eq?'In your hand':own?'In your pack':(W0.hint||SK_WPN_HINT[id]||'Somewhere out there'))}</small></div>`; }).join('')+'</div>');
  const got=SKILL_TREE.filter(n=>skRank(n.id));
  o.push(`<div class="jh2">Skills learned · ${skSpent()} point${skSpent()===1?'':'s'} spent</div>`+(got.length?`<div class="hrsk">${got.map(n=>`<span>${E(n.name)}${n.max>1?`<i>${skRank(n.id)}/${n.max}</i>`:''}</span>`).join('')}</div>`:'<p>None yet. Open Skills to pick your first one.</p>'));
  o.push('</div>');
  return o.join('');
}
function heroTabWire(el){
  for(const c of el.querySelectorAll('canvas[data-wpn]')){
    const g=c.getContext('2d'), id=c.dataset.wpn, S=c.width;
    try{ drawWeaponIcon(g,id,S/2,S/2,S*0.8); }catch(e){}
    g.setTransform(1,0,0,1,0,0);
    let blank=true; try{ const d=g.getImageData(0,0,S,S).data; for(let i=3;i<d.length;i+=16) if(d[i]){ blank=false; break; } }catch(e){ blank=false; }
    if(blank){ g.save(); g.translate(S/2,S/2); g.scale(S/100,S/100); g.scale(0.9,0.9); skSym(g,'w_'+id,SK_GOLD); g.restore(); }
    if(c.dataset.own!=='1'){ g.save(); g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(28,14,8,.82)'; g.fillRect(0,0,S,S); g.restore(); }
  }
  const b=el.querySelector('button[data-sk]'); if(b) b.addEventListener('click',()=>openSkills());
}
window.__ebX=Object.assign(window.__ebX||{},{openSkills,closeSkills,learnSkill,resetSkills,giveSkillPoint,gainXp,
  skillWhy:id=>{ const w=SKN[id]&&skWhy(SKN[id]); return w?w.k:''; }, skillSpent:br=>skSpent(br), skillTree:()=>SKILL_TREE.map(n=>({id:n.id,br:n.br,row:n.row,max:n.max})),
  skillTab:id=>skSetTab(id), skillHint:()=>SK.hintEnd-(G?G.time:0), skillChip:()=>SK.chip});
