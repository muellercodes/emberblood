// Act II old code (fake), every line inside its budget: each phrase said only by its owner, once.
const STORY={};
STORY.v_hello=[xl('ember',`Hello, little ember. You came a long way.`,`Hello, little ember.`),xl('maren',`Eat something, love. Then go and find her.`,`Eat something!`)];
STORY.v_gate=[xl('c_bobs',`HALT! Who goes there?`,`HALT!`),['m_umberwing',`Stuck since Tuesday, I am.`]];
const F2_NAP=()=>m3pL('f_glaciar',pick([`Zzz. Oh, it's you, dumpling.`,`Hello again, dumpling. I was resting my eyes.`]));
// a talk table keyed by people: each person's strings are theirs
const TALK={
  c_fig:{bio:S('Runs the tea shop.','Runs the tea shop.'),rumor:S(`More tea, dearie? The pot is still warm.`,`More tea, dearie?`)},
  v_tess:{bio:S('Keeps goats.','Keeps goats.'),rumor:S(`The goats know the way up the bell tower.`,`The goats climb the tower.`)},
  v_rolf:{bio:S('Keeps hens.','Keeps hens.'),rumor:S(`Hens lay more when the bell rings.`,`Hens like the bell.`)},
};
// a two-person chat: seat 0 is Oona, seat 1 is Tess
VCH('v_ch1','id:c_oona','id:v_tess',()=>true,[[0,S(`Come in out of the rain, duck.`,`Come in, duck.`)],[1,S(`Thank you, Oona.`,`Thanks, Oona.`)]]);
