// Act III, the second half of Chapter 3 (One Thaw at a Time): the Windscour and the Sky Isles (owner A3b). Data only.
// What the player does: Ylva said the Wind Monks of Skyreach went up Mount Dread every spring. Ash takes the Wind Road
// (the road keeps its name; the vent ribbon by the Dreadgate is "the Drum Wind" now, audit finding 6) east and up onto
// the Windscour. From its east rim he sees the Sky Isles floating in the air, and feels the updraft at his feet (the
// world tells him how, not the objective). On the temple isle Brother Pennant, the last Wind Monk, tells him what the
// old monks did every spring: rode the wind up to the mountain's shoulder and KNOCKED, like the Stonehorns (clue
// f3_climbers, for how_open later). Then the temple (code dungeon): Wind Riding, Old Frostfeather.
// Fixes: "the moths came" (Hush is white; the purple ones are mothlings); Frostfeather no longer tucks Pennant under
// her wing (he is outside on his kite, finding 11); Ember's last line is a pointer, not the answer.
chapter({
  id: 'f_sky', act: 3, after: 'f_thaw', next: 'f_gap', takeover: true,
  card: null, name: ['One Thaw at a Time', 'One Thaw at a Time'],
  so_far: [
    'Something huge sleeps on top of Mount Dread, breathing out the Long Winter: Glaciar, the ice dragon, and she is Ash\'s AUNTIE. Ylva says the Wind Monks of Skyreach used to go up the mountain every spring, so Ash heads east to find them.',
    'A dragon sleeps on Mount Dread. She is Ash\'s auntie! Ash goes east to find the Wind Monks.'],
  mom: [['An AUNT? A dragon aunt? I\'m going to need a minute.', 'A dragon aunt? I need a minute.']],

  place: {
    // the east rim of the Windscour, where x2_world's rim updraft (lift 2) rises and the rim sign points at the isles
    f3_east_rim: { map: 2, at: [10950, 46700], r: 260, kind: 'spot', name: 'the east rim of the Windscour' },
  },

  clue: {
    f3_climbers: { icon: 'star', mystery: 'long_winter',
      text: ['Every spring the old Wind Monks rode the wind up to the mountain\'s shoulder, and KNOCKED, the way the Stonehorns knock.', 'The monks rode the wind up the mountain and knocked.'] },
  },

  step: [
    { id: 'rim', do: 'goto f3_east_rim 260', scene: 'f3_rim_isles', migrate_if: 'flag trial_f_sky_done',
      obj: ['Take the Wind Road east and find a way to the Sky Isles', 'Find a way to the Sky Isles'],
      hint: ['The Wind Road climbs east from Hearthold, up onto the Windscour. The Sky Isles float past its east rim.', 'Take the Wind Road east, up to the rim.'] },
    { id: 'pennant', do: 'talk f_pennant', scene: 'f3_pennant_meet', migrate_if: 'flag trial_f_sky_done',
      obj: ['Get up to the Sky Isles and find the Wind Monks', 'Fly up to the Sky Isles'],
      hint: ['Stand in the warm updraft on the east rim. It lifts you high, and your wings do the rest.', 'Ride the updraft. Then fly!'] },
    // the temple stays code (x2_dun_a); its own scenes below are the old STORY keys, replaced in place
    { id: 'temple', do: 'dungeon f_sky', at: 'f_sky_door', then: ['stage f_gap'],
      obj: ['Climb Skyreach Temple and find Ember\'s flame', 'Climb Skyreach Temple'],
      hint: ['Old Frostfeather nests at the very top. Ember hid her flame high up, for someone brave about heights.', 'Climb to the top of the temple.'] },
  ],

  scene: {
    f3_rim_isles: [
      { cam: 'f_skyreach', s: 1.5 },
      ['narr', 'Past the east rim, little islands of rock and snow float out over nothing, tied together with rope bridges. Wind chimes ring on every one.', 'Little islands float in the sky, tied with rope bridges.'],
      ['tove', 'Floating. In the sky. I\'m cold just looking at them.', 'Floating isles! I\'m cold just looking.'],
      ['ash', 'How did the monks even get up there?', 'How did the monks get up there?'],
      ['narr', 'Warm air rushes up the cliff past your feet, so hard it ruffles your wings. An updraft.', 'Warm air rushes up past your feet. An updraft!'],
    ],
    f3_pennant_meet: [
      ['f_pennant', 'Wheeee... oh! Hello! Sorry. I\'m Brother Pennant. Last of the Wind Monks of Skyreach. Also the first. Also the middle. It\'s just me.', 'Wheee! Hello! I\'m Brother Pennant. The last Wind Monk.'],
      ['f_pennant', 'The others blew away. On purpose! They ride the winds of the far south now. They send postcards. The postcards blow away.', 'The others blew away. Their postcards blow away too.'],
      ['ash', 'Grandmother Ylva says the monks used to go up Mount Dread.', 'Ylva says the monks went up Mount Dread.'],
      ['f_pennant', 'Every spring! We rode the wind up to the mountain\'s shoulder, and we KNOCKED. The way the Stonehorns knock. BONK.', 'Every spring we rode the wind up there and KNOCKED. BONK.', { clue: 'f3_climbers' }],
      ['ash', 'Knocked? On a MOUNTAIN? With what?', 'Knocked on a MOUNTAIN?'],
      ['f_pennant', 'Oh, I never asked. I held the kites. Then the moths came, and Old Frostfeather went funny.', 'I just held the kites. Then the moths came.'],
      ['f_pennant', 'Our temple owl. Big as a house, gentle as a pillow. She ate a moth and now she\'s all... pecky. She\'s at the very top.', 'Our big owl ate a moth. Now she pecks. She\'s at the top.'],
      ['f_pennant', 'Ember learned to ride the wind here, long ago. They say she left a flame inside. And the Stonehorns? They live past the Howling Gap.', 'Ember left a flame inside. The Stonehorns live past the Howling Gap.'],
      ['ash', 'Will you come in with me?', 'Will you come in with me?'],
      ['f_pennant', 'Oh, it would be lovely! But I\'m a kite person now. Wheee. Good luck!', 'I\'m a kite person now. Wheee! Good luck!'],
    ],

    // ---- Skyreach Temple's own story keys (x2_dun_a plays them; each replaces the old STORY[key] in place)
    f_sky_in: [
      ['tove', 'A temple in the sky. Full of wind. Full of cold wind. Of course it is.', 'A temple in the sky. Full of cold wind.'],
    ],
    f_sky_hats: [
      ['tove', 'Hats! Hundreds of hats! There\'s MY hat! I lost that in the year 312!', 'Hats! Hundreds of hats! There\'s MY hat!'],
    ],
    f_sky_lesson: [
      ['f_pennant', '(from outside, on his kite) Wheee! Good! Steer with your feet!', '(from outside) Wheee! Steer with your feet!'],
    ],
    f_sky_mural: [
      ['narr', 'A mural on the wall: three birds in a row. A small one. A big one. A medium one. Under them, three bells.', 'A picture: a small bird, a big bird, a medium bird. Three bells.'],
    ],
    f_sky_shrine: [
      ['ember', 'You found my flame! I hid this one up high, so only someone who wasn\'t afraid of heights would find it.', 'You found my flame! I hid it up high.'],
      ['ash', 'I\'m a little afraid of heights.', 'I\'m a little afraid of heights.'],
      ['ember', 'So was I. That\'s why it counts.', 'So was I. That\'s why it counts.'],
    ],
    f_sky_gift: [
      ['narr', 'The flame turns into a ribbon of warm wind. It wraps around you once, twice, and tucks itself in under your scales.', 'The flame turns into warm wind. It wraps around you.'],
      ['ember', 'Wind Riding! Jump into a wind ribbon and it carries you, like a leaf on a river. Steer with your feet. Jump to hop off. Updrafts lift you right up.', 'Wind Riding! Jump into a wind ribbon. Jump again to hop off.'],
      ['ash', 'I\'m a LEAF.', 'I\'m a LEAF.'],
      ['ember', 'The bravest leaf.', 'The bravest leaf.'],
    ],
    f_squall_intro: [
      ['f_squall', 'Whoosh! Visitors!', 'Whoosh! Visitors!'],
      ['f_squeak', 'Wheeee-hee! Can we keep him?', 'Wheeee-hee! Can we keep him?'],
      ['f_squall', 'Tag, you\'re IT!', 'Tag, you\'re IT!'],
    ],
    f_squall_won: [
      ['f_squeak', 'No fair! You\'re too good at tag!', 'No fair! You\'re too good at tag!'],
      ['f_squall', 'Fine. FINE. The key\'s in the chest. Whoosh.', 'Fine. The key is in the chest. Whoosh.'],
    ],
    f_frostfeather_intro: [
      ['narr', 'At the top of the tower, on a nest as wide as a pond, sits an owl as big as a house. Violet dust glitters in her eyes. The little tuft on her head sticks straight up.', 'An owl as big as a house sits at the top. Purple dust glitters in her eyes.'],
      ['f_frostfeather', 'HOO! HOOOOO!', 'HOO! HOOOOO!'],
      ['f_pennant', '(from outside, on his kite) Be gentle with her! She\'s just poorly!', '(from outside) Be gentle! She\'s just poorly!'],
    ],
    // right after the boss: 4 lines (the tuck under the wing is gone: Pennant is outside, finding 11)
    f_sky_won: [
      ['narr', 'Glittery purple dust pours out of Old Frostfeather\'s feathers. She sneezes. A cloud of little moths shoots out of her beak and flutters away, looking embarrassed.', 'Purple dust falls off her. She sneezes out a cloud of little moths.'],
      ['f_frostfeather', 'Hoo? Hoooo.', 'Hoo? Hoooo.'],
      ['narr', 'Her eyes are gold now, round and kind. She tilts her head all the way upside down and looks at you.', 'Her eyes are gold and kind now. She tilts her head upside down.'],
      ['f_pennant', '(from outside, on his kite) She\'s back! Her eyes are gold again! Old girl! OLD GIRL!', '(from outside) She\'s back! Her eyes are gold!'],
    ],
    f_sky_end: [
      ['ember', 'Two of my flames in one winter. My auntie would be proud of you. I am.', 'Two of my flames in one winter. I\'m proud of you.'],
      ['ember', 'The Howling Gap is no match for you now. The Stonehorns live on the other side. Speak up. They\'re a bit deaf.', 'Now you can cross the Howling Gap. The Stonehorns are a bit deaf.'],
      ['narr', 'Step into the warp ring to go back outside.', 'Step into the warp ring to go outside.'],
    ],
  },
})
