// game/story/act4/m_lumen.js (A4a): Act IV, Chapter 2, "Drowned Lumen".
// What the player does: walks the sandbars north (the shoals sign says so) to the deep channel under the Lumen Spire,
// swings up to its balcony with the Grapple Tail and finds the first where_shard clue there: silver moth dust and a
// scrape as long as a boat, from something huge that rested here facing east. Inside the Spire is drowned Old Lumen
// (the dungeon stays code; Ember's flame there gives Dive). Two of its rooms now hold clues, played by the dungeon's own
// beats through data scenes that replace the old STORY keys: the great window of the Drowned Library floor (the eye at
// the window, then Lumen's sky map with its three moon houses: m4_star_map) and the Drowned Library itself (a tile
// picture of a priest melting a moth's thread with soft silver fire, while a cut thread whips up into the sky, moth and
// all: m4_leash_mural, which A4b's free_hush needs in chapter 5). The 3F mosaic (MOON DOWN, SEA UP) is a bonus card.
chapter({
  id: 'm_lumen', act: 4, after: 'm_drift', next: 'm_coral', takeover: true,
  card: ['Act IV · Chapter 2', 'Drowned Lumen'],
  so_far: [
    "The tide went wobbly because the moon is getting smaller: the sea follows the moon. Old Lumen, the moon city, drowned long ago, the first time the moth bit the moon. Its tower still sticks out of the sea.",
    'The moon is smaller, so the tide is wobbly. Old Lumen drowned long ago. Its tower sticks out of the sea.'],
  hint: ['North across the Spire Shoals. Walk the sandbars, then swing up to the Spire\'s balcony and look around.',
    "Go north over the sandbars. Swing up to the tower's balcony."],

  place: {
    // the end of the sandbars, where the channel under the Spire is too deep to walk
    m4_channel: { map: 3, at: [3560, 62760], r: 240, kind: 'spot', name: ['the deep channel under the Lumen Spire', 'the deep channel'] },
    // on the balcony (level 1, reached with the Grapple Tail): dust on the rail and a long scrape on the marble
    m4_balcony_dust: { map: 3, at: [3782, 62440], r: 22, kind: 'examine', look: 'm4a_balcony_dust', h: 30, over: 'm_lm_balcony',
      if: 'stage>=m_lumen', say: 'lmn_dust_again',
      name: ['the dusty balcony rail', 'the dusty rail'] },
  },

  clue: {
    m4_spire_dust: { icon: 'dust', mystery: 'night_mother',
      text: ["On the Lumen Spire's balcony: silver moth dust on the rail, and a scrape as long as a boat. Something huge rested here, facing east.",
        'Moth dust and a huge scrape on the Spire balcony. It faced east.'] },
    m4_star_map: { icon: 'star', mystery: 'night_mother',
      text: ["Etched on Lumen's great window, a sky map of three moon houses: the Spire by the sea, the Moon Well in the sand, and the Eclipse Observatory, far east on the Heights.",
        "Lumen's sky map: the Spire, the Moon Well, and the Observatory far east."] },
    m4_leash_mural: { icon: 'rope', mystery: 'night_mother',
      text: ["A tile picture in Lumen's library: a priest breathes soft silver fire on a moth's thread, and it melts. The moth flies off, small. Beside it, a cut thread whips up into the sky, moth and all.",
        'Soft silver fire melts a moth thread. A cut thread flies up to the sky, moth and all.'] },
    m4_mosaic: { icon: 'wave', mystery: 'wobbly_tide',
      text: ["Lumen's silver mosaic: THE MOON RISES, THE SEA FALLS. THE MOON FALLS, THE SEA RISES.", 'MOON UP, SEA DOWN. MOON DOWN, SEA UP.'] },
  },

  step: [
    { id: 'shoals', do: 'goto m4_channel', scene: 'lmn_channel',
      obj: ['Walk the sandbars north across the Spire Shoals to the Lumen Spire', 'Walk the sandbars to the white tower'],
      hint: ['The Spire Shoals start north of Driftwood. The sign says: walk the sandbars, and swing at the end.', 'Walk the sandbars north. Swing at the end.'] },
    { id: 'spire', do: 'all', obj: ["Find Ember's flame in drowned Old Lumen", "Find Ember's flame in Old Lumen"],
      hint: ["Swing up to the Spire's balcony with the Grapple Tail and look around. The way down into drowned Old Lumen is the door on the balcony.",
        'Swing up to the balcony. Look around. Then go in.'],
      parts: [
        { do: 'examine m4_balcony_dust', scene: 'lmn_dust', then: ['clue m4_spire_dust'] },
        { do: 'dungeon m_lumen' },
        // (the dungeon's own beats: x3_dun_a.js d3aBeat('window') in B1 room n, d3aBeat('library') in B1 room l)
        { do: 'wait_for event beat:window', then: ['clue m4_star_map'] },
        { do: 'wait_for event beat:library', then: ['clue m4_leash_mural'] },
      ],
      extra: [
        { do: 'wait_for event beat:mosaic', then: ['clue m4_mosaic'] },
      ],
      then: ['set m_lumen_done', 'stage m_coral'] },
  ],

  scene: {
    lmn_channel: [
      ['narr', 'The last sandbar ends in deep, dark water. Above you the white tower rises out of the sea, smooth as a candle.',
        'The sandbar ends in deep water. The white tower rises above you.'],
      ['iska', 'Deep water. Too deep to walk on. Is there anything up there you can swing to?', 'Too deep to walk. Is there something up there to swing to?'],
    ],
    lmn_dust: [
      ['narr', 'The balcony rail is thick with silver moth dust. Far too much for one little moth.', 'The rail is covered in silver moth dust. LOTS.'],
      ['narr', 'Across the marble floor runs a scrape as long as a boat. Something huge landed here to rest.', 'A scrape as long as a boat! Something huge rested here.'],
      ['narr', 'Its claw marks point out over the sea, toward the sunrise.', 'Its claw marks point toward the sunrise.', { ref: 'm4_spire_balcony' }],
      ['ash', 'Something BIG sat here. And then it flew off that way.', 'Something BIG sat here. Then it flew that way.'],
    ],
    // the rail again, once its clue is in the Case Book (before that, the step's scene plays)
    lmn_dust_again: [
      { if: 'clue m4_spire_dust', then: [
        ['narr', 'Silver moth dust on the rail, and the long scrape, pointing toward the sunrise.', 'Moth dust, and the long scrape.', { ref: 'm4_spire_balcony' }]] },
    ],
    // the old STORY keys the dungeon plays (m3sBeat 'window', 'library', 'mosaic'), replaced in place
    m_lumen_window: [
      ['narr', 'Through the great round window, something with a lot of arms drifts past. An eye the size of a door looks in at you, blinks, and leaves.',
        'Something with lots of arms drifts past. A huge eye looks in. It blinks. It leaves.'],
      ['ash', "...I didn't like that.", "I didn't like that."],
      ['narr', 'Where the eye was, lines are etched into the glass. A sky map! Three little moons are drawn on it, each with a name.',
        'Lines are etched on the glass. A sky map with three moons.'],
      ['narr', 'THE SPIRE, by the sea. THE MOON WELL, in the sand. And far to the east, up on the Heights: THE ECLIPSE OBSERVATORY.',
        'THE SPIRE. THE MOON WELL. And far east: THE ECLIPSE OBSERVATORY.', { clue: 'm4_star_map', dir: ['m4_lumen_spire', 'm4_observatory', 'east'] }],
      ['iska', 'Moon houses. Places that keep moonlight. If I were a moth with something shiny, I know where I would go.',
        'Moon houses keep moonlight. A moth would go there.'],
    ],
    m_lumen_library: [
      ['sedge', 'Finally! Somewhere wetter than me!'],
      ['narr', 'Pearl books on every shelf. And on the far wall, a tile picture, green with age.', 'Pearl books. And an old tile picture on the wall.'],
      ['narr', "A moon-priest breathes soft silver fire on a moth's silver thread. The thread melts. The moth flies off, small and free.",
        "A priest breathes soft silver fire on a moth's thread. It melts. The moth flies free."],
      ['narr', 'Beside it, a priest cuts a thread with a sword. The cut thread whips up into the sky, moth and all.',
        'Next to it, a cut thread whips up into the sky, moth and all.', { clue: 'm4_leash_mural' }],
      ['ash', 'Soft fire melts it. Cutting it sends the moth flying away. Got it. ...Why do I need to know this?',
        'Soft fire melts it. Cutting sends it away. Why do I need to know?'],
    ],
    m_lumen_mosaic: [
      ['narr', 'The three moon lamps flare. On the wall between them a silver mosaic lights up: a moon over a sea, and words in old letters.',
        'The lamps light up a silver picture: a moon over the sea, and old words.'],
      ['narr', 'THE MOON RISES, THE SEA FALLS. THE MOON FALLS, THE SEA RISES.', 'MOON UP, SEA DOWN. MOON DOWN, SEA UP.', { clue: 'm4_mosaic' }],
      ['iska', 'The whole city breathed with the moon. Up and down. Full and empty. Just like you told Winnie.', 'The city breathed with the moon. Like you told Winnie.'],
    ],
  },
})
