// DEMO data (see _act.js). Stand-in text.
chapter({
  id: 'c_light', act: 2, after: 'c_brass', next: 'c_spire',
  card: ['Act II · Chapter 6', 'The Spinning Lighthouse'],
  place: {
    cut_ends:  { map: 1, at: [9520, 26940], kind: 'examine', name: 'the rope ends', ref: 'c_cut' },
    cut_silk:  { map: 1, at: [9580, 26960], kind: 'examine', name: 'a grey thread' },
    cut_rope:  { map: 1, at: [9600, 26930], kind: 'examine', name: 'the last rope' },
  },
  clue: {
    l_clean_cut:   { icon: 'knife', text: ['The ropes were cut clean, not chewed.', 'Cut clean.'] },
    l_silk_thread: { icon: 'thread', text: ['A grey silk thread is caught on the post.', 'Grey silk on the post.'] },
    l_one_rope:    { icon: 'rope', text: ['One rope was left tied, so nobody would fall.', 'One rope left. So no one falls.'] },
    l_crab_claim:  { icon: 'crab', herring: true, text: ['Mo says Pinch\'s crabs cut the ropes.', 'Mo blames the crabs.'] },
    l_lamp_moths:  { icon: 'moth', text: ['The lamp is smothered in a giant\'s worth of moth dust.', 'Huge dust on the lamp.'] },
    l_fireproof:   { icon: 'fire', text: ['In the Lamp Room, Vesper walked through Ash\'s fire unhurt.', 'Fire did not hurt her.'] },
    l_pearl_mural: { icon: 'paint', text: ['The mural says: "I had no fire, so I climbed."', 'No fire, so I climbed.'] },
  },
  deduce: {
    who_cut: {
      mystery: 'who_cut',
      ask: ['Who cut the rope bridge?', 'Who cut the bridge?'],
      needs: ['l_clean_cut', 'l_silk_thread', 'l_one_rope'],
      pick: [
        { t: ['The Moth Mask, to slow you down', 'The Moth Mask'], right: true },
        { t: ["Pinch's crabs", 'The crabs'], hint: ['Crabs chew. These ropes were cut.', 'Crabs chew.'] },
      ],
      then: ['world c_cut rebuilt'],
    },
    what_stopped: {
      mystery: 'what_stopped',
      ask: ['What stopped the clocks, the tide and the light?', 'What stopped them?'],
      needs: ['s_tide_dust', 'l_lamp_moths'],
      pick: [
        { t: ['A giant moth flew over the coast', 'A giant moth'], right: true },
        { t: ['The Moth Mask', 'The Moth Mask'], hint: ['Too much dust for one girl.', 'Too much dust.'] },
        { t: ['Lord Whirligig', 'Lord Whirligig'], hint: ['His own bird clock stopped too.', 'His clock stopped too.'] },
      ],
    },
  },
  step: [
    { id: 'cut', do: 'all', obj: ['Find out who cut the bridge', 'Look at the Cut'],
      parts: [
        { do: 'examine cut_ends', then: ['clue l_clean_cut'] },
        { do: 'examine cut_silk', then: ['clue l_silk_thread'] },
        { do: 'examine cut_rope', then: ['clue l_one_rope'] },
      ],
      extra: [ { do: 'talk c_mo', then: ['clue l_crab_claim'] } ] },
    { id: 'deduce', do: 'deduce who_cut' },
    { id: 'agatha', do: 'talk c_agatha', then: ['clue l_lamp_moths'] },
    { id: 'light', do: 'dungeon c_lighthouse', obj: ['Relight the lamp', 'Relight the lamp'] },
    { id: 'lamp', do: 'cutscene c_lamp_room', then: ['clue l_fireproof', 'clue l_pearl_mural'] },
    { id: 'stopped', do: 'deduce what_stopped' },
  ],
  scene: {
    c_lamp_room: [
      ['narr', 'Moths pour out of the lamp. Vesper is in the middle of them.', 'Moths everywhere! Vesper is inside.'],
      { choose: 'c_lamp', ask: ['Save her?'], pick: [
        { t: ['Breathe fire on the moths', 'Fire!'], tone: 'kind', if: 'quest c_oona done', then: ['trust vesper +1'] },
        { t: ['Shout for her to run', 'Shout'], say: [['c_vesper', 'I KNOW how to run!']] },
      ] },
      ['narr', 'She walks out through your fire. It does not even singe her.', 'The fire does not hurt her.'],
    ],
  },
})
