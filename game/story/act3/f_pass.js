// game/story/act3/f_pass.js (A3a): Act III, Chapter 1, "A Letter in the Snow" (second half: over the High Pass).
// What the player does: climbs the High Pass (just west of Frostpine Lodge) into Frostreach, where the whole north is
// white and a purple storm hums on Mount Dread. At the top of the pass the split ice holds soft white dust, like flour:
// moth dust. Ash already knows from Act II that the white moth took a Shard north, so he says it himself, and the small
// mystery who_cracked is no longer asked (v11 J5): the pass step's `then` solves it for new saves, the act file's
// migrate solves it for old ones (its answer is still a bonus clue for "what is making the storm", and Ulf's note
// still comes). The crack stays an examine spot with its clue. On the White Road a mitten seller stands frozen
// (moth-frost: normal fire won't do). At Hearthold's West Gate, Captain Brann blocks the gap in the wall with his spear
// (the West Gate has no doors: nobody pushes it open now).
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
      text: ['The white moth flew north through the High Pass and split the old ice. Ulf\'s sheep saw it go.',
        'The white moth flew north through the pass.'] },
  },

  // the small mystery: no longer asked (v11): solved by the pass step's `then` (new saves) and the act's migrate (old
  // saves), so the Case Book shows it closed. The question and picks stay for saves that answered it already.
  deduce: {
    who_cracked: {
      mystery: 'who_cracked',
      ask: ['What cracked open the High Pass after a hundred years?', 'What cracked the High Pass?'],
      needs: ['f3_ulf_wings', 'f3_pass_cut'],
      // (bonus: A3S's f3_elka_dust (q_f_sled, Elka saw the dust) and f3_ring_scale (the Moon Ring gate's giant white scale))
      bonus: ['f3_elka_dust', 'f3_ring_scale'],
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
    { id: 'pass', do: 'goto f_whitepass 420', marker: 'high_pass', scene: 'f_arrive', then: ['set f_arrived', 'solve who_cracked'],
      obj: ['Climb the High Pass, just beside Frostpine Lodge', 'Climb the High Pass by the Lodge'],
      hint: ['The High Pass is just west of Frostpine Lodge, where the wall of ice used to be.',
        'The pass is just west of the Lodge.'],
      extra: [
        { do: 'examine f3_pass_cut', then: ['clue f3_pass_cut'] },
      ] },
    { id: 'gate', do: 'goto f3_west_gate 230', scene: 'f_gate', then: ['xp 200', 'stage f_hearth'],
      obj: ['Follow the White Road to Hearthold', 'Follow the White Road to Hearthold'],
      hint: ['Follow the White Road east from the pass to Hearthold, the town with the round wall and the chimney smoke.',
        'Follow the White Road to Hearthold, the town with the wall.'] },
  ],

  scene: {
    // over the top of the pass (10 lines): the white north, the moth dust in the split (Ash knows whose it is), Tove
    f_arrive: [
      ['narr', 'The High Pass climbs and climbs. Your breath puffs out in little clouds. Your tail goes numb. Then the clouds open.',
        'The pass climbs up and up. Your tail goes numb. Then the clouds open.'],
      ['narr', 'The whole north is white. White hills, white forests, a white lake as flat as a plate. And far away, a black mountain wrapped in a purple storm.',
        'The whole north is white. And far away: a black mountain in a purple storm.', { ref: 'f_crown' }],
      ['narr', 'Beside you, the old wall of ice is split down the middle. White dust is packed into the crack, soft as flour.',
        'The old ice wall is split. White dust is in the crack.', { ref: 'f3_pass_cut' }],
      ['ash', 'Moth dust. The white one came through here, with a piece of the Heart.', 'Moth dust. The white moth came this way.'],
      ['tove', 'Brrr. I know this cold.', 'Brrr. I know this cold.'],
      ['ash', 'Tove? Is that you?', 'Tove? Is that you?'],
      ['tove', "In your fire, Ash, same as ever. The others are asleep in there. I took the cold trip. I've had practice.",
        "In your fire. The others sleep. I took the cold trip."],
      ['tove', "That's Mount Dread. And that storm is humming. Storms don't hum.", "That's Mount Dread. That storm hums. Storms don't hum."],
      ['ash', "Same note as the Shard.", 'Same note as the Shard.', { clue: 'f3_storm_hums' }],
      ['tove', "Then that's where the white one took it. Follow the White Road east. There's a town down there that keeps a very big fire. I hope it still does.",
        "Then the Shard is there. Follow the road east. There's a town with a big fire.", { dir: ['f_whitepass', 'f_hearthold', 'east'] }],
    ],
    f3_pass_cut_look: [
      ['narr', 'The old wall of ice is split right down the middle, as if something huge pushed through it.', 'The old ice is split down the middle.'],
      ['narr', 'Soft white dust is packed into the crack, like flour. It is not frost. It comes off on your claws.',
        'Soft white dust is in the crack. Like flour. It sticks to your claws.', { clue: 'f3_pass_cut' }],
      ['ash', 'Dust on both sides at once. Her wings must be as wide as the whole pass.', 'Dust on both sides. Her wings are as wide as the pass!'],
    ],
    // on the White Road, before Ash has Blaze (x2_story.js f2sFergusTick plays this old STORY key by itself)
    f_fergus_cold: [
      ['narr', "A traveler stands in the middle of the road, frozen solid. He's holding up a mitten like he's trying to sell it to the wind.",
        'A man is frozen on the road. He holds up a mitten.'],
      ['narr', "You breathe on him. Your best breath. The ice sweats a little. That's all.", 'You breathe fire on him. The ice only drips.'],
      ['tove', "That's moth-frost, Ash. Normal fire won't touch it. You'll need something hotter.", "That's moth-frost. You need a hotter fire."],
      ['ash', "Sorry, mitten man. I'll come back.", "Sorry, mitten man. I'll come back."],
    ],
    // Hearthold's West Gate: a gap in the wall with no doors; Brann blocks it with his spear (8 lines on each branch).
    // The answer to "are you a moth?" is G.choices.f3_moth ('no' or 'moth'): Brann remembers it (his talk below, in
    // f_hearth and f_maze, and his bet in f_kindle's WHOOMPH).
    f_gate: [
      { place: ['f_brann', 'f3_west_gate'] },
      ['narr', 'A guard in a blue-plumed helmet jumps into the gap in the wall and points his spear at your nose.',
        'A guard jumps into the gap. His spear points at your nose.', { ref: 'f3_west_gate' }],
      { choose: 'f3_moth', who: 'f_brann', ask: ['Stop right there! Name, business, and are you or are you not a moth?', 'Stop! Who are you? Are you a moth?'], pick: [
        { t: ["I'm Ash. I'm here about the winter. Not a moth.", "I'm Ash. Not a moth."], tone: 'kind', v: 'no',
          say: [['f_brann', "That's exactly what a moth would say."]] },
        { t: ['Bzzzz. Yes. I am a very big moth.', 'Bzzz. I am a moth.'], tone: 'silly', v: 'moth',
          say: [['f_brann', "A moth! ...Wait. Moths don't buzz. Moths are silent. Nice try, moth.", "Moths don't buzz! Nice try, moth."]] },
      ] },
      ['f_brann', "...Moths don't have horns, though. Or tails. Is that smoke coming out of your nose?", "Moths don't have horns. Is that smoke from your nose?"],
      ['ash', 'Only when I sneeze.'],
      ['f_brann', "Horns! And a tail! You look just like the horned girl on the Hearth stones! Sorry about the spear. We're jumpy. See that guard out on the road? He froze on watch, and he's still on watch.",
        "Horns! Like the girl on the Hearth stones! That frozen guard is still on watch.", { ref: 'f_guard_ice' }],
      ['narr', 'He lifts his spear out of the gap. The gap is exactly as wide as a kid with a tail.', 'He lifts his spear out of the gap in the wall.', { ref: 'f3_west_gate' }],
      ['f_brann', "Welcome to Hearthold, the last warm town in the north! See the Hearthkeeper at the Great Hearth. She's been waiting a month for someone like you, and telling the whole town so.",
        'Welcome to Hearthold! See the Hearthkeeper at the Great Hearth. She has waited a month.', { promise: 'f_brynja' }],
    ],
    // Pebble brings a note from Ulf right after Ash crosses the pass (who_cracked's payoff, now solved by the pass step)
    f3_ulf_letter: [
      ['ulf', "(a note in big square letters) Ash. The minute you went up the pass, every sheep I own turned round and stared at me.",
        'Ash. When you went up the pass, my sheep all stared at me.'],
      ['ulf', 'Like they were saying: told you. Something with wings. I said sorry to them. They looked at the grass. Ulf.',
        'Like they said: told you. I said sorry. They looked at the grass.'],
    ],
  },

  talk: {
    f_brann: [
      { if: 'stage=f_pass', say: ["Not in here! Back out to the gap in the wall, please. Strangers get asked their questions properly, out there.",
        'Back out to the gap, please. I ask strangers out there.'], ref: 'f3_west_gate' },
    ],
  },
})
