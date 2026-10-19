// game/story/act5/n_stair.js (N5a): the Finale's first ring, "The Ember Stair". Takes over x4_story's stage n_stair.
// What the player does: skims up the Sluice and drops the drawbridge, breaks the cracked wall, flies up the Updraft
// Terraces (x4_ascent's puzzles, read here through their flags), meets Grandma Ember's ghost voice at her Trials and
// takes her three memory flames. Beside the Echo Gate stands Ember's old flame stone: by each flame mark she carved a
// tiny moth with two pale moons, the same moth as on the fourth post at the green (clue), and Ember remembers the
// little grey moth that sat on her lantern every Lantern Day (clue), that she named her, and that she grew up, stopped
// climbing the hill and forgot her (her regret; the name is the hook for ring 2). Ash says what the moth is, and the
// scene solves n5_who_moth (v11: no quiz). Then the Echo of the First Flame on the Shadow Throne, the first fear
// ("Mine."). After the fight (n_clocks) the throne holds a grey moth scale: a red herring (too big for Ember's moth).
// With the Spark of a resting Cindervane: his real helmet on a rock just before the Echo Gate (it was invisible).
// Data only. Still x4 code: the puzzles (x4_ascent), the flame lines and n_trials_done (x4_ascent plays them through
// n4sBeat('flame'); their data versions are below), the echo fight with its intro and outro (x4_foes), the stage step
// to n_clocks after the win (x4_foes).
chapter({
  id: 'n_stair', act: 5, after: 'n_bridge', next: 'n_clocks', takeover: true,
  card: ['Finale · The First Ring', 'The Ember Stair'],
  so_far: [
    "The peak is made of the moon's memories, and the moon saw everything Ash ever did at night. The first ring is a dark copy of Embermere: Ember's Trials, a shadow throne, and little moths carved where nobody looks.",
    'The mountain is made of the moon\'s memories. The first ring looks like home.'],

  item: {
    // x4_story's own item (ITEM_NAMES n_spark): its first-hit block in every peak boss fight reads G.items.n_spark
    n_spark: { name: ["Cindervane's Spark", "Cindervane's Spark"],
      desc: ["One small spark from Sir Cindervane's helmet. It never went out. It blocks the first hit in a big fight.", 'A spark from the knight. It blocks a hit.'],
      icon: 'fire' },
  },

  place: {
    // Ember's flame stone, on the approach side of the Echo Gate (art: v10_art5a.js n5a_flame_stone)
    n5_flame_stone: { map: 4, at: [5110, 81462], r: 30, kind: 'examine', look: 'n5a_flame_stone', say: 'nst_stone',
      name: ['the old flame stone by the Echo Gate', 'the old flame stone'], aliases: ['the flame stone', "Ember's flame stone"] },
    // Sir Cindervane's real helmet on a rock just before the Echo Gate (only when he was laid to rest in Act I)
    n5_helmet: { map: 4, at: [5269, 81581], r: 26, kind: 'examine', look: 'n5a_helmet', if: 'choice cinder=rest !item n_spark', say: 'n_helmet',
      name: ["Sir Cindervane's helmet", 'the knight\'s helmet'], prompt: ["Look at the knight's helmet", 'Look at the helmet'] },
    // the Shadow Throne at the north rim of the Echo 1 arena (the text always said there was one; now it is drawn)
    n5_shadow_throne: { map: 4, at: [4500, 81150], kind: 'prop', look: 'n5a_throne', name: ['the Shadow Throne', 'the shadow throne'] },
    // after Echo 1: a grey moth scale on the empty throne (the red herring of "who is the little grey moth")
    n5_grey_scale: { map: 4, at: [4500, 81176], r: 26, kind: 'examine', look: 'n5a_grey_scale', show: 'flag n_echo1_done', say: 'nst_scale',
      name: ['the grey scale on the throne', 'the grey scale'] },
    // the Silent Green (optional, past the arena): the copy of the village well, carved with the old saying
    n5_well: { map: 4, at: [941, 85262], r: 40, kind: 'examine', say: 'nst_well', h: 40,
      name: ['the old well in the Silent Green', 'the old well'], prompt: ['Look at the old well', 'Look at the well'] },
  },

  clue: {
    n5_flame_moths: { icon: 'moth', mystery: 'night_mother',
      text: ["By each flame mark on Ember's old stone at the Echo Gate is the same tiny moth with two pale moons. The carvings are very old.",
        'The same tiny moth is carved by each flame. Very old.'] },
    n5_ember_moth: { icon: 'lamp', mystery: 'night_mother',
      text: ['Ember: every Lantern Day a little grey moth sat on her lantern. Iska said the moth rode down on a moonbeam. Then Ember grew up, and stopped climbing the hill.',
        'A little grey moth sat on Ember\'s lantern. She came on a moonbeam.'] },
    n5_grey_scale: { icon: 'moth', mystery: 'night_mother', herring: true,
      text: ['A grey moth scale as big as a plate, at the foot of the Shadow Throne, soft as dust: the Mother\'s, like her wings. Far too big for the little moth on Ember\'s lantern.',
        'A huge grey scale. The Mother\'s. Ember\'s moth was tiny.'] },
    // the Echo 1 outro memory (given when the next chapter starts: x4_foes plays the outro itself); N5b's n5_wants needs it
    n5_mem_grandpa: { icon: 'fire', mystery: 'night_mother',
      text: ['A memory from the Echo of the First Flame, in a sad young voice: "Ember? Is that you, up there with the lanterns?"',
        '"Ember? Is that you, with the lanterns?"'] },
  },

  deduce: {
    n5_who_moth: {
      mystery: 'night_mother',
      ask: ['Who is the little grey moth in every memory?', 'Who is the little grey moth?'],
      needs: ['n5_fourth_post', 'n5_flame_moths', 'n5_ember_moth'],
      pick: [
        { t: ["The moon's own little moth, from long, long ago", "The moon's little moth, from long ago"], right: true },
        { t: ["One of Hush's little white moths", "One of Hush's white moths"],
          hint: ['Hush\'s moths are white. The moth in the carvings is grey, with two pale moons, and the carvings are a thousand years old.', 'This moth is grey. The carvings are very old.'] },
        { t: ["A shadow made of Grandpa's fire", "A shadow of Grandpa's fire"],
          hint: ["Ember carved these moths when she was small. Grandpa's shadow only turned up today.", 'Ember carved them long ago. The shadow is new.'] },
      ],
      then: ['set n5_moth_known', 'xp 500',
        { banner: ["The little grey moth was the moon's.", "She was the moon's moth."], sub: ['And Ember gave her a name.', 'Ember named her.'] }],
    },
  },

  step: [
    { id: 'sluice', do: 'wait_for flag n_sluice', marker: 'n5_sluice', obj: ['Skim up the Sluice', 'Skim up the river'],
      extra: [
        { do: 'examine n5_helmet', if: 'choice cinder=rest !item n_spark' },
      ],
      hint: ['The river runs too fast to walk. Stride on the water and Skim. At the top, wake the crystal on its island to drop the drawbridge.',
        'Skim up the river. Hit the crystal.'] },
    { id: 'terrace', do: 'wait_for flag n_terrace', marker: 'n5_terrace', obj: ['Fly up the Updraft Terraces', 'Fly up the cliff'],
      hint: ['Smash the cracked wall, slip past the ink falls, then take off from the windy rock and fly up to the shelf.',
        'Break the wall. Fly up from the windy rock.'] },
    // Ember's ghost at the mouth of the Leap Court (or with the first flame, if a kid came in another way)
    { id: 'trials', do: 'any', obj: ["Find Ember's Trials along the ring", "Find Ember's Trials"], marker: 'n5_leap_court',
      parts: [
        { do: 'goto n5_leap_court', scene: 'n_trials' },
        { do: 'wait_for flag n_flames>=1', scene: 'n_trials' },
      ] },
    { id: 'leap', do: 'wait_for flag n_flames>=1', marker: 'n5_flame_leap', obj: ['Take the Leap flame (1 of 3)', 'Get the Leap flame'],
      hint: ['Jump the ink pits of the Leap Court, burn the shadow roots, and take the flame.', 'Jump the pits. Burn the roots.'] },
    { id: 'tide', do: 'wait_for flag n_flames>=2', marker: 'n5_flame_tide', obj: ['Take the Tide flame (2 of 3)', 'Get the Tide flame'],
      hint: ['At high tide, stand on the water and shoot the eye on the little isle.', 'At high tide, shoot the eye.'] },
    { id: 'sky', do: 'wait_for flag n_flames>=3', marker: 'n5_flame_sky', obj: ['Take the Sky flame (3 of 3)', 'Get the Sky flame'],
      hint: ['The Sky flame sits on an island in the void. The silver sparkles show where your wings work.', 'Fly to the island.'] },
    // (v11) the stone scene ends with Ash saying who the moth is; the scene and this step solve n5_who_moth, so n_clocks'
    // who_moth step finishes without a quiz (the act's migrate does the same for saves already past the stone)
    { id: 'stone', do: 'examine n5_flame_stone', then: ['clue n5_flame_moths', 'clue n5_ember_moth', 'solve n5_who_moth'], obj: ["Look at Ember's old flame stone by the Echo Gate", 'Look at the old stone'] },
    { id: 'echo', do: 'fight n_echo_vor', marker: 'n_echo_vor', obj: ['Face the Echo of the First Flame', 'Fight the shadow dragon'],
      hint: ['Past the Echo Gate, on the Shadow Throne. Light the braziers. Listen to Pip.', 'Light the braziers. Listen to Pip.'],
      then: ['stage n_clocks'] },
  ],

  scene: {
    n_trials: [
      ['ember', 'She copied my Trials too? I dug those courts with my own claws!', 'She copied my Trials? I made those!'],
      ['ash', 'Ember? You\'re here?', 'Ember? You are here?'],
      ['ember', "A little bit. The moon remembers me, so I'm in her mountain, like a song stuck in your head.",
        'A little bit. The moon remembers me.'],
      ['ember', "Three courts, three flames: Leap, Tide and Sky. You've done all of them before, on a mountain that was trying to kill you.", 'Three flames: Leap, Tide and Sky. You did them before.'],
      ['ember', 'And when you reach the Echo Gate, say hello to my old flame stone for me.', 'Say hello to my old stone at the gate.', { promise: 'n5_flame_stone' }],
    ],
    // the flames and the end of the Trials: x4_ascent plays these keys (STORY.n_flame_*, STORY.n_trials_done)
    n_flame_leap: [['ember', 'The Leap! You still jump like you mean it.', 'The Leap! Great jumping!']],
    n_flame_tide: [['ember', 'The Tide! Water never stood a chance.', "The Tide! The water can't stop you."]],
    n_flame_sky: [['ember', "The Sky! I haven't had wings in a thousand years, and I can still feel that one.", 'The Sky! I can feel it when you fly.']],
    n_trials_done: [
      ['ember', "That's all three. Up ahead there's a shadow on a throne with my father's face. It's only a memory.", 'All three! Up ahead is a shadow of my father. It is only a memory.'],
      ['ember', "It's him on his worst day. Don't let it tell you what you are.", 'It is him on his worst day. Do not believe it.'],
    ],
    // Ember's flame stone: the moth carvings and her memory of the little grey moth
    nst_stone: [
      { if: 'clue n5_ember_moth', then: [
        ['narr', 'Three flame marks, and by each one a tiny moth with two pale moons. Ember carved them long, long ago.', 'Three flames. A tiny moth by each one.'],
      ], else: [
        ['narr', 'An old flame stone stands by the Echo Gate. Next to each of its three flame marks, someone carved a tiny moth.', 'An old stone. A tiny moth is carved by each flame.', { ref: 'n5_echo_gate' }],
        ['narr', 'Each moth has two pale moons on its wings. The carvings are worn smooth. They are very, very old.', 'Each moth has two pale moons. They are very old.', { clue: 'n5_flame_moths' }],
        ['ash', "Two pale moons. Same as the moth on the fourth post.", 'Same as the moth on the fourth post.'],
        ['ember', 'I carved those when I was about your size. My claws were never very neat.', 'I carved those when I was little.'],
        ['ember', 'Every Lantern Day a little grey moth came and sat on my lantern. Iska said she rode down on a moonbeam.',
          'A little grey moth sat on my lantern. She came down on a moonbeam.', { clue: 'n5_ember_moth' }],
        ['ash', 'Did she have a name?', 'Did she have a name?'],
        ['ember', 'I gave her one. Then I stopped climbing the hill. I grew up and had my babies, and I forgot her.', 'I named her. Then I grew up. I forgot her.'],
        ['ember', "She didn't forget."],
        ['ash', "Then she's the moon's moth. And she kept coming back, every year, waiting for you.", 'She is the moon\'s moth. She waited for you.',
          { do: ['solve n5_who_moth'] }],
      ] },
    ],
    n_helmet: [
      ['narr', "On a rock by the path sits a knight's helmet. Real steel, not glass. Sir Cindervane's.", "A knight's helmet on a rock. Sir Cindervane's!"],
      ['narr', "You pick it up. It's warm. Inside is one small spark that never went out.", 'The helmet is warm. A spark is inside.',
        { do: ['give n_spark'] }],
      ['ash', "Thank you, Sir Cindervane. You're still looking after me.", 'Thank you, Sir Cindervane.'],
    ],
    nst_scale: [
      ['narr', 'At the foot of the empty throne lies a grey moth scale as big as a plate. It is soft as dust.', 'A grey moth scale as big as a plate.', { clue: 'n5_grey_scale' }],
      ['ash', "Grey and soft. It's hers, the Mother's, like her wings on the beach. But Ember's moth was small enough to sit on a lantern.", "It is the Mother's. But Ember's moth was tiny."],
    ],
    nst_well: [
      ['narr', 'A black glass copy of the village well. Words are carved all round its rim, in old letters.', 'A copy of the village well. Words are carved on it.'],
      ['narr', '"LIGHT ONE MORE THAN YOU NEED."', '"LIGHT ONE MORE THAN YOU NEED."', { clue: 'n5_one_more' }],
      ['ash', 'One more than you need. ...But one more for who?', 'One more. But for who?'],
    ],
    // Echo 1: x4_foes plays STORY.n_echo1_intro and STORY.n_echo1_outro (these are their data versions)
    n_echo1_intro: [
      ['narr', 'On a throne of black glass sits a dragon made of shadow. It looks exactly like Grandpa did on the mountain, frown and all.', 'A shadow dragon sits on a throne. It looks like Grandpa.', { ref: 'n5_shadow_throne' }],
      ['n_echo_vor', 'Mine. The valley, the fire in your belly, the girl with the lanterns. Every spark of it is mine.', 'Mine. Your fire is mine. All of it.'],
      { if: 'choice ending=warden', then: [
        ['ash', "The real you is asleep on Cinder Mountain. I say goodnight to him every Lantern Day.", 'The real you is asleep. I say goodnight to him.'],
      ], else: [{ if: 'choice ending=heir', then: [
        ['ash', "I had all of it once, for one night. I know what \"mine\" feels like. I gave it back.", 'I had all of it once. I gave it back.'],
      ], else: [{ if: 'choice ending=lantern', then: [
        ['ash', "That's not my grandpa. My grandpa wipes his feet.", 'You are not my grandpa. My grandpa wipes his feet.'],
      ], else: [
        ['ash', "I said goodbye to the real you. I'm not scared of a copy.", 'I said goodbye to the real you.'],
      ] }] }] },
      ['ash', 'It was never yours. She gave it.'],
      ['n_echo_vor', 'Then I will take it back, hatchling.', 'Then I will take it back.'],
      ['ash', 'Try.'],
      { if: 'choice cinder=ally', then: [
        ['cinder', '"One last fight," I told you at the gate. It seems I had one more in me, Emberblood.', 'I said one last fight. I had one more in me.', { ref: 'obsidian_gate' }],
        ['ash', 'Sir Cindervane! You came back!', 'Sir Cindervane! You came back!'],
        ['cinder', 'Some knights never learn to sit down. I will hold the stairs. Go!', 'I will guard the stairs. Go!'],
      ] },
      ['narr', "Greymane's hackles rise. He has met this dragon before, too.", 'Greymane growls. He knows this dragon.', { if: 'choice greymane=ally' }],
    ],
    n_echo1_outro: [
      ['narr', 'The shadow dragon cracks like old glass and bursts into a cloud of moths.', 'The shadow dragon breaks into moths.'],
      ['narr', 'For a moment one last memory hangs in the air: his voice, but younger and sadder than you ever heard it.', 'A memory floats in the air. A sad voice.'],
      ['n_memory', '...Ember? Is that you, up there with the lanterns?', 'Ember? Is that you with the lanterns?', { clue: 'n5_mem_grandpa' }],
      ['ash', 'Even the moon remembers how much you missed her, Grandpa.', 'The moon remembers you missed her, Grandpa.'],
      { if: 'choice ending=warden', then: [['ash', 'Goodnight, Grandpa. The real one.', 'Goodnight, real Grandpa.']],
        else: [{ if: 'choice ending=heir', then: [['ash', "I'm telling the little one on the shelf above Bertram's oven. He'll huff and turn his back, and then he'll ask me to tell it again.", 'I will tell tiny Grandpa. He will want to hear it twice.']],
          else: [{ if: 'choice ending=lantern', then: [['ash', "I'm telling Grandpa the moon remembers. He'll say \"Hmph\" and go and sit by the forge for a long time.", 'I will tell Grandpa. He will sit by the forge a long time.']],
            else: [['ash', 'I hope you found her.', 'I hope you found her.']] }] }] },
      ['narr', 'Up ahead, a column of silver air roars up the cliff: the Wind Chimney.', 'Up ahead, the wind roars up the cliff.', { ref: 'n5_chimney' }],
    ],
  },
})
