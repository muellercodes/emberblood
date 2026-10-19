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
  },
})
