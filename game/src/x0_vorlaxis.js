// ================= x0_vorlaxis (v9 Act I): the story of the Cinder Mountain climb and the new Vorlaxis fight
// Bible: scratchpad/bible/ACT1.md 6.4 (Three Lanterns for Mom), 7 (the climb, tier by tier), 8 (Vorlaxis in the crater)
// and 9.1 to 9.5 (the Ember Heart in each ending, the lanterns line). Guide: scratchpad/VORLAXIS.md.
// The mountain itself is e4_cinder's. This module adds the story on its terraces (Cindervane's last walk, the Oath
// stragglers, Iska's Lantern, Bram's Anvil with its obsidian boulders and Hammer Gate, Pip, Ember at the rim), Mom's three
// Lantern Rests, and a new fight: phase 1 on the crater floor (magma tides and stomp rings: JUMP), phase 2 in the sky
// (the vents, the Wings, the Ember Scales, the perches: BOW or WING-RANG), phase 3 in obsidian crust (the HAMMER).
// Tiers by level (e4 terraces): forecourt 0 = Tier 0 the Gate Yard, T1 1 = Tier 1, T2 2 = Tier 2 the Smoke Ledges,
// T3 3 = Tier 3 Bram's Anvil, T4 4 = Tier 4 the Vent Fields, T5 6 = Tier 5 the Crown Ledges, crater floor 7 = Tier 6.

// ---------- numbers per difficulty: [Easy, Normal, Hard]
const VK={
  tele:[0.25,0,0],        // extra telegraph seconds on every attack (Easy)
  rec:[1.4,1,0.8],        // recovery between attacks x
  waves:[1,2,3], waveSpd:[170,240,300],   // magma tide waves per attack, px/s
  fb:[3,3,5], stomp2:[0,1,1], pools:[0,1,1],
  ventMode:['all','cw','rand'], ventT:[99,4.5,3.2],
  scales:[2,3,4], scaleWin:[2.4,1.5,1.0], floor:[1,0,0], bend:[5,1.6,0], scaleR:[34,27,24], crash:[6,4,3],
  meteors:[5,7,9], summon:[2,2,3], orbit:[0.36,0.44,0.55],
  plates:[2,3,4], plateCh:[0,0.5,0.99], exposed:[12,8,6], rivers:[2,3,4], plateR:[34,28,26],
  ck:[2,3,9]              // the first phase whose start is a checkpoint (Easy: 2 and 3, Normal: 3, Hard: none)
};
const vdi=()=>clamp(foeDiff().i,0,2);
const vk=k=>VK[k][vdi()];
const VSKY=134, VC={x:7000,y:950}, VARENA={rx:520,ry:495};
const VLV_TIER={0:0,1:1,2:2,3:3,4:4,6:5,7:6};
const VOR={on:false,e:null,vents:[],perch:null,shot:null,allow:false,ally:false,beats:true,pil:null,cw:null,strag:null,
  zoomK:1,pipT:12,sayT:0,clinkT:0,nagT:0,fist:null,end:null,lastSB:0,tide:null};

// ---------- speakers, items
Object.assign(SPK,{a1_soot:{name:'Sister Soot',col:'#9a7ab0'},a1_strag:{name:'A tired cultist',col:'#b49ac8'}});
if(!SPK.grandpa) SPK.grandpa={name:'Grandpa',col:'#ff9a5a'};
Object.assign(ITEM_NAMES,{a1_lantern:ITEM_NAMES.a1_lantern||S(`Mom's paper lantern`,`Mom's lantern`),a1_heart:ITEM_NAMES.a1_heart||S('The Ember Heart','The Ember Heart')});

// ================= words (bible ACT1 6.4, 7, 8, 9)
const vl=(who,f,s)=>[who,S(f,s)];
const vls=(who,f,s,skip)=>({who,text:S(f,s),skipIf:skip});
// ---------- 6.4 Three Lanterns for Mom
QDEFS.a1_lanterns={title:S('Three Lanterns for Mom','Three Lanterns for Mom'),giver:'maren',min:'summit',give:{a1_lantern:3},
  offer:[
    vl('maren',`The gate's open. So you're going up there. Tonight.`,`The gate is open. You are going up there tonight.`),
    vl('maren',`I made these. Three paper lanterns. Light one at each rest on the way up, so I can see them from the forge and know you're all right.`,`I made three paper lanterns. Light one at each rest on the way up. Then I know you are okay.`),
    vl('ash',`What if I forget?`,`What if I forget?`),
    vl('maren',`You won't forget. Because if I don't see three little lights on that mountain, I'm coming up there myself. In my apron. With my hammer.`,`You won't. If I don't see three lights, I'm coming up there. In my apron. With my hammer.`),
    vl('ash',`...I'll light them.`,`...I'll light them.`)],
  steps:[
    {t:'flag',flag:'a1_lan_1',text:S(`Light Mom's first lantern in Iska's old stone lantern, on the Smoke Ledges of Cinder Mountain`,`Light Mom's first lantern on the mountain`),at:'lm:a1_lanrest_1'},
    {t:'flag',flag:'a1_lan_2',text:S(`Light Mom's second lantern at the far end of the Vent Fields`,`Light Mom's second lantern by the vents`),at:'lm:a1_lanrest_2'},
    {t:'flag',flag:'a1_lan_3',text:S(`Light Mom's last lantern on the Crown Ledges, below the crater`,`Light Mom's last lantern near the top`),at:'lm:a1_lanrest_3',reward:{coins:20}}]};
// only before the fight is won (after it, Mom has nothing left to worry about)
{ const base=qAvail; qAvail=function(id){ if(id==='a1_lanterns'&&G&&(G.bossDone.vorlaxis||(G.flags&&G.flags.act1_done))) return false; return base(id); }; }
STORY.a1_lantern_lit=[vl('narr',`The little lantern catches. Far, far below, in Emberhollow, a tiny light blinks back from the forge.`,`The lantern glows. Far below, a tiny light blinks back from the forge.`)];
// v11 (STORY_PLAN 3.4): Mom's Three Lanterns can't be missed. The moment the Obsidian Gate opens (a9c_story's summit
// start sets a1_lan_due), Mom comes up the road with them herself and the quest starts on its own: its goal goes in
// the list and all three Lantern Rests get a marker. A save that already has the quest (started or done) is untouched;
// one that reached the summit before this keeps Mom's offer at the forge, as before.
STORY.a1_lanterns_run=[vl('narr',`Footsteps pound up the road behind you. It's Mom, still in her apron, out of breath, with three paper lanterns tied to her belt.`,`Mom runs up the road in her apron. She has three paper lanterns.`)];
STORY.a1_lanterns_back=[vl('narr',`She squeezes your shoulder once, hard. Then she walks back down the road to the forge, and she doesn't look back. You can tell it's difficult.`,`She squeezes your shoulder. Then she walks back to the forge.`)];
function vorLanternsDue(){
  const F=G.flags;
  if(!F.a1_lan_due) return false;
  if(G.mode!=='story'||G.quests.a1_lanterns||G.bossDone.vorlaxis||F.act1_done||G.stage!=='summit'){ F.a1_lan_due=0; return false; }
  // (after the chapter card, and after the blessing the gate fight earned, if it is offered)
  if(VOR.lanT==null) VOR.lanT=G.time+2.6;
  if(G.time<VOR.lanT||(G.pendingBless>0&&G.time<VOR.lanT+5)) return false;
  if(scene!=='play'||DLG||G.mini||G.fightSite||AREA||!player||player.dead) return false;
  F.a1_lan_due=0; VOR.lanT=null;
  runDialogue([...STORY.a1_lanterns_run,...QDEFS.a1_lanterns.offer,...STORY.a1_lanterns_back],()=>{ scene='play'; if(!G.quests.a1_lanterns) startQuest('a1_lanterns'); });
  return true;
}
{ const base=updateStory; updateStory=function(dt){ try{ if(vorLanternsDue()) return; }catch(e){ console.error(e); } return base(dt); }; }
// while the quest runs, every Lantern Rest still dark is marked: in the world, on the minimap and on the map
const vorLanQ=()=>{ const q=G&&G.mode==='story'&&G.quests&&G.quests.a1_lanterns; return !!q&&!q.done&&(G.items.a1_lantern||0)>0; };
{ const base=questTargets; questTargets=function(){ const out=base(); try{ if(vorLanQ()&&!AREA){ const tx=S(`Light one of Mom's lanterns here`,`Light Mom's lantern here`);
  for(const R of VRESTS) if(!vorRestLit(R)&&!out.some(o=>o.id==='a1_lanterns'&&Math.abs(o.x-R.x)<8&&Math.abs(o.y-R.y)<8)) out.push({x:R.x,y:R.y,id:'a1_lanterns',text:tx}); } }catch(e){ console.error(e); } return out; }; }
{ const base=drawMarkers; drawMarkers=function(t){ base(t); try{ if(vorLanQ()&&!AREA) for(const R of VRESTS) if(!vorRestLit(R)&&inView(R.x,R.y,60)) drawMarker(R.x,R.y-62,'?',t); }catch(e){ console.error(e); } }; }

// ---------- 7.1 Tier 0: the Gate Yard
STORY.a1_cinder_walk=[
  vl('cinder',`A thousand years I stood at that gate and looked up this road. I never once walked it.`,`For a thousand years I looked up this road. I never walked it.`),
  vl('ash',`What's it like?`,`What is it like?`),
  vl('cinder',`Steep, smoky, and terrible for the knees, which is exactly what I hoped for.`,`Steep, smoky, and bad for my knees. I love it.`),
  vl('cinder',`I'll go ahead to the crater stairs and hold them. Nothing that serves him comes up behind you. You have my word, and I have been keeping my word for a very long time.`,`I will go ahead and guard the crater stairs. Nothing will sneak up behind you. I promise.`),
  ch('ash',S(`Anything you want to say to an old knight, Emberblood?`,`Anything to say to an old knight?`),[
    {t:S(`Thank you for waiting for me.`,`Thank you for waiting for me.`),tone:'kind',then:[vl('cinder',`It was worth it. Every year of it. Even the winters.`,`It was worth it. Even the winters.`)]},
    {t:S(`Race you to the top!`,`Race you to the top!`),tone:'brave',then:[vl('cinder',`HA! In this armor? You'll win. I'll complain the whole way.`,`HA! In this armor? You will win. I will grumble.`)]},
    {t:S(`Did you bring your chair?`,`Did you bring your chair?`),tone:'silly',then:[vl('cinder',`...How do you know about the chair? Never mind. Yes. It's at the top. Just to know it's there.`,`How do you know about my chair? Yes. It is at the top.`)]}
  ])];
STORY.a1_cinder_helm=[vl('narr',`Sir Cindervane's helmet sits on the gate steps, with a red flower in it. You touch it for luck. It's warm.`,`Sir Cindervane's helmet sits here with a red flower. You touch it for luck. It is warm.`)];
// ---------- 7.2 Tier 1: the Last Candle
STORY.a1_stragglers=[
  vl('narr',`Behind a pile of broken carts, three cultists and one knight are sitting around a single black candle. They look like they haven't slept in a week.`,`Behind some broken carts, three cultists and a knight sit by a black candle. They look very tired.`),
  vl('a1_strag',`Is that the Emberblood? Is it over? Please say it's over. I want my mom.`,`Is that the Emberblood? Is it over? I want my mom.`),
  vls('narr',`Sister Soot stands up. She holds a letter. You know the handwriting. It's Morrow's.`,`Sister Soot holds up a letter. It is from Morrow.`,()=>G.choices.morrow!=='free'),
  vls('a1_soot',`Brother Morrow wrote to us. From a pumpkin patch. He says: "Go home. Grow something. It isn't worth it." He drew a pumpkin. It was a good pumpkin.`,`Morrow wrote to us. He says: "Go home. Grow something." He drew a good pumpkin.`,()=>G.choices.morrow!=='free'),
  vls('a1_soot',`You threw Brother Morrow in a cell! We are all that's left of the Scaled Oath. We will not let you pass!`,`You put Morrow in a cell! We are the last of the Oath. You will not pass!`,()=>G.choices.morrow!=='jail'),
  ch('ash',S(`What do you tell them?`,`What do you tell them?`),[
    {t:S(`Go home. All of you. It's over.`,`Go home. It's over.`),tone:'kind',cond:()=>G.choices.morrow==='free',fn:()=>{ G.flags.a1_strag='home'; },then:[
      vl('a1_soot',`...Yes. Yes, I think we will. Come on, brothers. Blow out the candle. We're going to go and look at a pumpkin.`,`Yes. I think we will. Blow out the candle. Let's go see a pumpkin.`),
      vl('narr',`The last of the Scaled Oath walk down the mountain in a line, holding hands. The knight carries the candle. It is not lit.`,`The last of the Oath walk down the mountain, holding hands. The candle is out.`)]},
    {t:S(`Then I guess I'm passing anyway.`,`Then I'm going past you anyway.`),tone:'brave',fn:()=>{ G.flags.a1_strag='fought'; }}
  ])];
STORY.a1_strag_candle=[vl('a1_soot',`The black candle! Brothers, RISE!`,`The black candle! Brothers, get up!`)];
STORY.a1_strag_snuff=[vl('narr',`Pfft. The black candle goes out. The cultists look at it, then at each other, then at their feet.`,`Pfft! The candle goes out. The cultists look at their feet.`),
  vl('a1_strag',`...Can we go home now?`,`Can we go home now?`)];
// ---------- 7.3 Tier 2: the Smoke Ledges and Iska's Lantern
STORY.a1_step_nodj=[
  vl('narr',`You jump. You reach. You bonk your nose on the rock and slide back down.`,`You jump. Bonk! Your nose hits the rock.`),
  vl('ash',`Ow. Okay. I need to jump higher. Or jump twice. Can you jump twice? Who jumps twice?`,`Ow. I need to jump twice. Who jumps twice?`),
  vls('pip',`Mip?`,`Mip?`,()=>!G.flags.pip),
  vl('ash',`...Farmer Hollis's goat. Hollis said his goat jumps twice.`,`Farmer Hollis's goat! It jumps twice.`)];
STORY.a1_iska_climb=[
  vl('iska',`My lantern. I put it here a thousand years ago, on the shortest night, so the five of us could find our way back down.`,`My old lantern. I put it here long ago, so we could find our way down.`),
  vl('iska',`We never needed it. We went down a different way. Wardens are very bad at planning.`,`We never used it. Wardens are bad at plans.`),
  vls('iska',`You carry Ember's letter, don't you? The one to her father. "Not as a king. Just as my father." Remember it up there. It might matter.`,`You have Ember's letter. "Just as my father." Remember it up there.`,()=>!(G.pages&&G.pages.p9)),
  vl('iska',`The crater's vents breathe in and out, like someone asleep. Fly when they breathe out. Watch for the gold sparks.`,`The vents up top breathe. Fly in when you see gold sparks.`)];
STORY.a1_iska_cold=[vl('narr',`An old stone lantern with Iska's mark on it. It's cold and empty. One of Mom's paper lanterns would fit inside just right.`,`An old stone lantern. It is empty. Mom's lantern would fit.`)];
// ---------- 7.5 Tier 3: Bram's Anvil
STORY.a1_bram_climb=[
  vl('bram',`HA! The Emberblood on my anvil! I used to come up here and hit this thing for fun. It's the loudest rock in the world.`,`HA! The Emberblood at my anvil! I hit this rock for fun. It's the loudest rock ever.`),
  vls('bram',`And you brought Old Thunder! Look at her. She's still got the dent from the time I hit Oriel's shield by mistake.`,`You brought Old Thunder! She still has my old dent.`,()=>!vorThunder()),
  vls('bram',`No hammer? On MY mountain? Here, take this one. I left it by the anvil a thousand years ago. Still good. Hammers don't go off.`,`No hammer? Take this old one. Hammers never go bad.`,()=>!!(G.weapons&&G.weapons.hammer)),
  vl('bram',`My gate there opens for the old song. "Over Cinder Mountain." If you know it, play it. If you don't, smash rocks. Both are good. Smashing is better.`,`My gate opens for the old song. Or smash the black rocks. Smashing is better.`),
  vl('bram',`Big black rocks want a charged smash. Hold the attack, let the hammer glow, then BOOM.`,`Hold attack to charge the hammer. Then BOOM!`)];
STORY.a1_gate_song=[vl('narr',`You hum the three notes Wendel taught you. Dum, da-DUM. The carved notes on the door light up one by one, and the Hammer Gate rolls aside with a grumble.`,`You hum the old song. The notes light up. The gate rolls open!`),
  vl('bram',`(from far away) THAT'S the one! Up you go, kid!`,`That's the one! Up you go!`)];
STORY.a1_gate_shut=[vl('narr',`A stone door carved with musical notes. It doesn't move. It looks like it wants a song. Or a lot of patience.`,`A stone door with music notes. It wants a song.`)];
// ---------- 7.6 Tier 5: the Crown Ledges, and Ember at the rim
STORY.a1_rim=[
  vl('narr',`The crater is a bowl of fire. In the middle, on a throne of black glass, something enormous is breathing.`,`The crater is a bowl of fire. On a black throne, something huge is breathing.`),
  vl('ember',`Ash. Wait. Just for a moment.`,`Ash. Wait a moment.`),
  vl('ash',`Ember?`,`Ember?`),
  vl('ember',`He's my father. He taught me to breathe fire, and then he burned the valley with his. I loved him anyway. Part of me still does.`,`He is my father. He did terrible things. I still love him a little.`),
  vl('ember',`I'm not asking you to be gentle. He won't let you. I'm asking you to remember that whatever you do up here, you get to choose it.`,`You don't have to be gentle. But remember: up here, you get to choose.`),
  vl('iska',`And you're not alone. All five of us came up the mountain with you.`,`You are not alone. All five of us are with you.`),
  vl('ash',`I'm ready. Mostly.`,`I'm ready. Mostly.`),
  vl('ember',`Then go on. I'll be right here. I've been right here for a thousand years.`,`Then go. I'll be right here.`)];
// ---------- 8.1 the intro (replaces STORY.bosses.vorlaxis.intro)
const VOR_INTRO=[
  vl('narr',`The great dragon lifts his head from the throne. Black glass cracks off his scales and tinkles down like hail.`,`The great dragon lifts his head. Black glass falls off him like hail.`),
  vl('vor',`You have her horns. And my fire. Did you climb my mountain to give it back?`,`You have her horns. And my fire.`),
  vl('ash',`Hi, Grandpa.`,`Hi, Grandpa.`),
  vl('vor',`For a thousand years my daughter's children fed my prison with MY fire. Today I take it back.`,`For a thousand years you kept me locked up with MY fire. Today I take it back.`),
  vl('ash',`She gave it to us. It was never yours to take back.`,`She gave it to us. It is not yours to take.`),
  vls('pip',`Mip!`,`Mip!`,()=>!G.flags.pip),
  vls('vor',`A drake. You brought a drake to fight me.`,`You brought a drake to fight me?`,()=>!G.flags.pip),
  vl('vor',`Come then, hatchling. Show me the fire you stole.`,`Come, hatchling. Show me the fire you stole.`)];
const VOR_INTRO2=[vl('vor',`Back again, hatchling? Good. I was getting bored.`,`Back again, hatchling? Good.`)];
const VOR_TAUNT={
  p2:S(`You BITE! Good. Then let us see if you can follow me UP.`,`You BITE! Good. Now follow me UP.`),
  p3:S(`ENOUGH! If I cannot have my fire, I will bury you in my MOUNTAIN!`,`ENOUGH! I will bury you in my MOUNTAIN!`),
  crash:[S('Rrraagh! My SCALES!','My SCALES!'),S('You cannot keep me DOWN!','You cannot keep me down!')],
  sum:[S('Children! To me!','Children! To me!'),S('Rise, my brood!','Rise, my brood!')],
  sky:[S('The sky is mine, hatchling!','The sky is mine!'),S('Can you even fly, hatchling?','Can you even fly?')],
  crust:[S('My mountain is my armor!','My mountain is my armor!'),S('Stone does not burn, hatchling!','Stone does not burn!')]};
// ---------- 8.4 the finish
STORY.a1_vor_end=[
  vl('vor',`How? How does something so small burn so bright?`,`How does something so small burn so bright?`),
  vl('ember',`(everywhere at once) Because it isn't only hers, Father. It never was.`,`(from everywhere) Because it is not only hers, Father.`),
  vl('vor',`Ember?`,`Ember?`)];
// ---------- 9.1 to 9.5 the Ember Heart (heartLines below puts them in the epilogue)
const VOR_HEART={
  hero:[vl('narr',`Where the dragon had been, something small glowed in the ash. A warm red stone, the size of a plum, beating very slowly, like a heart that was only dozing.`,`Where the dragon was, a warm red stone glows in the ash. It beats slowly, like a sleepy heart.`),
    vl('ash',`Huh. It's still warm.`,`Huh. It's still warm.`),
    vl('narr',`Ash carried it home in both hands. It was hot as a coal, but not to him. Mom lifted it onto the shelf above the forge with her longest tongs, and there it kept the whole house cozy. They called it the Ember Heart.`,`Ash carried it home. Mom put it above the forge. It kept the house cozy. They called it the Ember Heart.`)],
  warden:[vl('narr',`When the sixth Ward-fire caught, something rolled out of the old flame and into the new one. A warm red stone, the size of a plum, beating very slowly.`,`When the sixth Ward-fire lit, a warm red stone rolled into it. It beats slowly.`),
    vl('iska',`The Ember Heart. All that's left of the fire he couldn't keep. Leave it in your Ward-fire, Warden. It will keep him sleepy. And keep you warm on the cold climbs.`,`The Ember Heart. Leave it in your Ward-fire, Warden. It keeps him sleepy and you warm.`),
    vl('narr',`So the Ember Heart sat in the sixth Ward-fire at the top of the mountain, glowing like a tiny sunrise, and every Lantern Day Ash brought it down for the festival and carried it back up again.`,`The Ember Heart glowed in the Ward-fire like a tiny sunrise. Every Lantern Day, Ash carried it down for the party.`)],
  heir:[vl('narr',`One small piece of the fire would not go in. It rolled off the throne and sat there glowing, the size of a plum.`,`One small piece of fire would not go in. It glowed there, the size of a plum.`),
    vl('ash',`Is that... spare fire?`,`Is that spare fire?`),
    vl('narr',`By morning Ash had found out that his mother's door does not fit a dragon. So he breathed most of the fire back out, on purpose, into every lantern, hearth and oven in the valley, and folded back down to his own size.`,`Mom's door doesn't fit a dragon. So Ash gave most of the fire away, to every lantern and oven in the valley.`),
    vl('narr',`Mom keeps the spare piece in the forge and calls it the Ember Heart. Grandpa, very small and very bitter, sits on the warm shelf above Bertram's oven, and has never once said thank you.`,`Mom keeps the Ember Heart in the forge. Tiny Grandpa sits on the warm shelf over Bertram's oven.`)],
  lantern:[vl('narr',`Halfway down the mountain, Grandpa coughed. Something warm and red tumbled out and bounced on the path.`,`Halfway down, Grandpa coughed. A warm red stone bounced out.`),
    vl('vor',`Hm. That's the last of it. The old flame. I don't need it anymore. It's heavy, and it makes me grumpy.`,`That's the last of my old fire. I don't need it. It makes me grumpy.`),
    vl('vor',`Give it to your mother. Tell her to keep it somewhere warm. And tell her I'm sorry about the bakery. Not that bakery. The one from nine hundred years ago.`,`Give it to your mother. And tell her sorry about the bakery. The very old one.`),
    vl('narr',`Maren put the Ember Heart above the forge. Grandpa sat next to it every evening, the size of a goat, warming his old claws and pretending he wasn't.`,`Mom put the Ember Heart above the forge. Grandpa sat by it every evening, warming his claws.`)]};
const VOR_LANTERNS=vl('maren',`Three little lights on the mountain. I watched every one. Come here.`,`Three little lights on the mountain. I watched every one. Come here.`);
// small lines (banners, bubbles, tips)
const VT={
  p1:[S('Jump the rings!','Jump the rings!'),S('He stomps and the lava rolls in as rings. JUMP over them. Hide behind a pillar from his fire breath.','Jump over the rings! Hide from his fire.')],
  p2:[S('Fly into the gold sparks. Shoot the shiny scales!','Fly into the gold sparks. Shoot the shiny scales!'),S('He is in the sky now. Jump and fly into an open vent to rise to his height. When his scales shine gold, hit them with the bow or the Wing-rang. Rest on a glowing pillar top.','Fly into a vent to go high. Shoot his gold scales!')],
  p3:[S('Smash the black rock with your hammer!','Smash the black rock with your hammer!'),S('Black glass covers him. Only a hammer smash cracks it. Then hit the glowing spot underneath!','Smash the black rock. Then hit the glowing spot!')],
  high:S('Up high! Shoot his shiny scales!','Up high! Shoot the shiny scales!'),
  low:S('Too low! Fly into a gold vent to rise up to him.','Too low! Fly into a gold vent.'),
  perch:S('You land on the pillar top. Rest your wings here.','You land on the pillar. Rest your wings.'),
  perchTip:S('Fly over a glowing pillar top and press jump to land on it.','Fly over a glowing pillar and press jump to land.'),
  clink:S('CLINK! Only a hammer smash cracks the black glass.','CLINK! Use the hammer!'),
  crack:S('CRACK!','CRACK!'), crash:S('CRASH!','CRASH!'), scale:S('Scale hit!','Hit!'),
  stag:S('His tail hit a pillar! STAGGERED!','He hit a pillar! STAGGERED!'),
  ck:[S('Checkpoint','Checkpoint'),S('You start again at this part of the fight.','You start again here.')],
  pipKnock:S('MIP!','MIP!'), puff:S(`Puff's parents snatch a drakeling!`,`Puff's parents grab one!`),
  boulder:S('Too hard! Hold the hammer to charge it, then smash.','Too hard! Charge the hammer.'),
  hot:S('Too hot! The heat pushes you back.','Too hot!'),
  pipVent:S('MIIIIP!','MIIIIP!'), pipSneeze:S('Mip... ACHOO.','Mip... ACHOO.'), pipHide:S('mip...','mip...')
};

// ================= little helpers
function vorThunder(){ const F=G&&G.flags; return !!(F&&(F.a1_thunder||F.a1_bram_done||(G.quests.a1_bram&&G.quests.a1_bram.done)||(G.items&&G.items.a1_thunder))); }
function vorPillars(){ if(!VOR.pil){ const S0=POI.summit; VOR.pil=[]; for(let i=0;i<6;i++){ const a=i/6*TAU; VOR.pil.push({x:S0.x+Math.cos(a)*430,y:S0.y+Math.sin(a)*400,i,tall:i%2===0}); } } return VOR.pil; }
// a pillar between a and b (cover from fire)
function vorCover(x0,y0,x1,y1){ for(const P of vorPillars()) if(segD(P.x,P.y,x0,y0,x1,y1)<36&&dist(P.x,P.y,x1,y1)>20) return P; return null; }
function vorUnder(x,y){ for(const P of vorPillars()) if(dist(P.x,P.y,x,y)<54) return P; return null; }
// the ellipse distance from the crater centre (the arena is a slightly squashed circle)
function vorEll(x,y){ const dx=x-VC.x, dy=(y-VC.y)/0.952; return Math.hypot(dx,dy); }
function vorInFloor(x,y,m){ return vorEll(x,y)<VARENA.rx-(m||0); }
function vorClampIn(x,y,m){ const r=vorEll(x,y), R=VARENA.rx-(m||0); if(r<=R) return [x,y]; const k=R/r; return [VC.x+(x-VC.x)*k,VC.y+(y-VC.y)*k]; }
// Ash up at the dragon's height in phase 2: lifted by a vent (ceiling 9) or on a perch
function vorHigh(){ const p=player; return !!p&&(!!VOR.perch||(!!p.flying&&(p.elvCeil||0)>=9&&!p.landing&&!p.gliding)); }
function vorSky(){ const e=VOR.e; return !!(VOR.on&&e&&!e.dead&&e.vp===2); }
function vorBossOn(){ return !!(VOR.on&&VOR.e&&!VOR.e.dead); }
function vorTip(id,t,s,dur){ const F=G.flags; if(F['a1_vt_'+id]) return; F['a1_vt_'+id]=1; try{ mvTip(t,s,dur||9,'a1_vt_'+id); }catch(e){} }
// a body point of Vorlaxis on screen (world coordinates of the canvas), bx forward, by right, bz up
const _vp={x:0,y:0};
function vorPt(e,bx,by,bz,o){
  o=o||_vp; const F=T3.on?(e._vf!=null?e._vf:e.face):e.face, c=Math.cos(F), s=Math.sin(F), k=e.scale||1, alt=e.alt||0;
  const wx=bx*c-by*s, wy=bx*s+by*c;
  if(T3.on){ o.x=e.x+wx*k; o.y=e.y+46*T3.st*k+(wy*T3.ct-(bz+alt)*T3.st)*k; }
  else { o.x=e.x+wx*k; o.y=e.y-alt+wy*k; }
  return o;
}
// the ground point under a body point (hit tests live on the ground)
function vorFoot(e,bx,by){ const c=Math.cos(e.face), s=Math.sin(e.face); return {x:e.x+bx*c-by*s,y:e.y+bx*s+by*c}; }

// ================= the climb: places on e4's terraces
// spots (checked against the elevation grid: every one stands on a top, and each rest's wake-up spot (x+40, y+50) too)
const VCL={
  helm:{x:6930,y:2960}, cinderAt:{x:7080,y:2935}, stairsFoot:{x:7000,y:2790},
  strag:{x:6150,y:2556}, candle:{x:6128,y:2540}, carts:[[5972,2522],[6012,2527],[6052,2531]],
  iska:{x:7120,y:2360}, step:{x0:7880,x1:8010,y:2300}, warn:{x:8030,y:2330},
  anvil:{x:7690,y:2112}, bram:{x:7640,y:2080}, gate:{x:7830,y:2066,r:36},
  boulders:[[7380,2072],[7380,2128],[6900,2070],[6900,2130],[6900,2190],[6450,2070],[6450,2130],[6450,2190]],
  rest2:{x:7560,y:1915}, rest3:{x:6760,y:1690}, marlo:{x:6052,y:1806}
};
const VRESTS=[{id:'a1_lanrest_1',n:1,x:VCL.iska.x,y:VCL.iska.y,name:S(`Iska's Lantern`,`Iska's Lantern`)},
  {id:'a1_lanrest_2',n:2,x:VCL.rest2.x,y:VCL.rest2.y,name:S('Lantern Rest of the Vents','Vent Lantern')},
  {id:'a1_lanrest_3',n:3,x:VCL.rest3.x,y:VCL.rest3.y,name:S('Lantern Rest of the Crown','Crown Lantern')}];
// the Hammer Gate: a short stair from Bram's Anvil (Tier 3) up to the Vent Fields (Tier 4), shut by a carved stone door
ELEV.ramp({x0:7800,y0:1988,x1:7860,y1:2050,dir:'n',kind:'stairs'});
// the crater floor: magma veins, a cooled lava moat round the edge, and four old vent mouths (painted into the ground chunks)
ELEV.deco({k:0,bb:[6420,380,7580,1520],lvl:7,order:6,paint:(g,x0,y0,x1,y1)=>vorPaintCrater(g,x0,y0,x1,y1)});
function vorVentSpots(){ return [[VC.x,VC.y-330,'n'],[VC.x+330,VC.y,'e'],[VC.x,VC.y+330,'s'],[VC.x-330,VC.y,'w']]; }
function vorPaintCrater(g,x0,y0,x1,y1){
  const rng=mulberry32(4471), cx=VC.x, cy=VC.y, RX=VARENA.rx;
  g.save(); g.lineCap='round'; g.lineJoin='round';
  // a cooled lava moat inside the rim (dark crust, glowing seams); it boils during the fight
  g.fillStyle='#3a2220'; g.beginPath(); g.ellipse(cx,cy,RX+44,(RX+44)*0.952,0,0,TAU); g.ellipse(cx,cy,RX-46,(RX-46)*0.952,0,0,TAU,true); g.fill('evenodd');
  g.strokeStyle='#1c0e0c'; g.lineWidth=3; g.beginPath(); g.ellipse(cx,cy,RX-46,(RX-46)*0.952,0,0,TAU); g.stroke();
  for(let i=0;i<70;i++){ const a=rng()*TAU, r=RX-38+rng()*76, L=20+rng()*44, x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r*0.952, c=rng()<0.5?'#ff7a2a':'#e0501e', w=1.6+rng()*2;
    if(x<x0-60||x>x1+60||y<y0-60||y>y1+60) continue;
    g.strokeStyle=c; g.lineWidth=w; g.beginPath(); g.ellipse(cx,cy,r,r*0.952,0,a,a+L/r); g.stroke(); }
  // magma veins from the middle out (a big broken star): dark first, then the hot line
  for(let i=0;i<14;i++){ let a=i/14*TAU+rng()*0.2, r=60+rng()*40, x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r*0.95; const pts=[[x,y]];
    while(r<RX-60){ r+=30+rng()*40; a+=(rng()-0.5)*0.35; x=cx+Math.cos(a)*r; y=cy+Math.sin(a)*r*0.95; pts.push([x,y]); }
    let inb=false; for(const [px,py] of pts) if(px>x0-80&&px<x1+80&&py>y0-80&&py<y1+80){ inb=true; break; } if(!inb) continue;
    for(const [w,col] of [[7,'#24120e'],[2.6,'#d8541e'],[1.1,'#ffc060']]){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); pts.forEach((q,j)=>j?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.stroke(); } }
  // obsidian flagstones in rings round the sigil
  for(let ring=0;ring<3;ring++){ const R=150+ring*95, n=12+ring*6; for(let i=0;i<n;i++){ const a=i/n*TAU+ring*0.2, x=cx+Math.cos(a)*R, y=cy+Math.sin(a)*R*0.95, skip=rng()<0.35, rr=[13+rng()*6,13+rng()*6,13+rng()*6,13+rng()*6,13+rng()*6];
    if(skip||x<x0-40||x>x1+40||y<y0-40||y>y1+40) continue;
    g.fillStyle=ring%2?'#3e2c30':'#46323a'; g.strokeStyle='#1a0e10'; g.lineWidth=1.6; g.beginPath(); for(let k=0;k<5;k++){ const b=a+k/5*TAU; g.lineTo(x+Math.cos(b)*rr[k],y+Math.sin(b)*rr[k]*0.7); } g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='rgba(190,150,230,.35)'; g.lineWidth=1; g.beginPath(); g.moveTo(x-6,y-4); g.lineTo(x+3,y-7); g.stroke(); } }
  // the four vent mouths (dormant: dark rings with a dim ember glow)
  for(const [vx,vy] of vorVentSpots()){ const rr=[]; for(let i=0;i<10;i++) rr.push([rng(),rng(),rng(),rng()]);
    if(vx<x0-90||vx>x1+90||vy<y0-90||vy>y1+90) continue;
    g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(vx,vy+4,58,36,0,0,TAU); g.fill();
    g.fillStyle='#2a1612'; g.beginPath(); g.ellipse(vx,vy,48,30,0,0,TAU); g.fill();
    g.fillStyle='#5a2a1a'; g.beginPath(); g.ellipse(vx,vy,30,18,0,0,TAU); g.fill();
    g.fillStyle='#8a3a1a'; g.beginPath(); g.ellipse(vx,vy,13,8,0,0,TAU); g.fill();
    for(let i=0;i<10;i++){ const q=rr[i], a=i/10*TAU+q[0]*0.3, x=vx+Math.cos(a)*(50+q[1]*6), y=vy+Math.sin(a)*(31+q[2]*4); g.fillStyle=i%2?'#4a3634':'#5a4442'; g.beginPath(); g.ellipse(x,y,7+q[3]*4,5+q[3]*2,0,0,TAU); g.fill(); g.strokeStyle='#140c0a'; g.lineWidth=1.8; g.stroke(); }
    g.strokeStyle='#140c0a'; g.lineWidth=2.4; g.beginPath(); g.ellipse(vx,vy,48,30,0,0,TAU); g.stroke(); }
  g.restore();
}
// ---------- art (cached, outlined sprites; only glows and flames are drawn live)
function vorSpr(key,R,fn){ return typeof sbSprite==='function'?sbSprite('vor_'+key,R,fn):spriteOf(R,fn); }
const VOB=['#3c2c44','#2a1e32','#5a4878','#9a84c8'];   // obsidian: base, dark, light, shine
function vorBoulderSpr(v){ return vorSpr('boulder'+v,46,g=>{
  const rng=mulberry32(77+v*31);
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4,22,40,12,0,0,TAU); g.fill();
  const pts=[]; for(let i=0;i<9;i++){ const a=i/9*TAU-Math.PI/2+rng()*0.3, r=30+rng()*10; pts.push([Math.cos(a)*r,Math.sin(a)*r*0.82-6]); }
  g.fillStyle=VOB[1]; g.beginPath(); pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.closePath(); g.fill();
  for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length], lit=(a[0]+b[0])<0&&(a[1]+b[1])<10; g.fillStyle=lit?VOB[2]:i%2?VOB[0]:VOB[1]; g.beginPath(); g.moveTo(-4,-10); g.lineTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.closePath(); g.fill(); }
  g.fillStyle=VOB[3]; g.globalAlpha=0.6; g.beginPath(); g.moveTo(-14,-30); g.lineTo(-4,-12); g.lineTo(-20,-14); g.closePath(); g.fill(); g.globalAlpha=1;
  g.strokeStyle='#ff8a3a'; g.lineWidth=1.8; g.beginPath(); g.moveTo(6,-22); g.lineTo(2,-8); g.lineTo(10,4); g.moveTo(2,-8); g.lineTo(-10,0); g.stroke();
  g.strokeStyle='#ffd27a'; g.lineWidth=0.7; g.stroke();
}); }
function vorCartSpr(v){ return vorSpr('cart'+v,30,g=>{
  const rng=mulberry32(12+v*7);
  g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(2,14,28,8,0,0,TAU); g.fill();
  g.save(); g.rotate((rng()-0.5)*0.5);
  g.fillStyle='#7a4e2a'; g.fillRect(-24,-12,48,18); g.fillStyle='#9a6a3a'; g.fillRect(-24,-12,48,6);
  g.strokeStyle='#3a2210'; g.lineWidth=1.4; for(let x=-16;x<24;x+=10){ g.beginPath(); g.moveTo(x,-12); g.lineTo(x,6); g.stroke(); }
  g.fillStyle='#4a3020'; g.beginPath(); g.arc(-14,8,7,0,TAU); g.fill(); g.strokeStyle='#2a1a10'; g.lineWidth=1.6; g.stroke();
  g.fillStyle='#6a5a4a'; g.beginPath(); g.arc(-14,8,2,0,TAU); g.fill();
  g.strokeStyle='#5a3a1a'; g.lineWidth=3; g.beginPath(); g.moveTo(18,-14); g.lineTo(30,-24+rng()*6); g.stroke();
  g.fillStyle='#a03a2a'; g.beginPath(); g.moveTo(-6,-12); g.lineTo(4,-22); g.lineTo(12,-12); g.closePath(); g.fill();
  g.restore();
}); }
function vorAnvilSpr(){ return vorSpr('anvil',64,g=>{
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(6,30,58,16,0,0,TAU); g.fill();
  g.fillStyle='#4a4048'; g.beginPath(); g.moveTo(-30,30); g.lineTo(-20,6); g.lineTo(20,6); g.lineTo(30,30); g.closePath(); g.fill();
  g.fillStyle='#5a5058'; g.beginPath(); g.moveTo(-54,-14); g.lineTo(44,-14); g.quadraticCurveTo(64,-12,60,-2); g.lineTo(36,8); g.lineTo(-36,8); g.lineTo(-50,-2); g.closePath(); g.fill();
  g.fillStyle='#8a8090'; g.beginPath(); g.moveTo(-54,-14); g.lineTo(44,-14); g.quadraticCurveTo(58,-13,57,-8); g.lineTo(-50,-8); g.closePath(); g.fill();
  g.fillStyle='#ffcf5a'; g.globalAlpha=0.5; for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(-30+i*24,-12,5,1.6,0,0,TAU); g.fill(); } g.globalAlpha=1;
  g.strokeStyle='#2a2028'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-14,18); g.lineTo(-6,10); g.moveTo(10,22); g.lineTo(14,12); g.stroke();
}); }
function vorGateSpr(open){ return vorSpr('gate'+(open?1:0),44,g=>{
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,24,40,10,0,0,TAU); g.fill();
  g.fillStyle='#5a4a44'; g.fillRect(-40,-36,12,60); g.fillRect(28,-36,12,60); g.fillStyle='#6e5c54'; g.fillRect(-42,-42,84,12);
  if(!open){ g.fillStyle='#7a6658'; g.fillRect(-28,-30,56,54); g.fillStyle='#8e786a'; g.fillRect(-28,-30,56,8);
    g.strokeStyle='#3a2a24'; g.lineWidth=1.6; g.beginPath(); g.moveTo(0,-30); g.lineTo(0,24); g.stroke();
    g.fillStyle='#3a2a24'; for(const [x,y] of [[-16,-6],[-4,4],[12,-10]]){ g.beginPath(); g.ellipse(x,y,4,3,-0.4,0,TAU); g.fill(); g.fillRect(x+3,y-14,1.8,14); }
    g.fillRect(-12,-20,26,2.4); }
  else { g.fillStyle='#2a1c18'; g.fillRect(-28,-30,56,54); g.fillStyle='#7a6658'; g.fillRect(-30,-30,6,54); g.fillRect(24,-30,6,54); }
}); }
function vorStoneLanternSpr(){ return vorSpr('slantern',26,g=>{
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(3,22,20,6,0,0,TAU); g.fill();
  g.fillStyle='#8a7e72'; g.fillRect(-9,4,18,18); g.fillStyle='#a49686'; g.fillRect(-9,4,18,5);
  g.fillStyle='#6e6258'; g.fillRect(-13,-4,26,8);
  g.fillStyle='#2a201c'; g.fillRect(-9,-20,18,16); g.fillStyle='#9a8c7c'; g.fillRect(-11,-20,3,16); g.fillRect(8,-20,3,16);
  g.fillStyle='#7e7064'; g.beginPath(); g.moveTo(-17,-20); g.lineTo(0,-32); g.lineTo(17,-20); g.closePath(); g.fill();
  g.fillStyle='#b4a490'; g.beginPath(); g.moveTo(-17,-20); g.lineTo(0,-32); g.lineTo(-2,-20); g.closePath(); g.fill();
  g.fillStyle='#ffcf8a'; g.beginPath(); g.moveTo(0,10); g.quadraticCurveTo(5,15,0,19); g.quadraticCurveTo(-5,15,0,10); g.fill();
}); }
// the crater's six old pillars as real columns (the stock art is only their flat footprint): the three tall ones are
// the phase 2 perches (their tops sit at the perch height), the three broken ones are stumps
const VPIL={tallH:102,stumpH:34,base:12};
function vorPillarSpr(tall){ const H=tall?VPIL.tallH:VPIL.stumpH, R=tall?76:44, B=R-18, top=B-H, w=27;
  return vorSpr('pillar'+(tall?1:0),R,g=>{
    g.fillStyle='rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(8,B+3,w+12,(w+12)*0.36,0,0,TAU); g.fill();
    const gr=g.createLinearGradient(-w,0,w,0); gr.addColorStop(0,VOB[2]); gr.addColorStop(0.35,VOB[0]); gr.addColorStop(1,VOB[1]);
    g.fillStyle=gr; g.beginPath(); g.moveTo(-w,top); g.lineTo(-w-1,B); g.ellipse(0,B,w+1,(w+1)*0.4,0,Math.PI,0,true); g.lineTo(w,top); g.closePath(); g.fill();
    g.strokeStyle='rgba(20,10,30,.45)'; g.lineWidth=1.6; for(const x of [-12,4,17]){ g.beginPath(); g.moveTo(x,top+4); g.lineTo(x+(x<0?-1:1),B+(x<0?8:7)); g.stroke(); }
    g.fillStyle='rgba(154,132,200,.35)'; g.fillRect(-w+3,top+4,5,H-6);
    // a glowing crack of lava down the column
    g.strokeStyle='#ff8a3a'; g.lineWidth=2.2; g.beginPath(); g.moveTo(10,top+10); g.lineTo(6,top+H*0.35); g.lineTo(12,top+H*0.6); g.lineTo(8,B-2); g.stroke(); g.strokeStyle='#ffd27a'; g.lineWidth=0.8; g.stroke();
    if(tall){ g.fillStyle=VOB[2]; g.beginPath(); g.ellipse(0,top,w+3,(w+3)*0.42,0,0,TAU); g.fill(); g.fillStyle=VOB[0]; g.beginPath(); g.ellipse(0,top+1,w-4,(w-4)*0.4,0,0,TAU); g.fill();
      g.strokeStyle='rgba(255,140,60,.75)'; g.lineWidth=1.6; g.beginPath(); g.ellipse(0,top+1,w-10,(w-10)*0.4,0,0,TAU); g.stroke(); }
    else { g.fillStyle=VOB[2]; g.beginPath(); g.moveTo(-w-1,top+4); g.lineTo(-14,top-6); g.lineTo(-4,top+3); g.lineTo(6,top-9); g.lineTo(14,top+1); g.lineTo(w+1,top-3); g.lineTo(w,top+8); g.lineTo(-w,top+10); g.closePath(); g.fill();
      g.fillStyle=VOB[1]; for(const [x,y,r] of [[-34,B-2,7],[33,B+4,6],[22,B+11,4]]){ g.beginPath(); g.ellipse(x,y,r,r*0.7,0.3,0,TAU); g.fill(); } }
  }); }
function vorCandleSpr(){ return vorSpr('candle',10,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(1,6,7,2.4,0,0,TAU); g.fill(); g.fillStyle='#1e1622'; g.fillRect(-2.6,-8,5.2,13); g.fillStyle='#3a3044'; g.fillRect(-2.6,-8,1.6,13); g.fillStyle='#2a2030'; g.beginPath(); g.ellipse(0,5,5,2,0,0,TAU); g.fill(); }); }
// ---------- the climb's world pieces: landmarks for the prompts (the art is drawn in the y-sorted list, vorRenderList)
{ const base=initWorld; initWorld=function(){ base(); try{ vorClimbPlaces(); }catch(e){ console.error('vor places',e); } }; }
function vorClimbPlaces(){
  const L=(o)=>addLandmark(Object.assign({k:'reach',noNudge:true,draw:()=>{}},o));
  for(const R of VRESTS) L({id:R.id,x:R.x,y:R.y,r:0,always:true,prompt:S('Look at the stone lantern','Look at the lantern'),hidden:()=>!vorRestPrompt(R),act:()=>vorRestAct(R)});
  L({id:'a1_bgate',x:VCL.gate.x,y:VCL.gate.y+8,r:0,prompt:S('Look at the Hammer Gate','Look at the gate'),hidden:()=>!!G.flags.a1_bgate,act:()=>vorGateAct()});
  addLandmark({id:'a1_cm_warn',k:'sign',x:VCL.warn.x,y:VCL.warn.y,r:8,noNudge:true,prompt:'Read the carving',text:S('Carved deep into the rock: "ONLY THE BOUNCY MAY PASS."','"ONLY THE BOUNCY MAY PASS."')});
  // Marlo's ledge: a chest up on the star-iron pillar (the pillar's vent gets you there), with a Heart Ember inside
  if(typeof reachChest==='function') reachChest('a1_cm_marlo',VCL.marlo.x,VCL.marlo.y,{coins:40,xp:160,title:S(`Marlo's secret ledge`,`Marlo's ledge`),sub:S('40 coins and a Heart Ember','40 coins and a Heart Ember!'),
    say:[S(`A little chest, wedged behind the star-iron. A note on top in very curly writing: "For the Magnificent's favorite assistant. M."`,`A little chest! A curly note says: "For my favorite helper. M."`)]},{act:o=>{ reachLoot(o); try{ if(typeof gainHeartEmber==='function') gainHeartEmber('a1_marlo'); }catch(e){} }});
  // colliders: the stragglers' barricade, the obsidian boulders, the Hammer Gate (vorSyncCols switches them every frame)
  VOR.carts=VCL.carts.map(([x,y])=>addCol({t:'c',x,y,r:22}));
  VOR.bould=VCL.boulders.map(([x,y],i)=>({i,x,y,id:'a1_bo_'+i,col:addCol({t:'c',x,y,r:34})}));
  VOR.gateCol=addCol({t:'c',x:VCL.gate.x,y:VCL.gate.y,r:VCL.gate.r});
  addCol({t:'c',x:VCL.anvil.x,y:VCL.anvil.y,r:28});
  for(const R of VRESTS) addCol({t:'c',x:R.x,y:R.y+6,r:11,low:true});
  // lava light round the crater's moat (so the crater glows at night)
  for(let i=0;i<10;i++){ const a=i/10*TAU; LIGHTS.push({x:VC.x+Math.cos(a)*VARENA.rx,y:VC.y+Math.sin(a)*VARENA.rx*0.952,r:240,i:0.7,fire:true}); }
  if(typeof mapListsReset==='function') mapListsReset();
}
function vorSyncCols(){
  const F=G.flags, on=VOR.beats&&G.mode==='story', sum=G.stage==='summit';
  if(VOR.carts){ const off=!on||!sum||!!F.a1_carts||F.a1_strag==='home'; for(const c of VOR.carts) c.off=off; }
  if(VOR.bould) for(const b of VOR.bould) b.col.off=!on||!!G.found[b.id]||(!sum&&!G.flags.a1_tier_3);
  if(VOR.gateCol) VOR.gateCol.off=!!F.a1_bgate;
}

// ---------- Mom's three Lantern Rests: lit with one of her paper lanterns (fire breath or the prompt), then a rest:
// a wake-up spot after a fall, a fast travel spot, and healing when you walk up to it
function vorRestLit(R){ return !!G.flags['a1_lan_'+R.n]; }
function vorRestPrompt(R){
  if(G.mode!=='story'||G.stage!=='summit'&&!vorRestLit(R)) return false;
  const lm=LANDMARKS.find(o=>o.id===R.id); if(!lm) return false;
  if(vorRestLit(R)) return false;   // a lit rest is a shrine now: the stock "Rest at ..." prompt takes over
  lm.prompt=(G.items.a1_lantern||0)>0?S(`Light Mom's lantern`,`Light Mom's lantern`):S('Look at the stone lantern','Look at the lantern');
  return true;
}
function vorRestAct(R){
  if(vorRestLit(R)) return;
  if((G.items.a1_lantern||0)<=0){ runDialogue(R.n===1?STORY.a1_iska_cold:[vl('narr',`An old stone lantern, cold and empty. One of Mom's paper lanterns would fit inside just right.`,`An empty stone lantern. Mom's lantern would fit.`)],()=>{ scene='play'; }); return; }
  vorRestLight(R);
}
function vorRestLight(R){
  if(vorRestLit(R)) return;
  takeItems({a1_lantern:1}); G.flags['a1_lan_'+R.n]=true;
  SFX.play('shrine'); jingle('secret','pickup'); flashA=0.35; flashCol='255,210,140';
  emit(R.x,R.y-24,30,{col:'255,210,130',ang:-Math.PI/2,spread:1.2,smin:30,smax:140,lmin:.5,lmax:1.1,zmin:1.5,zmax:3,rise:20});
  vorRestsSync(); G.shrines[R.id]=true; G.lastShrine=R.id;
  const p=player; p.hp=p.maxHp; p.potions=p.potionsMax;
  runDialogue(STORY.a1_lantern_lit,()=>{ scene='play'; setBanner(S('Lantern Rest','Lantern Rest'),S('You will wake up here if you fall. You can fast travel here too.','You wake up here if you fall.'),3); questPoke(); saveGame(); });
}
// the lit rests are shrines (wake-up and fast travel); unlit ones are not (so they are never "found" by walking past)
function vorRestsSync(){
  for(let i=SHRINES.length-1;i>=0;i--) if(SHRINES[i].a1rest) SHRINES.splice(i,1);
  if(!G||G.mode!=='story') return;
  for(const R of VRESTS) if(vorRestLit(R)){ SHRINES.push({id:R.id,x:R.x,y:R.y,name:simplify(R.name),a1rest:true}); G.shrines[R.id]=true; }
  if(typeof mapListsReset==='function') mapListsReset();
}
{ const base=newRun; newRun=function(mode){ base(mode); try{ vorRestsSync(); vorResetRT(); }catch(e){ console.error(e); } }; }
{ const base=loadGame; loadGame=function(s){ base(s); try{ vorRestsSync(); vorResetRT(); }catch(e){ console.error(e); } }; }
function vorResetRT(){ VOR.on=false; VOR.e=null; VOR.perch=null; VOR.cw=null; VOR.strag=null; VOR.end=null; VOR.fist=null; VOR.zoomK=1; for(const v of VOR.vents) v.open=false; }

// ---------- the Hammer Gate (Bram's song) and the obsidian boulders (a charged hammer smash)
function vorSongKnown(){ return !!(G.quests.song&&G.quests.song.done); }
function vorGateAct(){
  if(G.flags.a1_bgate) return;
  if(vorSongKnown()){ runDialogue(STORY.a1_gate_song,()=>{ scene='play'; vorGateOpen(); }); return; }
  runDialogue(STORY.a1_gate_shut,()=>{ scene='play'; });
}
function vorGateOpen(){
  G.flags.a1_bgate=true; G.flags.a1_bgate_t=G.time; vorSyncCols();
  SFX.play('boom'); shake(6); jingle('secret','shrine');
  for(let i=0;i<3;i++) later(i*0.25,()=>emit(VCL.gate.x+(i-1)*14,VCL.gate.y-30,8,{col:'255,220,140',ang:-Math.PI/2,spread:0.6,smin:30,smax:90,lmin:.5,lmax:.9,zmin:1.5,zmax:3,rise:20}));
  emit(VCL.gate.x,VCL.gate.y,26,{col:'150,130,110',glow:false,smin:40,smax:160,lmin:.4,lmax:.9,zmin:3,zmax:6,grow:6});
  setBanner(S('The Hammer Gate is open','The gate is open!'),S('Its stairs go straight up to the Vent Fields.','The stairs go up to the vents.'),2.8); saveGame();
}
function vorBreakBoulder(b){
  if(G.found[b.id]) return;
  G.found[b.id]=true; vorSyncCols();
  SFX.play('boom',0.9); shake(9); hitstop=Math.max(hitstop,0.05);
  emit(b.x,b.y-10,34,{col:'90,70,110',glow:false,smin:60,smax:300,lmin:.4,lmax:1,zmin:3,zmax:7,grow:3,drag:3});
  emit(b.x,b.y-10,18,{col:'255,150,70',smin:60,smax:240,lmin:.2,lmax:.5,zmin:1.5,zmax:3,drag:3});
  ftext(b.x,b.y-50,simplify(VT.crack),'#ffd27a',18);
  // lava slimes ooze out of some of the cracks
  if(G.mode==='story'&&((b.i*7+3)%5<2)){ const e=makeEnemy('slime',b.x+12,b.y+8,{level:9,tint:'#ff7a30',aggro:true,homeX:b.x,homeY:b.y,leash:600}); e.spawnIn=0.4; }
  if(!G.flags.a1_bo_first){ G.flags.a1_bo_first=1; setBanner(S('The black rock shatters!','The rock breaks!'),S('Lava slimes ooze out of the cracks!','Lava slimes come out!'),2.4); }
  saveGame();
}
// hammer smashes: boulders and the barricade on the climb; crust plates in the fight (phase 3). Old Thunder (a1_bram)
// breaks things from 200 px with a full charge.
{ const base=hammerImpact; hammerImpact=function(h){
  try{ vorHammer(h); }catch(e){ console.error('vor hammer',e); }
  return base(h);
}; }
function vorHammer(h){
  if(AREA||!G||G.mode!=='story') return;
  const p=player, K=wReachK(), ix=p.x+Math.cos(p.facing)*34*K, iy=p.y+Math.sin(p.facing)*34*K, ch=h.ch||0, thunder=vorThunder()&&ch>=0.99;
  // the fight: obsidian crust plates
  if(vorBossOn()&&VOR.e.vp===3) vorHammerPlates(VOR.e,ix,iy,ch,thunder);
  if(G.stage!=='summit'&&!G.flags.a1_tier_3) return;
  // the boulders: a charged smash (half on Easy, full otherwise)
  const need=vdi()===0?0.45:0.99;
  if(VOR.bould){ let near=null, nd=1e9; for(const b of VOR.bould){ if(G.found[b.id]) continue; const d=dist(ix,iy,b.x,b.y); if(thunder&&d<200) vorBreakBoulder(b); else if(d<nd){ nd=d; near=b; } }
    // one boulder per smash (Old Thunder's quake ring breaks every one within 200 px)
    if(near&&!G.found[near.id]&&nd<34+40*K){ if(ch>=need) vorBreakBoulder(near); else if(!(VOR.nagT>G.time)){ VOR.nagT=G.time+2; ftext(near.x,near.y-52,simplify(VT.boulder),'#ffd9a0',13); } } }
  // the barricade (after the fight with the stragglers)
  if(G.flags.a1_strag==='fought'&&!G.flags.a1_carts&&VOR.strag&&VOR.strag.done&&dist(ix,iy,VCL.carts[1][0],VCL.carts[1][1])<90) vorCartsBreak();
}
function vorCartsBreak(){
  if(G.flags.a1_carts) return; G.flags.a1_carts=true; vorSyncCols();
  SFX.play('boom',0.7); shake(6);
  for(const [x,y] of VCL.carts) emit(x,y,16,{col:'140,90,50',glow:false,smin:50,smax:220,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:3});
  setBanner(S('The barricade breaks!','The carts break!'),S('The stairs are clear.','The stairs are clear.'),2); saveGame();
}

// ---------- the Oath stragglers at the Last Candle (Tier 1)
function vorStragStart(){
  const F=G.flags, P=VCL.strag;
  runDialogue(STORY.a1_stragglers,()=>{
    scene='play';
    if(F.a1_strag!=='home') F.a1_strag='fought';
    const S0=VOR.strag;
    if(F.a1_strag==='home'){ for(const e of S0.list){ e.passive=true; e.aggro=false; e.returning=false; e.homeX=7000; e.homeY=3000; e.goHome=true; } S0.done=true; S0.leaveT=0; setBanner(S('The Last Candle goes home','They go home'),S('The way up is clear.','The way is clear.'),2.6); }
    else{ for(const e of S0.list){ e.aggro=true; e.passive=false; e.returning=false; e.waiting=false; e.wt=0; } S0.fight=true; jingle('boss_intro',null); setBanner(S('The Last Candle','The Last Candle'),S('Sister Soot and the last of the Scaled Oath','The last of the Oath'),2.4); }
    saveGame();
  });
}
function vorStragSpawn(){
  const P=VCL.strag, S0=VOR.strag={list:[],t:0,fight:false,done:false,candle:true,lit:false,leaveT:0};
  const mk=(type,dx,dy,o)=>{ const e=makeEnemy(type,P.x+dx,P.y+dy,Object.assign({level:9,aggro:false,homeX:P.x+dx,homeY:P.y+dy,leash:700},o||{})); e.spawnIn=0; e.passive=true; e.a1strag=true; S0.list.push(e); return e; };
  S0.soot=mk('cultist',-10,-34,{elite:true}); S0.soot.name='Sister Soot';
  mk('cultist',40,-20); mk('cultist',30,30); mk('knight',-40,26);
}
function vorStragUpdate(dt){
  const F=G.flags, S0=VOR.strag, p=player;
  if(!S0){
    if(F.a1_strag==='fought'&&!F.a1_carts) VOR.strag={list:[],t:0,fight:true,done:true,candle:false,lit:true,leaveT:0};   // a reload after the fight
    else if(G.stage==='summit'&&!F.a1_strag&&dist(p.x,p.y,VCL.strag.x,VCL.strag.y)<900) vorStragSpawn();
    return; }
  S0.t+=dt;
  // sitting round the candle: they stay at their spots and do not notice Ash until the talk is over
  for(const e of S0.list){ if(e.dead) continue; if(!S0.fight&&!S0.done){ e.passive=true; e.aggro=false; e.returning=true; e.wt=99; e.waiting=true; e.face=angTo(e.x,e.y,VCL.candle.x,VCL.candle.y); } }
  if(!F.a1_strag&&scene==='play'&&!p.dead&&elevLvl(p.x,p.y)===1&&dist(p.x,p.y,VCL.strag.x,VCL.strag.y)<250){ vorStragStart(); return; }
  if(F.a1_strag==='home'){
    S0.leaveT+=dt; F.a1_carts=true;
    for(const e of S0.list){ if(e.dead) continue; e.aggro=false; e.returning=true; e.homeX=6900; e.homeY=2560; if(S0.leaveT>6||dist(e.x,e.y,6900,2560)<80){ e.dead=true; emit(e.x,e.y,10,{col:'170,140,200',glow:false,smin:30,smax:90,lmin:.3,lmax:.6,zmin:2,zmax:4}); } }
    if(S0.list.every(e=>e.dead)) VOR.strag=null;
    return;
  }
  if(!S0.fight) return;
  const alive=S0.list.filter(e=>!e.dead);
  // at half health Sister Soot lights the black candle: two more come out of the smoke
  if(!S0.lit&&S0.soot&&!S0.soot.dead&&S0.soot.hp<S0.soot.maxHp*0.5){ S0.lit=true; taunt('a1_soot',STORY.a1_strag_candle[0][1]); SFX.play('warn');
    for(let i=0;i<2;i++){ const s={x:VCL.candle.x+rand(-60,60),y:VCL.candle.y+rand(-30,30)}; spawnRune('cultist',s.x,s.y,{level:9,aggro:true,homeX:s.x,homeY:s.y,leash:700,onSpawn:null}); }
    later(1.0,()=>{ for(const e of G.enemies) if(!e.dead&&e.type==='cultist'&&!e.a1strag&&dist(e.x,e.y,VCL.candle.x,VCL.candle.y)<200){ e.a1strag=true; S0.list.push(e); } }); }
  // snuff the candle (hit it with anything) and the rest give up
  if(S0.candle&&S0.lit&&vorPokedAt(VCL.candle.x,VCL.candle.y-6,20)){ S0.candle=false; SFX.play('pop'); emit(VCL.candle.x,VCL.candle.y-12,14,{col:'60,40,70',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:70,lmin:.6,lmax:1.2,zmin:3,zmax:6,grow:8});
    runDialogue(STORY.a1_strag_snuff,()=>{ scene='play'; for(const e of S0.list) if(!e.dead){ e.passive=true; e.aggro=false; e.goHome=true; } S0.giveUp=true; S0.leaveT=0; }); return; }
  if(S0.giveUp){ S0.leaveT+=dt; for(const e of S0.list){ if(e.dead) continue; e.aggro=false; e.returning=true; e.homeX=6900; e.homeY=2560; if(S0.leaveT>5){ e.dead=true; emit(e.x,e.y,10,{col:'170,140,200',glow:false,smin:30,smax:90,lmin:.3,lmax:.6,zmin:2,zmax:4}); } } }
  if(!S0.done&&(alive.length===0||S0.giveUp&&S0.leaveT>5)){ S0.done=true; setBanner(S('The Last Candle is out','The candle is out'),vdi()===0||!(G.weapons&&G.weapons.hammer)?S('Hit the carts to clear the stairs.','Hit the carts!'):S('Smash the barricade with your hammer.','Smash the carts with the hammer!'),3); saveGame(); }
  // after the fight: the barricade breaks to the hammer (any hit on Easy, or if Ash has no hammer)
  if(S0.done&&!F.a1_carts&&(vdi()===0||!(G.weapons&&G.weapons.hammer))&&vorPokedAt(VCL.carts[1][0],VCL.carts[1][1],70)) vorCartsBreak();
}
// did Ash hit this spot just now: a swing, an arrow, the Wing-rang, fire breath or a roar
function vorPokedAt(x,y,r){
  const p=player;
  if(p.swingT>0&&dist(p.x,p.y,x,y)<r+56&&Math.abs(angDiff(p.facing,angTo(p.x,p.y,x,y)))<1.3) return true;
  if(G.wproj) for(const a of G.wproj) if(!a.dead&&dist2(a.x,a.y,x,y)<(r+8)**2) return true;
  if(inBreath(x,y,r)) return true;
  for(const R of G.rings) if(R.owner==='player'&&Math.abs(dist(R.x,R.y,x,y)-R.rad)<30) return true;
  return false;
}

// ---------- Cindervane's last walk (Tier 0): beside Ash from the gate to the grand stairs, then on ahead
function vorCinderUpdate(dt){
  const F=G.flags, p=player;
  if(!VOR.cw){ if(G.stage==='summit'&&G.choices.cinder==='ally'&&!F.a1_cwalk&&F.a1_tier_0) VOR.cw={x:VCL.cinderAt.x,y:VCL.cinderAt.y,face:-Math.PI/2,t:0,cd:9,dx:0,dy:0,mode:'walk',a:0}; return; }
  const C=VOR.cw; C.t+=dt; C.a=Math.min(1,C.a+dt*2);
  if(C.mode==='walk'||C.mode==='wait'){
    const d=dist(C.x,C.y,p.x,p.y), tx=p.x+48, ty=p.y+10;
    C.mode=d>330?'wait':'walk';
    if(C.mode==='walk'&&dist(C.x,C.y,tx,ty)>24){ const a=angTo(C.x,C.y,tx,ty), sp=Math.min(150,dist(C.x,C.y,tx,ty)*2); C.dx=Math.cos(a)*sp; C.dy=Math.sin(a)*sp; C.x+=C.dx*dt; C.y+=C.dy*dt; C.face=turnTo(C.face,a,6*dt); }
    else{ C.dx=C.dy=0; C.face=turnTo(C.face,angTo(C.x,C.y,p.x,p.y),3*dt); }
    if(scene==='play'&&p.y<VCL.stairsFoot.y+20&&dist(p.x,p.y,VCL.stairsFoot.x,VCL.stairsFoot.y)<160&&d<260){ C.mode='talk'; C.dx=C.dy=0;
      runDialogue(STORY.a1_cinder_walk,()=>{ scene='play'; F.a1_cwalk=true; C.mode='go'; C.t=0; saveGame(); }); }
  }else if(C.mode==='go'){
    const tx=7000, ty=2600, a=angTo(C.x,C.y,tx,ty); C.dx=Math.cos(a)*110; C.dy=Math.sin(a)*110; C.x+=C.dx*dt; C.y+=C.dy*dt; C.face=turnTo(C.face,a,5*dt);
    if(C.t>1.4) C.a=Math.max(0,1-(C.t-1.4)/1.4); if(C.a<=0) VOR.cw=null;
  }
}

// ---------- the climb, every frame on the mountain (stage summit)
function vorClimb(dt){
  const p=player, F=G.flags;
  vorSyncCols();
  if(G.mode!=='story'||AREA||!p||p.dead) return;
  if(p.y>3300||p.x<5300||p.x>8700||p.y<-200) return;   // the mountain, and the gate yard below it (the helmet)
  const sum=G.stage==='summit';
  vorRestTick(dt);
  if(!sum) return;
  const lv=elevLvl(p.x,p.y), fore=lv===0&&p.y<3000&&p.y>2700&&Math.abs(p.x-7000)<900;
  const tier=fore?0:(lv>0?VLV_TIER[lv]:null);
  if(tier!=null&&!F['a1_tier_'+tier]&&!p.flying&&!p.hop){ F['a1_tier_'+tier]=true; vorTierEnter(tier); }
  if(!VOR.beats) return;
  vorCinderUpdate(dt);
  vorStragUpdate(dt);
  if(scene!=='play') return;
  // the helmet on the gate steps (if Cindervane rests): the stock 'helm' landmark is the helmet with the flowers
  const HL=G.choices.cinder==='rest'&&!F.a1_helm?(LANDMARKS.find(o=>o.id==='helm')||VCL.helm):null;
  if(HL&&dist(p.x,p.y,HL.x,HL.y)<120){ F.a1_helm=true; runDialogue(STORY.a1_cinder_helm,()=>{ scene='play'; }); return; }
  // Tier 2: a single jump bonks off the Double Jump step
  if(lv===2&&!F.a1_step_nodj&&!hasDbl()&&p.x>VCL.step.x0-10&&p.x<VCL.step.x1+10&&p.y<VCL.step.y+36&&p.z>6){ F.a1_step_nodj=true; later(0.5,()=>{ if(scene==='play') runDialogue(STORY.a1_step_nodj,()=>{ scene='play'; questUpdated(); }); }); }
  // Iska at her lantern (Tier 2), the first time Ash comes near
  if(lv===2&&!F.a1_iska&&dist(p.x,p.y,VCL.iska.x,VCL.iska.y)<170){ F.a1_iska=true; G.spirit={id:'hollow',x:VCL.iska.x+40,y:VCL.iska.y-26,t:0,on:true};
    later(0.7,()=>runDialogue(STORY.a1_iska_climb,()=>{ scene='play'; if(G.spirit) G.spirit.on=false; if((G.items.a1_lantern||0)>0) setBanner(S(`Light Mom's lantern here`,`Light Mom's lantern here`),S('Press the use key, or breathe fire on it.','Use it or breathe fire on it.'),2.8); saveGame(); })); return; }
  // Bram at his anvil (Tier 3)
  if(lv===3&&!F.a1_bram_met&&dist(p.x,p.y,VCL.bram.x,VCL.bram.y)<230){ F.a1_bram_met=true; G.spirit={id:'ash',x:VCL.bram.x,y:VCL.bram.y-20,t:0,on:true};
    const gift=!(G.weapons&&G.weapons.hammer);
    later(0.7,()=>runDialogue(STORY.a1_bram_climb,()=>{ scene='play'; if(G.spirit) G.spirit.on=false; if(gift&&typeof giveWeapon==='function') giveWeapon('hammer'); saveGame(); })); return; }
  // Pip rides the first vent up (Tier 4)
  if(G.pip&&!F.a1_pip_vent&&p.flying&&(lv===4||lv===6)&&elvVentAt(p.x,p.y)){ F.a1_pip_vent=true; bubble(G.pip,simplify(VT.pipVent),{who:'Pip',col:SPK.pip.col}); VOR.pipLoop=1.6; }
  if(VOR.pipLoop>0&&G.pip){ VOR.pipLoop-=dt; const k=1-VOR.pipLoop/1.6, a=k*TAU*1.2; G.pip.x=p.x+Math.cos(a)*40; G.pip.y=p.y-30-k*20+Math.sin(a)*24; if(Math.random()<0.5) emit(G.pip.x,G.pip.y,1,{col:'255,200,120',smin:10,smax:40,lmin:.3,lmax:.5,zmin:1.2,zmax:2.2}); }
}
// Ember at the rim: the first time Ash is over the crater floor (before the stock trigger can start the fight)
function vorRimCheck(){
  const p=player, F=G.flags;
  if(F.a1_rim||!VOR.beats||G.mode!=='story'||G.stage!=='summit'||AREA||!p||p.dead||scene!=='play'||G.fightSite) return false;
  const lv=elevLvl(p.x,p.y); if(!(lv===7||(p.flying&&vorEll(p.x,p.y)<VARENA.rx+60))||p.y<VC.y-250) return false;
  F.a1_rim=true; G.spirit={id:'ember',x:p.x+50,y:p.y-60,t:0,on:true};
  runDialogue(STORY.a1_rim,()=>{ scene='play'; if(G.spirit) G.spirit.on=false; saveGame(); });
  return true;
}
{ const base=updateStory; updateStory=function(dt){ try{ if(vorRimCheck()) return; }catch(e){ console.error(e); } return base(dt); }; }
// the climb's objective: the summit target moves to the next way up from wherever Ash stands (the compass and the map follow)
function vorWayUp(){
  const p=player, lv=elevLvl(p.x,p.y), F=G.flags;
  if(p.y>3050||p.x<5300||p.x>8700) return null;
  if(lv===0) return p.y>2700?{t:S('Climb Cinder Mountain: take the grand stairs','Climb the big stairs'),x:7000,y:2700}:null;
  if(lv===1) return F.a1_strag&&!F.a1_carts&&F.a1_strag!=='home'?{t:S('Break the Oath barricade at the stairs','Break the carts at the stairs'),x:6010,y:2530}:{t:S('Climb Cinder Mountain: the stairs at the west end','Go to the stairs in the west'),x:6000,y:2470};
  if(lv===2) return hasDbl()?{t:S('Double Jump up the low step at the east end','Double Jump up the low step'),x:7945,y:2300}:{t:S('Learn to jump twice. Farmer Hollis has a very strange goat.','Learn to jump twice. Ask Farmer Hollis.'),x:7945,y:2300};
  if(lv===3) return F.a1_bgate?{t:S(`Climb Bram's stairs to the Vent Fields`,`Climb Bram's stairs`),x:7830,y:2000}:{t:S(`Smash through the black rocks to the ladder in the west, or open Bram's Hammer Gate`,`Smash the black rocks. Go to the ladder.`),x:6110,y:2010};
  if(lv===4) return {t:S('Jump into the hot air vent and fly up','Jump in the vent and fly up'),x:7768,y:1906};
  if(lv===5||lv===6) return {t:S('Ride the last vent up into the crater','Ride the last vent up'),x:7000,y:1612};
  return null;
}
{ const base=objectiveList; objectiveList=function(){
  const out=base();
  try{ if(G.mode==='story'&&G.stage==='summit'&&!AREA){
    for(const o of out){ if(o.site!=='summit') continue; const w=vorWayUp(); if(w){ o.text=w.t; o.x=w.x; o.y=w.y; } }
    if(!G.quests.a1_lanterns&&player.y>3100&&qAvail('a1_lanterns')){ const m=npcOf('maren'); if(m) out.push({text:S('Go home first: Mom is waiting at the forge with something for the climb','See Mom at the forge before you climb'),x:m.x,y:m.y,npc:'maren'}); }
  } }catch(e){ console.error(e); }
  return out; }; }
function vorTierEnter(t){
  const p=player;
  if(t===0&&G.pip){ bubble(G.pip,simplify(VT.pipSneeze),{who:'Pip',col:SPK.pip.col}); emit(G.pip.x,G.pip.y-6,14,{col:'40,34,34',glow:false,smin:20,smax:70,lmin:.6,lmax:1.1,zmin:3,zmax:6,grow:8}); }
  if(t===5&&G.pip){ bubble(G.pip,simplify(VT.pipHide),{who:'Pip',col:SPK.pip.col}); }
  saveGame();
}
// a lit Lantern Rest heals Ash when he walks up to it; an unlit one lights with fire breath if he carries Mom's lantern
function vorRestTick(dt){
  const p=player;
  for(const R of VRESTS){
    const d=dist(p.x,p.y,R.x,R.y);
    if(d>260) continue;
    if(vorRestLit(R)){ if(d<64&&(p.hp<p.maxHp||p.potions<p.potionsMax)&&!G.inCombat&&!(G.boss&&!G.boss.dead)&&!(R.healT>G.time)){ R.healT=G.time+3; p.hp=p.maxHp; p.potions=p.potionsMax; G.lastShrine=R.id; SFX.play('shrine'); emit(p.x,p.y-10,16,{col:'140,255,150',ang:-Math.PI/2,spread:1,smin:30,smax:100,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:20}); ftext(p.x,p.y-40,S('Healed!','Healed!'),'#a8ffb0',14); } }
    else if((G.items.a1_lantern||0)>0&&inBreath(R.x,R.y-14,14)&&scene==='play') vorRestLight(R);
  }
}
{ const base=simUpdate; simUpdate=function(dt){ base(dt); try{ vorClimb(dt); vorFightTick(dt); }catch(e){ console.error('vor',e); } }; }

// ================================================================================================================
// ================= the fight in the crater (bible 8)
// ================================================================================================================
// the arena: obsidian spikes rise out of the boiling moat. The fight starts on the floor (e4: level 7). Flight only in
// phase 2. Damage: literal ed(N) at Vorlaxis's lv 10 (BAL_BOSS), difficulty does the rest (DIFFS.dmg).
const VPERCH_Z=100, VSCALES=[{k:'chest',bx:40,by:0,bz:60},{k:'wingL',bx:-4,by:-74,bz:82},{k:'wingR',bx:-4,by:74,bz:82},{k:'back',bx:-34,by:0,bz:70}];
const VPLATES=[{k:'chest',bx:44,by:0,bz:50},{k:'back',bx:-14,by:0,bz:72},{k:'tail',bx:-104,by:6,bz:28},{k:'arm',bx:30,by:44,bz:30}];
const VPOSE={sky:'flying',skyBreathW:'landW',skyBreath:'landW',meteorW:'landW',diveW:'landW',dive:'takeoff',skim:'takeoff',climb:'takeoff',galeW:'landW',gale:'landW',skySumW:'landW',flinch:'landW',fall:'landW',rise:'takeoff',plunge:'takeoff',
  crustForm:'roarShift',riverW:'summonW',fistW:'stompW',stuck:'recover',pullW:'breathW',pull:'breathW',rainW:'summonW',tideW:'summonW',sink:'walk',sleep:'walk'};
function vorStMax(e,s){ e.st=e.stMax=s; }
function vorTele(s){ return (s+vk('tele'))*((G.diff&&G.diff.wind)||1); }
function vorRec(e,t){ toRecover(e,t*vk('rec')); }
function vorAnyExposed(e){ return !!(e.plates&&e.plates.some(q=>q.open>0)); }

// ---------- fight zones (e8 FZK): drawn on the ground, cleared when the fight ends
// the boiling moat round the arena (it glows white before a magma tide)
FZK.vmoat={
  tick(z,dt){ const w=VOR.tideWarn>0?1:0; z.hot=(z.hot||0)+(w-(z.hot||0))*Math.min(1,dt*6);
    if(inView(VC.x,VC.y,700)&&Math.random()<dt*(14+30*z.hot)){ const a=rand(0,TAU), r=rand(VARENA.rx-40,VARENA.rx+40); emit(VC.x+Math.cos(a)*r,VC.y+Math.sin(a)*r*0.952,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:70+90*z.hot,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:6,drag:1}); } },
  drawG(z){ const t=G.time, h=z.hot||0, R0=VARENA.rx-48, R1=VARENA.rx+46;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(VC.x,VC.y,R1,R1*0.952,0,0,TAU); ctx.ellipse(VC.x,VC.y,R0,R0*0.952,0,0,TAU,true);
    ctx.fillStyle=h>0.05?`rgb(${240+15*h|0},${100+130*h|0},${40+140*h|0})`:'#e8601e'; ctx.fill('evenodd');
    ctx.lineCap='round';
    for(let i=0;i<14;i++){ const dir=i%2?1:-1, a=i/14*TAU+t*0.12*dir, r=R0+14+((i*37)%5)*14; ctx.strokeStyle=h>0.3?'rgba(255,255,230,.9)':'rgba(255,200,90,.85)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(VC.x,VC.y,r,r*0.952,0,a,a+0.35); ctx.stroke(); }
    if(h>0.05) for(let i=0;i<18;i++){ const ph=(t*1.6+i*0.37)%1, a=i*2.39, r=R0+10+((i*53)%7)*10, x=VC.x+Math.cos(a)*r, y=VC.y+Math.sin(a)*r*0.952; ctx.strokeStyle=`rgba(255,250,220,${h*(1-ph)})`; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(x,y,3+ph*9,0,TAU); ctx.stroke(); }
    ctx.lineWidth=4; ctx.strokeStyle='#3a1610'; ctx.beginPath(); ctx.ellipse(VC.x,VC.y,R0,R0*0.952,0,0,TAU); ctx.stroke();
    ctx.lineWidth=2; ctx.strokeStyle='rgba(255,220,140,.7)'; ctx.beginPath(); ctx.ellipse(VC.x,VC.y,R0+3,(R0+3)*0.952,0,0,TAU); ctx.stroke();
    ctx.restore(); }
};
// a magma tide: a ring of lava that rolls in from the moat to the middle. Jump it (rolling does not help: it is lava)
FZK.vtide={
  tick(z,dt){ if(z.delay>0){ z.delay-=dt; return; } z.rad-=z.spd*dt; if(z.rad<40){ z.done=true; return; }
    const p=player; if(z.hit||p.dead||airborne()) return;
    const d=vorEll(p.x,p.y); if(Math.abs(d-z.rad)<z.thick/2+p.r*0.6){ if(p.dashT>0) p.iframes=0; const sx=VC.x+(p.x-VC.x)*1.3, sy=VC.y+(p.y-VC.y)*1.3; HURT_SRC='lava'; if(hurtPlayer(z.dmg,sx,sy,220)) z.hit=true; HURT_SRC=''; } },
  drawG(z){ if(z.delay>0||!inView(VC.x,VC.y,z.rad+80)) return; const r=z.rad, t=G.time;
    ctx.save(); ctx.lineCap='round';
    ctx.strokeStyle='rgba(120,30,10,.55)'; ctx.lineWidth=z.thick+10; ctx.beginPath(); ctx.ellipse(VC.x,VC.y+5,r,r*0.952,0,0,TAU); ctx.stroke();
    ctx.strokeStyle='#f0601e'; ctx.lineWidth=z.thick; ctx.beginPath(); ctx.ellipse(VC.x,VC.y,r,r*0.952,0,0,TAU); ctx.stroke();
    ctx.strokeStyle='#ffd27a'; ctx.lineWidth=z.thick*0.32; ctx.beginPath(); ctx.ellipse(VC.x,VC.y-2,r-z.thick*0.18,(r-z.thick*0.18)*0.952,0,0,TAU); ctx.stroke();
    ctx.setLineDash([10,14]); ctx.lineDashOffset=-t*60; ctx.strokeStyle='rgba(255,255,235,.85)'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(VC.x,VC.y-3,r-z.thick*0.3,(r-z.thick*0.3)*0.952,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore(); }
};
// a lava river: a glowing crack runs across the floor (the warning), then it splits and lava pours out of it
FZK.vriver={
  tick(z,dt){ if(z.t<z.warn) return; if(z.t>z.warn+z.dur){ z.done=true; return; }
    if(!z.shook){ z.shook=true; shake(7); SFX.play('boom',0.6); }
    if(Math.random()<dt*20){ const u=Math.random(); emit(lerp(z.ax,z.bx,u),lerp(z.ay,z.by,u),1,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:30,smax:110,lmin:.3,lmax:.7,zmin:2,zmax:5,grow:6,drag:1}); }
    const p=player; z.cd=(z.cd||0)-dt; if(p.dead||airborne()||z.cd>0) return;
    if(segD(p.x,p.y,z.ax,z.ay,z.bx,z.by)<z.w/2+p.r*0.55){ if(p.dashT>0) p.iframes=0; const a=Math.atan2(z.by-z.ay,z.bx-z.ax)+Math.PI/2, s=((p.x-z.ax)*Math.cos(a)+(p.y-z.ay)*Math.sin(a))>=0?1:-1; HURT_SRC='lava'; if(hurtPlayer(z.dmg,p.x-Math.cos(a)*s*30,p.y-Math.sin(a)*s*30,260)) z.cd=0.6; HURT_SRC=''; } },
  drawG(z){ const t=G.time; ctx.save(); ctx.lineCap='round';
    if(z.t<z.warn){ const k=clamp(z.t/(z.warn*0.6),0,1), ex=lerp(z.ax,z.bx,k), ey=lerp(z.ay,z.by,k), fl=0.6+0.4*Math.sin(t*20);
      ctx.strokeStyle='rgba(30,10,6,.8)'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(z.ax,z.ay); ctx.lineTo(ex,ey); ctx.stroke();
      ctx.strokeStyle=`rgba(255,${150+90*fl|0},80,.95)`; ctx.lineWidth=2.6+2*(z.t/z.warn); ctx.beginPath(); ctx.moveTo(z.ax,z.ay); ctx.lineTo(ex,ey); ctx.stroke();
      ctx.strokeStyle=`rgba(255,90,40,${0.18+0.2*(z.t/z.warn)})`; ctx.lineWidth=z.w; ctx.beginPath(); ctx.moveTo(z.ax,z.ay); ctx.lineTo(z.bx,z.by); ctx.stroke(); }
    else{ const k=clamp((z.t-z.warn)/0.2,0,1)*clamp((z.warn+z.dur-z.t)/0.35,0,1);
      ctx.strokeStyle=`rgba(60,14,6,${0.8*k})`; ctx.lineWidth=z.w+8; ctx.beginPath(); ctx.moveTo(z.ax,z.ay); ctx.lineTo(z.bx,z.by); ctx.stroke();
      ctx.strokeStyle=`rgba(240,96,30,${k})`; ctx.lineWidth=z.w; ctx.stroke();
      ctx.strokeStyle=`rgba(255,215,120,${k})`; ctx.lineWidth=z.w*0.35; ctx.stroke();
      ctx.setLineDash([8,12]); ctx.lineDashOffset=-t*80; ctx.strokeStyle=`rgba(255,250,220,${0.8*k})`; ctx.lineWidth=2; ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore(); }
};
// phase 3: the floor split open when he dived into it (cracks that glow for the rest of the fight)
FZK.vcracks={
  drawG(z){ if(!z.L){ const rng=mulberry32(919); z.L=[]; for(let i=0;i<11;i++){ let a=i/11*TAU+rng()*0.3, r=20; const pts=[[VC.x,VC.y]]; while(r<VARENA.rx-60){ r+=40+rng()*50; a+=(rng()-0.5)*0.5; pts.push([VC.x+Math.cos(a)*r,VC.y+Math.sin(a)*r*0.95]); } z.L.push(pts); } }
    const t=G.time, k=clamp(z.t/0.6,0,1); ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
    for(const pts of z.L){ const n=Math.max(2,Math.ceil(pts.length*k));
      for(const [w,col] of [[9,'rgba(30,8,4,.85)'],[4,'rgba(240,96,30,.95)'],[1.6,`rgba(255,230,150,${0.7+0.3*Math.sin(t*3)})`]]){ ctx.strokeStyle=col; ctx.lineWidth=w; ctx.beginPath(); for(let i=0;i<n;i++) i?ctx.lineTo(pts[i][0],pts[i][1]):ctx.moveTo(pts[i][0],pts[i][1]); ctx.stroke(); } }
    ctx.restore(); }
};
// markers for things that land where Ash stands (the Magma Fist), the pull of the Mountain's Breath, the gale's wind
FZK.vmark={
  tick(z){ if(z.owner&&z.owner.dead) z.done=true; },
  drawG(z){ const k=clamp(z.t/z.life,0,1), t=G.time; ctx.save();
    if(z.kind==='fist'){ ctx.fillStyle=`rgba(255,140,40,${0.12+0.18*k})`; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r,z.r*0.8,0,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(255,170,60,${0.6+0.4*k})`; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle='rgba(255,180,80,.35)'; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r*k,z.r*0.8*k,0,0,TAU); ctx.fill(); }
    else if(z.kind==='pull'){ const e=z.owner; if(e){ for(let i=0;i<10;i++){ const a=i/10*TAU+t*1.6, r=120+((t*120+i*40)%220); const x=e.x+Math.cos(a)*r, y=e.y+Math.sin(a)*r*0.8, ang=angTo(x,y,e.x,e.y);
        ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.globalAlpha=0.75; ctx.fillStyle='#fff2c8'; ctx.strokeStyle='#5a2a10'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-6,-7); ctx.lineTo(-2,0); ctx.lineTo(-6,7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } } }
    ctx.restore(); }
};
// the four vents of the crater floor (phase 2): dormant, warning (gold sparks), open (a golden updraft)
FZK.vvents={
  tick(z,dt){ for(const v of VOR.vents){ if(!inView(v.x,v.y,140)) continue;
      if(v.open&&Math.random()<dt*26) emit(v.x+rand(-v.r,v.r)*0.5,v.y+rand(-v.r,v.r)*0.3,1,{col:'255,214,120',ang:-Math.PI/2,spread:0.2,smin:120,smax:260,lmin:.5,lmax:1.0,zmin:1.4,zmax:2.8,drag:0.3,rise:60});
      if(v.warn>0&&Math.random()<dt*30){ const a=rand(0,TAU); emit(v.x+Math.cos(a)*v.r*0.9,v.y+Math.sin(a)*v.r*0.55,1,{col:'255,226,140',ang:-Math.PI/2,spread:0.3,smin:40,smax:120,lmin:.4,lmax:.8,zmin:1.4,zmax:2.6,rise:40}); } } },
  drawG(z){ const t=G.time; ctx.save(); ctx.lineCap='round';
    for(const v of VOR.vents){ if(!inView(v.x,v.y,160)) continue; const R=v.r;
      if(v.open){ glowAt(v.x,v.y,R*1.4,'255,200,90',0.55);
        for(let k=0;k<5;k++){ const ph=(t*0.9+k/5)%1, y=v.y-ph*170, a=(1-ph)*0.7; ctx.strokeStyle=`rgba(255,${220-ph*60|0},${120-ph*60|0},${a})`; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(v.x+Math.sin(t*2+k)*6,y,R*(0.4+ph*0.5),R*(0.4+ph*0.5)*0.42,0,0,TAU); ctx.stroke(); }
        ctx.setLineDash([8,8]); ctx.lineDashOffset=-t*30; ctx.strokeStyle='rgba(255,236,160,.75)'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(v.x,v.y,R,R*0.6,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
      else if(v.warn>0){ const f=0.5+0.5*Math.sin(t*18); ctx.strokeStyle=`rgba(255,226,140,${0.5+0.4*f})`; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(v.x,v.y,R*(1.1-0.3*(1-v.warn)),R*0.6*(1.1-0.3*(1-v.warn)),0,0,TAU); ctx.stroke(); }
      else { ctx.strokeStyle='rgba(120,60,40,.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(v.x,v.y,R*0.7,R*0.42,0,0,TAU); ctx.stroke(); } }
    ctx.restore(); }
};
// a crater pillar: the column, see-through while Ash is behind it, and (phase 2) a glowing perch on the tall ones' tops
function vorDrawPillar(Q){
  const tall=Q.tall, R=tall?76:44, B=R-18, H=tall?VPIL.tallH:VPIL.stumpH, p=player, t=G.time;
  const behind=p&&!p.dead&&p.y<Q.y-4&&p.y>Q.y-H-20&&Math.abs(p.x-Q.x)<44&&!(VOR.perch===Q);
  ctx.save(); if(behind) ctx.globalAlpha*=0.5;
  drawSprite(vorPillarSpr(tall),Q.x,Q.y+VPIL.base-B,1);
  ctx.restore();
  if(tall&&vorSky()){ const on=VOR.perch===Q, f=0.5+0.5*Math.sin(t*3+Q.i), ty=Q.y+VPIL.base-H;
    glowAt(Q.x,ty-4,on?44:34,'255,214,120',on?0.6:0.3+0.25*f);
    ctx.save(); ctx.strokeStyle=`rgba(255,226,150,${on?0.95:0.5+0.4*f})`; ctx.lineWidth=2.6; ctx.beginPath(); ctx.ellipse(Q.x,ty,25,10.5,0,0,TAU); ctx.stroke();
    if(!on){ ctx.fillStyle=`rgba(255,236,170,${0.5+0.4*f})`; ctx.beginPath(); ctx.moveTo(Q.x,ty-22-4*f); ctx.lineTo(Q.x-7,ty-32-4*f); ctx.lineTo(Q.x+7,ty-32-4*f); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
}
function vorVentsInit(){ VOR.vents=vorVentSpots().map(([x,y,id],i)=>({i,id,x,y,r:72,lift:1,lvl:7,open:false,warn:0})); VOR.ventCur=-1; VOR.ventNext=null; VOR.ventT=0.2; }
vorVentsInit();
// the crater's vents count as updraft vents (e3_elev) while they are open
{ const base=elvVentAt; elvVentAt=function(x,y){ const v=base(x,y); if(v) return v; if(VOR.on&&VOR.vents.length) for(const V of VOR.vents) if(V.open&&dist2(x,y,V.x,V.y)<V.r*V.r) return V; return null; }; }
function vorVentsTick(dt){
  const e=VOR.e, on=vorSky()&&e.state!=='plunge'&&e.state!=='crustForm';
  for(const v of VOR.vents) if(v.warn>0) v.warn=Math.max(0,v.warn-dt);
  if(!on){ for(const v of VOR.vents){ v.open=false; v.warn=0; } VOR.ventCur=-1; VOR.ventNext=null; VOR.ventT=0.2; return; }
  const mode=vk('ventMode');
  if(mode==='all'){ for(const v of VOR.vents) if(!v.open){ v.open=true; vorVentPop(v); } return; }
  VOR.ventT-=dt;
  if(VOR.ventT<=1&&VOR.ventNext==null){ let n=VOR.ventCur<0?0:(VOR.ventCur+1)%4; if(mode==='rand'){ const opts=[0,1,2,3].filter(i=>i!==VOR.ventCur); n=pick(opts); } VOR.ventNext=n; VOR.vents[n].warn=1; try{ mvSnd('hiss'); }catch(err){} }
  if(VOR.ventT<=0){ if(VOR.ventCur>=0) VOR.vents[VOR.ventCur].open=false; VOR.ventCur=VOR.ventNext==null?0:VOR.ventNext; VOR.ventNext=null; const v=VOR.vents[VOR.ventCur]; v.open=true; vorVentPop(v); VOR.ventT=vk('ventT'); }
}
function vorVentPop(v){ try{ mvSnd('gust'); }catch(e){} emit(v.x,v.y,22,{col:'255,214,120',ang:-Math.PI/2,spread:0.5,smin:120,smax:320,lmin:.5,lmax:1,zmin:1.5,zmax:3,rise:40}); }

// ---------- Vorlaxis, rebuilt (the 3D figure of a10g stays; new states are drawn with its poses, see VPOSE)
defineFoe('vorlaxis',{
  init(e){ vorInit(e); },
  ai:(e,dt,p)=>vorAI(e,dt,p),
  onHurt:(e,amt,o)=>vorOnHurt(e,amt,o)
});
function vorInit(e){
  Object.assign(e,{vp:1,phase:1,state:'walk',cd:1.8,st:0,stMax:1,alt:0,scale:1,alpha:1,noClip:false,staggered:false,invuln:false,
    orb:Math.PI/2,odir:1,scales:[],plates:[],tideCd:6,sumCd:9,pullCd:4,lastBreath:0,skyT:0,crashN:0,chest:0,hitP:false,vend:false});
  VOR.e=e; VOR.on=true; VOR.perch=null; VOR.fist=null; VOR.tideWarn=0;
  const ck0=G.flags.a1_vor_ck|0, ck=ck0>=vk('ck')?ck0:0;   // only the checkpoints this difficulty has
  // a checkpoint: he starts in that phase (set now, so nothing reads him as phase 1; the phase begins on his first tick)
  if(ck>=2){ e.hp=e.maxHp*(ck===2?0.655:0.325); e.vp=e.phase=ck; e.ckPend=ck; e.state='ckWait'; if(ck===2){ e.alt=VSKY; e.noClip=true; } }
  else{ vorTip('p1',VT.p1[0],VT.p1[1]); later(0.6,()=>setBanner(VT.p1[0],'',2)); }
}
function vorOnHurt(e,amt,o){
  if(e!==VOR.e) return;
  if(e.vend) return false;
  const m=o.mult||1; let k=1;
  if(e.vp===2){ if(VOR.allow) k=1; else if(e.state==='stagger') k=2; else if(e.state==='skim') k=1; else return false; }
  else if(e.vp===3){ if(m>=1.9) k=1; else if(VOR.ally&&vorAnyExposed(e)) k=1; else { vorClink(e,o); return false; } }
  amt*=k;
  // a phase change waits for a safe moment, and the finish is a scene: the health stops at each mark until then
  const floor=e.vp===1?0.62:e.vp===2?0.3:0.05, left=(e.hp-e.maxHp*floor)/m;
  if(amt>left){ amt=Math.max(0,left); if(amt<0.5) return false; }
  return amt;
}
function vorClink(e,o){
  if(o&&o.src==='burn') return;
  if(VOR.clinkT>G.time) return; VOR.clinkT=G.time+0.35;
  try{ wsnd('clink'); }catch(err){} SFX.play('block',0.6);
  const x=o&&o.fx!=null?o.fx:player.x, y=o&&o.fy!=null?o.fy:player.y, a=angTo(e.x,e.y,x,y), hx=e.x+Math.cos(a)*e.r*0.8, hy=e.y+Math.sin(a)*e.r*0.8;
  emit(hx,hy,8,{col:'200,190,255',smin:80,smax:220,lmin:.1,lmax:.3,zmin:1,zmax:2.2,drag:5});
  if(!(VOR.clinkTxt>G.time)){ VOR.clinkTxt=G.time+1.6; ftext(hx,hy-30,'CLINK!','#d8d0ff',15); }
  vorTip('clink',S('Black glass','Black glass'),VT.clink,7);
}
// ---------- the brain
function vorAI(e,dt,p){
  const d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.tideCd-=dt; e.sumCd-=dt; e.pullCd-=dt;
  if(e.tailFx>0) e.tailFx=Math.max(0,e.tailFx-dt*2.5);
  e.mouthGlow=Math.max(0,e.mouthGlow-dt*2); e.chest=Math.max(0,e.chest-dt*2);
  const relT=e.state==='breath'?0:clamp(angDiff(e.face,a),-0.75,0.75);
  e.headRel=lerp(e.headRel||0,relT,1-Math.exp(-dt*5));
  e.dx=0; e.dy=0;
  if(e.vend){ vorSinkTick(e,dt); updateHeadPos(e); return; }
  if(e.ckPend){ const ck=e.ckPend; e.ckPend=0; if(ck===2) vorSkyBegin(e,true); else vorCrustBegin(e,true); setBanner(VT.ck[0],VT.ck[1],2.4); updateHeadPos(e); return; }
  // shared transitions
  if(e.state==='roarShift'){ e.st-=dt; e.mouthGlow=1; e.invuln=true; if(e.st<=0){ e.state='takeoff'; vorStMax(e,1.2); taunt('vor',pick(VOR_TAUNT.sky)); try{ mvSnd('takeoff'); }catch(err){} } updateHeadPos(e); return; }
  if(e.state==='takeoff'&&e.vp===1){ e.st-=dt; const k=clamp(1-e.st/e.stMax,0,1); e.alt=k*VSKY; e.noClip=true; e.invuln=true; if(e.st<=0) vorSkyBegin(e,false); updateHeadPos(e); return; }
  if(e.vp===1) vorP1(e,dt,p,d,a); else if(e.vp===2) vorP2(e,dt,p,d,a); else vorP3(e,dt,p,d,a);
  updateHeadPos(e);
}
// ----- phase 1: The Waking (jump)
function vorP1(e,dt,p,d,a){
  const f=e.hp/e.maxHp;
  if(f<0.66&&(e.state==='walk'||e.state==='recover'||e.state==='stagger')){ vorShift12(e); return; }
  switch(e.state){
    case 'walk': e.face=turnTo(e.face,a,1.05*dt); if(d>250) steer(e,p.x,p.y,e.speed); if(e.cd<=0) vorChoose1(e,d,a); break;
    case 'tailW': e.st-=dt;
      if(e.st<=0){ e.tailFx=1; shake(7); SFX.play('slash3'); if(d<205+p.r&&!airborne()) hurtPlayer(ed(18),e.x,e.y,460);
        emit(e.x,e.y,24,{col:'120,105,95',glow:false,smin:120,smax:320,lmin:.3,lmax:.6,zmin:4,zmax:8,grow:8});
        const P=vorPillars().find(q=>dist(q.x,q.y,e.x,e.y)<215+30);
        if(P){ e.state='stagger'; e.st=1.7; e.staggered=true; e.tele=null; shake(12); SFX.play('boom'); emit(P.x,P.y-40,20,{col:'150,130,120',glow:false,smin:60,smax:220,lmin:.4,lmax:.9,zmin:3,zmax:6,grow:5}); ftext(e.headX,e.headY-40,simplify(VT.stag),'#ffe066',16); }
        else vorRec(e,0.6); }
      break;
    case 'breathW': e.face=turnTo(e.face,a,1.5*dt); e.st-=dt; e.mouthGlow=1; if(e.st<=0){ e.state='breath'; e.tdur=e.st=1.8; e.sweep=Math.random()<0.5?-1:1; e.base=e.face; e.tick=0; e.poolT=0; e.tele=null; } break;
    case 'breath': vorBreathTick(e,dt,p,0.9); break;
    case 'stompW': e.st-=dt; if(e.st<=0) vorStomp(e,0.7); break;
    case 'fbW': e.face=turnTo(e.face,a,2*dt); e.st-=dt; e.mouthGlow=1; e.chest=1;
      if(e.st<=0){ updateHeadPos(e); const n=vk('fb'), ta=angTo(e.mouthX,e.mouthY,p.x,p.y); for(let i=0;i<n;i++) shoot(e.mouthX,e.mouthY,ta+(i-(n-1)/2)*0.22,310,11,ed(12),'fireball'); SFX.play('cast'); vorRec(e,0.5); }
      break;
    case 'tideW': e.st-=dt; e.mouthGlow=1; VOR.tideWarn=e.st;
      if(e.st<=0){ VOR.tideWarn=0; const n=vk('waves'), spd=vk('waveSpd'); for(let i=0;i<n;i++) fzAdd('vtide',{rad:VARENA.rx-40,spd,thick:30,delay:i*0.8,dmg:ed(14),life:9});
        SFX.play('boom'); shake(8); vorRec(e,1.0); }
      break;
    case 'stagger': e.st-=dt; e.headRel=lerp(e.headRel,0,0.1); if(e.st<=0){ e.staggered=false; e.state='walk'; e.cd=0.5; } break;
    case 'recover': e.face=turnTo(e.face,a,0.6*dt); e.st-=dt; if(e.st<=0){ e.state='walk'; e.cd=rand(0.4,1.0); } break;
    default: e.state='walk';
  }
}
function vorChoose1(e,d,a){
  const behind=Math.abs(angDiff(e.face,a))>1.25, o=[];
  if(d<215) o.push(['tail',behind?6:2.5]);
  if(d<430&&!behind) o.push(['breath',3]);
  o.push(['stomp',d<320?2:0.8]);
  o.push(['fb',d>240?3:1]);
  if(e.tideCd<=0) o.push(['tide',3.2]);
  const ch=vorPick(o);
  if(ch==='tail'){ e.state='tailW'; vorStMax(e,vorTele(0.65)); e.tele=newTele({shape:'donut',r1:e.r,r2:205,dur:e.st,col:'255,255,255'}); try{ wsnd('whoosh',0.6); }catch(err){} }
  else if(ch==='breath'){ e.state='breathW'; vorStMax(e,vorTele(0.95)); e.tele=newTele({shape:'cone',mouth:true,len:400,half:0.85,dur:e.st,col:'255,60,40'}); }
  else if(ch==='stomp'){ e.state='stompW'; vorStMax(e,vorTele(0.75)); e.tele=newTele({shape:'circle',r:e.r+40,dur:e.st,col:'255,150,40'}); }
  else if(ch==='fb'){ e.state='fbW'; vorStMax(e,vorTele(0.55)); }
  else if(ch==='tide'){ e.state='tideW'; vorStMax(e,vorTele(1.2)); e.tideCd=7.5; e.tele=null; try{ mvSnd('hiss'); }catch(err){} SFX.play('roar',0.7); }
}
function vorPick(o){ let tot=0; for(const x of o) tot+=x[1]; let r=Math.random()*tot, ch=o[0][0]; for(const [k,w] of o){ r-=w; if(r<=0){ ch=k; break; } } return ch; }
function vorStomp(e,rec){
  shake(11); SFX.play('boom');
  G.rings.push({x:e.x,y:e.y,rad:e.r,max:560,speed:330,thick:22,dmg:ed(15)});
  if(vk('stomp2')) G.rings.push({x:e.x,y:e.y,rad:e.r,max:560,speed:330,thick:22,dmg:ed(15),delay:0.45});
  emit(e.x,e.y,30,{col:'150,120,100',glow:false,smin:100,smax:300,lmin:.4,lmax:.8,zmin:5,zmax:10,grow:10});
  vorRec(e,rec);
}
// the fire breath on the floor: hide behind a pillar, or get behind him
function vorBreathTick(e,dt,p,rec){
  e.st-=dt; const pr=1-e.st/e.tdur; e.face=e.base+e.sweep*(-0.55+1.1*pr); e.mouthGlow=1;
  updateHeadPos(e); const ang=e.face+e.headRel;
  emit(e.mouthX,e.mouthY,6,{kind:'fire',ang,spread:0.2,smin:600,smax:720,lmin:.5,lmax:.72,zmin:6,zmax:10,grow:34,drag:0.5});
  e.tick-=dt;
  if(e.tick<=0){ e.tick=0.12;
    if(!p.flying&&inCone(e.mouthX,e.mouthY,ang,400,0.3,p.x,p.y,p.r)){ const P=vorCover(e.mouthX,e.mouthY,p.x,p.y); if(!P) hurtPlayer(ed(13),e.mouthX,e.mouthY,160); else if(!(P.saidT>G.time)){ P.saidT=G.time+2; ftext(p.x,p.y-40,S('Safe behind the pillar!','Safe!'),'#bfe8ff',13); } }
    if(Math.random()<0.5){ const L=rand(120,380); scorch(e.mouthX+Math.cos(ang)*L,e.mouthY+Math.sin(ang)*L,rand(20,36)); } }
  e.poolT-=dt; if(vk('pools')&&e.poolT<=0){ e.poolT=0.35; const L=rand(150,360), x=e.mouthX+Math.cos(ang)*L, y=e.mouthY+Math.sin(ang)*L; if(vorInFloor(x,y,60)&&!vorCover(e.mouthX,e.mouthY,x,y)) G.pools.push({x,y,r:26,life:3,max:3,owner:'enemy',dmg:ed(6),tick:0}); }
  if(e.st<=0) vorRec(e,rec);
}
// ----- 1 -> 2: he beats his wings, the vents crack open, and he lifts into the smoke
function vorShift12(e){
  e.state='roarShift'; e.st=1.6; e.invuln=true; e.tele=null; e.staggered=false;
  shake(14); flashA=0.25; flashCol='255,120,60'; SFX.play('roar');
  G.rings.push({x:e.x,y:e.y,rad:e.r,max:430,speed:540,thick:26,dmg:0,kb:520});
  taunt('vor',VOR_TAUNT.p2);
  for(const v of VOR.vents){ v.warn=1; emit(v.x,v.y,24,{col:'255,190,90',ang:-Math.PI/2,spread:0.8,smin:60,smax:240,lmin:.5,lmax:1,zmin:2,zmax:4,rise:30}); }
  later(0.9,()=>{ SFX.play('boom'); shake(10); });
}
function vorSkyBegin(e,resume){
  e.vp=2; e.phase=2; e.state='sky'; e.st=0; e.alt=VSKY; e.noClip=true; e.invuln=false; e.cd=resume?2.2:1.4; e.lastBreath=G.time-4;
  e.orb=angTo(VC.x,VC.y,e.x,e.y); e.odir=Math.random()<0.5?1:-1;
  vorScalesReset(e);
  if(!(G.flags.a1_vor_ck>=2)&&vk('ck')<=2) G.flags.a1_vor_ck=2;
  fzAdd('vvents',{life:1e9});
  VOR.ventT=0.2; VOR.ventCur=-1; VOR.ventNext=null;
  setBanner(VT.p2[0],'',2.6); vorTip('p2',VT.p2[0],VT.p2[1],11);
  later(4,()=>{ if(vorSky()) vorTip('perch',S('Perches','Perches'),VT.perchTip,8); });
  saveGame();
}
function vorScalesReset(e){ e.scales=VSCALES.slice(0,vk('scales')).map((s,i)=>Object.assign({i,open:0,hit:false},s)); }
// ----- phase 2: The Sky Above the Crater (wings, vents, bow or Wing-rang)
function vorP2(e,dt,p,d,a){
  const f=e.hp/e.maxHp;
  for(const s of e.scales) if(s.open>0) s.open=Math.max(0,s.open-dt);
  if(f<0.33&&(e.state==='sky'||e.state==='stagger'||e.state==='flinch')){ vorShift23(e); return; }
  e.skyT+=dt;
  switch(e.state){
    case 'sky': vorCircle(e,dt,1); if(e.cd<=0) vorChoose2(e,p,d,a); break;
    case 'skyBreathW': e.dx=e.dy=0; e.face=turnTo(e.face,a,1.6*dt); e.st-=dt; e.chest=Math.min(1,e.chest+dt*4); e.mouthGlow=Math.max(e.mouthGlow,0.5);
      if(e.st<=0){ for(const s of e.scales) if(!s.hit) s.open=0; e.state='skyBreath'; e.tdur=e.st=1.4; e.tick=0; e.poolT=0; e.base=angTo(e.x,e.y,p.x,p.y); }
      break;
    case 'skyBreath': vorSkyBreath(e,dt,p); break;
    case 'meteorW': e.dx=e.dy=0; e.st-=dt; e.mouthGlow=1; if(e.st<=0){ e.state='sky'; e.cd=1.0*vk('rec'); } break;
    case 'diveW': e.dx=e.dy=0; e.st-=dt; e.face=turnTo(e.face,e.diveA,4*dt); if(e.st<=0){ e.state='dive'; e.face=e.diveA; e.tele=null; e.diveD=0; e.hitP=false; SFX.play('roar'); } break;
    case 'dive': { const sp=880, step=sp*dt; e.diveD+=step; const k=clamp(e.diveD/(e.diveL*0.35),0,1); e.alt=lerp(VSKY,14,k);
      const nx=e.x+Math.cos(e.face)*step, ny=e.y+Math.sin(e.face)*step; if(vorInFloor(nx,ny,70)){ e.x=nx; e.y=ny; } else e.diveD=e.diveL;
      if(!e.hitP&&e.alt<60&&dist(e.x,e.y,p.x,p.y)<e.r+18){ HURT_SRC='air'; if(hurtPlayer(ed(20),e.x,e.y,420)) e.hitP=true; HURT_SRC=''; }
      if(Math.random()<0.6) emit(e.x,e.y,2,{col:'150,120,100',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:3,zmax:7,grow:6});
      if(e.diveD>=e.diveL){ e.state='skim'; vorStMax(e,1.0); shake(8); SFX.play('boom',0.7); vorTip('skim',S('Hit him now!','Hit him now!'),S('At the bottom of his dive he skims the floor. Your sword reaches him there!','When he dives low, hit him!'),6); }
      break; }
    case 'skim': e.st-=dt; e.alt=14; { const nx=e.x+Math.cos(e.face)*110*dt, ny=e.y+Math.sin(e.face)*110*dt; if(vorInFloor(nx,ny,70)){ e.x=nx; e.y=ny; } } e.noClip=false; if(e.st<=0){ e.state='climb'; vorStMax(e,0.9); e.noClip=true; } break;
    case 'climb': e.st-=dt; e.alt=lerp(VSKY,14,clamp(e.st/e.stMax,0,1)); e.noClip=true; if(e.st<=0){ e.state='sky'; e.cd=0.8*vk('rec'); e.orb=angTo(VC.x,VC.y,e.x,e.y); } break;
    case 'galeW': e.dx=e.dy=0; e.st-=dt; e.face=turnTo(e.face,a,2*dt); if(e.st<=0){ e.state='gale'; vorStMax(e,2.4); e.galeA=a+(Math.random()<0.5?1:-1)*Math.PI/2; try{ mvSnd('gust'); }catch(err){} } break;
    case 'gale': vorCircle(e,dt,0.4); e.st-=dt; vorGaleTick(e,dt,p); if(e.st<=0){ e.state='sky'; e.cd=0.9*vk('rec'); } break;
    case 'skySumW': e.dx=e.dy=0; e.st-=dt; e.mouthGlow=1;
      if(e.st<=0){ const n=vk('summon'); for(let i=0;i<n;i++){ const b=rand(0,TAU), s=vorClampIn(VC.x+Math.cos(b)*400,VC.y+Math.sin(b)*380,80); spawnRune('drakeling',s[0],s[1]); } e.state='sky'; e.cd=1.0; }
      break;
    case 'flinch': e.dx=e.dy=0; e.st-=dt; if(e.st<=0){ if(e.scales.every(s=>s.hit)) vorCrash(e); else { e.state='sky'; e.cd=0.8*vk('rec'); } } break;
    case 'fall': e.st-=dt; e.alt=Math.max(0,VSKY*clamp(e.st/e.stMax,0,1)); e.x+=(e.fx-e.x)*Math.min(1,dt*6); e.y+=(e.fy-e.y)*Math.min(1,dt*6);
      if(e.st<=0){ e.alt=0; e.noClip=false; e.state='stagger'; e.st=vk('crash'); e.stMax=e.st; shake(18); SFX.play('boom'); flashA=0.3; flashCol='255,200,140';
        G.rings.push({x:e.x,y:e.y,rad:e.r,max:280,speed:500,thick:20,dmg:0,kb:380});
        emit(e.x,e.y,50,{col:'140,120,110',glow:false,smin:80,smax:340,lmin:.5,lmax:1.1,zmin:4,zmax:10,grow:10,drag:2});
        ftext(e.x,e.y-90,simplify(VT.crash),'#ffe066',22); taunt('vor',pick(VOR_TAUNT.crash));
        vorTip('crash',S('He crashed!','He crashed!'),S('Hit him now! Every hit does double damage while he is down.','Hit him now! Double damage!'),6); }
      break;
    case 'stagger': e.st-=dt; if(e.st<=0){ e.state='rise'; vorStMax(e,1.0); e.invuln=true; e.noClip=true; } break;
    case 'rise': e.st-=dt; e.alt=VSKY*clamp(1-e.st/e.stMax,0,1); if(e.st<=0){ e.invuln=false; vorScalesReset(e); e.state='sky'; e.cd=1.4; e.orb=angTo(VC.x,VC.y,e.x,e.y); } break;
    case 'plunge': vorPlungeTick(e,dt); break;
    case 'crustForm': e.st-=dt; e.invuln=true; e.mouthGlow=1; if(Math.random()<dt*30){ const b=rand(0,TAU); emit(e.x+Math.cos(b)*e.r,e.y+Math.sin(b)*e.r*0.7,1,{kind:'fire',ang:-Math.PI/2,spread:0.4,smin:40,smax:140,lmin:.4,lmax:.9,zmin:3,zmax:6,grow:6}); }
      if(e.st<=0) vorCrustBegin(e,false); break;
    default: e.state='sky';
  }
}
// circling over the crater (lifted out of reach of claws and fire)
function vorCircle(e,dt,spdK){
  e.orb+=vk('orbit')*e.odir*dt*spdK; const Rx=270, Ry=250, tx=VC.x+Math.cos(e.orb)*Rx, ty=VC.y+Math.sin(e.orb)*Ry;
  const k=1-Math.exp(-dt*1.6); e.x+=(tx-e.x)*k; e.y+=(ty-e.y)*k; e.alt+=(VSKY-e.alt)*(1-Math.exp(-dt*3));
  e.face=turnTo(e.face,e.orb+e.odir*Math.PI/2,2.2*dt); e.noClip=true;
}
function vorChoose2(e,p,d,a){
  const f=e.hp/e.maxHp, o=[['breath',G.time-e.lastBreath>8?20:3.5],['meteor',2.5],['dive',2.2]];
  if(p.flying) o.push(['gale',1.4]);
  if(f<0.5&&e.sumCd<=0&&countType('drakeling')<3) o.push(['summon',2]);
  const ch=vorPick(o);
  if(ch==='breath'){ e.state='skyBreathW'; vorStMax(e,vk('scaleWin')+vk('tele')+0.15); e.lastBreath=G.time; for(const s of e.scales) if(!s.hit) s.open=e.st; SFX.play('roar',0.6); try{ mvSnd('hoop'); }catch(err){} }
  else if(ch==='meteor'){ e.state='meteorW'; vorStMax(e,0.9); SFX.play('roar',0.8); vorMeteors(e,p); }
  else if(ch==='dive'){ e.diveA=angTo(e.x,e.y,p.x,p.y); e.face=turnTo(e.face,e.diveA,1); const far=vorRayOut(e.x,e.y,e.diveA); e.diveL=Math.max(260,far-40); e.state='diveW'; vorStMax(e,vorTele(0.9)); e.tele=newTele({shape:'line',len:e.diveL,w:96,dur:e.st,col:'255,50,40'}); SFX.play('roar'); }
  else if(ch==='gale'){ e.state='galeW'; vorStMax(e,vorTele(0.8)); }
  else if(ch==='summon'){ e.state='skySumW'; vorStMax(e,0.9); e.sumCd=14; taunt('vor',pick(VOR_TAUNT.sum)); }
}
// how far a line from (x,y) at angle a runs before it leaves the floor
function vorRayOut(x,y,a){ for(let L=40;L<1200;L+=20){ if(!vorInFloor(x+Math.cos(a)*L,y+Math.sin(a)*L,70)) return L; } return 1200; }
function vorMeteors(e,p){
  const n=vk('meteors'), dly=vorTele(1.1);
  for(let i=0;i<n;i++){ let x,y; if(i<Math.ceil(n*0.4)){ x=p.x+rand(-70,70); y=p.y+rand(-60,60); } else { const b=rand(0,TAU), r=rand(60,440); x=VC.x+Math.cos(b)*r; y=VC.y+Math.sin(b)*r*0.95; }
    const q=vorClampIn(x,y,60); blast(q[0],q[1],52,dly+i*0.08,ed(16),{meteor:true,pool:!!vk('pools')}); }
}
// the sky breath: his chest swells (the scales open), then fire pours down at Ash. Hit a scale to stop it, or hide under a pillar
function vorSkyBreath(e,dt,p){
  e.st-=dt; e.mouthGlow=1; e.chest=1; updateHeadPos(e);
  const pr=1-e.st/e.tdur, ang=e.base+Math.sin(pr*Math.PI)*0.3, mx=e.mouthX, my=e.mouthY, z=e.alt*0.72;
  e.face=turnTo(e.face,e.base,2*dt);
  for(let i=0;i<4;i++){ const L=rand(40,420), b=ang+rand(-0.3,0.3), gx=mx+Math.cos(b)*L, gy=my+Math.sin(b)*L, sx=mx, sy=my-z, dd=Math.max(1,dist(sx,sy,gx,gy)), sp=rand(520,640);
    if(G.particles.length<900) G.particles.push({x:sx,y:sy,vx:(gx-sx)/dd*sp,vy:(gy-sy)/dd*sp,life:dd/sp,max:dd/sp,size:rand(4,7),grow:26,drag:0.2,kind:'fire',col:'255,190,90',glow:true,rise:0,al:1}); }
  e.tick-=dt;
  if(e.tick<=0){ e.tick=0.15;
    if(inCone(mx,my,ang,440,0.34,p.x,p.y,p.r)){ if(!vorUnder(p.x,p.y)||VOR.perch){ HURT_SRC='air'; hurtPlayer(ed(12),mx,my,140); HURT_SRC=''; } else if(!(VOR.underT>G.time)){ VOR.underT=G.time+2; ftext(p.x,p.y-40,S('Safe under the pillar!','Safe!'),'#bfe8ff',13); } }
    if(Math.random()<0.6){ const L=rand(100,400); scorch(mx+Math.cos(ang)*L,my+Math.sin(ang)*L,rand(20,34)); } }
  e.poolT-=dt; if(vk('pools')&&e.poolT<=0){ e.poolT=0.3; const L=rand(120,400), x=mx+Math.cos(ang)*L, y=my+Math.sin(ang)*L; if(vorInFloor(x,y,60)&&!vorUnder(x,y)) G.pools.push({x,y,r:28,life:2.6,max:2.6,owner:'enemy',dmg:ed(6),tick:0}); }
  if(e.st<=0){ e.state='sky'; e.cd=1.2*vk('rec'); }
}
function vorGaleTick(e,dt,p){
  const push=430*dt, gx=Math.cos(e.galeA), gy=Math.sin(e.galeA);
  if(Math.random()<0.8) emit(p.x-gx*300+rand(-260,260),p.y-gy*300+rand(-200,200),1,{col:'240,236,230',glow:false,ang:e.galeA,spread:0.05,smin:500,smax:700,lmin:.3,lmax:.5,zmin:1,zmax:1.8,drag:0.2,alpha:0.6});
  if(VOR.perch){ vorUnperch(e.galeA); ftext(p.x,p.y-p.z-40,S('The wind knocks you off!','Whoosh! Off you go!'),'#e8eef8',13); }
  if(p.flying&&!elvVentAt(p.x,p.y)){ p.avx+=gx*push*3; p.avy+=gy*push*3; }
}
// a scale hit: it cracks, the breath stops, he flinches; every scale cracked and he crashes into the floor
function vorScaleHit(e,i){
  const s=e.scales[i]; if(!s||s.hit||s.open<=0||e.dead||e.vend) return;
  s.hit=true; s.open=0;
  const f=vorFoot(e,s.bx,s.by), sp=vorPt(e,s.bx,s.by,s.bz,{x:0,y:0});
  VOR.allow=true; try{ damageEnemy(e,e.maxHp*0.035,{src:'arrow',crit:true,fx:f.x,fy:f.y}); } finally{ VOR.allow=false; }
  try{ mvSnd('hoop'); }catch(err){} SFX.play('hit'); shake(5); hitstop=Math.max(hitstop,0.04);
  emit(sp.x,sp.y,26,{col:'255,226,120',smin:80,smax:300,lmin:.3,lmax:.7,zmin:1.5,zmax:3,drag:3});
  ftext(sp.x,sp.y-26,simplify(VT.scale),'#ffe066',17);
  if(e.state==='skyBreathW'||e.state==='skyBreath'){ e.state='flinch'; vorStMax(e,0.8); for(const q of e.scales) if(!q.hit) q.open=0; SFX.play('roar',0.5); }
  if(e.scales.every(q=>q.hit)&&e.state!=='fall'&&e.state!=='stagger'){ if(e.state!=='flinch'){ e.state='flinch'; vorStMax(e,0.35); } }
}
function vorCrash(e){
  e.state='fall'; vorStMax(e,0.55); e.crashN++;
  const q=vorClampIn(e.x,e.y,180); let x=q[0], y=q[1]; for(const P of vorPillars()) if(dist(x,y,P.x,P.y)<110){ const b=angTo(P.x,P.y,x,y); x=P.x+Math.cos(b)*112; y=P.y+Math.sin(b)*112; }
  e.fx=x; e.fy=y; for(const v of VOR.vents) v.open=false;
}
// ----- 2 -> 3: he dives into the crater floor, the floor splits, lava cools on him into black glass
function vorShift23(e){
  e.state='plunge'; vorStMax(e,1.1); e.invuln=true; e.tele=null; e.noClip=true; e.staggered=false; e.ps={x:e.x,y:e.y,alt:e.alt||0};
  taunt('vor',VOR_TAUNT.p3); SFX.play('roar'); VOR.perch=null;
  for(const v of VOR.vents){ v.open=false; v.warn=0; }
}
function vorPlungeTick(e,dt){
  e.st-=dt; const k=clamp(1-e.st/e.stMax,0,1), up=k<0.4?k/0.4:1;
  e.x=lerp(e.ps.x,VC.x,k); e.y=lerp(e.ps.y,VC.y-40,k); e.alt=k<0.4?lerp(e.ps.alt,VSKY+60,up):lerp(VSKY+60,0,(k-0.4)/0.6);
  if(e.st<=0){ e.alt=0; e.noClip=false; e.state='crustForm'; e.st=2.2; e.stMax=2.2;
    shake(22); SFX.play('boom'); SFX.play('boom',0.8); flashA=0.5; flashCol='255,150,60';
    G.rings.push({x:e.x,y:e.y,rad:e.r,max:480,speed:560,thick:26,dmg:0,kb:520});
    emit(e.x,e.y,80,{kind:'fire',smin:120,smax:520,lmin:.5,lmax:1.2,zmin:5,zmax:12,grow:12,drag:2});
    fzAdd('vcracks',{life:1e9}); }
}
function vorCrustBegin(e,resume){
  e.vp=3; e.phase=3; e.state='walk'; e.alt=0; e.noClip=false; e.invuln=false; e.cd=resume?2:1.2; e.mouthGlow=0; e.pullCd=5; e.sumCd=8;
  e.plates=VPLATES.slice(0,vk('plates')).map((q,i)=>Object.assign({i,open:0},q));
  if(resume){ fzAdd('vcracks',{life:1e9,t:1}); }
  if(!(G.flags.a1_vor_ck>=3)&&vk('ck')<=3) G.flags.a1_vor_ck=3;
  taunt('vor',pick(VOR_TAUNT.crust));
  setBanner(VT.p3[0],'',2.6); vorTip('p3',VT.p3[0],VT.p3[1],10);
  if(!(G.weapons&&G.weapons.hammer)&&typeof giveWeapon==='function'){ giveWeapon('hammer'); setBanner(S(`Bram's old hammer!`,`Bram's hammer!`),S('A hammer drops out of the smoke at your feet. Bram, of course.','Bram gives you a hammer!'),3); }
  saveGame();
}
// ----- phase 3: The Heart of the Mountain (the hammer)
function vorP3(e,dt,p,d,a){
  for(const q of e.plates) if(q.open>0){ q.open=Math.max(0,q.open-dt); if(q.open<=0){ const f=vorPlateFoot(e,q); emit(f.x,f.y,12,{col:'90,70,110',glow:false,smin:30,smax:110,lmin:.3,lmax:.6,zmin:2,zmax:4}); } }
  if(e.hp<=e.maxHp*0.0505){ vorFinish(e); return; }
  switch(e.state){
    case 'walk': e.face=turnTo(e.face,a,1.2*dt); if(d>240) steer(e,p.x,p.y,e.speed*1.15); if(e.cd<=0) vorChoose3(e,d,a); break;
    case 'riverW': e.st-=dt; e.mouthGlow=1; if(e.st<=0) vorRec(e,0.8); break;
    case 'fistW': e.st-=dt; e.face=turnTo(e.face,angTo(e.x,e.y,VOR.fist.x,VOR.fist.y),2*dt);
      if(e.st<=0){ const F=VOR.fist; shake(14); SFX.play('boom');
        if(!airborne()&&dist(p.x,p.y,F.x,F.y)<F.r+p.r*0.5) hurtPlayer(ed(22),F.x,F.y,400);
        emit(F.x,F.y,40,{kind:'fire',smin:80,smax:300,lmin:.4,lmax:.8,zmin:4,zmax:9,grow:10}); scorch(F.x,F.y,F.r*0.8);
        e.state='stuck'; vorStMax(e,1.5); F.stuck=true; vorTip('stuck',S('His claw is stuck!','His claw is stuck!'),S('Smash the black glass on his stuck arm with the hammer!','Smash his stuck arm!'),6); }
      break;
    case 'stuck': e.st-=dt; if(e.st<=0){ VOR.fist=null; vorRec(e,0.4); } break;
    case 'pullW': e.st-=dt; e.mouthGlow=1; if(e.st<=0){ e.state='pull'; vorStMax(e,2.0); try{ mvSnd('gust'); }catch(err){} } break;
    case 'pull': { e.st-=dt; e.mouthGlow=1; const k=airborne()||p.dashT>0?0.3:1, b=angTo(p.x,p.y,e.x,e.y), sp=200*k*dt, nx=p.x+Math.cos(b)*sp, ny=p.y+Math.sin(b)*sp;
      if(d>e.r+40&&!playerBlocked(nx,ny)){ p.x=nx; p.y=ny; }
      if(Math.random()<0.7) emit(p.x+rand(-120,120),p.y+rand(-80,80),1,{col:'240,230,220',glow:false,ang:angTo(p.x,p.y,e.x,e.y),spread:0.2,smin:200,smax:320,lmin:.3,lmax:.5,zmin:1,zmax:2,drag:0.4,alpha:0.6});
      if(e.st<=0){ if(d<e.r+90&&!airborne()) hurtPlayer(ed(18),e.x,e.y,440); SFX.play('slash3'); shake(8); vorRec(e,0.7); }
      break; }
    case 'rainW': e.st-=dt; e.mouthGlow=1; if(Math.random()<dt*20){ const v=pick(VOR.vents); emit(v.x+rand(-40,40),v.y,1,{col:'90,70,60',glow:false,ang:-Math.PI/2,spread:0.5,smin:30,smax:90,lmin:.6,lmax:1.1,zmin:4,zmax:8,grow:8}); }
      if(e.st<=0){ const n=vdi()===0?2:3; for(const v of VOR.vents) for(let i=0;i<n;i++){ const b=rand(0,TAU), r=rand(10,140), q=vorClampIn(v.x+Math.cos(b)*r,v.y+Math.sin(b)*r*0.8,50); blast(q[0],q[1],50,rand(0.9,1.6),ed(14),{meteor:true,pool:!!vk('pools')}); } vorRec(e,0.8); }
      break;
    case 'stompW': e.st-=dt; if(e.st<=0) vorStomp(e,0.8); break;
    case 'summonW': e.st-=dt; e.mouthGlow=1; if(e.st<=0){ for(let i=0;i<2;i++){ const s=spotNear(e.x,e.y,150,260); spawnRune('drakeling',s.x,s.y); } vorRec(e,0.5); } break;
    case 'recover': e.face=turnTo(e.face,a,0.6*dt); e.st-=dt; if(e.st<=0){ e.state='walk'; e.cd=rand(0.4,1.0); } break;
    default: e.state='walk';
  }
}
function vorChoose3(e,d,a){
  const o=[['river',3],['stomp',d<340?2:0.8],['rain',2]];
  if(d<540) o.push(['fist',3]);
  if(e.pullCd<=0) o.push(['pull',2]);
  if(e.sumCd<=0&&countType('drakeling')<3) o.push(['summon',1]);
  const ch=vorPick(o), p=player;
  if(ch==='river'){ e.state='riverW'; vorStMax(e,1.0); SFX.play('roar',0.7); vorRivers(e); }
  else if(ch==='stomp'){ e.state='stompW'; vorStMax(e,vorTele(0.75)); e.tele=newTele({shape:'circle',r:e.r+40,dur:e.st,col:'255,150,40'}); }
  else if(ch==='rain'){ e.state='rainW'; vorStMax(e,vorTele(0.9)); SFX.play('roar',0.6); }
  else if(ch==='fist'){ const q=vorClampIn(p.x,p.y,60); VOR.fist={x:q[0],y:q[1],r:78,stuck:false}; e.state='fistW'; vorStMax(e,vorTele(0.9)); fzAdd('vmark',{kind:'fist',x:q[0],y:q[1],r:78,life:e.st,owner:e}); }
  else if(ch==='pull'){ e.state='pullW'; vorStMax(e,vorTele(1.0)); e.pullCd=9; fzAdd('vmark',{kind:'pull',life:e.st+2.0,owner:e}); SFX.play('roar',0.5); }
  else if(ch==='summon'){ e.state='summonW'; vorStMax(e,0.9); e.sumCd=16; taunt('vor',pick(VOR_TAUNT.sum)); }
}
// lava rivers: roughly parallel cracks across the floor with safe gaps between them (or jump one)
function vorRivers(e){
  const n=vk('rivers'), th=rand(0,Math.PI), nx=Math.cos(th+Math.PI/2), ny=Math.sin(th+Math.PI/2), gap=Math.max(140,760/(n+1)), warn=vorTele(1.5);
  const p=player, base=(p.x-VC.x)*nx+(p.y-VC.y)*ny;
  for(let i=0;i<n;i++){ const off=clamp(base+(i-(n-1)/2)*gap+rand(-26,26),-430,430), ox=VC.x+nx*off, oy=VC.y+ny*off;
    const L=1200, ax0=ox-Math.cos(th)*L, ay0=oy-Math.sin(th)*L, bx0=ox+Math.cos(th)*L, by0=oy+Math.sin(th)*L;
    // trim the chord to the floor
    let a0=null, b0=null; for(let s=0;s<=1;s+=0.01){ const x=lerp(ax0,bx0,s), y=lerp(ay0,by0,s); if(vorInFloor(x,y,30)){ if(!a0) a0=[x,y]; b0=[x,y]; } }
    if(!a0) continue; if(Math.random()<0.5){ const t=a0; a0=b0; b0=t; }
    fzAdd('vriver',{ax:a0[0],ay:a0[1],bx:b0[0],by:b0[1],w:40,warn,dur:1.6,dmg:ed(14),life:warn+1.7}); }
}
// plates: where their glass sits on the ground (the arm plate goes down with the claw while it is stuck)
function vorPlateFoot(e,q){ if(q.k==='arm'&&VOR.fist&&VOR.fist.stuck) return {x:VOR.fist.x,y:VOR.fist.y}; return vorFoot(e,q.bx,q.by); }
function vorHammerPlates(e,ix,iy,ch,thunder){
  if(e.vend||e.state==='crustForm') return;
  const need=vk('plateCh'), K=wReachK(); let n=0;
  for(const q of e.plates){ if(q.open>0) continue; const f=vorPlateFoot(e,q), d=dist(ix,iy,f.x,f.y);
    if((d<vk('plateR')+46*K&&ch>=need)||(thunder&&d<200)){ q.open=vk('exposed'); n++; const sp=vorPt(e,q.bx,q.by,q.bz,{x:0,y:0}); if(q.k==='arm'&&VOR.fist&&VOR.fist.stuck){ sp.x=f.x; sp.y=f.y-10; }
      emit(sp.x,sp.y,30,{col:'90,70,120',glow:false,smin:80,smax:300,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:3,drag:3}); emit(sp.x,sp.y,16,{col:'255,190,90',smin:60,smax:200,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); ftext(sp.x,sp.y-30,simplify(VT.crack),'#ffd27a',20); }
    else if(d<vk('plateR')+46*K&&ch<need&&!(VOR.chT>G.time)){ VOR.chT=G.time+2; ftext(f.x,f.y-50,vdi()===2?S('Charge it all the way!','Charge it all the way!'):S('Charge the hammer longer!','Charge it longer!'),'#ffd9a0',14); } }
  if(n){ SFX.play('boom'); shake(10); hitstop=Math.max(hitstop,0.06); vorTip('crack',S('The heart-scale!','The heart-scale!'),S('Under the black glass a heart-scale glows. Every hit on it does double damage, until the glass grows back.','Hit the glowing spot! Double damage!'),7); }
}
// ---------- hits: in the sky only the open Ember Scales can be hit, and only by an arrow or the Wing-rang (from up high, or
// from anywhere on Easy); in the crust only the exposed heart-scales take damage (x2), everything else goes CLINK
{ const base=hitCircles; hitCircles=function(e){ if(e.type!=='vorlaxis'||e!==VOR.e||!VOR.on) return base(e); return vorCircles(e,base); }; }
function vorCircles(e,base){
  if(e.vend) return [];
  if(e.vp===2){
    if(e.state==='skim') return base(e);
    if(e.state==='stagger') return [{x:e.x,y:e.y,r:e.r,m:1},{x:e.headX,y:e.headY,r:27,m:1.4}];
    const sh=VOR.shot; if(!sh||!(sh.vHigh||vk('floor'))) return [];
    const out=[]; for(const s of e.scales){ if(s.hit||s.open<=0) continue; const f=vorFoot(e,s.bx,s.by); out.push({x:f.x,y:f.y,r:vk('scaleR'),m:1,vs:s.i}); } return out;
  }
  if(e.vp===3){
    const out=[], R=vk('plateR');
    for(const q of e.plates) if(q.open>0){ const f=vorPlateFoot(e,q); out.push({x:f.x,y:f.y,r:R,m:2,vpl:q.i}); }
    for(const q of e.plates) if(q.open<=0){ const f=vorPlateFoot(e,q); out.push({x:f.x,y:f.y,r:R,m:0.1}); }
    out.push({x:e.x,y:e.y,r:e.r,m:0.1},{x:e.headX,y:e.headY,r:27,m:0.1});
    return out;
  }
  return base(e);
}
{ const base=wStrike; wStrike=function(e,c,k,id,o){ if(c&&c.vs!=null&&e===VOR.e){ vorScaleHit(e,c.vs); return 0; } return base(e,c,k,id,o); }; }
// arrows and the Wing-rang remember if Ash was up high when they flew; on Easy (a little on Normal) they bend to an open scale
function vorShotStep(base,a,dt){
  if(a.vHigh==null) a.vHigh=vorHigh();
  if(vorSky()&&!a.dead){ const e=VOR.e, bend=vk('bend');
    if(bend>0&&(a.vHigh||vk('floor'))){ let best=null, bd=360*360; for(const s of e.scales){ if(s.hit||s.open<=0) continue; const f=vorFoot(e,s.bx,s.by), dd=dist2(a.x,a.y,f.x,f.y); if(dd<bd){ bd=dd; best=f; } }
      if(best){ if(a.k==='arrow'){ const sp=Math.hypot(a.vx,a.vy), na=turnTo(Math.atan2(a.vy,a.vx),angTo(a.x,a.y,best.x,best.y),bend*dt); a.vx=Math.cos(na)*sp; a.vy=Math.sin(na)*sp; a.a=na; } else if(a.k==='rang'&&a.ph==='out'){ a.h=turnTo(a.h,angTo(a.x,a.y,best.x,best.y),bend*dt); } } } }
  VOR.shot=a; try{ return base(a,dt); } finally{ VOR.shot=null; }
}
{ const base=stepArrow; stepArrow=function(a,dt){ return vorShotStep(base,a,dt); }; }
{ const base=stepRang; stepRang=function(r,dt){ return vorShotStep(base,r,dt); }; }
// Greymane bites when Vorlaxis is on the ground (phase 1, a crash, an exposed heart-scale); his bites are ally hits
{ const base=updateAllies; updateAllies=function(dt){
  const e=VOR.e;
  if(e&&VOR.on&&G.allies) for(const a of G.allies) if(a.k==='grey'){ const ok=e.vp===1||(e.vp===2&&e.state==='stagger')||(e.vp===3&&vorAnyExposed(e)); if(!ok) a.cd=Math.max(a.cd,0.4); }
  VOR.ally=true; try{ base(dt); } finally{ VOR.ally=false; } }; }
// flight: only in phase 2 (the heat over the floor is too wild to fly in phases 1 and 3)
{ const base=canFlyHere; canFlyHere=function(){ if(VOR.on&&G&&G.boss&&G.boss===VOR.e&&!G.boss.dead) return vorSky()&&hasAbil('wings')&&!AREA&&!VOR.e.vend; return base(); }; }
// Pip flies up to knock a scale open (bible 8.3, a1_pip done)
{ const base=pipExtras; pipExtras=function(q,dt,tgt){ if(VOR.pipGo&&VOR.on) return VOR.pipGo; return base(q,dt,tgt); }; }
// the camera pulls back for the fight, further while he is in the sky
{ const base=moveZoom; moveZoom=function(dt){ if(VOR.on&&VOR.e&&!VOR.e.dead&&!AREA&&player&&!player.dead){ const want=vorSky()?0.76:0.86; MV.zoomK+=(want-MV.zoomK)*(1-Math.exp(-dt*2)); zoom=ZOOM0*MV.zoomK; return; } base(dt); }; }
// the camera leans toward him in the sky too (the stock lean skips a boss that flies over everything)
{ const base=updateCam; updateCam=function(dt,snap){
  const e=VOR.e; if(!(e&&VOR.on&&!e.dead&&e.vp===2&&!AREA)) return base(dt,snap);
  const nc=e.noClip, ey=e.y; e.noClip=false; e.y=ey-(e.alt||0)*0.72; try{ return base(dt,snap); } finally{ e.noClip=nc; e.y=ey; } }; }
// ---------- perches and "up high" (phase 2)
function vorPerchNear(x,y,r){ for(const P of vorPillars()) if(P.tall&&dist(x,y,P.x,P.y)<r) return P; return null; }
function vorPerchOn(P){
  const p=player; VOR.perch=P; VOR.perchMv=0; p.landing=false; p.gliding=false; p.avx=p.avy=0;
  SFX.play('pickup',0.6); emit(P.x,P.y-VPERCH_Z,14,{col:'255,226,150',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
  if(!G.flags.a1_vt_perched){ G.flags.a1_vt_perched=1; ftext(p.x,p.y-VPERCH_Z-60,simplify(VT.perch),'#ffe6b0',13); }
}
function vorUnperch(dir){ const p=player; VOR.perch=null; p.landing=false; p.gliding=false; if(dir!=null){ p.avx=Math.cos(dir)*240; p.avy=Math.sin(dir)*240; } }
{ const base=updatePlayer; updatePlayer=function(dt,inp){ base(dt,inp); try{ vorPlayerPost(dt,inp||{}); }catch(e){ console.error('vor player',e); } }; }
function vorPlayerPost(dt,inp){
  const p=player;
  if(!vorSky()||p.dead||AREA){ VOR.perch=null; return; }
  if(VOR.perch){
    const P=VOR.perch, mv=Math.abs(inp.mx||0)+Math.abs(inp.my||0)>0.3;
    VOR.perchMv=mv?(VOR.perchMv||0)+dt:0;
    if(!p.flying){ VOR.perch=null; return; }
    if(inp.jump||VOR.perchMv>0.18){ vorUnperch(mv?Math.atan2(inp.my||0,inp.mx||0):null); return; }
    p.x=P.x; p.y=P.y; p.avx=p.avy=0; p.kvx=p.kvy=0; p.landing=false; p.gliding=false;
    p.flyE=Math.min(flyMax(),p.flyE+dt*3); p.z+=(VPERCH_Z-p.z)*(1-Math.exp(-dt*8)); p.elvCeil=Math.max(p.elvCeil||0,9); p.wingO=0.55;
    return;
  }
  if(p.flying&&(p.elvCeil||0)>=9){
    if(p.landing||p.gliding){ const P=vorPerchNear(p.x,p.y,64); if(P){ vorPerchOn(P); return; } }
    else{ p.z+=(96-p.z)*(1-Math.exp(-dt*3)); if(!VOR.saidHigh){ VOR.saidHigh=true; ftext(p.x,p.y-p.z-40,simplify(VT.high),'#ffe066',15); } }
  }else if(p.flying&&!VOR.saidLow&&vdi()>0){ VOR.saidLow=true; ftext(p.x,p.y-p.z-40,simplify(VT.low),'#ffd9a0',14); }
}
// ---------- per frame: the vents, Pip's knock, Puff's parents, the sleeping dragon, ambience
function vorFightTick(dt){
  if(!G||G.mode!=='story') return;
  if(VOR.on&&(!G.fightSite||G.fightSite!=='summit')&&!(VOR.e&&VOR.e.vend)){ vorReset(); }
  if(VOR.tideWarn>0&&!(VOR.e&&VOR.e.state==='tideW')) VOR.tideWarn=0;
  const e=VOR.e;
  if(VOR.on&&e&&!e.dead){
    vorVentsTick(dt);
    // Pip knocks a scale open every 15 s
    if(e.vp===2&&G.pip&&G.quests.a1_pip&&G.quests.a1_pip.done&&e.state!=='stagger'&&e.state!=='fall'&&e.state!=='rise'){
      VOR.pipT-=dt;
      if(VOR.pipT<=1.0&&!VOR.pipGo){ const s=e.scales.find(q=>!q.hit&&q.open<=0); if(s){ VOR.pipS=s; VOR.pipGo={x:0,y:0}; } else VOR.pipT=4; }
      if(VOR.pipGo&&VOR.pipS){ const sp=vorPt(e,VOR.pipS.bx,VOR.pipS.by,VOR.pipS.bz,{x:0,y:0}); VOR.pipGo.x=sp.x; VOR.pipGo.y=sp.y+6; }
      if(VOR.pipT<=0){ VOR.pipT=15; if(VOR.pipS&&!VOR.pipS.hit){ VOR.pipS.open=Math.max(VOR.pipS.open,3); taunt('pip',VT.pipKnock); try{ mvSnd('hoop'); }catch(err){} const sp=vorPt(e,VOR.pipS.bx,VOR.pipS.by,VOR.pipS.bz,{x:0,y:0}); emit(sp.x,sp.y,20,{col:'255,200,120',smin:60,smax:200,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } VOR.pipGo=null; VOR.pipS=null; }
    } else { VOR.pipGo=null; }
    // Puff's parents snatch a drakeling every 10 s (the puff quest)
    if(e.vp>=2&&G.quests.puff&&G.quests.puff.done){ VOR.puffT=(VOR.puffT||10)-dt; if(VOR.puffT<=0){ VOR.puffT=10; const dr=G.enemies.find(q=>!q.dead&&q.type==='drakeling'); if(dr){ dr.dead=true; deathFx(dr); emit(dr.x,dr.y-30,20,{col:'255,170,90',ang:-Math.PI/2,spread:0.6,smin:120,smax:320,lmin:.4,lmax:.8,zmin:2,zmax:4}); ftext(dr.x,dr.y-40,simplify(VT.puff),'#ffd27a',14); } } }
  }
  // ambience: embers rise off the crater's moat whenever Ash is near
  const p=player;
  if(!AREA&&p&&G.stage!=='wake'&&vorEll(p.x,p.y)<900&&Math.random()<dt*10){ const a=rand(0,TAU), r=rand(VARENA.rx-40,VARENA.rx+40); emit(VC.x+Math.cos(a)*r,VC.y+Math.sin(a)*r*0.952,1,{col:'255,170,80',ang:-Math.PI/2,spread:0.4,smin:20,smax:60,lmin:.8,lmax:1.6,zmin:1.2,zmax:2.4,drag:0.4,rise:20}); }
  // the sleeping dragon on the throne (until the fight)
  if(VOR.sunk){ const s=VOR.sunk; s.t=G.time; if(s.fadeT>0){ s.fadeT+=dt; s.alpha=Math.max(0,1-s.fadeT/1.6); if(s.alpha<=0) VOR.sunk=null; } }
}
function vorReset(){ VOR.on=false; VOR.e=null; VOR.perch=null; VOR.fist=null; VOR.tideWarn=0; VOR.pipGo=null; VOR.saidHigh=false; VOR.saidLow=false; for(const v of VOR.vents){ v.open=false; v.warn=0; } }
// ---------- the boss site: the crater floor, the arena of obsidian spikes in the moat
defineBoss('summit',{boss:'vorlaxis',at:'summit',stage:'summit',
  arena:{shape:'ellipse',rx:VARENA.rx,ry:VARENA.ry,style:'obsidian',glow:'255,130,50',seg:40,cr:20},flyOK:false,
  intro:VOR_INTRO,outro:[],spawn:{dx:0,dy:-330},
  onStart(){ VOR.on=true; G.flags.a1_vor_tries=(G.flags.a1_vor_tries|0)+1; fzAdd('vmoat',{life:1e9}); VOR.pipT=12; VOR.puffT=10; VOR.saidHigh=false; VOR.saidLow=false; },
  onReset(){ vorReset(); }});
Object.defineProperty(STORY.bosses.vorlaxis,'intro',{configurable:true,get(){ return G&&G.flags&&G.flags.a1_vor_tries>0?VOR_INTRO2:VOR_INTRO; },set(v){}});
// ---------- the finish (bible 8.4): at 5 percent the last crust falls away, he sinks onto his belly, Ember speaks
function vorFinish(e){
  if(e.vend) return; e.vend=true; e.invuln=true; e.state='sink'; e.st=99; e.tele=null; e.alt=0; e.staggered=true;
  for(const q of e.plates){ const f=vorPlateFoot(e,q); emit(f.x,f.y-20,24,{col:'90,70,120',glow:false,smin:60,smax:240,lmin:.4,lmax:1,zmin:2,zmax:5,grow:3,drag:3}); }
  e.plates=[]; VOR.fist=null;
  G.projectiles=G.projectiles.filter(q=>q.owner!=='enemy'); G.hazards=[]; G.rings=G.rings.filter(r=>r.owner==='player'); G.pools=G.pools.filter(q=>q.owner==='player');
  G.fz=(G.fz||[]).filter(z=>z.k==='vmoat'||z.k==='vcracks');
  for(const o of G.enemies) if(!o.dead&&o!==e&&o.type==='drakeling'){ o.dead=true; deathFx(o); }
  player.iframes=99; shake(16); flashA=0.5; flashCol='255,220,160'; SFX.play('roar'); G.timeScale=0.4; G.slowT=1.0;
  setBanner(S('The First Flame falls','He falls'),'',2.4);
  later(1.8,()=>{ runDialogue(STORY.a1_vor_end,()=>vorWin(e)); });
}
function vorSinkTick(e,dt){ e.dx=e.dy=0; e.headRel=lerp(e.headRel||0,0,0.05); e.mouthGlow=0.3; if(Math.random()<dt*8) emit(e.x+rand(-60,60),e.y+rand(-40,40),1,{col:'255,170,90',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.8,lmax:1.5,zmin:1.5,zmax:3,rise:20}); }
function vorWin(e){
  scene='play';
  G.flags.a1_vor_won=true; delete G.flags.a1_vor_ck;
  try{ gainXp(foeXp(e)); }catch(err){}
  // he stays on the floor, sunk on his belly, until the choice is made (then the fire goes quiet, or for 'hero' explodes)
  VOR.sunk=Object.assign(vorFake(e.x,e.y,e.face),{staggered:true,mouthGlow:0.4,headRel:0,fadeT:0});
  e.dead=true; e.hp=0;
  G.bossDone.vorlaxis=true; const k=G.fightSite; G.fightSite=null; G.boss=null; if(k&&G.siteGuards) delete G.siteGuards[k];
  try{ bossFightEnd(false); }catch(err){}
  vorReset(); player.iframes=0.6;
  finalChoice();
}
function vorFake(x,y,face){ const f={type:'vorlaxis',x,y,r:56,face,state:'walk',st:0,alt:0,scale:1,alpha:1,headRel:0,mouthGlow:0,tailFx:0,staggered:true,phase:1,dx:0,dy:0,t:G?G.time:0,flash:0,hp:1,maxHp:1}; updateHeadPos(f); return f; }
// ---------- the Ember Heart in every ending (bible 9.1 to 9.4) and the lanterns line (9.5); finalChoice adds these
heartLines=function(end){
  try{ G.items.a1_heart=1; G.flags.a1_heart=end==='warden'?'ward':'forge'; }catch(err){}
  try{ const s=VOR.sunk; if(s&&!(s.fadeT>0)){ s.fadeT=0.001; if(end==='hero'){ for(let i=0;i<8;i++){ const x=s.x+rand(-90,90), y=s.y+rand(-70,70); emit(x,y,30,{kind:'fire',smin:80,smax:340,lmin:.4,lmax:.8,zmin:5,zmax:11,grow:12}); } SFX.play('boom'); shake(12); } } }catch(err){}
  const L=(VOR_HEART[end]||VOR_HEART.hero).slice();
  if(G.quests.a1_lanterns&&G.quests.a1_lanterns.done) L.push(VOR_LANTERNS);
  return L;
};

// ================= drawing
// the 3D figure (a10g) reads its own state names: new states borrow its poses (VPOSE). In the sky he is drawn after the
// trees, with flying Ash (drawAirborneHook), so he is above everything on the ground; the scales and crust are drawn over him.
{ const base=drawVorlaxis; drawVorlaxis=function(e){
  if(e===VOR.e&&!e.dead&&e.vp===2&&(e.alt||0)>30&&!VOR.airPass) return;
  // the pillars behind him are drawn first (he is drawn before the y-sorted list, where the others stand)
  if(e===VOR.e&&!e.dead&&!VOR.airPass&&G.mode==='story'){ VOR.backT=G.time; VOR.backY=e.y; for(const Q of vorPillars()) if(Q.y<e.y&&inView(Q.x,Q.y-40,150)) vorDrawPillar(Q); }
  const s=e.state, st=e.st, P=VPOSE[s];
  if(P) e.state=P;
  if(s==='fistW'||s==='stompW') e.st=0.75*clamp(st/(e.stMax||0.75),0,1);
  else if(s==='tailW') e.st=0.65*clamp(st/(e.stMax||0.65),0,1);
  try{ base(e); } finally{ e.state=s; e.st=st; }
  if(e===VOR.e&&!e.dead) try{ vorOverlay(e); }catch(err){ console.error('vor overlay',err); }
}; }
{ const base=drawAirborneHook; drawAirborneHook=function(){
  const e=VOR.e;
  if(e&&!e.dead&&VOR.on&&e.vp===2&&(e.alt||0)>30&&!AREA){ VOR.airPass=true; try{ drawVorlaxis(e); }catch(err){ console.error(err); } finally{ VOR.airPass=false; } }
  base(); }; }
function vorOverlay(e){
  const t=G.time, o={x:0,y:0};
  if(e.chest>0.05){ vorPt(e,30,0,44,o); glowAt(o.x,o.y,46+30*e.chest,e.vp===2?'255,220,120':'255,150,60',0.55*e.chest); }
  if(e.vp===2&&e.scales) for(const s of e.scales){ vorPt(e,s.bx,s.by,s.bz,o); vorDrawScale(o.x,o.y,s,t); }
  if(e.vp===3&&e.plates) for(const q of e.plates){ if(q.k==='arm'&&VOR.fist&&VOR.fist.stuck){ o.x=VOR.fist.x; o.y=VOR.fist.y-8; } else vorPt(e,q.bx,q.by,q.bz,o); vorDrawPlate(o.x,o.y,q,t); }
  if(e.state==='crustForm'){ const k=clamp(1-e.st/e.stMax,0,1); for(const q of VPLATES.slice(0,vk('plates'))){ vorPt(e,q.bx,q.by,q.bz,o); ctx.save(); ctx.globalAlpha=k; vorDrawPlate(o.x,o.y,{open:0},t); ctx.restore(); } }
}
function vorDiamond(x,y,r,fill,stroke,lw){ ctx.beginPath(); ctx.moveTo(x,y-r); ctx.lineTo(x+r*0.78,y); ctx.lineTo(x,y+r); ctx.lineTo(x-r*0.78,y); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||2; ctx.stroke(); } }
function vorDrawScale(x,y,s,t){
  ctx.save();
  if(s.hit){ vorDiamond(x,y,9,'#5a4a46','#1c1210',2); ctx.strokeStyle='#2a1a16'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x-4,y-5); ctx.lineTo(x+1,y); ctx.lineTo(x-2,y+5); ctx.stroke(); }
  else if(s.open>0){ const f=0.5+0.5*Math.sin(t*14); glowAt(x,y,30+8*f,'255,220,110',0.75);
    vorDiamond(x,y,14+2*f,'#ffd84a','#5a2a08',2.6); vorDiamond(x-2,y-3,6,'#fff6c8');
    ctx.strokeStyle=`rgba(255,240,180,${0.5+0.4*f})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,22+6*f,0,TAU); ctx.stroke(); }
  else { vorDiamond(x,y,10,'#8a2a14','#2a0a06',2); vorDiamond(x-1.5,y-2.5,4,'#c86a2a'); }
  ctx.restore();
}
function vorDrawPlate(x,y,q,t){
  ctx.save(); ctx.lineJoin='round';
  if(q.open>0){ const f=0.5+0.5*Math.sin(t*9); glowAt(x,y,40+10*f,'255,170,60',0.8);
    ctx.beginPath(); ctx.ellipse(x,y,16+2*f,12+2*f,0,0,TAU); ctx.fillStyle='#ffb43a'; ctx.fill(); ctx.strokeStyle='#5a2008'; ctx.lineWidth=2.6; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x-3,y-3,7,5,0,0,TAU); ctx.fillStyle='#fff0b0'; ctx.fill();
    const k=clamp(q.open/vk('exposed'),0,1); ctx.strokeStyle='rgba(255,236,170,.9)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,24,-Math.PI/2,-Math.PI/2+TAU*k); ctx.stroke(); }
  else{ ctx.beginPath(); const R=18; for(let i=0;i<6;i++){ const a=i/6*TAU+0.3, r=R*(i%2?0.82:1); i?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*0.8):ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r*0.8); } ctx.closePath();
    ctx.fillStyle=VOB[1]; ctx.fill(); ctx.strokeStyle='#120a16'; ctx.lineWidth=2.4; ctx.stroke();
    ctx.fillStyle=VOB[2]; ctx.beginPath(); ctx.moveTo(x-12,y-6); ctx.lineTo(x-2,y-12); ctx.lineTo(x+2,y-2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(200,180,255,.7)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x-9,y-8); ctx.lineTo(x-3,y-11); ctx.stroke();
    if(Math.sin(t*2+x)>0.7){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x-6,y-8,1.6,0,TAU); ctx.fill(); } }
  ctx.restore();
}
// the climb's pieces in the y-sorted list (boulders, carts, the anvil, the gate, the lanterns, Cindervane, the pillars,
// the black candle, the sleeping dragon on his throne and, after the fight, the dragon sunk on the floor)
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ vorRenderList(list); }catch(e){ console.error('vor list',e); } }; }
function vorRenderList(list){
  if(AREA||!G||G.mode!=='story'||!player) return;
  const p=player; if(p.y>3300||p.x<5200||p.x>8800) return;
  const F=G.flags, sum=G.stage==='summit', t=G.time;
  const put=(x,y,draw,fly)=>{ if(inView(x,y,120)) list.push({x,y,flying:fly!==false,draw}); };
  if(sum&&!G.bossDone.vorlaxis&&!VOR.on&&inView(7000,600,320)){ if(!VOR.sleep) VOR.sleep=vorFake(7000,600,Math.PI/2); const s=VOR.sleep; s.t=t; s.mouthGlow=0.25+0.25*Math.sin(t*1.3); s.headRel=Math.sin(t*0.4)*0.08; list.push({x:s.x,y:s.y,flying:true,draw:()=>{ drawVorlaxis(s); if(Math.random()<0.05) emit(s.mouthX,s.mouthY,1,{col:'90,70,70',glow:false,ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:1,lmax:1.8,zmin:4,zmax:8,grow:8,drag:0.5}); }}); }
  if(VOR.sunk){ const s=VOR.sunk; list.push({x:s.x,y:s.y,flying:true,draw:()=>drawVorlaxis(s)}); }
  // the crater's pillars (the ones behind a grounded Vorlaxis were drawn with him)
  if(vorEll(p.x,p.y)<1300){ const back=VOR.backT===t; for(const Q of vorPillars()){ if(back&&Q.y<VOR.backY) continue; if(inView(Q.x,Q.y-40,150)) list.push({x:Q.x,y:Q.y-1,flying:true,draw:()=>vorDrawPillar(Q)}); } }
  if(VOR.cw){ const C=VOR.cw; put(C.x,C.y,()=>{ ctx.save(); ctx.globalAlpha*=C.a; if(T3.on&&T3A.cinder) T3A.cinder(C); else drawKnight(Object.assign({r:27,state:'chase',blocking:true,swung:0},C),1.3,false,true); ctx.restore(); },false); }
  // the Last Candle: carts across the stairs, the black candle (lit at half health of Sister Soot, snuffed to end it)
  const cartsOn=VOR.carts&&!VOR.carts[0].off;
  if(cartsOn) VCL.carts.forEach(([x,y],i)=>put(x,y,()=>drawSprite(vorCartSpr(i),x,y-6,1)));
  else if(F.a1_strag==='home') VCL.carts.forEach(([x,y],i)=>{ const ox=x+86+i*36, oy=y+46+(i%2)*10; put(ox,oy,()=>drawSprite(vorCartSpr(i),ox,oy-6,1)); });
  const S0=VOR.strag; if(sum&&(S0||!F.a1_strag)){ const c=VCL.candle; put(c.x,c.y,()=>{ drawSprite(vorCandleSpr(),c.x,c.y,1); if(S0&&S0.lit&&S0.candle){ const f=Math.sin(t*12)*1.5; ctx.save(); ctx.fillStyle='#3a1a4a'; ctx.beginPath(); ctx.moveTo(c.x-3,c.y-8); ctx.quadraticCurveTo(c.x+f,c.y-24,c.x,c.y-26); ctx.quadraticCurveTo(c.x+4,c.y-14,c.x+3,c.y-8); ctx.fill(); ctx.restore(); glowAt(c.x,c.y-14,26,'150,80,220',0.5); } else if(!(S0&&S0.lit)){ ctx.fillStyle='#2a1a2e'; ctx.fillRect(c.x-0.6,c.y-12,1.2,4); } }); }
  // Bram's Anvil, the Hammer Gate and the obsidian boulders (Tier 3)
  put(VCL.anvil.x,VCL.anvil.y,()=>{ drawSprite(vorAnvilSpr(),VCL.anvil.x,VCL.anvil.y-8,1); glowAt(VCL.anvil.x-10,VCL.anvil.y-20,18,'255,200,110',0.18+0.08*Math.sin(t*2)); });
  { const g=VCL.gate, open=!!F.a1_bgate; put(g.x,g.y,()=>{ drawSprite(vorGateSpr(open),g.x,g.y-8,1); if(!open&&vorSongKnown()) glowAt(g.x,g.y-24,22,'255,230,150',0.25+0.15*Math.sin(t*3)); }); }
  if(VOR.bould) for(const b of VOR.bould){ if(b.col.off) continue; put(b.x,b.y,()=>{ drawSprite(vorBoulderSpr(b.i%3),b.x,b.y-8,1); if(Math.sin(t*2+b.i)>0.6) glowAt(b.x+4,b.y-18,14,'255,140,60',0.25); }); }
  // Mom's Lantern Rests (Iska's stone lantern is the first)
  for(const R of VRESTS){ put(R.x,R.y,()=>{ const k=1.3, cy=R.y-8-15*k; drawSprite(vorStoneLanternSpr(),R.x,R.y-8,k);
    if(vorRestLit(R)){ const f=0.8+0.2*Math.sin(t*7+R.n); glowAt(R.x,cy,52*f,'255,190,100',0.7); ctx.save(); ctx.fillStyle='#e84a2a'; ctx.strokeStyle='#5a1a0a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(R.x,cy,7,8.5,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#ffe08a'; ctx.beginPath(); ctx.ellipse(R.x,cy,3,4.4,0,0,TAU); ctx.fill(); ctx.strokeStyle='#5a1a0a'; ctx.beginPath(); ctx.moveTo(R.x-7,cy); ctx.lineTo(R.x+7,cy); ctx.stroke(); ctx.restore(); if(Math.random()<0.03) emit(R.x,cy-8,1,{col:'255,210,140',ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.6,lmax:1.1,zmin:1,zmax:2,rise:12}); }
    else if((G.items.a1_lantern||0)>0&&sum){ const f=0.5+0.5*Math.sin(t*4); glowAt(R.x,cy,20,'255,230,170',0.22+0.22*f); } }); }
}

// ================= debug hooks (tests): __eb.vor.*
window.__ebX=Object.assign(window.__ebX||{},{vor:{
  VOR,VK,VCL,VRESTS,
  beats(on){ VOR.beats=on!==false; vorSyncCols(); return VOR.beats; },
  info(){ const e=VOR.e, p=player; return {on:VOR.on,site:G.fightSite,boss:e?{hp:e.hp,maxHp:e.maxHp,f:e.hp/e.maxHp,vp:e.vp,phase:e.phase,state:e.state,alt:e.alt,x:e.x,y:e.y,invuln:!!e.invuln,vend:!!e.vend,dead:!!e.dead,
      scales:(e.scales||[]).map(s=>({k:s.k,open:+s.open.toFixed(2),hit:s.hit})),plates:(e.plates||[]).map(q=>({k:q.k,open:+q.open.toFixed(2)}))}:null,
    vents:VOR.vents.map(v=>({id:v.id,open:v.open,warn:+v.warn.toFixed(2)})),perch:VOR.perch?VOR.perch.i:null,high:vorHigh(),ceil:p.elvCeil,flying:!!p.flying,z:p.z,
    ck:G.flags.a1_vor_ck||0,tries:G.flags.a1_vor_tries||0,zones:(G.fz||[]).map(z=>z.k),stage:G.stage,rim:!!G.flags.a1_rim}; },
  // put Vorlaxis into a phase now (2: the sky, 3: the crust) with his health at that phase's start
  phase(n){ const e=VOR.e; if(!e||e.dead) return false; e.tele=null; e.invuln=false; if(n===2){ e.hp=e.maxHp*0.655; vorSkyBegin(e,true); } else if(n===3){ e.hp=e.maxHp*0.325; vorCrustBegin(e,true); } else { e.vp=1; e.phase=1; e.state='walk'; } return true; },
  hitScale(i){ const e=VOR.e; if(!e) return false; const s=e.scales[i]; if(!s) return false; s.open=Math.max(s.open,0.5); vorScaleHit(e,i); return s.hit; },
  openScales(t){ const e=VOR.e; if(!e) return 0; for(const s of e.scales) if(!s.hit) s.open=t||2; return e.scales.length; },
  smash(ch,i){ const e=VOR.e; if(!e) return false; const q=e.plates[i||0]; if(!q) return false; const f=vorPlateFoot(e,q), p=player, K=wReachK(); p.facing=angTo(p.x,p.y,f.x,f.y); const ix=p.x+Math.cos(p.facing)*34*K, iy=p.y+Math.sin(p.facing)*34*K; vorHammerPlates(e,f.x,f.y,ch==null?1:ch,false); return q.open>0; },
  hurt(amt,src,mult){ const e=VOR.e; if(!e) return 0; return damageEnemy(e,amt,{src:src||'slash',mult:mult||1}); },
  perch(i){ const P=vorPillars()[i==null?0:i]; if(!P||!P.tall) return false; vorPerchOn(P); return true; },
  high(){ const p=player; if(!p.flying){ p.z=Math.max(p.z,10); takeOff(p); p.z=96; } p.elvCeil=9; return vorHigh(); },
  rest(n){ const R=VRESTS[(n||1)-1]; if(!R) return false; G.items.a1_lantern=Math.max(1,G.items.a1_lantern||0); vorRestLight(R); return vorRestLit(R); },
  choose(i){ if(typeof DLG==='undefined'||!DLG||!DLG.opts) return false; chooseOpt(i); return true; },
  opts(){ return DLG&&DLG.opts?DLG.opts.map(o=>simplify(typeof o.t==='function'?o.t():o.t)):null; },
  line(){ return DLG?{who:(lineParts(DLG.lines[DLG.i])||{}).who,text:DLG.text}:null; },
  heart:()=>({item:G.items.a1_heart||0,flag:G.flags.a1_heart||null}),
  heartLines:e=>heartLines(e).map(l=>l[1]),
  pillars:()=>vorPillars().map(P=>({x:P.x,y:P.y,tall:P.tall})),
  strag:()=>VOR.strag?{n:VOR.strag.list.filter(e=>!e.dead).length,fight:VOR.strag.fight,done:VOR.strag.done,lit:VOR.strag.lit,candle:VOR.strag.candle,flag:G.flags.a1_strag}:{flag:G.flags.a1_strag||null},
  boulders:()=>VOR.bould?VOR.bould.map(b=>({x:b.x,y:b.y,broken:!!G.found[b.id],off:b.col.off})):[],
  gate:()=>({open:!!G.flags.a1_bgate,col:VOR.gateCol?!VOR.gateCol.off:null}),
  tide:()=>(G.fz||[]).filter(z=>z.k==='vtide').map(z=>({rad:z.rad,delay:z.delay})),
  vorFinish:()=>{ if(VOR.e) vorFinish(VOR.e); }
}});

// ================= v10: what Act I's people promise on the mountain is really there
// The Oath's Lift (Hob's kettle key): a rope lift from the Ashfall Terraces (Tier 1, its narrow east shelf) up to the
// Vent Fields (Tier 4, east of the vent). It is chained at the top: Ash unlocks it there with the key the first time he
// gets up the hard way; then it rides both ways (a shortcut for a retry). Juniper's Smoke Ledge: the narrow ledge east
// of Bram's Anvil (Tier 2's east shelf), lost in thick smoke unless Ash has her map; with it, chalk marks show the way
// and the smoke lets him through to a chest with a Heart Ember. Sir Cindervane's stone chair on the rim by the west
// crater stairs. Marlo's chest stays hidden until Ash holds Marlo's note, which also puts an X on the map.
const VV={lift:{top:{x:7930,y:1905},bot:{x:8392,y:2412}},
  smoke:{mouth:{x0:8140,x1:8330,y:2215},path:[[8236,2236],[8232,2176],[8218,2116],[8204,2056],[8192,1996],[8178,1940],[8166,1888]],chest:{x:8180,y:1978}},
  chair:{x:6630,y:446}};
const vvMap=()=>!!(G&&G.items&&G.items.juniper_map);
const vvMarlo=()=>!!(G&&G.items&&G.items.a1_marlonote>0);
{ const base=initWorld; initWorld=function(){ base(); try{ vvPlaces(); }catch(e){ console.error('vv places',e); } }; }
function vvPlaces(){
  const L=(o)=>{ const pr=o.prompt, q=addLandmark(Object.assign({k:'reach',noNudge:true,draw:()=>{}},o,{prompt:typeof pr==='function'?'':pr})); if(typeof pr==='function') Object.defineProperty(q,'prompt',{get:pr,configurable:true}); return q; };
  // the lift's two stations (the crank frame at the top, a little landing at the bottom)
  const T=VV.lift.top, B=VV.lift.bot;
  addCol({t:'c',x:T.x+20,y:T.y-4,r:15}); addCol({t:'c',x:B.x+18,y:B.y-2,r:12});
  VV.lms=[L({id:'a1_lift_top',x:T.x-12,y:T.y+24,r:0,prompt:()=>G?vvLiftPrompt(1):'',act:()=>vvLiftAct(1)}),
    L({id:'a1_lift_bot',x:B.x-10,y:B.y+22,r:0,prompt:()=>G?vvLiftPrompt(0):'',act:()=>vvLiftAct(0)})];
  REACH.clear.push({x:T.x,y:T.y,r:70},{x:B.x,y:B.y,r:60});
  // the Smoke Ledge: thick smoke closes its mouth unless Ash has Juniper's map; her chest waits at the far end
  const M=VV.smoke.mouth, c=addCol({t:'r',x0:M.x0,y0:M.y-10,x1:M.x1,y1:M.y+10});
  Object.defineProperty(c,'off',{get:()=>vvMap(),set(){},configurable:true});
  L({id:'a1_smokeledge',x:(M.x0+M.x1)/2,y:M.y+36,r:0,prompt:()=>G?(vvMap()?S('Follow Juniper’s chalk marks','Follow the chalk marks'):S('Look at the smoke','Look at the smoke')):'',act:vvSmokeLook,hidden:()=>!!G.found.a1_cm_smoke});
  const C=VV.smoke.chest;
  reachChest('a1_cm_smoke',C.x,C.y,{coins:30,xp:150,title:S('Juniper’s Smoke Ledge','The Smoke Ledge'),sub:S('30 coins and a Heart Ember','30 coins and a Heart Ember!'),
    say:[S(`A little chest tucked into the rocks, with a chalk J on the lid. Inside is a note: "Told you. J."`,`A chest with a chalk J on it. A note: "Told you. J."`)]},
    {hidden:()=>!!G.found.a1_cm_smoke||!vvMap(),draw:(o,t)=>{ if(G.found[o.id]||vvMap()) rChestDraw(o,t); },act:o=>{ reachLoot(o); try{ gainHeartEmber('a1_smoke'); }catch(e){} }});
  for(const [x,y] of VV.smoke.path) REACH.clear.push({x,y,r:46});
  // Sir Cindervane's chair, on the rim at the top of the west crater stairs
  const H=VV.chair; addCol({t:'c',x:H.x,y:H.y-2,r:12});
  L({id:'a1_cm_chair',x:H.x,y:H.y+28,r:0,prompt:S('Look at the stone chair','Look at the chair'),act:vvChairAct});
  // Marlo's chest: not there until Ash has read Marlo's note (an opened one stays, open); opening it uses the note up
  const MC=LANDMARKS.find(o=>o.id==='a1_cm_marlo');
  if(MC){ MC.hidden=()=>!!G.found.a1_cm_marlo||!vvMarlo(); MC.draw=(o,t)=>{ if(G.found[o.id]||vvMarlo()) rChestDraw(o,t); };
    const act=MC.act; MC.act=o=>{ act(o); if(G.found.a1_cm_marlo&&G.items.a1_marlonote) delete G.items.a1_marlonote; }; }
  mapListsReset();
}
function vvLiftPrompt(top){
  if(G.flags.a1_lift) return top?S('Ride the Oath’s lift down','Ride the lift down'):S('Ride the Oath’s lift up','Ride the lift up');
  if(top&&G.items.a1_liftkey) return S('Unlock the Oath’s lift','Unlock the lift');
  return S('Look at the Oath’s lift','Look at the lift');
}
function vvLiftAct(top){
  const T=VV.lift.top, B=VV.lift.bot, done=()=>{ scene='play'; };
  if(G.flags.a1_lift){ runDialogue([['narr',top?S(`You climb into the basket and let the rope out, hand over hand. Down past the smoke to the lower terraces.`,`You ride the basket down, down, down!`):S(`You climb into the basket and turn the crank. Creak. Creak. Creak. Up past the smoke to the Vent Fields.`,`You turn the crank. Creak, creak! Up you go!`)]],()=>{ done(); const to=top?B:T; mapTravel(to.x-30,to.y+44,{banner:top?S('The Ashfall Terraces','The lower terraces'):S('The Vent Fields','The Vent Fields')}); saveGame(); }); return; }
  if(top&&G.items.a1_liftkey){ G.flags.a1_lift=true; SFX.play('chest');
    runDialogue([['narr',S(`The basket is chained to the frame with a big padlock stamped OATH LIFT. Hob's key turns with a clunk.`,`A big lock says OATH LIFT. Hob's key fits! Clunk.`)],['ash',S(`A shortcut! Now I can ride up here from the bottom terraces.`,`A shortcut! I can ride up from the bottom now.`)]],()=>{ done(); setBanner(S('The Oath’s Lift','The Oath’s Lift'),S('It carries you between the Ashfall Terraces and the Vent Fields.','It goes between the low terraces and here.'),3); saveGame(); }); return; }
  if(top){ runDialogue([['narr',S(`A rickety lift: a rope, a crank and a basket, chained up with a big padlock stamped OATH LIFT. You would need its key.`,`A rope lift with a big lock. It says OATH LIFT.`)]],done); return; }
  runDialogue([['narr',S(`The bottom of a rope lift. Its basket hangs way up at the top, chained to the frame.`,`A rope lift. The basket is chained up at the top.`)],
    {who:'narr',text:S(`Hob's key says OATH LIFT. The lock must be up there, at the top.`,`Hob's key fits the lock at the top.`),skipIf:()=>!G.items.a1_liftkey}],done);
}
function vvSmokeLook(){
  if(!vvMap()){ runDialogue([['narr',S(`Thick smoke pours out of the rocks here. You can't see a thing, and it smells like burnt socks.`,`Thick smoke! You can't see a thing.`)],['narr',S(`Somebody with a really good map might know a way through.`,`Maybe a good map shows a way.`)]],()=>{ scene='play'; }); return; }
  runDialogue([['narr',S(`Juniper's map shows a ledge right through the smoke. Little chalk J's mark the safe rocks.`,`Juniper's map shows a ledge. Chalk J's mark the way.`)]],()=>{ scene='play'; });
}
function vvChairAct(){
  const ally=G.choices&&G.choices.cinder==='ally';
  runDialogue([['narr',S(`A small stone chair at the top of the crater stairs. Someone carved a C on the back, and a little helmet.`,`A stone chair. A C and a helmet are carved on it.`)],
    {who:'narr',text:S(`Sir Cindervane's chair. He said it was at the top. Just to know it's there.`,`Sir Cindervane's chair! At the top, like he said.`),skipIf:()=>!ally},
    {who:'narr',text:S(`You sit down for a moment. What a view. A tired knight would like knowing this was here.`,`You sit down. What a view!`),skipIf:()=>ally}],()=>{ scene='play'; });
}
// the lift still works with foes about (low-ground foes below the shelf can see Ash but never reach him)
{ const base=updateInteractions; updateInteractions=function(dt){ base(dt); try{
  if(G&&!G.prompt&&G.inCombat&&!AREA&&player&&!player.dead&&VV.lms) for(const o of VV.lms){ if(dist(player.x,player.y,o.x,o.y)<66){ const tx=o.prompt; if(tx) G.prompt={text:tx,act:()=>lmAct(o),x:o.x,y:o.y,always:true}; break; } }
  }catch(e){ console.error(e); } }; }
// ---- drawing: the lift (stations, rope, basket), the smoke and Juniper's chalk marks, the chair
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ vvRender(list); }catch(e){ console.error('vv render',e); } }; }
function vvRender(list){
  if(AREA||!G||G.mode!=='story'||!player) return;
  const p=player; if(p.y>3300||p.x<5200||p.x>8800) return;
  const t=G.time, T=VV.lift.top, B=VV.lift.bot;
  if(inView((T.x+B.x)/2,(T.y+B.y)/2,460)){
    const A=[T.x+20,T.y-62], Z=[B.x+18,B.y-44], n=8, at=u=>[lerp(A[0],Z[0],u),lerp(A[1],Z[1],u)+Math.sin(u*Math.PI)*26];
    for(let i=0;i<n;i++){ const a=at(i/n), b=at((i+1)/n); list.push({x:(a[0]+b[0])/2,y:(a[1]+b[1])/2+90,flying:true,draw:()=>vvRope(a,b)}); }
    list.push({x:T.x,y:T.y,draw:()=>vvStation(T.x,T.y,true)});
    list.push({x:B.x,y:B.y,draw:()=>vvStation(B.x,B.y,false)});
    // the basket: chained at the top while locked, otherwise waiting at the end nearer Ash
    const up=!G.flags.a1_lift||dist(p.x,p.y,T.x,T.y)<dist(p.x,p.y,B.x,B.y), q=up?at(0.07):at(0.93);
    list.push({x:q[0],y:q[1]+90,flying:true,draw:()=>vvBasket(q[0],q[1]+14,!G.flags.a1_lift)});
  }
  const P=VV.smoke.path;
  if(inView(8200,2060,300)){
    const map=vvMap();
    if(map){ ctx.save(); for(let i=0;i<P.length;i++){ const [x,y]=P[i]; vvChalk(x+(i%2?-10:10),y+6,t+i); } ctx.restore(); }
    P.forEach(([x,y],i)=>{ for(let k=0;k<(map?1:4);k++){ const ph=t*0.35+i*1.7+k*2.1, px=x+Math.sin(ph)*14+(k-1.5)*20, py=y-8+Math.cos(ph*0.8)*8-k*12, r=map?26:44+k*7, a=map?0.12:0.72-k*0.1;
      list.push({x:px,y:py+50,flying:true,draw:()=>{ ctx.fillStyle=`rgba(${map?'150,140,140':'78,70,74'},${a})`; ctx.beginPath(); ctx.ellipse(px,py,r,r*0.62,0,0,TAU); ctx.fill(); ctx.fillStyle=`rgba(190,180,176,${a*0.45})`; ctx.beginPath(); ctx.ellipse(px-r*0.25,py-r*0.2,r*0.5,r*0.3,0,0,TAU); ctx.fill(); }}); } });
    if(!map){ const M=VV.smoke.mouth; for(let k=0;k<5;k++){ const x=lerp(M.x0+18,M.x1-18,k/4)+Math.sin(t*0.6+k)*8, y=M.y-14+Math.cos(t*0.5+k*1.3)*5;
      list.push({x,y:y+40,flying:true,draw:()=>{ ctx.fillStyle='rgba(78,70,74,.78)'; ctx.beginPath(); ctx.ellipse(x,y,38,28,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(150,140,138,.3)'; ctx.beginPath(); ctx.ellipse(x-8,y-8,18,10,0,0,TAU); ctx.fill(); }}); } }
  }
  const H=VV.chair; if(inView(H.x,H.y,120)) list.push({x:H.x,y:H.y,draw:()=>vvChair(H.x,H.y)});
}
function vvRope(a,b){ ctx.save(); ctx.lineCap='round'; ctx.strokeStyle='#3a2416'; ctx.lineWidth=4.4; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.strokeStyle='#c09060'; ctx.lineWidth=2; ctx.stroke();
  ctx.strokeStyle='#3a2416'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(a[0]+7,a[1]+5); ctx.lineTo(b[0]+7,b[1]+5); ctx.stroke(); ctx.strokeStyle='#8e6a40'; ctx.lineWidth=1; ctx.stroke(); ctx.restore(); }
function vvStation(x,y,top){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(18,2,30,8,0,0,TAU); ctx.fill();
  ctx.fillStyle='#6a4428'; ctx.fillRect(-4,-6,46,10); ctx.fillStyle='#8e6038'; ctx.fillRect(-4,-6,46,3);
  const H=top?62:44; ctx.strokeStyle='#2a180e'; ctx.lineWidth=6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(6,-2); ctx.lineTo(20,-H); ctx.lineTo(34,-2); ctx.stroke();
  ctx.strokeStyle='#8a5a34'; ctx.lineWidth=3.6; ctx.stroke();
  ctx.fillStyle='#4a4a52'; ctx.beginPath(); ctx.arc(20,-H,5,0,TAU); ctx.fill(); ctx.fillStyle='#9a9aa6'; ctx.beginPath(); ctx.arc(20,-H,2,0,TAU); ctx.fill();
  if(top){ // the crank wheel, and the chain and padlock while it is locked
    ctx.strokeStyle='#2a180e'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(-2,-26,11,0,TAU); ctx.stroke(); ctx.strokeStyle='#a87444'; ctx.lineWidth=2; ctx.stroke();
    const a=G.time*(G.flags.a1_lift?0.6:0); for(let k=0;k<4;k++){ const q=a+k*Math.PI/2; ctx.beginPath(); ctx.moveTo(-2,-26); ctx.lineTo(-2+Math.cos(q)*11,-26+Math.sin(q)*11); ctx.stroke(); }
    ctx.fillStyle='#4a2c18'; ctx.fillRect(-16,-28,6,3);
    if(!G.flags.a1_lift){ ctx.strokeStyle='#5a5a64'; ctx.lineWidth=2; ctx.setLineDash([3,2]); ctx.beginPath(); ctx.moveTo(34,-10); ctx.lineTo(46,-20); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle='#4a4a52'; rrect(ctx,42,-24,10,9,2); ctx.fill(); ctx.strokeStyle='#4a4a52'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(47,-25,3.4,Math.PI,0); ctx.stroke(); ctx.fillStyle='#c84a3a'; ctx.fillRect(44,-21,6,2); } }
  else { ctx.fillStyle='#d8c8a0'; ctx.font=`900 7px ${UIF}`; ctx.textAlign='center'; ctx.fillText('LIFT',20,-10); }
  ctx.restore();
}
function vvBasket(x,y,chained){ ctx.save(); ctx.translate(x,y);
  ctx.strokeStyle='#3a2416'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(0,-24); ctx.lineTo(10,-10); ctx.stroke();
  ctx.fillStyle='#7a5030'; ctx.beginPath(); ctx.moveTo(-13,-10); ctx.lineTo(13,-10); ctx.lineTo(10,6); ctx.lineTo(-10,6); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#2a180e'; ctx.lineWidth=1.6; ctx.stroke();
  ctx.strokeStyle='rgba(255,220,170,.35)'; ctx.lineWidth=1; for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(-12,-5+k*4); ctx.lineTo(12,-5+k*4); ctx.stroke(); }
  if(chained){ ctx.strokeStyle='#5a5a64'; ctx.setLineDash([3,2]); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(13,-6); ctx.lineTo(20,-16); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore(); }
function vvChalk(x,y,t){ ctx.strokeStyle='rgba(250,248,240,.85)'; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x+3,y-8); ctx.lineTo(x+3,y+1); ctx.quadraticCurveTo(x+3,y+5,x-1,y+5); ctx.quadraticCurveTo(x-4,y+5,x-4,y+2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x-6,y-10); ctx.lineTo(x,y-16); ctx.lineTo(x+6,y-10); ctx.stroke(); if(Math.sin(t*2)>0.7) glowAt(x,y-4,8,'255,250,230',0.25); }
function vvChair(x,y){ ctx.save(); ctx.translate(x,y); ctx.scale(1.3,1.3);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(2,3,17,6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#5e5048'; ctx.fillRect(-13,-34,26,26); ctx.fillStyle='#7a6a60'; ctx.fillRect(-13,-34,8,26); ctx.fillStyle='#4a3e38'; ctx.fillRect(10,-34,3,26);
  ctx.fillStyle='#6a5a52'; ctx.fillRect(-15,-12,30,12); ctx.fillStyle='#8a7a6e'; ctx.fillRect(-15,-12,30,3); ctx.fillStyle='#463a34'; ctx.fillRect(-15,-1,30,2);
  ctx.fillStyle='#544640'; ctx.fillRect(-15,-36,30,4);
  ctx.strokeStyle='rgba(255,200,140,.75)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(0,-24,4.5,Math.PI*0.25,Math.PI*1.75); ctx.stroke();
  ctx.fillStyle='#8a2a2a'; ctx.fillRect(-11,-14,22,3);
  ctx.strokeStyle='#2a1a16'; ctx.lineWidth=1.2; ctx.strokeRect(-13,-34,26,26); ctx.strokeRect(-15,-12,30,12);
  ctx.restore(); }
// ---- the map: an X for Marlo's note, and Juniper's mark for the Smoke Ledge
{ const base=drawMapScreen; drawMapScreen=function(){ base(); try{
  if(!G||G.mode!=='story'||typeof MAPUI==='undefined'||MAPUI.view!==0) return;
  const g=mapG, X=(x,y,col,lbl)=>{ const [px,py]=mapXY(x,y); g.save(); g.lineCap='round';
    for(const [w,c] of [[8,'rgba(0,0,0,.75)'],[4.5,col]]){ g.strokeStyle=c; g.lineWidth=w; g.beginPath(); g.moveTo(px-10,py-10); g.lineTo(px+10,py+10); g.moveTo(px+10,py-10); g.lineTo(px-10,py+10); g.stroke(); }
    g.font='600 15px Rubik, system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=4; g.strokeStyle='rgba(0,0,0,.75)'; g.strokeText(lbl,px,py+24); g.fillStyle='#ffe2c8'; g.fillText(lbl,px,py+24); g.restore(); };
  if(vvMarlo()&&!G.found.a1_cm_marlo) X(VCL.marlo.x,VCL.marlo.y,'#ff5a3a',simplify(S('Marlo’s X','Marlo’s X')));
  if(vvMap()&&!G.found.a1_cm_smoke) X(VV.smoke.chest.x,VV.smoke.chest.y,'#f4f0ff',simplify(S('The Smoke Ledge','The Smoke Ledge')));
  }catch(e){ console.error(e); } }; }
Object.assign(window.__ebX.vor,{VV,lift:()=>({unlocked:!!G.flags.a1_lift,key:!!G.items.a1_liftkey}),smokeOpen:()=>vvMap(),marloShown:()=>{ const o=LANDMARKS.find(q=>q.id==='a1_cm_marlo'); return o?!o.hidden():null; }});
