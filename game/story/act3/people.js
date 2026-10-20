// game/story/act3/people.js (A3S; talk v11 by J11): everyday talk for every Act III person, in Frostreach (map 2) and at
// home in Embermere (map 0): Mom at the forge, Ulf and Brisket at Frostpine Lodge. The how-to is v11/J1_NOTES.md; Mabel,
// Hal and Maren in act1/people.js are the pattern.
// How it plays:
//  - The first matching entry with a say (top to bottom; the chapter files load before this one) is the person's
//    greeting, the opener. Its re: are what Ash can say back to that exact line. Once he answers, the opener steps
//    aside for the next one down the list. An opener heard today is not said again: the person's idle line instead.
//  - ask: entries are menu topics with real labels, each live only while its if holds (up to three show).
//  - then: ['said key'] remembers what Ash answered; if: 'said key' reads it later, here or in another person's talk.
//  - Order in each list: one-time callbacks (once) first, then the openers (latest events first, so the news comes
//    before the old business), then the moment (the old TALK chat, asked when the question would really come up), the
//    state lines, topics, idle, bye, and the barks.
// Nobody up here has met Ash before this act. They know what Brann shouts from the West Gate tower, what Mags's copy
// of Penny's paper says, and what Ulf, Wren and Gunnhild's letters told them. Rimeholm was frozen: its people know only
// that a dragon kid thawed them.
// The chapter files' own lines win in their stages (Brann at f_pass, f_hearth and f_maze; Brynja at f_hearth, f_maze
// and f_kindle; Ulf at f_pass): they are directions, and the openers here take over from there.
// World facts that change carry `fact` and are conditioned on it (registry/map2_s.js): f3s_hearth dying|blue,
// f3s_northgate frozen|open, f3s_hush loose|gone, f3s_glaciar spell|free|asleep, f3s_forge cold|lit, f3s_rimeholm
// frozen|warm. The small mystery what_knights (places_map2.js) is asked about here: Brann's missing patrol, Pim's
// herring, Rowan. Each earlier-map gate (gates_map0.js, gates_map1.js) has a pointer here, tagged with `promise`.
// Quest offers are the quests' own first steps (talk <giver>); people.js loads before the q_ files.
// Act III stages: f_snow, f_pass, f_hearth, f_maze, f_kindle, f_thaw, f_sky, f_gap, f_deep, f_dreadgate, f_dread,
// f_glaciar (f_done is set by the night in Hearthold).
// said keys set and read here: hilde_sigrun, gunnhild_send, rasmus_slow, brann_still, brann_look, toast_brave,
// tollef_bell, ylva_wave, hask_dogs, bo_pim, ulf_supper, elka_supper, juniper_rook, pennant_hum, brynja_small_fire,
// mom_glee. Read from Act I: hal_fire_soup (Gunnhild), ulf_sheep (Hask).
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
      desc: ["Captain Brann's spare plume, Hearthwarden blue. Wear it with your chin up.", 'Brann\'s blue plume. Chin up!'] },
  },

  scene: {
    a3p_plume: [
      ['f_brann', 'My patrol! Frozen into moth-frost armor, marching for her! That is why they never came home!', 'My patrol! Frozen in ice armor!'],
      ['f_brann', 'And you melted them free. With your face. Thank you, Ash. From the bottom of my beard.', 'And you melted them free. Thank you!'],
      ['f_brann', 'Here. My spare plume. Hearthwarden blue. You are one of us now. Wear it with your chin up.', 'My spare plume. You are one of us now!',
        { do: ['give f3_plume', 'hat f3_plume'] }],
      ['f_brann', 'Hearthwardens! Salute! ...Gunnar, that is still a snowman.', 'Salute! Gunnar, that is a snowman.', { re: [
        { t: ['I said I would look for them.', 'I said I would look.'], if: 'said brann_look', tone: 'kind', f: 0.5,
          say: [['f_brann', 'You did! And you looked, and you found them! In ice, but found! I am going to cry into my helmet.', 'You did, and you found them! I will cry now.']] },
        { t: ['Does the plume suit me?', 'Does the plume suit me?'],
          say: [['f_brann', 'Chin up. Higher. There! Now you look like a Hearthwarden. A short one with a tail.', 'Chin up. Higher. There! A real Hearthwarden.']] },
        { t: ['Hello, Gunnar.', 'Hello, Gunnar.'], tone: 'silly',
          say: [['f_brann', 'He cannot hear you. He is a snowman. ...We are working on it.', 'He is a snowman. We are working on it.']] },
      ] }],
    ],
    a3p_rowan: [
      ['f3_rowan', 'You! You\'re the dragon who breathed on me! I was up on the Dreadmoor with Sir Knut. Purple snow came down, and then...', 'You thawed me! I was on the moor. Purple snow fell...'],
      ['f3_rowan', 'Then I was walking. In armor made of ice. Walking for her. I could not stop.', 'Then I walked in ice armor. I could not stop.'],
      ['f3_rowan', 'Then you breathed on me, and I woke up in a puddle. Thank you. Is there any lunch?', 'Then you breathed on me. Thank you!', { re: [
        { t: ['Hilde has soup at the Warm Mitten.', 'Hilde has soup.'],
          say: [['f3_rowan', 'Soup! I will walk there. On my own feet, this time, and nobody else\'s say-so.', 'Soup! I will walk there. My own way.']] },
        { t: ['Captain Brann has been so worried.', 'Brann was worried.'], tone: 'kind', f: 0.5,
          say: [['f3_rowan', 'The Captain worries at the top of his voice. I had better go and let him shout at me. He will like that.', 'Then I will go and let him shout. He will like that.']] },
      ] }],
    ],
  },

  talk: {
    // ================================================================ Hearthold
    // ---------------------------------------------------------------- Old Brynja, Hearthkeeper of the Great Hearth
    // Seventy years by one fire; warm, bossy, calls Ash "child" and the Hearth "old girl". She said "a breath for
    // candles" and took it back at the WHOOMPH. The chapters own her lines up to the lighting (directions).
    f_brynja: [
      { if: 'quest f_song done', once: true,
        say: ["I sing her the Snow Mother's Song every night now. The whole song. She crackles along on the high notes.", 'I sing her the whole song now. She crackles along.'],
        re: [
          { t: ['Does she know the words?', 'Does she know the words?'],
            say: [['f_brynja', 'She knows the tune. Fires never bother with words. Neither did my mother, come to that.', 'She knows the tune. Fires skip the words.']] },
          { t: ['Eider hums along. I heard him.', 'Eider hums along.'],
            say: [['f_brynja', 'Behind his archive door, the low part. He thinks I can\'t hear him. I sing louder so he won\'t stop.', 'He thinks I can\'t hear. I sing louder so he keeps on.']] },
        ] },
      { if: 'choice f_glaciar=free choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ['She came down off the mountain and breathed on my Hearth. Blue and white for a whole hour. I cried. Do not tell Brann.', 'She breathed on my Hearth. I cried. Shh.'],
        re: [
          { t: ["She's my auntie, you know.", "She's my auntie."], tone: 'kind', f: 0.5,
            say: [['f_brynja', 'I worked that out when she pinched my cheek like I was nine. Your family pinches, child.', 'She pinched my cheek. Your family pinches.']] },
          { t: ["I won't tell Brann.", "I won't tell Brann."],
            say: [['f_brynja', 'Good. He cried louder than I did. Into his helmet. It rang.', 'Good. He cried louder. Into his helmet.']] },
        ] },
      // after the winter: she remembers what Ash told her about his own fire
      { if: 'flag f_done said brynja_small_fire', once: true,
        say: ['You told me your fire goes small when you\'re scared. Up on that mountain. Did it?', 'Your fire goes small when scared. Did it, up there?'],
        re: [
          { t: ['A bit. Then it came back.', 'A bit. Then it came back.'], tone: 'kind', f: 0.5,
            say: [['f_brynja', 'Then it\'s a good fire. Small, then back. That\'s all the old girl ever did.', 'Then it is a good fire. Like the old girl.']] },
          { t: ['No. It went blue.', 'No. It went blue.'], tone: 'brave',
            say: [['f_brynja', 'Blue. Hark at him. Still a breath for candles? ...No, child. I know. I know.', 'Blue! Still a breath for candles? No. I know.']] },
        ] },
      { if: 'flag f_done',
        say: ['The snow falls soft now, like flour off a board. The old girl hardly has to try. I keep her high anyway, out of habit.', 'The snow is soft now. I keep her high anyway.'],
        re: [
          { t: ['Will you ever let her go out?', 'Will she ever go out?'],
            say: [['f_brynja', 'When I\'m done keeping fires, Pim says she\'ll keep her. Pim will charge her rent.', 'When I am done, Pim will keep her. For rent.']] },
          { t: ['Can I bring Mom to see her?', 'Can Mom see her?'], tone: 'kind', f: 0.5,
            say: [['f_brynja', 'Bring her. A smith ought to see a fire like this once. She can tell me how to stack the logs, and I won\'t listen.', 'Bring her. She can boss me about the logs.']] },
        ] },
      // the white moth is gone (f_hush)
      { if: 'flag f_hush_done !flag f_done', once: true, fact: 'f3s_hush=gone',
        say: ['She jumped a foot last night, the old girl. Sparks all over the square. Brann says the white moth is gone.', 'The fire jumped last night. The white moth is gone.'],
        re: [
          { t: ['I gave the moth a scarf.', 'I gave her a scarf.'], if: 'choice f_hush=scarf',
            say: [['f_brynja', 'A scarf. For a moth that froze a whole village. ...Your mother raised you soft, child. Good.', 'A scarf! Your mom raised you soft. Good.']] },
          { t: ['I sent her home to her mother.', 'I sent her home.'], if: 'choice f_hush=shoo',
            say: [['f_brynja', 'Home. Then somebody is waiting for her somewhere. I hope it\'s somebody warm.', 'Then someone waits for her. I hope they are warm.']] },
          { t: ['The mountain is next.', 'The mountain is next.'], tone: 'brave',
            say: [['f_brynja', 'Then take the old girl with you. In here. ...In you, child. I don\'t mean a coal in your pocket.', 'Take her with you. In you. Not a coal.']] },
        ] },
      // her moment (the old chat), the first quiet evening by the lit Hearth
      { if: 'flag f_hearth_lit !flag f_done', fact: 'f3s_hearth=blue',
        say: ["Sit with us a minute, child. She's warm enough to sit by now. Tell me something. Do you think a fire has feelings?", 'Sit with us. Does a fire have feelings?'],
        re: [
          { t: ['Yours does. She sulked for a month.', 'Yours does. She sulked.'], f: 0.75,
            say: [['f_brynja', 'She did sulk. Seventy years, and that was the first time. I sulked right back at her.', 'She did. The first time in seventy years. I sulked back.']] },
          { t: ["Mine goes small when I'm scared.", "Mine shrinks when I'm scared."], tone: 'kind', f: 1, then: ['said brynja_small_fire'],
            say: [['f_brynja', 'Then it knows you. That\'s a good fire. A fire that never goes small burns the house down.', 'Then it knows you. A fire that never shrinks burns houses.']] },
          { t: ['Only when somebody pokes it.', 'Only when poked.'], tone: 'silly',
            say: [['f_brynja', 'Ha. That is why my poker has such a long handle.', 'Ha. That is why my poker is long.']] },
        ] },
      // while the storm sits on the mountain
      { if: 'flag f_hearth_lit !flag f_hush_done', fact: 'f3s_hearth=blue',
        say: ["She's holding. Blue at the bottom, gold at the top. But every night she leans toward that mountain, like she's listening.", 'She holds. But she leans toward the mountain.'],
        re: [
          { t: ['Something up there is breathing.', 'Something up there breathes.'], if: 'clue f3_spyglass',
            say: [['f_brynja', 'Then she hears it breathe. Fires know other fires, child. Even cold ones.', 'She hears it. Fires know other fires.']] },
          { t: ['Rimeholm froze. All of it.', 'Rimeholm froze. All of it.'], if: 'clue f3_alarm_rope',
            say: [['f_brynja', 'Sigrun too, then. ...Go and thaw them, child. I\'ll keep her high, so they have somewhere warm to come to.', 'Then thaw them. I will keep the fire high for them.']] },
          { t: ["I'm going up there soon.", "I'm going up soon."], tone: 'brave', f: 0.5,
            say: [['f_brynja', 'Then go with your mouth shut against the wind, and come back with it open. I want to hear everything.', 'Shut your mouth in the wind. Then come and tell me all.']] },
        ] },
      // the Snow Mother's Song: Ember's friend up here (G1 pointer: Tove's old cold post at Frostpine, gates_map0.js f3g_tove)
      { if: 'stage>=f_kindle !flag f3_tove_seen', option: ['Did Ember have friends up here?', 'Did Ember have friends here?'],
        say: [['f_brynja', 'The archive says a spirit kept the cold post at the foot of the old pass, long ago, while Ember kept the fire. A spirit called Tove.', 'A spirit called Tove kept the cold post.'],
          ['tove', "I did. And I left something under the ice there, by my old statue at Frostpine. Go and melt it. I'm not saying what.", 'I left something under the ice. By my statue!', { promise: 'f3g_tove' }]] },
      // the lit Hearth, for the days in between
      { if: 'flag f_hearth_lit', fact: 'f3s_hearth=blue',
        say: [["Look at her. Blue and gold. She hasn't burned like this since I was a girl. I keep laughing at nothing.", 'Look at her. Blue and gold! I keep laughing.'],
          ["Don't touch the Hearth with your bare claws. Oh, you're the fire one. Touch away.", "Don't touch the fire. Oh, you're the fire one. Go on."]] },
      // topics
      { ask: ['How long have you kept the fire?', 'How long have you kept it?'],
        say: ['Seventy years, and my mother before me, all the way back to the night it was lit. It went out once. I was nine. There was a sneeze.', 'Seventy years. It went out once. I was nine. I sneezed.'] },
      { ask: ['Why a flower on Lantern Day?', 'Why a flower on Lantern Day?'], if: 'flag f3_brynja',
        say: ['Every Lantern Day we lay one flower on the Hearth. Your Lantern Day, the one in your valley. Nobody here remembered why. I think I know now.', 'We lay a flower on Lantern Day. Now I know why.'] },
      { ask: ['Did you know the Snow Mother was a dragon?', 'Did you know she was a dragon?'], if: 'solved snow_mother',
        say: ['My mother said the Hearth was lit by a girl with horns and a lady made of snow. I thought she meant a snowman. Seventy years, I thought that.', 'Mom said a snow lady lit it. I thought: a snowman.'] },
      { idle: [['Sit by her a minute. What is it, child?', 'Sit by her. What is it?'], ['Mind your tail by the coals.', 'Mind your tail.']] },
      { bye: [['Go on. Come back warm.', 'Come back warm.'], ['Off you go, child. She likes it when you visit.', 'She likes your visits.']] },
      { bark: true, if: '!flag f_hearth_lit', fact: 'f3s_hearth=dying', say: [['There, there, old girl. There, there.', 'There, there, old girl.'], ['Come on, old girl. One more night.', 'One more night, old girl.']] },
      { bark: true, if: 'flag f_hearth_lit', fact: 'f3s_hearth=blue', say: ['Burn, old girl. Burn blue.', 'Burn blue, old girl.'] },
    ],

    // ---------------------------------------------------------------- Captain Brann Stoutmitt, the Hearthwardens
    // Loud, brave and terrified of moths; shouts in exclamation marks, not capitals. Calls Ash "Horns" (or moth, if
    // Ash said he was one at the West Gate: G.choices.f3_moth). (v12) Never "Emberblood": nobody up here knows the word. His grief is Sir Knut's patrol, six blue plumes who never
    // came home (the small mystery what_knights). The chapters own his lines at f_pass, f_hearth and f_maze.
    f_brann: [
      // the small mystery what_knights: Brann's missing patrol (clue f3_brann_list); x2_people's own "Is anyone missing?"
      // option shows only while Warm Hands is counting, so this one waits then, and the next line gives the clue after it
      { if: 'solved what_knights', once: true, scene: 'a3p_plume' },
      { if: 'flag f_brann_list !clue f3_brann_list', once: true, then: ['clue f3_brann_list'],
        say: ["Sir Knut's patrol! Six Hearthwardens with blue plumes, gone up the Dreadmoor. Not one came home! Not even a note!", "Knut's patrol of six never came home!"] },
      { if: 'stage>=f_hearth !flag f_brann_list !quest f_warm active', option: ['Is anyone missing from the town?', 'Is anyone missing?'],
        then: ['set f_brann_list', 'clue f3_brann_list'],
        say: [['f_brann', 'Two of my Hearthwardens froze at their posts! One at each gate! And Sir Knut went up to guard the Dreadmoor! With his whole patrol!', 'Two guards froze! Knut took his patrol to the moor!', { ref: 'f3_west_gate' }],
          ['f_brann', 'Six Hearthwardens with blue plumes! Not one came home! Not even a note! Also the milkman. The milkman is a separate problem.', 'Six blue plumes. None came home!']] },
      // f_juniper starts here (x2_people's own option needs the old quest table)
      { if: 'stage>=f_kindle !quest f_juniper started !flag f_juniper_found', option: ['Have you seen a girl with a map case?', 'Seen a girl with maps?'],
        then: ['quest start f_juniper'], end: true,
        say: [['f_brann', "The map girl? Went out on the Shiversea floes last week! On foot! I said, miss, the ice moves! She said, then I'll map it moving!", 'She walked out on the sea ice! On foot!'],
          ['f_brann', 'Out past Rimeholm, where the sea is all floes! Bring her back before her boots freeze! Brave! Or a moth! Probably brave!', 'Past Rimeholm, on the ice! Bring her back!', { ref: 'f3s_floes' }]] },
      // (Rowan, the freed Rime Knight by the West Gate, says it himself and gives the same clue; Brann tells it to a player
      // who comes to him first, or plays on an engine without data people)
      { if: 'flag f_freed_n>=1 !clue f3_freed_knight', once: true, then: ['clue f3_freed_knight'],
        say: [['f_brann', 'One of my lads just walked in through the West Gate! Blue to the ears! Asking for me! Rowan, of Sir Knut\'s patrol!', 'One of my lads came home! Rowan!', { ref: 'f3_west_gate' }],
          ['f_brann', 'He says he was walking. For weeks. In armor made of ice. Walking for her, and he could not stop! Then a dragon breathed on him.', 'He walked in ice armor for her. Then you thawed him!']],
        re: [
          { t: ['Is he all right?', 'Is he all right?'], tone: 'kind', f: 0.5,
            say: [['f_brann', 'Blue to the ears, and he ate my lunch! He is all right!', 'Blue, and he ate my lunch. He is fine!']] },
          { t: ['Walking for who?', 'Walking for who?'],
            say: [['f_brann', 'He would not say the name! He shivered and asked for more soup! I gave him the soup!', 'He would not say. He just wanted soup.']] },
        ] },
      { if: 'flag f_hush_done solved what_knights', once: true, fact: 'f3s_hush=gone',
        say: ['Two of my lads are guarding the Dreadgate now! The rest are eating. They have a month of lunches to catch up on.', 'My lads guard the Dreadgate now!'], ref: 'f3s_dreadgate',
        re: [
          { t: ['Sigge and Bjorn look very brave.', 'Sigge and Bjorn look brave.'],
            say: [['f_brann', 'Bjorn says he is very good at the standing part! I am working on the looking-brave part!', 'Bjorn is good at standing. We are working on brave.']] },
          { t: ['Did Sir Knut come home too?', 'Did Sir Knut come home?'], if: 'flag f_thaw_f_frz_knight',
            say: [['f_brann', 'He did! He walked straight to me and said sorry! A knight! Sorry! To me! I said sorry back, and we both felt much better.', 'He came and said sorry. I said sorry back.']] },
        ] },
      // (A3a's G.choices.f3_moth: what Ash said at the West Gate when Brann asked "are you a moth?")
      { if: 'flag f_hush_done choice f3_moth=moth', once: true, fact: 'f3s_hush=gone',
        say: ['The great white moth is gone, and good riddance! From now on you are the only moth allowed in Hearthold, Ash. Do not tell anyone.',
          'The big moth is gone! You are the only moth allowed here now.'],
        re: [
          { t: ['Bzzz. Thank you, Captain.', 'Bzzz. Thank you.'], tone: 'silly',
            say: [['f_brann', 'Moths do not buzz! ...You remembered. Ha! Carry on, moth!', 'Moths do not buzz! You remembered. Carry on!']] },
          { t: ['Will you stop being scared now?', 'Will you stop being scared?'],
            say: [['f_brann', 'Of the big ones, yes! Of the small ones, no! Small ones get in your helmet!', 'Of big ones, yes. Small ones get in your helmet!']] },
        ] },
      { if: 'flag f_northgate !flag f_done', once: true, fact: 'f3s_northgate=open',
        say: ['My boots are still full of gate! I am keeping them, as a trophy! The Hearthkeeper says they smell. They smell of victory!', 'My boots are full of gate! I am keeping them!'], ref: 'f3s_northgate',
        re: [
          { t: ['Did Gunnar stop licking it?', 'Did Gunnar stop licking it?'],
            say: [['f_brann', 'He licked the open bit too! He says it tastes different now! Warmer! I did not ask!', 'He licked it open too. He says it tastes warmer.']] },
          { t: ['Where does that road go?', 'Where does that road go?'],
            say: [['f_brann', 'Up onto the Dreadmoor, where Sir Knut went. Nobody goes up there now. Nobody comes back down.', 'Up to the moor, where Knut went. Nobody comes back.', { ref: 'f3s_knut' }]] },
        ] },
      // what Ash told him about moths, and what Ash told the Mayor about being brave
      { if: 'said brann_still flag f_hush_done', once: true,
        say: ['I tried your trick! A moth landed on my helmet last night, and I stood as still as a statue. Gunnar thought I had frozen again and fetched hot water.',
          'I stood still when a moth landed! Gunnar fetched hot water.'],
        re: [
          { t: ['Did the moth fly off?', 'Did it fly off?'],
            say: [['f_brann', 'The moth flew off! The hot water did not! I am still drying out! Bravely!', 'It flew off. The water did not. I am still damp!']] },
          { t: ['That was very brave, Captain.', 'That was brave, Captain.'], tone: 'kind', f: 0.5,
            say: [['f_brann', 'It was! I was terrified the whole time! That is the brave part, the Mayor says!', 'It was! I was scared the whole time. That is brave!']] },
        ] },
      { if: 'said toast_brave', once: true,
        say: ['The Mayor told the whole Hall that brave means being scared and doing it anyway. She says a dragon told her. Then I am very brave! All day long!',
          'The Mayor says brave is scared, but doing it. Then I am very brave!'],
        re: [
          { t: ['You are, Captain. All day.', 'You are, Captain.'], tone: 'kind', f: 0.5,
            say: [['f_brann', 'Ha! I knew it! I am going to tell Gunnar! Gunnar is scared of nothing, which is a different problem!', 'Ha! I will tell Gunnar. He fears nothing. That is a problem.']] },
          { t: ['Even indoors?', 'Even indoors?'], tone: 'silly',
            say: [['f_brann', 'Especially indoors! The moths are indoors! Somewhere! Behind the curtains, probably!', 'Especially indoors! Moths hide behind curtains!']] },
        ] },
      // his patrol, once he has told Ash about it
      { if: 'clue f3_brann_list !solved what_knights',
        say: ['I should have gone up with Knut. A captain goes with his lads. I stayed behind to mind the town.', 'I should have gone with Knut. I stayed.'],
        re: [
          { t: ['Somebody had to mind the town.', 'Someone had to stay.'], tone: 'kind', f: 0.75,
            say: [['f_brann', 'That is exactly what Knut said! I hate it when Knut is right! He is right a great deal!', 'That is what Knut said. I hate it when he is right.']] },
          { t: ["I'll look for them up there.", "I'll look for them."], tone: 'brave', f: 0.5, then: ['said brann_look'],
            say: [['f_brann', 'Would you? Look for blue plumes. Six of them. They are very proud of the plumes. I chose the blue myself.', 'Would you? Look for six blue plumes.']] },
        ] },
      // his moment (the old chat): while the white moth is still about
      { if: 'stage>=f_thaw !flag f_hush_done', fact: 'f3s_hush=loose',
        say: ['Question, Horns! Between Hearthwardens! If a moth landed on your nose, what would you do?', 'A moth lands on your nose. What do you do?'],
        re: [
          { t: ['Blow on it, gently, till it goes.', 'Blow on it gently.'], f: 0.5,
            say: [['f_brann', 'Gently! Of course! That is exactly what I would do! After the screaming!', 'Gently! Yes! After the screaming.']] },
          { t: ['Stay very still, and be brave.', 'Stay still and be brave.'], tone: 'brave', f: 0.5, then: ['said brann_still'],
            say: [['f_brann', 'Still and brave. Like a statue. I can do statue! I was very nearly one!', 'Still and brave, like a statue. I can do that!']] },
          { t: ['Sneeze fire on it.', 'Sneeze fire on it.'], tone: 'silly', f: 1,
            say: [['f_brann', 'Ha! A fire sneeze! That is going in the Hearthwarden handbook! Page one!', 'Ha! A fire sneeze! Page one of the handbook!']] },
        ] },
      { if: 'flag f_done',
        say: ['The winter is over, and I am keeping my icicles! Well. They melted. I am keeping the puddle! In a jar!', 'Winter is over. My icicles melted. I kept the puddle!'],
        re: [
          { t: ['A jar of puddle?', 'A jar of puddle?'], tone: 'silly',
            say: [['f_brann', 'A brave puddle! It was on my beard through the whole Long Winter! It deserves a jar!', 'It was on my beard all winter. It deserves a jar!']] },
          { t: ['Are your lads all home now?', 'Are your lads home?'], if: 'solved what_knights',
            say: [['f_brann', 'Every one! Eating! Sleeping! Complaining about the soup! It is the best noise in the world!', 'Every one! Eating and complaining. The best noise!']] },
        ] },
      // the days in between
      { if: '!flag f_hush_done', fact: 'f3s_hush=loose',
        say: [['I am not afraid of moths! I simply respect them from a distance! A large distance! Indoors!', 'I am not scared of moths! I just stay far away!'],
          ["My beard has icicles! I'm keeping them! They're intimidating!", 'My beard has icicles! They look tough!']] },
      { say: [['Hearthwardens never retreat! We advance backwards! Carefully!', 'We never retreat! We go backwards!'],
        ['Stand up straight! ...I was talking to myself. I do that on watch.', 'Stand up straight! I mean me.']] },
      // topics
      { ask: ['Who is Gunnar?', 'Who is Gunnar?'],
        say: ['My bravest Hearthwarden! He is afraid of nothing at all, and he licks things. Railings, mostly. We are working on it!', 'My bravest guard! He licks things. We are working on it.'] },
      { ask: ['Why are you scared of moths?', 'Why are you scared of moths?'],
        say: ['When I was a boy a moth flew into my ear. I heard it flapping for a week. A whole week! I have never been the same!', 'A moth flew in my ear once. It flapped for a week!'] },
      { ask: ['Has Sir Knut ever sent word?', 'Has Knut sent word?'], if: 'clue f3_brann_list !solved what_knights',
        say: ['Not one word! A Hearthwarden always writes! Knut writes the way a hen walks, but he writes!', 'Not a word! Knut always writes. Badly, but he writes.'] },
      { idle: [['Report, Horns!', 'Report!'], ['Chin up! What is it?', 'Chin up! What is it?']] },
      { bye: [['Dismissed! Mind the moths!', 'Mind the moths!'], ['Off you go! Chin up, tail up!', 'Chin up, tail up!']] },
      { bark: true, if: '!flag f_hush_done', fact: 'f3s_hush=loose', say: ["Is that flapping in my helmet? No! It's my heart! Beating bravely!", "Something's flapping! Oh. It's my heart."] },
      { bark: true, say: ["Hearthwardens! Stand up straight! ...Gunnar, that's a snowman.", "Stand up straight! Gunnar, that's a snowman."] },
    ],

    // ---------------------------------------------------------------- Rowan, Sigge and Bjorn: Sir Knut's freed patrol
    f3_rowan: [
      { if: '!clue f3_freed_knight', once: true, scene: 'a3p_rowan', then: ['clue f3_freed_knight'] },
      { if: 'solved what_knights', once: true,
        say: ['Captain Brann says we are heroes. We were icicles. But heroic ones, he says, so I am going with that.', 'We were icicles. Heroic ones, Brann says.'],
        re: [
          { t: ['You were brave to walk home.', 'You were brave.'], tone: 'kind', f: 0.5,
            say: [['f3_rowan', 'I walked home because a dragon told me there was soup. I would not call it brave. I would call it hungry.', 'I walked home for soup. That is hungry, not brave.']] },
          { t: ['Where are the others now?', 'Where are the others?'],
            say: [['f3_rowan', 'Sigge and Bjorn are on guard at the Dreadgate, if the moth is gone. The rest are asleep. Mostly on top of each other.', 'Some guard the Dreadgate. The rest are asleep.', { ref: 'f3s_dreadgate' }]] },
        ] },
      { say: [['Every time I close my eyes I hear her humming. I am keeping my eyes open. Forever, probably.', 'I hear her humming. I keep my eyes open.'],
        ['There are more of us up there, in the ice armor. Melt them, please. Gently.', 'More of us are up there. Melt them!'],
        ['I have eaten three lunches. I am catching up.', 'I have had three lunches.']] },
      { ask: ['What do you remember of it?', 'What do you remember?'],
        say: ['Walking. Cold. And a humming, far off, the whole time, like somebody singing a baby to sleep. I did not like the baby part.', 'Walking. Cold. And humming, like a lullaby.'] },
      { idle: [['Still a bit cold in the ears. What is it?', 'Cold ears. What is it?']] },
      { bye: [['Mind the purple snow. It is not snow.', 'Mind the purple snow.']] },
      { bark: true, say: ['Brr. Still cold in my ears.', 'Brr. Cold ears.'] },
    ],
    f3_patrol_a: [
      { ref: 'f3s_dreadgate', say: ["Sir Knut's patrol, on guard! Nobody gets frozen on our watch. Not again.", 'On guard! Nobody freezes on our watch!'],
        re: [
          { t: ['Do you remember the ice armor?', 'Do you remember the armor?'],
            say: [['f3_patrol_a', 'I remember wanting to stop and not stopping. That is all. Bjorn remembers less. Bjorn is lucky.', 'I wanted to stop and could not. That is all.']] },
          { t: ['Brann is proud of you.', 'Brann is proud of you.'], tone: 'kind', f: 0.5,
            say: [['f3_patrol_a', 'He told us. From the tower. The whole town heard. Twice.', 'He told us. From the tower. Twice.']] },
        ] },
      { idle: [['On guard. What is it?', 'On guard. What?']] },
      { bye: [['Go on up. We will keep watch.', 'We will keep watch.']] },
    ],
    f3_patrol_b: [
      { ref: 'f3s_dreadgate', say: ["Captain Brann said stand here and look brave. I'm very good at the standing part.", 'I stand here and look brave!'],
        re: [
          { t: ['You look very brave.', 'You look very brave.'],
            say: [['f3_patrol_b', 'Do I? I am thinking about lunch. It must look the same from outside.', 'I am thinking about lunch. It looks the same.']] },
          { t: ['How long do you stand here?', 'How long do you stand?'],
            say: [['f3_patrol_b', 'Until Sigge says stop. Sigge never says stop. I think she forgets I can.', 'Until Sigge says stop. She never does.']] },
        ] },
      { idle: [['Still standing. What is it?', 'Still standing.']] },
      { bye: [['Mind the steps. They are slippy.', 'Mind the steps.']] },
    ],

    // ---------------------------------------------------------------- Mayor Ottilie Toastwhistle
    // Says everything is fine, louder each time; nervous, kind, writes letters to the weather. Warm Hands (f_warm) is
    // her quest: twelve thawed people and a medal she makes herself.
    f_toastwhistle: [
      // her first meeting (before her quest; Brann's shouting got there first)
      { if: '!quest f_warm started stage<f_kindle', once: true,
        say: ["You must be the horned boy! Brann has told the whole town. Twice. I'm Mayor Toastwhistle, and everything is fine.", "You're the horned boy! I'm the Mayor. All is fine."],
        re: [
          { t: ['Is everything fine?', 'Is everything fine?'],
            say: [['f_toastwhistle', 'Yes! No. The Hearth is going out and the town is freezing. Apart from that, fine.', 'Yes! No. The fire is going out. Apart from that, fine.']] },
          { t: ['What did Brann say about me?', 'What did Brann say?'],
            say: [['f_toastwhistle', "That you have horns, a tail, and you are not a moth. He said the last part three times.", 'Horns, a tail, and not a moth. Three times.']] },
        ] },
      { if: 'quest f_warm done', once: true,
        say: ['Twelve people! Warm! And a medal ceremony! I have never been this fine. This is what fine actually feels like.', 'Twelve warm people and a medal! This is fine!'],
        re: [
          { t: ['What does it feel like?', 'What does it feel like?'],
            say: [['f_toastwhistle', 'Quiet. Like a cup of cocoa with the lid on. I never knew fine could be quiet.', 'Quiet. Like cocoa with a lid on.']] },
          { t: ['The medal was a cookie, Mayor.', 'The medal was a cookie.'], tone: 'silly',
            say: [['f_toastwhistle', 'There is a real one too! The cookie is for eating. The real one is for not eating. Please do not eat the real one.', 'The cookie is for eating. Not the real one!']] },
        ] },
      { if: 'choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ["The Snow Mother lives on our mountain now! I gave her the key to the city. She froze it solid. I've hung it over my door.", 'I gave the Snow Mother our key. She froze it.'],
        re: [
          { t: ['She meant it kindly.', 'She meant it kindly.'], tone: 'kind', f: 0.5,
            say: [['f_toastwhistle', 'I know! It is the nicest frozen thing anyone ever gave back to me. It drips on my hat. I love it.', 'I know! It drips on my hat. I love it.']] },
          { t: ['Does it unlock anything?', 'Does it open anything?'],
            say: [['f_toastwhistle', 'It never did. Now it never will. I find that very restful.', 'It never did. Now it never will. Restful.']] },
        ] },
      { if: 'quest f_warm active !flag f_warm12',
        say: ["Every frozen person you warm counts! Pim's cocoa is on the town! Pim does not know yet!", 'Every person you thaw counts!'],
        re: [
          { t: ['How many is it so far?', 'How many so far?'],
            say: [['f_toastwhistle', 'I keep a list! It has gold stars on it! Some of the stars are cocoa stains, but they count!', 'I keep a list with gold stars. Some are cocoa.']] },
          { t: ['When will you tell Pim?', 'When will you tell Pim?'],
            say: [['f_toastwhistle', 'Soon! Tomorrow! ...In writing! From a long way away!', 'Soon! In a letter. From far away!']] },
        ] },
      // her moment (the old chat): while the Hearth is dying and the town is scared
      { if: '!flag f_hearth_lit', fact: 'f3s_hearth=dying',
        say: ["Official question from the Mayor. Is it all right to be scared, if you're the one in charge?", 'Is it all right to be scared, if you are in charge?'],
        re: [
          { t: ['Yes. Just be kind while you are.', 'Yes. Be kind while scared.'], f: 0.5,
            say: [['f_toastwhistle', 'Kind while scared. I am writing that on my door. In big letters. At the top.', 'Kind while scared. I will write that on my door.']] },
          { t: ['Brave is scared, and doing it anyway.', 'Brave is scared, and doing it.'], tone: 'brave', f: 1, then: ['said toast_brave'],
            say: [['f_toastwhistle', 'Scared and doing it anyway. ...I do that every single day. Am I brave? I think I might be brave.', 'I do that every day. Am I brave? I think so!']] },
          { t: ['Only if you say fine a lot.', 'Only if you say fine.'], tone: 'silly', f: 0.5,
            say: [['f_toastwhistle', 'Fine! Fine. ...It does help, a little. Do not tell anyone.', 'Fine! Fine. It helps a bit. Shh.']] },
        ] },
      // the Hearth is blue
      { if: 'flag f_hearth_lit !flag f_done', fact: 'f3s_hearth=blue',
        say: ['The Hearth is blue! Is blue fine? Blue is fine. Blue is the finest fine there is.', 'The Hearth is blue! Is blue fine? Yes!'],
        re: [
          { t: ['Blue is the hottest kind.', 'Blue is the hottest.'],
            say: [['f_toastwhistle', 'The hottest! Then I shall put it in the town notes. "Fire, blue: very fine."', 'The hottest! I will put that in the town notes.']] },
          { t: ['Did winter answer your letter?', 'Did winter write back?'],
            say: [['f_toastwhistle', 'Not one word. Between you and me, the Hearth did more than all my letters together.', 'No. The Hearth did more than my letters.']] },
        ] },
      { if: 'flag f_done',
        say: ['Everything is fine. I said it quietly this morning, at the Hall, and nobody laughed. That has never happened.', 'All is fine. I said it quietly. Nobody laughed.'],
        re: [
          { t: ['Because it was true.', 'Because it was true.'], tone: 'kind', f: 0.5,
            say: [['f_toastwhistle', 'That must be it. I shall have to find something new to worry about. I am sure I will.', 'That must be it. I will find new worries. I always do.']] },
          { t: ['Say it once more, louder.', 'Say it louder.'], tone: 'silly',
            say: [['f_toastwhistle', 'Everything is fine! ...Oh, that felt wonderful. Again tomorrow.', 'Everything is fine! That felt wonderful.']] },
        ] },
      { say: [["I've ordered the winter to stop. In writing. It has not replied.", 'I told winter to stop. No reply.'],
        ['Fine is a word you can say a lot without wearing it out. I have tested this.', 'You can say fine a lot. I tested it.']] },
      // topics
      { ask: ['How long have you been mayor?', 'How long have you been mayor?'],
        say: ["Eleven years. Fine for none of them. Mayors are never really fine, you know. We just say it louder.", 'Eleven years. Never fine. Mayors just say it louder.'] },
      { ask: ['Are you scared of Brynja?', 'Are you scared of Brynja?'],
        say: ["A little. Fine. A lot. She's kept that fire longer than I've been alive, and she looks at me like I'm a damp log.", 'A lot. She looks at me like a damp log.'] },
      { ask: ['Who is the medal for?', 'Who is the medal for?'], if: 'quest f_warm active',
        say: ['For whoever warms twelve people! I am making it myself. It is going very well. It is mostly glue.', 'For whoever warms twelve. I made it. Mostly glue.'] },
      { idle: [['Fine! What is it?', 'Fine! What is it?'], ['Is something not fine? Tell me quietly.', 'Something wrong? Tell me quietly.']] },
      { bye: [['Stay fine!', 'Stay fine!'], ['Goodbye! Everything is fine! Mind the ice!', 'Bye! Mind the ice!']] },
      { bark: true, say: ['Fine! Fine. Fine fine fine.', 'Fine! Fine. Fine.'] },
    ],

    // ---------------------------------------------------------------- Gunnhild Anvilheart, the smith
    // Gruff, proud, a huge fan of Maren (she asked her north once; the "no thank you" is framed on her wall). Knows the
    // sword before she knows the face. Her quest f_forge lights her forge and makes the Ember Chain.
    f_gunnhild: [
      // her first meeting, before her quest (she knows the sword before the face)
      { if: '!quest f_forge started', once: true,
        say: ["Hm. A dragon in my cold forge. ...Wait. That sword. That's Maren's work. You're Maren's kid?", "That's Maren's sword. You're her kid?"],
        re: [
          { t: ['You know my mom?', 'You know my mom?'],
            say: [['f_gunnhild', 'Know her? Her letter is on my wall. One letter. It says "no thank you." I framed it.', 'Her letter is on my wall. It says "no thank you."']] },
          { t: ['You can tell just by looking?', 'Just by looking?'],
            say: [['f_gunnhild', 'Nobody else folds steel like that. Twenty times, then once more for luck. I tried it. Mine cracked.', 'Nobody folds steel like that. I tried. Mine cracked.']] },
        ] },
      { if: 'quest f_forge done', once: true,
        say: ["My forge has been hot every day since. I wrote your mother a letter about it. Four pages. I haven't sent it.", 'My forge is hot! I wrote your mom. I did not send it.'],
        re: [
          { t: ['Send it. Mom writes back.', 'Send it. Mom writes back.'], tone: 'kind', f: 0.5, then: ['said gunnhild_send'],
            say: [['f_gunnhild', 'Does she. ...Then it goes down the pass on the next sled, before I can take it back.', 'Then it goes on the next sled. Before I change my mind.']] },
          { t: ['What is on the four pages?', 'What is on the pages?'],
            say: [['f_gunnhild', 'My forge. Three pages on her grip work. One line about you. It is a good line.', 'Three pages on her work. One line on you. A good one.']] },
        ] },
      // what old Rasmus said (said rasmus_slow, set in his talk in Rimeholm)
      { if: 'said rasmus_slow', once: true,
        say: ["Old Rasmus says slow? Thirty years he's said slow to me. ...Fine. I'll hit it slower. Watch.", 'Rasmus says slow? Fine. I will hit it slower. Watch.'],
        re: [
          { t: ['That was slower. A bit.', 'That was slower. A bit.'],
            say: [['f_gunnhild', 'A bit is all he gets. Don\'t tell him it rang better.', 'A bit is all he gets. Do not say it rang better.']] },
          { t: ['He says you have the best hands.', 'He says you have good hands.'], tone: 'kind', f: 0.5,
            say: [['f_gunnhild', 'He said that? To you? ...He never once said it to me.', 'He said that? He never said it to me.']] },
        ] },
      { if: 'quest f_forge active flag f_forge_lit !item f_starfrost', fact: 'f3s_forge=lit',
        say: ['Starfrost. Blue ore. It grows where fire meets frost. Old bones in the Stonehorn hills, I hear. Knock hard.', 'Bring blue starfrost. Knock on old bones!'],
        re: [
          { t: ['Old bones? Whose bones?', 'Whose bones?'],
            say: [['f_gunnhild', 'Mammoths, long gone. The ore grows in them like frost on a window. Knock, and it falls out.', 'Old mammoths. Knock, and the ore falls out.', { ref: 'f3s_skulldrum' }]] },
          { t: ['What will you make with it?', 'What will you make?'],
            say: [['f_gunnhild', 'Something that burns at the tip. You\'ll see. I\'ve been thinking about it since the day I met your sword.', 'Something with a burning tip. You will see.']] },
        ] },
      // her moment (the old chat), the forge lit and the sword on her anvil
      { if: 'flag f_forge_lit', fact: 'f3s_forge=lit',
        say: ["Hear that? Most forges roar. Mine purrs. ...Tell me, Maren's kid. What's the best thing your mom ever made?", 'Hear my forge purr? What is the best thing your mom made?'],
        re: [
          { t: ['Me. She says so, anyway.', 'Me. She says so.'], tone: 'kind', f: 1,
            say: [['f_gunnhild', 'Ha! Then she\'s the best smith in the world. I knew it. I said it to my anvil years ago.', 'Ha! Then she is the best smith ever. I knew it.']] },
          { t: ['This sword. It beat a mountain.', 'This sword.'], f: 0.5,
            say: [['f_gunnhild', 'Let me look. Just look. ...Hold. Fine, I\'m holding it. Oh, that\'s lovely. Here. Take it back before I cry.', 'Let me hold it. Oh, lovely. Take it back.']] },
          { t: ['Her leek soup. It warms stones.', 'Her leek soup.'], if: 'said hal_fire_soup', f: 0.5,
            say: [['f_gunnhild', 'Maren makes soup? Maren of Emberhollow has a soft side? Don\'t tell me any more. I\'ll faint into the coals.', 'Maren makes soup? Stop. I will faint.']] },
        ] },
      { if: 'quest f_forge active !flag f_forge_lit', fact: 'f3s_forge=cold',
        say: ["Cold anvil, cold hammer. Breathe on that forge, lad. Blue, mind. Orange won't wake her.", 'Breathe blue on my forge. Orange will not do.'], ref: 'f3s_forge' },
      { if: 'flag f_done',
        say: ['Every smith in Hearthold has been round to look at my forge. I let them look. I don\'t let them touch.', 'Every smith came to see my forge. No touching.'],
        re: [
          { t: ['Can I touch?', 'Can I touch?'], tone: 'silly',
            say: [['f_gunnhild', 'You lit it. You can sit in it, if you like. ...Don\'t sit in it.', 'You lit it. You can sit in it. Do not.']] },
          { t: ['Mom would like to see it.', 'Mom would like it.'], tone: 'kind', f: 0.5,
            say: [['f_gunnhild', 'Then she knows the way. Up the pass. Keep going till it gets cold, then keep going.', 'Then she knows the way. Go till it gets cold.']] },
        ] },
      { if: '!flag f_forge_lit', fact: 'f3s_forge=cold',
        say: [["My forge went cold the night the moth came. I still come in every morning and pick up the hammer. Habit.", 'My forge went cold. I still pick up the hammer.'],
          ['Northern iron is stubborn. So am I. We get along.', 'Northern iron is stubborn. So am I.']] },
      { if: 'flag f_forge_lit', fact: 'f3s_forge=lit',
        say: [['Hear that? Purring. My forge purrs.', 'Hear that? My forge purrs.'],
          ['Northern iron is stubborn. So am I. We get along.', 'Northern iron is stubborn. So am I.']] },
      // topics
      { ask: ['Who taught you to be a smith?', 'Who taught you?'],
        say: ['Old Rasmus, in Rimeholm. He taught me to hold a hammer. Then he taught me to put it down. That took longer.', 'Rasmus. He taught me to hold a hammer. Then to put it down.'] },
      { ask: ['Did you want to be a smith?', 'Did you want to be a smith?'],
        say: ['I wanted to be a knight. Then I made my first sword and found I liked the hitting part. On anvils.', 'I wanted to be a knight. I like hitting anvils more.'] },
      { ask: ['Do you know Ingrid Anvilsong?', 'Do you know Ingrid?'], if: 'power whip',
        say: ['Ingrid? She went down to the coast for the easy fires. She writes that nothing down there is easy. Good. Serves her right. I miss her.', 'She went to the coast. Nothing is easy there. I miss her.'] },
      { idle: [['Hm. What is it?', 'Hm. What is it?'], ['Talk while I work. Go on.', 'Talk while I work.']] },
      { bye: [['Mind the anvil. It bites.', 'Mind the anvil.'], ['Tell your mother I said hm.', 'Tell your mom: hm.']] },
      { bark: true, if: '!flag f_forge_lit', fact: 'f3s_forge=cold', say: ['Hit a cold anvil, and all it does is hurt your arm.', 'A cold anvil just hurts your arm.'] },
      { bark: true, if: 'flag f_forge_lit', fact: 'f3s_forge=lit', say: ['Clang! Clang! Hum hum hum. Clang!', 'Clang! Clang! Hum hum.'] },
    ],

    // ---------------------------------------------------------------- Mags Sprocket, a Gearhaven tinker
    // Fast, cheerful, loves explosions, stranded up here with her heaters. Brought Penny's paper up the pass in her sled.
    // Knows the Moth Mask (sold her a lock); Hettie is her cousin. Her quest f_bombs makes Ash's Blast Bombs.
    f_mags: [
      // her first meeting (from f_kindle on, her quest's offer plays first)
      { if: '!quest f_bombs started stage<f_kindle', once: true,
        say: ["A dragon! A real warm one! Penny's paper came up the pass in my sled, you know. You're on the front page.", "A warm dragon! You're in Penny's paper!"],
        re: [
          { t: ['What does Penny say about me?', 'What does Penny say?'],
            say: [['f_mags', 'That you chase thieves over rooftops and wake up clocks. The drawing of you is mostly teeth.', 'You chase thieves and wake clocks. The drawing is all teeth.']] },
          { t: ['Why are you so far from home?', 'Why are you up here?'],
            say: [['f_mags', 'I came up here to sell steam heaters. Then winter came. Business has never been better, and I have never been colder.', 'I sell heaters. Business is great. I am so cold.']] },
        ] },
      { if: 'quest f_bombs done', once: true,
        say: ['Captain Brann came by to say no to my fireworks shop. He bought six rockets on the way out.', 'Brann said no to my shop. Then bought six rockets.'],
        re: [
          { t: ['What will he do with six?', 'What will he do with six?'],
            say: [['f_mags', 'He says they are for moths. I think they are for New Year. He asked which one is loudest. Twice.', 'For moths, he says. He asked which is loudest.']] },
          { t: ['The sparkly dragon looked like me.', 'The dragon looked like me!'],
            say: [['f_mags', 'It was you! The horns, anyway. The tail came out a bit like a carrot. Version two will be better.', 'It was you! The tail was a bit carrot. Next time!']] },
        ] },
      { if: 'quest f_bombs active flag f_bombs_lit !flag f_bombs_test', ref: 'f3s_boulder',
        say: ['The Big Boulder! On the old Quarry Road, by the lake! Go! Boom! Report back!', 'The Big Boulder! Go! Boom!'] },
      { if: 'quest f_bombs active item f_powder', say: ['Is that my powder? Bring it here! Gently! Ish!', 'My powder! Bring it here!'] },
      // G5 pointer: Hettie's boulder in Gearhaven (gates_map1.js f3g_hettie)
      { if: 'power bombs !flag f3_satchel', option: ['Anything else need blowing up?', 'Anything to blow up?'],
        say: [['f_mags', 'Ha! My cousin Hettie in Gearhaven has had a boulder sitting on her cellar door for twelve years.', 'Cousin Hettie has a boulder on her cellar!'],
          ['f_mags', 'Right behind her workshop. She asks me about it every Lantern Day. Take her a bomb. Take her a big one.', 'Behind her workshop. Take a bomb!', { promise: 'f3g_hettie' }]] },
      { if: 'choice c_vesper=friend', once: true,
        say: ["Somebody slid a note under my door, signed with a little moth. It just says 'Stop blowing things up.' I am framing it.", "A note signed with a moth: 'Stop blowing things up.'"],
        re: [
          { t: ["That's my cousin. She means it nicely.", "That's my cousin."],
            say: [['f_mags', 'Your cousin? The Moth Mask is your cousin? My family just explodes. Hettie\'s eyebrows never grew back.', 'Your cousin? My family just explodes.']] },
          { t: ['Will you stop?', 'Will you stop?'], tone: 'silly',
            say: [['f_mags', 'Stop? I am going to blow something up in her honor. Something small. Something polite.', 'Stop? I will blow up something small for her.']] },
        ] },
      { if: 'choice c_vesper=foe', once: true,
        say: ['The Moth Mask has gone quiet, they say. No more locks picked in Gearhaven. I almost miss her.', 'The Moth Mask is quiet now. I miss her a bit.'],
        re: [
          { t: ['She got away from me.', 'She got away from me.'],
            say: [['f_mags', 'Then she is out in the cold, like the rest of us. I hope somebody sells her a heater.', 'Then she is out in the cold. I hope she has a heater.']] },
          { t: ['Did she really pay for that lock?', 'Did she pay for the lock?'],
            say: [['f_mags', 'Every coin. Picked it first, then paid. Good manners, that one.', 'Every coin. She picked it, then paid.']] },
        ] },
      // her moment (the old chat), once she has made him his bombs
      { if: 'power bombs',
        say: ['Serious science question. If you could blow up one thing in the whole world, what would it be?', 'If you could blow up one thing, what?'],
        re: [
          { t: ['The storm on that mountain.', 'The storm on the mountain.'], if: '!flag f_done', tone: 'brave', f: 1,
            say: [['f_mags', 'A storm bomb! I would need a bigger bag. And a bigger me. Leave it with me.', 'A storm bomb! I need a bigger bag. Leave it with me.']] },
          { t: ["Bertram's giant frozen bun.", "Bertram's frozen bun."], if: 'seen bm_bertram', f: 0.5,
            say: [['f_mags', 'A bun? How big a bun? ...Bring me the measurements. This is the best day of my life.', 'How big a bun? Bring me the size. Best day ever.']] },
          { t: ['A cake. A really big cake.', 'A really big cake.'], tone: 'silly', f: 0.5,
            say: [['f_mags', 'A cake bomb. Sprinkles everywhere. Ash, you genius.', 'A cake bomb! Sprinkles everywhere. Genius.']] },
        ] },
      { say: [["Mags Sprocket, Gearhaven's third-best tinker! The other two exploded. Not badly! A little!", "I'm Mags! The other two tinkers exploded. A little!"],
        ['I sold the Moth Mask a lock once. She picked it. Then she paid for it. Good manners, that one.', 'I sold the Moth Mask a lock. She paid!']] },
      // topics
      { ask: ['Who is the best tinker in Gearhaven?', 'Who is the best tinker?'],
        say: ['Cousin Hettie says she is. I say I am. We have argued about it for twenty years. It is lovely.', 'Hettie says her. I say me. We argue. It is lovely.'] },
      { ask: ['How did you lose your powder?', 'How did you lose your powder?'], if: 'quest f_bombs active !item f_powder !flag f_bombs_lit',
        say: ['The Snowgobs jumped me in the Gulch and pushed my sled off the road. Their king wears a bucket. I want that bucket. For science.', 'Snowgobs pushed my sled off. Their king wears a bucket!'] },
      { ask: ['Did you blow up your first workshop?', 'Your first workshop?'],
        say: ['When I was six. My mom said, "Mags, what did you learn?" I said, "Bigger."', 'At six. Mom asked what I learned. I said: bigger.'] },
      { idle: [['Stand back a bit. What is it?', 'Stand back. What is it?'], ['Mind the fuse. Go on.', 'Mind the fuse. Go on.']] },
      { bye: [["Bye! Don't stand near anything that fizzes!", "Don't stand near fizzing things!"], ['Come back with all your eyebrows!', 'Keep your eyebrows!']] },
      { bark: true, say: ["Stand back! Further! Further than that! ...Okay, it was a dud. Come back.", 'Stand back! ...It was a dud.'] },
    ],

    // ---------------------------------------------------------------- Hilde Pottersnow, the Warm Mitten inn
    // Motherly, feeds everyone (even the chairs), calls Ash "lamb". Lost her husband to a blizzard long ago: a light in
    // every window. Her oldest friend is Sigrun, the cook in frozen Rimeholm.
    f_hilde: [
      // her first meeting (Brann's shouting got here first)
      { if: 'stage<f_thaw', once: true,
        say: ["Come in from the cold, lamb! You're the horned boy Brann keeps shouting about. Sit. Soup. Mind the cat.", 'Come in, lamb! Sit. Soup. Mind the cat.'],
        re: [
          { t: ['Where is the cat?', 'Where is the cat?'],
            say: [['f_hilde', 'On the windowsill, being a loaf. Her name is Biscuit. Don\'t sit on Biscuit. People do.', 'On the sill. She is Biscuit. Do not sit on her.']] },
          { t: ['Does Brann really shout about me?', 'Does Brann shout about me?'],
            say: [['f_hilde', 'From the West Gate tower, every morning. "The horned boy is here! Stay calm!" Nobody was calm.', '"The horned boy is here! Stay calm!" Nobody was.', { ref: 'f3_west_gate' }]] },
        ] },
      { if: 'choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ["The Snow Mother is real! And she's your auntie! The snow is falling soft as feathers now.", 'The Snow Mother is real! Your auntie!'],
        re: [
          { t: ['She kept the winters small, once.', 'She kept winters small.'], tone: 'kind', f: 0.5,
            say: [['f_hilde', 'Small winters. My Torvald would have liked that. ...Have some soup, lamb. I\'m being silly.', 'Small winters. My husband would have liked that.']] },
          { t: ['She wants to come for soup.', 'She wants soup.'], tone: 'silly',
            say: [['f_hilde', 'Then I\'ll need a bigger bowl, and a colder kitchen. I\'ll manage. I always manage.', 'Then I need a bigger bowl. I will manage.']] },
        ] },
      { if: 'flag f_hush_done', once: true, fact: 'f3s_hush=gone',
        say: ['They say the great white moth is gone. I slept with my window open last night. First time in a month.', 'The big moth is gone. I opened my window!'],
        re: [
          { t: ['Was it cold?', 'Was it cold?'],
            say: [['f_hilde', 'Freezing. I didn\'t care. I could hear the snow falling, for once, instead of humming.', 'Freezing! But I heard the snow, not humming.']] },
          { t: ['She was only frightened, Hilde.', 'She was frightened.'], if: 'choice f_hush=scarf',
            say: [['f_hilde', 'Frightened things do the worst damage. Ask any cat. ...I\'m glad somebody was kind to her.', 'Scared things do damage. I am glad you were kind.']] },
        ] },
      { if: 'flag f_thaw_f_sigrun', once: true,
        say: ["Sigrun came down from Rimeholm! She tasted my soup and said 'salt.' Just 'salt.' From Sigrun, that is a medal.", 'Sigrun said my soup needs salt. From her, that is praise!'],
        re: [
          { t: ['She was frozen stirring a pot.', 'She froze stirring soup.'],
            say: [['f_hilde', 'Of course she was. She would stir a pot through an earthquake. She did once.', 'Of course. She would stir through an earthquake.']] },
          { t: ['Did you add the salt?', 'Did you add the salt?'],
            say: [['f_hilde', 'I did. Don\'t tell her. It was much better.', 'I did. Shh. It was much better.']] },
        ] },
      // before Rimeholm: she is worried about Sigrun (said hilde_sigrun: Sigrun hears it when she thaws)
      { if: '!flag f_thaw_f_sigrun stage<f_sky', ref: 'f3s_rimeholm',
        say: ["Rimeholm's gone quiet, lamb, and my oldest friend is up there. Sigrun. She cooks at the smokehouse.", 'Rimeholm went quiet. My friend Sigrun is there.'],
        re: [
          { t: ["I'll look for her there.", "I'll look for her."], tone: 'kind', f: 0.75, then: ['said hilde_sigrun'],
            say: [['f_hilde', 'Will you? Tell her... tell her my soup still needs salt. She\'ll know it\'s me.', 'Will you? Tell her my soup needs salt. She will know.']] },
          { t: ['What is Sigrun like?', 'What is Sigrun like?'],
            say: [['f_hilde', 'Bossy. Feeds everyone whether they\'re hungry or not. We were girls together. I miss her terribly.', 'Bossy. Feeds everyone. We grew up together.']] },
        ] },
      // her moment (the old chat): when he comes in cold from the sea cliffs
      { if: 'stage>=f_thaw',
        say: ["You've come in blue at the edges, lamb. Sit by the fire. What's your favorite soup? I'll make it.", "You're blue! Sit. What's your favorite soup?"],
        re: [
          { t: ['Whatever Mom makes.', 'Whatever Mom makes.'], tone: 'kind', f: 1,
            say: [['f_hilde', 'The right answer. Every child\'s mother makes the best soup. It\'s a rule, up here.', 'Right answer. Mom\'s soup is always best.']] },
          { t: ['Spicy. The spicier the better.', 'Spicy soup!'], f: 0.5,
            say: [['f_hilde', 'A fire-breather who likes it hot. I\'ll fetch the red pepper jar. The big one.', 'I will get the big pepper jar.']] },
          { t: ['Snow soup. Just snow, in a bowl.', 'Snow in a bowl.'], tone: 'silly', f: 0.5,
            say: [['f_hilde', 'You\'d melt it before the spoon got there. Here. A real one.', 'You would melt it. Here, real soup.']] },
        ] },
      { say: [["Welcome to the Warm Mitten! Beds are soft, soup is hot, and the cat is called Biscuit. Don't sit on Biscuit.", "Soft beds, hot soup. Don't sit on the cat."],
        ["Have some soup. Have some more soup. The chair's had two bowls already.", 'Have some soup! The chair had two bowls.']] },
      // topics
      { ask: ['Why is there a light in every window?', 'Why a light in every window?'],
        say: ['I lost my husband to a blizzard, long ago. Torvald. Now there\'s a light in every window, so nobody else gets lost.', 'I lost my husband in a blizzard. The lights help others home.'] },
      { ask: ['Is Sigrun the better cook?', 'Is Sigrun the better cook?'], if: 'flag f_thaw_f_sigrun',
        say: ['Yes. Don\'t you dare tell her. She knows already, and it\'s worse when people say it.', 'Yes. Do not tell her. She knows.'] },
      { idle: [['Soup? What is it, lamb?', 'Soup? What is it?'], ['Warm your claws. Go on.', 'Warm your claws. Go on.']] },
      { bye: [['Wrap up, lamb.', 'Wrap up, lamb.'], ['Come back hungry.', 'Come back hungry.']] },
      { bark: true, say: ["Soup's on! Soup's always on!", "Soup's on!"] },
    ],

    // ---------------------------------------------------------------- Brother Eider, the Hearth Archive
    // Whispers, apologizes to books, Sister Wren's shy cousin. Found the North Forge on his old map (f_hearth). Knows
    // where the Snow Mother's verses were carved (f_song); the archive holds the empty pages they go on.
    f_eider: [
      { if: 'quest f_song done', once: true,
        say: ["(whisper) Wren says she's coming to see the archive herself one day. Outside. On purpose. I've never been so proud.", '(whisper) Wren will visit! Outside! I am so proud.'],
        re: [
          { t: ['Wren hates being outside.', 'Wren hates outside.'],
            say: [['f_eider', '(whisper) She does. She says she will read the whole way here, so she won\'t have to see any of it.', '(whisper) She will read the whole way here.']] },
          { t: ['Will you tidy up first?', 'Will you tidy up?'],
            say: [['f_eider', '(whisper) I\'ve tidied twice. The books keep moving back. They like it how it was.', '(whisper) I tidied twice. The books moved back.']] },
        ] },
      // G4 pointer: Ottoline's letter about the frozen Moon Ring (gates_map1.js f3g_ring; the letter is a3g_otto)
      { if: 'flag f_hearth_lit', once: true, then: ['mail a3g_otto'],
        say: ['(whisper) Ash. A crow stopped at my window just now, with a letter for you from the Turning Library in Gearhaven. She went off to find you. Sorry. Letters excite me.', '(whisper) A crow has a letter for you!'],
        re: [
          { t: ['From Ottoline? The librarian?', 'From Ottoline?'],
            say: [['f_eider', '(whisper) The Turning Library\'s own seal. Wren says she shouts in her letters. I am too shy to write to her.', '(whisper) Her seal. Wren says she shouts. I am too shy.']] },
          { t: ['Did you read it?', 'Did you read it?'],
            say: [['f_eider', '(whisper) Never. I only smelled it. Old paper and sea salt. Sorry. That was rude.', '(whisper) No. I only smelled it. Sorry.']] },
        ] },
      // G2 pointer: the dragons' egg shells on Cinder Mountain's rim (gates_map0.js f3g_eggs)
      { if: 'power windride !flag f3_eggs_open', option: ['What does the archive say about dragons?', 'What about dragons?'],
        say: [['f_eider', '(whisper) The oldest page says two dragon eggs hatched on the rim of the fire mountain, down in Embermere. A red one. And a white one.', 'Two dragon eggs hatched on the fire mountain.'],
          ['f_eider', 'Nobody can climb up there. The rim has no path. Not without a wind to carry you. Shh. Sorry. It is a very exciting page.', 'Nobody can climb there. Only a wind could.', { promise: 'f3g_eggs' }]] },
      // G3 pointer: Iska's stone box under her Ward stone (gates_map0.js f3g_iska)
      { if: 'power pound !flag f3_iska_open', option: ['Any word from Wren?', 'Any word from Wren?'],
        say: [['f_eider', 'Wren says Iska the Warden hid copies of her pages under her own Ward stone, by Emberhollow. Under a cracked flagstone.', 'Iska hid her pages under her Ward stone.'],
          ['f_eider', 'Wren says "stomp." She underlined it so hard the pen went through the page.', 'Wren says "stomp." Underlined.', { promise: 'f3g_iska' }]] },
      // his moment (the old chat), with the old songs out on the table
      { if: 'quest f_song active',
        say: ['(whisper) The songs are all out on the table, and the empty pages for the verses. Can I ask you something? Have you ever been scared of a book?', '(whisper) Have you ever been scared of a book?'],
        re: [
          { t: ['Yes. But the scary part ended.', 'Yes. But it ended.'], tone: 'kind', f: 0.5,
            say: [['f_eider', '(whisper) It always ends. That\'s the kindest thing about books. (sniff) Sorry. Shh.', '(whisper) It always ends. That is kind. (sniff)']] },
          { t: ['Books should be scared of me.', 'Books should fear me.'], f: 1,
            say: [['f_eider', '(gasp) Don\'t say that in here. They\'re listening. ...I like you.', '(gasp) Shh! They listen! I like you.']] },
          { t: ['A cookbook. It had snails in.', 'A cookbook with snails.'], tone: 'silly', f: 0.5,
            say: [['f_eider', '(whisper) In the book? Oh. In the recipes. ...That is worse.', '(whisper) Snails in recipes? That is worse.']] },
        ] },
      // after the old map (f_hearth), before the songs
      { if: 'seen f3_eider !quest f_song started', ref: 'f_glacier',
        say: ['(whisper) Nobody had asked about the North Forge in forty years. Then you did. I keep taking the map out to look at it again.', '(whisper) Nobody asked about the Forge in forty years.'],
        re: [
          { t: ['Thank you for finding it.', 'Thanks for finding it.'], tone: 'kind', f: 0.5,
            say: [['f_eider', '(whisper) It found me, really. Old maps want to be looked at. They\'re very lonely things.', '(whisper) It found me. Old maps get lonely.']] },
          { t: ['Do you ever go outside?', 'Do you go outside?'],
            say: [['f_eider', '(whisper) To the Hearth, and back. Once to the West Gate, by mistake. I didn\'t like it. It was very big.', '(whisper) To the Hearth and back. Outside is very big.', { ref: 'f3_west_gate' }]] },
        ] },
      { say: [['(whisper) Shh. Sorry. Not you. The books. They get nervous in the cold.', '(whisper) Shh. Not you. The books are nervous.'],
        ['(whisper) My cousin Wren runs the library in Brindlecross. She writes me every week. She underlines things. Hard.', '(whisper) Wren writes every week. She underlines a lot.']] },
      // topics
      { ask: ['Is Wren really your cousin?', 'Is Wren your cousin?'],
        say: ['(whisper) We hid under the same tables when we were small. She came out. I didn\'t. Libraries have very good tables.', '(whisper) We hid under tables. She came out. I did not.'] },
      { ask: ['What does Wren say about me?', 'What does Wren say?'], if: 'flag f_pb_wren',
        say: ['(whisper) That you\'re loud, and kind, and that I should be loud near you. She underlined loud. Twice.', '(whisper) That you are loud and kind. Underlined.'] },
      { ask: ['Why do you whisper?', 'Why do you whisper?'],
        say: ['(whisper) Somebody might be reading. Somebody usually is. Mostly me.', '(whisper) Someone might be reading. Usually me.'] },
      { idle: [['(whisper) Yes?', '(whisper) Yes?'], ['(whisper) Shh. Sorry. Go on.', '(whisper) Sorry. Go on.']] },
      { bye: [['(whisper) Mind the door. It squeaks at the poetry.', '(whisper) Mind the squeaky door.']] },
      { bark: true, say: ["(whispering to a book) There, there. Nobody's going to spill cocoa on you.", '(whisper) Nobody will spill on you, book.'] },
    ],

    // ---------------------------------------------------------------- Pim, the cocoa stand (a kid)
    // A tiny businesswoman with one stand and big plans. Little Bo from Rimeholm was her best Sunday customer; she has
    // been saving his cocoa for a month.
    f_pim: [
      // her first meeting, after the chapter (the chapter's own f3_pim is the usual one)
      { if: '!seen f3_pim', once: true,
        say: ["Customer! Hot cocoa, three coins! Two if you heat it yourself! I'm Pim. I own this stand. One day, all the stands.", "Cocoa, three coins! I'm Pim. I own this stand."],
        re: [
          { t: ["I'll heat mine myself.", "I'll heat it myself."],
            say: [['f_pim', '(You breathe on the cup. It steams.) Ooh. That\'s two coins. And a job, if you want one.', 'Ooh! Two coins. And a job, if you want.']] },
          { t: ['How many stands are there?', 'How many stands?'],
            say: [['f_pim', 'One. This one. So I\'m halfway.', 'One. This one. So I am halfway.']] },
        ] },
      // the what_knights red herring: glacier golems
      { if: 'stage>=f_thaw !clue f3_golem_rumor', once: true, then: ['clue f3_golem_rumor'],
        say: ["Did you see the Rime Knights? Gunnhild says they're made of glacier! Walking ice golems! I'd charge them double.", 'Gunnhild says Rime Knights are made of glacier!'],
        re: [
          { t: ['They walk like people, though.', 'They walk like people.'],
            say: [['f_pim', 'People don\'t walk about in ice. ...Do they? I\'d charge them triple, then. Ice people drink a lot of cocoa.', 'People in ice? Then triple. They drink a lot.']] },
          { t: ['Would golems even buy cocoa?', 'Do golems buy cocoa?'], tone: 'silly',
            say: [['f_pim', 'Everybody buys cocoa. That is the first rule of business. The second rule is also cocoa.', 'Everybody buys cocoa. That is rule one.']] },
        ] },
      { if: 'flag f_thaw_f_bo', once: true,
        say: ["Little Bo came back for his Sunday cocoa! A month of Sundays! I gave him all of it. He's very awake now.", 'Little Bo came back! I gave him a month of cocoa!'],
        re: [
          { t: ['Did he drink all of it?', 'Did he drink it all?'],
            say: [['f_pim', 'With a spoon. It went a bit thick, waiting. He says thick is better. He\'s right. I\'m selling it now.', 'With a spoon. It went thick. Now I sell thick.']] },
          { t: ['Did he pay?', 'Did he pay?'], tone: 'silly',
            say: [['f_pim', 'In snowballs. I accept snowballs now. Business is business.', 'In snowballs. I take snowballs now.']] },
        ] },
      { if: 'choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ["The Snow Mother is real! I'm going to sell her iced cocoa. Nobody else up here sells iced cocoa. It's a brand new market!", 'The Snow Mother is real! I will sell her iced cocoa!'],
        re: [
          { t: ["She'd like a very big cup.", 'She needs a big cup.'],
            say: [['f_pim', 'How big? Barrel big? Bathtub big? I can do bathtub. I know where Brann keeps his.', 'Barrel big? Bathtub? I know where Brann keeps his.']] },
          { t: ['How much will you charge her?', 'How much for her?'],
            say: [['f_pim', 'Family discount. You\'re family, so she\'s family. Two coins. Three for the lid.', 'Family price. Two coins. Three with a lid.']] },
        ] },
      // before Bo is thawed: his Sunday cup (said bo_pim: Bo hears it)
      { if: 'stage>=f_thaw !flag f_thaw_f_bo',
        say: ['Little Bo from Rimeholm used to come every Sunday. He hasn\'t come for a month. I\'ve been saving his cocoa. It\'s a lot of cocoa now.', 'Bo used to come every Sunday. I saved his cocoa.'],
        re: [
          { t: ["I'll tell him you saved it.", "I'll tell him."], tone: 'kind', f: 0.75, then: ['said bo_pim'],
            say: [['f_pim', 'Tell him it\'s on the house. Don\'t tell him how big the house is. It\'s a small house.', 'Tell him it is free. It is a small stand.']] },
          { t: ['Rimeholm is frozen. All of it.', 'Rimeholm is all frozen.'], if: 'clue f3_alarm_rope',
            say: [['f_pim', 'All of it? Bo too? ...Then I\'ll keep saving. He\'ll come back thirsty.', 'Bo too? Then I keep saving. He will be thirsty.']] },
        ] },
      { if: 'flag f_frozen_n>=3',
        say: ["The Mayor's giving away my cocoa to every thawed person! I'm sending her a bill. A big one. With a drawing.", 'The Mayor gives away my cocoa! I will send a bill!'],
        re: [
          { t: ['What is the drawing of?', 'What is the drawing of?'],
            say: [['f_pim', 'A sad cocoa. With one tear. The tear is a coin.', 'A sad cocoa. The tear is a coin.']] },
          { t: ["I'll buy a cup myself.", "I'll buy a cup."], tone: 'kind', f: 0.5,
            say: [['f_pim', 'A paying customer! Three coins! ...Two. You look cold. Don\'t tell anyone I said two.', 'Three coins! Two. You look cold. Shh.']] },
        ] },
      // her moment (the old chat), once the Rimeholm cook is back in business
      { if: 'flag f_thaw_f_sigrun',
        say: ['Business question. That Rimeholm cook is back, with her famous soup. So. Would you rather have cocoa, or soup?', 'Business question. Cocoa or soup?'],
        re: [
          { t: ['Cocoa, with a friend.', 'Cocoa with a friend.'], f: 0.5,
            say: [['f_pim', 'Two cocoas! Double sales! You\'re good at this.', 'Two cocoas! Double sales!']] },
          { t: ["Soup. Sigrun's soup.", "Sigrun's soup."], f: 0.5,
            say: [['f_pim', 'Soup? Get out of my shop. ...Come back. I was joking. Mostly.', 'Soup? Get out! ...Come back. Joking.']] },
          { t: ['Cocoa soup.', 'Cocoa soup.'], tone: 'silly', f: 1,
            say: [['f_pim', 'Cocoa soup. A new product. I\'ll call it Soupa-Cocoa. You get one percent.', 'Cocoa soup! A new product! You get one percent.']] },
        ] },
      { say: [['Hot cocoa! Three coins! Two coins if you heat it yourself!', 'Hot cocoa! Three coins!'],
        ["My cocoa has a special ingredient. It's more cocoa.", 'My trick is more cocoa.']] },
      // topics
      { ask: ['Who ran the stand before you?', 'Who ran it before you?'],
        say: ['My mom. She said cocoa is a hug you can drink. She also said never give credit. Then she gave Brann credit.', 'My mom. She said cocoa is a hug you drink.'] },
      { ask: ['Does Brann pay his bill?', 'Does Brann pay?'],
        say: ['Eleven coins he owes me. I send him a bill every week, with a drawing of a sad cocoa on it.', 'He owes eleven coins. I send a sad cocoa bill.'] },
      { idle: [['Cocoa? What do you want?', 'Cocoa? What?'], ['Make it quick. Customers.', 'Quick. Customers.']] },
      { bye: [['Come back with coins!', 'Come back with coins!'], ['Tell your friends! Tell them three coins!', 'Tell your friends!']] },
      { bark: true, say: ['Cocoa! Get your cocoa! Warms you up from the tummy out!', 'Cocoa! Warms your tummy!'] },
    ],

    // ---------------------------------------------------------------- Soren Sledwright, the sled maker
    // Calm, slow-talking, loves speed. Elka (Ulf's daughter) has been on his hill since she sledded up the pass. Judges
    // Elka's Long Sled (f_sled).
    f_soren: [
      // his first meeting, before the race
      { if: 'stage<f_gap', once: true,
        say: ["Hey. Soren. I make sleds. You look like you'd go fast downhill. That's a compliment.", "Hey. I'm Soren. I make sleds."],
        re: [
          { t: ["I've never been on a sled.", 'I never went sledding.'],
            say: [['f_soren', 'Never? ...All right. Come back when the snow\'s soft. It\'s always soft.', 'Never? Come back when the snow is soft.']] },
          { t: ['Is that Elka on your hill?', 'Is that Elka?'],
            say: [['f_soren', 'The girl in the red hat? She sleds like she\'s late for something. I gave her a new runner. She broke it in an hour. Respect.', 'She broke my new runner in an hour. Respect.']] },
        ] },
      { if: 'quest f_sled done', once: true,
        say: ["I put a little flag where you finished. Elka keeps kicking it over. She says it's an accident. It's not an accident.", 'I put a flag where you won. Elka kicks it.'],
        re: [
          { t: ['Put it back up, then.', 'Put it back up.'],
            say: [['f_soren', 'Every morning. It\'s a sort of hobby now. For both of us.', 'Every morning. A hobby, for both of us.']] },
          { t: ['She nearly beat me.', 'She nearly beat me.'], tone: 'kind', f: 0.5,
            say: [['f_soren', 'Don\'t tell her that. She\'ll want to race again. ...Actually, tell her that.', 'Do not tell her. ...Actually, do.']] },
        ] },
      { if: 'stage>=f_gap !quest f_sled started',
        say: ["Nobody has ever sledded from the Windscour all the way down to my hill in one go. Ask the girl in the red hat. She's been asking everybody.", 'Nobody ever sledded here from the Windscour. Ask Elka.'],
        re: [
          { t: ['Elka? Has she been here long?', 'Has Elka been here long?'],
            say: [['f_soren', 'Since the pass cracked. She came up it on a sled. Up. I like her.', 'Since the pass cracked. She sledded up it. I like her.']] },
          { t: ['Has anybody ever tried?', 'Has anyone tried?'],
            say: [['f_soren', 'Me. Forty years ago. I\'m still finding bits of that sled.', 'Me. Long ago. I still find bits of the sled.']] },
        ] },
      // his moment (the old chat), once he has seen Ash ride the wind
      { if: 'power windride',
        say: ["I saw you go over my hill on the wind, like a leaf. Hey. What's the fastest you've ever gone?", 'I saw you ride the wind. What is the fastest you went?'],
        re: [
          { t: ['Just then, on the wind.', 'Just then, on the wind.'], tone: 'brave', f: 1,
            say: [['f_soren', 'Yeah. That\'s the most beautiful thing I\'ve seen this year. And I\'ve seen a lot of snow.', 'Yeah. The best thing I saw all year.']] },
          { t: ['Racing a friend, laughing.', 'Racing a friend.'], f: 0.5,
            say: [['f_soren', 'That\'s the best fast. The laughing kind.', 'The best fast. The laughing kind.']] },
          { t: ['Running away from a bath.', 'Running from a bath.'], tone: 'silly', f: 0.5,
            say: [['f_soren', 'Ha. Baths are slow water too. Too slow. I get it.', 'Ha. Baths are too slow. I get it.']] },
        ] },
      { say: [["Forty years I've sledded this hill. I still scream all the way down.", 'Forty years on this hill. I still scream.'],
        ['Snow is just water that took its time. I like things that take their time and then go fast.', 'Snow is slow water. Then it goes fast.']] },
      // topics
      { ask: ['What makes a sled go fast?', 'What makes a sled fast?'],
        say: ['Wax, mostly. Lean into the turns. And never sled with your mouth open. I learned that last one the hard way.', 'Wax. Lean in. Keep your mouth shut!'] },
      { ask: ['What was your first sled?', 'What was your first sled?'],
        say: ['A door. My mom\'s door. She was not happy. It was very fast.', 'My mom\'s door. She was cross. It was fast.'] },
      { ask: ['Does Elka\'s dad know she\'s here?', 'Does Ulf know?'],
        say: ['Ulf wrote me asking if she\'s eating. I wrote back "snow." He didn\'t laugh.', 'Ulf asked if she eats. I said snow. No laugh.'] },
      { idle: [['Hey. What is it?', 'Hey. What?'], ['Good snow today. Go on.', 'Good snow. Go on.']] },
      { bye: [['Lean into the turns.', 'Lean into the turns.'], ['See you at the bottom.', 'See you at the bottom.']] },
      { bark: true, say: ['Whoosh. ...Sorry. Habit.', 'Whoosh!'] },
    ],

    // ---------------------------------------------------------------- Fergus, Sigrid and Hjalmar (thawed on the roads)
    f_fergus: [
      // (the medal: Fergus made the tail mitten, q_f_warm's wm_medal)
      { if: 'quest f_warm done', once: true,
        say: ["Is the tail mitten still on? It's not? ...I'll make another. Longer. With a string.", 'Is the tail mitten on? No? I will make another.'],
        re: [
          { t: ['It fell off on the ice.', 'It fell off on the ice.'],
            say: [['f_fergus', 'They do. Tails wag. I\'ll sew on a string and a bell, so you can hear it go.', 'Tails wag. I will add a string and a bell.']] },
          { t: ['It was very warm, Fergus.', 'It was very warm.'], tone: 'kind', f: 0.5,
            say: [['f_fergus', 'Of course it was. It\'s a Fiddlesticks. My granny\'s pattern, with a hole for the spikes.', 'Of course. Granny\'s pattern. A hole for spikes.']] },
        ] },
      { say: ["Mittens! Warm mittens! ...Oh, it's you! My hero. How are your paws? Cold? Let me see.", 'Mittens! Oh, my hero! Are your paws cold?'],
        re: [
          { t: ['My paws are fine, Fergus.', 'My paws are fine.'],
            say: [['f_fergus', 'Fine paws today, frozen paws tomorrow. I\'ve seen it happen. I was it happening.', 'Fine today. Frozen tomorrow. I was frozen once.']] },
          { t: ['How are your feet now?', 'How are your feet?'],
            say: [['f_fergus', 'Still asleep. Snoring, a bit. I stood on that road for a whole month, you know.', 'Still asleep. I stood on that road a month.']] },
        ] },
      { say: [['Mittens! Left ones, right ones, and one very confused middle one!', 'Mittens! Left ones and right ones!'],
        ['A dragon with mittens. Now that would be good for business.', 'A dragon in mittens. Great for business!']] },
      { ask: ['What is a middle mitten for?', 'What is a middle mitten?'],
        say: ['Nobody knows. That\'s what makes it special. It sells better than the left ones.', 'Nobody knows. That is what makes it special.'] },
      { ask: ['Who taught you to knit?', 'Who taught you to knit?'],
        say: ['My granny knitted mittens for half of Frostreach. She said a mitten is a hand being hugged. I only sell them. But I think about that a lot.', 'Granny. She said a mitten is a hugged hand.'] },
      { idle: [['Mittens? What is it?', 'Mittens? What?']] },
      { bye: [['Keep your paws covered!', 'Keep your paws covered!']] },
      { bark: true, say: ['Mittens! Warm mittens! Mittens for paws, claws and hands!', 'Mittens! For paws and claws!'] },
    ],
    f_sigrid: [
      { if: 'quest f_juniper done', once: true,
        say: ['Juniper put the inside of the Glacier Maze on her map at last. I drew in the warnings myself, in red.', 'I drew the maze inside on her map. In red.'], ref: 'f_glacier',
        re: [
          { t: ['How many warnings?', 'How many warnings?'],
            say: [['f_sigrid', 'Forty-one. One of them just says no, underlined three times.', 'Forty-one. One just says no.']] },
          { t: ['Did you draw where you froze?', 'Did you draw where you froze?'],
            say: [['f_sigrid', 'A little ice cube with my name on it. Juniper says it\'s very lifelike.', 'A little ice cube with my name.']] },
        ] },
      { say: ['I went into the Glacier Maze looking for the old furnace. I found a block of ice instead. I was the block of ice.', 'I looked for the furnace. I turned into ice.'], ref: 'f_glacier',
        re: [
          { t: ['Were you scared in there?', 'Were you scared?'],
            say: [['f_sigrid', 'Only after. While it was happening I was ice. Ice isn\'t scared of anything.', 'Only after. Ice is not scared of anything.']] },
          { t: ['What will you explore next?', 'What will you explore next?'],
            say: [['f_sigrid', 'The kitchen. It\'s very warm, and nothing in it has ever frozen me. Yet.', 'The kitchen. It is warm. Nothing froze me there.']] },
        ] },
      { say: [["Next time I explore a glacier, I'm taking a sandwich, and a friend who breathes fire.", 'Next time: a sandwich, and a fire friend.']] },
      { ask: ['Why do you explore?', 'Why do you explore?'],
        say: ['My dad did. He said every cave has one good surprise in it. The Glacier Maze had me in it. I suppose I was the surprise.', 'Dad said every cave has a surprise. I was it!'], ref: 'f_glacier' },
      { ask: ['Is Hjalmar all right?', 'Is Hjalmar all right?'],
        say: ['He finished his sneeze. That\'s all he wanted. He\'s been very happy since.', 'He finished his sneeze. He is very happy.'] },
      { idle: [['Hi, dragon. What is it?', 'Hi. What?']] },
      { bye: [['Take a sandwich. Always take a sandwich.', 'Take a sandwich.']] },
    ],
    f_hjalmar: [
      { say: ["I froze mid-sneeze. I've finished the sneeze now. It was worth the wait.", 'I froze mid-sneeze. I finished it now.'],
        re: [
          { t: ['Bless you, Hjalmar.', 'Bless you!'], tone: 'kind', f: 0.5,
            say: [['f_hjalmar', 'Thank you! A month late, but thank you. Nobody else said it.', 'Thank you! A month late. Nobody else said it.']] },
          { t: ['Where did Sigrid go, in there?', 'Where did Sigrid go?'],
            say: [['f_hjalmar', 'Left. I went achoo. That was the whole problem.', 'Left. I went achoo. That was the problem.']] },
        ] },
      { say: [['Achoo! Sorry. That one was left over.', 'Achoo! Sorry. A spare one.']] },
      { ask: ['Do you sneeze in every cave?', 'Do you sneeze in caves?'], ref: 'f_glacier',
        say: ['Every cave in the north. It\'s a hobby. A loud one. The echoes are wonderful.', 'Every one. It is my hobby. Great echoes.'] },
      { idle: [['Achoo. Sorry. Yes?', 'Achoo. Yes?']] },
      { bye: [['Bless you. In advance.', 'Bless you. In advance.']] },
      { bark: true, say: ['Achoo!', 'Achoo!'] },
    ],

    // ---------------------------------------------------------------- Elka (from the Lodge) and Juniper, up north
    // Elka sledded up the pass the morning after it cracked and has been on Soren's hill since. Before her race offer
    // (f_gap, "Ash! You came north too!") her goggles are frosted and she never stops long enough to see who it is.
    elka: [
      { if: 'quest f_sled done', once: true,
        say: ["You beat me down the whole Windscour. I've told Soren it was the wax. It wasn't the wax.", 'You beat me. I said it was the wax. It was not.'],
        re: [
          { t: ['It was a little bit the wax.', 'It was the wax.'], tone: 'kind', f: 0.5,
            say: [['elka', 'Thank you. I\'m going to tell everyone you said so. Loudly.', 'Thank you. I will tell everyone.']] },
          { t: ['Your dad says supper is at six.', 'Supper is at six.'], if: 'said ulf_supper', then: ['said elka_supper'],
            say: [['elka', 'Every night! He\'s said that since I was four. ...Tell him I\'m coming. Tell him which six.', 'He always says that. Tell him: which six.']] },
        ] },
      { if: 'stage<f_gap !quest f_sled started',
        say: ["(Elka skids to a stop in a fan of snow. Her goggles are frosted white.) Out of the way! Oh. Sorry, whoever you are! Can't see a thing!", "(Her goggles are frosted.) Sorry! Can't see a thing!"],
        re: [
          { t: ['Elka, wipe your goggles.', 'Wipe your goggles!'],
            say: [['elka', 'Can\'t! If I stop I\'ll lose my best time! Talk to me later, stranger!', 'Can\'t stop! Talk later, stranger!']] },
          { t: ['Nice turn on that last bit.', 'Nice turn!'],
            say: [['elka', 'Thanks, stranger! I know! Turns are my best thing!', 'Thanks! Turns are my best thing!']] },
        ] },
      { say: [['Soren says the snow up here is the fastest in the world. Soren is right.', 'The snow here is the fastest.'],
        ['I have never once been cold. All right. Once. All right. Now.', 'I am never cold. All right, now.']] },
      { ask: ['Does Ulf know where you are?', 'Does Ulf know?'], if: 'seen sl_offer',
        say: ['He knows I\'m somewhere. That\'s nearly the same. ...I left a note.', 'He knows I am somewhere. I left a note.'] },
      { ask: ['Do you miss the Lodge?', 'Do you miss the Lodge?'], if: 'seen sl_offer',
        say: ['The fire. And the sheep, a bit. Don\'t tell Dad about the sheep.', 'The fire. The sheep, a bit. Shh.'] },
      { idle: [['Quick! What?', 'Quick! What?'], ['Hurry up, the snow is melting. It isn\'t. Hurry up.', 'Hurry up!']] },
      { bye: [['Bye! Lean into the turns!', 'Bye! Lean in!']] },
    ],
    // Juniper, found on the Shiversea floes (x2_people's own talk out there) and then at her Map Tent in Hearthold
    juniper: [
      { if: 'said juniper_rook flag f_done', once: true,
        say: ['I told Rook myself, in the end. About the floe. He laughed for a whole page. Then he drew me a boat.', 'I told Rook myself. He laughed. Then drew me a boat.'],
        re: [
          { t: ['A good boat?', 'A good boat?'],
            say: [['juniper', 'It has legs. In case of ice. Rook thinks of everything, wrongly.', 'It has legs. For ice. Rook is wrong, kindly.']] },
          { t: ['Rook gets lost in his own house.', 'Rook gets lost at home.'], tone: 'silly',
            say: [['juniper', 'He does! I drew him a map of it. He lost the map.', 'He does! I drew him a map. He lost it.']] },
        ] },
      { if: 'flag f_northmaps',
        say: ['My maps are on every wall now. The insides are guesses. Sigrid says the Glacier Maze one is a bad guess.', 'My maps are on every wall. The insides are guesses.'],
        re: [
          { t: ["I won't tell Rook you got lost.", "I won't tell Rook."], tone: 'kind', f: 0.75, then: ['said juniper_rook'],
            say: [['juniper', 'I didn\'t get lost! The ice moved! ...Thank you, though.', 'I did not get lost! The ice moved! Thanks.']] },
          { t: ['Can you map the inside of the mountain?', 'Map the mountain inside?'],
            say: [['juniper', 'Not from out here. Come back and tell me every turn. Slowly. I\'ll have the ink ready.', 'Tell me every turn. I will get the ink.', { ref: 'f_crown' }]] },
        ] },
      { say: [['The floe I was stuck on is the best map I ever made. I know every crack in it. All four times.', 'I know every crack in that floe.']] },
      { ask: ['What is the best thing you mapped?', 'Your best map?'],
        say: ['The floe I was stuck on. Four times. It\'s very small, and I know it better than my own boots.', 'The floe. Four times. I know it well.'] },
      { idle: [['Hold still, I\'m drawing you. What is it?', 'Hold still. What?']] },
      { bye: [['Watch where the ice is thin. I marked it in blue.', 'Mind the thin ice.']] },
    ],

    // ================================================================ Rimeholm (frozen; each person talks once thawed)
    // ---------------------------------------------------------------- Grandmother Ylva, the knitter on the bell tower
    // Sleepy, kind, a little sly; calls Ash "dear". She saw the white moth from the top of the tower and shouted down to
    // Tollef; she gave Ash her long red scarf and sent him east to the Wind Monks. Rimeholm, One Thaw at a Time (f_rime)
    // is hers.
    f_ylva: [
      // f_rime's offer (A3a's thaw scene may start the quest first)
      { if: 'flag f_ylva !quest f_rime started', option: ['Who else is still frozen?', 'Who else is frozen?'], scene: 'rm_offer' },
      { if: 'quest f_rime done', once: true, fact: 'f3s_rimeholm=warm',
        say: ["Everyone's thawed, dear. Even old Rasmus. He's started making puns again. I almost miss the ice.", 'Everyone is thawed. Rasmus makes puns again.'],
        re: [
          { t: ['What was the pun?', 'What was the pun?'],
            say: [['f_ylva', 'Something about a forge being a hearth with a job. He is very pleased with it. He has told it four times.', 'A forge is a hearth with a job. He told it four times.']] },
          { t: ["It's good to hear the bell.", 'The bell is back.'], tone: 'kind', f: 0.5,
            say: [['f_ylva', 'Tollef rings it every morning, and the whole village comes out to complain. It\'s lovely.', 'Everyone comes out to complain. It is lovely.']] },
        ] },
      // what Ash told Tollef about the moth and the bell (said tollef_bell)
      { if: 'said tollef_bell', once: true,
        say: ['Tollef rings the bell twice every morning now. He says a dragon told him the moth hated it. Was that you, dear?', 'Tollef rings twice now. A dragon told him. You?'],
        re: [
          { t: ['It was me. She did hate it.', 'It was me.'],
            say: [['f_ylva', 'Then ring away, Tollef. ...My poor ears. Still. Ring away.', 'Then ring away. My poor ears. Still.']] },
          { t: ['Bells mean morning, Ylva.', 'Bells mean morning.'], tone: 'kind', f: 0.5,
            say: [['f_ylva', 'They do. And mornings mean breakfast. Come in, dear. I\'ll put the kettle on.', 'And mornings mean breakfast. Come in, dear.']] },
        ] },
      { if: 'choice f_hush=scarf', once: true,
        say: ["You gave my scarf to a moth? ...Good. I'll knit you another one. Longer.", "You gave my scarf to a moth? Good! I'll knit another."],
        re: [
          { t: ['She looked so cold.', 'She looked so cold.'], tone: 'kind', f: 0.5,
            say: [['f_ylva', 'Then it went where it was needed. That\'s what scarves are for, dear.', 'Then it went where it was needed.']] },
          { t: ['Can the new one have a dragon?', 'With a dragon on?'],
            say: [['f_ylva', 'A dragon on a scarf. I\'ll need more red. And a pattern. And a nap first.', 'A dragon! More red wool. And a nap first.']] },
        ] },
      // after the winter: she watched him climb (said ylva_wave)
      { if: 'said ylva_wave flag f_done', once: true,
        say: ['I saw you wave from the very top! A tiny red speck. Tollef rang the bell for you, and the whole village waved back.', 'I saw you wave from the top! We all waved back.'],
        re: [
          { t: ['I could see your tower.', 'I could see your tower.'], tone: 'kind', f: 0.5,
            say: [['f_ylva', 'And I could see you. We were looking at each other the whole way. That\'s the best kind of far.', 'We looked at each other all the way. The best far.']] },
          { t: ['Did Tollef hear me shout?', 'Did Tollef hear me?'], tone: 'silly',
            say: [['f_ylva', 'Tollef hasn\'t heard anything since the year he was nine, dear. He rang it anyway.', 'Tollef hears nothing, dear. He rang it anyway.']] },
        ] },
      { if: 'flag f_done',
        say: ['The mountain has stopped snoring. Some nights I put my spyglass up just to check. Silly old woman.', 'The mountain stopped snoring. I still check.'], ref: 'f_crown',
        re: [
          { t: ['She hums now, instead.', 'She hums now.'], if: 'choice f_glaciar=free',
            say: [['f_ylva', 'Hums. Yes. I heard it on the wind and thought it was Tollef. It was much more in tune.', 'I heard it. I thought it was Tollef. It was in tune.']] },
          { t: ['She is only sleeping, Ylva.', 'She is only sleeping.'], if: 'choice f_glaciar=defeat',
            say: [['f_ylva', 'Then she\'s resting her eyes. I know all about that, dear. Go back for her when you can.', 'Resting her eyes. Go back for her, dear.']] },
          { t: ['Can I look through it?', 'Can I look?'],
            say: [['f_ylva', 'Climb up whenever you like. Mind the wool on the top step. It\'s been there since spring.', 'Climb up any time. Mind the wool.', { ref: 'f_bell_tower' }]] },
        ] },
      { if: 'quest f_rime active !quest f_rime done', fact: 'f3s_rimeholm=frozen',
        say: ['Start with whoever is shouting, dear. Tollef is always shouting. Even frozen, I think.', 'Start with the shouty one, dear.'],
        re: [
          { t: ['Who is the hardest to reach?', 'Who is hardest?'],
            say: [['f_ylva', 'Oskar, behind the old lookout bars. And Rasmus, under all that frost. Leave Rasmus till last.', 'Oskar, behind bars. And Rasmus. Do him last.']] },
          { t: ['Why did they all freeze at once?', 'Why all at once?'],
            say: [['f_ylva', 'The moth came over in one breath. One breath, and a whole village stopped where it stood.', 'The moth breathed once. The whole village stopped.']] },
        ] },
      // her mountain, after she wakes (said ylva_wave: she watches the climb)
      { if: 'flag f_ylva !flag f_hush_done', ref: 'f_crown',
        say: ["I keep looking at that mountain through my spyglass. It's still snoring, dear. Louder at night.", 'I watch the mountain. It still snores.'],
        re: [
          { t: ['Will you watch me go up?', 'Will you watch me?'], tone: 'kind', f: 0.75, then: ['said ylva_wave'],
            say: [['f_ylva', 'Every step, dear. Through the spyglass. Wave when you get to the top. I\'ll wave back.', 'Every step. Wave from the top. I will wave back.']] },
          { t: ['What did the Wind Monks know?', 'What did the monks know?'],
            say: [['f_ylva', 'They went up every spring, with their kites. Brother Pennant held the strings. Ask him.', 'They went up every spring. Ask Brother Pennant.', { ref: 'f_skyreach' }]] },
        ] },
      // her moment: the scarf she knits every child of Rimeholm
      { if: 'flag f_ylva',
        say: ["You've my long scarf, dear, but that one was for the mountain. Every child of Rimeholm gets a proper one from me. What color?", 'Every child here gets a scarf from me. What color?'],
        re: [
          { t: ['Red, like the yarn on the tower.', 'Red, like your yarn.'], f: 0.75,
            say: [['f_ylva', 'Red it is. Long, too. You\'ve a long tail.', 'Red it is. Long. You have a long tail.']] },
          { t: ['Blue. Like my new fire.', 'Blue, like my fire.'], if: 'power blaze', f: 0.5,
            say: [['f_ylva', 'Blue. Bold. I like a bold child. It will take longer. Blue wool is shy.', 'Blue! Bold. It takes longer. Blue wool is shy.']] },
          { t: ["I'm not from Rimeholm, though.", "I'm not from here."],
            say: [['f_ylva', 'You thawed it, dear. That makes you from here. Now. What color?', 'You thawed it. You are from here now.']] },
        ] },
      { say: [["I wasn't frozen, dear. I was resting my eyes.", "I wasn't frozen, dear. I was resting my eyes."],
        ["I knitted the whole time I was frozen. In my head. It's a very long scarf.", 'I knitted in my head. A very long scarf.']] },
      // topics
      { ask: ['How did Tollef hear you shout?', 'How did Tollef hear you?'],
        say: ['He didn\'t. He saw me waving my knitting. Forty years next to a bell, dear. He reads waving.', 'He saw me wave my knitting. He reads waving.'] },
      { ask: ['Why knit on top of the tower?', 'Why knit up there?'],
        say: ['Best light in Rimeholm. And nobody can ask me to do anything up there.', 'The best light. And nobody bothers me.'] },
      { ask: ['What did your granny say about the chapel?', 'What did your granny say?'], if: 'clue f3_chapel !solved snow_mother',
        say: ['That the Snow Mother had horns. Like yours, dear. Only made of ice.', 'The Snow Mother had horns. Like yours. But ice.'] },
      { idle: [['Mind the wool, dear. What is it?', 'Mind the wool. What?'], ["Sit. I'm only counting stitches.", 'Sit. I am counting stitches.']] },
      { bye: [['Wrap up warm, dear.', 'Wrap up warm.'], ['Come back before I finish this row.', 'Come back soon.']] },
      { bark: true, say: ['Knit one, purl one. Knit one, purl one. Oh, bother. Dropped one.', 'Knit one, purl one. Oops.'] },
    ],

    // ---------------------------------------------------------------- Tollef the Bellringer (very deaf, very loud)
    // The bell knows the first verse of the Snow Mother's Song. Hush turned round at the sound of his bell (bells mean
    // morning, she says, and the Mother hates morning).
    f_tollef: [
      { if: 'flag f_v1', once: true, say: ['I SANG THE FIRST VERSE! FROM THE BELL! THE FISH CAME UP TO LISTEN! I THINK!', 'I SANG THE FIRST VERSE! THE FISH LISTENED!'],
        re: [
          { t: ['You sang it beautifully.', 'You sang it well.'], tone: 'kind', f: 0.5,
            say: [['f_tollef', 'WHAT? BEAUTIFULLY? I KNOW! I COULD FEEL IT IN MY TEETH!', 'BEAUTIFULLY? I FELT IT IN MY TEETH!']] },
          { t: ['Where are the other two verses?', 'Where are the others?'],
            say: [['f_tollef', 'NOT IN MY BELL! ASK EIDER IN HEARTHOLD! HE WROTE THEM DOWN! TWICE!', 'ASK EIDER! HE WROTE THEM DOWN!']] },
        ] },
      // the white moth hated his bell (said tollef_bell: Ylva hears about it)
      { if: 'flag f_hush_done', fact: 'f3s_hush=gone',
        say: ['THEY SAY THE BIG WHITE MOTH IS GONE! GOOD RIDDANCE! I RANG THE BELL ALL MORNING!', 'THE BIG MOTH IS GONE! I RANG ALL MORNING!'],
        re: [
          { t: ['She hated your bell, Tollef.', 'She hated your bell.'], then: ['said tollef_bell'],
            say: [['f_tollef', 'HATED MY BELL? ...THEN I\'LL RING IT TWICE! EVERY MORNING! FOREVER!', 'HATED IT? THEN I\'LL RING TWICE! FOREVER!']] },
          { t: ['(Give him a big thumbs up.)', '(Thumbs up.)'],
            say: [['f_tollef', 'THUMBS UP! I CAN HEAR THAT ONE!', 'THUMBS UP! I CAN HEAR THAT!']] },
        ] },
      // his moment: what does the bell sound like?
      { if: 'flag f_thaw_f_tollef',
        say: ["WHAT DOES MY BELL SOUND LIKE? TELL ME! I CAN'T HEAR IT ANY MORE!", 'WHAT DOES MY BELL SOUND LIKE? TELL ME!'],
        re: [
          { t: ['Like morning.', 'Like morning.'], f: 0.75,
            say: [['f_tollef', 'MORNING! YES! THAT\'S WHAT MY DAD SAID! HE RANG IT BEFORE ME!', 'MORNING! MY DAD SAID THAT TOO!']] },
          { t: ['Like a giant saying hello.', 'A giant saying hello.'], f: 0.5,
            say: [['f_tollef', 'HELLO, GIANT! HA! I LIKE THAT! I\'M GOING TO SAY THAT EVERY MORNING!', 'HELLO, GIANT! HA! I LIKE IT!']] },
          { t: ['Very, very loud.', 'Very loud.'], tone: 'silly',
            say: [['f_tollef', 'WHAT?', 'WHAT?']] },
        ] },
      { if: 'quest f_song active !flag f_v1', ref: 'f3s_bell',
        say: ["THE BELL KNOWS THE FIRST VERSE! CLIMB UP TO THE TOP AND I'LL RING IT FROM DOWN HERE! LOUDLY!", 'CLIMB UP TO THE BELL! I WILL RING IT!'] },
      { say: [["WHAT? OH! HELLO! I CAN'T HEAR YOU, I'VE BEEN STANDING NEXT TO A BELL FOR FORTY YEARS!", "WHAT? HELLO! I CAN'T HEAR! TOO MANY BELLS!"],
        ['I RING IT EVERY MORNING! THE FISH HATE IT!', 'I RING IT EVERY MORNING! FISH HATE IT!']] },
      // topics
      { ask: ['Who rang the bell before you?', 'Who rang it before you?'],
        say: ['MY DAD! AND HIS MUM! THE BELL IS OLDER THAN THE VILLAGE! SOMETIMES I THINK IT RINGS ME!', 'MY DAD! THE BELL IS OLDER THAN THE VILLAGE!'] },
      { ask: ['Did Ylva knit you earmuffs?', 'Ylva knit you earmuffs?'],
        say: ['SHE DID! I CAN\'T HEAR WITH THEM! I CAN\'T HEAR WITHOUT THEM EITHER! I WEAR THEM FOR THE WARM!', 'YES! I CAN\'T HEAR EITHER WAY! THEY\'RE WARM!'] },
      { idle: [['WHAT? GO ON!', 'WHAT? GO ON!'], ['SPEAK UP! OR WAVE!', 'SPEAK UP! OR WAVE!']] },
      { bye: [['BYE! WAVE IF YOU NEED ME!', 'BYE! WAVE IF YOU NEED ME!']] },
      { bark: true, say: ['WHAT? WHO SAID THAT? NOBODY? HELLO, NOBODY!', 'WHAT? WHO SAID THAT?'] },
    ],

    // ---------------------------------------------------------------- Saga, the fisher girl on the quay
    // Brisk and competitive. Froze with a fish on her line, looking up. Her mom is away at sea; her dad learned fishing
    // from Dell Fisk (Act I, the Lake King).
    f_saga: [
      // her first talk after the thaw (she knows only that a dragon thawed them)
      { if: 'flag f_thaw_f_saga', once: true,
        say: ["You're the dragon who thawed us. I'm Saga. I fish. I'm better at it than you. Probably.", "I'm Saga. I fish. Better than you."],
        re: [
          { t: ["I've never been fishing.", "I've never fished."],
            say: [['f_saga', 'Never? Then I\'m better at it than you. Definitely. Want to learn? It\'s mostly waiting, then shouting.', 'Never? Then I am better. It is waiting, then shouting.']] },
          { t: ['You froze looking up.', 'You froze looking up.'], if: 'clue f3_looking_up',
            say: [['f_saga', 'Course I did. Something wider than the sky came over. You\'d look up too. Then I couldn\'t look down.', 'Something huge came over. Then I could not look down.']] },
        ] },
      { if: 'quest lakeking done', once: true,
        say: ["You caught the Lake King? The Lake King? Dad says that's not possible. Dad's wrong a lot.", 'You caught the Lake King? Dad says no way!'],
        re: [
          { t: ['He fought me for an hour.', 'He fought for an hour.'],
            say: [['f_saga', 'An hour? I\'d have had him in half that. ...Probably. Fine. Forty minutes.', 'An hour? I would take half. Fine. Forty minutes.']] },
          { t: ['Dell helped. Sort of.', 'Dell helped. Sort of.'],
            say: [['f_saga', 'Dell? Then the boat sank. Did the boat sink? The boat always sinks.', 'Dell? Did the boat sink? It always sinks.']] },
        ] },
      // her moment: her mom's red boat
      { if: 'flag f_thaw_f_saga',
        say: ["See the red boat at the end of the quay? That's my mom's. She's away at sea. I fish where she'll see me first, coming home.", "That red boat is Mom's. I fish where she will see me."],
        re: [
          { t: ['When does she come home?', 'When is she home?'], f: 0.5,
            say: [['f_saga', 'When the fish say. ...Soon. The ice is going. Soon.', 'When the fish say. Soon. The ice is going.']] },
          { t: ['My mom watches the mountain for me.', 'My mom watches for me.'], tone: 'kind', f: 0.75,
            say: [['f_saga', 'Then you know. Somebody has to be the one who stays and looks out. I\'m good at it. Mostly.', 'Then you know. Someone stays and looks out.']] },
        ] },
      { say: [['Bet I catch more than you before the bell. Not that you fish.', 'Bet I catch more than you.'],
        ["Race you to the end of the quay. Mind the holes. I won't.", "Race you! Mind the holes. I won't."]] },
      // topics
      { ask: ['Who taught you to fish?', 'Who taught you to fish?'],
        say: ['My dad. Dell Fisk taught him. Dell is famous up here. Mostly for losing boats. He lost three in one week.', 'Dad. Dell taught him. Dell loses boats.'] },
      { ask: ['Is the ice safe to walk on?', 'Is the ice safe?'],
        say: ['On the quay, mostly. Out past the floes, never. The sea up here moves when it feels like it.', 'On the quay, mostly. Past the floes, never.', { ref: 'f3s_floes' }] },
      { idle: [['Quick, I have a line out. What?', 'Quick! What?'], ['Shh. You\'ll scare the fish. Go on.', 'Shh. The fish. Go on.']] },
      { bye: [['Bye. Mind the holes.', 'Bye. Mind the holes.'], ['Come back when you can fish.', 'Come back and fish.']] },
    ],

    // ---------------------------------------------------------------- Sigrun the Cook, the smokehouse
    // No-nonsense, feeds everyone; Hilde's oldest friend (they argue about salt). Her hot soup gives Mumble back his roar.
    f_sigrun: [
      // her first talk after the thaw
      { if: 'flag f_thaw_f_sigrun', once: true,
        say: ["You. Dragon. Sigrun. I cook, you sit. That's how this works. Sit.", 'I am Sigrun. I cook. You sit.'],
        re: [
          { t: ["I'm not hungry, thanks.", "I'm not hungry."],
            say: [['f_sigrun', 'Nobody\'s not hungry. You\'re all tail and no supper. Sit.', 'Nobody is not hungry. You are all tail. Sit.']] },
          { t: ["What's in the pot?", "What's in the pot?"],
            say: [['f_sigrun', 'Fish, onions, and a month of waiting. It\'s had a long time to think about itself.', 'Fish, onions, and a month of waiting.']] },
        ] },
      { if: 'quest f_mumble done', once: true,
        say: ['I heard that yeti roar from here. My soup did that. Tell everyone. Tell Hilde twice.', 'I heard that yeti roar! My soup did that!'],
        re: [
          { t: ['He drank the whole pot.', 'He drank it all.'],
            say: [['f_sigrun', 'Course he did. A good soup leaves nothing in the pot. Or in the yeti.', 'Course. A good soup leaves nothing in the pot.']] },
          { t: ["I'll tell Hilde twice.", "I'll tell Hilde twice."],
            say: [['f_sigrun', 'Three times. Once more for the salt.', 'Three times. Once more for the salt.']] },
        ] },
      // what Hilde said (said hilde_sigrun, set at the Warm Mitten)
      { if: 'said hilde_sigrun', once: true,
        say: ['Hilde sent you? ...She did. She\'ll have been fretting for a month. Did she say anything about her soup?', 'Hilde sent you? Did she say anything about her soup?'],
        re: [
          { t: ['She says it still needs salt.', 'It still needs salt.'], tone: 'kind', f: 0.75,
            say: [['f_sigrun', 'Ha! That\'s her, all right. Tell her I\'m coming down to sort it out. With a sack of salt.', 'Ha! That is her. Tell her I am coming. With salt.']] },
          { t: ['She misses you terribly.', 'She misses you.'],
            say: [['f_sigrun', 'Course she does. Nobody else tells her the truth about her cooking.', 'Course. Nobody else tells her the truth.']] },
        ] },
      // her moment
      { if: 'flag f_thaw_f_sigrun',
        say: ['Hilde puts honey in her soup. Honey! In soup. What would you put in yours?', 'Hilde puts honey in soup! What would you put in?'],
        re: [
          { t: ['Salt. Lots of salt.', 'Lots of salt.'], f: 1,
            say: [['f_sigrun', 'Ha! You\'ve been listening. Good. Good dragon.', 'Ha! You listened. Good dragon.']] },
          { t: ["Whatever's in the pot already.", "Whatever's in the pot."], f: 0.5,
            say: [['f_sigrun', 'That\'s a cook\'s answer. You can come back.', 'A cook\'s answer. You can come back.']] },
          { t: ['A little bit of fire.', 'A bit of fire.'], f: 0.5,
            say: [['f_sigrun', 'A dragon\'s soup. That\'s cheating. ...Do it again. Over here. Under this one.', 'Dragon soup is cheating. Do it again. Here.']] },
        ] },
      { say: [['Fish soup today. Fish soup yesterday. Tomorrow, a surprise. It\'s fish soup.', 'Fish soup today. Tomorrow, fish soup.'],
        ['Hilde at the Warm Mitten stole my soup recipe. I taught it to her. Same thing.', 'Hilde stole my soup. I taught her.']] },
      // topics
      { ask: ['Who do you cook for?', 'Who do you cook for?'],
        say: ['Everyone. The winter the boats froze in, I cooked for this whole village. Every night. Nobody went hungry. Nobody complained, either. They knew better.', 'Everyone. One winter I fed the whole village.'] },
      { ask: ['Can rocks really go in soup?', 'Do rocks go in soup?'],
        say: ['A cook over the pass puts rocks in? Hm. Rocks hold heat. Hm. Don\'t tell Hilde I said hm.', 'Rocks hold heat. Hm. Do not tell Hilde.'] },
      { idle: [['Sit. What?', 'Sit. What?'], ['Mind the pot. Go on.', 'Mind the pot.']] },
      { bye: [['Off you go. Bring the bowl back.', 'Bring the bowl back.']] },
      { bark: true, say: ['Have you eaten? Sit. Eat. Have you eaten?', 'Have you eaten? Sit!'] },
    ],

    // ---------------------------------------------------------------- Little Bo, and Steve the snowball
    f_bo: [
      // his first talk after the thaw (said bo_pim: Pim's saved cocoa)
      { if: 'flag f_thaw_f_bo', once: true,
        say: ["Hi, dragon! I'm Bo. You met Steve already. Say hi again, Steve.", "Hi! I'm Bo. Say hi again, Steve."],
        re: [
          { t: ['Hi again, Steve.', 'Hi again, Steve.'],
            say: [['f_bo', 'He says hi. He says you\'re very warm. He doesn\'t like warm. Stand back a bit.', 'He says you are warm. He hates warm.']] },
          { t: ['Pim saved you a month of cocoa.', 'Pim saved your cocoa.'], if: 'said bo_pim',
            say: [['f_bo', 'A month? A whole month of Sundays? Steve, we\'re rich.', 'A month of cocoa? Steve, we are rich!']] },
        ] },
      { if: 'choice f_glaciar_home=stay', once: true, fact: 'f3s_glaciar=free',
        say: ['The Snow Mother is your auntie? Can Steve meet her? Steve is a snowball. She will like him.', 'Your auntie is the Snow Mother? Can Steve meet her?'],
        re: [
          { t: ['She would love Steve.', 'She would love Steve.'], tone: 'kind', f: 0.5,
            say: [['f_bo', 'I knew it. Steve\'s going to be her favorite. Don\'t tell Saga.', 'I knew it. Steve will be her favorite.']] },
          { t: ['She might eat him.', 'She might eat him.'], tone: 'silly',
            say: [['f_bo', 'She would not! ...Would she? Steve, stay behind me.', 'She would not! Steve, stay behind me.']] },
        ] },
      { say: [['Saga says Steve is just snow. Steve is not just snow. Steve is Steve.', 'Saga says Steve is just snow. He is not.'],
        ["I'm teaching Steve to fish. He keeps sinking. Then he comes back smaller.", 'I am teaching Steve to fish. He sinks.']] },
      // topics
      { ask: ['Why is he called Steve?', 'Why is he Steve?'],
        say: ['He looks like a Steve. Look at him. That is a Steve face.', 'He looks like a Steve. Look at him.'] },
      { ask: ['What did you see that night?', 'What did you see?'], if: 'clue f3_bo_points',
        say: ['Everyone was pointing up when the bell went, so I pointed up too. Then I was a statue. A pointing one.', 'Everyone pointed up, so I did. Then I froze.'] },
      { ask: ['Who is your best friend?', 'Who is your best friend?'],
        say: ['Steve. And Pim, in Hearthold. She still makes me pay. Steve never does.', 'Steve. And Pim. She makes me pay.'] },
      { idle: [['Steve wants to know what.', 'Steve says: what?']] },
      { bye: [['Bye! Steve says bye too. He means it.', 'Bye! Steve says bye.']] },
      { bark: true, say: ['Steve wants to go sledding. Steve always wants to go sledding.', 'Steve wants to go sledding.'] },
    ],

    // ---------------------------------------------------------------- Nils the Goatherd, and Nisse the goat
    // Gentle; lives with Nisse on a sea-stack whose bridge fell. Nisse says one word.
    f_nils: [
      // his first talk after the thaw
      { if: 'flag f_thaw_f_nils', once: true,
        say: ['She likes you. That was a friendly headbutt. The unfriendly ones are much lower.', 'She likes you. That was a friendly headbutt.'],
        re: [
          { t: ['How do you get off this rock?', 'How do you get off?'],
            say: [['f_nils', 'I don\'t, mostly. The bridge fell in the spring. Nisse likes it better this way. Nobody visits.', 'I don\'t. The bridge fell. Nisse likes it.']] },
          { t: ['Does she headbutt everybody?', 'Does she headbutt all?'],
            say: [['f_nils', 'Only the people she likes. And the post. She hates the post.', 'Only friends. And the post. She hates the post.']] },
        ] },
      { if: 'quest duchess done', once: true,
        say: ['A goat over the pass called Duchess? Is she single? Nisse is asking. Nisse asks about every goat.', 'A goat called Duchess? Nisse wants to know.'],
        re: [
          { t: ['She eats hats.', 'She eats hats.'],
            say: [['f_nils', 'So does Nisse! ...Nisse, sit down. She\'s gone all pink round the ears.', 'So does Nisse! She has gone pink.'], ['f_nisse', 'Meh.', 'Meh.']] },
          { t: ["She's very bossy.", "She's bossy."],
            say: [['f_nils', 'Nisse says good. Nisse likes a goat who knows her own mind. She can\'t stand a nice goat.', 'Nisse says good. She likes a bossy goat.']] },
        ] },
      // his moment
      { if: 'flag f_thaw_f_nils',
        say: ['Do you think Nisse is lonely out here on her rock? I worry. She says she isn\'t. She would say that.', 'Is Nisse lonely out here? I worry.'],
        re: [
          { t: ['She has you.', 'She has you.'], tone: 'kind', f: 0.75,
            say: [['f_nils', 'She has me. She\'s still deciding whether that counts. Nine years now.', 'She has me. She is still deciding. Nine years.']] },
          { t: ['Get her a goat friend.', 'Get her a friend.'], f: 0.5,
            say: [['f_nils', 'I tried. She ate its hat. They\'re not speaking.', 'I tried. She ate its hat.']] },
        ] },
      { say: [["Nisse ate the post again. Oskar says he's never coming out here again. He says that every week.", 'Nisse ate the post again. Oskar is cross.'],
        ['Goats on a sea-stack. Seemed like a good idea. Then the bridge fell. Still a good idea, says Nisse.', 'Goats on a rock in the sea. Nisse likes it.']] },
      { ask: ['How did you meet Nisse?', 'How did you meet Nisse?'],
        say: ['She walked into our kitchen when I was small and ate my homework. I\'ve followed her around ever since.', 'She ate my homework. We have been friends since.'] },
      { idle: [['Mind Nisse. What is it?', 'Mind Nisse. What?']] },
      { bye: [['Mind your back. She is behind you.', 'Mind your back!']] },
      { bark: true, say: ['Nisse, no. Nisse. Nisse! ...She ate my hat.', 'Nisse, no! She ate my hat.'] },
    ],
    f_nisse: [
      { say: ['(Nisse chews the end of your scarf and stares at you.) Meh.', '(Nisse chews your scarf.) Meh.'],
        re: [
          { t: ['Hello, Nisse.', 'Hello, Nisse.'],
            say: [['f_nisse', 'Meh.', 'Meh.']] },
          { t: ["That's my scarf.", "That's my scarf."],
            say: [['f_nisse', '(She chews a little faster.) Meh.', '(She chews faster.) Meh.']] },
        ] },
      { say: ['Meh.', 'Meh.'] },
      { idle: [['Meh.', 'Meh.']] },
      { bye: [['(Nisse turns her back on you.) Meh.', '(She turns away.) Meh.']] },
    ],

    // ---------------------------------------------------------------- Oskar the Mailman, the Post Hut
    // Thirty years and never late, until a month frozen behind the lookout bars. He has an old letter for Brynja (it
    // starts the Snow Mother's Song: x2_people's own "I can take your letter" option).
    f_oskar: [
      { if: 'flag f_hush_done', once: true, fact: 'f3s_hush=gone',
        say: ['The great white moth is gone, they say. So the post goes through again. Late, but it goes.', 'The moth is gone. The post goes through!'],
        re: [
          { t: ['Is there any post for me?', 'Any post for me?'],
            say: [['f_oskar', 'A crow got there first. A crow. With no hat on. ...She was very fast, I will say that.', 'A crow got there first. No hat. Fast, though.']] },
          { t: ['How late is the post now?', 'How late is it now?'],
            say: [['f_oskar', 'One month and four days. I\'ve stopped counting the hours. That was a hard morning.', 'A month and four days. I stopped counting hours.']] },
        ] },
      // his moment
      { if: 'flag f_thaw_f_oskar',
        say: ['Do you write to your mother? Properly? With a stamp?', 'Do you write to your mom? With a stamp?'],
        re: [
          { t: ['A crow called Pebble carries them.', 'A crow carries them.'], f: 0.5,
            say: [['f_oskar', 'A crow. Delivering. With no hat. It isn\'t proper. ...It is very fast, though.', 'A crow, with no hat. Not proper. Fast, though.']] },
          { t: ['Not as often as I should.', 'Not often enough.'], tone: 'kind', f: 0.75,
            say: [['f_oskar', 'Nobody does. Write one tonight. I\'ll take it myself. On time, for once.', 'Nobody does. Write tonight. I will take it.']] },
        ] },
      { say: [["The post has caught up to three weeks late. Three weeks! I could weep. I might, after lunch.", 'The post is three weeks late now. I could weep.'],
        ['Rain or snow or moths, the post goes through. Eventually.', 'The post always gets there. One day.']] },
      { ask: ['What was the first letter you took?', 'Your first letter?'],
        say: ['To my mother. I delivered it myself. She was in the next room. I was early. It still counts.', 'To my mom, in the next room. I was early.'] },
      { ask: ['Do you ever read the post?', 'Do you read the post?'],
        say: ['Never the inside. Only the outside. The outside tells you plenty. Yours smell of smoke.', 'Only the outside. Yours smell of smoke.'] },
      { idle: [['Post? No? What is it, then?', 'Post? No? What?']] },
      { bye: [['On time, now. Off you go.', 'Off you go. On time.']] },
      { bark: true, say: ['Late. Late. A month late. Late.', 'Late. A month late.'] },
    ],

    // ---------------------------------------------------------------- Rasmus Ironsnow, the old smith
    // Slow, deep, says "hmm", makes one pun and is proud of it. Taught Gunnhild; thawed last (f_rime), gives Bluefire.
    f_rasmus: [
      { if: 'quest f_rime done', once: true,
        say: ["Bluefire suits you, child. Hmm. Don't melt the village. We just got it back.", "Bluefire suits you. Don't melt the village."],
        re: [
          { t: ["I'll be careful with it.", "I'll be careful."],
            say: [['f_rasmus', 'Hmm. Careful is good. Slow is better. Both is best.', 'Careful is good. Slow is better. Both is best.']] },
          { t: ['You missed the nail, Rasmus.', 'You missed the nail.'], tone: 'silly',
            say: [['f_rasmus', 'Hmm. A month to aim, and I missed. ...Don\'t tell Gunnhild.', 'A month to aim, and I missed. Shh.']] },
        ] },
      // his moment: Gunnhild (said rasmus_slow: Gunnhild hears it in Hearthold)
      { if: 'quest f_rime done',
        say: ['Gunnhild, in Hearthold. Best hands in Frostreach. Has she learned to wait for the iron yet?', 'Gunnhild. The best hands. Can she wait for the iron yet?'],
        re: [
          { t: ['She hums while she works.', 'She hums while she works.'], f: 0.5,
            say: [['f_rasmus', 'Hmm. Humming is waiting with a noise in it. Good. She\'s learning.', 'Humming is waiting with a noise. Good.']] },
          { t: ["She's fast. Really fast.", "She's really fast."], f: 0.5, then: ['said rasmus_slow'],
            say: [['f_rasmus', 'Hmm. Tell her: slow. Just that. She\'ll know.', 'Tell her: slow. She will know.']] },
        ] },
      { say: [["I mended Rimeholm's bell once, the year it cracked right through. Still rings sweet. Hmm. Loud, too.", 'I mended the bell once. It still rings sweet.'],
        ["A forge is a hearth that went to work. Hmm. Hmm. That's a good one. I'll use it again.", 'A forge is a hearth with a job. Good one.']] },
      { ask: ['How many nails have you made?', 'How many nails?'],
        say: ['Ten thousand, child. Every one held something up. Hmm. That\'s enough of a life, I think.', 'Ten thousand. Each held something up.'] },
      { ask: ['Did you teach Gunnhild?', 'Did you teach Gunnhild?'],
        say: ['To hold a hammer. Then to put it down. The second took longer. Hmm. Still taking.', 'To hold a hammer. Then to put it down.'] },
      { idle: [['Hmm. Yes?', 'Hmm. Yes?']] },
      { bye: [['Hmm. Go slow.', 'Go slow.']] },
      { bark: true, say: ['Hmm. Hmmm. Hmm.', 'Hmm. Hmm.'] },
    ],

    // ================================================================ the wild north
    // ---------------------------------------------------------------- Old Hask, the trapper at Hask's Rest
    // Grunts ("hrm"), talks to dogs more than people, calls Ash "pup". Trades furs with Ulf at the Lodge (and letters:
    // that is how he knows of Ash). His dogs ran off in the first blizzard (f_dogs).
    f_hask: [
      // his first meeting, before his dogs (Ulf writes to him)
      { if: 'stage<f_thaw !quest f_dogs started', once: true,
        say: ["Hrm. Pup. You'll be Ulf's dragon boy. He wrote me. Said you'd come up the pass with a tail on.", "Hrm. Pup. Ulf's dragon boy."],
        re: [
          { t: ['You know Ulf?', 'You know Ulf?'],
            say: [['f_hask', 'We trade furs. Fair trader. Wrong about dogs. Don\'t tell him I said his name nicely.', 'We trade furs. He is wrong about dogs.']] },
          { t: ['Why is your camp so quiet?', 'Why so quiet?'],
            say: [['f_hask', 'My dogs ran off in the first blizzard. Hrm. A camp should have barking.', 'My dogs ran off. A camp needs barking.']] },
        ] },
      { if: 'quest f_dogs done', once: true,
        say: ['Nine dogs. Five dog houses. Toast bit me hello this morning. Hrm. Good to have them home.', 'Nine dogs home. Toast bit me. Good.'],
        re: [
          { t: ['Toast bites everyone hello.', 'Toast bites everyone.'],
            say: [['f_hask', 'Hrm. He gets it from Pepper. Pepper gets it from me.', 'He gets it from Pepper. Pepper gets it from me.']] },
          { t: ['Will you build more houses?', 'More dog houses?'],
            say: [['f_hask', 'Started this morning. Toast keeps chewing the nails. Hrm. Good teeth.', 'Started today. Toast chews the nails.']] },
        ] },
      { if: 'quest f_mumble done', once: true,
        say: ['Did you hear that roar? The whole forest shook. Hrm. Good lad, that yeti.', 'Did you hear that roar? Good lad.'],
        re: [
          { t: ['He was so proud of it.', 'He was so proud.'],
            say: [['f_hask', 'Should be. The Rimehounds have been quiet ever since. Too quiet. Hrm. I like it.', 'The wolves are quiet now. I like it.']] },
          { t: ['Snarl brings him fish now.', 'Snarl brings him fish.'],
            say: [['f_hask', 'Hrm. Wolves understand a roar. Better than they understand please.', 'Wolves understand a roar. Not please.']] },
        ] },
      // his moment (the old chat), with his dogs on his mind (said hask_dogs: Ulf hears about it)
      { if: 'quest f_dogs started',
        say: ['Hrm. Pup. Ulf says sheep. I say dogs. Settle it. Dogs or sheep?', 'Ulf says sheep. I say dogs. Which?'],
        re: [
          { t: ['Dogs. They pull sleds.', 'Dogs. They pull sleds.'], tone: 'brave', f: 1, then: ['said hask_dogs'],
            say: [['f_hask', 'Hrm. Right answer, pup. Right answer. I\'m writing to Ulf.', 'Right answer, pup. I am writing to Ulf.']] },
          { t: ['I told Ulf sheep. Sorry.', 'I told Ulf sheep.'], if: 'said ulf_sheep', f: 0.25,
            say: [['f_hask', '...Ulf got to you first. Hrm. Sheep. Hrm. You can still stay.', 'Ulf got to you first. Hrm. You can stay.']] },
          { t: ['Both. Everybody needs friends.', 'Both. Friends are friends.'], f: 0.5,
            say: [['f_hask', 'Hrm. Diplomatic. Ulf says that. Don\'t be Ulf.', 'Diplomatic. Ulf says that. Do not be Ulf.']] },
        ] },
      { if: '!quest f_dogs done',
        say: [["Hrm. Pup. You look like you've never been cold in your life.", "Hrm. Pup. You've never been cold."],
          ['A camp should have barking. Hrm. Too quiet.', 'A camp needs barking.']] },
      { say: [['Pepper bit the sled. The sled bit back. Hrm. Splinters.', 'Pepper bit the sled. Splinters.'],
        ['Snow is soft today. Good for dogs. Bad for boots.', 'Soft snow. Good for dogs.']] },
      // topics
      { ask: ['What happened to your eye?', 'What happened to your eye?'],
        say: ['Lost it to a bear. Bear lost a tooth to me. We both went home. Hrm. Fair fight.', 'A bear took it. I took its tooth. Fair.'] },
      { ask: ['Which dog is your favorite?', 'Your favorite dog?'], if: 'quest f_dogs done',
        say: ['Pepper. Don\'t tell the others. Pepper bites when he\'s full. So do I.', 'Pepper. Shh. He bites. So do I.'] },
      { idle: [['Hrm. What?', 'Hrm. What?'], ['Pup. Speak.', 'Pup. Speak.']] },
      { bye: [['Hrm. Keep warm, pup.', 'Keep warm, pup.']] },
      { bark: true, if: '!quest f_dogs done', say: ['Hrm. Too quiet. A camp should have barking.', 'Too quiet. A camp needs barking.'] },
      { bark: true, if: 'quest f_dogs done', say: ['Pepper. Pepper! Drop the boot.', 'Pepper! Drop the boot!'] },
    ],

    // ---------------------------------------------------------------- Brother Pennant, the last Wind Monk of Skyreach
    // Delighted by everything; lives on a kite above the temple isle; says "wheee" and apologizes. Held the kites when the
    // brothers rode up to knock on the mountain; never went himself.
    f_pennant: [
      { if: 'flag f_v2', once: true,
        say: ["You made the Singing Stone sing! I'll tell the other monks. By postcard. Which will blow away. Wheee.", 'You made the stone sing! Wheee!'],
        re: [
          { t: ['It sang the second verse.', 'It sang verse two.'],
            say: [['f_pennant', 'The girl with red horns! The brothers sang that one every spring, flying up. Badly. In the wind.', 'The girl with red horns! We sang it every spring.']] },
          { t: ['Write on a heavy postcard.', 'Use a heavy postcard.'], tone: 'silly',
            say: [['f_pennant', 'A heavy one! A slate! Wheee... no, that would just fall. Thank you anyway.', 'A slate! No, it would fall. Thanks anyway.']] },
        ] },
      // what Ash said the wind sounds like (said pennant_hum), once the Snow Mother stays and hums on the mountain
      { if: 'said pennant_hum choice f_glaciar_home=stay', once: true,
        say: ['The wind hums now. Like you said it did, remember? Only now somebody on the mountain is humming along.', 'The wind hums now. Like you said. Someone hums along.'],
        re: [
          { t: ["That's my auntie. She hums.", "That's my auntie."], tone: 'kind', f: 0.5,
            say: [['f_pennant', 'Your auntie! Then I\'m going to fly up and hum back. Very quietly. From a distance.', 'Your auntie! I will hum back. From far away.']] },
          { t: ['Is she in tune?', 'Is she in tune?'],
            say: [['f_pennant', 'More than the brothers ever were. Wheee. Sorry. That was unkind. True, but unkind.', 'More than the monks were. Sorry. True, though.']] },
        ] },
      // the frozen Wind Monk on the Windscour, once thawed (x2_people's f_frz_monk)
      { if: 'flag f_thaw_f_frz_monk', once: true,
        say: ['Brother Tuck thawed out on the Windscour! He\'s walking here. Slowly. He says his knees are still frozen. His knees were always like that.', 'Brother Tuck thawed! He is walking here. Slowly.'],
        re: [
          { t: ['He said to tell you he is coming.', 'He says he is coming.'],
            say: [['f_pennant', 'Then I\'ll put the kettle on! Up here! ...I\'ll have to come down to put the kettle on.', 'I will put the kettle on! I must come down first.']] },
          { t: ['Will he fly the kites with you?', 'Will he fly with you?'],
            say: [['f_pennant', 'He\'ll hold the strings and complain. That\'s what Tuck does. I\'ve missed it so much.', 'He will hold strings and complain. I missed it.']] },
        ] },
      // before the temple: Old Frostfeather is poorly
      { if: 'seen f3_pennant_meet !power windride',
        say: ["Old Frostfeather is at the very top, poor thing. Be gentle with her. She isn't wicked. She's poorly.", 'Frostfeather is at the top. Be gentle. She is poorly.'],
        re: [
          { t: ['What was she like before?', 'What was she like?'],
            say: [['f_pennant', 'Soft as a pillow. She used to sit on the morning bell and let the young monks stroke her. I miss her.', 'Soft as a pillow. She let us stroke her.']] },
          { t: ["I'll bring her back.", "I'll bring her back."], tone: 'brave', f: 0.5,
            say: [['f_pennant', 'Look for gold eyes. If her eyes go gold, she\'s herself again.', 'Look for gold eyes. Then she is herself.']] },
        ] },
      // after the temple
      { if: 'power windride', once: true,
        say: ["She's back! Old Frostfeather! Her eyes are gold again, and she's eaten three of my kite strings to celebrate.", 'Frostfeather is back! She ate three of my strings.'],
        re: [
          { t: ['She looked sorry, at the end.', 'She looked sorry.'], tone: 'kind', f: 0.5,
            say: [['f_pennant', 'She sat on my kite all night. That\'s her way of saying sorry. My kite is very flat now.', 'She sat on my kite all night. That is sorry.']] },
          { t: ['Do you need new strings?', 'Need new strings?'],
            say: [['f_pennant', 'I have nine. Eight. She\'s looking at me. Seven.', 'I have nine. Eight. She is looking. Seven.']] },
        ] },
      // his moment (the old chat), once Ash can ride the wind (said pennant_hum)
      { if: 'power windride',
        say: ['Wheee! Sorry. Quick question. What does the wind sound like to you, when you\'re up in it?', 'What does the wind sound like up there?'],
        re: [
          { t: ['Like someone humming far away.', 'Someone humming far away.'], tone: 'kind', f: 1, then: ['said pennant_hum'],
            say: [['f_pennant', 'Oh! Oh, that\'s lovely. I\'ll listen for the humming now. Every day.', 'Lovely! I will listen for the humming now.']] },
          { t: ['Like a dragon, roaring.', 'Like a dragon roaring.'], f: 0.5,
            say: [['f_pennant', 'Only near Mount Dread. Up here it\'s more of a whistle. A friendly one.', 'Only near the mountain. Here it whistles.']] },
          { t: ['Like a goat sneezing.', 'Like a goat sneezing.'], tone: 'silly', f: 0.5,
            say: [['f_pennant', 'A goat... sneezing. I can\'t unhear it now. Thank you. I think.', 'A goat sneezing? I can\'t unhear it!']] },
        ] },
      { say: [["I've lived on this kite since the moths came. My feet have forgotten what ground is. Wheee. Sorry. Every time.", 'I live on this kite now. Wheee! Sorry.'],
        ["If you ever feel lost, lick a finger and hold it up. The wind will tell you. It will mostly tell you it's cold.", 'Lost? Lick a finger. The wind will tell you.']] },
      // topics
      { ask: ['Where did the other monks go?', 'Where did the monks go?'],
        say: ['They blew away. On purpose! To ride the warm winds, far away. They send postcards. The postcards blow away.', 'They flew south. Their postcards blow away.'] },
      { ask: ['Were you ever scared of heights?', 'Scared of heights?'],
        say: ['Terribly, when I joined. The brothers said the sky has no floor, so you can\'t fall off it. I don\'t know if that\'s true. I\'ve never looked down long enough to find out.', 'Yes. They said the sky has no floor. I never looked down.'] },
      { ask: ['Did the monks really knock on the mountain?', 'Did they knock on it?'], if: 'clue f3_climbers',
        say: ['Every spring. They rode up to the shoulder and knocked. I held the kites. I never saw what answered.', 'Every spring. I held the kites. I never saw what answered.', { ref: 'f_shoulder' }] },
      { idle: [['Wheee! Sorry. Yes?', 'Wheee! Yes?'], ["I'm listening. The wind is too.", 'I am listening.']] },
      { bye: [['Steer with your feet!', 'Steer with your feet!'], ['Wheee! Goodbye! Sorry!', 'Wheee! Bye!']] },
      { bark: true, say: ['Wheeee!', 'Wheeee!'] },
    ],

    // ---------------------------------------------------------------- Mumble the yeti, Mumble's Hollow
    // Huge, shy, says sorry; the purple cold froze his roar and he squeaks. With Sigrun's soup and Ash to copy, he roars
    // (f_mumble), and he stops saying sorry.
    f_mumble: [
      { if: 'quest f_mumble done',
        say: ['(ROOOAR!) Sorry. I am practicing. ...Not sorry.', '(ROOOAR!) Not sorry!'],
        re: [
          { t: ['That was a good one.', 'That was a good one.'], tone: 'kind', f: 0.5,
            say: [['f_mumble', 'It was! It had a little squeak at the end. For luck. I am keeping the squeak.', 'It was! A little squeak at the end. For luck.']] },
          { t: ['Does Snarl still laugh at you?', 'Does Snarl still laugh?'],
            say: [['f_mumble', 'Snarl brings me fish now. Every morning. He is very polite. He is very scared.', 'Snarl brings me fish now. Politely.']] },
        ] },
      { if: 'quest f_mumble active', say: ['(squeak) I am ready to try. I think. (squeak)', '(squeak) I am ready. I think.'] },
      { if: '!quest f_mumble started',
        say: ['(very quietly) Hello. Sorry. Hello.', '(very quietly) Hello. Sorry.'],
        re: [
          { t: ['Are you all right?', 'Are you all right?'], tone: 'kind', f: 0.5,
            say: [['f_mumble', '(squeak) Sorry. That was my voice. It used to be bigger. Much bigger.', '(squeak) Sorry. My voice used to be bigger.']] },
          { t: ['Why are you whispering?', 'Why are you whispering?'],
            say: [['f_mumble', 'It is all I have now. The purple cold took the rest. Sorry.', 'It is all I have. The cold took the rest.']] },
        ] },
      { say: [['(squeak)', '(squeak)'], ['Hello again. The snow is soft today. I like soft.', 'Hello. The snow is soft today.']] },
      { ask: ['What did your old roar sound like?', 'What was your old roar like?'],
        say: ['Like a mountain clearing its throat. This one is better. It has a squeak in it, at the end.', 'Like a mountain clearing its throat.'] },
      { idle: [['(quietly) Yes?', '(quietly) Yes?']] },
      { bye: [['(a small wave) Bye. Not sorry.', '(a wave) Bye.']] },
    ],
    // Greymane, the wolf king, on the Whitepass (f_pack): no words, only what he does
    f_greymane: [
      { say: ['(Greymane thumps his tail once. Snow flies everywhere.)', '(Greymane thumps his tail. Snow flies.)'],
        re: [
          { t: ['Hello, old friend.', 'Hello, old friend.'], tone: 'kind', f: 0.5,
            say: [['narr', 'He leans his huge grey head against your shoulder, and breathes out warm.', 'He leans his big head on you.']] },
          { t: ['Is your pack all right?', 'Is your pack all right?'],
            say: [['narr', 'He looks out toward the Pinewhisper and huffs, once, as if to say: not yet.', 'He looks at the forest and huffs.']] },
        ] },
      { say: [['(Greymane sniffs your scarf, then your hat, then your ear.)', '(Greymane sniffs your ear.)']] },
      { idle: [['(Greymane waits.)', '(Greymane waits.)']] },
      { bye: [['(Greymane lies down in the snow and watches you go.)', '(He watches you go.)']] },
    ],
  },
})

// ================================================================ home, in Embermere (map 0): Act III visits
people({
  id: 'act3_talk_home', act: 3,
  talk: {
    // ---------------------------------------------------------------- Maren, Ash's mom, at the forge
    // Short, practical, warm; worry comes out as instructions (scarves), love as hugs and work. Her chapter lines
    // (`mom:` in each chapter file) are folded in here with replies. A catch-all at the end keeps her Act II openers in
    // Act II. Never "I'm proud of you".
    maren: [
      // a letter from Gunnhild came south (said gunnhild_send, set at Anvilheart Forge)
      { if: 'said gunnhild_send', once: true,
        say: ['A letter came down by sled from Hearthold. Four pages, from a smith called Gunnhild. Three of them are about my grip.', 'A letter from Gunnhild came. Four pages. Three on my grip.'],
        re: [
          { t: ['She framed your "no thank you."', 'She framed your letter.'],
            say: [['maren', 'She framed it? ...Twenty years ago she asked me to come up there and be her partner. I said no thank you. I had a baby to mind.', 'She asked me north once. I said no. I had a baby.']] },
          { t: ['She says the offer still stands.', 'The offer still stands.'], if: 'seen fg_chain',
            say: [['maren', 'Does it. ...Tell her yes, please. To a visit. Not a forge. Not yet.', 'Tell her yes, please. To a visit.']] },
          { t: ['Will you write back?', 'Will you write back?'],
            say: [['maren', 'I\'m writing back. It\'s taking me longer than four pages.', 'I am. It is taking longer than four pages.']] },
        ] },
      // after the Crown: what Ash found up there (said mom_glee)
      { if: 'flag f_done choice f_glaciar=free', once: true,
        say: ["You're home. Come here. ...Now sit, and start at the beginning. Pebble's note said 'auntie.' Whose auntie?", "Come here. Pebble's note said 'auntie.' Whose?"],
        re: [
          { t: ["Grandpa's sister. Glaciar. Auntie Glee.", "Grandpa's sister. Auntie Glee."], tone: 'kind', f: 0.5, then: ['said mom_glee'],
            say: [['maren', 'Grandpa had a sister? All those years up on that mountain, and nobody ever went to see her.', 'Grandpa had a sister? And nobody went to see her.']] },
          { t: ['She pinched my cheek. Gently.', 'She pinched my cheek.'],
            say: [['maren', 'With a dragon claw? Let me see. ...Hm. Gently. Good. I like her already.', 'Let me see. Gently. Good. I like her.']] },
        ] },
      { if: 'said mom_glee', once: true,
        say: ["I've cleared the big chair by the forge. For a dragon. A cold one. In case she visits.", 'I cleared the big chair. For a cold dragon.'],
        re: [
          { t: ["She'll freeze it solid.", "She'll freeze it."], tone: 'silly',
            say: [['maren', 'Then I\'ll put a cushion on it. A frozen cushion. She can have it.', 'Then I will add a cushion. A frozen one.']] },
          { t: ["She'd like that, Mom.", "She'd like that."], tone: 'kind', f: 0.5,
            say: [['maren', 'Good. Family comes to the forge. That\'s the rule. Even the big ones.', 'Family comes to the forge. Even big ones.']] },
        ] },
      { if: 'flag f_done choice f_glaciar=defeat', once: true,
        say: ["You're home. You're very quiet, though. What happened up there?", 'You are quiet. What happened up there?'],
        re: [
          { t: ["I couldn't wake her, Mom.", "I couldn't wake her."],
            say: [['maren', 'Then you\'ll go back when you can. Nobody stays asleep forever. Not in this family.', 'Then go back. Nobody sleeps forever here.']] },
          { t: ['I promised to go back for her.', 'I promised to go back.'], tone: 'kind', f: 0.5,
            say: [['maren', 'Then you will. I know that face. You got it from me.', 'Then you will. You got that face from me.']] },
        ] },
      { if: 'flag f_done',
        say: ['Is it over? Then sit down and tell me everything. Slowly. From the beginning. And put the kettle on while you do.', 'Is it over? Tell me all of it. Slowly.'],
        re: [
          { t: ['There was a yeti who squeaked.', 'There was a yeti.'],
            say: [['maren', 'A yeti. Who squeaked. ...Start further back. Start with the pass.', 'A yeti? Start further back.']] },
          { t: ['I have two Shards now.', 'I have two Shards.'], if: 'item f_shard2',
            say: [['maren', 'Two. They\'re warm, aren\'t they? I can feel it from here. One more, and they come to me.', 'Two. They are warm. One more, then they come to me.']] },
        ] },
      // through the act, when he comes home (her chapter lines, with replies)
      { if: 'stage=f_snow',
        say: ['You came home first! Good. Sit down and have your soup, and then go to the Lodge. Scarf.', 'You came home! Soup first. Then the Lodge.'],
        re: [
          { t: ['Is it leek soup?', 'Is it leek soup?'],
            say: [['maren', 'It is. With bread. Sit. The Lodge has been there two hundred years. It\'ll wait ten minutes.', 'It is. Sit. The Lodge can wait ten minutes.']] },
          { t: ['The Shard went cold, Mom.', 'The Shard went cold.'], if: 'item c_shard1',
            say: [['maren', 'Let me feel. ...Cold like a scared thing. Then keep it close, and keep yourself warmer. Scarf.', 'Cold, like it is scared. Keep it close.']] },
        ] },
      { if: 'stage>=f_pass stage<f_thaw',
        say: ["Over the High Pass and back already? Two scarves next time. I mean it. What's it like up there?", 'Over the pass and back? Two scarves. What is it like?'], ref: 'high_pass',
        re: [
          { t: ['Their fireplace is as big as a hill.', 'A huge fireplace!'],
            say: [['maren', 'A town that keeps a fire like that? That\'s my kind of town.', 'A town with a fire like that? My kind of town.']] },
          { t: ['A smith up there knows your work.', 'A smith knows your work.'], if: 'quest f_forge started',
            say: [['maren', 'Gunnhild Anvilheart. Is she still angry? She sounds angry in letters. That\'s just how she writes.', 'Gunnhild. She sounds angry in letters. That is just her.']] },
          { t: ["It's so cold the snow squeaks.", 'The snow squeaks.'],
            say: [['maren', 'Then your boots are too thin. Give them here. ...No. Keep them on. Go.', 'Then your boots are too thin. Keep them on.']] },
        ] },
      { if: 'power blaze stage<f_sky',
        say: ['Blue fire, Pebble says. Show me. ...Not in the kitchen! Outside, outside!', 'Blue fire? Show me. Not in the kitchen!'],
        re: [
          { t: ['(Breathe one tiny blue flame.)', '(A tiny blue flame.)'],
            say: [['maren', 'Oh. Oh, Ash. That\'s the hottest thing I\'ve ever seen, and I\'ve been a smith twenty years.', 'Oh, Ash. The hottest thing I ever saw.']] },
          { t: ["It came from Ember's old forge.", "From Ember's old forge."],
            say: [['maren', 'Her forge. Up there in the ice. I\'d give my good hammer to see it.', 'Her forge, in the ice. I would love to see it.']] },
        ] },
      { if: 'stage>=f_sky !flag f_done',
        say: ['A dragon. On a mountain. Of course it is. ...Are you scared?', 'A dragon on a mountain. Are you scared?'],
        re: [
          { t: ['A bit. Is that all right?', 'A bit. Is that okay?'], tone: 'kind', f: 0.5,
            say: [['maren', 'It\'s right. Scared means you\'ll be careful. So be careful. Then come straight home.', 'It is right. Be careful. Then come home.']] },
          { t: ["Not with Ulf's hat on.", "Not in Ulf's hat."], tone: 'silly',
            say: [['maren', 'Then keep it on. Ear flaps down. If she so much as yawns at you, you come home.', 'Keep it on. If she yawns at you, come home.']] },
        ] },
      { say: [["You're home. Sit a minute. Tell me one thing that happened.", 'Sit. Tell me one thing.'],
        ['Pebble brings your news faster than you do. Sit anyway.', 'Pebble is faster. Sit anyway.']] },
      // topics
      { ask: ['Did Grandpa ever talk about a sister?', 'Did Grandpa have a sister?'], if: 'solved snow_mother !flag f_done',
        say: ['Never. Not once, in all those stories. Yara says he only ever spoke of Ember. ...A sister. Oh, Ash.', 'Never. He only spoke of Ember. A sister!'] },
      { ask: ['Can you mend a cold Shard?', 'Can you mend a Shard?'], if: 'item c_shard1',
        say: ['Not one. Not two. Bring me all three, and I\'ll have the forge hot and waiting.', 'Bring all three. The forge will be hot.'] },
      { ask: ['Who is Gunnhild Anvilheart?', 'Who is Gunnhild?'], if: 'quest f_forge started',
        say: ['A smith over the pass. Good hands, loud letters. She asked me something once, long ago. I said no thank you.', 'A smith up north. She asked me once. I said no.'] },
      { idle: [['Hand me the tongs. Go on.', 'Hand me the tongs.'], ["You're home. That's enough. Sit.", "You're home. Sit."]] },
      { bye: [['Two scarves. I mean it.', 'Two scarves!'], ['Write. Pebble likes the exercise.', 'Write to me.']] },
    ],

    // ---------------------------------------------------------------- Ulf Hollis, hunter at Frostpine Lodge
    // Loud because the mountains are big; prefers sheep; Elka's dad. The chapter f_snow is his talk at the Lodge and
    // f_pass his line after it; from Hearthold on he is waiting for news of Elka (said ulf_supper, elka_supper). Hask
    // writes to him (said hask_dogs).
    ulf: [
      { if: 'said elka_supper', once: true,
        say: ["Elka sent word by you? 'Which six.' Ha! That's my girl. I'll set a place every night until one of them is hers.", "'Which six.' Ha! I will set her a place every night."],
        re: [
          { t: ['She meant every six.', 'She meant every six.'], tone: 'kind', f: 0.5,
            say: [['ulf', 'Then every six I\'ll be here. With soup. The sheep will help. They won\'t, but they\'ll watch.', 'Then every six, I will be here. With soup.']] },
          { t: ["She'll be home by spring.", 'Home by spring.'],
            say: [['ulf', 'Spring. Good. That gives me time to mend her sled. She broke it coming up the pass. I can tell.', 'Good. Time to mend her sled.']] },
        ] },
      { if: 'said hask_dogs', once: true,
        say: ["Hask wrote me a letter. It's three words long. 'He said dogs.' ...Did you say dogs to Hask?", "Hask wrote: 'He said dogs.' Did you?"],
        re: [
          { t: ['He asked me straight out.', 'He asked straight out.'],
            say: [['ulf', 'Of course he did. Hask is very hard to say sheep to. Fine. You\'re forgiven. Mostly.', 'Hask is hard to say sheep to. Fine. Forgiven.']] },
          { t: ['Sheep are still lovely, Ulf.', 'Sheep are still lovely.'], tone: 'kind', f: 0.5,
            say: [['ulf', 'Ha! Write that down. I\'ll send it to Hask, in big letters. On a sheep.', 'Ha! I will send that to Hask. Big letters.']] },
        ] },
      { if: 'quest f_sled done', once: true,
        say: ["You found her. She wrote me. Her first letter, ever. I've read it nine times. She says she lost a race to you.", 'You found her! She wrote me. She lost a race to you.'],
        re: [
          { t: ['She very nearly won.', 'She nearly won.'], tone: 'kind', f: 0.5,
            say: [['ulf', 'Nearly. That word will keep her up all night. Good. Good for her.', 'Nearly. That will keep her up. Good.']] },
          { t: ['Is the letter all about the race?', 'All about the race?'],
            say: [['ulf', 'Two pages of race. One line about being warm. One line about a goat. I don\'t know about the goat.', 'Two pages of race. One line about a goat.']] },
        ] },
      // before Ash finds her (said ulf_supper: Elka hears it)
      { if: 'stage>=f_hearth !quest f_sled done',
        say: ['Any sign of Elka? The sheep still look north every morning. So do I.', 'Any sign of Elka? We all look north.'], ref: 'high_pass',
        re: [
          { t: ["She's sledding on a hill in Hearthold.", "She's sledding in Hearthold."], if: 'seen sl_offer',
            say: [['ulf', 'Sledding. Of course she is. Is she warm? Is she eating? Don\'t answer. I know.', 'Of course she is. Is she warm? Don\'t answer.']] },
          { t: ["I'll tell her supper's at six.", "I'll tell her: six."], tone: 'kind', f: 0.5, then: ['said ulf_supper'],
            say: [['ulf', 'Every night, since she was four. She\'ll roll her eyes. Tell her anyway.', 'Since she was four. She will roll her eyes. Tell her.']] },
        ] },
      { if: 'flag f_done',
        say: ['The pass is quiet now. The sheep look at grass again. That\'s all a sheep man wants, Ash.', 'The pass is quiet. The sheep look at grass again.'], ref: 'high_pass',
        re: [
          { t: ['What did the sheep see?', 'What did they see?'],
            say: [['ulf', 'Something with wings, going over the pass. Then something coming back, with horns. I like the second one better.', 'Something with wings. Then you, with horns. Better.']] },
          { t: ['Your hat kept me warm.', 'Your hat kept me warm.'], tone: 'kind', f: 0.5,
            say: [['ulf', 'It was my grandfather\'s. It suits you better. It suited him badly.', 'It was Grandad\'s. It suits you better.']] },
        ] },
      { say: [['Speak up! The snow takes quiet words away.', 'Speak up!'],
        ["My sheep are fine. They're always fine. That's what I like about sheep.", 'My sheep are always fine.']] },
      // topics
      { ask: ['Who is Old Hask?', 'Who is Old Hask?'], if: 'quest f_dogs started',
        say: ['Hask. Trapper, over the pass. We trade furs. Fair trader. Wrong about dogs.', 'A trapper. We trade furs. Wrong about dogs.'] },
      { ask: ['Did Elka really sled up the pass?', 'Did Elka sled up the pass?'], if: 'seen sl_prize',
        say: ['Up. On a sled. The morning after it cracked. I didn\'t know whether to shout or cheer, so I did both, at the sheep.', 'Up! I shouted and cheered. At the sheep.'] },
      { idle: [['Speak up, Ash! What is it?', 'Speak up!'], ['Ha. What else?', 'What else?']] },
      { bye: [['Go well! Two hats!', 'Two hats!']] },
    ],

    // ---------------------------------------------------------------- Brisket, the retired adventurer at the Lodge
    // Thawed by Ash in Act I; has given up adventure for being warm, and will not go north again.
    brisket: [
      { if: 'flag f_done',
        say: ['You\'re back! Was it a warm story, in the end? That\'s all I want to know.', 'You are back! Was it a warm story?'],
        re: [
          { t: ['It ended with soup.', 'It ended with soup.'],
            say: [['brisket', 'Then it\'s a perfect story. Don\'t tell me the cold bits. I\'ve done the cold bits.', 'Then it is perfect. Skip the cold bits.']] },
          { t: ['My auntie is an ice dragon.', 'My auntie is a dragon.'], if: 'choice f_glaciar=free',
            say: [['brisket', 'An ice dragon. In the family. ...I\'m going to sit a bit closer to the fire, if you don\'t mind.', 'An ice dragon! I will sit closer to the fire.']] },
        ] },
      { if: 'flag brisket_thawed',
        say: ['Over the pass? Me? No. Once is plenty. I was a block of ice for a week. You go. Bring me back a story. A warm one.', 'North? No! I was ice for a week. You go.'],
        re: [
          { t: ["I'm not asking you to come.", "I'm not asking."],
            say: [['brisket', 'Good. Then I\'ll sit by this fire and be proud of you, warmly.', 'Good. I will sit here and be proud. Warmly.']] },
          { t: ['What kind of story?', 'What kind of story?'],
            say: [['brisket', 'One with a fire in it. And soup. And nobody frozen at the end.', 'One with a fire, soup, and nobody frozen.']] },
        ] },
      { say: [['Still warm. Still here. Still retired.', 'Still warm. Still retired.']] },
      { ask: ['Do you miss the snow?', 'Do you miss the snow?'],
        say: ['I miss looking at it through a window. I have a very good window now.', 'I like it through a window.'] },
      { idle: [['Sit by the fire with me. What is it?', 'Sit by the fire.']] },
      { bye: [['Go carefully. Wear three hats.', 'Wear three hats.']] },
    ],
  },
})
