// game/story/act3/people.js (A3S): everyday talk and barks for every Act III person in Frostreach (map 2).
// Replaces their CAST `lines`, x2_people's moodLine wrapper and their personal B() barks (CHANGES.md, A2S people()).
// The talk topics (bio, about, rumor, deep, best), the first-meeting greetings, the shops and x2_people's quest options
// (Oskar's letter, Brynja reading it, Mags's spare test bomb, Hask's sled rides, Juniper's "back to shore") stay
// x2_people's. Rules kept here:
//  - Lines that state a world fact that changes carry `fact` and are conditioned on it, so nobody calls the Hearth
//    dying after it burns blue. Facts (registry/map2_s.js): f3s_hearth dying|blue, f3s_northgate frozen|open, f3s_hush
//    loose|gone, f3s_glaciar spell|free|asleep, f3s_forge cold|lit, f3s_rimeholm frozen|warm.
//  - People react to what Ash did: `once` lines after each side quest and choice come first, then reminders while a
//    quest runs, then the state lines, then a list the game cycles through.
//  - The small mystery what_knights (places_map2.js) is asked about here: Brann's missing patrol, Pim's herring, Rowan.
//  - Each earlier-map gate (gates_map0.js, gates_map1.js) has a pointer here or in a letter, tagged with `promise`.
// Quest offers are the quests' own first steps (talk <giver>); people.js loads before the q_ files, so the reminders
// that are plain lines live here.
people({
  id: 'act3_people', act: 3,

  npc: {
    // a Hearthwarden of Sir Knut's lost patrol, home again by the West Gate once Ash has Blazed a Rime Knight free
    f3_rowan: { name: ['Hearthwarden Rowan', 'Rowan'], map: 2, at: [6200, 48960],
      look: { skin: '#e8bc98', hair: '#6a4a2a', hairdo: 'short', outfit: 'armor', helm: true, plume: '#3a6aaa', cape: '#2a4a7a', hold: 'spear', build: 'strong', frost: true },
      where: [{ if: 'flag f_freed_n>=1', at: [6200, 48960] }, { at: null }] },
    // two of the freed patrol, standing guard at the Dreadgate after Hush, once Ash has worked out what the knights were
    f3_patrol_a: { name: ['Hearthwarden Sigge', 'Sigge'], map: 2, at: [7220, 44430], card: false,
      look: { skin: '#f0c8a8', hair: '#c8a060', hairdo: 'braids', outfit: 'armor', helm: true, plume: '#3a6aaa', cape: '#2a4a7a', hold: 'spear' },
      where: [{ if: 'flag f_hush_done solved what_knights', at: [7220, 44430] }, { at: null }] },
    f3_patrol_b: { name: ['Hearthwarden Bjorn', 'Bjorn'], map: 2, at: [7380, 44430], card: false,
      look: { skin: '#c88a62', hair: '#2a1a10', hairdo: 'short', beard: true, beardc: '#2a1a10', outfit: 'armor', helm: true, plume: '#3a6aaa', cape: '#2a4a7a', hold: 'spear', build: 'big' },
      where: [{ if: 'flag f_hush_done solved what_knights', at: [7380, 44430] }, { at: null }] },
  },

  item: {
    f3_plume: { name: ['Hearthwarden Plume', 'Hearthwarden Plume'], icon: 'star', keepsake: true, hat: { look: 'hearth_plume', col: '#3a6aaa' },
      desc: ["Captain Brann's spare plume, Hearthwarden blue. Wear it with your chin UP.", "Brann's blue plume. Chin up!"] },
  },

  scene: {
    a3p_plume: [
      ['f_brann', 'My patrol! Frozen into moth-frost armor, marching for HER! THAT is why they never came home!', 'My patrol! Frozen in ice armor!'],
      ['f_brann', 'And you melted them free. With your FACE. Thank you, Ash. From the bottom of my beard.', 'And you melted them free. Thank you!'],
      ['f_brann', 'Here. My spare plume. Hearthwarden blue. You are one of us now. Wear it with your chin UP.', 'My spare plume. You are one of us now!',
        { do: ['give f3_plume', 'hat f3_plume'] }],
      ['f_brann', 'Hearthwardens! Salute! ...Gunnar, that is still a snowman.', 'Salute! Gunnar, that is a snowman.'],
    ],
    a3p_rowan: [
      ['f3_rowan', 'You! You\'re the dragon who breathed on me! I was up on the Dreadmoor with Sir Knut. Purple snow came down, and then...', 'You thawed me! I was on the moor. Purple snow fell...'],
      ['f3_rowan', 'Then I was walking. In armor made of ice. Walking for HER. I could not stop.', 'Then I walked in ice armor. I could not stop.'],
      ['f3_rowan', 'Then you breathed on me, and I woke up in a puddle. Thank you. Is there any lunch?', 'Then you breathed on me. Thank you!'],
    ],
  },

  talk: {
    // ---------------------------------------------------------------- Hearthold
    f_brynja: [
      { if: 'quest f_song done', once: true,
        say: ["I sing the Snow Mother's Song to her every night now. The whole song. She crackles along on the high notes.", 'I sing her the whole song now. She crackles along.'] },
      { if: 'choice f_glaciar=free choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ['She came down off the mountain and breathed on my Hearth. Blue and white for a whole hour. I cried. Do not tell Brann.', 'She breathed on my Hearth. I cried. Shh.'] },
      // G1 pointer: Tove's old cold post at Frostpine (gates_map0.js f3g_tove)
      { if: 'stage>=f_kindle !flag f3_tove_seen', option: ['Did Ember have friends up here?', 'Did Ember have friends here?'],
        say: [['f_brynja', 'The archive says a spirit kept the cold post at the foot of the old pass, long ago, while Ember kept the fire. A spirit called Tove.', 'A spirit called Tove kept the cold post.'],
          ['tove', "I did. And I left something under the ice there, by my old statue at Frostpine. Go and melt it. I'm not saying what.", 'I left something under the ice. By my statue!', { promise: 'f3g_tove' }]] },
      { if: '!flag f_hearth_lit', fact: 'f3s_hearth=dying',
        say: [["Seventy years I've kept this fire. Never let it go out once. Well. Once. I was nine. There was a sneeze.", 'Seventy years I kept this fire. Once I sneezed.'],
          ["Come on, old girl. Just one more night. Just one more.", 'Come on, old girl. One more night.'],
          ['The north remembers Ember. We put a flower on the Hearth every Lantern Day. Your Lantern Day. We just never knew why.', 'We put a flower on the fire every Lantern Day.']] },
      { if: 'flag f_hearth_lit', fact: 'f3s_hearth=blue',
        say: [["Look at her. Blue and gold. She hasn't burned like this since I was a girl. I keep laughing at nothing.", 'Look at her. Blue and gold! I keep laughing.'],
          ["Don't touch the Hearth with your bare claws. Oh, you're an Emberblood. Touch away.", "Don't touch the fire. Oh, you're a dragon. Go on."],
          ['The north remembers Ember. We put a flower on the Hearth every Lantern Day. Your Lantern Day. We just never knew why.', 'We put a flower on the fire every Lantern Day.']] },
      { bark: true, if: '!flag f_hearth_lit', fact: 'f3s_hearth=dying', say: [['There, there, old girl. There, there.', 'There, there, old girl.'], ['Come on, old girl. One more night.', 'One more night, old girl.']] },
      { bark: true, if: 'flag f_hearth_lit', fact: 'f3s_hearth=blue', say: ['Burn, old girl. Burn blue.', 'Burn blue, old girl.'] },
    ],

    f_brann: [
      // the small mystery what_knights: Brann's missing patrol (clue f3_brann_list); x2_people's own "Is anyone missing?"
      // option shows only while Warm Hands is counting, so this one waits then, and the next line gives the clue after it
      { if: 'solved what_knights', once: true, scene: 'a3p_plume' },
      { if: 'flag f_brann_list !clue f3_brann_list', once: true, then: ['clue f3_brann_list'],
        say: ["Sir Knut's patrol! Six Hearthwardens with blue plumes, gone up the Dreadmoor. Not one came home! Not even a note!", "Knut's patrol of six never came home!"] },
      { if: 'stage>=f_hearth !flag f_brann_list !quest f_warm active', option: ['Is anyone missing from the town?', 'Is anyone missing?'],
        then: ['set f_brann_list', 'clue f3_brann_list'],
        say: [['f_brann', 'Two of my Hearthwardens froze at their posts! One at each gate! And Sir Knut went up to guard the Dreadmoor! With his whole patrol!', 'Two guards froze! Knut took his patrol to the moor!'],
          ['f_brann', 'Six Hearthwardens with blue plumes! Not one came home! Not even a note! Also the milkman. The milkman is a separate problem.', 'Six blue plumes. None came home!']] },
      // f_juniper starts here (x2_people's own option needs the old quest table)
      { if: 'stage>=f_kindle !quest f_juniper started !flag f_juniper_found', option: ['Have you seen a girl with a map case?', 'Seen a girl with maps?'],
        then: ['quest start f_juniper'], end: true,
        say: [['f_brann', "The map girl? Went out on the Shiversea floes last week! On FOOT! I said, miss, the ice moves! She said, then I'll map it moving!", 'She walked out on the sea ice! On FOOT!'],
          ['f_brann', 'Out past Rimeholm, where the sea is all floes! Bring her back before her boots freeze! Brave! Or a moth! Probably brave!', 'Past Rimeholm, on the ice! Bring her back!', { ref: 'f3s_floes' }]] },
      // (Rowan, the freed Rime Knight by the West Gate, says it himself and gives the same clue; Brann tells it to a player
      // who comes to him first, or plays on an engine without data people)
      { if: 'flag f_freed_n>=1 !clue f3_freed_knight', once: true, then: ['clue f3_freed_knight'],
        say: [['f_brann', 'One of my lads just walked in through the West Gate! Blue to the ears! Asking for ME! Rowan, of Sir Knut\'s patrol!', 'One of my lads came home! Rowan!'],
          ['f_brann', 'He says he was WALKING. For weeks. In armor made of ice. Walking for HER, and he could not stop! Then a dragon breathed on him.', 'He walked in ice armor for HER. Then you thawed him!']] },
      { if: 'flag f_hush_done solved what_knights', once: true, fact: 'f3s_hush=gone',
        say: ['Two of my lads are guarding the Dreadgate now! The rest are eating. They have a month of lunches to catch up on.', 'My lads guard the Dreadgate now!'] },
      // (A3a's G.choices.f3_moth: what Ash said at the West Gate when Brann asked "are you a moth?")
      { if: 'flag f_hush_done choice f3_moth=moth', once: true, fact: 'f3s_hush=gone',
        say: ['The great white moth is gone, and good riddance! From now on you are the ONLY moth allowed in Hearthold, Ash. Do not tell anyone.',
          'The big moth is gone! You are the only moth allowed here now.'] },
      { if: 'flag f_northgate', once: true, fact: 'f3s_northgate=open',
        say: ["My boots are STILL full of gate! I'm keeping them! As a trophy!", 'My boots are still full of gate!'] },
      { if: '!flag f_northgate', fact: 'f3s_northgate=frozen',
        say: [['I am NOT afraid of moths! I simply respect them from a distance! A large distance! Indoors!', 'I am NOT scared of moths! I just stay far away!'],
          ["My beard has icicles! I'm keeping them! They're intimidating!", 'My beard has icicles! They look tough!'],
          ['Gunnar licked the North Gate again! We are working on it!', 'Gunnar licked the gate again!']] },
      { say: [['I am NOT afraid of moths! I simply respect them from a distance! A large distance! Indoors!', 'I am NOT scared of moths! I just stay far away!'],
        ["My beard has icicles! I'm keeping them! They're intimidating!", 'My beard has icicles! They look tough!'],
        ['Hearthwardens never retreat! We advance backwards! Carefully!', 'We never retreat! We go backwards!']] },
      { bark: true, if: '!flag f_hush_done', fact: 'f3s_hush=loose', say: ["Is that flapping in my helmet? NO! It's my heart! Beating BRAVELY!", "Something's flapping! Oh. It's my heart."] },
      { bark: true, say: ["Hearthwardens! Stand up straight! ...Gunnar, that's a snowman.", "Stand up straight! Gunnar, that's a snowman."] },
    ],

    f3_rowan: [
      { if: '!clue f3_freed_knight', once: true, scene: 'a3p_rowan', then: ['clue f3_freed_knight'] },
      { if: 'solved what_knights',
        say: [['Captain Brann says we are heroes. We were icicles. But heroic ones.', 'We were icicles. Heroic ones.'],
          ['I have eaten three lunches. I am catching up.', 'I have had three lunches.']] },
      { say: [['Every time I close my eyes I hear HER humming. I am keeping my eyes open. Forever, probably.', 'I hear her humming. I keep my eyes open.'],
        ['There are more of us up there. In the ice armor. Melt them, please. Gently.', 'More of us are up there. Melt them!']] },
      { bark: true, say: ['Brr. Still cold in my ears.', 'Brr. Cold ears.'] },
    ],
    f3_patrol_a: [
      { ref: 'f3s_dreadgate', say: ["Sir Knut's patrol, on guard! Nobody gets frozen on OUR watch. Not again.", 'On guard! Nobody freezes on our watch!'] },
    ],
    f3_patrol_b: [
      { ref: 'f3s_dreadgate', say: ["Captain Brann said stand here and look brave. I'm very good at the standing part.", 'I stand here and look brave!'] },
    ],

    f_toastwhistle: [
      { if: 'quest f_warm done', once: true,
        say: ['Twelve people! Warm! And a medal ceremony! I have never been this fine. This is what fine actually feels like.', 'Twelve warm people and a medal! THIS is fine!'] },
      { if: 'quest f_warm active !flag f_warm12',
        say: ['Every frozen person you warm counts! Pim\'s cocoa is on the town! Pim does not know yet!', 'Every person you thaw counts!'] },
      { if: 'choice f_glaciar_home=stay', fact: 'f3s_glaciar=free',
        say: ["The Snow Mother lives on our mountain now! I gave her the key to the city. She froze it solid. I've hung it over my door.", 'I gave the Snow Mother our key. She froze it.'] },
      { if: '!flag f_hearth_lit', fact: 'f3s_hearth=dying',
        say: [['Everything is fine! The Hearth is fine! The snow is fine! I am fine! Why is my voice so high?', 'Everything is fine! Why is my voice so high?'],
          ["I've ordered the winter to stop. In writing. It has not replied.", 'I told winter to stop. No reply.']] },
      { if: 'flag f_hearth_lit', fact: 'f3s_hearth=blue',
        say: [['The Hearth is blue! Is blue fine? Blue is fine. Everything is FINE.', 'The Hearth is blue! Blue is fine!'],
          ["I wrote to the winter again. Still no reply. Between you and me, the Hearth did more than my letters.", 'Still no reply from the winter. The Hearth helped more.']] },
      { bark: true, say: ['Fine! Fine. Fine fine fine.', 'Fine! Fine. Fine.'] },
    ],

    f_gunnhild: [
      { if: 'quest f_forge done', once: true,
        say: ["My forge has been hot every day since. I wrote your mother a letter about it. Four pages. I haven't sent it.", 'My forge is hot! I wrote your mom. I did not send it.'] },
      { if: 'quest f_forge active flag f_forge_lit !item f_starfrost', fact: 'f3s_forge=lit',
        say: ['Starfrost! Blue ore. It grows where fire meets frost. Old bones in the Stonehorn hills, I hear. Knock hard.', 'Bring blue starfrost. Knock on old bones!'] },
      { if: '!flag f_forge_lit', fact: 'f3s_forge=cold',
        say: [["My forge went cold the night the moth came. I still come in every morning and pick up the hammer. Habit.", 'My forge went cold. I still pick up the hammer.'],
          ['Your mother\'s Maren? MAREN? I have her letters on the wall. Well. One letter. It says "no thank you." I framed it.', 'Your mom wrote me "no thank you." I framed it.'],
          ['Northern iron is stubborn. So am I. We get along.', 'Northern iron is stubborn. So am I.']] },
      { if: 'flag f_forge_lit', fact: 'f3s_forge=lit',
        say: [['Hear that? Most forges roar. Mine purrs.', 'Hear that? My forge purrs.'],
          ['Your mother\'s Maren? MAREN? I have her letters on the wall. Well. One letter. It says "no thank you." I framed it.', 'Your mom wrote me "no thank you." I framed it.'],
          ['Northern iron is stubborn. So am I. We get along.', 'Northern iron is stubborn. So am I.']] },
      { bark: true, if: '!flag f_forge_lit', fact: 'f3s_forge=cold', say: ['Hit a cold anvil, and all it does is hurt your arm.', 'A cold anvil just hurts your arm.'] },
      { bark: true, if: 'flag f_forge_lit', fact: 'f3s_forge=lit', say: ['CLANG! CLANG! Hum hum hum. CLANG!', 'CLANG! CLANG! Hum hum.'] },
    ],

    f_mags: [
      { if: 'quest f_bombs done', once: true,
        say: ['Captain Brann came by to say NO to my fireworks shop. He bought six rockets on the way out.', 'Brann said no to my shop. Then bought six rockets.'] },
      { if: 'quest f_bombs active flag f_bombs_lit !flag f_bombs_test',
        say: ['The Big Boulder! On the old Quarry Road, by the lake! Go! Boom! Report back!', 'The Big Boulder! Go! Boom!'] },
      { if: 'quest f_bombs active item f_powder', say: ['Is that my powder? Bring it here! Gently! Ish!', 'My powder! Bring it here!'] },
      // G5 pointer: Hettie's boulder in Gearhaven (gates_map1.js f3g_hettie)
      { if: 'power bombs !flag f3_satchel', option: ['Anything else need blowing up?', 'Anything to blow up?'],
        say: [['f_mags', 'Ha! My cousin Hettie in Gearhaven has had a boulder sitting on her cellar door for TWELVE years.', 'Cousin Hettie has a boulder on her cellar!'],
          ['f_mags', 'Right behind her workshop. She asks me about it every Lantern Day. Take her a bomb. Take her a BIG one.', 'Behind her workshop. Take a bomb!', { promise: 'f3g_hettie' }]] },
      { if: 'choice c_vesper=friend', once: true,
        say: ['Somebody slid a note under my door, signed with a little moth. It just says "STOP BLOWING THINGS UP." I am framing it.', 'A note signed with a moth: "STOP BLOWING THINGS UP."'] },
      { if: 'choice c_vesper=foe', once: true,
        say: ["The Moth Mask has gone quiet, they say. No more locks picked in Gearhaven. I almost miss her.", 'The Moth Mask is quiet now. I miss her a bit.'] },
      { say: [["Mags Sprocket, Gearhaven's third-best tinker! The other two exploded. Not badly! A little!", "I'm Mags! The other two tinkers exploded. A little!"],
        ["I came north to sell steam heaters. Then winter came. Business has never been better and I've never been colder.", 'I sell heaters. Business is great. I am so cold.'],
        ['I sold the Moth Mask a lock once. She picked it. Then she paid for it. Good manners, that one.', 'I sold the Moth Mask a lock. She paid!']] },
      { bark: true, say: ["Stand back! Further! Further than that! ...Okay, it was a dud. Come back.", 'Stand back! ...It was a dud.'] },
    ],

    f_hilde: [
      { if: 'choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ['The Snow Mother is REAL! And she is your AUNTIE! The snow is falling soft as feathers now.', 'The Snow Mother is real! Your auntie!'] },
      { if: 'flag f_hush_done', once: true, fact: 'f3s_hush=gone',
        say: ['They say the great white moth is gone. I slept with my window open last night. First time in a month.', 'The big moth is gone. I opened my window!'] },
      { if: 'flag f_thaw_f_sigrun', once: true,
        say: ['Sigrun came down from Rimeholm! She tasted my soup and said "salt." Just "salt." From Sigrun, that is a medal.', 'Sigrun said my soup needs salt. From her, that is praise!'] },
      { say: [["Welcome to the Warm Mitten! Beds are soft, soup is hot, and the cat is called Biscuit. Don't sit on Biscuit.", "Soft beds, hot soup. Don't sit on the cat."],
        ["Sigrun in Rimeholm taught me my soup. If she were here she'd say it needs salt. She'd be right.", 'Sigrun taught me my soup. It needs salt.'],
        ["Have some soup. Have some more soup. The chair's had two bowls already.", 'Have some soup! The chair had two bowls.']] },
      { bark: true, say: ["Soup's on! Soup's always on!", "Soup's on!"] },
    ],

    f_eider: [
      { if: 'quest f_song done', once: true,
        say: ["Wren says she's going to come and see the archive herself one day. OUTSIDE. On PURPOSE. I've never been so proud.", 'Wren will visit! Outside! I am so proud.'] },
      // G4 pointer: Ottoline's letter about the frozen Moon Ring (gates_map1.js f3g_ring; the letter is a3g_otto)
      { if: 'flag f_hearth_lit', once: true, then: ['mail a3g_otto'],
        say: ['(whisper) Ash. A crow stopped at my window just now, with a letter for you from the Turning Library in Gearhaven. She went off to find you. Sorry. Letters excite me.', '(whisper) A crow has a letter for you!'] },
      // G2 pointer: the dragons' egg shells on Cinder Mountain's rim (gates_map0.js f3g_eggs)
      { if: 'power windride !flag f3_eggs_open', option: ['What does the archive say about dragons?', 'What about dragons?'],
        say: [['f_eider', '(whisper) The oldest page says two dragon eggs hatched on the rim of the fire mountain, down in Embermere. A red one. And a white one.', 'Two dragon eggs hatched on the fire mountain.'],
          ['f_eider', 'Nobody can climb up there. The rim has no path. Not without a wind to carry you. Shh. Sorry. It is a very exciting page.', 'Nobody can climb there. Only a wind could.', { promise: 'f3g_eggs' }]] },
      // G3 pointer: Iska's stone box under her Ward stone (gates_map0.js f3g_iska)
      { if: 'power pound !flag f3_iska_open', option: ['Any word from Wren?', 'Any word from Wren?'],
        say: [['f_eider', 'Wren says Iska the Warden hid copies of her pages under her own Ward stone, by Emberhollow. Under a cracked flagstone.', 'Iska hid her pages under her Ward stone.'],
          ['f_eider', 'Wren says "stomp." She underlined it so hard the pen went through the page.', 'Wren says "stomp." Underlined.', { promise: 'f3g_iska' }]] },
      { say: [["Shh. Sorry. Not you. The books. They get nervous in the cold.", 'Shh. Not you. The books are nervous.'],
        ['My cousin Wren runs the library in Brindlecross. She writes me every week. She underlines things. Aggressively.', 'Wren writes every week. She underlines a lot.'],
        ['Wren says: "Tell the dragon child to wear a scarf and to stop setting things on fire, in that order."', 'Wren says: wear a scarf. Stop setting fires.']] },
      { bark: true, say: ["(whispering to a book) There, there. Nobody's going to spill cocoa on you.", '(whisper) Nobody will spill on you, book.'] },
    ],

    f_pim: [
      // the what_knights red herring: glacier golems
      { if: 'stage>=f_thaw !clue f3_golem_rumor', once: true, then: ['clue f3_golem_rumor'],
        say: ["Did you see the Rime Knights? Gunnhild says they're made of GLACIER! Walking ice golems! I'd charge them double.", 'Gunnhild says Rime Knights are made of glacier!'] },
      { if: 'flag f_thaw_f_bo', once: true,
        say: ["Little Bo came back for his Sunday cocoa! A month of Sundays! I gave him all of it. He's VERY awake now.", 'Little Bo came back! I gave him a month of cocoa!'] },
      { if: 'choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ["The Snow Mother is REAL! I'm going to sell her iced cocoa. Nobody else up here sells iced cocoa. It's a brand new market!", 'The Snow Mother is real! I will sell her iced cocoa!'] },
      { if: 'flag f_frozen_n>=3',
        say: [["The Mayor's giving away MY cocoa to every thawed person! I'm sending her a bill. A big one. With a drawing.", 'The Mayor gives away my cocoa! I will send a bill!'],
          ['Hot cocoa! Three coins! Two coins if you heat it yourself!', 'Hot cocoa! Three coins!']] },
      { say: [['Hot cocoa! Three coins! Two coins if you heat it yourself!', 'Hot cocoa! Three coins!'],
        ["My cocoa has a secret ingredient. It's more cocoa.", 'My secret is more cocoa.'],
        ["When I grow up I'm going to own every cocoa stand in the north. There's only one. It's this one. So I'm halfway.", 'I will own every cocoa stand. I am halfway!']] },
      { bark: true, say: ['Cocoa! Get your cocoa! Warms you up from the tummy out!', 'Cocoa! Warms your tummy!'] },
    ],

    f_soren: [
      { if: 'quest f_sled done', once: true,
        say: ["I put a little flag where you finished. Elka keeps kicking it over. She says it's an accident. It's not an accident.", 'I put a flag where you won. Elka kicks it.'] },
      { if: 'stage>=f_gap !quest f_sled started',
        say: ["Nobody has ever sledded from the Windscour all the way down to my hill in one go. Ask the girl in the red hat. She's been asking everybody.", 'Nobody ever sledded here from the Windscour. Ask Elka.'] },
      { say: [["Forty years I've sledded this hill. I still scream all the way down.", 'Forty years on this hill. I still scream.'],
        ['Some girl from the south came up the pass on a sled. A SLED. Up a MOUNTAIN. I like her.', 'A girl sledded UP the mountain. I like her.'],
        ['Wax the runners, lean into the turns, and never sled with your mouth open. I learned that last one the hard way.', 'Wax the runners. Lean in. Keep your mouth shut!']] },
      { bark: true, say: ["Wheee... sorry. That's the monk's word. Mine is \"whoosh.\"", 'Whoosh!'] },
    ],

    f_fergus: [
      { say: [['MITTENS! Warm mittens! Left ones, right ones, and one very confused middle one!', 'MITTENS! Left ones and right ones!'],
        ["I stood on that road for a month. My feet are still asleep. They're snoring.", 'I stood frozen for a month. My feet still sleep.'],
        ['A dragon with mittens. Now THAT would be good for business.', 'A dragon in mittens. Great for business!']] },
      { bark: true, say: ['MITTENS! Warm mittens! Mittens for paws, claws and hands!', 'MITTENS! For paws and claws!'] },
    ],
    f_sigrid: [
      { if: 'quest f_juniper done', once: true,
        say: ["Juniper put the inside of the Glacier Maze on her map at last. I drew in the warnings myself, in red.", 'I drew the maze inside on her map. In red.'] },
      { say: [['I went into the Glacier Maze to find the furnace key. I found a block of ice instead. I was the block of ice.', 'I looked for a key. I turned into ice instead.'],
        ["Next time I explore a glacier, I'm taking a sandwich, and a friend who breathes fire.", 'Next time: a sandwich, and a fire friend.']] },
    ],
    f_hjalmar: [
      { say: [["I froze mid-sneeze. I've finished the sneeze now. It was worth the wait.", 'I froze mid-sneeze. I finished it now.'],
        ['ACHOO! Sorry. That one was left over.', 'ACHOO! Sorry. A spare one.']] },
      { bark: true, say: ['ACHOO!', 'ACHOO!'] },
    ],

    // ---------------------------------------------------------------- Rimeholm
    f_ylva: [
      // f_rime's offer (A3a's thaw scene may start the quest first)
      { if: 'flag f_ylva !quest f_rime started', option: ['Who else is still frozen?', 'Who else is frozen?'], scene: 'rm_offer' },
      { if: 'quest f_rime done', once: true, fact: 'f3s_rimeholm=warm',
        say: ["Everyone's thawed, dear. Even old Rasmus. He's started making puns again. I almost miss the ice.", 'Everyone is thawed. Rasmus makes puns again.'] },
      { if: 'choice f_hush=scarf', once: true,
        say: ["You gave my scarf to a MOTH? ...Good. I'll knit you another one. Longer.", "You gave my scarf to a moth? Good! I'll knit another."] },
      { if: 'quest f_rime active !quest f_rime done', fact: 'f3s_rimeholm=frozen',
        say: ['Start with whoever is shouting, dear. Tollef is always shouting. Even frozen, I think.', 'Start with the shouty one, dear.'] },
      { say: [["I wasn't frozen, dear. I was resting my eyes.", "I wasn't frozen, dear. I was resting my eyes."],
        ["I knitted the whole time I was frozen. In my head. It's a very long scarf.", 'I knitted in my head. A very long scarf.'],
        ["I've knitted a scarf for every child born in Rimeholm for sixty years. Yours is going to be long, dear. You've a long tail.", 'I knit every child a scarf. Yours is long.']] },
      { bark: true, say: ['Knit one, purl one. Knit one, purl one. Oh, bother. Dropped one.', 'Knit one, purl one. Oops.'] },
    ],
    f_tollef: [
      { if: 'flag f_v1', once: true, say: ['I SANG THE FIRST VERSE! FROM THE BELL! THE FISH CAME UP TO LISTEN! I THINK!', 'I SANG THE FIRST VERSE! THE FISH LISTENED!'] },
      { if: 'quest f_song active !flag f_v1',
        say: ["THE BELL KNOWS THE FIRST VERSE! CLIMB UP TO THE TOP AND I'LL RING IT FROM DOWN HERE! LOUDLY!", 'CLIMB UP TO THE BELL! I WILL RING IT!'] },
      { say: [["WHAT? OH! HELLO! I CAN'T HEAR YOU, I'VE BEEN STANDING NEXT TO A BELL FOR FORTY YEARS!", "WHAT? HELLO! I CAN'T HEAR! TOO MANY BELLS!"],
        ["THE BELL HAS A SONG! THE SNOW MOTHER'S SONG! I ONLY KNOW THE FIRST BIT!", 'THE BELL HAS A SONG! I KNOW THE FIRST BIT!'],
        ['I RING IT EVERY MORNING! THE FISH HATE IT!', 'I RING IT EVERY MORNING! FISH HATE IT!']] },
      { bark: true, say: ['WHAT? WHO SAID THAT? NOBODY? HELLO, NOBODY!', 'WHAT? WHO SAID THAT?'] },
    ],
    f_saga: [
      { if: 'quest lakeking done', once: true,
        say: ["You caught the Lake King? The LAKE KING? Dad says that's not possible. Dad's wrong a lot.", 'You caught the Lake King? Dad says no way!'] },
      { say: [['I had a bite! A big one! ...It got away. A month ago. Probably.', 'I had a big bite! It got away. A month ago.'],
        ['My dad taught me to fish. Dell Fisk taught HIM. Dell is famous up here. Mostly for losing boats.', 'Dell taught my dad to fish. Dell loses boats.'],
        ["Race you to the end of the quay. Mind the holes. I won't.", "Race you! Mind the holes. I won't."]] },
    ],
    f_sigrun: [
      { if: 'quest f_mumble done', once: true,
        say: ['I heard that yeti roar from here. My soup did that. Tell everyone. Tell Hilde twice.', 'I heard that yeti roar! My soup did that!'] },
      { say: [["My soup! My SOUP! It's a soup-sicle. ...Actually, that's not bad. Lick it.", 'My soup is a soup-sicle! Lick it.'],
        ['Hilde at the Warm Mitten stole my soup recipe. I taught it to her. Same thing.', 'Hilde stole my soup. I taught her.'],
        ["Eat. You're all tail and no supper.", "Eat! You're all tail."]] },
      { bark: true, say: ['Eat. Eat. Have you eaten? Eat.', 'Eat! Have you eaten? Eat!'] },
    ],
    f_bo: [
      { if: 'choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ['The Snow Mother is your AUNTIE? Can Steve meet her? Steve is a snowball. She will like him.', 'Your auntie is the Snow Mother? Can Steve meet her?'] },
      { say: [["...THROW! Ha! Got you! ...Where did everyone go? Why are you a dragon?", 'THROW! Got you! Why are you a dragon?'],
        ["I've been holding this snowball for a MONTH. I'm keeping it. Forever. His name is Steve.", 'I kept this snowball a month. He is Steve.'],
        ["Steve says hi. That was me doing his voice. Hi!", "Steve says hi! I did his voice."]] },
      { bark: true, say: ['Steve wants to go sledding. Steve always wants to go sledding.', 'Steve wants to go sledding.'] },
    ],
    f_nils: [
      { if: 'quest duchess done', once: true,
        say: ['A goat in the south called Duchess? Is she single? Nisse is asking. Nisse asks about every goat.', 'A goat called Duchess? Nisse wants to know.'] },
      { say: [["Nisse! Don't headbutt the dragon. DON'T HEADBUTT THE...", "Nisse! Don't headbutt the dragon!"],
        ['She likes you. That was a friendly headbutt.', 'She likes you. A friendly headbutt.'],
        ['Goats on a sea-stack. Seemed like a good idea. Then the bridge fell. Still a good idea, says Nisse.', 'Goats on a rock in the sea. Nisse likes it.']] },
      { bark: true, say: ['Nisse, no. Nisse. NISSE. ...She ate my hat.', 'Nisse, no! She ate my hat.'] },
    ],
    f_nisse: [
      { say: ['Meh.', 'Meh.'] },
    ],
    f_oskar: [
      { if: 'flag f_hush_done', once: true, fact: 'f3s_hush=gone',
        say: ['The great white moth is gone, they say. So the post goes through again. Late, but it goes.', 'The moth is gone. The post goes through!'] },
      { if: '!flag f_letter_brynja !quest f_song done',
        say: ["I have a letter for Brynja in Hearthold. An old one. A snowflake stamp. I don't read the post. I only read the outside.", 'I have an old letter for Brynja.'] },
      { say: [["I've never been late. Not once. Thirty years. And now: a MONTH. I'm going to write myself a strongly worded letter.", 'Thirty years, never late. Now a MONTH late!'],
        ['Rain or snow or moths, the post goes through. Eventually.', 'The post always gets there. One day.']] },
      { bark: true, say: ['Late. Late. A month late. Late.', 'Late. A month late.'] },
    ],
    f_rasmus: [
      { if: 'quest f_rime done', once: true,
        say: ["Bluefire suits you, child. Hmm. Don't melt the village. We just got it back.", "Bluefire suits you. Don't melt the village."] },
      { say: [["I mended Rimeholm's bell once, the year it cracked right through. Still rings sweet. Hmm. Loud, too.", 'I mended the bell once. It still rings sweet.'],
        ["A forge is a hearth that went to work. Hmm. Hmm. That's a good one. I'll use it again.", 'A forge is a hearth with a job. Good one.'],
        ["Gunnhild, in Hearthold. Best hands in the north. Too fast with them. Hmm. She'll learn.", 'Gunnhild has the best hands. Too fast.']] },
      { bark: true, say: ['Hmm. Hmmm. Hmm.', 'Hmm. Hmm.'] },
    ],

    // ---------------------------------------------------------------- the wild north
    f_hask: [
      { if: 'quest f_dogs done', once: true,
        say: ['Nine dogs. Five dog houses. Toast bit me hello. Hrm. Good to have them home.', 'Nine dogs home. Toast bit me. Good.'] },
      { if: 'quest f_mumble done', once: true,
        say: ['Did you hear that roar? The whole forest shook. Hrm. Good lad, that yeti.', 'Did you hear that roar? Good lad.'] },
      { if: '!quest f_dogs done',
        say: [["Hrm. Pup. You look like you've never been cold in your life.", "Hrm. Pup. You've never been cold."],
          ['Ulf at the Lodge? We trade furs. He thinks sheep are better than dogs. He is wrong. Do not tell him I said his name nicely.', 'Ulf thinks sheep beat dogs. He is wrong.']] },
      { say: [['Ulf at the Lodge? We trade furs. He thinks sheep are better than dogs. He is wrong. Do not tell him I said his name nicely.', 'Ulf thinks sheep beat dogs. He is wrong.'],
        ['Lost my eye to a bear. Bear lost a tooth to me. We both went home. Hrm. Fair fight.', 'A bear took my eye. I took its tooth.']] },
      { bark: true, if: '!quest f_dogs done', say: ['Hrm. Too quiet. A camp should have barking.', 'Too quiet. A camp needs barking.'] },
      { bark: true, if: 'quest f_dogs done', say: ['Pepper. PEPPER. Drop the boot.', 'Pepper! Drop the boot!'] },
    ],
    f_pennant: [
      { if: 'flag f_v2', once: true,
        say: ['You made the Singing Stone sing! I will tell the other monks. By postcard. Which will blow away. Wheee.', 'You made the stone sing! Wheee!'] },
      { say: [["I've lived on this kite since the moths came. My feet have forgotten what ground is. Wheee. Sorry. Every time.", 'I live on this kite now. Wheee! Sorry.'],
        ['The other monks blew away. On purpose! To ride the winds of the far south. They send postcards. The postcards blow away.', 'The other monks flew south. Postcards blow away.'],
        ["If you ever feel lost, lick a finger and hold it up. The wind will tell you. It will mostly tell you it's cold.", 'Lost? Lick a finger. The wind will tell you.']] },
      { bark: true, say: ['Wheeee!', 'Wheeee!'] },
    ],
    f_mumble: [
      { if: 'quest f_mumble done',
        say: [['(ROOOAR!) ...Sorry. I am practicing. Not sorry.', '(ROOOAR!) Not sorry!'],
          ['Snarl brings me fish now. Every morning. He is very polite. He is very scared.', 'Snarl brings me fish now. Politely.']] },
      { if: 'quest f_mumble active', say: ['(squeak) ...I am ready to try. I think. (squeak)', '(squeak) I am ready. I think.'] },
      { say: [['(very quietly) ...hello. Sorry. Hello.', '(very quietly) ...hello. Sorry.'], ['(squeak)', '(squeak)']] },
    ],
    f_greymane: [
      { say: ['(Greymane thumps his tail once. Snow flies everywhere.)', '(Greymane thumps his tail. Snow flies.)'] },
    ],
  },
})
