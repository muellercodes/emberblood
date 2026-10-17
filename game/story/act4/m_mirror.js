// Act IV, chapter 4 (part 2): Mirrors, the Mirror Temple (owner A4b). Data only.
// What the player does: the Mirror Temple dungeon stays code (x3_dun_b): Ember's moonfire (and, in the shrine, words
// in the glass: A BROKEN FLAME CANNOT BURN BLACK. A WHOLE ONE CAN.), Pip's Lantern, Lord Fanfare (his outro is short
// now and carries the herring: "She told me she collects shiny things!"). Out on the temple steps every mirror on the
// temple's face goes dark and Nyxara's voice says the brighter the flame, the darker it burns. Then Ash works out why
// she wants all three Shards: only a WHOLE Heart can burn black, and only his fire can mend it (why_three).
// The dungeon's own story keys (m_mirror_shrine, m_mirror_won_v, m_mirror_end) are data scenes with the old STORY
// key, so x3_dun_b plays the data text in place. Old flags kept: m_mirror_done (from trial_m_mirror_done), m_pip_lamp.
chapter({
  id: 'm_mirror', act: 4, after: 'm_glasswall', next: 'm_moonpath', takeover: true,
  card: null, name: ['Mirrors', 'Mirrors'],
  so_far: [
    "The Mirror Temple keeps Ember's moonfire, and a peacock who thinks he is the most beautiful thing in the world.",
    "The Mirror Temple keeps Ember's moonfire. And a very vain peacock."],
  mom: [['Mirrors? Wave at yourself for me.', 'Mirrors? Wave at yourself for me.']],

  place: {
    // the temple steps outside the door (12300,68446); the warp ring out of the temple puts Ash here
    m4_temple_out: { map: 3, at: [12300, 68540], r: 260, kind: 'spot', name: ['the Mirror Temple steps', 'the temple steps'] },
  },

  // these replace x3_story's old copies of the boss words (x3_foes plays STORY.bosses[type]): the words now live only
  // in the data scenes below (in place of STORY.m_mirror_won_v), so they play once
  replaces: { 'STORY.bosses.m_fanfare.outro': 'm4_quiet' },

  clue: {
    m4_black_flame:   { icon: 'fire', mystery: 'night_mother',
                        text: ['In the Mirror Temple, behind Ember\'s moon flame, words cut into the glass: "A BROKEN FLAME CANNOT BURN BLACK. A WHOLE ONE CAN."', 'Words in the glass: a broken flame cannot burn black. A whole one can.'] },
    m4_fanfare_shiny: { icon: 'mask', mystery: 'night_mother', herring: true,
                        text: ['Lord Fanfare says the voice in the mirrors told him she collects shiny things. Just like him.', 'Fanfare says she collects shiny things.'] },
    m4_mirror_voice:  { icon: 'eye', mystery: 'night_mother',
                        text: ['The voice in the temple mirrors: "The brighter the flame, the darker it burns, at the very end."', 'The voice: "The brighter the flame, the darker it burns."'] },
  },

  deduce: {
    why_three: {
      mystery: 'night_mother',
      ask: ['Why does she want you to bring her ALL THREE Shards?', 'Why does she want all three?'],
      // m4_she_asks: A4a's eclipse 1 ("She could squash you flat. She doesn't. She ASKS for the Shards.")
      needs: ['m4_she_asks', 'm4_cracked_lamp', 'm4_black_flame'],
      // m4_ring_trails: A4S's Moon Ring gate (map 1)
      bonus: ['m4_bring_three', 'm4_mirror_voice', 'm4_ring_trails'],
      pick: [
        { t: ['To give the Heart back to us', 'To give it back'],
          hint: ['Then why keep Hush on a leash, and why ask so sweetly? Look at the lamp on Esme\'s bench.', "Then why is Hush on a leash?"] },
        { t: ['She collects shiny things', 'She collects shiny things'],
          hint: ['Fanfare thinks everything is about shiny things. Why would she need all THREE, and why must YOU bring them?', 'Why must YOU bring all three?'] },
        { t: ['She needs it WHOLE, so it can burn black, and only my fire can mend it', 'A whole Heart can burn black'], right: true },
      ],
      then: ['set m4_why_three'],
    },
  },

  step: [
    // the dungeon stays code (x3_dun_b); Fanfare's outro (m_mirror_won_v) is played by the old fight's own hook:
    // `kneel` names it for the checker (after a boss: at most 6 lines), the engine does not play it
    { id: 'temple', do: 'dungeon m_mirror', at: 'm_mirror_door', kneel: 'm_mirror_won_v',
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
    m_mirror_shrine: [
      ['ember', 'Little ember. This is my favorite flame. I made it with the moon-priests, long ago, when Lumen was dry and full of lamps.', 'Little ember. This is my favorite flame. I made it with the moon-priests.'],
      ['ember', "We mixed my fire with moonlight, in case a shadow ever came for the moon. It burns cool and silver. Shadows can't stand it.", 'We mixed my fire with moonlight. It burns cool and silver. Shadows hate it.'],
      ['narr', 'Behind the flame, words are cut deep into the glass: A BROKEN FLAME CANNOT BURN BLACK. A WHOLE ONE CAN.', 'Words in the glass: A BROKEN FLAME CANNOT BURN BLACK. A WHOLE ONE CAN.', { clue: 'm4_black_flame' }],
      ['ash', "...Burn BLACK? Fire isn't black.", "Burn black? Fire isn't black."],
    ],
    // Fanfare's outro, right after the boss: at most 6 lines (the voice in the mirrors moved outside)
    m_mirror_won_v: [
      ['narr', "The last violet eye on Lord Fanfare's tail goes out. One by one, his feathers turn back to green and gold.", 'The last purple eye goes out. His feathers turn green and gold again.'],
      ['m_fanfare', '...Oh. Oh dear. Was I horrid? Something cold got into the mirrors and whispered to me.', 'Oh dear. Was I horrid? Something cold whispered from the mirrors.'],
      ['ash', "You're still very shiny.", "You're still very shiny."],
      ['m_fanfare', "...Thank you. You're quite shiny yourself. For a lizard.", "Thank you. You're shiny too. For a lizard."],
      ['ash', "I'm a DRAGON.", "I'm a DRAGON."],
      ['m_fanfare', 'Even better! She told me she collects shiny things, you know. Like me. I was meant to guard Ember\'s flame FOR her family. Not FROM them.',
                    'She said she collects shiny things, like me! I was meant to guard the flame FOR you.', { clue: 'm4_fanfare_shiny' }],
    ],
    m_mirror_end: [
      ['ember', "That's all of my flames, little ember. Every one I ever hid. You've carried them further than I ever went.", "That's all my flames, little ember. You carried them further than I ever went."],
      ['ember', 'The Moonpath starts at the foot of the Heights, north of here. Light it up. And Ash? When you see her... she was alone for a very long time. It might help to know that.',
                'The Moonpath is north of here, at the foot of the Heights. Light it up. And Ash? She was alone a long time.', { dir: ['m_mirror_door', 'm4_mp_foot', 'north'] }],
      ['narr', 'Step into the warp ring to go back outside.', 'Step in the warp ring to go outside.'],
    ],
    // outside, on the temple steps (audit: the voice was glued onto the boss outro): at most 6 lines a branch
    m_mirror_voice: [
      { cam: 'm_mirror_door', s: 1 },
      ['narr', "Behind you, every mirror on the temple's face goes dark at once. In each one, a pair of white eyes opens.", 'Every mirror on the temple goes dark. White eyes open in them.'],
      ['nyxara', "Moonfire. Oh, little ember. You found Ember's moonfire. Her priests burned me with it, long ago. It hurt very much.", 'You found moonfire. Her priests burned me with it once.'],
      ['nyxara', 'Shine as bright as you like. The brighter the flame, the darker it burns, at the very end.', 'Shine bright. The brighter the flame, the darker it burns, at the end.', { clue: 'm4_mirror_voice' }],
      ['ash', "That doesn't even make sense!", "That doesn't make sense!"],
      ['nyxara', 'It will.', 'It will.'],
      // (a save made before v10 never heard the first eclipse's deal: Ash remembers it here)
      { if: '!clue m4_she_asks', then: [
        ['ash', 'On the beach she could have squashed me flat. She ASKED me for the Shards instead. Why ask?', 'On the beach she ASKED me for the Shards. Why ask?', { clue: 'm4_she_asks' }] ],
        else: [
        ['narr', 'The eyes close. One mirror shows you, looking a bit worried. You fix your hair. It helps.', 'The eyes close. You fix your hair. It helps.'] ] },
      // (a save from before v10 never saw Esme's workbench in Sable: Iska knows her saying)
      { if: '!clue m4_cracked_lamp', then: [
        ['iska', 'Esme in Sable says it every day: "Cracked lamps can\'t hold a flame. Mend it whole first."', 'Esme says: "Cracked lamps can\'t hold a flame."', { clue: 'm4_cracked_lamp' }] ] },
    ],
    m4_why_solved: [
      ['ash', "A cracked lamp can't hold a flame. A broken Heart can't burn black. She needs it WHOLE, and only my fire can mend it.", 'A broken Heart cannot burn black. She needs it whole. Only my fire can mend it.'],
      ['iska', 'Then mend it, little ember. And keep it. A whole heart is a warm thing, if you hold it right.', 'Then mend it. And keep it warm.'],
    ],
    // an empty scene: the old copies of the boss words are replaced by it (see replaces)
    m4_quiet: [],
  },
})
