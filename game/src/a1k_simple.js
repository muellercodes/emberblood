// ================= Simple words: a reading level for younger players (Settings > Words: Full or Simple)
// The game keeps its full text. When Simple is on, any line shown to the player (dialogue, choices, speech bubbles,
// banners, taunts, quest steps, hints) is swapped for a shorter version written in easy words, if one exists.
// The simple versions live in game/simple/*.json; build.mjs bakes them into SIMPLE_DATA:
//   "id": "simple text"                          for plain strings (id = h32 of the exact full text)
//   "id": {"o":"full text with {1}", "s":"..."}  for text built from a template ({1}, {2} stand for the parts that change)
// New writing can carry its own simple version inline: S(`full text`, `simple text`) returns the full text and
// registers the simple one.
const SIMPLE={on:false,map:Object.create(null),tpl:[],ready:false};
function h32(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h.toString(36); }
function S(full,simple){ if(simple!=null&&full!=null) SIMPLE.map[h32(String(full))]=String(simple); return full; }
function simpleInit(){
  if(SIMPLE.ready) return; SIMPLE.ready=true;
  const D=typeof SIMPLE_DATA!=='undefined'?SIMPLE_DATA:{};
  const esc=t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const k in D){
    const v=D[k];
    if(typeof v==='string'){ if(!(k in SIMPLE.map)) SIMPLE.map[k]=v; }
    else if(v&&v.o&&v.s!=null){
      const parts=v.o.split(/\{(\d+)\}/); let re='^', fixed=0;
      for(let i=0;i<parts.length;i++){ if(i%2) re+='([\\s\\S]*?)'; else { re+=esc(parts[i]); fixed+=parts[i].length; } }
      if(fixed>=6) SIMPLE.tpl.push({re:new RegExp(re+'$'),s:v.s,fixed});
    }
  }
  SIMPLE.tpl.sort((a,b)=>b.fixed-a.fixed);
}
function simplify(s){
  if(!SIMPLE.on||s==null) return s;
  const str=String(s); if(str.length<4) return s;
  simpleInit();
  const v=SIMPLE.map[h32(str)]; if(v!=null) return v;
  for(const t of SIMPLE.tpl){ const m=t.re.exec(str); if(m) return t.s.replace(/\{(\d+)\}/g,(_,i)=>m[+i]!=null?m[+i]:''); }
  return str;
}
function setReading(v){ v=v==='simple'?'simple':'full'; SIMPLE.on=v==='simple'; store.set('eb_reading',v); for(const b of document.querySelectorAll('#setReading button')) b.setAttribute('aria-pressed',String(b.dataset.v===v)); return v; }
SIMPLE.on=store.get('eb_reading','full')==='simple';
// Settings row, injected so body.html stays as it is
(function readingRow(){
  try{
    const panel=document.querySelector('#settings .panel'); if(!panel||document.getElementById('setReading')) return;
    const r=document.createElement('div'); r.className='setrow';
    r.innerHTML='<span>Words<small>Simple uses short, easy words in talks, quests and messages. Great for younger players.</small></span><div class="seg" id="setReading" role="group" aria-label="Words"><button type="button" data-v="full" aria-pressed="false">Full</button><button type="button" data-v="simple" aria-pressed="false">Simple</button></div>';
    const first=panel.querySelector('.setrow'); if(first) first.before(r); else panel.prepend(r);
    for(const b of r.querySelectorAll('button')) b.addEventListener('click',()=>{ setReading(b.dataset.v); try{ SFX.play('ui'); }catch(e){} });
    setReading(SIMPLE.on?'simple':'full');
  }catch(e){}
})();
window.__ebX=Object.assign(window.__ebX||{},{simplify,setReading,h32,simpleCount:()=>{ simpleInit(); return Object.keys(SIMPLE.map).length+SIMPLE.tpl.length; }});
