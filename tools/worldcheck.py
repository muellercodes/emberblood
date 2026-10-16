#!/usr/bin/env python3
"""tools/worldcheck.py: the runtime checks 14 to 17 of _plan_format.md, run in the real game with Playwright.

  python3 tools/worldcheck.py [--page PAGE] [--out dist] [--act 2] [--only 14,15,16,17,saves]
                              [--chapters c_gear,c_salt] [--timeout 120] [--fixtures DIR] [--keep]

14  every registry and story entity is really there (window.__eb.story.entity(id).ok) and the engine found no
    data errors at load (story.errors()).
15  each main-path step's target can be reached from the step before with the powers the player has there
    (story.reach if the engine has it; the finale's own reach flood __eb.n4w.flood on map 4; elsewhere the
    report says "no reach data" instead of failing).
16  each gate blocks without its power and opens with it (same reach data; otherwise "no reach data").
17  story.autoplay runs every chapter start to finish, and both old saves (fixtures/save_done.json, Toby's real
    save, and save_mid.json) load, keep their flags and stage, and keep running.

Without --page it builds the game into a temp folder (the worktree's docs/ and dist/ are not touched). The step
targets and the powers at each step come from tools/check.mjs (it is run first). When window.__eb.story is missing
(the v10 engine is not in the build), checks 14 to 16 and the autoplay are skipped with a clear message and the old
saves are still checked. Writes <out>/worldcheck.md and worldcheck.json; exit 1 on any failure, 0 on pass or skip.
"""
import json, os, shutil, subprocess, sys, tempfile, time, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FIX_DEFAULT = '/tmp/claude-0/-home-claude-emberblood/a874aad5-2855-573e-a8ed-e72c7a38d4bc/scratchpad/fixtures'
FLOOD_OPT = {'dbljump': 'dbl', 'claws': 'claws', 'grapple': 'grapple', 'wings': 'wings', 'stride': 'stride'}


def build_page(root, tmp):
    """copy build.mjs and game/ into tmp, build there, wrap the artifact as in COMMON.md"""
    b = os.path.join(tmp, 'build')
    os.makedirs(b, exist_ok=True)
    shutil.copy(os.path.join(root, 'build.mjs'), b)
    shutil.copytree(os.path.join(root, 'game'), os.path.join(b, 'game'))
    subprocess.run(['node', 'build.mjs'], cwd=b, check=True, stdout=subprocess.DEVNULL)
    art = open(os.path.join(b, 'dist', 'artifact.html'), encoding='utf8').read()
    page = os.path.join(tmp, 'page.html')
    with open(page, 'w', encoding='utf8') as f:
        f.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>')
        f.write(art)
        f.write('</body></html>')
    return page


def run_check(root, tmp, act):
    out = os.path.join(tmp, 'check')
    cmd = ['node', os.path.join(HERE, 'check.mjs'), '--root', root, '--out', out, '--quiet']
    if act:
        cmd += ['--act', str(act)]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        return json.load(open(os.path.join(out, 'check.json'), encoding='utf8'))
    except Exception:
        return {}


class Report:
    def __init__(self):
        self.fails, self.skips, self.notes, self.oks = [], [], [], []

    def fail(self, rule, msg, **kw):
        self.fails.append(dict(rule=rule, msg=msg, **kw))

    def skip(self, rule, msg, **kw):
        self.skips.append(dict(rule=rule, msg=msg, **kw))

    def note(self, rule, msg, **kw):
        self.notes.append(dict(rule=rule, msg=msg, **kw))

    def ok(self, rule, msg, **kw):
        self.oks.append(dict(rule=rule, msg=msg, **kw))


def boot(pg):
    pg.wait_for_timeout(1800)
    pg.evaluate('()=>{ const b=document.getElementById("bStory"); if(b) b.click(); }')
    pg.wait_for_timeout(700)
    pg.evaluate('()=>{ try{ __eb.skipDialogue(); }catch(e){} try{ __eb.god=true; }catch(e){} }')


def has_story(pg):
    return pg.evaluate('()=>!!(window.__eb&&window.__eb.story&&typeof window.__eb.story.entities==="function")')


def goto(pg, x, y, mp=None, area=None):
    """move Ash next to (x, y) on map mp (or into an area) and let the world settle"""
    pg.evaluate('''([x,y,mp,area])=>{ const E=window.__eb; try{ E.skipDialogue(); }catch(e){}
      if(area){ try{ if(E.AREA) E.exitArea(); E.enterArea(area); }catch(e){} return; }
      try{ if(E.AREA) E.exitArea(); }catch(e){}
      if(mp!=null&&typeof E.goMap==='function'){ try{ E.goMap(mp,x,y+30); return; }catch(e){} }
      E.tp(x,y+30); }''', [x, y, mp, area])
    pg.wait_for_timeout(350)


def check_entities(pg, R, act):
    errs = pg.evaluate('()=>__eb.story.errors()') or []
    for e in errs:
        R.fail('14', f'engine data error: {e}')
    ents = pg.evaluate('()=>__eb.story.entities()') or []
    if act:
        ents = [e for e in ents if e.get('map') is None or e.get('map') == int(act) - 1 or e.get('map') < int(act) - 1]
    bymap = {}
    for e in ents:
        bymap.setdefault(e.get('map'), []).append(e)
    n_ok = 0
    for mp, L in sorted(bymap.items(), key=lambda kv: (kv[0] is None, kv[0] or 0)):
        first = next((e for e in L if e.get('x') is not None and e.get('x') < 19950), None)
        if first:
            goto(pg, first['x'], first['y'], mp)
        for e in L:
            info = pg.evaluate('id=>__eb.story.entity(id)', e['id']) or {}
            if not info.get('ok') and e.get('x') is not None:
                goto(pg, e['x'], e['y'], mp)          # chunks and props load near Ash: look again from close by
                info = pg.evaluate('id=>__eb.story.entity(id)', e['id']) or {}
            if info.get('ok'):
                n_ok += 1
            else:
                R.fail('14', f"{e['id']} ({e.get('kind')}, map {mp}, {e.get('x')},{e.get('y')}): not found in the world: {info.get('why') or 'no reason given'}", ent=e['id'], src=e.get('src'))
    R.ok('14', f'{n_ok} of {len(ents)} entities found in the world')


def reach_fn(pg):
    """which reach data the build has: 'story' (story.reach), 'n4w' (the finale's flood) or None"""
    return pg.evaluate('''()=>{ const E=window.__eb; if(E.story&&typeof E.story.reach==='function') return 'story';
      if(E.n4w&&typeof E.n4w.flood==='function'&&typeof E.n4w.reach==='function') return 'n4w'; return null; }''')


def can_reach(pg, kind, a, b, mp, powers):
    """True/False, or None when there is no reach data for that map"""
    if kind == 'story':
        r = pg.evaluate('([a,b,p])=>__eb.story.reach(a,b,p)', [a, b, powers])
        if r is None:
            return None, 'no reach data'
        return bool(r.get('ok')), r.get('why', '')
    if kind == 'n4w' and mp == 4 and isinstance(a, list) and isinstance(b, list):
        o = {FLOOD_OPT[p]: True for p in powers if p in FLOOD_OPT}
        pg.evaluate('([x,y,o])=>__eb.n4w.flood(x,y,o)', [a[0], a[1], o])
        return bool(pg.evaluate('([x,y])=>__eb.n4w.reach(x,y)', b)), 'n4w flood'
    return None, 'no reach data'


def check_reach(pg, R, CJ, act):
    kind = reach_fn(pg)
    walk = CJ.get('walk') or {}
    n_ok = n_none = 0
    for n, W in sorted(walk.items()):
        if act and str(n) != str(act):
            continue
        prev = None
        for s in W.get('steps') or []:
            if not s.get('target') or (s.get('at') is None and not s.get('area')):
                continue
            if prev and prev['chapter'] == s['chapter'] and prev.get('map') == s.get('map') and not s.get('area') and not prev.get('area'):
                a = prev['target'] if kind == 'story' else prev['at']
                b = s['target'] if kind == 'story' else s['at']
                ok, why = can_reach(pg, kind, a, b, s.get('map'), s.get('powers') or [])
                if ok is None:
                    n_none += 1
                elif ok:
                    n_ok += 1
                else:
                    R.fail('15', f"{s['chapter']}.{s['step']}: {s['target']} can not be reached from {prev['target']} with {', '.join(s.get('powers') or []) or 'no powers'} ({why})", owner=s['chapter'], step=s['step'])
            prev = s
    if n_none:
        R.skip('15', f'no reach data for {n_none} step pairs (only the finale map has a reach flood; the engine has no story.reach)')
    if n_ok or not n_none:
        R.ok('15', f'{n_ok} step pairs reachable' + (f' ({kind})' if kind else ''))


def check_gates(pg, R, CJ, act):
    kind = reach_fn(pg)
    gates = [g for g in (CJ.get('info') or {}).get('gates') or [] if not act or str(g.get('act')) == str(act)]
    if not gates:
        R.note('16', 'no gates with a power in the data')
        return
    n_ok = n_none = 0
    for g in gates:
        info = pg.evaluate('id=>__eb.story.entity(id)', g['id']) or {}
        if not info.get('ok'):
            R.fail('16', f"gate {g['id']} is not in the world: {info.get('why') or '?'}", ent=g['id'])
            continue
        if not g.get('leads') or not g.get('at'):
            continue
        lead = pg.evaluate('id=>__eb.story.entity(id)', g['leads']) or {}
        if lead.get('x') is None:
            continue
        # approach from the side away from what the gate leads to
        ax, ay = g['at']
        dx, dy = lead['x'] - ax, lead['y'] - ay
        d = max(1.0, (dx * dx + dy * dy) ** 0.5)
        start = [round(ax - dx / d * 90), round(ay - dy / d * 90)]
        allp = sorted(set(['jump', 'stride', 'wings', 'dbljump', 'skimmer', 'claws', 'grapple', 'shadow', 'blaze', 'windride', 'pound', 'dive', 'burrow', 'moonfire']))
        without = [p for p in allp if p != g.get('power')]
        a = g['id'] if kind == 'story' else start
        b = g['leads'] if kind == 'story' else [lead['x'], lead['y']]
        shut, why1 = can_reach(pg, kind, a, b, g.get('map'), without)
        opened, why2 = can_reach(pg, kind, a, b, g.get('map'), allp)
        if shut is None or opened is None:
            n_none += 1
            continue
        if shut:
            R.fail('16', f"gate {g['id']} ({g.get('gate')}) does not block: {g['leads']} is reachable without {g.get('power')}", ent=g['id'])
        elif not opened:
            R.fail('16', f"gate {g['id']} ({g.get('gate')}) does not open: {g['leads']} is not reachable even with {g.get('power')}", ent=g['id'])
        else:
            n_ok += 1
    if n_none:
        R.skip('16', f'{n_none} of {len(gates)} gates: no reach data on their maps, so only "the gate is there" was tested')
    R.ok('16', f'{n_ok} gates block without their power and open with it')


def check_autoplay(pg, R, act, chapters, timeout):
    L = pg.evaluate('()=>__eb.story.chapters()') or []
    if act:
        L = [c for c in L if str(c.get('act')) == str(act)]
    if chapters:
        L = [c for c in L if c['id'] in chapters]
    if not L:
        R.note('17', 'no data chapters to autoplay')
        return
    started = set()
    for c in L:
        a = c.get('act')
        if a and a not in started:
            started.add(a)
            pg.evaluate('n=>{ try{ __eb.actStart(n); }catch(e){} }', a)
            pg.wait_for_timeout(2200)
            pg.evaluate('()=>{ try{ __eb.skipDialogue(); }catch(e){} __eb.god=true; }')
        t0 = time.time()
        try:
            res = pg.evaluate('''([id,ms])=>Promise.race([__eb.story.autoplay(id,{walk:false}),
              new Promise(r=>setTimeout(()=>r({ok:false,log:['timed out after '+ms+' ms'],failAt:'timeout'}),ms))])''', [c['id'], int(timeout * 1000)])
        except Exception as e:
            res = {'ok': False, 'log': [str(e)[:300]], 'failAt': 'exception'}
        dt = time.time() - t0
        if res and res.get('ok'):
            R.ok('17', f"autoplay {c['id']}: ok in {dt:.1f} s ({len(res.get('log') or [])} log lines)")
        else:
            tail = ' | '.join((res or {}).get('log', [])[-4:])
            R.fail('17', f"autoplay {c['id']} stopped at {(res or {}).get('failAt')}: {tail}", owner=c['id'], step=(res or {}).get('failAt'))


def cont(pg):
    # press Continue on the title screen (a plain DOM click: an overlay must not make the test flaky)
    pg.wait_for_function('()=>!!document.getElementById("bContinue")', timeout=15000)
    pg.evaluate('()=>document.getElementById("bContinue").click()')
    pg.wait_for_timeout(1300)
    pg.evaluate('()=>{ try{ __eb.skipDialogue(); }catch(e){} }')


def check_saves(p, page, R, fixtures, errs_of):
    sys.path.insert(0, fixtures)
    for which in ['done', 'mid']:
        path = os.path.join(fixtures, f'save_{which}.json')
        if not os.path.exists(path):
            R.skip('17', f'no fixture save_{which}.json in {fixtures}')
            continue
        raw = json.load(open(path, encoding='utf8'))
        want = json.loads(raw['eb_world3'])
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        try:
            pg.set_default_timeout(120000)
            pg.goto('file://' + page, timeout=180000)
            pg.wait_for_timeout(1500)
            pg.evaluate('d=>{ localStorage.clear(); for(const k in d) localStorage.setItem(k,d[k]); }', raw)
            pg.reload(timeout=180000)
            pg.wait_for_timeout(1600)
            cont(pg)
            got = pg.evaluate('()=>({stage:__eb.G.stage, flags:Object.assign({},__eb.G.flags), choices:Object.assign({},__eb.G.choices), mode:__eb.G.mode, x:__eb.player.x, y:__eb.player.y})')
            lost = [k for k in want.get('flags', {}) if k not in got['flags']]
            lostc = [k for k, v in want.get('choices', {}).items() if got['choices'].get(k) != v]
            if lost:
                R.fail('17', f'save_{which}: flags lost on load: {", ".join(lost)}')
            if lostc:
                R.fail('17', f'save_{which}: choices changed on load: {", ".join(lostc)}')
            if not got.get('stage'):
                R.fail('17', f'save_{which}: no stage after load')
            # keep playing: walk a little, let time pass, save, reload, continue again
            pg.keyboard.down('d'); pg.wait_for_timeout(700); pg.keyboard.up('d')
            pg.wait_for_timeout(1500)
            st = pg.evaluate('()=>{ const s=window.__eb.story; return s?{state:s.state(),errors:s.errors()}:null; }')
            if st and st.get('errors'):
                seen = set(f['msg'] for f in R.fails)
                for e in st['errors']:
                    if f'engine data error: {e}' not in seen:
                        R.fail('17', f'save_{which}: engine data error after load: {e}')
            pg.evaluate('()=>{ try{ __eb.foes.devEval("saveGame()"); }catch(e){} }')
            pg.reload(timeout=180000); pg.wait_for_timeout(1500)
            cont(pg)
            again = pg.evaluate('()=>__eb.G.stage')
            if again != got.get('stage'):
                R.fail('17', f'save_{which}: stage {got.get("stage")} became {again} after save and reload')
            if errs:
                R.fail('17', f'save_{which}: {len(errs)} page errors: {errs[0][:200]}')
            else:
                R.ok('17', f'save_{which} (stage {want.get("stage")} -> {got.get("stage")}) loads, keeps its flags and choices, and continues')
        except Exception as e:
            R.fail('17', f'save_{which}: {str(e)[:300]}')
        finally:
            b.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--page'); ap.add_argument('--root', default=ROOT); ap.add_argument('--out')
    ap.add_argument('--act'); ap.add_argument('--only', default='14,15,16,17,saves'); ap.add_argument('--chapters', default='')
    ap.add_argument('--timeout', type=float, default=120); ap.add_argument('--fixtures', default=os.environ.get('EB_FIXTURES', FIX_DEFAULT))
    ap.add_argument('--keep', action='store_true')
    o = ap.parse_args()
    root = os.path.abspath(o.root)
    out = os.path.abspath(o.out or os.path.join(root, 'dist'))
    only = set(o.only.split(','))
    tmp = tempfile.mkdtemp(prefix='ebwc_')
    t0 = time.time()
    R = Report()
    try:
        page = os.path.abspath(o.page) if o.page else build_page(root, tmp)
        CJ = run_check(root, tmp, o.act)
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
          if only & {'14', '15', '16', '17'}:
            b = p.chromium.launch()
            pg = b.new_page(viewport={'width': 1280, 'height': 800})
            pg.set_default_timeout(120000)
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto('file://' + page, timeout=180000)
            boot(pg)
            api = has_story(pg)
            if not api:
                msg = 'window.__eb.story is missing (the v10 story engine is not in this build): checks 14, 15, 16 and the chapter autoplay are skipped'
                for r in ['14', '15', '16', '17']:
                    if r in only:
                        R.skip(r, msg)
            else:
                if '14' in only:
                    check_entities(pg, R, o.act)
                if '15' in only:
                    check_reach(pg, R, CJ, o.act)
                if '16' in only:
                    check_gates(pg, R, CJ, o.act)
                if '17' in only:
                    check_autoplay(pg, R, o.act, [c for c in o.chapters.split(',') if c], o.timeout)
            if errs:
                R.fail('page', f'{len(errs)} page errors during the checks: {errs[0][:200]}')
            b.close()
          if 'saves' in only or '17' in only:
                check_saves(p, page, R, o.fixtures, None)
    finally:
        if not o.keep:
            shutil.rmtree(tmp, ignore_errors=True)
    ms = int((time.time() - t0) * 1000)
    lines = [f'worldcheck: {len(R.fails)} failed, {len(R.skips)} skipped ({ms // 1000} s)', '']
    for x in R.oks:
        lines.append(f"ok   {x['rule']:<6}{x['msg']}")
    lines.append('')
    lines.append('```')
    for x in R.fails:
        lines.append(f"FAIL {x['rule']:<6}{x['msg']}")
    for x in R.skips:
        lines.append(f"SKIP {x['rule']:<6}{x['msg']}")
    for x in R.notes:
        lines.append(f"NOTE {x['rule']:<6}{x['msg']}")
    lines.append('```')
    md = '\n'.join(lines) + '\n'
    if chr(0x2014) in md:
        md = md.replace(chr(0x2014), ', ')
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 'worldcheck.md'), 'w', encoding='utf8').write(md)
    json.dump({'ok': not R.fails, 'ms': ms, 'fails': R.fails, 'skips': R.skips, 'notes': R.notes, 'oks': R.oks},
              open(os.path.join(out, 'worldcheck.json'), 'w', encoding='utf8'), indent=1)
    print(md)
    return 1 if R.fails else 0


if __name__ == '__main__':
    sys.exit(main())
