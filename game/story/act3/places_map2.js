// game/story/act3/places_map2.js (A3S): Frostreach places that belong to no chapter or quest.
//  - The small mystery what_knights, "What are the Rime Knights?" (optional, Chapters 2 to 5). The clues: Captain
//    Brann's missing patrol (people.js, f3_brann_list), frozen Sir Knut on the Dreadmoor, whose armor is growing purple
//    ice spikes (f3_knut, here), and Hearthwarden Rowan, a Rime Knight Ash Blazed free, home by the West Gate
//    (people.js, f3_freed_knight). Herring: Pim's glacier golems (f3_golem_rumor). Bonus: the Frozen Choir in the Heart
//    of Dread (f3_choir, A3b's room scene) and Greymane's helmet (f3_wolf_helmet, q_f_pack.js). Payoff: Brann's spare
//    Hearthwarden Plume (people.js), and after Hush two of the freed patrol stand guard at the Dreadgate (people.js npcs).
//  - The Crown wake (f3_crown_wake): on the defeat path Glaciar sleeps on the Crown of Mount Dread under the snow, and
//    Ash promised to come back for her. From the end of the act on, sitting by her with the Snow Mother's Song (f_song,
//    or the finale's n5_song through f3_song_known) wakes her: she is free, she stays, every frozen person in the north
//    wakes up (x2_people's own tick, once f_glaciar_home is 'stay'). Act IV and the finale read choices.f_glaciar.
places({
  id: 'a3s_map2', act: 3, map: 2,

  clue: {
    f3_brann_list: { icon: 'note', mystery: 'what_knights',
      text: ['Captain Brann: Sir Knut took a patrol of six Hearthwardens with blue plumes up to the Dreadmoor. Only Knut was found, frozen. The six never came home.',
        'Six Hearthwardens went to the moor. None came home.'] },
    f3_knut: { icon: 'eye', mystery: 'what_knights',
      text: ['Sir Knut, frozen on the Dreadmoor: purple frost is growing over his armor in little spikes, like a second suit of armor made of ice.',
        'Purple ice armor is growing on Sir Knut.'] },
    f3_freed_knight: { icon: 'heart', mystery: 'what_knights',
      text: ['Hearthwarden Rowan, the Rime Knight Ash melted free, woke up in a puddle asking for Captain Brann. He had been walking in ice armor, for HER, and could not stop.',
        'A freed Rime Knight asked for Captain Brann!'] },
    f3_golem_rumor: { icon: 'question', mystery: 'what_knights', herring: true,
      text: ['Pim says Gunnhild says the Rime Knights are glacier golems: walking ice, with nobody inside.', 'Pim says Rime Knights are ice golems.'] },
    f3_choir: { icon: 'note', mystery: 'what_knights',
      text: ['The Frozen Choir in the Heart of Dread: Hearthold soldiers frozen in the middle of a song, and four of the "singers" were Rime Knights.',
        'Four of the frozen singers were Rime Knights.'] },
  },

  deduce: {
    what_knights: {
      mystery: 'what_knights',
      ask: ['What are the Rime Knights?', 'What are the Rime Knights?'],
      needs: ['f3_brann_list', 'f3_knut', 'f3_freed_knight'],
      bonus: ['f3_choir', 'f3_wolf_helmet'],
      pick: [
        { t: ["Hearthold's lost patrol, frozen into moth-frost armor", 'The lost patrol, in ice armor'], right: true },
        { t: ['Glacier golems, like Old Bellows', 'Ice golems, like Old Bellows'],
          hint: ["Old Bellows is made of brass. These knights wear Hearthold's blue plumes.", 'Bellows is brass. These wear blue plumes.'] },
        { t: ['Stonehorn guards', 'Stonehorn guards'],
          hint: ['They have no horns. And the one you freed asked for Captain Brann.', 'No horns. One asked for Brann.'] },
      ],
      then: ['set f3_knights_known'],
    },
  },

  place: {
    // frozen Sir Knut (x2_world's frozen object; its own prompt steps aside while he is still frozen)
    f3_knut_look: { kind: 'examine', map: 2, at: [6500, 44400], r: 30, h: 60, over: 'f_frz_knight',
      if: '!flag f_thaw_f_frz_knight !flag f_thaw_frz_knight', say: 'a3k_knut', then: ['clue f3_knut'],
      name: ['frozen Sir Knut', 'frozen Sir Knut'], prompt: ['Look at frozen Sir Knut', 'Look at Sir Knut'] },
    // the Crown wake (A3b's defeat line "I'll come back for you" points here)
    f3_crown_wake: { kind: 'examine', map: 2, at: [7300, 41380], r: 60, h: 80, if: 'choice f_glaciar=defeat flag f_done act<5',
      say: 'a3c_wake', name: ['Glaciar, asleep on the Crown', 'sleeping Glaciar'], prompt: ['Sit by Glaciar', 'Sit by Glaciar'] },
  },

  scene: {
    a3k_knut: [
      ['narr', 'Sir Knut of the Hearthwardens, frozen solid with his sword up, facing the Dreadgate.', 'Sir Knut, frozen, sword up.'],
      ['narr', 'Purple frost is creeping over his armor in little spikes, slowly, like a second suit of armor made of ice.',
        'Purple ice spikes grow on his armor.'],
      ['ash', 'It is turning him into something. Something with spikes.', 'It is turning him into something spiky!'],
    ],
    a3c_wake: [
      ['narr', 'Glaciar sleeps curled round the Crown, snow drifting over her. Her breath puffs out, slow and cold.', 'Glaciar sleeps. Snow drifts over her.'],
      { if: { any: ['flag f_song', 'flag f3_song_known'] }, then: [
        { choose: 'f3_crown_sing', ask: ['You promised to come back for her.', 'You promised to come back.'], pick: [
          { t: ["Sing her the Snow Mother's Song", 'Sing her the song'], tone: 'kind',
            then: ['choice f_glaciar=free', 'set f_glaciar_sung', 'choice f_glaciar_home=stay', 'ally f3_glaciar', 'xp 500'],
            say: [
              ['narr', '"Sleep now, the snow is falling slow..." Your voice cracks on the high bit. You keep going.', 'You sing. Your voice cracks. You keep going.'],
              ['narr', 'One huge blue eye opens. Then the other. The snow slides off her in one long hush.', 'Her blue eyes open!'],
              ['f_glaciar', 'Ember used to sing me that. You came back, dumpling, and you sang the wobbly bit and everything.', 'Ember sang me that. You came back!'],
              ['f_glaciar', 'Then I suppose I had better stay and earn that song. Come here. Let me pinch your cheeks.', 'I will stay. Let me pinch your cheeks!'],
              ['narr', 'She breathes out, soft and slow, and every frozen person on the roads and in the villages gives a little shiver and wakes up.',
                'She breathes out softly. Every frozen person wakes up.']] },
          { t: ['Let her sleep a little longer', 'Let her sleep'],
            say: [['narr', 'You brush the snow off her nose. She smiles in her sleep.', 'You brush the snow off her nose.']] },
        ] }],
        else: [
        ['narr', 'You promised to come back for her. A song might reach her. A very old one, that she would remember.', 'A song might wake her. An old one.'],
        ['tove', "Hearthold's oldest song, Ash. Old Brynja at the Great Hearth will know where its words went.", 'Brynja knows the old song.']] },
    ],
  },
})
