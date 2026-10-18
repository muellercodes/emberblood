
// ================= upstairs, cellars and secret rooms
// FLOORS[areaId].up/.down describe the floor above or below that room. secret:{...} hides the way in until you find it.
const FLOORS={
  h_ash:{
    up:{style:'attic',name:'Your attic hideout',items:[['toybox'],['note','A drawing of Mom, you and a very big dragon, all holding hands. You drew it when you were five. The dragon is smiling.'],['hchest',{coins:15,text:'Your old treasure box: a marble, a lucky pebble, and fifteen coins you forgot about.'}],['cobweb'],['crate'],['window']]},
    down:{style:'cellar',name:'Grandma’s secret cellar',secret:{at:'rug',label:'Lift the corner of the rug',text:'You lift the corner of the rug. Underneath is a trapdoor with a little dragon carved into it. Gran never mentioned this.'},
      items:[['painting','A girl with horns holding a lantern up to a mountain, painted on very old wood. EMBER, it says underneath. She looks a lot like you.'],['hchest',{bless:1,coins:40,lantern:true,text:'Under a blanket: Grandmother’s dragon-scale lantern, still warm. Caves will be brighter now. And forty coins, tied in a sock.'}],['note','A note in Gran’s handwriting: "Ash, if you found this, you are exactly as nosy as I was. The Emberblood fire isn’t a curse. It’s a lantern. Love, Gran."'],['crate'],['candles']]}
  },
  h_yara:{up:{style:'attic',name:'Pebble’s loft',items:[['nest'],['perch'],['crate'],['window'],['note',S('A list in Yara’s tidy handwriting: "Lantern Day 998: every lantern lit. Lantern Day 999: every lantern lit, and the bakery curtains. (Ash sneezed.)"','Yara’s list: "Lantern Day 999: every lantern lit. And the bakery curtains. Ash sneezed."')]]}},
  h_bertram:{down:{style:'cellar',name:'The bakery cellar',items:[['sack'],['sack'],['barrel'],['jars'],['crate'],['mousehole']]}},
  h_bertram_down:{down:{style:'vault',name:'Grandma Crumb’s recipe room',secret:{at:'sack',label:'Pull the sack marked NOT FLOUR',text:'You pull the sack marked NOT FLOUR. It isn’t flour. It’s a handle. A whole shelf swings away from the wall.'},
    items:[['recipebook'],['painting',S('Grandma Crumb, holding a rolling pin like a sword. Bertram says she once chased a drakeling out of the bakery with it.','Grandma Crumb with a rolling pin. She chased a drakeling away with it!')],['hchest',{potmax:1,coins:25,text:S('A tin labeled EMERGENCY BUNS. Bertram swaps in fresh ones every morning. You can carry one more healing draught now.','A tin of EMERGENCY BUNS. You can carry one more draught now.')}],['candles']]}},
  h_fennick:{down:{style:'secretroom',name:'The Oath’s meeting room',secret:{at:'counter',label:'Lift the rug behind the counter',text:'Behind the counter, the rug hides a trapdoor. It smells of lamp oil and bad ideas.'},
    items:[['table'],['note',S('A letter: "W. The gate. Leave it open. M." Someone has scribbled "I’M SORRY" across it in shaky handwriting.','A letter: "W. Leave the gate open. M." Across it: "I’M SORRY."')],['hchest',{coins:50,text:S('A purse of Oath gold, hidden under the table and never spent. Fifty coins.','A purse of Oath gold. 50 coins.')}],['banner'],['candles']]}},
  h_tilly:{up:{style:'guest',name:'The guest rooms',items:[['bed'],['bed'],['bed'],['painting','A crooked painting of a sleeping salmon. It really wants to be straightened.',{trig:true}],['window'],['drawer']]}},
  h_tilly_up:{up:{style:'attic',name:'The music room',secret:{at:'painting',label:'Straighten the crooked painting',text:'You straighten the painting. Click. A narrow ladder drops out of the ceiling. Somewhere above, a tiny tune is playing.'},
    items:[['musicbox'],['chair'],['cobweb'],['window'],['crate']]}},
  h_osric:{down:{style:'cellar',name:'The old cells',items:[['cell'],['barrel'],['barrel'],['crate'],['note','Scratched into the wall: "DAY 3. The dogs still won’t share their biscuits."']]}},
  h_osric_down:{down:{style:'cellar',name:'The smugglers’ tunnel',secret:{at:'wall',label:'Push the loose brick',text:'You push the loose brick. It falls through. So do the next twelve. There’s a tunnel back here.'},
    items:[['crate'],['crate'],['hchest',{coins:60,camps:true,text:S('An Oath stash: sixty coins and a map of every Oath and kobold camp in the valley. They’re on your map now.','Oath loot: 60 coins and a map of every camp!')}],['note','Chalk on the wall: "Meet at the crossroads. Bring snacks. Do NOT bring Fennick, he hums."']]}},
  h_library:{up:{style:'archive',name:'The library archive',items:[['shelf'],['shelf'],['shelf',{trig:true}],['desk'],['candles'],['window']]}},
  h_library_up:{up:{style:'secretroom',name:'Iska’s reading room',secret:{at:'shelf',label:'Pull the odd blue book',text:'One blue book won’t come off the shelf. You tug it. The whole bookcase swings open like a door. Iska loved secret rooms.'},
    items:[['note','Iska’s handwriting: "If anyone finds this room, I hope it’s someone kind. Sit. Read. Then go and be brave. The lantern is for you." '],['hchest',{bless:1,energy:20,text:'Iska’s spare lantern wick. Your fire breath lasts longer now.'}],['shelf'],['candles'],['chair']]}},
  h_mayor:{up:{style:'museum',name:'The Hall of Mustaches',items:[['painting','A portrait of a mustache. Just the mustache. It is labeled "GRANDPA."'],['painting','Mayor Brindle the First. He looks very pleased with himself. The frame is a little loose.',{trig:true}],['trophy'],['painting','A very small mustache, labeled "ME, AGE 9. A PROMISING START."'],['window']]}},
  h_mayor_up:{up:{style:'vault',name:'Brindle’s vault',secret:{at:'painting',label:'Look behind the portrait',text:S('You lift the portrait of Brindle the First. Behind it is a little door with a keyhole shaped like a mustache, and it is not even locked.','Behind the portrait: a mustache-shaped keyhole. It is not locked!')},
    items:[['coinpile'],['coinpile'],['coinpile'],['hchest',{coins:80,text:'The vault of Brindlecross: eighty coins and a very old comb, for the mustache.'}],['painting',S('Brindle the First, without his mustache. He looks like a completely different man.','Brindle the First, with no mustache. He looks so different!')]]}},
  h_hob:{down:{style:'cellar',name:'The Kettle’s cellar',secret:{at:'barrel',label:'Roll the big sauce barrel aside',text:'You roll the big sauce barrel out of the way. There are stairs under it, and something humming down there.'},
    items:[['ghost'],['barrel'],['barrel'],['barrel'],['jars'],['crate']]}},
  h_nana:{cubby:{at:'rocker',label:'Lift the loose floorboard',text:'The floorboard by the rocking chair lifts right up. Underneath: Nana’s emergency cookies, and a note that says "ASH, ONE ONLY." You take one. It’s the best cookie in the valley.',reward:{coins:20,heal:true}}},
  h_gorran:{down:{style:'cellar',name:'Gorran’s rock cellar',secret:{at:'bunk',label:'Look under the bunk',text:'Under the bunk is a trapdoor with ROCKS painted on it in big letters. Gorran is not subtle.'},
    items:[['rock'],['rock'],['ore'],['note','"My rock collection. Every one has a name. The big one is Maren. Don’t tell her." G.'],['crate']]}},
  h_ulf:{up:{style:'attic',name:'The lodge attic',items:[['moosehead'],['hchest',{hat:'feather',reveal:'frost',text:'Grandfather Hollis’s hunting map, with every path in the high snow marked. And under it, a dashing feathered cap with a note: "For Ulf. Love, Marigold." Ulf never looked up. It’s yours now.'}],['crate'],['cobweb'],['window']]}},
  h_quill:{up:{style:'deck',name:'The rooftop telescope',items:[['telescope2'],['chair'],['note',S('Quill’s notes: "Stars have fallen into the valley. I’ve marked every one on my chart. Look at night. ALWAYS AT NIGHT."','Quill’s notes: "Stars fell here. Look at night. ALWAYS AT NIGHT."')]]}}
};
const SECRET_ROOMS=[];
for(const id in FLOORS){ for(const dir of ['up','down','cubby']){ const F=FLOORS[id][dir]; if(F&&F.secret) SECRET_ROOMS.push(id+'_'+dir); if(dir==='cubby'&&F) SECRET_ROOMS.push(id+'_cubby'); } }
// generic homes get an ordinary cellar or attic now and then
function defineFloors(){
  for(const id of Object.keys(AREADEFS)){
    const d=AREADEFS[id]; if(d.kind!=='house'||d.floorOf||FLOORS[id]) continue;
    if(!/^h_n\d+$/.test(id)) continue;
    const r=mulberry32((d.seed||7)*131+9)();
    if(r<0.36) FLOORS[id]={down:{style:'cellar',name:`${d.name.replace('’s House','')}’s cellar`,items:[['barrel'],['jars'],['crate'],['pot'],['pot'],[r<0.12?'hchest':'coinpile',{coins:12,text:'A forgotten jar of coins, behind the pickles. Twelve coins.'}],[['mousehole','cat','goose'][Math.floor(r*30)%3]]]}};
    else if(r<0.58) FLOORS[id]={up:{style:'attic',name:`${d.name.replace('’s House','')}’s attic`,items:[['crate'],['cobweb'],['toybox'],['window'],['coinpile'],['note',pick(['A box of old Lantern Day decorations. One lantern has a face drawn on it.','A stack of letters tied with string. They’re all from the same goat farmer. They’re all about goats.','A painting of this very attic, hung in this very attic. Someone thought that was funny.'])]]}};
  }
  for(const id in FLOORS){
    for(const dir of ['up','down']){
      const F=FLOORS[id][dir]; if(!F) continue; const base=AREADEFS[id]; if(!base) continue;
      const nid=id+'_'+dir;
      defHouse(nid,{name:F.name,style:F.style,floorOf:id,dir,secret:F.secret||null,items:F.items||[],seed:(base.seed||7)*7+(dir==='up'?3:5),w:F.w||480,h:F.h||340,noExit:true,town:base.town,floor:F.style==='cellar'||F.style==='vault'?'stone':F.style==='attic'?'wood':undefined});
    }
  }
}
// where furniture can go without bumping into what's already there
function freeIn(items,W,H,cands,fw,fh){
  const box=it=>{ const w=(it.w||((it.r||20)*2))+20, h=(it.h||((it.r||20)*2))+20; return [it.x-w/2,it.y-h/2,it.x+w/2,it.y+h/2]; };
  const solid=items.filter(it=>it.k!=='rug'&&it.k!=='window'&&it.k!=='painting'&&it.k!=='portraits');
  for(const [x,y] of cands){ const a=[x-fw/2,y-fh/2,x+fw/2,y+fh/2]; if(Math.abs(x-W/2)<90&&y>H-110) continue; if(!solid.some(it=>{ const b=box(it); return a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1]; })) return [x,y]; }
  return cands[cands.length-1];
}
const STAIR_SPOTS=(W,H)=>[[W-70,H*0.72],[70,H*0.72],[W-70,150],[70,160],[W*0.8,H*0.42],[W*0.2,H*0.42],[W*0.65,H*0.8],[W*0.35,H*0.8]];
const SONG_SHEETS={h_tilly_up:'sheet1',h_hob:'sheet2',h_library_up:'sheet3'};
function floorExtras(def,items,put,W,H,rng,wallY){
  const F=FLOORS[def.id]||{};
  const sh=SONG_SHEETS[def.id]; if(sh&&G&&G.quests&&G.quests.song&&!G.quests.song.done&&!G.items[sh]){ const [x,y]=freeIn(items,W,H,[[W*0.3,H*0.62],[W*0.7,H*0.62],[W*0.5,H*0.3]],40,40); put('qitem',x,y,{item:sh,label:'a song sheet'}); }
  if(def.id==='h_mayor_up'&&G&&G.quests&&G.quests.pie&&G.quests.pie.step===0&&!G.flags.clue_dish){ const [x,y]=freeIn(items,W,H,[[W*0.75,H*0.55],[W*0.25,H*0.55]],40,40); put('piedish',x,y,{}); }
  // the way back down (or up) on an extra floor
  if(def.floorOf){
    // cellars have no windows; attics keep one; everybody loses the generic rug in a vault
    for(let i=items.length-1;i>=0;i--){ const it=items[i]; if((def.style==='cellar'||def.style==='vault'||def.style==='secretroom')&&it.k==='window') items.splice(i,1); else if(def.style==='attic'&&it.k==='window'&&it.x>W/2) items.splice(i,1); else if((def.style==='cellar'||def.style==='deck')&&it.k==='rug') items.splice(i,1); }
    put('stairs',W/2,H-56,{dir:def.dir==='up'?'down':'up',to:def.floorOf,w:64,h:56,back:true});
    placeFloorItems(def,items,put,W,H,rng,wallY);
  }
  for(const dir of ['up','down']){
    const S=F[dir]; if(!S) continue;
    const to=def.id+'_'+dir, sec=S.secret;
    let at=null;
    if(sec){
      const host=items.find(it=>it.k===({rug:'rug',sack:'sack',counter:'counter',painting:'painting',wall:'cell',shelf:'shelf',barrel:'barrel',bunk:'bunk'}[sec.at])&&(!it.used)&&(sec.at!=='painting'||it.trig||!items.some(q=>q.k==='painting'&&q.trig))&&(sec.at!=='shelf'||it.trig||!items.some(q=>q.k==='shelf'&&q.trig)));
      if(host){ host.used=true; at=sec.at==='rug'?[host.x-host.w/2+40,host.y-host.h/2+30]:sec.at==='painting'||sec.at==='shelf'?[host.x,Math.max(host.y+70,wallY+80)]:sec.at==='counter'?[host.x+60,host.y-52]:[host.x+(host.x<W/2?60:-60),host.y]; put('trig',host.x,host.y+(sec.at==='painting'?40:sec.at==='shelf'?22:0),{label:sec.label,text:sec.text,key:'sec_'+to,to,w:(host.w||60),h:(host.h||40),r:Math.max(host.w||60,host.h||40)/2+6,noCol:true}); }
    }
    if(!at) at=freeIn(items,W,H,STAIR_SPOTS(W,H),70,64);
    put('stairs',at[0],at[1],{dir,to,w:64,h:56,hidden:sec?'sec_'+to:null});
  }
  if(F.cubby){ const host=items.find(it=>it.k===F.cubby.at)||items[0]; put('trig',host.x+30,host.y+36,{label:F.cubby.label,text:F.cubby.text,key:'sec_'+def.id+'_cubby',reward:F.cubby.reward,r:30,noCol:true}); }
}
function placeFloorItems(def,items,put,W,H,rng,wallY){
  // simple, readable layouts for the extra floors
  const back=[], floorSpots=[[W*0.2,H*0.42],[W*0.8,H*0.42],[W*0.2,H*0.7],[W*0.8,H*0.7],[W*0.5,H*0.38],[W*0.35,H*0.58],[W*0.65,H*0.58],[W*0.12,H*0.25],[W*0.88,H*0.25]];
  let fi=0, wi=0; const wallXs=[W*0.3,W*0.7,W*0.5,W*0.15,W*0.85];
  for(const [k,a,b] of def.items||[]){
    const o=typeof a==='object'&&a?a:(b||{});
    if(k==='painting'){ put('painting',wallXs[wi++%wallXs.length],wallY*0.45,{caption:typeof a==='string'?a:'',trig:!!(b&&b.trig)}); continue; }
    if(k==='window'){ put('window',wallXs[wi++%wallXs.length],wallY*0.5,{}); continue; }
    if(k==='banner'||k==='cobweb'||k==='moosehead'){ put(k,wallXs[wi++%wallXs.length],wallY*0.6,{}); continue; }
    if(k==='shelf'||k==='jars'){ put('shelf',wallXs[wi++%wallXs.length],wallY+12,{w:110,jars:k==='jars',trig:!!o.trig}); continue; }
    if(k==='note'){ const [x,y]=freeIn(items,W,H,floorSpots.slice(fi++%floorSpots.length).concat(floorSpots),40,30); put('note',x,y,{text:a}); continue; }
    const [x,y]=freeIn(items,W,H,floorSpots.slice(fi++%floorSpots.length).concat(floorSpots),k==='bed'?70:k==='table'||k==='desk'?100:50,k==='bed'?100:50);
    if(k==='hchest') put('hchest',x,y,{loot:a,r:20});
    else if(k==='bed') put('bed',x,y,{w:62,h:96});
    else if(k==='table'||k==='desk') put(k,x,y,{w:96,h:54,books:k==='desk'});
    else if(k==='cell') put('cell',W-130,H*0.4,{w:180,h:150});
    else if(k==='coinpile') put('coinpile',x,y,{n:o.coins||8});
    else if(k==='ore') put('cave_ore',x,y,{r:16});
    else if(k==='rock') put('rock',x,y,{egg:{k:'rock',label:'Look at the rock',say:[pick(['A rock named Pebbles. Gorran wrote the name on it.','A rock named Sir Rockington. He has a tiny painted mustache.','A very round rock labeled MAREN. Gorran was right, she would not like this.'])]}});
    else if(k==='cat'||k==='goose') put(k,x,y,{egg:EGGS.find(e=>e.k===k)});
    else put(k,x,y,{r:k==='crate'?20:k==='chair'?11:16});
  }
}
// moving between floors keeps the outdoor return point
function goFloor(o){
  const to=o.to, from=AREA.id, ow=G.ow;
  if(!AREADEFS[to]) return;
  for(const c of AREA.cols) removeCol(c);
  for(const e of G.enemies) if(e.inArea) e.dead=true;
  AREA=null;
  SFX.play('step',1.4);
  const def=AREADEFS[to];
  AREA={def,id:to,kind:def.kind,name:def.name,cols:[],objs:[],lights:[],npcs:[],dark:def.dark,level:def.level||1};
  G.area=to; buildHouse(AREA,def); areaNPCs();
  const st=AREA.objs.find(q=>q.k==='stairs'&&q.to===from)||AREA.objs.find(q=>q.k==='stairs');
  if(st){ player.x=st.x; player.y=st.y>AREA.ry+AREA.rh/2?st.y-st.h/2-30:st.y+st.h/2+26; } else { player.x=AREA.spawn.x; player.y=AREA.spawn.y; }
  player.kvx=player.kvy=0; if(G.pip){ G.pip.x=player.x; G.pip.y=player.y+20; } compsOnMove();
  G.ow=ow; updateCam(0,true); G.fade=1;
  if(!G.found['seen_'+to]){ G.found['seen_'+to]=true; if(def.secret){ G.secrets=G.secrets||{}; G.secrets['sec_'+to]=1; } }
  setBanner(def.name,'',1.4,'region'); saveGame();
}
// walking onto the stairs takes Ash up or down (v11 UX, like the doors in a2e_interiors.js): he bumps their edge while
// pushing into them. The stairs he arrives by wait until he has stepped away from them, so he never bounces back.
function floorStairsWalk(push){
  const A=AREA, p=player; if(!A||!p) return false;
  for(const o of A.objs){
    if(o.k!=='stairs'||(o.hidden&&!G.found[o.hidden])) continue;
    const hw=(o.w||64)/2, hh=(o.h||56)/2, nx=clamp(p.x,o.x-hw,o.x+hw), ny=clamp(p.y,o.y-hh,o.y+hh), dx=nx-p.x, dy=ny-p.y, d=Math.hypot(dx,dy);
    const touch=d<=(p.r||14)+5;
    if(DW.hold===o){ if(DW.holdT>0||touch) continue; DW.hold=null; }
    if(!touch||!push) continue;
    if(d>0.5&&(push.x*dx+push.y*dy)/d<0.35) continue;
    goFloor(o);
    if(AREA&&AREA!==A){ DW.hold=AREA.objs.find(q=>q.k==='stairs'&&q.to===A.id)||null; DW.holdT=0.5; G.prompt=null; }
    return true;
  }
  return false;
}
function revealTrig(o){
  if(G.found[o.key]){ return false; }
  runDialogue([['narr',o.text]],()=>{
    scene='play'; G.found[o.key]=true; G.secrets=G.secrets||{}; G.secrets[o.key]=1;
    jingle('secret','chest'); shake(3); emit(o.x,o.y,24,{col:'255,230,180',smin:40,smax:140,lmin:.4,lmax:.8,zmin:1.5,zmax:3});
    const n=Object.keys(G.secrets).filter(k=>k.startsWith('sec_')).length;
    setBanner('You found a secret!',`${n} of ${SECRET_ROOMS.length} hidden places in houses`,2.6);
    if(o.reward){ if(o.reward.coins) addCoins(o.reward.coins,o.x,o.y); if(o.reward.heal){ player.hp=player.maxHp; } }
    const st=AREA.objs.find(q=>q.k==='stairs'&&q.hidden===o.key); if(st&&!st.col) st.col=addAreaCol({t:'r',x0:st.x-st.w/2,y0:st.y-st.h/2,x1:st.x+st.w/2,y1:st.y+st.h/2});
    saveGame();
  });
  return true;
}
function openHChest(o){
  if(G.found[o.id]){ runDialogue([['narr','Empty now. You already took the good stuff.']],()=>{ scene='play'; }); return; }
  const L=o.loot||{};
  runDialogue([['narr',L.text||'A little chest with a few coins inside.']],()=>{
    scene='play'; G.found[o.id]=true; SFX.play('chest');
    if(L.coins) addCoins(L.coins,o.x,o.y);
    if(L.bless){ G.pendingBless+=L.bless; later(0.8,offerPending); }
    if(L.potmax){ player.potionsMax+=L.potmax; player.potions=player.potionsMax; }
    if(L.energy){ player.maxEnergy+=L.energy; player.energy=player.maxEnergy; }
    if(L.lantern) G.items.lantern=1;
    if(L.hat){ G.hats=G.hats||{}; G.hats[L.hat]=true; G.hat=L.hat; }
    if(L.camps) for(const c of CAMPS) fogReveal(c.x,c.y,260);
    if(L.reveal==='frost'){ for(let y=3000;y<5400;y+=500) for(let x=600;x<4600;x+=500) fogReveal(x,y,320); }
    saveGame();
  });
}
function floorObjAct(o){
  const say=(t,cb)=>runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); saveGame(); });
  switch(o.k){
    case 'stairs': if(o.hidden&&!G.found[o.hidden]) return true; goFloor(o); return true;
    case 'trig': if(!revealTrig(o)) say('Nothing more to find here. You already know its secret.'); return true;
    case 'hchest': openHChest(o); return true;
    case 'nest': if(!G.found[o.id]){ say('Pebble’s nest: buttons, spoons, three keys, a thimble, and one shiny coin she pushes toward you with her beak. You get the feeling there’s a toll.',()=>{ G.found[o.id]=true; addCoins(25,o.x,o.y); }); } else say('Pebble watches you very carefully. You keep your buttons to yourself.'); return true;
    case 'recipebook': say(G.found[o.id]?'Grandma Crumb’s recipes. You could read them all day.':'Grandma Crumb’s secret recipe book. The Lantern Bun page has one extra line, underlined three times: "A pinch of dragon fire. NOT A FISTFUL, BERTRAM."',()=>{ if(!G.found[o.id]){ G.found[o.id]=true; G.flags.crumbSecret=true; gainXp(60); } }); return true;
    case 'musicbox': if(!G.found[o.id]){ try{ Music.stinger('secret'); }catch(e){} say('A music box with a tiny dancing salmon on top. It plays the Lantern Day song, slow and sweet. This must be the Sleepy Salmon’s oldest secret.',()=>{ G.found[o.id]=true; G.pendingBless++; later(0.8,offerPending); }); } else { try{ Music.stinger('secret'); }catch(e){} say('The salmon dances. It never gets tired.'); } return true;
    case 'ghost': runDialogue([['narr','A friendly, see-through cook floats over the sauce barrels.'],ch('narr','"Ooooo. Hello. I’m Old Smokey. I was the first cook here, a hundred years ago. Would you hum me a tune?"',[
        {t:'Hum the Lantern Day song',tone:'kind',fn:()=>{ if(!G.found[o.id]){ G.found[o.id]=true; addCoins(30,o.x,o.y); } },then:[['narr','"Ohhh, that one. My mother sang that one. Here, take my old tip jar. I can’t spend it. I’m a ghost."']]},
        {t:'Hum something spooky',tone:'silly',then:[['narr','"Ooooo! That’s MY job! Ha! I like you."']]},
        {t:'Back away slowly',then:[['narr','"Everyone does that. I’m used to it. Bye now."']]}])],()=>{ scene='play'; saveGame(); }); return true;
    case 'moosehead': say(pick(['The moose head blinks. "...Don’t tell Ulf I can talk. He’s scared enough of the attic already."',S('"I used to be the biggest moose in the Frostpine," says the moose head. "Now I’m the biggest moose in the attic. Not much competition up here."','"I was the biggest moose in the woods," says the moose head. "Now I am the biggest in the attic."')])); return true;
    case 'telescope2': if(isNight()){ say(S('Through the big telescope, the night sky is full. Bright streaks show where stars fell into the valley. You can see the spots on your map now.','You see where stars fell! They are on your map now.'),()=>{ G.flags.chart=true; }); } else say('Too bright to see any stars. Quill’s note says: ALWAYS AT NIGHT.'); return true;
    case 'mousehole': say(pick(['A tiny door in the wall, with a tiny sign: KNOCK FIRST.','You knock. A tiny voice says "Not today, thank you."','There’s a very small doormat that says WELCOME (NOT YOU, CAT).'])); return true;
    case 'crate': say(pick(['A crate full of turnips.','A crate labeled "DO NOT OPEN." You don’t. You’re a good dragon.','Old lanterns, packed in straw.','Jars of pickles. So many pickles.'])); return true;
    case 'cobweb': say('A spider has written something in the web. It might say "hello." It might say "go away." Spider handwriting is hard.'); return true;
    case 'banner': say('A banner with the Scaled Oath’s scale on it. Someone has drawn a little frowny face on the scale.'); return true;
    case 'candles': say('Candles, burned down low. Someone sat here a long time.'); return true;
    case 'piedish': if(!G.flags.clue_dish){ say('An empty pie dish, licked clean, hidden under a display case. Stuck to the rim: one long, curly mustache hair.',()=>{ G.flags.clue_dish=true; questPoke(); }); } else say('The pie dish. The evidence.'); return true;
  }
  return false;
}
// (the stairs have no prompt: Ash walks onto them, floorStairsWalk)
const FLOOR_LABEL={stairs:o=>null,trig:o=>G.found[o.key]?null:o.label,hchest:o=>G.found[o.id]?null:'Open the chest',nest:()=>'Look in the nest',recipebook:()=>'Read the recipe book',musicbox:()=>'Wind the music box',ghost:()=>'Talk to the ghost',moosehead:()=>'Look at the moose',telescope2:()=>'Look through the telescope',mousehole:()=>'Knock on the tiny door',crate:()=>'Look in the crate',cobweb:()=>'Look at the cobweb',banner:()=>'Look at the banner',candles:()=>'Look at the candles',piedish:o=>G.flags.clue_dish?null:'Look at the pie dish'};
