// Act III, The Long Winter: the act file (owner A3b). Mysteries, endings, the end card, old-save help. Data only.
// Chapters: f_snow, f_pass, f_hearth, f_maze, f_kindle, f_thaw (A3a); f_sky, f_gap, f_deep, f_dreadgate, f_dread,
// f_glaciar (A3b). Side quests, people's talk, what_knights and the Crown wake place: A3S.
// No trust track this act: Glaciar's freedom is earned in the fight (all four chains melted), and the deduction every
// player makes (snow_mother) lights the chains up so the free ending is easy to find, and opens her "stay" choice.
act({
  id: 3, name: 'The Long Winter', map: 2,

  mystery: {
    // the main mystery: who is making the Long Winter? A kid follows it from the frozen north (who saw what did it?) to
    // a dragon breathing cold in her sleep on the mountain, works out how to get up there, and at the top works out
    // who she really is: not "the Mother" the moths whisper about, but the Snow Mother of Hearthold's song, Ember's
    // Auntie Glee (and Ash's). The two mothers are the act's big red herring.
    long_winter: { main: true,
      title: ['Who is making the Long Winter?', 'Who made the Long Winter?'],
      deduce: ['where_blaze', 'who_saw', 'what_storm', 'how_open', 'snow_mother'],
      herring: ['f3_steamwell', 'f3_bo_points', 'f3_brann_bet', 'f3_lock_sweats', 'f3_the_mother'],
      solved: ['Not a monster. A sleepy ice dragon under a moth\'s spell: Glaciar, the Snow Mother, Auntie Glee.', 'It was Auntie Glee, under a moth spell.'] },
    // small (A3a, f_pass): what cracked the High Pass open after a hundred years? (the white moth flew north through it)
    // v11: no longer asked (Act II already told the player). It is solved by f_pass's first step and, for old saves,
    // by the migrate below, so the Case Book shows it closed.
    who_cracked: {
      title: ['What cracked open the High Pass after a hundred years?', 'What cracked the High Pass?'],
      deduce: ['who_cracked'],
      herring: ['f3_elka_note'] },
    // small (A3S, chapters 2 to 5): the lost patrol, frozen into moth-frost armor; Blaze sets them free
    what_knights: {
      title: ['What are the Rime Knights?', 'What are the Rime Knights?'],
      deduce: ['what_knights'],
      herring: ['f3_golem_rumor'],
      solved: ['Hearthold\'s lost patrol, frozen into moth-frost armor. Blaze sets them free.', 'The lost patrol. Blaze frees them.'] },
  },

  // decided when Glaciar falls on the Crown (x2_foes sets G.choices.f_glaciar: free when all four chains were melted,
  // else defeat); shown in her outro and in the night in Hearthold (f_glaciar.js). Singing the Snow Mother's Song to
  // the sleeping dragon (q_f_song, or later the Crown wake place) turns defeat into free.
  ending: {
    free:   { at: 'f_glaciar', scene: 'f3_night', choice: 'f_glaciar=free', if: 'choice f_glaciar=free' },
    defeat: { at: 'f_glaciar', scene: 'f3_night', choice: 'f_glaciar=defeat', else: true },
  },

  // the end card (f_glaciar's `end_act 3` effect calls endAct(3, this); endAct sets act3_done and f_done)
  end_act: {
    title: ['Act III: The Long Winter', 'Act III: The Long Winter'],
    lines: [
      ['Shard 2 of 3, the Frost Shard. The last one went east, where the moon\'s light fell.', 'You have 2 of 3 Shards. The last one is east.'],
      ['The Long Winter is over. But the moon has another bite out of it.', 'The Long Winter is over. The moon has another bite gone.'],
    ] },

  // old saves (no G.story yet) that are already past a chapter never found its clues: give them, and count the
  // deductions they skipped as solved, so the Case Book questions later in the act can still be answered. (Read by the
  // engine once at load when it supports act migrate; A2B asked for it in CHANGES.md.)
  // (A3a's three lines are A3a's own list, from CHANGES.md)
  migrate: [
    // (v11 J5) who_cracked is solved for every save past the pass. In Act III Ulf's note still comes; a save already in a
    // later act gets it marked read first, so Pebble does not bring an Act III letter in Act IV or V.
    { if: 'stage>=f_hearth act 3', then: ['solve who_cracked'] },
    { if: 'act>=4', then: ['set f3_ulf_letter', 'solve who_cracked'] },
    { if: 'stage>=f_maze', then: ['clue f3_moth_flew', 'clue f3_blue_ash', 'clue f3_lintel', 'clue f3_forge_map', 'solve where_blaze'] },
    { if: 'stage>=f_kindle', then: ['clue f3_cold_parts'] },
    { if: 'stage>=f_sky', then: ['clue f3_looking_up', 'clue f3_alarm_rope', 'clue f3_yarn', 'clue f3_chapel', 'clue f3_spyglass', 'solve who_saw', 'solve what_storm',
                                  { if: '!item f3_scarf', then: ['give f3_scarf'] }] },
    { if: 'stage>=f_gap', then: ['clue f3_climbers'] },
    { if: 'stage>=f_dread', then: ['clue f3_gate_carving', 'clue f3_drum_seen', 'solve how_open', 'clue f3_the_mother', 'clue f3_hush_friend'] },
  ],

  gates_min: 5,
})
