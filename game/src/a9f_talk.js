
// ================= conversations, friendship and gifts
function shortName(id){ if(id==='shellby') return 'the old turtle'; if(id==='maren') return 'Mom'; const n=personName(id).replace(', your mom',''), w=n.split(' '); return ['Sister','Captain','Mayor','Professor','Farmer','Granny','Elder','Old','Nana'].includes(w[0])?w.slice(0,2).join(' '):w[0]; }
const dayNow=()=>Math.floor((G.worldTime||0)/540);
function friendOf(id){ return clamp((G.friends&&G.friends[id])||0,0,5); }
function befriend(id,n,quiet){
  if(!id||!CASTBY[id]||!n) return;
  G.friends=G.friends||{}; const before=friendOf(id);
  G.friends[id]=clamp(before+n,0,5); const after=friendOf(id);
  const who=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id);
  if(who&&!quiet) ftext(who.x,who.y-34,n>0?'♥':'💔','#ff8aa0',16);
  if(Math.floor(after)>Math.floor(before)&&!quiet){ setBanner(`${personName(id).replace(', your mom','')}  ${'♥'.repeat(Math.floor(after))}${'♡'.repeat(5-Math.floor(after))}`,after>=5?'Best friends!':after>=3?'Good friends. They might share a secret.':'You are getting along.',2.2); SFX.play('quest'); }
}
function hearts(id){ const f=Math.floor(friendOf(id)); return '♥'.repeat(f)+'♡'.repeat(5-f); }
function giveTalkReward(r){
  if(!r) return;
  const p=player;
  if(r.coins) addCoins(r.coins,p.x,p.y);
  if(r.dmg) p.stats.slash*=1+r.dmg;
  if(r.crit) p.stats.slash*=1+r.crit;
  if(r.maxhp){ p.maxHp+=r.maxhp; p.hp=p.maxHp; }
  if(r.potmax){ p.potionsMax+=r.potmax; p.potions=p.potionsMax; }
  if(r.stamina){ p.maxStamina+=r.stamina; p.stamina=p.maxStamina; }
  if(r.energy){ p.maxEnergy+=r.energy; p.energy=p.maxEnergy; }
  if(r.armor) p.stats.armor=(p.stats.armor||1)*(1-r.armor);
  if(r.heal) p.stats.drinkMul=(p.stats.drinkMul||1)*(1+r.heal);
  if(r.roll) p.stats.rollCost*=0.8;
  if(r.roar) p.stats.roarRate*=1.2;
  if(r.bless){ G.pendingBless+=r.bless; later(1.2,offerPending); }
  if(r.lantern) G.items.lantern=1;
  if(r.item) giveItems({[r.item]:1});
  if(r.weapon) giveWeapon(r.weapon); if(r.abil) grantAbility(r.abil); if(r.sp) giveSkillPoint(r.sp);
  if(r.hat){ G.hats=G.hats||{}; G.hats[r.hat]=true; G.hat=r.hat; }
  for(const k of ['regen','freeinn','discount','lure','snow','bog']) if(r[k]) G.flags['perk_'+k]=true;
  if(r.reveal){ for(const k in POI) fogReveal(POI[k].x,POI[k].y,700); for(const m of CAVEMOUTHS) fogReveal(m.x,m.y,400); }
  SFX.play('chest');
}
// ---------- the first time Ash talks to someone. Where they live decides what they say: Emberhollow has known him all
// his life, the nearby Act I towns know Maren and have heard of her boy, and only people from far away introduce
// themselves. Every entry is [full, simple]. (v11, J9) The named Act I people in FIRST_HOME and FIRST_NEAR now greet
// with their own first opener in game/story/act1/people.js (a converted person skips this); these lines stay for the
// generic neighbours (HOME_GEN, NEAR_GEN) and for a first meeting in a later act.
const NEAR_TOWNS=['brindle','copper','lodge','farm','way','mire'];
const TOWN_OF={juniper:'village',sal:'brindle',minnow:'brindle'};
function townOf(id){ if(TOWN_OF[id]) return TOWN_OF[id]; const c=CASTBY[id]||SPECIAL[id]; return (c&&c.town)||''; }
// has Ash already dealt with this person (a quest offer, a quest step, a story scene) before the first chat?
function metBefore(id){
  if(id==='brisket'||id==='morrow'||id==='marlo') return true;
  if(SPECIAL[id]&&SPECIAL[id].inside==='ev') return true;   // event and story people: Ash meets them in their scene first
  if(id==='wren'&&reached('oath')) return true;
  for(const qid in (G.quests||{})){ const d=QDEFS[qid], q=G.quests[qid]; if(!d||!q) continue; if(d.giver===id) return true; const st=d.steps||[]; for(let i=0;i<st.length;i++) if(st[i]&&st[i].npc===id&&(q.done||i<q.step)) return true; }
  for(const qid in (G.declined||{})){ const d=QDEFS[qid]; if(d&&d.giver===id) return true; }
  return false;
}
// Emberhollow's named people: Lantern Day morning (pre), during the raid, and any time after (post)
const FIRST_HOME={
  bertram:{pre:[`Happy Lantern Day, Ash! Two hundred buns in the oven, and not one of them is for you. Keep your breath off my chimney.`,`Happy Lantern Day! Keep your fire away from my oven.`],
    raid:[`Ash! There's a kobold in my flour bin! Get it out before it sneezes!`,`Ash! A kobold is in my flour!`],
    post:[`Ash! You're not here to light the oven, are you? The last time you lit my oven, I got a new roof.`,`Ash! Please don't light my oven. Last time I needed a new roof.`]},
  fennick:{pre:[`Ash! Big day. Lots of lamps. I've been up since very early with the lamps. Just the lamps. Happy Lantern Day.`,`Ash! Big day. I have been busy with lamps. Just lamps.`],
    raid:[`Kobolds! In the lanes! How did they get in? Nobody knows. Go on, Ash, go!`,`Kobolds! How did they get in? Go, Ash!`],
    post:[`Ash! Need a lamp? Oil? Wicks? I've got wicks. I'm fine, by the way. Everything's fine.`,`Ash! Need a lamp? I am fine. All fine.`],
    forgive:[`Ash. I lit every lamp in the village last night, and I'll light them again tonight. That's the deal.`,`Ash. I light every lamp now. Every night.`],
    jail:[`Ash. Captain Osric lets me polish his lamps in here. It's more than I deserve.`,`Ash. I polish the lamps in here. It is fair.`]},
  mabel:{pre:[`Morning, Ash! Mind my mint by the well. The whole green smells of it and I want it to stay that way.`,`Morning, Ash! Do not step on my mint.`],
    raid:[`Go, Ash! I'll patch you up after. Go!`,`Go, Ash! I will fix your cuts after.`],
    post:[`Let me look at you. Scratches, bruises, one singed eyebrow. Same as every week since you were four.`,`Let me look at you. Scratches again, like always.`]},
  rook:{pre:[`Ash! Are you lighting the lanterns? Can I watch? Can I hold the sword? I won't drop it this time.`,`Ash! Can I watch you light the lanterns?`],
    post:[`Ash! I've been practising my roar. Listen. RAAAH. Juniper says I sound like a kettle.`,`Ash! Listen to my roar. RAAAH! Good?`]},
  wendel:{pre:[`Ash! I'm playing on the green all day. Take requests. Not "Ash and Crash." That one isn't finished.`,`Ash! I am playing music on the green all day.`],
    raid:[`One of them grabbed my song folder! Ash, my songs! Get after him!`,`A kobold took my songs! Get him, Ash!`],
    post:[`Ash, you're just in time. What rhymes with "kobold"? I've been stuck on it since breakfast.`,`Ash! What rhymes with kobold? I am stuck.`]},
  nana:{pre:[`Hold still, Ash, I'm measuring you for your winter sweater. Again. You keep growing horns.`,`Hold still! I am measuring you for a sweater.`],
    raid:[`There's one under my rocking chair, Ash! Shoo it out, dear!`,`A kobold is under my chair! Shoo it out!`],
    post:[`Ash, dear, you're thin. You're always thin. Come by after, I've a pot on.`,`Ash, you are too thin. Come and eat later.`]},
  hal:{pre:[`Morning, Ash! Moo-rgaret's wearing a ribbon for Lantern Day. Well, she was. She ate it.`,`Morning! My cow had a ribbon. She ate it.`],
    raid:[`They're in the turnips! Ash, the turnips!`,`Kobolds in my turnips! Help!`],
    post:[`Ash! The turnips are coming back, slowly. They're shy since the kobolds.`,`Ash! My turnips are growing back. Slowly.`]},
  juniper:{post:[`Ash! I owe you a supper. Rook says it's three suppers. Rook isn't in charge of suppers.`,`Ash! I owe you a supper. Maybe three.`]}
};
// Emberhollow's other neighbours, in turn so they don't repeat
const HOME_GEN={
  pre:[[`Happy Lantern Day, Ash! Go easy on the lanterns. Last year's still has a scorch mark.`,`Happy Lantern Day! Be gentle with the lanterns.`],
    [`Morning, Ash. Your mom's been hammering since before the birds. What's she making you?`,`Morning! Your mom is busy in the forge.`],
    [`Ash! Yara's letting you light the lanterns this year? About time.`,`You get to light the lanterns this year!`],
    [`There's Maren's boy, up early for once. Off to the green?`,`Up early, Ash? Going to the green?`],
    [`Ash, tell your mother my gate hinge is squeaking again. After the festival. No rush.`,`Tell your mom my gate squeaks. No rush.`],
    [`Morning, Ash! My little ones want to see you blow smoke rings later, if you've time.`,`Morning! My kids want to see smoke rings.`]],
  post:[[`Ash! You chased three of them right past my window. I've never seen kobolds run so fast.`,`You chased the kobolds past my window!`],
    [`Your mother came out of the forge with a hammer in each hand. If I were a kobold, I'd have run too.`,`Your mom came out with two hammers. The kobolds ran!`],
    [`There's our dragon. I always said all that practice on the bonfire was for something.`,`There's our dragon! You were great.`],
    [`Ash! Are you hurt? No? Good. A kobold ran off with my other boot. If you see a boot, it's mine.`,`Are you hurt? A kobold took my boot!`],
    [`I've lived here forty years and never locked my door. I'm locking it now. Twice.`,`I lock my door now. Twice.`],
    [`Ash. I saw Yara's face when the Ward went out. I've never seen her look scared before.`,`Yara looked scared when the Ward went out.`]],
  later:[[`Ash! Back from your travels? Bring us any news, or just mud?`,`Ash! Any news? Or just mud?`],
    [`Your mom says you're off relighting the old Wards. I said, our Ash? The one who set fire to the well?`,`Your mom says you light the Wards now. Our Ash!`],
    [`Look who's home. Your mother watches the road every evening, you know.`,`Your mom watches the road for you every night.`],
    [`You've been all over the valley, they say. Don't forget where your supper is.`,`Don't forget to come home for supper!`],
    [`Is the smoke on the mountain anything to worry about? Don't answer. I can see it on your face.`,`Is the mountain smoke bad? I can see it is.`],
    [`There's Maren's boy. You look taller. Is it the horns or the adventuring?`,`You look taller, Ash!`]]
};
// the nearby towns' named people, if Ash has not dealt with them yet
const FIRST_NEAR={
  wren:[`Ash? Look at you. The last time I was in Emberhollow, you were small enough to sit in Yara's wood basket.`,`Ash? You were so small last time I saw you!`],
  tilly:[`Maren's boy! I'd know those horns anywhere. Is my brother's bakery still standing? Don't tell him I asked.`,`Maren's boy! Is my brother's bakery still standing?`],
  osric:[`Ash, isn't it? Maren's boy. Mum writes about you in every letter. More than she writes about me, I think.`,`Ash! My mum writes about you a lot.`],
  pell:[`Emberhollow's own fire-breather! You singed one of my hats two summers back. Never mind. Have a look round.`,`You burned my hat once! Never mind. Look around.`],
  dell:[`Maren's lad! Your mom made my best fish hooks. Three of them are still in the lake somewhere.`,`Maren's boy! Your mom made my best fish hooks.`],
  marigold:[`Maren's boy! Stand still. Hm. Your head's gone up a whole hat size since spring. It's the horns.`,`Maren's boy! Your head grew a hat size!`],
  quill:[`The Emberblood boy. I'd know you through a telescope, and I have. You light up the whole green on Lantern Day.`,`The Emberblood boy! I saw you through my telescope.`],
  mayor:[`Young Ash of Emberhollow! Maren's boy! Your mother mended our town bell, you know. Splendid woman. Splendid bell.`,`Ash of Emberhollow! Your mom fixed our bell!`],
  nib:[`You're the dragon kid! Rook told me all about you. Can you really breathe fire? Do it on that barrel.`,`You're the dragon kid! Breathe fire! Do it!`],
  gorran:[`Well, I'll be. Maren's kid. You've got her jaw. Last time I saw you, you were chewing on my boot.`,`Maren's kid! You used to chew on my boot.`],
  cookie:[`So you're Maren's boy. Gorran talks about your mom like she hung the moon. Sit down. You look like you need soup.`,`Maren's boy! Sit down. Have some soup.`],
  pick:[`Gorran said Maren's kid would come up the hill one day. We bet you'd be taller. We both lost.`,`Maren's kid! We thought you would be taller.`],
  hollis:[`You'll be Maren's boy, from down the valley. Your mom shod my mule. Best shoes he ever had.`,`Maren's boy! Your mom made shoes for my mule.`],
  ulf:[`HA! The dragon boy! Hal Burrows writes about you. In between the cheese.`,`The dragon boy! Hal writes to me about you.`],
  elka:[`You're Ash! Rook's Ash! He writes about you in every single letter. Is it true you can breathe fire?`,`You're Ash! Rook writes about you!`],
  hob:[`Ash! Fennick's little neighbour. You've grown. Mostly up, and a bit sideways at the horns. Come in out of the smoke.`,`Ash! You've grown! Come in.`],
  tamsin:[`The Emberblood! I've been singing about you all week and I've never seen you up close. Turn round. I need to know how long the tail is.`,`The Emberblood! Turn around. I need to see your tail for my song.`],
  moss:[`So this is Mabel's dragon boy. Sit by the fire, child. By it. Not in it.`,`Mabel's dragon boy! Sit by the fire.`],
  sal:[`Maren's boy? Tell your mother I still want those rivets. The boat won't build itself.`,`Tell your mom I need those rivets.`]
};
// the nearby towns' other people: they know Maren, and they have heard of her boy
const NEAR_GEN=[[`You're Maren's boy, from Emberhollow? I'd know those horns anywhere. Everybody would.`,`You are Maren's boy! I know those horns.`],
  [`The smith's lad! Your mother mended my cart wheel last spring. Still rolls straight.`,`Your mom fixed my cart wheel. It still rolls!`],
  [`Hello, Ash. Yes, I know your name. There's only one boy in the valley with a tail.`,`Hello, Ash. Only one boy here has a tail!`],
  [`Maren's boy, all the way out here? Does your mother know where you are?`,`Maren's boy, out here? Does your mom know?`],
  [`Emberhollow's fire-breather! My cousin buys her nails from your mom. Says she's the best smith in the valley.`,`My cousin buys nails from your mom. She's the best!`],
  [`Well, if it isn't the little dragon from up the road. Mind my roof, it's thatch.`,`The little dragon! Careful, my roof is straw.`]];
// people from far away: they have never met Ash, so they say who they are
const AWAY_GEN=[n=>[`Hello there. I'm ${n}. I live just here.`,`Hello! I am ${n}. I live here.`],
  n=>[`Oh! Hello. I'm ${n}. You're not from round here, are you? It's the horns.`,`Hi! I am ${n}. You are not from here, are you?`],
  n=>[`Well, hello. ${n}, that's me. I don't think I've seen you before. I'd remember the tail.`,`Hi! I am ${n}. I would remember that tail!`],
  n=>[`Hello, traveller. I'm ${n}. Mind the puddle by my door, it's deeper than it looks.`,`Hi! I am ${n}. Mind the puddle!`]];
function firstGreet(id,c){
  const town=townOf(id), st=G.stage, ph=(st==='wake'||st==='lanterns')?'pre':st==='raid'?'raid':reached('wren')?'later':'post';
  const n=Object.keys(G.seenTalk||{}).filter(k=>k.startsWith('met_')).length;
  let L=null;
  if(town==='village'){
    const P=FIRST_HOME[id];
    if(P){ L=(id==='fennick'&&G.choices&&P[G.choices.fennick])||P[ph]||P.post; }
    else{ const pool=HOME_GEN[ph]||HOME_GEN.post; L=pool[n%pool.length]; }
  }else if(NEAR_TOWNS.includes(town)){ if(metBefore(id)) return null; L=FIRST_NEAR[id]||NEAR_GEN[n%NEAR_GEN.length]; }
  else{ if(metBefore(id)) return null; L=AWAY_GEN[n%AWAY_GEN.length](c.name); }
  return L?S(L[0],L[1]):null;
}
// what someone will say about the world, chosen by friendship and time
function greetLine(id){
  const c=CASTBY[id]||SPECIAL[id]||{name:personName(id)}, f=friendOf(id), T=TALK[id]||{}, night=isNight();
  const first=!(G.seenTalk&&G.seenTalk['met_'+id]);
  if(first&&id!=='maren'&&id!=='yara'){ const g=firstGreet(id,c); if(g) return g; }
  const dg=deedGreet(id); if(dg) return dg;
  if(f>=5) return pick([`Ash! My favorite person. What do you need?`,`There's my best friend! Sit, sit.`,`You again! Good. I was hoping.`]);
  if(f>=3) return pick([`Hello, Ash. Always nice to see you.`,`Ash! Got a minute?`,`Good to see you.`]);
  if(night) return pick([`Out late, Ash? Keep your fire close.`,`It's late. The wolves are louder tonight.`,`Can't sleep either?`]);
  return pick([`Hello, Ash.`,`Oh, hi Ash.`,`Morning, Ash. Or afternoon. I lose track.`,`Ash! What's new?`]);
}
const GENERIC_RUMORS=[
  [S(`The kids up in the Frostpine build snowmen with carrot noses. Breathe fire on one and see what falls out.`,`Breathe fire on a snowman. Something falls out!`),'lm_snowman'],
  [S(`The old tree in Whisperwood asks riddles if you're polite to it. My brother wasn't, and it dropped a branch on him.`,`The old tree in Whisperwood asks riddles. Be polite to it!`),'lm_barkley'],
  [S(`Bees go sleepy in smoke. That's how the honey folk get their honey. You've got smoke to spare.`,`Smoke makes bees sleepy. You can make smoke!`),null],
  [S(`My granddad swore there was treasure under the big X's scratched on old maps round here. He never dug one up. Bad back.`,`There is treasure under the X's on old maps.`),'xmarks'],
  [S(`There's a hot spring up in the Frostpine. My uncle soaked his bad knee in it and walked home without his stick.`,`A hot spring in the Frostpine heals you.`),'lm_spring'],
  [`At night, a ring of mushrooms in the forest starts to glow. Step inside for luck.`,'lm_fairy'],
  [S(`Some of the old houses round here have cellars nobody has opened in years. Look under the rugs.`,`Old houses have cellars. Look under the rugs.`),null],
  [`Caves have cracked walls sometimes. A good roar can bring them down.`,null],
  [`The Wardens hid pages of their book all over the valley. Sister Wren in Brindlecross pays for them.`,null]
];
function markHint(h){ if(!h) return; G.hints=G.hints||{}; G.hints[h]=true; G.secrets=G.secrets||{}; }
function giftsHeld(){ return Object.keys(GIFTS).filter(k=>(G.items[k]||0)>0); }
function giftReact(id,item){
  const T=TALK[id]||{}, c=CASTBY[id];
  G.gifted=G.gifted||{}; G.gifted[id]=dayNow();
  takeItems({[item]:1});
  if((T.loves||[]).includes(item)){ befriend(id,1.5); return pick([`${GIFTS[item]}! How did you know? This is my favorite thing in the whole valley.`,`Oh, Ash. ${GIFTS[item]}. You remembered. I love it.`]); }
  if((T.hates||[]).includes(item)){ befriend(id,-0.5); return pick([`Oh. ${GIFTS[item]}. That's... thank you. I'll put it somewhere. Far away.`,`A ${GIFTS[item].toLowerCase()}! I'm, um, allergic. A bit. It's the thought that counts.`]); }
  befriend(id,c&&c.generic?0.5:0.75); return pick([`For me? Thank you, Ash. That's very kind.`,`Oh, how nice. Thank you!`,`${GIFTS[item]}? Lovely. Thank you.`]);
}
// ---------- the conversation menu (v11, STORY_PLAN 6.3)
// 1. The opener is the greeting, said once: when the story data has a current line for this person (s10Opener in
//    e10_story.js), that line is what they greet Ash with and the menu sits under it; the generic greetLine runs only
//    when there is no data line (and on a first meeting with a person not yet converted, for their introduction). An
//    opener heard today is not repeated: the person's idle line instead (or a one-time remark, or a plain hello).
// 2. Under the opener: its replies (re) first, then the story's and quests' topics, then up to three ask topics, then
//    "More..." (rumors, gifts) and Goodbye. People not converted yet keep the old menu, minus the repeat: "What's new?"
//    never says a line already heard this visit, and is gone when the opener came from the data (it comes back as
//    "Anything else going on?" only while the opener has a variant not heard today).
// 3. After an answer the person says their idle line (or a neutral "Mm?"), never "What else is on your mind?".
// Old TALK labels: T.deepAsk, T.rumorAsk and T.about[who] = { ask, t } name the old topics while they are converted.
const talkLbl=x=>Array.isArray(x)?S(String(x[0]),String(x[1]==null?x[0]:x[1])):String(x);
// a remembered moment (a dream, an event, a deed) that greetLine would have said; random chatter is left out
function talkRemark(id){
  try{ if(typeof evGreet==='function'){ const v=evGreet(id); const ch0=(typeof MOM_CH!=='undefined'&&MOM_CH[G.stage])||[], ch1=(typeof YARA_CH!=='undefined'&&YARA_CH[G.stage])||[];
    if(v&&!ch0.includes(v)&&!ch1.includes(v)) return v; } }catch(e){}
  try{ return deedGreet(id)||null; }catch(e){ return null; }
}
function talkVisit(n,firstMeet,lines){
  const id=n.id, X=typeof s10Opener==='function'?s10Opener(n):null, v11=typeof s10V11==='function'&&s10V11(id);
  const idle=()=>typeof s10Idle==='function'?s10Idle(id,X&&X.T):null;
  const V={id,v11,X,said:new Set(),answered:false,more:false,re:null,fn:null};
  const heard=t=>{ if(t!=null&&typeof t!=='function') V.said.add(String(t)); return t; };
  // the person already spoke in this visit (a first entry, a quest line): no second greeting, the menu sits under idle
  const spoke=lines.some(L=>(Array.isArray(L)?L[0]:L&&L.who)===id);
  if(spoke&&!(X&&!X.heard)){ V.text=heard(idle()||'Mm?'); V.again=()=>idle()||pick(['Mm?','Yes?']); return V; }
  if(X&&!X.heard){
    // a first meeting with someone not converted yet keeps their introduction; otherwise a remembered moment, if any
    const g=spoke?null:firstMeet&&!v11?greetLine(id):talkRemark(id); if(g) lines.push([id,heard(g)]);
    for(const L of X.pre) lines.push(L);
    const L0=X.last;
    if(L0){ heard(L0.text); V.text=()=>L0.skipIf&&L0.skipIf()?(idle()||'Mm?'):L0.text; V.fn=()=>{ if(L0.fn) L0.fn(); X.run(); }; }
    else{ V.text=idle()||'Mm?'; V.fn=X.run; }
    V.re=X.re; V.key=X.key;
  }
  else if(X) V.text=heard(talkRemark(id)||idle()||greetLine(id));
  // a converted person with no opener left (all answered) says their own idle line, not a generic hello
  else if(v11&&!firstMeet) V.text=heard(talkRemark(id)||idle()||greetLine(id));
  else V.text=heard(greetLine(id));
  V.again=()=>idle()||pick(['Mm?','Yes?']);
  return V;
}
function talkHub(n,pre){
  const id=n.id, T=TALK[id]||{};
  const lines=(pre||[]).slice();
  G.seenTalk=G.seenTalk||{};
  const firstMeet=!G.seenTalk['met_'+id];
  if(!firstMeet&&G.talkDay&&G.talkDay[id]!==dayNow()) befriend(id,0.2,true);
  G.talkDay=G.talkDay||{}; G.talkDay[id]=dayNow();
  // friendship gifts arrive on their own
  const f=friendOf(id);
  if(T.secret&&f>=3&&!G.seenTalk['sec_'+id]&&(!T.need||T.need())){ G.seenTalk['sec_'+id]=1; lines.push([id,S(`Ash, wait. I've been keeping something for you.`,`Ash, wait. I have something for you.`)],[id,T.secret.t]); lines.push({who:'narr',text:'',skipIf:()=>{ giveTalkReward(T.secret.reward); return true; }}); }
  if(T.best&&f>=5&&!G.seenTalk['best_'+id]){ G.seenTalk['best_'+id]=1; lines.push([id,T.best.t]); lines.push({who:'narr',text:'',skipIf:()=>{ giveTalkReward(T.best.reward); return true; }}); }
  const V=talkVisit(n,firstMeet,lines);
  G.seenTalk['met_'+id]=1;
  const hub={who:id,text:V.text,opts:()=>talkOpts(n,V)};
  if(V.fn) hub.fn=V.fn;
  hub.again=V.again; V.hub=hub;
  lines.push(hub);
  runDialogue(lines,()=>{ scene='play'; saveGame(); });
}
function talkOpts(n,V){
  const id=n.id, c=CASTBY[id]||SPECIAL[id]||{}, T=TALK[id]||{}, o=[];
  // the opener's replies, until one is picked (they go back to this menu, under the idle line)
  if(V.re&&!V.answered&&typeof s10ReOpts==='function') o.push(...s10ReOpts(V.re,{talk:id},id,{hub:V,top:true}));
  const shop=SHOPTALK[id];
  const shopO=shop?{t:id==='marigold'?'Show me your hats':id==='tilly'||id==='hob'?'A bed, or something to eat?':'What are you selling?',tag:'shop',fn:()=>shop(n),end:true}:null;
  if(shopO&&!V.v11) o.push(shopO);
  // quest step that needs more items: remind
  for(const qid in G.quests){ const st=stepOf(qid); if(st&&st.t==='talk'&&st.npc===id&&!haveAll(st.take)) o.push({t:`About ${QDEFS[qid].title.replace('Errand: ','')}...`,tag:'quest',then:[[id,`You still need: ${Object.keys(st.take||{}).map(k=>ITEM_NAMES[k]||k).join(', ')}. I'll be right here.`]],back:true}); }
  for(const qid in G.quests){ const Q=QDEFS[qid].topics, q=G.quests[qid]; if(!Q||!Q[id]||q.done||q.step!==0||G.flags[Q[id].flag]) continue; const tp=Q[id]; o.push({t:tp.t,tag:'quest',fn:()=>{ G.flags[tp.flag]=true; later(0.2,questPoke); },then:tp.lines,back:true}); }
  const av=availableFrom(id); if(av&&QDEFS[av].errand) o.push({t:'Need anything carried somewhere?',tag:'errand',fn:()=>offerQuest(av),end:true});
  const comp=compTalkOpts(id,n);
  const rum=T.rumor&&(!T.rumor.need||T.rumor.need())?{t:T.rumorAsk?talkLbl(T.rumorAsk):'Heard any rumors?',key:'rum_'+id,fn:()=>markHint(T.rumor.hint),then:[[id,T.rumor.t]],back:true}:null;
  const gifts=giftsHeld();
  const giftO=gifts.length&&(!G.gifted||G.gifted[id]!==dayNow())&&!SPECIAL[id]?{t:'I brought you something.',tag:'gift',then:()=>[ch(id,`Ooh, what is it?`,gifts.map(k=>({t:`${GIFTS[k]} (you have ${G.items[k]})`,then:()=>[[id,giftReact(id,k)]]})).concat([{t:'Never mind',then:[[id,`A mystery gift! My favorite kind. Maybe next time.`]]}]))],back:true}:null;
  const varO=V.X&&typeof s10VarOpt==='function'?s10VarOpt(id):null;
  if(V.v11){
    // converted: story and quest topics, up to three ask topics, the shop, then "More..." (rumors, gifts)
    o.push(...comp);
    if(typeof s10AskOpts==='function') o.push(...s10AskOpts(id,V));
    if(varO) o.push(varO);
    if(shopO) o.push(shopO);
    if(id==='tamsin') o.push({t:'Sing me your song about me!',key:'song_'+id+'_'+dayNow(),then:()=>tamsinSong().slice(1),back:true});
    if(V.more){ if(rum) o.push(rum); if(giftO) o.push(giftO); }
    else if(rum||giftO) o.push({t:S('More...','More...'),fn:()=>{ V.more=true; },then:[],back:true});
  }else{
    if(id==='tamsin') o.push({t:'Sing me your song about me!',key:'song_'+id+'_'+dayNow(),then:()=>tamsinSong().slice(1),back:true});
    if(V.X){ if(varO) o.push(varO); }
    else{
      // "What's new?" never says a line already heard this visit (the greeting included)
      const L=(c.lines&&c.lines.length)?c.lines:[`Not much. The valley's quiet. Too quiet, my gran would say.`];
      const nextNew=()=>{ const m=moodLine(id), li=n.li|0; if(m&&li%3===2&&!V.said.has(String(m))) return m; for(let k=0;k<L.length;k++){ const t=L[(li+k)%L.length]; if(!V.said.has(String(t))){ n.li=li+k; return t; } } return null; };
      if(nextNew()!=null) o.push({t:'What’s new?',key:`new_${id}_${dayNow()}`,then:()=>{ const t=nextNew(); n.li=(n.li|0)+1; if(t==null) return []; V.said.add(String(t)); return [[id,t]]; },back:true});
    }
    if(T.chat&&!G.seenTalk['chat_'+id]&&(!T.need||T.need())) o.push({t:'You look like something’s on your mind.',tag:'new',then:()=>[ch(id,T.chat.q,T.chat.opts.map(a=>({t:a.t,tone:a.tone,fn:()=>{ G.seenTalk['chat_'+id]=1; befriend(id,a.f+(a.tone===T.chat.best?0.25:0)); },then:[[id,a.r]]})))],back:true});
    if(T.deep&&friendOf(id)>=2) o.push({t:T.deepAsk?talkLbl(T.deepAsk):'Tell me about yourself.',key:'deep_'+id,then:[[id,T.deep]],back:true});
    for(const who in (T.about||{})){ const A=T.about[who], obj=A&&typeof A==='object'&&!Array.isArray(A);
      o.push({t:obj&&A.ask?talkLbl(A.ask):`What about ${shortName(who)}?`,key:`ab_${id}_${who}`,then:[[id,obj?(Array.isArray(A.t)?talkLbl(A.t):A.t):A]],back:true}); }
    if(rum) o.push(rum);
    if(c.generic){
      const tie=c.lines&&c.lines[0]; if(tie) o.push({t:'Know anyone around the valley?',key:'tie_'+id,then:[[id,tie]],back:true});
      const gr=GENERIC_RUMORS[Math.abs(hashStr(id))%GENERIC_RUMORS.length]; o.push({t:'Heard any rumors?',key:'rum_'+id,fn:()=>markHint(gr[1]),then:[[id,gr[0]]],back:true});
    }
    o.push(...comp);
    if(typeof s10AskOpts==='function') o.push(...s10AskOpts(id,V));
    if(giftO) o.push(giftO);
  }
  o.push({t:'Goodbye',end:true,then:()=>{ const bye=typeof s10Bye==='function'?s10Bye(id):null;
    return [[id,bye||(friendOf(id)>=3?pick([`See you soon, Ash.`,`Come back any time.`,`Be careful out there.`]):pick([`Bye, Ash.`,`See you.`,`Mind your tail.`]))]]; }});
  return o;
}
// a tally for the journal's Secrets tab
function secretTally(){
  const F=G.found||{}, S=G.secrets||{};
  const out=[['Lost pages of the Wardens’ Account',Object.keys(G.pages).length,10]];
  if(typeof SECRET_ROOMS!=='undefined') out.push(['Secret rooms in houses',Object.keys(S).filter(k=>k.startsWith('sec_')).length,SECRET_ROOMS.length]);
  if(typeof CAVE_SECRETS!=='undefined') out.push(['Hidden rooms in caves',Object.keys(S).filter(k=>k.startsWith('cs_')).length,CAVE_SECRETS]);
  out.push(['Buried treasure',['x1','x2','x3'].filter(k=>F[k]).length,3]);
  out.push(['Snowmen melted',LANDMARKS.filter(o=>o.k==='snowman'&&F[o.id]).length,LANDMARKS.filter(o=>o.k==='snowman').length]);
  out.push(['Beehives calmed',LANDMARKS.filter(o=>o.k==='beehive'&&F[o.id]).length,LANDMARKS.filter(o=>o.k==='beehive').length]);
  out.push(['Riddles of Old Barkley',F.barkley?1:0,1]);
  out.push(['Fairy ring blessing',F.fairy?1:0,1]);
  out.push(['Best friends',CAST.filter(c=>!c.generic&&friendOf(c.id)>=5).length,Object.keys(TALK).length]);
  return out;
}
