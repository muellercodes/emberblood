// game/story/act4/m_sable.js (A4a): Act IV, Chapter 3, "The Glass Desert": the Oasis of Sable.
// What the player does: follows the Caravan Road east to Sable and finds Caravan-master Rafi in the Big Tent. The sun
// went out TODAY (not yesterday: eclipse 1 was just now), and Rafi is sure she'll eat the sun next (red herring
// m4_rafi_sun for A4b's where_next). He says nobody can climb the Glasswall or fly over it: "Go and look at it, if you
// don't believe me." The player goes and reads the sign at its foot ("Worms go under it."), then asks Saffron the
// Well-Warden where worms come from: the Burrows, north of Sable, where the old king worm is sick. Saffron stands
// outdoors by the well, so her line no longer comes "from the well" into Rafi's tent (audit finding 3).
chapter({
  id: 'm_sable', act: 4, after: 'm_reef', next: 'm_burrows', takeover: true,
  card: null, name: ['Glass Half Full', 'The Glass Desert'],
  so_far: [
    'During an eclipse, Nyxara came herself: the great grey moth, with two pale moons on her wings. She took a huge bite of the moon. She could have squashed Ash flat, but she asked for the Shards instead.',
    'Nyxara came, the great grey moth. She bit the moon. She asked for the Shards.'],
  hint: ["Follow the caravan road east, Ash. The oasis is where the palm trees are.",
    "Follow the road east, Ash. Look for palm trees."],
  mom: [['The sun went out? In the DAY? Wear something warm. And bright.', 'The sun went out? Wear something bright!']],

  place: {
    m4_sable: { map: 3, at: [9700, 67450], r: 650, kind: 'spot', name: ['the Oasis of Sable', 'Sable'] },
  },

  clue: {
    m4_rafi_sun: { icon: 'question', herring: true, mystery: 'm4_night_mother',
      text: ['Rafi is sure of it: "First the moon, now the sun. She\'ll eat the sun next, mark my words!"', 'Rafi thinks she will eat the sun next.'] },
  },

  step: [
    // (then: the eclipse clues again, for an old save made after eclipse 1 by the old code; a no-op for everyone else)
    { id: 'road', do: 'goto m4_sable', then: ['set m_sable_seen', 'clue m4_milk_smell', 'clue m4_she_asks'],
      obj: ['Follow the Caravan Road east to the Oasis of Sable', 'Follow the road to the Oasis of Sable'] },
    { id: 'rafi', do: 'talk m_rafi', scene: 'sbl_rafi', then: ['set m_rafi', 'xp 600'],
      obj: ['Find Caravan-master Rafi in the Big Tent', 'Find Rafi in the Big Tent'],
      hint: ['The Big Tent is on the west side of the oasis, near where the road comes in. Rafi is the one with the very big beard.', 'The Big Tent is on the west side. Rafi has a big beard.'] },
    { id: 'wall', do: 'examine m4_gap_sign', scene: 'sbl_wall',
      obj: ['Go and look at the Glasswall, east of Sable', 'Go look at the Glasswall'],
      hint: ['The Glasswall is east of the oasis, past the last tents. There is a sign at its foot.', 'Go east of Sable. Read the sign at the wall.'] },
    { id: 'saffron', do: 'talk m_saffron', scene: 'sbl_saffron', then: ['stage m_burrows'],
      obj: ['Ask Saffron the Well-Warden where to find a worm', 'Ask Saffron where the worms are'],
      hint: ['Saffron guards the Moon Well in the middle of the oasis. She does not like people looking at it.', 'Saffron is by the Moon Well.'] },
  ],

  scene: {
    sbl_rafi: [
      ['m_rafi', 'Ho! A dragon! Out of the sea! Now I have seen everything. Except snow. I have never seen snow.', 'Ho! A dragon, out of the sea! I have seen everything. Except snow.'],
      ['ash', "I've seen so much snow."],
      ['m_rafi', 'Then you are a lucky dragon! I am Rafi Sandstride, master of the Great Caravan. For three hundred years we have crossed the Glass Desert by the light of the moon.',
        'Lucky dragon! I am Rafi, master of the Great Caravan. We cross the desert by moonlight.'],
      ['m_rafi', 'And today the sun went out! In the middle of the day! My striders are still hiding behind their own tails.',
        'And today the sun went out! In the day! My striders are still hiding.'],
      ['m_rafi', "First the moon, now the sun. Mark my words, dragon: she'll eat the SUN next!", "First the moon, now the sun. She'll eat the SUN next!", { clue: 'm4_rafi_sun' }],
      ['ash', 'I have to get to the Eclipse Observatory.', 'I have to get to the Observatory.'],
      ['m_rafi', 'The Observatory? Beyond the Mirror Flats, up on the Heights. But when the moon got sick, the Glasswall grew up around the Flats. Spikes of glass taller than towers.',
        'Past the Mirror Flats. But a wall of glass spikes grew round them. Taller than towers.', { ref: 'm4_gap_sign' }],
      ['m_rafi', "Nobody can climb it. Nobody can fly over it. Go and look at it, if you don't believe me. Bring a hat. Bring a bigger hat.",
        "Nobody can climb it or fly over it. Go and look! Bring a big hat.", { promise: 'm4_gap_sign' }],
    ],
    // after the sign's own words ("THE GLASSWALL. Nobody can climb it. Nobody can fly over it. (Worms go under it.)")
    sbl_wall: [
      ['narr', 'Spikes of glass, taller than towers, as far as you can see. The sun bounces off them in a hundred little rainbows.',
        'Glass spikes taller than towers. A hundred little rainbows.', { ref: 'm4_gap_sign' }],
      ['ash', 'Worms go under it. Where do you even get a worm?', 'Worms go under it. Where do I get a worm?'],
      // the deal at eclipse 1, remembered
      { if: 'choice m_deal=ask', then: [
        ['ash', "She said the moon leaves her every morning. ...I keep thinking about that. I wish I didn't.", 'The moon leaves her every morning, she said. I keep thinking about it.']],
        else: [
        ['ash', 'Not for a hundred valleys. And not for one big pointy wall, either.', 'Not for a hundred valleys. Not for one pointy wall!']] },
    ],
    sbl_saffron: [
      ['m_saffron', "Don't touch the well. Don't breathe on the well. And don't look at the well like that.", "Don't touch the well. Don't even look at it like that."],
      ['ash', 'I need a worm. A big one. One that goes under walls.', 'I need a big worm. One that goes under walls.'],
      ['m_saffron', 'Then you want the Burrows. North of here, up the old road, at the Worm Mouth. Bring water.',
        'Go to the Burrows. North, up the old road, at the Worm Mouth.', { dir: ['m_saffron', 'm4_worm_mouth', 'north'] }],
      ['m_saffron', "But something down there has gone wrong. The old king worm is eating glass. Worms don't eat glass. He's sick.",
        "But the old king worm is eating glass. He's sick."],
      ['iska', 'Ember left a flame with the worms too, I think. She left one everywhere that was kind to her. Even the places that ate her a little.',
        'Ember left a flame with the worms, I think. Even ones that ate her a little.'],
      ['m_saffron', "Help him, dragon. He's a grumpy old thing. But he's our grumpy old thing.", "Help him, dragon. He's our grumpy old worm."],
    ],
  },
})
