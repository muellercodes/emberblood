// Act V, the last fight: The Night Mother (owner N5b). Data only.
// The fight stays code (x4_foes: four phases; x4_story: the Heart moment's screen, the fall cutscene, the friends in the
// fight). This file holds every line they play, under the old STORY keys (n_nyxara_intro, n_trans12, n_trans23,
// n_heart_start, n_heart_end, n_fall, n_plea) and four new ones x4_story reads once ENG wires them (n_seam_0 to 3, the
// four Heart voices, and n_choice, the final choice; see CHANGES.md ENGINE REQUEST). Visual beats the old lines did
// in code are `emit n4fx:<name>` effects (the cutscene, the Heart's dark, each voice's light).
// What the player does: walks onto the summit; Nyxara unfolds off the moon and fights in four phases; when she
// swallows the last piece of the moon, everything goes black and the Ember Heart floats up, and Ash holds the breath
// key while the friends' voices fill its seams (Vesper or Juniper, Glaciar or Elka or Tove, Hush or Quill, then Mom and
// the Act I ending) until Pip, the one who stayed, says his first word. Heartfire breaks her cracks. She falls holding the last sliver of
// moon. The friends she hurt speak for her, Ash calls her Nyx, and the final choice is made. (v12 R4) The moth pick only
// shows when its condition holds (her name worked out with the plan, Mom's lantern, two of those friends); otherwise it
// is not there at all, so the menu never advertises an ending a kid has not earned.
chapter({
  id: 'n_nyxara', act: 5, after: 'n_crown', next: 'n_end', takeover: true,
  // keep x4_story's own stage tick (n4sNyxTick: the hero ending's ember spirit, the Heart and fall fallbacks): ENGINE
  // REQUEST, today takeover always drops it
  keep: ['update'],
  card: ['Finale · The Last Fight', 'The Night Mother'],
  so_far: [
    'The Moon Door opened for the Ember Heart, just as Nyxara wanted. Now Ash has to face the Night Mother, and find out if anyone can reach her.',
    'The door opened. Now Ash must face Nyxara.'],

  // the Ember Heart item is defined in act4/m_reforge.js

  step: [
    // her four phases (x4_foes shows each phase's own hint as a banner when it starts); the fall and the choice run
    // inside the fight (x4_story's n4sFall), and the choice moves the stage to n_end
    { id: 'fight', do: 'fight n_nyxara',
      obj: ['Stop the Night Mother. Watch her glow, and listen to Pip.', 'Watch her glow. Listen to Pip.'],
      hint: ['Phase by phase: Moonfire the moon anchors and grapple her chains, dive the shadow pools and pound the glowing platform, ride the wind to the piece she is eating, then break the cracks on her wings.',
             'Moonfire. Grapple. Dive. Pound. Fly. Break her cracks.'] },
  ],

  scene: {
    // ---- her fight's intro (STORY.bosses.n_nyxara.intro reads STORY.n_nyxara_intro): 8 lines
    n_nyxara_intro: [
      { cam: 'n4_summit', s: 1.5 },
      ['narr', 'Something enormous is folded over the edge of the broken moon, like a blanket over a lamp. It unfolds: wings as wide as the village green, grey and soft as dust, with two pale moons painted on them.', 'Something huge unfolds off the moon. Grey wings with two pale moons.'],
      ['nyxara', "There you are, little ember. Look how big you've grown.", 'There you are, little ember. How big you are.', { mood: 'sly' }],
      ['ash', "You've been watching me.", 'You have been watching me.', { mood: 'worried' }],
      ['nyxara', 'Every night, dear. I watch everyone, right up until they leave.', 'Every night. Until they leave.', { mood: 'cold' }],
      ['nyxara', "And you brought me your heart, whole again. Your mother did such lovely work. A cracked heart can't burn, you see. A whole one can.", 'You brought me the Heart. Whole again. Now it can burn.', { mood: 'sly' }],
      ['nyxara', 'Give it to me, and the night will never end, and nobody will ever have to say goodbye again.', 'Give it to me. Then nobody ever says goodbye.', { mood: 'tender' }],
      ['ash', "I'm not giving you the Heart. Give the moon back.", 'I will not give you the Heart. Give the moon back!', { mood: 'determined' }],
    ],
    n_trans12: [
      ['nyxara', 'Enough of the floor. Let the sea come up and tuck you in.', 'No more floor. Let the dark sea come up.', { mood: 'cold' }],
      ['narr', 'Ink pours up out of the glass, and the summit floods with shadow. Only the rim and three pale platforms stay dry.', 'Black ink floods the floor. Only the edge and three platforms stay dry.'],
    ],
    n_trans23: [
      ['nyxara', "Fine. If you won't sleep, I will finish my supper.", 'Fine. I will finish my supper.', { mood: 'angry' }],
      ['narr', 'The ink drains up into the sky like rain falling the wrong way. Nyxara rises toward the last floating pieces of the moon.', 'The ink goes up into the sky. Nyxara flies to the last moon pieces.'],
      ['ash', "She's eating the last pieces! Wings, Ash. Ride the wind!", 'She is eating the last pieces! Fly! Ride the wind!', { mood: 'determined' }],
    ],

    // ---- the Heart moment (x4_story's n4sHeart: the black, the meter, the voices' lights)
    n_heart_start: [
      ['narr', 'Nyxara swallows the last piece of the moon.', 'Nyxara eats the last piece of the moon.'],
      { do: ['emit n4fx:heart_dark'] },
      ['narr', 'And everything goes black.', 'Everything goes black.'],
      ['narr', "Not dark, black: no lanterns, no stars, not even your own claws in front of your face.", 'So black. You cannot see your claws.'],
      { do: ['emit n4fx:heart_puff'] },
      ['narr', 'You breathe fire. Nothing comes out but a little puff of smoke.', 'You breathe fire. Only smoke comes out.'],
      ['ash', "My fire. My fire's going out.", 'My fire is going out!', { mood: 'scared' }],
      ['nyxara', "Shh. There. Isn't that better? No more fighting, no more goodbyes. Give me the Heart, and we can all rest.", "There. No more fighting. Give me the Heart. Let's rest.", { mood: 'tender' }],
      { do: ['emit n4fx:heart_float'] },
      ['narr', 'Something tugs at your satchel. The Ember Heart floats up out of it, glowing faintly. Black flames lick at its edges.', 'The Heart floats out of your bag. Black fire licks at it.'],
      ['narr', "It's still warm, just barely. Then you hear voices, and they aren't coming from the dark. They're coming from the Heart.", 'It is still a little warm. Then you hear voices from the Heart.'],
    ],
    // the four voices, one per seam (25, 50, 75 and 90 percent of the breath): the friends Ash won speak first; a
    // reconciled friend speaks like one freed earlier. Elka only if Ash raced her sled in Act III.
    n_seam_0: [
      { if: { any: ['flag n5_vesper', 'choice c_vesper=friend'] }, then: [
        { do: ['emit n4fx:voice:c_vesper'] },
        ['c_vesper', 'Hey, cousin. Emberbloods without fire still have warm hands. Here, take mine.', 'Cousin. I have no fire. But my hands are warm. Take them.', { mood: 'tender' }],
        ['c_vesper', "Gran wants me home, and she'll want you for tea. So you keep burning, okay?", "Gran wants us home for tea. Keep burning!", { mood: 'happy', if: { any: ['flag n5_tea', 'flag n5_vletter'] } }] ],
        else: [
        { do: ['emit n4fx:voice:juniper'] },
        ['juniper', "Ash! You can't get lost now. I drew you a map. Follow it home!", "Ash! You can't get lost. I drew you a map!", { mood: 'determined' }] ] },
    ],
    n_seam_1: [
      { if: { any: ['flag n5_glaciar', 'choice f_glaciar=free'] }, then: [
        { do: ['emit n4fx:voice:f_glaciar'] },
        ['f_glaciar', 'I slept through the last time this family needed me, dumpling. Not this time. Breathe!', 'I slept last time. Not this time. Breathe, dumpling!', { mood: 'determined' }] ],
        else: [{ if: 'quest f_sled done', then: [
        { do: ['emit n4fx:voice:elka'] },
        ['elka', 'Faster than a wolf, Ash! Like on the sleds!', 'Faster than a wolf, Ash!', { mood: 'determined' }] ],
        else: [
        { do: ['emit n4fx:voice:tove'] },
        ['tove', "Ash! I rode in your fire all through Frostreach. It's still in there. I can feel it. Breathe!", "I rode in your fire. It is still there. Breathe!", { mood: 'determined' }] ] }] },
    ],
    n_seam_2: [
      { if: { any: ['flag n5_hush', 'choice m_hush=free'] }, then: [
        { do: ['emit n4fx:voice:f_hush'] },
        ['narr', "A soft white light settles on your shoulder. Hush. For once, she doesn't say shhh.", 'Hush lands on your shoulder. She does not say shhh.'],
        ['f_hush', 'Hold on, loud one. Hold on.', 'Hold on, loud one.', { mood: 'determined' }] ],
        else: [
        { do: ['emit n4fx:voice:quill'] },
        ['quill', "The moon always comes back, Ash. I have measured it every month since I was your age. It's the most reliable thing I know.", 'The moon always comes back. I measured it.', { mood: 'tender' }] ] },
    ],
    // the core: Mom, Tikka's window lantern (if she stayed home, Act I), then the Act I ending
    n_seam_3: [
      { do: ['emit n4fx:voice:maren'] },
      ['maren', "Ash! I can feel it from here. The lantern's still lit in my window.", 'Ash! My lantern is still lit in the window.', { mood: 'worried' }],
      ['maren', "Don't you dare go out. You haven't even eaten your sandwich.", "Don't you go out! You did not eat your sandwich!", { mood: 'determined' }],
      { if: 'flag tk_come=home', then: [
        { do: ['emit n4fx:voice:ev_tikka'] },
        ['narr', 'Far, far away in Embermere, in one small window, a lantern is burning. Tikka promised.', "Far away, Tikka's lantern burns in her window."] ] },
      { if: 'choice ending=lantern', then: [
        { do: ['emit n4fx:voice:grandpa', 'emit n4fx:heart_grandpa'] },
        ['narr', "Far below, a small orange light is climbing up out of the dark. It's flapping very hard.", 'A small orange light flies up from below. It flaps very hard.'],
        ['grandpa', 'NOBODY puts out MY grandchild!', 'Nobody puts out MY grandchild!', { mood: 'angry' }],
        ['narr', "Grandpa lands on your head, claws and all, and breathes into the Heart with you. It's the first real fire he has breathed since he got small, and he has been saving it up.", 'Grandpa lands on your head and breathes fire into the Heart with you.'] ],
        else: [{ if: 'choice ending=warden', then: [
        { do: ['emit n4fx:heart_wardens', 'emit n4fx:voice:iska'] },
        ['narr', 'Five small lights blink on around you, one for each Ward-fire.', 'Five little lights shine around you.'],
        ['iska', 'Sixth Warden. We felt the dark from our Ward-fires. We came.', 'Sixth Warden. We felt the dark. We came.', { mood: 'determined' }],
        ['bram', 'And we came to SHOUT! BREATHE, kid!', 'BREATHE, kid!', { mood: 'determined' }],
        { do: ['emit n4fx:voice:vor'] },
        ['vor', 'Breathe from your belly, hatchling. Not your nose.', 'Breathe from your belly, little one.', { mood: 'tender' }] ],
        else: [{ if: 'choice ending=heir', then: [
        { do: ['emit n4fx:heart_belly', 'emit n4fx:voice:ash'] },
        ['narr', 'The fire you took from Grandpa, the fire that once made you huge, wakes up deep in your belly.', 'The big fire you once had wakes up in your belly.'],
        ['grandpa', "(very far away, from the warm shelf above Bertram's oven) You call that a flame? Do it BIGGER.", '(far away) Is that a flame? Do it BIGGER!', { mood: 'sly' }],
        ['ash', 'Thanks, Grandpa.'] ],
        else: [
        { do: ['emit n4fx:voice:ember'] },
        ['ember', 'Ash. Do what my father taught me. Breathe from your belly, not your nose.', 'Ash. Breathe from your belly.', { mood: 'tender' }] ] }] }] },
    ],
    n_heart_end: [
      ['narr', "The Heart flickers. It's almost there.", 'The Heart flickers. Almost!'],
      { if: 'flag pip', then: [
        { do: ['emit n4fx:heart_pip'] },
        ['narr', 'Then Pip climbs up your arm, the way he has every single day since he hatched, and puffs out every scale.', 'Then Pip climbs up your arm, like every day since he hatched.'],
        ['nyxara', 'That one stayed.', { mood: 'sad' }],
        ['pip', 'ASH!', { mood: 'determined', do: ['emit n4fx:heart_word'] }],
        { do: ['emit n4fx:heart_spark'] },
        ['narr', "Pip's very first word. And with it, one tiny spark, right into the Heart.", "Pip's first word! And one tiny spark goes into the Heart."] ],
        else: [
        ['narr', 'You breathe one last time, from your belly. One tiny spark catches.', 'You breathe one more time. A tiny spark catches.'] ] },
      ['narr', 'The Ember Heart blazes like a sunrise.', 'The Heart shines like the sun!', { do: ['emit n4fx:heart_blaze'] }],
      { if: 'flag pip', then: [
        ['ash', 'Did Pip just... TALK?', 'Did Pip just TALK?', { mood: 'surprised' }],
        ['pip', 'Mip.', { mood: 'shy' }] ] },
      ['nyxara', 'No. No, no, no. That light is MINE!', 'No! That light is MINE!', { mood: 'angry' }],
      ['ash', "It was never yours. Nobody gave it to you. Let's finish this.", "It is not yours. Nobody gave it to you!", { mood: 'determined' }],
    ],

    // ---- after the last crack (x4_story's n4sFall plays n_fall, n_plea and n_choice in one sitting; each piece keeps
    // its own limit: 6 lines after the boss)
    n_fall: [
      { do: ['emit n4fx:cut_fall'] },
      ['narr', "The last crack bursts. Light pours out of Nyxara's wings in a great silver river, up into the empty moon, and the moon starts to fill, slowly, like a cup.", 'The last crack breaks. Silver light pours up and fills the moon.', { do: ['emit n4fx:cut_fill:0.6'] }],
      { do: ['emit n4fx:cut_shrink:0.62'] },
      ['narr', 'Nyxara crumples onto the glass, smaller every second. In her claws she holds one last sliver of moon, tight, the way you would hold a blanket.', 'Nyxara falls and shrinks. She holds the last bit of moon tight.', { do: ['emit n4fx:cut_sliver'] }],
      ['nyxara', "Don't. Please. It always leaves. Every morning it goes away. Every month it gets thin. I only wanted it to stay.", 'Please. It always goes away. I only wanted it to stay.', { mood: 'sad' }],
      ['ash', 'My grandpa said "mine" too, about the whole valley. He ended up inside a mountain for a thousand years, all by himself.', 'My grandpa said "mine" too. He ended up all alone.', { mood: 'sad' }],
      ['nyxara', 'Everyone leaves, little ember.', 'Everyone leaves.', { mood: 'sad' }],
      ['ash', "The moon goes away every morning, and it comes back every night. That's not leaving. That's visiting.", 'The moon goes every morning and comes back every night. That is visiting!', { mood: 'tender' }],
    ],
    // the plea: when the moth ending is open, each friend she hurt who is here says one line, then her name; when it is
    // not, she will not listen (the choice says why)
    n_plea: [
      { if: 'solved n5_reach trust friends>=2 item n5_lantern', then: [
        ['c_vesper', "She found me when I was little and alone, and she promised me fire. I know what lonely sounds like. She sounds like that.", 'She found me when I was lonely. I know that sound.', { mood: 'sad', if: { any: ['flag n5_vesper', 'choice c_vesper=friend'] } }],
        ['f_glaciar', "You froze my mountain to keep things, old moth. It kept nothing. It only kept me asleep.", 'Your cold kept nothing. It only kept me asleep.', { mood: 'sad', if: { any: ['flag n5_glaciar', 'choice f_glaciar=free'] } }],
        ['f_hush', "(Hush folds her wings round her mother's claws.) Mother. Let go.", 'Mother. Let go.', { mood: 'tender', if: { any: ['flag n5_hush', 'choice m_hush=free'] } }],
        ['ash', 'Nyx.', { mood: 'tender' }],
        ['nyxara', 'Nobody has called me that in a thousand years. Not since the girl with the lantern.', 'Nobody has called me that in a thousand years.', { mood: 'sad' }],
        ['ash', 'Ember was sorry she stopped climbing the hill. So I climbed it instead. I brought you a lantern.', 'Ember was sorry she stopped coming. I came instead. I brought a lantern.', { mood: 'tender' }] ],
        else: [{ if: 'clue n5_her_name', then: [
        ['ash', 'Nyx.', { mood: 'tender' }],
        ['nyxara', 'Who told you that name? No. You will leave too. Everyone leaves.', 'Who told you that name? Everyone leaves.', { mood: 'scared' }] ],
        else: [
        ['narr', "She curls tighter round the sliver of moon. She is too scared to hear a word you say.", 'She holds the moon tight. She is too scared to listen.'] ] }] },
    ],
    // the final choice. (v12 R4) An unearned ending is hidden, not greyed: the moth pick shows only when its `if` holds
    // (the same condition as n_plea's kind branch and the act file's moth ending), and then it has no lock and no reason.
    // Each ending is 6 lines; the friends' and the Act I ending's lines are in the book.
    n_choice: [
      { choose: 'n_end', who: 'ash', mood: 'determined', ask: ['What will you do?', 'What will you do?'], pick: [
        { t: ['Light her a lantern, and let the moon go home', 'Light Nyx a lantern'], tone: 'kind', v: 'moth',
          if: 'solved n5_reach item n5_lantern trust friends>=2',
          then: ['set n_nyx_done', 'set n_heart_on=0', 'emit n4fx:choose', 'take n5_lantern', 'world n5_green_post moth'],
          say: [
            { do: ['emit n4fx:cut:lantern'] },
            ['narr', "You take out Mom's little paper lantern, squashed from the long climb, and light it very gently.", "You take out Mom's paper lantern. You light it gently."],
            ['ash', "Here. This one's yours. It won't last forever, lanterns never do. That's why we light new ones every year.", 'This one is yours. We light a new one every year.', { mood: 'tender' }],
            { do: ['emit n4fx:cut:click'] },
            ['narr', 'Nyx looks at the lantern for a long, long time. Then she opens her claws, and the last sliver of moon floats up and clicks into place.', 'Nyx lets go. The last bit of moon clicks into place.'],
            { do: ['emit n4fx:cut:whole'] },
            ['narr', 'The moon is whole, round and silver and enormous. The whole peak shines as if it were made of milk.', 'The moon is whole and bright again!'],
            { do: ['emit n4fx:cut:small'] },
            ['narr', 'And she gets smaller and smaller, until she is just a little grey moth with two pale moons on her wings, sitting on a paper lantern.', 'She gets small. A little grey moth, sitting on the lantern.'],
            ['nyxara', "...It's so warm.", 'It is so warm.', { mood: 'tender' }] ] },
        { t: ['End the Long Night for good', 'End the Long Night'], tone: 'brave', v: 'dawn',
          then: ['set n_nyx_done', 'set n_heart_on=0', 'emit n4fx:choose'],
          say: [
            ['ash', "I'm not giving it to you. And there's no more Long Night, for anyone.", 'I will not give it to you. No more Long Night.', { mood: 'determined' }],
            { do: ['emit n4fx:cut:breath'] },
            ['narr', 'You breathe Heartfire, gold and silver, the biggest breath of your whole life.', 'You breathe gold and silver fire. Your biggest breath ever.'],
            { do: ['emit n4fx:cut:moths'] },
            ['narr', "Nyxara doesn't scream. She sighs, like someone falling asleep, and comes apart into a thousand tiny silver moths.", 'Nyxara sighs. She turns into a thousand silver moths.'],
            { do: ['emit n4fx:cut:stitch'] },
            ['narr', 'The moths fly up to the moon and stitch its cracks shut like a quilt. You can still see the seams, silver, like a mended cup.', 'The moths fly up and sew the moon back together.'],
            { do: ['emit n4fx:cut:mended', 'emit n4fx:cut:sunrise'] },
            ['narr', 'Then, far away at the edge of the world, the sky goes pink, and gold, and then blue.', 'Far away, the sky turns pink, then gold, then blue.'],
            ['ash', "Morning. It's actually morning.", 'Morning! It is really morning!', { mood: 'happy' }] ] },
        { t: ['Give the Ember Heart to the moon', 'Give the Heart to the moon'], tone: 'kind', v: 'embermoon',
          then: ['set n_nyx_done', 'set n_heart_on=0', 'emit n4fx:choose', 'take m_heart'],
          say: [
            ['ash', "You can't keep the moon by eating it. But maybe the moon could keep you warm.", "You can't keep the moon by eating it. But it could keep you warm.", { mood: 'tender' }],
            { do: ['emit n4fx:cut:hold'] },
            ['narr', 'You hold up the Ember Heart, blazing gold and silver. Then you give it away: straight up, as high as you can throw.', 'You hold up the Heart. Then you throw it up to the moon, a gift.', { do: ['emit n4fx:cut:throw'] }],
            ['pip', 'MIP?!', { mood: 'surprised' }],
            { do: ['emit n4fx:cut:catch'] },
            ['narr', "The Heart flies into the empty moon, and the moon catches fire. It isn't a scary fire. It's a lantern fire, warm and orange, like a window when somebody is waiting up for you.", 'The Heart flies into the moon. It glows warm, like a lantern.'],
            ['narr', 'Nyxara looks up at it. Her eyes fill with orange light. For the first time in a thousand years, she is not cold.', 'Nyxara looks up. For the first time, she is not cold.'],
            { do: ['emit n4fx:cut:curl'] },
            ['narr', 'She lets go of the last sliver of moon, flies up, and curls round the warm gold moon like a cat round a stove. And she falls asleep.', 'She curls up on the warm moon like a cat, and sleeps.'] ] },
      ] },
    ],
  },
})
