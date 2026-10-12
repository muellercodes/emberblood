
// ================= story script
// Lines are [speaker, text]. A line can also be {who, text, opts:[{t, fn, then:[lines]}]} for a choice.
const ch=(who,text,opts)=>({who,text,opts});
const STORY={
  prologue:[
    ['narr',`A thousand years ago, the dragon Vorlaxis, the First Flame, ruled the valley of Embermere. Nothing grew. Nothing was cozy. It was a terrible time for picnics.`],
    ['narr',`Five Wardens rose against him: Iska, Bram, Oriel, Sedge and Tove. You cannot kill a dragon made of fire. So they did the next best thing. They split his flame in two.`],
    ['narr',`Half stayed with Vorlaxis, chained in sleep under Cinder Mountain. The other half went to his own daughter, Ember, who loved the valley more than she feared her father. Her children were the Emberbloods.`],
    ['narr',`Five Ward-fires, lit with Ember's flame, held the chains. The Wardens wrote that the binding would last a thousand years. After that, someone would have to finish the job.`],
    ['narr',`Every year since, the valley has lit lanterns on Lantern Day. Most people forgot why. A thousand years later, most Emberbloods had nothing left but warm hands and a talent for campfires.`],
    ['narr',`Then Ash was born. With horns, a tail, and real fire.`],
    ['maren',`Ash! Up and at it! It's Lantern Day. The thousandth one! And Emberhollow's official lantern-lighter is still snoring.`],
    ['ash',`Official lantern-lighter. Also official chimney sweep. Also, one time, official bakery remover.`],
    ['maren',`We agreed never to speak of the bakery. Come by the forge before the festival. I finished something for you.`]
  ],
  forge:[
    ['maren',`There you are. Hold out your claws.`],
    ['maren',`This was your grandmother's sword, and her grandmother's before that, all the way back to Ember herself, if you believe the family stories.`],
    ['maren',`Grandma used to say it was made for "the one who comes at the end of the thousand years." I always thought she was being dramatic.`],
    ['ash',`It's beautiful. Is it fireproof?`],
    ['maren',`It is now. The three festival lanterns are on the green. Give each one a gentle breath. Gentle, Ash.`]
  ],
  lanternsDone:[
    ['yara',`Beautiful work, Ash. A thousand Lantern Days, and they never looked so bright.`],
    ['ash',`And not a single bakery was harmed.`],
    ['narr',`Then the north gate creaked open. Nobody remembered leaving it unlocked.`],
    ['yara',`Kobolds! In the village! Ash, drive them out!`]
  ],
  lore:[
    ['yara',`You fought like a dragon out there. I suppose that's no surprise.`],
    ['yara',`Sit down, Ash. It's time you heard the real story. Not the festival version with the puppet show.`],
    ['yara',`Vorlaxis isn't just any dragon. Ember was his daughter. That makes him your ${GREATS}grandfather.`],
    ['ash',`...You just said "great" thirteen times.`],
    ['yara',`I counted on my fingers. Twice. And here's the part the puppet show leaves out: the binding was made to last a thousand years. This is the thousandth Lantern Day.`],
    ['ash',`So the chains are about to...`],
    ['yara',`Fall off. Yes. That isn't a coincidence, Ash. That's a deadline.`],
    ['yara',`The Hollow Ward under the old oak went dark when the kobolds came. Relight it. Breathe on the ward stone and don't stop until it catches.`]
  ],
  ward_hollow:[
    ['iska',`Ah. Warm again. Thank you, little ember.`],
    ['ash',`Did the rock just talk?`],
    ['iska',`I am Iska, first of the Five Wardens. Or what's left of me. We tied our spirits to the Ward-fires so someone would always be watching.`],
    ['iska',`When the thousand years end, the chains fall away. If the five Wards are burning, he wakes weak and slow, and an Emberblood can face him. If they are dark, he wakes at full strength.`],
    ['iska',`And he will come for the half of his fire you carry. That's what he wants, Ash. Not the valley. You.`],
    ['iska',`A cult called the Scaled Oath has been snuffing the Wards. Their kobolds answer to a chieftain named Grizzlefang. His war camp is in the woods north of the village. Start there.`]
  ],
  wren:[
    ['wren',`Ash Emberblood? Wonderful. Yara's crow said you'd come. Mind the books, they bite. Not literally. Mostly.`],
    ['wren',`Five Wards hold the chains. Hollow, which you relit. The Ash Ward on the Ashen Road. The Crag Ward up with the drakelings. The Sunken Ward in the Mirefen. And the Frost Ward in the Frostpine Highlands.`],
    ['wren',`The Scaled Oath holds the Ash Ward now. Their High Priest, Morrow, is trying to put it out for good. That's your next stop.`],
    ['ash',`And when all five are burning again?`],
    ['wren',`Then the Obsidian Gate will open for the one who carries their fire, and you can walk up the mountain and have a very serious talk with your grandfather.`],
    ['ash',`Great. Great-great. Great-great-great...`],
    ['wren',`Please don't. Yara warned me about that.`]
  ],
  ward_ash:[
    ['bram',`Hah! Fire in the old stones again! Bram's the name. I was the Warden with the big hammer and the bigger mouth.`],
    ['bram',`Three Wards left, kid. Crag, Mire and Frost. Take them in whatever order you like. Just don't take them lightly.`],
    ['bram',`And, uh, while you're out there, the people of this valley could use a hand. Wards are important. So are neighbours.`]
  ],
  ward_crag:[
    ['oriel',`Welcome, Emberblood. I am Oriel. I watched over these crags, and the dragons who nest in them.`],
    ['oriel',`Not every dragon is your enemy. Look.`],
    ['narr',`One last egg cracks open. A tiny drakeling tumbles out, sneezes a spark, and decides you are its mother.`],
    ['ash',`Oh no. Oh no, it's adorable. I'm calling you Pip.`],
    ['pip',`Mip!`]
  ],
  ward_mire:[
    ['sedge',`Oh! Oh, hello. Sorry, I've been sitting in a swamp for a thousand years. I'm Sedge. Warden of the Mire. And of mud, mostly.`],
    ['sedge',`Thank you, Ash. Granny Moss has been talking to my stone for years. She's lovely. Bring her some tea sometime.`]
  ],
  ward_frost:[
    ['tove',`Brr. Finally. I'm Tove. I had the coldest post of all five Wardens, and I would like that noted.`],
    ['tove',`Greymane was a good wolf before the Oath poisoned him with dragon smoke. Whatever you chose for him, you chose with your heart. Thank you.`]
  ],
  allWards:[
    ['iska',`All five Wards burn again, Ash. Can you feel it?`],
    ['ash',`My hands are warm. Warmer than usual.`],
    ['iska',`That's our fire, the Five Flames, riding along with yours. The Obsidian Gate will open for it. But the gate has a guard, and he has never once let anyone pass.`]
  ],
  bosses:{
    grizzlefang:{
      intro:[['griz',`Hah! A little lizard-person with a big sword. The Oath wants you brought to the mountain. I'll bring you in pieces!`],['ash',`You can try.`]],
      outro:[
        ['griz',`The Oath... paid in gold... and the lamp-man... left the gate open...`],
        ['ash',`Lamp-man? What lamp-man?`],
        ['voice',`Little ember. I can smell Ember's blood on you. Come to the mountain, child. Bring back what she took from me.`],
        ['ash',`Okay. That is extremely creepy.`],
        ['yara',`(through the shrine stone) That was him, Ash. Go east to Brindlecross, the market town on Lake Mirrow. Sister Wren keeps the old library there. If anyone knows where the other Wards are, it's her.`]
      ]},
    morrow:{
      intro:[['morrow',`The heir of the First Flame, walking right into our hands. When the Great One has his fire back, he'll make me young again!`],['ash',`Pretty sure the Great One just wants a snack.`]],
      outro:[
        ['morrow',`You don't understand... he promised... he promised all of us...`],
        ['voice',`Morrow served me well. You will serve me better. Keep climbing, little ember.`],
        ['narr',`A crumpled letter falls out of Morrow's sleeve. You pick it up.`],
        ['narr',`"To W., the lamp-man of Emberhollow. Leave the north gate open on Lantern Night and the oil will never run out. The Oath remembers its friends."`],
        ch('morrow',`Please. I'm an old man who believed a dragon. Isn't that punishment enough?`,[
          {t:'Let him go',fn:()=>{ G.choices.morrow='free'; },then:[['ash',`Go home, Morrow. Find something better to believe in.`],['morrow',`I... thank you. I think I'll go somewhere quiet. Maybe grow something that isn't on fire.`]]},
          {t:'Take him to Captain Osric',fn:()=>{ G.choices.morrow='jail'; },then:[['ash',`You're coming with me to Brindlecross. Captain Osric can decide.`],['narr',`You march Morrow all the way to the Brindlecross Watch House. Osric looks thrilled. Morrow looks relieved, honestly.`]]}
        ])
      ]},
    broodmother:{
      intro:[['brood',`Ssssso. The little ember crawls into my nest. My children are hungry.`],['ash',`Your children need better manners.`]],
      outro:[['brood',`My children... will remember you...`],['voice',`You strike down dragons so easily. Are you sure you're not mine?`],['ash',`I'm nothing like you.`]]},
    gloamjaw:{
      intro:[['gloam',`Mmmmm. A warm little ember, wandering into my bog. You will taste like toast.`],['ash',`Why does everybody want to eat me?`]],
      outro:[['gloam',`Too... spicy...`],['voice',`The Mire was always weak. No matter. The mountain is patient.`]]},
    greymane:{
      intro:[['narr',`Out of the snow steps the biggest wolf you have ever seen. Its eyes glow the same orange as the mountain smoke.`],['ash',`Good doggy? Very good, very large doggy?`]],
      outro:[
        ['narr',`The great wolf lies down in the snow. The orange fades from its eyes. It looks at you, tired and very much a wolf again.`],
        ch('narr',`Greymane waits to see what you'll do.`,[
          {t:'Let him go home to his pack',fn:()=>{ G.choices.greymane='home'; },then:[['narr',`Greymane licks your face, which is like being hit with a warm, wet blanket, and lopes off into the pines to find his family.`]]},
          {t:'Ask him to stand with you',fn:()=>{ G.choices.greymane='ally'; },then:[['ash',`When I go up the mountain... would you come?`],['narr',`Greymane looks at you for a long time. Then he howls, and far away the pack answers. You have a feeling you'll hear that howl again.`]]}
        ])
      ]},
    cindervane:{
      intro:[['cinder',`Halt, heir of the First Flame. None pass the Obsidian Gate while I still stand.`],['ash',`Then I guess you'll have to sit down.`]],
      outro:[
        ['cinder',`At last... A thousand years I've held this gate. I was Warden Iska's knight. She asked me to wait for an Emberblood strong enough to finish this.`],
        ['cinder',`You are stronger than I hoped. And kinder than I feared. The gate is yours.`],
        ch('cinder',`My watch is over. Unless you need one more sword.`,[
          {t:'Rest now, Sir Cindervane',fn:()=>{ G.choices.cinder='rest'; },then:[['cinder',`Thank you, child. A thousand years is a long time to stand.`],['narr',`The old knight sits down on the steps, takes off his helmet, and is gone, like a fire that has finally been allowed to go out.`]]},
          {t:'Come with me',fn:()=>{ G.choices.cinder='ally'; },then:[['cinder',`Ha! One last fight, then. I will hold the stairs. Nothing that serves him will get past me while you face him.`]]}
        ]),
        ['voice',`Come up, little ember. Your grandfather is waiting.`]
      ]},
    vorlaxis:{
      intro:[
        ['vor',`So. You are what Ember's line became. Small. Soft. Barely a spark.`],
        ['ash',`Hi, Grandpa. Great-great-great-great... you know what, I'm not saying all of it.`],
        ['vor',`For a thousand years my daughter's children fed my prison with MY fire. Today I take it back.`],
        ['ash',`She gave it to us. It was never yours to take back.`],
        ['vor',`Then come and take it from me, hatchling.`]
      ],
      outro:[]}
  },
  // ---------- the confrontation with Fennick (The Open Gate)
  confront:[
    ['fennick',`Ah. You found the badge. And the letter. And the bootprints. You are very thorough, Ash.`],
    ['fennick',`They said if I left the gate open on Lantern Night, I'd have lamp oil that never runs out. Never! Do you know what that means to a lamp man?`],
    ['ash',`Kobolds burned half the village, Fennick.`],
    ['fennick',`I know. I know. I didn't think. I'm so sorry, Ash. I'm so, so sorry.`],
    ch('ash',`What should happen to Fennick?`,[
      {t:'Forgive him',fn:()=>{ G.choices.fennick='forgive'; },then:[['ash',`You're going to make it right. Every day.`],['fennick',`I will! I'll light every lantern in Emberhollow, every night, forever. And here. They gave me this. It's the key to their tunnel off the Ashen Road.`]]},
      {t:'Turn him in to Captain Osric',fn:()=>{ G.choices.fennick='jail'; },then:[['ash',`You have to answer for it, Fennick.`],['fennick',`...That's fair. Here. They gave me this key. It opens their tunnel off the Ashen Road. Tell Osric I'll come quietly. I'll bring a lamp. For the cell.`]]}
    ])
  ],
  moss:{after:[['moss',`Tea's on if you want it. Mind your tail near the cauldron.`],['moss',`Sedge's stone talks back to me now. Lovely fellow. Terrible at chess.`]]},
  duchess:[['goat',`Meh.`],['ash',`Your farmer misses you. Come on, before the wolves notice us.`],['goat',`Meeeh.`]],
  maren:{
    hint:[['maren',`Find me some star-iron and I can make that blade sing. It fell from the sky long ago and glows blue in the rock. Try the crags, the high snow, and the hills by the Obsidian Gate.`]],
    reforge:[['maren',`Star-iron! Where did you... never mind. Give it here.`],['maren',`There. Your blade's a little sharper and a lot shinier. Go make me proud. And eat something.`]]
  },
  yaraHints:{
    warcamp:`Grizzlefang's camp is north of the village, at the edge of the woods. Follow the road.`,
    wren:`Brindlecross is east along the road, on the shore of Lake Mirrow. Sister Wren is in the library.`,
    oath:`The Ash Ward is northeast of Brindlecross on the Ashen Road, past the Smoky Kettle inn. Watch their fire bolts.`,
    three:`Three Wards left: the Crag Ward in the far east, the Sunken Ward in the Mirefen to the southeast, and the Frost Ward up in the Frostpine Highlands to the northwest.`,
    gate:`The Obsidian Gate is due north of Brindlecross, at the end of the long road. Be brave.`,
    summit:`The summit is beyond the gate, past the lava. Come home safe, Ash.`,
    done:`You did it. The whole valley is breathing easier. Go wherever you like now.`
  }
};
// ---------- the four endings
const ENDINGS={
  hero:{title:'The First Flame Falls',n:1,lines:[
    ['ash',`It's not your fire anymore, Grandpa. It's ours.`],
    ['narr',`The First Flame went out like a candle at bedtime. Quietly, and all at once.`],
    ['narr',`With the dragon gone, the Five Wardens could finally rest. Their Ward-fires burned on, gentle and warm, needing nothing but a little care.`]]},
  warden:{title:'The Sixth Warden',n:2,lines:[
    ['ash',`I'm not going to destroy you, Grandpa. But I'm not letting you out, either.`],
    ['narr',`Ash lit a sixth Ward-fire at the top of the mountain, with Emberblood fire. This one would never need a thousand-year deadline, because there would always be an Emberblood to tend it.`],
    ['iska',`Welcome, Sixth Warden. It's about time someone younger than eight hundred joined us.`],
    ['narr',`Every Lantern Day after that, Ash climbed the mountain to say goodnight to Grandpa. Sometimes, Grandpa almost said goodnight back.`]]},
  heir:{title:'The New Dragon',n:3,lines:[
    ['ash',`Fine. If it's fire you want to fight over, I'll take it. All of it.`],
    ['narr',`The First Flame poured into Ash, and Ash grew. And grew. And kept growing, until the Throne of Cinders was a slightly uncomfortable chair.`],
    ['narr',`Embermere had a dragon again. Luckily, this one helped with the harvest, lit every lantern in the valley with one breath, and was grounded by Mom for a week after coming home through the roof.`],
    ['narr',`Vorlaxis, now very small and very annoyed, lived in a birdcage in the bakery. Bertram charged admission.`]]},
  lantern:{title:'The Lantern',n:4,lines:[
    ['narr',`You take out a small paper lantern, the kind they hang on the green every Lantern Day, and you light it.`],
    ['ash',`Ember lit these for you, Grandpa. Every year. A thousand of them. Not to keep you asleep. So you'd know where home was.`],
    ['vor',`...She did?`],
    ['ash',`It's in the Wardens' book. Her letter. "Not as a king. Just as my father."`],
    ['narr',`The great dragon looked at the little lantern for a very long time. Then the anger went out of him, the way a fire goes out when nobody is feeding it. What was left was small, warm, and very, very old.`],
    ['vor',`...Is there cake? At this festival of yours?`],
    ['narr',`Grandpa came home for Lantern Day. He was about the size of a goat. Duchess did not approve. Mom made him wipe his feet.`]]}
};
const EPILOGUE_FMT=()=>{
  const L=[], c=G.choices, q=id=>G.quests[id]&&G.quests[id].done;
  if(c.fennick==='forgive') L.push(['narr',`Fennick Wick kept his promise. Every night, every lantern in Emberhollow was lit, and nobody's gate was ever left open again.`]);
  else if(c.fennick==='jail') L.push(['narr',`Fennick Wick served his time in the Watch House, polishing Captain Osric's lamps. He came out a better man, and a much better polisher.`]);
  if(c.morrow==='free') L.push(['narr',`Morrow grew prize-winning pumpkins near Granny Moss's hut. None of them were on fire. He was very proud.`]);
  else if(c.morrow==='jail') L.push(['narr',`Morrow became the Watch House librarian. He organized the cells alphabetically.`]);
  if(c.greymane==='ally') L.push(['narr',`Greymane and his pack ran the high snow again, and every Lantern Day they howled from the ridge, right on cue.`]);
  else if(c.greymane==='home') L.push(['narr',`Greymane went home to his pack, and Frostpine was a little safer, and a lot louder at night.`]);
  if(c.cinder==='ally') L.push(['narr',`Sir Cindervane took one last look at the valley he had guarded for a thousand years, said "good," and finally sat down.`]);
  else if(c.cinder==='rest') L.push(['narr',`Someone put flowers on Sir Cindervane's helmet at the Obsidian Gate. They were there every year after.`]);
  if(q('bun')) L.push(['narr',`Bertram and Tilly Crumb opened a bakery-inn together. The Lantern Buns exploded only twice. A record.`]);
  if(q('hollow')) L.push(['narr',`Juniper Ashby finished her map of every cave in Embermere. Rook got to hold the pencil.`]);
  if(q('mine')) L.push(['narr',`Coppergulch Mine rang with picks again, and the ore came down to Maren's forge in spring, like always.`]);
  if(q('lure')) L.push(['narr',`Dell sailed the Soggy Biscuit Two across Lake Mirrow, wearing his ring, catching nothing, perfectly happy.`]);
  if(q('duchess')) L.push(['narr',`Duchess the goat lived a long life full of opinions.`]);
  if(G.flags.pip) L.push(['pip',`Mip!`]);
  L.push(['narr',`And the last of the Emberblood line never, ever had to say "great" thirteen times again.`]);
  return L;
};
// v6 weapons: Mom offers to forge a hammer (forgeHammerTalk in a6b_weapons.js)
Object.assign(STORY.maren,{
  hammerOffer:[['maren',`Ash. Come here. I've had an idea, and it's heavy.`],['maren',`Grandma's blade is lovely. But some things in this valley need hitting with something less lovely. Cracked walls. Knights with big shields. Rocks that look at you funny.`],['maren',`I can forge you a hammer. One star-iron, or 150 coins for the good iron. What do you say?`]],
  hammerMade:[['narr',`Sparks fly. Mom hums. The forge roars. CLANG. CLANG. CLANG. It takes about four seconds, because Mom is very, very good at this.`],['maren',`There. The Forge Hammer. Hold the attack button to wind up a bigger smash. Smash walls. Smash shields. Do not smash the house.`]]
});
// ---------- Ember's Trials (a2h_dungeons.js). Ember speaks inside each one, a warm voice in the walls.
Object.assign(STORY,{
  trial_leap_sealed:[['narr',`A stone arch, half swallowed by roots. Three runes are carved over the door, cold and grey.`],['narr',`In the middle of the door is a carved flame, with tiny claw marks all around it, as if someone small once knocked and knocked.`],['ash',`Hello? Anybody home?`],['narr',`Nothing. Elder Yara might know what this place is.`]],
  trial_tide_sealed:[['narr',`White stone doors, crusted with shells. Carved fish swim all over them. Their eyes are closed.`],['narr',`The runes over the door are sleeping. Maybe they wake up later. Maybe they're just not morning runes.`]],
  trial_sky_sealed:[['narr',`A gate of white and gold stone, standing all alone on the crag. The wind whistles through it like a flute.`],['narr',`The runes are dark. Somewhere far away, something with very big wings is waiting for you to be ready.`]],
  trial_leap_in:[['ember',`Oh! Oh, you came. Hello, little ember.`],['ash',`Who said that?`],['ember',`I did. Up here. Well, sort of everywhere. I am Ember. A very long time ago I built this place for my children, so their dragon gifts could wake.`],['ember',`Nobody has opened these doors in a thousand years. Nobody had the fire. But you do. I can feel it. You are so warm.`],['ash',`Wait. Ember? Like Grandma Ember? Great ×13 Grandma Ember?`],['ember',`Thirteen greats is a lot of greats. Just Ember is fine.`],['ember',`This is the Trial of the Leap. Find my shrine in the middle. Mind the pits, and the roots, and Old Gnarl. Mostly Old Gnarl.`]],
  trial_leap_shrine:[['ember',`There it is. My flame. I left a little of it here, just for you.`],['ember',`Touch it, and your legs will remember what your blood already knows.`]],
  trial_leap_gift:[['narr',`You touch the flame. It doesn't burn. It tickles.`],['narr',`Warmth runs all the way down into your feet. Your tail flicks. Your knees feel... springy.`],['ember',`The Leap! Now you can jump over pits, spikes, and very rude roots. Run first, and you will jump even farther.`],['ash',`I'm going to jump on EVERYTHING.`],['ember',`I know. My children said that too.`]],
  trial_leap_how:`Press C, the JUMP button, or A on a controller. Sprint first to leap farther.`,
  trial_leap_item:[['narr',`You heave open the great chest. Inside, wrapped in leaves that never went brown, is a curved piece of red-gold wood.`],['ember',`My Wing-rang! I carved it from the old oak by the village. Throw it, and it always comes home. Like children. Eventually.`],['ember',`It can strike things your claws cannot reach. Crystal switches across the pits, for example. Hint, hint.`]],
  trial_leap_itemhow:`Switch weapons with X or the WEAPON button, then throw it. It flies over pits and comes back.`,
  trial_leap_bossline:`Old Gnarl! When he stomps, JUMP the rings. Then hit the glowing knot on his back. And roots burn, little ember. Roots burn.`,
  trial_leap_won:[['narr',`Old Gnarl creaks, wobbles, and sits down with a sound like a whole forest sighing.`],['narr',`A little green sprout pops out of the top of his head. He looks... happy?`],['ember',`Thank you, old friend. You guarded this place for a thousand years. You can rest now. Grow some acorns.`],['ember',`Go on, Ash. Through the door. Something is waiting for you.`]],
  trial_leap_end:[['ember',`You passed the Trial of the Leap. I am so proud of you I could burst. Ghosts can't burst. I checked.`],['ember',`Take a little more of my fire. It will make you stronger.`],['ember',`Two more Trials are waiting. The Trial of the Tide sleeps on the island in Lake Mirrow. You'll need your new legs to get there.`],['narr',`Step into the warp ring to go back outside.`]],
  trial_tide_in:[['ember',`Ash! You found the island. Did you jump the broken pier? I made it broken on purpose. Well. Time made it broken. I'm taking the credit.`],['ember',`This is the Trial of the Tide. The water here is old, and clever. Watch how it rises and falls.`],['ember',`My shrine is in the middle. The Mirrow Serpent waits at the end. He is very big, and very wet, and he never stops splashing.`]],
  trial_tide_shrine:[['ember',`My flame again. This one remembers the lake.`],['ember',`Water usually puts fire out. Not ours. Ours walks right across it.`]],
  trial_tide_gift:[['narr',`The flame pours over you like warm rain. Steam curls off your scales.`],['narr',`You look down. The water in the pools shivers away from your feet, like it's shy.`],['ember',`Water Stride! Now deep water will hold you up, as long as you keep walking. Sprint, and you'll skim like a skipping stone.`],['ash',`Can I walk across Lake Mirrow? The WHOLE lake?`],['ember',`The whole lake. Wave to the fish for me.`]],
  trial_tide_how:`Just walk onto deep water. With Water Stride it holds you up. Sprint to skim even faster.`,
  trial_tide_item:[['narr',`The great chest opens with a soft click. Inside lies a bow of pale driftwood, strung with something that shines like moonlight on water.`],['ember',`My bow! I made the string out of a moonbeam. Don't ask me how. I don't remember. It was a very long night.`],['ember',`Arrows fly straight and far. Stone eyes that won't open for claws will open for an arrow.`]],
  trial_tide_itemhow:`Switch to the bow with X or the WEAPON button, then shoot. Arrows wake the stone eyes.`,
  trial_tide_bossline:`The Mirrow Serpent! Stride out to his head when he comes up for air. And keep out of the whirlpool!`,
  trial_tide_won:[['narr',`The Mirrow Serpent sinks down, down, down... then bobs back up and floats on its back like a very large, very embarrassed noodle.`],['narr',`It blows one big bubble at you. Then it swims off into the deep, humming.`],['ember',`He always loved a good game of splash. Thank you for playing with him, Ash.`]],
  trial_tide_end:[['ember',`Two Trials! You are as stubborn as I was. That's a compliment. Mostly.`],['ember',`The last one is the hardest. The Trial of the Sky waits on the crag in the Drakeling Crags, behind a moat far too wide to jump.`],['ash',`But not too wide to walk on.`],['ember',`Exactly. Clever ember.`],['narr',`Step into the warp ring to go back outside.`]],
  trial_sky_in:[['ember',`You walked across the moat! I watched. You looked very heroic. You also slipped once. I won't tell anyone.`],['ember',`This is the Trial of the Sky, my last and my favorite. Here the wind is the floor and the clouds are the walls.`],['ember',`You'll need my Wing-rang and my bow. And at the very top waits Skrae, the Storm Wyvern. She is fast, and she is LOUD.`]],
  trial_sky_shrine:[['ember',`My last flame. I saved the best one for last.`],['ember',`I flew, once. My children flew. Now it is your turn.`]],
  trial_sky_gift:[['narr',`The flame rushes into you with a roar like wind in a chimney.`],['narr',`Something unfolds on your back. Two wings, small and warm and very, very real.`],['ash',`I have WINGS. Actual WINGS. Pip is going to be so jealous.`],['ember',`Wings! Jump, then jump again in the air to take off. They get tired, so land now and then to let them rest.`],['ember',`Chasms can't stop you now. Nothing can. Well. Walls can. Please don't fly into walls.`]],
  trial_sky_how:`Jump, then press JUMP again in the air to fly. Press it once more to land. Watch your flight meter.`,
  trial_sky_item:[['narr',`The great chest opens.`]],
  trial_sky_itemhow:``,
  trial_sky_bossline:`Skrae! Arrows and the Wing-rang reach her in the air. When she lands on a perch, fly in close and strike!`,
  trial_sky_won:[['narr',`Skrae spirals down and lands on a perch with a thump. She shakes her head, and a little storm cloud puffs out of one ear.`],['narr',`She looks at you for a long time. Then she bows her long neck, very low.`],['ember',`She waited a thousand years for someone to fly with her. Thank you, Ash.`]],
  trial_sky_end:[['ember',`All three Trials. Leap, Tide and Sky. You did what nobody could do for a thousand years.`],['ember',`I built these for my children, so they could be brave when it mattered. You are the bravest one yet.`],['ember',`Go home, Ash. Tell Elder Yara. And give your mother a hug from me. A big one.`],['narr',`Step into the warp ring to go back outside.`]],
  trial_puff_meet:[['narr',`On the little stone perch, a drakeling hatchling no bigger than a loaf of bread is crying tiny puffs of smoke.`],['narr',`It sees you, squeaks, and jumps straight into your arms.`],['ash',`Hey, hey. Are you lost? Where's your nest?`],['narr',`"Peep," says the hatchling, and points its whole face toward the east. You decide its name is Puff.`]],
  trial_puff_home:[['narr',`Puff spots the nest, squeals, and tumbles in. Two big drakelings peek over the edge and give you a long, grateful look.`],['narr',`Puff waves one tiny wing at you. Then Puff falls asleep, immediately, mid-wave.`]]
});
