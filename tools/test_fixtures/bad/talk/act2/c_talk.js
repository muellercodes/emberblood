// talk: an ask topic with no answer (no say or scene), and an entry that is an ask topic and an option at once
chapter({ id: 'c_talk', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Topics'],
  npc: { v_tess: { name: ['Tess Tiller', 'Tess'], map: 1, at: [7000, 25000] } },
  step: [ { id: 's', do: 'talk v_tess' } ],
  talk: {
    v_tess: [
      { ask: ['Who rings the bell at night?', 'Who rings the bell?'], if: 'stage>=c_talk' },
      { ask: ['How are the goats?', 'The goats?'], option: ['Goats?', 'Goats?'], say: ['Eleven. Still eleven.', 'Eleven.'] },
      { idle: ['Mm? The goats are fine.', 'The goats are fine.'] },
    ],
  },
})
