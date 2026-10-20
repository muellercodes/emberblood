// Builds the single-file game into docs/index.html (served by GitHub Pages).
// Usage: node build.mjs            (uses game/config.json)
//        API_BASE=https://... node build.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ORDER = ['a1_core','a1b_data','a1c_state','a1k_simple','a1d_story','a1e_people','a1f_qdata','a1g_talk','a1h_quests2','a1i_quests3','a1j_quests4','a1l_story2','a2_world','a2b_cols','a2c_build','a2d_places','a2e_interiors','a2f_caves','a2g_floors','a2h_dungeons','a2i_reach','a3_art','a3b_art2','a3c_art3','a3d_art4','a3e_toy3d','a4_ground','a5_input','a5b_pad','a6_player','a6b_weapons','a6c_moves',
  'a7a_enemies','a7b_ai','a7c_bosses','a8_systems','a9a_env','a9b_flow','a9c_story','a9d_quests','a9e_meta','a9f_talk','a9g_mini','a9h_skills','a9i_comps','a9j_events','a10a_fx','a10b_chars','a10c_t3ash','a10d_t3people','a10e_t3beasts','a10f_t3foes','a10g_t3bosses','a11_render','a11c_depth','a11b_hud','a12a_dlg','a13_cloud','a14_music','a12c_log',
  // v9 engine (wave 1)
  'e1_maps','e2_terrain','e3_elev','e4_cinder','e5_look','e6_balance','e6b_arms','e7_acts','e7b_threads','e8_foes','e9a_dungeon','e9b_caves2',
  // v10: the story engine, the Case Book, the gate library (new art for story data, game/src/v10_art*.js, goes right after it)
  'e10_story','e10b_case','e10c_gates',
  // v9 powers and the Act I rework
  'p2_coast','p3_frost','p4_moon','x0_act1','x0_vorlaxis',
  // Act II, the Clockwork Coast
  'x1_world','x1_people','x1_foes','x1_story','x1_dun_a','x1_dun_b',
  // Act III, Frostreach
  'x2_world','x2_people','x2_foes','x2_story','x2_dun_a','x2_dun_b',
  // Act IV, Moonfall
  'x3_world','x3_people','x3_foes','x3_story','x3_dun_a','x3_dun_b',
  // Finale, Nightfall Peak
  'x4_world','x4_foes','x4_story','x4_ascent',
  // items (v12 wave 7): the registry, consumables, boosts and shop supplies
  'e11_items',
  'x9_music','x9_music2',
  // hidden cheats for Drew (wraps the game once everything has loaded)
  'z1_cheats',
  'a12b_ui'];
// the story checker (tools/check.mjs, rules 1 to 13) runs first: any FAIL stops the build (dist/check.md lists them).
// EB_SKIP_CHECK=1 skips it for a local experiment only; a build that goes live never sets it.
if (existsSync('tools/check.mjs') && process.env.EB_SKIP_CHECK !== '1') {
  try { execFileSync(process.execPath, ['tools/check.mjs', '--quiet'], { stdio: 'inherit' }); }
  catch (e) {
    const md = existsSync('dist/check.md') ? readFileSync('dist/check.md', 'utf8') : '';
    const fails = md.split('\n').filter((l) => l.startsWith('FAIL'));
    console.error(`build stopped: the story check failed (${fails.length} FAIL, see dist/check.md)`);
    for (const l of fails.slice(0, 30)) console.error(l);
    if (fails.length > 30) console.error(`... ${fails.length - 30} more`);
    process.exit(1);
  }
} else if (process.env.EB_SKIP_CHECK === '1') console.warn('WARNING: EB_SKIP_CHECK=1, the story check was skipped (never ship this build)');
const cfg = JSON.parse(readFileSync('game/config.json', 'utf8'));
const api = process.env.API_BASE || cfg.apiBase || '';
// simple-words text (game/simple/*.json) is baked in right before the module that reads it
const simple = {};
for (const f of (existsSync('game/simple') ? readdirSync('game/simple') : []).filter((n) => n.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(`game/simple/${f}`, 'utf8'));
  for (const [k, v] of Object.entries(d)) if (!k.startsWith('_')) simple[k] = v;
}
const simpleJs = `const SIMPLE_DATA=${JSON.stringify(simple)};\n`;
// v10 art for story data (game/src/v10_art*.js, sorted) goes right after the gate library
const ART = (existsSync('game/src') ? readdirSync('game/src') : []).filter((n) => /^v10_art.*\.js$/.test(n)).sort().map((n) => n.slice(0, -3));
const ORDER2 = ORDER.flatMap((f) => (f === 'e10c_gates' ? [f, ...ART] : [f]));
// planned modules that do not exist yet are skipped
const MODS = ORDER2.filter((f) => existsSync(`game/src/${f}.js`));
// story data (game/story/**/*.js, sorted by path) runs last, after the game's own code has closed: each file only calls
// the data globals act(), chapter(), quest(), legacy() that e10_story.js puts on window; then the engine boots
const walk = (d) => (existsSync(d) ? readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.endsWith('.js') ? [`${d}/${e.name}`] : [])) : []);
const STORYF = walk('game/story').sort();
const storyJs = STORYF.map((f) => `\n;window.__ebStoryFile=${JSON.stringify(f)};try{\n${readFileSync(f, 'utf8')}\n}catch(e){ if(window.__ebStoryLoadErr) window.__ebStoryLoadErr(${JSON.stringify(f)},e); else console.error(e); }\n`).join('')
  + (STORYF.length || MODS.includes('e10_story') ? '\n;window.__ebStoryFile=null;if(window.__ebStoryBoot) window.__ebStoryBoot();\n' : '');
const js = (MODS.map((f) => (f === 'a1k_simple' ? simpleJs : '') + readFileSync(`game/src/${f}.js`, 'utf8')).join('') + storyJs).replaceAll('__API_BASE__', api);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/game.js', js);
execFileSync(process.execPath, ['--check', 'dist/game.js'], { stdio: 'inherit' });

const head = readFileSync('game/head.html', 'utf8');
const body = readFileSync('game/body.html', 'utf8');
const cut = body.indexOf('</style>') + '</style>'.length;
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Emberblood: a top-down open-world action game. Ash was born with horns, a tail and real fire, and this year the old puppet show about the dragon on the mountain turns out to be more than a puppet show.">
<meta name="theme-color" content="#0b0607">
<meta property="og:title" content="Emberblood">
<meta property="og:description" content="Three lanterns to light, and an old puppet show that is more than it seems.">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
${head}${body.slice(0, cut)}
</head>
<body>
${body.slice(cut)}
<script>
${js}
</script>
</body>
</html>
`;
mkdirSync('docs', { recursive: true });
writeFileSync('docs/index.html', page);
// artifact flavor: no document wrapper (the host adds one)
writeFileSync('dist/artifact.html', `${head}${body}\n<script>\n${js}\n</script>\n`);
console.log(`built docs/index.html (${(page.length / 1024).toFixed(0)} KB) with API ${api.startsWith('http') ? api : '(offline)'}`);
