// game/story/act4/m_reef.js (A4a): Act IV, Chapter 3, "The Glass Desert" (first part): the Sunken Gate and eclipse 1.
// What the player does: swims east to the Sunken Gate and gets Baron Puffington out of it (the boss and his words stay
// code: x3_foes defineBoss m_puff; x3_story's m_puff_intro / m_puff_outro; Mags sends bombs by Pebble if Ash has none),
// dives through the arch under the Reefwall (and, having solved wobbly_tide, says so: it WASN'T the fish), and climbs
// out on the hot glass beach of the Tideglass Strand. Then the sun goes out: Nyxara comes herself, the great grey moth
// with two pale moons on her wings (Kipper's moth: Murmur is merged into her, v11), with Hush big again on her thread. She bites the moon, sniffs the air for more moonlight "somewhere
// warm, like milk left out" (clue m4_milk_smell for A4b's where_next), and asks for the two Shards: she could squash Ash
// flat and she ASKS (clue m4_she_asks for A4b's why_three). The deal choice (G.choices.m_deal 'refuse' or 'ask') shows
// again at eclipse 2 and at the reform (A4b). The eclipse pictures are the look m4a_eclipse (v10_art4a.js).
chapter({
  id: 'm_reef', act: 4, after: 'm_coral', next: 'm_sable', takeover: true,
  card: ['Act IV · Chapter 3', 'The Glass Desert'],
  so_far: [
    'Ash worked out where the last Shard went: east, to the Eclipse Observatory. The only way east is under the Reefwall, through the Sunken Gate. A pufferfish is stuck in it.',
    'The Shard went east, to the Observatory. A fish is stuck in the gate.'],
  hint: ['The Sunken Gate is in the Reefwall, east across the sea. A pufferfish is stuck in it. Bring bombs: a fish full of air does not like a bang.',
    'The Sunken Gate is east, in the Reefwall. A fish is stuck in it. Bring bombs!'],

  place: {
    m4_strand: { map: 3, at: [6900, 65640], r: 240, kind: 'spot', name: ['the Tideglass Strand', 'the glass beach'] },
    // the eclipse: a screen-wide look (the dark, the covered sun, Nyxara and Hush), drawn on the screen layer (an engine
    // without it draws it in the world: its spot is south of the beach so it comes after everything there); it shows
    // only while the eclipse scene runs (m_eclipse_on is set by the scene and cleared after it, and on every load).
    m4_eclipse1: { map: 3, at: [6900, 66020], kind: 'prop', look: 'm4a_eclipse', if: 'flag m_eclipse_on !flag m_eclipse1', layer: 'screen',
      name: 'the eclipse' },
  },

  clue: {
    m4_milk_smell: { icon: 'moth', mystery: 'm4_night_mother',
      text: ['At the eclipse, Nyxara sniffed the air: "More moonlight, east of here. Somewhere warm. Like milk left out."',
        'Nyxara smelled more moonlight to the east. "Like milk left out."'] },
    m4_she_asks: { icon: 'moth', mystery: 'm4_night_mother',
      text: ['Nyxara could have squashed Ash flat with one wing. She didn\'t. She asked him for the two Shards.',
        'Nyxara could squash Ash flat. She asked for the Shards.'] },
    m4_her_words: { icon: 'heart', mystery: 'm4_night_mother',
      text: ['Nyxara: "The moon leaves me every morning. If I hold it very tight, it can never go." For one second she sounded small.',
        'Nyxara: "The moon leaves me. If I hold it tight, it can never go."'] },
  },

  step: [
    { id: 'puff', do: 'fight m_puffington', marker: 'm4_sunken_gate', then: ['set m_puff_done'],
      obj: ['Swim east to the Sunken Gate and get Baron Puffington out of it', 'Get the pufferfish out of the gate'] },
    { id: 'through', do: 'goto m4_reef_arch', scene: 'ref_through',
      obj: ['Dive under the Reefwall through the Sunken Gate', 'Dive under the reef wall, through the gate'] },
    { id: 'beach', do: 'goto m4_strand', scene: 'ref_beach',
      obj: ['Climb out onto the beach at the Tideglass Strand', 'Climb out onto the glass beach'] },
    { id: 'eclipse', do: 'cutscene ref_eclipse',
      then: ['set m_eclipse1', 'set m_eclipse_on=0', 'xp 1000',
        { banner: ['The light comes back, thin and grey.', 'The light comes back, grey.'] }, 'stage m_sable'] },
  ],

  scene: {
    ref_through: [
      { if: 'solved wobbly_tide', then: [
        ['ash', "Ten days stuck, he said. And the tide went wobbly a month ago. So it really wasn't him plugging the sea.",
          "Only ten days stuck. So it wasn't the fish."]] },
    ],
    ref_beach: [
      ['narr', 'You climb out of the sea onto a beach that crunches. The sand here is half glass. It sparkles, and it is very, very hot.',
        'You climb onto a beach of glass sand. It is very hot.'],
      ['iska', "Moonfall. Where the moon's light fell, long ago, and broke, and turned the sand to glass.", "Moonfall. The moon's light fell here and turned the sand to glass."],
      ['ash', "It's beautiful. It's also burning my feet.", "It's pretty. It's also burning my feet."],
    ],
    // eclipse 1 (bible 6.5b, THREADS N12): 10 lines on its longest branch
    ref_eclipse: [
      // (an eclipse needs a sun: at night the morning comes first, at once: no fade to black over the scene)
      { if: 'night', then: [{ do: ['time 10 quiet'] }, { fade: 0 }] },
      { do: ['set m_eclipse_on', 'world m4_eclipse1 dark'] }, { cam: 'm4_strand', s: 1.2 },
      ['narr', 'Then the light changes. The sun goes out like a lamp being covered.', 'Then the sun goes out, like a covered lamp.'],
      { do: ['world m4_eclipse1 rise'] },
      ['narr', 'Over the dunes rises a moth wider than the beach, grey as dust, with two pale moons painted on her wings. Behind her, on a silver thread that goes all the way up into the sky, flies a white moth.',
        'A huge grey moth rises, with two pale moons on her wings. A white moth flies behind her.'],
      ['ash', "Hush? She's big again!"],
      { if: 'choice ending=heir', then: [
        ['nyxara', "A dragon, all grown up. You'll burn so beautifully. Don't mind me. I'm only having a snack.", 'A grown-up dragon. You will burn so well. Just a snack.']],
        else: [
        ['nyxara', "Hello, little ember. I wanted to see you with my own eyes. Don't mind me. I'm only having a snack.", "Hello, little ember. Don't mind me. Just a snack."]] },
      ['narr', 'She spreads her wings over the moon and takes a big bite. CRUNCH. Far behind you, every raft in Driftwood bumps into every other raft.',
        'She bites the moon. CRUNCH! Far away, every raft in Driftwood bumps.', { do: ['world m4_eclipse1 bite', 'moon 60'] }],
      ['nyxara', "Mmm. Thin up there. But I can smell more moonlight east of here. Somewhere warm. Like milk left out.",
        'Mmm. I smell more moonlight to the east. Like milk left out.', { clue: 'm4_milk_smell', dir: ['m4_strand', 'm4_sable_sign', 'east'] }],
      ['nyxara', "Now, little ember. Give me the two Shards in your satchel, and I'll leave your little valley alone. Forever.",
        'Give me your two Shards. Then I will leave your valley alone. Forever.', { do: ['world m4_eclipse1 eyes'] }],
      ['narr', "She could squash you flat with one wing. She doesn't. She asks.", "She could squash you flat. She doesn't. She asks.", { clue: 'm4_she_asks' }],
      { choose: 'm_deal', who: 'narr', ask: ['She waits for your answer, very still.', 'She waits for your answer.'], pick: [
        { t: ['No way. Not for a hundred valleys!', 'No way!'], tone: 'brave', v: 'refuse',
          then: [{ journal: ['You told Nyxara "No way", not for a hundred valleys.', 'You told Nyxara "No way".'], key: 'm_deal' }],
          say: [['nyxara', 'Brave. How lovely. Keep them warm for me, then. Everyone comes to me in the end.', 'Brave. Keep them warm for me. Everyone comes to me.',
            { do: ['world m4_eclipse1 leave'] }]] },
        { t: ['Why do you want the moon so much?', 'Why do you want the moon?'], tone: 'kind', v: 'ask',
          then: [{ journal: ['You asked Nyxara why she wants the moon. For a second she sounded small.', 'You asked Nyxara why. She sounded small.'], key: 'm_deal' }],
          // (v12) not "since a girl with horns": nobody in Act IV ties the Mother to Ember (Act V, ring 1)
          say: [['nyxara', '...Nobody ever asks me that. The moon leaves me every morning. If I hold it very tight, it can never go.',
            'Nobody asks me that. The moon leaves me. I hold it tight.', { clue: 'm4_her_words', do: ['world m4_eclipse1 leave'] }]] },
      ] },
    ],
  },
})
