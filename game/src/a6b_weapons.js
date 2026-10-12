// ================= weapons (STUB: the weapons build replaces this file)
// Contract: G.weapons {id:true}, G.weapon (current id). Ids: sword, daggers, spear, hammer, bow, boomerang.
const WEAPON_IDS=['sword','daggers','spear','hammer','bow','boomerang'];
const WEAPONS={sword:{name:'Ember Blade'},daggers:{name:'Twin Fangs'},spear:{name:'Pike'},hammer:{name:'Forge Hammer'},bow:{name:'Ash Bow'},boomerang:{name:'Wing-rang'}};
function giveWeapon(id,quiet){ G.weapons=G.weapons||{}; G.weapons[id]=true; if(!quiet) setBanner(WEAPONS[id]?WEAPONS[id].name:id,'New weapon',2); }
function curWeapon(){ return (G&&G.weapon)||'sword'; }
function drawWeaponIcon(g,id,x,y,s){}
function drawWeaponHud(){}
function drawWeaponFx(){}  // world-space weapon projectiles and effects (arrows, boomerang), drawn after projectiles
// auto-attack: swing when an enemy (or a pot, in a cave) is within reach
function autoSwing(){
  if(scene!=='play'||!player||!autoAttackOn()||(G.mode==='story'&&!G.flags.forge)) return false;
  const p=player, reach=(p.stats.range||60)+22;
  for(const e of G.enemies){ if(e.dead||e.alpha<0.4) continue; const d=dist(p.x,p.y,e.x,e.y)-e.r; if(d<reach&&(e.aggro||e.boss||d<reach*0.7)) return true; }
  return false;
}
// Ash's held weapon, drawn inside drawHero (already translated to Ash and rotated to his facing)
function drawHeroWeapon(p){
  const st=p.stats;
  const armed=!(G&&G.mode==='story'&&!G.flags.forge);
  if(!armed){ if(p.drinkT>0){ ctx.fillStyle='rgba(120,255,160,.85)'; ctx.beginPath(); ctx.arc(15,7,3,0,TAU); ctx.fill(); } }
  else if(p.drinkT>0){ ctx.fillStyle='rgba(120,255,160,.85)'; ctx.beginPath(); ctx.arc(15,7,3,0,TAU); ctx.fill(); ctx.strokeStyle='#d8e8e0'; ctx.lineWidth=1; ctx.stroke(); drawHeroBlade(0,30,false,true); }
  else if(p.swingT>0){
    const pr=1-p.swingT/p.swingDur, ez=1-Math.pow(1-pr,2.2), span=p.swingFin?1.4:1.15, a0=-p.swingSide*span, a1=p.swingSide*span, a=lerp(a0,a1,ez);
    const R=st.range*(p.swingFin?1.25:1), lo=Math.min(a0,a), hi=Math.max(a0,a);
    const g=ctx.createRadialGradient(0,0,R*0.3,0,0,R); g.addColorStop(0,'rgba(255,240,220,0)'); g.addColorStop(0.8,p.swingFin?'rgba(255,190,110,.42)':'rgba(240,244,250,.3)'); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,R,lo,hi); ctx.arc(0,0,R*0.3,hi,lo,true); ctx.closePath(); ctx.fill();
    drawHeroBlade(a,R*0.92,p.swingFin,false);
  }else drawHeroBlade(0,30,false,true);
}
