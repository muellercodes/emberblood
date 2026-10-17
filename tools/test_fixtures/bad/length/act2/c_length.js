// length: 12 lines in one scene; 8 lines right after a boss
chapter({ id: 'c_length', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Length'],
  step: [
    { id: 'talky', do: 'cutscene c_long' },
    { id: 'boss', do: 'fight c_mothmask' },
    { id: 'after', do: 'cutscene c_end_ally' },
  ],
  scene: {
    c_long: [
      ['narr', 'One.'], ['narr', 'Two.'], ['narr', 'Three.'], ['narr', 'Four.'], ['narr', 'Five.'], ['narr', 'Six.'],
      ['narr', 'Seven.'], ['narr', 'Eight.'], ['narr', 'Nine.'], ['narr', 'Ten.'], ['narr', 'Eleven.'], ['narr', 'Twelve.'],
    ],
    c_end_ally: [
      ['ash', 'One.'], ['ash', 'Two.'], ['ash', 'Three.'], ['ash', 'Four.'],
      { choose: 'c_x', ask: ['Well?'], pick: [
        { t: 'Short', say: [['ash', 'Five.']] },
        { t: 'Long', say: [['ash', 'Five.'], ['ash', 'Six.'], ['ash', 'Seven.'], ['ash', 'Eight.']] },
      ] },
    ],
  },
})
