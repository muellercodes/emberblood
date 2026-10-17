// Act IV, chapter 5 (part 2): The Eclipse Observatory (owner A4b). Data only.
// What the player does: the Observatory stays code (x3_dun_b; its own m_obs_in plays as Ash walks in, with the bite
// that leaves the moon at 20). Duke Umberwing eats lamps on floor 2; if Ash has worked out who steals the lamps of
// Moonfall (lamp_thief, an optional small mystery whose deduction lives here), the Duke's outro says so and he gives
// the lot back. Hush waits under the dome on her silver leash (her intro, at most 10 lines with both allies). After
// the fight she sinks down, the Shard rolls to Ash, and both options always show: melt the knots with gentle Moonfire
// (free) or take the Shard and go (foe). At most 6 lines a branch, played by the old fight's own hook (x3_foes ->
// x3_story m3sHushDown plays STORY.m_hush_out, which is this chapter's data scene in place); m3sHushAfter then gives
// Shard 3, the XP, a blessing, and moves the story to m_reforge.
// Old flags and choices kept: G.choices.m_hush ('free' | 'foe'; x4_story, x4_foes, e7b_threads read it), m_hush_done,
// m_leash_known (also set by the free pick, for the finale's errand B2), m_umber_done, G.choices.extra.m_hush.
chapter({
  id: 'm_observatory', act: 4, after: 'm_moonpath', next: 'm_reforge', takeover: true,
  card: null, name: ['The Eclipse Observatory', 'The Eclipse Observatory'],
  so_far: [
    'Hush is back, big and cold, on a silver leash. She guards the last Shard in the Eclipse Observatory. Ash knows how to set her free.',
    'Hush guards the last Shard. Ash knows how to free her.'],

  // the old copies of the boss words (x3_foes plays STORY.bosses[type]) are emptied, so the data scenes below (in
  // place of STORY.m_hush_intro and STORY.m_umber_won) are the only words that play, once each
  replaces: { 'STORY.bosses.m_hushboss.intro': 'm4_hush_quiet', 'STORY.bosses.m_umberwing.outro': 'm4_umber_quiet' },

  // the Moon Shard (its old name, e7b_threads; the reforge takes it)
  item: {
    m_shard3: { name: ['The Moon Shard (silver, cold until you hold it)', 'The Moon Shard'],
                desc: ['The third piece of the Ember Heart, from Hush. Cold, then warm in your claws.', 'The third piece of the Heart.'], icon: 'shard' },
  },

  clue: {
    m4_museum: { icon: 'lamp', mystery: 'lamp_thief',
                 text: ["The Duke's Lamp Museum, up in the Observatory: hundreds of stolen lamps, each with a neat little label.", 'A museum of stolen lamps, all with labels.'] },
  },

  deduce: {
    // optional: whenever its clues are found (chapters 1 to 5). m4_chewed_lamp: A4a's Driftwood lantern; m4_esme_glass:
    // A4S's Esme after the second eclipse; herrings m4_octavia_hoard (A4a, Octavia) and m4_jinx_lamps (A4S, Jinx)
    lamp_thief: {
      mystery: 'lamp_thief',
      ask: ['Who is stealing the lamps of Moonfall?', 'Who steals the lamps?'],
      needs: ['m4_chewed_lamp', 'm4_esme_glass', 'm4_stolen_label'],
      bonus: ['m4_museum'],
      pick: [
        { t: ['Madame Octavia', 'Madame Octavia'],
          hint: ["She never leaves the bottom of the sea, and Driftwood's lantern was bitten above the water.", 'She never leaves the sea floor.'] },
        { t: ['Jinx the Mirage Merchant', 'Jinx'],
          hint: ["Jinx's lamps are mirages. Real thieves don't sell air.", "Jinx's lamps are not real."] },
        { t: ['Moths. Big ones, with fuzzy teeth', 'Big moths with fuzzy teeth'], right: true },
      ],
      then: ['set m4_lamp_thief', 'world m4_chewed_lamp fixed', 'epi m4_epi_sorry'],
    },
  },

  step: [
    // the Observatory and its fights stay code (x3_dun_b, x3_foes). Hush's outro and the choice (m_hush_out, at most
    // 6 lines a branch: it comes right after the boss) are played by the fight's own hook (x3_story m3sHushDown).
    // No `kneel` here: the engine would play it a second time.
    { id: 'climb', do: 'fight m_hushboss', at: 'm_obs_door',
      obj: ['Climb the Observatory to the Dome Gallery', 'Climb up to the dome'],
      hint: ['Sun, Moon, Eclipse: turn the dial and the room changes. Light a lamp if a moth gets in your way. Moths always look.', 'Turn the dial to change the room. Moths stare at lamps.'],
      // (the old m_reforge stage set these when it started: Dell's boat is in at the Moon Pier, Mom is on her way up)
      then: ['set m_dell_away=0', 'set m_dell_pier', 'set m_dell_left', { if: 'flag m_eclipse2', then: ['set m_pb_3'] }, 'stage m_reforge'],
      // the small lamp_thief mystery can be solved in the Case Book any time its three clues are found; this part
      // only tells the story (and the checker) that it belongs here, before the Duke on floor 2
      extra: [{ do: 'deduce lamp_thief' }] },
  ],

  scene: {
    // ---- the Observatory's own story keys (each replaces the old STORY[key] in place)
    m_obs_museum: [
      ['narr', "The Duke's Lamp Museum. Hundreds of stolen lamps on shelves, each with a neat little label.", "The Duke's Lamp Museum. Hundreds of stolen lamps, all with labels.", { clue: 'm4_museum' }],
      ['narr', "GRANDMA'S READING LAMP, EATEN YEAR 412. A VERY NICE LANTERN (BORROWED).", "GRANDMA'S READING LAMP. A VERY NICE LANTERN (BORROWED)."],
      { if: 'choice fennick', then: [['narr', "One label says: WICK'S FINEST LAMP, EMBERHOLLOW.", "One says: WICK'S FINEST LAMP, EMBERHOLLOW."]] },
    ],
    // Duke Umberwing's outro (a miniboss): the lamp_thief payoff when it is solved first
    m_umber_won: [
      // (the key is real: the Duke's room drops the boss key, x3_dun_b loot bkey)
      ['m_umberwing', 'Oh, bother. Bested by a lizard. Here, the key, the key. Take it.', 'Oh, bother. Here, take the key.', { ref: 'm_obs_door' }],
      { if: 'solved lamp_thief', then: [
        ['ash', "You're the lamp thief! Bertha's spare, Driftwood's lantern, all of them!", "You're the lamp thief!"],
        ['m_umberwing', '...Bother. Take the lot. I shall post them back. With a note.', 'Bother. Take the lot. I will send them back.', { do: ['set m4_lamps_back'] }],
        ['narr', 'He flutters out of the window into the dark, looking very slightly ashamed.', 'He flutters out into the dark, a bit ashamed.'] ],
        else: [
        ['narr', 'He tucks one last lamp under his arm and climbs up onto the window sill.', 'He tucks a lamp under his arm and climbs onto the window.'],
        ['m_umberwing', "I'm keeping this one. It has sentimental value. I stole it on a Tuesday.", "I'm keeping this one. I stole it on a Tuesday."],
        ['narr', 'He flutters out into the dark.', 'He flutters out into the dark.'] ] },
      { do: ['set m_umber_done'] },
    ],
    // Hush's intro, before the fight: at most 10 lines with both allies (their two lines are one now)
    m_hush_intro: [
      ['narr', 'Under the great dome, on a floor of brass rings, a white moth as big as a barn sits very still. A silver thread runs from her neck down to two knots in the floor, then straight up through the open dome into the dark.',
               'Under the dome sits a white moth as big as a barn. A silver thread runs from her neck to two knots, then up into the dark.'],
      ['narr', 'Beside her, in a little brass cradle, something glows silver. The Moon Shard.', 'Beside her, something glows silver. The Moon Shard.'],
      ['f_hush', 'Shhh. You again. The loud one. ...I never did get a sweater.', 'Shhh. You again. I never got a sweater.'],
      ['ash', 'Hush. You came back.', 'Hush. You came back.'],
      ['f_hush', 'I flew to the Mother, small and cold. She made me big again. "Never small again," she said. Then she gave me this.', 'The Mother made me big again. Then she gave me this leash.'],
      ['narr', 'Far above, something tugs the leash, gently. Hush flinches.', 'Far above, something tugs the leash. Hush flinches.'],
      ['f_hush', "I'm to keep the Shard until you bring the other two. Then the Mother gets all three. They all fly up to the Mother, in the end. Shhh.", 'I keep it until you bring the others. Then the Mother gets all three. Shhh.'],
      { if: 'flag m_vesper_ally flag m_lamps_ally', then: [
        ['narr', 'Behind you, Vesper juggles a fire bomb, and Esme\'s lamplighters raise their poles. "Wicks lit!"', 'Vesper has fire bombs. The lamplighters light their lamps!'] ],
        else: [{ if: 'flag m_vesper_ally', then: [
          ['c_vesper', 'Hi, moth. Remember the Dreadgate? I brought more fire bombs.', 'Hi, moth. Remember me? I brought fire bombs.'] ],
          else: [{ if: 'flag m_lamps_ally', then: [
            ['m_esme', '(from the stairs) Lamplighters! Poles up! Wicks lit!', 'Lamplighters! Poles up! Wicks lit!'] ] }] }] },
      ['f_hush', 'Shhhhhhhhh.', 'Shhhhhhhhh.'],
    ],
    // right after the fight, played by x3_story's m3sHushDown (the leash and the knots are drawn under her): at most
    // 6 lines a branch. Both options always show (free_hush is solved on the main path; a save from before v10 that
    // never solved it still gets both, and the free pick sets m_leash_known for the finale).
    m_hush_out: [
      ['narr', 'Hush sinks down onto the brass floor and folds her wings. The Moon Shard rolls out of its cradle to your feet.', 'Hush sinks down. The Moon Shard rolls to your feet.', { do: [{ if: '!item m_shard3 !item m_heart', then: ['give m_shard3'] }, 'set m_hush_done'] }],
      ['f_hush', '...Take it. It was never mine. Nothing is ever mine.', 'Take it. It was never mine.'],
      { choose: 'm_hush', ask: ['The silver leash is still tied to her neck, pulling her up toward the dark. What do you do?', 'The leash still pulls her up. What do you do?'], pick: [
        { t: ['Melt the knots with gentle Moonfire', 'Melt the knots, gently'], tone: 'kind', v: 'free',
          then: ['set m_leash_known', { journal: ["You melted Hush's silver leash with the gentlest Moonfire, and she flew away free.", "You melted Hush's leash. She flew away free."], key: 'm_hush' }],
          say: [
            ['narr', "You breathe Moonfire on the first knot, as softly as you'd blow on hot soup. The silver thread melts like frost on a window. Then the second knot.", 'You breathe soft Moonfire on the knots, like blowing on soup. They melt.', { fx: ['hush', 'knots'] }],
            { if: 'item m4_sweater', then: [
              ['narr', 'Hush shrinks to her own size. You tug the sweater over her head. It is too small. She does not mind.', 'Hush shrinks. You put the sweater on her. It is too small. She does not mind.', { do: ['take m4_sweater', 'set m4_hush_sweater', 'epi m4_epi_sweater 6'], fx: ['hush', 'free'] }] ],
              else: [
              ['narr', 'Hush shrinks to her own size, stretches her wings, and floats up out of the dome, free and glowing faintly. She looks back, once.', 'Hush shrinks and floats away, free. She looks back once.', { fx: ['hush', 'free'] }] ] },
            ['f_hush', '...Shhh. Thank you. Quietly.', 'Thank you. Quietly.'] ] },
        { t: ['Take the Shard and go', 'Take the Shard and go'], tone: 'brave', v: 'foe',
          then: [{ journal: ['You took the Moon Shard and left Hush on her leash. The Mother pulled her home.', 'You left Hush on her leash. The Mother took her home.'], key: 'm_hush' }],
          say: [
            ['narr', 'You take the Shard. The leash tightens, and Hush crumbles into a hundred little white moths that flutter up the silver thread to their Mother.', 'You take the Shard. Hush turns into little moths and flies to the Mother.', { fx: ['hush', 'foe'] }],
            ['iska', "She'll remember this, Ash. Moths always remember.", 'She will remember this. Moths always remember.'] ] },
      ] },
    ],
    // Iska once the fight is over (x3_story's m3sHushAfter plays it): the Lens is through the next door, beside the
    // dome, on the same floor (audit 11)
    m_obs_won: [
      ['iska', 'Through the next door, Ash. The Eclipse Lens, beside the great dome. Somebody is coming. I can hear a hammer.', 'Through the next door to the Lens. I hear a hammer coming!'],
    ],
    m4_epi_sorry: [['narr', 'Every Lantern Day, a parcel arrives in Sable. It is always one lamp. It is always labelled SORRY.', 'Every Lantern Day, Sable gets a lamp in the post. It says SORRY.']],
    // empty: the old copies of the boss words are replaced by these (see replaces)
    m4_hush_quiet: [],
    m4_umber_quiet: [],
  },
})
