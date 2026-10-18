// label: the old generic menu labels written into data (an option, an ask topic, a choose pick and a reply)
chapter({ id: 'c_label', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Labels'],
  npc: { v_tess: { name: ['Tess Tiller', 'Tess'], map: 1, at: [7000, 25000] } },
  step: [ { id: 's', do: 'cutscene c_label_s' } ],
  scene: {
    c_label_s: [
      ['narr', 'Tess leans on her rake.'],
      { choose: 'c_label_c', ask: ['What do you do?', 'What do you do?'], pick: [
        { t: ['Tell me about yourself.', 'About you?'], say: [['v_tess', 'Not much to tell.']] },
        { t: ['Wave.', 'Wave.'], say: [['v_tess', 'Hello to you too.']] },
      ] },
    ],
  },
  talk: {
    v_tess: [
      { option: ["What's new?", 'News?'], say: ['Nothing new. Eleven goats.', 'Eleven goats.'] },
      { ask: ['Anything else?', 'Anything else?'], say: ['No.', 'No.'] },
      { if: 'stage>=c_label', say: ['The rake is new.', 'New rake.'], re: [
        { t: ['What else is on your mind?', 'What else?'], say: [['v_tess', 'Rakes, mostly.']] },
        { t: ['Nice rake.', 'Nice rake.'], say: [['v_tess', 'Thank you. It rakes.']] },
      ] },
      { idle: ['Rakes, mostly.', 'Rakes.'] },
    ],
  },
})
