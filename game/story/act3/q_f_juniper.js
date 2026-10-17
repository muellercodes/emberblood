// game/story/act3/q_f_juniper.js (A3S): Juniper on Thin Ice (f_juniper). No giver: it starts from Captain Brann's
// option (people.js), the note on Juniper's empty Map Tent in Hearthold (f3_tent_note below), or meeting Juniper out on
// the Shiversea floes. Ash finds her on the floes, leads her back to shore through Snowgobs bowling snowballs, and
// visits her tent, where she gives him her North Maps and points at an old ice tunnel blocked by one big boulder.
// Surprise: one more drawing, made from the floe at night: the top of Mount Dread, something long and white curled
// round the summit, and the storm puffing in and out like snoring (bonus clue f3_juniper_map for A3a's what_storm).
// Payoff: a shortcut, Juniper's Tunnel from Rimeholm's cliffs to Glimmer Point (f_tunnel_open; x2_world reads it),
// and the North Maps (f_northmaps).
// Old saves: QDEFS.f_juniper steps 0..3 map to find, escort, tent, tunnel. All four stay x2_people's (legacy: the floe
// meeting, the escort, the tent talk with its maps reward, the boulder); the last data step thanks Juniper.
quest({
  id: 'f_juniper', act: 3, optional: true, takeover: true,
  title: ['Juniper on Thin Ice', 'Juniper on Thin Ice'],
  payoff: { kind: 'shortcut', id: 'f3s_tunnel' },
  old_steps: ['find', 'escort', 'tent', 'tunnel'],

  clue: {
    f3_juniper_map: { icon: 'map', mystery: 'long_winter',
      text: ["Juniper's drawing from the sea ice: something long and white curled round the top of Mount Dread. The storm up there puffs out and in, twelve times a minute, like snoring.",
        "Juniper's drawing: something long and white sleeps on the mountain."] },
  },

  place: {
    // the empty tent's note starts the quest (x2_people's own tent prompt steps aside until then)
    f3_tent_note: { kind: 'examine', map: 2, at: [7080, 48716], r: 30, over: 'f_lm_tent', if: 'stage>=f_kindle !quest f_juniper started !flag f_juniper_found',
      say: 'jn_note', then: ['quest start f_juniper'], name: ["the note on Juniper's tent", 'a note on a tent'], prompt: ['Read the note on the tent', 'Read the note'] },
  },

  step: [
    { id: 'find', do: 'wait_for flag f_juniper_found', legacy: true,
      obj: ['Find Juniper out on the Shiversea floes, past Rimeholm', 'Find Juniper on the sea ice'],
      hint: ['Walk on the water out past Rimeholm, where the sea is all floes. Look for a girl with a map case.', 'Walk out on the sea ice past Rimeholm.'] },
    { id: 'escort', do: 'wait_for flag f_juniper_home', legacy: true,
      obj: ['Lead Juniper back to the shore. Keep the Snowgobs off her!', 'Take Juniper to the shore. Keep her safe!'],
      hint: ['Stand between Juniper and the snowballs. If she gets hit three times she runs back to her floe.', 'Block the snowballs!'] },
    { id: 'tent', do: 'wait_for flag f_northmaps', legacy: true,
      obj: ["Visit Juniper's Map Tent in Hearthold", "Visit Juniper's tent in Hearthold"] },
    { id: 'tunnel', do: 'wait_for flag f_tunnel_open', legacy: true, intro: 'jn_map',
      obj: ["Open Juniper's Tunnel under the cliffs by Rimeholm (a bomb, a big hammer smash or a Roar)", 'Open the tunnel. Bomb, hammer or roar!'],
      hint: ['The boulder sits at the tunnel mouth in the cliffs above Rimeholm. Something loud will move it.', 'Something LOUD moves the boulder.'] },
    { id: 'thanks', do: 'talk juniper', scene: 'jn_done', then: ['world f3s_tunnel open', 'xp 150'],
      obj: ['Tell Juniper the tunnel is open', 'Tell Juniper'] },
  ],

  scene: {
    jn_note: [
      ['narr', 'An empty tent full of rolled-up maps. Pinned to the flap, a note:', 'An empty tent full of maps. A note:'],
      ['narr', '"GONE MAPPING THE SHIVERSEA. BACK SOON. IF NOT BACK SOON, PLEASE SEND A DRAGON. (JUNIPER)"', '"GONE TO MAP THE SEA. IF NOT BACK, SEND A DRAGON."'],
      ['ash', "...I'm a dragon.", "I'm a dragon."],
    ],
    // plays once the tunnel step begins, right after her own maps scene at the tent
    jn_map: [
      ['juniper', 'Oh! And this one. I drew it from the floe, the night before the ice ate my boots.', 'And this one. I drew it from the ice.'],
      ['narr', 'The top of Mount Dread. Something long and white lies curled round the summit, like a cat round a teapot.',
        'The mountain top. Something long and white curls round it.', { clue: 'f3_juniper_map' }],
      ['juniper', 'And the storm up there puffs out, stops, and puffs out again. I counted. Twelve puffs a minute. Like snoring.',
        'The storm puffs out and in. Like snoring.'],
      ['ash', 'Something is SLEEPING up there.'],
    ],
    jn_done: [
      ['juniper', 'You opened it! The tunnel! I heard the boom from my tent. I am putting you on the map.', 'You opened the tunnel! You go on my map!'],
      ['narr', 'She draws a very small dragon by the tunnel mouth. It has a very big grin.', 'She draws a tiny dragon with a big grin.'],
      ['juniper', 'Rimeholm cliffs to Glimmer Point, in one go. Under the ice, out of the wind. Best shortcut in the north.', 'A shortcut under the ice. The best one!'],
    ],
  },
})
