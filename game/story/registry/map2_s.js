// game/story/registry/map2_s.js (A3S): Frostreach things the old code draws that A3S's Act III data names (the side
// quests, people.js, places_map2.js). Coordinates read from the live game (A3S_NOTES.md, "Registry"). People who live
// indoors are registered at their front door with `inside`; Rimeholm's people stand at home once they are thawed
// (`if`). World facts used by `fact:` tags carry `states` (each state is the condition under which it holds; the
// checker's rule 10 reads them). Landmarks and facts here use A3S's own f3s_ ids, so they never clash with A3a or
// A3b; a person's id is their CAST id (if another registry file defines one, the two entries must agree).

// ---- Hearthold (x2_people F2P_CAST)
legacy({ id: 'f_brynja', map: 2, at: [6880, 49040], kind: 'npc', name: ['Old Brynja, Hearthkeeper', 'Brynja'], src: 'CAST:f_brynja' });
legacy({ id: 'f_brann', map: 2, at: [6270, 48900], kind: 'npc', name: ['Captain Brann Stoutmitt', 'Captain Brann'], src: 'CAST:f_brann' });
legacy({ id: 'f_pim', map: 2, at: [6650, 49108], kind: 'npc', name: ['Pim', 'Pim'], src: 'CAST:f_pim' });
legacy({ id: 'f_soren', map: 2, at: [7900, 48250], kind: 'npc', name: ['Soren Sledwright', 'Soren'], src: 'CAST:f_soren' });
legacy({ id: 'f_toastwhistle', map: 2, at: [7110, 48916], kind: 'npc', name: ['Mayor Ottilie Toastwhistle', 'the Mayor'], src: 'CAST:f_toastwhistle', inside: 'h_f_toastwhistle' });
legacy({ id: 'f_gunnhild', map: 2, at: [6470, 49301], kind: 'npc', name: ['Gunnhild Anvilheart', 'Gunnhild'], src: 'CAST:f_gunnhild', inside: 'h_f_gunnhild' });
legacy({ id: 'f_mags', map: 2, at: [7240, 49181], kind: 'npc', name: ['Mags Sprocket', 'Mags'], src: 'CAST:f_mags', inside: 'h_f_mags' });
legacy({ id: 'f_hilde', map: 2, at: [6560, 48776], kind: 'npc', name: ['Hilde Pottersnow', 'Hilde'], src: 'CAST:f_hilde', inside: 'h_f_hilde' });
legacy({ id: 'f_eider', map: 2, at: [6990, 49326], kind: 'npc', name: ['Brother Eider', 'Brother Eider'], src: 'CAST:f_eider', inside: 'h_f_eider' });
legacy({ id: 'f_fergus', map: 2, at: [6380, 49046], kind: 'npc', name: ['Fergus Fiddlesticks', 'Fergus'], src: 'CAST:f_fergus', if: 'flag f_thaw_f_fergus' });
legacy({ id: 'f_sigrid', map: 2, at: [6720, 49175], kind: 'npc', name: ['Sigrid the explorer', 'Sigrid'], src: 'CAST:f_sigrid', if: 'flag f_thaw_sigrid' });
legacy({ id: 'f_hjalmar', map: 2, at: [6950, 49175], kind: 'npc', name: ['Hjalmar the explorer', 'Hjalmar'], src: 'CAST:f_hjalmar', if: 'flag f_thaw_hjalmar' });

// ---- Rimeholm (frozen until thawed; then at home)
legacy({ id: 'f_ylva', map: 2, at: [2146, 46606], kind: 'npc', name: ['Grandmother Ylva', 'Granny Ylva'], src: 'CAST:f_ylva', if: 'flag f_ylva' });
legacy({ id: 'f_tollef', map: 2, at: [2086, 47036], kind: 'npc', name: ['Tollef the Bellringer', 'Tollef'], src: 'CAST:f_tollef', if: 'flag f_thaw_f_tollef' });
legacy({ id: 'f_saga', map: 2, at: [1106, 47386], kind: 'npc', name: ['Saga', 'Saga'], src: 'CAST:f_saga', if: 'flag f_thaw_f_saga' });
legacy({ id: 'f_sigrun', map: 2, at: [2186, 47321], kind: 'npc', name: ['Sigrun the Cook', 'Sigrun'], src: 'CAST:f_sigrun', if: 'flag f_thaw_f_sigrun' });
legacy({ id: 'f_bo', map: 2, at: [2224, 47347], kind: 'npc', name: ['Little Bo', 'Little Bo'], src: 'CAST:f_bo', if: 'flag f_thaw_f_bo' });
legacy({ id: 'f_nils', map: 2, at: [2586, 47336], kind: 'npc', name: ['Nils the Goatherd', 'Nils'], src: 'CAST:f_nils', if: 'flag f_thaw_f_nils' });
legacy({ id: 'f_oskar', map: 2, at: [1586, 47066], kind: 'npc', name: ['Oskar the Mailman', 'Oskar'], src: 'CAST:f_oskar', if: 'flag f_thaw_f_oskar' });
legacy({ id: 'f_rasmus', map: 2, at: [2486, 46547], kind: 'npc', name: ['Rasmus Ironsnow', 'Rasmus'], src: 'CAST:f_rasmus', if: 'flag f_thaw_f_rasmus' });
legacy({ id: 'f_nisse', map: 2, at: [2500, 47352], kind: 'npc', name: ['Nisse the goat', 'Nisse'], src: 'SPECIAL:f_nisse', if: 'flag f_thaw_f_nils' });

// ---- the wild north
legacy({ id: 'f_hask', map: 2, at: [11400, 49666], kind: 'npc', name: ['Old Hask', 'Old Hask'], src: 'CAST:f_hask' });
legacy({ id: 'f_pennant', map: 2, at: [12650, 46550], kind: 'npc', name: ['Brother Pennant', 'Brother Pennant'], src: 'CAST:f_pennant' });
legacy({ id: 'f_mumble', map: 2, at: [13050, 48720], kind: 'npc', name: ['Mumble the yeti', 'Mumble'], src: 'SPECIAL:f_mumble' });
legacy({ id: 'f_greymane', map: 2, at: [3600, 50300], kind: 'npc', name: ['Greymane', 'Greymane'], src: 'SPECIAL:f_greymane', if: 'quest f_pack active', card: false });

// ---- places the side quests and the talk name (x2_people's and x2_world's landmarks)
legacy({ id: 'f3s_crate', map: 2, at: [5380, 50560], r: 40, kind: 'landmark', name: ["Mags's powder crate on its ledge", 'the powder crate'], src: 'LANDMARKS:f_lm_crate', if: 'quest f_bombs active' });
legacy({ id: 'f3s_boulder', map: 2, at: [5900, 47630], r: 60, kind: 'landmark', name: ['the Big Boulder on the old Quarry Road', 'the Big Boulder'], src: 'LANDMARKS:f_quarry_boulder' });
legacy({ id: 'f3s_bell', map: 2, at: [1992, 46928], r: 40, kind: 'landmark', name: ["Rimeholm's great bell", 'the bell'], src: 'LANDMARKS:f_lm_bell' });
legacy({ id: 'f3s_singing', map: 2, at: [13250, 47250], r: 40, kind: 'landmark', name: ['the Singing Stone', 'the Singing Stone'], src: 'LANDMARKS:f_lm_singing' });
legacy({ id: 'f3s_runedrum', map: 2, at: [13300, 41380], r: 50, kind: 'landmark', name: ['the Rune Drum', 'the Rune Drum'], src: 'LANDMARKS:f_lm_runedrum' });
legacy({ id: 'f3s_skulldrum', map: 2, at: [11000, 41700], r: 60, kind: 'landmark', name: ['the Mammoth Graveyard', 'the mammoth bones'], src: 'LANDMARKS:f_lm_skulldrum' });
legacy({ id: 'f3s_tent', map: 2, at: [7080, 48716], r: 30, kind: 'landmark', name: ["Juniper's Map Tent", "Juniper's tent"], src: 'LANDMARKS:f_lm_tent' });
legacy({ id: 'f3s_floes', map: 2, at: [2100, 42100], r: 400, kind: 'place', name: ['the Shiversea floes', 'the sea ice'], src: 'POI:f_wreck' });
legacy({ id: 'f3s_kennel', map: 2, at: [11450, 49904], r: 40, kind: 'landmark', name: ["Hask's kennel", 'the kennel'], src: 'LANDMARKS:f_lm_kennel' });
legacy({ id: 'f3s_knut', map: 2, at: [6500, 44400], r: 40, kind: 'landmark', name: ['Sir Knut, frozen on the Dreadmoor', 'frozen Sir Knut'], src: 'LANDMARKS:f_frz_knight' });
legacy({ id: 'f3s_dreadgate', map: 2, at: [7300, 44300], r: 420, kind: 'place', name: ['the Dreadgate', 'the Dreadgate'], src: 'POI:f_dreadgate' });
legacy({ id: 'f3s_hearthold', map: 2, at: [6800, 49000], r: 620, kind: 'place', name: ['Hearthold', 'Hearthold'], src: 'POI:f_hearthold' });

// ---- shortcuts the side quests open (`world <id> open` runs these effects)
legacy({ id: 'f3s_sledline', map: 2, at: [11660, 49934], r: 30, kind: 'prop', name: ["Hask's dog sled posts", 'the sled posts'],
  src: 'LANDMARKS:f_lm_sledpost_rest', states: { open: ['set f_sledline'] } });
legacy({ id: 'f3s_tunnel', map: 2, at: [1750, 46086], r: 50, kind: 'prop', name: ["Juniper's ice tunnel", "Juniper's tunnel"],
  src: 'LANDMARKS:f_tunnel_boulder', states: { open: ['set f_tunnel_open'] } });

// ---- world facts (fact: 'entity=state' in people.js and the quests)
legacy({ id: 'f3s_hearth', map: 2, at: [6800, 48990], r: 120, kind: 'landmark', name: ['the Great Hearth', 'the Great Hearth'],
  src: 'LANDMARKS:f_lm_hearth', states: { dying: '!flag f_hearth_lit', blue: 'flag f_hearth_lit' } });
legacy({ id: 'f3s_northgate', map: 2, at: [6800, 48422], r: 80, kind: 'landmark', name: ["Hearthold's North Gate", 'the North Gate'],
  src: 'LANDMARKS:f_lm_northgate', states: { frozen: '!flag f_northgate', open: 'flag f_northgate' } });
legacy({ id: 'f3s_hush', map: 2, at: [7300, 44300], r: 420, kind: 'place', name: ['the great white moth', 'the white moth'],
  src: 'POI:f_dreadgate', states: { loose: '!flag f_hush_done', gone: 'flag f_hush_done' } });
legacy({ id: 'f3s_glaciar', map: 2, at: [7300, 41250], r: 560, kind: 'place', name: ['Glaciar on the Crown', 'Glaciar'],
  src: 'POI:f_crown', states: { spell: '!choice f_glaciar', free: 'choice f_glaciar=free', asleep: 'choice f_glaciar=defeat' } });
legacy({ id: 'f3s_forge', map: 2, at: [6470, 49301], r: 46, kind: 'landmark', name: ['Anvilheart Forge', "Gunnhild's forge"],
  src: 'DOORS:h_f_gunnhild', states: { cold: '!flag f_forge_lit', lit: 'flag f_forge_lit' } });
legacy({ id: 'f3s_rimeholm', map: 2, at: [1900, 47000], r: 520, kind: 'place', name: ['Rimeholm', 'Rimeholm'],
  src: 'POI:f_rimeholm', states: { frozen: '!quest f_rime done', warm: 'quest f_rime done' } });
