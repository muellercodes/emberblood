// DEMO data (see _act.js). Stand-in text.
chapter({
  id: 'c_brass', act: 2, after: 'c_claws', next: 'c_light',
  card: ['Act II · Chapter 5', 'The Brassworks'],
  place: {
    nest_pile:  { map: 1, at: [20420, 1460], kind: 'examine', name: 'a ring of glowing things' },
    nest_diary: { map: 1, at: [20520, 1420], kind: 'examine', name: 'a dream diary page' },
  },
  clue: {
    b_glow_pile:  { icon: 'lantern', text: ['Every stolen thing glows. They sit in a circle under the window.', 'Glowing things in a circle.'] },
    b_dream_page: { icon: 'note', text: ['"The Lady of the Moths says bring her light and Gran will be warm."', 'Bring light. Gran will be warm.'] },
  },
  deduce: {
    why_glowing: {
      mystery: 'moth_mask',
      ask: ['Why does she only steal things that glow?', 'Why glowing things?'],
      needs: ['g_robberies', 'b_glow_pile', 'b_dream_page'],
      pick: [
        { t: ['Someone in her dreams wants the glow', 'Someone in her dreams'], right: true },
        { t: ['She sells them for coal', 'She sells them'], hint: ['Nothing is missing from the pile.', 'Is anything missing?'] },
        { t: ["She's scared of the dark", 'She fears the dark'], hint: ['She runs the roofs at night.', 'She runs at night.'] },
      ],
    },
  },
  step: [
    { id: 'climb', do: 'use_power_at claws c_great_clock', obj: ['Climb the Great Clock', 'Climb the clock'] },
    { id: 'nest', do: 'all', obj: ['Look around the Moth\'s Nest', 'Look around'],
      parts: [
        { do: 'examine nest_pile', then: ['clue b_glow_pile'] },
        { do: 'examine nest_diary', then: ['clue b_dream_page'] },
      ] },
    { id: 'biscuits', do: 'cutscene c_biscuits' },
    { id: 'deduce', do: 'deduce why_glowing', obj: ['Work it out', 'Open the Case Book'] },
    { id: 'works', do: 'dungeon c_brassworks', obj: ['Restart the Great Clock', 'Restart the clock'], then: ['set c_clock_on'] },
  ],
  scene: {
    c_biscuits: [
      ['narr', 'A tin of biscuits. The label says FOR GRAN.', 'Biscuits. FOR GRAN.'],
      { choose: 'c_biscuits', ask: ['The biscuits'], pick: [
        { t: ['Leave them where they are', 'Leave them'], tone: 'kind', then: ['trust vesper +1'] },
        { t: ['Eat one', 'Eat one'], say: [['ash', 'Mmf. Stale. Worth it.']] },
      ] },
    ],
  },
})
