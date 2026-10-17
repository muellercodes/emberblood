// Act V, Nightfall Peak (the finale): the act file (owner N5b). Mysteries, the friends trust track, the three endings,
// the epilogue book's pages, old-save migration. Data only.
// Chapters: n_bridge, n_stair, n_clocks, n_rime (N5a), n_glass, n_crown, n_nyxara, n_end (N5b). The friends' errands,
// the Duchess mystery and every act 5 NPC's talk: N5S. Plan: v10/FINALE_V10.md; notes: v10/N5B_NOTES.md.
act({
  id: 5, name: ['Nightfall Peak', 'Nightfall Peak'], map: 4,

  mystery: {
    // the main mystery, ring by ring: who the little grey moth is (N5a, n_stair), her name (N5a, n_clocks), what she
    // wants (n_glass), and how anyone could reach her (n_crown). Herrings: Murmur's grey scale (N5a) and "the sun is a
    // liar" (N5a's n_rime_in).
    night_mother: { main: true,
      title: ['Who is the Night Mother, really, and what does she want?', 'Who is the Night Mother?'],
      deduce: ['n5_who_moth', 'n5_name', 'n5_wants', 'n5_reach'],
      herring: ['n5_grey_scale', 'n5_sun_out'],
      solved: ['She was a little moth named Nyx, who loved the moon and was scared of being left. Ember lit her a lantern once.',
               'She was a little moth named Nyx. She was scared of being left.'] },
    // small: the Bridgefoot's fourth post with no lantern (N5a; answer: Ember lit one more than she needed, for a cold
    // little moth). Payoff: the post burns for good, and after the ending the real green gets its fourth post back.
    n5_fourth_lantern: { deduce: ['n5_fourth_lantern'],
      title: ['Why does the green have a fourth post with no lantern?', 'Why is there a fourth post?'],
      solved: ['Ember lit one more lantern than she needed, for a cold little moth. Now it burns again.', 'Ember lit one more, for a cold little moth.'] },
    // small: who is following Ash up the mountain (N5S's q_n5_follower; answer: Duchess, the real one). Payoff: the
    // dawn line "DUCHESS! I KNEW it!", the goathorns hat, a Heart Ember.
    n5_follower: { deduce: ['n5_who_follows'],
      title: ['Who is following you up the mountain?', 'Who is following you?'],
      solved: ['Duchess. The real one. Nobody knows how she gets anywhere.', 'Duchess! Nobody knows how.'] },
  },

  // The three friends Nyxara hurt: Vesper, Glaciar and Hush (Greymane, Tikka and Cindervane help in fights but do not
  // count). Each counts once, with its own flag (n5_vesper, n5_glaciar, n5_hush): an earlier kind choice counts at the
  // n_bridge arrival (N5a); otherwise Vesper is won back on the main path (n_clocks, the Silk Gallery, N5a), Glaciar and
  // Hush by their errands (N5S). Main path alone: 1. One errand or one earlier kindness: 2.
  trust: { friends: 'n5_friends' },

  // decided at the fall (n_nyxara's n_choice). Every option always shows; the moth one is locked, with the first reason
  // that holds, until its condition holds. The checker tests them with the main-path state at the end of n_nyxara.
  ending: {
    moth:      { at: 'n_nyxara', scene: 'n_choice', choice: 'n_end=moth', optional: true,
                 if: 'solved n5_reach trust friends>=2 item n5_lantern' },
    dawn:      { at: 'n_nyxara', scene: 'n_choice', choice: 'n_end=dawn', if: 'true' },
    embermoon: { at: 'n_nyxara', scene: 'n_choice', choice: 'n_end=embermoon', if: 'true' },
  },

  // the epilogue book (n_end.js): one page per scene, played in order by the storybook after the dawn (ENGINE REQUEST
  // in CHANGES.md: x4_story's n4sEpilogue plays these instead of its own lines). Each page scene shows its own painted
  // plate first (emit n4fx:book:<plate>); epi: names the land whose side-quest lines (EPI, THREADS 18.3) may add one
  // line after the page, never one about a friend the page already names.
  book: [
    { page: 'n_book_home' },
    { page: 'n_book_friends' },
    { page: 'n_book_coast', epi: 'c', skip: 'Vesper|Moth Mask' },
    { page: 'n_book_north', epi: 'f', skip: 'Glaciar|Great Hearth|ice dragon' },
    { page: 'n_book_moonfall', epi: 'm', skip: 'Hush' },
    { page: 'n_book_moon' },
    { page: 'n_book_lanternday' },
  ],

  // saves made by the old finale code in the middle of the climb never ran the arrival count or found the Case Book
  // clues the summit asks for (ENGINE REQUEST: act migrate, as A2B asked for Act II)
  migrate: [
    { if: 'stage>=n_stair choice c_vesper=friend !flag n5_vesper', then: ['trust friends +1', 'set n5_vesper'] },
    { if: 'stage>=n_stair choice f_glaciar=free !flag n5_glaciar', then: ['trust friends +1', 'set n5_glaciar'] },
    { if: 'stage>=n_stair choice m_hush=free !flag n5_hush', then: ['trust friends +1', 'set n5_hush'] },
    { if: 'stage>=n_stair !item n5_lantern', then: ['give n5_lantern'] },
    { if: 'stage>=n_clocks', then: ['clue n5_mem_grandpa'] },
    { if: 'stage>=n_rime', then: ['clue n5_oona_warm', 'clue n5_fourth_post'] },
    { if: { all: ['stage>=n_rime', { any: ['flag n_knows', 'flag f_page11', 'flag m_page11', 'flag dr_seen_m_moth'] }] },
      then: ['clue n5_her_name'] },
    { if: 'stage>=n_crown', then: ['clue n5_mem_quiet', 'clue n5_moon_lock', 'solve n5_wants'] },
    { if: 'stage>=n_nyxara clue n5_her_name', then: ['solve n5_reach'] },
  ],

  // no new power on the peak, so no new-power gates on old maps: the finale sends Ash back with errands instead
  // (N5S's q_n5_* quests and Act IV's m_leash)
  gates_min: 0,
})
