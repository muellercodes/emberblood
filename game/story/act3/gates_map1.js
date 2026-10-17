// game/story/act3/gates_map1.js (A3S): Act III reasons to go back to the Clockwork Coast (map 1). Two gates for Act
// III's powers at the spots ACT3_V10.md 2.7 verified; like gates_map0.js, the payoff place only exists once the piece
// is broken (`flag gate_<id>>=2`).
//   f3g_ring    ice_wall (Blaze)          the middle of the Moon Ring, frozen over in summer: a giant white wing-scale
//                                         (truth f3_ring_scale: the white moth set off for the snow from here)
//   f3g_hettie  bomb_rock (Blast Bombs)   the boulder on Hettie Sprocket's cellar door, behind her workshop in
//                                         Gearhaven: the Sprocket Satchel (upgrade f3_satchel, more bombs)
// Pointers: Ottoline's letter (a3g_otto here, which Brother Eider's talk sends in people.js) and Mags (people.js).
places({
  id: 'a3s_gates1', act: 3, map: 1,

  clue: {
    f3_ring_scale: { icon: 'moth', mystery: 'long_winter',
      text: ['In the frozen Moon Ring: a white wing-scale as big as a dinner plate, and two great moth shapes pressed into the grass. One faces the sunrise. The white one faces the snow.',
        'A huge white moth scale. The white moth flew to the snow.'] },
  },

  place: {
    // ---- G4. The Moon Ring (Blaze), 55 px inside the ring from Act II's Moon Ring look (gm_moonring, 1350,22760)
    f3g_ring: { kind: 'gate', gate: 'ice_wall', map: 1, at: [1350, 22705], wall: false, w: 80, r: 60, leads: 'f3_ring_scale',
      payoff: { kind: 'truth', id: 'f3_ring_scale' },
      name: ['the frozen middle of the Moon Ring', 'the frozen ring'],
      locked: ['The middle of the Moon Ring is frozen over. In summer. Purple moth-frost, and something white is stuck inside it. Your fire only makes it sweat.',
        'Moth-frost! Something white is inside. Use hotter fire.'] },
    // (until it is looked at, the scale takes the prompt from x1_world's Moon Ring stones, 55 px away; then the scale
    // stays as a drawing and the stones have their prompt back)
    f3_ring_scale: { kind: 'examine', map: 1, at: [1350, 22707], r: 26, h: 30, if: 'flag gate_f3g_ring>=2 !flag f3_ring_open', over: 'c_lm_moonring',
      look: 'ring_scale_ice', say: 'a3g_ring', then: ['clue f3_ring_scale', 'set f3_ring_open', 'xp 300'], name: ['a giant white scale', 'a giant scale'] },
    f3_ring_scale_after: { kind: 'prop', map: 1, at: [1350, 22707], if: 'flag f3_ring_open', look: 'ring_scale_ice', name: ['a giant white scale', 'a giant scale'] },

    // ---- G5. Hettie's cellar (Blast Bombs), in the back yard behind Sprocket's Workshop (door h_c_hettie 6600,25821)
    f3g_hettie: { kind: 'gate', gate: 'bomb_rock', map: 1, at: [6600, 25650], wall: false, w: 84, r: 60, leads: 'f3_hettie_cellar',
      payoff: { kind: 'upgrade', id: 'f3_satchel' },
      name: ["the boulder on Hettie's cellar", 'a big boulder'],
      locked: ['A huge boulder sits right on top of a cellar door. A painted sign on it says: SORRY, CELLAR. A bomb might move it.',
        'A boulder on a cellar door. Try a bomb!'] },
    // (I3: a "Look at" prompt while the boulder is shut and Ash has no bombs yet; see f3_bun_look in gates_map0.js)
    f3_hettie_look: { kind: 'examine', map: 1, at: [6600, 25656], r: 40, h: 64, if: '!flag gate_f3g_hettie>=2', show: '!power bombs',
      name: ["the boulder on Hettie's cellar", 'a big boulder'], prompt: ['Look at the big boulder', 'Look at the boulder'],
      say: 'f3_hettie_locked' },
    // (an examine, not a chest: a chest place plays no scene. bombbag 5: five more bombs fit in the bag)
    f3_hettie_cellar: { kind: 'examine', map: 1, at: [6600, 25650], r: 44, h: 30, if: 'flag gate_f3g_hettie>=2 !flag f3_satchel_seen', look: 'sprocket_boulder', say: 'a3g_hettie',
      then: ['upgrade f3_satchel', 'set f3_satchel', 'bombbag 5', 'give coins 60'], name: ["Hettie's cellar", "Hettie's cellar"] },
    f3_hettie_after: { kind: 'prop', map: 1, at: [6600, 25650], if: 'flag f3_satchel_seen', look: 'sprocket_cellar', name: ["Hettie's cellar", "Hettie's cellar"] },
  },

  scene: {
    f3_hettie_locked: [['narr', 'A huge boulder sits right on top of a cellar door. A painted sign on it says: SORRY, CELLAR. A bomb might move it.',
        'A boulder on a cellar door. Try a bomb!']],
    // the letter (Brother Eider's talk in people.js sends it with `mail a3g_otto`)
    a3g_otto: [
      ['narr', 'Pebble brings a letter with a library stamp. It is written VERY LARGE.', 'A letter, written VERY LARGE.'],
      ['narr', '"ASH. The Moon Ring by the Rockpools has FROZEN OVER. In JUNE. Moth-frost, I think. The purple kind."', '"The Moon Ring froze over! In June!"',
        { promise: 'f3g_ring' }],
      ['narr', '"Something white is stuck in the middle. Bring blue fire. SHHH. Sorry. Archivist Ottoline."', '"Bring blue fire. Shh. Sorry. Ottoline."'],
    ],
    a3g_ring: [
      ['narr', 'The moth-frost melts into the grass. In the middle of the ring lies a white scale, as big as a dinner plate.', 'A white scale, big as a plate!'],
      ['narr', 'Two great shapes are pressed flat in the grass beside it, as if two huge moths sat here. One faces the sunrise. One faces the snow.',
        'Two big moth shapes in the grass. One faces the snow.'],
      ['ash', 'The white one flew off to the snow. To Frostreach. And it sat HERE first.', 'The white one flew to the snow!'],
    ],
    a3g_hettie: [
      ['narr', 'Under the boulder: a cellar door. Under the door: twelve years of Hettie Sprocket saying "I will fix that later."', 'A cellar full of old projects.'],
      ['narr', 'On top of the pile sits a satchel of brass and leather. A label: BOMB BAG, MARK TWO. DO NOT LET MAGS SEE.',
        'A brass satchel: BOMB BAG. DO NOT LET MAGS SEE.'],
      ['narr', 'Ash swaps his old bomb bag for it. It holds five more bombs. It also hums a little.', 'It holds five more bombs! It hums.'],
      ['ash', 'Sorry, Hettie. Mags is going to see.', 'Sorry, Hettie.'],
      { do: ['set f3_satchel_seen'] },
    ],
  },
})
