// ================= x3_dun_a: the first two Act IV dungeons (bible ACT4.md 7.0, 7.1, 7.2, 9.1, 9.3, 9.6, 10.2)
//   Drowned Lumen (m_lumen): a moon city under the sea, four floors going DOWN. Its signature is the TIDE LOCK: three
//     moon-wheel valves, each owning a tide zone (a set of rooms) that it switches between DRAINED (floor, puddles, things
//     you walk under) and FLOODED (deep water: swim over walls, dive to switches, bridges float up). Ember's flame in the
//     Moon Well Hall gives Dive; the rest of the city needs both states, often across two floors. Madame Octavia keeps
//     Lumen's lamps in the Lamp Cellar.
//   The Sandworm Burrows (m_burrows): tunnels in sand, three floors going DOWN. Its signature is the WORM CLOCK: worm lanes
//     where, on a beat, a worm bursts out of the sand and arcs across (rumble, then GULP). Read the clock, burrow and let it
//     pass over you, or Blaze a glass plate onto the lane to make it bounce. Ember's flame gives Burrow; Gravelgut, the
//     Glass-Eater, waits in the Gullet Hall.
// Everything is a wrapper or a registry entry. Template letters, room fields, save keys, hooks and tests are in
// scratchpad/M3DUN_A.md. Player strings are S(full, simple). Cell type ids 250 to 254 are this module's.

// ---------- 0. ids, numbers, state and small helpers
const D3A={t:0,sndT:{},tip:{},noGift:false,toH:0,gulp:null,lastRoom:null};
const D3A_IDS={m_lumen:1,m_burrows:1};
function d3aRoot(){ return AREA&&AREA.def?dunRoot(AREA.def.id):null; }
function d3aIn(id){ const r=d3aRoot(); return !!r&&(id?r===id:!!D3A_IDS[r]); }
const d3aDun=def=>!!(def&&D3A_IDS[dunRoot(def.id)]);
const d3aEasy=()=>!!(G&&G.diff&&G.diff.name==='Easy');
const d3aHard=()=>!!(G&&G.diff&&G.diff.name==='Hard');
const d3aGod=()=>!!(window.__eb&&window.__eb.god);
function d3aSay(lines,cb){ runDialogue(lines.map(l=>Array.isArray(l)?l:['narr',l]),()=>{ scene='play'; if(cb) cb(); saveGame(); }); }
function d3aTip(id,title,text){ if(D3A.tip[id]) return; D3A.tip[id]=1; try{ mvTip(title,text,6,'d3a_'+id); }catch(e){ setBanner(title,text,3); } }
// one entry point into the story module (x3_story): a scene plays once, when things are calm
function d3aBeat(name){ try{ if(typeof m3sBeat==='function') return m3sBeat(name); }catch(e){ console.error(e); } return false; }
function d3aCtl(k){ try{ return balCtls()[k]; }catch(e){ return {use:'E',roll:'Space',fire:'K',attack:'J',jump:'C'}[k]||k; } }
function d3aSnd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted) return;
  const now=G?G.time:0; if(D3A.sndT[kind]&&now-D3A.sndT[kind]<0.06) return; D3A.sndT[kind]=now;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.38*(v==null?1:v); out.connect(ac.destination);
    const tn=(type,f,dur,vol,dl,f1)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0006,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ if(!SFX.noise) return; const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.06,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t+dur+0.05); };
    switch(kind){
      case 'flood': nz(2.4,0.24,'lowpass',260,1300,0.7); for(let i=0;i<6;i++) tn('sine',220+i*40,0.12,0.03,0.2+i*0.25,520+i*30); break;
      case 'drain': nz(2.2,0.2,'lowpass',1300,160,0.7); tn('sine',120,1.4,0.06,0.3,46); break;
      case 'wheel': for(let i=0;i<5;i++) tn('square',150+i*12,0.06,0.025,i*0.12,110); nz(0.6,0.08,'bandpass',600,300,3); break;
      case 'click': tn('square',900,0.04,0.04); tn('triangle',1300,0.08,0.03,0.03); break;
      case 'rumble': nz(1.8,0.22,'lowpass',90,180,0.8); tn('sine',46,1.6,0.08,0,38); break;
      case 'gulp': nz(0.35,0.3,'lowpass',500,120,1); tn('sine',140,0.35,0.12,0,60); break;
      case 'ptoo': nz(0.25,0.22,'bandpass',1400,600,2); tn('triangle',520,0.2,0.07,0,240); break;
      case 'bonk': tn('triangle',330,0.25,0.12,0,180); tn('sine',660,0.2,0.06,0.02); nz(0.2,0.12,'highpass',3000,5000,0.7); break;
      case 'bell': for(const [m,a,d] of [[1,0.16,3.4],[2.01,0.07,2.4],[2.42,0.06,2],[3.0,0.04,1.6]]) tn('sine',130*m,d,a); break;
      case 'chime': for(const [m,a,d] of [[1,0.07,1.2],[2.76,0.04,0.9],[5.4,0.02,0.6]]) tn('sine',880*m,d,a); break;
      case 'shatter': nz(0.6,0.3,'highpass',2500,6000,0.8); for(let i=0;i<5;i++) tn('triangle',1800+i*400,0.15,0.03,i*0.04); break;
      case 'lens': for(let i=0;i<4;i++) tn('sine',660+i*220,0.5,0.05,i*0.08); break;
    }
  }catch(e){}
}

// ---------- 1. cells (template letters; TY ids 250 to 254)
//   tide cells (one id, the kind kept as a mark): ᚹ water (floor drained, deep water flooded), ᚠ full (floor drained,
//     water to the ceiling flooded: only a diver), ᛚ low wall (a wall drained, deep water flooded: swim over it),
//     ᛒ float bridge (a pit drained, floor flooded: it floats up), ᚳ channel (a pit drained, deep water flooded),
//     ᛏ trench (a pit drained, water to the ceiling flooded)
//   ᚾ ᛖ ᛋ ᚥ sand flow north / east / south / west (a sandfall or sand river: it carries you; burrow to ride it faster;
//     a push block in it plugs the whole fall)
//   ᚷ glass wall (nothing digs under glass)   ᚴ cracked glass (a Ground Pound, the hammer or a bomb breaks it)
//   ᚸ grate (bars or a sand plug: open while the room's `grate` rule holds)
Object.assign(TY,{d3atide:250,d3aflow:251,d3aglass:252,d3acrack:253,d3agrate:254});
const D3T={tide:250,flow:251,glass:252,crack:253,grate:254};
const D3SUB={'ᚹ':1,'ᚠ':2,'ᛚ':3,'ᛒ':4,'ᚳ':5,'ᛏ':6};
const D3S={W:1,F:2,L:3,B:4,C:5,T:6};
for(const ch in D3SUB){ TY_CH[ch]=250; TY_KEEP[ch]=1; }
Object.assign(TY_CH,{'ᚾ':251,'ᛖ':251,'ᛋ':251,'ᚥ':251,'ᚷ':252,'ᚴ':253,'ᚸ':254});
Object.assign(TY_FLOW,{'ᚾ':0,'ᛖ':1,'ᛋ':2,'ᚥ':3});
const d3aMine=t=>t>=250&&t<=254;
// room kinds: d3areach (reach the room's goal cells), d3aplates (every plate held at once; plates hold plateHold s),
// d3alever (pull the room's lever), d3aengine (the Tide Engine code)
Object.assign(PUZZLE_KINDS,{d3areach:1,d3aplates:1,d3alever:1,d3aengine:1});
Object.assign(GATE_WHY,{
  d3areach:S('A sealed door with a fish carved on it. Swim all the way through that room to open it.','Swim through that room to open it.'),
  d3aplates:S('A sealed door with three worm-plates carved on it. Hold all three sand plates down at once.','Press all three plates at once.'),
  d3alever:S('A sealed door with a lever carved on it. Find the lever in that room.','Find the lever in that room.'),
  d3aengine:S('A sealed door with three moons carved on it. Set the Tide Engine.','Set the Tide Engine.')});

// ---------- 2. the tide zones (Drowned Lumen)
// G.found['m_tide_<zone>']: 1 flooded, 0 drained. z1 the Upper City (F2), z2 the Seafloor Streets (F1), gch the Sunken
// Bridge's channel (F2 room g), z3l / z3n / z3m the Library, the Moon Window and the Tide Engine room (B1).
const D3A_ZDEF={z1:1,z2:1,gch:0,z3l:1,z3n:0,z3m:0};
const D3A_ZNAME={z1:S('the Upper City','the Upper City'),z2:S('the Seafloor Streets','the Seafloor Streets'),gch:S('the channel','the channel'),
  z3l:S('the Drowned Library','the Library'),z3n:S('the Moon Window','the Moon Window'),z3m:S('the Tide Engine','the Tide Engine')};
const D3A_CODE={z3l:0,z3n:1,z3m:0};   // the Library mural: FULL (drained), NEW (flooded), FULL (drained)
function d3aZ(z){ const v=G&&G.found?G.found['m_tide_'+z]:null; return v==null?(D3A_ZDEF[z]||0):(v?1:0); }
// a tide cell: its kind and whether its zone is flooded now
function d3aSub(k){ const D=AREA&&AREA.cave&&AREA.cave.d3; return D?D.sub[k]:0; }
function d3aZoneOf(k){ const D=AREA&&AREA.cave&&AREA.cave.d3; if(!D) return null; const i=D.zi[k]; return i>=0?D.zones[i]:null; }
function d3aWetK(k){ const z=d3aZoneOf(k); return !!z&&!!d3aZ(z); }
// water to the ceiling right now (only a diver, no surfacing)
function d3aFull(k){ const A=AREA, c=A&&A.cave; if(!c||c.typ[k]!==250) return false; const s=c.d3.sub[k]; return (s===D3S.F||s===D3S.T)&&d3aWetK(k); }
function d3aTideGround(k){ const s=d3aSub(k), f=d3aWetK(k); return s===D3S.W||s===D3S.F?!f:s===D3S.B?f:false; }
function d3aTideWet(k){ const s=d3aSub(k), f=d3aWetK(k); return f&&s!==D3S.B; }
function d3aTideHole(k){ const s=d3aSub(k), f=d3aWetK(k); return !f&&(s===D3S.B||s===D3S.C||s===D3S.T); }

// ---------- 3. grates, cracked glass, plates, switches (saved)
function d3aKey(def,R,what){ return `d3_${caveSid(def)}_${R.id}_${what}`; }
// a room's grate rule: grate:{sw:[c,r]} (that switch is on), {lever:true}, {padlock:true}, {solved:true}; all must hold
function d3aGrateOpen(def,R){
  const g=R&&R.grate; if(!g) return true; const F=G.found, SK=caveSid(def);
  if(g.sw&&!F[`tr_${SK}_${R.id}_H${g.sw[0]}_${g.sw[1]}`]) return false;
  if(g.lever&&!F[d3aKey(def,R,'lever')]) return false;
  if(g.padlock&&!F[d3aKey(def,R,'padlock')]) return false;
  if(g.solved&&!F[`cv_${SK}_${R.id}_solved`]) return false;
  return true;
}
const d3aCrackKey=(def,k)=>`d3k_${caveSid(def)}_${k}`;
function d3aRoomAtCell(c,k){ const i=k%c.w, j=(k-i)/c.w; for(const id in c.rooms){ const R=c.rooms[id]; if(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih) return R; } return null; }
// the wall bits of the cells whose state can change (low walls with the tide, grates, cracked glass, glass)
function d3aGridOf(c,def,k){
  const t=c.typ[k];
  if(t===250){ if(c.d3.sub[k]!==D3S.L) return 0; const i=c.d3.zi[k]; return i>=0&&d3aZ(c.d3.zones[i])?0:1; }
  if(t===252) return 1;
  if(t===253) return G.found[d3aCrackKey(def,k)]?0:1;
  if(t===254){ const R=d3aRoomAtCell(c,k); return d3aGrateOpen(def,R)?0:1; }
  return c.grid[k];
}
// sync the walls with the saved state; redraw the floor picture when something changed
function d3aGridSync(A,force){
  const c=A&&A.cave; if(!c||!c.d3) return false; let ch=false;
  for(const k of c.d3.dyn){ const g=d3aGridOf(c,A.def,k); if(c.grid[k]!==g){ c.grid[k]=g; ch=true; } }
  if(ch||force){ renderCaveRooms(A,A.def); refreshCaveGates(); }
  return ch;
}

// ---------- 4. building a floor: the template marks, zones, walls
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments); if(!d3aDun(def)) return c;
    try{ d3aGen(def,c); }catch(e){ console.error('d3a gen',e); }
    return c; }; }
function d3aGen(def,c){
  const n=c.w*c.h, w=c.w, D={sub:new Uint8Array(n),zi:new Int8Array(n).fill(-1),zones:[],zcells:{},dyn:[],flowComp:new Int16Array(n).fill(-1),comps:[]};
  c.d3=D;
  // tide kinds come from the kept marks
  c.marks=c.marks.filter(m=>{ const s=D3SUB[m.ch]; if(!s) return true; D.sub[m.j*w+m.i]=s; return false; });
  // a bubble vent set among tide cells takes their kind (so a vent in a trench is in the trench)
  for(const m of c.marks){ if(m.ch!=='°') continue; const k=m.j*w+m.i, cnt={}; for(const d of DIRS){ const q=k+d[0]+d[1]*w; if(c.typ[q]===250&&D.sub[q]) cnt[D.sub[q]]=(cnt[D.sub[q]]||0)+1; }
    let s=0, bn=0; for(const x in cnt) if(cnt[x]>bn){ bn=cnt[x]; s=+x; } if(bn>=2){ c.typ[k]=250; D.sub[k]=s; } }
  const zIdx=z=>{ let i=D.zones.indexOf(z); if(i<0){ i=D.zones.length; D.zones.push(z); D.zcells[z]=[]; } return i; };
  for(const id in c.rooms){ const R=c.rooms[id];
    // tideDoors: the doorsteps of this room are part of its tide (a door under the water)
    if(R.tideDoors&&R.zone) for(const L of R.links){ for(const dk of L.cells){ const di=dk%w, dj=(dk-di)/w;
        for(const [dx,dy] of L.vertical?[[0,-1],[0,1]]:[[-1,0],[1,0]]){ const q=(dj+dy)*w+di+dx, qi=di+dx, qj=dj+dy; if(qi>R.ox&&qi<=R.ox+R.iw&&qj>R.oy&&qj<=R.oy+R.ih&&c.typ[q]===0&&c.grid[q]===0){ c.typ[q]=250; D.sub[q]=D3S.W; } } } }
    for(let r=0;r<R.ih;r++) for(let q=0;q<R.iw;q++){ const i=R.ox+1+q, j=R.oy+1+r, k=j*w+i; if(c.typ[k]!==250) continue;
      let z=R.zone||null; if(R.zones) for(const zn in R.zones) for(const rc of R.zones[zn]) if(q>=rc[0]&&q<=rc[2]&&r>=rc[1]&&r<=rc[3]) z=zn;
      if(!z){ c.typ[k]=0; D.sub[k]=0; continue; }
      const zi=zIdx(z); D.zi[k]=zi; D.zcells[z].push(k); if(!D.sub[k]) D.sub[k]=D3S.W; } }
  // the cells whose wall bit follows the state
  for(let k=0;k<n;k++){ const t=c.typ[k]; if(t===252||t===253||t===254||(t===250&&D.sub[k]===D3S.L)){ D.dyn.push(k); c.grid[k]=d3aGridOf(c,def,k); } }
  // sand flows: each connected run in one direction is one fall (a block anywhere in it plugs all of it)
  for(let k=0;k<n;k++){ if(c.typ[k]!==251||D.flowComp[k]>=0) continue; const ci=D.comps.length, dir=c.flow[k], st=[k], cells=[]; D.flowComp[k]=ci;
    while(st.length){ const q=st.pop(); cells.push(q); for(const d of DIRS){ const nq=q+d[0]+d[1]*w; if(nq<0||nq>=n||D.flowComp[nq]>=0||c.typ[nq]!==251||c.flow[nq]!==dir) continue; D.flowComp[nq]=ci; st.push(nq); } }
    D.comps.push({dir,cells}); }
}
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){
    base.apply(this,arguments);
    if(d3aDun(def)) try{ d3aBuild(A,def); }catch(e){ console.error('d3a build',e); } }; }
function d3aObj(A,kind,x,y,id,extra){ const o=Object.assign({k:'d3a',kind,x,y,id,r:18},extra||{}); A.objs.push(o); if(o.col) addAreaCol(o.col); return o; }
function d3aBuild(A,def){
  const c=A.cave, D=c.d3, SK=caveSid(def), cs=c.cell, X=A.d3a={t:0,show:{},plate:new Map(),lanes:[],locks:[],valves:[],statue:null,vault:null,duch:null,levers:[],bells:[],winds:[],eggs:[],dam:new Set(),lampT:{},enter:{}};
  for(const z of D.zones) X.show[z]=d3aZ(z);
  const P=(i,j)=>({x:A.x0+(i+0.5)*cs,y:A.y0+(j+0.5)*cs});
  const vi={};
  for(const m of c.marks){ const R=A.rooms[m.room]; if(!R) continue; const p=P(m.i,m.j), id=`d3_${SK}_${m.room}_${m.c}_${m.r}`, k=m.j*c.w+m.i;
    switch(m.ch){
      case 'ᛜ': { const o=d3aObj(A,'lock',p.x,p.y,id,{room:m.room,zone:R.lock,r:30,spin:0,col:{t:'c',x:p.x,y:p.y,r:20}}); o.prompt=()=>d3aLockPrompt(o); o.act=()=>d3aLockTurn(o); X.locks.push(o); A.lights.push({x:p.x,y:p.y-20,r:220,i:0.55}); break; }
      case 'ᛝ': { const n=vi[m.room]=(vi[m.room]||0), V=(R.valves||[])[n]||{}; vi[m.room]=n+1; const o=d3aObj(A,'valve',p.x,p.y,id,Object.assign({room:m.room,r:24,spin:0,cd:0,col:{t:'c',x:p.x,y:p.y,r:13}},V)); o.prompt=()=>d3aValvePrompt(o); o.act=()=>d3aValveTurn(o); X.valves.push(o); break; }
      case 'ᛟ': { const o=d3aObj(A,'statue',p.x,p.y,id,{room:m.room,zone:R.zone,r:26,lit:!!R.solved,col:{t:'c',x:p.x,y:p.y+2,r:22}}); o.prompt=()=>S('Look at the statue','Look at the statue'); o.act=()=>d3aStatueLook(o); X.statue=o; A.lights.push({x:p.x,y:p.y-80,r:240,i:0,obj:o}); break; }
      case 'ᛗ': { const o=d3aObj(A,'mural',p.x,p.y,id,{room:m.room,r:30,what:R.mural||'moons'}); o.prompt=()=>o.what==='mosaic'?null:S('Look at the mural','Look at the mural'); o.act=()=>d3aMuralLook(o); if(o.what==='mosaic') A.lights.push({x:p.x,y:p.y,r:260,i:0,obj:{get lit(){ return !!(A.rooms[o.room]&&A.rooms[o.room].solved); }}}); break; }
      case 'ᚱ': { const o=d3aObj(A,'lever',p.x,p.y,id,{room:m.room,r:20,h:Math.max(0,dunH(k)),on:!!G.found[d3aKey(def,R,'lever')],cd:0,col:{t:'c',x:p.x,y:p.y,r:9}}); o.prompt=()=>o.on?null:S('Pull the lever','Pull the lever'); o.act=()=>d3aLeverPull(o); X.levers.push(o); break; }
      case 'ᛞ': { const o=d3aObj(A,'vault',p.x,p.y,id,{room:m.room,r:30,heat:0,col:{t:'c',x:p.x,y:p.y-6,r:22}}); o.prompt=()=>G.flags.m_vault_open?null:S('Look at the sealed vault','Look at the vault'); o.act=()=>d3aVaultLook(o); X.vault=o; A.lights.push({x:p.x,y:p.y-10,r:200,i:0.45}); break; }
      case 'ᛃ': { const o=d3aObj(A,'window',p.x,p.y,id,{room:m.room,r:40,eye:0}); X.winds.push(o); A.lights.push({x:p.x,y:p.y,r:260,i:0.6}); break; }
      case 'ᛣ': { if(!G.flags.m_duchess){ const d={x:p.x,y:p.y,face:0.4,t:0,kind:'goat',moving:false}; X.duch=d; } break; }
      case 'ᛥ': { const o=d3aObj(A,'bell',p.x,p.y,id,{room:m.room,r:26,sw:0,cd:0,col:{t:'c',x:p.x,y:p.y,r:14}}); o.prompt=()=>G.found.m_burrows_bell?S('Look at the Worm Bell','Look at the bell'):S('Ring the Worm Bell','Ring the bell'); o.act=()=>d3aBellRing(o); X.bells.push(o); A.lights.push({x:p.x,y:p.y-30,r:180,i:0.5}); break; }
      case 'ᛦ': { const o=d3aObj(A,'padlock',p.x,p.y,id,{room:m.room,r:22,col:{t:'c',x:p.x,y:p.y,r:12}}); o.prompt=()=>G.found[d3aKey(def,R,'padlock')]?null:A.keys()>0?S('Unlock the padlock','Unlock it'):S('Look at the padlock','Look at the padlock'); o.act=()=>d3aPadlock(o); break; }
      case 'ᚼ': d3aObj(A,'heartwin',p.x,p.y,id,{room:m.room,r:0,flat:true}); break;
      case 'ᛇ': d3aObj(A,'tooth',p.x,p.y,id,{room:m.room,r:30,col:{t:'c',x:p.x,y:p.y,r:20}}); break;
      case 'ᛈ': { const o=d3aObj(A,'cactus',p.x,p.y,id,{room:m.room,r:18,v:(m.c*7+m.r*3)%3,ring:0,col:{t:'c',x:p.x,y:p.y,r:12}}); break; }
      case 'ᛉ': if(!G.found[id]) A.objs.push({k:'coinpile',x:p.x,y:p.y,id,room:m.room,n:6+(def.level||18)*3}); break; // coins in a hidden niche
      case 'ᛄ': X.eggs.push(d3aObj(A,'egg',p.x,p.y,id,{room:m.room,r:16,v:(m.c+m.r)%3,col:{t:'c',x:p.x,y:p.y,r:11}})); break;
    } }
  // worm lanes (room cells): {a:[c,r], b:[c,r], w:1, per:6, ph:0}
  for(const id in A.rooms){ const R=A.rooms[id]; (R.lanes||[]).forEach((L,i)=>{ const a=P(R.ox+1+L.a[0],R.oy+1+L.a[1]), b=P(R.ox+1+L.b[0],R.oy+1+L.b[1]), wd=L.w||1;
    const vert=L.a[0]===L.b[0], cells=[];
    for(let s=0;s<=Math.max(Math.abs(L.b[0]-L.a[0]),Math.abs(L.b[1]-L.a[1]));s++){ const ci=L.a[0]+Math.sign(L.b[0]-L.a[0])*s, cj=L.a[1]+Math.sign(L.b[1]-L.a[1])*s; for(let o=0;o<wd;o++){ const qi=R.ox+1+ci+(vert?o:0), qj=R.oy+1+cj+(vert?0:o); cells.push(qj*c.w+qi); } }
    const off=(wd-1)*cs/2;
    X.lanes.push({R,i,x0:a.x+(vert?off:0),y0:a.y+(vert?0:off),x1:b.x+(vert?off:0),y1:b.y+(vert?0:off),hw:wd*cs/2,cells:new Set(cells),per:L.per||6,ph:L.ph||0,bellPer:L.bellPer||0,last:-1,state:'idle',head:0,dir:1,bonk:-1,rumble:false,u:0,id:R.id+'_lane'+i}); }); }
  // the Moon Well's pools are water, not shadow
  if(A.p4) for(const o of A.p4.pools){ const R=A.rooms[o.room]; if(R&&R.waterPools){ o.kind='water'; o.r=34; } }
  // moon lamps (Drowned Lumen's braziers) and the switches: saved one by one
  for(const o of A.objs){ if(o.k==='brazier'&&def.theme==='m_lumen') o.d3lamp=true;
    // (a switch in a room with no puzzle would start pressed: here each one is pressed by hand, once, and saved)
    if(o.k==='tswitch'){ o.on=!!G.found[o.id]; o.lit=o.on; } }
  // the h-k plate door stays open once the block has held its plate
  // foes: sand sharks start in the sand, swimmers in the water
  for(const e of G.enemies){ if(e.dead||!e.inArea) continue; const R=A.rooms[e.room]; if(!R) continue; const sw=EDEF[e.type]&&EDEF[e.type].swim, sh=e.type==='m_sandshark';
    if(!sw&&!sh) continue; const ok=q=>sh?(c.typ[q]===62||c.typ[q]===251):(c.typ[q]===TY.deep||c.typ[q]===60);
    const k=tCell(e.x,e.y); if(k>=0&&ok(k)) continue; const list=[]; for(let r=0;r<R.ih;r++) for(let q=0;q<R.iw;q++){ const kk=(R.oy+1+r)*c.w+R.ox+1+q; if(c.grid[kk]===0&&ok(kk)) list.push(kk); }
    if(list.length){ const kk=list[(e.x*7+e.y*13|0)%list.length]; const q=tPos(kk); e.x=q.x; e.y=q.y; e.homeX=q.x; e.homeY=q.y; } }
  X.built=true;
}
// the floor walls follow the saved state as the floor is built (grid already set in d3aGen); a lever on a pillar is high
{ const base=refreshCaveGates; refreshCaveGates=function(){
    base.apply(this,arguments); const A=AREA; if(!A||!A.gates||!A.d3a) return;
    for(const o of A.gates){ if(!o.link) continue;
      // after Ember's flame in the Moon Well Hall the door to the market slides shut until the first dive
      if(d3aIn('m_lumen')&&o.link.a==='d'&&o.link.b==='e'&&G.found.m_lumen_eshut&&!G.found.m_lumen_dive1&&!gateOnAsh(o)) o.closed=true;
      // the plate door of the plaza stays open once its plate has been held
      if(o.type==='plate'&&G.found[`d3plate_${caveSid(A.def)}_${o.pr}`]) o.closed=false; } }; }

// ---------- 5. cell rules (only cells 250 to 254 are touched, and those exist only in these two dungeons)
{ const base=dunGround; dunGround=function(k,t,T){
    if(d3aMine(t)){ if(t===250) return d3aTideGround(k); if(t===251) return true; if(t===253||t===254) return AREA.cave.grid[k]===0; return false; }
    return base(k,t,T); }; }
{ const base=dunWet; dunWet=function(k,t,T){ if(t===250) return d3aTideWet(k); return base(k,t,T); }; }
{ const base=dunHole; dunHole=function(k,t,T){ if(t===250) return d3aTideHole(k); return base(k,t,T); }; }
// a diver cannot come up under the flooded ceiling of a full cell
{ const base=p4CanSurface; p4CanSurface=function(x,y){ if(AREA&&AREA.cave&&AREA.cave.d3&&x>=IZX-50){ const k=tCell(x,y); if(k>=0&&d3aFull(k)) return false; } return base(x,y); }; }
// sand flows are sand; a glass plate on a lane is glass
{ const base=p4CaveSand; p4CaveSand=function(k){ const A=AREA; if(A&&A.d3a&&A.d3a.plate.get(k)>0) return false; if(A&&A.cave&&A.cave.typ[k]===251) return true; return base(k); }; }
// heights and water for Ash: a full cell needs a diver (walking into it with Dive dives at once); a jump lands on
// anything no higher than where it took off; a Double Jump mounts a step in rooms that allow it (dblOK)
{ const base=dunCheck; dunCheck=function(k,x,y,air,fly){
    const A=AREA, c=A&&A.cave;
    if(c&&c.d3&&!fly){
      const t=c.typ[k];
      if(t===250&&!air&&P4.mode!=='dive'&&d3aFull(k)){ if(canDive()&&!P4.mv){ P4.autoDive=true; return null; } return 'wall'; }
      const r=base(k,x,y,air,fly);
      if(r==='wall'&&air&&!P4.mode&&c.grid[k]===0){ const hk=dunH(k), T=A.tri; if(hk===1){ if(D3A.toH>=1) return undefined;
          const R=caveRoomAt(x,y); if(R&&R.dblOK&&player.dbl&&(player.z||0)>6&&!caveBlockedAt(k)) return undefined; } }
      return r; }
    return base(k,x,y,air,fly); }; }
// push blocks: onto drained tide floor and into a sandfall (it plugs it)
{ const base=trialBlockInto; trialBlockInto=function(b,ni,nj,k){
    const A=AREA, c=A&&A.cave; if(c&&c.d3){ const t=c.typ[k];
      if((t===250&&d3aTideGround(k)&&!d3aWetK(k))||t===251){ b.fx=b.x; b.fy=b.y; b.ci=ni; b.cj=nj; b.anim=0.2; SFX.play('roll',0.7); shake(1); if(t===251){ later(0.25,()=>{ if(AREA===A&&d3aDammed(A,k)) { setBanner(S('The sandfall stops!','The sand stops!'),S('The block plugs it. The sand piles up behind it.','The block plugs it!'),2); d3aSnd('rumble',0.4); } }); } return true; } }
    return base.apply(this,arguments); }; }

// ---------- 6. the tide: locks, valves, the water level, never drowning Ash
function d3aSetZone(z,v){
  v=v?1:0; const was=d3aZ(z); G.found['m_tide_'+z]=v; if(was===v) return false;
  const A=AREA; if(A&&A.d3a){ d3aGridSync(A); d3aRelocate(A); d3aFoesTide(A); }
  d3aSnd(v?'flood':'drain'); shake(4); flashA=0.12; flashCol=v?'140,200,255':'230,220,200';
  saveGame(); return true;
}
// a cell where Ash can be right now
function d3aCellOK(k){
  const A=AREA, c=A.cave; if(k<0||c.grid[k]===1||caveBlockedAt(k)) return false;
  if(tHole(k)) return false; if(tGround(k)) return true;
  if(tWet(k)){ if(d3aFull(k)||c.typ[k]===60) return canDive(); return canDive()||canWalkWater(); }
  return true;
}
function d3aRelocate(A){
  const p=player; if(!p||p.dead) return; const k=tCell(p.x,p.y); if(k<0) return;
  if(P4.mode==='dive'&&tWet(k)) return;
  if(d3aCellOK(k)) return;
  const s=dunNearGround(p.x,p.y,10); p.x=s.x; p.y=s.y; p.kvx=p.kvy=0; if(P4.mode==='dive'){ P4.mode=null; }
  const T=A.tri; if(T){ T.lx=p.x; T.ly=p.y; T.safe={x:p.x,y:p.y}; }
  ftext(p.x,p.y-34,S('Whoa! Up you come!','Whoa!'),'#d8f0ff',13);
}
function d3aFoesTide(A){
  for(const e of G.enemies){ if(e.dead||!e.inArea||e.flying||e.boss) continue; const k=tCell(e.x,e.y); if(k<0) continue; const sw=EDEF[e.type]&&EDEF[e.type].swim;
    if(sw&&!tWet(k)){ ftext(e.x,e.y-20,S('Flop!','Flop!'),'#bfe6ff',12); killEnemy(e); }
    else if(!sw&&!tGround(k)){ const s=dunNearGround(e.x,e.y,6); e.x=s.x; e.y=s.y; e._tx=e.x; e._ty=e.y; } }
}
function d3aLockPrompt(o){ return d3aZ(o.zone)?S(`Turn the Tide Lock (drain ${D3A_ZNAME[o.zone]||o.zone})`,'Turn the Tide Lock (drain)'):S(`Turn the Tide Lock (flood ${D3A_ZNAME[o.zone]||o.zone})`,'Turn the Tide Lock (flood)'); }
function d3aLockTurn(o){
  if(o.spin>0) return; const z=o.zone, v=d3aZ(z)?0:1;
  o.spin=1.4; d3aSnd('wheel'); SFX.play('block');
  later(0.5,()=>{ if(!AREA||!AREA.d3a) return; d3aSetZone(z,v);
    setBanner(v?S('The tide comes in!','The water rises!'):S('The tide goes out!','The water drains!'),v?S(`${D3A_ZNAME[z]} floods to the ceilings.`,`${D3A_ZNAME[z]} is under water now.`):S(`The water drains out of ${D3A_ZNAME[z]}.`,`${D3A_ZNAME[z]} is dry now.`),2.8);
    const R=AREA.rooms[o.room]; if(R&&!R.solved&&R.kind==='tide') solveRoom(R,true);
    if(!G.found.m_lumen_locktip){ G.found.m_lumen_locktip=1; later(3,()=>d3aTip('lock',S('Tide Locks','Tide Locks'),S('Each Tide Lock floods or drains a part of the city, even the floor below. Turn it again to switch back.','Turn it again to switch back.'))); }
    questPoke(); });
}
function d3aValvePrompt(o){
  if(o.zone==='gch') return S('Turn the sluice valve','Turn the valve');
  const lab=o.label?simplify(o.label):''; return d3aZ(o.zone)?S(`Turn the ${lab} valve to FULL MOON (drain)`,`Turn the ${lab} valve (drain)`):S(`Turn the ${lab} valve to NEW MOON (flood)`,`Turn the ${lab} valve (flood)`);
}
function d3aValveTurn(o){
  if(o.cd>0) return; o.cd=0.8;
  if(o.need==='sluice'&&!G.found.m_lumen_sluice){ o.spin=0.4; d3aSnd('wheel',0.5); d3aSay([S('The valve turns and turns, but no water comes. Somewhere upstream, a sluice gate is shut.','It turns, but no water comes. A gate is shut somewhere.')]); return; }
  o.spin=1; d3aSnd('wheel',0.7);
  const v=d3aZ(o.zone)?0:1; d3aSetZone(o.zone,v);
  if(o.zone==='gch') setBanner(v?S('The channel floods!','The channel fills up!'):S('The channel drains','The channel drains'),v?S('The old stone bridge floats up to the top.','The bridge floats up!'):S('The bridge sinks to the bottom again.','The bridge sinks.'),2.6);
  else setBanner(v?S('NEW MOON','NEW MOON'):S('FULL MOON','FULL MOON'),v?S(`${D3A_ZNAME[o.zone]} floods.`,`${D3A_ZNAME[o.zone]} floods.`):S(`${D3A_ZNAME[o.zone]} drains.`,`${D3A_ZNAME[o.zone]} drains.`),2);
  d3aEngineCheck();
  questPoke();
}
// the Tide Engine: the Library mural's code (FULL, NEW, FULL) lifts the water seal from the great door
function d3aEngineCheck(){
  if(G.found.m_lumen_seal) return; for(const z in D3A_CODE) if(d3aZ(z)!==D3A_CODE[z]) return;
  G.found.m_lumen_seal=1; d3aSnd('lens'); shake(5); flashA=0.3; flashCol='200,230,255';
  setBanner(S('FULL, NEW, FULL','FULL, NEW, FULL'),S('Far off, the water seal on the great door lets go with a sigh.','The great door is unsealed!'),3.4);
  const A=AREA; if(A&&A.rooms){ for(const id in A.rooms){ const R=A.rooms[id]; if(R.kind==='d3aengine'&&!R.solved) solveRoom(R,true); } }
  saveGame();
}

// ---------- 7. the other things you use
function d3aStatueLook(o){
  const f=d3aZ(o.zone), R=AREA.rooms[o.room];
  if(R&&R.solved){ d3aSay([S('The moon-priestess holds her lens up to the sky. It glows silver now, and the grate over the east door is open.','The lens glows. The east door is open.')]); return; }
  d3aSay([S('A moon-priestess in white stone, holding a round lens up toward the sky. A thin chain runs from the lens down to the grate over the east door.','A stone priestess holds a lens up high. A chain runs to the east grate.'),
    f?S('The water is right up at her hands now. You could swim up to the lens and give it a whack.','The water is up high! Swim to the lens and hit it!'):S('The lens is far too high to reach. If only the water came up to it...','The lens is too high. If only the water were higher...')]);
}
function d3aLensHit(o,how){
  const A=AREA, R=A.rooms[o.room]; if(!R||R.solved) return false;
  if(!d3aZ(o.zone)){ if(!(o.nope>G.time)){ o.nope=G.time+1.4; ftext(o.x,o.y-96,S('Too high up!','Too high!'),'#e0ecff',13); } return false; }
  o.lit=true; solveRoom(R,true); d3aSnd('lens'); shake(4); flashA=0.25; flashCol='210,230,255';
  emit(o.x,o.y-80,30,{col:'220,236,255',smin:40,smax:160,lmin:.4,lmax:.9,zmin:1.5,zmax:3});
  setBanner(S('The lens shines!','The lens shines!'),S('A chain rattles. The grate over the east door rises.','The east grate opens!'),2.8);
  return true;
}
function d3aMuralLook(o){
  d3aSay([S('An old mural of moon-glass: three moons in a row. A FULL moon, a NEW moon, a FULL moon. Under it, words in old letters: SET THE ENGINE AS THE MOONS.','Three moons: FULL, NEW, FULL. It says: SET THE ENGINE LIKE THE MOONS.')]);
  G.found.m_lumen_mural=1;
}
function d3aVaultLook(o){
  if(G.flags.m_vault_open){ d3aSay([S('The vault stands open and empty.','The vault is open.')]); return; }
  d3aSay([canMoon()?S('A round vault door with a moon on it, sealed with thick silver moon-wax. Moonfire would melt it, even under the water.','A vault sealed with silver wax. Moonfire would melt it!'):S('A round vault door with a moon on it, sealed with thick silver moon-wax. Fire would only make bubbles down here. It wants moonlight.','A vault sealed with silver wax. It wants moonlight.')]);
}
function d3aVaultOpen(o){
  if(G.flags.m_vault_open) return;
  if(typeof m3pVaultOpen==='function') m3pVaultOpen();
  else { G.flags.m_vault_open=1; giveItems({m_book_raw:1}); d3aBeat('vault'); }
  d3aSnd('lens'); shake(4); emit(o.x,o.y-10,40,{col:'226,234,255',ang:-Math.PI/2,spread:1.2,smin:30,smax:150,lmin:.4,lmax:1,zmin:1.4,zmax:3});
  saveGame();
}
function d3aLeverPull(o){
  if(o.on||o.cd>0) return; const p=player, k=tCell(p.x,p.y);
  if(Math.max(0,dunH(k))<o.h&&!p.flying){ o.cd=1; ftext(o.x,o.y-40,S('It is up on top of the pillar.','It is up on the pillar.'),'#ffe8c0',13); return; }
  o.on=true; o.cd=0.5; const A=AREA, R=A.rooms[o.room]; G.found[d3aKey(A.def,R,'lever')]=1; SFX.play('block'); d3aSnd('click'); shake(2);
  if(R.leverDoes==='solve'){ solveRoom(R); }
  else { const ch=d3aGridSync(A); setBanner(S('Clunk!','Clunk!'),ch?S('Somewhere a grate grinds open.','A grate opens!'):S('A chain rattles, but something else still holds the grate.','Something else still holds the grate.'),2.4); }
  saveGame(); questPoke();
}
function d3aPadlock(o){
  const A=AREA, R=A.rooms[o.room], key=d3aKey(A.def,R,'padlock'); if(G.found[key]) return;
  if(A.keys()<=0){ d3aSay([S('A big brass padlock holds the grate shut. It needs a small key.','A padlock. It needs a small key.')]); return; }
  const kk='keys_'+caveDsid(A.def); G.found[kk]=Math.max(0,(G.found[kk]||0)-1); G.found[key]=1; SFX.play('chest'); d3aSnd('click'); shake(2);
  const ch=d3aGridSync(A); setBanner(S('Unlocked!','Unlocked!'),ch?S('The grate swings open.','The grate opens!'):S('The padlock falls off. The grate is still held by a lever somewhere.','A lever still holds it.'),2.6);
  saveGame(); questPoke();
}
function d3aBellRing(o){
  if(o.cd>0) return; o.cd=1; o.sw=1; d3aSnd('bell'); shake(3); emit(o.x,o.y-30,14,{col:'255,226,160',smin:20,smax:90,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4});
  if(G.found.m_burrows_bell) return; G.found.m_burrows_bell=1;
  setBanner(S('BONNNG','BONNNG'),S('Deep below, the worms of the Coil slow down. One pass every twelve seconds now.','The worms slow down!'),3);
  d3aBeat('bell'); saveGame(); questPoke();
}
// the E button
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.k==='d3a'){ if(o.act) o.act(o); return; } return base(o); }; }
// melee swings and thrown things: valves, levers, the bell, the lens, glass cactus, cracked glass
function d3aHitAt(x,y,r,src,arc){
  const A=AREA, X=A&&A.d3a; if(!X) return false; let hit=false; const p=player;
  const near=o=>arc?arc(o):dist(x,y,o.x,o.y)<r+(o.r||18);
  if(src!=='fire'&&src!=='moon'){
    for(const o of X.valves) if(o.cd<=0&&near(o)){ d3aValveTurn(o); hit=true; }
    for(const o of X.levers) if(!o.on&&near(o)){ d3aLeverPull(o); hit=true; }
    for(const o of X.bells) if(near(o)){ d3aBellRing(o); hit=true; }
    for(const o of A.objs) if(o.k==='d3a'&&o.kind==='cactus'&&near(o)&&!(o.ring>0)){ o.ring=0.8; d3aSnd('chime'); hit=true; if(!G.found[o.id]){ G.found[o.id]=1; addCoins(5,o.x,o.y); } }
    const S0=X.statue; if(S0&&(arc?arc({x:S0.x,y:S0.y-30,r:40}):dist(x,y,S0.x,S0.y-30)<r+50)){ const inW=P4.swim||p4Diving()||p.onWater||canWalkWater()&&tWet(tCell(p.x,p.y)); if(inW||!d3aZ(S0.zone)){ if(d3aLensHit(S0,src)) hit=true; } }
  }
  if(src==='hammer'||src==='bombs'){ const c=A.cave; for(const k of c.d3.dyn){ if(c.typ[k]!==253||c.grid[k]===0) continue; const q=tPos(k); if(dist(x,y,q.x,q.y)<r+40){ d3aCrackBreak(A,k); hit=true; } } }
  return hit;
}
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){ let h=base.apply(this,arguments); try{ if(AREA&&AREA.d3a&&d3aHitAt(x,y,r||8,src)) h=true; }catch(e){ console.error(e); } return h; }; }
{ const base=caveSwing; caveSwing=function(px,py,dir,range,half){ base.apply(this,arguments); try{ if(AREA&&AREA.d3a) d3aHitAt(px,py,range,'slash',o=>inArcC(px,py,dir,range+12,half,{x:o.x,y:o.y,r:o.r||18})); }catch(e){ console.error(e); } }; }
function d3aCrackBreak(A,k0){
  const c=A.cave, st=[k0], seen=new Set([k0]);
  while(st.length){ const k=st.pop(); G.found[d3aCrackKey(A.def,k)]=1; const q=tPos(k); emit(q.x,q.y,16,{col:'220,240,255',smin:40,smax:170,lmin:.3,lmax:.7,zmin:1.5,zmax:3.5});
    for(const d of DIRS){ const n=k+d[0]+d[1]*c.w; if(!seen.has(n)&&c.typ[n]===253){ seen.add(n); st.push(n); } } }
  d3aSnd('shatter'); shake(6); setBanner(S('CRASH!','CRASH!'),S('The cracked glass shatters.','The glass breaks!'),1.8);
  d3aGridSync(A); saveGame();
}
// switches in these dungeons are saved one by one; some do something (room field swDo:{'c,r':'sluice'})
{ const base=trialSwitchOn; trialSwitchOn=function(o){
    const was=o.on; base.apply(this,arguments); const A=AREA; if(!A||!A.d3a||was||!o.on||o.timed) return;
    G.found[o.id]=1; const R=A.rooms[o.room], m=/_H(\d+)_(\d+)$/.exec(o.id), key=m?m[1]+','+m[2]:'';
    const what=R&&R.swDo&&R.swDo[key];
    if(what==='sluice'&&!G.found.m_lumen_sluice){ G.found.m_lumen_sluice=1; d3aSnd('flood',0.5); setBanner(S('Something opens upstairs','The sluice opens!'),S('Far away, a sluice gate grinds open. Water can reach the Sunken Bridge now.','Water can reach the Sunken Bridge now.'),3.2); }
    if(d3aGridSync(A)) setBanner(S('The grate rises!','The grate rises!'),'',1.6);
    saveGame(); questPoke(); }; }

// ---------- 8. every frame
{ const base=updateCaveRooms; updateCaveRooms=function(dt){
    const A=AREA; base.apply(this,arguments);
    if(A&&AREA===A&&A.d3a) try{ d3aUpdate(A,dt); }catch(e){ console.error('d3a update',e); } }; }
function d3aUpdate(A,dt){
  const X=A.d3a, c=A.cave, p=player, T=A.tri, R=caveRoomAt(p.x,p.y), k=tCell(p.x,p.y), air=airborne();
  X.t+=dt; D3A.t=X.t;
  if(!air&&!p.flying&&k>=0) D3A.toH=Math.max(0,dunH(k));
  // the water level drawn follows the zones (about a second to fill or drain)
  for(const z in X.show){ const want=d3aZ(z); X.show[z]+=clamp(want-X.show[z],-dt*0.9,dt*0.9); }
  for(const o of X.locks) if(o.spin>0) o.spin-=dt;
  for(const o of X.valves){ if(o.spin>0) o.spin-=dt; if(o.cd>0) o.cd-=dt; }
  for(const o of X.levers) if(o.cd>0) o.cd-=dt;
  for(const o of X.bells){ if(o.cd>0) o.cd-=dt; if(o.sw>0) o.sw=Math.max(0,o.sw-dt*0.6); }
  for(const o of A.objs) if(o.k==='d3a'&&o.kind==='cactus'&&o.ring>0) o.ring-=dt;
  for(const [q,v] of X.plate){ const nv=v-dt; if(nv<=0) X.plate.delete(q); else X.plate.set(q,nv); }
  // first visits
  if(R&&X.enter[R.id]!==true){ X.enter[R.id]=true; d3aOnRoom(A,R); }
  // the three moon lamps of the Hall of Tides lit: the mosaic wakes (the story plays it once)
  if(!X.mosaic&&A.def.id==='m_lumen'&&A.rooms.b&&A.rooms.b.solved){ X.mosaic=true; d3aBeat('mosaic'); }
  // the lens: a diver touching it
  const S0=X.statue; if(S0&&p4Diving()&&dist(p.x,p.y,S0.x,S0.y)<56) d3aLensHit(S0,'dive');
  // the vault: Moonfire on it, under the water too
  const V=X.vault; if(V&&!G.flags.m_vault_open&&typeof p4MoonHits==='function'){ if(p4MoonHits(V.x,V.y-10,30)){ V.heat+=dt; if(Math.random()<0.4) emit(V.x+rand(-18,18),V.y-14,1,{col:'230,236,255',ang:-Math.PI/2,spread:0.7,smin:20,smax:50,lmin:.4,lmax:.8,zmin:1.4,zmax:2.6}); if(V.heat>1) d3aVaultOpen(V); } else V.heat=Math.max(0,V.heat-dt*0.5); }
  // Duchess in her attic air pocket
  const Dq=X.duch; if(Dq){ Dq.t=G.time; if(G.flags.m_duchess) X.duch=null; else if(scene==='play'&&!DLG&&dist(p.x,p.y,Dq.x,Dq.y)<110&&!p4Diving()){ X.duch=null; if(typeof m3pDuchessMeet==='function') m3pDuchessMeet(); else d3aBeat('duchess'); } }
  // the Moon Well: after Ember's gift, the first dive opens the market door again
  if(G.found.m_lumen_eshut&&!G.found.m_lumen_dive1&&R&&R.id==='d'&&d3aIn('m_lumen')&&!P4.mv){ G.found.m_lumen_dive1=1; refreshCaveGates(); setBanner(S('Your first dive!','Your first dive!'),S('The old well brought you up in the market fountain. The door to the hall is open again.','You swam through! The door opens again.'),3); saveGame(); }
  // the plate door: once the block holds the plate, it stays open
  for(const o of A.gates){ if(o.type!=='plate'||!o.pr) continue; const fk=`d3plate_${caveSid(A.def)}_${o.pr}`; if(G.found[fk]) continue; const pl=A.objs.filter(q=>q.k==='plate'&&q.room===o.pr); if(pl.length&&pl.every(q=>q.pressed)){ G.found[fk]=1; refreshCaveGates(); setBanner(S('The stone door rolls open','The door opens!'),S('The block holds the plate down. The door will stay open now.','The block holds it. It stays open.'),2.8); saveGame(); } }
  // plates that hold a while after you step off (room plateHold), and the d3aplates rooms
  for(const id in A.rooms){ const Q=A.rooms[id]; if(!Q.plateHold) continue; const pl=A.objs.filter(q=>q.k==='plate'&&q.room===id); if(!pl.length) continue;
    for(const o of pl){ if(o.pressed){ o.d3h=Q.plateHold*(d3aEasy()?1.4:1); } else if(o.d3h>0){ o.d3h-=dt; o.pressed=true; } }
    if(Q.kind==='d3aplates'&&!Q.solved&&pl.every(o=>o.pressed)) solveRoom(Q); }
  // reach the goal (d3areach): the far door of the Bubble Clock
  if(R&&R.kind==='d3areach'&&!R.solved&&R.goal&&k>=0){ const ci=k%c.w-R.ox-1, cj=Math.floor(k/c.w)-R.oy-1, g=R.goal; if(ci>=g[0]&&ci<=g[2]&&cj>=g[1]&&cj<=g[3]&&!air) solveRoom(R); }
  // sand flows carry what stands on them (a block anywhere in a fall plugs it)
  d3aFlows(A,dt);
  // the worm clock
  d3aLanes(A,dt);
  // diving in a current room (room field push:[dx,dy,v]): the sea leans east
  if(R&&R.push&&p4Diving()){ tNudge(p,R.push[0]*R.push[2]*dt,R.push[1]*R.push[2]*dt); }
}
function d3aOnRoom(A,R){
  const root=dunRoot(A.def.id);
  if(root==='m_lumen'){
    if(R.id==='l') d3aBeat('library');
    if(R.id==='n'&&A.def.id.endsWith('_b1')){ d3aBeat('window'); for(const o of A.d3a.winds) o.eye=4; }
    if(R.id==='f'&&canDive()) later(1,()=>d3aTip('dive1',S('The First Dive','The First Dive'),S(`Dive with ${d3aCtl('roll')}. The blue ring is your air. Bubbles fill it up again.`,`Press ${d3aCtl('roll')} to dive. Bubbles give air!`)));
  }
  if(root==='m_burrows'){
    // the bell was rung but its scene never played (a save and quit straight after): play it now
    if(G.found.m_burrows_bell&&R.id==='m'&&A.def.id.endsWith('_b2')) d3aBeat('bell');
    if(R.lanes&&R.lanes.length) later(0.8,()=>d3aTip('lanes',S('Worm lanes','Worm lanes'),S('Rippling sand means a worm is coming. Get off the lane, burrow under it, or Blaze a glass plate onto it.','Ripples mean a worm! Get off, or burrow!')));
  }
}
// ---- sand flows
function d3aDammed(A,k){ const D=A.cave.d3, ci=D.flowComp[k]; if(ci<0) return false; const cells=D.comps[ci].cells; for(const b of A.blocks){ if(b.sunk) continue; const bk=b.cj*A.cave.w+b.ci; if(D.flowComp[bk]===ci) return true; } return false; }
function d3aFlows(A,dt){
  const c=A.cave, p=player, k=tCell(p.x,p.y), dn=A.dn, T=A.tri;
  const push=(e,kk,v)=>{ if(kk<0||c.typ[kk]!==251||d3aDammed(A,kk)) return; const d=DIRS[c.flow[kk]]||DIRS[2]; tNudge(e,d[0]*v*dt,d[1]*v*dt); };
  if(k>=0&&c.typ[k]===251&&!airborne()&&!p.flying&&!(dn&&dn.ride)&&scene==='play'&&!P4.mv){ const R=caveRoomAt(p.x,p.y); let v=(R&&R.flowV)||230; if(P4.mode==='burrow') v*=1.6; push(p,k,v); if(T) T.pushed=true;
    if(!D3A.tip.flow) d3aTip('flow',S('A sandfall!','A sandfall!'),S('Moving sand carries you along. A push block can plug a sandfall. Burrowed, you ride it fast.','Moving sand carries you! A block can stop it.')); }
  for(const e of G.enemies){ if(e.dead||!e.inArea||e.flying||e.boss) continue; const q=tCell(e.x,e.y); if(q>=0&&c.typ[q]===251) push(e,q,150); }
}
// ---- the worm clock: rumble 2 s before each pass, then the worm bursts out of one end and arcs to the other
const D3A_PASS=1.3;
function d3aLanePer(L){ let per=L.per; if(L.bellPer&&G.found.m_burrows_bell) per=L.bellPer; if(d3aEasy()) per*=1.25; return per; }
function d3aLanes(A,dt){
  const X=A.d3a, p=player; if(!X.lanes.length) return;
  for(const L of X.lanes){
    const per=d3aLanePer(L), tt=X.t+L.ph*per/6+(L.ph||0), n=Math.floor(tt/per), ph=tt-n*per, pass=d3aEasy()?D3A_PASS*1.25:D3A_PASS;
    const wasR=L.rumble; L.rumble=ph>=Math.max(pass,per-2);
    if(L.rumble&&!wasR&&inView((L.x0+L.x1)/2,(L.y0+L.y1)/2,500)) d3aSnd('rumble',0.5);
    if(ph<pass){
      if(L.last!==n){ L.last=n; L.dir=n%2?-1:1; L.bonk=-1; L.gulped=false; if(inView((L.x0+L.x1)/2,(L.y0+L.y1)/2,500)){ shake(3); SFX.play('boom',0.35); } }
      L.state='pass'; L.u=ph/pass;
      const len=Math.hypot(L.x1-L.x0,L.y1-L.y0), s=L.dir>0?L.u*len:(1-L.u)*len;
      // a glass plate on the lane: the worm bonks its nose and goes home for this pass
      if(L.bonk<0){ const hx=L.x0+(L.x1-L.x0)*(s/len), hy=L.y0+(L.y1-L.y0)*(s/len), hk=tCell(hx,hy);
        if(hk>=0&&(X.plate.get(hk)>0||(A.p4&&A.p4.plate&&A.p4.plate.get(hk)>0))){ L.bonk=L.u; d3aSnd('bonk'); shake(4); ftext(hx,hy-50,S('BONK!','BONK!'),'#ffe8b0',16); emit(hx,hy,20,{col:'230,240,255',smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } }
      if(L.bonk>=0){ L.head=-1; continue; }
      L.head=s;
      // anything on the lane's surface at the worm's head is swallowed
      const hx=L.x0+(L.x1-L.x0)*(s/len), hy=L.y0+(L.y1-L.y0)*(s/len);
      if(!p.dead&&scene==='play'&&P4.mode!=='burrow'&&!(P4.mv&&P4.mv.kind==='dig')&&!p.flying&&!(D3A.gulp)){
        const ux=(L.x1-L.x0)/len, uy=(L.y1-L.y0)/len, rx=p.x-L.x0, ry=p.y-L.y0, along=rx*ux+ry*uy, perp=Math.abs(-rx*uy+ry*ux);
        if(perp<L.hw+p.r*0.6&&Math.abs(along-s)<34) d3aGulp(A,L);
      }
      for(const e of G.enemies){ if(e.dead||!e.inArea||e.boss||e.mini||e.flying||e.caveBoss) continue; if(dist(e.x,e.y,hx,hy)<34+e.r*0.5&&tCell(e.x,e.y)>=0&&L.cells.has(tCell(e.x,e.y))){ ftext(e.x,e.y-30,S('GULP!','GULP!'),'#ffe0b0',15); killEnemy(e); } }
    } else { L.state=L.rumble?'rumble':'idle'; L.head=-1; }
  }
}
function d3aGulp(A,L){
  const p=player, R=L.R, T=A.tri; D3A.gulp={t:0};
  d3aSnd('gulp'); shake(6); ftext(p.x,p.y-40,S('GULP!','GULP!'),'#ffe0b0',16);
  later(0.45,()=>{ D3A.gulp=null; if(AREA!==A||p.dead) return;
    const to=(T&&T.entry&&caveRoomAt(T.entry.x,T.entry.y)===R)?T.entry:dunNearGround(R.cx,R.y1-60,8);
    p.x=to.x; p.y=to.y; p.kvx=p.kvy=0; if(P4.mode) P4.mode=null; G.fade=0.6; updateCam(0,true); if(T){ T.lx=p.x; T.ly=p.y; }
    if(!d3aGod()){ p.hp=Math.max(1,p.hp-Math.ceil(p.maxHp*0.1)); p.lastHurt=G.time; G.hurtVig=0.5; p.hurtFlash=0.12; }
    p.iframes=Math.max(p.iframes,1.2); d3aSnd('ptoo'); ftext(p.x,p.y-36,S('PTOO!','PTOO!'),'#ffe8c0',17);
    d3aTip('gulp',S('Swallowed!','Swallowed!'),S('The worm spat you out. Watch for the rumble, then get off the lane or burrow under it.','Watch for the rumble! Get off, or burrow.')); });
}
// Blaze (the blue jet) on sand makes a glass plate (worms bonk on it), on quicksand a glass path (p4GlassPlate)
if(typeof p3FireTick==='function'){ const base=p3FireTick; p3FireTick=function(p,dt,blue){ base(p,dt,blue); try{
  const A=AREA; if(!blue||!A||!A.d3a||typeof P3==='undefined'||!P3.jet) return; const J=P3.jet, ca=Math.cos(J.ang), sa=Math.sin(J.ang), c=A.cave;
  for(let s=30;s<=J.L;s+=30){ const x=J.ox+ca*s, y=J.oy+sa*s, k=tCell(x,y); if(k<0) continue; const t=c.typ[k];
    if(t===65||t===66){ if(typeof p4GlassPlate==='function') p4GlassPlate(x,y); }
    else if((t===62||t===251)&&A.d3a.lanes.some(L=>L.cells.has(k))){ if(!(A.d3a.plate.get(k)>0)){ const q=tPos(k); emit(q.x,q.y,10,{col:'230,240,255',smin:30,smax:100,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } A.d3a.plate.set(k,20); } } }catch(e){ console.error(e); } }; }

// ---------- 9. the story: Ember's gift moments, the first-dive door, the back door, the Burrows' sandfall down
{ const base=grantAbility; grantAbility=function(id){
    const had=!!(G&&G.abil&&G.abil[id]);
    if(D3A.noGift&&d3aIn()&&(id==='dive'||id==='burrow')) return;
    base(id);
    try{ if(!had&&id==='dive'&&d3aIn('m_lumen')){ const R=caveRoomAt(player.x,player.y); if(R&&R.id==='e'){ G.found.m_lumen_eshut=1; refreshCaveGates(); later(3.2,()=>{ if(d3aIn('m_lumen')) d3aSay([['ember',S('Oh! The door has shut behind you. Never mind. The quick way out is down, little fish. Dive into the well.','The door shut! The way out is down. Dive into the well!')]]); }); } }
      if(!had&&id==='burrow'&&d3aIn('m_burrows')) later(3.4,()=>{ if(d3aIn('m_burrows')) d3aTip('burrow1',S('Burrow','Burrow'),S(`Stand on sand and press ${d3aCtl('roll')}. The seam in the north wall has sand under it.`,`Press ${d3aCtl('roll')} on sand to dig!`)); }); }catch(e){ console.error(e); } }; }
// Old Lumen's back door (x3_world's dive pool on the Drowned Reach) comes up in the Seafloor Plaza; until the sluice is
// open it comes up in the First Dive instead (so nobody is stranded west of a dry channel)
if(typeof M3W_BACKDOOR!=='undefined') M3W_BACKDOOR.enter=A=>{ try{
  const to=G.found.m_lumen_sluice?{area:'m_lumen_f1',room:'h',at:[7,6]}:{area:'m_lumen_f2',room:'f',at:[7,1]};
  later(0.05,()=>{ if(!AREA||dunRoot(AREA.def.id)!=='m_lumen') return; dunGoFloor(to.area,{}); const R=AREA.rooms[to.room]; if(!R) return; const cs=AREA.cave.cell, x=AREA.x0+(R.ox+1+to.at[0]+0.5)*cs, y=AREA.y0+(R.oy+1+to.at[1]+0.5)*cs; player.x=x; player.y=y; updateCam(0,true); if(canDive()&&p4DeepAt(x,y)) p4DiveBegin(player); setBanner(S('Drowned Lumen','Drowned Lumen'),S('You swim in through a broken window.','In through a window!'),2.2); });
}catch(e){ console.error(e); } };

// ---------- 10. art: the looks
defineDungeonTheme('m_lumen',{style:{floor:'#b9c6da',floor2:'#b1bed3',top:'#8394be',face:'#36416c',edge:'#eef4ff',water:'#2e78b0',accent:'#a8e4ff'},decor:'shell',
  pal:{tile:['#b9c6da','#b1bed3','#b9c6da','#b1bed3'],grout:'rgba(40,50,90,.22)',moss:'150,200,220',rune:'200,226,255',hole:'#0a1224',lip:['#8394be','#36416c'],water:'#2e78b0',cave:true}});
defineDungeonTheme('m_burrows',{style:{floor:'#d0a86c',floor2:'#c8a064',top:'#b08250',face:'#5c3c24',edge:'#fbe0a8',water:'#2e5a7a',accent:'#7ad8ff'},decor:'shroom',
  pal:{tile:['#d0a86c','#c8a064','#d0a86c','#c8a064'],grout:'rgba(70,40,20,.25)',moss:'120,200,230',rune:'150,220,255',hole:'#160c06',lip:['#b08250','#5c3c24'],water:'#2e5a7a',cave:true}});
const D3A_WATER='46,122,178';
// the cached floor picture: tide cells drawn dry (the water is live), sand flows, glass, cracks and grates
{ const base=trialPaintCell; trialPaintCell=function(g,c,k,i,j,x,y,cs,st,rng,def){
    const t=c.typ[k]; if(!d3aMine(t)||!c.d3) return base.apply(this,arguments);
    try{ d3aPaintCell(g,c,k,i,j,x,y,cs,st,rng,def); }catch(e){ console.error(e); } return true; }; }
function d3aPaintCell(g,c,k,i,j,x,y,cs,st,rng,def){
  const t=c.typ[k];
  if(t===250){ const s=c.d3.sub[k];
    if(s===D3S.W||s===D3S.F||s===D3S.L){ dunTile(g,x,y,cs,st,i,j,rng,s===D3S.F?-0.06:-0.03);
      // wet marble: a tide line and a few drips of weed
      g.fillStyle='rgba(40,90,140,.12)'; g.fillRect(x,y,cs,cs);
      if(rng()<0.35){ g.fillStyle='rgba(70,130,110,.35)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,3+rng()*4,1.5,rng()*3,0,TAU); g.fill(); }
      // what the sea leaves behind: puddles, a shell, a starfish
      const r1=rng();
      if(s===D3S.W&&r1<0.2){ const px=x+cs*(0.3+rng()*0.4), py=y+cs*(0.3+rng()*0.4), rw=cs*(0.16+rng()*0.12); g.fillStyle='rgba(60,120,170,.32)'; g.beginPath(); g.ellipse(px,py,rw,rw*0.55,0,0,TAU); g.fill(); g.fillStyle='rgba(235,248,255,.5)'; g.beginPath(); g.ellipse(px-rw*0.35,py-rw*0.15,rw*0.3,rw*0.12,-0.3,0,TAU); g.fill(); }
      else if(s===D3S.W&&r1<0.27){ const px=x+cs*(0.25+rng()*0.5), py=y+cs*(0.25+rng()*0.5), a0=rng()*TAU; g.fillStyle='#e8906a'; g.beginPath(); for(let n=0;n<10;n++){ const a=a0+n*Math.PI/5, rr=n%2?2.2:6; g.lineTo(px+Math.cos(a)*rr,py+Math.sin(a)*rr); } g.closePath(); g.fill(); g.strokeStyle='rgba(120,50,30,.55)'; g.lineWidth=1; g.stroke(); }
      else if(s===D3S.W&&r1<0.34){ const px=x+cs*(0.25+rng()*0.5), py=y+cs*(0.25+rng()*0.5); g.fillStyle='#f4e6d4'; g.beginPath(); g.moveTo(px,py+4); g.arc(px,py+4,6,Math.PI*1.1,Math.PI*1.9); g.closePath(); g.fill(); g.strokeStyle='rgba(150,110,90,.6)'; g.lineWidth=1; for(let n=-2;n<=2;n++){ g.beginPath(); g.moveTo(px,py+4); g.lineTo(px+n*2.6,py-1.5); g.stroke(); } }
      if(s===D3S.F){ g.strokeStyle='rgba(30,40,80,.28)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+4,y+5); g.quadraticCurveTo(x+cs/2,y-2,x+cs-4,y+5); g.stroke(); }
      if(s===D3S.L){ g.fillStyle='rgba(60,70,100,.35)'; for(let n=0;n<4;n++){ g.beginPath(); g.ellipse(x+8+rng()*(cs-16),y+8+rng()*(cs-16),6,4,0,0,TAU); g.fill(); } }
      return; }
    // pits: the dry bottom of a channel or trench; a sunken bridge lies on the bottom
    dunHoleArt(g,c,i,j,x,y,cs,st,null);
    g.fillStyle='rgba(30,60,100,.35)'; g.fillRect(x+2,y+cs*0.55,cs-4,cs*0.45);
    if(s===D3S.B){ g.fillStyle='#3e4a6a'; g.fillRect(x+3,y+cs*0.35,cs-6,cs*0.5); g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(x+3,y+cs*0.35,cs-6,3); g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=1.5; g.strokeRect(x+3.5,y+cs*0.35+0.5,cs-7,cs*0.5-1); }
    return; }
  if(t===251){ // sand: a warm tile with streaks that point the way it runs
    g.fillStyle=(i+j)%2?'#e6c482':'#e0bc78'; g.fillRect(x,y,cs,cs);
    const d=DIRS[c.flow[k]]||DIRS[2]; g.strokeStyle='rgba(150,100,50,.35)'; g.lineWidth=2;
    for(let n=0;n<3;n++){ const o=(n-1)*cs*0.28; g.beginPath(); if(d[0]===0){ g.moveTo(x+cs/2+o,y+4); g.lineTo(x+cs/2+o+rng()*4-2,y+cs-4); } else { g.moveTo(x+4,y+cs/2+o); g.lineTo(x+cs-4,y+cs/2+o+rng()*4-2); } g.stroke(); }
    return; }
  if(t===253||t===254){ dunTile(g,x,y,cs,st,i,j,rng,-0.04); if(t===253&&c.grid[k]===0){ g.fillStyle='rgba(220,240,255,.55)'; for(let n=0;n<6;n++){ const px=x+rng()*cs, py=y+rng()*cs; g.beginPath(); g.moveTo(px,py-3); g.lineTo(px+3,py+2); g.lineTo(px-3,py+2); g.closePath(); g.fill(); } } return; }
  dunTile(g,x,y,cs,st,i,j,rng,0);
}
// over the base picture: glass walls, cracked glass, closed grates (as bars or a sand plug), moon windows and rib bones
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){
    base.apply(this,arguments); if(!d3aDun(def)||!A.canvas||!A.cave||!A.cave.d3) return; try{ d3aOverPaint(A,def); }catch(e){ console.error(e); } }; }
function d3aOverPaint(A,def){
  const c=A.cave, cs=c.cell, g=A.canvas.getContext('2d'), rng=mulberry32(def.seed*7+3), lumen=def.theme==='m_lumen';
  g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0);
  const open=(i,j)=>i>=0&&j>=0&&i<c.w&&j<c.h&&c.grid[j*c.w+i]===0;
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){ const k=j*c.w+i, t=c.typ[k], x=i*cs, y=j*cs;
    if(t===252||(t===253&&c.grid[k]===1)){ // glass: pale cyan block, bright top facet, a face if floor lies south
      const face=open(i,j+1), th=face?cs*0.62:cs;
      g.fillStyle='#bfe6f0'; g.fillRect(x,y,cs,th); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(x+3,y+3,cs-6,4); g.fillRect(x+3,y+3,4,th-6);
      g.strokeStyle='rgba(90,150,180,.6)'; g.lineWidth=2; g.strokeRect(x+1,y+1,cs-2,th-2);
      if(face){ const gr=g.createLinearGradient(0,y+th,0,y+cs); gr.addColorStop(0,'#7fb6c8'); gr.addColorStop(1,'#3a5a6a'); g.fillStyle=gr; g.fillRect(x,y+th,cs,cs-th); g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(x+cs*0.3,y+th+2,3,cs-th-4); }
      if(t===253){ g.strokeStyle='rgba(40,70,90,.75)'; g.lineWidth=2; g.beginPath(); const cx=x+cs*0.5, cy=y+th*0.5; for(let a=0;a<6;a++){ const an=a*1.05+rng()*0.4; g.moveTo(cx,cy); g.lineTo(cx+Math.cos(an)*cs*0.45,cy+Math.sin(an)*th*0.45); } g.stroke(); }
      continue; }
    if(t===254&&c.grid[k]===1){ dunTile(g,x,y,cs,CAVE_STYLE[def.theme],i,j,rng,-0.1);
      if(lumen){ g.fillStyle='#2a3048'; g.fillRect(x,y+cs*0.1,cs,5); g.fillRect(x,y+cs*0.82,cs,5); for(let n=0;n<4;n++){ const bx=x+6+n*11; g.fillStyle='#22283c'; g.fillRect(bx,y+2,5,cs-4); g.fillStyle='#8a94b8'; g.fillRect(bx+1,y+2,2,cs-4); } }
      else { g.fillStyle='#c89a5a'; g.beginPath(); g.ellipse(x+cs/2,y+cs*0.55,cs*0.5,cs*0.42,0,0,TAU); g.fill(); g.fillStyle='#e8c07a'; g.beginPath(); g.ellipse(x+cs/2-3,y+cs*0.45,cs*0.36,cs*0.26,0,0,TAU); g.fill(); g.strokeStyle='rgba(120,80,40,.5)'; g.lineWidth=1.5; g.beginPath(); g.arc(x+cs/2,y+cs*0.6,cs*0.25,Math.PI*1.1,Math.PI*1.9); g.stroke(); }
      continue; }
    // a lone pillar in a Lumen street is an old market stall: a faded striped awning on top
    if(lumen&&c.grid[k]===1&&t<250&&open(i-1,j)&&open(i+1,j)&&open(i,j-1)&&open(i,j+1)){
      const cols=[['#c86a5a','#efe2c8'],['#4f86a8','#e8eef2'],['#6a9a6a','#f0e6c8']][(i*3+j)%3], aw=cs+10, ax=x-5, ay=y-6, ah=cs*0.5;
      g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(ax+4,ay+ah+2,aw-4,8);
      for(let n=0;n<5;n++){ g.fillStyle=cols[n%2]; g.fillRect(ax+n*aw/5,ay,aw/5+0.5,ah); }
      g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(ax,ay,aw,4);
      for(let n=0;n<5;n++){ g.fillStyle=cols[n%2]; g.beginPath(); g.arc(ax+(n+0.5)*aw/5,ay+ah,aw/10,0,Math.PI); g.fill(); }
      g.strokeStyle='rgba(30,30,50,.45)'; g.lineWidth=1.5; g.strokeRect(ax+0.5,ay+0.5,aw-1,ah); g.fillStyle='rgba(40,90,140,.18)'; g.fillRect(ax,ay,aw,ah*0.5);
      continue; }
    // wall decorations on wall faces
    if(c.grid[k]===1&&t!==254&&open(i,j+1)&&!open(i,j-1)){
      if(lumen&&rng()<0.18){ const cx=x+cs/2, cy=y+cs*0.34; g.fillStyle='#1c2744'; g.beginPath(); g.arc(cx,cy,cs*0.24,0,TAU); g.fill(); g.fillStyle='rgba(150,210,255,.55)'; g.beginPath(); g.arc(cx,cy,cs*0.19,0,TAU); g.fill(); g.strokeStyle='rgba(230,240,255,.8)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(cx-cs*0.19,cy); g.lineTo(cx+cs*0.19,cy); g.moveTo(cx,cy-cs*0.19); g.lineTo(cx,cy+cs*0.19); g.stroke(); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(cx-4,cy-4,2.4,0,TAU); g.fill(); }
      else if(!lumen&&rng()<0.22){ const cx=x+cs/2; g.strokeStyle='#f4ead2'; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.arc(cx,y+cs*0.62,cs*0.34,Math.PI*1.08,Math.PI*1.92); g.stroke(); g.strokeStyle='rgba(120,90,60,.5)'; g.lineWidth=1.2; g.stroke(); }
      else if(!lumen&&rng()<0.12){ g.fillStyle='rgba(170,230,255,.45)'; g.beginPath(); g.moveTo(x+cs*0.2,y+cs*0.2); g.lineTo(x+cs*0.32,y+cs*0.05); g.lineTo(x+cs*0.8,y+cs*0.5); g.lineTo(x+cs*0.7,y+cs*0.6); g.closePath(); g.fill(); }
    } }
  // the Drowned Library's walls are bookcases: a wooden top and rows of spines on the face
  for(const id in A.rooms){ const R=A.rooms[id]; if(!R.shelves) continue;
    for(let j=R.oy+1;j<R.oy+12;j++) for(let i=R.ox+1;i<R.ox+16;i++){ const k=j*c.w+i; if(c.grid[k]!==1||c.typ[k]>=60||!open(i,j+1)) continue; const x=i*cs, y=j*cs, fy=y+cs*0.6, fh=cs*0.4;
      g.fillStyle='#7a5a3e'; g.fillRect(x+1,y+cs*0.12,cs-2,cs*0.48); g.fillStyle='rgba(255,230,190,.18)'; g.fillRect(x+1,y+cs*0.12,cs-2,3);
      g.fillStyle='#4a3020'; g.fillRect(x,fy,cs,fh); let bx=x+3;
      while(bx<x+cs-5){ const bw=3+Math.floor(rng()*4), bh=fh*(0.55+rng()*0.4); g.fillStyle=['#8a3c3c','#3c5a8a','#5a7a3c','#9a7a3a','#6a4a8a','#2f6a6a'][Math.floor(rng()*6)]; g.fillRect(bx,fy+fh-bh-1,bw,bh); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(bx,fy+fh-bh-1,1,bh); bx+=bw+1; }
      g.fillStyle='rgba(30,70,120,.22)'; g.fillRect(x,fy,cs,fh); } }
  // the Tide Engine: brass pipes from each valve wheel up into the wall
  for(const id in A.rooms){ const R=A.rooms[id]; if(R.kind!=='d3aengine') continue;
    for(const m of c.marks){ if(m.room!==id||m.ch!=='ᛝ') continue; const x=(m.i+0.5)*cs; let j=m.j-1; while(j>0&&c.grid[j*c.w+m.i]===0) j--; const y0=(j+1)*cs-4, y1=(m.j+0.5)*cs-14;
      if(y1>y0){ g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x-5,y0+4,14,y1-y0); g.fillStyle='#b08a4a'; g.fillRect(x-7,y0,14,y1-y0); g.fillStyle='rgba(255,240,200,.45)'; g.fillRect(x-5,y0,3,y1-y0); g.strokeStyle='rgba(70,50,20,.7)'; g.lineWidth=1.5; g.strokeRect(x-7,y0,14,y1-y0);
        for(let yy=y0+10;yy<y1-6;yy+=cs*0.9){ g.fillStyle='#8a6a34'; g.fillRect(x-9,yy,18,5); } } } }
  g.restore();
}
// the live floor layer: tide water (rising and draining), sand running, worm lanes rumbling, glass plates
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(A&&A.d3a) try{ d3aFloor(A,t); }catch(e){ console.error(e); } }; }
function d3aFloor(A,t){
  const X=A.d3a, c=A.cave, cs=c.cell, D=c.d3;
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1);
  const j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  const wetF=k=>{ const zi=D.zi[k]; if(zi<0) return c.typ[k]===TY.deep||c.typ[k]===60||c.typ[k]===61?1:0; const s=D.sub[k]; return s===D3S.B?0:X.show[D.zones[zi]]; };
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){
    const k=j*c.w+i, ty=c.typ[k], x=A.x0+i*cs, y=A.y0+j*cs;
    if(ty===250){ const s=D.sub[k], zi=D.zi[k], f=zi>=0?X.show[D.zones[zi]]:0;
      if(s===D3S.B){ // the bridge: lying on the bottom, or floating at the top
        if(f>0.02){ ctx.fillStyle=`rgba(${D3A_WATER},${0.3+0.6*f})`; ctx.fillRect(x,y,cs,cs); }
        if(f>0.05){ const bob=Math.sin(t*1.8+i)*1.6*f, s2=0.75+0.25*f; ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(x+4,y+8+bob,cs-6,cs-8);
          ctx.fillStyle=r2c('#c6cfe2',(f-1)*0.5); ctx.fillRect(x+cs*(1-s2)/2,y+cs*(1-s2)/2+bob,cs*s2,cs*s2); ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(x+cs*(1-s2)/2,y+cs*(1-s2)/2+bob,cs*s2,3); ctx.strokeStyle='rgba(40,50,90,.6)'; ctx.lineWidth=1.5; ctx.strokeRect(x+cs*(1-s2)/2,y+cs*(1-s2)/2+bob,cs*s2,cs*s2); }
        continue; }
      if(f<0.01) continue;
      const full=s===D3S.F||s===D3S.T;
      ctx.fillStyle=full?`rgba(30,84,150,${0.3+0.62*f})`:`rgba(${D3A_WATER},${0.25+0.6*f})`; ctx.fillRect(x,y,cs,cs);
      const ph=t*1.6+i*0.7+j*1.3; ctx.strokeStyle=`rgba(210,240,255,${0.16*f})`; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x+6,y+cs*0.55+Math.sin(ph)*3); ctx.quadraticCurveTo(x+cs/2,y+cs*0.45+Math.sin(ph+1)*3,x+cs-6,y+cs*0.6+Math.sin(ph+2)*3); ctx.stroke();
      if(full&&f>0.6){ // a ceiling over the water: a dark lintel and little arches, so you can see there is no air here
        ctx.fillStyle=`rgba(16,30,60,${0.35*f})`; ctx.fillRect(x,y,cs,5); ctx.strokeStyle=`rgba(190,210,255,${0.22*f})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(x+cs/2,y+cs*0.9,cs*0.38,Math.PI*1.15,Math.PI*1.85); ctx.stroke(); }
      // white foam where the water meets dry floor
      if(f>0.5){ ctx.strokeStyle=`rgba(240,250,255,${0.55*(f-0.5)*2})`; ctx.lineWidth=2.4; ctx.lineCap='round';
        for(const [d,x0,y0,x1,y1] of [[[0,-1],x+3,y+2,x+cs-3,y+2],[[0,1],x+3,y+cs-2,x+cs-3,y+cs-2],[[-1,0],x+2,y+3,x+2,y+cs-3],[[1,0],x+cs-2,y+3,x+cs-2,y+cs-3]]){
          const q=k+d[0]+d[1]*c.w; if(q<0||q>=c.typ.length||c.grid[q]===1) continue; if(wetF(q)>0.5) continue; ctx.beginPath(); ctx.moveTo(x0,y0+Math.sin(ph)*0.8); ctx.lineTo(x1,y1+Math.sin(ph+1)*0.8); ctx.stroke(); } }
      continue; }
    if(ty===251){ // sand on the move: chevrons sliding the way it runs (still when plugged)
      const dm=d3aDammed(A,k), d=DIRS[c.flow[k]]||DIRS[2], sp=dm?0:1;
      ctx.strokeStyle=dm?'rgba(150,110,60,.35)':'rgba(255,240,200,.6)'; ctx.lineWidth=2.4; ctx.lineCap='round';
      for(let n=0;n<2;n++){ const f=(((t*1.3*sp)+n*0.5)%1)-0.5, px=x+cs/2+d[0]*f*cs, py=y+cs/2+d[1]*f*cs;
        ctx.beginPath(); ctx.moveTo(px-d[0]*5-d[1]*8,py-d[1]*5-d[0]*8); ctx.lineTo(px+d[0]*4,py+d[1]*4); ctx.lineTo(px-d[0]*5+d[1]*8,py-d[1]*5+d[0]*8); ctx.stroke(); }
      if(!dm&&Math.random()<0.02) emit(x+rand(6,cs-6),y+rand(6,cs-6),1,{col:'226,194,122',glow:false,ang:Math.atan2(d[1],d[0]),spread:0.3,smin:40,smax:90,lmin:.3,lmax:.5,zmin:1.2,zmax:2});
      continue; }
  }
  // glass plates (Blaze) on worm lanes
  for(const [k,v] of X.plate){ const q=tPos(k); if(!inView(q.x,q.y,40)) continue; const a=Math.min(1,v/2); ctx.fillStyle=`rgba(210,236,255,${0.55*a})`; rrect(ctx,q.x-cs/2+3,q.y-cs/2+3,cs-6,cs-6,8); ctx.fill(); ctx.strokeStyle=`rgba(255,255,255,${0.8*a})`; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle=`rgba(255,255,255,${0.6*a})`; ctx.fillRect(q.x-cs/2+8,q.y-cs/2+8,10,3); }
  // worm lanes: a ribbed track in the sand; ripples and jumping grains while a worm is coming
  for(const L of X.lanes){ if(!inView((L.x0+L.x1)/2,(L.y0+L.y1)/2,Math.hypot(L.x1-L.x0,L.y1-L.y0)/2+80)) continue; d3aDrawLane(L,t); }
}
function d3aDrawLane(L,t){
  const len=Math.hypot(L.x1-L.x0,L.y1-L.y0), ux=(L.x1-L.x0)/len, uy=(L.y1-L.y0)/len, nx=-uy, ny=ux, hw=L.hw;
  ctx.save(); ctx.lineCap='round';
  // the track: two faint grooves and ribs across
  ctx.strokeStyle='rgba(110,70,40,.22)'; ctx.lineWidth=3; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(L.x0+nx*hw*0.8*s-ux*20,L.y0+ny*hw*0.8*s-uy*20); ctx.lineTo(L.x1+nx*hw*0.8*s+ux*20,L.y1+ny*hw*0.8*s+uy*20); ctx.stroke(); }
  for(let s=0;s<=len;s+=26){ const x=L.x0+ux*s, y=L.y0+uy*s; ctx.strokeStyle='rgba(110,70,40,.16)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-nx*hw*0.7,y-ny*hw*0.7); ctx.lineTo(x+nx*hw*0.7,y+ny*hw*0.7); ctx.stroke(); }
  // the holes at each end
  for(const [x,y] of [[L.x0-ux*18,L.y0-uy*18],[L.x1+ux*18,L.y1+uy*18]]){ ctx.fillStyle='rgba(40,22,10,.55)'; ctx.beginPath(); ctx.ellipse(x,y,hw*0.8,hw*0.45,Math.atan2(uy,ux)+Math.PI/2,0,TAU); ctx.fill(); }
  if(L.rumble||L.state==='pass'){ const k=L.rumble?0.6+0.4*Math.sin(t*30):0.6;
    for(let s=0;s<=len;s+=20){ const x=L.x0+ux*s, y=L.y0+uy*s, wv=Math.sin(t*14-s*0.08);
      ctx.strokeStyle=`rgba(255,236,190,${0.5*k})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-nx*hw*0.9+wv*2,y-ny*hw*0.9); ctx.quadraticCurveTo(x+wv*5,y+wv*3,x+nx*hw*0.9+wv*2,y+ny*hw*0.9); ctx.stroke(); }
    if(L.rumble&&Math.random()<0.5) emit(L.x0+ux*rand(0,len)+nx*rand(-hw,hw),L.y0+uy*rand(0,len)+ny*rand(-hw,hw),1,{col:'226,194,122',glow:false,ang:-Math.PI/2,spread:0.6,smin:30,smax:90,lmin:.2,lmax:.4,zmin:1.4,zmax:2.6});
    if(L.rumble){ const ex=L.dir>0?L.x1:L.x0, ey=L.dir>0?L.y1:L.y0, sx=L.dir>0?L.x0:L.x1, sy=L.dir>0?L.y0:L.y1; ctx.font=`900 ${20+4*Math.sin(t*10)|0}px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle=SBC?SBC.outline:'#000'; for(const [x,y] of [[sx,sy],[ex,ey]]){ ctx.strokeText('!',x,y-26); ctx.fillStyle='#ffcf5a'; ctx.fillText('!',x,y-26); } } }
  ctx.restore();
}
// the worm itself, arcing over the lane (sorted with the figures, so it passes over Ash's head)
function d3aDrawWorm(L,t){
  if(L.state!=='pass') return; const len=Math.hypot(L.x1-L.x0,L.y1-L.y0), ux=(L.x1-L.x0)/len, uy=(L.y1-L.y0)/len, sb=LOOK.sb;
  const bonk=L.bonk>=0, uu=bonk?L.bonk:L.u, back=bonk?clamp(1-(L.u-L.bonk)/0.3,0,1):1;
  const hs=(L.dir>0?uu:1-uu)*len, start=L.dir>0?-24:len+24, dirS=L.dir>0?1:-1;
  const segs=12, body=Math.min(len*0.55,200), lift=Math.min(110,len*0.3+40)*back;
  // (a lane running up the screen: the arc leans sideways and the worm swells toward you, so it still reads as a leap)
  const vert=Math.abs(uy)>Math.abs(ux), side=L.x0>(L.R.x0+L.R.x1)/2?-1:1;
  const pts=[]; for(let i=0;i<segs;i++){ const s=hs-dirS*body*(i/segs); if((s-start)*dirS<0) break; const fx=clamp((s-start)/(len+48)*dirS,0,1), h=Math.sin(fx*Math.PI)*lift;
    const gx=L.x0+ux*s, gy=L.y0+uy*s; pts.push(vert?{x:gx+side*h*0.45,y:gy-h*0.4,r:(22-i*1.1)*(1+(lift>0?h/lift:0)*0.35),gx,gy}:{x:gx,y:gy-h,r:22-i*1.1,gx,gy}); }
  if(!pts.length) return;
  ctx.save();
  for(const q of pts){ ctx.fillStyle='rgba(40,20,10,.22)'; ctx.beginPath(); ctx.ellipse(q.gx,q.gy,q.r*0.9,q.r*0.4,0,0,TAU); ctx.fill(); }
  for(let i=pts.length-1;i>=0;i--){ const q=pts[i];
    if(sb){ ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.arc(q.x,q.y,q.r+2.2,0,TAU); ctx.fill(); }
    ctx.fillStyle=i%2?'#c48a4c':'#d49a58'; ctx.beginPath(); ctx.arc(q.x,q.y,q.r,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(255,236,190,.55)'; ctx.beginPath(); ctx.ellipse(q.x-q.r*0.25,q.y-q.r*0.3,q.r*0.5,q.r*0.28,-0.4,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(110,60,30,.6)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(q.x,q.y,q.r*0.75,Math.PI*0.15,Math.PI*0.85); ctx.stroke(); }
  // the head: a round mouth full of glass teeth
  const H0=pts[0], a=Math.atan2(uy*dirS,ux*dirS);
  ctx.translate(H0.x,H0.y); ctx.rotate(a);
  ctx.fillStyle='#3a1a10'; ctx.beginPath(); ctx.ellipse(12,0,10,15,0,0,TAU); ctx.fill();
  ctx.fillStyle='#e8f6ff'; for(let n=0;n<8;n++){ const an=n/8*TAU; ctx.beginPath(); ctx.moveTo(12+Math.cos(an)*9,Math.sin(an)*13); ctx.lineTo(12+Math.cos(an)*4,Math.sin(an)*6); ctx.lineTo(12+Math.cos(an+0.3)*9,Math.sin(an+0.3)*13); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // sand bursting where it comes out and goes in
  if(Math.random()<0.5){ const ex=L.dir>0?L.x0:L.x1, ey=L.dir>0?L.y0:L.y1; emit(ex+rand(-10,10),ey+rand(-6,6),2,{col:'226,194,122',glow:false,ang:-Math.PI/2,spread:1,smin:60,smax:200,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:3}); }
}
// a stairwell inside a flooded room is under the water too (dive down it): the water drawn over the stairs
function d3aStairWet(A,o){ const c=A.cave, D=c.d3, X=A.d3a; if(!D||!X) return 0; const k=tCell(o.x,o.y); let n=0, f=0;
  for(const d of DIRS){ const q=k+d[0]+d[1]*c.w; if(q<0||q>=c.typ.length) continue; if(c.typ[q]===60){ n++; f=1; continue; } if(c.typ[q]!==250) continue; const zi=D.zi[q]; if(zi<0) continue; const s=D.sub[q]; if(s!==D3S.F&&s!==D3S.T&&s!==D3S.W) continue; n++; f=Math.max(f,X.show[D.zones[zi]]); }
  return n>=3?f:0; }
{ const base=FL.dstairs; FL.dstairs=(o,t)=>{ base(o,t); const A=AREA; if(!A||!A.d3a) return; const f=d3aStairWet(A,o); if(f<0.02) return;
    const x=o.x, y=o.y, cs=A.cave.cell, ph=t*1.6+x*0.01;
    ctx.fillStyle=`rgba(30,84,150,${0.2+0.5*f})`; ctx.fillRect(x-cs/2,y-cs/2,cs,cs);
    ctx.strokeStyle=`rgba(210,240,255,${0.22*f})`; ctx.lineWidth=1.6; for(let n=0;n<2;n++){ const yy=y-cs*0.2+n*cs*0.35; ctx.beginPath(); ctx.moveTo(x-cs/2+6,yy+Math.sin(ph+n)*3); ctx.quadraticCurveTo(x,yy-cs*0.1+Math.sin(ph+n+1)*3,x+cs/2-6,yy+Math.sin(ph+n+2)*3); ctx.stroke(); }
    if(Math.random()<0.05*f) emit(x+rand(-14,14),y+rand(-14,14),1,{col:'220,240,255',ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.5,lmax:1,zmin:1.2,zmax:2.4}); }; }
// objects
const D3A_DRAW={};
FL.d3a=(o,t)=>{ const f=D3A_DRAW[o.kind]; if(f) f(o,t); };
const d3aOL=()=>LOOK.sb?SBC.outline:'#1a1020';
D3A_DRAW.lock=(o,t)=>{
  const x=o.x, y=o.y, on=d3aZ(o.zone);
  drawSprite(sbSprite('d3a_lockbase',30,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-24+dx,22+dy); q.lineTo(-18+dx,4+dy); q.lineTo(18+dx,4+dy); q.lineTo(24+dx,22+dy); q.closePath(); },'#a8b2cc',{r:24}); celFill(g,(q,dx,dy)=>{ q.rect(-6+dx,-14+dy,12,20); },'#8a94b4',{r:10}); }),x,y,1,0);
  const wh=sbSprite('d3a_wheel',28,g=>{ g.lineCap='round'; for(let n=0;n<8;n++){ const a=n/8*TAU; g.strokeStyle='#5c6688'; g.lineWidth=5; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*22,Math.sin(a)*22); g.stroke(); }
    g.strokeStyle='#c8d2ea'; g.lineWidth=6; g.beginPath(); g.arc(0,0,22,0,TAU); g.stroke(); g.strokeStyle='#ffffff'; g.lineWidth=1.5; g.beginPath(); g.arc(-1,-1,22,Math.PI*1.1,Math.PI*1.7); g.stroke();
    for(let n=0;n<8;n++){ const a=n/8*TAU, px=Math.cos(a)*22, py=Math.sin(a)*22; g.fillStyle=n%2?'#f4f6ff':'#2a3050'; g.beginPath(); g.arc(px,py,4,0,TAU); g.fill(); }
    celBall(g,0,0,7,'#dfe6ff'); });
  const spin=o.spin>0?(1.4-o.spin)*4.5:0;
  drawSprite(wh,x,y-30,1,spin+(on?0:Math.PI/8));
  glowAt(x,y-30,40,on?'120,200,255':'255,240,200',0.25+0.1*Math.sin(t*2));
  ctx.font=`900 10px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle=d3aOL(); const lab=on?S('FLOODED','FLOODED'):S('DRAINED','DRAINED'); ctx.strokeText(simplify(lab),x,y+34); ctx.fillStyle=on?'#a8e0ff':'#fff0c8'; ctx.fillText(simplify(lab),x,y+34);
};
D3A_DRAW.valve=(o,t)=>{
  const x=o.x, y=o.y, on=d3aZ(o.zone);
  drawSprite(sbSprite('d3a_valvebase',18,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-10+dx,0+dy,20,14); },'#9aa4c0',{r:12}); }),x,y,1,0);
  const spin=o.spin>0?o.spin*6:0;
  ctx.save(); ctx.translate(x,y-14); ctx.rotate(spin);
  ctx.strokeStyle=d3aOL(); ctx.lineWidth=7; ctx.beginPath(); ctx.arc(0,0,14,0,TAU); ctx.stroke(); ctx.strokeStyle='#b8c2dc'; ctx.lineWidth=4; ctx.stroke();
  for(let n=0;n<4;n++){ const a=n/4*TAU; ctx.strokeStyle='#6a7494'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*13,Math.sin(a)*13); ctx.stroke(); }
  ctx.restore();
  // the moon face: FULL (drained) or NEW (flooded)
  ctx.fillStyle=d3aOL(); ctx.beginPath(); ctx.arc(x,y-14,8,0,TAU); ctx.fill();
  if(on){ ctx.fillStyle='#1c2440'; ctx.beginPath(); ctx.arc(x,y-14,6.5,0,TAU); ctx.fill(); ctx.strokeStyle='#8ab8ff'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(x,y-14,6,0,TAU); ctx.stroke(); }
  else { ctx.fillStyle='#fff6d8'; ctx.beginPath(); ctx.arc(x,y-14,6.5,0,TAU); ctx.fill(); glowAt(x,y-14,18,'255,246,210',0.45); }
  if(o.label){ ctx.font=`800 9px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle=d3aOL(); const s=simplify(o.label).toUpperCase(); ctx.strokeText(s,x,y+24); ctx.fillStyle='#e8eeff'; ctx.fillText(s,x,y+24); }
};
D3A_DRAW.statue=(o,t)=>{
  const x=o.x, y=o.y;
  drawSprite(sbSprite('d3a_priestess',60,g=>{
    celFill(g,(q,dx,dy)=>{ q.rect(-20+dx,36+dy,40,14); },'#9aa6c4',{r:20});
    celFill(g,(q,dx,dy)=>{ q.moveTo(-15+dx,38+dy); q.quadraticCurveTo(-12+dx,-6+dy,0+dx,-14+dy); q.quadraticCurveTo(12+dx,-6+dy,15+dx,38+dy); q.closePath(); },'#e6ebf6',{r:22});
    celBall(g,0,-20,8,'#eef2fa');
    celFill(g,(q,dx,dy)=>{ q.moveTo(-6+dx,-10+dy); q.lineTo(-3+dx,-46+dy); q.lineTo(3+dx,-46+dy); q.lineTo(6+dx,-10+dy); q.closePath(); },'#dfe5f2',{r:8});
    g.strokeStyle='rgba(90,100,140,.6)'; g.lineWidth=1.5; for(let n=0;n<3;n++){ g.beginPath(); g.moveTo(-8+n*8,0); g.lineTo(-10+n*10,34); g.stroke(); }
    g.fillStyle='#c8d0e6'; g.beginPath(); g.arc(0,-52,10,0,TAU); g.fill(); g.strokeStyle='#5a6488'; g.lineWidth=2.5; g.stroke(); }),x,y-30,1,0);
  const lit=o.lit||(AREA.rooms[o.room]&&AREA.rooms[o.room].solved), f=d3aZ(o.zone);
  ctx.fillStyle=lit?'#f2f8ff':f?'#9ad0ff':'#7a90c0'; ctx.beginPath(); ctx.arc(x,y-82,8,0,TAU); ctx.fill();
  glowAt(x,y-82,lit?70:30,lit?'230,240,255':'150,200,255',lit?0.7:0.25+0.12*Math.sin(t*3));
  if(lit){ ctx.save(); ctx.globalCompositeOperation='lighter'; const gr=ctx.createLinearGradient(x,y-82,x,y-400); gr.addColorStop(0,'rgba(220,236,255,.35)'); gr.addColorStop(1,'rgba(220,236,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(x-8,y-82); ctx.lineTo(x+8,y-82); ctx.lineTo(x+40,y-400); ctx.lineTo(x-40,y-400); ctx.closePath(); ctx.fill(); ctx.restore(); }
};
D3A_DRAW.mural=(o,t)=>{
  const x=o.x, y=o.y, A=AREA, R=A.rooms[o.room];
  if(o.what==='mosaic'){ const lit=R&&R.solved, k=lit?1:0.3;
    ctx.save(); ctx.globalAlpha=0.85; ctx.fillStyle='#2a3a68'; ctx.beginPath(); ctx.ellipse(x,y,64,40,0,0,TAU); ctx.fill(); ctx.strokeStyle='#c8d4f0'; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle=`rgba(60,130,190,${0.6+0.3*k})`; ctx.beginPath(); ctx.ellipse(x,y+14,56,18,0,0,Math.PI); ctx.fill();
    ctx.strokeStyle=`rgba(220,240,255,${0.3+0.5*k})`; ctx.lineWidth=2; for(let n=0;n<3;n++){ ctx.beginPath(); ctx.moveTo(x-46+n*8,y+16+n*6); ctx.quadraticCurveTo(x,y+10+n*6,x+46-n*8,y+16+n*6); ctx.stroke(); }
    ctx.fillStyle=`rgba(250,246,220,${0.4+0.6*k})`; ctx.beginPath(); ctx.arc(x,y-10,14,0,TAU); ctx.fill(); ctx.restore();
    if(lit) glowAt(x,y-6,90,'220,236,255',0.35+0.08*Math.sin(t*2));
    return; }
  drawSprite(sbSprite('d3a_moonmural',44,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-40+dx,-30+dy,80,46); },'#5a6488',{r:30}); g.fillStyle='#1c2440'; g.fillRect(-36,-26,72,38);
    for(let n=0;n<3;n++){ const cx=-22+n*22; if(n===1){ g.fillStyle='#0c1020'; g.beginPath(); g.arc(cx,-7,9,0,TAU); g.fill(); g.strokeStyle='#8ab8ff'; g.lineWidth=1.6; g.beginPath(); g.arc(cx,-7,9,0,TAU); g.stroke(); } else { g.fillStyle='#fff4d0'; g.beginPath(); g.arc(cx,-7,9,0,TAU); g.fill(); } } }),x,y-6,1,0);
  glowAt(x-22,y-13,20,'255,246,210',0.3); glowAt(x+22,y-13,20,'255,246,210',0.3);
};
D3A_DRAW.lever=(o,t)=>{
  const x=o.x, y=o.y;
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x+2,y+6,13,6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#4a3a2a'; ctx.fillRect(x-12,y-4,24,12); ctx.fillStyle='#8a6a44'; ctx.fillRect(x-12,y-6,24,4);
  ctx.save(); ctx.translate(x,y); ctx.rotate(o.on?0.8:-0.8); ctx.strokeStyle=d3aOL(); ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-26); ctx.stroke(); ctx.strokeStyle='#d8c08a'; ctx.lineWidth=4; ctx.stroke(); ctx.fillStyle=o.on?'#7ad870':'#e8402a'; ctx.beginPath(); ctx.arc(0,-27,6,0,TAU); ctx.fill(); ctx.restore();
  if(!o.on) glowAt(x,y-24,26,'255,214,110',0.25+0.12*Math.sin(t*4));
};
D3A_DRAW.vault=(o,t)=>{
  const x=o.x, y=o.y, open=!!G.flags.m_vault_open;
  drawSprite(sbSprite('d3a_vaultring',34,g=>{ celBall(g,0,0,30,'#7a84a8'); g.fillStyle='#1c2240'; g.beginPath(); g.arc(0,0,22,0,TAU); g.fill(); }),x,y-20,1,0);
  if(!open){ ctx.fillStyle='#c8cee4'; ctx.beginPath(); ctx.arc(x,y-20,21,0,TAU); ctx.fill(); ctx.fillStyle='#fff4d0'; ctx.beginPath(); ctx.arc(x,y-20,9,0,TAU); ctx.fill(); ctx.fillStyle='#c8cee4'; ctx.beginPath(); ctx.arc(x+4,y-23,8,0,TAU); ctx.fill();
    // the moon-wax: silver drips
    ctx.fillStyle='rgba(236,240,255,.92)'; for(let n=0;n<6;n++){ const a=Math.PI*0.15+n*0.14*Math.PI, px=x+Math.cos(a)*21, py=y-20+Math.sin(a)*21; ctx.beginPath(); ctx.ellipse(px,py+4,4,7,0,0,TAU); ctx.fill(); }
    glowAt(x,y-20,40,'220,230,255',0.25+0.1*Math.sin(t*2)+(o.heat>0?0.4*o.heat:0)); }
  else { ctx.fillStyle='#0a0e1c'; ctx.beginPath(); ctx.arc(x,y-20,21,0,TAU); ctx.fill(); ctx.fillStyle='#c8cee4'; ctx.beginPath(); ctx.ellipse(x+30,y-18,8,21,0,0,TAU); ctx.fill(); }
};
D3A_DRAW.window=(o,t)=>{
  const x=o.x, y=o.y-30;
  ctx.fillStyle=d3aOL(); ctx.beginPath(); ctx.arc(x,y,44,0,TAU); ctx.fill(); ctx.fillStyle='#8a94b8'; ctx.beginPath(); ctx.arc(x,y,40,0,TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x,y,33,0,TAU); ctx.clip();
  const gr=ctx.createLinearGradient(x,y-34,x,y+34); gr.addColorStop(0,'#1e4a7a'); gr.addColorStop(1,'#0a1a34'); ctx.fillStyle=gr; ctx.fillRect(x-34,y-34,68,68);
  // something with a lot of arms drifts past now and then
  const ph=(t*0.12)%1; if(ph<0.45){ const k=ph/0.45, ax=x-50+k*100; ctx.strokeStyle='rgba(70,30,90,.85)'; ctx.lineWidth=8; ctx.lineCap='round'; for(let n=0;n<3;n++){ ctx.beginPath(); ctx.moveTo(ax-n*10,y+40); ctx.quadraticCurveTo(ax-n*10+Math.sin(t*3+n)*14,y,ax-n*14+Math.sin(t*2+n)*10,y-30); ctx.stroke(); } }
  if(o.eye>0){ const k=Math.min(1,o.eye/1.2), bl=o.eye<0.6&&o.eye>0.4; ctx.fillStyle=`rgba(255,210,90,${k})`; ctx.beginPath(); ctx.ellipse(x,y,22,bl?2:18*k,0,0,TAU); ctx.fill(); ctx.fillStyle=`rgba(20,10,30,${k})`; ctx.beginPath(); ctx.ellipse(x+Math.sin(t)*4,y,5,bl?1:14*k,0,0,TAU); ctx.fill(); o.eye-=1/60; }
  ctx.restore();
  ctx.strokeStyle='rgba(230,240,255,.85)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-33,y); ctx.lineTo(x+33,y); ctx.moveTo(x,y-33); ctx.lineTo(x,y+33); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x-14,y-14,6,0,TAU); ctx.fill();
};
D3A_DRAW.bell=(o,t)=>{
  const x=o.x, y=o.y, sw=Math.sin(t*10)*o.sw*0.5;
  ctx.strokeStyle=d3aOL(); ctx.lineWidth=8; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x-24,y+8); ctx.quadraticCurveTo(x-26,y-70,x,y-76); ctx.quadraticCurveTo(x+26,y-70,x+24,y+8); ctx.stroke();
  ctx.strokeStyle='#f2e6cc'; ctx.lineWidth=5; ctx.stroke();
  ctx.save(); ctx.translate(x,y-70); ctx.rotate(sw);
  drawSprite(sbSprite('d3a_bell',26,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-16+dx,24+dy); q.quadraticCurveTo(-16+dx,0+dy,-9+dx,-4+dy); q.quadraticCurveTo(0+dx,-10+dy,9+dx,-4+dy); q.quadraticCurveTo(16+dx,0+dy,16+dx,24+dy); q.closePath(); },'#c8903a',{r:20}); g.fillStyle='#7a5020'; g.fillRect(-16,20,32,4); }),0,18,1,0);
  ctx.restore();
  if(!G.found.m_burrows_bell) glowAt(x,y-50,40,'255,214,140',0.2+0.12*Math.sin(t*3));
};
D3A_DRAW.padlock=(o,t)=>{ const A=AREA, R=A.rooms[o.room]; if(G.found[d3aKey(A.def,R,'padlock')]) return; const x=o.x, y=o.y-6;
  drawSprite(sbSprite('d3a_padlock',16,g=>{ g.strokeStyle='#8a7a5a'; g.lineWidth=4; g.beginPath(); g.arc(0,-6,7,Math.PI,0); g.stroke(); celFill(g,(q,dx,dy)=>{ q.rect(-10+dx,-6+dy,20,16); },'#e0b04a',{r:12}); g.fillStyle='#3a2810'; g.beginPath(); g.arc(0,1,3,0,TAU); g.fill(); g.fillRect(-1.2,1,2.4,5); }),x,y,1,0);
  glowAt(x,y,22,'255,214,110',0.2+0.1*Math.sin(t*3)); };
D3A_DRAW.heartwin=(o,t)=>{ const x=o.x, y=o.y; ctx.save(); ctx.translate(x,y); ctx.fillStyle=d3aOL(); heartPath(0,4,26); ctx.fill(); ctx.fillStyle='#163a6a'; heartPath(0,4,22); ctx.fill(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(120,190,255,${0.25+0.1*Math.sin(t*2)})`; heartPath(0,4,18); ctx.fill(); ctx.restore(); };
D3A_DRAW.tooth=(o,t)=>{ drawSprite(sbSprite('d3a_tooth',46,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-26+dx,36+dy); q.quadraticCurveTo(-24+dx,-10+dy,8+dx,-40+dy); q.quadraticCurveTo(-2+dx,0+dy,26+dx,36+dy); q.closePath(); },'#f4ecd6',{r:36}); g.strokeStyle='rgba(150,120,90,.5)'; g.lineWidth=2; for(let n=0;n<4;n++){ g.beginPath(); g.moveTo(-18+n*6,30-n*14); g.lineTo(10-n*3,30-n*14); g.stroke(); } }),o.x,o.y-20,1,0); };
D3A_DRAW.cactus=(o,t)=>{ const sh=o.ring>0?Math.sin(t*40)*o.ring*2:0;
  drawSprite(sbSprite('d3a_cactus'+o.v,24,g=>{ const rng=mulberry32(o.v*31+5); for(let n=0;n<3+o.v;n++){ const a=-Math.PI/2+(n-1.5)*0.45, l=14+rng()*10; g.save(); g.rotate(a+Math.PI/2); celFill(g,(q,dx,dy)=>{ q.moveTo(-4+dx,4+dy); q.lineTo(0+dx,-l+dy); q.lineTo(4+dx,4+dy); q.closePath(); },'#a8e8f0',{r:8}); g.restore(); } celBall(g,0,4,6,'#7ac8d8'); }),o.x+sh,o.y-10,1,0);
  if(o.ring>0) glowAt(o.x,o.y-14,30,'200,240,255',o.ring*0.6); };
D3A_DRAW.egg=(o,t)=>{ drawSprite(sbSprite('d3a_egg'+o.v,16,g=>{ celFill(g,(q,dx,dy)=>{ q.ellipse(0+dx,0+dy,10,13,0,0,TAU); },['#f2dca8','#e8c890','#f6e6c0'][o.v],{r:12}); g.fillStyle='rgba(160,110,60,.4)'; g.beginPath(); g.arc(-3,-4,2,0,TAU); g.arc(3,3,1.6,0,TAU); g.fill(); }),o.x,o.y-8,1,0); };
// Drowned Lumen's moon lamps: silver cages that glow blue-white when lit (any fire lights them)
{ const base=drawFurnX; drawFurnX=function(o,t){ if(o&&o.k==='brazier'&&o.d3lamp){ d3aDrawMoonLamp(o,t); return true; } return base.apply(this,arguments); }; }
function d3aDrawMoonLamp(o,t){
  const x=o.x, y=o.y;
  drawSprite(sbSprite('d3a_moonlamp',30,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-3+dx,-26+dy,6,40); },'#9aa4c4',{r:10}); celFill(g,(q,dx,dy)=>{ q.ellipse(0+dx,14+dy,12,5,0,0,TAU); },'#8a94b4',{r:12});
    g.strokeStyle='#c8d2ec'; g.lineWidth=3; g.beginPath(); g.arc(0,-34,11,Math.PI*0.6,Math.PI*2.4); g.stroke(); }),x,y-10,1,0);
  if(o.lit){ ctx.fillStyle='#f4f8ff'; ctx.beginPath(); ctx.arc(x,y-44,7,0,TAU); ctx.fill(); glowAt(x,y-44,60,'190,220,255',0.6+0.1*Math.sin(t*3)); }
  else { ctx.fillStyle='#3a4466'; ctx.beginPath(); ctx.arc(x,y-44,6,0,TAU); ctx.fill(); }
}
// things in the y-sorted list: the worms (over the lane, so over Ash), Duchess in her attic
{ const base=eventsForRender; eventsForRender=function(list){ base(list); const A=AREA, X=A&&A.d3a; if(!X) return; const t=G.time;
    for(const L of X.lanes) if(L.state==='pass'&&L.head>=0&&inView((L.x0+L.x1)/2,(L.y0+L.y1)/2,Math.hypot(L.x1-L.x0,L.y1-L.y0)/2+200)) list.push({x:(L.x0+L.x1)/2,y:Math.max(L.y0,L.y1)+60,draw:()=>d3aDrawWorm(L,t)});
    const d=X.duch; if(d&&inView(d.x,d.y,80)) list.push({x:d.x,y:d.y,draw:()=>{ glowAt(d.x,d.y-10,50,'200,236,255',0.2); try{ if(T3.on&&T3B.goat) T3B.goat(d); else drawGoat(d); }catch(e){} }}); }; }
// under the water: the lens, the vault and the shapes of the water you can swim through, drawn bright
if(typeof p4DrawUnderwater==='function'){ const base=p4DrawUnderwater; p4DrawUnderwater=function(t){ base(t); const A=AREA; if(!A||!A.d3a) return; try{ d3aUnder(A,t); }catch(e){ console.error(e); } }; }
function d3aUnder(A,t){
  const c=A.cave, cs=c.cell, p=player;
  // a soft light on the water near Ash, a dark veil on the walls: the way through reads at a glance
  const i0=Math.max(0,Math.floor((p.x-A.x0)/cs)-9), i1=Math.min(c.w-1,Math.floor((p.x-A.x0)/cs)+9), j0=Math.max(0,Math.floor((p.y-A.y0)/cs)-7), j1=Math.min(c.h-1,Math.floor((p.y-A.y0)/cs)+7);
  ctx.save();
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i, x=A.x0+i*cs, y=A.y0+j*cs, d=Math.hypot(x+cs/2-p.x,y+cs/2-p.y), a=clamp(1-d/420,0,1); if(a<=0) continue;
    if(c.grid[k]===1&&c.typ[k]!==61){ ctx.fillStyle=`rgba(4,16,36,${0.35*a})`; ctx.fillRect(x,y,cs,cs); continue; }
    if(p4CaveDeep(k)){ ctx.fillStyle=`rgba(150,215,255,${0.08*a})`; ctx.fillRect(x,y,cs,cs); if(!p4CanSurface(x+cs/2,y+cs/2)){ ctx.fillStyle=`rgba(10,30,70,${0.12*a})`; ctx.fillRect(x,y,cs,4); } } }
  ctx.restore();
  const X=A.d3a, S0=X.statue; if(S0&&inView(S0.x,S0.y,140)){ glowAt(S0.x,S0.y-82,44,'190,230,255',0.5); ctx.fillStyle='#cfe8ff'; ctx.beginPath(); ctx.arc(S0.x,S0.y-82,8,0,TAU); ctx.fill(); }
  const V=X.vault; if(V&&inView(V.x,V.y,100)){ D3A_DRAW.vault(V,t); }
  for(const o of A.objs) if(o.k==='d3a'&&(o.kind==='lock'||o.kind==='valve')&&inView(o.x,o.y,80)) glowAt(o.x,o.y-20,36,'200,236,255',0.25);
}
// the minimap knows the tide (water shows blue only while flooded)
{ const base=renderCaveMini; renderCaveMini=function(A){ base.apply(this,arguments); try{ const c=A.cave, mm=A.mini; if(!mm||!c||!c.d3) return; const mg=mm.getContext('2d'), im=mg.getImageData(0,0,c.w,c.h); let ch=false;
    for(let k=0;k<c.typ.length;k++){ const t=c.typ[k]; if(!d3aMine(t)) continue; const a=k*4; if(im.data[a]===10&&im.data[a+1]===8) continue; const dim=im.data[a]+im.data[a+1]+im.data[a+2]<150?0.55:1;
      let v=null; if(t===250){ const s=c.d3.sub[k], z=c.d3.zi[k]>=0?d3aZ(c.d3.zones[c.d3.zi[k]]):0; v=z&&s!==D3S.B?[50,100,160]:(!z&&(s===D3S.B||s===D3S.C||s===D3S.T))?[20,18,26]:null; } else if(t===251) v=[210,170,100]; else if(t===252||(t===253&&c.grid[k])) v=[160,210,225];
      if(v){ im.data[a]=v[0]*dim; im.data[a+1]=v[1]*dim; im.data[a+2]=v[2]*dim; ch=true; } }
    if(ch) mg.putImageData(im,0,0); }catch(e){} }; }

// ---------- 11. the two dungeons
// Drowned Lumen (bible 7.1): F3 the Spire Top, F2 the Upper City, F1 the Seafloor Streets, B1 the Drowned Library
const D3A_LT={
  a:['##...........##','#..##.....##..#','#.wwwww.......#','#.wwwww...#...#','#.wwwww.......#','#.............#','#.##.......##.#','#.............#','#...s.........#','##...........##','###.........###'],
  b:['##...........##','#.Z....Z....Z.#','#..............','#.ww...ᛗ...ww..','#.ww.......ww..','#.ww.......ww..','#..............','#......X.......','#.............#','##...........##','###.........###'],
  c:['##...........##','#.............#','#...ᛜ.........#','#.......ᚠᚠᚠᚠᚠ.#','........ᚠᚠᚠᚠᚠ.#','........ᚠᚠ>ᚠᚠ.#','........ᚠᚠᚠᚠᚠ.#','#.......ᚠᚠᚠᚠᚠ.#','#.............#','##...s.......##','###.........###'],
  d:['#===ᚹᚹᚹᚹᚹᚹᚹᚹᚹ##','#=@=ᚹ#ᚹᚹᚹ#ᚹᚹᚹ##','#=X=ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ#','#...ᚹᚹᚹᚹᚹ...ᚹᚹ#','....ᚹᚹ#ᚹᚹ...ᚹ..','....ᚹᚹᚹᚹᚹ.<....','....ᚹᚹ#ᚹᚹ......','#.ww.ᚹᚹᚹᚹᚹᚹᚹᚹᚹ#','#.w●.ᚹ#ᚹᚹᚹ#ᚹᚹᚹ#','#.ww.ᚹᚹᚹᚹᚹᚹᚹᚹᚹ#','##...ᚹ...ᚹᚹᚹ###'],
  e:['##ᚹᚹᚹᚹᚹᚹᚹ.....#','#ᚹᚹᚹwwwᚹᚹ.....#','#ᚹᚹwwwwwᚹ..D..#','#ᚹᚹww●wwᚹ.....#','..ᚹwwwwwᚹ......','..ᚹᚹwwwᚹᚹ.....#','..ᚹᚹᚹᚹᚹᚹᚹ.....#','#ᚹᚹᚹᚹᚹᚹᚹᚹ.....#','#ᚹᚹᚹᚹᚹᚹᚹᚹ.....#','##ᚹᚹᚹᚹᚹᚹ......#','###############'],
  f:['#####wwwww#####','####≈wwwww≈####','#######∩#######','##≈≈≈≈≈≈≈≈≈≈≈H#','##ᚸ##########≈#','##≈≈≈≈°≈≈≈≈≈≈##','############≈##','##≈≈≈≈≈≈°≈≈≈≈##','##≈############','##≈≈≈°≈≈≈≈≈≈≈H#','###########≈X≈#'],
  g:['#....ᚳᚳᚳᚳ.....#','#....ᚳXᚳᚳ..ᚹᚹ.#','#.ᛜs.ᚳᚳᚳᚳ..ᛝ..#','#....ᚳᚳᚳᚳ.....#','.....ᛒᛒᛒᛒ......','.....ᛒᛒᛒᛒ......','.....ᛒᛒᛒᛒ......','#ᚠᚠᚠ.ᚳᚳᚳᚳ..ᚹᚹ.#','#ᚠ>ᚠ.ᚳᚳᚳᚳ.....#','#ᚠᚠᚠ.ᚳᚳᚳᚳ.....#','##...ᚳᚳᚳᚳ....##'],
  h:['#ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ#','#ᚹ#ᚠ#ᚹᚹᚹᚹᚹ#ᚠ#ᚹ#','#ᚹᚹᚹᚹᚹwwwᚹᚹᚹᚹᚹ#','#ᚹᚹᚹᚹwwwwwᚹᚹᚹᚹ#','ᚹᚹᚹᚹᚹwwᛟwwᚹᚹᚹᚹ.','ᚹᚹᚹᚹᚹᚹwwwᚹᚹᚹᚹᚹ.','ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ.','#...ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ#','#.<.ᚹᚹᚹᚹᚹᚹᚼᚹᚹᚹ#','#.S.ᚹᚹᚹPᚹᚹᚹBᚹᚹ#','##ᚹᚹᚹᚹ...ᚹᚹᚹᚹ##'],
  i:['###############','#ᛏᛏᛏᛏᛏ°ᛏᛏᛏᛏᛏᛏ##','#ᛏ##########ᛏ##','#ᛏ#ᛏᛏᛏᛏᛏ°ᛏᛏᛏᛏ##','.ᛏ#ᛏ#########X.','.ᛏ#ᛏ#########..','.##ᛏ#########..','###ᛏᛏᛏᛏ°ᛏᛏᛏᛏ#ᛏ#','###########ᛏ#ᛏ#','###########ᛏᛏᛏ#','###############'],
  k:['######ᚹᚹᚹ######','#wwXᚠ#ᚹᚹᚹ#ᚠᛣww#','#ᚠᚠᚠᚠ∩ᚹᚹᚹ∩ᚠᚠww#','#ᚠᚠᚠᚠ#ᚹᚹᚹ#ᚠᚠᚠᚠ#','######ᚹᚹᚹ######','ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ','######ᚹᚹᚹ######','#ᚠᚠᚠᚠ#ᚹᚹᚹ#≈≈≈≈#','#wwdᚠ∩ᚹᚹᚹ≈≈>≈≈#','#ᚠᚠᚠᚠ#ᚹᚹᚹ#≈≈≈≈#','######ᚹᚹᚹ######'],
  l:['#ᛗ...........ww','#<.##.##.##.ᛞww','#..##.##.##.www','#..ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ..','#.ᚹ##ᚹ##ᚹ##ᚹᚹ..','#.ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ..','#.ᚹ##ᚹ##ᚹ##ᚹᚹ..','#X.ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ.#','##▒#.##.##.##.#','#ᛉ.#..........#','###############'],
  n:['####.....ᛃ.####','###ᚹᚹᚹᚹᚹᚹᚹᚹᚹ###','##ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ##','#ᚹᚹᚹᚹ.....ᚹᚹᚹᚹ#','ᚹᚹᚹᚹ.......ᚹᚹᚹᚹ','ᚹᚹᚹ.........ᚹᚹᚹ','ᚹᚹᚹᚹ.......ᚹᚹᚹᚹ','#ᚹᚹᚹᚹ.....ᚹᚹᚹᚹ#','##ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ##','###ᚹᚹᚹᚹᚹᚹᚹᚹᚹ###','####.......####'],
  m:['##...........##','#.ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ.#','#.ᚹ...ᚹᚹᚹ...ᚹ.#','#.ᚹ.ᛝ.ᚹ.ᚹ.ᛝ.ᚹ.#','..ᚹ...ᚹᛝᚹ...ᚹ.#','..ᚹᚹᚹᚹᚹ.ᚹᚹᚹᚹᚹ.#','..ᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹᚹ.#','#.wwwwwwwwwww.#','#.............#','##..s........##','###############'],
  z:['###.........###','##...........##','#.............#','#......u......#','...............','...............','...............','#......X......#','#..W..........#','##...........##','###.........###']
};
// the Lantern Eel's Hall (x3_foes' template) with a spot for the Guardian Key chest
const D3A_LJ=M3_TPL.eelhall.map((r,j)=>j===9?r.slice(0,12)+'X'+r.slice(13):r);
defineDungeon('m_lumen',{name:S('Drowned Lumen','Drowned Lumen'),level:18,theme:'m_lumen',seed:4101,save:'m_lumen',dark:0.3,
  abil:'dive',abilName:S('Dive','Dive'),dunKind:S('A drowned city','A drowned city'),p4:true,
  story:(()=>{ const s=typeof m3sDunStory==='function'?m3sDunStory('m_lumen'):{}; return s; })(),
  floors:[
    {id:'f3',name:S('The Spire Top','The Spire Top'),map:{rooms:{
      a:{at:[0,1],kind:'start',tpl:D3A_LT.a,foes:[['m_moonjelly',2]],noPots:true,sign:S('LUMEN, CITY OF THE MOON. Mind the tide.','LUMEN, CITY OF THE MOON. Mind the tide.')},
      b:{at:[0,0],kind:'braziers',tpl:D3A_LT.b,foes:[['m_crabpirate',2],['m_moonjelly',2]],lockFight:true,loot:['treasure'],mural:'mosaic',noPots:true,sealText:S('The chest is held shut by silver light. Light the three moon lamps.','Light the three moon lamps first.')},
      c:{at:[1,0],kind:'tide',tpl:D3A_LT.c,lock:'z1',zone:'z1',noPots:true,sign:S('TIDE LOCK ONE. Turn to flood or drain the Upper City below.','TIDE LOCK ONE. It floods or drains the city below.')}},
      links:[['a','b','open'],['b','c','open']]}},
    {id:'f2',name:S('The Upper City','The Upper City'),map:{rooms:{
      d:{at:[1,0],kind:'fight',tpl:D3A_LT.d,zone:'z1',foes:[['m_crabpirate',3]],lockFight:true,loot:['skey'],waterPools:true,pools:[{a:[3,8],b:{room:'e',at:[5,3]}}],noPots:true},
      e:{at:[2,0],kind:'shrine',tpl:D3A_LT.e,zone:'z1',waterPools:true,noPots:true},
      f:{at:[1,1],kind:'free',tpl:D3A_LT.f,loot:['treasure'],grate:{sw:[13,3]},swDo:{'13,9':'sluice'},noPots:true,noDecor:true},
      g:{at:[0,0],kind:'tide',tpl:D3A_LT.g,lock:'z2',zone:'z1',zones:{gch:[[5,0,8,10]],z2:[[1,7,3,9]]},valves:[{zone:'gch',need:'sluice'}],loot:['treasure'],noPots:true,sign:S('TIDE LOCK TWO: the Seafloor Streets, below.','TIDE LOCK TWO: the streets below.')}},
      links:[['d','e','lock'],['d','f','arch'],['d','g','open']]}},
    {id:'f1',name:S('The Seafloor Streets','The Seafloor Streets'),map:{rooms:{
      h:{at:[0,0],kind:'tide',tpl:D3A_LT.h,zone:'z2',foes:[['eel',2],['m_moonjelly',1]],noPots:true,noDecor:true},
      i:{at:[1,0],kind:'d3areach',tpl:D3A_LT.i,zone:'z2',goal:[13,4,14,6],bubbles:{on:1.5,off:1.5},push:[1,0,40],loot:['compass'],noPots:true,noDecor:true},
      j:{at:[2,0],kind:'miniboss',m3boss:'m_zapp',tpl:D3A_LJ,loot:['bkey'],sealChest:true,noPots:true,noDecor:true,sealText:S('The great chest is held shut while Lady Zapp is about.','Beat Lady Zapp first.')},
      k:{at:[0,1],kind:'free',tpl:D3A_LT.k,zone:'z2',loot:['dmap','treasure+treat'],noPots:true,noDecor:true}},
      links:[['h','i','gate:h'],['i','j','gate:i'],['h','k','plate',{room:'h'}]]}},
    {id:'b1',name:S('The Drowned Library','The Drowned Library'),map:{rooms:{
      l:{at:[0,2],kind:'free',tpl:D3A_LT.l,zone:'z3l',shelves:true,loot:['treasure'],foes:[['m_moonjelly',2]],noPots:true,noDecor:true},
      n:{at:[1,2],kind:'free',tpl:D3A_LT.n,zone:'z3n',tideDoors:true,noPots:true,noDecor:true},
      m:{at:[2,2],kind:'d3aengine',tpl:D3A_LT.m,zone:'z3m',foes:[['m_crabpirate',2],['m_moonjelly',2]],lockFight:true,
        valves:[{zone:'z3l',label:S('Library','Library')},{zone:'z3n',label:S('Window','Window')},{zone:'z3m',label:S('Engine','Engine')}],noPots:true,noDecor:true,
        sign:S('THE TIDE ENGINE. A FULL MOON on a wheel: that room is dry. A NEW MOON: that room is under the sea.','FULL MOON: dry. NEW MOON: under the sea.')},
      B:{at:[0,0],span:[2,2],kind:'boss',m3boss:'m_octavia',tpl:M3_TPL.cellar,noPots:true,noDecor:true},
      z:{at:[2,0],kind:'reward',tpl:D3A_LT.z,loot:['heart'],noPots:true}},
      links:[['l','n','open'],['n','m','open'],['n','B','boss',{at:1}],['B','z','gate:B',{at:0}]]}}
  ]});
// the Sandworm Burrows (bible 7.2): F1 the Mouth, B1 the Gullet, B2 the Coil
const D3A_BT={
  a:['##∴∴∴.....∴∴∴##','#∴∴∴.......∴∴∴#','#∴∴##.....##∴∴#','#∴............#','#∴∴............','#∴∴............','#∴∴............','#∴∴##.....##∴∴#','#∴∴∴..s....∴∴∴#','##∴∴.......∴∴##','###∴.......∴###'],
  e:['###############','##...........##','#....∴∴∴∴∴....#','#...∴∴∴∴∴∴∴...#','....∴∴ᛇ∴∴∴∴...#','....∴∴∴∴∴∴∴...#','....∴∴∴∴∴∴∴...#','#....∴∴∴∴∴....#','#.............#','##...........##','###############'],
  b:['#############∴∴','#{ᚱ{∴∴#.#∴∴∴∴∴∴','#{{{∴∴#.#∴∴∴∴∴∴','#∴∴∴∴∴∴.∴∴∴∴∴∴∴','...∴∴∴#.#∴∴∴∴..','...∴∴∴∴.∴∴∴∴∴..','...∴∴∴#.#∴∴ᛦ...','#..........ᚸᚸᚸ#','#.........#.>.#','#.........#...#','####......#####'],
  c:['=X=ᛋ==ᛋᛋᛋ==ᛋ==.','===ᛋ==ᛋᛋᛋ==ᛋ==.','...ᛋ..ᛋᛋᛋ..ᛋ...','...ᛋ..ᛋᛋᛋ..ᛋ...','...ᛋ..ᛋᛋᛋ..ᛋ...','...ᛋ..ᛋᛋᛋ..ᛋ...','...ᛋ..ᛋᛋᛋ..ᛋ...','...ᛋ..ᛋᛋᛋ..ᛋ...','...ᛋ..ᛋᛋᛋ.Bᛋ...','#..o..ooo..o..#','###o##ooo##o###'],
  d:['L....#....#...L','.###.#.##.#.##.','.#...#..#...#..','.#.###..#.###.#','...#...X...#...','..##..###..##..','...#.......#...','#.##.##.##.#.#.','..#...#..#...#.','.##.#.#.##.#.#.','L...#.....#...L'],
  f:['##.∴∴.......###','#..∴∴.......<.#','#..∴∴.........#','#..∴∴...∴∴∴...#','...∴∴...∴∴∴∴..#','...∴∴..∴∴∴∴∴..#','...∴∴...∴∴∴∴..#','#..∴∴....∴∴...#','#..∴∴.........#','#..∴∴.........#','##.∴∴........##'],
  g:['#####∴∴∴∴∴#####','##..∴∴∴∴∴∴∴..##','#.............#','#.............#','#......D.......','#..............','#..............','#.............#','#..s..........#','##...........##','###############'],
  h:['######∴∴∴∴∴∴∴##','######∴∴∴⊙⊙⊙∴∴#','######∴∴∴⊙.⊙∴∴#','######∴∴∴⊙⊙⊙∴∴#','######∴∴∴###∴∴.','######∴∴∴###∴∴.','######∴∴∴###...','##∴∴∴∴∴∴∴∴∴∴###','#∴∴∴∴∴∴∴∴∴∴∴∴##','#∴∴∴∴∴∴∴∴∴∴∴∴##','##∴∴∴∴∴∴∴∴∴∴###'],
  i:['#..P...P...P..#','#..∴...∴...∴..#','#..∴...⊙...∴..#','#..∴...⊙...∴..#','...∴...∴...⊙...','...∴...∴...⊙...','...∴...∴...∴...','#..∴...⊙...∴..#','#..∴...⊙...∴..#','#..∴...∴...∴..#','#..∴...∴...∴..#'],
  j:['⊚⊚⊚⊚⊚ᚷ∴∴∴∴ᚷ∴∴∴∴','⊚⊚⊚⊚⊚ᚷ∴ᛈ∴∴ᚷ∴∴∴∴','⊚⊚⊚⊚⊚ᚷ∴∴∴∴π∴∴∴∴','⊚⊚⊚⊚⊚ᚷ∴∴ᛈ∴ᚷ∴∴∴∴','..⊚⊚⊚ᚷ∴∴∴∴ᚷ∴∴∴∴','..⊚⊚⊚ᚷ∴ᛈ∴∴ᚷ{ᚱ{∴','..⊚⊚⊚ᚷ∴∴∴∴ᚷ{{{∴','⊚⊚⊚⊚⊚ᚷ∴∴∴ᛈᚷ∴∴∴∴','⊚⊚⊚∴∴π∴∴∴∴ᚷ∴∴X∴','⊚⊚⊚⊚⊚ᚷ∴∴∴∴ᚷ∴∴∴∴','⊚⊚⊚⊚⊚ᚷ...∴ᚷ∴∴∴∴'],
  n:['#####.....#####','####.......####','###...ooo...###','##...ooooo...##','....ooooooo....','....ooooooo....','....ooooooo....','##...ooooo...##','###...ooo...###','####........<##','#####.....#####'],
  m:['#⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚#','#⊚⊚⊚..⊚⊚⊚⊚⊚⊚⊚⊚#','#⊚⊚⊚..⊚⊚⊚⊚⊚⊚⊚⊚#','#⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚#','#..⊚⊚⊚⊚⊚..⊚⊚...','#ᛥ.⊚⊚⊚⊚⊚..⊚⊚...','#..⊚⊚⊚⊚⊚..⊚⊚...','#⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚#','#⊚⊚X⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚#','#⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚⊚#','###############'],
  o:['######∴∴∴######','#####ᚷᚾᚾᚾᚷ#####','#####ᚷᚾᚾᚾᚷ#####','#####ᚷᚴᚴᚴᚷ#####','.....∴ᚾᚾᚾ∴....#','......ᚾᚾᚾ.....#','.....∴ᚾᚾᚾ∴....#','#....∴ᚾᚾᚾ∴....#','#....∴ᚾᚾᚾ∴....#','#.....ᚾᚾᚾ.....#','######ᚾᚾᚾ######'],
  l:['###############','##∴∴∴∴∴∴∴∴∴∴∴##','#∴∴ᛄ∴∴∴∴∴∴∴ᛄ∴∴#','#∴∴∴∴∴∴∴∴∴∴∴∴∴#','#∴ᛄ∴∴∴∴∴∴∴∴∴ᛄ∴#','#∴∴∴∴∴∴∴∴∴∴∴∴∴#','#∴∴∴ᛄ∴∴∴∴∴ᛄ∴∴∴#','#∴∴∴∴∴∴∴∴∴∴∴∴∴#','#∴∴X∴∴∴∴∴∴∴∴∴∴#','##∴∴∴∴∴∴∴∴∴∴∴##','###∴∴∴∴∴∴∴∴∴###'],
  z:['###.........###','##...........##','#.............#','#......u......#','...............','...............','...............','#......X......#','#..W..........#','##...........##','###.........###']
};
// the Fin Pit (x3_foes' template) with the Guardian Key chest and the sandfall down (a sand plug until Big Fin falls)
const D3A_BK=M3_TPL.finpit.map((r,j)=>{ const a=r.split(''); if(j===8){ a[2]='X'; a[11]='ᚸ'; a[12]='>'; a[13]='ᚸ'; } if(j===7||j===9) a[12]='ᚸ'; return a.join(''); });
defineDungeon('m_burrows',{name:S('The Sandworm Burrows','The Sandworm Burrows'),level:19,theme:'m_burrows',seed:4102,save:'m_burrows',dark:0.4,
  abil:'burrow',abilName:S('Burrow','Burrow'),dunKind:S('Worm tunnels','Worm tunnels'),p4:true,
  story:(()=>{ const s=typeof m3sDunStory==='function'?m3sDunStory('m_burrows'):{}; return s; })(),
  floors:[
    {id:'f1',name:S('The Mouth','The Mouth'),map:{rooms:{
      a:{at:[1,1],kind:'start',tpl:D3A_BT.a,foes:[['m_glassscorp',1]],noPots:true,sign:S('THE BURROWS. Keep moving. Worms like things that keep still.','THE BURROWS. Keep moving!')},
      e:{at:[2,1],kind:'secret',tpl:D3A_BT.e,loot:['coins','treat'],noPots:true,sign:null},
      b:{at:[1,0],kind:'fight',tpl:D3A_BT.b,foes:[['m_glassscorp',2],['m_sandshark',2]],grate:{lever:true,padlock:true},leverDoes:'grate',noPots:true,noDecor:true},
      c:{at:[0,0],kind:'free',tpl:D3A_BT.c,loot:['skey'],dblOK:true,flowV:250,noPots:true,noDecor:true},
      d:{at:[2,0],kind:'dark',tpl:D3A_BT.d,foes:[['m_shade',3]],loot:['dmap'],noPots:true,noDecor:true}},
      links:[['a','b','open'],['a','e','crack'],['b','c','open'],['b','d','open']]}},
    {id:'b1',name:S('The Gullet','The Gullet'),map:{rooms:{
      f:{at:[1,1],kind:'free',tpl:D3A_BT.f,foes:[['m_sandshark',2]],lanes:[{a:[3,0],b:[3,10],w:2,per:6,ph:0}],noPots:true},
      g:{at:[0,1],kind:'shrine',tpl:D3A_BT.g,noPots:true},
      h:{at:[0,0],kind:'free',tpl:D3A_BT.h,foes:[['m_glassscorp',1]],lanes:[{a:[6,0],b:[6,6],w:3,per:2.6,ph:0}],noPots:true,noDecor:true},
      i:{at:[1,0],kind:'d3aplates',tpl:D3A_BT.i,plateAsh:true,plateHold:10,lanes:[{a:[3,0],b:[3,10],w:1,per:4.4,ph:0},{a:[7,0],b:[7,10],w:1,per:4.4,ph:2},{a:[11,0],b:[11,10],w:1,per:4.4,ph:4}],noPots:true,noDecor:true},
      j:{at:[2,0],kind:'d3alever',tpl:D3A_BT.j,foes:[['m_mirrorimp',2]],loot:['compass'],leverDoes:'solve',noPots:true,noDecor:true},
      k:{at:[2,1],kind:'miniboss',m3boss:'m_bigfin',tpl:D3A_BK,loot:['bkey'],sealChest:true,grate:{solved:true},noPots:true,noDecor:true,sealText:S('The great chest is buried under Big Fin\'s sand. Beat her first.','Beat Big Fin first.')}},
      links:[['f','g','open'],['g','h','sand'],['h','i','open'],['i','j','gate:i'],['j','k','gate:j']]}},
    {id:'b2',name:S('The Coil','The Coil'),map:{rooms:{
      n:{at:[1,2],kind:'free',tpl:D3A_BT.n,lanes:[{a:[0,3],b:[4,3],w:1,per:3,bellPer:12,ph:0},{a:[5,0],b:[5,2],w:1,per:3,bellPer:12,ph:1.5},{a:[10,3],b:[14,3],w:1,per:3,bellPer:12,ph:0.7},{a:[9,0],b:[9,2],w:1,per:3,bellPer:12,ph:2.2}],noPots:true,noDecor:true},
      m:{at:[0,2],kind:'free',tpl:D3A_BT.m,loot:['treasure'],lanes:[{a:[10,0],b:[10,9],w:2,per:4.6,ph:0},{a:[5,0],b:[5,9],w:2,per:4.6,ph:2.3}],noPots:true,noDecor:true},
      o:{at:[2,2],kind:'free',tpl:D3A_BT.o,flowV:260,noPots:true,noDecor:true},
      l:{at:[2,1],kind:'npc',tpl:D3A_BT.l,loot:['treasure'],noPots:true,noDecor:true},
      B:{at:[0,0],span:[2,2],kind:'boss',m3boss:'m_gravelgut',tpl:M3_TPL.gullet,noPots:true,noDecor:true},
      z:{at:[2,0],kind:'reward',tpl:D3A_BT.z,loot:['heart'],noPots:true}},
      links:[['n','m','open'],['n','o','open'],['o','l','sand'],['n','B','boss',{at:1}],['B','z','gate:B',{at:0}]]}}
  ]});
for(const [id,shorts] of [['m_lumen',['3F','2F','1F','B1']],['m_burrows',['1F','B1','B2']]]) DUNGEONS[id].floorIds.forEach((aid,i)=>{ if(AREADEFS[aid]) AREADEFS[aid].floorShort=shorts[i]; });
// this module builds Lumen's vault and Duchess's air pocket itself (x3_people stands its own down)
DUNGEONS.m_lumen.vault=true; DUNGEONS.m_lumen.duchess=true;
DUNGEONS.m_lumen.giftOK=Object.assign({},DUNGEONS.m_lumen.giftOK||{}); DUNGEONS.m_burrows.giftOK=Object.assign({},DUNGEONS.m_burrows.giftOK||{});

// a guardian's room is only won by beating the guardian (the Trial rule "a miniboss room with no foes left is solved"
// would otherwise solve it the moment Ash walks in, before x3_foes has the guardian out, and unseal the Boss Key)
{ const base=solveRoom; solveRoom=function(R,quiet){
    if(R&&R.m3boss&&!R.solved&&AREA&&d3aDun(AREA.def)&&!(G.bossDone&&G.bossDone[R.m3boss])&&!(R.enemies||[]).some(e=>e.type===R.m3boss&&e.dead)) return;
    return base.apply(this,arguments); }; }

// ---------- 12. the great door in the Moon Window: a water seal until the Tide Engine is set
{ const base=caveObjAct; caveObjAct=function(o){
    if(o&&o.k==='cgate'&&o.type==='boss'&&o.closed&&d3aIn('m_lumen')&&!G.found.m_lumen_seal){ d3aSay([S('A wall of silver water presses against the great door, thick as glass. It will not open while the tide holds it. The Tide Engine, perhaps.','A wall of water holds the door. Set the Tide Engine.')]); return true; }
    return base.apply(this,arguments); }; }
{ const base=caveGatePrompt; caveGatePrompt=function(o){ if(o&&o.type==='boss'&&o.closed&&d3aIn('m_lumen')&&!G.found.m_lumen_seal) return S('Look at the sealed door','Look at the door'); return base.apply(this,arguments); }; }
// the seal drawn over the door, shimmering
{ const base=drawFurnX; drawFurnX=function(o,t){ const r=base.apply(this,arguments); try{ if(o&&o.k==='cgate'&&o.type==='boss'&&o.closed&&d3aIn('m_lumen')&&!G.found.m_lumen_seal){ ctx.save(); ctx.globalCompositeOperation='lighter'; const w=o.vertical?150:52, h=o.vertical?52:150;
      ctx.fillStyle=`rgba(140,200,255,${0.22+0.08*Math.sin(t*3)})`; rrect(ctx,o.x-w/2,o.y-h/2-10,w,h,16); ctx.fill(); ctx.strokeStyle=`rgba(230,245,255,${0.5+0.2*Math.sin(t*4)})`; ctx.lineWidth=2.5; for(let n=0;n<3;n++){ ctx.beginPath(); ctx.moveTo(o.x-w/2+8,o.y-h/2+n*14+Math.sin(t*2+n)*3); ctx.quadraticCurveTo(o.x,o.y-h/2+n*14-6,o.x+w/2-8,o.y-h/2+n*14+Math.sin(t*2+n+1)*3); ctx.stroke(); } ctx.restore(); } }catch(e){} return r; }; }

// ---------- 13. leaving and starting over
{ const base=newRun; newRun=function(mode){ base(mode); D3A.gulp=null; D3A.tip={}; D3A.toH=0; }; }

// ---------- 14. debug hooks (window.__eb.d3a): the tests in scratchpad/e_d3a drive the real mechanics through these
window.__ebX=Object.assign(window.__ebX||{},{d3a:{
  D3A, D3T, D3S, D3A_ZDEF, D3A_CODE, D3A_LT, D3A_BT,
  zone:(z,v)=>v==null?d3aZ(z):d3aSetZone(z,v),
  state:()=>{ const A=AREA, X=A&&A.d3a; return {area:A&&A.id,zones:Object.fromEntries(Object.keys(D3A_ZDEF).map(z=>[z,d3aZ(z)])),seal:!!G.found.m_lumen_seal,sluice:!!G.found.m_lumen_sluice,bell:!!G.found.m_burrows_bell,
    eshut:!!G.found.m_lumen_eshut,dive1:!!G.found.m_lumen_dive1,vault:!!G.flags.m_vault_open,duchess:!!G.flags.m_duchess,
    lanes:X?X.lanes.map(L=>({room:L.R.id,state:L.state,per:d3aLanePer(L),u:+L.u.toFixed(2)})):[],plates:X?X.plate.size:0,keys:A&&A.keys?A.keys():0}; },
  objs:kind=>AREA&&AREA.objs.filter(o=>o.k==='d3a'&&(!kind||o.kind===kind)).map(o=>({id:o.id,kind:o.kind,room:o.room,x:o.x,y:o.y,zone:o.zone,on:o.on})),
  act:id=>{ const o=AREA&&AREA.objs.find(q=>q.id===id); if(o&&o.act){ o.act(o); return true; } return false; },
  hit:(id,src)=>{ const o=AREA&&AREA.objs.find(q=>q.id===id); if(!o) return false; return d3aHitAt(o.x,o.y,20,src||'slash'); },
  lens:()=>{ const S0=AREA&&AREA.d3a&&AREA.d3a.statue; return S0?d3aLensHit(S0,'test'):false; },
  gulp:()=>D3A.gulp,
  noGift:v=>{ D3A.noGift=!!v; },
  // put Ash under water ('dive'), under the sand ('burrow') or back on top (null), with a full breath or meter
  // dive or burrow the way the player does (the plunge or the dig plays)
  dive:()=>{ if(canDive()&&!P4.mode&&!P4.mv) p4DiveBegin(player); return P4.mode; },
  burrow:()=>{ if(canBurrow()&&!P4.mode&&!P4.mv&&p4CaveSand(tCell(player.x,player.y))) p4DigStart(player); return P4.mode||(P4.mv&&P4.mv.kind); },
  mode:m=>{ if(m==='dive'){ P4.mode='dive'; P4.air=p4AirMax(); } else if(m==='burrow'){ P4.mode='burrow'; P4.bm=p4BurMax(); } else P4.mode=null; return P4.mode; },
  sim:sec=>window.__eb.dunSim(sec),
  // straight in through the dungeon's own door spot (tests: the world door also checks the story stage)
  enter:id=>{ const d=DOORS.find(q=>q.area===id); if(AREA) exitArea(true); enterArea(id,d?{x:d.x,y:d.y,label:d.label}:{x:player.x,y:player.y}); return AREA?AREA.def.id:null; },
  cellOf:(room,c,r)=>{ const A=AREA, R=A&&A.rooms[room]; if(!R) return null; const cs=A.cave.cell; return {x:A.x0+(R.ox+1+c+0.5)*cs,y:A.y0+(R.oy+1+r+0.5)*cs,k:(R.oy+1+r)*A.cave.w+R.ox+1+c}; },
  dbg:{d3aZ,d3aSetZone,d3aFull,d3aSub,d3aZoneOf,d3aTideGround,d3aTideWet,d3aTideHole,d3aGridSync,d3aGrateOpen,d3aDammed,d3aLanePer,d3aCrackBreak,d3aEngineCheck,d3aCellOK,d3aLensHit,d3aVaultOpen,
    tGround,tWet,tHole,tCell,tPos,dunH,caveRoomAt,caveSid,caveDsid,solveRoom,refreshCaveGates,killEnemy,trialSwitchOn,trialObjAct,areaObjHit,breakCrack,dChestSealed,caveObjAct,
    p4CaveDeep,p4CanSurface,p4CaveSand,canDive,canBurrow,hasAbil,dunNearGround,dunGoFloor,
    grid:()=>AREA.cave.grid,typ:()=>AREA.cave.typ,d3:()=>AREA.cave.d3}
}});
