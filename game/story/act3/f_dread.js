// Act III, Chapter 5 (The Dreadgate), second half: the Heart of Dread (owner A3b). Data only.
// What the player does: up through the inside of Mount Dread (code dungeon, x2_dun_b): practice chains everywhere,
// the Frozen Choir of Hearthold soldiers, Grumbo the yeti, the chained dragon statues, the secret nursery with its
// carving of two baby dragons (bonus clue f3_nursery: a fire one and an ice one, the brother and the sister), and the
// last door with four chains. The snow_mother question is ready in the Case Book from the drum on; it may be answered
// any time here. Out of the summit door onto the Crown, the blizzard stops like someone pressed a button, and if the
// player has not answered it yet, Ash asks Tove who she really is, and Tove will not say (x2_story's f2sCrownDoor plays
// f_crown_door, this file's, and moves the stage to f_glaciar).
// Every scene here is an old STORY key, replaced in place.
chapter({
  id: 'f_dread', act: 3, after: 'f_dreadgate', next: 'f_glaciar', takeover: true,
  card: null, name: ['The Dreadgate', 'The Dreadgate'],
  so_far: [
    'Ash knocked on the mountain with a Ground Pound and beat Hush at the Dreadgate. The Frost Lock broke. Now he climbs up through the Heart of Dread, toward whoever is breathing out the Long Winter.',
    'The Dreadgate is open! Ash climbs up inside the mountain.'],
  mom: [['Inside a mountain? Take a lantern. Take two. And a sandwich.', 'Inside a mountain? Take a lantern!']],

  clue: {
    f3_nursery: { icon: 'heart', mystery: 'long_winter',
      text: ['In a secret nursery inside the mountain: a carving of two baby dragons. One breathes fire on the other\'s tail. The other one cries icicles.', 'A carving: two baby dragons. One fire, one ice.'] },
  },

  step: [
    { id: 'climb', do: 'dungeon f_dread', at: 'f_dread_door',
      obj: ['Climb up through the Heart of Dread', 'Climb up inside the mountain'],
      hint: ['Up through the mountain. Melt every chain, pound the plates and shoot the eyes. I\'m right here with you.', 'Go up through the mountain. Melt every chain.'],
      // the snow_mother question can be answered here already (its clues are all in after the drum). And a player who
      // rode up and knocked on the drum before working it out in the Case Book (or a save from before the Case Book)
      // gets the Dreadgate question closed: he did open it, after all.
      extra: [
        { do: 'deduce snow_mother' },
        { do: 'wait_for !solved how_open', then: ['clue f3_gate_carving', 'clue f3_drum_seen', 'clue f3_climbers', 'solve how_open'] },
      ] },
  ],

  scene: {
    f_dread_in: [
      ['narr', 'Inside Mount Dread it is very quiet. Black rock, purple ice, and chains everywhere you look: on statues, on bridges, and some on nothing at all.', 'Inside the mountain: black rock, purple ice, and chains everywhere.'],
      ['tove', 'Moth-frost chains. Practice ones, I think. Somebody practiced for a long time.', 'Moth-frost chains. Somebody practiced for a long time.'],
      ['ash', 'Then I\'ll practice melting them.', 'Then I\'ll practice melting them.'],
      ['pip', '(Pip climbs into your hood and stays there.)', '(Pip hides in your hood.)'],
    ],
    f_dread_bridge: [
      ['tove', 'That drawbridge is chained up. Pound the plate to crack the dome, then Blaze the lock before it freezes over again.', 'Pound the plate. Then Blaze the lock, quick!'],
    ],
    f_dread_eye: [
      ['tove', 'That violet eye on the wall keeps refreezing everything. Shoot it shut first. Arrows in the pupil.', 'That purple eye refreezes things. Shoot it!'],
    ],
    f_dread_choir: [
      // (the event is for A3S's what_knights: the Frozen Choir is its bonus clue)
      ['narr', 'Twelve Hearthold soldiers stand frozen in rows, mouths open, as if they were singing. Four of them wear purple frost armor. One of them opens an eye.', 'Twelve frozen soldiers stand like a choir. One opens an eye.',
        { clue: 'f3_choir', do: ['emit beat:f_dread_choir'] }],
    ],
    f_dread_choir_key: [
      ['f_soldier', 'Here, I found this in my boot. It\'s not my boot. Thank you, dragon. Which way is lunch?', 'I found this key in my boot. Which way is lunch?'],
    ],
    f_dread_nest: [
      ['tove', 'A moth can\'t help itself near a lamp. Light the corner lamps and they\'ll forget all about the stairs.', 'Moths love lamps. Light the corner lamps!'],
    ],
    f_dread_chimney: [
      ['tove', 'A wind chimney! Ride the ribbons up. Hide in the niches when the blizzard blows across.', 'Ride the ribbons up! Hide when the blizzard blows.'],
    ],
    f_grumbo_intro: [
      ['narr', 'A huge white yeti with violet eyes thumps his chest. A small lunchbox is chained to his belt.', 'A huge yeti with purple eyes thumps his chest. He has a lunchbox.'],
      { if: { any: ['flag f_mumble_ally', 'quest f_mumble done'] }, then: [
        ['f_mumble', '(peeking in, very quietly) (squeak) ...that\'s Grumbo. He took my lunch every day for ninety years.', '(squeak) That\'s Grumbo. He took my lunch for ninety years.'] ] },
      ['f_grumbo', 'Grumbo SMASH! Grumbo smash... a little.', 'Grumbo SMASH! Grumbo smash a little.'],
    ],
    f_grumbo_won: [
      ['f_grumbo', 'Okay okay okay! I give up! Mumble can have his lunch back!', 'Okay! I give up! Mumble can have his lunch back!'],
      { if: { any: ['flag f_mumble_ally', 'quest f_mumble done'] }, then: [
        ['f_mumble', '(squeak) Thank you.', '(squeak) Thank you.'],
        ['f_grumbo', 'Sorry, Mumble. Sorry.', 'Sorry, Mumble.'] ] },
    ],
    f_dread_dragons: [
      ['tove', 'Ice statues of old dragons, every one in chains. Don\'t wake the big ones. I mean it.', 'Old dragon statues. Don\'t wake the big ones.'],
    ],
    f_dread_egg: [
      ['narr', 'The ice egg in the little dragon\'s arms cracks open. Inside, warm and red, is a Heart Ember.', 'The ice egg cracks open. A warm Heart Ember!'],
    ],
    f_dread_nursery: [
      ['narr', 'A tiny round room with a nest of frost and very old toys: giant ice knitting needles, a snowglobe, and a carving of two baby dragons. One is breathing fire on the other one\'s tail. The other is crying icicles.', 'Old toys, and a carving of two baby dragons: one fire, one ice.', { clue: 'f3_nursery' }],
      ['tove', 'Siblings. One of them grew up and burned a valley. The other one grew up and slept.', 'One grew up and burned a valley. One grew up and slept.'],
    ],
    f_dread_stair: [
      ['tove', 'Last room. Then her. Are you scared?', 'Last room. Then her. Are you scared?'],
      ['ash', 'Yes.', 'Yes.'],
      ['tove', 'Good. Me too. Let\'s go.', 'Good. Me too. Let\'s go.'],
    ],
    f_dread_lastchain: [
      ['tove', 'Four chains on the last door. One of them you can only reach from outside. Through that window, I think. Brr.', 'Four chains on the door. One is outside the window.'],
    ],
    // out of the summit door onto the Crown (x2_dun_b, then x2_story's f2sCrownDoor; it moves the stage to f_glaciar)
    f_crown_door: [
      ['narr', 'The last chain snaps. You climb out of the summit door into the blizzard, and it howls right in your face.', 'The last chain snaps. You climb out into the howling blizzard.', { ref: 'f_crown' }],
      { cam: 'f3_glaciar_face', s: 2 },
      ['narr', 'Then, all at once, the wind stops. Like someone pressed a button.', 'Then the wind stops. All at once.'],
      ['tove', 'She\'s right there, Ash. I can feel her. She\'s so cold she\'s almost warm.', 'She\'s right there. She\'s so cold she\'s almost warm.'],
      { if: 'solved snow_mother', then: [
        ['ash', "Okay. Okay. I'm going to meet Grandpa's sister. Hat off. Be polite. Drink the ice tea.", "Okay. I'm meeting Grandpa's sister. Be polite."] ],
        else: [
        ['ash', 'Who is she, Tove? Really?', 'Who is she, Tove?'],
        ['tove', "Hearthold sings about a Snow Mother. Hush talks about a Mother. You've seen everything I've seen, Ash. You say it.", "You've seen what I've seen. You say it."] ] },
    ],
  },
})
