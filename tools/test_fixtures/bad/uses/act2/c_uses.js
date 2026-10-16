// uses: an item given and never used, a key that opens nothing, a promise with no payoff
chapter({ id: 'c_uses', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Uses'],
  item: {
    c_shiny_rock: { name: ['A shiny rock', 'A shiny rock'] },
    c_lift_key:   { name: ['The Oath Lift key', 'A lift key'] },
  },
  step: [
    { id: 'get', do: 'cutscene c_uses_s', then: ['give c_shiny_rock', 'give c_lift_key'] },
  ],
  scene: { c_uses_s: [
    ['narr', 'A key! It says LIFT on it.', { promise: 'c_oath_lift', ref: 'c_lift_key' }],
  ] },
})
