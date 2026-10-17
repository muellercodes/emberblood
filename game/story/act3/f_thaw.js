// game/story/act3/f_thaw.js (A3a): Act III, Chapter 3, "One Thaw at a Time".
// What the player does: Rimeholm froze in one night, every person in it. Somebody must have SEEN what did it. Ash plays
// detective in a frozen village: Saga froze looking UP, not at her fish; the bell rope froze mid-pull (someone rang the
// alarm, so someone shouted first); a red yarn hangs frozen down the bell tower from the very top; little Bo froze on
// the chapel roof pointing up (a red herring: he looked when the bell rang). The chapel's carving shows a dragon round
// a snowflake: SHE SLEEPS ON THE MOUNTAIN SO THE WINTERS STAY SMALL. The player works out who saw it (the knitter at
// the top of the tower), climbs up, and looks through her spyglass at Mount Dread: the storm puffs out, stops, puffs
// out, like breathing in your sleep, and something long and white lies curled on the summit. The player works out
// what is making the blizzard (a dragon, asleep), and wakes the knitter with Blaze: Grandmother Ylva. She names the
// dragon Glaciar, sister of Vorlaxis, so Ash has an AUNTIE (giggle hiccups), gives him her long red scarf and points
// him east to the Wind Monks of Skyreach.
// x2_story.js still runs two things here by itself (f2sTick): the arrival lines when Ash first comes near Rimeholm
// (the old STORY key f_rime_arrive, this file's text) and, once Ylva is thawed, its own ending of the stage (the old
// key f_ylva, empty here, then XP, coins, Ylva's quest offer and the move to f_sky). So the thaw is the chapter's last
// step: everything else comes before it, and Ylva's wake-up scene plays as soon as she thaws, whenever that is.
// Old flags kept: f_ylva, f_thaw_ylva / f_thaw_f_ylva (p3 and x2_world set them), f_rime_offered (x2_story's offer).
chapter({
  id: 'f_thaw', act: 3, after: 'f_kindle', next: 'f_sky', takeover: true,
  card: ['Act III · Chapter 3', 'One Thaw at a Time'],
  so_far: [
    "Rimeholm froze in one night when the great moth flew over. Ash worked out that the knitter on top of the bell tower saw it first, and through her spyglass he saw something asleep on Mount Dread, breathing out the storm. He woke her: Grandmother Ylva. The sleeper is Glaciar, the ice dragon. Ash's great-great-many-times AUNTIE.",
    'Ash woke Grandmother Ylva in frozen Rimeholm. The dragon on Mount Dread is Glaciar. His AUNTIE!'],
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
    f3_bo_look: { map: 2, at: [1700, 46660], r: 40, kind: 'examine', h: 70,
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
    // the chapel's carved front (x2_world paints the dragon round the snowflake on it)
    f3_chapel_spot: { map: 2, at: [1662, 46736], r: 22, kind: 'examine', h: 40,
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
      bonus: ['f3_moth_north', 'f3_storm_hums'],
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
      ['narr', 'Rimeholm, a fishing village on the cliffs above the frozen sea. Every house is white. Every window is white. Every person is white.',
        'Rimeholm, on the cliffs. Everything is white. Even the people.'],
      ['narr', 'On the quay a fisher girl stands with her line cast out, frozen solid. The fish on her line is frozen in mid-air, looking extremely surprised.',
        'A fisher girl is frozen on the quay. Her fish is frozen in the air.'],
      ['tove', 'The whole village. Frozen in one night.', 'The whole village froze in one night.'],
      ['ash', 'Can I thaw them?'],
      ['tove', 'One at a time, I think. But first: somebody here must have SEEN what did this. Who?', 'One at a time. But somebody here SAW it. Who?'],
      ['ash', 'Then I will find out who. Detective Ash.', 'I will find out. Detective Ash!'],
    ],
    // (an old STORY key: x2_story plays it once Ylva thaws, then its own ending. Empty: f3_ylva_wake is her scene.)
    f_ylva: [],
    f3_saga: [
      ['narr', 'Saga the fisher, frozen with her rod bent and a fish in mid-flop.', 'Saga is frozen with a fish on her line.'],
      ['narr', 'But she is not looking at her fish. Her eyes are turned UP, at the sky.', 'But she is not looking at the fish. She is looking UP.', { clue: 'f3_looking_up' }],
      ['ash', "Something up there was more interesting than a fish. That's a LOT.", 'Something up there beat a fish!'],
    ],
    f3_rope: [
      ['narr', 'The bell rope is frozen stiff, pulled halfway down. Somebody was ringing the alarm when the frost hit.',
        'The rope froze halfway down. Somebody rang the alarm.', { clue: 'f3_alarm_rope', ref: 'f_lm_bell' }],
      ['ash', "You only ring the alarm if somebody shouts first. So somebody SAW it coming.", 'Somebody shouted first. Somebody SAW it.'],
    ],
    f3_yarn_look: [
      ['narr', 'A red yarn hangs down the front of the bell tower, frozen stiff as a stick.', 'A red yarn hangs down the tower, frozen stiff.'],
      ['narr', 'You follow it up with your eyes. It comes all the way down from the very top.', 'It comes down from the very top.', { clue: 'f3_yarn', ref: 'f_bell_tower' }],
      ['ash', 'Somebody was knitting up there. On TOP of the tower. In the wind.', 'Somebody was knitting on top of the tower!'],
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
      ['tove', "A dragon on the mountain. Small winters. This winter isn't small, Ash.", "This winter isn't small, Ash."],
    ],
    f3_who_saw: [
      ['ash', 'Everybody looked up. Somebody shouted. And somebody was knitting at the very top.', 'Everyone looked up. Somebody shouted. Somebody was on top.'],
      ['tove', 'The knitter on top of the bell tower! She had the best seat in Rimeholm.', 'The knitter on top of the tower! The best seat.', { ref: 'f_bell_tower' }],
      ['tove', 'Climb up, Ash. Carefully. I am not good with up.', 'Climb up. Carefully.'],
    ],
    // on top of the tower: the camera goes to the summit of Mount Dread
    f3_spyglass_look: [
      ['narr', "A brass spyglass on a little stand, frozen pointing at Mount Dread. You put your eye to it.", 'A spyglass, pointing at Mount Dread. You look.'],
      { cam: 'f_crown', s: 1.6 },
      ['narr', 'The summit. The purple storm puffs out... and stops. Then puffs out again. Slow, like someone breathing in their sleep.',
        'The storm puffs out. It stops. It puffs again. Like breathing.', { clue: 'f3_spyglass', ref: 'f_crown' }],
      ['narr', 'And on the very top, curled up like a cat, something long and white.', 'Something long and white is curled up on top.'],
      ['ash', 'Tove. The mountain is BREATHING.', 'Tove. The mountain is BREATHING.'],
      ['tove', "Before you wake her up, Ash, work out what that is. I want to know before she does.", 'Work out what that is first.'],
    ],
    // Ylva wakes (10 lines on every branch): played by this chapter whenever she thaws, the scarf, the pointer
    f3_ylva_wake: [
      { if: '!flag f_ylva', then: [
        ['narr', 'The ice on the old woman goes soft, then slushy, then drips away. She blinks. She looks down at her knitting.',
          'The ice melts away. The old woman blinks at her knitting.'],
        ['f_ylva', "Oh, bother. I dropped a stitch. Hello, dear. I wasn't frozen. I was resting my eyes.", "Oh, bother. A dropped stitch. I was just resting my eyes, dear."]],
        else: [
        ['narr', 'Grandmother Ylva rocks in her chair on top of the tower, knitting something very long and very red.', 'Grandmother Ylva sits on the tower, knitting.'],
        ['f_ylva', "There's my warm one. Sit down, dear. Mind the wool.", "There's my warm one. Sit, dear."]] },
      ['f_ylva', 'I saw it, you know. A white moth, big as a barn. I shouted to Tollef, he rang the bell, and then everything went quiet.',
        'I saw it. A white moth, big as a barn. I shouted. Then everything went quiet.'],
      { if: 'solved what_storm', then: [
        ['ash', 'It flew to Mount Dread. And now a dragon up there is breathing snow in her sleep!', 'A dragon up there is breathing snow!'],
        ['f_ylva', "Clever dear. That's Glaciar, the ice dragon. Sister of the loud fire dragon on Cinder Mountain. Vorla-something.",
          "Clever dear. That's Glaciar. Sister of the fire dragon. Vorla-something.", { ref: 'cinder_mountain' }]],
        else: [
        ['ash', 'What is breathing that storm out on Mount Dread?', 'What makes that storm?'],
        ['f_ylva', 'A dragon, dear. Glaciar, the ice dragon, fast asleep. Sister of the loud fire dragon on Cinder Mountain. Vorla-something.',
          'A dragon, dear. Glaciar. Sister of the fire dragon. Vorla-something.', { ref: 'cinder_mountain' }]] },
      ['ash', 'VORLAXIS? He is my great (times thirteen) grandpa. So she is my... great (times thirteen) grand-AUNT?',
        'Vorlaxis is my grandpa (x13). So she is my... AUNT?'],
      ['tove', 'Technically, yes.', 'Yes. Technically.'],
      ['ash', "I have an AUNTIE! A DRAGON made of ICE! Will she pinch my cheeks? With CLAWS? Ha! Ha ha! (hiccup) Sorry. (hiccup) Giggle hiccups.",
        'I have an AUNTIE! A DRAGON of ICE! Ha ha! (hiccup) Giggle hiccups.'],
      ['f_ylva', "She might, dear. Aunties do. Here, take my long scarf. It's very cold where you are going.", 'She might, dear. Aunties do. Take my long scarf.',
        { do: ['give f3_scarf'] }],
      ['f_ylva', 'Nobody climbs Mount Dread in that storm. The Wind Monks of Skyreach went up every spring. East, dear. Past the Windscour.',
        'The Wind Monks of Skyreach went up every spring. East, past the Windscour.', { dir: ['f_rimeholm', 'f_skyreach', 'east'], promise: 'f_skyreach' }],
    ],
  },
})
