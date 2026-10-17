chapter({ id: 'c_gear', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Clocks'],
  clue: {
    g_a: { text: ['Clue A.', 'Clue A.'] },
    g_b: { text: ['Clue B.', 'Clue B.'] },
  },
  deduce: {
    where_next: { mystery: 'moth_mask', ask: ['Where?', 'Where?'], needs: ['g_a', 'g_b'],
      pick: [ { t: 'The Manor', right: true }, { t: 'The Hall' } ] },
  },
  step: [
    { id: 'a', do: 'cutscene c_a' },
    { id: 'deduce', do: 'deduce where_next' },
    { id: 'b', do: 'cutscene c_b' },
  ],
  scene: { c_a: [['narr', 'A.', { clue: 'g_a' }]], c_b: [['narr', 'B.', { clue: 'g_b' }]] },
})
