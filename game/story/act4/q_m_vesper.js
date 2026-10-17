// game/story/act4/q_m_vesper.js (A4S): m_vesper, in two versions, picked by the Act II choice (G.choices.c_vesper).
//  * Befriended: The Moth Mask's Last Job. Esme passes on a note (her talk line is in people.js); Vesper waits on Sable's tent roofs at night. Ash widens
//    the Burrow Gap so she can follow (burrow under it three times), then plants her three moth-smoke bombs at the Moth
//    Knight posts by the Moonpath without being seen (a lit lamp makes a knight stare at it). Surprise: at the foot of
//    the Moonpath she is already wearing a Moth Knight's tiny plumed helmet. Payoff: ally m_vesper_ally (the Vault
//    shortcut in the Observatory, Vesper's fire bombs in the Hush fight, "Not alone, cousin." on the pier).
//  * Not befriended: Vesper's Lost Letter. Jinx the Mirage Merchant sells a letter a moth dropped in the dunes, to "my
//    duck". Read by a lamp, the moth dust falls off: it is Granny Oona's letter to Vesper ("Fire isn't the only warm
//    thing. Be kind."), a truth the finale may use (G.flags.m_vesper_letter).
// One quest id (old saves have G.quests.m_vesper in either version), with a title for each version. Every step belongs
// to one version; the other version's steps finish by themselves (a wait_for on the Act II choice), so each version
// reads as its own quest.
// Old saves: old_steps map the befriended version's steps 0..2 (gap, smoke, meet); a not-befriended save at step 0 or 1
// skips through the befriended steps at once and lands on buy (it already holds the letter) or read.
// The Burrow Gap and the smoke bombs stay x3_people's (legacy steps: m3pAt('m_vesper',0) and 1); during meet the old
// index is 2, which is what puts Vesper at the foot of the Moonpath. Jinx's shop and the lamps' "Read the letter"
// prompts need only the quest to be open.
quest({
  id: 'm_vesper', act: 4, giver: 'c_vesper', optional: true, takeover: true,
  // (a title with variants, INT10: the first whose condition holds)
  title: [{ if: 'choice c_vesper=friend', t: ["The Moth Mask's Last Job", "The Moth Mask's Last Job"] },
    { t: ["Vesper's Lost Letter", "Vesper's Lost Letter"] }],
  payoff: { kind: 'ally', id: 'm_vesper_ally' },
  old_steps: ['gap', 'smoke', 'meet'],

  step: [
    // ---- befriended in Act II
    { id: 'roof', do: 'any', obj: ['Find Vesper on the tent roofs of Sable, at night', 'Find Vesper on a roof at night'],
      hint: ['Esme says a girl in a moth mask sits on the tent roofs after dark, waving at the lamps.', 'Look on the roofs at night.'],
      parts: [
        { do: 'talk c_vesper', if: 'choice c_vesper=friend', scene: 'mv_offer' },
        { do: 'wait_for !choice c_vesper=friend' },
      ] },
    { id: 'gap', do: 'any', legacy: true,
      obj: ['Widen the Burrow Gap so Vesper can follow (burrow under it three times)', 'Burrow under the Gap three times'],
      hint: ['Burrow under the Glasswall at the Burrow Gap, come up on the far side, and go back again. Three times through.',
        'Dig under the Gap. Back and forth. Three times.'],
      parts: [
        { do: 'wait_for flag m_vesper_gap', at: 'm4s_burrowgap', if: 'choice c_vesper=friend' },
        { do: 'wait_for !choice c_vesper=friend' },
      ] },
    { id: 'smoke', do: 'any', legacy: true,
      obj: ["Plant Vesper's three moth-smoke bombs at the Moth Knight posts by the Moonpath, unseen", 'Plant 3 smoke bombs. Do not get seen!'],
      hint: ['A Moth Knight who sees you finds the bomb. Light the lamp next to him and he stares at it. Then sneak in.',
        'Light his lamp. Then sneak in.'],
      parts: [
        { do: 'wait_for flag m_vesper_smoke', at: 'm3p_sent2', if: 'choice c_vesper=friend' },
        { do: 'wait_for !choice c_vesper=friend' },
      ] },
    { id: 'meet', do: 'any', legacy: true, obj: ['Meet Vesper at the foot of the Moonpath', 'Meet Vesper at the Moonpath'],
      parts: [
        { do: 'goto mv_foot 150', if: 'choice c_vesper=friend', scene: 'mv_partner',
          then: ['set m_vesper_ally', 'ally m_vesper_ally', 'xp 450', { banner: ['Vesper is coming with you', 'Vesper is coming!'],
            sub: ['Your cousin will be right behind you in the Observatory.', 'Vesper will help you in the Observatory.'] }] },
        { do: 'wait_for !choice c_vesper=friend' },
      ] },
    // ---- not befriended
    { id: 'buy', do: 'any', obj: ['Buy the moth-dropped letter from Jinx (thirty coins)', 'Buy the letter from Jinx'],
      hint: ['Jinx the Mirage Merchant is only real at noon. Where, nobody knows. Somewhere round Sable.', 'Jinx comes at noon.'],
      parts: [
        { do: 'find m_vletter', at: 'm_jinx', if: '!choice c_vesper=friend' },
        { do: 'wait_for choice c_vesper=friend' },
      ] },
    { id: 'read', do: 'any', obj: ['Read the letter by a lamp (the ink is moth-dusty)', 'Read the letter by a lamp'],
      hint: ['The moth dust only falls off in lamplight. Any lit lamp will do. The Lamp House always has one.', 'Read it at a lamp.'],
      parts: [
        { do: 'wait_for flag m_vletter_read', at: 'm3p_esmelamp', if: '!choice c_vesper=friend', then: ['xp 300'] },
        { do: 'wait_for choice c_vesper=friend' },
      ] },
  ],

  scene: {
    mv_offer: [
      ['c_vesper', "Cousin. Up here. I've been watching the Heights. Moth knights on every door, and a duke who eats lamps.",
        'Cousin! I watched the Heights. Knights. A lamp duke.'],
      ['c_vesper', "And her. The white one on the silver thread. She's up there. I want to be there when you get to her.",
        'And the white moth. She is up there.'],
      ['c_vesper', "I'm the best thief in Gearhaven. But I can't get past the Glasswall. Worms go under walls. YOU go under walls.",
        'I cannot get past the Glasswall. You can dig.'],
      ['c_vesper', 'Dig the Burrow Gap wide enough for me. Under and back, three times. Then I have a little job for you.',
        'Dig the Gap wide for me. Three times.'],
      ['ash', 'Is it a stealing job?'],
      ['c_vesper', "It's a SMOKE job. Much more respectable.", 'A SMOKE job. Very respectable.'],
    ],
    mv_partner: [
      ['c_vesper', 'Perfect. All three posts, all smoke, and not one knight saw you. I also stole this.', 'Perfect! I also stole this.'],
      ['narr', "She is wearing a Moth Knight's tiny plumed helmet. It does not fit at all.", 'She wears a tiny moth helmet.'],
      ['c_vesper', "When you go in, I'll be right behind you. Picking locks. Stealing hats. Annoying moths.",
        'I will be right behind you.'],
      ['c_vesper', "Thieves don't usually have partners. I think I like it. Don't tell anyone.", 'I like having a partner. Shh.'],
    ],
    mv_note: [
      ['m_esme', 'A girl in a moth mask left this for "the dragon". She waved at every lamp on her way out. Very polite.',
        'A moth-mask girl left this for you.'],
      ['narr', 'A paper moth, folded very small. Inside: "Cousin. Tent roofs. After dark. Bring nothing shiny. V."',
        '"Cousin. Roofs. After dark. V."'],
    ],
    mv_jinx: [
      ['m_jinx', 'Lost and found! Today only! Ooh, here is one. A letter that a moth dropped in the dunes.',
        'Lost and found! A letter a moth dropped.'],
      ['m_jinx', 'It is addressed to "my duck". I do not know any ducks. Thirty coins. Is that real money? Is it real me?',
        'It says "my duck". Thirty coins.'],
    ],
  },

  talk: {
    m_jinx: [
      { if: '!choice c_vesper=friend stage>=m_sable stage<m_reforge !quest m_vesper started', option: ['Got anything lost?', 'Anything lost?'],
        scene: 'mv_jinx', then: ['quest start m_vesper'] },
    ],
  },

  place: {
    mv_foot: { kind: 'spot', map: 3, at: [12480, 65330], r: 150, name: ['the foot of the Moonpath', 'the Moonpath foot'] },
  },
})
