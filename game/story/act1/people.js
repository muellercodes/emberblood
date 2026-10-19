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
      // (J9) home from Coppergulch, where Gorran asked after her
      { if: 'said gorran_asked_mom !flag act1_done', once: true, _park: 1,
        say: ["You smell of Cookie's rock soup. You've been up at Coppergulch. Did Gorran ask after me?", 'You went to Coppergulch! Did Gorran ask about me?'],
        re: [
          { t: ['He says you never visit.', 'He says you never visit.'],
            say: ['I never visit? He never... Hm. He is right. Next spring. Tell him next spring.', 'He is right. Next spring, I will.'] },
          { t: ['He says you taught him about beards.', 'He told me about his beard.'],
            say: ['I taught him to keep it out of the forge. It took three summers and most of the beard.', 'I told him to keep it out of the fire.'] },
        ] },
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
      // Act I is over. At 'done' the old code (e7_acts.js) starts Lantern Night the moment Ash talks to her, so these
      // are first: true (they play once, ahead of it, with her menu under them; the next talk is Lantern Night).
      { if: 'stage=done choice ending=lantern', first: true,
        say: ['Your grandfather asked me for cake. I gave him cake. I did not know what else to do with a dragon the size of a goat.', 'Your grandpa asked me for cake. So I gave him cake.'],
        re: [
          { t: ['Did he like it?', 'Did he like it?'], say: ['He ate it, and then he ate the plate. I am choosing to take that as a yes.', 'He ate the cake. Then the plate. So, yes.'] },
          { t: ['Are you scared of him?', 'Are you scared of him?'], say: ['I was, for sixty years. Then he asked for cake. It is hard to stay scared of someone who asks for cake.', 'I was. Then he asked for cake.'] },
          { t: ["Still glad I'm not ordinary.", "Still glad I'm not ordinary."], if: 'said yara_not_ordinary', say: ['So am I. Ordinary boys do not bring home grandfathers.', 'So am I. Ordinary boys bring no grandpas.'] },
        ] },
      { if: 'stage=done !choice ending=lantern', first: true,
        say: ['The whole valley slept last night, Ash. First time in a week. I sat up anyway. Old habit.', 'The whole valley slept last night. I sat up anyway.'],
        re: [
          { t: ['You should sleep tonight, then.', 'You should sleep tonight.'], tone: 'kind', say: ['I will. After Lantern Night. After the fireworks. After the washing up.', 'I will. After Lantern Night.'] },
          { t: ['Was it like the stories?', 'Was it like the stories?'], say: ["Better. In the stories nobody ever comes home and asks what's for supper.", 'Better. In stories nobody asks about supper.'] },
          { t: ["I'm glad it was me. Really.", "I'm glad it was me."], if: 'said yara_not_ordinary', say: ["So am I. And I'm glad it's done. Both, Ash.", 'So am I. And glad it is done.'] },
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
      { if: 'stage>=wren !flag a1_gate_solved !flag act1_done', ref: 'north_gate',
        say: ['Everyone is asking about the gate. Who has a key, who was where. I was polishing. I polish a lot.', 'Everyone asks about the gate. I was polishing.'],
        re: [
          { t: ['Polishing what, Fennick?', 'Polishing what?'], say: ['Lamps! Wicks. Lamp... other things. Why do you ask?', 'Lamps! Wicks! Why do you ask?'] },
          { t: ['Did you see anyone that morning?', 'Did you see anyone?'],
            say: ["See anyone? No. I wasn't looking. Nobody was looking. Excuse me, I think I hear a wick.", 'No. Nobody. I think I hear a wick.'] },
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
      { if: 'said elka_rook_brave', once: true,
        say: ["Elka wrote. She says you told her I'm brave. Is that true? Don't answer. It's true.", 'Elka says you said I am brave. Don\'t answer. It\'s true.'] },
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
            say: ["I'll do it. Mom! Where are the peppers?", 'Mom! Where are the peppers?'] },
        ] },
      // Juniper is missing (his quest)
      { if: 'quest hollow active !flag juniper_found',
        say: ['Juniper is never late for supper. Never. She would sooner miss her own birthday.', 'Juniper is never late for supper. Never.'],
        re: [
          { t: ["I'll find her, Rook.", "I'll find her."], tone: 'kind', f: 0.5, say: ["Okay. I'll keep her supper warm. I'll sit on it if I have to.", 'Okay. I will keep her supper warm.'] },
          { t: ['She knows her way around anywhere.', 'She never gets lost.'], say: ['That is what I keep telling myself. It works for a bit.', 'I keep telling myself that.'] },
        ] },
      { if: 'flag juniper_found !flag act1_done',
        say: ["I get to carry Juniper's map case next time. That's basically being a knight.", 'I get to carry her map case! Like a knight.'],
        re: [
          { t: ["That's exactly being a knight.", 'That is being a knight.'], say: ["I knew it. I'm telling Elka.", 'I knew it! I am telling Elka.'] },
          { t: ['Did she tell you about the bats?', 'Did she tell you about the bats?'], say: ['Every bat. There were a lot of bats. I have heard about all of them twice.', 'Every bat. Twice.'] },
        ] },
      { if: 'stage>=warcamp !flag act1_done',
        say: ["I've been practising my roar for when you need help. Raaah. Mom says not in the house.", 'I practise my roar for when you need help.'],
        re: [
          { t: ['Better than last time.', 'Better than last time.'], if: 'said rook_roar', say: ['You remembered! I did it the way you said. From the belly.', 'You remember! I roar from my belly now.'] },
          { t: ['Your mom is right.', 'Your mom is right.'], say: ['Moms are always right about the house. Outside is different.', 'Outside is different.'] },
          { t: ['Try it on the geese.', 'Try it on the geese.'], say: ['I did. They roared back. Geese are not scared of anything.', 'They roared back. Geese fear nothing.'] },
        ] },
      { if: 'stage=done',
        say: ["I'm going to be you for Lantern Night. I made horns out of carrots.", 'I am dressing as you! Carrot horns!'],
        re: [
          { t: ['Carrot horns are better than mine.', 'Carrot horns are better.'], say: ['They are a bit bendy. And Moo-rgaret keeps looking at them.', 'They bend. And the cow keeps looking.'] },
          { t: ["Who's going to be the dragon?", "Who's the dragon?"], say: ['Juniper. She does the voice. It is very scary.', 'Juniper! She does a scary voice.'] },
        ] },
      { ask: ['How many maps has Juniper made?', 'How many maps has she made?'], if: '!quest hollow started', ref: 'whisperwood_hollow',
        say: ["Every lane in Emberhollow, twice. Then she said caves were next, and Mom said not till she's twenty, and she went anyway.", 'Every lane, twice. Mom said no caves. She went anyway.'] },
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
      // (Dell's talk) Ash told Dell that fish dream about Wendel's sandwiches
      { if: 'said dell_sandwich !flag act1_done', once: true,
        say: ["Dell wrote to say you told him fish dream about my sandwiches. I've started eating indoors.", 'Dell says fish dream of my sandwiches. I eat indoors now.'] },
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
      // (Osric's talk in Brindlecross) Ash told him she says he never writes
      { if: 'said osric_never_writes !flag act1_done', once: true,
        say: ["Osric wrote at last! He says you told him I'd been complaining. I haven't been complaining, dear. I've been mentioning.", 'Osric wrote! He says you told him. I was only mentioning.'] },
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

// ================= Brindlecross (J9): the lake town east of Emberhollow. They know Maren and have heard of her boy;
// a first-meeting opener (once: true) comes first for each, unless Ash has already met them over a quest. Their part
// of the act: before Ash comes for Wren (stage < wren), the Oath on the Ashen Road (wren, oath), after Morrow
// (three on: choice morrow free or jail), and Lantern Night coming (done).
people({
  id: 'a1_talk_brindle', act: 1,
  talk: {
    // ---------------------------------------------------------------- Sister Wren, the librarian (a story lead)
    // Voice sheet: bookish, eager, out of her depth outdoors; Yara was her teacher. The old code plays her story at
    // 'wren' (STORY.wren), and the pages are handed in before the menu (deliverPages).
    wren: [
      { if: 'stage<wren', once: true,
        say: ["Ash? Look at you. The last time I was in Emberhollow, you were small enough to sit in Yara's wood basket.", 'Ash? You were so small last time I saw you!'],
        re: [
          { t: ['I sat in it last winter.', 'I sat in it last winter.'], say: ['Of course you did. It is the warmest seat in the valley. I used to fight Maren for it.', 'Of course. It is the warmest seat. I fought your mom for it.'] },
          { t: ['Yara says you ask a lot of questions.', 'Yara says you ask lots of questions.'], say: ['Yara says that about everyone she taught. She is right about me.', 'She says that about everyone. She is right about me.'] },
        ] },
      // what Ash told Yara about Iska travelled here by crow
      { if: 'said yara_heard_iska stage>=oath !flag act1_done', once: true,
        say: ['Pebble brought a note from Yara. She says Iska told you he wants you, not the valley. I read about it all night.', 'Yara wrote. Iska said he wants you. I read all night.'],
        re: [
          { t: ['Did you find anything?', 'Did you find anything?'], say: ['That the Wardens were frightened too, and wrote it down anyway. It helped me. It might help you.', 'The Wardens were scared too. They wrote it anyway.'] },
          { t: ['You should sleep, Wren.', 'You should sleep.'], tone: 'kind', f: 0.5, say: ['I will. When the Oath does.', 'When the Oath does.'] },
        ] },
      { if: 'stage=oath', ref: 'ash_ward',
        say: ["The Ash Ward is up the Ashen Road, past the Smoky Kettle. I've drawn you a map. It's mostly arrows.", 'The Ash Ward is up the Ashen Road. Here is a map.'],
        re: [
          { t: ['Come with me? You know the Wards.', 'Come with me?'], say: ["I know the Wards on paper. Paper doesn't have cultists in it. I'll be here, reading very fast.", 'I know them on paper. I will read very fast.'] },
          { t: ['Arrows are good. I like arrows.', 'I like arrows.'], say: ["Arrows are the best part of any map. I can't draw trees.", 'Arrows are the best part. I cannot draw trees.'] },
        ] },
      // after Morrow: what Ash chose
      { if: 'stage>=three choice morrow=jail !flag act1_done',
        say: ["Captain Osric has Morrow in the Watch House. He's asked me for books. Morrow, I mean. Not Osric.", 'Morrow is in the Watch House. He asked for books.'],
        re: [
          { t: ['What does he want to read?', 'What does he want to read?'], say: ['Gardening. Only gardening. I think he has had enough of dragons.', 'Only gardening. No more dragons.'] },
          { t: ['Is it strange, helping him?', 'Is it strange to help him?'], say: ['A little. But I have never seen anybody made worse by a book.', 'A bit. But books never made anyone worse.'] },
        ] },
      { if: 'stage>=three choice morrow=free !flag act1_done',
        say: ["You let Morrow go. I've thought about it all morning. I think I'd have done the same, and then worried for a week.", 'You let Morrow go. I would have too. Then worried.'],
        re: [
          { t: ['He said he would grow pumpkins.', 'He wants to grow pumpkins.'], say: ['Then I hope they are enormous, and that none of them are on fire.', 'I hope they are huge. And not on fire.'] },
          { t: ['Was that the wrong thing to do?', 'Was it wrong?'],
            say: ['I do not think so. I think it was the kind thing, and the kind thing is harder to check.', 'No. It was kind. Kind is harder to be sure of.'] },
        ] },
      // her old chat, as a moment: by now Ash has heard Iska and Bram speak
      { if: 'stage>=three !flag act1_done',
        say: ["You've heard two Wardens speak now. If you could ask one of them anything, what would it be?", 'You heard two Wardens. What would you ask one?'],
        re: [
          { t: ['Were you scared?', 'Were you scared?'], tone: 'kind', f: 1,
            say: ["Iska's handwriting shakes all the way through page four. I think that is a yes.", 'Iska wrote with shaky hands. I think yes.'] },
          { t: ['How do I finish what you started?', 'How do I finish it?'], f: 1,
            say: ["If I knew, I would have written it down for you. You're the one who can hear them. Ask them.", 'I do not know. You can hear them. Ask.'] },
          { t: ['Did Bram ever learn to spell?', 'Did Bram learn to spell?'], tone: 'silly', f: 0.5,
            say: ['He did not. There is a page where he spells "dragon" four different ways.', 'No. He spells dragon four ways.'] },
        ] },
      { if: 'stage>=gate !flag act1_done', ref: 'obsidian_gate',
        say: ["The Obsidian Gate. Iska's knight is still there, page seven says. I would give a lot to see him. From a long way off.", "Iska's knight still guards the Obsidian Gate."],
        re: [
          { t: ['Come and see him with me.', 'Come and see him.'], say: ['From a long way off, I said. Bring me back a drawing. With arrows.', 'Bring me a drawing instead.'] },
          { t: ['What was he like, in the book?', 'What was he like?'], say: ['Stubborn. He swore to stand there until it was finished. He very nearly has.', 'Stubborn. He swore to wait until the end.'] },
        ] },
      { if: 'stage=done',
        say: ["I'm writing it all down while you're still here to check my spelling of Vorlaxis.", 'I am writing it all down. How do you spell Vorlaxis?'],
        re: [
          { t: ["V, O, R... I don't know either.", "I don't know either."], say: ["Nobody does. Bram tried four ways. I'll go with his third.", 'Nobody does. I will use Bram\'s third try.'] },
          { t: ['Will I be in the book?', 'Will I be in the book?'], say: ['You are the last chapter. I have left a whole page for it, and a bit of the next.', 'You are the last chapter.'] },
        ] },
      { ask: ['What do you and Quill argue about?', 'What do you and Quill argue about?'],
        say: ['Whether the Wardens were heroes or just stubborn. She says stubborn. She is wrong. They were both.', 'If the Wardens were heroes or stubborn. Both!'] },
      { ask: ['Why did you become a librarian?', 'Why be a librarian?'],
        say: ['Because books do not bite. Now I spend my days reading about dragons who do, thanks to you.', 'Books do not bite. Now I read about dragons who do.'] },
      { ask: ['Did Yara teach you to spell?', 'Did Yara teach you to spell?'],
        say: ["She did. I still can't write Wardens without seeing her ruler. She used it to point. Only ever to point.", 'She did. With a ruler. Only for pointing.'] },
      { idle: [['Hm? Sorry. I was on page forty.', 'Sorry. I was reading.'], ['Ask me anything. Well, anything in a book.', 'Ask me anything.']] },
      { bye: [["Go carefully. I'll be here. I'm always here.", 'Go carefully.']] },
    ],

    // ---------------------------------------------------------------- Tilly Crumb, the Sleepy Salmon Inn
    // Brisk, warm, teasing; soup is her answer to everything. Bertram's sister; nine years without a word over a bun.
    tilly: [
      // what Bertram told Ash to say "if she asks" (said bertram_if_tilly_asks, Bertram's talk)
      { if: 'said bertram_if_tilly_asks !quest bun done !flag act1_done', once: true,
        say: ["You've come from Emberhollow. I can smell my brother's flour on you. Did he say anything?", 'You smell like my brother. Did he say anything?'],
        re: [
          { t: ["He says he's well. And thinner.", "He says he's well."],
            next: { say: ["Thinner. He's lying, and he wants me to know he's lying. Is he well, though? Truly?", 'Thinner? He is lying. But is he well? Truly?'],
              re: [
                { t: ['He talks about you. A lot.', 'He talks about you.'], tone: 'kind', f: 0.75,
                  say: ['Does he. Well. Tell him the soup is on, if he ever comes. He will not come.', 'Tell him the soup is on. He will not come.'] },
                { t: ['He is very floury.', 'He is very floury.'], say: ['Then he is well. Floury is how he is well.', 'Then he is well.'] },
              ] } },
          { t: ['He said not to mention him.', 'He said not to mention him.'], say: ['Then he is thinking about me. Good. Let him think.', 'Then he thinks about me. Good.'] },
        ] },
      { if: '!quest bun started', once: true,
        say: ["Maren's boy! I'd know those horns anywhere. Is my brother still baking? Don't tell him I asked.", "Maren's boy! Is my brother still baking?"],
        re: [
          { t: ['Two hundred buns a day.', 'Two hundred buns a day.'], say: ['Two hundred. He always did show off. Sit down, you look hungry.', 'He always showed off. Sit, you look hungry.'] },
          { t: ['Why not ask him yourself?', 'Why not ask him?'], say: ['Because then he would know I asked. Soup?', 'Then he would know I asked. Soup?'] },
        ] },
      { if: 'stage>=wren stage<three',
        say: ['Half the valley has come through my door this week, and every one of them wants to talk about the Oath. I tell them: soup first.', 'Everyone wants to talk about the Oath. Soup first.'],
        re: [
          { t: ['What are people saying?', 'What are people saying?'], say: ["Camps all along the Ashen Road. Fire bolts. Captain Osric's put up bounties, so it must be bad.", 'Camps on the Ashen Road. Osric put up bounties.'] },
          { t: ['Can I have the soup first too?', 'Soup first for me too?'], say: ['You can have the soup first. Sit by the fire. By it, Ash.', 'Yes. Sit by the fire. By it.'] },
        ] },
      { if: 'quest bun done !flag act1_done',
        say: ['Bertram came to visit, with a bun. We cried. Then the bun went off, a little. Then we laughed.', 'Bertram came with a bun. We cried. Then we laughed.'],
        re: [
          { t: ['It went off? Again?', 'It went off again?'], say: ["Only a small pop. Grandma's recipe likes a bit of drama.", 'A small pop. Grandma\'s recipe likes drama.'] },
          { t: ['So you two are talking?', 'So you are talking?'], say: ['Shouting, mostly. It is how Crumbs talk. It is good to have him to shout at.', 'Shouting. It is how we talk. It is good.'] },
        ] },
      // her old chat, as a moment (the Mirefen is on Ash's road by now)
      { if: 'stage>=three !flag act1_done',
        say: ['Granny Moss says the Mirefen needs an inn. Do you think I should open one out there?', 'Should I open an inn in the Mirefen?'],
        re: [
          { t: ['You could make any swamp cosy.', 'You could make it cosy.'], tone: 'kind', f: 1,
            say: ["You're sweet. I'd call it the Soggy Salmon. Bertram would make the buns, if they float.", 'You are sweet. The Soggy Salmon!'] },
          { t: ['Only if the frogs pay.', 'Only if the frogs pay.'], say: ['Frogs never pay. They just sit on the beds and look at you.', 'Frogs never pay. They just sit there.'] },
        ] },
      { if: 'stage=done',
        say: ["Lantern Night in Emberhollow, and I'm going. Two days ago I'd have said never. Bertram says bring nutmeg. I'm bringing extra.", 'I am going to Lantern Night. With extra nutmeg.'],
        re: [
          { t: ['He will love that.', 'He will love that.'], say: ['He will pretend to hate it. That is how I will know.', 'He will pretend to hate it.'] },
          { t: ['Who will look after the inn?', 'Who runs the inn?'], say: ['Nib. Nib has promised not to sell anything. We shall see.', 'Nib. He promised not to sell anything.'] },
        ] },
      { ask: ['Does Nib live here?', 'Does Nib live here?'],
        say: ['Nib is a guest. A small guest who does not pay, and helps with the dishes. Mostly with what is on them.', 'Nib is a guest. He helps with dishes. Mostly eating.'] },
      { ask: ['Why is it called the Sleepy Salmon?', 'Why the Sleepy Salmon?'],
        say: ['I once saw a salmon fall asleep in the river, just floating there. Then a bear ate it. I kept the name anyway.', 'A salmon fell asleep in the river. A bear ate it.'] },
      { ask: ['Who lives upstairs?', 'Who lives upstairs?'],
        say: ['Professor Quill, more or less. She lives closer to the stars than to my kitchen. She comes down for soup and complaints.', 'Professor Quill. She comes down for soup.'] },
      { idle: [["Soup's on, if you want it.", 'Soup is on.'], ['Mind the stairs. The third one squeaks.', 'The third stair squeaks.']] },
      { bye: [['Come back when you are hungry. So, tonight.', 'Come back hungry!']] },
    ],

    // ---------------------------------------------------------------- Captain Osric Pettibone, the Brindlecross Watch
    // Plain, honest, tired, modest: "I just stand in front of things." Nana's son. The Watch is him and two old dogs.
    // Morrow (choice morrow=jail) and Fennick (choice fennick=jail) end up in his cells.
    osric: [
      { if: 'said nana_osric_write !flag act1_done', once: true,
        say: ["Mum says you told her you'd make me write. I've written. Two pages. One of them is about the dogs.", 'Mum says you told her to make me write. I wrote!'] },
      { if: '!quest bounty started', once: true,
        say: ["Ash, isn't it? Maren's boy. Mum writes about you in every letter. More than she writes about me, I think.", 'Ash! My mum writes about you a lot.'],
        re: [
          { t: ['She says you never write back.', 'She says you never write.'], then: ['said osric_never_writes'],
            say: ['I write. The letters get lost. Somewhere between here and my desk.', 'I write! They get lost. On my desk.'] },
          { t: ['She is knitting you another sweater.', 'She is knitting you a sweater.'], say: ['Please tell me it is not the blue one. It is the blue one, isn\'t it.', 'Not the blue one. It is the blue one.'] },
        ] },
      { if: 'stage>=wren stage<three',
        say: ['The Scaled Oath has camps all along the Ashen Road. The board inside has bounties. Clear them out and I will pay.', 'The Oath has camps on the road. Clear them and I pay.'],
        re: [
          { t: ["Why don't you clear them yourself?", 'Why not clear them yourself?'], say: ['Me and two dogs? One of them is asleep right now. I am saving him for something important.', 'Me and two dogs? One is asleep.'] },
          { t: ['What does the Watch pay?', 'What does it pay?'], say: ['Fifty coins for three camps. It is all the Watch has. The dogs have agreed to go without biscuits.', 'Fifty coins. The dogs gave up their biscuits.'] },
        ] },
      { if: 'stage>=three choice morrow=jail !flag act1_done',
        say: ["Morrow's in the cell. He's sorted it alphabetically. I didn't know you could do that to a cell.", 'Morrow is in the cell. He sorted it by letter.'],
        re: [
          { t: ['Is he any trouble?', 'Is he any trouble?'], say: ['He asks for books and says thank you. I have had worse neighbours.', 'He asks for books. He says thank you.'] },
          { t: ['Should I have let him go?', 'Should I have let him go?'], say: ['You did what the Watch would do. That is not always the same as right. It is not wrong.', 'You did what the Watch would do. Not wrong.'] },
        ] },
      { if: 'stage>=three choice morrow=free !flag act1_done',
        say: ["You let Morrow go, they tell me. I'd have locked him up. That's probably why I'm the Watch and not the hero.", 'You let Morrow go. I would have locked him up.'],
        re: [
          { t: ["He said he's finished with dragons.", 'He is done with dragons.'], say: ['Then I will watch him grow pumpkins, and be glad to.', 'Then I will watch him grow pumpkins.'] },
          { t: ['Do you think he meant it?', 'Did he mean it?'], say: ['I think a frightened old man means most things for a while. Let us hope it is a long while.', 'For a while. Let us hope a long while.'] },
        ] },
      { if: 'choice fennick=jail !flag act1_done',
        say: ["Fennick polishes my lamps now. Every one. I haven't had the heart to tell him the Watch only owns two.", 'Fennick polishes my lamps. We only have two.'],
        re: [
          { t: ['Is he all right in there?', 'Is he all right?'], tone: 'kind', f: 0.5, say: ['He is sorry, and he is busy. That is about as all right as a man can be in a cell.', 'He is sorry and busy. That is all right.'] },
          { t: ['Give him more lamps.', 'Give him more lamps.'], say: ['I have borrowed six from Tilly. Do not tell her.', 'I borrowed six from Tilly. Shh.'] },
        ] },
      // his old chat, as a moment: after Morrow, when he has had a week of not knowing what he is doing
      { if: 'stage>=three !flag act1_done',
        say: ['Can I ask you something, Ash? Do you think I am a good captain?', 'Do you think I am a good captain?'],
        re: [
          { t: ['You stayed when the Oath came.', 'You stayed when the Oath came.'], tone: 'brave', f: 1,
            say: ['I did, didn\'t I. I stood at the door with a lamp and a dog. Thank you, Ash.', 'I did. With a lamp and a dog. Thank you.'] },
          { t: ['The dogs think so.', 'The dogs think so.'], f: 0.5, say: ['The dogs think anybody with a biscuit is a good captain. But I will take it.', 'Dogs like anyone with biscuits. I will take it.'] },
        ] },
      { if: 'stage=done',
        say: ["Lantern Night. Mum's asked me home for it, and I'm going. I've told the dogs. They're taking it well.", 'I am going home for Lantern Night.'],
        re: [
          { t: ["She'll knit you something on the spot.", 'She will knit you something.'], say: ['She will. She will measure me at the door. I have stopped fighting it.', 'She will measure me at the door.'] },
          { t: ['Bring the dogs.', 'Bring the dogs.'], if: '!choice fennick=jail', say: ['They would eat the buns. Bertram would never forgive me.', 'They would eat all the buns.'] },
          { t: ['Who will watch the cells?', 'Who watches the cells?'], if: 'choice fennick=jail', say: ['Fennick will. He asked. I said yes. I think that is what trust looks like.', 'Fennick asked to. I said yes.'] },
        ] },
      { ask: ['How many sweaters has Nana made you?', 'How many sweaters?'],
        say: ['Eleven. I wear them all at once in winter. I am very warm and I cannot bend my arms.', 'Eleven. I wear them all in winter.'] },
      { ask: ['What are your dogs called?', 'What are your dogs called?'],
        say: ['Pepper and Old Tom. Old Tom was the captain before me. Do not laugh. He was very good at it.', 'Pepper and Old Tom. Old Tom was captain first.'] },
      { idle: [['The Watch is listening. All of it. That is me.', 'The Watch is listening.'], ['Something to report?', 'Something to report?']] },
      { bye: [['Stay out of trouble. Or at least come and tell me about it.', 'Stay out of trouble.']] },
    ],

    // ---------------------------------------------------------------- Pell the Peddler, the wagon on the market square
    // A patter merchant: cheerful, quick, always selling. Was a pirate once, on a very small lake.
    pell: [
      { if: '!quest thief started', once: true,
        say: ["Emberhollow's own fire-breather! You singed one of my hats two summers back. Never mind. Have a look round.", 'You burned my hat once! Never mind. Look around.'],
        re: [
          { t: ['Sorry about your hat.', 'Sorry about your hat.'], say: ["Don't be. I sold it as smoked. Twice the price.", 'I sold it as smoked. Twice the price!'] },
          { t: ["What's the most expensive thing here?", 'What costs the most?'], say: ['This bottle. I do not know what is in it. That is what makes it expensive.', 'This bottle. I do not know what is in it.'] },
        ] },
      { if: 'stage>=wren stage<three',
        say: ['Business is terrible. Nobody buys hats with a cult on the road. They buy potions. I have potions.', 'Nobody buys hats now. They buy potions.'],
        re: [
          { t: ['What kind of potions?', 'What kind of potions?'], say: ['Red ones heal. The green one is for an itch. Do not mix them up. One fellow did.', 'Red heals. Green is for itches. Do not mix them up.'] },
          { t: ["I'll buy a hat anyway.", "I'll buy a hat anyway."], say: ['A hero who buys hats in a crisis. You will go far, Ash.', 'A hat in a crisis! You will go far.'] },
        ] },
      { if: 'quest thief done !flag act1_done',
        say: ['My purse came back with tooth marks in it. I am keeping them. It is a story now, and stories sell.', 'My purse has tooth marks. It is a story now.'],
        re: [
          { t: ['Will you sell the purse?', 'Will you sell the purse?'], say: ['Never. I will sell the story about the purse. Much better margins.', 'No. I will sell the story.'] },
          { t: ['Keep it somewhere safer.', 'Keep it safer.'], say: ['I sew it into my coat now. Kobolds cannot pick a coat. Not without thumbs.', 'It is sewn in my coat now.'] },
        ] },
      // his old chat, as a moment
      { if: 'stage>=oath !flag act1_done',
        say: ['I have a magic bean here, Ash. Trade you for that sword?', 'A magic bean for your sword?'],
        re: [
          { t: ['No. It was my grandmother\'s.', 'No. It was Grandma\'s.'], tone: 'brave', f: 1,
            say: ['Then keep it, and good for you. A bean is no use against a cult anyway. I was testing you.', 'Good. A bean is no use in a fight.'] },
          { t: ['What does the bean do?', 'What does the bean do?'], say: ['It is a bean, Ash. It does what beans do. Nothing for a long time, then all at once.', 'Nothing for a long time. Then all at once.'] },
          { t: ['Only if the bean can dance.', 'Only if it dances.'], tone: 'silly', f: 0.5, say: ['It can! Watch. ...It is a normal bean. Forget I said anything.', 'It can! Watch. ...It is a normal bean.'] },
        ] },
      { ask: ['Were you really a pirate?', 'Were you a pirate?'],
        say: ['On a lake. A very small lake, and a very small boat. I retired when the ducks got organised.', 'On a small lake. The ducks made me stop.'] },
      { ask: ['What does Hob pay you with?', 'How does Hob pay you?'],
        say: ['Soup. I have a cellar full of soup. Would you like some soup? It is very smoky soup.', 'Soup. I have a cellar full of soup.'] },
      { idle: [['Browsing? Browsing is free. Mostly.', 'Browsing is free.'], ['Everything on the wagon is wonderful. Some of it is safe.', 'Everything is wonderful.']] },
      { bye: [['Come again! Bring coins. Or soup.', 'Come again! Bring coins.']] },
    ],

    // ---------------------------------------------------------------- Dell Fisk, fisherman on the Brindlecross dock
    // Easy-going and fond of fish; Wendel's cousin, Minnow's dad. Something in the Mirefen ate his boat, the Soggy
    // Biscuit (his quests dell, lure, lakeking).
    dell: [
      { if: '!quest dell started', once: true,
        say: ["Maren's lad! Your mom made my best fish hooks. Three of them are still in the lake somewhere.", "Maren's boy! Your mom made my best hooks."],
        re: [
          { t: ['Want me to dive for them?', 'Want me to dive for them?'], say: ['In that water? It is cold enough to make a fish complain.', 'It is too cold. Even fish complain.'] },
          { t: ['Do the fish like them?', 'Do the fish like them?'], say: ['Love them. They take the hook and keep it. Wendel says that is rude. I say generous.', 'They keep them! Wendel says rude. I say generous.'] },
        ] },
      { if: 'stage>=wren !quest lure done !flag act1_done', ref: 'soggy_biscuit',
        say: ['Something in the Mirefen ate my boat, the Soggy Biscuit. I heard it burp.', 'Something in the swamp ate my boat. It burped.'],
        re: [
          { t: ['What burps that loud?', 'What burps that loud?'], say: ['Something with a tongue, and no manners at all.', 'Something with a tongue. And no manners.'] },
          { t: ["I'll look for her out there.", "I'll look for her."], tone: 'kind', f: 0.5, say: ['If you find her, she is blue and sad. The boat, I mean. And so am I.', 'She is blue. The boat. And so am I.'] },
        ] },
      { if: 'quest lure done !flag act1_done',
        say: ["Sal finished my new boat. The Soggy Biscuit Two. Six years, and she floats. I've been sitting in her all morning.", 'My new boat floats! I sat in her all morning.'],
        re: [
          { t: ['Have you caught anything?', 'Caught anything?'], say: ['Not one fish. Best morning of my life.', 'Not one fish. Best morning ever.'] },
          { t: ['Is the ring still on?', 'Is your ring on?'], say: ['On my finger, where it should have been all along. My wife says thank you, by the way.', 'On my finger. My wife says thank you.'] },
        ] },
      // his old chat, as a moment: a quiet evening on the dock
      { if: 'stage>=three !flag act1_done',
        say: ['You ever wonder what fish dream about, Ash? I wonder it every night out here.', 'What do you think fish dream about?'],
        re: [
          { t: ['Warm water, and no hooks.', 'Warm water. No hooks.'], tone: 'kind', f: 1, say: ["That's a bit sad, put like that. I'll be gentler with them.", 'That is sad. I will be gentle with them.'] },
          { t: ["Wendel's sandwiches.", "Wendel's sandwiches."], tone: 'silly', f: 0.5, then: ['said dell_sandwich'],
            say: ["Ha! That's why they bite. I'm telling him.", 'Ha! I am telling him.'] },
        ] },
      { ask: ['How is Minnow?', 'How is Minnow?'],
        say: ['She skips stones better than me, and she tells everyone. She is right to.', 'She skips stones better than me.'] },
      { ask: ["Is Old Sal's boat nearly done?", "Is Sal's boat done?"], if: '!quest lure done',
        say: ['Six years she has been at it. She says next spring. She has said next spring six times.', 'She says next spring. Every year.'] },
      { ask: ['Is the old turtle real?', 'Is the turtle real?'], ref: 'mirrow_grotto',
        say: ['There is a turtle in Mirrow Grotto older than the lake. Old Sal says it talks. Sal also says my boat is nearly finished.', 'Sal says a turtle in the grotto talks.'] },
      { idle: [["Fish aren't biting. Go on, then.", 'Go on, then.'], ['Plenty of time on a dock. Ask away.', 'Ask away.']] },
      { bye: [['Tight lines, Ash.', 'Tight lines!']] },
    ],

    // ---------------------------------------------------------------- Marigold Vane, Vane's Fine Hats
    // Stylish, quick, sure of herself, warm underneath. Hob's twin; Nana taught her to knit; a bird called Gerald lives
    // in her hat.
    marigold: [
      { if: 'true', once: true,
        say: ["Maren's boy! Stand still. Hm. Your head's gone up a whole hat size since spring. It's the horns.", "Maren's boy! Your head grew a hat size!"],
        re: [
          { t: ['Can you make hats with horn holes?', 'Hats with horn holes?'], say: ['Can I? I have been waiting years for somebody to ask.', 'I have waited years for someone to ask!'] },
          { t: ['Is that bad for a hat?', 'Is that bad?'], say: ['For a hat maker? It is wonderful. Sit down. I need my tape.', 'It is wonderful. Sit. I need my tape.'] },
        ] },
      { if: 'stage>=wren stage<three',
        say: ['Every traveller this week wants a hood. Hoods! Because of the Oath. Nobody wants to look nice for a cult.', 'Everyone wants hoods now. Because of the Oath.'],
        re: [
          { t: ["I'd want a helmet.", "I'd want a helmet."], say: ['I could put a feather on a helmet. Do not tempt me.', 'A helmet with a feather. Do not tempt me.'] },
          { t: ['Could you make one fireproof?', 'Could you make one fireproof?'], say: ['I made Juniper Ashby a fireproof map case. A hat is only a case for a head.', 'I made Juniper a fireproof map case. Yes.'] },
        ] },
      { if: 'stage>=three !flag act1_done',
        say: ["Hob has lost another scarf. That's nine. I've started on ten, out of spite.", 'Hob lost another scarf. I am making ten.'],
        re: [
          { t: ['Maybe the wind takes them.', 'Maybe the wind takes them.'], then: ['said marigold_scarves'],
            say: ['The wind is Hob. He gives them to anybody who looks cold. He thinks I do not know.', 'Hob gives them away. He thinks I do not know.'] },
          { t: ["I could take him the next one.", "I'll take him the next one."], say: ['Would you? Tell him it is the last one. It is not, but tell him.', 'Tell him it is the last one. It is not.'] },
        ] },
      // her old chat, as a moment
      { if: 'stage>=oath !flag act1_done',
        say: ['Be honest with me. Is this hat too much?', 'Be honest. Is this hat too much?'],
        re: [
          { t: ["It's a lot of hat. It suits you.", 'A lot of hat. It suits you.'], tone: 'brave', f: 1, say: ['A lot of hat! That is exactly right. Thank you.', 'A lot of hat! Exactly right.'] },
          { t: ["It's perfect. It's very you.", 'It is perfect.'], f: 0.75, say: ['Good. Because I made four more.', 'Good. I made four more.'] },
          { t: ['I think a bird lives in it.', 'A bird lives in it.'], tone: 'silly', f: 0.75, say: ['A bird does live in it. His name is Gerald.', 'A bird does. His name is Gerald.'] },
        ] },
      { ask: ['Who taught you to knit?', 'Who taught you to knit?'],
        say: ['Nana Pettibone. She also taught me that every gift needs a pocket. I put pockets in hats now.', 'Nana Pettibone. Every gift needs a pocket.'] },
      { ask: ['Why did you start making hats?', 'Why hats?'],
        say: ['I was a very small girl, and a hat made me taller. Now I make everybody a little taller.', 'I was small. Hats made me taller.'] },
      { idle: [['Try anything on. Gently. Mind the horns.', 'Try anything on.'], ['Hm? I am measuring you with my eyes.', 'I am measuring you.']] },
      { bye: [['Off you go. Hold your head up. It is a good head.', 'Hold your head up.']] },
    ],

    // ---------------------------------------------------------------- Professor Quill, the Observatory
    // A star scholar: excitable, a bit lost on the ground, precise about the sky. Writes to Gorran about rocks and
    // argues with Wren about the Wardens.
    quill: [
      { if: 'true', once: true,
        say: ["The Emberblood boy. I'd know you through a telescope, and I have. You light up the whole green on Lantern Day.", 'The Emberblood boy! I saw you through my telescope.'],
        re: [
          { t: ['You watch us through a telescope?', 'You watch us?'], say: ['Only on Lantern Day. The rest of the year I watch things that are further away.', 'Only on Lantern Day. Usually stars.'] },
          { t: ['Could you see the three lanterns?', 'Could you see the lanterns?'], if: 'stage>=raid', say: ['All three. The middle one wobbled. I wrote it down.', 'All three. The middle one wobbled.'] },
          { t: ['Can you see the mountain from here?', 'Can you see the mountain?'], say: ['Every night. That is the trouble. It has started looking back.', 'Every night. It has started looking back.'] },
        ] },
      { if: 'stage<three', ref: 'cinder_mountain',
        say: ['The smoke over Cinder Mountain is thicker every night. I measure it. My measurements are very worried.', 'The mountain smoke is thicker every night.'],
        re: [
          { t: ['What does that mean?', 'What does that mean?'], say: ['It means he is waking up, and I would very much like to be wrong.', 'He is waking up. I hope I am wrong.'] },
          { t: ['Can I look through the telescope?', 'Can I look through it?'], say: ['Come back at night. The stairs are behind me. Mind the bucket. There is always a bucket.', 'Come back at night. Mind the bucket.'] },
        ] },
      // her old chat, as a moment: at night, under the stars
      { if: 'night stage>=wren !flag act1_done',
        say: ['Look up, Ash. Do you ever look up and feel very small?', 'Look up. Do you ever feel very small?'],
        re: [
          { t: ['Small, but not alone.', 'Small, but not alone.'], tone: 'kind', f: 1, say: ["Yes. That's it exactly. Small, but not alone. I may put that on my door.", 'Yes. That is it exactly.'] },
          { t: ['No. I feel like I could reach them.', 'No. I could reach them.'], f: 0.75, say: ['Then reach. Somebody in this valley ought to.', 'Then reach. Someone should.'] },
          { t: ['Like a crumb on a big blanket.', 'Like a crumb on a blanket.'], tone: 'silly', f: 0.75, say: ['A crumb on a blanket! I am writing that down.', 'A crumb! I am writing that down.'] },
        ] },
      { if: 'stage>=three !flag act1_done',
        say: ["Two of the stars that fell in this valley were star-iron. I've found the holes. Gorran found the iron. He's unbearable.", 'I found where stars fell. Gorran found the iron.'],
        re: [
          { t: ['What does star-iron do?', 'What does star-iron do?'], say: ['In a good forge, it makes a blade that remembers the sky. Ask your mother. She will go quiet and look at it.', 'It makes a great blade. Ask your mom.'] },
          { t: ['Where did the third one land?', 'Where did the third land?'], say: ['That is what I would like to know. Come back at night and help me look.', 'I do not know. Help me look one night.'] },
        ] },
      { if: 'stage=done',
        say: ["The mountain is quiet. For the first time in my life I can see the stars right over it. There's a whole sky up there I never knew.", 'The mountain is quiet. I can see the stars over it.'],
        re: [
          { t: ['Will you name one?', 'Will you name one?'], say: ['I already have. It is orange, and it will not stay still. I wonder who it is named for.', 'I did. It is orange. It will not stay still.'] },
          { t: ['What did you see the night I climbed?', 'What did you see that night?'], say: ['Three little lights going up, one at a time. I stopped measuring and just watched.', 'Three little lights. I just watched.'] },
        ] },
      { ask: ['What do you and Gorran write about?', 'What do you write to Gorran?'],
        say: ["He sends me rocks. I send him star charts. He says stars are just rocks with lights. He isn't wrong. Don't tell him.", 'Rocks and stars. He says stars are rocks with lights.'] },
      { ask: ['What did you want to be, as a girl?', 'What did you want to be?'],
        say: ['Somebody who goes to the stars. Nobody knew what I meant. I am still working on how.', 'Someone who goes to the stars. I am still working on it.'] },
      { idle: [['Mm? Sorry. I was counting something.', 'Sorry. I was counting.'], ['Ask. The stars will wait. They are good at it.', 'Ask. The stars can wait.']] },
      { bye: [['Clear skies, Ash.', 'Clear skies!']] },
    ],

    // ---------------------------------------------------------------- Mayor Brindle, the Mayor's House
    // Pompous, proud of his moustache and his ancestor, fond of ribbons; harmless. (He ate his own pie in his sleep:
    // his quest 'pie'.)
    mayor: [
      { if: '!quest pie started', once: true,
        say: ["Young Ash of Emberhollow! Maren's boy! Your mother mended our town bell, you know. Splendid woman. Splendid bell.", 'Ash of Emberhollow! Your mom fixed our bell!'],
        re: [
          { t: ['Does it ring well now?', 'Does it ring well?'], say: ['It rings at noon, and at every ribbon. There are a great many ribbons.', 'At noon, and at every ribbon. Many ribbons.'] },
          { t: ['What do you ring it for?', 'What is the bell for?'], say: ['Ceremonies. And fires. Mostly ceremonies. I like a ceremony.', 'Ceremonies. And fires. Mostly ceremonies.'] },
        ] },
      { if: 'stage>=wren stage<three', ref: 'east_bridge_sign',
        say: ['The ribbon on the new bridge must wait. One does not cut ribbons with a cult on the road. It is not the done thing.', 'The bridge ribbon must wait. There is a cult about.'],
        re: [
          { t: ['When will you cut it?', 'When will you cut it?'], say: ['When you have dealt with them. No pressure. A little pressure.', 'When you beat them. No pressure. A little.'] },
          { t: ['Can I cut it, with my sword?', 'Can I cut it with my sword?'], say: ['With a sword! Oh, that would make a splendid picture. I shall think about it.', 'With a sword! A splendid picture. Maybe.'] },
        ] },
      { if: 'quest pie done !flag act1_done',
        say: ['About the pie. We shall not speak of it. I have had a word with my nightcap.', 'About the pie. We will not speak of it.'],
        re: [
          { t: ['Was it a good pie, at least?', 'Was it a good pie?'], say: ['The best I have ever eaten. I am told. I do not remember a bite.', 'The best ever. I do not remember it.'] },
          { t: ["I won't tell a soul.", "I won't tell anyone."], tone: 'kind', f: 0.75, say: ['Splendid boy. Tilly knows, of course. Tilly knows everything.', 'Thank you. Tilly knows, of course.'] },
        ] },
      // his old chat, as a moment
      { if: 'stage>=oath !flag act1_done',
        say: ['Ash. Between the two of us. What do you think of the moustache?', 'Be honest. What do you think of my moustache?'],
        re: [
          { t: ['The finest in the valley.', 'The finest in the valley.'], tone: 'kind', f: 1, say: ['It is! It has won awards. I gave them to it, but they count.', 'It is! It won awards. I gave them.'] },
          { t: ["It's bigger than your face.", 'It is bigger than your face.'], f: 0.5, say: ['That is rather the point. Thank you for noticing.', 'That is the point. Thank you.'] },
          { t: ['Does it have a name?', 'Does it have a name?'], tone: 'silly', f: 0.75, say: ['Bartholomew. Bartholomew says good afternoon.', 'Bartholomew. He says good afternoon.'] },
        ] },
      { if: 'stage=done',
        say: ['The ribbon is cut, Ash! I waited for news of you and then I cut it at once. Two hundred and twelve planks. Elder Yara checked.', 'The bridge is open! Yara counted the planks.'],
        re: [
          { t: ['Did Yara bring her own scissors?', 'Did Yara bring scissors?'], say: ['She did. I had forgotten mine. I always forget mine.', 'She did. I forgot mine. Again.'] },
          { t: ['Is there going to be a ceremony?', 'Will there be a ceremony?'], say: ['There was. There will be another, for you. With more ribbon.', 'Yes. Another one for you. More ribbon.'] },
        ] },
      { ask: ['Who was Brindle?', 'Who was Brindle?'],
        say: ['My ancestor. He founded the town, named it after himself, and had his portrait painted eleven times. A man of vision.', 'My ancestor. He named the town after himself.'] },
      { ask: ['Is it true you like Bertram\'s buns?', 'Do you like Bertram\'s buns?'],
        say: ['They are essential to the running of this town. I eat them for the town. It is a sacrifice.', 'I eat them for the town. A sacrifice.'] },
      { idle: [['The Mayor is listening. Officially.', 'The Mayor is listening.'], ['Yes, yes? Speak up. Civic business.', 'Yes? Speak up.']] },
      { bye: [['Good day, young Ash. Do give your mother my regards.', 'Good day, Ash.']] },
    ],

    // ---------------------------------------------------------------- Nib, a kid who sells "treasure maps" (mostly of his cat)
    // Cheeky, quick, sleeps at Tilly's inn; Rook's friend by letter. Hide and seek is his quest ('seek').
    nib: [
      { if: '!quest seek started', once: true,
        say: ["You're the dragon kid! Rook told me all about you. Can you really breathe fire? Do it on that barrel.", "You're the dragon kid! Breathe fire on that barrel!"],
        re: [
          { t: ['Not on the barrel. Someone owns it.', 'Somebody owns that barrel.'], say: ['I own it. It is the only thing I own. Please do not burn it.', 'I own it. It is all I own.'] },
          { t: ['Only a little puff, then.', 'Just a little puff.'], say: ['That was the best puff I ever saw. Do it again. No, wait, charge money.', 'Best puff ever! Do it again!'] },
        ] },
      // his old chat, as a moment (it is how he greets everybody)
      { if: 'stage>=wren !flag act1_done',
        say: ['Want to buy a map? One coin. It is a real treasure map. Mostly. It is of my cat.', 'Buy a map? One coin. It is of my cat.'],
        re: [
          { t: ["I'd like a map of your cat.", "I'd like a cat map."], tone: 'kind', f: 1, say: ['You would? Here, it is free. His name is Biscuit. He is the X.', 'Free for you! His name is Biscuit.'] },
          { t: ['Where is the treasure on it?', 'Where is the treasure?'], say: ['Under the cat. You have to move the cat. Nobody has ever moved the cat.', 'Under the cat. Nobody moves the cat.'] },
          { t: ['Does the cat have a map of you?', 'Has the cat mapped you?'], tone: 'silly', f: 0.75, say: ['I never thought of that. Biscuit is up to something.', 'I never thought of that.'] },
        ] },
      { if: 'quest seek done !flag act1_done',
        say: ['You found Jem in the barrel. Nobody ever finds Jem. Jem is still cross about it.', 'You found Jem! Nobody finds Jem.'],
        re: [
          { t: ['Jem giggles like a goose.', 'Jem giggles like a goose.'], say: ['I told you! I always tell people, and nobody listens.', 'I told you! Nobody listens.'] },
          { t: ['Want to play again?', 'Play again?'], say: ['Tomorrow. Jem needs a new barrel.', 'Tomorrow. Jem needs a new barrel.'] },
        ] },
      { if: 'stage=done',
        say: ["Tilly says I'm in charge of the inn on Lantern Night. I've made a sign. It says NO.", 'I run the inn tonight. My sign says NO.'],
        re: [
          { t: ['No to what?', 'No to what?'], say: ['Everything. It saves time.', 'Everything. It is quicker.'] },
          { t: ['Tilly trusts you a lot.', 'Tilly trusts you.'], tone: 'kind', f: 0.5, say: ['She does. Do not tell anybody. She pretends she is grumpy.', 'She does. She pretends to be grumpy.'] },
        ] },
      { ask: ['Where do you sleep, Nib?', 'Where do you sleep?'],
        say: ['At the inn, when Tilly lets me. She always lets me. Do not tell anybody. She pretends she is grumpy.', 'At the inn. Tilly always lets me.'] },
      { ask: ['How do you know Rook?', 'How do you know Rook?'],
        say: ['We write. His sister makes real maps. I make cat maps. Mine have more cats.', 'We write. I make cat maps. More cats.'] },
      { idle: [['Maps? Cats? Cat maps?', 'Maps? Cats?'], ['I am very busy. Go on.', 'I am busy. Go on.']] },
      { bye: [['Bye! Do not tell Biscuit I sold him.', 'Bye! Do not tell Biscuit.']] },
    ],
  },
})

// ================= the rest of the valley (J9): Coppergulch, Hollis Farm and Frostpine Lodge, the Smoky Kettle on the
// Ashen Road, and the Mirefen. Same shape as Brindlecross: they know Maren and have heard of her boy. Each town's part of
// the act is its Ward: Coppergulch the Crag (the Brood Mother, event boss_done:broodmother), the Frostpine the Frost
// Ward (Greymane, choice greymane ally or home), the Kettle the Oath on the Ashen Road (stage oath), the Mirefen the
// Sunken Ward (Gloamjaw).
people({
  id: 'a1_talk_roads', act: 1,
  talk: {
    // ---------------------------------------------------------------- Gorran Flint, old foreman of Coppergulch Mine
    // Gruff, short sentences, talks about rocks as if they were people. Taught Maren to read ore; lost an eye to a rock
    // and kept the rock. The drakelings took his mine when the Brood Mother began nesting (his quest 'mine').
    gorran: [
      { if: '!quest mine started', once: true,
        say: ["Well, I'll be. Maren's kid. You've got her jaw. Last time I saw you, you were chewing on my boot.", "Maren's kid! You used to chew my boot."],
        re: [
          { t: ['Sorry about your boot.', 'Sorry about your boot.'], say: ['Best boot I ever had. You left a tooth in it. I kept the tooth.', 'Best boot I had. I kept your tooth.'] },
          { t: ['Mom says you taught her about ore.', 'You taught Mom about ore?'], say: ['Taught her to read it. She taught me to keep my beard out of the forge. Fair trade.', 'I taught her ore. She taught me about beards.'] },
        ] },
      { if: '!event boss_done:broodmother !flag act1_done', ref: 'crag_ward',
        say: ["Drakelings took the mine when the Brood Mother started nesting up on the Crag. Can't dig with lizards in your hair.", 'Drakelings took my mine. Their mother nests on the Crag.'],
        re: [
          { t: ['Where on the Crag is she?', 'Where is she?'], say: [['gorran', "Right at the top, east of here, by the old Ward. You'll smell her before you see her. Like a kettle left on.", 'At the top of the Crag. She smells like a hot kettle.', { ref: 'crag_ward' }]] },
          { t: ['Could I clear them out?', 'Could I clear them out?'], tone: 'brave', f: 0.5, say: ["You could try. You've your mother's chin, and she never backed off a rock in her life.", "You could. You have your mom's chin."] },
        ] },
      { if: 'event boss_done:broodmother !quest mine done !flag act1_done',
        say: ['The drakelings have gone quiet since the Brood Mother fell. Quiet as rocks. I like rocks.', 'The drakelings went quiet. Like rocks. I like rocks.'],
        re: [
          { t: ['Is the mine safe now?', 'Is the mine safe now?'], say: ['Safer. Not safe. No mine is safe. That is why I love them.', 'Safer. No mine is safe. I love them anyway.'] },
          { t: ['Did you hear her, at the end?', 'Did you hear her?'], say: [['gorran', 'Heard something. Up here we all stopped digging and looked east. Nobody said a word.', 'We all stopped and looked east.', { ref: 'crag_ward' }]] },
        ] },
      { if: 'quest mine done !flag act1_done',
        say: ["Picks are ringing again. Tell your mom the ore's coming in spring. Like always.", 'The picks ring again. Ore comes in spring.'],
        re: [
          { t: ["I'll tell her. She'll be glad.", "I'll tell her."], say: ['She will pretend not to be. Then she will sing at the anvil. I have heard her.', 'She will sing at the anvil.'] },
          { t: ['Did you find any more star-iron?', 'Any more star-iron?'], say: ['A thumb of it. I am saving it for something that deserves it. You, maybe. In ten years.', 'A little. I am saving it. Maybe for you.'] },
        ] },
      // a moment (his old chat was "Think the mine will ever be safe again?"; now the one thing an old friend asks)
      { if: 'stage>=wren !flag act1_done',
        say: ['How is your mother? Really, I mean. She never says, in her letters. Just "fine" and a drawing of a horseshoe.', 'How is your mom? Really? She just writes "fine".'],
        re: [
          { t: ['She hammers more when she worries.', 'She hammers more when worried.'], tone: 'kind', f: 1, then: ['said gorran_asked_mom'],
            say: ['Then she is hammering a lot this month. Tell her old Gorran asked. Tell her to put the hammer down and sit.', 'Tell her Gorran asked. Tell her to sit down.'] },
          { t: ['She says you never visit.', 'She says you never visit.'], f: 0.5, then: ['said gorran_asked_mom'],
            say: ['I never visit? She never visits! Tell her that. No. Do not tell her that.', 'She never visits! Do not tell her I said that.'] },
        ] },
      { if: 'stage=done',
        say: ["I'm coming down for Lantern Night. First time in twenty years. I've a lump of star-iron for the bonfire. It won't burn. It'll just sit there looking pleased.", 'I am coming to Lantern Night. With star-iron.'],
        re: [
          { t: ['Mom will be so glad.', 'Mom will be glad.'], say: ['She will tell me I look old. I will tell her she looks older. Then we will both be happy.', 'She will say I look old. Then we will both be happy.'] },
          { t: ['Will the rocks miss you?', 'Will the rocks miss you?'], tone: 'silly', say: ['They will manage one night. They have managed a million years.', 'They will manage one night.'] },
        ] },
      { ask: ['How did you lose your eye?', 'How did you lose your eye?'],
        say: ['A falling rock, forty years back. I kept the rock. It is on my mantel. We have made our peace.', 'A rock fell. I kept it. We are friends now.'] },
      { ask: ['Do you know Professor Quill?', 'Do you know Quill?'],
        say: ['Quill writes to me about stars. Stars are rocks that think they are special. Like Quill. Do not tell her I said so.', 'She writes about stars. Stars are rocks that show off.'] },
      { idle: [['Hm. What is it?', 'What is it?'], ["Out with it. I've rocks to listen to.", 'Out with it.']] },
      { bye: [['Mind your head in the tunnels.', 'Mind your head.']] },
    ],

    // ---------------------------------------------------------------- Cookie, the Cook Shack at Coppergulch
    // Brash and generous; feeds the miners Rock Soup (with rocks in it) from her gran's long-winter recipe.
    cookie: [
      { if: 'true', once: true,
        say: ["So you're Maren's boy. Gorran talks about your mom like she hung the moon. Sit down. You look like you need soup.", "Maren's boy! Sit down. Have some soup."],
        re: [
          { t: ['Is it the soup with rocks in?', 'Is it the rock soup?'], say: ['It is the only soup I make. The rocks are for flavour.', 'It is my only soup. The rocks add flavour.'] },
          { t: ["I'm not really that hungry.", "I'm not that hungry."], say: ['Everybody is that hungry. Sit.', 'Everyone is that hungry. Sit.'] },
        ] },
      { if: '!quest mine done !flag act1_done',
        say: ["The lads can't work with drakelings in the tunnels, so they sit here and eat. I've never been busier.", 'Nobody can work. So they all eat here.'],
        re: [
          { t: ['Is that good or bad?', 'Is that good or bad?'], say: ['Good for the pot. Bad for my ladle arm.', 'Good for the pot. Bad for my arm.'] },
          { t: ["I'll get them back to work.", "I'll get them back to work."], tone: 'brave', f: 0.5, say: ['Then I will give you the bowl with the best rock in it.', 'Then you get the best rock.'] },
        ] },
      { if: 'quest mine done !flag act1_done',
        say: ["The lads are back in the tunnels. I've made a celebration soup. Same as the other soup. Bigger rocks.", 'The miners are back! Celebration soup. Bigger rocks.'],
        re: [
          { t: ['How big are the rocks?', 'How big are the rocks?'], say: ['Fist-sized. You do not eat those ones. You admire them.', 'Fist-sized. You just admire those.'] },
          { t: ['Can Pip have a rock?', 'Can Pip have a rock?'], if: 'flag pip', say: ['Pip has had three. I do not know where he puts them.', 'He has had three already.'] },
        ] },
      // her old chat, as a moment: the first bowl
      { if: 'stage>=wren !flag act1_done',
        say: ['Here. Try the Rock Soup. And be honest with me.', 'Try the Rock Soup. Be honest.'],
        re: [
          { t: ["It's very filling.", 'It is very filling.'], tone: 'kind', f: 0.75, say: ['Filling! That is the word. You are a good boy.', 'Filling! That is the word.'] },
          { t: ['I think I chipped a tooth.', 'I chipped a tooth.'], f: 1, say: ['Everybody does! It is tradition. You are one of us now.', 'Everyone does. You are one of us now.'] },
          { t: ['I can taste where the rock has been.', 'I can taste the rock.'], tone: 'silly', f: 0.75, say: ['That one was a river pebble. It has been places.', 'That one was a river pebble.'] },
        ] },
      { ask: ['Where does Rock Soup come from?', 'Where is Rock Soup from?'],
        say: ['My gran made it in the long winter, when there was nothing else to put in the pot. She put a rock in so the pot did not look empty.', 'My gran made it in a hard winter. The rock filled the pot.'] },
      { ask: ['What does Tilly say about your soup?', 'What does Tilly say?'],
        say: ['That it is a crime. Tilly Crumb has never been hungry in a mine.', 'That it is a crime. She was never hungry in a mine.'] },
      { idle: [['More soup? There is always more soup.', 'More soup?'], ['Go on, I am stirring.', 'Go on, I am stirring.']] },
      { bye: [['Off you go. Take a rock for the road.', 'Take a rock for the road.']] },
    ],

    // ---------------------------------------------------------------- Pick and Shovel, twin miners (one person in the game)
    // They talk as "we", disagree about which of them is which, and have decided they are scared of the mine now.
    pick: [
      { if: 'true', once: true,
        say: ["Gorran said Maren's kid would come up the hill one day. We bet you'd be taller. We both lost.", "Maren's kid! We bet you would be taller."],
        re: [
          { t: ['Who won the bet, then?', 'Who won?'], say: ['Gorran. He said you would be exactly this tall. He is never wrong about rocks or people.', 'Gorran. He is never wrong.'] },
          { t: ["I'm still growing.", "I'm still growing."], say: ['That is what we said. Twenty years ago.', 'That is what we said, twenty years ago.'] },
        ] },
      { if: '!event boss_done:broodmother !flag act1_done',
        say: ["We'd go back in the mine, but we've decided we're scared now. We had a meeting about it.", 'We are scared of the mine now. We voted.'],
        re: [
          { t: ['What scares you most?', 'What scares you most?'], say: ['Drakelings. And the dark. Mostly the drakelings in the dark.', 'Drakelings. In the dark.'] },
          { t: ["It's all right to be scared.", 'It is all right to be scared.'], tone: 'kind', f: 0.75, say: ['That is what we said at the meeting. It passed, two votes to none.', 'We voted on that. Two to none.'] },
        ] },
      { if: 'event boss_done:broodmother !flag act1_done',
        say: ['The mine has gone quiet. We went in as far as the first lamp. Then we came out again. Tomorrow, the second lamp.', 'We went to the first lamp. Tomorrow, the second.'],
        re: [
          { t: ['One lamp at a time.', 'One lamp at a time.'], say: ['That is the plan. We wrote it down. On two pieces of paper.', 'That is the plan. We wrote it twice.'] },
          { t: ['I could walk in with you.', 'I could walk in with you.'], tone: 'kind', f: 0.5, say: ['Would you? Only to the second lamp. We have to do the third ourselves.', 'To the second lamp. The third is ours.'] },
        ] },
      // their old chat, as a moment
      { if: 'stage>=three !flag act1_done',
        say: ['Settle something for us. Which one of us is Pick?', 'Which one of us is Pick?'],
        re: [
          { t: ['You are. Definitely you.', 'You are.'], f: 0.75, say: ['Wrong! Or right. We do not know either. That is the problem.', 'Wrong! Or right. We do not know either.'] },
          { t: ['Does it matter which?', 'Does it matter?'], tone: 'kind', f: 1, say: ['Mum said it did not. Gorran says it does on payday.', 'Mum said no. Gorran says yes, on payday.'] },
          { t: ["I'm Pick. You're both Shovel.", "I'm Pick. You're both Shovel."], tone: 'silly', f: 1, say: ['That is possible, actually.', 'That might be true.'] },
        ] },
      { ask: ['Have you two ever been apart?', 'Have you ever been apart?'],
        say: ['Never. When one of us gets a cold, the other one sneezes.', 'Never. If one gets a cold, the other sneezes.'] },
      { ask: ["What's Gorran like to work for?", 'What is Gorran like?'],
        say: ['He talks to the rocks. We do not. They might answer.', 'He talks to rocks. We do not.'] },
      { idle: [['We are listening. Both of us.', 'We are listening.'], ['Go on. One of us is paying attention.', 'One of us is listening.']] },
      { bye: [['Bye, Ash. Bye, Ash.', 'Bye! Bye!']] },
    ],

    // ---------------------------------------------------------------- Farmer Hollis, Hollis Farm in the Frostpine
    // Proud goat man, gruff and fond; his brother Ulf at the Lodge prefers sheep and they never agree. Duchess the goat
    // runs his farm (his quests duchess, a1_hop).
    hollis: [
      { if: '!quest duchess started', once: true,
        say: ["You'll be Maren's boy, from down the valley. Your mom shod my mule. Best shoes he ever had.", "Maren's boy! Your mom shod my mule."],
        re: [
          { t: ['Does he still wear them?', 'Does he still wear them?'], say: ['Every day. He clicks when he walks. He is very proud of it.', 'Every day. He clicks. He is proud.'] },
          { t: ['Is that goat eating my bag?', 'Is a goat eating my bag?'], say: ['That is Duchess. She eats what she likes. Today she likes you.', 'That is Duchess. She likes you.'] },
        ] },
      { if: 'quest duchess active',
        say: ["Duchess has been gone two nights. She's done it before. She's never done it with wolves about.", 'Duchess is gone. And the wolves are out.'],
        re: [
          { t: ["I'll bring her home.", "I'll bring her home."], tone: 'kind', f: 0.75, say: ["Bring her back and I'll owe you my best cheese. Don't tell Hal I make cheese.", 'I will owe you cheese. Do not tell Hal.'] },
          { t: ['Goats are good at hiding.', 'Goats hide well.'], say: ['She is good at everything. That is the trouble with her.', 'She is good at everything. That is the trouble.'] },
        ] },
      { if: 'quest duchess done !flag act1_done',
        say: ["Duchess came home and ate my hat. That's how I know she's glad to be back.", 'Duchess ate my hat. She is glad to be home.'],
        re: [
          { t: ['Did she say thank you?', 'Did she say thank you?'], say: ['She said "meh". From her, that is a speech.', 'She said meh. That is a speech, for her.'] },
          { t: ['Does Ulf know she is home?', 'Does Ulf know?'], say: ['You tell him. He will take it better from you. He will not, but tell him.', 'You tell him. He will grumble.'] },
        ] },
      // his old chat, as a moment: the thing he asks everybody
      { if: 'stage>=wren !flag act1_done',
        say: ['Before you go any further. Goats or sheep? Choose carefully.', 'Goats or sheep? Choose carefully.'],
        re: [
          { t: ['Goats. Obviously goats.', 'Goats!'], tone: 'brave', f: 1, then: ['said hollis_goats'], say: ['Finally, somebody with sense! Tell my brother. Tell him slowly.', 'Finally! Go and tell my brother.'] },
          { t: ['Both are good in their own way.', 'Both are good.'], f: 0.25, say: ['That is what diplomats say. Hmph. Fine.', 'That is what diplomats say. Hmph.'] },
          { t: ['Dragons.', 'Dragons.'], tone: 'silly', f: 0.5, say: ['Dragons do not give milk, Ash.', 'Dragons do not give milk.'] },
        ] },
      { if: 'said ulf_sheep !said hollis_goats !flag act1_done', once: true,
        say: ['My brother tells me you said sheep. Sheep! I thought Maren raised you better.', 'Ulf says you picked sheep. Sheep!'],
        re: [
          { t: ['He asked me first.', 'He asked first.'], say: ['That is how he gets you. He asks first. He has done it to me for fifty years.', 'He always asks first. He has done it for fifty years.'] },
          { t: ['Sheep are nice too, Hollis.', 'Sheep are nice too.'], say: ['Nice. Nice! Duchess, cover your ears.', 'Nice! Duchess, cover your ears.'] },
        ] },
      { ask: ['How did Duchess get so bossy?', 'Why is Duchess so bossy?'],
        say: ['She was the runt. Nobody wanted her. I fed her from a bottle every night for a month. Now she runs the farm.', 'She was the runt. I fed her by bottle. Now she is boss.'] },
      { ask: ['Do you and Ulf ever agree?', 'Do you and Ulf agree?'],
        say: ['Once. About the weather. It was a bad day for both of us.', 'Once. About the weather.'] },
      { ask: ['Do you know Hal Burrows?', 'Do you know Hal?'],
        say: ['He writes to my brother about cheese. They have never asked me. I make goat cheese. It is better.', 'He writes to Ulf about cheese. Mine is better.'] },
      { idle: [['Well? Out with it. Goats are waiting.', 'Out with it.'], ['Mind where you stand. Duchess is behind you.', 'Duchess is behind you.']] },
      { bye: [["Off you go. Don't let Duchess follow you.", "Don't let Duchess follow you."]] },
    ],

    // ---------------------------------------------------------------- Ulf Hollis, hunter at Frostpine Lodge
    // Loud and big-hearted, because the mountains are big; prefers sheep; trades letters about cheese with Hal. Says
    // Greymane's pack has been wrong since the smoke came (the Frost Ward, Greymane).
    ulf: [
      { if: '!quest horn started', once: true,
        say: ['Ha! The dragon boy! Hal Burrows writes about you. In between the cheese.', 'The dragon boy! Hal writes about you.'],
        re: [
          { t: ['What does Hal say about me?', 'What does Hal say?'], say: ['One line a letter. "Hope the dragon boy is well." Then twelve pages on cheddar.', 'One line about you. Then twelve on cheese.'] },
          { t: ['Is his cheese really that good?', 'Is his cheese good?'], say: ['The best in the valley. Do not tell my brother I said something nice about anything.', 'The best. Do not tell my brother I said so.'] },
        ] },
      { if: '!event boss_done:greymane !flag act1_done',
        say: ["Greymane's pack has been strange since the smoke came. Orange eyes. Wrong.", 'The wolves have orange eyes now. Wrong.'],
        re: [
          { t: ['Wrong how?', 'Wrong how?'], say: ['Wolves do not hate. They hunt, and they leave. These ones stay, and they stare.', 'Wolves hunt and leave. These ones stare.'] },
          { t: ['Is Elka safe out there?', 'Is Elka safe?'], tone: 'kind', f: 0.5, say: ['She is not allowed past the trees. She hates me for it. Good.', 'She stays by the trees. She hates me for it.'] },
        ] },
      { if: 'event boss_done:greymane choice greymane=ally !flag act1_done',
        say: ["Greymane walks with you now? A wolf king, at a dragon boy's heel. I've seen everything. I'm going to sit down.", 'Greymane walks with you? I need to sit down.'],
        re: [
          { t: ["He's gentle, once you know him.", "He's gentle, really."], say: ['Gentle. A wolf the size of a pony. All right. I believe you. I will stand over here.', 'Gentle. All right. I will stand over here.'] },
          { t: ['His eyes are grey again.', 'His eyes are grey again.'], say: ['Grey. Good. That is a wolf. That is how it should be.', 'Grey. Good. That is how it should be.'] },
        ] },
      { if: 'event boss_done:greymane !flag act1_done',
        say: ['The pack howled on the ridge last night. The proper way, at the moon. I nearly howled back.', 'The wolves howled the right way last night.'],
        re: [
          { t: ['You should have howled back.', 'You should have howled.'], tone: 'silly', say: ['I did, a little. Elka will never let me forget it.', 'I did, a bit. Elka heard.'] },
          { t: ['Greymane went home to them.', 'Greymane went home.'], if: 'choice greymane=home', say: ['Home to his pack. That is where a wolf king should be. Thank you, Ash.', 'That is where he belongs. Thank you.'] },
          { t: ['Will they stay away from the lodge?', 'Will they stay away?'], say: ['They will keep to the high snow, like always. Wolves keep their word. Better than people.', 'They keep to the high snow, like always.'] },
        ] },
      // his old chat, as a moment (Hollis asks the same question the other way round; they compare notes)
      { if: 'stage>=wren !flag act1_done',
        say: ['Now. Think hard before you answer. Goats or sheep?', 'Think hard. Goats or sheep?'],
        re: [
          { t: ['Sheep. Clearly.', 'Sheep.'], tone: 'brave', f: 1, then: ['said ulf_sheep'], say: ['A wise dragon! Wait until my brother hears. I will write tonight.', 'Wise! Wait until my brother hears.'] },
          { t: ['I already told Hollis goats.', 'I told Hollis goats.'], if: 'said hollis_goats', say: ['Traitor. ...Fine. You can still have soup. Less soup.', 'Traitor! You still get soup. Less.'] },
          { t: ['I like all animals.', 'I like all animals.'], f: 0.25, say: ['Hmph. Diplomatic. Fine. You can stay.', 'Hmph. Fine. You can stay.'] },
        ] },
      { ask: ['Why do you talk so loud?', 'Why so loud?'],
        say: ['Because the mountains are big. Talk quietly up here and the snow takes your words away.', 'The mountains are big. Quiet words get lost.'] },
      { ask: ["What's wrong with goats?", 'What is wrong with goats?'],
        say: ['Goats eat your boots. Sheep never ate a boot in their lives. Their lives are boot-free.', 'Goats eat boots. Sheep never do.'] },
      { idle: [['Speak up! The snow is listening.', 'Speak up!'], ['Ha. What else?', 'What else?']] },
      { bye: [['Go well! Wear a scarf!', 'Wear a scarf!']] },
    ],

    // ---------------------------------------------------------------- Elka, sled racer at Frostpine Lodge (a kid)
    // Fast, loud, competitive; Rook's pen pal; wants to beat her mother's sledding records.
    elka: [
      { if: '!quest race started', once: true,
        say: ["You're Ash! Rook's Ash! He writes about you in every single letter. Is it true you can breathe fire?", 'You are Ash! Rook writes about you!'],
        re: [
          { t: ['A bit. Did you really race a wolf?', 'Did you race a wolf?'], say: ['And won. Dad made me promise never again. I promised with my fingers crossed.', 'And won! I promised to stop. Fingers crossed.'] },
          { t: ['What does Rook say about me?', 'What does Rook say?'], say: ['That you are brave, and that you snore. He spelled snore wrong.', 'You are brave and you snore.'] },
        ] },
      { if: '!event boss_done:greymane !flag act1_done',
        say: ["The wolves have orange eyes now. Ulf won't let me sled past the trees. It's so unfair.", 'Ulf will not let me sled past the trees. Unfair!'],
        re: [
          { t: ["He's right, you know.", 'He is right.'], say: ['I know he is right. That is why it is unfair.', 'I know. That is why it is unfair.'] },
          { t: ["I'll sort the wolves out.", "I'll sort the wolves out."], tone: 'brave', f: 0.5, say: ['Then hurry. The good snow will not last.', 'Then hurry. The good snow will melt.'] },
        ] },
      { if: 'quest race done !flag act1_done',
        say: ["You beat me. Nobody beats me. I've told Rook. I had to. I told him it was close.", 'You beat me. I told Rook it was close.'],
        re: [
          { t: ['It was close.', 'It was close.'], tone: 'kind', f: 0.75, say: ['It was not. But thank you. Rematch in spring.', 'It was not. Rematch in spring.'] },
          { t: ['You were faster downhill.', 'You were faster downhill.'], say: ['I am always faster downhill. Uphill is boring.', 'Always. Uphill is boring.'] },
        ] },
      // a moment: she asks about her pen pal (her old chat was the race, which is her quest now)
      { if: 'stage>=wren !flag act1_done',
        say: ['Is Rook really as brave as he says in his letters? Tell me the truth.', 'Is Rook as brave as he says? Tell the truth.'],
        re: [
          { t: ['He hides bravely. He told me.', 'He hides bravely.'], tone: 'silly', f: 0.75, say: ["Hiding bravely! That's so Rook. It's going in my next letter.", 'That is so Rook!'] },
          { t: ["He's braver than he thinks.", 'He is braver than he thinks.'], tone: 'kind', f: 1, then: ['said elka_rook_brave'],
            say: ["Don't tell him. He'll be unbearable. ...I'm telling him.", 'Do not tell him. ...I am telling him.'] },
        ] },
      { if: 'stage=done',
        say: ['The mountain stopped smoking and Ulf let me sled all the way to the trees. Then past them. He did not notice. He was looking at the mountain.', 'Ulf let me sled past the trees. He was busy looking at the mountain.'],
        re: [
          { t: ['Was the snow good?', 'Was the snow good?'], say: ['The best all year. I beat my mom\'s record. By one tree.', 'The best! I beat my mom\'s record.'] },
          { t: ['Tell Rook about it.', 'Tell Rook about it.'], say: ['I already wrote him four pages. He will read them to everyone.', 'I wrote him four pages already.'] },
        ] },
      { ask: ['Did your mom race sleds too?', 'Did your mom race?'],
        say: ['She was the fastest in the valley. I am going to be faster. Downhill, I already am.', 'She was the fastest. I will be faster.'] },
      { ask: ['What do you write to Rook about?', 'What do you write to Rook?'],
        say: ['Wolves, mostly. He asked if they eat letters. I told him only the long ones.', 'Wolves. He asked if they eat letters.'] },
      { idle: [['Hurry up, I have sledding to do.', 'Hurry up!'], ['What? Quick. Quicker.', 'Quick!']] },
      { bye: [['Bye! Tell Rook I said hi! Loudly!', 'Tell Rook hi!']] },
    ],

    // ---------------------------------------------------------------- Brisket, a retired adventurer (thawed by Ash)
    // He was frozen in a block of ice in the high snow until Ash breathed on it; now he lives at the Lodge and has
    // given up adventure for being warm.
    brisket: [
      { if: 'true', once: true,
        say: ["Thanks again for the thaw. I've decided to retire from adventuring and take up being warm.", 'Thanks for the thaw. I am retired now. I am warm.'],
        re: [
          { t: ['How long were you frozen?', 'How long were you frozen?'], say: ['Long enough that my boots went out of fashion. Ulf says forty years. Ulf exaggerates.', 'My boots went out of fashion. Ulf says forty years.'] },
          { t: ['What were you looking for up there?', 'What were you looking for?'], say: ['Treasure. I found ice. A great deal of ice.', 'Treasure. I found ice.'] },
        ] },
      { if: '!flag act1_done',
        say: ["I was frozen solid a long while. You'd think I'd come out wiser. I just know more about ice.", 'I was frozen a long time. I just know about ice now.'],
        re: [
          { t: ["What's the worst thing about ice?", 'What is worst about ice?'], say: ['The bit that gets inside your ears. It stays for weeks. I can still hear it.', 'It gets in your ears. For weeks.'] },
          { t: ['Do you miss the adventures?', 'Do you miss adventures?'], next: { say: ['Sometimes. Do you think I should go back to it?', 'Sometimes. Should I go back?'],
            re: [
              { t: ["You've earned your rest. Be warm.", 'You earned a rest.'], tone: 'kind', f: 1, say: ['Thank you. I needed somebody to say it out loud.', 'Thank you. I needed to hear that.'] },
              { t: ['Only inside a blanket.', 'Only in a blanket.'], tone: 'silly', f: 0.75, say: ['A blanket-fort adventurer. That is honestly my dream.', 'A blanket fort adventurer. My dream.'] },
            ] } },
        ] },
      { ask: ['What was Brisket the Bold like?', 'What was Brisket the Bold like?'],
        say: ['Loud. Hungry. Cold all the time. Now I am Brisket the Warm. It is a better title.', 'Loud and cold. Now I am Brisket the Warm.'] },
      { ask: ['Does Ulf ask you about sheep?', 'Does Ulf ask about sheep?'],
        say: ['Every morning. He wants to know if I am a sheep person. I am a warm person. That is all I want to be.', 'Every day. I am not a sheep person. I am warm.'] },
      { idle: [['Mm? Sit by the fire with me.', 'Sit by the fire.'], ['Still warm. Still here.', 'Still warm.']] },
      { bye: [['Go carefully. Wear two hats.', 'Wear two hats.']] },
    ],

    // ---------------------------------------------------------------- Hob Vane, the Smoky Kettle on the Ashen Road
    // A booming, jolly host; Marigold's twin and Fennick's cousin. Built the Kettle twice (the roof fell in). The Oath
    // stole his kettle (quest 'kettle'); the Open Gate quest asks him about Fennick's gold (a1_gate.js).
    hob: [
      { if: '!quest kettle started', once: true,
        say: ["Ash! Fennick's little neighbour. You've grown. Mostly up, and a bit sideways at the horns. Come in out of the smoke.", 'Ash! You grew! Come in out of the smoke.'],
        re: [
          { t: ['Where does all the smoke come from?', 'Where is the smoke from?'], say: ['The kitchen, the chimney and the walls. It has been here longer than I have.', 'Kitchen, chimney, walls. It is older than me.'] },
          { t: ['Fennick says hello.', 'Fennick says hello.'], say: ['He never says hello. He sends lamps. I have forty lamps.', 'He sends lamps instead. I have forty.'] },
        ] },
      { if: 'stage>=wren stage<three',
        say: ['Cultists on the road every night, and they never pay. One wanted a table by the window, so he could watch the road.', 'Cultists come in and never pay.'],
        re: [
          { t: ['Did you give him the table?', 'Did he get the table?'], say: ['I gave him the bill. He left through the window.', 'I gave him the bill. He ran.'] },
          { t: ['Are you safe out here?', 'Are you safe out here?'], tone: 'kind', f: 0.5, say: ['I have a big ladle, a bigger voice and a back door. I am fine.', 'Big ladle. Big voice. Back door.'] },
        ] },
      { if: 'quest kettle done !flag act1_done',
        say: ["My kettle's home. It smells of cultist. I've scrubbed it nine times. Ten's the charm.", 'My kettle is home. It smells of cultist.'],
        re: [
          { t: ['What does cultist smell like?', 'What does cultist smell like?'], say: ['Candle wax and bad decisions.', 'Wax and bad ideas.'] },
          { t: ['Does it still whistle?', 'Does it still whistle?'], say: ['Louder than ever. I think it missed me.', 'Louder. I think it missed me.'] },
        ] },
      { if: 'choice fennick=forgive !flag act1_done',
        say: ["Fennick wrote. A whole letter, and he said sorry in it twice. Fennick doesn't say sorry. What did you do to him?", 'Fennick wrote and said sorry. What did you do?'],
        re: [
          { t: ['I told him to make it right.', 'I told him to make it right.'], say: ['And he is. He would say that was you. He has said it already, in the letter.', 'He is. He says it was you.'] },
          { t: ['He did it himself, really.', 'He did it himself.'], tone: 'kind', f: 0.5, say: ['Then I will tell him so. He will not believe me. Cousins never do.', 'I will tell him. He will not believe me.'] },
        ] },
      // his old chat, as a moment
      { if: 'stage>=wren !flag act1_done',
        say: ["Here, smell this stew. What's in it?", 'Smell this stew. What is in it?'],
        re: [
          { t: ['Carrots. And a lot of pepper.', 'Carrots and pepper.'], tone: 'kind', f: 1, say: ['Carrots, pepper, and one more thing. The one more thing is more pepper.', 'And more pepper. That is the trick.'] },
          { t: ['Something that is still moving.', 'Something still moving.'], f: 0.75, say: ['Good nose. Do not eat that bit.', 'Good nose. Skip that bit.'] },
          { t: ['A boot. A whole boot.', 'A whole boot.'], tone: 'silly', f: 1, say: ['That was one time, and it was a very clean boot.', 'Once! It was a clean boot.'] },
        ] },
      { if: 'stage=done',
        say: ['The road is quiet tonight, Ash. No cultists, no fire bolts. Just the stew and the smoke, like it used to be.', 'The road is quiet now. Just stew and smoke.'],
        re: [
          { t: ['Are you closing for Lantern Night?', 'Are you closing tonight?'], say: ['Closing? I am bringing the stew to it. In the big pot. On a cart.', 'No. I am bringing the stew. On a cart.'] },
          { t: ['It suits you. Quiet.', 'Quiet suits you.'], say: ['It does not. I will be loud again by morning. But tonight, yes.', 'Not for long. But tonight, yes.'] },
        ] },
      { ask: ['Did you really build the Kettle yourself?', 'Did you build the Kettle?'],
        say: ['With my own hands. Then the roof fell in. Then I built it again, with smarter hands.', 'Yes. The roof fell in. So I built it again.'] },
      { ask: ['How many scarves has Marigold made you?', 'How many scarves?'],
        say: ['Nine. I cannot find a single one of them. Do not tell her.', 'Nine. I cannot find one. Shh.'] },
      { ask: ['Does Marigold know where the scarves go?', 'Does she know?'], if: 'said marigold_scarves',
        say: ["She knows I give them away? ...She knows. Don't tell her I know she knows.", 'She knows? Do not tell her I know.'] },
      { idle: [['Pull up a stool. Mind the smoke.', 'Pull up a stool.'], ['Something else? The stew is listening.', 'The stew is listening.']] },
      { bye: [['Off you go! Come back hungry!', 'Come back hungry!']] },
    ],

    // ---------------------------------------------------------------- Tamsin the Bard, at the Smoky Kettle
    // Theatrical, quick with a rhyme, kind under the show; was once a bad knight who stopped fights to write songs.
    // Her song about Ash grows as he does things (the "Sing me your song" row, tamsinSong in a9d_quests.js).
    tamsin: [
      { if: 'true', once: true,
        say: ["The Emberblood! I've been singing about you all week and I've never seen you up close. Turn round. I need to know how long the tail is.", 'The Emberblood! Turn around. How long is your tail?'],
        re: [
          { t: ["It's longer when I'm happy.", "It's longer when I'm happy."], say: ['That is going in verse two. Thank you. Hold still.', 'That goes in verse two!'] },
          { t: ['What have you been singing?', 'What have you been singing?'], say: ['Lantern Day, the raid, and a bit I made up. Every song needs a bit you made up.', 'Lantern Day, the raid, and a made-up bit.'] },
        ] },
      // (Wendel's talk) Ash gave Wendel "go bold" for kobold
      { if: 'said wendel_go_bold !flag act1_done', once: true,
        say: ['Wendel wrote to me. You gave him a rhyme for kobold. He is unbearable now. I have stolen it from him.', 'You gave Wendel a rhyme. I stole it from him!'] },
      { if: 'stage>=wren stage<three',
        say: ['Every song needs a villain, and the Oath are terrible ones. Nothing rhymes with Morrow except sorrow. I have used sorrow twice.', 'Nothing rhymes with Morrow but sorrow.'],
        re: [
          { t: ['Tomorrow rhymes with Morrow.', 'Tomorrow rhymes!'], tone: 'silly', f: 0.75, say: ['Tomorrow! Oh, that is good. "And Morrow fled, and swore he would come back tomorrow." I am stealing it.', 'Tomorrow! I am stealing that.'] },
          { t: ['Is Morrow really that bad?', 'Is Morrow really bad?'],
            say: ['He is a sad old man who believed a dragon. That is the hardest villain to sing. Nobody claps.', 'He is a sad old man. Nobody claps for that.'] },
        ] },
      { if: 'stage>=three !flag act1_done',
        say: ['The High Priest has fallen and the Kettle is full again. I sang it nine times last night. They only threw bread twice.', 'I sang about Morrow nine times. Bread twice.'],
        re: [
          { t: ['Which bit made them throw bread?', 'Which bit got bread?'], say: ['The rhyme for Morrow. I am working on it.', 'The Morrow rhyme. Still working on it.'] },
          { t: ['Put Pip in the next one.', 'Put Pip in it.'], if: 'flag pip', say: ['Pip is already in it. "Mip" rhymes with everything, if you are brave.', 'He is. Mip rhymes with everything.'] },
          { t: ['Was it a good crowd?', 'Was it a good crowd?'], say: ['They stayed. That is a good crowd.', 'They stayed. That is good.'] },
        ] },
      // her old chat, as a moment
      { if: 'stage>=oath !flag act1_done',
        say: ['Quick, before I lose the tune. Give me a word that rhymes with dragon.', 'Quick! A word that rhymes with dragon.'],
        re: [
          { t: ['Wagon. A wagon full of friends.', 'Wagon. Full of friends.'], tone: 'kind', f: 1, say: ['A wagon full of friends! That is going in the chorus.', 'That goes in the chorus!'] },
          { t: ['Does it have to rhyme?', 'Does it have to rhyme?'], f: 0.5, say: ['Everything has to rhyme, Ash. That is the whole job.', 'Always. That is the whole job.'] },
          { t: ["Draggin'. Like my tail.", "Draggin'. Like my tail."], tone: 'silly', f: 1, say: ["Draggin' his tail, the dragon went waggin'. Brilliant. Terrible. Brilliant.", "Draggin' his tail! Brilliant!"] },
        ] },
      { if: 'stage=done',
        say: ["I have the last verse of your song at last. It's about the top of the mountain, and it's the quietest verse I've ever written.", 'I wrote the last verse. It is very quiet.'],
        re: [
          { t: ['Why is it so quiet?', 'Why so quiet?'], say: ['Because nobody saw the top but you. I left it quiet, so that one day you can tell it yourself.', 'Nobody saw it but you. You can tell it one day.'] },
          { t: ['Does it rhyme?', 'Does the last verse rhyme?'], say: ['Barely. Some things should not rhyme too much.', 'Barely. Some things should not.'] },
        ] },
      { ask: ['Were you always a bard?', 'Were you always a bard?'],
        say: ['I was a very bad knight. I kept stopping fights to write songs about them.', 'I was a bad knight. I stopped fights to write songs.'] },
      { ask: ["What do you think of Wendel's songs?", "What about Wendel's songs?"],
        say: ['A good fiddler and a terrible poet. "Ash" and "crash". Twice. Amateur. I love him.', 'Good fiddler. Bad poet. I love him.'] },
      { idle: [['Hm? I was rhyming. Go on.', 'I was rhyming. Go on.'], ['Speak, and I will make it scan.', 'Speak. I will make it rhyme.']] },
      { bye: [['Off you go and do something I can rhyme.', 'Go do something I can rhyme.']] },
    ],

    // ---------------------------------------------------------------- Granny Moss, the herbalist of the Mirefen
    // Tart, unhurried, a bit witchy; Mabel's grandmother; calls Ash "child". Her knees cannot manage the bog (her quest
    // 'moss' is Mabel's basket). Sir Croaksley the frog is not a knight. If Ash let Morrow go, he gardens by her hut.
    moss: [
      // what Mabel wrote to her (said mabel_sorry_plants, Mabel's talk)
      { if: 'said mabel_sorry_plants !flag act1_done', once: true,
        say: ['Mabel writes that you say sorry to the flowers you pick. Good. They hear it. Sit, child.', 'Mabel says you say sorry to flowers. Good. Sit.'] },
      { if: '!quest moss started', once: true,
        say: ["So this is Mabel's dragon boy. Sit by the fire, child. By it. Not in it.", "Mabel's dragon boy! Sit by the fire. Not in it."],
        re: [
          { t: ["Mabel's worried about you.", 'Mabel is worried about you.'], say: ['Mabel is always worried. She gets it from her mother, who got it from me. I stopped. It took sixty years.', 'She gets that from me. I stopped. It took sixty years.'] },
          { t: ['Is that Sir Croaksley?', 'Is that Sir Croaksley?'], say: ['Sir Croaksley. He is not a knight. Do not tell him.', 'He is not a knight. Do not tell him.'] },
        ] },
      { if: '!event boss_done:gloamjaw !flag act1_done', ref: 'sunken_ward',
        say: ["Something big has been croaking in the deep water at night, out by the Sunken Ward. Sir Croaksley won't go near it, and he fears nothing.", 'Something big croaks in the deep water. My frog is scared.'],
        re: [
          { t: ['What does it sound like?', 'What does it sound like?'], say: ['Like a door the size of a barn, opening very slowly. All night.', 'Like a huge door, opening slowly.'] },
          { t: ["I'll go and see what it is.", "I'll go and see."], tone: 'brave', f: 0.5, say: ['Take a stick. And a second stick, for when it eats the first one.', 'Take two sticks. It will eat one.'] },
        ] },
      { if: 'event boss_done:gloamjaw !flag act1_done',
        say: ["The deep water's quiet. Sir Croaksley sang last night. I'd forgotten he could.", 'The water is quiet. My frog sang last night.'],
        re: [
          { t: ['Was it a good song?', 'Was it a good song?'], say: ['Terrible. One note, for an hour. I cried a little.', 'One note for an hour. I cried a bit.'] },
          { t: ['The Ward is warm again now.', 'The Ward is warm again.'], say: ['I can feel it in my knees. Sedge would be pleased. She was never once dry, and never once sorry.', 'My knees feel it. Sedge would be glad.'] },
        ] },
      { if: 'choice morrow=free stage>=three !flag act1_done',
        say: ["There's an old man growing pumpkins by my hut. He says he used to be a High Priest. He's a much better gardener.", 'An old man grows pumpkins by my hut now.'],
        re: [
          { t: ["He's the one I let go.", "He's the one I let go."], say: ['I know. He told me. He told me four times. He is grateful, child. Let him be.', 'He told me. Four times. Let him be.'] },
          { t: ['Are his pumpkins any good?', 'Are the pumpkins good?'], say: ['None of them are on fire. It is a start.', 'None are on fire. It is a start.'] },
        ] },
      // her old chat, as a moment
      { if: 'stage>=wren !flag act1_done',
        say: ['Would you like to meet Sir Croaksley properly? He does not do this for everybody.', 'Want to meet Sir Croaksley properly?'],
        re: [
          { t: ['It would be an honour, sir.', 'An honour, sir.'], tone: 'kind', f: 1, say: ['He likes you. He blinked. That is a great deal, for him.', 'He blinked. He likes you.'] },
          { t: ['Is he dangerous?', 'Is he dangerous?'], f: 0.5, say: ['Only to flies. And one heron, once. It was a fair fight.', 'To flies. And one heron.'] },
          { t: ['Does he do any tricks?', 'Does he do tricks?'], tone: 'silly', f: 0.75, say: ['He sits. It is his only trick. He is very good at it.', 'He sits. He is very good at it.'] },
        ] },
      { if: 'stage=done',
        say: ["I'm coming out of the bog for Lantern Night. My knees want a chair and a cup of tea, and they shall have both.", 'I am coming to Lantern Night. My knees want a chair.'],
        re: [
          { t: ["I'll save you the best chair.", "I'll save you a chair."], tone: 'kind', f: 0.5, say: ['Good boy. Not too near the fire. I have seen your family at a fire.', 'Good boy. Not too near the fire.'] },
          { t: ['Is Sir Croaksley coming too?', 'Is Sir Croaksley coming?'], say: ['He is coming in my pocket. He does not like crowds. He likes pockets.', 'In my pocket. He likes pockets.'] },
        ] },
      { ask: ['Did Mabel always want to be a healer?', 'Did Mabel want to heal?'],
        say: ['She wanted to be a knight. Then she watched me set one\'s arm. He cried and I did not. She liked my job better.', 'She wanted to be a knight. Then she saw me fix one.'] },
      { ask: ['Who was Sedge?', 'Who was Sedge?'],
        say: ['A Warden. This was her country. Her family still lives out here, and not one of them has ever been dry. It runs in the family, like stubbornness, and frogs.', 'A Warden from here. Her family is never dry.'] },
      { idle: [['Well, child?', 'Well?'], ['Mind the kettle. It bites.', 'Mind the kettle.']] },
      { bye: [['Off with you. Mind the deep bits.', 'Mind the deep bits.']] },
    ],
  },
})
