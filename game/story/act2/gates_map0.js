// game/story/act2/gates_map0.js (A2S): Act II reasons to go back to Embermere (map 0).
// Five gates for the Act II powers, each with a payoff behind it. Nothing here exists on map 0 today: every gate
// carries a `build` block that gateBuild makes first (ELEV.plateau, ELEV.grapple, ELEV.noFly, p2Add thinbars,
// the chain ring). Coordinates were checked in the live game (A2S_NOTES.md, "Gates"): the payoffs sit on
// tops or inside walls that only the named power gets past, at least 90 px from any ground Ash can stand on.
//   m0_lookout  claws        Vesper's Lookout above her old camp at the Southern Pass: clue q_lookout, Heart Ember
//   m0_pearl    grapple      Pearl's First Hook, on a windy crag above Ember's Nursery: clue q_nursery
//   m0_lockup   shadow dash  the Wardens' Lockup south of Brindlecross, barred with thin iron: Heart Ember, clue q_ward_ledger
//   m0_bramble  Chain Whip   a chain ring on the bank of Bramble Pond: Fennick's lamp oil (the Gloomwing fight uses it)
//   m0_duchess  claws        Duchess's Perch east of Emberhollow: Heart Ember (and where goats get coins)
places({
  id: 'a2s_map0', act: 2, map: 0,

  place: {
    // ---- 1. Vesper's Lookout (Climbing Claws). The rockfall (x0_act1 A1W.rockfall 3446,10842) lies at the foot
    // of the new rock; the old camp (3390,10700) is just west of it.
    m0_lookout: { kind: 'gate', gate: 'climb_wall', map: 0, at: [3560, 10800], r: 140, leads: 'm0_lookout_chest',
      payoff: { kind: 'heart_ember', id: 'm0_lookout' },
      name: ["Vesper's Lookout", "Vesper's Lookout"],
      locked: ['A tall rock above the old rockfall. Deep scratches run up it, like handholds for claws.',
        'Scratches go up the rock. You need claws.'],
      build: { plateau: { poly: [[3490, 10520], [3600, 10480], [3720, 10500], [3770, 10580], [3760, 10700],
        [3700, 10770], [3560, 10775], [3480, 10730], [3470, 10620]], lvl: 2, style: 'rock', climb: true, noise: 14 } } },
    m0_sketch: { kind: 'examine', map: 0, at: [3590, 10620], look: 'a2s_sketch_page', say: 'm0_sketch',
      then: ['clue q_lookout'], name: ['an old sketchbook page', 'a drawing'] },
    m0_lookout_chest: { kind: 'chest', map: 0, at: [3660, 10660], loot: ['heart_ember m0_lookout', 'set m0_lookout_open'],
      name: ['a little tin box under a stone', 'a tin box'] },

    // ---- 2. Pearl's First Hook (Grapple Tail). A crag one level up north of the Nursery cave (a1_nursery door
    // 3500,4420). The wind off the frozen lake grounds the Ember Wings round it, so only the tail gets up; a second hook
    // post on the ground south of it is the way back down.
    m0_pearl: { kind: 'gate', gate: 'grapple_post', map: 0, at: [3450, 3866], r: 340, leads: 'm0_hands',
      payoff: { kind: 'truth', id: 'q_nursery' },
      name: ["Pearl's First Hook", "Pearl's Hook"],
      locked: ['A little iron hook glints on top of the crag. Too high to reach, and too windy to fly.',
        'A hook on top. Too high. Too windy.'],
      build: { plateau: { poly: [[3350, 3820], [3440, 3795], [3540, 3810], [3565, 3900], [3540, 3985], [3440, 3995],
        [3350, 3975], [3335, 3900]], lvl: 1, style: 'rock', noise: 8 },
        post: [[3450, 3866, 1], [3450, 4150, 0]],
        nofly: { disc: [3450, 3900, 360], why: ['The wind howls round the crag. Too windy to fly.', 'Too windy to fly here!'] } } },
    // (r 10: its prompt reaches 60 px, so it never takes the E press from Ash on the south lip, where he grapples down)
    m0_hands: { kind: 'examine', map: 0, at: [3445, 3880], r: 10, look: 'a2s_handprints', say: 'm0_hands',
      then: ['clue q_nursery', 'xp 150'], name: ['two little handprints', 'handprints'] },

    // ---- 3. The Wardens' Lockup (Shadow Dash). A rock cell open to the south, its mouth barred with iron too thin
    // for anyone but a shadow. A no-fly zone round it keeps the Ember Wings from flying in over the bars.
    m0_lockup: { kind: 'gate', gate: 'thin_bars', map: 0, at: [6770, 8430], r: 90, leads: 'm0_lockup_chest',
      payoff: { kind: 'heart_ember', id: 'm0_lockup' },
      name: ["the Wardens' Lockup", "the Wardens' Lockup"],
      locked: ["Thin iron bars, close together. Nothing bigger than a shadow could get through.",
        'Thin bars. Only a shadow fits.'],
      build: { plateau: { poly: [[6640, 8080], [6900, 8080], [6900, 8360], [6840, 8360], [6840, 8140], [6700, 8140],
        [6700, 8360], [6640, 8360]], lvl: 2, style: 'rock', noise: 6 },
        bars: { x: 6770, y: 8430, w: 152, h: 44, style: 'iron' },
        nofly: { disc: [6770, 8300, 340], why: ['The wind whips round the old rock. Too windy to fly.', 'Too windy to fly here!'] } } },
    m0_ledger: { kind: 'examine', map: 0, at: [6770, 8268], look: 'a2s_ledger', say: 'm0_ledger',
      then: ['clue q_ward_ledger'], name: ["a Warden's ledger", 'an old book'] },
    m0_lockup_chest: { kind: 'chest', map: 0, at: [6800, 8320], loot: ['heart_ember m0_lockup', 'give coins 40', 'set m0_lockup_open'],
      name: ["the Wardens' strongbox", 'a strongbox'] },

    // ---- 4. Bramble Pond (Chain Whip). A rusty ring on the south bank, its chain running into the deep water.
    // Yanking it with the whip hauls up a tin chest that was never on the map before.
    m0_bramble: { kind: 'gate', gate: 'chain_ring', map: 0, at: [2850, 10612], r: 60, leads: 'm0_bramble_chest',
      payoff: { kind: 'item_main', id: 'c_lampoil' },
      name: ['the chain in Bramble Pond', 'the pond chain'],
      locked: ['A rusty ring on the bank. Its chain runs down into the pond. Something heavy is on the other end. A good yank might do it.',
        'A chain goes into the pond. Yank it!'],
      build: { ring: [2850, 10612] } },
    // the chest is up once the ring is pulled: the gate library's saved state G.flags.gate_m0_bramble is 2 (open for
    // everyone). Not `event gate_open:...`, which also fires at state 1 when Ash merely walks near the chest's spot.
    m0_bramble_chest: { kind: 'chest', map: 0, at: [2920, 10634], if: 'flag gate_m0_bramble>=2', look: 'a2s_pond_chest',
      say: 'm0_oil', loot: ['give c_lampoil', 'give coins 30', 'set m0_bramble_open'], name: ["a tin chest, dripping pond weed", 'a tin chest'] },

    // ---- 5. Duchess's Perch (Climbing Claws). A tall rock in the meadows east of Emberhollow.
    m0_duchess: { kind: 'gate', gate: 'climb_wall', map: 0, at: [3920, 9235], r: 140, leads: 'm0_duchess_chest',
      payoff: { kind: 'heart_ember', id: 'm0_duchess' },
      name: ["Duchess's Perch", "Duchess's Perch"],
      locked: ['Goat hoofprints go straight up this rock. Straight UP. You would need claws.',
        'Hoofprints go up. You need claws.'],
      build: { plateau: { poly: [[3800, 8960], [3900, 8925], [4020, 8945], [4055, 9040], [4040, 9160], [3960, 9210],
        [3840, 9205], [3790, 9110]], lvl: 2, style: 'rock', climb: true, noise: 14 } } },
    m0_hoofprints: { kind: 'examine', map: 0, at: [3880, 9060], say: 'm0_hoof', name: ['goat hoofprints', 'hoofprints'] },
    m0_duchess_chest: { kind: 'chest', map: 0, at: [3960, 9080], look: 'a2s_goat_stash',
      loot: ['heart_ember m0_duchess', 'give coins 40', 'set m0_duchess_open'], name: ["Duchess's stash", "Duchess's stash"] },
  },

  clue: {
    q_lookout: { icon: 'note', mystery: 'moth_mask',
      text: ["Vesper's old drawing from her lookout above the Southern Pass: Lantern Night in Emberhollow, and in the corner a crooked stilt house with a cold chimney, marked HOME.",
        'Her Lantern Night drawing. A stilt house says HOME.'] },
    q_nursery: { icon: 'claw', mystery: 'moth_mask',
      text: ["Above Ember's Nursery: two tiny handprints. One burned into the rock, one only clawed. Under the clawed one: P. NO FIRE. CLIMBED UP ANYWAY.",
        'Pearl had no fire. She climbed with claws.'] },
    q_ward_ledger: { icon: 'book', mystery: 'what_stopped',
      text: ["A Warden's ledger: long ago something huge flew over Brindlecross at one minute to midnight. Every clock stopped at once, and silver moth dust lay on every roof.",
        'Long ago a huge thing flew over. Every clock stopped.'] },
  },

  scene: {
    m0_sketch: [
      ['narr', 'A sketchbook page, weighed down with a pebble. Someone sat up here and drew Emberhollow on Lantern Night.',
        'A drawing of Emberhollow on Lantern Night.'],
      ['narr', '"Things that glow: lanterns (400). The big stone in the forge (1). That dragon boy, when he is cross (1)."',
        '"Things that glow: lanterns. The big stone. That dragon boy."'],
      ['ash', "...I do NOT glow when I'm cross.", 'I do NOT glow!'],
      ['narr', 'In the corner: a crooked stilt house with a cold chimney. Under it, one word: Home.',
        'In the corner, a stilt house. It says Home.'],
    ],
    m0_hands: [
      ['narr', 'A little iron hook, no bigger than your hand, hammered into the rock a very long time ago.',
        'A tiny old iron hook in the rock.'],
      ['narr', 'Beside it, two small handprints. One is scorched black into the stone. The other is only scratches. Claw scratches.',
        'Two handprints. One burned. One clawed.'],
      ['narr', 'Scratched under the clawed one: "P. NO FIRE. CLIMBED UP ANYWAY."', '"P. NO FIRE. CLIMBED UP ANYWAY."'],
      ['ash', "Pearl's first hook. And my tail just used it.", "Pearl's first hook!"],
    ],
    m0_ledger: [
      ['narr', "A Warden's ledger, dry as a biscuit. Most of it is about moths. A lot of moths.",
        'An old Warden book, all about moths.'],
      ['narr', '"Year of the Long Dark. At one minute to midnight something huge flew over Brindlecross. Every clock in town stopped at once."',
        '"A huge thing flew over. Every clock stopped."'],
      ['narr', '"In the morning, silver dust lay a finger deep on every roof."', '"Next day, silver dust on every roof."'],
      ['ash', 'Every clock, at one minute to midnight. Just like Gearhaven.', 'Every clock? Just like Gearhaven!'],
    ],
    m0_oil: [
      ['narr', "Up comes a tin chest, dripping pond weed. Painted on the lid: \"Fennick's Brightest. For a lamp having a bad night.\"",
        "A tin chest of Fennick's lamp oil!", { ref: 'm0_bramble_chest' }],
      ['narr', '"My last tin of the good stuff, hidden here for a bad night. If you found it, the bad night is yours. Use it well. F."', '"My last good oil. Use it well. F."'],
      ['ash', "Fennick's lamp oil. Some lamp out there is having a very bad night.", "Fennick's lamp oil!"],
    ],
    m0_hoof: [
      ['narr', 'Goat hoofprints. They go straight up a rock that you needed claws for.', 'Goat hoofprints, straight up the rock!'],
      ['narr', 'On top: a chewed hat, a heap of coins, and a little glowing ember in a nest of grass.',
        'A chewed hat, coins and a glowing ember.'],
      ['ash', 'So this is where goats get coins.'],
    ],
  },
})
