
// ================= quests that play differently: chases, hide and seek, defending a field, a race, a song, a mystery and a trading chain
Object.assign(ITEM_NAMES,{purse:'Pell’s coin purse',sheet1:'Song sheet: The Lantern Waltz',sheet2:'Song sheet: Hob’s Stew Shanty',sheet3:'Song sheet: Over Cinder Mountain',cheese:'A wheel of Burrows cheese',yarn:'Wolf-fur yarn',scarf:'A fancy scarf',feather:'A peacock feather',songscroll:'Tamsin’s song scroll',starmap:'Quill’s star map',stariron2:'A chunk of star-iron'});
Object.assign(QDEFS,{
  thief:{title:'Stop, Thief!',giver:'pell',min:'wren',
    offer:[['pell',S(`Ash! A kobold sneak just grabbed my coin purse and ran! It didn't even haggle!`,`Ash! A kobold stole my purse! It did not even haggle!`)],['pell',S(`It can't have gone far. Catch it and I'll make it worth your while. A real reward. Not a bean.`,`Catch it and I will reward you!`)]],
    steps:[
      {t:'flag',flag:'purse_caught',npc:'pell',mini:'chase',text:'Catch the kobold sneak before it gets away (talk to Pell to start)',ready:[['pell',`There it goes! Behind the stalls! Ready?`]]},
      {t:'talk',npc:'pell',text:'Bring the purse back to Pell',take:{purse:1},lines:[['pell',`My purse! And it's only a little chewed. You're faster than a kobold, Ash. That's saying something.`],['pell',S(`Oh, and the sneak dropped its knives when you caught it. Two little curved ones. Twin Fangs, it called them. I'd sell them, but they're sticky. Keep them. No charge. Don't get used to it.`,`The sneak dropped two little knives. Twin Fangs! Keep them.`)]],reward:{coins:40,xp:60,weapon:'daggers'}}
    ]},
  seek:{title:S('A Barrel of Laughs','Hide and Seek'),giver:'nib',min:'lore',
    offer:[['nib',`Wanna play hide and seek? Me and three friends will hide somewhere in Brindlecross. You have two minutes to find us all.`],['nib',`Listen for giggling. Jem giggles like a goose.`]],
    steps:[
      {t:'flag',flag:'seek_won',npc:'nib',mini:'seek',text:'Find all four hidden kids in Brindlecross (talk to Nib to start)',ready:[['nib',`Close your eyes and count to ten! No peeking! ...Okay GO!`]]},
      {t:'talk',npc:'nib',text:'Tell Nib you found everyone',lines:[['nib',S(`You found ALL of us! Even Jem, and Jem hid in a barrel! Here, my best treasure map. It's a real one. There's hardly any cat on it.`,`You found us all! Even Jem! Here, a real treasure map.`)]],give:{map_x2:1},reward:{coins:20,xp:50}}
    ]},
  // a small village quest, offered from Lantern Day morning (the minigame is in a9g_mini.js: four small waves)
  pumpkins:{title:'Pumpkin Patrol',giver:'hal',min:'lanterns',
    get offer(){ const fest=G&&G.mode==='story'&&!reached('raid');
      return [['hal',fest?S(`Ash! Slimes in my pumpkin patch. On Lantern Day! Those are the festival pumpkins.`,`Slimes in my pumpkins! On Lantern Day!`):S(`Ash, the slimes have found my pumpkin patch. They come out of the hedges and eat everything. Even the stalks.`,`Slimes are eating my pumpkins!`)],
        ['hal',S(`They come in little waves, a few at a time. Knock them off the pumpkins before they finish a bite.`,`They come in little waves. Knock them off the pumpkins!`)],
        ['hal',fest?S(`Every pumpkin you save is a pie for the festival.`,`Save the festival pies!`):S(`Every pumpkin you save is a pie for the winter.`,`Save the pies!`)]]; },
    steps:[
      {t:'flag',flag:'pumpkins_saved',npc:'hal',mini:'defend',text:'Guard Hal’s pumpkin patch from four little waves of slimes (talk to Hal to start)',ready:[['hal',`Here they come! Don't let them eat the big one. Her name is Gertrude.`]]},
      {t:'talk',npc:'hal',text:'Tell Hal how the pumpkins did',lines:[['hal',S(`You saved them! Well, most of them. Gertrude has a bite out of her, but she's putting a brave face on it. Here, a little something from the farm.`,`You saved them! Gertrude has one bite out. Here.`)]],reward:{coins:30,xp:70,bless:1}}
    ]},
  race:{title:'The Frostpine Dash',giver:'elka',min:'wren',
    offer:[['elka',`Race me! Through all six flags around the lodge. If you win, you get my second-best racing scarf.`],['elka',`If I win, you have to say "Elka is the fastest in the valley" really loud. In front of Ulf.`]],
    steps:[
      {t:'flag',flag:'race_won',npc:'elka',mini:'race',text:'Beat Elka through the six flags around Frostpine Lodge (talk to Elka to start)',ready:[['elka',`On your marks... get set... GO!`]]},
      {t:'talk',npc:'elka',text:'Collect your prize from Elka',lines:[['elka',`You beat me! Nobody beats me! ...Okay, you beat me. Here's the scarf. It's fast. You'll see.`]],reward:{stamina:20,xp:80}}
    ]},
  song:{title:S('Lost and Sound','The Lost Songs'),giver:'wendel',min:'lore',
    offer:[['wendel',S(`In the raid a kobold ran off with my song folder and dropped my three best songs all down the road. Tilly says one turned up at the Sleepy Salmon Inn.`,`A kobold dropped my three songs along the road. One is at the inn.`)],['wendel',S(`Bring them back and we'll play them together. I play, you play it back. Every good song needs an echo.`,`Bring them back. We will play together!`)]],
    steps:[
      {t:'item',item:'sheet1',n:1,text:S(`Find the Lantern Waltz sheet (it ended up in the guest rooms of the Sleepy Salmon Inn)`,`Find the Lantern Waltz song in the Sleepy Salmon Inn`),at:'area:h_tilly'},
      {t:'item',item:'sheet2',n:1,text:'Find the Stew Shanty sheet (somewhere in the Smoky Kettle)',at:'area:h_hob'},
      {t:'item',item:'sheet3',n:1,text:'Find the Cinder Mountain sheet (in the Brindlecross Library archive)',at:'area:h_library'},
      {t:'flag',flag:'song_played',npc:'wendel',mini:'simon',text:'Play the songs back with Wendel in Emberhollow',ready:[['wendel',`All three! Let's play. I play the notes, you play them back. Ready?`]]},
      {t:'talk',npc:'wendel',text:'Talk to Wendel',take:{sheet1:1,sheet2:1,sheet3:1},lines:[['wendel',`That was beautiful. You have the ears of a dragon. Which, I suppose, you do.`],['wendel',S(`Take this. And every song I finish, you hear first. Even the ones that rhyme Ash with crash.`,`Take this. You hear all my new songs first.`)]],reward:{bless:1,xp:80}}
    ]},
  pie:{title:S('A Slice of Crime','The Missing Pie'),giver:'mayor',min:'wren',
    offer:[['mayor',S(`Ash! A crime has been committed! My prize pie, the one for the Brindlecross Fair judging, has been EATEN. In the night. By a FIEND.`,`Ash! Someone ate my prize pie in the night!`)],['mayor',`Find the culprit. Ask around. Leave no crumb unturned!`]],
    topics:{
      nib:{t:'Did you see who ate the Mayor’s pie?',flag:'clue_nib',lines:[['nib',`Not me! I was hiding from the Mayor's dog all night. But I DID see someone walking around in pajamas at midnight. They had a really big mustache.`]]},
      tilly:{t:'Was anyone up late last night?',flag:'clue_tilly',lines:[['tilly',`The Mayor came in at midnight in his nightcap, asking for "more crust, more crust." His eyes were closed. I gave him a bread roll and he walked home.`]]},
      cookie:{t:'Did you take a pie from the Mayor?',flag:'clue_cookie',lines:[['cookie',`A pie? From Brindlecross? I've been in Coppergulch all week stirring rocks. Do I look like I eat pie? ...Don't answer that.`]]}
    },
    steps:[
      {t:'flags',flags:['clue_nib','clue_tilly','clue_dish'],n:2,text:'Find clues about the missing pie: ask around Brindlecross and look in the Mayor’s house',at:'poi:brindle'},
      {t:'talk',npc:'mayor',text:'Tell the Mayor who ate his pie',lines:'pieAccuse'}
    ]},
  swap:{title:S('A Wheel of Fortune','The Great Swap'),giver:'hal',min:'three',give:{cheese:1},
    offer:[['hal',`I made too much cheese. Way too much. Take a wheel. Ulf at the Frostpine Lodge would trade his own boots for it.`],['hal',`Who knows? Swap it for something, then swap that, and see where you end up. That's how my grandpa got a cow.`]],
    steps:[
      {t:'talk',npc:'ulf',text:'Trade the cheese with Ulf at Frostpine Lodge',take:{cheese:1},give:{yarn:1},lines:[['ulf',`HAL'S CHEESE. Oh, you beautiful wheel. Here, take this wolf-fur yarn. My brother says it's for goats. It's for SHEEP.`]]},
      {t:'talk',npc:'nana',text:'Nana Pettibone in Emberhollow knits. Show her the yarn.',take:{yarn:1},give:{scarf:1},lines:[['nana',`Wolf-fur yarn! Oh, it's so soft. Give me one minute. ...There. A fancy scarf. Too fancy for me. Maybe Marigold would like it.`]]},
      {t:'talk',npc:'marigold',text:'Show the fancy scarf to Marigold in Brindlecross',take:{scarf:1},give:{feather:1},lines:[['marigold',S(`A scarf for my brother Hob! He'll lose it within the week, but he'll look wonderful. Here, a peacock feather. Tamsin at the Smoky Kettle has been begging me for one.`,`A scarf for Hob! Here, a peacock feather. Give it to Tamsin.`)]]},
      {t:'talk',npc:'tamsin',text:'Bring the feather to Tamsin the Bard at the Smoky Kettle',take:{feather:1},give:{songscroll:1},lines:[['tamsin',S(`A peacock feather! At last, a real feather in my cap! Take this song scroll. Professor Quill asked me for a song "the stars might like." Give it to her.`,`A feather for my cap! Take this song to Professor Quill.`)]]},
      {t:'talk',npc:'quill',text:'Give Tamsin’s song to Professor Quill in Brindlecross',take:{songscroll:1},give:{starmap:1},lines:[['quill',`A song for the stars! I'll sing it at them tonight. They can't stop me. Here, my old star map. Gorran Flint at Coppergulch has wanted it for years.`]]},
      {t:'talk',npc:'gorran',text:'Bring the star map to Gorran at Coppergulch',take:{starmap:1},give:{star_iron:1},lines:[['gorran',S(`Quill's star map! The old star lady finally let it go. Here, a chunk of star-iron from where one of these fell. Take it to your mom.`,`Quill's star map! Here, star-iron. Take it to your mom.`)],['narr',S(`From one wheel of cheese to a piece of a fallen star. Hal's grandpa only ever got as far as a cow.`,`From cheese to a fallen star! Hal's grandpa only got a cow.`)]],reward:{xp:150,coins:40}}
    ]}
});
// the end of the pie mystery is a choice
STORY.pieAccuse=[
  ['mayor',`Well? Who is the fiend? WHO ATE MY PIE?`],
  ch('ash',`It was...`,[
    {t:'Nib did it.',fn:()=>{ befriend('nib',-0.5,true); },then:[['mayor',`Nib? Little Nib? ...Nib has clean hands and an alibi involving my dog. Think harder, Ash.`],{who:'ash',text:'Hmm.',opts:()=>STORY.pieAccuse[1].opts}]},
    {t:'Cookie from Coppergulch.',fn:()=>{ befriend('cookie',-0.5,true); },then:[['mayor',`Cookie hates pie. Everyone knows Cookie hates pie. It's the rocks. Think harder!`],{who:'ash',text:'Hmm.',opts:()=>STORY.pieAccuse[1].opts}]},
    {t:'A goat. Probably Duchess.',then:[['mayor',S(`Duchess lives up in the Frostpine and, I'm told, is very busy being rude. Think harder!`,`Duchess lives far away, in the Frostpine. Think harder!`)],{who:'ash',text:'Hmm.',opts:()=>STORY.pieAccuse[1].opts}]},
    {t:'You did, Mayor. In your sleep.',cond:()=>true,fn:()=>{ G.choices.extra=G.choices.extra||{}; G.choices.extra.pie='You proved the Mayor ate his own pie in his sleep.'; },then:()=>[['mayor',`ME? Preposterous! I would never... I...`],['narr',`The Mayor touches his mustache. A crumb falls out. Then another. Then a small piece of crust.`],['mayor',S(`...Oh no. I sleepwalk. I sleep-EAT. Ash, you're a genius. A terrible, embarrassing genius.`,`Oh no. I ate it in my sleep! You are a genius, Ash.`)],['mayor',`Here, your reward. And please, please don't tell the town.`],{who:'narr',text:'',skipIf:()=>{ giveReward({coins:60,xp:100}); befriend('mayor',1.5); return true; }}]}
  ])
];
