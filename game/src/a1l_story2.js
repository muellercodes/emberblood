// ================= more story: world events, Tikka (a runaway kobold who keeps bumping into Ash), dreams from long ago,
// and small variations on moments that repeat. This file holds the words; the runtime lives in a9j_events.js.
// Every line is written as S(full, simple): the full text, and a short version in easy words for the Words: Simple setting.
// Event scripts are functions of the running event E, so they can read what happened (E.d) and set a plan (E.plan).
const xl=(who,f,s)=>[who,S(f,s)];
const xc=(who,f,s,opts)=>ch(who,S(f,s),opts);
const xo=(f,s,o)=>Object.assign({t:S(f,s)},o||{});
// a silent step inside a scene: runs fn once (also when the scene is skipped) and shows nothing
const xdo=fn=>({who:'narr',text:'',fn,skipIf:()=>true});
// speakers of our own (names and colours; portraits are in a9j_events.js)
Object.assign(SPK,{
  ev_wim:{name:'Wim Wobble',col:'#e8c070'}, ev_posy:{name:'Posy',col:'#ff9ac0'}, ev_wisp:{name:'Sir Wispley',col:'#c8e8ff'}, ev_mimic:{name:'The Hungry Chest',col:'#e0a050'},
  ev_bea:{name:'Bea the Goatherd',col:'#d8c070'}, ev_quib:{name:'Quibble the Somewhat Great',col:'#a8a0ff'}, ev_bess:{name:'Barnacle Bess',col:'#8ad8c8'},
  ev_fizz:{name:'Madame Fizzwick',col:'#ff9ad0'}, ev_clank:{name:'Sir Clanksworth',col:'#c8ccd8'}, ev_juno:{name:'Juno',col:'#ffb0a0'}, ev_pim:{name:'Pim',col:'#a0d0ff'},
  ev_chuck:{name:'Cheddar Chuck',col:'#ffd860'}, ev_pud:{name:'Mr. Pudding',col:'#e0b080'}, ev_lumi:{name:'Lumi',col:'#e8ff9a'}, ev_thimble:{name:'Granny Thimble',col:'#d8b0e0'},
  ev_croak:{name:'Lord Croakington',col:'#9fd86a'}, ev_fog:{name:'The Fog',col:'#cfd8e8'}, ev_drake:{name:'Drakeling',col:'#ffb070'},
  ev_tikka:{name:'Tikka',col:'#e8c86a'}, ev_tock:{name:'Tock',col:'#c8e06a'},
  ember_kid:{name:'Ember',col:'#ffb08a'}, vor_old:{name:'Vorlaxis',col:'#ff8a55'}, cinder_young:{name:'Young Cindervane',col:'#ffc870'}
});

// ================= world events
const EVS={};
// ---------- Stuck in the Mud (Wim Wobble, a traveling tinker; part two brings a hat)
EVS.cart={title:S('Stuck in the Mud','Stuck in the Mud'),
  call:()=>S(`Hello? Anybody? My wagon is stuck!`,`Help! My wagon is stuck!`),
  meet:E=>[
    xl('ev_wim',`Oh, thank goodness, a dragon! I'm Wim Wobble, traveling tinker. My wagon is stuck in the mud up to its ears.`,`Hi! I'm Wim. My wagon is stuck in the mud.`),
    xl('ash',`I'm Ash. Wait, wagons have ears?`,`I'm Ash. Wagons have ears?`),
    xl('ev_wim',`This one does. I gave it ears. It's a long story. Can you help me get it out?`,`This one does. Can you help me?`),
    xc('ash',`How should I get it out?`,`How will you get it out?`,[
      xo(`Push it out! Whack the wheels!`,`Hit the wheels to push it out!`,{tone:'brave',fn:()=>{ E.plan='push'; },then:[xl('ev_wim',`Mind the paint! Well. Mind the wood. The paint is mostly mud now.`,`Go! Hit the wheels!`)]}),
      xo(`Breathe fire on the mud and dry it out`,`Dry the mud with fire`,{fn:()=>{ E.plan='dry'; },then:[xl('ev_wim',`Fire? Near my wagon? ...Gently. Very, very gently. Aim at the mud.`,`Fire? Okay. Aim at the mud. Gently!`)]}),
      xo(`Sorry, I can't right now`,`Sorry, not now`,{fn:()=>{ E.plan='no'; },then:[xl('ev_wim',`That's all right. I'll just sit here. In the mud. Forever. No pressure.`,`Okay. I will wait here. In the mud.`)]})
    ])],
  win:E=>[
    xl('narr',`With a loud SCHLORP, the wagon pops free. Wim does a little dance. It's not a good dance. It's a happy one.`,`SCHLORP! The wagon is free. Wim does a happy dance.`),
    xc('ev_wim',`You did it! Let me pay you. Pick anything. Well. Pick one of these.`,`Thank you! Pick a present.`,[
      xo(`Some coins, please`,`Coins, please`,{fn:()=>evGive({coins:25}),then:[xl('ev_wim',`Twenty-five shiny coins. Don't spend them all on hats. Spend SOME on hats.`,`Here are 25 coins!`)]}),
      xo(`Fill up my healing draughts`,`Fill my healing drinks`,{fn:()=>evGive({pots:true,heal:true}),then:[xl('ev_wim',`My famous Wobble Tonic. It tastes like socks, but it works.`,`Here is my tonic. It tastes like socks. It works!`)]}),
      xo(`A treat for Pip`,`A treat for Pip`,{cond:()=>!!G.flags.pip,fn:()=>evGive({treat:1}),then:[xl('pip',`Mip! Mip mip!`,`Mip! Mip mip!`)]})
    ]),
    xl('ev_wim',`I'll be back this way someday. I always come back. Like a boomerang. A boomerang with a wagon.`,`I will come back one day. Bye!`)],
  quit:E=>[xl('ev_wim',`Oh dear. The mud wins this round. I'll wait for the sun.`,`Oh no. I will wait for the sun to dry it.`)]
};
EVS.cart2={title:S(`Wim's Wagon Returns`,`Wim Comes Back`),
  call:()=>S(`Ash! ASH! Over here! It's me, Wim!`,`Ash! It's me, Wim!`),
  meet:E=>{
    const k=E.d.hat, nm=k?{top:'top hat',wizard:'wizard hat',crown:'flower crown',party:'party hat'}[k]:'';
    const L=[xl('ev_wim',`Ash! The wagon remembered you. Look, it's wiggling its ears.`,`Ash! My wagon remembers you. Look, it wiggles its ears!`),
      xl('ev_wim',`I've been all over the valley. And I found something, and I thought: that is a present for a hero.`,`I found a present for you!`)];
    if(k) L.push(xc('ev_wim',`A ${nm}! Fit for a dragon. Will you wear it now?`,`A ${nm}! Will you wear it now?`,[
      xo(`Yes! Put it on!`,`Yes!`,{fn:()=>evGive({hat:k,wear:true}),then:[xl('ev_wim',`Oh, that's perfect. You look like a dragon who knows things.`,`You look great!`)]}),
      xo(`I'll save it for a special day`,`I will save it`,{fn:()=>evGive({hat:k}),then:[xl('ev_wim',`Every day is a special day when you've got a spare hat.`,`Okay! It is yours.`)]})]));
    else L.push(xl('ev_wim',`You already have every hat in the valley? Then take these coins and open a hat museum.`,`You have all the hats! Take these coins instead.`),xdo(()=>evGive({coins:60})));
    L.push(xl('ev_wim',`Wobble on, Ash! Wobble on!`,`Bye, Ash!`));
    return L;
  }
};
// ---------- Kitten Up a Tree (Posy and Sir Fluffington)
EVS.kitten={title:S('Kitten Up a Tree','Kitten Up a Tree'),
  call:()=>S(`Sir Fluffington, come DOWN!`,`Kitty, come DOWN!`),
  meet:E=>[
    xl('ev_posy',`My kitten climbed all the way to the top, and now he won't come down. He's being very brave and very silly.`,`My kitten is stuck at the top of the tree!`),
    xl('narr',`High in the branches, a small orange kitten says "mew" in a voice that means "I regret everything."`,`Up high, a little kitten says "mew". He looks scared.`),
    xc('ash',`How will you get him down?`,`How will you get him down?`,[
      xo(`Jump up and grab him!`,`Jump up and grab him!`,{cond:()=>hasAbil('jump'),tone:'brave',fn:()=>{ E.plan='jump'; },then:[xl('ev_posy',`You can JUMP that high? Go, go, go!`,`You can jump that high? Go!`)]}),
      xo(`Fly up to him!`,`Fly up to him!`,{cond:()=>hasAbil('wings'),fn:()=>{ E.plan='fly'; },then:[xl('ev_posy',`You have WINGS? I'm telling everyone at school.`,`You have WINGS? Wow!`)]}),
      xo(`Pip, can you fetch him?`,`Pip, can you get him?`,{cond:()=>!!G.pip,fn:()=>{ E.plan='pip'; },then:[xl('pip',`Mip!`,`Mip!`),xl('narr',`Pip zooms up into the branches.`,`Pip flies up into the tree.`)]}),
      xo(`Shake the tree. Very gently.`,`Shake the tree gently`,{fn:()=>{ E.plan='shake'; },then:[xl('ev_posy',`Gently! He's a knight, but he's a small knight.`,`Gently, please!`)]}),
      xo(`Sing him a silly song`,`Sing a silly song`,{fn:()=>{ E.plan='song'; },then:[
        xl('ash',`Here, kitty kitty. Who's a fluffy knight? Who's the fluffiest knight in all the land?`,`Here, kitty! Who is a fluffy knight?`),
        xc('narr',`Sir Fluffington tilts his head. He takes one step. Then he sits down and washes his paw.`,`The kitten looks at you. Then he licks his paw.`,[
          xo(`Wiggle your tail like a string`,`Wiggle your tail`,{fn:()=>{ E.plan='tail'; },then:[xl('narr',`Your tail goes wiggle, wiggle. Sir Fluffington's eyes go huge. He pounces, straight off the branch, and lands right on your head.`,`You wiggle your tail. The kitten jumps down onto your head!`)]}),
          xo(`Sing even louder!`,`Sing louder!`,{fn:()=>{ E.plan='shake'; },then:[xl('narr',`You sing louder. A bird nearby leaves. Sir Fluffington does not. Maybe a gentle shake of the tree will work.`,`The kitten stays. Maybe shake the tree a little.`)]})])]})
    ])],
  win:E=>[
    xl('narr',`Sir Fluffington lands safe in Posy's arms and purrs like a tiny engine.`,`The kitten is safe. He purrs.`),
    xl('ev_posy',`Thank you, Ash! Here. It's my best drawing. It's you! I gave you extra horns. And some coins I found.`,`Thank you! Here is my drawing of you. And some coins.`),
    xl('ev_posy',`Sir Fluffington says thank you too. He says it by biting your claw. That means he loves you.`,`The kitten bites your claw. That means he likes you.`)]
};
// ---------- Falling Stars (a little star lands nearby and runs off in three sparks)
EVS.stars={title:S('Falling Stars','Falling Stars'),
  meet:E=>[
    xl('narr',`A little star has landed in the grass. It's warm, it hums, and it looks a bit embarrassed about the landing.`,`A little star fell in the grass. It is warm. It hums.`),
    xl('narr',`When you reach for it, it giggles and bursts into three sparks, which bounce away in three different directions.`,`You reach for it. It giggles and jumps away in three sparks!`),
    xc('ash',`Catch them?`,`Catch them?`,[
      xo(`Catch those sparks!`,`Catch the sparks!`,{tone:'brave',fn:()=>{ E.plan='catch'; }}),
      xo(`Let it be. Stars like to be free.`,`Let it go. Stars like to be free.`,{tone:'kind',fn:()=>{ E.plan='free'; },then:[xl('narr',`The sparks float back together and rise into the sky. Just before it vanishes, the star winks at you. You feel lucky.`,`The star floats back up into the sky. It winks at you.`)]})
    ])],
  win:E=>[
    xl('narr',`The three sparks hop into your claws and become one warm, happy star.`,`The sparks hop into your claws. They are one star again.`),
    xl('narr',`A fallen star grants one wish. Everybody knows that.`,`A falling star gives you one wish.`),
    xc('ash',`What do you wish for?`,`What do you wish for?`,[
      xo(`To be strong enough to protect everyone`,`To be strong`,{fn:()=>evGive({maxhp:8,heal:true}),then:[xl('narr',`The star glows red-gold and sinks into your scales. You feel a little bit sturdier. (+8 max health)`,`The star goes into your scales. You feel stronger. (+8 health)`)]}),
      xo(`For my friends to be safe`,`For my friends to be safe`,{tone:'kind',fn:()=>evGive({pots:true,heal:true,coins:20}),then:[xl('narr',`The star bursts into soft light that drifts off across the valley. Somewhere, your mom smiles in her sleep.`,`The star sends soft light over the valley. Mom smiles in her sleep.`)]}),
      xo(`Keep the star as a shard of star-iron`,`Keep it as star-iron`,{cond:()=>!G.flags.ev_stars_iron,fn:()=>{ G.flags.ev_stars_iron=true; evGive({iron:1}); },then:[xl('narr',`The star cools into a lump of blue star-iron. It's still humming. Mom is going to love this.`,`The star turns into blue star-iron. Mom will love it!`)]}),
      xo(`For a really, really big cake`,`For a really big cake`,{fn:()=>evGive({heal:true,coins:5}),then:[xl('narr',`Nothing happens. Then, far away in Emberhollow, Bertram suddenly feels like baking the biggest cake of his life.`,`Far away, Bertram suddenly wants to bake a giant cake.`)]})
    ])],
  quit:E=>[xl('narr',`The last spark zips up into the sky and joins the others. Maybe next time.`,`The sparks fly back up into the sky. Maybe next time.`)]
};
// ---------- The Ghost Who Lost His Hat (spooky but safe)
EVS.ghost={title:S('The Ghost Who Lost His Hat','The Ghost and the Hat'),
  call:()=>S(`Ooooo... my haaaat...`,`Ooooo... my hat...`),
  meet:E=>[
    xl('ev_wisp',`Ooooo. Oh! Don't be scared. I'm Sir Wispley. I'm a ghost, but a very polite one.`,`Hello! I am Sir Wispley. I am a ghost. A nice one.`),
    xl('ev_wisp',`The wind stole my hat. My BEST hat. I can't go to the Ghost Ball without a hat. Everyone will laugh. Ghostily.`,`The wind took my hat! I need it for the Ghost Party.`),
    xc('ash',`Will you find his hat?`,`Will you find his hat?`,[
      xo(`I'll find it!`,`I will find it!`,{tone:'kind',fn:()=>{ E.plan='find'; },then:[xl('ev_wisp',`It's tall and black and very dashing. Like me, a hundred years ago. It blew that way. I think. Ghosts are bad with directions.`,`It is tall and black. Look for it nearby!`)]}),
      xo(`Can ghosts even wear hats?`,`Can ghosts wear hats?`,{fn:()=>{ E.plan='find'; },then:[xl('ev_wisp',`Of course! How else would anyone know where my head is? Please find it. It blew off somewhere nearby.`,`Yes! Or nobody can find my head. Please find it!`)]}),
      xo(`BOO!`,`BOO!`,{fn:()=>{ E.plan='find'; },then:[xl('ev_wisp',`AAAAH! Oh. Oh, you got me. Nobody has scared a ghost in a hundred years. Ha. Ha ha. Will you still help me find my hat?`,`AAAH! You scared me! Will you still help?`),xl('ash',`Sorry. Yes. I'll find it.`,`Sorry! Yes, I will find it.`)]})
    ])],
  back:E=>[
    xc('ev_wisp',`My hat! You found my hat!`,`You found my hat!`,[
      xo(`Here you go, Sir Wispley`,`Here you go!`,{tone:'kind',fn:()=>evGive({coins:20,heal:true}),then:[xl('ev_wisp',`I feel whole again. Well. As whole as a ghost gets. Here, ghost money. It's just regular money, but colder.`,`Thank you! Here is some ghost money. It is cold.`)]}),
      xo(`Can I try it on first?`,`Can I try it on?`,{fn:()=>evGive({coins:20,heal:true}),then:[xl('narr',`You put on the hat. It's freezing. Your horns poke out of the top. Sir Wispley laughs so hard he goes see-through. More see-through.`,`You put on the hat. It is so cold! Your horns stick out. Sir Wispley laughs and laughs.`),xl('ev_wisp',`Oh, that was worth losing it for. Here, for the giggle.`,`That was funny! Here, for the giggle.`)]}),
      xo(`Can I keep it?`,`Can I keep it?`,{fn:()=>{ if(G.hats&&G.hats.top) evGive({coins:30}); else evGive({hat:'top',wear:true}); E.d.kept=true; },then:[xl('ev_wisp',`Keep it? ...Well. You did find it. And you look so dashing. Take it! I'll wear my second-best hat. It's a bucket.`,`Okay! You can keep it. I will wear a bucket instead.`)]})
    ]),
    xl('ev_wisp',`Off to the Ghost Ball! Ooooo! Happy ooooo!`,`Off to the Ghost Party! Bye!`)],
  quit:E=>[xl('ev_wisp',`Ooooo. Never mind. I'll go to the ball as a ghost with no hat. Very modern.`,`Never mind. I will go with no hat.`)]
};
// ---------- The Hungry Chest (a mimic; part two brings its baby)
EVS.mimic={title:S('The Hungry Chest','The Hungry Chest'),
  meet:E=>[
    xl('narr',`You lift the lid. The chest lifts its lid right back. It has teeth. And a tongue. And it looks very, very hungry.`,`The chest opens by itself. It has teeth! It is a mimic. It looks hungry.`),
    xl('ev_mimic',`GRRRMBLE.`,`GRRRMBLE.`),
    xc('ash',`What now?`,`What now?`,[
      xo(`Feed it a fish`,`Feed it a fish`,{cond:()=>(G.items.fish||0)>0,fn:()=>{ takeItems({fish:1}); E.plan='fed'; },then:[xl('ev_mimic',`*CHOMP* ...Mmmmm.`,`CHOMP! Yum.`)]}),
      xo(`Feed it some honey`,`Feed it honey`,{cond:()=>(G.items.honey||0)>0,fn:()=>{ takeItems({honey:1}); E.plan='fed'; },then:[xl('ev_mimic',`*SLURP* ...Mmmmmmm!`,`SLURP! Yum!`)]}),
      xo(`Feed it a frostberry`,`Feed it a frostberry`,{cond:()=>(G.items.frostberry||0)>0,fn:()=>{ takeItems({frostberry:1}); E.plan='fed'; },then:[xl('ev_mimic',`*crunch* ...Brrr. Mmm.`,`Crunch! Cold! Yum.`)]}),
      xo(`Tickle it!`,`Tickle it!`,{tone:'brave',fn:()=>{ E.plan='tickle'; },then:[xl('narr',`You wiggle your claws at it. The mimic's eyes go wide. It hops backward, clacking its lid. It wants to play! Tickle it with your weapon. Gently.`,`The mimic wants to play! Tap it with your weapon to tickle it.`)]}),
      xo(`Run away!`,`Run away!`,{fn:()=>{ E.plan='run'; },then:[xl('narr',`You run. The chest hops after you for a little bit, clacking. Then it gets bored and sits down like a normal chest.`,`You run! The chest hops after you. Then it stops.`)]})
    ])],
  fed:E=>[xl('narr',`The mimic burps. A pile of coins comes out with the burp. It looks very pleased with itself.`,`The mimic burps out coins. It looks happy.`)],
  win:E=>[xl('narr',`The mimic giggles, rolls over, and burps up its treasure. It was ticklish all along.`,`The mimic giggles and rolls over. It spits out treasure!`)],
  quit:E=>[xl('narr',`The mimic gets bored of the game and hops off into the bushes.`,`The mimic hops away.`)]
};
EVS.mimic2={title:S('The Chest Comes Back','The Chest Comes Back'),
  meet:E=>[
    xl('narr',`A treasure chest hops out of the bushes. You know this chest. And behind it hops a much smaller chest.`,`The hungry chest is back! And there is a tiny chest with it.`),
    xl('ev_mimic',`Grrmble! Grrrmble grmble.`,`Grrmble! Grmble.`),
    xl('narr',`The little one bounces up to you, opens its lid, and spits out a present. Then it hides behind its parent, very shy.`,`The tiny chest gives you a present. Then it hides. It is shy.`),
    xc('ash',`What do you say?`,`What do you say?`,[
      xo(`Thank you, little chest!`,`Thank you, little chest!`,{tone:'kind'}),
      xo(`Can I tickle it?`,`Can I tickle it?`,{then:[xl('narr',`The tiny mimic giggles so hard it falls over. The big one looks proud.`,`The tiny chest giggles and falls over.`)]})
    ])]
};
// ---------- Goat Stampede (Bea the goatherd)
EVS.goats={title:S('Goat Stampede!','Goat Stampede!'),
  call:()=>S(`My goats! Somebody stop my goats!`,`My goats! Stop my goats!`),
  meet:E=>[
    xl('ev_bea',`Somebody left the gate open, and now my goats are having the best day of their lives. Can you herd them back into the pen?`,`My goats ran out! Can you put them back in the pen?`),
    xl('ev_bea',`Walk toward them and they'll run away from you. So get behind them, and they'll run where you want. Mostly.`,`Walk behind the goats. They run away from you. Push them into the pen!`),
    xc('ash',`How will you do it?`,`How will you do it?`,[
      xo(`I'll chase them in!`,`I will chase them in!`,{tone:'brave',fn:()=>{ E.plan='herd'; }}),
      xo(`Duchess, you know goats. Help!`,`Duchess, help!`,{cond:()=>G.comp==='duchess',fn:()=>{ E.plan='herd'; E.d.duchess=true; },then:[xl('goat',`Meh.`,`Meh.`),xl('ev_bea',`Is that a goat helping round up goats? I have seen everything now.`,`A goat helping with goats? Wow.`)]}),
      xo(`ROAR at them!`,`ROAR at them!`,{fn:()=>{ E.plan='herd'; E.d.roar=true; },then:[xl('narr',`You give your biggest, scariest roar. The goats look at you. Then they all run in completely different directions. Oops.`,`You roar! The goats run every way. Oops.`)]})
    ])],
  win:E=>[xl('ev_bea',`All my goats, home again! You'd make a great goatherd. Here, have some goat cheese. It's very strong. It has opinions.`,`All my goats are home! Thank you! Have some cheese.`)],
  quit:E=>[xl('ev_bea',`That's enough goats for one day. I'll catch the rest with snacks. Thanks for trying, dragon.`,`That is okay. I will get the rest with snacks. Thanks!`)]
};
// ---------- The Hat-Swap Wizard (Quibble the Somewhat Great; he comes back for his hat)
EVS.wizard={title:S('The Hat-Swap Wizard','The Hat Wizard'),
  call:()=>S(`Hat swap! Hat swap! Any hats for swapping?`,`Hat swap! Who wants to swap hats?`),
  meet:E=>{
    const has=!!G.hat;
    return [
      xl('ev_quib',`Greetings! I am Quibble the Somewhat Great. Not the MOST great. Somewhat.`,`Hello! I am Quibble. I am a wizard. A pretty good one.`),
      xl('ev_quib',`I collect hats. Not to keep. To swap! A day in someone else's hat is a day full of new ideas.`,`I swap hats! A new hat gives you new ideas.`),
      has?xl('ev_quib',`That is a lovely hat you've got. Would you swap it for my wizard hat? Just for a day.`,`I like your hat. Will you swap with me for one day?`)
         :xl('ev_quib',`You aren't wearing a hat! Shocking. Would you like to wear mine for a day? I'll borrow your... worries. Give me all your worries.`,`You have no hat! Want to wear mine for a day?`),
      xc('ash',`Swap hats?`,`Swap hats?`,[
        xo(`Swap! Just for one day.`,`Swap!`,{fn:()=>{ E.plan='swap'; },then:[xl('narr',`Quibble plucks your ${has?'hat':'worries'} off with a flourish and plops his wizard hat on your head. It's warm and smells like old books.`,`Quibble puts his wizard hat on your head. It smells like books.`),xl('ev_quib',`Splendid! Now you look Somewhat Great too. I'll find you tomorrow. Wizards always find their hats.`,`Now you look like a wizard! I will find you tomorrow.`)]}),
        xo(`Show me a magic trick instead`,`Show me a magic trick`,{fn:()=>{ E.plan='trick'; },then:[xl('ev_quib',`A trick! Watch very closely. Closer. Not that close.`,`A trick! Watch closely!`),xl('narr',`He waves his staff. Flower petals rain down from nowhere. One lands on your nose. You feel light as a feather.`,`He waves his staff. Flowers fall from the sky! You feel light and happy.`)]}),
        xo(`No thanks. I like my head the way it is.`,`No thanks`,{then:[xl('ev_quib',`Wise. Very wise. Somewhat wise.`,`Okay! Very wise.`)]})
      ])];
  }
};
EVS.wizard2={title:S('The Wizard Comes Back','The Wizard Comes Back'),
  call:()=>S(`Ah HA! There's my hat. And there's my dragon.`,`There is my hat!`),
  meet:E=>{
    const old=E.d.old;
    return [
      xl('ev_quib',`Told you wizards always find their hats. Did you have any new ideas? Wearing a wizard hat gives you at least three.`,`I found you! Did the hat give you new ideas?`),
      xc('ash',`Any new ideas?`,`Any new ideas?`,[
        xo(`I thought about pancakes a lot`,`I thought about pancakes`,{then:[xl('ev_quib',`Pancakes! A classic wizard idea. You're a natural.`,`Pancakes! A great idea.`)]}),
        xo(`I wondered how many stars there are`,`How many stars are there?`,{then:[xl('ev_quib',`Eleven thousand and twelve. Possibly. I made that number up, but it sounded right.`,`Lots! I made up a number.`)]}),
        xo(`Not really`,`Not really`,{then:[xl('ev_quib',`That's an idea too. A very restful one.`,`That is okay too.`)]})]),
      xl('ev_quib',old&&old!=='none'?`Here's your own hat back. And you know what? Keep the wizard hat too. It looked better on you. Don't tell it I said that.`:`Here are your worries back. I've polished them. They're much smaller now. And keep the wizard hat. It looked better on you.`,
        old&&old!=='none'?`Here is your hat back. Keep the wizard hat too!`:`Here are your worries. They are smaller now. Keep the wizard hat!`),
      xdo(()=>evWizardReturn(E)),
      xl('ev_quib',`Farewell, Somewhat Great Ash! Farewell!`,`Bye, Ash!`)];
  }
};
// ---------- The Whispering Fog (follow the lights to a hidden grove)
EVS.fog={title:S('The Whispering Fog','The Whispering Fog'),
  start:E=>[
    xl('narr',`The fog whispers, very softly: "Follow the lights, dragon child. We have something to show you."`,`The fog whispers: "Follow the lights. We want to show you something."`),
    xc('ash',`Follow the whispers?`,`Follow the lights?`,[
      xo(`Follow the lights`,`Follow the lights`,{fn:()=>{ E.plan='follow'; }}),
      xo(`Nope. Spooky fog. No thank you.`,`No. Too spooky!`,{fn:()=>{ E.plan='no'; },then:[xl('narr',`The fog sighs, a little hurt, and drifts away.`,`The fog sighs and floats away.`)]})
    ])],
  grove:E=>{
    const s=nearSecret(player.x,player.y,2600,'fog');
    return [
      xl('narr',`The fog opens like a curtain. Behind it is a tiny grove nobody has seen in a hundred years. Glowing flowers. A spring as clear as glass.`,`The fog opens. You find a secret garden with glowing flowers and a clear pool.`),
      xl('ev_fog',`We are the fog. We only show this place to kind hearts. Choose one gift, dragon child.`,`We are the fog. Pick one present.`),
      xc('ash',`Choose one gift`,`Pick one present`,[
        xo(`Drink from the spring`,`Drink from the pool`,{fn:()=>evGive({maxhp:5,heal:true,stamina:true}),then:[xl('narr',`The water tastes like rain and starlight. Your scales feel brand new. (+5 max health)`,`The water tastes like rain. You feel brand new! (+5 health)`)]}),
        xo(`Pick a glowing flower for Mom`,`Pick a flower for Mom`,{tone:'kind',fn:()=>{ G.flags.ev_flower=true; },then:[xl('narr',`You pick one glowing flower. It hums a tiny tune in your claws. Mom is going to love it.`,`You pick a glowing flower for Mom. It hums a little song.`)]}),
        xo(`Ask the fog where a secret is hidden`,`Ask where a secret is`,{fn:()=>{ if(s) fogReveal(s.x,s.y,500); },then:[s?xl('ev_fog',`Something hidden waits to the ${dirWord(player.x,player.y,s.x,s.y)} of here. Not too far. Go and look.`,`A secret is ${dirWord(player.x,player.y,s.x,s.y)} of here. Go look!`):xl('ev_fog',`You have found every secret near here already. Even the fog is impressed.`,`You found all the secrets here already!`)]})
      ])];
  }
};
// ---------- The Lost Drakeling (part two: it grows up and visits)
EVS.drake={title:S('The Lost Drakeling','The Lost Baby Dragon'),
  meet:E=>[
    xl('narr',`A baby drakeling sits all alone, crying tiny puffs of smoke. It looks at your horns and decides you might be family.`,`A baby dragon is all alone. It is crying little puffs of smoke.`),
    G.pip?xl('narr',`Pip sniffs the baby. The baby sniffs Pip. They are best friends now. That was fast.`,`Pip sniffs the baby. Now they are friends!`):xl('narr',`It peeps at you. Hopefully.`,`It peeps at you.`),
    xc('ash',`What will you do?`,`What will you do?`,[
      xo(`Come on, little one. Let's find your mom.`,`Let's find your mom!`,{tone:'kind',fn:()=>{ E.plan='lead'; },then:[xl('narr',`The baby hops after you, peeping. Somewhere nearby, a big drakeling must be looking for it. Look for her nest.`,`The baby follows you. Find its mom's nest!`)]}),
      xo(`Pip, can you smell where the nest is?`,`Pip, find the nest!`,{cond:()=>!!G.pip,fn:()=>{ E.plan='lead'; E.d.pip=true; },then:[xl('pip',`Mip! Mip mip!`,`Mip!`),xl('narr',`Pip zips off. Follow Pip! The baby hops after you.`,`Pip flies off. Follow Pip!`)]}),
      xo(`Share a fish with it first`,`Give it a fish`,{cond:()=>(G.items.fish||0)>0,fn:()=>{ takeItems({fish:1}); E.plan='lead'; E.d.fed=true; },then:[xl('narr',`The baby gobbles the fish in one bite and does a happy wiggle. Now it would follow you anywhere. Let's find its mom.`,`It eats the fish and wiggles. Now let's find its mom!`)]})
    ])],
  win:E=>[
    xl('narr',`The big drakeling swoops down and wraps her wings around her baby. Then she looks at you for a long, long moment.`,`The mum dragon hugs her baby with her wings. She looks at you.`),
    xl('narr',`She drops something shiny at your feet. A dragon's way of saying thank you.`,`She drops a shiny present at your feet. That means thank you.`),
    xc('ash',`Say goodbye?`,`Say goodbye?`,[
      xo(`Wave goodbye`,`Wave goodbye`),
      xo(`Ask if you can pet the baby`,`Can I pet the baby?`,{tone:'kind',then:[xl('narr',`The mum thinks about it. Then she nudges the baby forward. It is very warm and very soft, and it sneezes on you.`,`The mum says yes. The baby is warm and soft. It sneezes on you.`)]})
    ])],
  quit:E=>[xl('narr',`The baby drakeling hears a call from far away and flies off toward it. It knows the way after all.`,`The baby hears its mum and flies off to her.`)]
};
EVS.drake2={title:S('A Visit from an Old Friend','A Visit from a Friend'),
  meet:E=>[
    xl('narr',`A young drakeling lands right in front of you with a THUMP. It's twice as big as when you met it. It's also twice as loud.`,`A young dragon lands with a THUMP! It is the baby you helped. It got big!`),
    xl('ev_drake',`Peep! PEEP!`,`Peep! PEEP!`),
    xl('narr',`It drops a warm, glowing pebble in your claws, licks your face, and flies off to tell its whole family that it did it. It gave the present. All by itself.`,`It gives you a warm glowing stone. It licks your face. Then it flies home.`),
    xl('narr',`The pebble sinks into your scales like a little sun. (A blessing!)`,`The stone glows inside you. (A blessing!)`)]
};
// ---------- The Fishing Contest (Barnacle Bess)
EVS.fish={title:S('The Fishing Contest','The Fishing Contest'),
  call:()=>S(`Ahoy! Any brave fishers about?`,`Hello! Who wants a fishing contest?`),
  meet:E=>[
    xl('ev_bess',`Ahoy, dragon! I'm Barnacle Bess, champion of every fishing contest within shouting distance. Want a contest?`,`Hi! I am Barnacle Bess. I win every fishing contest. Want to try?`),
    xl('ev_bess',`First to catch two fish wins. Winner gets my Golden Bobber. Loser says "Bess is the best" three times.`,`First to catch two fish wins! The winner gets my Golden Bobber.`),
    !G.items.rod?xl('ev_bess',`No rod? Here, borrow my spare. Don't let it get away. It bites.`,`No fishing rod? You can use my spare one.`):xl('ev_bess',`I see you've got a rod. Good. That makes it fair. Mostly.`,`You have a rod. Good!`),
    xc('ash',`Take the challenge?`,`Try the contest?`,[
      xo(`You're on!`,`Yes!`,{tone:'brave',fn:()=>{ E.plan='fish'; },then:[xl('ev_bess',`Ready, set, FISH! Stand by the water and press the use button when you see a splash.`,`Go! Fish by the water. Press the button when it splashes!`)]}),
      xo(`Maybe another time`,`Maybe later`,{fn:()=>{ E.plan='no'; },then:[xl('ev_bess',`Scared of losing? Ha! Wise dragon.`,`Okay! Bye!`)]})
    ])],
  win:E=>[
    xl('ev_bess',`Two fish! Well, barnacles. You beat Barnacle Bess. Nobody beats Barnacle Bess.`,`You won! Nobody ever beats me!`),
    xl('ev_bess',`Here's the Golden Bobber. With this on your line, fish bite faster. They can't resist anything shiny.`,`Here is the Golden Bobber. Fish will bite faster now.`)],
  lose:E=>[
    xl('ev_bess',`Ha HA! Two for Bess! Go on, then. Say it.`,`I win! Now say it!`),
    xc('ash',`Say it?`,`Say it?`,[
      xo(`Bess is the best. Bess is the best. Bess is the best.`,`Bess is the best! (three times)`,{then:[xl('ev_bess',`Music to my barnacles. Here, a fish for a good sport.`,`Ha! You are a good sport. Have a fish.`)]}),
      xo(`Never!`,`Never!`,{then:[xl('ev_bess',`Ha! I like you. Here, a fish anyway. Come back and try again sometime.`,`Ha! I like you. Have a fish anyway.`)]})
    ])]
};
// ---------- The Show Must Go On (the Marvelous Mudlarks need a stand-in dragon)
EVS.show={title:S('The Show Must Go On','The Dragon Show'),
  call:()=>S(`Is there a dragon in the house? Any dragon at all?`,`We need a dragon! Any dragon!`),
  meet:E=>[
    xl('ev_fizz',`A DRAGON! Oh, joy of joys! I'm Madame Fizzwick of the Marvelous Mudlarks. Our dragon costume ripped right down the middle, and the show starts NOW.`,`A dragon! Hooray! Our dragon costume ripped. The show starts now!`),
    xl('ev_fizz',`Would you play the dragon? You don't have to act much. Just be a dragon. You're very good at that.`,`Will you play the dragon in our show?`),
    xc('ash',`Be the dragon?`,`Be the dragon?`,[
      xo(`I was born for this!`,`Yes! I was born for this!`,{tone:'brave',fn:()=>{ E.plan='show'; }}),
      xo(`Stage fright! Sorry!`,`I am too shy. Sorry!`,{fn:()=>{ E.plan='no'; },then:[xl('ev_fizz',`Alas! The show must go on, without a dragon. It's going to be a very confusing show.`,`Oh no! The show will be very silly with no dragon.`)]})
    ])],
  perform:E=>[
    xl('narr',`The curtain swishes open. A small crowd claps politely. Somebody's goat eats a programme.`,`The curtain opens. People clap. A goat eats a paper.`),
    xl('ev_clank',`Halt, fearsome dragon! I, Sir Clanksworth, have come to... um... what's my line?`,`Stop, scary dragon! I am Sir Clanksworth! I am here to... um... I forgot.`),
    xc('ash',`Your line, dragon!`,`Your turn! What does the dragon do?`,[
      xo(`ROAR! (very scary)`,`ROAR!`,{tone:'brave',fn:()=>{ E.d.cheer=(E.d.cheer||0)+2; },then:[xl('narr',`The crowd gasps. Sir Clanksworth drops his wooden sword. A child in the front row says "AGAIN!"`,`Everyone gasps! A kid yells "Again!"`)]}),
      xo(`Bow politely`,`Bow politely`,{fn:()=>{ E.d.cheer=(E.d.cheer||0)+2; },then:[xl('narr',`You bow. The crowd laughs. "A polite dragon! How modern!" says a lady with a big hat.`,`You bow. Everyone laughs. "A polite dragon!"`)]}),
      xo(`Tell a joke`,`Tell a joke`,{fn:()=>{ E.d.cheer=(E.d.cheer||0)+3; },then:[xl('ash',`Why don't dragons ever win at hide and seek? Because they always smoke out the competition!`,`Why are dragons bad at hide and seek? Their smoke gives them away!`),xl('narr',`The crowd groans. Then they laugh. Then they groan again. That's a success.`,`Everyone groans. Then they laugh!`)]})
    ]),
    xl('ev_fizz',`And now, the BIG FINISH! Light the stage torches, mighty dragon!`,`Now the big finish! Light the torches with your fire!`)],
  win:E=>[
    xl('narr',`WHOOSH! The torches blaze up. The crowd goes wild. A rabbit in the front row faints from joy.`,`WHOOSH! The torches light up. Everyone cheers!`),
    xl('ev_fizz',`Bravo! Bravissimo! You were magnificent. Here's your share of the coins, star of the stage!`,`You were amazing! Here are your coins!`)],
  quit:E=>[xl('ev_fizz',`The torches went out and so did the audience. Ah well. Every show is practice for the next one.`,`The audience went home. Oh well. Next time!`)]
};
// ---------- Snowball Ambush (three kids in the Frostpine snow)
EVS.snow={title:S('Snowball Ambush!','Snowball Fight!'),
  call:()=>S(`SNOWBALL AMBUSH! FIRE!`,`SNOWBALL FIGHT! THROW!`),
  win:E=>[
    xl('ev_juno',`No fair! You melted our forts! ...That was the best snowball fight EVER.`,`You melted our snow forts! That was so fun!`),
    xl('ev_pim',`Can we do it again tomorrow? We'll build them thicker. And taller. And with a moat.`,`Can we play again tomorrow? We will build bigger forts!`),
    xc('ash',`What do you say?`,`What do you say?`,[
      xo(`Bring it on!`,`Bring it on!`,{tone:'brave',then:[xl('ev_juno',`Ha! Here, have some hot cocoa. Fighters need cocoa.`,`Ha! Have some hot cocoa.`)]}),
      xo(`Next time I'm on your team`,`Next time I am on your team`,{tone:'kind',then:[xl('ev_pim',`A DRAGON on our team? We'd win every snowball fight forever! Here, have our cocoa.`,`A dragon on our team? Yes! Have some cocoa.`)]})
    ])]
};
// ---------- The Runaway Cheese (Cheddar Chuck)
EVS.cheese={title:S('The Runaway Cheese','The Runaway Cheese'),
  call:()=>S(`STOP THAT CHEESE!`,`STOP THAT CHEESE!`),
  push:E=>[xl('narr',`You stop the giant wheel of cheese with both claws. It's heavy, and it smells amazing. Roll it back to its owner.`,`You stop the big cheese! Roll it back to the cheese man.`)],
  win:E=>[
    xl('ev_chuck',`My Great Wheel! Thirty years of aging! It was going to win the Brindlecross Fair!`,`My big cheese! Thank you!`),
    xl('ev_chuck',`Take a slice. No, take two slices. You saved my whole life's work. And my lunch.`,`Have some cheese. You saved my lunch!`)],
  quit:E=>[xl('ev_chuck',`It rolled right into a bush. Now it's bush cheese. Some people pay extra for bush cheese. Probably.`,`It rolled into a bush. Oh well. Bush cheese!`)]
};
// ---------- The Sleepy Bear (a picnic under a snoring bear)
EVS.bear={title:S('The Sleepy Bear','The Sleepy Bear'),
  call:()=>S(`Psst! Over here! Quietly!`,`Psst! Over here!`),
  meet:E=>[
    xl('ev_pud',`Psst! A bear fell asleep on our picnic. With our sandwiches under it. Can you get the basket back without waking it up?`,`Shh! A bear is asleep on our picnic. Can you get our basket back?`),
    xc('ash',`How?`,`How?`,[
      xo(`Tiptoe in and grab the basket`,`Sneak in and grab it`,{fn:()=>{ E.plan='sneak'; },then:[xl('ev_pud',`Walk slowly. No running, no rolling, no jumping. Bears hear EVERYTHING.`,`Walk slowly. No running! No jumping!`)]}),
      xo(`Offer the bear some honey`,`Give the bear honey`,{cond:()=>(G.items.honey||0)>0,fn:()=>{ takeItems({honey:1}); E.plan='honey'; },then:[xl('narr',`You hold out the honey. The bear sniffs in its sleep, sits up, takes the jar very politely, and wanders off into the trees, happy as can be.`,`The bear sniffs the honey. It takes the jar and walks away, happy.`)]}),
      xo(`Sing it a lullaby`,`Sing a lullaby`,{tone:'kind',fn:()=>{ E.plan='lullaby'; },then:[xl('ash',`Hush, little bear, don't you wake. I'll sing you a song for goodness sake...`,`Hush, little bear, don't wake up...`),xl('narr',`The bear smiles in its sleep, rolls over, hugs a bush, and keeps on snoring. The basket is free!`,`The bear smiles and rolls over. The basket is free!`)]})
    ])],
  woke:E=>[xl('narr',`The bear opens one eye. "Hrrrmph." It gets up, yawns the biggest yawn you have ever seen, picks up ONE sandwich, and lumbers off to find a quieter spot.`,`The bear wakes up! It yawns, takes one sandwich, and walks away.`)],
  win:E=>[xl('ev_pud',`Our picnic! Slightly squished, but ours. Have a sandwich, Ash. Have two. We have SO many sandwiches.`,`Our picnic! Thank you! Have a sandwich.`)]
};
// ---------- Firefly Night (Lumi and her jar)
EVS.flies={title:S('Firefly Night','Firefly Night'),
  call:()=>S(`Here, fireflies! Here, little lights!`,`Come here, little fireflies!`),
  meet:E=>[
    xl('ev_lumi',`I'm trying to catch fireflies for my jar, but they're too fast. Can you help? Just walk into them. Gently.`,`Can you help me catch fireflies? Just walk into them.`),
    xc('ash',`Help Lumi?`,`Help Lumi?`,[
      xo(`Let's catch them!`,`Let's catch them!`,{fn:()=>{ E.plan='catch'; }}),
      xo(`Not tonight, sorry`,`Not now`,{fn:()=>{ E.plan='no'; },then:[xl('ev_lumi',`Okay. They're pretty even if you don't catch them.`,`Okay. They are pretty anyway.`)]})
    ])],
  done:E=>[
    xl('ev_lumi',`Five fireflies! Look how bright the jar is!`,`Five fireflies! The jar is so bright!`),
    xc('ash',`What now?`,`What now?`,[
      xo(`Keep them in the jar`,`Keep them`,{fn:()=>{ E.d.keep=true; evFliesReward(E,true); },then:()=>[G.items.lantern&&!E.d.gotLantern?xl('ev_lumi',`I'll put them on my windowsill. Here, take this for helping.`,`I will keep them by my window. Here, this is for you.`):xl('ev_lumi',`You know what? You keep the jar. It lights up caves, too. My big brother took it in a cave once and found a frog.`,`You keep the jar! It lights up dark caves.`)]}),
      xo(`Let them go free`,`Let them go`,{tone:'kind',fn:()=>{ E.d.keep=false; evFliesReward(E,false); },then:[xl('narr',`Lumi opens the jar. The fireflies swirl up into the dark, and for a second they make the shape of a heart.`,`The fireflies fly out. They make a heart shape in the sky!`),xl('ev_lumi',`That was better than keeping them. Thank you, Ash.`,`That was better. Thank you!`)]})
    ])],
  quit:E=>[xl('ev_lumi',`They all flew away. That's okay. I'll try again tomorrow night.`,`They flew away. I will try again tomorrow.`)]
};
// ---------- Trouble on the Road (Granny Thimble and some leftover raiders)
EVS.raid={title:S('Trouble on the Road','Trouble on the Road'),
  call:()=>S(`Shoo! Shoo, you scaly ruffians!`,`Go away, you bad lizards!`),
  win:E=>[
    xl('ev_thimble',`My hero! Those rascals wanted my knitting. My KNITTING. Can you imagine?`,`My hero! They wanted my knitting!`),
    xl('ev_thimble',`Here. I knitted this scarf for my grandson, but he's a goose farmer, and geese don't wear scarves. You have it. It's very warm. (+5 max health)`,`Here, take this warm scarf. (+5 health)`),
    xc('ash',`What do you say?`,`What do you say?`,[
      xo(`Thank you, Granny!`,`Thank you!`,{tone:'kind'}),
      xo(`Want me to walk you home?`,`Can I walk you home?`,{then:[xl('ev_thimble',`Oh, I'll be fine. I've got my umbrella. It's VERY pointy.`,`I am fine. My umbrella is very pointy!`)]})
    ])]
};
// ---------- The Frog Choir (Lord Croakington)
EVS.frogs={title:S('The Frog Choir','The Frog Choir'),
  call:()=>S(`Ribbit! Order! Order in the choir!`,`Ribbit! Quiet, choir!`),
  meet:E=>{
    const sc=()=>E.d.score=(E.d.score||0);
    return [
      xl('ev_croak',`Ah! A conductor! At last! I am Lord Croakington. My choir sings at the Swamp Song Festival tonight, and our conductor got eaten. By a heron. We have not forgiven the heron.`,`Hello! I am Lord Croakington. My frog choir needs a leader. Will you help?`),
      xl('ev_croak',`Wave your claws and tell us how to sing. We'll do whatever you say. Within reason. We are frogs.`,`Tell us how to sing!`),
      xc('ash',`First verse. How should they sing?`,`First song part. How should they sing?`,[
        xo(`Slow and dreamy`,`Slow and dreamy`,{fn:()=>{ sc(); E.d.score+=1; E.d.v1='slow'; },then:[xl('narr',`Rrrribbit... rrrribbit... The frogs sway like reeds in the wind. One falls asleep.`,`Ribbit... ribbit... The frogs sing slowly. One falls asleep.`)]}),
        xo(`Fast and bouncy`,`Fast and bouncy`,{fn:()=>{ sc(); E.d.score+=2; E.d.v1='fast'; },then:[xl('narr',`Ribbit-ribbit-ribbit-RIBBIT! The frogs bounce up and down on their lily pads. Water goes everywhere.`,`Ribbit-ribbit-ribbit! The frogs bounce. Splash!`)]}),
        xo(`VERY LOUD`,`VERY LOUD`,{fn:()=>{ sc(); E.d.score+=1; E.d.v1='loud'; },then:[xl('narr',`RRRRIBBIT! A bird falls out of a tree in surprise. Lord Croakington looks thrilled.`,`RIBBIT! So loud! A bird falls out of a tree.`)]})
      ]),
      xc('ash',`Second verse!`,`Second part!`,[
        xo(`Everyone hum`,`Everyone hum`,{fn:()=>{ E.d.score+=2; },then:[xl('narr',`Mmmmmmm. The whole swamp hums along. Even the mud seems to be humming.`,`Hmmmmm. The whole swamp hums.`)]}),
        xo(`Just the smallest frog, alone`,`Just the tiny frog`,{tone:'kind',fn:()=>{ E.d.score+=3; },then:[xl('narr',`The tiniest frog steps forward and sings one high, perfect "ribbit." The whole choir sniffs. So do you.`,`The tiny frog sings one perfect "ribbit". The frogs sniff.`)]}),
        xo(`Sing it backwards`,`Sing it backwards`,{fn:()=>{ E.d.score+=1; },then:[xl('narr',`Tibbir. Tibbir. It sounds terrible. The frogs love it.`,`Tibbir! Tibbir! It sounds silly. The frogs love it.`)]})
      ]),
      xc('ash',`The grand finale!`,`The big ending!`,[
        xo(`One giant BOING all together`,`One big BOING together`,{fn:()=>{ E.d.score+=2; },then:[xl('narr',`All the frogs jump at once. BOING! They land perfectly. Mostly. One lands on Lord Croakington.`,`All the frogs jump at once. BOING!`)]}),
        xo(`A long, fading ribbit into the night`,`A long, quiet ribbit`,{fn:()=>{ E.d.score+=3; },then:[xl('narr',`Rrrriiiibbbiiiit... The last note floats out over the water and fades into the stars.`,`Ribbit... The song floats away over the water.`)]}),
        xo(`You sing too!`,`You sing too!`,{tone:'brave',fn:()=>{ E.d.score+=2; },then:[xl('ash',`RIBBIT!`,`RIBBIT!`),xl('narr',`Your ribbit comes out with a little puff of fire. The frogs are deeply impressed.`,`Your ribbit has a little fire in it. The frogs love it!`)]})
      ]),
      {who:'ev_croak',text:()=>E.d.score>=7?S(`MAGNIFICENT! The best performance in two hundred years of frog history! Take this, maestro. It's a lucky frog coin. We found it in the mud.`,`Amazing! The best frog song ever! Take this lucky coin!`)
        :S(`Well! That was certainly a song. A croaking good effort, maestro. Take this, for your trouble.`,`Good job! Take this.`)}
    ];
  }
};

// ================= Tikka: a young kobold who ran away from the raiders to become a baker
// Meetings: tk1 in the woods (raiders' patrol), tk2 by the lake (her oven), tk3 on the Ashen Road (in disguise),
// tk4 the runaways (where do they live?), tk5 before the gate (will she come?), then the last fight.
// Flags: tk_n meetings done, tk_trust, tk_promise, tk_home ('baker','farm','moss'), tk_come ('yes','home'), tk_helped.
const TKS={};
const tkTrust=n=>{ G.flags.tk_trust=(G.flags.tk_trust||0)+n; };
TKS.tk1={title:S('A Kobold in the Bushes','A Kobold in the Bushes'),
  call:()=>S(`(The bush is shaking. And sniffling.)`,`(The bush is shaking.)`),
  meet:E=>[
    xl('narr',`You part the leaves. Inside the bush is a very small kobold, hugging a very large loaf of bread.`,`You look in the bush. A little kobold is hiding there. She is hugging a big loaf of bread.`),
    xl('ev_tikka',`EEP! Please don't roar at me! I'm not a raider! Well. I was. For two days. I was very bad at it.`,`Eek! Please don't roar at me! I am not a bad kobold. Not anymore!`),
    xc('ash',`What do you say?`,`What do you say?`,[
      xo(`I won't hurt you. Are you okay?`,`I won't hurt you. Are you okay?`,{tone:'kind',fn:()=>tkTrust(1),then:[xl('ev_tikka',`You... you're not going to eat me? Everyone said dragons eat kobolds. Like popcorn.`,`You won't eat me? Everyone said dragons eat kobolds!`),xl('ash',`I mostly eat pancakes.`,`I mostly eat pancakes.`)]}),
      xo(`You raided my village! Explain yourself.`,`You were in the raid! Why?`,{tone:'brave',then:[xl('ev_tikka',`I know! I'm sorry! They made me carry spears. I don't LIKE spears. They're pointy at the wrong end. Both ends.`,`I am sorry! They made me carry spears. I don't like spears!`)]})
    ]),
    xl('ev_tikka',`I'm Tikka. I ran away from Grizzlefang's camp. They wanted me to carry spears, and I wanted to carry bread. I found this loaf in the bakery during the raid. I didn't steal it. I'm... borrowing it. Forever.`,`I am Tikka. I ran away from the kobold camp. I want to bake bread, not fight.`),
    xl('narr',`Twigs snap. Kobold voices, close by: "Spear-carrier! Come out! Grizzlefang wants his spears carried!"`,`Snap! Kobolds are coming! "Tikka! Come back!"`),
    xl('ev_tikka',`Oh no oh no oh no. That's my old patrol.`,`Oh no! It's the kobold soldiers!`),
    xc('ash',`What will you do?`,`What will you do?`,[
      xo(`Stand in front of her and fight`,`Protect her and fight!`,{tone:'brave',fn:()=>{ E.plan='fight'; tkTrust(1); },then:[xl('ash',`Stay behind me, Tikka.`,`Stay behind me, Tikka.`)]}),
      xo(`Hide her and point the patrol the wrong way`,`Hide her. Trick the soldiers.`,{fn:()=>{ E.plan='trick'; },then:[
        xl('ash',`(loudly) Oh, a little kobold with bread? She went THAT way. Toward the big scary river. Very fast.`,`(loud) The little kobold? She ran THAT way!`),
        xl('narr',`The patrol thunders off toward the river. Tikka peeks out of the bush, amazed.`,`The soldiers run away the wrong way! Tikka peeks out.`)]})
    ])],
  bye:E=>[
    xl('ev_tikka',`You... you protected me. Nobody ever protected me before. Except my little brother Tock, once, from a goose.`,`You helped me! Nobody ever helped me before.`),
    xc('ev_tikka',`Where should I go now?`,`Where should I go?`,[
      xo(`East, to Brindlecross. People there love bread.`,`Go to Brindlecross. People there like bread.`,{tone:'kind',fn:()=>tkTrust(1),then:[xl('ev_tikka',`Bread people! My favourite kind of people. Thank you, dragon. I won't forget you.`,`Bread people! Thank you, dragon!`)]}),
      xo(`Anywhere safe. Just stay away from raiders.`,`Somewhere safe.`,{then:[xl('ev_tikka',`Safe. Right. I can do safe. Probably. Thank you, dragon.`,`Okay. Somewhere safe. Thank you!`)]})
    ]),
    xl('narr',`Tikka scurries off into the trees, hugging her loaf. She looks back once and waves.`,`Tikka runs into the trees. She waves goodbye.`)]
};
TKS.tk2={title:S('The Oven That Would Not Light','Tikka Bakes Bread'),
  call:()=>S(`Come ON, you silly oven! Light!`,`Come on, oven! Light up!`),
  meet:E=>[
    xl('ev_tikka',`Dragon! It's you! Look, I built an oven! Out of rocks! I've been trying to light it all morning, but kobolds can't breathe fire. We can only breathe... regular.`,`Dragon! I made an oven out of rocks! But I can't light it. Kobolds can't make fire.`),
    G.flags.tk_trust>=2?xl('ev_tikka',`I've been practicing my bread every day since you saved me. Look how lumpy it is! Lumpy means love.`,`I practiced every day! My bread is lumpy. Lumpy means love!`):xl('ev_tikka',`I made it all the way here by myself. I only got lost four times.`,`I walked here all by myself!`),
    xc('ev_tikka',`Could you light it? Gently?`,`Can you light it? Gently?`,[
      xo(`Sure! Stand back.`,`Sure! Stand back.`,{fn:()=>{ E.plan='light'; },then:[xl('ev_tikka',`Gently! Like a birthday candle. Not like a volcano.`,`Gently! Like a candle!`)]})
    ])],
  bake:E=>[
    E.d.burnt?xl('narr',`Whoosh! The oven roars. Maybe a little too much. The bread comes out black on one side and perfect on the other.`,`Whoosh! Too much fire! The bread is black on one side.`)
      :xl('narr',`The oven glows a soft orange. Soon the whole lakeshore smells like warm bread.`,`The oven glows. Soon it smells like warm bread.`),
    xl('ev_tikka',E.d.burnt?`It's... half bread and half charcoal. That's TWO foods! You're a genius.`:`It worked! My first real bread! It's lumpy and lovely and it's MINE.`,E.d.burnt?`It is half burnt. That is okay!`:`It worked! My first real bread!`),
    xc('ev_tikka',`Here, the first bun is for you. What will you do with it?`,`Here is the first bun. For you!`,[
      xo(`Eat it right now`,`Eat it now`,{fn:()=>{ G.flags.tk_bun='ate'; evGive({heal:true}); },then:[xl('narr',`It's crunchy. In a good way. Mostly. Your health fills right up.`,`Crunchy! Yum. You feel all better.`)]}),
      xo(`Save it for Bertram the baker`,`Save it for Bertram the baker`,{tone:'kind',fn:()=>{ G.flags.tk_bun='bertram'; tkTrust(1); },then:[xl('ev_tikka',`For a REAL baker? He'll probably hate it. Do you think he'll hate it? Don't tell me.`,`For a real baker? Wow! I hope he likes it.`)]})
    ]),
    xc('ash',`What do you tell her?`,`What do you tell her?`,[
      xo(`You should open a bakery one day`,`You should have a bakery!`,{tone:'kind',fn:()=>{ tkTrust(1); G.flags.tk_dream=true; },then:[xl('ev_tikka',`A bakery. With a sign. "Tikka's Lumpy Buns." Oh. Oh, I like that a lot.`,`A bakery! "Tikka's Lumpy Buns." I love it!`)]}),
      xo(`Maybe stick to small fires`,`Maybe use small fires`,{then:[xl('ev_tikka',`Small fires. Got it. Writing that down. On a bun.`,`Small fires. Okay!`)]})
    ])]
};
TKS.tk3={title:S('A Robe Three Sizes Too Big','A Robe Too Big'),
  call:()=>S(`(A very short cultist is tripping over its own robe.)`,`(A tiny cultist keeps tripping on its robe.)`),
  meet:E=>[
    xl('narr',`A very short cultist in a very long purple robe trips, gets up, trips again, and lands in front of you. A familiar snout pokes out of the hood.`,`A tiny cultist trips over its long robe. It is Tikka!`),
    xl('ev_tikka',`Shh! It's me! I'm in disguise! I sneaked into the Scaled Oath's camp to find my little brother, Tock. They took him to carry their lamp oil.`,`Shh! It's me, Tikka! I am in disguise. The bad cultists took my little brother Tock.`),
    xl('ev_tikka',`I heard them talking. High Priest Morrow keeps the Ash Ward cold with a big black candle. If you beat Morrow, the Oath falls apart, and Tock can come home.`,`If you beat their leader, Morrow, my brother can come home.`),
    xl('narr',`Two hooded cultists come up the road. "Recruit! Back to camp! Those lamps won't fill themselves!"`,`Two cultists come. "Hey, new kid! Come back to camp!"`),
    xl('ev_tikka',`Uh oh. They think I'm one of them. Ash, help!`,`Uh oh! Ash, help!`)],
  bye:E=>[
    xl('ev_tikka',`Phew. That was scary. But I wasn't scared. Okay, I was. My tail was shaking so hard I could have used it to stir soup.`,`Phew! That was scary. My tail was shaking!`),
    xc('ev_tikka',`Ash, when the Oath falls, Tock will be free. Right?`,`When the bad Oath is gone, Tock will be free. Right?`,[
      xo(`I promise. I'll make sure of it.`,`I promise.`,{tone:'kind',fn:()=>{ G.flags.tk_promise=true; tkTrust(1); },then:[xl('ev_tikka',`A dragon promise. That's the strongest kind. Thank you.`,`A dragon promise! Thank you!`)]}),
      xo(`Stay away from the Oath. It's too dangerous for you.`,`Stay away from them. It is too dangerous.`,{then:[xl('ev_tikka',`I know. But he's my brother. You'd do the same, wouldn't you?`,`I know. But he is my brother.`)]})
    ]),
    xl('narr',`Tikka gathers up her enormous robe and waddles away, carefully, not tripping. She trips.`,`Tikka walks away in her big robe. She trips. She gets up.`)]
};
TKS.tk4={title:S('The Runaways','The Runaways'),
  call:()=>S(`Ash! ASH! Over here! Look who it is!`,`Ash! Look who is here!`),
  meet:E=>{
    const L=[];
    if(G.flags.tk_promise) L.push(xl('ev_tikka',`You did it! You kept your promise! The Oath fell apart, and everybody ran away, and look! LOOK! It's Tock!`,`You kept your promise! The Oath is gone. Look! It's Tock!`));
    else L.push(xl('ev_tikka',`The Oath fell apart! Everybody ran away, and I found him! This is Tock, my little brother!`,`The Oath is gone! I found my brother Tock!`));
    L.push(xl('ev_tock',`Hi. Are you the dragon? Tikka talks about you ALL the time. She says you eat pancakes.`,`Hi! Are you the dragon? Tikka says you eat pancakes.`),
      xl('ev_tikka',`And these are Snib and Wiggle. They were lamp-oil carriers too. Now they're... nothing. We don't have anywhere to live.`,`This is Snib and Wiggle. We have no home now.`),
      xc('ev_tikka',`Where do you think we should go?`,`Where should we live?`,[
        xo(`Bertram's bakery in Emberhollow. He needs helpers.`,`Bertram's bakery in Emberhollow`,{fn:()=>{ G.flags.tk_home='baker'; },then:[xl('ev_tikka',`A real bakery? With real ovens? And a real baker who might hate my buns? YES.`,`A real bakery? YES!`)]}),
        xo(`Hollis Farm. There's room, and lots of turnips.`,`Hollis Farm`,{fn:()=>{ G.flags.tk_home='farm'; },then:[xl('ev_tikka',`A farm! Tock loves turnips. He loves them so much he talks to them.`,`A farm! Tock loves turnips!`)]}),
        xo(`Granny Moss in the Mirefen. She's very kind.`,`Granny Moss in the swamp`,{tone:'kind',fn:()=>{ G.flags.tk_home='moss'; },then:[xl('ev_tikka',`A swamp granny! Do you think she'll teach us potions? I'd like a potion that makes bread rise.`,`A swamp granny! Maybe she will teach us potions!`)]})
      ]),
      xc('ev_tock',`I'm really hungry.`,`I am really hungry.`,[
        xo(`Share a fish`,`Share a fish`,{cond:()=>(G.items.fish||0)>0,fn:()=>{ takeItems({fish:1}); tkTrust(1); },then:[xl('ev_tock',`FISH! You're the best dragon in the whole world.`,`A fish! You are the best dragon!`)]}),
        xo(`Share some honey`,`Share some honey`,{cond:()=>(G.items.honey||0)>0,fn:()=>{ takeItems({honey:1}); tkTrust(1); },then:[xl('ev_tock',`Honey! It's sticky! I love sticky!`,`Honey! Yum!`)]}),
        xo(`Here are some coins for food`,`Here are coins for food`,{cond:()=>(G.coins||0)>=10,fn:()=>{ G.coins-=10; tkTrust(1); },then:[xl('ev_tikka',`Ten coins! That's enough flour for a hundred lumpy buns. Thank you, Ash.`,`Ten coins! Thank you!`)]}),
        xo(`Hang on, it's not far now`,`It's not far now`,{then:[xl('ev_tikka',`We'll make it. Kobolds are tough. Hungry, but tough.`,`We will be okay.`)]})
      ]),
      xl('narr',`Four little kobolds march off down the road in a line, singing a song about bread. It's not a very good song. It is a very happy one.`,`The four little kobolds walk away singing a song about bread.`));
    return L;
  }
};
TKS.tk5={title:S(`Tikka's Promise`,`Tikka Wants to Help`),
  call:()=>S(`Ash! Wait! I'm coming with you!`,`Ash! Wait for me!`),
  meet:E=>[
    xl('narr',`Tikka marches up the road wearing a pot-lid for a shield, a backpack bigger than she is, and a very serious face.`,`Tikka walks up. She has a pot lid for a shield and a big backpack.`),
    xl('ev_tikka',`I heard you're going up the mountain. To the big scary grandpa dragon. I want to come.`,`You are going up the mountain to the scary dragon. I want to come!`),
    xl('ev_tikka',`I'm not brave. But you were brave for me, back in the bushes. So I want to be brave for you.`,`I am not brave. But you were brave for me. Now I want to be brave for you.`),
    xc('ash',`Will you let her come?`,`Can she come?`,[
      xo(`Yes. Stay close, and stay safe.`,`Yes. Stay close and stay safe.`,{tone:'brave',fn:()=>{ G.flags.tk_come='yes'; },then:[xl('ev_tikka',`YES! I'll wait by the summit stairs. When you need me most, I'll be there. With snacks.`,`Yes! I will come when you need me most. With snacks!`)]}),
      xo(`It's too dangerous. Light a lantern for me at home.`,`It is too dangerous. Light a lantern for me at home.`,{tone:'kind',fn:()=>{ G.flags.tk_come='home'; },then:[xl('ev_tikka',`A lantern. In the window. Every night until you come home. I promise. A kobold promise. That's the second strongest kind.`,`Okay. I will light a lantern in my window every night until you come home.`)]})
    ]),
    xl('ev_tikka',`Oh! I almost forgot. I made you a lucky bun. It's the least lumpy one I ever made.`,`I made you a lucky bun!`)]
};
TKS.fight=[
  S(`ASH! I brought snacks! And my brother! And a SPOON!`,`ASH! I brought snacks! And a spoon!`),
  S(`Catch, Ash! Fresh from the oven!`,`Catch, Ash! A bun!`),
  S(`Hey, big lizard! Leave my friend alone!`,`Hey, big dragon! Leave my friend alone!`),
  S(`One lumpy bun, coming up!`,`Here comes a bun!`),
  S(`You can do it, Ash! You're the bravest dragon ever!`,`You can do it, Ash!`)];
// one line in the epilogue (EPILOGUE_FMT calls this)
function evEpilogue(){
  if(!G||!G.flags) return null;
  const F=G.flags, n=F.tk_n||0; if(n<1) return null;
  const home=F.tk_home, helped=!!F.tk_helped;
  let t, s;
  if(home==='baker'){ t=`Tikka and the runaway kobolds baked at Crumb's Bakery. Her lumpy buns became famous across the valley${helped?', and she told everyone about the day she threw breakfast at a dragon':''}.`; s=`Tikka baked lumpy buns at the bakery. Everyone loved them.`; }
  else if(home==='farm'){ t=`Tikka and the runaways grew the biggest turnips Hollis Farm had ever seen. Tock still talks to them${helped?'. Tikka still talks about the battle on the mountain, mostly to the turnips':''}.`; s=`Tikka and her friends grew giant turnips at the farm.`; }
  else if(home==='moss'){ t=`Tikka learned potions from Granny Moss and invented a potion that makes bread rise. It also makes goats float. Nobody minds${helped?'. She keeps her battle spoon on the wall':''}.`; s=`Tikka learned potions from Granny Moss. One makes bread rise. One makes goats float!`; }
  else if(n>=2){ t=`Somewhere by Lake Mirrow, a small kobold named Tikka opened a tiny bakery called "Tikka's Lumpy Buns." The first bun of every batch was for Ash.`; s=`Tikka opened a little bakery. The first bun was always for Ash.`; }
  else { t=`Somewhere in the valley, a small kobold named Tikka baked a lumpy loaf of bread and smiled. She never carried a spear again.`; s=`A little kobold named Tikka baked bread. She never fought again.`; }
  if(F.tk_come==='home'&&!helped){ t+=` And every night Ash was on the mountain, a lantern burned in her window.`; s+=` She kept a lantern in her window for Ash.`; }
  return ['narr',S(t,s)];
}

// ================= dreams from long ago (resting at a shrine or an inn bed; one per chapter, each once)
// Each dream sets G.flags['dr_'+id] to the choice made; later dialogue (Mom, Yara, Wren, Pip, the next dreams) remembers it.
const DREAMS={
  spark:{stages:['lore','hollow'],title:S('The First Spark','The First Spark'),scene:'spark',
    lines:()=>[
      xl('narr',`You are very small. Your claws are small. Your horns are two little bumps. And the dragon curled up next to you is very, very big.`,`You are very small. A very big dragon sits next to you.`),
      xl('vor_old',`Breathe, Ember. From your belly, not your nose. A dragon's fire starts in the belly.`,`Breathe from your belly, Ember. That is where fire starts.`),
      xl('narr',`You huff. You puff. A single spark pops out of your mouth and floats in the air like a firefly.`,`You huff and puff. One little spark pops out!`),
      xc('vor_old',`There. Your first spark. Every dragon names their first spark. What will you call it?`,`Your first spark! What will you name it?`,[
        xo(`Twinkle`,`Twinkle`,{fn:()=>{ G.flags.dr_spark='twinkle'; },then:[xl('vor_old',`Twinkle. Hm. Small and bright. Like you.`,`Twinkle. Small and bright. Like you.`)]}),
        xo(`Mister Crackles`,`Mister Crackles`,{fn:()=>{ G.flags.dr_spark='crackles'; },then:[xl('vor_old',`Mister Crackles. That is a ridiculous name. ...I love it. Do not tell anyone I said that.`,`Mister Crackles? That is silly. I love it. Shh, don't tell.`)]}),
        xo(`Dad`,`Dad`,{tone:'kind',fn:()=>{ G.flags.dr_spark='dad'; },then:[xl('vor_old',`...You named it after me?`,`You named it after me?`),xl('narr',`The great dragon is quiet for a long time. Then he curls his tail around you, very carefully, as if you were made of glass.`,`The big dragon is quiet. Then he wraps his tail around you, very gently.`)]})
      ]),
      xl('narr',`Far below, in the valley, a little house lights its very first fire. Your father watches it with narrowed eyes.`,`Far below, a little house lights a fire. Your father watches it. He frowns.`),
      xl('narr',`"Mine," he whispers. But you are already asleep.`,`"Mine," he whispers. But you are asleep.`)]},
  flight:{stages:['warcamp'],title:S('Over the Valley','Flying Over the Valley'),scene:'flight',
    lines:()=>[
      xl('narr',`You're riding on your father's back, high over the valley. The wind is cold, and the stars are close enough to lick.`,`You ride on your father's back, high in the sky.`),
      xl('vor_old',`Look down, Ember. All of it. Every hill, every river, every little house. One day, all of it will be yours.`,`Look down, Ember. One day all of this will be yours.`),
      xc('ember_kid',`What do you say?`,`What do you say?`,[
        xo(`I don't want it to be mine. I want it to be happy.`,`I want it to be happy, not mine.`,{tone:'kind',fn:()=>{ G.flags.dr_flight='happy'; },then:[xl('vor_old',`Happy? Happiness is for small things, child. We are dragons.`,`Happy? Dragons don't need happy.`),xl('narr',`His voice is cold. But his wings curl a little closer around you, to keep off the wind.`,`His voice is cold. But his wings hold you close and warm.`)]}),
        xo(`Can we visit the little houses?`,`Can we visit the houses?`,{fn:()=>{ G.flags.dr_flight='visit'; },then:[xl('vor_old',`Visit? They would run from us. They always run.`,`They would run away. They always run.`),xl('narr',`He says it like it doesn't matter. You can tell that it does.`,`He says he does not care. But he does.`)]}),
        xo(`Faster! FASTER!`,`Faster! FASTER!`,{tone:'brave',fn:()=>{ G.flags.dr_flight='faster'; },then:[xl('narr',`Your father laughs, a sound like a landslide, and dives. The whole valley spins. You scream with joy.`,`Your father laughs and dives down. The valley spins! You scream with joy.`),xl('narr',`Years later, you will realize it was the last time you ever heard him laugh.`,`It is the last time you hear him laugh.`)]})
      ]),
      xl('narr',`Below, a man with a lantern looks up, sees you both, and runs inside. Your father's eyes go dark.`,`A man with a lantern sees you. He runs. Your father's eyes go dark.`)]},
  knock:{stages:['wren'],title:S('The Knock on the Door','The Knock on the Door'),scene:'knock',
    lines:()=>{
      const sp=G.flags.dr_spark, nm=sp==='crackles'?'Mister Crackles':sp==='dad'?'Dad':sp==='twinkle'?'Twinkle':null;
      const L=[
        xl('narr',`It's night. You're older now, almost grown. You walk down the mountain all alone, with your heart thumping like a drum.`,`It is night. You are bigger now. You walk down the mountain alone.`),
        xl('narr',`You knock on a little wooden door. It opens. A woman with a lantern looks up at your horns, and she does not run.`,`You knock on a door. A woman with a lantern opens it. She does not run.`),
        xl('iska',`So. You must be Ember. I've seen you up on the mountain, watching us.`,`You must be Ember. I have seen you watching us.`)];
      if(nm) L.push(xl('iska',`And who is this little spark following you around?`,`Who is this little spark?`),xl('ember_kid',`That's ${nm}. My first spark. He never goes out.`,`That is ${nm}. My first spark.`));
      L.push(xc('ember_kid',`What do you say to her?`,`What do you say?`,[
        xo(`I want to help.`,`I want to help.`,{tone:'brave',fn:()=>{ G.flags.dr_knock='help'; },then:[xl('ember_kid',`It's my father. He gets angrier every year. I'm scared of what he'll do to all of you.`,`My father gets angrier every year. I am scared for you.`),xl('iska',`Then come in. Bring your fire. I'll put the kettle on.`,`Then come in. I will make tea.`)]}),
        xo(`I'm scared.`,`I am scared.`,{tone:'kind',fn:()=>{ G.flags.dr_knock='scared'; },then:[xl('iska',`Of course you are. So am I, most days. Come in. I'll put the kettle on.`,`Of course. So am I. Come in.`)]}),
        xo(`Do you have any cake?`,`Do you have cake?`,{fn:()=>{ G.flags.dr_knock='cake'; },then:[xl('iska',`...I do, actually. Lantern cake. Come in, you funny thing.`,`I do! Lantern cake. Come in!`),xl('narr',`It's the best cake you have ever eaten. You decide, right then and there, to save the valley.`,`It is the best cake ever. You decide to save the valley.`)]})
      ]),
      xl('narr',`That night, for the first time ever, a dragon and a person sit at the same table and make a plan.`,`That night, a dragon and a person make a plan together.`));
      return L;
    }},
  five:{stages:['oath'],title:S('Five at the Fire','Five Friends at the Fire'),scene:'five',
    lines:()=>[
      xl('narr',`A campfire in the woods. Five people sit around it, and you. Iska is folding paper lanterns. A big man with a bigger hammer is telling a story much too loudly.`,`A campfire in the woods. Five friends sit with you.`),
      xl('bram',`...and THEN I said, "That's not a rock, that's my LUNCH!"`,`And I said, "That is not a rock! That is my LUNCH!"`),
      xl('tove',`Could someone please sit closer to the dragon, so that I can sit closer to the dragon? I'm f-f-freezing.`,`Can I sit by the dragon? I am so cold!`),
      xl('sedge',`I'm damp. I'm always damp. Don't worry about me.`,`I am wet. I am always wet.`),
      xl('oriel',`The drakes say the mountain is grumbling again. They're worried.`,`The dragons say the mountain is angry again.`),
      xl('iska',`Then we need five fires, one for each of us. And they'll need Ember's flame to light them.`,`We need five fires. Ember's flame will light them.`),
      xc('ember_kid',`What do you do?`,`What do you do?`,[
        xo(`Warm Tove's hands`,`Warm Tove's hands`,{tone:'kind',fn:()=>{ G.flags.dr_five='tove'; },then:[xl('narr',`You breathe a tiny warm breath on Tove's fingers. Tove makes a sound like a happy kettle.`,`You breathe warm air on Tove's hands. Tove is happy.`),xl('tove',`Warm hands. I'd forgotten what those were like.`,`Warm hands! I forgot how that feels.`)]}),
        xo(`Dry off Sedge`,`Dry off Sedge`,{fn:()=>{ G.flags.dr_five='sedge'; },then:[xl('narr',`You breathe gently on Sedge. Steam rises. For one whole minute, Sedge is dry.`,`You dry Sedge with warm air. Sedge is dry for one minute!`),xl('sedge',`Oh. Oh my. Is this what dry feels like? I don't like it. Thank you, though.`,`So this is dry? I don't like it. Thank you anyway!`)]}),
        xo(`Ask Bram for another story`,`Ask Bram for a story`,{fn:()=>{ G.flags.dr_five='bram'; },then:[xl('bram',`A STORY! Finally, someone with taste!`,`A story! Yes!`),xl('narr',`Bram's story is very long. It has three dragons in it, a goat, and no ending. Everybody laughs anyway.`,`Bram's story is long and silly. It has a goat. Everyone laughs.`)]}),
        xo(`Help Iska fold lanterns`,`Help Iska make lanterns`,{fn:()=>{ G.flags.dr_five='iska'; },then:[xl('iska',`Fold here. And here. There. Your first lantern.`,`Fold here and here. Your first lantern!`),xl('narr',`It's lopsided. Iska says it's perfect. She keeps it for a thousand years.`,`It is wonky. Iska says it is perfect. She keeps it forever.`)]})
      ]),
      xl('narr',`Five friends and a dragon, around one small fire. It's the warmest you have ever felt.`,`Five friends and a dragon by the fire. You feel so warm.`)]},
  split:{stages:['three'],title:S('The Longest Night','The Longest Night'),scene:'split',
    lines:()=>[
      xl('narr',`The longest night of the year. Snow is falling on the mountaintop. Your father sleeps, huge and restless, his breath like a forge.`,`It is the longest night. Snow falls. Your father sleeps.`),
      xc('iska',`Are you sure, Ember? Once we split his flame, half of it lives in you. Forever. And in your children, and theirs.`,`Are you sure, Ember? Half his fire will live in you forever.`,[
        xo(`I'm sure.`,`I am sure.`,{tone:'brave',fn:()=>{ G.flags.dr_split='sure'; },then:[xl('iska',`Then hold my hand. Wardens, now!`,`Hold my hand. Now!`)]}),
        xo(`No. But I'll do it anyway.`,`No. But I will do it.`,{tone:'kind',fn:()=>{ G.flags.dr_split='brave'; },then:[xl('iska',`That's the bravest answer there is. Hold my hand. Wardens, now!`,`That is the bravest answer. Hold my hand. Now!`)]})
      ]),
      xl('narr',`Five lanterns flare. Your father's fire rises out of him like a river of light, and half of it pours into you.`,`Five lanterns shine. Half of your father's fire flows into you.`),
      xc('narr',`It hurts. It hurts like a sunburn on the inside.`,`It hurts, like a sunburn inside.`,[
        xo(`Laugh`,`Laugh`,{fn:()=>{ G.flags.dr_split2='laugh'; },then:[xl('narr',`And you laugh. You don't know why. Maybe because it tickles, too. Iska laughs with you, with tears on her face.`,`You laugh! It tickles too. Iska laughs with you.`)]}),
        xo(`Sing the lantern song`,`Sing the lantern song`,{fn:()=>{ G.flags.dr_split2='sing'; },then:[xl('narr',`You sing the little lantern song Iska taught you. Bram joins in, very off key. Then everyone does.`,`You sing the lantern song. Then everyone sings with you.`)]})
      ]),
      xl('narr',`Your father opens one eye. Just for a moment. He looks at you. Then the dark takes him, and he sleeps.`,`Your father opens one eye. He looks at you. Then he falls asleep.`)]},
  knight:{stages:['gate'],title:S(`The Knight's Promise`,`The Knight's Promise`),scene:'knight',
    lines:()=>[
      xl('narr',`The Obsidian Gate, brand new and shining. A young knight kneels in front of Iska. His armor is too big for him. His helmet keeps sliding over his eyes.`,`A young knight kneels at the new gate. His helmet is too big.`),
      xl('cinder_young',`I swear to guard this gate until an Emberblood comes who can finish what we started. However long it takes.`,`I promise to guard this gate until an Emberblood comes.`),
      xl('iska',`It could be a very long time, Cindervane.`,`It could be a very long time.`),
      xl('cinder_young',`Then I'll bring a chair. Not to sit on. Just to know it's there.`,`Then I will bring a chair.`),
      xc('ember_kid',`Give him something for his long watch.`,`Give him a present for his long job.`,[
        xo(`A flower for his helmet`,`A flower for his helmet`,{tone:'kind',fn:()=>{ G.flags.dr_knight='flower'; },then:[xl('narr',`You tuck a little red flower into his helmet. He blushes all the way to his ears.`,`You put a red flower on his helmet. He blushes.`)]}),
        xo(`A spark to keep him warm`,`A spark to keep him warm`,{fn:()=>{ G.flags.dr_knight='spark'; },then:[xl('narr',`You breathe a tiny spark into his gauntlet. It glows there, warm as a hearth. "It will never go out," you tell him. It never does.`,`You put a tiny spark in his glove. "It will never go out," you say.`)]}),
        xo(`A really good joke`,`A funny joke`,{fn:()=>{ G.flags.dr_knight='joke'; },then:[xl('ember_kid',`Why did the knight guard the gate? Because the gate couldn't guard itself!`,`Why did the knight guard the gate? The gate could not guard itself!`),xl('narr',`It's not a good joke. Cindervane laughs so hard his helmet falls off. He'll remember it for a thousand years.`,`It is a silly joke. The knight laughs so hard his helmet falls off.`)]})
      ])]},
  lantern:{stages:['summit'],title:S('The First Lantern Day','The First Lantern Day'),scene:'lantern',
    lines:()=>{
      const k=G.flags.dr_knight;
      const L=[
        xl('narr',`The longest night again, one year later. You climb the hill above the valley with a paper lantern in your claws.`,`One year later. You climb a hill with a paper lantern.`),
        xl('narr',`Behind you, the mountain is quiet. Your father has been asleep for exactly one year.`,`Your father has been asleep for one year.`)];
      if(k) L.push(xl('narr',k==='flower'?`Far below at the gate, a young knight raises his helmet to say hello. There's a red flower in it.`:k==='spark'?`Far below at the gate, a young knight raises one hand to say hello. His gauntlet glows with a little spark.`:`Far below at the gate, a young knight is still chuckling at a joke from one year ago.`,
        k==='flower'?`At the gate, the knight waves. The red flower is still on his helmet.`:k==='spark'?`At the gate, the knight waves. His glove still glows.`:`At the gate, the knight still laughs at your joke.`));
      L.push(xc('ember_kid',`How many lanterns will you light?`,`How many lanterns will you light?`,[
        xo(`Just one. For Father.`,`Just one. For Father.`,{fn:()=>{ G.flags.dr_lantern='one'; },then:[xl('narr',`You light it and hold it up high, so that he can see it from his sleep and know where home is.`,`You hold it up high, so he can see it and know where home is.`)]}),
        xo(`One more than I need`,`One more than I need`,{tone:'kind',fn:()=>{ G.flags.dr_lantern='more'; },then:[xl('narr',`You light one for Father, and one more, just in case. Iska taught you that. "Light one more than you think you need."`,`You light one for Father, and one more. Iska taught you that.`)]}),
        xo(`One for every house in the valley`,`One for every house`,{tone:'brave',fn:()=>{ G.flags.dr_lantern='all'; },then:[xl('narr',`It takes all night. When you're done, the whole valley glows. People come out of their houses to see. Nobody runs.`,`It takes all night. The whole valley glows. Nobody runs away.`)]})
      ]),
      xl('narr',`That was the very first Lantern Day. A thousand years later, a kid with horns and a tail would light the thousandth one.`,`That was the first Lantern Day. A thousand years later, you would light the thousandth.`),
      xl('ember',`Wake up, Ash. It's your turn now.`,`Wake up, Ash. It is your turn now.`));
      return L;
    }},
  home:{stages:['done'],title:S('A Hill Full of Lanterns','A Hill Full of Lanterns'),scene:'home',
    lines:()=>[
      xl('narr',`You dream of a hill covered in lanterns. A girl with horns is sitting in the grass, swinging her feet.`,`You dream of a hill full of lanterns. A girl with horns sits in the grass.`),
      xl('ember_kid',`You did it. You really did it. I knew you would. All right, I hoped. But I hoped very hard.`,`You did it! I hoped so hard.`),
      xc('ash',`What do you say?`,`What do you say?`,[
        xo(`Thank you, Grandma Ember`,`Thank you, Grandma Ember`,{tone:'kind',fn:()=>{ G.flags.dr_home='thanks'; },then:[xl('ember_kid',`Just Ember. Thirteen greats is far too many greats.`,`Just Ember. Thirteen greats is too many!`)]}),
        xo(`Will I see you again?`,`Will I see you again?`,{fn:()=>{ G.flags.dr_home='again'; },then:[xl('ember_kid',`Every Lantern Day. Look for the brightest lantern. That's me, waving.`,`Every Lantern Day. Look for the brightest lantern. That is me, waving.`)]})
      ]),
      xl('narr',`She hugs you. It feels like sunshine on your scales. Then you wake up, and it's morning, and somebody is making pancakes.`,`She hugs you. It feels like sunshine. Then you wake up. Someone is making pancakes.`)]}
};
const DREAM_ORDER=['spark','flight','knock','five','split','knight','lantern','home'];
// what Mom and Yara say the next time you talk (once per dream)
const DREAM_TALK={
  spark:{maren:{twinkle:S(`You were talking in your sleep last night. Something about a twinkle? You sounded very proud of it.`,`You talked in your sleep. Something about a twinkle.`),crackles:S(`You were mumbling in your sleep. Who is Mister Crackles? Should I be worried?`,`You talked in your sleep. Who is Mister Crackles?`),dad:S(`You said "Dad" in your sleep last night. Then you said "mine." Then you snored. Very loudly.`,`You said "Dad" in your sleep. Then you snored.`)},
    yara:S(`You have the look of someone who dreamed of the old days. Emberbloods do, sometimes. The fire remembers.`,`You look like you had an old dream. The fire remembers things.`)},
  flight:{maren:{happy:S(`You've got your thinking face on. The one you had when you were four and asked why the moon doesn't fall down.`,`You look like you are thinking hard.`),visit:S(`You look a bit sad today, love. Want a hug? You're getting one anyway.`,`You look a bit sad. Here is a hug.`),faster:S(`You were flapping your arms in your sleep and yelling "FASTER." You knocked over a lamp.`,`You yelled "FASTER" in your sleep. You knocked over a lamp!`)},
    yara:S(`You dreamed of flying with him, didn't you? Ember wrote that she did, when she was little. Before.`,`Did you dream of flying with him? Ember did too, when she was little.`)},
  knock:{wren:{help:S(`Ember knocked on Iska's door and said "I want to help"? That's in the old stories! Almost word for word!`,`Ember said "I want to help"? That is in the old stories!`),scared:S(`Ember said she was scared? Of course she was. The stories make her sound fearless. I like her more now.`,`Ember was scared too? I like her even more now.`),cake:S(`She asked for CAKE? Oh, I'm writing that in the margins. Lantern cake. History!`,`She asked for cake? I am writing that down!`)},
    yara:S(`Iska's door. I've seen it, you know. It's in the old part of Emberhollow. Someone painted it blue, years ago.`,`I have seen Iska's old door. It is blue now.`)},
  five:{maren:{tove:S(`Your claws were warm all night. Toasty. I tucked you in and nearly burned my hand.`,`Your claws were very warm last night!`),sedge:S(`Why is there steam coming off your pillow? Never mind. I don't want to know.`,`Why is your pillow steaming?`),bram:S(`You were laughing in your sleep. Something about a goat with no ending.`,`You laughed in your sleep. Something about a goat.`),iska:S(`You folded your blanket into a lantern shape in your sleep. It was lopsided. It was perfect.`,`You folded your blanket like a lantern. It was perfect.`)},
    yara:S(`The five Wardens around a fire. I always pictured Bram doing all the talking.`,`I always think Bram talked the most.`)},
  split:{maren:{sure:S(`You look older today. Not taller. Just... older. I don't like it. Eat a pancake.`,`You look older today. Eat a pancake.`),brave:S(`You look older today. Not taller. Just... older. I don't like it. Eat a pancake.`,`You look older today. Eat a pancake.`)},
    yara:S(`The longest night. Ember laughed, the pages say. Did she? I always hoped she did.`,`On the longest night, Ember laughed. I hope she did.`)},
  knight:{maren:{flower:S(`Somebody left a red flower on the forge this morning. Was that you?`,`There was a red flower on the forge. Was that you?`),spark:S(`There's a little spark in my glove that won't go out. Ash. Did you do that?`,`There is a spark in my glove that won't go out!`),joke:S(`I heard you laughing at your own joke in your sleep. Was it the gate one? It's a terrible joke. I love it.`,`You laughed at your own joke in your sleep!`)},
    yara:S(`Sir Cindervane. A thousand years at that gate. Imagine what he thinks about.`,`Sir Cindervane waited a thousand years. Wow.`)},
  lantern:{maren:{one:S(`I left a lantern in the window for you. Just one. You know why.`,`I put a lantern in the window for you.`),more:S(`I left two lanterns in the window. One for you, and one more, just in case.`,`I put two lanterns in the window for you.`),all:S(`Every house in the village put a lantern out tonight. Nobody planned it. Isn't that strange?`,`Every house put out a lantern tonight!`)},
    yara:S(`One more than you think you need. Iska's rule. In sixty years I have never once had too many lanterns.`,`Light one more lantern than you need. Iska's rule.`)},
  home:{maren:{thanks:S(`You're smiling in your sleep these days. Good dreams?`,`You smile in your sleep now. Good dreams?`),again:S(`You're smiling in your sleep these days. Good dreams?`,`You smile in your sleep now. Good dreams?`)},
    yara:S(`You've seen her, haven't you? Ember, in your dreams. I can tell. You've been humming the old lantern song all morning.`,`You dreamed of Ember? You are humming her song.`)}
};

// ================= small variations on moments that repeat
// Mom reforging star-iron: a different scene each time
{ const RF=[
    ()=>[xl('maren',`Star-iron! Where did you... never mind. Give it here.`,`Star-iron! Give it here.`),xl('maren',`There. Your blade's a little sharper and a lot shinier. Go make me proud. And eat something.`,`There. Your blade is sharper now. Go make me proud. And eat something.`)],
    ()=>[xl('maren',`More star-iron? You're getting good at finding this. Or the sky is getting bad at keeping it.`,`More star-iron? You are good at finding it!`),xl('narr',`CLANG. CLANG. CLANG. Mom hums the lantern song in time with the hammer.`,`CLANG! CLANG! Mom hums a song while she works.`),xl('maren',`Done. Every weapon you've got will hit harder now. Try not to hit anything we own.`,`Done! All your weapons hit harder now.`)],
    ()=>[xl('maren',`Ash, this is the third piece. Grandma never had three. You know what that means?`,`This is the third piece! Grandma never had three.`),xl('ash',`More shiny?`,`More shiny?`),xl('maren',`MUCH more shiny. Stand back.`,`Much more shiny. Stand back!`),xl('narr',`The forge roars blue. Sparks fly up like falling stars, backwards.`,`The fire turns blue. Sparks fly up like stars.`),xl('maren',`There. That blade could cut a cloud in half. Please don't cut a cloud in half.`,`There! That blade is super sharp. Don't cut a cloud!`)],
    ()=>[xl('maren',`Still finding star-iron? The valley must really like you.`,`More star-iron? The valley likes you!`),xl('maren',`Hold still. Not you. The sword. ...There. Sharper than ever.`,`There. Sharper than ever!`)]
  ];
  Object.defineProperty(STORY.maren,'reforge',{configurable:true,enumerable:true,get(){ return RF[Math.min(RF.length-1,(G&&G.tier)||0)](); }});
}
// Elder Yara's hints come in a couple of versions each
{ const YH={
    warcamp:[STORY.yaraHints.warcamp,S(`Follow the north road out of the village. Grizzlefang's camp is where the trees start. You'll smell it before you see it.`,`Go north from the village. Grizzlefang's camp is at the edge of the woods.`)],
    wren:[STORY.yaraHints.wren,S(`East, Ash, along the road to the lake. Sister Wren is in the Brindlecross library. Knock loudly. She reads with her whole head inside the book.`,`Go east to Brindlecross by the lake. Find Sister Wren in the library.`)],
    oath:[STORY.yaraHints.oath,S(`The Ash Ward is up the Ashen Road, past the Smoky Kettle. Morrow's people throw fire. Throw it back harder.`,`Go up the Ashen Road past the Smoky Kettle inn. The Ash Ward is there.`)],
    three:[STORY.yaraHints.three,S(`Crag Ward in the east, Sunken Ward in the swampy southeast, Frost Ward in the snowy northwest. Pack a scarf for that last one.`,`Three Wards left: east, southeast and northwest. Bring a scarf!`)],
    gate:[STORY.yaraHints.gate,S(`North of Brindlecross, the road climbs to the Obsidian Gate. Its guard has stood there a thousand years. Be kind to him. Then beat him.`,`Go north of Brindlecross to the Obsidian Gate. Be brave.`)],
    summit:[STORY.yaraHints.summit,S(`Past the gate, past the lava, up to the top. Give your grandfather my regards. And come home, Ash. That's not a hint. That's an order.`,`Go past the gate and the lava to the top. Then come home safe.`)]
  };
  for(const k in YH) Object.defineProperty(STORY.yaraHints,k,{configurable:true,enumerable:true,get(){ return YH[k][Math.floor(Math.random()*YH[k].length)]; }});
}
// Mom and Yara say something about the chapter now and then (after the first hello)
const MOM_CH={
  lore:[S(`The kobolds broke three windows and a chicken. The chicken's fine. It's just angry now.`,`The kobolds broke three windows. The chicken is okay.`),S(`Yara told you the real story, didn't she? I can tell. You've got Grandma's frown.`,`Yara told you the real story? You have Grandma's frown.`)],
  hollow:[S(`The Hollow Ward. Under the old oak. Your grandmother used to take me there to look at it. It was always warm.`,`The Hollow Ward is under the old oak. It used to be warm.`)],
  warcamp:[S(`A war camp. My kid is going to a war camp. I'm making you a sandwich. That's what I do when I'm worried.`,`You are going to a war camp? I will make you a sandwich.`),S(`If you see Grizzlefang, tell him he owes me three windows and a chicken's peace of mind.`,`Tell Grizzlefang he owes me three windows!`)],
  wren:[S(`Brindlecross! Say hello to Tilly at the inn. And don't let Wren give you any books that bite.`,`Say hi to Tilly in Brindlecross for me.`)],
  oath:[S(`The Scaled Oath. People in robes who want a dragon to make them kings. Dragons make toast, Ash. Toast.`,`The Oath wants a dragon king. Dragons just make toast!`)],
  three:[S(`Three Wards in three corners of the valley. You'll see more of Embermere this month than I have in my whole life.`,`Three Wards in three places. You will see the whole valley!`),S(`I keep looking at the mountain. Then I keep looking at my hammer. Then I keep looking at the mountain.`,`I keep looking at the mountain. I worry.`)],
  gate:[S(`The Obsidian Gate. When I was little, we dared each other to touch it. Nobody ever did. You're going to walk through it.`,`Nobody ever touched the Gate. You will walk through it!`)],
  summit:[S(`Come here. No, closer. That's a hug. You're getting another one when you come back. That's a promise.`,`Come here for a hug. You get another when you come back.`),S(`Take the extra sandwich. And Ash? Come back down. That's the only rule.`,`Take the sandwich. And come back down.`)],
  done:[S(`My kid saved the valley. I've told everybody. Twice. I've started telling the chickens.`,`My kid saved the valley! I told everybody. Twice.`),S(`The forge has never been so busy. Everyone wants a lantern hook with a little dragon on it.`,`Everyone wants dragon lantern hooks now!`)]
};
const YARA_CH={
  warcamp:[S(`Breathe, Ash. The Hollow Ward is lit. That's one. Four to go, and I'll be counting.`,`One Ward is lit. Four to go.`)],
  three:[S(`Three Wards to go, and the mountain is breathing louder every night. Forty-one breaths last night. I lay awake for every one.`,`Three Wards left. The mountain breathes louder every night.`)],
  gate:[S(`All five Wards burn. A thousand years of Wardens, and a kid with a tail finished the job. Well. Nearly.`,`All five Wards are lit! You nearly did it.`)],
  done:[S(`A thousand and one Lantern Days. I'll light the first lantern again next year. Unless you'd like to.`,`Next Lantern Day, you can light the first lantern.`)]
};
// Pip's chirps with a bit of context (night, rain, snow, water, low health, a dream, a friend)
const PIP_CH={
  night:[S(`Mip... (Pip yawns a tiny flame.)`,`Mip... (Pip yawns.)`),S(`Mip? (Pip curls up on your head for a second.)`,`Mip? (Pip sits on your head.)`)],
  rain:[S(`Mip! (Pip shakes the rain off. All over you.)`,`Mip! (Pip shakes off the rain on you.)`),S(`Mip mip! (Pip catches a raindrop. It sizzles.)`,`Mip! (A raindrop sizzles on Pip.)`)],
  snow:[S(`Mip! (Pip sneezes a little flame at a snowflake.)`,`Mip! (Pip sneezes at a snowflake.)`),S(`Mrrp... (Pip snuggles closer. Pip is cold.)`,`Mrrp... (Pip is cold.)`)],
  water:[S(`Mip! (Pip has seen a fish. Pip wants the fish.)`,`Mip! (Pip sees a fish.)`)],
  hurt:[S(`Mip?! (Pip looks very worried about you.)`,`Mip?! (Pip is worried.)`)],
  dream:[S(`Mip? (Pip watched you sleep. You were mumbling.)`,`Mip? (Pip saw you dream.)`)],
  tikka:[S(`Mip? (Pip sniffs the air. It smells like lumpy bread.)`,`Mip? (Pip smells bread.)`)],
  kitten:[S(`Mip! (Pip is pretending to be a kitten. It is not convincing.)`,`Mip! (Pip acts like a kitten.)`)],
  stars:[S(`Mip! (Pip is watching the sky for more stars.)`,`Mip! (Pip looks for stars.)`)]
};
// weather and time-of-day banter between villagers (registered with the bark engine in a9j_events.js)
const WX_BARKS=[
  ['wx_rain1','any',()=>!AREA&&G.rainK>0.45,S(`This rain! My garden's happy. My socks are not.`,`This rain! My socks are wet.`)],
  ['wx_rain2','adult',()=>!AREA&&G.rainK>0.45,S(`Stand under my roof, Ash, you'll put yourself out!`,`Come under my roof, Ash! Stay dry!`)],
  ['wx_rain3','kid',()=>!AREA&&G.rainK>0.45,S(`I'm going to jump in EVERY puddle!`,`I will jump in every puddle!`)],
  ['wx_clear','any',()=>!AREA&&G.rainK<0.1&&isDay(),S(`Not a cloud in the sky. Perfect day for drying laundry. Or dragons.`,`What a sunny day!`)],
  ['wx_night1','adult',()=>isNight(),S(`Out late, Ash? The stars are very bright tonight.`,`Out late, Ash? Look at the stars!`)],
  ['wx_night2','kid',()=>isNight(),S(`I'm not tired. I'm NOT. (yawn)`,`I'm not tired! (yawn)`)],
  ['wx_dawn','any',()=>G.tod>0.2&&G.tod<0.3,S(`Up with the sun, Ash? Me too. The rooster made sure of it.`,`Up early, Ash? Me too!`)],
  ['wx_dusk','any',()=>G.tod>0.7&&G.tod<0.8,S(`Look at that sunset. It's the colour of your scales.`,`Look at the sunset! It is the colour of your scales.`)],
  ['wx_snow','town:lodge',()=>true,S(`More snow coming. There's always more snow coming. That's the Frostpine promise.`,`More snow is coming. There is always more snow.`)],
  ['wx_mire','town:mire',()=>true,S(`Mind the bog. It's hungry today. It's always hungry.`,`Watch out for the mud!`)]
];
const WX_CHATS=[
  ['wxc_rain',()=>!AREA&&G.rainK>0.45,[[0,S(`Lovely weather for ducks.`,`Good weather for ducks.`)],[1,S(`And frogs.`,`And frogs.`)],[0,S(`And dragons?`,`And dragons?`)],[1,S(`Dragons hate rain. Look at Ash's face.`,`Dragons hate rain. Look at Ash.`)]]],
  ['wxc_night',()=>isNight(),[[0,S(`Can't sleep?`,`Can't sleep?`)],[1,S(`The mountain's too loud. Can you hear it breathing?`,`The mountain is too loud.`)],[0,S(`I hear it. I've stopped telling myself it's the wind.`,`I hear it too. It is not the wind.`)]]],
  ['wxc_sun',()=>!AREA&&G.rainK<0.1&&isDay(),[[0,S(`Sunny again!`,`Sunny again!`)],[1,S(`I'm going to sit in it like a lizard.`,`I will sit in the sun like a lizard.`)],[0,S(`Don't say lizard near Ash.`,`Shh! Don't say lizard near Ash.`)]]]
];
EVS.snow.quit=E=>[xl('ev_juno',`Ha! We win! The Frostpine Snow Gang is undefeated! Rematch any time, dragon. Here, have some cocoa anyway.`,`We win! Play again any time! Have some cocoa.`)];
// what people say about the events and about Tikka (greetings, talk options, Tamsin's song, barks)
const EV_TALK={
  momFlower:S(`You brought me a glowing flower? It's on the anvil. It hums when I work. I keep stopping to listen.`,`Thank you for the glowing flower! It hums when I work.`),
  bertramBun:S(`Ash, is this... a kobold bun? It's lumpy. It's lopsided. It's... actually wonderful. Who made this? I need to meet them.`,`Is this a kobold bun? It is lumpy. It is wonderful! Who made it?`),
  home:{baker:S(`Those little kobolds you sent me are wonderful! They only set fire to one apron. Tikka's lumpy buns are selling faster than mine. I'm thrilled. I'm a little jealous.`,`The little kobolds are great helpers! Tikka's buns sell faster than mine.`),
    farm:S(`The kobold kids are a big help. The little one, Tock, talks to the turnips. The turnips have never grown so well.`,`The kobold kids help on the farm. Tock talks to the turnips!`),
    moss:S(`My kobold helpers are a joy. Tikka made a potion that makes bread rise. It also made my frog float. He loved it.`,`My kobold helpers are lovely. Tikka made a potion that made my frog float!`)},
  momTikkaYes:S(`I hear a little kobold is going up the mountain with you. With a spoon. Good. Everyone needs someone with a spoon.`,`A little kobold is going with you? With a spoon? Good!`),
  momTikkaHome:S(`There's a little kobold lighting a lantern in her window every night. She says it's for you. I like her already.`,`A little kobold lights a lantern for you every night. I like her.`),
  opts:{
    wren:[{key:'ev_wren_dream',cond:()=>!!(G.flags.dr_seen_knock||G.flags.dr_seen_five||G.flags.dr_seen_split),t:S(`I keep dreaming about Ember and the Wardens`,`I dream about Ember`),
      lines:[['wren',S(`Dreams of Ember? Oh, Ash. Write them down! Every single detail! The Wardens' Account only has ten pages. You might be the eleventh.`,`Dreams of Ember? Write them down! You might be page eleven!`)],['wren',S(`Emberbloods used to dream like that, the old books say. Nobody ever wrote down why.`,`Old Emberbloods had dreams like that too.`)]]}],
    yara:[{key:'ev_yara_tikka',cond:()=>(G.flags.tk_n|0)>=2,t:S(`I've met a kobold who wants to be a baker`,`I met a kobold who bakes`),
      lines:[['yara',S(`A kobold baker? Hm. When I was young, a kobold once traded me a pie for a button. It was a very good pie. I've wondered about that kobold ever since.`,`A kobold baker? A kobold once gave me a very good pie.`)]]}],
    tamsin:[{key:'ev_tamsin_show',cond:()=>!!G.flags.ev_show,t:S(`Did you hear I was in a play?`,`I was in a play!`),
      lines:[['tamsin',S(`The Marvelous Mudlarks? Everyone heard! A real dragon playing a dragon. It's the role you were born for. I've already written two verses.`,`Everyone heard! A real dragon in a play!`)]]}],
    dell:[{key:'ev_dell_bess',cond:()=>!!G.flags.ev_fish,t:S(`I had a fishing contest with Barnacle Bess`,`I fished with Barnacle Bess`),
      lines:[['dell',S(`Barnacle Bess! She beat me eleven times. Twelve, if you count the time I fell in. You did better than me, I bet.`,`Bess beat me eleven times! You did better, I bet.`)]]}],
    hal:[{key:'ev_hal_cheese',cond:()=>!!G.flags.ev_cheese,t:S(`I caught a runaway cheese once`,`I caught a runaway cheese`),
      lines:[['hal',S(`A cheese that RUNS? Mine just sits there being cheese. I'm not sure if I'm jealous or scared.`,`A cheese that runs? Mine just sits there!`)]]}]
  }
};
// extra verses for Tamsin's song about Ash (each needs its condition)
const EV_TAMSIN=[
  [()=>!!G.flags.ev_kitten,S(`🎵 A kitten got stuck at the top of a tree, and Ash brought him down for a drawing, for free...`,`🎵 Ash saved a kitten from a tree...`)],
  [()=>!!G.flags.ev_show,S(`🎵 A show lost its dragon, the costume was torn, so Ash took the stage and a legend was born...`,`🎵 Ash was the dragon in a show...`)],
  [()=>!!G.flags.ev_cheese,S(`🎵 A cheese ran away down the hill and the dale, and Ash caught it up by its cheesy old tail...`,`🎵 Ash caught a runaway cheese...`)],
  [()=>!!G.flags.ev_ghost,S(`🎵 A ghost lost his hat, he was ever so blue, so Ash found it again, and now he's ghost-happy too...`,`🎵 Ash found a ghost's lost hat...`)],
  [()=>(G.flags.tk_n|0)>=2,S(`🎵 A kobold named Tikka who bakes lumpy bread, met a dragon who listened to what Tikka said...`,`🎵 Tikka the kobold bakes lumpy bread...`)]
];
// villagers notice what Ash did at the events: [key, who, condition, text, deed that makes it fresh]
const EV_BARKS=[
  ['evb_cart','any',()=>!!G.deeds.ev_cart,S(`A tinker came through saying a dragon got his wagon out of the mud. Was that you?`,`Did you help a man with his wagon?`),'ev_cart'],
  ['evb_kit','kid',()=>!!G.deeds.ev_kitten,S(`You saved Sir Fluffington! Posy told the whole school!`,`You saved the kitten! Everyone knows!`),'ev_kitten'],
  ['evb_star','any',()=>!!G.deeds.ev_stars,S(`Did you see the falling stars? Somebody said one landed right next to you!`,`Did you see the falling stars?`),'ev_stars'],
  ['evb_ghost','adult',()=>!!G.deeds.ev_ghost,S(`My gran swears she saw a ghost in a very fancy hat dancing last night.`,`My gran saw a ghost dancing in a hat!`),'ev_ghost'],
  ['evb_mimic','any',()=>!!G.deeds.ev_mimic,S(`If a treasure chest smiles at you, DON'T open it. Trust me on this one.`,`If a chest smiles at you, don't open it!`),'ev_mimic'],
  ['evb_goat','adult',()=>!!G.deeds.ev_goats,S(`Bea says you're the best goat herder she's ever seen. That's big praise from Bea.`,`Bea says you are great with goats!`),'ev_goats'],
  ['evb_wiz','any',()=>G.hat==='wizard',S(`Ooh, a wizard hat! Do a spell! Breathing fire counts.`,`A wizard hat! Do a magic trick!`)],
  ['evb_fog','any',()=>!!G.deeds.ev_fog,S(`They say the fog in the deep woods talks to kind people. Did it talk to you?`,`They say the fog talks to kind people.`),'ev_fog'],
  ['evb_drake','any',()=>!!G.deeds.ev_drake,S(`Somebody saw a big drakeling flying with a tiny one. Happy as anything.`,`Someone saw a mum dragon and her baby. So happy!`),'ev_drake'],
  ['evb_fish','town:brindle',()=>!!G.deeds.ev_fish,S(`Barnacle Bess had a fishing contest with a DRAGON? The whole lake is talking.`,`You fished with Barnacle Bess? Wow!`),'ev_fish'],
  ['evb_show','any',()=>!!G.deeds.ev_show,S(`I saw the Marvelous Mudlarks! The dragon was AMAZING. Wait. Was that you?`,`I saw the dragon show! Was that you?`),'ev_show'],
  ['evb_snow','town:lodge',()=>!!G.deeds.ev_snow,S(`The Snow Gang says you melted all their forts. They've been building bigger ones all week.`,`The snow kids are building bigger forts now!`),'ev_snow'],
  ['evb_cheese','any',()=>!!G.deeds.ev_cheese,S(`Cheddar Chuck says you saved his cheese. He's naming a new cheese after you. It's very spicy.`,`Chuck is naming a cheese after you!`),'ev_cheese'],
  ['evb_bear','adult',()=>!!G.deeds.ev_bear,S(`The Puddings got their picnic back from a bear, thanks to a certain dragon.`,`You got the picnic back from the bear!`),'ev_bear'],
  ['evb_flies','kid',()=>!!G.deeds.ev_flies,S(`Lumi showed me her fireflies. Or she showed me where they used to be. It was still nice.`,`Lumi told me about the fireflies!`),'ev_flies'],
  ['evb_raid','adult',()=>!!G.deeds.ev_raid,S(`Granny Thimble's been telling everyone about her hero. She's knitting you a second scarf.`,`Granny Thimble is knitting you another scarf!`),'ev_raid'],
  ['evb_frogs','any',()=>!!G.deeds.ev_frogs,S(`The frogs in the swamp have been singing much better lately. Somebody taught them.`,`The frogs sing better now. Someone taught them!`),'ev_frogs'],
  ['evb_tk1','adult',()=>(G.flags.tk_n|0)>=1&&(G.flags.tk_n|0)<4,S(`Someone saw a little kobold carrying a loaf of bread bigger than she was. Strange times.`,`Someone saw a little kobold with a big loaf of bread.`)],
  ['evb_tkb','town:village',()=>G.flags.tk_home==='baker',S(`Have you seen the little kobolds at the bakery? One of them is completely covered in flour. It's adorable.`,`There are little kobolds at the bakery now! So cute!`)],
  ['evb_tkf','id:hollis',()=>G.flags.tk_home==='farm',S(`The kobold kids are up before the rooster. The rooster is very upset about it.`,`The kobold kids wake up before the rooster!`)],
  ['evb_tkm','town:mire',()=>G.flags.tk_home==='moss',S(`Granny Moss has kobold helpers now. Her frog has been floating for a week.`,`Granny Moss has kobold helpers. Her frog floats now!`)],
  ['evb_dream','any',()=>!!(G.deeds&&(G.deeds.dream_spark||G.deeds.dream_knock)),S(`You look like you've been dreaming of old things, Ash. Your eyes are all faraway.`,`You look sleepy, Ash. Good dreams?`)]
];
// greetings when you talk to someone soon after an event (picked by who it is)
const EV_DGREET={
  ev_kitten:[['kid',S(`Ash! Is it true you saved a kitten from the top of a tree?`,`Did you save a kitten?`)],['adult',S(`I heard about the kitten. You've got a kind heart, Ash.`,`You saved a kitten! So kind.`)]],
  ev_show:[['any',S(`Ash! I heard you were in a play! Do your dragon voice!`,`You were in a play! Do your dragon voice!`)]],
  ev_cheese:[['any',S(`Ash, did you really chase a cheese across the valley?`,`Did you chase a cheese?`)]],
  ev_raid:[['adult',S(`You saved Granny Thimble's knitting! A true hero of yarn.`,`You saved Granny's knitting!`)]],
  'ev_tk4@bertram':[['any',S(`Ash! Are those kobold kids coming to MY bakery? Tell them to bring aprons. Lots of aprons.`,`Are kobolds coming to my bakery? Bring aprons!`)]]
};
// Tikka's third meeting, if Ash has already beaten Morrow
TKS.tk3.meet0=TKS.tk3.meet;
TKS.tk3.meet=E=>{ const L=TKS.tk3.meet0(E); if(G.bossDone&&G.bossDone.morrow) L[2]=xl('ev_tikka',`You already beat High Priest Morrow! But some cultists are still hiding in the hills, and they still have Tock.`,`You beat Morrow! But some cultists still have Tock.`); return L; };
