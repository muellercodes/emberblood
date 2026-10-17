// dup: two talk options to one scene, two journal cards for Vesper, a clue defined twice
chapter({ id: 'c_dup', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Dupes'],
  npc: {
    c_ves1: { name: ['Vesper', 'Vesper'], map: 1, at: [7000, 25000] },
    c_ves2: { name: ['Vesper Saltwhistle', 'Vesper'], map: 1, at: [7000, 25100] },
    c_otto: { name: ['Ottoline', 'Ottoline'], map: 1, at: [7700, 24400] },
  },
  clue: { g_twice: { text: ['Twice.', 'Twice.'] } },
  step: [ { id: 's', do: 'talk c_otto', then: ['clue g_twice'] } ],
  scene: { c_diary: [['c_otto', 'Let me read it.']] },
  talk: { c_otto: [
    { option: ['Show her the dream diary', 'Show the diary'], scene: 'c_diary' },
    { option: ['Can you read this dream diary?', 'Read the diary?'], scene: 'c_diary' },
  ] },
})
