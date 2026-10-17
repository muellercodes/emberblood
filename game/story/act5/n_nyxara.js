// Act V, the last fight: The Night Mother (owner N5b). Data only.
// The fight stays code (x4_foes: four phases; x4_story: the Heart moment's screen, the fall cutscene, the friends in the
// fight). This file holds every line they play, under the old STORY keys (n_nyxara_intro, n_trans12, n_trans23,
// n_heart_start, n_heart_end, n_fall, n_plea) and four new ones x4_story reads once ENG wires them (n_seam_0 to 3, the
// four Heart voices, and n_choice, the final choice; see CHANGES.md ENGINE REQUEST). Visual beats the old lines did
// in code are `emit n4fx:<name>` effects (the cutscene, the Heart's dark, each voice's light).
// What the player does: walks onto the summit; Nyxara unfolds off the moon and fights in four phases; when she
// swallows the last piece of the moon, everything goes black and the Ember Heart floats up, and Ash holds the breath
// key while the friends' voices fill its seams (Vesper or Juniper, Glaciar or Elka or Tove, Hush or Quill, then Mom and
// the Act I ending) until Pip says his first word. Heartfire breaks her cracks. She falls holding the last sliver of
// moon. The friends she hurt speak for her, Ash calls her Nyx, and the final choice shows all three endings: the moth
// one locked, with the first reason that holds, until her name, the plan and two of those friends are there.
chapter({
  id: 'n_nyxara', act: 5, after: 'n_crown', next: 'n_end', takeover: true,
  // keep x4_story's own stage tick (n4sNyxTick: the hero ending's ember spirit, the Heart and fall fallbacks): ENGINE
  // REQUEST, today takeover always drops it
  keep: ['update'],
  card: ['Finale · The Last Fight', 'The Night Mother'],
  so_far: [
    'The Moon Door opened for the Ember Heart, just as Nyxara wanted. Now Ash has to face the Night Mother, and find out if anyone can reach her.',
    'The door opened. Now Ash must face Nyxara.'],

  // the Ember Heart is Act IV's item (e7b_threads names it); the Ember Moon ending takes it out of the satchel
  item: {
    m_heart: { name: ['The Ember Heart, mended (three shining seams)', 'The mended Ember Heart'],
               desc: ['The Ember Heart, whole again. Three seams shine on it: violet, ice-blue and silver.', 'The Ember Heart, whole again.'],
               icon: 'heart', keepsake: true },
  },

  step: [
    // her four phases (x4_foes shows each phase's own hint as a banner when it starts); the fall and the choice run
    // inside the fight (x4_story's n4sFall), and the choice moves the stage to n_end
    { id: 'fight', do: 'fight n_nyxara', marker: 'n4_summit',
      obj: ['Stop the Night Mother. Watch her glow, and listen to Pip.', 'Watch her glow. Listen to Pip.'],
      hint: ['Phase by phase: Moonfire the moon anchors and grapple her chains, dive the shadow pools and pound the glowing platform, ride the wind to the piece she is eating, then break the cracks on her wings.',
             'Moonfire. Grapple. Dive. Pound. Fly. Break her cracks.'] },
  ],

  scene: {
    // ---- her fight's intro (STORY.bosses.n_nyxara.intro reads STORY.n_nyxara_intro): 8 lines
    n_nyxara_intro: [
      { cam: 'n4_summit', s: 1.5 },
      ['narr', 'Something enormous is folded over the edge of the broken moon, like a blanket over a lamp. It unfolds. Wings as wide as a town square, grey and soft as dust, with two pale moons painted on them.', 'Something huge unfolds off the moon. A moth as big as a house!'],
      ['nyxara', "There you are. Little ember. Look how big you've grown.", 'There you are, little ember. How big you are.'],
      ['ash', 'Are you... my great-great-great...', 'Are you my great-great-great...'],
      ['nyxara', 'No.'],
      ['ash', 'Oh, thank goodness.', 'Oh, good.'],
      ['nyxara', "And you brought me your heart. Whole again. Your mother did such lovely work. A cracked heart can't burn, you see. A whole one can.", 'You brought me the Heart. Whole again. Now it can burn.'],
      ['nyxara', 'Give it to me, and the night will never end, and nobody will ever have to say goodbye again.', 'Give it to me. Then nobody ever says goodbye.'],
      ['ash', "That's not a night. That's just a really long nap with no breakfast. Give the moon back.", 'That is a long nap with no breakfast. Give the moon back!'],
    ],
    n_trans12: [
      ['nyxara', 'Enough of the floor. Let the sea come up and tuck you in.', 'No more floor. Let the dark sea come up.'],
      ['narr', 'Ink pours up out of the glass, and the summit floods with shadow. Only the rim and three pale platforms stay dry.', 'Black ink floods the floor. Only the edge and three platforms stay dry.'],
    ],
    n_trans23: [
      ['nyxara', "Fine. If you won't sleep, I will finish my supper.", 'Fine. I will finish my supper.'],
      ['narr', 'The ink drains up into the sky like rain falling the wrong way. Nyxara rises toward the last floating pieces of the moon.', 'The ink goes up into the sky. Nyxara flies to the last moon pieces.'],
      ['ash', "She's eating the last pieces! Wings, Ash. Ride the wind!", 'She is eating the last pieces! Fly! Ride the wind!'],
    ],

    // ---- the Heart moment (x4_story's n4sHeart: the black, the meter, the voices' lights)
    n_heart_start: [
      ['narr', 'Nyxara swallows the last piece of the moon.', 'Nyxara eats the last piece of the moon.'],
      { do: ['emit n4fx:heart_dark'] },
      ['narr', 'And everything goes black.', 'Everything goes black.'],
      ['narr', "Not dark. Black. No lanterns. No stars. You can't even see your own claws.", 'So black. You cannot see your claws.'],
      { do: ['emit n4fx:heart_puff'] },
      ['narr', 'You breathe fire. Nothing comes out but a little puff of smoke.', 'You breathe fire. Only smoke comes out.'],
      ['ash', "My fire. My fire's going out.", 'My fire is going out!'],
      ['nyxara', "Shh. There. Isn't that better? No more fighting. No more goodbyes. Give me the Heart, and we'll all just... rest.", "There. No more fighting. Give me the Heart. Let's rest."],
      { do: ['emit n4fx:heart_float'] },
      ['narr', 'Something tugs at your satchel. The Ember Heart floats up out of it, glowing faintly. Black flames lick at its edges.', 'The Heart floats out of your bag. Black fire licks at it.'],
      ['narr', "It's still warm. Barely. And then you hear voices. Not from the dark. From the Heart.", 'It is still a little warm. Then you hear voices from the Heart.'],
    ],
    // the four voices, one per seam (25, 50, 75 and 90 percent of the breath): the friends Ash won speak first; a
    // reconciled friend speaks like one freed earlier. Elka only if Ash raced her sled in Act III.
    n_seam_0: [
      { if: { any: ['flag n5_vesper', 'choice c_vesper=friend'] }, then: [
        { do: ['emit n4fx:voice:c_vesper'] },
        ['c_vesper', 'Hey. Cousin. Emberbloods without fire still have warm hands. Here. Take mine.', 'Cousin. I have no fire. But my hands are warm. Take them.'],
        ['c_vesper', "Gran says come home for tea after. So don't you dare go out.", "Gran says come home for tea. Don't go out!", { if: { any: ['flag n5_tea', 'flag n5_vletter'] } }] ],
        else: [
        { do: ['emit n4fx:voice:juniper'] },
        ['juniper', "Ash! You can't get lost now. I drew you a map. Follow it home!", "Ash! You can't get lost. I drew you a map!"] ] },
    ],
    n_seam_1: [
      { if: { any: ['flag n5_glaciar', 'choice f_glaciar=free'] }, then: [
        { do: ['emit n4fx:voice:f_glaciar'] },
        ['f_glaciar', 'Cold keeps things, she says. Warm GIVES things. Give, dumpling.', 'Cold keeps things. Warm gives things. Give, dumpling!'] ],
        else: [{ if: 'quest f_sled done', then: [
        { do: ['emit n4fx:voice:elka'] },
        ['elka', 'Faster than a wolf, Ash! FASTER!', 'Faster than a wolf, Ash!'] ],
        else: [
        { do: ['emit n4fx:voice:tove'] },
        ['tove', "Ash! I remember Ember's laugh, like wind chimes. You have it too.", "I remember Ember's laugh. You have it too."] ] }] },
    ],
    n_seam_2: [
      { if: { any: ['flag n5_hush', 'choice m_hush=free'] }, then: [
        { do: ['emit n4fx:voice:f_hush'] },
        ['narr', "A soft white light settles on your shoulder. Hush. For once, she doesn't say shhh.", 'Hush lands on your shoulder. She does not say shhh.'],
        ['f_hush', '...Hold on, little ember. Hold on.', 'Hold on.'] ],
        else: [
        { do: ['emit n4fx:voice:quill'] },
        ['quill', "The moon always comes back, Ash. I have measured it. Every month. It's the most reliable thing I know.", 'The moon always comes back. I measured it.'] ] },
    ],
    // the core: Mom, Tikka's window lantern (if she stayed home, Act I), then the Act I ending
    n_seam_3: [
      { do: ['emit n4fx:voice:maren'] },
      ['maren', "Ash! I can feel it from here. Don't you dare go out. You still haven't eaten your sandwich.", "Ash! Don't you go out! You did not eat your sandwich!"],
      { if: 'flag tk_come=home', then: [
        { do: ['emit n4fx:voice:ev_tikka'] },
        ['narr', 'Far, far away in Embermere, in one small window, a lantern is burning. Tikka promised.', "Far away, Tikka's lantern burns in her window."] ] },
      { if: 'choice ending=lantern', then: [
        { do: ['emit n4fx:voice:grandpa', 'emit n4fx:heart_grandpa'] },
        ['narr', "Far below, a small orange light is climbing up out of the dark. It's flapping very hard.", 'A small orange light flies up from below. It flaps very hard.'],
        ['grandpa', 'Nobody. Puts out. MY. Grandchild.', 'Nobody puts out MY grandchild!'],
        ['narr', "Grandpa lands on your head, which is rude, and breathes into the Heart with you. It's the first fire he has breathed in a whole year. It's a big one.", 'Grandpa lands on your head and breathes fire into the Heart with you.'] ],
        else: [{ if: 'choice ending=warden', then: [
        { do: ['emit n4fx:heart_wardens', 'emit n4fx:voice:iska'] },
        ['narr', 'Five small lights blink on around you. One, two, three, four, five.', 'Five little lights shine around you.'],
        ['iska', 'Sixth Warden. We felt the dark from our Ward-fires. We came.', 'Sixth Warden. We felt the dark. We came.'],
        ['bram', 'And to SHOUT! BREATHE, kid!', 'BREATHE, kid!'],
        { do: ['emit n4fx:voice:vor'] },
        ['vor', '...Breathe from your belly, hatchling. Not your nose.', 'Breathe from your belly, little one.'] ],
        else: [{ if: 'choice ending=heir', then: [
        { do: ['emit n4fx:heart_belly', 'emit n4fx:voice:ash'] },
        ['narr', 'The fire you took from Grandpa, the fire that once made you huge, wakes up deep in your belly.', 'The big fire you once had wakes up in your belly.'],
        ['grandpa', '(very far away, from a birdcage in a bakery) You call THAT a flame? Pathetic. Do it BIGGER.', '(far away) Is that a flame? Do it BIGGER!'],
        ['ash', 'Thanks, Grandpa.'] ],
        else: [
        { do: ['emit n4fx:voice:ember'] },
        ['ember', 'Little ember. Remember what my father taught me? Breathe from your belly. Not your nose.', 'Little ember. Breathe from your belly.'] ] }] }] },
    ],
    n_heart_end: [
      ['narr', 'The Heart flickers. Almost. Almost.', 'The Heart flickers. Almost!'],
      { if: 'flag pip', then: [
        { do: ['emit n4fx:heart_pip'] },
        ['narr', 'Then Pip climbs up your arm, puffs out every single scale, and says, very loudly, the first word Pip has ever said.', 'Then Pip climbs up your arm. Pip says a word for the very first time.'],
        ['pip', 'ASH!', { do: ['emit n4fx:heart_word'] }],
        { do: ['emit n4fx:heart_spark'] },
        ['narr', 'And Pip breathes one tiny spark into the Heart.', 'Pip breathes one tiny spark into the Heart.'] ],
        else: [
        ['narr', 'You breathe one last time, from your belly. One tiny spark catches.', 'You breathe one more time. A tiny spark catches.'] ] },
      ['narr', 'The Ember Heart blazes like a sunrise.', 'The Heart shines like the sun!', { do: ['emit n4fx:heart_blaze'] }],
      { if: 'flag pip', then: [
        ['ash', 'Did Pip just... TALK?', 'Did Pip just TALK?'],
        ['pip', 'Mip.'] ] },
      ['nyxara', 'No. No, no, no. That light is MINE!', 'No! That light is MINE!'],
      ['ash', "It's not yours. It never was. Let's finish this.", "It is not yours. Let's finish this."],
    ],

    // ---- after the last crack (x4_story's n4sFall plays n_fall, n_plea and n_choice in one sitting; each piece keeps
    // its own limit: 6 lines after the boss)
    n_fall: [
      { do: ['emit n4fx:cut_fall'] },
      ['narr', "The last crack bursts. Light pours out of Nyxara's wings in a great silver river, up into the empty moon, and the moon starts to fill. Slowly. Like a cup.", 'The last crack breaks. Silver light pours up and fills the moon.', { do: ['emit n4fx:cut_fill:0.6'] }],
      { do: ['emit n4fx:cut_shrink:0.62'] },
      ['narr', 'Nyxara crumples onto the glass, smaller every second. In her claws she holds one last sliver of moon, tight, the way you would hold a blanket.', 'Nyxara falls and shrinks. She holds the last bit of moon tight.', { do: ['emit n4fx:cut_sliver'] }],
      ['nyxara', "Don't. Please. It always leaves. Every morning it goes away. Every month it gets thin. I only wanted it to stay.", 'Please. It always goes away. I only wanted it to stay.'],
      ['ash', 'My grandpa said "mine" too. About the whole valley. It made him so lonely he turned into a mountain.', 'My grandpa said "mine" too. It made him so lonely.'],
      ['nyxara', 'Everyone leaves, little ember.', 'Everyone leaves.'],
      ['ash', "Yeah. The moon leaves every morning. And it comes back every night. That's not leaving. That's... visiting.", 'The moon goes every morning and comes back every night. That is visiting!'],
    ],
    // the plea: when the moth ending is open, each friend she hurt who is here says one line, then her name; when it is
    // not, she will not listen (the choice says why)
    n_plea: [
      { if: 'solved n5_reach trust friends>=2 item n5_lantern', then: [
        ['c_vesper', "She found me when I was little and alone, and she promised me fire. I know what lonely sounds like. That's what it sounds like.", 'She found me when I was lonely. I know that sound.', { if: { any: ['flag n5_vesper', 'choice c_vesper=friend'] } }],
        ['f_glaciar', "I know cold, old moth. Cold doesn't keep anything. It only stops it.", 'I know cold. Cold does not keep things. It stops them.', { if: { any: ['flag n5_glaciar', 'choice f_glaciar=free'] } }],
        ['f_hush', "(Hush folds her wings round her mother's claws.) ...Mother. Let go.", 'Mother. Let go.', { if: { any: ['flag n5_hush', 'choice m_hush=free'] } }],
        ['ash', 'Nyx.'],
        ['nyxara', '...Nobody has called me that in a thousand years. Not since the girl with the lantern.', 'Nobody has called me that in a thousand years.'],
        ['ash', 'Ember. My great-times-thirteen grandma. She lit a lantern so you would be warm. I brought you one too.', 'Ember lit a lantern for you. I brought one too.'] ],
        else: [{ if: 'clue n5_her_name', then: [
        ['ash', 'Nyx.'],
        ['nyxara', '...Who told you that name? No. You will leave too. Everyone leaves.', 'Who told you that name? Everyone leaves.'] ],
        else: [
        ['narr', "She curls tighter round the sliver of moon. She is too scared to hear a word you say.", 'She holds the moon tight. She is too scared to listen.'] ] }] },
    ],
    // the final choice: every option always shows; the moth one is locked, with the first reason that holds (exactly
    // one of its four versions shows). Each ending is 6 lines; the friends' and the Act I ending's lines are in the book.
    n_choice: [
      { choose: 'n_end', who: 'ash', ask: ['What will you do?', 'What will you do?'], pick: [
        { t: ['Light her a lantern, and let the moon go home', 'Light Nyx a lantern'], tone: 'kind', v: 'moth',
          if: '!clue n5_her_name', need: 'clue n5_her_name',
          locked: ["You don't know her real name yet.", "You don't know her name yet."] },
        { t: ['Light her a lantern, and let the moon go home', 'Light Nyx a lantern'], tone: 'kind', v: 'moth',
          if: 'clue n5_her_name !solved n5_reach', need: 'solved n5_reach',
          locked: ["You haven't worked out how to reach her. Look in the Case Book.", "You don't know how to reach her yet."] },
        { t: ['Light her a lantern, and let the moon go home', 'Light Nyx a lantern'], tone: 'kind', v: 'moth',
          if: 'solved n5_reach !item n5_lantern', need: 'item n5_lantern',
          locked: ['You have no lantern to give her.', 'You have no lantern.'] },
        { t: ['Light her a lantern, and let the moon go home', 'Light Nyx a lantern'], tone: 'kind', v: 'moth',
          if: 'solved n5_reach item n5_lantern', need: 'trust friends>=2',
          locked: ['Friends she hurt who are here: {trust:friends}. She needs to hear from two.', 'Her friends here: {trust:friends} of 2.'],
          then: ['set n_nyx_done', 'set n_heart_on=0', 'emit n4fx:choose', 'take n5_lantern', 'world n5_green_post moth'],
          say: [
            { do: ['emit n4fx:cut:lantern'] },
            ['narr', "You take out Mom's little paper lantern. It's a bit squashed. It's been through a lot. You light it, very gently.", "You take out Mom's paper lantern. You light it gently."],
            ['ash', "Here. This one's yours. It won't last forever. Lanterns don't. That's why we light a new one every year.", 'This one is yours. We light a new one every year.'],
            { do: ['emit n4fx:cut:click'] },
            ['narr', 'Nyx looks at the lantern for a long, long time. Then she opens her claws, and the last sliver of moon floats up and clicks into place.', 'Nyx lets go. The last bit of moon clicks into place.'],
            { do: ['emit n4fx:cut:whole'] },
            ['narr', 'The moon is whole. Round and silver and enormous. The whole peak shines as if it were made of milk.', 'The moon is whole and bright again!'],
            { do: ['emit n4fx:cut:small'] },
            ['narr', 'And she gets small. Smaller. Until she is just a little grey moth with two pale moons on her wings, sitting on a paper lantern.', 'She gets small. A little grey moth, sitting on the lantern.'],
            ['nyxara', "...It's so warm.", 'It is so warm.'] ] },
        { t: ['End the Long Night for good', 'End the Long Night'], tone: 'brave', v: 'dawn',
          then: ['set n_nyx_done', 'set n_heart_on=0', 'emit n4fx:choose'],
          say: [
            ['ash', 'No more Long Night. Not for anyone.', 'No more Long Night. For anyone.'],
            { do: ['emit n4fx:cut:breath'] },
            ['narr', 'You breathe Heartfire, gold and silver, the biggest breath of your whole life.', 'You breathe gold and silver fire. Your biggest breath ever.'],
            { do: ['emit n4fx:cut:moths'] },
            ['narr', "Nyxara doesn't scream. She sighs, like someone falling asleep, and comes apart into a thousand tiny silver moths.", 'Nyxara sighs. She turns into a thousand silver moths.'],
            { do: ['emit n4fx:cut:stitch'] },
            ['narr', 'The moths fly up to the moon and stitch its cracks shut, like a quilt. You can still see the seams. Silver, like a mended cup.', 'The moths fly up and sew the moon back together.'],
            { do: ['emit n4fx:cut:mended', 'emit n4fx:cut:sunrise'] },
            ['narr', 'Then, far away at the edge of the world, the sky goes pink. Then gold. Then blue.', 'Far away, the sky turns pink. Then gold. Then blue.'],
            ['ash', "Morning. It's actually morning.", 'Morning! It is really morning!'] ] },
        { t: ['Give the Ember Heart to the moon', 'Give the Heart to the moon'], tone: 'kind', v: 'embermoon',
          then: ['set n_nyx_done', 'set n_heart_on=0', 'emit n4fx:choose', 'take m_heart'],
          say: [
            ['ash', "You can't keep the moon by eating it. But maybe you could keep warm by it.", "You can't keep the moon by eating it. But it could keep you warm."],
            { do: ['emit n4fx:cut:hold'] },
            ['narr', 'You hold up the Ember Heart, blazing gold and silver. Then you throw it, as hard as you can, straight up.', 'You hold up the Heart. Then you throw it up, hard!', { do: ['emit n4fx:cut:throw'] }],
            ['pip', 'MIP?!'],
            { do: ['emit n4fx:cut:catch'] },
            ['narr', 'The Heart flies into the empty moon, and the moon catches fire. Not a scary fire. A lantern fire, warm and orange, like a window when somebody is waiting up for you.', 'The Heart flies into the moon. It glows warm, like a lantern.'],
            ['narr', 'Nyxara looks up at it. Her eyes fill with orange light. For the first time in a thousand years, she is not cold.', 'Nyxara looks up. For the first time, she is not cold.'],
            { do: ['emit n4fx:cut:curl'] },
            ['narr', 'She lets go of the last sliver of moon, flies up, and curls round the warm gold moon like a cat round a stove. And she falls asleep.', 'She curls up on the warm moon like a cat, and sleeps.'] ] },
      ] },
    ],
  },
})
