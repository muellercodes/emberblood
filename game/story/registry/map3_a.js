// game/story/registry/map3_a.js (A4a): things the old code already draws on map 3 (Moonfall) that Act IV chapters 1
// to 3 talk about, plus the two crossings on maps 1 and 2 that take Ash east. Coordinates were read from the built
// game (DOORS, LANDMARKS, CROSSINGS, the people's spots) at main c26d617. A4b and A4S: reuse these ids rather than
// adding a second entry (two entries with one id must agree exactly).

// ---------- the way east (maps 1 and 2)
legacy({ id: 'm4_far_pier', map: 1, at: [8350, 27150], r: 200, kind: 'place', src: 'CROSSINGS:c_dock_moon',
  name: ["Gearhaven's Far Pier", 'the Far Pier'], aliases: ["Dell's boat", 'the Soggy Biscuit Three'] })
legacy({ id: 'm4_north_gate', map: 2, at: [6800, 48100], r: 200, kind: 'place', src: 'CROSSINGS:m_glaciar_ride',
  name: ["Hearthold's North Gate, where Glaciar waits", 'the North Gate'] })

// ---------- the Sunken Isles
legacy({ id: 'm4_west_dock', map: 3, at: [1100, 64800], r: 300, kind: 'place', src: 'CROSSINGS:m_ship_home',
  name: ["Driftwood's West Dock", 'the West Dock'] })
legacy({ id: 'm4_north_isle', map: 3, at: [2375, 64150], r: 300, kind: 'place', src: 'CROSSINGS:m_glaciar_back',
  name: ["Driftwood's north isle", 'the north isle'] })
legacy({ id: 'm_dabble', map: 3, at: [2240, 64800], kind: 'npc', src: 'CAST:m_dabble', name: ['Mayor Dabble Floatwell', 'Mayor Dabble'] })
legacy({ id: 'm_winnie', map: 3, at: [2060, 65056], kind: 'npc', src: 'CAST:m_winnie', inside: 'h_m_winnie',
  name: ['Old Winnie the Tidewife', 'Old Winnie'], aliases: ['the Shell Hut'] })
legacy({ id: 'm_gilly', map: 3, at: [2586, 64929], kind: 'npc', src: 'CAST:m_gilly', name: ['Cook Gilly', 'Cook Gilly'],
  aliases: ['the Floating Kitchen'] })
legacy({ id: 'm_squint', map: 3, at: [2296, 64711], kind: 'npc', src: 'CAST:m_squint', name: ['Squint', 'Squint'] })
legacy({ id: 'm4_crows_nest', map: 3, at: [2300, 64668], r: 40, kind: 'place', src: 'elev:1@2300,64668',
  name: ["the crow's nest on the Town Raft", "the crow's nest"] })
legacy({ id: 'm4_shoals_sign', map: 3, at: [2870, 63780], kind: 'sign', src: 'LANDMARKS:m_sign_shoals', name: ['the Spire Shoals sign', 'the shoals sign'] })
legacy({ id: 'm4_lumen_spire', map: 3, at: [3700, 62430], r: 120, kind: 'door', src: 'DOORS:m_lumen', leads: 'm_lumen',
  name: ['the Lumen Spire', 'the white tower'], aliases: ['the white tower', 'the Spire'] })
legacy({ id: 'm4_spire_balcony', map: 3, at: [3760, 62452], kind: 'landmark', src: 'LANDMARKS:m_lm_balcony',
  name: ["the Lumen Spire's balcony", 'the balcony'] })
legacy({ id: 'm4_coral_dive', map: 3, at: [1900, 67600], r: 260, kind: 'door', src: 'LANDMARKS:m_dive_coral', leads: 'm_coralcombe',
  name: ['the Coralcombe dive ring', 'the coral ring'], aliases: ['Coralcombe Reef'] })
legacy({ id: 'm_coralia', map: 3, at: [1900, 67600], kind: 'npc', src: 'CAST:m_coralia', inside: 'm_coralcombe',
  name: ['Queen Coralia of the Lumenfolk', 'Queen Coralia'] })
legacy({ id: 'm_kipper', map: 3, at: [1900, 67600], kind: 'npc', src: 'CAST:m_kipper', inside: 'm_coralcombe',
  name: ['Sir Kipper', 'Sir Kipper'] })
legacy({ id: 'm4_sunken_gate', map: 3, at: [5880, 65560], r: 260, kind: 'gate', src: 'LANDMARKS:m_lm_gate',
  name: ['the Sunken Gate under the Reefwall', 'the Sunken Gate'], aliases: ['the Reefwall'] })
legacy({ id: 'm4_reef_arch', map: 3, at: [6225, 65600], r: 160, kind: 'place', src: 'LANDMARKS:m_sunkengate',
  name: ['the arch under the Reefwall', 'the arch under the reef'] })

// ---------- the Glass Desert
legacy({ id: 'm4_strand_sign', map: 3, at: [6990, 65470], kind: 'sign', src: 'LANDMARKS:m_sign_strand', name: ['the Tideglass Strand sign', 'the beach sign'] })
legacy({ id: 'm4_sable_sign', map: 3, at: [9150, 67440], kind: 'sign', src: 'LANDMARKS:m_sign_sable', name: ['the Oasis of Sable', 'Sable'] })
legacy({ id: 'm_rafi', map: 3, at: [9460, 67241], kind: 'npc', src: 'CAST:m_rafi', inside: 'h_m_rafi',
  name: ['Caravan-master Rafi Sandstride', 'Rafi'], aliases: ['the Big Tent'] })
legacy({ id: 'm_saffron', map: 3, at: [9800, 67820], kind: 'npc', src: 'CAST:m_saffron', name: ['Saffron the Well-Warden', 'Saffron'] })
legacy({ id: 'm4_gap_sign', map: 3, at: [10620, 67380], kind: 'sign', src: 'LANDMARKS:m_sign_gap',
  name: ['the sign at the foot of the Glasswall', 'the Glasswall sign'], aliases: ['the Glasswall'] })
legacy({ id: 'm4_worm_sign', map: 3, at: [10380, 63300], kind: 'sign', src: 'LANDMARKS:m_sign_worm', name: ['the Worm Mouth sign', 'the Worm Mouth sign'] })
legacy({ id: 'm4_worm_mouth', map: 3, at: [10600, 62904], r: 200, kind: 'door', src: 'DOORS:m_burrows', leads: 'm_burrows',
  name: ['the Worm Mouth', 'the Worm Mouth'], aliases: ['the Sandworm Burrows'] })
legacy({ id: 'm4_observatory', map: 3, at: [12968, 64305], r: 160, kind: 'door', src: 'DOORS:m_obs', leads: 'm_obs',
  name: ['the Eclipse Observatory', 'the Observatory'] })
