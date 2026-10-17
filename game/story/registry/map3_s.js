// game/story/registry/map3_s.js (A4S): Moonfall things the old code draws that the Act IV side quests, the people's
// talk and their facts name. Coordinates read from the live game (A4S_NOTES.md, "Registry"): people who stand outdoors
// at their spot, people who live indoors (Winnie, Rafi) or in an area (the merfolk, Queen Sandy) at the way in.
// World facts used by `fact:` tags carry `states`, each the condition under which it holds (checker rule 10). If
// another registry file defines one of these ids, the two entries must agree (same src and at).

// ---- towns and places (x3_world POIs)
legacy({ id: 'm4s_driftwood', map: 3, at: [2300, 64800], r: 800, kind: 'place', name: ['Driftwood Landing', 'Driftwood'], src: 'POI:m_driftwood' });
legacy({ id: 'm4s_sable', map: 3, at: [9800, 67600], r: 650, kind: 'place', name: ['the Oasis of Sable', 'Sable'], src: 'POI:m_sable' });
legacy({ id: 'm4s_gull', map: 3, at: [1000, 62000], r: 380, kind: 'place', name: ['Gull Isle', 'Gull Isle'], src: 'POI:m_gull' });
legacy({ id: 'm4s_palmcrest', map: 3, at: [3200, 66600], r: 520, kind: 'place', name: ['Palmcrest Isle', 'Palmcrest'], src: 'POI:m_palmcrest' });

// ---- doors into the dungeons and areas
// (these three are A4a's ids in map3_a.js, repeated here exactly so A4S's quests can name them on their own)
legacy({ id: 'm4_lumen_spire', map: 3, at: [3700, 62430], r: 120, kind: 'door', src: 'DOORS:m_lumen', leads: 'm_lumen',
  name: ['the Lumen Spire', 'the white tower'], aliases: ['the white tower', 'the Spire'] });
legacy({ id: 'm4_coral_dive', map: 3, at: [1900, 67600], r: 260, kind: 'door', src: 'LANDMARKS:m_dive_coral', leads: 'm_coralcombe',
  name: ['the Coralcombe dive ring', 'the coral ring'], aliases: ['Coralcombe Reef'] });
legacy({ id: 'm4_worm_mouth', map: 3, at: [10600, 62904], r: 200, kind: 'door', src: 'DOORS:m_burrows', leads: 'm_burrows',
  name: ['the Worm Mouth', 'the Worm Mouth'], aliases: ['the Sandworm Burrows'] });
legacy({ id: 'm4s_rafi_tent', map: 3, at: [9460, 67241], r: 46, kind: 'door', name: ["Rafi's Big Tent", "Rafi's tent"], src: 'DOORS:h_m_rafi' });
legacy({ id: 'm4s_winnie_hut', map: 3, at: [2060, 65056], r: 46, kind: 'door', name: ["Winnie's Shell Hut", "Winnie's hut"], src: 'DOORS:h_m_winnie' });

// ---- the people (x3_people M3P_CAST; CAST ids)
legacy({ id: 'm_dabble', map: 3, at: [2240, 64800], kind: 'npc', name: ['Mayor Dabble Floatwell', 'Mayor Dabble'], src: 'CAST:m_dabble' });
legacy({ id: 'm_winnie', map: 3, at: [2060, 65056], kind: 'npc', name: ['Old Winnie the Tidewife', 'Old Winnie'], src: 'CAST:m_winnie', inside: 'h_m_winnie' });
legacy({ id: 'm_rowan', map: 3, at: [2860, 64800], kind: 'npc', name: ['Rowan Knotwood', 'Rowan'], src: 'CAST:m_rowan' });
legacy({ id: 'm_squint', map: 3, at: [2296, 64711], kind: 'npc', name: ['Squint', 'Squint'], src: 'CAST:m_squint' });
legacy({ id: 'm_gilly', map: 3, at: [2586, 64929], kind: 'npc', name: ['Cook Gilly', 'Gilly'], src: 'CAST:m_gilly' });
legacy({ id: 'm_ned', map: 3, at: [1000, 61905], kind: 'npc', name: ['Old Ned', 'Old Ned'], src: 'CAST:m_ned' });
legacy({ id: 'm_coralia', map: 3, at: [1900, 67600], kind: 'npc', name: ['Queen Coralia of the Lumenfolk', 'Queen Coralia'], src: 'CAST:m_coralia', inside: 'm_coralcombe' });
legacy({ id: 'm_ripple', map: 3, at: [1900, 67600], kind: 'npc', name: ['Elder Ripple', 'Elder Ripple'], src: 'CAST:m_ripple', inside: 'm_coralcombe' });
legacy({ id: 'm_rocket', map: 3, at: [1900, 67600], kind: 'npc', name: ['Rocket', 'Rocket'], src: 'CAST:m_rocket', inside: 'm_coralcombe' });
legacy({ id: 'm_kipper', map: 3, at: [1900, 67600], kind: 'npc', name: ['Sir Kipper', 'Sir Kipper'], src: 'CAST:m_kipper', inside: 'm_coralcombe' });
legacy({ id: 'm_kelp', map: 3, at: [1900, 67600], kind: 'npc', name: ['Nana Kelp', 'Nana Kelp'], src: 'CAST:m_kelp', inside: 'm_coralcombe' });
legacy({ id: 'm_rafi', map: 3, at: [9460, 67241], kind: 'npc', name: ['Caravan-master Rafi Sandstride', 'Rafi'], src: 'CAST:m_rafi', inside: 'h_m_rafi' });
legacy({ id: 'm_saffron', map: 3, at: [9800, 67820], kind: 'npc', name: ['Saffron the Well-Warden', 'Saffron'], src: 'CAST:m_saffron' });
legacy({ id: 'm_kiln', map: 3, at: [10090, 67410], kind: 'npc', name: ['Old Kiln the Glassblower', 'Old Kiln'], src: 'CAST:m_kiln' });
legacy({ id: 'm_esme', map: 3, at: [10266, 68081], kind: 'npc', name: ['Esme, Keeper of Lamps', 'Esme'], src: 'CAST:m_esme' });
legacy({ id: 'm_dusty', map: 3, at: [9100, 67300], kind: 'npc', name: ['Dusty and Dune', 'Dusty and Dune'], src: 'CAST:m_dusty' });
// (Jinx stands somewhere new round Sable every day, and only at noon)
legacy({ id: 'm_jinx', map: 3, at: [9000, 67500], r: 1100, kind: 'npc', name: ['Jinx the Mirage Merchant', 'Jinx'], src: 'CAST:m_jinx' });
legacy({ id: 'm_sandy', map: 3, at: [10600, 62904], kind: 'npc', name: ['Queen Sandy', 'Queen Sandy'], src: 'SPECIAL:m_sandy', inside: 'm_burrows' });

// ---- the side quests' things (x3_people m3pBuild)
legacy({ id: 'm3p_furnace', map: 3, at: [10150, 67350], r: 30, kind: 'prop', name: ["Old Kiln's glass furnace", "Kiln's furnace"], src: 'LANDMARKS:m3p_furnace' });
legacy({ id: 'm3p_raft', map: 3, at: [2400, 61408], r: 60, kind: 'prop', name: ["Gilly's fishing raft", "Gilly's raft"], src: 'LANDMARKS:m3p_raft' });
legacy({ id: 'm3p_lh', map: 3, at: [1000, 61880], r: 30, kind: 'prop', name: ['the great moon lamp', 'the great lamp'], src: 'LANDMARKS:m3p_lh' });
legacy({ id: 'm3p_esmelamp', map: 3, at: [10284, 68057], r: 20, kind: 'prop', name: ['the Lamp House lamp', 'the Lamp House lamp'], src: 'LANDMARKS:m3p_esmelamp' });
legacy({ id: 'm3p_lamp0', map: 3, at: [9500, 67400], r: 20, kind: 'prop', name: ['Bertha the lamp', 'Bertha'], src: 'LANDMARKS:m3p_lamp0' });
legacy({ id: 'm3p_lamp1', map: 3, at: [9620, 67900], r: 20, kind: 'prop', name: ['Small Bertha the lamp', 'Small Bertha'], src: 'LANDMARKS:m3p_lamp1' });
legacy({ id: 'm3p_lamp2', map: 3, at: [10050, 67450], r: 20, kind: 'prop', name: ['Old Pip the lamp', 'Old Pip'], src: 'LANDMARKS:m3p_lamp2' });
legacy({ id: 'm3p_lamp3', map: 3, at: [9350, 67700], r: 20, kind: 'prop', name: ['Gertrude the lamp', 'Gertrude'], src: 'LANDMARKS:m3p_lamp3' });
legacy({ id: 'm3p_lamp4', map: 3, at: [10200, 67750], r: 20, kind: 'prop', name: ['Gilbert the lamp', 'Gilbert'], src: 'LANDMARKS:m3p_lamp4' });
legacy({ id: 'm3p_lamp5', map: 3, at: [9680, 67230], r: 20, kind: 'prop', name: ['Dot, on her tall pole', 'Dot'], src: 'LANDMARKS:m3p_lamp5' });
legacy({ id: 'm3p_lamp6', map: 3, at: [9920, 67230], r: 20, kind: 'prop', name: ['Dash, on his tall pole', 'Dash'], src: 'LANDMARKS:m3p_lamp6' });
legacy({ id: 'm3p_lamp7', map: 3, at: [9300, 67950], r: 20, kind: 'prop', name: ['Muffin, buried in the sand', 'Muffin'], src: 'LANDMARKS:m3p_lamp7' });
legacy({ id: 'm3p_lamp8', map: 3, at: [10350, 67950], r: 20, kind: 'prop', name: ['Barnaby, buried in the sand', 'Barnaby'], src: 'LANDMARKS:m3p_lamp8' });
legacy({ id: 'm3p_lamp9', map: 3, at: [9850, 67640], r: 20, kind: 'prop', name: ['Lady Wellington, by the Moon Well', 'Lady Wellington'], src: 'LANDMARKS:m3p_lamp9' });
legacy({ id: 'm3p_lamp10', map: 3, at: [10380, 67450], r: 20, kind: 'prop', name: ['Coco, on the tallest palm', 'Coco'], src: 'LANDMARKS:m3p_lamp10' });
legacy({ id: 'm3p_post1', map: 3, at: [3600, 64900], r: 20, kind: 'prop', name: ['the first ferry post', 'ferry post one'], src: 'LANDMARKS:m3p_post1' });
legacy({ id: 'm3p_post2', map: 3, at: [4600, 65300], r: 20, kind: 'prop', name: ['the second ferry post', 'ferry post two'], src: 'LANDMARKS:m3p_post2' });
legacy({ id: 'm3p_post3', map: 3, at: [5500, 65500], r: 20, kind: 'prop', name: ['the third ferry post', 'ferry post three'], src: 'LANDMARKS:m3p_post3' });
legacy({ id: 'm3p_rock1', map: 3, at: [3150, 67200], r: 30, kind: 'prop', name: ['a cracked rock under the water', 'a cracked rock'], src: 'x3_people.js M3P_ROCKS' });
legacy({ id: 'm3p_rock2', map: 3, at: [3350, 67250], r: 30, kind: 'prop', name: ['a cracked rock under the water', 'a cracked rock'], src: 'x3_people.js M3P_ROCKS' });
legacy({ id: 'm3p_rock3', map: 3, at: [3550, 67100], r: 30, kind: 'prop', name: ['a cracked rock under the water', 'a cracked rock'], src: 'x3_people.js M3P_ROCKS' });
legacy({ id: 'm3p_bubbledoor', map: 3, at: [3350, 67160], r: 30, kind: 'door', name: ['the Bubble Caves', 'the Bubble Caves'], src: 'x3_people.js M3P_BUBBLEDOOR' });
legacy({ id: 'm3p_sent1', map: 3, at: [12150, 65336], r: 20, kind: 'prop', name: ['a Moth Knight post', 'a knight post'], src: 'LANDMARKS:m3p_sent1' });
legacy({ id: 'm3p_sent2', map: 3, at: [12420, 65476], r: 20, kind: 'prop', name: ['a Moth Knight post', 'a knight post'], src: 'LANDMARKS:m3p_sent2' });
legacy({ id: 'm3p_sent3', map: 3, at: [12720, 65336], r: 20, kind: 'prop', name: ['a Moth Knight post', 'a knight post'], src: 'LANDMARKS:m3p_sent3' });
legacy({ id: 'm3p_sunk1', map: 3, at: [1600, 61000], r: 40, kind: 'chest', name: ['a sunken chest', 'a sunken chest'], src: 'x3_people.js M3P_SUNK' });
legacy({ id: 'm4s_burrowgap', map: 3, at: [10900, 67200], r: 80, kind: 'prop', name: ['the Burrow Gap', 'the Burrow Gap'], src: 'LANDMARKS:m_burrowgap' });
// the two Crab Pirate forts on the reef isles (x3_world camps m_c1 and m_c2; their pots mark the spot)
legacy({ id: 'm4s_fort1', map: 3, at: [5600, 61800], r: 160, kind: 'place', name: ['the north crab fort', 'a crab fort'], src: 'x3_people.js M3P_FORTS' });
legacy({ id: 'm4s_fort2', map: 3, at: [5400, 68200], r: 160, kind: 'place', name: ['the south crab fort', 'a crab fort'], src: 'x3_people.js M3P_FORTS' });
// Rowan's raft ferry (m_ferry's payoff): `world m4s_ferry open` sets the old flag the ferry crossings read
legacy({ id: 'm4s_ferry', map: 3, at: [2900, 64750], r: 40, kind: 'prop', name: ["Rowan's raft ferry", 'the raft ferry'],
  src: 'LANDMARKS:m3p_ferry', states: { open: ['set m_ferry_on'] } });
// where Wren reads on the Town Raft, and where Mags works on the dock (visitors while Dell's boat is in)
legacy({ id: 'm4s_wren_raft', map: 3, at: [2425, 65080], r: 60, kind: 'place', name: ["Wren's reading raft", "Wren's raft"], src: 'x3_people.js M3P_VIS' });

// ---- items the old code hands over (where: where Ash gets them)
legacy({ id: 'm_mooncrumb', map: 3, at: [10600, 62904], kind: 'item', name: ['a crumb of the moon', 'a moon crumb'],
  src: 'x3_people.js m_mooncrumb', where: 'm4_worm_mouth' });
legacy({ id: 'm_book_raw', map: 3, at: [3700, 62430], kind: 'item', name: ['a soggy book with a moth on the cover', 'a soggy moth book'],
  src: 'x3_people.js m_book_raw', where: 'm4_lumen_spire' });
legacy({ id: 'm_vletter', map: 3, at: [9000, 67500], kind: 'item', name: ['a letter a moth dropped, to "my duck"', 'a letter to "my duck"'],
  src: 'x3_people.js m_vletter', where: 'm_jinx' });

// ---- world facts (fact: 'entity=state' in people.js and the quests)
legacy({ id: 'm4s_lighthouse', map: 3, at: [1000, 62060], r: 120, kind: 'landmark', name: ["Old Ned's lighthouse", 'the lighthouse'],
  src: 'LANDMARKS:m_lm_lighthouse', states: { dark: '!flag m_lighthouse_lit', lit: 'flag m_lighthouse_lit' } });
legacy({ id: 'm4s_ferry_lines', map: 3, at: [2900, 64750], r: 40, kind: 'prop', name: ["Rowan's ferry lines", 'the ferry lines'],
  src: 'LANDMARKS:m3p_ferry', states: { cut: '!flag m_ferry_on', up: 'flag m_ferry_on' } });
legacy({ id: 'm4s_sunken_gate', map: 3, at: [6225, 65600], r: 200, kind: 'landmark', name: ['the Sunken Gate', 'the Sunken Gate'],
  src: 'LANDMARKS:m_sunkengate', states: { plugged: '!flag m_puff_done', open: 'flag m_puff_done' } });
legacy({ id: 'm4s_moon_well', map: 3, at: [9850, 67640], r: 120, kind: 'landmark', name: ['the Moon Well', 'the Moon Well'],
  src: 'POI:m_sable', states: { full: '!flag m_eclipse2', dim: 'flag m_eclipse2' } });
legacy({ id: 'm4s_sable_lamps', map: 3, at: [9800, 67600], r: 650, kind: 'place', name: ["Sable's twelve lamps", "Sable's lamps"],
  src: 'POI:m_sable', states: { lit: '!flag m_eclipse2', out: 'flag m_eclipse2 !flag m_lamps12', relit: 'flag m_lamps12' } });
legacy({ id: 'm4s_moon', map: 3, at: [2300, 64800], r: 800, kind: 'place', name: ['the moon', 'the moon'],
  src: 'POI:m_driftwood', states: { whole: '!flag m_eclipse1', bitten: 'flag m_eclipse1 !flag m_eclipse2', half: 'flag m_eclipse2' } });
legacy({ id: 'm4s_dell_boat', map: 3, at: [1260, 64790], r: 80, kind: 'place', name: ["Dell's boat, the Soggy Biscuit Three", "Dell's boat"],
  src: 'POI:m_driftwood', states: { away: 'flag m_dell_away stage<m_reforge' } });
