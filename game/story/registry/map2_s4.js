// game/story/registry/map2_s4.js (A4S): Frostreach things the old code draws that A4S's Act IV gates and Hilde's
// Act IV talk name (gates_map2.js, act4/people.js). Coordinates read from the live game. Hilde lives indoors: she is
// registered at the Warm Mitten's door.
legacy({ id: 'f_hilde', map: 2, at: [6560, 48776], kind: 'npc', name: ['Hilde Pottersnow', 'Hilde'], src: 'CAST:f_hilde', inside: 'h_f_hilde' });
legacy({ id: 'm4s_steamwell', map: 2, at: [3800, 49400], r: 220, kind: 'place', name: ['the Steamwell', 'the Steamwell'], src: 'POI:f_steamwell' });
legacy({ id: 'm4s_dreadgate', map: 2, at: [7300, 44160], r: 60, kind: 'landmark', name: ['the Dreadgate', 'the Dreadgate'], src: 'LANDMARKS:f_lm_dreadlock' });
