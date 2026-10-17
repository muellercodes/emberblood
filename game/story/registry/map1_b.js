// Map 1 (the Clockwork Coast): things old code already draws that A2b's chapters (c_light, c_spire, c_snow) name.
// Every coordinate here was checked in the live game (Playwright, __eb.tp and x1_world's blocked/elev probes). The
// causeway's posts and rip have no object of their own: their src names x1_world's C1G table (causeway, causewayRip)
// and the posts are x1_world's ELEV.grapple calls (two since the causeway fix). Curtains and the Spire door exist only
// with c_spire_up.
// Data only.

// the Gear Market in Gearhaven's Lower Town (x1_world's stalls and the market belt)
legacy({ id: 'gh_market', map: 1, at: [6900, 25848], r: 420, kind: 'place', name: 'the Gear Market',
         aliases: ['the market', 'the Gear Market'], src: 'prop:stall@6900,25848' });
legacy({ id: 'gh_fruit_stall', map: 1, at: [7260, 25850], r: 40, kind: 'prop', name: 'the fruit stall',
         src: 'prop:stall@7260,25850' });
// the Steaming Teapot, Auntie Fig's inn (where to rest at the end of the act)
legacy({ id: 'c_teapot_door', map: 1, at: [7300, 26256], r: 40, kind: 'door', leads: 'h_c_fig', name: 'the Steaming Teapot',
         aliases: ['the inn', "Auntie Fig's"], src: 'DOORS:h_c_fig' });

// the Cut: the broken rope bridge and its two brass posts (the Grapple Tail swings between them)
legacy({ id: 'c_lm_cut', map: 1, at: [9500, 26905], r: 40, kind: 'landmark', name: 'the broken rope bridge',
         aliases: ['the Cut', 'the rope bridge'], src: 'LANDMARKS:c_lm_cut' });
legacy({ id: 'c_cut_post_w', map: 1, at: [9532, 26950], r: 30, kind: 'gate', gate: 'grapple_post', opens_with: 'grapple',
         leads: 'c_cut_post_e', name: 'the west bridge post', src: 'prop:bridgepost@9535,26935' });
legacy({ id: 'c_cut_post_e', map: 1, at: [9826, 26950], r: 30, kind: 'gate', gate: 'grapple_post', opens_with: 'grapple',
         leads: 'c_cut_post_w', name: 'the east bridge post', src: 'prop:bridgepost@9832,26962' });

// the Spinning Lighthouse on Lantern Point
legacy({ id: 'c_lighthouse_door', map: 1, at: [12880, 29052], r: 40, kind: 'door', leads: 'c_lighthouse',
         name: 'the lighthouse door', aliases: ['the Spinning Lighthouse'], src: 'DOORS:c_lighthouse' });

// the Shadow Causeway (only with c_spire_up: `if` says so for the world check). Its gates are real since the x1_world causeway fix: deep sea all round,
// the shoal wind stops jumps, only the rip is calm water (Skimmer), two posts over the first gap (Grapple Tail).
legacy({ id: 'c_moth_cw1', map: 1, at: [7255, 29150], r: 80, kind: 'gate', gate: 'shadow_curtain', opens_with: 'shadow',
         leads: 'c_spire_door', name: 'a moth curtain on the causeway', src: 'LANDMARKS:c_moth_cw1', if: 'flag c_spire_up' });
legacy({ id: 'c_cw_post1', map: 1, at: [7300, 29250], r: 30, kind: 'gate', gate: 'grapple_post', opens_with: 'grapple',
         leads: 'c_cw_post2', name: 'a causeway post', src: 'x1_world.js C1G' });
legacy({ id: 'c_cw_post2', map: 1, at: [7350, 29500], r: 30, kind: 'gate', gate: 'grapple_post', opens_with: 'grapple',
         leads: 'c_cw_post1', name: 'a causeway post', src: 'x1_world.js C1G' });
legacy({ id: 'c_moth_cw2', map: 1, at: [7355, 29540], r: 80, kind: 'gate', gate: 'shadow_curtain', opens_with: 'shadow',
         leads: 'c_spire_door', name: 'a moth curtain on the causeway', src: 'LANDMARKS:c_moth_cw2', if: 'flag c_spire_up' });
legacy({ id: 'c_cw_rip', map: 1, path: [[7340, 29600], [7340, 29730]], r: 80, kind: 'gate', opens_with: 'skimmer',
         leads: 'c_spire_door', name: 'the rip current on the causeway', src: 'x1_world.js C1G' });
legacy({ id: 'c_moth_cw3', map: 1, at: [7325, 29800], r: 80, kind: 'gate', gate: 'shadow_curtain', opens_with: 'shadow',
         leads: 'c_spire_door', name: 'a moth curtain on the causeway', src: 'LANDMARKS:c_moth_cw3', if: 'flag c_spire_up' });

// the Spire door on Spire Rock. The moths on it ask what Vesper is: it stays shut until what_she_is is solved.
legacy({ id: 'c_spire_door', map: 1, at: [7400, 30040], r: 40, kind: 'door', leads: 'c_spire', name: 'the Spire door',
         aliases: ['the Shadow Spire', 'Spire Rock'], src: 'DOORS:c_spire', if: 'flag c_spire_up',
         need: 'solved what_she_is',
         locked: [
           ['narr', 'The moths on the door will not move. They whisper: "What IS she, little ember? Say it, and pass."', 'The moths whisper: "What IS she? Say it, and pass."'],
           ['narr', '(Work it out in the Case Book.)', '(Open the Case Book.)'] ] });
