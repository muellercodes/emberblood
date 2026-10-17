// quest: one side quest with no payoff, one whose "truth" clue feeds no main deduction
quest({ id: 'q_nothing', act: 2, giver: 'c_hettie', title: ['Fetch a sock', 'Fetch a sock'], optional: true,
  step: [ { id: 'sock', do: 'talk c_hettie' } ] })
quest({ id: 'q_rumor', act: 2, giver: 'c_hettie', title: ['A rumor', 'A rumor'], optional: true,
  payoff: { kind: 'truth', id: 'q_rumor_clue' },
  clue: { q_rumor_clue: { text: ['Somebody likes soup.', 'Soup.'] } },
  step: [ { id: 'ask', do: 'talk c_hettie', then: ['clue q_rumor_clue'] } ] })
