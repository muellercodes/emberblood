// game/story/act2/q_whip.js (A2S): The Ghost of the Saucy Gull (c_whip). Giver: Old Tarbuckle, the Saltmarsh jetty.
// A ghost pirate died hungry. Chowder Charlie can cook his supper if Ash brings three sea peppers from the Rockpools
// (one on a cliff ledge: claws). At night, at low tide, the bowl goes on the wreck's deck. Surprise: the ghost wants
// grace said first, and fights for his supper; afterwards he admits what scared even him, three nights ago (clue
// q_ghost_saw for what_stopped). Payoff: Ingrid forges his anchor chain into the Chain Whip, the Act II weapon, and
// points Ash at the hook posts (gates_map1.js). Old saves: QDEFS.c_whip steps 0..5 map to charlie, peppers, brew,
// ghost, elias, forge. The peppers and the ghost fight stay x1_people's (legacy steps); the boss intro and outro are
// the STORY keys c_saltbeard_intro and c_saltbeard_won, replaced here (defineBoss holds those arrays).
quest({
  id: 'c_whip', act: 2, giver: 'c_tarbuckle', optional: true, takeover: true,
  title: ['Supper-natural', 'The Ghost of the Saucy Gull'],
  payoff: { kind: 'power', id: 'whip' },
  old_steps: ['charlie', 'peppers', 'brew', 'ghost', 'elias', 'forge'],

  item: {
    c_seapepper: { name: ['Sea pepper', 'Sea pepper'], icon: 'pepper', desc: ['Small, red and furious.', 'Small and red. Hot!'] },
    c_chowder: { name: ['Ghost Pepper Chowder', 'Ghost Pepper Chowder'], icon: 'bowl',
      desc: ['It glows a faint red. Do not eat it. It is for the dead.', 'Do not eat it! It is for a ghost.'] },
    c_chain: { name: ["Saltbeard's anchor chain", "Saltbeard's chain"], icon: 'chain',
      desc: ['Cold, heavy, and it clinks like it wants a job.', 'A heavy old chain.'] },
    c_sock: { name: ['A very old sock', 'An old sock'], icon: 'sock', keepsake: true,
      desc: ["Old Tarbuckle's. Never washed. Lucky.", 'A lucky old sock.'] },
  },

  clue: {
    q_ghost_saw: { icon: 'moth', mystery: 'what_stopped',
      text: ["Captain Saltbeard's ghost: the night the clocks stopped, something flew over the Rockpools, wings like a sky full of curtains. Even he hid.",
        'A giant winged thing flew over that night.'] },
  },

  step: [
    { id: 'charlie', do: 'talk c_charlie', scene: 'wp_charlie',
      obj: ['Ask Chowder Charlie about the Ghost Pepper Chowder', 'Ask Charlie about the chowder'] },
    { id: 'peppers', do: 'all', legacy: true,
      obj: ['Pick 3 sea peppers in the Rockpools tide pools', 'Pick 3 sea peppers on the Rockpools'],
      parts: [
        { do: 'wait_for flag c_pep1', marker: 'c_lm_pep1', hint: ['Two crabs guard this one.', 'Two crabs guard it.'] },
        { do: 'wait_for flag c_pep2', marker: 'c_lm_pep2', hint: ['A Mudgulper thinks this one is his.', 'A Mudgulper guards it.'] },
        { do: 'wait_for flag c_pep3', marker: 'c_lm_pep3', hint: ['On a ledge halfway down the cliff. Climb down with your claws.', 'On a cliff ledge. Use claws.'] },
      ] },
    { id: 'brew', do: 'talk c_charlie', scene: 'wp_brew', then: ['take c_seapepper 3', 'give c_chowder'],
      obj: ['Bring the sea peppers to Chowder Charlie', 'Bring the peppers to Charlie'] },
    { id: 'ghost', do: 'wait_for flag c_saltbeard_won', legacy: true, marker: 'c_lm_deck',
      obj: ['At night, at low tide, set the chowder on the deck of the Saucy Gull', 'At night, put the chowder on the wreck'],
      hint: ["Old Tarbuckle will wait with you until dark. The tide must be low: the Tide Clock in Saltmarsh tells it when.",
        'Go at night, at low tide.'] },
    { id: 'elias', do: 'talk c_tarbuckle', scene: 'wp_elias', obj: ['Tell Old Tarbuckle', 'Tell Old Tarbuckle'] },
    { id: 'forge', do: 'talk c_ingrid', scene: 'wp_forge', then: ['take c_chain', 'weapon whip', 'give coins 60', 'xp 1000'],
      obj: ['Take the anchor chain to Ingrid at the Bright Anvil', 'Take the chain to Ingrid'] },
  ],

  scene: {
    wp_offer: [
      ['c_tarbuckle', 'In my day there was a pirate on this coast. Captain Saltbeard. Beard so salty you could season soup with it.',
        'There was a pirate called Captain Saltbeard.'],
      ['c_tarbuckle', 'His ship, the Saucy Gull, sank on the Rockpools forty years ago. Some nights you still hear his chain. Clank. Clank.',
        'His ship sank. At night his chain clanks.'],
      ['c_tarbuckle', "He died hungry. Missed his supper: Ghost Pepper Chowder, Charlie's grandpa's recipe.", 'He missed his supper. Ghost Pepper Chowder.'],
      ['c_tarbuckle', 'Bring the old fool a bowl and let him rest. And get my sock back. He owes me a sock.', 'Bring him a bowl. And get my sock!'],
      { choose: 'c_whip_offer', ask: ['Help the ghost get his supper?', 'Help the ghost?'], pick: [
        { t: ['I will. Ghosts need supper too.', 'I will help!'], tone: 'kind', then: ['quest start c_whip'],
          say: [['c_tarbuckle', 'Good lad. Start with Charlie at the Chowder Pot. Tell him Elias Tarbuckle sent you.', 'Ask Charlie at the Chowder Pot.']] },
        { t: ['Ghosts? No thank you.', 'No thanks.'], say: [['c_tarbuckle', 'In my day we were scared of nothing. Except ghosts.', 'In my day we feared ghosts too.']] },
      ] },
    ],
    wp_charlie: [
      ['c_charlie', "Ghost Pepper Chowder? Nobody's been brave enough to make that in forty years.", 'Nobody has made that in forty years!'],
      ['c_charlie', 'I need three sea peppers. Little red ones. They grow in the Rockpools, and the crabs will not share.',
        'Bring me 3 sea peppers from the Rockpools.'],
      { if: '!power claws', then: [['c_charlie', "One grows on a cliff ledge. You'd want claws for that one.", 'One is on a cliff. You need claws.', { ref: 'c_lm_pep3' }]] },
    ],
    wp_brew: [
      ['c_charlie', 'Three sea peppers. Stand back. Further. Further than that.', 'Three peppers! Stand back!'],
      ['narr', 'The chowder bubbles and glows a faint red. Your eyes water from across the room.', 'The chowder glows red. Your eyes water.'],
      ['c_charlie', "Don't eat it. I mean it. That bowl is for the dead.", "Don't eat it! It's for the dead."],
      ['c_charlie', "Set it on his deck at night, when the tide's out. Then run. Or don't.", 'Put it on his deck at night.'],
      { if: '!flag c_lowtide', then: [['c_charlie', "And the tide's stuck high. The deck's under water till Mina's clock works.",
        'The tide is stuck. Fix the Tide Clock first.', { fact: 'c_tide_clock=high' }]] },
    ],
    // replaces STORY.c_saltbeard_intro (the Saucy Gull boss site plays it)
    c_saltbeard_intro: [
      ['narr', 'You set the bowl on the tilted deck. Somewhere in the dark, a chain goes clank. Clank. CLANK.', 'You set down the bowl. CLANK.'],
      ['narr', 'A huge pale pirate rises up through the deck, beard like sea foam, an anchor over his shoulder.', 'A huge ghost pirate rises up!'],
      ['c_saltbeard', 'WHO DARES set food on MY deck without SAYING GRACE?', 'WHO puts food on MY deck?', { mood: 'furious' }],
      ['ash', 'Um. Grace?'],
      ['c_saltbeard', 'Too late! Fight me for it, landlubber! Winner gets the chowder!', 'Too late! Fight me for it!', { mood: 'determined' }],
    ],
    // replaces STORY.c_saltbeard_won: right after a boss, so at most 6 lines (x1_people then gives c_chain and c_sock)
    c_saltbeard_won: [
      ['narr', 'Captain Saltbeard sits down on his own deck and slurps the chowder. He glows brighter with every spoonful.',
        'Saltbeard slurps the chowder. He glows.'],
      ['c_saltbeard', 'Forty years I waited for this bowl. Worth it.', 'Forty years I waited! Worth it.', { mood: 'peaceful' }],
      ['c_saltbeard', 'The night the clocks stopped, something flew over these rocks. Wings like a sky full of curtains. Even I hid.',
        'A huge thing flew over that night. I hid!', { mood: 'worried', clue: 'q_ghost_saw' }],
      ['c_saltbeard', 'Tell Elias sorry about the cards. And take my chain. Give it a better job than holding me down.',
        'Tell Elias sorry. Take my chain.', { mood: 'tender' }],
      ['narr', "Then he's gone. There's only the tide, an empty bowl, and one very old sock.", 'He is gone. Just a bowl and an old sock.'],
    ],
    wp_elias: [
      ['c_tarbuckle', "He's gone? Properly gone? ...Good. The old fool. Is that my sock?", "He's gone? Good. Is that my sock?"],
      ['c_tarbuckle', "Keep it. For luck. It's never been washed.", 'Keep it. For luck.'],
      ['c_tarbuckle', 'Take that chain to Ingrid at the Bright Anvil. A chain that held a ghost wants a better job.', 'Take the chain to Ingrid the smith.'],
    ],
    wp_forge: [
      ['c_ingrid', 'An anchor chain off a ghost ship? JA! Best day of my life! One minute!', "A ghost's chain? JA! One minute!"],
      ['narr', 'Clang. Clang. Clang. Sparks, steam, singing. Ingrid holds up a chain with a brass grip and a heavy hook.',
        'CLANG! CLANG! A chain with a hook!'],
      ['c_ingrid', 'The Chain Whip! It reaches far and pulls. Shields, crabs, levers, the odd baron.', 'The Chain Whip! It reaches far and pulls.'],
      ['c_ingrid', "And hook posts! Lash one and you swing right over the water. Saltbeard's crew left two out by Gull Isle.",
        'Lash a hook post to swing over water!', { promise: 'wh_isle_out' }],
    ],
  },

  talk: {
    c_tarbuckle: [
      { if: 'stage>=c_salt !quest c_whip active !quest c_whip done', option: ['Tell me a ghost story', 'Tell me a ghost story'], scene: 'wp_offer' },
      { if: 'quest c_whip active item c_chowder !night', option: ['Can I wait here until dark?', 'Can I wait for dark?'],
        then: ['time night'],
        say: ["Sit, sit. I'll tell you about the time I wrestled an octopus. Took all day, and that's why I don't eat eels.", "Sit. I'll tell you about an octopus."] },
    ],
  },
})
