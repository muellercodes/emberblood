// Act III: Maren's second "Eat something" is fine here (one per act); Glaciar says "dumpling" (fine)
chapter({ id: 'v_act3', act: 3, after: 'v_end', next: null, last: true, card: ['Act III', 'Cold'],
  npc: { f_glaciar: { name: ['Glaciar', 'Glaciar'], map: 2, at: [7000, 45000] } },
  step: [ { id: 's', do: 'cutscene v_act3_s' } ],
  scene: { v_act3_s: [ ['maren', 'Eat something warm.', 'Eat something warm.'], ['f_glaciar', 'Come here, dumpling.', 'Come here, dumpling.'] ] },
})
