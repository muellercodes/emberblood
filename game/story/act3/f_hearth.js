// game/story/act3/f_hearth.js (A3a): Act III, Chapter 2, "The Dying Hearth" (first part: where is the blue fire?).
// What the player does: meets Brynja the Hearthkeeper, whose Great Hearth is down to a tiny orange flicker since a
// white moth flew over to Mount Dread. Ash's own fire is "a breath for candles": the Hearth was lit with Blaze, and
// nobody alive knows where that came from. Nobody tells him. He finds out: the oldest ash at the back of the Hearth is
// BLUE; the carving beside the Hearth's mouth shows a horned girl and a tall lady with icicle horns holding one flame, LIT AT THE
// NORTH FORGE (Tove knows who the lady is, and will not say: her Act III thread); and Brother Eider's old map in the Hearth Archive puts the North
// Forge where the glacier meets the Glimmerfrost, a place folk now call the Glacier Maze. Pim swears the Steamwell is
// the hottest place in the north (a red herring: hot water is not fire). Then the player works out where to go.
chapter({
  id: 'f_hearth', act: 3, after: 'f_pass', next: 'f_maze', takeover: true,
  card: ['Act III · Chapter 2', ['Home Is Where the Hearth Is', 'The Dying Hearth']],
  so_far: [
    "Hearthold is named after its Great Hearth, and the Hearth is dying: it sank to a flicker the night a white moth flew over to Mount Dread. It was first lit with Blaze, a blue fire, and nobody alive knows where Blaze came from.",
    'The Great Hearth is dying. It was lit with blue fire. Nobody knows where that came from.'],
  mom: [["A town with a giant fireplace? That's my kind of town.", 'A town with a giant fireplace? Nice!']],

  place: {
    // on the old stones beside the Hearth's mouth, on the dais (the Hearth's own prompt, "Look at the Great Hearth", is
    // in front of the mouth, 70 px east of this one, so each has its own place to stand)
    f3_lintel_spot: { map: 2, at: [6730, 48985], r: 16, kind: 'examine', h: 90,
      name: ['the carving beside the Hearth', 'the carving'], aliases: ['the lintel', 'the old carving'],
      prompt: ['Look at the carving on the Hearth', 'Look at the carving'], say: 'f3_lintel' },
  },

  clue: {
    f3_moth_flew: { icon: 'moth',
      text: ['Brynja saw a white moth, wider than her roof, fly over Hearthold to Mount Dread. The storm on the mountain began that same night.',
        'A white moth flew to Mount Dread. The storm began that night.'] },
    f3_blue_ash: { icon: 'fire',
      text: ['At the very back of the Great Hearth, under the grey, the oldest ash is blue. The first fire in it was blue fire.',
        'The oldest ash in the Hearth is blue.'] },
    f3_lintel: { icon: 'book',
      text: ['Carved beside the Hearth: a horned girl and a tall lady with icicle horns, holding one flame. Under it: LIT AT THE NORTH FORGE.',
        'The carving says: LIT AT THE NORTH FORGE.'] },
    f3_forge_map: { icon: 'map',
      text: ["Brother Eider's old map: the North Forge is where the glacier comes down to the Glimmerfrost. Folk call that place the Glacier Maze now.",
        'The North Forge is under the glacier. Folk call it the Glacier Maze.'] },
    f3_steamwell: { icon: 'wave', herring: true,
      text: ['Pim says the Steamwell is the hottest place in the north. It never, ever freezes.',
        'Pim: the Steamwell is the hottest place. It never freezes.'] },
  },

  deduce: {
    where_blaze: {
      mystery: 'long_winter',
      ask: ['Where can Ash find fire hot enough to wake the Great Hearth?', 'Where is fire hot enough for the Hearth?'],
      needs: ['f3_blue_ash', 'f3_lintel', 'f3_forge_map'],
      pick: [
        { t: ["Ember's North Forge, under the glacier: the Glacier Maze", 'The North Forge, in the Glacier Maze'], right: true },
        { t: ['The Steamwell', 'The Steamwell'],
          hint: ['The Steamwell is hot WATER, not fire. And the mitten man on the road near it is still frozen.',
            'Hot water is not fire. Is anyone near it thawed?'] },
        { t: ["Gunnhild's forge in town", "Gunnhild's forge"],
          hint: ['Her forge went cold the same night as the Hearth. And its fire was orange, like yours. The ash in the Hearth is blue.',
            'Her forge went cold too. Its fire was orange.'] },
      ],
      then: ['xp 200'],
    },
  },

  step: [
    { id: 'brynja', do: 'talk f_brynja', scene: 'f_brynja', then: ['set f3_brynja'],
      obj: ['Talk to the Hearthkeeper at the Great Hearth', 'Talk to the Hearthkeeper'],
      hint: ['The Hearthkeeper is at the Great Hearth, right in the middle of town. Big fireplace. Can\'t miss it.',
        'She is at the Great Hearth, in the middle of town.'] },
    { id: 'look', do: 'all', obj: ['Find out where the blue fire came from', 'Where did the blue fire come from?'],
      hint: ['Look at the Hearth itself, and the old carving beside its mouth. And ask whoever keeps the old books, in the Hearth Archive near the square.',
        'Look at the Hearth and its carving. Ask the book keeper.'],
      parts: [
        { do: 'examine f_lm_hearth', scene: 'f3_blue_ash', then: ['clue f3_blue_ash'] },
        { do: 'examine f3_lintel_spot', then: ['clue f3_lintel'] },
        { do: 'talk f_eider', scene: 'f3_eider', then: ['clue f3_forge_map'] },
      ],
      extra: [
        { do: 'talk f_pim', scene: 'f3_pim', then: ['clue f3_steamwell'] },
      ] },
    { id: 'deduce', do: 'deduce where_blaze', scene: 'f3_where_blaze', then: ['stage f_maze'],
      obj: ['Work out where to find blue fire, in the Case Book', 'Open the Case Book'] },
  ],

  scene: {
    // (10 lines; no answers: she does not know where Blaze is, and says who might)
    f_brynja: [
      ['narr', 'In the middle of town stands the Great Hearth, a fireplace you could drive a cart into. Its fire is a tiny orange flicker, like a candle at the bottom of a well.',
        'The Great Hearth is huge. Its fire is a tiny flicker.'],
      ['f_brynja', "There, there, old girl. Somebody's come to see you. ...So you're the horned boy Brann keeps shouting about. Closer. Skinny. Your mother doesn't feed you.",
        "You're the horned boy? Skinny! Your mom doesn't feed you."],
      ['ash', 'She feeds me so much.'],
      ['f_brynja', "I'm Brynja, Hearthkeeper. Seventy years I've kept this fire, and my mother before me, all the way back to the night it was lit.",
        "I'm Brynja. I have kept this fire for 70 years. My mother did too."],
      ['f_brynja', 'Then a white moth came over, wider than my roof, flying to Mount Dread. The Hearth went cold as a fish. That same night, the storm began up there.',
        'Then a white moth flew to Mount Dread. The Hearth went cold. The storm began.', { clue: 'f3_moth_flew' }],
      ['narr', 'You breathe your biggest, hottest breath into the Hearth. The flicker jumps up. Then it shivers and shrinks back down.',
        'You breathe your biggest fire. The flame jumps up. Then it shrinks again.'],
      ['f_brynja', "Kind of you. But that's a breath for candles, child. She was lit with Blaze: fire so hot it burns blue.",
        'Kind of you. But that fire is for candles. She was lit with blue fire.'],
      ['ash', 'A breath for candles. Okay. Where do I get blue fire?', 'Candles. Okay. Where is blue fire?'],
      ['f_brynja', 'Nobody alive knows. Brother Eider might. He keeps the old books in the Hearth Archive, across the square.',
        'Nobody knows. Ask Brother Eider. He keeps the old books.', { promise: 'f_eider' }],
      ['f_brynja', 'And look at my old girl yourself. She remembers more than I do.', 'And look at my old girl. She remembers more than me.', { ref: 'f_lm_hearth' }],
    ],
    f3_blue_ash: [
      ['narr', 'You poke about at the very back of the Hearth, where the oldest ash is. Under the grey, it is blue. Bright blue, like a summer sky.',
        'At the back of the Hearth, the oldest ash is blue.', { clue: 'f3_blue_ash' }],
      ['ash', 'The very first fire in here was blue fire. Blaze!', 'The first fire here was blue. Blaze!'],
    ],
    f3_lintel: [
      ['narr', "Carved into the old stones beside the Hearth's mouth: a horned girl and a tall lady with icicle horns, holding one flame between them.",
        'A carving: a horned girl and a tall lady with icicle horns. They hold one flame.'],
      ['narr', 'Under it, in very old letters: LIT AT THE NORTH FORGE.', 'Under it: LIT AT THE NORTH FORGE.', { clue: 'f3_lintel', ref: 'f_glacier' }],
      ['tove', "That girl is Ember. I'd know those horns anywhere.", 'That girl is Ember!'],
      ['ash', 'And the tall one, with the icicle horns?', 'And the tall one?'],
      ['tove', 'Read the words, Ash. Not the pictures.', 'Read the words. Not the pictures.'],
    ],
    // in the Hearth Archive (Eider's house)
    f3_eider: [
      ['f_eider', 'Shh! Sorry, not you. I was talking to the books. They get nervous in the cold.', 'Shh! Not you. The books are nervous.'],
      ['ash', 'Where is the North Forge?', { ref: 'f_glacier' }],
      ['f_eider', 'The North Forge! Nobody has asked me that in forty years. Here: the oldest map in the archive.', 'The North Forge! Here: the oldest map.', { ref: 'f_glacier' }],
      ['narr', 'A crackly map. Where the glacier comes down to the frozen lake, the Glimmerfrost, someone drew a little flame and wrote NORTH FORGE.',
        'Where the glacier meets the frozen lake: a little flame. NORTH FORGE.', { clue: 'f3_forge_map', ref: 'f_glacier' }],
      ['f_eider', "The ice swallowed it long ago. Folk call that place the Glacier Maze now. People who go in get lost, and people who get lost don't come out to complain about the name.",
        'The ice ate it. Folk call it the Glacier Maze now. People get lost in it.'],
    ],
    f3_pim: [
      ['f_pim', 'Hot cocoa! Three coins! Two coins if you heat it yourself!', 'Hot cocoa! Three coins!'],
      ['ash', "I'm looking for the hottest place in the north.", 'Where is the hottest place in the north?', { ref: 'f_steamwell' }],
      ['f_pim', "The Steamwell! Down the White Road. It never, ever freezes. My cocoa is second. I'm working on it.",
        'The Steamwell! It never freezes. My cocoa is second.', { ref: 'f_steamwell' }],
    ],
    // after the right answer
    f3_where_blaze: [
      ['ash', "Ember's North Forge, under the glacier. If anything up here still has blue fire in it, it's that.", 'The North Forge. The blue fire is there!', { ref: 'f_glacier' }],
      ['tove', "Then we go round. The North Gate's frozen shut, and the Captain at the West Gate knows the long way.", 'The North Gate is frozen. Brann knows the way round.',
        { promise: 'f_brann', ref: 'f_lm_northgate' }],
    ],
  },

  talk: {
    f_brynja: [
      { if: 'flag f3_brynja !solved where_blaze', say: ['Look at my old girl, child. Look close. And ask Eider. He reads everything twice.',
        'Look at the Hearth. And ask Eider.'] },
    ],
    // (Brann remembers what Ash said at the West Gate: G.choices.f3_moth)
    f_brann: [
      { if: 'stage=f_hearth choice f3_moth=moth', say: ["Who goes... oh. It's the moth. I mean the dragon. I mean... carry on. The Hearthkeeper's at the Great Hearth.",
        "Oh. It's the moth. I mean the dragon. Carry on."] },
      { if: 'stage=f_hearth', say: ['The Hearthkeeper is at the Great Hearth, Horns. Middle of town. Follow the warm.',
        'The Hearthkeeper is at the Great Hearth.'] },
    ],
  },
})
