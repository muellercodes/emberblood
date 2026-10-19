// game/story/act1/people.js (J1): Emberhollow people in the v11 talk shape (STORY_PLAN 6.3). Mabel, Hal and Maren are
// done here as the pattern for the talk writers (J9 to J12); the how-to is v11/J1_NOTES.md. How it plays:
//  - The first matching entry with a say (top to bottom) is the person's greeting, the opener. The menu sits under it,
//    and its re: are what Ash can say back to that line. Once Ash answers, the opener steps aside for the next one.
//  - An opener already heard today is not said again: the person says their idle line instead (no replies).
//  - ask: entries are menu topics with their own labels; up to three show, each only while its if holds.
//  - then: ['said key'] remembers what Ash answered; if: 'said key' reads it, here in another person's talk too.
//  - Order in each list: one-time callbacks first, then the openers for each part of the act, then topics, idle, bye.
// Act I stages: wake, lanterns (Lantern Day morning), raid, lore (go to Yara), hollow (Yara has told him; relight the
// Ward), warcamp (the Hollow Ward is lit), wren, oath, three, gate, summit, done (the act is over: flag act1_done).
// The old code still runs these people's quest offers and story talk first (a9d_quests.js storyTalk, offerQuest); this
// is what they say when Ash just walks up to them.
people({
  id: 'a1_talk', act: 1,
  talk: {
    // ---------------------------------------------------------------- Mabel Thornbury, herbalist (Thornbury Cottage)
    // Practical, bossy in a fond way, has patched Ash up every week since he was four. Talks about remedies and Gran.
    mabel: [
      // she remembers that Ash asked who else was hurt (said mabel_asked_hurt, set below)
      { if: 'said mabel_asked_hurt stage>=warcamp !flag act1_done', once: true,
        say: ["Hal's walking on that ankle again. I told him you asked after him. He went quite pink. Nobody asks after Hal.",
          'Hal can walk again. I told him you asked. He went pink.'] },
      // Lantern Day morning
      { if: 'stage<raid',
        say: ['Morning, Ash. Mind my mint by the well. Every Lantern Day somebody treads on it, and every year it is you.',
          'Morning! Mind my mint by the well. You always step on it.'],
        re: [
          { t: ["I'll jump right over it this year.", "I'll jump over it."], say: ["You'll land in it. Go round.", 'Go round it.'] },
          { t: ['Why plant mint by a well?', 'Why mint by the well?'],
            say: ["Everyone stops at the well, and somebody always has a sore tummy by noon. Two hundred of Bertram's buns will do that.",
              "Everyone stops there. And the buns give sore tummies."] },
        ] },
      // the raid (this opener has its own idle: what she says if Ash comes back mid-raid)
      { if: 'stage=raid',
        say: ["Go, Ash! I'll patch you up after. Go!", "Go! I'll fix your cuts after."],
        idle: ['Kobolds first, Ash. Bandages after.', 'Kobolds first!'],
        re: [
          { t: ['Are you safe in there?', 'Are you safe?'], say: ["I've a kettle on the boil and a rolling pin. I'm safe. Go!", 'I have a kettle and a rolling pin. Go!'] },
          { t: ['Where are most of them?', 'Where are they?'], say: ["Down by the turnips. Hal's shouting at them. It isn't working.", "At the turnips. Hal is shouting."] },
        ] },
      // after the raid (the example in STORY_PLAN 6.3)
      { if: 'stage>=lore stage<warcamp',
        say: ['Let me look at you. Scratches, bruises, one singed eyebrow. Same as every week since you were four.',
          'Let me look at you. Scratches again, like always.'],
        re: [
          { t: ['It was eight kobolds, Mabel.', 'Eight kobolds!'], tone: 'brave',
            say: [['mabel', 'Eight. And you came out of it with one eyebrow. Sit. This will sting.', 'Eight! Sit. This will sting.']] },
          { t: ['Is anyone else hurt?', 'Is anyone hurt?'], tone: 'kind', f: 0.5, then: ['said mabel_asked_hurt'],
            say: [['mabel', 'Hal turned his ankle chasing one out of the turnips. I told him turnips grow back. Ankles take longer.',
              'Hal hurt his ankle. Turnips grow back. Ankles are slower.']] },
          { t: ['The eyebrow was on purpose.', 'I meant to do that.'],
            say: [['mabel', 'Of course it was. Hold still.', 'Of course. Hold still.']] },
        ] },
      // the Hollow Ward is lit: Ash is off to the kobold camp
      { if: 'stage=warcamp',
        say: ['Off to the camp? Then listen. Little purple flowers, low under the trees. Chew one if you get cut. They taste like old socks, and they work.',
          'Purple flowers grow under trees. Chew one if you get cut. They taste bad. They work.'],
        re: [
          { t: ['How do you know what socks taste like?', 'How do you know?'], say: ['Ask my gran. She tried every remedy on me first.', 'Gran tried every remedy on me.'] },
          { t: ['Do they work on dragons?', 'Do they work on dragons?'],
            say: ["They worked on you when you were four and sat down in Hal's nettles.", "They worked when you sat in Hal's nettles."] },
        ] },
      // a moment (her old chat, "Do you think plants have feelings?"), once Ash is out picking her purple flowers (J9)
      { if: 'stage>=warcamp !flag act1_done',
        say: ['Gran talks to her plants every morning. She says they grow better for it. Do you think plants mind being picked?', 'Gran talks to plants. Do they mind being picked?'],
        re: [
          { t: ['I say sorry when I pick them.', 'I say sorry to them.'], tone: 'kind', f: 1, then: ['said mabel_sorry_plants'],
            say: ['You do? Gran is going to like you. I shall write and tell her.', 'You do? I will tell Gran. She will like you.'] },
          { t: ['The thorny ones mind. A lot.', 'The thorny ones mind.'], say: ['The thorny ones mind everything. That is what the thorns are for.', 'Thorny ones mind everything.'] },
          { t: ['The turnips told me they were fine.', 'The turnips said they are fine.'], tone: 'silly',
            say: ["You've been talking to Hal.", 'You have been talking to Hal.'] },
        ] },
      // later in the act: Gran has gone quiet (before her basket quest starts; the old code offers the quest itself)
      { if: 'stage>=wren !flag act1_done !quest moss started',
        say: ['Gran used to write every week. Nothing for a month now.', 'Gran has not written for a month.'],
        re: [
          { t: ['I could go and check on her.', 'I could check on her.'], tone: 'kind', f: 0.5,
            say: ["Would you? Come back tomorrow. I'll have a basket ready, and a strongly worded note.", "Would you? Come back. I'll pack a basket."] },
          { t: ['Maybe the frog ate the letters.', 'The frog ate them?'], say: ["Sir Croaksley eats flies and Gran's patience. Never paper.", 'The frog eats flies. Not letters.'] },
        ] },
      // Act I is over
      { if: 'stage=done',
        say: ['Down off a mountain with both eyebrows still on. I had given up on them.', 'You came back with both eyebrows!'],
        re: [
          { t: ['I was careful. Mostly.', 'Mostly careful.'], say: ['Mostly is better than usual. Sit, I want to look anyway.', 'Better than usual. Sit.'] },
          { t: ['Did you watch from the green?', 'Did you watch?'],
            say: ["The whole village did. When the mountain went quiet, Hal cried. He says it was the smoke.", 'Everyone watched. Hal cried. He says it was smoke.'] },
        ] },
      // topics (her old TALK about, deep), each with a label written for her
      { ask: ['How is your gran?', 'How is your gran?'], if: '!quest moss done',
        say: ["Gran lives out in the Mirefen with a cauldron and a frog called Sir Croaksley. He isn't a knight. She says he is.",
          'Gran lives in the swamp with a frog. She says he is a knight.'] },
      { ask: ['Did Gran like her basket?', 'Did Gran like it?'], if: 'quest moss done',
        say: ['She wrote back. Four pages. Three of them are about the frog.', 'She wrote back. Mostly about the frog.'] },
      { ask: ['Did you always want to heal people?', 'Did you always want to heal?'], if: 'stage>=lore',
        say: ["I wanted to be a knight. Then I watched Gran set a knight's broken arm. He cried and she didn't. I liked her job better.",
          'I wanted to be a knight. Then I saw Gran fix one. I liked her job better.'] },
      { idle: [['What hurts now?', 'What hurts now?'], ["Anything else? The kettle's on.", 'The kettle is on.']] },
      { bye: [['Mind the mint on your way out.', 'Mind the mint.'], ['Off you go. Come back in one piece.', 'Come back in one piece.']] },
    ],

    // ---------------------------------------------------------------- Hal Burrows, farmer (Burrows Farmhouse)
    // Slow, plain, warm. Loves his animals and won't say so. Keeps the gate key on his belt (the Open Gate quest).
    hal: [
      // (J9) Fennick took Ash's advice and told Hal himself
      { if: 'said fennick_tell_hal choice fennick=forgive !flag act1_done', once: true,
        say: ['Fennick came and told me himself. Stood in my turnips and said it to my face. That took some doing. I gave him a turnip.', 'Fennick told me himself. Brave. I gave him a turnip.'] },
      // Lantern Day morning
      { if: 'stage<raid',
        say: ["Morning, Ash. The festival pumpkins are nearly ready, and Moo-rgaret has decided they're hers.", 'Morning! My cow thinks the pumpkins are hers.'],
        re: [
          { t: ['I can guard them for you.', 'I can guard them.'],
            say: ["From Moo-rgaret? She's twice your size and nothing scares her. Go and light your lanterns.", 'She is twice your size. Go light your lanterns.'] },
          { t: ['What are the pumpkins for?', 'What are they for?'], say: ['Pies, by tonight. If the cow allows it.', 'Pies tonight. If the cow allows it.'] },
        ] },
      // the raid
      { if: 'stage=raid',
        say: ["They're in the turnips! Ash, the turnips!", 'Kobolds in my turnips!'],
        idle: ["Go! They're getting away with the good ones!", 'Go! They are taking the good ones!'],
        re: [
          { t: ['How many are there?', 'How many?'], say: ['Two. Three. One of them is eating a turnip. Go!', 'Three! One is eating a turnip!'] },
          { t: ['Get inside, Hal!', 'Get inside!'], say: ["And leave my turnips? I've got a rake. Go on!", 'Leave my turnips? I have a rake!'] },
        ] },
      // after the raid: his best line (STORY_PLAN 2.8). The ankle reply only shows once Mabel has told Ash about it.
      { if: 'stage>=lore stage<warcamp',
        say: ["Ash. The turnips are coming back, slowly. They're shy since the kobolds.", 'My turnips are growing back. Slowly. They are shy.'],
        re: [
          { t: ["Turnips can't be shy, Hal.", "Turnips can't be shy!"], say: ["You didn't see them. One leaf up, then a long look round.", 'One leaf up. Then a long look round.'] },
          { t: ["How's the ankle?", "How's your ankle?"], if: 'said mabel_asked_hurt', tone: 'kind', f: 0.5,
            say: ["Fat as a cheese. Mabel wrapped it. Don't tell her I'm standing on it.", "It's fat. Don't tell Mabel I'm standing."] },
          { t: ['Did they get into the barn?', 'Did they get in the barn?'],
            say: ['Moo-rgaret lay down across the doorway. Nothing got past her. Nothing ever has.', 'My cow lay in the doorway. Nothing got past.'] },
        ] },
      // a moment (his old chat, rewritten as a question he would really ask, once the raid is over). One reply leads to
      // one more line with its own replies (next), and one of those is remembered (said hal_fire_soup, read by Maren).
      { if: 'stage>=lore !flag act1_done',
        say: ["I've known you since you were the size of a turnip, and I never asked. When you breathe fire, does it hurt?",
          'Can I ask? When you breathe fire, does it hurt?'],
        re: [
          { t: ["No. It's warm, like after soup.", "No. It's warm, like soup."], tone: 'kind', f: 0.75,
            next: { say: ['Like soup. Huh. What kind of soup?', 'Like soup! What kind?'],
              re: [
                { t: ["Mom's leek soup.", "Mom's leek soup."], then: ['said hal_fire_soup'],
                  say: ["Maren's leek soup. That's a proper answer. That soup could warm a stone.", 'Good answer. Her soup could warm a stone.'] },
                { t: ['Any soup, really.', 'Any soup.'], say: ["Fair enough. I like a lad who isn't fussy.", 'Fair. You are not fussy.'] },
              ] } },
          { t: ['Only when I sneeze it.', 'Only when I sneeze.'], say: ['That explains the scorch on my fence, then.', 'That explains my fence!'] },
        ] },
      // later in the act: letters from Ulf at the Lodge
      { if: 'stage>=warcamp !flag act1_done',
        say: ['Ulf wrote from the Lodge. Twelve pages on cheddar, and one line at the end: hope the dragon boy is well.',
          'Ulf wrote twelve pages on cheese. And one line about you.'],
        re: [
          { t: ["Tell him I'm well.", "Tell him I'm well."], say: ["I'll put it on page one. Then twelve pages on my cheddar.", "I'll write it first. Then the cheese."] },
          { t: ['Twelve pages? On cheddar?', 'Twelve pages?'], say: ["He's wrong about most of it. It'll take me fourteen to tell him.", 'He is wrong. I will write fourteen.'] },
        ] },
      // Act I is over
      { if: 'stage=done',
        say: ['Sir Strawsworth watched that mountain all week. Now he can go back to ignoring crows.', 'My scarecrow can go back to ignoring crows.'],
        re: [
          { t: ['Did he ever scare a crow?', 'Did he scare a crow?'], say: ['Once. It was windy and his arm fell off.', 'Once. His arm fell off in the wind.'] },
          { t: ['Did you watch the mountain too?', 'Did you watch too?'], say: ['From the barn roof, with the cow down below. Neither of us slept.', 'From the barn roof. The cow and I stayed up.'] },
        ] },
      // topics (his old TALK about, deep)
      { ask: ['Do you know Farmer Hollis?', 'Do you know Hollis?'],
        say: ["Hollis keeps goats. I keep cows. We nod to each other at weddings, and that's plenty.", 'Hollis has goats. I have cows. We nod at weddings.'] },
      { ask: ['How long have you farmed here?', 'How long have you farmed?'],
        say: ['Since I could hold a hoe. My dad farmed it before me, and his mum before him. Same turnips, near enough.', 'Since I was small. My dad did too. Same turnips!'] },
      { idle: [['Still here. So are the turnips.', 'Still here.'], ["Something else? I've a cow to see to.", 'I have a cow to see to.']] },
      { bye: [['Off you go. Mind the cow pats.', 'Mind the cow pats.']] },
    ],

    // ---------------------------------------------------------------- Maren, Ash's mom, the smith (the forge)
    // Voice sheet (STORY_PLAN 4): short, practical, warm, teasing; worry comes out as instructions and food, love as
    // work. Never "I'm proud of you", never a speech, never explains the plot. The old code still plays her story talk
    // first (the forge scene, reforging, hints, the raid, her quests); these are for every other visit.
    maren: [
      // a callback: Hal has been telling people what Ash said about his fire (said hal_fire_soup, set in Hal's talk)
      { if: 'said hal_fire_soup stage>=warcamp !flag act1_done', once: true,
        say: ["Hal's telling the whole green your fire feels like my leek soup. So now I'm making leek soup for the whole green.",
          'Hal says your fire is like my soup. Now everyone wants soup.'] },
      // Lantern Day, after the sword (the forge scene at wake is the old code's)
      { if: 'stage=lanterns',
        say: ['Go on, the green is waiting. Three lanterns, and gently. A breath, not a bellows.', 'Go light the three lanterns. Gently!'],
        re: [
          { t: ['What if one catches fire?', 'What if one burns?'], say: ["Then it's very lit. Stamp on it and do the next one.", 'Stamp it out. Light the next one.'] },
          { t: ['Will you come and watch?', 'Will you watch?'], say: ["I'll hear the cheer from here. That's how I'll know.", "I'll hear the cheer from here."] },
        ] },
      // after the raid, before Yara
      { if: 'stage=lore',
        say: ["Three windows broken, and Nana Pettibone's hen won't come down off the roof. Go and see Yara. She's asking for you.",
          'Three windows broke. Go and see Yara. She wants you.'],
        re: [
          { t: ['Are you hurt?', 'Are you hurt?'], tone: 'kind', f: 0.5, say: ["A burn on my thumb. My own forge does worse on a Monday. Go on, Yara's waiting.", 'Just my thumb. Go on, Yara is waiting.'] },
          { t: ['What does Yara want?', 'What does Yara want?'], say: ["She'll tell you herself. Go on. She's by the well.", 'She will tell you. She is by the well.'] },
        ] },
      // Yara has told him (stage hollow), and the Ward under the old oak is dark
      { if: 'stage=hollow',
        say: ["Yara told you the real story, didn't she? I can tell. You've got your grandma's frown.", "Yara told you the story? You have Grandma's frown."],
        re: [
          { t: ["I don't have a frown.", "I don't frown."], say: ['You have it right now. There. That one.', 'You have it now. That one.'] },
          { t: ['Is it true? All of it?', 'Is it all true?'], say: ["Yara doesn't tell stories she hasn't checked. Sit. I'll put the kettle on, then you go and light that Ward.", 'Yara checks her stories. Sit. Tea, then the Ward.'] },
        ] },
      { if: 'stage=hollow',
        say: ['The Hollow Ward, under the old oak. Your grandma used to take me there. The stone was always warm.', 'The Hollow Ward is under the old oak. It used to be warm.'],
        re: [
          { t: ["It's cold now.", "It's cold now."], say: ['Then go and make it warm. You know how.', 'Then go and make it warm.'] },
          { t: ['What did Grandma do there?', 'What did Grandma do?'], say: ["Put her hand on the stone and smiled. I thought she was being odd. I'd give a lot to ask her now.", 'She put her hand on the stone and smiled.'] },
        ] },
      // the Hollow Ward is lit: first, bed (the 'spark' dream plays the first time Ash sleeps at home now)
      { if: 'stage=warcamp !flag dr_seen_spark',
        say: ["A raid and a Ward in one day. Bed, Ash. Your bed's made, and that kobold camp will still be there in the morning.",
          'Bed, Ash. Your bed is made. The camp can wait.'],
        re: [
          { t: ["I'm not even tired.", "I'm not tired."], say: ["You're swaying. Bed.", 'You are swaying. Bed.'] },
          { t: ['Can I go tonight instead?', 'Can I go tonight?'], say: ['In the dark, to a camp full of kobolds? Bed first. Kobolds after breakfast.', 'In the dark? No. Bed first.'] },
        ] },
      // a moment (her old chat): once he is really leaving home
      { if: 'stage>=warcamp !flag act1_done',
        say: ['Ash. Be honest with me. Do I worry too much?', 'Be honest. Do I worry too much?'],
        re: [
          { t: ['You worry the right amount.', 'You worry just right.'], tone: 'kind', f: 0.75,
            say: ["That's what you say when you want a second sandwich. Here.", 'You want a sandwich. Here.'] },
          { t: ["A bit. I'll be careful anyway.", "A bit. I'll be careful."], tone: 'brave', f: 0.5, then: ['said maren_careful'],
            say: ['Careful anyway. Say it again at the door, so I hear it twice.', 'Say it again at the door.'] },
          { t: ["Only when I'm on fire.", 'Only when I burn.'], say: ["You're always a bit on fire. That's the whole trouble.", 'You are always a bit on fire!'] },
        ] },
      // on the road: Brindlecross and the Ash Ward
      { if: 'stage>=wren stage<three',
        say: ["Give me the sword a minute. Hm. You've been hitting rocks with it.", 'Give me the sword. You hit rocks with it!'],
        re: [
          { t: ['Only the big rocks.', 'Only big rocks.'], say: ["Big rocks are the worst ones. There. I've put the edge back.", 'Big rocks are worst. There, it is sharp.'] },
          { t: ['Kobolds hide behind rocks.', 'Kobolds hide there.'], say: ['Then hit the kobold, not the rock. The rock never did anything to you.', 'Hit the kobold, not the rock.'] },
        ] },
      // the three Wards
      { if: 'stage=three',
        say: ["Three Wards, three corners of the valley. You'll have seen more of Embermere than I have by the end of the month.",
          'Three Wards in three places. You will see the whole valley.'],
        re: [
          { t: ['Come with me this time?', 'Come with me?'], tone: 'kind',
            say: ['Somebody has to keep the forge lit, so you can see it from the hills.', 'Someone keeps the forge lit. You will see it.'] },
          { t: ["I'll tell you about all of it.", "I'll tell you all of it."], say: ['Every bit. The boring bits too. Those are the ones I like.', 'Every bit. Even the boring bits.'] },
        ] },
      // the Obsidian Gate
      { if: 'stage=gate', ref: 'obsidian_gate',
        say: ['The Obsidian Gate. When I was your age we dared each other to touch it. Nobody ever did.', 'Nobody ever touched the Obsidian Gate.'],
        re: [
          { t: ["I'll touch it for you.", "I'll touch it for you."], say: ['Then come back and tell me what it felt like.', 'Then come back and tell me.'] },
          { t: ['Why did nobody touch it?', 'Why not?'], say: ["It's warm. Not hot. Warm, like something is asleep on the other side.", 'It is warm. Like something sleeps behind it.'] },
        ] },
      // the summit, once she has given him the three lanterns (her quest a1_lanterns, the old code's offer)
      { if: 'stage=summit quest a1_lanterns started',
        say: ["Three lights on the mountain. I'll be at the forge door all night, watching.", 'Three lights. I will watch from the forge door.'],
        re: [
          { t: ["What if it's cloudy?", 'What if there are clouds?'], say: ["Then I'll climb up and look under the clouds.", 'Then I will climb up and look.'] },
          { t: ["You'll see all three.", 'You will see all three.'], say: ['I had better. Go on, before I change my mind and come with you.', 'Go on. Before I come with you.'] },
        ] },
      // Act I is over. first: true plays it once, ahead of the old code's own talk for this stage (e7_acts.js: talking
      // to Mom at 'done' starts Lantern Night, so a plain opener would never be heard; the next talk does that).
      // Two replies only show if they happened (the lanterns quest, and what Ash said when she asked).
      { if: 'stage=done', first: true,
        say: ['You came back down. That was the only rule.', 'You came back down. That was the rule.'],
        re: [
          { t: ['I lit all three lanterns.', 'I lit all three.'], if: 'quest a1_lanterns done',
            say: ['I saw them. All three. I sat on the step until the third one.', 'I saw all three. I waited for the third.'] },
          { t: ['I told you I would be careful.', 'I said I would be careful.'], if: 'said maren_careful',
            say: ['You did. Twice, at the door. And you came home, so I believe you.', 'You did. And you came home.'] },
          { t: ["What's for supper?", "What's for supper?"], say: ['Anything you like. Tonight, anything.', 'Anything you like tonight.'] },
        ] },
      // topics (her old TALK about and deep)
      { ask: ['Do you know Gorran Flint?', 'Do you know Gorran?'], if: 'stage>=wren',
        say: ['Gorran taught me to read ore when I was your age. If he tells you a rock is lying, believe him.', 'Gorran taught me about ore. Believe him about rocks.'] },
      { ask: ['Was Yara your teacher too?', 'Did Yara teach you?'], if: 'stage>=hollow',
        say: ["She made me copy the five Wardens' names until I could do it in my sleep. Bram has one m. Remember that.", "She made me copy the Wardens' names. Bram has one m."] },
      { ask: ['What was I like as a baby?', 'What was I like as a baby?'],
        say: ["Your first sneeze set the midwife's apron alight. She still comes for tea. She sits by the door.", "Your first sneeze burned the midwife's apron. She sits by the door now."] },
      { idle: [["Mm? I'm listening. The hammer's just loud.", "I'm listening."], ['Go on. I can hammer and listen.', 'Go on. I am listening.']] },
      { bye: [['Back before dark. I mean it.', 'Back before dark.'], ['Go on. And take your scarf.', 'Take your scarf.']] },
    ],

    // ---------------------------------------------------------------- Elder Yara, by the well (J9)
    // Voice sheet: dry, kind, the village elder; the counting gag is gone. Taught Maren and Wren their letters; Pebble
    // the crow carries her letters and steals buttons. The old code (a9d_quests.js storyTalk) plays her lines on Lantern
    // Day, during the raid and her real story at 'lore'; from 'hollow' on it gives her one hint line unless she has a
    // menu option live. So each stage below has an option: the way to where Ash is going, in her words (it keeps her
    // hint one click away, and it gives her this menu, the opener first).
    yara: [
      { if: 'stage=hollow', option: ['How do I wake the Ward again?', 'How do I wake the Ward?'], ref: 'hollow_ward',
        say: ['The Hollow Ward is under the old oak. Put your breath on the stone and keep it there. It will know you.', 'Breathe on the stone under the old oak. Keep breathing.'] },
      { if: 'stage=warcamp', option: ['Which way is the kobold camp?', 'Where is the kobold camp?'], ref: 'warcamp',
        say: ["Grizzlefang's camp is north of the village, at the edge of the woods. Follow the road, and the smell.", "His camp is north, by the woods. Follow the road."] },
      { if: 'stage=wren', option: ['How do I get to Brindlecross?', 'Which way is Brindlecross?'], ref: 'brindlecross',
        say: ['East along the road, on Lake Mirrow. Sister Wren is in the library. She will have been expecting you since she was nine.', 'East on the road, by the lake. Wren is in the library.'] },
      { if: 'stage=oath', option: ['Where is the Ash Ward?', 'Where is the Ash Ward?'], ref: 'ash_ward',
        say: ['Up the Ashen Road, northeast of Brindlecross, past the Smoky Kettle. Watch for their fire bolts.', 'Up the Ashen Road, past the Smoky Kettle.'] },
      { if: 'stage=three', option: ['Where are the last three Wards?', 'Where are the other Wards?'], ref: 'crag_ward',
        say: ['The Crag Ward in the far east. The Sunken Ward in the Mirefen, southeast. The Frost Ward up in the Frostpine, northwest.', 'Crag in the east. Sunken in the southeast. Frost in the northwest.'] },
      { if: 'stage=gate', option: ['How do I get to Sir Cindervane?', 'Where is Sir Cindervane?'], ref: 'obsidian_gate',
        say: ['Due north of Brindlecross, at the end of the long road. You cannot miss it. It is the only thing up there that is black.', 'North of Brindlecross, at the end of the road.'] },
      { if: 'stage=summit', option: ["What's at the top of the mountain?", 'What is at the top?'], ref: 'cinder_mountain',
        say: ['His throne, and him. Nobody has been up there in a thousand years. I would very much like you to be the first one down.', 'His throne, and him. Please come back down.'] },
      { if: 'stage=done', option: ['What happens now?', 'What happens now?'],
        say: ['Now? Lantern Night. Your mother has been folding paper since dawn. Go and find her before she folds you.', 'Lantern Night! Go and find your mom.'] },
      // she told him the real story at 'lore' (the old code); this is the next time he walks up to her
      { if: 'stage=hollow',
        say: ["You're taking it better than your mother did. When I told her, she dropped my teapot.", 'You took it better than your mom. She dropped my teapot.'],
        re: [
          { t: ['Mom knew? All this time?', 'Mom knew?'],
            say: ['Every Emberblood is told, when they are old enough. She wanted you to have one more ordinary Lantern Day. So did I.', 'She knew. She wanted you to have one more normal day.'] },
          { t: ['Was it a nice teapot?', 'Was it a nice teapot?'], say: ['It was mine. That is the nicest kind.', 'It was mine. So yes.'] },
        ] },
      // the Hollow Ward is lit, and Iska spoke from the stone
      { if: 'stage=warcamp', ref: 'hollow_ward',
        say: ['I saw the old oak light up from here. Did she speak to you? Iska?', 'I saw the Ward light up. Did Iska speak?'],
        re: [
          { t: ['She said he wants me. Not the valley.', 'He wants me, not the valley.'], tone: 'brave', then: ['said yara_heard_iska'],
            say: ["Then he can come through this village first. I'm old, Ash, but I'm very good at being in the way.", 'Then he must get past us. I am good at being in the way.'] },
          { t: ['She sounded kind. And tired.', 'She sounded kind and tired.'],
            say: ['A thousand years in a stone. I would be tired too. Kind, she always was, in the stories.', 'A thousand years in a stone. Anyone would be tired.'] },
        ] },
      // after Grizzlefang: she heard the voice through the shrine stone (the Open Gate offer plays first, from a1_gate.js)
      { if: 'stage=wren',
        say: ['I heard him through the shrine stone, Ash. He talked to you as if you already belonged to him.', 'I heard him through the stone. He talked like you were his.'],
        re: [
          { t: ['He sounded old. And hungry.', 'He sounded old and hungry.'],
            say: ['Old and hungry, and very sure of himself. Go and see Wren. She knows more than I do, and she will tell you so.', 'Go and see Wren. She knows more than me.'] },
          { t: ['You were listening the whole time?', 'You listened the whole time?'], f: 0.5,
            say: ["Through a stone the size of a loaf. I wasn't going to let you talk to dragons alone.", 'Yes. You will not talk to dragons alone.'] },
        ] },
      // her old chat, rewritten: the night he knows the Oath wants to hand him to the mountain (after Wren's story)
      { if: 'stage=oath',
        say: ["Ash, may I ask you something an old woman shouldn't? Do you ever wish you were just an ordinary boy?", 'Can I ask? Do you wish you were an ordinary boy?'],
        re: [
          { t: ['Sometimes. Ordinary boys get to sleep in.', 'Sometimes. They get to sleep in.'], f: 0.5,
            say: ['They do. And they have ordinary mothers who get them up anyway. You would have lost on both counts.', 'They do. And their moms still wake them.'] },
          { t: ["No. Then who'd light the Wards?", "No. Who would light the Wards?"], tone: 'brave', f: 0.75, then: ['said yara_not_ordinary'],
            say: ["Nobody. That's the trouble. I'm glad you said it, and I'm sorry you had to.", "Nobody. I'm glad you said it. And sorry."] },
          { t: ["Ordinary boys can't toast marshmallows with their face.", "They can't toast marshmallows!"], tone: 'silly',
            say: ['That is a very strong point. I withdraw the question.', 'A strong point. Forget I asked.'] },
        ] },
      { if: 'stage=three',
        say: ['Three Wards left, and all far off. Hold out your hand. A button, from Pebble. She only gives those to people she expects back.', 'Hold out your hand. A button from Pebble. She wants you back.'],
        re: [
          { t: ["Tell her I'll bring it back.", "I'll bring it back."], say: ['Bring yourself back. The button is extra.', 'Bring yourself back. The button is extra.'] },
          { t: ['Does she give you buttons?', 'Does she give you buttons?'], say: ['Every winter, one. I keep them in a jar. Sixty-one buttons. Not that I have counted.', 'One every winter. I keep them in a jar.'] },
        ] },
      { if: 'stage=gate', ref: 'obsidian_gate',
        say: ['Sir Cindervane has stood at the Obsidian Gate for a thousand years. My father took me to see him once. He never blinked.', 'My dad took me to see Sir Cindervane once. He never blinked.'],
        re: [
          { t: ['Did he say anything to you?', 'Did he speak to you?'],
            say: ['He said, "Not yet." I was six. I thought he meant me, and I cried all the way home.', 'He said "Not yet." I was six. I cried all the way home.'] },
          { t: ["I'll tell him you said hello.", "I'll say hello for you."], tone: 'kind', f: 0.5,
            say: ['Tell him the girl with the bag of plums says hello. He might remember the plums.', 'Say the girl with the plums says hello.'] },
        ] },
      { if: 'stage=summit',
        say: ["Before you climb, go and see your mother. She's been standing in the forge door all evening.", 'See your mom before you climb. She is at the forge door.'],
        re: [
          { t: ["I'll go now.", "I'll go now."], say: ['Good. Go the long way, past the green. Let people see you.', 'Good. Go past the green. Let them see you.'] },
          { t: ['Will you watch from the well?', 'Will you watch too?'], say: ['From the well, all night. Pebble has better eyes than me. She will tell me.', 'All night. Pebble will tell me what she sees.'] },
        ] },
      // Act I is over: what she says depends on how it ended (and what he told her at 'oath')
      { if: 'stage=done said yara_not_ordinary', once: true,
        say: ["You told me somebody had to light the Wards. I've thought about it every night since. I'm glad it was you, and I'm glad it's done.", "You said someone had to do it. I'm glad it was you."] },
      { if: 'stage=done choice ending=lantern',
        say: ['Your grandfather asked me for cake. I gave him cake. I did not know what else to do with a dragon the size of a goat.', 'Your grandpa asked me for cake. So I gave him cake.'],
        re: [
          { t: ['Did he like it?', 'Did he like it?'], say: ['He ate it, and then he ate the plate. I am choosing to take that as a yes.', 'He ate the cake. Then the plate. So, yes.'] },
          { t: ['Are you scared of him?', 'Are you scared of him?'], say: ['I was, for sixty years. Then he asked for cake. It is hard to stay scared of someone who asks for cake.', 'I was. Then he asked for cake.'] },
        ] },
      { if: 'stage=done',
        say: ['The whole valley slept last night, Ash. First time in a week. I sat up anyway. Old habit.', 'The whole valley slept last night. I sat up anyway.'],
        re: [
          { t: ['You should sleep tonight, then.', 'You should sleep tonight.'], tone: 'kind', say: ['I will. After Lantern Night. After the fireworks. After the washing up.', 'I will. After Lantern Night.'] },
          { t: ['Was it like the stories?', 'Was it like the stories?'],
            say: ["Better. In the stories nobody ever comes home and asks what's for supper.", 'Better. In stories nobody asks about supper.'] },
          { t: ['I kept your button.', 'I kept your button.'], say: ['Then Pebble was right about you. She usually is.', 'Then Pebble was right about you.'] },
        ] },
      // topics (her old TALK deep and about)
      { ask: ['When did you light your first lantern?', 'Your first lantern?'],
        say: [['yara', "I was eight. I burned my thumb, and Iska's statue was right there, and I would swear it smiled.", "I was eight. I burned my thumb. Iska's statue smiled."],
          ['yara', 'Sixty Lantern Days in a row I lit the first one. This year it was you. It felt right.', 'Sixty years I lit the first. This year, you did.']] },
      { ask: ['Did you really teach Mom her letters?', 'Did you teach Mom?'], if: 'stage>=hollow',
        say: ['Her letters and her sums. I tried to teach her to sit still, but that never took. She would copy out the Wardens with a hammer in her other hand.', 'Letters and sums. Not sitting still. She held a hammer the whole time.'] },
      { ask: ['What was Wren like when she was little?', 'What was Wren like?'], if: 'stage>=wren',
        say: ['She asked why four hundred times a day. I answered three hundred. The rest she looked up, and look where it got her.', 'She asked why all day. Now she runs a library.'] },
      { idle: [["Ask, Ash. I've nowhere to be but this well.", 'Ask away.'], ['Pebble is listening too. Go on.', 'Pebble is listening. Go on.']] },
      { bye: [['Go gently, Ash.', 'Go gently.'], ['Off you go. Pebble, leave his buttons alone.', 'Pebble, leave his buttons!']] },
    ],

    // ---------------------------------------------------------------- Bertram Crumb, the baker (Crumb's Bakery) (J9)
    // Big, floury, flustered, warm. Frets about his oven and Ash's breath. His sister Tilly runs the Sleepy Salmon in
    // Brindlecross; they have not spoken in nine years over Grandma Crumb's Lantern Bun (his quest 'bun').
    bertram: [
      // the heir ending: small Grandpa lives on the warm shelf above his oven (a1d_story.js ENDINGS.heir)
      { if: 'stage=done choice ending=heir',
        say: ["Your grandfather is on the shelf above my oven. He's been there since dawn. He has not said thank you.", 'Your grandpa is on my oven shelf. No thank you yet.'],
        re: [
          { t: ['Does he want a bun?', 'Does he want a bun?'], say: ['He looked at one. Then he looked at me. I have made another batch, just in case.', 'He looked at one. I made more, just in case.'] },
          { t: ["He's not used to warm, I think.", 'He is not used to warm.'], tone: 'kind', f: 0.5,
            say: ['A thousand years on a mountain. The shelf is a start. I have put a cushion up there. He sat on it.', 'A shelf is a start. I gave him a cushion. He sat on it.'] },
        ] },
      { if: 'stage<raid',
        say: ['Happy Lantern Day, Ash! Two hundred buns in, and the oven is behaving itself. Breathe the other way, please.', 'Happy Lantern Day! Please breathe the other way.'],
        re: [
          { t: ["I'll hold my breath all the way.", "I'll hold my breath."], say: ['You will go purple. Purple is fine. Purple does not catch.', 'You will go purple. Purple is fine.'] },
          { t: ['Who are two hundred buns for?', 'Who are they for?'],
            say: ["The green, tonight. Hal will eat forty. Everyone else gets the rest, and there's never enough.", 'The green tonight. Hal eats forty!'] },
        ] },
      { if: 'stage=raid',
        say: ["Ash! There's a kobold in my flour bin! Get it out before it sneezes!", 'A kobold is in my flour! Get it out!'],
        idle: ['The flour bin, Ash! The flour bin!', 'The flour bin!'],
        re: [
          { t: ['What happens if it sneezes?', 'What if it sneezes?'], say: ['Flour, and a sneeze, and a hot oven. Think about it. Quickly, please.', 'Flour and a hot oven. Think about it!'] },
          { t: ['Hit it with your rolling pin!', 'Use your rolling pin!'], say: ['I tried! It ran off with the rolling pin. Go!', 'It took the rolling pin! Go!'] },
        ] },
      { if: 'stage>=lore stage<wren',
        say: ["Every bun on the tray has a kobold footprint in it. I can't sell them. I'll give them away and call it a festival.", 'Kobold footprints in every bun. They are free now.'],
        re: [
          { t: ["I'll have a footprint one.", "I'll have a footprint one."], say: ['Good lad. Take the one with the toes. Those are the best.', 'Take the one with toes. Those are best.'] },
          { t: ['Did they hurt you?', 'Did they hurt you?'], tone: 'kind', f: 0.5,
            say: ['Only my window, and my pride. The rolling pin is somewhere in the woods with a kobold. I hope it is very happy.', 'Just my window. A kobold has my rolling pin now.'] },
        ] },
      // later in the act, before the bun is baked: Tilly (the bun quest's whole story)
      { if: 'stage>=wren !flag act1_done !quest bun done', ref: 'sleepy_salmon_inn',
        say: ["Mom says you're off east. If you pass the Sleepy Salmon, don't mention me. Unless Tilly asks.", "If you see Tilly, don't mention me. Unless she asks."],
        re: [
          { t: ['And if she does ask?', 'And if she asks?'], then: ['said bertram_if_tilly_asks'],
            say: ['Then tell her I am well. And thinner. Lie about the thinner.', 'Say I am well. And thinner. That part is a lie.'] },
          { t: ["Why don't you go yourself?", "Why don't you go?"],
            say: ['Nine years is a long road, Ash. Longer than the real one.', 'Nine years is a long road. Longer than the real one.'] },
        ] },
      // his old chat, as a moment: once the bun quest is under way and he might see her again
      { if: 'quest bun started !quest bun done',
        say: ['Be honest with me. Do I smell like burnt bread? Tilly always said I did.', 'Be honest. Do I smell like burnt bread?'],
        re: [
          { t: ['You smell like bread. Good bread.', 'You smell like good bread.'], tone: 'kind', f: 0.75,
            say: ['Good bread. I will take that. I will take that all the way to Brindlecross.', 'Good bread! I will take that.'] },
          { t: ['A little. Round the edges.', 'A little. At the edges.'], tone: 'brave', f: 0.5,
            say: ['The edges. She was right. Nine years she has been right about my edges.', 'The edges! She was right all along.'] },
        ] },
      { if: 'quest bun done !flag act1_done',
        say: ["Tilly's coming for Lantern Night. She's bringing her own nutmeg. I've said nothing. I'm being very grown up.", 'Tilly is coming. With her own nutmeg. I said nothing!'],
        re: [
          { t: ["You're allowed to say something nice.", 'You can say something nice.'], say: ['I said "nice nutmeg." She cried. Then I cried. Then we argued about crusts.', 'I said "nice nutmeg." We both cried.'] },
          { t: ['Will the bun hold together?', 'Will the bun hold together?'], say: ['It will if you are nowhere near it. I say that with love.', 'If you stay away from it. With love.'] },
        ] },
      { if: 'stage=done',
        say: ["Lantern Night tonight, and the whole valley's coming. Three hundred buns in, and nobody touches that oven but me.", 'Three hundred buns for tonight. Nobody touches the oven!'],
        re: [
          { t: ['Not even me?', 'Not even me?'], say: ['You may light it. Gently. One breath. I will stand over here, by the door.', 'You can light it. Gently. I will stand by the door.'] },
          { t: ['Who eats three hundred buns?', 'Who eats them all?'], say: ['Everybody is coming. Gorran down from the mine, Granny Moss out of the bog. Gorran alone is fifty.', 'Everyone! Gorran alone eats fifty.'] },
        ] },
      // topics (his old about tilly, deep)
      { ask: ["Why don't you and Tilly talk?", "Why not talk to Tilly?"], if: '!quest bun done',
        say: ["Nine years ago we baked Grandma Crumb's Lantern Bun together, and it went off like a firework. She says too much fire. I say too much nutmeg.", 'Our bun went bang. She blames the fire. I blame the nutmeg.'] },
      { ask: ['Do you and Tilly write now?', 'Do you write to Tilly now?'], if: 'quest bun done',
        say: ['Every week. Short letters. Hers are mostly about my nutmeg, and mine are mostly about hers.', 'Every week. We still argue about nutmeg.'] },
      { ask: ['What was Grandma Crumb like?', 'What was Grandma Crumb like?'],
        say: ["She said bread is patience you can eat. I've been impatient my whole life. My bread is very fast.", 'She said bread is patience. I am not patient.'] },
      { idle: [['Mind the tray, it is hot.', 'The tray is hot.'], ["Something else? The dough won't wait.", "The dough won't wait."]] },
      { bye: [['Off you go. Breathe the other way on your way out.', 'Breathe the other way!']] },
    ],

    // ---------------------------------------------------------------- Fennick Wick, the lamp man (Wick's Lamps & Oils) (J9)
    // Nervous, quick, says "um", apologises. He left the North Gate open for the Scaled Oath (the Open Gate mystery,
    // a1_gate.js). Before it is solved he is twitchy but never gives it away; forgiven, he lights every lamp every night.
    // Turned in (choice fennick=jail) he is in the Watch House, and the old code gives him his cell lines there.
    fennick: [
      { if: 'stage<raid',
        say: ['Ash! Big day. Lots of lamps. I have been up since very early with the lamps. Just the lamps. Happy Lantern Day.', 'Big day! Lots of lamps. Just the lamps.'],
        re: [
          { t: ['You look tired, Fennick.', 'You look tired.'], say: ['Me? No. Yes. A bit. Lamps, you know. So many lamps.', 'Me? A bit. So many lamps.'] },
          { t: ['Can I help light some?', 'Can I help light some?'], say: ['No! I mean, no thank you. Gently is my whole job. You are very... fiery.', 'No thank you! You are very fiery.'] },
        ] },
      { if: 'stage=raid',
        say: ['Kobolds! In the lanes! How did they get in? Nobody knows. Go on, Ash, go!', 'Kobolds! How did they get in? Go, Ash!'],
        idle: ['Still here! Hiding! Go!', 'Hiding! Go!'],
        re: [
          { t: ['Get indoors, Fennick!', 'Get indoors!'], say: ['Indoors. Yes. Good. Indoors is where I live.', 'Indoors. Yes. Good idea.'] },
          { t: ['Somebody must have let them in.', 'Someone let them in.'], then: ['said fennick_flinched'],
            say: ['Let them in? Who would do that? Nobody. Nobody would do that. Go on!', 'Who would do that? Nobody! Go on!'] },
        ] },
      // after the raid, before the mystery is solved
      { if: 'stage>=lore !flag a1_gate_solved',
        say: ["Ash! Need a lamp? Wicks? I've got wicks. I'm fine, by the way. Everything is fine.", 'Need a lamp? Wicks? I am fine. All fine.'],
        re: [
          { t: ['Have you got any lamp oil?', 'Got any lamp oil?'], say: ['Oil. Ha. Not today. Not this week, really. Wicks, though!', 'Oil? Not today. Wicks, though!'] },
          { t: ["Why wouldn't you be fine?", "Why wouldn't you be fine?"], say: ['No reason! None at all. Would you like a wick?', 'No reason! Would you like a wick?'] },
        ] },
      // forgiven (choice fennick=forgive)
      { if: 'choice fennick=forgive !flag act1_done',
        say: ["I lit every lamp in the village last night, and I'll light them all again tonight. That's the deal.", 'I light every lamp now. Every night.'],
        re: [
          { t: ['Even the ones on the wall?', 'Even the wall lamps?'], say: ['Those first. Then I lock up behind me, and I check it twice.', 'Those first. Then I lock up. Twice.'] },
          { t: ['Does Hal speak to you yet?', 'Does Hal talk to you?'], say: ['He nodded at me this morning. From Hal, a nod is a whole speech.', 'He nodded at me. That is a lot, for Hal.'] },
          { t: ['You jumped when I said "let in".', 'You jumped, that day.'], if: 'said fennick_flinched',
            say: ['I know. I nearly told you then, in the lane, with kobolds everywhere. I wish I had.', 'I nearly told you then. I wish I had.'] },
        ] },
      // his old chat, as a moment (the old one only showed after the choice too)
      { if: 'choice fennick=forgive',
        say: ['Ash. Do you think people here will ever trust me again?', 'Will people ever trust me again?'],
        re: [
          { t: ['Light the green first. Everyone walks past.', 'Light the green first.'], tone: 'kind', f: 0.75,
            say: ["The green first. Where everybody walks. Yes. I'll start tonight.", 'The green first. I will start tonight.'] },
          { t: ["Tell Hal yourself. He'd rather hear it.", 'Tell Hal yourself.'], f: 1, then: ['said fennick_tell_hal'],
            say: ['Myself. To his face. With the turnips watching. ...You are right. I will.', 'To his face. You are right. I will.'] },
          { t: ['Start with Moo-rgaret. Cows forgive anything.', 'Start with the cow.'], tone: 'silly',
            say: ['She stood on my foot this morning. On purpose, I think.', 'She stood on my foot. On purpose.'] },
        ] },
      { if: 'stage=done choice fennick=forgive',
        say: ["Lantern Night, and I'm lighting it. Me. Yara asked. I had to sit down.", 'Yara asked me to light Lantern Night!'],
        re: [
          { t: ['You earned it, Fennick.', 'You earned it.'], say: ['I am earning it. Every night. Ask me again next year.', 'I am still earning it. Every night.'] },
          { t: ["I'll keep my breath to myself.", "I'll keep my fire to myself."], say: ['Just one breath at the end? For luck?', 'Just one breath, for luck?'] },
        ] },
      { ask: ['Do you still race lamp boats with Hob?', 'Do you race boats with Hob?'],
        say: ['Not since we were boys. He always cheated. I always lost. It was the most fun I ever had.', 'He cheated. I lost. It was the best fun.'] },
      { ask: ['How did the Oath find you?', 'How did the Oath find you?'], if: 'flag a1_gate_solved choice fennick=forgive',
        say: [['fennick', "My lamps were the best in the valley once. Then everyone copied Iska's old designs, and nobody needed me.", 'My lamps were the best. Then nobody needed me.'],
          ['fennick', 'They told me I was important. I wanted it to be true so badly that I stopped asking why.', 'They said I was important. I wanted that too much.']] },
      { ask: ['What makes a good lamp?', 'What makes a good lamp?'],
        say: ['A clean wick, good oil, and nobody breathing on it. No offence.', 'A clean wick. Good oil. No breathing on it.'] },
      { idle: [['Um. Yes? Something else?', 'Um. Yes?'], ['I am listening. I am also trimming wicks.', 'I am listening.']] },
      { bye: [['Mind how you go. Stay out of the dark.', 'Stay out of the dark.']] },
    ],

    // ---------------------------------------------------------------- Rook Ashby, ten, wants to be a knight or a dragon (J9)
    // Juniper's little brother (she maps caves; his quest 'hollow' is to find her). Writes to Elka at Frostpine Lodge.
    // Brave in a loud, small way; scared of the dark and geese.
    rook: [
      // callbacks: what Ash asked him on Lantern Day; and what Elka wrote back to him about Ash
      { if: 'said rook_where_juniper quest hollow active', once: true,
        say: ["You asked where Juniper was, this morning. I said she'd be back. I just wanted it to be true.", 'This morning I said she would be back. I wanted it to be true.'] },
      { if: 'stage<raid',
        say: ['Ash! Are you lighting the lanterns? Can I watch? Can I hold the sword? I will not drop it this time.', 'Can I watch you light them? Can I hold the sword?'],
        re: [
          { t: ['You can watch. Not the sword.', 'Watch, yes. Sword, no.'], say: ['Aww. Can I hold the handle? Just the handle?', 'Can I hold just the handle?'] },
          { t: ["Where's Juniper? She loves the lanterns.", "Where's Juniper?"], then: ['said rook_where_juniper'],
            say: [['rook', 'Mapping caves. She went three days ago. She promised she would be back for the lanterns.', 'Mapping caves. She said she would be back.', { ref: 'whisperwood_hollow' }]] },
        ] },
      { if: 'stage=raid',
        say: ["I'm hiding! I'm not scared. I'm hiding bravely.", 'I am hiding. Bravely!'],
        idle: ['Still hiding. Still brave.', 'Still hiding bravely.'],
        re: [
          { t: ['Good. Stay hidden.', 'Good. Stay hidden.'], say: ['Bravely?', 'Bravely?'] },
          { t: ['Watch the window for me.', 'Watch the window.'], say: ["I'm watching. If one comes, I'll roar.", 'I will roar if one comes.'] },
        ] },
      // his old chat, as a moment: he watched Ash fight the raid from the window
      { if: 'stage>=lore stage<warcamp',
        say: ['I watched you from the window. You breathed fire and they all ran. Can you teach me?', 'I saw you breathe fire! Can you teach me?'],
        re: [
          { t: ["You can't learn it. Sorry, Rook.", "You can't learn it. Sorry."],
            say: ['Then teach me the running-at-them bit. That looked good too.', 'Then teach me the running bit.'] },
          { t: ["Start with the roar. Let's hear it.", 'Start with the roar.'], tone: 'brave', f: 0.75, then: ['said rook_roar'],
            say: ['Raaah! ...Juniper says I sound like a kettle.', 'Raaah! Juniper says I sound like a kettle.'] },
          { t: ['Step one: eat a lot of peppers.', 'Step one: eat peppers.'], tone: 'silly', f: 0.5,
            say: ["I'll do it. Mum! Where are the peppers?", 'Mum! Where are the peppers?'] },
        ] },
      // Juniper is missing (his quest)
      { if: 'quest hollow active !flag juniper_found',
        say: ['Juniper is never late for supper. Never. She would sooner miss her own birthday.', 'Juniper is never late for supper. Never.'],
        re: [
          { t: ["I'll find her, Rook.", "I'll find her."], tone: 'kind', f: 0.5, say: ["Okay. I'll keep her supper warm. I'll sit on it if I have to.", 'Okay. I will keep her supper warm.'] },
          { t: ['She knows her way around anywhere.', 'She never gets lost.'], say: ['That is what I keep telling myself. It works for a bit.', 'I keep telling myself that.'] },
        ] },
      { if: 'flag juniper_found !flag act1_done',
        say: ["Juniper says I can carry her map case next time. That's basically being a knight.", 'I get to carry her map case! Like a knight.'],
        re: [
          { t: ["That's exactly being a knight.", 'That is being a knight.'], say: ["I knew it. I'm telling Elka.", 'I knew it! I am telling Elka.'] },
          { t: ['Did she tell you about the bats?', 'Did she tell you about the bats?'], say: ['Every bat. There were a lot of bats. I have heard about all of them twice.', 'Every bat. Twice.'] },
        ] },
      { if: 'stage>=warcamp !flag act1_done',
        say: ["I've been practising my roar for when you need help. Raaah. Mum says not in the house.", 'I practise my roar for when you need help.'],
        re: [
          { t: ['Better than last time.', 'Better than last time.'], if: 'said rook_roar', say: ['You remembered! I did it the way you said. From the belly.', 'You remember! I roar from my belly now.'] },
          { t: ['Your mum is right.', 'Your mum is right.'], say: ['Mums are always right about the house. Outside is different.', 'Outside is different.'] },
          { t: ['Try it on the geese.', 'Try it on the geese.'], say: ['I did. They roared back. Geese are not scared of anything.', 'They roared back. Geese fear nothing.'] },
        ] },
      { if: 'stage=done',
        say: ["I'm going to be you for Lantern Night. I made horns out of carrots.", 'I am dressing as you! Carrot horns!'],
        re: [
          { t: ['Carrot horns are better than mine.', 'Carrot horns are better.'], say: ['They are a bit bendy. And Moo-rgaret keeps looking at them.', 'They bend. And the cow keeps looking.'] },
          { t: ["Who's going to be the dragon?", "Who's the dragon?"], say: ['Juniper. She does the voice. It is very scary.', 'Juniper! She does a scary voice.'] },
        ] },
      { ask: ['How many maps has Juniper made?', 'How many maps has she made?'], if: '!quest hollow started', ref: 'whisperwood_hollow',
        say: ["Every lane in Emberhollow, twice. She says the caves are next. Mum says not till she's twenty.", 'Every lane, twice. Caves next, she says.'] },
      { ask: ['What does Elka write about?', 'What does Elka write about?'],
        say: ['Wolves, mostly. She draws them with huge teeth. I keep the letters under my pillow.', 'Wolves with big teeth. I keep her letters.'] },
      { ask: ['What are you scared of?', 'What scares you?'], if: 'stage>=lore',
        say: ['Nothing. Except the dark. And geese. And when Juniper does not come home. But mostly nothing.', 'The dark. Geese. Juniper not coming home.'] },
      { idle: [["I'm on guard. Ask me something.", "I'm on guard."], ["Knights don't get bored. I'm not bored.", "Knights don't get bored."]] },
      { bye: [['Bye, Ash! Roar if you need me!', 'Roar if you need me!']] },
    ],

    // ---------------------------------------------------------------- Wendel Fisk, Emberhollow's only fiddler (J9)
    // Dramatic about songs, cheerful about everything else. Played on the green all Lantern Day and never stopped, not
    // even for kobolds (Nana's alibi in a1_gate.js). A kobold took his song folder (his quest 'song'). Cousin of Dell.
    wendel: [
      { if: 'stage<raid',
        say: ["I'm on the green all day, Ash. The Lantern Waltz goes on at sunset, and it's the best thing I've ever written.", 'I play all day. My Lantern Waltz is at sunset.'],
        re: [
          { t: ['Will you play it twice?', 'Will you play it twice?'], say: ['If they clap. Hal always claps first, and then everyone feels they have to.', 'If they clap. Hal always claps first.'] },
          { t: ['Is there a song about me yet?', 'Is there a song about me?'], say: ['Nearly. "Ash" rhymes with "crash" and "splash", and I am not happy with either.', 'Nearly. Ash rhymes with crash. Not good.'] },
        ] },
      { if: 'stage=raid',
        say: ["A kobold took my song folder right off the stand! I can't stop now, I'm in the middle of the waltz!", 'A kobold took my songs! I am mid-waltz!'],
        idle: ['Still playing! Go!', 'Still playing! Go!'],
        re: [
          { t: ["Keep playing. I'll get them back.", "Keep playing. I'll get them."], say: ['Then I will play faster. Go!', 'Then I will play faster!'] },
          { t: ["Why can't you stop?", "Why can't you stop?"], say: ['You never stop a waltz halfway. Bad luck. Also I would forget where I was.', 'Stopping is bad luck. And I would get lost.'] },
        ] },
      // his old chat, rewritten as a moment that fits the day: he is writing about the raid
      { if: 'stage>=lore !flag act1_done',
        say: ["I'm writing a song about the raid, and I'm stuck. What rhymes with kobold?", 'I am writing about the raid. What rhymes with kobold?'],
        re: [
          { t: ["Nothing. Maybe that's why they're cross.", "Nothing. That's why they're cross."], tone: 'silly', f: 0.75,
            say: ["That's not a rhyme, Ash. That's a whole new verse. Hold still, I'm writing.", 'That is a whole new verse!'] },
          { t: ['Try "go bold". Like you did.', 'Try "go bold".'], f: 0.5, then: ['said wendel_go_bold'],
            say: ['"The kobolds came, so I went bold." Oh, that is good. I am stealing that and never giving it back.', 'Go bold! I am stealing that.'] },
        ] },
      { if: 'stage>=lore !quest song done !flag act1_done',
        say: ["Three songs gone. The Lantern Waltz is one of them, and I can't remember how the middle goes.", 'Three songs gone. I forget the middle of my waltz.'],
        re: [
          { t: ['Hum me the bit you remember.', 'Hum the bit you know.'], say: ['Dum, dum, da-dum... and then nothing. Like missing a stair in the dark.', 'Dum dum da-dum. Then nothing.'] },
          { t: ["I'll look out for the pages.", "I'll look for the pages."], tone: 'kind', f: 0.5, say: ['Would you? They have my name at the bottom, very large. I like to sign things.', 'Would you? My name is on each one.'] },
        ] },
      { if: 'quest song done !flag act1_done',
        say: ['We played all three, and Nana knitted through the whole waltz and dropped a stitch at the good part. Best review I ever had.', 'Nana dropped a stitch at the best part. Great review!'],
        re: [
          { t: ['Which part is the good part?', 'Which part is the good part?'], say: ["The middle. The bit I'd forgotten. You gave it back.", 'The middle. You gave it back to me.'] },
          { t: ['Can we play again sometime?', 'Can we play again?'], say: ['Any time. Bring your ears. You have very good ears.', 'Any time. You have good ears.'] },
        ] },
      { if: 'stage=done',
        say: ["I finished the song about you. Ash rhymes with flash now, and dash. Don't ask about the last verse.", 'I finished your song. Ash rhymes with flash now.'],
        re: [
          { t: ["What's in the last verse?", "What's the last verse?"], say: ['It rhymes Ash with moustache. The Mayor asked. He paid.', 'Ash and moustache. The Mayor paid for it.'] },
          { t: ['Will you play it tonight?', 'Will you play it tonight?'], say: ['Last, after the fireworks, when nobody can leave.', 'Last. After the fireworks.'] },
        ] },
      { ask: ['Is Dell really your cousin?', 'Is Dell your cousin?'],
        say: ['He is, and he thinks fish are friendly. One jumped out of the lake and took my sandwich. Friendly!', 'Yes. A fish once stole my sandwich. Friendly!'] },
      { ask: ["Who's the best musician in the valley?", 'Who plays best in the valley?'],
        say: ["Tamsin at the Smoky Kettle. She can make a lute cry. Mine sounds like a cat that's been told no.", 'Tamsin at the Smoky Kettle. Her lute can cry.'] },
      { idle: [["Hum something. I'll find the chord.", 'Hum something.'], ["Go on, I'm only tuning.", "I'm only tuning."]] },
      { bye: [['Off you go. I will play you out.', 'I will play you out.']] },
    ],

    // ---------------------------------------------------------------- Nana Pettibone, knitter (Pettibone Cottage) (J9)
    // Knits for the whole village; feeds anyone who sits still; calls Ash "dear". Her son Osric is Captain of the
    // Brindlecross Watch and does not write enough. Her husband was a Watch captain too.
    nana: [
      { if: 'stage<raid',
        say: ["Hold still, Ash, I'm measuring you for your winter sweater. Again. You keep growing horns.", 'Hold still! I am measuring you for a sweater.'],
        re: [
          { t: ['Leave room for the tail this time.', 'Leave room for my tail.'], say: ['I always leave room for the tail, dear. Last year you grew a new bit.', 'I always do. You grew a new bit last year.'] },
          { t: ['Does it have to be green?', 'Must it be green?'], say: ['Green brings out your eyes. And it hides grass stains. Mostly the second one.', 'Green hides grass stains.'] },
        ] },
      { if: 'stage=raid',
        say: ["There's one under my rocking chair, Ash! Shoo it out, dear!", 'A kobold is under my chair! Shoo it!'],
        idle: ['Under the chair, dear!', 'Under the chair!'],
        re: [
          { t: ['Stay up on the chair, Nana!', 'Stay on the chair!'], say: ["I'm not getting off. It's my chair.", 'I am not getting off. It is my chair.'] },
          { t: ['Poke it with a needle!', 'Poke it with a needle!'], say: ["I've poked it twice. It's thinking about leaving.", 'I poked it twice. It is thinking.'] },
        ] },
      { if: 'stage>=lore stage<warcamp',
        say: ["My hen went up on the roof when the kobolds came, and she says she's staying there.", 'My hen is on the roof. She will not come down.'],
        re: [
          { t: ["She'll come down for corn.", "She'll come down for corn."], say: ['I tried corn. She looked at it as if it were beneath her. Which it is.', 'I tried. She looked at it like it was beneath her.'] },
          { t: ['Maybe she likes the view.', 'Maybe she likes the view.'], say: ["She's a hen, dear. She likes anything that isn't a kobold.", 'She likes anything that is not a kobold.'] },
        ] },
      // her old chat, as a moment: the night he sets off for the kobold camp
      { if: 'stage=warcamp',
        say: ['You look thin, dear. Off to that camp, and you look thin. Have you eaten today?', 'Off to the camp? You look thin. Have you eaten?'],
        re: [
          { t: ['Not since breakfast, no.', 'Not since breakfast.'], tone: 'kind', f: 1,
            say: ['Since breakfast! Sit. Sit this instant. I have soup, and I have opinions.', 'Since breakfast! Sit down this instant.'] },
          { t: ['Mom gave me a sandwich.', 'Mom gave me a sandwich.'],
            say: ['Your mother makes sandwiches like horseshoes, dear. Take a scone as well. Take two.', 'Take a scone too. Take two.'] },
          { t: ['I ate a candle. Does that count?', 'I ate a candle.'], tone: 'silly', f: 0.5,
            say: ['Was it a good candle? ...Never mind. Scone.', 'Was it a good one? Never mind. Scone.'] },
        ] },
      { if: 'stage>=wren !flag act1_done',
        say: ["My Osric hasn't written since spring. Too busy being Captain of the Watch, he says. Too busy losing my letters, I say.", 'Osric has not written since spring.'],
        re: [
          { t: ["I'll tell him to write to you.", "I'll tell him to write."], tone: 'kind', f: 0.5, then: ['said nana_osric_write'],
            say: ['Tell him his mother says so. He will go pink. He always goes pink.', 'Say his mother says so. He will go pink.'] },
          { t: ['Maybe his dogs ate the letters.', 'Maybe his dogs ate them.'], say: ['His dogs have four teeth between them, dear. They could not eat a letter if they tried.', 'His dogs have four teeth between them.'] },
        ] },
      { if: 'stage=done',
        say: ["I'm knitting you a sweater for coming home. It has a dragon on it. The dragon looks like a turnip. I'm working on it.", 'A sweater with a dragon. It looks like a turnip.'],
        re: [
          { t: ['I like turnip dragons.', 'I like turnip dragons.'], say: ["Then you'll love this one. It's very turnip.", 'Then you will love it.'] },
          { t: ['Can it have a pocket?', 'Can it have a pocket?'], say: ['Every gift needs a pocket. I taught Marigold that. Now she puts them in hats.', 'Every gift needs a pocket.'] },
        ] },
      { ask: ["Was Osric's dad a captain too?", "Was Osric's dad a captain?"],
        say: ['Captain of the Watch, forty years. He used to say a warm person is a brave person. So I knit.', 'Yes. He said warm people are brave. So I knit.'] },
      { ask: ['Did you teach Marigold to knit?', 'Did you teach Marigold?'], if: 'stage>=wren',
        say: ['When she was smaller than you. Now she makes hats with feathers on. I am proud of her, and a little suspicious of the feathers.', 'Yes. Now she makes feather hats. I am suspicious.'] },
      { idle: [['Sit a minute, dear. My knees want the company.', 'Sit a minute, dear.'], ["I'm only counting stitches. Go on.", 'I am counting stitches. Go on.']] },
      { bye: [['Off you go. Keep your neck warm.', 'Keep your neck warm.']] },
    ],
  },
})
