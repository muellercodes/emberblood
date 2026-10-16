// DEMO data (see _act.js). Stand-in text.
chapter({
  id: 'c_salt', act: 2, after: 'c_gear', next: 'c_claws',
  card: ['Act II · Chapter 3', 'The Girl from Saltmarsh'],
  so_far: ['A note that smells of the sea led Ash to Saltmarsh.', 'A note led Ash to Saltmarsh.'],
  place: {
    sm_gift_lantern: { map: 1, at: [2150, 26500], kind: 'examine', name: 'a gift lantern with a moth stamp' },
    sm_archive:      { map: 1, at: [7700, 24440], kind: 'examine', name: "Ottoline's family trees" },
    sm_tide_cog:     { map: 1, at: [2230, 26350], kind: 'examine', name: 'the Tide Clock cog' },
  },
  clue: {
    s_note_salt:   { icon: 'note',    text: ['The chase note smells of salt and fish.', 'The note smells of the sea.'] },
    s_gifts:       { icon: 'lantern', text: ['Saltmarsh windows have gift lanterns stamped with a moth.', 'Gift lanterns with a moth on them.'] },
    s_family:      { icon: 'book',    text: ['Pearl\'s family tree ends with "Oona Saltwhistle, and granddaughter Vesper".', 'The tree ends with Vesper.'] },
    s_baron_rumor: { icon: 'news',    herring: true, text: ['Lord Whirligig says a clock baron is robbing his rivals.', 'Whirligig blames a baron.'] },
    s_tide_dust:   { icon: 'clock',   mystery: 'what_stopped', text: ['The Tide Clock cog is packed with kelp and far too much moth dust.', 'Kelp and lots of moth dust.'] },
  },
  deduce: {
    who_is_she: {
      mystery: 'moth_mask',
      ask: ['Who is the Moth Mask?', 'Who is she?'],
      needs: ['s_note_salt', 's_gifts', 's_family'],
      pick: [
        { t: ['A Saltmarsh girl, Vesper Saltwhistle', 'Vesper Saltwhistle'], right: true },
        { t: ['A clock baron robbing rivals', 'A clock baron'], hint: ['Barons keep what they steal. Does she?', 'Does she keep things?'] },
        { t: 'Penny Press', hint: ['Penny was at the gate with you.', 'Penny was with you.'] },
      ],
      then: ['set c_who_is_she'],
    },
  },
  step: [
    { id: 'note', do: 'talk c_ottoline', scene: 'c_salt_note', then: ['clue s_note_salt'], obj: ['Ask the archivist about the note', 'Ask the archivist'] },
    { id: 'look', do: 'all', obj: ['Find out who the Moth Mask is', 'Find clues'],
      parts: [
        { do: 'examine sm_gift_lantern', then: ['clue s_gifts'] },
        { do: 'examine sm_archive', then: ['clue s_family'] },
      ],
      extra: [
        { do: 'talk c_whirligig', then: ['clue s_baron_rumor'] },
        { do: 'examine sm_tide_cog', then: ['clue s_tide_dust'] },
      ] },
    { id: 'deduce', do: 'deduce who_is_she', obj: ['Work it out in the Case Book', 'Open the Case Book'] },
    { id: 'tide', do: 'dungeon c_tidehouse', obj: ['Fix the Tide Clock', 'Fix the Tide Clock'], then: ['stage c_claws'] },
  ],
  scene: {
    c_salt_note: [
      ['c_ottoline', 'Salt and fish. This note was written by the sea.', 'This note smells of the sea.'],
      ['ash', 'Saltmarsh, then.'],
    ],
  },
})
