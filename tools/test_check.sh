#!/usr/bin/env bash
# Runs tools/check.mjs against every fixture: each bad fixture must fail its own rule, the good one must pass.
#   bash tools/test_check.sh
set -u
cd "$(dirname "$0")/.."
FX=tools/test_fixtures
OUT=$(mktemp -d)
pass=0; fail=0
ok()  { echo "ok    $1"; pass=$((pass+1)); }
bad() { echo "FAIL  $1"; fail=$((fail+1)); }

# the good chapter (c_gear from _plan_format.md): no failures
node tools/check.mjs --story $FX/good --out $OUT/good --act 2 --quiet --fixtures $FX/saves
code=$?
if [ $code -eq 0 ] && ! grep -q '^FAIL' $OUT/good/check.md; then ok "good c_gear passes"; else bad "good c_gear should pass (exit $code)"; grep '^FAIL' $OUT/good/check.md; fi

# every bad fixture fails with its own rule
for d in $FX/bad/*/; do
  rule=$(basename "$d")
  case $rule in saves_fx|legacy_dir) continue;; esac
  extra="--fixtures $FX/saves"
  [ "$rule" = saves ] && extra="--fixtures $FX/bad/saves_fx"
  story=$d
  if [ "$rule" = emdash ]; then
    # also a real em dash character, written here so no source file holds one
    story=$OUT/emdash_story; mkdir -p $story/act2; cp $d/act2/*.js $story/act2/
    printf "chapter({ id: 'c_dash2', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Dash'], step: [],\n  scene: { c_dash2_s: [['narr', 'Wait \xe2\x80\x94 what?', 'Wait. What?']] } })\n" > $story/act2/c_dash2.js
  fi
  node tools/check.mjs --story $story --out $OUT/$rule --act 2 --quiet $extra
  code=$?
  n=$(grep -c "^FAIL $rule " $OUT/$rule/check.md)
  if [ $code -eq 1 ] && [ "$n" -gt 0 ]; then ok "$rule fails ($n): $(grep -m1 "^FAIL $rule " $OUT/$rule/check.md | cut -c6-130)"
  else bad "$rule should fail with FAIL $rule (exit $code)"; grep '^FAIL' $OUT/$rule/check.md | head -5; fi
done
[ "$(grep -c '^FAIL emdash ' $OUT/emdash/check.md)" -ge 2 ] && ok "emdash catches the escape and the real character" || bad "emdash should catch both"

# the trust problem from the plan: the exact message
grep -q "ending friend needs trust vesper>=4; main path gives 2 (3 with a1_locket)" $OUT/solve/check.md && ok "solve reports the trust 4 problem" || { bad "solve trust message"; grep '^FAIL solve' $OUT/solve/check.md; }

# the legacy text scan: Act I watch words, and a direction check against registry positions
node tools/check.mjs --story $FX/bad/legacy_dir --out $OUT/legacy --act 1 --quiet --fixtures $FX/saves
grep -qE '^WARN legacy +a1d_story.js:27 "Then the north gate' $OUT/legacy/check.md && ok "legacy scan warns on the north gate line" || bad "legacy scan north gate"
grep -qE "^WARN dir +a1d_story.js:158 .*e0_grizz_camp is south of e0_village" $OUT/legacy/check.md && ok "legacy scan checks a direction" || { bad "legacy dir"; grep '^WARN dir' $OUT/legacy/check.md | head -3; }

# speed: the whole check must take a few seconds
ms=$(node -e "console.log(require('$OUT/good/check.json').ms)")
[ "$ms" -lt 5000 ] && ok "good run took ${ms} ms" || bad "too slow: ${ms} ms"

echo "test_check: $pass passed, $fail failed"
rm -rf $OUT
[ $fail -eq 0 ]
