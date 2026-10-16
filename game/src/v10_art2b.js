// ================= v10_art2b: art for A2b's Act II story data (c_light, c_spire, c_snow). Art only: this file calls
// defineLook and definePose and nothing else. Every look is drawn in world coordinates at its place's anchor (x,y is
// where the thing stands on the ground); `state` is the place's world state (or the actor's pose).
//   Captain Squawk (a parrot actor: perch, fly, crash) and the Squawk on Agatha's bun, the market fruit he spills,
//   the Cut (the rope across the road, the cut rope ends, the silk on the thorn bush, the rebuilt rope bridge),
//   the lighthouse door (Agatha's logbook, Pearl's stone, the giant wing print in dust on the tower), the moths on the
//   Spire door, the masked Vesper actor (stand, in a storm of moths, slipping into a shadow), Vesper sitting on the
//   Clockwatch roof, her notebook page, and the scrap of grey silk on the Clockwatch chimney.
// No em dash anywhere. Everything here is block scoped so no name can clash with another module.
{
  const T2 = Math.PI * 2, OL = '#2a1a16';
  const has = typeof defineLook === 'function', hasPose = typeof definePose === 'function';
  // small drawing helpers (outlined cel style, like the rest of the game)
  const el = (g, x, y, rx, ry, rot, fill, lw) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, T2); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } };
  const ci = (g, x, y, r, fill, lw) => el(g, x, y, r, r, 0, fill, lw);
  const shadow = (g, x, y, rx, ry, a) => { g.save(); g.globalAlpha = a == null ? 0.28 : a; el(g, x, y, rx, ry, 0, '#000'); g.restore(); };
  const glow = (g, x, y, r, rgb, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const poly = (g, pts, fill, lw) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } };
  const line = (g, pts, col, lw) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
  const rope = (g, x0, y0, x1, y1, sag, col) => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); g.lineCap = 'round'; g.strokeStyle = OL; g.lineWidth = 3.2; g.stroke(); g.strokeStyle = col || '#c8a46a'; g.lineWidth = 1.8; g.stroke(); };

  // ---------- Captain Squawk: green and red, a yellow hook beak, a blue tail. Local frame: facing right, feet at 0,0.
  function squawkBody(g, t, mode) {
    const flap = mode === 'fly' ? Math.sin(t * 22) : 0;
    g.lineJoin = 'round';
    // tail
    poly(g, [[-3, -6], [-14, 2], [-13, 4], [-2, -3]], '#3a7ae0', 1.2);
    poly(g, [[-3, -5], [-12, 5], [-10, 6], [-1, -3]], '#e84a3a', 1);
    // far wing (flaps)
    if (mode === 'fly') poly(g, [[-1, -9], [-6, -9 - 9 * flap - 4], [3, -10]], '#2e8a3a', 1.2);
    // body
    el(g, 0, -8, 6.4, 4.6, -0.35, '#4ac04a', 1.4);
    el(g, -0.5, -9.5, 3.6, 2, -0.35, 'rgba(255,255,255,.22)');
    // near wing: folded, or up and down in flight, red and blue tips
    if (mode === 'fly') { poly(g, [[0, -8], [-3, -8 - 11 * flap - 3], [5, -9]], '#3aa84a', 1.3); line(g, [[-2, -8 - 10 * flap - 2], [-1, -8 - 7 * flap - 2]], '#e84a3a', 1.6); }
    else { el(g, -1.5, -7.5, 4.6, 2.6, -0.5, '#2e8a3a', 1.1); line(g, [[-5, -6], [-7, -4.5]], '#3a7ae0', 1.4); }
    // head: red, a white eye patch, a black eye, a big yellow hooked beak
    ci(g, 5.2, -12.6, 3.7, '#e84a3a', 1.3);
    el(g, 6.2, -13.2, 1.7, 1.4, 0, '#f4f0e8');
    ci(g, 6.5, -13.2, 0.75, mode === 'crash' ? '#f4f0e8' : '#111');
    if (mode === 'crash') { line(g, [[5.8, -13.9], [7.2, -12.5]], '#111', 0.8); line(g, [[7.2, -13.9], [5.8, -12.5]], '#111', 0.8); }
    g.beginPath(); g.moveTo(8, -14); g.quadraticCurveTo(12, -13.5, 10.5, -10); g.quadraticCurveTo(9.4, -11.6, 8, -11.4); g.closePath(); g.fillStyle = '#ffd24a'; g.fill(); g.lineWidth = 1; g.strokeStyle = OL; g.stroke();
    // a little crest
    line(g, [[3.4, -15.6], [2.2, -18.2]], '#ffd24a', 1.3); line(g, [[4.6, -16], [4.4, -18.8]], '#e84a3a', 1.3);
    // feet
    if (mode !== 'fly') { line(g, [[0.5, -4], [0.3, 0]], '#8a8478', 1.2); line(g, [[2.4, -4], [2.6, 0]], '#8a8478', 1.2); }
  }
  function drawSquawk(g, x, y, t, mode, k, face) {
    k = k || 1; face = face || 1;
    const lift = mode === 'fly' ? 26 + Math.sin(t * 5) * 3 : 0;
    if (mode !== 'perch_on') shadow(g, x, y + 1, 7 * k, 2.4 * k, mode === 'fly' ? 0.18 : 0.28);
    g.save(); g.translate(x, y - lift); g.scale(face * k, k);
    if (mode === 'crash') { g.rotate(0.55 + Math.sin(t * 9) * 0.08); g.translate(0, 3); }
    squawkBody(g, t, mode);
    g.restore();
    if (mode === 'crash') {   // dizzy stars and a loose feather
      for (let i = 0; i < 3; i++) { const a = t * 4 + i * T2 / 3, sx = x + Math.cos(a) * 9 * k, sy = y - 20 * k + Math.sin(a) * 3 * k;
        g.save(); g.translate(sx, sy); g.rotate(a); poly(g, [[0, -2.6], [0.8, -0.8], [2.6, 0], [0.8, 0.8], [0, 2.6], [-0.8, 0.8], [-2.6, 0], [-0.8, -0.8]], '#ffe680', 0.6); g.restore(); }
      const fx = x - 10 * k + Math.sin(t * 2) * 4, fy = y - 8 * k - ((t * 6) % 14); el(g, fx, fy, 1.2 * k, 4 * k, Math.sin(t * 3), '#4ac04a', 0.6);
    }
  }
  if (has) defineLook('squawk', { w: 30, h: 46, draw(g, x, y, t, state) { drawSquawk(g, x, y, t, state || 'perch', 1, 1); } });
  if (hasPose) for (const p of ['perch', 'idle', 'fly', 'crash']) definePose('c_squawk', p, (g, x, y, t) => drawSquawk(g, x, y, t, p === 'idle' ? 'perch' : p, 1, 1));
  // Squawk on Agatha's shoulder (drawn on top of her every frame; her head is about 19 px above her feet)
  if (has) defineLook('squawk_shoulder', { w: 18, h: 50, draw(g, x, y, t) {
    const bob = Math.sin(t * 3.2) * 0.6, peck = (t % 7) < 0.25 ? 1 : 0;
    g.save(); g.translate(x + 9, y - 14 + bob); g.scale(0.74, 0.74); if (peck) g.rotate(0.25); squawkBody(g, t, 'perch'); g.restore();
  } });

  // ---------- the market: plums everywhere (the fruit stall Squawk crashed into)
  if (has) defineLook('fruit_spill', { w: 70, h: 30, flat: true, draw(g, x, y, t) {
    const fr = [[-22, 2, '#7a3a8a', 3.6], [-14, -3, '#7a3a8a', 3.4], [-6, 4, '#c83a2a', 3.8], [3, -2, '#7a3a8a', 3.5], [10, 5, '#e0c040', 3.2], [17, -1, '#7a3a8a', 3.4], [24, 3, '#c83a2a', 3.6], [-28, -4, '#7a3a8a', 3.2]];
    for (const [dx, dy, c, r] of fr) { shadow(g, x + dx + 1, y + dy + 2, r, r * 0.45, 0.22); ci(g, x + dx, y + dy, r, c, 1.1); ci(g, x + dx - r * 0.35, y + dy - r * 0.35, r * 0.32, 'rgba(255,255,255,.45)'); }
    // one green feather, rocking
    g.save(); g.translate(x + 4, y + 9); g.rotate(0.5 + Math.sin(t * 2) * 0.15); el(g, 0, 0, 1.8, 6, 0, '#4ac04a', 0.8); line(g, [[0, -6], [0, 6]], '#2e8a3a', 0.6); g.restore();
  } });

  // ---------- the Cut
  // a rope tied across the road two steps before the edge (the road runs north-west to south-east here, so the rope
  // runs south-west to north-east across it), on two little stakes, with a fisher's knot
  if (has) defineLook('cut_rope_fence', { w: 50, h: 60, draw(g, x, y, t) {
    const ax = x + 18, ay = y - 24, bx = x - 18, by = y + 24, h = 11;
    for (const [sx, sy] of [[ax, ay], [bx, by]]) { shadow(g, sx + 1, sy + 1, 4, 1.6); poly(g, [[sx - 2, sy], [sx - 2, sy - h - 2], [sx, sy - h - 4], [sx + 2, sy - h - 2], [sx + 2, sy]], '#8a5a30', 1.2); }
    rope(g, ax, ay - h + 1, bx, by - h + 1, 5 + Math.sin(t * 1.5) * 0.6, '#d8b878');
    // the knot: a figure-eight loop at the north-east stake
    g.lineWidth = 1.3; g.strokeStyle = '#d8b878'; g.beginPath(); g.ellipse(ax - 2.5, ay - h + 3, 2.4, 1.6, 0.6, 0, T2); g.stroke(); g.beginPath(); g.ellipse(ax - 5, ay - h + 5, 2, 1.4, 0.6, 0, T2); g.stroke();
  } });
  // the bridge ropes cut clean at the east post: two stubs lying on the edge, their cut faces bright
  if (has) defineLook('cut_rope_ends', { w: 50, h: 30, flat: true, draw(g, x, y, t) {
    // they run from the foot of the east post (20 px west and 26 px north of the anchor) west to the cliff edge,
    // and stop dead there
    for (const [oy, ex, ey] of [[-2, -40, -12], [4, -42, -3]]) {
      const sx = x - 20, sy = y - 26 + oy, cx = x + ex, cy = y + ey;
      shadow(g, (sx + cx) / 2, (sy + cy) / 2 + 3, 12, 2.5, 0.2);
      g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + cx) / 2, (sy + cy) / 2 + 4, cx, cy); g.lineCap = 'butt'; g.strokeStyle = OL; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#c8a46a'; g.lineWidth = 3.2; g.stroke();
      g.strokeStyle = 'rgba(90,60,30,.5)'; g.lineWidth = 0.8; for (let k = 0.15; k < 1; k += 0.18) { const qx = sx + (cx - sx) * k, qy = sy + (cy - sy) * k + 4 * k * (1 - k) * 2; g.beginPath(); g.moveTo(qx - 1.4, qy - 1.6); g.lineTo(qx + 1.4, qy + 1.6); g.stroke(); }
      el(g, cx, cy, 1.6, 2.6, 0.2, '#fff4d0', 0.9); glow(g, cx, cy, 8, '255,250,220', 0.45 + 0.3 * Math.sin(t * 3 + oy));
    }
  } });
  // a long thread of grey silk snagged on a thorn bush by the road
  if (has) defineLook('grey_silk', { w: 50, h: 40, draw(g, x, y, t) {
    shadow(g, x + 1, y + 2, 11, 4);
    for (const [dx, dy, r] of [[-5, -6, 6], [4, -7, 6.5], [0, -11, 6], [-1, -4, 7]]) ci(g, x + dx, y + dy, r, '#3e5a34', 1.1);
    g.strokeStyle = OL; g.lineWidth = 1; for (let i = 0; i < 9; i++) { const a = i / 9 * T2, r0 = 7, r1 = 10; g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y - 7 + Math.sin(a) * r0 * 0.8); g.lineTo(x + Math.cos(a) * r1, y - 7 + Math.sin(a) * r1 * 0.8); g.stroke(); }
    const w = Math.sin(t * 2.2) * 4, w2 = Math.sin(t * 2.2 + 1) * 5;
    g.beginPath(); g.moveTo(x + 5, y - 9); g.bezierCurveTo(x + 14, y - 14 + w, x + 18, y - 4 + w2, x + 27, y - 9 + w); g.strokeStyle = 'rgba(40,36,52,.7)'; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#d8d4ea'; g.lineWidth = 1.4; g.stroke();
    glow(g, x + 20, y - 8 + w, 7, '230,226,255', 0.3 + 0.2 * Math.sin(t * 4));
  } });
  // the rebuilt rope bridge over the Cut: planks between two hand ropes (state 'open' once Mo's crew has built it)
  if (has) defineLook('rope_bridge', { w: 330, h: 50, flat: true, draw(g, x, y, t, state) {
    if (state && state !== 'open') return;
    const x0 = x - 163, x1 = x + 163, yT = y - 19, yB = y + 19;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0, y + 8, x1 - x0, 18);
    for (let px = x0 + 4; px < x1 - 2; px += 10) { const s = Math.sin((px - x0) / (x1 - x0) * Math.PI) * 4; g.fillStyle = OL; g.fillRect(px - 0.6, yT + 4 + s, 9.2, yB - yT - 6); g.fillStyle = (px / 10 | 0) % 3 ? '#a8743e' : '#b88448'; g.fillRect(px, yT + 5 + s, 8, yB - yT - 8); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(px, yT + 5 + s, 8, 2); }
    rope(g, x0, yT, x1, yT, 7, '#d8b878'); rope(g, x0, yB, x1, yB, 7, '#d8b878');
    for (let i = 1; i < 6; i++) { const px = x0 + (x1 - x0) * i / 6, s = Math.sin(i / 6 * Math.PI) * 7; line(g, [[px, yT + s * 0.9], [px, yT + 6 + s * 0.6]], '#c8a46a', 1.2); line(g, [[px, yB + s * 0.9], [px, yB - 4 + s * 0.6]], '#c8a46a', 1.2); }
  } });

  // ---------- the lighthouse door
  // Agatha's logbook, open on a little wooden stand, with a brass bell
  if (has) defineLook('keeper_lectern', { w: 34, h: 50, draw(g, x, y, t) {
    shadow(g, x + 2, y + 1, 11, 4);
    poly(g, [[x - 2.5, y], [x - 2.5, y - 24], [x + 2.5, y - 24], [x + 2.5, y]], '#7a4a24', 1.2);
    poly(g, [[x - 8, y], [x + 8, y], [x + 6, y - 3], [x - 6, y - 3]], '#6a3e1e', 1.1);
    poly(g, [[x - 15, y - 27], [x + 15, y - 27], [x + 13, y - 33], [x - 13, y - 33]], '#8a5a2e', 1.3);
    // the open book
    poly(g, [[x - 14, y - 33], [x - 1, y - 35], [x - 1, y - 45], [x - 13, y - 43]], '#f4ead2', 1.1);
    poly(g, [[x + 1, y - 35], [x + 14, y - 33], [x + 13, y - 43], [x + 1, y - 45]], '#f4ead2', 1.1);
    g.strokeStyle = 'rgba(80,50,20,.55)'; g.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) { const yy = y - 42 + i * 2.2; g.beginPath(); g.moveTo(x - 11, yy + 0.4); g.lineTo(x - 3, yy - 0.6); g.moveTo(x + 3, yy - 0.6); g.lineTo(x + 11, yy + 0.4); g.stroke(); }
    line(g, [[x, y - 35], [x + 1.5, y - 29]], '#c83a3a', 1.4);
    // the bell
    line(g, [[x + 15, y - 30], [x + 18, y - 30]], OL, 1); ci(g, x + 18, y - 27, 2.6, '#e0b84a', 1);
  } });
  // Pearl's stone, set into the lighthouse wall: a horned girl with a tail and no fire, climbing, a lantern on her back
  if (has) defineLook('pearl_stone', { w: 34, h: 44, draw(g, x, y, t) {
    shadow(g, x + 2, y + 1, 14, 4);
    poly(g, [[x - 14, y], [x - 14, y - 32], [x - 10, y - 38], [x + 10, y - 38], [x + 14, y - 32], [x + 14, y]], '#9a948a', 1.5);
    poly(g, [[x - 12, y - 2], [x - 12, y - 31], [x - 9, y - 35], [x + 9, y - 35], [x + 12, y - 31], [x + 12, y - 2]], '#aaa498');
    g.strokeStyle = '#5a564e'; g.lineWidth = 1.1; g.lineCap = 'round';
    // the cliff she climbs, and the girl: head, horns, body, arms up, a tail, a lantern
    g.beginPath(); g.moveTo(x + 8, y - 34); g.lineTo(x + 5, y - 26); g.lineTo(x + 8, y - 18); g.lineTo(x + 6, y - 10); g.stroke();
    g.beginPath(); g.arc(x - 1, y - 27, 2.4, 0, T2); g.stroke();
    g.beginPath(); g.moveTo(x - 2.6, y - 29); g.lineTo(x - 3.6, y - 31.5); g.moveTo(x + 0.6, y - 29); g.lineTo(x + 1.2, y - 31.6); g.stroke();
    g.beginPath(); g.moveTo(x - 1, y - 24.5); g.lineTo(x - 1.5, y - 18); g.moveTo(x - 1, y - 23.5); g.lineTo(x + 4.5, y - 28); g.moveTo(x - 1.2, y - 22); g.lineTo(x + 4.6, y - 21); g.moveTo(x - 1.5, y - 18); g.lineTo(x + 3, y - 15); g.moveTo(x - 1.5, y - 18); g.lineTo(x - 4, y - 14); g.stroke();
    g.beginPath(); g.moveTo(x - 1.5, y - 18); g.quadraticCurveTo(x - 8, y - 17, x - 7, y - 22); g.stroke();
    g.strokeRect(x - 6.5, y - 25.5, 3, 3.6);
    // two worn lines of letters
    g.lineWidth = 0.8; for (const [yy, w] of [[y - 9, 9], [y - 5.5, 7]]) { g.beginPath(); for (let i = -w; i < w; i += 2.2) { g.moveTo(x + i, yy); g.lineTo(x + i + 1.2, yy); } g.stroke(); }
    if (Math.sin(t * 1.3) > 0.9) glow(g, x - 6, y - 24, 6, '255,220,150', 0.3);
  } });
  // the giant wing print in silver dust on the tower (the anchor stands east of the door; the tower's middle is about
  // 67 px west of it and its body rises from about 70 to 270 px above it)
  if (has) defineLook('wing_print', { w: 140, h: 290, draw(g, x, y, t) {
    const cx = x - 66, cy = y - 172, sh = 0.55 + 0.07 * Math.sin(t * 1.4);
    g.save(); g.globalAlpha = sh;
    // the forewing (the big one) and the hind wing, as if brushed on while passing
    g.beginPath(); g.moveTo(cx - 6, cy + 30); g.bezierCurveTo(cx - 34, cy - 10, cx - 30, cy - 86, cx + 4, cy - 92); g.bezierCurveTo(cx + 32, cy - 88, cx + 34, cy - 30, cx + 10, cy + 26); g.closePath();
    g.fillStyle = '#dcd8ec'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#b8b0d0'; g.stroke();
    g.beginPath(); g.moveTo(cx - 4, cy + 30); g.bezierCurveTo(cx - 30, cy + 40, cx - 26, cy + 92, cx + 2, cy + 88); g.bezierCurveTo(cx + 24, cy + 84, cx + 26, cy + 44, cx + 8, cy + 28); g.closePath(); g.fill(); g.stroke();
    // the painted eye on the forewing
    g.globalAlpha = sh + 0.2; ci(g, cx + 2, cy - 38, 15, '#c8bce8'); ci(g, cx + 2, cy - 38, 9, '#8a7ab8'); ci(g, cx + 2, cy - 38, 4, '#3a3050'); ci(g, cx - 1, cy - 41, 1.8, '#ffffff');
    // vein lines, and dust that glitters
    g.globalAlpha = sh * 0.7; g.strokeStyle = '#a8a0c8'; g.lineWidth = 1.2;
    for (const [a, b] of [[[cx, cy + 26], [cx - 18, cy - 60]], [[cx + 2, cy + 26], [cx + 6, cy - 88]], [[cx + 4, cy + 26], [cx + 24, cy - 50]], [[cx, cy + 32], [cx - 14, cy + 78]], [[cx + 4, cy + 32], [cx + 14, cy + 80]]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.restore();
    for (let i = 0; i < 9; i++) { const k = (t * 0.6 + i * 0.37) % 1, px = cx - 24 + ((i * 53) % 50), py = cy - 80 + ((i * 97) % 160); glow(g, px, py, 4, '240,236,255', 0.5 * Math.sin(k * Math.PI)); }
  } });

  // ---------- the Spire door: moths, wings folded, painted eyes open, until Ash says what Vesper is
  if (has) defineLook('door_moths', { w: 50, h: 70, draw(g, x, y, t, state) {
    if (state === 'open') return;
    glow(g, x, y - 72, 44, '160,130,230', 0.22 + 0.06 * Math.sin(t * 2));
    for (let i = 0; i < 30; i++) {
      const col = i % 5, row = (i / 5) | 0, px = x - 14 + col * 7 + (row % 2) * 3.5 - 1.5, py = y - 50 - row * 7.8, f = 1 + 0.3 * Math.sin(t * 9 + i * 1.7);
      el(g, px - 2.2, py, 3, 2 * f, 0.5, i % 3 ? '#b0a8c0' : '#8a8298', 0.6); el(g, px + 2.2, py, 3, 2 * f, -0.5, i % 3 ? '#b0a8c0' : '#8a8298', 0.6);
      ci(g, px - 2.2, py, 0.8, '#efe6ff'); ci(g, px + 2.2, py, 0.8, '#efe6ff'); ci(g, px - 2.2, py, 0.35, '#3a3050'); ci(g, px + 2.2, py, 0.35, '#3a3050');
    }
  } });

  // ---------- Vesper in her mask, as a scene actor (the heist's thief sprite): stand, in a storm of moths, into a shadow
  function mask(g, x, y, t, state) {
    const T = { x, y, z: 0, face: -1, mode: 'wait', alpha: state === 'shadow' ? 0.45 + 0.25 * Math.sin(t * 6) : 1, heart: false };
    if (state === 'shadow') { g.save(); g.globalAlpha = 0.55; el(g, x, y + 2, 26, 9, 0, '#140e1e'); g.restore(); }
    if (typeof drawThief === 'function') drawThief(T); else { el(g, x, y - 18, 7, 16, 0, '#5a4a6a', 1.4); ci(g, x, y - 38, 7, '#e8e4f2', 1.4); }
    if (state === 'moths') for (let i = 0; i < 22; i++) {
      const a = t * (1.4 + (i % 3) * 0.4) * (i % 2 ? 1 : -1) + i * (T2 / 22), r = 30 + (i % 5) * 8 + Math.sin(t * 2 + i) * 5, mx = x + Math.cos(a) * r, my = y - 30 + Math.sin(a) * r * 0.62, f = Math.abs(Math.sin(t * 14 + i));
      el(g, mx - 3.6, my, 4.6, 1.5 + 3.4 * f, 0.5, i % 4 ? '#b8b0c8' : '#8a8098', 0.8); el(g, mx + 3.6, my, 4.6, 1.5 + 3.4 * f, -0.5, i % 4 ? '#b8b0c8' : '#8a8098', 0.8);
    }
  }
  if (has) defineLook('moth_mask', { w: 80, h: 90, draw(g, x, y, t, state) { mask(g, x, y, t, state || 'stand'); } });
  if (hasPose) for (const p of ['stand', 'moths', 'shadow']) definePose('c_mask', p, (g, x, y, t) => mask(g, x, y, t, p));

  // ---------- Vesper (a friend) sitting on the eave of the Clockwatch roof in the snow, legs dangling, waving.
  // x,y is her seat on the eave (her npc entry lifts her there). Yellow oilskin, purple scarf, dark ponytail with one
  // silver streak, freckles, two little horns, a thin tail.
  function roofSit(g, x, y, t) {
    const wave = Math.sin(t * 5) * 0.5, swing = Math.sin(t * 2.4);
    shadow(g, x + 2, y + 30, 9, 3, 0.18);
    // legs over the edge (dark trousers, boots), swinging
    for (const [dx, ph] of [[-3, 0], [3, 1.4]]) { const s = Math.sin(t * 2.4 + ph) * 2; line(g, [[x + dx, y - 1], [x + dx + s * 0.4, y + 9]], OL, 4.4); line(g, [[x + dx, y - 1], [x + dx + s * 0.4, y + 9]], '#2a2436', 2.8); el(g, x + dx + s * 0.5, y + 11, 2.6, 1.9, 0, '#4a3a2a', 0.9); }
    // the tail, curled over the eave
    g.beginPath(); g.moveTo(x + 6, y - 2); g.quadraticCurveTo(x + 14, y + 2 + swing, x + 12, y + 8); g.strokeStyle = OL; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#6a5a7a'; g.lineWidth = 1.4; g.stroke();
    // body: the yellow oilskin
    poly(g, [[x - 7, y], [x - 6, y - 14], [x + 6, y - 14], [x + 7, y]], '#e8c03a', 1.4);
    line(g, [[x, y - 13], [x, y - 1]], '#b8902a', 0.9);
    // the scarf
    el(g, x, y - 14.5, 6.4, 2.4, 0, '#6a5a7a', 1.1); poly(g, [[x + 2, y - 14], [x + 5, y - 7], [x + 2.4, y - 7.6]], '#6a5a7a', 0.9);
    // the near arm, waving
    g.save(); g.translate(x - 6, y - 12); g.rotate(-2.2 + wave); line(g, [[0, 0], [9, 0]], OL, 4); line(g, [[0, 0], [9, 0]], '#e8c03a', 2.6); ci(g, 10, 0, 1.9, '#e6b896', 0.9); g.restore();
    line(g, [[x + 6, y - 12], [x + 8, y - 4]], OL, 4); line(g, [[x + 6, y - 12], [x + 8, y - 4]], '#e8c03a', 2.6);
    // head: skin, freckles, dark hair with a silver streak and a ponytail, two little horns
    ci(g, x, y - 20, 5.6, '#e6b896', 1.3);
    for (const [fx, fy] of [[-2.4, -19], [-1.2, -18.4], [2.2, -19], [1, -18.4]]) ci(g, x + fx, y + fy, 0.45, '#b8785a');
    ci(g, x - 1.8, y - 20.8, 0.7, '#2a2034'); ci(g, x + 1.8, y - 20.8, 0.7, '#2a2034');
    g.beginPath(); g.arc(x, y - 21.5, 5.9, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(x + 5, y - 22); g.quadraticCurveTo(x, y - 24.5, x - 5, y - 22); g.closePath(); g.fillStyle = '#2a2430'; g.fill(); g.lineWidth = 1.1; g.strokeStyle = OL; g.stroke();
    line(g, [[x - 1, y - 27], [x + 2.6, y - 23.4]], '#d8d4e8', 1.1);
    g.beginPath(); g.moveTo(x + 5, y - 23); g.quadraticCurveTo(x + 10, y - 22 + swing * 0.6, x + 9, y - 16); g.strokeStyle = OL; g.lineWidth = 3; g.stroke(); g.strokeStyle = '#2a2430'; g.lineWidth = 1.8; g.stroke();
    for (const s of [-1, 1]) poly(g, [[x + s * 2.6, y - 26.4], [x + s * 4.4, y - 30], [x + s * 4.2, y - 26]], '#f0e6d0', 0.9);
  }
  if (hasPose) definePose('c_vesper', 'roof_sit', roofSit);

  // ---------- Vesper's notebook page (the Case Book page's picture, and the page lying where she left it)
  if (has) defineLook('vesper_page', { w: 30, h: 36, flat: true, draw(g, x, y, t) {
    g.save(); g.translate(x, y - 14); g.rotate(-0.12 + Math.sin(t * 1.5) * 0.03);
    poly(g, [[-10, -13], [9, -14], [11, 12], [6, 13.5], [2, 12], [-3, 14], [-8, 12.5], [-11, 13]], '#f4ecd8', 1.3);
    g.strokeStyle = 'rgba(90,120,190,.5)'; g.lineWidth = 0.7; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-8, -8 + i * 3.6); g.lineTo(8.5, -8.6 + i * 3.6); g.stroke(); }
    g.strokeStyle = 'rgba(40,30,50,.75)'; g.lineWidth = 0.8; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-7, -7 + i * 3.6); for (let k = 0; k < 6; k++) g.lineTo(-7 + k * 2.2, -7.6 + i * 3.6 + (k % 2) * 0.9); g.stroke(); }
    // a moth doodle in the corner
    el(g, 3.5, 9, 2.4, 1.6, 0.5, '#8a7ab8', 0.5); el(g, 7.5, 9, 2.4, 1.6, -0.5, '#8a7ab8', 0.5); ci(g, 5.5, 9, 0.7, '#3a3050');
    g.restore();
  } });

  // ---------- the foe ending's trace: a scrap of grey silk on the Clockwatch Hall's chimney. The anchor is in the street
  // in front of the hall (so it sorts in front of the house); the chimney top is 23 px west and 122 px up.
  if (has) defineLook('clock_silk', { w: 40, h: 140, draw(g, x, y, t) {
    const cx = x - 23, cy = y - 122, w = Math.sin(t * 2.6);
    g.save(); g.translate(cx, cy); g.rotate(0.3 + w * 0.25);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(8, 3 + w * 2, 13, 10); g.quadraticCurveTo(6, 9, 2, 13); g.quadraticCurveTo(3, 6, 0, 0); g.closePath();
    g.fillStyle = '#9a90b8'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#3a3050'; g.stroke();
    g.restore(); glow(g, cx + 6, cy + 6, 9, '220,214,255', 0.18);
  } });
}
