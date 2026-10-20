// game/story/act3/q_f_mumble.js (A3S): Mumble's Lost Roar (f_mumble). Giver: Mumble the yeti, Mumble's Hollow.
// The purple cold froze Mumble's roar in his throat; now he squeaks and the Rimehounds laugh at him. Ash brings him
// Sigrun's famous hot soup from Rimeholm (thaw her first), then fights Snarl's six Rimehounds and roars so Mumble can
// copy him; the third try is a real ROAR. Surprise: something huge on the summit of Mount Dread answers the roar with
// a long, sleepy rumble, like a giant turning over in bed (bonus clue f3_mumble_echo for A3a's what_storm; once
// Glaciar is free she roars back instead, like wind chimes). Payoff: ally, Mumble comes to the ice dragon fight
// (f_mumble_ally, which x2_foes reads) and to Grumbo's den.
// Old saves: QDEFS.f_mumble steps 0..3 map to soup, bring, roar, thanks. The Rimehound fight and the roar copying stay
// x2_people's own mechanic (legacy step roar: it runs while G.quests.f_mumble.step is 2).
quest({
  id: 'f_mumble', act: 3, giver: 'f_mumble', optional: true, takeover: true,
  title: ["Mumble's Lost Roar", "Mumble's Lost Roar"],
  payoff: { kind: 'ally', id: 'f_mumble_ally' },
  old_steps: ['soup', 'bring', 'roar', 'thanks'],

  item: {
    f_soup: { name: ["Sigrun's big pot of soup", "Sigrun's soup"], icon: 'bowl',
      desc: ['Hot enough to melt a frozen roar. Do not drink it on the way. She will know.', 'Very hot soup. For Mumble!'] },
  },

  clue: {
    f3_mumble_echo: { icon: 'question', mystery: 'long_winter',
      text: ["When Mumble roared, something huge on top of Mount Dread rumbled back. Long and slow and sleepy, like a giant turning over in bed.",
        'Something huge on the mountain rumbled back. Sleepily.'] },
  },

  step: [
    { id: 'offer', do: 'talk f_mumble', if: 'stage>=f_kindle', scene: 'mb_offer',
      obj: ["Talk to the big shy yeti in Mumble's Hollow", 'Talk to Mumble'] },
    { id: 'soup', do: 'talk f_sigrun', scene: 'mb_soup', then: ['give f_soup'],
      obj: ["Get Sigrun's hot soup in Rimeholm (thaw her first if she is still frozen)", "Get Sigrun's soup in Rimeholm"],
      hint: ['Sigrun the cook froze by her smokehouse in Rimeholm. Blaze her warm, then ask for soup.', 'Thaw Sigrun. Ask for soup.'] },
    { id: 'bring', do: 'talk f_mumble', scene: 'mb_bring', then: ['take f_soup'],
      obj: ["Bring the hot soup to Mumble's Hollow", 'Bring the soup to Mumble'] },
    { id: 'roar', do: 'wait_for flag f_mumble_roar', legacy: true,
      obj: ['Fight the Rimehounds, and ROAR near Mumble so he can copy you', 'Fight the wolves. ROAR near Mumble!'],
      hint: ['When your roar is ready, use it close to Mumble. He needs to hear it three times.', 'Roar near Mumble. Three times!'] },
    { id: 'thanks', do: 'talk f_mumble', scene: 'mb_thanks',
      then: ['set f_mumble_ally', 'ally f_mumble_ally', 'xp 650', 'give coins 120',
        { banner: ['Mumble will come', 'Mumble will come'], sub: ['When you face whatever sleeps on the mountain, a very big friend will roar with you.', 'Mumble will help you fight!'] }],
      obj: ['Talk to Mumble', 'Talk to Mumble'] },
  ],

  scene: {
    mb_offer: [
      ['f_mumble', '(very quietly) ...hello. Sorry. Hello.', '(quietly) ...hello. Sorry.'],
      ['ash', "Whoa. You're HUGE."],
      ['f_mumble', 'Sorry. I am Mumble. I used to have a big roar. Like a mountain clearing its throat.', 'I am Mumble. I had a big roar.', { mood: 'sad' }],
      ['f_mumble', 'Then the purple cold came. It froze in my throat. Now I go...', 'The purple cold froze it. Now I go...', { mood: 'sad' }],
      ['f_mumble', '(squeak)', { mood: 'shy' }],
      ['f_mumble', 'The Rimehounds laugh at me. Every night. Could you... maybe... help me find it?', 'The wolves laugh at me. Can you help?', { mood: 'worried' }],
      { if: 'flag f_thaw_f_sigrun', then: [
        ['f_mumble', 'Sigrun in Rimeholm makes the hottest soup in the north. Hot soup melts things.', 'Sigrun makes the hottest soup.']],
        else: [
        ['f_mumble', 'There was a cook in Rimeholm. Sigrun. Hottest soup in the north. But Rimeholm went quiet.', 'Sigrun the cook made hot soup. But Rimeholm froze.']] },
    ],
    mb_soup: [
      ['f_sigrun', 'Soup for a yeti? A big one? Then he gets the big pot.', 'Soup for a yeti? The big pot, then.'],
      ['f_sigrun', "Don't spill it. Don't drink it on the way. I'll know.", "Don't drink it. I'll know."],
      ['narr', 'The pot is as big as you are. It smells like onions and courage.', 'A huge pot. It smells like onions and courage.'],
    ],
    mb_bring: [
      ['f_mumble', '(gulp, gulp, gulp) ...warm. So warm.', '(gulp, gulp) ...warm.', { mood: 'peaceful' }],
      ['f_mumble', '(squeak) ...still squeaky.', '(squeak) Still squeaky.', { mood: 'sad' }],
      ['narr', 'Howls. Close. Six Rimehounds trot out of the trees, grinning, led by a big one with a torn ear.', 'Six wolves come out of the trees!'],
      ['f_mumble', "(whisper) That's Snarl. He's the worst.", "(whisper) That's Snarl. He's the worst.", { mood: 'scared' }],
      ['ash', 'Mumble. Watch me. Then do what I do.', 'Watch me. Do what I do.'],
    ],
    mb_thanks: [
      ['f_mumble', 'I ROARED! Did you hear me? Everyone heard me! The MOUNTAIN heard me!', 'I ROARED! The MOUNTAIN heard me!', { mood: 'laughing' }],
      { if: 'choice f_glaciar=free', then: [
        ['narr', 'Far, far away, a dragon roars back. It sounds like a hundred wind chimes laughing.', 'Far away, a dragon roars back. Like wind chimes!'],
        ['f_mumble', '...Was that the ice dragon? She is very loud. I like her.', 'Was that the ice dragon? I like her.', { mood: 'happy' }]],
        else: [
        ['narr', 'Far away, up on Mount Dread, something answers. A long, deep, sleepy rumble. Like a giant turning over in bed.',
          'Far away on the mountain, something big rumbles. Sleepily.', { clue: 'f3_mumble_echo' }],
        ['f_mumble', '...That was not me. Was that you?', 'That was not me. Was it you?', { mood: 'surprised' }],
        ['ash', 'No. That came from the very TOP of the mountain.', 'No. It came from the mountain top.']] },
      ['f_mumble', 'If you ever need somebody big... I will come. I will roar. Loudly. Not sorry at all.', 'If you need somebody big, I will come and roar!', { mood: 'proud' }],
    ],
  },
})
