// game/story/act3/f_pass.js (A3a): Act III, Chapter 1, "A Letter in the Snow" (second half: over the High Pass).
// What the player does: climbs the High Pass (just west of Frostpine Lodge) into Frostreach, where the whole north is
// white and a purple storm hums on Mount Dread. At the top of the pass the split ice holds soft white dust, like flour,
// that comes off on Ash's claws: with Ulf's "something with wings" the player can work out what cracked the pass (the
// small mystery who_cracked, optional; its answer is a bonus clue for "what is making the storm" and a letter from
// Ulf). On the White Road a mitten seller stands frozen (moth-frost: normal fire won't do). At Hearthold's West Gate,
// Captain Brann blocks the gap in the wall with his spear (the West Gate has no doors: nobody pushes it open now).
// Old flags kept: f_arrived; the stage moves on to f_hearth.
chapter({
  id: 'f_pass', act: 3, after: 'f_snow', next: 'f_hearth', takeover: true,
  card: null, name: ['A Letter in the Snow', 'A Letter in the Snow'],
  so_far: [
    'The High Pass split open one night, as if something big with wings flew through it. Beyond it lies Frostreach, a white land under a humming purple storm.',
    'The High Pass is open. Beyond it is Frostreach, white and snowy.'],
  mom: [['Over the High Pass? Two scarves. I mean it.', 'Over the High Pass? Two scarves!']],

  place: {
    // the top of the pass on the Frostreach side (open ground, level 0, a few steps from where the pass comes out)
    f3_pass_cut: { map: 2, at: [2640, 50400], r: 26, kind: 'examine', look: 'moth_dust_ice', h: 44,
      name: ['the split in the old ice', 'the cracked ice'], aliases: ['the crack', 'the split ice wall'],
      prompt: ['Look at the split in the ice', 'Look at the cracked ice'], say: 'f3_pass_cut_look' },
    // the gap in Hearthold's wall at the West Gate (the wall is three arcs; this gap has no doors)
    f3_west_gate: { map: 2, at: [6180, 49000], kind: 'npc_spot', name: ['the West Gate of Hearthold', 'the West Gate'],
      aliases: ['the gap in the wall'] },
  },

  clue: {
    f3_pass_cut: { icon: 'dust', mystery: 'who_cracked',
      text: ['At the top of the High Pass the old ice is split open. Soft white dust sits in the crack, like flour. It comes off on your claws.',
        'Soft white dust in the cracked ice. Like flour.'] },
    f3_storm_hums: { icon: 'question',
      text: ['Tove: the storm on Mount Dread hums the same note as the Shard. Normal storms do not hum.',
        'The storm hums. Normal storms do not hum.'] },
    // the answer to who_cracked (a bonus clue for what_storm, A3a's f_thaw)
    f3_moth_north: { icon: 'moth',
      text: ['A giant moth flew north through the High Pass and cracked the old ice. Ulf\'s sheep saw it go.',
        'A giant moth flew north through the pass.'] },
  },

  // the small mystery (optional): the Case Book asks it as soon as both clues are found, any time in the act
  deduce: {
    who_cracked: {
      mystery: 'who_cracked',
      ask: ['What cracked open the High Pass after a hundred years?', 'What cracked the High Pass?'],
      needs: ['f3_ulf_wings', 'f3_pass_cut'],
      pick: [
        { t: ['A giant moth, flying north through the ice', 'A giant moth flew through it'], right: true },
        { t: ["Elka's sled", "Elka's sled"],
          hint: ['A sled slides down hills. It does not fly through walls of ice. And what is that dust on your claws?',
            'Sleds slide. They do not fly. Look at the dust.'] },
        { t: ['A dragon', 'A dragon'],
          hint: ["Dragon scales are hard and shiny. This dust is soft, like the dust on a moth's wings.",
            'Dragon scales are not dusty. Moth wings are.'] },
      ],
      then: ['clue f3_moth_north', 'xp 150', 'mail f3_ulf_letter'],
    },
  },

  step: [
    // the High Pass crossing (map 0, beside the Lodge) comes out at the top of the White Pass on map 2
    { id: 'pass', do: 'goto f_whitepass 420', marker: 'high_pass', scene: 'f_arrive', then: ['set f_arrived'],
      obj: ['Climb the High Pass, just beside Frostpine Lodge', 'Climb the High Pass by the Lodge'],
      hint: ['The High Pass is just west of Frostpine Lodge, where the wall of ice used to be.',
        'The pass is just west of the Lodge.'],
      extra: [
        { do: 'examine f3_pass_cut', then: ['clue f3_pass_cut'] },
      ] },
    { id: 'gate', do: 'goto f3_west_gate 230', scene: 'f_gate', then: ['xp 200', 'stage f_hearth'],
      obj: ['Follow the White Road to Hearthold', 'Follow the White Road to Hearthold'],
      hint: ['Follow the White Road down from the pass to Hearthold, the town with the wall. And the smoke. Mostly the smoke.',
        'Follow the White Road to Hearthold, the town with the wall.'] },
  ],

  scene: {
    // over the top of the pass (8 lines)
    f_arrive: [
      ['narr', 'The High Pass climbs and climbs. Your breath puffs out in little clouds. Your tail goes numb. Then the clouds open.',
        'The pass climbs up and up. Your tail goes numb. Then the clouds open.'],
      ['narr', 'The whole north is white. White hills, white forests, a white lake as flat as a plate. And far away, a black mountain wrapped in a purple storm.',
        'The whole north is white. And far away: a black mountain in a purple storm.', { ref: 'f_crown' }],
      ['tove', 'Brr. Oh, brr. Oh, I know this cold.', 'Brr. Oh, I know this cold.'],
      ['ash', 'Tove? Is that you? Where are you?', 'Tove? Where are you?'],
      ['tove', "In your fire, Ash. All five of us ride along in there, remember? The others are napping. I volunteered for this trip. I hate this trip.",
        "In your fire, Ash. The others are napping. I came on this trip. I hate this trip."],
      ['tove', "That mountain is Mount Dread. That storm is not a normal storm. Normal storms don't hum.", "That is Mount Dread. That storm hums. Normal storms don't hum."],
      ['ash', "It's humming the same note as the Shard.", 'It hums the same note as the Shard.', { clue: 'f3_storm_hums' }],
      ['tove', "Then that's where the second piece went. Follow the White Road east. There's a town down there with a fire in it. A big one. Mostly.",
        "Then the Shard is there. Follow the road east. There's a town with a big fire.", { dir: ['f_whitepass', 'f_hearthold', 'east'] }],
    ],
    f3_pass_cut_look: [
      ['narr', 'The old wall of ice is split right down the middle, as if something pushed through it.', 'The old ice is split down the middle.'],
      ['narr', 'Soft white dust is packed into the crack, like flour. It is not frost. It comes off on your claws.',
        'Soft white dust is in the crack. Like flour. It sticks to your claws.', { clue: 'f3_pass_cut' }],
      ['ash', "Huh. Whatever made this was big. And dusty.", 'Whatever did this was big. And dusty.'],
    ],
    // on the White Road, before Ash has Blaze (x2_story.js f2sFergusTick plays this old STORY key by itself)
    f_fergus_cold: [
      ['narr', "A traveler stands in the middle of the road, frozen solid. He's holding up a mitten like he's trying to sell it to the wind.",
        'A man is frozen on the road. He holds up a mitten.'],
      ['narr', "You breathe on him. Your best breath. The ice sweats a little. That's all.", 'You breathe fire on him. The ice only drips.'],
      ['tove', "That's moth-frost, Ash. Normal fire won't touch it. You'll need something hotter.", "That's moth-frost. You need a hotter fire."],
      ['ash', "Sorry, mitten man. I'll come back.", "Sorry, mitten man. I'll come back."],
    ],
    // Hearthold's West Gate: a gap in the wall with no doors; Brann blocks it with his spear (8 lines)
    f_gate: [
      { place: ['f_brann', 'f3_west_gate'] },
      ['f_brann', 'HALT! Who goes there? State your name, your business, and whether you are a moth.', 'HALT! Who are you? Are you a moth?'],
      ['ash', "Ash Emberblood. I'm here about the winter. And I'm not a moth.", "I'm Ash. I'm here about the winter. I'm not a moth."],
      ['f_brann', 'That is EXACTLY what a moth would say.'],
      ['f_brann', "...Hm. Moths don't have horns. Or tails. Is that smoke coming out of your nose?", "Hm. Moths don't have horns. Is that smoke from your nose?"],
      ['ash', 'Only when I sneeze.'],
      ['f_brann', "An Emberblood! A real one! Sorry about the spear. We're jumpy. See that guard out there? One of mine. On watch. Frozen. Very brave.",
        "An Emberblood! Sorry about the spear. See that frozen guard? Very brave.", { ref: 'f_guard_ice' }],
      ['narr', 'He lifts his spear out of the gap in the wall. The gap is exactly as wide as a kid with a tail.', 'He lifts his spear out of the gap in the wall.', { ref: 'f3_west_gate' }],
      ['f_brann', "Welcome to Hearthold, the last warm town in the north. See the Hearthkeeper at the Great Hearth. She's been waiting for someone like you. For a month. Loudly.",
        'Welcome to Hearthold! See the Hearthkeeper at the Great Hearth. She has waited a month.', { promise: 'f_brynja' }],
    ],
    // Pebble brings a note from Ulf once Ash has worked out what cracked the pass (who_cracked's payoff)
    f3_ulf_letter: [
      ['ulf', "(a note in big square letters) Ash. Pebble told me. A MOTH? A moth as big as a barn, through my pass?",
        'Ash. A MOTH? Through my pass?'],
      ['ulf', 'My sheep were right. I said sorry to them. They did not care. They looked at the grass. Ulf.',
        'My sheep were right. I said sorry. They looked at the grass.'],
    ],
  },

  talk: {
    f_brann: [
      { if: 'stage=f_pass', say: ["Halt! Oh, it's you. In you come. The Hearthkeeper's at the Great Hearth, in the middle of town.",
        "Oh, it's you. The Hearthkeeper is at the Great Hearth."] },
    ],
  },
})
