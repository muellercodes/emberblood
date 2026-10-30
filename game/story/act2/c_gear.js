// game/story/act2/c_gear.js
chapter({
  id: 'c_gear', act: 2, after: 'c_coast', next: 'c_salt',
  card: ['Act II · Chapter 4', ['Against the Clock', 'The City of Clocks']],   // (the game counts the heist's two chapters first)
  so_far: [
    "Old Barley saw the Moth Mask glide down to Gearhaven with something red and glowing. Later that night something much bigger flew over, and left Gerald the sheep silver with moth dust. (Gerald has been fainting ever since.) Now Ash has reached the city of clocks.",
    'Barley saw the Moth Mask fly to Gearhaven. Something bigger made Gerald silver. Ash is in the city of clocks.'],

  // New things this chapter adds to map 1. Things x1_world already draws
  // (c_upper_gate, c_lm_watch, c_whirligig_manor, c_great_clock, c_clock_hand,
  // c_clock_top) are registry entries already. "look" names come from the
  // prop library; window_clock and gear_hatch are new art, requested from the
  // engine owner.
  place: {
    gh_bird_clock:  { map: 1, at: [7840, 24940], kind: 'examine', look: 'window_clock',
                      name: 'the bird clock in the window', light: { r: 80, i: 0.55, night: true, off: ['gone'] } },
    gh_roof_prints: { map: 1, kind: 'prints', path: [[7640, 25060], [7760, 24990], [7900, 24920]],
                      show: 'item magnifier', name: 'silver prints' },
    gh_clock_works: { map: 1, at: [7040, 24880], r: 34, kind: 'examine', look: 'gear_hatch',
                      name: 'the clock works' },
  },

  // items this chapter gives (COORD: chapters may define items)
  item: {
    magnifier:    { name: ["Professor Sprocket's spare magnifying glass", 'A magnifying glass'],
                    desc: ['Moth dust shows up silver through it.', 'Dust shines in it.'], icon: 'magnifier' },
    c_bird_clock: { name: ["Lord Whirligig's bird clock", 'The bird clock'],
                    desc: ['A little clock with a little bird. It glows at night.', 'A clock with a bird. It glows.'], icon: 'bird' },
  },

  clue: {
    g_dust_gear:   { icon: 'gear',   text: ['Silver moth dust in the teeth of the stolen gear.', 'Moth dust on the gear.'] },
    g_robberies:   { icon: 'board',  text: ['Nine robberies at Whirligig Manor. Every one was something that glows.', 'She robs the Manor. She takes glowing things.'] },
    g_bird_clock:  { icon: 'bird',   text: ['Lord Whirligig has a new clock with a little bird. It glows at night.', 'The new bird clock glows.'] },
    g_roof_prints: { icon: 'prints', text: ['Silver prints go up the wall of Whirligig Manor.', 'Silver prints go up the Manor wall.'] },
    g_penny_first: { icon: 'news',   herring: true, text: ['Penny Press is first at every robbery.', 'Penny is always first.'] },
    g_dust_clock:  { icon: 'clock',  mystery: 'what_stopped',
                   text: ['The Great Clock is packed with moth dust. More than one girl could carry.', 'The clock is full of dust. Too much for one girl.'] },
  },

  deduce: {
    where_next: {
      mystery: 'moth_mask',
      ask: ['Where will the Moth Mask strike tonight?', 'Where will she rob tonight?'],
      needs: ['g_robberies', 'g_bird_clock', 'g_roof_prints'],
      pick: [
        { t: 'Whirligig Manor', right: true },
        { t: 'The Clockwatch Hall', hint: ['She robbed the Captain twice. Does anything there glow?', 'Does anything there glow?'] },
        { t: 'The Gazette office',  hint: ['Penny is first at every robbery because that is her job. Where do the prints go?', 'Where do the prints go?'] },
      ],
      then: ['set c_where_next'],
    },
  },

  step: [
    { id: 'gate',   do: 'goto c_upper_gate 300', scene: 'c_gate' },
    { id: 'hettie', do: 'talk c_hettie', scene: 'c_hettie', then: ['set c_hettie'],
      obj: ['Show the gear to Professor Sprocket in the Lower Town', 'Show the gear to Professor Sprocket'] },
    { id: 'look',   do: 'all', obj: ['Find out where the Moth Mask will strike', 'Find clues'],
      parts: [
        { do: 'examine c_lm_watch',    then: ['clue g_robberies'] },
        { do: 'examine gh_bird_clock', then: ['clue g_bird_clock'] },
        { do: 'track gh_roof_prints',  then: ['clue g_roof_prints'] },
      ],
      extra: [   // optional, any time during the chapter
        { do: 'examine gh_clock_works', then: ['clue g_dust_clock'] },
        { do: 'talk c_penny', scene: 'c_penny_first', then: ['clue g_penny_first'] },
      ] },
    { id: 'deduce', do: 'deduce where_next', obj: ['Work it out in the Case Book', 'Open the Case Book'] },
    { id: 'hester', do: 'talk c_hester', scene: 'c_hester', then: ['set c_hester'],
      obj: ['Tell Captain Ticklebrass at the Clockwatch Hall', 'Tell the Captain'] },
    { id: 'night',  do: 'wait_for night', at: 'c_whirligig_manor', skip: ['c_hester', 'c_whirligig'],
      obj: ['Wait for night by Whirligig Manor', 'Wait for night at the Manor'] },
    // (night only: if day comes first, the engine says "Wait for night at Whirligig Manor" and the skip people offer
    //  "Wait here until dark" again)
    { id: 'chase',  do: 'minigame c_roofchase', at: 'c_whirligig_manor', skip: ['c_hester', 'c_whirligig'],
      scene: 'c_chase_start', lose: 'c_chase_lost' },
    { id: 'catch',  do: 'cutscene c_chase_end', then: ['stage c_salt'] },
  ],

  scene: {
    c_gate: [
      ['narr', 'Gearhaven. Every roof has a little clock on it. It is the middle of the afternoon, and every clock says one minute to midnight.', 'It is afternoon. Every clock says one minute to midnight.'],
      ['c_bobs', "Halt! Who goes there? ...It's a lizard, Bob.", "Halt! Oh. It's a lizard, Bob."],
      ['ash', "I'm a dragon. Mostly. I'm looking for a thief in a moth mask.", "I'm a dragon. I'm looking for a thief in a moth mask."],
      ['c_bobs', "The Moth Mask! She's a legend! She's a menace! She once stole Bob's hat.", "The Moth Mask! She stole Bob's hat."],
      ['c_bobs', 'It was MY hat, Bob.'],
      ['narr', 'A girl in an enormous coat skids up, notebook first.', 'A girl in a huge coat runs up with a notebook.'],
      ['c_penny', "HEADLINE: DRAGON KID ARRIVES IN GEARHAVEN. Penny Press, Gearhaven Gazette. What's that in your claw?", "HEADLINE: DRAGON KID ARRIVES! I'm Penny Press. What's in your claw?"],
      ['c_penny', 'A gear that says Gearhaven, in Gearhaven. That narrows it down to everything. Professor Sprocket can read a gear. Down the Great Stair by the canal. Follow the colored smoke.', 'Ask Professor Sprocket. Down the big stairs. Follow the colored smoke.'],
    ],
    c_hettie: [
      ['c_hettie', "Visitor! Don't touch that, it's thinking. You're a dragon. Can I measure your... no. Later. What's in your hand?", 'Hello! A dragon! What is in your hand?'],
      ['narr', 'She snatches the gear and screws a magnifying glass into her goggles.', 'She looks at the gear with a big glass.'],
      ['c_hettie', 'Silver dust in the teeth. Moth dust! There is one person in this city who leaves it on everything she touches.', 'Moth dust! Only one person leaves that.', { clue: 'g_dust_gear' }],
      ['c_hettie', 'The Moth Mask. She robs the clock barons up in the Upper Town, and the barons are furious. Everybody else buys the Gazette to read about it.', 'The Moth Mask! She robs the rich clock barons.'],
      ['c_hettie', 'Take my spare glass. Moth dust shows up silver through it, even in daylight.', 'Take this glass. Dust shines in it.', { do: ['give magnifier'] }],
      ['c_hettie', 'Go and look where she has been. When you know where she will strike next, tell Captain Ticklebrass at the Clockwatch Hall.', 'Look where she has been. Then tell the Captain.'],
    ],
    c_penny_first: [
      ['c_penny', "You're investigating? So am I. I've been first on the scene of every robbery. All nine of them!", 'I was first at every robbery. All nine!'],
      ['ash', 'All nine? How are you always first?', 'How are you always first?'],
      ['c_penny', 'I sleep in my coat with my boots on. When somebody yells "Thief!", I run toward it. Everyone else runs away. That is the whole trick.', 'I sleep in my boots. When someone yells "Thief!", I run to it.'],
      ['narr', 'She flips her notebook open. Every page says FIRST ON THE SCENE in big letters.', 'Her notebook says FIRST ON THE SCENE. A lot.'],
    ],
    c_hester: [
      ['c_hester', 'The Press girl ran ahead to say a dragon was coming up the hill. You are forty seconds behind her. Report.', 'Penny said you were coming. Report!'],
      ['ash', "The Moth Mask will rob Whirligig Manor tonight. She only takes things that glow, and he's got a new bird clock that glows.", 'She will rob Whirligig Manor tonight. His new clock glows!'],
      ['c_hester', 'Whirligig Manor, tonight. Sound reasoning. I have stood in this hall for nine robberies and I did not see it.', 'The Manor, tonight? Good thinking.'],
      ['c_hester', 'Wait by the manor. When she runs, run after her. And mind the gaps between the roofs. Not every one of them has a bottom you would like.', 'Wait by the Manor. When she runs, chase her! Mind the gaps.'],
    ],
    c_chase_start: [
      ['narr', 'Night. The brass lamps flicker on. Up on the roof of Whirligig Manor, a shadow moves between the chimneys.', 'Night. The lamps come on. A shadow moves on the roof of Whirligig Manor.'],
      ['c_whirligig', "(from a window) THIEF! Not AGAIN! That's my good clock! The one with the little bird!", "THIEF! Not AGAIN! That's my good clock!"],
      ['narr', 'The shadow stands up straight: a girl in a grey cloak patterned like moth wings, with a silver mask and a sack over one shoulder.', 'A girl in a moth-wing cloak and a silver mask. She has a sack.'],
      ['c_mask', 'The little ember walked all the way down the pass, just for me? Cute. Go home.', 'You walked all this way? Cute. Go home.'],
      ['ash', "Give back my mom's Heart!", "Give back Mom's Heart!"],
      ['c_mask', 'Catch me first.'],
    ],
    c_chase_lost: [
      ['narr', 'She is gone over the chimneys. Down in the street, a Bob shouts, "Left! No, the other left!"', 'She got away over the roofs.'],
      ['c_mask', '(far off) Round two, little ember? Try to keep up this time.', 'Round two? Keep up this time.'],
      ['ash', 'She always comes back to Whirligig Manor. Next time I keep up.', 'She will come back to the Manor. I will be ready.'],
    ],
    c_chase_end: [
      { cam: 'c_great_clock', s: 1.5 },
      ['narr', 'The roofs end. Across the gap, the Great Clock is stuck at one minute to midnight.', 'The roofs end at the Great Clock.'],
      { place: ['c_mask', 'c_clock_hand'] },
      ['narr', 'She leaps, catches the minute hand, and slips. She hangs right in front of you.', 'She jumps to the clock hand. She slips!'],
      { choose: 'c_chase', who: 'narr', ask: ['Her sack swings an arm\'s length away. So does her hand.', 'Her sack is close. So is her hand.'], pick: [
        { t: ['Grab her wrist and pull her up', 'Pull her up'], tone: 'kind',
          then: ['set c_chase=helped', 'trust vesper +1'],
          say: [['c_mask', '...Why did you do that?'], ['ash', 'You were going to fall.'], ['c_mask', "I don't fall. I drop on purpose. Sometimes.", "I don't fall. I drop on purpose."]] },
        { t: ["She's got a good grip. Grab the sack!", 'Grab the sack!'], tone: 'brave',
          then: ['set c_chase=sack', 'give c_bird_clock'],
          say: [['narr', "You lunge for the sack. She swings up onto the hand like she was never in danger, and the sack rips open. Out falls Lord Whirligig's bird clock.", 'The sack rips. Out falls the bird clock. Not the Heart.'],
            ['c_mask', 'Wrong sack, little ember.']] },
      ] },
      { anim: ['c_mask', 'climb'], walk: ['c_mask', 'c_clock_top'] },
      ['ash', "Hey! You can't just climb up a clock!"],
      ['narr', 'A note flutters down: "Go home. This isn\'t your story. M."', 'A note: "Go home. M."'],
    ],
  },

  talk: {
    c_whirligig: [
      // (first: entries are checked top to bottom, so the one-time thank-you goes before the everyday lines)
      { if: 'flag c_chase=sack item c_bird_clock', once: true,
        say: ['Hmph. My bird clock. Thank you. Wipe your feet.', 'My bird clock! Thanks. Wipe your feet.'],
        then: ['take c_bird_clock', 'give coins 30', 'set c_birdclock_back'] },
      // (his everyday lines, with replies, are in act2/people.js: lines here would come first and answer for them)
    ],
  },
})
