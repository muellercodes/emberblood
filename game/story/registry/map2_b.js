// Map 2 (Frostreach): things old code already draws that A3b's chapters (f_sky, f_gap, f_deep, f_dreadgate, f_dread,
// f_glaciar) name. Positions are x2_world's and x2_people's own (B.door, B.poi, f2wLM, p3Add, CAST homes). Data only.

// the Sky Isles: Skyreach Temple and Brother Pennant on his kite outside it (x2_people's CAST, home 12650,46550)
legacy({ id: 'f_skyreach', map: 2, at: [12650, 46150], r: 420, kind: 'place', name: 'the Sky Isles',
         aliases: ['Skyreach', 'the Sky Isles', 'Skyreach Temple'], src: 'POI:f_skyreach' });
legacy({ id: 'f_sky_door', map: 2, at: [12650, 46486], r: 40, kind: 'door', leads: 'f_sky', name: 'the doors of Skyreach Temple',
         aliases: ['the temple doors'], src: 'DOORS:f_sky' });
legacy({ id: 'f_pennant', map: 2, at: [12650, 46550], r: 60, kind: 'npc', name: 'Brother Pennant', src: 'CAST:f_pennant' });

// the Stonehorn hills past the Howling Gap: the Horned Gate (a ram skull as big as a house, the door of Stonehorn Deep)
legacy({ id: 'f_stonehorn', map: 2, at: [12200, 42500], r: 360, kind: 'place', name: 'the Horned Gate',
         aliases: ['the giant ram skull', 'the Stonehorn hills'], src: 'POI:f_stonehorn' });
legacy({ id: 'f_horned_door', map: 2, at: [12200, 42466], r: 40, kind: 'door', leads: 'f_deep', name: 'the door in the ram skull',
         aliases: ['Stonehorn Deep'], src: 'DOORS:f_deep' });

// the Dreadgate at the foot of Mount Dread: the plaza (Hush's arena), the Frost Lock, the door into the Heart of Dread
legacy({ id: 'f_dreadgate_plaza', map: 2, at: [7300, 44300], r: 420, kind: 'place', name: 'the Dreadgate plaza',
         aliases: ['the plaza'], src: 'POI:f_dreadgate' });
legacy({ id: 'f_lm_dreadlock', map: 2, at: [7300, 44160], r: 30, kind: 'landmark', name: 'the Frost Lock',
         aliases: ['the lock'], src: 'LANDMARKS:f_lm_dreadlock' });
legacy({ id: 'f_dread_door', map: 2, at: [7300, 44172], r: 40, kind: 'door', leads: 'f_dread', name: 'the Dreadgate',
         aliases: ['the black doors', 'the Heart of Dread'], src: 'DOORS:f_dread' });
// the Shoulder Ledge high on the mountain, and the Drum Stone on it (only a Ground Pound rings it: x2_story's pound
// listener sets f_drum and plays STORY.f_drum, which is f_dreadgate.js's data scene)
legacy({ id: 'f_shoulder', map: 2, at: [8400, 43420], r: 300, kind: 'place', name: 'the Shoulder Ledge',
         aliases: ["the mountain's shoulder"], src: 'POI:f_shoulder' });
legacy({ id: 'f_lm_drum', map: 2, at: [8350, 43400], r: 40, kind: 'landmark', name: 'the Drum Stone',
         aliases: ['the drum', 'the stone drum'], src: 'LANDMARKS:f_lm_drum' });

// the Crown of Dread, the summit (Glaciar's fight site; x2_story draws her coiled round the black ice spike). Ash
// comes out of the summit door at its south-west edge (x2_dun_b's d2bSummitOut puts him at 7060,41700).
legacy({ id: 'f_crown', map: 2, at: [7300, 41250], r: 560, kind: 'place', name: 'the Crown of Dread',
         aliases: ['the summit', 'the top of Mount Dread'], src: 'POI:f_crown' });
// Duchess the goat on the tip of the spike after the fight (x2_people draws her there and plays STORY.f_duchess when
// Ash walks up within 170 px, then sets f_duchess)
legacy({ id: 'f3_duchess', map: 2, at: [7300, 40820], r: 170, kind: 'npc', name: 'a goat on the ice spike',
         aliases: ['Duchess'], src: 'x2_people.js f2pDuchessUp' });
