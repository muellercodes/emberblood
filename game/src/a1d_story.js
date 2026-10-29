
// ================= story script
// Lines are [speaker, text]. A line can also be {who, text, opts:[{t, fn, then:[lines]}]} for a choice.
const ch=(who,text,opts)=>({who,text,opts});
const STORY={
  // the opening: a new game starts with Ash asleep in his bed upstairs; Mom calls up from the kitchen on her way to the forge.
  // (v12 PROLOGUE) Lantern Eve plays first (x0_prologue.js, the night before); the three folk-tale lines are for a journey
  // that skipped it before the show was over (G.flags.lantern_eve is set once it was)
  prologue:[
    {who:'narr',text:S(`Every summer, on the shortest night of the year, the valley of Embermere hangs out paper lanterns. Ask anyone why, and they say: you just do.`,`Every summer, on the shortest night, the valley hangs out paper lanterns. Nobody knows why.`),skipIf:()=>!!(G&&G.flags.lantern_eve)},
    {who:'narr',text:S(`There's a puppet show about it on the green every year. A grumpy dragon on the mountain, five brave friends, and a girl with horns called Ember who sings him to sleep. Nobody believes the puppet show.`,`There is a puppet show about a dragon and a girl with horns. Nobody believes it.`),skipIf:()=>!!(G&&G.flags.lantern_eve)},
    {who:'narr',text:S(`In Emberhollow, the lanterns are lit by Ash, who was born with horns, a tail and real fire. Mom says it runs in the family, like red hair. Bertram the baker says it runs in the family like a house fire.`,`Ash lights the lanterns. He was born with horns, a tail and real fire.`),skipIf:()=>!!(G&&G.flags.lantern_eve)},
    ['maren',S(`(from the kitchen) Ash! Up you get! It's Lantern Day, and Emberhollow's lantern-lighter is still snoring.`,`(from downstairs) Ash! Get up! It's Lantern Day!`)],
    ['ash',S(`(under the blanket) I wasn't snoring. I was practicing my gentle breaths.`,`I wasn't snoring! I was practicing breathing.`)],
    ['maren',S(`Practice on the lanterns. I'm off to the forge. Come and find me before the festival. I finished something for you last night.`,`I'm going to the forge. Come and find me. I made you something.`)],
    ['maren',S(`And Ash? Gently this year. Bertram has only just got his bakery back.`,`And Ash? Gently. Bertram just fixed his bakery.`)],
    ['narr',S(`The front door bangs. You kick off the blanket. This year, nothing is going to catch fire that isn't supposed to.`,`The door bangs. You get up. This year, nothing will catch fire by mistake.`)]
  ],
  forge:[
    ['maren',`There you are. Hold out your claws.`],
    ['maren',S(`Your grandmother's sword. Her mother had it before her, and hers before that, all the way back to Ember, if you believe the family stories.`,`This was your grandmother's sword. The family says it goes back to Ember.`)],
    ['maren',S(`Gran used to say it was made for "the one who comes at the end." The end of what, she never said. I always thought she was being dramatic.`,`Gran said it was for "the one at the end." The end of what? She never said.`)],
    ['ash',`It's beautiful. Is it fireproof?`],
    ['maren',S(`It is now. Go on, the three festival lanterns are waiting on the green. One gentle breath each.`,`It is now. Light the three lanterns on the green. Gently.`)]
  ],
  lanternsDone:[
    ['yara',S(`Beautiful work, Ash. Every year I tell you they never looked so bright. This year I mean it.`,`Beautiful, Ash! The brightest ever.`)],
    ['ash',S(`And nothing else caught fire. Not one thing. Put that in your big book.`,`Nothing else caught fire! Put that in your book.`)],
    ['narr',S(`Then the North Gate creaked open. Nobody remembered leaving it unlocked.`,`Then the North Gate creaked open.`)],
    ['yara',`Kobolds! In the village! Ash, drive them out!`]
  ],
  // (x0_act1.js puts Ember's Trials, two lines, in before the last line)
  lore:[
    ['yara',S(`You fought like a dragon out there. Sit down, Ash. It's time you heard the real story, not the one from the puppet show.`,`You fought like a dragon. Sit down. Here is the real story.`)],
    ['yara',S(`The dragon in the puppet show is real, Ash. His name is Vorlaxis, and he is asleep under Cinder Mountain. Ember was his daughter, and your mother's family comes down from her.`,`The dragon is real. His name is Vorlaxis. Ember was his daughter, and your family comes from her.`)],
    ['yara',S(`Once in a long while, one of her line is born with real fire. The old word for that is Emberblood. And it makes Vorlaxis your ${GREATS}grandfather.`,`Sometimes one of you is born with real fire. That is an Emberblood. And Vorlaxis is your great-great-great-great... grandfather.`)],
    ['ash',S(`...You just said "great" thirteen times.`,`That's a lot of greats.`)],
    ['yara',S(`I keep the Lantern Book. One line for every Lantern Day, back to the very first. Last night I wrote line one thousand. His chains were made to last exactly that long.`,`I write down every Lantern Day. Last night was number one thousand. The chains were made to last that long.`)],
    ['ash',`So the chains are about to...`],
    ['yara',S(`Come off. That isn't a coincidence, Ash. That's a deadline. And kobolds didn't open that gate by themselves.`,`Come off. It's a deadline. And someone opened the gate for the kobolds.`)],
    ['yara',S(`First, the Hollow Ward under the old oak. It went dark in the raid. Breathe on the stone and don't stop until it catches.`,`First, the Hollow Ward under the old oak. Breathe on it until it lights.`)]
  ],
  ward_hollow:[
    ['stone',`Warm again. Oh, that's better. Thank you.`],
    ['ash',`Did the rock just talk?`],
    ['iska',S(`The rock is Iska, first of the Five Wardens. What's left of her, anyway. Light all five Wards before the chains come off, and he wakes up weak and slow.`,`I'm Iska, a Warden. Light all five Wards, and he wakes up weak.`)],
    ['iska',S(`Leave them dark, and he wakes whole. Either way, he'll come for the half of his fire you carry. Not the valley, Ash. You.`,`Either way, he comes for the fire you carry. Not the valley. You.`)],
    ['iska',S(`Look at the wax on my stone. Cold wax. Nobody in this valley makes anything that cold. Somebody brought it here.`,`See the black wax? It's so cold. Somebody brought it here.`)],
    ['iska',S(`A cult called the Scaled Oath wants him awake and strong. Their kobolds answer to Grizzlefang, a chieftain with more teeth than sense. He camps in the woods north of the village. Start there.`,`The Scaled Oath wants him awake. Their kobold chief, Grizzlefang, camps north of the village. Go there.`)]
  ],
  // (x0_act1.js puts the causeway warning, three lines, in after the third line)
  wren:[
    ['wren',S(`There you are, Ash. Pebble brought Yara's note an hour ago. Come in, and mind the stacks. They lean.`,`Hello, Ash. Yara's crow said you were coming. Come in.`)],
    ['wren',S(`Five Wards hold the chains. Hollow, which you lit, and four more around the valley: Ash, Crag, Sunken and Frost.`,`Five Wards hold the chains. You lit one. Four are left.`)],
    ['wren',S(`The Scaled Oath holds the Ash Ward, up the Ashen Road. Their High Priest, Morrow, means to put it out for good. Go there next.`,`The Oath holds the Ash Ward, up the Ashen Road. Go there next.`)],
    ['ash',`And when all five are burning?`],
    ['wren',S(`Then the Obsidian Gate opens for whoever carries their fire, and you can walk up the mountain and have a very serious talk with your grandfather.`,`Then the Obsidian Gate opens. You can go up and talk to your grandfather.`)],
    ['ash',S(`A serious talk. With a dragon who wants my fire.`,`A talk. With a dragon who wants my fire.`)],
    ['wren',S(`I'd come with you. But I've read about mountains, and they're mostly weather.`,`I'd come, but mountains are mostly weather.`)]
  ],
  ward_ash:[
    ['bram',S(`Hah! Fire in the old stones again! You nailed it, kid. Bram's the name: the Warden with the big hammer and the bigger mouth.`,`Hah! Fire again! You nailed it! I'm Bram. Big hammer, bigger mouth.`)],
    ['bram',S(`Three Wards left, kid. Crag, Mire and Frost. Take them in whatever order you like. Just don't take them lightly.`,`Three Wards left: Crag, Mire and Frost. Any order you like.`)],
    ['bram',S(`And while you're out there, help folk when you can. A Warden who only looks after rocks is just a rock with opinions.`,`And help people when you can. Not just the Wards.`)]
  ],
  ward_crag:[
    ['oriel',S(`Welcome, Emberblood. I am Oriel. I watched over these crags, and the drakes who nest in them.`,`I'm Oriel. I watched over these crags and their drakes.`)],
    ['oriel',`Not every dragon is your enemy. Look.`],
    ['narr',S(`One last egg cracks open. A tiny drakeling tumbles out, sneezes a spark, and decides you are its mother.`,`An egg cracks. A tiny drake falls out and decides you are its mom.`)],
    ['ash',S(`Oh no. Oh no, it's adorable. I'm calling you Pip.`,`Oh no, it's so cute. I'm calling you Pip.`)],
    ['pip',`Mip!`]
  ],
  ward_mire:[
    ['sedge',S(`Sorry. I've been sitting in a swamp for a thousand years, and I forget my manners. I'm Sedge, Warden of the Mire. And of the mud.`,`Sorry. I'm Sedge, Warden of the Mire. And of the mud.`)],
    ['sedge',S(`Granny Moss has been talking to my stone for years. She's lovely. Bring her some tea sometime.`,`Granny Moss talks to my stone. Bring her some tea.`)]
  ],
  ward_frost:[
    ['tove',S(`Brr. Finally, warm stones. I had the coldest post of all five Wardens, and in a thousand years nobody came to visit.`,`Brr. Warm at last! Nobody visited me for a long time.`)],
    ['tove',S(`Greymane was a good wolf before the Oath fed him dragon smoke. I watched him grow up from a pup. Thank you for being gentle with him.`,`Greymane was a good wolf before the smoke. Thank you for being gentle.`)],
    ['tove',S(`On clear nights you can see the white one from up here, far in the north, asleep on her mountain.`,`On clear nights I see the white one up north. Asleep.`)],
    ['tove',S(`She never once came down to help us. I never forgave her.`,`She never helped us. I never forgave her.`)]
  ],
  allWards:[
    ['iska',S(`All five Wards burn again, Ash. Can you feel it?`,`All five Wards burn again. Feel it?`)],
    ['ash',S(`My hands are warm. Like I'm holding five little lanterns.`,`My hands are warm, like five little lanterns.`)],
    ['iska',S(`That's our fire, the Five Flames, riding along with yours. The Obsidian Gate will open for it. But the gate has a guard, and he has never once let anyone pass.`,`That's our fire, riding with yours. The Obsidian Gate will open. But it has a guard.`)]
  ],
  bosses:{
    grizzlefang:{
      intro:[['griz',S(`Hah! A little lizard-boy with a big sword! The Oath wants you brought to the mountain. Nobody said in how many pieces!`,`A lizard kid with a sword! I'll take you to the mountain in pieces!`)],['ash',`Fang you for the offer. I'll walk.`]],
      // (the data in game/story/act1/a1_gate.js plays its own outro, a1_griz_outro, instead of this one)
      outro:[
        ['griz',S(`The Oath... paid in gold... and somebody in your village... opened the gate...`,`The Oath paid... someone in your village opened the gate...`)],
        ['ash',`Somebody in Emberhollow? Who?`],
        ['voice',S(`Little ember. I can smell her fire on you. My fire. Come up the mountain, child, and bring it home.`,`Little ember. You have my fire. Come up the mountain and bring it home.`)],
        ['ash',`...Yara? Did you hear that?`],
        ['yara',S(`(through the shrine stone) I heard him. Go east to Brindlecross, Ash. Sister Wren keeps the old library there.`,`(far away) I heard. Go east to Brindlecross. Find Sister Wren.`)]
      ]},
    morrow:{
      intro:[['morrow',S(`The heir of the First Flame, walking right into our hands! When the Great One has his fire back, he'll make me young again. And a king!`,`The heir of the First Flame! The Great One will make me young again. And a king!`)],['ash',S(`Pretty sure the Great One just wants a snack.`,`I think he just wants a snack.`)]],
      // (the data in game/story/act1/a1_gate.js plays its own outro, a1_morrow_outro, instead of this one)
      outro:[
        ['morrow',S(`You don't understand... he promised... he promised all of us...`,`He promised... he promised all of us...`)],
        ['voice',S(`Morrow served me well. You will serve me better. Keep climbing, little ember.`,`Keep climbing, little ember.`)],
        ['narr',S(`A crumpled letter falls out of Morrow's sleeve. You pick it up.`,`A letter falls out of Morrow's sleeve.`)],
        ['narr',S(`"To W. Leave the North Gate open on Lantern Day and the oil will never run out. The Oath remembers its friends."`,`A letter: open the gate, and get oil forever.`)],
        ch('morrow',S(`Please. I'm an old man who believed a dragon. Isn't that punishment enough?`,`Please. I was silly. Let me go?`),[
          {t:'Let him go',fn:()=>{ G.choices.morrow='free'; },then:[['ash',S(`Go home, Morrow. Find something better to believe in.`,`Go home. Believe in something better.`)],['morrow',S(`I... thank you. I think I'll go somewhere quiet. Maybe grow something that isn't on fire.`,`Thank you. Maybe I'll grow pumpkins.`)]]},
          {t:'Take him to Captain Osric',fn:()=>{ G.choices.morrow='jail'; },then:[['ash',S(`You're coming with me to Brindlecross. Captain Osric can decide.`,`Captain Osric can decide.`)],['narr',S(`You march Morrow all the way to the Brindlecross Watch House. Osric looks thrilled. Morrow looks relieved.`,`You take Morrow to Osric's Watch House.`)]]}
        ])
      ]},
    broodmother:{
      intro:[['brood',S(`Ssssso. The fire-child crawls into my nest, just in time for supper. My children are hungry.`,`The fire-child is in my nest. Just in time for supper!`)],['ash',`Your children need better manners.`]],
      outro:[['brood',`My children... will remember you...`],['voice',S(`You strike down dragons so easily. Are you sure you're not mine?`,`You beat dragons so easily. Are you sure you're not mine?`)],['narr',S(`You don't answer. You look down at your claws for a long time.`,`You don't answer. You look at your claws.`)]]},
    gloamjaw:{
      intro:[['gloam',S(`Mmmmm. A warm little snack, wandering into my bog. You will taste like toast.`,`A warm snack in my bog. You'll taste like toast.`)],['ash',`Why does everybody want to eat me?`]],
      outro:[['gloam',`Too... spicy...`],['voice',S(`The Mire was always weak. No matter. The mountain is patient.`,`The Mire was weak. The mountain can wait.`)]]},
    greymane:{
      intro:[['narr',S(`Out of the snow steps the biggest wolf you have ever seen. Its eyes glow the same orange as the mountain smoke.`,`A giant wolf steps out of the snow. Its eyes glow orange.`)],['ash',`Good doggy? Very good, very large doggy?`]],
      outro:[
        ['narr',S(`The great wolf lies down in the snow. The orange fades from its eyes. It looks at you, tired, and very much a wolf again.`,`The wolf lies down. The orange leaves its eyes. It's just a wolf again.`)],
        ch('narr',`Greymane waits to see what you'll do.`,[
          {t:'Let him go home to his pack',fn:()=>{ G.choices.greymane='home'; },then:[['narr',S(`Greymane licks your face, which is like being hit with a warm, wet blanket, and lopes off into the pines to find his family.`,`Greymane licks your face. Then he runs off to find his family.`)]]},
          {t:'Ask him to stand with you',fn:()=>{ G.choices.greymane='ally'; },then:[['ash',S(`When I go up the mountain... would you come?`,`When I go up the mountain, will you come?`)],['narr',S(`Greymane looks at you for a long time. Then he howls, and far away the pack answers. You have a feeling you'll hear that howl again.`,`Greymane howls. Far away, his pack answers. You will hear that howl again.`)]]}
        ])
      ]},
    cindervane:{
      intro:[['cinder',S(`Stop there, heir of the First Flame. None pass the Obsidian Gate while I still stand.`,`Stop. Nobody passes this gate while I stand.`)],['ash',`Then I guess you'll have to sit down.`]],
      outro:[
        ['cinder',S(`At last. A thousand years I've held this gate. I was Warden Iska's knight. She asked me to wait for an Emberblood strong enough to finish this.`,`At last. I waited a thousand years for someone strong enough.`)],
        ['cinder',S(`You are stronger than I hoped, and kinder than I feared. The gate is yours.`,`You are strong and kind. The gate is yours.`)],
        ch('cinder',S(`My watch is over. Unless you need one more sword.`,`My watch is over. Unless you need my sword.`),[
          {t:'Rest now, Sir Cindervane',fn:()=>{ G.choices.cinder='rest'; },then:[['cinder',S(`Thank you, child. A thousand years is a long time to stand.`,`Thank you. A thousand years is a long time to stand.`)],['narr',S(`The old knight sits down on the steps, takes off his helmet, and is gone, like a fire that has finally been allowed to go out.`,`The old knight sits down, takes off his helmet, and is gone.`)]]},
          {t:'Come with me',fn:()=>{ G.choices.cinder='ally'; },then:[['cinder',S(`Ha! One last fight, then. I will hold the stairs. Nothing that serves him will get past me while you face him.`,`Ha! One last fight. I'll guard the stairs behind you.`)]]}
        ]),
        ['voice',S(`Come up, little ember. Bring me what she took.`,`Come up, little ember. Bring my fire.`)]
      ]},
    vorlaxis:{
      // (x0_vorlaxis.js plays its own intro, VOR_INTRO)
      intro:[
        ['vor',S(`You have her horns. And my fire. Did you climb my mountain to give it back?`,`You have her horns. And my fire.`)],
        ['ash',`Hi, Grandpa.`],
        ['vor',S(`For a thousand years my daughter's children fed my prison with MY fire. Today I take it back.`,`For a thousand years you kept MY fire. Today I take it back.`)],
        ['ash',S(`She gave it to us. It was never yours to take back.`,`She gave it to us. It is not yours to take.`)],
        ['vor',`Then come and take it from me, hatchling.`]
      ],
      outro:[]}
  },
  // ---------- the confrontation with Fennick (The Open Gate; the data in act1/a1_gate.js plays a1_confront instead)
  confront:[
    ['fennick',S(`Ah. You found the badge. And the letter. And the bootprints. You are very thorough, Ash.`,`You found the badge and the letter. Very good, Ash.`)],
    ['fennick',S(`They said if I left the gate open on Lantern Day, I'd have lamp oil that never runs out. Never! Do you know what that means to a lamp man?`,`They promised me oil forever if I left the gate open.`)],
    ['ash',S(`Kobolds burned two houses, Fennick. And the Ward went out.`,`Kobolds burned two houses, Fennick.`)],
    ['fennick',S(`I know. I know. I didn't think. I've been sick about it every day since.`,`I know. I didn't think. I feel sick about it.`)],
    ch('ash',`What should happen to Fennick?`,[
      {t:'Forgive him',fn:()=>{ G.choices.fennick='forgive'; },then:[['ash',`You're going to make it right. Every day.`],['fennick',S(`I will! I'll light every lantern in Emberhollow, every night, forever. And here. They gave me this. It's the key to their tunnel off the Ashen Road.`,`I will! I'll light every lantern. And take their tunnel key.`)]]},
      {t:'Turn him in to Captain Osric',fn:()=>{ G.choices.fennick='jail'; },then:[['ash',`You have to answer for it, Fennick.`],['fennick',S(`...That's fair. Here. They gave me this key. It opens their tunnel off the Ashen Road. Tell Osric I'll come quietly. I'll bring a lamp. For the cell.`,`That's fair. Take their tunnel key. I'll go quietly.`)]]}
    ])
  ],
  moss:{after:[['moss',S(`Tea's on if you want it. Mind your tail near the cauldron.`,`Tea's on. Mind your tail by the pot.`)],['moss',S(`Sedge's stone talks back to me now. Lovely fellow. Terrible at chess.`,`Sedge's stone talks to me now. Bad at chess.`)]]},
  duchess:[['goat',`Meh.`],['ash',S(`Your farmer misses you. Come on, before the wolves notice us.`,`Your farmer misses you. Come on!`)],['goat',`Meeeh.`]],
  maren:{
    hint:[['maren',S(`Find me some star-iron and I can make that blade sing. It fell from the sky long ago and glows blue in the rock. Try the crags, the high snow, and the hills by the Obsidian Gate.`,`Bring me star-iron. It glows blue in the rock. Try the crags, the snow, and the Obsidian Gate hills.`)]],
    reforge:[['maren',S(`Star-iron! Where did you... never mind. Give it here.`,`Star-iron! Give it here.`)],['maren',S(`There. Your blade's a little sharper and a lot shinier. Try not to admire it in every puddle.`,`There. Sharper and shinier.`)]]
  },
  yaraHints:{
    warcamp:S(`Grizzlefang's camp is north of the village, at the edge of the woods. Follow the road.`,`Grizzlefang's camp is north of the village. Follow the road.`),
    wren:S(`Brindlecross is east along the road, on Lake Mirrow. Sister Wren is in the library. And when you're home, come and see me about that gate.`,`Go east to Brindlecross. Find Wren in the library. Then come and see me.`),
    oath:S(`The Ash Ward is northeast of Brindlecross on the Ashen Road, past the Smoky Kettle inn. Watch their fire bolts.`,`The Ash Ward is up the Ashen Road, past the Smoky Kettle.`),
    three:S(`Three Wards left: the Crag Ward in the far east, the Sunken Ward in the Mirefen to the southeast, and the Frost Ward up in the Frostpine Highlands to the northwest.`,`Three Wards left: Crag in the east, Sunken in the southeast, Frost in the northwest.`),
    gate:S(`The Obsidian Gate is due north of Brindlecross, at the end of the long road. Be brave.`,`The Obsidian Gate is north of Brindlecross. Be brave.`),
    summit:S(`Go and see your mother before you climb, Ash. She's been standing in the forge door all evening.`,`See your mom before you climb. She's waiting at the forge.`),
    done:S(`You did it. The whole valley is breathing easier. Go wherever you like now.`,`You did it. Go wherever you like now.`)
  }
};
// ---------- the four endings (finalChoice in a9c_story.js plays one, then heartLines, then the epilogue).
// Each ending has a line from Ember (she watches from the rim) and the grey moth on the throne.
const ENDINGS={
  hero:{title:'The First Flame Falls',n:1,lines:[
    ['ash',`I'm sorry, Grandpa.`],
    ['narr',S(`The First Flame went out like a candle at bedtime. Quietly, and all at once.`,`The First Flame went out like a candle at bedtime.`)],
    ['ember',`(very softly, from the rim) Goodnight, Father.`],
    ['narr',S(`Something grey drifts down onto the empty throne: a moth, with two pale moons painted on her wings. She looks at you for a long moment. Then she flies straight up, toward the moon.`,`A grey moth lands on the empty throne. She looks at you. Then she flies up to the moon.`)]]},
  warden:{title:'The Sixth Warden',n:2,lines:[
    ['ash',S(`I'm not going to destroy you, Grandpa. But I'm not letting you out, either.`,`I won't destroy you, Grandpa. But I won't let you out.`)],
    ['narr',S(`Ash lit a sixth Ward-fire at the top of the mountain, with Emberblood fire. This one would never need a thousand-year deadline, because there would always be an Emberblood to tend it.`,`Ash lit a sixth Ward-fire on top of the mountain. An Emberblood will always tend it.`)],
    ['iska',S(`Welcome, Sixth Warden. It's about time someone younger than eight hundred joined us.`,`Welcome, Sixth Warden. Finally, someone young!`)],
    ['ember',S(`(from the rim) He'll pretend he hates the visits. Visit anyway.`,`He'll say he hates visits. Visit anyway.`)],
    ['narr',S(`A grey moth with two pale moons painted on her wings lands on the arm of the throne, beside the sleeping dragon. She looks at you for a long moment. Then she flies straight up, toward the moon.`,`A grey moth lands by the sleeping dragon. She looks at you. Then she flies up to the moon.`)],
    ['narr',S(`Every Lantern Day after that, Ash climbed the mountain to say goodnight to Grandpa. Sometimes, Grandpa almost said goodnight back.`,`Every Lantern Day, Ash climbed up to say goodnight. Sometimes Grandpa almost said it back.`)]]},
  heir:{title:'The New Dragon',n:3,lines:[
    ['ash',S(`Fine. If it's fire you want to fight over, I'll take it. All of it.`,`Fine. I'll take your fire. All of it.`)],
    ['narr',S(`The First Flame poured into Ash, and Ash grew, and grew, until the crater was a bathtub and the black throne was a footstool.`,`The fire poured into Ash. He grew, and grew, and grew.`)],
    ['ember',S(`(from the rim, quietly) That's all of it, Ash. It made him so lonely. Don't let it do that to you.`,`That's all his fire. It made him lonely. Be careful.`)],
    ['narr',S(`A grey moth with two pale moons painted on her wings lands on the empty throne. She looks up at you, all the way up. Then she flies straight up, toward the moon.`,`A grey moth lands on the empty throne. She looks up at you. Then she flies to the moon.`)]]},
  lantern:{title:'The Lantern',n:4,
    // the option (finalChoice) shows only when it is earned (v12: hidden, not greyed). why() says what is missing, in
    // story words, for the test hook j3why only; the player never sees it.
    opt:S('Light a lantern for him, like Ember did.','Light a lantern for him.'),
    why:()=>{ const pages=Object.keys(G.pages||{}).length, kind=Object.values(G.choices||{}).filter(v=>v==='free'||v==='forgive'||v==='home').length;
      if(pages<5) return S(`You don't know enough of Ember's story yet.`,`You don't know enough of Ember's story.`);
      if(!(G.pages&&G.pages.p9)) return S(`You never found the letter Ember wrote to her father.`,`You never found Ember's letter.`);
      if(kind<2) return S(`Ember's way needs mercy, and you have not shown enough of it.`,`Ember's way needs more kindness.`);
      return ''; },
    lines:[
    ['narr',S(`You take out a small paper lantern, the kind they hang on the green every Lantern Day, and you light it.`,`You take out a little paper lantern and light it.`)],
    ['ash',S(`Ember lit one of these for you every year, Grandpa. Not to keep you asleep. So you'd know where home was.`,`Ember lit one for you every year. So you'd know where home was.`)],
    ['vor',`...She did?`],
    ['ash',S(`She wrote it down. "Not as a king. Just as my father."`,`She wrote: "Not as a king. Just as my father."`)],
    ['narr',S(`The great dragon looked at the little lantern for a very long time. Then the anger went out of him, the way a fire goes out when nobody is feeding it. What was left was small, warm, and very, very old.`,`The dragon looked at the lantern a long time. The anger went out of him. He got small, warm and old.`)],
    ['ember',S(`(from the rim, very quietly) I used to fold them just like that.`,`I used to fold them just like that.`)],
    ['vor',S(`Is there cake? At this festival of yours?`,`Is there cake at this festival?`)],
    ['narr',S(`On the empty throne, a grey moth with two pale moons painted on her wings sits watching the little lantern. Then she flies straight up, toward the moon.`,`A grey moth sits on the empty throne, watching the lantern. Then she flies to the moon.`)],
    ['narr',S(`Grandpa came home for Lantern Day. He was about the size of a goat. Duchess did not approve. Mom made him wipe his feet.`,`Grandpa came home, the size of a goat. Mom made him wipe his feet.`)]]}
};
const EPILOGUE_FMT=()=>{
  const L=[], c=G.choices, q=id=>G.quests[id]&&G.quests[id].done;
  if(c.fennick==='forgive') L.push(['narr',S(`Fennick Wick kept his promise. Every night, every lantern in Emberhollow was lit, and nobody's gate was ever left open again.`,`Fennick lit every lantern in Emberhollow, every night.`)]);
  else if(c.fennick==='jail') L.push(['narr',S(`Fennick Wick served his time in the Watch House, polishing Captain Osric's lamps. He came out a better man, and a much better polisher.`,`Fennick served his time, polishing Osric's lamps. He came out a better man.`)]);
  if(c.morrow==='free') L.push(['narr',S(`Morrow grew prize-winning pumpkins near Granny Moss's hut. None of them were on fire. He was very proud.`,`Morrow grew prize pumpkins near Granny Moss's hut.`)]);
  else if(c.morrow==='jail') L.push(['narr',S(`Morrow became the Watch House librarian. He organized the cells alphabetically.`,`Morrow became the Watch House librarian.`)]);
  if(c.greymane==='ally') L.push(['narr',S(`Greymane and his pack ran the high snow again, and every Lantern Day they howled from the ridge, right on cue.`,`Every Lantern Day, Greymane's pack howled from the ridge.`)]);
  else if(c.greymane==='home') L.push(['narr',S(`Greymane went home to his pack, and Frostpine was a little safer, and a lot louder at night.`,`Greymane went home to his pack. Frostpine was louder at night.`)]);
  if(c.cinder==='ally') L.push(['narr',S(`Sir Cindervane took one last look at the valley he had guarded for a thousand years, said "good," and finally sat down.`,`Sir Cindervane looked at the valley, said "good," and finally sat down.`)]);
  else if(c.cinder==='rest') L.push(['narr',S(`Someone put flowers on Sir Cindervane's helmet at the Obsidian Gate. They were there every year after.`,`Every year, someone puts flowers on Sir Cindervane's helmet.`)]);
  if(q('bun')) L.push(['narr',S(`Bertram and Tilly Crumb opened a bakery-inn together, and argued happily about crusts every morning.`,`Bertram and Tilly opened a bakery-inn together.`)]);
  if(q('hollow')) L.push(['narr',S(`Juniper Ashby finished her map of every cave in Embermere. Rook got to hold the pencil.`,`Juniper finished her cave map. Rook held the pencil.`)]);
  if(q('mine')) L.push(['narr',S(`Coppergulch Mine rang with picks again, and the ore came down to Maren's forge in spring, like always.`,`Coppergulch Mine was busy again, and the ore came to Mom's forge.`)]);
  if(q('lure')) L.push(['narr',S(`Dell sailed the Soggy Biscuit Two across Lake Mirrow, wearing his ring, catching nothing, perfectly happy.`,`Dell sailed his boat on Lake Mirrow, catching nothing, very happy.`)]);
  if(q('duchess')) L.push(['narr',S(`Duchess the goat lived a long life full of opinions.`,`Duchess the goat lived a long, bossy life.`)]);
  if(G.flags.pip) L.push(['pip',`Mip!`]);
  { const ev2=evEpilogue(); if(ev2) L.push(ev2); }
  L.push(['narr',S(`And that night, Mom left one lantern burning in the window. One more than she needed. Just in case.`,`That night, Mom left a lantern burning in the window. Just in case.`)]);
  return L;
};
// v6 weapons: Mom offers to forge a hammer (forgeHammerTalk in a6b_weapons.js)
Object.assign(STORY.maren,{
  hammerOffer:[['maren',S(`Ash. Come here. I've had an idea, and it's heavy.`,`Ash. Come here. I have a heavy idea.`)],['maren',S(`Grandma's blade is lovely. But some things in this valley need hitting with something less lovely. Cracked walls. Knights with big shields. Rocks that look at you funny.`,`Some things need hitting with something heavier. Cracked walls. Big shields.`)],['maren',S(`I can forge you a hammer. One star-iron, or 150 coins for the good iron. What do you say?`,`I can make you a hammer. One star-iron, or 150 coins.`)]],
  hammerMade:[['narr',S(`Mom hums and the forge roars. Clang, clang, CLANG. It takes about four seconds. Mom is very good at this.`,`Clang, clang, CLANG! Mom is very good at this.`)],['maren',S(`There. The Forge Hammer. Hold your swing and it winds up a bigger smash. Smash walls and shields. Not the house.`,`The Forge Hammer! Hold your swing for a big smash. Not on the house.`)]]
});
// ---------- Ember's Trials (a2h_dungeons.js). Ember speaks inside each one, a warm voice in the walls.
Object.assign(STORY,{
  trial_leap_sealed:[['narr',S(`A stone arch, half swallowed by roots. Three runes are carved over the door, cold and grey.`,`An old stone door in the roots. Three cold runes.`)],['narr',S(`In the middle of the door is a carved flame, with tiny claw marks all around it, as if someone small once knocked and knocked.`,`A carved flame, with tiny claw marks all around it.`)],['ash',`Hello? Anybody home?`],['narr',S(`Nothing. Elder Yara might know what this place is.`,`Nothing. Ask Elder Yara.`)]],
  trial_tide_sealed:[['narr',S(`White stone doors, crusted with shells. Carved fish swim all over them. Their eyes are closed.`,`White doors with carved fish. Their eyes are closed.`)],['narr',S(`The runes over the door are sleeping. Maybe they wake up later. Maybe they're just not morning runes.`,`The runes are asleep. Maybe they wake up later.`)]],
  trial_sky_sealed:[['narr',S(`A gate of white and gold stone, standing all alone on the crag. The wind whistles through it like a flute.`,`A white and gold gate on the crag. The wind whistles.`)],['narr',S(`The runes are dark. Somewhere far away, something with very big wings is waiting for you to be ready.`,`The runes are dark. Something with big wings is waiting.`)]],
  trial_leap_in:[['ember',`Oh! You came. Hello.`],['ash',`Who said that?`],['ember',S(`I did. Up here. Well, sort of everywhere. I'm Ember. A very long time ago I built this place for my children, so their dragon gifts could wake.`,`Up here! I'm Ember. I built this place for my children long ago.`)],['ember',S(`Nobody has opened these doors in a thousand years. Nobody had the fire. You do. You're so warm.`,`Nobody had the fire to open it. You do.`)],['ash',S(`Wait. Ember? The Ember? From the puppet show?`,`Wait. Ember? From the puppet show?`)],['ember',S(`There's a puppet show? ...Is my puppet pretty?`,`There's a puppet show? Is my puppet pretty?`)],['ember',S(`This is the Trial of the Leap. Find my shrine in the middle. Mind the pits, and the roots, and Old Gnarl. Mostly Old Gnarl.`,`This is the Trial of the Leap. Find my shrine. Mind Old Gnarl!`)]],
  trial_leap_shrine:[['ember',S(`There it is. My flame. I left a little of it here for whoever came.`,`There it is. My flame. I left it for you.`)],['ember',S(`My father thinks fire is something you keep. It isn't. It only stays lit if you hand it on. So. Here.`,`Father thinks you keep fire. You don't. You hand it on. Here.`)]],
  trial_leap_gift:[['narr',S(`You touch the flame. It doesn't burn. It tickles.`,`You touch the flame. It tickles.`)],['narr',S(`Warmth runs all the way down into your feet. Your tail flicks. Your knees feel... springy.`,`Warmth runs into your feet. Your knees feel springy.`)],['ember',S(`The Leap! Now you can jump over pits, spikes, and roots that trip you on purpose. Run first, and you will jump even farther.`,`The Leap! Jump over pits and spikes. Run first to jump farther.`)],['ash',`I'm going to jump on EVERYTHING.`],['ember',`I know. My children said that too.`]],
  trial_leap_how:`Press C, the JUMP button, or A on a controller. Sprint first to leap farther.`,
  trial_leap_item:[['narr',S(`You heave open the great chest. Inside, wrapped in leaves that never went brown, is a curved piece of red-gold wood.`,`In the great chest: a curved piece of red-gold wood.`)],['ember',S(`My Wing-rang! I carved it from the old oak by the village. Throw it, and it always comes home. Like children. Eventually.`,`My Wing-rang! Throw it, and it always comes home.`)],['ember',S(`It can strike things your claws cannot reach. Crystal switches across the pits, for example. Hint, hint.`,`It hits things you can't reach. Like crystal switches over pits.`)]],
  trial_leap_itemhow:`Switch weapons (X, or tap the weapon at the top of the screen), then throw it. It flies over pits and comes back.`,
  trial_leap_bossline:S(`Old Gnarl! When he stomps, JUMP the rings. Then hit the glowing knot on his back. And roots burn, Ash. Roots burn.`,`Old Gnarl! Jump the rings. Hit the glowing knot. Roots burn!`),
  trial_leap_won:[['narr',S(`Old Gnarl creaks, wobbles, and sits down with a sound like a whole forest sighing.`,`Old Gnarl creaks and sits down with a big sigh.`)],['narr',S(`A little green sprout pops out of the top of his head. He looks... happy?`,`A green sprout pops out of his head. He looks happy.`)],['ember',S(`Thank you, old friend. You guarded this place for a thousand years. You can rest now. Grow some acorns.`,`Thank you, old friend. Rest now. Grow some acorns.`)],['ember',S(`Go on, Ash. Through the door. Something is waiting for you.`,`Go on, Ash. Through the door.`)]],
  trial_leap_end:[['ember',S(`You passed the Trial of the Leap! If I still had feet, I'd be dancing on them.`,`You passed! If I had feet, I would dance.`)],['ember',S(`Take a little more of my fire. It will make you stronger.`,`Take a little more of my fire.`)],['ember',S(`Two more Trials are waiting. The Trial of the Tide sleeps on the island in Lake Mirrow. You'll need your new legs to get there.`,`Next: the Trial of the Tide, on the island in Lake Mirrow.`)],['narr',S(`Step into the warp ring to go back outside.`,`Step into the ring to go outside.`)]],
  trial_tide_in:[['ember',S(`Ash! You found the island. Did you jump the broken pier? I made it broken on purpose. All right, time made it broken. I'm taking the credit.`,`Ash! You found the island. Did you jump the broken pier?`)],['ember',S(`This is the Trial of the Tide. The water here is old, and clever. Watch how it rises and falls.`,`This is the Trial of the Tide. Watch the water rise and fall.`)],['ember',S(`My shrine is in the middle. The Mirrow Serpent waits at the end. He is very big, and very wet, and he never stops splashing.`,`My shrine is in the middle. The Mirrow Serpent waits at the end.`)]],
  trial_tide_shrine:[['ember',`My flame again. This one remembers the lake.`],['ember',S(`Water usually puts fire out. Not ours. Ours walks right across it.`,`Water puts fire out. Not ours.`)]],
  trial_tide_gift:[['narr',S(`The flame pours over you like warm rain. Steam curls off your scales.`,`The flame pours over you like warm rain.`)],['narr',S(`You look down. The water in the pools shivers away from your feet, like it's shy.`,`The water moves away from your feet.`)],['ember',S(`Water Stride! Now deep water will hold you up, as long as you keep walking. Running on water is hard work, so mind your breath.`,`Water Stride! Walk on deep water. Running on it tires you out.`)],['ash',S(`Can I walk across Lake Mirrow? The whole lake?`,`Can I walk across the whole lake?`)],['ember',S(`The whole lake. Wave to the fish for me.`,`The whole lake. Wave to the fish.`)]],
  trial_tide_how:S(`Just walk onto deep water. With Water Stride it holds you up. Sprinting on water burns stamina fast.`,`Walk onto deep water. It holds you up. Running tires you.`),
  trial_tide_item:[['narr',S(`The great chest opens with a soft click. Inside lies a bow of pale driftwood, strung with something that shines like moonlight on water.`,`In the great chest: a driftwood bow with a shining string.`)],['ember',S(`My bow! I made the string out of a moonbeam. The moon owed me a favor.`,`My bow! The string is a moonbeam.`)],['ember',S(`Arrows fly straight and far. Stone eyes that won't open for claws will open for an arrow.`,`Arrows fly far. Shoot the stone eyes to open them.`)]],
  trial_tide_itemhow:`Switch to the bow (X, or tap the weapon at the top of the screen), then shoot. Arrows wake the stone eyes.`,
  trial_tide_bossline:S(`The Mirrow Serpent! Stride out to his head when he comes up for air. And keep out of the whirlpool!`,`The Serpent! Walk out to his head. Stay out of the whirlpool!`),
  trial_tide_won:[['narr',S(`The Mirrow Serpent sinks down, down, down... then bobs back up and floats on its back like a very large, very embarrassed noodle.`,`The Serpent sinks. Then it floats up on its back like a noodle.`)],['narr',S(`It blows one big bubble at you. Then it swims off into the deep, humming.`,`It blows a bubble at you and swims off, humming.`)],['ember',S(`He always loved a good game of splash. Thank you for playing with him, Ash.`,`He loves splashing games. Thank you for playing with him.`)]],
  trial_tide_end:[['ember',S(`Two Trials! You're as stubborn as I was. That's a compliment.`,`Two Trials! You are stubborn, like me. That's good.`)],['ember',S(`The last one is the hardest. The Trial of the Sky waits on the crag in the Drakeling Crags, behind a moat far too wide to jump.`,`The last one is the Trial of the Sky, in the Drakeling Crags.`)],['ash',`But not too wide to walk on.`],['ember',`Exactly. You're quick.`],['narr',S(`Step into the warp ring to go back outside.`,`Step into the ring to go outside.`)]],
  trial_sky_in:[['ember',S(`You walked across the moat! I watched. You looked very heroic. You also slipped once. I won't tell anyone.`,`You walked across the moat! You slipped once. I won't tell.`)],['ember',S(`This is the Trial of the Sky, my last and my favorite. Here the wind is the floor and the clouds are the walls.`,`This is the Trial of the Sky, my favorite.`)],['ember',S(`You'll need my Wing-rang and my bow. And at the very top waits Skrae, the Storm Wyvern. She is fast, and she is loud.`,`Bring the Wing-rang and the bow. Skrae the Storm Wyvern waits at the top.`)]],
  trial_sky_shrine:[['ember',S(`My last flame. I flew, once. My children flew. Now it's your turn.`,`My last flame. Now it's your turn to fly.`)]],
  trial_sky_gift:[['narr',S(`The flame rushes into you with a roar like wind in a chimney.`,`The flame rushes into you like wind.`)],['narr',S(`Something unfolds on your back. Two wings, small and warm and very, very real.`,`Two small, warm wings unfold on your back.`)],['ash',S(`I have wings. Actual WINGS. Rook is going to be so jealous.`,`I have WINGS! Rook will be so jealous.`)],['ember',S(`Wings! Jump, then jump again in the air to take off. They get tired, so land now and then to let them rest.`,`Jump, then jump again in the air to fly. Land to rest your wings.`)],['ember',S(`Chasms can't stop you now. Walls can. Please don't fly into walls.`,`Gaps can't stop you now. Walls can. Mind the walls.`)]],
  trial_sky_how:`Jump, then press JUMP again in the air to fly. Press it once more to land. Watch your flight meter.`,
  trial_sky_item:[['narr',`The great chest opens.`]],
  trial_sky_itemhow:``,
  trial_sky_bossline:S(`Skrae! Arrows and the Wing-rang reach her in the air. When she lands on a perch, fly in close and strike!`,`Skrae! Shoot her in the air. When she lands, fly close and hit!`),
  trial_sky_won:[['narr',S(`Skrae spirals down and lands on a perch with a thump. She shakes her head, and a little storm cloud puffs out of one ear.`,`Skrae lands with a thump. A little storm cloud puffs out of her ear.`)],['narr',S(`She looks at you for a long time. Then she bows her long neck, very low.`,`She looks at you. Then she bows her long neck.`)],['ember',S(`She waited a thousand years for someone to fly with her. Thank you, Ash.`,`She waited so long for someone to fly with. Thank you.`)]],
  trial_sky_end:[['ember',S(`All three Trials. Leap, Tide and Sky. Nobody has done that in a thousand years.`,`All three Trials! Nobody did that in a thousand years.`)],['ember',S(`I built these so my children would be ready when it mattered. I never got to see one of them finish. Now I have.`,`I built these for my children. I never saw one finish. Now I have.`)],['ember',S(`Go home, Ash. Tell Elder Yara. And give your mother a hug from me. A big one.`,`Go home. And give your mother a big hug from me.`)],['narr',S(`Step into the warp ring to go back outside.`,`Step into the ring to go outside.`)]],
  trial_puff_meet:[['narr',S(`On the little stone perch, a drakeling hatchling no bigger than a loaf of bread is crying tiny puffs of smoke.`,`A tiny drake on the perch is crying puffs of smoke.`)],['narr',S(`It sees you, squeaks, and jumps straight into your arms.`,`It squeaks and jumps into your arms.`)],['ash',`Hey, hey. Are you lost? Where's your nest?`],['narr',S(`"Peep," says the hatchling, and points its whole face toward the east. You decide its name is Puff.`,`"Peep," it says, and points east. You call it Puff.`)]],
  trial_puff_home:[['narr',S(`Puff spots the nest, squeals, and tumbles in. Two big drakelings peek over the edge and give you a long, grateful look.`,`Puff tumbles into the nest. Two big drakes look at you, grateful.`)],['narr',S(`Puff waves one tiny wing at you. Then Puff falls asleep, immediately, mid-wave.`,`Puff waves a tiny wing. Then falls asleep mid-wave.`)]]
});
// test hook (v11 J3): play an Act I or Lantern Night scene by name, to read it on screen
window.__ebDbg=Object.assign(window.__ebDbg||{},{j3play:k=>{
  const end=/^end:(\w+)$/.exec(k), path=s=>{ let o=STORY; for(const p of s.split('.')) o=o&&o[p]; return o; };
  const L=end?ENDINGS[end[1]].lines.concat(heartLines(end[1]),EPILOGUE_FMT()):k==='fest'?festIntroLines(false):k==='theft'?theftLines():k==='cliff'?cliffLines():k==='gear'?gearLines():k==='sendoff'?sendOffLines()
    :/^clue:/.test(k)?CLUE_TALK[k.slice(5)]():/^dream:/.test(k)?DREAMS[k.slice(6)].lines():k==='letter'?letterLines():path(k);
  runDialogue(L,()=>{ scene='play'; }); return Array.isArray(L)?L.length:0; },
  j3why:()=>simplify(String(ENDINGS.lantern.why()||''))});
