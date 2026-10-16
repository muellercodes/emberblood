// load: a data file may hold only literals and the four collector calls
chapter({ id: 'c_bad', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Bad'], step: [],
  scene: { x: [['narr', 'Hi.']] },
  reward: Math.max(1, 2),
  when: () => true,
})
