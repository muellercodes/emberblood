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
node tools/check.mjs --story $FX/good --out $OUT/good --act 2 --quiet --fixtures $FX/saves > $OUT/good.txt
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
  node tools/check.mjs --story $story --out $OUT/$rule --act 2 --quiet $extra > $OUT/$rule.txt
  code=$?
  n=$(grep -c "^FAIL $rule " $OUT/$rule/check.md)
  if [ $code -eq 1 ] && [ "$n" -gt 0 ]; then ok "$rule fails ($n): $(grep -m1 "^FAIL $rule " $OUT/$rule/check.md | cut -c6-130)"
  else bad "$rule should fail with FAIL $rule (exit $code)"; grep '^FAIL' $OUT/$rule/check.md | head -5; fi
done
[ "$(grep -c '^FAIL emdash ' $OUT/emdash/check.md)" -ge 2 ] && ok "emdash catches the escape and the real character" || bad "emdash should catch both"

# the trust problem from the plan: the exact message
grep -q "ending friend needs trust vesper>=4; main path gives 2 (3 with a1_locket)" $OUT/solve/check.md && ok "solve reports the trust 4 problem" || { bad "solve trust message"; grep '^FAIL solve' $OUT/solve/check.md; }

# the legacy text scan: Act I watch words, and a direction check against registry positions
# (the lines are found in a1d_story.js by their text, so a rewrite that moves them keeps the test; one that cuts them skips it)
node tools/check.mjs --story $FX/bad/legacy_dir --out $OUT/legacy --act 1 --quiet --fixtures $FX/saves > $OUT/legacy.txt
ln=$(grep -n -i -m1 'Then the north gate' game/src/a1d_story.js | cut -d: -f1)
if [ -z "$ln" ]; then ok "legacy scan: the north gate line is no longer in a1d_story.js (skipped)"
else grep -qiE "^WARN legacy +a1d_story.js:$ln \"Then the north gate" $OUT/legacy/check.md && ok "legacy scan warns on the north gate line" || bad "legacy scan north gate (a1d_story.js:$ln)"; fi
ln=$(grep -n -m1 "Grizzlefang's camp is north of the village" game/src/a1d_story.js | cut -d: -f1)
if [ -z "$ln" ]; then ok "legacy scan: the camp direction line is no longer in a1d_story.js (skipped)"
else grep -qE "^WARN dir +a1d_story.js:$ln .*e0_grizz_camp is south of e0_village" $OUT/legacy/check.md && ok "legacy scan checks a direction" || { bad "legacy dir (a1d_story.js:$ln)"; grep '^WARN dir' $OUT/legacy/check.md | head -3; }; fi

# the v11 talk shapes (J2): the exact problems in bad/re, bad/talk, bad/label and bad/said
has() { grep -qF -- "$2" $OUT/$1/check.md && ok "$1: $3" || { bad "$1: $3"; grep "^FAIL $1 " $OUT/$1/check.md | head -3; }; }
has re 're has 1 reply (write 2 or 3)' 'one reply only'
has re 'has 13 words (a reply is a button: 8 or fewer)' 'a reply over 8 words'
has re 'starts with Ash; the first line is the other person' "a response by Ash"
has re 'reply "Maybe later." has no response' 'a reply with no response'
has re 'is also at tools/test_fixtures/bad/re/act2/c_re.js:14 (reply texts are unique across the game)' 'the same reply text twice'
has re 'next inside a next' 'a next inside a next'
has re "replies to a reply's response (replies go two levels deep at most)" 'replies three levels deep'
has re 're needs the line it answers' 're with no line to answer'
has talk 'needs say or scene (what v_tess answers)' 'an ask topic with no answer'
has talk 'an ask topic or an option, not both' 'an ask topic that is also an option'
[ "$(grep -c '^FAIL label ' $OUT/label/check.md)" -eq 4 ] && ok "label: the 4 generic labels (option, ask, pick, reply)" || bad "label should fail 4 times"
has said 'said tess_goats is read (if: "said tess_goats") but nothing sets it' 'a said key nobody sets'
grep -qE '^WARN said +c_said: said tess_count is set but no if: ever reads it' $OUT/said/check.md && ok "said: a key nobody reads is a WARN" || bad "said WARN"

# the voice budgets (J2): a fake old game and story data in voice/good (every budget kept) and voice/bad (every one broken).
# --game reads that folder's game/src as the old code; the empty --fixtures folder skips the save rule
VX=$FX/voice
for k in good bad; do node tools/check.mjs --story $VX/$k/story --game $VX/$k --out $OUT/voice_$k --fixtures $VX --quiet > $OUT/voice_$k.txt; echo $? > $OUT/voice_$k.code; done
NEW='^(WARN|FAIL) +(voice\.[a-z]+|re|talk|label|said|choose|idle) '
n=$(grep -cE "$NEW" $OUT/voice_good/check.md)
[ "$n" -eq 0 ] && [ "$(cat $OUT/voice_good.code)" -eq 0 ] && ok "voice good: re, ask, idle, bye, said and next validate; no voice or talk note" || { bad "voice good should be quiet (exit $(cat $OUT/voice_good.code))"; grep -E "$NEW|^FAIL" $OUT/voice_good/check.md | head -8; }
grep -qE '^voice: 0 lines over budget' $OUT/voice_good.txt && ok "voice good: the build summary says 0" || bad "voice good summary"
[ "$(cat $OUT/voice_bad.code)" -eq 0 ] && ! grep -q '^FAIL' $OUT/voice_bad/check.md && ok "voice bad: budgets only WARN, never FAIL" || bad "voice bad should have no FAIL"
B=tools/test_fixtures/voice/bad/story/act2/v_bad.js
L=tools/test_fixtures/voice/bad/story/act2/v_lines.js
want() { grep -qE -- "^WARN $1 +$2" $OUT/voice_bad/check.md && ok "voice bad: $3" || { bad "voice bad: $3"; grep "^WARN $1 " $OUT/voice_bad/check.md | head -3; }; }
want voice.greats "$B:12 ash \".*\": use 6 of 6 \(the game keeps 5" 'greats: the 6th use is named'
want voice.ember 'game/src/x1_story.js:4 v_tess "Come here, little ember\."' 'little ember: old code, by a speaker it is not for'
want voice.ember "$B:13 v_tess " 'little ember: data, by a speaker it is not for'
want voice.ember "$B:14 ember .*ember's use 2 in act 2 \(1 per act\)" 'little ember: Ember twice in one act'
want voice.ember 'game/src/x2_story.js:3 c_mask .*c_mask says it in act 2 only' 'little ember: the Moth Mask outside Act II'
want voice.dumpling "$B:13 v_tess " 'dumpling: not Glaciar'
want voice.duck "$B:15 v_tess " 'duck: not Oona'
want voice.dearie 'game/src/x1_people.js:3 v_tess "Sit down, dearie' 'dearie: a talk table key is the speaker'
want voice.halt "$B:16 v_rolf " 'HALT!: not the Bobs'
want voice.tuesday "$B:27 v_tess " 'Tuesday: not Umberwing'
want voice.big "$B:23 v_rolf .*use 4 of 4 \(the game keeps 3" 'big as a barn: the 4th use'
want voice.bakery "$B:28 v_tess .*use 3 of 3 \(the game keeps 2" 'bakery: the 3rd use'
want voice.eat "$B:16 v_rolf .*is for maren only" 'Eat something: not Maren'
want voice.eat "$B:19 maren .*maren's use 2 in act 2" 'Eat something: Maren twice in one act'
want voice.everything "$B:31 v_tess .*use 3 of 3" 'EVERYTHING: the 3rd use'
want voice.imcaps "$B:32 ash \"I'm a ROCK\.\"" "I'm a ROCK."
want voice.bravest "$B:33 ember " 'The bravest'
want voice.cookie "$B:33 ember " 'a fortune cookie'
want voice.caps "$L:13 v_otto \"I have ONE cup\.\": \"ONE\": 3 of 11 lines" 'CAPS share: names the lines past the budget'
want voice.opener "$L:9 v_otto .*opens 4 of 8 lines" 'opener share: names the lines past the budget'
want choose "v_lines.scene v_lines_s#8: choose v_lines_c asks \"What do you do\?\" \(the default\) after a line by ash" 'a generic choose after a line by Ash'
want idle 'v_tess has replies or ask topics but no idle line' 'replies and no idle line'
want said 'v_bad: said tess_climb is set but no if: ever reads it' 'a said key nobody reads'
want re 'v_bad.talk v_tess#1: the replies are one kind, one brave and one silly' 'replies as a set of tones'
want re 'v_bad.talk v_tess#2: 2 joke \(silly\) replies' 'two joke replies'
want re 'v_bad.talk v_tess#1 re 2: the response to "I will climb up there." is 3 lines' 'a 3-line response'
want re 'v_bad.talk v_tess#1 re 1: unknown reply field mood' 'an unknown reply field'
! grep -qE "^WARN voice.dumpling .*v_act3.js" $OUT/voice_bad/check.md && ! grep -qE "^WARN voice.eat .*v_act3.js" $OUT/voice_bad/check.md && ok "voice bad: Glaciar's dumpling and Maren's one Act III meal are fine" || bad "voice bad: v_act3 should be quiet"
! grep -qE '^WARN voice.caps .*(c_penny|f_tollef)' $OUT/voice_good/check.md && ok "voice good: Penny's headlines and Tollef are left out of the CAPS share" || bad "caps skip"
# the build output: one summary line per rule, no warning lines
grep -qE '^  voice.greats +1 over \(6 uses; budget: 5 in the game\)' $OUT/voice_bad.txt && ! grep -q '^WARN' $OUT/voice_bad.txt && ok "voice bad: one summary line per rule in the build output" || { bad "voice summary"; head -5 $OUT/voice_bad.txt; }
# --voice: the table on screen and in voice.md
node tools/check.mjs --story $VX/bad/story --game $VX/bad --out $OUT/voice_tab --fixtures $VX --quiet --voice > $OUT/voice_tab.txt
grep -qE '^  voice.caps +8 lines in 2 files +5 in 2 files' $OUT/voice_tab.txt && grep -q '^| voice.greats | "great-great" or counting greats | 5 in the game | 6 uses | 1 |' $OUT/voice_tab/voice.md && ok "--voice prints the table and writes voice.md" || { bad "--voice table"; cat $OUT/voice_tab.txt | head -5; }

# speed: the whole check must take a few seconds of CPU (wall time depends on what else the machine runs)
ms=$(node -e "const j=require('$OUT/good/check.json'); console.log(j.cpu != null ? j.cpu : j.ms)")
[ "$ms" -lt 5000 ] && ok "good run took ${ms} ms of CPU" || bad "too slow: ${ms} ms of CPU"

echo "test_check: $pass passed, $fail failed"
rm -rf $OUT
[ $fail -eq 0 ]
