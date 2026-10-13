
// ================= music for Act II (the Clockwork Coast) and Act III (Frostreach), and the lantern song
// Notation, instruments and mixing are a14_music.js's (read its header). Each g below was set by measuring offline
// renders (about -29.5 dBFS RMS at the default volume; the hushed and cave themes a little lower), so every theme sits
// with the Act I score. Routing (which theme plays where) is at the end of this file, in a wrapper over musicMood.

// ---- small notation helpers
// retrograde: the same notes and lengths, back to front (bar lines fall out by themselves)
function ms1Rev(s){ return String(s).split(/\s+/).filter(t=>t&&t!=='|').reverse().join(' '); }
// move every melody degree up (or down) k scale steps, keeping accidentals, rests, chords like 1,3,5 and velocities
function ms1Up(s,k){
  return String(s).split(/\s+/).map(t=>{
    if(!t||t==='|') return t;
    const [a,vel]=t.split('@'), i=a.lastIndexOf(':'); if(i<0) return t;
    const head=a.slice(0,i); if(head==='r') return t;
    const nh=head.split(',').map(d=>{ const m=/^(-?\d+)([#b]?)$/.exec(d); return m?(+m[1]+k)+m[2]:d; }).join(',');
    return nh+a.slice(i)+(vel!=null?'@'+vel:'');
  }).join(' ');
}
// a copy of a theme with changes: {set:{bpm..}, drop:[part names], part:{name:{fields}}, add:[parts], sec:{A:{fields}}, form}
function ms1Var(th,o){
  const v=Object.assign({},th,o.set||{}); delete v._b;
  v.parts=th.parts.filter(P=>!(o.drop||[]).includes(P.n)).map(P=>Object.assign({},P,(o.part||{})[P.n]||{})).concat(o.add||[]);
  v.sec={}; for(const k in th.sec) v.sec[k]=Object.assign({},th.sec[k],(o.sec||{})[k]||{});
  for(const k in (o.sec||{})) if(!v.sec[k]) v.sec[k]=o.sec[k];
  if(o.form) v.form=o.form; if(o.intro!==undefined) v.intro=o.intro;
  return v;
}

// ---- the lantern song (THREADS.md 14.4): one tune for the whole game, built once here for every act's music.
// "Little lantern, burning bright, / light the way home through the night. / One for you and one for me, / and one more,
// just to see." Eighth-note grid in 4/4, 8 bars, a lullaby that rises to the high tonic on "one more" and settles.
// Other music modules use these (and must not declare them again): MS_LANTERN (major, any key), MS_LANTERNC (its
// chords), MS_LANTERN3 and MS_LANTERN3C (the same tune as a 3/4 waltz, 16 bars; MS_LANTERN3C is also the chord line for
// the 4/4 tune at half speed: msX(MS_LANTERN,2) in a step 2 theme, msX(MS_LANTERN,4) in a step 4 one), MS_LANTERN_REV
// (Nyxara hums it backwards) and MS_LANTERN_REVC (chords for the backwards tune in a minor mode), MS_LANTERN_RM and
// MS_LANTERN_RMC (the tune in the relative major inside a minor-key theme). ms1Up moves any line to another degree.
const MS_LANTERN='1:3 3:1 5:2 3:2 | 4:2 3:2 2:4 | 2:3 4:1 6:2 4:2 | 5:2 4:2 3:4 | 5:2 6:2 8:2 6:2 | 5:2 3:2 5:4 | 6:2 7:2 8:4 | 5:2 2:2 1:4';
const MS_LANTERNC='1|2 5|2|57 1|1 4|1|6 4|5 1';
const MS_LANTERN3='1:4 3:2 | 5:4 3:2 | 4:4 3:2 | 2:6 | 2:4 4:2 | 6:4 4:2 | 5:4 4:2 | 3:6 | 5:4 6:2 | 8:4 6:2 | 5:4 3:2 | 5:6 | 6:4 7:2 | 8:6 | 5:4 2:2 | 1:6';
const MS_LANTERN3C='1|1|2|5|2|2|57|1|1|4|1|1|6|4|5|1';
const MS_LANTERN_REV=ms1Rev(MS_LANTERN);
const MS_LANTERN_REVC='1|6|1|6|1|2|7|1';
// the same tune in the relative major of a minor key (degree 3), with its chords
const MS_LANTERN_RM=ms1Up(MS_LANTERN,2), MS_LANTERN_RMC='3|4 7|4|77 3|3 6|3|1 6|7 3';

// ---- the Moth Waltz: the tune Vesper hums and Posy's music box plays. G minor with a raised seventh (the moth's
// flutter is the F sharp, E flat step). 16 bars of 3/4: a question that stops on D, an answer that comes home.
const MS1_MW='1:2 5:2 8:2 | 7#:3 6:1 5:2 | 6:2 5:2 3:2 | 2:6 | 1:2 5:2 8:2 | 9:3 8:1 7#:2 | 8:2 6:2 4:2 | 5:6 | 1:2 5:2 8:2 | 7#:3 6:1 5:2 | 6:2 8:2 10:2 | 11:3 10:1 8:2 | 10:2 8:2 5:2 | 6:2 4:2 1:2 | 4:2 2:2 0#:2 | 1:6';
const MS1_MWC='1|5M|6|5M|1|5M|4|5M|1|5M|6|4|1|4|5M7|1';

// ---- Glaciar's theme: broad and cold, B minor. Mount Dread hints at it before you meet her.
const MS1_GZ8='5:4 8:4 | 10:6 8:2 | 6:4 8:4 | 10:4 9:2 8:2 | 4:4 6:4 | 8:6 6:2 | 7#:4 9:4 | 5:8';
const MS1_GZ=MS1_GZ8+' | 5:4 8:4 | 10:4 12:4 | 13:6 12:2 | 10:8 | 12:4 14:4 | 14:4 13:2 11:2 | 12:4 9:4 | 7#:8';
const MS1_GZC='1|1|6|6|4|4|5M|5M|1|1|6|6|3|7|5M|5M';

// ================= Act II: the Clockwork Coast

// ---- the Chalk Downs: A major in a swaying 6/8 (bpm counts eighths), flute and fiddle over rolling harp, gulls overhead
const MS1_DN='5:3 3:2 5:1 | 6:3 8:3 | 10:2 9:1 8:2 5:1 | 9:6 | 5:3 3:2 5:1 | 6:3 8:2 11:1 | 9:2 8:1 7:2 5:1 | 8:6';
MSCORE.c_downs={g:1.22,key:'A',mode:'ion',bpm:192,qbpm:96,meter:6,step:1,form:['A','B','A2'],
  parts:[
    {n:'flute',i:'flute',o:4,v:1,orn:1,lead:1,pan:.08},
    {n:'fid',i:'fiddle',o:4,v:.75,orn:1,lead:1,pan:-.12},
    {n:'harp',t:'arp',i:'harp',o:3,v:.55,ctr:9,pan:-.28,pat:'0:1 1:1 2:1 3:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,pat:true,att:1,cut:900},
    {n:'bass',t:'bass',i:'bass',o:2,v:.75,pat:'R:3 5:3'},
    {n:'gull',i:'drip',o:5,v:1.1,pan:.38,dl:.3},
    {n:'dr',t:'drum',v:.6,rv:.2,pat:{frame:'x.....|...o..',shaker:'..g..g'}}
  ],
  sec:{
    A:{ch:'1|4|1|5|1|4|5|1',flute:MS1_DN},
    B:{ch:'4|1|4|5|6|4|2|5',vol:{fid:1.25,harp:1.1},fid:'8:2 6:1 4:3 | 5:2 3:1 1:3 | 4:2 6:1 8:2 11:1 | 9:6 | 10:3 8:3 | 11:3 8:3 | 9:2 11:1 13:2 11:1 | 12:3 r:3',
      gull:'r:6 | r:2 12:1 10:3 | r:6 | r:6 | r:4 13:1 11:1 | r:6 | r:6 | r:1 12:1 10:4'},
    A2:{ch:'1|4|1|5|1|4|5|1',flute:MS1_DN,fid:'3:3 1:3 | 4:6 | 3:6 | 5:6 | 3:3 1:3 | 4:6 | 5:3 2:3 | 3:6',
      gull:'r:6 | r:6 | r:6 | r:3 12:1 10:2 | r:6 | r:6 | r:6 | r:6'}
  }};

// ---- the White Cliffs, the Rockpools, Lantern Point, Gullcrag Head: E flat, a horn tune that rises and falls like
// a swell, harp waves, surf washing in every other bar, gulls
const MS1_CA='1:2 3:2 5:4 | 5:2 4:2 2:4 | 3:2 5:2 8:4 | 8:3 7:1 6:4 | 5:2 6:2 8:4 | 9:3 8:1 7:4';
MSCORE.c_coast={g:1.44,key:'Eb',mode:'ion',bpm:84,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'horn',i:'horn',o:4,v:.95,lead:1,pan:.05},
    {n:'flute',i:'flute',o:5,v:.38,pan:.25},
    {n:'str',i:'strings',o:4,v:.8,lead:1,pan:-.12,att:.3},
    {n:'harp',t:'arp',i:'harp',o:3,v:.5,ctr:2,pan:-.3,pat:'0:1 1:1 2:1 3:1 4:1 5:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.4,ctr:9,pat:true,att:1.2,cut:1000},
    {n:'bass',t:'bass',i:'bass',o:2,v:.75,pat:'R:8 5:4 8:4'},
    {n:'gull',i:'drip',o:5,v:1,pan:.4,dl:.35},
    {n:'dr',t:'drum',v:.6,rv:.35,pat:{crash:'g...............|................',taiko:'o...............|........g.......'}}
  ],
  sec:{
    A:{ch:'1|5/7|6|4|1|5/7|4|5',horn:msX(MS1_CA+' | 6:2 8:2 11:2 10:2 | 9:8',2)},
    B:{ch:'6|3|4|1|6|3|2|5',vol:{str:1.35,harp:1.1},str:msX('6:4 5:2 3:2 | 5:6 3:2 | 4:4 6:2 8:2 | 8:6 r:2 | 6:4 8:2 10:2 | 10:4 9:2 7:2 | 6:4 8:2 6:2 | 5:6 r:2',2),
      gull:'r:16 | r:6 15:1 13:3 r:6 | r:16 | r:16 | r:4 15:1 13:3 r:8 | r:16 | r:10 15:1 12:3 r:2 | r:16'},
    A2:{ch:'1|5/7|6|4|1|5/7|4 5|1',horn:msX(MS1_CA+' | 6:2 4:2 5:2 7:2 | 8:8',2),flute:msX(MS1_CA+' | 6:2 4:2 5:2 7:2 | 8:8',2)}
  }};

// ---- Gearhaven: a clockwork polka in B flat. A calliope (reed and flute) over pizzicato oom-pah, a music box turning,
// and every clock in town ticking. Before the Great Clock starts again (c_clock_on) the town plays c_gearstop: the
// same tune, slower, with no ticking and the odd clunk.
const MS1_GA='5:1 5:1 6:1 5:1 3:2 1:2 | 5:1 5:1 6:1 5:1 8:4 | 6:1 6:1 8:1 6:1 4:2 6:2 | 5:2 7:2 9:4 | 5:1 5:1 6:1 5:1 3:2 1:2 | 3:1 3:1 5:1 3:1 6:2 8:2 | 4:2 6:2 5:2 2:2 | 1:2 r:1 -3:1 1:2 r:2';
const MS1_GB='6:3 5:1 3:4 | 5:3 3:1 7:4 | 4:2 6:2 8:4 | 8:2 7:1 6:1 5:4 | 4:3 5:1 6:4 | 7:3 6:1 5:4 | 5:2 7:2 8:2 6:2 | 4:2 6:2 9:4';
MSCORE.c_gearhaven={g:1.42,key:'Bb',mode:'ion',bpm:116,meter:4,step:4,form:['A','A2','B','A2'],
  parts:[
    {n:'reed',i:'reed',o:4,v:.8,lead:1,pan:-.08},
    {n:'fl',i:'flute',o:5,v:.42,pan:.15},
    {n:'horn',i:'horn',o:4,v:.85,lead:1,pan:.1},
    {n:'mbox',t:'arp',i:'mbox',o:5,v:.5,ctr:2,pan:.3,pat:'0:2 2:2 1:2 2:2'},
    {n:'pz',t:'arp',i:'pizz',o:3,v:.6,ctr:9,pan:-.25,pat:'r:4 c:2 r:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:4 r:4 5:4 r:4'},
    {n:'dr',t:'drum',v:1.1,rv:.12,pat:{tick:'o.g.o.g.o.g.o.g.',tock:'....o.......o...',frame:'x.......x.......'}}
  ],
  sec:{
    A:{ch:'1|1|4|5|1|6|2 5|1',reed:msX(MS1_GA,2)},
    A2:{ch:'1|1|4|5|1|6|2 5|1',reed:msX(MS1_GA,2),fl:msX(MS1_GA,2)},
    B:{ch:'6|3|4|1|2|5|3 6|2 5',horn:msX(MS1_GB,2),dr:{tick:'o.g.o.g.o.g.o.g.',tock:'....o.......o...',frame:'x...............'}}
  }};
MSCORE.c_gearstop=ms1Var(MSCORE.c_gearhaven,{set:{bpm:104,g:1.47},drop:['dr','mbox'],
  add:[{n:'dr',t:'drum',v:.9,rv:.3,pat:{tom:'................|..........g.....|................|....g...........',frame:'x.......x.......'}}],
  sec:{B:{dr:{tom:'................|..........g.....|................|....g...........',frame:'x...............'}}}});

// ---- Saltmarsh: a sea shanty in D dorian with a swing. The fiddle sings the verse, the whole crew (fiddle and reed)
// the chorus; feet stamp on one and three, hands clap on two and four.
const MS1_SA='1:2 3:1 5:1 8:2 5:2 | 6:2 5:1 4:1 3:2 1:2 | 7:2 5:1 7:1 9:2 7:2 | 5:2 4:1 3:1 2:4 | 1:2 3:1 5:1 8:2 5:2 | 6:2 8:1 6:1 4:2 6:2 | 7:2 5:2 4:2 2:2 | 1:6 r:2';
const MS1_SB='4:4 6:2 8:2 | 8:3 6:1 5:2 3:2 | 4:4 6:2 8:2 | 9:3 8:1 7:2 5:2 | 4:2 4:2 6:2 8:2 | 8:2 6:2 5:2 3:2 | 2:2 4:2 7:2 5:2 | 1:4 r:4';
MSCORE.c_saltmarsh={g:1.37,key:'D',mode:'dor',bpm:108,meter:4,step:2,swing:.22,form:['A','B','A2','B'],
  parts:[
    {n:'fid',i:'fiddle',o:4,v:.95,orn:1,lead:1,pan:-.1},
    {n:'reed',i:'reed',o:4,v:.7,orn:1,lead:1,pan:.12},
    {n:'lute',t:'arp',i:'lute',o:3,v:.6,ctr:10,pan:.28,pat:'r:1 c:1 r:1 c:1 r:1 c:1 r:1 c:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2 5:2 R:2 5:2'},
    {n:'dr',t:'drum',v:.8,rv:.12,pat:{frame:'X...X...',snare:'..g...g.',shaker:'.g.g.g.g'}}
  ],
  sec:{
    A:{ch:'1|1|7|5|1|4|7|1',fid:MS1_SA},
    B:{ch:'4|1|4|5|4|1|7|1',fid:MS1_SB,reed:MS1_SB,dr:{frame:'X...X...',snare:'..x...x.',shaker:'.o.o.o.o'}},
    A2:{ch:'1|1|7|5|1|4|7|1',reed:MS1_SA}
  }};

// ---- the Brass Yards and the Brassworks: C sharp dorian, a machine that never stops. String ostinato, ticking, anvils,
// a low horn that keeps going anyway.
const MS1_BA='1:3 3:1 5:4 | 6:2 5:2 4:4 | 3:3 5:1 8:4 | 7:2 6:2 4:4 | 7:3 9:1 11:4 | 10:2 8:2 6:4 | 5:3 7:1 9:2 7:2 | 5:8';
MSCORE.c_brass={g:1.36,key:'C#',mode:'dor',bpm:100,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'horn',i:'horn',o:3,v:1,lead:1,pan:.05},
    {n:'str',i:'strings',o:4,v:.75,lead:1,pan:-.12},
    {n:'str8',i:'strings',o:4,v:.4,pan:-.2},
    {n:'ost',t:'bass',i:'stac',o:3,v:.6,pan:-.2,pat:'R:1 R:1 8:1 R:1 5:1 R:1 8:1 5:1'},
    {n:'anvil',t:'arp',i:'bell',o:5,v:.45,ctr:2,pan:.32,ratio:3.7,idx:3,mdec:.06,dec:.7,pat:'r:12 0:1 r:3 r:8 c:1 r:7'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:4 R:2 R:2 R:4 5:2 8:2'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.28,ctr:9,pat:true,att:1,f1:500,f2:900},
    {n:'dr',t:'drum',v:.85,rv:.15,pat:{tick:'o.g.o.g.o.g.o.g.',tock:'....x.......x...',kick:'x.......x.x.....'}}
  ],
  sec:{
    A:{ch:'1|4|1|4|7|4|5|5',horn:msX(MS1_BA,2)},
    B:{ch:'b6|7|1|1|b6|7|5M|5M',vol:{str:1.35},str:msX('8:4 7:2 6b:2 | 7:6 r:2 | 8:2 10:2 12:4 | 12:6 r:2 | 13b:4 12:2 10:2 | 11:4 9:2 7:2 | 7#:4 9:4 | 12:8',2)},
    A2:{ch:'1|4|1|4|7|4|5|5',horn:msX(MS1_BA,2),str8:msX(MS1_BA,2)}
  }};

// ---- the Moth Wood: G minor in a slow 3/4. The Moth Waltz drifts past on a music box and goes wrong (an A flat where
// the A should be), a choir hums, silver dust glitters. Hushed.
MSCORE.c_mothwood={g:1.79,key:'G',mode:'aeo',bpm:60,meter:3,step:2,form:['A','B'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.3,lead:1,pan:.22,dl:.45},
    {n:'cel',i:'celesta',o:4,v:.6,lead:1,pan:-.3,dl:.4},
    {n:'hum',i:'choir',o:3,v:.55,lead:1,att:1.4,rel:1.8,f1:380,f2:820,pan:-.05},
    {n:'choir',t:'pad',i:'choir',o:3,v:.26,ctr:7,pat:true,att:2.5,rel:3,f1:420,f2:780},
    {n:'drone',i:'drone',o:2,v:.6,cut:300},
    {n:'dr',t:'drum',v:.5,rv:.5,pat:{tom:'g.....|......|......|......'}}
  ],
  sec:{
    A:{ch:'1|1|5M|1|6|6|b2|1',mbox:'r:6 | 1:2 5:2 8:2 | 7#:3 6:1 5:2 | r:6 | r:6 | 1:2 5:2 8:2 | 9b:3 8:1 7:2 | r:6',
      hum:'5:12 6:6 5:6 | 3:12 3:6 1:6',drone:'1:48'},
    B:{ch:'6|6|4|4|6|6|b2|5M',cel:'r:4 13:1 12:1 | 10:6 | r:6 | r:2 11:1 10:1 8:2 | r:6 | 13:1 r:1 12:1 r:3 | 9b:6 | r:6',
      hum:'3:12 4:12 | 3:12 1:6 0#:6',drone:'6:12 4:12 6:12 1:6 5:6'}
  }};

// ---- the Shadow Shoals and the Shadow Spire: A flat minor, a low sighing horn over a slow pulse and moth-wing flutters;
// then the lantern song on a celesta, backwards (the Lady hums it that way)
MSCORE.c_spire={g:1.36,key:'Ab',mode:'aeo',bpm:64,meter:4,step:4,form:['A','B'],
  parts:[
    {n:'horn',i:'horn',o:3,v:1,lead:1,pan:.05},
    {n:'cel',i:'celesta',o:4,v:1,lead:1,pan:.25,dl:.4},
    {n:'choir',t:'pad',i:'choir',o:3,v:.4,ctr:8,pat:true,att:2,rel:2.5,f1:460,f2:820},
    {n:'drone',i:'drone',o:2,v:.7,cut:280,lr:.05},
    {n:'dr',t:'drum',v:.8,rv:.35,pat:{tom:'o...............|........g.......',shaker:'................|g.g.g...........'}}
  ],
  sec:{
    A:{ch:'1|1|6|6|4|4|5M|5M',horn:msX('5:6 6:2 | 5:4 3:4 | 3:6 2:2 | 1:8 | 4:6 6:2 | 8:4 6:4 | 7#:6 5:2 | 5:8',2),drone:'1:128'},
    B:{ch:MS_LANTERN_REVC,vol:{cel:1.8,choir:1.3},cel:msX(MS_LANTERN_REV,2),drone:'1:64 6:64'}
  }};

// ---- the Gullcrag Caves: F sharp minor, drips and the sea booming in the rock, a lonely ocarina; then Pearl's cradle,
// where her mother once sang the lantern song (here in A major, on a celesta)
const MS1_DRIP='r:5 8:1 r:10 5:1 r:13 10:1 r:6 3:1 r:13 7:1 r:12', MS1_DRIP2='r:9 12:1 r:12 9:1 r:15 11:1 r:7 8:1 r:17';
MSCORE.c_seacave={g:1.35,key:'F#',mode:'aeo',bpm:66,meter:4,step:2,form:['A','B'],
  parts:[
    {n:'oca',i:'ocarina',o:4,v:.9,orn:1,lead:1,pan:.1,dl:.3},
    {n:'cel',i:'celesta',o:4,v:.85,lead:1,pan:-.15,dl:.35},
    {n:'drip',i:'drip',o:5,v:1.6,pan:.3,dl:.45,rv:.6},
    {n:'choir',t:'pad',i:'choir',o:3,v:.3,ctr:7,pat:true,att:2.5,rel:2.5,f1:450,f2:800},
    {n:'drone',i:'drone',o:2,v:.6,cut:320},
    {n:'dr',t:'drum',v:.7,rv:.5,pat:{taiko:'g.......|........|....o...|........',crash:'........|g.......|........|...g....'}}
  ],
  sec:{
    A:{ch:'1|1|6|6|7|7|7|1',oca:'r:4 1:2 3:2 | 5:6 4:2 | 3:6 1:2 | 6:8 | r:4 4:2 5:2 | 7:6 5:2 | 4:4 2:4 | 1:8',drip:MS1_DRIP,drone:'1:64'},
    B:{ch:MS_LANTERN_RMC,vol:{cel:1.45},cel:MS_LANTERN_RM,drip:MS1_DRIP2,drone:'3:64'}
  }};

// ---- the Spinning Lighthouse: E major with a lydian glint. A six-note celesta figure turns against the four-beat bar
// (twice round, then a step up into the next bar) like the lamp going round; the lantern song comes in on a bell, slow, a light that should never go out.
const MS1_LA='5:4 3:2 5:2 | 6:4 4#:2 2:2 | 5:2 8:2 7:2 5:2 | 6:8 | 3:4 1:2 3:2 | 4:4 6:2 8:2 | 8:4 9:4 | 7:8';
MSCORE.c_light={g:1.28,key:'E',mode:'ion',bpm:92,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'flute',i:'flute',o:4,v:.95,orn:1,lead:1,pan:.08,att:.1},
    {n:'bell',i:'bell',o:4,v:1.3,lead:1,pan:-.15,dl:.3},
    {n:'spin',t:'arp',i:'celesta',o:4,v:.5,ctr:5,pan:.3,dl:.2,dec:.8,pat:'0:1 1:1 2:1 3:1 4:1 5:1 0:1 1:1 2:1 3:1 4:1 5:1 3:1 4:1 5:1 6:1'},
    {n:'harp',t:'arp',i:'harp',o:3,v:.35,ctr:9,pan:-.3,pat:'0:4 1:4 2:4 1:4'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.45,ctr:9,pat:true,att:1.5,cut:1000},
    {n:'bass',t:'bass',i:'bass',o:2,v:.65,pat:'R:12 5:4'},
    {n:'dr',t:'drum',v:.9,rv:.3,pat:{tick:'g...g...g...g...'}}
  ],
  sec:{
    A:{ch:'1|2M|1|2M|6|4|5s|5',flute:msX(MS1_LA,2)},
    B:{ch:MS_LANTERN3C,vol:{bell:1.3},bell:msX(MS_LANTERN,4),mute:['harp']},
    A2:{ch:'1|2M|1|2M|6|4|5s|5',vol:{bell:.55},flute:msX(MS1_LA,2),bell:msX(MS1_LA,2)}
  }};

// ---- Act II bosses (Grand Admiral Pinch, Ticktock, the Gloomwing, Saltbeard's Ghost): a sea battle in E minor, 6/8
// at a gallop (bpm counts eighths). Strings take the tune, then brass fanfares, then everyone.
const MS1_KB='5:2 1:1 3:2 5:1 | 8:3 7:2 5:1 | 6:2 5:1 3:2 1:1 | 2:3 4:3 | 5:2 1:1 3:2 5:1 | 8:2 10:1 9:2 8:1 | 6:2 4:1 8:2 6:1 | 7#:3 5:3 | 6:2 8:1 10:2 8:1 | 9:3 7:2 9:1 | 8:2 5:1 3:2 5:1 | 6:3 3:3 | 4:2 6:1 8:2 11:1 | 10:3 8:2 5:1 | 7#:2 9:1 12:2 9:1 | 8:6';
const MS1_KBC='1|1|6|7|1|1|4|5M|6|7|1|6|4|1|5M|1';
MSCORE.c_boss={g:1.14,key:'E',mode:'aeo',bpm:420,qbpm:140,meter:6,step:2,intro:['I'],form:['A','B','A2'],
  parts:[
    {n:'brass',i:'brass',o:4,v:.9,lead:1,pan:.05},
    {n:'str',i:'strings',o:4,v:.75,lead:1,pan:-.12},
    {n:'str8',i:'strings',o:5,v:.38,pan:-.2},
    {n:'stab',t:'arp',i:'brass',o:3,v:.55,ctr:10,pan:.25,pat:'c:2 r:4 c:2 r:4'},
    {n:'low',t:'bass',i:'stac',o:3,v:.55,pan:-.25,pat:'R:2 8:2 5:2 R:2 8:2 5:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:6 R:4 5:2'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.4,ctr:2,vn:3,pat:true,att:.4},
    {n:'dr',t:'drum',v:.55,rv:.12,pat:{kick:'x.....x.....',snare:'......x.....',hat:'o.g.o.o.g.o.',taiko:'X...........|............|X...........|............'}}
  ],
  sec:{
    I:{ch:'1|5M',stab:'c:2 r:4 c:2 r:4 c:2 r:2 c:2 r:2 c:4',mute:['low','bass','choir'],dr:{taiko:'X.....x.....|X...x...X.x.',crash:'X...........|............'}},
    A:{ch:MS1_KBC,vol:{str:1.25},str:msX(MS1_KB,2)},
    B:{ch:'6|7|1|1|6|7|5M|5M',brass:msX('3:2 3:1 3:2 5:1 | 4:3 2:3 | 3:2 3:1 3:2 5:1 | 8:6 | 6:2 6:1 6:2 8:1 | 7:3 4:3 | 7#:2 7#:1 7#:2 9:1 | 12:6',2),
      str:'8:12 | 7:12 | 8:12 | 8:12 | 8:12 | 9:12 | 7#:12 | 9:12',mute:['low'],
      dr:{kick:'x.....x.....',snare:'......x...x.',hat:'o.o.o.o.o.o.',taiko:'X...........|X.....x.....'}},
    A2:{ch:MS1_KBC,brass:msX(MS1_KB,2),str8:msX(MS1_KB,2),dr:{kick:'x.....x.....',snare:'......x.....',hat:'o.g.o.o.g.o.',taiko:'X...........|X.....x.....',crash:msHit('x',192)}}
  }};

// ---- Vesper, the Moth Mask (her scenes, as a dialogue mood, and her hideout): the Moth Waltz on a music box over a harp
// oom-pah-pah. In the middle, the lantern song as a waltz in B flat major (Pearl's mother sang it to her, so it is
// Vesper's family's song too).
MSCORE.c_vesper={g:1.27,key:'G',mode:'aeo',bpm:96,meter:3,step:2,form:['A','B','A2'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.5,lead:1,pan:.12,dl:.22},
    {n:'fl',i:'flute',o:4,v:.8,orn:1,lead:1,att:.1,pan:-.06},
    {n:'harp',t:'arp',i:'harp',o:3,v:.45,ctr:9,pan:-.25,pat:'r:2 c:2 c:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,pat:true,att:1.2,rel:1.2,cut:800},
    {n:'bass',t:'bass',i:'bass',o:2,v:.7,pat:'R:2 r:4'}
  ],
  sec:{
    A:{ch:MS1_MWC,vol:{mbox:1.35},mbox:MS1_MW},
    B:{ch:'3|3|4|7|4|4|77|3|3|6|3|3|1|6|7|3',fl:ms1Up(MS_LANTERN3,2)},
    A2:{ch:MS1_MWC,mbox:MS1_MW,fl:MS1_MW}
  }};

// ---- the Vesper fight on the Spire roof ("The Dance"): the Moth Waltz at full tilt, strings then brass, stabs on two
// and three, taiko on one. B climbs in sequences like a chase over rooftops.
MSCORE.c_mothmask={g:1.38,key:'G',mode:'aeo',bpm:176,meter:3,step:2,intro:['I'],form:['A','B','A2'],
  parts:[
    {n:'str',i:'strings',o:4,v:.8,lead:1,pan:-.1},
    {n:'brass',i:'brass',o:4,v:.85,lead:1,pan:.08},
    {n:'str8',i:'strings',o:5,v:.38,pan:-.2},
    {n:'lowb',i:'horn',o:3,v:.6,pan:.15},
    {n:'stab',t:'arp',i:'brass',o:3,v:.5,ctr:10,pan:.22,pat:'r:2 c:1 r:1 c:1 r:1'},
    {n:'low',t:'bass',i:'stac',o:3,v:.5,pan:-.25,pat:'R:1 8:1 5:1 8:1 5:1 8:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2 r:4'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.33,ctr:2,pat:true,att:.4},
    {n:'dr',t:'drum',v:.55,rv:.14,pat:{kick:'X.....',snare:'..o.o.',hat:'gogogo',taiko:'X.....|......|x.....|......'}}
  ],
  sec:{
    I:{ch:'1|5M',stab:'c:1 r:1 c:1 r:1 c:1 r:1 c:2 r:2 c:2',mute:['low','bass','choir'],dr:{taiko:'X...x.|X.x.XX',crash:'X.....|......'}},
    A:{ch:MS1_MWC,vol:{str:1.25},str:MS1_MW},
    B:{ch:'6|7|1|5M|6|7|4|5M',str:'3:2 6:2 8:2 | 4:2 7:2 9:2 | 5:2 8:2 10:2 | 9:3 7#:1 5:2 | 6:2 8:2 10:2 | 7:2 9:2 11:2 | 8:2 11:2 13:2 | 12:2 9:2 7#:2',
      lowb:'8:6 | 9:6 | 8:6 | 7#:6 | 8:6 | 9:6 | 8:6 | 7#:6',dr:{kick:'X.....',snare:'..x.x.',hat:'ogoxog',taiko:'X.....|x.....'}},
    A2:{ch:MS1_MWC,brass:MS1_MW,str8:MS1_MW,dr:{kick:'X.....',snare:'..x.x.',hat:'gogogo',taiko:'X.....|x...o.|X.....|x.x.o.',crash:msHit('x',96)}}
  }};

// ================= Act III: Frostreach

// ---- the Whitepass, Hearthold Vale, Rimeholm Cliffs, the Pinewhisper: F sharp minor, cold and crystalline. A glass bell
// tune, celesta frost glittering in the gaps, a breathy flute in the middle. (Act I's Frostpine Highlands stay 'frost'.)
const MS1_FR='5:4 3:2 1:2 | 3:3 2:1 1:4 | 3:2 5:2 7:4 | 7:3 6:1 4:4 | 5:4 8:2 10:2 | 10:3 9:1 8:2 6:2 | 8:2 6:2 4:2 6:2 | 7#:4 5:4';
MSCORE.f_frost={g:1.36,key:'F#',mode:'aeo',bpm:68,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'bell',i:'bell',o:5,v:1.3,lead:1,pan:.2,dl:.3},
    {n:'flute',i:'flute',o:4,v:.85,orn:1,lead:1,att:.16,pan:-.1},
    {n:'glit',t:'arp',i:'celesta',o:5,v:.35,ctr:2,pan:-.3,dl:.35,pat:'r:2 4:1 r:3 3:1 r:2 5:1 r:3 4:1 r:2'},
    {n:'harp',t:'arp',i:'harp',o:3,v:.35,ctr:0,pan:.3,pat:'0:4 1:4 2:4 3:4'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,vn:4,pat:true,att:2,rel:1.6,cut:800},
    {n:'bass',t:'bass',i:'bass',o:2,v:.6,pat:'R:16'}
  ],
  sec:{
    A:{ch:'1|6|3|7|1|6|4|5M',vol:{bell:1.2},bell:msX(MS1_FR,2)},
    B:{ch:'6|7|1|1|6|7|3|5M',flute:msX('1:4 3:4 | 2:6 r:2 | 3:4 5:4 | 5:6 r:2 | 6:4 8:4 | 7:6 9:2 | 10:4 12:4 | 7#:6 r:2',2)},
    A2:{ch:'1|6|3|7|1|6|4|5M',bell:msX(MS1_FR,2),flute:msX(MS1_FR,2)}
  }};
// ---- the Glimmerfrost and the Shiversea Floes: the same, sparse (bells and frost glitter, the ice creaking)
MSCORE.f_glimmer=ms1Var(MSCORE.f_frost,{set:{bpm:60,g:1.6},drop:['flute','harp'],form:['A','B'],
  sec:{B:{bell:'r:16 | r:8 9:8 | r:16 | 10:16 | r:16 | r:8 11:8 | r:16 | 12:16'}},
  add:[{n:'dr',t:'drum',v:.55,rv:.5,pat:{tom:'................|..........g.....|................|................'}}]});

// ---- Hearthold: a warm fireside tune in F, fiddle and lute and a soft horn, a frame drum like a heartbeat. In the
// middle, the lantern song on the flute (Gunnhild hums it while she works). Before the Great Hearth is lit
// (f_hearth_lit) the town plays f_hearthdim: the same tune in F minor on a lone flute, and the lantern song small and far
// away on a music box.
const MS1_HA='1:2 3:2 5:3 6:1 | 5:2 3:2 2:4 | 1:2 3:2 6:3 5:1 | 5:2 3:2 7:4 | 4:2 6:2 8:3 7:1 | 8:2 5:2 3:4';
MSCORE.f_hearthold={g:1.42,key:'F',mode:'ion',bpm:96,meter:4,step:2,swing:.12,form:['A','A2','B','A2'],
  parts:[
    {n:'fid',i:'fiddle',o:4,v:.9,orn:1,lead:1,pan:-.08},
    {n:'flute',i:'flute',o:4,v:.95,orn:1,lead:1,pan:.1},
    {n:'horn',i:'horn',o:3,v:.5,pan:.18},
    {n:'lute',t:'arp',i:'lute',o:3,v:.55,ctr:9,pan:-.28,pat:'0:1 1:1 2:1 1:1 3:1 1:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,pat:true,cut:900},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:3 r:1 5:2 r:2'},
    {n:'dr',t:'drum',v:.65,rv:.12,pat:{frame:'x...o...',shaker:'..g...g.'}}
  ],
  sec:{
    A:{ch:'1|5/7|6|3|4|1/3|2|5',vol:{fid:1.25},fid:MS1_HA+' | 6:3 5:1 4:2 2:2 | 5:6 r:2'},
    A2:{ch:'1|5/7|6|3|4|1/3|2 5|1',vol:{fid:1.2},fid:MS1_HA+' | 6:2 4:2 5:2 7:2 | 8:6 r:2',horn:'3:8 | 2:8 | 3:8 | 3:8 | 4:8 | 3:8 | 2:8 | 1:8'},
    B:{ch:MS_LANTERNC,flute:MS_LANTERN,dr:{frame:'x.......',shaker:'....g...'}}
  }};
MSCORE.f_hearthdim={g:1.42,key:'F',mode:'aeo',bpm:80,meter:4,step:2,form:['A','B'],
  parts:[
    {n:'flute',i:'flute',o:4,v:.9,orn:1,lead:1,att:.14,pan:.05},
    {n:'mbox',i:'mbox',o:5,v:1.2,lead:1,pan:.2,dl:.3},
    {n:'harp',t:'arp',i:'harp',o:3,v:.3,ctr:9,pan:-.3,pat:'0:4 1:4'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true,att:1.8,rel:1.6,cut:650},
    {n:'bass',t:'bass',i:'bass',o:2,v:.55,pat:'R:8'}
  ],
  sec:{
    A:{ch:'1|5/7|6|3|4|1/3|2|5M',flute:MS1_HA+' | 6:3 5:1 4:2 2:2 | 5:6 r:2'},
    B:{ch:MS_LANTERN_RMC,vol:{mbox:1.4},mbox:MS_LANTERN_RM}
  }};

// ---- the Windscour, the Cloudsea and the Sky Isles (and Skyreach Temple): B lydian, a flute riding the wind with its
// echo behind it, harp sweeps, wind chimes, a breathy choir, gusts on the shaker
const MS1_WA='5:2 8:2 9:2 10:2 | 9:6 6:2 | 5:2 8:2 9:2 10:2 | 11:6 9:2 | 10:4 8:2 6:2 | 9:4 7:2 5:2 | 6:2 9:2 11:2 13:2 | 12:8';
MSCORE.f_wind={g:1.27,key:'B',mode:'lyd',bpm:100,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'flute',i:'flute',o:3,v:1,orn:1,lead:1,pan:.08,dl:.35,att:.08},
    {n:'vox',i:'choir',o:3,v:.45,lead:1,att:.5,rel:1,f1:760,f2:1300,pan:-.12},
    {n:'harp',t:'arp',i:'harp',o:3,v:.5,ctr:2,pan:-.3,pat:'0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 6:1 5:1 4:1 3:1 2:1 1:1 0:1 1:1'},
    {n:'chime',t:'arp',i:'celesta',o:6,v:.28,ctr:0,pan:.4,dl:.4,pat:'r:3 2:1 r:5 1:1 r:2 3:1 r:3'},
    {n:'pad',t:'pad',i:'choir',o:3,v:.3,ctr:9,pat:true,att:2,rel:2,f1:700,f2:1250},
    {n:'bass',t:'bass',i:'bass',o:2,v:.6,pat:'R:12 5:4'},
    {n:'dr',t:'drum',v:.7,rv:.3,pat:{shaker:'g.o.x.o.g.......|................'}}
  ],
  sec:{
    A:{ch:'1|2M|1|2M|6|5|2M|5',flute:msX(MS1_WA,2)},
    B:{ch:'6|3|2M|5|6|3|2M|2M',flute:msX('6:4 8:4 | 10:6 7:2 | 9:4 11:4 | 12:6 r:2 | 13:4 12:2 10:2 | 10:4 12:4 | 13:4 11:4 | 9:8',2)},
    A2:{ch:'1|2M|1|2M|6|5|2M|5',flute:msX(MS1_WA,2),vox:msX(MS1_WA,2)}
  }};

// ---- Mount Dread and the Heart of Dread: C phrygian. A low chanting choir, a drone with the Shard's hum a half step
// above it (they beat against each other), slow thunder; then Glaciar's theme on bells, far off and wrong
MSCORE.f_dread={g:1.56,key:'C',mode:'phr',bpm:58,meter:4,step:4,form:['A','B'],
  parts:[
    {n:'chant',i:'choir',o:3,v:.9,lead:1,att:.5,rel:1,f1:420,f2:820,pan:-.05},
    {n:'bell',i:'bell',o:4,v:1.2,lead:1,pan:.25,dl:.35},
    {n:'choir',t:'pad',i:'choir',o:3,v:.35,ctr:8,pat:true,att:2,rel:2,f1:480,f2:850},
    {n:'drone',i:'drone',o:2,v:.75,cut:300},
    {n:'hum',i:'drone',o:3,v:.3,cut:700,lr:.3},
    {n:'dr',t:'drum',v:.75,rv:.3,pat:{taiko:'X...............|........o.......',tom:'................|............g.g.'}}
  ],
  sec:{
    A:{ch:'1|1|2|1|6|6|7|1',chant:msX('5:4 4:2 3:2 | 1:8 | 2:4 4:4 | 3:6 2:2 | 3:4 6:4 | 8:6 6:2 | 7:4 4:4 | 1:8',2),drone:'1:128',hum:'2:128'},
    B:{ch:'1|1|6|6|4|4|5M|5M',bell:msX(MS1_GZ8,2),drone:'1:128',hum:'2:128'}
  }};

// ---- the Glacier Maze (Ember's old North Forge, in ice): C sharp minor, glass bells and drips, a cold anvil ringing now
// and then; then the Emberblood leitmotif on bell and glass, because Ember built this place
MSCORE.f_glacier={g:1.3,key:'C#',mode:'aeo',bpm:72,meter:4,step:4,form:['A','B'],
  parts:[
    {n:'bell',i:'bell',o:5,v:1.2,lead:1,pan:.2,dl:.35},
    {n:'glass',i:'flute',o:4,v:.6,tri:0,h2:.05,br:.02,att:.35,lead:1,pan:-.15,dl:.3},
    {n:'drip',i:'drip',o:5,v:1.5,pan:-.3,dl:.45,rv:.6},
    {n:'anvil',i:'bell',o:4,v:.5,ratio:3.7,idx:3,mdec:.08,dec:.9,pan:.35,rv:.6},
    {n:'choir',t:'pad',i:'choir',o:3,v:.3,ctr:8,pat:true,att:2.5,rel:2.5,f1:500,f2:1100},
    {n:'drone',i:'drone',o:2,v:.6,cut:340}
  ],
  sec:{
    A:{ch:'1|1|6|6|4|4|5M|5M',vol:{bell:1.5},bell:'r:8 5:4 3:4 | 1:8 r:8 | r:8 6:4 5:4 | 3:16 | r:8 4:4 6:4 | 8:8 7#:8 | r:8 5:4 7#:4 | 5:16',
      drip:'r:10 8:1 r:20 5:1 r:26 10:1 r:12 3:1 r:26 7:1 r:29',anvil:'1:1 r:63 r:32 1:1 r:31',drone:'1:128'},
    B:{ch:'1|3|4|5M|1|4|5M|1',bell:msX(MS_LMm1+' | '+MS_LMm2,2),glass:msX(MS_LMm1+' | '+MS_LMm2,2),
      drip:'r:22 12:1 r:30 9:1 r:40 11:1 r:33',anvil:'r:64 1:1 r:63',drone:'1:128'}
  }};

// ---- Stonehorn Deep: A phrygian, made of drums. Taiko and toms you can feel in your feet, ram-horn calls on a low horn,
// strings answering in the middle
const MS1_ST='r:4 1:2 5:2 | 8:6 5:2 | 6:4 4:4 | 5:8 | 4:4 6:2 8:2 | 8:6 6:2 | 6:2 4:2 2:4 | 1:8';
MSCORE.f_stone={g:1.34,key:'A',mode:'phr',bpm:84,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'horn',i:'horn',o:3,v:1,lead:1,pan:.05},
    {n:'str',i:'strings',o:4,v:.75,lead:1,pan:-.12},
    {n:'str8',i:'strings',o:4,v:.42,pan:-.2},
    {n:'ost',t:'bass',i:'stac',o:2,v:.6,pan:-.2,pat:'R:2 R:1 R:1 8:2 R:2 R:2 b2:2 R:2 5:2'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.35,ctr:7,pat:true,att:1,f1:450,f2:800},
    {n:'bass',t:'bass',i:'bass',o:1,v:.7,pat:'R:16'},
    {n:'dr',t:'drum',v:.7,rv:.2,pat:{taiko:'X.......x...x...|X.....x.x...x...',tom:'............o.o.|..........o.o.oo',frame:'....g.......g...'}}
  ],
  sec:{
    A:{ch:'1|1|2|1|4|4|2|1',horn:msX(MS1_ST,2)},
    B:{ch:'6|6|7|7|6|6|2|2',str:msX('3:4 1:4 | 8:8 | 4:4 2:4 | 7:8 | 3:4 6:4 | 8:4 10:4 | 9:8 | 9:4 r:4',2)},
    A2:{ch:'1|1|2|1|4|4|2|1',horn:msX(MS1_ST,2),str8:msX(MS1_ST,2)}
  }};

// ---- Act III bosses (Old Bellows, Old Frostfeather, King Grumblehorn, Hush): F minor, brass and strings, icy bell stabs
const MS1_FB='1:2 5:2 8:3 7:1 | 7:2 5:2 2:4 | 6:2 4:2 3:2 1:2 | 5:2 7#:2 9:4 | 1:2 5:2 8:3 7:1 | 7:2 9:2 11:3 10:1 | 11:2 10:2 8:2 6:2 | 7#:6 r:2';
MSCORE.f_boss={g:1.22,key:'F',mode:'aeo',bpm:152,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'brass',i:'brass',o:4,v:.9,lead:1,pan:.05},
    {n:'str',i:'strings',o:4,v:.75,lead:1,pan:-.12},
    {n:'str8',i:'strings',o:5,v:.38,pan:-.2},
    {n:'ice',t:'arp',i:'bell',o:5,v:.55,ctr:2,pan:.3,dec:.8,pat:'2:2 r:6 1:2 r:2 0:2 r:2'},
    {n:'low',t:'bass',i:'stac',o:3,v:.55,pan:-.25,pat:'R:1 8:1 5:1 8:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.38,ctr:2,pat:true,att:.4},
    {n:'dr',t:'drum',v:.55,rv:.14,pat:{kick:'X.....x...x.....',snare:'....X.......X..g',hat:'o.g.o.g.o.g.o.g.',taiko:'X...............|........X.......'}}
  ],
  sec:{
    A:{ch:'1|7|6|5M|1|7|4|5M',brass:msX(MS1_FB,2)},
    B:{ch:'6|7|1|1|6|7|5M|5M',str:msX('3:4 4:2 3:2 | 4:4 2:2 4:2 | 3:2 5:2 8:4 | 8:6 r:2 | 6:4 8:2 6:2 | 7:4 9:2 7:2 | 7#:2 9:2 12:4 | 12:6 r:2',2)},
    A2:{ch:'1|7|6|5M|1|7|4|5M',brass:msX(MS1_FB,2),str8:msX(MS1_FB,2),dr:{kick:'X.....x...x.....',snare:'....X.......X..x',hat:'o.g.o.g.o.g.o.g.',taiko:'X.......x.......',crash:msHit('x',128)}}
  }};

// ---- Glaciar on the Crown of Dread: her own theme, broad, in B minor over a harp blizzard, then the Emberblood
// leitmotif on brass and bells (she is family, a very great-aunt), then everything at once
MSCORE.f_glaciar={g:1.08,key:'B',mode:'aeo',bpm:132,meter:4,step:4,intro:['I'],form:['A','B','A2'],
  parts:[
    {n:'str',i:'strings',o:3,v:.85,lead:1,pan:-.1},
    {n:'brass',i:'brass',o:3,v:.9,lead:1,pan:.08},
    {n:'str8',i:'strings',o:4,v:.36,pan:-.2},
    {n:'bell',i:'bell',o:4,v:.6,lead:1,pan:.25,dl:.25},
    {n:'harp',t:'arp',i:'harp',o:3,v:.4,ctr:5,pan:-.3,pat:'0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 6:1 5:1 4:1 3:1 2:1 1:1 2:1 3:1'},
    {n:'low',t:'bass',i:'stac',o:3,v:.55,pan:-.25,pat:'R:2 R:2 8:2 R:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.42,ctr:2,pat:true,att:.6},
    {n:'dr',t:'drum',v:.5,rv:.16,pat:{kick:'X..x..x...x..x..',snare:'....X.......X...',taiko:'X.......X...x...',hat:'g.g.o.g.g.g.o.g.'}}
  ],
  sec:{
    I:{ch:'1|5M',bell:'1,5,8:16 7#,9,12:16',mute:['low','bass','harp','choir'],dr:{taiko:'X...........x.x.|X...X...X.X.XXXX',crash:msHit('X',32)}},
    A:{ch:MS1_GZC,str:msX(MS1_GZ,2),bell:msX(MS1_GZ,2)},
    B:{ch:'1|3|4|5M|1|4|5M|1',brass:msX(MS_LMm1+' | '+MS_LMm2,2),bell:msX(MS_LMm1+' | '+MS_LMm2,2),vol:{choir:1.3},mute:['harp']},
    A2:{ch:MS1_GZC,brass:msX(MS1_GZ,2),str8:msX(MS1_GZ,2),dr:{kick:'X..x..x...x..x..',snare:'....X.......X...',taiko:'X.......X...x...',hat:'g.g.o.g.g.g.o.g.',crash:msHit('X',256)}}
  }};

// ---- the Hush (phase 3 of the Hush fight, "the music drops out"): only breath and a heartbeat
MSCORE.f_hushed={g:2.3,key:'F',mode:'aeo',bpm:60,meter:4,step:2,form:['A'],
  parts:[
    {n:'air',t:'pad',i:'choir',o:4,v:.3,ctr:7,pat:true,att:3,rel:3,f1:900,f2:1600},
    {n:'dr',t:'drum',v:.7,rv:.4,pat:{heart:'x..o............'}}
  ],
  sec:{A:{ch:'1|1|6|6'}}};

// ================= the lantern song as a scene (dialogue mood 'lantern'): music box, then flute with a celesta descant
MSCORE.lantern={g:1.36,key:'D',mode:'ion',bpm:72,meter:4,step:2,intro:['I'],form:['A','A2','B','A2'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.6,lead:1,pan:.12,dl:.22},
    {n:'flute',i:'flute',o:4,v:.95,orn:1,lead:1,att:.12,pan:-.05},
    {n:'des',i:'celesta',o:4,v:.45,pan:-.28,dl:.25},
    {n:'harp',t:'arp',i:'harp',o:3,v:.35,ctr:9,pan:-.3,pat:'0:2 1:2 2:2 1:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true,att:1.4,rel:1.4,cut:900},
    {n:'bass',t:'bass',i:'bass',o:2,v:.6,pat:'R:4 5:4'}
  ],
  sec:{
    I:{ch:'1|5s 5',mute:['bass']},
    A:{ch:MS_LANTERNC,vol:{mbox:1.3},mbox:MS_LANTERN},
    A2:{ch:MS_LANTERNC,flute:MS_LANTERN,des:'10:8 | 9:4 7:4 | 9:8 | 7:4 8:4 | 10:4 11:4 | 10:8 | 13:4 11:4 | 9:4 8:4'},
    B:{ch:'6|4|1|5|6|4|2|5',vol:{mbox:1.3},mbox:'6:2 5:2 3:4 | 4:2 6:2 8:4 | 5:2 3:2 1:4 | 2:6 r:2 | 3:2 5:2 6:4 | 8:2 6:2 4:4 | 4:2 6:2 9:4 | 7:6 r:2'}
  }};

// ================= stingers
// a Shard of the Ember Heart: the first line of the lantern song on a celesta, a bell chord after it
MSTING.shard={g:1.6,key:'D',mode:'ion',bpm:104,meter:4,step:2,intro:['S'],
  parts:[
    {n:'cel',i:'celesta',o:4,v:1,lead:1,pan:.12,dl:.25},
    {n:'bell',i:'bell',o:5,v:.5,lead:1,pan:-.2,dl:.3},
    {n:'harp',t:'arp',i:'harp',o:3,v:.5,ctr:9,pan:-.25,pat:'0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 c:8'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true,att:.2,rel:1.2}
  ],
  sec:{S:{ch:'1|57 1',cel:'1:3 3:1 5:2 3:2 | 4:2 2:2 1:4',bell:'r:8 | r:4 8,10,12:4'}}};
// the Great Clock of Gearhaven striking again (Westminster-style chimes, then two deep strokes)
MSTING.c_chime={g:1.5,key:'E',mode:'ion',bpm:112,meter:4,step:2,intro:['S'],
  parts:[
    {n:'bell',i:'bell',o:4,v:1.3,lead:1,pan:.1,dec:2.2},
    {n:'bong',i:'bell',o:2,v:1.5,lead:1,ratio:2.76,idx:2.5,mdec:.6,dec:4,pan:-.05},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,pat:true,att:.3,rel:1.5}
  ],
  sec:{S:{ch:'1|5|1|1',bell:'3:2 2:2 1:2 -2:2 | 1:2 3:2 2:2 -2:2 | r:8 | r:8',bong:'r:16 | 1:8 | 1:8'}}};

// ================= routing: which of these plays where (wraps musicMood; Act I places, maps 3 and 4 and every m_ and
// n_ name are left alone for the other music module)
const MUS1_THEMES=['c_downs','c_coast','c_gearhaven','c_gearstop','c_saltmarsh','c_brass','c_mothwood','c_spire','c_seacave','c_light','c_boss','c_mothmask','c_vesper',
  'f_frost','f_glimmer','f_hearthold','f_hearthdim','f_wind','f_dread','f_glacier','f_stone','f_boss','f_glaciar','f_hushed','lantern'];
const MUS1_MINE=new Set(MUS1_THEMES);
// the Act I score: a place set to one of these (the bible's fallbacks) gets the act's own theme from the tables below
const MUS1_STOCK=new Set(['menu','village','town','meadow','forest','road','crags','mire','frost','cinder','night','house','inn','cave','deep','puzzle','combat','boss','final','victory','arena','dead','tender']);
const mus1Gear=()=>G.flags&&G.flags.c_clock_on?'c_gearhaven':'c_gearstop';
const mus1Hearth=()=>G.flags&&G.flags.f_hearth_lit?'f_hearthold':'f_hearthdim';
// towns (POI keys) and biomes (ids 10 to 29) on maps 1 and 2; a function picks by story state
const MUS1_TOWN={c_gearhaven:mus1Gear,c_saltmarsh:'c_saltmarsh',c_gullsrest:'c_coast',c_lanternpt:'c_coast',
  f_hearthold:mus1Hearth,f_rimeholm:()=>G.flags&&G.flags.f_ylva?'village':'tender',f_haskrest:'f_hearthold'};
const MUS1_BIOME={10:'c_downs',11:'c_coast',12:mus1Gear,13:'c_brass',14:'c_saltmarsh',15:'c_coast',16:'c_coast',17:'c_coast',18:'c_mothwood',19:'c_spire',
  20:'f_frost',21:'f_frost',22:'f_glimmer',23:'f_wind',24:'f_frost',26:'f_glimmer',27:'f_dread',28:'f_frost',29:'f_wind'};   // 25 Stonehorn keeps its 'crags'
// these keep playing at night (they are night places already); everywhere else nights get the lullaby, as in Act I
const MUS1_NIGHTKEEP={c_mothwood:1,c_spire:1,f_dread:1,f_wind:1};
// areas by id (or dungeon root id); used when the stock answer is a cave, house or inn tune (puzzle rooms keep 'puzzle')
const MUS1_AREA={c_gullcrag:'c_seacave',c_brassworks:'c_brass',c_lighthouse:'c_light',c_spire:'c_spire',c_tidehouse:'puzzle',c_mothnest:'c_vesper',
  f_maze:'f_glacier',f_sky:'f_wind',f_deep:'f_stone',f_dread:'f_dread'};
const MUS1_BOSS={c_mothmask:'c_mothmask',f_glaciar:'f_glaciar'};   // any other c_ boss plays c_boss, any other f_ boss f_boss
const MUS1_MOOD={vesper:'c_vesper',c_mask:'c_vesper',mothwaltz:'c_vesper',moth_waltz:'c_vesper',mothmask:'c_vesper',
  lanternsong:'lantern',lantern_song:'lantern',lullaby_lantern:'lantern'};
const MUS1_VESPER={c_vesper:1,c_mask:1};
const mus1Val=t=>typeof t==='function'?t():t;
// a place set to a custom theme somebody else wrote is left alone
const mus1Custom=n=>!!(n&&MSCORE[n]&&!MUS1_STOCK.has(n)&&!MUS1_MINE.has(n));
let mus1G=null;
// where Ash stands outdoors, in the stock direction's terms (town first, then biome); recomputed per 32 px cell
function mus1Geo(){
  const cx=Math.floor(player.x/32), cy=Math.floor(player.y/32);
  if(mus1G&&mus1G.cx===cx&&mus1G.cy===cy) return mus1G;
  let town=null, b=-1;
  for(const k in TOWN_KEYS){ const p=POI[k]; if(p&&dist2(player.x,player.y,p.x,p.y)<(p.r+80)**2){ town=k; break; } }
  if(!town) b=biomeInfo(player.x,player.y,{}).b;
  return (mus1G={cx,cy,town,b});
}
// the act's theme for a spot ({town,b}), or null when the tables say nothing
function mus1Want(geo,night){
  if(geo.town){ if(!(geo.town in MUS1_TOWN)) return null; return night?'night':mus1Val(MUS1_TOWN[geo.town]); }
  if(!(geo.b in MUS1_BIOME)) return null;
  const w=mus1Val(MUS1_BIOME[geo.b]);
  return night&&!MUS1_NIGHTKEEP[w]?'night':w;
}
function mus1AreaTheme(id){
  if(!id) return null;
  if(MUS1_AREA[id]) return MUS1_AREA[id];
  let best=null; for(const k in MUS1_AREA) if(id.startsWith(k+'_')&&(!best||k.length>best.length)) best=k;
  return best?MUS1_AREA[best]:null;
}
// a dialogue with at least three of Vesper's lines and no mood of its own plays her theme (maps 1 and 2 only)
function mus1VesperScene(D){
  let n=0;
  for(const L of D.lines||[]){ let w=Array.isArray(L)?L[0]:L&&L.who; try{ if(typeof w==='function') w=w(); }catch(e){ w=null; } if(MUS1_VESPER[w]) n++; }
  return n>=3;
}
// m is what the stock direction (and every module before this one) chose; return a new name, null for silence, or
// undefined to keep m
function mus1Route(m){
  if(!G||!player||scene==='menu'||scene==='dead'||scene==='dying'||scene==='victory') return;
  if(DLG&&DLG.mood){ const a=MUS1_MOOD[DLG.mood]; return a&&m===DLG.mood&&!MSCORE[m]?a:undefined; }
  const b=G.boss&&!G.boss.dead?G.boss:null;
  if(b){
    const t=String(b.type||''); if(!/^[cf]_/.test(t)) return;
    if(b.musicOff) return null;
    if(m!=='boss'&&!MUS1_MINE.has(m)) return;          // a defineBoss music of somebody else's: keep it
    if(b.musicName&&MSCORE[b.musicName]) return b.musicName;
    if(t==='f_hush'&&(b.bph||0)>=2) return 'f_hushed';
    if(m!=='boss') return;
    return MUS1_BOSS[t]||(t[0]==='c'?'c_boss':'f_boss');
  }
  if(G.mode==='normal'||(G.mini&&G.mini.music)||m==='combat') return;
  const mk=curMap();
  if(DLG&&(mk===1||mk===2)){
    if(DLG._mus1==null) DLG._mus1=mus1VesperScene(DLG)?'c_vesper':'';
    if(DLG._mus1) return DLG._mus1;
  }
  if(AREA){
    const id=String((AREA.def&&AREA.def.id)||AREA.id||''); if(!/^[cf]_/.test(id)) return;
    if(m!=='cave'&&m!=='deep'&&m!=='house'&&m!=='inn') return;
    const root=typeof dunRoot==='function'?dunRoot(id):id;
    const t=mus1AreaTheme(root)||mus1AreaTheme(id);
    if(t) return MSCORE[t]?t:undefined;
    if(m==='cave'||m==='deep') return id[0]==='c'?'c_seacave':'f_glacier';
    return;
  }
  if(mk!==1&&mk!==2) return;
  const geo=mus1Geo(), night=isNight();
  const conf=geo.town?TOWN_KEYS[geo.town]:(MUSIC_BIOME[geo.b]||'meadow');
  if(m!==(night?'night':conf)) return;                 // something upstream chose this on purpose
  if(mus1Custom(conf)) return;
  const w=mus1Want(geo,night);
  return w&&MSCORE[w]?w:undefined;
}
{ const base=musicMood; musicMood=function(dt){
    const m=base.apply(this,arguments);
    let r; try{ r=mus1Route(m); }catch(e){ r=undefined; }
    return r===undefined?m:r; }; }

window.__ebX=Object.assign(window.__ebX||{},{mus1:{themes:MUS1_THEMES,route:m=>mus1Route(m),want:(geo,night)=>mus1Want(geo,night),geo:()=>{ mus1G=null; return mus1Geo(); },
  mood:()=>musicMood(0),area:id=>mus1AreaTheme(id),score:MSCORE,stings:MSTING,
  // tests only: the theme the direction picks for a made-up moment ({area, ow, boss, dlg, mini}); everything is put back
  probe(o){ const sA=AREA, sB=G.boss, sD=DLG, sO=G.ow, sM=G.mini;
    try{ if(o.area!==undefined) AREA=o.area; if(o.ow!==undefined) G.ow=o.ow; if(o.boss!==undefined) G.boss=o.boss; if(o.dlg!==undefined) DLG=o.dlg; if(o.mini!==undefined) G.mini=o.mini; mus1G=null; return musicMood(0); }
    finally{ AREA=sA; G.boss=sB; DLG=sD; G.ow=sO; G.mini=sM; mus1G=null; } },
  // tests only: a stand-in town (POI and town music) where the real map is not built yet
  fakeTown(key,p,music){ POI[key]=Object.assign({name:key,level:1,town:true},p); TOWN_KEYS[key]=music; mus1G=null; return TOWN_KEYS[key]; },
  BIOME:MUS1_BIOME,TOWN:MUS1_TOWN,AREA:MUS1_AREA,BOSS:MUS1_BOSS,MOOD:MUS1_MOOD,
  lantern:{mel:MS_LANTERN,ch:MS_LANTERNC,waltz:MS_LANTERN3,waltzCh:MS_LANTERN3C,rev:MS_LANTERN_REV,revCh:MS_LANTERN_REVC}}});
