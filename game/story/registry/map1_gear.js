// game/story/registry/map1_gear.js: the things on map 1 (the Clockwork Coast) that the old code already draws and
// c_gear names. `src` says where the engine finds the real thing (checked by __eb.story.entity(id).ok).

// the Upper Gate in the wall of the Clock Quarter (x1_world c1wObj 'gate'); the town is south of it
legacy({ id: 'c_upper_gate', map: 1, at: [6950, 24108], r: 160, kind: 'gate', name: ['the Upper Gate', 'the Upper Gate'],
  src: 'prop:gate@6950,24108' });

// the Moth Mask Watch board by the Gazette in the Lower Town (its own prompt: "Read the Moth Mask Watch")
legacy({ id: 'c_lm_watch', map: 1, at: [7110, 25990], r: 40, kind: 'examine', name: ['the Moth Mask Watch board', 'the Moth Mask board'],
  aliases: ['the Moth Mask Watch', 'the board'], src: 'LANDMARKS:c_lm_watch' });

// Lord Whirligig's house in the Clock Quarter (its roof is the start of the rooftop chase)
legacy({ id: 'c_whirligig_manor', map: 1, at: [7900, 24880], r: 140, kind: 'landmark', name: ['Whirligig Manor', 'Whirligig Manor'],
  aliases: ['the Manor', 'the manor'], src: 'HOUSES:c_whirligig' });

// the Great Clock: a level 5 tower in the Clock Quarter, its dial painted on the south face, the hands drawn live
legacy({ id: 'c_great_clock', map: 1, at: [7200, 24700], r: 120, kind: 'landmark', name: ['the Great Clock', 'the Great Clock'],
  src: 'elev:5@7200,24600' });
legacy({ id: 'c_clock_hand', map: 1, at: [7200, 24712], r: 20, kind: 'landmark', name: ["the Great Clock's minute hand", 'the big hand'],
  src: 'x1_world.js c1DrawClock' });
legacy({ id: 'c_clock_top', map: 1, at: [7200, 24600], r: 60, kind: 'landmark', name: ['the top of the Great Clock', 'the top of the clock'],
  src: 'elev:5@7200,24600' });

// the people c_gear talks to (x1_people's cast; their homes and spots are theirs)
legacy({ id: 'c_hettie', map: 1, at: [6600, 25800], r: 40, kind: 'npc', name: ['Professor Hettie Sprocket', 'Professor Sprocket'], src: 'CAST:c_hettie' });
legacy({ id: 'c_hester', map: 1, at: [6700, 24560], r: 40, kind: 'npc', name: ['Captain Hester Ticklebrass', 'Captain Ticklebrass'], src: 'CAST:c_hester' });
legacy({ id: 'c_whirligig', map: 1, at: [7900, 24960], r: 40, kind: 'npc', name: ['Lord Percival Whirligig', 'Lord Whirligig'], src: 'CAST:c_whirligig' });
legacy({ id: 'c_penny', map: 1, at: [7050, 25850], r: 40, kind: 'npc', name: ['Penny Press', 'Penny Press'], src: 'CAST:c_penny' });
legacy({ id: 'c_bobs', map: 1, at: [6990, 24300], r: 40, kind: 'npc', name: ['Constables Bob and Bob', 'the Bobs'], src: 'CAST:c_bobs' });

// the Moth Mask (Vesper, masked): no town spot; x1_story draws her sightings (C1ST.sight) and scenes place her
legacy({ id: 'c_mask', map: 1, at: [7950, 24860], r: 30, kind: 'npc', name: ['the Moth Mask', 'the Moth Mask'], src: 'x1_story.js c1SightAt' });
