// game/story/act1/a1_gate.js: Act I's Case Book. Data only.
// "Who opened the North Gate?" (Yara's quest 'gate', The Open Gate) is now a mystery the player works out:
// the gate's lock was opened with a key and the kobolds came in through the open gate (a1_how), the letter is to
// "W." and there are W's to rule out (a1_who), and the oil barrels say why (a1_why). Then Ash confronts Fennick.
// Two small mysteries: what rattles in Sir Strawsworth's hat (a1_hat) and who put out the Hollow Ward (a1_snuffed).
// Old flag names are kept: clue_prints, clue_letter, clue_badge, tunnel_plans, gateHint, G.choices.fennick/morrow.
// What old code this replaces, and the engine features it needs, are in scratchpad v10/A1_WIRING.md.

// ================= the main mystery
quest({
  id: 'gate', act: 1, giver: 'yara', optional: true,
  // takes over QDEFS.gate: an old save at old step i resumes at old_steps[i]
  takeover: true, old_steps: ['look', 'letter', 'search', 'confront', 'tunnel', 'plans'],
  // the oldest saves have no G.quests.gate, only the choice Ash made about Fennick (while the quest runs in the data,
  // the choice at the confrontation must not end it: the tunnel and Wren's plans come after)
  done_if: { any: ['choice fennick=forgive !quest gate active', 'choice fennick=jail !quest gate active'] },
  title: ['Gate Expectations', 'The Open Gate'],
  payoff: { kind: 'shortcut', id: 'mine_cart' },
  // Grizzlefang no longer names the lamp-man, and Morrow's letter is only to "W."
  replaces: { 'STORY.bosses.grizzlefang.outro': 'a1_griz_outro', 'STORY.bosses.morrow.outro': 'a1_morrow_outro' },

  // the North Gate's fallen door (drawn by x0_act1.js while the gate is broken)
  place: {
    a1_gate_door: { map: 0, at: [2774, 8812], r: 34, kind: 'examine', name: 'the fallen door of the North Gate', if: 'stage>=raid !flag a1_gate_solved' },
  },

  clue: {
    a1_lock:         { mystery: 'a1_gate', icon: 'lock',
                       text: ['The North Gate padlock is not broken. Somebody opened it with a key.', 'The lock is not broken. Someone used a key.'] },
    a1_claws:        { mystery: 'a1_gate', icon: 'claw',
                       text: ['Kobold claw marks are on the outside of the fallen door, and none on the wall. Nobody climbed over.', 'Claw marks only on the door. Nobody climbed the wall.'] },
    a1_prints:       { mystery: 'a1_gate', icon: 'prints',
                       text: ['Sooty bootprints walk from the Hollow Ward to the North Gate. They smell of lamp oil.', 'Bootprints go to the gate. They smell of lamp oil.'] },
    a1_letter:       { mystery: 'a1_gate', icon: 'letter',
                       text: ['Morrow\'s letter: "To W. Leave the North Gate open on Lantern Day, and the oil will never run out."', 'A letter to "W.": open the gate, get oil forever.'] },
    a1_spare_key:    { mystery: 'a1_gate', icon: 'key',
                       text: ["Hal keeps the gate key on his belt. The spare hangs by his door for whoever lights the wall lamps. It was gone on Lantern Day.", 'The spare key is for the lamp lighter. It was gone.'] },
    a1_lamplighter:  { mystery: 'a1_gate', icon: 'lamp',
                       text: ['Fennick Wick lights every lamp in Emberhollow, even the ones on the wall.', 'Fennick lights every lamp in town.'] },
    a1_wendel_w:     { mystery: 'a1_gate', icon: 'note', herring: true,
                       text: ['Wendel Fisk signs all his songs with a big curly "W."', 'Wendel signs his songs "W."'] },
    a1_wendel_alibi: { mystery: 'a1_gate', icon: 'fiddle',
                       text: ['Nana Pettibone says Wendel played his fiddle on the green all Lantern Day, and never stopped.', 'Wendel played on the green all day.'] },
    a1_wren_away:    { mystery: 'a1_gate', icon: 'book',
                       text: ['Tilly says Sister Wren has not left her library in a week. Tilly brings her soup.', 'Wren never left her library.'] },
    a1_pebble_key:   { mystery: 'a1_gate', icon: 'key', herring: true,
                       text: ["There is a key in Pebble's nest! Its tag says PANTRY.", 'A key in the crow nest. It says PANTRY.'] },
    a1_gold:         { mystery: 'a1_gate', icon: 'coin',
                       text: ['Hob says his cousin Fennick had a pocket full of gold a week before Lantern Day. Fennick never has gold.', 'Fennick had gold. He never has gold.'] },
    a1_badge:        { mystery: 'a1_gate', icon: 'badge',
                       text: ["In Fennick's drawer: the brass scale badge of the Scaled Oath, and the North Gate spare key.", "In Fennick's drawer: an Oath badge and the gate key."] },
    a1_empty_oil:    { mystery: 'a1_gate', icon: 'barrel',
                       text: ["Every oil barrel in Wick's Lamps & Oils is empty. Not one drop.", 'All the oil barrels are empty.'] },
    a1_cellar_note:  { mystery: 'a1_gate', icon: 'note',
                       text: ['Under the lamp shop is a secret room, with a note: "W. The gate. Leave it open. M."', 'A secret room. A note: "W. Leave the gate open."'] },
  },

  deduce: {
    a1_how: {
      mystery: 'a1_gate',
      ask: ['How did the kobolds get through the North Gate?', 'How did the kobolds get in?'],
      needs: ['a1_lock', 'a1_claws'],
      bonus: ['a1_oath_inside'],
      pick: [
        { t: ['Somebody inside opened it with a key', 'Someone opened it with a key'], right: true },
        { t: ['The kobolds smashed the lock', 'They smashed the lock'], hint: ['Look at the padlock again. Is it broken?', 'Is the lock broken?'] },
        { t: ['The kobolds climbed over the wall', 'They climbed the wall'], hint: ['Where are the claw marks? On the wall, or only on the door?', 'Where are the claw marks?'] },
      ],
      then: ['set a1_gate_how'],
    },
    a1_who: {
      mystery: 'a1_gate',
      ask: ['The letter was to "W." Who is W.?', 'Who is "W."?'],
      needs: ['a1_letter', 'a1_prints', 'a1_spare_key', 'a1_lamplighter', 'a1_wendel_alibi'],
      bonus: ['a1_gold', 'a1_button', 'a1_wren_away'],
      pick: [
        { t: ['Fennick Wick, the lamp man', 'Fennick Wick'], right: true },
        { t: ['Wendel Fisk, the fiddler', 'Wendel Fisk'], hint: ['Nana says Wendel fiddled on the green all day. And do fiddles smell of lamp oil?', 'Where was Wendel all day?'] },
        { t: ['Sister Wren, the librarian', 'Sister Wren'], hint: ['Wren lives over in Brindlecross. Did she ever leave her library?', 'Did Wren leave her library?'] },
        { t: ['Hal Burrows, who keeps the gate key', 'Hal Burrows'], hint: ['Hal starts with H, not W. And his own key never left his belt.', 'Hal starts with H, not W.'] },
      ],
      then: ['set a1_gate_who'],
    },
    a1_why: {
      mystery: 'a1_gate',
      ask: ['Why would Fennick help the Scaled Oath?', 'Why did Fennick do it?'],
      needs: ['a1_letter', 'a1_empty_oil', 'a1_badge'],
      pick: [
        { t: ['His oil ran out, and they promised him oil forever', 'They promised him oil forever'], right: true },
        { t: ['He wanted to sell lamps to the kobolds', 'He wanted to sell lamps'], hint: ['Kobolds are scared of fire. What did the letter promise him?', 'What did the letter promise?'] },
        { t: ['He wanted to be a dragon', 'He wanted to be a dragon'], hint: ['Knock on his barrels. What has he run out of?', 'Look in his barrels.'] },
      ],
      then: ['set a1_gate_why'],
    },
  },

  step: [
    // (after Grizzlefang's outro, stage wren on: the first talk to Yara offers it. The old gateHint flag was set by
    // that same talk, after the engine's turn, so it made a new player talk to Yara twice)
    { id: 'offer', do: 'talk yara', scene: 'a1_gate_offer', if: 'stage>=wren',
      obj: ['Ask Elder Yara about the North Gate', 'Talk to Yara'],
      hint: ['Elder Yara wants to talk about the open gate. She is by the well in Emberhollow.', 'Yara is by the well.'] },
    { id: 'look', do: 'all',
      obj: ['Find out how the kobolds got through the North Gate', 'Look at the North Gate'],
      hint: ['Look at the North Gate, its fallen door, and the bootprints by the Hollow Ward.', 'Look at the gate and the prints.'],
      parts: [
        { do: 'examine north_gate', scene: 'a1_gate_look' },
        { do: 'examine a1_gate_door', scene: 'a1_door_look' },
        { do: 'track bootprints', scene: 'a1_prints_look', then: ['clue a1_prints', 'set clue_prints'] },
      ],
      extra: [
        { do: 'talk wendel', scene: 'a1_wendel_w' },
        { do: 'examine pebbles_nest', scene: 'a1_nest_look' },
      ] },
    { id: 'how', do: 'deduce a1_how',
      obj: ['Work out how in the Case Book', 'Open the Case Book'] },
    { id: 'letter', do: 'find oath_letter', then: ['clue a1_letter', 'set clue_letter'],
      obj: ['Find out who the Oath was paying. High Priest Morrow might know.', 'Ask Morrow at the Ash Ward'],
      hint: ['Morrow leads the Scaled Oath at the Ash Ward. Beat him and see what he carries.', 'Morrow is at the Ash Ward.'] },
    { id: 'ask', do: 'all',
      obj: ['Find out who "W." is. Ask around Emberhollow.', 'Who is W.? Ask around town.'],
      hint: ['Ask Hal by the North Gate about the key, Nana about Lantern Day, and Mabel about the wall lamps.', 'Ask Hal, Nana and Mabel.'],
      parts: [
        { do: 'talk hal', scene: 'a1_hal_key' },
        { do: 'talk nana', scene: 'a1_nana_alibi' },
        { do: 'talk mabel', scene: 'a1_mabel_lamps' },
      ],
      extra: [
        { do: 'talk tilly', scene: 'a1_tilly_wren' },
      ] },
    { id: 'who', do: 'deduce a1_who',
      obj: ['Work out who "W." is in the Case Book', 'Open the Case Book'] },
    { id: 'search', do: 'all',
      obj: ["Search Fennick's shop, Wick's Lamps & Oils", 'Search the lamp shop'],
      hint: ["Wick's Lamps & Oils is near the bakery in Emberhollow. Look in the drawer and the barrels.", 'Look in the drawer and the barrels.'],
      parts: [
        { do: 'examine fennick_drawer', scene: 'a1_drawer_look', then: ['set clue_badge', 'give oath_badge'] },
        { do: 'examine fennick_barrels', scene: 'a1_barrels_look' },
      ],
      extra: [
        { do: 'examine oath_meeting_note', scene: 'a1_cellar_look' },
      ] },
    { id: 'why', do: 'deduce a1_why',
      obj: ['Work out why in the Case Book', 'Open the Case Book'] },
    { id: 'confront', do: 'talk fennick', scene: 'a1_confront',
      obj: ['Talk to Fennick Wick', 'Talk to Fennick'] },
    { id: 'tunnel', do: 'find oath_plans', then: ['set tunnel_plans'],
      obj: ["Explore the Oath's Hidden Tunnel off the Ashen Road", 'Go into the Oath tunnel'] },
    { id: 'plans', do: 'give oath_plans wren', scene: 'a1_wren_plans',
      then: ['give coins 60', 'xp 200', 'bless 1'],
      obj: ["Show the Oath's plans to Sister Wren", 'Show Wren the plans'] },
  ],

  scene: {
    a1_griz_outro: [
      ['griz', 'The Oath... paid in gold... and somebody in your village... opened the gate...', 'The Oath paid... someone in your village opened the gate...', { mood: 'hurt', ref: 'north_gate' }],
      ['ash', 'Somebody in Emberhollow? Who?', 'Someone from home? Who?'],
      ['voice', 'Little ember. I can smell her fire on you. My fire. Come up the mountain, child, and bring it home.', 'Little ember. You have my fire. Come up the mountain and bring it home.'],
      ['ash', '...Yara? Did you hear that?', 'Yara? Did you hear that?'],
      ['yara', '(through the shrine stone) I heard him. Go east to Brindlecross, Ash. Sister Wren keeps the old library there.', '(far away) I heard. Go east to Brindlecross. Find Sister Wren.', { dir: ['warcamp', 'brindlecross', 'east'] }],
    ],
    a1_morrow_outro: [
      ['voice', 'Morrow served me well. You will serve me better. Keep climbing, little ember.', 'Keep climbing, little ember.'],
      ['narr', 'A crumpled letter falls out of Morrow\'s sleeve: "To W. Leave the North Gate open on Lantern Day, and the oil will never run out."', 'A letter: "To W. Open the North Gate. Oil forever."', { ref: 'north_gate', do: ['give oath_letter'] }],
      { choose: 'morrow', who: 'morrow', mood: 'ashamed', ask: ["Please. I'm an old man who believed a dragon. Isn't that punishment enough?", 'Please. I was silly. Let me go?'], pick: [
        { t: ['Let him go', 'Let him go'], tone: 'kind', v: 'free',
          say: [['ash', 'Go home, Morrow. Find something better to believe in.', 'Go home. Believe in something better.'],
                ['morrow', 'Thank you. Maybe I will grow something that is not on fire.', 'Thank you. Maybe I will grow pumpkins.', { mood: 'tender' }]] },
        { t: ['Take him to Captain Osric', 'Take him to Osric'], tone: 'brave', v: 'jail',
          say: [['ash', 'You are coming to Brindlecross. Captain Osric can decide.', 'Osric can decide.'],
                ['narr', 'You march Morrow to the Watch House. Osric looks thrilled. Morrow looks relieved.', 'Osric is thrilled. Morrow is relieved.']] },
      ] },
    ],
    a1_gate_offer: [
      ['yara', "Ash. Grizzlefang said somebody in Emberhollow opened the gate for them. I can't stop thinking about it.", 'Grizzlefang said someone here opened the gate.', { ref: 'north_gate' }],
      ['yara', "Kobolds can't pick locks. They don't have the thumbs for it.", 'Kobolds cannot pick locks. No thumbs.'],
      ['ash', 'So who opened it?'],
      ['yara', "That's what you're going to find out. Look at the North Gate, and ask around.", 'Look at the gate. Ask around.', { ref: 'north_gate' }],
      ['yara', "Put what you find in your Case Book. It's somebody we know, Ash. Somebody who waves at you in the street.", "Use your Case Book. It's someone we know."],
    ],
    a1_gate_look: [
      ['narr', 'The North Gate hangs open. Its big padlock dangles from a hook on the post.', 'The gate hangs open. The lock dangles.', { ref: 'north_gate', fact: 'north_gate=broken', if: '!flag a1_gate_solved' }],
      ['narr', "You look closer. The lock isn't broken. Not one scratch. Somebody opened it with a key.", 'The lock is not broken. Someone used a key!', { clue: 'a1_lock' }],
      ['ash', 'A key. So it was somebody with a key.', 'Somebody had a key.'],
    ],
    a1_door_look: [
      ['narr', 'One of the gate doors lies in the mud. Kobold claw marks cover its outside.', 'A door lies in the mud. Claw marks outside.', { ref: 'a1_gate_door' }],
      ['narr', 'The wall has no marks at all. Nobody climbed over. They ran in when the gate swung open.', 'No marks on the wall. They came through the gate.', { clue: 'a1_claws' }],
    ],
    a1_prints_look: [
      ['narr', 'The sooty bootprints walk from the Hollow Ward all the way to the North Gate.', 'The bootprints go from the Ward to the gate.', { ref: 'bootprints', dir: ['hollow_ward', 'north_gate', 'north'] }],
      ['ash', 'They smell funny. Like... lamp oil?', 'They smell like lamp oil!'],
    ],
    a1_wendel_w: [
      ['wendel', 'Ash! Want to hear my newest song? I wrote it myself. Look, I even signed it.', 'Want my new song? I signed it!'],
      ['narr', 'At the bottom of the song sheet, in big curly letters: W.', 'The song is signed: W.', { clue: 'a1_wendel_w' }],
      ['ash', 'W. Hmm.'],
    ],
    a1_nest_look: [
      ['narr', "Pebble's nest is full of treasure: buttons, spoons, a thimble, and a key!", "Pebble's nest: buttons, spoons, and a key!", { ref: 'pebbles_nest' }],
      ['narr', 'The key has a little tag on it. It says PANTRY.', 'The key says PANTRY.', { clue: 'a1_pebble_key' }],
      ['narr', 'Pebble watches you from the window. She does not look sorry. Caw.', 'Pebble watches you. Caw.'],
    ],
    a1_hal_key: [
      ['hal', 'The gate key? I keep it right here on my belt. Never comes off. Not even in the bath.', 'My key is on my belt. Always.'],
      ['hal', 'The spare hangs on a hook by my door, for whoever lights the lamps on the wall.', 'The spare is for whoever lights the wall lamps.', { ref: 'burrows_farmhouse' }],
      ['hal', 'That hook was empty on Lantern Day. I thought the spare was just out being useful.', 'The spare was gone on Lantern Day!', { clue: 'a1_spare_key' }],
      ['ash', 'Who lights the lamps on the wall?', 'Who lights the wall lamps?'],
      ['hal', "Ask anyone. I'm a turnip man. I don't notice lamps.", "Ask around. I'm a turnip man."],
    ],
    a1_nana_alibi: [
      ['ash', 'Nana, where was everybody when the gate opened?', 'Where was everyone when the gate opened?'],
      ['nana', 'Well, Wendel played his fiddle on the green all Lantern Day. He never stopped once.', 'Wendel played on the green all day.'],
      ['nana', 'Not to eat. Not to drink. Not even when the kobolds came. He just played louder.', 'He never stopped. Not even for kobolds.', { clue: 'a1_wendel_alibi' }],
      ['nana', 'My ears are still ringing, dear. Lovely tune, though.', 'My ears still ring. Nice tune.'],
    ],
    a1_mabel_lamps: [
      ['ash', 'Mabel, who lights the lamps on the wall?', 'Who lights the wall lamps?'],
      ['mabel', 'Fennick Wick, of course. He lights every lamp in Emberhollow. The wall, the green, the lot.', 'Fennick lights every lamp in town.', { clue: 'a1_lamplighter' }],
      ['mabel', 'He has been very twitchy lately. I gave him chamomile. It did not help.', 'He is twitchy lately. Tea did not help.'],
    ],
    a1_tilly_wren: [
      ['tilly', "Sister Wren? She hasn't left that library in a week. I bring her soup through the window.", 'Wren never left her library. I bring soup.'],
      ['tilly', 'She says books are better company. Books never complain about the soup.', 'Books never complain about soup.', { clue: 'a1_wren_away' }],
    ],
    a1_drawer_look: [
      ['narr', 'The drawer is stuffed with wicks. Under the wicks, something shiny.', 'Wicks. Under them, something shiny.', { ref: 'fennick_drawer' }],
      ['narr', 'A brass badge shaped like a dragon scale: the badge of the Scaled Oath. And a big iron key.', 'An Oath badge! And a big iron key.', { clue: 'a1_badge' }],
      ['narr', 'A tag on the key says NORTH GATE, SPARE.', 'The key says NORTH GATE.', { ref: 'north_gate' }],
      ['ash', 'Oh, Fennick.'],
    ],
    a1_barrels_look: [
      ['narr', 'You knock on the oil barrels. Bonk. Bonk. Bonk. Every single one is empty.', 'Every oil barrel is empty.', { ref: 'fennick_barrels', clue: 'a1_empty_oil' }],
      ['ash', 'A lamp shop with no lamp oil. That is a sad shop.', 'A lamp shop with no oil. Sad.'],
    ],
    a1_cellar_look: [
      ['narr', 'A secret room under the shop, with an Oath banner and black candles.', 'A secret room! Oath banners and candles.', { ref: 'oath_meeting_note' }],
      ['narr', 'A note on the table: "W. The gate. Leave it open. M." Somebody scribbled I\'M SORRY across it.', 'A note: "W. Leave the gate open. M." And SORRY.', { clue: 'a1_cellar_note' }],
    ],
    a1_confront: [
      ['fennick', "Ash! Welcome to Wick's Lamps & Oils. We are, um, out of oil.", 'Welcome! We are out of oil.'],
      ['ash', 'I found your Oath badge. And the spare key to the North Gate.', 'I found your badge. And the gate key.', { ref: 'north_gate' }],
      ['fennick', '...W for Wick. I knew I should have used a fake name.', 'W for Wick. I needed a fake name.'],
      ['fennick', 'My barrels were empty, Ash. They said leave the gate open, and the oil would never run out.', 'My oil ran out. They promised oil forever.'],
      ['ash', 'Kobolds burned two houses, Fennick. And the Ward went out.', 'Kobolds burned two houses!'],
      ['fennick', "I know. I didn't think. I see those two black roofs every time I open my shutters.", 'I know. I see those burnt roofs every day.'],
      { choose: 'fennick', ask: ['What should happen to Fennick?', 'What happens to Fennick?'], pick: [
        { t: ['Forgive him. He can make it right.', 'Forgive him'], tone: 'kind', v: 'forgive', then: ['set a1_gate_solved', 'give tunnel_key'],
          say: [['ash', 'You are going to make it right. Every lantern, every night.', 'Make it right. Every lantern, every night.'],
                ['fennick', 'I will! And take this. The key to their tunnel off the Ashen Road.', 'I will! Take their tunnel key.', { ref: 'oath_tunnel' }]] },
        { t: ['Turn him in to Captain Osric', 'Turn him in to Osric'], tone: 'brave', v: 'jail', then: ['set a1_gate_solved', 'give tunnel_key', 'people'],
          say: [['ash', 'You have to answer for it, Fennick.', 'You have to answer for it.'],
                ['fennick', "That's fair. Take their key. It opens a tunnel off the Ashen Road. I'll bring a lamp. For the cell.", "That's fair. Take their tunnel key.", { ref: 'oath_tunnel' }]] },
      ] },
    ],
    a1_wren_plans: [
      ['wren', '"Snuff the Wards before the thousandth year ends. When the binding fails, hand the Emberblood to the mountain."', '"Snuff the Wards. Then hand over the Emberblood."'],
      ['wren', '"And we will be rewarded with..." and then a doodle of a dragon in a crown.', 'Then a doodle of a dragon in a crown.'],
      ['wren', 'So that is their whole plan. You ruined it, mostly by being very annoying to kidnap.', 'You ruined their plan. You are hard to kidnap!'],
      ['wren', 'And a note in the margin, in different ink: "The moth lady pays in silver dust. Ask no questions."', 'A note: "The moth lady pays in silver dust."'],
      ['wren', 'Their tunnel has an old mine cart out to the Gatewatch hills. Handy, if you need the Obsidian Gate in a hurry.', 'Their tunnel has a mine cart to the Obsidian Gate hills.', { ref: 'mine_cart', promise: 'mine_cart' }],
    ],
  },

  talk: {
    // the lamp man is very nervous until the mystery is solved
    fennick: [
      { if: 'quest gate active !flag a1_gate_solved', bark: true,
        say: ['Lamp oil! Wicks! Business is fine! Why does everyone keep asking?', 'Business is fine! Stop asking!'] },
    ],
    // a helpful cousin (a clue that backs up the main deduction)
    hob: [
      { if: 'quest gate active !solved a1_who', once: true, option: ['Has Fennick been here lately?', 'Was Fennick here?'],
        say: ['My cousin Fennick had a pocket full of gold a week before Lantern Day. Fennick never has gold. Fennick has lint.', 'Fennick had gold! He never has gold.'],
        then: ['clue a1_gold'] },
    ],
  },
})

// ================= small mystery: what rattles in Sir Strawsworth's hat? (Hal's rumor)
quest({
  id: 'a1_hat', act: 1, giver: 'hal', optional: true,   // started by Hal's rumor (people() at the end)
  // (v11) open from the raid on, like Hal's option: before it Hal showed a gold ! for a quest he could not give yet
  if: 'stage>=lore',
  title: ['Keep It Under Your Hat', 'The Scarecrow Hat'],
  payoff: { kind: 'truth', id: 'a1_button' },
  // Hal's old rumor about the hat (a1g_talk.js) is the people() option below now
  replaces: { 'TALK.hal.rumor': null },

  clue: {
    a1_rattle:       { mystery: 'a1_hat', icon: 'hat',
                       text: ["Something rattles inside Sir Strawsworth's hat. Hal has never checked.", 'Something rattles in the scarecrow hat.'] },
    a1_feathers:     { mystery: 'a1_hat', icon: 'feather',
                       text: ["Sir Strawsworth's shoulders are covered in black feathers.", 'Black feathers on the scarecrow.'] },
    a1_pebble_hoard: { mystery: 'a1_hat', icon: 'crow',
                       text: ["Pebble, Elder Yara's crow, hides treasure. Her nest has straw woven like a tiny hat.", 'Pebble hides treasure. Her nest has hat straw.'] },
    a1_rook_sticky:  { mystery: 'a1_hat', icon: 'hand', herring: true,
                       text: ['Rook once got stuck on Sir Strawsworth, and left jam on his hat.', 'Rook got stuck on the scarecrow once.'] },
    a1_button:       { mystery: 'a1_gate', icon: 'button',
                       text: ["In Sir Strawsworth's hat: a brass button stamped WICK'S LAMPS & OILS. Pebble found it near the North Gate.", 'A lamp shop button, found by the gate.'] },
  },

  deduce: {
    a1_hat_who: {
      mystery: 'a1_hat',
      ask: ["Who keeps hiding things in Sir Strawsworth's hat?", 'Who hides things in the hat?'],
      needs: ['a1_rattle', 'a1_feathers', 'a1_pebble_hoard'],
      pick: [
        { t: ["Pebble, Elder Yara's crow", 'Pebble the crow'], right: true },
        { t: ['Rook Ashby', 'Rook'], hint: ['Rook leaves sticky jam, not black feathers.', 'Rook leaves jam, not feathers.'] },
        { t: ['Hal Burrows', 'Hal'], hint: ['Hal says he has never checked the hat. Who leaves feathers?', 'Who leaves feathers?'] },
      ],
      then: ['set a1_hat_who'],
    },
  },

  step: [
    { id: 'look', do: 'all',
      obj: ["Find out what rattles in Sir Strawsworth's hat", 'Look at the scarecrow'],
      hint: ["Sir Strawsworth guards the turnip field by Emberhollow. Elder Yara's crow lives upstairs at her house.", 'Look at the scarecrow. Visit Pebble.'],
      parts: [
        { do: 'examine strawsworth', scene: 'a1_straw_look' },
        { do: 'examine pebbles_nest', then: ['clue a1_pebble_hoard'] },
      ] },
    { id: 'deduce', do: 'deduce a1_hat_who', obj: ['Work it out in the Case Book', 'Open the Case Book'] },
    { id: 'hat', do: 'examine strawsworth', scene: 'a1_hat_open', then: ['give coins 25'],
      obj: ["Look inside Sir Strawsworth's hat", 'Look in the hat'] },
  ],

  scene: {
    a1_straw_look: [
      ['narr', 'Sir Strawsworth stands guard over the turnips. His shoulders are covered in black feathers.', 'Black feathers all over the scarecrow!', { ref: 'strawsworth', clue: 'a1_feathers' }],
      ['narr', 'His hat goes clink, clink in the wind. Somebody is using it as a cupboard.', 'The hat goes clink. Something is inside.', { clue: 'a1_rattle' }],
    ],
    a1_hat_open: [
      ['narr', "You lift Sir Strawsworth's hat. Out pour buttons, a spoon, and twenty-five coins. Pebble's secret cupboard!", "Buttons, a spoon and 25 coins! Pebble's stash."],
      ['narr', "And a brass button stamped WICK'S LAMPS & OILS. Crows pick things up where people drop them.", 'A brass button from the lamp shop!', { clue: 'a1_button' }],
      ['ash', 'Pebble found this by the North Gate, I bet.', 'I bet Pebble found it by the gate.', { ref: 'north_gate' }],
    ],
  },

  talk: {
    rook: [
      { if: 'quest a1_hat active', once: true, option: ['Have you ever climbed Sir Strawsworth?', 'Did you climb the scarecrow?'],
        say: ['Once! I got stuck for an hour. Hal had to fetch a ladder. I left jam on his hat.', 'I got stuck on him once! Jam everywhere.'],
        then: ['clue a1_rook_sticky'] },
    ],
  },
})

// ================= small mystery: who put out the Hollow Ward?
quest({
  id: 'a1_snuffed', act: 1, giver: 'yara', optional: true,   // started by asking Yara (people() at the end)
  // (v11) open from the raid on, like Yara's option (before it she showed a gold ! for it on Lantern Day morning)
  if: 'stage>=lore !flag act1_done',
  title: ['Out Like a Light', 'The Cold Ward'],
  payoff: { kind: 'truth', id: 'a1_oath_inside' },

  // black candle wax round the Hollow Ward stone (drawn by x0_act1.js from the raid until Act I ends)
  place: {
    a1_ward_wax: { map: 0, at: [2560, 9122], r: 30, kind: 'examine', name: 'the black wax on the old stone', if: 'stage>=raid !flag act1_done' },
  },

  clue: {
    a1_black_wax:      { mystery: 'a1_snuffed', icon: 'candle',
                         text: ['Black candle wax is dripped all round the Hollow Ward stone, with a stub of black candle.', 'Black wax and a black candle by the Ward.'] },
    a1_kobolds_scared: { mystery: 'a1_snuffed', icon: 'kobold',
                         text: ["Bertram says the kobolds ran screaming from his oven. Kobolds are scared stiff of fire.", 'Kobolds ran from the oven. They fear fire.'] },
    a1_oath_candles:   { mystery: 'a1_snuffed', icon: 'book',
                         text: ['Sister Wren says only an Oath black candle can put out a Ward-fire. They drink fire.', 'Only an Oath black candle can put out a Ward.'] },
    a1_windy:          { mystery: 'a1_snuffed', icon: 'wind', herring: true,
                         text: ['Dunstan says it was very windy on Lantern Day. His hat blew off.', 'It was very windy on Lantern Day.'] },
    a1_oath_inside:    { mystery: 'a1_gate', icon: 'candle',
                         text: ['An Oath cultist came in with the kobolds and snuffed the Hollow Ward. The Oath had a friend inside.', 'The Oath came in with the kobolds.'] },
  },

  deduce: {
    a1_snuff_who: {
      mystery: 'a1_snuffed',
      ask: ['Who put out the Hollow Ward?', 'Who put out the Ward?'],
      needs: ['a1_black_wax', 'a1_kobolds_scared', 'a1_oath_candles'],
      pick: [
        { t: ['The Scaled Oath, with a black candle', 'The Scaled Oath'], right: true },
        { t: ['The wind', 'The wind'], hint: ['Wren says Ward-fire has burned through a thousand years of wind.', 'Can wind put out Ward-fire?'] },
        { t: ['The kobolds', 'The kobolds'], hint: ['Bertram says kobolds run from fire. Would one touch a Ward?', 'Kobolds are scared of fire.'] },
      ],
      then: ['set a1_snuff_who', 'clue a1_oath_inside'],
    },
  },

  step: [
    { id: 'look', do: 'all',
      obj: ['Find out who put out the Hollow Ward', 'Who put out the Ward?'],
      hint: ['Look at the Ward stone under the old oak. Ask Bertram at the bakery, and Sister Wren in Brindlecross.', 'Look at the Ward. Ask Bertram and Wren.'],
      parts: [
        { do: 'examine a1_ward_wax', scene: 'a1_wax_look' },
        { do: 'talk bertram', scene: 'a1_bertram_ran' },
        // (from stage oath on: at stage wren her first talk is the main story's, STORY.wren, which moves Ash on)
        { do: 'talk wren', scene: 'a1_wren_candles', if: 'stage>=oath' },
      ] },
    { id: 'deduce', do: 'deduce a1_snuff_who', obj: ['Work it out in the Case Book', 'Open the Case Book'] },
  ],

  scene: {
    a1_wax_look: [
      ['narr', 'Black wax is dripped all round the cold Ward stone, next to a stub of black candle.', 'Black wax and a black candle stub!', { ref: 'a1_ward_wax', clue: 'a1_black_wax' }],
      ['ash', 'Somebody put the Ward out on purpose. With a candle?', 'Someone put it out with a candle?'],
    ],
    a1_bertram_ran: [
      ['ash', 'Bertram, did the kobolds touch the Hollow Ward?', 'Did the kobolds touch the Ward?'],
      ['bertram', 'Kobolds? They ran screaming from my oven. They are scared stiff of fire. Of FIRE, Ash. In a bakery.', 'They ran from my oven! Kobolds fear fire.', { clue: 'a1_kobolds_scared' }],
      ['bertram', 'A kobold would not go within ten steps of a Ward-fire. Not for all the dough in my shop.', 'No kobold goes near a Ward-fire.'],
    ],
    a1_wren_candles: [
      ['ash', 'Sister Wren, how do you put out a Ward-fire?', 'How do you put out a Ward-fire?'],
      ['wren', "You don't. Not with water, not with wind. Ward-fire has burned for a thousand years.", 'Water and wind cannot do it.'],
      ['wren', 'Unless you have an Oath black candle. They drink fire. Horrible things.', 'The Oath has black candles. They drink fire!', { clue: 'a1_oath_candles' }],
    ],
  },

  talk: {
    n0: [
      { if: 'quest a1_snuffed active', once: true, option: ['Did anything odd happen on Lantern Day?', 'Anything odd on Lantern Day?'],
        say: ['Odd? It was ever so windy! My hat blew right off. And then, kobolds.', 'So windy! My hat blew off. Then kobolds.'],
        then: ['clue a1_windy'] },
    ],
  },
})

// ================= act-wide talk that starts the two small mysteries (A2S's people() call)
people({
  id: 'a1_people', act: 1,
  // (v11) after the Broodmother's "Are you sure you're not mine?", the next time Ash talks to Mom
  scene: {
    a1_mom_fear: [
      ['maren', "You've gone quiet. You never go quiet. What is it?", "You're quiet. That's not like you. What is it?", { mood: 'worried' }],
      ['ash', "Mom, is my fire Grandpa's? He asked me if I'm sure I'm not his.", "Is my fire Grandpa's? He says I might be his.", { mood: 'worried' }],
      ['maren', 'Half of it was. Then Ember gave it away. Given is different, Ash.', 'Half was his. Ember gave it away. Given is different.', { mood: 'tender' }],
      ['narr', 'She holds on to your hand a little longer than she needs to.', 'She holds your hand a little longer.'],
    ],
  },
  talk: {
    maren: [
      { if: 'event boss_done:broodmother !flag act1_done', first: true, scene: 'a1_mom_fear' },
    ],
    hal: [
      { if: 'stage>=lore !quest a1_hat active !quest a1_hat done', once: true, option: ['Heard anything about Sir Strawsworth?', 'About the scarecrow...'],
        say: ["His hat rattles when the wind blows. Something's in there. I've never checked. He looks like he'd mind.", 'His hat rattles! I never checked.'],
        then: ['quest start a1_hat', 'clue a1_rattle'] },
    ],
    yara: [
      { if: 'stage>=lore !flag act1_done !quest a1_snuffed active !quest a1_snuffed done', once: true, option: ['Who put out the Hollow Ward?', 'Who put out the Ward?'],
        say: ['I wish I knew, Ash. Ward-fire does not just go out. Go and look at the stone.', 'Go and look at the Ward stone.'],
        then: ['quest start a1_snuffed'] },
    ],
  },
})
