// A fake old game for the voice and talk tests (tools/test_check.sh): two stages and the people who speak.
// Only scanned by tools/check.mjs (--game), never run.
const STAGES=['v_start','v_end'];
const CAST=[
  {id:'v_tess',name:'Tess Tiller',lines:[S(`Fresh bread, still warm.`,`Fresh bread!`)]},
  {id:'v_rolf',name:'Rolf',lines:[S(`Mind the goats.`,`Mind the goats.`)]},
  {id:'v_otto',name:'Otto',lines:[]},
  {id:'ember',name:'Ember'},{id:'c_mask',name:'The Moth Mask'},{id:'nyxara',name:'Nyxara'},{id:'f_glaciar',name:'Glaciar'},
  {id:'c_oona',name:'Gran Oona'},{id:'c_fig',name:'Fig'},{id:'c_bobs',name:'The Bobs'},{id:'m_umberwing',name:'Umberwing'},
  {id:'c_penny',name:'Penny Press'},{id:'f_tollef',name:'Tollef'},
];
