// game/story/registry/map1_s.js (A2S): Clockwork Coast things the old code draws that the Act II side quests, the
// people's talk and the whip hooks name. Coordinates read from the live game (A2S_NOTES.md, "Registry"). People who
// live indoors are registered at their front door. World facts used by `fact:` tags carry `states`: each state is
// the condition under which it holds (the checker's rule 10 reads them). If another registry file defines one of these
// ids, the two entries must agree. ENG's map1_gear.js registers c_hester, c_hettie, c_whirligig, c_penny and
// c_bobs, so they are not repeated here.

// ---- the people (x1_people X1P_CAST; CAST ids)
legacy({ id: 'c_ottoline', map: 1, at: [7700, 24491], kind: 'npc', name: ['Archivist Ottoline Inkwell', 'Ottoline'], src: 'CAST:c_ottoline' });
legacy({ id: 'c_mo', map: 1, at: [8126, 26436], kind: 'npc', name: ['Harbormaster Mo Barnacle', 'Harbormaster Mo'], src: 'CAST:c_mo' });
legacy({ id: 'c_ingrid', map: 1, at: [7700, 25871], kind: 'npc', name: ['Ingrid Anvilsong', 'Ingrid'], src: 'CAST:c_ingrid' });
legacy({ id: 'c_fig', map: 1, at: [7300, 26256], kind: 'npc', name: ['Auntie Fig', 'Auntie Fig'], src: 'CAST:c_fig' });
legacy({ id: 'c_ambrose', map: 1, at: [7200, 24846], kind: 'npc', name: ['Clockkeeper Ambrose Tickett', 'Ambrose'], src: 'CAST:c_ambrose' });
legacy({ id: 'c_ravel', map: 1, at: [7200, 25980], kind: 'npc', name: ['Madame Ravel', 'Madame Ravel'], src: 'CAST:c_ravel' });
legacy({ id: 'c_jo', map: 1, at: [6700, 26500], kind: 'npc', name: ['Skipper Jo', 'Jo'], src: 'CAST:c_jo' });
legacy({ id: 'c_bob3', map: 1, at: [7719, 25198], kind: 'npc', name: ['The Third Bob', 'Bob'], src: 'SPECIAL:c_bob3' });
legacy({ id: 'c_mina', map: 1, at: [2416, 26353], kind: 'npc', name: ['Tide Warden Mina Mudge', 'Mina'], src: 'CAST:c_mina' });
legacy({ id: 'c_charlie', map: 1, at: [2000, 26871], kind: 'npc', name: ['Chowder Charlie', 'Charlie'], src: 'CAST:c_charlie' });
legacy({ id: 'c_dory', map: 1, at: [2578, 26619], kind: 'npc', name: ['Dory Cockle', 'Dory'], src: 'CAST:c_dory' });
legacy({ id: 'c_oona', map: 1, at: [1150, 27136], kind: 'npc', name: ['Granny Oona Saltwhistle', 'Granny Oona'], src: 'CAST:c_oona' });
legacy({ id: 'c_tarbuckle', map: 1, at: [1400, 27350], kind: 'npc', name: ['Old Tarbuckle', 'Old Tarbuckle'], src: 'CAST:c_tarbuckle' });
legacy({ id: 'c_posy', map: 1, at: [2580, 26650], kind: 'npc', name: ['Little Posy Cockle', 'Posy'], src: 'CAST:c_posy' });
legacy({ id: 'c_maudie', map: 1, at: [4360, 25931], kind: 'npc', name: ['Maudie Gale', 'Maudie'], src: 'CAST:c_maudie' });
legacy({ id: 'c_agatha', map: 1, at: [12230, 28586], kind: 'npc', name: ['Keeper Agatha Brightwater', 'Agatha'], src: 'CAST:c_agatha' });
legacy({ id: 'c_barley', map: 1, at: [3900, 21140], kind: 'npc', name: ['Old Barley', 'Old Barley'], src: 'CAST:c_barley' });

// ---- doors and places
legacy({ id: 'h_c_oona', map: 1, at: [1150, 27136], r: 46, kind: 'door', name: ["Oona's Stilt House", "Gran's house"], src: 'DOORS:h_c_oona' });
legacy({ id: 'h_c_hettie', map: 1, at: [6600, 25821], r: 46, kind: 'door', name: ["Sprocket's Workshop", "Hettie's workshop"], src: 'DOORS:h_c_hettie' });
legacy({ id: 'c_brassyards', map: 1, at: [10200, 24700], r: 160, kind: 'place', name: ['the Brass Yards', 'the Brass Yards'], src: 'POI:c_brassyards' });

// ---- the side quests' landmarks (x1_people x1pBuild)
legacy({ id: 'c_lm_oonanest', map: 1, at: [1178, 26982], r: 20, kind: 'examine', name: ['the gull nest on the chimney', 'the gull nest'], src: 'LANDMARKS:c_lm_oonanest' });
legacy({ id: 'c_lm_oonapost', map: 1, at: [1265, 27132], r: 20, kind: 'prop', name: ['the empty post by the door', 'the post'], src: 'LANDMARKS:c_lm_oonapost' });
legacy({ id: 'c_lm_note3', map: 1, at: [4357, 25790], r: 20, kind: 'examine', name: ["the note on the Gull's Rest chimney", 'the chimney note'], src: 'LANDMARKS:c_lm_note3' });
legacy({ id: 'c_lm_note4', map: 1, at: [8100, 26900], r: 20, kind: 'examine', name: ['the note on the east crane', 'the crane note'], src: 'LANDMARKS:c_lm_note4' });
legacy({ id: 'c_lm_note5h', map: 1, at: [7290, 25262], r: 20, kind: 'examine', name: ['the gap behind the Cogwater Falls', 'behind the falls'], src: 'LANDMARKS:c_lm_note5h' });
legacy({ id: 'c_lm_note6', map: 1, at: [1300, 22600], r: 20, kind: 'examine', name: ['the note on the tallest stone', 'the last note'], src: 'LANDMARKS:c_lm_note6' });
legacy({ id: 'c_lm_pep1', map: 1, at: [3300, 28400], r: 20, kind: 'examine', name: ['a sea pepper', 'a sea pepper'], src: 'LANDMARKS:c_lm_pep1' });
legacy({ id: 'c_lm_pep2', map: 1, at: [5200, 28500], r: 20, kind: 'examine', name: ['a sea pepper', 'a sea pepper'], src: 'LANDMARKS:c_lm_pep2' });
legacy({ id: 'c_lm_pep3', map: 1, at: [4500, 27900], r: 20, kind: 'examine', name: ['a sea pepper on a cliff ledge', 'a cliff pepper'], src: 'LANDMARKS:c_lm_pep3' });
legacy({ id: 'c_lm_deck', map: 1, at: [4600, 28300], r: 30, kind: 'examine', name: ['the deck of the Saucy Gull', 'the wreck'], src: 'LANDMARKS:c_lm_deck' });
legacy({ id: 'c_lm_wreck', map: 1, at: [4600, 28360], r: 30, kind: 'examine', name: ['the wreck of the Saucy Gull', 'the wreck'], src: 'LANDMARKS:c_lm_wreck' });
legacy({ id: 'c_lm_vane', map: 1, at: [6700, 24440], r: 20, kind: 'examine', name: ['the Clockwatch weathervane', 'the weathervane'], src: 'LANDMARKS:c_lm_vane' });
legacy({ id: 'c_lm_gullisle', map: 1, at: [4100, 29700], r: 20, kind: 'examine', name: ['the gull nests on Gull Isle', 'Gull Isle'], src: 'LANDMARKS:c_lm_gullisle' });
legacy({ id: 'c_lm_eye', map: 1, at: [6950, 21700], r: 20, kind: 'examine', name: ["the Chalk Dragon's eye", "the dragon's eye"], src: 'LANDMARKS:c_lm_eye' });
legacy({ id: 'c_lm_moonring', map: 1, at: [1350, 22760], r: 140, kind: 'examine', name: ['the Moon Ring', 'the Moon Ring'], src: 'x1_world.js c_lm_moonring' });
legacy({ id: 'c_lm_skiff_quay', map: 1, at: [7400, 26500], r: 20, kind: 'prop', name: ['the Gearhaven quay skiff landing', 'the quay landing'], src: 'LANDMARKS:c_lm_skiff_quay' });
legacy({ id: 'c_lm_skiff_beach', map: 1, at: [11000, 28800], r: 20, kind: 'prop', name: ['the Lantern Point beach skiff landing', 'the beach landing'], src: 'LANDMARKS:c_lm_skiff_beach' });
legacy({ id: 'c_ch_gullisle', map: 1, at: [4040, 29745], kind: 'chest', name: ['the chest on Gull Isle', 'a chest'], src: 'CHESTS:c_ch_gullisle' });
legacy({ id: 'c_ch_seal', map: 1, at: [11800, 30215], kind: 'chest', name: ["Sir Blubbington's chest", "the seal's chest"], src: 'CHESTS:c_ch_seal' });

// the skiff landings (x1_people x1pBuild): c_regatta opens them with `world c_skiffs open`
legacy({ id: 'c_skiffs', map: 1, at: [7400, 26500], r: 20, kind: 'prop', name: ["Skipper Jo's skiff landings", 'the skiff landings'],
  src: 'LANDMARKS:c_lm_skiff_quay', states: { open: ['set c_skiffs'] } });

// ---- world facts (fact: 'entity=state' in people.js and the quests). The Great Clock is also in map1_gear.js (the
// same spot and source); the states are added here.
legacy({ id: 'c_great_clock', map: 1, at: [7200, 24700], r: 120, kind: 'landmark', name: ['the Great Clock', 'the Great Clock'],
  src: 'elev:5@7200,24600', states: { stopped: '!flag c_clock_on', ticking: 'flag c_clock_on' } });
legacy({ id: 'c_tide_clock', map: 1, at: [2200, 26360], r: 120, kind: 'landmark', name: ['the Tide Clock', 'the Tide Clock'],
  src: 'LANDMARKS:c_lm_tideclock', states: { high: '!flag c_lowtide', low: 'flag c_lowtide' } });
legacy({ id: 'c_lighthouse_lamp', map: 1, at: [12880, 29020], r: 200, kind: 'landmark', name: ['the Spinning Lighthouse', 'the lighthouse'],
  src: 'prop:lighthouse@12880,29020', states: { dark: '!stage>=c_spire', lit: 'stage>=c_spire' } });
legacy({ id: 'c_harbor', map: 1, at: [7610, 28900], r: 400, kind: 'landmark', name: ['the harbor chain', 'the harbor chain'],
  src: 'LANDMARKS:c_lm_chain', states: { closed: '!flag c_clock_on', open: 'flag c_clock_on' } });
legacy({ id: 'c_spire_rock', map: 1, at: [7400, 30000], r: 300, kind: 'landmark', name: ['Spire Rock', 'Spire Rock'],
  src: 'prop:spire@7400,30000', states: { hidden: '!flag c_spire_up', risen: 'flag c_spire_up' } });
legacy({ id: 'c_gearhaven', map: 1, at: [7200, 25200], r: 1100, kind: 'place', name: ['Gearhaven', 'Gearhaven'],
  src: 'POI:c_gearhaven', states: { clear: '!flag c_snow', snowy: 'flag c_snow' } });
