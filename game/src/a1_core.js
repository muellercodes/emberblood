(()=>{
'use strict';
// ================= helpers
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const dist2=(ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;};
const angTo=(ax,ay,bx,by)=>Math.atan2(by-ay,bx-ax);
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;};
const turnTo=(c,t,m)=>c+clamp(angDiff(c,t),-m,m);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const fmt=n=>Math.round(n).toLocaleString('en-US');
const smooth=t=>t*t*(3-2*t);
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};
const $=s=>document.querySelector(s);
const reduceMotion=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}})();
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const NSEED=90210;
function hash2(ix,iy){ let h=Math.imul(ix,374761393)+Math.imul(iy,668265263)+NSEED|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967295; }
function vnoise(x,y){
  const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=hash2(ix,iy), b=hash2(ix+1,iy), c=hash2(ix,iy+1), d=hash2(ix+1,iy+1);
  return (a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v)*2-1;
}
function fbm(x,y,oct){ let s=0,amp=0.5,f=1,n=0; for(let i=0;i<oct;i++){ s+=amp*vnoise(x*f+i*17.3,y*f-i*9.1); n+=amp; f*=2.03; amp*=0.5; } return s/n; }
function hexRGB(h){ const n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function mixRGB(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; }

// ================= sound (synthesized)
const SFX=(()=>{
  let ac=null,master=null,noiseBuf=null,fireNode=null,fireGain=null;
  let muted=!!store.get('eb_muted',false);
  const last={}, loops={};
  function init(){
    if(ac){ if(ac.state==='suspended') ac.resume(); return; }
    try{
      ac=new (window.AudioContext||window.webkitAudioContext)();
      master=ac.createGain(); master.gain.value=muted?0:0.45; master.connect(ac.destination);
      noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);
      const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    }catch(e){ ac=null; }
  }
  function tone(type,f0,f1,dur,vol,delay=0){
    const t=ac.currentTime+delay, o=ac.createOscillator(), g=ac.createGain();
    o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.01,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.03);
  }
  function noise(dur,vol,ft,f0,f1,q=1,delay=0){
    const t=ac.currentTime+delay, s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain();
    s.buffer=noiseBuf; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q;
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t,Math.random()); s.stop(t+dur+0.03);
  }
  function play(name,vol){
    if(!ac||muted) return;
    const now=performance.now(); if(last[name]&&now-last[name]<45) return; last[name]=now;
    const v=vol==null?1:vol;
    try{
      switch(name){
        case 'slash': noise(0.12,0.2*v,'highpass',3200,900,0.7); tone('triangle',520,190,0.1,0.05*v); break;
        case 'slash3': noise(0.22,0.3*v,'bandpass',2200,380,0.8); tone('sawtooth',320,80,0.2,0.08*v); break;
        case 'hit': tone('square',190,80,0.08,0.09*v); noise(0.07,0.18*v,'lowpass',2200,400); break;
        case 'block': tone('square',950,720,0.07,0.06); tone('triangle',1500,1250,0.09,0.05); break;
        case 'hurt': tone('sawtooth',260,70,0.25,0.16); noise(0.12,0.15,'lowpass',900,200); break;
        case 'roll': noise(0.22,0.2,'bandpass',500,1800,1.2); break;
        case 'roar': tone('sawtooth',130,40,0.9,0.28); noise(0.9,0.32,'lowpass',1300,90,0.5); tone('square',85,32,0.8,0.1); break;
        case 'boom': noise(0.55,0.4*v,'lowpass',950,55,0.7); tone('sine',95,30,0.45,0.26*v); break;
        case 'pop': tone('triangle',420,120,0.12,0.06); noise(0.12,0.1,'bandpass',1200,400); break;
        case 'cast': tone('sine',300,900,0.25,0.05); break;
        case 'step': noise(0.05,0.05*v,'lowpass',700,300,0.8); break;
        case 'drink': tone('sine',380,520,0.12,0.06); tone('sine',420,600,0.12,0.06,0.18); tone('sine',460,700,0.14,0.06,0.36); break;
        case 'chest': tone('triangle',330,330,0.12,0.08); tone('triangle',494,494,0.16,0.08,0.1); tone('triangle',659,659,0.3,0.08,0.22); break;
        case 'shrine': [392,587,784].forEach((f,i)=>tone('sine',f,f,0.9,0.06,i*0.12)); break;
        case 'level': [523,659,784,1047,1319].forEach((f,i)=>tone('triangle',f,f,0.22,0.07,i*0.08)); break;
        case 'ui': tone('triangle',720,520,0.06,0.06); break;
        case 'quest': tone('triangle',392,392,0.2,0.08); tone('triangle',523,523,0.2,0.08,0.16); tone('triangle',784,784,0.45,0.08,0.32); break;
        case 'warn': tone('sawtooth',110,98,0.6,0.14); tone('sawtooth',117,100,0.6,0.14,0.32); break;
        case 'upgrade': [523,659,784,1047].forEach((f,i)=>tone('triangle',f,f,0.16,0.07,i*0.07)); break;
        case 'win': [392,523,659,784,1047].forEach((f,i)=>tone('triangle',f,f,0.3,0.08,i*0.12)); break;
        case 'death': tone('sawtooth',300,40,1.2,0.2); break;
        case 'thunder': noise(2.2,0.5,'lowpass',400,40,0.6); tone('sine',60,30,1.6,0.25); break;
        case 'howl': tone('sine',380,620,0.6,0.05); tone('sine',620,420,0.9,0.05,0.55); break;
        case 'bird': { const f=rand(2600,4200); tone('sine',f,f*1.25,0.07,0.025*v); tone('sine',f*1.1,f*0.9,0.09,0.02*v,0.1); break; }
        case 'cricket': { const f=rand(4200,4800); for(let i=0;i<3;i++) tone('square',f,f,0.025,0.008*v,i*0.05); break; }
      }
    }catch(e){}
  }
  function loop(id,ft,freq,q){
    if(loops[id]) return loops[id];
    const s=ac.createBufferSource(); s.buffer=noiseBuf; s.loop=true;
    const f=ac.createBiquadFilter(); f.type=ft; f.frequency.value=freq; f.Q.value=q;
    const g=ac.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(master); s.start();
    return loops[id]={s,g,f};
  }
  function ambient(lv){
    if(!ac) return;
    try{
      const set=(id,ft,fr,q,val)=>{ const L=loop(id,ft,fr,q); L.g.gain.setTargetAtTime(muted?0:val,ac.currentTime,0.4); };
      set('wind','bandpass',380,0.5,lv.wind||0);
      set('rain','highpass',1400,0.3,lv.rain||0);
      set('lava','lowpass',140,0.7,lv.lava||0);
    }catch(e){}
  }
  function setFire(on){
    if(!ac) return;
    try{
      if(on&&!fireNode&&!muted){
        fireNode=ac.createBufferSource(); fireNode.buffer=noiseBuf; fireNode.loop=true;
        const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=700; f.Q.value=0.6;
        fireGain=ac.createGain(); fireGain.gain.value=0;
        fireNode.connect(f); f.connect(fireGain); fireGain.connect(master); fireNode.start();
        fireGain.gain.linearRampToValueAtTime(0.18,ac.currentTime+0.08);
      }else if(!on&&fireNode){
        const n=fireNode,g=fireGain,t=ac.currentTime;
        g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(0,t+0.1);
        n.stop(t+0.12); fireNode=null; fireGain=null;
      }
    }catch(e){ fireNode=null; fireGain=null; }
  }
  function toggle(){ muted=!muted; store.set('eb_muted',muted); if(master) master.gain.value=muted?0:0.45; if(muted) setFire(false); return muted; }
  return {init,play,setFire,toggle,ambient,get muted(){return muted;}};
})();

// ================= canvas
const cvs=$('#game'), ctx=cvs.getContext('2d');
const lightCvs=document.createElement('canvas'), lctx=lightCvs.getContext('2d');
let W=800,H=600,DPR=1,zoom=1,SAFE={t:0,r:0,b:0,l:0};
function readSafe(){
  const el=$('#safe'); if(!el) return;
  const cs=getComputedStyle(el);
  SAFE={t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0};
}

// ================= data
