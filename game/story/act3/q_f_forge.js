// game/story/act3/q_f_forge.js (A3S): Gunnhild's Cold Forge (f_forge). Giver: Gunnhild Anvilheart, Anvilheart Forge.
// Hearthold's smith lost her fire the night the moth came. She sees Ash's Chain Whip (Ingrid's grip, Gearhaven links)
// and wants to make it BURN. Ash lights her forge with Blaze and brings starfrost, the blue ore that grows where fire
// meets frost (the Mammoth Graveyard in the Stonehorn hills, or the Bone Pile in Stonehorn Deep). Surprise: Gunnhild
// hums Mom's lantern song while she works, cracks the new chain out of the window and every frosty lamp down the
// street pops alight, and Ash learns why Mom's framed letter says "no thank you" (Gunnhild once asked her to come
// north and be the best smith in it). Payoff: upgrade the Ember Chain (f_emberchain: the whip's tip burns; x2_people
// reads it).
// Old saves: QDEFS.f_forge steps 0..2 map to lit, ore, chain. Lighting the forge and the starfrost stay x2_people's
// and x2_dun_b's (legacy steps). Without Act II's Chain Whip (the optional c_whip) Gunnhild still lights up and makes
// the chain: it burns on whatever whip Ash carries later, so she sends him to Ingrid on the coast for one.
quest({
  id: 'f_forge', act: 3, giver: 'f_gunnhild', optional: true, takeover: true,
  title: ["Gunnhild's Cold Forge", "Gunnhild's Cold Forge"],
  payoff: { kind: 'upgrade', id: 'f_emberchain' },
  old_steps: ['lit', 'ore', 'chain'],

  item: {
    f_starfrost: { name: ['Starfrost ore', 'Starfrost'], icon: 'star',
      desc: ['Blue as a glacier, cold and warm at the same time. It grows where fire meets frost.', 'Blue ore. Cold and warm at once.'] },
  },

  step: [
    { id: 'offer', do: 'talk f_gunnhild', if: 'stage>=f_kindle', scene: 'fg_offer',
      obj: ['Talk to Gunnhild at Anvilheart Forge', 'Talk to Gunnhild'] },
    { id: 'lit', do: 'wait_for flag f_forge_lit', legacy: true,
      obj: ["Blaze Gunnhild's cold forge in Anvilheart Forge", "Blaze Gunnhild's cold forge"],
      hint: ['Hold your Blaze on the frosty coals for two whole seconds.', 'Hold Blaze on the coals.'] },
    { id: 'ore', do: 'wait_for item f_starfrost', legacy: true,
      obj: ['Find starfrost ore, the blue ore that grows where fire meets frost', 'Find blue starfrost ore'],
      hint: ['It rattles out of old mammoth bones in the Stonehorn hills, if you knock hard enough. Or look deep inside Stonehorn Deep.',
        'Knock on the mammoth bones in the Stonehorn hills.'] },
    { id: 'chain', do: 'talk f_gunnhild', scene: 'fg_chain',
      then: ['take f_starfrost', 'set f_emberchain', 'upgrade f_emberchain', 'xp 650',
        { banner: ['The Ember Chain!', 'The Ember Chain!'], sub: ["The Chain Whip's tip burns: it lights braziers and roots from range, melts ice and hits frost foes harder.", 'Your whip tip burns now!'] }],
      obj: ['Bring the starfrost to Gunnhild', 'Bring the starfrost to Gunnhild'] },
  ],

  scene: {
    fg_offer: [
      ['f_gunnhild', 'My forge went cold the night the moth came. I still come in every morning and pick up the hammer. Habit.',
        'My forge went cold. I still pick up the hammer.'],
      { if: 'power whip', then: [
        ['f_gunnhild', "Is that a chain whip? Gearhaven brass. Ingrid's grip. Good links. I could make it better.", 'A chain whip! I could make it better.']],
        else: [
        ['f_gunnhild', "Ingrid Anvilsong down on the coast makes chain whips out of anything. Ghost chains, even. Get one, and I'll make it better.",
          'Ingrid on the coast makes chain whips. Get one!']] },
      ['f_gunnhild', "I could make it BURN. Light my forge first, lad. Then bring me starfrost.", "I could make it BURN. Light my forge first."],
    ],
    fg_chain: [
      ['narr', 'CLANG. CLANG. CLANG. Gunnhild hums the same lantern song your mom hums. You do not say anything. You just grin.',
        "CLANG! CLANG! She hums your mom's song. You grin."],
      { if: 'power whip', then: [
        ['f_gunnhild', 'The Ember Chain. The tip burns. It lights braziers from far away, burns roots, and knocks frost right off things.',
          'The Ember Chain! The tip burns.'],
        ['narr', 'She leans out of the window and cracks it once. Every frosty lamp down the street pops alight, one after another.',
          'She cracks it out the window. Every lamp lights up!']],
        else: [
        ['f_gunnhild', 'An Ember Tip. Starfrost, fire-forged. Fit it to any chain whip and the tip burns: braziers, roots, frost, the lot.',
          'An Ember Tip! It makes any whip burn.'],
        ['f_gunnhild', "So go and get a whip. Ingrid's are the best. Don't tell her I said so.", 'Go get a whip. Ingrid makes the best.']] },
      ['f_gunnhild', "Ha! Tell your mother. Tell her Gunnhild of Hearthold says the offer still stands. She'll know.", 'Tell your mom: the offer still stands.'],
      ['ash', 'What offer?'],
      ['f_gunnhild', 'To come north and be the best smith in it. Her letter said "no thank you." I framed it.', 'To come north. She said no. I framed it.'],
    ],
  },
})
