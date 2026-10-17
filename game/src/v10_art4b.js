// ================= v10_art4b: art for A4b's Act IV story data (m_glasswall, m_moonpath). Art only: this file calls
// defineLook and nothing else. (x,y) is the foot of each look (its place's anchor) and every look fits in its w x h
// box above it; `state` is the place's world state.
//   Sable: the new sign by the Moon Well, the little moths asleep on the well tower (seen from the footbridge), Esme's
//   workbench with the cracked lamp and her note. The Moonpath: the little moth on a silver leash, tied to the foot
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

  // a tiny moth seen from above: two wing pairs and a body; s is its size, a its angle, wing the open amount 0..1
  function tinyMoth(g, x, y, s, a, col, wing) {
    g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
    const w = 0.55 + 0.45 * (wing == null ? 1 : wing);
    el(g, -2.6 * w, -0.6, 2.8 * w, 1.9, -0.5, col, 0.55);
    el(g, 2.6 * w, -0.6, 2.8 * w, 1.9, 0.5, col, 0.55);
    el(g, -1.9 * w, 1.5, 1.8 * w, 1.3, 0.4, col, 0.5);
    el(g, 1.9 * w, 1.5, 1.8 * w, 1.3, -0.4, col, 0.5);
    el(g, 0, 0.4, 0.9, 2.6, 0, '#5a5068', 0.4);
    line(g, [[-0.4, -2], [-1.6, -3.8]], '#5a5068', 0.4); line(g, [[0.4, -2], [1.6, -3.8]], '#5a5068', 0.4);
    g.restore();
  }

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
  // the tower's base; they cling to its sides from just above the basin to near the top, all facing the water
  has && defineLook('m4_tower_moths', { w: 90, h: 290, draw(g, x, y) {
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const cols = ['#d8d2e6', '#c8c0d8', '#e6e0f0', '#bdb4cf'];
    for (let i = 0; i < 46; i++) {
      const up = 96 + rnd() * 170, side = (rnd() - 0.5) * (up < 150 ? 40 : 30);
      const s = 0.85 + rnd() * 0.5, a = Math.PI + (rnd() - 0.5) * 0.7;   // heads down, toward the water
      tinyMoth(g, x + side, y - up, s, a, cols[i % cols.length], 0.35 + rnd() * 0.4);
    }
    // a few more along the basin's rim, the front row for dinner
    for (let i = 0; i < 9; i++) tinyMoth(g, x - 26 + i * 6.5, y - 74 - (i % 2) * 3, 0.9, Math.PI, cols[i % 4], 0.5);
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
