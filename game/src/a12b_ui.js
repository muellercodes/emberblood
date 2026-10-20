
// ================= (v12 wave 7, UI) items: the contract with e11_items.js, item icons drawn in code, the Satchel bag
// ---------- the item rules live in e11_items.js (ITEMS). ITM calls them when they exist; until then small stand-ins keep
// the bag, the quick slot and the boosts working (each one steps aside on its own once the real function is there).
const ITM={
  real:()=>typeof itemInfo==='function',
  def:id=>{ const D=typeof ITEMDEF!=='undefined'&&ITEMDEF?ITEMDEF:ITM_STUB; return D[id]||null; },
  info:id=>typeof itemInfo==='function'?itemInfo(id):itStubInfo(id),
  can:id=>typeof canUseItem==='function'?canUseItem(id):itStubCan(id),
  use:id=>typeof useItem==='function'?useItem(id):itStubUse(id),
  quick:()=>typeof quickItem==='function'?quickItem():(G&&G.flags&&G.flags.qslot)||null,
  setQuick:id=>{ if(typeof setQuick==='function') return setQuick(id); if(G) G.flags.qslot=id||null; },
  buffs:()=>{ try{ return (typeof itemBuffs==='function'?itemBuffs():itStubBuffs())||[]; }catch(e){ return []; } },
  count:id=>(G&&G.items&&G.items[id])||0
};
// stand-ins (only used while e11_items.js is missing): the eight new things to use, and a rough group for the rest
const ITM_STUB={
  lantern_bun:{name:'Lantern Bun',kind:'use',desc:'Heals a quarter of your health over 3 seconds.',cap:3,icon:'bun',heal:0.25},
  ember_pepper:{name:'Ember Pepper',kind:'use',desc:'Fire meter full, and fire breath is free for 10 seconds.',cap:2,icon:'pepper',buff:10},
  pebble_feather:{name:'Pebble’s Feather',kind:'use',desc:'Pebble the crow leads you back out to the door.',cap:1,icon:'crowfeather'},
  salt_taffy:{name:'Salt Taffy',kind:'use',desc:'Your stamina stays full for 15 seconds.',cap:2,icon:'taffy',buff:15},
  thunder_drop:{name:'Thunder Drop',kind:'use',desc:'A rumbling candy. Your Roar meter fills up.',cap:2,icon:'thunder'},
  hearth_stone:{name:'Hearth Stone',kind:'use',desc:'Hits hurt a quarter less for 30 seconds.',cap:2,icon:'hearth',buff:30},
  snowball:{name:'Snowgob Snowball',kind:'use',desc:'A frost burst. Foes close by freeze for a moment.',cap:3,icon:'snowball'},
  fish_pudding:{name:'Gilly’s Fish Pudding',kind:'use',desc:'Heals a little, and your hits do more for 30 seconds.',cap:2,icon:'pudding',heal:0.15,buff:30},
  c_biscuit:{kind:'auto',desc:'Eaten by itself when your health gets very low.'},
  f_cocoa:{kind:'auto',desc:'Drunk by itself when your health gets low. It works in boss fights too.'},
  m_airjar:{kind:'auto',desc:'Gives you air by itself under water.'}
};
const ITM_ST={buffs:[],boss:null,used:0};
function itStubKind(id){
  const d=ITM_STUB[id]; if(d&&d.kind) return d.kind;
  if(/^(lantern|rod|magnifier|juniper_map|map_x\d|f_northmaps|n_map)$/.test(id)) return 'tool';
  if(/pearl|lucky|medal|skipstone|locket|plume|eggshell|musicbox/.test(id)) return 'keep';
  return 'quest';
}
function itStubInfo(id){
  const d=ITM_STUB[id]||{}, kind=itStubKind(id), n=ITM.count(id);
  return {id,name:d.name||ITEM_NAMES[id]||id,kind,desc:d.desc||'',count:n,cap:d.cap||0,usable:kind==='use'&&n>0&&itStubCan(id)===true,icon:d.icon||null};
}
function itStubCan(id){
  const d=ITM_STUB[id];
  if(!d||d.kind!=='use') return S('You cannot use this one','Not for using');
  if(!G||G.mode!=='story') return 'Not in the Arena';
  if(!(ITM.count(id)>0)) return 'None left';
  if(d.heal&&!d.buff&&player&&player.hp>=player.maxHp) return 'Your health is full';
  const b=G.boss&&!G.boss.dead?G.boss:null;
  if(b&&ITM_ST.boss===b&&ITM_ST.used>=(G.diff&&G.diff.heal>1?2:1)) return 'One item per boss fight';
  if(id==='pebble_feather'&&(b||!AREA)) return b?'Not in a boss fight':'Only inside a cave, a dungeon or a house';
  return true;
}
function itStubUse(id){
  if(itStubCan(id)!==true) return false;
  const d=ITM_STUB[id]; G.items[id]--;
  const b=G.boss&&!G.boss.dead?G.boss:null; if(b){ if(ITM_ST.boss!==b){ ITM_ST.boss=b; ITM_ST.used=0; } ITM_ST.used++; }
  if(d.heal&&player) player.hp=Math.min(player.maxHp,player.hp+player.maxHp*d.heal);
  if(d.buff){ ITM_ST.buffs=ITM_ST.buffs.filter(q=>q.id!==id); ITM_ST.buffs.push({id,icon:d.icon,end:G.time+d.buff,total:d.buff,g:G}); }
  try{ SFX.play('drink'); }catch(e){}
  return true;
}
function itStubBuffs(){ const t=G?G.time:0; ITM_ST.buffs=ITM_ST.buffs.filter(q=>q.g===G&&q.end>t); return ITM_ST.buffs.map(q=>({id:q.id,icon:q.icon,left:q.end-t,total:q.total})); }

// ---------- item icons. drawItemIcon(g,id,x,y,size) draws the icon of item id (an item id, an ITEMDEF icon name, or a
// hat key as 'hat:<key>') centred on x,y, size px across in g's units. Every icon is drawn once per look and size into a
// small canvas and reused, so it is cheap every frame. Storybook: flat cel colours, a soft shadow side and the plum
// outline; Classic: soft shaded colours and a thin dark edge. Unknown ids get a neat parcel.
var ICOC=new Map();
function drawItemIcon(g,id,x,y,size){
  if(!g||!(size>0)) return;
  let k=1; try{ const m=g.getTransform(); k=Math.hypot(m.a,m.b)||1; }catch(e){}
  const px=size*k, B=px<=18?24:px<=28?32:px<=40?48:px<=56?64:px<=84?96:128, art=icoArtOf(id), sb=!!(typeof LOOK!=='undefined'&&LOOK.sb);
  const key=art+'|'+(sb?1:0)+'|'+B; let c=ICOC.get(key);
  if(!c){ if(ICOC.size>500) ICOC.clear(); c=mkCanvas(B,B); const q=c.getContext('2d'); q.scale(B/48,B/48); q.translate(24,24); icoDraw(q,art,sb); ICOC.set(key,c); }
  g.drawImage(c,x-size/2,y-size/2,size,size);
}
function icoDraw(g,art,sb){
  const [a,v]=art.split('.'), f=ICO_ART[a]||ICO_ART.parcel;
  try{ f(icoPen(g,sb),v||''); }catch(e){ console.error(e); }
}
// paths (no beginPath, so several can make one shape)
function icoRp(g,x,y,w,h,r){ r=Math.min(r,w/2,h/2); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function icoEl(g,x,y,rx,ry,a){ a=a||0; g.moveTo(x+rx*Math.cos(a),y+rx*Math.sin(a)); g.ellipse(x,y,rx,ry,a,0,TAU); }
function icoPoly(g,p){ g.moveTo(p[0],p[1]); for(let i=2;i<p.length;i+=2) g.lineTo(p[i],p[i+1]); g.closePath(); }
function icoFlame(g,x,y,s){ g.moveTo(x,y-s*1.7); g.bezierCurveTo(x+s*0.4,y-s*0.8,x+s*1.1,y-s*0.3,x+s*0.9,y+s*0.5); g.bezierCurveTo(x+s*0.7,y+s*1.15,x-s*0.7,y+s*1.15,x-s*0.9,y+s*0.5); g.bezierCurveTo(x-s*1.1,y-s*0.2,x-s*0.3,y-s*0.7,x,y-s*1.7); g.closePath(); }
function icoStar(g,x,y,r,n){ n=n||5; for(let i=0;i<n*2;i++){ const a=-Math.PI/2+i*Math.PI/n, q=i%2?r*0.45:r; if(i) g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q); else g.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q); } g.closePath(); }
// a crescent: the circle r1 at 0,0 with the circle r2 at dx,dy taken out of it
function icoCrescent(g,r1,dx,dy,r2){
  const d=Math.hypot(dx,dy), a=(r1*r1-r2*r2+d*d)/(2*d), h=Math.sqrt(Math.max(0,r1*r1-a*a)), px=a*dx/d, py=a*dy/d;
  const x1=px-h*dy/d, y1=py+h*dx/d, x2=px+h*dy/d, y2=py-h*dx/d, far=Math.atan2(-dy,-dx), nm=t=>((t%TAU)+TAU)%TAU;
  const A1=Math.atan2(y1,x1), A2=Math.atan2(y2,x2), B1=Math.atan2(y1-dy,x1-dx), B2=Math.atan2(y2-dy,x2-dx);
  g.moveTo(x1,y1); g.arc(0,0,r1,A1,A2,!(nm(far-A1)<nm(A2-A1))); g.arc(dx,dy,r2,B2,B1,!(nm(far-B2)<nm(B1-B2))); g.closePath();
}
function icoHeart(g,x,y,s){ g.moveTo(x,y+s*0.9); g.bezierCurveTo(x-s*1.4,y-s*0.1,x-s*0.7,y-s*1.2,x,y-s*0.45); g.bezierCurveTo(x+s*0.7,y-s*1.2,x+s*1.4,y-s*0.1,x,y+s*0.9); g.closePath(); }
const icoTone=(c,k)=>typeof sbTone==='function'?sbTone(c,k):c;
function icoPen(g,sb){
  const ol=sb?(typeof SBC!=='undefined'?SBC.outline:'#3b2233'):'rgba(30,15,8,.85)', ow=sb?2.6:1.5;
  const P={g,sb,ol,ow,
    // a solid shape: cel shading with a shadow edge (Storybook) or a soft gradient (Classic), then its outline
    sh(col,path,o){ o=o||{}; const rule=o.eo?'evenodd':'nonzero';
      g.save(); g.beginPath(); path(g);
      if(sb){ g.fillStyle=icoTone(col,-(o.lo||0.3)); g.fill(rule); g.clip(rule); const d=o.d==null?2.2:o.d; g.translate(-d,-d*1.1); g.beginPath(); path(g); g.fillStyle=col; g.fill(rule); }
      else { const gr=g.createLinearGradient(-12,-18,12,18); gr.addColorStop(0,icoTone(col,0.24)); gr.addColorStop(1,icoTone(col,-0.3)); g.fillStyle=gr; g.fill(rule); }
      g.restore();
      if(o.nol) return; g.beginPath(); path(g); g.lineJoin='round'; g.lineCap='round';
      if(!sb){ g.lineWidth=(o.w||ow)+1.8; g.strokeStyle='rgba(255,236,210,.26)'; g.stroke(); }
      g.lineWidth=o.w||ow; g.strokeStyle=ol; g.stroke(); },
    fl(col,path,o){ g.beginPath(); path(g); g.fillStyle=col; g.fill(o&&o.eo?'evenodd':'nonzero'); },
    st(col,w,path){ g.beginPath(); path(g); g.lineJoin='round'; g.lineCap='round'; g.lineWidth=w; g.strokeStyle=col; g.stroke(); },
    // a thick line with an outline round it (straps, handles, stems)
    band(col,w,path){ P.st(ol,w+ow*2,path); P.st(col,w,path); if(sb) P.st(icoTone(col,0.35),Math.max(0.8,w*0.28),path); },
    hi(x,y,rx,ry,a){ g.beginPath(); icoEl(g,x,y,rx,ry,a||0); g.fillStyle=sb?'rgba(255,250,232,.85)':'rgba(255,255,255,.5)'; g.fill(); },
    glow(x,y,r,rgb,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${rgb},${a})`); gr.addColorStop(1,`rgba(${rgb},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); },
    spark(x,y,r,col){ g.beginPath(); g.moveTo(x,y-r); g.quadraticCurveTo(x,y,x+r,y); g.quadraticCurveTo(x,y,x,y+r); g.quadraticCurveTo(x,y,x-r,y); g.quadraticCurveTo(x,y,x,y-r); g.closePath(); g.fillStyle=col; g.fill(); },
    dot(x,y,r,col){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fillStyle=col; g.fill(); },
    clip(path,fn){ g.save(); g.beginPath(); path(g); g.clip(); fn(); g.restore(); },
    at(x,y,a,s,fn){ g.save(); g.translate(x,y); if(a) g.rotate(a); if(s) g.scale(s,s); fn(); g.restore(); }
  };
  return P;
}
const ICO_ART={
  // ----- the eight things to use
  bun(P){ P.g.translate(0,1.5); P.glow(0,3,23,'255,196,90',.55);
    P.sh('#eba64a',g=>icoEl(g,0,3,17,14));
    P.st('#b8692c',1.8,g=>{ g.moveTo(0,-10.5); g.lineTo(0,16.5); g.moveTo(-8.5,-9); g.quadraticCurveTo(-14,3,-8.5,15); g.moveTo(8.5,-9); g.quadraticCurveTo(14,3,8.5,15); });
    P.sh('#d8452c',g=>icoRp(g,-7.5,-15,15,5.5,2.2)); P.sh('#d8452c',g=>icoRp(g,-6.5,15,13,5,2.2));
    P.band('#8a5a3a',1.4,g=>{ g.moveTo(0,-15); g.lineTo(0,-19); });
    P.hi(-9,-2,3.6,2.2,-0.6); P.hi(-1,-4,1.6,1.1); },
  pepper(P,v){ const c=v==='sea'?'#36a596':'#e3352a'; P.g.translate(0,2);
    P.sh(c,g=>{ g.moveTo(-9,-10); g.bezierCurveTo(4,-14,17,-4,15,8); g.bezierCurveTo(14,15,9,19,3,21); g.bezierCurveTo(7,12,5,3,-4,0); g.bezierCurveTo(-10,-2,-13,-7,-9,-10); g.closePath(); });
    P.sh('#5aa83e',g=>{ g.moveTo(-14,-11); g.quadraticCurveTo(-9,-17,-3,-12); g.quadraticCurveTo(-6,-6,-12,-6); g.closePath(); });
    P.band('#4a8a30',2,g=>{ g.moveTo(-9,-13); g.quadraticCurveTo(-10,-19,-5,-21); });
    P.hi(3,-7,5,1.8,0.35);
    if(v!=='sea'){ P.glow(14,-12,10,'255,150,40',.5); P.sh('#ffa22a',g=>icoFlame(g,14,-11,4.6),{d:1.2,w:P.ow*0.8}); P.fl('#fff0a0',g=>icoFlame(g,14,-9.5,2.2)); } },
  crowfeather(P){ const g=P.g;
    P.at(-1,1,-0.72,0,()=>{
      P.sh('#2f3552',g=>{ g.moveTo(0,-21); g.bezierCurveTo(9,-13,10,5,1.5,16); g.lineTo(-1.5,16); g.bezierCurveTo(-10,5,-9,-13,0,-21); g.closePath(); });
      P.st('rgba(150,170,220,.55)',1.2,g=>{ for(const y of [-10,-3,4]){ g.moveTo(0.5,y); g.lineTo(6.5,y-5); g.moveTo(-0.5,y+2); g.lineTo(-6.5,y-3); } });
      P.band('#a8b4d8',1.3,g=>{ g.moveTo(0,-17); g.lineTo(0,23); });
      P.st(P.ol,1.6,g=>{ g.moveTo(8.6,-3); g.lineTo(5,-1.5); g.moveTo(-8.2,6); g.lineTo(-4.5,7); });
      P.hi(-3.5,-9,1.6,5,0); });
    P.spark(13,-14,5,'#cfe6ff'); P.spark(-14,13,3,'#cfe6ff'); },
  taffy(P){ const body=g=>icoRp(g,-10,-7.5,20,15,6.5);
    P.sh('#86d0ee',g=>icoPoly(g,[-9,-4,-20,-12,-17,0,-20,12,-9,4])); P.sh('#86d0ee',g=>icoPoly(g,[9,-4,20,-12,17,0,20,12,9,4]));
    P.sh('#ff8fb4',body);
    P.clip(body,()=>P.st('#fff3f7',2.6,g=>{ for(const x of [-14,-6,2,10]){ g.moveTo(x,9); g.lineTo(x+9,-9); } }));
    P.g.beginPath(); body(P.g); P.g.lineWidth=P.ow; P.g.strokeStyle=P.ol; P.g.stroke();
    P.hi(-4,-4,4,1.6); },
  thunder(P){ P.glow(0,0,23,'160,130,255',.45);
    P.sh('#7a58da',g=>icoEl(g,0,1,14.5,14.5));
    P.sh('#ffd84a',g=>icoPoly(g,[3,-11,-6,2.5,-0.5,2.5,-3.5,12,7,-2.5,1.5,-2.5,4.5,-11]),{d:1,w:P.ow*0.85});
    P.hi(-6,-6,3.4,2,-0.7);
    P.st('#ffe066',1.8,g=>{ g.moveTo(-17,-12); g.lineTo(-20.5,-15); g.moveTo(17,-10); g.lineTo(21,-12.5); g.moveTo(16,13); g.lineTo(19.5,16); }); },
  hearth(P){ const stone=g=>{ g.moveTo(-15,-2); g.bezierCurveTo(-15,-12,-4,-15,4,-13); g.bezierCurveTo(13,-11,17,-3,16,5); g.bezierCurveTo(15,13,6,16,-2,15); g.bezierCurveTo(-11,14,-16,9,-15,-2); g.closePath(); };
    P.glow(0,1,24,'255,140,50',.5);
    P.sh('#958879',stone);
    P.st('#ff9a3a',2.4,g=>{ g.moveTo(-2,6); g.lineTo(-9,9); g.lineTo(-12,5); g.moveTo(3,4); g.lineTo(9,7); g.lineTo(13,2); g.moveTo(1,-6); g.lineTo(3,-11); });
    P.st('#ffe08a',1,g=>{ g.moveTo(-2,6); g.lineTo(-9,9); g.moveTo(3,4); g.lineTo(9,7); });
    P.sh('#ff8a2a',g=>icoFlame(g,0,2,5.6),{d:1.2,w:P.ow*0.8}); P.fl('#ffe08a',g=>icoFlame(g,0,4,2.6));
    P.hi(-7,-8,3.6,1.8,-0.4); },
  snowball(P){ P.glow(0,0,23,'170,220,255',.4);
    P.sh('#f3f8ff',g=>{ icoEl(g,0,1,15,14.5); },{lo:0.22});
    P.fl(P.sb?'rgba(150,190,235,.55)':'rgba(140,180,225,.5)',g=>{ icoEl(g,-5,7,2.2,1.6); icoEl(g,6,3,1.8,1.3); icoEl(g,3,10,1.4,1.1); icoEl(g,-8,-1,1.3,1); });
    P.hi(-6,-6,4,2.4,-0.6);
    P.spark(13,-13,4.6,'#9fdcff'); P.spark(-15,12,3.4,'#9fdcff'); P.spark(16,9,2.6,'#ffffff'); },
  pudding(P){ const bowl=g=>{ g.moveTo(-18,4); g.lineTo(18,4); g.quadraticCurveTo(16,18,0,18); g.quadraticCurveTo(-16,18,-18,4); g.closePath(); };
    P.sh('#46c0ae',g=>icoPoly(g,[3,-6,8,-17,10.5,-12.5,15,-15,12,-5]),{d:1.2});
    P.sh('#f4955e',g=>{ g.moveTo(-13,5); g.bezierCurveTo(-13,-11,13,-11,13,5); g.closePath(); });
    P.fl('#fff2d6',g=>{ g.moveTo(-11,-3); g.bezierCurveTo(-7,-9,7,-9,11,-3); g.quadraticCurveTo(8,1,6,-2); g.quadraticCurveTo(3,3,0,-2); g.quadraticCurveTo(-4,2,-6,-2); g.quadraticCurveTo(-9,1,-11,-3); g.closePath(); });
    P.sh('#4f86cc',bowl); P.st('rgba(255,255,255,.6)',1.3,g=>{ g.moveTo(-12,9); g.quadraticCurveTo(-6,13,0,13); });
    P.hi(-6,-4,2.6,1.4,-0.5); },
  // ----- works by itself
  biscuit(P,v){ if(v==='lumpy'){ P.sh('#c98a48',g=>{ g.moveTo(-15,5); g.bezierCurveTo(-17,-6,-8,-14,-1,-11); g.bezierCurveTo(5,-16,15,-9,14,-1); g.bezierCurveTo(18,7,9,15,0,13); g.bezierCurveTo(-8,16,-15,12,-15,5); g.closePath(); }); P.st('#8a5428',1.6,g=>{ g.moveTo(-6,-3); g.quadraticCurveTo(-2,-6,2,-3); g.moveTo(3,4); g.quadraticCurveTo(7,2,9,5); }); P.hi(-7,-6,3,1.6,-0.5); return; }
    P.sh('#dcac62',g=>icoEl(g,0,1,15,14));
    P.fl('#a8743a',g=>{ for(const [x,y] of [[-6,-5],[0,-7],[6,-5],[-8,2],[0,1],[8,2],[-4,8],[4,8]]) icoEl(g,x,y,1.3,1.3); });
    if(v==='moth') P.fl('#7a5a8a',g=>{ icoEl(g,-4,1,4,3,-0.5); icoEl(g,4,1,4,3,0.5); icoEl(g,0,1,1.4,4.5); });
    P.hi(-7,-7,3.4,1.8,-0.6); },
  mug(P){ P.st('rgba(255,255,255,.7)',1.6,g=>{ g.moveTo(-6,-13); g.bezierCurveTo(-9,-16,-3,-18,-6,-22); g.moveTo(1,-13); g.bezierCurveTo(-2,-16,4,-18,1,-22); });
    P.band('#c8543a',3.2,g=>{ g.moveTo(8,-4); g.bezierCurveTo(17,-5,17,8,8,8); });
    P.sh('#d8603e',g=>icoRp(g,-13,-9,21,24,5));
    P.fl('#6a3a1e',g=>icoEl(g,-2.5,-6.5,8.4,2.6)); P.fl('#fff6ea',g=>icoRp(g,-6,-9.5,5.5,4.5,1.5));
    P.fl('#ffe0c8',g=>icoHeart(g,-2.5,5,3.6)); P.hi(-9,0,1.6,4.5,0); },
  jar(P,v){ const glass=g=>icoRp(g,-11,-9,22,25,7);
    P.fl(v==='worms'?'rgba(150,110,80,.55)':'rgba(175,225,255,.5)',glass);
    if(v==='worms') P.st('#e88aa0',2,g=>{ g.moveTo(-6,10); g.bezierCurveTo(-3,4,0,12,4,6); g.moveTo(-4,0); g.bezierCurveTo(0,-4,2,3,6,-1); });
    else P.st('#ffffff',1.3,g=>{ for(const [x,y,r] of [[-3,8,3.4],[4,1,2.6],[-4,-2,2],[5,10,1.6],[1,-6,1.4]]) { g.moveTo(x+r,y); g.arc(x,y,r,0,TAU); } });
    P.g.beginPath(); glass(P.g); P.g.lineWidth=P.ow; P.g.strokeStyle=P.ol; P.g.stroke();
    P.hi(-7,2,1.4,5,0);
    P.sh('#b47e4c',g=>icoRp(g,-8.5,-16,17,7.5,2.5)); },
  // ----- tools
  lantern(P){ P.glow(0,3,24,'255,200,90',.55);
    P.st(P.ol,P.ow+1.6,g=>{ g.moveTo(-7,-12); g.quadraticCurveTo(0,-23,7,-12); }); P.st('#8a8a96',1.6,g=>{ g.moveTo(-7,-12); g.quadraticCurveTo(0,-23,7,-12); });
    P.sh('#ffd27a',g=>icoRp(g,-9,-8,18,20,3),{lo:0.15});
    P.fl('#fff4c8',g=>icoFlame(g,0,3,3.4));
    P.st('#4a4a54',1.8,g=>{ g.moveTo(-3,-8); g.lineTo(-3,12); g.moveTo(3,-8); g.lineTo(3,12); });
    P.sh('#55555f',g=>icoRp(g,-11,-13,22,6,2)); P.sh('#55555f',g=>icoRp(g,-12,11,24,6,2)); },
  paperlantern(P){ P.glow(0,1,24,'255,150,80',.55);
    P.sh('#e2462c',g=>icoEl(g,0,1,15,13));
    P.st('#a32c1a',1.5,g=>{ for(const k of [-0.6,0,0.6]){ g.moveTo(k*13,-11); g.quadraticCurveTo(k*19,1,k*13,13); } g.moveTo(-15,1); g.lineTo(15,1); });
    P.fl('rgba(255,230,140,.55)',g=>icoEl(g,0,2,6,6));
    P.sh('#3e2c24',g=>icoRp(g,-6,-15,12,4.5,1.5)); P.sh('#3e2c24',g=>icoRp(g,-6,13,12,4.5,1.5));
    P.band('#e0b84a',1.2,g=>{ g.moveTo(0,17); g.lineTo(0,22); }); P.hi(-8,-5,2.4,3.6,0.4); },
  rod(P){ P.band('#9b6a3a',3,g=>{ g.moveTo(-16,19); g.lineTo(15,-18); }); P.band('#5a3a22',4,g=>{ g.moveTo(-16,19); g.lineTo(-9,11); });
    P.st(P.sb?'#3b2233':'rgba(40,30,30,.8)',1,g=>{ g.moveTo(15,-18); g.quadraticCurveTo(19,-4,12,8); });
    P.sh('#ffffff',g=>icoEl(g,12,11,4,4)); P.fl('#e0402a',g=>{ g.moveTo(8,11); g.arc(12,11,4,Math.PI,TAU); g.closePath(); });
    P.g.beginPath(); icoEl(P.g,12,11,4,4); P.g.lineWidth=P.ow*0.8; P.g.strokeStyle=P.ol; P.g.stroke(); },
  map(P,v){ const col=v==='star'?'#2e3e72':'#f0dca8';
    P.sh(col,g=>icoPoly(g,[-18,-11,-6,-14,6,-11,18,-14,18,12,6,15,-6,12,-18,15]));
    P.st(v==='star'?'rgba(255,255,255,.2)':'rgba(140,100,50,.35)',1.4,g=>{ g.moveTo(-6,-14); g.lineTo(-6,12); g.moveTo(6,-11); g.lineTo(6,15); });
    if(v==='star'){ for(const [x,y,r] of [[-12,-5,2.4],[-2,3,1.8],[9,-4,2.2],[12,8,1.6],[-10,8,1.4],[2,-8,1.4]]) P.spark(x,y,r*1.4,'#ffe27a'); P.st('rgba(255,226,122,.5)',0.9,g=>{ g.moveTo(-12,-5); g.lineTo(-2,3); g.lineTo(9,-4); g.lineTo(12,8); }); return; }
    if(v==='peak'||v==='north'){ P.st('#7a5a3a',1.6,g=>{ g.moveTo(-15,8); g.lineTo(-7,-5); g.lineTo(-2,2); g.lineTo(4,-9); g.lineTo(14,8); }); P.st('#ffffff',1.6,g=>{ g.moveTo(1.6,-5); g.lineTo(4,-9); g.lineTo(6.6,-5); }); P.fl('#d83a2a',g=>icoStar(g,4,-11,3)); if(v==='north') P.fl('#3a6ad8',g=>icoPoly(g,[-12,-10,-10,-4,-14,-4])); return; }
    P.st('#b46a2a',1.6,g=>{ g.setLineDash([2.2,2.6]); g.moveTo(-13,8); g.quadraticCurveTo(-4,-6,4,4); g.quadraticCurveTo(8,8,9,-3); }); P.g.setLineDash([]);
    P.st('#d8382a',2.6,g=>{ g.moveTo(6,-8); g.lineTo(12,-2); g.moveTo(12,-8); g.lineTo(6,-2); }); },
  magnifier(P){ P.band('#6a3c22',4,g=>{ g.moveTo(5,5); g.lineTo(15,15); });
    P.sh('#c99a3a',g=>{ icoEl(g,-4,-4,12,12); icoEl(g,-4,-4,8.5,8.5); },{eo:true,d:1.4});
    P.fl('rgba(190,230,255,.55)',g=>icoEl(g,-4,-4,8.5,8.5)); P.hi(-8,-8,2.4,1.4,-0.7); },
  // ----- for quests
  letter(P,v){ const col=v==='fancy'?'#fff6e8':v==='old'?'#e8d8b0':'#f6ecd6';
    if(v==='bundle') P.sh('#e8dcc0',g=>icoRp(g,-14,-15,30,20,2.5));
    P.sh(col,g=>icoRp(g,-17,-10,34,23,3));
    P.st(P.sb?'rgba(59,34,51,.45)':'rgba(120,90,60,.55)',1.4,g=>{ g.moveTo(-16,-9); g.lineTo(0,3); g.lineTo(16,-9); g.moveTo(-16,12); g.lineTo(-5,-1); g.moveTo(16,12); g.lineTo(5,-1); });
    if(v==='snow'){ P.fl('#5aa8e8',g=>icoRp(g,8,-8,7,8,1)); P.st('#ffffff',1,g=>{ g.moveTo(11.5,-6.5); g.lineTo(11.5,-1.5); g.moveTo(9.5,-4); g.lineTo(13.5,-4); }); }
    if(v==='bundle') P.st('#c8402a',1.8,g=>{ g.moveTo(-4,-15); g.lineTo(-4,13); });
    P.sh(v==='fancy'?'#e0b040':v==='moth'?'#8a5ab8':'#c8302a',g=>icoEl(g,0,3,4.6,4.6),{d:1}); },
  page(P,v){ P.at(0,0,-0.12,0,()=>{
      const sheet=v==='torn'?g=>icoPoly(g,[-12,-16,12,-16,12,10,8,13,4,10,0,15,-4,11,-8,14,-12,11]):g=>icoRp(g,-12,-16,24,32,2);
      P.sh(v==='mask'?'#e8e0f0':'#f6ecd6',sheet,{lo:0.18});
      if(v==='music'){ P.st('rgba(120,90,60,.5)',1,g=>{ for(const y of [-9,-5,-1]){ g.moveTo(-9,y); g.lineTo(9,y); } for(const y of [5,9]){ g.moveTo(-9,y); g.lineTo(9,y); } });
        P.fl('#3b2a22',g=>{ icoEl(g,-4,-1,2.4,1.8,-0.4); icoEl(g,4,-3,2.4,1.8,-0.4); icoEl(g,-1,9,2.4,1.8,-0.4); });
        P.st('#3b2a22',1.2,g=>{ g.moveTo(-1.8,-1.5); g.lineTo(-1.8,-10); g.lineTo(6.2,-12); g.lineTo(6.2,-3.5); g.moveTo(1.2,8.5); g.lineTo(1.2,2); }); }
      else P.st('rgba(120,90,60,.5)',1.3,g=>{ for(const y of [-10,-5,0,5]){ g.moveTo(-8,y); g.lineTo(8,y); } g.moveTo(-8,10); g.lineTo(2,10); });
      if(v==='log') P.fl('#4a7ac8',g=>icoRp(g,-12,-16,24,4,1));
      if(v==='mask') P.fl('#5a3a7a',g=>{ icoEl(g,-4,-8,3.4,2); icoEl(g,4,-8,3.4,2); }); }); },
  scroll(P,v){ P.sh(v==='plans'?'#cfe0f0':'#f0dca8',g=>icoRp(g,-13,-10,26,20,1));
    P.st(v==='plans'?'rgba(40,80,150,.6)':'rgba(120,90,60,.55)',1.3,g=>{ if(v==='plans'){ g.rect(-8,-5,7,7); g.moveTo(1,-5); g.lineTo(8,-5); g.moveTo(1,0); g.lineTo(8,0); g.moveTo(-8,6); g.lineTo(8,6); } else for(const y of [-5,0,5]){ g.moveTo(-8,y); g.lineTo(8,y); } });
    P.sh('#e2c48a',g=>icoRp(g,-17,-12,6,24,3)); P.sh('#e2c48a',g=>icoRp(g,11,-12,6,24,3));
    if(v==='music') P.fl('#3b2a22',g=>{ icoEl(g,-2,4,2.2,1.6,-0.4); g.rect(-0.5,-5,1.2,9); });
    P.st('#c8402a',2,g=>{ g.moveTo(-14,-12); g.lineTo(-14,12); }); },
  book(P,v){ const col={moth:'#6a4a9a',dream:'#c84a6a',ice:'#4a8ac8',soggy:'#6a8a6a'}[v]||'#8a4a2a';
    P.sh('#f6ecd6',g=>icoRp(g,-11,-14,25,30,2),{lo:0.15});
    P.sh(col,g=>icoRp(g,-14,-16,24,30,3));
    P.fl(icoTone(col,-0.3),g=>icoRp(g,-14,-16,5,30,2));
    if(v==='moth') P.fl('#e8d8ff',g=>{ icoEl(g,-1,-2,4.5,3.2,-0.5); icoEl(g,5,-2,4.5,3.2,0.5); icoEl(g,2,-1,1.2,4.5); });
    else if(v==='ice') { P.st('#e8f6ff',1.4,g=>{ for(let i=0;i<3;i++){ const a=i*Math.PI/3; g.moveTo(2-Math.cos(a)*6,-1-Math.sin(a)*6); g.lineTo(2+Math.cos(a)*6,-1+Math.sin(a)*6); } }); }
    else if(v==='dream') P.fl('#ffe08a',g=>icoStar(g,2,-1,5.5));
    else P.fl('#e0b84a',g=>icoRp(g,-3,-8,10,4,1));
    if(v==='soggy') P.fl('rgba(150,200,230,.6)',g=>{ icoEl(g,8,10,2,2.6); icoEl(g,-4,12,1.6,2); });
    P.hi(-6,-11,3,1.2); },
  key(P,v){ const gold=v==='city'?'#e8b840':'#d8a63a';
    P.at(0,0,-Math.PI/4,0,()=>{ P.sh(gold,g=>{ icoRp(g,-3,-4,26,8,2); },{d:1.2}); P.sh(gold,g=>{ icoRp(g,14,2,4,8,1); icoRp(g,8,2,4,6,1); },{d:1});
      P.sh(gold,g=>{ icoEl(g,-11,0,9,9); icoEl(g,-11,0,4.4,4.4); },{eo:true});
      if(v==='city') P.fl('#c8302a',g=>icoEl(g,-11,0,2.2,2.2)); }); },
  badge(P,v){
    if(v==='medal'){ P.sh('#3a6ad8',g=>icoPoly(g,[-9,-20,-2,-20,3,-4,-4,-4])); P.sh('#d83a3a',g=>icoPoly(g,[9,-20,2,-20,-3,-4,4,-4])); P.sh('#e8b84a',g=>icoEl(g,0,6,11,11)); P.fl('#fff0b0',g=>icoStar(g,0,6,6)); P.hi(-5,1,2.4,1.4,-0.6); return; }
    if(v==='press'){ P.sh('#f8f4ea',g=>icoRp(g,-16,-11,32,22,3),{lo:0.15}); P.fl('#c8402a',g=>icoRp(g,-16,-11,32,6,2)); P.fl('#8a7a6a',g=>{ icoRp(g,-12,-1,9,9,1); }); P.st('rgba(80,60,50,.6)',1.4,g=>{ g.moveTo(0,0); g.lineTo(12,0); g.moveTo(0,4); g.lineTo(12,4); g.moveTo(0,8); g.lineTo(8,8); }); return; }
    if(v==='clock'){ P.sh('#c8a050',g=>icoEl(g,0,0,14,14)); P.sh('#f6ecd6',g=>icoEl(g,0,0,9,9),{d:1}); P.st('#3b2a22',1.6,g=>{ g.moveTo(0,0); g.lineTo(0,-6); g.moveTo(0,0); g.lineTo(4,2); }); return; }
    P.sh('#c99a4a',g=>{ g.moveTo(0,-17); g.lineTo(14,-11); g.quadraticCurveTo(14,8,0,17); g.quadraticCurveTo(-14,8,-14,-11); g.closePath(); });
    P.st('#7a5422',1.6,g=>{ g.moveTo(0,-8); g.lineTo(0,9); g.moveTo(-8,-5); g.lineTo(8,-5); g.moveTo(-8,-5); g.lineTo(-10,2); g.lineTo(-6,2); g.closePath(); g.moveTo(8,-5); g.lineTo(10,2); g.lineTo(6,2); g.closePath(); g.moveTo(-4,9); g.lineTo(4,9); });
    P.hi(-6,-9,2.4,1.4,-0.4); },
  shard(P,v){ const col={dusk:'#9a62e0',frost:'#7cd2f2',moon:'#d6dcec'}[v]||'#ff8a4a', rgb={dusk:'170,110,255',frost:'130,220,255',moon:'220,230,255'}[v]||'255,150,80';
    P.glow(0,0,24,rgb,.5);
    P.sh(col,g=>icoPoly(g,[1,-20,10,-6,6,15,-3,20,-10,4,-6,-10]));
    P.st(icoTone(col,0.45),1.3,g=>{ g.moveTo(1,-20); g.lineTo(-1,0); g.lineTo(6,15); g.moveTo(-1,0); g.lineTo(-10,4); g.moveTo(-1,0); g.lineTo(10,-6); });
    P.spark(12,-14,4,'#ffffff'); },
  heart(P,v){ P.glow(0,2,24,'255,120,60',.55);
    P.sh('#e8432a',g=>icoHeart(g,0,1,15));
    P.fl('rgba(255,190,90,.75)',g=>icoHeart(g,-2,-1,6));
    if(v==='mended') P.st('#ffd84a',1.8,g=>{ g.moveTo(-9,-8); g.lineTo(-4,-2); g.lineTo(-7,4); g.lineTo(-2,10); g.moveTo(9,-8); g.lineTo(5,-1); g.lineTo(8,5); g.moveTo(0,-6); g.lineTo(2,2); });
    P.hi(-7,-5,3,2,-0.6); },
  ore(P,v){ const col=v==='frost'?'#9ec8e4':'#5e5968';
    P.sh(col,g=>icoPoly(g,[-16,4,-11,-9,-2,-14,9,-11,16,-2,13,10,2,15,-10,13]));
    P.st(icoTone(col,-0.35),1.3,g=>{ g.moveTo(-11,-9); g.lineTo(-3,0); g.lineTo(9,-11); g.moveTo(-3,0); g.lineTo(2,15); });
    for(const [x,y,r] of v==='frost'?[[-6,-3,4],[7,4,3.4],[2,-9,2.6]]:[[-6,-3,4],[7,4,3.6],[2,-9,2.8],[-8,8,2.4]]) P.spark(x,y,r,v==='frost'?'#ffffff':'#bfe0ff');
    P.hi(-9,-6,2.4,1.4,-0.6); },
  fish(P,v){ const col=v==='cold'?'#8ab8dc':'#6aa8d0';
    P.sh(col,g=>icoPoly(g,[11,0,20,-9,19,9]),{d:1.2});
    P.sh(col,g=>{ g.moveTo(-17,0); g.bezierCurveTo(-11,-11,6,-11,13,0); g.bezierCurveTo(6,11,-11,11,-17,0); g.closePath(); });
    P.fl(icoTone(col,0.4),g=>{ g.moveTo(-14,1); g.bezierCurveTo(-8,6,4,6,10,1); g.closePath(); });
    P.st(icoTone(col,-0.35),1.3,g=>{ g.moveTo(-5,-6); g.quadraticCurveTo(-2,0,-5,6); });
    P.dot(-11,-2,2,'#1e1418'); P.dot(-11.6,-2.6,0.7,'#ffffff');
    if(v==='cold') P.spark(14,-12,4,'#e8f8ff'); },
  sandwich(P){ P.sh('#e8b860',g=>icoRp(g,-17,3,34,9,4)); P.sh('#7ac050',g=>{ g.moveTo(-17,3); for(let x=-17;x<=17;x+=5) g.lineTo(x+2.5,x%2?6:-1); g.lineTo(17,3); g.closePath(); },{d:1});
    P.sh('#f0946a',g=>icoRp(g,-15,-4,30,6,2),{d:1}); P.sh('#f0c070',g=>{ g.moveTo(-17,-3); g.bezierCurveTo(-17,-15,17,-15,17,-3); g.closePath(); });
    P.fl('#fff2c8',g=>{ icoEl(g,-6,-9,1.2,0.8); icoEl(g,2,-11,1.2,0.8); icoEl(g,8,-8,1.2,0.8); }); },
  honey(P){ P.sh('#d8963a',g=>{ g.moveTo(-14,-6); g.bezierCurveTo(-18,6,-12,16,0,16); g.bezierCurveTo(12,16,18,6,14,-6); g.closePath(); });
    P.sh('#b8742a',g=>icoRp(g,-12,-11,24,6,2.5)); P.fl('#ffc83a',g=>{ g.moveTo(-10,-6); g.lineTo(10,-6); g.lineTo(10,-3); g.quadraticCurveTo(8,4,6,-2); g.quadraticCurveTo(2,1,0,-3); g.quadraticCurveTo(-4,6,-6,-3); g.lineTo(-10,-3); g.closePath(); });
    P.fl('#fff2c8',g=>icoRp(g,-7,2,14,8,2)); P.fl('#b8742a',g=>icoPoly(g,[0,3,3,5,3,8,0,9.5,-3,8,-3,5])); P.hi(-10,4,1.6,3.6,0.3); },
  cheese(P){ P.sh('#f4b83a',g=>icoPoly(g,[-17,12,17,12,17,0,-17,4])); P.sh('#ffd65a',g=>icoPoly(g,[-17,4,17,0,6,-12])); P.fl('#d89a2a',g=>{ icoEl(g,-6,8,2.4,2); icoEl(g,8,6,2,1.6); icoEl(g,4,-3,2,1.2); icoEl(g,-2,-1,1.4,1); }); },
  yarn(P,v){ const col=v==='wolf'?'#b4aca6':'#c8a0e0';
    P.band(col,1.6,g=>{ g.moveTo(10,10); g.bezierCurveTo(16,16,8,20,18,20); });
    P.sh(col,g=>icoEl(g,-1,0,14,14));
    P.st(icoTone(col,-0.3),1.3,g=>{ g.moveTo(-12,-6); g.quadraticCurveTo(-1,-2,8,-11); g.moveTo(-14,2); g.quadraticCurveTo(-1,5,12,-6); g.moveTo(-11,9); g.quadraticCurveTo(2,8,13,2); g.moveTo(-4,-13); g.quadraticCurveTo(2,0,-2,13); }); },
  scarf(P,v){ const col={blue:'#3a7ad8',long:'#e0a030'}[v]||'#d8402a', st=v==='long'?'#7a4ac8':'#fff0d8';
    P.band(col,7,g=>{ g.moveTo(-14,-10); g.bezierCurveTo(-6,-2,6,-2,14,-10); });
    P.sh(col,g=>icoRp(g,3,-6,8,22,2));
    P.fl(st,g=>{ g.rect(3,1,8,2.4); g.rect(3,8,8,2.4); });
    P.st(col,1.4,g=>{ for(const x of [4.5,7,9.5]){ g.moveTo(x,16); g.lineTo(x,20); } }); },
  sweater(P,v){ const col=v==='small'?'#5a9ad8':'#c84a5a';
    P.sh(col,g=>icoPoly(g,[-8,-14,8,-14,18,-6,14,2,10,-2,10,15,-10,15,-10,-2,-14,2,-18,-6]));
    P.st(icoTone(col,0.35),1.3,g=>{ g.moveTo(-6,4); g.lineTo(-3,1); g.lineTo(0,4); g.lineTo(3,1); g.lineTo(6,4); g.moveTo(-6,10); g.lineTo(-3,7); g.lineTo(0,10); g.lineTo(3,7); g.lineTo(6,10); });
    P.fl(icoTone(col,-0.3),g=>{ g.moveTo(-5,-14); g.quadraticCurveTo(0,-8,5,-14); g.closePath(); }); },
  sock(P){ P.sh('#e0d4c0',g=>{ g.moveTo(-5,-17); g.lineTo(7,-17); g.lineTo(7,4); g.quadraticCurveTo(8,15,-4,15); g.lineTo(-12,15); g.quadraticCurveTo(-17,15,-17,10); g.quadraticCurveTo(-17,5,-10,4); g.lineTo(-5,2); g.closePath(); });
    P.fl('#c8402a',g=>{ g.rect(-5,-17,12,4); g.rect(-5,-8,12,3); }); P.fl('rgba(120,100,70,.4)',g=>icoEl(g,-12,10,2.4,1.6)); },
  feather(P,v){ const col={peacock:'#2aa89a',storm:'#e8eef8',plume:'#e8582a'}[v]||'#e8e0d0';
    P.at(0,1,-0.7,0,()=>{
      P.sh(col,g=>{ g.moveTo(0,-21); g.bezierCurveTo(10,-12,10,6,1.5,16); g.lineTo(-1.5,16); g.bezierCurveTo(-10,6,-10,-12,0,-21); g.closePath(); });
      if(v==='peacock'){ P.fl('#3a5ad8',g=>icoEl(g,0,-9,4.6,5.6)); P.fl('#e8c03a',g=>icoEl(g,0,-9,2.4,3)); P.fl('#1a2a6a',g=>icoEl(g,0,-9,1,1.4)); }
      if(v==='storm') P.st('#7ab0e8',1.4,g=>{ g.moveTo(-3,-12); g.lineTo(2,-6); g.lineTo(-2,-2); g.lineTo(3,4); });
      if(v==='plume') P.fl('#ffc83a',g=>{ g.moveTo(0,-17); g.bezierCurveTo(5,-10,5,2,0,10); g.bezierCurveTo(-5,2,-5,-10,0,-17); g.closePath(); });
      P.band(icoTone(col,-0.2),1.2,g=>{ g.moveTo(0,-15); g.lineTo(0,23); }); }); },
  pick(P){ P.band('#9b6a3a',3.4,g=>{ g.moveTo(-12,17); g.lineTo(6,-6); });
    P.sh('#8e949e',g=>{ g.moveTo(-14,-10); g.quadraticCurveTo(2,-20,18,-4); g.lineTo(15,-1); g.quadraticCurveTo(2,-12,-12,-6); g.closePath(); });
    P.fl('#5aa040',g=>icoStar(g,-8,12,4,4)); },
  hammer(P){ P.band('#8a5a32',4,g=>{ g.moveTo(0,4); g.lineTo(0,20); }); P.sh('#8e949e',g=>icoRp(g,-16,-12,32,16,3)); P.fl('#d8a63a',g=>g.rect(-16,-6,32,4)); P.sh('#ffd84a',g=>icoPoly(g,[2,-11,-4,-3,0,-3,-2,3,4,-5,0,-5,2,-11]),{d:0.8,w:P.ow*0.7}); },
  horn(P,v){ const col=v==='sock'?'#e0d4c0':'#eadcbc';
    if(v==='sock'){ for(const s of [-1,1]) P.sh(col,g=>{ g.moveTo(s*3,12); g.bezierCurveTo(s*3,-4,s*10,-14,s*17,-15); g.bezierCurveTo(s*14,-8,s*10,2,s*10,12); g.closePath(); }); P.fl('#c8402a',g=>{ g.rect(-11,6,9,3); g.rect(2,6,9,3); }); return; }
    P.sh(col,g=>{ g.moveTo(-17,6); g.bezierCurveTo(-10,-14,8,-16,16,-6); g.lineTo(10,0); g.bezierCurveTo(4,-6,-6,-4,-11,10); g.closePath(); });
    P.st('#8a6a3a',2,g=>{ g.moveTo(-12,-1); g.lineTo(-7,3); g.moveTo(-3,-9); g.lineTo(0,-3); g.moveTo(7,-11); g.lineTo(7,-4); });
    P.sh('#8a6a3a',g=>icoEl(g,-15,9,3,3.6,0.6)); },
  lure(P){ P.st(P.sb?'#3b2233':'#5a5a60',1.4,g=>{ g.moveTo(9,4); g.quadraticCurveTo(17,9,13,15); g.quadraticCurveTo(10,18,8,14); g.moveTo(-14,-2); g.lineTo(-19,-6); });
    P.sh('#e8c03a',g=>{ g.moveTo(-14,-2); g.bezierCurveTo(-6,-12,6,-10,11,2); g.bezierCurveTo(4,8,-8,7,-14,-2); g.closePath(); });
    P.fl('#d83a2a',g=>{ icoEl(g,-3,-3,2,2); icoEl(g,4,0,1.6,1.6); }); P.dot(-9,-4,1.6,'#1e1418'); },
  kettle(P){ P.st(P.ol,P.ow+2.4,g=>{ g.moveTo(-9,-8); g.quadraticCurveTo(0,-20,9,-8); }); P.st('#3a4a54',2.4,g=>{ g.moveTo(-9,-8); g.quadraticCurveTo(0,-20,9,-8); });
    P.sh('#5a7a8a',g=>icoPoly(g,[-12,-1,-20,-8,-18,-10,-10,-5]),{d:1});
    P.sh('#5f8090',g=>{ g.moveTo(-13,-6); g.lineTo(13,-6); g.bezierCurveTo(19,4,16,15,0,15); g.bezierCurveTo(-16,15,-19,4,-13,-6); g.closePath(); });
    P.sh('#3a4a54',g=>icoRp(g,-3,-11,6,5,2),{d:1}); P.hi(-8,1,2,4,0.3); },
  pot(P){ P.st('rgba(255,255,255,.7)',1.5,g=>{ g.moveTo(-4,-10); g.bezierCurveTo(-7,-13,-1,-15,-4,-19); g.moveTo(4,-10); g.bezierCurveTo(1,-13,7,-15,4,-19); });
    P.sh('#4a4a54',g=>{ icoRp(g,-21,-4,6,4,1.5); icoRp(g,15,-4,6,4,1.5); });
    P.sh('#55555f',g=>icoRp(g,-16,-6,32,21,7)); P.fl('#e8a040',g=>icoEl(g,0,-5,15,3.6)); P.fl('#fff0c0',g=>{ icoEl(g,-5,-5,2,1); icoEl(g,4,-6,1.6,0.8); }); },
  basket(P,v){ P.st(P.ol,P.ow+2.6,g=>{ g.moveTo(-12,-2); g.quadraticCurveTo(0,-24,12,-2); }); P.st('#b07a3a',2.6,g=>{ g.moveTo(-12,-2); g.quadraticCurveTo(0,-24,12,-2); });
    if(v==='knit'){ P.sh('#e88aa8',g=>icoEl(g,-5,-4,6,6)); P.sh('#6aa8e8',g=>icoEl(g,5,-4,6,6)); P.band('#c8b0a0',1,g=>{ g.moveTo(-3,-14); g.lineTo(7,4); g.moveTo(3,-14); g.lineTo(-6,4); }); }
    P.sh('#c8924a',g=>icoPoly(g,[-17,-2,17,-2,13,16,-13,16]));
    P.st('#8a5a2a',1.3,g=>{ g.moveTo(-16,4); g.lineTo(16,4); g.moveTo(-14,10); g.lineTo(14,10); for(const x of [-8,0,8]){ g.moveTo(x,-2); g.lineTo(x*0.8,16); } }); },
  carrot(P,v){ const col=v==='parsnip'?'#efe3c2':'#f27a2a'; P.g.translate(-1,2.5);
    P.sh('#5aa83e',g=>{ g.moveTo(8,-8); g.quadraticCurveTo(10,-20,4,-21); g.quadraticCurveTo(13,-14,12,-9); g.quadraticCurveTo(18,-18,21,-12); g.quadraticCurveTo(15,-8,11,-5); g.closePath(); },{d:1});
    P.sh(col,g=>{ g.moveTo(4,-11); g.quadraticCurveTo(14,-8,13,0); g.lineTo(-16,19); g.closePath(); });
    P.st(icoTone(col,-0.35),1.3,g=>{ g.moveTo(5,-4); g.lineTo(9,-3); g.moveTo(-1,3); g.lineTo(4,4); g.moveTo(-7,9); g.lineTo(-3,10); });
    if(v!=='parsnip') P.fl('#ffd84a',g=>icoStar(g,0,-3,2.4,4)); },
  flower(P){ P.glow(0,0,23,'190,200,255',.45);
    for(let i=0;i<6;i++){ const a=i/6*TAU; P.sh('#ecebff',g=>icoEl(g,Math.cos(a)*8,Math.sin(a)*8,7.6,4.6,a),{d:1}); }
    P.sh('#ffe08a',g=>icoEl(g,0,0,4.6,4.6),{d:0.8}); P.spark(14,-13,3.6,'#ffffff'); },
  berry(P){ P.sh('#5aa83e',g=>{ g.moveTo(0,-8); g.quadraticCurveTo(8,-20,16,-14); g.quadraticCurveTo(10,-6,0,-8); g.closePath(); },{d:1});
    for(const [x,y] of [[-6,-1],[6,0],[0,9]]){ P.sh('#5674d6',g=>icoEl(g,x,y,7.2,7.2)); P.hi(x-2.4,y-2.6,1.8,1.2,-0.6); }
    P.spark(-12,-12,3.6,'#e8f8ff'); },
  pearl(P,v){ if(v==='glow') P.glow(0,2,24,'200,230,255',.6);
    P.sh('#f0c4b4',g=>{ g.moveTo(-17,6); g.quadraticCurveTo(-16,-12,0,-14); g.quadraticCurveTo(16,-12,17,6); g.quadraticCurveTo(0,10,-17,6); g.closePath(); });
    P.st('#c88a7a',1.2,g=>{ for(const a of [-0.9,-0.45,0,0.45,0.9]){ g.moveTo(0,8); g.lineTo(Math.sin(a)*15,-Math.cos(a)*11); } });
    P.sh('#e8b8a8',g=>{ g.moveTo(-17,6); g.quadraticCurveTo(0,20,17,6); g.quadraticCurveTo(0,11,-17,6); g.closePath(); },{d:1});
    P.sh(v==='glow'?'#eaf6ff':'#f8f2ff',g=>icoEl(g,0,6,6.4,6.4),{d:1.2}); P.hi(-2,4,2,1.4,-0.6); },
  hat(P,v){ const T={party:1,wizard:1,crown:1,top:1,feather:1,sky:1,pirate:1,desert:1,mirage:1,wolf:1,marlo:1,firefly:1};
    if(!T[v]) v='cap';
    if(v==='party'){ P.sh('#e84a8a',g=>icoPoly(g,[0,-18,13,14,-13,14])); P.fl('#ffd84a',g=>{ icoEl(g,-2,4,2,2); icoEl(g,4,-3,1.8,1.8); icoEl(g,5,9,2,2); icoEl(g,-5,10,1.6,1.6); }); P.sh('#4ac8e8',g=>icoEl(g,0,-18,4.4,4.4),{d:1}); P.sh('#ffd84a',g=>icoRp(g,-15,12,30,5,2.5),{d:1}); return; }
    if(v==='wizard'){ P.sh('#3e3e9e',g=>{ g.moveTo(-11,9); g.quadraticCurveTo(-4,-8,4,-15); g.quadraticCurveTo(10,-19,15,-15); g.quadraticCurveTo(8,-12,9,-2); g.lineTo(11,9); g.closePath(); }); P.fl('#ffe066',g=>{ icoStar(g,-1,1,3.4); icoStar(g,6,-8,2.4); }); P.sh('#4e4ec0',g=>icoEl(g,0,10,19,5)); return; }
    if(v==='crown'||v==='firefly'){ if(v==='firefly') P.glow(0,0,24,'255,230,120',.45); P.st(P.ol,P.ow+3,g=>icoEl(g,0,2,15,8)); P.st(v==='firefly'?'#3a3a4a':'#5aa83e',3,g=>icoEl(g,0,2,15,8));
      const C=v==='firefly'?['#fff07a','#ffe04a','#fff7b0','#ffd84a']:['#ff7aa0','#ffd84a','#ffffff','#b48cff'];
      for(let i=0;i<7;i++){ const a=Math.PI*(0.95+i/6*1.1), x=Math.cos(a)*15, y=2+Math.sin(a)*8; if(v==='firefly'){ P.glow(x,y,6,'255,240,140',.8); P.dot(x,y,2.2,C[i%4]); } else P.sh(C[i%4],g=>icoEl(g,x,y,3.6,3.6),{d:0.8,w:P.ow*0.8}); }
      return; }
    if(v==='top'){ P.sh('#26262c',g=>icoRp(g,-10,-17,20,25,2)); P.fl('#a8302a',g=>g.rect(-10,1,20,4.5)); P.sh('#2e2e36',g=>icoEl(g,0,9,18,4.5)); P.hi(-6,-10,1.2,4,0); return; }
    if(v==='pirate'){ P.sh('#2a2228',g=>{ g.moveTo(-19,4); g.quadraticCurveTo(-12,-16,0,-14); g.quadraticCurveTo(12,-16,19,4); g.quadraticCurveTo(0,-2,-19,4); g.closePath(); }); P.st('#e0b84a',1.6,g=>{ g.moveTo(-17,2); g.quadraticCurveTo(0,-4,17,2); }); P.fl('#f0ece0',g=>{ icoEl(g,0,-6,3.4,3); g.rect(-1.6,-4,3.2,2.4); }); return; }
    if(v==='desert'||v==='mirage'){ const a=v==='mirage'; if(a) P.g.globalAlpha=0.78; P.sh(a?'#c8b4ff':'#e0c27e',g=>icoEl(g,0,6,20,6)); P.sh(a?'#d8c8ff':'#e8cc8a',g=>{ g.moveTo(-10,5); g.bezierCurveTo(-10,-13,10,-13,10,5); g.closePath(); }); P.fl(a?'#8a6ad8':'#c8643a',g=>g.rect(-10,0,20,3.6)); P.g.globalAlpha=1; if(a){ P.spark(13,-10,4,'#ffffff'); P.spark(-14,-4,3,'#ffffff'); } return; }
    if(v==='wolf'){ P.sh('#9a9088',g=>icoPoly(g,[-12,-6,-9,-17,-4,-10])); P.sh('#9a9088',g=>icoPoly(g,[12,-6,9,-17,4,-10])); P.sh('#a8a098',g=>{ g.moveTo(-14,8); g.bezierCurveTo(-14,-14,14,-14,14,8); g.closePath(); }); P.sh('#e8e0d4',g=>icoRp(g,-16,5,32,8,4)); return; }
    if(v==='marlo'){ P.sh('#4a8a4a',g=>icoPoly(g,[-18,10,-11,-2,11,-2,18,10])); P.sh('#56a056',g=>{ g.moveTo(-11,-1); g.bezierCurveTo(-11,-15,11,-15,11,-1); g.closePath(); }); P.fl('#ffd84a',g=>icoStar(g,4,-6,3.2,4)); return; }
    if(v==='feather'||v==='sky'){ if(v==='sky'){ for(const a of [-0.5,0,0.5]) P.at(0,6,a,0,()=>P.sh('#eef4fc',g=>{ g.moveTo(0,-22); g.bezierCurveTo(6,-16,6,-6,0,0); g.bezierCurveTo(-6,-6,-6,-16,0,-22); g.closePath(); },{d:1})); P.sh('#4a7ac8',g=>icoRp(g,-14,4,28,7,3.5)); return; }
      P.g.translate(0,3); P.at(6,-5,0.5,0,()=>P.sh('#ffd84a',g=>{ g.moveTo(0,-16); g.bezierCurveTo(5,-10,5,0,0,6); g.bezierCurveTo(-5,0,-5,-10,0,-16); g.closePath(); },{d:1}));
      P.sh('#2a7a7a',g=>{ g.moveTo(-12,6); g.bezierCurveTo(-12,-12,12,-12,12,6); g.closePath(); }); P.sh('#2f8a8a',g=>icoEl(g,0,7,18,5)); P.fl('#e0c060',g=>g.rect(-12,0,24,3)); return; }
    P.sh('#c84a3a',g=>{ g.moveTo(-12,6); g.bezierCurveTo(-12,-12,12,-12,12,6); g.closePath(); }); P.sh('#a83a2a',g=>icoPoly(g,[6,2,20,6,18,9,4,8]),{d:1}); P.sh('#ffffff',g=>icoEl(g,0,-9,3,3),{d:0.8}); },
  earmuffs(P){ P.st(P.ol,P.ow+3,g=>{ g.moveTo(-12,4); g.bezierCurveTo(-12,-20,12,-20,12,4); }); P.st('#8a6a5a',3,g=>{ g.moveTo(-12,4); g.bezierCurveTo(-12,-20,12,-20,12,4); });
    for(const s of [-1,1]) P.sh('#d8402a',g=>{ g.moveTo(s*6,0); g.quadraticCurveTo(s*20,-2,s*18,12); g.quadraticCurveTo(s*14,18,s*7,14); g.quadraticCurveTo(s*4,8,s*6,0); g.closePath(); });
    P.fl('#fff0e0',g=>{ g.rect(-17,10,10,3); g.rect(7,10,10,3); }); },
  bucket(P){ P.st(P.ol,P.ow+2,g=>{ g.moveTo(-13,-8); g.quadraticCurveTo(0,-22,13,-8); }); P.st('#8a96a4',2,g=>{ g.moveTo(-13,-8); g.quadraticCurveTo(0,-22,13,-8); });
    P.sh('#7f8c9a',g=>icoPoly(g,[-15,-8,15,-8,11,16,-11,16])); P.fl('#5a6672',g=>{ g.rect(-14.4,-3,28.8,3); g.rect(-12,9,24,3); }); P.fl('#dfeaf4',g=>icoEl(g,0,-8,15,3)); P.fl('#ffd84a',g=>icoPoly(g,[-6,-11,-4,-17,-1,-12,2,-18,4,-12,7,-17,8,-11])); },
  egg(P){ for(const [x,r] of [[-7,-0.25],[8,0.3]]) P.at(x,3,r,0,()=>{ P.sh('#d8784a',g=>{ g.moveTo(-8,-2); g.lineTo(-5,-6); g.lineTo(-2,-2); g.lineTo(1,-7); g.lineTo(4,-2); g.lineTo(8,-5); g.bezierCurveTo(10,8,6,14,0,14); g.bezierCurveTo(-6,14,-10,8,-8,-2); g.closePath(); }); P.fl('#f0b07a',g=>{ icoEl(g,-2,4,1.8,1.4); icoEl(g,3,8,1.6,1.2); }); }); },
  stone(P){ P.st('rgba(160,210,240,.7)',1.4,g=>{ g.moveTo(-18,12); g.quadraticCurveTo(0,18,18,12); g.moveTo(-12,16); g.quadraticCurveTo(0,20,12,16); });
    P.sh('#9aa6ae',g=>icoEl(g,0,0,16,10,-0.15)); P.st('#c8d2d8',1.6,g=>{ g.moveTo(-10,2); g.quadraticCurveTo(0,-4,10,-3); }); P.hi(-6,-4,3,1.4,-0.2); },
  locket(P){ P.st('#d8a63a',1.4,g=>{ g.moveTo(-12,-18); g.quadraticCurveTo(0,0,12,-18); }); P.sh('#d8a63a',g=>icoEl(g,0,-6,3,3),{d:0.8});
    P.sh('#f2c2b2',g=>{ g.moveTo(0,-4); g.quadraticCurveTo(13,-2,12,8); g.quadraticCurveTo(6,16,0,16); g.quadraticCurveTo(-6,16,-12,8); g.quadraticCurveTo(-13,-2,0,-4); g.closePath(); });
    P.st('#c88a7a',1.2,g=>{ for(const x of [-6,0,6]){ g.moveTo(0,-2); g.lineTo(x,14); } }); },
  musicbox(P){ P.sh('#e0b040',g=>icoPoly(g,[-15,-4,15,-4,10,-17,-12,-14])); P.sh('#d8a63a',g=>icoRp(g,-15,-4,30,18,3)); P.fl('#a8302a',g=>g.rect(-15,2,30,3)); P.dot(0,9,2,'#8a5a2a');
    P.fl('#3b2a22',g=>{ icoEl(g,15,-16,2,1.5,-0.4); g.rect(16,-23,1.2,7); }); },
  clock(P){ P.sh('#5a8ad8',g=>{ g.moveTo(-4,-13); g.quadraticCurveTo(-1,-21,6,-19); g.lineTo(10,-17); g.lineTo(6,-15); g.quadraticCurveTo(4,-12,2,-12); g.closePath(); },{d:1}); P.dot(3,-17,0.9,'#1e1418');
    P.sh('#b07a3a',g=>icoEl(g,0,3,15,15)); P.sh('#f6ecd6',g=>icoEl(g,0,3,10.5,10.5),{d:1});
    P.st('#3b2a22',1.7,g=>{ g.moveTo(0,3); g.lineTo(0,-4); g.moveTo(0,3); g.lineTo(5,6); }); P.fl('#3b2a22',g=>{ for(let i=0;i<12;i+=3){ const a=i/12*TAU; icoEl(g,Math.cos(a)*8,3+Math.sin(a)*8,0.9,0.9); } }); },
  gear(P,v){ if(v==='spring'){ P.st(P.ol,P.ow+2.2,g=>{ g.moveTo(-6,-16); for(let i=0;i<7;i++){ g.lineTo(i%2?-8:8,-12+i*4.4); } g.lineTo(6,17); }); P.st('#b4bcc6',2.2,g=>{ g.moveTo(-6,-16); for(let i=0;i<7;i++){ g.lineTo(i%2?-8:8,-12+i*4.4); } g.lineTo(6,17); }); return; }
    P.sh('#c99a4a',g=>{ for(let i=0;i<16;i++){ const a=i/16*TAU, r=i%2?12:16; if(i) g.lineTo(Math.cos(a)*r,Math.sin(a)*r); else g.moveTo(Math.cos(a)*r,Math.sin(a)*r); } g.closePath(); icoEl(g,0,0,5,5); },{eo:true}); },
  oil(P,v){ if(v==='ever') P.glow(0,4,24,'255,220,120',.55);
    P.sh('#b47e4c',g=>icoRp(g,-4,-19,8,7,2),{d:1}); P.fl('rgba(200,230,240,.5)',g=>{ icoRp(g,-5,-13,10,6,2); icoEl(g,0,6,12,11); });
    P.fl(v==='ever'?'#ffe07a':'#e8b84a',g=>{ g.moveTo(-11,6); g.bezierCurveTo(-10,18,10,18,11,6); g.closePath(); });
    P.g.beginPath(); icoRp(P.g,-5,-13,10,6,2); icoEl(P.g,0,6,12,11); P.g.lineWidth=P.ow; P.g.strokeStyle=P.ol; P.g.stroke(); P.hi(-6,0,1.6,4,0.3); },
  bomb(P,v){ if(v==='powder'){ P.sh('#a8743a',g=>icoRp(g,-13,-14,26,30,8)); P.fl('#6a4422',g=>{ g.rect(-13,-8,26,3); g.rect(-13,8,26,3); }); P.st('#3b2233',2.2,g=>{ g.moveTo(-5,-3); g.lineTo(5,5); g.moveTo(5,-3); g.lineTo(-5,5); }); return; }
    const col={tide:'#2a6ac8',smoke:'#6a4a8a'}[v]||'#3a3a48';
    P.st('#a8743a',2,g=>{ g.moveTo(7,-10); g.quadraticCurveTo(12,-18,17,-15); }); P.spark(17,-16,5,'#ffd84a');
    P.sh(col,g=>icoEl(g,-2,3,14,14)); P.sh('#55555f',g=>icoRp(g,2,-12,8,6,1.5),{d:1});
    if(v==='tide') P.st('#9ad8ff',1.6,g=>{ g.moveTo(-14,5); g.quadraticCurveTo(-9,1,-5,5); g.quadraticCurveTo(-1,9,3,5); g.quadraticCurveTo(7,1,11,5); });
    if(v==='smoke') P.fl('rgba(220,200,240,.8)',g=>{ icoEl(g,-17,-10,4,3); icoEl(g,-12,-14,3,2.4); });
    P.hi(-8,-3,3,2,-0.6); },
  rope(P,v){ if(v==='chain'){ for(let i=0;i<4;i++) P.sh('#8e949e',g=>{ const x=-13+i*8.6, y=-10+i*6.6; icoEl(g,x,y,6.4,4,0.65); icoEl(g,x,y,3.6,1.6,0.65); },{eo:true,d:1}); return; }
    for(const r of [15,10.5,6]) P.band('#c8a060',3.4,g=>icoEl(g,0,2,r,r*0.62));
    P.band('#c8a060',3.4,g=>{ g.moveTo(14,2); g.quadraticCurveTo(18,14,8,17); }); },
  cloak(P){ P.sh('#8a2a32',g=>{ g.moveTo(-8,-15); g.lineTo(8,-15); g.quadraticCurveTo(12,0,18,16); g.quadraticCurveTo(0,20,-18,16); g.quadraticCurveTo(-12,0,-8,-15); g.closePath(); });
    P.st('#e0b84a',1.6,g=>{ g.moveTo(-18,15); g.quadraticCurveTo(0,19,18,15); }); P.sh('#e0b84a',g=>icoEl(g,0,-12,4,4),{d:1}); P.fl('#ff7a3a',g=>icoFlame(g,0,-12,1.6)); },
  treat(P){ P.at(0,0,-0.5,0,()=>P.sh('#e2b070',g=>{ icoRp(g,-11,-4,22,8,3); icoEl(g,-12,-4,4.6,4.6); icoEl(g,-12,4,4.6,4.6); icoEl(g,12,-4,4.6,4.6); icoEl(g,12,4,4.6,4.6); })); },
  purse(P){ P.sh('#8a5a3a',g=>{ g.moveTo(-8,-8); g.bezierCurveTo(-20,2,-14,16,0,16); g.bezierCurveTo(14,16,20,2,8,-8); g.closePath(); }); P.sh('#6a4428',g=>icoPoly(g,[-9,-9,-12,-15,-4,-12,0,-16,4,-12,12,-15,9,-9]),{d:1});
    P.band('#e0b84a',1.4,g=>{ g.moveTo(-9,-8); g.quadraticCurveTo(0,-4,9,-8); }); P.sh('#ffd84a',g=>icoEl(g,0,5,5,5),{d:1}); },
  moon(P){ P.glow(0,0,24,'240,240,200',.55); P.sh('#f2f0d4',g=>icoCrescent(g,15.5,8,-4,12.5)); P.fl('rgba(200,195,160,.7)',g=>{ icoEl(g,-7,-2,2,2); icoEl(g,-4,7,1.4,1.4); }); P.spark(13,-12,3.6,'#ffffff'); },
  spark(P){ P.glow(0,2,24,'255,150,60',.6); P.sh('#ff7a2a',g=>icoFlame(g,0,2,11)); P.fl('#ffd25a',g=>icoFlame(g,0,6,6)); P.fl('#fff6c8',g=>icoFlame(g,0,9,2.6)); },
  pie(P){ P.sh('#c83a5a',g=>icoPoly(g,[-16,10,16,10,14,2,-6,-12])); P.sh('#e8a656',g=>icoPoly(g,[-16,10,16,10,16,15,-16,15])); P.sh('#eeb466',g=>{ g.moveTo(-6,-12); g.lineTo(14,2); g.lineTo(16,-1); g.lineTo(-4,-15); g.closePath(); },{d:1}); },
  sack(P){ P.sh('#b8946a',g=>{ g.moveTo(-6,-9); g.bezierCurveTo(-20,-2,-18,17,0,17); g.bezierCurveTo(18,17,20,-2,6,-9); g.closePath(); }); P.sh('#a8845a',g=>icoPoly(g,[-6,-9,-9,-17,0,-13,9,-17,6,-9]),{d:1}); P.band('#7a5a3a',1.4,g=>{ g.moveTo(-7,-9); g.lineTo(7,-9); });
    P.sh('#9aa0a8',g=>icoEl(g,-9,-12,3.4,2.6),{d:0.8}); P.sh('#c8a0e0',g=>icoEl(g,5,-14,3,2.4),{d:0.8}); },
  crate(P){ P.sh('#b0743a',g=>icoRp(g,-15,-8,30,24,2)); P.st('#7a4a22',1.6,g=>{ g.moveTo(-15,0); g.lineTo(15,0); g.moveTo(-15,8); g.lineTo(15,8); g.moveTo(-15,-8); g.lineTo(15,16); });
    P.sh('#3e3e9e',g=>icoPoly(g,[-8,-8,-2,-21,4,-8])); P.sh('#e84a8a',g=>icoPoly(g,[3,-8,8,-18,13,-8])); },
  sled(P){ P.st(P.ol,P.ow+2.4,g=>{ g.moveTo(-17,10); g.lineTo(13,10); g.quadraticCurveTo(19,10,18,4); }); P.st('#c8c8d0',2.4,g=>{ g.moveTo(-17,10); g.lineTo(13,10); g.quadraticCurveTo(19,10,18,4); });
    P.band('#8a5a32',2,g=>{ g.moveTo(-10,10); g.lineTo(-10,3); g.moveTo(8,10); g.lineTo(8,3); }); P.sh('#c8402a',g=>icoRp(g,-16,-4,30,8,2)); },
  gem(P){ P.glow(0,0,22,'255,200,120',.4); P.sh('#ff9a5a',g=>icoPoly(g,[-12,-4,-6,-12,6,-12,12,-4,0,14])); P.st(icoTone('#ff9a5a',0.45),1.2,g=>{ g.moveTo(-12,-4); g.lineTo(12,-4); g.moveTo(-6,-12); g.lineTo(-3,-4); g.lineTo(0,14); g.moveTo(6,-12); g.lineTo(3,-4); g.lineTo(0,14); }); },
  parcel(P){ P.sh('#c8945a',g=>icoRp(g,-15,-11,30,25,3)); P.fl(icoTone('#c8945a',0.3),g=>icoRp(g,-15,-11,30,6,2));
    P.st('#f2e2c0',2.4,g=>{ g.moveTo(0,-11); g.lineTo(0,14); g.moveTo(-15,1); g.lineTo(15,1); });
    P.st(P.ol,P.ow*0.7,g=>{ g.moveTo(0,-11); g.quadraticCurveTo(-9,-19,-7,-11); g.closePath(); g.moveTo(0,-11); g.quadraticCurveTo(9,-19,7,-11); g.closePath(); });
    P.fl('#f2e2c0',g=>{ g.moveTo(0,-11); g.quadraticCurveTo(-9,-19,-7,-11); g.closePath(); g.moveTo(0,-11); g.quadraticCurveTo(9,-19,7,-11); g.closePath(); }); }
};
// which drawing each item gets: by id, by the ITEMDEF icon name, by words in the id and name, then by its group
const ICO_ID={it_bun:'bun',it_pepper:'pepper',it_feather:'crowfeather',it_taffy:'taffy',it_drop:'thunder',it_stone:'hearth',it_snowball:'snowball',it_pudding:'pudding',
  letter_b:'letter',recipe:'scroll',frostberry:'berry',basket:'basket',moonlily:'flower',letter_moss:'letter',oath_letter:'letter.old',oath_badge:'badge',
  tunnel_key:'key',oath_plans:'scroll.plans',lucky_pick:'pick',star_iron:'ore',horn:'horn',fish:'fish',rod:'rod',lucky_lure:'lure',kettle:'kettle',honey:'honey',
  juniper_map:'map',carrot:'carrot',map_x1:'map',map_x2:'map',map_x3:'map',lantern:'lantern',treat:'treat',relic:'cloak',errand:'parcel',
  parcel_nana_osric:'sweater',parcel_wendel_dell:'jar.worms',parcel_hal_ulf:'cheese',parcel_marigold_hob:'scarf',parcel_quill_gorran:'map.star',parcel_cookie_tilly:'scroll',
  parcel_elka_rook:'sled',parcel_yara_wren:'letter',parcel_mayor_yara:'letter.fancy',parcel_pell_hob:'crate',parcel_gorran_quill:'sack',parcel_tilly_bertram:'pie',
  purse:'purse',sheet1:'page.music',sheet2:'page.music',sheet3:'page.music',cheese:'cheese',yarn:'yarn.wolf',scarf:'scarf',feather:'feather.peacock',songscroll:'scroll.music',
  starmap:'map.star',stariron2:'ore',marlo_hat:'hat.marlo',tide_pearl:'pearl.glow',sky_feather:'feather.storm',c_gear:'gear',a1_heart:'heart',c_shard1:'shard.dusk',
  f_shard2:'shard.frost',m_shard3:'shard.moon',m_heart:'heart.mended',a1_locket:'locket',a1_page:'page.torn',a1_lantern:'paperlantern',a1_thunder:'hammer',
  a1_skipstone:'stone',a1_citykey:'key.city',a1_liftkey:'key',a1_marlonote:'page.torn',a1_coldfish:'fish.cold',c_diary:'book.dream',c_letters:'letter.bundle',
  c_lampoil:'oil',c_lumpybun:'biscuit.lumpy',c_biscuit:'biscuit',c_musicbox:'musicbox',c_seapepper:'pepper.sea',c_chowder:'pot',c_chain:'rope.chain',c_sock:'sock',
  c_spring:'gear.spring',c_mainspring:'gear.spring',c_pearl_letter:'letter',c_map:'map',c_scarf:'scarf.blue',c_newscap:'badge.press',c_badge:'badge.clock',
  c_birdclock:'clock',c_bird_clock:'clock',f_powder:'bomb.powder',f_soup:'pot',f_starfrost:'ore.frost',f_parsnip:'carrot.parsnip',f_northmaps:'map.north',
  f_medal:'badge.medal',f_cocoa:'mug',f_honey:'honey',f_earmuffs:'earmuffs',f_bucket:'bucket',f_snowletter:'letter.snow',f_icediary:'book.ice',
  m_hat_pirate:'hat.pirate',m_hat_firefly:'hat.firefly',m_mooncrumb:'moon',m_book_raw:'book.soggy',m_book:'book.moth',m_stariron:'ore',m_lampoil:'oil.ever',
  m_vletter:'letter.moth',m_sandwich:'sandwich',m_tideproto:'bomb.tide',m_smokebomb:'bomb.smoke',m_rope:'rope',m_airjar:'jar',m_pearl:'pearl',m_hat_desert:'hat.desert',
  m_hat_mirage:'hat.mirage',n_map:'map.peak',n_spark:'spark',magnifier:'magnifier',c_note1:'page.mask',c_vesper_page:'page',f3_wolf_hat:'hat.wolf',f3_scarf:'scarf.long',
  f3_eggshell:'egg',f3_plume:'feather.plume',m4_basket:'basket.knit',m4_sweater:'sweater.small',n5_lantern:'paperlantern',n5_goathorns:'horn.sock',n5_song:'page.music',
  n5_tea_note:'letter',n5_moth_biscuit:'biscuit.moth'};
for(let i=1;i<=6;i++) ICO_ID['c_page'+i]='page.log';
for(let i=1;i<=3;i++) ICO_ID['f_verse'+i]='page.music';
// hats people wear (G.hats keys): 'hat:<key>'
const ICO_HAT={party:'hat.party',wizard:'hat.wizard',crown:'hat.crown',top:'hat.top',feather:'hat.feather','Sky Feather':'hat.sky'};
const ICO_RX=[[/lantern.?bun|\bbuns?\b/,'bun'],[/ember.?pepper/,'pepper'],[/pebble/,'crowfeather'],[/taffy/,'taffy'],[/thunder.?drop/,'thunder'],[/hearth.?stone/,'hearth'],
  [/snowball|snowgob/,'snowball'],[/pudding/,'pudding'],[/cocoa|tea\b|mug/,'mug'],[/biscuit|cookie/,'biscuit'],[/\bjar\b|bubble/,'jar'],
  [/\bhats?\b|\bcap\b|helmet/,'hat'],[/crown/,'hat.crown'],[/letter|note|invitation|envelope|postcard/,'letter'],[/star.?chart|star.?map/,'map.star'],[/\bmaps?\b|chart/,'map'],
  [/\bkey\b/,'key'],[/song|verse|music|sheet/,'page.music'],[/page|logbook|notebook/,'page'],[/recipe|scroll|plans/,'scroll'],[/\bbook\b|diary/,'book'],
  [/badge|medal|pass\b/,'badge'],[/shard|crystal/,'shard'],[/\bheart\b/,'heart'],[/star.?iron|\bore\b|starfrost/,'ore'],[/fish/,'fish'],[/sandwich/,'sandwich'],
  [/honey/,'honey'],[/cheese/,'cheese'],[/yarn|wool/,'yarn'],[/scarf/,'scarf'],[/sweater|jumper/,'sweater'],[/sock/,'sock'],[/feather|plume/,'feather'],
  [/\bpick\b/,'pick'],[/hammer/,'hammer'],[/horn/,'horn'],[/lure/,'lure'],[/kettle/,'kettle'],[/soup|chowder|stew|\bpot\b/,'pot'],[/basket/,'basket'],
  [/carrot|parsnip|turnip/,'carrot'],[/lily|flower|blossom|rose/,'flower'],[/berry|berries/,'berry'],[/pearl/,'pearl'],[/earmuff/,'earmuffs'],[/bucket|pail/,'bucket'],
  [/\beggs?\b|eggshell/,'egg'],[/stone|pebble|rock/,'stone'],[/locket|necklace/,'locket'],[/music.?box/,'musicbox'],[/clock|watch/,'clock'],[/spring/,'gear.spring'],[/gear|cog/,'gear'],
  [/\boil\b|potion|bottle|flask/,'oil'],[/bomb|powder/,'bomb'],[/chain/,'rope.chain'],[/\brope\b/,'rope'],[/mantle|cloak|cape/,'cloak'],[/treat|bone/,'treat'],
  [/purse|pouch|coin/,'purse'],[/\bmoon\b/,'moon'],[/spark|ember|flame/,'spark'],[/\bpie\b|\bcake\b|\btart\b/,'pie'],[/\bsack\b/,'sack'],[/\bcrate\b/,'crate'],[/sled/,'sled'],
  [/lantern|lamp/,'lantern'],[/rod\b/,'rod'],[/magnif|lens/,'magnifier']];
function icoArtOf(id){
  id=String(id||'');
  if(id.startsWith('hat:')){ const k=id.slice(4); return ICO_HAT[k]||'hat.'+(/feather/i.test(k)?'feather':/crown/i.test(k)?'crown':'cap'); }
  if(ICO_ART[id.split('.')[0]]&&!ICO_ID[id]&&!(typeof ITEM_NAMES!=='undefined'&&ITEM_NAMES[id])) return id;   // an art name already
  if(ICO_ID[id]) return ICO_ID[id];
  const d=ITM.def(id), ic=d&&d.icon;
  if(typeof ic==='string'&&ICO_ART[ic.split('.')[0]]) return ic;
  const s=(id+' '+(d&&d.name||'')+' '+((typeof ITEM_NAMES!=='undefined'&&ITEM_NAMES[id])||'')).toLowerCase();
  for(const [rx,a] of ICO_RX) if(rx.test(s)) return a;
  const k=d&&d.kind; return k==='keep'?'gem':'parcel';
}

// ================= blessings
let upChoices=null, upCb=null;
function offerUpgrades(cb,title,sub){
  scene='upgrade'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null;
  $('#upTitle').textContent=simplify(title||'Choose a Blessing'); $('#upSub').textContent=simplify(sub||'The fire in your blood grows stronger. Pick one.');
  const pool=UPGRADES.filter(u=>!(u.once&&player.ups[u.id]));
  upChoices=shuffle(pool.slice()).slice(0,3); upCb=cb;
  const wrap=$('#cards'); wrap.innerHTML='';
  upChoices.forEach((u,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='card';
    const lv=player.ups[u.id]||0;
    b.innerHTML=`<span class="k">${i+1}</span><span class="ico" aria-hidden="true">${u.icon}</span><span class="txt"><span class="nm">${simplify(u.name)}</span><span class="ds">${simplify(u.desc)}</span>${lv?`<span class="lv">Level ${lv+1}</span>`:''}</span>`;
    b.addEventListener('click',()=>chooseUpgrade(i)); wrap.appendChild(b);
  });
  show('upgrade');
}
function chooseUpgrade(i){
  if(scene!=='upgrade'||!upChoices||!upChoices[i]) return;
  const u=upChoices[i]; u.apply(player); player.ups[u.id]=(player.ups[u.id]||0)+1;
  SFX.play('upgrade'); upChoices=null; const cb=upCb; upCb=null;
  scene='play'; hideAll(); setBanner(u.name,'Blessing gained',1.6);
  if(G.mode==='story') saveGame();
  if(cb) cb();
}

// ================= world map
let mapSel=null;
const mapCv=$('#mapcv'), mapG=mapCv.getContext('2d');
const fogCv=mkCanvas(FOG.w,FOG.h), fogG=fogCv.getContext('2d');
function openMap(){
  if(!G||G.mode!=='story'||scene!=='play') return;
  scene='map'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null;
  mapSel=null; $('#bTravel').hidden=true; mapHintSet();
  MAPUI.view=AREA&&AREA.rooms?-1:curMap(); mapTabsSync(); $('#mapInfo').textContent=mapInfoText();
  mapZoomStart();   // (v12) opens zoomed on Ash (e1_maps.js)
  drawMapScreen(); renderJournal(); show('mapov');
  try{ if(mapZSize()){ mapZoomStart(); drawMapScreen(); } }catch(e){}   // (v12) the canvas fills the frame once it is laid out
}
const SO_FAR={wake:'It is Lantern Day in Emberhollow. Mom has something for you at the forge.',lanterns:'Mom reforged Grandmother’s sword for you. Now the festival lanterns need lighting.',raid:'Kobolds crashed the festival. Drive them out of the village.',
  lore:'Emberhollow is safe for now. Elder Yara has something important to tell you.',hollow:'Yara told you the truth. Vorlaxis, the dragon sealed under Cinder Mountain, is your great ×13 grandfather, and only Emberblood fire can keep his Wards burning.',
  warcamp:'Warden Iska says a cult called the Scaled Oath is snuffing the Wards. Their kobolds answer to Grizzlefang.',wren:'Grizzlefang is beaten, but Vorlaxis spoke to you through the fire. Sister Wren in Brindlecross knows where the Wards are.',
  oath:'The Scaled Oath holds the Ash Ward. High Priest Morrow is trying to put it out for good.',three:'Two Wards burn again. The Crag, Sunken and Frost Wards are still out there.',
  gate:'All five Wards burn. The Obsidian Gate will open for their fire, if you can get past its guardian.',summit:'The gate is open. Your grandfather is waiting at the Throne of Cinders.',done:'Vorlaxis is quiet at last. Lantern Day will never be the same.'};
function renderJournal(){
  const el=$('#journal'); if(!el) return;
  const o=questObjective(), n=activeQuests().length;
  el.innerHTML=`<div class="jh">${escapeHtml(stageLabel())}</div>${o?`<div class="jq">◆ ${escapeHtml(o.text)}</div>`:''}<p style="margin-top:6px">${n?`${n} side quest${n>1?'s':''} on the go. Blue diamonds on the map show where they lead.`:'No side quests yet. Look for a gold ! over people’s heads.'} Open the Journal to choose which ones to follow.</p>`;
}
// ---------- journal
let jTab='quests', jHint=false;
function openJournal(){
  if(!G||G.mode!=='story'||scene!=='play') return;
  scene='journal'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null; SFX.play('ui');
  renderJour(); show('jour');
}
function closeJournal(){ if(scene!=='journal') return; scene='play'; hideAll(); SFX.play('ui'); }
function giverLine(d){ const g=d.giver; if(!g) return ''; const w=personWhere(g); return `From ${personName(g)}${w?', '+w:''}`; }
function renderJour(){
  for(const b of document.querySelectorAll('#jTabs button')) b.setAttribute('aria-pressed',String(b.dataset.t===jTab));
  const el=$('#jBody'), rows=[], E=t=>escapeHtml(simplify(t));
  if(jTab==='quests'){
    const o=questObjectiveWorld(), sf=!G.focus;
    rows.push(`<div class="jq${sf?' foc':''}"><div class="qt">${sf?'◆ ':''}${E(CHAPTER[G.stage]||'The story')}<small>${E(G.done?'Main story':actLabel(G.act)+' · Main story')}</small></div><div class="qs">${E(o?o.text:'')}</div>${jHint?`<div class="qs" style="color:#ffd9a0">${E(personName('yara'))}: ${E(hintLine())}</div>`:''}<div class="row">${sf?'<button class="btn c sm" disabled>Following</button>':'<button class="btn c sm hot" data-f="">Follow</button>'}<button class="btn c sm" data-hint="1">${jHint?'Hide hint':'Hint'}</button></div></div>`);
    const act=activeQuests(), side=act.filter(id=>!QDEFS[id].errand), err=act.filter(id=>QDEFS[id].errand);
    const card=id=>{ const d=QDEFS[id], f=G.focus===id, t=isTracked(id);
      return `<div class="jq${f?' foc':''}"><div class="qt">${f?'◆ ':''}${E(d.title.replace('Errand: ',''))}<small>${E(giverLine(d))}</small></div><div class="qs">${E(stepText(id))}</div><div class="row">${f?'<button class="btn c sm" disabled>Following</button>':`<button class="btn c sm hot" data-f="${id}">Follow</button>`}<button class="btn c sm" data-t="${id}">${t?'Hide from screen':'Show on screen'}</button></div></div>`; };
    rows.push(`<div class="jh2">Side quests (${side.length})</div>`);
    rows.push(side.length?side.map(card).join(''):'<p>Look for people with a gold <b style="color:#ffcf4a">!</b> over their heads. Some of them are inside their houses.</p>');
    if(err.length){ rows.push(`<div class="jh2">Errands (${err.length})</div>`); rows.push(err.map(card).join('')); }
    rows.push(`<p style="margin-top:8px">Up to ${TRACK_MAX} quests show on screen. The one you follow gets the gold diamond on the compass and minimap. ${usingTouch?'Tap the quest list on screen to open this journal.':padActive()?`Press ${padChip(PB.RT)} to switch which quest you follow. ${btnHTML('journal')} opens the journal.`:'Press T to switch which quest you follow, I to open the journal.'}</p>`);
    const done=Object.keys(G.quests).filter(id=>G.quests[id].done&&QDEFS[id]);
    if(done.length) rows.push(`<div class="jh2">Done (${done.length})</div><p>${E(done.map(id=>QDEFS[id].title.replace('Errand: ','')).join(' · '))}</p>`);
  }else if(jTab==='story'){
    { const A=ACTS[G.act]; rows.push(`<div class="jh2">${E(G.done?'The End':actLabel(G.act)+(A&&A.name?': '+A.name:''))}</div><p><b style="color:var(--ink)">${E(CHAPTER[G.stage]||'')}</b><br>${E(soFarText(G.stage))}</p>`); }
    const c=G.choices, ch=[];
    if(c.morrow) ch.push(c.morrow==='free'?'You let High Priest Morrow go home.':'You took High Priest Morrow to the Watch House.');
    if(c.fennick) ch.push(c.fennick==='forgive'?'You forgave Fennick Wick.':'You turned Fennick Wick in to Captain Osric.');
    if(c.greymane) ch.push(c.greymane==='home'?'You sent Greymane home to his pack.':'Greymane promised to stand with you.');
    if(c.cinder) ch.push(c.cinder==='rest'?'Sir Cindervane finally rests.':'Sir Cindervane will hold the stairs for you.');
    for(const k in (G.choices.extra||{})) ch.push(G.choices.extra[k]);
    if(ch.length) rows.push(`<div class="jh2">Choices you made</div><ul>${ch.map(t=>`<li>${E(t)}</li>`).join('')}</ul>`);
    // (v12) the pages Ash has found, by title, with no count: "Old pages" until Yara has told him whose they are
    const pk=Object.keys(G.pages||{}).filter(k=>PAGES[k]);
    if(pk.length) rows.push(`<div class="jh2">${reached('hollow')?'The Wardens’ Account':'Old pages'}</div>`+pk.sort((a,b)=>+a.slice(1)-+b.slice(1)).map(k=>`<p><b style="color:var(--ink)">${E(PAGES[k].title)}</b><br>${E(PAGES[k].text.join(' '))}</p>`).join(''));
  }else if(jTab==='people'){
    const met=CAST.filter(c=>!c.generic&&(G.seenTalk&&G.seenTalk['met_'+c.id]));
    rows.push(`<p>People you've talked to: ${met.length}. Hearts show how good friends you are. Help people, chat, and bring gifts they like.</p>`);
    rows.push('<div class="ppl">'+met.map(c=>{ const f=friendOf(c.id), h='♥'.repeat(Math.floor(f))+'♡'.repeat(5-Math.floor(f)); const T=TALK[c.id]||{}; return `<div><b>${E(c.name.replace(', your mom',''))}</b> <span class="hz">${h}</span><small>${E(TOWN_NAME[c.town]||'')}${T.bio?' · '+E(T.bio):''}</small></div>`; }).join('')+'</div>');
  }else if(jTab==='bag'){
    rows.push(bagHtml(E));   // (v12) the bag screen, below renderJour
  }else if(jTab==='secrets'){
    // (v12) Finds: only what Ash has found, as a count with no total (nothing tells him how much is still hidden)
    const fd=secretTally().filter(r=>(r[1]|0)>0);
    rows.push(fd.length?`<p>${E(S('Things you have found so far.','Things you found.'))}</p><ul>`+fd.map(([n,a])=>`<li><b style="color:var(--ink)">${E(n)}</b>: ${a|0}</li>`).join('')+'</ul>':`<p>${E(S('Nothing yet. Keep your eyes open.','Nothing yet. Keep looking!'))}</p>`);
  }else if(jTab==='hero') rows.push(heroTabHtml());
  else if(jTab==='log') rows.push(logJourHtml());
  el.innerHTML=rows.join('');
  if(jTab==='hero') heroTabWire(el);
  if(jTab==='log') logJourWire(el);
  if(jTab==='bag') bagWire(el);
  for(const b of el.querySelectorAll('button[data-hint]')) b.addEventListener('click',()=>{ jHint=!jHint; SFX.play('ui'); renderJour(); });
  for(const b of el.querySelectorAll('button[data-f]')) b.addEventListener('click',()=>{ followQuest(b.dataset.f||null); SFX.play('ui'); renderJour(); });
  for(const b of el.querySelectorAll('button[data-t]')) b.addEventListener('click',()=>{ toggleTrack(b.dataset.t); SFX.play('ui'); renderJour(); });
}
// ---------- the Satchel tab: a real bag. Five groups with 40 px icons; things to use have their count, one line of what
// they do, a Use button (greyed, with the reason, when it would not work now) and a star that puts them in the quick
// slot. Hats have Wear. With a controller the focus ring moves over the buttons: A picks, X or Y stars (padMenu).
const BAG_GROUPS=[['use','To use'],['auto','Works by itself'],['tool','Tools'],['quest','For quests'],['keep','Keepsakes']];
const BAG_HATN={feather:'Feathered Hat'};
const BAG_STAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.75 5.8 6.35.75-4.7 4.4 1.25 6.3L12 16.9l-5.65 3.15 1.25-6.3-4.7-4.4 6.35-.75z"/></svg>';
function bagHatName(k){ const h=typeof HATS!=='undefined'&&HATS.find(x=>x[0]===k); if(h) return h[1]; if(typeof EVHATN!=='undefined'&&EVHATN[k]) return EVHATN[k]; return BAG_HATN[k]||String(k).replace(/^./,c=>c.toUpperCase()); }
function bagSplit(n){ const m=/^(.*?)\s*\(([^)]*)\)\s*$/.exec(String(n||'')); return m&&m[1]?[m[1],m[2].replace(/^./,c=>c.toUpperCase())]:[String(n||''),'']; }
// the side quest that asks for this item right now (its step takes it), if there is one
function bagNeed(id){
  for(const q in G.quests||{}){ if(G.quests[q].done||!QDEFS[q]) continue; let st=null; try{ st=stepOf(q); }catch(e){}
    if(st&&st.take&&st.take[id]) return QDEFS[q].title.replace('Errand: ',''); }
  return '';
}
function bagInfo(id){ let i=null; try{ i=ITM.info(id); }catch(e){} return Object.assign({id,name:ITEM_NAMES[id]||id,kind:'quest',desc:'',count:ITM.count(id),cap:0},i||{}); }
// how to use the quick slot on the device in hand
function bagQuickHow(){
  const dev=curDevice();
  if(dev==='pad') return `${padChip(PB.LF)} ${escapeHtml(simplify('uses it.'))}`;
  if(dev==='touch') return escapeHtml(simplify(S('Tap it under the ROAR ring to use it.','Tap it under ROAR to use it.')));
  return `${escapeHtml(simplify('Press'))} <kbd class="pg k">${escapeHtml(actKey('item'))}</kbd> ${escapeHtml(simplify('to use it.'))}`;
}
const bagIco=(id,s)=>`<canvas class="bico" data-icon="${escapeHtml(id)}" data-s="${s||40}" width="${s||40}" height="${s||40}" aria-hidden="true"></canvas>`;
function bagHtml(E){
  const out=[], q=ITM.quick(), ids=Object.keys(G.items||{}).filter(k=>G.items[k]>0), infos=ids.map(bagInfo);
  const hats=Object.keys(G.hats||{}).filter(k=>G.hats[k]);
  // coins and the quick slot
  const qi=q?bagInfo(q):null;
  out.push(`<div class="bagtop"><span class="bagcoin"><i aria-hidden="true"></i>${G.coins||0} coins</span><span class="bagq">${qi?`${bagIco(q,28)}<span>${E('Quick slot')}: <b>${E(bagSplit(qi.name)[0])}</b>${qi.count>0?` ×${qi.count}. ${bagQuickHow()}`:` (${E('none left')})`}</span>`:`<span class="bqe" aria-hidden="true">${BAG_STAR}</span><span>${curDevice()==='pad'?`${E('Quick slot: empty. Press')} ${padChip(PB.W)} ${E('on something to use, and it waits there, ready.')}`:E(S('Quick slot: empty. Press the star on something to use, and it waits there, ready.','Quick slot: empty. Press a star to put something there.'))}</span>`}</span></div>`);
  if(!infos.length&&!hats.length) out.push(`<p>${E(S('Nothing in your satchel yet. Chests, shops and the people you help all give you things.','Nothing here yet. Open chests and help people to get things.'))}</p>`);
  const kindOf=i=>BAG_GROUPS.some(g=>g[0]===i.kind)?i.kind:'quest';
  for(const [k,label] of BAG_GROUPS){
    const L=infos.filter(i=>kindOf(i)===k), H=k==='keep'?hats:[];
    if(!L.length&&!H.length) continue;
    out.push(`<div class="jh2">${E(label)}</div>`);
    if(k==='use'){
      // in the registry's order (the order they turn up in the acts), not the order they were picked up
      const ord=typeof ITEMDEF!=='undefined'&&ITEMDEF?Object.keys(ITEMDEF):Object.keys(ITM_STUB), at=id=>{ const n=ord.indexOf(id); return n<0?999:n; };
      L.sort((a,b)=>at(a.id)-at(b.id));
      out.push('<div class="bag">'+L.map(i=>{
        const can=ITM.can(i.id), ok=can===true, why=ok?'':simplify(typeof can==='string'?can:'Not right now'), star=q===i.id, [nm]=bagSplit(i.name);
        return `<div class="bi" data-item="${escapeHtml(i.id)}">${bagIco(i.id)}<div class="bt"><b>${E(nm)}</b><span class="bn">${i.count}${i.cap?` ${E('of')} ${i.cap}`:''}</span>${i.desc?`<small>${E(i.desc)}</small>`:''}${ok?'':`<small class="why">${escapeHtml(why)}</small>`}</div>`
          +`<div class="bb"><button type="button" class="btn c sm ${ok?'hot':'off'}" data-use="${escapeHtml(i.id)}" aria-disabled="${!ok}"${ok?'':` title="${escapeHtml(why)}"`}>Use</button>`
          +`<button type="button" class="btn c sm bstar${star?' on':''}" data-star="${escapeHtml(i.id)}" aria-pressed="${star}" aria-label="${star?'In your quick slot':'Put it in your quick slot'}" title="${star?'In your quick slot':'Put it in your quick slot'}">${BAG_STAR}</button></div></div>`;
      }).join('')+'</div>');
    }else if(k==='auto'||k==='tool'){
      out.push('<div class="bag">'+L.map(i=>{ const [nm,note]=bagSplit(i.name), d=i.desc||note;
        return `<div class="bi" data-item="${escapeHtml(i.id)}">${bagIco(i.id)}<div class="bt"><b>${E(nm)}</b>${i.count>1?`<span class="bn">×${i.count}</span>`:''}${d?`<small>${E(d)}</small>`:''}</div></div>`; }).join('')+'</div>');
    }else{
      // quest things and keepsakes: small tiles (the name's bracket part, and the quest that wants it now, as notes)
      if(L.length) out.push('<div class="bgrid">'+L.map(i=>{ const [nm,note]=bagSplit(i.name), need=k==='quest'?bagNeed(i.id):'';
        return `<div class="bi tile" data-item="${escapeHtml(i.id)}">${bagIco(i.id)}<div class="bt"><b>${E(nm)}</b>${i.count>1?`<span class="bn">×${i.count}</span>`:''}${note?`<small>${E(note)}</small>`:''}${need?`<small class="for">${E('For')}: ${E(need)}</small>`:''}</div></div>`; }).join('')+'</div>');
      // hats Ash can wear (G.hats): Wear, or Take off for the one on his head
      if(H.length) out.push('<div class="bgrid hats">'+H.map(h=>{ const on=G.hat===h;
          return `<div class="bi tile hat${on?' on':''}" data-item="hat:${escapeHtml(h)}">${bagIco('hat:'+h)}<div class="bt"><b>${E(bagHatName(h))}</b>${on?`<small>${E('You are wearing it.')}</small>`:''}</div><div class="bb"><button type="button" class="btn c sm${on?'':' hot'}" data-wear="${escapeHtml(h)}">${on?'Take off':'Wear'}</button></div></div>`; }).join('')+'</div>');
    }
  }
  out.push(`<div class="jh2">Blade</div><p>Tier ${G.tier+1}. Bring star-iron to Mom at the forge to sharpen it.</p>`);
  return out.join('');
}
function bagPaint(c){
  const s=+c.dataset.s||40, d=Math.min(3,Math.max(1,window.devicePixelRatio||1));
  c.width=Math.round(s*d); c.height=Math.round(s*d); c.style.width=c.style.height=s+'px';
  const g=c.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,s,s); drawItemIcon(g,c.dataset.icon,s/2,s/2,s);
}
function bagWire(el){
  for(const c of el.querySelectorAll('canvas.bico')) bagPaint(c);
  for(const b of el.querySelectorAll('button[data-use]')) b.addEventListener('click',()=>bagUse(b.dataset.use,b));
  for(const b of el.querySelectorAll('button[data-star]')) b.addEventListener('click',()=>bagStar(b.dataset.star));
  for(const b of el.querySelectorAll('button[data-wear]')) b.addEventListener('click',()=>bagWear(b.dataset.wear));
}
// Use: a thing that would not work now says why (and the row gives a little shake); otherwise the journal closes and
// Ash uses it right away, so you see it happen
function bagUse(id,btn){
  const r=ITM.can(id);
  if(r!==true){ try{ SFX.play('warn',0.5); }catch(e){} const row=btn&&btn.closest('.bi'); if(row){ row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); } return false; }
  closeJournal();
  return !!ITM.use(id);
}
// the star: this item into the quick slot (pressing it again empties the slot); the focus stays on the same button
function bagStar(id,refocus){
  ITM.setQuick(ITM.quick()===id?null:id); SFX.play('ui'); renderJour();
  if(refocus){ const b=$('#jBody').querySelector(`[data-item="${CSS.escape(id)}"] button[data-${refocus}]`); if(b) navFocus(b); }
}
function bagWear(k){ G.hat=G.hat===k?null:k; try{ saveGame(); }catch(e){} SFX.play('ui'); renderJour(); }
// controller X or Y on the Satchel: star the item the focus ring is on
function bagPadStar(){
  if(jTab!=='bag') return false;
  const a=document.activeElement, row=a&&a.closest&&a.closest('#jBody [data-item]'); if(!row||!row.querySelector('button[data-star]')) return false;
  bagStar(row.dataset.item,a.dataset.use!=null?'use':'star'); return true;
}
function closeMap(silent){ if(scene!=='map') return; scene='play'; hideAll(); if(!silent) SFX.play('ui'); }
function mapXY(x,y){ const F=mapFit(MAPUI.view); return [F.ox+x*F.s,F.oy+(y-F.y0)*F.s]; }
function drawMapScreen(){
  try{ mapZUI(); }catch(e){}   // (v12) the zoom buttons hide on the dungeon page
  if(MAPUI.view===-1){ if(AREA&&AREA.rooms&&typeof dunMapDraw==='function'){ dunMapDraw(mapG,mapCv.width,mapCv.height); try{ mapLegSync(); }catch(e){} return; } MAPUI.view=curMap(); }   // the dungeon page
  const g=mapG, w=mapCv.width, h=mapCv.height, V=MAPUI.view, MF=mapFit(V), O=ovOf(V), FG=fogOf(V), on=o=>itemMap(o)===V;
  // (v12) the canvas fills the map frame now: around the whole map it is the frame's own colour, as it was
  g.setTransform(1,0,0,1,0,0); g.fillStyle=LOOK.sb?'#e9d6ac':'#0e0a08'; g.fillRect(0,0,w,h);
  // (v12) the ground, sharp at any zoom, and the fog with a smooth edge (e1_maps.js mapHdGround)
  try{ mapHdGround(g,V,MF); }catch(e){ console.error(e); mapOldFog(g,V,MF,true); }
  const seen=(x,y)=>fogSeen(V,x,y), leg=mapLeg;
  g.textAlign='center'; g.textBaseline='middle';
  if(V===0){ g.strokeStyle='rgba(30,26,36,.9)'; g.lineWidth=6; const [, wy]=mapXY(0,WALL_Y); g.beginPath(); g.moveTo(Math.max(0,MF.ox),wy); g.lineTo(Math.min(w,MF.ox+MF.w),wy); g.stroke(); }
  for(const k in POI){ const p=POI[k]; if(!on(p)||!seen(p.x,p.y)) continue; const [x,y]=mapXY(p.x,p.y); g.font='700 21px Cinzel, Georgia, serif'; g.lineWidth=5; g.strokeStyle='rgba(0,0,0,.75)'; g.strokeText(p.name,x,y-22); g.fillStyle='#f2e2c4'; g.fillText(p.name,x,y-22); g.fillStyle='#e8d0a0'; g.beginPath(); g.arc(x,y,6,0,TAU); g.fill(); }
  for(const c of mapList(CAMPS,V)){ if(!seen(c.x,c.y)) continue; const cl=G.campsCleared[c.id]; if(cl!=null&&G.worldTime-cl<300) continue; const [x,y]=mapXY(c.x,c.y); leg('camp'); g.fillStyle='#ff6a4a'; g.beginPath(); g.moveTo(x,y-9); g.lineTo(x+8,y+6); g.lineTo(x-8,y+6); g.closePath(); g.fill(); }
  for(const s of mapList(SHRINES,V)){ const found=G.shrines[s.id]; if(!found&&!seen(s.x,s.y)) continue; const [x,y]=mapXY(s.x,s.y); leg(found?'shrine':'shrine0'); g.fillStyle=found?'#7fd0ff':'#6b6f7a'; g.strokeStyle=mapSel===s?'#fff':'#0a0a0a'; g.lineWidth=mapSel===s?4:2; g.beginPath(); g.arc(x,y,mapSel===s?13:9,0,TAU); g.fill(); g.stroke(); }
  for(const o of objectiveList()){ if(o.x==null||!on(o)) continue; const [x,y]=mapXY(o.x,o.y); leg('quest'); g.save(); g.translate(x,y); g.rotate(Math.PI/4); g.fillStyle='#ffb547'; g.strokeStyle='#2a1606'; g.lineWidth=3; g.fillRect(-11,-11,22,22); g.strokeRect(-11,-11,22,22); g.restore(); }
  for(const q of questTargets()){ if(!on(q)) continue; const [x,y]=mapXY(q.x,q.y); leg('side'); g.save(); g.translate(x,y); g.rotate(Math.PI/4); g.fillStyle='#7fe0ff'; g.strokeStyle='#08303a'; g.lineWidth=3; g.fillRect(-8,-8,16,16); g.strokeRect(-8,-8,16,16); g.restore(); }
  const jm=!!G.items.juniper_map;
  for(const m of mapList(CAVEMOUTHS,V)){ if(!jm&&!seen(m.x,m.y)) continue; const [x,y]=mapXY(m.x,m.y); g.fillStyle='#120c08'; g.strokeStyle='#e8d0a0'; g.lineWidth=2.5; g.beginPath(); g.arc(x,y,10,Math.PI,TAU); g.lineTo(x+10,y+6); g.lineTo(x-10,y+6); g.closePath(); g.fill(); g.stroke(); if(G.found['seen_'+m.area]||jm){ g.font='600 15px Rubik, system-ui, sans-serif'; g.lineWidth=4; g.strokeStyle='rgba(0,0,0,.75)'; g.strokeText(m.name,x,y+22); g.fillStyle='#e8d8c0'; g.fillText(m.name,x,y+22); } }
  for(const o of mapList(LANDMARKS,V)){ if(o.k==='pot'||o.k==='crossing'||o.k==='barrel'||o.k==='fishspot'||o.k==='sign'||o.k==='frostberry'||o.k==='beehive'||(o.hidden&&o.hidden())) continue; if(!jm&&!seen(o.x,o.y)) continue; const [x,y]=mapXY(o.x,o.y); g.fillStyle=o.k==='xmark'?'#ff5a3a':'#d8c8f0'; g.beginPath(); g.arc(x,y,o.k==='xmark'?7:4.5,0,TAU); g.fill(); }
  for(const c of crossingsOn(V)){ if((c.hidden&&c.hidden())||!seen(c.x,c.y)) continue; const [x,y]=mapXY(c.x,c.y); g.fillStyle='#ffd27a'; g.strokeStyle='#2a1606'; g.lineWidth=2.5; g.beginPath(); g.moveTo(x-8,y-6); g.lineTo(x+6,y-6); g.lineTo(x+11,y-1); g.lineTo(x+6,y+4); g.lineTo(x-8,y+4); g.closePath(); g.fill(); g.stroke(); g.font='600 15px Rubik, system-ui, sans-serif'; g.lineWidth=4; g.strokeStyle='rgba(0,0,0,.75)'; const nm=simplify(c.name||c.label||''); g.strokeText(nm,x,y+20); g.fillStyle='#ffe2a8'; g.fillText(nm,x,y+20); }
  if(G.flags.chart) for(const o of mapList(ORES,V)){ if(G.ores[o.id]) continue; const [x,y]=mapXY(o.x,o.y); g.fillStyle='#7ab8ff'; g.beginPath(); g.moveTo(x,y-9); g.lineTo(x+7,y); g.lineTo(x,y+9); g.lineTo(x-7,y); g.closePath(); g.fill(); }
  // (v12) the Wards are marked once Yara has told Ash what they are (before that they are only old warm stones)
  if(reached('hollow')) for(const id in WARDS){ if(!on(WARDS[id])||!seen(WARDS[id].x,WARDS[id].y)) continue; const [x,y]=mapXY(WARDS[id].x,WARDS[id].y); leg(G.wards[id]?'ward1':'ward0'); g.fillStyle=G.wards[id]?'#ffcf6a':'#7a8aa8'; g.strokeStyle='#1a1008'; g.lineWidth=2; g.beginPath(); for(let i=0;i<6;i++){ const a=i/6*TAU+Math.PI/6; i?g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9):g.moveTo(x+Math.cos(a)*9,y+Math.sin(a)*9); } g.closePath(); g.fill(); g.stroke(); }
  const pp=AREA&&G.ow?G.ow:player; if(curMap()===V){ const [px,py]=mapXY(pp.x,pp.y); g.save(); g.translate(px,py); g.rotate(player.facing); g.fillStyle='#ffd27a'; g.strokeStyle='#2a1606'; g.lineWidth=3; g.beginPath(); g.moveTo(17,0); g.lineTo(-11,-11); g.lineTo(-5,0); g.lineTo(-11,11); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  g.font='600 20px Rubik, system-ui, sans-serif'; g.fillStyle='rgba(240,225,200,.7)'; g.textAlign='left'; g.fillText('N ↑',16,22);
  try{ mapLegSync(); }catch(e){}
}
mapCv.addEventListener('click',e=>{
  if(scene!=='map') return;
  const r=mapCv.getBoundingClientRect(), [x,y]=mapInv((e.clientX-r.left)/r.width*mapCv.width,(e.clientY-r.top)/r.height*mapCv.height);
  let best=null,bd=420*420; for(const s of mapList(SHRINES,MAPUI.view)){ if(!G.shrines[s.id]) continue; const d=dist2(x,y,s.x,s.y); if(d<bd){bd=d;best=s;} }
  mapSelect(best);
});
function mapHintSet(){ const h=$('#mapHint'); if(padActive()) h.innerHTML=`Press ${padChip(PB.L1)} or ${padChip(PB.R1)} to pick a shrine you have found, then travel there. ${padChip(PB.R2)} and ${padChip(PB.L2)} zoom, the right stick moves the map.`; else h.textContent=usingTouch?'Pinch or tap + and − to zoom, drag to look around. Tap a blue shrine you have found to fast travel there.':'Scroll or press + and − to zoom, drag to look around. Click a blue shrine you have found to fast travel there.'; }
function mapSelect(best){
  mapSel=best; const bt=$('#bTravel');
  if(best) try{ mapZShow(best.x,best.y); }catch(e){}   // (v12) zoomed in: bring a picked shrine into view
  if(best){ if(G.inCombat||(G.boss&&!G.boss.dead)){ bt.hidden=true; $('#mapHint').textContent='You can’t fast travel while enemies are close.'; } else { bt.hidden=false; bt.textContent=`Travel to ${best.name}`; $('#mapHint').textContent=best.name; } }
  else{ bt.hidden=true; mapHintSet(); }
  drawMapScreen();
}
// controller and keyboard ([ and ]): step through the shrines you have found, west to east
function mapCycle(d){
  if(scene!=='map') return;
  const list=mapList(SHRINES,MAPUI.view).filter(s=>G.shrines[s.id]).sort((a,b)=>a.x-b.x); if(!list.length) return;
  let i=list.indexOf(mapSel);
  if(i<0){ const pp=AREA&&G.ow?G.ow:player; let bd=1e18; list.forEach((s,k)=>{ const q=dist2(s.x,s.y,pp.x,pp.y); if(q<bd){ bd=q; i=k; } }); }
  else i=(i+d+list.length)%list.length;
  mapSelect(list[i]); SFX.play('ui');
  const bt=$('#bTravel'); if(!bt.hidden) navFocus(bt);
}
$('#bTravel').addEventListener('click',()=>{ if(mapSel) travelTo(mapSel); });
$('#bMapClose').addEventListener('click',()=>closeMap());

// ================= menu
function setupMenuScene(){
  newRun('menu'); clearStatic(); fogInit('');
  G.tod=0.27; player.x=POI.village.x+60; player.y=POI.village.y+140; player.facing=-Math.PI/2;
  G.npcs=[{kind:'yara',x:POI.village.x+100,y:POI.village.y+90,face:Math.PI,t:0,home:[0,0]}];
  for(const L of LANTERNS) L.lit=true;
  menuCam(0,true); G.chunkBurst=6;
}
function menuCam(dt,snap){
  const tx=POI.village.x-W/zoom/2+Math.sin((G?G.time:0)*0.08)*120, ty=POI.village.y-H/zoom/2+60+Math.cos((G?G.time:0)*0.06)*60;
  if(snap){ cam.x=tx; cam.y=ty; } else { cam.x=lerp(cam.x,tx,1-Math.exp(-dt*1.5)); cam.y=lerp(cam.y,ty,1-Math.exp(-dt*1.5)); }
}
// (v12 TITLE) the title paints its own picture (v10_art_title.js); the world behind it only runs when that is off
function menuUpdate(dt){
  G.time+=dt; player.t+=dt;
  if(!ttlOn()){ G.chunkBurst=2; ambientEmit(dt); updateParticles(dt); menuCam(dt); }
  if(Math.random()<dt*0.4) SFX.play('bird',0.6);
}
function refreshMenu(){
  const li=latestSlot(), s=li>=0?slotSave(li):null, cont=$('#bContinue'), sum=saveSummary(s);
  if(sum){ cont.hidden=false; $('#contSub').textContent=`Journey ${li+1} · ${sum}`; $('#bStory').classList.remove('hot'); $('#storySub').textContent='Pick a journey: three save slots.'; }
  else{ cont.hidden=true; $('#bStory').classList.add('hot'); $('#storySub').textContent='An open world to explore. Three lanterns to light.'; }
  for(const b of document.querySelectorAll('.seg button[data-d]')) b.setAttribute('aria-pressed',String(+b.dataset.d===diffIdx));
  $('#diffNote').textContent=simplify(DIFFS[diffIdx].note);
  const best=store.get('eb_best_'+diffIdx,null);
  $('#bestLine').textContent=best&&best.score?simplify(`Arena best on ${DIFFS[diffIdx].name}: wave ${best.wave}, ${fmt(best.score)} points`):'';
  refreshSoundLabels(); acctLabel(); ttlSync();
}
function toMenu(){
  if(G&&G.mode==='story'&&!player.dead) saveGame(true);
  SFX.setFire(false); SFX.ambient({}); DLG=null; setupMenuScene(); scene='menu'; show('menu'); refreshMenu();
}
let howFrom='menu', howTab='keys', howKind=null;
// How to Play opens on the page for the device in use: Keyboard, Touch or Controller
function openHow(from){
  let coarse=false; try{ coarse=matchMedia('(pointer: coarse)').matches; }catch(e){}
  howFrom=from; howTab=padActive()?'pad':(usingTouch||PAD.dev==='touch'||(coarse&&PAD.dev!=='kb'))?'touch':'keys'; howKind=null; howTabs(); show('how'); renderHow();
}
function closeHow(){ show(howFrom==='pause'?'pause':'menu'); }
function howTabs(){
  for(const b of document.querySelectorAll('#howTabs button')){ const on=b.dataset.h===howTab; b.setAttribute('aria-pressed',String(on)); if(on) b.setAttribute('data-focus',''); else b.removeAttribute('data-focus'); }
  for(const s of document.querySelectorAll('#how .hsec')) s.hidden=s.dataset.h!==howTab;
}
// (v12) the controls for a power show only once Ash has it (the Arena always jumps; on the title screen, the latest
// journey's powers); nothing lists powers ahead of time
function howHas(id){
  if(G&&G.mode==='story') return hasAbil(id);
  if(G&&G.mode==='normal') return id==='jump';
  try{ const i=latestSlot(), s=i>=0?slotSave(i):null; return !!(s&&s.abil&&s.abil[id]); }catch(e){ return false; }
}
function renderHow(){
  howTabs(); if(typeof handSync==='function') handSync();
  for(const e of document.querySelectorAll('#how [data-pow]')) e.hidden=!howHas(e.dataset.pow);
  const hb=$('#how .hbody'); if(hb) hb.scrollTop=0;
  if(howTab!=='pad') return;
  const k=howKind||(PAD.idx>=0?PAD.kind:'xbox');
  for(const b of document.querySelectorAll('#howPadKind button')) b.setAttribute('aria-pressed',String(b.dataset.k===k));
  $('#howPadName').innerHTML=PAD.idx>=0?`<b>${escapeHtml(padName(PAD.id))}</b> found. Here is what every button does.`:'No controller yet. Plug one in or pair it, then press any button. PlayStation, Xbox and Nintendo Switch Pro controllers all work.';
  const cv=$('#howPadCv'); if(cv&&vis(cv)) drawPadDiagram(cv,k);
  $('#howPadKeys').innerHTML=padHelpRows(k).map(([c,t])=>`<div class="pk">${c}</div><span>${t}</span>`).join('');
}
for(const b of document.querySelectorAll('#howTabs button')) b.addEventListener('click',()=>{ howTab=b.dataset.h; SFX.play('ui'); renderHow(); });
for(const b of document.querySelectorAll('#howPadKind button')) b.addEventListener('click',()=>{ howKind=b.dataset.k; SFX.play('ui'); renderHow(); });
$('#bStory').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); openSlots(); });
let newArmed=0;
function confirmNew(){ if(Date.now()-newArmed<4000) return true; newArmed=Date.now(); $('#bStory').firstChild.textContent='Tap again to start over'; setTimeout(()=>{ if(scene==='menu') refreshMenu(); },4000); return false; }
$('#bAcct').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); openAcct(); });
$('#bContinue').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); const li=latestSlot(); if(li<0){ openSlots(); return; } setSlot(li); startStory(true); });
$('#bNormal').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); startNormal(); });
for(const b of document.querySelectorAll('.seg button[data-d]')) b.addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); diffIdx=+b.dataset.d; store.set('eb_diff',diffIdx); refreshMenu(); });
$('#bHow').addEventListener('click',()=>{ SFX.init(); openHow('menu'); });
$('#bHowClose').addEventListener('click',closeHow);
$('#bSettings').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); openSettings('menu'); });
$('#bPauseSettings').addEventListener('click',()=>{ SFX.play('ui'); openSettings('pause'); });
$('#bSettingsClose').addEventListener('click',()=>{ SFX.play('ui'); closeSettings(); });
for(const id of ['setNums','setChat','setTouch','setBtn','setAuto']) for(const b of document.querySelectorAll(`#${id} button`)) b.addEventListener('click',()=>{ SFX.init(); applySetting(id,b.dataset.v); SFX.play('ui'); });
// ---------- two more rows (UX build), injected like the depth row so body.html stays as it is:
// "Aim with the mouse" (off: Ash faces the way he walks) and "Characters" (3D toy figures or the classic flat art)
// (a3e_toy3d.js reads eb_chars at load; this flips it live)
function setChars(v){ v=v==='classic'?'classic':'3d'; T3.on=v==='3d'; store.set('eb_chars',v); uxSyncRows(); return v; }
function setMouseAim(on){ settings.mouseAim=!!on; store.set('eb_mouseaim',settings.mouseAim); if(!on&&player) player.faceGoal=player.facing; uxSyncRows(); return settings.mouseAim; }
function uxSyncRows(){
  for(const b of document.querySelectorAll('#setChars button')) b.setAttribute('aria-pressed',String(b.dataset.v===(T3.on?'3d':'classic')));
  for(const b of document.querySelectorAll('#setAim button')) b.setAttribute('aria-pressed',String(b.dataset.v===(settings.mouseAim?'on':'off')));
}
(function uxRows(){
  try{
    const panel=document.querySelector('#settings .panel'); if(!panel||$('#setChars')) return;
    const mk=(html)=>{ const r=document.createElement('div'); r.className='setrow'; r.innerHTML=html; return r; };
    const aim=mk('<span>Aim with the mouse<small>Off: Ash faces where he walks, and attacks find the foe in front. On: he faces the pointer.</small></span><div class="seg" id="setAim" role="group" aria-label="Aim with the mouse"><button type="button" data-v="on" aria-pressed="false">On</button><button type="button" data-v="off" aria-pressed="false">Off</button></div>');
    const chars=mk('<span>Characters<small>3D toy figures that turn to face every way, or the classic flat look.</small></span><div class="seg" id="setChars" role="group" aria-label="Characters"><button type="button" data-v="3d" aria-pressed="false">3D</button><button type="button" data-v="classic" aria-pressed="false">Classic</button></div>');
    // the aim row sits under Damage numbers; Characters goes just above the 3D depth row (or the end of the list)
    const nums=$('#setNums'), nr=nums&&nums.closest('.setrow');
    if(nr) nr.after(aim); else panel.prepend(aim);
    const dep=$('#setDepth'), dr=dep&&dep.closest('.setrow'), done=$('#bSettingsClose'); let ref=dr||done; while(ref&&ref.parentElement!==panel) ref=ref.parentElement;
    if(ref) panel.insertBefore(chars,ref); else panel.appendChild(chars);
    for(const b of aim.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setMouseAim(b.dataset.v==='on'); SFX.play('ui'); });
    for(const b of chars.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setChars(b.dataset.v); SFX.play('ui'); });
    uxSyncRows();
  }catch(e){}
})();
// ---------- "Handed" and "Tips" (controls build), injected the same way
// Handed: Left mirrors the touch buttons (the one-hand layout follows the hand), shows the left-handed keys and makes
// controllers southpaw. Tips: Off hides the how-to tips and the first-play help; switching them back on brings back
// any that were closed with their X.
function setHand(v){
  v=v==='left'?'left':'right'; settings.hand=v; store.set('eb_hand',v);
  if(settings.touch&&settings.touch!=='two'&&settings.touch!==v) applySetting('setTouch',v);
  handSync(); try{ padRenderSettings(); }catch(e){}
  return v;
}
function setTips(on){ const was=settings.tips; settings.tips=!!on; store.set('eb_tips',settings.tips); if(on&&!was) tipsReset(); handSync(); return settings.tips; }
function handSync(){
  for(const b of document.querySelectorAll('#setHand button,#howHand button')) b.setAttribute('aria-pressed',String(b.dataset.v===settings.hand));
  for(const b of document.querySelectorAll('#setTips button')) b.setAttribute('aria-pressed',String(b.dataset.v===(settings.tips?'on':'off')));
  const one=$('#setTouchOne'); if(one){ one.dataset.v=settings.touch&&settings.touch!=='two'?settings.touch:settings.hand; one.setAttribute('aria-pressed',String(settings.touch===one.dataset.v)); }
  for(const el of document.querySelectorAll('#how [data-hand]')) el.hidden=el.dataset.hand!==settings.hand;
}
(function handRows(){
  try{
    const panel=document.querySelector('#settings .panel'); if(!panel||$('#setHand')) return;
    const mk=(html)=>{ const r=document.createElement('div'); r.className='setrow'; r.innerHTML=html; return r; };
    const hand=mk('<span>Handed<small>Left: the touch buttons go under your left thumb, the keyboard uses the arrow keys with the mouse in your left hand, and controllers swap the sticks (southpaw).</small></span><div class="seg" id="setHand" role="group" aria-label="Handed"><button type="button" data-v="right" aria-pressed="false">Right</button><button type="button" data-v="left" aria-pressed="false">Left</button></div>');
    const tips=mk('<span>Tips<small>How-to tips and the first-play help. Each one has an X to close it. Turning tips back on brings back the ones you closed.</small></span><div class="seg" id="setTips" role="group" aria-label="Tips"><button type="button" data-v="on" aria-pressed="false">On</button><button type="button" data-v="off" aria-pressed="false">Off</button></div>');
    const tr=$('#setTouch')&&$('#setTouch').closest('.setrow'); if(tr) tr.before(hand); else panel.appendChild(hand);
    const ar=($('#setAim')||$('#setNums')); const arr=ar&&ar.closest('.setrow'); if(arr) arr.after(tips); else hand.before(tips);
    for(const b of hand.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setHand(b.dataset.v); SFX.play('ui'); });
    for(const b of tips.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setTips(b.dataset.v==='on'); SFX.play('ui'); });
    for(const b of document.querySelectorAll('#howHand button')) b.addEventListener('click',()=>{ SFX.init(); setHand(b.dataset.v); SFX.play('ui'); });
    // the settings screen redraws its rows when it opens or a row changes: keep these in step
    for(const id of ['#bSettings','#bPauseSettings']){ const b=$(id); if(b) b.addEventListener('click',()=>handSync()); }
    for(const b of document.querySelectorAll('#setTouch button')) b.addEventListener('click',()=>handSync());
    handSync();
  }catch(e){}
})();
// ---------- v11: Settings > Difficulty, Music and Sounds (the rows are in body.html; they go to the top of the list)
// Difficulty works from the pause menu in the middle of a journey (balSetDiff in e6_balance.js rescales the foes that
// are out and keeps it with the journey); during an Arena run it is locked so the leaderboard stays fair.
// The two sliders run 0 to 100 and apply while you drag: mouse, touch, the arrow keys and a controller's d-pad or stick
// (left and right on a focused slider move it 5). Moving a muted one turns that sound back on. Letting go of the Sounds
// slider plays a short sample.
const SETV={sampleT:0};
function setDiffLocked(){ return !!(G&&G.mode==='normal'&&settingsFrom==='pause'); }
function diffSync(){
  const lock=setDiffLocked();
  for(const b of document.querySelectorAll('#setDiff button')){ b.setAttribute('aria-pressed',String(+b.dataset.v===diffIdx)); b.disabled=lock; }
  const L=$('#setDiffLock'), N=$('#setDiffNote');
  if(N) N.textContent=simplify(S('Easy: gentler foes, more healing. Normal: a real fight. Hard: fast, fierce foes.','Easy: soft foes. Normal: a fair fight. Hard: tough foes.'));
  if(L){ L.hidden=!lock; L.textContent=simplify(S('Locked during an Arena run, so the leaderboard stays fair. Change it on the title screen.','Locked in the Arena. Change it on the title screen.')); }
}
function setDifficulty(i){
  if(setDiffLocked()) return diffIdx;
  i=clamp(i|0,0,2); if(i===diffIdx&&G&&G.diff===DIFFS[i]) return i;
  balSetDiff(i); diffSync();
  if(settingsFrom!=='pause') refreshMenu();
  return i;
}
function volSync(){
  const row=(id,v,muted)=>{
    const i=$('#'+id+'Vol'), o=$('#'+id+'Val'), m=$('#'+id+'Muted'); if(!i) return;
    if(+i.value!==v) i.value=v;
    i.style.setProperty('--f',String(v/100));
    if(o) o.textContent=v>0?String(v):simplify(S('Off','Off'));
    if(m){ m.hidden=!muted; m.textContent=simplify(S('Muted. Move the slider to turn it back on.','Muted. Move it to turn it on.')); }
    i.setAttribute('aria-valuetext',muted?'Muted':v>0?v+' of 100':'Off');
    const r=i.closest('.setrow'); if(r) r.classList.toggle('off',muted||v<=0);
  };
  row('setMusic',Music.level,Music.muted); row('setSfx',SFX.volume,SFX.muted);
}
function volSample(){ SETV.sampleT=0; if(SFX.silent) return; SFX.play('slash'); setTimeout(()=>SFX.play('hit'),110); }
function volInput(el,stepped){
  SFX.init();
  const v=VOL.n(el.value), music=el.id==='setMusicVol';
  if(music){ if(Music.muted&&v>0){ Music.toggle(); mLast=null; } Music.setLevel(v); }
  else { if(SFX.muted&&v>0) SFX.toggle(); SFX.setVolume(v); }
  volSync();
  // a step from the keys or a controller: the sample comes once the steps stop (the same as letting go)
  if(stepped&&!music){ clearTimeout(SETV.sampleT); SETV.sampleT=setTimeout(volSample,300); }
}
(function setTopRows(){
  try{
    const panel=document.querySelector('#settings .panel'), h=panel&&panel.querySelector('h2'); if(!panel||!h) return;
    // Difficulty first, then Music and Sounds, above the rows other modules added on top (Words)
    const rows=['setDiff','setMusicVol','setSfxVol'].map(id=>{ const el=$('#'+id); return el&&el.closest('.setrow'); }).filter(Boolean);
    let ref=h; for(const r of rows){ ref.after(r); ref=r; }
    for(const b of document.querySelectorAll('#setDiff button')) b.addEventListener('click',()=>{ SFX.init(); setDifficulty(+b.dataset.v); SFX.play('ui'); });
    for(const id of ['setMusicVol','setSfxVol']){
      const el=$('#'+id); if(!el) continue;
      el.addEventListener('input',()=>volInput(el,false));
      el.addEventListener('change',()=>{ volInput(el,false); if(id==='setSfxVol') volSample(); });
      // a tap or a drag on the slider must not scroll the panel or reach the game under it
      el.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
      // the game's key handler skips keys aimed at an input (for the name fields), so a focused slider takes its own:
      // left and right move it, up and down move to the next row like every other row, and the rest (N to mute,
      // Escape to go back) go to the game as usual
      el.addEventListener('keydown',e=>{
        const c=e.code;
        if(c==='ArrowLeft'||c==='ArrowRight'){ e.preventDefault(); e.stopPropagation(); navMove(navRoot(),c==='ArrowRight'?'r':'l'); return; }
        if(c==='ArrowUp'||c==='ArrowDown'){ e.preventDefault(); e.stopPropagation(); const r=navRoot(); if(r) navMove(r,c==='ArrowDown'?'d':'u'); return; }
        if(c==='Tab'||c==='Enter'||c==='Space') return;
        e.stopPropagation(); onKey(e);
      });
    }
    diffSync(); volSync();
  }catch(e){}
})();
{ const base=renderSettings; renderSettings=function(){ base(); try{ diffSync(); volSync(); }catch(e){} }; }
// Settings opens at the top, where Difficulty and the sliders are (it kept the scroll of the last visit)
{ const base=openSettings; openSettings=function(from){ base(from); try{ const o=$('#settings'); if(o) o.scrollTop=0; }catch(e){} }; }
// left and right on a focused slider move it (the arrow keys and a controller both come through navMove)
{ const base=navMove; navMove=function(root,dir){
    const el=document.activeElement;
    if((dir==='l'||dir==='r')&&el&&el.matches&&el.matches('.vsl input[type=range]')&&root&&root.contains(el)){
      const v=clamp((+el.value||0)+(dir==='r'?5:-5),0,100); if(v!==+el.value){ el.value=v; volInput(el,true); } return; }
    return base(root,dir); }; }
window.__ebX=Object.assign(window.__ebX||{},{setv:{setDifficulty,diffSync,volSync,locked:setDiffLocked,vol:()=>({music:Music.level,sfx:SFX.volume,mMuted:Music.muted,sMuted:SFX.muted,mSilent:Music.silent,sSilent:SFX.silent})}});
$('#bSlotsClose').addEventListener('click',()=>{ SFX.play('ui'); show('menu'); refreshMenu(); });
$('#bPauseJournal').addEventListener('click',()=>{ scene='play'; hideAll(); openJournal(); });
$('#bMapJournal').addEventListener('click',()=>{ closeMap(true); openJournal(); });
$('#bJourClose').addEventListener('click',()=>closeJournal());
for(const b of document.querySelectorAll('#jTabs button')) b.addEventListener('click',()=>{ jTab=b.dataset.t; SFX.play('ui'); renderJour(); });
$('#bPauseHow').addEventListener('click',()=>openHow('pause'));
$('#bPauseMap').addEventListener('click',()=>{ scene='play'; hideAll(); openMap(); });
$('#bResume').addEventListener('click',resumeGame);
$('#bRestart').addEventListener('click',()=>startNormal());
$('#bQuit').addEventListener('click',toMenu);
$('#bRetry').addEventListener('click',()=>{ SFX.play('ui'); if(G.mode==='story') respawn(); else startNormal(); });
$('#bDeadMenu').addEventListener('click',()=>{ if(G.mode==='story'){ respawn(); } toMenu(); });
$('#bWinExplore').addEventListener('click',()=>{ scene='play'; hideAll(); if(!actsWinExplore()) setBanner('Free roam','The valley is yours to explore.',2.4); });
$('#bWinMenu').addEventListener('click',toMenu);

// ================= loop
// the size the canvas really has on screen (it fills the window by CSS). iOS Safari can report a stale innerWidth and
// innerHeight for a moment after a rotation, the toolbars sliding, or coming back to the tab, and the game then drew to
// one size while the touches came in another; the canvas's own box is always right
let CVR=null;   // the canvas's box, kept by resize (touchXY in a5_input.js reads it, so no touch forces a layout)
function screenWH(){ const r=cvs.getBoundingClientRect(); CVR={left:r.left,top:r.top,width:r.width,height:r.height}; const w=r.width>0?r.width:window.innerWidth, h=r.height>0?r.height:window.innerHeight; return [Math.max(320,Math.round(w)),Math.max(320,Math.round(h))]; }
function resize(){
  DPR=Math.min(window.devicePixelRatio||1,2); [W,H]=screenWH();
  cvs.width=Math.round(W*DPR); cvs.height=Math.round(H*DPR);
  lightCvs.width=Math.ceil(W/2); lightCvs.height=Math.ceil(H/2);
  zoom=clamp(Math.min(W/900,H/620),0.6,1.3); ZOOM0=zoom; readSafe(); vigKey='';
  if(G&&player){ if(scene==='menu') menuCam(0,true); else updateCam(0,true); }
  if(scene==='map') drawMapScreen();
}
addEventListener('resize',resize);
// iOS: re-read the size once things settle after a rotation, a toolbar change or a return to the tab
const resizeSoon=()=>{ resize(); setTimeout(resize,150); setTimeout(resize,600); };
addEventListener('orientationchange',resizeSoon); addEventListener('pageshow',resizeSoon);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) resizeSoon(); });
if(window.visualViewport) visualViewport.addEventListener('resize',()=>setTimeout(resize,50));
// and every half second, in case no event came: if the canvas's box and the size the game draws to disagree, fix it
let sizeChkT=0;
function sizeCheck(dt){ sizeChkT-=dt; if(sizeChkT>0) return; sizeChkT=0.5; const [w,h]=screenWH(); if(w!==W||h!==H||Math.min(window.devicePixelRatio||1,2)!==DPR) resize(); }
let last=performance.now();
function frame(now){
  let dt=(now-last)/1000; last=now; if(!(dt>0)) dt=0; dt=Math.min(dt,0.05);
  shakeMag=Math.max(0,shakeMag-dt*30); flashA=Math.max(0,flashA-dt*1.6);
  try{ sizeCheck(dt); }catch(e){}
  try{
    padPoll(dt);
    if(scene==='menu') menuUpdate(dt);
    else if(scene==='play'){ updateTimers(dt); if(scene==='play'){ if(G.slowT>0){ G.slowT-=dt; if(G.slowT<=0) G.timeScale=1; } update(dt*G.timeScale); } }
    else if(scene==='dying'){ dyingT-=dt; liteUpdate(dt); if(dyingT<=0) showDeath(); }
    else if(scene==='dialogue'){ updateDialogue(dt); liteUpdate(dt); }
    else if(scene!=='paused'&&scene!=='map'&&scene!=='journal'&&!(scene==='log'&&LOG.from==='paused')) liteUpdate(dt);
    musicUpdate(dt); if(scene==='play') perkUpdate(dt);
    overviewStep(scene==='menu'?14:6);
    render();
  }catch(err){ console.error(err); }
  pressed.clear(); touch.pressed={};
  requestAnimationFrame(frame);
}
initWorld(); buildSprites(); fogInit('');
resize(); setupMenuScene(); refreshMenu();
Cloud.check().then(ok=>{ if(ok&&Cloud.signedIn) syncSaves(); acctLabel(); });
requestAnimationFrame(t=>{ last=t; frame(t); });
window.__eb={god:false,get G(){return G;},get player(){return player;},get scene(){return scene;},
  startStory,startNormal,newStory(i){ setSlot(i||0); startStory(false); },openSlots,openJournal,closeJournal,openSettings,cycleFocus,followQuest,tracked,slotSave,latestSlot,talkHub,befriend,friendOf,secretTally,get Music(){return Music;},CAVEMAP,MINI,startMini,miniEnd,get mini(){return G.mini;},solveRoom,FLOORS,SECRET_ROOMS,goFloor,floorObjAct,AREADEFS,refreshCaveGates,caveRoomAt,hitCrystal,breakCrack,caveObjAct,resetBlocks,skipDialogue,advanceDialogue,drawPortrait,chooseUpgrade,toMenu,openMap,closeMap,
  tp(x,y){ player.x=x; player.y=y; updateCam(0,true); G.chunkBurst=16; },
  setStage(st){ G.stage=st; if(stageAt(st)>=stageAt('lanterns')) G.flags.forge=true; if(stageAt(st)>stageAt('raid')) for(const L of LANTERNS) L.lit=true; if(stageAt(st)>=stageAt('summit')){ G.flags.gate=true; GATE_COL.off=true; } setupNPCs(); },
  lightWard, wardReady(id){ G.wardReady[id]=true; }, enterArea:(id)=>{ const d=DOORS.find(q=>q.area===id); enterArea(id,d||{x:player.x,y:player.y}); }, exitArea, get AREA(){return AREA;}, DOORS, CAVEMOUTHS, LANDMARKS, QDEFS, CAST, startQuest, giveItems, npcMarker, talkTo, findPage, questPoke, lmAct, areaObjAct,
  bossWin(k){ G.fightSite=k; storyBossDone(); }, breath(n){ for(let i=0;i<(n||60);i++) breathIgnite(player.x+Math.cos(player.facing)*20,player.y+Math.sin(player.facing)*20,player.facing,1/30); }, finalChoice, setupNPCs, saveGame,
  killQuest(){ for(const e of G.enemies) if(!e.dead&&e.questTag) killEnemy(e); },
  killBoss(){ if(G.boss&&!G.boss.dead) killEnemy(G.boss); },
  hurtBoss(f){ if(G.boss&&!G.boss.dead){ G.boss.hp=G.boss.maxHp*f; } },
  face(a){ player.facing=a; }, WARDS, POI, LANTERNS, NPCSPOT, SITES, LILIES, ORES, bossDone(b){ G.bossDone[b]=true; }, Cloud, syncSaves, objectiveList,
  travel(id){ const s=SHRINES.find(z=>z.id===id); G.shrines[id]=true; scene='map'; travelTo(s); },
  setTime(t){ G.tod=t; }, rain(on){ G.weather.type=on?'rain':'clear'; G.weather.t=999; G.rainK=on?1:0; }};
window.__ebX=Object.assign(window.__ebX||{},{setHand,setTips,useMode:()=>useMode(),promptKind,tipsShut:()=>Object.keys(TIPS_SHUT),atkPress:()=>ATK.press,hudHits:()=>HUD_HITS.map(h=>({x:h.x,y:h.y,w:h.w,h:h.h,tipx:!!h.tipx})),hintText:()=>hintText(),setChars,setMouseAim,T3,readT,setBanner,taunt,bannerSkip,dlgNext,dlgChoose,dlgAskSkip,
  aimInfo:()=>({facing:player.facing,goal:player.faceGoal,aim:player.aim,mouseAim:settings.mouseAim,aimMode}),
  banner:()=>G.banner?{text:G.banner.text,sub:G.banner.sub,t:G.banner.t,dur:G.banner.dur,q:(G.bannerQ||[]).map(b=>b.text)}:{q:(G.bannerQ||[]).map(b=>b.text)},
  dlgState:()=>DLG?{i:DLG.i,text:DLG.text,chars:DLG.chars,opts:!!DLG.opts,skipArm:DLG.skipArm}:null,
  say:(id,t)=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); return n?!!npcBubble(n,t):false; }, view:()=>({x:cam.x,y:cam.y,zoom,W,H})});
window.__ebDbg=Object.assign(window.__ebDbg||{},{itemNames:()=>ITEM_NAMES,icoArtOf,ICO_ART:()=>Object.keys(ICO_ART),bagPadStar,ITM,
  icoSheet(cv,list,sb,size){ const was=LOOK.sb; LOOK.sb=!!sb; const g=cv.getContext('2d'), n=Math.floor(cv.width/(size+16)); g.fillStyle=sb?'#fff3d6':'#24130d'; g.fillRect(0,0,cv.width,cv.height);
    list.forEach((id,i)=>{ const x=(i%n)*(size+16)+8+size/2, y=Math.floor(i/n)*(size+26)+8+size/2; drawItemIcon(g,id,x,y,size); g.fillStyle=sb?'#3b2233':'#e8d6b8'; g.font='9px sans-serif'; g.textAlign='center'; g.fillText(String(id).slice(0,14),x,y+size/2+10); }); LOOK.sb=was; }});
// debug hooks from feature modules: each one adds to window.__ebX
if(window.__ebX) Object.defineProperties(window.__eb,Object.getOwnPropertyDescriptors(window.__ebX));
})();
