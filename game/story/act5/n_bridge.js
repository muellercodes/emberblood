// game/story/act5/n_bridge.js (N5a): the Finale, "The Moonfire Bridge". Takes over x4_story's stage n_bridge.
// What the player does: says goodbye on the Moon Pier (Mom packs a sandwich and her paper lantern), crosses the
// moonfire bridge, and finds a copy of the lantern green from home at the foot of Nightfall Peak. It has a FOURTH post
// that never had a lantern, with a tiny moth carved on top: the first clue of "who is the little grey moth" (n_stair /
// n_clocks) and of the small mystery "why a fourth post?" (solved later with the Silent Green well and Mom's memory;
// then Ash lights it for good: a Heart Ember). Three lanterns lit at once melt the shadow curtain (x4_ascent's puzzle,
// flag n_gate; x4_ascent plays the gate scene), and the stairs lead up to the first ring.
// The arrival counts the friends Nyxara hurt that Ash already freed in earlier acts (trust track `friends`, silently) and
// gives the bonus clues a kid earned before (the Wardens' page 11, the Act IV moth dream: that Ember named a moth).
// Data only. The x4_story code that still runs: the gate scene and Greymane's arrival (x4_ascent plays n_gate_open; the
// ally runtime brings Greymane on n_gate), the lantern bubble, the bridge travel itself.
chapter({
  id: 'n_bridge', act: 5, after: 'm_reforge', next: 'n_stair', takeover: true,
  card: ['Finale', 'The Moonfire Bridge'],
  so_far: [
    'Nyxara ate the last of the moon, and Nightfall Peak rose out of the Ink Sea. Ash crossed a bridge of moonfire with the Ember Heart, whole again, warm in the satchel. At the foot of the peak waits a copy of the lantern green from home. With one post too many.',
    'Nyxara ate the moon. A black mountain rose. Ash crossed the fire bridge with the Ember Heart.'],
  mom: [["A bridge made of fire. I'll hold your hand as far as the end of the pier, and then you come back to me.", 'I will walk you to the bridge. Come back safe.']],

  item: {
    // x4_story's own item (ITEM_NAMES n_map): x4_world shows the peak on the map while it is held
    n_map: { name: ["Juniper's Peak Map", "Juniper's map of the peak"],
      desc: ["Juniper drew Nightfall Peak through the telescope: four rings, one on top of the other. Across the top, in her neatest letters, she has written DON'T.", "Four rings, going up. At the top it says DON'T."], icon: 'map' },
    n5_lantern: { name: ["Mom's paper lantern", "Mom's paper lantern"],
      desc: ["A Lantern Day lantern Mom folded into your satchel with the sandwich. It's a little squashed. It's been through a lot.",
        'A paper lantern from Mom. A bit squashed.'], icon: 'lamp' },
  },

  place: {
    // the north end of the moonfire deck (the arrival) and the copied lantern green
    n5_deck_end: { map: 4, at: [4500, 90330], r: 150, kind: 'spot', name: ['the end of the moonfire bridge', 'the end of the bridge'] },
    n5_green_spot: { map: 4, at: [4500, 89700], r: 260, kind: 'spot', name: ['the lantern green', 'the lantern green'] },
    // the fourth post, at the east edge of the green (art: v10_art5a.js n5a_post, lit: n5a_post_lit)
    n5_fourth_post: { map: 4, at: [4740, 89700], r: 26, kind: 'examine', look: 'n5a_post', states: { lit: 'n5a_post_lit' },
      name: ['the fourth lantern post', 'the fourth post'], aliases: ['a fourth post', 'the fourth post'], say: 'nbr_post',
      light: { r: 120, i: 0.75, state: 'lit', fire: true, dy: 54 } },
  },

  clue: {
    n5_fourth_post: { icon: 'moth', mystery: 'night_mother',
      text: ['The copied green has a fourth post that never had a lantern. A tiny moth with two pale moons is carved on top.',
        'A fourth post. No lantern. A tiny moth carved on top.'] },
    // the small mystery: why a fourth post?
    n5_dark_lamps: { icon: 'lamp', mystery: 'n5_fourth_lantern', herring: true,
      text: ['Every lamp post on the whole peak is dark. Maybe the fourth post is just broken too.', 'Every lamp is dark. Maybe it is just broken.'] },
    n5_one_more: { icon: 'fire', mystery: 'n5_fourth_lantern',
      text: ['An old village saying: "Light one more than you need."', '"Light one more than you need."'] },
    // given by N5S's people.js (Mom on the Moon Pier, Yara on the green at home: FINALE_V10 B4, B5)
    n5_mom_lanterns: { icon: 'lamp', mystery: 'n5_fourth_lantern',
      text: ['Mom: "My gran always made four lanterns. One for whoever is out in the dark."', '"Four lanterns. One for whoever is out in the dark."'] },
    n5_yara_post: { icon: 'star', mystery: 'n5_fourth_lantern',
      text: ['Yara: "There were four posts on the green when I was a girl. Nobody remembered why."', '"There were four posts once."'] },
    // bonus clues for "What did Ember call the little moth?" (n_clocks), earned in earlier acts. (v12 R4) They say that
    // Ember gave the moth a name, never the name: "Nyx" is first seen on ring 2 (the clock hub, n_clocks)
    n5_page11: { icon: 'book', mystery: 'night_mother',
      text: ["The Wardens' eleventh page: a little grey moth sat on Ember's lantern, and Ember gave her a name.", 'Ember gave a little grey moth a name.'] },
    n5_moth_dream: { icon: 'moth', mystery: 'night_mother',
      text: ['The moth dream in Moonfall: Ember gave the little moth a name, and the wind took it.', 'A dream: Ember named a moth.'] },
  },

  deduce: {
    n5_fourth_lantern: {
      mystery: 'n5_fourth_lantern',
      ask: ['Why does the copied green have a fourth post with no lantern?', 'Why is there a fourth post?'],
      needs: ['n5_fourth_post', 'n5_one_more', 'n5_mom_lanterns'],
      bonus: ['n5_yara_post'],
      pick: [
        { t: ['Ember lit one more lantern than she needed, for a cold little moth', 'Ember lit an extra one, for a cold little moth'], right: true },
        { t: ["It's just broken", "It's just broken"],
          hint: ['Every other lamp here lights when you breathe on it. This post never had a lantern at all.', 'This post never had a lantern at all.'] },
        { t: ["It's for Grandpa", "It's for Grandpa"],
          hint: ['Look at the carving on top again. Is it a dragon?', 'Is the carving a dragon?'] },
      ],
      then: [{ banner: ['Light one more than you need.', 'Light one more!'],
        sub: ['Go and light the fourth post at the Bridgefoot.', 'Light the fourth post!'] }],
    },
  },

  step: [
    // the goodbye on the Moon Pier, at the foot of the bridge (setting n_depart first keeps x4_story's old departure
    // from playing when Ash takes the bridge); a kid who takes the bridge some other way still gets the lantern
    { id: 'depart', do: 'any', marker: 'n5_pier_end',
      obj: ['Cross the moonfire bridge at the end of the Moon Pier', 'Cross the fire bridge'],
      hint: ['The moonfire bridge starts at the very end of the Moon Pier in Moonfall. Everyone came to see you off.', 'Walk to the end of the Moon Pier.'],
      parts: [
        { do: 'goto n5_pier_end 130', scene: 'n_depart' },
        { do: 'wait_for flag n_depart' },
      ],
      then: ['set n_depart', 'give n_map', 'give n5_lantern'] },
    // the arrival on the deck: the friends already freed are counted here, and the bonus name clues are given
    { id: 'arrive', do: 'goto n5_deck_end', scene: 'n_arrive',
      obj: ['Walk off the bridge onto Nightfall Peak', 'Walk onto the peak'] },
    { id: 'green', do: 'goto n5_green_spot', scene: 'n_green', obj: ['Go to the lantern green', 'Go to the green'] },
    { id: 'post', do: 'examine n5_fourth_post', then: ['clue n5_fourth_post'], obj: ['Look at the fourth post', 'Look at the fourth post'],
      hint: ['The fourth post stands at the edge of the green, away from the three lanterns.', 'It is at the edge of the green.'] },
    { id: 'lanterns', do: 'wait_for flag n_gate', marker: 'n5_lantern_green',
      obj: ['Light the three lanterns, all at the same time', 'Light the three lanterns'],
      hint: ['Breathe gently on each lantern. One is on a little islet, one is up on a step. They go out again, so be quick.',
        'Breathe on all three lanterns, fast.'] },
    { id: 'up', do: 'goto n5_stairs_top', obj: ['Climb the stairs to the first ring', 'Climb the stairs'],
      then: ['stage n_stair'] },
  ],

  scene: {
    // 5.0 the departure on the Moon Pier (10 lines on the longest branch: Dell, Mom, Pip)
    n_depart: [
      { cam: 'n5_pier_end', s: 1.2 },
      ['narr', 'Everyone has come out to the end of the pier to see you off. The moonfire bridge waits, silver flame on and on into the dark.', 'Everyone came to see you off. The fire bridge waits.'],
      ['quill', 'I measured the moon tonight. There is none left to measure. I have never been so upset about a number.', 'I tried to measure the moon. There is none left!'],
      ['juniper', "Here. I drew the peak through the Professor's telescope. Four rings, one on top of the other, all the way up.", 'I drew the mountain for you. Four rings, going up.'],
      ['ash', "Four rings. One for each place I've been.", 'Four rings. One for each place I went.'],
      ['dell', "I'll keep the Soggy Biscuit Three tied up right here with the engine warm, for when you come back down.", 'I will wait here with the boat.', { if: '!flag m_ship=glaciar' }],
      { if: { any: ['flag m_maren', 'flag m_reforged'] }, then: [
        ['narr', 'Mom hugs you so hard your horns creak.', 'Mom gives you a big, big hug.'],
        ['maren', 'I made the Heart whole again. You bring it home again. Deal?', 'I fixed the Heart. You bring it home. Deal?'],
        ['ash', 'Deal.'],
        ['maren', "I put a sandwich in your satchel, and my paper lantern from home. They're a bit squashed. They've been through a lot, like you.",
          'A sandwich and my paper lantern are in your bag. They are a bit squashed, like you.', { promise: 'n5_lantern' }],
      ], else: [
        ['narr', 'Flap, flap. Pebble lands on your horn with a folded note and a squashed paper lantern, and takes a coin for them.', 'Pebble brings a note and a paper lantern.', { do: ['take coins 1'] }],
        ['maren', '(the note) I made the Heart whole again. You bring it home again. Deal?', '(the note) I fixed the Heart. You bring it home. Deal?'],
        ['ash', 'Deal.'],
        ['maren', "(the note) That's my paper lantern from home. It's a bit squashed. It's been through a lot, like you. Eat something. Love, Mom.",
          '(the note) That is my paper lantern from home. Eat something. Love, Mom.', { promise: 'n5_lantern' }],
      ] },
      ['narr', 'Pip climbs onto your shoulder. Pip is far too big for your shoulder now. Pip does not care.', 'Pip climbs on your shoulder. He is too big now. He does not care.', { if: 'flag pip' }],
    ],
    // 5.0 the arrival, at the north end of the deck
    n_arrive: [
      // (silent) the friends Nyxara hurt that Ash already freed count now, and the name clues earned in earlier acts
      { if: 'choice c_vesper=friend', then: [{ do: ['trust friends +1', 'set n5_vesper'] }] },
      { if: 'choice f_glaciar=free', then: [{ do: ['trust friends +1', 'set n5_glaciar'] }] },
      { if: 'choice m_hush=free', then: [{ do: ['trust friends +1', 'set n5_hush'] }] },
      { if: { any: ['flag f_page11', 'flag m_page11'] }, then: [{ do: ['clue n5_page11'] }] },
      { if: 'flag dr_seen_m_moth', then: [{ do: ['clue n5_moth_dream'] }] },
      ['narr', 'Behind you, the bridge flickers. Ahead, a mountain of black glass rises out of a sea of ink.', 'A black glass mountain rises out of a black sea.'],
      ['narr', 'Nothing moves. There are no birds and no wind, only a broken moon over the peak, like a cracked plate.', 'Nothing moves. The broken moon hangs over the top.'],
      ['ash', 'Hello? ...Anybody? No? Okay.', 'Hello? Anybody? No? Okay.'],
      ['nyxara', 'Come up, little ember. Bring your heart.', 'Come up, little ember. Bring your heart.'],
      ['ash', 'She talks like Grandpa did on the mountain. Same words. I wish she would stop.', 'She talks like Grandpa did. I wish she would stop.'],
      ['pip', 'Mip!'],
    ],
    // the copied green: three dark lanterns and one post too many
    n_green: [
      { cam: 'n5_green_spot', s: 1 },
      ['narr', 'At the foot of the peak is a little green with lantern posts, all made of black glass, all dark.', 'A little green with dark lanterns.'],
      ['ash', "That's our green from home. She built it out of the moon's memories, and the moon watched me light those lanterns every year.", 'That is our green from home! The moon remembered it.'],
      ['narr', 'Three lanterns on three posts. And at the edge of the green, a fourth post with no lantern at all.', 'Three lanterns. And a fourth post with no lantern.', { ref: 'n5_fourth_post' }],
      ['ash', 'Every lamp on this whole mountain is dark. Maybe the fourth one is just broken.', 'Every lamp here is dark. Maybe it is broken.', { clue: 'n5_dark_lamps' }],
      ['ash', 'A gentle breath on each one, Ash. Like on the green at home.', 'Breathe gently on each one.'],
    ],
    // looking at the fourth post: the first time a clue, once the small mystery is solved the lighting, then the flame
    nbr_post: [
      { if: 'world n5_fourth_post=lit', then: [
        ['narr', 'The little flame in the fourth post is still burning. It should have gone out ages ago, and it hasn\'t.', 'The little flame is still burning.'],
      ] },
      { if: '!world n5_fourth_post=lit solved n5_fourth_lantern', then: [
        ['ash', 'One more than you need. For whoever is out in the dark.', 'One more. For whoever is out in the dark.'],
        ['narr', 'You breathe the smallest flame you can. It settles in the empty hook and stays there, like it was waiting.', 'A tiny flame settles in the hook. It stays.',
          { do: ['world n5_fourth_post lit', 'heart_ember n5_post'] }],
        ['pip', 'Mip!'],
        ['narr', 'Far up the mountain, something very big goes very still.', 'Far up the mountain, something goes very still.'],
      ] },
      { if: '!solved n5_fourth_lantern', then: [
        ['narr', 'A fourth lantern post, black glass like the others. It has an empty hook. No lantern ever hung on it.', 'A fourth post. Its hook is empty.'],
        ['narr', 'On top, someone carved a tiny moth with two pale moons on its wings.', 'A tiny moth is carved on top.', { clue: 'n5_fourth_post' }],
        ['ash', 'Our green at home only has three posts. ...Doesn\'t it?', 'Our green has three posts. ...Right?'],
        ['ash', 'Iska always says to light one more than you need. One more for who, though?', 'Iska says: light one more than you need.', { if: 'choice ending=warden', clue: 'n5_one_more' }],
        ['ash', "Mom knows everything about Lantern Day, and she's right back over the bridge. I'll ask her.", 'Mom knows all about Lantern Day. I will ask her.', { promise: 'n5_mom_lanterns', ref: 'n5_bridge_back' }],
      ] },
    ],
    // the gate opens (x4_ascent plays STORY.n_gate_open when the third lantern catches; this is its data version)
    n_gate_open: [
      ['narr', 'The third lantern catches. For one moment the whole green glows warm, like home on Lantern Day.', 'The lanterns glow. It feels like home for a moment.'],
      ['narr', "Then the shadow curtain melts away, and a whisper comes down the mountain, soft as a moth's wing.", 'The dark curtain melts. A whisper comes down.'],
      ['nyxara', 'Shhh. Such pretty lanterns. Light as many as you like, little ember. Up here, they all go out.', 'Pretty lanterns. Up here, they all go out.'],
      ['ash', 'Not if I keep lighting them.', 'Not if I keep lighting them.'],
      { if: 'choice greymane=ally', then: [
        ['narr', 'A howl rolls up out of the dark. Long, and loud, and very, very familiar.', 'A howl! You know that howl.'],
        ['narr', 'Greymane bounds out of the ink, shakes himself off, and soaks you completely.', 'Greymane jumps out of the sea and soaks you.'],
        ['ash', 'Greymane! How did you even get here?', 'Greymane! How did you get here?'],
        ['narr', 'Greymane looks at the sea, then at you, and pants. He is not going to tell you.', 'Greymane looks at the sea. He will not say.'],
        ['ash', "You swam? All that way across the Ink Sea? Come here, you big wet wolf.", 'You swam? Come here, you big wet wolf!'],
      ] },
      { if: 'choice greymane=home', then: [
        ['narr', 'Far, far away, across the dark water, a wolf howls. Not close enough to help. Close enough to hear.', 'Far away, a wolf howls. You are not alone.'],
      ] },
    ],
  },
})
