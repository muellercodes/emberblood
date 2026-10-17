// game/story/registry/map2_a.js (A3a): things the old code already draws on map 2 (Frostreach) that Act III's first
// three chapters (f_snow, f_pass, f_hearth, f_maze, f_kindle, f_thaw) point at. New things those chapters add live in
// each chapter's own `place` block. Every `at` is the game's own number (CAST, LANDMARKS, POI, DOORS, CROSSINGS on
// main c26d617, read in the running game). People who live indoors are registered at their house door.
// (The same id in another registry file must be the same entry: A3b's map2_b.js, A3S's map2_s.js.)

// ---------- people
legacy({ id: 'f_brynja', map: 2, at: [6880, 49040], r: 40, kind: 'npc', name: 'Old Brynja, Hearthkeeper',
  aliases: ['Brynja', 'the Hearthkeeper'], src: 'CAST:f_brynja' });
legacy({ id: 'f_brann', map: 2, at: [6270, 48900], r: 40, kind: 'npc', name: 'Captain Brann Stoutmitt',
  aliases: ['Brann', 'the Captain'], src: 'CAST:f_brann' });
legacy({ id: 'f_eider', map: 2, at: [6990, 49326], r: 40, kind: 'npc', name: 'Brother Eider',
  aliases: ['Eider', 'the archive monk'], src: 'CAST:f_eider', inside: 'h_f_eider' });
legacy({ id: 'f_pim', map: 2, at: [6650, 49108], r: 40, kind: 'npc', name: 'Pim', aliases: ['the cocoa girl'], src: 'CAST:f_pim' });

// ---------- towns and places (POI keys)
legacy({ id: 'f_hearthold', map: 2, at: [6800, 49000], r: 620, kind: 'place', name: 'Hearthold',
  aliases: ['the last warm town', 'the town with the wall'], src: 'POI:f_hearthold' });
legacy({ id: 'f_rimeholm', map: 2, at: [1900, 47000], r: 520, kind: 'place', name: 'Rimeholm',
  aliases: ['the fishing village on the cliffs'], src: 'POI:f_rimeholm' });
legacy({ id: 'f_glacier', map: 2, at: [5600, 44450], r: 420, kind: 'place', name: 'the Glacier Mouth',
  aliases: ['the Glacier Maze', 'the North Forge', 'where the glacier meets the Glimmerfrost'], src: 'POI:f_glacier' });
legacy({ id: 'f_steamwell', map: 2, at: [3800, 49400], r: 220, kind: 'place', name: 'the Steamwell',
  aliases: ['the hot spring'], src: 'POI:f_steamwell' });
legacy({ id: 'f_whitepass', map: 2, at: [2600, 50450], r: 260, kind: 'place', name: 'the top of the High Pass',
  aliases: ['the White Pass'], src: 'POI:f_whitepass' });
legacy({ id: 'f_skyreach', map: 2, at: [12650, 46150], r: 420, kind: 'place', name: 'Skyreach',
  aliases: ['the Sky Isles', 'the Wind Monks'], src: 'POI:f_skyreach' });
legacy({ id: 'f_crown', map: 2, at: [7300, 41250], r: 560, kind: 'place', name: 'the Crown of Dread',
  aliases: ['the summit of Mount Dread', 'the top of Mount Dread'], src: 'POI:f_crown' });

// ---------- doors and crossings
legacy({ id: 'f_maze_door', map: 2, at: [5600, 44450], r: 40, kind: 'door', name: 'the door of the Glacier Maze',
  aliases: ['the Glacier Maze'], src: 'DOORS:f_maze', leads: 'f_maze' });
legacy({ id: 'f_pass_top', map: 2, at: [2600, 50720], r: 60, kind: 'door', name: 'the High Pass, going down to Embermere',
  src: 'CROSSINGS:f_pass_n', leads: 'high_pass' });

// ---------- landmarks (x2_world's own prompts: examining them reads their own lines first)
legacy({ id: 'f_lm_hearth', map: 2, at: [6800, 48990], r: 60, kind: 'landmark', name: 'the Great Hearth',
  aliases: ['the Hearth', 'the giant fireplace', 'the old girl'], src: 'LANDMARKS:f_lm_hearth' });
legacy({ id: 'f_lm_northgate', map: 2, at: [6800, 48422], r: 60, kind: 'gate', name: "Hearthold's North Gate",
  aliases: ['the North Gate', 'the frozen gate'], src: 'LANDMARKS:f_lm_northgate', opens_with: 'flag f_northgate',
  states: { frozen: 'until the Great Hearth is lit', open: 'from the f_kindle scene (flag f_northgate)' } });
legacy({ id: 'f_lm_bell', map: 2, at: [1992, 46928], r: 30, kind: 'landmark', name: "the bell rope of Rimeholm's tower",
  aliases: ['the bell rope', 'the alarm bell'], src: 'LANDMARKS:f_lm_bell' });
legacy({ id: 'f_bell_tower', map: 2, at: [1930, 46750], r: 80, kind: 'place', name: "Rimeholm's bell tower",
  aliases: ['the bell tower', 'the top of the tower'], src: 'elev:3@1930,46750' });

// ---------- frozen folk (p3 frozen landmarks; their own prompt says they are frozen, Blaze thaws them)
legacy({ id: 'f_saga_ice', map: 2, at: [1150, 46900], r: 30, kind: 'landmark', name: 'Saga the fisher, frozen on the quay',
  aliases: ['the frozen fisher girl'], src: 'LANDMARKS:f_saga' });
legacy({ id: 'f_bo_ice', map: 2, at: [1700, 46646], r: 30, kind: 'landmark', name: 'Little Bo, frozen on the chapel roof',
  aliases: ['the frozen boy on the roof'], src: 'LANDMARKS:f_bo' });
legacy({ id: 'f_ylva_ice', map: 2, at: [1950, 46746], r: 30, kind: 'landmark', name: 'the knitter frozen on top of the bell tower',
  aliases: ['Grandmother Ylva', 'the oldest granny'], src: 'LANDMARKS:f_ylva' });
legacy({ id: 'f_guard_ice', map: 2, at: [6050, 48850], r: 30, kind: 'landmark', name: 'a Hearthwarden frozen on watch outside the wall',
  aliases: ['the frozen guard'], src: 'LANDMARKS:f_frz_guard1' });
