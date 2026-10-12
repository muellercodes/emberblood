
// ================= music (procedural score, WebAudio)
// Interface used by the rest of the game:
//   Music.init()            call after a user gesture (SFX.init() first)
//   Music.setTheme(name)    crossfade to a theme; same name again is a no-op; null fades to silence
//   Music.stinger(name)     one-shot musical cue over the current theme (ducks the theme)
//   Music.toggle()          returns new muted state; persisted in localStorage 'eb_music_off'
//   Music.muted             true when music is off
//   Music.duck(on)          lower music while dialogue is open
//   Music.setVolume(v)      0..1 (default 0.5)
//   Music._renderOffline(name,sec)  renders a theme or stinger to an AudioBuffer (testing)
//
// Score notation (all data below is hand written):
//   theme: key, mode, bpm, meter (beats per bar), step (steps per beat), sections in sec{}, play order in form[]
//   (intro[] plays once first). Each section has ch: chords per bar split by '|' (several chords in a bar share it
//   evenly). A chord is a scale degree, optional b/# before it, optional quality M m d s(sus4) q(sus2) + j(maj7),
//   optional 7, optional /bass degree.
//   Melody tokens 'deg:len' (deg 1 = tonic, 8 = octave up, 0 and below go under the tonic, # or b after it,
//   'r' rest, '1,3,5' plays several degrees, '@0.5' sets velocity). len is in steps.
//   bass tokens: R (root or slash bass), 3, 5, 7, 8, L (fifth below), N (next chord), b2 2 b3 4 b5 b6 6 b7 9.
//   arp tokens: chord tone index (0 lowest, past the top wraps an octave up) or c (whole chord).
//   drums: one character per step, X x o g are hits from loud to ghost, '.' is a rest.
//   g: per-theme gain, set by measuring offline renders so themes sit within about 1 dB of each other
//   (around -29.5 dBFS RMS at the default volume; cave, night, tender and the other quiet ones a little lower).
const MSCORE={}, MSTING={};
function msX(s,k){ return s.replace(/:(\d+(?:\.\d+)?)/g,(m,n)=>':'+(+n*k)); }
function msHit(c,n){ return c+'.'.repeat(n-1); }

// ---- the leitmotif ("Emberblood"), eighth-note grid in 4/4
// question phrase (I iii ii V) then answer (I IV V I), climbing to the high tonic
const MS_LM1='-2:2 1:3 2:1 3:2 | 5:6 4:1 3:1 | 2:2 3:1 2:1 1:2 -1:2 | 2:6 r:2';
const MS_LM2='-2:2 1:3 2:1 3:2 | 6:4 5:2 8:2 | 7:3 8:1 9:2 7:2 | 8:6 r:2';
const MS_LMC='1|3|2|5|1|4|5|1';
// minor transformation for Vorlaxis (i III iv V | i iv V i), raised 7th over V
const MS_LMm1='-2:2 1:3 2:1 3:2 | 5:6 4:1 3:1 | 4:2 5:1 4:1 3:2 1:2 | 2:6 r:2';
const MS_LMm2='-2:2 1:3 2:1 3:2 | 6:4 5:2 8:2 | 7#:3 8:1 9:2 7#:2 | 8:6 r:2';
// the menu's contrasting B tune (vi IV I V vi IV ii V)
const MS_MB='6:3 5:1 3:4 | 4:3 3:1 1:4 | 3:2 5:2 8:3 7:1 | 6:2 5:6 | 6:3 5:1 3:4 | 4:3 6:1 8:4 | 9:3 8:1 6:2 4:2 | 5:6 r:2';
const MS_MBC='6|4|1|5|6|4|2|5';

MSCORE.menu={g:1.315,key:'D',mode:'ion',bpm:88,meter:4,step:2,intro:['I'],form:['A','B','A2'],
  parts:[
    {n:'lead',i:'flute',o:5,v:1,orn:1,lead:1,pan:.05},
    {n:'brass',i:'horn',o:4,v:.5,pan:.18},
    {n:'str',i:'strings',o:4,v:.8,pan:-.18},
    {n:'harp',t:'arp',i:'harp',o:4,v:.5,ctr:2,pan:.3,pat:'0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.55,ctr:9,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.9,pat:'R:4 5:2 8:2'},
    {n:'dr',t:'drum',v:.8,rv:.15}
  ],
  sec:{
    I:{ch:'1|5s 5',mute:['bass']},
    A:{ch:MS_LMC,lead:MS_LM1+' | '+MS_LM2,dr:{taiko:'o.......|........|........|........'}},
    B:{ch:MS_MBC,str:MS_MB,dr:{taiko:'x.......|....o...',frame:'....g...'}},
    A2:{ch:MS_LMC,lead:MS_LM1+' | '+MS_LM2,brass:MS_LM1+' | '+MS_LM2,
      str:'5:8 | 5:4 7:4 | 6:8 | 5:8 | 3:8 | 4:4 6:4 | 5:4 7:4 | 8:8',bass:'R:2 R:1 R:1 5:2 8:2',
      dr:{taiko:'X.....x.|x...o...|X.....x.|x.x.o.o.',snare:'........|........|........|......gg'}}
  }};

// ---- Emberhollow: cozy folk, G major, a tune to hum. B quotes the leitmotif.
const MS_VC='1|4 1|1|5|1|4|5|1';
const MS_V6='1:1 1:1 3:2 5:3 3:1 | 4:2 6:2 5:2 4:2 | 3:2 5:2 8:3 5:1 | 7:2 6:2 5:4 | 1:1 1:1 3:2 5:3 3:1 | 4:2 6:2 8:2 6:2';
MSCORE.village={g:1.308,key:'G',mode:'ion',bpm:100,meter:4,step:2,swing:.14,form:['A','A2','B','A2'],
  parts:[
    {n:'flute',i:'flute',o:4,v:1,orn:1,lead:1,pan:.12},
    {n:'fid',i:'fiddle',o:4,v:.85,orn:1,lead:1,pan:-.12},
    {n:'des',i:'flute',o:4,v:.38,pan:.32},
    {n:'lute',t:'arp',i:'lute',o:3,v:.6,ctr:9,pan:-.28,pat:'0:1 1:1 2:1 1:1 3:1 1:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.3,ctr:9,pat:true,cut:900},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2 r:1 R:1 5:2 r:2'},
    {n:'dr',t:'drum',v:.7,rv:.1,pat:{frame:'x...o...',shaker:'.g.o.g.o'}}
  ],
  sec:{
    A:{ch:MS_VC,flute:MS_V6+' | 5:2 7:1 6:1 5:2 2:2 | 1:6 r:2'},
    A2:{ch:MS_VC,fid:MS_V6+' | 2:2 3:1 4:1 5:2 7:2 | 8:6 r:2',des:'10:6 9:2 | 8:8 | 10:4 12:4 | 11:4 9:4 | 10:6 9:2 | 8:4 11:4 | 9:4 7:4 | 8:8'},
    B:{ch:'1|3|4 1|5|6|4|2|5',flute:'-2:2 1:3 2:1 3:2 | 5:6 4:1 3:1 | 4:2 6:2 5:2 4:2 | 2:6 r:2 | 3:2 5:2 6:3 5:1 | 4:2 6:2 8:4 | 6:3 5:1 4:2 2:2 | 5:6 r:2',
      lute:'0:2 1:2 2:2 1:2',dr:{frame:'o.......',shaker:'...g...g'}}
  }};

// ---- market towns: D mixolydian, bustling, reed pipe and lute
const MS_TC='1|7|1|4 5|1|7 5|4 5|1';
const MS_TA='5:1 6:1 5:1 3:1 1:2 3:2 | 4:1 3:1 2:1 3:1 4:2 2:2 | 5:1 6:1 5:1 3:1 8:2 7:2 | 6:2 4:2 5:2 7:2 | 8:3 7:1 6:1 5:1 3:2 | 4:1 5:1 7:2 5:2 4:2 | 3:1 4:1 6:2 5:1 4:1 2:2 | 1:4 r:4';
MSCORE.town={g:1.384,key:'D',mode:'mix',bpm:112,meter:4,step:2,swing:.1,form:['A','A2','B','A2'],
  parts:[
    {n:'reed',i:'reed',o:4,v:.85,orn:1,lead:1,pan:-.1},
    {n:'flute',i:'flute',o:5,v:.4,pan:.2},
    {n:'fl2',i:'flute',o:4,v:.9,orn:1,lead:1,pan:.1},
    {n:'lute',t:'arp',i:'lute',o:3,v:.75,ctr:10,pan:.28,pat:'r:1 c:1 r:1 c:1 r:1 c:1 r:1 c:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:3 5:3 8:2'},
    {n:'dr',t:'drum',v:.72,rv:.1,pat:{frame:'X..x..x.',shaker:'.o.o.o.o'}}
  ],
  sec:{
    A:{ch:MS_TC,reed:MS_TA},
    A2:{ch:MS_TC,reed:MS_TA,flute:MS_TA},
    B:{ch:'4|4|1|1|4|5|7|1',fl2:'6:3 5:1 4:2 6:2 | 8:4 6:2 5:2 | 5:3 3:1 1:2 3:2 | 5:6 r:2 | 6:3 5:1 4:2 6:2 | 9:4 8:2 7:2 | 7:3 6:1 5:2 4:2 | 3:2 2:2 1:4',
      dr:{frame:'x..o..o.',shaker:'.g.o.g.o'}}
  }};

// ---- meadow: F lydian, airy and unhurried
MSCORE.meadow={key:'F',mode:'lyd',bpm:76,meter:4,step:2,form:['A','B','A2'],
  parts:[
    {n:'flute',i:'flute',o:4,v:1,orn:1,lead:1,att:.09},
    {n:'cel',i:'celesta',o:5,v:.4,pan:.35},
    {n:'harp',t:'arp',i:'harp',o:4,v:.5,ctr:0,pan:-.3,pat:'0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true,att:1.2,cut:1000},
    {n:'bass',t:'bass',i:'bass',o:2,v:.75,pat:'R:6 5:2'}
  ],
  sec:{
    A:{ch:'1|2|1|2|6|3|5|1',flute:'5:4 3:2 5:2 | 6:6 5:1 4:1 | 5:8 | 4:2 5:2 6:4 | 8:4 6:2 8:2 | 7:6 5:2 | 7:3 6:1 5:2 7:2 | 8:8'},
    B:{ch:'6|3|2|5|6|3|2|5',flute:'6:3 5:1 3:4 | 3:3 5:1 7:4 | 6:3 7:1 6:2 4:2 | 5:8 | 6:3 8:1 10:4 | 9:3 8:1 7:4 | 6:4 4:4 | 5:6 r:2',harp:'0:2 1:2 2:2 1:2'},
    A2:{ch:'1|2|1|2|6|3|5|1',flute:'5:4 3:2 5:2 | 6:6 5:1 4:1 | 5:8 | 4:2 5:2 6:4 | 8:4 6:2 8:2 | 7:6 5:2 | 7:3 6:1 5:2 7:2 | 8:8',
      cel:'5:4 3:2 5:2 | 6:6 5:1 4:1 | 5:8 | 4:2 5:2 6:4 | 8:4 6:2 8:2 | 7:6 5:2 | 7:3 6:1 5:2 7:2 | 8:8'}
  }};

// ---- Whisperwood: E dorian, harp arpeggios, soft flute, a celesta that answers
const MS_FA=msX('r:2 5:2 3:3 2:1 | 1:2 2:2 6:4 | 5:6 4:1 3:1 | 6:2 5:2 4:4 | 5:3 6:1 7:4 | 9:4 8:2 7:2 | 6:4 5:2 4:2 | 5:6 r:2',2);
MSCORE.forest={g:1.261,key:'E',mode:'dor',bpm:72,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'flute',i:'flute',o:4,v:1,orn:1,lead:1,att:.1,pan:.08},
    {n:'cel',i:'celesta',o:4,v:.55,pan:.3,dl:.25},
    {n:'harp',t:'arp',i:'harp',o:3,v:.55,ctr:9,pan:-.25,pat:'0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.45,ctr:9,pat:true,att:1.4,cut:800},
    {n:'choir',t:'pad',i:'choir',o:3,v:.35,ctr:10,att:1.5},
    {n:'bass',t:'bass',i:'bass',o:2,v:.7,pat:'R:12 5:4'}
  ],
  sec:{
    A:{ch:'1|4|1|4|3|7|4|5',flute:MS_FA},
    B:{ch:'7|4|1|1|7|4|5|5',cel:msX('r:4 11:2 9:2 | 8:8 | r:4 12:2 10:2 | 8:8 | r:4 9:2 11:2 | 13:8 | 12:4 11:4 | 12:8',2),choir:true},
    A2:{ch:'1|4|1|4|3|7|4|5',flute:MS_FA,choir:true,mute:['pad']}
  }};

// ---- the Ashen Road: A minor, low string ostinato, a horn that warns
MSCORE.road={g:1.632,key:'A',mode:'aeo',bpm:96,meter:4,step:4,form:['A','B','A2','B'],
  parts:[
    {n:'ost',t:'bass',i:'stac',o:3,v:.8,pan:-.15,pat:'R:1 R:1 8:1 R:1 4:1 R:1 5:1 R:1'},
    {n:'hi',i:'strings',o:4,v:.85,att:.9,pan:.2},
    {n:'horn',i:'horn',o:3,v:.9,lead:1,pan:.1},
    {n:'choir',t:'pad',i:'choir',o:3,v:.3,ctr:9,pat:true,att:1.6},
    {n:'sub',t:'bass',i:'bass',o:1,v:.7,pat:'R:16'},
    {n:'dr',t:'drum',v:.6,rv:.2,pat:{taiko:'X.........x.....',frame:'......g.......g.'}}
  ],
  sec:{
    A:{ch:'1|1|6|6|4|4|5M|5M',hi:'5:16 | 6:16 | 6:16 | 5:16 | 4:16 | 6:16 | 5:16 | 7#:8 5:8'},
    B:{ch:'1|5M|1|1|4|1|5M|5M',horn:msX('1:3 2:1 3:4 | 2:3 1:1 0#:4 | 1:8 | r:8 | 4:3 3:1 2:4 | 3:3 2:1 1:4 | 0#:8 | r:8',2)},
    A2:{ch:'1|1|6|6|4|4|5M|5M',hi:'5:16 | 6:16 | 6:16 | 5:16 | 4:16 | 6:16 | 5:16 | 7#:8 5:8',
      dr:{taiko:'X.........x.....',snare:'....g.......g...',frame:'......g.....g.g.'}}
  }};

// ---- the Drakeling Crags: C mixolydian, bold, galloping
MSCORE.crags={g:1.399,key:'C',mode:'mix',bpm:120,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'brass',i:'brass',o:4,v:.85,orn:1,lead:1,pan:.08},
    {n:'str',i:'strings',o:4,v:.75,lead:1,pan:-.12},
    {n:'str8',i:'strings',o:5,v:.4,pan:-.2},
    {n:'ost',t:'arp',i:'stac',o:3,v:.55,ctr:7,pan:.25,pat:'2:2 1:1 0:1 2:2 1:1 0:1 2:2 1:1 0:1 2:2 1:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2 R:1 R:1 R:2 R:1 R:1 5:2 5:1 5:1 8:2 5:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,pat:true},
    {n:'dr',t:'drum',v:.6,rv:.14,pat:{kick:'x.......x.x.....',snare:'....x.......x...',hat:'o.g.o.g.o.g.o.g.',taiko:'X...............|................'}}
  ],
  sec:{
    A:{ch:'1|7|1|4 5|1|7|4|1',brass:msX('5:2 5:1 6:1 5:2 3:2 | 4:2 2:1 4:1 7:4 | 8:3 7:1 5:2 3:2 | 6:2 4:2 5:4 | 5:2 5:1 6:1 5:2 8:2 | 9:3 8:1 7:2 6:2 | 6:2 8:2 7:2 6:2 | 8:6 r:2',2)},
    B:{ch:'4|5|6|7|4|5|7|1',str:msX('1:2 4:2 6:4 | 5:2 7:2 9:4 | 10:4 8:2 6:2 | 9:6 r:2 | 8:2 6:2 4:4 | 5:2 7:2 9:2 8:2 | 7:4 9:4 | 8:8',2),
      dr:{kick:'x.......x.......',snare:'....x.......x..g',hat:'o...o...o...o...',taiko:'X...............|........x.......'}},
    A2:{ch:'1|7|1|4 5|1|7|4|1',brass:msX('5:2 5:1 6:1 5:2 3:2 | 4:2 2:1 4:1 7:4 | 8:3 7:1 5:2 3:2 | 6:2 4:2 5:4 | 5:2 5:1 6:1 5:2 8:2 | 9:3 8:1 7:2 6:2 | 6:2 8:2 7:2 6:2 | 8:6 r:2',2),
      str8:msX('5:2 5:1 6:1 5:2 3:2 | 4:2 2:1 4:1 7:4 | 8:3 7:1 5:2 3:2 | 6:2 4:2 5:4 | 5:2 5:1 6:1 5:2 8:2 | 9:3 8:1 7:2 6:2 | 6:2 8:2 7:2 6:2 | 8:6 r:2',2)}
  }};

// ---- Mirefen: B phrygian with whole-tone shadows, bubbling low plucks, a lonely ocarina
MSCORE.mire={g:1.367,key:'B',mode:'phr',bpm:70,meter:4,step:4,form:['A','B'],
  parts:[
    {n:'oca',i:'ocarina',o:3,v:1,orn:1,lead:1,pan:.1},
    {n:'cel',i:'celesta',o:5,v:.45,pan:.35,dl:.35},
    {n:'bub',t:'arp',i:'bubble',o:3,v:.75,ctr:5,pan:-.25,pat:'0:1 r:2 0:1 r:1 2:1 r:3 1:1 r:2 0:1 r:3'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.25,ctr:9,pat:true,att:2,f1:500,f2:900},
    {n:'drone',i:'drone',o:2,v:.6,cut:260},
    {n:'dr',t:'drum',v:1.5,rv:.35,pat:{tock:'..........o.....|................|......g.........|................'}}
  ],
  sec:{
    A:{ch:'1|2|1|2+|7|2|1|1',oca:msX('r:4 1:2 2:2 | 2:6 r:2 | r:4 3:2 2:2 | 4:4 2:4 | r:2 7:2 6:2 4:2 | 2:6 r:2 | 1:4 0:2 1:2 | r:8',2),drone:'1:128'},
    B:{ch:'6|2+|6|2+|1|2|1|1',oca:msX('r:8 | 3:3 2:1 1:4 | r:8 | 4:3 3:1 2:4 | r:4 1:2 2:2 | 3:8 | 2:4 1:4 | 1:8',2),
      cel:msX('r:8 | 6#:1 5:1 4:1 3:1 2:4 | r:8 | r:4 6#:1 5:1 4:1 3:1 | r:8 | r:8 | r:8 | r:8',2),drone:'1:128'}
  }};

// ---- Frostpine Highlands: D lydian, glassy bells, slow and wide
MSCORE.frost={g:1.465,key:'D',mode:'lyd',bpm:64,meter:4,step:2,form:['A','B'],
  parts:[
    {n:'bell',i:'bell',o:5,v:1.5,lead:1,pan:.25,dl:.3},
    {n:'flute',i:'flute',o:4,v:.9,orn:1,lead:1,att:.14,pan:-.05},
    {n:'harp',t:'arp',i:'harp',o:4,v:.4,ctr:0,pan:-.35,pat:'0:2 1:2 2:2 3:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.55,ctr:9,vn:4,pat:true,att:1.8,rel:1.5,cut:1300},
    {n:'bass',t:'bass',i:'bass',o:2,v:.65,pat:'R:8'}
  ],
  sec:{
    A:{ch:'1|2|6|3|1|2|5|5',bell:'5:2 3:2 1:4 | 4:2 6:2 9:4 | 8:4 6:4 | 7:6 r:2 | 5:2 3:2 1:4 | 4:2 6:2 9:2 11:2 | 9:4 7:4 | 5:6 r:2'},
    B:{ch:'6|3|1|5|6|3|2|2',flute:'6:4 5:2 3:2 | 3:6 5:2 | 8:4 7:2 6:2 | 5:8 | 6:4 8:2 10:2 | 9:6 7:2 | 9:4 11:4 | 9:8',
      bell:'r:8 | r:4 10:4 | r:8 | 12:8 | r:8 | r:4 14:4 | r:8 | 13:8'}
  }};

// ---- the Cinderlands: D phrygian, a drone under low brass, deep drums
MSCORE.cinder={g:1.276,key:'D',mode:'phr',bpm:76,meter:4,step:4,form:['A','B'],
  parts:[
    {n:'horn',i:'horn',o:3,v:1,lead:1,pan:.05},
    {n:'drone',i:'drone',o:2,v:.8,cut:300},
    {n:'choir',t:'pad',i:'choir',o:3,v:.4,ctr:8,pat:true,att:1.5,f1:550,f2:950},
    {n:'ost',t:'bass',i:'stac',o:2,v:.5,pat:'R:2 r:2 R:1 R:1 r:2 R:2 r:2 b2:2 r:2'},
    {n:'dr',t:'drum',v:.6,rv:.25,pat:{taiko:'X.......x...x...|X.......x.x.x...',tom:'..............o.|..........o...o.'}}
  ],
  sec:{
    A:{ch:'1|1|2|2|1|1|7|2',horn:msX('1:6 2:2 | 1:8 | 2:4 4:4 | 3:6 2:2 | 1:3 2:1 3:2 5:2 | 4:6 3:1 2:1 | 0:8 | 2:8',2),drone:'1:128'},
    B:{ch:'4|4|2|2|4|4|5M|5M',horn:msX('4:6 5:2 | 6:8 | 5:4 4:4 | 2:8 | 4:6 5:2 | 6:4 8:4 | 7#:8 | 5:8',2),drone:'1:128'}
  }};

// ---- night: a 3/4 lullaby on the music box
MSCORE.night={g:1.57,key:'F',mode:'ion',bpm:72,meter:3,step:2,form:['A','A2','B','A2'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.8,lead:1,pan:.12,dl:.2},
    {n:'harp',t:'arp',i:'harp',o:3,v:.25,ctr:9,pan:-.25,pat:'0:2 1:2 2:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.45,ctr:9,pat:true,att:1.8,rel:1.6,cut:800},
    {n:'bass',t:'bass',i:'bass',o:2,v:.55,pat:'R:6'}
  ],
  sec:{
    A:{ch:'1|3|4|1|6|4|2|5',mbox:'3:4 2:1 1:1 | 3:2 5:2 7:2 | 6:4 5:1 4:1 | 3:6 | 1:2 3:2 6:2 | 5:4 4:2 | 2:4 4:2 | 2:6'},
    A2:{ch:'1|3|4|1|6|4|5|1',mbox:'3:4 2:1 1:1 | 3:2 5:2 7:2 | 6:4 5:1 4:1 | 3:6 | 1:2 3:2 6:2 | 5:4 4:2 | 5:4 2:2 | 1:6'},
    B:{ch:'4|1|4|1|6|3|2|5',mbox:'r:4 8:2 | 5:6 | r:4 8:2 | 10:6 | r:2 9:2 8:2 | 7:6 | 6:4 5:2 | 5:6',mute:['harp']}
  }};

// ---- homes and shops: a fireside waltz in C
const MS_HA='5:2 3:1 4:1 5:2 | 8:4 6:2 | 6:2 4:1 5:1 6:2 | 7:4 5:2 | 5:2 3:1 4:1 5:2 | 10:4 7:2 | 8:2 6:1 7:2 5:1 | 8:6';
MSCORE.house={g:1.782,key:'C',mode:'ion',bpm:100,meter:3,step:2,form:['A','B','A2'],
  parts:[
    {n:'lead',i:'lute',o:4,v:1.6,lead:1,dec:.6,pan:.08},
    {n:'mbox',i:'mbox',o:4,v:1,pan:.3},
    {n:'mb8',i:'mbox',o:5,v:.35,pan:.3},
    {n:'chd',t:'arp',i:'lute',o:3,v:.45,ctr:9,pan:-.25,pat:'r:2 c:2 c:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.25,ctr:9,pat:true,cut:800},
    {n:'bass',t:'bass',i:'bass',o:2,v:.75,pat:'R:2 r:4'}
  ],
  sec:{
    A:{ch:'1|6|2|5|1|3|4 5|1',lead:MS_HA},
    B:{ch:'4|1|4|5|4|1|2 5|1',lead:'6:4 8:2 | 5:6 | 6:2 4:2 6:2 | 7:6 | 8:4 6:2 | 5:2 3:2 5:2 | 4:3 2:3 | 1:6',
      mbox:'r:2 13:2 15:2 | 12:6 | r:2 13:2 15:2 | 14:6 | r:2 15:2 13:2 | 12:6 | 11:3 9:3 | 8:6'},
    A2:{ch:'1|6|2|5|1|3|4 5|1',lead:MS_HA,mb8:MS_HA}
  }};

// ---- inn and tavern: a 6/8 jig in D, fiddle and frame drum (bpm counts eighths)
MSCORE.inn={g:1.271,key:'D',mode:'ion',bpm:330,qbpm:165,meter:6,step:1,form:['A','A2','B','B2'],
  parts:[
    {n:'fid',i:'fiddle',o:4,v:1,orn:1,lead:1,pan:-.08},
    {n:'flute',i:'flute',o:5,v:.4,pan:.25},
    {n:'lute',t:'arp',i:'lute',o:3,v:.55,ctr:10,pan:.25,pat:'r:1 c:1 c:1 r:1 c:1 c:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:3 5:3'},
    {n:'dr',t:'drum',v:.8,rv:.1,pat:{frame:'X.gx.g',shaker:'.o..o.'}}
  ],
  sec:{
    A:{ch:'1|1|4|5|1|1|4 5|1',fid:'1:1 2:1 3:1 5:2 3:1 | 1:2 3:1 5:1 6:1 5:1 | 4:1 6:1 8:1 6:2 4:1 | 5:2 2:1 5:2 7:1 | 8:1 7:1 6:1 5:2 3:1 | 1:1 3:1 5:1 8:3 | 6:1 5:1 4:1 2:1 3:1 4:1 | 3:2 2:1 1:3'},
    B:{ch:'4|1|4|5|4|1|2 5|1',fid:'6:1 5:1 4:1 8:2 6:1 | 8:2 6:1 5:3 | 6:1 8:1 6:1 4:2 6:1 | 5:3 r:1 5:1 6:1 | 8:1 6:1 4:1 8:2 6:1 | 5:1 3:1 1:1 5:3 | 2:1 4:1 6:1 7:1 6:1 5:1 | 1:3 r:3'}
  }};
MSCORE.inn.sec.A2=Object.assign({},MSCORE.inn.sec.A,{flute:MSCORE.inn.sec.A.fid});
MSCORE.inn.sec.B2=Object.assign({},MSCORE.inn.sec.B,{flute:MSCORE.inn.sec.B.fid});

// ---- caves: a low drone, slow drips, a far-off pulse (E minor colour, no tune)
MSCORE.cave={g:1.614,key:'E',mode:'aeo',bpm:60,meter:4,step:2,form:['A','B'],
  parts:[
    {n:'drone',i:'drone',o:2,v:.7,cut:340},
    {n:'choir',t:'pad',i:'choir',o:3,v:.32,ctr:7,pat:true,att:3,rel:3,f1:450,f2:800},
    {n:'drip',i:'drip',o:5,v:2,lead:1,pan:.3,dl:.45,rv:.6},
    {n:'dr',t:'drum',v:.55,rv:.4}
  ],
  sec:{
    A:{ch:'1|1|1|1|6|6|6|6',drone:'1:64',drip:'r:6 8:1 r:9 5:1 r:11 10:1 r:6 3:1 r:13 7:1 r:6 8:1 r:7',dr:{taiko:'o...............|................'}},
    B:{ch:'4|4|4|4|1|1|1|1',drone:'4:64',drip:'r:3 12:1 r:12 9:1 r:8 11:1 r:4 8:1 r:14 6:1 r:9 10:1 r:8',dr:{taiko:'g...............|................|o...............|................'}}
  }};

// ---- the deepest cave: darker, with a heartbeat
MSCORE.deep={g:1.502,key:'B',mode:'phr',bpm:64,meter:4,step:4,form:['A','B'],
  parts:[
    {n:'drone',i:'drone',o:2,v:.7,cut:280,lr:.05},
    {n:'choir',t:'pad',i:'choir',o:2,v:.4,ctr:10,pat:true,att:3,rel:3,f1:420,f2:760},
    {n:'drip',i:'drip',o:4,v:1.6,lead:1,pan:-.3,dl:.5,rv:.6},
    {n:'dr',t:'drum',v:.85,rv:.2,pat:{heart:'x..o............',tom:msHit('g',64)}}
  ],
  sec:{
    A:{ch:'1|1|1|1|2|2|1|1',drone:'1:128',drip:'r:20 5:1 r:30 2:1 r:24 5b:1 r:22 1:1 r:28'},
    B:{ch:'6|6|2|2|1|1|1|1',drone:'2:64 1:64',drip:'r:12 8:1 r:26 5b:1 r:30 2:1 r:20 4:1 r:36'}
  }};

// ---- a cave puzzle: F lydian, plucked and curious, a quiet clock to think by
const MS_PA=msX('1:1 3:1 5:1 r:1 4:1 r:1 5:2 | 6:1 4:1 2:1 r:1 6:2 r:2 | 1:1 3:1 5:1 r:1 8:1 7:1 6:1 5:1 | 4:2 6:2 2:2 r:2 | 3:1 5:1 7:1 r:1 5:1 r:1 3:2 | 7:1 4:1 2:1 r:1 4:2 r:2 | 6:1 8:1 10:1 r:1 9:1 8:1 6:2 | 5:2 r:2 5:1 6:1 7:1 r:1',2);
MSCORE.puzzle={g:2.328,key:'F',mode:'lyd',bpm:108,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'pz',i:'pizz',o:4,v:1,lead:1,leg:.5,pan:.1},
    {n:'cel',i:'celesta',o:4,v:1.1,pan:.3,dl:.2},
    {n:'cel8',i:'celesta',o:5,v:.3,pan:.3},
    {n:'acc',t:'arp',i:'pizz',o:3,v:.45,ctr:9,pan:-.25,pat:'0:1 r:1 2:1 r:1 1:1 r:1 2:1 r:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.6,leg:.5,pat:'R:2 r:2 5:2 r:2'},
    {n:'dr',t:'drum',v:1.3,rv:.15,pat:{tick:'o.......o.......',tock:'....o.......o...'}}
  ],
  sec:{
    A:{ch:'1|2|1|2|3|7|6|5',pz:MS_PA},
    B:{ch:'6|2|7|3|6|2|5|5',cel:msX('r:2 6:1 8:1 10:2 r:2 | r:2 6:1 9:1 11:2 r:2 | r:2 7:1 9:1 11:2 r:2 | r:2 7:1 10:1 12:2 r:2 | 10:1 8:1 6:1 r:1 10:2 r:2 | 11:1 9:1 6:1 r:1 11:2 r:2 | 12:1 9:1 7:1 r:1 9:2 r:2 | 12:2 r:6',2)},
    A2:{ch:'1|2|1|2|3|7|6|5',pz:MS_PA,cel8:MS_PA}
  }};

// ---- regular fights: D minor, driving but friendly
const MS_KA=msX('1:2 1:1 2:1 3:2 5:2 | 6:4 3:2 1:2 | 4:2 3:1 4:1 5:2 7:2 | 5:6 r:2 | 1:2 1:1 2:1 3:2 5:2 | 8:4 6:2 8:2 | 4:2 6:2 8:2 7:2 | 7#:4 5:4',2);
MSCORE.combat={g:1.426,key:'D',mode:'aeo',bpm:138,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'brass',i:'brass',o:4,v:.85,lead:1,pan:.08},
    {n:'str',i:'strings',o:4,v:.75,lead:1,pan:-.1},
    {n:'str8',i:'strings',o:5,v:.38,pan:-.2},
    {n:'ost',t:'arp',i:'stac',o:3,v:.55,ctr:7,pan:.22,pat:'0:1 2:1 1:1 2:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2 R:2 R:2 R:2 R:2 R:2 5:2 8:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.3,ctr:9,pat:true,att:.3},
    {n:'dr',t:'drum',v:.6,rv:.12,pat:{kick:'X.....x...x.....',snare:'....x.......x...',hat:'o.g.o.g.o.g.o.g.',taiko:'x...............|................'}}
  ],
  sec:{
    A:{ch:'1|6|7|5M|1|6|4|5M',brass:MS_KA},
    B:{ch:'6|7|1|1|6|7|5M|5M',str:msX('3:4 4:2 3:2 | 4:4 2:2 4:2 | 3:2 5:2 8:4 | 8:6 r:2 | 6:4 8:2 6:2 | 7:4 9:2 7:2 | 8:2 7#:2 5:4 | 7#:6 r:2',2),
      dr:{kick:'X.......x.......',snare:'....x.......x...',hat:'o.o.o.o.o.o.o.o.'}},
    A2:{ch:'1|6|7|5M|1|6|4|5M',brass:MS_KA,str8:MS_KA,dr:{kick:'X.....x...x.....',snare:'....x.......x..g',hat:'o.g.o.g.o.g.o.g.',taiko:'X.......x.......'}}
  }};

// ---- boss fights: C minor, brass stabs, strings, choir
const MS_BA=msX('1:3 2:1 3:4 | 6:2 3:2 1:4 | 4:3 5:1 6:4 | 7#:4 5:4 | 1:3 2:1 3:4 | 6:2 8:2 10:4 | 9b:4 8:2 6:2 | 7#:6 r:2',2);
MSCORE.boss={g:1.221,key:'C',mode:'aeo',bpm:150,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'brass',i:'brass',o:4,v:.9,lead:1,pan:.05},
    {n:'str',i:'strings',o:5,v:.6,lead:1,pan:-.12},
    {n:'stab',t:'arp',i:'brass',o:3,v:.5,ctr:10,pan:.25,pat:'c:2 r:1 c:1 r:2 c:2 r:2 c:1 r:1 c:2 r:2'},
    {n:'low',t:'bass',i:'stac',o:3,v:.55,pan:-.25,pat:'R:1 8:1 5:1 8:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:2'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.4,ctr:2,pat:true,att:.4},
    {n:'dr',t:'drum',v:.55,rv:.12,pat:{kick:'x..x..x...x..x..',snare:'....X.......X..x',hat:'o.g.o.g.o.g.o.g.',taiko:'X...............|........X.......'}}
  ],
  sec:{
    A:{ch:'1|6|4|5M|1|6|b2|5M',brass:MS_BA},
    B:{ch:'6|4|1|5M|6|4|2|5M',str:'8:12 7:2 6:2 | 6:8 4:4 6:4 | 5:12 3:4 | 7#:8 9:8 | 10:12 9:2 8:2 | 8:8 6:8 | 6:8 4:4 2:4 | 7#:16',mute:['brass']},
    A2:{ch:'1|6|4|5M|1|6|b2|5M',brass:MS_BA,str:MS_BA}
  }};

// ---- Vorlaxis: the leitmotif in D minor, in broad half time over big drums
MSCORE.final={g:1.291,key:'D',mode:'aeo',bpm:140,meter:4,step:4,intro:['I'],form:['A','B'],
  parts:[
    {n:'brass',i:'brass',o:4,v:.9,lead:1,pan:.05},
    {n:'str',i:'strings',o:5,v:.7,lead:1,pan:-.12},
    {n:'stab',t:'arp',i:'brass',o:3,v:.5,ctr:10,pan:.25},
    {n:'low',t:'bass',i:'stac',o:3,v:.55,pan:-.25,pat:'R:1 R:1 8:1 R:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.35,ctr:2,pat:true,att:.6},
    {n:'dr',t:'drum',v:.45,rv:.14,pat:{kick:'X..x..x...x..x..',snare:'....X.......X...',taiko:'X.......X...x...',hat:'g.g.o.g.g.g.o.g.'}}
  ],
  sec:{
    I:{ch:'1|5M',stab:'c:2 r:14 c:2 r:2 c:2 r:2 c:8',mute:['low','bass','choir'],
      dr:{taiko:'X...........x.x.|X...X...X.X.XXXX',crash:msHit('X',32)}},
    A:{ch:'1|1|3|3|4|6|5M|5M|1|1|4|1|5M|5M|1|1',brass:msX(MS_LMm1+' | '+MS_LMm2,4),str:msX(MS_LMm1+' | '+MS_LMm2,4),
      dr:{kick:'X..x..x...x..x..',snare:'....X.......X...',taiko:'X.......X...x...',hat:'g.g.o.g.g.g.o.g.',crash:msHit('X',128)}},
    B:{ch:'6|7|1|1|6|7|5M|5M',str:'6:8 5:4 3:4 | 4:8 2:8 | 3:4 5:4 8:8 | 8:16 | 10:8 8:4 6:4 | 9:8 7:8 | 8:4 7#:4 5:8 | 7#:16',
      stab:'c:2 r:1 c:1 r:2 c:2 r:2 c:1 r:1 c:2 r:2',vol:{str:1.6}}
  }};

// ---- the ending: the leitmotif in triumph, then a gentle loop
MSCORE.victory={g:1.278,key:'D',mode:'ion',bpm:96,meter:4,step:4,intro:['F','A'],form:['G','H'],
  parts:[
    {n:'b1',i:'brass',o:4,v:.9,lead:1,pan:.08},
    {n:'b2',i:'brass',o:4,v:.6,pan:-.08},
    {n:'str',i:'strings',o:5,v:.7,pan:-.18},
    {n:'flute',i:'flute',o:5,v:1,orn:1,lead:1},
    {n:'harp',t:'arp',i:'harp',o:4,v:.5,ctr:2,pan:.3,pat:'0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true},
    {n:'timp',t:'bass',i:'timp',o:2,v:.7},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:8 5:4 8:4'},
    {n:'dr',t:'drum',v:.75,rv:.18}
  ],
  sec:{
    F:{ch:'1|4|5|1',b1:'5:3 5:1 5:4 8:8 | 6:3 6:1 6:4 8:8 | 7:3 7:1 7:4 9:4 7:4 | 8:16',b2:'3:3 3:1 3:4 5:8 | 4:3 4:1 4:4 6:8 | 5:3 5:1 5:4 7:4 5:4 | 5:16',
      timp:'R:4 r:12 | R:4 r:12 | R:4 r:4 R:2 R:2 R:4 | R:1@.45 R:1@.5 R:1@.55 R:1@.6 R:1@.66 R:1@.72 R:1@.8 R:1@.9 R:8',
      mute:['harp','bass'],dr:{crash:'X...............|................|................|X...............'}},
    A:{ch:MS_LMC,b1:msX(MS_LM1+' | '+MS_LM2,2),str:msX(MS_LM1+' | '+MS_LM2,2),timp:'R:16',
      dr:{kick:'x.......x.......',snare:'x..gx.g.x..gx.gg',crash:msHit('x',64)}},
    G:{ch:MS_LMC,flute:msX(MS_LM1+' | '+MS_LM2,2),vol:{pad:.8}},
    H:{ch:MS_MBC,str:msX(MS_MB,2),vol:{str:1.5}}
  }};

// ---- Normal Mode arena: A dorian, energetic, plucks with echoes
MSCORE.arena={g:1.546,key:'A',mode:'dor',bpm:128,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'brass',i:'brass',o:3,v:.85,lead:1,pan:.05},
    {n:'pl',i:'lute',o:3,v:1.4,lead:1,pan:-.1,dl:.3,dec:.3},
    {n:'pl8',i:'lute',o:4,v:.4,pan:.2,dl:.3,dec:.3},
    {n:'arp',t:'arp',i:'lute',o:3,v:.6,ctr:9,pan:.25,dl:.25,dec:.22,pat:'0:1 1:1 2:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 2:1 3:1'},
    {n:'bass',t:'bass',i:'bass',o:1,v:.85,leg:.6,pat:'R:2 8:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,pat:true,att:.3},
    {n:'dr',t:'drum',v:.6,rv:.1,pat:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'..o...o...o...o.',shaker:'g.g.g.g.g.g.g.g.'}}
  ],
  sec:{
    A:{ch:'1|7|4|1|1|7|4|5',brass:msX('5:2 5:1 4:1 5:2 8:2 | 7:2 5:1 4:1 2:2 4:2 | 4:2 6:2 8:2 6:2 | 5:6 r:2 | 5:2 5:1 4:1 5:2 8:2 | 9:2 8:1 7:1 5:2 7:2 | 6:2 4:2 6:2 8:2 | 9:4 5:4',2)},
    B:{ch:'3|4|1|7|3|4|5|5',pl:msX('10:1 r:1 10:1 r:1 12:2 10:2 | 11:4 8:2 6:2 | 8:2 5:2 3:2 5:2 | 7:6 r:2 | 10:1 r:1 10:1 r:1 12:2 14:2 | 13:4 11:2 8:2 | 12:4 9:2 7:2 | 5:6 r:2',2),
      dr:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'..o...o...o...o.',shaker:'o.g.o.g.o.g.o.g.'}},
    A2:{ch:'1|7|4|1|1|7|4|5',brass:msX('5:2 5:1 4:1 5:2 8:2 | 7:2 5:1 4:1 2:2 4:2 | 4:2 6:2 8:2 6:2 | 5:6 r:2 | 5:2 5:1 4:1 5:2 8:2 | 9:2 8:1 7:1 5:2 7:2 | 6:2 4:2 6:2 8:2 | 9:4 5:4',2),
      pl8:msX('5:2 5:1 4:1 5:2 8:2 | 7:2 5:1 4:1 2:2 4:2 | 4:2 6:2 8:2 6:2 | 5:6 r:2 | 5:2 5:1 4:1 5:2 8:2 | 9:2 8:1 7:1 5:2 7:2 | 6:2 4:2 6:2 8:2 | 9:4 5:4',2)}
  }};

// ---- game over: a falling phrase, then soft held chords
MSCORE.dead={g:1.552,key:'D',mode:'aeo',bpm:60,meter:4,step:2,intro:['D'],form:['L'],
  parts:[
    {n:'str',i:'strings',o:4,v:.9,lead:1,att:.35,rel:.8},
    {n:'mbox',i:'mbox',o:5,v:1.2,pan:.25,dl:.3},
    {n:'pad',t:'pad',i:'pad',o:3,v:.6,ctr:9,pat:true,att:1.6,rel:2,cut:900},
    {n:'bass',t:'bass',i:'bass',o:2,v:.55,pat:'R:8'}
  ],
  sec:{
    D:{ch:'1|6|2|5M',str:'5:4 4:2 3:2 | 4:4 3:2 1:2 | 2:6 1:2 | 0#:8'},
    L:{ch:'1|6|4|1',mbox:'r:4 5:4 | r:8 | r:4 4:4 | r:8'}
  }};

// ---- tender story moments: F major, solo flute over a falling bass line
const MS_T6='3:4 5:2 8:2 | 7:4 6:2 5:2 | 6:6 5:1 3:1 | 3:8 | 4:4 6:2 8:2 | 8:4 7:2 5:2';
MSCORE.tender={g:0.916,key:'F',mode:'ion',bpm:66,meter:4,step:2,form:['A','B','A2'],
  parts:[
    {n:'flute',i:'flute',o:4,v:1,orn:1,lead:1,att:.14},
    {n:'mbox',i:'mbox',o:5,v:.75,lead:1,pan:.2,dl:.25},
    {n:'harp',t:'arp',i:'harp',o:3,v:.32,ctr:9,pan:-.3,pat:'0:2 1:2 2:2 1:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.55,ctr:9,pat:true,att:1.4,rel:1.4,cut:900},
    {n:'bass',t:'bass',i:'bass',o:2,v:.6,pat:'R:8'}
  ],
  sec:{
    A:{ch:'1|5/7|6|3|4|1/3|2|5',flute:MS_T6+' | 6:4 4:2 2:2 | 5:6 r:2',mute:['harp']},
    B:{ch:'4|1/3|2|1|4|5|6|5',mbox:'6:4 5:2 4:2 | 3:6 r:2 | 4:4 2:2 1:2 | 3:6 r:2 | 6:4 8:2 6:2 | 5:6 r:2 | 6:3 5:1 3:2 1:2 | 2:6 r:2'},
    A2:{ch:'1|5/7|6|3|4|1/3|2 5|1',flute:MS_T6+' | 6:2 4:2 5:2 7:2 | 8:8'}
  }};

// ================= stingers (play once over the theme, which ducks under them)
MSTING.quest={g:1.912,key:'G',mode:'ion',bpm:140,meter:4,step:4,intro:['S'],
  parts:[
    {n:'cel',i:'celesta',o:4,v:1,lead:1,pan:.15},
    {n:'fl',i:'flute',o:4,v:.6,lead:1,att:.03},
    {n:'harp',t:'arp',i:'harp',o:3,v:.6,ctr:9,pan:-.25,pat:'0:1 1:1 2:1 3:1 c:4 r:8 c:16'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true,att:.15,rel:.8}
  ],
  sec:{S:{ch:'1 5|1',cel:'3:2 5:2 8:4 7:2 8:2 9:4 | 10:12 r:4',fl:'3:2 5:2 8:4 7:2 8:2 9:4 | 10:12 r:4'}}};

MSTING.complete={g:1.74,key:'D',mode:'ion',bpm:132,meter:4,step:4,intro:['S'],
  parts:[
    {n:'b1',i:'brass',o:4,v:1,lead:1,pan:.08},
    {n:'b2',i:'brass',o:4,v:.7,lead:1,pan:-.08},
    {n:'cel',i:'celesta',o:4,v:.6,lead:1,pan:.3},
    {n:'timp',t:'bass',i:'timp',o:2,v:.9,pat:'R:4 r:8 R:2 R:2 R:12 r:4'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true,att:.1,rel:1},
    {n:'dr',t:'drum',v:.7,rv:.25,pat:{crash:'................X...............'}}
  ],
  sec:{S:{ch:'1 1 5 1|1',b1:'5:3 5:1 8:4 7:2 8:2 10:4 | 8:12 r:4',b2:'3:3 3:1 5:4 5:2 5:2 8:4 | 5:12 r:4',cel:'r:16 | 10:1 12:1 15:1 17:4 r:9'}}};

// a rising chain of triads through the bright lydian II, ending on a high open fifth
MSTING.secret={g:2.149,key:'D',mode:'lyd',bpm:120,meter:4,step:4,intro:['S'],
  parts:[
    {n:'cel',i:'celesta',o:4,v:1,lead:1,pan:.12,dl:.3},
    {n:'bell',i:'bell',o:5,v:.5,lead:1,pan:-.2,dl:.3},
    {n:'harp',t:'arp',i:'harp',o:3,v:.55,ctr:9,pan:-.25,dec:.45,pat:'0:1 1:1 2:1 r:1 0:1 1:1 2:1 r:1 0:1 1:1 2:1 r:1 0:1 1:1 2:1 3:1 c:16'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.45,ctr:9,pat:true,att:.2,rel:1.2}
  ],
  sec:{S:{ch:'1 2 3 1|1',cel:'5:1 8:1 10:1 12:1 6:1 9:1 11:1 13:1 7:1 10:1 12:1 14:1 15:4 | 15:2 r:2 15,19:12',bell:'r:16 | r:4 8,12:12'}}};

MSTING.item={g:1.447,key:'G',mode:'ion',bpm:132,meter:4,step:4,intro:['S'],
  parts:[
    {n:'fl',i:'flute',o:4,v:.9,lead:1,att:.03},
    {n:'cel',i:'celesta',o:5,v:.6,lead:1,pan:.25},
    {n:'br',i:'horn',o:3,v:.7,lead:1,pan:-.12},
    {n:'harp',t:'arp',i:'harp',o:3,v:.5,ctr:9,pan:-.3,pat:'0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 c:8 c:16'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.45,ctr:9,pat:true,att:.2,rel:1}
  ],
  sec:{S:{ch:'4 5|1',fl:'4:2 6:2 8:4 5:2 7:2 9:4 | 10:12 r:4',cel:'r:16 | 3:2 5:2 8:12',br:'4,6:8 5,7:8 | 3,5,8:12 r:4'}}};

MSTING.levelup={g:1.543,key:'D',mode:'ion',bpm:140,meter:4,step:4,intro:['S'],
  parts:[
    {n:'harp',i:'harp',o:4,v:1,lead:1,pan:.12},
    {n:'cel',i:'celesta',o:4,v:.7,lead:1,pan:-.15},
    {n:'br',t:'arp',i:'brass',o:4,v:.55,ctr:4,pat:'r:16 c:12 r:4'},
    {n:'timp',t:'bass',i:'timp',o:2,v:.8,pat:'r:16 R:12 r:4'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.4,ctr:9,pat:true,att:.1,rel:1}
  ],
  sec:{S:{ch:'1|1',harp:'1:1 2:1 3:1 5:1 6:1 8:1 9:1 10:1 12:4 10:2 12:2 | 15:12 r:4',cel:'r:16 | 12,15:12 r:4'}}};

MSTING.chapter={g:1.514,key:'D',mode:'ion',bpm:120,meter:4,step:2,intro:['S'],
  parts:[
    {n:'fl',i:'flute',o:5,v:.9,lead:1},
    {n:'hn',i:'horn',o:4,v:.6,lead:1,pan:-.1},
    {n:'harp',t:'arp',i:'harp',o:3,v:.45,ctr:9,pan:.3,pat:'c:8 c:8'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.55,ctr:9,pat:true,att:.5,rel:1.2},
    {n:'dr',t:'drum',v:.8,rv:.3,pat:{taiko:'X.......|o.......'}}
  ],
  sec:{S:{ch:'1|5',fl:'-2:2 1:3 2:1 3:2 | 5:6 r:2',hn:'-2:2 1:3 2:1 3:2 | 5:6 r:2'}}};

MSTING.boss_intro={g:0.913,key:'C',mode:'aeo',bpm:120,meter:4,step:4,intro:['S'],
  parts:[
    {n:'br',i:'brass',o:3,v:1,lead:1},
    {n:'choir',t:'pad',i:'choir',o:4,v:.6,ctr:2,pat:true,att:.25,rel:1},
    {n:'low',t:'bass',i:'bass',o:2,v:.9,pat:'R:3 r:1 R:3 r:1 R:8 R:16'},
    {n:'dr',t:'drum',v:.9,rv:.3,pat:{taiko:'X...X...X.......|X...............',crash:'................X...............'}}
  ],
  sec:{S:{ch:'1 1 b2 b2|1d',br:'1,8:3 r:1 1,8:3 r:1 2b,9b:8 | 1,5b,8:16'}}};

// ================= music engine
const Music=(()=>{
  // ---- synth helpers (work on a live AudioContext or an OfflineAudioContext)
  function osc(ac,type,f,t){ const o=ac.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t); return o; }
  function gn(ac,v){ const g=ac.createGain(); g.gain.value=v; return g; }
  function flt(ac,type,f,q){ const b=ac.createBiquadFilter(); b.type=type; b.frequency.value=f; if(q!=null) b.Q.value=q; return b; }
  function nz(C){ const s=C.ac.createBufferSource(); s.buffer=C.noise; s.loop=true; return s; }
  // start and stop every source, count the voice, and disconnect everything once it has ended
  function run(C,srcs,nodes,t,end){
    for(const s of srcs){ if(s.buffer) s.start(t,Math.random()*1.4); else s.start(t); s.stop(end); }
    C.live++; C.made++; if(C.log) C.log.push(t,end); if(C.reg) C.reg.push(srcs);
    srcs[0].onended=()=>{ srcs.done=1; for(const s of srcs) try{ s.disconnect(); }catch(e){} for(const n of nodes) try{ n.disconnect(); }catch(e){} C.live--; };
  }
  // linear attack to pk, glide (time constant dt) to pk*sus, release (time constant rl) at t+d; returns a safe stop time
  function adsr(g,t,a,pk,sus,dt,d,rl){
    const P=g.gain; P.setValueAtTime(0,t); P.linearRampToValueAtTime(pk,t+a);
    if(sus<1) P.setTargetAtTime(pk*sus,t+a,dt);
    const tr=Math.max(t+a,t+d); P.setTargetAtTime(0,tr,rl); return tr+rl*6+.02;
  }

  // ---- instruments: fn(C, out, time, freq, dur, vel, params)
  const INST={
    // plucked lute / harp / pizzicato: saw or triangle with a fast closing lowpass
    pluck(C,o,t,f,d,v,P){
      const ac=C.ac, tri=!!P.tri, dec=P.dec||.35, br=P.bright||8;
      const a=osc(ac,tri?'triangle':'sawtooth',f,t), b=osc(ac,tri?'sawtooth':'triangle',f*2.003,t), bg=gn(ac,tri?.16:.2), lp=flt(ac,'lowpass',f,P.q||1.3), g=gn(ac,0);
      lp.frequency.setValueAtTime(Math.min(f*br,10000),t); lp.frequency.setTargetAtTime(Math.min(f*1.8+400,8000),t+.003,dec*.3);
      const pk=v*(tri?.4:.28), off=t+Math.max(d,.05);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(pk,t+.004); g.gain.setTargetAtTime(0,t+.005,dec); g.gain.setTargetAtTime(0,off,.06);
      a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(o);
      run(C,[a,b],[bg,lp,g],t,Math.min(off+.4,t+dec*5.5)+.02);
    },
    // flute / ocarina: sine plus a little triangle, slow attack, delayed vibrato, breath noise
    flute(C,o,t,f,d,v,P){
      const ac=C.ac, a=osc(ac,'sine',f,t), b=osc(ac,'triangle',f,t), bg=gn(ac,P.tri==null?.16:P.tri), h=osc(ac,'sine',f*2,t), hg=gn(ac,P.h2==null?.2:P.h2), l=osc(ac,'sine',P.vr||5.1,t), lg=gn(ac,0), g=gn(ac,0);
      const n=nz(C), nf=flt(ac,'bandpass',Math.min(f*2.2,9000),1.1), ng=gn(ac,0);
      const vd=Math.min(.25,d*.4); lg.gain.setValueAtTime(0,t+vd); lg.gain.linearRampToValueAtTime(f*.0055,t+vd+.35);
      l.connect(lg); lg.connect(a.frequency); lg.connect(b.frequency); h.connect(hg); hg.connect(g);
      const at=P.att||.06, br=(P.br==null?.06:P.br)*v;
      const end=adsr(g,t,at,v*.3,.86,.3,d,.06);
      ng.gain.setValueAtTime(0,t); ng.gain.linearRampToValueAtTime(br*1.6,t+.025); ng.gain.setTargetAtTime(br*.35,t+.03,.08); ng.gain.setTargetAtTime(0,t+Math.max(d,at),.05);
      a.connect(g); b.connect(bg); bg.connect(g); g.connect(o); n.connect(nf); nf.connect(ng); ng.connect(o);
      run(C,[a,b,h,l,n],[bg,hg,lg,g,nf,ng],t,end);
    },
    // warm pad: two detuned saws through a lowpass that opens with the slow attack
    pad(C,o,t,f,d,v,P){
      const ac=C.ac, cut=P.cut||1200, lp=flt(ac,'lowpass',cut*.45,.5), g=gn(ac,0), ss=[];
      for(const dt of [-8,7]){ const s=osc(ac,'sawtooth',f,t); s.detune.setValueAtTime(dt,t); s.connect(lp); ss.push(s); }
      const at=P.att||.7, rl=P.rel||.6;
      lp.frequency.setValueAtTime(cut*.45,t); lp.frequency.linearRampToValueAtTime(cut,t+at*1.2);
      const end=adsr(g,t,at,v*.1,1,1,d,rl/3);
      lp.connect(g); g.connect(o); run(C,ss,[lp,g],t,end);
    },
    // choir-like pad: saws through two vowel formants
    choir(C,o,t,f,d,v,P){
      const ac=C.ac, mix=gn(ac,1), f1=flt(ac,'bandpass',P.f1||650,4), f2=flt(ac,'bandpass',P.f2||1100,5), f2g=gn(ac,.55), body=flt(ac,'lowpass',Math.max(f*1.5,300),.5), bodyg=gn(ac,.25), g=gn(ac,0), ss=[];
      const l=osc(ac,'sine',4.7,t), lg=gn(ac,f*.0045);
      for(const dt of [-10,9]){ const s=osc(ac,'sawtooth',f,t); s.detune.setValueAtTime(dt,t); lg.connect(s.frequency); s.connect(mix); ss.push(s); }
      l.connect(lg); ss.push(l);
      mix.connect(f1); mix.connect(f2); mix.connect(body); f2.connect(f2g); body.connect(bodyg);
      f1.connect(g); f2g.connect(g); bodyg.connect(g); g.connect(o);
      const end=adsr(g,t,P.att||.5,v*.42,1,1,d,(P.rel||.6)/3);
      run(C,ss,[mix,f1,f2,f2g,body,bodyg,lg,g],t,end);
    },
    // string ensemble (and short ostinato strings): detuned saws, vibrato, soft lowpass
    strings(C,o,t,f,d,v,P){
      const ac=C.ac, lp=flt(ac,'lowpass',P.cut||Math.min(f*7,5200),.6), g=gn(ac,0), l=osc(ac,'sine',5.4,t), lg=gn(ac,0), ss=[];
      for(const dt of [-7,6]){ const s=osc(ac,'sawtooth',f,t); s.detune.setValueAtTime(dt,t); lg.connect(s.frequency); s.connect(lp); ss.push(s); }
      if(!P.stac){ lg.gain.setValueAtTime(0,t+.15); lg.gain.linearRampToValueAtTime(f*.0045,t+.6); }
      l.connect(lg); ss.push(l);
      const end=P.stac?adsr(g,t,.008,v*.2,.55,.07,d,.035):adsr(g,t,P.att||.12,v*.17,.9,.3,d,(P.rel||.25)/3);
      lp.connect(g); g.connect(o); run(C,ss,[lp,g,lg],t,end);
    },
    // brass: saws with a filter that blooms open, a small pitch scoop
    brass(C,o,t,f,d,v,P){
      const ac=C.ac, lp=flt(ac,'lowpass',f,P.q||1.6), g=gn(ac,0), ss=[], soft=!!P.soft;
      for(const dt of [-5,5]){ const s=osc(ac,'sawtooth',f*.985,t); s.frequency.exponentialRampToValueAtTime(f,t+.045); s.detune.setValueAtTime(dt,t); s.connect(lp); ss.push(s); }
      const hi=Math.min(f*(soft?3.2:6),7000), mid=Math.min(f*(soft?1.9:3.2),5000);
      lp.frequency.setValueAtTime(f*1.1,t); lp.frequency.linearRampToValueAtTime(hi,t+.05); lp.frequency.setTargetAtTime(mid,t+.06,.18); lp.frequency.setTargetAtTime(f,t+Math.max(d,.06),.08);
      const end=adsr(g,t,P.att||(soft?.06:.03),v*(soft?.32:.3),.75,.25,d,.05);
      lp.connect(g); g.connect(o); run(C,ss,[lp,g],t,end);
    },
    // bass: sine body plus a filtered saw for definition on small speakers
    bass(C,o,t,f,d,v,P){
      const ac=C.ac, a=osc(ac,'sine',f,t), b=osc(ac,'sawtooth',f,t), bg=gn(ac,.3), lp=flt(ac,'lowpass',Math.min(f*3.5,700),.7), g=gn(ac,0);
      const end=adsr(g,t,.008,v*.27,.72,.25,d,.04);
      a.connect(g); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(o); run(C,[a,b],[bg,lp,g],t,end);
    },
    // FM bells, celesta, music box, cave drips
    bell(C,o,t,f,d,v,P){
      const ac=C.ac, c=osc(ac,'sine',f,t), m=osc(ac,'sine',f*(P.ratio||3.5),t), mg=gn(ac,0), g=gn(ac,0), ix=(P.idx||2)*f, dec=P.dec||1.6;
      mg.gain.setValueAtTime(ix,t); mg.gain.setTargetAtTime(ix*.08,t,P.mdec||.25);
      if(P.chirp){ c.frequency.setValueAtTime(f*.84,t); c.frequency.exponentialRampToValueAtTime(f,t+.035); }
      m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(o);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.3,t+.003); g.gain.setTargetAtTime(0,t+.004,dec/4.5);
      run(C,[c,m],[mg,g],t,t+dec*1.2+.05);
    },
    // fiddle: bowed saw with vibrato, body resonance
    fiddle(C,o,t,f,d,v,P){
      const ac=C.ac, s=osc(ac,'sawtooth',f,t), l=osc(ac,'sine',5.9,t), lg=gn(ac,0), hp=flt(ac,'highpass',260,.7), lp=flt(ac,'lowpass',Math.min(f*7,4200),.9), pk=flt(ac,'peaking',1300,1.1), g=gn(ac,0);
      pk.gain.value=5;
      lg.gain.setValueAtTime(0,t+.12); lg.gain.linearRampToValueAtTime(f*.007,t+.45);
      l.connect(lg); lg.connect(s.frequency); s.connect(hp); hp.connect(lp); lp.connect(pk); pk.connect(g); g.connect(o);
      const end=adsr(g,t,P.att||.035,v*.26,.82,.2,d,.05);
      run(C,[s,l],[lg,hp,lp,pk,g],t,end);
    },
    // reed pipe (market shawm): square and saw, nasal peak
    reed(C,o,t,f,d,v,P){
      const ac=C.ac, s=osc(ac,'square',f,t), s2=osc(ac,'sawtooth',f*1.002,t), s2g=gn(ac,.5), lp=flt(ac,'lowpass',Math.min(f*4.5,4000),.7), pk=flt(ac,'peaking',1500,1.2), l=osc(ac,'sine',5.3,t), lg=gn(ac,0), g=gn(ac,0);
      pk.gain.value=6;
      lg.gain.setValueAtTime(0,t+.15); lg.gain.linearRampToValueAtTime(f*.004,t+.45);
      l.connect(lg); lg.connect(s.frequency); lg.connect(s2.frequency);
      s.connect(lp); s2.connect(s2g); s2g.connect(lp); lp.connect(pk); pk.connect(g); g.connect(o);
      const end=adsr(g,t,P.att||.03,v*.2,.85,.2,d,.04);
      run(C,[s,s2,l],[s2g,lp,pk,lg,g],t,end);
    },
    // drone: detuned saws and a sine under a slowly breathing lowpass
    drone(C,o,t,f,d,v,P){
      const ac=C.ac, cut=P.cut||320, a=osc(ac,'sawtooth',f,t), b=osc(ac,'sawtooth',f,t), c=osc(ac,'sine',f,t), cg=gn(ac,.6), lp=flt(ac,'lowpass',cut,1.4), l=osc(ac,'sine',P.lr||.07,t), lg=gn(ac,cut*.45), g=gn(ac,0);
      a.detune.setValueAtTime(-7,t); b.detune.setValueAtTime(8,t);
      l.connect(lg); lg.connect(lp.frequency); a.connect(lp); b.connect(lp); lp.connect(g); c.connect(cg); cg.connect(g); g.connect(o);
      const end=adsr(g,t,P.att||2.5,v*.2,1,1,d,(P.rel||2.5)/4);
      run(C,[a,b,c,l],[cg,lp,lg,g],t,end);
    },
    // bubbling low pluck for the swamp: a sine that blips upward
    bubble(C,o,t,f,d,v,P){
      const ac=C.ac, a=osc(ac,'sine',f*.6,t), b=osc(ac,'triangle',f,t), bg=gn(ac,.25), g=gn(ac,0);
      a.frequency.exponentialRampToValueAtTime(f*1.06,t+.06); a.frequency.exponentialRampToValueAtTime(f,t+.12);
      b.frequency.setValueAtTime(f*.6,t); b.frequency.exponentialRampToValueAtTime(f,t+.07);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.5,t+.006); g.gain.setTargetAtTime(0,t+.01,.09);
      a.connect(g); b.connect(bg); bg.connect(g); g.connect(o); run(C,[a,b],[bg,g],t,t+.6);
    },
    // timpani: pitched, with a short mallet thump
    timp(C,o,t,f,d,v,P){
      const ac=C.ac, a=osc(ac,'sine',f*1.05,t), b=osc(ac,'sine',f*1.5,t), bg=gn(ac,.2), g=gn(ac,0), n=nz(C), nl=flt(ac,'lowpass',500,.7), ng=gn(ac,0);
      a.frequency.exponentialRampToValueAtTime(f,t+.08);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.55,t+.005); g.gain.setTargetAtTime(0,t+.01,.42);
      ng.gain.setValueAtTime(v*.4,t); ng.gain.setTargetAtTime(0,t+.002,.03);
      a.connect(g); b.connect(bg); bg.connect(g); g.connect(o); n.connect(nl); nl.connect(ng); ng.connect(o);
      run(C,[a,b,n],[bg,g,nl,ng],t,t+2.4);
    },
    // ---- drums (pitch ignored)
    kick(C,o,t,f,d,v){
      const ac=C.ac, a=osc(ac,'sine',155,t), g=gn(ac,0);
      a.frequency.exponentialRampToValueAtTime(48,t+.11);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.55,t+.003); g.gain.setTargetAtTime(0,t+.01,.09);
      a.connect(g); g.connect(o); run(C,[a],[g],t,t+.55);
    },
    snare(C,o,t,f,d,v){
      const ac=C.ac, n=nz(C), hp=flt(ac,'highpass',1100,.7), ng=gn(ac,0), a=osc(ac,'triangle',210,t), g=gn(ac,0);
      a.frequency.exponentialRampToValueAtTime(165,t+.05);
      ng.gain.setValueAtTime(v*.26,t); ng.gain.setTargetAtTime(0,t+.002,.055);
      g.gain.setValueAtTime(v*.2,t); g.gain.setTargetAtTime(0,t+.002,.035);
      n.connect(hp); hp.connect(ng); ng.connect(o); a.connect(g); g.connect(o); run(C,[n,a],[hp,ng,g],t,t+.38);
    },
    hat(C,o,t,f,d,v){
      const ac=C.ac, n=nz(C), hp=flt(ac,'highpass',7500,.7), g=gn(ac,0);
      g.gain.setValueAtTime(v*.11,t); g.gain.setTargetAtTime(0,t+.001,.022);
      n.connect(hp); hp.connect(g); g.connect(o); run(C,[n],[hp,g],t,t+.16);
    },
    shaker(C,o,t,f,d,v){
      const ac=C.ac, n=nz(C), bp=flt(ac,'bandpass',5600,.8), g=gn(ac,0);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.12,t+.014); g.gain.setTargetAtTime(0,t+.016,.03);
      n.connect(bp); bp.connect(g); g.connect(o); run(C,[n],[bp,g],t,t+.22);
    },
    taiko(C,o,t,f,d,v){
      const ac=C.ac, a=osc(ac,'sine',100,t), g=gn(ac,0), n=nz(C), nl=flt(ac,'lowpass',380,.7), ng=gn(ac,0);
      a.frequency.exponentialRampToValueAtTime(52,t+.13);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.6,t+.004); g.gain.setTargetAtTime(0,t+.01,.26);
      ng.gain.setValueAtTime(v*.4,t); ng.gain.setTargetAtTime(0,t+.002,.05);
      a.connect(g); g.connect(o); n.connect(nl); nl.connect(ng); ng.connect(o); run(C,[a,n],[g,nl,ng],t,t+1.7);
    },
    frame(C,o,t,f,d,v){
      const ac=C.ac, a=osc(ac,'sine',165,t), g=gn(ac,0), n=nz(C), bp=flt(ac,'bandpass',850,.9), ng=gn(ac,0);
      a.frequency.exponentialRampToValueAtTime(100,t+.05);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.5,t+.003); g.gain.setTargetAtTime(0,t+.006,.1);
      ng.gain.setValueAtTime(v*.2,t); ng.gain.setTargetAtTime(0,t+.002,.03);
      a.connect(g); g.connect(o); n.connect(bp); bp.connect(ng); ng.connect(o); run(C,[a,n],[g,bp,ng],t,t+.75);
    },
    tom(C,o,t,f,d,v){
      const ac=C.ac, a=osc(ac,'sine',125,t), g=gn(ac,0);
      a.frequency.exponentialRampToValueAtTime(78,t+.16);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.55,t+.004); g.gain.setTargetAtTime(0,t+.01,.17);
      a.connect(g); g.connect(o); run(C,[a],[g],t,t+1.1);
    },
    tick(C,o,t,f,d,v){
      const ac=C.ac, a=osc(ac,'sine',1250,t), b=osc(ac,'sine',1890,t), bg=gn(ac,.45), g=gn(ac,0);
      g.gain.setValueAtTime(v*.14,t); g.gain.setTargetAtTime(0,t+.001,.018);
      a.connect(g); b.connect(bg); bg.connect(g); g.connect(o); run(C,[a,b],[bg,g],t,t+.14);
    },
    tock(C,o,t,f,d,v){
      const ac=C.ac, a=osc(ac,'sine',820,t), b=osc(ac,'sine',1230,t), bg=gn(ac,.4), g=gn(ac,0);
      g.gain.setValueAtTime(v*.15,t); g.gain.setTargetAtTime(0,t+.001,.025);
      a.connect(g); b.connect(bg); bg.connect(g); g.connect(o); run(C,[a,b],[bg,g],t,t+.18);
    },
    crash(C,o,t,f,d,v){
      const ac=C.ac, n=nz(C), hp=flt(ac,'highpass',4200,.6), g=gn(ac,0);
      g.gain.setValueAtTime(v*.16,t); g.gain.setTargetAtTime(0,t+.005,.75);
      n.connect(hp); hp.connect(g); g.connect(o); run(C,[n],[hp,g],t,t+4.5);
    },
    heart(C,o,t,f,d,v){
      const ac=C.ac, a=osc(ac,'sine',64,t), g=gn(ac,0), b=osc(ac,'triangle',128,t), bg=gn(ac,.18);
      a.frequency.exponentialRampToValueAtTime(42,t+.09); b.frequency.exponentialRampToValueAtTime(80,t+.06);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*.75,t+.006); g.gain.setTargetAtTime(0,t+.012,.075);
      a.connect(g); b.connect(bg); bg.connect(g); g.connect(o); run(C,[a,b],[bg,g],t,t+.55);
    }
  };
  // presets: instrument name -> synth function and default params (rv = reverb send, dl = echo send)
  const PRE={
    lute:{fn:'pluck',dec:.35,rv:.22}, harp:{fn:'pluck',tri:1,dec:.9,bright:10,rv:.4}, pizz:{fn:'pluck',tri:1,dec:.16,bright:8,rv:.25},
    flute:{fn:'flute',rv:.35}, ocarina:{fn:'flute',tri:0,h2:.08,br:.09,vr:4.6,rv:.4},
    pad:{fn:'pad',rv:.35}, choir:{fn:'choir',rv:.4}, strings:{fn:'strings',rv:.3}, stac:{fn:'strings',stac:1,rv:.18},
    brass:{fn:'brass',rv:.22}, horn:{fn:'brass',soft:1,rv:.3}, bass:{fn:'bass',rv:0},
    bell:{fn:'bell',ratio:3.5,idx:2,mdec:.3,dec:2.6,rv:.45}, celesta:{fn:'bell',ratio:4,idx:1.1,mdec:.12,dec:1.3,rv:.4},
    mbox:{fn:'bell',ratio:5.02,idx:.8,mdec:.05,dec:1,rv:.4}, drip:{fn:'bell',ratio:2.01,idx:.5,mdec:.04,dec:.9,chirp:1,rv:.55},
    fiddle:{fn:'fiddle',rv:.25}, reed:{fn:'reed',rv:.25}, drone:{fn:'drone',rv:.3}, timp:{fn:'timp',rv:.3}, bubble:{fn:'bubble',rv:.3}
  };

  // ---- score parsing
  const PC={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
  const MODES={ion:[0,2,4,5,7,9,11],dor:[0,2,3,5,7,9,10],phr:[0,1,3,5,7,8,10],lyd:[0,2,4,6,7,9,11],mix:[0,2,4,5,7,9,10],aeo:[0,2,3,5,7,8,10],hm:[0,2,3,5,7,8,11]};
  const BT={R:0,b2:1,2:2,b3:3,4:5,b5:6,5:7,b6:8,6:9,b7:10,8:12,9:14,L:-5};
  const CQ={M:[0,4,7],m:[0,3,7],d:[0,3,6],s:[0,5,7],q:[0,2,7],'+':[0,4,8],j:[0,4,7,11]};
  const VEL={X:1,x:.78,o:.52,g:.3};
  const mf=m=>440*Math.pow(2,(m-69)/12);
  const ds=(sc,i)=>{ const n=sc.length, o=Math.floor(i/n); return sc[i-o*n]+12*o; };
  const accOf=c=>c==='b'?-1:c==='#'?1:0;
  function chord(tok,sc){
    const m=/^([b#]?)(\d)([Mmdsq+j]?)(7?)(?:\/([b#]?)(\d))?$/.exec(tok)||['','','1','','','',''];
    const a=accOf(m[1]), r=+m[2]-1, root=ds(sc,r)+a;
    const iv=m[3]?CQ[m[3]].slice():a?[0,4,7]:[0,ds(sc,r+2)-ds(sc,r),ds(sc,r+4)-ds(sc,r)];
    if(m[4]) iv.push(m[3]||a?10:ds(sc,r+6)-ds(sc,r));
    return {root,iv,bass:m[6]?ds(sc,+m[6]-1)+accOf(m[5]):root};
  }
  function toks(s){
    const o=[];
    for(const t of String(s).split(/\s+/)){ if(!t||t==='|') continue; const [a,b]=t.split('@'), i=a.lastIndexOf(':'); o.push({v:i<0?a:a.slice(0,i),l:i<0?1:+a.slice(i+1),vel:b?+b:1}); }
    return o;
  }
  // pick the inversion and octave of a chord closest to the previous voicing (smooth voice leading)
  function voicing(ch,n,center,prev){
    const pcs=ch.iv.map(i=>ch.root+i), L=pcs.length; let best=null, bc=1e9;
    for(let k=0;k<L;k++){
      const v=[]; for(let i=0;i<n;i++){ const j=k+i; v.push(pcs[j%L]+12*Math.floor(j/L)); }
      const mean=v.reduce((a,b)=>a+b,0)/n, sh=Math.round((center-mean)/12);
      for(let oc=sh-1;oc<=sh+1;oc++){
        let cost=Math.abs(mean+12*oc-center)*(prev?.4:1);
        if(prev&&prev.length===n) for(let i=0;i<n;i++) cost+=Math.abs(v[i]+12*oc-prev[i]);
        if(cost<bc){ bc=cost; best=v.map(x=>x+12*oc); }
      }
    }
    return best;
  }
  // flatten a list of sections into timed events {s (step), p (part), m (midi list or drum name), l (length), v}
  function build(th,names){
    const sc=MODES[th.mode]||MODES.ion, key=PC[th.key]||0, bs=th.meter*th.step, ev=[], prevV={};
    let off=0;
    for(const sn of names){
      const S=th.sec[sn]; if(!S) continue;
      const bars=S.ch.split('|').map(b=>b.trim().split(/\s+/)), len=bars.length*bs, cht=[];
      bars.forEach((b,i)=>{ const seg=bs/b.length; b.forEach((c,j)=>cht.push({s:i*bs+j*seg,c:chord(c,sc),sym:c})); });
      const cAt=s=>{ let k=0; while(k+1<cht.length&&cht[k+1].s<=s+1e-6) k++; return k; };
      th.parts.forEach((P,pi)=>{
        if(S.mute&&S.mute.indexOf(P.n)>=0) return;
        const src=S[P.n]!==undefined?S[P.n]:P.pat;
        if(src==null||src===false||src==='') return;
        const base=12*((P.o==null?4:P.o)+1)+key, vm=(S.vol&&S.vol[P.n])||1, ctr=P.ctr==null?7:P.ctr;
        const push=(s,m,l,v,gr)=>{
          let ss=s; if(th.swing&&Math.abs(ss-Math.round(ss))<1e-6&&Math.round(ss)%2===1) ss+=th.swing;
          ev.push({s:off+ss,p:pi,m,l,v:v*vm,gr});
        };
        const accent=s=>{ const q=s%bs; return q===0?1:q%th.step===0?.88:.76; };
        if(P.t==='drum'){
          for(const k in src){ const pat=src[k].replace(/[\s|]/g,''); if(!pat) continue; for(let s=0;s<len;s++){ const v=VEL[pat[s%pat.length]]; if(v) push(s,k,1,v*(s%bs===0?1:.92)); } }
          return;
        }
        if(P.t==='pad'&&src===true){
          for(let i=0;i<cht.length;i++){
            let j=i; while(j+1<cht.length&&cht[j+1].sym===cht[i].sym) j++;
            const end=j+1<cht.length?cht[j+1].s:len, vc=voicing(cht[i].c,P.vn||4,ctr,prevV[pi]); prevV[pi]=vc;
            push(cht[i].s,vc.map(x=>base+x),end-cht[i].s,.8); i=j;
          }
          return;
        }
        const tk=toks(src); if(!tk.length) return;
        const mel=!P.t||P.t==='mel', vc=new Map();
        let s=0, i=0;
        while(s<len-1e-6){
          const T=tk[i%tk.length]; i++;
          if(!(T.l>0)) break;
          if(T.v!=='r'){
            if(mel){
              const ms=[]; let gr=null;
              for(const d of T.v.split(',')){ const mm=/^(-?\d+)([#b]?)$/.exec(d); if(!mm) continue; const ix=+mm[1]-1; ms.push(base+ds(sc,ix)+accOf(mm[2])); if(gr==null) gr=base+ds(sc,ix+1); }
              if(ms.length){ push(s,ms,Math.min(T.l,len-s),T.vel*(s%bs===0?1:.92),gr); if(th._dbg){ const C0=cht[cAt(s)].c; ev[ev.length-1].dbg={sec:sn,bar:Math.floor(s/bs)+1,beat:s%bs/th.step+1,pcs:C0.iv.map(x=>(((C0.root+x+key)%12)+12)%12),sym:cht[cAt(s)].sym}; } }
            }else{
              const k=cAt(s), C=cht[k].c;
              if(P.t==='bass'){
                const wrap=x=>{ let r=base+((x%12)+12)%12; if(r>base+7) r-=12; return r; };
                const bm=wrap(C.bass), rr=wrap(C.root); let m=null;
                if(T.v==='R') m=bm; else if(T.v==='3') m=rr+C.iv[1]; else if(T.v==='7') m=rr+(C.iv[3]!=null?C.iv[3]:10);
                else if(T.v==='N') m=wrap(cht[(k+1)%cht.length].c.bass); else if(BT[T.v]!=null) m=rr+BT[T.v];
                if(m!=null) push(s,[m],T.l,T.vel*accent(s));
              }else{
                let v=vc.get(k); if(!v){ v=voicing(C,P.vn||3,ctr,prevV[pi]); prevV[pi]=v; vc.set(k,v); }
                let ms;
                if(T.v==='c') ms=v.map(x=>base+x);
                else { const n=+T.v, L=v.length; if(!(n>=0)) { s+=T.l; continue; } ms=[base+v[n%L]+12*Math.floor(n/L)]; }
                push(s,ms,T.l,T.vel*accent(s));
              }
            }
          }
          s+=T.l;
          if(mel&&i>=tk.length&&!P.cyc) break;
        }
      });
      off+=len;
    }
    ev.sort((a,b)=>a.s-b.s);
    return {ev,len:off};
  }

  // ---- output chain for a context: theme bus and stinger bus -> dialogue duck -> compressor -> volume -> speakers,
  // with a shared reverb (generated impulse) and a tempo-synced echo
  function impulse(ac,sec){
    const sr=ac.sampleRate, n=Math.floor(sr*sec), b=ac.createBuffer(2,n,sr), pre=Math.floor(sr*.016);
    for(let c=0;c<2;c++){
      const d=b.getChannelData(c); let lp=0;
      for(let i=0;i<n;i++){ const x=i/n; lp+=(Math.random()*2-1-lp)*(.9-.72*x); d[i]=i<pre?0:lp*Math.pow(1-x,2.4)*(1+(i<pre+sr*.05&&Math.random()<.004?3:0)); }
    }
    return b;
  }
  function mkCtx(ac,vol,offline){
    const C={ac,live:0,made:0,drop:0,cap:offline?1e9:48};
    if(!offline&&SFX.ac===ac&&SFX.noise) C.noise=SFX.noise;
    else { const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; C.noise=b; }
    C.out=gn(ac,vol); C.vis=gn(ac,1);   // volume and mute, then the hidden-tab fade
    const cp=ac.createDynamicsCompressor();
    cp.threshold.value=-12; cp.knee.value=10; cp.ratio.value=3; cp.attack.value=.006; cp.release.value=.25;
    C.dk=gn(ac,1); const trim=gn(ac,.35), ls=flt(ac,'lowshelf',120), hs=flt(ac,'highshelf',2500), hp=flt(ac,'highpass',38,.7);
    ls.gain.value=-3; hs.gain.value=6;   // tame the sub (phones cannot play it anyway), add a little air
    C.dk.connect(trim); trim.connect(ls); ls.connect(hs); hs.connect(hp); hp.connect(cp); cp.connect(C.out); C.out.connect(C.vis); C.vis.connect(ac.destination);
    C.rvIn=gn(ac,1); const cv=ac.createConvolver(); cv.buffer=impulse(ac,2.3); const rvo=gn(ac,.5);
    C.rvIn.connect(cv); cv.connect(rvo); rvo.connect(C.dk);
    C.dlIn=gn(ac,1); C.dly=ac.createDelay(1.5); C.dly.delayTime.value=.4;
    const fb=gn(ac,.3), dlp=flt(ac,'lowpass',2400,.5), dlo=gn(ac,.45), dlr=gn(ac,.35);
    C.dlIn.connect(C.dly); C.dly.connect(dlp); dlp.connect(fb); fb.connect(C.dly); dlp.connect(dlo); dlo.connect(C.dk); dlo.connect(dlr); dlr.connect(C.rvIn);
    C.tb=gn(ac,1); C.trv=gn(ac,1); C.tdl=gn(ac,1); C.tb.connect(C.dk); C.trv.connect(C.rvIn); C.tdl.connect(C.dlIn);
    C.dest={d:C.tb,r:C.trv,l:C.tdl}; C.sdest={d:C.dk,r:C.rvIn,l:C.dlIn};
    return C;
  }
  function setDelay(C,th,t){
    const q=60/(th.qbpm||th.bpm), dt=clamp(th.dly||q*.75,.18,.75);   // dotted eighth
    C.dly.delayTime.setTargetAtTime(dt,t||0,.05);
  }
  // ---- a playing theme or stinger
  function mkInst(C,th,dest,once){
    const offline=C.cap>1e8;
    const ac=C.ac, g=gn(ac,1), gw=gn(ac,1), gd=gn(ac,1);
    g.connect(dest.d); gw.connect(dest.r); gd.connect(dest.l);
    const parts=th.parts.map(P=>{
      const prm=Object.assign({},PRE[P.i]||{},P), pg=gn(ac,(P.v==null?1:P.v)*(th.g||1));
      let out=pg; if(P.pan&&ac.createStereoPanner){ const pn=ac.createStereoPanner(); pn.pan.value=P.pan; pg.connect(pn); out=pn; }
      out.connect(g);
      const rs=prm.rv!=null?prm.rv:.25; if(rs>0){ const s=gn(ac,rs); pg.connect(s); s.connect(gw); }
      if(prm.dl){ const s=gn(ac,prm.dl); pg.connect(s); s.connect(gd); }
      return {prm,pg,fn:INST[prm.fn||P.i]||INST.pluck};
    });
    if(!th._b) th._b={};
    const intro=th.intro?(th._b.i||(th._b.i=build(th,th.intro))):null;
    const loop=(!once&&th.form)?(th._b.f||(th._b.f=build(th,th.form))):null;
    return {th,g,gw,gd,parts,intro,loop,once,vo:offline?null:[],cur:intro||loop,pos:0,t0:0,n:0,end:1e9,fin:0,spS:60/th.bpm/th.step,rng:mulberry32(1234+(th.bpm|0))};
  }
  // schedule every event of I that starts before horizon; if the clock jumped (tab was hidden), slide the
  // timeline forward instead of firing the missed notes
  function pump(C,I,horizon,now,cap){
    let guard=0; const gmax=cap||600;
    while(I.cur&&guard++<gmax){
      const sq=I.cur;
      if(I.pos>=sq.ev.length){
        I.t0+=sq.len*I.spS; I.pos=0;
        if(sq===I.intro&&I.loop) I.cur=I.loop; else if(sq===I.loop) I.n++; else { I.cur=null; I.fin=I.t0; break; }
        if(I.t0>horizon) break;
        continue;
      }
      const e=sq.ev[I.pos], t=I.t0+e.s*I.spS;
      if(t>=horizon||t>=I.end) break;
      if(now!=null&&t<now-.1){ I.t0+=now+.04-t; continue; }
      note(C,I,e,t); I.pos++;
    }
  }
  function note(C,I,e,t){
    const N=I.parts[e.p], P=N.prm, r=I.rng;
    if(C.live>=C.cap&&!P.lead&&!I.once){ C.drop++; return; }   // stingers and lead lines always get through
    const v=e.v*(.93+r()*.14); t=Math.max(0,t+(r()-.5)*.006);
    if(I.vo){ if(I.vo.length>160) I.vo=I.vo.filter(s=>!s.done); C.reg=I.vo; }
    try{
      if(typeof e.m==='string'){ const f=INST[e.m]; if(f) f(C,N.pg,t,0,.2,v,P); return; }
      const d=e.l*I.spS*(P.leg||.94);
      if(P.orn&&I.n>0&&e.gr!=null&&e.l>=3&&e.m.length===1&&r()<.22) N.fn(C,N.pg,Math.max(0,t-.07),mf(e.gr),.07,v*.5,P);
      for(const m of e.m) N.fn(C,N.pg,t,mf(m),d,v,P);
    }catch(err){}
    C.reg=null;
  }
  function ramp(nodes,to,t,dur){ for(const g of nodes){ const p=g.gain; p.cancelScheduledValues(t); p.setValueAtTime(p.value,t); p.linearRampToValueAtTime(to,t+Math.max(.01,dur)); } }
  // silence an instance for good: stop its voices that are still ringing (inaudible by now) and unhook it
  function kill(I){
    const t=I.g.context.currentTime+.03;
    if(I.vo) for(const ss of I.vo) if(!ss.done) for(const s of ss) try{ s.stop(t); }catch(e){}
    for(const n of [I.g,I.gw,I.gd]) try{ n.disconnect(); }catch(e){} I.cur=null; I.dead=true; I.vo=null;
  }

  // ---- live state
  const ALIAS={title:'menu',overworld:'meadow',field:'meadow',fields:'meadow',grass:'meadow',plains:'meadow',woods:'forest',whisperwood:'forest',
    emberhollow:'village',home:'house',shop:'house',interior:'house',tavern:'inn',market:'town',hamlet:'town',brindlecross:'town',coppergulch:'town',lodge:'town',
    ash:'road',ashen:'road',mountains:'crags',drakeling:'crags',swamp:'mire',mirefen:'mire',snow:'frost',highlands:'frost',volcano:'cinder',cinderlands:'cinder',
    dungeon:'cave',caves:'cave',deepcave:'deep',fight:'combat',battle:'combat',vorlaxis:'final',dragon:'final',ending:'victory',win:'victory',
    normal:'arena',waves:'arena',gameover:'dead',death:'dead',sad:'tender',emotional:'tender'};
  const XF=2;
  const K=.55;          // master level at volume 1 (calibrated by offline renders, keeps music well under the SFX)
  let C=null, muted=!!store.get('eb_music_off',false), vol=.5, cur=null, timer=null;
  const live=[], stings=[];
  const outGain=()=>muted?0:vol*K;
  function resolve(n){ if(n==null) return null; if(MSCORE[n]) return n; const a=ALIAS[String(n).toLowerCase()]; return a&&MSCORE[a]?a:undefined; }
  function tick(){
    if(!C) return;
    const now=C.ac.currentTime, hz=now+.15;
    for(let i=live.length-1;i>=0;i--){ const I=live[i]; pump(C,I,hz,now); if(now>(I.kill||I.end+.3)||(!I.cur&&now>I.fin+4)){ kill(I); live.splice(i,1); } }
    for(let i=stings.length-1;i>=0;i--){ const I=stings[i]; pump(C,I,hz,now); if(now>(I.kill||I.end+.3)||(!I.cur&&now>I.fin+3.5)){ kill(I); stings.splice(i,1); } }
  }
  function fadeOut(I,dur){
    const t=C.ac.currentTime;
    if(t<(I.born||0)+.05&&I.n===0&&I.cur===(I.intro||I.loop)){ for(const g of [I.g,I.gw,I.gd]){ g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0,t); } I.end=t; I.kill=t+.05; return; }   // not heard yet: drop it at once
    if(I.kill) dur=Math.min(dur,Math.max(.05,I.kill-.3-t));
    ramp([I.g,I.gw,I.gd],0,t,dur); I.end=t+dur*.6; I.kill=t+dur+.3;   // stop adding notes once the fade is mostly done
  }
  function start(name,fi){
    const th=MSCORE[name]; if(!C||!th) return;
    const now=C.ac.currentTime;
    for(const I of live) fadeOut(I,(I.kill||now-I.born<1)?.3:XF);   // a theme that only just arrived leaves quickly
    const I=mkInst(C,th,C.dest,false); I.t0=I.born=now+.2;
    for(const g of [I.g,I.gw,I.gd]){ g.gain.setValueAtTime(0,now); g.gain.setValueAtTime(0,now+.2); g.gain.linearRampToValueAtTime(1,now+.2+fi); }
    setDelay(C,th,now); live.push(I);
  }
  function init(){
    if(C) return;
    const ac=SFX.ac; if(!ac) return;
    try{ C=mkCtx(ac,outGain(),false); }catch(e){ C=null; return; }
    timer=setInterval(tick,25);
    try{ document.addEventListener('visibilitychange',()=>{ if(!C) return; const t=C.ac.currentTime; C.vis.gain.cancelScheduledValues(t); C.vis.gain.setTargetAtTime(document.hidden?0:1,t,document.hidden?.05:.4); }); }catch(e){}
    if(cur&&!muted) start(cur,1.2);
  }
  function setTheme(n){
    const r=resolve(n); if(r===undefined) return;      // unknown name: keep whatever is playing
    if(r===cur) return; cur=r;
    if(!C||muted) return;
    if(r==null){ for(const I of live) fadeOut(I,XF); return; }
    start(r,1.6);
  }
  function stinger(n){
    const th=MSTING[n]; if(!C||muted||!th) return;
    const now=C.ac.currentTime;
    for(const S of stings) fadeOut(S,.15);
    const I=mkInst(C,th,C.sdest,true); I.t0=I.born=now+.03; stings.push(I);
    const dur=Math.max(1,(I.intro?I.intro.len:0)*I.spS);
    for(const g of [C.tb,C.trv,C.tdl]){ const p=g.gain; p.cancelScheduledValues(now); p.setValueAtTime(p.value,now); p.linearRampToValueAtTime(.28,now+.12); p.setValueAtTime(.28,now+dur*.85); p.linearRampToValueAtTime(1,now+dur*.85+1.4); }
    pump(C,I,now+.15,now);
  }
  function toggle(){
    muted=!muted; store.set('eb_music_off',muted);
    if(C){
      const t=C.ac.currentTime; C.out.gain.cancelScheduledValues(t); C.out.gain.setTargetAtTime(outGain(),t,.08);
      if(muted){ for(const I of live) fadeOut(I,.3); for(const S of stings) fadeOut(S,.2); }
      else if(cur) start(cur,1);
    }
    return muted;
  }
  function duck(on){ if(!C) return; const t=C.ac.currentTime; C.dk.gain.cancelScheduledValues(t); C.dk.gain.setTargetAtTime(on?.45:1,t,on?.15:.35); }
  function setVolume(v){ vol=clamp(+v||0,0,1); if(C){ const t=C.ac.currentTime; C.out.gain.cancelScheduledValues(t); C.out.gain.setTargetAtTime(outGain(),t,.05); } }

  // ---- testing helpers
  function renderOffline(name,sec,opt){
    sec=sec||12; opt=opt||{};
    const th=MSCORE[name]||MSTING[name]; if(!th) return Promise.reject(new Error('unknown theme '+name));
    const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext, sr=opt.sr||44100, oac=new OAC(2,Math.ceil(sr*sec),sr);
    const X=mkCtx(oac,opt.vol==null?vol*K:opt.vol,true); if(opt.log) X.log=[];
    const once=!MSCORE[name]||!!opt.once, I=mkInst(X,th,once?X.sdest:X.dest,once); I.t0=.05;
    if(opt.solo) th.parts.forEach((P,i)=>{ if(P.n!==opt.solo) I.parts[i].pg.gain.value=0; });
    setDelay(X,th,0); pump(X,I,sec,null,1e8);
    return oac.startRendering().then(buf=>{ buf._stats={made:X.made,log:X.log}; return buf; });
  }
  // compare every melody and pattern against its section length
  function check(){
    const out=[];
    const all=Object.assign({},MSCORE); for(const k in MSTING) all['sting:'+k]=MSTING[k];
    for(const name in all){
      const th=all[name], bs=th.meter*th.step;
      for(const sn in th.sec){
        const S=th.sec[sn], len=S.ch.split('|').length*bs;
        for(const P of th.parts){
          const src=S[P.n]!==undefined?S[P.n]:P.pat;
          if(src==null||src===true||src===false||P.t==='drum') continue;
          const tot=toks(src).reduce((a,t)=>a+t.l,0);
          if(!P.t||P.t==='mel'){ if(Math.abs(tot-len)>1e-6) out.push(`${name}.${sn}.${P.n}: melody ${tot} steps, section ${len}`); }
          else if(len%tot!==0&&tot%len!==0) out.push(`${name}.${sn}.${P.n}: pattern ${tot} steps does not fit section ${len}`);
        }
        for(const P of th.parts){
          if(P.t!=='drum'||(S.mute&&S.mute.indexOf(P.n)>=0)) continue;
          const src=S[P.n]!==undefined?S[P.n]:P.pat; if(!src) continue;
          for(const k in src){ if(!INST[k]) out.push(`${name}.${sn}: unknown drum ${k}`); const pl=src[k].replace(/[\s|]/g,'').length; if(len%pl!==0&&pl%len!==0) out.push(`${name}.${sn}.${k}: drum pattern ${pl} vs ${len}`); }
        }
      }
      for(const P of th.parts) if(P.i&&!PRE[P.i]&&!INST[P.i]) out.push(`${name}.${P.n}: unknown instrument ${P.i}`);
    }
    return out;
  }

  return {init,setTheme,stinger,toggle,duck,setVolume,
    get muted(){ return muted; }, get theme(){ return cur; }, get volume(){ return vol; },
    themes:()=>Object.keys(MSCORE), stingers:()=>Object.keys(MSTING),
    _renderOffline:renderOffline, _check:check, _isSting:n=>!MSCORE[n]&&!!MSTING[n], _parts:n=>{ const th=MSCORE[n]||MSTING[n]; return th?th.parts.map(P=>P.n):[]; },
    _dump:n=>{ const th=MSCORE[n]||MSTING[n]; if(!th) return null; th._dbg=1; const names=(th.intro||[]).concat(th.form||[]); const B=build(th,names); delete th._dbg;
      const NN=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'], rg={}, bad=[]; let strong=0,ok=0;
      for(const e of B.ev){ const P=th.parts[e.p]; if(typeof e.m==='string') continue; const r=rg[P.n]||(rg[P.n]=[999,0,0]); for(const m of e.m){ r[0]=Math.min(r[0],m); r[1]=Math.max(r[1],m); } r[2]++;
        if(e.dbg&&Number.isInteger(e.dbg.beat)&&e.l>=th.step){ strong++; const pc=e.m[0]%12; if(e.dbg.pcs.indexOf(pc)>=0) ok++; else bad.push(`${P.n} ${e.dbg.sec} bar${e.dbg.bar} beat${e.dbg.beat} ${NN[pc]} over ${e.dbg.sym}`); } }
      const R={}; for(const k in rg) R[k]=NN[rg[k][0]%12]+(Math.floor(rg[k][0]/12)-1)+'..'+NN[rg[k][1]%12]+(Math.floor(rg[k][1]/12)-1)+' n'+rg[k][2];
      return {ranges:R,strongChordTones:strong?Math.round(ok/strong*100):100,bad}; },
    _level:()=>{ if(!C) return 0; if(!C.an){ C.an=C.ac.createAnalyser(); C.an.fftSize=2048; C.vis.connect(C.an); } const a=new Float32Array(2048); C.an.getFloatTimeDomainData(a); let s=0; for(const x of a) s+=x*x; return Math.sqrt(s/a.length); },
    _stats:()=>({dk:C?+C.dk.gain.value.toFixed(3):0,tb:C?+C.tb.gain.value.toFixed(3):0,out:C?+C.out.gain.value.toFixed(3):0,vis:C?+C.vis.gain.value.toFixed(3):0,live:C?C.live:0,made:C?C.made:0,drop:C?C.drop:0,insts:live.length,stings:stings.length,state:C?C.ac.state:'none'})};
})();
window.__ebDbg=Object.assign(window.__ebDbg||{},{Music});
