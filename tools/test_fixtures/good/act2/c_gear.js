// The c_gear chapter from _plan_format.md, as written there, with what the sample leaves out filled in so it
// passes on its own: the four scenes it says have "the same shape" (c_gate, c_penny_first, c_chase_start,
// c_chase_lost) and an item block for the magnifier and the bird clock. One typo fixed: the g_robberies clue text
// said "Nine g_robberies" (an id inside a line); it says "Nine robberies" here.
chapter({
  id: 'c_gear', act: 2, after: 'c_coast', next: 'c_salt',
  card: ['Act II · Chapter 2', 'The City of Clocks'],
  so_far: [
    "Gearhaven's Great Clock stopped at one minute to midnight, full of moth dust. Ash worked out where the Moth Mask would strike and chased her over the roofs.",
    'The Great Clock stopped. Ash found where the Moth Mask would strike and chased her.'],

  item: {
    magnifier:    { name: ["Hettie's spare glass", 'A magnifying glass'], desc: ['Dust shows up silver through it.', 'Dust shines in it.'] },
    c_bird_clock: { name: ["Lord Whirligig's bird clock", 'The bird clock'], desc: ['It glows at night. It is not yours.', 'It glows. It is not yours.'] },
  },

  place: {
    gh_bird_clock:  { map: 1, at: [7880, 24930], kind: 'examine', look: 'window_clock',
                      name: 'the bird clock in the window' },
    gh_roof_prints: { map: 1, kind: 'prints', path: [[7640, 25060], [7760, 24990], [7900, 24920]],
                      show: 'item magnifier', name: 'silver prints' },
    gh_clock_works: { map: 1, at: [7040, 24880], kind: 'examine', look: 'gear_hatch',
                      name: 'the clock works' },
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
      extra: [
        { do: 'examine gh_clock_works', then: ['clue g_dust_clock'] },
        { do: 'talk c_penny', scene: 'c_penny_first', then: ['clue g_penny_first'] },
      ] },
    { id: 'deduce', do: 'deduce where_next', obj: ['Work it out in the Case Book', 'Open the Case Book'] },
    { id: 'hester', do: 'talk c_hester', scene: 'c_hester', then: ['set c_hester'],
      obj: ['Tell Captain Ticklebrass at the Clockwatch Hall', 'Tell the Captain'] },
    { id: 'night',  do: 'wait_for night', at: 'c_whirligig_manor', skip: ['c_hester', 'c_whirligig'],
      obj: ['Wait for night by Whirligig Manor', 'Wait for night at the Manor'] },
    { id: 'chase',  do: 'minigame c_roofchase', at: 'c_whirligig_manor',
      scene: 'c_chase_start', lose: 'c_chase_lost' },
    { id: 'catch',  do: 'cutscene c_chase_end', then: ['stage c_salt'] },
  ],

  scene: {
    c_gate: [
      ['narr', 'Gearhaven! Every roof has a clock. Every clock says one minute to midnight.', 'Every clock here is stuck at one minute to midnight.'],
      ['c_bobs', 'Halt! Who goes there?'],
      ['c_bobs', "...It's a lizard, Bob."],
      ['ash', "I'm a dragon. Mostly. I'm looking for a thief in a moth mask.", "I'm a dragon. I'm looking for the Moth Mask."],
      ['c_penny', 'HEADLINE: DRAGON KID ARRIVES! Penny Press, Gearhaven Gazette. What is in your claw?', 'I am Penny, from the paper. What is in your claw?'],
      ['c_penny', 'A gear that says Gearhaven? Ask Professor Sprocket. Follow the colored smoke.', 'Ask Professor Sprocket. Follow the colored smoke.'],
    ],
    c_hettie: [
      ['c_hettie', "Visitor! Don't touch that. Oh, you're a DRAGON. What's that?", 'Hello! Oh, a DRAGON! What is that?'],
      ['narr', 'She snatches the gear and screws a magnifying glass into her goggles.', 'She looks at the gear with a big glass.'],
      ['c_hettie', 'Silver dust in the teeth. Moth dust! Only one person leaves it on everything.', 'Moth dust! Only one person leaves that.', { clue: 'g_dust_gear' }],
      ['c_hettie', 'The Moth Mask. Half the city wants her caught. The other half leaves its windows open.', 'The Moth Mask! A rooftop thief.'],
      ['c_hettie', 'Take my spare glass. Dust shows up silver through it.', 'Take this glass. Dust shines in it.', { do: ['give magnifier'] }],
      ['c_hettie', 'Go and look where she has been. Then tell Captain Ticklebrass.', 'Look where she has been. Then tell the Captain.'],
    ],
    c_penny_first: [
      ['c_penny', 'I was first at all nine robberies. Front page, every time!', 'I was first at every robbery!'],
      ['ash', 'How are you always first?'],
      ['c_penny', 'I run. Very fast. In a very big coat.', 'I run fast. In a big coat.'],
    ],
    c_hester: [
      ['c_hester', 'You are forty seconds late. The Press girl ran ahead.', 'You are late. The newspaper girl ran ahead.'],
      ['ash', 'She stole the Ember Heart. It is sort of my grandpa.', 'She stole the Ember Heart.'],
      ['c_hester', 'Whirligig Manor, tonight? Sound reasoning. I hate that I did not think of it.', 'The Manor, tonight? Good thinking.'],
      ['c_hester', 'Wait by the manor. When she runs, run after her. Do not fall off anything.', 'Wait by the Manor. When she runs, chase her!'],
    ],
    c_chase_start: [
      ['narr', 'Night. Up on the roof of Whirligig Manor, a shadow moves between the chimneys.', 'Night. A shadow moves on the Manor roof.'],
      ['c_whirligig', "THIEF! Not AGAIN! That's my good clock!"],
      ['c_mask', 'Oh look. The little ember came all this way. Go home.', 'Go home, little ember.'],
      ['ash', 'Give it BACK!'],
      ['c_mask', 'Catch me first.'],
    ],
    c_chase_lost: [
      ['narr', 'She is gone over the chimneys. She will be back on the Manor roof.', 'She got away. She will come back.'],
    ],
    c_chase_end: [
      { cam: 'c_great_clock', s: 1.5 },
      ['narr', 'The roofs end. Across the gap, the Great Clock is stuck at one minute to midnight.', 'The roofs end at the Great Clock.'],
      { place: ['c_mask', 'c_clock_hand'] },
      ['narr', 'She leaps, catches the minute hand, and slips. She hangs right in front of you.', 'She jumps to the clock hand. She slips!'],
      { choose: 'c_chase', ask: ['What do you do?'], pick: [
        { t: ['Grab her wrist and pull her up', 'Pull her up'], tone: 'kind',
          then: ['set c_chase=helped', 'trust vesper +1'],
          say: [['c_mask', '...Why did you do that?'], ['ash', 'You were going to fall.']] },
        { t: ['Grab the sack!', 'Grab the sack'], tone: 'brave',
          then: ['set c_chase=sack', 'give c_bird_clock'],
          say: [['c_mask', 'Wrong sack, little ember.']] },
      ] },
      { anim: ['c_mask', 'climb'], walk: ['c_mask', 'c_clock_top'] },
      ['ash', "HEY! You can't just climb up a CLOCK!"],
      ['narr', 'A note flutters down: "Go home, little ember. This isn\'t your story. M."', 'A note: "Go home, little ember. M."'],
    ],
  },

  talk: {
    c_whirligig: [
      { if: '!flag c_clock_on', fact: 'c_great_clock=stopped',
        say: ['Still stopped. STILL. I pay my clock tax!', 'Still stopped!'] },
      { if: 'flag c_clock_on', say: ['It ticks! I timed my tea by it. Perfect.', 'It ticks! Tea is on time.'] },
      { if: 'flag c_chase=sack', once: true,
        say: ['Hmph. My bird clock. Thank you. Wipe your feet.', 'My bird clock! Thanks. Wipe your feet.'],
        then: ['take c_bird_clock', 'give coins 30'] },
    ],
  },
})
