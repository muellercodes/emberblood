// Act III, Chapter 4 (The Stonehorn Knock), first half: the Howling Gap (owner A3b). Data only.
// What the player does: with Wind Riding, Ash goes to the Windscour's north rim. The Howling Gap has no bottom, only
// howling ("Very deep. Very windy. Very no." "Very YES!"). A wind ribbon swirls up from the vent at the edge and out
// across the Gap; he rides it over (either ribbon counts). On the far side, in the Stonehorn hills, the Horned Gate:
// a ram skull as big as a house with a door in its mouth, something snoring inside, and over the door two rams
// butting heads with one carved word, KNOCK (bonus clue f3_knock_door for how_open). He goes in: Stonehorn Deep.
// The old stage's own triggers (Tove's ribbon lines as top-of-screen barks, the Gap banner, the f_gap_crossed flag,
// the skull banner) are steps and scenes here.
chapter({
  id: 'f_gap', act: 3, after: 'f_sky', next: 'f_deep', takeover: true,
  card: ['Act III · Chapter 4', 'The Stonehorn Knock'],
  so_far: [
    'Ash can ride the wind now. Brother Pennant says the old monks rode it up Mount Dread every spring and knocked, the way the Stonehorns knock. The Stonehorns live past the Howling Gap.',
    'Ash can ride the wind! The monks knocked like Stonehorns. The Stonehorns live past the Howling Gap.'],
  mom: [['Riding the WIND? Then tie your scarf twice, hold on to your hat, and come home in one piece.', 'Riding the wind? Hold on to your hat!']],

  place: {
    // the Windscour's north rim, at the vent where x2_world's first Gap ribbon (f_rib_gap1) starts (10000,44450)
    f3_gap_edge: { map: 2, at: [10060, 44560], r: 220, kind: 'spot', name: 'the edge of the Howling Gap' },
    // where the two Gap ribbons set Ash down on the far side (f_rib_gap1 ends at 10150,43300, f_rib_gap2 at 12550,43300)
    f3_gap_land_w: { map: 2, at: [10150, 43260], r: 320, kind: 'spot', name: 'the far side of the Howling Gap' },
    f3_gap_land_e: { map: 2, at: [12500, 43300], r: 320, kind: 'spot', name: 'the far side of the Howling Gap' },
  },

  clue: {
    f3_knock_door: { icon: 'question', mystery: 'long_winter',
      text: ['Over the door of the Horned Gate, two rams butt heads. Carved under them, one word: KNOCK.', 'Over the ram skull door: two rams, and the word KNOCK.'] },
  },

  step: [
    { id: 'edge', do: 'goto f3_gap_edge 220', scene: 'f3_gap_edge', migrate_if: 'flag f_gap_crossed',
      obj: ['Find the Stonehorns, past the Howling Gap', 'Find the Stonehorns'],
      hint: ['The Howling Gap cuts across the north rim of the Windscour. The Stonehorns live on the far side.', 'Go to the north rim of the Windscour.'] },
    { id: 'cross', do: 'any', migrate_if: 'flag f_gap_crossed',
      obj: ['Ride the wind across the Howling Gap', 'Ride the wind across the Gap'],
      hint: ['Jump into the swirl at the vent by the edge. The wind ribbon carries you over. Don\'t look down.', 'Jump into the swirl at the vent!'],
      parts: [
        { do: 'goto f3_gap_land_w 320' },
        { do: 'goto f3_gap_land_e 320' },
      ],
      then: ['set f_gap_crossed', { banner: ['Across the Howling Gap!', 'Across the Gap!'], sub: ['Stonehorn country. Somewhere out here lives a very deaf ram.', 'Stonehorn country!'] }] },
    { id: 'skull', do: 'goto f_stonehorn 380', scene: 'f3_horned',
      obj: ['Find the way into the Stonehorn hills', 'Find the Stonehorns\' door'],
      hint: ['Follow the snoring. It sounds like a rockslide, and it comes from a very big skull.', 'Follow the snoring.'] },
    // Stonehorn Deep (code dungeon) is the next chapter: walking in moves the stage on, as the old stage did
    { id: 'in', do: 'wait_for area f_deep', at: 'f_horned_door', then: ['set f_gap_crossed', 'stage f_deep'],
      obj: ['Go in through the door in the ram skull', 'Go in the ram skull door'],
      hint: ['The door is in the skull\'s mouth. Knock if you like. Nobody will answer.', 'Go in the skull\'s mouth.'] },
  ],

  scene: {
    f3_gap_edge: [
      { cam: 'f3_gap_land_w', s: 1.5 },
      ['narr', 'The Windscour ends in a crack in the world: the Howling Gap. You can\'t see the bottom. Down there, the wind howls like a dog that wants to come in.', 'The Howling Gap. No bottom. The wind howls down there.'],
      ['tove', 'The Howling Gap. Very deep. Very windy. Very no.', 'The Howling Gap. Very deep. Very no.'],
      ['ash', 'Very YES!', 'Very YES!'],
      ['narr', 'At the vent by your feet, a wind ribbon swirls up and out over the Gap, like a road made of air.', 'A wind ribbon swirls out over the Gap. A road of air!'],
    ],
    f3_horned: [
      { cam: 'f_horned_door', s: 1 },
      ['narr', 'A ram\'s skull as big as a house, with a door in its mouth. From somewhere deep inside comes a snore like a rockslide.', 'A huge ram skull with a door in its mouth. Something snores inside.'],
      ['narr', 'Carved over the door, two rams butt heads. Between their horns, one word: KNOCK.', 'Over the door, two rams butt heads. Carved: KNOCK.', { clue: 'f3_knock_door', ref: 'f_horned_door' }],
      ['ash', 'Knock. Okay. ...Hello? Anybody home?', 'Hello? Anybody home?'],
      ['narr', 'The snoring stops. Then it starts again, louder.', 'The snoring stops. Then it gets louder.'],
    ],
  },
})
