// ================= (v12 wave 11) ART23: the Realistic look for Acts II and III outdoors, cliffs and bridges on every
// map, and the prop kinds of maps 1 and 2 that were only relit. Only LOOK.re reaches anything here (Storybook and
// Classic never do): the older files call in through small `if(LOOK.re)` hooks. Everything static is painted once
// into cached canvases (keyed by LOOK.gen) or into the ground chunks, lit from the fixed art light of e12c_props.js
// (upper left, soft, slightly warm); LIGHT (e12_light.js) adds the sun, the shadows and the night on top.

// ---------- 0. painting prop kinds without a hitch
// A Realistic map kind (e12c_props.js rzKindSprites) used to paint all its variants the first time a prop of it was
// drawn (20 to 75 ms here). Now the first variant is painted then and the rest in idle time (props pick up their own
// variant when the kind completes), and the props planner (a2c_build.js) asks for a kind as soon as it builds a chunk
// that holds one, about a screen ahead of Ash, so it is usually painted before it shows.
{ const base=rzKindBuild; rzKindBuild=function(kind,d){
  if(!LOOK.re) return base(kind,d);
  const K=RZK[kind], n=K&&K.make?Math.max(d.n,K.n||0):d.n; if(n<2) return base(kind,d);
  const c0=rzKindOne(kind,d,0); if(!c0) return base(kind,d);
  const all=[c0], gen=LOOK.gen;
  for(let v=1;v<n;v++) RZQ.q.unshift(()=>{ if(gen!==LOOK.gen) return; const c=rzKindOne(kind,d,v); if(c) all.push(c); if(v===n-1){ SPR[kind]=all.slice(); rzRepick(kind); } });
  RZQ.gen=LOOK.gen; rzPumpLater();
  return [c0];
}; }
propsSoon=function(k){
  if(!LOOK.re||RE0.soon.has(k)) return; RE0.soon.add(k);
  RZQ.q.unshift(()=>{ RE0.soon.delete(k); const d=Object.getOwnPropertyDescriptor(SPR,k); if(d&&d.get) void SPR[k]; });
  RZQ.gen=LOOK.gen; rzPumpLater();
};
const RE0={soon:new Set()};
