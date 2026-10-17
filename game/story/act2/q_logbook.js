// game/story/act2/q_logbook.js (A2S): Pearl's Logbook (c_logbook). Giver: Archivist Ottoline, the Turning Library
// (Sister Wren joins by letter, c_pb_5). Six pages of Mother Pearl's logbook blew away long ago: five are in her old
// places (the Gullcrag Caves, the Brassworks, the Lighthouse; the dungeons call cPearlPage) and the last is on Gull
// Isle (wings off the cliff updraft, or the whip hook posts in gates_map1.js). Surprise: the last page tells of a
// moth with a voice like a lullaby who asked Pearl for a light that never goes out, a thousand years ago. Payoff: a
// story truth for why_glowing (q_pearl_moth), a Heart Ember for all six, and Pearl's letter, which opens the "Pearl
// wrote a letter" choice at the Spire (A2b reads quest c_logbook done). Old saves: QDEFS.c_logbook step 0 maps to
// pages. Ottoline's page-by-page delivery (coins, a blessing at 3, the Heart Ember and letter at 6) stays
// x1_people's own onTalk while this step is current (legacy).
quest({
  id: 'c_logbook', act: 2, giver: 'c_ottoline', optional: true, takeover: true,
  title: ["Pearl's Logbook", "Pearl's Logbook"],
  payoff: { kind: 'truth', id: 'q_pearl_moth' },
  old_steps: ['pages'],

  item: {
    c_pearl_letter: { name: ["Pearl's letter", "Pearl's letter"], icon: 'letter', keepsake: true,
      desc: ['"To my children with no fire. Fire isn\'t the only warm thing. Hands are warm. Soup is warm. A lit window is warm."',
        '"Fire isn\'t the only warm thing."'] },
  },

  clue: {
    q_pearl_moth: { icon: 'note', mystery: 'moth_mask',
      text: ["Pearl's last logbook page: a thousand years ago a big moth with a voice like a lullaby asked her for a light that never goes out. She said lights are for sharing.",
        'A lullaby moth asked Pearl for a light. Long ago.'] },
  },

  step: [
    { id: 'pages', do: 'wait_for flag c_logbook_done', legacy: true, marker: 'c_ottoline',
      obj: ["Find the six lost pages of Pearl's Logbook and bring them to Archivist Ottoline", "Find Pearl's 6 pages. Bring them to Ottoline."],
      hint: ["Pages hide in Pearl's old places: the Gullcrag Caves, the Brassworks, the Lighthouse. Madame Ravel says the last is on Gull Isle.",
        'Look in caves, the Brassworks, the Lighthouse. And Gull Isle.'],
      then: ['clue q_pearl_moth'] },
  ],

  scene: {
    lb_offer: [
      ['c_ottoline', "Mother Pearl kept a logbook. Every day of her life on this coast. And six of its pages are MISSING. Sorry. Missing.",
        "Six of Pearl's pages are MISSING! Sorry."],
      ['c_ottoline', "They blew away in a great storm, long ago. Pearl's old places might still hold them. Caves. Lofts. Lighthouses.",
        "Look in Pearl's old places.", { ref: 'c_gullcrag_door' }],
      { if: 'flag c_pb_5', then: [['c_ottoline', 'Sister Wren wrote that you would ask. She also wrote that I am wrong about commas. I am not.',
        'Wren said you would come. She is wrong.']] },
      { choose: 'c_logbook_offer', ask: ["Bring them to me? I'll pay you in coins. And in being quiet. Mostly coins.", 'Bring them? I will pay.'],
        pick: [
          { t: ["I'll find them.", "I'll find them."], tone: 'kind', then: ['quest start c_logbook'],
            say: [['c_ottoline', 'WONDERFUL! ...Sorry. Wonderful.', 'WONDERFUL! Sorry.']] },
          { t: ['Not right now', 'Not now'], say: [['c_ottoline', 'The pages have waited three hundred years. They can wait for lunch.', 'They can wait.']] },
        ] },
    ],
  },

  talk: {
    c_ottoline: [
      { if: 'stage>=c_salt !quest c_logbook active !quest c_logbook done', option: ["Tell me about Pearl's logbook", "What is Pearl's logbook?"],
        scene: 'lb_offer' },
    ],
  },
})
