// ================= state
let scene='menu', G=null, player=null;
const cam={x:0,y:0};
let shakeMag=0, hitstop=0, flashA=0, flashCol='255,255,255', dyingT=0;
let aimMode='keys', usingTouch=false, diffIdx=clamp(store.get('eb_diff',1)|0,0,2), EID=0;
const settings={nums:!!store.get('eb_nums',false)};
const shake=m=>{ shakeMag=Math.max(shakeMag,reduceMotion?m*0.3:m); };
const ed=x=>x*((G&&G.dmgMul)||1);
// v6 shared helpers: abilities (jump, stride, wings), skill ranks, airborne check
// (v12) or lent by Ember's flame inside the Trial or dungeon that gives it, until that place is done (trialLent, a2h_dungeons.js)
const hasAbil=id=>!!(G&&G.abil&&G.abil[id])||(!!G&&typeof trialLent==='function'&&trialLent(id));
const hasSkill=id=>(G&&G.skills&&G.skills[id])|0;
const airborne=()=>!!player&&(((player.z||0)>3)||!!player.flying);
