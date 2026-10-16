// game/story/registry/map1_a.js (A2a): things the old code already draws on map 1 that c_coast, c_salt, c_claws and
// c_brass point at. New things those chapters add live in each chapter's own `place` block.
// Every `at` was checked in the live game (v10/a2a/probe.py on page.html, main 0fb0938): DOORS, LANDMARKS, CAST.
// People who live indoors are registered at their house door (the DOORS entry they own), people outdoors at their
// X1P_SPOT. Entries with `area` are inside that small area: `at` is in the area's own layout coordinates (the same
// numbers x1_story.js c1NestLayout uses; the Moth's Nest's (0,0) is world (20300,1300) today), and src 'furn:<k>'
// names the area object whose k is <k>.

// ---------- people
legacy({ id: 'c_barley', map: 1, at: [3900, 21140], r: 40, kind: 'npc', name: 'Old Barley', src: 'CAST:c_barley' });
legacy({ id: 'c_ottoline', map: 1, at: [7700, 24491], r: 40, kind: 'npc', name: 'Archivist Ottoline Inkwell',
  aliases: ['Ottoline', 'the archivist'], src: 'CAST:c_ottoline' });
legacy({ id: 'c_mina', map: 1, at: [2250, 26300], r: 60, kind: 'npc', name: 'Tide Warden Mina Mudge',
  aliases: ['Mina', 'the Tide Warden'], src: 'CAST:c_mina' });
legacy({ id: 'c_charlie', map: 1, at: [2000, 26871], r: 40, kind: 'npc', name: 'Chowder Charlie', src: 'CAST:c_charlie' });
legacy({ id: 'c_oona', map: 1, at: [1150, 27136], r: 40, kind: 'npc', name: 'Granny Oona Saltwhistle',
  aliases: ['Gran', 'Granny Oona'], src: 'CAST:c_oona' });
legacy({ id: 'c_ambrose', map: 1, at: [7200, 24846], r: 40, kind: 'npc', name: 'Clockkeeper Ambrose Tickett',
  aliases: ['Ambrose', 'the Clockkeeper'], src: 'CAST:c_ambrose' });

// ---------- places and landmarks
legacy({ id: 'c_fold', map: 1, at: [3900, 21000], r: 200, kind: 'landmark', name: "Old Barley's sheepfold",
  src: 'LANDMARKS:c_lm_fold' });
legacy({ id: 'c_saltmarsh', map: 1, at: [1900, 26600], r: 650, kind: 'place', name: 'Saltmarsh', src: 'POI:c_saltmarsh' });
legacy({ id: 'c_lm_tideclock', map: 1, at: [2200, 26360], r: 40, kind: 'landmark', name: 'the Tide Clock',
  src: 'LANDMARKS:c_lm_tideclock' });
legacy({ id: 'c_gullcrag_sands', map: 1, at: [1650, 28400], r: 500, kind: 'place', name: 'the Gullcrag Sands',
  src: 'x1_world.js C1G.sands' });
legacy({ id: 'c_gullcrag_head', map: 1, at: [2300, 28330], r: 300, kind: 'place', name: 'the top of Gullcrag Head',
  aliases: ['Gullcrag Head', 'the cliff top'], src: 'x1_world.js C1G.gull' });
legacy({ id: 'c_brassyards', map: 1, at: [10200, 24700], r: 160, kind: 'place', name: 'the Brass Yards', src: 'POI:c_brassyards' });
legacy({ id: 'bw_smokestack', map: 1, at: [10360, 24580], r: 70, kind: 'landmark', name: 'the old Brassworks smokestack',
  aliases: ['the smokestack', "Pearl's chimney"], src: 'LANDMARKS:c_lm_stack' });
// a chimney on the Clock Quarter terrace just north of the Great Clock (x1_world.js c1wObj('chimney') list)
legacy({ id: 'gh_chimney_n', map: 1, at: [7230, 24410], r: 20, kind: 'prop', name: 'a chimney by the Great Clock',
  src: 'prop:chimney@7230,24410' });

// ---------- doors
legacy({ id: 'c_tidehouse_door', map: 1, at: [2250, 26332], r: 30, kind: 'door', name: 'the Tide House door',
  leads: 'c_tidehouse', src: 'DOORS:c_tidehouse' });
legacy({ id: 'c_gullcrag_door', map: 1, at: [1400, 29414], r: 40, kind: 'door', name: 'the Gullcrag Caves',
  aliases: ['the sea caves', 'the caves'], leads: 'c_gullcrag', src: 'DOORS:c_gullcrag' });
legacy({ id: 'c_nest_hatch', map: 1, at: [7200, 24565], r: 30, kind: 'door', name: 'the hatch on top of the Great Clock',
  aliases: ['the bell loft', "the Moth's Nest"], leads: 'c_mothnest', src: 'DOORS:c_mothnest' });
legacy({ id: 'bw_roof_hatch', map: 1, at: [10360, 24560], r: 30, kind: 'door', name: 'the hatch on top of the smokestack',
  leads: 'c_brassworks', src: 'DOORS:c_brassworks@10360,24560' });
legacy({ id: 'bw_front_gate', map: 1, at: [10210, 24852], r: 40, kind: 'door', name: 'the Brassworks gate',
  aliases: ['the great gate'], leads: 'c_brassworks', src: 'DOORS:c_brassworks@10210,24852' });

// ---------- inside the Moth's Nest (the bell loft at the top of the Great Clock, x1_story.js c1NestLayout)
legacy({ id: 'nest_bell', map: 1, area: 'c_mothnest', at: [260, 112], r: 44, kind: 'examine', name: 'the great bell',
  src: 'furn:c1_nbell' });
legacy({ id: 'nest_tin', map: 1, area: 'c_mothnest', at: [354, 259], r: 16, kind: 'examine', name: 'the biscuit tin',
  src: 'furn:c1_ntin' });
legacy({ id: 'nest_crate', map: 1, area: 'c_mothnest', at: [416, 166], r: 22, kind: 'prop', name: 'the crate table',
  src: 'furn:c1_ncrate' });
legacy({ id: 'nest_hammock', map: 1, area: 'c_mothnest', at: [94, 173], r: 50, kind: 'prop', name: 'the hammock',
  src: 'furn:c1_nhammock' });
