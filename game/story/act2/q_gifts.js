// game/story/act2/q_gifts.js (A2S): The Moth Mask's Gifts (c_gifts). Giver: Penny Press, the Gear Market.
// Penny wants the scoop: follow the stolen golden music box and find the Moth Mask. Lord Whirligig names the tune,
// Auntie Fig remembers the girl who hummed it, and silver prints (they glitter at night, or through Hettie's glass by
// day) lead along the cliff road. Surprise: the trail ends at a sleepless little girl, not at the thief, and inside
// the box lid someone scratched V.S. A choice that sticks: take the box back, or let Posy keep it and tell Lord
// Whirligig the truth (or buy it). Payoff: a story truth for who_is_she (the initials), Vesper's trust +1 on a kind
// ending, Penny's Press Pass. Old saves: QDEFS.c_gifts steps 0..5 map to lord, fig, prints, posy, tell, penny.
quest({
  id: 'c_gifts', act: 2, giver: 'c_penny', optional: true, takeover: true,
  title: ["The Moth Mask's Gifts", "The Moth Mask's Gifts"],
  payoff: { kind: 'truth', id: 'q_box_initials' },
  old_steps: ['lord', 'fig', 'prints', 'posy', 'tell', 'penny'],

  item: {
    c_musicbox: { name: ['A golden music box', 'A music box'], icon: 'box',
      desc: ['It plays the Moth Waltz. Inside the lid: V.S.', 'It plays the Moth Waltz.'] },
    c_newscap: { name: ["Penny's Press Pass", 'A Press Pass'], icon: 'cap', keepsake: true,
      desc: ['A newsboy cap. You are a reporter now. Unpaid.', 'A cap. You are a reporter!'] },
  },

  place: {
    // the old trail (x1_people X1P_TRAIL), from the Steaming Teapot to Cockle Cottage
    gf_prints: { map: 1, kind: 'prints', name: ['silver footprints', 'silver prints'],
      show: { any: ['night', 'item magnifier'] },
      path: [[7300, 26260], [7050, 25900], [7050, 25400], [7020, 25150], [6600, 25120], [6300, 25120], [5600, 25520],
        [4600, 25880], [3600, 26080], [3200, 26120], [3050, 26400], [2700, 26480], [2520, 26600]] },
  },

  clue: {
    q_dishwasher: { icon: 'moth', mystery: 'moth_mask',
      text: ['Auntie Fig: a girl who washed dishes at the Teapot hummed the Moth Waltz every day, and walked home to Saltmarsh at night.',
        'A dishwasher girl hummed the waltz. She lived in Saltmarsh.'] },
    q_box_initials: { icon: 'letter', mystery: 'moth_mask',
      text: ["Inside the lid of the stolen music box, someone scratched two tiny letters: V.S.", 'Inside the music box lid: V.S.'] },
  },

  step: [
    { id: 'lord', do: 'talk c_whirligig', scene: 'gf_lord',
      obj: ['Ask Lord Whirligig what the Moth Mask took', 'Ask Lord Whirligig what she took'] },
    { id: 'fig', do: 'talk c_fig', scene: 'gf_fig',
      obj: ['Ask Auntie Fig at the Steaming Teapot about the tune', 'Ask Auntie Fig about the tune'] },
    { id: 'prints', do: 'track gf_prints', scene: 'gf_trail_end', then: ['set c_gift_trail'],
      obj: ['Follow the silver footprints west', 'Follow the silver prints'],
      hint: ["They glitter at night. Through Professor Sprocket's glass they show by day too.", 'They shine at night, or through the glass.'] },
    { id: 'posy', do: 'talk c_posy', scene: 'gf_posy',
      obj: ['Talk to Little Posy in Saltmarsh', 'Talk to Little Posy'] },
    { id: 'tell', do: 'talk c_whirligig', scene: 'gf_tell',
      obj: ['Tell Lord Whirligig what you found', 'Tell Lord Whirligig'] },
    { id: 'penny', do: 'talk c_penny', scene: 'gf_penny',
      obj: ['Give Penny her story', 'Tell Penny the story'],
      then: ['give c_newscap', 'hat c_newscap', 'set c_vesper_named', 'xp 500'] },
  ],

  scene: {
    gf_offer: [
      ['c_penny', 'HEADLINE: MOTH MASK STEALS GOLDEN MUSIC BOX. LORD WHIRLIGIG FAINTS. TWICE.', 'HEADLINE: MOTH MASK STEALS MUSIC BOX!'],
      ['c_penny', 'Here is the thing. Half of what she takes from the barons turns up on Saltmarsh doorsteps.',
        'Her loot turns up on Saltmarsh doorsteps.'],
      ['c_penny', 'Follow the music box, find the Moth Mask. Scoop of the century. You in?', 'Follow the box. Find her. You in?'],
      { choose: 'c_gifts_offer', ask: ['Help Penny?'], pick: [
        { t: ["I'm in. Where do we start?", "I'm in!"], then: ['quest start c_gifts'],
          say: [['c_penny', 'Lord Whirligig. Ask him what she took. Take notes. Big ones.', 'Ask Lord Whirligig what she took.']] },
        { t: ['Maybe later', 'Later'], say: [['c_penny', "Later? A good story doesn't wait. ...Fine. It waits a bit.", "Later? Fine. It can wait a bit."]] },
      ] },
    ],
    gf_lord: [
      ['c_whirligig', 'My golden music box! It plays the Moth Waltz. I bought it to annoy my neighbor.', 'My music box! It plays the Moth Waltz.'],
      ['c_whirligig', "Now I miss it. Isn't that strange? Don't answer that.", 'Now I miss it. Strange.'],
      ['c_whirligig', 'Auntie Fig hums that waltz at the Teapot. Ask her where she heard it.', 'Fig hums that tune. Ask her.'],
    ],
    gf_fig: [
      ['c_fig', 'The Moth Waltz? Oh, dearie. A girl used to wash dishes here. She hummed it every single day.',
        'A girl who washed dishes here hummed it.'],
      ['c_fig', 'Lovely thing. Terrible with plates. She walked home to Saltmarsh along the cliff road, at night.',
        'She walked home to Saltmarsh at night.', { clue: 'q_dishwasher' }],
      ['c_fig', 'Moth dust gets everywhere, dearie. Her footprints still glitter on the cliff road some nights.',
        'Her footprints still shine some nights.'],
      { if: 'item magnifier', then: [['ash', "Or in daylight, through Professor Sprocket's glass!", 'Or by day, through the magnifier!']] },
    ],
    gf_trail_end: [
      ['narr', 'The silver prints stop at the door of Cockle Cottage. Inside, a little girl is humming. The same waltz.',
        'The prints stop here. Someone hums the waltz.'],
    ],
    gf_posy: [
      ['c_dory', 'It was on our step one morning, with a note. "For Posy, who can\'t sleep."', 'It was on our step. "For Posy."'],
      ['c_posy', "This is my music box. It plays the moth song. You can listen but you can't hold it.", "My box plays the moth song. Don't touch."],
      ['narr', 'Inside the lid, someone has scratched two tiny letters: V.S.', 'Inside the lid: two letters. V.S.', { clue: 'q_box_initials' }],
      { choose: 'c_gifts', who: 'narr', ask: ['Posy holds the box against her chest with both arms.', 'Posy hugs the box tight.'], pick: [
        { t: ['Ask Posy to give it back', 'Ask for the box'], v: 'taken', then: ['set c_gifts=taken', 'give c_musicbox'],
          say: [['c_posy', "...Okay. If it's really his."], ['narr', 'Her lip wobbles. Dory says nothing at all, which is worse.', 'Her lip wobbles.']] },
        { t: ["Let her keep it. I'll talk to Lord Whirligig.", 'Let her keep it.'], tone: 'kind', v: 'kept', then: ['set c_gifts=kept'],
          say: [['c_posy', "You're a good dragon."]] },
      ] },
    ],
    gf_tell: [
      { if: 'flag c_gifts=taken', then: [
        ['c_whirligig', "My music box! Splendid! Here, eighty coins. ...Why so glum? It's MY box. Hmph.", 'My box! Here are coins. Why so glum?'],
        { do: ['take c_musicbox', 'give coins 80'] }] },
      { if: 'flag c_gifts=kept', then: [
        ['c_whirligig', 'Well, dragon? Where is my music box?', 'Well? Where is my box?'],
        { choose: 'c_gifts_tell', who: 'narr', ask: ['What do you tell Lord Whirligig?', 'What do you tell him?'], pick: [
          { t: ['The truth: a little girl needs it to sleep', 'A girl needs it to sleep'], tone: 'kind', v: 'truth',
            then: ['set c_gifts=truth', 'trust vesper +1'],
            say: [['c_whirligig', 'A child? Who cannot sleep? ...Hmph. I have eleven music boxes. Let her keep it.', 'A child? Hmph. She can keep it.'],
              ['c_whirligig', 'Does she like clocks? I have rather a lot of clocks.', 'Does she like clocks? I have lots.']] },
          { t: ['Pay him for it (100 coins)', 'Pay him (100 coins)'], tone: 'kind', v: 'bought', need: 'item coins>=100',
            locked: ['You need 100 coins.', 'You need 100 coins.'],
            then: ['set c_gifts=bought', 'take coins 100', 'give coins 50', 'trust vesper +1'],
            say: [['c_whirligig', "You'll buy it? For a fishing girl? Keep your coins. No, give them. No. Oh, I don't know!", "You'll buy it? Keep... no... oh!"],
              ['narr', 'He takes the coins, gives half of them back, and walks off muttering about clocks.', 'He gives half the coins back.']] },
        ] }] },
    ],
    gf_penny: [
      { if: 'flag c_gifts=taken', then: [['c_penny', "The box went back to the lord. The lord is happy. Posy cried. It's all true, and I don't like it much.",
        "The box went back. Posy cried. I don't like it."]] },
      { if: '!solved who_is_she', then: [['c_penny', 'I did some digging. V.S. on the lid. There is only one V.S. in Saltmarsh. Vesper Saltwhistle.',
        'V.S. is Vesper Saltwhistle!']] },
      { if: 'solved who_is_she', then: [['c_penny', 'V.S. on the lid. Vesper Saltwhistle. ...You knew already? Before me? Nobody gets there before me.',
        'You knew already? Nobody beats me!']] },
      { if: '!flag c_gifts=taken', then: [['c_penny', "Scoop of the century, and I'm not printing it. A little kid's music box isn't news. It's hers.",
        "Big scoop. I won't print it. It's hers."], { do: ['give coins 40'] }] },
      ['c_penny', "Here. My spare Press Pass. You're a reporter now. Unpaid.", "Take my Press Pass. You're a reporter!"],
    ],
    gf_box_home: [
      ['c_posy', "MY BOX! You're a good dragon. The best dragon. Listen! Listen!", "My box! You're a good dragon!"],
      ['narr', "The moth song tinkles out over the boardwalk. Dory turns away to mend a net that doesn't need mending.",
        'The moth song plays. Dory smiles.'],
    ],
  },

  talk: {
    c_penny: [
      { if: 'stage>=c_salt !quest c_gifts active !quest c_gifts done', option: ["What's the big scoop?", "What's the scoop?"], scene: 'gf_offer' },
      { if: 'flag c_box_home !flag c_penny_kind', option: ['Posy has her music box back.', 'Posy has her box back.'], then: ['set c_penny_kind'],
        say: ["You bought it back for her? I'm going to write that down, and then I'm not going to print it.", "You bought it back? I won't print it."] },
    ],
    c_whirligig: [
      { if: 'quest c_gifts done flag c_gifts=taken item coins>=100', option: ['Can I buy the music box back for Posy? (100 coins)', 'Buy the box for Posy (100 coins)'],
        then: ['take coins 100', 'set c_gifts=bought', 'trust vesper +1', 'give c_musicbox'],
        say: ["You'll buy it? For a fishing girl? ...Well, I never. Take it to the child. Hmph.", 'For the girl? Well! Take it. Hmph.'] },
    ],
    c_posy: [
      { if: 'flag c_gifts=bought item c_musicbox', option: ["Here. Your music box. It's yours.", 'Here is your music box.'],
        then: ['take c_musicbox', 'set c_box_home'], scene: 'gf_box_home' },
    ],
  },
})
