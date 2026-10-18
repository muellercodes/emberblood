// game/story/act3/q_f_pack.js (A3S): The Long Howl (f_pack). Giver: Greymane, Act I's great grey wolf, on the Whitepass.
// Greymane followed the cold north. What he lost depends on Act I's choice for him (G.choices.greymane): 'ally', three
// pack wolves gone purple with moth-frost in the Pinewhisper (beat them down, then Blaze the purple out); 'home', three
// wandering pups (a staring contest with the Steamwell's snow monkeys, a frozen Dreadmoor snowdrift, a high ridge on the
// Glimmerfrost). Surprise: before he goes, Greymane digs in the snow and drops an old Hearthwarden helmet at Ash's feet,
// scratched inside: KNUT'S PATROL. SIX OF US. DREADMOOR. (bonus clue f3_wolf_helmet for A3S's what_knights). If Mumble
// has his roar back, a yeti roars along with the howl. Payoff: ally, the pack runs with Ash in the ice dragon fight
// (f_pack_ally, x2_foes reads it) on the 'ally' path; the Long Howl (upgrade f_longhowl: the roar breaks ice) on 'home'.
// Old saves: QDEFS.f_pack steps 0..1 (a getter by Greymane's path) map to find, home. The meeting (STORY.f_pack_meet,
// a getter, kept), the wolves and the pups stay x2_people's (legacy step find, either path).
quest({
  id: 'f_pack', act: 3, giver: 'f_greymane', optional: true, takeover: true,
  title: ['The Long Howl', 'The Long Howl'],
  payoff: { kind: 'ally', id: 'f_pack_ally' },
  old_steps: ['find', 'home'],

  clue: {
    f3_wolf_helmet: { icon: 'claw', mystery: 'what_knights',
      text: ["Greymane dug up a Hearthwarden helmet with a blue plume. Scratched inside: KNUT'S PATROL. SIX OF US. DREADMOOR.",
        'A helmet: "KNUT\'S PATROL. SIX OF US. DREADMOOR."'] },
  },

  step: [
    { id: 'find', do: 'any', legacy: true,
      obj: ['Find the three that Greymane lost in the snow', "Find Greymane's three lost ones"],
      parts: [
        { do: 'wait_for flag f_wolf1 flag f_wolf2 flag f_wolf3', if: '!choice greymane=home',
          hint: ['Three of his wolves have purple eyes. Beat each one down until it kneels, then hold Blaze on it.', 'Beat each purple wolf, then Blaze it.'] },
        { do: 'wait_for flag f_pup1 flag f_pup2 flag f_pup3', if: 'choice greymane=home',
          hint: ['One pup sleeps in the Steamwell with the snow monkeys (stand very still). One is in a frozen snowdrift on the Dreadmoor. One is up on a Glimmerfrost ridge.',
            'Hot spring, snowdrift, ice ridge.'] },
      ] },
    { id: 'home', do: 'talk f_greymane', scene: 'pk_home',
      then: ['xp 650', 'give coins 120'],
      obj: ['Go back to Greymane on the Whitepass', 'Go back to Greymane'] },
  ],

  scene: {
    pk_home: [
      { if: 'choice greymane=home', then: [
        ['narr', "Three fat pups tumble over Greymane's paws. He licks every one of them until they fall over.", "Three pups tumble over Greymane's paws."],
        ['narr', 'Then he howls, so deep you feel it right down to your tail. It sounds a lot like thank you.', 'He howls. You feel it in your tail.'],
        ['ash', '...Thank you. I think I just learned a howl.', 'I think I learned a howl!'],
        { do: ['set f_longhowl', 'upgrade f_longhowl',
          { banner: ['The Long Howl', 'The Long Howl'], sub: ['Your Roar now shatters icicles, ice spikes and snowballs in its ring, and stuns frost foes for longer.', 'Your roar breaks ice now!'] }] }],
        else: [
        ['narr', 'Greymane looks at his three wolves, wet and blinking and themselves again. He howls, long and low. Far away, the pack answers.',
          'Greymane howls. Far away, the pack answers.'],
        ['narr', 'He leans his huge head against you. When you need the pack, it will come.',
          'He leans on you. The pack will come when you need it.'],
        { do: ['set f_pack_ally', 'ally f_pack_ally',
          { banner: ['Greymane will come', 'Greymane will come'], sub: ['When you face the ice dragon, the pack will run with you.', 'The wolves will help you fight!'] }] }] },
      { if: 'quest f_mumble done', then: [['narr', 'From the Pinewhisper, a yeti roars along, a little out of tune.', 'A yeti roars along. Happily.']] },
      ['narr', 'Before he goes, Greymane digs in the snow and drops something at your feet: an old Hearthwarden helmet with a blue plume.',
        'Greymane digs up a helmet with a blue plume.', { clue: 'f3_wolf_helmet' }],
      ['narr', "Scratched inside it: KNUT'S PATROL. SIX OF US. DREADMOOR.", '"KNUT\'S PATROL. SIX OF US. DREADMOOR."'],
    ],
  },
})
