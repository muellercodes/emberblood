
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
  if(r.hat){ G.hats=G.hats||{}; G.hats[r.hat]=true; G.hat=r.hat; }
  for(const k of ['regen','freeinn','discount','lure','snow','bog']) if(r[k]) G.flags['perk_'+k]=true;
  if(r.reveal){ for(const k in POI) fogReveal(POI[k].x,POI[k].y,700); for(const m of CAVEMOUTHS) fogReveal(m.x,m.y,400); }
  SFX.play('chest');
}
// what someone will say about the world, chosen by friendship and time
function greetLine(id){
  const c=CASTBY[id], f=friendOf(id), T=TALK[id]||{}, night=isNight();
  const first=!(G.seenTalk&&G.seenTalk['met_'+id]);
  if(first&&id!=='maren'&&id!=='yara') return c.generic?`Oh, hello! You're Ash, aren't you? I'm ${c.name}. I live just here.`:`Oh! You must be Ash, Maren's kid. I'm ${c.name}. Nice to meet you properly.`;
  if(f>=5) return pick([`Ash! My favorite person. What do you need?`,`There's my best friend! Sit, sit.`,`You again! Good. I was hoping.`]);
  if(f>=3) return pick([`Hello, Ash. Always nice to see you.`,`Ash! Got a minute?`,`Good to see you.`]);
  if(night) return pick([`Out late, Ash? Keep your fire close.`,`It's late. The wolves are louder tonight.`,`Can't sleep either?`]);
  return pick([`Hello, Ash.`,`Oh, hi Ash.`,`Morning, Ash. Or afternoon. I lose track.`,`Ash! What's new?`]);
}
const GENERIC_RUMORS=[
  [`They say if you breathe fire on a snowman, something good falls out. Something orange.`,'lm_snowman'],
  [`The old tree in Whisperwood talks. It tells riddles. Very bad riddles.`,'lm_barkley'],
  [`Bees hate smoke. And dragons make smoke. Just saying.`,null],
  [`Somebody buried treasure under a big X out in the wilds. More than one somebody, actually.`,'xmarks'],
  [`There's a hot spring up in the Frostpine. Heals anything. Except bad jokes.`,'lm_spring'],
  [`At night, a ring of mushrooms in the forest starts to glow. Step inside for luck.`,'lm_fairy'],
  [`I heard some houses here have cellars. Old houses love secrets. Look under the rugs.`,null],
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
// the conversation menu
function talkHub(n,pre){
  const id=n.id, c=CASTBY[id]||SPECIAL[id]||{}, T=TALK[id]||{};
  const lines=(pre||[]).slice();
  G.seenTalk=G.seenTalk||{};
  const firstMeet=!G.seenTalk['met_'+id];
  if(!firstMeet&&G.talkDay&&G.talkDay[id]!==dayNow()) befriend(id,0.2,true);
  G.talkDay=G.talkDay||{}; G.talkDay[id]=dayNow();
  // friendship gifts arrive on their own
  const f=friendOf(id);
  if(T.secret&&f>=3&&!G.seenTalk['sec_'+id]&&(!T.need||T.need())){ G.seenTalk['sec_'+id]=1; lines.push([id,`Ash, I've been meaning to give you something. We're friends now, so.`],[id,T.secret.t]); lines.push({who:'narr',text:'',skipIf:()=>{ giveTalkReward(T.secret.reward); return true; }}); }
  if(T.best&&f>=5&&!G.seenTalk['best_'+id]){ G.seenTalk['best_'+id]=1; lines.push([id,T.best.t]); lines.push({who:'narr',text:'',skipIf:()=>{ giveTalkReward(T.best.reward); return true; }}); }
  const greet=greetLine(id);
  G.seenTalk['met_'+id]=1;
  const hub=ch(id,greet,()=>{
    const o=[];
    const shop=SHOPTALK[id];
    if(shop) o.push({t:id==='marigold'?'Show me your hats':id==='tilly'||id==='hob'?'A bed, or something to eat?':'What are you selling?',tag:'shop',fn:()=>shop(n),end:true});
    // quest step that needs more items: remind
    for(const qid in G.quests){ const st=stepOf(qid); if(st&&st.t==='talk'&&st.npc===id&&!haveAll(st.take)) o.push({t:`About ${QDEFS[qid].title.replace('Errand: ','')}...`,tag:'quest',then:[[id,`You still need: ${Object.keys(st.take||{}).map(k=>ITEM_NAMES[k]||k).join(', ')}. I'll be right here.`]],back:true}); }
    o.push({t:'What’s new?',key:`new_${id}_${dayNow()}`,then:()=>{ const L=(c.lines&&c.lines.length)?c.lines:[`Not much. The valley's quiet. Too quiet, my gran would say.`]; const m=moodLine(id); const t=m&&n.li%3===2?m:L[n.li%L.length]; n.li=(n.li||0)+1; return [[id,t]]; },back:true});
    if(T.chat&&!G.seenTalk['chat_'+id]&&(!T.need||T.need())) o.push({t:'You look like something’s on your mind.',tag:'new',then:()=>[ch(id,T.chat.q,T.chat.opts.map(a=>({t:a.t,tone:a.tone,fn:()=>{ G.seenTalk['chat_'+id]=1; befriend(id,a.f+(a.tone===T.chat.best?0.25:0)); },then:[[id,a.r]]})))],back:true});
    if(T.deep&&friendOf(id)>=2) o.push({t:'Tell me about yourself.',key:'deep_'+id,then:[[id,T.deep]],back:true});
    for(const who in (T.about||{})) o.push({t:`What about ${shortName(who)}?`,key:`ab_${id}_${who}`,then:[[id,T.about[who]]],back:true});
    if(T.rumor&&(!T.rumor.need||T.rumor.need())) o.push({t:'Heard any rumors?',key:'rum_'+id,fn:()=>markHint(T.rumor.hint),then:[[id,T.rumor.t]],back:true});
    if(c.generic){
      const tie=c.lines&&c.lines[0]; if(tie) o.push({t:'Know anyone around the valley?',key:'tie_'+id,then:[[id,tie]],back:true});
      const gr=GENERIC_RUMORS[Math.abs(hashStr(id))%GENERIC_RUMORS.length]; o.push({t:'Heard any rumors?',key:'rum_'+id,fn:()=>markHint(gr[1]),then:[[id,gr[0]]],back:true});
    }
    const gifts=giftsHeld();
    if(gifts.length&&(!G.gifted||G.gifted[id]!==dayNow())&&!SPECIAL[id]) o.push({t:'I brought you something.',tag:'gift',then:()=>[ch(id,`Ooh, what is it?`,gifts.map(k=>({t:`${GIFTS[k]} (you have ${G.items[k]})`,then:()=>[[id,giftReact(id,k)]]})).concat([{t:'Never mind',then:[[id,`A mystery gift! My favorite kind. Maybe next time.`]]}]))],back:true});
    o.push({t:'Goodbye',end:true,then:[[id,friendOf(id)>=3?pick([`See you soon, Ash.`,`Come back any time.`,`Be careful out there.`]):pick([`Bye, Ash.`,`See you.`,`Mind your tail.`])]]});
    return o;
  });
  hub.again=()=>pick(['Anything else?','What else is on your mind?','Mm? Anything else?','Go on.']);
  lines.push(hub);
  runDialogue(lines,()=>{ scene='play'; saveGame(); });
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
