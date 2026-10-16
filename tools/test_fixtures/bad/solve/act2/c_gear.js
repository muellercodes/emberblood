chapter({ id: 'c_gear', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Clocks'],
  place: {
    gh_high_roof: { map: 1, at: [7300, 24400], kind: 'spot', name: 'a high roof' },
    gh_post:      { map: 1, at: [7300, 24500], kind: 'gate', gate: 'grapple_post', leads: 'gh_high_roof' },
  },
  step: [
    { id: 'roof', do: 'goto gh_high_roof' },
    { id: 'catch', do: 'cutscene c_catch' },
  ],
  scene: { c_catch: [
    { choose: 'c_chase', ask: ['What do you do?'], pick: [
      { t: ['Pull her up', 'Pull her up'], then: ['trust vesper +1'] },
      { t: ['Grab the sack', 'Grab the sack'], then: ['set c_chase=sack'] },
    ] },
  ] },
})
