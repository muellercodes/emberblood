// game/story/act4/m_sail.js (A4a): Act IV, Chapter 1, "Across the Sea" (first half).
// What the player does: the morning after Act III, Pebble brings two letters (Mom: the moon has two bites gone; Dell:
// his sea boat is ready at Gearhaven's Far Pier) and Ash picks how to go east: Dell's boat, or Auntie Glaciar if she
// was freed in Act III. The voyage plays as a painted picture (the moon with two bites, a hundred moths flying east,
// a floating town in the mist), then Driftwood Landing, where m_drift begins.
// The old code still plays the intro itself (defineAct(4).intro, x3_story.js m3sIntroStart): it plays STORY.m_intro,
// which this file's scene m_intro replaces in place, and travels to the north isle when the pick sets m_ship=glaciar.
// The landing (old m3sLand, a stage update the takeover silences) is the `land` step here.
chapter({
  id: 'm_sail', act: 4, after: 'f_glaciar', next: 'm_drift', takeover: true,
  keep_enter: true,   // (the old enter hook starts the intro when the stage is entered without startAct)
  card: null, name: ['Across the Sea', 'Across the Sea'],   // (x3_story shows the Chapter 1 card after the intro)
  so_far: [
    'The moon has two bites out of it. The last Shard is somewhere east. Dell has a sea boat (and Auntie Glaciar has wings).',
    'The moon has two bites gone. The last Shard is east. Dell has a boat.'],
  hint: ["Dell is waiting at Gearhaven's Far Pier. Or, if your auntie is awake, she's outside Hearthold's North Gate, pretending not to be.",
    "Dell waits at Gearhaven's Far Pier. Or Glaciar waits by Hearthold's North Gate."],
  mom: [['A sea boat! Wear a hat. Wear two hats.', 'A sea boat! Wear a hat.']],

  place: {
    // all of Driftwood Landing: the West Dock (Dell's boat) and the north isle (Glaciar) are both inside it
    m4_moonfall: { map: 3, at: [1800, 64500], r: 900, kind: 'spot', name: ['Driftwood Landing, in Moonfall', 'Driftwood Landing'] },
    // the painted voyage pictures (screen-wide looks, v10_art4a.js), shown only while the voyage scene plays. The scene
    // fades to black first (a storybook page) and the engine draws a `layer: 'screen'` look over the fade, under the
    // HUD; at dawn the fade lifts and the picture melts away to show Driftwood.
    m4_voyage_ship: { map: 3, at: [1300, 64800], kind: 'prop', look: 'm4a_voyage_ship', if: 'flag m4_voy=ship', layer: 'screen',
      name: 'the voyage east' },
    m4_voyage_glaciar: { map: 3, at: [2345, 64320], kind: 'prop', look: 'm4a_voyage_glaciar', if: 'flag m4_voy=glaciar', layer: 'screen',
      name: 'the flight east' },
  },

  step: [
    // Ash lands in Moonfall by Dell's boat (the Far Pier crossing puts him on the West Dock) or on Glaciar's back (the
    // North Gate crossing, or the intro's own flight, puts him on the north isle); the voyage scene tells which
    { id: 'land', do: 'goto m4_moonfall', marker: 'm4_far_pier', scene: 'snl_voyage',
      obj: ["Sail east to Moonfall with Dell, from the end of Gearhaven's Far Pier", 'Sail east with Dell from the Far Pier'],
      then: ['set m_landed', 'xp 300', 'stage m_drift'] },
  ],

  scene: {
    // the old STORY.m_intro, replaced in place (x3_story's m3sIntroStart plays it, then shows the Chapter 1 card)
    m_intro: [
      ['narr', 'Morning in Hearthold. Pim is already selling cocoa. Pebble lands on your head with TWO letters, and takes TWO coins.',
        'Pebble lands on your head with TWO letters. She takes TWO coins.', { do: ['take coins 2'] }],
      ['maren', "(the first letter) Ash. Yara says the moon is smaller. I looked. It is. Two bites. Be careful. Be brave. Be home soon. Eat something. Love, Mom.",
        'Ash. The moon is smaller. Two bites. Be brave. Eat something. Love, Mom.'],
      ['maren', "P.S. Bertram's bakery exploded on Tuesday. He says it's unrelated. It's always unrelated.",
        "P.S. Bertram's bakery blew up again. He says it was not his fault."],
      ['dell', "(the second letter) Ash! Dell again! The Soggy Biscuit Three is ready at Gearhaven's Far Pier. Nobody else will sail into a dark sea, so it's me or a bathtub. I've packed sandwiches. And a librarian.",
        "Ash! It's Dell! My boat is ready at Gearhaven's Far Pier. I packed sandwiches. And a librarian.", { promise: 'm4_far_pier' }],
      ['iska', "Hello again, little ember. It's Iska. Tove says the dark is my job now, and she's right. East is where the moon's light fell. We'll need a lot of lanterns.",
        "Hello again, little ember. It's Iska. I'll help you now, not Tove. We go east. We need lots of lanterns.", { ref: 'm4_west_dock' }],
      ['narr', 'Pip climbs up onto your head. Pip is far too big for your head now. Pip disagrees.',
        'Pip climbs onto your head. He is too big now. Pip disagrees.', { if: 'flag pip' }],
      // (once Ash has landed in Moonfall, the way east is already chosen)
      { if: '!flag m_landed', then: [
        { if: 'choice f_glaciar=free', then: [
          ['narr', 'A shadow slides over the town. Glaciar lands outside the walls with a soft, enormous WHUMPH. Half of Hearthold faints. The other half cheers.',
            'Glaciar lands outside the walls. WHUMPH! Half the town faints. Half cheers.'],
          ['f_glaciar', 'Good morning, dumpling! I heard the word "east". I don\'t do fast. But I do far.',
            'Good morning, dumpling! I heard "east". I\'m slow. But I go far.', { ref: 'm4_north_gate' }],
          { choose: 'm_ship', ask: ['How will you go east?', 'How will you go east?'], pick: [
            { t: ['Fly with Auntie Glaciar', 'Fly with Glaciar'], tone: 'brave', v: 'glaciar', then: ['set m_ship=glaciar'],
              say: [['f_glaciar', "Wonderful! Climb aboard. Hold on to a horn. Not THAT horn. The other horn.", 'Wonderful! Climb on. Hold a horn. Not THAT horn!']] },
            { t: ['Sail with Dell from Gearhaven', 'Sail with Dell'], tone: 'kind', v: 'ship', then: ['set m_ship=ship'],
              say: [['f_glaciar', "A boat! How quaint. Then I'll nap. Shout if you need me. Loudly. I'm a little deaf on the left.", 'A boat! How sweet. I will nap. Shout loudly!']] },
          ] }],
          else: [
          ['iska', "Gearhaven is a long way from here. Fast travel to a Gearhaven shrine, then walk down to the Far Pier.",
            'Gearhaven is far. Fast travel to a shrine there. Then walk to the Far Pier.', { do: ['set m_ship=ship'], ref: 'm4_far_pier' }]] },
      ] },
    ],
    // the voyage, played on arrival: by Glaciar if Ash landed on the north isle, else by Dell's boat (the painted
    // pictures are the looks m4a_voyage_glaciar and m4a_voyage_ship)
    snl_voyage: [
      { if: 'near m4_north_isle 600 choice f_glaciar=free', then: [
        { do: ['set m_ship=glaciar', { journal: ["You flew to Moonfall on Auntie Glaciar's back. Very slowly.", 'You flew to Moonfall on Glaciar. Slowly.'], key: 'm_ship' }] },
        { do: ['set m4_voy=glaciar', 'world m4_voyage_glaciar sea'] }, { fade: 1 },
        ['narr', 'Glaciar flies slowly. Very slowly. Clouds overtake her. A seagull overtakes her and looks back, smug.',
          'Glaciar flies very slowly. A seagull passes her. It looks smug.'],
        ['f_glaciar', "Isn't this LOVELY, dumpling? I haven't flown this far in a thousand years. My left wing's gone to sleep.",
          "Isn't this LOVELY, dumpling? My left wing fell asleep."],
        ['ash', "Auntie, it's been two days."],
        ['f_glaciar', "Patience is a dragon's best friend. My second-best friend is you.", "Patience is a dragon's best friend. You are my second best."],
        ['narr', "On the second night the moon comes up, with two bites gone like a cookie. Moths flutter past Glaciar's nose, hundreds of them, all flying east.",
          'The moon has two bites gone. Hundreds of moths fly past, all going east.', { do: ['world m4_voyage_glaciar moths'], ref: 'm4_north_isle' }],
        ['iska', 'Follow the moths, Ash. They always know where the light is.', 'Follow the moths. They know where the light is.'],
        // (the dawn: the picture melts away over the next few seconds and Driftwood shows through)
        { do: ['world m4_voyage_glaciar dawn'], fade: 0 },
        ['narr', "On the third morning a floating town comes out of the mist. Glaciar lands on its north beach, and the whole beach freezes solid. The raft folk cheer. Free ice!",
          'A floating town! Glaciar lands. The beach freezes. Free ice!', { ref: 'm4_north_isle' }],
        { do: ['clear m4_voy'] },
        ['f_glaciar', "I'll wait here, dumpling. Dell's boat is a day behind us. His pigeon caught up with me at sea and fell asleep in my ear.",
          "I'll wait here, dumpling. Dell's boat is a day behind us."],
        ['f_glaciar', "Oh, and Brann sends his regards. He's very brave now. He asked me to say it loudly. HE IS VERY BRAVE.",
          'Brann says hello. He is VERY BRAVE now.'],
      ], else: [
        { do: ['set m_ship=ship', 'set m_dell_docked', { journal: ['You sailed to Moonfall with Dell on the Soggy Biscuit Three.', 'You sailed to Moonfall with Dell.'], key: 'm_ship' }] },
        { do: ['set m4_voy=ship', 'world m4_voyage_ship sea'] }, { fade: 1 },
        ['narr', 'The Soggy Biscuit Three chugs out of Gearhaven with a toot of steam. Dell stands at the wheel in his yellow rain hat, grinning so hard his beard sticks out sideways.',
          "Dell's boat toots out of Gearhaven. Dell grins so hard his beard sticks out."],
        ['dell', "Three days east, Ash! Past the end of every map I own! I've never been so happy or so scared!",
          "Three days east! Past every map I own! So happy. And so scared!", { ref: 'm4_west_dock' }],
        ['wren', "(green, hugging a book) I'm fine. I'm FINE. Books don't get seasick. I'm just going to read... over the side.",
          "(green) I'm fine. Books don't get seasick. I'll just read... over the side."],
        ['ash', 'Sister Wren? You came OUTSIDE?'],
        ['f_mags', "(from below deck) The engine's FINE! It's making that noise on purpose! Mostly! Dell pays me in sandwiches.",
          '(from below) The engine is FINE! The noise is on purpose! Mostly!'],
        ['ev_tikka', '(from the galley) Lumpy buns! Lumpy buns for everyone! Lumpy means love!', 'Lumpy buns for everyone! Lumpy means love!',
          { if: 'flag tk_come=yes' }],
        ['narr', 'On the second night the moon comes up over the sea. Two bites are gone from its edge, like a cookie. A hundred moths flutter past the mast, all flying east.',
          'The moon comes up. Two bites are gone. A hundred moths fly past, all going east.', { do: ['world m4_voyage_ship moths'], ref: 'm4_west_dock' }],
        ['iska', "They're going home to her. Follow the moths, Ash. They always know where the light is.",
          'They are going home to her. Follow the moths. They know where the light is.'],
        { do: ['world m4_voyage_ship dawn'], fade: 0 },
        ['narr', "On the third morning a town comes out of the mist. It's floating.", 'On the third morning, a town comes out of the mist. It floats!'],
        { do: ['clear m4_voy'] },
      ] },
    ],
  },
})
