// ================= x1_dun_b: the last two Act II dungeons (bible ACT2.md 3, 5.3, 5.4, 6.4, 6.6, 6.7)
//   The Spinning Lighthouse (c_lighthouse): Pearl's tower on Lantern Point, four floors. One gold beam turns round the
//     tower on Pearl's clock and sweeps every room that faces it: moth curtains shrivel in it, shadow bars turn solid,
//     Watcher moths go blind, the Silkspinner drops, a slot beam feeds three mirrors. The Turner on the top floor stops
//     the lens pointing one way on every floor (the nest only burns in a steady beam; the gallery door only lets a shadow
//     through when it is dark). Pearl's lens gives the Shadow Dash. The Gloomwing waits in the Lamp Room.
//   The Shadow Spire (c_spire): black glass, six floors, everything at once. The creeping dark spreads over the floor
//     (it slows Ash and breeds moths, but it is shadow too: a Shadow Dash rides it), violet braziers turn gold with fire,
//     moonbeams drift, moon-wheels drain the Undercroft, shadow clones copy Ash, glass platforms drift over the void, the
//     Moon Stair is a climb up the outside wall in a gale, the Hollow Core is flown, Shadow Ash climbs out of a mirror,
//     the Last Stair crumbles, and Vesper waits on the roof.
// Everything is a wrapper or a registry entry; every name here starts with xb / XB (and d1b for debug).
// The how-to (letters, room fields, save keys, hooks, tests) is scratchpad/C1DUN_B.md. Simple words: S(full, simple).

// ---------- 0. ids, cell types, template letters
const XB={dun:{c_lighthouse:1,c_spire:1},force:null,climb:false,climbM:{ph:0,face:-Math.PI/2,alpha:1},slowK:1,tips:{},lastRoom:null,spr:null};
const xbIsDef=def=>!!(def&&XB.dun[dunRoot(def.id)]);
const xbArea=()=>(AREA&&AREA.xb)?AREA:null;
// two cell types of our own (ids 220 and 221, clear of e9a 13..27, p4_moon 60..69 and x1_dun_a 200..210)
const XTY={sheer:220,rip:221}; Object.assign(TY,{xb_sheer:220,xb_rip:221});
// Letters only these two dungeons use. xbR takes them out of a template before the engine reads it (each becomes a plain
// letter plus a mark of our own), so they never clash with another module's letters:
//   %  sheer face: a wall laid flat (only the Climbing Claws hold on; no fighting up there)
//   ;  ink: a deep drop (a chasm)              ?  ink with a shadow pool over it (a Shadow Dash started in shade rides it)
//   5  rip current (deep water: only a skim gets across; floor once the Undercroft drains)
//   G  oil drum   Q  violet brazier   C  small cocoon   E  fog horn   q  Pearl's Logbook page   M  moon-wheel
//   R  the clone room's start plate   U  a clone room plate   n  a ring of moonlight over the drop
const XB_CH={'%':{b:'.',typ:'sheer'},';':{b:':',ink:1},'?':{b:':',ink:1,shade:1},'5':{b:'w',typ:'rip'},
  G:{b:'.',o:'drum'},Q:{b:'.',o:'vbraz'},C:{b:'.',o:'cocoon'},E:{b:'.',o:'horn'},q:{b:'.',o:'page'},M:{b:'.',o:'wheel'},
  R:{b:'.',o:'cstart'},U:{b:'.',o:'cplate'},n:{b:':',o:'mring'}};
// A thing (o) on a ledge takes the ledge: three of its four neighbours raised ('{' or '=') puts it up there too.
function xbTpl(rows){ const tpl=[], marks=[], at=(c,r)=>(rows[r]||'')[c]||'#';
  rows.forEach((row,r)=>{ let s=''; for(let c=0;c<row.length;c++){ const ch=row[c], d=XB_CH[ch]; if(d){ let b=d.b;
      if(d.o){ for(const up of ['{','=']){ let n=0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(at(c+dx,r+dy)===up) n++; if(n>=3){ b=up; break; } } }
      s+=b; marks.push({ch,c,r}); } else s+=ch; } tpl.push(s); }); return {tpl,marks}; }
function xbR(o){ if(o.tpl){ const t=xbTpl(o.tpl); o.tpl=t.tpl; o.xbm=t.marks; } return o; }
const xbDiff=(e,n,h)=>typeof byDiff==='function'?byDiff(e,n,h):n;
const xbOL=()=>(typeof SBC!=='undefined'&&typeof LOOK!=='undefined'&&LOOK.sb)?SBC.outline:'#1a1010';
function xbSay(t,cb){ runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); saveGame(); }); }
function xbTip(id,title,text){ if(XB.tips[id]) return; XB.tips[id]=1; try{ mvTip(title,text,7,'xb_'+id); }catch(e){ setBanner(title,text,3); } }
const xbCtl=()=>{ try{ return p2Ctl(); }catch(e){ return {jump:'C',roll:'Space',use:'E',fire:'K',attack:'J'}; } };
const xbSkim=()=>{ const p=player; return !!(p&&p.sprinting&&typeof canSkim==='function'&&canSkim()); };

// ---------- 1. the looks: the lighthouse (white walls over red faces, warm planks, brass) and the Spire (black glass)
CAVE_STYLE.c_light={floor:'#c99c68',floor2:'#be915e',top:'#f8f2e6',face:'#c8463a',edge:'#fff6dc',water:'#2a6a8a',accent:'#ffd27a'};
CAVE_STYLE.c_shadow={floor:'#423a60',floor2:'#3b3458',top:'#6e6698',face:'#262040',edge:'#c8b2ff',water:'#1a1430',accent:'#b496ff'};
CAVE_DECOR.c_light='lamp'; CAVE_DECOR.c_shadow='crystal';
for(const th of ['c_light','c_shadow']){ const s=CAVE_STYLE[th];
  TPAL[th]={tile:[s.floor,s.floor2,s.floor,s.floor2],grout:'rgba(0,0,0,.25)',moss:hexRGB(s.accent).join(','),rune:hexRGB(s.edge).join(','),hole:'#060410',lip:[s.top,s.face],water:s.water,root:'#5a3e24',cave:true}; }
defineDungeonTheme('c_light',{music:'c_light'}); defineDungeonTheme('c_shadow',{music:'c_spire'});
Object.assign(PUZZLE_KINDS,{xbnest:1,xbsluice:1,xbclone:1,xbgal:1});
Object.assign(SEAL_KINDS,{xbnest:1,xbsluice:1,xbclone:1});

// ---------- 2. cells: our letters become cell types, ink, shadow pools and marks
{ const base=genCaveRooms; genCaveRooms=function(def){ const c=base.apply(this,arguments); if(xbIsDef(def)) xbCells(c,def); return c; }; }
function xbCells(c,def){
  const w=c.w; c.xb={ink:new Set(),shade:[],marks:[]};
  // the floor just inside every door stays plain floor (the engine clears it; we must not put a face back on it)
  const keep=new Set(); for(const L of c.links) for(const k of L.cells){ keep.add(k); for(const d of [1,-1,w,-w]) keep.add(k+d); }
  for(const rid in c.rooms){ const R=c.rooms[rid]; for(const m of R.xbm||[]){ const i=R.ox+1+m.c, j=R.oy+1+m.r, k=j*w+i, d=XB_CH[m.ch]; if(!d) continue;
    if(d.typ&&!keep.has(k)) c.typ[k]=XTY[d.typ];
    if(d.ink) c.xb.ink.add(k);
    if(d.shade) c.xb.shade.push(k);
    if(d.o) c.xb.marks.push({room:rid,o:d.o,i,j,k,c:m.c,r:m.r}); } }
}
// the rip is deep water until the Undercroft drains (water level 0); then it is floor
{ const base=dunWet; dunWet=function(k,t,T){ if(t===XTY.rip) return lvlOf(T)>=1; return base.apply(this,arguments); }; }
{ const base=dunGround; dunGround=function(k,t,T){ if(t===XTY.rip) return lvlOf(T)<1; return base.apply(this,arguments); }; }
// a sheer face is a wall for everyone, except Ash himself with the Climbing Claws
const xbSheerAt=(A,x,y)=>{ const c=A.cave, i=Math.floor((x-A.x0)/c.cell), j=Math.floor((y-A.y0)/c.cell); return i>=0&&j>=0&&i<c.w&&j<c.h&&c.typ[j*c.w+i]===XTY.sheer&&c.grid[j*c.w+i]===0; };
{ const base=areaBlocked; areaBlocked=function(x,y){ const A=AREA; if(A&&A.xb&&A.cave&&xbSheerAt(A,x,y)) return true; return base.apply(this,arguments); }; }
{ const base=playerBlocked; playerBlocked=function(x,y){ const A=AREA; if(A&&A.xb&&A.cave&&x>=IZX-50&&canClaws()&&xbSheerAt(A,x,y)){ const c=A.cave, k=Math.floor((y-A.y0)/c.cell)*c.w+Math.floor((x-A.x0)/c.cell); return !!(c.dyn&&caveBlockedAt(k)); } return base.apply(this,arguments); }; }
const xbOnSheer=(A,x,y)=>{ const k=tCell(x,y); return k>=0&&A.cave.typ[k]===XTY.sheer; };
// a drifting platform over the void is good ground to zip onto
{ const base=p2StandOK; p2StandOK=function(x,y,lvl){ const A=AREA; if(A&&A.xb&&A.dn&&A.dn.moverMap){ const k=tCell(x,y); if(k>=0&&A.dn.moverMap.has(k)) return !colAt(x,y,11); } return base.apply(this,arguments); }; }
// the creeping dark is shadow a Shadow Dash can ride
{ const base=p2ShadeAt; p2ShadeAt=function(x,y){ if(base(x,y)) return true; const A=AREA; if(A&&A.xb&&A.xb.dk){ const k=tCell(x,y); if(k>=0&&A.xb.dk[k]) return !p2LitAt(x,y); } return false; }; }
// flight in the Hollow Core (room field fly:true)
{ const base=canFlyHere; canFlyHere=function(){ const A=AREA; if(A&&A.xb&&G&&G.mode==='story'&&hasAbil('wings')){ const R=caveRoomAt(player.x,player.y); if(R&&R.fly) return true; } return base.apply(this,arguments); }; }
// a fall on a long climb puts Ash back on the last ledge he stood on in that room, not at its door (room field restFall)
{ const base=trialFall; trialFall=function(){ const A=AREA; if(A&&A.xb&&A.tri){ const R=caveRoomAt(player.x,player.y); if(R&&R.restFall&&A.tri.safe&&caveRoomAt(A.tri.safe.x,A.tri.safe.y)===R) A.tri.entry={x:A.tri.safe.x,y:A.tri.safe.y}; } return base.apply(this,arguments); }; }

// ---------- 3. building the rooms: objects from marks and room fields
{ const base=dunBuildRoom; dunBuildRoom=function(A,def,R,ms,P,spot,freeSpot,rng){ base.apply(this,arguments); if(xbIsDef(def)) xbBuildRoom(A,def,R,P,rng); }; }
function xbState(A){ return A.xb||(A.xb={objs:[],stand:[],rooms:[],lens:[],dk:null,dkRooms:[],moons:[],lanterns:[],watch:[],seals:[],posts:[],rings:[],t:0,sid:null}); }
function xbObj(A,o,stand){ o.xb=true; A.objs.push(o); xbState(A).objs.push(o); if(stand) A.xb.stand.push(o); return o; }
function xbBuildRoom(A,def,R,P,rng){
  const X=xbState(A), c=A.cave, cs=c.cell, SK=caveSid(def), RP=(cc,rr)=>P(R.ox+1+cc,R.oy+1+rr);
  X.rooms.push(R);
  // shadow pools over the ink
  if(c.xb) for(const k of c.xb.shade){ const i=k%c.w, j=(k-i)/c.w; if(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih) p2Cave(A).shade[k]=1; }
  for(const m of (c.xb?c.xb.marks:[])){ if(m.room!==R.id) continue; const p=P(m.i,m.j), id=`xb_${SK}_${R.id}_${m.o}${m.c}_${m.r}`;
    switch(m.o){
      case 'drum': { const o=xbObj(A,{k:'xb_drum',x:p.x,y:p.y,id,room:R.id,burnT:0,cd:0,heat:0,r:18},true); o.L={x:p.x,y:p.y-18,r:270,i:0,fire:true}; A.lights.push(o.L); o.col=addAreaCol({t:'c',x:p.x,y:p.y,r:14}); o.prompt=()=>S('Look at the oil drum','Look at the drum'); break; }
      case 'vbraz': { const o=xbObj(A,{k:'xb_vbraz',x:p.x,y:p.y,id,room:R.id,lit:false,litT:0,heat:0,r:16,group:(R.brazGroup&&R.brazGroup[`${m.c},${m.r}`])||'hall'},true); o.L={x:p.x,y:p.y-20,r:190,i:0.22,tint:'ember'}; A.lights.push(o.L); o.col=addAreaCol({t:'c',x:p.x,y:p.y,r:13}); o.prompt=()=>o.lit?null:S('Look at the violet brazier','Look at the brazier'); break; }
      case 'cocoon': { if(G.found[id]) break; const o=xbObj(A,{k:'xb_cocoon',x:p.x,y:p.y,id,room:R.id,heat:0,r:14,v:(m.c*7+m.r*3)%3},true); o.col=addAreaCol({t:'c',x:p.x,y:p.y,r:11}); break; }
      case 'horn': { const o=xbObj(A,{k:'xb_horn',x:p.x,y:p.y,id,room:R.id,cd:0,blowT:0,r:22},true); o.col=addAreaCol({t:'c',x:p.x,y:p.y,r:16}); o.prompt=()=>o.cd>0?S('The fog horn is still wheezing','The horn needs a rest'):S('Blow the fog horn','Blow the horn'); break; }
      case 'page': { if(G.found[id]) break; xbObj(A,{k:'xb_page',x:p.x,y:p.y,id,room:R.id,n:R.page||5}); A.lights.push({x:p.x,y:p.y,r:120,i:0.5}); break; }
      case 'wheel': { const o=xbObj(A,{k:'xb_wheel',x:p.x,y:p.y,id,room:R.id,turned:!!G.found[id],spin:0,r:20},true); o.col=addAreaCol({t:'c',x:p.x,y:p.y,r:15}); o.prompt=()=>o.turned?S('Look at the moon-wheel','Look at the wheel'):S('Turn the moon-wheel','Turn the wheel'); A.lights.push({x:p.x,y:p.y,r:150,i:0.35}); break; }
      case 'cstart': xbObj(A,{k:'xb_cstart',x:p.x,y:p.y,id,room:R.id}); break;
      case 'cplate': xbObj(A,{k:'xb_cplate',x:p.x,y:p.y,id,room:R.id,on:false}); break;
      case 'mring': { const o=xbObj(A,{k:'xb_mring',x:p.x,y:p.y,id,room:R.id,cd:0,ph:m.c*0.7+m.r},true); X.rings.push(o); A.lights.push({x:p.x,y:p.y,r:160,i:0.4}); break; }
    }
  }
  // room fields
  for(const pr of R.props||[]){ const [kind,cc,rr,o]=pr, p=RP(cc,rr), D=XB_PROP[kind]; if(!D) continue; if(D.when&&!D.when()) continue;
    const ob=xbObj(A,Object.assign({k:'xb_prop',kind,x:p.x,y:p.y,id:`xb_${SK}_${R.id}_p${cc}_${rr}`,room:R.id,r:D.r||18,v:(cc*7+rr*13)%4},o||{}),!D.flat);
    if(D.col){ const q=D.col; ob.col=addAreaCol(q.r?{t:'c',x:p.x+(q.dx||0),y:p.y+(q.dy||0),r:q.r}:{t:'r',x0:p.x-q.w/2,y0:p.y-q.h/2+(q.dy||0),x1:p.x+q.w/2,y1:p.y+q.h/2+(q.dy||0)}); }
    if(D.say) ob.prompt=()=>D.label||S('Look at it','Look at it');
    if(D.light) A.lights.push({x:p.x,y:p.y-(D.light.dy||0),r:D.light.r,i:D.light.i,fire:!!D.light.fire}); }
  // plain warm or pale light (room field xbLights:[[c,r,radius,intensity],...]): lanterns on a balcony, moonlight
  for(const q of R.xbLights||[]){ const p=RP(q[0],q[1]); A.lights.push({x:p.x,y:p.y,r:q[2]||220,i:q[3]!=null?q[3]:0.5}); }
  if(R.lens&&R.lens.slot){ const L=R.lens, s=RP(L.slot[0],L.slot[1]); const o={R,L,sx:s.x,sy:s.y,beam:null,lights:[0,1,2].map(()=>{ const q={x:s.x,y:s.y,r:150,i:0}; A.lights.push(q); return q; })}; X.lens.push(o); R._lens=o; }
  if(R.minilens){ const M=R.minilens, s=RP(M.at[0],M.at[1]); const o={R,L:{w:52,mini:true,per:M.per||5,a0:M.arc[0],a1:M.arc[1]},sx:s.x,sy:s.y-24,beam:null,lights:[0,1].map(()=>{ const q={x:s.x,y:s.y,r:130,i:0}; A.lights.push(q); return q; })}; X.lens.push(o); R._lens2=o; }
  if(R.slotBeam){ const S0=R.slotBeam, ci=R.ox+1+S0.at[0], cj=R.oy+1+S0.at[1], p=P(ci,cj); R._slot={kind:'xb_slot',x:p.x,y:p.y,ci,cj,k:cj*c.w+ci,dir:{n:0,e:1,s:2,w:3}[S0.dir],room:R.id,id:`xb_${SK}_${R.id}_slot`}; }
  for(const w of R.watch||[]){ const p=RP(w.at[0],w.at[1]); const o=xbObj(A,{k:'xb_watch',x:p.x,y:p.y,room:R.id,id:`xb_${SK}_${R.id}_w${w.at[0]}_${w.at[1]}`,a0:w.ang*Math.PI/180,sw:(w.swing||40)*Math.PI/180,per:w.per||5,ph:w.ph||0,len:(w.len||5)*cs,half:(w.half||24)*Math.PI/180,sus:0,ang:w.ang*Math.PI/180,blind:false},true); X.watch.push(o); A.lights.push(o.L={x:p.x,y:p.y,r:110,i:0.35}); }
  for(const mb of R.moon||[]){ const pts=mb.pts.map(q=>RP(q[0],q[1])); const o={room:R.id,pts,per:mb.per||6,ph:mb.ph||0,r:(mb.r||1.6)*cs,x:pts[0].x,y:pts[0].y}; o.L={x:o.x,y:o.y,r:o.r*1.6,i:0.45}; A.lights.push(o.L); X.moons.push(o); }
  (R.lanterns||[]).forEach((ln,n)=>{ const p=RP(ln.piv[0],ln.piv[1]), y0=RP(0,ln.span[0]).y, y1=RP(0,ln.span[1]).y; const o=xbObj(A,{k:'xb_lantern',px:p.x,py:p.y,x:p.x,y:p.y,y0,y1,amp:(ln.amp||1.5)*cs,per:ln.per||4,ph:ln.ph||0,room:R.id,id:`xb_${SK}_${R.id}_ln${n}`,hookAt:ln.hook?RP(ln.hook[0],ln.hook[1]):null,hooked:false,away:ln.away||0},true); o.hooked=!!G.found[o.id+'_h']; o.L={x:p.x,y:p.y,r:150,i:0.6,fire:true}; A.lights.push(o.L); X.lanterns.push(o); });
  if(R.nest){ const p=RP(R.nest[0],R.nest[1]); const o=xbObj(A,{k:'xb_nest',x:p.x,y:p.y,id:`xb_${SK}_${R.id}_nest`,room:R.id,heat:0,burnt:!!R.solved,r:46},true); if(!o.burnt) o.col=addAreaCol({t:'c',x:p.x,y:p.y,r:50}); o.prompt=()=>o.burnt?null:S('Look at the great cocoon','Look at the cocoon'); }
  if(R.mass){ const a=RP(R.mass.a[0],R.mass.a[1]), b=RP(R.mass.b[0],R.mass.b[1]); const o=xbObj(A,{k:'xb_mass',x0:a.x-cs/2,y0:a.y-cs/2,x1:b.x+cs/2,y1:b.y+cs/2,x:(a.x+b.x)/2,y:(a.y+b.y)/2,id:`xb_${SK}_${R.id}_mass`,room:R.id,burnT:R.solved?1:0,w:(b.x-a.x)+cs,h:(b.y-a.y)+cs},true); o.prompt=()=>R.solved?null:S('Look at the silk','Look at the silk'); }
  for(const lv of R.lensLevers||[]){ const p=RP(lv.at[0],lv.at[1]); const o=xbObj(A,{k:'xb_lever',x:p.x,y:p.y,dir:lv.dir,room:R.id,id:`xb_${SK}_${R.id}_lv${lv.dir}`,r:20,pull:0},true); addAreaCol({t:'c',x:p.x,y:p.y+2,r:10}); o.prompt=()=>xbLeverPrompt(A,o); }
  if(R.housing){ const p=RP(R.housing[0],R.housing[1]); xbObj(A,{k:'xb_housing',x:p.x,y:p.y,room:R.id,id:`xb_${SK}_${R.id}_housing`,r:70},true); addAreaCol({t:'c',x:p.x,y:p.y,r:52}); A.lights.push({x:p.x,y:p.y-40,r:300,i:0.6}); }
  if(R.greatLamp){ const p=RP(R.greatLamp[0],R.greatLamp[1]); const o=xbObj(A,{k:'xb_lamp',x:p.x,y:p.y,room:R.id,id:`xb_${SK}_${R.id}_lamp`,r:62},true); addAreaCol({t:'c',x:p.x,y:p.y,r:44}); o.L={x:p.x,y:p.y-60,r:420,i:0.3}; A.lights.push(o.L); o.prompt=()=>xbLampLit()?S('Look at the Great Lamp','Look at the lamp'):S('Relight the Great Lamp','Light the Great Lamp'); }
  if(R.gull){ const p=RP(R.gull[0],R.gull[1]); const o=xbObj(A,{k:'xb_gull',x:p.x,y:p.y,room:R.id,id:`xb_${SK}_${R.id}_gull`,r:24,t:0},true); addAreaCol({t:'c',x:p.x,y:p.y,r:14}); o.prompt=()=>S('Look at the gull','Look at the gull'); }
  if(R.book){ const p=RP(R.book[0],R.book[1]); const o=xbObj(A,{k:'xb_book',x:p.x,y:p.y,room:R.id,id:`xb_${SK}_${R.id}_book`,r:18}); o.prompt=()=>S('Look at the sketchbook','Look at the book'); }
  if(R.rail){ const a=RP(R.rail[0][0],R.rail[0][1]), b=RP(R.rail[1][0],R.rail[1][1]); xbObj(A,{k:'xb_rail',x:(a.x+b.x)/2,y:Math.max(a.y,b.y),ax:a.x,ay:a.y,bx:b.x,by:b.y,room:R.id,id:`xb_${SK}_${R.id}_rail`},true); }
  for(const cfg of [].concat(R.creep||[])) X.dkRooms.push({R,cfg,src:[],cells:[],timer:0,mothT:4});
}
// after the whole floor is built (e9a's stairs, movers and grapple posts exist): stair seals, drifting posts, the dark
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){ base.apply(this,arguments); if(xbIsDef(def)&&A.dn) xbAfterBuild(A,def); }; }
function xbAfterBuild(A,def){
  const X=xbState(A), dn=A.dn, c=A.cave, SK=caveSid(def);
  X.sid=SK; X.dk=new Uint8Array(c.w*c.h); X.dkHold=new Uint8Array(c.w*c.h); X.t=0; XB.lastRoom=null;
  // stair seals: the stairs of a sealed room are taken out of the stair list until the seal opens
  for(const R of X.rooms){ if(!R.seal) continue;
    for(const s of dn.stairs.slice()){ if(s.room!==R.id||(R.seal.dir&&s.dir!==R.seal.dir)) continue; const o=xbObj(A,{k:'xb_seal',x:s.x,y:s.y,stair:s,room:R.id,kind:R.seal.kind,gate:R.seal.room||null,id:`xbseal_${SK}_${R.id}`,open:false,melt:0,r:30},true);
      o.open=xbSealOpen(A,o); if(!o.open){ dn.stairs.splice(dn.stairs.indexOf(s),1); o.col=addAreaCol({t:'c',x:s.x,y:s.y,r:22}); } else o.melt=1;
      o.prompt=()=>o.open?null:o.kind==='boss'?(hasBKey(A)?S('Unlock the great stair with the Boss Key','Use the Boss Key'):S('Look at the great lock','Look at the lock')):o.kind==='cocoon'?S('Look at the silk on the stairs','Look at the stairs'):S('Look at the sealed stairs','Look at the stairs');
      X.seals.push(o); } }
  // drifting platforms carry grapple posts at their middles
  for(const R of X.rooms){ if(!R.movers||!R.posts) continue; const ms=dn.movers.filter(m=>m.room===R.id);
    ms.forEach((m,i)=>{ const o={k:'dgpost',x:m.x+m.w/2,y:m.y+m.h/2,id:`xb_${SK}_${R.id}_post${i}`,room:R.id,lvl:0,xbM:m}; dn.grapples.push(o); X.posts.push(o); }); }
  // the creeping dark: sources, the cells it may cover, and a head start
  for(const D of X.dkRooms){ const R=D.R, cf=D.cfg; D.src=(cf.src||[]).map(q=>(R.oy+1+q[1])*c.w+(R.ox+1+q[0])); D.rift=cf.mask==='rift';
    D.cleared=!D.rift&&!!G.found[`xbclr_${SK}_${R.id}`];
    const inR=(i,j)=>i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih;
    const ok=k=>{ const i=k%c.w, j=(k-i)/c.w; if(!inR(i,j)||c.grid[k]!==0||c.dyn[k]) return false; if(dn.stairs.some(s=>tCell(s.x,s.y)===k)) return false; return true; };
    const chasm=k=>c.typ[k]===TY.chasm;
    for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i; if(!ok(k)) continue;
      if(D.rift){ if(chasm(k)) D.cells.push(k); else if(tGround(k)&&[1,-1,c.w,-c.w].some(d=>chasm(k+d)&&inR((k+d)%c.w,Math.floor((k+d)/c.w)))) D.cells.push(k); }
      else if(tGround(k)&&!chasm(k)) D.cells.push(k); }
    D.cellSet=new Set(D.cells);
    if(!D.cleared){ const n=Math.round(D.cells.length*(cf.full!=null?cf.full:0.35)); for(let s=0;s<n;s++) if(!xbDarkGrow(A,D,true)) break; } }
  xbDarkHoldAll(A);
  for(const R of X.rooms) if(R.foeZone) xbFoeZone(A,R);
  // the stock trial shrine is Ember's flame; ours is Pearl's lens (its own art and words), and Ember's spirit stays away
  for(const o of A.objs) if(o.tobj==='shrine'){ o.prompt=()=>hasAbil('shadow')?S('Rest by Pearl\'s lens','Rest by the lens'):S('Look into Pearl\'s lens','Look into the lens'); }
  A.objs=A.objs.filter(o=>o.k!=='tspirit');
  // the silk drift over the Mirror Gallery's west door hides the stock sealed-door slab (the silk is the door)
  for(const R of X.rooms) if(R.mass){ const gs=A.gates.filter(g=>g.link&&g.type==='gate'&&g.gateRoom===R.id); A.objs=A.objs.filter(o=>!(o.k==='tdoor'&&gs.includes(o.ref))); }
}
function xbSealOpen(A,o){
  if(o.kind==='boss') return !!G.found[o.id];
  const R=A.rooms[o.gate]; return !!(R&&R.solved);
}
// foes of a fight room are kept to one part of it (the hall of the Hall of Moths, not across the rift)
function xbFoeZone(A,R){ const z=R.foeZone, cs=A.cave.cell, x0=R.x0+z[0]*cs, y0=R.y0+z[1]*cs, x1=R.x0+(z[2]+1)*cs, y1=R.y0+(z[3]+1)*cs;
  for(const e of R.enemies){ if(e.x>=x0&&e.x<=x1&&e.y>=y0&&e.y<=y1) continue; for(let t=0;t<40;t++){ const x=rand(x0+30,x1-30), y=rand(y0+30,y1-30), k=tCell(x,y); if(k>=0&&tGround(k)&&!colAt(x,y,16)){ e.x=e.homeX=x; e.y=e.homeY=y; break; } } } }

// ---------- 4. the lens of the Spinning Lighthouse
// One gold beam turns round the tower, one turn every 15 / 12 / 10 s (Easy / Normal / Hard). A room with a lens field
// {dir:'n'|'e'|'s'|'w', slot:[c,r], arc:[deg0,deg1], w, stopS} is lit while the lens points within 60 / 45 / 36 degrees
// of its dir (5 / 3 / 2 s a turn, as the bible says): the beam comes out of the slot and sweeps from arc[0] to arc[1],
// and the slot glows (lighting a curtain beside it). The Turner (room levers) stops the lens pointing one way on every
// floor (saved as G.found['xbl_'+dsid]); a stopped beam rests at stopS (-1..1, default 0) in the rooms it points at.
// A minilens {at:[c,r], arc:[deg0,deg1], per} is a small lens on a stand that sweeps on its own, Turner or not.
const XB_DIR={n:-Math.PI/2,e:0,s:Math.PI/2,w:Math.PI};
const XB_DNAME={n:S('north','north'),e:S('east','east'),s:S('south','south'),w:S('west','west')};
const xbLensKey=A=>'xbl_'+caveDsid(A.def);
function xbLensStop(A){ const v=A&&G.found[xbLensKey(A)]; return v&&XB_DIR[v]!=null?v:null; }
const xbLensPer=()=>xbDiff(15,12,10);
const xbLensWin=()=>xbDiff(60,45,36)*Math.PI/180;
function xbLensAng(A){ const st=xbLensStop(A); if(st) return XB_DIR[st]; return ((G.time||0)*TAU/xbLensPer())%TAU; }
function xbBeamS(A,R){
  if(XB.force&&R.id in XB.force) return XB.force[R.id];
  const L=R.lens; if(!L) return null; const st=xbLensStop(A);
  if(st) return st===L.dir?(L.stopS||0):null;
  const d=angDiff(XB_DIR[L.dir],xbLensAng(A)), h=xbLensWin(); if(Math.abs(d)>=h) return null; return d/h;
}
// where a beam from (x,y) at angle a ends: at the first wall, or where it leaves the room
function xbRay(A,R,x,y,a){
  const ux=Math.cos(a), uy=Math.sin(a), c=A.cave; let inside=false, lx=x, ly=y;
  for(let s=0;s<1800;s+=10){ const px=x+ux*s, py=y+uy*s, ins=px>R.x0&&px<R.x1&&py>R.y0&&py<R.y1;
    if(ins){ inside=true; const k=tCell(px,py); if(k<0) break; if(c.grid[k]===1&&c.typ[k]!==1) break; lx=px; ly=py; }
    else if(inside){ lx=px; ly=py; break; } }
  return [lx,ly];
}
function xbLensTick(A,dt){
  const X=A.xb, t=G.time;
  for(const o of X.lens){ const R=o.R, L=o.L; let s=null, a=0;
    if(L.mini){ const f=(1-Math.cos(t*TAU/L.per))/2; a=lerp(L.a0,L.a1,f)*Math.PI/180; s=0; }
    else { s=xbBeamS(A,R); if(s!=null){ const a0=L.arc[0]*Math.PI/180, a1=L.arc[1]*Math.PI/180; a=lerp(a0,a1,(s+1)/2); } }
    if(s==null){ o.beam=null; for(const q of o.lights) q.i=0; continue; }
    const e=xbRay(A,R,o.sx,o.sy,a), w=L.w||60, fade=L.mini?1:clamp((1-Math.abs(s))/0.18,0,1);
    o.beam={x0:o.sx,y0:o.sy,x1:e[0],y1:e[1],w,s,a,fade};
    p2ShineSeg(o.sx,o.sy,e[0],e[1],w); if(!L.mini) p2Shine(o.sx,o.sy,L.glow||90);
    o.lights.forEach((q,i)=>{ const f=(i+1)/(o.lights.length+0.4); q.x=lerp(o.sx,e[0],f); q.y=lerp(o.sy,e[1],f); q.i=0.6*fade; q.r=110+i*30; });
    // moths caught in the beam light up (full damage)
    for(const en of G.enemies){ if(en.dead||en.type!=='c_moth'||!en.inArea) continue; if(segD(en.x,en.y,o.sx,o.sy,e[0],e[1])<w*0.6){ if(!(en.litT>0)) ftext(en.x,en.y-30,S('Caught in the light!','Lit up!'),'#ffe6a0',11); en.litT=Math.max(en.litT||0,1.6); } }
  }
  // the lens housing spills light on one door of the Turner room while the lens turns, or points that way (room field spill)
  for(const R of X.rooms){ if(!R.spill) continue; const st=xbLensStop(A); R._spillOn=!st||st===R.spill.dir;
    const g=R._spillG||(R._spillG=A.gates.find(q=>q.link&&((q.link.a===R.id&&q.link.b===R.spill.to)||(q.link.b===R.id&&q.link.a===R.spill.to))));
    if(R._spillOn&&g) p2Shine(g.x,g.y,90); }
  // slot beams that feed the e9a mirrors (room field slotBeam, lit while the lens points at the room)
  const dn=A.dn;
  for(const R of X.rooms){ const sl=R._slot; if(!sl) continue; const on=xbBeamS(A,R)!=null, has=dn.emitters.includes(sl);
    if(on&&!has){ dn.emitters.push(sl); dunBeamTrace(A); }
    else if(!on&&has){ if(dn.beam) R._lastBeam=dn.beam.segs.map(pts=>pts.map(q=>({x:q.x,y:q.y}))); dn.emitters.splice(dn.emitters.indexOf(sl),1); dunBeamTrace(A); }
    if(on&&dn.beam) R._lastBeam=null; }
}
function xbLeverPrompt(A,o){ const st=xbLensStop(A); if(o.dir==='run') return st?S('Pull RUN: set the lens turning','Make the lens turn'):S('Look at the RUN lever','Look at the lever');
  return st===o.dir?S('Look at the stop lever','Look at the lever'):S(`Stop the lens pointing ${XB_DNAME[o.dir]}`,`Stop the lens: ${XB_DNAME[o.dir]}`); }
function xbLeverPull(A,o){
  const key=xbLensKey(A), st=xbLensStop(A); o.pull=1; SFX.play('block'); shake(3);
  if(o.dir==='run'){ if(!st){ xbSay(S('The RUN lever is already down. The lens is turning, ticking softly, round and round.','The lens is already turning.')); return; } delete G.found[key]; setBanner(S('The lens turns again','The lens turns again'),S('The beam sweeps round every floor of the tower.','The beam goes round again.'),2.6); }
  else { if(st===o.dir){ xbSay(S(`The lens is already stopped, pointing ${XB_DNAME[o.dir]}.`,`It already points ${XB_DNAME[o.dir]}.`)); return; } G.found[key]=o.dir; setBanner(S(`The lens stops: ${XB_DNAME[o.dir]}`,`The lens points ${XB_DNAME[o.dir]}`),S(`On every floor, the beam now holds still, pointing ${XB_DNAME[o.dir]}.`,`The beam stays still now.`),2.8); }
  jingle('secret','shrine'); saveGame();
}

// ---------- 5. climbing sheer faces, rip currents, the slow of the dark (Ash's own moves)
{ const base=updatePlayer; updatePlayer=function(dt,inp){
    const A=AREA, p=player; if(!A||!A.xb||!p||!G||p.dead||scene!=='play') return base(dt,inp);
    const busy=typeof P2!=='undefined'&&(P2.mv||P2.dash), onS=!busy&&!p.flying&&canClaws()&&xbOnSheer(A,p.x,p.y);
    XB.climb=onS;
    let q=inp; if(onS){ q=Object.assign({},inp,{attack:false,fire:false,jump:false,jumpHeld:false,roll:false,drink:false,sprint:false}); G.dashBuf=0; }
    const ox=p.x, oy=p.y; base(dt,q);
    if(!(typeof P2!=='undefined'&&(P2.mv||P2.dash))&&!p.flying){
      let k=1; if(onS) k=0.55; else if(XB.slowK<1&&!airborne()) k=XB.slowK;
      if(k<1){ p.x=ox+(p.x-ox)*k; p.y=oy+(p.y-oy)*k; }
      if(onS){ const mv=Math.hypot(p.x-ox,p.y-oy); XB.climbM.ph+=mv*0.12; if(mv>0.5&&Math.random()<dt*3&&typeof p2Snd==='function') p2Snd('grip',0.35);
        xbTip('sheer',S('A sheer face','A sheer face'),S('Your claws hold you on the wall. You cannot fight up here. When the wind howls, hide behind a stone rib.','Your claws hold on. Hide from the wind behind the ribs!')); } }
  }; }
{ const base=drawPlayer; drawPlayer=function(){
    const p=player; if(XB.climb&&AREA&&AREA.xb&&p&&!p.dead&&!(typeof P2!=='undefined'&&(P2.mv||P2.dash))){ const M=XB.climbM; M.face=-Math.PI/2; M.alpha=1;
      try{ if(typeof T3!=='undefined'&&T3.on&&typeof T3X!=='undefined'&&T3X.ash) p2Ash3D(p,'climb',M); else p2HeroClimb(p,M); return; }catch(e){} }
    return base(); }; }
function xbRipTick(A,dt){
  const p=player, c=A.cave, k=tCell(p.x,p.y); if(k<0||c.typ[k]!==XTY.rip||!tWet(k)) return;
  if(airborne()||p.flying||(typeof P2!=='undefined'&&(P2.mv||P2.dash))) return;
  if(xbSkim()){ if(Math.random()<dt*14) G.ripples.push({x:p.x+rand(-8,8),y:p.y+6,t:0,max:0.5,r:12,splash:true}); return; }
  const T=A.tri, s=(T&&T.safe)||A.spawn; G.ripples.push({x:p.x,y:p.y,t:0,max:0.9,r:26,splash:true}); emit(p.x,p.y,18,{col:'190,220,255',glow:false,ang:-Math.PI/2,spread:1.4,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4});
  SFX.play('pop'); try{ mvSnd('splash',0.8); }catch(e){}
  p.x=s.x; p.y=s.y; p.kvx=p.kvy=0; p.iframes=Math.max(p.iframes,0.6); if(T){ T.lx=p.x; T.ly=p.y; }
  ftext(p.x,p.y-34,canSkim()?S('WHOOSH! Sprint across and don\'t stop!','WHOOSH! Run and don\'t stop!'):S('WHOOSH! The rip throws you back.','WHOOSH! Thrown back!'),'#cfe8ff',14);
  xbTip('rip',S('A rip current','A rip current'),canSkim()?S('Only a skimmer gets across. Sprint over the water and keep going.','Sprint across the water!'):S('The current is too strong to wade. Go the long way round, by the ledge.','Too strong. Go round by the ledge.'));
}

// ---------- 6. the creeping dark (the Spire): spreads one cell at a time, slows Ash, breeds moths, counts as shadow
// room field creep:{src:[[c,r],...], full:0..1 (head start), rate:[easy,normal,hard] (s per cell), mask:'rift', moths}
// A rift dark only covers the drop in its room and the floor at its lips: a bridge for a Shadow Dash to ride.
// A gold violet brazier pushes the dark back 4 cells and holds it for as long as it burns; every brazier of the
// room's 'hall' group gold at once clears the room's floor for good (a rift keeps bleeding dark).
function xbDarkNear(A,k){ const X=A.xb, w=A.cave.w; return X.dk[k-1]||X.dk[k+1]||X.dk[k-w]||X.dk[k+w]; }
function xbDarkGrow(A,D,quiet){
  const X=A.xb, w=A.cave.w, R=D.R; if(D.cleared) return false;
  const front=[];
  for(const k of D.cells){ if(X.dk[k]||X.dkHold[k]) continue; if(xbDarkNear(A,k)||D.src.some(q=>q===k||q===k-1||q===k+1||q===k-w||q===k+w)) front.push(k); }
  if(!front.length) return false;
  const k=front[Math.floor(Math.random()*front.length)]; X.dk[k]=1;
  if(!quiet&&A.curRoom===R&&Math.random()<0.4){ const q=tPos(k); emit(q.x,q.y,3,{col:'70,40,110',glow:false,smin:5,smax:25,lmin:.6,lmax:1.1,zmin:0.8,zmax:1.4,drag:1}); }
  return true;
}
function xbDarkHoldAll(A){ const X=A.xb, c=A.cave, cs=c.cell; X.dkHold.fill(0);
  for(const o of X.objs){ if(o.k!=='xb_vbraz'||!o.lit) continue; const i0=Math.floor((o.x-A.x0)/cs), j0=Math.floor((o.y-A.y0)/cs);
    for(let j=j0-4;j<=j0+4;j++) for(let i=i0-4;i<=i0+4;i++){ if(i<0||j<0||i>=c.w||j>=c.h) continue; if((i-i0)**2+(j-j0)**2>17) continue; const k=j*c.w+i; X.dkHold[k]=1; if(X.dk[k]){ X.dk[k]=0; if(Math.random()<0.3){ const q=tPos(k); emit(q.x,q.y,2,{col:'150,110,220',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1,zmax:2}); } } } } }
function xbDarkTick(A,dt){
  const X=A.xb, p=player, c=A.cave;
  for(const D of X.dkRooms){ const R=D.R;
    if(D.cleared) continue;
    const rate=D.cfg.rate?xbDiff(...D.cfg.rate):xbDiff(2.5,1.5,1.0);
    D.timer+=dt; let n=0; while(D.timer>=rate&&n++<20){ D.timer-=rate; xbDarkGrow(A,D,false); }
    // moths crawl out of deep patches (at most 4, Easy 2) every 8 s, only while Ash is in the room
    if(A.curRoom===R&&!G.fightIntro&&!D.rift){ D.mothT-=dt; if(D.mothT<=0){ D.mothT=8;
      const alive=G.enemies.filter(e=>!e.dead&&e.xbDark===R.id).length, cap=D.cfg.moths!=null?D.cfg.moths:xbDiff(2,4,4);
      if(alive<cap){ const deep=D.cells.filter(k=>X.dk[k]&&X.dk[k-1]+X.dk[k+1]+X.dk[k-c.w]+X.dk[k+c.w]>=3&&dist(tPos(k).x,tPos(k).y,p.x,p.y)>170);
        if(deep.length>=2){ const k=deep[Math.floor(Math.random()*deep.length)], q=tPos(k); const m=makeEnemy('c_moth',q.x,q.y,{level:A.def.level,aggro:true,swarm:true,homeX:q.x,homeY:q.y,leash:900});
          m.inArea=true; m.room=R.id; m.xbDark=R.id; m.spawnIn=0.4; if(R.mothFree) m.noClip=true; emit(q.x,q.y,16,{col:'60,30,100',glow:false,ang:-Math.PI/2,spread:0.7,smin:20,smax:90,lmin:.4,lmax:.8,zmin:1.5,zmax:3,grow:4}); } } } }
  }
  // standing in it: slow and cold
  const k=tCell(p.x,p.y); XB.slowK=(k>=0&&X.dk[k]&&!p2LitAt(p.x,p.y))?xbDiff(0.8,0.7,0.65):1;
  if(XB.slowK<1){ if(Math.random()<dt*6) emit(p.x+rand(-10,10),p.y+4,1,{col:'90,50,140',glow:false,ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.4,lmax:.8,zmin:1,zmax:2,alpha:0.7});
    xbTip('dark',S('The creeping dark','The creeping dark'),S('It slows you down and moths crawl out of it. Breathe fire on a violet brazier to push it back. But it is shadow too: a Shadow Dash started in it rides it.','It slows you. Light a brazier! Or dash in it to ride it.')); }
}

// ---------- 7. violet braziers, moonbeams, oil drums, cocoons, fog horns, pages, moon-wheels, moonlight rings, lanterns
function xbBrazLight(A,o){
  if(o.lit){ o.litT=xbDiff(26,20,16); return; }
  o.lit=true; o.litT=xbDiff(26,20,16); o.heat=0; SFX.play('shrine'); ftext(o.x,o.y-54,S('Gold light!','Gold light!'),'#ffe066',13);
  emit(o.x,o.y-30,24,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:30,smax:140,lmin:.4,lmax:.8,zmin:2,zmax:5,grow:5});
  xbDarkHoldAll(A);
  // every hall brazier of the room gold at once: the room's floor stays clear for good
  const R=A.rooms[o.room], hall=A.xb.objs.filter(q=>q.k==='xb_vbraz'&&q.room===o.room&&q.group==='hall');
  if(R&&hall.length&&hall.every(q=>q.lit)){ const D=A.xb.dkRooms.find(d=>d.R===R&&!d.rift);
    if(D&&!D.cleared){ D.cleared=true; G.found[`xbclr_${A.xb.sid}_${R.id}`]=1; for(const k of D.cells) A.xb.dk[k]=0; jingle('secret','shrine'); setBanner(S('The dark is gone!','The dark is gone!'),S('Every brazier burns gold. This floor stays clear for good.','This floor stays clear now.'),2.8); saveGame(); } }
}
function xbObjTick(A,dt){
  const X=A.xb, p=player, t=G.time;
  for(const o of X.objs){
    switch(o.k){
      case 'xb_vbraz':
        if(o.lit){ o.litT-=dt; p2Shine(o.x,o.y,150); if(o.litT<=0){ o.lit=false; ftext(o.x,o.y-54,S('The brazier goes cold.','It goes cold.'),'#c8b8e8',11); xbDarkHoldAll(A); } }
        else if(inBreath(o.x,o.y-14,18)){ o.heat+=dt; if(o.heat>0.3) xbBrazLight(A,o); } else o.heat=Math.max(0,o.heat-dt);
        o.L.i=o.lit?0.85:0.22; break;
      case 'xb_drum':
        if(o.burnT>0){ o.burnT-=dt; p2Shine(o.x,o.y-10,175); o.L.i=0.9; if(Math.random()<dt*30) emit(o.x+rand(-10,10),o.y-26,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:30,smax:90,lmin:.3,lmax:.7,zmin:3,zmax:6,grow:5});
          o.hurtT=(o.hurtT||0)-dt; if(dist(p.x,p.y,o.x,o.y)<44&&o.hurtT<=0&&!airborne()){ o.hurtT=0.7; if(hurtPlayer(p.maxHp*0.04,o.x,o.y,160)) ftext(p.x,p.y-36,S('Hot!','Hot!'),'#ffb070',13); }
          if(o.burnT<=0){ o.cd=6; emit(o.x,o.y-20,14,{col:'110,100,100',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:50,lmin:.7,lmax:1.2,zmin:3,zmax:6,grow:8}); } }
        else { o.L.i=o.cd>0?0.1:0; if(o.cd>0) o.cd-=dt; else if(inBreath(o.x,o.y-10,20)){ o.heat+=dt; if(o.heat>0.2) xbDrumLight(o); } else o.heat=0; }
        break;
      case 'xb_cocoon': if(o.dead) break;
        if(inBreath(o.x,o.y-10,16)) o.heat+=dt*3; else if(p2LitAt(o.x,o.y,6)) o.heat+=dt*0.35; else o.heat=Math.max(0,o.heat-dt*0.2);
        if(o.heat>0.9) xbCocoonBurn(A,o); else if(o.heat>0.25&&Math.random()<dt*8) emit(o.x+rand(-6,6),o.y-18,1,{col:'120,110,110',glow:false,ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.6,lmax:1,zmin:2,zmax:4,grow:6});
        break;
      case 'xb_horn': if(o.cd>0) o.cd-=dt; if(o.blowT>0){ o.blowT-=dt; const R=A.rooms[o.room]; p2Shine(R.cx,R.cy,Math.max(R.x1-R.x0,R.y1-R.y0));
          for(const e of G.enemies){ if(e.dead||!e.inArea||e.room!==o.room||e.type!=='c_moth') continue; const a=angTo(o.x,o.y,e.x,e.y); e.x+=Math.cos(a)*90*dt; e.y+=Math.sin(a)*90*dt; e.litT=Math.max(e.litT||0,1); } } break;
      case 'xb_page': if(!G.found[o.id]&&dist(p.x,p.y,o.x,o.y)<36&&!airborne()){ G.found[o.id]=true; o.dead=true; let got=false; try{ if(typeof cPearlPage==='function') got=cPearlPage(o.n); }catch(e){ console.error(e); }
          if(!got&&typeof cPearlPage!=='function'){ giveItems({['c_page'+o.n]:1},true); setBanner(S(`Pearl's Logbook, page ${o.n}`,`Pearl's page ${o.n}`),'',2.4); } saveGame(); } break;
      case 'xb_wheel': if(o.spin>0) o.spin=Math.max(0,o.spin-dt*0.6); break;
      case 'xb_mring': if(o.cd>0) o.cd-=dt; else if(p.flying&&dist(p.x,p.y,o.x,o.y)<50){ o.cd=1.2; p.flyE=flyMax(); SFX.play('shrine',0.6); emit(o.x,o.y-30,18,{col:'220,230,255',smin:30,smax:120,lmin:.3,lmax:.7,zmin:2,zmax:4}); ftext(p.x,p.y-(p.z||0)-40,S('Moonlight! Wings refreshed.','Wings full!'),'#e6f0ff',12); } break;
      case 'xb_lever': if(o.pull>0) o.pull=Math.max(0,o.pull-dt*1.5); break;
      case 'xb_gull': o.t=(o.t||0)+dt; break;
    }
  }
  // moonbeams drift with the clouds; in them there is no shadow to ride, and the moths there come to rest
  for(const m of X.moons){ const f=(1-Math.cos((t/m.per+m.ph)*TAU))/2, n=m.pts.length-1, u=f*n, i=Math.min(n-1,Math.floor(u)), a=m.pts[i], b=m.pts[i+1]||a;
    m.x=lerp(a.x,b.x,u-i); m.y=lerp(a.y,b.y,u-i); m.L.x=m.x; m.L.y=m.y; p2Shine(m.x,m.y,m.r);
    for(const e of G.enemies){ if(e.dead||!e.inArea||e.type!=='c_moth'||e.room!==m.room) continue; if(dist(e.x,e.y,m.x,m.y)<m.r) e.cd=Math.max(e.cd||0,0.4); } }
  // lanterns on chains swing across the Shadow Gallery; a Wing-rang hit on an alcove switch hooks one aside for good
  for(const o of X.lanterns){
    if(!o.hooked&&o.hookAt){ const sw=A.objs.find(q=>q.k==='tswitch'&&Math.abs(q.x-o.hookAt.x)<2&&Math.abs(q.y-o.hookAt.y)<2); if(sw&&sw.on){ o.hooked=true; G.found[o.id+'_h']=1; SFX.play('block'); jingle('secret','shrine'); setBanner(S('Clunk! The lantern is hooked aside.','The lantern swings away!'),S('Its light stays off the bars now.','Its light is gone from the bars.'),2.4); saveGame(); } }
    const x=o.hooked?o.px+o.away*A.cave.cell:o.px+o.amp*Math.sin((t/o.per+o.ph)*TAU); o.x=x; o.L.x=x; o.L.y=(o.y0+o.y1)/2;
    if(!o.hooked) p2ShineSeg(x,o.y0,x,o.y1,96); o.L.i=o.hooked?0.15:0.6; }
}
function xbDrumLight(o){ o.burnT=8; o.heat=0; SFX.play('boom',0.6); shake(2); emit(o.x,o.y-20,26,{kind:'fire',ang:-Math.PI/2,spread:0.9,smin:40,smax:180,lmin:.4,lmax:.9,zmin:3,zmax:7,grow:8}); ftext(o.x,o.y-50,S('WHOOMPH! A bright light!','WHOOMPH!'),'#ffd27a',14); xbTip('drum',S('Oil drums','Oil drums'),S('A burning drum is a bright light for 8 seconds. Moths hate bright light. Do not stand too close!','A burning drum is bright. Not too close!')); }
function xbCocoonBurn(A,o){ o.dead=true; G.found[o.id]=true; if(o.col){ removeCol(o.col); o.col=null; } SFX.play('pop'); emit(o.x,o.y-12,18,{kind:'fire',ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:5}); A.objs=A.objs.filter(q=>q!==o); A.xb.stand=A.xb.stand.filter(q=>q!==o); A.xb.objs=A.xb.objs.filter(q=>q!==o); }
// fire arrows (and anything else that burns) light drums, braziers and cocoons from afar
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){ const A=AREA;
    // the Hollow Core's eyes are high on the walls: only an arrow loosed in flight reaches them
    if(A&&A.xb&&src==='arrow'&&!player.flying){ for(const o of A.objs){ if(o.k!=='teye'||o.lit) continue; const R=A.rooms[o.room]; if(!R||!R.eyesHigh) continue; if(dist(x,y,o.x,o.y)<(r||8)+o.r){ if(!(o.nope>G.time)){ o.nope=G.time+1.2; ftext(o.x,o.y-30,S('Too high! Shoot it from the air.','Too high! Fly up!'),'#e6dcff',12); } return true; } } }
    let hit=base.apply(this,arguments); if(!A||!A.xb||src!=='fire') return hit; r=r||8;
    for(const o of A.xb.objs.slice()){ if(o.dead) continue;
      if(o.k==='xb_drum'&&!(o.burnT>0)&&!(o.cd>0)&&dist(x,y,o.x,o.y)<r+20){ xbDrumLight(o); hit=true; }
      else if(o.k==='xb_vbraz'&&!o.lit&&dist(x,y,o.x,o.y)<r+20){ xbBrazLight(A,o); hit=true; }
      else if(o.k==='xb_cocoon'&&dist(x,y,o.x,o.y)<r+16){ xbCocoonBurn(A,o); hit=true; } }
    return hit; }; }
// the E button on these things
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.xb&&AREA&&AREA.xb){ xbAct(AREA,o); return; } return base.apply(this,arguments); }; }
function xbAct(A,o){
  switch(o.k){
    case 'xb_drum': xbSay(o.burnT>0?S('The drum roars with flame. Too hot to touch!','It is burning! Too hot!'):o.cd>0?S('The drum is still smoking. Give it a moment.','It is still smoking.'):S('A drum of old lamp oil. Fire would make it burn bright for a while. Very bright. Very hot.','Lamp oil. Fire makes it burn bright!')); return;
    case 'xb_vbraz': xbSay(S('A brazier of violet fire that gives off no heat at all. It looks cold. Maybe your fire burns warmer.','Cold violet fire. Your fire is warmer!')); return;
    case 'xb_horn': if(o.cd>0){ xbSay(S('The old horn wheezes. It needs a moment to fill up again.','It needs a rest.')); return; }
      o.cd=xbDiff(8,10,11); o.blowT=xbDiff(6.5,5,4.5); xbHorn(); shake(6); flashA=0.15; flashCol='230,240,255'; setBanner(S('BWAAAAAMP!','BWAAAMP!'),S('Every moth curtain in the room shrivels! Run!','The moths shrink! Run!'),2.2); return;
    case 'xb_wheel': xbWheel(A,o); return;
    case 'xb_lever': xbLeverPull(A,o); return;
    case 'xb_seal': if(o.open) return; if(o.kind==='boss'){ if(hasBKey(A)){ G.found[o.id]=1; xbSealOpenNow(A,o); jingle('secret','chest'); setBanner(S('The great stair is open','The stair is open'),S('Something enormous is waiting above.','Something big waits above.'),2.4); saveGame(); } else xbSay(S('An iron grate covers the stairs, with a lock shaped like a flame. The Boss Key for it is hidden somewhere in here. Look for a big chest.','A big lock on the stairs. Find the Boss Key!')); return; }
      xbSay(o.kind==='cocoon'?S('Thick grey silk is wound right over the stairs. Somebody big spun this. It is far too thick to burn. Maybe it unwinds if she is gone.','Thick silk on the stairs. The big moth made it.'):S('The stairs are sealed with cold violet light. They will open when this room is safe.','Sealed. Make this room safe first.')); return;
    case 'xb_nest': xbSay(S('A great cocoon, thick as a mattress, wrapped round something that glints. Your fire just slides off it. It would take a huge, steady light to burn this.','A huge cocoon. Fire slides off. It needs a big, steady light.')); return;
    case 'xb_mass': xbSay(S('Grey silk is piled in front of the west door like a snowdrift. A strong beam of light might burn it away.','Silk blocks the door. A beam of light could burn it.')); return;
    case 'xb_lamp': xbLampAct(A,o); return;
    case 'xb_gull': xbSay(o.gullHi?S('The gull is still sitting on its forty spoons. It is not sharing.','The gull will not share its spoons.'):S('A fat gull sits on a pile of spoons. Forty spoons. It glares at you as if YOU are the one who steals things.','A gull on forty spoons. It glares at you.'),()=>{ o.gullHi=1; }); return;
    case 'xb_book': if(typeof c1Play==='function'&&STORY.c_spire_sketch) c1Play('c_spire_sketch'); else xbSay(S('A sketchbook full of drawings of an old woman, stilt houses and a horned kid in a scarf.','A sketchbook. Lots of drawings.')); return;
    case 'xb_prop': { const D=XB_PROP[o.kind]; if(D&&D.say) xbSay(typeof D.say==='function'?D.say(o):D.say); return; }
  }
}
function xbHorn(){ try{ const ac=SFX.ac; if(!ac||SFX.muted) return; const t0=ac.currentTime, g=ac.createGain(); g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(0.3,t0+0.12); g.gain.setValueAtTime(0.3,t0+1.2); g.gain.exponentialRampToValueAtTime(0.0008,t0+2.2); g.connect(ac.destination);
    const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=520; f.Q.value=2; f.connect(g);
    for(const [fr,ty] of [[73,'sawtooth'],[110,'square'],[146,'sawtooth']]){ const o=ac.createOscillator(); o.type=ty; o.frequency.setValueAtTime(fr*0.9,t0); o.frequency.linearRampToValueAtTime(fr,t0+0.25); o.connect(f); o.start(t0); o.stop(t0+2.3); } }catch(e){} }
function xbWheel(A,o){
  if(o.turned){ xbSay(S('The moon-wheel is turned all the way round. Water gurgles somewhere far below.','The wheel is turned.')); return; }
  o.turned=true; G.found[o.id]=1; o.spin=1; SFX.play('block'); SFX.play('roll'); shake(4);
  const T=A.tri, L=Math.max(0,lvlOf(T)-1); dunSetLevel(L,o);
  const R=A.rooms[o.room], all=A.xb.objs.filter(q=>q.k==='xb_wheel'&&q.room===o.room);
  // the moths in the sluice do not like the noise
  if(R&&R.wheelMoths) for(let i=0;i<xbDiff(1,2,3);i++){ const s=spotNear(o.x,o.y,120,260); const m=makeEnemy('c_moth',s.x,s.y,{level:A.def.level,aggro:true,swarm:true,homeX:s.x,homeY:s.y,leash:900}); m.inArea=true; m.room=R.id; m.spawnIn=0.5+i*0.2; }
  if(R&&!R.solved&&all.every(q=>q.turned)) later(1.2,()=>{ if(AREA===A&&!R.solved){ solveRoom(R,true); jingle('secret','shrine'); setBanner(S('The Undercroft drains!','The water drains away!'),S('The sluice gates groan open. The way east is clear.','The way east is open!'),3); } });
  saveGame();
}
function xbSealOpenNow(A,o){ if(o.open) return; o.open=true; o.melt=0.001; if(o.col){ removeCol(o.col); o.col=null; } const dn=A.dn; if(!dn.stairs.includes(o.stair)) dn.stairs.push(o.stair);
  const p=player; if(dist(p.x,p.y,o.stair.x,o.stair.y)<60){ dn.stairGrace=1; dn.graceAt={x:o.stair.x,y:o.stair.y}; }
  emit(o.x,o.y-10,30,{col:o.kind==='boss'?'255,200,110':'230,225,240',smin:30,smax:150,lmin:.4,lmax:.9,zmin:1.5,zmax:3.5}); SFX.play(o.kind==='boss'?'chest':'pop'); }
const xbLampLit=()=>(typeof trialDone==='function'&&trialDone('c_lighthouse'))||!!(G.flags&&(G.flags.c_light_done||G.flags.c_spire_up));
function xbLampAct(A,o){
  if(xbLampLit()){ xbSay(S('The Great Lamp burns gold and steady. Its lens turns round and round, and the beam sweeps out over the sea.','The Great Lamp is lit. Its beam sweeps the sea.')); return; }
  // the lamp is the altar (bible 5: coins 40 + 10 x level, XP 120 + 40 x level, as the Trials; the dungeon's Heart Ember is in the Fog Horn room)
  const lv=A.def.level||12; G.flags.trial_c_lighthouse_done=true;
  addCoins(40+lv*10,o.x,o.y); gainXp(120+lv*40); try{ giveSkillPoint(1); }catch(e){}
  jingle('complete','upgrade'); flashA=0.6; flashCol='255,226,150'; shake(6);
  for(let i=0;i<5;i++) later(i*0.18,()=>emit(o.x+rand(-60,60),o.y-60+rand(-40,40),24,{col:'255,214,110',ang:-Math.PI/2,spread:1.4,smin:60,smax:260,lmin:.6,lmax:1.3,zmin:2,zmax:4,rise:30}));
  setBanner(S('The Spinning Lighthouse!','The Spinning Lighthouse!'),S(`+${40+lv*10} coins  ·  +1 skill point`,`+${40+lv*10} coins, +1 skill point`),3.6);
  questPoke(); saveGame();
  if(typeof c1Beat==='function') later(0.6,()=>c1Beat('light_lit'));
}

// ---------- 8. Watcher moths (the Watch Room): slow cones of pale light; stay out of them, or cross them as a shadow
// room field watch:[{at:[c,r], ang:deg (where it looks), swing:deg, per:s, len:cells, half:deg}]
// In a cone for 1 s (Easy 2): a shriek, dusk moths come, the room's lever jams for 10 s. A Shadow Dash or a ride is never
// seen, nor is Ash standing in a shadow pool. While the lighthouse beam is in the room the Watchers are blinded.
function xbWatchSees(A,o,p){
  if(p.dead||o.blind||(typeof p2Shadowed==='function'&&p2Shadowed())) return false;
  const k=tCell(p.x,p.y); if(k>=0&&A.p2&&A.p2.shade[k]&&!p2LitAt(p.x,p.y)) return false;
  const d=dist(o.x,o.y,p.x,p.y); if(d>o.len) return false; if(Math.abs(angDiff(o.ang,angTo(o.x,o.y,p.x,p.y)))>o.half) return false;
  return typeof dunSees==='function'?dunSees(A,o.x,o.y,p.x,p.y):true;
}
function xbWatchTick(A,dt){
  const X=A.xb, p=player, t=G.time;
  for(const o of X.watch){ const R=A.rooms[o.room];
    o.ang=o.a0+o.sw*Math.sin((t/o.per+o.ph)*TAU);
    o.blind=xbBeamS(A,R)!=null;
    if(R._alarmT>0) R._alarmT-=dt/X.watch.filter(q=>q.room===o.room).length;
    const here=A.curRoom===R&&scene==='play'&&!R.solved;
    const see=here&&!(R._alarmT>0)&&xbWatchSees(A,o,p);
    const need=xbDiff(2,1,0.8);
    o.sus=clamp(o.sus+(see?dt/need:-dt*0.7),0,1); o.see=see;
    if(o.sus>=1&&!(R._alarmT>0)) xbAlarm(A,R,o);
  }
}
function xbAlarm(A,R,o){
  R._alarmT=10; for(const q of A.xb.watch) if(q.room===R.id) q.sus=0;
  SFX.play('warn'); shake(5); flashA=0.18; flashCol='230,220,255'; ftext(o.x,o.y-50,S('SHRIEK!','SHRIEK!'),'#efe6ff',18);
  setBanner(S('The Watchers shriek!','The Watchers shriek!'),S('Moths swarm in, and the lever jams for a while. Keep to the shadows!','Moths come! Keep to the shadows!'),2.6);
  for(let i=0;i<xbDiff(3,4,5);i++){ const s=spotNear(o.x,o.y,40,120); const m=makeEnemy('c_moth',s.x,s.y,{level:A.def.level,aggro:true,swarm:true,homeX:o.x,homeY:o.y,leash:900}); m.inArea=true; m.room=R.id; m.spawnIn=0.3+i*0.15; }
}
// the lever of a watched room jams while the alarm lasts
{ const base=caveObjAct; caveObjAct=function(o){ const A=AREA; if(A&&A.xb&&o&&o.k==='lever'&&!o.on){ const R=A.rooms[o.room]; if(R&&R._alarmT>0){ xbSay(S('The lever will not budge. Moth dust is jammed in it. Wait for the Watchers to calm down.','It is jammed. Wait a bit.')); return true; } } return base.apply(this,arguments); }; }

// ---------- 9. the nest cocoon (the Moth Nest): only a long, steady light burns it (the lens stopped pointing at it)
function xbNestTick(A,dt){
  for(const o of A.xb.objs){ if(o.k!=='xb_nest'||o.burnt) continue; const R=A.rooms[o.room];
    const lit=p2LitAt(o.x,o.y,o.r*0.4), need=xbDiff(3.5,4,4.5);
    o.heat=lit?o.heat+dt:Math.max(0,o.heat-dt*1.2);
    if(lit&&Math.random()<dt*14) emit(o.x+rand(-30,30),o.y-rand(10,60),1,{col:'150,140,140',glow:false,ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.6,lmax:1.1,zmin:2,zmax:5,grow:6});
    if(lit&&o.heat>0.8) xbTip('nest',S('It smoulders!','It smoulders!'),S('The silk only burns in a long, steady light. A beam that keeps still would do it.','It needs light that stays still.'));
    if(o.heat>=need){ o.burnt=true; if(o.col){ removeCol(o.col); o.col=null; } SFX.play('boom'); shake(8); flashA=0.35; flashCol='255,220,150';
      emit(o.x,o.y-30,60,{kind:'fire',ang:-Math.PI/2,spread:1.6,smin:40,smax:240,lmin:.5,lmax:1.2,zmin:2,zmax:6,grow:8});
      for(let i=0;i<6;i++){ const s=spotNear(o.x,o.y,50,150); const m=makeEnemy('c_moth',s.x,s.y,{level:A.def.level,aggro:true,swarm:true,homeX:o.x,homeY:o.y,leash:900}); m.inArea=true; m.room=o.room; m.spawnIn=0.3+i*0.12; m.litT=3; }
      if(R&&!R.solved) solveRoom(R,true);
      setBanner(S('The great cocoon burns away!','The cocoon burns!'),S('Six moths tumble out, dazzled. Fight them in the light!','Moths! Fight them in the light!'),2.8); saveGame(); } }
}

// ---------- 10. the clone room: two shadow copies of Ash, one mirrored left-right, one up-down
// marks R (the start plate) and U (three plates). Step on R: the shadows climb out of the floor. Get all three of you onto
// the three plates at once. Each shadow is stopped by walls and pillars on its own: that is the trick. Back on R: again.
function xbCloneTick(A,dt){
  const X=A.xb; for(const R of X.rooms){ if(R.kind!=='xbclone') continue;
    const st=X.objs.find(o=>o.k==='xb_cstart'&&o.room===R.id), plates=X.objs.filter(o=>o.k==='xb_cplate'&&o.room===R.id); if(!st) continue;
    const p=player, C=R._cl||(R._cl={on:false,c1:{x:0,y:0},c2:{x:0,y:0},lx:0,ly:0,off:true,a:0});
    if(R.solved){ C.a=Math.max(0,C.a-dt*1.5); for(const q of plates) q.on=true; continue; }
    const inR=A.curRoom===R&&caveInterior(R,p.x,p.y);
    if(!inR){ if(C.on){ C.on=false; C.a=0; } continue; }
    const onSt=dist(p.x,p.y,st.x,st.y)<24;
    if(onSt&&(!C.on||C.off)){ C.on=true; C.off=false; C.c1.x=R.x0+R.x1-p.x; C.c1.y=p.y; C.c2.x=p.x; C.c2.y=R.y0+R.y1-p.y; C.lx=p.x; C.ly=p.y; C.a=0; SFX.play('shrine',0.5);
      emit(C.c1.x,C.c1.y,16,{col:'110,80,170',glow:false,smin:20,smax:80,lmin:.4,lmax:.8,zmin:1.5,zmax:3,grow:5}); emit(C.c2.x,C.c2.y,16,{col:'110,80,170',glow:false,smin:20,smax:80,lmin:.4,lmax:.8,zmin:1.5,zmax:3,grow:5});
      if(typeof c1Play==='function'&&!c1Seen('c_spire_clones')&&STORY.c_spire_clones) later(0.4,()=>{ if(scene==='play') c1Play('c_spire_clones'); });
      xbTip('clones',S('Shadow copies','Shadow copies'),S('One copies you left to right, one copies you up and down. Pillars stop them, but not you. Step back on the dark plate to start again.','Pillars stop them, not you. The dark plate starts again.')); }
    if(!onSt) C.off=true;
    if(!C.on) continue;
    C.a=Math.min(1,C.a+dt*2);
    let dx=p.x-C.lx, dy=p.y-C.ly; C.lx=p.x; C.ly=p.y; if(Math.hypot(dx,dy)>60){ dx=0; dy=0; }
    xbCloneMove(A,R,C.c1,-dx,dy); xbCloneMove(A,R,C.c2,dx,-dy);
    // the plates: three bodies on three plates
    const bodies=[{x:p.x,y:p.y},C.c1,C.c2], used=new Set(); let n=0;
    for(const q of plates){ q.on=false; for(let i=0;i<3;i++){ if(used.has(i)) continue; if(dist(bodies[i].x,bodies[i].y,q.x,q.y)<30){ used.add(i); q.on=true; n++; break; } } }
    if(n>=3){ solveRoom(R,true); jingle('secret','shrine'); shake(4); setBanner(S('All three of you!','All three of you!'),S('The shadows bow, and melt back into the floor. The chest unseals.','The shadows melt away. The chest opens.'),3);
      for(const q of [C.c1,C.c2]) emit(q.x,q.y,24,{col:'150,110,220',smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3}); saveGame(); }
  }
}
function xbCloneMove(A,R,q,mx,my){ const free=(x,y)=>x>R.x0+10&&x<R.x1-10&&y>R.y0+10&&y<R.y1-10&&!areaBlocked(x,y)&&!colAt(x,y,10);
  if(mx&&free(q.x+mx,q.y)) q.x+=mx; if(my&&free(q.x,q.y+my)) q.y+=my; }

// ---------- 11. every frame
{ const base=dunUpdate; dunUpdate=function(A,dt){
    // no stairs while a boss fight is on (the roof and the lamp room have their way in inside the arena)
    if(A&&A.xb&&A.dn&&G.fightSite){ A.dn.stairGrace=1; A.dn.graceAt={x:player.x,y:player.y}; }
    return base.apply(this,arguments); }; }
// a c1boss room (x1_foes) starts with no foes in it; the Trial rule "a miniboss room with every foe dead is solved"
// (a2h_dungeons) would solve it the moment Ash walks in. Here it stays unsolved until its boss has fallen.
{ const base=solveRoom; solveRoom=function(R,quiet){ const A=AREA;
    if(A&&A.xb&&R&&R.c1boss&&!R.solved&&!(G.bossDone&&G.bossDone[R.c1boss])&&!(R.enemies||[]).some(e=>e.dead&&e.type===R.c1boss)) return;
    return base.apply(this,arguments); }; }
{ const base=updateCaveRooms; updateCaveRooms=function(dt){
    const A=AREA; base.apply(this,arguments);
    if(!A||AREA!==A||!A.xb||!A.dn) return;
    try{ xbUpdate(A,dt); }catch(e){ console.error(e); }
  }; }
function xbUpdate(A,dt){
  const X=A.xb, p=player; X.t+=dt;
  xbLensTick(A,dt); xbObjTick(A,dt); xbRipTick(A,dt); if(X.dkRooms.length) xbDarkTick(A,dt); else XB.slowK=1;
  if(X.watch.length) xbWatchTick(A,dt); xbNestTick(A,dt); xbCloneTick(A,dt);
  for(const o of X.posts){ const m=o.xbM; o.x=m.x+m.w/2; o.y=m.y+m.h/2; }
  for(const o of X.seals){ if(o.open){ if(o.melt<1) o.melt=Math.min(1,o.melt+dt*1.2); continue; } if(o.kind!=='boss'&&xbSealOpen(A,o)){ xbSealOpenNow(A,o); setBanner(o.kind==='cocoon'?S('The silk on the stairs unravels','The silk unwinds'):S('The stairs unseal','The stairs open'),S('The way up is open.','You can go up now.'),2.4); } }
  // the room under Ash: darker rooms (dim), the gust on a sheer face (the stock gust cannot push a climber: we do)
  const R=A.curRoom;
  if(R&&R.dim&&!R.solved) A.dark=Math.max(A.dark,R.dim);
  if(R&&R.gust&&R.gustOn&&XB.climb&&scene==='play'&&!p.dead&&!(R.gustCalm&&p2LitAt(p.x,p.y))&&!tSheltered(p.x,p.y,R.gust.dir)){ const g=R.gust, c=A.cave, f=g.str*R.gustK*dt*(g.climbK||0.8);
    for(const [ax,ay] of [[g.dir[0]*f,0],[0,g.dir[1]*f]]){ if(!ax&&!ay) continue; const nx=p.x+ax, ny=p.y+ay, k=tCell(nx,ny); if(k<0||(c.grid[k]===1&&c.typ[k]!==1)) continue; p.x=nx; p.y=ny; }
    A.tri.pushed=true; if(Math.random()<dt*4) emit(p.x,p.y-20,1,{col:'230,236,255',glow:false,ang:Math.atan2(g.dir[1],g.dir[0]),spread:0.3,smin:60,smax:140,lmin:.3,lmax:.5,zmin:2,zmax:3,alpha:0.7});
    xbTip('gust',S('The wind!','The wind!'),S('Gusts blow climbers off the face. When the wind howls, hold still behind a stone rib.','Wind! Hide behind a rib.')); }
  // the Mirror Gallery: once its target burns, the silk on the west door burns away and the target's stand goes with it
  for(const Q of X.rooms){ if(!Q.mass||!Q.solved) continue; const m=X.objs.find(o=>o.k==='xb_mass'&&o.room===Q.id); if(!m) continue;
    if(!m.gone){ m.gone=true; if(m.burnT<1){ m.burnT=0.001; SFX.play('boom'); shake(5); emit(m.x,m.y,50,{kind:'fire',ang:-Math.PI/2,spread:1.4,smin:40,smax:200,lmin:.5,lmax:1.1,zmin:2,zmax:6,grow:7}); }
      for(const tg of A.dn.targets){ if(tg.room!==Q.id) continue; const cc=A.cols.find(c=>c.t==='c'&&Math.abs(c.x-tg.x)<1&&Math.abs(c.y-tg.y)<1); if(cc){ removeCol(cc); A.cols.splice(A.cols.indexOf(cc),1); } } }
    if(m.burnT>0&&m.burnT<1) m.burnT=Math.min(1,m.burnT+dt*0.8); }
  // the Shadow Gallery is crossed once Ash reaches its far end
  for(const Q of X.rooms) if(Q.kind==='xbgal'&&!Q.solved&&Q.galEnd&&A.curRoom===Q){ const q=tPos((Q.oy+1+Q.galEnd[1])*A.cave.w+(Q.ox+1+Q.galEnd[0])); if(dist(p.x,p.y,q.x,q.y)<70){ solveRoom(Q,true); jingle('secret','shrine'); setBanner(S('Through the gallery!','You made it!'),S('Five sets of shadow bars, and not one caught you.','Five bars. Not one caught you!'),2.6); } }
  // first time in a room: its line (room field say1: a STORY key, or a function)
  if(R&&R!==XB.lastRoom){ XB.lastRoom=R; const vk=`xbv_${X.sid}_${R.id}`; if(!G.found[vk]&&R.say1){ G.found[vk]=1; later(0.7,()=>{ if(AREA!==A||scene!=='play') return; if(typeof R.say1==='function') R.say1(A,R); else if(typeof c1Play==='function'&&STORY[R.say1]&&!c1Seen(R.say1)) c1Play(R.say1); else if(STORY[R.say1]) runDialogue(STORY[R.say1],()=>{ scene='play'; }); }); } }
  // moths over the open sky (the Moon Stair, the Grapple Garden, the Last Stair) fly over the void
  for(const e of G.enemies){ if(!e.dead&&e.inArea&&!e.noClip&&(e.type==='c_moth'||e.type==='c_gull')){ const Q=A.rooms[e.room]; if(Q&&Q.mothFree) e.noClip=true; } }
}
// a tower's lower floors: the way out is DOWN the stairs (the engine's text says up)
{ const base=questObjective; questObjective=function(){ const o=base.apply(this,arguments), A=AREA;
    if(!o||!A||!A.xb||!A.dn||!A.exit||!A.exit.none) return o;
    let best=null, bd=1e18; for(const s of A.dn.stairs){ if(s.dir!=='down') continue; const d=dist2(s.x,s.y,player.x,player.y); if(d<bd){ bd=d; best=s; } }
    const text=String(o.text||'').replace(S('The way out is up the stairs.','Go up the stairs to get out.'),S('The way out is down the stairs.','Go down the stairs to get out.'));
    return Object.assign({},o,{text,x:best?best.x:o.x,y:best?best.y:o.y}); }; }

// ---------- 12. the baked look: sheer faces, ink, the sea and sky below the balconies, planks and black glass
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){ base.apply(this,arguments); if(xbIsDef(def)) try{ xbPaint(A,def); }catch(e){ console.error(e); } }; }
function xbPaint(A,def){
  const c=A.cave, cs=c.cell, g=A.canvas.getContext('2d'), th=def.theme, light=th==='c_light', rng=mulberry32(def.seed*13+7);
  g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0);
  const roomOf=(i,j)=>{ for(const id in c.rooms){ const R=c.rooms[id]; if(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih) return R; } return null; };
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){ const k=j*c.w+i, t=c.typ[k], x=i*cs, y=j*cs;
    if(c.grid[k]===1){ if(t!==1&&j+1<c.h&&c.grid[k+c.w]===0){ const R=roomOf(i,j+1);
        if(light&&!(R&&R.void)){ // a white band and a red band on every lighthouse wall face (the tower's stripes)
          g.fillStyle='rgba(255,248,236,.9)'; g.fillRect(x,y+cs*0.62,cs,cs*0.12); g.fillStyle='rgba(200,60,50,.55)'; g.fillRect(x,y+cs*0.74,cs,cs*0.1); g.fillStyle='rgba(90,20,20,.3)'; g.fillRect(x,y+cs*0.84,cs,2); }
        else if(!light){ g.fillStyle='rgba(190,160,255,.18)'; g.fillRect(x+cs*0.15,y+cs*0.66,cs*0.7,2); } }
      continue; }
    const R=roomOf(i,j);
    if(t===XTY.sheer){ xbPaintSheer(g,x,y,cs,light,rng,c,k); continue; }
    if(t===TY.chasm||(t===TY.pit&&R&&R.void)){ const ink=c.xb&&c.xb.ink.has(k); xbPaintVoid(g,x,y,cs,ink?'ink':(R&&R.void)||'shaft',rng,c,k,i,j,t===TY.pit); continue; }
    if(t===0||t===TY.rune){ if(light){ g.strokeStyle='rgba(90,50,20,.22)'; g.lineWidth=1.2; for(let n=1;n<4;n++){ g.beginPath(); g.moveTo(x,y+n*cs/4); g.lineTo(x+cs,y+n*cs/4); g.stroke(); } g.fillStyle='rgba(90,50,20,.25)'; const o=(j%2)?cs*0.3:cs*0.7; for(let n=0;n<4;n++) g.fillRect(x+((o+n*17)%cs),y+n*cs/4+1,1.4,cs/4-2);
        if(R&&R.void&&rng()<0.4){ g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(x+rng()*cs,y+rng()*cs,3,1.5); } }
      else { g.strokeStyle='rgba(200,180,255,.10)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(x+4,y+cs*0.7); g.lineTo(x+cs*0.7,y+4); g.stroke(); if(rng()<0.12){ g.fillStyle='rgba(210,190,255,.18)'; g.beginPath(); g.arc(x+rng()*cs,y+rng()*cs,1.5,0,TAU); g.fill(); } } }
    // the edge of a floor over a drop: a bright rim, so the way on reads at a glance (white stone in the tower, violet glass in the Spire)
    if(c.grid[k]===0&&t!==TY.chasm&&t!==TY.pit&&t!==XTY.sheer){ const vd=q=>q>=0&&q<c.typ.length&&c.grid[q]===0&&(c.typ[q]===TY.chasm||(c.typ[q]===TY.pit&&R&&R.void));
      g.fillStyle=light?'rgba(255,250,236,.75)':'rgba(205,180,255,.55)'; const e=3;
      if(vd(k-c.w)) g.fillRect(x,y,cs,e); if(vd(k+c.w)) g.fillRect(x,y+cs-e,cs,e); if(vd(k-1)) g.fillRect(x,y,e,cs); if(vd(k+1)) g.fillRect(x+cs-e,y,e,cs); }
  }
  g.restore();
}
function xbPaintSheer(g,x,y,cs,light,rng,c,k){
  const base=light?'#efe6d6':'#3a3456', hi=light?'#fff8ea':'#5c5486', red=light?'#c8463a':null;
  g.fillStyle=base; g.fillRect(x,y,cs,cs);
  // stone courses in a running bond (the lighthouse face keeps its red stripes)
  const bh=cs/3; for(let r=0;r<3;r++){ const yy=y+r*bh, off=((Math.floor(y/bh)+r)%2)?cs/2:0;
    if(light&&((Math.floor(y/cs)+r)%3===1)){ g.fillStyle=red; g.fillRect(x,yy,cs,bh); }
    g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x,yy+bh-2,cs,2); for(let q=-1;q<2;q++){ const xx=x+off+q*cs/2+cs/4; if(xx>x&&xx<x+cs) g.fillRect(xx,yy,2,bh-1); }
    g.fillStyle=light?'rgba(255,255,255,.35)':'rgba(190,170,255,.12)'; g.fillRect(x,yy,cs,1.5); }
  if(!light){ g.strokeStyle='rgba(180,140,255,.25)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x+rng()*cs,y); g.lineTo(x+rng()*cs,y+cs); g.stroke(); g.fillStyle=hi; g.globalAlpha=0.25; g.fillRect(x+2,y+2,cs-4,2); g.globalAlpha=1; }
  // handholds: little knobs the claws grip
  for(let n=0;n<3;n++){ const hx=x+6+rng()*(cs-12), hy=y+6+rng()*(cs-12); g.fillStyle='rgba(30,16,20,.45)'; g.beginPath(); g.ellipse(hx+0.8,hy+1.4,2.6,1.9,0,0,TAU); g.fill(); g.fillStyle=light?'#a89478':'#d6ccef'; g.beginPath(); g.ellipse(hx,hy,2.6,1.9,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(hx-0.8,hy-0.7,1,0.7,0,0,TAU); g.fill(); }
  // the edge of the face against open air gets a dark rim
  const w=c.w; for(const [d,dx,dy] of [[-w,0,-1],[w,0,1],[-1,-1,0],[1,1,0]]){ const q=k+d; if((c.typ[q]===TY.chasm||c.typ[q]===TY.pit)&&c.grid[q]===0){ g.fillStyle='rgba(20,10,30,.5)'; if(dy) g.fillRect(x,dy<0?y:y+cs-4,cs,4); else g.fillRect(dx<0?x:x+cs-4,y,4,cs); } }
}
function xbPaintVoid(g,x,y,cs,kind,rng,c,k,i,j,pit){
  if(kind==='sea'){ const gr=g.createLinearGradient(0,y,0,y+cs); gr.addColorStop(0,'#2f84b8'); gr.addColorStop(1,'#2876aa'); g.fillStyle=gr; g.fillRect(x,y,cs,cs);
    g.strokeStyle='rgba(255,255,255,.55)'; g.lineWidth=1.6; for(let n=0;n<2;n++) if(rng()<0.5){ const wx=x+rng()*cs*0.7, wy=y+rng()*cs; g.beginPath(); g.moveTo(wx,wy); g.quadraticCurveTo(wx+5,wy-3,wx+10,wy); g.stroke(); }
    if(rng()<0.15){ g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(x+rng()*cs,y+rng()*cs,2,2); } }
  else if(kind==='sky'){ g.fillStyle=(i+j)%2?'#0a0816':'#0c0a1a'; g.fillRect(x,y,cs,cs);
    for(let n=0;n<2;n++) if(rng()<0.5){ g.fillStyle=`rgba(255,250,235,${0.5+rng()*0.5})`; const s=rng()<0.2?2.6:1.5; g.fillRect(x+rng()*cs,y+rng()*cs,s,s); }
    if(rng()<0.08){ g.fillStyle='rgba(120,110,170,.18)'; g.beginPath(); g.ellipse(x+cs/2,y+cs/2,cs*0.9,cs*0.35,0,0,TAU); g.fill(); } }
  else if(kind==='ink'){ g.fillStyle='#120a1e'; g.fillRect(x,y,cs,cs); g.strokeStyle='rgba(140,90,210,.22)'; g.lineWidth=1.4; g.beginPath(); const yy=y+cs*(0.3+rng()*0.4); g.moveTo(x,yy); g.bezierCurveTo(x+cs*0.3,yy-6,x+cs*0.6,yy+6,x+cs,yy); g.stroke();
    if(rng()<0.25){ g.fillStyle='rgba(200,170,255,.25)'; g.beginPath(); g.arc(x+rng()*cs,y+rng()*cs,1.6,0,TAU); g.fill(); } }
  else { const gr=g.createRadialGradient(x+cs/2,y+cs/2,2,x+cs/2,y+cs/2,cs*0.8); gr.addColorStop(0,'#030206'); gr.addColorStop(1,'#0c0814'); g.fillStyle=gr; g.fillRect(x,y,cs,cs); }
  // a broken edge where floor meets the drop (a pit on a balcony gets a jagged plank end)
  const w=c.w, up=k-w, solidUp=c.grid[up]===0&&c.typ[up]!==TY.chasm&&c.typ[up]!==XTY.sheer&&c.typ[up]!==TY.pit;
  if(solidUp){ g.fillStyle=kind==='sea'?'rgba(255,255,255,.7)':'rgba(0,0,0,.55)'; g.fillRect(x,y,cs,kind==='sea'?3:6); if(kind!=='sea'){ const gr=g.createLinearGradient(0,y,0,y+cs*0.5); gr.addColorStop(0,'rgba(0,0,0,.6)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.5); } }
  if(pit){ g.fillStyle='#6a4a2a'; for(const [dx,dy] of [[-1,0],[1,0]]){ const q=k+dx; if(c.grid[q]===0&&c.typ[q]===0){ const px=dx<0?x:x+cs-8; g.beginPath(); g.moveTo(px,y+8); g.lineTo(px+8,y+14); g.lineTo(px,y+22); g.lineTo(px+6,y+30); g.lineTo(px,y+40); g.closePath(); g.fill(); } } }
}
{ const base=renderCaveMini; renderCaveMini=function(A){ base.apply(this,arguments); if(!A||!A.def||!xbIsDef(A.def)||!A.mini) return; const c=A.cave, mg=A.mini.getContext('2d'), im=mg.getImageData(0,0,c.w,c.h); let ch=false;
    for(let k=0;k<c.typ.length;k++){ const t=c.typ[k]; if(c.grid[k]!==0) continue; const a=k*4; if(im.data[a]===10&&im.data[a+1]===8) continue; let v=null;
      if(t===XTY.sheer) v=[120,104,150]; else if(t===XTY.rip) v=[70,120,170]; else if(t===TY.chasm) v=c.xb&&c.xb.ink.has(k)?[34,20,48]:[16,14,26];
      if(v){ const dim=im.data[a]+im.data[a+1]+im.data[a+2]<150?0.55:1; im.data[a]=v[0]*dim; im.data[a+1]=v[1]*dim; im.data[a+2]=v[2]*dim; ch=true; } }
    if(ch) mg.putImageData(im,0,0); }; }
// the e9a crystal target in the Mirror Gallery is hidden: the silk on the door is what the beam must reach
{ const base=FL.dbeamtgt; FL.dbeamtgt=(o,t)=>{ if(AREA&&AREA.xb){ const R=AREA.rooms[o.room]; if(R&&R.mass) return; } if(base) base(o,t); }; }

{ const base=drawFurnX; drawFurnX=function(o,t){ const A=AREA; if(A&&A.xb&&o&&o.k==='cgate'&&o.type==='gate'&&o.closed&&!o.tmp){ const R=A.rooms[o.gateRoom]; if(R&&R.mass) return true; } return base.apply(this,arguments); }; }
// ---------- 13. the live floor layer: beams, moonlight, the dark, the rip, plates, the mirrors' last beam
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(A&&A.xb) try{ xbDrawFloor(A,t); }catch(e){ console.error(e); } }; }
function xbRR(P,x,y,w,h,r){ if(P.roundRect) P.roundRect(x,y,w,h,r); else P.rect(x,y,w,h); }
function xbDrawFloor(A,t){
  const X=A.xb, c=A.cave, cs=c.cell;
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1), j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  // the rip: white streaks rushing east while the water is up; ink sparkles; waves on the sea
  ctx.save(); ctx.lineCap='round';
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i, ty=c.typ[k]; const x=A.x0+i*cs, y=A.y0+j*cs;
    if(ty===XTY.rip&&tWet(k)){ const dk=A.def.theme==='c_shadow'; ctx.fillStyle=dk?'#2c3a72':'#2a6a9a'; ctx.fillRect(x,y,cs,cs); ctx.fillStyle=dk?'rgba(120,150,230,.25)':'rgba(160,210,240,.25)'; ctx.fillRect(x,y+((i*13+j*7)%3)*cs/3,cs,3); for(let n=0;n<2;n++){ const f=((t*1.8+n*0.5+(i*0.37+j*0.61))%1), px=x+f*cs, py=y+cs*(0.3+0.4*n)+Math.sin(t*3+i)*2; ctx.strokeStyle=`rgba(235,248,255,${0.55*Math.sin(f*Math.PI)})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(px-12,py); ctx.lineTo(px,py); ctx.stroke(); } }
    else if(ty===TY.chasm&&c.xb.ink.has(k)&&((i*7+j*5+Math.floor(t*2))%23)===0){ ctx.fillStyle='rgba(210,180,255,.35)'; ctx.beginPath(); ctx.arc(x+cs*0.5+Math.sin(t+i)*8,y+cs*0.5,1.8,0,TAU); ctx.fill(); } }
  ctx.restore();
  // shadow pools over the ink: a violet sheen and a bright rim, so they read on the black (lit ones go grey)
  if(A.p2&&c.xb&&c.xb.shade.length){ const SH=A.p2.shade, sh=q=>q>=0&&q<SH.length&&SH[q]; ctx.save(); ctx.lineWidth=2.5;
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i; if(!SH[k]) continue; if(!(c.xb.ink.has(k)||[1,-1,c.w,-c.w].some(d=>c.xb.ink.has(k+d)))) continue;
      const x=A.x0+i*cs, y=A.y0+j*cs, lit=p2LitAt(x+cs/2,y+cs/2);
      ctx.fillStyle=lit?'rgba(130,120,160,.22)':'rgba(92,54,168,.5)'; ctx.fillRect(x,y,cs,cs);
      ctx.strokeStyle=lit?'rgba(210,200,235,.3)':`rgba(205,165,255,${0.55+0.2*Math.sin(t*3+i+j)})`; ctx.beginPath();
      if(!sh(k-c.w)){ ctx.moveTo(x,y+1.5); ctx.lineTo(x+cs,y+1.5); } if(!sh(k+c.w)){ ctx.moveTo(x,y+cs-1.5); ctx.lineTo(x+cs,y+cs-1.5); }
      if(!sh(k-1)){ ctx.moveTo(x+1.5,y); ctx.lineTo(x+1.5,y+cs); } if(!sh(k+1)){ ctx.moveTo(x+cs-1.5,y); ctx.lineTo(x+cs-1.5,y+cs); } ctx.stroke(); }
    ctx.restore(); }
  // the creeping dark: soft ink blobs (one path per layer, no seams), a violet rim, and the cracks it leaks from
  if(X.dk){ const P0=new Path2D(), P1=new Path2D(); let n=0; const dk=q=>q>=0&&q<X.dk.length&&X.dk[q];
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i; if(!X.dk[k]) continue; n++; const x=A.x0+i*cs, y=A.y0+j*cs, wob=Math.sin(t*1.3+i*1.7+j*2.3)*2;
      const l=dk(k-1)?0:5, r=dk(k+1)?0:5, u=dk(k-c.w)?0:5, d=dk(k+c.w)?0:5;
      xbRR(P0,x+(l?l-6+wob:-1),y+(u?u-6-wob:-1),cs-(l?l-6+wob:-1)-(r?r-6-wob:-1),cs-(u?u-6-wob:-1)-(d?d-6+wob:-1),[l&&u?14:0,r&&u?14:0,r&&d?14:0,l&&d?14:0]);
      xbRR(P1,x+(l||-0.5),y+(u||-0.5),cs-(l||-0.5)-(r||-0.5),cs-(u||-0.5)-(d||-0.5),[l&&u?10:0,r&&u?10:0,r&&d?10:0,l&&d?10:0]); }
    if(n){ ctx.save(); ctx.fillStyle='rgba(130,80,210,.32)'; ctx.fill(P0); ctx.fillStyle='rgba(16,6,30,.86)'; ctx.fill(P1); ctx.restore();
      if(Math.random()<0.35){ const k=(Math.random()*X.dk.length)|0; if(X.dk[k]){ const q=tPos(k); emit(q.x+rand(-18,18),q.y+rand(-18,18),1,{col:'170,130,240',smin:3,smax:12,lmin:.6,lmax:1.2,zmin:0.8,zmax:1.5,drag:1,rise:-12,alpha:0.7}); } } }
    for(const D of X.dkRooms) for(const k of D.src){ const q=tPos(k); if(!inView(q.x,q.y,60)) continue; ctx.save(); ctx.strokeStyle='#100818'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(q.x-14,q.y-18); ctx.lineTo(q.x-3,q.y-4); ctx.lineTo(q.x+6,q.y-12); ctx.lineTo(q.x+15,q.y+4); ctx.stroke(); ctx.strokeStyle='rgba(170,110,255,.55)'; ctx.lineWidth=1.4; ctx.stroke();
      const dr=(t*0.7+q.x*0.01)%1; ctx.fillStyle=`rgba(20,8,36,${1-dr})`; ctx.beginPath(); ctx.ellipse(q.x-3,q.y-4+dr*14,3,4,0,0,TAU); ctx.fill(); ctx.restore(); } }
  // shadow strips (a stair rail's long shadow) while they are there
  if(A.p2) for(const s of A.p2.strips){ if(!(!s.on||s.on(s))) continue; if(!inView((s.x0+s.x1)/2,(s.y0+s.y1)/2,400)) continue; ctx.save(); ctx.strokeStyle='rgba(22,10,40,.62)'; ctx.lineWidth=s.w; ctx.lineCap='butt'; ctx.beginPath(); ctx.moveTo(s.x0,s.y0); ctx.lineTo(s.x1,s.y1); ctx.stroke(); ctx.strokeStyle=`rgba(170,120,255,${0.35+0.15*Math.sin(t*4)})`; ctx.lineWidth=2; ctx.setLineDash([10,8]); ctx.lineDashOffset=-t*30; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
  // moonlight pools
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const m of X.moons){ if(!inView(m.x,m.y,m.r*2)) continue; const g=ctx.createRadialGradient(m.x,m.y,4,m.x,m.y,m.r*1.15); g.addColorStop(0,'rgba(220,232,255,.42)'); g.addColorStop(0.65,'rgba(180,200,255,.2)'); g.addColorStop(1,'rgba(160,180,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(m.x,m.y,m.r*1.15,0,TAU); ctx.fill();
    for(let n=0;n<6;n++){ const a=t*0.4+n*1.05, rr=m.r*(0.25+0.6*((n*0.37+t*0.1)%1)); ctx.fillStyle='rgba(240,246,255,.6)'; ctx.fillRect(m.x+Math.cos(a)*rr,m.y+Math.sin(a)*rr*0.7,1.6,1.6); } }
  // lantern light pools in the gallery
  for(const o of X.lanterns){ if(o.hooked||!inView(o.x,(o.y0+o.y1)/2,200)) continue; const cy=(o.y0+o.y1)/2, h=(o.y1-o.y0)/2+30; const g=ctx.createRadialGradient(o.x,cy,6,o.x,cy,h); g.addColorStop(0,'rgba(255,214,130,.42)'); g.addColorStop(1,'rgba(255,190,90,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(o.x,cy,58,h,0,0,TAU); ctx.fill(); }
  // the lighthouse beams
  for(const o of X.lens){ if(o.beam&&inView((o.beam.x0+o.beam.x1)/2,(o.beam.y0+o.beam.y1)/2,900)) xbDrawBeam(o.beam,t); }
  // the Turner's spill of light on the gallery door
  for(const R of X.rooms){ if(R._spillOn&&R._spillG){ const g=R._spillG, gr=ctx.createRadialGradient(g.x,g.y,4,g.x,g.y,110); gr.addColorStop(0,'rgba(255,226,150,.45)'); gr.addColorStop(1,'rgba(255,210,120,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(g.x,g.y,110,0,TAU); ctx.fill(); } }
  ctx.restore();
  // the beam slots in the walls, and the mirrors' last beam, dotted on the floor
  for(const L of X.lens){ if(L.L.mini) continue; const on=!!L.beam; if(!inView(L.sx,L.sy,80)) continue; ctx.save(); ctx.fillStyle=xbOL(); ctx.fillRect(L.sx-9,L.sy-14,18,10); ctx.fillStyle=on?'#fff2c0':'#5a4a30'; ctx.fillRect(L.sx-6,L.sy-12,12,6); if(on){ ctx.globalCompositeOperation='lighter'; glowAt(L.sx,L.sy-9,34,'255,226,150',0.7); } ctx.restore(); }
  for(const R of X.rooms){ if(R._slot){ const s=R._slot, on=A.dn.emitters.includes(s); ctx.save(); ctx.fillStyle=xbOL(); ctx.fillRect(s.x-12,s.y-12,24,24); ctx.fillStyle=on?'#fff4c8':'#6a5232'; ctx.fillRect(s.x-8,s.y-8,16,16); if(on){ ctx.globalCompositeOperation='lighter'; glowAt(s.x,s.y,44,'255,226,150',0.85); } ctx.restore(); }
    if(R._lastBeam&&!A.dn.emitters.includes(R._slot)&&!R.solved){ ctx.save(); ctx.setLineDash([6,10]); ctx.lineDashOffset=-t*20; ctx.strokeStyle='rgba(255,226,150,.42)'; ctx.lineWidth=3; for(const pts of R._lastBeam){ ctx.beginPath(); pts.forEach((q,n)=>n?ctx.lineTo(q.x,q.y-10):ctx.moveTo(q.x,q.y-10)); ctx.stroke(); } ctx.setLineDash([]); ctx.restore(); } }
  // Watcher cones
  for(const o of X.watch){ if(inView(o.x,o.y,o.len+40)) xbDrawCone(A,o,t); }
  // clone room plates, Pearl's pages
  for(const o of X.objs){ if(o.k==='xb_cplate'||o.k==='xb_cstart'){ if(!inView(o.x,o.y,40)) continue; const on=o.on, st=o.k==='xb_cstart';
      ctx.save(); ctx.fillStyle='rgba(20,10,30,.45)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+3,24,15,0,0,TAU); ctx.fill(); ctx.fillStyle=st?'#2a2040':on?'#c8a8ff':'#4a3e66'; ctx.strokeStyle=xbOL(); ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(o.x,o.y,22,14,0,0,TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle=st?'rgba(200,170,255,.9)':on?'#fff6d0':'rgba(190,160,255,.75)'; ctx.lineWidth=2; ctx.beginPath(); if(st){ for(let q=0;q<3;q++){ ctx.moveTo(o.x-10+q*10,o.y-6); ctx.lineTo(o.x-10+q*10,o.y+6); } } else { ctx.ellipse(o.x,o.y,11,7,0,0,TAU); } ctx.stroke(); if(on||st) glowAt(o.x,o.y,30,'200,170,255',on?0.5:0.25); ctx.restore(); }
    else if(o.k==='xb_page'&&!G.found[o.id]){ ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(Math.sin(t*1.3)*0.15); ctx.fillStyle=xbOL(); ctx.fillRect(-10,-13,20,26); ctx.fillStyle='#f2e6c8'; ctx.fillRect(-8.5,-11.5,17,23); ctx.strokeStyle='rgba(90,60,30,.55)'; ctx.lineWidth=1; for(let q=-7;q<=7;q+=3.5){ ctx.beginPath(); ctx.moveTo(-6,q); ctx.lineTo(6,q); ctx.stroke(); } ctx.fillStyle='#c86a3a'; ctx.beginPath(); ctx.arc(4,-7,2.2,0,TAU); ctx.fill(); ctx.restore(); glowAt(o.x,o.y,34,'255,240,200',0.3+0.15*Math.sin(t*3)); }
    else if(o.k==='xb_prop'){ const D=XB_PROP[o.kind]; if(D&&D.flat&&D.draw&&inView(o.x,o.y,120)) D.draw(o,t); } }
  // black glass platforms over the drifting movers (drawn over the engine's planks), each with its grapple post
  if(A.def.theme==='c_shadow') for(const m of A.dn.movers){ if(!inView(m.x+m.w/2,m.y+m.h/2,m.w)) continue; xbDrawGlassPlat(m,t); }
}
function xbDrawBeam(b,t){
  const {x0,y0,x1,y1,w,fade}=b, L=Math.hypot(x1-x0,y1-y0); if(L<4) return;
  const g=ctx.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,`rgba(255,240,180,${0.6*fade})`); g.addColorStop(1,`rgba(255,214,120,${0.25*fade})`);
  ctx.lineCap='round';
  ctx.strokeStyle=`rgba(255,220,140,${0.12*fade})`; ctx.lineWidth=w*1.7; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
  ctx.strokeStyle=g; ctx.lineWidth=w; ctx.stroke();
  ctx.strokeStyle=`rgba(255,250,225,${0.55*fade})`; ctx.lineWidth=w*0.22; ctx.stroke();
  const ux=(x1-x0)/L, uy=(y1-y0)/L; for(let n=0;n<10;n++){ const f=((t*0.25+n*0.1)%1), px=x0+ux*L*f+(-uy)*w*0.4*Math.sin(n*2.1+t), py=y0+uy*L*f+ux*w*0.4*Math.sin(n*2.1+t); ctx.fillStyle=`rgba(255,250,230,${0.7*fade*Math.sin(f*Math.PI)})`; ctx.fillRect(px,py,2,2); }
  glowAt(x0,y0,30,'255,236,170',0.7*fade);
}
function xbDrawCone(A,o,t){
  const c=A.cave, n=12, pts=[];
  for(let s=0;s<=n;s++){ const a=o.ang-o.half+2*o.half*s/n; let d=o.len; for(let r=12;r<=o.len;r+=12){ const x=o.x+Math.cos(a)*r, y=o.y+Math.sin(a)*r, k=tCell(x,y); if(k<0||(c.grid[k]===1&&c.typ[k]!==1)){ d=r; break; } } pts.push([o.x+Math.cos(a)*d,o.y+Math.sin(a)*d]); }
  const hot=o.sus, blind=o.blind, col=blind?'200,200,210':hot>0.05?`255,${Math.round(220-160*hot)},${Math.round(240-170*hot)}`:'220,210,255';
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const gr=ctx.createRadialGradient(o.x,o.y,8,o.x,o.y,o.len); gr.addColorStop(0,`rgba(${col},${blind?0.06:0.3+0.25*hot})`); gr.addColorStop(1,`rgba(${col},0)`);
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(o.x,o.y); for(const [x,y] of pts) ctx.lineTo(x,y); ctx.closePath(); ctx.fill();
  if(!blind){ ctx.strokeStyle=`rgba(${col},${0.25+0.35*hot})`; ctx.lineWidth=1.5; ctx.setLineDash([5,7]); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}
function xbDrawGlassPlat(m,t){ const x=m.x, y=m.y, w=m.w, h=m.h, oc=xbOL();
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(x+6,y+12,w-4,h-4);
  ctx.fillStyle=oc; rrect(ctx,x,y,w,h,10); ctx.fill(); ctx.fillStyle='#3e365c'; rrect(ctx,x+3,y+3,w-6,h-6,8); ctx.fill();
  ctx.fillStyle='#5a5284'; rrect(ctx,x+3,y+3,w-6,h*0.32,8); ctx.fill();
  ctx.strokeStyle='rgba(210,190,255,.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+12,y+h-14); ctx.lineTo(x+w*0.55,y+12); ctx.moveTo(x+w*0.5,y+h-10); ctx.lineTo(x+w-12,y+h*0.45); ctx.stroke();
  glowAt(x+w/2,y+h/2,w*0.55,'160,120,255',0.12+0.05*Math.sin(t*2+x));
  // the grapple post in the middle of the platform
  const px=x+w/2, py=y+h/2; ctx.fillStyle=oc; ctx.fillRect(px-5,py-32,10,36); ctx.fillStyle='#8a7aa8'; ctx.fillRect(px-3,py-31,6,34); ctx.strokeStyle=oc; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(px,py-36,8,0,TAU); ctx.stroke(); ctx.strokeStyle='#e8c060'; ctx.lineWidth=2.6; ctx.stroke();
  if(typeof canGrapple==='function'&&canGrapple()&&dist(player.x,player.y,px,py)<(typeof p2Range==='function'?p2Range():340)+40) glowAt(px,py-36,16,'255,220,150',0.3+0.15*Math.sin(t*3));
  ctx.restore(); }

// ---------- 14. the things that stand up (sorted with the figures)
{ const base=eventsForRender; eventsForRender=function(list){ base(list); const A=AREA; if(!A||!A.xb) return;
    for(const o of A.xb.stand){ if(o.dead) continue; const r=o.k==='xb_watch'?60:o.k==='xb_lamp'||o.k==='xb_housing'?160:o.k==='xb_rail'?300:90; if(!inView(o.x,o.y,r)) continue; if(!o._it) o._it={x:o.x,y:o.y,r:6,flying:true,draw:()=>xbDrawStand(o)}; o._it.x=o.x; o._it.y=xbSortY(o); list.push(o._it); }
    // the clone room's shadows
    for(const R of A.xb.rooms){ const C=R._cl; if(!C||!C.on&&!(C.a>0)) continue; for(const q of [C.c1,C.c2]){ if(!q._it) q._it={x:q.x,y:q.y,r:6,flying:true,draw:()=>xbDrawClone(q,C)}; q._it.x=q.x; q._it.y=q.y; list.push(q._it); } }
  }; }
const xbSortY=o=>o.k==='xb_watch'?o.y+400:o.k==='xb_lantern'?(o.y0+o.y1)/2+80:o.k==='xb_mass'?o.y1:o.k==='xb_rail'?o.y+6:o.k==='xb_prop'&&XB_PROP[o.kind]&&XB_PROP[o.kind].wall?o.y-40:o.y+(o.k==='xb_lamp'?30:4);
function xbDrawClone(q,C){
  const p=player, e=q._e||(q._e={type:'c_shadowash',x:0,y:0,face:0,state:'chase',dx:0,dy:0,t:0,r:14,id:-7,hp:1,maxHp:1});
  const vx=q.x-(q._px==null?q.x:q._px), vy=q.y-(q._py==null?q.y:q._py); q._px=q.x; q._py=q.y;
  e.x=q.x; e.y=q.y; e.t=(e.t||0)+0.016; e.dx=vx*60; e.dy=vy*60; if(Math.hypot(vx,vy)>0.2) e.face=Math.atan2(vy,vx); else e.face=p.facing;
  ctx.save(); ctx.globalAlpha=0.82*(C.a==null?1:C.a);
  let drawn=false; try{ if(typeof c1Shadow2b==='function'){ c1Shadow2b(e,false); drawn=true; } }catch(err){}
  if(!drawn){ ctx.fillStyle='rgba(40,20,70,.9)'; ctx.beginPath(); ctx.ellipse(q.x,q.y-14,12,16,0,0,TAU); ctx.fill(); }
  ctx.restore(); glowAt(q.x,q.y-10,24,'150,110,230',0.25);
}
function xbDrawStand(o){
  const t=G.time, x=o.x, y=o.y, oc=xbOL();
  switch(o.k){
    case 'xb_drum': { drawSprite(xbSpr('drum',20,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,14,16,6,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.moveTo(-13+dx,-14+dy); q.lineTo(13+dx,-14+dy); q.lineTo(13+dx,12+dy); q.quadraticCurveTo(0+dx,17+dy,-13+dx,12+dy); q.closePath(); },'#b0402e',{r:14});
        g.fillStyle='#6a2418'; g.fillRect(-13,-6,26,3); g.fillRect(-13,4,26,3); g.fillStyle='#d8c090'; g.beginPath(); g.ellipse(0,-14,13,5,0,0,TAU); g.fill(); g.fillStyle='#8a6a3a'; g.beginPath(); g.ellipse(3,-14,3,1.6,0,0,TAU); g.fill(); g.fillStyle='#fff2cc'; g.font='900 7px sans-serif'; g.textAlign='center'; g.fillText('OIL',0,2); }),x,y-12,1,0);
      if(o.burnT>0){ const k=clamp(o.burnT/1.5,0,1); for(let n=0;n<3;n++){ const fh=24+Math.sin(t*11+n*2)*6; ctx.fillStyle=n===0?'rgba(255,120,40,.85)':n===1?'rgba(255,190,80,.8)':'rgba(255,240,170,.9)'; const ww=10-n*3; ctx.beginPath(); ctx.moveTo(x-ww,y-26); ctx.quadraticCurveTo(x-ww*1.2,y-26-fh*0.5,x+Math.sin(t*7+n)*4,y-26-fh*(1-n*0.18)*k); ctx.quadraticCurveTo(x+ww*1.2,y-26-fh*0.5,x+ww,y-26); ctx.closePath(); ctx.fill(); } glowAt(x,y-40,60,'255,170,80',0.6*k); }
      else if(o.cd>0){ if(Math.random()<0.1) emit(x+rand(-6,6),y-30,1,{col:'120,110,110',glow:false,ang:-Math.PI/2,spread:0.3,smin:10,smax:30,lmin:.8,lmax:1.4,zmin:2,zmax:4,grow:6}); }
      else if(o.heat>0) glowAt(x,y-26,20,'255,150,60',0.4); break; }
    case 'xb_vbraz': if(typeof c1DrawBrazier==='function'){ c1DrawBrazier(o); if(o.lit){ const f=clamp(o.litT/4,0,1); ctx.save(); ctx.strokeStyle=`rgba(255,220,120,${0.25*f})`; ctx.lineWidth=2; ctx.setLineDash([6,8]); ctx.beginPath(); ctx.ellipse(x,y,190,150,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); } } else { ctx.fillStyle=o.lit?'#ffcf5a':'#8a5ae0'; ctx.beginPath(); ctx.arc(x,y-20,10,0,TAU); ctx.fill(); } break;
    case 'xb_cocoon': drawSprite(xbSpr('cocoon'+o.v,16,g=>{ g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(2,11,11,4,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy-2,9+o.v,13,0,0,TAU); },'#ece6f2',{r:12}); g.strokeStyle='#b8b0c8'; g.lineWidth=1; for(let n=0;n<4;n++){ g.beginPath(); g.moveTo(-8,-9+n*5); g.lineTo(8,-7+n*5); g.stroke(); } g.strokeStyle='rgba(220,215,235,.8)'; g.beginPath(); g.moveTo(0,-15); g.lineTo(-2-o.v*3,-16); g.stroke(); }),x,y-10,1,0);
      if(o.heat>0.2) glowAt(x,y-10,18,'255,140,60',0.3*o.heat); break;
    case 'xb_horn': { drawSprite(xbSpr('horn',30,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,20,22,7,0,0,TAU); g.fill(); g.fillStyle='#5a3a22'; g.fillRect(-3,0,6,20); g.fillRect(-14,17,28,5);
        celFill(g,(q,dx,dy)=>{ q.moveTo(-20+dx,-6+dy); q.lineTo(8+dx,-12+dy); q.quadraticCurveTo(26+dx,-22+dy,28+dx,-4+dy); q.quadraticCurveTo(26+dx,14+dy,8+dx,4+dy); q.lineTo(-20+dx,2+dy); q.closePath(); },'#d8a848',{r:22});
        g.fillStyle='#3a2410'; g.beginPath(); g.ellipse(24,-4,4,12,0,0,TAU); g.fill(); g.fillStyle='#b8873e'; g.fillRect(-22,-7,6,10); }),x,y-14,1,0);
      if(o.blowT>0){ ctx.save(); for(let n=0;n<3;n++){ const f=((t*1.6+n/3)%1); ctx.strokeStyle=`rgba(230,240,255,${0.5*(1-f)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x+24,y-18,20+f*220,-0.9,0.9); ctx.stroke(); } ctx.restore(); }
      else if(o.cd<=0) glowAt(x+20,y-18,22,'255,226,150',0.25+0.1*Math.sin(t*3)); break; }
    case 'xb_wheel': { const a=o.turned?Math.PI*1.5-(o.spin>0?o.spin*Math.PI*1.5:0):0;
      ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x+2,y+6,20,7,0,0,TAU); ctx.fill(); ctx.fillStyle=oc; ctx.fillRect(x-4,y-30,8,34); ctx.fillStyle='#5a5284'; ctx.fillRect(x-2.5,y-29,5,32);
      ctx.translate(x,y-34); ctx.rotate(a); ctx.strokeStyle=oc; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(0,0,17,0,TAU); ctx.stroke(); ctx.strokeStyle=o.turned?'#e8e0ff':'#a898d8'; ctx.lineWidth=4; ctx.stroke();
      for(let n=0;n<4;n++){ ctx.rotate(Math.PI/2); ctx.strokeStyle=oc; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-17); ctx.stroke(); ctx.strokeStyle='#c8bcf0'; ctx.lineWidth=2.4; ctx.stroke(); }
      ctx.fillStyle='#f0ecff'; ctx.beginPath(); ctx.arc(0,0,5,0,TAU); ctx.fill(); ctx.fillStyle='#5a5284'; ctx.beginPath(); ctx.arc(1.5,-1,4,0,TAU); ctx.fill(); ctx.restore();
      // a little crescent moon painted on the hub
      ctx.save(); ctx.fillStyle=o.turned?'#fff6d0':'#d8d0f8'; ctx.beginPath(); ctx.arc(x,y-56,6,0,TAU); ctx.fill(); ctx.fillStyle='#3a3456'; ctx.beginPath(); ctx.arc(x+3,y-58,5,0,TAU); ctx.fill(); ctx.restore();
      if(!o.turned) glowAt(x,y-34,26,'200,190,255',0.25+0.1*Math.sin(t*3)); break; }
    case 'xb_mring': { const bob=Math.sin(t*2+o.ph)*4, fresh=o.cd<=0; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(225,235,255,${fresh?0.85:0.3})`; ctx.lineWidth=5; ctx.beginPath(); ctx.ellipse(x,y-34+bob,34,13,0,0,TAU); ctx.stroke(); ctx.strokeStyle=`rgba(170,190,255,${fresh?0.5:0.15})`; ctx.lineWidth=12; ctx.stroke();
      for(let n=0;n<5;n++){ const a=t*1.5+n*1.26; ctx.fillStyle='rgba(240,246,255,.8)'; ctx.fillRect(x+Math.cos(a)*34,y-34+bob+Math.sin(a)*13,2,2); } ctx.restore(); break; }
    case 'xb_watch': xbDrawWatcher(o,t); break;
    case 'xb_lantern': { const top=o.py-56, lx=o.x, ly=o.py-6; ctx.save(); ctx.strokeStyle=oc; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(o.px,top); ctx.lineTo(lx,ly-14); ctx.stroke(); ctx.strokeStyle='#8a8070'; ctx.lineWidth=1.4; ctx.stroke();
      ctx.fillStyle=oc; rrect(ctx,lx-10,ly-16,20,24,5); ctx.fill(); ctx.fillStyle=o.hooked?'#6a5a3a':'#ffd27a'; rrect(ctx,lx-7,ly-13,14,18,4); ctx.fill(); ctx.fillStyle='#3a2a18'; ctx.fillRect(lx-9,ly-18,18,4);
      if(!o.hooked) glowAt(lx,ly-4,40,'255,210,120',0.6); ctx.restore(); break; }
    case 'xb_nest': if(o.burnt) break; { const h=o.heat>0?clamp(o.heat/4,0,1):0; drawSprite(xbSpr('nest',56,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(3,30,46,12,0,0,TAU); g.fill();
        celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy-4,44,34,0,0,TAU); },'#e8e2f0',{r:40}); g.strokeStyle='#b4aac8'; g.lineWidth=1.6; for(let n=0;n<7;n++){ g.beginPath(); g.moveTo(-40,-26+n*9); g.quadraticCurveTo(0,-34+n*9+(n%2?6:-6),40,-22+n*9); g.stroke(); }
        g.strokeStyle='rgba(230,225,240,.7)'; g.lineWidth=1; for(const [a,b] of [[-44,-30],[44,-26],[-30,30],[36,28]]){ g.beginPath(); g.moveTo(a*0.8,b*0.6); g.lineTo(a*1.3,b*1.4); g.stroke(); } }),x,y-6,1,0);
      if(h>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-6,60,'255,150,70',0.5*h); ctx.restore(); } else glowAt(x,y-2,18,'255,214,110',0.25+0.1*Math.sin(t*3)); break; }
    case 'xb_mass': { if(o.burnT>=1) break; const a=o.burnT>0?1-o.burnT:1, A=AREA, tg=A&&A.dn?A.dn.targets.find(q=>q.room===o.room):null, hot=tg?clamp(tg.hot/0.35,0,1):0; ctx.save(); ctx.globalAlpha=a; const w=o.x1-o.x0, h=o.y1-o.y0;
      ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(o.x0+4,o.y1-6,w,10); ctx.fillStyle=oc; rrect(ctx,o.x0-2,o.y0-14,w+4,h+16,18); ctx.fill(); ctx.fillStyle='#e6e0ee'; rrect(ctx,o.x0+1,o.y0-11,w-2,h+10,16); ctx.fill(); ctx.fillStyle='#f6f2fa'; rrect(ctx,o.x0+6,o.y0-8,w*0.5,h*0.35,12); ctx.fill();
      ctx.strokeStyle='#b8b0c8'; ctx.lineWidth=1.5; for(let n=0;n<8;n++){ ctx.beginPath(); ctx.moveTo(o.x0+4,o.y0+n*h/8); ctx.quadraticCurveTo(o.x0+w/2,o.y0+n*h/8+(n%2?10:-10),o.x1-4,o.y0+n*h/8+4); ctx.stroke(); }
      if(hot>0){ ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y,70,'255,170,80',0.6*hot); ctx.globalCompositeOperation='source-over'; }
      if(o.burnT>0) glowAt(o.x,o.y,80,'255,160,70',0.6*a); ctx.restore(); break; }
    case 'xb_lever': xbDrawLever(o,t); break;
    case 'xb_housing': xbDrawHousing(o,t); break;
    case 'xb_lamp': xbDrawLamp(o,t); break;
    case 'xb_gull': xbDrawGull(o,t); break;
    case 'xb_rail': { ctx.save(); ctx.strokeStyle=oc; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(o.ax,o.ay-26); ctx.lineTo(o.bx,o.by-26); ctx.stroke(); ctx.strokeStyle='#b8873e'; ctx.lineWidth=3.5; ctx.stroke();
      const n=Math.max(2,Math.round(Math.hypot(o.bx-o.ax,o.by-o.ay)/30)); for(let q=0;q<=n;q++){ const px=lerp(o.ax,o.bx,q/n), py=lerp(o.ay,o.by,q/n); ctx.strokeStyle=oc; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,py-26); ctx.stroke(); ctx.strokeStyle='#d8a848'; ctx.lineWidth=2.2; ctx.stroke(); } ctx.restore(); break; }
    case 'xb_seal': xbDrawSeal(o,t); break;
    case 'xb_prop': { const D=XB_PROP[o.kind]; if(D&&D.draw&&!D.flat) D.draw(o,t); break; }
  }
}
// cached, outlined sprites (Storybook) with a plain fallback
function xbSpr(key,R,draw){ if(typeof sbSprite==='function'&&typeof LOOK!=='undefined'&&LOOK.sb) return sbSprite('xb_'+key,R,draw); const m=XB.spr||(XB.spr=new Map()); let c=m.get(key); if(!c){ c=spriteOf(R,draw); m.set(key,c); } return c; }
function xbDrawWatcher(o,t){ const x=o.x, y=o.y, oc=xbOL(), sway=Math.sin(t*1.3+o.ph)*3, blind=o.blind, hy=y-70+sway*0.3;
  ctx.save(); ctx.strokeStyle='rgba(220,215,235,.7)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x,hy-120); ctx.lineTo(x+sway,hy-14); ctx.stroke();
  ctx.translate(x+sway,hy); ctx.rotate(o.ang+Math.PI/2);
  for(const s of [-1,1]){ ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(s*13,2,15,20,s*0.35,0,TAU); ctx.fill(); ctx.fillStyle='#a49cba'; ctx.beginPath(); ctx.ellipse(s*13,2,13,18,s*0.35,0,TAU); ctx.fill(); ctx.fillStyle='#d8d2e8'; ctx.beginPath(); ctx.arc(s*14,0,5,0,TAU); ctx.fill(); ctx.fillStyle='#4a3a5a'; ctx.beginPath(); ctx.arc(s*14,0,2.4,0,TAU); ctx.fill(); }
  ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(0,0,7,16,0,0,TAU); ctx.fill(); ctx.fillStyle='#8a82a2'; ctx.beginPath(); ctx.ellipse(0,0,5.5,14.5,0,0,TAU); ctx.fill();
  const ec=blind?'#9a96a8':o.sus>0.4?'#ff9a6a':'#fff4c0'; for(const s of [-1,1]){ ctx.fillStyle=ec; ctx.beginPath(); ctx.arc(s*3,-12,2.8,0,TAU); ctx.fill(); }
  ctx.restore(); if(!blind) glowAt(x+sway,hy-12,26,o.sus>0.4?'255,150,110':'255,244,200',0.5);
  if(o.sus>0.1&&!blind){ ctx.font=`900 ${16+o.sus*8|0}px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='rgba(0,0,0,.7)'; const s=o.sus>0.7?'!':'?'; ctx.strokeText(s,x,hy-40); ctx.fillStyle=o.sus>0.7?'#ff6a3a':'#ffe08a'; ctx.fillText(s,x,hy-40); }
  if(blind){ ctx.font=`800 12px ${UIF}`; ctx.textAlign='center'; ctx.fillStyle='rgba(255,240,200,.85)'; ctx.fillText('z',x+12,hy-30+Math.sin(t*3)*3); ctx.fillText('z',x+20,hy-42+Math.sin(t*3+1)*3); } }
function xbDrawLever(o,t){ const A=AREA, st=xbLensStop(A), x=o.x, y=o.y, oc=xbOL(), on=o.dir==='run'?!st:st===o.dir, a=(on?0.7:-0.7)+(o.pull>0?Math.sin(o.pull*9)*0.1:0);
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x+2,y+6,18,7,0,0,TAU); ctx.fill();
  ctx.fillStyle=oc; rrect(ctx,x-15,y-14,30,20,5); ctx.fill(); ctx.fillStyle='#8a6a3a'; rrect(ctx,x-12,y-11,24,14,4); ctx.fill();
  ctx.translate(x,y-8); ctx.rotate(a); ctx.strokeStyle=oc; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-30); ctx.stroke(); ctx.strokeStyle='#c8ccd4'; ctx.lineWidth=3.5; ctx.stroke();
  ctx.fillStyle=oc; ctx.beginPath(); ctx.arc(0,-31,7,0,TAU); ctx.fill(); ctx.fillStyle=o.dir==='run'?'#6ad06a':'#e84a3a'; ctx.beginPath(); ctx.arc(0,-31,5,0,TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.font=`900 13px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle=oc; const lab=o.dir==='run'?'RUN':o.dir.toUpperCase(); ctx.strokeText(lab,x,y+24); ctx.fillStyle=on?'#ffe08a':'#f6ecd8'; ctx.fillText(lab,x,y+24); ctx.restore();
  if(on) glowAt(x,y-20,24,'255,220,120',0.35); }
function xbDrawHousing(o,t){ const A=AREA, x=o.x, y=o.y, oc=xbOL(), a=xbLensAng(A), st=xbLensStop(A);
  drawSprite(xbSpr('housing',76,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4,40,66,18,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy+22,62,22,0,0,TAU); },'#8a6a3a',{r:50}); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy+12,52,16,0,0,TAU); },'#b8873e',{r:44});
      for(let n=0;n<12;n++){ const an=n/12*TAU; g.fillStyle='#5a3e22'; g.fillRect(Math.cos(an)*54-3,22+Math.sin(an)*19-2,6,4); } }),x,y-6,1,0);
  ctx.save(); ctx.translate(x,y-34); const sx=Math.cos(a), sy=Math.sin(a)*0.45;
  ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(0,0,30,40,0,0,TAU); ctx.fill(); ctx.fillStyle='#d8a848'; ctx.beginPath(); ctx.ellipse(0,0,27,37,0,0,TAU); ctx.fill();
  const lx=sx*10, ly=sy*14; ctx.fillStyle='#e8f4ff'; ctx.beginPath(); ctx.ellipse(lx,ly-4,18*(0.55+0.45*Math.abs(sx)),26,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(150,190,230,.8)'; ctx.lineWidth=1.5; for(let r=6;r<22;r+=5){ ctx.beginPath(); ctx.ellipse(lx,ly-4,r*(0.55+0.45*Math.abs(sx)),r*1.3,0,0,TAU); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation='lighter'; const bx=x+Math.cos(a)*40, by=y-34+Math.sin(a)*22; ctx.strokeStyle='rgba(255,236,170,.6)'; ctx.lineWidth=16; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y-34); ctx.lineTo(x+Math.cos(a)*120,y-34+Math.sin(a)*70); ctx.stroke(); glowAt(bx,by,40,'255,236,170',0.6); ctx.restore();
  ctx.save(); ctx.font=`900 12px ${UIF}`; ctx.textAlign='center'; ctx.fillStyle=st?'#ffe08a':'#e8dcc0'; ctx.strokeStyle=oc; ctx.lineWidth=3; const s=st?simplify(S(`STOPPED: ${st.toUpperCase()}`,`STOPPED: ${st.toUpperCase()}`)):simplify(S('TURNING','TURNING')); ctx.strokeText(s,x,y+42); ctx.fillText(s,x,y+42); ctx.restore(); }
function xbDrawLamp(o,t){ const x=o.x, y=o.y, oc=xbOL(), lit=xbLampLit();
  drawSprite(xbSpr('lampbase',70,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4,46,64,16,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.moveTo(-50+dx,48+dy); q.lineTo(-40+dx,10+dy); q.lineTo(40+dx,10+dy); q.lineTo(50+dx,48+dy); q.closePath(); },'#b8873e',{r:46});
      g.fillStyle='#5a3e22'; for(let n=0;n<5;n++) g.fillRect(-36+n*18,22,8,16); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy+10,44,10,0,0,TAU); },'#d8a848',{r:40}); }),x,y-14,1,0);
  ctx.save(); ctx.translate(x,y-66);
  ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(0,0,38,46,0,0,TAU); ctx.fill(); const gl=lit?'#fff6d6':'#9aa6b8'; ctx.fillStyle=gl; ctx.beginPath(); ctx.ellipse(0,0,35,43,0,0,TAU); ctx.fill();
  ctx.strokeStyle=lit?'rgba(255,214,120,.9)':'rgba(120,140,170,.9)'; ctx.lineWidth=2; for(let r=8;r<40;r+=7){ ctx.beginPath(); ctx.ellipse(0,0,r*0.82,r,0,0,TAU); ctx.stroke(); }
  ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(-34,-40); ctx.lineTo(0,-66); ctx.lineTo(34,-40); ctx.closePath(); ctx.fill(); ctx.fillStyle='#c8463a'; ctx.beginPath(); ctx.moveTo(-30,-41); ctx.lineTo(0,-62); ctx.lineTo(30,-41); ctx.closePath(); ctx.fill();
  ctx.restore();
  if(lit){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-66,90,'255,226,150',0.7); const a=t*TAU/6; ctx.strokeStyle='rgba(255,236,170,.35)'; ctx.lineWidth=60; ctx.lineCap='round'; for(const s of [0,Math.PI]){ ctx.beginPath(); ctx.moveTo(x,y-66); ctx.lineTo(x+Math.cos(a+s)*420,y-66+Math.sin(a+s)*220); ctx.stroke(); } ctx.restore(); }
  else glowAt(x,y-66,30,'255,214,110',0.2+0.15*Math.sin(t*2)); }
function xbDrawGull(o,t){ const x=o.x, y=o.y, oc=xbOL(), h=Math.sin(t*2.2)*1.5, look=Math.sin(t*0.7)>0?1:-1;
  for(let n=0;n<12;n++){ const a=n*2.1, r=4+n*1.6; ctx.save(); ctx.translate(x+Math.cos(a)*r,y+6+Math.sin(a)*r*0.4); ctx.rotate(a); ctx.fillStyle=oc; rrect(ctx,-8,-2.2,16,4.4,2); ctx.fill(); ctx.fillStyle='#d8dce4'; rrect(ctx,-7,-1.4,14,2.8,1.4); ctx.fill(); ctx.fillStyle='#eef2f8'; ctx.beginPath(); ctx.ellipse(7,0,3,2.2,0,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(x,y-14+h); ctx.scale(look,1); ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(0,0,15,11,0,0,TAU); ctx.fill(); ctx.fillStyle='#f4f4f6'; ctx.beginPath(); ctx.ellipse(0,0,13,9.5,0,0,TAU); ctx.fill(); ctx.fillStyle='#9aa0aa'; ctx.beginPath(); ctx.ellipse(-4,-1,9,6,0.2,0,TAU); ctx.fill();
  ctx.fillStyle=oc; ctx.beginPath(); ctx.arc(9,-9,7.5,0,TAU); ctx.fill(); ctx.fillStyle='#f8f8fa'; ctx.beginPath(); ctx.arc(9,-9,6.2,0,TAU); ctx.fill(); ctx.fillStyle='#f2b23a'; ctx.beginPath(); ctx.moveTo(14,-9); ctx.lineTo(21,-7); ctx.lineTo(14,-6); ctx.closePath(); ctx.fill(); ctx.fillStyle='#1a1418'; ctx.beginPath(); ctx.arc(11,-11,1.6,0,TAU); ctx.fill();
  ctx.strokeStyle='#1a1418'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(8,-14); ctx.lineTo(13,-12.5); ctx.stroke(); ctx.restore(); }
function xbDrawSeal(o,t){ if(o.melt>=1) return; const x=o.stair.x, y=o.stair.y, a=1-o.melt, oc=xbOL(); ctx.save(); ctx.globalAlpha=a;
  if(o.kind==='boss'){ ctx.fillStyle=oc; rrect(ctx,x-30,y-34,60,54,6); ctx.fill(); ctx.fillStyle='#4a4652'; rrect(ctx,x-27,y-31,54,48,5); ctx.fill(); ctx.strokeStyle='#8a8692'; ctx.lineWidth=3; for(let n=-2;n<=2;n++){ ctx.beginPath(); ctx.moveTo(x+n*10,y-30); ctx.lineTo(x+n*10,y+16); ctx.stroke(); }
    ctx.fillStyle=oc; ctx.beginPath(); ctx.arc(x,y-6,12,0,TAU); ctx.fill(); ctx.fillStyle='#d8a848'; ctx.beginPath(); ctx.arc(x,y-6,10,0,TAU); ctx.fill(); ctx.fillStyle='#ff7a3a'; ctx.beginPath(); ctx.moveTo(x,y-14); ctx.quadraticCurveTo(x+7,y-6,x,y+1); ctx.quadraticCurveTo(x-7,y-6,x,y-14); ctx.fill();
    if(hasBKey(AREA)) glowAt(x,y-6,34,'255,200,110',0.45+0.2*Math.sin(t*4)); }
  else if(o.kind==='cocoon'){ ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(x,y-8,30,26,0,0,TAU); ctx.fill(); ctx.fillStyle='#e8e2f0'; ctx.beginPath(); ctx.ellipse(x,y-8,27,23,0,0,TAU); ctx.fill(); ctx.strokeStyle='#b4aac8'; ctx.lineWidth=1.4; for(let n=0;n<6;n++){ ctx.beginPath(); ctx.moveTo(x-26,y-26+n*8); ctx.quadraticCurveTo(x,y-30+n*8,x+26,y-22+n*8); ctx.stroke(); } }
  else { ctx.fillStyle='rgba(150,110,230,.35)'; ctx.beginPath(); ctx.arc(x,y,30,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(200,170,255,.8)'; ctx.lineWidth=2; for(let n=0;n<3;n++){ ctx.beginPath(); ctx.arc(x,y,12+n*8+Math.sin(t*3+n)*2,0,TAU); ctx.stroke(); } }
  ctx.restore(); }

// ---------- 15. props: set dressing and look-at things (room field props:[[kind,c,r,{...}],...])
// {draw(o,t), col:{r}|{w,h,dy}, say, label, flat (drawn on the floor), wall (sorted behind figures), light:{r,i,dy,fire}, when()}
const xbP=(key,R,fn)=>xbSpr(key,R,fn);
const XB_PROP={
  crate:{col:{w:40,h:34,dy:-2},say:S('Crates of lamp wicks, glass chimneys and one very old sandwich. Agatha labels everything. The sandwich is labeled "NO."','Crates of lamp wicks. And one old sandwich.'),label:S('Look at the crates','Look at the crates'),
    draw(o){ drawSprite(xbP('crate'+(o.v%2),26,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-18,4,40,14); celFill(g,(q,dx,dy)=>{ q.rect(-19+dx,-20+dy,38,34); },o.v%2?'#b07a44':'#9a6a3a',{r:22}); g.strokeStyle='#5a3a1a'; g.lineWidth=2.4; g.strokeRect(-17,-18,34,30); g.beginPath(); g.moveTo(-17,-18); g.lineTo(17,12); g.moveTo(17,-18); g.lineTo(-17,12); g.stroke(); g.fillStyle='rgba(255,255,255,.2)'; g.fillRect(-17,-18,34,4); }),o.x,o.y-8,1,0); }},
  barrel:{col:{r:15},say:S('A barrel of lamp oil. It smells like the lamp shop in Emberhollow.','A barrel of lamp oil.'),label:S('Look at the barrel','Look at the barrel'),
    draw(o){ drawSprite(xbP('barrel',20,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,14,15,6,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy,14,17,0,0,TAU); },'#8a5a2e',{r:16}); g.strokeStyle='#4a4a52'; g.lineWidth=2.4; for(const yy of [-8,6]){ g.beginPath(); g.ellipse(0,yy,14,4,0,0,TAU); g.stroke(); } g.fillStyle='#c8a868'; g.beginPath(); g.ellipse(0,-15,10,4,0,0,TAU); g.fill(); }),o.x,o.y-10,1,0); }},
  net:{flat:true,draw(o){ ctx.save(); ctx.translate(o.x,o.y); ctx.fillStyle='rgba(60,40,20,.35)'; ctx.beginPath(); ctx.ellipse(2,4,30,14,0.2,0,TAU); ctx.fill(); ctx.strokeStyle='#8a7a5a'; ctx.lineWidth=1.4; for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(-26,i*4); ctx.quadraticCurveTo(0,i*4+6,26,i*4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i*8,-12); ctx.lineTo(i*8+4,12); ctx.stroke(); } ctx.fillStyle='#d8b060'; for(const [x,y] of [[-20,-6],[14,8],[22,-4]]){ ctx.beginPath(); ctx.arc(x,y,3,0,TAU); ctx.fill(); } ctx.restore(); }},
  coil:{flat:true,draw(o){ ctx.save(); ctx.translate(o.x,o.y); ctx.strokeStyle=xbOL(); ctx.lineWidth=6; for(let r=6;r<=16;r+=5){ ctx.beginPath(); ctx.ellipse(0,0,r,r*0.6,0,0,TAU); ctx.stroke(); } ctx.strokeStyle='#c8a46a'; ctx.lineWidth=3.4; for(let r=6;r<=16;r+=5){ ctx.beginPath(); ctx.ellipse(0,0,r,r*0.6,0,0,TAU); ctx.stroke(); } ctx.restore(); }},
  rug:{flat:true,draw(o){ ctx.save(); ctx.translate(o.x,o.y); ctx.fillStyle=xbOL(); rrect(ctx,-58,-32,116,64,14); ctx.fill(); ctx.fillStyle='#8a3a3a'; rrect(ctx,-55,-29,110,58,12); ctx.fill(); ctx.strokeStyle='#e8c070'; ctx.lineWidth=3; rrect(ctx,-46,-21,92,42,8); ctx.stroke(); ctx.fillStyle='#e8c070'; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(10,0); ctx.lineTo(0,12); ctx.lineTo(-10,0); ctx.closePath(); ctx.fill(); ctx.restore(); }},
  web:{flat:true,draw(o){ ctx.save(); ctx.translate(o.x,o.y); ctx.strokeStyle='rgba(235,230,245,.55)'; ctx.lineWidth=1.2; for(let a=0;a<8;a++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a*0.785)*30,Math.sin(a*0.785)*22); ctx.stroke(); } for(let r=8;r<=28;r+=7){ ctx.beginPath(); for(let a=0;a<=8;a++){ const x=Math.cos(a*0.785)*r, y=Math.sin(a*0.785)*r*0.73; if(a) ctx.lineTo(x,y); else ctx.moveTo(x,y); } ctx.stroke(); } ctx.restore(); }},
  bunk:{col:{w:96,h:44,dy:0},say:S('Agatha\'s bunk. The blanket has little lighthouses stitched on it, and one parrot, stitched badly. Squawk probably helped.','Agatha\'s bed. Little lighthouses on the blanket.'),label:S('Look at the bunk','Look at the bunk'),
    draw(o){ drawSprite(xbP('bunk',56,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-48,4,100,22); celFill(g,(q,dx,dy)=>{ q.rect(-50+dx,-22+dy,100,44); },'#7a4a24',{r:40}); g.fillStyle='#f2ead8'; g.fillRect(-46,-18,24,34); g.fillStyle='#4a6a9a'; g.fillRect(-20,-18,64,34); g.fillStyle='#e8c070'; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-10+i*15,-8); g.lineTo(-6+i*15,4); g.lineTo(-14+i*15,4); g.closePath(); g.fill(); } g.fillStyle='#c8463a'; for(let i=0;i<4;i++) g.fillRect(-12+i*15,-2,4,3); }),o.x,o.y-4,1,0); }},
  portrait:{wall:true,say:S('A painting of a young keeper with a lantern, and a young green parrot on her shoulder. Written underneath: "Agatha and Squawk, first night on the job. Squawk said it was big as a house."','Young Agatha and young Squawk. Squawk said it was big as a house.'),label:S('Look at the painting','Look at the painting'),
    draw(o){ drawSprite(xbP('portrait',24,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-20+dx,-24+dy,40,32); },'#b8873e',{r:20}); g.fillStyle='#2e3e5a'; g.fillRect(-16,-20,32,24); g.fillStyle='#e0b090'; g.beginPath(); g.arc(-4,-8,5,0,TAU); g.fill(); g.fillStyle='#5a3a22'; g.fillRect(-9,-3,10,8); g.fillStyle='#4ac04a'; g.beginPath(); g.arc(4,-11,3.4,0,TAU); g.fill(); g.fillStyle='#e84a3a'; g.fillRect(3,-9,3,4); g.fillStyle='#ffd27a'; g.beginPath(); g.arc(9,-2,2.6,0,TAU); g.fill(); }),o.x,o.y-30,1,0); }},
  diary:{col:{r:18},say:S('Agatha\'s diary, open on the table. "A girl in a grey cloak came asking about Mother Pearl. Nice manners. Terrible boots."','Agatha\'s diary: "A girl in a grey cloak came. Nice manners. Terrible boots."'),label:S('Read the diary','Read the diary'),
    draw(o){ drawSprite(xbP('diary',22,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,12,18,6,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy,18,12,0,0,TAU); },'#8a5a30',{r:16}); g.fillStyle='#f4ead2'; g.fillRect(-10,-8,9,11); g.fillRect(1,-8,9,11); g.strokeStyle='rgba(80,50,20,.6)'; g.lineWidth=0.8; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-8,-5+i*2.6); g.lineTo(-3,-5+i*2.6); g.moveTo(3,-5+i*2.6); g.lineTo(8,-5+i*2.6); g.stroke(); } }),o.x,o.y-6,1,0); }},
  shelf:{wall:true,col:{w:70,h:20,dy:-6},say:S('Shelves of spare lenses, wicks and tins of polish. Everything is very, very shiny.','Spare lenses and polish. Very shiny.'),label:S('Look at the shelf','Look at the shelf'),
    draw(o){ drawSprite(xbP('shelf',40,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-36+dx,-34+dy,72,40); },'#7a4a24',{r:30}); g.fillStyle='#4a2a12'; g.fillRect(-32,-30,64,14); g.fillRect(-32,-12,64,14); for(let i=0;i<5;i++){ g.fillStyle=['#cfe6ff','#ffd27a','#c8a868','#e8f4ff','#b8873e'][i]; g.beginPath(); g.arc(-24+i*12,-22,4,0,TAU); g.fill(); g.fillRect(-27+i*12,-8,7,8); } }),o.x,o.y-14,1,0); }},
  window:{wall:true,say:S('Through the round window: the sea, all the way to the edge of the world. A gull looks back in at you.','The sea, through a round window.'),label:S('Look out of the window','Look out'),
    draw(o,t){ ctx.save(); ctx.translate(o.x,o.y-30); ctx.fillStyle=xbOL(); ctx.beginPath(); ctx.arc(0,0,20,0,TAU); ctx.fill(); ctx.fillStyle='#b8873e'; ctx.beginPath(); ctx.arc(0,0,18,0,TAU); ctx.fill(); const g=ctx.createLinearGradient(0,-15,0,15); g.addColorStop(0,AREA&&AREA.def.theme==='c_shadow'?'#1a1640':'#7ac0e8'); g.addColorStop(0.55,AREA&&AREA.def.theme==='c_shadow'?'#2a2458':'#bfe6ff'); g.addColorStop(0.56,'#2a76aa'); g.addColorStop(1,'#1a5a88'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,14,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-8+Math.sin(t)*2,5); ctx.lineTo(-2+Math.sin(t)*2,5); ctx.stroke(); ctx.strokeStyle=xbOL(); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(14,0); ctx.moveTo(0,-14); ctx.lineTo(0,14); ctx.stroke(); ctx.restore(); }},
  plaque:{wall:true,say:S('A brass plaque, polished by a thousand years of thumbs: "STOP LEVERS. N: WATCH. E: NEST. S: GALLERY. W: SEA. RUN: ROUND AND ROUND. - P."','A plaque: "N: WATCH. E: NEST. S: GALLERY. W: SEA."'),label:S('Read the plaque','Read the plaque'),
    draw(o){ drawSprite(xbP('plaque',30,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-28+dx,-30+dy,56,26); },'#d8a848',{r:22}); g.fillStyle='#5a3e22'; g.font='900 7px sans-serif'; g.textAlign='center'; g.fillText('N WATCH  E NEST',0,-19); g.fillText('S GALLERY  W SEA',0,-10); }),o.x,o.y-26,1,0); }},
  lensstand:{draw(o,t){ /* the minilens: Pearl's little lens (drawn with the shrine) */ }},
  rod:{col:{r:10},say:S('A lightning rod, taller than a mast, with a brass ring bolted to it. Pearl put it there "for swinging on, obviously."','A tall rod with a ring on it. For swinging!'),label:S('Look at the lightning rod','Look at the rod'),
    draw(o,t){ const x=o.x, y=o.y, oc=xbOL(); ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x+2,y+4,12,5,0,0,TAU); ctx.fill(); ctx.fillStyle=oc; ctx.fillRect(x-4,y-120,8,124); ctx.fillStyle='#b8b0a0'; ctx.fillRect(x-2.5,y-119,5,122); ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(x,y-140); ctx.lineTo(x+6,y-118); ctx.lineTo(x-6,y-118); ctx.closePath(); ctx.fill(); ctx.fillStyle='#e8c060'; ctx.beginPath(); ctx.moveTo(x,y-136); ctx.lineTo(x+4,y-119); ctx.lineTo(x-4,y-119); ctx.closePath(); ctx.fill(); ctx.restore(); }},
  lifebelt:{wall:true,say:S('A life ring painted red and white. "PROPERTY OF THE SPINNING LIGHTHOUSE. IF FOUND IN THE SEA, YOU ARE TOO."','A life ring. "If found in the sea, you are too."'),label:S('Look at the life ring','Look at the ring'),
    draw(o){ drawSprite(xbP('lifebelt',18,g=>{ for(let i=0;i<8;i++){ g.fillStyle=i%2?'#f6f0e4':'#c8463a'; g.beginPath(); g.moveTo(0,-10); g.arc(0,-10,14,i*TAU/8,(i+1)*TAU/8); g.closePath(); g.fill(); } g.fillStyle=AREA&&AREA.def.theme==='c_shadow'?'#2a2440':'#c49a6a'; g.beginPath(); g.arc(0,-10,7,0,TAU); g.fill(); }),o.x,o.y-26,1,0); }},
  // the Spire
  carving:{wall:true,say:S('Carvings in a very old script cover the black glass. It looks like moons. Lots of moons. Full ones, thin ones, and one with a bite out of it.','Old carvings. Lots of moons. One has a bite out of it.'),label:S('Look at the carvings','Look at the carvings'),
    draw(o,t){ ctx.save(); ctx.translate(o.x,o.y-34); ctx.strokeStyle='rgba(200,180,255,.55)'; ctx.lineWidth=2; for(let i=0;i<4;i++){ const x=-30+i*20; ctx.beginPath(); ctx.arc(x,0,7,0,TAU); ctx.stroke(); ctx.fillStyle='rgba(200,180,255,.45)'; ctx.beginPath(); ctx.arc(x+(i-1.5)*2.5,0,7,-Math.PI/2,Math.PI/2,i%2===0); ctx.fill(); } glowAt(0,0,40,'170,140,255',0.12+0.05*Math.sin(t*2)); ctx.restore(); }},
  moonmap:{wall:true,say:S('A map carved into the glass: islands far to the east, under a moon. And under the sea, drawn very small, a whole city, with a moon above it too.','A map: islands in the east. A city under the sea, with a moon above it.'),label:S('Look at the moon map','Look at the map'),
    draw(o,t){ ctx.save(); ctx.translate(o.x,o.y-36); ctx.fillStyle=xbOL(); rrect(ctx,-40,-24,80,46,6); ctx.fill(); ctx.fillStyle='#2a2448'; rrect(ctx,-37,-21,74,40,5); ctx.fill(); ctx.strokeStyle='rgba(210,195,255,.75)'; ctx.lineWidth=1.6; for(const [x,y,r] of [[14,-6,5],[24,2,3],[6,6,4]]){ ctx.beginPath(); ctx.ellipse(x,y,r,r*0.6,0,0,TAU); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-34,4); ctx.lineTo(34,4); ctx.stroke(); for(let i=0;i<4;i++) ctx.strokeRect(-26+i*7,8,4,6); ctx.fillStyle='#fff6d0'; ctx.beginPath(); ctx.arc(-18,-10,5,0,TAU); ctx.fill(); ctx.fillStyle='#2a2448'; ctx.beginPath(); ctx.arc(-16,-11,4,0,TAU); ctx.fill(); glowAt(0,0,50,'190,170,255',0.15); ctx.restore(); }},
  bob:{when:()=>!!(G.quests&&G.quests.c_bob&&G.quests.c_bob.done),col:{r:16},say:S('"We are Bob. We are holding the door. Nothing follows you in. Except you. You may follow you in." (The third Bob waves. His plume is blue.)','"We are Bob. We hold the door. Go on in!"'),label:S('Talk to Bob','Talk to Bob'),
    draw(o,t){ const x=o.x, y=o.y, oc=xbOL(), bob=Math.sin(t*2+o.v)*1.2, blue=o.v===2; ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x+2,y+4,14,6,0,0,TAU); ctx.fill();
      ctx.fillStyle=oc; rrect(ctx,x-12,y-40+bob,24,40,6); ctx.fill(); ctx.fillStyle='#a8acb8'; rrect(ctx,x-10,y-38+bob,20,36,5); ctx.fill(); ctx.fillStyle='#7a7e8a'; ctx.fillRect(x-10,y-22+bob,20,4);
      ctx.fillStyle=oc; ctx.beginPath(); ctx.arc(x,y-48+bob,11,0,TAU); ctx.fill(); ctx.fillStyle='#c8ccd8'; ctx.beginPath(); ctx.arc(x,y-48+bob,9,0,TAU); ctx.fill(); ctx.fillStyle='#ffd27a'; ctx.fillRect(x-5,y-50+bob,3,3); ctx.fillRect(x+2,y-50+bob,3,3);
      ctx.fillStyle=blue?'#4a8ae8':'#c8463a'; ctx.beginPath(); ctx.ellipse(x,y-61+bob,4,8,0.3,0,TAU); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+14,y-46+bob); ctx.lineTo(x+14,y+2); ctx.stroke(); ctx.strokeStyle='#c8ccd8'; ctx.lineWidth=1.6; ctx.stroke(); ctx.restore(); }},
  shard:{flat:true,draw(o,t){ ctx.save(); ctx.translate(o.x,o.y); for(let i=0;i<5;i++){ const a=i*1.3+o.v, r=6+i*3; ctx.fillStyle=i%2?'rgba(40,30,70,.9)':'rgba(120,100,180,.8)'; ctx.beginPath(); ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r*0.6); ctx.lineTo(Math.cos(a+0.4)*(r+7),Math.sin(a+0.4)*(r+7)*0.6); ctx.lineTo(Math.cos(a+0.7)*r,Math.sin(a+0.7)*r*0.6); ctx.closePath(); ctx.fill(); } ctx.restore(); }},
  vlamp:{wall:true,light:{r:170,i:0.4,dy:40},draw(o,t){ const x=o.x, y=o.y-40, oc=xbOL(); ctx.save(); ctx.fillStyle=oc; ctx.fillRect(x-3,y-4,6,18); ctx.beginPath(); ctx.ellipse(x,y-8,9,12,0,0,TAU); ctx.fill(); ctx.fillStyle='#8a6ad8'; ctx.beginPath(); ctx.ellipse(x,y-8,6.5,9.5,0,0,TAU); ctx.fill(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-8,30,'170,120,255',0.5+0.1*Math.sin(t*3+x)); ctx.restore(); }},
  statue:{col:{r:20},say:S('A statue of a great moth, carved from black glass. It has two painted eyes on each wing. They are definitely looking at you.','A glass moth statue. Its painted eyes look at you.'),label:S('Look at the statue','Look at the statue'),
    draw(o,t){ drawSprite(xbP('mstatue',40,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(3,30,26,8,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.rect(-16+dx,14+dy,32,16); },'#3a3456',{r:16}); for(const s of [-1,1]){ celFill(g,(q,dx,dy)=>{ q.ellipse(s*15+dx,-6+dy,15,20,s*0.4,0,TAU); },'#4a4270',{r:18}); g.fillStyle='#d8c8ff'; g.beginPath(); g.arc(s*16,-8,5,0,TAU); g.fill(); g.fillStyle='#8a5ae0'; g.beginPath(); g.arc(s*16,-8,2.6,0,TAU); g.fill(); } celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-4+dy,6,18,0,0,TAU); },'#2e2848',{r:10}); }),o.x,o.y-20,1,0); }},
  stair:{flat:true,draw(o,t){ /* a carved arrow on the floor pointing at the way on */ ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.a||0); ctx.fillStyle='rgba(255,236,190,.25)'; ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(-6,-10); ctx.lineTo(-2,0); ctx.lineTo(-6,10); ctx.closePath(); ctx.fill(); ctx.restore(); }}
};
// the Lens Shrine: Pearl's little lens on a brass stand (the gift shrine's own look in our dungeons)
{ const base=FL.tv; FL.tv=(o,t)=>{ if(o.kind==='shrine'&&AREA&&AREA.xb){ xbDrawLens(o.ref||o,t); return; } return base(o,t); }; }
function xbDrawLens(q,t){
  const x=q.x, y=q.vis?q.vis.y:q.y, oc=xbOL(), gifted=hasAbil('shadow'), A=AREA, L=A&&A.xb?A.xb.lens.find(z=>z.L.mini):null, a=L&&L.beam?L.beam.a:t;
  if(typeof tDais==='function') tDais(x,y+10,'c_light',1.1);
  ctx.save(); ctx.fillStyle=oc; ctx.fillRect(x-5,y-40,10,44); ctx.fillStyle='#b8873e'; ctx.fillRect(x-3,y-39,6,42);
  ctx.translate(x,y-48); ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(0,0,19,22,0,0,TAU); ctx.fill(); ctx.fillStyle='#d8a848'; ctx.beginPath(); ctx.ellipse(0,0,17,20,0,0,TAU); ctx.fill();
  const sx=Math.cos(a); ctx.fillStyle='#eaf6ff'; ctx.beginPath(); ctx.ellipse(sx*3,0,12*(0.5+0.5*Math.abs(sx)),15,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(140,180,220,.9)'; ctx.lineWidth=1.3; for(let r=4;r<14;r+=4){ ctx.beginPath(); ctx.ellipse(sx*3,0,r*(0.5+0.5*Math.abs(sx)),r*1.2,0,0,TAU); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-48,gifted?40:70,'255,226,150',gifted?0.35:0.6+0.15*Math.sin(t*3)); ctx.restore();
  if(!gifted&&Math.random()<0.15) emit(x+rand(-14,14),y-48+rand(-14,14),1,{col:'255,240,200',smin:10,smax:40,lmin:.6,lmax:1.1,zmin:1.2,zmax:2.4,rise:14});
}
// resting by the lens once the gift is taken: Pearl's words, not Ember's
{ const base=trialObjAct; trialObjAct=function(o){ const A=AREA;
    if(A&&A.xb&&o&&o.tobj==='shrine'&&hasAbil('shadow')){ player.hp=player.maxHp; player.potions=player.potionsMax; SFX.play('shrine'); xbSay(S('Pearl\'s little lens turns and turns. Its light is warm on your scales. (Health and draughts restored.)','The lens light is warm. (You feel better.)')); return true; }
    return base.apply(this,arguments); }; }

// ---------- 16. The Spinning Lighthouse (bible 5.3): four floors up a white and red tower, one turning beam
// Floors go UP (1F to 4F), so every stair names where it goes (room up/down) and the drop hole names its floor (below).
// Links (append only): F1 a-b moth, a-l open, b-c open, b-d crack; F2 e-f gate:e, e-m lock, f-g shadow;
// F3 h-i gate:h, i-j open, i-k shadow; F4 B-z gate:B. Stairs: b ^ e (sealed by the Silkspinner's silk until c is won),
// g ^ h, k ^ B (the Boss Key's grate), plus a drop hole in h back down to g's near side.
const xbStrip=id=>()=>{ const A=AREA; return !!(A&&A.xb&&A.rooms&&A.rooms[id]&&xbBeamS(A,A.rooms[id])!=null); };
function xbTplStair(tpl,c,r,ch){ const t=tpl.slice(); t[r]=t[r].slice(0,c)+ch+t[r].slice(c+1); return t; }
defineDungeon('c_lighthouse',{name:S('The Spinning Lighthouse','The Spinning Lighthouse'),level:12,theme:'c_light',seed:1207,save:'c_lighthouse',dark:0.6,
  abil:'shadow',abilName:S('Shadow Dash','Shadow Dash'),dunKind:S('A lighthouse','A lighthouse'),story:c1DunStory('c_lighthouse'),
  floors:[
  {id:'1',name:S('The Base','The Base'),map:{rooms:{
    a:xbR({at:[1,1],kind:'start',noPots:true,lens:{dir:'s',slot:[9,-1],arc:[30,150]},xbLights:[[7,5,240,0.3]],
      props:[['shelf',3,0],['lifebelt',11,0],['window',13,0],['crate',12,8],['crate',13,8],['crate',12,9],['barrel',1,9],['barrel',2,9],['net',4,9],['coil',10,9]],
      tpl:['...............',
           '.C...........C.',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '..C............',
           '...............',
           '...............']}),
    l:xbR({at:[0,1],kind:'free',loot:['compass+treat','coins'],noPots:true,lens:{dir:'w',slot:[14,-1],arc:[105,165]},xbLights:[[3,2,200,0.3],[11,3,180,0.35]],
      props:[['bunk',3,2],['rug',7,6],['diary',11,3],['portrait',6,0],['window',2,0],['shelf',10,0]],
      tpl:['...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...........X...',
           '...............',
           '.C.............',
           '...............']}),
    b:xbR({at:[1,0],kind:'fight',dark:true,foes:[['c_moth',6]],solveOnClear:true,reward:'key',lockFight:true,noPots:true,noDecor:true,
      up:'c_lighthouse_2',seal:{kind:'cocoon',room:'c',dir:'up'},
      tpl:['...............',
           '.Z.....<.....Z.',
           '...............',
           '......###......',
           '.....#####.....',
           '.....#####.....',
           '.....#####.....',
           '......###......',
           '...............',
           '.Z.....X.....Z.',
           '...............']}),
    c:xbR({at:[0,0],kind:'miniboss',boss:['c_silkspinner',S('The Silkspinner','The Silkspinner')],dim:0.85,noPots:true,noDecor:true,
      lens:{dir:'w',slot:[7,-1],arc:[35,145]},
      tpl:['...............',
           '.G...........G.',
           '...............',
           '...#.......#...',
           '...............',
           '...............',
           '...............',
           '...#.......#...',
           '.......G.......',
           '.G...........G.',
           '...............']}),
    d:xbR({at:[2,0],kind:'secret',loot:['coins'],page:5,gull:[10,3],noPots:true,xbLights:[[10,3,220,0.45],[6,5,160,0.4]],
      tpl:['#####.....#####',
           '####.......####',
           '###.........###',
           '##...........##',
           '..............#',
           '......q.......#',
           '..............#',
           '##...........##',
           '###.........###',
           '####.......####',
           '#####.....#####']})},
    links:[['a','b','moth'],['a','l','open'],['b','c','open'],['b','d','crack']]}},
  {id:'2',name:S('The Middle','The Middle'),map:{rooms:{
    e:xbR({at:[1,1],kind:'beam',down:'c_lighthouse',lens:{dir:'s'},slotBeam:{at:[15,8],dir:'w'},rot:{'11,8':0,'11,1':0,'1,1':1},mass:{a:[0,4],b:[0,6]},
      noPots:true,xbLights:[[7,6,240,0.3],[12,1,160,0.3]],props:[['lifebelt',14,3]],
      tpl:['..&:......{{{{.',
           '.m.:......{m{{.',
           '...:......{{{{.',
           '::::...........',
           '...............',
           '.K...@.........',
           '...............',
           '...............',
           '...........m...',
           '.......>.......',
           '...............']}),
    m:xbR({at:[1,0],kind:'free',loot:['heart'],foes:[['c_moth',2]],noPots:true,noDecor:true,xbLights:[[7,9,200,0.3],[7,3,160,0.25]],
      tpl:['#...)....)....#',
           '#X..)....)....#',
           '############..#',
           '#......)....E.#',
           '#......)......#',
           '#..############',
           '#.E....)......#',
           '#......)......#',
           '############..#',
           '#........E....#',
           '#.............#']}),
    f:xbR({at:[0,1],kind:'shrine',minilens:{at:[7,5],arc:[215,325],per:5},xbLights:[[7,5,260,0.4]],noPots:true,
      tpl:['####.......####',
           '##...........##',
           '#.............#',
           '#..g.......g..#',
           '...............',
           '.......D.......',
           '...............',
           '#..g.......g..#',
           '#.............#',
           '##...........##',
           '####.......####']}),
    g:xbR({at:[0,0],kind:'free',foes:[['c_moth',3]],up:'c_lighthouse_3',void:'shaft',noPots:true,noDecor:true,
      lens:{dir:'w',slot:[-1,1],arc:[-14,0]},shadows:[{a:[7,8],b:[7,2],w:1.5,on:xbStrip('g')}],rail:[[5,9],[5,6]],xbLights:[[7,9,200,0.3]],
      tpl:['###....<....###',
           '...............',
           '...............',
           ':::::::::::::::',
           ':::::::::::::::',
           ':::::::::::::::',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............']})},
    links:[['e','f','gate:e'],['e','m','lock'],['f','g','shadow']]}},
  {id:'3',name:S('The Top','The Top'),map:{rooms:{
    h:xbR({at:[0,0],kind:'lever',loot:['dmap'],down:'c_lighthouse_2',below:'c_lighthouse_2',noPots:true,noDecor:true,
      lens:{dir:'n',slot:[7,-1],arc:[40,140]},xbLights:[[7,5,200,0.25]],
      watch:[{at:[4,1],ang:90,swing:45,per:5,len:5,half:24},{at:[10,9],ang:270,swing:45,per:6,ph:0.5,len:5,half:24},{at:[13,5],ang:180,swing:35,per:4.5,ph:0.25,len:6,half:22}],
      tpl:['...............',
           '..,..#....,....',
           '...............',
           '..#...,,...#...',
           '...............',
           '......#X#......',
           '...............',
           '..#...,,...#...',
           '...............',
           '.>...,...#..,..',
           '.............0.']}),
    i:xbR({at:[1,0],kind:'free',housing:[7,5],spill:{dir:'s',to:'k'},noPots:true,noDecor:true,
      lensLevers:[{at:[7,1],dir:'n'},{at:[12,3],dir:'e'},{at:[10,9],dir:'s'},{at:[2,7],dir:'w'},{at:[3,1],dir:'run'}],props:[['plaque',11,0]],
      tpl:['##...........##',
           '#.............#',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '#.............#',
           '##...........##']}),
    j:xbR({at:[2,0],kind:'xbnest',nest:[7,5],loot:['bkey'],foes:[['c_moth',2]],noPots:true,
      lens:{dir:'e',slot:[-1,3],arc:[0,28],stopS:0},props:[['web',3,3],['web',11,2],['web',4,8],['web',12,7]],xbLights:[[7,5,180,0.2]],
      tpl:['...C.......C...',
           '.C.............',
           '...............',
           '...............',
           '...............',
           '.......X.......',
           '...............',
           '...............',
           '...........C...',
           '..C............',
           '...............']}),
    k:xbR({at:[1,1],kind:'free',foes:[['c_gull',2]],mothFree:true,void:'sea',restFall:true,noPots:true,noDecor:true,up:'c_lighthouse_4',seal:{kind:'boss',dir:'up'},
      props:[['rod',2,2]],xbLights:[[6,1,260,0.5],[13,5,220,0.45],[3,8,220,0.45],[12,8,200,0.4],[1,2,220,0.45]],
      tpl:['.<.#.....%%%%%%',
           '...#.....%%%%%%',
           '...#:::::::::..',
           '.&.::::::::::..',
           ':::::::::::::..',
           ':::::::::::::..',
           ':::::::::::::..',
           '..:::::::::::..',
           '......oooo.....',
           '......oooo.....',
           ':::::::::::::::']})},
    links:[['h','i','gate:h'],['i','j','open'],['i','k','shadow']]}},
  {id:'4',name:S('The Lamp','The Lamp'),map:{rooms:{
    B:xbR({at:[0,0],span:[2,2],kind:'boss',c1boss:'c_gloomwing',noPots:true,noDecor:true,down:'c_lighthouse_3',tpl:xbTplStair(C1_TPL.lamp,15,19,'>')}),
    z:xbR({at:[2,1],kind:'free',greatLamp:[7,4],say1:'c_light_end',noPots:true,noDecor:true,xbLights:[[7,4,320,0.45]],props:[['window',3,0],['window',11,0]],
      tpl:['...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '...............',
           '.......W.......',
           '...............',
           '...............']})},
    links:[['B','z','gate:B']]}}
  ]});

// ---------- 17. The Shadow Spire (bible 5.4): black glass, six floors (B1 the Undercroft, then 1F to 5F), everything at once
// Links (append only): B1 a-b open, a-c gate:b, b-l crack; 1F d-e lock, d-f open; 2F g-h open; 3F i-j gate:i.
// Stairs: c ^ d, e ^ g (the far end of the Grapple Garden), h ^ i, j ^ k (sealed until Shadow Ash falls), k ^ B (the
// Boss Key's grate). The whole Spire shares one water level (high at the start; the Sluice's two moon-wheels drain it).
defineDungeon('c_spire',{name:S('The Shadow Spire','The Shadow Spire'),level:13,theme:'c_shadow',seed:1313,save:'c_spire',dark:0.7,water:{start:2},
  dunKind:S('A black tower','A black tower'),story:c1DunStory('c_spire'),
  floors:[
  {id:'0',name:S('The Undercroft','The Undercroft'),map:{rooms:{
    a:xbR({at:[1,1],kind:'start',foes:[['c_husher',2]],foeZone:[0,0,14,1],noPots:true,
      props:[['carving',4,0],['carving',10,0],['bob',9,9],['bob',11,9],['bob',10,8,{v:2}],['vlamp',0,3],['vlamp',14,7]],xbLights:[[7,9,220,0.35],[1,1,180,0.3],[13,1,180,0.3]],
      tpl:['...............',
           '.Q...........Q.',
           '..a555aaaaaaa..',
           '..a555aaaaaaa..',
           '..a555aaaaaaa..',
           '..a555aaaaaaa..',
           '..a555aaaaaaa..',
           '..a555aaaaaaa..',
           '..a555.........',
           '..a555.........',
           '..a555.........']}),
    b:xbR({at:[0,1],kind:'xbsluice',wheelMoths:true,loot:['compass'],noPots:true,noDecor:true,
      props:[['vlamp',14,2],['vlamp',14,8],['carving',10,0]],xbLights:[[7,5,260,0.3],[13,8,160,0.3]],
      tpl:['...............',
           '{{{zzzzzzzzz...',
           '{{{zaaaaaaaz...',
           '{{{zaaaaaaaz...',
           '{M{zaaaaaaaz...',
           '{{{zaaaaaaaz...',
           '{{{zaaaaaaaz...',
           '{{{zaaaaaaaz...',
           '{{{zaaaXaaaz.M.',
           '{{{zzzzzzzzz...',
           '...............']}),
    l:xbR({at:[0,0],kind:'secret',loot:['ore','coins'],noPots:true,
      props:[['moonmap',7,0],['carving',4,0],['carving',10,0],['statue',2,5],['statue',12,5],['vlamp',1,3],['vlamp',13,3]],xbLights:[[7,4,260,0.45]],
      tpl:['##...........##',
           '#.............#',
           '#.............#',
           '#.............#',
           '#.............#',
           '#.............#',
           '#.............#',
           '#.............#',
           '#.............#',
           '##...........##',
           '###.........###']}),
    c:xbR({at:[2,1],kind:'free',loot:['skey'],up:'c_spire_1',void:'ink',noPots:true,noDecor:true,
      moon:[{pts:[[4,4],[4,8]],per:6},{pts:[[10,0],[10,3]],per:5,ph:0.4}],xbLights:[[7,6,200,0.3],[13,1,160,0.35],[1,5,160,0.3]],
      tpl:[';;;;;;...;;;...',
           ';;;;;;.,,???,X.',
           ';;;;;;;?;;;;...',
           ';;;;;;;?;;;;;;;',
           '...;;;.,..;;;;;',
           '...;;;....;;;;;',
           '..,???,...;;;;;',
           '...;;;..<.;;;;;',
           ';;;;;;....;;;;;',
           ';;;;;;;;;;;;;;;',
           ';;;;;;;;;;;;;;;']})},
    links:[['a','b','open'],['a','c','gate:b'],['b','l','crack']]}},
  {id:'1',name:S('The Hall of Moths','The Hall of Moths'),map:{rooms:{
    d:xbR({at:[1,0],kind:'fight',foes:[['c_husher',2],['c_moth',2],['c_tinman',1]],foeZone:[5,0,14,10],solveOnClear:true,lockFight:true,down:'c_spire',noPots:true,noDecor:true,say1:'c_spire_dark',
      creep:[{src:[[12,0],[14,5],[6,10],[5,0]],full:0.45},{src:[[3,0],[3,10]],mask:'rift',full:0.9,rate:[0.6,0.45,0.35]}],
      props:[['statue',7,0],['vlamp',14,2],['vlamp',14,8]],xbLights:[[9,5,240,0.25]],
      tpl:['..;;;..........',
           '..;;;.....Q..Q.',
           '..;;;..........',
           '..;;;..........',
           '..;;;..........',
           '..;;;..........',
           '..;;;..........',
           '..;;;..........',
           '..;;;..........',
           '..;;;..>..Q..Q.',
           '..;;;..........']}),
    e:xbR({at:[0,0],kind:'free',foes:[['c_moth',3]],mothFree:true,up:'c_spire_2',void:'sky',restFall:true,noPots:true,noDecor:true,posts:true,
      movers:[{a:[8,0],b:[8,8],w:2,h:2,speed:50,wait:1},{a:[4,8],b:[4,0],w:2,h:2,speed:50,wait:1}],xbLights:[[13,5,200,0.35],[1,5,200,0.35]],
      tpl:[':::::::::::::::',
           ':::::::::::::::',
           '...:::::::::...',
           '...:::::::::...',
           '.@.:::::::::.@.',
           '...:::::::::...',
           '...:::::::::...',
           '.<.:::::::::...',
           '...:::::::::...',
           ':::::::::::::::',
           ':::::::::::::::']}),
    f:xbR({at:[2,0],kind:'xbclone',loot:['dmap'],book:[2,9],noPots:true,noDecor:true,props:[['vlamp',14,2],['vlamp',14,8],['shard',11,4]],xbLights:[[7,5,240,0.35]],
      tpl:['...............',
           '...............',
           '...U.....U#....',
           '...............',
           '...............',
           '...U...R.......',
           '.......#.......',
           '...............',
           '............X..',
           '...............',
           '...............']})},
    links:[['d','e','lock'],['d','f','open']]}},
  {id:'2',name:S('The Moon Stair','The Moon Stair'),map:{rooms:{
    g:xbR({at:[1,0],kind:'free',foes:[['c_moth',3]],mothFree:true,down:'c_spire_1',void:'sky',restFall:true,noPots:true,noDecor:true,
      gust:{dir:[1,0],on:1.4,off:2.6,str:130},moon:[{pts:[[7,7],[7,1]],per:8}],xbLights:[[8,9,220,0.4],[1,2,200,0.35],[7,5,180,0.3]],
      tpl:['..........:::::',
           '..:::%%%%%:::::',
           '..::#%%%%%:::::',
           '..:::%%%%%:::::',
           '..:::%%%%%:::::',
           '..::#.....:::::',
           '..:::%%%%%:::::',
           '..:::%%%%%:::::',
           '::::#%%%%%:::::',
           '::::....>....::',
           '::::.........::']}),
    h:xbR({at:[0,0],kind:'xbgal',galEnd:[1,5],acc:['boomerang'],foes:[['c_moth',2]],up:'c_spire_3',noPots:true,noDecor:true,
      lanterns:[{piv:[10,2],span:[2,8],amp:2,per:3.5,hook:[9,0],away:-1.5},{piv:[4,2],span:[2,8],amp:2,per:4.2,ph:0.3,hook:[3,0],away:1.5}],
      props:[['vlamp',6,1],['vlamp',12,9]],xbLights:[[13,5,180,0.3],[1,4,160,0.3]],
      tpl:['###H#####H#####',
           '###.#####.#####',
           '..].]..]..].]..',
           '.<].]..]Q.].]..',
           '..].]..]..].]..',
           '..].]..]..].]..',
           '..].]..]..].]..',
           '..]Q]..]..].]..',
           '..].]..]..].]..',
           '###############',
           '###############']})},
    links:[['g','h','open']]}},
  {id:'3',name:S('The Hollow Core','The Hollow Core'),map:{rooms:{
    i:xbR({at:[0,0],span:[1,2],kind:'eyes',eyesHigh:true,fly:true,loot:['heart'],down:'c_spire_2',void:'shaft',restFall:true,noPots:true,noDecor:true,say1:'c_spire_core',
      xbLights:[[1,1,240,0.5],[12,5,200,0.4],[7,20,240,0.4],[7,8,160,0.25],[7,14,160,0.25]],
      tpl:['...::::::::::::',
           '.X.::::::::::::',
           '...::::::::::::',
           ':::::n:::::::::',
           ':::::::::::....',
           ':::::::::::....',
           ':::::::::::....',
           ':::::::::::::::',
           'Y::::::n:::::::',
           ':::::::::::::::',
           '::::::::::::::Y',
           ':::n:::::::::::',
           ':::::::::::::::',
           'Y::::::::::::::',
           ':::::::::::n:::',
           ':::::::::::::::',
           ':::::::::::::::',
           ':::::::n:::::::',
           ':::::::::::::::',
           '...............',
           '...............',
           '.......>.......',
           '...............']}),
    j:xbR({at:[1,0],kind:'miniboss',c1boss:'c_shadowash',loot:['bkey'],sealChest:true,up:'c_spire_4',seal:{kind:'room',room:'j',dir:'up'},noPots:true,noDecor:true,
      tpl:xbTplStair(xbTplStair(C1_TPL.mirror,7,1,'<'),7,9,'X')})},
    links:[['i','j','gate:i']]}},
  {id:'4',name:S('The Last Stair','The Last Stair'),map:{rooms:{
    k:xbR({at:[0,0],kind:'free',foes:[['c_moth',3]],mothFree:true,down:'c_spire_3',up:'c_spire_5',say1:()=>{ const bolt=typeof boltHelps==='function'&&boltHelps(); setBanner(bolt?S('Woof! Woof!','Woof! Woof!'):S('Mip!','Mip!'),bolt?S('Bolt barks up the last stair. Pip mips back at him.','Bolt barks. Pip mips back.'):S('Pip holds on to your horns. The stair crumbles behind every step.','Pip holds on. Run up!'),2.8); },seal:{kind:'boss',dir:'up'},void:'sky',restFall:true,noPots:true,noDecor:true,
      gust:{dir:[-1,0],on:1.2,off:3.2,str:120},xbLights:[[1,9,200,0.4],[7,6,240,0.5],[13,1,180,0.35],[1,1,180,0.35],[10,9,180,0.3]],
      tpl:['kk....oooo...kk',
           'kk....oooo...kk',
           '..:::::::::::..',
           '..:::::::::::..',
           '..:::::::::::oo',
           '..:::.....:::oo',
           '..:::..<..#::oo',
           '..:::.....:::oo',
           '...::kk::::::..',
           '.>.::kkkkkkkkkk',
           '...::kkkkkkkkkk']})},
    links:[]}},
  {id:'5',name:S('The Roof','The Roof'),map:{rooms:{
    B:xbR({at:[0,0],span:[2,2],kind:'boss',c1boss:'c_mothmask',noPots:true,noDecor:true,down:'c_spire_4',tpl:xbTplStair(C1_TPL.roof,13,16,'>')})},
    links:[]}}
  ]});
// the floors' short names on the HUD (the engine would call a tower's upper floors B1, B2...)
for(const [aid,s] of [['c_lighthouse','1F'],['c_lighthouse_2','2F'],['c_lighthouse_3','3F'],['c_lighthouse_4','4F'],['c_spire','B1'],['c_spire_1','1F'],['c_spire_2','2F'],['c_spire_3','3F'],['c_spire_4','4F'],['c_spire_5','5F']]) if(AREADEFS[aid]) AREADEFS[aid].floorShort=s;

// ---------- 18. debug hooks (window.__eb.d1b): the tests and the solvability checker drive the real code through these
// state() a snapshot; lens(dir|null) stops or frees the lens; force({room:s}) pins a room's beam (s -1..1, or null for
// dark); beamS(room); objs(kind) lists our things; act(id) presses E on one; hit(id,src) hits it; walk(pts,sec) walks Ash
// along points in a room (the clone room uses it); dbg: the internals the checker needs.
function d1bWalk(pts,step){ const A=AREA, p=player; if(!A||!A.xb) return null; step=step||6; let n=0;
  for(const q of pts){ let g=0; while(dist(p.x,p.y,q[0],q[1])>0.5&&g++<4000){ const a=angTo(p.x,p.y,q[0],q[1]), d=Math.min(step,dist(p.x,p.y,q[0],q[1])), nx=p.x+Math.cos(a)*d, ny=p.y+Math.sin(a)*d;
      if(playerBlocked(nx,ny)||colAt(nx,ny,p.r*0.6)) break; p.x=nx; p.y=ny; xbCloneTick(A,1/60); n++; } }
  return n; }
window.__ebX=Object.assign(window.__ebX||{},{d1b:{
  XB,XTY,XB_PROP,
  state(){ const A=AREA, X=A&&A.xb; if(!X) return {area:A?A.id:null};
    const R=caveRoomAt(player.x,player.y), beams={}; for(const id in A.rooms){ const s=xbBeamS(A,A.rooms[id]); if(s!=null) beams[id]=+s.toFixed(2); }
    let dk=0; if(X.dk) for(const v of X.dk) dk+=v;
    return {area:A.id,room:R?R.id:null,lensStop:xbLensStop(A),lensAng:+xbLensAng(A).toFixed(2),beams,dark:dk,slowK:XB.slowK,climb:XB.climb,lvl:A.tri?A.tri.lvl:null,keys:A.keys?A.keys():0,bkey:hasBKey(A),
      seals:X.seals.map(o=>({room:o.room,kind:o.kind,open:o.open})),nests:X.objs.filter(o=>o.k==='xb_nest').map(o=>({heat:+o.heat.toFixed(2),burnt:o.burnt})),
      wheels:X.objs.filter(o=>o.k==='xb_wheel').map(o=>({id:o.id,turned:o.turned})),vbraz:X.objs.filter(o=>o.k==='xb_vbraz').map(o=>({id:o.id,lit:o.lit,room:o.room})),
      dkRooms:X.dkRooms.map(D=>({room:D.R.id,rift:D.rift,cleared:D.cleared,cells:D.cells.length,dark:D.cells.filter(k=>X.dk[k]).length})),
      clones:X.rooms.filter(Q=>Q._cl).map(Q=>({room:Q.id,on:Q._cl.on,solved:Q.solved})),watch:X.watch.map(o=>({sus:+o.sus.toFixed(2),blind:o.blind})),
      solved:Object.keys(A.rooms).filter(id=>A.rooms[id].solved)}; },
  lens(dir){ const A=AREA; if(!A||!A.xb) return null; const k=xbLensKey(A); if(dir) G.found[k]=dir; else delete G.found[k]; return xbLensStop(A); },
  force(m){ XB.force=m||null; return XB.force; },
  beamS(room){ const A=AREA; return A&&A.xb&&A.rooms[room]?xbBeamS(A,A.rooms[room]):null; },
  objs(kind){ const A=AREA; if(!A||!A.xb) return []; return A.xb.objs.filter(o=>!kind||o.k===kind||o.k==='xb_'+kind).map(o=>({id:o.id,k:o.k,kind:o.kind,x:Math.round(o.x),y:Math.round(o.y),room:o.room,dir:o.dir,lit:o.lit,turned:o.turned,open:o.open,burnt:o.burnt,hooked:o.hooked})); },
  act(id){ const A=AREA, o=A&&A.xb&&A.xb.objs.find(q=>q.id===id); if(o) xbAct(A,o); return !!o; },
  hit(id,src){ const A=AREA, o=A&&A.objs.find(q=>q.id===id); if(!o) return false; return areaObjHit(o.x,o.y,10,src||'arrow'); },
  walk:(pts,step)=>d1bWalk(pts,step),
  // x1_foes' scripted fighter (its own __eb.c1 is replaced by x1_story's __eb.c1, so the tests reach it here)
  bot(type,o){ if(typeof C1B==='undefined'||typeof c1BotFrame!=='function') return false; o=o||{}; Object.assign(C1B,{on:true,type,mech:o.mech!==false,heal:o.heal!==false,t:0,hitT:0,heals:0,pullT:0,yankT:0,mirT:0,fireT:0,hamT:0,ev:{},dealt:0,zt:0,tx:null,ty:null,dodges:0}); C1.bot=c1BotFrame; return true; },
  botStop(){ if(typeof C1B==='undefined') return false; C1B.on=false; C1.bot=null; C1B.tx=null; return true; },
  boss(){ const e=G.boss; return e&&!e.dead?{type:e.type,hp:Math.round(e.hp),max:Math.round(e.maxHp),pct:+(e.hp/e.maxHp).toFixed(3),bph:e.bph||0,mode:e.mode||null}:null; },
  dbg:{xbBeamS,xbLensStop,xbLensKey,xbLeverPull,xbWheel,xbBrazLight,xbDarkHoldAll,xbDarkGrow,xbSheerAt,xbOnSheer,xbSealOpen,xbSealOpenNow,xbLampAct,xbLampLit,xbCloneTick,xbAct,xbRay,
    p2Targets,p2TgtOK,p2LandSpot,p2RidePath,p2ShadeAt,p2LitAt,p2StandOK,p2Range,p2DashLen,p2DashBlocked,p2GateOpen,P2,getMv:()=>P2.mv,setMv:m=>{ P2.mv=m; },
    trialObjAct,areaObjHit,caveObjAct,areaObjAct,solveRoom,c1BossStart:typeof c1BossStart==='function'?c1BossStart:null,caveRoomAt,caveInterior,tCell,tPos,tGround,tWet,tHole,dunH,
    canClaws,canGrapple,canShadow,canDblJump,canSkim,canWalkWater,hasAbil,playerBlocked,areaBlocked,colAt,dunCovered,caveBlockedAt}
}});
