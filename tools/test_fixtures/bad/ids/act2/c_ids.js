// ids: an examine of a spot nobody placed, a place outside its map, an unknown speaker and an unknown effect
chapter({ id: 'c_ids', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Ids'],
  place: {
    gh_far: { map: 1, at: [7000, 5000], kind: 'examine', name: 'a spot on the wrong map' },
  },
  step: [
    { id: 'look', do: 'examine gh_bird_clock', then: ['giv magnifier'] },
    { id: 'far', do: 'examine gh_far' },
  ],
  scene: { c_ids_s: [['c_nobody_at_all', 'Who am I?']] },
})
