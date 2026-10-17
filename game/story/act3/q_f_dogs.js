// game/story/act3/q_f_dogs.js (A3S): Hask's Runaway Dogs (f_dogs). Giver: Old Hask, Hask's Rest.
// Five sled dogs ran off in the first blizzard, each somewhere sillier than the last: Snowball tied up as a snowman by
// Snowgobs, Pepper out on the sea ice, Biscuit Two up a cliff ledge (claws), Sergeant on a sky isle (Wind Riding) and
// Mittens frozen mid-wag in a block of ice (Blaze). Surprise: when all five are home, Snowball trots out of the
// kennel with four fat puppies. THAT is why she ran off. Nine dogs. Hask names the one chewing Ash's tail Toast.
// Payoff: a shortcut, Hask's dog sled (f_sledline): rides between the sled posts at Hask's Rest, Hearthold's East
// Gate, below Rimeholm and on the Dreadmoor (x2_people's sled posts read the flag).
// Old saves: QDEFS.f_dogs steps 0..1 map to dogs, home. The five dogs stay x2_people's (legacy step: the dog spots
// and Mittens's ice show while G.quests.f_dogs.step is 0).
quest({
  id: 'f_dogs', act: 3, giver: 'f_hask', optional: true, takeover: true,
  title: ["Hask's Runaway Dogs", "Hask's Runaway Dogs"],
  payoff: { kind: 'shortcut', id: 'f3s_sledline' },
  old_steps: ['dogs', 'home'],

  step: [
    { id: 'offer', do: 'talk f_hask', if: 'stage>=f_thaw', scene: 'dg_offer',
      obj: ["Talk to Old Hask at Hask's Rest", 'Talk to Old Hask'] },
    { id: 'dogs', do: 'all', legacy: true,
      obj: ["Find Hask's five runaway sled dogs", "Find Hask's 5 sled dogs"],
      parts: [
        { do: 'wait_for flag f_dog1', hint: ['Snowball: the Snowgobs have made her into a snowman. Chase them off first.', 'Snowball: chase the Snowgobs off.'] },
        { do: 'wait_for flag f_dog2', hint: ['Pepper: out on the sea ice, far past Rimeholm. Walk on the water.', 'Pepper: out on the sea ice.'] },
        { do: 'wait_for flag f_dog3', hint: ['Biscuit Two: whining on a ledge up a cliff. Climb.', 'Biscuit Two: up a cliff. Climb!'] },
        { do: 'wait_for flag f_dog4', hint: ['Sergeant: on a floating isle near the sky temple. Only the wind goes there.', 'Sergeant: on a sky isle. Ride the wind.'] },
        { do: 'wait_for flag f_dog5', hint: ['Mittens: frozen mid-wag in a block of ice. Blaze it, gently.', 'Mittens: in a block of ice. Blaze it.'] },
      ] },
    { id: 'home', do: 'talk f_hask', scene: 'dg_home',
      then: ['set f_sledline', 'world f3s_sledline open', 'xp 650', 'give coins 170',
        { banner: ["Hask's dog sled", "Hask's dog sled"], sub: ["Ride the sled from any sled post: Hask's Rest, outside Hearthold's East Gate, below Rimeholm and on the Dreadmoor.", 'Ride the dog sled from any sled post!'] }],
      obj: ['Tell Hask his dogs are home', 'Tell Hask his dogs are home'] },
  ],

  scene: {
    dg_offer: [
      ['f_hask', "Hrm. Pup. You look like you've never been cold a day in your life.", "Hrm. Pup. You've never been cold."],
      ['f_hask', 'My dogs ran off in the first blizzard. Five of them. Best sled team in the north.', 'My five sled dogs ran off.'],
      ['f_hask', 'Snowball, Pepper, Biscuit Two, Sergeant and Mittens. Each one ran somewhere sillier than the last.', 'Snowball, Pepper, Biscuit Two, Sergeant, Mittens.'],
      ['f_hask', 'Bring them home and my sled will run you anywhere you need. Faster than any ribbon.', 'Bring them home. My sled will take you anywhere.'],
    ],
    dg_home: [
      ['f_hask', '...All five. Hrm. Pup. You did good. Real good.', 'All five. You did good, pup.'],
      ['narr', 'Snowball trots out of the kennel. Behind her tumble four fat puppies, white as snowballs.', 'Snowball comes out. Four puppies tumble after her!'],
      ['f_hask', '...Hrm. So THAT is why she ran off. Nine dogs. I have nine dogs.', 'So THAT is why she ran off. Nine dogs!'],
      ['f_hask', 'That little one is chewing your tail. He likes you. I am calling him Toast.', 'That one likes you. I will call him Toast.'],
      ['f_hask', "My sled goes wherever you need. Hearthold, Rimeholm, the Dreadmoor, or here. Don't feed Pepper. Pepper bites when he's full.",
        'My sled goes anywhere. Do not feed Pepper.'],
    ],
  },
})
