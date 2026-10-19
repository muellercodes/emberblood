// game/story/act2/people.js (A2S; talk v11 by J10): everyday talk for every Act II person on the Clockwork Coast, and
// Mom's Act II talk at home. The how-to is v11/J1_NOTES.md; Mabel, Hal and Maren in act1/people.js are the pattern.
// How it plays:
//  - The first matching entry with a say (top to bottom; the chapter files load before this one) is the person's
//    greeting, the opener. Its re: are what Ash can say back to that exact line. Once he answers, the opener steps
//    aside for the next one down the list. An opener heard today is not said again: the person's idle line instead.
//  - ask: entries are menu topics with real labels, each live only while its if holds (up to three show).
//  - then: ['said key'] remembers what Ash answered; if: 'said key' reads it later, here or in another person's talk.
//  - Order in each list: one-time callbacks (once) first, then the openers in story order, then the moment (the old
//    TALK chat, asked when the question would really come up), then topics, idle, bye, and the barks.
// Coast people have never met Ash before this act: they know what Penny's paper and the chapters' scenes told them.
// World facts that change carry `fact` and are conditioned on it (map1_s.js): c_great_clock stopped|ticking,
// c_tide_clock high|low, c_lighthouse_lamp dark|lit, c_harbor closed|open, c_spire_rock hidden|risen,
// c_gearhaven clear|snowy. The night the moths came is "the night the clocks stopped".
// Each Embermere gate (gates_map0.js) has a pointer here, tagged with `promise`. Quest offers are in the q_*.js files;
// in-quest reminders that are plain lines live here.
// Act II stages: c_coast, c_gear (the chase), c_salt (the tide), c_claws, c_brass (the clock), c_light (the
// lighthouse), c_spire, c_snow (the snow; resting starts Act III).
people({
  id: 'act2_people', act: 2,

  clue: {
    q_whirligig_sales: { icon: 'clock', mystery: 'what_stopped', herring: true,
      text: ['Lord Whirligig sells clocks. Since every clock stopped, business is BOOMING. Forty new clocks this week.',
        'Lord Whirligig sells lots of clocks now.'] },
  },

  talk: {
    // ================================================================ Gearhaven, the Upper Town
    // ---------------------------------------------------------------- Captain Hester Ticklebrass, the Clockwatch
    // Precise, formal, short sentences, numbers. Kind under it: Ambrose counted her out of a crying fit when she was six.
    c_hester: [
      { if: 'quest c_tail done', once: true,
        say: ['Somebody took the spring out of my weathervane. It points at the sea all day now. I have opened a case.', 'Someone took my weathervane spring! I opened a case.'] },
      { if: 'quest c_bob done', once: true,
        say: ['Three Bobs on duty again. The reports are three times as long and every page says Bob. I find that I do not mind.', 'Three Bobs again! I do not mind the reports.'] },
      // the Bobs took Ash's ruling on which of them is clever (said bobs_turns, set in their talk)
      { if: 'said bobs_turns', once: true,
        say: ['The Bobs tell me a dragon ruled that they take turns being the clever one. They have drawn up a rota. It is on my desk.', 'The Bobs take turns being clever now. There is a rota.'] },
      { if: 'choice fennick=jail', once: true,
        say: ['Captain Osric writes that his lamps have never been so shiny. He has a prisoner who polishes.', "Osric's lamps shine. A prisoner polishes them."] },
      { if: 'stage>=c_light !clue q_ward_ledger', promise: 'm0_lockup', dir: ['brindlecross', 'm0_lockup', 'south'],
        option: ['Any news from Captain Osric?', 'Any news from Osric?'],
        say: ['Osric writes of an old Wardens\' Lockup south of Brindlecross, barred so thin even a mouse gives up. A shadow would not.',
          'A barred Lockup up north. A shadow fits.'] },
      // before Ash comes to report (the chapter's step plays the report itself)
      { if: 'stage=c_gear !flag c_hester',
        say: ['State your business. Briefly, please. The Clockwatch has a great deal of business today.', 'State your business. Quickly, please.'],
        re: [
          { t: ["I'm after the Moth Mask too.", "I'm after the Moth Mask."],
            say: ['Then bring me evidence, not enthusiasm. When you know where she will strike, come back and report.', 'Bring me proof. Then come and report.'] },
          { t: ['Has nobody ever caught her?', 'Has nobody caught her?'],
            say: ['Nine robberies. Everybody saw her and nobody caught her. That is the part I mind.', 'Nine times. Nobody caught her. I mind that.'] },
        ] },
      // her moment (the old chat), on the evening she sends him after the thief
      { if: 'flag c_hester !flag c_chase',
        say: ['Before tonight, a question. How many seconds should a hero wait before charging in?', 'How long should a hero wait before charging in?'],
        re: [
          { t: ['As long as it takes to plan.', 'Long enough to plan.'], tone: 'kind', f: 0.75, then: ['said hester_count'],
            say: ['Good. Then I will count for you, if you like. Sixty. It worked on me once.', 'Good. I will count for you. Sixty.'] },
          { t: ['Zero. I just go.', 'Zero! I just go.'], tone: 'brave', f: 0.5,
            say: ['Zero. Hm. Then go when I say go, and I will say it quickly.', 'Then go when I say. I will be quick.'] },
          { t: ['Seven. Seven is lucky.', 'Seven. It is lucky.'],
            say: ['Seven is not a plan. ...It is a respectable number, though.', 'Seven is not a plan. It is a nice number.'] },
        ] },
      // after the chase, while the Great Clock is stopped
      { if: 'flag c_chase !flag c_clock_on', fact: 'c_great_clock=stopped',
        say: ['Without the Great Clock nobody in this city knows when lunch is. I had mine at nine in the morning.', 'No clock, so no lunch time. I ate at nine!'],
        re: [
          { t: ["That's just a big breakfast.", "That's a big breakfast."],
            say: ['Do not tell the Bobs. They had theirs at four in the afternoon and called it supper.', 'The Bobs ate at four. They called it supper.'] },
          { t: ['Who stops a whole city of clocks?', 'Who stops every clock?'],
            say: ['Not one girl with a sack. That clock is packed with dust like a pillow. Something far bigger came over that night.', 'Not one girl. Something big came that night.'] },
        ] },
      // the clock ticks again (c_brass.js has her one-time salute first)
      { if: 'flag c_clock_on !flag c_snow', fact: 'c_great_clock=ticking',
        say: ['The Great Clock ticks, and lunch is at noon again. I had soup at twelve exactly. It was the best soup of my life.', 'Lunch is at noon again. Best soup ever.'],
        re: [
          { t: ['Not one second late?', 'Not one second late?'],
            say: ['The bell struck twelve and the spoon went in on the first stroke.', 'The spoon went in on the first bong.'] },
          { t: ['Ambrose says somebody held the hands.', 'Ambrose says someone held it.'], if: 'flag c_ambrose',
            say: ['Then I have a case. A thin one. It says: something big, with wings, at one minute to midnight.', 'I have a case. Something big, with wings.'] },
          { t: ['Ambrose must be so pleased.', 'Ambrose must be pleased.'],
            say: ['He has wound her twice today. She does not need it. He does it anyway.', 'He wound her twice today. Just because.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ['There is no rule about snow in summer. I am writing one tonight. It is already four pages long.', 'No rule for summer snow. I am writing one.'],
        re: [
          { t: ['What does the rule say?', 'What does it say?'],
            say: ['Page one: snow in summer is not allowed. Pages two to four: what to do when it falls anyway.', 'It is not allowed. And what to do anyway.'] },
          { t: ["I'm going after whatever did it.", "I'm going after it."], tone: 'brave', f: 0.5,
            say: ['I assumed so. Take a scarf. That is not a rule. It is just sense.', 'I thought so. Take a scarf.'] },
        ] },
      // topics (her old TALK about and deep)
      { ask: ['Do you know Captain Osric?', 'Do you know Captain Osric?'],
        say: ['We have written every week for eleven years. He sends news of his dogs. I send news of my Bobs. Neither of us is winning.', 'He writes about dogs. I write about Bobs.'] },
      { ask: ['Why do you count everything?', 'Why do you count?'], if: 'flag c_chase',
        say: [['c_hester', 'When I was six I got lost on the Great Stair and cried. Old Ambrose sat down beside me and counted to sixty with me.', 'I got lost as a girl. Ambrose counted with me.'],
          ['c_hester', 'By sixty I had stopped crying. I have been counting ever since.', 'By sixty I stopped crying. I still count.']] },
      { ask: ['Have you met Mina in Saltmarsh?', 'Do you know Mina?'], if: 'flag c_mina',
        say: ['I went down once to ask why the tide was late. She measured it, I timed it, and we both told the sea off. A good afternoon.', 'We told the sea off once. A good day.'] },
      { idle: [['Report.', 'Report.'], ['Go on. I am counting.', 'Go on. I am counting.']] },
      { bye: [['Dismissed. Mind the gaps between the roofs.', 'Dismissed. Mind the gaps.'], ['On time next time, please.', 'On time next time.']] },
      { bark: true, say: ['Forty seconds. Thirty-nine. Thirty-eight...', 'Forty. Thirty-nine. Thirty-eight...'] },
      { bark: true, if: '!flag c_clock_on', fact: 'c_great_clock=stopped',
        say: ['One minute to midnight, all day long. Somebody fix that clock before I arrest it.', 'Somebody fix that clock!'] },
    ],

    // ---------------------------------------------------------------- Archivist Ottoline Inkwell, the Turning Library
    // Whispers, then forgets and says it loud, then says sorry. Has argued with Sister Wren by letter for thirty years.
    c_ottoline: [
      { if: 'quest c_logbook done', once: true,
        say: ['The whole logbook, home on its shelf. Wren sent a letter of congratulations. It was four pages about commas.',
          'The logbook is home! Wren wrote about commas.'] },
      { if: 'item c_diary !flag c_diary_sent', option: ['Can you read this dream diary?', 'Can you read this diary?'],
        then: ['set c_diary_sent'],
        say: ["Moon letters in the margins. I can't read them. But I know somebody who can, and she'll be insufferable. I'll send a copy to Wren.",
          "Moon letters! Wren can read them."] },
      { if: 'stage>=c_brass !clue q_nursery', promise: 'm0_pearl', dir: ['embers_nursery', 'm0_pearl', 'north'], option: ['What does Wren say about Pearl?', 'What does Wren say?'],
        say: ["Wren writes that above Ember's Nursery, up north, a tiny iron hook sits on a windy crag. Pearl's first, she thinks. A tail like yours could reach it.",
          "Pearl's first hook is on a crag up north."] },
      { if: 'flag c_pages_given !quest c_logbook done',
        say: ["Pearl's pages are coming home, one by one! Wren has written me a letter about every single page.", "Pearl's pages are coming home!"] },
      // before the chapter sends Ash here to ask how anyone climbs a clock (that visit is the chapter's own scene)
      { if: '!flag c_ottoline',
        say: ["Shh. You're the dragon from Penny's board. Mind the shelves. They turn when they like.", "Shh. You're the dragon. Mind the shelves."],
        re: [
          { t: ['Why do the shelves move?', 'Why do they move?'],
            say: ['Pearl built the library on a clock. It turns a little every hour. Most people get dizzy. I got a job.', 'It turns every hour. People get dizzy. I got a job.'] },
          { t: ['Have you got books on the Moth Mask?', 'Books on the Moth Mask?'],
            say: ["Only Penny's old papers. She reads them more than anyone. She wrote them.", "Only Penny's papers. She wrote them."] },
        ] },
      // after Pearl's family tree rolled out of the door
      { if: 'flag c_ottoline',
        say: ["Pearl's family tree is still halfway down the steps. I can't roll it back up. It's too long, and I'm too short.", "Pearl's family tree is out the door. I can't roll it up."],
        re: [
          { t: ['I can hold the other end.', 'I can hold one end.'], tone: 'kind', f: 0.5,
            say: ['With those claws? Gently, then. Pinch it, don\'t poke it. ...Thank you.', 'Gently, with those claws. Thank you.'] },
          { t: ['Two hundred climbers. And no fire.', 'Two hundred. No fire.'],
            say: ['Not a spark between them. They built half this coast instead. The lighthouse, the clock, the steps down to the sea.', 'No fire. They built half the coast instead.'] },
        ] },
      // her moment (the old chat): a librarian's question, once he is a regular
      { if: 'stage>=c_claws',
        say: ['Quietly, please. I ask everyone this. What is the best book you have ever read?', 'Quietly. What is the best book you ever read?'],
        re: [
          { t: ['One my mom read me, over and over.', 'One Mom read to me.'], tone: 'kind', f: 0.75, then: ['said ottoline_mom_book'],
            say: ['The best kind. You can still hear the voice in it. I am going to tell Wren you said that.', 'The best kind. You still hear her voice.'] },
          { t: ['One about a dragon who saved everyone.', 'A dragon who saved everyone.'],
            say: ['I know that one. You may be in the next edition. Quietly in it.', 'I know it. You may be in the next one.'] },
          { t: ['A cookbook. I ate it.', 'A cookbook. I ate it.'],
            say: ['You ATE... sorry. You ate a book? Do not tell Sister Wren.', 'You ate a book? Do not tell Wren.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ['Snow, in summer. I have looked in every book in this building. Not one says it can happen.', 'Snow in summer. No book says it can happen.'],
        re: [
          { t: ["Then write it in, I'm here.", 'Write it in. I saw it.'],
            say: ['In the margin, in pencil, with the date. Yes. That is what the margins are for.', 'In the margin, with the date. Yes.'] },
          { t: ['Did Pearl ever see snow?', 'Did Pearl see snow?'],
            say: ['Her logbook says it snowed once, the winter her mother died. Only that once. I wish I had not looked.', 'Once. The winter her mother died.'] },
        ] },
      // topics (her old TALK about and deep)
      { ask: ['Do you really write to Sister Wren?', 'Do you write to Wren?'],
        say: ['For thirty years. We have never agreed about anything. It is wonderful.', 'For thirty years. We never agree. It is wonderful.'] },
      { ask: ['Does Lord Whirligig borrow books?', 'Does Lord Whirligig read?'],
        say: ['He owes me eleven books. ELEVEN. Sorry. Eleven. One of them is about manners.', 'He owes me eleven books! Sorry. Eleven.'] },
      { ask: ['Have you always worked here?', 'Have you always been here?'], if: 'flag c_ottoline',
        say: ['When I was little I hid in here during a storm. The shelves kept turning, and I read every book that came past. Twice. I never really left.',
          'As a girl I hid here in a storm. I read every book. I stayed.'] },
      { idle: [['Shh. Yes?', 'Shh. Yes?'], ['Quietly, please. What is it?', 'Quietly. What is it?']] },
      { bye: [['Walk. Do not run. The shelves will take you to the door.', 'Walk. Do not run.'], ['Shh. Goodbye.', 'Shh. Goodbye.']] },
      { bark: true, say: ['shhh... SHHHH! ...sorry.', 'shhh... SHHH! Sorry.'] },
    ],

    // ---------------------------------------------------------------- Lord Percival Whirligig, Whirligig Manor
    // Pompous, says "Hmph", wants feet wiped. Robbed nine times. Softens over the act (the music box, the clocks).
    // (c_gear.js and c_brass.js hold his one-time thank-yous; they play before these.)
    c_whirligig: [
      { if: 'flag c_gifts=truth', once: true,
        say: ["I sent the fishing girl a clock. A small one, with a little bird. She named the bird after me. Percy.", 'I sent Posy a clock. The bird is Percy!'] },
      { if: 'quest c_bolt done', once: true,
        say: ['That brass DOG has my hat. AGAIN. Tell Professor Sprocket I want it back. Tell her nicely. He bites.', 'That dog took my hat again!'] },
      { if: 'stage>=c_gear !flag c_clock_on !clue q_whirligig_sales', fact: 'c_great_clock=stopped',
        option: ['Has business been good?', 'How is business?'], then: ['clue q_whirligig_sales'],
        say: ['Since every clock in town stopped? BOOMING. Everyone wants a new clock, and I have four hundred. Forty sold this week!',
          'Every clock stopped. Now everyone buys mine!'] },
      // before the chase: the man she robs
      { if: '!flag c_chase',
        say: ['A dragon, on my front step. Hmph. Do dragons wipe their feet?', 'A dragon on my step! Do dragons wipe their feet?'],
        re: [
          { t: ["I'm here about the Moth Mask.", "I'm here about the Moth Mask."],
            say: ['She has robbed me nine times. Nine! I have started leaving biscuits out, so at least she is polite about it.', 'She robbed me nine times. Now I leave biscuits.'] },
          { t: ['Only when someone asks nicely.', 'If you ask nicely.'],
            say: ['I am asking. Nicely. This is my nice voice. Hmph.', 'This is my nice voice. Hmph.'] },
        ] },
      // after the chase, while the clocks are stopped
      { if: 'flag c_chase !flag c_clock_on', fact: 'c_great_clock=stopped',
        say: ['Four hundred clocks in this house, dragon, and every one says one minute to midnight. I pay my clock tax!', 'Four hundred clocks, all stopped. I pay my tax!'],
        re: [
          { t: ['Why do you need four hundred clocks?', 'Why four hundred clocks?'],
            say: ['Need? Nobody needs four hundred clocks. I like to be sure what time it is.', 'Nobody needs them. I like to be sure.'] },
          { t: ['She still has your bird clock.', 'She has your bird clock.'], if: 'flag c_chase=helped',
            say: ['It sang at six every morning. A little tin bird. The house is very quiet now.', 'It sang every morning. The house is quiet now.'] },
          { t: ['Does the bird clock still sing?', 'Does the bird still sing?'], if: 'flag c_chase=sack',
            say: ['At six this morning. I wound it four times to be certain. Hmph. Thank you, dragon.', 'It sang this morning. Hmph. Thank you.'] },
        ] },
      // his moment (the old chat), the day his clocks tick again
      { if: 'flag c_clock_on',
        say: ["Be honest, dragon. You've seen this whole city now. Am I a good lord?", 'Be honest. Am I a good lord?'],
        re: [
          { t: ["You're getting there.", "You're getting there."], tone: 'kind', f: 0.75,
            say: ["Getting there. Hmph. I'll take it. I'll have it framed.", "Getting there. I'll have it framed."] },
          { t: ['Not yet. Be kinder.', 'Not yet. Be kinder.'], tone: 'brave', f: 0.5, then: ['said whirligig_kinder'],
            say: ['Kinder? ...Like leaving the biscuits out. I can do kinder. Watch me.', 'Kinder? Like the biscuits. I can do that.'] },
          { t: ['You let Posy keep her box.', 'You let Posy keep it.'], if: 'flag c_gifts=truth', tone: 'kind', f: 0.5,
            say: ["I did. It felt rather good. I did not expect that. Don't tell anyone.", "I did. It felt good. Don't tell anyone."] },
        ] },
      { if: 'flag c_clock_on !flag c_snow', fact: 'c_great_clock=ticking',
        say: ['Business is terrible. Every clock in town works now. I have never been happier. Hmph.', 'Business is bad. I am happy. Hmph.'],
        re: [
          { t: ['Then why do you look so cross?', 'Why do you look cross?'],
            say: ['This is my happy face. It has had very little practice.', 'This is my happy face. It needs practice.'] },
          { t: ['Do you ever sing to them?', 'Do you sing to them?'], if: 'said whirligig_clocks',
            say: ['I tried. This morning, to the hall clock. It stopped. ...It needed winding. I am choosing to believe that.', 'I tried. It stopped. It needed winding, I think.'] },
          { t: ['Four hundred ticks at once!', 'Four hundred ticks!'],
            say: ['Listen to them. That is music, dragon. Loud, expensive music.', 'Listen! That is music. Loud music.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ['Snow on my roof in June. My weathercocks are sulking. At least the clocks still tick.', 'Snow in June! At least the clocks tick.'],
        re: [
          { t: ['Did you see the white sky?', 'Did you see the white sky?'],
            say: ['I saw it from my tower. I have ordered forty pairs of mittens for the Clockwatch. Do not tell them I did.', 'I saw it. I bought mittens for the guards. Shh.'] },
          { t: ['Did you leave the biscuits out?', 'Did you leave biscuits out?'],
            say: ['Every night. Nobody takes them now. I find I miss being robbed. Hmph.', 'Every night. Nobody takes them. I miss it.'] },
        ] },
      // topics (his old TALK about and deep)
      { ask: ['What is the best clock you own?', 'What is your best clock?'],
        say: [['c_whirligig', 'My father had one clock. He wound it every morning and sang to it while he did.', 'My father had one clock. He sang to it.'],
          ['c_whirligig', 'I have four hundred, and I have never once sung. Perhaps I have been doing it wrong.', 'I have four hundred. I never sing.']],
        then: ['said whirligig_clocks'] },
      { ask: ['What did Madame Ravel sell you?', 'What did Ravel sell you?'],
        say: ['A genuine mermaid comb. It is a fork. I keep it on the mantelpiece anyway.', 'A mermaid comb. It is a fork. I kept it.'] },
      { ask: ['Why does the Moth Mask always pick you?', 'Why does she pick you?'], if: '!solved who_is_she',
        say: ['Because I have the most things that glow. Penny says it is because I have the most things. Penny is rude.', 'I have the most glowing things. Penny says most things.'] },
      { idle: [['Hmph. What now?', 'Hmph. What now?'], ['Feet wiped? Good. Go on.', 'Feet wiped? Go on.']] },
      { bye: [['Wipe your feet on the way out. Yes, out.', 'Wipe your feet on the way out.'], ['Hmph. Good day, dragon.', 'Hmph. Good day.']] },
      { bark: true, if: '!flag c_clock_on', fact: 'c_great_clock=stopped',
        say: ['*checks his pocket watch* Still stopped. *checks again* Still stopped.', '*checks his watch* Still stopped.'] },
      { bark: true, if: 'flag c_clock_on', fact: 'c_great_clock=ticking',
        say: ['Listen to them! Four hundred clocks, all ticking at once. That is MUSIC, dragon.', 'My clocks tick! Music!'] },
    ],

    // ---------------------------------------------------------------- Clockkeeper Ambrose Tickett, the Great Clock
    // Ninety years winding her, a bit deaf, "Eh?", the odd "Tick." He misses his wife. A story lead in Act II.
    // (c_brass.js has his hint about the bell loft first, until Ash has seen the Nest.)
    c_ambrose: [
      { if: 'flag c_clock_on', once: true, fact: 'c_great_clock=ticking',
        say: ['Tick. Tock. TICK. TOCK. Oh, young dragon. Listen to her. Ninety years, and I never heard her sound so pleased.',
          'Tick. Tock. Listen to her! She is happy.'] },
      // Hester told him Ash let her count for him (said hester_count)
      { if: 'said hester_count flag c_ambrose', once: true,
        say: ['Little Hester says you let her count for you. Sixty, was it? She learned that one on my stair. Tick.', 'Hester counted for you? She learned that from me. Tick.'] },
      // before the bell loft (the chapter's hint takes over once Ash reaches c_brass)
      { if: '!flag c_clock_on stage<c_brass', fact: 'c_great_clock=stopped',
        say: ["Eh? Yes, she's stopped. Ninety years I've wound her, and she never stopped once. Not for storms. Not for weddings. Tick.", "Eh? She stopped. Ninety years, never once before. Tick."],
        re: [
          { t: ['What stopped her?', 'What stopped her?'],
            say: ['Something flew over that night. Big. Soft. Wings like old curtains. I felt the wind of it on my head.', 'Something big flew over. Wings like curtains.'] },
          { t: ['Can you wind her again?', 'Can you wind her up?'],
            say: ["Every morning. The handle turns. She doesn't. Like winding a sleeping cat. Tick.", "The handle turns. She doesn't. Tick."] },
        ] },
      // after he sent Ash down to the Brassworks (brs_ambrose), while she is still stopped
      { if: 'flag c_ambrose !flag c_clock_on', fact: 'c_great_clock=stopped',
        say: ['Down the chimney, was it? Into the Brassworks? Mind her heart. It is older than me. Tick.', 'Into the Brassworks? Mind her heart. It is old.'],
        re: [
          { t: ["I'll get her going again.", "I'll get her going."], tone: 'brave', f: 0.5,
            say: ["Eh? Going? Yes. Do. I'll be up here with the winding handle.", "Yes. Do. I'll be up here."] },
          { t: ['Who is the girl who sweeps your bell?', 'Who sweeps your bell?'], tone: 'kind', then: ['said ambrose_girl'],
            say: ['Eh? The girl? She comes at night. Sweeps the bell, oils the hinges, never says a word. I leave her an apple.', 'She comes at night and sweeps. I leave her an apple.'] },
        ] },
      // his moment (the old chat), the first day she ticks again
      { if: 'flag c_clock_on !flag c_snow', fact: 'c_great_clock=ticking',
        say: ['Eh? Speak up. Now she is going again, I can hear myself ask. What is the best sound in the world?', 'Eh? Speak up. What is the best sound in the world?'],
        re: [
          { t: ['Someone you love, laughing.', 'Someone you love, laughing.'], tone: 'kind', f: 0.75,
            say: ['Eh? Laughing? Yes. That is the one. My wife laughed like a bell. Tick.', 'Yes. That is it. My wife laughed like a bell.'] },
          { t: ['Your clock, ticking again.', 'Your clock, ticking.'], tone: 'kind', f: 0.5,
            say: ['Mine? Second best, young dragon. A kind thing to say, though. Tick.', 'Second best. Kind of you. Tick.'] },
          { t: ['TICK.', 'TICK.'],
            say: ['TOCK! Ha! Ninety years, and nobody ever answered. Tick.', 'TOCK! Ha! Nobody ever answered!'] },
        ] },
      // after the snow: the girl came back (only when she is a friend)
      { if: 'flag c_snow said ambrose_girl choice c_vesper=friend', once: true,
        say: ['The girl came to sweep the bell last night, in the snow. I told her a dragon asked after her. She went pink and swept twice. Tick.', 'The girl came back. I said you asked. She went pink.'] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["Snow in the bell loft. She doesn't mind. She's been cold before. Tick.", "Snow in the bell loft. She doesn't mind."],
        re: [
          { t: ['Will the cold stop her again?', 'Will the cold stop her?'],
            say: ['Eh? No. Cold slows a clock. It takes somebody holding the hands to stop one. Tick.', 'Cold slows her. Only a hand stops her.'] },
          { t: ['Keep her ticking for me.', 'Keep her ticking.'], tone: 'kind', f: 0.5,
            say: ['Ninety years I have. Ninety more if I must. Off you go. Tick... tock.', 'I will. Off you go. Tick... tock.'] },
        ] },
      // topics (his old TALK about and deep)
      { ask: ['Did you really count with Hester?', 'Did you count with Hester?'], if: 'flag c_hester',
        say: ['Eh? Little Hester? Six years old, crying on the Great Stair. I sat down and counted to sixty with her. Now she counts at everybody. Tick.', 'She was six and crying. I counted with her. Tick.'] },
      // the one that matters: he would stop every clock to hear her again, and somebody did stop them
      { ask: ['What was your wife like?', 'What was your wife like?'], if: 'flag c_clock_on',
        say: ["Eh? She said the clock was my sweetheart. She wasn't wrong. But I'd stop every clock in the world to hear her laugh again.", 'She said the clock was my sweetheart. I miss her laugh.'],
        re: [
          { t: ['Somebody did stop them all.', 'Someone did stop them.'],
            say: ["Eh? ...So they did. And she didn't come back, did she. Clocks don't work like that. Tick.", "So they did. She didn't come back. Tick."] },
          { t: ['I bet she laughed at your ticking.', 'She laughed at your ticks?'],
            say: ['Every single time. That is why I kept doing it. Tick.', 'Every time. That is why I kept it up. Tick.'] },
        ] },
      { idle: [['Eh? Speak up. Tick.', 'Eh? Speak up.'], ["Still here, young dragon. So's she. Tick.", "Still here. So is she. Tick."]] },
      { bye: [['Mind the stairs. There are a lot of them. Tick.', 'Mind the stairs. Tick.'], ['Eh? Bye? Bye, then. Tick... tock.', 'Bye, then. Tick... tock.']] },
      { bark: true, say: ['Tick. ...Tick. ...Eh? Was that me?', 'Tick. Was that me?'] },
    ],

    // ---------------------------------------------------------------- Constables Bob and Bob, the Clockwatch
    // Two tin watchmen who finish each other's lines. "Halt!" is theirs (it is in no one else's mouth). Ash said he was a
    // dragon "mostly", so to them he is Mostly Part Dragon.
    c_bobs: [
      { if: 'quest c_bob done', once: true,
        say: ['All three of us! Bob, Bob, and Bob. It is very confusing for everyone. We love it. Ask Bob what he remembers.',
          'All three Bobs! Ask Bob what he remembers.'] },
      // their moment (the old chat): once all three are home again
      { if: 'quest c_bob done',
        say: ['Question, Mostly Part Dragon. Now there are three of us again. Which one is the clever Bob?', 'Question. Which of us is the clever Bob?'],
        re: [
          { t: ['All three of you, taking turns.', 'All three, taking turns.'], tone: 'kind', f: 0.75, then: ['said bobs_turns'],
            say: ['Turns! Hear that, Bob? We will need a list. The Captain loves a list.', 'Turns! We need a list, Bob.'] },
          { t: ['The one with the blue plume.', 'The blue plume one.'],
            say: ['We do not talk about... oh. We can talk about Bob now. Yes. Fair.', 'We do not talk... oh. We can now. Fair.'] },
          { t: ["Whoever's holding the map.", 'Whoever has the map.'],
            say: ['None of us is holding the map. ...Bob? Bob. Where is the map?', 'Nobody has the map. Bob? Where is it?'] },
        ] },
      { if: '!flag c_clock_on', fact: 'c_great_clock=stopped',
        say: ["Halt! ...It's the lizard again, Bob. He says dragon, Bob. Tick. Tock. That's us, not the clock.", "Halt! Oh, it's the dragon. Tick. Tock. That's us."],
        re: [
          { t: ['Do you need winding too?', 'Do you need winding?'],
            say: ['Every morning. The Captain counts the turns. Forty-one. We like forty-one.', 'Every day. Forty-one turns. We like forty-one.'] },
          { t: ['Why are there only two of you?', 'Why only two of you?'], if: '!quest c_bob started',
            say: ['We do not talk about Bob. ...We miss Bob, Bob.', 'We do not talk about Bob. We miss him.'] },
          { t: ['Is Bob still in the Brass Yards?', 'Is Bob still lost?'], if: 'quest c_bob active',
            say: ['Somewhere in the Brass Yards, going tick tock in a scary voice. Bring him gently. He is the clever one.', 'He is in the Brass Yards. Gently, please.'] },
        ] },
      { if: 'flag c_clock_on', fact: 'c_great_clock=ticking',
        say: ['Tick. Tock. That is the clock AND us, Mostly Part Dragon. It is a duet.', 'Tick. Tock. A clock duet!'],
        re: [
          { t: ['Can I join in? Tick.', 'Can I join in? Tick.'],
            say: ['Tock. ...You are off the beat, Bob. He is off the beat. We will practice.', 'Tock. You are off the beat. Practice.'] },
          { t: ['Who built you two?', 'Who built you?'],
            say: ["Mother Pearl built the first three Bobs. She said, you'll guard this city when I'm gone. We said, where are you going? She laughed.", 'Pearl built us. She said, guard the city. We still do.'] },
        ] },
      { ask: ['Is the Captain very strict?', 'Is the Captain strict?'],
        say: ['She wound us up once for being late. ...That is how we work, Bob.', 'She winds us up. That is how we work.'] },
      { ask: ['Does the Moth Mask really steal hats?', 'Does she steal hats?'], if: '!seen brs_pile',
        say: ["She took Bob's hat. It was MY hat, Bob. It had a little badge that glowed. We want it back. Both of us.", "She took Bob's hat. It glowed. We want it back."] },
      { ask: ['I found your hat in her hideout.', 'I found your hat.'], if: 'seen brs_pile',
        say: ['With the glowing badge? She kept it? ...She kept it nice. We are not as cross as we were, Bob.', 'She kept it nice. We are less cross.'] },
      { idle: [['Tick. Tock. Yes?', 'Tick. Tock. Yes?'], ['All quiet, Mostly Part Dragon.', 'All quiet.']] },
      { bye: [['Halt! ...No, carry on. Carry on.', 'Halt! No. Carry on.'], ['Tick. Tock. Goodbye, Bob. He is not Bob, Bob.', 'Tick. Tock. Goodbye.']] },
      { bark: true, say: ['Tick. Tock. All quiet, Bob. All quiet, Bob.', 'Tick. Tock. All quiet.'] },
      { bark: true, if: '!quest c_bob done', say: ['We do not talk about Bob. ...We miss Bob, Bob.', 'We miss Bob.'] },
    ],

    c_bob3: [
      // the quest's surprise (q_bob.js bb_home), for as long as the homecoming plays the old lines
      { if: 'quest c_bob done !seen bb_home', once: true, scene: 'bb_remember' },
      { say: [["I'm Bob. The clever one. ...They told you I'm not the clever one. I am a bit.", "I'm Bob. The clever one. A bit."],
        ['Thank you for the gentle breath. My ears still smell of toast.', 'My ears smell of toast. Thanks!']] },
      { bark: true, say: ['Tick. Tock. Bob reporting.', 'Tick. Tock. Bob here.'] },
    ],

    // ================================================================ Gearhaven, the Lower Town
    // ---------------------------------------------------------------- Professor Hettie Sprocket, Sprocket's Workshop
    // Talks fast, invents everything, "Don't touch that". Lost her brass dog Bolt the night the moths came.
    c_hettie: [
      { if: 'quest c_bolt done', once: true,
        say: ['Bolt sneezed once this morning. ONCE. A record. Science!', 'Bolt only sneezed once today!'] },
      { if: 'quest c_tail done', once: true,
        say: ["How's the Reel-In? Pulling things? Pulling too many things? That's a feature.", 'How is the Reel-In? Pulling lots?'] },
      // Ash said he would invent something to keep people warm (said hettie_warm, below), then lit a stove with a breath
      { if: 'said hettie_warm quest c_oona done', once: true,
        say: ["You told me you'd invent something to keep people warm. Then you lit Granny Oona's stove with one breath. That's not inventing. That's showing off.",
          "You lit Gran's stove with one breath. Show-off!"] },
      // after the gear: Ash has her glass and is hunting for clues
      { if: 'flag c_hettie stage=c_gear',
        say: ['Is my glass working? Moth dust shows silver through it. Tell me what you found. Slowly. I am writing it down.', 'Is my glass working? What did you find?'],
        re: [
          { t: ['Silver prints on the Manor wall.', 'Prints on the Manor wall.'], if: 'clue g_roof_prints',
            say: ['On a wall? Going up? People do not walk up walls. ...Somebody does, apparently.', 'Up a wall? Somebody does, then.'] },
          { t: ['Everything looks silver through it.', 'Everything looks silver.'],
            say: ['Not everything. Only moth dust. If everything looks silver, this city is in more trouble than I thought.', 'Only dust shines. If all of it shines, we are in trouble.'] },
          { t: ['Why does moth dust stick to gears?', 'Why does dust stick?'],
            say: ['It is greasy. Moths are greasy. I wrote a paper on it. Nobody read it.', 'It is greasy. I wrote a paper on it.'] },
        ] },
      // Bolt is still lost (her quest for him needs the Grapple Tail and opens later)
      { if: 'stage>=c_salt !quest c_bolt started',
        say: ["Bolt ran off the night the moths came. He's brass. He'll be fine. He's brass. I keep saying that.", "Bolt ran off. He's brass. He'll be fine."],
        re: [
          { t: ["I'll keep an eye out for him.", "I'll look out for him."], tone: 'kind', f: 0.5,
            say: ["He's the size of a goat and he sneezes every five seconds. You'll hear him before you see him.", "He's goat-size and he sneezes. You'll hear him."] },
          { t: ['What sort of dog is he?', 'What is he like?'],
            say: ['Loyal. Nosy. He bites toasters. He is the best thing I ever built.', 'Loyal and nosy. My best invention.'] },
        ] },
      // her moment (the old chat): the clock is going and she can think about something else
      { if: 'flag c_clock_on',
        say: ['The clock is going, so I can think about something else. Your turn. If you could invent anything at all, what would it be?', 'Your turn. If you could invent anything, what would it be?'],
        re: [
          { t: ['Something that keeps everyone warm.', 'Something to keep people warm.'], tone: 'kind', f: 0.75, then: ['said hettie_warm'],
            say: ['That is lovely, and hard. Heat leaks out of everything. I will start tonight. Where is my spanner?', 'Lovely, and hard. I will start tonight.'] },
          { t: ['A rocket I can ride.', 'A rocket to ride!'], tone: 'brave', f: 0.5,
            say: ['I have three. Two of them are on fire, which is normal for rockets. You may have the third.', 'I have three. Two are on fire. That is normal.'] },
          { t: ['A sandwich that makes more sandwiches.', 'A sandwich that makes sandwiches.'],
            say: ['A self-filling sandwich. Write that down. Where is my pencil? I had two pencils.', 'Ha! Write that down! Where is my pencil?'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["Snow in June! I've put a thermometer on every roof in the Lower Town. They all agree, and I don't like what they're saying.", 'Snow in June! My thermometers all say the same thing.'],
        re: [
          { t: ['What are they saying?', 'What do they say?'],
            say: ['Colder every hour, and the cold comes from over the mountains. Something up there is breathing out.', 'Colder every hour. Something far off breathes out cold.'] },
          { t: ['Can you invent summer back?', 'Can you invent summer?'],
            say: ['I am trying. It keeps exploding. Quill writes that the moon is smaller too. I did not want to know that.', 'I am trying. It explodes. And the moon is smaller.'] },
        ] },
      // topics (her old TALK about and deep)
      { ask: ['What is that clock that runs backwards?', 'What is the backwards clock?'],
        say: [['c_hettie', 'My mother built clocks. My grandmother built clocks. I built that one. It runs backwards and tells you how long until you were born.', 'Mine runs backwards. It counts to when you were born.'],
          ['c_hettie', 'Nobody wants it. I love it.', 'Nobody wants it. I love it.']] },
      { ask: ['Who makes your parts?', 'Who makes your parts?'],
        say: ["Ingrid at the Bright Anvil makes the parts I can't. I make the parts she won't. Usually the exploding ones.", 'Ingrid makes my parts. I make the exploding ones.'] },
      { ask: ['Do you write to Professor Quill?', 'Do you know Professor Quill?'],
        say: ['About stars and screws. She thinks the moon is rock. I think it is gears. One of us is right.', 'She says the moon is rock. I say gears.'] },
      { idle: [["Don't touch that. What do you need?", "Don't touch that. What?"], ["Mm? I'm listening. Mostly.", "I'm listening. Mostly."]] },
      { bye: [['Mind the toaster on your way out. It knows what it did.', 'Mind the toaster on the way out.'], ['Go on. Science waits for nobody.', 'Go on. Science waits.']] },
      { bark: true, say: ['If you hear a bang, that was the toaster. Probably.', "A bang? That's the toaster."] },
      { bark: true, if: '!quest c_bolt done', say: ["Bolt? Boooolt? Here, boy! ...He's not here, is he.", 'Bolt? Here, boy! Not here.'] },
    ],

    // ---------------------------------------------------------------- Harbormaster Mo Barnacle, the Harbor Office
    // Booms. "Barnacles!" Blows bubbles (gave up smoking). His granny waved a lantern at the dark every night; so does he.
    // (c_light.js has his one-time "Not crabs?" once the bridge is solved.)
    c_mo: [
      { if: 'flag ev_fish', once: true,
        say: ['You beat my sister Bess at fishing? She wrote and said it was luck. In capital letters. Three pages.', 'You beat my sister Bess? She says luck!'] },
      { if: 'flag c_regatta_won', once: true,
        say: ['The Ash Rule! No dragons in the regatta. Jo wrote it on the shed door. In tar.', 'Jo made a rule. No dragons!'] },
      // the harbor chain hangs on the Great Clock's gears, so nothing sails while she is stopped
      { if: '!flag c_clock_on', fact: 'c_harbor=closed',
        say: ["Ahoy! Finest harbor on the coast! Nothing's sailing, mind. The harbor chain won't lift without the Great Clock.", 'Ahoy! No ships sail. The chain is stuck.'],
        re: [
          { t: ['Why does the chain need the clock?', 'Why does it need the clock?'],
            say: ['Pearl hung it off the clock gears so nobody could sneak in at night. Clever. Until the clock stops.', 'Pearl tied it to the clock. Clever, till it stopped.'] },
          { t: ['Where are all the sailors?', 'Where are the sailors?'],
            say: ["In the Teapot, drinking Fig's tea and moaning. Sailors on land are terrible company. Barnacles.", 'At the Teapot, moaning. Sailors on land are grumpy.'] },
        ] },
      // the bridge over the Cut is down and he blames the crabs (the who_cut herring)
      { if: 'flag c_squawk !solved who_cut !flag c_bridge',
        say: ['Crabs, I tell you. Admiral Pinch has hated that bridge for forty years.', 'Crabs did it. I am sure.'],
        re: [
          { t: ["The ropes were cut clean. Crabs aren't neat.", 'The ropes were cut clean.'], if: 'flag c_cut',
            say: ["Clean? Crabs can be neat when they want. ...Can they? I've never asked one.", "Crabs can be neat. Can't they?"] },
          { t: ['Admiral Pinch sits in a teacup now.', 'Pinch sits in a teacup.'], if: 'flag c_gull_done',
            say: ['In a TEACUP? Forty years I have been scared of that crab. Barnacles.', 'A teacup? I was scared of him for forty years!'] },
          { t: ['Who is Admiral Pinch?', 'Who is Admiral Pinch?'],
            say: ['A crab. A big one. Thinks he runs the lagoon. He has been at war with my bridge since I was a lad.', 'A big crab. He has hated my bridge for years.'] },
        ] },
      // his moment (the old chat): the chain is up and the first boats are out
      { if: 'flag c_clock_on', fact: 'c_harbor=open',
        say: ["The chain's up and the first boats are out! Quick one, dragon. What's the best thing about the sea?", 'The chain is up! Quick one. What is best about the sea?'],
        re: [
          { t: ['It brings people home.', 'It brings people home.'], tone: 'kind', f: 0.75, then: ['said mo_home'],
            say: ["Aye. That's the truth of it. Half this town is waiting on a boat.", 'Aye. Half this town waits for a boat.'] },
          { t: ['The big waves!', 'The big waves!'], tone: 'brave', f: 0.5,
            say: ['Ha! You would have liked my granny. She sailed into storms for fun.', 'Ha! My granny sailed into storms for fun.'] },
          { t: ['The fish. They live there for free.', 'Fish live there for free.'],
            say: ['Free rent! Never thought of it. Lucky little fish.', 'Free rent! Lucky fish.'] },
        ] },
      { if: 'flag c_bridge',
        say: ['Bridge is back up over the Cut. The crabs are still sulking about it.', 'The bridge is back. The crabs are sulking.'],
        re: [
          { t: ['It never was the crabs, you know.', 'It was not the crabs.'],
            say: ["So Squawk keeps telling the whole market. I've said sorry to Admiral Pinch. He didn't take it well.", 'I said sorry to Pinch. He did not like it.'] },
          { t: ['She tied a rope so nobody fell.', 'She tied a rope first.'],
            say: ["Did she now? Odd sort of thief. I'd hire her, if she'd stop stealing.", "Odd thief. I'd hire her."] },
        ] },
      { if: 'stage>=c_spire !flag c_snow', fact: 'c_lighthouse_lamp=lit',
        say: ['The lighthouse spins again! Ships in, ships out, all night long. Best harbor on the coast. Told you.', 'The lighthouse spins! Ships sail all night.'],
        re: [
          { t: ['I lit it with one breath.', 'I lit it with one breath.'],
            say: ["One breath? Agatha has been striking matches at that lamp since I was a boy. Don't tell her it was easy.", "One breath? Don't tell Agatha it was easy."] },
          { t: ['How far out will the ships go?', 'How far do ships go?'],
            say: ["Past the Far Pier, out where they say the moon goes into the water. Sailors' stories. Probably.", "Past the Far Pier. Where the moon goes in the sea. Probably."] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ['Snow on the masts, and ice in the rigging. In June! The gulls are walking on the water. Barnacles.', 'Snow and ice in June! The gulls walk on water.'],
        re: [
          { t: ['Will the harbor freeze?', 'Will it freeze?'],
            say: ['Not while I have breath to break it. And a big stick. Mostly the stick.', 'Not while I have a big stick.'] },
          { t: ["Will you wave your lantern tonight?", 'Will you wave your lantern?'], if: 'said mo_lantern',
            say: ['Every night. Snow or no snow. Somebody might be out there in it.', 'Every night. Someone might be out there.'] },
        ] },
      // topics (his old TALK about and deep)
      { ask: ['Do you know Dell? His boats sink.', 'Do you know Dell?'],
        say: ['Dell, up your river? Boats that sink? He would fit right in here. We have a whole harbor of sinking.', 'Boats that sink? He would fit right in here!'] },
      { ask: ['Is Jo really the fastest?', 'Is Jo the fastest?'],
        say: ["Fastest little skiff on the coast. Don't tell her I said so. She'll be impossible.", "Fastest on the coast. Don't tell her!"] },
      { ask: ['Why are you on the pier at night?', 'Why stand on the pier at night?'], if: 'stage>=c_light', then: ['said mo_lantern'],
        say: [['c_mo', 'My granny was harbormaster. Every night she stood on the Far Pier and waved a lantern at the dark, in case somebody was out there.', 'My granny waved a lantern at the sea every night.'],
          ['c_mo', 'I still do it. Barnacles, I do.', 'I still do it.']] },
      { idle: [['Barnacles. Go on, dragon.', 'Barnacles. Go on.'], ['*blows a bubble* Ask away.', '*blows a bubble* Ask away.']] },
      { bye: [['Fair winds, dragon!', 'Fair winds!'], ['Mind the ropes. They trip.', 'Mind the ropes.']] },
      { bark: true, say: ['*blows a bubble* Lovely day for it. For what? For it.', '*blows a bubble* Lovely day.'] },
      { bark: true, if: '!flag c_clock_on', fact: 'c_harbor=closed', say: ["Barnacles! The harbor chain's stuck again!", 'Barnacles! The chain is stuck!'] },
    ],

    // ---------------------------------------------------------------- Ingrid Anvilsong, the Bright Anvil
    // A big, cheerful smith from past the mountains who sings while she hammers and says "ja". She knows smiths' work:
    // she knows Maren's hammer marks on Ash's sword before she knows his name.
    c_ingrid: [
      { if: 'flag a1_bram', once: true,
        say: ["A Warden's hammer! Ja, I know that shape. Hold it up to the light for me. Ahh. Now that is iron.", "A Warden's hammer! Good iron. Ja!"] },
      { if: 'quest c_whip done !flag m0_bramble_open', promise: 'm0_bramble', ref: 'm0_bramble', option: ['Any jobs for my whip?', 'Jobs for my whip?'],
        say: ["Your mother writes there is a chain in a pond near your village. A rusty ring on the bank, the rest underwater. A whip could yank it. Ja!",
          'A chain lies in a pond up north. Yank it!'] },
      { if: 'quest c_whip done', once: true,
        say: ['How is my Chain Whip? Does it crack? Ja? I knew it would crack!', 'How is the whip? Does it crack? Ja!'] },
      // the first time: the sword on his back
      { say: ["Ja, stop there. That sword on your back. That is Maren of Emberhollow's work. I know her hammer marks.", "Stop! That sword is Maren's work. I know her marks."],
        re: [
          { t: ["She's my mom!", "She's my mom!"], tone: 'kind', f: 0.5, then: ['said ingrid_mom'],
            say: ['Your mother? Ja! Then I am Ingrid Anvilsong, and one day I will shake her hand. Gently. My hands are very strong.', 'Your mom? Ja! I am Ingrid. I will shake her hand.'] },
          { t: ['How can you tell from there?', 'How can you tell?'], then: ['said ingrid_mom'],
            say: ['Every smith hits a little different. She hits like she means it. Ja. Like me. You are her boy?', 'Every smith hits differently. She means it. Her boy?'] },
        ] },
      // Mom's letter (c_pb_4) told Ash to pass on a message about her braids
      { if: 'flag c_pb_4',
        say: ['Ash! Come, the forge is hot. What news from up the mountains? Ja?', 'Ash! The forge is hot. Any news?'],
        re: [
          { t: ['Mom says your braids are too long.', 'Mom says your braids are long.'],
            say: ['Too long for a forge? Ja. She is right. Twice I set them on fire. Tell her I tie them up now. Mostly.', 'Ja. She is right. I tie them up now. Mostly.'] },
          { t: ['Mom told the chickens about the clock.', 'Mom told the chickens.'],
            say: ['The chickens! Ja! That is a proud mother. Mine told the goats.', 'Ja! A proud mom. Mine told the goats.'] },
        ] },
      // her moment (the old chat): a smith's question
      { if: 'said ingrid_mom',
        say: ['Every smith has a hammer song. Mine is short. Hammer, hammer, ding. If you had one, what would yours be about?', 'Every smith has a song. What would yours be about?'],
        re: [
          { t: ["The people I'm making things for.", 'The people I make things for.'], tone: 'kind', f: 0.75,
            say: ['Ja. That is the best song. It gets a little longer every year.', 'Ja. The best song. It gets longer every year.'] },
          { t: ['Fire! A great big fire!', 'Big fire!'], tone: 'brave', f: 0.5,
            say: ['Fire! Ja! Hammer, hammer, whoosh! I like you.', 'Fire! Ja! Hammer, hammer, whoosh!'] },
          { t: ['Snacks.', 'Snacks.'],
            say: ['Snack, snack, ding. Snack, snack, dong. ...It is a short song. Like mine.', 'Snack, snack, ding. A short song.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ['Snow! Ja! Now it is like home. Where I was born the forges are cold half the year.', 'Snow! Like home. Our forges were cold.'],
        re: [
          { t: ['Is that why you came here?', 'Is that why you came?'],
            say: ['My father said, Ingrid, go where the fire is easy. Ja. Easy. Look at my arms. Nothing here is easy. It is wonderful.', 'Dad said go where fire is easy. Nothing is easy. Wonderful.'] },
          { t: ['Keep the forge hot for everyone.', 'Keep the forge hot.'], tone: 'kind', f: 0.5,
            say: ['Day and night. Half the Lower Town is warming its hands in my door. Ja. Good.', 'Day and night. Everyone warms up here. Ja.'] },
        ] },
      { ask: ['Do you make Hettie\'s parts?', 'Do you make Hettie\'s parts?'],
        say: ['She brings me broken robots. I fix them. They explode. She brings them back. It is a good friendship.', 'She brings robots. I fix them. They explode. Good friends!'] },
      { ask: ['What is star-iron?', 'What is star-iron?'],
        say: ['Iron that falls out of the sky, ja? Bring me a lump and I will put it in your blade. It sings after.', 'Iron from the sky. Bring it. Your blade will sing.'] },
      { idle: [['Ja? Speak up over the hammer.', 'Ja? Speak up.'], ['Hammer, hammer... ja? What?', 'Hammer, hammer... ja?']] },
      { bye: [['Ja! Go and break something, then bring it back.', 'Ja! Break something. Bring it back.'], ['Hammer, hammer, goodbye!', 'Hammer, hammer, bye!']] },
      { bark: true, say: ['Hammer, hammer, DING!'] },
    ],

    // ---------------------------------------------------------------- Auntie Fig, the Steaming Teapot
    // Warm, observant, "dearie" (only her). Girls together with Granny Oona. A girl who hummed the Moth Waltz once
    // washed her dishes.
    c_fig: [
      { if: 'quest c_gifts done', once: true,
        say: ['Penny told me who my old dishwasher is. I always knew. I just never said. Tea?', 'I always knew who she was. Tea?'] },
      { if: 'quest c_oona done', once: true,
        say: ["Oona's stove is lit, and it stays lit! She sent me a note. It's warm, she wrote, three times, and underlined it.", 'Oona\'s stove stays lit! She wrote "warm" three times.'] },
      // Ash told Lord Whirligig to be kinder (said whirligig_kinder)
      { if: 'said whirligig_kinder', once: true,
        say: ['Lord Whirligig left a tip today, dearie. First time in forty years. He said a dragon told him to be kinder. Then he went red and left.', 'Lord Whirligig left a tip! A dragon told him to be kind.'] },
      // early: a stranger with a sword, chasing something
      { if: 'stage<c_salt',
        say: ['Sit down, dearie, you look like you have been chasing something. Everybody calls me Auntie Fig, so you might as well.', 'Sit down, dearie. Call me Auntie Fig.'],
        re: [
          { t: ["I'm chasing the Moth Mask.", "I'm chasing the Moth Mask."],
            say: ['Everyone in this town says they hate the Moth Mask. Then they leave their windows open at night. Funny, that.', 'They say they hate her. Then leave windows open.'] },
          { t: ['Is the kettle always on?', 'Is the kettle always on?'],
            say: ['Forty years, and it has been off once. That was a bad week. Sit.', 'Forty years. Off once. Bad week. Sit.'] },
        ] },
      // he has been out to Saltmarsh and met Oona
      { if: 'seen slt_oona',
        say: ["You've been out to Oona's, haven't you? I can smell the fish on you.", "You went to Oona's. I smell the fish."],
        re: [
          { t: ['Her house is so cold.', 'Her house is so cold.'],
            say: ["It always has been. Seventy years I've known her, and I've never once seen that stove still going in the morning.", 'Seventy years, that stove never stayed lit.'] },
          { t: ['She says you were girls together.', 'You were girls together?'],
            say: ['We were. She was always cold and I was always making tea. We met in the middle.', 'She was cold. I made tea. We met in the middle.'] },
        ] },
      // her moment (the old chat): when he has been over the roofs and up a cliff after that girl
      { if: 'stage>=c_brass',
        say: ["Sit, dearie. Tell Auntie Fig. What's the bravest thing you ever did?", "Tell me. What's the bravest thing you ever did?"],
        re: [
          { t: ['Said sorry when I was wrong.', 'I said sorry.'], tone: 'kind', f: 0.75, then: ['said fig_sorry'],
            say: ['Oh, that is the bravest kind. Most people never manage it. Have a biscuit.', 'That is the bravest kind. Have a biscuit.'] },
          { t: ['Climbed a mountain to fight a dragon.', 'Fought a dragon on a mountain.'], tone: 'brave', f: 0.5,
            say: ['And came down again, by the look of you. Have a biscuit. Have two.', 'And came back down! Have two biscuits.'] },
          { t: ["Ate a biscuit that wasn't mine.", 'Ate a biscuit, not mine.'], if: 'flag c_biscuits=ate',
            say: ["One of Oona's? Those biscuits are older than you, dearie. That is brave.", "Oona's? They are older than you! Brave."] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["Snow in summer, dearie! I've had more customers today than all year. Everybody wants something hot.", 'Snow! Everyone wants hot tea today.'],
        re: [
          { t: ['Can I have something hot too?', 'Something hot for me?'],
            say: ["You? You're the one warm thing in this town already. Sit by the window and heat it for me.", "You're already warm! Sit by the window."] },
          { t: ['Is Granny Oona warm enough?', 'Is Granny Oona warm?'],
            say: ["I sent her a pot of tea in a basket, wrapped in a blanket. She'll say she didn't need it. She always does.", "I sent her tea. She'll say she didn't need it."] },
        ] },
      // topics (her old TALK about and deep)
      { ask: ['Why does everyone call you Auntie?', 'Why "Auntie"?'],
        say: [['c_fig', 'I never had children, dearie. I had customers. Hundreds of them. Every one came in cold and went out warm.', 'I had no kids. I had customers. They left warm.'],
          ['c_fig', 'After forty years they all started calling me Auntie, and I let them.', 'So they call me Auntie.']] },
      { ask: ['Do you know Tilly at the Sleepy Salmon?', 'Do you know Tilly?'],
        say: ["Tilly Crumb sends me soup recipes. Some of them are very nearly soup.", 'Tilly sends me soup recipes. Nearly soup.'] },
      { idle: [['More tea, dearie?', 'More tea, dearie?'], ["Kettle's on. Go on.", "Kettle's on. Go on."]] },
      { bye: [['Mind the step, dearie. It is wet.', 'Mind the step. It is wet.'], ["Come back cold. I'll fix it.", "Come back cold. I'll fix it."]] },
      { bark: true, say: ["Kettle's on, dearie. It's always on.", "Kettle's on, dearie."] },
    ],

    // ---------------------------------------------------------------- Penny Press, the Gearhaven Gazette
    // A kid reporter who is the whole Gazette since the press broke. Runs toward trouble. Her four headlines in the act
    // are in the scenes; here she just talks. She learns some stories are not for printing. A story lead in Act II.
    // (c_brass.js has her "Did you see her face?" first, the day the clock bongs.)
    c_penny: [
      { if: 'flag c_regatta_won', once: true,
        say: ['You won the regatta on foot, and Jo wants a recount. Of what? There was one dragon, and he came first.', 'You won on foot! Jo wants a recount.'] },
      // Ash said the Moth Mask might be lonely (said penny_lonely); then Penny saw her face
      { if: 'said penny_lonely flag c_clock_on', once: true,
        say: ['I saw her face over the roofs. She looked about my age. You said she might be lonely. I think you were right, and I hate it.', 'She looked my age. You said lonely. I think so too.'] },
      // in the first chapter, while he hunts for clues
      { if: 'stage=c_gear',
        say: ['You are still here! Good. A dragon kid in Gearhaven is the best story I have had all week, and I have had nine robberies.', 'A dragon kid! My best story all week.'],
        re: [
          { t: ['Am I going in the Gazette?', 'Am I in the paper?'],
            say: ["You're already on the board. Under Dragon, Small. I'll cross out Small if you do something big.", "You're on the board. Dragon, Small. Do something big."] },
          { t: ['Where does the Gazette get printed?', 'Where is it printed?'],
            say: ['It used to be printed on a press. The press broke. Now the Gazette is me, and I shout it on corners.', 'The press broke. Now I shout the news.'] },
          { t: ['Where does the Moth Mask live?', 'Where does she live?'],
            say: ["If I knew that, it'd be the biggest headline of my life. Nobody knows. That's the story.", "Nobody knows. That's the story!"] },
        ] },
      // her moment (the old chat): off the record, after he has chased the thief
      { if: 'flag c_chase !flag c_clock_on',
        say: ["Off the record. You chased her over the roofs. What's the Moth Mask really like?", 'Off the record. What is the Moth Mask really like?'],
        re: [
          { t: ['Lonely, maybe.', 'Lonely, maybe.'], tone: 'kind', f: 0.75, then: ['said penny_lonely'],
            say: ["...Huh. That's not a headline. That's a feeling. I'll think about it.", "Huh. That's a feeling, not a headline."] },
          { t: ['Fast. Faster than me, for now.', 'Fast. For now.'], tone: 'brave', f: 0.5,
            say: ['For now. Ooh. That is going on the board, word for word.', 'For now! That goes on the board.'] },
          { t: ['I caught her hand on the clock.', 'I caught her hand.'], if: 'flag c_chase=helped',
            say: ["You saved the Moth Mask? You caught her and let go? ...I can't print that. Nobody would believe me.", "You saved her? I can't print that!"] },
        ] },
      // after the music box: a scoop she will not print (when Posy kept it)
      { if: 'quest c_gifts done !flag c_gifts=taken',
        say: ["I've got a scoop I'm not printing. It's a strange feeling. Like holding in a sneeze.", "I have a scoop I won't print. Like holding a sneeze."],
        re: [
          { t: ["Posy's happy. That's a better story.", "Posy's happy. A better story."], tone: 'kind', f: 0.5,
            say: ["It IS a better story. That's the problem. Nobody shouts about happy.", 'It is better. But nobody shouts about happy.'] },
          { t: ['Print it when Posy is grown up.', 'Print it when Posy grows up.'],
            say: ["When Posy's grown and I've got a real press. Deal. I'm writing that down.", "When she's grown, and I have a press. Deal."] },
        ] },
      { if: 'quest c_gifts done flag c_gifts=taken',
        say: ["The box went back to the lord, and Posy cried, and it's all true. I don't think I want that story.", 'The box went back. Posy cried. I do not want that story.'],
        re: [
          { t: ['I could still buy it back.', 'I could buy it back.'],
            say: ['Could you? Lord Whirligig might sell. He likes coins more than boxes. Mostly.', 'Maybe! He likes coins more than boxes.'] },
          { t: ['It was his box, Penny.', 'It was his box.'],
            say: ["I know. Being right doesn't make it a good story. I'm learning that.", "I know. Right isn't always a good story."] },
        ] },
      // after the Spire: what happened to the Moth Mask
      { if: 'flag c_snow choice c_vesper=friend',
        say: ['Vesper Saltwhistle waved at me from a roof this morning. A real wave. Do you know how long I have chased her?', 'Vesper waved at me today! A real wave!'],
        re: [
          { t: ["She's my cousin, you know.", "She's my cousin."],
            say: ['Your cousin? Two Emberbloods on one coast, and I find out from a wave? I am a terrible reporter.', 'Your cousin? And I find out now? Terrible!'] },
          { t: ["She isn't a thief any more.", "She's not a thief now."],
            say: ["Not a thief. Just a girl who climbs. That's still a story. A quieter one.", 'Just a girl who climbs. A quiet story.'] },
        ] },
      { if: 'flag c_snow choice c_vesper=foe',
        say: ['The Moth Mask is gone. No more robberies, no more board. I took it down this morning. I should be glad.', 'The Moth Mask is gone. I took the board down.'],
        re: [
          { t: ['She gave me the piece of the Heart.', 'She gave me the piece.'],
            say: ["Then she isn't all bad. I knew that. I sort of always knew that.", 'Then she is not all bad. I knew it.'] },
          { t: ['I hope she is warm somewhere.', 'I hope she is warm.'], tone: 'kind', f: 0.5,
            say: ["Me too. That's the first thing I've ever wanted to print and couldn't find a word for.", 'Me too. I have no words for that.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["Snow in summer, and a bite out of the moon. Two front pages in one night. I always wanted that. I don't like it.", "Snow, and a bitten moon. Two big stories. I don't like it."],
        re: [
          { t: ["I'm going to find out who.", "I'll find out who."], tone: 'brave', f: 0.5,
            say: ["Then I'll be right here, waiting to print it. Send me a quote. A good one.", "I'll wait here to print it. Send a quote."] },
          { t: ['Something did it on purpose.', 'Someone did it on purpose.'],
            say: ['Who bites a moon on purpose? ...That is a real question. I am writing it on my hand.', 'Who bites a moon? I am writing that down.'] },
        ] },
      // topics (her old TALK about and deep)
      { ask: ["What happened to the Gazette's press?", 'What happened to the press?'],
        say: [['c_penny', 'My mom and dad ran it. It broke when I was eight, and the parts cost more than the shop.', 'My parents ran it. It broke when I was eight.'],
          ['c_penny', "So now I shout the news on corners, so nobody has to miss it. One day I'll buy a new one.", 'Now I shout the news. One day, a new press.']] },
      { ask: ['Did you ever race Skipper Jo?', 'Did you race Jo?'],
        say: ['Once. She won. Then she said I cheated, because I nearly won. Jo cannot lose nicely. Source: me.', 'Once. She won. She still said I cheated.'] },
      { idle: [["Go on. I'm writing.", "Go on. I'm writing."], ['Got a quote for me?', 'Got a quote?']] },
      { bye: [['Stay newsworthy!', 'Stay newsworthy!'], ['If anything happens, run toward it.', 'If something happens, run to it.']] },
      { bark: true, say: ['EXTRA! EXTRA! GULL STEALS CHIPS! AGAIN!', 'EXTRA! GULL STEALS CHIPS!'] },
      { bark: true, if: '!stage>=c_brass', say: ['EXTRA! MOTH MASK SEEN ON ROOFTOPS! DRAGON IN TOWN! THESE THINGS MAY BE CONNECTED!', 'EXTRA! MOTH MASK AND A DRAGON!'] },
    ],

    // ---------------------------------------------------------------- Madame Ravel, Ravel's Remarkable Rarities
    // An old sailor with a shop of things from every port and a story for each. Most stories are not quite true.
    c_ravel: [
      { if: 'stage>=c_salt !flag c_pg6', option: ['Got anything about Pearl?', 'Anything about Pearl?'],
        say: ["Pearl's lost page? On Gull Isle, under the gulls. A very honest gull told me. Fly off the cliff updraft and look.",
          "Pearl's page is on Gull Isle. Fly from the cliff!"] },
      { if: '!flag c_snow',
        say: ["Welcome to Ravel's Remarkable Rarities! Everything is remarkable. Some of it is rare.", 'Welcome to my shop! Everything is special.'],
        re: [
          { t: ['What is the most remarkable thing?', 'What is the best thing?'],
            say: ['This draught. Brewed by a mermaid. A man named Merv, anyway. Close enough.', 'This draught, made by a mermaid. Well, Merv.'] },
          { t: ['Is any of it real?', 'Is any of it real?'],
            say: ['All of it is real. Some of it is even what I say it is.', 'It is all real. Some is what I say.'] },
        ] },
      // her moment (the old chat), turned round: she asks him
      { if: 'stage>=c_salt',
        say: ['Tell me, dragon. You have been all over my coast now. What is the most remarkable thing you own?', 'Tell me. What is the best thing you own?'],
        re: [
          { t: ["My mom's hugs. Not for sale.", "Mom's hugs. Not for sale."], tone: 'kind', f: 0.75,
            say: ['Ah. The one thing I can never stock. Lucky dragon.', 'The one thing I can never sell. Lucky you.'] },
          { t: ["My sword. It's beaten a mountain.", 'My sword. It beat a mountain.'], tone: 'brave', f: 0.5,
            say: ['A mountain-beating sword! Four coins. No? Five. No? Fine.', 'Four coins! No? Five? Fine.'] },
          { t: ['This pebble. It looks like a frog.', 'A pebble like a frog.'],
            say: ['It does look like a frog. Two coins. No? Keep the frog.', 'It IS a frog! Keep it.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ['Snow in June! I am selling it. Genuine summer snow, two coins a jar. It melts. That is what makes it rare.', 'Summer snow, two coins a jar! It melts.'],
        re: [
          { t: ["That's just water in a jar.", 'That is just water.'],
            say: ['Today it is snow. Tomorrow it is history. History costs more.', 'Today, snow. Tomorrow, history. That costs more.'] },
          { t: ['Did you ever sail in snow?', 'Did you sail in snow?'],
            say: ['Once, far up the cold coast. The sails froze stiff as boards. I traded the ice for a hat.', 'Once. The sails froze. I traded ice for a hat.'] },
        ] },
      { ask: ['Were you really a sailor?', 'Were you a sailor?'],
        say: ['I was. I brought one thing back from every port. Then I ran out of ship and opened a shop. The hat came from the moon. Probably.', 'I was. One thing from every port. The hat is from the moon.'] },
      { ask: ['What did you sell Lord Whirligig?', 'What did you sell the lord?'],
        say: ['A genuine mermaid comb. He says it is a fork. He keeps it on his mantelpiece anyway.', 'A mermaid comb. He says it is a fork.'] },
      { idle: [['Something caught your eye?', 'See something?'], ['Browse, dragon. Browsing is free. Mostly.', 'Browsing is free. Mostly.']] },
      { bye: [['Come back remarkable!', 'Come back remarkable!']] },
      { bark: true, say: ['Remarkable rarities! Rarely remarkable! I mean the other way round!', 'Remarkable things for sale!'] },
    ],

    // ---------------------------------------------------------------- Skipper Jo, the boat shed
    // A sailor kid who calls Ash "lizard" and cannot lose. Her mom sailed out with the fleet; she races so she isn't
    // just waiting.
    c_jo: [
      { if: 'flag c_regatta_won', once: true,
        say: ["I'm training. Next year I'm beating you. On feet. I'm practicing skipping. I keep falling in.", 'Next year I beat you. I keep falling in.'] },
      { if: '!flag c_clock_on', fact: 'c_harbor=closed',
        say: ["Ahoy, lizard! Skipper Jo, fastest skiff on the coast. Chain's stuck, so I'm fast nowhere.", "Ahoy, lizard! I'm Skipper Jo. The chain is stuck."],
        re: [
          { t: ["I'm a dragon, not a lizard.", "I'm a dragon."],
            say: ['Dragon, lizard. Both of you sink.', 'Dragon, lizard. You both sink.'] },
          { t: ["What's your boat called?", 'What is your boat called?'],
            say: ["The Sea Biscuit. Not to be confused with the Soggy Biscuit. Totally different biscuit.", 'The Sea Biscuit. Not the Soggy Biscuit!'] },
        ] },
      // her moment (the old chat): the night the light comes back and the fleet can find its way home
      { if: 'stage>=c_spire', fact: 'c_lighthouse_lamp=lit',
        say: ["The light's on, so the fleet can find its way home now. My mom's out there with them. ...Are you scared of the sea?", "The light is on. My mom is out there. Are you scared of the sea?"],
        re: [
          { t: ['A little. Is that okay?', 'A little. Okay?'], tone: 'kind', f: 0.75,
            say: ["...Yeah. Everyone is. Even me. Don't tell anyone.", "Yeah. Me too. Don't tell."] },
          { t: ['Nope. Bring on the waves!', 'Nope! Waves!'], tone: 'brave', f: 0.5,
            say: ["Ha! You'll make a sailor yet, lizard.", "Ha! You'll be a sailor yet."] },
          { t: ['Only the wet bits.', 'Only the wet bits.'],
            say: ["It's all wet bits! ...Okay. That's funny.", "It's ALL wet bits! Okay, funny."] },
        ] },
      { if: 'flag c_clock_on',
        say: ["Chain's up! Harbor's open! I've been round the buoys eleven times and nobody's racing me.", 'The harbor is open! Nobody will race me.'],
        re: [
          { t: ["Maybe they're scared of losing.", 'Maybe they fear losing.'],
            say: ['Course they are. Everyone loses to the Sea Biscuit. It is the rules.', 'They should be. Everyone loses to me.'] },
          { t: ['Did you ever hit that seal again?', 'Did you hit the seal again?'],
            say: ['Once. He was fine. He gave me a look. Seals have very judging faces.', 'Once. He was fine. He gave me a look.'] },
        ] },
      { ask: ['Who taught you to sail?', 'Who taught you to sail?'],
        say: ['Mo taught me knots. I taught him to lose at cards. Fair trade.', 'Mo taught me knots. I beat him at cards.'] },
      { ask: ['Where is the fleet?', 'Where is the fleet?'],
        say: ["My mom sailed out with the fleet last spring, with Posy's dad and the rest. Back by autumn. I race so I'm not just waiting.", 'Mom sailed with the fleet. I race so I am not just waiting.'] },
      { idle: [['Ahoy. What?', 'Ahoy. What?'], ['Still got feet? Shame.', 'Still got feet? Shame.']] },
      { bye: [["Race you to the pier! ...Oh. Feet. Right.", 'Race you! Oh. Feet.'], ['Fair winds, lizard.', 'Fair winds, lizard.']] },
      { bark: true, say: ['Race you to the pier! ...Oh, right. Feet.', 'Race you! Oh. Feet.'] },
    ],

    // ================================================================ Saltmarsh
    // ---------------------------------------------------------------- Tide Warden Mina Mudge, the Tide Clock
    // Gentle and a bit nervous, says sorry, talks to the sea like a forgetful old friend. (c_salt.js has her Tide House
    // hint first, while the tide is stuck.)
    c_mina: [
      { if: 'flag c_lowtide', once: true, fact: 'c_tide_clock=low',
        say: ["Low tide! Look at all that sand. I'd forgotten what the bottom of the lagoon looked like. Thank you, dragon!", 'Low tide! Look at all that sand! Thank you!'] },
      { if: 'flag c_lowtide !flag c_snow', fact: 'c_tide_clock=low',
        say: ['At low tide you can walk all the way out to Gullcrag. Nobody does, because of the gulls. There are so many gulls.', 'At low tide you can walk to Gullcrag.'],
        re: [
          { t: ["I'm going out to Gullcrag.", "I'm going to Gullcrag."],
            say: ['Then take your boots off and mind the sand. It sucks. And the gulls bite.', 'Mind the sand. It sucks. The gulls bite.'] },
          { t: ['How did kelp get in your clock?', 'How did kelp get in?'],
            say: ["It came on the wind that night. A whole clump, silver all over. I've never known the wind carry kelp uphill.", 'The wind brought it that night. Silver. Uphill!'] },
        ] },
      // her moment (the old chat): the sea is going in and out again and she can breathe
      { if: 'flag c_lowtide',
        say: ['Sorry. Can I ask you something? Do you like the sea, or does it make you nervous?', 'Sorry. Do you like the sea, or is it scary?'],
        re: [
          { t: ['Both. Is that okay?', 'Both. Is that okay?'], tone: 'kind', f: 0.75,
            say: ['That is the right answer. The sea is both. ...Thank you.', 'The right answer. The sea is both.'] },
          { t: ["I love it. It's huge!", 'I love it! It is huge!'], tone: 'brave', f: 0.5,
            say: ['It is huge. And moody. Look at it now, sulking about being let out.', 'It is huge. And moody today.'] },
          { t: ["It's a lake that forgot to stop.", 'A lake that forgot to stop.'],
            say: ["A lake that... ha! I'm telling the Tide Clock that one.", "Ha! I'll tell the Tide Clock that!"] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["Snow on the lagoon. The sea has never been this confused. Neither have I.", 'Snow on the lagoon. The sea is confused. So am I.'],
        re: [
          { t: ['Will the tide still come and go?', 'Will the tide still work?'],
            say: ["In and out, snow or no snow. I've told her firmly.", 'In and out. I told her firmly.'] },
          { t: ['Is the Tide Clock warm enough?', 'Is the clock warm?'],
            say: ["I've knitted it a scarf. Granny Oona showed me how. It looks silly. It's helping.", 'I knitted it a scarf. It looks silly. It helps.'] },
        ] },
      { ask: ['Was your family always Tide Wardens?', 'Was your family Tide Wardens?'],
        say: ['My granddad was Tide Warden. One night he forgot to set the clock, and the sea came up to the doorsteps. Nobody was hurt. He never forgot again. Neither will I.',
          'Granddad forgot once. The sea came in. I never forget.'] },
      { ask: ['Do you know Captain Hester?', 'Do you know Captain Hester?'], if: 'flag c_hester',
        say: ['Captain Ticklebrass came down once to ask why the tide was late. She timed it, I measured it, and we both told the sea off. Lovely afternoon.', 'The Captain and I told the sea off. Lovely day.'] },
      { idle: [['Mind the edge. What is it?', 'Mind the edge. What?'], ["Sorry. Go on. I'm listening.", "Sorry. I'm listening."]] },
      { bye: [['Mind the wet boards!', 'Mind the wet boards!'], ['Out you go, then. Like the tide.', 'Out you go. Like the tide.']] },
      { bark: true, say: ["That's it, sea. Out you go. Good sea.", 'Out you go, sea. Good sea.'] },
      { bark: true, if: '!flag c_lowtide', fact: 'c_tide_clock=high', say: ['Still high. Go OUT, sea. Please?', 'Still high. Go OUT, sea!'] },
    ],

    // ---------------------------------------------------------------- Chowder Charlie, the Chowder Pot
    // A cook who brings everything back to chowder. Never forgets a smell. Writes to Cookie of Coppergulch, his best enemy.
    // (c_salt.js has his line about the note first, until the Brassworks chapter.)
    c_charlie: [
      { if: 'quest c_whip done', once: true,
        say: ['A ghost ate my chowder and said it was worth forty years. Best review I ever had.', 'A ghost loved my chowder!'] },
      { if: 'quest c_whip active !flag c_saltbeard_won item c_chowder', say: ["Don't you dare taste it.", "Don't taste it!"] },
      { if: '!quest c_whip done',
        say: ["A dragon! Sit, sit. You're all horns and no lunch. Chowder?", "Sit! You're all horns, no lunch. Chowder?"],
        re: [
          { t: ['What is chowder, exactly?', 'What is chowder?'],
            say: ["Soup that's been hugged. Fish, milk, potatoes, and somebody who cares.", "Hugged soup. Fish, milk, potatoes. And care."] },
          { t: ['Can you smell where I have been?', 'Can you smell where I was?'],
            say: ['Sea salt, brass, and a library. And, oh, somebody else\'s chowder. Cheek.', "Salt, brass, books. And someone else's chowder!"] },
        ] },
      // his moment (the old chat): the argument he has been having with Cookie by post for years
      { if: 'stage>=c_brass',
        say: ['Settle a fight for me. Cookie up in Coppergulch writes that chowder wants rocks in it. Rocks! Shells or no shells?', 'Settle a fight. Chowder: shells or no shells?'],
        re: [
          { t: ['However the eater likes it.', 'How the eater likes it.'], tone: 'kind', f: 0.5,
            say: ['A diplomat! Fine. With shells. Yours without.', 'Fine! Shells. Yours without.'] },
          { t: ['With shells! More crunch!', 'Shells! More crunch!'], tone: 'brave', f: 0.75,
            say: ['Yes! Crunch! I am writing to Cookie tonight. A dragon agrees with me.', 'Yes! I will tell Cookie a dragon agrees.'] },
          { t: ['With rocks.', 'With rocks.'],
            say: ["Don't you dare. ...You've been talking to Cookie.", "Don't you dare! You talked to Cookie."] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["Snow in Saltmarsh! Everyone wants chowder. I've made so much the pot needs a pot.", 'Snow! Everyone wants chowder. So much chowder.'],
        re: [
          { t: ['Can I help stir?', 'Can I help stir?'],
            say: ['With a dragon under it? The pot will boil in a breath. Stand there. Breathe gently.', 'Stand by the pot. Breathe gently.'] },
          { t: ['Save some for Granny Oona.', 'Save some for Gran.'], tone: 'kind', f: 0.5,
            say: ['Already in a jug by the door. She says she hates fish. She has never once sent a jug back.', 'It is by the door. She always eats it.'] },
        ] },
      { ask: ['Do you really write to Cookie?', 'Do you write to Cookie?'],
        say: ["Every month. She's wrong about everything. She's my best enemy.", "Every month. She's wrong. My best enemy."] },
      { ask: ['Who taught you to cook?', 'Who taught you to cook?'],
        say: ['My mom. She made chowder for the whole village every winter, in a pot so big I could sit in it. I did, once. She was not pleased. The chowder was.', 'My mom. Her pot was so big I sat in it once.'] },
      { ask: ['Is Old Tarbuckle a good customer?', 'Is Tarbuckle a good customer?'],
        say: ['He eats my chowder every night and says it was better in his day. It was not. I was not born.', 'Every night. He says it was better in his day.'] },
      { idle: [['Hungry? You look hungry.', 'Hungry? You look hungry.'], ["Pot's on. What is it?", "Pot's on. What?"]] },
      { bye: [['Take a bowl for the road. No? Next time.', 'Take a bowl. No? Next time.'], ['Go on. Mind the boardwalk.', 'Mind the boardwalk.']] },
      { bark: true, say: ['Chowder! Get your chowder! Hugged soup!', 'Chowder! Hugged soup!'] },
    ],

    // ---------------------------------------------------------------- Dory Cockle, Cockle Cottage
    // A fisher and net-mender. Short, tired, dry sentences. Posy's mom; Posy's dad sailed out with the fleet.
    c_dory: [
      { if: { any: ['flag c_gifts=kept', 'flag c_gifts=truth', 'flag c_gifts=bought'] }, once: true,
        say: ['Posy sleeps all night now. So do I. First time since the fleet went out. Thank you.', 'Posy sleeps now. Thank you.'] },
      // Ash told Posy being scared is okay (said posy_scared)
      { if: 'said posy_scared', once: true,
        say: ['Posy says a dragon told her being scared is okay. She sleeps with the window shut now. She says the moths can knock.', 'Posy says you said scared is okay. She sleeps fine.'] },
      { if: '!flag c_gifts',
        say: ['Mind the nets. Mind the hooks. And mind Posy. She bites.', 'Mind the nets. And Posy. She bites.'],
        re: [
          { t: ['Does she really bite?', 'Does she really bite?'],
            say: ['Once. A crab. It started it.', 'Once. A crab started it.'] },
          { t: ['Can I help with the nets?', 'Can I help with the nets?'], tone: 'kind', f: 0.5,
            say: ['With claws? You would tear them. Kind of you, though.', 'With claws? You would tear them. Kind, though.'] },
        ] },
      // pointing him at Granny Oona's cold house, before her stove is lit
      { if: 'seen slt_oona !quest c_oona done',
        say: ["Granny Oona's been cold for seventy years. Someone ought to do something. Someone with fire.", 'Granny Oona is always cold. Help her?'],
        re: [
          { t: ["I've got fire.", "I've got fire."], tone: 'brave', f: 0.25,
            say: ['I noticed. You steam when it rains.', 'I noticed. You steam in the rain.'] },
          { t: ['Why does her stove go out?', 'Why does her fire go out?'],
            say: ["No fire stays lit in that house. Never has. The Saltwhistles just wear more cardigans.", 'No fire stays lit there. They wear cardigans.'] },
        ] },
      // her moment (the old chat): the question Posy keeps asking her
      { if: 'stage>=c_claws',
        say: ['Posy asked me why the sea takes people. What do I tell her?', 'Posy asks why the sea takes people. What do I say?'],
        re: [
          { t: ['That it brings people home too.', 'It brings people home too.'], tone: 'kind', f: 0.75,
            say: ['...It does. Sometimes. I will tell her that.', 'It does. Sometimes. I will tell her.'] },
          { t: ['Mo says it brings people home.', 'Mo says it brings them home.'], if: 'said mo_home', tone: 'kind', f: 0.5,
            say: ['Mo would know. He waves his lantern for them every night. I will tell her Mo said so.', 'Mo would know. I will tell her.'] },
          { t: ['That someone always goes and looks.', 'Someone always goes to look.'],
            say: ['Someone always does. Maybe you. Maybe her, one day.', 'Someone always does. Maybe her, one day.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["Snow. On the nets. Posy's never seen it. She's trying to keep some in a jar for her dad.", 'Snow on the nets. Posy is saving some for her dad.'],
        re: [
          { t: ['It will melt, though.', 'It will melt.'],
            say: ['I know. She knows. She keeps it on the step anyway.', 'We know. She keeps it on the step anyway.'] },
          { t: ["He'll like that she tried.", "He'll like that she tried."], tone: 'kind', f: 0.5,
            say: ['He will. He likes trying. That is why he went.', 'He will. He likes trying.'] },
        ] },
      { ask: ["Where is Posy's dad?", "Where is Posy's dad?"],
        say: ["Sailed out with the fleet last spring. I mend his net every night. Nobody's using it. I mend it anyway.", 'At sea with the fleet. I mend his net every night.'] },
      { idle: [['Mm. Yes?', 'Mm. Yes?'], ['Mind the nets. What is it?', 'Mind the nets. What?']] },
      { bye: [['Mind the hooks on your way.', 'Mind the hooks.']] },
      { bark: true, say: ['Mind the nets.'] },
    ],

    // ---------------------------------------------------------------- Granny Oona Saltwhistle, the stilt house
    // Seventy years cold and unbothered. "Duck" is hers. Short homely sentences. She has said the family saying once on the
    // main path (slt_oona) and does not repeat it here. Vesper's gran, and the one adult who has lived the theme.
    // (c_brass.js has her biscuit lines first; the quest's offer is q_oona.js.)
    c_oona: [
      { if: 'quest c_oona done', once: true,
        say: ["The stove's been going all week, and not once out by morning. My Vesper sat by it a whole evening and never once looked at the door.", 'The stove never goes out! Vesper sat by it all evening.'] },
      { if: 'flag dr_c_twins', once: true, option: ['I dreamed about baby Pearl. She climbed the curtains.', 'I dreamed baby Pearl climbed the curtains.'],
        say: ["Up the curtains, the day she was born! Oh, duck. That's our family story. Nobody outside this house knows that one.",
          "Up the curtains! That's our family story!"] },
      { if: 'stage>=c_salt !clue q_lookout', promise: 'm0_lookout', ref: 'm0_lookout', option: ['Did Vesper ever camp near Emberhollow?', 'Did Vesper camp near home?'],
        say: ['Once, before your Lantern Night. She camped by the old pass. She said there is a tall rock there where you can see a whole valley of lanterns.',
          'She sat on a tall rock by the old pass.'] },
      // after the Spire, if Vesper came home (and what Ash said earlier comes home with her)
      { if: 'flag c_snow said fig_sorry choice c_vesper=friend', once: true,
        say: ["Fig says you told her saying sorry is the bravest thing. My Vesper said sorry to me last night. First time in her life. I made her say it twice.",
          'Vesper said sorry to me last night. First time ever.'] },
      { if: 'flag c_snow said oona_fish choice c_vesper=friend', once: true,
        say: ["I told Vesper I don't like fish. Seventy years of fish on my step, and she laughed till she cried. Now she brings me biscuits.",
          "I told Vesper I hate fish. She laughed. Now she brings biscuits."] },
      { if: 'flag c_snow said oona_people choice c_vesper=friend', once: true,
        say: ["I told Vesper what you said makes you warm. She said that's just a thing people say to cold people. Then she sat with me all evening.",
          'I told Vesper your answer. She said it is just a saying. Then she sat with me.'] },
      // before the chapter brings him here (the visit itself is the chapter's scene, slt_oona)
      { if: '!seen slt_oona',
        say: ['Come in, duck, come in. Shut the door behind you. Not that it helps.', 'Come in, duck. Shut the door.'],
        re: [
          { t: ['Are you Oona Saltwhistle?', 'Are you Oona Saltwhistle?'],
            say: ["I am, duck. Have been for seventy years. Nobody's asked in a while.", "I am, duck. Nobody's asked in a while."] },
          { t: ["It's colder in here than outside.", "It's colder in here!"],
            say: ["It always is. Sit by the stove. Don't expect much from it.", "It always is. Don't expect much from the stove."] },
        ] },
      // after the chapter's visit, before her stove is lit
      { if: 'seen slt_oona !quest c_oona done',
        say: ['Did you eat that fish, duck? Somebody ought to.', 'Did you eat that fish, duck?'],
        re: [
          { t: ['I gave it to Pip.', 'I gave it to Pip.'], if: 'flag pip',
            say: ["Good. Somebody's eating them. Pip's welcome to the lot.", "Good. Pip can have them all."] },
          { t: ['Vesper brings you one every night?', 'Vesper brings one every night?'],
            say: ["Every night, on the step, and off she runs. She thinks I don't know it's her. I know.", "Every night. She thinks I don't know. I know."] },
          { t: ["You don't like fish, do you?", "You don't like fish?"], then: ['said oona_fish'],
            say: ["Can't stand it, duck. Don't you tell her.", "I hate it, duck. Don't tell her."] },
        ] },
      { if: 'quest c_oona active !flag c_oona_nest !power claws',
        say: ["That roof's too steep for feet, duck. You'd want claws. Pearl's sort.", 'You need claws for that roof.'] },
      { if: 'quest c_oona active !flag c_oona_nest power claws',
        say: ["The gull's still up there, glaring. He glared at Charlie once until Charlie dropped his ladle.", 'The gull is still up there. Glaring.'] },
      { if: 'quest c_oona active flag c_oona_nest !flag c_oona_lit',
        say: ["Breathe on it gently, duck. Gently. I'm fond of my eyebrows.", 'Breathe on the stove. Gently!'] },
      // her stove is lit
      { if: 'quest c_oona done',
        say: ['Come in, duck. Shut the door. Not because of the cold. Because of the gulls.', 'Come in, duck. Mind the gulls.'],
        re: [
          { t: ['Is the stove still going?', 'Is the stove still going?'],
            say: ["Every morning. I keep getting up in the night to check. It's never once gone out.", 'Every morning. I check at night. It never goes out.'] },
          { t: ['How many cardigans today?', 'How many cardigans today?'],
            say: ["Two, instead of five. I don't know what to do with my arms.", "Two, not five. I don't know what to do with my arms."] },
          { t: ['Vesper left me a thank-you note.', 'Vesper left me a note.'], if: 'flag c_oona_note',
            say: ["Did she? She's never thanked anybody in her life. You must have done something right, duck.", "She never thanks anyone. You did something right."] },
        ] },
      // her moment (the old chat), by the lit stove
      { if: 'quest c_oona done',
        say: ["Tell an old woman something, duck. You're warm all the way through. What makes you warm?", 'Tell me, duck. What makes you warm?'],
        re: [
          { t: ['People. Being with people.', 'Being with people.'], tone: 'kind', f: 0.75, then: ['said oona_people'],
            say: ["That's Pearl's answer, that is. Come here, duck.", "That's Pearl's answer. Come here, duck."] },
          { t: ["My fire. It's always on.", "My fire. It's always on."], tone: 'brave', f: 0.5,
            say: ["Lucky duck. Don't you ever let it go out.", "Lucky duck. Don't let it go out."] },
          { t: ['Socks. Two pairs.', 'Two pairs of socks.'],
            say: ["Two! I wear three and I'm still cold. Was cold. Funny old world.", 'I wear three! Well, I used to.'] },
        ] },
      // after the Spire
      { if: 'flag c_snow choice c_vesper=friend',
        say: ['My Vesper came home through the snow and sat down. Sat down, duck. In a chair. For an hour.', 'Vesper came home and sat down. In a chair. An hour!'],
        re: [
          { t: ['She told me about the Lady.', 'She told me about the Lady.'],
            say: ["She told me too. A voice in her dreams, promising me fire. I'd have told her I didn't want it, if she'd asked.", "She told me. I didn't want fire. She never asked."] },
          { t: ['Did she wear the scarf?', 'Did she wear the scarf?'], if: '!item c_scarf',
            say: ["No. It's on her bed. She sleeps with it. Don't tell her I told you.", "No. She sleeps with it. Don't tell her."] },
          { t: ["I'm wearing her scarf, Granny Oona.", "I'm wearing her scarf."], if: 'item c_scarf',
            say: ["So you are. She saw it on you and went quiet. I think she wants it back. She'll never ask.", 'So you are. She wants it back. She won\'t ask.'] },
        ] },
      { if: 'flag c_snow choice c_vesper=foe',
        say: ["She's not come home. The fish still come, every night. So she's alive, and she's cross, and she's near.", "She's not home. The fish still come. She's near."],
        re: [
          { t: ["I'm sorry, Granny Oona.", "I'm sorry, Granny Oona."], tone: 'kind', f: 0.5,
            say: ["Not your fault, duck. She's a Saltwhistle. We climb off when we're ashamed. She'll climb back.", "Not your fault. She'll climb back."] },
          { t: ["I'll go and find her.", "I'll find her."],
            say: ["Don't chase her. Leave a window open. That's how you catch a Saltwhistle.", "Don't chase her. Leave a window open."] },
        ] },
      { if: 'flag c_snow',
        say: ['Snow, duck. On the boardwalk. Never in my life.', 'Snow, duck. Never in my life.'],
        re: [
          { t: ['Is your stove keeping you warm?', 'Is your stove warm?'], if: 'quest c_oona done',
            say: ["The first warm winter of my life, and it's June. Funny old world.", 'My first warm winter. In June!'] },
          { t: ['Shall I light your stove again?', 'Shall I light your stove?'], if: '!quest c_oona done',
            say: ["You can try, duck. It'll be out by morning. They always are, here.", "You can try. It'll be out by morning."] },
          { t: ['Where do you think it came from?', 'Where did it come from?'],
            say: ['Over the mountains. The wind smells of nothing. Proper cold smells of nothing.', 'Over the mountains. Real cold smells of nothing.'] },
        ] },
      // topics (her old TALK about and deep)
      { ask: ['Do you know Auntie Fig?', 'Do you know Auntie Fig?'],
        say: ["Fig and I were girls together. Seventy years, and she's never once let my cup go cold.", 'We were girls together. She never lets my tea go cold.'] },
      { ask: ["What happened to Vesper's mom and dad?", "Where are Vesper's mom and dad?"], if: 'seen slt_oona',
        say: [['c_oona', "They sailed a boat called the Moth. One night it didn't come home. Vesper was five.", "Their boat, the Moth, didn't come home. She was five."],
          ['c_oona', "She stopped crying after a week, and she started climbing. She hasn't stopped since.", 'She stopped crying and started climbing.']],
        re: [
          { t: ['Is that why she climbs so high?', 'Is that why she climbs?'],
            say: ["Up high you can see a long way out to sea. I've never asked her what she's looking for.", "Up high you see far out to sea. I never asked why."] },
          { t: ["I'm sorry. That's so sad.", "I'm sorry. That's sad."], tone: 'kind', f: 0.5,
            say: ['So it is, duck. Every day. Now hush, and take a biscuit.', 'It is, duck. Now hush. Take a biscuit.'] },
        ] },
      { idle: [['Shut the door, duck. Go on.', 'Shut the door, duck.'], ['Sit, duck. What is it?', 'Sit, duck. What is it?']] },
      { bye: [['Mind the gulls, duck.', 'Mind the gulls, duck.'], ['Take a fish on your way.', 'Take a fish on your way.']] },
      { bark: true, if: '!quest c_oona done', say: ['Brrr. Shut the door, duck.', 'Brrr. Shut the door.'] },
      { bark: true, if: 'quest c_oona done', say: ['Mmm. Toasty. Shut the door anyway, duck.', 'Toasty. Shut the door!'] },
    ],

    // ---------------------------------------------------------------- Old Tarbuckle, the jetty
    // A retired sea captain who makes everything bigger ("In my day..."). Under the stories: he once turned his ship
    // round at the edge of the world, and calls it the bravest thing he did.
    c_tarbuckle: [
      { if: 'quest c_whip done', once: true,
        say: ["The Rockpools are quiet at night now. No clanking. I miss it, a bit. Don't tell him.", 'No more clanking. I miss it a bit.'] },
      { if: '!quest c_whip done',
        say: ["In my day dragons were twice the size. You'll do, though. Captain Elias Tarbuckle. Old Tarbuckle, they all say. Sit.", 'In my day dragons were bigger. I am Old Tarbuckle. Sit.'],
        re: [
          { t: ['Twice the size? Really?', 'Twice the size?'],
            say: ['Bigger! Ate whales for breakfast. Two whales. Probably.', 'Bigger! They ate whales. Probably.'] },
          { t: ['Were you a real sea captain?', 'Were you a real captain?'],
            say: ["Forty years at sea, lad. I've the knees to prove it. Listen. They creak like a deck.", 'Forty years at sea. My knees creak like a deck.'] },
        ] },
      // his moment (the old chat): the question he asked every new hand on his ship
      { if: 'stage>=c_claws',
        say: ["In my day, nobody boarded my ship without answering me one question. What's the best part of a voyage?", "Answer me this, to board my ship. What is the best part of a trip?"],
        re: [
          { t: ['Coming home.', 'Coming home.'], tone: 'kind', f: 0.75, then: ['said tarbuckle_home'],
            say: ['Aye. Aye, it is. You can board.', 'Aye, it is. You can board.'] },
          { t: ['The storm in the middle!', 'The storm!'], tone: 'brave', f: 0.75,
            say: ['Ha! A storm sailor! You can board and steer.', 'Ha! You can board and steer!'] },
          { t: ['The snacks.', 'Snacks.'],
            say: ['In my day we had no snacks. You can board. Bring snacks.', 'No snacks in my day. Bring some.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["In my day it snowed every summer. ...No, it didn't. I've never seen this. Not once, in eighty years.", "In my day it snowed in summer. No it didn't. Never."],
        re: [
          { t: ['You told the truth!', 'You told the truth!'],
            say: ["Don't get used to it. It's the cold. It's got into my stories.", "It's the cold. It got into my stories."] },
          { t: ['Have you ever been that far up?', 'Have you been up there?'],
            say: ['Once, lad, to where the sea goes white and hard. I walked back. The ship sulked for a year.', 'Once. The sea went white and hard.'] },
        ] },
      // topics (his old TALK about and deep)
      { ask: ['What was the farthest you ever sailed?', 'How far did you sail?'], if: 'stage>=c_claws',
        say: [['c_tarbuckle', 'To the edge of the world, lad. Far out, the sea goes flat as glass and the moon hangs too big, like it might fall in.', 'To the edge of the world. The moon looked too big.'],
          ['c_tarbuckle', 'I turned the ship round. Bravest thing I ever did, turning round.', 'I turned round. Bravest thing I ever did.']],
        re: [
          { t: ['Why was turning round brave?', 'Why was that brave?'],
            say: ['Everyone on board wanted to see past it. Somebody had to bring them home.', 'Everyone wanted to go on. Someone had to bring them home.'] },
          { t: ['Like you said. Coming home.', 'Coming home. Like you said.'], if: 'said tarbuckle_home',
            say: ['You listen, you do. In my day nobody listened. ...Aye. Like I said.', 'You listen! Aye. Like I said.'] },
        ] },
      { ask: ['Did you know Captain Saltbeard?', 'Did you know Saltbeard?'], if: '!quest c_whip done',
        say: ['Sailed with him. Then against him. Then into him. He cheated at cards, and he still owes me a sock.', 'He cheated at cards. He owes me a sock.'] },
      { ask: ["Is Charlie's chowder any good?", "Is Charlie's chowder good?"],
        say: ["Not as good as his grandpa's. His grandpa's woke the dead. ...And that's why I don't eat eels.", "His grandpa's woke the dead. That's why I don't eat eels."] },
      { idle: [["Sit, lad. What's the matter?", "Sit, lad. What is it?"], ['In my day folk said what they wanted. Go on.', 'Go on. Say it.']] },
      { bye: [['Fair winds, lad. Mind the planks.', 'Fair winds. Mind the planks.'], ['Off you go. Mind the eels.', 'Off you go. Mind the eels.']] },
      { if: '!quest c_whip done', bark: true,
        say: ['At low tide, on dark nights, you can hear a chain on the Rockpools. Clank. Clank. Hungry, I\'d say.', 'At night a chain clanks. Clank.'] },
      { bark: true, say: ['In my day the gulls were the size of cows. Nicer, though.', 'In my day gulls were as big as cows!'] },
    ],

    // ---------------------------------------------------------------- Little Posy Cockle, Cockle Cottage
    // Fierce, small, loud. The music box the moth lady left her is the most important thing she owns.
    c_posy: [
      { if: 'flag c_gifts=truth', once: true,
        say: ['A lord sent me a clock with a bird in it! I called the bird Percy. Percy is rude. I love him.', 'I got a bird clock! Percy is rude.'] },
      { if: '!flag c_gifts',
        say: ['Are you a REAL dragon? Can you breathe fire? Do it on that gull.', 'Are you a real dragon? Breathe fire on that gull!'],
        re: [
          { t: ['Not on the gull. He did nothing.', 'Not the gull. He did nothing.'], tone: 'kind', f: 0.5,
            say: ['He took my chip. That is not nothing. ...Fine.', 'He took my chip! ...Fine.'] },
          { t: ['A little one. Watch.', 'A little one. Watch.'],
            say: ['Ooh! ...That was small. Do a big one. No, Mom says no big ones.', 'Ooh! Small. Mom says no big ones.'] },
        ] },
      // while the music box is still hers and the big moths are about
      { if: 'flag c_gift_trail !quest c_gifts done',
        say: ['A moth lady left my music box on our step. Moths are nice. Except the big ones. The big ones are rude.', 'A moth lady gave me my box. Big moths are rude.'],
        re: [
          { t: ['What big ones?', 'What big ones?'],
            say: ['The big grey one. It went over our roof the night the clocks stopped. Mom said it was a cloud. Clouds don\'t have wings.', 'A big grey one flew over. Mom said cloud. No!'] },
          { t: ['Can I hear your music box?', 'Can I hear your box?'],
            say: ["You can listen. You can't hold it.", "You can listen. You can't hold it."] },
        ] },
      // her moment (the old chat): asked at night-time worries, once she knows him
      { if: 'stage>=c_claws',
        say: ['Are dragons scared of anything?', 'Are dragons ever scared?'],
        re: [
          { t: ['Sure. Being scared is okay.', 'Sure. Scared is okay.'], tone: 'kind', f: 0.75, then: ['said posy_scared'],
            say: ["Okay. Then I'm a little scared of the big moths. That's okay.", "Then I'm a bit scared of big moths. Okay."] },
          { t: ['Not one single thing.', 'Not one thing!'], tone: 'brave', f: 0.5,
            say: ['Not even crabs? Wow.', 'Not even crabs? Wow.'] },
          { t: ['Only bath time.', 'Only bath time.'],
            say: ['Me too! Bath time is the worst.', 'Me too! The worst.'] },
        ] },
      { if: { any: ['flag c_gifts=kept', 'flag c_gifts=truth', 'flag c_gifts=bought'] },
        say: ["I play the moth song every night. Mom says I'm getting better. Mom is lying. I don't care.", 'I play my box every night!'],
        re: [
          { t: ['Play it for me?', 'Play it for me?'],
            say: ['Only the first bit. The rest is for my dad, when the red sail comes home.', 'Just the start. The rest is for Dad.'] },
          { t: ['Does it help you sleep?', 'Does it help you sleep?'],
            say: ['Every time. I wind it, and then I wake up and it is morning.', 'Yes. I wind it and then it is morning.'] },
        ] },
      { if: 'flag c_gifts=taken',
        say: ['Lord Whirligig has my box. Mom says it was his. I know it was his. I still miss it.', 'The lord has my box. It was his. I miss it.'],
        re: [
          { t: ['I could buy it back for you.', 'I could buy it back.'], tone: 'kind', f: 0.5,
            say: ['With coins? Real ones? ...You would do that?', 'With real coins? You would?'] },
          { t: ["I'm sorry, Posy.", "I'm sorry, Posy."],
            say: ["It's okay. I hum it now. Humming is free.", "It's okay. I hum it. Humming is free."] },
        ] },
      { ask: ['What will you play for your dad?', 'What will you play for Dad?'],
        say: ['The moth song. The whole thing. I practiced. When his red sail comes home.', 'The moth song. All of it. When he comes home.'] },
      { ask: ['Do you and Penny shout a lot?', 'Do you shout with Penny?'],
        say: ['Penny shouts the news. I shout back. We are friends.', 'Penny shouts news. I shout back.'] },
      { idle: [['Shh. Listen.', 'Shh. Listen.'], ['Hi, dragon. What?', 'Hi, dragon. What?']] },
      { bye: [['Bye! Breathe fire on the gull!', 'Bye! Burn the gull!'], ['Bye, dragon. Bye.', 'Bye, dragon.']] },
      { bark: true, say: ['*winds her music box* Listen! Shh! LISTEN!', 'Listen to my box! Shh!'] },
    ],

    // ================================================================ the small places
    // ---------------------------------------------------------------- Maudie Gale, the Gull's Rest on the cliff top
    // Shouts because of the wind, and apologises for it. Every night she and Agatha wave lanterns at each other.
    c_maudie: [
      { if: 'quest c_notes active !flag c_note3', option: ["Who's been climbing your chimney?", 'Who climbs your chimney?'],
        say: ["Someone! At night! I saw a note up there, and the gulls want it! You'd need claws!", 'A NOTE is on my chimney! Need claws!'] },
      { if: 'flag c_note3', once: true,
        say: ["You climbed my chimney! Was it a moth? No? A girl? Good! Moths don't pay for tea!", 'You climbed my chimney! Good!'] },
      { if: '!flag c_spire_up',
        say: ["Welcome to the Gull's Rest! I'm Maudie! Sorry for shouting! It's the WIND!", "Welcome! I'm Maudie! Sorry! WIND!"],
        re: [
          { t: ['Why is it so windy up here?', 'Why so windy?'],
            say: ["It's a cliff! On the sea! The wind's got nowhere better to be!", "It's a cliff by the sea! Wind!"] },
          { t: ['Is that telescope yours?', 'Is that your telescope?'],
            say: ["The telescope's free! The tea isn't! Look through it at the lighthouse!", 'The telescope is free! Tea is not!'] },
        ] },
      // the tower out at sea, from her telescope
      { if: 'flag c_spire_up !flag c_snow', fact: 'c_spire_rock=risen',
        say: ["Look through my telescope! There's a black tower out at sea! It wasn't there before! I'd remember!", 'A black tower at sea! It was not there before!'],
        re: [
          { t: ["I'm going out there.", "I'm going out there."], tone: 'brave', f: 0.5,
            say: ["Out THERE? Take a scarf! Take two! Come back for tea!", 'Out there? Take a scarf! Come back for tea!'] },
          { t: ['What can you see on it?', 'What can you see?'],
            say: ["Moths! Thousands! Like grey snow going up instead of down! I've put the telescope away!", 'Moths! Thousands! I put the telescope away!'] },
        ] },
      // her moment (the old chat): the best view
      { if: 'stage>=c_brass',
        say: ["What's the best view you've ever seen? I've got the second best one, right here!", "What's the best view you ever saw? Mine is here!"],
        re: [
          { t: ['Home, from a hill.', 'Home, from a hill.'], tone: 'kind', f: 0.75,
            say: ["Oh, that's the one! That's always the one!", "That's the one! Always!"] },
          { t: ['The whole coast, from the sky.', 'The coast, from the sky.'], tone: 'brave', f: 0.5,
            say: ["From the SKY? You can fly? Take me! No! Don't!", 'You fly? Take me! No, don\'t!'] },
          { t: ['WHAT?', 'WHAT?'],
            say: ['What? ...Ha! Very good! Very good!', 'What? Ha! Very good!'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ["Snow! On a cliff! In June! I've had to shout louder!", 'Snow! In June! I shout louder now!'],
        re: [
          { t: ['How is that even possible?', 'How can you be louder?'],
            say: ["Practice! Forty years of it! I came up here for a quiet life!", 'Practice! I came here for a quiet life!'] },
          { t: ['Did Agatha wave last night?', 'Did Agatha wave?'], if: 'said maudie_lantern',
            say: ["Twice! Twice! We still don't know what it means! I waved back three times!", 'Twice! I waved back three times!'] },
        ] },
      // topics (her old TALK about and deep): the lanterns she and Agatha wave
      { ask: ['What is your lantern in the window for?', 'What is your lantern for?'], then: ['said maudie_lantern'],
        say: ["Agatha at the lighthouse and I wave lanterns at each other every night! It means goodnight! Or help! We never decided!",
          'Agatha and I wave lanterns! Goodnight! Or help!'] },
      { ask: ['Why do you live up here?', 'Why live up here?'],
        say: ["I came up here for a quiet life! Forty years ago! Still waiting! ...Sorry. It's lovely when the wind drops. Oh. It's back.", 'I came for a quiet life! Still waiting!'] },
      { idle: [["What? Go on! I'm listening!", "What? I'm listening!"], ['Sorry! Wind! What is it?', 'Sorry! Wind! What?']] },
      { bye: [['Hold on to your chips!', 'Hold on to your chips!'], ["Mind the cliff! It's right there!", 'Mind the cliff!']] },
      { bark: true, say: [['WIND!'], ['Hold on to your chips!', 'Hold your chips!']] },
    ],

    // ---------------------------------------------------------------- Keeper Agatha Brightwater, the Spinning Lighthouse
    // Gruff, short, talks to Captain Squawk as an equal. Forty years keeping the light; her father taught her the lamp is
    // for the people waiting at home. A story lead in Act II.
    c_agatha: [
      { if: 'choice fennick=forgive', once: true,
        say: ['Word in the lamp trade is you let Fennick Wick off with a warning. Good. Nobody makes better oil.', 'You let Fennick off? Good. He makes the best oil.'] },
      // (STORY_PLAN 3.4 Act I: Fennick, who opened a gate for a promise of oil, is Vesper in miniature; said once, here)
      { if: 'flag c_snow choice c_vesper=friend choice fennick=forgive',
        say: ['Fennick Wick opened a door for a promise of lamp oil, and you gave him a second chance. That girl climbed my stairs for a promise of fire. You gave her one too.',
          'Fennick was promised oil. She was promised fire. You forgave both.'],
        re: [
          { t: ['Somebody lied to both of them.', 'Someone lied to both.'],
            say: ['Aye. Somebody who knows what lonely people want. Mind that one, dragon.', 'Someone who knows what lonely people want.'] },
          { t: ['They both said sorry.', 'They both said sorry.'],
            say: ['Then they both got more than most. Hm. So did you.', 'Then they got more than most.'] },
        ] },
      // she has sent him up to the lamp (the meeting is the chapter's scene, c_agatha_meet)
      { if: 'flag c_agatha !flag c_light_done',
        say: ['Squawk wants to know why you are still down here. So do I.', 'Squawk asks why you are still here. So do I.'],
        re: [
          { t: ["What's wrapped round your lamp?", 'What is on your lamp?'],
            say: ["Something big and grey that won't leave for me. Go up and ask it nicely. Then not nicely.", 'Something big and grey. Ask it nicely. Then not.'] },
          { t: ['How long has Squawk talked?', 'How long has Squawk talked?'],
            say: ['Thirty years. He has said three true things in all that time. Two of them this week.', 'Thirty years. Three true things. Two this week.'] },
          { t: ['Will your stairs hold me?', 'Will the stairs hold me?'],
            say: ['They held my father, and he ate a pie a day. Go on.', 'They held my dad. He ate a pie a day. Go.'] },
        ] },
      // the lamp is lit (until the bridge is back and the Spire night begins)
      { if: 'flag c_light_done stage<c_spire',
        say: ['My light is back. Squawk, say thank you to the dragon. ...He says something about a house. That means thank you.', 'My light is back! Squawk says thank you.'],
        re: [
          { t: ["You're welcome, Squawk.", "You're welcome, Squawk."], tone: 'kind', f: 0.5,
            say: ["He's bowing. He has never bowed in his life. Don't make him do it twice.", "He's bowing! He never bows."] },
          { t: ['Maudie has been waving at you.', 'Maudie waves at you.'], if: 'said maudie_lantern',
            say: ["Has she? I've had my hands full. ...I'll wave tonight. Twice. She'll think it means help.", "I'll wave tonight. Twice. She'll think it means help."] },
          { t: ['Did you see the tower in the sea?', 'Did you see the tower?'], if: 'flag c_spire_up',
            say: ['From the lamp room. Forty years I have watched that water. There was never a tower in it.', 'Forty years I watched. There was never a tower.'] },
        ] },
      // the Spire night: she keeps the light on for him
      { if: 'stage=c_spire !flag c_shard1',
        say: ['Going out to that tower, then. Squawk and I will keep the light on for you.', 'Going to the tower? We will keep the light on.'],
        re: [
          { t: ['Will you watch for me?', 'Will you watch for me?'], tone: 'kind', f: 0.5, then: ['said agatha_light'],
            say: ["All night. That's the job. It always was.", "All night. That's the job."] },
          { t: ["What if I'm not back by morning?", "What if I'm not back?"],
            say: ["Then I keep it on longer. I've done it for less.", "Then I keep it on longer."] },
        ] },
      // her moment (the old chat): Squawk's question, once the light is turning
      { if: 'flag c_light_done',
        say: ['Squawk wants to know something. Why do you keep helping people?', 'Squawk asks. Why do you help people?'],
        re: [
          { t: ['Because someone helped me.', 'Someone helped me.'], tone: 'kind', f: 0.75,
            say: ['Hm. Good answer. Squawk agrees. Squawk, stop nodding.', 'Good answer. Squawk agrees.'] },
          { t: ['Because I can.', 'Because I can.'], tone: 'brave', f: 0.5,
            say: ['Hm. Simple. I like simple.', 'Simple. I like it.'] },
          { t: ['Squawk is very nosy.', 'Squawk is nosy.'],
            say: ['He is. Squawk. Mind your own business.', 'He is! Mind your business, Squawk.'] },
        ] },
      // after the Spire
      { if: 'flag c_snow said agatha_light', once: true,
        say: ['I kept it on all night, like I said. You came back. Good. Squawk was worried. I was not.', 'I kept it on all night. You came back. Good.'] },
      { if: 'stage>=c_spire', fact: 'c_lighthouse_lamp=lit',
        say: ['She spins all night again, and Squawk sleeps on the lamp rail like a fat green cushion.', 'The light spins. Squawk sleeps on the rail.'],
        re: [
          { t: ['Does he snore?', 'Does he snore?'],
            say: ['In my voice. He says "Agatha, the kettle" in his sleep. I have never once said that.', 'In my voice! He says "the kettle" in his sleep.'] },
          { t: ['The fleet can find its way home now.', 'The fleet can come home now.'], tone: 'kind', f: 0.5,
            say: ['That is the job. Half of Gearhaven is waiting on a boat.', 'That is the job. Half the town waits.'] },
        ] },
      // topics (her old TALK about and deep)
      { ask: ['Why do you keep the light?', 'Why do you keep the light?'],
        say: [['c_agatha', 'My father kept it before me. On his last night he said, Agatha, the lamp is not for the ships. It is for the people waiting for the ships.', 'Dad said the lamp is for the people waiting.'],
          ['c_agatha', 'I did not understand him. I do now.', 'I did not get it then. I do now.']],
        re: [
          { t: ['Mom keeps a lantern in the window.', 'Mom keeps a lantern lit.'], if: 'flag c_pb_4',
            say: ['Then she knows. Write to her tonight. Tell her the light here is on too.', 'Then she knows. Write to her tonight.'] },
          { t: ["So it's for the ones at home.", 'It is for the ones at home.'],
            say: ['Aye. The ships only need it for a minute. The ones at home need it all night.', 'Ships need it a minute. Home needs it all night.'] },
        ] },
      { ask: ['Does Maudie wave at you at night?', 'Does Maudie wave at you?'],
        say: ['Every night. I wave back. We have never agreed what it means. It does not seem to matter.', 'Every night. We never agreed what it means.'] },
      { idle: [['Hm. What is it?', 'Hm. What is it?'], ['Squawk, hush. Go on, dragon.', 'Squawk, hush. Go on.']] },
      { bye: [['Mind the stairs. They are older than me.', 'Mind the stairs.'], ['Go on. Mind the rocks on the path.', 'Go on. Mind the rocks.']] },
      { bark: true, say: ["Squawk. Stop it. Squawk. ...He's doing my voice again.", "Squawk. Stop it. He's copying me."] },
    ],

    // ---------------------------------------------------------------- Old Barley, the sheepfold on the Chalk Downs
    // Slow and fond. Talks about his sheep as if they had jobs. His wife used to walk the Chalk Dragon's line.
    // (c_coast.js has his line about Gerald first, until Ash reaches Gearhaven.)
    c_barley: [
      { if: 'quest c_chalk done', once: true,
        say: ['She is white again, the Chalk Dragon. I sit here and look at her every evening. So does Gerald, when he is awake.', 'The Chalk Dragon is white again.'] },
      { if: 'quest duchess done', once: true, ref: 'hollis_farm',
        say: ["A goat came down the chalk road this week, all on her own, and walked past my sheep like she had business in town. Chewed my gate on the way. Duchess the Second was most offended.",
          'A strange goat came down the road. She chewed my gate!'] },
      { if: 'stage>=c_claws !flag m0_duchess_open', promise: 'm0_duchess', dir: ['emberhollow', 'm0_duchess', 'east'], option: ['Tell me about Duchess the Second', 'Tell me about Duchess'],
        say: ["I named her after Farmer Hollis's goat, up your way. Duchess the First climbs rocks no goat should. Hollis says there's one east of your village, all over hoofprints. Goats hide things up high.",
          'A goat rock east of your village. Look up high.'] },
      { if: '!quest c_chalk done',
        say: ["That's Duchess the Second, she's in charge. That's Gerald, he's in charge of nothing. He's happy.", 'Duchess is in charge. Gerald is not.'],
        re: [
          { t: ['Is Gerald still silver?', 'Is Gerald still silver?'],
            say: ['Bits of him. He sparkles when he faints. It seems to comfort him.', 'Bits. He sparkles when he faints.'] },
          { t: ['Why is Duchess the boss?', 'Why is Duchess boss?'],
            say: ['Nobody voted. She just stood on the highest rock and looked at us. That was that.', 'She stood on the top rock and looked at us.'] },
        ] },
      // his moment (the old chat): asked on a quiet day on the Downs
      { if: 'stage>=c_salt',
        say: ["Gerald wants to know something. What's the best thing to do on a nice day?", 'Gerald asks. What is best on a nice day?'],
        re: [
          { t: ['Sit with a friend.', 'Sit with a friend.'], tone: 'kind', f: 0.75,
            say: ["That's Gerald's answer too. He fainted when he heard you say it.", 'Gerald agrees. He fainted.'] },
          { t: ['Climb the biggest hill!', 'Climb the biggest hill!'], tone: 'brave', f: 0.5,
            say: ["The hill's right there. Mind the chalk. It comes off on your knees.", 'The hill is there. Mind the chalk.'] },
          { t: ['Count sheep.', 'Count sheep.'],
            say: ['I do that every day. I always get one more than I have. It is Gerald. He gets counted twice.', 'I always count one extra. It is Gerald.'] },
        ] },
      { if: 'quest c_chalk done !flag c_snow',
        say: ['She waves now, the Chalk Dragon. When the sun is low you can see her from the harbor.', 'She waves now. You can see her from the harbor.'],
        re: [
          { t: ["Do you think Pearl's mom saw it?", "Did Pearl's mom see it?"],
            say: ['I like to think she flew over on purpose, every spring, just to look.', 'I think she flew over every spring to look.'] },
          { t: ['Your wife would have liked it.', 'Your wife would like it.'], tone: 'kind', f: 0.5,
            say: ['She would. She would have walked it again just to check. Thank you, lad.', 'She would. Thank you, lad.'] },
        ] },
      { if: 'flag c_snow', fact: 'c_gearhaven=snowy',
        say: ['Snow on the Downs. The sheep think it is wool. They are furious about it.', 'Snow! The sheep think it is wool. They are cross.'],
        re: [
          { t: ['Is Gerald all right in the cold?', 'Is Gerald all right?'],
            say: ['He fainted into a drift and liked it. He is still in there. Happy as anything.', 'He fainted into the snow. He likes it.'] },
          { t: ['The Chalk Dragon is under the snow.', 'The Chalk Dragon is covered.'],
            say: ["She's had worse. A bit of snow won't stop her waving.", 'A bit of snow will not stop her.'] },
        ] },
      // topics (his old TALK about and deep)
      { ask: ['Who kept the Chalk Dragon white?', 'Who kept her white?'], if: '!quest c_chalk done',
        say: ["My wife walked that line every spring, to keep it white. When she went, I tried. My knees said no. She's been greying ever since.", 'My wife kept her white. My knees cannot. She went grey.'] },
      { ask: ['Does Penny print your sheep news?', 'Does Penny print sheep news?'],
        say: ['Never. I tell her every week. Gerald is very hurt.', 'Never. Gerald is very hurt.'] },
      { idle: [['Sit a while. What is it?', 'Sit a while. What?'], ['Easy. The sheep are listening.', 'Easy. The sheep listen.']] },
      { bye: [["Mind Gerald on your way out. He's lying down.", 'Mind Gerald. He is lying down.'], ['Sit a while, next time. The sea will wait.', 'Sit longer next time.']] },
      { bark: true, say: ["Easy, Gerald. Easy. ...He's fainted.", 'Easy, Gerald. ...He fainted.'] },
    ],

    // ================================================================ home
    // ---------------------------------------------------------------- Maren, Ash's mom, at the forge (Act II visits)
    // In Act I she is converted in act1/people.js; this is what she says when Ash comes home in the middle of Act II.
    // Short, practical, warm; worry comes out as instructions. Her old code still plays her own forge talk first
    // (reforging with star-iron).
    maren: [
      // what Ash told people on the coast comes home by letter and by Wren
      { if: 'said ingrid_mom',
        say: ['You met Ingrid Anvilsong, and she knew my hammer marks? From across her smithy?', 'Ingrid knew my hammer marks? Really?'],
        re: [
          { t: ['She says you hit like you mean it.', 'She says you mean it.'],
            say: ['I do mean it. Tell her I know her marks too. I don\'t. Tell her anyway.', 'I do. Tell her I know hers too.'] },
          { t: ['She wants to shake your hand.', 'She wants to shake hands.'],
            say: ["Gently, I hope. A smith's hands aren't made for shaking.", "Gently, I hope. Smiths' hands are rough."] },
        ] },
      { if: 'said ottoline_mom_book',
        say: ['Wren had a letter from your librarian on the coast. You told her the best book is one I read you. Which one did you mean?', 'Wren says you told the librarian about our book. Which one?'],
        re: [
          { t: ["The Hen Who Wouldn't.", "The Hen Who Wouldn't."], tone: 'kind', f: 0.5,
            say: ['You cried at the fox. Every time, Ash. Every single time.', 'You cried at the fox. Every time.'] },
          { t: ['All of them, Mom.', 'All of them, Mom.'],
            say: ["That's cheating. ...It's a good answer, though.", "That's cheating. Good answer, though."] },
        ] },
      // early in the act: home before the thief is caught
      { if: '!flag c_clock_on',
        say: ["You're home? Already? Did you catch her?", "You're home? Did you catch her?"],
        re: [
          { t: ["Not yet. She's so fast, Mom.", "Not yet. She's fast."],
            say: ['Then sit down for one hour, and go back faster. Your bed is made.', 'Sit for an hour. Then go back faster.'] },
          { t: ['I just came to see you.', 'I came to see you.'], tone: 'kind', f: 0.5,
            say: ['...Come here. There. Now go and catch her.', 'Come here. Now go and catch her.'] },
        ] },
      // the clock (Pebble brought the news first, in her letter)
      { if: 'flag c_clock_on !flag c_snow',
        say: ["A whole city's clock! I told the chickens. Hal says he'll believe it when he hears it ticking from here.", "A whole city's clock! I told the chickens."],
        re: [
          { t: ['It bonged twelve times in the afternoon.', 'It bonged twelve times.'],
            say: ['Twelve, in the afternoon. That sounds like something you would do.', 'In the afternoon? That sounds like you.'] },
          { t: ['A girl climbs it every night.', 'A girl climbs it at night.'],
            say: ['The thief? Climbs a clock tower, at night? Somebody ought to be watching that girl.', 'At night? Someone should watch that girl.'] },
        ] },
      // after the Spire
      { if: 'flag c_snow',
        say: ["You're back. Snow in June, a bite out of the moon, and you're back. Did you get it?", "You're back! Did you get it?"],
        re: [
          { t: ["She's my cousin, Mom. Vesper.", "She's my cousin. Vesper."], if: 'choice c_vesper=friend',
            say: ["Your cousin? ...Sit down. Start at the beginning, and don't skip the bits I won't like.", "Your cousin? Sit. Tell me all of it."] },
          { t: ['She got away, Mom.', 'She got away.'], if: 'choice c_vesper=foe',
            say: ["Then she's out there in this snow. Somebody's girl. I hope somebody's looking.", "Then she's out in the snow. I hope someone looks."] },
          { t: ['I got one piece of the Heart.', 'I got one piece.'], if: 'item c_shard1',
            say: ['Let me see. ...It knows you. It went warm the second you held it out. Keep it close.', 'It knows you. It went warm. Keep it close.'] },
        ] },
      { if: 'flag c_snow',
        say: ['The whole village sleeps round my forge now. Hal brought the cow. The cow is not happy.', 'Everyone sleeps by my forge now. Even the cow.'],
        re: [
          { t: ["The sky past the mountains is white.", 'The far sky is white.'],
            say: ["I've seen it from the forge door. ...You're going up there, aren't you.", "I've seen it. You're going up there."] },
          { t: ['Is everybody warm enough?', 'Is everyone warm?'], tone: 'kind', f: 0.5,
            say: ['Warm, and arguing about blankets. That means warm enough.', 'Warm, and arguing. That means fine.'] },
        ] },
      // topics for Act II
      { ask: ['Did you know about Pearl?', 'Did you know about Pearl?'], if: 'flag c_ottoline',
        say: ["Ember's other girl? Yara told me once, when I was small. I thought it was a story to make me eat my crusts.", 'Yara told me once. I thought it was a story.'] },
      { ask: ['Can you mend the Heart?', 'Can you mend the Heart?'], if: 'item c_shard1',
        say: ["Not one piece. Bring me all three, and I'll have the forge hot and waiting.", 'Not one piece. Bring all three.'] },
      { idle: [['Mm? Pass me the tongs. Go on.', 'Pass the tongs. Go on.'], ["You're home. Sit a minute.", "You're home. Sit a minute."]] },
      { bye: [['Write to me. Pebble is getting fat with nothing to do.', 'Write to me.'], ['Take your scarf. The coast is windy.', 'Take your scarf.']] },
    ],
  },
})
