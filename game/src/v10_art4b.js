// ================= v10_art4b: art for A4b's Act IV story data (m_glasswall, m_moonpath). Art only: this file calls
// defineLook and nothing else. (x,y) is the foot of each look (its place's anchor) and every look fits in its w x h
// box above it; `state` is the place's world state.
//   Sable: the new sign by the Moon Well, the little moths asleep on the well tower (seen from the footbridge), Esme's
//   workbench with the cracked lamp and her note, and Nyxara perched on the tower during the second eclipse.
//   The Edge of the World: the black glass mountain rising out of the sea, and the moonfire bridge to it. The Moonpath: the little moth on a silver leash, tied to the foot
//   brazier and hugging a stolen lamp (its thread runs to the brazier and on up into the sky), and the lamp it drops
//   when the knot melts.
// No em dash anywhere. Everything here is block scoped so no name can clash with another module.
{
  const T2 = Math.PI * 2, OL = '#2a1a16';
  const has = typeof defineLook === 'function';
  const el = (g, x, y, rx, ry, rot, fill, lw) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, T2); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } };
  const ci = (g, x, y, r, fill, lw) => el(g, x, y, r, r, 0, fill, lw);
  const shadow = (g, x, y, rx, ry, a) => { g.save(); g.globalAlpha = a == null ? 0.28 : a; el(g, x, y, rx, ry, 0, '#000'); g.restore(); };
  const glow = (g, x, y, r, rgb, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const poly = (g, pts, fill, lw) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } };
  const line = (g, pts, col, lw) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
  const rect = (g, x, y, w, h, fill, lw) => { g.fillStyle = fill; g.fillRect(x, y, w, h); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.strokeRect(x, y, w, h); } };

  // ---------- the sign by the Moon Well: a driftwood post, a pale board with a little moon on it
  has && defineLook('m4_sign_well', { w: 40, h: 46, draw(g, x, y) {
    shadow(g, x, y + 1, 12, 3.5);
    rect(g, x - 2.5, y - 30, 5, 30, '#8a6a42', 1.2);
    poly(g, [[x - 17, y - 42], [x + 17, y - 42], [x + 18, y - 26], [x - 18, y - 26]], '#efe2c4', 1.4);
    // the moon (a silver crescent) and three lines of writing
    ci(g, x - 10, y - 34, 4.2, '#c8d4ff', 0.9); ci(g, x - 8.6, y - 35, 3.4, '#efe2c4');
    for (const [dy, w] of [[-38, 18], [-34, 15], [-30, 19]]) line(g, [[x - 3, y + dy], [x - 3 + w * 0.82, y + dy]], '#6a5a4a', 1.1);
  } });

  // ---------- the little moths asleep on the Moon Well tower: the anchor is on the footbridge, 62 px in front of
  // the tower's base; they cling to its sides from just above the basin to near the top, all facing the water.
  // Pale and soft (no dark outline), so they read as moths and not as holes.
  has && defineLook('m4_tower_moths', { w: 90, h: 290, outline: false, draw(g, x, y) {
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const cols = ['#f2eefa', '#e6e0f2', '#fbf8ff', '#ddd6ec'];
    const moth = (mx, my, s, a, col) => { g.save(); g.translate(mx, my); g.rotate(a); g.scale(s, s);
      g.fillStyle = 'rgba(70,56,96,.35)'; g.beginPath(); g.ellipse(0.6, 0.8, 4.6, 2.6, 0, 0, T2); g.fill();
      g.fillStyle = col; g.strokeStyle = 'rgba(96,82,124,.75)'; g.lineWidth = 0.6;
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(0, -1.2); g.quadraticCurveTo(sx * 5.2, -3.4, sx * 4.6, 0.6); g.quadraticCurveTo(sx * 3.2, 2.6, 0, 1.4); g.closePath(); g.fill(); g.stroke(); }
      g.fillStyle = 'rgba(160,140,200,.8)'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 2.6, -0.6, 0.8, 0, T2); g.fill(); }
      g.fillStyle = '#6a5a86'; g.beginPath(); g.ellipse(0, 0.2, 0.7, 2, 0, 0, T2); g.fill();
      g.restore(); };
    for (let i = 0; i < 34; i++) {
      const up = 100 + rnd() * 160, side = (rnd() - 0.5) * (up < 150 ? 38 : 28);
      moth(x + side, y - up, 1.15 + rnd() * 0.45, Math.PI + (rnd() - 0.5) * 0.8, cols[i % cols.length]);   // heads down, toward the water
    }
    // the front row along the basin's rim, waiting for dinner
    for (let i = 0; i < 8; i++) moth(x - 25 + i * 7.2, y - 76 - (i % 2) * 3, 1.25, Math.PI, cols[i % 4]);
  } });

  // ---------- Nyxara perched on the Moon Well tower (shown during the second eclipse when the engine has no `fx` hook
  // for x3_story's own eclipse pictures; see CHANGES.md). The anchor is the tower's base; she sits on top of it, wings
  // half open, grey and soft as dust, a pale moon painted on each one (v11), her long curled tongue reaching down to the basin.
  has && defineLook('m4_nyx_perch', { w: 360, h: 420, anim: true, draw(g, x, y, t, state) {
    const br = Math.sin(t * 1.3) * 0.06, top = y - 236;
    g.save();
    glow(g, x, top - 30, 170, '96,86,150', 0.35);
    for (const sx of [-1, 1]) {
      g.save(); g.translate(x, top - 34); g.scale(sx, 1); g.rotate(-0.15 - br);
      // upper wing
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(40, -96, 150, -112, 168, -40); g.bezierCurveTo(150, 4, 76, 18, 0, 10); g.closePath();
      g.fillStyle = '#787282'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#120c1e'; g.stroke();
      g.fillStyle = 'rgba(214,210,228,.3)'; g.beginPath(); g.moveTo(10, -6); g.bezierCurveTo(50, -70, 120, -84, 140, -42); g.bezierCurveTo(110, -20, 60, -6, 10, -6); g.fill();
      // the painted moon: pale, with a crescent of shadow and two little craters
      glow(g, 96, -46, 34, '236,234,255', 0.3); ci(g, 96, -46, 17, '#f2f0f7', 2);
      g.save(); g.beginPath(); g.arc(96, -46, 16, 0, T2); g.clip(); ci(g, 88, -42, 15, '#b2aec6'); ci(g, 98, -47, 13.5, '#f2f0f7'); g.restore();
      ci(g, 101, -50, 2.6, 'rgba(176,170,196,.7)'); ci(g, 96, -40, 1.8, 'rgba(176,170,196,.7)');
      // lower wing
      g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(50, 20, 116, 40, 96, 92); g.bezierCurveTo(70, 108, 26, 70, 0, 30); g.closePath();
      g.fillStyle = '#6a6476'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#120c1e'; g.stroke();
      ci(g, 62, 54, 7, 'rgba(236,232,244,.7)');
      g.restore();
    }
    // body, head, antennae, the tongue curling down to the water
    el(g, x, top - 20, 18, 46, 0, '#625c6e', 3);
    ci(g, x, top - 70, 17, '#6a6476', 3);
    ci(g, x - 6, top - 72, 4, '#e8e4ff'); ci(g, x + 6, top - 72, 4, '#e8e4ff');
    line(g, [[x - 6, top - 84], [x - 30, top - 120], [x - 52, top - 112]], '#120c1e', 3);
    line(g, [[x + 6, top - 84], [x + 30, top - 120], [x + 52, top - 112]], '#120c1e', 3);
    if (state === 'drink') { g.beginPath(); g.moveTo(x, top - 58); g.bezierCurveTo(x + 40, top - 20, x - 30, top + 60, x, y - 80); g.lineWidth = 3.2; g.strokeStyle = '#a890d8'; g.stroke(); }
    g.restore();
  } });

  // ---------- the black glass mountain out at sea, at the Edge of the World, and the moonfire bridge to it (shown
  // after the last bite when the engine has no `fx` hook for x3_story's own vista). The mountain's anchor is at the
  // east edge of the map; it rises out of the dark sea beyond it. The bridge's anchor is the end of the Moon Pier.
  has && defineLook('m4_peak_far', { w: 760, h: 760, anim: true, draw(g, x, y, t) {
    const bx = x + 20, by = y;
    g.save();
    glow(g, bx, by - 300, 380, '130,80,220', 0.32);
    const P = [[-0.5, 0], [-0.44, -0.1], [-0.35, -0.2], [-0.3, -0.28], [-0.24, -0.26], [-0.19, -0.27], [-0.15, -0.37], [-0.12, -0.5], [-0.09, -0.52], [-0.07, -0.42], [-0.03, -0.6], [0, -0.72],
      [0.03, -1], [0.06, -0.84], [0.1, -0.7], [0.15, -0.62], [0.2, -0.64], [0.26, -0.5], [0.33, -0.34], [0.41, -0.18], [0.5, 0]];
    const W = 620, Hh = 600;
    g.beginPath(); P.forEach(([px, py], i) => { const X = bx + px * W, Y = by + py * Hh; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath();
    g.fillStyle = '#1e1632'; g.fill(); g.lineWidth = 7; g.strokeStyle = 'rgba(150,110,240,.55)'; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#0c0814'; g.stroke();
    // glassy facets and a snowy shoulder, a clock-tower notch, a crater (it is every place Ash has been)
    g.fillStyle = 'rgba(160,140,220,.18)'; g.beginPath(); g.moveTo(bx + 0.03 * W, by - Hh); g.lineTo(bx + 0.2 * W, by - 0.64 * Hh); g.lineTo(bx + 0.05 * W, by - 0.3 * Hh); g.closePath(); g.fill();
    g.fillStyle = 'rgba(240,244,255,.75)'; g.beginPath(); g.moveTo(bx + 0.15 * W, by - 0.62 * Hh); g.lineTo(bx + 0.2 * W, by - 0.64 * Hh); g.lineTo(bx + 0.24 * W, by - 0.54 * Hh); g.lineTo(bx + 0.17 * W, by - 0.56 * Hh); g.closePath(); g.fill();
    rect(g, bx - 0.11 * W, by - 0.5 * Hh - 26, 14, 26, '#1e1630');
    // the broken ring of cold light where the moon should be
    glow(g, bx + 0.03 * W, by - Hh - 70, 90, '220,230,255', 0.3);
    g.lineWidth = 7; g.strokeStyle = 'rgba(232,238,255,.92)'; g.beginPath(); g.arc(bx + 0.03 * W, by - Hh - 70, 56, 0.4, 2.2); g.stroke();
    g.beginPath(); g.arc(bx + 0.03 * W, by - Hh - 70, 56, 2.8, 5.6); g.stroke();
    // violet lightning, now and then
    const k = Math.floor(t * 1.7), f = (t * 1.7) % 1;
    if (f < 0.25) { let lx = bx + ((k * 37) % 120 - 60), ly = by - Hh * 0.9; const pts = [[lx, ly]]; for (let i = 0; i < 6; i++) { lx += ((k * 13 + i * 29) % 40) - 20; ly += 60; pts.push([lx, ly]); }
      g.globalAlpha = 1 - f * 4; line(g, pts, '#c8a8ff', 3); g.globalAlpha = 1; }
    // the dark sea round its foot
    g.fillStyle = 'rgba(12,16,40,.55)'; g.fillRect(bx - W * 0.6, by - 8, W * 1.2, 30);
    g.restore();
  } });
  has && defineLook('m4_fire_bridge', { w: 520, h: 80, anim: true, outline: false, draw(g, x, y, t) {
    g.save();
    for (let i = 0; i < 26; i++) { const u = i / 26, X = x + u * 480, Y = y - 6 - Math.sin(u * Math.PI) * 26;
      glow(g, X, Y, 22, '200,210,255', 0.22 + 0.1 * Math.sin(t * 4 + i));
      el(g, X, Y, 12, 4.5, 0, 'rgba(230,236,255,.9)');
      const fl = 6 + 4 * Math.sin(t * 9 + i * 1.7); poly(g, [[X - 4, Y - 2], [X, Y - 2 - fl], [X + 4, Y - 2]], 'rgba(200,214,255,.85)'); }
    g.restore();
  } });

  // ---------- the Mirror Temple's face gone dark, a pair of white eyes in every pane (Nyxara's voice, on the steps).
  // The anchor is just in front of the temple's base (12300,68430); the panes sit over its two windows and its door.
  has && defineLook('m4_mirror_eyes', { w: 320, h: 220, anim: true, outline: false, draw(g, x, y, t) {
    const blink = (Math.sin(t * 0.9) > 0.97) ? 0.15 : 1;
    const pane = (px, py, w, h, ex) => {
      g.save(); g.globalAlpha = 0.88; g.fillStyle = '#140c22'; g.beginPath(); g.ellipse(px, py, w / 2, h / 2, 0, 0, T2); g.fill(); g.restore();
      glow(g, px, py, w * 0.8, '120,80,200', 0.25);
      for (const sx of [-1, 1]) { g.save(); g.translate(px + sx * ex, py - 2); g.scale(1, blink); el(g, 0, 0, 5.4, 3.6, 0, '#f6f4ff'); ci(g, sx * 0.8, 0, 1.6, '#3a2a60'); g.restore(); }
    };
    pane(x - 125, y - 162, 38, 66, 7);
    pane(x + 125, y - 162, 38, 66, 7);
    pane(x, y - 102, 76, 92, 13);
  } });

  // ---------- Esme's workbench outside the Lamp House: a cracked lamp and a folded note
  has && defineLook('m4_esme_bench', { w: 56, h: 46, draw(g, x, y) {
    shadow(g, x, y + 1, 24, 5);
    // legs and top
    for (const dx of [-18, 16]) rect(g, x + dx, y - 14, 3.5, 14, '#7a5432', 1);
    poly(g, [[x - 23, y - 18], [x + 23, y - 18], [x + 21, y - 13], [x - 21, y - 13]], '#a8784a', 1.3);
    // the cracked lamp: brass base, a glass globe with a dark crack, no flame
    rect(g, x - 9, y - 22, 10, 4, '#c8963a', 1);
    el(g, x - 4, y - 29, 6.4, 7.4, 0, 'rgba(220,236,255,.85)', 1.1);
    line(g, [[x - 6.5, y - 35], [x - 4, y - 30], [x - 6, y - 27], [x - 3, y - 23.5]], '#3a3040', 1.1);
    rect(g, x - 6, y - 38, 4, 2.4, '#c8963a', 0.9);
    // the note: a white folded card with two lines
    poly(g, [[x + 4, y - 19], [x + 17, y - 21], [x + 18, y - 17], [x + 5, y - 15.5]], '#fbf6ea', 0.9);
    line(g, [[x + 7, y - 18.6], [x + 15, y - 19.6]], '#5a4a5a', 0.7); line(g, [[x + 7.5, y - 17], [x + 13, y - 17.7]], '#5a4a5a', 0.7);
    // a tiny screwdriver for detail
    line(g, [[x + 9, y - 14.5], [x + 18, y - 15.2]], '#6a7a8a', 1.2);
  } });

  // ---------- the little moth on the leash at the foot of the Moonpath. Its silver thread runs from its neck to the
  // foot brazier (45 px to the left, 16 up) and from there straight up into the sky. It shivers and hugs a lamp.
  has && defineLook('m4_leashed_moth', { w: 120, h: 400, anim: true, draw(g, x, y, t) {
    const sh = Math.sin(t * 13) * 0.8, bob = Math.sin(t * 2.2) * 1.2;
    const nx = x + 1, ny = y - 22 + bob, bx = x - 45, by = y - 30;
    shadow(g, x, y + 1, 13, 4);
    // the thread: neck to the brazier, then up into the dark, fading (a faint sway)
    g.save();
    line(g, [[nx, ny], [x - 20, y - 12], [bx, by]], 'rgba(40,40,80,.55)', 2.4);
    line(g, [[nx, ny], [x - 20, y - 12], [bx, by]], 'rgba(226,232,255,.95)', 1.2);
    const sway = Math.sin(t * 0.9) * 3;
    for (let i = 0; i < 12; i++) { const y0 = by - i * 26, y1 = y0 - 26; g.globalAlpha = Math.max(0, 0.9 - i * 0.075);
      line(g, [[bx + sway * i / 12, y0], [bx + sway * (i + 1) / 12, y1]], 'rgba(226,232,255,1)', 1.1); }
    g.globalAlpha = 1;
    glow(g, bx, by, 10, '210,220,255', 0.35);
    g.restore();
    // the moth: grey-white wings drooping, a fuzzy body, two curled antennae, arms round a little gold lamp
    g.save(); g.translate(x + sh, y - 4 + bob);
    el(g, -9, -14, 9, 6.5, -0.5, '#e4e0ee', 1.2); el(g, 9, -14, 9, 6.5, 0.5, '#e4e0ee', 1.2);
    el(g, -7, -6, 6, 4.4, 0.4, '#d4cfe2', 1.1); el(g, 7, -6, 6, 4.4, -0.4, '#d4cfe2', 1.1);
    ci(g, -10, -14, 2.2, '#b8b0cc'); ci(g, 10, -14, 2.2, '#b8b0cc');
    el(g, 0, -10, 4.4, 8, 0, '#f2eef8', 1.2);
    ci(g, 0, -19, 4.6, '#f6f2fc', 1.2);
    ci(g, -1.8, -19.6, 1.1, '#2a2440'); ci(g, 1.8, -19.6, 1.1, '#2a2440');
    line(g, [[-1.6, -23], [-4, -28], [-6.5, -27]], '#5a5068', 0.9); line(g, [[1.6, -23], [4, -28], [6.5, -27]], '#5a5068', 0.9);
    // the lamp it hugs (gold, unlit)
    rect(g, -3.5, -7, 7, 2.4, '#c8963a', 0.9); el(g, 0, -10, 3.6, 3.4, 0, 'rgba(255,236,190,.9)', 0.9); rect(g, -1.6, -14.4, 3.2, 1.6, '#c8963a', 0.7);
    line(g, [[-4.4, -11], [-1.5, -9]], '#e4e0ee', 2.2); line(g, [[4.4, -11], [1.5, -9]], '#e4e0ee', 2.2);
    g.restore();
  } });

  // ---------- the lamp the little moth dropped, on its side, with a paper tag on a string
  has && defineLook('m4_dropped_lamp', { w: 40, h: 24, draw(g, x, y) {
    shadow(g, x, y + 1, 11, 3);
    g.save(); g.translate(x, y - 5); g.rotate(-1.2);
    rect(g, -4, 4, 8, 2.8, '#c8963a', 0.9); el(g, 0, 0, 4.6, 4.8, 0, 'rgba(255,236,190,.9)', 1); rect(g, -2, -6, 4, 1.8, '#c8963a', 0.8);
    g.restore();
    line(g, [[x + 3, y - 6], [x + 10, y - 3]], '#6a5a4a', 0.8);
    poly(g, [[x + 9, y - 6], [x + 17, y - 5], [x + 16, y - 1], [x + 8, y - 2]], '#fbf6ea', 0.8);
    line(g, [[x + 10, y - 4], [x + 15, y - 3.4]], '#5a4a5a', 0.6);
  } });
}
