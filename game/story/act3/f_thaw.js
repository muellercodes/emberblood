// game/story/act3/f_thaw.js (A3a): Act III, Chapter 3, "One Thaw at a Time".
// What the player does: Rimeholm froze in one night, every person in it. Somebody must have SEEN what did it. Ash plays
// detective in a frozen village: Saga froze looking UP, not at her fish; the bell rope froze mid-pull (someone rang the
// alarm, so someone shouted first); a red yarn hangs frozen down the bell tower from the very top; little Bo froze on
// the chapel roof pointing up (a red herring: he looked when the bell rang). The chapel's carving shows a dragon round
// a snowflake: SHE SLEEPS ON THE MOUNTAIN SO THE WINTERS STAY SMALL. The player works out who saw it (the knitter at
// the top of the tower), climbs up, and looks through her spyglass at Mount Dread: the storm puffs out, stops, puffs
// out, like breathing in your sleep, and something long and white lies curled on the summit. The player works out
// what is making the blizzard (a dragon, asleep), and wakes the knitter with Blaze: Grandmother Ylva. (v11) She does
// not name the dragon any more: she saw the white moth, shouted, heard the bell, and watched the moth turn at the sound
// of it (Hush's reason, paid off at the Drum Stone), and the mountain "has been snoring ever since". The name Glaciar,
// and the aunt, come with the snow_mother solve on the Crown. She gives Ash her long red scarf and points him east to
// the Wind Monks of Skyreach. Tove knows the white one from her Frost Ward (Act I) and will not be the one to say it.
// x2_story.js still runs two things here by itself (f2sTick): the arrival lines when Ash first comes near Rimeholm
// (the old STORY key f_rime_arrive, this file's text) and, once Ylva is thawed, its own ending of the stage (the old
// key f_ylva, empty here, then XP, coins, Ylva's quest offer and the move to f_sky). So the thaw is the chapter's last
// step: everything else comes before it, and Ylva's wake-up scene plays as soon as she thaws, whenever that is.
// Old flags kept: f_ylva, f_thaw_ylva / f_thaw_f_ylva (p3 and x2_world set them), f_rime_offered (x2_story's offer).
chapter({
  id: 'f_thaw', act: 3, after: 'f_kindle', next: 'f_sky', takeover: true,
  card: ['Act III · Chapter 3', 'One Thaw at a Time'],
  so_far: [
    "The Great Hearth burns blue again. But Rimeholm, the fishing village on the sea cliffs, went quiet the night the moth flew over, and nobody in Hearthold has heard from it since.",
    'The Hearth burns again. But Rimeholm went quiet. Nobody has heard from it.'],
  mom: [['A whole frozen village? Take them soup. Take them ALL soup.', 'A frozen village? Take them soup!']],
  // (x2_story's Tove nudge at the foot of the tower names the granny on top; the engine marks it seen once it can)
  silence: ['f_nudge_tower'],

  item: {
    f3_scarf: { name: ["Ylva's Long Scarf", "Ylva's Long Scarf"],
      desc: ['Red, very long, and still a little bit frosty. Ylva knitted it for the coldest place in the north.',
        'A very long red scarf from Ylva.'],
      icon: 'icon_yarn', keepsake: true },
  },

  place: {
    // the frozen folk's own prompt is p3_frost's (it only says "frozen"): these two let Ash look closely, while the
    // clue is not found yet and they are still frozen (Saga stands on the quay; Bo is on the chapel roof, looked at
    // from the lane below)
    f3_saga_look: { map: 2, at: [1150, 46900], r: 20, kind: 'examine', h: 66,
      name: ['Saga the fisher, frozen on the quay', 'the frozen fisher girl'], prompt: ['Look closely at the fisher girl', 'Look at the fisher girl'],
      say: 'f3_saga', if: 'stage>=f_thaw !flag f_thaw_f_saga !clue f3_looking_up' },
    f3_bo_look: { map: 2, at: [1716, 46668], r: 46, kind: 'examine', h: 70,
      name: ['Little Bo, frozen on the chapel roof', 'the boy on the roof'], prompt: ['Look at the boy on the roof', 'Look at the boy on the roof'],
      say: 'f3_bo', if: 'stage>=f_thaw !flag f_thaw_f_bo !clue f3_bo_points' },
    // the red yarn at the foot of the tower's south face, left of the frozen door (it climbs the face to the top)
    f3_yarn_spot: { map: 2, at: [1886, 46904], r: 20, kind: 'examine', look: 'red_yarn', h: 60,
      name: ['a red yarn hanging down the tower', 'a red yarn'], aliases: ['the yarn', 'the red wool'],
      prompt: ['Look at the red yarn', 'Look at the red yarn'], say: 'f3_yarn_look', if: 'stage>=f_thaw' },
    // on top of the bell tower (level 3), at the front of the bell's roof, so its prompt only shows from up there
    f3_spyglass: { map: 2, at: [1925, 46797], r: 8, kind: 'examine', look: 'spyglass', h: 54,
      name: ["the knitter's spyglass", 'the spyglass'], aliases: ['the spyglass', 'the telescope'],
      prompt: ['Look through the spyglass', 'Look through the spyglass'], say: 'f3_spyglass_look', if: 'stage>=f_thaw' },
    // what Ylva's spyglass shows on the Crown of Dread: the sleeping dragon (from f_dread on, A3b's f3_glaciar_coil
    // draws her there, so this one is only up to then)
    f3_glaciar_asleep: { map: 2, at: [7300, 41290], kind: 'prop', look: 'f3_glaciar_asleep',
      name: ['something long and white, asleep on the summit', 'something asleep on the summit'], if: 'stage>=f_thaw stage<f_dread' },
    // the chapel's carved front, on its west half (x2_world paints the dragon round the snowflake there; Bo's spot is
    // the east half, so each has its own place to stand)
    f3_chapel_spot: { map: 2, at: [1650, 46738], r: 20, kind: 'examine', h: 40,
      name: ['the carving on the chapel', 'the chapel carving'], aliases: ['the dragon carving', 'the chapel'],
      prompt: ['Look at the chapel carving', 'Look at the carving'], say: 'f3_chapel_look', if: 'stage>=f_thaw' },
  },

  clue: {
    f3_looking_up: { icon: 'eye',
      text: ['Saga the fisher froze with a fish on her line. But she is not looking at her fish. She froze looking UP.',
        'Saga froze looking UP, not at her fish.'] },
    f3_alarm_rope: { icon: 'rope',
      text: ['The bell rope froze mid-pull. Somebody rang the alarm, so somebody saw it coming and shouted first.',
        'Somebody rang the alarm. Somebody shouted first.'] },
    f3_yarn: { icon: 'icon_yarn',
      text: ['A red yarn hangs frozen down the bell tower, all the way from the very top. Somebody was knitting up there.',
        'A red yarn hangs from the top of the tower.'] },
    f3_bo_points: { icon: 'claw', herring: true,
      text: ['Little Bo froze on the chapel roof, pointing up at the sky with a snowball in his hand.',
        'Bo froze on the roof, pointing up.'] },
    f3_chapel: { icon: 'icon_snowflake',
      text: ['The chapel carving: a dragon curled round a snowflake. SHE SLEEPS ON THE MOUNTAIN SO THE WINTERS STAY SMALL.',
        'A carved dragon: SHE SLEEPS ON THE MOUNTAIN SO THE WINTERS STAY SMALL.'] },
    f3_spyglass: { icon: 'icon_spyglass',
      text: ['Through the spyglass: the storm on Mount Dread puffs out, stops, and puffs out again, like breathing. Something long and white lies curled up on top.',
        'The storm puffs out and stops, like breathing. Something white is curled up on top.'] },
  },

  deduce: {
    who_saw: {
      mystery: 'long_winter',
      ask: ['Who in Rimeholm saw what froze the village?', 'Who saw what froze Rimeholm?'],
      needs: ['f3_looking_up', 'f3_alarm_rope', 'f3_yarn'],
      pick: [
        { t: ['Whoever sat highest: the knitter on top of the bell tower', 'The knitter on top of the tower'], right: true },
        { t: ['Tollef the bellringer', 'Tollef the bellringer'],
          hint: ['Tollef is inside, at the bottom of the tower. He rang the bell when somebody shouted. Could he see the sky from there?',
            'Tollef is inside the tower. Could he see the sky?'] },
        { t: ['Little Bo on the chapel roof', 'Little Bo'],
          hint: ['Bo looked up when the bell rang, like everyone. Who saw it before the bell? Follow the yarn.',
            'Bo looked when the bell rang. Who saw it first?'] },
      ],
      then: ['xp 150'],
    },
    what_storm: {
      mystery: 'long_winter',
      ask: ['What is making the blizzard on Mount Dread?', 'What makes the storm on Mount Dread?'],
      needs: ['f3_moth_flew', 'f3_chapel', 'f3_spyglass'],
      // (bonus: A3S's f3_ring_scale (the Moon Ring gate), f3_mumble_echo (q_f_mumble), f3_juniper_map (q_f_juniper))
      bonus: ['f3_moth_north', 'f3_storm_hums', 'f3_ring_scale', 'f3_mumble_echo', 'f3_juniper_map'],
      pick: [
        { t: ['A dragon, asleep on the summit, breathing cold in her sleep', 'A sleeping dragon, breathing snow'], right: true },
        { t: ['The white moth', 'The white moth'],
          hint: ['The moth froze Rimeholm in one wingbeat, then flew on to the mountain. This storm breathes in and out.',
            'The moth flew on. This storm breathes.'] },
        { t: ['The mountain itself', 'The mountain'],
          hint: ["Mountains don't snore. Look through the spyglass again.", "Mountains don't snore. Look again."] },
      ],
      then: ['xp 200'],
    },
  },

  step: [
    // (x2_story plays the arrival, the old key f_rime_arrive, when Ash first comes within 600 px of the village)
    // (then: Brynja's clue, for a save made by the old code after f_hearth, which never found it; already found, it
    // changes nothing)
    { id: 'rime', do: 'goto f_rimeholm 520', then: ['clue f3_moth_flew'],
      obj: ['Go to Rimeholm and find out what happened', 'Go to Rimeholm'],
      hint: ['Rimeholm is out the West Gate and along the Rim Road, on the sea cliffs.', 'Rimeholm is on the sea cliffs. Take the Rim Road.'] },
    { id: 'look', do: 'all', obj: ['Find out who saw what froze Rimeholm', 'Who saw it happen?'],
      hint: ['Look at the frozen people. Look at the bell rope by the tower door. Look up. And look at the chapel: chapels remember things.',
        'Look at the people, the bell rope and the chapel.'],
      parts: [
        { do: 'examine f3_saga_look', then: ['clue f3_looking_up'] },
        { do: 'examine f_lm_bell', scene: 'f3_rope', then: ['clue f3_alarm_rope'] },
        { do: 'examine f3_yarn_spot', then: ['clue f3_yarn'] },
        { do: 'examine f3_chapel_spot', then: ['clue f3_chapel'] },
      ],
      extra: [
        { do: 'examine f3_bo_look', then: ['clue f3_bo_points'] },
        // Ylva wakes whenever she is thawed while this chapter runs (her scene, her scarf), even before the questions
        { do: 'wait_for event beat:ylva', if: 'near f_bell_tower 420', scene: 'f3_ylva_wake' },
      ] },
    { id: 'who', do: 'any', obj: ['Work out who saw it, in the Case Book', 'Open the Case Book'],
      parts: [
        { do: 'deduce who_saw', scene: 'f3_who_saw' },
        { do: 'wait_for flag f_ylva' },
      ] },
    { id: 'spy', do: 'examine f3_spyglass', then: ['clue f3_spyglass'],
      obj: ['Climb the bell tower to the knitter', 'Climb the bell tower'],
      hint: ['Climb the bell tower with your claws. The knitter sits on top, by her spyglass.', 'Climb the tower with your claws.'] },
    { id: 'storm', do: 'deduce what_storm', obj: ['Work out what is making the storm, in the Case Book', 'Open the Case Book'] },
    { id: 'wake', do: 'wait_for event beat:ylva', at: 'f_ylva_ice', then: ['set f_ylva', 'stage f_sky'],
      obj: ['Wake the knitter with Blaze', 'Wake the knitter with blue fire'],
      hint: ['Stand by the frozen knitter on top of the tower and hold your fire breath until it burns blue.',
        'Hold blue fire on the knitter.'] },
  ],

  scene: {
    // (an old STORY key: x2_story plays it by itself near Rimeholm, from f_kindle on; 6 lines, nobody named)
    f_rime_arrive: [
      ['narr', 'Rimeholm, a fishing village on the cliffs above the frozen sea. Ice covers every roof and every window, and every person in the street.',
        'Rimeholm, on the cliffs. Ice covers everything. Even the people.'],
      ['narr', 'On the quay a fisher girl stands with her line cast out, frozen solid. The fish on her line is frozen in mid-air, looking extremely surprised.',
        'A fisher girl is frozen on the quay. Her fish is frozen in the air.'],
      ['tove', 'The whole village froze, Ash. All at once, by the look of it.', 'The whole village froze at once.'],
      ['ash', 'Can I thaw them?'],
      ['tove', 'One at a time, I think. But first: somebody here must have seen what did this. Who?', 'One at a time. But somebody here saw it. Who?'],
      ['ash', 'Then I will find out who. Detective Ash.', 'I will find out. Detective Ash!'],
    ],
    // (an old STORY key: x2_story plays it once Ylva thaws, then its own ending. Empty: f3_ylva_wake is her scene.)
    f_ylva: [],
    f3_saga: [
      ['narr', 'Saga the fisher, frozen with her rod bent and a fish in mid-flop.', 'Saga is frozen with a fish on her line.'],
      ['narr', 'But she is not looking at her fish. Her eyes are turned UP, at the sky.', 'But she is not looking at the fish. She is looking UP.', { clue: 'f3_looking_up' }],
      ['ash', "A fisher who isn't looking at her fish? Something up there must have been BIG.", "She's not looking at her fish! Something up there was big."],
    ],
    f3_rope: [
      ['narr', 'The bell rope is frozen stiff, pulled halfway down. Somebody was ringing the alarm when the frost hit.',
        'The rope froze halfway down. Somebody rang the alarm.', { clue: 'f3_alarm_rope', ref: 'f_lm_bell' }],
      ['ash', "You only ring the alarm if somebody shouts first. So somebody SAW it coming.", 'Somebody shouted first. Somebody SAW it.'],
    ],
    f3_yarn_look: [
      ['narr', 'A red yarn hangs down the front of the bell tower, frozen stiff as a stick.', 'A red yarn hangs down the tower, frozen stiff.'],
      ['narr', 'You follow it up with your eyes. It comes all the way down from the very top.', 'It comes down from the very top.', { clue: 'f3_yarn', ref: 'f_bell_tower' }],
      ['ash', 'Somebody was knitting up there, right on top of the tower, in all that wind?', 'Somebody was knitting on top of the tower!'],
    ],
    f3_bo: [
      ['narr', 'Little Bo, frozen on the chapel roof with a snowball in one hand. The other hand points straight up at the sky.',
        'Bo is frozen on the roof. He points up at the sky.', { clue: 'f3_bo_points' }],
      ['ash', "He saw it too. Did he see it first?", 'He saw it too. First?'],
    ],
    f3_chapel_look: [
      ['narr', 'Carved over the chapel door: a dragon curled round a snowflake, fast asleep.', 'A carving: a dragon curled round a snowflake, asleep.'],
      ['narr', 'Under it, worn smooth by a hundred winters: SHE SLEEPS ON THE MOUNTAIN SO THE WINTERS STAY SMALL.',
        'Under it: SHE SLEEPS ON THE MOUNTAIN SO THE WINTERS STAY SMALL.', { clue: 'f3_chapel', ref: 'f_crown' }],
      ['tove', 'Keeps the winters small. That is a kind way to say she slept.', 'Small winters. A kind way to say she slept.'],
    ],
    f3_who_saw: [
      ['ash', 'Saga looked up. Somebody shouted before the bell rang. And somebody was knitting right at the very top.', 'Saga looked up. Somebody shouted. Somebody was on top.'],
      ['ash', 'Whoever shouted had the best seat in Rimeholm.', 'The one on top had the best seat.', { ref: 'f_bell_tower' }],
      ['tove', "Climb carefully. If you fall, I fall, and I'd rather not.", 'Climb carefully!'],
    ],
    // on top of the tower: the camera goes to the summit of Mount Dread
    f3_spyglass_look: [
      ['narr', "A brass spyglass on a little stand, frozen pointing at Mount Dread. You put your eye to it.", 'A spyglass, pointing at Mount Dread. You look.'],
      { cam: 'f3_glaciar_asleep', s: 1.8, k: 1 }, { wait: 1.6 },
      ['narr', 'The summit. The purple storm puffs out... and stops. Then puffs out again. Slow, like someone breathing in their sleep.',
        'The storm puffs out. It stops. It puffs again. Like breathing.', { clue: 'f3_spyglass', ref: 'f_crown' }],
      ['narr', 'And on the very top, curled up like a cat, something long and white.', 'Something long and white is curled up on top.', { ref: 'f3_glaciar_asleep' }],
      ['ash', 'Tove. The mountain is breathing.', 'Tove. The mountain is breathing.'],
      ['tove', "...I know what that is. You work it out, Ash. I don't want to be the one who says it.", "I know what it is. You say it. I won't."],
    ],
    // Ylva wakes (9 lines on every branch): played by this chapter whenever she thaws. She saw the moth and heard the
    // bell; she does not name the dragon (v11). The scarf, the pointer.
    f3_ylva_wake: [
      { if: '!flag f_ylva', then: [
        ['narr', 'The ice on the old woman goes soft, then slushy, then drips away. She blinks. She looks down at her knitting.',
          'The ice melts away. The old woman blinks at her knitting.'],
        ['f_ylva', "Oh, bother. I dropped a stitch. Hello, dear. I wasn't frozen. I was resting my eyes.", "Oh, bother. A dropped stitch. I was just resting my eyes, dear."]],
        else: [
        ['narr', 'Grandmother Ylva rocks in her chair on top of the tower, knitting something very long and very red.', 'Grandmother Ylva sits on the tower, knitting.'],
        ['f_ylva', "There's my warm one. Sit down, dear. Mind the wool.", "There's my warm one. Sit, dear."]] },
      ['f_ylva', 'I saw it, you know. A white moth, wider than this tower is tall, coming in off the sea.', 'I saw it. A white moth, wider than this tower is tall.'],
      ['f_ylva', 'I shouted down to Tollef, and Tollef rang the bell. The moth turned right round at the sound of it. Then everything went quiet.',
        'I shouted. Tollef rang the bell. The moth turned. Then all went quiet.', { ref: 'f_lm_bell' }],
      ['f_ylva', 'And that mountain has been snoring ever since.', 'And the mountain has snored ever since.', { ref: 'f_crown' }],
      { if: 'solved what_storm', then: [
        ['ash', "It isn't snoring. There's a dragon up there, breathing the winter out in her sleep.", 'A dragon up there breathes the winter out.'],
        ['f_ylva', 'Is there, now? Well. That explains the snoring.', 'Is there? That explains the snoring.']],
        else: [
        ['ash', "Mountains don't snore. Something up there is breathing.", "Mountains don't snore. Something is breathing."],
        ['f_ylva', 'Then you go and find out what, dear. Politely.', 'Then go and find out what. Politely.']] },
      ['f_ylva', "Here. Take my long scarf. I knitted it for the coldest place there is, and that's where you're going.",
        'Take my long scarf. You are going somewhere cold.', { do: ['give f3_scarf'] }],
      ['f_ylva', 'Nobody climbs Mount Dread in that storm. The Wind Monks of Skyreach went up every spring. East, dear. Past the Windscour.',
        'The Wind Monks of Skyreach went up every spring. East, past the Windscour.', { dir: ['f_rimeholm', 'f_skyreach', 'east'], promise: 'f_skyreach' }],
    ],
  },
})
