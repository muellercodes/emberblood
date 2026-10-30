// game/story/act4/m_drift.js (A4a, v11 J6): Act IV, Chapter 1, "Across the Sea" (second half): Driftwood Landing.
// What the player does: Mayor Dabble's welcome is cut short when the chickens' raft drifts off ("Somebody find out
// why!"); Dabble blames the pufferfish stuck in the Sunken Gate (a red herring). The player finds three clues on the
// raft town: the tide post (wild new notches, TWO BITES scratched by the last one, and one worn old notch at the very
// top marked LUMEN), Squint's spyglass at the top of the crow's nest (the moon with two bites gone, and far north a
// white tower with windows under the sea), and Cook Gilly (her fish came on the full moon; for a month now they don't
// know when to come). Old Winnie wants proof: the player works out in the Case Book what happens to Driftwood if the
// moon keeps shrinking (small mystery wobbly_tide, the same id: the sea takes it, like the city under that tower).
// Winnie says yes, every raft and every chicken, and tells how it took Old Lumen once. On the way, a raft lantern has a
// bite out of its glass (clue m4_chewed_lamp for the optional lamp_thief mystery).
chapter({
  id: 'm_drift', act: 4, after: 'm_sail', next: 'm_lumen', takeover: true,
  card: null, name: ['Making Waves', 'Across the Sea'],
  so_far: [
    "Ash sailed east to Moonfall: the Sunken Isles, where drowned Old Lumen sleeps under the sea, and the Glass Desert, where the moon's broken light fell as glass. In Driftwood Landing, the tide has gone wobbly, and the whole town with it.",
    'Ash came to Moonfall. In the floating town, the tide has gone wobbly.'],
  hint: ['Mayor Dabble is on the big Town Raft. Old Winnie is the one with the seashell hat. And the octopus.',
    'Mayor Dabble is on the Town Raft. Old Winnie has a seashell hat.'],
  mom: [['A town that floats? Keep your boots on. Even in bed.', 'A floating town! Keep your boots on.']],

  place: {
    // the tide post at the south edge of the Town Raft, beside the plank jetty down to the Floating Kitchen
    m4_tide_post: { map: 3, at: [2348, 64926], r: 20, kind: 'examine', look: 'm4a_tide_post', h: 64, say: 'drf_post_again',
      name: ['the tide post at the edge of the raft', 'the tide post'] },
    // Squint's spyglass, on a swivel at the top of the crow's nest (level 1, up its ladder)
    m4_spyglass: { map: 3, at: [2318, 64650], r: 16, kind: 'examine', look: 'm4a_spyglass', h: 40, say: 'drf_spyglass_again',
      name: ["Squint's spyglass", "Squint's spyglass"] },
    // a raft lantern with a bite out of its glass (lamp_thief, optional; A4b/A4S mend it with `world m4_chewed_lamp fixed`)
    m4_chewed_lamp: { map: 3, at: [2070, 64566], r: 18, kind: 'examine', look: 'm4a_chewed_lamp', h: 56,
      states: { fixed: 'm4a_lamp_fixed' }, say: 'drf_lamp', then: ['clue m4_chewed_lamp'],
      name: ['a raft lantern with a bite out of it', 'a bitten lantern'] },
  },

  clue: {
    m4_puff_plug: { icon: 'fish', herring: true, mystery: 'wobbly_tide',
      text: ['Mayor Dabble thinks the pufferfish stuck in the Sunken Gate has plugged the sea like a bath.',
        'Dabble thinks a stuck fish plugged the sea.'] },
    m4_tide_post: { icon: 'wave', mystery: 'wobbly_tide',
      text: ['The tide post: neat old notches, wild new ones, and TWO BITES scratched by the wildest. At the very top, far above the rest, one worn old notch: LUMEN.',
        'Wild new notches, and TWO BITES. At the very top, an old notch: LUMEN.'] },
    m4_spyglass: { icon: 'eye', mystery: 'wobbly_tide',
      text: ["Through Squint's spyglass: the moon, faint in the day sky, with two bites gone. Far north, a white tower stands in the sea, with windows all the way down under the water.",
        'The moon has two bites gone. Far north, a tower with windows under the sea.'] },
    m4_gilly_fish: { icon: 'fish', mystery: 'wobbly_tide',
      text: ["Cook Gilly: her fish always came in on the full moon. For a month now they don't know when to come.",
        "Gilly's fish came with the full moon. Now they're lost."] },
    m4_chewed_lamp: { icon: 'lamp', mystery: 'lamp_thief',
      text: ['A lantern on the Town Raft has a bite out of its glass. Teeth marks. Big, fuzzy teeth.',
        'A lamp with a bite out of it. Big fuzzy teeth!'] },
  },

  deduce: {
    wobbly_tide: {
      mystery: 'wobbly_tide',
      ask: ['What happens to Driftwood if the moon keeps shrinking?', 'What happens to Driftwood if the moon shrinks?'],
      needs: ['m4_tide_post', 'm4_spyglass', 'm4_gilly_fish'],
      pick: [
        { t: ['Nothing, once the pufferfish is out of the gate', 'Nothing, once the fish is out'],
          hint: ['Look at the tide post again. What is scratched by the wildest notch? Can a fish do that to the sky?',
            'What is scratched by the wild notch?'] },
        { t: ['The sea goes wild and swallows it, like the city under that tower', 'The sea swallows it, like that old city'], right: true },
        { t: ['Nothing. Driftwood floats, so it just goes up and down', 'Nothing. Driftwood floats.'],
          hint: ["The chickens' raft floated too, and look where it is now. And how high is the oldest notch on the tide post?",
            "Where is the chickens' raft now? Look at the top notch."] },
      ],
      then: ['set m4_tide_known', 'xp 300'],
    },
  },

  step: [
    { id: 'dabble', do: 'talk m_dabble', scene: 'drf_dabble', then: ['set m_dabble'],
      obj: ['Talk to Mayor Dabble on the Town Raft', 'Talk to Mayor Dabble'] },
    { id: 'look', do: 'all', obj: ['Find out what the wobbly tide means', 'What does the wobbly tide mean?'],
      hint: ["Look at the tide post at the south edge of the Town Raft. Climb the crow's nest ladder and look through Squint's spyglass. Ask Cook Gilly at the Floating Kitchen.",
        "Look at the tide post. Climb the crow's nest. Ask Gilly."],
      parts: [
        { do: 'examine m4_tide_post', scene: 'drf_post', then: ['clue m4_tide_post'] },
        { do: 'examine m4_spyglass', scene: 'drf_spyglass', then: ['clue m4_spyglass'] },
        { do: 'talk m_gilly', scene: 'drf_gilly', then: ['clue m4_gilly_fish'] },
      ],
      extra: [
        { do: 'examine m4_chewed_lamp' },
      ] },
    { id: 'ask', do: 'talk m_winnie', scene: 'drf_winnie_ask',
      obj: ['Tell Old Winnie the Tidewife what you found', 'Tell Old Winnie what you found'],
      hint: ['Old Winnie lives in the Shell Hut, on the raft west of the town. She has a seashell hat. And an octopus.',
        'Old Winnie lives in the Shell Hut.'] },
    { id: 'deduce', do: 'deduce wobbly_tide', obj: ['Work out what happens to Driftwood, in the Case Book', 'Open the Case Book'] },
    { id: 'story', do: 'talk m_winnie', scene: 'drf_winnie_story', then: ['set m_winnie', 'xp 600', 'stage m_lumen'],
      obj: ['Tell Old Winnie your answer', 'Tell Old Winnie your answer'] },
  ],

  scene: {
    drf_dabble: [
      ['m_dabble', "Welcome! Welcome to Driftwood Landing, the only town in the world that's never in the same place twice! I'm Mayor Dabble Floatwell. Mind the gaps.",
        "Welcome to Driftwood Landing! It's never in the same place twice. I'm Mayor Dabble!"],
      ['narr', 'The whole town lurches. A raft full of chickens drifts past, out to sea. The chickens look worried.',
        'The town wobbles. A raft full of chickens floats away. They look worried.'],
      ['m_dabble', "The tide's gone wobbly! Too high, then too low, then sideways. Somebody find out why!",
        'The tide has gone wobbly! Somebody find out why!'],
      ['m_dabble', "I'll tell you why. That pufferfish stuck in the Sunken Gate. He's plugged the sea like a bath!",
        "It's that fish stuck in the Sunken Gate. He plugged the sea!", { clue: 'm4_puff_plug', ref: 'm4_sunken_gate' }],
      ['ash', 'Is that... how the sea works?', 'Is that how the sea works?'],
      ['m_dabble', "Old Winnie would know. But she won't listen to anybody without proof. Look around. Ask around. And wave to the chickens.",
        'Ask Old Winnie. But she wants proof. Look around! Wave to the chickens.'],
    ],
    drf_post: [
      ['narr', 'A tall post at the edge of the raft, notched at every high tide. The old notches are neat, like steps.', 'A tide post. The old notches are neat, like steps.'],
      ['narr', 'The new ones go up, and down, and sideways. By the wildest notch, somebody has scratched: TWO BITES.',
        'The new ones are wild. By the wildest one: TWO BITES.'],
      ['narr', 'Right at the top, far above your head, is one more notch, old and worn smooth. Beside it, in old letters: LUMEN.',
        'At the very top is one old notch. It says: LUMEN.'],
      ['ash', 'Two bites, like the moon. And once, a long time ago, the sea came all the way up there.', 'Two bites, like the moon. And once the sea came all the way up there.'],
    ],
    drf_spyglass: [
      ['narr', "Squint's brass spyglass, on a swivel at the top of the crow's nest. You put your eye to it.", "Squint's spyglass. You look through it."],
      ['m_squint', "(from below) Don't drop it! It's my only one! What can you see?", "(from below) Don't drop it! What can you see?"],
      ['narr', 'The moon, faint and pale in the day sky. Two bites are gone from its edge.', 'The moon, pale in the sky. Two bites are gone.'],
      ['narr', 'You swing the glass north. Far out stands a slim white tower. It has windows all the way down, and the sea comes halfway up them.',
        'Far north, a white tower stands in the sea. Its windows go down under the water.', { dir: ['m4_crows_nest', 'm4_lumen_spire', 'north'] }],
      ['ash', "Windows under the water. That's not a tower. That's the top of something.", "Windows under water. That's the top of something."],
      ['m_squint', "That's the Lumen Spire. It's always there. LAND HO anyway!", "That's the Lumen Spire. LAND HO anyway!"],
    ],
    drf_gilly: [
      ['m_gilly', 'Fish stew? Fish pie? Fish pudding? No? Hmph. Nobody ever wants the pudding.', 'Fish stew? Fish pie? Fish pudding? No?'],
      ['ash', "Do you know why the tide's gone wobbly?", 'Why is the tide wobbly?'],
      ['m_gilly', 'Tides, no. Fish, yes. My fish always come in on the full moon, regular as soup.', 'I know fish. My fish come in on the full moon.'],
      ['m_gilly', "But for a month now they don't know when to come. Last week a whole school of them turned up at midnight in a panic. Not one had done its homework.",
        "Now they don't know when to come. For a month now!"],
      ['m_gilly', 'Poor things. I gave them a pudding.', 'Poor things. I gave them a pudding.'],
    ],
    drf_winnie_ask: [
      ['m_winnie', "Sit, sit. Mind the octopus. He's just visiting. He's been visiting for nine years.", 'Sit. Mind the octopus. He is visiting. For nine years.'],
      ['ash', "The tide's gone all wobbly. Mayor Dabble says it's a fish.", 'The tide is wobbly. Dabble says it is a fish.'],
      ['m_winnie', "Wobbly, he says! Ha! I like you. Dabble blames everything on fish. You've looked around, dragon child. So tell me what happens to us if it keeps on.",
        'Wobbly! Ha! You looked around. So what happens to us if it keeps on?'],
    ],
    drf_winnie_story: [
      ['m_winnie', 'Yes, child. The sea follows the moon, and it takes what it likes. Every raft, and every chicken.', 'Yes. The sea follows the moon. It would take every raft.'],
      // (v12) the act's title comes from here: the tidewife's tale gives Moonfall's folk name for the moth, the Night Mother
      ['m_winnie', "It has happened once before. Five hundred years ago the Night Mother bit the moon for the very first time. That's what my gran called her: a moth as big as the dark. And the sea came up and took Old Lumen, the moon city. That tower is the top of it.",
        'Long ago the Night Mother, a giant moth, bit the moon. The sea took a city. Old Lumen.'],
      ['iska', 'Ember came east too, long ago, and I came with her. I can feel her flame down in that city, Ash. Like a candle in a window.',
        'Ember came here long ago. I came too. Her flame is down there, Ash.', { ref: 'm4_lumen_spire' }],
      ['ash', "Down? Under the sea? I can't breathe water.", "Under the sea? I can't breathe water."],
      ['m_winnie', 'Not yet, child. Not yet.'],
      ['m_winnie', 'You saw the tower. Go on, then.', { promise: 'm4_lumen_spire' }],
    ],
    // the tide post and the spyglass again, once their clue is in the Case Book (before that, the step's scene plays)
    drf_post_again: [
      { if: 'clue m4_tide_post', then: [
        ['narr', "The tide post. Neat old notches, wild new ones, two bites scratched by the wildest, and Lumen's notch at the very top.", "The tide post. Two bites, and Lumen's notch at the top."]] },
    ],
    drf_spyglass_again: [
      { if: 'clue m4_spyglass', then: [
        ['narr', "Squint's spyglass. The moon hangs pale in the sky, with bites out of its edge. Far north, the Lumen Spire stands in the sea, its windows under the water.",
          'The moon has bites gone. Far north, the Lumen Spire.', { dir: ['m4_crows_nest', 'm4_lumen_spire', 'north'] }]] },
    ],
    drf_lamp: [
      { if: 'world m4_chewed_lamp=fixed', then: [
        ['narr', 'The raft lantern has brand new glass. A little tag on it says "Sorry."', 'The lantern has new glass. A tag says "Sorry."', { fact: 'm4_chewed_lamp=fixed' }]],
        else: [
        ['narr', 'One of the raft lanterns has a bite out of its glass. A big, round bite.', 'A raft lantern has a big bite out of its glass.'],
        ['narr', 'Teeth marks. Big, fuzzy teeth.'],
        ['ash', 'Who bites a lamp?']] },
    ],
  },

  talk: {
    // Winnie wants proof: while the clues are still out there (A4S owns her other talk)
    m_winnie: [
      { if: 'stage=m_drift flag m_dabble !step m_drift.look',
        say: ['Proof first, dragon child. Look at the tide. Look at the sky. And ask somebody who knows fish.', 'Proof first! Look at the tide and the sky. Ask about fish.'] },
    ],
    // the wobbly_tide payoff (A4S owns Dabble's other talk)
    m_dabble: [
      { if: 'solved wobbly_tide', once: true,
        say: ["The moon? It's the moon? Then I'm writing to the moon. Strongly. With underlining.", "The moon? I'm writing to the moon. Strongly!"] },
    ],
  },
})
