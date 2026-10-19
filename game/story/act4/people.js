// game/story/act4/people.js (A4S): everyday talk and barks for every Act IV person in Moonfall, Hilde's Act IV talk in
// Hearthold, the lamp_thief clue talk and its herrings, the gate pointers, Pebble's Act IV letters and the EPI.m lines.
// Replaces their CAST `lines`, x3_people's moodLine wrapper and personal B() barks (CHANGES.md, A2S people()).
// Rules kept here:
//  - Lines that state a world fact that changes carry `fact` and are conditioned on it (registry/map3_s.js states):
//    m4s_lighthouse dark|lit, m4s_ferry_lines cut|up, m4s_sunken_gate plugged|open, m4s_moon_well full|dim,
//    m4s_sable_lamps lit|out|relit, m4s_moon whole|bitten|half, m4s_dell_boat away.
//  - People react to what Ash did: `once` lines after each side quest, choice and solved case come first, then the
//    lines of the moment, then a list the game cycles through, then barks.
//  - Each backtracking gate (gates_map0/1/2.js) has a pointer here, an option tagged with `promise`.
//  - Story files load in path order, so these entries come before the q_*.js files' own: a quest's plain lines (not
//    options) live here, above each person's everyday lines.
//  - Main-path scenes and their clues belong to the chapters (A4a: Dabble, Winnie, Gilly's fish, Kipper's scouts,
//    Rafi's sun, Saffron's worms; A4b: Esme's bench, Saffron's warning). Nothing here repeats them.
//  - The returning cast (Dell, Wren, Mags, Tikka, Vesper, Mom, Quill, Juniper, Glaciar, Queen Sandy) is spoken for by
//    x3_people's own talk hook, which answers before data talk lines can play (A4S ENGINE REQUEST in CHANGES.md); only
//    their quest steps are data. Wren's old first-meeting scene (STORY.m_wren) is replaced in place below.
people({
  id: 'act4_people', act: 4,

  clue: {
    // ---- lamp_thief (A4b's deduction in m_observatory.js needs m4_esme_glass; m4_jinx_lamps is a herring)
    m4_esme_glass: { icon: 'lamp', mystery: 'lamp_thief',
      text: ['Esme: every lamp in Sable went out at the eclipse, and three of them have no GLASS. Somebody steals lamp glass.',
        'Three of Sable\'s lamps lost their glass.'] },
    m4_ned_helmets: { icon: 'moth', mystery: 'lamp_thief',
      text: ["Old Ned: moths in little plumed helmets tried to unscrew his lamp's glass. It is bolted on, so they gave up.",
        'Moths in little helmets tried to steal lamp glass.'] },
    m4_jinx_lamps: { icon: 'lamp', mystery: 'lamp_thief', herring: true,
      text: ['Jinx the Mirage Merchant sells lamps. "Barely used!" They fade away when you touch them.',
        'Jinx sells lamps. They fade when touched.'] },
  },

  talk: {
    // ================================================================ Driftwood Landing (talk v11, J11b)
    // A raft town that moves every day. Nobody here met Ash before this act: they know what they saw (a dragon off
    // Dell's boat, or off Glaciar's back) and what their letters say (Ned's cousin Agatha keeps Gearhaven's light; Gilly
    // writes to Hilde in Hearthold). Their part of the act: the wobbly tide (m_drift), Ash going down to Lumen and back
    // (m_lumen, m_coral), the Baron and the ferry (m_reef), the two eclipses seen from far off, Dell sailing west to
    // fetch Mom (m_dell_away), and the night the moon goes out (m_done). Openers that are news come first in each list.

    // ---------------------------------------------------------------- Mayor Dabble Floatwell
    // Jolly, a little grand, writes everything down in the town book, blames fish. The wet socks are his own joke.
    m_dabble: [
      { if: 'quest m_ferry done flag m_ferry_on', once: true, fact: 'm4s_ferry_lines=up',
        say: ["The ferry runs again! The chickens ride for free. Every morning they wait at the post in a neat little line.", 'The ferry runs! Chickens ride free.'],
        re: [
          { t: ['Do they know where they are going?', 'Do they know where to go?'],
            say: [['m_dabble', 'No. Neither does the town. We get on very well.', 'No. Nor does the town.']] },
          { t: ['Rowan did all the hard knots.', 'Rowan did the knots.'], tone: 'kind', f: 0.5,
            say: [['m_dabble', 'She tied me a knot that means "no speeches", so I am not making one. On the inside, I am.', 'She said no speeches. Inside, I am making one.']] },
        ] },
      { if: 'quest m_lighthouse done flag m_lighthouse_lit', once: true, fact: 'm4s_lighthouse=lit',
        say: ["Old Ned's light! I can see my own socks at midnight. They're still wet. But I can SEE them.", "Ned's light is on! I can see my socks."],
        re: [
          { t: ['Squint must be so happy.', 'Squint must be happy.'],
            say: [['m_dabble', 'She waves at it every night. It waves back. Ned will not admit that is what he is doing.', 'She waves. It waves back. Ned denies it.']] },
          { t: ['Are you going to dry them?', 'Will you dry them?'],
            say: [['m_dabble', 'Dry them? Ash. This is Driftwood.', 'Dry them? This is Driftwood.']] },
        ] },
      { if: 'flag m_ship=glaciar', once: true,
        say: ['Your auntie froze half our beach. We sell the ice to Sable. Sable pays in dates. Everybody is happy except the ice.',
          'We sell your auntie\'s ice for dates!'],
        re: [
          { t: ["She didn't mean to freeze it.", "She didn't mean to."],
            say: [['m_dabble', 'Do not tell Sable. They think it was a gift. They have sent a thank-you letter, and more dates.', 'Sable thinks it was a gift. Shh.']] },
          { t: ['Is she still asleep out there?', 'Is she still asleep?'],
            say: [['m_dabble', 'Snoring. The raft children slide down her tail, and she pretends she cannot feel it.', 'Snoring. Children slide down her tail.']] },
        ] },
      { if: 'flag m_dell_away stage<m_reforge', fact: 'm4s_dell_boat=away',
        say: ["Captain Dell sailed off to fetch your mom. He left me in charge of his dock. I've never had a dock before.", 'Dell went to get your mom. I am minding his dock!'],
        re: [
          { t: ['How long till they get back?', 'How long till they are back?'],
            say: [['m_dabble', 'Three days, he said. Then he tooted twice. I am told that means three days, cheerfully.', 'Three days. He tooted twice. That means cheerfully.']] },
          { t: ["Please don't lose his dock.", "Don't lose his dock."],
            say: [['m_dabble', 'It is tied to the whole town, Ash. If the dock goes, we all go. That is how Driftwood keeps things.', 'It is tied to the town. It cannot go alone.']] },
        ] },
      // the night the moon goes out
      { if: 'act=4 flag m_done',
        say: ['No moon tonight. No moon at all. The tide is lying flat and sulking, and nobody knows which way to row.', 'No moon at all. The tide is sulking.'],
        re: [
          { t: ['She ate the last of it.', 'She ate the last of it.'],
            say: [['m_dabble', 'Then somebody had better make her give it back. I would write to her, but I do not know where she lives.', 'Somebody must make her give it back.']] },
          { t: ["I'm going to get it back.", "I'm going to get it back."], tone: 'brave', f: 0.5,
            say: [['m_dabble', 'Good. Bring it here first. I would like a word with it about the tide.', 'Good. Bring it here first. I want a word.']] },
        ] },
      { if: 'flag m_eclipse2 !flag m_done', fact: 'm4s_moon=half',
        say: ['Half a moon. Twice last week the whole town turned round in the night. I went to sleep facing the sea and woke up facing Palmcrest.',
          'Half a moon. The town turns round at night now.'],
        re: [
          { t: ['Is everybody all right?', 'Is everybody all right?'], tone: 'kind', f: 0.5,
            say: [['m_dabble', 'Seasick, cross, and all here. I counted this morning. Ninety rafts, and the chickens.', 'Seasick and cross. But all here. I counted.']] },
          { t: ['Can I sleep here and try it?', 'Can I try sleeping here?'],
            say: [['m_dabble', 'You are very welcome. Bring a bucket.', 'Yes. Bring a bucket.']] },
        ] },
      { if: 'flag m_eclipse1 !flag m_eclipse2', fact: 'm4s_moon=bitten',
        say: ['The sun went out in the middle of the morning, and every raft in town bumped every other raft. Mrs. Pike lost her teapot over the side.',
          'The sun went out. Every raft bumped. A teapot fell in.'],
        re: [
          { t: ['That was her. The grey moth.', 'That was the grey moth.'],
            say: [['m_dabble', 'A moth, over the sun? I am putting that in the town book in very small writing, so I do not have to look at it.', 'I will write it very small. So I need not look.']] },
          { t: ['Did Mrs. Pike get her teapot back?', 'Did she get the teapot back?'],
            say: [['m_dabble', "Ollie brought it up. Old Winnie's octopus. He kept the lid.", "Winnie's octopus brought it up. He kept the lid."]] },
        ] },
      { if: 'stage>=m_reef !flag m_ferry_on', fact: 'm4s_ferry_lines=cut',
        say: ['Our ferry is stuck. The Crab Pirates cut every line, and Rowan tied a "help me" knot on the post. She never ties that one.',
          'Crabs cut the ferry lines. Rowan needs help.'],
        re: [
          { t: ["I'll go and talk to Rowan.", "I'll talk to Rowan."],
            say: [['m_dabble', 'Go gently. She would rather fix it herself, and she cannot, and she hates that.', 'Go gently. She hates needing help.']] },
          { t: ['What does a help-me knot look like?', 'What does that knot look like?'],
            say: [['m_dabble', 'Small and tight, right where everybody can see it. That is how you know she means it.', 'Small and tight, where all can see.']] },
        ] },
      // his moment (the old TALK chat), once Ash has been down to Lumen and back
      { if: 'stage>=m_coral !flag m_done',
        say: ['A question for the town book. Every raft here has a name. If you had a raft, what would you call it?', 'Every raft has a name. What would you call yours?'],
        re: [
          { t: ['The Maren. After my mom.', 'The Maren. After Mom.'], tone: 'kind', f: 0.75, then: ['said dabble_raft_maren'],
            say: [['m_dabble', 'The Maren. A raft that never lets you sink. In it goes. Rowan can build her.', 'The Maren. A raft that never sinks. In it goes!']] },
          { t: ['The Unsinkable Dragon.', 'The Unsinkable Dragon.'], f: 0.5,
            say: [['m_dabble', 'Bold. Probably sinkable. I love it. In it goes, with a question mark.', 'Bold! Probably sinkable. I love it.']] },
          { t: ['Wet Socks.', 'Wet Socks.'], tone: 'silly', f: 0.75,
            say: [['m_dabble', 'Wet Socks! That is MY raft. You have seen my socks. Everybody has seen my socks.', 'Wet Socks! That is my raft!']] },
        ] },
      { if: 'stage>=m_lumen stage<m_reef',
        say: ["Old Winnie says you're going down to the drowned city. I've never been further under the sea than my knees.", 'You are going down to the old city? Not me.'],
        re: [
          { t: ["Ember's flame is down there.", "Ember's flame is down there."],
            say: [['m_dabble', 'Then go and get it, and come back up. I have written "come back up" in the town book. Twice.', 'Then get it and come back up. I wrote that down.']] },
          { t: ['Can you see it from a boat?', 'Can you see it from a boat?'],
            say: [['m_dabble', 'On a still day you can see roofs down there, green ones. I never row over them. It feels rude.', 'On still days you see green roofs. I never row over.']] },
        ] },
      // the wobbly tide, before Ash has worked it out
      { if: 'stage=m_drift flag m_dabble !solved wobbly_tide',
        say: ['Any news? The chickens are halfway to Palmcrest, and every one of them is looking back at me.', 'Any news? The chickens are still floating off.'],
        re: [
          { t: ['Winnie wants proof first.', 'Winnie wants proof first.'],
            say: [['m_dabble', 'She always does. I once told her it was raining. She went out to check, came back wet, and said "fair".', 'She always does. She checks even the rain.']] },
          { t: ['Are you sure it was the fish?', 'Are you sure it was the fish?'],
            say: [['m_dabble', 'Fairly sure. Mostly sure. Somebody has to be blamed, and he is very round.', 'Mostly sure. And he is very round.']] },
        ] },
      { ask: ['Why does the whole town float?', 'Why does the town float?'],
        say: ['Long ago two families tied their rafts together, and they both liked it. Now there are ninety of us, and nobody agrees which end is the front.',
          'Two rafts got tied together. Now there are ninety.'] },
      { ask: ['Have you ever lived on land?', 'Have you lived on land?'],
        say: ["I was born on a raft. I have stood on real ground twice. It didn't move once. I didn't trust it.", 'I was born on a raft. Land does not move. I hate that.'] },
      { ask: ['Do you trade with Sable?', 'Do you trade with Sable?'], if: 'flag m_rafi',
        say: ["Fish for dates. Rafi says our fish are wet. They're fish, Ash. Of course they're wet.", 'Fish for dates. Rafi says our fish are wet!'] },
      { idle: [['The town book is open. Go on.', 'Go on.'], ['Mind the gaps. What is it?', 'Mind the gaps. Yes?']] },
      { bye: [['Off you go. Wave to the chickens.', 'Wave to the chickens.'], ['Mind that gap. And that one.', 'Mind the gaps!']] },
      { bark: true, say: ['Mind the gap! Mind that gap too! Mind all the gaps!', 'Mind the gaps!'] },
      { bark: true, say: ['*wrings out a sock* Ah. Better. *puts it back on* Ah. Worse.', '*wrings out a sock* Ah. Worse.'] },
    ],

    // ---------------------------------------------------------------- Old Winnie the Tidewife (a story lead)
    // Old, wry, short sentences; calls Ash "child". Sixty years watching the tide. Ollie the octopus lives in her teapot.
    // Once wrote letters in bottles to Elder Ripple, down in Coralcombe. The chapter plays her proof and her story.
    m_winnie: [
      // Ripple's answer, carried back up by Ash (said ripple_hello, set in Coralcombe)
      { if: 'said ripple_hello', once: true,
        say: ['So the old barnacle remembers me. Ha. Ollie, did you hear? He remembers me.', 'So Ripple remembers me. Ha!'],
        re: [
          { t: ['He kept every one of your bottles.', 'He kept all your bottles.'],
            say: [['m_winnie', 'Every one? Mine are under my bed, in a fish crate. Do not tell him. He will get ideas.', 'Mine are under my bed. Do not tell him.']] },
          { t: ['You should write to him again.', 'You should write again.'], tone: 'kind', f: 0.75,
            say: [['m_winnie', 'At my age? ...Fetch me a bottle, child. A clean one.', 'At my age? ...Fetch me a bottle.']] },
        ] },
      { if: 'flag m_eclipse1', once: true,
        say: ['When the moth bit the moon, the tide went three ways at once. Ollie hid in the sugar bowl. He is still in there.',
          'When the moon got bitten, Ollie hid in the sugar bowl.'],
        re: [
          { t: ["I saw her. She's enormous.", "I saw her. She's huge."],
            say: [['m_winnie', 'I saw her shadow on the water. That was big enough for me.', 'I saw her shadow. Big enough.']] },
          { t: ['Should we get him out?', 'Should we get him out?'],
            say: [['m_winnie', 'Leave him. He is thinking. So am I.', 'Leave him. He is thinking.']] },
        ] },
      { if: 'choice m_hush=free', once: true,
        say: ['A little white light went over the hut, low and slow, heading out to sea. Ollie came out of the sugar bowl to look.',
          'A white light went by. Ollie came out to look.'],
        re: [
          { t: ['That was Hush. I let her go.', 'That was Hush. I let her go.'],
            say: [['m_winnie', 'Then the sea saw you do it. Sit down. Have some tea. Not from the teapot.', 'Then the sea saw. Sit. Have some tea.']] },
          { t: ['Did Ollie stay out?', 'Did Ollie stay out?'],
            say: [['m_winnie', 'He went back in. But he looked. That is a lot, for Ollie.', 'He went back in. But he looked.']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ['No moon. The tide is lying flat like a dog whose boy went out. Sixty years, and I have never heard the sea so quiet.', 'No moon. The sea has gone so quiet.'],
        re: [
          { t: ["I'm going up the black mountain.", "I'm going up the mountain."], tone: 'brave', f: 0.5,
            say: [['m_winnie', 'Then I will keep a lamp in the window. We do that here, for the ones out on the water.', 'Then I will keep a lamp in my window.']] },
          { t: ['Will the tide come back?', 'Will the tide come back?'],
            say: [['m_winnie', 'If the moon does. Bring her back, child, and the sea will do the rest.', 'If the moon does. Bring her back.']] },
        ] },
      { if: 'flag m_eclipse2 !flag m_done', fact: 'm4s_moon=half',
        say: ["Less than half a moon now. The tide comes in when it likes and goes out when it's bored, like a cat.",
          'Less than half a moon. The tide does what it likes.'],
        re: [
          { t: ['How long before it takes Driftwood?', 'When will it take Driftwood?'],
            say: [['m_winnie', 'Not while there is a bite left. After that, I do not know, child. Nobody alive has seen it.', 'Not while some moon is left. After that, who knows.']] },
          { t: ["Mom's coming. On Dell's boat.", "Mom's coming on Dell's boat."], if: 'flag m_dell_away',
            say: [['m_winnie', 'Your mother is crossing this sea, now? Then I will watch the tide for her. I am good at that.', 'Then I will watch the tide for her.']] },
          { t: ['Is the hut safe?', 'Is your hut safe?'],
            say: [['m_winnie', 'Safe as a shell. I have tied it to Rowan twice. To her raft, I mean.', 'Safe. I tied it to Rowan\'s raft. Twice.']] },
        ] },
      // her moment (the old TALK chat), after the moon has been bitten in front of everyone
      { if: 'flag m_eclipse1 !flag m_done',
        say: ['Sit, child. Tell an old woman something. Do you think the moon gets lonely, up there on her own?', 'Sit. Do you think the moon gets lonely?'],
        re: [
          { t: ['She said the moon leaves her.', 'She said the moon leaves her.'], if: 'choice m_deal=ask', f: 1,
            say: [['m_winnie', 'Did she. Then it is not the moon that is lonely, child. It is her. That is worse.', 'Then it is not the moon. It is her. That is worse.']] },
          { t: ["Maybe. That's why we keep looking.", 'Maybe. So we keep looking.'], tone: 'kind', f: 1,
            say: [['m_winnie', 'Ha. Yes. A thing that is looked at is never quite alone. You are cleverer than your horns.', 'Yes. Looked-at things are not alone.']] },
          { t: ['She has Ollie.', 'She has Ollie.'], tone: 'silly', f: 0.5,
            say: [['m_winnie', 'Everybody has Ollie. Ollie gets everywhere. Look behind you. No. Teapot.', 'Everybody has Ollie. He gets everywhere.']] },
        ] },
      // after Ash has been down: Ripple, and a message (said winnie_hello)
      { if: 'power dive !flag m_eclipse1',
        say: ['You have been down. I can tell. You have the look the merfolk have, as if you are listening to something far off.', 'You went down. You look like the merfolk now.'],
        re: [
          { t: ['I met the Queen, and Sir Kipper.', 'I met the Queen and Sir Kipper.'],
            say: [['m_winnie', 'Coralia. She calls me Tidewife. I call her dear. One of us minds.', 'She calls me Tidewife. I call her dear.']] },
          { t: ['Do you know Elder Ripple?', 'Do you know Elder Ripple?'],
            next: { say: ['Ripple. Oh, I know Ripple. When we were young we wrote letters in bottles. He could not come up, and I could not go down.', 'We wrote letters in bottles, long ago.'],
              re: [
                { t: ["I'll tell Ripple you said hello.", "I'll tell Ripple hello."], tone: 'kind', f: 0.75, then: ['said winnie_hello'],
                  say: [['m_winnie', 'Do. Tell him Ollie is still in the teapot. He will know what that means.', 'Tell him Ollie is still in the teapot.']] },
                { t: ['Why did you stop writing?', 'Why did you stop?'],
                  say: [['m_winnie', 'The bottles kept washing up on my own beach. The sea has opinions.', 'The bottles kept coming back to me.']] },
              ] } },
        ] },
      { if: 'stage=m_lumen !power dive',
        say: ["Still dry, child? Lumen won't come up to meet you. You'll have to go down to it.", 'Still dry? You must go down to Lumen.'],
        re: [
          { t: ['How do I breathe under water?', 'How do I breathe under water?'],
            say: [['m_winnie', 'I do not know. I am not a dragon. But Ember went down there, and she came back up. Go and ask her how.', 'Ember went down and came back. Ask her.']] },
          { t: ['Did you ever see Lumen?', 'Did you ever see Lumen?'],
            say: [['m_winnie', 'Only the top of the tower, every morning of my life. When I was small I thought it was a candle somebody forgot.', 'Only the tower. I thought it was a candle.']] },
        ] },
      // the first meeting, if Ash comes to the Shell Hut before the mayor has met him
      { if: 'stage=m_drift !flag m_dabble', once: true,
        say: ["A dragon at my door. Ollie, put the kettle away. Have you met our mayor yet, child? He'll want to blame you for something.",
          'A dragon! Have you met the mayor yet?'],
        re: [
          { t: ['Not yet. Should I?', 'Not yet. Should I?'],
            say: [['m_winnie', 'He is on the Town Raft. Go and let him tell you it is a fish. Then come back.', 'He is on the Town Raft. Then come back.']] },
          { t: ['Who is Ollie?', 'Who is Ollie?'],
            say: [['m_winnie', 'My octopus. He lives in the teapot. Do not make tea.', 'My octopus. He lives in the teapot.']] },
        ] },
      // after she asked what happens to Driftwood, while Ash works it out (her story is the chapter's next step)
      { if: 'stage=m_drift step m_drift.ask !solved wobbly_tide',
        say: ["You've looked, child. Now sit with it. What happens to us, if it keeps on?", 'You looked. Now think. What happens to us?'],
        re: [
          { t: ["I'm still thinking about it.", "I'm still thinking."],
            say: [['m_winnie', 'Good. Most people stop at the first answer. Dabble stopped at the fish.', 'Good. Dabble stopped at the fish.']] },
          { t: ["Will you tell me if I'm right?", "Will you say if I'm right?"],
            say: [['m_winnie', 'I will tell you if you are wrong. That is quicker.', 'I will say if you are wrong.']] },
        ] },
      { ask: ['Why does Ollie live in a teapot?', 'Why the teapot?'],
        say: ['He came in for the warm one winter and never left. I make my tea in a pan now. It tastes of pan.', 'He came in to get warm. He stayed.'] },
      { ask: ['How do you read the tide?', 'How do you read the tide?'],
        say: ['Sixty years of looking at it. The tide tells you what the moon is doing, if you are patient. Lately it shouts.', 'Sixty years of looking. Now it shouts.'] },
      { ask: ['Elder Yara watches the moon too.', 'Elder Yara watches the moon too.'],
        say: ['Does she. Good. Somebody up your way should. Tell her an old woman by the sea says hello, and to wear a shawl.', 'Good. Tell her hello. And to wear a shawl.'] },
      { idle: [['Sit, child. What is it?', 'Sit. What is it?'], ['The tide can wait. Go on.', 'Go on.']] },
      { bye: [['Mind the step. The hut moves.', 'Mind the step.'], ['Go on, then. Ollie waves.', 'Ollie waves.']] },
      { bark: true, say: ['Shh, Ollie. Not now, Ollie.', 'Shh, Ollie.'] },
    ],

    // ---------------------------------------------------------------- Rowan Knotwood, the Rope Shed
    // Practical and short. A knot for every feeling (her own joke). Her dad tied the eleven knots that hold the town.
    m_rowan: [
      { if: 'quest m_ferry done', once: true,
        say: ['That "thank you" knot is still holding. Biggest knot in the lagoon. Folk row over from Palmcrest just to look at it.', 'My thank-you knot still holds. People come to look.'],
        re: [
          { t: ['Your dad would like that knot.', 'Your dad would like it.'], tone: 'kind', f: 0.75,
            say: [['m_rowan', 'He would. He would say it was lopsided. It is.', 'He would. He would say it is lopsided.']] },
          { t: ['Do you charge them to look?', 'Do you charge them?'],
            say: [['m_rowan', 'A shell each. I am saving up for rope.', 'A shell each. For rope.']] },
        ] },
      { if: 'power dive !seen q_g_mirrow_board', option: ['Know any good boat stories?', 'Any boat stories?'], promise: 'q_g_mirrow',
        say: ["My knot teacher, Old Sal of Lake Mirrow, writes that Dell's first boat sank there on launch day. Right down a plughole by a big rock.",
          "Dell's first boat sank in Lake Mirrow. Down a plughole!"] },
      // the first meeting (the ferry quest only opens once the Baron is out of the Gate)
      { if: '!quest m_ferry started', once: true,
        say: ['Rowan Knotwood. This is my "pleased to meet you" knot. Hold this end. No, the other end.', 'I am Rowan. This knot means hello. Hold this end.'],
        re: [
          { t: ["What's it for, really?", "What's it for, really?"],
            say: [['m_rowan', 'For when a dragon walks onto my raft without asking. It is the polite version.', 'For dragons on my raft. The polite version.']] },
          { t: ['You have a knot for everything?', 'A knot for everything?'],
            say: [['m_rowan', 'Hello, goodbye, sorry, go away. Most days I only need the last one.', 'Most days I only need "go away".']] },
        ] },
      { if: 'quest m_ferry active',
        say: ['Forts first, then the posts. A post leans like it has had a long day. Something heavy, landing from above, should sort it.', 'Forts first. Then slam the posts down.'],
        re: [
          { t: ['Something heavy, like me?', 'Something heavy, like me?'],
            say: [['m_rowan', 'Like you, landing hard. I have seen you jump. It will do.', 'Like you, landing hard. It will do.']] },
          { t: ['Why do the posts lean?', 'Why do the posts lean?'],
            say: [['m_rowan', 'The crabs push them over. Crabs push everything. It is all they know how to do.', 'The crabs push them. Crabs push everything.']] },
        ] },
      { if: 'stage>=m_reef !flag m_ferry_on', fact: 'm4s_ferry_lines=cut',
        say: ['The Crab Pirates cut my ferry lines. Every one. Who lets a crab be a pirate?', 'Crab Pirates cut my ferry lines!'],
        re: [
          { t: ['Do they wear little hats?', 'Do they wear little hats?'],
            say: [['m_rowan', 'Tiny ones, with feathers. I would laugh if I was not so cross.', 'Tiny feathered hats. I am too cross to laugh.']] },
          { t: ['Can I help with the lines?', 'Can I help?'], if: '!flag m_puff_done',
            say: [['m_rowan', 'Not while the Baron is stuck in the Gate. His whole crab crew is guarding him. Get him out, and then we will talk.', 'Not while the Baron is stuck. Get him out first.', { fact: 'm4s_sunken_gate=plugged' }]] },
          { t: ["The Baron's out. Can I help now?", "The Baron's out. Can I help?"], if: 'flag m_puff_done',
            say: [['m_rowan', 'Then ask me about the knot on that post. I tied it for somebody like you.', 'Then ask me about my knot.', { fact: 'm4s_sunken_gate=open' }]] },
        ] },
      // her moment (the old TALK chat), once Ash has seen the sun go out
      { if: 'flag m_eclipse1 !flag m_done',
        say: ['This is my "tell me something" knot. You have been under the sea and back. What is the bravest thing you ever did?', 'This knot means "tell me". What was your bravest thing?'],
        re: [
          { t: ['I said sorry to someone I hurt.', 'I said sorry to someone.'], tone: 'kind', f: 0.75,
            say: [['m_rowan', 'That is the hard knot. Hardest one I know. Good.', 'That is the hardest knot. Good.']] },
          { t: ['I climbed a dragon mountain.', 'I climbed a dragon mountain.'], tone: 'brave', f: 0.75,
            say: [['m_rowan', 'That is the big knot. I tie it on the mast in a storm. Good knot.', 'That is the big knot. A storm knot. Good.']] },
          { t: ["I ate Gilly's fish pudding.", "I ate Gilly's fish pudding."],
            say: [['m_rowan', '...That is the "I am so sorry" knot. Here. Keep it.', 'That is the "so sorry" knot. Keep it.']] },
        ] },
      { ask: ['Who taught you your knots?', 'Who taught you knots?'],
        say: ['My dad. He tied the first eleven knots that hold this town together. I check every one, every morning. Forty years, and they have held.',
          'My dad tied the town together. I check every knot.'] },
      { ask: ['What knot did Dell tie up with?', 'What knot did Dell use?'], if: 'flag m_dell_docked',
        say: ['A granny knot. A granny knot, on a sea boat. I have retied it. Do not tell him.', 'A granny knot! I fixed it. Shh.'] },
      { ask: ['Can you teach me one knot?', 'Teach me a knot?'],
        say: ['One. This is a "come home" knot. You tie it round your finger, and you do not take it off until you are home.', 'A "come home" knot. Keep it on till home.'] },
      { idle: [['*ties a "go on" knot*', '*ties a go-on knot*'], ['Mind the ropes. What is it?', 'Mind the ropes.']] },
      { bye: [['*ties a "see you soon" knot*', '*ties a see-you knot*'], ['Off my raft, then. Nicely.', 'Off my raft. Nicely.']] },
      { bark: true, say: ['Bowline, clove hitch, sheepshank, "go away" knot...', '*ties knots*'] },
    ],

    // ---------------------------------------------------------------- Squint, the lookout (a kid)
    // Loud, brave, says "Land ho!" at everything (her own joke). Scared of the dark, so she watches for lights. Ned's girl.
    m_squint: [
      { if: 'quest m_lighthouse done', once: true,
        say: ['Grandpa came down off Gull Isle for supper! Gilly made fish. He grumbled the whole time and had seconds.',
          'Grandpa came down for supper! He had seconds!'],
        re: [
          { t: ['Did he say anything about me?', 'Did he talk about me?'],
            say: [['m_squint', 'He said "Hmph. Good dragon." That is the most he has ever said about anybody.', 'He said "Hmph. Good dragon." That is a lot!']] },
          { t: ['Did you wave at the light?', 'Did you wave at the light?'],
            say: [['m_squint', 'All night. It waved back. It is a lighthouse, so it had to.', 'All night. It waved back!']] },
        ] },
      // what Ned told Ash to tell her (said ned_eyepatch)
      { if: 'said ned_eyepatch', once: true,
        say: ['Grandpa says the eyepatch suits me? He said that? Out loud?', 'Grandpa says my eyepatch suits me? Out loud?'],
        re: [
          { t: ['Out loud. With his whole mouth.', 'Out loud. His whole mouth.'],
            say: [['m_squint', 'Then I am never taking it off. Not even to sleep.', 'Then I will never take it off!']] },
          { t: ['He also said eat your vegetables.', 'And eat your vegetables.'],
            say: [['m_squint', '...Everything here is fish. Does fish count?', 'Everything here is fish. Does that count?']] },
        ] },
      { if: 'power burrow !flag gate_q_g_xmark', option: ['Seen any treasure, lookout?', 'Seen any treasure?'], promise: 'q_g_xmark',
        say: ['Grandpa says Saltbeard hid his best treasure on the Rockpools, by an X. Everybody digs the X. Nobody digs DEEP.',
          'Saltbeard hid treasure by an X. Nobody digs deep!'] },
      // the first meeting
      { if: '!quest m_lighthouse started', once: true,
        say: ["Dragon ho! I saw you coming from the crow's nest. I'm Squint, the lookout. The eyepatch is pretend. The lookout part is real.",
          "Dragon ho! I'm Squint, the lookout!"],
        re: [
          { t: ['What else can you see from up there?', 'What else can you see?'],
            say: [['m_squint', "A raft of chickens going the wrong way, the Spire, and my grandpa's lighthouse. Still dark.", "Chickens, the Spire, and Grandpa's dark lighthouse."]] },
          { t: ['Can I look through your spyglass?', 'Can I use your spyglass?'],
            say: [['m_squint', "If you don't drop it. It's my only one. It's at the top of the ladder.", "Don't drop it! It's up the ladder."]] },
        ] },
      { if: 'act=4 flag m_done',
        say: ["Nothing to report. No moon, no stars. Just Grandpa's light going round. I'm not scared. I'm keeping watch.", "No moon. I'm not scared. I'm on watch."],
        re: [
          { t: ["You're allowed to be scared.", "You're allowed to be scared."], tone: 'kind', f: 0.75,
            say: [['m_squint', '...A bit. But there is a light on. Lookouts watch the light.', 'A bit. But the light is on.']] },
          { t: ['Keep watch for me, then.', 'Keep watch for me.'],
            say: [['m_squint', 'Lookout reporting. I will see you coming back before anybody. That is my job.', 'I will see you come back first!']] },
        ] },
      { if: 'quest m_lighthouse active !flag m_lighthouse_lit', fact: 'm4s_lighthouse=dark',
        say: ["Did you take Grandpa the sandwich? Don't tell him it's fish. He knows. Don't tell him anyway.", "Did Grandpa get the sandwich?"],
        re: [
          { t: ['Is he always this grumpy?', 'Is he always grumpy?'],
            say: [['m_squint', 'Only since the moths came. Before that he sang. Badly. All night.', 'Only since the moths. He used to sing.']] },
          { t: ["I'm on my way up now.", "I'm going up now."],
            say: [['m_squint', 'Climb carefully. The steps are old, and so is he.', 'Climb carefully. The steps are old.']] },
        ] },
      // her moment (the old TALK chat), after the sun went out
      { if: 'flag m_eclipse1 !flag m_done',
        say: ['Lookout question! When the sun went out I had a big think. Would you rather be a pirate, or a lookout?', 'Lookout question! Pirate, or lookout?'],
        re: [
          { t: ['A lookout. Then I can warn my friends.', 'A lookout. To warn my friends.'], tone: 'kind', f: 0.75,
            say: [['m_squint', 'Correct. Lookouts look out for people. It is in the name.', 'Correct! We look out for people.']] },
          { t: ['A good pirate.', 'A good pirate.'], f: 0.5,
            say: [['m_squint', 'A good pirate is just a lookout with a hat. I will allow it.', 'That is a lookout with a hat. Allowed.']] },
        ] },
      { if: 'flag m_eclipse1 !flag m_eclipse2', fact: 'm4s_moon=bitten',
        say: ["Moon ho! Somebody's taken another bite out of it. Through my spyglass it looks like a biscuit somebody's been at.", 'Moon ho! Someone bit the moon again!'],
        re: [
          { t: ['It was a giant moth.', 'It was a giant moth.'],
            say: [['m_squint', 'I saw her! I said "MOTH HO" and nobody listened. Nobody ever listens to the lookout.', 'I saw her! Nobody listens to the lookout.']] },
          { t: ['Keep an eye on it for me.', 'Keep an eye on it.'],
            say: [['m_squint', 'One eye. The other one is pretend.', 'One eye. The other is pretend.']] },
        ] },
      { if: '!flag m_lighthouse_lit !quest m_lighthouse active', fact: 'm4s_lighthouse=dark',
        say: ["*looks at Gull Isle through her spyglass* Still dark. I check every hour. Grandpa's up there.", "Still dark. Grandpa's up there."],
        re: [
          { t: ['Is he all right up there?', 'Is he all right?'],
            say: [['m_squint', "He eats. He grumbles. He won't come down. Something is wrong, and he won't say what.", "He won't come down. Something is wrong."]] },
          { t: ["How do you know he's there?", "How do you know he's there?"],
            say: [['m_squint', 'Every night he waves a little lamp at me. Not the big one. A little one.', 'He waves a little lamp at me. Every night.']] },
        ] },
      { ask: ["What's the best thing you've spotted?", "What's the best thing you saw?"],
        say: ['A whale. Once. It might have been an island. It went under, so it was a whale. Or a shy island.', 'A whale. Or a shy island.'] },
      { ask: ['Why the eyepatch?', 'Why the eyepatch?'],
        say: ["So I'm always ready to be a pirate. I'm not a pirate. I'm ready.", "So I'm ready to be a pirate. Just ready."] },
      { ask: ['My friend Rook wants to be a knight.', 'Rook wants to be a knight.'],
        say: ['Tell him lookouts are better. We see the danger first. Knights just get there second.', 'Lookouts are better. We see danger first!'] },
      { idle: [['Lookout reporting! Go on.', 'Lookout reporting!'], ["Nothing to report. What's yours?", 'Nothing to report.']] },
      { bye: [['Land ho! I mean, bye!', 'Bye!'], ["I'll watch you go. That's my job.", 'I will watch you go.']] },
      { bark: true, say: ["LAND HO! ...It's still Palmcrest.", 'LAND HO! Still Palmcrest.'] },
      { bark: true, if: '!flag m_lighthouse_lit', fact: 'm4s_lighthouse=dark',
        say: ['*looks at Gull Isle through her spyglass* Still dark. Still dark, Grandpa.', "Grandpa's light is still dark."] },
    ],

    // ---------------------------------------------------------------- Cook Gilly, the Floating Kitchen (the inn)
    // Warm, chatty, puts fish in everything. Has written to Hilde in Hearthold for years and never met her.
    m_gilly: [
      { if: 'quest m_moonfish done', once: true,
        say: ['I painted the Moonfish on my sign. Now everybody wants to eat here. I tell them it is not on the menu. Some fish are for looking at.',
          'I painted the Moonfish on my sign. Not on the menu!'],
        re: [
          { t: ['You let her go. That was kind.', 'You let her go. That was kind.'], tone: 'kind', f: 0.5,
            say: [['m_gilly', 'Do not tell anyone. I have a reputation. Everything I meet ends up in a pie.', 'Shh. Everything I meet ends up in a pie.']] },
          { t: ['Is she smiling on the sign?', 'Is she smiling on the sign?'],
            say: [['m_gilly', 'Fish do not smile. Mine does. I am the cook, I am allowed.', 'Fish do not smile. Mine does.']] },
        ] },
      { if: 'power dive !item m4_basket !item m4_sweater !flag gate_q_g_steam', option: ['Heard from Hilde lately?', 'Heard from Hilde?'], promise: 'q_g_steam',
        say: ['Hilde in Hearthold writes that the Steamwell ate her knitting basket. Basket and all! Whoever fishes it out gets a sweater.',
          'The Steamwell ate Hilde\'s basket. Fish it out!'] },
      { if: 'flag m_dell_away stage<m_reforge', fact: 'm4s_dell_boat=away',
        say: ["Dell left Mags a note: don't touch the sandwiches. She's been staring at them for two days. I made her fish instead.", 'Mags must not touch the sandwiches. I made her fish.'],
        re: [
          { t: ['Did Mags eat any of them?', 'Did Mags eat them?'],
            say: [['m_gilly', 'Not one. She is very loyal. She is also very hungry.', 'Not one. Loyal. And hungry.']] },
          { t: ["Dell's bringing my mom here.", "Dell's bringing my mom."],
            say: [['m_gilly', 'Then I will make her something that is not fish. I do not know how. I will learn.', 'Then I will cook her something not fish. Somehow.']] },
        ] },
      // the first meeting, if Ash comes in before the chapter sends him (the chapter's own visit is her fish clue)
      { if: '!clue m4_gilly_fish', once: true,
        say: ['Hilde in Hearthold wrote me about a little dragon who sorted out the winter up there. That will be you. Sit. You look starving.',
          'Hilde wrote about a little dragon. That is you! Sit.'],
        re: [
          { t: ["Hilde's soup is the best.", "Hilde's soup is the best."],
            say: [['m_gilly', 'Do not tell her I said so, but it is. Mine has fish in.', 'It is. Shh. Mine has fish in.']] },
          { t: ["I'm not that hungry.", "I'm not that hungry."],
            say: [['m_gilly', 'Everybody says that. Then they smell the pudding, and they are still not hungry.', 'Everybody says that. Then they smell the pudding.']] },
        ] },
      { if: 'stage=m_drift clue m4_gilly_fish',
        say: ['Did you find out about my fish? A whole school came in at noon today, all in a muddle, looking up.', 'Did you find out about my fish? They are lost.'],
        re: [
          { t: ["It's the moon. It's getting smaller.", "It's the moon. It's shrinking."], if: 'solved wobbly_tide',
            say: [['m_gilly', 'Then my poor fish are looking for something that is not there. I will leave a lamp out for them.', 'Poor fish. I will leave a lamp out.']] },
          { t: ["Not yet. I'm still asking around.", 'Not yet. Still asking.'],
            say: [['m_gilly', 'Ask Winnie. And take her a pudding. She will not eat it. It is polite.', 'Ask Winnie. Take her a pudding.']] },
        ] },
      { if: 'flag tk_come=yes flag m_dell_docked !flag m_dell_away',
        say: ["That baker girl Tikka says bread is better than fish. We're not speaking. We speak all day.", 'Tikka says bread beats fish. We argue all day.'],
        re: [
          { t: ['Have you tried her lumpy buns?', 'Have you tried her buns?'],
            say: [['m_gilly', 'Every one. With fish on. She threw a spoon at me. Lovely girl.', 'With fish on. She threw a spoon. Lovely girl.']] },
          { t: ['Bread and fish go together.', 'Bread and fish go together.'],
            say: [['m_gilly', 'That is what I said! A fish sandwich! She left the room.', 'That is what I said! She left the room.']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ["No moon, so the fish have all gone deep and quiet. I'm cooking anyway. Somebody will come in out of the dark hungry.", 'The fish went deep. I cook anyway.'],
        re: [
          { t: ['Save me a bowl.', 'Save me a bowl.'],
            say: [['m_gilly', 'A bowl with a lid on, by the stove, till you are back. That is a promise.', 'A bowl by the stove, till you are back.']] },
          { t: ['Are you scared of the dark?', 'Are you scared of the dark?'],
            say: [['m_gilly', 'I am a cook. I am scared of empty plates. So I fill them.', 'I am scared of empty plates. So I fill them.']] },
        ] },
      { if: 'quest m_moonfish active',
        say: ["Shh. I'm being patient. I'm very bad at it. Is it coming?", "Shh. I'm being patient. Is it coming?"],
        re: [
          { t: ["It's fast. I'm still trying.", "It's fast. I'm trying."],
            say: [['m_gilly', 'Swim behind it and push. It is shy, like all the pretty ones.', 'Swim behind it and push. It is shy.']] },
          { t: ['Do you want it for the menu?', 'Is it for the menu?'],
            say: [['m_gilly', 'No! ...No. I just want to see it. Mostly.', 'No! I just want to see it. Mostly.']] },
        ] },
      // her moment (the old TALK chat), once Ash is back from under the sea
      { if: 'stage>=m_reef !flag m_done',
        say: ["Chef's question! You've been all over the sea. What's the strangest thing you ever ate?", "Chef's question! What's the strangest thing you ate?"],
        re: [
          { t: ["Mom's burnt toast. So she'd smile.", "Mom's burnt toast."], tone: 'kind', f: 0.75,
            say: [['m_gilly', 'Oh, my heart. That is the best recipe there is. Burnt, with love.', 'Oh. That is the best recipe. Burnt, with love.']] },
          { t: ['A lava pepper, on a dare.', 'A lava pepper, on a dare.'], tone: 'brave', f: 0.5,
            say: [['m_gilly', 'A lava pepper? Could you put it in a fish? Could you put it in two fish?', 'A lava pepper? In a fish? In two fish?']] },
        ] },
      { ask: ['How do you know Hilde?', 'How do you know Hilde?'],
        say: ['She sends me soup recipes. I send back fish. She says I ruin every one. We have never met. Best friend I have got.', 'We trade recipes. We never met. Best friend!'],
        re: [
          { t: ["I'll tell her you said so.", "I'll tell her that."], tone: 'kind', f: 0.5, then: ['said gilly_hilde'],
            say: [['m_gilly', 'Tell her it needs more fish. She will know I am joking. She will put salt in.', 'Tell her it needs more fish. She will laugh.']] },
          { t: ['Why have you never met?', 'Why have you never met?'],
            say: [['m_gilly', 'Every spring I mean to go. Then the town drifts off somewhere. It is hard to post a cook.', 'The town keeps drifting. Hard to post a cook.']] },
        ] },
      { ask: ['What is in fish pudding?', 'What is in fish pudding?'],
        say: ['Fish, and pudding, together at last. You would be the first to finish one.', 'Fish and pudding. Nobody has finished one.'] },
      { idle: [['Hungry? Go on.', 'Hungry?'], ["The pot's on. What is it?", "Pot's on. Yes?"]] },
      { bye: [['Come back hungry!', 'Come back hungry!'], ['Take a fish for the road. No? Next time.', 'Next time, a fish.']] },
      { bark: true, say: ['FISH! Get your fish! Fresh fish, old fish, fish-shaped fish!', 'FISH! Get your fish!'] },
    ],

    // ---------------------------------------------------------------- Old Ned, the Gull Isle lighthouse (at the top)
    // Grumpy, short, "Hmph." Fifty years keeping the light; ashamed he let it go out. Squint's grandpa; Agatha's cousin.
    // (Ash has to climb the tower to talk to him: x3_people says so from the ground.)
    m_ned: [
      { if: 'quest m_lighthouse done', once: true,
        say: ['Silver light, every night. The moths still come. Now they just sit and look at it. Like me. Hmph.', 'Silver light! Moths just look at it now.'],
        re: [
          { t: ['Squint says you had seconds.', 'Squint says you had seconds.'],
            say: [['m_ned', 'Hmph. The fish was eatable. Do not tell Gilly.', 'Hmph. It was eatable. Do not tell Gilly.']] },
          { t: ['The moths look happy.', 'The moths look happy.'],
            say: [['m_ned', 'They sit and stare at it all night. I know the feeling. Hmph.', 'They stare at it all night. Like me.']] },
        ] },
      // the first meeting: Agatha's letters got here first
      { if: '!quest m_lighthouse done', once: true,
        say: ["Who's that, climbing my lighthouse? ...A dragon. Hmph. Agatha wrote me about a dragon. Lit her light, she says. Hers spins.",
          'A dragon? Agatha wrote about you. Hmph.'],
        re: [
          { t: ['I helped her, yes. It spins nicely.', 'I helped her. It spins nicely.'],
            say: [['m_ned', 'Hmph. Then you know lamps. Mine has gone out. Do not look at it like that.', 'Then you know lamps. Mine is out.']] },
          { t: ['Does yours spin too?', 'Does yours spin too?'],
            say: [['m_ned', 'It does not. It shines, like a proper light. Spinning is for show-offs.', 'No. It shines. Spinning is for show-offs.']] },
        ] },
      { if: '!clue m4_ned_helmets', once: true, then: ['clue m4_ned_helmets'],
        say: ["Moths in little plumed helmets came for my lamp's GLASS. Tried to unscrew it! It's bolted on. Ha. HA.",
          'Moths in helmets tried to steal my lamp glass. Ha!'],
        re: [
          { t: ['Why would a moth want glass?', 'Why would a moth want glass?'],
            say: [['m_ned', 'Shiny. Somebody out there is collecting, if you ask me. Nobody does.', 'Shiny. Somebody is collecting it.']] },
          { t: ['Did they have little swords?', 'Did they have little swords?'],
            say: [['m_ned', 'Little swords, little helmets, little manners. None.', 'Little swords. No manners.']] },
        ] },
      { if: 'act=4 flag m_done flag m_lighthouse_lit', fact: 'm4s_lighthouse=lit',
        say: ["No moon. My light's the only one left on this whole sea, so it stays on. That's all a lighthouse is.", 'No moon. My light stays on.'],
        re: [
          { t: ["Keep it on till I'm back.", "Keep it on till I'm back."],
            say: [['m_ned', 'Hmph. I would keep it on anyway. ...For you, I will polish it.', 'I would anyway. For you, I will polish it.']] },
          { t: ["Squint's watching it.", "Squint's watching it."],
            say: [['m_ned', 'I know. I wave. Do not tell her I wave.', 'I know. I wave. Shh.']] },
        ] },
      // his moment (the old TALK chat), after the sun went out
      { if: 'flag m_eclipse1 !flag m_done',
        say: ['Hmph. You. Dragon. When the sun went out I was scared. Fifty years on this rock, and scared. What do you do, when you are scared?',
          'The sun went out. I was scared. What do you do?'],
        re: [
          { t: ['I think about who is waiting for me.', 'I think about who waits.'], tone: 'kind', f: 0.75,
            say: [['m_ned', '...Aye. That is what a lamp is, you know. Somebody waiting. Hmph.', 'Aye. A lamp is somebody waiting.']] },
          { t: ['I go toward the scary thing anyway.', 'I go toward it anyway.'], tone: 'brave', f: 0.75,
            say: [['m_ned', 'Hmph. Good. That is what a light does. Every night, toward the storm.', 'Good. A light does that. Toward the storm.']] },
        ] },
      // his message for Squint (said ned_eyepatch: she hears it next)
      { if: 'quest m_lighthouse started !flag m_done',
        say: ['Tell Squint I am fine. Tell her to eat her vegetables. Tell her the eyepatch suits her.', "Tell Squint I'm fine. And the eyepatch suits her."],
        re: [
          { t: ["I'll tell her. All three.", "I'll tell her. All three."], tone: 'kind', f: 0.75, then: ['said ned_eyepatch'],
            say: [['m_ned', 'Hmph. Good. ...Start with the eyepatch.', 'Good. Start with the eyepatch.']] },
          { t: ['Come down and tell her yourself.', 'Tell her yourself.'], if: '!flag m_lighthouse_lit',
            say: [['m_ned', 'When the lamp is lit. Not before.', 'When the lamp is lit.', { fact: 'm4s_lighthouse=dark' }]] },
          { t: ['You could tell her at supper.', 'Tell her at supper.'], if: 'flag m_lighthouse_lit',
            say: [['m_ned', 'I could. I will not. Somebody has to be the grumpy one.', 'I could. I will not. I am the grumpy one.', { fact: 'm4s_lighthouse=lit' }]] },
        ] },
      { if: '!flag m_lighthouse_lit', fact: 'm4s_lighthouse=dark',
        say: ['Moths. Every night, all over my lamp. Then it went out, and they still came. Moths have no manners.',
          'Moths sat on my lamp till it went out. No manners!'],
        re: [
          { t: ['Can I help you light it?', 'Can I help light it?'],
            say: [['m_ned', 'Did Squint send you? ...Hmph. Course she did.', 'Did Squint send you? Of course she did.']] },
          { t: ["Why won't you come down?", "Why won't you come down?"],
            say: [['m_ned', 'You do not leave a light. Not even a dark one. Somebody might need it.', 'You do not leave a light. Not even a dark one.']] },
        ] },
      { ask: ['What is Agatha like?', 'What is Agatha like?'],
        say: ['Agatha. My cousin. The Gearhaven light. Hers spins. She tells me in every letter. I know it spins, Agatha.', 'My cousin. Her light spins. She tells me every letter.'] },
      { ask: ['How long have you kept the light?', 'How long have you kept it?'],
        say: ['Fifty years. Not one ship on the rocks. Then the moths came, and I let it go out. I am not proud of that.', 'Fifty years. Then I let it go out.'] },
      { idle: [['Hmph. What now?', 'Hmph. What?'], ['Mind the moths. Go on.', 'Mind the moths.']] },
      { bye: [["Mind the steps. They're older than me.", 'Mind the steps.'], ['Hmph. Off you go.', 'Off you go.']] },
      { bark: true, if: '!flag m_lighthouse_lit', fact: 'm4s_lighthouse=dark', say: ["Shoo. Shoo. Go and sit on someone else's lamp.", 'Shoo, moths. Shoo.'] },
      { bark: true, if: 'flag m_lighthouse_lit', fact: 'm4s_lighthouse=lit', say: ['*polishes the great lamp* Silver. Ha. Silver.', '*polishes the lamp* Silver!'] },
    ],

    // ================================================================ Coralcombe (the merfolk, inside the area; talk v11, J11b)
    // Lumen's grandchildren. They know Ash through Sir Kipper, who kept Ember's flame in Lumen and saw him take it, and
    // through the old songs about the girl with horns. Their part of the act: the Queen and the scouts' report (m_coral,
    // the chapter's steps), the Baron in the Sunken Gate (m_reef), the eclipses seen from under the sea, moonfire coming
    // home, and Hush flying over the reef if she is let go.

    // ---------------------------------------------------------------- Queen Coralia of the Lumenfolk
    // Calm, regal, dry; makes one joke a year. Calls Ash "small dragon". The chapter plays her two story scenes.
    m_coralia: [
      // what Ash told Sir Kipper about his seahorse (said kipper_warhorse)
      { if: 'said kipper_warhorse', once: true,
        say: ['Sir Kipper tells everyone that a dragon called Lady Bubbles a warhorse. He has told me eleven times today.', 'Kipper says you called his seahorse a warhorse. Eleven times.'],
        re: [
          { t: ['She is one. She carried him home.', 'She is one.'],
            say: [['m_coralia', 'She is. Do not tell him I agree. He would never stop.', 'She is. Do not tell him I agree.']] },
          { t: ['Sorry. I made him very happy.', 'Sorry. He was so happy.'],
            say: [['m_coralia', 'Never be sorry for that. A happy knight is a quiet knight. Eventually.', 'Never be sorry. Happy knights go quiet. Eventually.']] },
        ] },
      { if: 'choice m_hush=free', once: true,
        say: ["A white moth flew low over the reef, glowing softly. She didn't stop to visit. You did a kind thing, small dragon.",
          'A white moth flew over, glowing. You did a kind thing.'],
        re: [
          { t: ['She was only ever scared.', 'She was only scared.'], tone: 'kind', f: 0.5,
            say: [['m_coralia', 'Most things that bite are. That does not make the bite smaller. It makes you kinder to see it.', 'Most biting things are. You saw it.']] },
          { t: ['Did your lookouts see her?', 'Did your lookouts see her?'],
            say: [['m_coralia', 'All of them. They have asked for a song about it. They always ask for a song.', 'All of them. They want a song.']] },
        ] },
      { if: 'choice c_vesper=friend stage>=m_sable', once: true,
        say: ['A girl in a moth mask swam up to wave at our lookouts. She said she was your cousin. She also took two pearls.', 'A moth-mask girl waved at us. She took two pearls!'],
        re: [
          { t: ["That's Vesper. I'll get them back.", "That's Vesper. I'll get them back."],
            say: [['m_coralia', 'Let her keep them. She asked first, then took them anyway. That is more manners than most pirates.', 'Let her keep them. She asked first.']] },
          { t: ["She's really nice. Mostly.", "She's nice. Mostly."],
            say: [['m_coralia', 'Mostly is how most families are. I have an uncle who is a sea cucumber about it.', 'Most families are "mostly".']] },
        ] },
      { if: 'power moonfire', once: true,
        say: ['Moonfire. The girl with horns taught it to Lumen, and now a dragon brings it home to us. I will have the old song sung tonight.',
          'Moonfire comes home in a dragon. We sing tonight.'],
        re: [
          { t: ['Can I stay and hear it?', 'Can I stay and hear it?'],
            say: [['m_coralia', 'If you can stay awake. It is very long, and it rhymes "moon" with "moon" a great deal.', 'If you stay awake. It is very long.']] },
          { t: ['She left it for me to find.', 'She left it for me.'],
            say: [['m_coralia', 'Then it has come home twice. Once to the sea, and once to her family.', 'Then it came home twice.']] },
        ] },
      { if: 'power moonfire !clue m4_iska_note', option: ['Do the old songs say anything about moonfire?', 'Songs about moonfire?'], promise: 'q_g_iska',
        say: ['Our songs say the girl with horns had a friend called Iska. Iska hid a word in her own Ward-stone, behind stairs only moonlight holds.',
          'Iska hid a word in her Ward-stone.'] },
      { if: 'act=4 flag m_done',
        say: ['The moon is gone, small dragon. Every lamp in Coralcombe is lit, and the sea is still dark.', 'The moon is gone. The sea is dark.'],
        re: [
          { t: ["I'll bring the light back.", "I'll bring the light back."], tone: 'brave', f: 0.5,
            say: [['m_coralia', 'I believe you. A queen does not say that often. Go.', 'I believe you. Go.']] },
          { t: ['Will the reef be all right?', 'Will the reef be all right?'],
            say: [['m_coralia', 'We kept the moon in our lamps once, when Lumen drowned. We can do it again, for a while.', 'We kept the moon in lamps before. We can again.']] },
        ] },
      { if: 'flag m_eclipse2 !flag m_done',
        say: ['A queen is meant to listen to the sea. Lately the sea only says "shhh", and I do not like the way it says it.', 'The sea only says "shhh" now. I do not like it.'],
        re: [
          { t: ["That's Hush. The white moth.", "That's Hush, the white moth."],
            say: [['m_coralia', 'Her? Then she is very unhappy, and very loud about being quiet.', 'Then she is very unhappy. And loud.']] },
          { t: ['What should the sea say?', 'What should the sea say?'],
            say: [['m_coralia', 'Everything at once. Whales, waves, gossip. Not one word of it on purpose.', 'Everything at once. Whales, waves, gossip.']] },
        ] },
      { if: 'flag m_eclipse1 !flag m_eclipse2',
        say: ['When the sun went out, the reef went dark from top to bottom. The children thought it was night and went to bed. I let them.', 'The sun went out. The children went to bed.'],
        re: [
          { t: ['She bit the moon again, up there.', 'She bit the moon again.'],
            say: [['m_coralia', 'We felt it. The whole sea leaned toward her for a moment, as if she had called it.', 'We felt it. The whole sea leaned to her.']] },
          { t: ["I couldn't stop her.", "I couldn't stop her."],
            say: [['m_coralia', 'You are one small dragon, and she covered the sun. Next time, you will be ready, and so will we.', 'You are small. She covered the sun. Next time, be ready.']] },
        ] },
      { if: 'flag m_puff_done !flag m_eclipse1', fact: 'm4s_sunken_gate=open',
        say: ['The Sunken Gate is open, and the whole sea went through it at once. Two of my lookouts were washed to Palmcrest. They enjoyed it.', 'The Sunken Gate is open! The sea rushed through.'],
        re: [
          { t: ['Is the Baron all right?', 'Is the Baron all right?'],
            say: [['m_coralia', 'Smaller, and very cross, and writing a letter to the sea about it. So, yes.', 'Smaller and cross. So, yes.']] },
          { t: ["I'm going east, through the Gate.", "I'm going east now."],
            say: [['m_coralia', 'Then go, and come back. The way under the Reefwall is long, but it is open now.', 'Then go, and come back.', { fact: 'm4s_sunken_gate=open' }]] },
        ] },
      { if: 'flag m_coral_met !flag m_puff_done', fact: 'm4s_sunken_gate=plugged',
        say: ['A pufferfish is stuck in the Sunken Gate. The whole sea is waiting behind him. The sea is not patient.', 'A pufferfish is stuck in the Sunken Gate.'],
        re: [
          { t: ['How do I get him out?', 'How do I get him out?'],
            say: [['m_coralia', 'Something loud and sudden. A fish full of air does not like a bang. Mags on the dock says she has those.', 'Something loud. Fish full of air hate bangs.']] },
          { t: ['How long has he been stuck?', 'How long has he been stuck?'],
            say: [['m_coralia', 'Ten days. He says he is resting. Nobody rests in a door for ten days.', 'Ten days. He says he is resting.']] },
        ] },
      // her moment (the old TALK chat), once she has told Ash the way east
      { if: 'flag m_coral_met !flag m_done',
        say: ['A queen may ask a guest a question. You have been in Lumen, where my people ruled once. What makes a good ruler, small dragon?', 'What makes a good ruler, small dragon?'],
        re: [
          { t: ['Listening, even to the small ones.', 'Listening, even to small ones.'], tone: 'kind', f: 1,
            say: [['m_coralia', 'Even to the small ones. Like you. ...That was a joke. I make one a year. You have had it.', 'Like you. That was my joke for the year.']] },
          { t: ['Going first, so others can follow.', 'Going first, so others follow.'], tone: 'brave', f: 0.5,
            say: [['m_coralia', "Yes. Lumen's priests went out first, the night the moth came. We still sing about it.", 'Yes. Our priests went first. We still sing it.']] },
          { t: ['A really big crown.', 'A really big crown.'],
            say: [['m_coralia', 'Mine is enormous and does nothing at all. It does look nice. You are not entirely wrong.', 'Mine is huge and does nothing. It looks nice.']] },
        ] },
      { ask: ['What is Old Winnie to you?', 'What is Winnie to you?'],
        say: ['The Tidewife up above. She calls me "dear". Nobody calls a queen "dear". I let her.', 'She calls me "dear". I let her.'] },
      { ask: ['Do you still sing to the moon?', 'Do you sing to the moon?'],
        say: ["My grandmother's grandmother sang to it from a balcony in Lumen. I sing to it from the bottom of the sea. I think it still hears.", 'We sang from Lumen. Now from the sea. It hears.'] },
      { ask: ['What do the songs say about Ember?', 'What do songs say of Ember?'],
        say: ['That she came to Lumen when the city still had a sky, taught our priests the moonfire, and ate all of their sugared kelp.', 'She taught our priests moonfire. And ate their kelp.'] },
      { idle: [['Yes, small dragon?', 'Yes, small dragon?'], ['The sea is listening. So am I.', 'I am listening.']] },
      { bye: [['Swim safely, small dragon.', 'Swim safely.'], ['Go. The tide will not wait.', 'Go. The tide will not wait.']] },
      { bark: true, say: ['The tide is restless. So is the queen.', 'The tide is restless.'] },
    ],

    // ---------------------------------------------------------------- Elder Ripple, the Pearl Archive
    // Slow, kind, forgetful; says sorry to fish (his own joke). Wrote letters in bottles to Old Winnie long ago.
    m_ripple: [
      { if: 'quest m_leash done', once: true,
        say: ['Your librarian friend and I have agreed on nothing at all. It has been the best week of my life.', 'Wren and I agree on nothing. Best week ever!'],
        re: [
          { t: ['What do you argue about?', 'What do you argue about?'],
            say: [['m_ripple', 'Spelling. Commas. Whether a moth is a she or an it. She is a she. I have lost that one.', 'Spelling. Commas. Moths. I lost that one.']] },
          { t: ["Wren says you're very clever.", "Wren says you're clever."],
            say: [['m_ripple', 'Does she? Then she has forgotten something too. Sorry, fish.', 'Then she forgot something too. Sorry, fish.']] },
        ] },
      // what Old Winnie sent down (said winnie_hello); his answer goes back up (said ripple_hello)
      { if: 'said winnie_hello', once: true,
        say: ['Winnie says hello? Winnie? From up above? Oh. Sorry, fish. I have something in my eye.', 'Winnie says hello? Oh. Something in my eye.'],
        re: [
          { t: ["She says Ollie's still in the teapot.", "Ollie's still in the teapot."],
            next: { say: ['Still? After all this time? Then she is still Winnie. Will you take something back up for me?', 'Then she is still Winnie. Take her a message?'],
              re: [
                { t: ["I'll take her a message.", "I'll take her a message."], tone: 'kind', f: 0.75, then: ['said ripple_hello'],
                  say: [['m_ripple', 'Tell her I kept every bottle. Every one. In a clam, under my bed.', 'Tell her I kept every bottle.']] },
                { t: ['You should write it yourself.', 'Write it yourself.'],
                  say: [['m_ripple', 'From down here? My bottles always floated back to me. The sea has opinions.', 'My bottles always floated back. The sea has opinions.']] },
              ] } },
          { t: ['Why did you never visit her?', 'Why did you never visit?'],
            say: [['m_ripple', 'She could not come down, and I could not come up. We tried. A whole summer of trying. Sorry, fish. I am fine.', 'She could not come down. I could not go up.']] },
        ] },
      { if: 'quest m_leash active !item m_book_raw !power moonfire',
        say: ['The vault wants moonfire. Not claws, not fire. The old songs say a temple of mirrors keeps it.', 'The vault wants moonfire. Try the mirror temple.'],
        re: [
          { t: ['Where is the temple of mirrors?', 'Where is the mirror temple?'],
            say: [['m_ripple', 'Past a wall nobody can climb, the songs say. The songs are no help at all with directions.', 'Past a wall nobody can climb. The songs say.']] },
          { t: ["I'll come back with moonfire.", "I'll come back with moonfire."],
            say: [['m_ripple', 'Splendid. I may not remember asking. Remind me. Gently.', 'Good. Remind me I asked. Gently.']] },
        ] },
      { if: 'quest m_leash active item m_book_raw',
        say: ['The Book of Moths! Soggy, but whole. Take it to someone who reads old Lumen better than I do. Which is anybody.',
          'Take the book to someone who reads Lumen.'],
        re: [
          { t: ['Sister Wren can read it.', 'Sister Wren can read it.'],
            say: [['m_ripple', 'The librarian on the raft? Then take it up to her, quickly, before it learns to swim.', 'Then take it up to her. Quickly.']] },
          { t: ["Can't you read any of it?", "Can't you read it?"],
            say: [['m_ripple', 'I read the cover. It says "moths". Or possibly "mothers". I have been wrong about that before.', 'The cover says "moths". Or "mothers".']] },
        ] },
      { if: 'power moonfire !clue m4_ring_trails', option: ['What do your records say about the moth?', 'What do the records say?'], promise: 'q_g_ring',
        say: ['The old records say her trails all start at a ring of stones in a wood on the Clockwork Coast. Something is written there in moon-ink, up on the rock beside it.',
          'Her trails start at the Moon Ring. Look from the rock.'] },
      // the first meeting
      { if: '!quest m_leash started', once: true,
        say: ['Oh! A visitor. Elder Ripple, of the Pearl Archive. Have we met? I am sorry. I am sure I would remember a dragon. Probably.', 'Oh, a visitor! I am Elder Ripple. Have we met?'],
        re: [
          { t: ["We haven't. I'm Ash.", "We haven't. I'm Ash."],
            say: [['m_ripple', 'Ash. Ash. I shall write it on my tail. There. Now I will never forget. Sorry, fish.', 'Ash. I will write it on my tail.']] },
          { t: ['What is the Pearl Archive?', 'What is the Pearl Archive?'],
            say: [['m_ripple', 'Every story Lumen ever told, written on pearls. I have read them all. Then I forget them, and I get to read them again.', 'Lumen\'s stories on pearls. I read them, forget, and read again.']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ['The moon has gone out of every story at once. I have read three pearls tonight, and in all of them it is dark.', 'The moon is gone from every story.'],
        re: [
          { t: ['Then write a new one.', 'Then write a new one.'],
            say: [['m_ripple', 'About a small dragon who went up a black mountain. Yes. I will leave the end blank. You fill it in.', 'About a dragon on a mountain. You write the end.']] },
          { t: ['Do any of them end well?', 'Do any end well?'],
            say: [['m_ripple', 'The old ones always do, in the end. It is the middle that is hard. Sorry. That was not about fish.', 'The old ones do. The middle is the hard part.']] },
        ] },
      { if: 'flag m_eclipse1 !flag m_done',
        say: ['The Archive went dark when the sun did. I read three pearls by feel. They were all about crabs.', 'The Archive went dark. I read by feel.'],
        re: [
          { t: ['Do the records say she came before?', 'Did she come before?'],
            say: [['m_ripple', 'Five hundred years ago, the first time she bit the moon. That was the night Lumen drowned. The pearls from that night are very short.', 'Five hundred years ago. The night Lumen drowned.']] },
          { t: ['What did the crabs do?', 'What did the crabs do?'],
            say: [['m_ripple', 'Pinched a king. He deserved it, the pearl says. I am inclined to agree.', 'Pinched a king. He deserved it.']] },
        ] },
      // his moment (the old TALK chat), once Ash has been through the Archive a time or two
      { if: 'stage>=m_reef !flag m_done',
        say: ['Ah. A question, before I lose it. You are always going somewhere. What is the most important thing to remember?', 'A question. What is most important to remember?'],
        re: [
          { t: ['The people who love you.', 'The people who love you.'], tone: 'kind', f: 1,
            say: [['m_ripple', 'Yes. Yes. Write that on my tail for me, would you? In big letters.', 'Yes. Write that on my tail. Big letters.']] },
          { t: ['Where you left your sword.', 'Where you left your sword.'], f: 0.5,
            say: [['m_ripple', 'Very sensible. I once lost a spear for eleven years. It was in my beard.', 'I lost a spear for years. It was in my beard.']] },
          { t: ['Fish names.', 'Fish names.'], tone: 'silly', f: 0.5,
            say: [['m_ripple', 'I know every fish name. That one is Bob. That one is also Bob. Sorry, Bob.', 'That fish is Bob. So is that one. Sorry, Bob.']] },
        ] },
      { ask: ['Do you know Old Winnie, up top?', 'Do you know Old Winnie?'], if: '!said winnie_hello',
        say: ['Winnie. Oh, Winnie. She could not come down and I could not come up, so we sent letters in bottles for a whole year. Sorry, fish. I am fine.',
          'Winnie and I wrote letters in bottles. Long ago.'] },
      { ask: ['How many barnacles live in your beard?', 'How many barnacles are there?'],
        say: ['Forty-one. Forty-two. Oh, he moved. The one in the middle has been listening to you this whole time. Sorry, barnacle.', 'Forty-one. Forty-two. Oh, he moved.'] },
      { ask: ['What did Lumen know about moths?', 'What did Lumen know about moths?'],
        say: ['That the Mother ties hers with silver thread, even then. Poor things. The priests drew it on their walls so nobody would forget. I forgot.', 'She tied her moths with silver thread. Poor things.'] },
      { idle: [['Sorry, fish. Go on, dragon.', 'Sorry, fish. Go on.'], ['Have we... oh, yes. Hello again.', 'Hello again.']] },
      { bye: [['Goodbye, Ash. It is on my tail.', 'Bye, Ash. It is on my tail.'], ['Mind the fish. Sorry, fish.', 'Mind the fish.']] },
      { bark: true, say: ['Where did I put... ah. On my head. Sorry, fish.', 'Where is my... oh. Sorry, fish.'] },
    ],

    // ---------------------------------------------------------------- Rocket, the Racing Reef (a kid)
    // A boaster and a good sport. His best friend is Pickles, a squid. (The race starts when Ash talks to him: the
    // quest's own step plays then, so his openers are for before and after.)
    m_rocket: [
      { if: 'flag m_race_won', once: true,
        say: ["Fastest swimmer in Coralcombe: you. Second fastest: me. I told Pickles. He took it better than I did.", 'You are fastest. I am second. Ugh!'],
        re: [
          { t: ['It was really close.', 'It was really close.'], tone: 'kind', f: 0.5,
            say: [['m_rocket', 'It WAS close. Tell everybody it was close. Tell Pickles twice.', 'It was close! Tell everybody!']] },
          { t: ['Rematch any time.', 'Rematch any time.'], tone: 'brave', f: 0.5,
            say: [['m_rocket', 'Any time? Careful. I am always ready. I am ready now. I am ready in my sleep.', 'I am always ready. Even asleep.']] },
        ] },
      // what Nana Kelp told Ash not to tell him (said kelp_secret)
      { if: 'said kelp_secret', once: true,
        say: ["Nana says you're good at keeping secrets. What secret? Tell me. I'm very fast at keeping them.", 'Nana says you keep secrets. What secret?'],
        re: [
          { t: ["Can't tell you. That's the point.", "Can't tell. That's the point."],
            say: [['m_rocket', 'Ugh! That is what Pickles said! Pickles knows? Pickles!', 'Ugh! Pickles said that too!']] },
          { t: ["It's about seaweed.", "It's about seaweed."],
            say: [['m_rocket', 'Everything Nana says is about seaweed. That is not a secret. That is Nana.', 'Everything Nana says is seaweed.']] },
        ] },
      // the first meeting
      { if: '!quest m_race started', once: true,
        say: ["Whoa, a dragon who swims? I'm Rocket. Fastest in Coralcombe. Second fastest is a squid. You might be third. Might.", "A swimming dragon! I'm Rocket. Fastest here!"],
        re: [
          { t: ["I'll be first.", "I'll be first."], tone: 'brave', f: 0.5,
            say: [['m_rocket', 'Ha! Then race me! Go on, ask! I am always ready.', 'Ha! Then race me! Ask!']] },
          { t: ['A squid races you?', 'A squid races you?'],
            say: [['m_rocket', 'Pickles. He cheats. He has eight arms. That is six more than fair.', 'Pickles cheats. Eight arms!']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ["It's so dark I swam into Nana's door. Twice. Pickles has to hold my tail now. Don't tell anybody.", 'It is so dark. Pickles holds my tail.'],
        re: [
          { t: ['Pickles is a good friend.', 'Pickles is a good friend.'],
            say: [['m_rocket', 'The best. He is small too. That is why we are friends.', 'The best. He is small too.']] },
          { t: ["I'll make it light again.", "I'll make it light again."],
            say: [['m_rocket', 'Then go fast. Faster than me. I mean it. This once.', 'Then go fast. Faster than me. This once.']] },
        ] },
      { if: 'flag m_eclipse1 !flag m_eclipse2',
        say: ['The sun went out and I swam so fast I hit a rock. Nana says it serves me right. It was a very fast rock.', 'The sun went out. I hit a rock.'],
        re: [
          { t: ['Is your fin all right?', 'Is your fin all right?'], tone: 'kind', f: 0.5,
            say: [['m_rocket', 'My fin is purple. Nana says purple is a good sign. I do not think she knows.', 'My fin is purple. Nana says that is good.']] },
          { t: ['Rocks are not fast.', 'Rocks are not fast.'],
            say: [['m_rocket', 'This one was. It came right at me.', 'This one was. It came right at me!']] },
        ] },
      // his moment (the old TALK chat), after the race
      { if: 'flag m_race_won !flag m_done',
        say: ["Racer's question! I've been thinking since you beat me. What's better: winning, or a really close race?", "Racer's question! Winning, or a close race?"],
        re: [
          { t: ['A close race. Everyone had fun.', 'A close race. Everyone had fun.'], tone: 'kind', f: 0.5,
            say: [['m_rocket', '...Yeah. Yeah, you are right. Close races are the best. Even when I lose. Mostly.', 'Yeah. Close races are best. Mostly.']] },
          { t: ['Winning. Obviously.', 'Winning. Obviously.'], tone: 'brave', f: 1,
            say: [['m_rocket', 'YES. Winning! You get it! You and me, we are the same!', 'Yes! Winning! We are the same!']] },
        ] },
      { ask: ['Who is Pickles, really?', 'Who is Pickles?'],
        say: ['My best friend. He is a squid. He brings snacks to every race, so I always let him come second.', 'My best friend. A squid. He brings snacks.'] },
      { ask: ['Why do you race so much?', 'Why do you race?'],
        say: ['When I am fast, nobody looks at how small I am. They just look at where I went.', 'When I am fast, nobody sees I am small.'] },
      { idle: [['Race me? No? What, then?', 'Race me? No? What?'], ['*does a loop* Go on!', '*loops* Go on!']] },
      { bye: [['Bye! I bet I get there first!', 'Bye! I will get there first!'], ['Swim fast!', 'Swim fast!']] },
      { bark: true, say: ['*does a loop* Did you see that? Did you?', '*loops* Did you see?'] },
    ],

    // ---------------------------------------------------------------- Sir Kipper, knight of the Lumenfolk (a story lead)
    // Very proper, secretly scared of crabs, rides Lady Bubbles the seahorse. He kept watch beside Ember's flame in
    // Lumen and showed Ash the dive; the chapter plays his scout report.
    m_kipper: [
      { if: 'flag m_puff_done', once: true,
        say: ['You deflated the Baron! I have written a ballad. Forty verses. It rhymes "Puffington" with "huffington". Shall I sing it? I shall.',
          'You beat the Baron! I wrote a song. Forty verses!'],
        re: [
          { t: ['Just the first verse, please.', 'Just the first verse, please.'],
            say: [['m_kipper', '"O Baron Puffington, so round, so stuck, so cross..." I shall stop there. Lady Bubbles is making a face.', '"O Baron, so round, so stuck..." I will stop.']] },
          { t: ['Did the Baron like it?', 'Did the Baron like it?'],
            say: [['m_kipper', 'He asked for a copy. He says it is the first thing anyone ever wrote about him without the word "stuck".', 'He wants a copy. It does not say "stuck".']] },
        ] },
      // before the Queen has seen Ash (the chapter's own steps play the Queen, then his report)
      { if: 'stage=m_coral !step m_coral.queen',
        say: ['The Queen first, dragon. Then me. A knight keeps to the order of things, even at the bottom of the sea.', 'See the Queen first. Then me.'],
        re: [
          { t: ['Thank you for showing me the dive.', 'Thanks for showing me the dive.'], tone: 'kind', f: 0.5,
            say: [['m_kipper', "I showed you the kick. Ember's flame did the rest. Your tail is still the wrong sort.", 'I showed the kick. The flame did the rest.']] },
          { t: ['Is Lady Bubbles all right?', 'Is Lady Bubbles all right?'],
            say: [['m_kipper', 'Tired. She carried me home from Lumen at a gallop. Seahorses do not gallop, as a rule.', 'Tired. She galloped home. Seahorses do not gallop.']] },
        ] },
      { if: 'stage=m_coral clue m4_scout_report !flag m_coral_met',
        say: ['Grey as dust, with two pale moons on her wings. I still see her when I shut my eyes. I have stopped shutting them.', 'Grey, with two pale moons. I still see her.'],
        re: [
          { t: ['Was she frightening?', 'Was she frightening?'],
            say: [['m_kipper', 'She was quiet. Something that big should not be so quiet.', 'She was quiet. Big things should not be quiet.']] },
          { t: ['Thank you for keeping watch.', 'Thanks for keeping watch.'], tone: 'kind', f: 0.5,
            say: [['m_kipper', 'A knight is always on watch. Even when it is boring. Especially then.', 'A knight always keeps watch. Even when bored.']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ['No moon. The whole reef is dark. I have lit every lamp in the Shell Hall, and I am standing next to all of them.', 'No moon. I lit every lamp. I stand by them.'],
        re: [
          { t: ['Guard them for me.', 'Guard them for me.'], tone: 'brave', f: 0.5,
            say: [['m_kipper', 'With my life. And my spear. And Lady Bubbles, who bites.', 'With my life. And my spear.']] },
          { t: ["You're allowed to be scared too.", "You're allowed to be scared."],
            say: [['m_kipper', 'I know. I have been scared of crabs my whole life, and I am still a knight. Go on.', 'I know. Crabs scare me. I am still a knight.']] },
        ] },
      { if: 'choice m_hush=free', once: true,
        say: ['A white moth flew low over the Shell Hall, glowing. I saluted. She did not salute back. Moths do not know how.', 'A white moth flew over. I saluted.'],
        re: [
          { t: ['I let her go. Gently.', 'I let her go. Gently.'],
            say: [['m_kipper', 'Then you did the knightly thing. It is not always the fighting one.', 'That was the knightly thing.']] },
          { t: ['Maybe teach her, next time.', 'Teach her next time.'],
            say: [['m_kipper', 'I shall. Wing up, wing down. Lady Bubbles can show her.', 'I shall. Wing up, wing down.']] },
        ] },
      { if: 'flag m_eclipse1 !flag m_done',
        say: ['From the roof of the Shell Hall I watched the sun go out. Lady Bubbles hid in my helmet. All of her.', 'I watched the sun go out. Lady Bubbles hid in my helmet.'],
        re: [
          { t: ['That was the moth you saw.', 'That was your moth.'],
            say: [['m_kipper', 'The same one. Then next time I will be ready. Near something large to stand behind, and ready.', 'The same. Next time I will be ready.']] },
          { t: ['How did she fit in there?', 'How did she fit?'],
            say: [['m_kipper', 'She is very determined.', 'She is very determined.']] },
        ] },
      // his moment (the old TALK chat), once the Baron is beaten
      { if: 'flag m_puff_done !flag m_done',
        say: ["A knight must ask. You have beaten a Baron, and I have not. What is a knight's greatest weapon?", "What is a knight's greatest weapon?"],
        re: [
          { t: ['Kindness. And a spear, just in case.', 'Kindness. And a spear.'], tone: 'kind', f: 1,
            say: [['m_kipper', 'Kindness, then a spear. Exactly the order I keep them in.', 'Kindness, then a spear. Exactly.']] },
          { t: ['Knowing when you are scared.', 'Knowing when you are scared.'], tone: 'brave', f: 0.75,
            say: [['m_kipper', '...Then I am the best-armed knight in the sea. Thank you, dragon.', 'Then I am very well armed.']] },
        ] },
      // the Baron in the Gate (said kipper_warhorse: the Queen hears of it)
      { if: 'stage>=m_reef !flag m_puff_done', fact: 'm4s_sunken_gate=plugged',
        say: ['Baron Puffington is stuck in the Sunken Gate. He called my seahorse a "wet pony". I demanded satisfaction. He laughed.',
          'The Baron called my seahorse a "wet pony"!'],
        re: [
          { t: ["She's not a pony. She's a warhorse.", "She's a warhorse, not a pony."], tone: 'kind', f: 0.75, then: ['said kipper_warhorse'],
            say: [['m_kipper', 'A warhorse! Did you hear that, Lady Bubbles? ...She heard. She is pretending not to be pleased.', 'A warhorse! She heard. She is pleased.']] },
          { t: ["I'll go and sort him out.", "I'll sort him out."], tone: 'brave', f: 0.5,
            say: [['m_kipper', 'I would come, but there are crabs on the way, and I have a rule about crabs.', 'I would come. But crabs. I have a rule.']] },
        ] },
      { ask: ['Why were you down in Lumen?', 'Why were you in Lumen?'],
        say: ["The Queen keeps a knight beside Ember's flame. It was my turn for forty years. A quiet post. I talked to the flame. It did not talk back, which was restful.",
          'Guarding the flame. Forty years. It was quiet.'] },
      { ask: ['Are you really scared of crabs?', 'Are you scared of crabs?'],
        say: ['When I was a squire, a crab held my tail for a whole afternoon. I was very brave about it. I cried quietly.', 'A crab held my tail all day. I cried quietly.'] },
      { ask: ['Tell me about Lady Bubbles.', 'Tell me about Lady Bubbles.'],
        say: ['Finest seahorse in Coralcombe. She does not do heights, or crabs, or being called a pony.', 'The finest seahorse. No heights. No crabs.'] },
      { idle: [['Sir Kipper, at your service. Go on.', 'At your service.'], ['Steady, Lady Bubbles. Yes, dragon?', 'Yes, dragon?']] },
      { bye: [['Carry on, friend. Carefully.', 'Carry on. Carefully.'], ['Lady Bubbles salutes you. That was a salute.', 'Lady Bubbles salutes!']] },
      { bark: true, say: ["Steady, Lady Bubbles. Steady. Is that a crab? It's a rock. Steady.", 'Is that a crab? A rock. Steady.'] },
    ],

    // ---------------------------------------------------------------- Nana Kelp, the Kelp Garden (healer, pearls; the shop)
    // Fussing, feeding, calls Ash "sprat". Was the fastest swimmer in Coralcombe for ninety years and taught Pickles.
    m_kelp: [
      { if: 'flag m_dolphin', once: true, say: ["How's the Dolphin Kick? Just the one tail, remember. Not both. You haven't got both.", 'How is the Dolphin Kick? One tail!'],
        re: [
          { t: ["Your secret's safe from Rocket.", "Your secret's safe from Rocket."], tone: 'kind', f: 0.75, then: ['said kelp_secret'],
            say: [['m_kelp', 'Good sprat. If he knew, he would never race again. He would sit on a rock and sulk.', 'Good. He would sulk on a rock.']] },
          { t: ['Were you really the fastest?', 'Were you the fastest?'],
            say: [['m_kelp', 'For ninety years. Then my knees went. My tail is still quick, when nobody is looking.', 'For ninety years. My tail is still quick.']] },
        ] },
      // the first meeting
      { if: '!flag m_dolphin', once: true,
        say: ['Oh, look at you, all dry and crispy. Nana Kelp. Healer. Pearls. Hugs, if you need one.', 'Look at you! I am Nana Kelp. Pearls and hugs.'],
        re: [
          { t: ['I could use a hug.', 'I could use a hug.'], tone: 'kind', f: 0.75,
            say: [['m_kelp', 'Come here. ...There. Now you are a little bit wet. That is how you know it worked.', 'Come here. There. Now you are wet. It worked.']] },
          { t: ['What do the pearls do?', 'What do the pearls do?'],
            say: [['m_kelp', 'Nothing at all. They are just lovely. Five coins.', 'Nothing. They are just lovely.']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ['No moon, and every little one in the village is in my garden with a blanket. Come here a moment, sprat, before you go.', 'No moon. The little ones are with me.'],
        re: [
          { t: ['I have to go up there.', 'I have to go up there.'],
            say: [['m_kelp', 'I know. I can see it on you. Take two pearls. They do nothing. Take them anyway.', 'I know. Take two pearls anyway.']] },
          { t: ['Look after them for me.', 'Look after them.'], tone: 'kind', f: 0.5,
            say: [['m_kelp', 'I always do. It is the only thing I am faster at than swimming.', 'I always do.']] },
        ] },
      { if: 'flag m_eclipse1 !flag m_done',
        say: ['When the sun went out, every little one in the village swam straight into my garden. I had kelp for all of them. I always do.', 'The sun went out. The children came to me.'],
        re: [
          { t: ['Was anyone hurt?', 'Was anyone hurt?'], tone: 'kind', f: 0.5,
            say: [['m_kelp', "One purple fin. Rocket's. He swam into a rock and blamed the rock.", 'One purple fin. Rocket hit a rock.']] },
          { t: ['Do you have kelp for me?', 'Kelp for me too?'],
            say: [['m_kelp', 'Always. Here. Chew it slowly. It tastes of feet, and it works.', 'Always. It tastes of feet. It works.']] },
        ] },
      // her moment (the old TALK chat), once Ash has been fighting barons
      { if: 'stage>=m_reef !flag m_done',
        say: ['Come here, sprat. Let Nana look at you. You have been fighting barons. Are you eating enough?', 'Let me look at you. Are you eating enough?'],
        re: [
          { t: ['My mom always asks that too.', 'Mom asks that too.'], tone: 'kind', f: 1,
            say: [['m_kelp', 'Of course she does. Mothers have to. It is the very first rule.', 'Of course. Mothers must. First rule.']] },
          { t: ['I eat like a dragon.', 'I eat like a dragon.'], f: 0.5,
            say: [['m_kelp', 'Good. Then you will grow big and strong and very hard to fit through doors.', 'Good. You will grow too big for doors.']] },
          { t: ['I ate a seashell once.', 'I ate a seashell once.'], tone: 'silly', f: 0.5,
            say: [['m_kelp', 'Oh, sprat. No. Have some kelp. Not the shell. The kelp.', 'Oh, sprat. Kelp. Not shells.']] },
        ] },
      { ask: ['How do you heal people?', 'How do you heal people?'],
        say: ['I have patched every merfolk in this village. Every scrape, every sting, every bent fin. The sea is rough, so we are gentle.', 'I patch everyone. The sea is rough, so we are gentle.'] },
      { ask: ['Granny Moss makes potions too.', 'Granny Moss makes potions too.'],
        say: ['Up your way, in a bog? Then we would get on. Mine are seaweed. They taste of feet. They work.', 'Mine are seaweed. They taste of feet. They work.'] },
      { idle: [['Here, sprat. Have some kelp. Go on.', 'Have some kelp. Go on.'], ['Let Nana look at you. What is it?', 'What is it, sprat?']] },
      { bye: [['Swim gently, sprat.', 'Swim gently.'], ['Mind the coral. It nips.', 'Mind the coral.']] },
      { bark: true, say: ['Pearls! Kelp tonic! Hugs! One of those is free!', 'Pearls! Tonic! Hugs!'] },
    ],

    // ================================================================ the Oasis of Sable (talk v11, J11b)
    // A caravan oasis in the Glass Desert. They meet Ash the day the sun went out (eclipse 1, just before m_sable); on
    // the friend path Vesper got here first and told them her dragon cousin was coming. Their part of the act: the wall
    // and the worms (m_sable, m_burrows), the night she drinks the Moon Well (m_glasswall, eclipse 2), the lamps going
    // out and coming back (m_lamps), and the moon going out for good (m_done).

    // ---------------------------------------------------------------- Caravan-master Rafi Sandstride, the Big Tent
    // Big, loud ("HO!"), tells every story twice and bigger. Has never seen snow. The chapter plays his first talk.
    m_rafi: [
      { if: 'choice f_glaciar=free', once: true,
        say: ["You have seen snow? Do you know anybody made of it? ...An auntie? Bring her! No, she'd melt. Bring a postcard!",
          'Your auntie is made of snow? Bring a postcard!'],
        re: [
          { t: ["I'll bring you a real snowball.", "I'll bring you a snowball."], tone: 'kind', f: 0.75, then: ['said rafi_snowball'],
            say: [['m_rafi', 'A real one? It will melt on the way. Bring it anyway! I will watch it melt. That is still seeing snow!', 'It will melt! Bring it anyway!']] },
          { t: ["She'd melt you, more likely.", "She'd melt you first."],
            say: [['m_rafi', 'HO! Then I would be the first caravan-master ever frozen. A legend! Bring her!', 'HO! Then I would be a legend!']] },
        ] },
      { if: 'flag m_eclipse2', once: true,
        say: ['She drank our well. Not the sun. I take back what I said about the sun. Mostly. I am keeping an eye on it.',
          'She drank the well, not the sun. I take it back.'],
        re: [
          { t: ['The sun was never in danger.', 'The sun was safe.'],
            say: [['m_rafi', 'You do not know that. Nobody knows that. ...Fine. Probably.', 'Nobody knows that. ...Fine. Probably.']] },
          { t: ['Saffron was so brave up there.', 'Saffron was so brave.'], tone: 'kind', f: 0.5,
            say: [['m_rafi', 'Saffron is always brave. Today she was also kind to me. I am still getting over it.', 'Today she was kind to me too. I am shaken.']] },
        ] },
      { if: 'flag m_eclipse2 !flag m_lamp_11',
        say: ['My tent lamp went out too. Little Sun. She is very small. I miss her. Do not tell the caravan.', 'My tent lamp, Little Sun, went out. I miss her.'],
        re: [
          { t: ['I can light her for you.', 'I can light her.'], tone: 'kind', f: 0.5,
            say: [['m_rafi', 'Would you? She is just there, by the cushions. Gently. She is shy.', 'Would you? By the cushions. Gently.']] },
          { t: ["I won't tell the caravan.", "I won't tell the caravan."],
            say: [['m_rafi', 'Good. A caravan-master who misses a lamp. They would sing songs about it. Bad ones.', 'Good. They would sing bad songs about it.']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ['The moon is gone, and a caravan cannot cross by nothing. Three hundred years, and tonight we stay put. So I tell stories. Bigger ones.',
          'No moon. The caravan stays. I tell stories.'],
        re: [
          { t: ['Tell me one before I go.', 'Tell me one before I go.'],
            say: [['m_rafi', 'Once, a small dragon went up a black mountain, and came back down. ...I am making it up. Come back and tell me the end.', 'A dragon went up a mountain... Come back. Tell me the end.']] },
          { t: ['Will Sable be all right?', 'Will Sable be all right?'],
            say: [['m_rafi', 'We have lamps. Esme saw to that. And we have Rafi, who is very loud in the dark.', 'We have lamps. And loud Rafi.']] },
        ] },
      // his moment (the old TALK chat), once Ash is back from the worms
      { if: 'stage>=m_glasswall !flag m_done',
        say: ['Settle a caravan argument! You have seen both. Which is better, snow or the sea?', 'Snow or the sea? You have seen both!'],
        re: [
          { t: ['Both. Together. With you.', 'Both, with you.'], tone: 'kind', f: 1,
            say: [['m_rafi', 'HO! With me! Then we go to the snowy sea, you and I! I will bring the striders. They will hate it.', 'HO! The snowy sea! My striders will hate it!']] },
          { t: ['Snow. You have to see snow.', 'Snow. You must see it.'], f: 0.5,
            say: [['m_rafi', 'One day! I will throw a snowball at the sun! It will be a very short throw.', 'One day I will throw snow at the sun!']] },
          { t: ["The sea. It's a desert that got wet.", 'The sea. A wet desert.'], tone: 'silly', f: 0.5,
            say: [['m_rafi', 'A wet desert! HO HO! I will tell that one twice. No. Three times.', 'A wet desert! I will tell that three times!']] },
        ] },
      { if: 'stage=m_burrows',
        say: ['You are going down with the worms? My striders have some advice for you. The advice is: do not.', 'Down with the worms? My striders say: do not.'],
        re: [
          { t: ['Saffron says the old king is sick.', 'The worm king is sick.'],
            say: [['m_rafi', 'Old Gravelgut? He swallowed a strider once and spat it out. The strider has never been the same.', 'He swallowed a strider once. It was never the same.']] },
          { t: ["I'll be back by supper.", "I'll be back by supper."],
            say: [['m_rafi', 'Then I will save you a date. One. They are very good dates.', 'Then I will save you a date.']] },
        ] },
      { if: 'stage=m_sable flag m_rafi', ref: 'm4_gap_sign',
        say: ['Have you seen the Glasswall yet? Did you bring a hat? Bring a bigger hat.', 'Did you see the Glasswall? Bring a hat!'],
        re: [
          { t: ["It's so tall it has weather.", "It's so tall it has weather."],
            say: [['m_rafi', 'HO! It has weather! That one I will tell twice.', 'HO! It has weather!']] },
          { t: ['The sign says worms go under it.', 'Worms go under it.'],
            say: [['m_rafi', 'Worms! Of course! Ask Saffron at the well. She knows every worm by its grumble.', 'Ask Saffron at the well. She knows worms.']] },
        ] },
      { ask: ['Do you know Mayor Dabble?', 'Do you know Mayor Dabble?'],
        say: ['The raft mayor? A fine man. Very damp. When he visits, my striders try to drink him.', 'A fine man. Very damp. My striders try to drink him.'] },
      { ask: ['How did the caravan start?', 'How did the caravan start?'],
        say: ['My grandmother crossed the desert alone with one strider and a song. I sing it every night. The striders hate it.', 'My gran crossed alone with a song. I still sing it.'] },
      { ask: ['My friend Elka races sleds on snow.', 'Elka races sleds on snow.'],
        say: ['On snow? Tell her I will trade her a strider ride for one real snowball. Just one.', 'Tell her: a strider ride for one snowball!'] },
      { idle: [['HO! Sit, sit. What is it?', 'HO! What is it?'], ['Did I tell you the one about... yes? What, then?', 'What, then?']] },
      { bye: [['Go well, dragon. Bring a hat.', 'Bring a hat!'], ['HO! Come back with a story!', 'Come back with a story!']] },
      { bark: true, say: ["HO HO! Did I tell you about the time... yes? I'll tell it again, bigger!", 'HO HO! Did I tell you this one?'] },
    ],

    // ---------------------------------------------------------------- Saffron the Well-Warden (a story lead)
    // Short, guarded, fierce about the Moon Well; scared and angry under it. Her mother and grandmother kept it. The
    // chapters play her three story talks (the worms, the warning, the eclipse at the well); these are the rest.
    m_saffron: [
      // after the eclipse (moved here from m_glasswall.js, where they had no replies): what Ash did at the well
      { if: 'flag m4_well=stood', once: true, then: ['epi m4_epi_well_stood 5'],
        say: ['You stood in front of my well. In front of her. My mother kept this well, and hers, and none of them ever did that.',
          'You stood in front of my well. Nobody ever has.'],
        re: [
          { t: ['I was so scared up there.', 'I was so scared.'], tone: 'kind', f: 0.75,
            say: [['m_saffron', 'So was I. I held my staff so hard it has my hand in it now.', 'So was I. My staff has my handprint now.']] },
          { t: ['She still drank round me.', 'She drank round me.'],
            say: [['m_saffron', 'One candle of moon stayed behind your back. That is one more than any Well-Warden ever kept.', 'One candle stayed. More than anyone ever kept.']] },
        ] },
      { if: 'flag m4_well=lid', once: true, then: ['epi m4_epi_well_lid 5'],
        say: ['We got the lid on, you and me. One candle of moon, safe under a stone. Not bad for a Well-Warden and a dragon.', 'We saved one candle of moon. Together.'],
        re: [
          { t: ['How is your back?', 'How is your back?'],
            say: [['m_saffron', 'My back says no. The rest of me says it was worth it.', 'My back says no. The rest says worth it.']] },
          { t: ['Is one candle enough?', 'Is one candle enough?'],
            say: [['m_saffron', 'For now. You keep one candle lit, and the rest has somewhere to come back to.', 'For now. The rest can come back to it.']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ['No moon left to give her. She is only a well now, with one candle in her. I sit with her anyway.', 'No moon left. I sit with her anyway.'],
        re: [
          { t: ["That's what keeping her means.", "That's what keeping means."], tone: 'kind', f: 0.75,
            say: [['m_saffron', '...Yes. You understand wells, for a dragon.', 'Yes. You understand wells.']] },
          { t: ["I'll bring the moon back for her.", "I'll bring her moon back."], tone: 'brave', f: 0.5,
            say: [['m_saffron', 'Then I will polish the rim for when it comes. She likes to look her best.', 'Then I will polish the rim for it.']] },
        ] },
      // her moment (the old TALK chat), after the well is drunk
      { if: 'flag m_eclipse2 !flag m_done',
        say: ["A question. Short answer. Is it all right to be angry, when you're scared?", 'Is it all right to be angry when scared?'],
        re: [
          { t: ['Yes. Then breathe, and be kind anyway.', 'Yes. Then breathe. Be kind.'], tone: 'kind', f: 0.75, then: ['said saffron_breathe'],
            say: [['m_saffron', '...Good answer. I will breathe. I will not be kind to the moth.', 'Good answer. I will breathe.']] },
          { t: ['Yes. Angry is just brave, frowning.', 'Yes. Angry is brave, frowning.'], tone: 'brave', f: 1,
            say: [['m_saffron', 'Brave, frowning. Yes. That is me exactly.', 'Brave, frowning. That is me.']] },
          { t: ['Only at moths.', 'Only at moths.'], f: 0.5,
            say: [['m_saffron', "Only at moths. Agreed. Don't touch the well.", "Only at moths. Don't touch the well."]] },
        ] },
      { if: 'flag m_eclipse2 !flag m_done', fact: 'm4s_moon_well=dim',
        say: ["One candle's worth of moon left in her. I sit with her every night. I won't stop.", 'My well is dim. I sit with her every night.'],
        re: [
          { t: ['Can I sit with you a while?', 'Can I sit with you?'], tone: 'kind', f: 0.75,
            say: [['m_saffron', "...You may. Don't touch the well.", "You may. Don't touch the well."]] },
          { t: ['Will she ever fill again?', 'Will she fill again?'],
            say: [['m_saffron', 'When the moon does. If the moon does. Until then, I keep the candle.', 'When the moon does. I keep the candle.']] },
        ] },
      // after the warning, waiting for her at the rim (walking up the rim starts the eclipse)
      { if: 'flag m4_warned !flag m_eclipse2',
        say: ['She will come. Sit on the rim with me. Do not touch the water.', 'She will come. Sit with me on the rim.'], ref: 'm4_well_wait',
        re: [
          { t: ['Are you scared?', 'Are you scared?'],
            say: [['m_saffron', 'Yes. I am also here. Both of those are true.', 'Yes. And I am here. Both are true.']] },
          { t: ["I'm staying right here with you.", "I'm staying with you."], tone: 'brave', f: 0.75,
            say: [['m_saffron', 'I know. That is the only reason I am sitting down.', 'I know. That is why I can sit.']] },
        ] },
      // back from the Burrows, before Ash works out where she will feed (the chapter's warning is its own step)
      { if: 'stage=m_glasswall !flag m4_warned',
        say: ['Back from the worms? You smell of worm. Did you find the old king?', 'You smell of worm. Did you find the king?'],
        re: [
          { t: ['He was sick. He ate the moon.', 'He ate a bit of the moon.'],
            say: [['m_saffron', 'A crumb of it? That explains the glass he coughs up. Poor grumpy thing.', 'That explains the glass. Poor thing.']] },
          { t: ['He taught me to dig.', 'He taught me to dig.'],
            say: [['m_saffron', 'Then you dig like a worm now. Do not dig under my well.', 'Then do not dig under my well.']] },
        ] },
      { if: 'stage=m_burrows', dir: ['m_saffron', 'm4_worm_mouth', 'north'],
        say: ['The Burrows are north, up the old road. Bring water. And do not let him eat you. He does that, a little.', 'The Burrows are north. Bring water.'],
        re: [
          { t: ['How do I help a sick worm?', 'How do I help a sick worm?'],
            say: [['m_saffron', 'Find what is hurting him. He has been eating glass. Worms do not eat glass.', 'Find what hurts him. Worms do not eat glass.']] },
          { t: ['Why do you care about him?', 'Why do you care about him?'],
            say: [['m_saffron', 'He is our worm. Grumpy, old, ours. You do not stop caring because a thing is grumpy.', 'He is our grumpy old worm.']] },
        ] },
      // the day Ash comes, before the chapter sends him to her
      { if: 'stage=m_sable !flag m_eclipse2',
        say: ["Don't touch the well. Don't breathe on the well. And don't look at the well like that.", "Don't touch the well. Don't even look at it."],
        re: [
          { t: ["What's so special about it?", "What's so special about it?"],
            say: [['m_saffron', 'It drinks the moon every night and gives it back to us. Lamps. Water. Light. It is all the moon Sable has.', 'It drinks the moon. It gives us light.', { fact: 'm4s_moon_well=full' }]] },
          { t: ["I'm only looking!", "I'm only looking!"],
            say: [['m_saffron', 'That is how it starts. First looking. Then touching. Then drinking. I have seen striders.', 'That is how it starts. I have seen striders.']] },
        ] },
      { ask: ["Why can't anybody touch it?", "Why can't anybody touch it?"],
        say: ['Every hand takes a little moonlight. Seven hundred years of hands. The rim is worn into a smile.', 'Hands take a little moonlight. The rim is worn.'] },
      { ask: ['Who kept the well before you?', 'Who kept it before you?'],
        say: ['My mother, and hers, and hers. When the moon went dim I sat by it every night and talked to it. It did not answer. I kept talking.',
          'My mother and hers. I talk to it. It never answers.'] },
      { ask: ['Do you and Esme get on?', 'Do you and Esme get on?'],
        say: ['Esme names lamps. I keep one well, and I call it the well. We get on.', 'She names lamps. I keep one well. We get on.'] },
      { idle: [["Don't touch the well. What is it?", "Don't touch the well. What?"], ['Dragon. Go on.', 'Dragon. Go on.']] },
      { bye: [["Don't touch the well on your way out.", "Don't touch the well."], ['Go carefully, dragon.', 'Go carefully.']] },
      { bark: true, say: ["Don't touch the well.", "Don't touch the well."] },
    ],

    // ---------------------------------------------------------------- Old Kiln the Glassblower, the Kiln Tent
    // A bit deaf, shouts ("EH?"), loves fire and glass, has no eyebrows. His side quest makes the Moon Glaive.
    m_kiln: [
      { if: 'world q_g_cocoon_in=cut', once: true,
        say: ['Your glaive has silk on its edge. Moon silk! What did you cut? A cocoon? With my glaive? I am putting that on a sign.', 'Silk on your glaive! You cut a cocoon? Ha!'],
        re: [
          { t: ['It cut right through.', 'It cut right through.'],
            say: [['m_kiln', 'EH? Right through? Course it did! I made it! Ha!', 'Right through? I made it! Ha!']] },
          { t: ['Something was glowing inside.', 'Something glowed inside.'],
            say: [['m_kiln', 'Glowing! Everything good glows. Glass, fire, you. Not me. I tried.', 'Everything good glows. Not me. I tried.']] },
        ] },
      { if: 'quest m_glaive done', once: true,
        say: ["How's my glaive? Is it cutting? Is it shining? Have you cut bread with it? Don't.", "How's my glaive? Don't cut bread!"],
        re: [
          { t: ['It comes back every time.', 'It comes back every time.'],
            say: [['m_kiln', 'Every time! Like a dog! A silver dog that cuts things! Ha!', 'Like a dog! A silver dog!']] },
          { t: ['Could you make another one?', 'Could you make another?'],
            say: [['m_kiln', 'EH? Another? There is only one moon. Well. There was.', 'Another? There is only one moon.']] },
        ] },
      // what Ash told Rafi (said rafi_snowball)
      { if: 'said rafi_snowball', once: true,
        say: ['Rafi wants me to make him a snowball. Out of GLASS. For the sun! EH? No, I do not know either.', 'Rafi wants a glass snowball. I do not know why.'],
        re: [
          { t: ['Can you make one?', 'Can you make one?'],
            say: [['m_kiln', 'A glass ball. Cold, round, and sharp. That is two out of three.', 'Cold and round. Two out of three.']] },
          { t: ["He's never seen real snow.", "He's never seen snow."],
            say: [['m_kiln', 'Nor have I! Glass is just snow that tried harder.', 'Nor have I! Glass is snow that tried harder.']] },
        ] },
      { if: 'quest m_glaive active item m_mooncrumb', say: ['EH? Is that moonlight in your bag? Bring it here!', 'Moonlight in your bag! Bring it!'] },
      // the first meeting
      { if: '!quest m_glaive started', once: true,
        say: ['EH? A dragon? In my furnace tent? Old Kiln. Glassblower. Mind the hot bits. All the bits are hot bits.', 'A dragon? I am Old Kiln. Everything here is hot!'],
        re: [
          { t: ['Can I watch you work?', 'Can I watch you work?'],
            say: [['m_kiln', "Watch! Don't touch! Don't breathe! No, do breathe. You're a dragon. Breathe on that.", "Watch! Don't touch! Do breathe. On that!"]] },
          { t: ['Why do you shout?', 'Why do you shout?'],
            say: [['m_kiln', 'EH? The furnace is loud! So am I! Forty years next to it!', 'The furnace is loud! So am I!']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ["No moon? Then I'll make one! Out of glass! It won't glow, mind. It'll just sit there looking moony.", "No moon? I'll make one out of glass!"],
        re: [
          { t: ["Keep the furnace lit while I'm gone.", 'Keep the furnace lit.'],
            say: [['m_kiln', "EH? It's never been out! Forty years! I'm not starting now!", "It has never been out! Forty years!"]] },
          { t: ['Make it a big one.', 'Make it a big one.'],
            say: [['m_kiln', 'Big as a tent! It will break! It will be glorious!', 'Big! It will break! Glorious!']] },
        ] },
      { if: 'flag m_eclipse2 !flag m_done',
        say: ['EH? Dark in the middle of the day again! My furnace is the only light in Sable that did not blink.', 'Dark in the day again! My furnace stayed lit.'],
        re: [
          { t: ['Could your furnace light the lamps?', 'Could it light the lamps?'],
            say: [['m_kiln', "It could! But Esme says a lamp is lit by hand. She's fussy. She's right.", 'It could. Esme says by hand. She is right.']] },
          { t: ['Did you see her drink the well?', 'Did you see her drink it?'],
            say: [['m_kiln', 'Saw the shadow. Heard the slurp. Did not need the rest.', 'Saw the shadow. Heard the slurp.']] },
        ] },
      // his moment (the old TALK chat), once Ash is back from the Burrows
      { if: 'stage>=m_glasswall !flag m_done',
        say: ["EH? While you're here. What's the prettiest thing you've ever seen? Speak up!", 'What is the prettiest thing you saw? Speak up!'],
        re: [
          { t: ["My mom's forge, at night.", "Mom's forge, at night."], tone: 'kind', f: 1,
            say: [['m_kiln', 'A forge at night! Yes! Orange and gold and a bit of smoke! Your mother has taste.', 'A forge at night! Yes! Good taste!']] },
          { t: ['A dragon on a mountain.', 'A dragon on a mountain.'], f: 0.5,
            say: [['m_kiln', "A dragon! I'll make one, out of glass! It'll break! It'll be glorious!", "A dragon! I'll make one of glass!"]] },
          { t: ['Your eyebrows.', 'Your eyebrows.'], tone: 'silly', f: 0.5,
            say: [['m_kiln', "My... ha! I haven't got eyebrows! They went in the second explosion!", "Ha! I haven't got eyebrows!"]] },
        ] },
      { ask: ['How did you make your first glass?', 'How was your first glass made?'],
        say: ['Lightning hit a dune when I was nine. Glass! I have been chasing lightning ever since.', 'Lightning hit a dune. Glass! I chase lightning now.'] },
      { ask: ['A smith in Gearhaven sings at work.', 'A smith there sings at work.'],
        say: ['EH? Sings? I shout. Same thing. Louder.', 'Sings? I shout. Same thing.'] },
      { ask: ['What happened to your eyebrows?', 'What happened to your eyebrows?'],
        say: ['EH? Gone! Two explosions! The second one took both. I draw them on for weddings.', 'Two explosions! I draw them on for weddings.'] },
      { idle: [['EH? Speak up! What is it?', 'EH? What is it?'], ['Mind the furnace! Go on!', 'Mind the furnace!']] },
      { bye: [['EH? Bye! Bye!', 'Bye!'], ["Don't cut bread with anything I made!", "Don't cut bread!"]] },
      { bark: true, say: ['EH? WHAT? Oh. Nobody said anything. Good.', 'EH? WHAT?'] },
      { bark: true, if: 'item m_mooncrumb', say: ['I can see moonlight in your satchel! Bring it here!', 'Moonlight in your bag! Bring it!'] },
    ],

    // ---------------------------------------------------------------- Esme, Keeper of Lamps, the Lamp House
    // Gentle, thoughtful, names every lamp. Wonders whether moths are sad or sweet. Her side quest lights all twelve.
    m_esme: [
      { if: 'choice m_hush=free item m4_sweater', once: true, then: ['epi m4_epi_sweater 6'],
        say: ['A white moth flew over Sable in a little knitted sweater, with a hole for each antenna. I cried a bit.',
          'A white moth flew by in a tiny sweater!'],
        re: [
          { t: ['Hilde knitted it for her.', 'Hilde knitted it.'],
            say: [['m_esme', 'Then she has a friend in the cold north and one in the hot south. That is a lucky moth.', 'A friend north and one south. Lucky moth.']] },
          { t: ['Did she look happy?', 'Did she look happy?'],
            say: [['m_esme', 'She looked warm. With moths, that is the same thing.', 'Warm. For a moth that is the same.']] },
        ] },
      // what Ash told her about moths, and then did (said esme_lonely)
      { if: 'said esme_lonely choice m_hush=free', once: true,
        say: ['You told me moths are lonely, not bad. Then you let the biggest one go. I keep thinking about that.', 'You said moths are lonely. Then you let one go.'],
        re: [
          { t: ['She was like a lamp in a box.', 'Like a lamp in a box.'],
            say: [['m_esme', 'A lamp in a box. Yes. That is exactly what it is. Nobody can see it, and it cannot see anybody.', 'Yes. Nobody sees it, and it sees nobody.']] },
          { t: ['I hope she finds a lamp.', 'I hope she finds a lamp.'], tone: 'kind', f: 0.5,
            say: [['m_esme', 'She will. There are twelve here, and the door is always open.', 'She will. We have twelve. The door is open.']] },
        ] },
      { if: 'choice c_vesper=friend stage>=m_sable stage<m_reforge !quest m_vesper started', once: true,
        scene: 'mv_note', then: ['quest start m_vesper'] },
      // what Ash told Saffron (said saffron_breathe)
      { if: 'said saffron_breathe', once: true,
        say: ['Saffron told me to breathe today. Saffron. She has never told anybody to breathe. Did you do that?', 'Saffron told me to breathe! Was that you?'],
        re: [
          { t: ['I said angry is all right.', 'I said angry is all right.'],
            say: [['m_esme', 'And she listened. Dragon, you have done something to this oasis.', 'And she listened. You changed this oasis.']] },
          { t: ["She's been brave for so long.", "She's been brave so long."], tone: 'kind', f: 0.5,
            say: [['m_esme', 'She has. Somebody had to tell her she could stop for a minute.', 'Someone had to say she could rest.']] },
        ] },
      { if: 'flag m_eclipse2 !clue m4_esme_glass', once: true, then: ['clue m4_esme_glass'],
        say: ['Every lamp went out when she drank the well. And three of them have no glass. Who steals lamp glass?',
          'Three lamps lost their glass. Who steals glass?'],
        re: [
          { t: ['Moths in helmets tried it on Ned.', 'Moths tried it on Ned.'], if: 'clue m4_ned_helmets',
            say: [['m_esme', 'In helmets? Then they are organised. Somebody is collecting lamps, Ash. That frightens me more than the dark.', 'Then someone is collecting lamps. That scares me.']] },
          { t: ['Somebody who wants the light.', 'Somebody who wants light.'],
            say: [['m_esme', 'And cannot make their own. That is the saddest kind of thief.', 'And cannot make their own. Sad.']] },
        ] },
      { if: 'solved lamp_thief !seen lm_glass', once: true, scene: 'lm_glass',
        then: ['set m_lamp_5', 'set m_lamp_6', 'set m_lamp_10', 'epi m4_epi_sorry 5'] },
      { if: 'quest m_lamps active', say: ['Look at a lamp and it tells you what it needs. Oil, a wick, a flame. Bertha mostly wants polishing.', 'Look at a lamp. It tells you what it needs.'] },
      { if: 'act=4 flag m_done',
        say: ["No moon, and twelve lamps against the whole dark. It's enough for one oasis. It has to be.", 'No moon. Twelve lamps. It is enough.'],
        re: [
          { t: ['Will twelve be enough?', 'Will twelve be enough?'],
            say: [['m_esme', 'It has to be. And if it is not, I will light a thirteenth, for whoever is out there.', 'If not, I will light a thirteenth.']] },
          { t: ['Keep them lit till I come back.', 'Keep them lit for me.'],
            say: [['m_esme', 'Every night. A lamp in the dark says "someone is here". I will make sure it is true.', 'Every night. Someone will be here.']] },
        ] },
      { if: 'flag m_lamps12', fact: 'm4s_sable_lamps=relit',
        say: ['Twelve lamps, every night. Bertha is very proud. Small Bertha is unbearable.', 'All twelve glow. Bertha is proud.'],
        re: [
          { t: ['Which one is your favourite?', 'Which is your favourite?'],
            say: [['m_esme', 'I am not allowed a favourite. ...Old Pip. The one with the dent.', 'No favourites. ...Old Pip.']] },
          { t: ['The moths love them.', 'The moths love them.'],
            say: [['m_esme', 'They sit on them all night. Nobody is cold. That is all I ever wanted for anybody.', 'Nobody is cold. That is all I want.']] },
        ] },
      // her moment (the old TALK chat), the day the big moth drank the well
      { if: 'flag m_eclipse2 !flag m_done',
        say: ['Tell me, dragon. You have seen the big one twice now. Are moths bad, or just lonely?', 'You saw her twice. Are moths bad, or lonely?'],
        re: [
          { t: ['Lonely. Everyone gets lonely in the dark.', 'Lonely. The dark is lonely.'], tone: 'kind', f: 1, then: ['said esme_lonely'],
            say: [['m_esme', "...Yes. I think so too. That's why I keep lighting the lamps. For them as well.", 'Yes. I light the lamps for them too.']] },
          { t: ['Bad, if they eat the moon.', 'Bad, if they eat the moon.'], f: 0.5,
            say: [['m_esme', 'Fair. A moth who eats the moon has forgotten something. Maybe somebody can remind her.', 'Fair. Maybe she forgot something.']] },
          { t: ['Fluffy.', 'Fluffy.'], tone: 'silly', f: 0.5,
            say: [['m_esme', 'They are very fluffy. It is hard to stay cross with something so fluffy.', 'They are fluffy. Hard to stay cross.']] },
        ] },
      { if: 'flag m_eclipse2 !flag m_lamps12', fact: 'm4s_sable_lamps=out',
        say: ['Every lamp in Sable is dark. I keep counting them anyway. Bertha. Small Bertha. Old Pip.', 'All the lamps are dark. I still count them.'],
        re: [
          { t: ['Why count them if they are dark?', 'Why count dark lamps?'],
            say: [['m_esme', 'So they know somebody is still here. A dark lamp is only waiting.', 'So they know someone is here. They wait.']] },
          { t: ['What happened to them?', 'What happened to them?'],
            say: [['m_esme', 'She drank the well, and every flame in Sable went out at once, as if somebody blew out a cake.', 'Every flame went out at once. Like a cake.']] },
        ] },
      // the first meeting
      { if: '!flag m_eclipse2', once: true,
        say: ["Hello, dragon. I'm Esme. I keep the lamps. You must be the brightest thing to walk into Sable in years.", "Hello, dragon. I'm Esme. I keep the lamps."],
        re: [
          { t: ['You look after all of them?', 'You look after all of them?'],
            say: [['m_esme', 'Every one. Twelve, and each has a name. That one is Bertha. That one is Small Bertha.', 'Twelve, with names. That is Bertha.']] },
          { t: ['Is that why the moths come?', 'Is that why moths come?'],
            say: [['m_esme', 'Moths love lamps more than they love anything. I have never decided if that is sad or sweet.', 'Moths love lamps most. Sad or sweet?']] },
        ] },
      { if: '!flag m_eclipse2', fact: 'm4s_sable_lamps=lit',
        say: ['Every lamp in Sable has a name. That one is Bertha. That one is Small Bertha.', 'Every lamp has a name. That is Bertha.'],
        re: [
          { t: ['Why give a lamp a name?', 'Why name a lamp?'],
            say: [['m_esme', 'Because it sits up all night for you. You should know the name of somebody who does that.', 'It sits up all night for you. Know its name.']] },
          { t: ['Which one is Old Pip?', 'Which one is Old Pip?'],
            say: [['m_esme', 'The one with the dent. No relation to your little friend. Although he is staring at it.', 'The dented one. Pip is staring at it.']] },
        ] },
      { ask: ['Why do you light the lamps?', 'Why do you light the lamps?'],
        say: ['Because a lamp in the dark says "someone is here". That is all anyone wants to hear, at night.', 'A lamp says "someone is here". We need that.'] },
      { ask: ['Fennick back home makes lamp oil.', 'Fennick makes lamp oil.'],
        say: ['A lamp-maker who keeps every lantern lit? I would like to meet him. I would like to ask what he calls them.', 'I want to meet him. And ask their names.'] },
      { ask: ["Agatha's lighthouse light spins.", "Agatha's light spins."],
        say: ['Spins? Round and round, all night? The poor lamp must be dizzy.', 'Spins? The poor lamp must be dizzy!'] },
      { idle: [['The lamps are listening. Go on.', 'Go on.'], ['Hello, dragon. What is it?', 'Hello, dragon.']] },
      { bye: [['Go well. Walk where the lamps are.', 'Walk where the lamps are.'], ["Goodnight, dragon. Even when it's day.", 'Goodnight, dragon.']] },
      { bark: true, say: ['Bertha, Small Bertha, Old Pip, Gertrude, Gilbert...', 'Bertha, Small Bertha, Old Pip...'] },
    ],

    // ---------------------------------------------------------------- Dusty and Dune, the dune-surfing twins (kids)
    // One speaker, two voices: they finish each other's lines. Their side quest takes Noodle the baby worm home.
    m_dusty: [
      { if: 'quest m_noodle done', once: true, then: ['give coins 40'],
        say: ["Dusty: We miss Noodle! Dune: We don't miss our shoes. Dusty: Here, we found these in a shoe. Dune: Coins!",
          'We miss Noodle. Not our shoes. Have these coins!'],
        re: [
          { t: ['He has three hundred brothers and sisters.', 'He has 311 brothers and sisters.'],
            say: [['m_dusty', "Dusty: Three HUNDRED? Dune: That's a lot of shoes.", 'Three hundred? That is a lot of shoes!']] },
          { t: ['You could go and visit him.', 'You could visit him.'], tone: 'kind', f: 0.5,
            say: [['m_dusty', "Dusty: Can we? Dune: We'll bring shoes. Dusty: As presents.", 'Can we? We will bring shoes. As presents.']] },
        ] },
      { if: 'quest m_noodle active', say: ['Dusty: Is Noodle home yet? Dune: Does his mom have shoes? Dusty: She might eat shoes.', 'Is Noodle home yet?'],
        re: [
          { t: ['Not yet. He only goes on sand.', 'Not yet. He only goes on sand.'],
            say: [['m_dusty', 'Dusty: He is fussy. Dune: Like you about baths. Dusty: I am NOT.', 'He is fussy. Like you about baths!']] },
          { t: ['His mom is a worm queen.', 'His mom is a worm queen.'],
            say: [['m_dusty', 'Dusty: A queen? Dune: Noodle is a PRINCE? Dusty: We borrowed a prince!', 'A queen? Noodle is a prince?']] },
        ] },
      // the first meeting
      { if: '!quest m_noodle started', once: true,
        say: ["Dusty: Hi! I'm Dusty! Dune: I'm Dune! Dusty: We're twins! Dune: We know you know.", 'Hi! We are Dusty and Dune! Twins!'],
        re: [
          { t: ['Which one of you is older?', 'Which of you is older?'],
            say: [['m_dusty', 'Dusty: Me! Dune: By one minute. Dusty: The best minute.', 'Dusty! By one minute. The best minute.']] },
          { t: ['What are the trays for?', 'What are the trays for?'],
            say: [['m_dusty', "Dusty: Dune surfing! Dune: Borrowed trays! Dusty: From the inn! Dune: Don't tell the inn.", "Dune surfing! Borrowed trays! Don't tell."]] },
        ] },
      { if: 'act=4 flag m_done',
        say: ["Dusty: No moon. Dune: We're not scared. Dusty: Except of the dark. Dune: And Mom.", 'No moon. We are not scared. Except of the dark.'],
        re: [
          { t: ['I get scared of the dark too.', 'I get scared too.'], tone: 'kind', f: 0.5,
            say: [['m_dusty', 'Dusty: Are YOU scared? Dune: A bit? Dusty: Then we are a bit too. Dune: Together.', 'Are you? A bit? Then us too. Together.']] },
          { t: ['Stay near the lamps tonight.', 'Stay near the lamps.'],
            say: [['m_dusty', 'Dusty: We will! Dune: We will surf right next to Bertha. Dusty: Gently.', 'We will! Next to Bertha. Gently.']] },
        ] },
      { if: 'flag m_eclipse2 !flag m_done',
        say: ['Dusty: It went dark in the day! Dune: Dusty screamed. Dusty: Dune screamed louder.', 'It went dark! We both screamed.'],
        re: [
          { t: ['I screamed a little too.', 'I screamed a little too.'],
            say: [['m_dusty', "Dusty: Really? Dune: A dragon screamed! Dusty: We're telling everyone.", 'A dragon screamed! We are telling everyone!']] },
          { t: ['Are you two all right?', 'Are you two all right?'], tone: 'kind', f: 0.5,
            say: [['m_dusty', "Dusty: We hid under a tray. Dune: Both of us. Dusty: It's a big tray.", 'We hid under a tray. A big one.']] },
        ] },
      // their moment (the old TALK chat), once Ash is back from the Burrows
      { if: 'stage>=m_glasswall !flag m_done',
        say: ['Dusty: Important question! Dune: Very important! Dusty: Which is better, sand or snow?', 'Important question! Sand or snow?'],
        re: [
          { t: ['Both, if your friends are there.', 'Both, with friends.'], tone: 'kind', f: 0.5,
            say: [['m_dusty', "Dusty: Aww. Dune: That's so nice it's annoying. Dusty: We love it.", 'Aww! So nice it is annoying!']] },
          { t: ["Snow. It's so fast.", "Snow. It's so fast."], f: 0.5,
            say: [['m_dusty', 'Dusty: Faster than a tray? Dune: We need snow. Dusty: Where do you get snow?', 'Faster than a tray? We need snow!']] },
          { t: ["Sand. Snow can't make glass.", "Sand. Snow can't make glass."], f: 1,
            say: [['m_dusty', 'Dusty: Sand wins! Dune: Sand makes glass, and glass makes windows! Both: SAND!', 'Sand wins! Sand makes glass!']] },
        ] },
      { ask: ['My friend Elka races sleds.', 'Elka races sleds.'],
        say: ["Dusty: On snow? Dune: Snow is cold sand! Dusty: We'd win. Dune: We'd freeze.", 'On snow? We would win. We would freeze.'] },
      { ask: ['Who wins at hide and seek?', 'Who wins at hide and seek?'],
        say: ['Dusty: Us! We hide in the sand. Dune: Nobody finds us. Dusty: Ever. Dune: Help.', 'We hide in sand. Nobody finds us. Ever. Help.'] },
      { idle: [['Dusty: Hi! Dune: Hi again!', 'Hi! Hi again!'], ['Dusty: What? Dune: What what?', 'What? What what?']] },
      { bye: [['Dusty: Bye! Dune: Bye bye!', 'Bye! Bye bye!'], ['Dusty: Last one home is a cactus! Dune: Go!', 'Last one home is a cactus!']] },
      { bark: true, say: ['Dusty: Tray race! Dune: We have one tray! Dusty: Tray walk!', 'Tray race! One tray. Tray walk!'] },
    ],

    // ---------------------------------------------------------------- Jinx the Mirage Merchant (only real at noon; a shop)
    // Riddling, sly, never sure she is real. The herring lamps, and the lost letter on the foe path, are hers.
    m_jinx: [
      { if: 'stage>=m_sable !clue m4_jinx_lamps', option: ['Any lamps for sale?', 'Any lamps?'], then: ['clue m4_jinx_lamps'],
        say: [['m_jinx', 'Lamps! Barely used! Glows for ever. Here, hold one.', 'Lamps! Barely used! Hold one.'],
          ['narr', 'The lamp fades away the moment you touch it, like a puff of warm air.', 'It fades away when you touch it.'],
          ['m_jinx', 'Mostly for ever. While you are looking. Thirty coins?', 'Thirty coins?']] },
      // the first meeting (on the friend path Vesper came through first)
      { if: 'choice c_vesper=friend', once: true,
        say: ["Am I real? Are you? A girl in a moth mask bought a hat from me last week, so I'm fairly sure I'm real. Jinx, mirage merchant.",
          'Am I real? A moth-mask girl bought a hat. So yes.'],
        re: [
          { t: ["That's my cousin Vesper.", "That's my cousin Vesper."],
            say: [['m_jinx', 'Then your cousin owes me for the hat. Or the hat owes me for her. One of those.', 'Then she owes me for the hat. Maybe.']] },
          { t: ['Did she actually pay you?', 'Did she pay you?'],
            say: [['m_jinx', 'In coins that vanished at teatime. I respected it.', 'In coins that vanished. I respected it.']] },
        ] },
      { if: '!choice c_vesper=friend', once: true,
        say: ['Am I a mirage? Are you? Jinx, merchant of whatever this is. Buy something and find out.', 'Am I a mirage? I am Jinx. Buy something!'],
        re: [
          { t: ['You look real enough to me.', 'You look real to me.'],
            say: [['m_jinx', 'At noon, everything does. Ask me again at teatime.', 'At noon, everything does. Ask at teatime.']] },
          { t: ['What do you sell?', 'What do you sell?'],
            say: [['m_jinx', 'Shade, lamps, hats. Most of it is real. Some of it is for later.', 'Shade, lamps, hats. Mostly real.']] },
        ] },
      { if: 'act=4 flag m_done',
        say: ["No moon. A mirage needs light to be seen by. I'm barely here at all tonight.", 'No moon. I am barely here tonight.'],
        re: [
          { t: ['Then stay till I get back.', 'Then stay till I am back.'],
            say: [['m_jinx', 'Stay? I have never stayed anywhere. ...For you, I will try being somewhere.', 'I never stay. For you, I will try.']] },
          { t: ['Does the dark scare you?', 'Does the dark scare you?'],
            say: [['m_jinx', 'I am made of the bright part of the day. What do you think?', 'I am made of daylight. What do you think?']] },
        ] },
      // her moment (the old TALK chat), once Ash has been back and forth across the sand
      { if: 'stage>=m_glasswall !flag m_done',
        say: ["A merchant's question. If you could buy one thing that doesn't exist, what would it be?", 'What would you buy that does not exist?'],
        re: [
          { t: ['More time with my family.', 'More time with my family.'], tone: 'kind', f: 1,
            say: [['m_jinx', "...Hm. I don't sell that. Nobody does. You'll have to make it yourself.", 'Nobody sells that. You must make it.']] },
          { t: ['A sword made of starlight.', 'A starlight sword.'], f: 0.5,
            say: [['m_jinx', 'I had one of those. It went out at dawn. Very disappointing.', 'I had one. It went out at dawn.']] },
          { t: ['A mirage of a mirage.', 'A mirage of a mirage.'], tone: 'silly', f: 0.5,
            say: [['m_jinx', "That's just me. You want to buy me? I'm not for sale. I'm for rent.", 'That is me. I am for rent.']] },
        ] },
      { ask: ['Pell the peddler sells things up north.', 'Pell sells things up north.'],
        say: ['A peddler with a wagon? So solid. So there. I prefer to be mostly somewhere.', 'A wagon? So solid. I am only mostly here.'] },
      { ask: ['Where do you go after noon?', 'Where do you go after noon?'],
        say: ['Am I a mirage? I asked my mother once. She shimmered and said "eat your lunch". I still do not know.', 'I asked my mother. She just shimmered.'] },
      { idle: [['Back again? Or am I?', 'Back again?'], ['Something for everyone. Nothing for free.', 'Nothing for free.']] },
      { bye: [['Blink, and I am gone. Bye!', 'Blink and I am gone.'], ['See you at noon. Maybe.', 'See you at noon. Maybe.']] },
      { bark: true, say: ['*shimmers a little*', '*shimmers*'] },
    ],

    // ================================================================ Hearthold (Act IV visits)
    f_hilde: [
      { if: 'item m4_basket', once: true, scene: 'hl_basket', then: ['take m4_basket', 'give m4_sweater', 'xp 200'] },
      { if: 'item m4_sweater', say: ["Have you found that poor cold moth yet? Keep the sweater dry. It shrinks, and she's small enough as it is.", 'Found the cold moth yet? Keep the sweater dry!'] },
      { if: 'power dive !flag gate_q_g_steam', promise: 'q_g_steam',
        say: ["The Steamwell ate my knitting! Basket and all. It's down there somewhere, warm and soggy. Nobody can reach it.",
          'The Steamwell ate my knitting basket!'] },
      { say: [["Soup's on! Soup's always on. Even when you're far away. Especially then.", "Soup's on! Always."],
        ['Gilly in Moonfall sends me fish. I send her my soup recipes. She puts fish in all of them.', 'Gilly sends fish. I send soup recipes.']] },
      { bark: true, say: ["Soup's on! Soup's always on!", "Soup's on!"] },
    ],
  },

  scene: {
    hl_basket: [
      ['f_hilde', 'My basket! The Steamwell ate it in the spring! Look, the wool is still warm. Sit. Soup. Wait there.',
        'My basket! The wool is still warm! Sit!'],
      ['narr', 'Hilde knits. Very, very fast. Biscuit the cat watches every stitch.', 'Hilde knits very fast.'],
      ['f_hilde', 'There. Gilly writes that a cold white moth hangs over Moonfall on a silver string. Poor thing. This is for her.',
        'Gilly says a cold moth is in Moonfall. This is for her.'],
      ['narr', 'It is a very small sweater. It has a hole for each antenna.', 'A tiny sweater, with antenna holes.'],
    ],
    // replaces STORY.m_wren in place (x3_story plays it for Wren's first talk in Driftwood when x3_people does not):
    // her promise now points at a BOOK, which the side quest m_leash pays off (ACT4_V10 1.1 finding 12)
    m_wren: [
      ['wren', "Ash! Look at me. Outside. On a raft. In the sea. I've been sick four times and I've never been happier.",
        'Ash! On a raft in the sea! I am so happy!'],
      ['wren', "Elder Ripple of the merfolk keeps Old Lumen's records. I can read Lumen writing. Badly. Better than anyone up here.",
        'I can read Lumen writing. Badly.'],
      ['wren', 'If you find a book down there, bring it to me. Soggy is fine. Soggy is best.', 'Find a book down there? Bring it!', { promise: 'm_leash' }],
    ],

    // ---- EPI.m lines (played by `epi`; each is the first line of its scene)
    m4_epi_well_stood: [
      ['narr', 'Saffron still sits by the Moon Well every night, and tells anyone who stops about the dragon who stood in front of it.',
        'Saffron tells everyone a dragon guarded her well.'],
    ],
    m4_epi_well_lid: [
      ['narr', 'The Moon Well has a new lid, carved with a dragon tail. Saffron says it is to remind her who helped. It also keeps the moths out.',
        'The Moon Well has a lid with a dragon tail on it.'],
    ],
    m4_epi_sweater: [
      ['narr', "Hush still wears Hilde's sweater. It has a hole for each antenna.", "Hush still wears Hilde's sweater."],
    ],

    // ---- Pebble's Act IV letters, as data (ids kept: m_pb_1, m_pb_2, m_pb_4, m_pb_oil, m_pb_bombs; m_pb_3, Mom's letter,
    // is A4b's in m_glasswall.js). Today x3_people's own PEBBLE_MAIL letters with the same ids arrive by their own `when`
    // and `mail <id>` brings those; these become the letters' text once ENG lets a data scene replace a letter's lines
    // (A4S ENGINE REQUEST), and they are the letters when x3_people leaves the build (s10Mail uses the scene then).
    m_pb_1: [
      ['quill', 'Ash, I watched the eclipse from my roof. The moon is now sixty percent of a moon. I have written to the Eclipse Observatory.',
        'The moon is shrinking. I wrote to the Observatory.'],
      ['quill', 'Nobody there has answered a letter since my old teacher, Professor Lumley, left. Go and knock anyway. Professor Quill.', 'Nobody answers there now. Go and knock. Quill.'],
    ],
    m_pb_2: [
      { if: '!choice fennick=jail', then: [['fennick', "Every lantern in Emberhollow is lit, every night, all night. Nobody here is scared of the dark. Not while I've got oil.",
        'I keep every lantern lit. Nobody is scared.']] },
      { if: 'choice fennick=jail', then: [['fennick', "The Watch House is the brightest place in Brindlecross. I polish. It's what I'm for now.",
        'The Watch House shines. I polish.']] },
      ['fennick', 'P.S. Old Sal says something glows at the bottom of Lake Mirrow, down the plughole by the big rock. Probably a frog. F.',
        'P.S. Something glows in Lake Mirrow. F.', { promise: 'q_g_mirrow' }],
    ],
    m_pb_4: [
      ['yara', 'I counted the moon tonight. Less than half. Pebble sat on my windowsill and stared at it all night. She ate one coin.',
        'Less than half a moon. Pebble ate one coin.'],
      ['yara', "P.S. Iska's Ward-stone hums at night now, like it is waiting for someone with silver fire. Yara.",
        "P.S. Iska's Ward-stone hums at night. Yara.", { promise: 'q_g_iska' }],
    ],
    m_pb_oil: [
      { if: '!choice fennick=jail', then: [['fennick', 'Fennick here. Yara says you need lamps that never go out. I spent my whole life making this oil. Use it for something good. F.',
        'Here is my best oil. Use it well. F.']] },
      { if: 'choice fennick=jail', then: [['osric', 'Captain Osric here. We found this in Fennick Wick\'s old shop. He says it never runs out. He also says sorry. Again. O.',
        "This is Fennick's oil. He says sorry. O."]] },
      ['narr', "A small stone bottle of oil that glows faintly gold. (The lamplighters' lamps will burn twice as long.)",
        "Glowing oil. The lamplighters' lamps burn longer."],
    ],
    m_pb_bombs: [
      ['narr', 'Pebble drops a lumpy parcel on your head. It ticks.', 'Pebble drops a parcel on you. It ticks.'],
      ['f_mags', "No bombs? NO BOMBS? Here. Take these. Don't thank me. Thank me a little. A pufferfish hates a bomb. Mags.",
        'No bombs? Here! Pufferfish hate bombs. Mags.'],
    ],
  },
})
