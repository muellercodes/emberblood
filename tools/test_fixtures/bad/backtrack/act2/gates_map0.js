quest({ id: 'q_lookout', act: 2, giver: 'c_hettie', title: ["Vesper's lookout", "Vesper's lookout"], optional: true,
  payoff: { kind: 'heart_ember' },
  place: {
    e0_rockfall_wall: { map: 0, at: [3446, 10842], kind: 'gate', gate: 'climb_wall', leads: 'e0_lookout' },
    e0_lookout:       { map: 0, at: [3390, 10700], kind: 'chest', loot: ['heart_ember'] },
    e0_hook:          { map: 0, at: [5000, 8000], kind: 'gate', gate: 'whip_hook', leads: 'e0_empty_ledge' },
    e0_empty_ledge:   { map: 0, at: [5100, 8000], kind: 'spot', name: 'an empty ledge' },
  },
  step: [ { id: 'up', do: 'goto e0_lookout', then: ['heart_ember'] } ] })
