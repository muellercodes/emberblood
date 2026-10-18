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
    // ================================================================ Driftwood Landing
    m_dabble: [
      { if: 'quest m_ferry done flag m_ferry_on', once: true, fact: 'm4s_ferry_lines=up',
        say: ["The ferry runs again! The chickens ride for free. Every morning they wait at the post in a neat little line.", 'The ferry runs! Chickens ride free.'] },
      { if: 'quest m_lighthouse done flag m_lighthouse_lit', once: true, fact: 'm4s_lighthouse=lit',
        say: ["Old Ned's light! I can see my own socks at midnight. They're still wet. But I can SEE them.", "Ned's light is on! I can see my socks."] },
      { if: 'flag m_ship=glaciar', once: true,
        say: ['Your auntie froze half our beach. We sell the ice to Sable. Sable pays in dates. Everybody is happy except the ice.',
          'We sell your auntie\'s ice for dates!'] },
      { if: 'flag m_dell_away stage<m_reforge', fact: 'm4s_dell_boat=away',
        say: ["Captain Dell sailed off to fetch your mom. He left me in charge of his dock. I've never had a dock before.", 'Dell went to get your mom. I am minding his dock!'] },
      { if: 'stage>=m_reef !flag m_ferry_on', fact: 'm4s_ferry_lines=cut',
        say: ['Our ferry is stuck. The Crab Pirates cut the lines. Rowan tied a "help me" knot. She NEVER ties that one.',
          'Crabs cut the ferry lines. Rowan needs help.'] },
      { say: [["Driftwood Landing: the only town that's never in the same place twice!", 'Our town floats. It moves every day!'],
        ["My socks have been wet for eleven years. I've made my peace with it.", 'My socks have been wet for eleven years.'],
        ["If you see a raft full of chickens, it's ours. Wave. They like waving.", 'See a raft of chickens? Wave!']] },
      { bark: true, say: ['Mind the gap! Mind that gap too! Mind all the gaps!', 'Mind the gaps!'] },
      { bark: true, say: ['*wrings out a sock* Ah. Better. *puts it back on* Ah. Worse.', '*wrings out a sock* Ah. Worse.'] },
    ],

    m_winnie: [
      { if: 'flag m_eclipse1', once: true,
        say: ['When the moth bit the moon, the tide went three ways at once. Gerald hid in the sugar bowl. He is still in there.',
          'When the moon got bitten, Gerald hid in the sugar bowl.'] },
      { if: 'choice m_hush=free', once: true,
        say: ['A little white light went over the hut, low and slow, heading out to sea. Gerald came out of the sugar bowl to look.',
          'A white light went by. Gerald came out to look.'] },
      { if: 'flag m_eclipse2', fact: 'm4s_moon=half',
        say: ["Less than half a moon now. The tide comes in when it likes and goes out when it's bored, like a cat.",
          'Less than half a moon. The tide does what it likes.'] },
      { if: 'stage>=m_lumen', say: [['Gerald says hello. Gerald is an octopus. Gerald lives in my teapot. Don\'t make tea.', 'Gerald the octopus lives in my teapot.'],
        ["Sixty years I've watched the tide from this hut. Lately it comes in twice before breakfast.", 'The tide comes twice before breakfast now!'],
        ["You worked out the tide on your own. You're getting good at this, child.", 'You are getting good at this, child.']] },
      { bark: true, say: ['Shh, Gerald. Not now, Gerald.', 'Shh, Gerald.'] },
    ],

    m_rowan: [
      { if: 'quest m_ferry done', once: true,
        say: ['That "thank you" knot is still holding. Biggest knot in the lagoon. Folk row over from Palmcrest just to look at it.', 'My thank-you knot still holds. People come to look.'] },
      { if: 'power dive !seen q_g_mirrow_board', option: ['Know any good boat stories?', 'Any boat stories?'], promise: 'q_g_mirrow',
        say: ["My knot teacher, Old Sal of Lake Mirrow, writes that Dell's first boat sank there on launch day. Right down a plughole by a big rock.",
          "Dell's first boat sank in Lake Mirrow. Down a plughole!"] },
      { if: 'stage>=m_reef !flag m_ferry_on', fact: 'm4s_ferry_lines=cut',
        say: ['The Crab Pirates cut my ferry lines. CRAB pirates. Who lets a crab be a pirate?', 'Crab Pirates cut my ferry lines!'] },
      { say: [['This is a "nice to meet you" knot. This one\'s a "please leave my raft". Different knot.', 'This knot means hello. This one means go away.'],
        ["Every raft in this town is tied to every other raft. My dad tied the first eleven knots, and I check every one of them each morning.", 'Every raft is tied together. I check the knots every day.']] },
      { bark: true, say: ['Bowline, clove hitch, sheepshank, "go away" knot...', '*ties knots*'] },
    ],

    m_squint: [
      { if: 'quest m_lighthouse done', once: true,
        say: ['Grandpa came down off Gull Isle for supper! Gilly made fish. He grumbled the whole time and had seconds.',
          'Grandpa came down for supper! He had seconds!'] },
      { if: 'power burrow !flag gate_q_g_xmark', option: ['Seen any treasure, lookout?', 'Seen any treasure?'], promise: 'q_g_xmark',
        say: ['Grandpa says Saltbeard hid his best treasure on the Rockpools, by an X. Everybody digs the X. Nobody digs DEEP.',
          'Saltbeard hid treasure by an X. Nobody digs deep!'] },
      { if: 'flag m_eclipse1 !flag m_eclipse2', fact: 'm4s_moon=bitten',
        say: ['LAND HO! ...No. MOON HO. Somebody took ANOTHER bite out of it. Through my spyglass it looks like a cookie now.', 'MOON HO! Somebody bit the moon again!'] },
      { say: [["LAND HO! ...Oh. That's Palmcrest. It's always there. LAND HO anyway.", 'LAND HO! Oh. Just Palmcrest.'],
        ["I wear an eyepatch so I'm always ready to be a pirate. I'm not a pirate. I'm READY.", "My eyepatch is pretend. I'm READY."]] },
      { bark: true, say: ["LAND HO! ...It's still Palmcrest.", 'LAND HO! Still Palmcrest.'] },
      { bark: true, if: '!flag m_lighthouse_lit', fact: 'm4s_lighthouse=dark',
        say: ['*looks at Gull Isle through her spyglass* Still dark. Still dark, Grandpa.', "Grandpa's light is still dark."] },
    ],

    m_gilly: [
      { if: 'quest m_moonfish done', once: true,
        say: ['I painted the Moonfish on my sign. Now everybody wants to eat here. I tell them it is not on the menu. Some fish are for looking at.',
          'I painted the Moonfish on my sign. Not on the menu!'] },
      { if: 'power dive !item m4_basket !item m4_sweater !flag gate_q_g_steam', option: ['Heard from Hilde lately?', 'Heard from Hilde?'], promise: 'q_g_steam',
        say: ['Hilde in Hearthold writes that the Steamwell ate her knitting basket. Basket and all! Whoever fishes it out gets a sweater.',
          'The Steamwell ate Hilde\'s basket. Fish it out!'] },
      { if: 'flag m_dell_away stage<m_reforge', fact: 'm4s_dell_boat=away',
        say: ["Dell left Mags a note: don't touch the sandwiches. She's been staring at them for two days. I made her fish instead.", 'Mags must not touch the sandwiches. I made her fish.'] },
      { say: [["Fish stew! Fish pie! Fish pudding! I'm working on fish cocoa. It's not going well.", 'Fish stew! Fish pie! Fish pudding!'],
        ["Hilde in Hearthold sends me soup recipes. I send back fish. It's a good friendship.", 'Hilde sends soup recipes. I send fish.']] },
      { bark: true, say: ['FISH! Get your fish! Fresh fish, old fish, fish-shaped fish!', 'FISH! Get your fish!'] },
    ],

    m_ned: [
      { if: 'quest m_lighthouse done', once: true,
        say: ['Silver light, every night. The moths still come. Now they just sit and look at it. Like me. Hmph.', 'Silver light! Moths just look at it now.'] },
      { if: '!clue m4_ned_helmets', once: true, then: ['clue m4_ned_helmets'],
        say: ["Moths in little plumed helmets came for my lamp's GLASS. Tried to unscrew it! It's bolted on. Ha. HA.",
          'Moths in helmets tried to steal my lamp glass. Ha!'] },
      { if: '!flag m_lighthouse_lit', fact: 'm4s_lighthouse=dark',
        say: ['Moths. MOTHS. Every night, all over my lamp. Then it went out and they still came. Moths have no manners.',
          'Moths sat on my lamp till it went out. No manners!'] },
      { say: [["Tell Squint I'm fine. Tell her to eat her vegetables. Tell her the eyepatch suits her.", "Tell Squint I'm fine."],
        ['My cousin Agatha keeps the lighthouse in Gearhaven. Hers SPINS. Show-off.', "Agatha's lighthouse SPINS. Show-off."]] },
      { bark: true, if: '!flag m_lighthouse_lit', fact: 'm4s_lighthouse=dark', say: ["Shoo. SHOO. Go and sit on someone else's lamp.", 'Shoo, moths. SHOO.'] },
      { bark: true, if: 'flag m_lighthouse_lit', fact: 'm4s_lighthouse=lit', say: ['*polishes the great lamp* Silver. Ha. Silver.', '*polishes the lamp* Silver!'] },
    ],

    // ================================================================ Coralcombe (merfolk, inside the area)
    m_coralia: [
      { if: 'choice m_hush=free', once: true,
        say: ["A white moth flew low over the reef, glowing softly. She didn't stop to visit. You did a kind thing, small dragon.",
          'A white moth flew over, glowing. You did a kind thing.'] },
      { if: 'choice c_vesper=friend stage>=m_sable', once: true,
        say: ['A girl in a moth mask swam up to wave at our lookouts. She said she was your cousin. She also took two pearls.', 'A moth-mask girl waved at us. She took two pearls!'] },
      { if: 'power moonfire !clue m4_iska_note', option: ['Do the old songs say anything about moonfire?', 'Songs about moonfire?'], promise: 'q_g_iska',
        say: ['Our songs say the girl with horns had a friend called Iska. Iska hid a word in her own Ward-stone, behind stairs only moonlight holds.',
          'Iska hid a word in her Ward-stone.'] },
      { if: '!flag m_puff_done', fact: 'm4s_sunken_gate=plugged',
        say: ['A pufferfish is stuck in the Sunken Gate. The whole sea is waiting behind him. The sea is not patient.', 'A pufferfish is stuck in the Sunken Gate.'] },
      { say: [["The old songs say the girl with horns was small too, the first time she came. You'll grow.", 'The girl with horns was small too. You will grow.'],
        ['We left the moon city when it drowned. We kept the moon in our hearts. And in our lamps. Mostly lamps.', 'We kept the moon in our lamps.'],
        ['A queen is meant to listen to the sea. Lately the sea only says "shhh", and I do not like the way it says it.', 'The sea only says "shhh" now. I do not like it.']] },
      { bark: true, say: ['The tide is restless. So is the queen.', 'The tide is restless.'] },
    ],

    m_ripple: [
      { if: 'quest m_leash done', once: true,
        say: ['Your librarian friend and I have agreed on nothing at all. It has been the best week of my life.', 'Wren and I agree on nothing. Best week ever!'] },
      { if: 'quest m_leash active !item m_book_raw !power moonfire',
        say: ['The vault wants moonfire. Not claws, not fire. The old songs say a temple of mirrors keeps it.', 'The vault wants moonfire. Try the mirror temple.'] },
      { if: 'quest m_leash active item m_book_raw',
        say: ['The Book of Moths! Soggy, but whole. Take it to someone who reads old Lumen better than I do. Which is anybody.',
          'Take the book to someone who reads Lumen.'] },
      { if: 'power moonfire !clue m4_ring_trails', option: ['What do your records say about the moth?', 'What do the records say?'], promise: 'q_g_ring',
        say: ['Her trails all start at a ring of stones in a wood on the Clockwork Coast, where something precious broke. Written in moon-ink, up on the rock beside it.',
          'Her trails start at the Moon Ring. Look from the rock.'] },
      { say: [['The old records say the Mother tied her moths with silver thread, even then. Poor things.', 'She tied her moths with silver thread.'],
        ['Sorry, fish. Not you. The other fish.'],
        ['A barnacle has lived in my beard since before the Archive had a roof. Sorry, barnacle. I forgot you were listening.', 'A barnacle lives in my beard. Sorry, barnacle.']] },
      { bark: true, say: ['Where did I put... ah. On my head. Sorry, fish.', 'Where is my... oh. Sorry, fish.'] },
    ],

    m_rocket: [
      { if: 'flag m_race_won', once: true,
        say: ["Fastest swimmer in Coralcombe: you. Second fastest: me. I told Pickles. He took it better than I did.", 'You are fastest. I am second. Ugh!'] },
      { if: 'quest m_race active !flag m_race_won', say: ['Ready to race? Talk to me and we GO. I am always ready.', 'Ready? Talk to me and we GO!'] },
      { say: [["I'm the fastest swimmer in Coralcombe! Second fastest is a squid named Pickles.", 'I am fastest! Second is Pickles the squid.'],
        ["Race me! I'll give you a head start. A tiny one. The size of a shrimp.", 'Race me! A tiny head start.'],
        ["Pickles cheats. He has eight arms. That's six more than fair.", 'Pickles has eight arms. Not fair!']] },
      { bark: true, say: ['*does a loop* Did you see that? DID YOU?', '*loops* Did you see?'] },
    ],

    m_kipper: [
      { if: 'flag m_puff_done', once: true,
        say: ['You deflated the Baron! I have written a ballad. Forty verses. It rhymes "Puffington" with "huffington". Shall I sing it? I shall.',
          'You beat the Baron! I wrote a song. Forty verses!'] },
      { if: '!flag m_puff_done', fact: 'm4s_sunken_gate=plugged',
        say: ['Baron Puffington is stuck in the Sunken Gate. He called my seahorse a "wet pony". I demanded satisfaction. He laughed.',
          'The Baron called my seahorse a "wet pony"!'] },
      { say: [['HALT! Who swims there? ...Oh. It\'s you. Carry on. Carefully.', 'HALT! Oh, it is you. Carry on.'],
        ['I am not afraid of crabs. I am RESPECTFUL of crabs, from the far end of the Shell Hall.', 'I am not scared of crabs. I stay far away.']] },
      { bark: true, say: ["Steady, Lady Bubbles. Steady. Is that a crab? It's a rock. Steady.", 'Is that a crab? A rock. Steady.'] },
    ],

    m_kelp: [
      { if: 'flag m_dolphin', once: true, say: ["How's the Dolphin Kick, dearie? Just the one tail, remember. Not both. You haven't got both.", 'How is the Dolphin Kick? One tail!'] },
      { say: [["Pearls for your pockets, dearie. They don't do anything. They're just lovely.", 'Pearls for your pockets. Just lovely.'],
        ['A dragon who breathes under water! Your mother must be so proud. And so confused.', 'A dragon who breathes water! Your mom is proud.'],
        ["Eat your seaweed, dearie. It's green. Green is good for horns.", 'Eat your seaweed. Good for horns.']] },
      { bark: true, say: ['Pearls! Kelp tonic! Hugs! One of those is free!', 'Pearls! Tonic! Hugs!'] },
    ],

    // ================================================================ the Oasis of Sable
    m_rafi: [
      { if: 'choice f_glaciar=free', once: true,
        say: ["You have seen snow? Do you know anybody made of it? ...An AUNTIE? Bring her! No, she'd melt. Bring a postcard!",
          'Your auntie is made of snow? Bring a postcard!'] },
      { if: 'flag m_eclipse2', once: true,
        say: ['She drank our WELL. Not the sun. I take back what I said about the sun. Mostly. I am keeping an eye on it.',
          'She drank the well, not the sun. I take it back.'] },
      { if: 'flag m_eclipse2 !flag m_lamp_11',
        say: ['My tent lamp went out too. Little Sun. She is very small. I miss her. Do not tell the caravan.', 'My tent lamp, Little Sun, went out. I miss her.'] },
      { say: [['Three hundred years our caravan has crossed the Glass Desert by moonlight! Two hundred and ninety-nine without getting lost!',
        'Three hundred years crossing the desert! Lost once!'],
        ["I have never seen snow. Is it true it's cold? On PURPOSE?", 'Is snow cold on PURPOSE?'],
        ['My best strider walked into a dune last night. Twice. I told that one already? Then this time it was THREE times.', 'My strider walked into a dune. Three times!']] },
      { bark: true, say: ["HO HO! Did I tell you about the time... yes? I'll tell it again, bigger!", 'HO HO! Did I tell you this one?'] },
    ],

    m_saffron: [
      { if: 'flag m4_well=stood', once: true, then: ['epi m4_epi_well_stood 5'],
        say: ['You stood in front of my well. In front of HER. My mother kept this well, and hers, and none of them ever did that.',
          'You stood in front of my well. Nobody ever has.'] },
      { if: 'flag m4_well=lid', once: true, then: ['epi m4_epi_well_lid 5'],
        say: ['You helped me drag the lid on. With your TAIL. I will never forget it. Nor will my back.', 'You helped drag the lid on. Thank you.'] },
      { if: 'flag m_eclipse2', fact: 'm4s_moon_well=dim',
        say: ["One candle's worth of moon left in her. I sit with her every night. I won't stop.", 'My well is dim. I sit with her every night.'] },
      { if: '!flag m_eclipse2', fact: 'm4s_moon_well=full',
        say: ['The well drinks the moon every night, and gives it back to us. Lamps. Water. Light.', 'The well drinks the moon. It gives us light.'] },
      { say: [["Don't touch the well. Don't breathe on the well. Don't LOOK at the well like that.", "Don't touch the well. Don't LOOK at it."],
        ["I talk to the well at night. It doesn't answer. It's a good listener, though.", 'I talk to the well. Good listener.']] },
      { bark: true, say: ["Don't touch the well.", "Don't touch the well."] },
    ],

    m_kiln: [
      { if: 'world q_g_cocoon_in=cut', once: true,
        say: ['Your glaive has silk on its edge. MOON silk! What did you cut? A COCOON? With MY glaive? I am putting that on a sign.', 'Silk on your glaive! You cut a cocoon? Ha!'] },
      { if: 'quest m_glaive done', once: true,
        say: ["How's my glaive? Is it cutting? Is it shining? Have you cut bread with it? DON'T.", "How's my glaive? Don't cut bread!"] },
      { if: 'quest m_glaive active item m_mooncrumb', say: ['EH? Is that MOONLIGHT in your bag? Bring it HERE!', 'Moonlight in your bag! Bring it!'] },
      { say: [["I make glass. Glass bottles, glass bowls, glass shoes. Don't buy the glass shoes.", 'I make glass. Don\'t buy the shoes.'],
        ['EH? Speak up. The furnace is very loud. So am I.', 'EH? Speak up!']] },
      { bark: true, say: ['EH? WHAT? Oh. Nobody said anything. Good.', 'EH? WHAT?'] },
      { bark: true, if: 'item m_mooncrumb', say: ['I can SEE moonlight in your satchel! Bring it here!', 'Moonlight in your bag! Bring it!'] },
    ],

    m_esme: [
      { if: 'choice m_hush=free item m4_sweater', once: true, then: ['epi m4_epi_sweater 6'],
        say: ['A white moth flew over Sable in a little knitted sweater, with a hole for each antenna. I cried a bit.',
          'A white moth flew by in a tiny sweater!'] },
      { if: 'choice c_vesper=friend stage>=m_sable stage<m_reforge !quest m_vesper started', once: true,
        scene: 'mv_note', then: ['quest start m_vesper'] },
      { if: 'flag m_eclipse2 !clue m4_esme_glass', once: true, then: ['clue m4_esme_glass'],
        say: ['Every lamp went out when she drank the well. And three of them have no GLASS. Who steals lamp glass?',
          'Three lamps lost their glass. Who steals glass?'] },
      { if: 'solved lamp_thief !seen lm_glass', once: true, scene: 'lm_glass',
        then: ['set m_lamp_5', 'set m_lamp_6', 'set m_lamp_10', 'epi m4_epi_sorry 5'] },
      { if: 'quest m_lamps active', say: ['Look at a lamp and it tells you what it needs. Oil, a wick, a flame. Bertha mostly wants polishing.', 'Look at a lamp. It tells you what it needs.'] },
      { if: 'flag m_lamps12', fact: 'm4s_sable_lamps=relit',
        say: ['Twelve lamps, every night. Bertha is very proud. Small Bertha is unbearable.', 'All twelve glow. Bertha is proud.'] },
      { if: 'flag m_eclipse2 !flag m_lamps12', fact: 'm4s_sable_lamps=out',
        say: ['Every lamp in Sable is dark. I keep counting them anyway. Bertha. Small Bertha. Old Pip.', 'All the lamps are dark. I still count them.'] },
      { say: [['Every lamp in Sable has a name. That one is Bertha. That one is Small Bertha.', 'Every lamp has a name. That is Bertha.'],
        ["Moths love lamps more than they love anything. I've never decided if that's sad or sweet.", 'Moths love lamps most. Sad or sweet?'],
        ['A lamp in the dark says "someone is here". That\'s all anyone wants to hear, at night.', 'A lamp says "someone is here".']] },
      { bark: true, say: ['Bertha, Small Bertha, Old Pip, Gertrude, Gilbert...', 'Bertha, Small Bertha, Old Pip...'] },
    ],

    m_dusty: [
      { if: 'quest m_noodle done', once: true, then: ['give coins 40'],
        say: ["Dusty: We miss Noodle! Dune: We don't miss our shoes. Dusty: Here, we found these in a shoe. Dune: Coins!",
          'We miss Noodle. Not our shoes. Have these coins!'] },
      { if: 'quest m_noodle active', say: ['Dusty: Is Noodle home yet? Dune: Does his mom have shoes? Dusty: She might EAT shoes.', 'Is Noodle home yet?'] },
      { say: [['Dusty: We surf the dunes on trays! Dune: Stolen trays! Dusty: BORROWED trays!', 'We surf dunes on trays! Borrowed trays!'],
        ['Dusty: Race you down the big dune! Dune: Last one down is a cactus!', 'Race you down the dune!']] },
      { bark: true, say: ['Dusty: Tray race! Dune: We have one tray! Dusty: Tray WALK!', 'Tray race! One tray. Tray WALK!'] },
    ],

    m_jinx: [
      { if: 'stage>=m_sable !clue m4_jinx_lamps', option: ['Any lamps for sale?', 'Any lamps?'], then: ['clue m4_jinx_lamps'],
        say: [['m_jinx', 'Lamps! Barely used! Glows for EVER. Here, hold one.', 'Lamps! Barely used! Hold one.'],
          ['narr', 'The lamp fades away the moment you touch it, like a puff of warm air.', 'It fades away when you touch it.'],
          ['m_jinx', 'Mostly for ever. While you are looking. Thirty coins?', 'Thirty coins?']] },
      { say: [['Am I a mirage? Are YOU? Buy something and find out.', 'Am I a mirage? Buy something!'],
        ["Today's special: a bottle of shade. Keeps you cool. Mostly empty.", "Today's special: a bottle of shade."],
        ["I'm only here at noon. By teatime you'll wonder if you dreamed me.", 'I am here at noon. Later, you will wonder.']] },
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
      ['f_hilde', 'My BASKET! The Steamwell ate it in the spring! Look, the wool is still warm. Sit. Soup. Wait there.',
        'My BASKET! The wool is still warm! Sit!'],
      ['narr', 'Hilde knits. Very, very fast. Biscuit the cat watches every stitch.', 'Hilde knits very fast.'],
      ['f_hilde', 'There. Gilly writes that a cold white moth hangs over Moonfall on a silver string. Poor thing. This is for her.',
        'Gilly says a cold moth is in Moonfall. This is for her.'],
      ['narr', 'It is a very small sweater. It has a hole for each antenna.', 'A tiny sweater, with antenna holes.'],
    ],
    // replaces STORY.m_wren in place (x3_story plays it for Wren's first talk in Driftwood when x3_people does not):
    // her promise now points at a BOOK, which the side quest m_leash pays off (ACT4_V10 1.1 finding 12)
    m_wren: [
      ['wren', "Ash! Look at me. Outside. On a raft. In the SEA. I've been sick four times and I've never been happier.",
        'Ash! On a raft in the SEA! I am so happy!'],
      ['wren', "Elder Ripple of the merfolk keeps Old Lumen's records. I can read Lumen writing. Badly. Better than anyone up here.",
        'I can read Lumen writing. Badly.'],
      ['wren', 'If you find a BOOK down there, bring it to me. Soggy is fine. Soggy is best.', 'Find a BOOK down there? Bring it!', { promise: 'm_leash' }],
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
