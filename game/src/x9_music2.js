
// ================= music for Act IV (Moonfall) and the Finale (Nightfall Peak)
// Themes in the MSCORE format of a14_music.js (read its header first), routed by wrapping musicMood (bottom of this file).
// Everything here sits inside one block so no name leaks into the shared scope; only MSCORE, MSTING and musicMood change.
// Act IV:  m_sea m_reef m_drift m_deep m_lumen m_glass m_sable m_burrows m_temple m_eclipse m_night m_dark m_hush
// Finale:  n_bridge n_ascent n_clocks n_rime n_glass n_echo n_echo_hush n_summit n_fight
//          n_nyxara n_nyxara2 n_nyxara3 n_nyxara4 n_heart n_fall n_end_dawn n_end_ember n_end_moth n_dawn n_epilogue n_victory
// Stingers: m_bite (a bite out of the moon), n_rise (Nightfall Peak rises out of the sea)
// Loudness: every g below was set from offline renders (scratchpad b_mus2/mus.py) to the a14 targets
// (about -29.5 dBFS RMS, the quiet ones -31 to -32, stingers -25.5 at their loudest 0.4 s).
{
// ---- the lantern song (THREADS 14.4). The tune is the one x9_music.js builds for the whole game (MS_LANTERN, 4/4
// eighths, 8 bars, chords MS_LANTERNC), copied here note for note under our own names, so this file does not depend on
// load order and nothing clashes. If x9_music.js changes the tune, copy it again (LS4 and LS4C), and redo LS from it.
// "Little lantern, burning bright, / light the way home through the night. / One for you and one for me, / and one more, just to see."
const LS4='1:3 3:1 5:2 3:2 | 4:2 3:2 2:4 | 2:3 4:1 6:2 4:2 | 5:2 4:2 3:4 | 5:2 6:2 8:2 6:2 | 5:2 3:2 5:4 | 6:2 7:2 8:4 | 5:2 2:2 1:4';
const LS4C='1|2 5|2|57 1|1 4|1|6 4|5 1';
// the same tune with every 4/4 bar folded into one bar of 6/8 (or 3/4): 8 bars of 6 eighths, the same chords
const LS='1:2 3:1 5:2 3:1 | 4:2 3:1 2:3 | 2:2 4:1 6:2 4:1 | 5:2 4:1 3:3 | 5:2 6:1 8:2 6:1 | 5:2 3:1 5:3 | 6:2 7:1 8:3 | 5:2 2:1 1:3';
const LSC=LS4C;
// a second voice a third or sixth below, and a slow counter line (one or two notes a bar), both over LSC
const LSlo='-2:2 1:1 3:2 1:1 | 2:2 1:1 0:3 | -1:2 2:1 4:2 2:1 | 0:2 2:1 1:3 | 3:2 4:1 6:2 4:1 | 3:2 1:1 3:3 | 1:2 3:1 4:3 | 2:2 0:1 -4:3';
const LSctr='1:6 | 4:3 5:3 | 6:6 | 5:3 3:3 | 3:3 4:3 | 5:6 | 6:3 4:3 | 5:3 8:3';
const LS4ctr='1:8 | 4:4 5:4 | 6:8 | 5:4 3:4 | 3:4 4:4 | 5:8 | 6:4 4:4 | 5:4 8:4';
// in a minor key: the same degrees over minor chords
const LSmC='1|4 5|2|5 1|1 4|1|6 4|5 1';
// Nyxara hums it backwards (every token of LS in reverse order); harmony for it in a minor key
const LSbk='1:3 2:1 5:2 | 8:3 7:1 6:2 | 5:3 3:1 5:2 | 6:1 8:2 6:1 5:2 | 3:3 4:1 5:2 | 4:1 6:2 4:1 2:2 | 2:3 3:1 4:2 | 3:1 5:2 3:1 1:2';
const LSbkC='1|6|1|4|1|4|7|1';
// in a minor key written as major (raised third, sixth and seventh): hope coming back
const LSmaj='1:2 3#:1 5:2 3#:1 | 4:2 3#:1 2:3 | 2:2 4:1 6#:2 4:1 | 5:2 4:1 3#:3 | 5:2 6#:1 8:2 6#:1 | 5:2 3#:1 5:3 | 6#:2 7#:1 8:3 | 5:2 2:1 1:3';
const LSmajC='1M|2m 5M|2m|5M7 1M|1M 4M|1M|#6m 4M|5M 1M';
// the Emberblood leitmotif (a14 MS_LM1 + MS_LM2) re-barred for 3/4 and for 6/8; chords MS_LMC (major) or LM3mC (minor)
const LM3='-2:1 1:3 2:1 3:1 | 5:4 4:1 3:1 | 2:2 3:1 2:1 1:1 -1:1 | 2:6 | -2:1 1:3 2:1 3:1 | 6:4 5:1 8:1 | 7:3 8:1 9:2 | 8:6';
const LM68='-2:1 1:2 2:1 3:2 | 5:4 4:1 3:1 | 2:2 3:1 2:1 1:1 -1:1 | 2:6 | -2:1 1:2 2:1 3:2 | 6:4 5:1 8:1 | 7:2 8:1 9:2 7:1 | 8:6';
const LM3mC='1|3|7|5|1|4|5|1';
// Nyxara's own theme (6/8 or 3/4, minor): a lullaby that sighs downward. Chords NYXC
const NYX='8:3 7:2 5:1 | 3:3 5:3 | 6:3 5:2 3:1 | 1:6 | 4:3 6:2 8:1 | 8:3 6:3 | 5:3 7#:2 9:1 | 7#:3 5:3';
const NYXC='1 7|1|6 3|6|4|4|5M|5M';
// Hush: the lantern song in minor, then away from it (3/4); B is the cold brass answer
const HUSH_A='1:2 3:1 5:2 3:1 | 4:2 3:1 2:3 | 2:2 4:1 6:2 4:1 | 5:2 4:1 3:3 | 5:2 8:1 10:2 8:1 | 7:2 9:1 11:2 9:1 | 10:2 8:1 6:2 8:1 | 7#:3 5:3';
const HUSH_AC='1|4 5M|2|5M 3|1|7|6|5M';
const HUSH_B='6:4 8:2 | 7:4 9:2 | 8:3 7:1 5:2 | 3:6 | 10:4 8:2 | 11:4 9:2 | 9:3 7#:3 | 5:6';
const HUSH_BC='6|7|1|1|6|7|5M|5M';
// the sea song (6/8) and its third-lower harmony
const SEA_A='5:2 3:1 5:2 8:1 | 8:3 6:3 | 6:2 4:1 6:2 8:1 | 7:3 5:3 | 5:2 3:1 5:2 10:1 | 10:3 9:2 7:1 | 6:2 8:1 7:2 5:1';
const SEA_H='3:2 1:1 3:2 6:1 | 6:3 3:3 | 4:2 2:1 4:2 6:1 | 5:3 2:3 | 3:2 1:1 3:2 8:1 | 7:3 7:2 5:1 | 4:2 6:1 5:2 2:1';
// reef, shanty, oasis and desert tunes (eighths; msX(...,2) doubles them onto a sixteenth grid)
const REEF_A='5:1 r:1 5:1 6:1 5:1 3:1 1:2 | 6:1 r:1 6:1 8:1 6:1 4:1 1:2 | 7:1 r:1 7:1 9:1 7:1 5:1 2:2 | 3:2 5:2 8:3 r:1 | 5:1 r:1 5:1 6:1 5:1 3:1 8:2 | 8:1 r:1 8:1 10:1 8:1 6:1 4:2 | 6:1 4:1 2:2 5:1 7:1 9:2 | 8:4 r:4';
const REEF_B='10:2 8:1 6:1 8:2 r:2 | 9:2 6:1 4:1 6:2 r:2 | 7:2 9:1 7:1 5:2 2:2 | 3:4 5:2 r:2 | 10:2 8:1 6:1 8:2 10:2 | 11:2 9:1 6:1 9:2 11:2 | 8:2 6:2 9:2 7:2 | 8:6 r:2';
const DRIFT_A='1:2 1:1 1:1 3:2 5:2 | 5:2 3:1 5:1 8:2 5:2 | 7:2 7:1 7:1 9:2 11:2 | 11:2 9:1 11:1 7:2 9:2 | 1:2 1:1 1:1 3:2 5:2 | 8:2 7:1 6:1 5:2 3:2 | 7:2 9:2 5:2 2:2 | 1:4 r:4';
const DRIFT_B='5:3 5:1 5:2 3:2 | 7:2 5:2 3:4 | 4:3 4:1 4:2 2:2 | 7:2 4:2 2:4 | 6:3 6:1 6:2 4:2 | 8:2 6:2 4:4 | 5:2 7:2 9:2 7:2 | 8:6 r:2';
const SABLE_A='5:3 4:1 3:2 1:2 | 1:1 2:1 3:1 4:1 5:2 3:2 | 6:3 5:1 6:2 8:2 | 7:3 6:1 5:2 2:2 | 5:3 4:1 3:2 1:2 | 4:1 5:1 6:1 5:1 4:2 1:2 | 2:1 3:1 4:1 2:1 0:2 -2:2 | 1:4 r:4';
const SABLE_B='8:3 6:1 4:4 | 5:3 3:1 1:4 | 8:3 9:1 8:2 6:2 | 5:6 r:2 | 6:3 5:1 6:2 8:2 | 7:3 6:1 5:2 3:2 | 5:2 7:2 9:2 7:2 | 5:6 r:2';
const GLASS_A='1:2 2:2 3#:4 | 2:3 1:1 2:2 4:2 | 3#:2 4:2 5:4 | 7:2 6:1 5:1 4:4 | 6:3 5:1 6:2 8:2 | 6:2 4:2 2:4 | 3#:2 2:2 1:2 2:2 | 1:6 r:2';
const GLASS_B='8:4 6:2 4:2 | 4:8 | 5:4 3#:2 4:2 | 1:8 | 6:4 8:2 10:2 | 9:4 7:2 4:2 | 9:2 8:2 6:2 4:2 | 8:8';
const GLASS_OUD='4:2 6:2 8:2 6:2 | 4:2 6:2 8:2 6:2 | 1:2 3#:2 5:2 3#:2 | 1:2 3#:2 5:2 8:2 | 6:2 8:2 10:2 8:2 | 7:2 9:2 11:2 9:2 | 2:2 4:2 6:2 4:2 | 1:4 r:4';
// a fight on the peak
const NF_A='1:2 1:1 2:1 1:2 5:2 | 4:2 2:1 4:1 6:4 | 5:2 3:1 5:1 8:2 5:2 | 7:6 r:2 | 1:2 1:1 2:1 1:2 5:2 | 6:2 4:1 6:1 9:4 | 7:2 5:2 4:2 2:2 | 1:6 r:2';
const NF_VB=Array(8).fill('r:6 8,9:2 r:8').join(' | ');
const NF_B='8:4 6:2 8:2 | 7:4 5:2 4:2 | 5:2 3:2 1:4 | 3:6 r:2 | 10:4 8:2 6:2 | 9:4 7:2 4:2 | 6:2 4:2 2:4 | 2:6 r:2';
// violet bells: an FM bell with an out-of-tune partial (a little wrong, the way music goes near Nyxara)
const VB={i:'bell',ratio:2.41,idx:1.6,mdec:.3,dec:3.2,rv:.6};
const GB={i:'bell',ratio:2.76,idx:1.3,mdec:.2,dec:2.4,rv:.55};
const P=(o,x)=>Object.assign({},o,x);

Object.assign(MSCORE,{
// ===================================== Act IV: Moonfall
// ---- the Sunken Isles: a lilting 6/8 sea song in A, flute and ocarina over rolling harp (bpm counts eighths)
m_sea:{g:1.218,key:'A',mode:'ion',bpm:180,qbpm:90,meter:6,step:1,form:['A','A2','B','A3'],
  parts:[
    {n:'flute',i:'flute',o:4,v:1,orn:1,lead:1,att:.08,pan:.1},
    {n:'oca',i:'ocarina',o:4,v:.85,orn:1,lead:1,pan:-.12},
    {n:'cel',i:'celesta',o:5,v:.4,pan:.35,dl:.35},
    {n:'harp',t:'arp',i:'harp',o:3,v:.5,ctr:9,pan:-.28,pat:'0:1 1:1 2:1 3:1 2:1 1:1'},
    {n:'str',t:'pad',i:'strings',o:3,v:.42,ctr:9,att:1.1,rel:1.2,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.75,pat:'R:3 5:3'},
    {n:'dr',t:'drum',v:.6,rv:.3,pat:{frame:'o.....',shaker:'...g..'}}
  ],
  sec:{
    A:{ch:'1|6|4|5|1|3|4 5|1',flute:SEA_A+' | 8:3 r:3'},
    A2:{ch:'1|6|4|5|1|3|4 5|1',oca:SEA_A+' | 8:6',cel:'r:3 5:1 3:2 | r:6 | r:3 6:1 4:2 | r:6 | r:3 5:1 8:2 | r:6 | r:6 | 8:3 r:3'},
    B:{ch:'6|3|4|1|2|5|4|5',flute:'6:2 8:1 10:2 8:1 | 7:3 5:2 3:1 | 4:2 6:1 8:2 6:1 | 5:2 3:1 1:3 | 2:2 4:1 6:2 4:1 | 7:2 6:1 5:3 | 6:2 4:1 8:2 6:1 | 7:3 5:3',
      harp:'0:2 1:1 2:2 1:1'},
    A3:{ch:'1|6|4|5|1|3|4 5|1',flute:SEA_A+' | 8:6',oca:SEA_H+' | 3:3 r:3',dr:{frame:'x..o..',shaker:'.g.g.g'}}
  }},
// ---- Driftwood Lagoon and the reefs: bubbly, a tresillo bass, pizzicato and celesta like a glockenspiel, popping bubbles
m_reef:{g:1.556,key:'Bb',mode:'ion',bpm:116,meter:4,step:4,form:['A','B','A2','B'],
  parts:[
    {n:'pz',i:'pizz',o:4,v:1,lead:1,leg:.6,pan:.1},
    {n:'cel',i:'celesta',o:4,v:.5,lead:1,pan:.3,dl:.25},
    {n:'mar',t:'arp',i:'pizz',o:3,v:.5,ctr:9,pan:-.25,pat:'0:2 2:2 1:2 2:2 0:2 2:2 1:1 2:1 3:2'},
    {n:'bub',t:'arp',i:'bubble',o:4,v:.55,ctr:7,pan:-.35,pat:'0:1 r:1 2:1 r:1 1:1 r:2 3:1 r:2 0:1 r:1 2:1 r:3'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.3,ctr:9,pat:true,cut:1000},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:3 R:3 5:2 8:3 5:3 R:2'},
    {n:'dr',t:'drum',v:.65,rv:.15,pat:{shaker:'g.o.g.o.g.o.g.o.',tock:'o..o..o...o.o...',frame:'x.......x.......'}}
  ],
  sec:{
    A:{ch:'1|4|5|1|1|4|2 5|1',pz:msX(REEF_A,2)},
    B:{ch:'6|2|5|1|6|2|4 5|1',cel:msX(REEF_B,2),mar:'0:4 1:4 2:4 1:4'},
    A2:{ch:'1|4|5|1|1|4|2 5|1',pz:msX(REEF_A,2),cel:msX(REEF_A,2),bub:'0:1 r:1 2:1 1:1 r:1 3:1 r:1 1:1 0:1 r:1 2:1 r:1 4:1 r:1 2:1 r:1'}
  }},
// ---- Driftwood Landing: a raft-town sea shanty in D dorian (fiddle call, squeezebox reed, stomp and clap)
m_drift:{g:1.441,key:'D',mode:'dor',bpm:118,meter:4,step:2,swing:.12,form:['A','B','A2','B2'],
  parts:[
    {n:'fid',i:'fiddle',o:4,v:1,orn:1,lead:1,pan:-.1},
    {n:'reed',i:'reed',o:4,v:.8,orn:1,lead:1,pan:.12},
    {n:'fl',i:'flute',o:5,v:.35,pan:.25},
    {n:'lute',t:'arp',i:'lute',o:3,v:.6,ctr:10,pan:.28,pat:'r:1 c:1 r:1 c:1 r:1 c:1 r:1 c:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2 5:2 R:2 5:2'},
    {n:'dr',t:'drum',v:.7,rv:.12,pat:{frame:'X...x...',snare:'..g...g.',shaker:'.g.g.g.g'}}
  ],
  sec:{
    A:{ch:'1|1|7|7|1|1|7 5|1',fid:DRIFT_A},
    B:{ch:'3|3|7|7|4|4|5 7|1',fid:DRIFT_B,reed:DRIFT_B},
    A2:{ch:'1|1|7|7|1|1|7 5|1',reed:DRIFT_A,fl:DRIFT_A},
    B2:{ch:'3|3|7|7|4|4|5 7|1',fid:DRIFT_B,reed:DRIFT_B,fl:DRIFT_B,dr:{frame:'X...x...',snare:'..o...o.',shaker:'.g.g.g.g',taiko:'o.......'}}
  }},
// ---- Coralcombe, the bubble caves, the mangroves: muffled and bubbly, Ab lydian, celesta drops over low "ooh"
m_deep:{g:1.55,key:'Ab',mode:'lyd',bpm:66,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'cel',i:'celesta',o:4,v:1,lead:1,pan:.15,dl:.4},
    {n:'fl',i:'flute',o:4,v:.65,lead:1,att:.25,pan:-.1},
    {n:'harp',t:'arp',i:'harp',o:3,v:.45,ctr:9,pan:-.3,pat:'0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.35,ctr:9,att:2,rel:2,f1:380,f2:680,pat:true},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,cut:520,att:1.6,pat:true},
    {n:'bub',t:'arp',i:'bubble',o:4,v:.5,ctr:7,pan:.35,pat:'r:3 0:1 r:5 2:1 r:2 1:1 r:3'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.55,pat:'R:12 5:4'}
  ],
  sec:{
    A:{ch:'1|2|1|2|3|6|2|5',cel:msX('5:4 3:2 5:2 | 6:6 2:2 | 5:3 3:1 1:4 | 2:2 4:2 6:4 | 7:4 5:2 3:2 | 6:4 8:2 10:2 | 9:4 6:2 4:2 | 5:6 r:2',2)},
    B:{ch:'6|3|2|1|6|3|2|5',fl:msX('6:4 5:2 3:2 | 3:6 5:2 | 6:4 9:2 6:2 | 5:8 | 6:4 8:2 10:2 | 10:6 7:2 | 9:4 6:4 | 5:8',2),
      cel:msX('r:6 12:1 10:1 | r:8 | r:6 13:1 9:1 | r:8 | r:6 12:1 10:1 | r:8 | r:6 9:1 11:1 | r:8',2)},
    A2:{ch:'1|2|1|2|3|6|2|5',cel:msX('5:4 3:2 5:2 | 6:6 2:2 | 5:3 3:1 1:4 | 2:2 4:2 6:4 | 7:4 5:2 3:2 | 6:4 8:2 10:2 | 9:4 6:2 4:2 | 5:6 r:2',2),
      fl:msX('3:8 | 2:8 | 3:4 1:4 | 2:8 | 3:8 | 3:8 | 2:8 | 2:6 r:2',2),bub:'r:3 0:1 r:2 2:1 r:2 1:1 r:2 3:1 r:2 0:1'}
  }},
// ---- Drowned Lumen (and the dark water of the Drowned Reach): a slow, mysterious drowned moon city in G harmonic minor.
// A sunken bell tolls every two bars, a moon-priest flute chants, drips fall through the domes.
m_lumen:{g:1.017,key:'G',mode:'hm',bpm:52,meter:4,step:2,form:['A','B','A2'],
  parts:[
    {n:'flute',i:'flute',o:4,v:.95,orn:1,lead:1,att:.25,pan:.08},
    {n:'str',i:'strings',o:4,v:.6,lead:1,att:.9,rel:.9,pan:-.12},
    {n:'bell',i:'bell',o:3,v:1.1,pan:-.2,dl:.35,rv:.6},
    {n:'cel',i:'celesta',o:4,v:.4,pan:.3,dl:.4},
    {n:'harp',t:'arp',i:'harp',o:3,v:.4,ctr:9,pan:.25,pat:'0:2 1:2 2:2 4:2'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.42,ctr:9,att:2.5,rel:2.5,f1:450,f2:800,pat:true},
    {n:'drone',i:'drone',o:2,v:.5,cut:260},
    {n:'drip',i:'drip',o:5,v:1.1,pan:.3,dl:.45,rv:.6}
  ],
  sec:{
    A:{ch:'1|1|6|6|4|4|5|5',flute:'1:4 2:2 3:2 | 5:6 4:1 3:1 | 3:4 1:2 6:2 | 1:8 | 4:4 6:2 8:2 | 6:6 4:2 | 5:4 7:2 2:2 | 7:6 r:2',
      bell:'1:16 6:16 4:16 5:16',drone:'1:64',drip:'r:5 8:1 r:9 5:1 r:13 10:1 r:7 3:1 r:12 7:1 r:13'},
    B:{ch:'6|3|4|1|6|4|5|5',str:'3:8 | 3:4 5:4 | 4:6 3:2 | 1:8 | 3:8 | 4:4 6:4 | 5:4 7:4 | 9:4 7:4',
      cel:'r:6 8:1 10:1 | r:8 | r:6 12:1 10:1 | r:8 | r:6 8:1 10:1 | r:8 | r:6 9:1 7:1 | r:8',bell:'6:16 4:16 6:16 5:16',drone:'1:64'},
    A2:{ch:'1|1|6|6|4|4|5|5',flute:'1:4 2:2 3:2 | 5:6 4:1 3:1 | 3:4 1:2 6:2 | 1:8 | 4:4 6:2 8:2 | 6:6 4:2 | 5:4 7:2 2:2 | 7:6 r:2',
      str:'5:16 3:16 4:16 7:16',bell:'1:16 6:16 4:16 5:16',drone:'1:64',drip:'r:11 10:1 r:14 6:1 r:9 8:1 r:16 5:1 r:10',vol:{choir:1.3}}
  }},
// ---- the Glass Desert by day: E phrygian with a bright major third, a desert shawm, an oud, glass chimes and heat shimmer
m_glass:{g:1.523,key:'E',mode:'phr',bpm:84,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'reed',i:'reed',o:4,v:.8,orn:1,lead:1,pan:-.08},
    {n:'oud',i:'lute',o:3,v:1.3,lead:1,dec:.45,pan:.15},
    P(GB,{n:'glass',o:4,v:.85,lead:1,pan:.3,dl:.35}),
    {n:'chime',t:'arp',i:'celesta',o:5,v:.28,ctr:7,pan:-.3,dl:.3,pat:'0:1 2:1 1:1 3:1 2:1 4:1 3:1 5:1 4:1 3:1 2:1 1:1 r:4'},
    {n:'drone',i:'drone',o:2,v:.5,cut:300},
    {n:'pad',t:'pad',i:'pad',o:3,v:.28,ctr:9,cut:900,att:2,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.65,pat:'R:6 R:2 5:4 R:4'},
    {n:'dr',t:'drum',v:.6,rv:.18,pat:{frame:'X.x...x.X...x...',shaker:'.g.g.g.g.g.g.g.g',tock:'....o.......o.o.'}}
  ],
  sec:{
    A:{ch:'1M|2|1M|7|6|2|1M|1M',reed:msX(GLASS_A,2),drone:'1:128'},
    B:{ch:'4|4|1M|1M|6|7|2|1M',glass:msX(GLASS_B,2),oud:msX(GLASS_OUD,2),drone:'1:128'},
    A2:{ch:'1M|2|1M|7|6|2|1M|1M',reed:msX(GLASS_A,2),glass:msX(GLASS_A,2),drone:'1:128'}
  }},
// ---- the Oasis of Sable: a bouncy caravan-town tune in D harmonic minor (oud lead, clip-clop striders, doum-tek drum)
m_sable:{g:1.513,key:'D',mode:'hm',bpm:116,meter:4,step:4,form:['A','A2','B','A2'],
  parts:[
    {n:'oud',i:'lute',o:4,v:1.5,lead:1,dec:.32,pan:.08},
    {n:'fl',i:'flute',o:5,v:.45,orn:1,pan:.25},
    {n:'fid',i:'fiddle',o:4,v:.75,orn:1,lead:1,pan:-.12},
    {n:'strum',t:'arp',i:'lute',o:3,v:.5,ctr:9,pan:-.28,pat:'c:2 r:2 c:1 c:1 r:2 c:2 r:2 c:1 c:1 r:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:3 R:1 5:2 R:2 R:3 R:1 5:2 8:2'},
    {n:'dr',t:'drum',v:.68,rv:.12,pat:{frame:'X.X...x.X...x...',tock:'..o...o...o...o.',shaker:'.g.g.g.g.g.g.g.g'}}
  ],
  sec:{
    A:{ch:'1|1|6|5|1|4|5|1',oud:msX(SABLE_A,2)},
    A2:{ch:'1|1|6|5|1|4|5|1',oud:msX(SABLE_A,2),fl:msX(SABLE_A,2)},
    B:{ch:'4|1|4|1|6|3|5|5',fid:msX(SABLE_B,2),dr:{frame:'X.x.x.x.X...x.x.',tock:'..o...o...o...o.',shaker:'.g.g.g.g.g.g.g.g'}}
  }},
// ---- the Sandworm Burrows: a low churning groove, sand shakers, a worm that gulps, a reed calling down the tunnels
m_burrows:{g:1.69,key:'C#',mode:'phr',bpm:92,meter:4,step:4,form:['A','B'],
  parts:[
    {n:'reed',i:'reed',o:3,v:.7,orn:1,lead:1,att:.06,pan:.1},
    {n:'ost',t:'bass',i:'stac',o:2,v:.7,pan:-.15,pat:'R:2 r:1 R:1 b2:2 R:2 r:2 R:1 R:1 b2:2 4:2'},
    {n:'drone',i:'drone',o:2,v:.5,cut:230},
    {n:'choir',t:'pad',i:'choir',o:3,v:.25,ctr:7,att:2,rel:2,f1:420,f2:760,pat:true},
    {n:'bub',t:'arp',i:'bubble',o:2,v:.8,ctr:5,pan:.3,pat:'r:7 0:1 r:8'},
    {n:'dr',t:'drum',v:.75,rv:.3,pat:{tom:'o.....g...o.....',frame:'....g.......g.g.',shaker:'g.g.g.g.g.g.g.g.'}}
  ],
  sec:{
    A:{ch:'1|1|1|1|2|2|1|1',reed:msX('1:6 2:2 | 1:8 | r:8 | r:4 3:2 2:2 | 2:4 4:4 | 6:6 4:1 2:1 | 1:8 | r:8',2),drone:'1:128'},
    B:{ch:'1|1|7|7|1|1|2|1',reed:msX('5:3 4:1 3:4 | 3:4 1:4 | 7:6 r:2 | 4:3 2:1 0:4 | 1:8 | r:8 | 2:4 4:4 | 1:6 r:2',2),drone:'1:128'}
  }},
// ---- the Mirror Temple: a solemn moon chant (choir, in fifths the second time), temple bells, organ-like pad
m_temple:{g:1.986,key:'Eb',mode:'dor',bpm:60,meter:4,step:2,form:['A','B','A2'],
  parts:[
    {n:'chant',i:'choir',o:3,v:.85,lead:1,att:.35,rel:.6,pan:.05},
    {n:'bell',i:'bell',o:5,v:.75,lead:1,pan:.25,dl:.3},
    {n:'harp',t:'arp',i:'harp',o:3,v:.35,ctr:9,pan:-.3,pat:'0:2 1:2 2:2 3:2'},
    {n:'org',t:'pad',i:'pad',o:3,v:.5,ctr:9,vn:4,att:1.5,cut:1400,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.6,pat:'R:8'},
    {n:'dr',t:'drum',v:.6,rv:.4,pat:{taiko:'o.......|........'}}
  ],
  sec:{
    A:{ch:'1|7|4|1|3|7|4|5',chant:'1:4 2:2 3:2 | 2:4 4:4 | 4:2 5:2 6:4 | 5:8 | 3:4 5:2 7:2 | 7:6 6:2 | 6:4 4:4 | 5:8'},
    B:{ch:'1|7|4|1|3|7|4|5',bell:'8:4 7:2 5:2 | 7:8 | 6:4 8:4 | 5:8 | 3:4 5:4 | 7:6 5:2 | 4:4 6:4 | 5:8',chant:'1,5:16 4,8:16 3,7:16 4,8:8 5,9:8',vol:{chant:.55}},
    A2:{ch:'1|7|4|1|3|7|4|5',chant:'1,5:4 2,6:2 3,7:2 | 2,6:4 4,8:4 | 4,8:2 5,9:2 6,10:4 | 5,9:8 | 3,7:4 5,9:2 7,11:2 | 7,11:6 6,10:2 | 6,10:4 4,8:4 | 5,9:8',
      bell:'r:8 | r:8 | r:8 | 12:8 | r:8 | r:8 | r:8 | 12:8',vol:{chant:.8}}
  }},
// ---- the eclipse (cutscene mood) and the Eclipse Observatory: low strings in a slow 3/4, a single wrong-sounding bell,
// and Nyxara humming the lantern song backwards on celesta
m_eclipse:{g:1.586,key:'B',mode:'aeo',bpm:56,meter:3,step:2,form:['A','B'],
  parts:[
    {n:'lo',i:'strings',o:3,v:1,lead:1,att:.9,rel:1,pan:-.08},
    {n:'vc',t:'bass',i:'strings',o:2,v:.55,att:.9,pat:'R:6'},
    P(VB,{n:'bell',o:4,v:1.2,pan:.2,dl:.3}),
    {n:'hum',i:'celesta',o:5,v:.55,lead:1,pan:.3,dl:.45},
    {n:'choir',t:'pad',i:'choir',o:3,v:.32,ctr:7,att:3,rel:3,f1:400,f2:720,pat:true},
    {n:'drone',i:'drone',o:2,v:.5,cut:200},
    {n:'dr',t:'drum',v:.8,rv:.3,pat:{heart:'x..o..|......|......|......'}}
  ],
  sec:{
    A:{ch:'1|1|6|6|4|4|5M|5M',lo:'5:6 | 3:4 2:2 | 3:6 | 1:6 | 4:6 | 6:4 4:2 | 5:6 | 7#:6',bell:'1:48',drone:'1:48'},
    B:{ch:LSbkC,hum:LSbk,bell:'r:24 1:24',drone:'1:48'}
  }},
// ---- Moonfall at night (while the moon is more than 40 percent): the lantern song in E minor on the music box
m_night:{g:1.55,key:'E',mode:'aeo',bpm:64,meter:3,step:2,form:['A','B','A2','B'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.7,lead:1,pan:.12,dl:.25},
    {n:'fl',i:'flute',o:4,v:.7,lead:1,orn:1,att:.2,pan:-.08},
    {n:'harp',t:'arp',i:'harp',o:3,v:.28,ctr:9,pan:-.25,pat:'0:2 1:2 2:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.45,ctr:9,att:1.8,rel:1.6,cut:700,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.5,pat:'R:6'}
  ],
  sec:{
    A:{ch:LSmC,mbox:LS},
    B:{ch:'6|3|4|1|6|3|4 5|1',fl:'8:3 7:1 6:2 | 5:6 | 6:3 5:1 4:2 | 3:6 | 6:2 8:2 10:2 | 7:4 5:2 | 6:2 4:1 5:2 7:1 | 8:6'},
    A2:{ch:LSmC,mbox:LS,harp:'0:1 1:1 2:1 1:1 0:1 2:1'}
  }},
// ---- Moonfall after the second eclipse (and the Mirror Flats and Eclipse Heights): the song breaks off after one bar,
// violet bells fall a half step at a time, a low drone breathes
m_dark:{g:1.369,key:'E',mode:'aeo',bpm:54,meter:3,step:2,form:['A','B'],
  parts:[
    {n:'drone',i:'drone',o:2,v:.65,cut:220,lr:.05},
    P(VB,{n:'vbell',o:4,v:.9,lead:1,pan:.25,dl:.35}),
    {n:'mbox',i:'mbox',o:5,v:1.3,lead:1,pan:-.15,dl:.3},
    {n:'choir',t:'pad',i:'choir',o:3,v:.35,ctr:7,att:3,rel:3,f1:400,f2:700,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.45,pat:'R:12'}
  ],
  sec:{
    A:{ch:'1|4|6|6|1|1|2|2',drone:'1:48',mbox:'1:2 3:1 5:2 3:1 | 4:2 3:1 r:3 | r:6 | r:6 | 1:2 3:1 5:2 r:1 | r:6 | r:6 | r:6',
      vbell:'r:6 | r:6 | 6:3 5:3 | 2b:6 | r:6 | r:6 | 4:3 3:3 | 2:6'},
    B:{ch:'2|5|1|1|2|2|5M|5M',drone:'1:48',mbox:'2:2 r:1 6:2 4:1 | 5:2 4:1 2b:3 | r:6 | r:6 | r:6 | r:6 | 7#:3 r:3 | r:6',
      vbell:'r:6 | r:6 | 12,13:6 | r:6 | r:6 | 9,10:6 | r:6 | r:6'}
  }},
// ---- Hush on the silver leash: a fast cold waltz-fight in F# minor; strings sing the lantern song (she loves lamps),
// brass answers, celesta frost on top
m_hush:{g:1.25,key:'F#',mode:'aeo',bpm:168,meter:3,step:2,intro:['I'],form:['A','B','A2','B'],
  parts:[
    {n:'str',i:'strings',o:4,v:.85,lead:1,pan:-.1},
    {n:'cel',i:'celesta',o:5,v:.5,lead:1,pan:.3,dl:.25},
    {n:'brass',i:'brass',o:3,v:.75,lead:1,pan:.08},
    {n:'stab',t:'arp',i:'stac',o:3,v:.55,ctr:9,pan:.22,pat:'r:2 c:2 c:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:4 5:2'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.36,ctr:2,att:.4,pat:true},
    {n:'dr',t:'drum',v:.6,rv:.14,pat:{taiko:'X.....|o.....',snare:'..o.o.|..o.oo',hat:'g.g.g.'}}
  ],
  sec:{
    I:{ch:'1|5M',mute:['stab','choir'],brass:'1,5:6 | 7#,9:6',dr:{taiko:'X.x.x.|X.XxXx',crash:'X...........'}},
    A:{ch:HUSH_AC,str:HUSH_A},
    B:{ch:HUSH_BC,brass:HUSH_B,str:'10:6 | 11:6 | 12:6 | 10:6 | 13:6 | 14:6 | 12:6 | 12:6',vol:{str:.6}},
    A2:{ch:HUSH_AC,str:HUSH_A,cel:HUSH_A,brass:HUSH_A,vol:{brass:.8},dr:{taiko:'X.....|o..o..',snare:'..o.o.|..o.oo',hat:'g.g.g.',crash:'X'+'.'.repeat(47)}}
  }},

// ===================================== the Finale: Nightfall Peak
// ---- the moonfire bridge: slow choir, bells ringing the lantern song in Db, then a far-off horn (the leitmotif)
n_bridge:{g:1.479,key:'Db',mode:'ion',bpm:50,meter:3,step:2,form:['A','B'],
  parts:[
    {n:'bell',i:'bell',o:5,v:1.15,lead:1,pan:.2,dl:.35},
    {n:'horn',i:'horn',o:3,v:.7,lead:1,pan:-.12},
    {n:'choir',t:'pad',i:'choir',o:3,v:.5,ctr:9,att:2,rel:1.5,pat:true},
    {n:'hi',t:'pad',i:'choir',o:4,v:.24,ctr:7,vn:3,att:2.5,rel:1.8,f1:800,f2:1500,pat:true},
    {n:'harp',t:'arp',i:'harp',o:3,v:.3,ctr:9,pan:-.3,pat:'0:2 1:2 2:2'},
    {n:'drone',i:'drone',o:2,v:.5,cut:240}
  ],
  sec:{
    A:{ch:LSC,bell:LS,drone:'1:48'},
    B:{ch:MS_LMC,horn:LM3,drone:'1:48',vol:{hi:1.4}}
  }},
// ---- Nightfall Peak: a low drone, a music box playing the lantern song too slowly (and breaking off), violet bells,
// a harp underneath; in B a distant horn keeps climbing with the Emberblood leitmotif (the heroic thread)
n_ascent:{g:1.45,key:'A',mode:'aeo',bpm:46,meter:3,step:2,form:['A','B','A2','B'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.6,lead:1,pan:.15,dl:.3},
    P(VB,{n:'vbell',o:4,v:.8,lead:1,pan:-.25,dl:.35}),
    {n:'horn',i:'horn',o:3,v:.75,lead:1,pan:.08},
    {n:'str',i:'strings',o:3,v:.5,att:1,rel:1,pan:-.1},
    {n:'harp',t:'arp',i:'harp',o:3,v:.32,ctr:9,pan:-.3,pat:'0:2 1:2 2:2'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.28,ctr:7,att:3,rel:3,f1:420,f2:760,pat:true},
    {n:'drone',i:'drone',o:2,v:.7,cut:210,lr:.04},
    {n:'dr',t:'drum',v:.55,rv:.35}
  ],
  sec:{
    A:{ch:'1|4 b2|2|5 3|1 4|1|6 4|5',mbox:'1:2 3:1 5:2 3:1 | 4:2 3:1 2b:3 | 2:2 r:1 6:2 4:1 | 5:2 4:1 3:3 | 5:2 6:1 r:3 | 5:2 3:1 5:3 | 6:2 7:1 r:3 | r:6',
      vbell:'r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | r:3 9,10:3 | 7:6',drone:'1:48'},
    B:{ch:LM3mC,horn:LM3,vbell:'r:6 | r:6 | r:6 | r:3 12,13:3 | r:6 | r:6 | r:6 | r:6',drone:'1:48',dr:{taiko:'o.....|......'}},
    A2:{ch:'1|4 5|2|5 3|1 4|1|6 4|5',mbox:'1:2 r:1 5:2 3:1 | 4:2 r:1 2:3 | 2:2 4:1 r:3 | 5:2 4:1 3:3 | r:6 | 5:2 3:1 5:3 | 6:2 7:1 8:3 | r:6',
      str:'1:6 | 4:3 5:3 | 2:6 | 5:3 3:3 | 1:3 4:3 | 1:6 | 6:3 4:3 | 5:6',vbell:'r:6 | r:6 | r:6 | r:6 | r:3 8,9b:3 | r:6 | r:6 | r:6',drone:'1:48'}
  }},
// ---- Tier II, the Clockstop Cliffs: the same broken song with clockwork that keeps starting and never ticks on
n_clocks:{g:1.5,key:'A',mode:'aeo',bpm:52,meter:3,step:2,form:['A','B'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.5,lead:1,pan:.15,dl:.3},
    {n:'pz',i:'pizz',o:4,v:.8,lead:1,pan:-.2,dl:.2},
    P(VB,{n:'vbell',o:4,v:.7,lead:1,pan:.25,dl:.35}),
    {n:'horn',i:'horn',o:3,v:.7,lead:1,pan:.08},
    {n:'choir',t:'pad',i:'choir',o:3,v:.25,ctr:7,att:3,rel:3,f1:420,f2:760,pat:true},
    {n:'drone',i:'drone',o:2,v:.65,cut:210},
    {n:'dr',t:'drum',v:1.2,rv:.3}
  ],
  sec:{
    A:{ch:'1|4 5|2|5 3|1 4|1|6 4|5',mbox:'1:2 3:1 r:3 | 4:2 3:1 r:3 | 2:2 4:1 6:2 r:1 | 5:2 r:4 | 5:2 6:1 8:2 6:1 | r:6 | 6:2 r:4 | 5:3 r:3',
      pz:'1:1 5:1 8:1 5:1 1:1 5:1 | 4:1 6:1 8:1 5:1 r:2 | 2:1 4:1 6:1 4:1 2:1 4:1 | r:6 | 1:1 5:1 8:1 5:1 1:1 r:1 | r:6 | 6:1 8:1 r:4 | r:6',
      drone:'1:48',dr:{tick:'o.o.o.|......|o.o...|......|o.....|......|......|......',tock:'......|.o....|......|......|......|......|o.....|......'}},
    B:{ch:LM3mC,horn:LM3,pz:'1:1 5:1 8:1 5:1 1:1 5:1 | 3:1 5:1 8:1 5:1 3:1 5:1 | 7:1 9:1 r:4 | r:6 | 1:1 5:1 8:1 r:3 | 4:1 6:1 r:4 | r:6 | r:6',
      vbell:'r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | 12,13:6',drone:'1:48',dr:{tick:'o.....|......|......|......|o.....|......|......|......'}}
  }},
// ---- Tier III, the Rime Spiral: the Frostpine bells frozen into C# minor, wind singing, snow that falls upward
n_rime:{g:1.704,key:'C#',mode:'aeo',bpm:50,meter:4,step:2,form:['A','B'],
  parts:[
    {n:'bell',i:'bell',o:5,v:1.4,lead:1,pan:.25,dl:.3},
    {n:'cel',i:'celesta',o:4,v:.75,lead:1,pan:-.3,dl:.35},
    {n:'wind',i:'choir',o:4,v:.45,att:3.5,rel:3,f1:1100,f2:2500,pan:-.1},
    {n:'harp',t:'arp',i:'harp',o:3,v:.35,ctr:9,pan:-.3,pat:'0:1 1:1 2:1 3:1 4:1 5:1 r:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,att:2,rel:2,cut:900,pat:true},
    {n:'drone',i:'drone',o:2,v:.55,cut:240}
  ],
  sec:{
    A:{ch:'1|4|6|3|1|4|5|5',bell:'5:2 3:2 1:4 | 4:2 6:2 8:4 | 8:4 6:4 | 7:6 r:2 | 5:2 3:2 1:4 | 4:2 6:2 8:2 11:2 | 9:4 7:4 | 5:6 r:2',
      wind:'8:16@.5 5:16@.8 8:16@.6 7:16@.9',drone:'1:64'},
    B:{ch:'6|7|1|1|6|7|5|5',cel:'10:4 8:2 6:2 | 7:8 | 8:4 10:4 | 12:8 | 10:4 13:4 | 14:8 | 12:4 14:4 | 12:8',
      wind:'6:16@.7 8:16@.5 6:16@.9 5:16@.6',drone:'1:64'}
  }},
// ---- Tier IV, the Moonglass Crown: a low choir chanting the Mirror Temple's song in F phrygian, water drops, a tolling bell
n_glass:{g:1.927,key:'F',mode:'phr',bpm:50,meter:4,step:2,form:['A','B'],
  parts:[
    {n:'chant',i:'choir',o:2,v:.9,lead:1,att:.5,rel:.8,f1:450,f2:800,pan:.05},
    {n:'drip',i:'drip',o:5,v:1.6,lead:1,pan:.3,dl:.5,rv:.6},
    {n:'drip2',i:'drip',o:4,v:1.2,pan:-.3,dl:.5,rv:.6},
    P(GB,{n:'bell',o:3,v:1,dec:3,pan:-.15}),
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,cut:600,att:2,pat:true},
    {n:'drone',i:'drone',o:2,v:.55,cut:220}
  ],
  sec:{
    A:{ch:'1|2|1|7|3|2|1|1',chant:'1:4 2:2 3:2 | 2:4 4:4 | 3:2 2:2 1:4 | 0:8 | 3:4 5:4 | 4:4 2:4 | 1:8 | 1:8',
      drip:'r:7 8:1 r:12 5:1 r:9 10:1 r:6 3:1 r:13 7:1 r:12',drip2:'r:15 1:1 r:20 5:1 r:27',drone:'1:64'},
    B:{ch:'6|2|6|2|1|2|1|1',bell:'6:8 | 2:8 | 6:8 | 2:8 | 1:16 | 1:16',chant:'3:8 | 4:8 | 3:8 | 2:8 | 1:4 3:4 | 2:8 | 1:16',
      drip:'r:3 10:1 r:15 6:1 r:11 8:1 r:20 5:1 r:11',drone:'1:64'}
  }},
// ---- the echoes (shadow copies of old bosses): Vorlaxis's leitmotif slowed down on a music box over big taiko,
// then the old boss tune; the Echo of the Hush has its own (below)
n_echo:{g:1.46,key:'D',mode:'aeo',bpm:96,meter:4,step:4,intro:['I'],form:['A','B'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.7,lead:1,pan:.1,dl:.2},
    {n:'str',i:'strings',o:3,v:.55,lead:1,att:.3,pan:-.15},
    P(VB,{n:'vbell',o:4,v:.6,lead:1,pan:.3,dl:.3}),
    {n:'low',t:'bass',i:'stac',o:3,v:.55,pan:-.25,pat:'R:1 R:1 8:1 R:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:4 R:4 R:2 R:2 5:4'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.4,ctr:2,att:.6,pat:true},
    {n:'dr',t:'drum',v:.6,rv:.2,pat:{taiko:'X.......x...x...|X.......x.x.x...',tom:'..............o.',snare:'....o.......o...'}}
  ],
  sec:{
    I:{ch:'1|5M',mute:['low','choir'],dr:{taiko:'X...x...X...x.x.|X.x.X.x.XxXxXXXX',crash:'X'+'.'.repeat(31)}},
    A:{ch:'1|1|3|3|4|6|5M|5M|1|1|4|1|5M|5M|1|1',mbox:msX(MS_LMm1+' | '+MS_LMm2,4),
      vbell:'r:112 1,2b:16 r:128',dr:{taiko:'X.......x...x...|X.......x.x.x...',tom:'..............o.',snare:'....o.......o...',crash:'X'+'.'.repeat(255)}},
    B:{ch:'1|6|4|5M|1|6|b2|5M',mbox:MS_BA,str:'1:16 6:16 4:16 5:16 1:16 6:16 2b:16 5:16'}
  }},
n_echo_hush:{g:1.3,key:'F#',mode:'aeo',bpm:132,meter:3,step:2,form:['A','B'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.6,lead:1,pan:.12,dl:.2},
    {n:'mb2',i:'mbox',o:4,v:1.4,lead:1,pan:-.12,dl:.2},
    P(VB,{n:'vbell',o:4,v:.6,lead:1,pan:.3,dl:.3}),
    {n:'stab',t:'arp',i:'stac',o:3,v:.5,ctr:9,pan:.22,pat:'r:2 c:2 c:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:4 5:2'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.4,ctr:7,att:.6,pat:true},
    {n:'dr',t:'drum',v:.6,rv:.2,pat:{taiko:'X.....|o.....|X.....|o.o...',snare:'......|..o...'}}
  ],
  sec:{
    A:{ch:HUSH_AC,mbox:HUSH_A},
    B:{ch:HUSH_BC,mb2:HUSH_B,vbell:'r:18 12,13:6 r:24'}
  }},
// ---- the summit before the fight: just wind and one held choir note (and one violet bell)
n_summit:{g:1.765,key:'E',mode:'aeo',bpm:40,meter:4,step:2,form:['A','B'],
  parts:[
    {n:'choir',i:'choir',o:3,v:.7,lead:1,att:4,rel:4,f1:520,f2:900},
    {n:'wind',i:'choir',o:4,v:.4,att:4,rel:3.5,f1:1200,f2:2600,pan:-.2},
    {n:'wind2',i:'choir',o:4,v:.3,att:4,rel:3.5,f1:1500,f2:3000,pan:.25},
    {n:'drone',i:'drone',o:2,v:.5,cut:180},
    P(VB,{n:'vbell',o:4,v:.6,lead:1,pan:.2,dl:.4})
  ],
  sec:{
    A:{ch:'1|1|1|1|1|1|1|1',choir:'5:64',wind:'8:16@.35 10:16@.7 9:16@.45 8:16@.8',wind2:'r:8 12:16@.5 11:16@.3 12:24@.6',drone:'1:64',vbell:'r:56 12,13:8'},
    B:{ch:'1|1|1|1|1|1|1|1',choir:'5:64',wind:'9:16@.6 8:16@.4 10:16@.8 8:16@.5',wind2:'12:24@.4 13:16@.6 12:24@.4',drone:'1:64'}
  }},
// ---- shades and ink knights on the peak: A phrygian, taiko and low strings, violet bells on the off-beats
n_fight:{g:1.26,key:'A',mode:'phr',bpm:136,meter:4,step:4,form:['A','B','A2'],
  parts:[
    {n:'brass',i:'brass',o:4,v:.85,lead:1,pan:.06},
    {n:'str',i:'strings',o:4,v:.75,lead:1,pan:-.1},
    {n:'str8',i:'strings',o:5,v:.35,pan:-.2},
    P(VB,{n:'vbell',o:4,v:.45,pan:.3,dl:.25,dec:1.6}),
    {n:'ost',t:'arp',i:'stac',o:3,v:.55,ctr:7,pan:.22,pat:'0:1 2:1 1:1 2:1'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:2 R:2 R:2 R:2 R:2 R:2 b2:2 R:2'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.3,ctr:9,att:.4,pat:true},
    {n:'dr',t:'drum',v:.6,rv:.14,pat:{kick:'X.....x...x.....',snare:'....x.......x...',taiko:'X.......x.......',hat:'o.g.o.g.o.g.o.g.'}}
  ],
  sec:{
    A:{ch:'1|2|1|7|1|2|7|1',brass:msX(NF_A,2),vbell:NF_VB},
    B:{ch:'6|7|1|1|6|7|2|2',str:msX(NF_B,2),dr:{kick:'X.......x.......',snare:'....x.......x..g',taiko:'X...............',hat:'o.o.o.o.o.o.o.o.'}},
    A2:{ch:'1|2|1|7|1|2|7|1',brass:msX(NF_A,2),str8:msX(NF_A,2),vbell:NF_VB,dr:{kick:'X.....x...x.....',snare:'....x.......x..g',taiko:'X.......x...x...',hat:'o.g.o.g.o.g.o.g.'}}
  }},
// ---- Nyxara, the Night Mother. A 6/8 gallop in E minor (bpm counts eighths), choir and taiko, in four phases.
// Phase 1, Moonsilk: she hums the lantern song backwards on celesta, then her own lullaby theme on strings and brass
n_nyxara:{g:1.163,key:'E',mode:'aeo',bpm:300,qbpm:150,meter:6,step:2,intro:['I'],form:['A','B','B2'],
  parts:[
    {n:'str',i:'strings',o:4,v:.85,lead:1,pan:-.1},
    {n:'brass',i:'brass',o:3,v:.8,lead:1,pan:.06},
    {n:'cel',i:'celesta',o:5,v:.7,lead:1,pan:.3,dl:.3},
    {n:'ost',t:'arp',i:'stac',o:3,v:.55,ctr:7,pan:.22,pat:'0:2 2:2 1:2 0:2 2:2 1:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:4 R:2 5:4 R:2'},
    {n:'timp',t:'bass',i:'timp',o:2,v:.6,pat:'R:12 r:12'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.42,ctr:2,att:.5,pat:true},
    {n:'dr',t:'drum',v:.6,rv:.14,pat:{taiko:'X.....x.....|X.....x..x..',snare:'......o.....|......o...oo',hat:'o.g.o.g.o.g.'}}
  ],
  sec:{
    I:{ch:'1|5M',mute:['str','brass','cel','ost'],dr:{taiko:'X.....X.....|X..X..X.XXXX',crash:'X'+'.'.repeat(23)}},
    A:{ch:LSbkC,cel:msX(LSbk,2),brass:'1:48 5:48',vol:{brass:.5}},
    B:{ch:NYXC,str:msX(NYX,2),dr:{taiko:'X.....x.....|X.....x..x..',snare:'......o.....|......o...oo',hat:'o.g.o.g.o.g.',crash:'X'+'.'.repeat(95)}},
    B2:{ch:NYXC,str:msX(NYX,2),brass:msX(NYX,2),dr:{taiko:'X..x..x.....|X..x..x..x..',snare:'......o.....|......o...oo',hat:'o.g.o.g.o.g.',tom:'..........o.'}}
  }},
// Phase 2, the Shadow Sea: lower and heavier, ink bubbling, a falling lament, the backwards song deep down
n_nyxara2:{g:1.049,key:'E',mode:'aeo',bpm:288,qbpm:144,meter:6,step:2,form:['A','B','C'],
  parts:[
    {n:'brass',i:'brass',o:3,v:.85,lead:1,pan:.06},
    {n:'str',i:'strings',o:3,v:.75,lead:1,pan:-.12},
    {n:'cel',i:'celesta',o:4,v:.6,lead:1,pan:.3,dl:.35},
    {n:'bub',t:'arp',i:'bubble',o:2,v:.9,ctr:5,pan:-.3,pat:'0:1 r:2 2:1 r:2 1:1 r:3 0:1 r:1'},
    {n:'ost',t:'bass',i:'stac',o:2,v:.6,pan:.2,pat:'R:2 R:1 R:1 b2:2 R:2 R:1 R:1 b6:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:6 R:6'},
    {n:'choir',t:'pad',i:'choir',o:3,v:.5,ctr:7,att:.8,f1:420,f2:760,pat:true},
    {n:'dr',t:'drum',v:.62,rv:.16,pat:{taiko:'X..x..X..x..|X..x..X.xX.x',tom:'.........o.o',snare:'......o.....'}}
  ],
  sec:{
    A:{ch:NYXC,brass:msX(NYX,2)},
    B:{ch:'1|7|6|5M|1|7|6|5M',str:msX('8:6 | 7:6 | 6:6 | 7#:6 | 8:3 10:3 | 9:3 7:3 | 6:3 8:3 | 7#:6',2),vol:{str:1.15}},
    C:{ch:LSbkC,cel:msX(LSbk,2),brass:'1:48 5:24 1:24',vol:{brass:.55}}
  }},
// Phase 3, the Moon's Ring: flying, faster; harp wind runs, strings climb toward the last pieces of the moon
n_nyxara3:{g:1.25,key:'E',mode:'aeo',bpm:330,qbpm:165,meter:6,step:2,form:['A','B','A2'],
  parts:[
    {n:'str',i:'strings',o:4,v:.8,lead:1,pan:-.12},
    {n:'brass',i:'brass',o:3,v:.75,lead:1,pan:.06},
    {n:'run',t:'arp',i:'harp',o:4,v:.42,ctr:9,pan:.28,pat:'0:1 1:1 2:1 3:1 4:1 5:1 4:2 r:4'},
    {n:'ost',t:'arp',i:'stac',o:3,v:.5,ctr:7,pan:-.22,pat:'0:2 2:2 1:2 0:2 2:2 1:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:4 R:2 5:4 R:2'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.4,ctr:4,att:.5,f1:800,f2:1400,pat:true},
    {n:'dr',t:'drum',v:.58,rv:.14,pat:{taiko:'X.....x.....',snare:'...o.....o..',hat:'o.g.o.g.o.g.',tom:'.........o.o|............'}}
  ],
  sec:{
    A:{ch:'1|7|6|7|1|7|6|5M',str:msX('5:2 8:2 10:2 | 9:2 11:2 7:2 | 8:2 10:2 13:2 | 11:3 9:3 | 10:2 12:2 15:2 | 14:3 11:3 | 13:2 12:2 10:2 | 12:6',2)},
    B:{ch:NYXC,str:msX(NYX,2),brass:msX(NYX,2),vol:{brass:.7}},
    A2:{ch:'1|7|6|7|1|7|6|5M',str:msX('5:2 8:2 10:2 | 9:2 11:2 7:2 | 8:2 10:2 13:2 | 11:3 9:3 | 10:2 12:2 15:2 | 14:3 11:3 | 13:2 12:2 10:2 | 12:6',2),
      brass:msX('5:2 8:2 10:2 | 9:2 11:2 7:2 | 8:2 10:2 13:2 | 11:3 9:3 | 10:2 12:2 15:2 | 14:3 11:3 | 13:2 12:2 10:2 | 12:6',2),dr:{taiko:'X.....x.....|X..x..x.xxxx',snare:'...o.....o..',hat:'o.g.o.g.o.g.',crash:'X'+'.'.repeat(95)}}
  }},
// Phase 4, Heartfire: E major at last. Brass sing the Emberblood leitmotif, then strings the lantern song, everything on
n_nyxara4:{g:0.99,key:'E',mode:'ion',bpm:312,qbpm:156,meter:6,step:2,intro:['I'],form:['A','B','A2','B'],
  parts:[
    {n:'brass',i:'brass',o:4,v:.9,lead:1,pan:.06},
    {n:'hn',i:'horn',o:4,v:.6,lead:1,pan:-.1},
    {n:'str',i:'strings',o:5,v:.62,lead:1,pan:-.15},
    {n:'ost',t:'arp',i:'stac',o:3,v:.55,ctr:7,pan:.22,pat:'0:2 1:2 2:2 1:2 2:2 3:2'},
    {n:'bass',t:'bass',i:'bass',o:2,v:.85,pat:'R:4 R:2 5:4 8:2'},
    {n:'timp',t:'bass',i:'timp',o:2,v:.6,pat:'R:6 R:6 R:12'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.45,ctr:2,att:.4,pat:true},
    {n:'dr',t:'drum',v:.6,rv:.14,pat:{kick:'X.....x.....',snare:'......X.....|......X...xx',taiko:'X...........|X.....x.....',hat:'o.g.o.g.o.g.'}}
  ],
  sec:{
    I:{ch:'1|5',mute:['brass','hn','str','ost'],dr:{taiko:'X.....X.....|X..X..XXXXXX',crash:'X'+'.'.repeat(23)}},
    A:{ch:MS_LMC,brass:msX(LM68,2),hn:msX(LM68,2),str:msX(LM68,2),vol:{str:.7}},
    B:{ch:LSC,str:msX(LS,2),hn:msX(LS,2),vol:{str:1.2}},
    A2:{ch:MS_LMC,brass:msX(LM68,2),hn:msX(LM68,2),str:msX(LM68,2),dr:{kick:'X..x..x.....',snare:'......X.....|......X...xx',taiko:'X.....x.....',hat:'o.g.o.g.o.g.',crash:'X'+'.'.repeat(95)}}
  }},
// ---- the Heart moment: everything drops to the lantern song on a lone music box; each friend's voice adds a little,
// until it blazes. Same key as phase 4, so the fight picks up from it.
n_heart:{g:1.202,key:'E',mode:'ion',bpm:132,qbpm:88,meter:6,step:1,intro:['H1','H2'],form:['H3','H4'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.8,lead:1,pan:.1,dl:.3},
    {n:'fl',i:'flute',o:5,v:.8,orn:1,lead:1,att:.1,pan:-.08},
    {n:'str',i:'strings',o:4,v:.65,lead:1,att:.25,pan:-.15},
    {n:'hn',i:'horn',o:3,v:.6,lead:1,pan:.12},
    {n:'harp',t:'arp',i:'harp',o:3,v:.45,ctr:9,pan:-.28,pat:'0:1 1:1 2:1 3:1 2:1 1:1'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.4,ctr:4,att:1,pat:true},
    {n:'pad',t:'pad',i:'pad',o:3,v:.4,ctr:9,att:1.5,cut:1000,pat:true},
    {n:'timp',t:'bass',i:'timp',o:2,v:.55},
    {n:'bass',t:'bass',i:'bass',o:2,v:.7,pat:'R:6'},
    {n:'dr',t:'drum',v:.7,rv:.25}
  ],
  sec:{
    H1:{ch:LSC,mbox:LS,mute:['harp','choir','bass'],vol:{pad:.7}},
    H2:{ch:LSC,mbox:LS,fl:LS,mute:['choir'],vol:{fl:.7}},
    H3:{ch:LSC,fl:LS,str:LS,hn:LSctr,timp:'r:42 R:1@.45 R:1@.55 R:1@.65 R:1@.75 R:1@.85 R:1'},
    H4:{ch:LSC,fl:LS,str:LS,mbox:LS,hn:LSctr,timp:'R:6 r:42',vol:{str:1.3,choir:1.3},dr:{crash:'X'+'.'.repeat(47),taiko:'X.....|o.....|o.....|o..o..'}}
  }},
// ---- the fall and the final choice: her lullaby slow and sad, then the lantern song turning major ("That's visiting.")
n_fall:{g:1.893,key:'E',mode:'aeo',bpm:60,meter:3,step:2,form:['A','B'],
  parts:[
    {n:'str',i:'strings',o:4,v:.8,lead:1,att:.3,rel:.6,pan:-.1},
    {n:'fl',i:'flute',o:4,v:.9,orn:1,lead:1,att:.12,pan:.08},
    {n:'mbox',i:'mbox',o:5,v:1.1,lead:1,pan:.25,dl:.3},
    {n:'harp',t:'arp',i:'harp',o:3,v:.3,ctr:9,pan:-.3,pat:'0:2 1:2 2:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,att:1.4,rel:1.4,cut:900,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.55,pat:'R:6'}
  ],
  sec:{
    A:{ch:NYXC,str:NYX},
    B:{ch:LSmajC,fl:LSmaj,mbox:LSmaj,vol:{mbox:.8}}
  }},
// ---- Ending 1, Morning: a sunrise swell, then the lantern song on brass in Eb, the leitmotif on horns and strings
n_end_dawn:{g:1.439,key:'Eb',mode:'ion',bpm:80,meter:3,step:2,intro:['S'],form:['A','B','A2'],
  parts:[
    {n:'b1',i:'brass',o:4,v:.85,lead:1,pan:.08},
    {n:'b2',i:'brass',o:4,v:.55,pan:-.08},
    {n:'hn',i:'horn',o:3,v:.65,lead:1,pan:-.15},
    {n:'str',i:'strings',o:5,v:.6,lead:1,pan:-.18},
    {n:'fl',i:'flute',o:5,v:.85,orn:1,lead:1},
    {n:'harp',t:'arp',i:'harp',o:4,v:.45,ctr:2,pan:.3,pat:'0:1 1:1 2:1 3:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true},
    {n:'timp',t:'bass',i:'timp',o:2,v:.6},
    {n:'bass',t:'bass',i:'bass',o:2,v:.75,pat:'R:4 5:2'},
    {n:'dr',t:'drum',v:.7,rv:.2}
  ],
  sec:{
    S:{ch:'4|5|6|5',str:'1:6 | 2:6 | 3:6 | 7:6',mute:['harp','bass'],vol:{pad:1.2},
      timp:'r:12 R:6 R:1@.4 R:1@.5 R:1@.6 R:1@.7 R:1@.8 R:1@.9',dr:{crash:'.'.repeat(18)+'X.....'}},
    A:{ch:LSC,b1:LS,b2:LSlo,timp:'R:6 r:42',dr:{crash:'X'+'.'.repeat(47)}},
    B:{ch:MS_LMC,hn:LM3,str:LM3,vol:{str:.7}},
    A2:{ch:LSC,fl:LS,b1:LS,b2:LSlo,str:LS,vol:{str:.6},dr:{crash:'X'+'.'.repeat(47),taiko:'X.....|......'}}
  }},
// ---- Ending 2, the Ember Moon: warm and gold, a fireside 6/8 in G mixolydian, fiddle, lute and horn
n_end_ember:{g:1.493,key:'G',mode:'mix',bpm:168,qbpm:84,meter:6,step:1,form:['A','B','A2'],
  parts:[
    {n:'fid',i:'fiddle',o:4,v:.9,orn:1,lead:1,pan:-.1},
    {n:'fl',i:'flute',o:5,v:.5,orn:1,pan:.25},
    {n:'hn',i:'horn',o:3,v:.6,lead:1,pan:.12},
    {n:'lute',t:'arp',i:'lute',o:3,v:.55,ctr:9,pan:.28,pat:'r:1 c:1 c:1 r:1 c:1 c:1'},
    {n:'harp',t:'arp',i:'harp',o:3,v:.35,ctr:9,pan:-.3,pat:'0:2 1:2 2:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,cut:900,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.75,pat:'R:3 5:3'},
    {n:'dr',t:'drum',v:.6,rv:.15,pat:{frame:'x..o..',shaker:'.g..g.'}}
  ],
  sec:{
    A:{ch:'1|1|4|5|1|4|7|1',fid:LS},
    B:{ch:'4|1|4|1|4|1|7|1',hn:'6:3 4:3 | 3:3 1:3 | 4:2 6:1 8:3 | 5:6 | 6:3 8:3 | 10:3 8:3 | 7:3 9:3 | 8:6'},
    A2:{ch:'1|1|4|5|1|4|7|1',fid:LS,fl:LS,hn:LSctr}
  }},
// ---- Ending 3, the Moth and the Moon: a music box on a paper lantern, flute and harp, very gentle (Ab major)
n_end_moth:{g:1.629,key:'Ab',mode:'ion',bpm:60,meter:3,step:2,form:['A','B','A2'],
  parts:[
    {n:'mbox',i:'mbox',o:5,v:1.6,lead:1,pan:.12,dl:.25},
    {n:'fl',i:'flute',o:4,v:.9,orn:1,lead:1,att:.14,pan:-.08},
    {n:'cel',i:'celesta',o:5,v:.35,pan:.3,dl:.3},
    {n:'harp',t:'arp',i:'harp',o:3,v:.32,ctr:9,pan:-.3,pat:'0:2 1:2 2:2'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,att:1.4,rel:1.4,cut:900,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.55,pat:'R:6'}
  ],
  sec:{
    A:{ch:LSC,mbox:LS},
    B:{ch:'6|3|4|1|6|3|2 5|1',fl:'3:3 2:1 1:2 | 3:2 5:2 7:2 | 6:4 5:1 4:1 | 3:6 | 3:3 5:1 8:2 | 7:2 5:2 3:2 | 4:2 6:1 2:2 5:1 | 5:6'},
    A2:{ch:LSC,fl:LS,mbox:LS,cel:'r:6 | r:4 7:2 | r:6 | r:4 5:2 | r:6 | r:4 5:2 | r:6 | r:3 8:3',vol:{mbox:.7}}
  }},
// ---- the dawn after every ending, and Dawnlight Peak in free roam: the lantern song in full, birds coming back
n_dawn:{g:1.324,key:'E',mode:'ion',bpm:168,qbpm:84,meter:6,step:1,form:['A','B','A2'],
  parts:[
    {n:'fl',i:'flute',o:5,v:.95,orn:1,lead:1,pan:.08},
    {n:'str',i:'strings',o:4,v:.6,lead:1,att:.2,pan:-.15},
    {n:'hn',i:'horn',o:3,v:.55,lead:1,pan:.12},
    {n:'harp',t:'arp',i:'harp',o:3,v:.45,ctr:9,pan:-.28,pat:'0:1 1:1 2:1 3:1 2:1 1:1'},
    {n:'cel',i:'celesta',o:5,v:.35,pan:.32,dl:.3},
    {n:'pad',t:'pad',i:'pad',o:3,v:.4,ctr:9,pat:true},
    {n:'bass',t:'bass',i:'bass',o:2,v:.7,pat:'R:3 5:3'},
    {n:'dr',t:'drum',v:.6,rv:.2,pat:{frame:'x.....',shaker:'..g..g'}}
  ],
  sec:{
    A:{ch:LSC,fl:LS,cel:'r:4 5:1 6:1 | r:6 | r:6 | r:4 5:1 4:1 | r:6 | r:6 | r:4 8:1 6:1 | r:6'},
    B:{ch:MS_LMC,str:LM68,hn:LM68,vol:{hn:.8}},
    A2:{ch:LSC,fl:LS,str:LS,hn:LSctr,cel:'r:4 5:1 6:1 | r:6 | r:4 6:1 5:1 | r:6 | r:4 5:1 6:1 | r:6 | r:4 8:1 6:1 | r:6',
      dr:{frame:'x..o..',shaker:'.g.g.g'}}
  }},
// ---- the grand epilogue, a storybook walk through the four lands: Emberhollow's tune, the leitmotif, the world's tune
// from the title screen, and the lantern song to close (D major, gentle 4/4)
n_epilogue:{g:1.35,key:'D',mode:'ion',bpm:92,meter:4,step:2,swing:.08,form:['E','L','M','T'],
  parts:[
    {n:'fl',i:'flute',o:4,v:1,orn:1,lead:1,pan:.08},
    {n:'cel',i:'celesta',o:5,v:.5,lead:1,pan:.3,dl:.25},
    {n:'str',i:'strings',o:4,v:.6,lead:1,att:.2,pan:-.15},
    {n:'hn',i:'horn',o:3,v:.6,lead:1,pan:.12},
    {n:'harp',t:'arp',i:'harp',o:3,v:.5,ctr:9,pan:-.28,pat:'0:1 1:1 2:1 1:1 3:1 1:1 2:1 1:1'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.35,ctr:9,pat:true,cut:1000},
    {n:'bass',t:'bass',i:'bass',o:2,v:.75,pat:'R:2 r:2 5:2 r:2'},
    {n:'dr',t:'drum',v:.6,rv:.15,pat:{frame:'x...o...',shaker:'.g.g.g.g'}}
  ],
  sec:{
    E:{ch:MS_VC,fl:MS_V6+' | 5:2 7:1 6:1 5:2 2:2 | 1:6 r:2'},
    L:{ch:MS_LMC,str:MS_LM1+' | '+MS_LM2,hn:MS_LM1+' | '+MS_LM2,vol:{hn:.7}},
    M:{ch:MS_MBC,cel:MS_MB,harp:'0:2 1:2 2:2 1:2'},
    T:{ch:LS4C,fl:LS4,str:LS4,hn:LS4ctr,vol:{str:.7}}
  }},
// ---- the very last screen: a lantern-song fanfare, the leitmotif in full triumph with choir, then a gentle loop
n_victory:{g:1.303,key:'E',mode:'ion',bpm:96,meter:4,step:4,intro:['F','A'],form:['G','H'],
  parts:[
    {n:'b1',i:'brass',o:4,v:.9,lead:1,pan:.08},
    {n:'b2',i:'brass',o:4,v:.6,pan:-.08},
    {n:'str',i:'strings',o:5,v:.7,pan:-.18},
    {n:'fl',i:'flute',o:5,v:1,orn:1,lead:1},
    {n:'cel',i:'celesta',o:5,v:.45,lead:1,pan:.3,dl:.25},
    {n:'harp',t:'arp',i:'harp',o:4,v:.5,ctr:2,pan:.3,pat:'0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2'},
    {n:'choir',t:'pad',i:'choir',o:4,v:.35,ctr:2,att:.5,pat:true},
    {n:'pad',t:'pad',i:'pad',o:3,v:.45,ctr:9,pat:true},
    {n:'timp',t:'bass',i:'timp',o:2,v:.7},
    {n:'bass',t:'bass',i:'bass',o:2,v:.8,pat:'R:8 5:4 8:4'},
    {n:'dr',t:'drum',v:.75,rv:.18}
  ],
  sec:{
    F:{ch:'1|4|5|1',b1:'1:3 3:1 5:2 3:2 8:8 | 6:3 6:1 8:3 6:1 4:8 | 7:3 9:1 12:4 9:4 7:4 | 8:16',b2:'-2:3 1:1 3:2 1:2 5:8 | 4:3 4:1 6:3 4:1 1:8 | 5:3 7:1 9:4 7:4 5:4 | 5:16',
      timp:'R:4 r:12 | R:4 r:12 | R:4 r:4 R:2 R:2 R:4 | R:1@.45 R:1@.5 R:1@.55 R:1@.6 R:1@.66 R:1@.72 R:1@.8 R:1@.9 R:8',
      mute:['harp','bass','choir'],dr:{crash:'X...............|................|................|X...............'}},
    A:{ch:MS_LMC,b1:msX(MS_LM1+' | '+MS_LM2,2),str:msX(MS_LM1+' | '+MS_LM2,2),timp:'R:16',
      dr:{kick:'x.......x.......',snare:'x..gx.g.x..gx.gg',crash:msHit('x',64)}},
    G:{ch:LS4C,fl:msX(LS4,2),vol:{pad:.5,harp:.55,bass:.6},mute:['choir']},
    H:{ch:MS_LMC,cel:msX(MS_LM1+' | '+MS_LM2,2),vol:{pad:.5,harp:.55,bass:.6},mute:['choir']}
  }}
});

Object.assign(MSTING,{
// a bite out of the moon: violet bells tumble down, then a low growl of brass and a deep hit
m_bite:{g:1.215,key:'B',mode:'aeo',bpm:96,meter:4,step:4,intro:['S'],
  parts:[
    P(VB,{n:'vb',o:4,v:1,lead:1,pan:.15,dl:.3,dec:2.4}),
    {n:'cel',i:'celesta',o:4,v:.6,lead:1,pan:-.2,dl:.3},
    {n:'br',i:'brass',o:2,v:.9,lead:1},
    {n:'choir',t:'pad',i:'choir',o:3,v:.55,ctr:7,pat:true,att:.3,rel:1.2},
    {n:'dr',t:'drum',v:.9,rv:.35,pat:{taiko:'........X.......|X...............',crash:'........X.......|................'}}
  ],
  sec:{S:{ch:'1|1d',vb:'15:1 14:1 13:1 12:1 11:1 10:1 9:1 8:1 r:8 | 8,9b:12 r:4',cel:'r:8 1,2b:8 | 1:12 r:4',br:'r:8 1,2b:8 | 1:12 r:4'}}},
// Nightfall Peak rises: a long low swell, a timpani roll, a cluster that opens into an empty fifth
n_rise:{g:1.224,key:'A',mode:'aeo',bpm:72,meter:4,step:4,intro:['S'],
  parts:[
    {n:'br',i:'brass',o:2,v:.95,lead:1,att:.6},
    {n:'str',i:'strings',o:3,v:.8,lead:1,att:1.2},
    P(VB,{n:'vb',o:4,v:.8,lead:1,pan:.2,dl:.35}),
    {n:'choir',t:'pad',i:'choir',o:3,v:.6,ctr:7,pat:true,att:1.5,rel:1.5},
    {n:'timp',t:'bass',i:'timp',o:2,v:.8,pat:'R:1@.3 R:1@.34 R:1@.38 R:1@.42 R:1@.46 R:1@.5 R:1@.55 R:1@.6 R:1@.65 R:1@.7 R:1@.75 R:1@.8 R:1@.85 R:1@.9 R:1@.95 R:1 | R:16'},
    {n:'dr',t:'drum',v:.9,rv:.4,pat:{taiko:'................|X...............',crash:'................|X...............'}}
  ],
  sec:{S:{ch:'1|1',br:'1,2b:16 | 1,5,8:16',str:'5,6:16 | 8,12:16',vb:'r:16 | 12,13:4 8:12'}}}
});

// ==== ROUTING
// Which theme plays where. Every rule hands back null to keep the base choice (menu, death, Embermere, Acts II and III).
const MU2_TOWN={m_driftwood:'m_drift',m_sable:'m_sable'};
// Moonfall biomes 30 to 39 ('@dark' is m_night or m_dark by the moon)
const MU2_B3={30:'m_reef',31:'m_sea',32:'m_lumen',33:'m_deep',34:'m_glass',35:'m_glass',36:'m_glass',37:'m_sable',38:'@dark',39:'@dark'};
// Nightfall Peak biomes 40 to 49
const MU2_B4={40:'n_ascent',41:'n_ascent',42:'n_clocks',43:'n_rime',44:'n_glass',45:'n_summit',46:'n_ascent',47:'n_ascent',48:'n_bridge',49:'n_dawn'};
// areas by id prefix (dungeon floors are ids like m_lumen_2, so prefixes match every floor)
const MU2_AREA=[['m_lumen','m_lumen'],['m_burrows','m_burrows'],['m_mirror','m_temple'],['m_obs','m_eclipse'],['m_coral','m_deep'],['m_bubble','m_deep']];
const MU2_BOSS={m_hushboss:'m_hush',n_echo_vor:'n_echo',n_echo_vesper:'n_echo',n_echo_glaciar:'n_echo',n_echo_hush:'n_echo_hush'};
// loose mood names a story writer might use (only when no other module defines a theme by that name)
const MU2_ALIAS={eclipse:'m_eclipse',moonbite:'m_eclipse',observatory:'m_eclipse',hush:'m_hush',heart:'n_heart',heartmoment:'n_heart',
  fall:'n_fall',choice:'n_fall',morning:'n_end_dawn',embermoon:'n_end_ember',ember_moon:'n_end_ember',moth:'n_end_moth',mothmoon:'n_end_moth',
  dawn:'n_dawn',dawnlight:'n_dawn',epilogue:'n_epilogue',finale:'n_victory',the_end:'n_victory',nightfall:'n_ascent',peak:'n_ascent'};
const MU2_END={dawn:'n_end_dawn',embermoon:'n_end_ember',moth:'n_end_moth'};
// generic moods that the finale's own themes replace once the fight is over (the fall, the endings, the dawn, the epilogue)
const MU2_GENERIC={tender:1,victory:1,sad:1,emotional:1,night:1,ending:1,win:1};
const MU2_PIER={x:12800,y:65400,r:900};
const mu2Moon=()=>{ const v=G&&G.flags?G.flags.moon:null; return v==null||isNaN(+v)?100:+v; };
const mu2Dark=()=>mu2Moon()<=40?'m_dark':'m_night';
const mu2Act=()=>{ try{ return typeof actOf==='function'?actOf(G.stage)|0:0; }catch(e){ return 0; } };
const mu2Fin=()=>{ const s=String(G.stage||''); return s.startsWith('n_')||mu2Act()>=5; };
// the biome under Ash, cached while he stands still (base musicMood already asked once this frame)
let mu2BC={x:-1e9,y:-1e9,b:-1}, mu2FakeB=null, mu2Base=null;
function mu2Biome(){
  if(mu2FakeB!=null) return mu2FakeB;                 // tests only (__ebDbg.mus2.fakeBiome)
  const x=player.x, y=player.y;
  if(Math.abs(x-mu2BC.x)+Math.abs(y-mu2BC.y)>24){ let b=-1; try{ b=biomeInfo(x,y,{}).b; }catch(e){} mu2BC={x,y,b}; }
  return mu2BC.b;
}
function mu2Map(){ try{ return typeof curMap==='function'?curMap():0; }catch(e){ return 0; } }
// the Nyxara fight: phase by her health bar (FINALE 8.2: 100-70, 70-45, 45-20, 20-0); the Heart moment between 3 and 4
function mu2Nyx(b){
  const f=G.flags||{};
  if(f.n_heart_on) return 'n_heart';
  const fr=b.maxHp>0?b.hp/b.maxHp:1;
  let ph=typeof b.nPhase==='number'&&b.nPhase>=1&&b.nPhase<=4?b.nPhase:fr>.7?1:fr>.45?2:fr>.2?3:4;
  if(ph===4&&!f.n_heart_done) return 'n_heart';
  return ['n_nyxara','n_nyxara2','n_nyxara3','n_nyxara4'][ph-1];
}
// after the fight: the fall and the choice, the ending, the dawn, the epilogue (FINALE 9 to 12)
function mu2After(){
  const ch=G.choices||{}, f=G.flags||{}, e=ch.n_end;
  if(e&&(G.done||G.stage==='n_end')) return null;    // the game is finished: free roam (Dawnlight Peak plays n_dawn)
  if(f.n_epi||f.n_epilogue) return 'n_epilogue';
  if(!e){
    if(G.stage==='n_nyxara'&&G.bossDone&&G.bossDone.n_nyxara) return 'n_fall';
    return null;
  }
  const d=+f.n_dawn||0;
  if(d>=1) return 'n_epilogue';
  if(d>0) return 'n_dawn';
  return MU2_END[e]||'n_dawn';
}
function mu2Area(m){
  const id=String((AREA.def&&AREA.def.id)||AREA.id||'');
  const k=mu2Map();
  if(m==='combat') return k===4&&!id.startsWith('m_')?'n_fight':null;
  if(m==='puzzle') return null;
  for(const [p,t] of MU2_AREA) if(id.startsWith(p)) return t;
  if(id.startsWith('n_')&&(AREA.kind==='cave'||AREA.rooms)) return 'n_glass';
  return null;                                       // houses keep the house and inn tunes
}
function mu2Out(k){
  const f=G.flags||{};
  if(k===3){
    if(mu2Fin()&&dist2(player.x,player.y,MU2_PIER.x,MU2_PIER.y)<MU2_PIER.r*MU2_PIER.r) return 'n_bridge';
    if(f.m_eclipse_on||(G.eclipse&&G.eclipse.on)) return 'm_eclipse';
    const night=isNight();
    for(const t in MU2_TOWN){ const p=POI[t]; if(p&&dist2(player.x,player.y,p.x,p.y)<(p.r+80)**2) return night?mu2Dark():MU2_TOWN[t]; }
    if(night) return mu2Dark();
    const r=MU2_B3[mu2Biome()]||'m_sea';
    return r==='@dark'?mu2Dark():r;
  }
  if(k===4){
    const dawn=(+f.n_dawn||0)>=1;
    if(dawn) return isNight()?null:'n_dawn';
    return MU2_B4[mu2Biome()]||'n_ascent';
  }
  return null;
}
function mu2Pick(m){
  if(!G||scene==='menu'||scene==='dead'||scene==='dying') return null;
  if(scene==='victory') return (G.choices&&G.choices.n_end)||(G.done&&mu2Act()>=5)||G.stage==='n_end'?'n_victory':null;
  const mood=DLG&&DLG.mood;
  const k=mu2Map(), inFin=k===4||mu2Fin();
  if(inFin){ const a=mu2After(); if(a&&(!mood||MU2_GENERIC[mood]||!MSCORE[mood])) return a; }
  if(mood){ if(MSCORE[mood]) return null; const al=MU2_ALIAS[String(mood).toLowerCase()]; return al||null; }
  const b=G.boss&&!G.boss.dead?G.boss:null;
  if(b){ if(b.type==='n_nyxara') return mu2Nyx(b); return MU2_BOSS[b.type]||null; }
  if(G.mode==='normal'||(G.mini&&G.mini.music)) return null;
  if(inFin&&G.flags&&G.flags.n_heart_on&&G.stage==='n_nyxara') return 'n_heart';
  if(AREA) return mu2Area(m);
  if(m==='combat') return k===4?'n_fight':null;
  if(k===3||k===4) return mu2Out(k);
  return null;
}
{ const base=musicMood; mu2Base=base; musicMood=function(dt){
  const m=base.apply(this,arguments);
  let r=null; try{ r=mu2Pick(m); }catch(e){ r=null; }
  return r&&MSCORE[r]?r:m;
}; }
window.__ebDbg=Object.assign(window.__ebDbg||{},{mus2:{pick:mu2Pick,nyx:mu2Nyx,after:mu2After,moon:mu2Moon,biome:mu2Biome,B3:MU2_B3,B4:MU2_B4,AREA:MU2_AREA,BOSS:MU2_BOSS,ALIAS:MU2_ALIAS,
  themes:()=>Object.keys(MSCORE).filter(n=>/^[mn]_/.test(n)),stingers:()=>['m_bite','n_rise'],
  // test hooks: the theme musicMood picks now, what it would pick without this file, a pretend biome, a scene, a dialogue mood
  mood:()=>musicMood(0),base:()=>mu2Base(0),fakeBiome:b=>{ mu2FakeB=b==null?null:b; mu2BC.x=-1e9; },
  loopOnly:n=>{ const th=MSCORE[n]; if(!th) return null; const k='_loop_'+n; MSCORE[k]=Object.assign({},th,{intro:null,_b:null}); return k; },
  setScene:s=>{ scene=s; },talk:mood=>runDialogue([['narr','(music test)']],()=>{ scene='play'; },mood?{mood}:undefined)}});
}
