// said: a condition reads said tess_goats, and nothing sets it (a reply should have then: ['said tess_goats'])
chapter({ id: 'c_said', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Said'],
  npc: { v_tess: { name: ['Tess Tiller', 'Tess'], map: 1, at: [7000, 25000] } },
  step: [ { id: 's', do: 'talk v_tess' } ],
  talk: {
    v_tess: [
      { if: 'said tess_goats', once: true, say: ['You asked about my goats. Nobody asks about my goats.', 'You asked about my goats!'] },
      { if: 'stage>=c_said', say: ['Eleven goats.', 'Eleven goats.'], re: [
        { t: ['Only eleven?', 'Only eleven?'], then: ['said tess_count'], say: [['v_tess', 'Eleven is plenty.']] },
        { t: ['Lovely goats.', 'Lovely goats.'], say: [['v_tess', 'They are, a bit.']] },
      ] },
      { idle: ['Still eleven.', 'Still eleven.'] },
    ],
  },
})
