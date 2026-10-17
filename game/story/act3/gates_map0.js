// game/story/act3/gates_map0.js (A3S): Act III reasons to go back to Embermere (map 0).
// Four gates for Act III's powers, each with a payoff behind it, at the spots ACT3_V10.md 2.7 verified (open ground,
// reachable on foot). Three are a breakable piece with the payoff under it: the payoff place only exists once the
// piece is broken (`if: 'flag gate_<id>>=2'`, the gate library's saved "open for everyone" state), so nothing is there
// to reach without the power. The fourth is a wind ribbon up to a crater rim nobody can climb or fly to.
//   f3g_tove  ice_wall (Blaze)          Tove's Ward statue, Frostpine: the Tove stone (truth f3_tove_stone, Tove remembers)
//   f3g_eggs  wind_ribbon (Wind Riding) Cinder Mountain's crater floor to its rim: two old eggshells and a Heart Ember
//   f3g_iska  cracked_floor (Pound)     Iska's Ward stone, Emberhollow: Iska's copy of the eleventh page (f_page11)
//   f3g_bun   bomb_rock (Blast Bombs)   Bertram's giant frozen Lantern bun by his bakery door: a Heart Ember baked inside
// Pointers: Brynja and Tove (people.js, f3g_tove), Brother Eider (people.js, f3g_eggs and f3g_iska), Bertram's letter
// (q_f_bombs.js bm_bertram, f3g_bun).
places({
  id: 'a3s_gates0', act: 3, map: 0,

  item: {
    f3_eggshell: { name: ['Two old dragon eggshells', 'Two dragon eggshells'], icon: 'star', keepsake: true,
      desc: ['One red and scorched, one ice-blue and still cold. Two dragons hatched on the rim of the fire mountain, long ago.', 'One red shell. One cold blue shell.'] },
  },

  clue: {
    f3_tove_stone: { icon: 'note', mystery: 'long_winter',
      text: ["A stone from under the ice at Tove's statue: TOVE KEPT THE COLD POST. EMBER MADE THE FIRE. AUNTIE G MADE THE SNOW.",
        'TOVE KEPT WATCH. EMBER MADE FIRE. AUNTIE G MADE SNOW.'] },
    f3_iska_page: { icon: 'book', mystery: 'long_winter',
      text: ["Iska's copy of the Wardens' eleventh page: on the first Lantern Day, a little grey moth sat on Ember's lantern all night. Ember named her Nyx.",
        "A grey moth sat on Ember's lantern. Ember named her Nyx."] },
  },

  place: {
    // ---- G1. Tove's stone (Blaze). A block of old moth-frost at the foot of Tove's Ward statue (st_tove 3000,3400).
    f3g_tove: { kind: 'gate', gate: 'ice_wall', map: 0, at: [3000, 3480], wall: false, w: 76, r: 60, leads: 'f3_tove_stone',
      payoff: { kind: 'truth', id: 'f3_tove_stone' },
      name: ["the ice at Tove's statue", 'the ice block'],
      locked: ["A block of old purple ice at the foot of Tove's statue. Something flat and carved is frozen deep inside. Your fire only makes it sweat.",
        'Something is frozen in the ice. It needs hotter fire.'] },
    f3_tove_stone: { kind: 'examine', map: 0, at: [3000, 3482], r: 26, h: 30, if: 'flag gate_f3g_tove>=2', look: 'tove_stone_ice', say: 'a3g_tove',
      then: ['clue f3_tove_stone', 'set f3_tove_seen', 'xp 300'], name: ['a carved stone', 'a carved stone'] },

    // ---- G2. The eggshells (Wind Riding). Warm wind from the crater floor (level 7, where Act I's last vent lands Ash)
    // up to the south-west rim (level 8: no ramp, no climb, inside Cinder Mountain's no-fly zone).
    // (build.ledge: the rim's crater-side face hops Ash back down to the crater floor, one way only)
    f3g_eggs: { kind: 'gate', gate: 'wind_ribbon', map: 0, at: [6750, 1150], to: [6528, 1309], lv: [7, 8], wall: false, r: 60, leads: 'f3_eggs',
      build: { ledge: { x0: 6500, y0: 1262, x1: 6600, y1: 1350 } },
      payoff: { kind: 'heart_ember', id: 'f3_eggs' },
      name: ['a ribbon of warm wind up the crater wall', 'a wind ribbon'],
      locked: ['Warm wind curls up the crater wall to the rim. You could ride it, if you could ride the wind.', 'Wind goes up the wall. Ride it!'] },
    // (an examine, not a chest: a chest place plays no scene, and this one has something to tell. The loot is given as
    // the scene starts; the full look stays until the scene's last beat sets f3_eggs_seen, then the after look shows)
    f3_eggs: { kind: 'examine', map: 0, at: [6528, 1309], r: 30, h: 30, if: '!flag f3_eggs_seen', look: 'egg_shells', say: 'a3g_eggs',
      then: ['heart_ember f3_eggs', 'give f3_eggshell', 'set f3_eggs_open'], name: ['an old nest on the rim', 'an old nest'] },
    f3_eggs_after: { kind: 'prop', map: 0, at: [6528, 1309], if: 'flag f3_eggs_seen', look: 'egg_nest', name: ['an empty old nest', 'an empty nest'] },

    // ---- G3. Iska's box (Ground Pound). A cracked flagstone in front of Iska's Ward stone (st_iska 3350,8850); the box
    // is beside the hole once the stone breaks (the hole drops anyone standing in it back out on the south side).
    f3g_iska: { kind: 'gate', gate: 'cracked_floor', map: 0, at: [3350, 8930], wall: false, cr: 46, r: 60, leads: 'f3_iska_box',
      payoff: { kind: 'truth', id: 'f3_iska_page' },
      name: ["the cracked flagstone at Iska's stone", 'a cracked flagstone'],
      locked: ["A cracked flagstone in front of Iska's Ward stone. It sounds hollow underneath. Something big would have to come down on it HARD.",
        'A hollow flagstone. Stomp it hard!'] },
    f3_iska_box: { kind: 'examine', map: 0, at: [3418, 8934], r: 24, h: 30, if: 'flag gate_f3g_iska>=2', look: 'iska_box', say: 'a3g_iska',
      then: ['set f_page11', 'clue f3_iska_page', 'set f3_iska_open', 'xp 300'], name: ["Iska's stone box", 'a stone box'] },

    // ---- G6. Bertram's bun (Blast Bombs). A Lantern bun that froze as big as a cart, beside his bakery door.
    f3g_bun: { kind: 'gate', gate: 'bomb_rock', map: 0, at: [2380, 9800], wall: false, w: 84, r: 60, leads: 'f3_bun',
      payoff: { kind: 'heart_ember', id: 'f3_bun' },
      name: ["Bertram's giant frozen bun", 'a giant frozen bun'],
      locked: ["A Lantern bun the size of a cart, frozen as hard as a rock, right against Bertram's cellar door. A sword just bounces off. A bomb might not.",
        'A giant frozen bun! Try a bomb.'] },
    // (I3: a "Look at" prompt while the bun is shut and Ash has no bombs yet. The gate library says a built gate's
    //  locked line only when Ash pushes against it, so a kid walking by never learned what the bun needs. If the engine
    //  ever gives built gates this prompt itself, both say the same and only one prompt shows at a time.)
    f3_bun_look: { kind: 'examine', map: 0, at: [2380, 9806], r: 40, h: 64, if: '!flag gate_f3g_bun>=2', show: '!power bombs',
      name: ["Bertram's giant frozen bun", 'a giant frozen bun'], prompt: ['Look at the giant frozen bun', 'Look at the frozen bun'],
      say: 'f3_bun_locked' },
    // (drawn over the gate library's boulder until it breaks)
    f3_bun_shell: { kind: 'prop', map: 0, at: [2380, 9803], look: 'frozen_bun', show: '!flag gate_f3g_bun>=2', name: ['a giant frozen bun', 'a frozen bun'] },
    f3_bun: { kind: 'examine', map: 0, at: [2380, 9800], r: 44, h: 30, if: 'flag gate_f3g_bun>=2 !flag f3_bun_seen', look: 'frozen_bun_open', say: 'a3g_bun',
      then: ['heart_ember f3_bun', 'give coins 30', 'set f3_bun_open'], name: ['the burst bun', 'the burst bun'] },
    f3_bun_after: { kind: 'prop', map: 0, at: [2380, 9800], if: 'flag f3_bun_seen', look: 'frozen_bun_crumbs', name: ['the burst bun', 'the burst bun'] },
  },

  scene: {
    f3_bun_locked: [['narr', "A Lantern bun the size of a cart, frozen as hard as a rock, right against Bertram's cellar door. A sword just bounces off. A bomb might not.",
        'A giant frozen bun! Try a bomb.']],
    a3g_tove: [
      ['narr', 'The ice slumps into a puddle. Under it lies a flat stone, carved in neat old letters.', 'Under the ice, a carved stone.'],
      ['narr', '"TOVE KEPT THE COLD POST. EMBER MADE THE FIRE. AUNTIE G MADE THE SNOW."', '"TOVE KEPT WATCH. EMBER MADE FIRE. AUNTIE G MADE SNOW."'],
      ['tove', 'Auntie G. AUNTIE G! She let me ride on her tail when it snowed. I REMEMBER!', 'Auntie G! I remember her!'],
      ['ash', 'Who is Auntie G?'],
      ['tove', "Ember's auntie. Big. White. She laughed like wind chimes. The rest is still foggy. But it is coming back.", "Ember's auntie. Big and white. Still foggy."],
    ],
    a3g_eggs: [
      ['narr', 'On the very rim of the fire mountain, wedged between two warm rocks: an old nest. Two broken eggshells lie in it.', 'An old nest on the rim. Two broken eggshells.'],
      ['narr', 'One shell is red and scorched. The other is ice-blue, and still cold to touch. After all this time.', 'One red and scorched. One blue and cold.'],
      ['ash', 'Two dragons hatched up here. A fire one... and an ice one.', 'A fire dragon and an ice dragon!'],
      ['narr', 'Under the shells, a little glowing ember, warm as a heartbeat.', 'Under them, a glowing ember.'],
      { do: ['set f3_eggs_seen'] },
    ],
    a3g_iska: [
      ['narr', 'Under the broken flagstone: a little stone box, sealed with wax in the shape of a lantern.', 'A little stone box, sealed with a lantern.'],
      ['narr', "Inside, a page copied out in Iska's careful hand. At the top it says: ELEVEN.", 'A page in Iska\'s writing. It says ELEVEN.'],
      ['narr', '"On the first Lantern Day, a little grey moth sat on Ember\'s lantern all night. Ember named her Nyx. We thought nothing of it."',
        '"A grey moth sat on Ember\'s lantern. Ember named her Nyx."'],
      ['ash', 'Nyx. Ember gave her a NAME.', 'Ember gave her a name.'],
    ],
    a3g_bun: [
      ['narr', 'KA-BOOM. Frozen crumbs rain down all over Emberhollow. Inside the bun, something glows.', 'KA-BOOM! Crumbs everywhere. Something glows!'],
      ['narr', 'A Heart Ember. Baked right into the middle, warm as toast.', 'A Heart Ember, baked inside!'],
      ['bertram', '(from the window) I have NO idea how that got in there. Do not tell your mother.', '(window) No idea how! Do not tell your mom.'],
      { do: ['set f3_bun_seen'] },
    ],
  },
})
