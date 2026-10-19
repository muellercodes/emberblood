// Act II, chapter 7: The Spinning Lighthouse (owner A2b). Data only: the engine runs it, the checker reads it.
// What the player does: Captain Squawk crashes into the Gear Market. Mo blames crabs for the cut bridge. At the Cut Ash
// finds three clues and works out who really cut it (Vesper, who tied a rope so nobody would fall). Squawk flies off to
// tell Mo. Agatha points Ash at her logbook; round the lighthouse door he finds the logbook, Pearl's stone and a giant
// wing print in dust. Up top the Gloomwing falls, its grey dust slides off (gold underneath), the moths turn on Vesper
// and Ash chooses (trust K4: save her). Fire rolls over her and she does not burn (a what_she_is clue). The lamp is lit,
// the Spire is seen from the lighthouse door, and Ash works out what stopped the clocks: something huge flew over.
// Squawk was right. The rope bridge comes back as a walkway (the who_cut payoff).
chapter({
  id: 'c_light', act: 2, after: 'c_brass', next: 'c_spire', takeover: true,
  // old x1_story scenes whose own triggers must never play now (A2a's `silence`)
  silence: ['c_squawk', 'c_agatha', 'c_lamp_vesper'],
  card: ['Act II · Chapter 7', 'The Spinning Lighthouse'],
  so_far: [
    "The Great Clock struck midnight and Gearhaven woke up. But the Spinning Lighthouse on Lantern Point was still dark, smothered in moths. Then Keeper Agatha's parrot crashed into the Gear Market, shouting for help.",
    'The clock works again! But the lighthouse is dark. A parrot came for help.'],
  mom: [["A whole city's clock! I told the chickens.", 'You fixed a clock! I told the chickens.']],

  npc: {
    // Captain Squawk: a small creature actor (no a10b look, see CHANGES.md A2B). He stands nowhere until a scene places
    // him, and goes when it ends.
    c_squawk: { name: 'Captain Squawk', map: 1, sprite: 'squawk', card: false },
    // (Vesper in her mask, c_mask, is ENG's legacy actor in map1_gear.js: x1_story's sighting sprite, posed with
    //  v10_art2b.js's definePose('c_mask', 'moths' | 'stand' | 'shadow'))
    // Agatha's bird is Squawk, not a crow (audit finding 7): the parrot sits on her bun
    // (and a step west of the lamp post that stands in front of her today, so she and Squawk can be seen)
    c_agatha: { look: { crow: false }, overlay: 'squawk_shoulder', at: [12185, 28590] },
  },

  place: {
    gh_squawk_sky:  { map: 1, at: [7520, 25640], kind: 'npc_spot', name: 'the sky over the market' },
    gh_crash_spot:  { map: 1, at: [7255, 25872], kind: 'npc_spot', name: 'in front of the fruit stall' },
    // nothing is drawn while it is tidy (a state with no look draws nothing); Squawk's crash spills it
    gh_fruit_spill: { map: 1, at: [7228, 25866], kind: 'prop', state: 'tidy',
                      states: { spilled: 'fruit_spill' }, name: 'the spilled fruit' },
    // the Cut (verified walkable, level 2, both sides; the posts are legacy c_cut_post_w and c_cut_post_e)
    c_cut_rope:  { map: 1, at: [9460, 26936], r: 34, kind: 'examine', look: 'cut_rope_fence',
                   name: 'the rope across the road', prompt: ['Look at the rope across the road', 'Look at the rope'] },
    c_cut_ends:  { map: 1, at: [9852, 26992], r: 28, kind: 'examine', look: 'cut_rope_ends',
                   name: 'the cut rope ends', prompt: ['Look at the cut ropes', 'Look at the ropes'] },
    c_cut_silk:  { map: 1, at: [9905, 27030], r: 30, kind: 'examine', look: 'grey_silk',
                   name: 'the thread on the thorn bush', prompt: ['Look at the thorn bush', 'Look at the bush'] },
    c_cut_east:  { map: 1, at: [9900, 26990], r: 140, kind: 'spot', name: 'the far side of the Cut' },
    // the who_cut payoff: Mo's crew rebuilds the rope bridge, a walkway over the Cut. The deck runs just south of the two
    // posts (their colliders stand at its ends otherwise). Proven at runtime: a level 2 plateau over the deck (so the
    // cliff faces at both edges go) plus a lowered p2 drawbridge over the same rect (so the water under it does not
    // block) lets Ash walk across both ways. The plateau's own faces must not paint (see A2B_NOTES.md).
    c_cut_bridge: { map: 1, kind: 'gate', gate: 'bridge', at: [9683, 27004], deck: [9520, 26966, 9846, 27004],
                    build: { plateau: { rect: [9520, 26966, 9846, 27004], lvl: 2, style: 'c_roof', noise: 0, faces: false } },
                    look: 'rope_bridge', name: 'the rope bridge over the Cut', payoff: { kind: 'shortcut', id: 'c_cut_bridge' } },
    c_cut_sign:  { map: 1, at: [9470, 27012], kind: 'sign', if: 'flag c_bridge',
                   text: ['REBUILT BY THE HARBOR CREW. IT WAS NOT CRABS. SORRY, ADMIRAL. (Mo)', 'REBUILT. IT WAS NOT CRABS. SORRY, ADMIRAL. (Mo)'] },
    // round the lighthouse door (verified walkable, level 2; the door is legacy c_lighthouse_door at 12880,29052)
    lh_logbook:    { map: 1, at: [12760, 29095], r: 32, kind: 'examine', look: 'keeper_lectern',
                     name: "Agatha's logbook", prompt: ["Read Agatha's logbook", 'Read the logbook'] },
    lh_stone:      { map: 1, at: [12815, 29060], r: 30, kind: 'examine', look: 'pearl_stone',
                     name: "Pearl's stone", prompt: ['Look at the carved stone', 'Look at the stone'] },
    lh_wing_print: { map: 1, at: [12950, 29064], r: 32, kind: 'examine', look: 'wing_print',
                     name: 'the dust on the tower', prompt: ['Look at the dust on the tower', 'Look at the dust'] },
  },

  clue: {
    // who_cut (small mystery)
    l_crab_claim:  { icon: 'crab', mystery: 'who_cut', herring: true,
                     text: ["Mo says Admiral Pinch's crabs chewed through the rope bridge.", 'Mo thinks crabs broke the bridge.'] },
    l_one_rope:    { icon: 'rope', mystery: 'who_cut',
                     text: ['Somebody tied a rope across the road before the edge, so nobody walks off in the dark. A fisher\'s knot.', 'A rope stops people walking off the edge.'] },
    l_clean_cut:   { icon: 'knife', mystery: 'who_cut',
                     text: ['The bridge ropes were cut clean through, in one stroke. Not chewed. Not frayed. Something sharp and hooked.', 'The ropes were cut clean. Not chewed.'] },
    l_silk_thread: { icon: 'silk', mystery: 'who_cut',
                     text: ['A thread of grey silk on a thorn bush by the road. Silver-grey and soft as a moth\'s wing. Like a certain cloak.', 'Grey silk, like a moth wing. Like her cloak.'] },
    // what_stopped (small mystery)
    l_keeper_log:  { icon: 'book', mystery: 'what_stopped',
                     text: ["Agatha's log: the night the clocks stopped, at 11:59 the lamp went out, a huge shadow crossed the stars from west to east, and every clock in her cottage stopped in that same minute.", 'At 11:59 the lamp went out. A huge shadow flew over.'] },
    l_wing_print:  { icon: 'wing', mystery: 'what_stopped',
                     text: ['On the lighthouse, a print of silver dust: one wing with a pale moon painted on it, taller than the tower itself.', 'A dust print of one giant wing on the tower.'] },
    l_lamp_moths:  { icon: 'moth', mystery: 'what_stopped',
                     text: ["When the Gloomwing fell, its grey dust slid off like snow. Its own wings are gold. Something much bigger dusted it.", 'The Gloomwing was only dusted. Its wings are gold.'] },
    // what_she_is (main mystery, asked at the Spire door)
    l_pearl_mural: { icon: 'stone', mystery: 'moth_mask',
                     text: ['Pearl\'s stone by the lighthouse door: a horned girl with a tail and no fire, climbing a cliff. "I HAD NO FIRE, SO I CLIMBED."', 'Pearl had no fire. So she climbed.'] },
    l_fireproof:   { icon: 'flame', mystery: 'moth_mask',
                     text: ['In the Lamp Room, fire rolled right over Vesper and she did not burn. Not one hair.', 'Fire did not burn Vesper.'] },
  },

  deduce: {
    who_cut: {
      mystery: 'who_cut',
      ask: ['Who cut the rope bridge over the Cut?', 'Who cut the bridge?'],
      needs: ['l_one_rope', 'l_clean_cut', 'l_silk_thread'],
      pick: [
        { t: ["Admiral Pinch's crabs", 'The crabs'],
          hint: ['Crabs chew and fray. These ropes were cut clean, in one stroke.', 'Crabs chew. These ropes were cut clean.'] },
        { t: ['The Hushers', 'The Hushers'],
          hint: ['Would a Husher tie a rope so nobody falls? And whose cloak is grey silk?', 'Who wears grey silk?'] },
        { t: ['Vesper, to slow me down', 'Vesper'], right: true },
      ],
      then: ['set c_who_cut'],
    },
    what_stopped: {
      mystery: 'what_stopped',
      ask: ['What stopped the clocks, the tide and the lighthouse, all in the same minute?', 'What stopped them all in one minute?'],
      needs: ['l_keeper_log', 'l_wing_print', 'l_lamp_moths'],
      bonus: ['s_tide_dust', 's_alibi', 'w_silver_sheep', 'g_dust_clock', 'q_moonring', 'q_ghost_saw'],
      pick: [
        { t: ['The Gloomwing', 'The Gloomwing'],
          hint: ['The Gloomwing never left the lamp, and its own wings are gold. Who dusted it?', 'It never left the lamp. Who dusted it?'] },
        { t: ['Vesper', 'Vesper'],
          hint: ['One girl, in three places, in the same minute? Gran Oona says she came home before midnight. And look how big that wing print is.', 'One girl, three places, one minute?'] },
        { t: ['Lord Whirligig, to sell new clocks', 'Lord Whirligig'],
          hint: ['His own bird clock stopped too. And he cannot fly.', "His clock stopped too. He can't fly."] },
        { t: ['Something huge flew over the whole coast', 'Something huge flew over'], right: true },
      ],
      then: ['set c_what_stopped'],
    },
  },

  step: [
    { id: 'squawk', do: 'goto gh_market 420', scene: 'c_squawk_crash', migrate_if: 'flag c_squawk',
      obj: ['Go down to the Gear Market. Something is happening there.', 'Go to the Gear Market'],
      hint: ['Something is going on in the Gear Market, down in the Lower Town.', 'Go to the Gear Market.'],
      then: ['set c_squawk'] },
    { id: 'cut', do: 'all', migrate_if: 'flag c_cut',
      obj: ['Follow the Lantern Road east to the Cut. What happened to the bridge?', 'Go east to the Cut. Look around.'],
      hint: ['The Lantern Road runs east from the harbor to the Cut. Swing over on the old bridge posts with your tail, and look around both sides.',
             'Go east to the Cut. Swing over with your tail. Look around.'],
      parts: [
        { do: 'examine c_cut_rope', scene: 'c_look_rope', then: ['clue l_one_rope'] },
        { do: 'goto c_cut_east 140', then: ['set c_cut'] },
        { do: 'examine c_cut_ends', scene: 'c_look_ends', then: ['clue l_clean_cut'] },
        { do: 'examine c_cut_silk', scene: 'c_look_silk', then: ['clue l_silk_thread'] },
      ] },
    { id: 'who_cut', do: 'deduce who_cut', scene: 'c_cut_solved', migrate_if: 'flag c_cut',
      obj: ['Who cut the bridge? Work it out in the Case Book', 'Open the Case Book'],
      hint: ['You have three clues from the Cut, and Mo has a theory. Open the Case Book.', 'Open the Case Book.'] },
    { id: 'agatha', do: 'talk c_agatha', scene: 'c_agatha_meet', migrate_if: 'flag c_agatha', then: ['set c_agatha'],
      obj: ['Find Keeper Agatha at her cottage on Lantern Point', 'Find Keeper Agatha'],
      hint: ["Keeper Agatha's cottage has a red roof, on the heath before the lighthouse.", "Agatha's cottage is by the lighthouse."] },
    { id: 'look', do: 'all',
      obj: ['Look around the lighthouse door', 'Look around the lighthouse door'],
      hint: ["Agatha's logbook is on its stand by the path. Something is carved by the door. And what is that on the tower?", 'Read the logbook. Look by the door. Look at the tower.'],
      parts: [
        { do: 'examine lh_logbook', scene: 'c_read_log', then: ['clue l_keeper_log'] },
        { do: 'examine lh_stone', scene: 'c_read_stone', then: ['clue l_pearl_mural'] },
        { do: 'examine lh_wing_print', scene: 'c_look_print', then: ['clue l_wing_print'] },
      ] },
    // the dungeon stays code (x1_dun_b); the Gloomwing's fall is its boss_done event
    { id: 'gloom', do: 'fight c_gloomwing', at: 'c_lighthouse_door', win: 'c_lamp_rescue',
      obj: ['Climb the Spinning Lighthouse and free the lamp', 'Climb the lighthouse'],
      hint: ['Pearl\'s beam shrivels the moth curtains. Ride the shadows when it passes.', 'Use the light. Then use the shadows.'],
      then: ['clue l_lamp_moths'] },   // win: right after the boss (after c_light_won's two lines), at most 6 lines a branch
    { id: 'lamp', do: 'dungeon c_lighthouse', scene: 'c_lamp_lit',
      obj: ['Light the great lamp', 'Light the lamp'],
      hint: ['Walk up to the great lamp at the very top and light it.', 'Light the great lamp.'],
      then: ['set c_lit', 'set c_light_done', 'set c_spire_up'] },
    { id: 'reveal', do: 'goto c_lighthouse_door 520', scene: 'c_spire_seen', migrate_if: 'flag c_spire_up',
      obj: ['Go back down and look out to sea', 'Go out and look at the sea'],
      hint: ['Take the warp ring by the lamp, or the stairs, and look out to sea.', 'Go out and look at the sea.'] },
    { id: 'stopped', do: 'deduce what_stopped', scene: 'c_stopped_solved',
      obj: ['What stopped the clocks, the tide and the light? Work it out in the Case Book', 'Open the Case Book'],
      hint: ["Agatha's log, the wing print and the Gloomwing's gold wings. Open the Case Book.", 'Open the Case Book.'],
      then: ['open c_cut_bridge', 'set c_bridge', 'stage c_spire'] },
  ],

  scene: {
    // the market: Squawk is seen (audit finding 7), and Mo's crab theory is the herring
    c_squawk_crash: [
      { place: ['c_squawk', 'gh_squawk_sky'] }, { cam: 'gh_fruit_stall', s: 1.2 },
      { anim: ['c_squawk', 'fly'] }, { walk: ['c_squawk', 'gh_crash_spot'] },
      { anim: ['c_squawk', 'crash'] }, { sfx: 'pop' }, { do: ['world gh_fruit_spill spilled'] },
      ['narr', 'A green and red blur shoots across the market and crashes straight into the fruit stall. Plums everywhere.', 'A green and red bird crashes into the fruit stall!'],
      ['c_squawk', 'SQUAWK! LIGHT GONE! MOTHS! SQUAWK!', 'SQUAWK! LIGHT GONE! MOTHS!'],
      ['c_mo', "That's Agatha's parrot! Captain Squawk, from the Spinning Lighthouse out on Lantern Point.", "That's Agatha's parrot, from the lighthouse!"],
      ['c_squawk', 'AGATHA SAYS HELP! AGATHA SAYS COOKIES! ...MOSTLY HELP!', 'AGATHA SAYS HELP! AND COOKIES! MOSTLY HELP!'],
      ['c_mo', "The lighthouse went dark the night the clock stopped. Ships can't sail at night without it.", 'The lighthouse went dark. Ships cannot sail at night.'],
      ['c_mo', "And the rope bridge over the Cut is down. Chewed through, I bet. Admiral Pinch's crabs. They've always hated that bridge.", 'And the bridge over the Cut is down. Crabs did it, I bet.', { clue: 'l_crab_claim', ref: 'c_lm_cut' }],
      ['ash', "Then I'll swing across. I've got a tail.", "I'll swing across. I have a tail."],
      { anim: ['c_squawk', 'fly'] }, { walk: ['c_squawk', 'gh_squawk_sky'] },
      ['c_squawk', '(already flying east) FOLLOW SQUAWK! FOLLOW SQUAWK!', 'FOLLOW SQUAWK!', { dir: ['gh_market', 'c_lighthouse_door', 'east'] }],
    ],
    c_look_rope: [
      ['narr', "A rope is tied across the road, two steps before the cliff edge, tight as a fence. Somebody didn't want anyone walking off in the dark.", 'A rope across the road stops you walking off the edge.'],
      ['ash', "That's a fisher's knot, like on the Saltmarsh nets. Huh.", "A fisher's knot. Like the Saltmarsh nets."],
    ],
    c_look_ends: [
      ['narr', 'The bridge ropes end right here at the post. Cut clean through, in one stroke. The ends shine like they were sliced with something sharp and hooked.', 'The ropes were cut clean. Not chewed.'],
      ['ash', "Those aren't tooth marks. Crabs don't do neat.", "Crabs don't cut that neat."],
    ],
    c_look_silk: [
      ['narr', 'A long grey thread is snagged on the thorns. Soft as a moth\'s wing, and silver when it moves.', 'A grey thread on the thorns. Soft as a moth wing.'],
    ],
    // after who_cut is solved (Squawk lands on the post: he heard Mo say crabs)
    c_cut_solved: [
      { place: ['c_squawk', 'c_cut_post_e'] }, { anim: ['c_squawk', 'perch'] },
      ['ash', 'Vesper cut it, to slow me down. But first she tied a rope so nobody would walk off the edge.', 'Vesper cut it. But she made sure nobody would fall.'],
      ['ash', '...Who does that?', 'Who does that?'],
      ['c_squawk', 'NOT CRABS! NOT CRABS! TELL MO! SQUAWK!', 'NOT CRABS! TELL MO!', { promise: 'c_cut_bridge' }],
      { anim: ['c_squawk', 'fly'] }, { walk: ['c_squawk', 'gh_squawk_sky'] },
      ['narr', 'Squawk flaps off toward Gearhaven, telling every gull he passes.', 'Squawk flies off to tell everyone.'],
    ],
    c_agatha_meet: [
      ['c_agatha', "You're the dragon Squawk went to fetch? Hm. Smaller than I pictured. He said big as a house.", "You're the dragon? Squawk said big as a house."],
      ['c_squawk', 'BIG AS A HOUSE!', 'BIG AS A HOUSE!'],
      ['c_agatha', 'He says that about everything. He said it about a sandwich.', 'He says that about everything. Even a sandwich.'],
      ['c_agatha', "Forty years I've kept that light. Never missed a night. Then, the night the clocks stopped, it went out at one minute to midnight, and the moths came like a grey snowstorm.", 'Forty years I kept that light. Then it went out, and the moths came.'],
      ['c_agatha', "There's a big one wrapped round my lamp now. And a girl in a grey cloak, up and down my stairs like she owns them.", 'A big moth is round my lamp. And a girl in a grey cloak.'],
      ['ash', 'Vesper.', 'Vesper.'],
      { if: 'item c_lampoil', then: [
        ['c_agatha', "Is that a tin of Fennick's Brightest in your bag? That's the good stuff. Save it for my lamp.", "Fennick's oil? Save it for my lamp."] ] },
      ['c_agatha', "My logbook's on its stand by the lighthouse path, if you like reading. And mind the stairs. They were built for one old keeper, not for dragons.", 'My logbook is by the path. Mind the stairs!', { ref: 'lh_logbook' }],
    ],
    c_read_log: [
      ['narr', "Agatha's log. The night the clocks stopped: \"11:59. Lamp out. Could not relight it. A great shadow went over the stars, west to east, a whole minute long.\"", 'Agatha\'s log: "11:59. Lamp out. A huge shadow went over the stars."', { ref: 'lh_logbook' }],
      ['narr', '"Every clock in the cottage stopped in that same minute. So did my watch. Squawk hid in the teapot and shouted the same three words till morning. For once, I believe him."', '"Every clock stopped. Squawk hid in the teapot. For once, I believe him."'],
    ],
    c_read_stone: [
      ['narr', 'A stone is set into the lighthouse wall, worn smooth by a thousand years of salty wind. Carved on it: a girl with little horns and a tail, climbing a cliff with a lantern on her back.', 'A carved stone: a horned girl climbing a cliff.'],
      ['narr', 'Underneath: I HAD NO FIRE, SO I CLIMBED. P.', 'Underneath: I HAD NO FIRE, SO I CLIMBED. P.'],
      ['ash', '"I had no fire, so I climbed." Pearl wrote that. And I know somebody else who climbs like that...', '"No fire, so I climbed." Like someone I know...'],
    ],
    c_look_print: [
      ['narr', 'Silver dust is printed on the tower in one enormous shape: a wing, with a pale round moon painted in the middle. It is taller than the whole lighthouse.', 'A giant wing is printed in dust on the tower. Taller than the lighthouse!'],
      ['ash', "That's not the moth in the lamp. That's something much, much bigger.", "That's something much bigger."],
    ],
    // after the Gloomwing: the moths turn on Vesper (trust K4). Fire rolls over her on both branches (l_fireproof).
    c_lamp_rescue: [
      { place: ['c_mask', 'player', [96, -70]] }, { anim: ['c_mask', 'moths'] }, { cam: 'c_mask', s: 0.6 },
      ['narr', 'Then the moths come back. Not for you. For Vesper. "Get off!" she yells. "I brought the stone! She said I\'d get my fire!"', 'The moths come back, for Vesper! "Get off! She said I would get fire!"'],
      { choose: 'c_lamp', ask: ['The moths hiss, all together: "All of it. The Mother wants all of it."', 'The moths hiss: "The Mother wants all of it."'], pick: [
        { t: ['Breathe fire on the moths. Save her!', 'Save her with fire!'], tone: 'kind', v: 'saved',
          then: ['set c_lamp=saved', 'trust vesper +1'],
          say: [
            ['narr', 'You roar fire across the Lamp Room. The moths scatter out of the windows. The fire rolls right over Vesper, and she does not even blink.', 'You roar fire! The moths fly off. Vesper is not even hurt!', { clue: 'l_fireproof' }],
            ['c_mask', 'Why would you do that? I cut your bridge.', 'Why help me? I cut your bridge.'],
            ['ash', 'And you tied a rope across the road so nobody would fall.', 'You tied a rope so nobody would fall.'] ] },
        { t: ['Face her: "Vesper! Where is my mom\'s Heart?"', '"Where is Mom\'s Heart, Vesper?"'], tone: 'brave', v: 'asked',
          then: ['set c_lamp=asked'],
          say: [
            ['narr', 'She flinches at her name. Then she dives through the moths, straight through the burning wick, into the shadow under the lamp. Not one hair singed.', 'She jumps right through the fire into the shadow. Not even singed!', { clue: 'l_fireproof' }],
            ['c_mask', "You don't get to call me that.", "Don't call me that."] ] },
      ] },
      { anim: ['c_mask', 'stand'] },
      ['c_mask', "Don't follow me. Not where I'm going.", "Don't follow me. Not where I'm going."],
      { anim: ['c_mask', 'shadow'] },   // (actors leave when the scene ends)
    ],
    c_lamp_lit: [
      { if: 'item c_lampoil', then: [
        ['narr', "You pour Fennick's Brightest into the lamp. It smells like the lamp shop at home.", "You pour in Fennick's oil. It smells like home."] ] },
      ['narr', 'You breathe on the wick. It catches. The great lens turns, and a gold beam swings out over the sea, round and round, the way it used to.', 'The wick lights! A gold beam swings out over the sea.'],
      ['c_squawk', '(far below) SQUAWK! LIGHT! LIGHT! ...LOOK AT THE SEA!', 'SQUAWK! LIGHT! LOOK AT THE SEA!'],
    ],
    // outside: the Spire is SEEN (the camera goes to it), not told
    c_spire_seen: [
      { cam: 'c_spire_door', s: 3.5 },
      ['narr', 'Out past the harbor, the beam sweeps the dark sea. And where it passes, something stands in the water that was never there before.', 'The beam sweeps the sea. Something new stands there.'],
      ['narr', 'A tower. Black as a burnt match, tall as the Great Clock, crawling with moths.', 'A black tower, tall as the Great Clock. Covered in moths.'],
      ['c_squawk', '(from the top of the lighthouse) TOWER! BIGGER THAN A HOUSE! MUCH BIGGER!', 'TOWER! BIGGER THAN A HOUSE!'],
      ['ash', '"Not where I\'m going," she said. That\'s where she\'s going.', "That's where Vesper is going."],
    ],
    c_stopped_solved: [
      ['ash', 'Something with wings taller than the lighthouse flew over the whole coast. The clocks, the tide and the light all stopped in the same minute. One to midnight.', 'Something huge flew over. Everything stopped at one to midnight.'],
      { if: 'near c_agatha 500', then: [
        ['c_agatha', 'Squawk shouted it all night. I told him to hush.', 'Squawk shouted it all night. I told him to hush.'] ] },
      ['ash', 'For once, Squawk was right. ...So where did it go? And why stop everything at one minute to midnight?', 'Squawk was right. Where did it go? Why one to midnight?', { promise: 'c_vesper_page' }],
    ],

    // ---- the lighthouse's own story keys. Each replaces the old STORY[key] in place, so x1_dun_b plays these.
    c_light_in: [
      ['c_pearl', 'My lighthouse, the first one on this coast. Before it, ships found the rocks by bumping into them.', 'My lighthouse. Before it, ships found rocks by bumping into them.'],
      ['c_pearl', "Moths have got into my light. They'll circle a candle all night, but a proper beam sends them running.", 'Moths got into my light. A real beam makes them run.'],
      ['c_pearl', 'My little lens still turns, see? When the beam comes round, the moth webs shrivel. When it goes, the shadows come back. Use both.', 'Light shrinks the moth webs. Then shadows come back. Use both.'],
    ],
    c_light_shrine: [
      ['c_pearl', 'My lens room. Six winters it took me to grind that glass. I sat up here most nights after, watching the beam go round.', 'My lens room. I ground that glass myself. Six winters.'],
      ['c_pearl', "A light that strong throws shadows a mile long. I used to curse them. Then one night I stepped into one, and came out at the far end.", 'Strong light makes long shadows. One night I stepped into one.'],
      ['c_pearl', "And the girl in the grey cloak, up and down my stairs? She's one of mine. Claws, no fire, a cold house. I know how that goes. Go easy on her.", 'The girl in grey is my family. No fire, a cold house. Go easy on her.'],
    ],
    c_light_gift: [
      ['narr', 'The little lens turns, and its beam sweeps across you. Behind you, your own shadow stretches long across the floor. Then it moves. On its own. It waves.', 'The beam sweeps over you. Your shadow stretches out. Then it waves at you!'],
      ['narr', "You step forward, and you're standing where your shadow's head was, three steps away, without taking the steps.", 'You step, and you are suddenly three steps away.'],
      ['c_pearl', "The Shadow Dash! Dash, and for a moment you're a shadow. Moth curtains can't catch you. Nobody looking for you can see you.", 'The Shadow Dash! Dash and you become a shadow. Moth curtains cannot stop you.'],
      ['c_pearl', "Start your dash inside a shadow and you'll ride it all the way to the far end. Over gaps, if the shadow's long enough.", 'Dash from a shadow to ride it. Even over gaps!'],
      ['c_pearl', 'Those bars are made of shadow. They only let a shadow through in the dark. Wait for the beam to pass.', 'Shadow bars let you through only in the dark.'],
      ['ash', 'Mom is never going to find me at bedtime again.', 'Mom will never find me at bedtime!'],
      { if: 'flag pip', then: [
        ['narr', 'Pip pounces on your new shadow. It slides away. He pounces again, and lands on your foot.', 'Pip pounces on your shadow. He lands on your foot.'] ] },
    ],
    c_gloomwing_intro: [
      ['narr', "The Lamp Room is dark. Something huge and soft is wrapped around the great lamp like a scarf. Two enormous eyes open on its wings. Then two more. They're not eyes. They're worse.", 'A huge soft moth wraps the lamp. Big eyes open on its wings.'],
    ],
    c_light_won: [
      ['narr', 'The beam hits the Gloomwing full on. All the grey dust slides off its wings like snow, and underneath they are gold. The dust was never its own.', 'The beam hits it. The grey dust falls off. Its wings are gold underneath!', { clue: 'l_lamp_moths' }],
      ['c_pearl', 'Gold underneath. Somebody dusted it grey and set it on my lamp, like a lid on a pot.', 'Gold underneath! Someone dusted it and put it on my lamp.'],
    ],
    c_light_end: [
      ['c_pearl', "That's the last of my places. Claws, tail, shadow: I left them for whoever came next. I hoped it would be family. It is. Now light my lamp.", "My last place. I'm glad it was family. Light my lamp."],
    ],
  },

  talk: {
    c_mo: [
      { if: '!solved who_cut !flag c_bridge', say: ["Crabs, I tell you. Admiral Pinch has hated that bridge for forty years.", 'Crabs did it. I am sure.'] },
      { if: 'solved who_cut !flag c_bridge', once: true,
        say: ["Not crabs? Squawk told the whole market. Twice. I've sent the crew out with new rope.", 'Not crabs? Squawk told everyone. My crew will fix it.'] },
    ],
    c_agatha: [
      { if: 'flag c_agatha !flag c_light_done', say: ['Squawk wants to know why you are still down here. So do I.', 'Squawk asks why you are still here. So do I.'] },
      { if: 'flag c_light_done', say: ['My light is back. Squawk, say thank you to the dragon. ...He says something about a house. That means thank you.', 'My light is back! Squawk says thank you.'] },
    ],
  },
})
