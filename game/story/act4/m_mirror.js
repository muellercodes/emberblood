// Act IV, chapter 4 (part 2): Mirrors, the Mirror Temple (owner A4b). Data only.
// What the player does: the Mirror Temple dungeon stays code (x3_dun_b): Ember's moonfire (and, in the shrine, words
// in the glass: A BROKEN FLAME CANNOT BURN BLACK. A WHOLE ONE CAN.), Pip's Lantern, Lord Fanfare (his outro is short
// now and carries the herring: "She told me she collects shiny things!"). v11: the shrine is Ember's one appearance in
// Act IV. She made moonfire "for someone I loved. In case she ever got lost in the dark." (v12: not "my little moth":
// the Mother is tied to Ember's moth only in Act V.) Out on the temple steps every
// mirror goes dark and Nyxara's voice says: mend it, then give it to me. Then Ash works out why she wants all three
// Shards: a whole Heart can burn black, and it has to be given to her (why_three). The Shards are getting colder.
// The dungeon's own story keys (m_mirror_shrine, m_mirror_won_v, m_mirror_end) are data scenes with the old STORY
// key, so x3_dun_b plays the data text in place. Old flags kept: m_mirror_done (from trial_m_mirror_done), m_pip_lamp.
chapter({
  id: 'm_mirror', act: 4, after: 'm_glasswall', next: 'm_moonpath', takeover: true,
  card: null, name: ['Mirrors', 'Mirrors'],
  so_far: [
    "Nyxara drank the Moon Well and asked for all three Shards. Ash dug under the Glasswall to the Mirror Temple, where Ember hid her moonfire.",
    'Nyxara drank the Moon Well. Ash dug under the wall to the Mirror Temple.'],
  mom: [['Mirrors? Wave at yourself for me.', 'Mirrors? Wave at yourself for me.']],

  place: {
    // the temple steps outside the door (12300,68446); the warp ring out of the temple puts Ash here
    m4_temple_out: { map: 3, at: [12300, 68540], r: 260, kind: 'spot', name: ['the Mirror Temple steps', 'the temple steps'] },
    // the temple's mirrors gone dark with white eyes in them, while Nyxara's voice speaks (drawn on its face)
    m4_temple_eyes: { map: 3, at: [12300, 68430], kind: 'prop', look: 'm4_mirror_eyes', if: 'flag m4_eyes_on',
                      name: ['the dark mirrors', 'the dark mirrors'] },
  },

  // these replace x3_story's old copies of the boss words (x3_foes plays STORY.bosses[type]): the words now live only
  // in the data scenes below (in place of STORY.m_mirror_won_v), so they play once
  replaces: { 'STORY.bosses.m_fanfare.outro': 'm4_quiet' },

  clue: {
    m4_black_flame:   { icon: 'fire', mystery: 'm4_night_mother',
                        text: ['In the Mirror Temple, behind Ember\'s moon flame, words cut into the glass: "A BROKEN FLAME CANNOT BURN BLACK. A WHOLE ONE CAN."', 'Words in the glass: a broken flame cannot burn black. A whole one can.'] },
    m4_fanfare_shiny: { icon: 'mask', mystery: 'm4_night_mother', herring: true,
                        text: ['Lord Fanfare says the voice in the mirrors told him she collects shiny things. Just like him.', 'Fanfare says she collects shiny things.'] },
    m4_mirror_voice:  { icon: 'eye', mystery: 'm4_night_mother',
                        text: ['The voice in the temple mirrors: "Mend it. Then give it to me. You will want to, at the end."', 'The voice: "Mend it. Then give it to me."'] },
  },

  deduce: {
    why_three: {
      mystery: 'm4_night_mother',
      ask: ['Why does she want you to bring her all three Shards?', 'Why does she want all three?'],
      // m4_she_asks: A4a's eclipse 1 ("She could squash you flat. She doesn't. She ASKS for the Shards.")
      needs: ['m4_she_asks', 'm4_cracked_lamp', 'm4_black_flame'],
      // m4_ring_trails: A4S's Moon Ring gate (map 1)
      bonus: ['m4_bring_three', 'm4_mirror_voice', 'm4_ring_trails'],
      pick: [
        { t: ['To give the Heart back to us', 'To give it back'],
          hint: ['Then why keep Hush on a leash, and why ask so sweetly? Look at the lamp on Esme\'s bench.', "Then why is Hush on a leash?"] },
        { t: ['She collects shiny things', 'She collects shiny things'],
          hint: ['Fanfare thinks everything is about shiny things. Why would she need all three, and why must you be the one to bring them?', 'Why must you bring all three?'] },
        { t: ['She needs it whole, so it can burn black, and she needs me to give it to her', 'Whole, and given to her. Then it burns black.'], right: true },
      ],
      then: ['set m4_why_three'],
    },
  },

  step: [
    // the dungeon stays code (x3_dun_b); Fanfare's outro (m_mirror_won_v, at most 6 lines: it comes right after the
    // boss) is played by the old fight's own hook (x3_foes plays STORY.m_mirror_won_v, this chapter's scene in place).
    // No `kneel` here: the engine would play it a second time.
    { id: 'temple', do: 'dungeon m_mirror', at: 'm_mirror_door',
      obj: ["Find Ember's last flame in the Mirror Temple", "Find Ember's flame in the temple"],
      hint: ['Mirrors, beams and moon-glass. When in doubt, turn a mirror. When in more doubt, turn another one.', 'Mirrors and beams. When in doubt, turn a mirror.'],
      // (the shrine's words give m4_black_flame; a run that missed them, or a save from before v10, gets it here)
      then: ['set m_mirror_done', 'clue m4_black_flame',
             // Pip's Lantern plays inside the temple (room g); a run that somehow left without it gets it here
             { if: 'flag pip !flag m_pip_lamp', then: ['set m_pip_lamp', { banner: ["Pip's Lantern!", "Pip's Lantern!"], sub: ['Pip glows in the dark now. He shows painted moth eyes and the hidden paths they guard.', 'Pip glows! He shows secret paths.'] }] }] },
    { id: 'voice', do: 'goto m4_temple_out 260', scene: 'm_mirror_voice',
      obj: ['Go back out through the warp ring', 'Go back outside'],
      hint: ['Step into the warp ring by Ember\'s flame to go back outside.', 'Use the warp ring to go outside.'] },
    { id: 'why', do: 'deduce why_three', scene: 'm4_why_solved',
      obj: ['Why does she want all three Shards? Work it out in the Case Book', 'Open the Case Book'],
      hint: ['She asked you nicely on the beach. Esme mends cracked lamps whole. And the words behind Ember\'s flame. Open the Case Book.', 'Open the Case Book.'],
      then: ['stage m_moonpath'] },
  ],

  scene: {
    // ---- the temple's own story keys (each replaces the old STORY[key] in place; x3_dun_b and x3_foes play them)
    // v11: Ember's one appearance in Act IV, and her confession (the Act I "favorite flame" line stays in Act I only)
    m_mirror_shrine: [
      ['ember', 'Hello, little ember. You found the last one. I made this one here, with the moon-priests: my fire, mixed with moonlight.',
        'Hello, little ember. This is my last flame. My fire, mixed with moonlight.'],
      ['ash', "What's it for?", "What's it for?"],
      // (v12) "someone I loved", not "my little moth": nobody in Act IV ties the Mother to Ember's moth (Act V, ring 1)
      ['ember', 'For someone I loved. In case she ever got lost in the dark.', 'For someone I loved. In case she got lost.'],
      ['ash', 'Who?', 'Who?'],
      ['ember', 'Take it, Ash. And if you ever meet her, be gentler than I was.', 'Take it. If you meet her, be gentler than me.'],
      ['narr', 'Behind the flame, words are cut deep into the glass: A BROKEN FLAME CANNOT BURN BLACK. A WHOLE ONE CAN.', 'Words in the glass: A BROKEN FLAME CANNOT BURN BLACK. A WHOLE ONE CAN.', { clue: 'm4_black_flame' }],
      ['ash', "Burn black? Fire isn't black.", "Burn black? Fire isn't black."],
    ],
    // Fanfare's outro, right after the boss: at most 6 lines (the voice in the mirrors moved outside)
    m_mirror_won_v: [
      ['narr', "The last violet eye on Lord Fanfare's tail goes out. One by one, his feathers turn back to green and gold.", 'The last purple eye goes out. His feathers turn green and gold again.'],
      ['m_fanfare', 'Oh dear. Was I horrid? Something cold got into the mirrors and whispered to me.', 'Oh dear. Was I horrid? Something cold whispered from the mirrors.', { mood: 'ashamed' }],
      ['ash', "You're still very shiny.", "You're still very shiny."],
      ['m_fanfare', "Thank you. You're quite shiny yourself. For a lizard.", "Thank you. You're shiny too. For a lizard."],
      ['ash', "I'm a dragon.", "I'm a dragon."],
      ['m_fanfare', 'Even better! She told me she collects shiny things, you know. Like me. I was meant to guard Ember\'s flame for her family. Not from them.',
                    'She said she collects shiny things, like me! I was meant to guard the flame for you.', { mood: 'sad', clue: 'm4_fanfare_shiny' }],
    ],
    // (v11: Iska, not Ember: Ember speaks once in Act IV, at the shrine)
    m_mirror_end: [
      ['iska', "That was the last of Ember's flames, Ash. The Moonpath starts at the foot of the Heights, north of here.",
                "That was Ember's last flame. The Moonpath is north of here.", { dir: ['m_mirror_door', 'm4_mp_foot', 'north'] }],
      ['narr', 'Step into the warp ring to go back outside.', 'Step in the warp ring to go outside.'],
    ],
    // outside, on the temple steps (audit: the voice was glued onto the boss outro): at most 6 lines a branch
    m_mirror_voice: [
      { cam: 'm_mirror_door', s: 1 },
      ['narr', "Behind you, every mirror on the temple's face goes dark at once. In each one, a pair of white eyes opens.", 'Every mirror on the temple goes dark. White eyes open in them.', { do: ['set m4_eyes_on'] }],
      ['nyxara', "Moonfire. Oh, little ember. Lumen's priests burned me with that, long ago. It hurt very much.", 'Moonfire. The priests burned me with it once.'],
      ['nyxara', 'Mend it, little ember. Then give it to me. You will want to, at the end.', 'Mend it. Then give it to me. You will want to.', { clue: 'm4_mirror_voice' }],
      ['ash', "I won't.", "I won't."],
      ['nyxara', 'Everyone does.', 'Everyone does.'],
      // (a save made before v10 never heard the first eclipse's deal: Ash remembers it here)
      { if: '!clue m4_she_asks', then: [
        ['ash', 'On the beach she could have squashed me flat. She asked me for the Shards instead. Why ask?', 'On the beach she asked me for the Shards. Why ask?', { clue: 'm4_she_asks' }] ],
        else: [
        ['narr', 'The eyes close. In one mirror you see yourself, sandy and a bit worried. You smooth your hair down anyway.', 'The eyes close. You fix your hair anyway.', { do: ['set m4_eyes_on=0'] }] ] },
      { do: ['set m4_eyes_on=0'] },
      // (a save from before v10 never saw Esme's workbench in Sable: Iska knows her saying)
      { if: '!clue m4_cracked_lamp', then: [
        ['iska', 'Sable\'s lamplighters have a saying: "Cracked lamps can\'t hold a flame. Mend it whole first."', 'Sable\'s lamplighters say: "Cracked lamps can\'t hold a flame."', { clue: 'm4_cracked_lamp' }] ] },
    ],
    // v11: the dilemma, not the answer: mend it and she wants it; leave it broken and it goes cold (Act III's cold
    // Shard). Mom settles it at the Eclipse Lens (m_reforge)
    m4_why_solved: [
      ['ash', "She needs it whole, and she can't just take it. Somebody has to give it to her.", 'She needs it whole. And somebody has to give it to her.'],
      ['ash', 'So maybe I just never mend it.', 'So maybe I never mend it.'],
      ['narr', 'The Shards in your satchel are colder than they were yesterday. Colder than this morning.', 'The Shards in your satchel feel colder than yesterday.'],
    ],
    // an empty scene: the old copies of the boss words are replaced by it (see replaces)
    m4_quiet: [],
  },
})
