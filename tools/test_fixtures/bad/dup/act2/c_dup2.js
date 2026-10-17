quest({ id: 'q_dup', act: 2, giver: 'c_otto', title: ['Dupe', 'Dupe'], optional: true, payoff: { kind: 'heart_ember' },
  clue: { g_twice: { text: ['Twice again.', 'Twice again.'] } },
  step: [ { id: 's', do: 'talk c_otto', then: ['heart_ember', 'clue g_twice'] } ] })
