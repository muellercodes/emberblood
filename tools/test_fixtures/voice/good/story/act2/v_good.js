// The voice and talk rules (J2) on text that keeps every budget: no voice, re, talk, label, said, choose or idle note.
// Uses each v11 talk field once: re on a scene line (with next), re on a talk entry, ask, idle, bye, said.
chapter({ id: 'v_good', act: 2, after: 'v_start', next: 'v_end', card: ['Act II', 'Good'],
  npc: {
    v_tess: { name: ['Tess Tiller', 'Tess'], map: 1, at: [7000, 25000] },
    v_rolf: { name: ['Rolf', 'Rolf'], map: 1, at: [7100, 25000] },
    c_penny: { name: ['Penny Press', 'Penny'], map: 1, at: [7200, 25000] },
    f_tollef: { name: ['Tollef', 'Tollef'], map: 1, at: [7300, 25000] },
  },
  step: [ { id: 's1', do: 'cutscene v_good_s' }, { id: 's2', do: 'talk v_tess' } ],
  scene: {
    v_good_s: [
      ['narr', 'Rolf drops a basket of eggs, and not one breaks.', 'Rolf drops the eggs. None break.'],
      ['v_rolf', 'Oh! Not one. That never happens.', 'Not one broke!'],
      ['ash', 'My great-great-grandmother would call that luck.', 'Great-great-grandma would say luck.'],
      ['v_rolf', 'Take one. For the road.', { re: [
        { t: ['Thank you, Rolf.', 'Thanks, Rolf.'], tone: 'kind', then: ['said rolf_egg'], say: [['v_rolf', 'Mind it on the stairs.']] },
        { t: ['Can I take two?', 'Two?'], say: [['v_rolf', 'One is a gift. Two is shopping.']],
          next: { say: ['Fine. Two. Do not tell Tess.', 'Fine, two.'], re: [
            { t: ["I won't tell her.", "I won't."], say: [['v_rolf', 'Good lad.']] },
            { t: ['Too late, she saw.', 'She saw.'], say: [['v_rolf', 'She always sees.']] },
          ] } },
      ] }],
      ['narr', 'Tess is watching from the gate.'],
      { choose: 'v_good_c', ask: ['What do you do?', 'What do you do?'], pick: [
        { t: ['Wave at Tess.', 'Wave.'], say: [['v_tess', 'Hello, egg thief.']] },
        { t: ['Hide the eggs.', 'Hide them.'], say: [['v_tess', 'I can see you.']] },
      ] },
    ],
  },
  talk: {
    v_tess: [
      { if: 'said rolf_egg', once: true, say: ['Rolf says you thanked him. He went pink.', 'Rolf went pink.'] },
      { if: 'stage>=v_good', say: ['The goats are back in the bell tower.', 'Goats in the tower again.'], re: [
        { t: ['How do they get up there?', 'How?'], say: [['v_tess', 'Nobody knows. They look very pleased.']] },
        { t: ['I can get them down.', 'I can help.'], tone: 'brave', f: 0.5, say: [['v_tess', 'Bring a carrot. Bring TWO.']] },
      ] },
      { ask: ['Who taught the goats to climb?', 'Who taught them?'], if: 'stage>=v_good', say: ['My gran. On purpose. She never said why.', 'My gran did.'] },
      { idle: ['Mm? Goats, mostly.', 'Goats, mostly.'] },
      { bye: ['Mind the goats on your way.', 'Mind the goats.'] },
    ],
    v_rolf: [
      { say: ['The barn is big as a house this year. The hens like it.', 'The barn is huge. The hens like it.'] },
    ],
    // Penny's headlines and Tollef's shouting are left out of the CAPS share
    c_penny: [
      { say: ['HEADLINE: GOATS IN BELL TOWER. TOWN SHOCKED.', 'HEADLINE: GOATS IN TOWER!'] },
      { say: ['HEADLINE: EGG BASKET DROPPED. NONE BROKEN.', 'HEADLINE: NO EGGS BROKEN!'] },
      { bark: true, say: ['HEADLINE: DRAGON WAVES.', 'HEADLINE: DRAGON WAVES.'] },
    ],
    f_tollef: [
      { say: ['HELLO! TOLLEF! BELL! GOATS IN IT!', 'HELLO! GOATS IN MY BELL!'] },
      { say: ['WHAT? NO! LOUDER!', 'WHAT? LOUDER!'] },
    ],
  },
})
