// DEMO data (see _act.js): side quests and the Embermere gates for Act II powers (one leads to nothing on purpose).
quest({ id: 'q_lookout', act: 2, giver: 'c_oona', title: ["Vesper's lookout", "Vesper's lookout"], optional: true,
  payoff: { kind: 'truth', id: 'q_lookout_page' },
  place: {
    e0_rockfall_wall: { map: 0, at: [3446, 10842], kind: 'gate', gate: 'climb_wall', leads: 'e0_lookout' },
    e0_lookout:       { map: 0, at: [3390, 10700], kind: 'chest', loot: ['heart_ember'] },
    e0_sketch:        { map: 0, at: [3380, 10690], kind: 'examine', name: 'an old sketchbook page' },
  },
  clue: { q_lookout_page: { icon: 'paint', text: ['A sketch of Lantern Night, from up here. Signed V.', 'A sketch of Lantern Night. V.'] } },
  step: [
    { id: 'ask', do: 'talk c_oona', scene: 'q_lookout_ask' },
    { id: 'climb', do: 'goto e0_lookout', obj: ['Climb to the lookout above the old camp', 'Climb to the lookout'] },
    { id: 'page', do: 'examine e0_sketch', then: ['clue q_lookout_page'] },
  ],
  scene: { q_lookout_ask: [ ['c_oona', 'She had a place up high, above the rockfall. She liked to watch the fireworks.', 'She watched from up high.', { ref: 'e0_lookout' }] ] },
})
places({ id: 'gates_map0', act: 2, map: 0,
  place: {
    e0_mill_post:    { at: [5200, 7400], kind: 'gate', gate: 'grapple_post', leads: 'e0_mill_ledge' },
    e0_mill_ledge:   { at: [5260, 7300], kind: 'chest', loot: ['upgrade tail_long'] },
    e0_wood_curtain: { at: [4300, 6600], kind: 'gate', gate: 'shadow_curtain', leads: 'e0_hollow_den' },
    e0_hollow_den:   { at: [4350, 6500], kind: 'examine', name: 'a den behind the moth curtain', then: ['heart_ember'] },
    e0_lake_ring:    { at: [6100, 7300], kind: 'gate', gate: 'chain_ring', leads: 'e0_dock_ladder' },
    e0_dock_ladder:  { at: [6150, 7250], kind: 'spot', name: 'the dock ladder', then: ['open e0_lake_ring'] },
    e0_hook_cliff:   { at: [7000, 5000], kind: 'gate', gate: 'whip_hook', leads: 'e0_bare_ledge' },
    e0_bare_ledge:   { at: [7080, 4950], kind: 'spot', name: 'a bare ledge' },
  },
})
quest({ id: 'c_oona', act: 2, giver: 'c_oona', title: ["Granny Oona's stove", "Gran's stove"], optional: true,
  payoff: { kind: 'ally', id: 'c_oona' },
  step: [ { id: 'stove', do: 'talk c_oona', then: ['trust vesper +1', 'ally c_oona'] } ] })
