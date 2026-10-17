// dir: the cave is south of the lodge, the line says north
chapter({ id: 'c_dir', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Directions'],
  place: {
    gh_lodge: { map: 1, at: [1500, 23400], kind: 'spot', name: 'the lodge' },
    gh_cave:  { map: 1, at: [1250, 24650], kind: 'spot', name: 'the cave' },
  },
  step: [ { id: 's', do: 'cutscene c_dir_s' } ],
  scene: { c_dir_s: [ ['c_elka', 'Slide down the hill north of the lodge.', { dir: ['gh_lodge', 'gh_cave', 'north'] }] ] },
  npc: { c_elka: { name: ['Elka', 'Elka'], map: 1, at: [1500, 23420] } },
})
