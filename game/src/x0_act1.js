// ================= x0_act1: the Act I rework (bible/ACT1.md sections 0 to 5, 6.1 to 6.3, 9.6, 11)
// Ember's Trials are a story quest, the four Ward gates (the Broken Causeway, the Nest Spire, the Gloam Swirl,
// Greymane's Ice), the hammer guarantee, the new side quests a1_hop (Double Jump, Ember's Nursery), a1_skim (the
// Skimmer, the Lake King's race), a1_moth, a1_pip and a1_bram (Old Thunder), a payoff for each of the 27 old side
// quests, the Lantern Night thread lines N1 to N3 and Mom's lunch at the Southern Pass.
// Everything is done by wrapping stock functions. State lives in G.flags (a1_*), G.quests, G.items, G.found.
// The climb, Mom's lanterns, Vorlaxis and the endings belong to x0_vorlaxis.js (flags it can read: see A1.md).

// ---------- 0. small helpers
const A1={t:0,said:{},gap:{},msgT:0,pipShots:[],tall:[],build:false};
const a1q=id=>!!(G.quests[id]&&G.quests[id].done);
const a1on=(id,i)=>{ const q=G.quests[id]; return !!q&&!q.done&&(i==null||q.step===i); };
const a1easy=()=>diffIdx===0, a1hard=()=>diffIdx===2;
const a1say=(L,cb)=>runDialogue(L,()=>{ scene='play'; if(cb) cb(); saveGame(); });
// a short line floating over Ash that does not repeat for a while
function a1note(key,full,simple,cd){ const t=G.time||0; if((A1.said[key]||-99)>t) return false; A1.said[key]=t+(cd||4); ftext(player.x,player.y-(player.z||0)-40,S(full,simple),'#ffe0b0',13); return true; }
const a1WpnKey=()=>{ try{ return btnLabel('weapon')||'X'; }catch(e){ return 'X'; } };
function a1tip(key,title,full,simple,dur){ if(G.flags['a1t_'+key]) return; G.flags['a1t_'+key]=1; try{ mvTip(title,S(full,simple),dur||8,'a1_'+key); }catch(e){} }

// ---------- 1. speakers and items
Object.assign(SPK,{grandpa:{name:'Grandpa',col:'#ff9a5a'},a1_soot:{name:'Sister Soot',col:'#9a7ab0'},a1_dross:{name:'Brother Dross',col:'#8a8aa0'},a1_king:{name:'The Lake King',col:'#f0c038'},a1_sign:{name:'A sign',col:'#d8c8a0'}});
Object.assign(ITEM_NAMES,{
  a1_locket:S('A shell locket','A shell locket'), a1_page:S('A torn library page','A torn page'), a1_lantern:S('Mom’s paper lantern','Mom’s lantern'),
  a1_thunder:S('Old Thunder (Bram’s hammer head)','Old Thunder'), a1_skipstone:S('Minnow’s lucky skipping stone','Lucky stone'),
  a1_citykey:S('The Key to Brindlecross','Key to Brindlecross'), a1_liftkey:S('The Oath’s Lift key','Lift key'), a1_heart:S('The Ember Heart','The Ember Heart'),
  a1_marlonote:S('Marlo’s treasure note','Marlo’s note'),
  juniper_map:S('Juniper’s map (it marks a secret ledge on Cinder Mountain)','Juniper’s map (with a secret ledge)')
});

// ---------- 2. words: the main path
// 1.1 Ember's Trials: two new lines before the last line of Yara's real story
STORY.lore.splice(STORY.lore.length-1,0,
  xl('yara',`One more thing. Ember built three Trials for her children, so their dragon gifts could wake. The Leap, the Tide and the Sky.`,`One more thing. Ember built three Trials: the Leap, the Tide and the Sky.`),
  xl('yara',`The Oath has been busy breaking roads, Ash. You will need those gifts to get where they don't want you. Start with the Leap. It is the closest, and the least wet.`,`The Oath broke the roads. You need Ember's gifts. Start with the Leap.`));
// 1.2 Sister Wren's warning, after her Ash Ward line
STORY.wren.splice(3,0,
  xl('wren',`One problem. Morrow's people smashed the old causeway to the Ash Ward and flooded the ditch. Three big gaps. Very rude.`,`Morrow broke the causeway to the Ash Ward. Three big gaps!`),
  {who:'wren',text:S(`Unless you can jump like a frog, you'll want Ember's Trial of the Leap first. In Whisperwood. Yara knows.`,`Can't jump? Do the Trial of the Leap first. In Whisperwood.`),skipIf:()=>hasAbil('jump')},
  xl('ash',`I can be a frog. I can be the best frog.`,`I can be a frog. The best frog!`));
// 2.1 the Ash Ward: the Broken Causeway
STORY.a1_causeway_blocked=[
  xl('narr',`The old stone causeway to the Ash Ward is broken in three places. Black water fills the ditch below. Someone has nailed a sign to the last post.`,`The causeway is broken in three places. Black water is below. There is a sign.`),
  xl('a1_sign',`"NO EMBERBLOODS. THIS MEANS YOU. Love, the Scaled Oath."`,`"NO EMBERBLOODS. Love, the Scaled Oath."`),
  xl('ash',`They wrote "love." That's almost nice.`,`They wrote "love." That's almost nice.`),
  {who:'narr',text:S(`The gaps are too wide to step over. If only you could jump. Sister Wren said something about a Trial in Whisperwood.`,`The gaps are too wide. You need to jump. Try the Trial in Whisperwood.`),skipIf:()=>hasAbil('jump')},
  {who:'narr',text:S(`The gaps are too wide to step over. Good thing you can jump. Jump the small ones. RUN at the big one and jump at the very end.`,`Jump the small gaps. Run at the big one!`),skipIf:()=>!hasAbil('jump')}];
STORY.a1_causeway_first=[
  xl('ash',`Jump, jump, JUMP. Ha! Frog champion of Embermere.`,`Jump, jump, JUMP! Frog champion!`),
  xl('narr',`On the far bank, three cultists look at you. Then at the gaps. Then at each other.`,`Three cultists stare at you. Then at the gaps.`)];
STORY.ward_ash.push(xl('bram',`Oh, and if you ever pass the old Anvil Rock up the road, my hammer head's still stuck in it. Hit it too hard in the year two hundred. Long story. Loud story.`,`My old hammer head is stuck in the Anvil Rock up the road. Long story!`));
// 2.2 the Crag Ward: the Nest Spire
STORY.bosses.broodmother.outro.push(xl('narr',`High above, at the top of the Nest Spire, something glows. A Ward-fire, tucked into a nest like an egg.`,`Up on the Nest Spire, a Ward-fire glows in a nest.`));
STORY.a1_crag_up=[
  xl('narr',`The Nest Spire is all sheer rock. No steps. No handholds. Just a warm draft puffing up from a crack at the bottom.`,`The Nest Spire is all steep rock. No steps. A warm wind puffs up from a crack.`),
  xl('ash',`I'd need wings for that. Real ones. Not the hoping kind.`,`I need wings for that. Real ones.`),
  xl('narr',`The Trial of the Sky is just up the crag. Ember's last gift is waiting there.`,`The Trial of the Sky is up the crag. Get your wings there.`)];
STORY.a1_crag_how=[
  xl('narr',`A warm draft puffs out of a crack at the foot of the spire, smelling of drakeling smoke and toast.`,`A warm wind puffs up from a crack.`),
  xl('narr',`Too high to fly up from the ground. But stand in the warm air, jump, spread your wings, and the draft will carry you higher.`,`Stand in the warm air. Jump and fly. The wind lifts you up!`)];
STORY.ward_crag.unshift(xl('oriel',`You flew! The drakes carried my Ward-fire up here when the Oath came. They kept it warm in a nest. Drakes are very good at keeping things warm.`,`You flew! The drakes kept my fire warm in a nest.`));
// 2.3 the Sunken Ward: the Gloam Swirl
STORY.bosses.gloamjaw.outro.push(xl('narr',`The bog water still spins around the Ward's little island, round and round, like soup that won't stop being stirred.`,`The water spins around the Ward's island. Round and round.`));
STORY.a1_swirl_thrown=[
  xl('narr',`WHOOSH. The swirl spins you around twice and spits you out on the bank. Your tail is dizzy. Tails can be dizzy.`,`WHOOSH! The swirl spins you and throws you out. Your tail is dizzy.`),
  xl('sedge',`(a soggy voice from the island) Sorry! Sorry. It does that. You need to go faster than it can grab. Like a skipping stone.`,`(from the island) Sorry! Go faster than it can grab. Like a skipping stone.`),
  xl('ash',`Who skips? Who even skips stones that well?`,`Who skips stones that well?`),
  xl('sedge',`The Fisk girl on the Brindlecross dock skips them eleven times. I can hear the plops from here. Everything travels in water.`,`Minnow Fisk, on the Brindlecross dock. She skips them eleven times!`)];
STORY.a1_swirl_look=[
  xl('narr',`The bog water spins round the Ward's island like a whirlpool in a bathtub. Walking in would get you thrown right back out.`,`The water spins like a whirlpool. Walk in and it throws you out.`),
  {who:'narr',text:S(`You skim now. Sprint across the water and the swirl is far too slow to grab you. Do not stop, and do not jump!`,`Run across the water! Don't stop. Don't jump!`),skipIf:()=>!hasAbil('skimmer')},
  {who:'narr',text:S(`Something that skims like a stone might get through. Minnow Fisk on the Brindlecross dock knows a lot about skipping.`,`Only a skimmer gets through. Ask Minnow on the Brindlecross dock.`),skipIf:()=>hasAbil('skimmer')||!hasAbil('stride')},
  {who:'narr',text:S(`First you would need to walk on water at all. The Trial of the Tide, on Lake Mirrow, teaches that.`,`First learn to walk on water. Try the Trial of the Tide.`),skipIf:()=>hasAbil('stride')}];
STORY.ward_mire.unshift(xl('sedge',`You skipped! Right over the swirl! Oh, I'm so dizzy for you. In a good way.`,`You skipped over the swirl! I'm dizzy for you!`));
// 2.4 the Frost Ward: Greymane's Ice (before the choice in his outro)
STORY.bosses.greymane.outro.splice(1,0,xl('narr',`Behind Greymane, the Frost Ward is frozen solid inside a block of blue ice. Three cold lanterns glitter on the cliffs above it.`,`The Frost Ward is frozen in ice. Three cold lanterns sit up high.`));
STORY.a1_frost_ice=[
  xl('tove',`(through the ice) Mmmf. Ash? It's Tove. I am inside an ice cube. Again. I would like that noted.`,`(in the ice) Ash? It's Tove. I'm in an ice cube. Again.`),
  xl('tove',`The three lanterns up on the cliff hold the frost. Light them and it melts. You can't climb up there. But an arrow can.`,`Light the three lanterns up there. An arrow can reach them.`),
  xl('tove',`A burning one, preferably. Breathe fire, then shoot through it. Ember used to do that to light the festival. Showing off.`,`A burning arrow! Breathe fire and shoot through it.`),
  {who:'tove',text:S(`Ember's bow is in her Trial of the Tide. On the island in Lake Mirrow. Go on, I'll wait. I'm good at waiting. And at being cold.`,`No bow? It's in the Trial of the Tide, on Lake Mirrow. I'll wait.`),skipIf:()=>!!(G.weapons&&G.weapons.bow)},
  {who:'tove',text:S(`Oh, and if your arrows are too slow, Ember's Wing-rang burns too, if you throw it through your fire. On a kind day. Today is a kind day.`,`A burning Wing-rang works too, today.`),skipIf:()=>!a1easy()||!(G.weapons&&G.weapons.boomerang)}];
STORY.a1_frost_melt=[
  xl('narr',`The third lantern catches. Three flames burn on the cliff, and the ice around the Ward cracks, groans, and slides off in one big wet SLUMP.`,`The third lantern lights! The ice cracks and slides off. SLUMP!`),
  xl('tove',`I'm free! I'm damp! Mostly free.`,`I'm free! I'm wet! Mostly free.`),
  xl('tove',`Now breathe on my Ward-fire, Ash. Gently. I have had enough surprises for one century.`,`Now breathe on my Ward-fire. Gently!`)];
// 2.5 the hammer guarantee
STORY.a1_hammer_free=[
  xl('maren',`For the mountain? ...Of course for free. What kind of mother charges her kid for a volcano hammer?`,`For the mountain? Of course it's free!`),
  xl('maren',`Don't answer that. Stand back.`,`Don't answer that. Stand back.`)];

// ---------- the Trials as a story quest, and the hints that point at Ember's gifts
const A1_HINT={
  hollow_nojump:S(`The Hollow Ward first, Ash. And soon, the Trial of the Leap in Whisperwood. You will need to jump before long.`,`Light the Hollow Ward. Soon, the Trial of the Leap.`),
  warcamp_nojump:S(`Grizzlefang first. But do not forget Ember's Trial of the Leap in Whisperwood, east of the war camp road. The Oath breaks roads.`,`Beat Grizzlefang. And try the Trial of the Leap!`),
  wren_nojump:S(`Sister Wren is in the Brindlecross library. On the way, think about the Trial of the Leap. You will want to jump.`,`Find Wren in Brindlecross. Learn to jump soon!`),
  oath_nojump:S(`The Ash Ward's road is broken, Ash. Ember's Trial of the Leap is in Whisperwood. Learn to jump first. Then jump on Morrow.`,`The road is broken. Do the Trial of the Leap first!`),
  three_gifts:S(`The Crag Ward wants wings. The Sunken Ward wants a skipping stone. The Frost Ward wants an arrow on fire. Ember's Trials, little one. And Minnow Fisk on the dock.`,`Crag Ward: wings. Sunken Ward: skimming. Frost Ward: a fire arrow.`),
  gate_hammer:S(`Your mother has been staring at the mountain all week, Ash. Go and see her before the gate. She says the summit needs a hammer.`,`Go see Mom first. The summit needs a hammer.`),
  summit_dj:S(`Hollis says his goat jumps twice in the air now. I have stopped asking questions about goats. You should ask him.`,`Hollis's goat jumps twice now. Go ask him!`)
};

// ---------- 3. the new Act I side quests (bible 3, 4, 6.1, 6.2, 6.3; registry 11.1)
const a1Goat=(f,s)=>xl('goat',f,s||f);
Object.assign(QDEFS,{
  a1_hop:{title:S('The Goat Who Jumped Twice','The Goat Who Jumped Twice'),giver:'hollis',min:'oath',ab:'jump',after:'duchess',
    offer:[
      xl('hollis',`Ash. Sit down. No, stand up. This is a standing-up kind of story.`,`Ash. Stand up. This is a standing-up story.`),
      xl('hollis',`Duchess has been sneaking up the Goatstair every morning. She comes back with straw in her ears and a look on her face.`,`Duchess sneaks up the Goatstair every morning. She comes back with straw in her ears.`),
      xl('hollis',`And yesterday I saw her jump over the fence. Then, in the middle of the air, she jumped AGAIN. Off nothing. Off the air itself.`,`Yesterday she jumped over the fence. Then she jumped AGAIN, in the air!`),
      xl('ash',`Goats can't do that.`,`Goats can't do that.`),
      xl('hollis',`That's what I said! She looked at me like I was the one being silly. Follow her, would you? I need to know. For my peace of mind. And the fence.`,`That's what I said! Please follow her. I need to know.`)],
    steps:[
      {t:'flag',flag:'a1_hop_follow',npc:'hollis',mini:'a1_follow',text:S('Follow Duchess up the Goatstair north of the farm, and stay close (talk to Hollis or to Duchess to start)','Follow Duchess up the Goatstair. Stay close!'),
        ready:[xl('hollis',`She's by the pen, chewing a bucket. When she sets off, stay close. She does not wait for anybody.`,`She's by the pen. Stay close to her!`),a1Goat('Meh.'),xl('ash',`Lead the way, Your Majesty.`,`Lead the way, Your Majesty.`),a1Goat('Meeeh.')]},
      {t:'flag',flag:'a1_hop_gift',text:S('Explore the little cave Duchess found at the top of the Goatstair','Explore the little cave at the top.'),at:'cave:a1_nursery',reward:{abil:'dbljump'}},
      {t:'flag',flag:'a1_hop_home',text:S('Lead Duchess home to Hollis Farm. She can jump twice now. So can you!','Take Duchess home. You can both jump twice now!'),at:'npc:hollis'},
      {t:'talk',npc:'hollis',text:S('Tell Farmer Hollis what his goat has been up to','Tell Hollis about his goat.'),
        lines:[xl('hollis',`She jumped over the barn. The whole barn. And then you did the same thing. Is this my life now? Flying goats and dragons?`,`She jumped over the barn! Then you did too. Is this my life now?`),
          xl('hollis',`You know what, don't answer. Here, for your trouble. And the barn roof. Mostly the roof.`,`Don't answer. Here, for your trouble.`)],reward:{coins:40,xp:120}}]},
  a1_skim:{title:S('The Lake King’s Race','The Lake King’s Race'),giver:'minnow',min:'warcamp',ab:'stride',
    get offer(){ const L=[
      xl('minnow',`Ash! You can walk on water! I saw! Dad saw too, he dropped his sandwich in the lake.`,`Ash! You can walk on water! I saw!`)];
      if(a1q('minnow')) L.push(xl('minnow',`You found my pearls! Dad wears the necklace every day. He pretends it's itchy.`,`You found my pearls! Dad wears the necklace every day.`));
      else L.push(xl('minnow',`My boat drifted back. It took three days. I had a lot of time to think about skipping.`,`My boat drifted home. It took three days.`));
      L.push(xl('minnow',`But you walk on it like it's a floor. Clomp clomp clomp. You're supposed to SKIP. Like a stone. Watch.`,`But you walk like it's a floor. Clomp clomp! You should SKIP. Watch.`),
        xl('narr',`Minnow throws a flat stone. It skips eleven times, bonks a duck, and skips twice more off the duck.`,`Minnow throws a stone. It skips eleven times. Then it bonks a duck.`),
        xl('minnow',`Thirteen! The duck counts. Anyway, the only one who skips better than me is the Lake King.`,`Thirteen! The duck counts. Only the Lake King skips better.`),
        xl('ash',`The FISH?`,`The FISH?`),
        xl('minnow',`He's not a fish, he's a king. He races anyone who walks on his lake. If you beat him, he teaches you the Royal Skip. Dad says that's a story. Dad says a lot of things.`,`He's a king! Beat him in a race and he teaches you the Royal Skip.`));
      return L; },
    steps:[
      {t:'flag',flag:'a1_skim_met',text:S('Walk out to the Lake King’s big ripples in the north of Lake Mirrow','Walk out to the big ripples on Lake Mirrow.'),at:'lm:rc_lakeking'},
      {t:'flag',flag:'a1_skim_won',text:S('Race the Lake King around Lake Mirrow: through all seven rings of light, then back to his ripples (talk to the ripples to start)','Race the Lake King! Swim through seven rings. Talk to the ripples to start.'),at:'lm:rc_lakeking',reward:{abil:'skimmer'}},
      {t:'talk',npc:'minnow',text:S('Show Minnow your new skip on the Brindlecross dock','Show Minnow your new skip.'),give:{a1_skipstone:1},
        lines:[xl('minnow',`You did the ROYAL SKIP! Dad! DAD! He did the Royal Skip!`,`You did the ROYAL SKIP! Dad! DAD!`),
          xl('dell',`(from the dock) I saw! I dropped another sandwich!`,`I saw! I dropped another sandwich!`),
          xl('minnow',`Here. My lucky skipping stone. You don't need it now. But a lucky stone is lucky even when you don't need it.`,`Here. My lucky stone. It's lucky even if you don't need it.`)],reward:{coins:50,xp:140}}]},
  a1_moth:{title:S('The Stranger in the Moth Cloak','The Stranger in the Moth Cloak'),giver:'wren',min:'three',
    offer:[
      xl('wren',`Ash. Something odd. Somebody borrowed the Book of Emberblood Families. They returned it last night, through the window. With one page cut out.`,`Ash. Someone took a book about Emberbloods. They brought it back with a page cut out.`),
      xl('wren',`And this, pressed between the pages.`,`And this was inside.`),
      xl('narr',`Wren holds up a moth. A real one, flat and silver-grey. Its wings are covered in a fine glittering dust that leaves your claws sparkly.`,`Wren holds up a flat grey moth. Its dust makes your claws sparkle.`),
      xl('wren',`A tall girl in a grey cloak has been seen around the valley, asking about Emberbloods. Ask about her. I want my page back. And I want to know why.`,`A girl in a grey cloak asks about Emberbloods. Ask about her. I want my page back.`)],
    topics:{
      nib:{t:S('Have you seen a girl in a grey cloak?','Seen a girl in a grey cloak?'),flag:'a1_moth_c_nib',lines:[xl('nib',`The moth lady! She climbed the library wall at midnight. No ladder. She climbed it like a LIZARD. I was so jealous I forgot to be scared.`,`The moth lady! She climbed the library wall at night. Like a lizard!`)]},
      tamsin:{t:S('Did a stranger ask you for a song?','Did a stranger ask for a song?'),flag:'a1_moth_c_tamsin',lines:[xl('tamsin',`She asked for the Song of Ember's Children. Nobody asks for that one. The last verse is about Ember's other child, who sailed away south. She made me sing it twice.`,`She asked for an old song about Ember's children. One child sailed south.`)]},
      hob:{t:S('Was there a stranger at the Kettle?','Was a stranger here?'),flag:'a1_moth_c_hob',lines:[xl('hob',`Sat in the corner, ate three bowls, paid with a seashell. A real shell, polished. Said it was money where she comes from. Then asked which way was south.`,`She ate three bowls and paid with a seashell. Then she asked the way south.`)]},
      pell:{t:S('Did anyone odd come to your wagon?','Did anyone odd come by?'),flag:'a1_moth_c_pell',lines:[xl('pell',`She didn't buy a thing! She just asked if I had any "warm stones." Warm stones! I said, have you tried a sunny rock? She did not laugh.`,`She asked for "warm stones." I said, try a sunny rock. She did not laugh.`)]}},
    steps:[
      {t:'flags',flags:['a1_moth_c_nib','a1_moth_c_tamsin','a1_moth_c_hob','a1_moth_c_pell'],n:3,text:S('Ask around about the stranger in the moth cloak: Nib and Pell in Brindlecross, Hob and Tamsin at the Smoky Kettle','Ask about the moth girl: Nib, Pell, Hob and Tamsin.'),at:'poi:brindle'},
      {t:'flag',flag:'a1_moth_camp',text:S('Find the stranger’s camp by the old Southern Pass rockfall, south of Emberhollow. Go at night.','Find her camp south of Emberhollow. Go at night!'),at:'lm:a1_camp'},
      {t:'talk',npc:'wren',text:S('Bring the torn page back to Sister Wren in the Brindlecross library','Bring the page to Wren.'),take:{a1_page:1},
        lines:[xl('wren',`"Ember had two children. The first carried her fire. The second, Pearl, had none. Not a spark. Only her mother's horns, and claws that could climb anything."`,`"Ember had two children. The second, Pearl, had no fire. Only horns and climbing claws."`),
          xl('wren',`"Pearl loved the sea more than the mountain. She sailed south and never came home. Her children are the Emberbloods without fire."`,`"Pearl sailed south. Her children are Emberbloods without fire."`),
          xl('ash',`So there are MORE of us? Somewhere south?`,`There are MORE of us? Down south?`),
          xl('wren',`There might be. And one of them came all this way to read about it. And to look at you. Here, take this charm. Moths hate it. I made it out of a very boring book.`,`Maybe. And one came to look at you. Take this charm. Moths hate it.`)],reward:{coins:40,xp:160,bless:1,perk:'moth'}}]},
  a1_pip:{title:S('Pip’s Five Flames','Pip’s Five Flames'),giver:'yara',min:'three',
    offer:[
      xl('yara',`Ash. Your little drake. May I?`,`Ash. Your little drake. May I?`),
      xl('narr',`Yara holds out a finger. Pip sniffs it and sneezes a spark the size of a pea.`,`Pip sniffs Yara's finger. He sneezes a tiny spark.`),
      xl('yara',`That is a baby flame. The old stories say a drake hatched at a Ward-fire should taste all five of them, to grow its fire up. Oriel's drakes always did.`,`That is a baby flame. A drake should taste all five Ward-fires to grow.`),
      xl('yara',`Take him to each Ward. Let him have a little lick of each flame. The Wardens will know what to do. They always loved a baby.`,`Take him to each Ward. The Wardens will help.`),
      xl('pip',`Mip?`,`Mip?`)],
    steps:[
      {t:'flags',flags:['a1_pip_hollow','a1_pip_ash','a1_pip_crag','a1_pip_mire','a1_pip_frost'],n:5,text:S('Take Pip to all five Ward-fires so he can taste each flame (a Ward has to be lit)','Take Pip to all five Ward-fires.'),at:()=>a1PipAt()},
      {t:'talk',npc:'yara',text:S('Show Elder Yara Pip’s new flame','Show Yara Pip’s new flame.'),
        lines:[xl('narr',`Pip opens his mouth and out comes a real flame. Small, but red-gold and roaring, with a little puff of smoke at the end like a full stop.`,`Pip breathes a real flame! Small, red-gold and roaring.`),
          xl('pip',`MIP!`,`MIP!`),
          xl('yara',`Five flames in one small belly. Watch out, Grandpa.`,`Five flames in one small belly. Watch out, Grandpa.`)],reward:{coins:30,xp:150}}]},
  a1_bram:{title:S('Old Thunder','Old Thunder'),giver:'maren',min:'oath',
    offer:[
      xl('maren',`Ash, a little ghost told me something. Well, Bram told you, and you told me with your mouth full. Same thing.`,`Ash, Bram told you something. And you told me.`),
      xl('maren',`Bram's hammer head is stuck in the Anvil Rock up the Ashen Road. The Wardens' hammer. "Old Thunder," the songs call it.`,`Bram's old hammer head is stuck in the Anvil Rock. It's called Old Thunder.`),
      xl('maren',`Bring it to me and I'll put it on yours. You'll hit like a thunderstorm. Please only hit bad things with it.`,`Bring it to me. You'll hit like thunder! Only hit bad things.`)],
    steps:[
      {t:'flag',flag:'a1_bram_hot',text:S('Heat the Anvil Rock on the Ashen Road ridge: light its three old forge-pits before they cool. Light the far one first!','Light the three fire pits by the Anvil Rock. Do the high one first!'),at:'lm:a1_anvil'},
      {t:'flag',flag:'a1_bram_free',text:S('Strike the glowing hammer head with a fully charged hammer smash (hold attack)','Hit the hot rock with a big hammer smash!'),at:'lm:a1_anvil'},
      {t:'flag',flag:'a1_bram_won',text:S('Oath stragglers want the hammer head. Stop them!','Stop the Oath cultists!'),at:'lm:a1_anvil'},
      {t:'talk',npc:'maren',text:S('Bring the hammer head to Mom at the forge in Emberhollow','Bring the hammer head to Mom.'),take:{a1_thunder:1},
        lines:[xl('narr',`Mom works all night. In the morning, your hammer has a new head: black iron, with a little lightning bolt stamped on the side.`,`Mom works all night. Your hammer has a new head!`),
          xl('maren',`Old Thunder. Charge it all the way and the ground will feel it for a mile. Do not use it indoors. I mean it. I've seen what you do indoors.`,`Old Thunder! Charge it all the way. Do not use it indoors!`)],reward:{coins:60,xp:150,fn:'a1_thunder'}}]}
});
// a 'flags' step counts "clues"; Pip counts Ward-fires
{ const base=stepText; stepText=function(id){ const s=base(id); return id==='a1_pip'&&typeof s==='string'?s.replace(/ clues\)$/,S(' Ward-fires)',' fires)')):s; }; }
// the little Trial pearl quest stays inside the Trial; on the dock Minnow has the race
{ const base=qAvail; qAvail=function(id){
  if(id==='minnow'&&!(AREA&&AREA.id==='tide')) return false;
  if(id==='a1_skim'&&!a1MinnowDock()) return false;
  if(id==='a1_pip'&&!G.flags.pip) return false;
  if(id==='a1_bram'&&!(G.weapons&&G.weapons.hammer&&G.wards.ash)) return false;
  if(id==='trials') return false;   // a story quest now: Yara starts it with her real story
  return base(id); }; }

// ---------- 5. the 27 old side quests and what each one is for now (bible 5)
const a1Step=(id,i)=>QDEFS[id]&&QDEFS[id].steps[i];
const a1Push=(id,i,...L)=>{ const st=a1Step(id,i); if(st&&Array.isArray(st.lines)) st.lines.push(...L); };
// 1 bun: a Heart Ember (it was +15 max health)
a1Step('bun',4).reward={coins:40,bless:1,heart:'a1_he_bun'};
// 2 hollow: Juniper's map marks the Smoke Ledge on Cinder Mountain (x0_vorlaxis reads G.items.juniper_map)
a1Push('hollow',1,xl('juniper',`Oh, and look on the back. There's a ledge on Cinder Mountain they don't put on maps. I put it on mine. The smoky side.`,`Look on the back! A secret ledge on Cinder Mountain.`));
// 3 gate: the tunnel's mine-cart back door to the Gatewatch hills, and the first hint of the moth lady
a1Push('gate',5,xl('wren',`And look, a note in the margin, in different ink: "The moth lady pays in silver dust. Ask no questions." Hm. I have questions.`,`A note says: "The moth lady pays in silver dust." Hm.`),
  xl('wren',`Their tunnel has an old mine cart that runs out to the Gatewatch hills, by the way. Handy, if you ever need to reach the Obsidian Gate in a hurry.`,`Their tunnel has a mine cart to the Obsidian Gate hills. Handy!`));
// 4 moss: Granny Moss's Bog Boots (no slowing in the bog: the Gloamjaw fight floor)
a1Step('moss',2).reward={potmax:1,perk:'bog'};
a1Push('moss',2,xl('moss',`And take my old Bog Boots. They never stick. Not even in Gloamjaw's muck. Especially not in Gloamjaw's muck.`,`And take my Bog Boots. They never stick in the mud.`));
// 6 horn: Ulf blows the old pack-call in the Greymane fight (no wolves join him)
a1Push('horn',1,xl('ulf',`If you ever face that big grey wolf, I'll be on the ridge with this. It's the old pack-call. Wolves remember it.`,`If you fight the big grey wolf, I'll blow this horn. Wolves remember it.`));
// 8 dell: Dell talks about Minnow's skipping
a1Push('dell',1,xl('dell',`My girl Minnow can skip a stone eleven times. Thirteen if there's a duck. Don't tell her I told you. She'll be unbearable.`,`My girl Minnow skips stones eleven times. Thirteen with a duck.`));
// 9 lure: the Soggy Biscuit Two ferries Ash to the Mirefen
a1Push('lure',1,xl('dell',`She floats! Want a ride? I'll take you across to the Mirefen landing any time. Just ask. Bring snacks.`,`She floats! I'll row you to the Mirefen any time. Just ask.`));
// 10 bounty: 30 coins and a Heart Ember
a1Step('bounty',1).reward={coins:30,xp:80,heart:'a1_he_bounty'};
a1Push('bounty',1,xl('osric',`And this. The Watch Medal. It's a medal. It's also somehow good for your heart. Don't ask me how. I just give them out.`,`And the Watch Medal. It's somehow good for your heart.`));
// 11 bounty2: Osric and his dogs come to the Obsidian Gate fight
a1Push('bounty2',1,xl('osric',`When you go for the Obsidian Gate, the dogs and I will be there. Those knights need someone to bark at them. The dogs. Not me. Mostly the dogs.`,`When you go to the Obsidian Gate, the dogs and I will come too!`));
// 12 kettle: the Oath's Lift key rattles in the kettle (x0_vorlaxis: the lift on the climb)
{ const st=a1Step('kettle',1); st.give=Object.assign({},st.give||{},{a1_liftkey:1}); }
a1Push('kettle',1,xl('hob',`What's that rattling? A key! It says OATH LIFT on it. Some lift on the mountain, I'd guess. You keep it. I've got enough keys. I've got a whole drawer of mystery keys.`,`A key in the kettle! It says OATH LIFT. You keep it.`));
// 16 pumpkins: Hal's Turnip Throw (the Long Throw skill for free)
a1Step('pumpkins',1).reward={coins:30,xp:70,skill:'longthrow'};
a1Push('pumpkins',1,xl('hal',`My grandpa threw turnips over the barn. Throw from the shoulder, let go late. Try it with that boomerang thing.`,`My grandpa threw turnips over the barn. Try it with your boomerang!`));
// 19 pie: the Key to Brindlecross opens the Wardens' vault under the bridge
{ const C=STORY.pieAccuse.find(l=>l&&l.opts), o=C&&C.opts.find(q=>typeof q.then==='function'); if(o){ const f=o.then; o.then=()=>f().concat([
  xl('mayor',`And take this. The Key to Brindlecross. It opens a funny little door under the bridge that nobody has opened in a thousand years. Probably junk. Old junk, though.`,`Take the Key to Brindlecross. It opens a little door under the bridge.`),
  xdo(()=>giveItems({a1_citykey:1}))]); } }
// 21 trials: a story quest; Yara's gift is a Heart Ember (it was +10 max health)
a1Step('trials',3).reward={coins:150,xp:400,bless:1,heart:'a1_he_trials'};
QDEFS.trials.story=true;
// 22 marlo: the thing he found in a hole is a treasure note (a Heart Ember on Cinder Mountain, x0_vorlaxis)
{ const st=a1Step('marlo',1); st.give=Object.assign({},st.give||{},{a1_marlonote:1}); }
a1Push('marlo',1,xl('marlo',`Oh, and this note was in the hole too. An X on a high ledge in the Vent Fields, up Cinder Mountain. Only birds and show-offs could reach it. You look like a show-off.`,`And a note! An X on a high ledge on Cinder Mountain. Only flyers can reach it.`));
// 25 sheep: Clover's Bounce (jumps go 12 percent farther)
a1Step('sheep',1).reward={xp:90,fn:'a1_bounce'};
a1Push('sheep',1,xl('hal',`Here's a funny thing. Since she came home, she's taught every sheep on the farm to bounce. And look at you. You're bouncing too.`,`She taught every sheep to bounce. Look, you bounce too!`));
// 26 lakeking: the Lake King spits up a Heart Ember with the hook
a1Step('lakeking',1).reward={coins:60,xp:160,bless:1,heart:'a1_he_lake'};
a1Push('lakeking',1,xl('dell',`And this was on the hook? A Heart Ember! He must have swallowed it years ago. Kings eat a lot of things.`,`A Heart Ember was on the hook! Kings eat a lot of things.`));
// 27 skyhoops: Strong Wings rank 1 for free (it was a skill point)
a1Step('skyhoops',1).reward={xp:180,stamina:10,skill:'strongwings'};
a1Push('skyhoops',1,xl('elka',`And Ulf says your wings looked wobbly on the last hoop. He showed me a trick for that. Now I'm showing you. Flap from your shoulders!`,`Ulf's trick: flap from your shoulders! Your wings get stronger.`));
// 15 seek: Nib's X holds a chunk of star-iron (the dig in lmAct below); 23 minnow and 5 duchess lead into a1_skim and a1_hop
a1Push('seek',1,xl('nib',`Psst. That map's X is extra special. I buried something shiny there. Don't tell Jem.`,`Psst. The X on that map is special. Something shiny!`));
// the rewards the payoffs need: Heart Embers, perks, free skills, Clover's Bounce, Old Thunder
{ const base=giveReward; giveReward=function(r){
  if(r&&r.abil&&hasAbil(r.abil)){ r=Object.assign({},r); delete r.abil; }
  base(r); if(!r) return;
  try{
    if(r.heart) later(1.2,()=>gainHeartEmber(r.heart));
    if(r.perk) a1Perk(r.perk);
    if(r.skill) a1FreeSkill(r.skill);
    if(r.fn==='a1_bounce') a1Bounce(true);
    if(r.fn==='a1_thunder') a1Thunder(true);
  }catch(e){ console.error(e); } }; }
const A1_PERK={bog:[S('Bog Boots','Bog Boots'),S('Mud and muck no longer slow you down.','Mud can’t slow you now.')],moth:[S('Wren’s Moth Charm','Moth Charm'),S('Dusk moths can’t nibble your fire any more.','Moths can’t eat your fire now.')]};
function a1Perk(k){ if(G.flags['perk_'+k]) return; G.flags['perk_'+k]=true; const P=A1_PERK[k]; if(P) later(1.4,()=>setBanner(P[0],P[1],3)); }
const A1_SKILL={longthrow:[S('Hal’s Turnip Throw','Turnip Throw'),S('The Long Throw skill, for free: your Wing-rang flies half again as far.','Your Wing-rang flies much farther!')],strongwings:[S('Strong Wings','Strong Wings'),S('Strong Wings rank 1, for free: you fly 40 percent longer.','You can fly longer!')]};
function a1FreeSkill(id){
  const n=SKILL_TREE.find(q=>q.id===id); if(!n) return;
  const r=G.skills[id]|0;
  if(r>=n.max){ giveSkillPoint(1); return; }
  G.skills[id]=r+1; if(n.fx) n.fx(player); G.flags['a1_free_'+id]=(G.flags['a1_free_'+id]|0)+1;
  const P=A1_SKILL[id]; if(P) later(1.4,()=>setBanner(P[0],P[1],3.2));
}
// Yara's fresh start refunds every spent point: keep the free ranks free
{ const base=resetSkills; resetSkills=function(){
  const free={}; for(const id of ['longthrow','strongwings']) if(G&&G.flags&&G.flags['a1_free_'+id]) free[id]=G.flags['a1_free_'+id]|0;
  const n=base();
  for(const id in free){ const node=SKILL_TREE.find(q=>q.id===id); if(!node) continue; G.skills[id]=free[id]; for(let i=0;i<free[id];i++) if(node.fx) node.fx(player); G.sp=Math.max(0,(G.sp|0)-free[id]); }
  return n; }; }
function a1Bounce(show){ G.flags.a1_bounce=true; const s=player.stats; if(!s.a1b){ s.a1b=true; s.jumpK=(s.jumpK||1)*1.12; } if(show) later(1.4,()=>setBanner(S('Clover’s Bounce','Clover’s Bounce'),S('Your jumps go 12 percent farther. Baa.','You jump farther now! Baa.'),3)); }
function a1Thunder(show){ G.flags.a1_thunder=true; if(show) later(1.4,()=>setBanner(S('Old Thunder','Old Thunder'),S('Charge the hammer all the way: the smash sends a quake ring across the ground.','A full hammer smash shakes the ground!'),3.4)); }
// Nib's star-iron under the X on his map, and the moth lady clue he already gave
{ const base=lmAct; lmAct=function(o){
  const first=o&&o.k==='xmark'&&o.id==='x2'&&!G.found.x2;
  base(o);
  if(first){ G.iron=(G.iron||0)+1; later(0.6,()=>setBanner(S('Star-iron!','Star-iron!'),S('Under the jar, wrapped in a sock: a chunk of star-iron. A note: "NIB WAS HERE TOO."','A chunk of star-iron! "NIB WAS HERE TOO."'),3)); saveGame(); }
}; }
{ const base=startQuest; startQuest=function(id){
  if(id==='a1_moth'&&a1q('seek')) G.flags.a1_moth_c_nib=true;
  base(id);
  if(id==='trials'){ const Q=[G.banner].concat(G.bannerQ||[]), b=Q.find(q=>q&&q.text==='New side quest'&&String(q.sub).includes('Trial')); if(b){ b.text=simplify(S('Story quest','Story quest')); b.sub=simplify(S('Ember’s Trials: the Leap, the Tide and the Sky. Their gifts open the roads to the Wards.','Ember’s Trials! Their gifts open the way.')); b.dur=Math.max(b.dur,4); } }
}; }

// ---------- 4. where everything is (absolute Embermere coordinates)
const A1W={
  // the Ash Ward's moat (a ring) and the broken causeway across it: a straight chord from where the Ashen Road meets
  // the outer bank to the inner bank (planks and gaps are distances along it)
  ash:{x:9200,y:5300,ri:400,ro:600},
  // the Nest Spire beside the Crag Ward (level 2), with a warm vent at its foot
  spire:{x:12740,y:4250,r:105,vx:12740,vy:4520,vr:62,ward:[12740,4236]},
  // the Gloam Swirl: a pool north of the Gloamjaw fight, the Ward on its islet, the swirl between s0 and s1
  gloam:{x:11800,y:8460,r:255,isle:70,s0:122,s1:240,ward:[11800,8452],look:[11800,8752]},
  // the frost lanterns on their ice pillars above the Frost Ward
  frost:{lan:[[2130,3770],[2400,3690],[2670,3770]],ring:58},
  // the Anvil Rock and its three forge-pits (the third up on a rock pillar)
  anvil:{x:9650,y:4650,pits:[[9505,4668,0],[9798,4676,0],[9650,4508,1]]},
  camp:{x:3390,y:10700}, sign:{x:3290,y:10806}, rockfall:{x:3446,y:10842},
  vault:{x:6770,y:7404}, cartB:{x:7650,y:3650}, ferry:{x:10900,y:8700},
  // Ember's Nursery and the Goatstair up to it, north of Hollis Farm
  door:{x:3500,y:4420},
  goat:{path:[[3300,4990],[3150,4930],[3020,4840],[3020,4660],[3270,4610],[3430,4680],[3600,4760],[3700,4660],[3650,4470],[3520,4446]],
    // rifts across the path: [x, y, half length, half width, angle]; wide ones (w) need a double hop, Ash walks round their ends
    rifts:[[3085,4886,70,24,-0.965],[3145,4635,150,90,1.37,'w'],[3515,4720,70,24,2.01],[3675,4565,150,88,-0.26,'w']],
    fences:[[3226,4962,60,0.35],[3350,4645,54,1.98],[3650,4710,48,0.785]],
    wolves:[[3240,4840],[3480,4560]]}
};
// the causeway runs due east (an easy line on a keyboard) through the moat, 40 px outside the inner bank, from Q on the
// outer bank near where the Ashen Road arrives; a short jetty turns north from the last plank onto the Ward's island
(function a1Causeway(){
  const C=A1W.ash, yy=C.y+C.ri+40, Q=[C.x-Math.sqrt(C.ro*C.ro-(C.ri+40)*(C.ri+40)),yy], d=[1,0], T=[C.x,yy], L=dist(Q[0],Q[1],T[0],T[1]);
  const P0=[Q[0]+462,yy], toC=angTo(P0[0],P0[1],C.x,C.y), P1=[P0[0]+Math.cos(toC)*74,P0[1]+Math.sin(toC)*74];
  A1W.cw={Q,T,d,L,ang:0,planks:[[-46,40],[120,172],[252,300],[425,505]],gaps:[[40,120],[172,252],[300,425]],jet:[P0,P1],isle:[P1[0]+Math.cos(toC)*8,P1[1]+Math.sin(toC)*8,34]};
})();
const a1At=(t,o)=>{ const c=A1W.cw; return [c.Q[0]+c.d[0]*t+(o?-c.d[1]*o:0),c.Q[1]+c.d[1]*t+(o?c.d[0]*o:0)]; };

// ---------- the terrain rules for the new places
function a1MoatWet(x,y){
  const C=A1W.ash, dx=x-C.x, dy=y-C.y, d2=dx*dx+dy*dy;
  if(d2<(C.ri-24)**2||d2>(C.ro+24)**2||!A1W.on) return false;
  const d=Math.sqrt(d2), n=fbm(x*0.01+C.x*0.1,y*0.01,2)*14;
  if(Math.max(d-(C.ro+n),(C.ri-n)-d)>=0) return false;
  const I=A1W.cw.isle; if(dist2(x,y,I[0],I[1])<I[2]*I[2]) return false;
  return true;
}
function a1OnPlank(x,y){
  const c=A1W.cw, rx=x-c.Q[0], ry=y-c.Q[1], t=rx*c.d[0]+ry*c.d[1], pp=Math.abs(rx*c.d[1]-ry*c.d[0]);
  if(pp<29) for(const [a,b] of c.planks) if(t>=a-4&&t<=b+4) return true;
  const [P0,P1]=c.jet; return segD(x,y,P0[0],P0[1],P1[0],P1[1])<29;
}
// a plank of the causeway (near the ring): always walkable, whatever the water under it
function a1PlankHere(x,y){ const C=A1W.ash, d2=dist2(x,y,C.x,C.y); return !!A1W.on&&d2>(C.ri-60)**2&&d2<(C.ro+60)**2&&a1OnPlank(x,y); }
// a sooty moat cell: water that no stride can hold (Ash has to jump the gaps)
const a1Moat=(x,y)=>a1MoatWet(x,y)&&!a1OnPlank(x,y);
// rifts on the Goatstair: walkers cannot cross them, a jump can (a wide one needs a double hop)
function a1Rift(x,y){
  if(!A1W.on||x<2900||x>3860||y<4380||y>5020) return null;
  for(const R of A1W.goat.rifts){ const dx=x-R[0], dy=y-R[1], c=Math.cos(R[4]), s=Math.sin(R[4]), u=dx*c+dy*s, v=-dx*s+dy*c; if((u*u)/(R[2]*R[2])+(v*v)/(R[3]*R[3])<1) return R; }
  return null;
}
{ const base=blockedAt; blockedAt=function(x,y){
  if(A1W.on&&x<IZX-50&&y<BAND){ if(a1PlankHere(x,y)) return false; if(a1MoatWet(x,y)) return true; if(a1Rift(x,y)) return true; }
  return base(x,y); }; }
{ const base=playerBlocked; playerBlocked=function(x,y){
  if(A1W.on&&x<IZX-50&&y<BAND){ if(a1PlankHere(x,y)) return false; const p=player; if(!(p&&(p.flying||(p.z||0)>0))&&(a1Moat(x,y)||a1Rift(x,y))) return true; }
  return base(x,y); }; }
{ const base=landBad; landBad=function(x,y){
  if(A1W.on&&x<IZX-50&&y<BAND){ if(a1PlankHere(x,y)) return null; if(a1Moat(x,y)) return 'a1_moat'; if(a1Rift(x,y)) return 'a1_gap'; }
  return base(x,y); }; }
{ const base=landOK; landOK=function(x,y){ if(A1W.on&&x<IZX-50&&y<BAND&&(a1Moat(x,y)||a1Rift(x,y))) return false; return base(x,y); }; }
{ const base=backToSafe; backToSafe=function(p,bad){
  A1.lastBTS={x:p.x,y:p.y,bad,t:G.time,z:p.z,sx:p.safeX,sy:p.safeY};
  if(bad!=='a1_moat'&&bad!=='a1_gap') return base(p,bad);
  if(bad==='a1_moat'){ base(p,'water'); if(diffIdx>0){ const a=p.stats.armor||1, dm=G.diff?G.diff.dmg:1; p.iframes=0; hurtPlayer(p.maxHp*0.05/Math.max(0.01,dm*a),p.x,p.y,0); } if(!G.flags.a1_sooty){ G.flags.a1_sooty=1; ftext(p.x,p.y-44,S('Yuck! Sooty water. It will not hold you up.','Yuck! Sooty water!'),'#cfd8e0',13); } return; }
  // a rift on the Goatstair: back up onto the snow
  emit(p.x,p.y,18,{col:'235,242,250',glow:false,ang:-Math.PI/2,spread:1.2,smin:40,smax:140,lmin:.3,lmax:.7,zmin:2,zmax:4,grow:5});
  let sx=p.safeX, sy=p.safeY; if(sx==null||dist(sx,sy,p.x,p.y)>900||playerBlocked(sx,sy)){ const s=nearestLand(p.x,p.y); if(s){ sx=s.x; sy=s.y; } }
  if(sx!=null){ p.x=sx; p.y=sy; } p.avx=p.avy=0; p.kvx=p.kvy=0; MV.lx=p.x; MV.ly=p.y; p.iframes=Math.max(p.iframes,0.6);
  ftext(p.x,p.y-30,S('Whoops! Too wide.','Whoops!'),'#e8f2ff',14); mvSnd('land',1); }; }
// the road does not bridge the moat (the Oath burned the bridges): water there, and planks only where the causeway is
{ const base=T; T=function(x,y,o){ o=base(x,y,o); if(A1W.on&&y<BAND&&o.bridge===1&&a1MoatWet(x,y)&&!a1OnPlank(x,y)){ o.bridge=0; o.road=0; } return o; }; }

// the Nest Spire (level 2) and its vent, the mist over the Gloam Swirl: elevation data at load, like e4_cinder
ELEV.style('a1_crag',{face:'#b07850',lit:'#d29c6c',dark:'#70462e',lip:'#f8dcae',top:'#e8c088',topK:0.06});
ELEV.plateau({disc:[A1W.spire.x,A1W.spire.y,A1W.spire.r],lvl:2,style:'a1_crag',noise:7,seed:311,id:'a1_spire'});
ELEV.vent({x:A1W.spire.vx,y:A1W.spire.vy,r:A1W.spire.vr,lift:1});
ELEV.noFly({disc:[A1W.gloam.x,A1W.gloam.y,A1W.gloam.r+60],why:S('The bog mist is far too thick to fly through here.','Too misty to fly here!')});

// ---------- 6. the world build: runs after the stock world (so the old random draws land the same)
{ const base=initWorld; initWorld=function(){ base(); try{ a1BuildWorld(); }catch(e){ console.error('a1 world',e); } }; }
function a1MoveWard(id,x,y){
  const w=WARDS[id]; if(!w) return; const ox=w.x, oy=w.y; w.x=x; w.y=y;
  for(const s of STRUCTS) if(s.k==='ward'&&s.id===id){ s.x=x; s.y=y; }
  for(const L of LIGHTS) if(L.ward===id){ L.x=x; L.y=y; }
  const old=[]; forCols(ox,oy,4,c=>{ if(c.t==='c'&&Math.abs(c.x-ox)<0.5&&Math.abs(c.y-oy)<0.5&&c.r===18) old.push(c); }); old.forEach(removeCol);
  addCol({t:'c',x,y,r:18});
}
function a1Art(id,x,y,draw,o){ return addLandmark(Object.assign({id,k:'reach',x,y,noNudge:true,hidden:()=>true,draw},o||{})); }
function a1Lm(o){ const pr=o.prompt; const L=addLandmark(Object.assign({k:'reach',noNudge:true},o,{prompt:typeof pr==='function'?'':pr})); if(typeof pr==='function') Object.defineProperty(L,'prompt',{get:pr,configurable:true}); return L; }
// a tall thing that sorts with the characters (pillars, rocks, the ice block): eventsForRender pushes these
function a1Tall(x,y,draw,show){ A1.tall.push({x,y,draw,show}); }
function a1BuildWorld(){
  A1W.on=true; A1.build=true;
  const C=A1W.ash, cw=A1W.cw;
  // ---- the Ash Ward: the moat ring, the charred causeway, posts, the banner and the signs
  PONDS.push({x:C.x,y:C.y,r:C.ro,inner:C.ri}); ISLES.push({x:cw.isle[0],y:cw.isle[1],r:cw.isle[2]});
  for(const [a,b] of cw.planks){ const m=a1At((a+b)/2); BRIDGES.push({x:m[0],y:m[1],ang:cw.ang,len:b-a,w:52,kind:'a1_char'}); }
  { const [P0,P1]=cw.jet; BRIDGES.push({x:(P0[0]+P1[0])/2,y:(P0[1]+P1[1])/2,ang:angTo(P0[0],P0[1],P1[0],P1[1]),len:dist(P0[0],P0[1],P1[0],P1[1])+20,w:52,kind:'a1_char'}); }
  const posts=[]; for(const [a,b] of cw.gaps) for(const t of [a,b]) for(const o of [-24,24]) posts.push(a1At(t+(t===a?-4:4),o));
  for(const [px,py] of posts){ addCol({t:'c',x:px,y:py,r:5,low:true}); a1Tall(px,py+2,()=>a1DrawPost(px,py),()=>true); }
  { const s=a1At(428,26); a1Tall(s[0],s[1]+4,()=>a1DrawSignPost(s[0],s[1],'oath'),()=>true); }
  { const b=a1At(312,-6); a1Art('a1_cwbanner',b[0],b[1],(o,t)=>a1DrawBanner(o.x,o.y,t)); }
  { const s=a1At(-30,34); a1Lm({id:'a1_causeway',x:s[0],y:s[1],r:0,prompt:S('Look at the broken causeway','Look at the causeway'),act:()=>a1say(STORY.a1_causeway_blocked)}); a1Tall(s[0],s[1]+2,()=>a1DrawSignPost(s[0],s[1],'warn'),()=>true); }
  { const v=[0.868,-0.496], s=[C.x+v[0]*640,C.y+v[1]*640]; addLandmark({id:'a1_eastsign',k:'sign',x:s[0],y:s[1],r:8,noNudge:true,prompt:'Read the sign',text:S('THE EAST BRIDGE BURNED DOWN. (THE OATH DID IT.) THE OLD CAUSEWAY IS ON THE SOUTH SIDE, BY THE ROAD FROM BRINDLECROSS.','The east bridge burned. Use the old causeway in the south.')});
    for(const k of [-1,1]){ const q=[C.x+v[0]*(600+18)+(-v[1])*k*24,C.y+v[1]*(600+18)+v[0]*k*24]; a1Tall(q[0],q[1],()=>a1DrawPost(q[0],q[1]),()=>true); } }
  // ---- the Crag Ward on top of the Nest Spire
  const SP=A1W.spire; a1MoveWard('crag',SP.ward[0],SP.ward[1]);
  for(let i=STRUCTS.length-1;i>=0;i--){ const q=STRUCTS[i]; if(q.k!=='boulder') continue; if(dist(q.x,q.y,SP.x,SP.y)>SP.r+70&&!(Math.abs(q.x-SP.x)<SP.r+40&&q.y>SP.y&&q.y<SP.y+SP.r+130)) continue; STRUCTS.splice(i,1); const gone=[]; forCols(q.x,q.y,4,c=>{ if(c.t==='c'&&Math.abs(c.x-q.x)<0.5&&Math.abs(c.y-q.y)<0.5) gone.push(c); }); gone.forEach(removeCol); }
  a1Lm({id:'a1_nestspire',x:SP.vx-96,y:SP.vy-12,r:0,prompt:S('Look up at the Nest Spire','Look up at the spire'),act:()=>a1say(hasAbil('wings')?STORY.a1_crag_how:STORY.a1_crag_up)});
  a1Art('a1_spirenest',SP.ward[0],SP.ward[1]+4,(o,t)=>a1DrawNest(o.x,o.y,t));
  REACH.clear.push({x:SP.x,y:SP.y,r:SP.r+70},{x:SP.vx,y:SP.vy,r:SP.vr+60});
  // ---- the Sunken Ward on its islet in the Gloam Swirl
  const GP=A1W.gloam; PONDS.push({x:GP.x,y:GP.y,r:GP.r}); ISLES.push({x:GP.x,y:GP.y,r:GP.isle});
  a1MoveWard('mire',GP.ward[0],GP.ward[1]);
  for(let i=STRUCTS.length-1;i>=0;i--){ const q=STRUCTS[i]; if(q.k!=='post'||dist(q.x,q.y,GP.x,GP.y)>GP.r+30) continue; STRUCTS.splice(i,1); const gone=[]; forCols(q.x,q.y,4,c=>{ if(c.t==='c'&&Math.abs(c.x-q.x)<0.5&&Math.abs(c.y-q.y)<0.5) gone.push(c); }); gone.forEach(removeCol); }
  a1Lm({id:'a1_swirl',x:GP.look[0],y:GP.look[1],r:0,prompt:S('Look at the swirling water','Look at the swirl'),act:()=>a1say(STORY.a1_swirl_look)});
  // ---- the Frost Ward in its ice block, and the three frost lanterns on ice pillars ringed with spikes
  const FW=WARDS.frost;
  a1Tall(FW.x,FW.y+14,()=>a1DrawIceBlock(FW.x,FW.y),()=>!G.flags.a1_frost_melted&&!G.wards.frost);
  a1Lm({id:'a1_frostshell',x:FW.x,y:FW.y+44,r:0,prompt:S('Look at the ice','Look at the ice'),hidden:()=>!!(G.flags.a1_frost_melted||G.wards.frost),act:()=>a1say(STORY.a1_frost_ice)});
  A1W.frost.lan.forEach(([x,y],i)=>{
    addCol({t:'c',x,y,r:20});   // the pillar: arrows stick in it (and light the lantern when they burn)
    const n=14; for(let k=0;k<n;k++){ const a=k/n*TAU; addCol({t:'c',x:x+Math.cos(a)*A1W.frost.ring,y:y+Math.sin(a)*A1W.frost.ring*0.86,r:13,noProj:true}); }
    a1Tall(x,y+10,()=>a1DrawFrostLantern(x,y,i,G.time),()=>true);
    REACH.clear.push({x,y,r:A1W.frost.ring+26});
  });
  // ---- the Anvil Rock on the Ashen Road ridge
  const AV=A1W.anvil; addCol({t:'c',x:AV.x,y:AV.y,r:38});
  a1Tall(AV.x,AV.y+20,()=>a1DrawAnvil(AV.x,AV.y,G.time),()=>true);
  AV.pits.forEach(([x,y,hi],i)=>{ if(hi){ addCol({t:'c',x,y,r:24}); const n=12; for(let k=0;k<n;k++){ const a=k/n*TAU; addCol({t:'c',x:x+Math.cos(a)*64,y:y+Math.sin(a)*52,r:14,noProj:true}); } a1Tall(x,y+16,()=>a1DrawPit(x,y,i,true,G.time),()=>true); } else { addCol({t:'c',x,y,r:15,low:true}); a1Tall(x,y+6,()=>a1DrawPit(x,y,i,false,G.time),()=>true); } });
  // while the rock glows and Ash holds the hammer, no prompt: the attack button must smash, not look
  a1Lm({id:'a1_anvil',x:AV.x,y:AV.y+48,r:0,prompt:()=>G&&a1on('a1_bram',1)&&curWeapon()==='hammer'?'':S('Look at the Anvil Rock','Look at the Anvil Rock'),act:a1AnvilLook});
  REACH.clear.push({x:AV.x,y:AV.y-30,r:240});
  // ---- the stranger's camp at the old Southern Pass rockfall, and the pass sign
  const CP=A1W.camp; a1Lm({id:'a1_camp',x:CP.x,y:CP.y,r:0,prompt:()=>a1CampPrompt(),act:a1CampAct,draw:(o,t)=>a1DrawCamp(o.x,o.y,t)});
  addLandmark({id:'a1_passsign',k:'sign',x:A1W.sign.x,y:A1W.sign.y,r:8,noNudge:true,prompt:'Read the sign',get text(){ return G.flags.act1_done?S('SOUTHERN PASS. Two hundred and six steps down to the Clockwork Coast. (Somebody has moved the rocks. Somebody strong.)','SOUTHERN PASS. 206 steps down to the coast.'):S('SOUTHERN PASS. CLOSED BY ROCKFALL. NO ENTRY. (SOMEONE HAS BEEN CLIMBING OVER IT. RECENTLY.)','SOUTHERN PASS. CLOSED. (Someone climbed over it!)'); }});
  a1Tall(A1W.rockfall.x,A1W.rockfall.y,()=>a1DrawRockfall(A1W.rockfall.x,A1W.rockfall.y,!G.flags.act1_done),()=>true);
  addCol({t:'c',x:A1W.rockfall.x+18,y:A1W.rockfall.y-6,r:30});
  REACH.clear.push({x:CP.x,y:CP.y,r:150},{x:A1W.rockfall.x,y:A1W.rockfall.y,r:90});
  // ---- the Wardens' vault under the Brindlecross bridge (pie), the tunnel's mine cart (gate), the ferry landing (lure)
  a1Lm({id:'a1_vault',x:A1W.vault.x,y:A1W.vault.y,r:0,prompt:()=>G.found.a1_vault?S('Look at the Wardens’ names','Look at the names'):S('Look under the bridge','Look under the bridge'),act:a1VaultAct,draw:(o,t)=>a1DrawVault(o.x,o.y,t)});
  { const m=CAVEMOUTHS.find(q=>q.area==='tunnel')||{x:8700,y:5950}; const ca=[m.x-118,m.y+22]; A1W.cartA={x:ca[0],y:ca[1]};
    a1Lm({id:'a1_cart',x:ca[0],y:ca[1],r:0,prompt:()=>G.flags.tunnel_plans?S('Ride the Oath’s mine cart to the Gatewatch hills','Ride the mine cart'):S('Look at the old mine cart','Look at the mine cart'),act:()=>a1Cart(0),draw:(o,t)=>a1DrawCart(o.x,o.y,t)});
    a1Lm({id:'a1_cartback',x:A1W.cartB.x,y:A1W.cartB.y,r:0,prompt:()=>G.flags.tunnel_plans?S('Ride the mine cart back to the Ashen Road','Ride the cart back'):S('Look at the old mine cart','Look at the mine cart'),act:()=>a1Cart(1),draw:(o,t)=>a1DrawCart(o.x,o.y,t)});
    REACH.clear.push({x:ca[0],y:ca[1],r:60},{x:A1W.cartB.x,y:A1W.cartB.y,r:70}); }
  { const f=a1DryNear(A1W.ferry.x,A1W.ferry.y); A1W.ferry.x=f.x; A1W.ferry.y=f.y;
    a1Lm({id:'a1_mireferry',x:f.x,y:f.y,r:0,prompt:()=>a1q('lure')?S('Row the Soggy Biscuit Two back to Brindlecross','Row back to Brindlecross'):S('Look at the old landing','Look at the landing'),act:a1FerryBack,draw:(o,t)=>a1DrawBoat(o.x,o.y,t,a1q('lure'))});
    REACH.clear.push({x:f.x,y:f.y,r:70}); }
  // ---- Ember's Nursery at the top of the Goatstair: a goat-sized cave, the rifts and fences on the way up
  const D0=A1W.door, m={area:'a1_nursery',x:D0.x,y:D0.y,name:AREADEFS.a1_nursery.name}; CAVEMOUTHS.push(m);
  STRUCTS.push({k:'cavemouth',x:D0.x,y:D0.y,ref:m,theme:'leap'});
  for(let a=Math.PI*1.1;a<=Math.PI*1.9+0.01;a+=Math.PI*0.2) addCol({t:'c',x:D0.x+Math.cos(a)*58,y:D0.y+Math.sin(a)*46,r:26});
  DOORS.push({x:D0.x,y:D0.y+14,area:'a1_nursery',get label(){ return a1NurseryOpen()?S('Squeeze into the little cave','Go into the little cave'):S('Look at the little cave','Look at the little cave'); },outY:46,cave:true});
  for(const F of A1W.goat.fences){ const [x,y,len,ang]=F; const n=Math.round(len/16); for(let k=0;k<=n;k++){ const u=-len/2+k*len/n; addCol({t:'c',x:x+Math.cos(ang)*u,y:y+Math.sin(ang)*u,r:7,low:true}); } a1Tall(x,y+4,()=>a1DrawFence(F),()=>true); }
  REACH.clear.push({x:D0.x,y:D0.y,r:130});
  for(let i=0;i<A1W.goat.path.length-1;i++){ const [ax,ay]=A1W.goat.path[i], [bx,by]=A1W.goat.path[i+1]; const n=Math.ceil(dist(ax,ay,bx,by)/60); for(let k=0;k<=n;k++) REACH.clear.push({x:lerp(ax,bx,k/n),y:lerp(ay,by,k/n),r:56}); }
  for(const R of A1W.goat.rifts) REACH.clear.push({x:R[0],y:R[1],r:R[2]+24});
  { const s=[3360,4985]; addLandmark({id:'a1_goatsign',k:'sign',x:s[0],y:s[1],r:8,noNudge:true,prompt:'Read the sign',text:S('THE GOATSTAIR. FOR GOATS. (NOT FOR DRAGONS. NOT FOR FARMERS. FOR GOATS.)','THE GOATSTAIR. FOR GOATS ONLY.')}); }
  // ---- the Lake King's race course: seven rings on Lake Mirrow (pulled onto open water)
  A1W.race=a1RaceCourse();
  // ---- nothing the stock build placed may end up in the new water, a rift or the spire
  const bad=(x,y)=>a1Moat(x,y)||a1Rift(x,y)||pondD(x,y)<20||(elevFace(x,y)&1)||dist(x,y,SP.x,SP.y)<SP.r+30;
  const move=o=>{ for(let d=30;d<600;d+=26) for(let a=0;a<TAU;a+=0.4){ const x=o.x+Math.cos(a)*d, y=o.y+Math.sin(a)*d; if(!bad(x,y)&&!blockedAt(x,y)&&!inClearing(x,y,10)){ o.x=x; o.y=y; return true; } } return false; };
  for(const c of CHESTS) if(mapAt(c.y)===0&&bad(c.x,c.y)) move(c);
  for(const l of LILIES) if(bad(l.x,l.y)) move(l);
  for(const o of LANDMARKS){ if(!o.id||String(o.id).startsWith('a1_')||o.noNudge||mapAt(o.y)!==0) continue; if(bad(o.x,o.y)&&move(o)&&o.colRef){ removeCol(o.colRef); o.colRef=addCol({t:'c',x:o.x,y:o.y,r:o.r}); } }
  mapListsReset(); BIGOAKS=null; OCCS=null;
}
function a1DryNear(x,y){ for(let d=0;d<400;d+=20) for(let a=0;a<TAU;a+=0.5){ const px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; const s=T(px,py,{}); if(!s.water&&!blockedAt(px,py)&&s.bog<0.3) return {x:px,y:py}; } return {x,y}; }
// eventsForRender: our tall things sort with the characters
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ if(!G||G.mode!=='story'||AREA) return; for(const q of A1.tall){ if(!inView(q.x,q.y,140)) continue; if(q.show&&!q.show()) continue; list.push({x:q.x,y:q.y,draw:q.draw}); } a1RenderExtra(list); }catch(e){ console.error(e); } }; }

// ---------- 7. Ember's Nursery (a1_hop): four little rooms at the top of the Goatstair (bible 3.2)
// a Hay Hall (push the bales into the pits), b Hoofprint Bridge (follow Duchess's prints, jump the two bare tiles),
// c the Spark Stone (Ember's shrine: Double Jump), d the Wide Gap (a 4-cell pit and a step face; the warp home)
function a1BridgeTpl(){
  const P=[[7,9],[7,8],[6,8],[5,8],[5,7],[5,6],[5,4],[5,3],[6,3],[7,3],[8,3],[9,3],[11,3],[12,3],[12,2],[12,1]], gap=[[5,5],[10,3]];
  const g=[]; for(let r=0;r<11;r++) g.push(Array(15).fill(r===0||r===10?'.':'o'));
  const has=(L,c,r)=>L.some(q=>q[0]===c&&q[1]===r);
  for(const [c,r] of P) g[r][c]='.';
  for(const [c,r] of P) for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){ const cc=c+dc, rr=r+dr; if(rr<1||rr>9||cc<0||cc>14||has(P,cc,rr)||has(gap,cc,rr)) continue; if(gap.some(([gc,gr])=>Math.abs(gc-cc)+Math.abs(gr-rr)===1)) continue; g[rr][cc]='k'; }
  return {rows:g.map(r=>r.join('')),path:P,gap};
}
const A1N={bridge:a1BridgeTpl(),
  a:['...............','...............','ooooooooooooooo','ooooooooooooooo','ooooooooooooooo','...............','.......B.......','..........B....','.......B.......','....s.......S..','...............'],
  c:['...............','...............','...g.......g...','...............','.......D.......','...............','...g.......g...','...............','...............','...............','...............'],
  d:['...............','..........=====','..........=====','...oooo...=====','...oooo...=====','...oooo...==W==','...oooo...=====','...oooo...=====','..........=====','..........=====','...............']};
defineDungeon('a1_nursery',{name:S('Ember’s Nursery','Ember’s Nursery'),level:4,theme:'leap',seed:913,save:'a1_nursery',abil:'dbljump',abilName:S('Double Jump','Double Jump'),
  dunKind:S('A little cave','A little cave'),noJuniper:true,dark:0.42,
  story:{
    in:[xl('narr',`The cave smells like straw and old smoke. Someone has drawn on every wall, in charcoal, very small, very carefully.`,`It smells like straw and smoke. There are drawings on every wall.`),
      xl('narr',`A big red dragon. A little red dragon. The little one is always jumping.`,`A big red dragon. A little red dragon. The little one is always jumping.`)],
    shrine:[xl('ember',`Oh! Oh, you found it. My nursery. Nobody's found it in a thousand years. Except, apparently, a goat.`,`Oh! You found my nursery! Only a goat found it before.`),
      xl('ash',`Ember? This was YOURS?`,`Ember? This was YOURS?`),
      xl('ember',`When I was little I used to sneak down from the mountain and play here. The goats on these cliffs taught me how to jump twice. Off nothing.`,`I played here when I was little. The goats taught me to jump twice!`),
      xl('ember',`Don't tell my father. He thought jumping was undignified. He was wrong about a lot of things.`,`Don't tell my father. He thought jumping was silly.`),
      xl('ember',`I left a little spark here, in case one of my children ever came to play. It seems a goat got to it first. Well. Goats count.`,`I left a spark here for my children. A goat found it first. Goats count.`)],
    gift:[ch('ember',S(`Touch the stone, Ash. It tickles.`,`Touch the stone. It tickles.`),[
        {t:S(`Touch it`,`Touch it`),tone:'brave',then:[xl('narr',`It tickles your claws, then your knees, then the very tip of your tail.`,`It tickles your claws, your knees and your tail!`)]},
        {t:S(`Let Duchess touch it first`,`Let Duchess go first`),tone:'silly',then:[a1Goat('Meh.'),xl('narr',`Duchess licks the stone. It does not mind. Then you touch it too, and it tickles all the way to the tip of your tail.`,`Duchess licks the stone. Then you touch it. It tickles!`)]}]),
      xl('ember',`Now jump. And when you're up in the air and there's nothing under you, jump again. Trust the nothing. The nothing is on your side.`,`Now jump. Then jump again in the air. Trust the air!`)],
    how:S('Jump, then press jump again at the top. Jump twice to cross wide gaps and hop up short ledges.','Jump. Then jump again in the air!')},
  floors:[{id:'1',name:'',map:{
    rooms:{
      a:{at:[1,2],kind:'start',tpl:A1N.a,sign:S('EMBER’S ROOM. NO GROWN-UPS. NO FATHERS. (Push the hay bales into the holes.)','EMBER’S ROOM. NO GROWN-UPS. (Push the hay into the holes.)'),noPots:true,noDecor:true},
      b:{at:[1,1],kind:'free',tpl:A1N.bridge.rows,noPots:true,noDecor:true},
      c:{at:[1,0],kind:'shrine',tpl:A1N.c,noPots:true},
      d:{at:[2,0],kind:'free',tpl:A1N.d,noPots:true,noDecor:true}},
    links:[['a','b','open'],['b','c','open'],['c','d','gate:c']]}}]});
STORY.a1_hop_after=[xl('ash',`I jumped on the AIR. Duchess. Duchess, I jumped on the air.`,`I jumped on the AIR, Duchess!`),a1Goat('Meh.'),xl('ash',`Yeah, you've done it before. Don't brag.`,`Yeah, you did it first. Don't brag.`)];
const a1InNursery=()=>!!(AREA&&AREA.def&&dunRoot(AREA.def.id)==='a1_nursery');
function a1NurseryOpen(){ return !!(G.flags.a1_hop_follow||a1q('a1_hop')||G.flags.a1_hop_gift); }
// the gift itself: the shrine gives Double Jump (or, for a dragon who already jumps twice, just the story)
function a1NurseryGift(){
  const A=AREA; if(!A) return;
  G.flags.a1_hop_gift=true; G.flags.trial_a1_nursery_done=true;
  const R=A.rooms&&A.rooms.c; if(R&&!R.solved) solveRoom(R,true);
  if(G.side.duchess!=='follow'&&G.comp!=='duchess'){ G.side.duchess='follow'; placeGoat(); }
  later(3.8,()=>{ if(scene==='play') a1say(STORY.a1_hop_after); });
  questPoke(); saveGame();
}
{ const base=grantAbility; grantAbility=function(id){ base(id); try{ if(id==='dbljump'&&a1InNursery()) a1NurseryGift(); }catch(e){ console.error(e); } }; }
{ const base=trialObjAct; trialObjAct=function(o){
  if(a1InNursery()&&o&&o.tobj==='shrine'&&hasAbil('dbljump')&&!G.flags.a1_hop_gift){
    runDialogue(STORY.trial_a1_nursery_shrine.concat(STORY.trial_a1_nursery_gift),()=>{ scene='play'; player.hp=player.maxHp; player.potions=player.potionsMax; jingle('levelup','level'); flashA=0.4; flashCol='255,214,140';
      setBanner(S('Ember’s Spark','Ember’s Spark'),S('You already jump twice. Now you know who taught the goats.','You can already jump twice!'),3.2); a1NurseryGift(); });
    return true; }
  return base.apply(this,arguments); }; }
// the step face in the Wide Gap: a double jump hops up onto the raised floor
{ const base=dunCheck; dunCheck=function(k,x,y,air,fly){
  const r=base(k,x,y,air,fly);
  if(r==='wall'&&a1InNursery()&&air&&player.dbl&&(player.z||0)>6){ const T=AREA.tri; if(T&&T.lx!=null){ const f=tCell(T.lx,T.ly); if(f>=0&&dunH(f)===0&&dunH(k)===1) return null; } }
  return r; }; }
// only Duchess knows the way in, at first
{ const base=enterArea; enterArea=function(id,door){
  if(id==='a1_nursery'&&G&&G.mode==='story'&&!a1NurseryOpen()){ a1say([xl('narr',`A goat-sized hole in the chalk, stuffed with straw. It smells like goat. It is far too dark to go in without someone who knows the way.`,`A little cave full of straw. It smells like goat. Too dark to go in alone.`),
      {who:'narr',text:S(`Farmer Hollis's goat Duchess comes up here every morning. Maybe she knows the way.`,`Hollis's goat Duchess comes here. Maybe she knows the way.`),skipIf:()=>!!G.quests.a1_hop}]); return; }
  return base.apply(this,arguments); }; }
// the hay bales, the hoofprints, Duchess waiting, and Ember's drawings on the shrine walls
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){
  base.apply(this,arguments);
  try{ if(!def||dunRoot(def.id)!=='a1_nursery') return;
    const c=A.cave, cs=c.cell, at=(R,i,j)=>({x:A.x0+(R.ox+1+i+0.5)*cs,y:A.y0+(R.oy+1+j+0.5)*cs});
    const Rb=A.rooms.b, Ra=A.rooms.a, Rc=A.rooms.c;
    if(Rb) A1N.bridge.path.forEach(([i,j],n)=>{ const p=at(Rb,i,j); A.objs.push({k:'a1_hoof',x:p.x,y:p.y,n,id:'a1h'+n}); });
    if(Ra){ const p=at(Ra,10,0); A.objs.push({k:'a1_goatnpc',x:p.x,y:p.y,id:'a1ga',smug:true}); }
    if(Rc){ const p=at(Rc,9,5); A.objs.push({k:'a1_goatnpc',x:p.x,y:p.y,id:'a1gc'});
      [[1,0,0],[4,0,1],[10,0,2],[13,0,3],[0,4,4],[14,7,5]].forEach(([i,j,v])=>{ const q=at(Rc,i,j); A.objs.push({k:'a1_draw',x:q.x,y:q.y-14,v,id:'a1d'+v}); }); }
    for(const R of Object.values(A.rooms)) for(let n=0;n<5;n++){ const i=(n*37+R.ox*3)%15, j=(n*23+R.oy*5)%11, k=(R.oy+1+j)*c.w+(R.ox+1+i); if(c.typ[k]===0&&c.grid[k]===0){ const p=at(R,i,j); A.objs.push({k:'a1_straw',x:p.x,y:p.y,v:n,id:'a1s'+R.id+n}); } }
  }catch(e){ console.error(e); } }; }
{ const base=caveObjAct; caveObjAct=function(o){
  if(a1InNursery()&&o&&o.k==='block'){ a1say([xl('narr',`A big hay bale. Walk into it to push it. If it gets stuck, the rune stone puts the bales back.`,`A hay bale. Walk into it to push it.`)]); return true; }
  return base.apply(this,arguments); }; }

// ---------- 8. the gates at run time
const a1Ctl=k=>{ try{ return balCtls()[k]; }catch(e){ return k; } };
const a1Air=()=>!!(player&&(player.flying||(player.z||0)>0));
// on top of the Nest Spire (or flying over its top)
function a1OnSpire(){ const S0=A1W.spire, p=player; if(!p) return false; const d=dist(p.x,p.y,S0.x,S0.y); if(d>S0.r+6) return false; return elevLvl(p.x,p.y)>=2||!!p.flying; }
// which Wards a breath may light: the Crag Ward only from the spire top, the Frost Ward only once the ice is gone
{ const base=wardCanLight; wardCanLight=function(id){
  if(G&&G.mode==='story'&&A1W.on&&!AREA){ if(id==='crag'&&!a1OnSpire()) return false; if(id==='frost'&&!G.flags.a1_frost_melted) return false; }
  return base(id); }; }
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){
  try{ if(G&&G.mode==='story'&&!AREA&&A1W.on) a1Breath(mx,my,ang,dt); }catch(e){ console.error(e); }
  base(mx,my,ang,dt); }; }
function a1Breath(mx,my,ang,dt){
  const hit=(x,y,r)=>inArcC(mx,my,ang,175,0.45,{x,y,r});
  const C=WARDS.crag, S0=A1W.spire; if(C&&!G.wards.crag&&G.wardReady.crag&&!a1OnSpire()&&(hit(C.x,C.y,24)||(dist(player.x,player.y,S0.x,S0.y)<S0.r+320&&inArcC(mx,my,ang,330,0.6,{x:S0.x,y:S0.y,r:S0.r})))){ G.wardMsgT=3; a1note('crag_low',`Too far down! Fly up onto the Nest Spire, then breathe on the Ward.`,`Too low! Fly up onto the spire first.`,3); }
  const F=WARDS.frost; if(F&&!G.wards.frost&&!G.flags.a1_frost_melted&&hit(F.x,F.y,26)){ G.wardMsgT=3; a1note('frost_ice',`It is frozen solid. Light the three lanterns on the cliff to melt the ice.`,`Frozen! Light the three lanterns up high.`,3); }
  A1W.frost.lan.forEach(([x,y],i)=>{ if(!G.flags['a1_frost_'+(i+1)]&&hit(x,y-60,22)) a1note('frost_lan',`Too high for your breath! Breathe fire and shoot an arrow through it.`,`Too high! Shoot a fire arrow through your breath.`,4); });
  // the low forge-pits by the Anvil Rock light from a breath
  if(a1on('a1_bram',0)) A1W.anvil.pits.forEach(([x,y,hi],i)=>{ if(hi) { if(hit(x,y-50,24)) a1note('pit_hi',`That pit is up on the rock. A fire arrow or a burning Wing-rang can reach it.`,`Too high! Use a fire arrow or a fire Wing-rang.`,4); return; } if(hit(x,y,18)) a1PitLight(i); });
  // Pip's lessons that need a breath
  const L=A1.pipL; if(L&&L.id==='mire'&&L.ph==='dry'&&G.pip&&hit(G.pip.x,G.pip.y,16)){ L.h+=dt; L.on=true; }
  if(L&&L.id==='frost'&&L.ph==='warm'){ const W=WARDS.frost; if(hit(W.x,W.y,28)){ L.h+=dt; L.on=true; } }
}
// fire that lands somewhere (a burning arrow sticking, a burning arrow or Wing-rang flying by): the frost lanterns and the high forge-pit
{ const base=wIgnite; wIgnite=function(x,y,r,heat){ base(x,y,r,heat); try{ if(G&&G.mode==='story'&&!AREA&&A1W.on) a1FireAt(x,y,r); }catch(e){ console.error(e); } }; }
function a1RangAt(x,y){ return G.wproj.some(q=>q.k==='rang'&&q.fire&&!q.dead&&dist2(q.x,q.y,x,y)<36); }
function a1FireAt(x,y,r){
  A1W.frost.lan.forEach(([lx,ly],i)=>{
    const k='a1_frost_'+(i+1); if(G.flags[k]||dist(x,y,lx,ly)>r+34) return;
    if(a1RangAt(x,y)&&!a1easy()){ a1note('lan_rang',`The Wing-rang's flame is too small up there. Use a fire arrow.`,`Use a fire arrow for this one.`,4); return; }
    if(!G.bossDone.greymane){ a1note('lan_cold',`The lantern is frozen hard. Greymane's cold is too strong right now.`,`Too cold! Beat Greymane first.`,4); return; }
    G.flags[k]=true; SFX.play('shrine'); emit(lx,ly-64,26,{kind:'fire',ang:-Math.PI/2,spread:1.1,smin:30,smax:140,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:5});
    const n=[1,2,3].filter(j=>G.flags['a1_frost_'+j]).length;
    if(n<3) setBanner(S(`${n} of 3 frost lanterns lit`,`${n} of 3 lanterns lit`),'',1.8);
    else a1Melt();
    saveGame();
  });
  if(a1on('a1_bram',0)){ const [px,py]=A1W.anvil.pits[2]; if(dist(x,y,px,py)<r+40) a1PitLight(2); }
}
function a1Melt(){
  if(G.flags.a1_frost_melted) return; G.flags.a1_frost_melted=true;
  const F=WARDS.frost; shake(8); SFX.play('boom'); emit(F.x,F.y-20,50,{col:'210,240,255',glow:false,smin:60,smax:260,lmin:.5,lmax:1.2,zmin:2,zmax:5});
  later(0.6,()=>a1say(STORY.a1_frost_melt,()=>questPoke()));
}
// arrows that hit a lantern without fire: the first time, a hint
function a1ArrowHints(){
  for(const s of G.wstuck){ if(s.t>0.05||s.fire||s.a1seen) continue; s.a1seen=true; for(const [lx,ly] of A1W.frost.lan) if(dist2(s.x,s.y,lx,ly)<50*50){ a1note('lan_cold2',`Thunk. It needs fire! Breathe fire and shoot an arrow through it.`,`It needs fire! Shoot through your breath.`,4); mvTip(S('Fire arrows','Fire arrows'),S(`Hold ${a1Ctl('fire')} to breathe fire, and shoot an arrow through the flames. The arrow catches fire!`,`Breathe fire. Shoot an arrow through it!`),8,'a1_firearrow'); } }
}

// ---------- the Anvil Rock (a1_bram): three forge-pits, then a full hammer smash, then the stragglers
function a1PitLight(i){
  const P=A1.pits||(A1.pits=[0,0,0]); const burn=a1easy()?18:12;
  if(P[i]>G.time) { P[i]=G.time+burn; return; }
  P[i]=G.time+burn; const [x,y,hi]=A1W.anvil.pits[i]; SFX.play('shrine'); emit(x,y-(hi?50:0),18,{kind:'fire',ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:4});
  const n=P.filter(t=>t>G.time).length;
  if(n<3) setBanner(S(`${n} of 3 forge-pits burning`,`${n} of 3 fires lit`),S('Quick, before the first one cools!','Hurry!'),1.8);
  else if(!G.flags.a1_bram_hot){ G.flags.a1_bram_hot=true; shake(5); SFX.play('boom'); setBanner(S('The Anvil Rock glows!','The rock glows!'),S('Now hit the hammer head with a fully charged smash.','Now a big hammer smash!'),3); questPoke(); saveGame(); }
}
function a1AnvilLook(){
  const L=[xl('narr',`A black iron rock, as big as a cart. In the top of it, buried up to the neck, a hammer head the size of your whole body.`,`A big black rock. A huge hammer head is stuck in the top.`)];
  if(G.flags.a1_bram_free) L[0]=xl('narr',`The Anvil Rock, with a hammer-shaped hole in the top. It looks a little lonely now.`,`The rock has a hammer-shaped hole now.`);
  else if(G.quests.a1_bram){ L.push(xl('bram',`(from far away, very proud) THAT'S where I left it! Heat it up first, kid. Then hit it like it owes you money.`,`(far away) That's it! Heat it up. Then hit it hard!`));
    if(a1on('a1_bram',0)) L.push(xl('narr',`Three old forge-pits stand around the rock. One is high up on a pillar. Light all three at once. The high one first!`,`Light the three fire pits at once. The high one first!`));
    if(a1on('a1_bram',1)) L.push(xl('narr',`The rock glows red. Hold the attack button to charge the hammer all the way, then let go right on top of it.`,`It glows! Charge the hammer all the way. Smash it!`),{who:'narr',text:S('You will need the Forge Hammer for that. Mom makes them.','You need the hammer. Mom makes them.'),skipIf:()=>!!(G.weapons&&G.weapons.hammer)},
      {who:'narr',text:S(`Switch to the Forge Hammer first (${a1WpnKey()} changes weapons).`,`Pick the hammer first (${a1WpnKey()}).`),skipIf:()=>!(G.weapons&&G.weapons.hammer)||curWeapon()==='hammer'}); }
  else if(G.wards.ash&&G.weapons&&G.weapons.hammer) L.push(xl('narr',`Mom would love to see this.`,`Mom would love this.`));
  a1say(L);
}
function a1AnvilSmash(h,ix,iy){
  const AV=A1W.anvil; if(dist(ix,iy,AV.x,AV.y)>92) return;
  if((h.ch||0)<0.95){ a1note('anvil_weak',`CLINK. Not hard enough! Hold the attack button until the hammer glows, then let go.`,`Not hard enough! Charge it all the way.`,3); return; }
  G.flags.a1_bram_free=true; giveItems({a1_thunder:1},true); shake(14); SFX.play('boom'); flashA=0.4; flashCol='255,230,180';
  emit(AV.x,AV.y-40,50,{col:'255,210,140',smin:80,smax:320,lmin:.4,lmax:1,zmin:2,zmax:5});
  later(0.5,()=>a1say([xl('narr',`CLANG. The whole ridge rings like a bell. Old Thunder pops out of the rock and lands at your feet with a THUD that knocks you over.`,`CLANG! Old Thunder pops out of the rock. THUD!`),
    xl('narr',`From the rocks behind you: "Brothers! The Emberblood has the Warden's hammer! Get it!"`,`From the rocks: "Brothers! Get the hammer!"`),
    xl('ash',`Of course there are more of them. There are always more of them.`,`Of course there are more of them.`)],()=>{ questPoke(); a1StragSpawn(); }));
}
function a1StragSpawn(){
  if(A1.strag&&A1.strag.some(e=>!e.dead)) return;
  const AV=A1W.anvil, L=Math.max(3,(player.level|0)-1), out=[];
  const at=(dx,dy)=>{ const s=spotNear(AV.x+dx,AV.y+dy,0,90); return s; };
  const k=at(0,-260); const boss=makeEnemy('knight',k.x,k.y,{level:L+1,aggro:true,elite:true,homeX:AV.x,homeY:AV.y,leash:1400}); boss.a1dross=true; out.push(boss);
  for(const [dx,dy] of [[-200,-180],[200,-180],[0,220]].slice(0,a1easy()?2:3)){ const s=at(dx,dy); out.push(makeEnemy('cultist',s.x,s.y,{level:L,aggro:true,homeX:AV.x,homeY:AV.y,leash:1400})); }
  for(const e of out){ e.spawnIn=0.4; puff(e.x,e.y); }
  A1.strag=out; taunt('a1_dross',S(`Brother Dross, of the Scaled Oath! That hammer is OURS. We were going to use it. For something. Probably bad.`,`I am Brother Dross! That hammer is ours!`));
}
function a1StragTick(){
  if(!a1on('a1_bram',2)) return;
  const AV=A1W.anvil, d=dist(player.x,player.y,AV.x,AV.y);
  if(!A1.strag){ if(d<650&&scene==='play') a1StragSpawn(); return; }
  if(d>1700){ for(const e of A1.strag) e.dead=true; A1.strag=null; return; }
  if(A1.strag.every(e=>e.dead)){ A1.strag=null; G.flags.a1_bram_won=true; taunt('a1_dross',S(`Ow. OW. Fine! Keep your hammer. I'm going home to tell my mum.`,`Ow! Fine, keep it. I'm telling my mum.`)); questPoke(); saveGame(); }
}

// ---------- the Gloam Swirl: a walker (or a jumper) is spun round and thrown back to the bank; a skimmer gets through
function a1Skimming(){ const p=player; return !!(p.onWater&&p.sprinting&&canSkim()&&!(p.z>0)&&!p.flying); }
function a1SwirlTick(dt){
  const GP=A1W.gloam, p=player, S0=A1.swirl;
  if(S0){ S0.t+=dt; const u=Math.min(1,S0.t/1.15); S0.a+=dt*(8-5*u); const r=lerp(S0.d0,GP.r+46,u*u);
    p.x=GP.x+Math.cos(S0.a)*r; p.y=GP.y+Math.sin(S0.a)*r; p.z=0; p.vz=0; p.kvx=p.kvy=0; p.iframes=Math.max(p.iframes,0.3); p.facing+=dt*14;
    if(Math.random()<0.6) G.ripples.push({x:p.x,y:p.y,t:0,max:0.7,r:14,splash:true});
    if(u>=1){ A1.swirl=null; const s=a1DryNear(p.x,p.y); p.x=s.x; p.y=s.y; p.safeX=s.x; p.safeY=s.y; MV.lx=p.x; MV.ly=p.y; moveReset(p); shake(3); SFX.play('pop');
      if(!G.flags.a1_swirl_seen){ G.flags.a1_swirl_seen=true; a1say(STORY.a1_swirl_thrown); }
      else a1note('swirl',hasAbil('skimmer')?`WHOOSH! Too slow. Sprint across and don't stop!`:`WHOOSH! Only a skimmer gets through.`,hasAbil('skimmer')?`Too slow! Run and don't stop!`:`Only a skimmer gets through!`,3); }
    return; }
  if(scene!=='play'||p.dead) return;
  const d=dist(p.x,p.y,GP.x,GP.y); if(d<GP.s0||d>GP.s1) return;
  if(a1Skimming()){ if(!G.flags.a1_skimtip){ G.flags.a1_skimtip=1; ftext(p.x,p.y-44,S('Skim, skim, skim!','Skim!'),'#bfefff',14); } return; }
  if(!(p.onWater||a1Air())) return;
  A1.swirl={t:0,a:angTo(GP.x,GP.y,p.x,p.y),d0:d}; SFX.play('roll'); ftext(p.x,p.y-40,'WHOOSH!','#bfe6ff',16);
}

// ---------- the Broken Causeway: hints at the gaps, the first crossing
function a1CausewayTick(){
  const c=A1W.cw, p=player; if(p.dead||scene!=='play'||p.flying) return;
  const rx=p.x-c.Q[0], ry=p.y-c.Q[1], t=rx*c.d[0]+ry*c.d[1], pp=Math.abs(rx*c.d[1]-ry*c.d[0]);
  if(t<-80||t>560||pp>60) { const dc=dist(p.x,p.y,A1W.ash.x,A1W.ash.y); if(dc>A1W.ash.ro-10&&dc<A1W.ash.ro+60&&!hasAbil('jump')&&G.stage==='oath'){ const ax=p.x+Math.cos(p.facing)*40, ay=p.y+Math.sin(p.facing)*40; if(a1Moat(ax,ay)&&p.moving) a1note('moat',`Black, sooty water all the way round. The road crosses on the old causeway.`,`Sooty water! Find the old causeway.`,6); } return; }
  for(const [a,b] of c.gaps){ if(t>a-30&&t<a+4&&p.moving&&!(p.z>0)){
    if(!hasAbil('jump')) a1note('gap',`The gap is too wide to step over. I need to jump! (The Trial of the Leap, in Whisperwood)`,`Too wide! I need to jump. Try the Trial of the Leap.`,5);
    else if(b-a>100) a1note('gap3',`The big one! Run at it and jump at the very end.`,`Big gap! Run and jump!`,6);
    else a1note('gapj',`Jump! (${a1Ctl('jump')})`,`Jump! (${a1Ctl('jump')})`,6); } }
  if(!G.flags.a1_cw_first&&t>440&&!(p.z>0)&&a1OnPlank(p.x,p.y)&&!G.bossDone.morrow){ G.flags.a1_cw_first=true; a1say(STORY.a1_causeway_first); }
}
// the foot of the Nest Spire: what Ash sees the first time
function a1SpireTick(){
  const S0=A1W.spire, p=player; if(G.wards.crag||scene!=='play'||p.dead) return;
  if(dist(p.x,p.y,S0.vx,S0.vy)<170&&!a1OnSpire()&&!G.flags.a1_crag_seen&&G.bossDone.broodmother){ G.flags.a1_crag_seen=true; a1say(hasAbil('wings')?STORY.a1_crag_how:STORY.a1_crag_up); }
  if(hasAbil('wings')&&dist(p.x,p.y,S0.vx,S0.vy)<S0.vr&&!p.flying&&G.bossDone.broodmother) a1note('vent',`Warm air! Jump, then fly (${a1Ctl('jump')} again). The draft lifts you up.`,`Jump and fly here!`,6);
}
// Greymane's ice: talking to it is a landmark; the first time Ash walks up after the fight, Tove speaks
function a1FrostTick(){
  const F=WARDS.frost, p=player; if(G.wards.frost||G.flags.a1_frost_melted||scene!=='play') return;
  if(G.bossDone.greymane&&!G.flags.a1_frost_seen&&dist(p.x,p.y,F.x,F.y)<200){ G.flags.a1_frost_seen=true; a1say(STORY.a1_frost_ice); }
  a1ArrowHints();
}
// Bog Boots: Gloamjaw's muck no longer slows Ash
{ const K=FZK.muck, base=K.tick; K.tick=function(z,dt){ const p=player, s=p?p.slowT:0; base(z,dt); if(p&&G.flags.perk_bog&&p.slowT>s&&!canWalkWater()){ p.slowT=s; if(!z.a1boots){ z.a1boots=1; ftext(p.x,p.y-60,S('Bog Boots! The muck can’t slow you.','Bog Boots! No slowing!'),'#d8e8a0',13); } } }; }

// ---------- 9. the minigames: follow Duchess up the Goatstair (a1_follow), race the Lake King (a1_skimrace)
function a1GoatDraw(g){ return {x:g.x,y:g.y,draw:()=>{ const z=g.z||0; ctx.save(); ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(g.x,g.y+6,10-z*0.06,4.5,0,0,TAU); ctx.fill(); ctx.translate(0,-z); drawNPC(g); ctx.restore(); }}; }
function a1SegHops(a,b){
  // what lies on the way from waypoint a to b: a wide rift (double hop), a narrow rift or a fence (one hop)
  let wide=false, hop=false; const n=Math.ceil(dist(a[0],a[1],b[0],b[1])/8);
  for(let k=1;k<n;k++){ const x=lerp(a[0],b[0],k/n), y=lerp(a[1],b[1],k/n), R=a1Rift(x,y); if(R){ if(R[5]==='w') wide=true; else hop=true; } }
  for(const F of A1W.goat.fences) if(segD(F[0],F[1],a[0],a[1],b[0],b[1])<24) hop=true;
  return wide?2:hop?1:0;
}
MINI.a1_follow={
  start(){
    const P=A1W.goat.path, g={kind:'goat',id:'a1goat',x:P[0][0],y:P[0][1],face:-Math.PI/2,t:0,r:10,z:0,moving:false};
    if(G.goat){ A1.goatSave={x:G.goat.x,y:G.goat.y,hx:G.goat.hx,hy:G.goat.hy}; G.goat.x=-99999; G.goat.y=-99999; G.goat.hx=G.goat.hy=-99999; }
    const p=player; if(dist(p.x,p.y,g.x,g.y)>260){ const s=spotNear(g.x+60,g.y+70,0,60); moveReset(p); p.x=s.x; p.y=s.y; }
    later(0.4,()=>setBanner(S('Follow Duchess!','Follow Duchess!'),S('Stay inside the ring. Jump the cracks after her.','Stay in the ring. Jump after her!'),3));
    return {g,i:1,R:a1easy()?420:320,away:0,wait:0,hop:null,wolves:null,music:'puzzle',said:{}};
  },
  update(M,dt){
    const g=M.g, P=A1W.goat.path, p=player; g.t+=dt;
    const d=dist(p.x,p.y,g.x,g.y);
    if(d>M.R){ M.away+=dt; if(M.away>6){ miniEnd(false,S('Duchess got bored and went home','Duchess went home'),S('Talk to Hollis to try again.','Talk to Hollis to try again.')); return; } } else M.away=0;
    // a hop in progress
    if(M.hop){ const H=M.hop; H.t+=dt; const u=Math.min(1,H.t/H.dur); g.x=lerp(H.ax,H.bx,u); g.y=lerp(H.ay,H.by,u);
      if(H.n===2){ const v=(u-0.45)/0.55; g.z=u<0.45?30*Math.sin(u/0.45*Math.PI/2):Math.max(0,30+26*Math.sin(v*Math.PI)-30*v*v); } else g.z=Math.sin(u*Math.PI)*30;
      if(H.n===2&&!H.puff&&u>0.45){ H.puff=true; emit(g.x,g.y-g.z,10,{col:'255,240,220',smin:30,smax:90,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); mvSnd('dbl',0.6); ftext(g.x,g.y-g.z-30,S('Meh!','Meh!'),'#fff4e0',13); }
      if(u>=1){ g.z=0; M.hop=null; if(H.n===2){ M.wait=5; if(!M.said['w'+M.i]){ M.said['w'+M.i]=1; setBanner(S('She jumped twice in the air!','She jumped twice!'),S('Too wide for you. Walk round the end of the crack.','Too wide! Walk round it.'),3); a1GoatWolves(M); } } }
      return; }
    if(M.wait>0){ M.wait-=dt; g.moving=false; if(d<170) M.wait=Math.min(M.wait,0.6); if(Math.random()<dt*0.6) ftext(g.x,g.y-30,S('*chew chew*','*chew*'),'#fff4e0',11); return; }
    if(M.i>=P.length){ if(d<170){ miniEnd(true,S('Duchess squeezed into a little cave!','Duchess found a cave!'),S('Follow her in!','Follow her in!')); } return; }
    const tgt=P[M.i], a=angTo(g.x,g.y,tgt[0],tgt[1]), dd=dist(g.x,g.y,tgt[0],tgt[1]);
    // she waits for Ash when he falls behind
    if(d>M.R*0.75&&M.lag<3){ M.lag=(M.lag||0)+dt; g.moving=false; g.face=turnTo(g.face,angTo(g.x,g.y,p.x,p.y),4*dt); if(!M.said.call||G.time-M.said.call>5){ M.said.call=G.time; ftext(g.x,g.y-30,S('MEH!','MEH!'),'#fff4e0',13); } return; }
    if(d<M.R*0.6) M.lag=0;
    const n=a1SegHops([g.x,g.y],tgt);
    if(n&&dd<(n===2?220:130)){ M.hop={ax:g.x,ay:g.y,bx:tgt[0],by:tgt[1],t:0,dur:n===2?1.05:0.6,n}; M.i++; g.face=a; if(n===1) mvSnd('jump',0.5); return; }
    const sp=(a1easy()?95:120)*dt; g.face=turnTo(g.face,a,6*dt); g.moving=true;
    if(dd<=sp+2){ g.x=tgt[0]; g.y=tgt[1]; M.i++; } else { g.x+=Math.cos(a)*sp; g.y+=Math.sin(a)*sp; }
  },
  end(M){ const S0=A1.goatSave; if(G.goat&&S0){ Object.assign(G.goat,S0); } A1.goatSave=null; if(M.wolves) for(const e of M.wolves) if(!e.dead){ e.dead=true; puff(e.x,e.y); } },
  target:M=>({x:M.g.x,y:M.g.y}),
  hud:M=>M.away>0?S(`Duchess is getting bored! ${Math.max(0,Math.ceil(6-M.away))}...`,`Hurry! ${Math.max(0,Math.ceil(6-M.away))}...`):S('Follow Duchess up the Goatstair. Stay close!','Follow Duchess. Stay close!'),
  draw(M,t){ const g=M.g; ctx.save(); ctx.strokeStyle=M.away>0?`rgba(255,120,90,${0.5+0.3*Math.sin(t*10)})`:'rgba(255,240,200,.45)'; ctx.lineWidth=3; ctx.setLineDash([10,9]); ctx.beginPath(); ctx.ellipse(g.x,g.y,M.R,M.R*0.86,0,0,TAU); ctx.stroke(); ctx.restore(); }
};
function a1GoatWolves(M){
  if(a1easy()||M.wolves) return;
  M.wolves=A1W.goat.wolves.map(([x,y])=>{ const s=spotNear(x,y,0,80); const e=makeEnemy('wolf',s.x,s.y,{level:Math.max(2,(player.level|0)-1),aggro:false,homeX:s.x,homeY:s.y,leash:500}); e.spawnIn=0.3; return e; });
}
// Duchess draws on top of the world while the follow runs
{ const base=compsForRender; compsForRender=function(list){ base(list); try{ const M=G.mini; if(M&&M.kind==='a1_follow'&&!AREA&&inView(M.g.x,M.g.y,60)) list.push(a1GoatDraw(M.g)); }catch(e){ console.error(e); } }; }
// talking to Duchess at the farm also starts the follow
{ const base=miniPrompts; miniPrompts=function(offer){ base(offer); try{
  if(!G||G.mode!=='story'||AREA) return; const p=player, g=G.goat;
  if(g&&a1on('a1_hop',0)&&!G.mini&&G.side.duchess==='home'){ const d=dist(p.x,p.y,g.x,g.y); if(d<70) offer(d-4,S('Talk to Duchess','Talk to Duchess'),()=>a1say(QDEFS.a1_hop.steps[0].ready.slice(1),()=>later(0.1,()=>startMini('a1_follow','a1_hop'))),g.x,g.y); }
  a1Prompts(offer);
}catch(e){ console.error(e); } }; }

// ---------- the Lake King's race
function a1RaceCourse(){
  const want=[[6250,6750],[6450,7000],[6300,7450],[6000,7700],[5450,7350],[5600,6800],[6000,6650]];
  const wet=(x,y)=>{ const s=T(x,y,{}); return !!s.water&&!s.bridge&&dist(x,y,6050,7400)>170&&!(Math.abs(y-7400)<40&&x>6400&&x<6820); };
  return want.map(([x,y])=>{ if(wet(x,y)) return {x,y}; for(let d=20;d<320;d+=20) for(let a=0;a<TAU;a+=0.4){ const px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; if(wet(px,py)) return {x:px,y:py}; } return {x,y}; });
}
const A1_RIPPLES={x:6250,y:6900};
function a1RaceLen(pts){ let L=0; for(let i=1;i<pts.length;i++) L+=dist(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y); return L; }
MINI.a1_skimrace={
  start(){
    const C=A1W.race||(A1W.race=a1RaceCourse()), pts=[A1_RIPPLES].concat(C,[A1_RIPPLES]);
    let v=235; if(a1easy()) v*=0.7; if(a1hard()) v*=1.05; if(a1q('lakeking')) v*=0.9;
    later(0.3,()=>setBanner(S('Race the Lake King!','Race the Lake King!'),S('Through all seven rings of light, then back to his ripples. Sprint when it counts!','Swim through 7 rings. Then come back!'),3.4));
    return {i:0,pts,v,ks:0,kIdx:1,kx:A1_RIPPLES.x,ky:A1_RIPPLES.y,ka:0,len:a1RaceLen(pts),wave:false,music:'arena',kWait:false};
  },
  update(M,dt){
    const p=player, C=M.pts;
    // Ash: the next ring, then the ripples
    const nx=C[M.i+1];
    if(nx&&dist(p.x,p.y,nx.x,nx.y)<(M.i+1===C.length-1?80:62)){ M.i++; SFX.play('pickup'); emit(nx.x,nx.y,16,{col:'255,226,140',ang:-Math.PI/2,spread:1.2,smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
      if(M.i>=C.length-1){ a1RaceWin(M); return; } if(M.i<=7) setBanner(S(`Ring ${M.i} of 7`,`Ring ${M.i} of 7`),'',1); }
    // the King swims the course
    let go=M.v*dt;
    if(a1easy()&&M.kIdx===5&&M.i<4){ const q=C[4]; if(dist(M.kx,M.ky,q.x,q.y)<6){ go=0; if(!M.kWait){ M.kWait=true; ftext(q.x,q.y-30,S('(the King waits for you)','(he waits)'),'#ffe8a0',12); } } }
    while(go>0&&M.kIdx<C.length){ const q=C[M.kIdx], d=dist(M.kx,M.ky,q.x,q.y); if(d<=go){ M.kx=q.x; M.ky=q.y; go-=d; M.kIdx++; if(a1easy()&&M.kIdx===5&&M.i<4) break; } else { M.ka=angTo(M.kx,M.ky,q.x,q.y); M.kx+=Math.cos(M.ka)*go; M.ky+=Math.sin(M.ka)*go; go=0; } }
    if(M.kIdx>=C.length){ a1RaceLose(M); return; }
    if(Math.random()<dt*6) G.ripples.push({x:M.kx+rand(-14,14),y:M.ky+rand(-10,10),t:0,max:0.8,r:rand(10,18)});
    if(p.dead||p.flying) return;
    const onW=p.onWater&&!(p.z>0);
    // gate 2: the Crag river's current pushes south-west
    const g2=C[2]; if(onW&&dist(p.x,p.y,g2.x+60,g2.y-30)<190){ const k=(a1hard()?130:90)*dt; tNudge(p,-0.72*k,0.7*k); if(!M.cur){ M.cur=1; ftext(p.x,p.y-40,S('A current! Swim in from upstream.','A current!'),'#bfe6ff',13); } }
    // gate 4: lily pads slow you down
    for(const L of a1RaceLilies(M)) if(onW&&dist2(p.x,p.y,L.x,L.y)<L.r*L.r){ p.slowT=Math.max(p.slowT||0,0.12); if(!M.lily){ M.lily=1; ftext(p.x,p.y-40,S('Lily pads! They slow you. Go round.','Lily pads! Go round.'),'#c8f0a0',13); } }
    // gate 5: the King splashes a wave ring; jump it
    const g5=C[5]; if(!M.wave&&dist(p.x,p.y,g5.x,g5.y)<330){ M.wave=true; G.rings.push({x:g5.x+40,y:g5.y-40,rad:20,max:380,speed:240,thick:18,dmg:0,kb:300}); ftext(p.x,p.y-40,S(`A wave! Jump it! (${a1Ctl('jump')})`,`A wave! Jump!`),'#bfe6ff',14); SFX.play('roll'); }
    // gate 6: the reeds are a slow short cut
    const R6=a1RaceReeds(M); if(onW&&dist2(p.x,p.y,R6.x,R6.y)<R6.r*R6.r){ p.slowT=Math.max(p.slowT||0,0.1); }
  },
  end(){},
  target:M=>M.pts[M.i+1]||null,
  hud:M=>{ const k=Math.min(7,Math.max(0,M.kIdx-1)); return S(`Race! Ring ${Math.min(7,M.i+1)} of 7${M.i>=7?' (now the ripples!)':''} · The King is at ring ${k}`,`Ring ${Math.min(7,M.i+1)} of 7 · King: ${k}`); },
  draw(M,t){
    const C=M.pts;
    for(let i=1;i<C.length;i++){ const q=C[i], last=i===C.length-1; if(!inView(q.x,q.y,80)) continue; const done=i<=M.i, next=i===M.i+1;
      if(last&&!next) continue;
      ctx.save(); ctx.globalAlpha=done?0.25:1; ctx.strokeStyle=next?`rgba(255,226,120,${0.75+0.25*Math.sin(t*6)})`:'rgba(255,240,200,.55)'; ctx.lineWidth=next?6:4;
      ctx.beginPath(); ctx.ellipse(q.x,q.y,last?70:52,(last?70:52)*0.5,0,0,TAU); ctx.stroke(); glowAt(q.x,q.y,60,'255,220,130',next?0.35:0.12);
      if(!last){ ctx.fillStyle='#fff6d8'; ctx.font=`800 15px ${UIF}`; ctx.textAlign='center'; ctx.fillText(String(i),q.x,q.y-34); } ctx.restore(); }
    for(const L of a1RaceLilies(M)) if(inView(L.x,L.y,60)){ ctx.fillStyle='#4f9a3e'; ctx.beginPath(); ctx.ellipse(L.x,L.y,L.r*0.32,L.r*0.2,L.a,0.3,TAU-0.1); ctx.lineTo(L.x,L.y); ctx.fill(); ctx.strokeStyle='#2c5a22'; ctx.lineWidth=1.5; ctx.stroke(); }
    const R6=a1RaceReeds(M); if(inView(R6.x,R6.y,R6.r)) for(let k=0;k<26;k++){ const a=k*2.4, rr=R6.r*Math.sqrt((k+0.5)/26), x=R6.x+Math.cos(a)*rr, y=R6.y+Math.sin(a)*rr*0.8; ctx.strokeStyle='#5f7d36'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+3,y-12,x+Math.sin(t*2+k)*3,y-24); ctx.stroke(); }
    a1DrawKing(M.kx,M.ky,M.ka,t);
  }
};
function a1RaceLilies(M){ if(M.lil) return M.lil; const a=M.pts[3], b=M.pts[4], out=[]; for(let k=0;k<9;k++){ const u=0.35+0.4*((k*0.37)%1), x=lerp(a.x,b.x,u)+Math.sin(k*2.1)*60, y=lerp(a.y,b.y,u)+Math.cos(k*1.7)*50; out.push({x,y,r:30+(k%3)*6,a:k}); } return (M.lil=out); }
function a1RaceReeds(M){ if(M.reeds) return M.reeds; const a=M.pts[5], b=M.pts[6]; return (M.reeds={x:lerp(a.x,b.x,0.5)+60,y:lerp(a.y,b.y,0.5)+20,r:120}); }
function a1RaceWin(M){
  G.mini=null; if(MINI.a1_skimrace.end) MINI.a1_skimrace.end(M,true);
  a1say([xl('narr',`You splash past the last ring with your lungs on fire and your tail in a knot. The Lake King surfaces beside you, slowly, the way a king arrives late to his own party.`,`You win! The Lake King comes up next to you. Slowly.`),
    xl('narr',`He looks at you for a long time. Then he flicks his great tail and a wave lifts you off your feet.`,`He looks at you. Then his tail lifts you up on a wave.`),
    xl('narr',`You land running. And you don't sink. You don't clomp. You SKIP. Skip, skip, skip, across the whole lake, like a stone thrown by the sky.`,`You land running. You SKIP across the lake like a stone!`),
    xl('ash',`I'm a PEBBLE! I'm the fastest pebble in the WORLD!`,`I'm a PEBBLE! The fastest pebble ever!`),
    xl('narr',`The Lake King sinks back down, looking almost pleased, which for him is a lot of face.`,`The Lake King sinks down. He looks almost pleased.`)],()=>{ G.flags.a1_skim_won=true; jingle('complete','upgrade'); questPoke(); });
}
function a1RaceLose(M){
  G.mini=null; SFX.play('warn');
  a1say([xl('narr',`The Lake King reaches the ripples first. He blows one enormous bubble at you. Bloop. It is the rudest bubble you have ever seen.`,`The Lake King wins. He blows a rude bubble at you. Bloop.`)],()=>setBanner(S('The Lake King wins','The King wins'),S('Talk to the ripples to race again. Save your sprint for the long bits!','Talk to the ripples to try again.'),3));
}
// the ripples: the meeting, then the race (the old fishing quest still works when no race is due)
function a1LakeKingAct(o){
  if(a1on('a1_skim',0)||a1on('a1_skim',1)){
    const L=[];
    if(a1on('a1_skim',0)) L.push(xl('narr',`The ripples bubble. A huge shadow rises under the water, with a golden fin shaped like a crown.`,`A huge shadow rises. It has a gold fin like a crown.`),
      {who:'narr',text:S(`The Lake King looks at you. He looks at your feet, standing on his lake. He looks deeply offended.`,`The Lake King looks at your feet on his lake. He is offended.`),skipIf:()=>a1q('lakeking')},
      {who:'narr',text:S(`The Lake King looks at you. You caught him once, with a hook. He has not forgotten. He has not forgiven. He is, however, interested.`,`He remembers your hook. But he is interested.`),skipIf:()=>!a1q('lakeking')},
      xl('ash',`Your Majesty. I challenge you to a race. Around the lake. Loser has to... um. Be sad?`,`Your Majesty! I challenge you to a race!`),
      xl('narr',`The Lake King slaps the water with his tail. Seven rings of light open across the lake. That means yes. That means very yes.`,`He slaps the water. Seven rings of light open. That means yes!`));
    else L.push(xl('narr',`The Lake King circles, waiting. Seven rings of light shimmer across the lake.`,`The Lake King waits. The seven rings shine.`));
    L.push(ch('ash',S('Ready to race?','Ready?'),[{t:S('Ready! Go!','Go!'),tone:'brave',fn:()=>{ G.flags.a1_skim_met=true; questPoke(); later(0.1,()=>{ if(a1on('a1_skim',1)) startMini('a1_skimrace','a1_skim'); }); }},{t:S('Not yet.','Not yet.'),fn:()=>{ G.flags.a1_skim_met=true; questPoke(); }}]));
    a1say(L); return; }
  return lakeKingAct(o);
}

// ---------- 10. Pip's Five Flames: a little lesson at each lit Ward
const A1_PIPN={hollow:S('the Hollow Ward','the Hollow Ward'),ash:S('the Ash Ward','the Ash Ward'),crag:S('the Crag Ward','the Crag Ward'),mire:S('the Sunken Ward','the Sunken Ward'),frost:S('the Frost Ward','the Frost Ward')};
const A1_PIPL={
  hollow:[xl('iska',`Oh, look at him! Hello, little spark. Let's see what you can do.`,`Look at him! Hello, little spark.`),xl('pip',`Mip... ACHOO!`,`Mip... ACHOO!`),xl('narr',`Five sparks shoot out of Pip's nose and go bouncing across the grass.`,`Five sparks shoot out of Pip's nose!`),xl('iska',`Well. Catch them, Ash. Quickly. Sparks are terrible at staying put.`,`Catch them, Ash! Quickly!`)],
  ash:[xl('bram',`A DRAKE! Finally, someone small enough to teach properly. Lesson one: be LOUD!`,`A DRAKE! Lesson one: be LOUD!`),xl('pip',`mip.`,`mip.`),xl('bram',`LOUDER!`,`LOUDER!`),xl('pip',`MIP!`,`MIP!`),xl('bram',`That's the spirit! Now you, Ash. ROAR next to him. Show him how it's done!`,`Now you, Ash. ROAR next to him!`)],
  crag:[xl('oriel',`My drakes flew circles around this spire. Fly with him, Ash. He'll show you the way.`,`Fly with him around the spire, Ash. He'll show you the way.`)],
  mire:[xl('sedge',`Oh no. He's in the bog. Everyone ends up in the bog. Dry him off, gently. Gently! He's a drake, not a crumpet.`,`Oh no, he fell in the bog! Dry him off. Gently!`),xl('narr',`Breathe fire on Pip for about two seconds. Not too short, not too long. Watch the bar.`,`Breathe on Pip for two seconds. Not too long!`)],
  frost:[xl('tove',`A warm little drake? For me? On MY Ward? Oh, I could cry. I won't. It would freeze.`,`A warm little drake? For me? I could cry!`),xl('tove',`My stone is still cold inside. Warm it with him, side by side. And mind the wolves. They love a cold stone.`,`Warm my stone with him. Mind the wolves!`)]};
function a1PipLeft(){ return ['hollow','ash','crag','mire','frost'].filter(id=>!G.flags['a1_pip_'+id]); }
function a1PipAt(){
  const p=player, left=a1PipLeft().filter(id=>G.wards[id]&&WARDS[id]); if(!left.length) return null;
  let b=null,bd=1e18; for(const id of left){ const w=WARDS[id], d=dist2(w.x,w.y,p.x,p.y); if(d<bd){ bd=d; b=w; } }
  return b?`xy:${Math.round(b.x)},${Math.round(b.y)}`:null;
}
function a1PipStart(id){
  if(!G.pip) spawnPip();
  a1say(A1_PIPL[id],()=>{
    const W=WARDS[id], L={id,t:0,ph:'go',h:0,on:false,x:W.x,y:W.y};
    if(id==='hollow'){ L.ph='catch'; L.lim=a1easy()?40:25; L.sp=[]; for(let i=0;i<5;i++){ const a=i*1.26+0.3; L.sp.push({x:W.x+Math.cos(a)*60,y:W.y+60+Math.sin(a)*40,vx:Math.cos(a)*(90+i*12),vy:Math.sin(a)*(70+i*10),got:false}); } }
    if(id==='ash'){ L.ph='loud'; player.roar=100; mvTip(S('Roar!','Roar!'),S(`Your roar is full. Press ${a1RoarKey()} to ROAR next to Pip!`,`Press ${a1RoarKey()} to ROAR!`),8,'a1_roar'); }
    if(id==='crag'){ L.ph='rings'; L.i=0; const S0=A1W.spire; L.rings=[0.6,2.2,3.8,5.2].map(a=>({x:S0.x+Math.cos(a)*230,y:S0.y+Math.sin(a)*190})); }
    if(id==='mire'){ L.ph='dry'; L.px=W.x+44; L.py=W.y+16; }
    if(id==='frost'){ L.ph='warm'; L.wolves=[0,1].map(k=>{ const s=spotNear(W.x+(k?220:-220),W.y-80,0,90); const e=makeEnemy('wolf',s.x,s.y,{level:Math.max(3,player.level|0),aggro:true,snowy:true,homeX:W.x,homeY:W.y,leash:900}); e.spawnIn=0.4; return e; }); }
    A1.pipL=L; jingle('quest',null);
  });
}
const a1RoarKey=()=>{ try{ return btnLabel('roar')||'R'; }catch(e){ return 'R'; } };
{ const base=doRoar; doRoar=function(free){ base(free); try{ const L=A1.pipL; if(L&&L.id==='ash'&&L.ph==='loud'&&G.pip&&dist(player.x,player.y,G.pip.x,G.pip.y)<320) a1PipRoared(L);
  if(a1on('a1_bram',0)&&a1easy()){ const [x,y]=A1W.anvil.pits[2]; if(dist(player.x,player.y,x,y)<240) a1PitLight(2); } }catch(e){ console.error(e); } }; }
function a1PipRoared(L){
  L.ph='fight'; ftext(G.pip.x,G.pip.y-30,'MIIIP!','#ffb070',16); taunt('bram',S(`THAT'S IT! Oh. Oh, and here come some kobolds. Lesson two: be loud AT them.`,`Here come kobolds! Be loud AT them!`));
  const W=WARDS.ash; L.foes=[]; for(let i=0;i<4;i++){ const a=i*TAU/4+0.4, s=spotNear(W.x+Math.cos(a)*330,W.y+Math.sin(a)*300,0,80); const e=makeEnemy('kobold',s.x,s.y,{level:Math.max(2,(player.level|0)-1),aggro:true,homeX:W.x,homeY:W.y,leash:1200}); e.spawnIn=0.5; puff(e.x,e.y); L.foes.push(e); }
}
function a1PipDone(L){
  A1.pipL=null; G.flags['a1_pip_'+L.id]=true; jingle('complete','upgrade');
  const n=5-a1PipLeft().length; setBanner(S(`Pip tasted ${A1_PIPN[L.id]}'s flame`,`Pip tasted the flame`),S(`${n} of 5 Ward-fires`,`${n} of 5`),2.6);
  if(G.pip) emit(G.pip.x,G.pip.y,18,{kind:'fire',ang:-Math.PI/2,spread:1,smin:30,smax:110,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:4});
  questPoke(); saveGame();
}
function a1PipTick(dt){
  const L=A1.pipL; if(!L) return; const p=player, W=WARDS[L.id]; L.t+=dt;
  if(dist(p.x,p.y,W.x,W.y)>900||AREA){ A1.pipL=null; setBanner(S('Pip’s lesson stopped','Lesson stopped'),S('Come back to the Ward to try again.','Go back to the Ward to try again.'),2.4); return; }
  if(L.ph==='catch'){
    for(const s of L.sp){ if(s.got) continue; s.x+=s.vx*dt; s.y+=s.vy*dt; if(dist(s.x,s.y,W.x,W.y)>300||blockedAt(s.x,s.y)){ s.vx*=-1; s.vy*=-1; s.x+=s.vx*dt*2; s.y+=s.vy*dt*2; } if(Math.random()<dt*0.8){ const a=rand(0,TAU), v=Math.hypot(s.vx,s.vy); s.vx=Math.cos(a)*v; s.vy=Math.sin(a)*v; }
      if(dist(p.x,p.y,s.x,s.y)<30){ s.got=true; SFX.play('pickup'); emit(s.x,s.y,10,{col:'255,220,140',smin:30,smax:90,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); } }
    const n=L.sp.filter(s=>s.got).length; if(n>=5){ a1PipDone(L); return; }
    if(L.t>L.lim){ A1.pipL=null; setBanner(S('The sparks fizzled out','The sparks went out'),S('Let Pip sneeze again: try the Ward once more.','Try again at the Ward.'),2.6); }
    return; }
  if(L.ph==='fight'){ if(L.foes.every(e=>e.dead)) a1PipDone(L); return; }
  if(L.ph==='rings'){ const R=L.rings[L.i]; if(R&&p.flying&&dist(p.x,p.y,R.x,R.y)<80){ L.i++; SFX.play('pickup'); emit(R.x,R.y-60,16,{col:'230,220,210',glow:false,smin:30,smax:110,lmin:.3,lmax:.7,zmin:2,zmax:4,grow:6}); if(L.i>=L.rings.length){ a1PipDone(L); return; } }
    if(G.pip&&R){ const k=1-Math.exp(-dt*2); G.pip.x+=(R.x-G.pip.x)*k*0.5; G.pip.y+=(R.y-60-G.pip.y)*k*0.5; }
    if(!p.flying) a1note('pip_fly',`Fly through the smoke rings with Pip!`,`Fly through the smoke rings!`,6);
    return; }
  if(L.ph==='dry'||L.ph==='sulk'){
    if(G.pip){ G.pip.x=L.px; G.pip.y=L.py; }
    if(L.ph==='sulk'){ L.st-=dt; if(L.st<=0){ L.ph='dry'; L.h=0; ftext(L.px,L.py-30,S('Mip? (try again, gently)','Mip? (gently!)'),'#ffb070',12); } return; }
    if(L.on){ if(L.h>2.8){ L.ph='sulk'; L.st=3; L.h=0; ftext(L.px,L.py-30,S('Toasty tail! Pip sulks.','Too hot! Pip sulks.'),'#ff9a70',14); SFX.play('warn'); } }
    else if(L.h>0){ if(L.h>=1.4){ a1PipDone(L); return; } ftext(L.px,L.py-30,S('Still soggy. A bit longer!','Still wet! Longer.'),'#bfe6ff',13); L.h=0; }
    L.on=false; return; }
  if(L.ph==='warm'){ if(!L.on) L.h=Math.max(0,L.h-dt*0.2); else if(G.pip&&Math.random()<dt*6) emit(G.pip.x,G.pip.y,2,{kind:'fire',ang:angTo(G.pip.x,G.pip.y,W.x,W.y),spread:0.3,smin:80,smax:160,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:3});
    if(!L.on&&L.h>0.3&&p.exhausted) a1note('pip_frost_rest',`Out of fire! Catch your breath, then warm it some more.`,`Out of fire! Rest, then breathe again.`,5);
    L.on=false; if(L.h>=3.4) a1PipDone(L); return; }
}
// a prompt at each lit Ward while the quest wants it
function a1Prompts(offer){
  const p=player;
  if(a1on('a1_pip',0)&&!A1.pipL&&G.pip) for(const id of a1PipLeft()){ if(!G.wards[id]) continue; const W=WARDS[id], d=dist(p.x,p.y,W.x,W.y); if(d<120) offer(d-30,S('Let Pip taste the Ward-fire','Let Pip taste the fire'),()=>a1PipStart(id),W.x,W.y,true); }
  // Professor Quill at Lantern Night
  if(G.stage==='c_fest'){ const q=G.npcs.find(n=>n.id==='quill'&&n.a1fest); if(q&&!G.flags.a1_n2&&dist(p.x,p.y,q.x,q.y)<230&&typeof HS!=='undefined'&&HS.on){ G.flags.a1_n2=true; npcBubble(q,S(`Is the moon a little... no. My glasses. Never mind.`,`Is the moon... no. My glasses.`)); } }
}

// ---------- 11. the camp at the old Southern Pass (a1_moth), the vault, the carts, the ferry
function a1CampPrompt(){ return a1on('a1_moth',1)&&G.flags.a1_moth_fought?S('Search the camp','Search the camp'):S('Look at the old camp','Look at the camp'); }
function a1CampAct(){
  if(a1q('a1_moth')||G.flags.a1_moth_camp){ a1say([xl('narr',`The camp is gone. Only footprints, heading south over the rocks.`,`The camp is gone. Footprints go south.`)]); return; }
  if(!a1on('a1_moth',1)){ a1say([xl('narr',`A cold campfire tucked behind the rockfall. A bedroll. Someone has been sleeping out here, all alone.`,`A cold campfire and a bedroll. Someone sleeps here.`)]); return; }
  if(!G.flags.a1_moth_fought){
    if(isNight()){ a1MothFight(); return; }
    a1say([xl('narr',`A cold camp. Footprints everywhere, but nobody home. Come back at night. Whoever camps here does it in the dark.`,`Nobody is here. Come back at night!`),
      ch('ash',S('What now?','What now?'),[{t:S('Hide behind the rocks and wait until dark','Wait here until dark'),tone:'brave',fn:()=>{ G.fade=1; G.tod=0.9; later(0.6,()=>{ setBanner(S('Night falls','Night falls'),S('Something moves in the dark...','Something moves...'),2.4); }); }},{t:S('Come back later','Come back later')}])]);
    return; }
  a1say([xl('narr',`A bedroll. A little cooking pot. A sketch on a scrap of paper: it's YOU. With your horns. And a big question mark over your head.`,`A bedroll. A pot. A drawing of YOU, with a question mark!`),
    xl('narr',`Under the bedroll is the torn page from the library. And beside it, a locket made of two shells, on a salty string.`,`Under the bedroll: the torn page. And a shell locket.`),
    xl('narr',`Inside the locket is a tiny painting of an old woman with kind eyes, and a name scratched in the shell: "V."`,`Inside is a tiny painting of an old woman. And a letter: "V."`),
    ch('ash',S(`What do you do with the locket?`,`What about the locket?`),[
      {t:S(`Keep it safe. I'll give it back to her one day.`,`Keep it safe for her.`),tone:'kind',fn:()=>{ G.flags.a1_locket_kept=true; giveItems({a1_locket:1},true); },then:[xl('ash',`Somebody's grandma. She'll want this back. I'll keep it safe till I find her.`,`Somebody's grandma. I'll keep it safe for her.`)]},
      {t:S(`Leave it here. She'll come back for it.`,`Leave it here.`),fn:()=>{ G.flags.a1_locket_left=true; },then:[xl('ash',`It's hers. She'll come back for it. I'll just take the library's page.`,`It's hers. I'll just take the page.`)]}])],
    ()=>{ giveItems({a1_page:1}); G.flags.a1_moth_camp=true; questPoke(); });
}
function a1MothFight(){
  if(A1.moths&&A1.moths.some(e=>!e.dead)) return;
  const C=A1W.camp, n=a1easy()?3:5, L=Math.max(3,(player.level|0)-1); A1.campOut=true;
  setBanner(S('The lantern goes out!','The lantern goes out!'),S('Dusk moths! Breathe fire on them, then hit them.','Moths! Burn them, then hit them!'),3);
  A1.moths=[]; for(let i=0;i<n;i++){ const a=i*TAU/n, s=spotNear(C.x+Math.cos(a)*120,C.y+Math.sin(a)*100,0,50); const e=makeEnemy('a1_moth',s.x,s.y,{level:L,aggro:true,homeX:C.x,homeY:C.y,leash:900}); e.spawnIn=0.5; A1.moths.push(e); }
  SFX.play('warn');
}
function a1MothTick(dt){
  const C=A1W.camp, p=player;
  if(a1on('a1_moth',1)&&!G.flags.a1_moth_fought){
    const d=dist(p.x,p.y,C.x,C.y);
    if(!A1.moths&&isNight()&&d<330&&scene==='play') a1MothFight();
    if(A1.moths&&A1.moths.every(e=>e.dead)){ A1.moths=null; G.flags.a1_moth_fought=true; setBanner(S('The moths are gone','The moths are gone'),S('Now search the camp.','Search the camp!'),2.6); saveGame(); }
    if(A1.moths&&d>1500){ for(const e of A1.moths) e.dead=true; A1.moths=null; }
  }
  // the moths nibble the fire meter (Wren's charm stops it)
  for(const e of G.enemies){ if(e.dead||e.type!=='a1_moth'||e.spawnIn>0) continue; if(dist2(e.x,e.y,p.x,p.y)<(e.r+p.r+6)**2&&!G.flags.perk_moth){ e.nib=(e.nib||0)-dt; if(e.nib<=0){ e.nib=0.8; p.energy=Math.max(0,(p.energy||0)-14); ftext(p.x,p.y-40,S('Nibble! (your fire)','Nibble!'),'#d8c8f0',12); } } }
}
defineFoe('a1_moth',{r:11,hp:20,speed:175,dmg:4,value:7,flying:true,kbRes:1.4,name:S('Dusk Moth','Dusk Moth'),dcol:'200,190,230',
  ai:(e,dt)=>{ if(AI.bat) AI.bat(e,dt); },
  onHurt(e,amt){ return e.burnT>0||FH.fire?amt:amt*0.35; },
  draw2d:(e)=>a1DrawMoth(e.x,e.y-14,G.time+e.id*0.7,1)});
function a1VaultAct(){
  if(G.found.a1_vault){ a1say([xl('narr',`Five names carved in the old stone, worn smooth by a thousand years of fingers: ISKA. BRAM. ORIEL. SEDGE. TOVE.`,`Five names: ISKA. BRAM. ORIEL. SEDGE. TOVE.`)]); return; }
  if(!G.items.a1_citykey){ a1say([xl('narr',`Under the bridge, half in the water, is a tiny round door with a very big keyhole. It is locked.`,`A tiny door under the bridge. It is locked.`),
    {who:'narr',text:S(`The Mayor of Brindlecross keeps the town's keys. He is busy with a missing pie.`,`The Mayor has the town's keys. He has lost a pie.`),skipIf:()=>a1q('pie')}]); return; }
  G.found.a1_vault=true; SFX.play('chest');
  a1say([xl('narr',`The Key to Brindlecross turns with a groan. Behind the little door is a room no bigger than a cupboard, and very dry.`,`The key turns! Behind the door is a tiny dry room.`),
    xl('narr',`On a stone shelf sits a warm red ember in a glass. And on the wall, five names, carved by five different hands: ISKA. BRAM. ORIEL. SEDGE. TOVE.`,`A warm ember in a glass. And five names: ISKA, BRAM, ORIEL, SEDGE, TOVE.`),
    xl('ash',`The Wardens. They were real people. With real handwriting. Bram's is terrible.`,`The Wardens! Bram's writing is terrible.`)],()=>later(0.3,()=>gainHeartEmber('a1_vault')));
}
function a1Cart(back){
  if(!G.flags.tunnel_plans){ a1say([xl('narr',`An old mine cart on rusty rails, chained to a post. The chain has an Oath lock on it.`,`An old mine cart with an Oath lock on it.`),{who:'narr',text:S('The Oath’s Hidden Tunnel might have a way to open it.','Maybe the Oath’s tunnel has the answer.'),skipIf:()=>!G.flags.clue_letter}]); return; }
  const to=back?A1W.cartA:A1W.cartB;
  a1say([xl('narr',back?`You squeeze into the cart and kick off. The rails rattle all the way back down to the Ashen Road.`:`You squeeze into the cart and kick off. Down the hill, through the dark, rattle rattle rattle, out into the Gatewatch hills.`,back?`Rattle rattle! Back to the Ashen Road.`:`Rattle rattle! Out to the Obsidian Gate hills.`)],()=>{ G.found.a1_cart=true; mapTravel(to.x+(back?50:-50),to.y+30,{banner:back?S('The Ashen Road','The Ashen Road'):S('The Gatewatch hills','The Gatewatch hills')}); });
}
function a1FerryBack(){
  if(!a1q('lure')){ a1say([xl('narr',`An old landing on the edge of the Mirefen. A rope is tied to a post, with nothing on the other end.`,`An old landing. A rope with no boat.`)]); return; }
  a1say([xl('narr',`You ring the little bell on the post. Soon the Soggy Biscuit Two comes wobbling across the water, with Dell at the oars.`,`You ring the bell. Dell rows over in the Soggy Biscuit Two.`)],()=>mapTravel(6520,7360,{banner:S('The Brindlecross dock','The Brindlecross dock')}));
}
{ const base=compTalkOpts; compTalkOpts=function(id,n){ const o=base(id,n); try{
  if(G&&G.mode==='story'&&id==='dell'&&a1q('lure')&&!AREA) o.unshift({t:S('Row me to the Mirefen landing, please','Row me to the Mirefen'),then:[xl('dell',`Hop in! Mind the hole. And the other hole.`,`Hop in! Mind the holes.`)],fn:()=>later(0.2,()=>mapTravel(A1W.ferry.x,A1W.ferry.y,{banner:S('The Mirefen landing','The Mirefen landing')})),end:true});
  }catch(e){ console.error(e); } return o; }; }

// ---------- 12. people in new places: Minnow on the dock, Quill at Lantern Night, Mom at the Southern Pass
const a1MinnowDock=()=>!!(G&&G.mode==='story'&&(hasAbil('stride')||G.flags.trial_tide_boss||G.flags.trial_tide_done));
{ const base=setupNPCs; setupNPCs=function(){ base(); try{
  if(!G||G.mode!=='story') return;
  if(a1MinnowDock()&&SPECIAL.minnow&&!G.npcs.some(n=>n.id==='minnow')){ const n=mkNPC(SPECIAL.minnow,6560,7400); n.walker=false; G.npcs.push(n); }
  if(G.stage==='c_fest'&&CASTBY.quill&&!G.npcs.some(n=>n.id==='quill')){ const n=mkNPC(CASTBY.quill,2700,9536); n.walker=false; n.a1fest=true; G.npcs.push(n); }
  if(G.stage==='c_pass'){ const m=G.npcs.find(n=>n.id==='maren'); if(m){ m.x=3292; m.y=10760; m.home=[3292,10760]; m.walker=false; } }
}catch(e){ console.error(e); } }; }
// if the shared threads module (e7b_threads, earlier in ORDER) already brought these scenes, it plays them, not us
const A1_OWN={n1:!STORY.a1_n1,n3:!STORY.a1_n3,lunch:!STORY.a1_passlunch};
STORY.a1_n1=STORY.a1_n1||[xl('narr',`A moth as big as your hand lands on the warm stone. It's grey, with two painted eyes on its wings, pale as two little moons.`,`A big grey moth lands on the warm stone. It has two painted eyes.`),
  xl('pip',`Mip! MIP!`,`Mip! MIP!`),xl('ash',`It's just a moth, Pip.`,`It is just a moth, Pip.`),
  xl('narr',`The moth looks at you. Moths don't look at people. This one does. Then it flies straight up, toward the moon.`,`The moth looks at you. Then it flies up to the moon.`)];
STORY.a1_n3=STORY.a1_n3||[xl('narr',`A cloud of grey moths swirls round the thief's sail as it slips away into the dark.`,`Grey moths fly around the thief's boat.`),
  {who:'narr',text:S(`Pip puffs up to twice his size. Smoke comes out of his ears. You have never seen him angry before. Neither has he.`,`Pip is ANGRY. Smoke comes out of his ears!`),skipIf:()=>!G.flags.pip},
  {who:'pip',text:S(`MIIIP!`,`MIIIP!`),skipIf:()=>!G.flags.pip},
  xl('narr',`Something small and bright lies in the grass where the thief jumped. A brass gear, stamped GEARHAVEN.`,`The thief dropped a brass gear. It says GEARHAVEN.`)];
STORY.a1_passlunch=STORY.a1_passlunch||[xl('narr',`Mom is sitting on the rockfall with a basket on her knees. She has clearly been waiting a while.`,`Mom is waiting at the pass with a basket.`),
  xl('maren',`Sandwiches. Cheese, cheese, and a cheese one for Pip. Eat something before you chase anybody.`,`Sandwiches! Eat something first.`),
  {who:'maren',text:S(`The coast is all cliffs and currents, love. Learn to jump twice and skip first. Hollis's goat knows how.`,`Learn to jump twice first. Ask Hollis.`),skipIf:()=>hasAbil('dbljump')},
  {who:'maren',text:S(`And you'll want to skim across water like a stone. Little Minnow on the Brindlecross dock can teach you. She's very fast and very rude.`,`Learn to skim on water. Ask Minnow on the dock.`),skipIf:()=>hasAbil('skimmer')},
  xl('maren',`Bring the Heart home. And bring yourself home first. Love you. Eat something.`,`Bring the Heart home. Bring YOU home first. Eat something.`)];
const a1TextOf=l=>String(Array.isArray(l)?l[1]:l&&l.text||'');
if(typeof festIntroLines==='function'){ const base=festIntroLines; festIntroLines=function(day){ const L=base(day); try{
  if(!A1_OWN.n1||L.some(l=>a1TextOf(l).includes('painted eyes'))) return L;
  let i=L.findIndex(l=>a1TextOf(l).includes('glows on its stand')); if(i<0) i=L.findIndex(l=>a1TextOf(l).includes('first firework'))-1;
  L.splice(i>=0?i+1:L.length,0,...STORY.a1_n1.filter(l=>!(l===STORY.a1_n1[1]&&!G.flags.pip)));
  }catch(e){ console.error(e); } return L; }; }
if(typeof drawShip==='function'){ const base=drawShip; drawShip=function(S0,t){ base(S0,t); try{ if(!S0||!G.flags.c_leapt&&!(HS&&HS.phase==='leap')) return; for(let i=0;i<6;i++){ const a=t*1.6+i*1.05, r=56+Math.sin(t*2+i)*12; a1DrawMoth(S0.x+Math.cos(a)*r,S0.y-70+Math.sin(a)*r*0.4,t+i,0.6*(S0.a==null?1:S0.a)); } }catch(e){} }; }
function a1ThreadTick(){
  if(typeof HS==='undefined') return;
  if(A1_OWN.n3&&HS.on&&(HS.phase==='leap'||HS.phase==='gear')&&HS.t>2.5&&!G.flags.a1_n3&&scene==='play'){ G.flags.a1_n3=true; runDialogue(STORY.a1_n3.slice(0,3),()=>{ scene='play'; }); }
  if(A1_OWN.lunch&&G.stage==='c_pass'&&!G.flags.a1_lunch&&!AREA&&scene==='play'&&curMap()===0&&dist(player.x,player.y,HV.pass.x,HV.pass.y)<340){ G.flags.a1_lunch=true; player.hp=player.maxHp; a1say(STORY.a1_passlunch,()=>questUpdated()); }
}
const a1Lacks=()=>!hasAbil('dbljump')||!hasAbil('skimmer');
{ const base=useCrossing; useCrossing=function(def){
  try{ if(def&&def.id==='c_pass_s'&&G.mode==='story'&&(!def.need||def.need())&&a1Lacks()){
    G.flags.a1_lunch=true;
    a1say([xl('maren',`Not so fast, love. The coast is all cliffs and currents.`,`Not so fast! The coast has cliffs and currents.`)].concat(STORY.a1_passlunch.slice(2,4)),()=>{ setBanner(S('Not ready for the coast yet','Not ready yet'),S(!hasAbil('dbljump')&&!hasAbil('skimmer')?'Learn to jump twice (Farmer Hollis) and to skim (Minnow on the dock).':!hasAbil('dbljump')?'Learn to jump twice. Farmer Hollis has a very strange goat.':'Learn to skim. Minnow is on the Brindlecross dock.','Ask Hollis and Minnow first.'),4); questUpdated(); });
    return; } }catch(e){ console.error(e); }
  return base(def); }; }

// ---------- 13. what the story asks for now: objectives, Yara's hints, markers, Mom's free hammer
function a1GiftObjs(){
  const out=[], H=NPCSPOT.hollis, m=G.npcs.find(n=>n.id==='minnow');
  if(!hasAbil('dbljump')) out.push({text:S('Learn to jump twice. Farmer Hollis has a very strange goat.','Learn to jump twice. Ask Farmer Hollis.'),x:H[0],y:H[1],npc:'hollis',a1:1});
  if(!hasAbil('skimmer')) out.push({text:S('Learn to skim. Minnow Fisk is on the Brindlecross dock.','Learn to skim. Ask Minnow on the dock.'),x:m?m.x:6560,y:m?m.y:7400,npc:'minnow',a1:1});
  return out;
}
function a1Objectives(out){
  if(!G||G.mode!=='story'||G.done||out.some(o=>o.fight)) return out;
  const st=G.stage, TL=TRIALS.leap, TT=TRIALS.tide, TS=TRIALS.sky, J=hasAbil('jump');
  const isWard=(o,id)=>{ const w=WARDS[id]; return w&&Math.abs(o.x-w.x)<1&&Math.abs(o.y-w.y)<1; };
  const drop=f=>{ for(let i=out.length-1;i>=0;i--) if(f(out[i])) out.splice(i,1); };
  if((st==='hollow'||st==='warcamp'||st==='wren')&&!J) out.push({text:S('Pass the Trial of the Leap in Whisperwood (optional now, needed for the Ash Ward)','Try the Trial of the Leap. You need to jump soon!'),x:TL.x,y:TL.y,a1:1});
  if(st==='oath'&&!J){ drop(o=>o.site==='oath'||isWard(o,'ash')); out.unshift({text:S('Pass the Trial of the Leap. The Ash Ward’s causeway is broken.','Do the Trial of the Leap. The way to the Ash Ward is broken.'),x:TL.x,y:TL.y,a1:1}); }
  if(st==='three'){
    if(!G.wards.crag){
      if(!hasAbil('wings')){ drop(o=>o.site==='crag'||isWard(o,'crag')); out.push({text:S('Pass the Trial of the Sky. The Crag Ward’s fire is up on the Nest Spire.','Do the Trial of the Sky. The Crag Ward is up high.'),x:TS.x,y:TS.y,a1:1}); }
      else if(G.wardReady.crag){ drop(o=>isWard(o,'crag')); const S0=A1W.spire; out.push({text:a1OnSpire()?S('Breathe fire on the Crag Ward. Hold your fire breath on it.','Breathe fire on the Ward!'):S('Fly up the Nest Spire: stand in the warm air at its foot, jump and fly. Then breathe on the Ward.','Stand in the warm air. Jump and fly up the spire!'),x:a1OnSpire()?WARDS.crag.x:S0.vx,y:a1OnSpire()?WARDS.crag.y:S0.vy,a1:1}); }
    }
    if(!G.wards.mire){
      if(!hasAbil('stride')){ drop(o=>o.site==='mire'||isWard(o,'mire')); out.push({text:S('Pass the Trial of the Tide. The Sunken Ward is flooded.','Do the Trial of the Tide. The Sunken Ward is flooded.'),x:TT.x,y:TT.y,a1:1}); }
      else if(!hasAbil('skimmer')){ drop(o=>o.site==='mire'||isWard(o,'mire')); const m=G.npcs.find(n=>n.id==='minnow'); out.push({text:S('Learn to skim. Minnow Fisk is on the Brindlecross dock.','Learn to skim. Ask Minnow on the dock.'),x:m?m.x:6560,y:m?m.y:7400,npc:'minnow',a1:1}); }
      else if(G.wardReady.mire){ drop(o=>isWard(o,'mire')); out.push({text:S('Skim across the Gloam Swirl to the Sunken Ward: sprint over the water and don’t stop. Then breathe on the Ward.','Run across the swirl. Don’t stop! Then breathe on the Ward.'),x:WARDS.mire.x,y:WARDS.mire.y,a1:1}); }
    }
    if(!G.wards.frost){
      if(!(G.weapons&&G.weapons.bow)){ drop(o=>o.site==='frost'||isWard(o,'frost')); out.push({text:S('Find Ember’s bow in the Trial of the Tide. The Frost Ward is sealed in ice.','Get the bow in the Trial of the Tide. The Frost Ward is frozen.'),x:TT.x,y:TT.y,a1:1}); }
      else if(G.wardReady.frost&&!G.flags.a1_frost_melted){ drop(o=>isWard(o,'frost')); const n=[1,2,3].filter(j=>G.flags['a1_frost_'+j]).length;
        A1W.frost.lan.forEach(([x,y],i)=>{ if(!G.flags['a1_frost_'+(i+1)]) out.push({text:S(`Melt Greymane’s ice: shoot burning arrows at the frost lanterns. Breathe fire and shoot through it (${n}/3)`,`Shoot fire arrows at the lanterns (${n}/3)`),x,y:y+90,a1:1}); }); }
    }
  }
  if(st==='gate'&&!(G.weapons&&G.weapons.hammer)){ const m=npcOf('maren'); out.unshift({text:S('Ask Mom about a hammer. The mountain will need one.','Ask Mom for a hammer. The mountain needs one.'),x:m?m.x:NPCSPOT.maren[0],y:m?m.y:NPCSPOT.maren[1],npc:'maren',a1:1}); }
  if(st==='summit'&&!hasAbil('dbljump')){ const H=NPCSPOT.hollis; out.push({text:S('Learn to jump twice. Farmer Hollis has a very strange goat.','Learn to jump twice. Ask Farmer Hollis.'),x:H[0],y:H[1],npc:'hollis',a1:1}); }
  if(st==='c_pass'&&G.flags.a1_lunch&&a1Lacks()&&curMap()===0){ out.length=0; for(const o of a1GiftObjs()) out.push(o); }
  return out;
}
{ const base=objectiveList; objectiveList=function(){ const out=base(); try{ return a1Objectives(out); }catch(e){ console.error(e); return out; } }; }
{ const base=hintLine; hintLine=function(){ try{ if(G&&G.mode==='story'&&!G.done){ const st=G.stage, J=hasAbil('jump');
  if(st==='warcamp'&&!J) return A1_HINT.warcamp_nojump; if(st==='wren'&&!J) return A1_HINT.wren_nojump; if(st==='oath'&&!J) return A1_HINT.oath_nojump;
  if(st==='three'&&((!G.wards.crag&&!hasAbil('wings'))||(!G.wards.mire&&!hasAbil('skimmer'))||(!G.wards.frost&&!(G.weapons&&G.weapons.bow&&G.flags.a1_frost_melted)))) return A1_HINT.three_gifts;
  if(st==='gate'&&!(G.weapons&&G.weapons.hammer)) return A1_HINT.gate_hammer; if(st==='summit'&&!hasAbil('dbljump')) return A1_HINT.summit_dj;
  if(st==='c_pass'&&a1Lacks()) return S(`Your mother is waiting at the pass, Ash. And she is right: learn to jump twice and to skim first. Hollis and little Minnow can help.`,`Learn to jump twice and skim first. Ask Hollis and Minnow.`);
  } }catch(e){ console.error(e); } return base(); }; }
{ const base=storyMarker; storyMarker=function(id){ if(base(id)) return true; try{ if(G&&G.mode==='story'&&id==='maren'&&G.stage==='gate'&&!(G.weapons&&G.weapons.hammer)) return true; }catch(e){} return false; }; }
{ const base=forgeHammerTalk; forgeHammerTalk=function(){
  if(G.mode==='story'&&reached('gate')&&!(G.weapons&&G.weapons.hammer)){
    const first=!G.flags.wpn_hamPitch; G.flags.wpn_hamPitch=true; let made=false;
    const L=STORY.maren.hammerOffer, lines=first?L.slice(0,-1):[];
    lines.push(ch('maren',first?L[L.length-1][1]:S(`Still want that hammer?`,`Still want the hammer?`),[
      {t:S(`Can I have it for free? It's for the mountain.`,`Can I have it free? It's for the mountain.`),tone:'kind',fn:()=>{ made=true; SFX.play('chest'); },then:STORY.a1_hammer_free.concat(STORY.maren.hammerMade||[])},
      {t:S('Maybe later','Maybe later'),then:[xl('maren',`The mountain won't wait forever, love. Neither will I.`,`The mountain won't wait. Neither will I.`)]}]));
    runDialogue(lines,()=>{ scene='play'; if(made) giveWeapon('hammer'); saveGame(); });
    return true; }
  return base(); }; }

// ---------- 14. allies in boss fights: Ulf's horn (Greymane), Captain Osric and his dogs (the Obsidian Gate)
{ const base=greyPack; greyPack=function(e){
  if(!(G&&a1q('horn'))) return base(e);
  shake(6); SFX.play('howl'); G.rings.push({x:e.x,y:e.y,rad:e.r,max:260,speed:500,thick:16,dmg:0,kb:280});
  ftext(e.x,e.y-e.r-24,S('The pack hears Ulf’s horn and stays away!','Ulf’s horn! No wolves come!'),'#cfeaff',15); }; }
{ const base=bossFightBegin; bossFightBegin=function(k){ base(k); try{
  if(k==='frost'&&a1q('horn')) later(1.2,()=>taunt('ulf',S(`(far away, a horn) That's the old pack-call, you big furball! Your family remembers it. Do you?`,`(a horn) That's the old pack-call, furball!`)));
  if(k==='gate'&&a1q('bounty2')){ const g=G.siteGuards.gate, ks=g?G.enemies.filter(e=>!e.dead&&e.camp===g&&e.type==='knight'):[];
    A1.dogs={until:G.time+40,ks,dogs:ks.map((q,i)=>({x:q.x+30,y:q.y+20,t:i*0.7}))};
    for(const q of ks){ q.a1Hold=G.time+40; q.a1hp=q.hp; }
    later(1.0,()=>{ taunt('osric',S(`Go get 'em, boys! Gently! They're very old! The dogs, I mean. Not the knights.`,`Go get 'em, boys! Gently!`)); setBanner(S('Captain Osric is here!','Osric is here!'),S('His dogs keep the knights busy. Go for Cindervane!','His dogs hold the knights. Go!'),3); }); }
  }catch(e){ console.error(e); } }; }
{ const base=runAI; runAI=function(f,e,dt){
  if(e&&e.a1Hold){ if(e.a1Hold>G.time&&!e.dead&&e.hp>=e.a1hp-0.5){ const D=A1.dogs, dg=D&&D.dogs[D.ks.indexOf(e)]; if(dg){ e.face=angTo(e.x,e.y,dg.x,dg.y); e.facing=e.face; } e.state='idle'; return; } e.a1Hold=0; }
  return base(f,e,dt); }; }
function a1DogTick(dt){
  const D=A1.dogs; if(!D) return;
  if(!G.bf||G.bf.k!=='gate'){ A1.dogs=null; return; }
  D.dogs.forEach((d,i)=>{ const q=D.ks[i]; d.t+=dt; if(!q||q.dead) return; const held=q.a1Hold>G.time; if(held){ const a=d.t*2.4; d.x=q.x+Math.cos(a)*34; d.y=q.y+Math.sin(a)*22; if(Math.random()<dt*1.2) ftext(d.x,d.y-24,S('WOOF!','WOOF!'),'#ffe6c0',12); } });
  if(D.until<=G.time&&!D.over){ D.over=true; taunt('osric',S(`That's all they've got! Good boys. Nap time.`,`Good boys! Nap time.`)); }
}

// ---------- 15. Old Thunder's quake ring, Pip's Five-Flame Breath
{ const base=hammerImpact; hammerImpact=function(h){
  base(h);
  try{ const p=player, K=wReachK(), ix=p.x+Math.cos(p.facing)*34*K, iy=p.y+Math.sin(p.facing)*34*K;
    if(G.mode==='story'&&!AREA&&a1on('a1_bram',1)) a1AnvilSmash(h,ix,iy);
    if(G.flags.a1_thunder&&(h.ch||0)>=0.95) a1Quake(ix,iy);
  }catch(e){ console.error(e); } }; }
function a1Quake(x,y){
  const R=200; G.wfx.push({k:'ring',x,y,t:0,dur:0.7,r:R,ch:1}); shake(10); SFX.play('boom',0.8);
  emit(x,y,30,{col:'190,170,140',glow:false,smin:120,smax:420,lmin:.3,lmax:.7,zmin:1,zmax:2,grow:4,drag:3});
  for(const e of G.enemies){ if(e.dead||e.flying||e.invuln||e.spawnIn>0) continue; const d=dist(x,y,e.x,e.y); if(d>R+e.r||d<40) continue;
    damageEnemy(e,player.stats.slash*player.stats.dmgMul*0.6,{src:'hammer',kb:260,ka:angTo(x,y,e.x,e.y)}); if(!e.dead) stunEnemy(e,0.6); }
  try{ if(AREA) areaObjHit(x,y,R,'hammer'); else { ARMS.hamCh=1; armsWorldHit(x,y,R,'hammer'); ARMS.hamCh=0; } }catch(e){}
}
{ const base=shoot; shoot=function(x,y,ang,spd,r,dmg,kind,owner,extra){
  if(kind==='pip'&&G&&G.flags&&G.flags.a1_pipfire){ dmg*=1.6; base(x,y,ang,spd,r+1,dmg,kind,owner,extra); const q=G.projectiles[G.projectiles.length-1]; if(q&&q.kind==='pip'){ q.a1f=true; A1.pipShots.push(q); } return; }
  return base(x,y,ang,spd,r,dmg,kind,owner,extra); }; }
{ const base=updateProjectiles; updateProjectiles=function(dt){ base(dt); try{
  if(!A1.pipShots.length) return;
  for(const q of A1.pipShots){ if(!q.dead||q.life<=0) continue; for(const e of G.enemies){ if(e.dead) continue; if(dist2(q.x,q.y,e.x,e.y)<(e.r+q.r+12)**2){ e.burnT=Math.max(e.burnT||0,2.4); e.burnDps=Math.max(e.burnDps||0,4*player.stats.fire*player.stats.dmgMul); break; } } }
  A1.pipShots=A1.pipShots.filter(q=>!q.dead);
}catch(e){ console.error(e); } }; }

// ---------- 16. the per-frame story tick (after the stock story and the acts engine)
{ const base=updateStory; updateStory=function(dt){ base(dt); try{ if(G&&G.mode==='story') a1Tick(dt); }catch(e){ console.error('a1 tick',e); } }; }
function a1Retro(){
  // an old save: the Trials' boss flags for gifts it already has, and the keys and boots its finished quests now give
  const F=G.flags; F.a1_v=1;
  for(const [id,ab] of [['leap','jump'],['tide','stride'],['sky','wings']]) if(hasAbil(ab)&&!F['trial_'+id+'_boss']) F['trial_'+id+'_boss']=true;
  const give=(q,it)=>{ if(a1q(q)&&!G.items[it]) G.items[it]=1; };
  give('kettle','a1_liftkey'); give('pie','a1_citykey'); give('marlo','a1_marlonote');
  if(a1q('moss')) F.perk_bog=true;
  if(a1q('sheep')&&!F.a1_bounce) a1Bounce(false);
  if(a1q('a1_bram')) F.a1_thunder=true;
  if(a1q('a1_pip')) F.a1_pipfire=true;
  if(a1q('a1_moth')) F.perk_moth=true;
}
function a1Tick(dt){
  const p=player; if(!p) return;
  if(!G.flags.a1_v) a1Retro();
  if(G.flags.a1_bounce&&!p.stats.a1b) a1Bounce(false);
  if(reached('hollow')&&!G.quests.trials&&scene==='play'&&!G.fightSite&&(typeof actOf!=='function'||actOf(G.stage)<=1)) startQuest('trials');
  if(AREA) return;
  if(A1W.on){
    a1SwirlTick(dt);
    if(!A1.swirl){ a1CausewayTick(); a1SpireTick(); a1FrostTick(); a1StragTick(); a1MothTick(dt); a1PipTick(dt); a1DogTick(dt); }
  }
  a1ThreadTick();
  // the goat comes home with Ash (a1_hop step 2)
  if(a1on('a1_hop',2)&&scene==='play'){ const h=G.npcs.find(n=>n.id==='hollis'), H=h?[h.x,h.y]:NPCSPOT.hollis; if(dist(p.x,p.y,H[0],H[1])<320){ G.flags.a1_hop_home=true; if(G.side.duchess==='follow'){ G.side.duchess='home'; G.flags.duchess_home=true; placeGoat(); } questPoke(); saveGame(); } }
}
// after the world is built: the Lake King's ripples race when a race is due
{ const base=initWorld; initWorld=function(){ base(); try{ const L=LANDMARKS.find(o=>o.id==='rc_lakeking'); if(L){ L.act=a1LakeKingAct; const pr=L.prompt; Object.defineProperty(L,'prompt',{get:()=>G&&(a1on('a1_skim',0)||a1on('a1_skim',1))?S('Challenge the Lake King','Race the Lake King'):pr,configurable:true}); } }catch(e){ console.error(e); } }; }
// Pip's Five-Flame Breath (the a1_pip reward)
QDEFS.a1_pip.steps[1].reward.fn='a1_pipfire';
{ const base=giveReward; giveReward=function(r){ base(r); try{ if(r&&r.fn==='a1_pipfire'){ G.flags.a1_pipfire=true; later(1.4,()=>setBanner(S('Pip’s Five-Flame Breath','Pip’s big flame'),S('Pip’s fire bolts hit 60 percent harder and set foes burning.','Pip’s fire is much stronger now!'),3.2)); } }catch(e){ console.error(e); } }; }
// the Royal Skip, and where to learn the two powers
defineAbility('skimmer',{name:S('The Royal Skip','The Royal Skip'),
  how:c=>S(`Sprint on water to skim. Skimming costs no stamina and is too fast for currents to grab.`,`Run on water. It is free, and currents can't grab you!`),
  tip:c=>S(`Sprint while you walk on water. Skimming costs no stamina, and whirlpools and currents can't catch you. Don't stop, and don't jump!`,`Run on water. Don't stop!`),
  where:S('Minnow Fisk on the Brindlecross dock knows who teaches it.','Ask Minnow on the Brindlecross dock.')});
// Old Thunder: the Forge Hammer takes the name once Mom has put the head on
{ const H=WEAPONS.hammer; if(H){ const n0=H.name, d0=H.desc;
  Object.defineProperty(H,'name',{configurable:true,get:()=>G&&G.flags&&G.flags.a1_thunder?S('Old Thunder','Old Thunder'):n0});
  Object.defineProperty(H,'desc',{configurable:true,get:()=>G&&G.flags&&G.flags.a1_thunder?d0+' '+S('A full charge sends a quake ring across the ground.','A full charge shakes the ground!'):d0}); } }
defineAbility('dbljump',{where:S('Farmer Hollis’s goat Duchess knows the secret.','Ask Farmer Hollis about his goat.')});

// ---------- 17. drawing
const A1O='#3b2233';
function a1Stroke(w){ ctx.strokeStyle=A1O; ctx.lineWidth=w||2; ctx.stroke(); }
function a1DrawPost(x,y){ ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x+2,y+3,7,3,0,0,TAU); ctx.fill(); ctx.fillStyle='#2e2420'; ctx.beginPath(); ctx.moveTo(x-5,y+2); ctx.lineTo(x-4,y-26); ctx.lineTo(x+1,y-30); ctx.lineTo(x+5,y-24); ctx.lineTo(x+5,y+2); ctx.closePath(); ctx.fill(); a1Stroke(1.6); ctx.fillStyle='#ff7a3a'; ctx.globalAlpha=0.5+0.3*Math.sin(G.time*3+x); ctx.fillRect(x-1,y-28,2,3); ctx.globalAlpha=1; }
function a1DrawSignPost(x,y,kind){
  ctx.fillStyle='#5a3c26'; ctx.fillRect(x-2.5,y-34,5,36); ctx.strokeStyle=A1O; ctx.lineWidth=1.5; ctx.strokeRect(x-2.5,y-34,5,36);
  ctx.save(); ctx.translate(x,y-40); ctx.rotate(kind==='oath'?-0.08:0.05); ctx.fillStyle=kind==='oath'?'#d8c8a8':'#c8a878'; ctx.beginPath(); rr(-26,-12,52,22,3); ctx.fill(); a1Stroke(1.6);
  ctx.fillStyle=kind==='oath'?'#8a1e1e':'#3b2233'; ctx.font=`800 ${kind==='oath'?7:8}px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  if(kind==='oath'){ ctx.fillText('NO EMBER-',0,-4); ctx.fillText('BLOODS!',0,4); } else { ctx.fillText('DANGER',0,-4); ctx.fillText('NO BRIDGE',0,5); }
  ctx.restore();
}
function a1DrawBanner(x,y,t){ ctx.save(); ctx.translate(x,y); ctx.rotate(0.5); ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(-16,-3,34,14); ctx.fillStyle='#4a2a5a'; ctx.beginPath(); ctx.moveTo(-18,-6); ctx.lineTo(18,-6+Math.sin(t*2)*1.5); ctx.lineTo(18,8); ctx.lineTo(0,4); ctx.lineTo(-18,8); ctx.closePath(); ctx.fill(); a1Stroke(1.4); ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); ctx.restore(); }
function a1DrawNest(x,y,t){
  ctx.save(); ctx.strokeStyle='#7a5a32'; ctx.lineWidth=3; for(let i=0;i<14;i++){ const a=i*0.45; ctx.beginPath(); ctx.ellipse(x,y+6,30+Math.sin(i)*3,13,a*0.2,a,a+2.2); ctx.stroke(); }
  ctx.fillStyle='#5a3e22'; ctx.beginPath(); ctx.ellipse(x,y+6,22,9,0,0,TAU); ctx.fill(); ctx.restore();
  if(!G.wards.crag) glowAt(x,y-6,44,'255,170,90',0.18+0.08*Math.sin(t*2));
}
function a1Sooty(){
  const C=A1W.ash; if(!inView(C.x,C.y,C.ro+40)) return;
  ctx.save(); ctx.fillStyle='rgba(24,14,22,.55)'; ctx.beginPath(); ctx.arc(C.x,C.y,C.ro+6,0,TAU); ctx.arc(C.x,C.y,C.ri-6,0,TAU,true); ctx.fill('evenodd');
  ctx.strokeStyle='rgba(70,60,60,.3)'; ctx.lineWidth=2; for(let i=0;i<5;i++){ const r=C.ri+40+i*36+Math.sin(G.time*0.6+i)*6; ctx.beginPath(); ctx.arc(C.x,C.y,r,i,i+1.2); ctx.stroke(); }
  ctx.restore();
}
function a1DrawSwirl(t){
  const GP=A1W.gloam; if(!inView(GP.x,GP.y,GP.r+40)) return;
  ctx.save(); ctx.fillStyle='rgba(60,80,50,.35)'; ctx.beginPath(); ctx.arc(GP.x,GP.y,GP.r+4,0,TAU); ctx.arc(GP.x,GP.y,GP.isle+2,0,TAU,true); ctx.fill('evenodd'); ctx.fillStyle='rgba(30,50,40,.25)'; ctx.beginPath(); ctx.arc(GP.x,GP.y,GP.s1,0,TAU); ctx.arc(GP.x,GP.y,GP.s0,0,TAU,true); ctx.fill('evenodd');
  for(let i=0;i<9;i++){ const r=lerp(GP.s0+8,GP.s1-8,i/8), a=t*(2.6-i*0.12)+i*1.7; ctx.strokeStyle=`rgba(220,240,220,${0.22+0.1*Math.sin(t*3+i)})`; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(GP.x,GP.y,r,a,a+1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(GP.x,GP.y,r,a+Math.PI,a+Math.PI+1.1); ctx.stroke(); }
  for(let i=0;i<5;i++){ const a=t*0.4+i*1.25; glowAt(GP.x+Math.cos(a)*(GP.r+30),GP.y+Math.sin(a)*(GP.r+30)*0.9,70,'200,220,200',0.08); }
  ctx.restore();
}
function a1DrawIceBlock(x,y){
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x,y+16,44,12,0,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(170,215,250,.78)'; ctx.beginPath(); ctx.moveTo(x-40,y+14); ctx.lineTo(x-44,y-40); ctx.lineTo(x-16,y-70); ctx.lineTo(x+22,y-66); ctx.lineTo(x+44,y-36); ctx.lineTo(x+40,y+14); ctx.closePath(); ctx.fill(); a1Stroke(2.2);
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(x-34,y-36); ctx.lineTo(x-14,y-60); ctx.lineTo(x-6,y-56); ctx.lineTo(x-26,y-30); ctx.closePath(); ctx.fill();
  glowAt(x,y-20,26,'255,150,90',0.18); ctx.restore();
}
function a1DrawFrostLantern(x,y,i,t){
  const lit=!!G.flags['a1_frost_'+(i+1)], R=A1W.frost.ring;
  ctx.save();
  for(let k=0;k<14;k++){ const a=k/14*TAU, sx=x+Math.cos(a)*R, sy=y+Math.sin(a)*R*0.86; ctx.fillStyle='#bfe2f8'; ctx.beginPath(); ctx.moveTo(sx-7,sy+4); ctx.lineTo(sx,sy-22-(k%3)*5); ctx.lineTo(sx+7,sy+4); ctx.closePath(); ctx.fill(); a1Stroke(1.3); }
  ctx.fillStyle='#9ccbe8'; ctx.beginPath(); ctx.moveTo(x-18,y+8); ctx.lineTo(x-12,y-56); ctx.lineTo(x+12,y-56); ctx.lineTo(x+18,y+8); ctx.closePath(); ctx.fill(); a1Stroke(2);
  ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(x-9,y-50,4,52);
  ctx.fillStyle='#4a3a5a'; ctx.beginPath(); rr(x-9,y-80,18,24,4); ctx.fill(); a1Stroke(1.6);
  ctx.fillStyle=lit?'#ffd070':'#cfe8ff'; ctx.beginPath(); rr(x-6,y-77,12,18,3); ctx.fill();
  if(lit){ glowAt(x,y-68,46,'255,190,90',0.55+0.1*Math.sin(t*6+i)); ctx.fillStyle='#fff2c0'; ctx.beginPath(); ctx.ellipse(x,y-69+Math.sin(t*9)*0.6,2.6,4.6,0,0,TAU); ctx.fill(); }
  else glowAt(x,y-68,24,'190,230,255',0.25);
  ctx.restore();
}
function a1DrawAnvil(x,y,t){
  const hot=!!G.flags.a1_bram_hot&&!G.flags.a1_bram_free, free=!!G.flags.a1_bram_free;
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x+4,y+18,50,14,0,0,TAU); ctx.fill();
  ctx.fillStyle=hot?'#5a2a20':'#26222a'; ctx.beginPath(); ctx.moveTo(x-46,y+16); ctx.lineTo(x-40,y-22); ctx.lineTo(x-14,y-38); ctx.lineTo(x+24,y-34); ctx.lineTo(x+46,y-12); ctx.lineTo(x+44,y+16); ctx.closePath(); ctx.fill(); a1Stroke(2.4);
  ctx.fillStyle='rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(x-36,y-20); ctx.lineTo(x-12,y-34); ctx.lineTo(x+10,y-32); ctx.lineTo(x-20,y-16); ctx.closePath(); ctx.fill();
  if(!free){ ctx.fillStyle=hot?'#e8603a':'#4a4650'; ctx.beginPath(); rr(x-20,y-62,40,24,4); ctx.fill(); a1Stroke(2); ctx.fillStyle=hot?'#ffb070':'#6a6670'; ctx.fillRect(x-17,y-60,34,4); ctx.fillStyle='#ffd84a'; ctx.beginPath(); ctx.moveTo(x+2,y-58); ctx.lineTo(x-4,y-49); ctx.lineTo(x+1,y-49); ctx.lineTo(x-3,y-41); ctx.lineTo(x+6,y-52); ctx.lineTo(x+1,y-52); ctx.closePath(); ctx.fill(); }
  else { ctx.fillStyle='#120c10'; ctx.beginPath(); ctx.ellipse(x,y-36,16,6,0,0,TAU); ctx.fill(); }
  if(hot){ glowAt(x,y-30,90,'255,120,60',0.4+0.12*Math.sin(t*4)); if(Math.random()<0.3) emit(x+rand(-30,30),y-40,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:3}); }
  ctx.restore();
}
function a1DrawPit(x,y,i,hi,t){
  const P=A1.pits||[0,0,0], lit=P[i]>G.time||(G.flags.a1_bram_hot&&!G.flags.a1_bram_free), left=Math.max(0,P[i]-G.time);
  ctx.save();
  if(hi){ for(let k=0;k<12;k++){ const a=k/12*TAU, sx=x+Math.cos(a)*64, sy=y+Math.sin(a)*52; ctx.fillStyle='#4a3e3a'; ctx.beginPath(); rr(sx-8,sy-18,16,22,3); ctx.fill(); a1Stroke(1.3); }
    ctx.fillStyle='#5a4a44'; ctx.beginPath(); ctx.moveTo(x-22,y+8); ctx.lineTo(x-16,y-44); ctx.lineTo(x+16,y-44); ctx.lineTo(x+22,y+8); ctx.closePath(); ctx.fill(); a1Stroke(2); }
  const by=hi?y-50:y; ctx.fillStyle='#2a2224'; ctx.beginPath(); ctx.ellipse(x,by,16,7,0,0,TAU); ctx.fill(); a1Stroke(1.8); ctx.fillStyle='#1a1214'; ctx.beginPath(); ctx.ellipse(x,by-1,11,4,0,0,TAU); ctx.fill();
  if(lit){ glowAt(x,by-8,44,'255,160,80',0.5); for(let k=0;k<3;k++){ ctx.fillStyle=k?'#ffb040':'#ff6a20'; ctx.beginPath(); ctx.ellipse(x+(k-1)*5,by-6-Math.sin(t*9+k)*2,4-k*0.6,9-k*2,0,0,TAU); ctx.fill(); }
    if(left>0&&left<4&&!G.flags.a1_bram_hot){ ctx.fillStyle='#fff'; ctx.font=`800 11px ${UIF}`; ctx.textAlign='center'; ctx.fillText(String(Math.ceil(left)),x,by-22); } }
  ctx.restore();
}
function a1DrawCamp(x,y,t){
  const out=A1.campOut||G.flags.a1_moth_fought, gone=G.flags.a1_moth_camp;
  ctx.save(); if(!gone){ ctx.fillStyle='#6a5a7a'; ctx.beginPath(); rr(x+18,y-8,46,18,8); ctx.fill(); a1Stroke(1.6); ctx.fillStyle='#8a7a9a'; ctx.beginPath(); rr(x+18,y-8,14,18,6); ctx.fill(); }
  ctx.fillStyle='#3a3030'; for(let k=0;k<6;k++){ const a=k/6*TAU; ctx.beginPath(); ctx.arc(x+Math.cos(a)*12,y+Math.sin(a)*6,4,0,TAU); ctx.fill(); }
  ctx.strokeStyle='#5a4030'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-8,y-2); ctx.lineTo(x+8,y+3); ctx.moveTo(x-6,y+4); ctx.lineTo(x+7,y-3); ctx.stroke();
  if(!gone){ ctx.fillStyle='#6a6a72'; ctx.beginPath(); ctx.arc(x-26,y+6,7,0,TAU); ctx.fill(); a1Stroke(1.4);
    ctx.fillStyle='#4a3a2a'; ctx.fillRect(x-42,y-30,2,30); ctx.fillStyle=out?'#555':'#ffd890'; ctx.beginPath(); rr(x-47,y-40,12,14,3); ctx.fill(); a1Stroke(1.2); if(!out&&isNight()) glowAt(x-41,y-33,40,'255,220,140',0.5); }
  for(let k=0;k<5;k++){ ctx.fillStyle='rgba(60,50,40,.35)'; ctx.beginPath(); ctx.ellipse(x-60+k*14,y+26+(k%2)*6,3,5,0.4,0,TAU); ctx.fill(); }
  ctx.restore();
}
function a1DrawRockfall(x,y,closed){
  ctx.save(); const R=closed?[[0,0,34],[-30,10,24],[30,8,26],[-10,-22,22],[18,-18,18],[46,-6,16]]:[[44,10,20],[66,-6,16],[-46,14,14]];
  for(const [dx,dy,r] of R){ ctx.fillStyle='#8a7e72'; ctx.beginPath(); ctx.ellipse(x+dx,y+dy,r,r*0.8,0,0,TAU); ctx.fill(); a1Stroke(2); ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(x+dx-r*0.3,y+dy-r*0.3,r*0.4,r*0.25,0,0,TAU); ctx.fill(); }
  ctx.restore();
}
function a1DrawVault(x,y,t){
  ctx.save(); ctx.fillStyle='#4a4038'; ctx.beginPath(); ctx.arc(x,y+2,13,Math.PI,0); ctx.lineTo(x+13,y+8); ctx.lineTo(x-13,y+8); ctx.closePath(); ctx.fill(); a1Stroke(1.6);
  ctx.fillStyle=G.found.a1_vault?'#140c0c':'#7a5a30'; ctx.beginPath(); ctx.arc(x,y+3,9,Math.PI,0); ctx.lineTo(x+9,y+8); ctx.lineTo(x-9,y+8); ctx.closePath(); ctx.fill();
  if(!G.found.a1_vault){ ctx.fillStyle='#1a1008'; ctx.beginPath(); ctx.arc(x,y,2.4,0,TAU); ctx.fill(); ctx.fillRect(x-1,y,2,4); if(G.items&&G.items.a1_citykey) glowAt(x,y,22,'255,220,140',0.3+0.15*Math.sin(t*3)); }
  ctx.restore();
}
function a1DrawCart(x,y,t){
  ctx.save(); ctx.strokeStyle='#5a4a3a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-40,y+10); ctx.lineTo(x+40,y+10); ctx.moveTo(x-40,y+18); ctx.lineTo(x+40,y+18); ctx.stroke();
  for(let k=-36;k<=36;k+=12){ ctx.fillStyle='#4a3828'; ctx.fillRect(x+k-2,y+7,4,14); }
  ctx.fillStyle='#6a5a4a'; ctx.beginPath(); ctx.moveTo(x-20,y-12); ctx.lineTo(x+20,y-12); ctx.lineTo(x+16,y+10); ctx.lineTo(x-16,y+10); ctx.closePath(); ctx.fill(); a1Stroke(1.8);
  ctx.fillStyle='#2a2228'; for(const k of [-11,11]){ ctx.beginPath(); ctx.arc(x+k,y+12,4.5,0,TAU); ctx.fill(); }
  if(!G.flags.tunnel_plans){ ctx.strokeStyle='#9a9aa0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+20,y); ctx.lineTo(x+32,y+6); ctx.stroke(); ctx.fillStyle='#8a1e1e'; ctx.beginPath(); rr(x+29,y+3,7,7,2); ctx.fill(); }
  ctx.restore();
}
function a1DrawBoat(x,y,t,on){
  ctx.save(); ctx.fillStyle='#6a4a2c'; ctx.fillRect(x-4,y-26,6,30); a1Stroke(1.2); ctx.strokeStyle='#c8b080'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x,y-18); ctx.quadraticCurveTo(x+18,y-6,x+30,y+6); ctx.stroke();
  ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.arc(x+1,y-30,4,0,TAU); ctx.fill(); a1Stroke(1.2);
  if(on){ const b=Math.sin(t*1.6)*1.5; ctx.fillStyle='#8a5a32'; ctx.beginPath(); ctx.ellipse(x+40,y+12+b,26,9,0.1,0,TAU); ctx.fill(); a1Stroke(1.8); ctx.fillStyle='#5a3a20'; ctx.beginPath(); ctx.ellipse(x+40,y+10+b,20,6,0.1,0,TAU); ctx.fill(); }
  ctx.restore();
}
function a1DrawFence(F){ const [x,y,len,ang]=F, c=Math.cos(ang), s=Math.sin(ang); ctx.save(); ctx.strokeStyle='#7a5a36'; ctx.lineWidth=4; for(const h of [10,18]){ ctx.beginPath(); ctx.moveTo(x-c*len/2,y-s*len/2-h); ctx.lineTo(x+c*len/2,y+s*len/2-h); ctx.stroke(); }
  const n=Math.round(len/16); for(let k=0;k<=n;k++){ const u=-len/2+k*len/n; ctx.fillStyle='#8a6a42'; ctx.beginPath(); rr(x+c*u-2.5,y+s*u-24,5,26,1.5); ctx.fill(); a1Stroke(1.2); } ctx.restore(); }
function a1DrawGoatstair(t){
  if(!inView(3360,4700,560)) return;
  ctx.save();
  // chalky ledges along the path
  const P=A1W.goat.path; ctx.strokeStyle='rgba(240,232,214,.55)'; ctx.lineWidth=46; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(P[0][0],P[0][1]); for(const q of P) ctx.lineTo(q[0],q[1]); ctx.stroke();
  ctx.strokeStyle='rgba(200,186,160,.5)'; ctx.lineWidth=3; ctx.setLineDash([16,10]); ctx.stroke(); ctx.setLineDash([]);
  // the rifts: deep cracks in the chalk and snow, with a far wall, icicles and a snowy lip
  A1W.goat.rifts.forEach((R,ri)=>{ ctx.save(); ctx.translate(R[0],R[1]); ctx.rotate(R[4]);
    const n=22, pts=[]; for(let k=0;k<n;k++){ const a=k/n*TAU, j=0.86+0.14*Math.abs(Math.sin(k*2.7+ri*1.3)); pts.push([Math.cos(a)*R[2]*(0.97+0.03*j),Math.sin(a)*R[3]*j]); }
    const path=()=>{ ctx.beginPath(); pts.forEach(([x,y],k)=>k?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); };
    path(); ctx.fillStyle='#120c12'; ctx.fill();
    ctx.save(); path(); ctx.clip(); ctx.fillStyle='#4a3e52'; ctx.beginPath(); ctx.ellipse(0,-R[3]*0.55,R[2]*1.05,R[3]*0.75,0,0,TAU); ctx.fill(); ctx.fillStyle='#2a2232'; ctx.beginPath(); ctx.ellipse(0,-R[3]*0.15,R[2]*0.95,R[3]*0.55,0,0,TAU); ctx.fill(); ctx.fillStyle='#120c12'; ctx.beginPath(); ctx.ellipse(0,R[3]*0.25,R[2]*0.8,R[3]*0.5,0,0,TAU); ctx.fill();
      ctx.fillStyle='#d8e8f4'; for(let k=0;k<9;k++){ const x=-R[2]*0.8+k*R[2]*0.2, y=-R[3]*0.92+Math.abs(Math.sin(k*1.9))*R[3]*0.2; ctx.beginPath(); ctx.moveTo(x-4,y); ctx.lineTo(x,y+8+(k%3)*5); ctx.lineTo(x+4,y); ctx.closePath(); ctx.fill(); } ctx.restore();
    path(); ctx.strokeStyle='#f4f8fc'; ctx.lineWidth=6; ctx.stroke(); ctx.strokeStyle=A1O; ctx.lineWidth=2; ctx.stroke();
    ctx.restore(); });
  // goat prints
  for(let i=0;i<P.length-1;i+=1){ const [ax,ay]=P[i], [bx,by]=P[i+1]; for(let k=0.2;k<1;k+=0.3){ const x=lerp(ax,bx,k), y=lerp(ay,by,k); if(a1Rift(x,y)) continue; ctx.fillStyle='rgba(90,70,60,.45)'; ctx.beginPath(); ctx.ellipse(x-3,y,2,3,0,0,TAU); ctx.ellipse(x+3,y,2,3,0,0,TAU); ctx.fill(); } }
  ctx.restore();
}
function a1DrawKing(x,y,a,t){
  if(!inView(x,y,120)) return;
  ctx.save(); ctx.translate(x,y); ctx.rotate(a);
  ctx.fillStyle='rgba(20,40,60,.45)'; ctx.beginPath(); ctx.ellipse(0,0,46,18,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-40,0); ctx.lineTo(-64,-14+Math.sin(t*8)*4); ctx.lineTo(-64,14+Math.sin(t*8)*4); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f0c038'; ctx.beginPath(); ctx.moveTo(-6,-4); ctx.lineTo(-2,-16); ctx.lineTo(3,-8); ctx.lineTo(8,-18); ctx.lineTo(12,-8); ctx.lineTo(17,-16); ctx.lineTo(20,-4); ctx.closePath(); ctx.fill(); a1Stroke(1.6);
  ctx.restore();
}
function a1DrawMoth(x,y,t,s){
  s=s||1; const f=Math.sin(t*22)*0.5+0.5; ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  for(const k of [-1,1]){ ctx.fillStyle='#a8a0b8'; ctx.beginPath(); ctx.ellipse(k*9,-2,10,6+f*3,k*0.5,0,TAU); ctx.fill(); a1Stroke(1.3); ctx.fillStyle='#e8e4f4'; ctx.beginPath(); ctx.arc(k*10,-3,2.6,0,TAU); ctx.fill(); ctx.fillStyle='#3b2233'; ctx.beginPath(); ctx.arc(k*10,-3,1.1,0,TAU); ctx.fill(); }
  ctx.fillStyle='#6a6070'; ctx.beginPath(); ctx.ellipse(0,0,3,7,0,0,TAU); ctx.fill(); ctx.restore();
}
// the Nursery's own things
FL.a1_hoof=(o,t)=>{ ctx.save(); const g=0.35+0.25*Math.sin(t*2.5+o.n*0.6); glowAt(o.x,o.y,20,'255,240,190',g*0.5); ctx.fillStyle=`rgba(255,236,170,${0.5+g*0.5})`; for(const k of [-1,1]){ ctx.beginPath(); ctx.ellipse(o.x+k*4,o.y+(o.n%2?2:-2),2.6,4,k*0.2,0,TAU); ctx.fill(); } ctx.restore(); };
FL.a1_goatnpc=(o,t)=>{ if(o.smug&&AREA&&AREA.rooms&&AREA.rooms.a&&AREA.curRoom!==AREA.rooms.a) return; drawGoat({x:o.x,y:o.y,face:Math.PI/2+Math.sin(t*0.5)*0.4,t,moving:false,r:10,kind:'goat'}); if(Math.sin(t*0.7+o.x)>0.96) ftext(o.x,o.y-30,S('Meh.','Meh.'),'#fff4e0',11); };
FL.a1_draw=(o,t)=>{ ctx.save(); ctx.translate(o.x,o.y); ctx.strokeStyle='rgba(30,20,20,.75)'; ctx.lineWidth=1.6; ctx.lineCap='round'; const v=o.v;
  if(v===0){ ctx.beginPath(); ctx.ellipse(0,0,14,7,0,0,TAU); ctx.moveTo(12,-2); ctx.lineTo(20,-8); ctx.moveTo(-10,-4); ctx.lineTo(-6,-12); ctx.lineTo(-2,-5); ctx.stroke(); ctx.fillStyle='rgba(200,60,40,.5)'; ctx.fill(); }
  else if(v===1){ ctx.beginPath(); ctx.ellipse(0,0,7,4,0,0,TAU); ctx.moveTo(-6,6); ctx.quadraticCurveTo(0,-10,6,6); ctx.stroke(); }
  else if(v===2){ for(let k=0;k<5;k++){ const x=-12+k*6; ctx.beginPath(); ctx.arc(x,-6,2,0,TAU); ctx.moveTo(x,-4); ctx.lineTo(x,4); ctx.moveTo(x-3,8); ctx.lineTo(x,4); ctx.lineTo(x+3,8); ctx.stroke(); } }
  else if(v===3){ ctx.beginPath(); ctx.rect(-8,-4,16,12); ctx.moveTo(-10,-4); ctx.lineTo(0,-12); ctx.lineTo(10,-4); ctx.moveTo(5,-10); ctx.lineTo(5,-16); ctx.stroke(); ctx.beginPath(); ctx.arc(7,-19,2,0,TAU); ctx.stroke(); }
  else { ctx.beginPath(); ctx.ellipse(0,0,9,5,0,0,TAU); ctx.moveTo(-8,4); ctx.lineTo(-8,9); ctx.moveTo(6,4); ctx.lineTo(6,9); ctx.moveTo(8,-3); ctx.lineTo(13,-8); ctx.stroke(); }
  ctx.restore(); };
FL.a1_straw=(o,t)=>{ ctx.save(); ctx.strokeStyle='rgba(230,200,110,.7)'; ctx.lineWidth=1.4; for(let k=0;k<6;k++){ const a=k*1.1+o.v; ctx.beginPath(); ctx.moveTo(o.x+Math.cos(a)*3,o.y+Math.sin(a)*2); ctx.lineTo(o.x+Math.cos(a)*11,o.y+Math.sin(a)*5); ctx.stroke(); } ctx.restore(); };
{ const base=drawFurnX; drawFurnX=function(o,t){
  if(o&&o.k==='block'&&a1InNursery()){ const x=o.x, y=o.y; ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x-20,y-10,44,32); ctx.fillStyle='#d8b050'; ctx.beginPath(); rr(x-21,y-20,42,38,7); ctx.fill(); a1Stroke(2.2);
    ctx.strokeStyle='rgba(140,100,40,.7)'; ctx.lineWidth=1.4; for(let k=-14;k<=14;k+=5){ ctx.beginPath(); ctx.moveTo(x+k,y-18); ctx.lineTo(x+k+2,y+16); ctx.stroke(); } ctx.fillStyle='#a8322a'; ctx.fillRect(x-21,y-4,42,4); ctx.restore(); return true; }
  return base(o,t); }; }
// the causeway's charred planks
{ const base=drawBridge; drawBridge=function(g,br){
  if(br.kind!=='a1_char') return base(g,br);
  g.save(); g.translate(br.x,br.y); g.rotate(br.ang); const L=br.len/2, w=br.w/2;
  g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(-L+4,-w+6,br.len,br.w); g.fillStyle=A1O; g.fillRect(-L-1,-w-1,br.len+2,br.w+2);
  for(let x=-L;x<L;x+=9){ const i=((x/9)|0)%3; g.fillStyle=i===0?'#5a4434':i===1?'#4a382c':'#62483a'; g.fillRect(x+0.6,-w,8.2,br.w); g.fillStyle='rgba(20,10,10,.35)'; g.fillRect(x+0.6,w-6,8.2,6); }
  g.fillStyle='rgba(255,120,60,.25)'; g.fillRect(-L,-w,4,br.w); g.fillRect(L-4,-w,4,br.w);
  g.restore(); }; }
// what draws every frame on the ground (the sooty moat, the swirl, the Goatstair) and the tall things for the sort
function a1RenderExtra(list){
  const t=G.time;
  a1Sooty(); a1DrawSwirl(t); a1DrawGoatstair(t);
  const L=A1.pipL;
  if(L&&L.id==='hollow') for(const s of L.sp) if(!s.got) list.push({x:s.x,y:s.y,draw:()=>{ glowAt(s.x,s.y-10,22,'255,210,120',0.7); ctx.fillStyle='#fff0b0'; ctx.beginPath(); ctx.arc(s.x,s.y-10-Math.abs(Math.sin(t*8+s.x))*8,4,0,TAU); ctx.fill(); }});
  if(L&&L.id==='crag') L.rings.forEach((R,i)=>{ if(i<L.i) return; list.push({x:R.x,y:R.y+200,draw:()=>{ ctx.save(); ctx.strokeStyle=i===L.i?`rgba(240,236,230,${0.7+0.2*Math.sin(t*5)})`:'rgba(230,226,220,.35)'; ctx.lineWidth=i===L.i?9:6; ctx.beginPath(); ctx.ellipse(R.x,R.y-70,44,30,0,0,TAU); ctx.stroke(); ctx.restore(); }}); });
  if(L&&(L.id==='mire'||L.id==='frost')){ const W=WARDS[L.id], k=L.id==='mire'?Math.min(1,L.h/2.8):Math.min(1,L.h/3.4); list.push({x:W.x,y:W.y+300,draw:()=>{ ctx.save(); ctx.fillStyle='rgba(14,8,6,.75)'; ctx.fillRect(W.x-40,W.y-64,80,10); ctx.fillStyle=L.id==='mire'&&L.h>1.4?'#9be86a':'#ff9a3a'; ctx.fillRect(W.x-39,W.y-63,78*k,8); if(L.id==='mire'){ ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fillRect(W.x-40+80*(1.4/2.8),W.y-66,2,14); } ctx.restore(); }}); }
  const D=A1.dogs; if(D){ D.dogs.forEach((d,i)=>{ const q=D.ks[i]; if(!q) return; const held=q.a1Hold>G.time&&!q.dead; list.push({x:d.x,y:d.y,draw:()=>a1DrawDog(d.x,d.y,t+i,!held)}); }); }
}
function a1DrawDog(x,y,t,tired){
  ctx.save(); ctx.translate(x,y); ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0,6,13,4,0,0,TAU); ctx.fill();
  const b=tired?0:Math.abs(Math.sin(t*9))*4; ctx.translate(0,-b);
  ctx.fillStyle='#a8784a'; ctx.beginPath(); ctx.ellipse(0,0,12,tired?5:7,0,0,TAU); ctx.fill(); a1Stroke(1.5); ctx.beginPath(); ctx.arc(10,tired?-1:-5,6,0,TAU); ctx.fill(); a1Stroke(1.5);
  ctx.fillStyle='#6a4a2a'; ctx.beginPath(); ctx.ellipse(12,tired?-5:-10,2.5,4,0.4,0,TAU); ctx.fill(); ctx.fillStyle='#e8e0d0'; ctx.beginPath(); ctx.arc(8,tired?-3:-7,2,0,TAU); ctx.fill(); ctx.restore();
}

{ const base=render; render=function(){ A1.frames=(A1.frames||0)+1; return base.apply(this,arguments); }; }
// ---------- 18. test hooks: window.__ebA1
window.__ebA1={A1,A1W,
  state:()=>({stage:G.stage,flags:Object.fromEntries(Object.entries(G.flags).filter(([k])=>k.startsWith('a1_')||k.startsWith('perk_')||k.startsWith('trial_'))),quests:Object.fromEntries(Object.entries(G.quests).map(([k,q])=>[k,{step:q.step,done:!!q.done}])),abil:Object.assign({},G.abil),items:Object.assign({},G.items),wards:Object.assign({},G.wards),mini:G.mini?G.mini.kind:null,pipL:A1.pipL?A1.pipL.id+':'+A1.pipL.ph:null,swirl:!!A1.swirl,maxHp:player.maxHp,jumpK:player.stats.jumpK}),
  objectives:()=>objectiveList().map(o=>({text:simplify(String(o.text)),x:Math.round(o.x),y:Math.round(o.y)})),
  hint:()=>simplify(String(hintLine())),
  at:(id)=>{ const L=LANDMARKS.find(o=>o.id===id); return L?{x:L.x,y:L.y}:null; },
  cw:()=>({Q:A1W.cw.Q,T:A1W.cw.T,d:A1W.cw.d,planks:A1W.cw.planks,gaps:A1W.cw.gaps,at:(t,o)=>a1At(t,o)}),
  cwAt:(t,o)=>a1At(t,o||0), moat:(x,y)=>a1Moat(x,y), rift:(x,y)=>!!a1Rift(x,y), blocked:(x,y)=>playerBlocked(x,y), onSpire:()=>a1OnSpire(), lvl:(x,y)=>elevLvl(x,y),
  ward:id=>WARDS[id]?{x:WARDS[id].x,y:WARDS[id].y}:null, race:()=>A1W.race, mini:()=>{ const M=G.mini; return M?{kind:M.kind,i:M.i,kIdx:M.kIdx,away:M.away,gi:M.i,g:M.g?{x:Math.round(M.g.x),y:Math.round(M.g.y),z:M.g.z}:null}:null; },
  pipStart:id=>a1PipStart(id), pipL:()=>A1.pipL, pitLight:i=>a1PitLight(i), fireAt:(x,y,r)=>a1FireAt(x,y,r||12), camp:()=>a1CampAct(), cart:b=>a1Cart(b), vault:()=>a1VaultAct(), ferry:()=>a1FerryBack(),
  lakeKing:()=>a1LakeKingAct(LANDMARKS.find(o=>o.id==='rc_lakeking')), smash:ch=>{ const h={ch:ch==null?1:ch}; hammerImpact(h); },
  probe:(x0,y0,x1,y1,st)=>{ const out=[]; for(let y=y0;y<=y1;y+=st){ let r=''; for(let x=x0;x<=x1;x+=st){ const s=T(x,y,{}); let c='.'; if(playerBlocked(x,y)) c=s.water?'~':'#'; else if(colAt(x,y,10)) c='o'; else if(elevFace(x,y)) c='^'; else if(s.road>0) c='='; r+=c; } out.push(r); } const inb=o=>o.x>=x0&&o.x<=x1&&o.y>=y0&&o.y<=y1; return {rows:out,houses:HOUSES.filter(inb).map(h=>[h.k,Math.round(h.x),Math.round(h.y),h.w,h.h]),structs:STRUCTS.filter(inb).map(q=>[q.k,Math.round(q.x),Math.round(q.y)]).slice(0,40),lms:LANDMARKS.filter(inb).map(l=>[l.id||l.k,Math.round(l.x),Math.round(l.y)]),pois:Object.entries(POI).filter(([k,v])=>inb(v)).map(([k,v])=>[k,v.x,v.y,v.r]),doors:DOORS.filter(inb).map(d=>[d.area,Math.round(d.x),Math.round(d.y)])}; },
  cell:(room,i,j)=>{ const A=AREA, R=A&&A.rooms&&A.rooms[room]; if(!R) return null; const cs=A.cave.cell; return {x:A.x0+(R.ox+1+i+0.5)*cs,y:A.y0+(R.oy+1+j+0.5)*cs}; },
  blocks:()=>AREA&&AREA.blocks?AREA.blocks.map(b=>({ci:b.ci,cj:b.cj,sunk:!!b.sunk,room:b.room})):[], room:()=>AREA&&AREA.curRoom?AREA.curRoom.id:null, solved:id=>!!(AREA&&AREA.rooms&&AREA.rooms[id]&&AREA.rooms[id].solved),
  dlgStep:i=>{ if(!DLG||scene!=='dialogue') return 0; const tx=DLG.text||''; if(DLG.opts){ DLG.chars=tx.length; DLG.optsAt=performance.now()-99999; DLG.fullAt=performance.now()-99999; dlgChoose(i|0); return 2; } DLG.chars=tx.length; DLG.lockT=0; DLG.fullAt=performance.now()-99999; advanceDialogue(); return 1; },
  frames:()=>A1.frames||0,
  dlgText:()=>DLG?simplify(String(DLG.text||'')):null,
  dlgOpts:()=>DLG&&DLG.opts?DLG.opts.map(o=>simplify(String(o.t))):null, prompt:()=>G.prompt?simplify(String(G.prompt.text)):null, roarKey:()=>a1RoarKey(),
  greyTest:()=>{ const n0=G.enemies.filter(e=>!e.dead&&e.type==='wolf').length; const e={x:player.x,y:player.y-120,r:22,face:0,level:5,type:'greymane',homeX:player.x,homeY:player.y}; try{ greyPack(e); }catch(err){ return 'err:'+err; } return G.enemies.filter(q=>!q.dead&&q.type==='wolf').length-n0; },
  burnAll:type=>{ let n=0; for(const e of G.enemies) if(!e.dead&&(!type||e.type===type)){ e.burnT=4; e.burnDps=99999; e.invuln=false; n++; } return n; },
  foes:type=>G.enemies.filter(e=>!e.dead&&(!type||e.type===type)).map(e=>({type:e.type,x:Math.round(e.x),y:Math.round(e.y),hp:Math.round(e.hp),stun:e.stun||0,hold:!!(e.a1Hold&&e.a1Hold>G.time)})),
  give:r=>giveReward(r), festLines:d=>typeof festIntroLines==='function'?festIntroLines(d):[], talkOpts:id=>compTalkOpts(id,null).map(o=>simplify(String(o.t))),
  winRace:()=>{ const M=G.mini; if(M&&M.kind==='a1_skimrace') a1RaceWin(M); }, nursery:()=>a1NurseryOpen(), retro:()=>a1Retro(), quake:(x,y)=>a1Quake(x,y)
};
