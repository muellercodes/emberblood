// game/story/act5/q_n5_vesper.js (N5S): Vesper on the climb (FINALE_V10 2.4, 2.8). Ring 2, the Silk Gallery.
// A friend from Act II (flag n5_vesper, set by N5a's n_arrive) drops in at the near shore: n_vesper_join, played by
// N5a's n_clocks step at n5_v_shore; she leaves at the way up with n_vesper_bye (N5a). A Vesper Ash lost in Act II
// left her real mask on the cliff (n5_v_mask: n_vesper_absent), and has been following him on her silk line. When Ash
// lands on the middle island, the line snaps and she hangs off its rim by one hand: the same picture as the night on
// the Great Clock's minute hand. Grab her wrist (or give her Gran's lost letter first) and she comes along.
// Surprise: she was not following Ash. She was following the Night Mother, and Ash kept getting in the way.
// Payoff: ally (n5_vesper, trust friends +1); Gran's errand (q_n5_oona) starts. The quest only starts for a missing
// Vesper: N5a's n_clocks runs `quest start q_n5_vesper`, and examining the mask starts it too.
quest({
  id: 'q_n5_vesper', act: 5, optional: true, if: '!flag n5_vesper',
  title: ['The Thief on the Silk Gallery', 'Vesper on the silk bridge'],
  payoff: { kind: 'ally', id: 'n5_vesper' },

  place: {
    // where a friend Vesper drops in (the old trigger circle, x4_story.js:1106); N5a's goto step uses it
    n5_v_shore: { map: 4, kind: 'spot', at: [1760, 84900], r: 250, name: ['the near end of the Silk Gallery', 'the silk bridge'] },
    // her real moth mask on the cliff by the near shore (Vesper missing)
    n5_v_mask: { map: 4, kind: 'examine', at: [1720, 84880], r: 24, h: 26, look: 'n5_cracked_mask', states: { seen: 'n5_cracked_mask' },
      name: ['a cracked moth mask', 'a cracked mask'], if: '!flag n5_vesper stage>=n_clocks',
      say: 'n_vesper_absent', then: ['quest start q_n5_vesper'],
      states_say: { seen: ['Her cracked mask. Under it, the note: "Sorry. V."', 'The cracked mask. "Sorry. V."'] } },
    // the middle island of the five (N4G.gallery posts, a 58 px island round n4P(2850,282))
    n5_v_hang: { map: 4, kind: 'spot', at: [1712, 85792], r: 80, name: ['the middle island of the Silk Gallery', 'the middle island'] },
    // Vesper hanging off the island's rim while the step waits (drawn only, no prompt)
    n5_v_dangle: { map: 4, kind: 'prop', at: [1712, 85846], look: 'n5_vesper_hang', name: ['Vesper', 'Vesper'],
      if: 'quest q_n5_vesper active !choice n5_hang' },
  },

  step: [
    { id: 'mask', optional: true, do: 'examine n5_v_mask',
      obj: ['Look at the cracked mask by the Silk Gallery', 'Look at the cracked mask'] },
    { id: 'hang', do: 'goto n5_v_hang', scene: 'n5_vesper_hang',
      obj: ['Cross the Silk Gallery. Someone is out there on the islands.', 'Cross the silk bridge'],
      hint: ['Grapple from post to post. Somebody is hanging off the middle island.', 'Someone is on the middle island!'] },
  ],

  scene: {
    // Vesper was a friend in Act II: she drops in at the near shore (N5a plays it at n5_v_shore). Rewrites x4_story.js:249-259.
    n_vesper_join: [
      ['narr', 'Someone drops out of the dark on a silk line and lands beside you without a sound. A moth mask. A crooked grin.',
        'Someone drops down on a silk rope. A moth mask. A grin.'],
      ['c_vesper', "You're climbing a copy of my city. Badly.", 'You are climbing a copy of my city. Badly.'],
      ['ash', 'VESPER!'],
      ['c_vesper', 'Hi, cousin. Thought you might need a thief. Thieves are good at getting into places nobody wants you in.',
        'Hi, cousin! You need a thief. Thieves get in anywhere.'],
      ['ash', 'How many greats is a cousin?'],
      ['c_vesper', "None. Cousins don't get greats.", 'None. Cousins have no greats.'],
      ['ash', "Then you're my favorite relative.", 'Then you are my favorite!'],
      ['c_vesper', "Don't tell the dragon grandpa. And look out there. She hid one more grapple post in the dark. I find things people hide.",
        'Don\'t tell Grandpa. She hid one more post. I found it.', { do: ['set n_vline'] }],
      ['c_vesper', "One more thing. Gran doesn't know where I am. She'll be sitting up all night with the kettle on.",
        "Gran doesn't know where I am. She'll worry.", { do: ['quest start q_n5_oona'] }],
    ],
    // Vesper was lost in Act II: her real mask on the cliff (rewrites x4_story.js:261-264, and leads into the hang)
    n_vesper_absent: [
      ['narr', 'On the edge of the cliff lies a moth mask. A real one, not glass. It is cracked down the middle.',
        'A real moth mask lies here. It is cracked.'],
      ['narr', 'Under it is a scrap of paper. It says: "Sorry. V."', 'A note says: "Sorry. V."'],
      ['ash', '...Me too.'],
      ['pip', 'Mip?'],
      ['narr', 'Out over the dark, between the islands, a silk line creaks. Then it is quiet.', 'Out over the dark, a silk rope creaks.'],
      ['ash', 'Vesper? ...Is that you out there?', 'Vesper? Are you out there?', { do: ['world n5_v_mask seen', 'quest start q_n5_vesper'] }],
    ],
    // the second chance on the middle island (the clock hand again)
    n5_vesper_hang: [
      ['narr', 'SNAP. A silk line whips past your nose. Something drops off the end of it.', 'SNAP! A silk rope breaks. Something falls!'],
      ['narr', "It's Vesper. She's hanging off the rim of your island by one hand, over nothing at all.",
        'It is Vesper! She hangs off the edge by one hand.'],
      ['c_vesper', "Don't. Say. Anything."],
      ['ash', 'You were following me!'],
      ['c_vesper', "I was following HER. You just keep getting in the way. ...My hand is slipping.", 'I was following HER. My hand is slipping!'],
      { choose: 'n5_hang', ask: ['She hangs right in front of you, the way she did on the Great Clock. What do you do?', 'She is slipping! What do you do?'],
        pick: [
          { t: ['Grab her wrist and pull her up', 'Pull her up'], v: 'grab', tone: 'kind',
            then: ['trust friends +1', 'set n5_vesper', 'set n_vline', 'quest start q_n5_oona'],
            say: [['c_vesper', '...You did it again. Why do you keep DOING that?', 'You did it again. Why?'],
              ['ash', 'You were going to fall. Again.'],
              ['c_vesper', "Fine. FINE. I'm coming with you. Somebody has to watch your back, cousin.", 'Fine. I am coming with you, cousin.'],
              ['c_vesper', "And Gran doesn't know where I am. She'll be up all night with the kettle on.", "Gran doesn't know where I am."]] },
          { t: ["Hold out Gran's lost letter", "Give her Gran's letter"], v: 'letter', tone: 'kind', if: 'item m_vletter',
            then: ['take m_vletter', 'set n5_vletter', 'trust friends +1', 'set n5_vesper', 'set n_vline', 'quest start q_n5_oona'],
            say: [['narr', 'You hold out the letter Iska kept for her. She grabs your wrist to take it, and you pull.',
                'You hold out the letter. She grabs your wrist. You pull!'],
              ['c_vesper', '"Fire isn\'t the only warm thing." ...That\'s Gran. That is SO Gran.', 'That is Gran. That is so Gran.'],
              ['narr', "She doesn't say thank you. She doesn't let go of the letter, either.", 'She keeps the letter close.'],
              ['c_vesper', "I'm coming with you. Don't make it a whole thing.", 'I am coming with you. No fuss.']] },
          { t: ["Keep going. She's a thief. She can climb.", 'Keep going'], v: 'left', tone: 'brave',
            say: [['ash', "You'll find a way up. You always do."],
              ['narr', "She swings, catches the rock and hauls herself up. She doesn't look at you.", "She climbs up by herself. She won't look at you."],
              ['c_vesper', '...Right. Of course. Go on, then, little ember.', 'Right. Go on, then.'],
              ['narr', 'She will remember this.']] },
        ] },
    ],
    // a friend Vesper (or one pulled up on the gallery) goes her own way at the way up (rewrites x4_story.js:266-268)
    n_vesper_bye: [
      ['c_vesper', "I'll go up my own way. Thieves never take the stairs.", 'I will go up my own way.'],
      ['c_vesper', "See you at the top, cousin. Don't fall off anything.", 'See you at the top, cousin!'],
      { if: 'quest q_n5_oona active', then: [
        ['c_vesper', "And if you ever pass Saltmarsh, tell Gran I'm okay. She won't believe me. She'll believe you.",
          "Tell Gran I'm okay. She'll believe you."]] },
    ],
  },
})
